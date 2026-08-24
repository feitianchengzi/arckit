import assert from "node:assert/strict";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { fileURLToPath } from "node:url";
import electron from "electron";
import test from "node:test";

const execFileAsync = promisify(execFile);
const fixturePath = fileURLToPath(new URL("./fixtures/work-status-switch-performance-electron.mjs", import.meta.url));

test("Work status switching is immediate, generation-safe and windowed for 1000 rows", {
  skip: process.env.ARCORBIT_ELECTRON_WORK_STATUS_PERFORMANCE_TEST !== "1" && "set ARCORBIT_ELECTRON_WORK_STATUS_PERFORMANCE_TEST=1 to run the Electron Work status performance regression"
}, async () => {
  const env = { ...process.env, ELECTRON_DISABLE_SECURITY_WARNINGS: "true" };
  delete env.ELECTRON_RUN_AS_NODE;
  const { stdout } = await execFileAsync(electron, [fixturePath], { env, timeout: 15_000 });
  const result = JSON.parse(stdout.trim());

  assert.equal(result.immediate.completed_pressed, true);
  assert.equal(result.immediate.pending_pressed, false);
  assert.ok(result.immediate.elapsed_ms < 80, `status feedback took ${result.immediate.elapsed_ms}ms`);
  assert.equal(result.immediate.row_count, 0);
  assert.equal(result.immediate.loading_visible, true);
  assert.equal(result.completed_visible, true);
  assert.equal(result.switch_calls.filter((name) => name === "platformWorkQuery").length, 1);
  assert.equal(result.switch_calls.some((name) => /automation|auth|organization|member|feedback/i.test(name)), false);
  assert.deepEqual(result.rapid, { pending_pressed: true, accepted_visible: false, pending_visible: true });
  assert.deepEqual(result.same_key_cache, { new_visible: true, old_visible: false, loading_visible: true });
  assert.ok(result.scale.first_interactive_ms < 80, `1000-row first interactive frame took ${result.scale.first_interactive_ms}ms`);
  assert.equal(result.scale.rendered_rows, 80);
  assert.match(result.scale.pager_text, /1–80 \/ 1000/);
});
