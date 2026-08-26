import assert from "node:assert/strict";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { fileURLToPath } from "node:url";
import electron from "electron";
import test from "node:test";
import { electronFixtureArguments } from "./electron-fixture-launch.mjs";

const execFileAsync = promisify(execFile);
const fixturePath = fileURLToPath(new URL("./fixtures/work-acceptance-selection-electron.mjs", import.meta.url));

async function runFixture(...args) {
  const env = { ...process.env, ELECTRON_DISABLE_SECURITY_WARNINGS: "true" };
  delete env.ELECTRON_RUN_AS_NODE;
  const { stdout } = await execFileAsync(electron, [...electronFixtureArguments(fixturePath), ...args], {
    env,
    timeout: 15_000,
    maxBuffer: 1024 * 1024
  });
  return JSON.parse(stdout.trim());
}

test("Work acceptance restores the adjacent task after an early Work Sync fallback", {
  skip: process.env.ARCORBIT_ELECTRON_WORK_ACCEPTANCE_SELECTION_TEST !== "1"
    && "set ARCORBIT_ELECTRON_WORK_ACCEPTANCE_SELECTION_TEST=1 to run the Electron acceptance selection regression"
}, async () => {
  const result = await runFixture();

  assert.equal(result.fallback_selection, "completed-newest");
  assert.equal(result.final_selection, "completed-middle");
  assert.equal(result.accepted_removed, true);
  assert.equal(result.calls.some(([name]) => name === "task.update"), true);
  assert.deepEqual(result.errors, []);
});

test("Work acceptance preserves a real row click after an early Work Sync fallback", {
  skip: process.env.ARCORBIT_ELECTRON_WORK_ACCEPTANCE_SELECTION_TEST !== "1"
    && "set ARCORBIT_ELECTRON_WORK_ACCEPTANCE_SELECTION_TEST=1 to run the Electron acceptance selection regression"
}, async () => {
  const result = await runFixture("--preserve-user-selection");

  assert.equal(result.fallback_selection, "completed-newest");
  assert.equal(result.user_selection, "completed-newest");
  assert.equal(result.final_selection, "completed-newest");
  assert.equal(result.accepted_removed, true);
  assert.deepEqual(result.errors, []);
});

test("Work acceptance preserves a Today product selection made while the action is pending", {
  skip: process.env.ARCORBIT_ELECTRON_WORK_ACCEPTANCE_SELECTION_TEST !== "1"
    && "set ARCORBIT_ELECTRON_WORK_ACCEPTANCE_SELECTION_TEST=1 to run the Electron acceptance selection regression"
}, async () => {
  const result = await runFixture("--preserve-product-selection");

  assert.equal(result.fallback_selection, "completed-newest");
  assert.equal(result.product_selection, "completed-newest");
  assert.equal(result.final_selection, "completed-newest");
  assert.equal(result.accepted_removed, true);
  assert.deepEqual(result.errors, []);
});

test("Work acceptance preserves a cross-product replacement target selected while the action is pending", {
  skip: process.env.ARCORBIT_ELECTRON_WORK_ACCEPTANCE_SELECTION_TEST !== "1"
    && "set ARCORBIT_ELECTRON_WORK_ACCEPTANCE_SELECTION_TEST=1 to run the Electron acceptance selection regression"
}, async () => {
  const result = await runFixture("--preserve-replacement-selection");

  assert.equal(result.fallback_selection, "completed-newest");
  assert.equal(result.replacement_selection, "W-12-NEW");
  assert.equal(result.replacement_fallback_candidate, "W-12-FALLBACK");
  assert.equal(result.final_selection, "W-12-NEW");
  assert.equal(result.accepted_removed, true);
  assert.equal(result.calls.some(([name]) => name === "task.replace_project.retry_delete"), true);
  assert.deepEqual(result.errors, []);
});

test("Work acceptance cannot restore a stale selection after Workshop logout", {
  skip: process.env.ARCORBIT_ELECTRON_WORK_ACCEPTANCE_SELECTION_TEST !== "1"
    && "set ARCORBIT_ELECTRON_WORK_ACCEPTANCE_SELECTION_TEST=1 to run the Electron acceptance selection regression"
}, async () => {
  const result = await runFixture("--logout-while-pending");

  assert.equal(result.fallback_selection, "completed-newest");
  assert.equal(result.work_queries_during_settings_wait, result.work_queries_before_stale_acceptance);
  assert.equal(result.logout_selection, "");
  assert.equal(result.final_selection, "");
  assert.equal(result.final_work_queries, result.work_queries_after_logout);
  assert.equal(result.accepted_removed, true);
  assert.deepEqual(result.errors, []);
});
