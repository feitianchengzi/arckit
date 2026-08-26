import assert from "node:assert/strict";
import { EventEmitter } from "node:events";
import { readFile } from "node:fs/promises";
import test from "node:test";
import { mainWindowChromeOptions, mainWindowControlMode, mainWindowState, observeMainWindowState, performMainWindowAction } from "../src/main-window-controls.mjs";
import { initializeWindowControls } from "../desktop/renderer/window-controls.mjs";

class FakeWindow extends EventEmitter {
  constructor() {
    super();
    this.maximized = false;
    this.minimized = false;
    this.fullScreen = false;
    this.closed = false;
  }
  isDestroyed() { return false; }
  isMaximized() { return this.maximized; }
  isMinimized() { return this.minimized; }
  isFullScreen() { return this.fullScreen; }
  minimize() { this.minimized = true; this.emit("minimize"); }
  maximize() { this.maximized = true; this.emit("maximize"); }
  unmaximize() { this.maximized = false; this.emit("unmaximize"); }
  setFullScreen(value) { this.fullScreen = value; this.emit(value ? "enter-full-screen" : "leave-full-screen"); }
  close() { this.closed = true; }
}

class FakeElement {
  constructor() {
    this.listeners = new Map();
    this.attributes = new Map();
    this.classes = new Set();
    this.title = "";
    this.tabIndex = 0;
    this.classList = {
      toggle: (name, enabled) => enabled ? this.classes.add(name) : this.classes.delete(name)
    };
  }
  addEventListener(type, listener) { this.listeners.set(type, listener); }
  setAttribute(name, value) { this.attributes.set(name, value); }
  dispatch(type) { this.listeners.get(type)?.({ type }); }
}

test("window chrome uses native macOS traffic lights and frameless controls elsewhere", () => {
  assert.equal(mainWindowControlMode("darwin"), "native-macos");
  assert.deepEqual(mainWindowChromeOptions("darwin"), {
    titleBarStyle: "hidden",
    trafficLightPosition: { x: 14, y: 13 }
  });
  for (const platform of ["win32", "linux"]) {
    assert.equal(mainWindowControlMode(platform), "custom");
    assert.deepEqual(mainWindowChromeOptions(platform), { frame: false });
  }
});

test("main window actions minimize, toggle maximize and close only the supplied window", () => {
  const window = new FakeWindow();
  assert.deepEqual(mainWindowState(window), { maximized: false, minimized: false });
  assert.deepEqual(performMainWindowAction(window, "minimize"), { maximized: false, minimized: true });
  assert.deepEqual(performMainWindowAction(window, "toggle-maximize"), { maximized: true, minimized: true });
  assert.deepEqual(performMainWindowAction(window, "toggle-maximize"), { maximized: false, minimized: true });
  assert.deepEqual(performMainWindowAction(window, "close"), { closed: true });
  assert.equal(window.closed, true);
  assert.throws(() => performMainWindowAction(window, "inspect"), /Unsupported/);
});

test("main window state observation covers native maximize, minimize and fullscreen transitions", () => {
  const window = new FakeWindow();
  const states = [];
  const unsubscribe = observeMainWindowState(window, (state) => states.push(state));
  window.maximize();
  window.unmaximize();
  window.minimize();
  window.setFullScreen(true);
  window.setFullScreen(false);
  unsubscribe();
  window.emit("restore");
  assert.deepEqual(states, [
    { maximized: true, minimized: false },
    { maximized: false, minimized: false },
    { maximized: false, minimized: true },
    { maximized: true, minimized: true },
    { maximized: false, minimized: true }
  ]);
});

test("renderer titlebar controls call the bounded API and reflect maximize state", async () => {
  const closeButton = new FakeElement();
  const minimizeButton = new FakeElement();
  const maximizeButton = new FakeElement();
  const dragRegion = new FakeElement();
  const calls = [];
  let stateListener;
  let maximized = false;
  const api = {
    windowControlMode: "custom",
    getWindowState: async () => ({ maximized: false, minimized: false }),
    minimizeWindow: async () => { calls.push("minimize"); return { maximized: false, minimized: true }; },
    toggleMaximizeWindow: async () => { calls.push("toggle-maximize"); maximized = !maximized; return { maximized, minimized: false }; },
    closeWindow: async () => { calls.push("close"); return { closed: true }; },
    onWindowState(listener) { stateListener = listener; return () => calls.push("unsubscribe"); }
  };
  const unsubscribe = initializeWindowControls({ api, closeButton, minimizeButton, maximizeButton, dragRegion });
  await new Promise((resolve) => setImmediate(resolve));
  minimizeButton.dispatch("click");
  maximizeButton.dispatch("click");
  await new Promise((resolve) => setImmediate(resolve));
  assert.deepEqual(calls, ["minimize", "toggle-maximize"]);
  assert.equal(maximizeButton.attributes.get("aria-label"), "还原窗口");
  assert.equal(maximizeButton.classes.has("is-maximized"), true);
  dragRegion.dispatch("dblclick");
  await new Promise((resolve) => setImmediate(resolve));
  assert.equal(maximizeButton.attributes.get("aria-label"), "最大化窗口");
  stateListener({ maximized: false });
  assert.equal(maximizeButton.attributes.get("aria-label"), "最大化窗口");
  closeButton.dispatch("click");
  await new Promise((resolve) => setImmediate(resolve));
  assert.deepEqual(calls, ["minimize", "toggle-maximize", "toggle-maximize", "close"]);
  unsubscribe();
  assert.equal(calls.at(-1), "unsubscribe");
});

test("renderer leaves macOS window actions to native traffic lights", async () => {
  const closeButton = new FakeElement();
  const minimizeButton = new FakeElement();
  const maximizeButton = new FakeElement();
  const dragRegion = new FakeElement();
  const calls = [];
  const originalDocument = globalThis.document;
  globalThis.document = { documentElement: { dataset: {} } };
  try {
    initializeWindowControls({
      api: {
        windowControlMode: "native-macos",
        getWindowState: () => calls.push("state"),
        minimizeWindow: () => calls.push("minimize"),
        toggleMaximizeWindow: () => calls.push("toggle-maximize"),
        closeWindow: () => calls.push("close"),
        onWindowState: () => calls.push("observe")
      },
      closeButton,
      minimizeButton,
      maximizeButton,
      dragRegion
    });
    closeButton.dispatch("click");
    minimizeButton.dispatch("click");
    maximizeButton.dispatch("click");
    dragRegion.dispatch("dblclick");
    assert.deepEqual(calls, []);
    assert.equal(globalThis.document.documentElement.dataset.windowControlMode, "native-macos");
    for (const button of [closeButton, minimizeButton, maximizeButton]) {
      assert.equal(button.attributes.get("aria-hidden"), "true");
      assert.equal(button.tabIndex, -1);
    }
  } finally {
    globalThis.document = originalDocument;
  }
});

test("production window chrome branches by platform and exposes no generic Electron bridge", async () => {
  const [main, preload, renderer, html, styles] = await Promise.all([
    readFile(new URL("../desktop/main.mjs", import.meta.url), "utf8"),
    readFile(new URL("../desktop/preload.cjs", import.meta.url), "utf8"),
    readFile(new URL("../desktop/renderer/renderer.js", import.meta.url), "utf8"),
    readFile(new URL("../desktop/renderer/index.html", import.meta.url), "utf8"),
    readFile(new URL("../desktop/renderer/styles.css", import.meta.url), "utf8")
  ]);
  assert.match(main, /mainWindowChromeOptions\(process\.platform\)/);
  assert.match(preload, /windowControlMode: process\.platform === "darwin" \? "native-macos" : "custom"/);
  for (const channel of ["arckit:window-state", "arckit:window-minimize", "arckit:window-toggle-maximize", "arckit:window-close"]) {
    assert.match(main, new RegExp(channel));
    assert.match(preload, new RegExp(channel));
  }
  assert.match(main, /assertMainRenderer\(event\);[\s\S]*performMainWindowAction/);
  assert.match(renderer, /initializeWindowControls\(\{/);
  assert.match(html, /id="windowMinimizeButton"[\s\S]*id="windowMaximizeButton"[\s\S]*id="windowCloseButton"/);
  assert.doesNotMatch(html, /window-dots/);
  assert.match(styles, /\.window-controls[^}]*-webkit-app-region: no-drag/);
  assert.match(styles, /\.window-controls[^}]*display: none/);
  assert.match(styles, /data-window-control-mode="custom"[^}]*\.window-controls[^}]*display: flex/);
});
