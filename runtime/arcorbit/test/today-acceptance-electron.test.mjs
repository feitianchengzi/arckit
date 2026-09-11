import assert from "node:assert/strict";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { fileURLToPath } from "node:url";
import electron from "electron";
import test from "node:test";
import { electronFixtureArguments } from "./electron-fixture-launch.mjs";

test("Today third column submits and displays independently stored issues in the real renderer", {
  skip: process.env.ARCORBIT_ELECTRON_TODAY_ACCEPTANCE_TEST !== "1" && "set ARCORBIT_ELECTRON_TODAY_ACCEPTANCE_TEST=1 to run Electron"
}, async () => {
  const env = { ...process.env };
  delete env.ELECTRON_RUN_AS_NODE;
  const { stdout } = await promisify(execFile)(electron, electronFixtureArguments(fileURLToPath(new URL("./fixtures/today-acceptance-electron.mjs", import.meta.url))), { env, timeout: 25000, maxBuffer: 1024 * 1024 });
  const result = JSON.parse(stdout.trim());
  assert.equal(result.submitted.visible, true);
  assert.equal(result.submitted.count, 1);
  assert.match(result.submitted.text, /Today 第三栏真实提交验收问题/);
  assert.match(result.updated, /running/);
  assert.match(result.updated, /正在验证第三栏/);
  assert.deepEqual(result.errors, []);
});
