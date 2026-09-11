import assert from "node:assert/strict";
import { EventEmitter } from "node:events";
import test from "node:test";
import { readFile } from "node:fs/promises";
import vm from "node:vm";
import * as transforms from "../desktop/image-viewer/state.mjs";
import { createImageViewer } from "../src/work-task-image-viewer.mjs";

test("managed image viewer isolates navigation, receives validated bytes, and saves only from its own window", async () => {
  const windows = [];
  const writes = [];
  let releaseReplacement;
  class FakeWebContents extends EventEmitter {
    constructor() { super(); this.messages = []; this.openHandler = null; }
    setWindowOpenHandler(handler) { this.openHandler = handler; }
    send(channel, payload) { this.messages.push([channel, payload]); }
  }
  class FakeBrowserWindow extends EventEmitter {
    constructor(options) {
      super();
      this.options = options;
      this.webContents = new FakeWebContents();
      this.destroyed = false;
      this.visible = false;
      windows.push(this);
    }
    loadFile(file) { this.file = file; this.webContents.emit("did-finish-load"); }
    show() { this.visible = true; }
    focus() { this.focused = true; }
    setTitle(value) { this.title = value; }
    isDestroyed() { return this.destroyed; }
    close() { this.destroyed = true; this.emit("closed"); }
  }
  const viewer = createImageViewer({
    BrowserWindow: FakeBrowserWindow,
    dialog: { showSaveDialog: async () => ({ canceled: false, filePath: "/tmp/saved.png" }) },
    writeFile: async (file, bytes) => writes.push([file, [...bytes]]),
    shellFile: "/app/image-viewer/index.html",
    preloadFile: "/app/image-viewer/preload.cjs",
    loadImage: async (input) => input.object_key === "replacement.png"
      ? new Promise((resolve) => { releaseReplacement = resolve; })
      : ({ bytes: new Uint8Array([1, 2, 3]), data_url: "data:image/png;base64,AQID", content_type: "image/png", file_name: "screen.png" })
  });

  assert.deepEqual(await viewer.open({ task_id: "7", attachment_id: "8", object_key: "workshop/screen.png" }), { opened: true });
  const window = windows[0];
  assert.equal(window.options.webPreferences.contextIsolation, true);
  assert.equal(window.options.webPreferences.nodeIntegration, false);
  assert.equal(window.options.webPreferences.sandbox, true);
  assert.deepEqual(window.webContents.openHandler(), { action: "deny" });
  let navigationPrevented = false;
  window.webContents.emit("will-navigate", { preventDefault: () => { navigationPrevented = true; } });
  assert.equal(navigationPrevented, true);
  assert.equal(window.visible, true);
  assert.equal(window.webContents.messages.at(-1)[0], "arckit:image-viewer-state");
  assert.match(window.webContents.messages.at(-1)[1].data_url, /^data:image\/png/);

  await assert.rejects(() => viewer.save({}), /managed ArcOrbit image viewer/);
  assert.deepEqual(await viewer.save(window.webContents), { saved: true, file_name: "saved.png" });
  assert.deepEqual(writes, [["/tmp/saved.png", [1, 2, 3]]]);

  const replacement = viewer.open({ object_key: "replacement.png" });
  await assert.rejects(() => viewer.save(window.webContents), /当前没有可保存/);
  releaseReplacement({ bytes: new Uint8Array([4]), data_url: "data:image/png;base64,BA==", content_type: "image/png", file_name: "replacement.png" });
  assert.deepEqual(await replacement, { opened: true });
});

test("canceling image Save As is not an error", async () => {
  let window;
  class FakeWindow extends EventEmitter {
    constructor(options) { super(); this.options = options; this.webContents = new EventEmitter(); this.webContents.setWindowOpenHandler = () => {}; this.webContents.send = () => {}; window = this; }
    loadFile() { this.webContents.emit("did-finish-load"); }
    show() {}
    focus() {}
    setTitle() {}
    isDestroyed() { return false; }
  }
  const viewer = createImageViewer({
    BrowserWindow: FakeWindow,
    dialog: { showSaveDialog: async () => ({ canceled: true }) },
    writeFile: async () => assert.fail("writeFile should not run"),
    shellFile: "index.html",
    preloadFile: "preload.cjs",
    loadImage: async () => ({ bytes: new Uint8Array([1]), data_url: "data:image/png;base64,AQ==", content_type: "image/png", file_name: "screen.png" })
  });
  await viewer.open({ object_key: "screen.png" });
  assert.deepEqual(await viewer.save(window.webContents), { saved: false, canceled: true });
});

test("a managed viewer can retry a failed image load without exposing the input to Renderer", async () => {
  let window;
  let attempts = 0;
  class FakeWindow extends EventEmitter {
    constructor() { super(); this.webContents = new EventEmitter(); this.webContents.setWindowOpenHandler = () => {}; this.webContents.send = () => {}; window = this; }
    loadFile() { this.webContents.emit("did-finish-load"); }
    show() {}
    focus() {}
    setTitle() {}
    isDestroyed() { return false; }
  }
  const viewer = createImageViewer({
    BrowserWindow: FakeWindow,
    dialog: {},
    writeFile: async () => {},
    shellFile: "index.html",
    preloadFile: "preload.cjs",
    loadImage: async (input) => {
      attempts += 1;
      if (attempts === 1) throw new Error("temporary failure");
      assert.equal(input.object_key, "folder/screen.png");
      return { bytes: new Uint8Array([1]), data_url: "data:image/png;base64,AQ==", content_type: "image/png", file_name: "screen.png" };
    }
  });
  await assert.rejects(() => viewer.open({ object_key: "folder/screen.png" }), /temporary failure/);
  await assert.rejects(() => viewer.retry({}), /managed ArcOrbit image viewer/);
  assert.deepEqual(await viewer.retry(window.webContents), { opened: true });
  assert.equal(attempts, 2);
});

test("a normal image viewer close remains immediate", async () => {
  const window = createCloseAwareWindow({ fullScreen: false });
  const viewer = createImageViewer({
    BrowserWindow: class { constructor() { return window; } },
    dialog: {},
    writeFile: async () => {},
    shellFile: "index.html",
    preloadFile: "preload.cjs",
    loadImage: loadedImage,
    platform: "darwin"
  });

  await viewer.open({ object_key: "screen.png" });
  window.close();

  assert.equal(window.destroyed, true);
  assert.equal(window.fullScreenExitRequests, 0);
});

test("a non-macOS fullscreen image viewer keeps the platform-native close behavior", async () => {
  const window = createCloseAwareWindow({ fullScreen: true });
  const viewer = createImageViewer({
    BrowserWindow: class { constructor() { return window; } },
    dialog: {},
    writeFile: async () => {},
    shellFile: "index.html",
    preloadFile: "preload.cjs",
    loadImage: loadedImage,
    platform: "win32"
  });

  await viewer.open({ object_key: "screen.png" });
  window.close();

  assert.equal(window.destroyed, true);
  assert.equal(window.fullScreenExitRequests, 0);
});

test("a macOS native-fullscreen image viewer exits fullscreen before one real close", async () => {
  const window = createCloseAwareWindow({ fullScreen: true });
  const parentWindow = createParentWindow();
  const viewer = createImageViewer({
    BrowserWindow: class { constructor() { return window; } },
    dialog: {},
    writeFile: async () => {},
    shellFile: "index.html",
    preloadFile: "preload.cjs",
    loadImage: loadedImage,
    getParentWindow: () => parentWindow,
    platform: "darwin"
  });

  await viewer.open({ object_key: "screen.png" });
  window.close();
  window.close();

  assert.equal(window.destroyed, false);
  assert.equal(window.fullScreenExitRequests, 1);
  assert.equal(window.acceptedCloseCount, 0);

  window.completeFullScreenExit();

  assert.equal(window.destroyed, true);
  assert.equal(window.acceptedCloseCount, 1);
  assert.equal(parentWindow.showCount, 0);
  assert.equal(parentWindow.focusCount, 0);
});

test("application shutdown force-destroys a viewer waiting to leave native fullscreen", async () => {
  const window = createCloseAwareWindow({ fullScreen: true });
  const parent = createParentWindow();
  const viewer = createImageViewer({
    BrowserWindow: class { constructor() { return window; } },
    dialog: {},
    writeFile: async () => {},
    shellFile: "index.html",
    preloadFile: "preload.cjs",
    loadImage: loadedImage,
    getParentWindow: () => parent,
    platform: "darwin"
  });

  await viewer.open({ object_key: "screen.png" });
  window.close();
  viewer.close({ force: true });
  window.completeFullScreenExit();

  assert.equal(window.destroyed, true);
  assert.equal(window.destroyCount, 1);
  assert.equal(window.acceptedCloseCount, 0);
  assert.equal(parent.showCount, 0);
  assert.equal(parent.focusCount, 0);
});

async function closeFixture({ fullScreen = true, parent = createParentWindow(), platform = "darwin" } = {}) {
  const window = createCloseAwareWindow({ fullScreen });
  const viewer = createImageViewer({
    BrowserWindow: class { constructor(options) { window.options = options; return window; } },
    dialog: {}, writeFile: async () => {}, shellFile: "index.html", preloadFile: "preload.cjs",
    loadImage: loadedImage, getParentWindow: () => parent, platform
  });
  await viewer.open({ object_key: "screen.png" });
  return { window, viewer, parent };
}

test("close ownership rejects foreign and stale senders without affecting the viewer", async () => {
  const { window, viewer } = await closeFixture({ fullScreen: false });
  assert.throws(() => viewer.requestClose({}), /managed ArcOrbit image viewer/);
  assert.equal(window.destroyed, false);
  assert.deepEqual(viewer.requestClose(window.webContents), { requested: true });
  assert.equal(window.destroyed, true);
  assert.throws(() => viewer.requestClose(window.webContents), /managed ArcOrbit image viewer/);
});

test("waiting for leave-full-screen cannot be bypassed when the native flag changes early", async () => {
  const { window, viewer, parent } = await closeFixture();
  viewer.requestClose(window.webContents);
  window.fullScreen = false;
  viewer.requestClose(window.webContents);
  window.close(); // Also cover native close-button requests, not just IPC.
  assert.equal(window.destroyed, false);
  assert.equal(window.fullScreenExitRequests, 1);
  assert.equal(parent.showCount, 0);
  window.completeFullScreenExit();
  assert.equal(window.acceptedCloseCount, 1);
  assert.equal(parent.showCount, 0);
  assert.equal(parent.focusCount, 0);
});

test("a non-fullscreen viewer never shows or focuses its fullscreen owner, even after closed", async () => {
  const parent = createParentWindow();
  parent.isFullScreen = () => true;
  parent.setFullScreen = () => assert.fail("must not toggle parent fullscreen");
  parent.webContents = { reload: () => assert.fail("must not reload parent") };
  const { window, viewer } = await closeFixture({ fullScreen: false, parent });
  // Delay actual destruction after accepting close to distinguish close from closed.
  window.close = () => {
    let prevented = false;
    window.emit("close", { preventDefault() { prevented = true; } });
    assert.equal(prevented, false);
  };
  viewer.requestClose(window.webContents);
  assert.equal(parent.showCount, 0);
  window.destroy();
  assert.equal(parent.showCount, 0);
  assert.equal(parent.focusCount, 0);
  assert.equal(parent.isFullScreen(), true);
});

test("closing a viewer does not mutate a destroyed owner", async () => {
  const { window, viewer, parent } = await closeFixture({ fullScreen: false });
  parent.destroyed = true;
  viewer.requestClose(window.webContents);
  assert.equal(parent.showCount, 0);
  assert.equal(parent.focusCount, 0);
});

test("macOS viewer construction and fullscreen lifecycle never attach to or mutate the owner", async () => {
  for (const ownerState of ["normal", "fullscreen", "minimized", "hidden"]) {
    const parent = createParentWindow();
    parent.isFullScreen = () => ownerState === "fullscreen";
    parent.isMinimized = () => ownerState === "minimized";
    parent.isVisible = () => ownerState !== "hidden";
    for (const action of ["show", "focus", "hide", "restore", "setBounds", "setSize", "setFullScreen", "setSimpleFullScreen"]) {
      parent[action] = () => assert.fail(`viewer must not call owner.${action} in ${ownerState}`);
    }
    parent.webContents = { reload: () => assert.fail("must not reload owner") };
    const { window, viewer } = await closeFixture({ fullScreen: false, parent });
    assert.equal(Object.hasOwn(window.options, "parent"), false);
    assert.equal(window.options.webPreferences.sandbox, true);
    assert.equal(parent.listenerCount("closed"), 1);
    window.fullScreen = true;
    window.emit("enter-full-screen");
    viewer.requestClose(window.webContents);
    assert.equal(window.fullScreenExitRequests, 1);
    assert.equal(window.destroyed, false);
    window.completeFullScreenExit();
    assert.equal(window.acceptedCloseCount, 1);
    assert.equal(parent.listenerCount("closed"), 0);
  }
});

test("owner destruction cancels a pending viewer close and removes its lifetime listener", async () => {
  const { window, viewer, parent } = await closeFixture();
  viewer.requestClose(window.webContents);
  parent.destroyed = true;
  parent.emit("closed");
  assert.equal(window.destroyCount, 1);
  assert.equal(window.listenerCount("leave-full-screen"), 0);
  assert.equal(parent.listenerCount("closed"), 0);
  window.completeFullScreenExit();
  assert.equal(parent.showCount, 0);
  assert.equal(parent.focusCount, 0);
  assert.equal(viewer.owns(window.webContents), false);
});

test("non-macOS viewers retain their native parent and close behavior", async () => {
  for (const platform of ["win32", "linux"]) {
    const { window, viewer, parent } = await closeFixture({ platform });
    assert.equal(window.options.parent, parent);
    assert.equal(parent.listenerCount("closed"), 0);
    viewer.requestClose(window.webContents);
    assert.equal(window.destroyed, true);
    assert.equal(window.fullScreenExitRequests, 0);
  }
});

test("Desktop and viewer do not retain temporary image diagnostic capture", async () => {
  const main = await readFile(new URL("../desktop/main.mjs", import.meta.url), "utf8");
  const service = await readFile(new URL("../src/work-task-image-viewer.mjs", import.meta.url), "utf8");
  assert.doesNotMatch(main, /image-viewer-diagnostics|imageViewerDiagnostics|ARCORBIT_IMAGE_VIEWER_TRACE_FILE|图片查看器诊断/);
  assert.doesNotMatch(service, /diagnostics|ARC_DEBUG/);
});

test("Escape runs actual Renderer and preload through the actual close IPC handler, never DOM close", async () => {
  const { window, viewer, parent } = await closeFixture();
  const mainFrame = {};
  window.webContents.mainFrame = mainFrame;
  let senderEvent = { sender: window.webContents, senderFrame: mainFrame };
  const main = await readFile(new URL("../desktop/main.mjs", import.meta.url), "utf8");
  const start = main.indexOf('  ipcMain.handle("arckit:image-viewer-close",');
  const end = main.indexOf('\n  });', start);
  assert.ok(start >= 0 && end > start);
  let closeHandler;
  vm.runInNewContext(main.slice(start, end + '\n  });'.length), {
    ipcMain: { handle(channel, handler) { assert.equal(channel, "arckit:image-viewer-close"); closeHandler = handler; } },
    imageViewer: viewer
  });
  assert.throws(() => closeHandler({ ...senderEvent, senderFrame: {} }), /main frame/);
  const foreignSender = { mainFrame: {} };
  assert.throws(() => closeHandler({ sender: foreignSender, senderFrame: foreignSender.mainFrame }), /managed ArcOrbit/);

  let api;
  let calls = 0;
  let rejectIpc = false;
  const preload = await readFile(new URL("../desktop/image-viewer/preload.cjs", import.meta.url), "utf8");
  vm.runInNewContext(preload, {
    require(name) {
      assert.equal(name, "electron");
      return {
        contextBridge: { exposeInMainWorld(name, value) { assert.equal(name, "arcOrbitImageViewer"); api = value; } },
        ipcRenderer: {
          on() {}, off() {},
          async invoke(channel, ...args) {
            assert.equal(channel, "arckit:image-viewer-close");
            assert.equal(args.length, 0); calls += 1;
            if (rejectIpc) throw new Error("private IPC details");
            return closeHandler(senderEvent);
          }
        }
      };
    }
  });
  const listeners = new Map();
  const ids = ["retryButton", "viewport", "image", "status", "statusMessage"];
  const elements = Object.fromEntries(ids.map(id => [id, { id, addEventListener() {}, classList: { toggle() {} } }]));
  const renderer = await readFile(new URL("../desktop/image-viewer/renderer.js", import.meta.url), "utf8");
  assert.doesNotMatch(renderer, /window\.close\(/);
  vm.runInNewContext(renderer.replace(/^import .*;\n/, ""), {
    ...transforms,
    window: {
      arcOrbitImageViewer: api,
      close() { assert.fail("sandbox DOM close bypasses controlled close"); },
      addEventListener(type, handler) { listeners.set(type, handler); }
    },
    document: { querySelectorAll(selector) { return selector === "[id]" ? Object.values(elements) : []; } }
  });
  let prevented = 0;
  let stopped = 0;
  const escape = repeat => ({ key: "Escape", repeat,
    preventDefault() { prevented += 1; }, stopPropagation() { stopped += 1; } });
  await listeners.get("keydown")(escape(true));
  assert.equal(calls, 0);
  rejectIpc = true;
  await listeners.get("keydown")(escape(false));
  assert.equal(elements.statusMessage.textContent, "关闭图片失败，请重试。");
  assert.equal(window.destroyed, false);
  rejectIpc = false;
  await listeners.get("keydown")(escape(false));
  assert.equal(window.destroyed, false);
  assert.equal(window.fullScreenExitRequests, 1);
  assert.equal(prevented, 3);
  assert.equal(stopped, 3);
  assert.equal(window.options.webPreferences.sandbox, true);
  assert.equal(window.options.webPreferences.contextIsolation, true);
  assert.equal(window.options.webPreferences.nodeIntegration, false);
  window.completeFullScreenExit();
  assert.equal(window.destroyed, true);
  assert.equal(parent.showCount, 0);
  assert.equal(parent.focusCount, 0);
});

function createCloseAwareWindow({ fullScreen }) {
  class FakeWebContents extends EventEmitter {
    setWindowOpenHandler() {}
    send() {}
  }
  class FakeWindow extends EventEmitter {
    constructor() {
      super();
      this.webContents = new FakeWebContents();
      this.destroyed = false;
      this.fullScreen = fullScreen;
      this.fullScreenExitRequests = 0;
      this.acceptedCloseCount = 0;
      this.destroyCount = 0;
    }
    loadFile() { this.webContents.emit("did-finish-load"); }
    show() {}
    focus() {}
    setTitle() {}
    isDestroyed() { return this.destroyed; }
    isFullScreen() { return this.fullScreen; }
    setFullScreen(value) {
      assert.equal(value, false);
      this.fullScreenExitRequests += 1;
    }
    completeFullScreenExit() {
      this.fullScreen = false;
      this.emit("leave-full-screen");
    }
    close() {
      let prevented = false;
      this.emit("close", { preventDefault: () => { prevented = true; } });
      if (prevented || this.destroyed) return;
      this.acceptedCloseCount += 1;
      this.destroyed = true;
      this.emit("closed");
    }
    destroy() {
      if (this.destroyed) return;
      this.destroyCount += 1;
      this.destroyed = true;
      this.emit("closed");
    }
  }
  return new FakeWindow();
}

async function loadedImage() {
  return {
    bytes: new Uint8Array([1]),
    data_url: "data:image/png;base64,AQ==",
    content_type: "image/png",
    file_name: "screen.png"
  };
}

function createParentWindow() {
  return Object.assign(new EventEmitter(), {
    destroyed: false,
    showCount: 0,
    focusCount: 0,
    isDestroyed() { return this.destroyed; },
    show() { this.showCount += 1; },
    focus() { this.focusCount += 1; }
  });
}
