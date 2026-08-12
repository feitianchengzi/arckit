import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import {
  isTranscriptMessageVisible,
  statusGlyph,
  structuredResultPresentation,
  summarizeLoopStatus,
  summarizeToolActivity,
  transcriptMessageType
} from "../src/desktop/transcript-presentation.mjs";

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
  assert.match(source, /Case 已完成，等待远端收尾/);
  assert.match(source, /Automation Coordinator \/ 任务源/);
  assert.match(source, /phase === "remote_completion_pending"/);
  assert.match(source, /api\.setProjectParticipation\(project\.id, true\)/);
  assert.match(styles, /--sidebar-width: 228px;/);
  assert.match(styles, /\.command-grid \{ display: grid; grid-template-columns: minmax\(0, 1fr\) 298px;/);
  assert.doesNotMatch(html, /class="chat-column"|id="chatInput"|>Chats</);
});

test("desktop exposes Task Browser, on-demand Workbench, and Recovery Center as closed-loop views", async () => {
  const [source, html, styles] = await Promise.all([
    readFile(rendererPath, "utf8"),
    readFile(rendererHtmlPath, "utf8"),
    readFile(rendererStylesPath, "utf8")
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
  assert.match(source, /message\.task_id/);
  assert.match(source, /Task Session/);
  assert.match(source, /Token 逻辑总量/);
  assert.match(source, /cached_input_tokens/);
  assert.match(source, /uncached_input_tokens/);
  assert.match(source, /usage_warnings/);
  assert.match(source, /模型 Turn 耗时/);
  assert.match(source, /命令累计耗时/);
  assert.match(source, /历史基线/);
  assert.match(source, /相对历史中位数/);
  assert.match(source, /Codex Thread/);
  assert.match(source, /上下文压缩/);
  assert.match(source, /context_compactions/);
  assert.match(source, /Git 收尾/);
  assert.match(source, /activity\?\.messages/);
  assert.match(source, /renderConversationMessage/);
  assert.match(source, /run\.activity_changed/);
  assert.match(source, /artifact_paths\?\.messages_file/);
  assert.doesNotMatch(source, /renderRunPlan\(activity\)|renderExecutionEvidence\(activity\)|raw_events/);
  assert.match(source, /artifact_ownership_scan\?\.implementation_evidence/);
  assert.match(html, /class="transcript-scroll-area"/);
  assert.match(html, /id="jumpToLatestButton"/);
  assert.match(source, /transcriptFollowingLatest/);
  assert.match(source, /isTranscriptNearBottom/);
  assert.match(source, /renderLoopStatus/);
  assert.match(source, /renderToolActivity/);
  assert.match(source, /renderReasoningDisclosure/);
  assert.match(source, /renderStructuredResult/);
  assert.match(styles, /#workbenchView\.is-active \{ overflow: hidden; \}/);
  assert.match(styles, /\.workbench-layout[^}]+height: 100%[^}]+overflow: hidden/);
  assert.match(styles, /\.workbench-context, \.workbench-evidence[^}]+overflow-y: auto/);
  assert.match(styles, /\.transcript-list[^}]+overflow-y: auto/);
  assert.match(styles, /\.tool-activity-summary[^}]+text-overflow: ellipsis[^}]+white-space: nowrap/);
  assert.match(styles, /\.reasoning-disclosure/);
  assert.match(styles, /\.structured-result-raw pre[^}]+overflow: auto/);
});

test("workbench transcript prioritizes Loop and Agent output while reducing tools to one-line summaries", () => {
  assert.equal(transcriptMessageType({ role: "assistant", actor: "agent", kind: "result" }), "agent");
  assert.equal(transcriptMessageType({ role: "assistant", actor: "agent", kind: "status" }), "loop");
  assert.equal(transcriptMessageType({ role: "tool", actor: "tool", kind: "command" }), "tool");
  assert.equal(transcriptMessageType({ role: "user" }), "user");
  assert.equal(transcriptMessageType({ role: "assistant", actor: "agent", kind: "reasoning" }), "reasoning");
  assert.equal(transcriptMessageType({ role: "assistant", actor: "agent", kind: "structured" }), "structured");

  assert.equal(summarizeToolActivity({ content: "sed -n '1,240p' runtime/arckit-runtime/desktop/renderer/renderer.js" }), "读取 runtime/arckit-runtime/desktop/renderer/renderer.js");
  assert.equal(summarizeToolActivity({ content: "npm test" }), "运行测试 · npm test");
  assert.equal(summarizeToolActivity({ content: "git diff --check" }), "查看工作区变更");
  assert.equal(summarizeToolActivity({ kind: "file_change" }), "更新文件");
  assert.equal(summarizeToolActivity({ kind: "file_change", content: "src/view.js" }), "更新 src/view.js");
  assert.equal(summarizeToolActivity({ kind: "web_search", content: "Codex app transcript" }), "搜索网络 · Codex app transcript");
  assert.equal(summarizeLoopStatus({ content: "Agent\n正在推进一个 Case gap。" }), "Agent 正在推进一个 Case gap。");
  assert.equal(statusGlyph("streaming"), "◌");
  assert.equal(statusGlyph("failed"), "×");
});

test("transcript hides empty reasoning and recognizes persisted schema JSON without rewriting it", () => {
  assert.equal(isTranscriptMessageVisible({ role: "assistant", kind: "reasoning", content: "" }), false);
  assert.equal(isTranscriptMessageVisible({ role: "assistant", kind: "reasoning", content: "Checked the state." }), true);
  const value = {
    schema_version: "arckit-agent-loop-result/v1",
    action: "case_transition",
    summary: "Advanced one gap.",
    case_transition: { case_id: "CASE-1", selected_gap: { id: "GAP-1" } },
    risks: ["Visual smoke test pending."],
    unknowns: []
  };
  const raw = JSON.stringify(value);
  const legacyMessage = { role: "assistant", actor: "agent", kind: "message", content: raw };
  assert.equal(transcriptMessageType(legacyMessage), "structured");
  assert.equal(isTranscriptMessageVisible(legacyMessage), true);
  const presentation = structuredResultPresentation(legacyMessage);
  assert.equal(presentation.title, "Agent Loop 结果");
  assert.equal(presentation.schema_version, value.schema_version);
  assert.equal(presentation.raw, raw);
  assert.deepEqual(presentation.fields, [
    { label: "Action", values: ["case_transition"] },
    { label: "Case", values: ["CASE-1"] },
    { label: "Gap", values: ["GAP-1"] },
    { label: "Risks", values: ["Visual smoke test pending."] }
  ]);
});

test("Round Closeout v2 presents trusted invariant judgments", () => {
  const value = {
    schema_version: "arckit-round-closeout/v2",
    status: "accepted",
    case_id: "CASE-1",
    round: 2,
    selected_gap: { id: "GAP-TECH" },
    resulting_state: { project_revision: 4 },
    invariant_assessment: {
      project_revision: 3,
      judgments: [
        { invariant_ref: "technical-decisions-remain-explainable", disposition: "threatened" },
        { invariant_ref: "accepted-facts-are-realized", disposition: "upheld" }
      ]
    }
  };
  const presentation = structuredResultPresentation({ role: "system", kind: "structured", structured_data: { value } });
  assert.equal(presentation.title, "Round Closeout");
  assert.deepEqual(presentation.fields.at(-1), {
    label: "Invariant judgments",
    values: ["technical-decisions-remain-explainable: threatened", "accepted-facts-are-realized: upheld"]
  });
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
    "arckit:automation-handoff-cli",
    "arckit:automation-reopen-cli",
    "arckit:automation-resume-runtime",
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
  assert.match(preload, /handoffAutomationToCli/);
  assert.match(preload, /resumeAutomationRuntime/);
  assert.match(source, /切换到 Codex CLI/);
  assert.match(source, /Codex CLI 接管/);
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
