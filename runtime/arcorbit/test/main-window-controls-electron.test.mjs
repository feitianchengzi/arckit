import assert from "node:assert/strict";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { fileURLToPath } from "node:url";
import electron from "electron";
import test from "node:test";

const execFileAsync = promisify(execFile);
const fixturePath = fileURLToPath(new URL("./fixtures/window-controls-electron.mjs", import.meta.url));

test("platform-native ArcOrbit chrome performs real Electron window actions", {
  skip: process.env.ARCORBIT_ELECTRON_WINDOW_CONTROLS_TEST !== "1" && "set ARCORBIT_ELECTRON_WINDOW_CONTROLS_TEST=1 to run the real Electron window regression"
}, async () => {
  const env = { ...process.env, ELECTRON_DISABLE_SECURITY_WARNINGS: "true" };
  delete env.ELECTRON_RUN_AS_NODE;
  const { stdout } = await execFileAsync(electron, [fixturePath], { env, timeout: 20_000, maxBuffer: 1024 * 1024 });
  const result = JSON.parse(stdout.trim());
  assert.deepEqual(result.frame_content_delta, { width: 0, height: 0 });
  assert.equal(result.resizable, true);
  assert.equal(result.movable, true);
  if (process.platform === "darwin") {
    assert.equal(result.control_mode, "native-macos");
    assert.deepEqual(result.window_button_position, { x: 14, y: 13 });
    assert.equal(result.custom_controls_hidden, true);
    assert.equal(result.entered_full_screen, true);
    assert.equal(result.left_full_screen, true);
  } else {
    assert.equal(result.control_mode, "custom");
    assert.equal(result.maximized_label, "还原窗口");
    assert.equal(result.restored_label, "最大化窗口");
  }
});
