export const PRODUCT_FEEDBACK_SDK_URL = process.env.ARCORBIT_FEEDBACK_SDK_URL || "https://feedback.feitianchengzi.com/sdk-v2/index.html?embed=web";
const SDK_ORIGIN = new URL(PRODUCT_FEEDBACK_SDK_URL).origin;
const TOOLBAR_HEIGHT = 58;
const READY_ATTEMPTS = 40;
const READY_INTERVAL_MS = 100;
const UNREAD_SIGNAL_INTERVAL_MS = 1000;
const PRODUCT_FEEDBACK_CONFIG_KEYS = [
  "feedbackV2Enabled",
  "feedbackV2AuthMode",
  "apiKey",
  "projectId",
  "customUserId",
  "gatewayUrl",
  "theme",
  "feedbackV2NotificationsEnabled"
];

export function createProductFeedbackSurface({ BrowserWindow, WebContentsView, shellFile, shellPreload, getParentWindow, onUnreadCount = () => {} }) {
  let window = null;
  let sdkView = null;
  let currentConfig = null;
  let currentMode = "submit";
  let configured = false;
  let shouldOpen = false;
  let unreadRevision = 0;
  let unreadSignalTimer = null;
  let readyGeneration = 0;

  async function open({ mode, config }) {
    const requiresFreshDocument = currentConfig !== null && !sameProductFeedbackConfig(currentConfig, config);
    currentMode = mode;
    currentConfig = { ...config };
    shouldOpen = true;
    ensureWindow();
    if (requiresFreshDocument) invalidateConfiguredDocument();
    window.show();
    window.focus();
    sendState({ status: "loading", mode: currentMode });
    if (requiresFreshDocument || !isProductFeedbackDocumentUrl(sdkView.webContents.getURL())) {
      await sdkView.webContents.loadURL(PRODUCT_FEEDBACK_SDK_URL);
    } else if (configured) {
      await switchMode(currentMode);
    } else {
      await configureAndOpen();
    }
  }

  async function prepare({ config }) {
    const requiresFreshDocument = currentConfig !== null && !sameProductFeedbackConfig(currentConfig, config);
    currentConfig = { ...config };
    shouldOpen = false;
    ensureWindow();
    if (requiresFreshDocument) invalidateConfiguredDocument();
    if (requiresFreshDocument || !isProductFeedbackDocumentUrl(sdkView.webContents.getURL())) {
      await sdkView.webContents.loadURL(PRODUCT_FEEDBACK_SDK_URL);
    } else if (configured) {
      await refreshUnreadCount();
    } else {
      await configureAndOpen();
    }
  }

  function invalidateConfiguredDocument() {
    readyGeneration += 1;
    configured = false;
    stopUnreadSignalMonitor();
  }

  function ensureWindow() {
    if (window && !window.isDestroyed()) return;
    window = new BrowserWindow({
      parent: getParentWindow?.() || undefined,
      width: 920,
      height: 720,
      minWidth: 720,
      minHeight: 560,
      show: false,
      title: "ArcOrbit 产品反馈",
      backgroundColor: "#f7f8fa",
      webPreferences: { preload: shellPreload, contextIsolation: true, nodeIntegration: false, sandbox: true }
    });
    window.loadFile(shellFile);
    sdkView = new WebContentsView({ webPreferences: { contextIsolation: true, nodeIntegration: false, sandbox: true } });
    configured = false;
    window.contentView.addChildView(sdkView);
    layout();
    window.on("resize", layout);
    window.on("closed", () => {
      readyGeneration += 1;
      currentConfig = null;
      configured = false;
      shouldOpen = false;
      stopUnreadSignalMonitor();
      sdkView?.webContents?.close?.();
      sdkView = null;
      window = null;
    });
    sdkView.webContents.setWindowOpenHandler(() => ({ action: "deny" }));
    sdkView.webContents.on("will-navigate", (event, url) => {
      if (!isAllowedProductFeedbackUrl(url)) event.preventDefault();
    });
    sdkView.webContents.on("did-fail-load", (_event, _code, _description, url, isMainFrame) => {
      if (isMainFrame && isAllowedProductFeedbackUrl(url)) sendState({ status: "error", code: "sdk_document_failed", mode: currentMode });
    });
    sdkView.webContents.on("did-finish-load", () => configureAndOpen().catch(() => {
      sendState({ status: "error", code: "sdk_not_ready", mode: currentMode });
    }));
  }

  function layout() {
    if (!window || !sdkView) return;
    const bounds = window.getContentBounds();
    sdkView.setBounds({ x: 0, y: TOOLBAR_HEIGHT, width: bounds.width, height: Math.max(0, bounds.height - TOOLBAR_HEIGHT) });
  }

  async function configureAndOpen() {
    if (!sdkView || !currentConfig) return;
    const generation = ++readyGeneration;
    for (let attempt = 0; attempt < READY_ATTEMPTS; attempt += 1) {
      if (generation !== readyGeneration || !sdkView || !currentConfig) return;
      const ready = await sdkView.webContents.executeJavaScript(`Boolean(window.FeedbackSDK && typeof window.FeedbackSDK.configure === "function" && typeof window.FeedbackSDK.openSubmit === "function" && typeof window.FeedbackSDK.openStatus === "function" && typeof window.FeedbackSDK.getUnreadCount === "function")`, true);
      if (ready) {
        const serialized = JSON.stringify(currentConfig);
        try {
          await sdkView.webContents.executeJavaScript(`Promise.resolve(window.FeedbackSDK.configure(${serialized}))`, true);
        } catch {
          sendState({ status: "error", code: "sdk_auth_failed", mode: currentMode });
          return;
        }
        configured = true;
        await installUnreadSignalListener();
        startUnreadSignalMonitor();
        await refreshUnreadCount();
        if (shouldOpen) {
          const openMethod = currentMode === "status" ? "openStatus" : "openSubmit";
          try {
            await sdkView.webContents.executeJavaScript(`window.FeedbackSDK.${openMethod}()`, true);
          } catch {
            sendState({ status: "error", code: "sdk_action_failed", mode: currentMode });
            return;
          }
        }
        sendState({ status: "ready", mode: currentMode });
        return;
      }
      await new Promise((resolve) => setTimeout(resolve, READY_INTERVAL_MS));
    }
    throw new Error("Feedback SDK readiness timed out.");
  }

  async function switchMode(mode) {
    currentMode = mode;
    if (!sdkView || !currentConfig) return { status: "closed" };
    const method = mode === "status" ? "openStatus" : "openSubmit";
    try {
      await sdkView.webContents.executeJavaScript(`window.FeedbackSDK.${method}()`, true);
      await refreshUnreadCount();
      sendState({ status: "ready", mode });
      return { status: "ready", mode };
    } catch {
      sendState({ status: "error", code: "sdk_not_ready", mode });
      return { status: "error", reason: "sdk_not_ready" };
    }
  }

  async function retry() {
    if (!sdkView || !currentConfig) return { status: "closed" };
    configured = false;
    stopUnreadSignalMonitor();
    sendState({ status: "loading", mode: currentMode });
    await sdkView.webContents.loadURL(PRODUCT_FEEDBACK_SDK_URL);
    return { status: "loading", mode: currentMode };
  }

  function close() {
    readyGeneration += 1;
    currentConfig = null;
    configured = false;
    shouldOpen = false;
    stopUnreadSignalMonitor();
    if (window && !window.isDestroyed()) window.close();
  }

  async function installUnreadSignalListener() {
    unreadRevision = Number(await sdkView.webContents.executeJavaScript(`(() => {
      const key = "__arcOrbitFeedbackUnreadSignal";
      if (!window[key]) {
        const signal = { revision: 0 };
        window.addEventListener("message", (event) => {
          if (event.origin !== window.location.origin || event.source !== window) return;
          if (event.data?.source !== "feedback-sdk-web" || event.data?.type !== "feedback-sdk:unread-changed") return;
          signal.revision += 1;
        });
        window[key] = signal;
      }
      return window[key].revision;
    })()`, true)) || 0;
  }

  function startUnreadSignalMonitor() {
    stopUnreadSignalMonitor();
    unreadSignalTimer = setInterval(async () => {
      if (!configured || !sdkView || !currentConfig) return;
      try {
        const revision = Number(await sdkView.webContents.executeJavaScript(`Number(window.__arcOrbitFeedbackUnreadSignal?.revision || 0)`, true)) || 0;
        if (revision > unreadRevision) {
          unreadRevision = revision;
          await refreshUnreadCount();
        }
      } catch {
        // The next document load or explicit retry restores the bounded listener.
      }
    }, UNREAD_SIGNAL_INTERVAL_MS);
    unreadSignalTimer.unref?.();
  }

  function stopUnreadSignalMonitor() {
    if (unreadSignalTimer) clearInterval(unreadSignalTimer);
    unreadSignalTimer = null;
    unreadRevision = 0;
  }

  async function refreshUnreadCount() {
    if (!configured || !sdkView) return 0;
    try {
      const value = await sdkView.webContents.executeJavaScript(`Promise.resolve(window.FeedbackSDK.getUnreadCount()).then((value) => Number(value) || 0)`, true);
      const count = Math.max(0, Math.trunc(Number(value) || 0));
      onUnreadCount(count);
      sendState({ status: "ready", mode: currentMode, unread_count: count });
      return count;
    } catch {
      // unread 计数是辅助能力，失败不得拖累会话状态：不 sendState error（否则 tab 被禁用），
      // 只回退 0。真正的 SDK 不可用由 configureAndOpen/switchMode 的独立 error 分支处理。
      onUnreadCount(0);
      return 0;
    }
  }

  function sendState(value) {
    if (window && !window.isDestroyed()) window.webContents.send("arckit:product-feedback-state", value);
  }

  return { open, prepare, switchMode, retry, close };
}

function isAllowedSdkProtocol(url) {
  // 生产强制 https；本地开发的回环地址允许 http（ARCKORBIT_FEEDBACK_SDK_URL）。
  return url.protocol === "https:" || (url.protocol === "http:" && isLoopbackHostname(url.hostname));
}

function isLoopbackHostname(hostname) {
  return hostname === "localhost" || hostname === "127.0.0.1" || hostname === "::1" || hostname === "[::1]";
}

// SDK 目录前缀（生产 /sdk-v2/、本地 /sdk/），SPA 子路由允许落在该前缀下。
const SDK_PATH_BASENAME = new URL(PRODUCT_FEEDBACK_SDK_URL).pathname.replace(/\/[^/]*$/, "");
const SDK_PATH_PREFIX = `${SDK_PATH_BASENAME}/`;

export function isAllowedProductFeedbackUrl(value) {
  try {
    const url = new URL(value);
    return url.origin === SDK_ORIGIN && isAllowedSdkProtocol(url);
  } catch {
    return false;
  }
}

export function isProductFeedbackDocumentUrl(value) {
  try {
    const url = new URL(value);
    return url.origin === SDK_ORIGIN
      && isAllowedSdkProtocol(url)
      && (url.pathname === SDK_PATH_BASENAME || url.pathname.startsWith(SDK_PATH_PREFIX))
      && url.searchParams.get("embed") === "web";
  } catch {
    return false;
  }
}

function sameProductFeedbackConfig(left, right) {
  return PRODUCT_FEEDBACK_CONFIG_KEYS.every((key) => Object.is(left?.[key], right?.[key]));
}
