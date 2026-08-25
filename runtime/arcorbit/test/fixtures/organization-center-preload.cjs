const { contextBridge } = require("electron");

const calls = [];
const automationListeners = new Set();
const workSyncListeners = new Set();
const workDetailRefreshTest = process.env.ARCORBIT_WORK_DETAIL_REFRESH_FIXTURE === "1";
const taskAttachments = workDetailRefreshTest ? {
  "W-11": [{ id: "TA-W-11-1", task_id: "W-11", creator_id: "7", type: "text", content: "[image](work/W-11/progress.png) Preview update", created_at: "2026-08-25T10:00:00Z" }]
} : {};
let workQueryDelayMs = 0;
let workQueryFailure = "";
let workQueryScenarios = [];
let createdTaskSequence = 0;
const feedbackV2ImageTest = process.env.ARCORBIT_ELECTRON_FEEDBACK_V2_TEST === "1";
let failedFeedbackV2ImagePreview = false;
const automation = {
  enabled: false, queue_paused: false, source_status: "healthy", synced_at: "2026-08-18T00:00:00Z",
  user: { id: "7", name: "Glare" },
  local_projects: [{ id: "local-11", name: "ArcOrbit Local", path: "/repo/arcorbit" }],
  projects: [
    { id: "11", name: "ArcOrbit", local_project_id: "local-11", participating: true, eligible: true, source_status: "healthy", task_counts: { pending: 1 } },
    { id: "12", name: "Workshop Todo", local_project_id: "", participating: false, eligible: false, source_status: "healthy", task_counts: { pending: 0 } },
    { id: "21", name: "Personal Lab", local_project_id: "", participating: false, eligible: false, source_status: "healthy", task_counts: { pending: 1 } }
  ],
  tasks: [
    { id: "W-COMPLETED", project_id: "11", project_name: "ArcOrbit", title: "Completed work", content: "Ready for acceptance check", state: "completed", state_label: "已完成", acceptance_feedback_items: [], eligible: false },
    { id: "W-ACCEPTED", project_id: "11", project_name: "ArcOrbit", title: "Accepted work", content: "Already accepted", state: "accepted", state_label: "已验收", acceptance_feedback_items: [], eligible: false }
  ], queue: [], todo_queue: [],
  blocked_pending_tasks: [], state_counts: { pending: 2 },
  active_execution: { task_id: "T-21", project_id: "21", task_title: `Outside Workset active execution\n${"👩‍💻".repeat(65)}`, phase: "remote_completion_pending", case_id: "CASE-OUTSIDE", run_id: "RUN-OUTSIDE" },
  active_task: { task_id: "T-21", project_id: "21", task_title: `Outside Workset active execution\n${"👩‍💻".repeat(65)}`, phase: "remote_completion_pending", case_id: "CASE-OUTSIDE", run_id: "RUN-OUTSIDE" },
  active_run: null,
  attention_items: [],
  recovery_items: [{ id: "RECOVERY-global", type: "multiple_active_tasks", task_id: "multiple", project_id: "", message: "Global recovery remains visible", freeze_scope: "global", responsibility: "operator", actions: ["retry_sync"] }],
  recent_completions: [],
  acceptance_feedback_queue: [
    { feedback_id: "AF-11", source_project_id: "11", source_task_id: "T-11", original_feedback: "Workset feedback", progress: "queued", status: "queued", queue_position: 1 },
    { feedback_id: "AF-21", source_project_id: "21", source_task_id: "T-21", original_feedback: "Outside feedback", progress: "queued", status: "queued", queue_position: 2 }
  ],
  acceptance_feedback_counts: { open: 2 }, health: { state: "ready", label: "待命", tone: "success" }
};
const projects = [
  { id: "11", name: "ArcOrbit", organization_id: "31", git_url: "https://example.test/arcorbit", current_user_role: "owner", local_project_path: "/repo/arcorbit", participating: true, eligible: true },
  { id: "12", name: "Workshop Todo", organization_id: "31", git_url: "", current_user_role: "member", local_project_path: "", participating: false, eligible: false },
  { id: "21", name: "Personal Lab", organization_id: "", git_url: "", current_user_role: "owner", local_project_path: "", participating: false, eligible: false }
];
const members = [
  { id: "91", user_id: "7", organization_id: "31", username: "Glare", role: "owner", is_me: true, created_at: "2026-01-01" },
  { id: "92", user_id: "8", organization_id: "31", username: "Lin", role: "admin", is_me: false, created_at: "2026-02-01" }
];
const projectMembers = [
  { id: "101", user_id: "7", project_id: "11", project_name: "ArcOrbit", username: "Glare", role: "owner", duty: "产品与实现", is_me: true },
  { id: "102", user_id: "8", project_id: "11", project_name: "ArcOrbit", username: "Lin", role: "member", duty: "反馈运营", is_me: false },
  { id: "104", user_id: "9", project_id: "11", project_name: "ArcOrbit", username: "", role: "member", duty: "姓名缺失回归", is_me: false },
  { id: "103", user_id: "8", project_id: "12", project_name: "Workshop Todo", username: "Lin", role: "owner", duty: "产品", is_me: false }
];
const tags = [
  { id: "201", project_id: "11", project_name: "ArcOrbit", name: "[Bug](#ffff0000)" },
  { id: "202", project_id: "11", project_name: "ArcOrbit", name: "[Desktop](#ff6b7280)" },
  { id: "203", project_id: "12", project_name: "Workshop Todo", name: "[Docs](#ff2563eb)" }
];
const platform = {
  generated_at: "2026-08-18T00:00:00Z", source_status: "healthy", user: { id: "7", name: "Glare" },
  worksets: [{ id: "WORKSET-DEFAULT", name: "核心推进", project_ids: ["11", "12"] }],
  active_workset: { id: "WORKSET-DEFAULT", name: "核心推进", project_ids: ["11", "12"] },
  projects, organizations: [{ id: "31", name: "飞天橙子", description: "产品组织" }],
  organization_scopes: [{ id: "31", name: "飞天橙子", description: "产品组织", current_user_role: "owner", project_visibility: "all_projects", members, projects: projects.slice(0, 2), degraded: false }],
  personal_projects: [projects[2]], organization_members: members, project_members: projectMembers,
  product_workspaces: projects.slice(0, 2).map((project) => ({
    ...project,
    preference: {},
    task_counts: project.id === "11" ? { pending: 4, completed: 1, accepted: 1 } : { pending: 1 },
    feedback_count: 0,
    members: projectMembers.filter((member) => member.project_id === project.id),
    tasks: [],
    feedback_v1: [],
    feedback_management: feedbackV2ImageTest && project.id === "11"
      ? { status: "available", features: { messages: true, mark_read: true }, errors: {}, unread_count: 1, unread_feedback_ids: ["F-11-V2"] }
      : { status: "unavailable", features: {}, errors: {}, unread_count: 0, unread_feedback_ids: [] },
    tags: tags.filter((tag) => tag.project_id === project.id)
  })),
  members: projectMembers,
  tasks: [
    { id: "W-11", project_id: "11", project_name: "ArcOrbit", title: "legacy unbounded task title", content: `Verify Work state scope\n${"👩‍💻".repeat(65)}`, state: "pending", terminal: false, priority: 99, raw: { priority: 1 }, executor_id: "7", assignee: null, tags: "201" },
    { id: "W-NAMELESS", project_id: "11", project_name: "ArcOrbit", title: "Member without a name", content: "Resolve a project member without exposing the id", state: "pending", terminal: false, priority: 97, raw: { priority: 1 }, executor_id: "9", assignee: null, tags: "" },
    { id: "W-UNKNOWN", project_id: "11", project_name: "ArcOrbit", title: "Unknown executor", content: "Keep an unresolved executor id internal", state: "pending", terminal: false, priority: 96, raw: { priority: 1 }, executor_id: "999", assignee: null, tags: "" },
    { id: "W-UNASSIGNED", project_id: "11", project_name: "ArcOrbit", title: "Unassigned task", content: "Show the unassigned state", state: "pending", terminal: false, priority: 95, raw: { priority: 1 }, executor_id: "", assignee: null, tags: "" },
    { id: "W-COMPLETED", project_id: "11", project_name: "ArcOrbit", title: "Completed work", content: "Ready for acceptance check", state: "completed", terminal: true, priority: 99, raw: { priority: 1 }, executor_id: "7", assignee: { id: "7", username: "Glare" }, tags: "" },
    { id: "W-ACCEPTED", project_id: "11", project_name: "ArcOrbit", title: "Accepted work", content: "Already accepted", state: "accepted", terminal: true, priority: 99, raw: { priority: 1 }, executor_id: "7", assignee: { id: "7", username: "Glare" }, tags: "" },
    { id: "W-12", project_id: "12", project_name: "Workshop Todo", title: "Other project work", content: "Must be filtered", state: "pending", terminal: false, priority: 98, raw: { priority: 2 }, executor_id: "8", assignee: { id: "8", username: "Lin" }, tags: "203" }
  ],
  feedback_v1: [
    ...(feedbackV2ImageTest ? [{ id: "F-11-V2", short_id: "FB12", project_id: "11", project_name: "ArcOrbit", feedback_source: "v2", title: "V2 conversation feedback", content: "Validate bilateral message images", priority: "P2", ignored: false, linked_task_id: "", custom_user_id: "v2-customer", user_phone: "", user_email: "", file: "", created_at: "2026-08-20T10:00:00Z", updated_at: "2026-08-20T10:00:00Z", metadata: {} }] : []),
    { id: "F-11", short_id: "FB11", project_id: "11", project_name: "ArcOrbit", title: "Scoped feedback", content: "Visible in the selected product", priority: "P1", ignored: false, linked_task_id: "", custom_user_id: "customer-11", user_phone: "13800000011", user_email: "customer11@example.test", file: "https://example.test/feedback/F-11.png", created_at: "2026-08-19T10:00:00Z", updated_at: "2026-08-19T10:00:00Z", metadata: {} },
    { id: "F-11-LINKED", short_id: "FB10", project_id: "11", project_name: "ArcOrbit", title: "Already linked feedback", content: "Continue from the existing todo", priority: "P2", ignored: false, linked_task_id: "W-11", linked_task_state: "pending", custom_user_id: "customer-linked", user_phone: "", user_email: "", file: "", created_at: "2026-08-18T10:00:00Z", updated_at: "2026-08-18T10:00:00Z", metadata: { task_id: "W-11", task_state: "pending" } },
    { id: "F-12", short_id: "FB12", project_id: "12", project_name: "Workshop Todo", title: "Other feedback", content: "Must be filtered", priority: "P2", ignored: false, linked_task_id: "", created_at: "2026-08-19T08:00:00Z", updated_at: "2026-08-19T08:00:00Z", metadata: {} }
  ], tags,
  automation: { ...automation, acceptance_feedback_counts: { open: 0 } },
  capabilities: { organizations: "available", organization_governance: "available", project_members: "managed_with_permissions_except_direct_add", invitation_lifecycle: "create_once_no_list_or_revoke", feedback_v1: "read_write", feedback_v2: feedbackV2ImageTest ? "available" : "unavailable" }, errors: []
};

const noOp = async () => ({});
contextBridge.exposeInMainWorld("arckitDesktop", {
  getSetupReadiness: async () => ({ status: "ready", first_install: false, checks: [], distribution: {}, counts: {} }),
  continueFromSetup: noOp,
  getSettings: async () => ({ task_source: { enabled: true, auth_mode: "nebula" }, codex_proxy: {} }),
  getProductFeedbackStatus: async () => ({
    integration_mode: "sdk-webview", sdk_auth_mode: "apiKey", notifications_enabled: true,
    credential_strategy: "bundled-static", configured: true, project_id: 107, unread_count: 0
  }),
  openProductFeedback: async () => ({ status: "opened", mode: "submit" }),
  refreshProductFeedbackUnread: async () => ({ status: "ready", unread_count: 0 }),
  getAuthStatus: async () => ({ status: "authenticated", authenticated: true, identity: "glare@example.test", masked_identity: "g***@example.test" }),
  chatSnapshot: async () => ({ generated_at: "", projects: [], sessions: [], selected_session_id: "", messages: [], draft: { project_id: "", text: "" } }),
  createChat: noOp, selectChat: noOp, deleteChat: noOp, renameChat: noOp,
  interruptChat: noOp, decideChatApproval: noOp, sendChatMessage: noOp,
  automationSnapshot: async () => automation,
  platformSnapshot: async (input) => {
    calls.push(["platformSnapshot", input]);
    return platform;
  },
  platformWorkQuery: async (input) => {
    calls.push(["platformWorkQuery", input]);
    const scenario = workQueryScenarios.shift() || null;
    const delayMs = scenario ? scenario.delay_ms : workQueryDelayMs;
    const sourceTasks = scenario ? scenario.tasks : platform.tasks;
    if (delayMs > 0) await new Promise((resolve) => setTimeout(resolve, delayMs));
    if (workQueryFailure) {
      const message = workQueryFailure;
      workQueryFailure = "";
      throw new Error(message);
    }
    const selected = sourceTasks.filter((task) => (
      (input.project_id === "all" || String(task.project_id) === String(input.project_id))
      && (task.state === input.state)
      && (!input.search_key || `${task.title} ${task.content}`.toLowerCase().includes(String(input.search_key).toLowerCase()))
    ));
    const offset = Math.max(0, Number(input.offset) || 0);
    const limit = Math.max(1, Number(input.limit) || 80);
    const tasks = selected.slice(offset, offset + limit);
    const taskTrees = platform.product_workspaces
      .filter((workspace) => input.project_id === "all" || String(workspace.id) === String(input.project_id))
      .map((workspace) => {
        const matches = selected.filter((task) => String(task.project_id) === String(workspace.id));
        return { project_id: String(workspace.id), total: matches.length, matched_total: matches.length, tasks: [] };
      });
    return {
      schema_version: "arcorbit-work-query/v1",
      query_key: input.query_key,
      generated_at: new Date().toISOString(),
      source_status: "healthy",
      active_workset: platform.active_workset,
      projects: platform.projects.filter((project) => input.project_id === "all" || String(project.id) === String(input.project_id)),
      product_workspaces: platform.product_workspaces
        .filter((workspace) => input.project_id === "all" || String(workspace.id) === String(input.project_id))
        .map((workspace) => ({ ...workspace, tasks: tasks.filter((task) => String(task.project_id) === String(workspace.id)), task_counts: { ...workspace.task_counts, [input.state]: selected.filter((task) => String(task.project_id) === String(workspace.id)).length }, task_tree: taskTrees.find((tree) => tree.project_id === String(workspace.id)) || null })),
      tasks,
      task_trees: taskTrees,
      tags: platform.tags.filter((tag) => input.project_id === "all" || String(tag.project_id) === String(input.project_id)),
      window: { offset, limit, returned: tasks.length, total: selected.length, has_more: offset + tasks.length < selected.length },
      errors: []
    };
  },
  onSetupEvent: () => () => {},
  onAutomationEvent: (listener) => { automationListeners.add(listener); return () => automationListeners.delete(listener); },
  onWorkSyncEvent: (listener) => { workSyncListeners.add(listener); return () => workSyncListeners.delete(listener); },
  onEvent: () => () => {}, onChatEvent: () => () => {}, onProductFeedbackUnread: () => () => {},
  setActiveWorkset: noOp,
  syncAutomation: async () => { calls.push(["syncAutomation", {}]); return automation; },
  setAutomationEnabled: noOp, setQueuePaused: noOp,
  getFeedbackV2Messages: async (input) => {
    calls.push(["getFeedbackV2Messages", input]);
    return [{
      id: "M-F-11-V2-1", sender_type: "customer", content: "V2 message with a screenshot", created_at: "2026-08-20T10:05:00Z",
      attachments: [{ id: "A-F-11-V2-1", type: "image", object_key: "feedback/F-11-V2/reply.png", file_name: "reply.png", mime_type: "image/png" }]
    }];
  },
  markFeedbackV2Read: async (input) => { calls.push(["markFeedbackV2Read", input]); return { marked_count: 1 }; },
  updateWorkset: async (input) => { calls.push(["updateWorkset", input]); platform.active_workset.project_ids = input.project_ids; return input; },
  executePlatformAction: async (command, input) => {
    calls.push([command, input]);
    if (command === "task.attachments.list") return taskAttachments[String(input.task_id)] || [];
    if (command === "task.attachment.create") return { id: `TA-${String(input.task_id)}-NEW`, task_id: String(input.task_id), creator_id: "7", type: input.type, content: input.content };
    if (command === "task.create") {
      const projectId = String(input.project_id);
      const project = projects.find((item) => item.id === projectId);
      const member = projectMembers.find((item) => item.project_id === projectId && String(item.user_id) === String(input.executor_id));
      const task = {
        id: `W-LOCAL-${++createdTaskSequence}`,
        project_id: projectId,
        project_name: project?.name || `Project ${projectId}`,
        content: input.content,
        state: "pending_review",
        terminal: false,
        priority: 0,
        raw: { priority: input.priority },
        executor_id: String(input.executor_id || ""),
        assignee: member ? { id: String(member.user_id), username: member.username } : null,
        tags: input.tags || "",
        created_at: "2026-08-24T12:00:00Z",
        updated_at: "2026-08-24T12:00:00Z"
      };
      platform.tasks.push(task);
      const workspace = platform.product_workspaces.find((item) => String(item.id) === projectId);
      if (workspace) workspace.task_counts.pending_review = Number(workspace.task_counts.pending_review || 0) + 1;
      if (String(input.executor_id) === String(automation.user.id)) {
        automation.tasks.push({
          ...task,
          state_label: "待评审",
          local_project_path: "/repo/arcorbit",
          eligible: false,
          eligibility_reason: "任务当前不是待处理状态",
          acceptance_feedback_items: []
        });
        for (const listener of automationListeners) listener({ type: "automation.changed", reason: "project-refresh", projectId });
      }
      return task;
    }
    if (command.endsWith(".invite")) return { invite_code: "ABCD1234", invite_link: "https://example.test/invite/ABCD1234", role: input.role, expires_at: "2026-08-19T00:00:00Z", max_uses: Number(input.max_uses), used_count: 0 };
    if (command === "tag.create") {
      const tag = { id: String(204 + tags.length), project_id: String(input.project_id), project_name: projects.find((project) => project.id === String(input.project_id))?.name || "", name: input.name };
      tags.push(tag);
      return tag;
    }
    if (command === "tag.update") {
      const tag = tags.find((item) => item.id === String(input.tag_id));
      if (tag) tag.name = input.name;
      return tag || {};
    }
    if (command === "tag.delete") {
      const index = tags.findIndex((item) => item.id === String(input.tag_id));
      if (index >= 0) tags.splice(index, 1);
      return { deleted: index >= 0 };
    }
    return { ok: true };
  },
  previewImage: async (input) => {
    calls.push(["previewImage", input]);
    if (feedbackV2ImageTest && input.source === "feedback-v2" && !failedFeedbackV2ImagePreview) {
      failedFeedbackV2ImagePreview = true;
      throw new Error("Fixture V2 image preview failed once");
    }
    return { data_url: "data:image/png;base64,AQID" };
  },
  openImageViewer: async (input) => { calls.push(["openImageViewer", input]); return { opened: true }; },
  openFeedbackAttachment: async (value) => { calls.push(["openFeedbackAttachment", value]); return { opened: true }; },
  previewWorkTaskAttachment: async (input) => {
    calls.push(["previewWorkTaskAttachment", input]);
    if (workDetailRefreshTest) await new Promise((resolve) => setTimeout(resolve, 500));
    return { data_url: "data:image/png;base64,AQID" };
  },
  pickWorkTaskAttachment: async () => null,
  openWorkTaskAttachment: async (input) => { calls.push(["openWorkTaskAttachment", input]); return { opened: true }; },
  openWorkExternalLink: async (value) => { calls.push(["openWorkExternalLink", value]); return { opened: true }; },
  getTestCalls: async () => calls,
  setTestPlatformSnapshotDelay: async (value) => { workQueryDelayMs = Math.max(0, Number(value) || 0); },
  queueTestPlatformWorkQueries: async (scenarios) => {
    workQueryScenarios = (Array.isArray(scenarios) ? scenarios : []).map((scenario) => ({
      delay_ms: Math.max(0, Number(scenario?.delay_ms) || 0),
      tasks: Array.isArray(scenario?.tasks) ? scenario.tasks : []
    }));
  },
  failNextTestPlatformSnapshot: async (message) => { workQueryFailure = String(message || "Work query failed"); },
  setTestPlatformTasks: async (tasks) => {
    platform.tasks = Array.isArray(tasks) ? tasks : [];
    platform.product_workspaces = platform.product_workspaces.map((workspace) => {
      const workspaceTasks = platform.tasks.filter((task) => String(task.project_id) === String(workspace.id));
      const taskCounts = workspaceTasks.reduce((counts, task) => ({ ...counts, [task.state]: Number(counts[task.state] || 0) + 1 }), {});
      return { ...workspace, task_counts: taskCounts };
    });
  },
  pickProject: async () => ({ id: "local-new", name: "New Local", path: "/repo/new-local" }),
  setProjectParticipation: noOp,
  bindAutomationProject: async (remoteId, localId) => { calls.push(["bindAutomationProject", { remoteId, localId }]); return {}; },
  listRuns: async () => [], listMessages: async () => [],
  checkSetupReadiness: async () => ({ status: "ready", first_install: false, checks: [], distribution: {}, counts: {} }),
  applySetupPlan: noOp, recoverSetupUpgrade: noOp, planSetupRemoval: noOp, removeManagedSetupPaths: noOp,
  submitAcceptanceFeedback: noOp, submitIntervention: noOp,
  resolveAutomationRecovery: async (input) => { calls.push(["resolveAutomationRecovery", input]); return {}; },
  updateAutomationTaskState: noOp,
  handoffAutomationToCli: noOp, reopenAutomationCli: noOp, resumeAutomationRuntime: noOp, stopAutomationRun: noOp,
  sendAuthVerification: noOp, loginWithCode: noOp, logoutAuth: noOp, updateSettings: noOp,
  setTestRecoveryItems: async (items) => { automation.recovery_items = items; },
  emitTestAutomationEvent: async (event = { type: "automation.changed" }) => {
    for (const listener of automationListeners) listener(event);
  },
  emitTestWorkSyncEvent: async (event = { type: "work-sync.changed" }) => {
    for (const listener of workSyncListeners) listener(event);
  }
});
