import assert from "node:assert/strict";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { fileURLToPath } from "node:url";
import electron from "electron";
import test from "node:test";

const execFileAsync = promisify(execFile);
const fixturePath = fileURLToPath(new URL("./fixtures/local-task-actions-electron.mjs", import.meta.url));

test("a locally created pending-review task exposes controlled Work actions without manual sync", {
  skip: process.env.ARCORBIT_ELECTRON_LOCAL_TASK_ACTIONS_TEST !== "1" && "set ARCORBIT_ELECTRON_LOCAL_TASK_ACTIONS_TEST=1 to run the Electron regression"
}, async () => {
  const env = { ...process.env, ELECTRON_DISABLE_SECURITY_WARNINGS: "true" };
  delete env.ELECTRON_RUN_AS_NODE;
  const { stdout } = await execFileAsync(electron, [fixturePath], { env, timeout: 10_000 });
  const result = JSON.parse(stdout.trim());

  assert.equal(result.task_visible, true);
  assert.equal(result.task_selected, true);
  assert.deepEqual(result.action_labels, ["确认可处理", "取消"]);
  assert.equal(result.manual_sync_used, false);
  assert.equal(result.create_call_count, 1);
  assert.deepEqual(result.update_call, ["task.update", {
    task_id: "W-LOCAL-1",
    state: "pending",
    expected_state: "pending_review"
  }]);
  assert.equal(result.automation_update_call_count, 0);
  assert.deepEqual(result.errors, []);
});
