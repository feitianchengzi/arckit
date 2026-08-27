import assert from "node:assert/strict";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { fileURLToPath } from "node:url";
import electron from "electron";
import test from "node:test";

const execFileAsync = promisify(execFile);
const fixturePath = fileURLToPath(new URL("./fixtures/today-create-identity-electron.mjs", import.meta.url));

async function runFixture(mode) {
  const env = {
    ...process.env,
    ELECTRON_DISABLE_SECURITY_WARNINGS: "true",
    ARCORBIT_TODAY_CREATE_IDENTITY_MODE: mode
  };
  delete env.ELECTRON_RUN_AS_NODE;
  const { stdout } = await execFileAsync(electron, [fixturePath], { env, timeout: 10_000 });
  return JSON.parse(stdout.trim());
}

test("Today creates the first task with the selected project member id instead of the Nebula UUID", {
  skip: process.env.ARCORBIT_ELECTRON_TODAY_CREATE_IDENTITY_TEST !== "1" && "set ARCORBIT_ELECTRON_TODAY_CREATE_IDENTITY_TEST=1 to run the focused Electron regression"
}, async () => {
  const result = await runFixture("valid");
  assert.equal(result.action_label, "创建并交给 ArcOrbit");
  assert.equal(result.sheet_opened, true);
  assert.equal(result.sheet_closed_after_submit, true);
  assert.equal(result.post_submit_action_label, "开始自动执行");
  assert.deepEqual(result.create_calls, [["task.create", {
    project_id: "11",
    content: "First task from Today",
    state: "pending",
    executor_id: "7"
  }]]);
  assert.deepEqual(result.errors, []);
});

test("Today fails closed before opening the task sheet when the project member id is unresolved", {
  skip: process.env.ARCORBIT_ELECTRON_TODAY_CREATE_IDENTITY_TEST !== "1" && "set ARCORBIT_ELECTRON_TODAY_CREATE_IDENTITY_TEST=1 to run the focused Electron regression"
}, async () => {
  const result = await runFixture("missing");
  assert.equal(result.action_label, "创建并交给 ArcOrbit");
  assert.equal(result.sheet_opened, false);
  assert.deepEqual(result.create_calls, []);
  assert.match(result.toast, /无法确认当前用户在所选产品中的执行人身份/);
  assert.equal(result.errors.some((value) => value.includes("无法确认当前用户在所选产品中的执行人身份")), true);
});
