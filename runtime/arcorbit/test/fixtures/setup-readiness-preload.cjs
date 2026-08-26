const { contextBridge } = require("electron");

const staleSkillPath = "/fixture/.codex/skills/using-arckit";
const staleLoaderPath = "/fixture/.codex/skills/arcforge-on-demand";
const calls = [];
let removalPlanAttempts = 0;
let setupListener = null;

const codexReady = {
  schema_version: "arcorbit-codex-setup/v1",
  status: "ready",
  installation: { state: "installed", available: true, command: "/fixture/.local/bin/codex", path_entries: ["/fixture/.local/bin"], provenance: "standalone", version_summary: "codex fixture", can_install: false, can_update: true, can_migrate: false },
  authentication: { state: "authenticated", authenticated: true, method: "", capabilities: { browser: true, device_auth: false, api_key: true, access_token: false } },
  operation: null,
  error: null
};

const codexSelection = {
  ...codexReady,
  status: "selection-required",
  authentication: { ...codexReady.authentication, state: "selection-required", authenticated: false }
};

const codexActive = {
  ...codexSelection,
  status: "login-in-progress",
  operation: { id: "fixture-operation", kind: "login", phase: "running", started_at: "2026-08-25T19:30:00.000Z", cancellable: true }
};

const codexRechecking = {
  ...codexSelection,
  status: "checking",
  operation: { kind: "login", phase: "rechecking-login-status", started_at: "2026-08-25T19:30:00.000Z", cancellable: false }
};

const codexOwnerBlocked = {
  ...codexReady,
  status: "ready",
  error: {
    code: "CODEX_UPDATE_ACTIVE_TASKS",
    message: "仍有 2 个活动 Codex owner；请先结束相关 Chat 或 Automation。",
    stage: "owner-guard",
    owners: [{ kind: "automation", id: "EXEC-1" }, { kind: "chat", id: "CHAT-1" }]
  }
};

const drifted = {
  status: "drifted",
  first_install: false,
  checks: [
    { id: "resources", status: "passed", summary: "fixture resources" },
    { id: "provider", status: "passed", summary: "fixture provider" },
    { id: "skills", status: "pending", summary: "fixture stale paths" },
    { id: "codex", status: "passed", summary: "fixture Codex" }
  ],
  distribution: { runtime_version: "0.1.0-local.test", release_tag: "local/test", provider_version: "0.1.8-local.test", payload_digest: "a".repeat(64) },
  plan: {
    digest: "plan-fixture",
    items: [],
    shared_assets: [],
    loader_targets: [],
    cleanup: [
      { skill: "using-arckit", path: staleSkillPath, reason: "fixture stale skill" },
      { skill: "arcforge-on-demand", path: staleLoaderPath, reason: "fixture stale loader" }
    ],
    cleanup_included_in_upgrade: false,
    deferred_project_skills: []
  },
  drift: { counts: { missing: 0, same: 0, changed: 0, managed_stale: 2 }, conflicts: [], extras: [] },
  source_upgrade: null,
  can_apply: false,
  can_recover: false,
  can_continue: false,
  write_state: "not_started",
  error: null
};
drifted.codex_setup = codexReady;
drifted.codex = codexReady.installation;

const ready = {
  ...drifted,
  status: "ready",
  plan: null,
  drift: { counts: { missing: 0, same: 2, changed: 0, managed_stale: 0 }, conflicts: [], extras: [] },
  can_continue: true
};

function installPlan(digest, { changed = 0 } = {}) {
  return {
    ...drifted,
    status: "needs-install",
    first_install: true,
    checks: drifted.checks.map((item) => item.id === "skills" ? { ...item, summary: "fixture install required" } : item),
    plan: {
      digest,
      profile: "default",
      scope: "project",
      project_roots: ["/fixture/project"],
      availability: {
        arckit_total: 1,
        user_ambient: 0,
        user_on_demand: 0,
        project_ambient_deferred: 0,
        shared_assets: 0,
        arcforge_loader_targets: 1
      },
      items: [{ skill: "using-arckit", mode: "project-ambient", destinations: [{ kind: "project-agent", path: "/fixture/project/.codex/skills/using-arckit" }] }],
      shared_assets: [],
      loader_targets: [{ agent: "codex", path: "/fixture/project/.codex/skills/arcforge-on-demand", status: "missing" }],
      cleanup: [],
      cleanup_included_in_upgrade: false,
      deferred_project_skills: []
    },
    drift: { counts: { missing: 1, same: 0, changed, managed_stale: 0, uncertain: 0 }, conflicts: [], extras: [] },
    can_apply: true,
    can_continue: false
  };
}

const needsInstall = installPlan("plan-install-a");
const updatedInstall = installPlan("plan-install-b", { changed: 1 });

const automation = {
  enabled: false, queue_paused: false, source_status: "healthy", synced_at: "", user: null,
  local_projects: [], projects: [], tasks: [], queue: [], todo_queue: [], blocked_pending_tasks: [],
  acceptance_feedback_queue: [], acceptance_feedback_counts: { open: 0 }, active_execution: null,
  active_task: null, active_run: null, attention_items: [], recovery_items: [], recent_completions: [],
  health: { state: "ready", label: "待命", tone: "success" }
};

const platform = {
  generated_at: "", source_status: "healthy", user: null, worksets: [], active_workset: null,
  projects: [], organizations: [], organization_scopes: [], personal_projects: [], organization_members: [],
  project_members: [], product_workspaces: [], members: [], tasks: [], feedback_v1: [], tags: [],
  automation, capabilities: {}, errors: []
};

const noOp = async () => ({});
contextBridge.exposeInMainWorld("arckitDesktop", {
  getWindowState: async () => ({ maximized: false, full_screen: false, minimizable: true, maximizable: true, closable: true }),
  minimizeWindow: noOp,
  toggleMaximizeWindow: noOp,
  closeWindow: noOp,
  onWindowState: () => () => {},
  getSetupReadiness: async () => drifted,
  checkSetupReadiness: async () => drifted,
  planSetupRemoval: async (paths) => {
    calls.push(["plan", paths]);
    removalPlanAttempts += 1;
    if (removalPlanAttempts === 1) throw new Error("fixture managed removal failure");
    return { managedPaths: paths, confirmationDigest: "b".repeat(64) };
  },
  removeManagedSetupPaths: async (input) => { calls.push(["remove", input]); return ready; },
  confirmCodexSetup: async () => ({ confirmed: true, confirmation_id: "fixture-confirmation" }),
  installCodex: noOp,
  updateCodex: noOp,
  migrateCodexToStandalone: noOp,
  loginCodex: noOp,
  loginCodexWithSecret: async (input) => {
    calls.push(["codex-login-secret", { method: input.method, secret_length: String(input.secret || "").length }]);
    const next = { ...drifted, status: "ready", codex_setup: codexReady, codex: codexReady.installation, can_continue: true };
    setupListener?.(next);
    return next;
  },
  cancelCodexSetup: async (input) => { calls.push(["codex-cancel", input]); return drifted; },
  logoutCodex: noOp,
  recheckCodexSetup: noOp,
  continueFromSetup: noOp,
  applySetupPlan: async (input) => { calls.push(["apply", input]); return ready; },
  recoverSetupUpgrade: noOp,
  getSettings: async () => ({ task_source: {}, codex_proxy: {} }),
  getProductFeedbackStatus: async () => ({ configured: false, unread_count: 0 }),
  refreshProductFeedbackUnread: async () => ({ unread_count: 0 }),
  getAuthStatus: async () => ({ status: "logged_out", authenticated: false }),
  chatSnapshot: async () => ({ generated_at: "", projects: [], sessions: [], selected_session_id: "", messages: [], draft: { project_id: "", text: "" } }),
  createChat: noOp, selectChat: noOp, deleteChat: noOp, renameChat: noOp,
  interruptChat: noOp, decideChatApproval: noOp, sendChatMessage: noOp,
  automationSnapshot: async () => automation,
  platformSnapshot: async () => platform,
  platformWorkQuery: async () => ({ schema_version: "arcorbit-work-query/v1", query_key: "", generated_at: "", source_status: "healthy", active_workset: null, projects: [], product_workspaces: [], tasks: [], task_trees: [], tags: [], window: { offset: 0, limit: 80, returned: 0, total: 0, has_more: false }, errors: [] }),
  getTestCalls: async () => calls,
  emitSetupScenario: async (scenario) => {
    const next = scenario === "needs-install" ? needsInstall
      : scenario === "updated-install" ? updatedInstall
        : scenario === "codex-selection" ? { ...drifted, status: "codex-action-required", codex_setup: codexSelection, codex: codexSelection.installation }
          : scenario === "codex-active" ? { ...drifted, status: "applying", codex_setup: codexActive, codex: codexActive.installation }
            : scenario === "codex-rechecking" ? { ...drifted, status: "applying", codex_setup: codexRechecking, codex: codexRechecking.installation }
              : scenario === "codex-owner-blocked" ? { ...drifted, status: "blocked", error: codexOwnerBlocked.error, codex_setup: codexOwnerBlocked, codex: codexOwnerBlocked.installation }
              : drifted;
    setupListener?.(next);
    return next;
  },
  onSetupEvent: (listener) => { setupListener = listener; return () => { setupListener = null; }; },
  onAutomationEvent: () => () => {},
  onWorkSyncEvent: () => () => {},
  onChatEvent: () => () => {},
  onEvent: () => () => {},
  onProductFeedbackUnread: () => () => {},
  listRuns: async () => [],
  listMessages: async () => [],
  setActiveWorkset: noOp,
  syncAutomation: noOp,
  setAutomationEnabled: noOp,
  setQueuePaused: noOp,
  updateWorkset: noOp,
  executePlatformAction: noOp,
  openProductFeedback: noOp,
  openFeedbackAttachment: noOp,
  pickProject: async () => null,
  setProjectParticipation: noOp,
  bindAutomationProject: noOp,
  submitAcceptanceFeedback: noOp,
  submitIntervention: noOp,
  resolveAutomationRecovery: noOp,
  updateAutomationTaskState: noOp,
  handoffAutomationToCli: noOp,
  reopenAutomationCli: noOp,
  resumeAutomationRuntime: noOp,
  stopAutomationRun: noOp,
  sendAuthVerification: noOp,
  loginWithCode: noOp,
  logoutAuth: noOp,
  updateSettings: noOp
});
