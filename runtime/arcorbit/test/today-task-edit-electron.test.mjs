import assert from "node:assert/strict";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { fileURLToPath } from "node:url";
import electron from "electron";
import test from "node:test";
import { electronFixtureArguments } from "./electron-fixture-launch.mjs";

const execFileAsync = promisify(execFile);
const fixturePath = fileURLToPath(new URL("./fixtures/today-task-edit-electron.mjs", import.meta.url));

test("Today edits Work task content through the confirmed mutation and preserves context on failure", {
  skip: process.env.ARCORBIT_ELECTRON_TODAY_TASK_EDIT_TEST !== "1"
    && "set ARCORBIT_ELECTRON_TODAY_TASK_EDIT_TEST=1 to run the focused Electron regression"
}, async () => {
  const env = { ...process.env, ELECTRON_DISABLE_SECURITY_WARNINGS: "true" };
  delete env.ELECTRON_RUN_AS_NODE;
  const { stdout } = await execFileAsync(electron, electronFixtureArguments(fixturePath), {
    env,
    timeout: 20_000,
    maxBuffer: 1024 * 1024
  });
  const result = JSON.parse(stdout.trim());

  assert.equal(result.editButtonVisible, true);
  assert.equal(result.initialDraft, "Ready for acceptance check");
  assert.equal(result.failureSheetVisible, true);
  assert.match(result.failureStatus, /Fixture version conflict/);
  assert.equal(result.failureDraft, "Corrected in Today");
  assert.equal(result.selectedAfterFailure, result.selectedBefore);
  assert.equal(result.successSheetClosed, true);
  assert.equal(result.selectedAfterSuccess, result.selectedBefore);
  assert.match(result.detailAfterSuccess, /Corrected in Today/);
  assert.equal(result.calls.some(([command, input]) => command === "task.update"
    && input.task_id === "W-COMPLETED"
    && input.expected_state === "completed"
    && input.content === "Corrected in Today"
    && !Object.hasOwn(input, "state")), true);
  assert.deepEqual(result.errors, []);
});
