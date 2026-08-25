import assert from "node:assert/strict";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { fileURLToPath } from "node:url";
import electron from "electron";
import test from "node:test";

const execFileAsync = promisify(execFile);
const fixturePath = fileURLToPath(new URL("./fixtures/task-replacement-sheet-electron.mjs", import.meta.url));

test("task replacement keeps the edit Sheet and draft through both failure stages", async () => {
  const env = { ...process.env, ELECTRON_DISABLE_SECURITY_WARNINGS: "true" };
  delete env.ELECTRON_RUN_AS_NODE;
  const { stdout } = await execFileAsync(electron, [fixturePath], { env, timeout: 20_000, maxBuffer: 1024 * 1024 });
  const result = JSON.parse(stdout.trim());

  assert.deepEqual(result.createFailure, {
    sheetOpen: true,
    projectId: "12",
    content: "Preserve this cross-product draft",
    state: "blocked",
    priority: "2",
    status: "Fixture target create failed",
    submitEnabled: true
  });
  assert.equal(result.deleteFailure.sheetOpen, true);
  assert.equal(result.deleteFailure.content, "Preserve this cross-product draft");
  assert.match(result.deleteFailure.status, /目标待办 W-12-NEW 已创建，源待办 W-11 尚未删除/);
  assert.match(result.deleteFailure.status, /重试不会再次创建目标待办/);
  assert.equal(result.deleteFailure.retryVisible, true);
  assert.equal(result.deleteFailure.keepVisible, true);
  assert.deepEqual(result.recovery, { sheetClosed: true, selectedProduct: "12" });
  assert.equal(result.calls.filter(([command]) => command === "task.replace_project").length, 2);
  assert.equal(result.calls.filter(([command]) => command === "task.replace_project.retry_delete").length, 1);
  assert.deepEqual(result.rendererErrors, []);
  assert.deepEqual(result.errors, []);
});
