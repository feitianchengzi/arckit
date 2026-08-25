import assert from "node:assert/strict";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { fileURLToPath } from "node:url";
import electron from "electron";
import test from "node:test";

const execFileAsync = promisify(execFile);
const fixturePath = fileURLToPath(new URL("./fixtures/setup-readiness-electron.mjs", import.meta.url));

test("Setup Readiness keeps full details optional, invalidates stale confirmation, and safely handles managed cleanup", {
  skip: process.env.ARCORBIT_ELECTRON_SETUP_TEST !== "1" && "set ARCORBIT_ELECTRON_SETUP_TEST=1 to run the real-render Setup regression"
}, async () => {
  const env = { ...process.env, ELECTRON_DISABLE_SECURITY_WARNINGS: "true" };
  delete env.ELECTRON_RUN_AS_NODE;
  const { stdout } = await execFileAsync(electron, [fixturePath], { env, timeout: 20_000, maxBuffer: 1024 * 1024 });
  const result = JSON.parse(stdout.trim());

  assert.equal(result.planSummaryVisible, true);
  assert.match(result.planSummaryText, /项目绝对目标/);
  assert.match(result.planSummaryText, /\/fixture\/project/);
  assert.match(result.planSummaryText, /Codex 用户级写入/);
  assert.match(result.planSummaryText, /新增 1/);
  assert.match(result.planSummaryText, /uncertain 0/);
  assert.equal(result.initialApplyDisabled, true);
  assert.equal(result.enabledWithoutDetails, true);
  assert.equal(result.enabledWithDetailsOpen, true);
  assert.equal(result.enabledAfterDetailsClose, true);
  assert.equal(result.resetAfterPlanUpdate, true);
  assert.match(result.planUpdateHint, /安装计划已更新，请重新确认/);
  assert.equal(result.focusedAfterPlanUpdate, "setupPlanSummary");
  assert.match(result.confirmedHint, /已确认当前写入边界/);
  assert.equal(result.initialDisabled, true);
  assert.equal(result.cleanupPanelVisible, true);
  assert.equal(result.cleanupBeforeChecks, true);
  assert.equal(result.planCollapsed, true);
  assert.equal(result.selectedAfterSelectAll, 2);
  assert.equal(result.selectedButtonDisabled, false);
  assert.match(result.selectedButtonText, /所选（1）/);
  assert.equal(result.actionErrorVisible, true);
  assert.match(result.actionErrorText, /SETUP_ACTION_FAILED/);
  assert.match(result.actionErrorText, /fixture managed removal failure/);
  assert.equal(result.toastAboveSetup, true);
  assert.equal(result.setupHiddenAfterRemoval, true);
  assert.deepEqual(result.calls, [
    ["apply", { planDigest: "plan-install-b" }],
    ["plan", ["/fixture/.codex/skills/arcforge-on-demand"]],
    ["plan", ["/fixture/.codex/skills/arcforge-on-demand"]],
    ["remove", { managedPaths: ["/fixture/.codex/skills/arcforge-on-demand"], confirmationDigest: "b".repeat(64) }]
  ]);
});
