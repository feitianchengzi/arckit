import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const rendererPath = new URL("../desktop/renderer/renderer.js", import.meta.url);
const rendererHtmlPath = new URL("../desktop/renderer/index.html", import.meta.url);
const rendererStylesPath = new URL("../desktop/renderer/styles.css", import.meta.url);
const desktopMainPath = new URL("../desktop/main.mjs", import.meta.url);
const desktopPreloadPath = new URL("../desktop/preload.cjs", import.meta.url);

test("desktop primary surface is the project-sourced automation Command Center", async () => {
  const [source, html, styles] = await Promise.all([
    readFile(rendererPath, "utf8"),
    readFile(rendererHtmlPath, "utf8"),
    readFile(rendererStylesPath, "utf8")
  ]);

  assert.match(html, /AUTOMATION COMMAND CENTER/);
  assert.match(html, /id="projectNavigation"/);
  assert.match(html, /id="statusNavigation"/);
  assert.match(html, /id="queueTable"/);
  assert.match(html, /id="currentRunPanel"/);
  assert.match(source, /const TASK_STATES = \["pending_review", "pending", "in_progress", "completed", "accepted", "cancelled", "blocked"\]/);
  assert.match(source, /api\.automationSnapshot/);
  assert.match(source, /api\.setAutomationEnabled/);
  assert.match(source, /api\.bindAutomationProject/);
  assert.match(source, /blocked_pending_tasks/);
  assert.match(html, /<strong>自动领取<\/strong>/);
  assert.match(html, /控制是否领取新任务；仅作用于已绑定且已授权的项目，不停止当前任务/);
  assert.match(source, /允许此项目自动领取/);
  assert.match(source, /允许自动领取 ·/);
  assert.match(source, /api\.setProjectParticipation\(project\.id, true\)/);
  assert.match(styles, /--sidebar-width: 228px;/);
  assert.match(styles, /\.command-grid \{ display: grid; grid-template-columns: minmax\(0, 1fr\) 298px;/);
  assert.doesNotMatch(html, /class="chat-column"|id="chatInput"|>Chats</);
});

test("desktop exposes Task Browser, on-demand Workbench, and Recovery Center as closed-loop views", async () => {
  const [source, html] = await Promise.all([
    readFile(rendererPath, "utf8"),
    readFile(rendererHtmlPath, "utf8")
  ]);

  assert.match(html, /data-page-view="tasks"/);
  assert.match(html, /INTERVENTION WORKBENCH/);
  assert.match(html, /data-page-view="workbench"/);
  assert.match(html, /AUTOMATION RECOVERY CENTER/);
  assert.match(html, /data-page-view="recovery"/);
  assert.match(source, /openWorkbench\("intervention"\)/);
  assert.match(source, /state\.workbenchMode !== "intervention"/);
  assert.match(html, /id="interveneCurrentButton"/);
  assert.match(source, /state\.interventionSubmitting = true/);
  assert.match(source, /api\.submitIntervention/);
  assert.match(source, /api\.resolveAutomationRecovery/);
  assert.match(source, /api\.updateAutomationTaskState/);
  assert.match(source, /state\.workbenchRun \|\| state\.snapshot\.active_run/);
  assert.match(source, /state\.workbenchCompletion\?\.local_project_id/);
  assert.match(source, /api\.listMessages\(localProjectId, run\.session_id\)/);
  assert.match(source, /renderRunPlan\(activity\)/);
  assert.match(source, /renderExecutionEvidence\(activity\)/);
  assert.match(source, /artifact_ownership_scan\?\.implementation_evidence/);
});

test("desktop main and preload expose bounded automation IPC without a generic network bridge", async () => {
  const [main, preload, source] = await Promise.all([
    readFile(desktopMainPath, "utf8"),
    readFile(desktopPreloadPath, "utf8"),
    readFile(rendererPath, "utf8")
  ]);

  for (const channel of [
    "arckit:automation-snapshot",
    "arckit:automation-sync",
    "arckit:automation-enabled",
    "arckit:automation-pause",
    "arckit:automation-bind-project",
    "arckit:automation-project-participation",
    "arckit:automation-task-state",
    "arckit:automation-intervene",
    "arckit:automation-stop",
    "arckit:automation-recovery",
    "arckit:auth-status",
    "arckit:auth-send-verification",
    "arckit:auth-login",
    "arckit:auth-logout"
  ]) {
    assert.match(main, new RegExp(channel.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")));
  }
  assert.match(preload, /automationSnapshot: \(filter\)/);
  assert.match(preload, /onAutomationEvent: \(listener\)/);
  assert.match(preload, /sendAuthVerification: \(input\)/);
  assert.match(preload, /loginWithCode: \(input\)/);
  assert.match(preload, /logoutAuth: \(input\)/);
  assert.doesNotMatch(preload, /fetch|httpRequest|requestUrl/);
  assert.doesNotMatch(preload, /startRun:|controlRun:|gateRun:|writeLedger:/);
  assert.doesNotMatch(preload, /addMessage:|createSession:|deleteSession:|addProject:/);
  assert.doesNotMatch(main, /arckit:start-run|arckit:control-run|arckit:gate-run|arckit:write-ledger/);
  assert.doesNotMatch(source, /\bfetch\s*\(/);
});

test("task source settings keep the access token write-only in Renderer", async () => {
  const [source, html] = await Promise.all([
    readFile(rendererPath, "utf8"),
    readFile(rendererHtmlPath, "utf8")
  ]);

  assert.match(html, /id="taskSourceToken" type="password"/);
  assert.match(source, /access_token_configured/);
  assert.match(source, /els\.taskSourceToken\.value = ""/);
  assert.doesNotMatch(source, /task_source\.access_token\s*\)/);
  assert.doesNotMatch(source, /refresh_token/);
});

test("desktop account panel supports bounded verification login, expiry, and confirmed logout", async () => {
  const [source, html, styles] = await Promise.all([
    readFile(rendererPath, "utf8"),
    readFile(rendererHtmlPath, "utf8"),
    readFile(rendererStylesPath, "utf8")
  ]);

  assert.match(html, /<body class="auth-pending">/);
  assert.match(html, /id="authBootScreen"/);
  assert.match(html, /正在恢复 Workshop 会话/);
  assert.doesNotMatch(html, /id="settingsPanel"[^>]+role="dialog"/);
  assert.match(html, /id="authLoginPanel"/);
  assert.match(html, /data-auth-type="email"/);
  assert.match(html, /data-auth-type="sms"/);
  assert.match(html, /id="sendVerificationButton"/);
  assert.match(html, /id="loginButton"/);
  assert.match(html, /id="logoutButton"/);
  assert.match(source, /api\.sendAuthVerification/);
  assert.match(source, /api\.loginWithCode/);
  assert.match(source, /requires_confirmation/);
  assert.match(source, /api\.logoutAuth\(\{ confirm_active_task: true \}\)/);
  assert.match(source, /els\.automationEnabled\.disabled = !state\.authentication\.authenticated/);
  assert.match(source, /authBusy: \{ verification: false, login: false, logout: false \}/);
  assert.match(source, /els\.sendVerificationButton\.disabled = state\.authBusy\.verification/);
  assert.match(source, /els\.loginButton\.disabled = state\.authBusy\.login/);
  assert.match(source, /els\.logoutButton\.disabled = state\.authBusy\.logout/);
  assert.match(source, /state\.authentication\.status === "logged_out"/);
  assert.match(source, /if \(state\.loginGate && !force\) return/);
  assert.match(source, /showLoginGate\(\)/);
  assert.match(source, /closeSettings\(\{ force: true \}\)/);
  assert.match(source, /els\.settingsPanel\.removeAttribute\("role"\)/);
  assert.match(source, /els\.settingsPanel\.setAttribute\("role", "dialog"\)/);
  assert.match(styles, /\.modal-overlay\.login-gate/);
  assert.match(styles, /\.auth-pending \.auth-boot-screen \{ display: grid; \}/);
  assert.match(styles, /\.login-gate #closeSettingsButton \{ display: none; \}/);
  assert.match(styles, /\.auth-boot-screen[^}]+var\(--violet-100\)[^}]+var\(--ink-75\)/);
  assert.match(styles, /\.modal-overlay\.login-gate[^}]+var\(--violet-100\)[^}]+var\(--ink-75\)/);
  assert.doesNotMatch(styles, /\.auth-boot-screen[^}]+var\(--ink-950\)/);
  assert.doesNotMatch(styles, /\.modal-overlay\.login-gate[^}]+var\(--ink-950\)/);
});
