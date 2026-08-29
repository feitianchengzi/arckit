import assert from "node:assert/strict";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { fileURLToPath } from "node:url";
import electron from "electron";
import test from "node:test";

const execFileAsync = promisify(execFile);
const fixturePath = fileURLToPath(new URL("./fixtures/chat-stream-performance-electron.mjs", import.meta.url));

test("Chat streaming keeps reading position and session switching responsive under continuous deltas", {
  skip: process.env.ARCORBIT_ELECTRON_CHAT_STREAM_PERFORMANCE_TEST !== "1" && "set ARCORBIT_ELECTRON_CHAT_STREAM_PERFORMANCE_TEST=1 to run the Electron Chat stream regression"
}, async () => {
  const env = {
    ...process.env,
    ARCORBIT_CHAT_STREAM_PERFORMANCE_FIXTURE: "1",
    ELECTRON_DISABLE_SECURITY_WARNINGS: "true"
  };
  delete env.ELECTRON_RUN_AS_NODE;
  const { stdout } = await execFileAsync(electron, [fixturePath], { env, timeout: 15_000 });
  const result = JSON.parse(stdout.trim());

  assert.ok(result.stream.emitted_before_switch >= 30);
  assert.equal(result.stream.session_node_stable, true);
  assert.equal(result.stream.message_node_stable, true);
  assert.equal(result.stream.jump_visible, true);
  assert.ok(Math.abs(result.stream.scroll_min - result.stream.reading_top) < 2);
  assert.ok(result.stream.scroll_max - result.stream.scroll_min < 2, `reading position drifted by ${result.stream.scroll_max - result.stream.scroll_min}px`);
  assert.ok(result.switching.elapsed_ms < 80, `session switching took ${result.switching.elapsed_ms}ms`);
  assert.deepEqual({ target_active: result.switching.target_active, target_visible: result.switching.target_visible }, { target_active: true, target_visible: true });
  assert.equal(result.switching.target_node_stable, true);
  assert.ok(Math.abs(result.switching.restored_scroll_top - result.switching.expected_scroll_top) < 2);
  assert.ok(result.switching.scroll_max - result.switching.scroll_min < 2, `background session changed target reading position by ${result.switching.scroll_max - result.switching.scroll_min}px`);
  assert.equal(result.chat_snapshot_calls_during_stream, 0);
  assert.equal(result.chat_snapshot_calls_after_structural_event, 1);
});
