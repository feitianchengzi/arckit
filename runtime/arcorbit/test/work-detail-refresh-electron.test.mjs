import assert from "node:assert/strict";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { fileURLToPath } from "node:url";
import electron from "electron";
import test from "node:test";

const execFileAsync = promisify(execFile);
const fixturePath = fileURLToPath(new URL("./fixtures/work-detail-refresh-electron.mjs", import.meta.url));

test("Work background refresh keeps comment and acceptance editor nodes for the selected task", {
  skip: process.env.ARCORBIT_ELECTRON_WORK_DETAIL_REFRESH_TEST !== "1" && "set ARCORBIT_ELECTRON_WORK_DETAIL_REFRESH_TEST=1 to run the focused Electron regression"
}, async () => {
  const env = {
    ...process.env,
    ELECTRON_DISABLE_SECURITY_WARNINGS: "true",
    ARCORBIT_WORK_DETAIL_REFRESH_FIXTURE: "1"
  };
  delete env.ELECTRON_RUN_AS_NODE;
  const { stdout } = await execFileAsync(electron, [fixturePath], { env, timeout: 40_000, maxBuffer: 1024 * 1024 });
  const result = JSON.parse(stdout.trim());

  assert.deepEqual(result.attachment, { same_node: true, value: "draft-comment", preview_loaded: true });
  for (const refresh of [result.automation, result.work_sync]) {
    assert.deepEqual(refresh.during, { same_node: true, value: "draft-comment", selected: "W-11" });
    assert.deepEqual(refresh.after, { same_node: true, value: "draft-comment", selected: "W-11" });
  }
  assert.deepEqual(result.comment_submit, { same_node: true, value: "" });
  assert.deepEqual(result.periodic.during, { same_node: true, value: "draft-acceptance", selected: "W-COMPLETED" });
  assert.deepEqual(result.periodic.after, { same_node: true, value: "draft-acceptance", selected: "W-COMPLETED" });
  assert.equal(result.accepted_removed_composer, true);
  assert.equal(result.calls.some(([name]) => name === "task.attachment.create"), true);
  assert.equal(result.calls.some(([name]) => name === "previewWorkTaskAttachment"), true);
  assert.deepEqual(result.errors, []);
});
