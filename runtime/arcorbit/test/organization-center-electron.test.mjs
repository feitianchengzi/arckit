import assert from "node:assert/strict";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { fileURLToPath } from "node:url";
import electron from "electron";
import test from "node:test";

const execFileAsync = promisify(execFile);
const fixturePath = fileURLToPath(new URL("./fixtures/organization-center-electron.mjs", import.meta.url));

test("production Organization Center keeps governance independent and invitations project-bound", {
  skip: process.env.ARCORBIT_ELECTRON_ORGANIZATION_TEST !== "1" && "set ARCORBIT_ELECTRON_ORGANIZATION_TEST=1 to run the interactive Electron regression"
}, async () => {
  const env = { ...process.env, ELECTRON_DISABLE_SECURITY_WARNINGS: "true" };
  delete env.ELECTRON_RUN_AS_NODE;
  const { stdout } = await execFileAsync(electron, [fixturePath], { env, timeout: 20_000, maxBuffer: 1024 * 1024 });
  const result = JSON.parse(stdout.trim());
  assert.equal(result.initialHeading, "飞天橙子");
  assert.equal(result.matrixRows, 2);
  assert.match(result.memberText, /为何这里没有项目邀请/);
  assert.match(result.memberText, /已有项目关系/);
  assert.equal(result.memberProjectHasInvite, false);
  assert.equal(result.inviteFormTitle, "邀请加入 ArcOrbit");
  assert.equal(result.inviteResultTitle, "项目邀请已生成 · ArcOrbit");
  assert.match(result.inviteResultText, /不绑定某位成员/);
  assert.match(result.inviteResultLead, /不支持邀请历史、再次查看或撤销/);
  assert.equal(result.editHasOrganizationMutation, false);
  assert.equal(result.editScopeIsReadonly, true);
  assert.equal(result.worksetChoices, 3);
  assert.equal(result.calls.some(([command, input]) => command === "project.invite" && input.project_id === "11"), true);
  assert.equal(result.calls.some(([command, input]) => command === "project.join" && input.invite_code === "JOIN-CODE"), true);
  assert.equal(result.calls.some(([command]) => command === "updateWorkset"), true);
  assert.deepEqual(result.errors, []);
});
