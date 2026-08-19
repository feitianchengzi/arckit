const { contextBridge } = require("electron");

const calls = [];
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
  active_execution: { task_id: "T-21", project_id: "21", task_title: "Outside Workset active execution", phase: "remote_completion_pending", case_id: "CASE-OUTSIDE", run_id: "RUN-OUTSIDE" },
  active_task: { task_id: "T-21", project_id: "21", task_title: "Outside Workset active execution", phase: "remote_completion_pending", case_id: "CASE-OUTSIDE", run_id: "RUN-OUTSIDE" },
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
  { id: "103", user_id: "8", project_id: "12", project_name: "Workshop Todo", username: "Lin", role: "owner", duty: "产品", is_me: false }
];
const platform = {
  generated_at: "2026-08-18T00:00:00Z", source_status: "healthy", user: { id: "7", name: "Glare" },
  worksets: [{ id: "WORKSET-DEFAULT", name: "核心推进", project_ids: ["11", "12"] }],
  active_workset: { id: "WORKSET-DEFAULT", name: "核心推进", project_ids: ["11", "12"] },
  projects, organizations: [{ id: "31", name: "飞天橙子", description: "产品组织" }],
  organization_scopes: [{ id: "31", name: "飞天橙子", description: "产品组织", current_user_role: "owner", project_visibility: "all_projects", members, projects: projects.slice(0, 2), degraded: false }],
  personal_projects: [projects[2]], organization_members: members, project_members: projectMembers,
  product_workspaces: projects.slice(0, 2).map((project) => ({ ...project, preference: {}, task_counts: {}, feedback_count: 0, members: projectMembers.filter((member) => member.project_id === project.id), tasks: [], feedback_v1: [], tags: [] })),
  members: projectMembers,
  tasks: [
    { id: "W-11", project_id: "11", project_name: "ArcOrbit", title: "Scoped pending work", content: "Verify Work state scope", state: "pending", terminal: false, priority: 1, executor_id: "7", assignee: { id: "7", username: "Glare" }, tags: [] },
    { id: "W-COMPLETED", project_id: "11", project_name: "ArcOrbit", title: "Completed work", content: "Ready for acceptance check", state: "completed", terminal: true, priority: 1, executor_id: "7", assignee: { id: "7", username: "Glare" }, tags: [] },
    { id: "W-ACCEPTED", project_id: "11", project_name: "ArcOrbit", title: "Accepted work", content: "Already accepted", state: "accepted", terminal: true, priority: 1, executor_id: "7", assignee: { id: "7", username: "Glare" }, tags: [] },
    { id: "W-12", project_id: "12", project_name: "Workshop Todo", title: "Other project work", content: "Must be filtered", state: "pending", terminal: false, priority: 2, executor_id: "8", assignee: { id: "8", username: "Lin" }, tags: [] }
  ],
  feedback_v1: [
    { id: "F-11", short_id: "FB11", project_id: "11", project_name: "ArcOrbit", title: "Scoped feedback", content: "Visible in the selected product", priority: "P1", ignored: false, linked_task_id: "", metadata: {} },
    { id: "F-12", short_id: "FB12", project_id: "12", project_name: "Workshop Todo", title: "Other feedback", content: "Must be filtered", priority: "P2", ignored: false, linked_task_id: "", metadata: {} }
  ], tags: [],
  automation: { ...automation, acceptance_feedback_counts: { open: 0 } },
  capabilities: { organizations: "available", organization_governance: "available", project_members: "managed_with_permissions_except_direct_add", invitation_lifecycle: "create_once_no_list_or_revoke", feedback_v1: "read_write", feedback_v2: "unavailable" }, errors: []
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
  automationSnapshot: async () => automation,
  platformSnapshot: async () => platform,
  onSetupEvent: () => () => {}, onAutomationEvent: () => () => {}, onEvent: () => () => {}, onProductFeedbackUnread: () => () => {},
  setActiveWorkset: noOp, syncAutomation: noOp, setAutomationEnabled: noOp, setQueuePaused: noOp,
  updateWorkset: async (input) => { calls.push(["updateWorkset", input]); platform.active_workset.project_ids = input.project_ids; return input; },
  executePlatformAction: async (command, input) => {
    calls.push([command, input]);
    if (command.endsWith(".invite")) return { invite_code: "ABCD1234", invite_link: "https://example.test/invite/ABCD1234", role: input.role, expires_at: "2026-08-19T00:00:00Z", max_uses: Number(input.max_uses), used_count: 0 };
    return { ok: true };
  },
  getTestCalls: async () => calls,
  pickProject: async () => ({ id: "local-new", name: "New Local", path: "/repo/new-local" }),
  setProjectParticipation: noOp,
  bindAutomationProject: async (remoteId, localId) => { calls.push(["bindAutomationProject", { remoteId, localId }]); return {}; },
  listRuns: async () => [], listMessages: async () => [],
  checkSetupReadiness: noOp, applySetupPlan: noOp, recoverSetupUpgrade: noOp, planSetupRemoval: noOp, removeManagedSetupPaths: noOp,
  submitAcceptanceFeedback: noOp, submitIntervention: noOp, resolveAutomationRecovery: noOp, updateAutomationTaskState: noOp,
  handoffAutomationToCli: noOp, reopenAutomationCli: noOp, resumeAutomationRuntime: noOp, stopAutomationRun: noOp,
  sendAuthVerification: noOp, loginWithCode: noOp, logoutAuth: noOp, updateSettings: noOp
});
