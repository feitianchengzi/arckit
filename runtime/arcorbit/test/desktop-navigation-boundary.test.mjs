import assert from "node:assert/strict";
import test from "node:test";
import { installMainWindowNavigationBoundary } from "../src/desktop-navigation-boundary.mjs";

test("main window denies child windows and navigation outside its renderer entry", () => {
  const listeners = new Map();
  let windowOpenHandler;
  const webContents = {
    setWindowOpenHandler(handler) { windowOpenHandler = handler; },
    on(name, handler) { listeners.set(name, handler); }
  };
  const rendererUrl = "file:///Applications/ArcOrbit/renderer/index.html";
  installMainWindowNavigationBoundary(webContents, rendererUrl);

  assert.deepEqual(windowOpenHandler({ url: "https://files.example.test/image.png" }), { action: "deny" });
  let prevented = false;
  listeners.get("will-navigate")({ preventDefault() { prevented = true; } }, "https://files.example.test/image.png");
  assert.equal(prevented, true);
  prevented = false;
  listeners.get("will-navigate")({ preventDefault() { prevented = true; } }, rendererUrl);
  assert.equal(prevented, false);
});
