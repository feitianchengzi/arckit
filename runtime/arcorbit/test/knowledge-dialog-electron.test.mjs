import assert from "node:assert/strict";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { fileURLToPath } from "node:url";
import electron from "electron";
import test from "node:test";
import { electronFixtureArguments } from "./electron-fixture-launch.mjs";

const execFileAsync = promisify(execFile);
const fixturePath = fileURLToPath(new URL("./fixtures/knowledge-dialog-electron.mjs", import.meta.url));

test("knowledge dialog configures repos in a single two-view dialog without nested modals", async () => {
  const env = { ...process.env, ELECTRON_DISABLE_SECURITY_WARNINGS: "true" };
  delete env.ELECTRON_RUN_AS_NODE;
  const { stdout } = await execFileAsync(electron, electronFixtureArguments(fixturePath), {
    env,
    timeout: 20_000,
    maxBuffer: 1024 * 1024
  });
  const result = JSON.parse(stdout.trim());

  assert.equal(result.opened, true);
  assert.equal(result.listView.listVisible, true);
  assert.equal(result.listView.addHidden, true);
  assert.equal(result.listView.addLabel, "添加仓库");
  assert.equal(result.listView.projectPickerAbsent, true);

  assert.equal(result.addView.addVisible, true);
  assert.equal(result.addView.listHidden, true);
  assert.equal(result.addView.title, "添加代码仓库");
  assert.equal(result.addView.backVisible, true);
  assert.equal(result.addView.customerFocused, true);

  assert.equal(result.validationHolds, true);

  assert.equal(result.cancelReturnsToList.backToList, true);
  assert.equal(result.cancelReturnsToList.addLabel, "添加仓库");

  assert.equal(result.added.backToList, true);
  assert.equal(result.added.rows, 1);
  assert.equal(result.added.repoUrl, "https://github.com/customer/repo.git");
  assert.match(result.added.status, /仓库已添加/);

  assert.equal(result.armedLabel, "确认删除");
  assert.equal(result.deleted.rows, 0);
  assert.match(result.deleted.status, /仓库已删除/);

  assert.equal(result.closed.dialogGone, true);
  assert.deepEqual(result.rendererErrors, []);
});
