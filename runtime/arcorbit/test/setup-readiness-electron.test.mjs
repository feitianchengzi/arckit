import assert from "node:assert/strict";
import { execFile } from "node:child_process";
import { mkdtemp, readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { promisify } from "node:util";
import { fileURLToPath } from "node:url";
import electron from "electron";
import test from "node:test";

const execFileAsync = promisify(execFile);
const fixturePath = fileURLToPath(new URL("./fixtures/setup-readiness-electron.mjs", import.meta.url));

test("Setup Readiness keeps full details optional, invalidates stale confirmation, and safely handles managed cleanup", {
  skip: process.env.ARCORBIT_ELECTRON_SETUP_TEST !== "1" && "set ARCORBIT_ELECTRON_SETUP_TEST=1 to run the real-render Setup regression"
}, async () => {
  const resultRoot = await mkdtemp(join(tmpdir(), "arcorbit-setup-electron-result-"));
  const resultPath = join(resultRoot, "result.json");
  const env = { ...process.env, ELECTRON_DISABLE_SECURITY_WARNINGS: "true", ARCORBIT_ELECTRON_SETUP_RESULT: resultPath };
  delete env.ELECTRON_RUN_AS_NODE;
  let result;
  try {
    let executionError;
    try {
      await execFileAsync(electron, [fixturePath], { env, timeout: 20_000, maxBuffer: 1024 * 1024 });
    } catch (error) {
      executionError = error;
    }
    const resultSource = await readFile(resultPath, "utf8").catch(() => "");
    if (!resultSource && executionError) throw executionError;
    if (!resultSource) throw new Error("Setup Electron fixture exited without writing a result.");
    result = JSON.parse(resultSource);
    if (result.error) throw new Error(result.error, { cause: executionError });
    if (executionError) throw executionError;
  } finally {
    await rm(resultRoot, { recursive: true, force: true });
  }

  assert.equal(result.codexMethodDefaultCount, 0);
  assert.equal(result.codexFlowDefaultCount, 0);
  assert.equal(result.codexInitialLoginDisabled, true);
  assert.equal(result.codexDeviceHidden, true);
  assert.equal(result.codexAccessTokenHidden, true);
  assert.equal(result.codexCancelVisibleWhileActive, true);
  assert.equal(result.codexCancelEnabledWhileActive, true);
  assert.match(result.codexActiveFeedback, /已等待 \d+ 秒/);
  assert.equal(result.codexCancelHiddenWhileRechecking, true);
  assert.equal(result.codexCancelDisabledWhileRechecking, true);
  assert.match(result.codexRecheckingFeedback, /正在复核 login status/);
  assert.match(result.codexRecheckingFeedback, /已等待 \d+ 秒/);
  assert.match(result.codexOwnerBlockerText, /CODEX_UPDATE_ACTIVE_TASKS/);
  assert.match(result.codexOwnerBlockerText, /AutomationEXEC-1/);
  assert.match(result.codexOwnerBlockerText, /ChatCHAT-1/);
  assert.equal(result.codexUpdateDisabledWhileOwnerBlocked, true);
  assert.equal(result.codexLoginEnabledAfterSecret, true);
  assert.equal(result.codexSecretClearedImmediately, true);
  assert.equal(result.codexReadyWithoutRestart, true);
  assert.equal(result.productionCodexMatrix.productionPreload, true);
  assert.deepEqual(result.productionCodexMatrix.authority, {
    unauthorizedSenderRejected: true,
    staleConfirmationRejected: true,
    replayRejected: true,
    loginMissingConfirmationRejected: true,
    loginIntentMismatchRejected: true,
    loginReplayRejected: true,
    wrongOperationRejected: true
  });
  assert.deepEqual(result.productionCodexMatrix.install, { status: "codex-action-required", codex: "selection-required", available: true, provenance: "standalone", operation: null, installer: { mode: "install-success", platform: "darwin", url: "https://chatgpt.com/codex/install.sh" } });
  assert.deepEqual(result.productionCodexMatrix.successfulRecheck, {
    status: "checking",
    stages: [
      { kind: "install", phase: "rechecking-executable", startedAtValid: true, cancellable: false },
      { kind: "install", phase: "rechecking-version", startedAtValid: true, cancellable: false },
      { kind: "install", phase: "rechecking-login-status", startedAtValid: true, cancellable: false },
      { kind: "install", phase: "rechecking-readiness", startedAtValid: true, cancellable: false }
    ],
    phases: ["rechecking-executable", "rechecking-version", "rechecking-login-status", "rechecking-readiness"],
    codexProbe: { available: true, command: "/fixture/.local/bin/codex", pathEntries: ["/fixture/.local/bin"], provenance: "standalone", summary: "codex fixture" },
    cancelRejected: true
  });
  assert.deepEqual(result.productionCodexMatrix.update, { status: "ready", codex: "ready", operation: null, installer: { mode: "update-success", platform: "darwin", url: "https://chatgpt.com/codex/install.sh" } });
  assert.deepEqual(result.productionCodexMatrix.ownerBlocked, {
    rejected: true,
    code: "CODEX_UPDATE_ACTIVE_TASKS",
    owners: [{ kind: "automation", id: "EXEC-IPC-1" }, { kind: "chat", id: "CHAT-IPC-1" }],
    installerCalls: 0
  });
  assert.deepEqual(result.productionCodexMatrix.browser, { status: "ready", codex: "ready", args: ["login"] });
  assert.deepEqual(result.productionCodexMatrix.device, {
    status: "ready",
    codex: "ready",
    args: ["login", "--device-auth"],
    challenge: { verification_url: "https://auth.openai.com/device", user_code: "ABCD-EFGH" }
  });
  assert.deepEqual(result.productionCodexMatrix.cancelled, { status: "login-failed", code: "OPERATION_CANCELLED", operation: null, rechecked: true });
  assert.deepEqual(result.productionCodexMatrix.timedOut, { status: "login-failed", code: "PROCESS_TIMEOUT", operation: null, rechecked: true });
  assert.deepEqual(result.productionCodexMatrix.failed, { status: "login-failed", code: "LOGIN_FAILED", operation: null, rechecked: true });
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
    ["codex-login-secret", { method: "api-key", secret_length: 14 }],
    ["apply", { planDigest: "plan-install-b" }],
    ["plan", ["/fixture/.codex/skills/arcforge-on-demand"]],
    ["plan", ["/fixture/.codex/skills/arcforge-on-demand"]],
    ["remove", { managedPaths: ["/fixture/.codex/skills/arcforge-on-demand"], confirmationDigest: "b".repeat(64) }]
  ]);
  assert.equal(result.calls.some(([kind]) => kind === "codex-cancel"), false);
});
