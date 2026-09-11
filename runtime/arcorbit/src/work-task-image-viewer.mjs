import { basename, extname } from "node:path";

export function createImageViewer({ BrowserWindow, dialog, writeFile, shellFile, preloadFile, loadImage, getParentWindow = () => null, platform = process.platform }) {
  let window = null;
  let ready = false;
  let generation = 0;
  let state = { status: "idle" };
  let currentImage = null;
  let currentInput = null;
  let allowClose = false;
  let waitingForFullScreenExit = false;
  let finishFullScreenClose = null;

  async function open(input) {
    currentInput = { ...input };
    const requestGeneration = ++generation;
    ensureWindow();
    currentImage = null;
    state = { status: "loading", file_name: safeFileName(input?.file_name || input?.object_key) };
    sendState();
    window.show();
    window.focus();
    try {
      const image = await loadImage(input);
      if (requestGeneration !== generation || !window || window.isDestroyed()) return { opened: false, stale: true };
      currentImage = {
        bytes: image.bytes,
        data_url: image.data_url,
        content_type: image.content_type,
        file_name: safeFileName(image.file_name || input?.object_key)
      };
      state = { status: "ready", file_name: currentImage.file_name, data_url: currentImage.data_url };
      window.setTitle?.(`${currentImage.file_name} · ArcOrbit`);
      sendState();
      return { opened: true };
    } catch (error) {
      if (requestGeneration !== generation || !window || window.isDestroyed()) return { opened: false, stale: true };
      currentImage = null;
      state = { status: "error", file_name: safeFileName(input?.file_name || input?.object_key), message: publicImageError(error) };
      sendState();
      throw error;
    }
  }

  async function retry(sender) {
    assertViewerSender(sender);
    if (!currentInput) throw new Error("当前没有可重试的图片。");
    return open(currentInput);
  }

  async function save(sender) {
    assertViewerSender(sender);
    if (!currentImage?.bytes) throw new Error("当前没有可保存的图片。");
    const extension = extname(currentImage.file_name).replace(/^\./, "");
    const result = await dialog.showSaveDialog(window, {
      title: "另存图片",
      defaultPath: currentImage.file_name,
      ...(extension ? { filters: [{ name: "Image", extensions: [extension] }] } : {})
    });
    if (result.canceled || !result.filePath) return { saved: false, canceled: true };
    await writeFile(result.filePath, currentImage.bytes);
    return { saved: true, file_name: basename(result.filePath) };
  }

  function owns(sender) {
    return Boolean(window && !window.isDestroyed() && sender === window.webContents);
  }

  function requestClose(sender) {
    assertViewerSender(sender);
    close();
    return { requested: true };
  }

  function close({ force = false } = {}) {
    generation += 1;
    if (!window || window.isDestroyed()) return;
    if (!force) {
      if (waitingForFullScreenExit) return;
      window.close();
      return;
    }
    allowClose = true;
    clearPendingFullScreenClose();
    if (typeof window.destroy === "function") window.destroy();
    else window.close();
  }

  function ensureWindow() {
    if (window && !window.isDestroyed()) return;
    ready = false;
    allowClose = false;
    waitingForFullScreenExit = false;
    finishFullScreenClose = null;
    const parentWindow = getParentWindow?.() || null;
    window = new BrowserWindow({
      // macOS native child windows participate in their owner's ordering/lifecycle.
      // Keep the independently fullscreenable viewer out of that native hierarchy.
      ...(platform !== "darwin" && parentWindow ? { parent: parentWindow } : {}),
      width: 980,
      height: 760,
      minWidth: 560,
      minHeight: 420,
      show: false,
      title: "图片 · ArcOrbit",
      backgroundColor: "#eef0f4",
      webPreferences: { preload: preloadFile, contextIsolation: true, nodeIntegration: false, sandbox: true }
    });
    window.webContents.setWindowOpenHandler(() => ({ action: "deny" }));
    window.webContents.on("will-navigate", (event) => event.preventDefault());
    window.webContents.on("did-finish-load", () => {
      ready = true;
      sendState();
    });
    window.on("close", (event) => {
      if (allowClose || platform !== "darwin") return;
      // The native fullscreen flag can change before the completion event.
      if (waitingForFullScreenExit) {
        event.preventDefault();
        return;
      }
      if (!window?.isFullScreen?.()) return;
      event.preventDefault();
      waitingForFullScreenExit = true;
      const closingWindow = window;
      finishFullScreenClose = () => {
        if (window !== closingWindow || closingWindow.isDestroyed()) return;
        finishFullScreenClose = null;
        waitingForFullScreenExit = false;
        allowClose = true;
        closingWindow.close();
      };
      closingWindow.once("leave-full-screen", finishFullScreenClose);
      closingWindow.setFullScreen(false);
    });
    window.on("closed", () => {
      parentWindow?.removeListener?.("closed", closeWithOwner);
      generation += 1;
      clearPendingFullScreenClose();
      allowClose = false;
      ready = false;
      currentImage = null;
      currentInput = null;
      state = { status: "idle" };
      window = null;
      // AppKit owns activation after close. Never show/focus/resize the owner:
      // it may still be fullscreen, minimized, hidden, or in a different Space.
    });
    const ownedWindow = window;
    const closeWithOwner = () => {
      if (window === ownedWindow) close({ force: true });
    };
    // Retain one-way application ownership without a native parent relationship.
    // The owner disappearing closes its viewer; closing the viewer never changes it.
    if (platform === "darwin") parentWindow?.once?.("closed", closeWithOwner);
    void window.loadFile(shellFile);
  }

  function sendState() {
    if (ready && window && !window.isDestroyed()) window.webContents.send("arckit:image-viewer-state", state);
  }

  function clearPendingFullScreenClose() {
    if (finishFullScreenClose && window && !window.isDestroyed()) {
      window.removeListener("leave-full-screen", finishFullScreenClose);
    }
    finishFullScreenClose = null;
    waitingForFullScreenExit = false;
  }

  function assertViewerSender(sender) {
    if (!owns(sender)) throw new Error("Image actions are only available from the managed ArcOrbit image viewer.");
  }

  return { open, retry, save, owns, close, requestClose };
}

function safeFileName(value) {
  const raw = String(value || "comment-image").split(/[\\/]/).pop() || "comment-image";
  let decoded = raw;
  try { decoded = decodeURIComponent(raw); } catch {}
  return decoded.replace(/[\u0000-\u001f\u007f<>:\"|?*]/g, "").slice(0, 180) || "comment-image";
}

function publicImageError(error) {
  const message = String(error?.message || "图片不可用。");
  return message.slice(0, 500);
}
