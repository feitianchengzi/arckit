import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import vm from "node:vm";
import test from "node:test";
import {
  isTranscriptMessageVisible,
  statusGlyph,
  structuredResultPresentation,
  summarizeLoopStatus,
  summarizeToolActivity,
  transcriptMessageType
} from "../src/desktop/transcript-presentation.mjs";
import { checkDesktopSetupReadiness, desktopSetupCheckInput } from "../src/desktop-setup-readiness-context.mjs";
import feedbackV2Ipc from "../desktop/feedback-v2-ipc.cjs";

const { settleFeedbackV2Ipc, unwrapFeedbackV2Ipc } = feedbackV2Ipc;

const rendererPath = new URL("../desktop/renderer/renderer.js", import.meta.url);
const rendererHtmlPath = new URL("../desktop/renderer/index.html", import.meta.url);
const rendererStylesPath = new URL("../desktop/renderer/styles.css", import.meta.url);
const desktopMainPath = new URL("../desktop/main.mjs", import.meta.url);
const desktopPreloadPath = new URL("../desktop/preload.cjs", import.meta.url);

test("desktop primary surface is a simultaneous multi-product platform while preserving Automation", async () => {
  const [source, html, styles] = await Promise.all([
    readFile(rendererPath, "utf8"),
    readFile(rendererHtmlPath, "utf8"),
    readFile(rendererStylesPath, "utf8")
  ]);

  assert.match(html, /MULTI-PRODUCT TODAY/);
  for (const page of ["today", "organization", "work", "command", "feedback"]) {
    assert.match(html, new RegExp(`data-page="${page}"`));
  }
  assert.match(html, /data-page-view="today"/);
  assert.match(html, /data-page-view="organization"/);
  assert.match(html, /data-page-view="work"/);
  assert.match(html, /data-page-view="feedback"/);
  assert.match(html, /id="worksetSelect"/);
  assert.match(html, /不受当前产品集过滤/);
  assert.match(source, /page: "today"/);
  assert.match(source, /api\.platformSnapshot/);
  assert.match(source, /api\.setActiveWorkset/);
  assert.match(source, /api\.updateWorkset\(\{ id: activeWorkset\.id, project_ids: projectIds \}\)/);
  assert.match(html, /id="editWorksetButton"/);
  assert.match(html, /id="createOrganizationButton"/);
  assert.match(html, /id="createTaskButton"/);
  assert.doesNotMatch(html, /id="createFeedbackButton"|创建用户反馈|Workshop Feedback · V1|Feedback V2/);
  for (const id of ["feedbackSearchInput", "feedbackStateFilter", "feedbackSortSelect", "feedbackRefreshButton", "ordinaryFeedbackTable", "feedbackInspector"]) {
    assert.match(html, new RegExp(`id="${id}"`));
  }
  assert.match(html, /class="feedback-workbench-layout"/);
  assert.match(source, /function renderFeedbackInspector\(feedback\)/);
  assert.match(source, /feedbackLinkRecoveries: \{\}/);
  assert.match(source, /class="feedback-link-recovery"[\s\S]*data-feedback-link-retry[\s\S]*仅重试关联/);
  assert.match(styles, /\.feedback-link-recovery \{/);
  assert.match(source, /api\.openFeedbackAttachment\(feedback\.file\)/);
  assert.doesNotMatch(source, /href="\$\{escapeHtml\(feedback\.file\)\}"|target="_blank"/);
  assert.match(source, /function updateFeedbackPriority|async function updateFeedbackPriority/);
  assert.match(source, /const priorityAction = feedback\.linked_task_id[\s\S]*feedback-priority-readonly[\s\S]*data-feedback-priority/);
  assert.match(styles, /\.feedback-priority-readonly \{/);
  const feedbackPriorityHandler = source.slice(source.indexOf("async function updateFeedbackPriority"), source.indexOf("async function ignoreFeedback"));
  assert.match(feedbackPriorityHandler, /if \(feedback\.linked_task_id\) throw new Error/);
  assert.match(feedbackPriorityHandler, /\["P1", "P2", "P3"\]\.includes\(priority\)/);
  assert.match(source, /async function ignoreFeedback/);
  assert.doesNotMatch(source, /async function createFeedback|async function editFeedback|data-feedback-edit/);
  assert.match(styles, /\.feedback-workbench-layout \{ display: grid; grid-template-columns: minmax\(300px, \.72fr\) minmax\(440px, 1\.28fr\)/);
  assert.match(html, /id="platformActionOverlay"/);
  assert.match(source, /api\.executePlatformAction/);
  assert.match(source, /"project\.member\.update"/);
  assert.match(source, /"task\.attachment\.create"/);
  assert.match(source, /"feedback\.to_task"/);
  const feedbackToTaskHandler = source.slice(source.indexOf("async function feedbackToTask"), source.indexOf("async function deleteFeedback"));
  assert.match(feedbackToTaskHandler, /platformField\("task_content", "待办内容", \{ type: "textarea", required: true, value: feedback\.content \}\)/);
  assert.match(feedbackToTaskHandler, /platformField\("executor_id", "执行人", \{ type: "select", options: memberSelectOptions\(feedback\.project_id\) \}\)/);
  assert.match(feedbackToTaskHandler, /if \(feedback\.linked_task_id\) throw new Error/);
  assert.match(feedbackToTaskHandler, /error\?\.partial_result\?\.task_id/);
  assert.match(feedbackToTaskHandler, /state\.feedbackLinkRecoveries\[String\(feedback\.id\)\]/);
  assert.doesNotMatch(feedbackToTaskHandler, /feedback\.title \|\| feedback\.content|执行人 ID/);
  assert.doesNotMatch(feedbackToTaskHandler, /仍要新建另一个待办|Feedback V1/);
  const feedbackLinkRetryHandler = source.slice(source.indexOf("async function retryFeedbackTaskLink"), source.indexOf("async function deleteFeedback"));
  assert.match(feedbackLinkRetryHandler, /"feedback\.link_task"/);
  assert.match(feedbackLinkRetryHandler, /task_id: recovery\.task_id/);
  assert.doesNotMatch(feedbackLinkRetryHandler, /feedback\.to_task|task\.create/);
  const managedActionHandler = source.slice(source.indexOf("async function executeManagedAction"), source.indexOf("function openPlatformAction"));
  assert.match(managedActionHandler, /result\?\.status === "partial"/);
  assert.match(managedActionHandler, /partialError\.partial_result = result\.partial_result/);
  assert.match(source, /function memberSelectOptions\(projectId = ""\).*filter\(\(item\) => !projectId \|\| String\(item\.project_id\) === String\(projectId\)\).*label: item\.username/);
  assert.doesNotMatch(source, /label: `\$\{item\.project_name\} · \$\{item\.username\}`/);
  const createTaskHandler = source.slice(source.indexOf("async function createTask"), source.indexOf("async function editTask"));
  const editTaskHandler = source.slice(source.indexOf("async function editTask"), source.indexOf("async function deleteTask"));
  assert.match(createTaskHandler, /taskProjectFields\(defaultProjectId\)/);
  assert.match(createTaskHandler, /bindTaskFormProjectScope\(defaultProjectId\)/);
  assert.match(createTaskHandler, /platformField\("priority", "优先级", \{ type: "select"/);
  assert.doesNotMatch(createTaskHandler, /服务优先级|type: "number"/);
  assert.match(editTaskHandler, /taskProjectFields\(task\.project_id/);
  assert.match(editTaskHandler, /platformField\("priority", "优先级", \{ type: "select"/);
  assert.match(editTaskHandler, /normalizeTaskFormValues\(await action, \{ emptyPriority: "null" \}\)/);
  assert.doesNotMatch(editTaskHandler, /服务优先级|type: "number"/);
  assert.match(source, /function taskPriorityOptions\(\).*最高 · 紧急且重要.*高 · 优先处理.*中 · 正常处理.*低 · 可以延后/);
  assert.match(source, /function taskTagField\(projectId, currentTags = ""\)/);
  assert.match(source, /data-task-tag-create|data-task-tag-edit|data-task-tag-delete/);
  assert.match(source, /function buildWorkshopTagName\(displayName, color\)/);
  assert.match(styles, /\.task-project-fields \{ display: contents; \}/);
  assert.match(styles, /\.task-tag-field \{ grid-column: 1 \/ -1;/);
  assert.doesNotMatch(source, /project\.member\.add/);
  const worksetHandler = source.slice(source.indexOf("async function editCurrentWorkset"), source.indexOf("async function toggleProjectInWorkset"));
  assert.doesNotMatch(worksetHandler, /setProjectParticipation|setAutomationEnabled|bindAutomationProject/);
  assert.match(source, /成员页不生成项目邀请|为何这里没有项目邀请/);
  assert.match(source, /create_once_no_list_or_revoke/);
  assert.match(html, /AUTOMATION COMMAND CENTER/);
  assert.match(html, /id="productScopeSelect"/);
  assert.match(html, /id="workStateFilters"/);
  assert.match(html, /id="acceptanceFeedbackOnlyButton"/);
  assert.doesNotMatch(html, /TASK STATUS|id="statusNavigation"|id="projectNavigation"/);
  assert.match(html, /id="queueTable"/);
  assert.match(html, /id="feedbackQueueTable"/);
  assert.match(html, /id="currentRunPanel"/);
  assert.match(source, /const TASK_STATES = \["pending_review", "pending", "in_progress", "completed", "accepted", "cancelled", "blocked"\]/);
  assert.match(source, /api\.automationSnapshot/);
  assert.match(source, /invalidateTaskAttachmentCaches\(state, \{ clearPending: identityChanged \}\)/);
  assert.match(source, /taskAttachmentIdentityKey\(\{ platform: state\.platform, authentication: state\.authentication \}\)/);
  assert.match(source, /state\.platform = emptyPlatformSnapshot\(\);[\s\S]+state\.selectedPlatformTaskId = "";[\s\S]+invalidateTaskAttachmentCaches\(state, \{ clearPending: true \}\)/);
  assert.match(source, /captureTaskAttachmentRequest\(state\)[\s\S]+task\.attachments\.list[\s\S]+isTaskAttachmentRequestCurrent\(state, request\)/);
  assert.match(source, /captureTaskAttachmentRequest\(state, \{ identityOnly: true \}\)[\s\S]+pickWorkTaskAttachment[\s\S]+isTaskAttachmentRequestCurrent\(state, request\)/);
  assert.match(source, /api\.setAutomationEnabled/);
  assert.match(source, /api\.bindAutomationProject/);
  assert.match(source, /blocked_pending_tasks/);
  assert.match(source, /acceptance_feedback_queue/);
  assert.match(source, /api\.submitAcceptanceFeedback/);
  assert.match(source, /验收问题与进展/);
  assert.match(html, /<strong>自动领取<\/strong>/);
  assert.match(html, /控制是否领取新任务；仅作用于已绑定且已授权的项目，不停止当前任务/);
  assert.match(source, /允许此项目自动领取/);
  assert.match(source, /允许自动领取 ·/);
  assert.match(source, /Case 已完成，等待远端收尾/);
  assert.match(source, /Automation Coordinator \/ 任务源/);
  assert.match(source, /phase === "remote_completion_pending"/);
  assert.match(source, /api\.setProjectParticipation\(project\.id, true\)/);
  assert.match(styles, /--sidebar-width: 228px;/);
  assert.match(styles, /\.product-grid \{ display: grid; grid-template-columns: repeat\(3, minmax\(0, 1fr\)\)/);
  assert.match(styles, /\.platform-two-column, \.feedback-lanes \{ display: grid;/);
  assert.match(styles, /\.command-grid \{ display: grid; grid-template-columns: minmax\(0, 1fr\) 298px;/);
  assert.doesNotMatch(html, /class="chat-column"|id="chatInput"|>Chats</);
});

test("desktop presents the planned lifecycle and manageable domain profiles without wiring side effects", async () => {
  const [source, html, styles] = await Promise.all([
    readFile(rendererPath, "utf8"),
    readFile(rendererHtmlPath, "utf8"),
    readFile(rendererStylesPath, "utf8")
  ]);

  const sidebar = html.slice(html.indexOf('<nav class="primary-nav"'), html.indexOf('</nav>'));
  const orderedLabels = [
    "PERSONAL", "Today", "Chat",
    "PRODUCT LIFECYCLE", "Idea", "Work", "Automation", "Release", "Operations", "Feedback",
    "ORGANIZATION", "Organization", "Engineering"
  ];
  let cursor = -1;
  for (const label of orderedLabels) {
    const next = sidebar.indexOf(label, cursor + 1);
    assert.ok(next > cursor, `${label} should appear in the planned navigation order`);
    cursor = next;
  }
  for (const page of ["chat", "idea", "release", "operations", "engineering"]) {
    assert.match(sidebar, new RegExp(`data-page="${page}"`));
    assert.match(html, new RegExp(`data-page-view="${page}"`));
  }
  assert.match(html, /PERSONAL · OPEN AGENT CHAT/);
  assert.match(html, /自由问答不自动成为正式事项/);
  assert.match(html, /PRODUCT LIFECYCLE · IDEA/);
  assert.match(html, /PRODUCT LIFECYCLE · RELEASE/);
  assert.match(html, /Release 是“发布”的统一英文入口/);
  assert.match(html, /PRODUCT LIFECYCLE · OPERATIONS/);
  assert.match(html, /Operations 是“运营”的统一英文入口/);
  assert.match(html, /ORGANIZATION · DOMAIN PROFILE MANAGEMENT/);
  assert.match(html, /领域模型与能力管理/);
  assert.match(html, /MANAGEMENT PREVIEW · 无真实写入/);
  assert.match(html, /Domain Profiles/);
  assert.match(html, /Software Engineering/);
  assert.match(html, /Campaign Operations/);
  assert.match(html, /Research Program/);
  assert.match(html, /State Model/);
  assert.match(html, /Project State · Software Definition/);
  assert.match(html, /Case State · Engineering Mapping/);
  assert.match(html, /Capability Mapping/);
  assert.match(html, /预期事实/);
  assert.match(html, /实现现状/);
  assert.match(html, /问题定位/);
  assert.match(html, /Lifecycle Mapping/);
  assert.match(html, /Change Preview/);
  assert.match(html, /Review &amp; Apply/);
  assert.match(html, /Stable operating model/);
  assert.match(html, /Idea[\s\S]*Work[\s\S]*Automation[\s\S]*Release[\s\S]*Operations[\s\S]*Feedback/);
  assert.match(html, /LOOP KERNEL · 保持不变/);
  assert.match(html, /Entry capabilities 不进入 Profile/);
  assert.doesNotMatch(sidebar, /data-page="state"|data-page="skills"/);
  assert.doesNotMatch(html, /data-page-view="state"|data-page-view="skills"/);
  assert.doesNotMatch(html, /using-arckit|arckit-development-ledger|Trusted entrypoints/);
  assert.match(html, /PLAN VIEW · 无真实写入/);
  assert.match(html, /PLAN VIEW · 不授权发版/);
  assert.match(html, /PLAN VIEW · 不调用外部平台/);
  assert.doesNotMatch(html, /data-plan-action|id="chatInput"|id="createIdeaButton"|id="publishReleaseButton"/);
  assert.match(source, /\["organization", "engineering"\]\.includes\(state\.page\)/);
  assert.match(source, /chat: "Chat", idea: "Idea"/);
  assert.match(source, /release: "Release", operations: "Operations"/);
  assert.match(source, /engineering: "Engineering"/);
  assert.match(styles, /\.planning-three-column/);
  assert.match(styles, /\.planning-boundary/);
  assert.match(styles, /\.profile-management-grid/);
  assert.match(styles, /\.profile-capability-grid/);
  assert.match(styles, /\.profile-lifecycle/);
  assert.doesNotMatch(source, /applyDomainProfile|saveDomainProfile|installDomainSkill/);
});

test("Desktop opens feedback attachments through a bounded main-process HTTPS capability", async () => {
  const [main, preload] = await Promise.all([
    readFile(desktopMainPath, "utf8"),
    readFile(desktopPreloadPath, "utf8")
  ]);
  assert.match(preload, /openFeedbackAttachment: \(value\) => ipcRenderer\.invoke\("arckit:feedback-attachment-open", value\)/);
  assert.match(main, /requireFeedbackAttachmentUrl\(value\)/);
  assert.match(main, /event\.sender !== mainWindow\?\.webContents/);
  assert.match(main, /await shell\.openExternal\(url\)/);
  assert.match(main, /installMainWindowNavigationBoundary\(mainWindow\.webContents, rendererUrl\)/);
});

test("Desktop keeps developer Feedback V2 conversation behind dedicated typed IPC", async () => {
  const [main, preload, source, styles] = await Promise.all([
    readFile(desktopMainPath, "utf8"),
    readFile(desktopPreloadPath, "utf8"),
    readFile(rendererPath, "utf8"),
    readFile(rendererStylesPath, "utf8")
  ]);
  for (const channel of [
    "arckit:feedback-v2-messages",
    "arckit:feedback-v2-reply",
    "arckit:feedback-v2-read",
    "arckit:feedback-v2-ignore",
    "arckit:feedback-v2-update",
    "arckit:feedback-v2-delete",
    "arckit:feedback-v2-convert",
    "arckit:feedback-v2-attachment-open"
  ]) {
    assert.match(main, new RegExp(channel));
    assert.match(preload, new RegExp(channel));
  }
  assert.match(source, /api\.getFeedbackV2Messages/);
  assert.match(source, /api\.sendFeedbackV2Reply/);
  assert.match(source, /api\.markFeedbackV2Read/);
  assert.match(main, /settleFeedbackV2Ipc/);
  assert.match(preload, /unwrapFeedbackV2Ipc/);
  assert.match(source, /state\.feedbackConversations\[String\(feedback\.id\)\]/);
  assert.match(source, /draft: current\?\.draft \|\| ""/);
  assert.match(source, /data-feedback-message-attachment/);
  assert.match(styles, /\.feedback-conversation/);
  assert.doesNotMatch(preload, /fetch|httpRequest|feedbackV2Request|apiKey|Authorization/);
  assert.doesNotMatch(source, /Project 107|FEEDBACK_API_KEY/);
});

test("Feedback V2 typed IPC preserves status and Renderer executes 401 and 404 recovery", async () => {
  const envelope401 = await settleFeedbackV2Ipc(async () => {
    throw Object.assign(new Error("expired"), { code: "unauthenticated", status: 401 });
  });
  assert.deepEqual(envelope401, {
    version: "feedback-v2-ipc-result/v1",
    ok: false,
    error: { code: "unauthenticated", status: 401, message: "expired" }
  });
  assert.throws(() => unwrapFeedbackV2Ipc(envelope401), (error) => error.code === "unauthenticated" && error.status === 401);

  const source = await readFile(rendererPath, "utf8");
  const start = source.indexOf("async function runFeedbackV2Request");
  const end = source.indexOf("\nasync function executeManagedAction", start);
  const recoverySource = source.slice(start, end);
  const calls = { auth: 0, gate: 0, refresh: 0 };
  const context = {
    state: {},
    api: { getAuthStatus: async () => { calls.auth += 1; return { status: "expired", authenticated: false }; } },
    normalizeAuthentication: (value) => value,
    showLoginGate: () => { calls.gate += 1; },
    refreshSnapshot: async () => { calls.refresh += 1; }
  };
  vm.runInNewContext(`${recoverySource}\nglobalThis.runFeedbackV2Request = runFeedbackV2Request;`, context);

  await assert.rejects(context.runFeedbackV2Request(async () => unwrapFeedbackV2Ipc(envelope401)), /expired/);
  assert.deepEqual(calls, { auth: 1, gate: 1, refresh: 0 });

  const envelope404 = await settleFeedbackV2Ipc(async () => {
    throw Object.assign(new Error("missing"), { code: "not_found", status: 404 });
  });
  await assert.rejects(context.runFeedbackV2Request(async () => unwrapFeedbackV2Ipc(envelope404)), /missing/);
  assert.deepEqual(calls, { auth: 1, gate: 1, refresh: 1 });
});

test("Feedback V2 read state respects notification capability and refreshes visible unread projection", async () => {
  const source = await readFile(rendererPath, "utf8");
  const listStart = source.indexOf("function renderPlatformFeedback");
  const listEnd = source.indexOf("\nfunction renderFeedbackInspector", listStart);
  const workspaceStart = source.indexOf("function feedbackWorkspace");
  const workspaceEnd = source.indexOf("\nfunction renderFeedbackConversation", workspaceStart);
  const loadStart = source.indexOf("async function loadFeedbackConversation");
  const loadEnd = source.indexOf("\nasync function sendFeedbackReply", loadStart);
  const readStateSource = `${source.slice(listStart, listEnd)}\n${source.slice(workspaceStart, workspaceEnd)}\n${source.slice(loadStart, loadEnd)}`;
  const calls = { messages: 0, markRead: 0, renders: 0 };
  const workspace = {
    id: 7,
    feedback_management: {
      features: { mark_read: false },
      unread_count: 3,
      unread_feedback_ids: ["51", "52"]
    }
  };
  const context = {
    state: {
      platform: {
        product_workspaces: [workspace],
        feedback_v1: [{ id: 51, project_id: 7, title: "Needs attention" }]
      },
      feedbackConversations: {},
      selectedFeedbackId: "51",
      feedbackFilter: "",
      feedbackState: "all",
      feedbackSort: "newest"
    },
    els: {
      feedbackSearchInput: { value: "" },
      feedbackStateFilter: { value: "" },
      feedbackSortSelect: { value: "" },
      feedbackListSummary: { textContent: "stale summary" },
      ordinaryFeedbackTable: {
        innerHTML: "stale list",
        querySelectorAll: () => []
      }
    },
    api: {
      getFeedbackV2Messages: async () => { calls.messages += 1; return [{ id: "message-1" }]; },
      markFeedbackV2Read: async () => { calls.markRead += 1; return { marked_count: 2 }; }
    },
    runFeedbackV2Request: async (operation) => operation(),
    renderFeedbackInspector: () => { calls.renders += 1; },
    platformItemMatchesSelectedProject: () => true,
    feedbackProcessingState: () => "pending",
    compareFeedbackItems: () => 0,
    escapeHtml: (value) => String(value ?? ""),
    feedbackExcerpt: (value) => String(value ?? ""),
    formatFeedbackDate: () => "today",
    FEEDBACK_STATE_LABELS: { pending: "待处理" }
  };
  vm.runInNewContext(`${readStateSource}\nglobalThis.loadFeedbackConversation = loadFeedbackConversation;`, context);
  const feedback = { id: 51, project_id: 7 };

  await context.loadFeedbackConversation(feedback);
  assert.equal(calls.messages, 1);
  assert.equal(calls.markRead, 0);
  assert.equal(context.state.feedbackConversations["51"].readError, "");
  assert.equal(workspace.feedback_management.unread_count, 3);
  assert.deepEqual(workspace.feedback_management.unread_feedback_ids, ["51", "52"]);
  assert.equal(context.els.feedbackListSummary.textContent, "stale summary");
  assert.equal(context.els.ordinaryFeedbackTable.innerHTML, "stale list");

  workspace.feedback_management.features.mark_read = true;
  delete context.state.feedbackConversations["51"];
  await context.loadFeedbackConversation(feedback);
  assert.equal(calls.messages, 2);
  assert.equal(calls.markRead, 1);
  assert.equal(context.state.feedbackConversations["51"].readError, "");
  assert.equal(workspace.feedback_management.unread_count, 1);
  assert.deepEqual(workspace.feedback_management.unread_feedback_ids, ["52"]);
  assert.equal(context.els.feedbackListSummary.textContent, "1 条 · 1 未读");
  assert.doesNotMatch(context.els.ordinaryFeedbackTable.innerHTML, /feedback-unread-dot/);
  assert.equal(calls.renders, 4);
});

test("ADVANCE owns one top product-set scope while Work and Automation own their local filters", async () => {
  const [source, html, styles] = await Promise.all([
    readFile(rendererPath, "utf8"),
    readFile(rendererHtmlPath, "utf8"),
    readFile(rendererStylesPath, "utf8")
  ]);

  const sidebar = html.slice(html.indexOf('<aside class="sidebar">'), html.indexOf('<main class="app-stage">'));
  const commandbar = html.slice(html.indexOf('<header class="commandbar">'), html.indexOf('<div class="view-host">'));
  const workView = html.slice(html.indexOf('id="workView"'), html.indexOf('id="feedbackView"'));
  const commandView = html.slice(html.indexOf('id="commandView"'), html.indexOf('id="taskView"'));
  assert.doesNotMatch(sidebar, /TASK STATUS|仅看验收问题|添加本地项目|本地 Runtime|<strong>任务源<\/strong>/);
  assert.match(commandbar, /id="productSetCluster"/);
  assert.match(commandbar, /id="worksetSelect"/);
  assert.match(commandbar, /id="productScopeSelect"/);
  assert.match(commandbar, /管理当前产品集/);
  assert.match(workView, /id="workStateFilters"/);
  assert.match(workView, /class="platform-work-layout"/);
  assert.match(workView, /id="platformWorkInspector"/);
  assert.match(commandView, /id="acceptanceFeedbackOnlyButton"/);
  assert.match(commandView, /仅看验收问题/);
  assert.match(commandView, /验收问题队列/);
  assert.doesNotMatch(commandView, /验收反馈/);
  assert.doesNotMatch(commandView, /AUTOMATION FILTER|id="projectNavigation"/);
  assert.match(html, /id="accountButton"/);
  assert.match(html, /id="accountAvatar"/);
  assert.doesNotMatch(html, /id="sourceHealthButton"|id="runtimeHealthButton"|id="pickProjectButton"/);
  assert.match(source, /advanceProjectsInActiveWorkset\(\)/);
  assert.match(source, /active_workset\?\.project_ids/);
  assert.match(source, /<option value="all">项目集全部/);
  assert.match(source, /item\.project_id \|\| item\.source_project_id/);
  assert.match(source, /!projectId && item\.freeze_scope === "global"/);
  assert.match(source, /activeExecutionMatchesSelectedProject\(snapshot\.active_task\)/);
  assert.match(source, /const stateCounts = Object\.fromEntries/);
  assert.match(source, /data-platform-task-select/);
  assert.match(source, /function renderPlatformWorkInspector\(task\)/);
  assert.match(source, /automationTask\?\.state === "completed"/);
  assert.match(source, /该待办已验收，不再接受新的验收问题/);
  assert.doesNotMatch(html.slice(html.indexOf('id="feedbackView"'), html.indexOf('id="commandView"')), /验收问题队列|验收反馈|acceptanceFeedbackPlatformTable/);
  assert.match(source, /state\.platform\.feedback_v1 \|\| \[\]\)\.filter\(platformItemMatchesSelectedProject\)\.length/);
  assert.match(source, /function activeExecutionMatchesSelectedProject\(active\) \{\s+return Boolean\(active\);/);
  assert.match(source, /snapshot\.recovery_items\.length/);
  assert.match(source, /state\.acceptanceFeedbackOnly = !state\.acceptanceFeedbackOnly/);
  assert.match(source, /els\.ordinaryQueueCard\.classList\.toggle\("hidden", state\.acceptanceFeedbackOnly\)/);
  assert.match(source, /platform\.product_workspaces \|\| \[\]\)\.filter\(platformItemMatchesSelectedProject\)/);
  assert.match(source, /state\.platform\.tasks\.filter\(platformItemMatchesSelectedProject\)/);
  assert.match(source, /localProjectId === "__add_local_project__"/);
  assert.match(source, /const localProject = await api\.pickProject\(\)/);
  assert.match(source, /await api\.bindAutomationProject\(remoteId, localProjectId\)/);
  assert.match(source, /platformUser\.name \|\| platformUser\.username/);
  assert.match(source, /els\.authIdentity\.textContent = authenticated \? currentWorkshopUserName\(\)/);
  assert.match(styles, /\.product-set-cluster/);
  assert.match(styles, /\.work-state-filters/);
  assert.match(styles, /\.filter-toggle/);
  assert.match(styles, /\.account-avatar/);
  assert.match(styles, /#workView\.is-active \{ overflow: hidden; \}/);
  assert.match(styles, /#workView > \.platform-page[^}]+grid-template-rows: auto auto minmax\(0, 1fr\)[^}]+height: 100%[^}]+min-height: 0/);
  assert.match(styles, /\.platform-work-layout[^}]+align-items: stretch[^}]+min-height: 0[^}]+overflow: hidden/);
  assert.match(styles, /\.platform-work-layout > \.panel-card, \.platform-work-inspector[^}]+overflow-y: auto[^}]+overscroll-behavior: contain[^}]+scrollbar-gutter: stable/);
});

test("Work exposes server filters, task hierarchy, complete detail, subtasks and TaskAttachment collaboration", async () => {
  const [source, html, styles] = await Promise.all([
    readFile(rendererPath, "utf8"),
    readFile(rendererHtmlPath, "utf8"),
    readFile(rendererStylesPath, "utf8")
  ]);
  const workView = html.slice(html.indexOf('id="workView"'), html.indexOf('id="feedbackView"'));
  for (const id of ["workCreatorFilter", "workExecutorFilter", "workTagFilter", "workPriorityFilter", "workStartDateFilter", "workEndDateFilter", "openTaskReferenceButton", "resetWorkFiltersButton"]) {
    assert.match(workView, new RegExp(`id="${id}"`));
  }
  assert.match(source, /task_filters: state\.page === "work" \? platformTaskFilters\(\) : \{\}/);
  assert.match(source, /tree: true/);
  assert.match(source, /states: \[state\.selectedState\]/);
  assert.doesNotMatch(source.match(/function platformTaskFilters\(\) \{[\s\S]*?\n\}/)?.[0] || "", /states: TASK_STATES/);
  assert.match(source, /scopedWorkspaces\.reduce\(\(sum, workspace\) => sum \+ Number\(workspace\.task_counts\?\.\[taskState\] \|\| 0\), 0\)/);
  assert.match(source, /hasTreeSummary \? matchedTotal : stateCounts\[state\.selectedState\]/);
  assert.match(source, /Number\.isInteger\(task\.tree_depth\)\) \? scopedTasks : rankTasks\(stateTasks\)/);
  assert.match(source, /task\.tree_depth/);
  assert.match(source, /data-work-inspector-subtask/);
  assert.match(source, /executeManagedAction\("task\.subtask\.create"/);
  assert.match(source, /executeManagedAction\("task\.reparent"/);
  assert.match(source, /function taskAttachmentPanel\(task\)/);
  assert.match(source, /task\.attachment\.create.*type: "text"/s);
  assert.match(source, /String\(item\.creator_id\) === userId/);
  assert.match(source, /\["owner", "admin"\]\.includes\(role\)/);
  assert.match(source, /data-task-attachment-retry/);
  assert.match(source, /renderRestrictedMarkdown\(task\.content\)/);
  assert.match(source, /api\.openWorkExternalLink\(button\.dataset\.taskMarkdownExternalLink\)/);
  for (const field of ["创建人", "执行人", "父待办", "优先级", "标签", "创建时间", "更新时间", "完成时间"]) assert.match(source, new RegExp(`\\["${field}"`));
  assert.match(source, /data-work-inspector-copy-reference/);
  assert.match(source, /import \{ renderRestrictedMarkdown, resolveWorkTaskReference, workTaskReference, workTaskReferenceSelection \} from "\.\/restricted-markdown\.mjs"/);
  assert.match(source, /navigator\.clipboard\.writeText\(workTaskReference\(task\)\)/);
  assert.match(source, /resolveWorkTaskReference\(reference, platform\)/);
  assert.match(source, /task_filters: \{ tree: false, states: TASK_STATES \}/);
  assert.match(source, /Object\.assign\(state, workTaskReferenceSelection\(target\)\)/);
  assert.match(source, /Automation 管理中的状态只可通过受控动作变更/);
  assert.match(styles, /\.work-filter-panel/);
  assert.match(styles, /\.task-comment-timeline/);
  assert.match(styles, /\.task-markdown-detail/);
  assert.match(styles, /\.task-markdown-detail blockquote/);
  assert.match(styles, /\.task-markdown-link[^}]+cursor: pointer/);
});

test("Work opens allowed Markdown links through a bounded main-process capability", async () => {
  const [main, preload] = await Promise.all([
    readFile(desktopMainPath, "utf8"),
    readFile(desktopPreloadPath, "utf8")
  ]);
  assert.match(preload, /openWorkExternalLink: \(value\) => ipcRenderer\.invoke\("arckit:work-external-link-open", value\)/);
  assert.match(main, /ipcMain\.handle\("arckit:work-external-link-open"/);
  assert.match(main, /assertMainRenderer\(event\)/);
  assert.match(main, /requireWorkExternalLinkUrl\(value\)/);
  assert.match(main, /await shell\.openExternal\(url\)/);
});

test("desktop renders and composes type-preserving TaskAttachment resources through bounded IPC", async () => {
  const [source, preload, main, styles] = await Promise.all([
    readFile(rendererPath, "utf8"),
    readFile(desktopPreloadPath, "utf8"),
    readFile(desktopMainPath, "utf8"),
    readFile(rendererStylesPath, "utf8")
  ]);
  assert.match(source, /parseTaskAttachmentContent\(item\)/);
  assert.match(source, /buildTaskCommentContent\(/);
  assert.match(source, /data-task-comment-add-image/);
  assert.match(source, /data-task-comment-add-file/);
  assert.match(source, /api\.previewWorkTaskAttachment\(input\)/);
  assert.match(source, /api\.openWorkTaskAttachment\(taskAttachmentResourceInput\(button\)\)/);
  assert.doesNotMatch(source, /options: \["text", "file", "url"\]/);
  assert.match(preload, /pickWorkTaskAttachment: \(input\) => ipcRenderer\.invoke\("arckit:work-task-attachment-pick", input\)/);
  assert.match(preload, /previewWorkTaskAttachment: \(input\) => ipcRenderer\.invoke\("arckit:work-task-attachment-preview", input\)/);
  assert.match(preload, /openWorkTaskAttachment: \(input\) => ipcRenderer\.invoke\("arckit:work-task-attachment-open", input\)/);
  assert.match(main, /ipcMain\.handle\("arckit:work-task-attachment-pick"/);
  assert.match(main, /platformCoordinator\.uploadTaskAttachmentResource/);
  assert.match(main, /ipcMain\.handle\("arckit:work-task-attachment-preview"/);
  assert.match(main, /platformCoordinator\.getTaskAttachmentResourceUrl/);
  assert.match(main, /ipcMain\.handle\("arckit:work-task-attachment-open"/);
  assert.match(styles, /\.task-comment-images/);
  assert.match(styles, /\.task-comment-pending-resources/);
});

test("desktop exposes Task Browser, on-demand Workbench, and Recovery Center as closed-loop views", async () => {
  const [source, html, styles] = await Promise.all([
    readFile(rendererPath, "utf8"),
    readFile(rendererHtmlPath, "utf8"),
    readFile(rendererStylesPath, "utf8")
  ]);

  assert.match(html, /data-page-view="tasks"/);
  assert.doesNotMatch(html, /id="searchButton"|搜索任务、项目或 Run/);
  assert.doesNotMatch(styles, /\.search-trigger/);
  assert.doesNotMatch(source, /els\.searchButton|event\.key\.toLowerCase\(\) === "k"/);
  assert.match(source, /data-feedback-task[\s\S]*else openTaskBrowser\(task\?\.state \|\| "completed", task\?\.id \|\| row\.dataset\.feedbackTask\)/);
  assert.match(source, /data-queue-task[\s\S]*openTaskBrowser\("pending", row\.dataset\.queueTask\)/);
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

test("Desktop gates automation behind bounded Setup Readiness plan and confirmation IPC", async () => {
  const [main, preload, source, html, styles] = await Promise.all([
    readFile(desktopMainPath, "utf8"), readFile(desktopPreloadPath, "utf8"),
    readFile(rendererPath, "utf8"), readFile(rendererHtmlPath, "utf8"), readFile(rendererStylesPath, "utf8")
  ]);
  assert.match(html, /id="setupReadiness"/);
  assert.match(html, /id="setupReviewed"/);
  assert.match(html, /id="setupRecoverButton"/);
  assert.match(html, /id="setupRecoveryGuideButton"/);
  assert.match(html, /id="setupCleanupPanel"/);
  assert.match(html, /id="setupCleanupSelectAll"/);
  assert.match(html, /id="setupCleanupButton"/);
  assert.match(html, /setupCleanupPanel[\s\S]+id="setupChecks"/);
  assert.match(html, /查看安装计划与写入目标/);
  assert.match(styles, /\.setup-readiness/);
  assert.match(source, /api\.applySetupPlan\(\{ planDigest:/);
  assert.match(source, /api\.recoverSetupUpgrade\(\{ assessmentDigest:/);
  assert.match(source, /backup-and-reinstall/);
  assert.match(source, /备份并按当前应用包重装/);
  assert.match(source, /建立新的受管理关系/);
  assert.match(source, /setupRecoveryGuide/);
  assert.match(source, /navigator\.clipboard\.writeText/);
  assert.match(source, /写入：未开始/);
  assert.match(source, /保留当前内容并退出/);
  assert.match(source, /item\.files\?\.length/);
  assert.match(source, /file\.status/);
  assert.match(source, /api\.planSetupRemoval/);
  assert.match(source, /confirmationDigest/);
  assert.match(source, /data-setup-cleanup-path/);
  assert.match(source, /function renderSetupCleanup\(\)/);
  assert.match(source, /setupCleanupSelectAll/);
  assert.match(source, /确认并清理所选/);
  assert.match(source, /filter\(\(item\) => selected\.has\(item\)\)/);
  assert.match(source, /SETUP_ACTION_FAILED/);
  assert.match(styles, /\.setup-cleanup-row/);
  assert.match(styles, /\.setup-cleanup-panel/);
  assert.match(styles, /\.toast[^}]+z-index: 1200/);
  assert.match(preload, /getSetupReadiness/);
  assert.match(preload, /removeManagedSetupPaths/);
  assert.match(preload, /recoverSetupUpgrade/);
  assert.match(preload, /checkSetupReadiness: \(input\) => ipcRenderer\.invoke\("arckit:setup-check", input\)/);
  assert.match(main, /setupReadinessPreflight: async \(projectRoot\)/);
  assert.match(main, /skillProvisioningManager\.assertReady\(projectRoot, \[\], store\.projects\.map/);
  assert.match(main, /checkDesktopSetupReadiness\(\{/);
  assert.match(source, /api\.checkSetupReadiness\(projectId \? \{ projectId \} : undefined\)/);
  assert.match(source, /setupRetryButton\.addEventListener[\s\S]+await checkSetupReadinessForSelection\(\)/);
  assert.match(source, /await api\.bindAutomationProject\(remoteId, localProjectId\);[\s\S]+await checkSetupReadinessForSelection\(localProjectId\)/);
  assert.match(source, /productScopeSelect\.addEventListener\("change"[\s\S]+await checkSetupReadinessForSelection\(\)/);
  assert.match(source, /plan\.project_roots/);
  assert.match(source, /plan\.loader_targets/);
  assert.match(main, /runtimeCwd: app\.isPackaged \? process\.resourcesPath : runtimeRoot/);
  assert.match(main, /if \(readiness\.status !== "ready"\)/);
  assert.doesNotMatch(preload, /providerLoader|sourceRoot|execFile|writeFile/);
});

test("Desktop resolves project-scoped Setup checks from the trusted local workspace store", () => {
  const store = {
    projects: [
      { id: "LOCAL-B", path: "./fixtures/project-b" },
      { id: "LOCAL-A", path: "./fixtures/project-a" }
    ]
  };

  assert.equal(desktopSetupCheckInput(store), undefined);
  assert.deepEqual(desktopSetupCheckInput(store, { projectId: "LOCAL-A" }), {
    projectRoot: [
      resolve("./fixtures/project-a"),
      resolve("./fixtures/project-b")
    ].sort()
  });
  store.projects[1].path = "./fixtures/project-a-moved";
  assert.deepEqual(desktopSetupCheckInput(store, { projectId: "LOCAL-A" }).projectRoot, [
    resolve("./fixtures/project-a-moved"),
    resolve("./fixtures/project-b")
  ].sort());
  assert.throws(
    () => desktopSetupCheckInput(store, { projectId: "UNKNOWN" }),
    /Unknown local Product Workspace/
  );
});

test("Desktop Setup IPC behavior preserves global checks and sends fresh associated roots for a selected project", async () => {
  let storeReads = 0;
  const checkedInputs = [];
  const store = { projects: [
    { id: "LOCAL-A", path: "./fixtures/project-a" },
    { id: "LOCAL-B", path: "./fixtures/project-b" }
  ] };
  const dependencies = {
    readDesktopStore: async () => { storeReads += 1; return store; },
    check: async (input) => { checkedInputs.push(input); return { status: "ready", input }; }
  };

  await checkDesktopSetupReadiness(dependencies);
  assert.equal(storeReads, 0);
  assert.equal(checkedInputs[0], undefined);

  const scoped = await checkDesktopSetupReadiness({ ...dependencies, input: { projectId: "LOCAL-A" } });
  assert.equal(storeReads, 1);
  assert.deepEqual(scoped.input.projectRoot, [resolve("./fixtures/project-a"), resolve("./fixtures/project-b")].sort());

  store.projects[0].path = "./fixtures/project-a-moved";
  const moved = await checkDesktopSetupReadiness({ ...dependencies, input: { projectId: "LOCAL-A" } });
  assert.equal(storeReads, 2);
  assert.deepEqual(moved.input.projectRoot, [resolve("./fixtures/project-a-moved"), resolve("./fixtures/project-b")].sort());
});

test("workbench transcript prioritizes Loop and Agent output while reducing tools to one-line summaries", () => {
  assert.equal(transcriptMessageType({ role: "assistant", actor: "agent", kind: "result" }), "agent");
  assert.equal(transcriptMessageType({ role: "assistant", actor: "agent", kind: "status" }), "loop");
  assert.equal(transcriptMessageType({ role: "tool", actor: "tool", kind: "command" }), "tool");
  assert.equal(transcriptMessageType({ role: "user" }), "user");
  assert.equal(transcriptMessageType({ role: "assistant", actor: "agent", kind: "reasoning" }), "reasoning");
  assert.equal(transcriptMessageType({ role: "assistant", actor: "agent", kind: "structured" }), "structured");

  assert.equal(summarizeToolActivity({ content: "sed -n '1,240p' runtime/arcorbit/desktop/renderer/renderer.js" }), "读取 runtime/arcorbit/desktop/renderer/renderer.js");
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
  const [main, preload, source, html] = await Promise.all([
    readFile(desktopMainPath, "utf8"),
    readFile(desktopPreloadPath, "utf8"),
    readFile(rendererPath, "utf8"),
    readFile(rendererHtmlPath, "utf8")
  ]);

  for (const channel of [
    "arckit:setup-status",
    "arckit:setup-check",
    "arckit:setup-apply",
    "arckit:setup-recover-upgrade",
    "arckit:setup-removal-plan",
    "arckit:setup-remove",
    "arckit:setup-continue",
    "arckit:automation-snapshot",
    "arckit:automation-sync",
    "arckit:automation-enabled",
    "arckit:automation-pause",
    "arckit:automation-bind-project",
    "arckit:automation-project-participation",
    "arckit:automation-task-state",
    "arckit:automation-intervene",
    "arckit:automation-acceptance-feedback",
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
  assert.match(source, /Arckit skills <strong>\$\{availability\.arckit_total\}/);
  assert.match(source, /user-ambient \$\{availability\.user_ambient\}/);
  assert.match(source, /shared assets \$\{availability\.shared_assets\}/);
  assert.match(source, /plan\.shared_assets/);
  assert.match(source, /ArcForge loader \$\{availability\.arcforge_loader_targets\}/);
  assert.match(source, /补充说明并继续/);
  assert.match(source, /data-recovery-feedback/);
  assert.match(source, /openWorkbench\("review"\)/);
  assert.match(html, /id="automationRefreshButton"[^>]*>立即同步<\/button>/);
  assert.match(source, /automationRefreshButton\.addEventListener\("click", \(\) => runAction\(syncAutomationNow\)\)/);
  assert.match(main, /syncTimer = setInterval[\s\S]+15 \* 60_000/);
  assert.doesNotMatch(main, /fallbackSyncTimer/);
  assert.doesNotMatch(preload, /fetch|httpRequest|requestUrl/);
  assert.doesNotMatch(preload, /startRun:|controlRun:|gateRun:|writeLedger:/);
  assert.doesNotMatch(preload, /addMessage:|createSession:|deleteSession:|addProject:/);
  assert.doesNotMatch(main, /arckit:start-run|arckit:control-run|arckit:gate-run|arckit:write-ledger/);
  assert.doesNotMatch(source, /\bfetch\s*\(/);
});

test("desktop main and preload expose bounded platform composition IPC without credentials or generic requests", async () => {
  const [main, preload] = await Promise.all([
    readFile(desktopMainPath, "utf8"),
    readFile(desktopPreloadPath, "utf8")
  ]);
  for (const channel of [
    "arckit:platform-snapshot",
    "arckit:platform-workset-create",
    "arckit:platform-workset-update",
    "arckit:platform-workset-delete",
    "arckit:platform-workset-active",
    "arckit:platform-workspace-preference"
  ]) {
    const pattern = new RegExp(channel.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"));
    assert.match(main, pattern);
    assert.match(preload, pattern);
  }
  assert.match(main, /createPlatformCoordinator/);
  assert.match(preload, /platformSnapshot: \(input\)/);
  assert.match(preload, /createWorkset: \(input\)/);
  assert.match(preload, /setActiveWorkset: \(worksetId\)/);
  assert.doesNotMatch(preload, /access_token|refresh_token|apiKey|sessionToken|genericRequest/);
});

test("ArcOrbit exposes one authenticated in-product feedback entry without user configuration", async () => {
  const [main, preload, source, html] = await Promise.all([
    readFile(desktopMainPath, "utf8"),
    readFile(desktopPreloadPath, "utf8"),
    readFile(rendererPath, "utf8"),
    readFile(rendererHtmlPath, "utf8")
  ]);
  assert.match(html, /id="productFeedbackButton"/);
  assert.match(html, /id="productFeedbackUnreadBadge"/);
  assert.doesNotMatch(html, /productFeedbackSettings|productFeedbackProjectId|productFeedbackApiKey/);
  assert.match(source, /api\.openProductFeedback\("submit"\)/);
  assert.match(source, /api\.refreshProductFeedbackUnread\(\)/);
  assert.match(source, /api\.onProductFeedbackUnread/);
  assert.match(source, /登录 Workshop 后即可使用 ArcOrbit 产品反馈/);
  assert.doesNotMatch(source, /saveProductFeedbackConfig|clearProductFeedbackConfig|留空保留现有 Key/);
  for (const channel of [
    "arckit:product-feedback-status",
    "arckit:product-feedback-open",
    "arckit:product-feedback-refresh-unread"
  ]) {
    const pattern = new RegExp(channel.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"));
    assert.match(main, pattern);
    assert.match(preload, pattern);
  }
  assert.doesNotMatch(`${main}\n${preload}`, /product-feedback-save|product-feedback-clear|product-feedback-console/);
  assert.doesNotMatch(preload, /apiKey|customUserId/);
  assert.doesNotMatch(preload, /fetch|httpRequest|executeJavaScript|loadURL/);
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
