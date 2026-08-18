const { contextBridge } = require("electron");

const calls = [];
const automation = {
  enabled: false, queue_paused: false, source_status: "healthy", synced_at: "2026-08-18T00:00:00Z",
  user: { id: "7", name: "Glare" }, local_projects: [], projects: [], tasks: [], queue: [], todo_queue: [],
  blocked_pending_tasks: [], state_counts: {}, active_execution: null, active_task: null, active_run: null,
  attention_items: [], recovery_items: [], recent_completions: [], acceptance_feedback_queue: [],
  acceptance_feedback_counts: { open: 0 }, health: { state: "ready", label: "待命", tone: "success" }
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
  members: projectMembers, tasks: [], feedback_v1: [], tags: [],
  automation: { ...automation, acceptance_feedback_counts: { open: 0 } },
  capabilities: { organizations: "available", organization_governance: "available", project_members: "managed_with_permissions_except_direct_add", invitation_lifecycle: "create_once_no_list_or_revoke", feedback_v1: "read_write", feedback_v2: "unavailable" }, errors: []
};

const noOp = async () => ({});
contextBridge.exposeInMainWorld("arckitDesktop", {
  getSetupReadiness: async () => ({ status: "ready", first_install: false, checks: [], distribution: {}, counts: {} }),
  continueFromSetup: noOp,
  getSettings: async () => ({ task_source: { enabled: true, auth_mode: "nebula" }, codex_proxy: {} }),
  getAuthStatus: async () => ({ status: "authenticated", authenticated: true, identity: "Glare" }),
  automationSnapshot: async () => automation,
  platformSnapshot: async () => platform,
  onSetupEvent: () => () => {}, onAutomationEvent: () => () => {}, onEvent: () => () => {},
  setActiveWorkset: noOp, syncAutomation: noOp, setAutomationEnabled: noOp, setQueuePaused: noOp,
  updateWorkset: async (input) => { calls.push(["updateWorkset", input]); platform.active_workset.project_ids = input.project_ids; return input; },
  executePlatformAction: async (command, input) => {
    calls.push([command, input]);
    if (command.endsWith(".invite")) return { invite_code: "ABCD1234", invite_link: "https://example.test/invite/ABCD1234", role: input.role, expires_at: "2026-08-19T00:00:00Z", max_uses: Number(input.max_uses), used_count: 0 };
    return { ok: true };
  },
  getTestCalls: async () => calls,
  pickProject: noOp, setProjectParticipation: noOp, bindAutomationProject: noOp,
  listRuns: async () => [], listMessages: async () => [],
  checkSetupReadiness: noOp, applySetupPlan: noOp, recoverSetupUpgrade: noOp, planSetupRemoval: noOp, removeManagedSetupPaths: noOp,
  submitAcceptanceFeedback: noOp, submitIntervention: noOp, resolveAutomationRecovery: noOp, updateAutomationTaskState: noOp,
  handoffAutomationToCli: noOp, reopenAutomationCli: noOp, resumeAutomationRuntime: noOp, stopAutomationRun: noOp,
  sendAuthVerification: noOp, loginWithCode: noOp, logoutAuth: noOp, updateSettings: noOp
});
