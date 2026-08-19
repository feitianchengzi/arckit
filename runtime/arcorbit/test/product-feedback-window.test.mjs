import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import {
  createProductFeedbackSurface,
  isAllowedProductFeedbackUrl,
  isProductFeedbackDocumentUrl,
  PRODUCT_FEEDBACK_SDK_URL
} from "../src/product-feedback-window.mjs";

const windowModulePath = new URL("../src/product-feedback-window.mjs", import.meta.url);
const serviceModulePath = new URL("../src/product-feedback-service.mjs", import.meta.url);
const mainPreloadPath = new URL("../desktop/preload.cjs", import.meta.url);
const shellPreloadPath = new URL("../desktop/product-feedback/preload.cjs", import.meta.url);

test("product feedback remote surface only accepts the fixed HTTPS SDK origin", () => {
  assert.equal(PRODUCT_FEEDBACK_SDK_URL, "https://feedback.feitianchengzi.com/sdk-v2/index.html?embed=web");
  assert.equal(isAllowedProductFeedbackUrl(PRODUCT_FEEDBACK_SDK_URL), true);
  assert.equal(isAllowedProductFeedbackUrl("https://feedback.feitianchengzi.com/another-path"), true);
  assert.equal(isAllowedProductFeedbackUrl("http://feedback.feitianchengzi.com/sdk-v2/index.html"), false);
  assert.equal(isAllowedProductFeedbackUrl("https://feedback.feitianchengzi.com.evil.test/sdk-v2/index.html"), false);
  assert.equal(isAllowedProductFeedbackUrl("javascript:alert(1)"), false);
  assert.equal(isProductFeedbackDocumentUrl(PRODUCT_FEEDBACK_SDK_URL), true);
  assert.equal(isProductFeedbackDocumentUrl("https://feedback.feitianchengzi.com/sdk-v2/submit?embed=web"), true);
  assert.equal(isProductFeedbackDocumentUrl("https://feedback.feitianchengzi.com/sdk-v2/status/42?embed=web"), true);
  assert.equal(isProductFeedbackDocumentUrl("https://feedback.feitianchengzi.com/sdk-v2/submit"), false);
  assert.equal(isProductFeedbackDocumentUrl("https://feedback.feitianchengzi.com/another-path?embed=web"), false);
});

test("feedback IPC and remote WebContents stay bounded", async () => {
  const [windowSource, serviceSource, mainPreload, shellPreload] = await Promise.all([
    readFile(windowModulePath, "utf8"),
    readFile(serviceModulePath, "utf8"),
    readFile(mainPreloadPath, "utf8"),
    readFile(shellPreloadPath, "utf8")
  ]);
  assert.match(windowSource, /new WebContentsView\(\{ webPreferences: \{ contextIsolation: true, nodeIntegration: false, sandbox: true \} \}\)/);
  assert.match(windowSource, /setWindowOpenHandler\(\(\) => \(\{ action: "deny" \}\)\)/);
  assert.match(windowSource, /if \(!isAllowedProductFeedbackUrl\(url\)\) event\.preventDefault\(\)/);
  assert.match(windowSource, /event\.origin !== window\.location\.origin \|\| event\.source !== window/);
  assert.match(windowSource, /event\.data\?\.source !== "feedback-sdk-web" \|\| event\.data\?\.type !== "feedback-sdk:unread-changed"/);
  assert.match(windowSource, /FeedbackSDK\.getUnreadCount\(\)/);
  assert.match(serviceSource, /feedbackV2AuthMode: "apiKey"/);
  assert.match(serviceSource, /feedbackV2NotificationsEnabled: true/);
  assert.match(serviceSource, /ARCORBIT_FEEDBACK_PROJECT_ID = 107/);
  assert.match(serviceSource, /credential_strategy: "bundled-static"/);
  assert.doesNotMatch(serviceSource, /session:/);
  assert.match(mainPreload, /getProductFeedbackStatus/);
  assert.doesNotMatch(mainPreload, /saveProductFeedbackConfig|clearProductFeedbackConfig/);
  assert.doesNotMatch(mainPreload, /product-feedback-mode|product-feedback-retry|product-feedback-close/);
  assert.match(shellPreload, /product-feedback-mode/);
  assert.match(shellPreload, /product-feedback-retry/);
  assert.match(shellPreload, /product-feedback-close/);
  assert.doesNotMatch(`${mainPreload}\n${shellPreload}`, /\bfetch\s*\(|executeJavaScript|loadURL/);
});

test("one healthy feedback surface preserves routed drafts and only reloads for retry or identity change", async () => {
  const windows = [];
  const views = [];
  const unreadCounts = [];
  class FakeBrowserWindow {
    constructor(options) {
      this.options = options;
      this.handlers = new Map();
      this.messages = [];
      this.destroyed = false;
      this.contentView = { addChildView: (view) => { this.view = view; } };
      this.webContents = { send: (...args) => this.messages.push(args) };
      windows.push(this);
    }
    loadFile(value) { this.shellFile = value; }
    show() {}
    focus() {}
    getContentBounds() { return { width: 920, height: 720 }; }
    on(name, listener) { this.handlers.set(name, listener); }
    isDestroyed() { return this.destroyed; }
    close() { this.destroyed = true; this.handlers.get("closed")?.(); }
  }
  class FakeWebContentsView {
    constructor(options) {
      this.options = options;
      this.bounds = null;
      this.webContents = new FakeWebContents();
      views.push(this);
    }
    setBounds(value) { this.bounds = value; }
  }
  class FakeWebContents {
    constructor() {
      this.url = "";
      this.handlers = new Map();
      this.scripts = [];
      this.loadCalls = [];
      this.draft = null;
    }
    getURL() { return this.url; }
    async loadURL(value) {
      this.loadCalls.push(value);
      this.url = value;
      this.draft = null;
    }
    setWindowOpenHandler(listener) { this.windowOpenHandler = listener; }
    on(name, listener) { this.handlers.set(name, listener); }
    async executeJavaScript(source) {
      this.scripts.push(source);
      if (source.startsWith("Boolean(")) return true;
      if (source.includes("__arcOrbitFeedbackUnreadSignal")) return 0;
      if (source.includes("FeedbackSDK.getUnreadCount")) return 5;
      if (source.startsWith("window.FeedbackSDK.openSubmit")) this.url = "https://feedback.feitianchengzi.com/sdk-v2/submit?embed=web";
      if (source.startsWith("window.FeedbackSDK.openStatus")) this.url = "https://feedback.feitianchengzi.com/sdk-v2/status?embed=web";
      return undefined;
    }
    close() {}
  }

  const surface = createProductFeedbackSurface({
    BrowserWindow: FakeBrowserWindow,
    WebContentsView: FakeWebContentsView,
    shellFile: "/local/product-feedback/index.html",
    shellPreload: "/local/product-feedback/preload.cjs",
    getParentWindow: () => null,
    onUnreadCount: (count) => unreadCounts.push(count)
  });
  const config = {
    feedbackV2Enabled: true,
    feedbackV2AuthMode: "apiKey",
    apiKey: "test-key",
    projectId: 42,
    customUserId: "731",
    gatewayUrl: "https://api.feitianchengzi.com",
    theme: "system",
    feedbackV2NotificationsEnabled: false
  };
  await surface.open({ mode: "submit", config });
  assert.equal(windows.length, 1);
  assert.equal(views.length, 1);
  assert.deepEqual(views[0].options, { webPreferences: { contextIsolation: true, nodeIntegration: false, sandbox: true } });
  assert.equal(views[0].webContents.windowOpenHandler().action, "deny");
  views[0].webContents.handlers.get("did-finish-load")();
  await new Promise((resolve) => setImmediate(resolve));
  assert.equal(views[0].webContents.scripts.filter((source) => source.startsWith("Promise.resolve(window.FeedbackSDK.configure")).length, 1);
  assert.equal(views[0].webContents.scripts.filter((source) => source.startsWith("window.FeedbackSDK.openSubmit")).length, 1);
  assert.deepEqual(unreadCounts, [5]);
  assert.deepEqual(views[0].webContents.loadCalls, [PRODUCT_FEEDBACK_SDK_URL]);

  views[0].webContents.draft = "typed feedback draft";
  await surface.prepare({ config });
  assert.equal(views[0].webContents.draft, "typed feedback draft");
  assert.deepEqual(views[0].webContents.loadCalls, [PRODUCT_FEEDBACK_SDK_URL]);
  assert.equal(views[0].webContents.scripts.filter((source) => source.startsWith("Promise.resolve(window.FeedbackSDK.configure")).length, 1);

  await surface.open({ mode: "status", config });
  assert.equal(windows.length, 1);
  assert.equal(views.length, 1);
  assert.equal(views[0].webContents.scripts.filter((source) => source.startsWith("Promise.resolve(window.FeedbackSDK.configure")).length, 1);
  assert.equal(views[0].webContents.scripts.filter((source) => source.startsWith("window.FeedbackSDK.openStatus")).length, 1);
  assert.equal(views[0].webContents.draft, "typed feedback draft");
  assert.deepEqual(views[0].webContents.loadCalls, [PRODUCT_FEEDBACK_SDK_URL]);
  assert.deepEqual(unreadCounts, [5, 5, 5]);

  await surface.retry();
  assert.equal(views[0].webContents.draft, null);
  assert.deepEqual(views[0].webContents.loadCalls, [PRODUCT_FEEDBACK_SDK_URL, PRODUCT_FEEDBACK_SDK_URL]);
  views[0].webContents.handlers.get("did-finish-load")();
  await new Promise((resolve) => setImmediate(resolve));
  views[0].webContents.draft = "old account draft";
  await surface.prepare({ config: { ...config, customUserId: "other-user" } });
  assert.equal(views[0].webContents.draft, null);
  assert.deepEqual(views[0].webContents.loadCalls, [PRODUCT_FEEDBACK_SDK_URL, PRODUCT_FEEDBACK_SDK_URL, PRODUCT_FEEDBACK_SDK_URL]);
  surface.close();
});
