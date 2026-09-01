import assert from "node:assert/strict";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { fileURLToPath } from "node:url";
import electron from "electron";
import test from "node:test";

const execFileAsync = promisify(execFile);
const fixturePath = fileURLToPath(new URL("./fixtures/chat-content-overflow-electron.mjs", import.meta.url));

test("Chat constrains long structured content to its viewport and scrolls the code viewer on both axes", {
  skip: process.env.ARCORBIT_ELECTRON_CHAT_CONTENT_OVERFLOW_TEST !== "1" && "set ARCORBIT_ELECTRON_CHAT_CONTENT_OVERFLOW_TEST=1 to run the Electron Chat overflow regression"
}, async () => {
  const env = {
    ...process.env,
    ARCORBIT_CHAT_CONTENT_OVERFLOW_FIXTURE: "1",
    ELECTRON_DISABLE_SECURITY_WARNINGS: "true"
  };
  delete env.ELECTRON_RUN_AS_NODE;
  const { stdout } = await execFileAsync(electron, [fixturePath], { env, timeout: 15_000 });
  const result = JSON.parse(stdout.trim());

  for (const [name, measurement] of Object.entries({
    viewport: result.viewport,
    view_host: result.view_host,
    chat_view: result.chat_view,
    workspace: result.workspace,
    main: result.main,
    transcript: result.transcript
  })) {
    assert.ok(measurement.scroll_width <= measurement.client_width + 1, `${name} expanded from ${measurement.client_width}px to ${measurement.scroll_width}px`);
  }
  assert.equal(result.message_within_transcript, true);
  assert.equal(result.content_within_message, true);
  assert.equal(result.block_within_content, true);
  assert.ok(result.viewer.scroll_width > result.viewer.client_width, "code viewer should own horizontal overflow");
  assert.ok(result.viewer.scroll_height > result.viewer.client_height, "code viewer should own vertical overflow");
  assert.equal(result.viewer.overflow_x, "auto");
  assert.equal(result.viewer.overflow_y, "auto");
  assert.equal(result.viewer.initial_left, 0);
  assert.equal(result.viewer.initial_top, 0);
  assert.ok(result.viewer.scrolled_left > 0);
  assert.ok(result.viewer.scrolled_top > 0);
});
