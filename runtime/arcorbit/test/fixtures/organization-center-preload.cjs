const { contextBridge } = require("electron");

const calls = [];
const automationListeners = new Set();
const workSyncListeners = new Set();
const taskStates = ["pending_review", "pending", "in_progress", "completed", "accepted", "cancelled", "blocked"];
const workDetailRefreshTest = process.env.ARCORBIT_WORK_DETAIL_REFRESH_FIXTURE === "1";
const taskAttachments = workDetailRefreshTest ? {
  "W-11": [{ id: "TA-W-11-1", task_id: "W-11", creator_id: "7", type: "text", content: "[image](work/W-11/progress.png) Preview update", created_at: "2026-08-25T10:00:00Z" }]
} : {};
let workQueryDelayMs = 0;
let workQueryFailure = "";
let workQueryScenarios = [];
let platformSnapshotBarrier = null;
let acceptanceActionBarrier = null;
let settingsBarrier = null;
let createdTaskSequence = 0;
let taskReplacementScenario = "success";
const feedbackV2ImageTest = process.env.ARCORBIT_ELECTRON_FEEDBACK_V2_TEST === "1";
const workAcceptanceReplacementTest = process.env.ARCORBIT_WORK_ACCEPTANCE_REPLACEMENT_TEST === "1";
const workAcceptanceLogoutTest = process.env.ARCORBIT_WORK_ACCEPTANCE_LOGOUT_TEST === "1";
const todayCreateIdentityMode = String(process.env.ARCORBIT_TODAY_CREATE_IDENTITY_MODE || "");
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
    { id: "W-RUNNING", project_id: "11", project_name: "ArcOrbit", title: "Running work", content: "Inspect the associated Runtime", state: "in_progress", state_label: "进行中", acceptance_feedback_items: [], eligible: false, local_project_path: "/repo/arcorbit" },
    { id: "W-COMPLETED", project_id: "11", project_name: "ArcOrbit", title: "Completed work", content: "Ready for acceptance check", state: "completed", state_label: "已完成", acceptance_feedback_items: [{ feedback_id: "AF-WRAP", original_feedback: `验收问题${"UnbrokenAcceptanceIssue".repeat(18)}`, progress: `进展${"UnbrokenProgress".repeat(12)}`, status: "queued" }], eligible: false },
    { id: "W-ACCEPTED", project_id: "11", project_name: "ArcOrbit", title: "Accepted work", content: "Already accepted", state: "accepted", state_label: "已验收", acceptance_feedback_items: [], eligible: false }
  ], queue: [], todo_queue: [],
  blocked_pending_tasks: [], state_counts: { pending: 2 },
  active_executions: [
    { execution_id: "EXECUTION-OUTSIDE", workspace_key: "local-21", task_id: "T-21", project_id: "21", task_title: `Outside Workset active execution\n${"👩‍💻".repeat(65)}`, phase: "remote_completion_pending", case_id: "CASE-OUTSIDE", run_id: "RUN-OUTSIDE" },
    { execution_id: "EXECUTION-W-RUNNING", workspace_key: "local-11", task_id: "W-RUNNING", project_id: "11", task_title: "Running work", phase: "running", case_id: "CASE-W-RUNNING", run_id: "RUN-W-RUNNING" }
  ],
  active_execution: { execution_id: "EXECUTION-OUTSIDE", workspace_key: "local-21", task_id: "T-21", project_id: "21", task_title: `Outside Workset active execution\n${"👩‍💻".repeat(65)}`, phase: "remote_completion_pending", case_id: "CASE-OUTSIDE", run_id: "RUN-OUTSIDE" },
  active_task: { task_id: "T-21", project_id: "21", task_title: `Outside Workset active execution\n${"👩‍💻".repeat(65)}`, phase: "remote_completion_pending", case_id: "CASE-OUTSIDE", run_id: "RUN-OUTSIDE" },
  active_run: null,
  attention_items: [],
  recovery_items: [{ id: "RECOVERY-global", type: "multiple_active_tasks", task_id: "multiple", project_id: "", message: "Global recovery remains visible", freeze_scope: "global", responsibility: "operator", actions: ["retry_sync"] }],
  recent_completions: [{ task_id: "W-COMPLETED", project_id: "11", run_id: "RUN-W-COMPLETED", title: "Completed work", completed_at: "2026-08-25T12:00:00Z" }],
  acceptance_feedback_queue: [
    { feedback_id: "AF-11", source_project_id: "11", source_task_id: "T-11", original_feedback: "Workset feedback", progress: "queued", status: "queued", queue_position: 1 },
    { feedback_id: "AF-21", source_project_id: "21", source_task_id: "T-21", original_feedback: "Outside feedback", progress: "queued", status: "queued", queue_position: 2 }
  ],
  acceptance_feedback_counts: { open: 2 }, health: { state: "ready", label: "待命", tone: "success" }
};
const projects = [
  { id: "11", name: "ArcOrbit", organization_id: "31", git_url: "https://example.test/arcorbit", current_user_id: "7", current_user_role: "owner", local_project_path: "/repo/arcorbit", participating: true, eligible: true },
  { id: "12", name: "Workshop Todo", organization_id: "31", git_url: "", current_user_id: "8", current_user_role: "member", local_project_path: "", participating: false, eligible: false },
  { id: "21", name: "Personal Lab", organization_id: "", git_url: "", current_user_id: "7", current_user_role: "owner", local_project_path: "", participating: false, eligible: false }
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
    { id: "W-RUNNING", project_id: "11", project_name: "ArcOrbit", title: "Running work", content: "Inspect the associated Runtime", state: "in_progress", terminal: false, priority: 99, raw: { priority: 1 }, executor_id: "7", assignee: { id: "7", username: "Glare" }, tags: "" },
    { id: "W-11", project_id: "11", project_name: "ArcOrbit", title: "legacy unbounded task title", content: `Verify Work state scope\n${"👩‍💻".repeat(65)}`, state: "pending", terminal: false, priority: 99, raw: { priority: 1 }, executor_id: "7", assignee: null, tags: "201" },
    { id: "W-NAMELESS", project_id: "11", project_name: "ArcOrbit", title: "Member without a name", content: "Resolve a project member without exposing the id", state: "pending", terminal: false, priority: 97, raw: { priority: 1 }, executor_id: "9", assignee: null, tags: "" },
    { id: "W-UNKNOWN", project_id: "11", project_name: "ArcOrbit", title: "Unknown executor", content: "Keep an unresolved executor id internal", state: "pending", terminal: false, priority: 96, raw: { priority: 1 }, executor_id: "999", assignee: null, tags: "" },
    { id: "W-UNASSIGNED", project_id: "11", project_name: "ArcOrbit", title: "Unassigned task", content: "Show the unassigned state", state: "pending", terminal: false, priority: 95, raw: { priority: 1 }, executor_id: "", assignee: null, tags: "" },
    { id: "W-COMPLETED", project_id: "11", project_name: "ArcOrbit", title: "Completed work", content: "Ready for acceptance check", state: "completed", terminal: true, priority: 99, raw: { priority: 1 }, executor_id: "7", assignee: { id: "7", username: "Glare" }, tags: "" },
    { id: "W-ACCEPTED", project_id: "11", project_name: "ArcOrbit", title: "Accepted work", content: "Already accepted", state: "accepted", terminal: true, priority: 99, raw: { priority: 1 }, executor_id: "7", assignee: { id: "7", username: "Glare" }, tags: "" },
    { id: "W-12", project_id: "12", project_name: "Workshop Todo", title: "Other project work", content: "Must be filtered", state: "pending", terminal: false, priority: 98, raw: { priority: 2 }, executor_id: "8", assignee: { id: "8", username: "Lin" }, tags: "203" }
  ],
  task_replacements: workAcceptanceReplacementTest ? [{
    id: "11:completed-newest",
    source_task_id: "completed-newest",
    source_project_id: "11",
    target_task_id: "W-12-NEW",
    target_project_id: "12",
    error: "Fixture source delete failed"
  }] : [],
  feedback_v1: [
    ...(feedbackV2ImageTest ? [{ id: "F-11-V2", short_id: "FB12", project_id: "11", project_name: "ArcOrbit", feedback_source: "v2", title: "V2 conversation feedback", content: "Validate bilateral message images", priority: "P2", ignored: false, linked_task_id: "", custom_user_id: "v2-customer", user_phone: "", user_email: "", file: "", created_at: "2026-08-20T10:00:00Z", updated_at: "2026-08-20T10:00:00Z", metadata: {} }] : []),
    { id: "F-11", short_id: "FB11", project_id: "11", project_name: "ArcOrbit", title: "Scoped feedback", content: "Visible in the selected product", priority: "P1", ignored: false, linked_task_id: "", custom_user_id: "customer-11", user_phone: "13800000011", user_email: "customer11@example.test", file: "https://example.test/feedback/F-11.png", created_at: "2026-08-19T10:00:00Z", updated_at: "2026-08-19T10:00:00Z", metadata: {} },
    { id: "F-11-LINKED", short_id: "FB10", project_id: "11", project_name: "ArcOrbit", title: "Already linked feedback", content: "Continue from the existing todo", priority: "P2", ignored: false, linked_task_id: "W-11", linked_task_state: "pending", custom_user_id: "customer-linked", user_phone: "", user_email: "", file: "", created_at: "2026-08-18T10:00:00Z", updated_at: "2026-08-18T10:00:00Z", metadata: { task_id: "W-11", task_state: "pending" } },
    { id: "F-12", short_id: "FB12", project_id: "12", project_name: "Workshop Todo", title: "Other feedback", content: "Must be filtered", priority: "P2", ignored: false, linked_task_id: "", created_at: "2026-08-19T08:00:00Z", updated_at: "2026-08-19T08:00:00Z", metadata: {} }
  ], tags,
  automation: { ...automation, acceptance_feedback_counts: { open: 0 } },
  capabilities: { organizations: "available", organization_governance: "available", project_members: "managed_with_permissions_except_direct_add", invitation_lifecycle: "create_once_no_list_or_revoke", feedback_v1: "read_write", feedback_v2: feedbackV2ImageTest ? "available" : "unavailable" }, errors: []
};

if (todayCreateIdentityMode) {
  const globalUserId = "8f14e45f-ea7f-4d31-9f15-0c9f8a7b6c5d";
  platform.user.id = globalUserId;
  automation.user.id = globalUserId;
  platform.active_workset.project_ids = ["11"];
  platform.worksets[0].project_ids = ["11"];
  platform.product_workspaces = platform.product_workspaces
    .filter((workspace) => workspace.id === "11")
    .map((workspace) => ({
      ...workspace,
      current_user_id: todayCreateIdentityMode === "missing" ? "" : "7",
      task_counts: {},
      tasks: []
    }));
  platform.tasks = [];
  automation.tasks = [];
  automation.queue = [];
  automation.todo_queue = [];
  automation.blocked_pending_tasks = [];
  automation.active_executions = [];
  automation.active_execution = null;
  automation.active_task = null;
  automation.active_run = null;
  automation.attention_items = [];
  automation.recovery_items = [];
  automation.recent_completions = [];
  automation.acceptance_feedback_queue = [];
  automation.acceptance_feedback_counts = { open: 0 };
}

const noOp = async () => ({});
contextBridge.exposeInMainWorld("arckitDesktop", {
  getWindowState: async () => ({ maximized: false, minimized: false }),
  minimizeWindow: noOp,
  toggleMaximizeWindow: async () => ({ maximized: false, minimized: false }),
  closeWindow: noOp,
  onWindowState: () => () => {},
  getSetupReadiness: async () => ({ status: "ready", first_install: false, checks: [], distribution: {}, counts: {} }),
  continueFromSetup: noOp,
  getSettings: async () => {
    if (settingsBarrier) {
      const barrier = settingsBarrier;
      barrier.markReached();
      await barrier.release;
      if (settingsBarrier === barrier) settingsBarrier = null;
    }
    return { task_source: { enabled: true, auth_mode: "nebula" }, codex_proxy: {} };
  },
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
  selectAutomationExecution: async (executionId) => {
    calls.push(["selectAutomationExecution", executionId]);
    const execution = automation.active_executions.find((item) => item.execution_id === executionId);
    if (!execution) throw new Error(`Unknown execution ${executionId}`);
    automation.selected_execution_id = execution.execution_id;
    automation.active_execution = execution;
    automation.active_task = { ...execution, local_project_path: execution.project_id === "11" ? "/repo/arcorbit" : "" };
    automation.active_run = {
      id: execution.run_id,
      project_id: execution.project_id,
      task_id: execution.task_id,
      session_id: `SESSION-${execution.task_id}`,
      status: "running",
      activity: {}
    };
    return automation;
  },
  platformSnapshot: async (input) => {
    calls.push(["platformSnapshot", input]);
    const barrier = platformSnapshotBarrier;
    if (barrier) {
      barrier.markReached();
      await barrier.release;
      if (platformSnapshotBarrier === barrier) platformSnapshotBarrier = null;
    }
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
    const scoped = sourceTasks.filter((task) => (
      (input.project_id === "all" || String(task.project_id) === String(input.project_id))
      && (!input.search_key || `${task.title} ${task.content}`.toLowerCase().includes(String(input.search_key).toLowerCase()))
    ));
    const selected = scoped.filter((task) => task.state === input.state);
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
        .map((workspace) => ({ ...workspace, tasks: tasks.filter((task) => String(task.project_id) === String(workspace.id)), task_counts: Object.fromEntries(taskStates.map((state) => [state, scoped.filter((task) => String(task.project_id) === String(workspace.id) && task.state === state).length])), task_tree: taskTrees.find((tree) => tree.project_id === String(workspace.id)) || null })),
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
    if (command === "task.update" && acceptanceActionBarrier) {
      const barrier = acceptanceActionBarrier;
      const task = platform.tasks.find((item) => String(item.id) === String(input.task_id));
      if (task) task.state = String(input.state);
      for (const listener of workSyncListeners) listener({ type: "work.changed", task_id: String(input.task_id) });
      barrier.markEventEmitted();
      await barrier.release;
      if (acceptanceActionBarrier === barrier) acceptanceActionBarrier = null;
      return task || { id: String(input.task_id), state: String(input.state) };
    }
    if (command === "task.attachments.list") return taskAttachments[String(input.task_id)] || [];
    if (command === "task.attachment.create") return { id: `TA-${String(input.task_id)}-NEW`, task_id: String(input.task_id), creator_id: "7", type: input.type, content: input.content };
    if (command === "task.replace_project") {
      if (taskReplacementScenario === "create_failure") throw new Error("Fixture target create failed");
      if (taskReplacementScenario === "delete_failure") {
        return {
          status: "partial",
          error: { code: "source_delete_failed", message: "Fixture source delete failed" },
          partial_result: {
            status: "source_delete_failed",
            replacement_id: "11:W-11",
            source_task_id: "W-11",
            source_project_id: "11",
            target_task_id: "W-12-NEW",
            target_project_id: "12"
          }
        };
      }
      return { status: "completed", source_task_id: "W-11", source_project_id: "11", target_task_id: "W-12-NEW", target_project_id: "12" };
    }
    if (command === "task.replace_project.retry_delete") {
      return { status: "completed", outcome: "source_deleted", source_task_id: "W-11", source_project_id: "11", target_task_id: "W-12-NEW", target_project_id: "12" };
    }
    if (command === "task.replace_project.keep_both") {
      return { status: "completed", outcome: "kept_both", source_task_id: "W-11", source_project_id: "11", target_task_id: "W-12-NEW", target_project_id: "12" };
    }
    if (command === "task.create") {
      const projectId = String(input.project_id);
      const project = projects.find((item) => item.id === projectId);
      const workspace = platform.product_workspaces.find((item) => String(item.id) === projectId);
      const member = projectMembers.find((item) => item.project_id === projectId && String(item.user_id) === String(input.executor_id));
      const taskState = String(input.state || "pending_review");
      const task = {
        id: `W-LOCAL-${++createdTaskSequence}`,
        project_id: projectId,
        project_name: project?.name || `Project ${projectId}`,
        content: input.content,
        state: taskState,
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
      if (workspace) workspace.task_counts[taskState] = Number(workspace.task_counts[taskState] || 0) + 1;
      if (String(input.executor_id) === String(workspace?.current_user_id || automation.user.id)) {
        automation.tasks.push({
          ...task,
          state_label: taskState === "pending" ? "待处理" : "待评审",
          local_project_path: "/repo/arcorbit",
          eligible: taskState === "pending",
          eligibility_reason: taskState === "pending" ? "任务可进入自动领取" : "任务当前不是待处理状态",
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
  setTestTaskReplacementScenario: async (value) => { taskReplacementScenario = String(value || "success"); },
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
  updateAutomationTaskState: async (input) => { calls.push(["updateAutomationTaskState", input]); return {}; },
  handoffAutomationToCli: noOp, reopenAutomationCli: noOp, resumeAutomationRuntime: noOp, stopAutomationRun: noOp,
  sendAuthVerification: noOp, loginWithCode: noOp,
  logoutAuth: async () => workAcceptanceLogoutTest ? {
    authentication: { status: "logged_out", authenticated: false },
    requires_confirmation: false
  } : undefined,
  updateSettings: noOp,
  setTestRecoveryItems: async (items) => { automation.recovery_items = items; },
  setTestActiveExecutions: async (items) => { automation.active_executions = Array.isArray(items) ? items : []; },
  armTestPlatformSnapshotBarrier: async () => {
    let markReached;
    let release;
    platformSnapshotBarrier = {
      reached: new Promise((resolve) => { markReached = resolve; }),
      release: new Promise((resolve) => { release = resolve; }),
      markReached,
      releaseBarrier: release
    };
  },
  waitForTestPlatformSnapshotBarrier: async () => platformSnapshotBarrier?.reached,
  releaseTestPlatformSnapshotBarrier: async () => platformSnapshotBarrier?.releaseBarrier(),
  armTestAcceptanceActionBarrier: async () => {
    let markEventEmitted;
    let releaseBarrier;
    acceptanceActionBarrier = {
      eventEmitted: new Promise((resolve) => { markEventEmitted = resolve; }),
      release: new Promise((resolve) => { releaseBarrier = resolve; }),
      markEventEmitted,
      releaseBarrier
    };
  },
  waitForTestAcceptanceActionEvent: async () => acceptanceActionBarrier?.eventEmitted,
  releaseTestAcceptanceAction: async () => acceptanceActionBarrier?.releaseBarrier(),
  armTestSettingsBarrier: async () => {
    let markReached;
    let releaseBarrier;
    settingsBarrier = {
      reached: new Promise((resolve) => { markReached = resolve; }),
      release: new Promise((resolve) => { releaseBarrier = resolve; }),
      markReached,
      releaseBarrier
    };
  },
  waitForTestSettingsBarrier: async () => settingsBarrier?.reached,
  releaseTestSettingsBarrier: async () => settingsBarrier?.releaseBarrier(),
  setTestWorkRuntimeWorkspaceValid: async (valid) => {
    const localPath = valid ? "/repo/arcorbit" : "";
    const task = automation.tasks.find((item) => item.id === "W-RUNNING");
    const workspace = platform.product_workspaces.find((item) => item.id === "11");
    if (task) task.local_project_path = localPath;
    if (workspace) workspace.local_project_path = localPath;
  },
  emitTestAutomationEvent: async (event = { type: "automation.changed" }) => {
    for (const listener of automationListeners) listener(event);
  },
  emitTestWorkSyncEvent: async (event = { type: "work-sync.changed" }) => {
    for (const listener of workSyncListeners) listener(event);
  }
});
