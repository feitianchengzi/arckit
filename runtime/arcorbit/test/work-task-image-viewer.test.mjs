import assert from "node:assert/strict";
import { EventEmitter } from "node:events";
import test from "node:test";
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
