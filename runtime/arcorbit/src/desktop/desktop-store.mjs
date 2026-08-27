import { createHash } from "node:crypto";
import { existsSync } from "node:fs";
import { mkdir, readFile, rename, rm, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { authProjection, DEFAULT_WORKSHOP_BASE_URL, normalizeTaskSourceSettings } from "../task-source-adapter.mjs";
import { taskDisplayTitle } from "../task-display-title.mjs";
import { normalizeWorkInspectorWidth, WORK_INSPECTOR_DEFAULT_WIDTH } from "./work-inspector-preference.mjs";

export const DESKTOP_STORE_VERSION = 16;

export function createDesktopStore({ dataDir, runsDir, storePath }) {
  let storeQueue = Promise.resolve();

  async function ensureStore() {
    await mkdir(dataDir, { recursive: true });
    await mkdir(runsDir, { recursive: true });
    if (!existsSync(storePath)) {
      await writeJson(storePath, {
        version: DESKTOP_STORE_VERSION,
        projects: [],
        runs: [],
        sessions: {},
        messages: {},
        settings: defaultSettings(),
        automation: defaultAutomationState(),
        platform: defaultPlatformState(),
        chat: defaultChatState()
      });
    }
  }

  async function readStoreFile() {
    await ensureStore();
    const store = await readJsonWithRetry(storePath);
    return normalizeStore(store);
  }

  async function readStore() {
    await storeQueue;
    return readStoreFile();
  }

  async function updateStore(updater) {
    const operation = storeQueue.catch(() => {}).then(async () => {
      const store = await readStoreFile();
      const next = await updater(store) || store;
      const persisted = normalizeStore(next);
      await writeJson(storePath, persisted);
      return persisted;
    });
    storeQueue = operation.then(() => {}, () => {});
    return operation;
  }

  return {
    ensureStore,
    readStore,
    updateStore
  };
}

export function normalizeStore(store) {
  const requiresTaskRehydration = Number(store?.version || 0) < DESKTOP_STORE_VERSION;
  const automation = normalizeAutomationState(store.automation || {});
  const hasPersistedChatSelection = Boolean(store.chat)
    && Object.prototype.hasOwnProperty.call(store.chat, "selected_session_id");
  const normalized = {
    version: DESKTOP_STORE_VERSION,
    projects: Array.isArray(store.projects) ? store.projects : [],
    runs: Array.isArray(store.runs) ? store.runs : [],
    sessions: store.sessions && typeof store.sessions === "object" ? store.sessions : {},
    messages: store.messages && typeof store.messages === "object" ? store.messages : {},
    settings: normalizeSettings(store.settings || {}),
    automation,
    platform: normalizePlatformState(store.platform || {}, automation, store.automation || {}, { requiresTaskRehydration }),
    chat: normalizeChatState(store.chat || {})
  };
  for (const [projectIdValue, sessions] of Object.entries(normalized.sessions)) {
    normalized.sessions[projectIdValue] = Array.isArray(sessions)
      ? sessions.map((session) => normalizeDesktopSession(session, projectIdValue)).filter(Boolean)
      : [];
  }
  for (const project of normalized.projects) {
    const legacyMessages = Array.isArray(normalized.messages[project.id]) ? normalized.messages[project.id] : null;
    if (legacyMessages) {
      const session = ensureProjectSession(normalized, project.id);
      normalized.messages[session.id] = legacyMessages.map((message) => ({
        ...message,
        session_id: session.id
      }));
      delete normalized.messages[project.id];
    } else {
      ensureProjectSession(normalized, project.id);
    }
  }
  if (!hasPersistedChatSelection) {
    normalized.chat.selected_session_id = Object.values(normalized.sessions).flat()
      .filter((session) => session.kind === "chat")
      .sort((left, right) => String(right.updated_at).localeCompare(String(left.updated_at)))[0]?.id || "";
  }
  normalized.runs = normalized.runs.map((run) => {
    const { activity: _activity, ...runRecord } = run || {};
    if (run?.session_id) {
      return runRecord;
    }
    const session = ensureProjectSession(normalized, runRecord.project_id);
    return { ...runRecord, session_id: session.id };
  });
  return normalized;
}

export function defaultPlatformState() {
  return {
    active_workset_id: "WORKSET-DEFAULT",
    worksets: [{
      id: "WORKSET-DEFAULT",
      name: "当前产品集",
      project_ids: [],
      created_at: "",
      updated_at: ""
    }],
    workspace_preferences: {},
    ui_preferences: {
      work_inspector_width_px: WORK_INSPECTOR_DEFAULT_WIDTH
    },
    task_sync: defaultTaskSyncState(),
    feedback_v2: {
      status: "unavailable",
      endpoint_origin: "",
      checked_at: "",
      features: {},
      error: ""
    }
  };
}

export function defaultChatState() {
  return {
    selected_session_id: "",
    draft: { project_id: "", text: "", updated_at: "" }
  };
}

export function normalizeChatState(value = {}) {
  const draft = value.draft && typeof value.draft === "object" && !Array.isArray(value.draft) ? value.draft : {};
  return {
    selected_session_id: String(value.selected_session_id || ""),
    draft: {
      project_id: String(draft.project_id || ""),
      text: String(draft.text || "").slice(0, 100_000),
      updated_at: String(draft.updated_at || "")
    }
  };
}

function normalizeDesktopSession(value, projectIdValue) {
  if (!value || typeof value !== "object" || Array.isArray(value) || !value.id) return null;
  const kind = value.kind === "chat" ? "chat" : value.kind === "automation-task" ? "automation-task" : "legacy";
  const activeStatuses = new Set(["starting", "running", "waiting_approval", "interrupting"]);
  const status = [...activeStatuses, "draft", "completed", "interrupted", "failed"].includes(value.status) ? value.status : "completed";
  return {
    ...value,
    id: String(value.id),
    project_id: String(value.project_id || projectIdValue),
    kind,
    title: kind === "automation-task"
      ? normalizeAutomationSessionTitle(value.title)
      : String(value.title || (kind === "chat" ? "New chat" : "Automation")),
    thread_id: String(value.thread_id || ""),
    turn_id: String(value.turn_id || ""),
    retry_client_request_id: kind === "chat" ? String(value.retry_client_request_id || "") : "",
    status,
    error: String(value.error || ""),
    draft: String(value.draft || "").slice(0, 100_000),
    created_at: String(value.created_at || ""),
    updated_at: String(value.updated_at || value.created_at || "")
  };
}

function normalizeAutomationSessionTitle(value) {
  const title = String(value || "Automation");
  const prefix = "待办 · ";
  return title.startsWith(prefix)
    ? `${prefix}${taskDisplayTitle(title.slice(prefix.length), "Automation")}`
    : taskDisplayTitle(title, "Automation");
}

export function normalizePlatformState(value = {}, automation = defaultAutomationState(), legacyAutomation = automation, { requiresTaskRehydration = false } = {}) {
  const defaults = defaultPlatformState();
  const migratedProjectIds = Object.keys(automation.project_bindings || {}).sort(compareScalarIds);
  const inputWorksets = Array.isArray(value.worksets) ? value.worksets : [];
  const worksets = inputWorksets.map(normalizeWorkset).filter(Boolean);
  if (worksets.length === 0) {
    worksets.push({
      ...defaults.worksets[0],
      project_ids: migratedProjectIds
    });
  }
  const activeId = String(value.active_workset_id || "").trim();
  const activeWorksetId = worksets.some((workset) => workset.id === activeId)
    ? activeId
    : worksets[0].id;
  const preferences = value.workspace_preferences && typeof value.workspace_preferences === "object" && !Array.isArray(value.workspace_preferences)
    ? value.workspace_preferences
    : {};
  const feedbackV2 = value.feedback_v2 && typeof value.feedback_v2 === "object" && !Array.isArray(value.feedback_v2)
    ? value.feedback_v2
    : {};
  const feedbackStatuses = new Set(["unavailable", "checking", "available", "degraded"]);
  const uiPreferences = value.ui_preferences && typeof value.ui_preferences === "object" && !Array.isArray(value.ui_preferences)
    ? value.ui_preferences
    : {};
  return {
    active_workset_id: activeWorksetId,
    worksets,
    workspace_preferences: Object.fromEntries(Object.entries(preferences).map(([projectId, preference]) => {
      const item = preference && typeof preference === "object" && !Array.isArray(preference) ? preference : {};
      return [String(projectId), {
        pinned: Boolean(item.pinned),
        color: safeColorToken(item.color),
        last_opened_at: String(item.last_opened_at || "")
      }];
    })),
    ui_preferences: {
      work_inspector_width_px: normalizeWorkInspectorWidth(uiPreferences.work_inspector_width_px)
    },
    task_sync: normalizeTaskSyncState(value.task_sync, legacyAutomation, { requiresRehydration: requiresTaskRehydration }),
    feedback_v2: {
      status: feedbackStatuses.has(feedbackV2.status) ? feedbackV2.status : defaults.feedback_v2.status,
      endpoint_origin: String(feedbackV2.endpoint_origin || ""),
      checked_at: String(feedbackV2.checked_at || ""),
      features: booleanMap(feedbackV2.features),
      error: String(feedbackV2.error || "")
    }
  };
}

export function defaultTaskSyncState() {
  return {
    session_epoch: 0,
    identity_key: "",
    user: null,
    project_catalog: [],
    projects: {},
    task_replacements: {},
    source_status: "logged_out",
    rehydration_required: false,
    last_reconciled_at: "",
    errors: []
  };
}

export function normalizeTaskSyncState(value = {}, legacyAutomation = {}, { requiresRehydration = false } = {}) {
  const current = value && typeof value === "object" && !Array.isArray(value) ? value : {};
  const legacySnapshot = legacyAutomation?.snapshot && typeof legacyAutomation.snapshot === "object"
    ? legacyAutomation.snapshot
    : {};
  const legacyRealtime = legacyAutomation?.realtime?.projects && typeof legacyAutomation.realtime.projects === "object"
    ? legacyAutomation.realtime.projects
    : {};
  const inputProjects = current.projects && typeof current.projects === "object" && !Array.isArray(current.projects)
    ? current.projects
    : {};
  const legacyProjectIndex = new Map((legacySnapshot.projects || [])
    .filter((project) => project?.id !== undefined)
    .map((project) => [String(project.id), project]));
  for (const projectId of Object.keys(legacyRealtime)) {
    if (!legacyProjectIndex.has(String(projectId))) legacyProjectIndex.set(String(projectId), { id: String(projectId), name: String(projectId) });
  }
  for (const task of legacySnapshot.tasks || []) {
    const projectId = String(task?.project_id || "");
    if (projectId && !legacyProjectIndex.has(projectId)) legacyProjectIndex.set(projectId, { id: projectId, name: projectId });
  }
  const migratedProjects = Object.fromEntries([...legacyProjectIndex.entries()].map(([projectId, project]) => {
    return [projectId, {
      project,
      tasks: (legacySnapshot.tasks || []).filter((task) => String(task?.project_id || "") === projectId),
      tags: [],
      trusted: false,
      revision: 0,
      synced_at: String(legacySnapshot.synced_at || ""),
      ...(legacyRealtime[projectId] || {})
    }];
  }).filter(Boolean));
  const projects = Object.fromEntries(Object.entries({ ...migratedProjects, ...inputProjects }).map(([projectId, item]) => {
    const project = item && typeof item === "object" && !Array.isArray(item) ? item : {};
    const normalized = normalizeTaskSyncProject(project, projectId);
    if (requiresRehydration) normalized.trusted = false;
    return [String(projectId), normalized];
  }));
  const projectCatalogInput = Array.isArray(current.project_catalog) && current.project_catalog.length > 0
    ? current.project_catalog
    : Array.isArray(legacySnapshot.projects) ? legacySnapshot.projects : [];
  const sourceStatuses = new Set(["logged_out", "unconfigured", "syncing", "healthy", "degraded", "unauthenticated", "error"]);
  const replacementInput = current.task_replacements && typeof current.task_replacements === "object" && !Array.isArray(current.task_replacements)
    ? current.task_replacements
    : {};
  return {
    session_epoch: nonNegativeInteger(current.session_epoch),
    identity_key: String(current.identity_key || ""),
    user: current.user && typeof current.user === "object" ? current.user : legacySnapshot.user || null,
    project_catalog: projectCatalogInput.filter((project) => project && typeof project === "object" && project.id !== undefined),
    projects,
    task_replacements: Object.fromEntries(Object.entries(replacementInput)
      .map(([key, replacement]) => {
        const normalized = normalizeTaskReplacement(replacement, key);
        return normalized ? [normalized.id, normalized] : null;
      })
      .filter(Boolean)),
    source_status: requiresRehydration && (current.identity_key || current.user || projectCatalogInput.length > 0 || Object.keys(projects).length > 0)
      ? "syncing"
      : sourceStatuses.has(current.source_status)
        ? current.source_status
        : sourceStatuses.has(legacySnapshot.source_status) ? legacySnapshot.source_status : "logged_out",
    rehydration_required: Boolean(requiresRehydration || current.rehydration_required),
    last_reconciled_at: String(current.last_reconciled_at || legacySnapshot.synced_at || ""),
    errors: Array.isArray(current.errors)
      ? current.errors.map(normalizeAutomationError).slice(0, 50)
      : Array.isArray(legacySnapshot.errors) ? legacySnapshot.errors.map(normalizeAutomationError).slice(0, 50) : []
  };
}

function normalizeTaskReplacement(value, fallbackId) {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  const sourceTaskId = String(value.source_task_id || "").trim();
  const sourceProjectId = String(value.source_project_id || "").trim();
  const targetTaskId = String(value.target_task_id || "").trim();
  const targetProjectId = String(value.target_project_id || "").trim();
  if (!sourceTaskId || !sourceProjectId || !targetTaskId || !targetProjectId) return null;
  const id = String(value.id || fallbackId || `${sourceProjectId}:${sourceTaskId}`).trim();
  const status = value.status === "source_delete_failed" ? "source_delete_failed" : "source_delete_pending";
  return {
    id,
    status,
    source_task_id: sourceTaskId,
    source_project_id: sourceProjectId,
    target_task_id: targetTaskId,
    target_project_id: targetProjectId,
    error: String(value.error || "").slice(0, 1000),
    created_at: String(value.created_at || ""),
    updated_at: String(value.updated_at || value.created_at || "")
  };
}

function normalizeTaskSyncProject(value, projectId) {
  const statuses = new Set(["idle", "connecting", "recovering", "connected", "reconnecting", "degraded"]);
  const modes = new Set(["unknown", "resumable", "legacy"]);
  return {
    project: value.project && typeof value.project === "object"
      ? value.project
      : { id: String(projectId), name: String(projectId) },
    tasks: Array.isArray(value.tasks) ? value.tasks.map(normalizeStoredTask).filter(Boolean) : [],
    tags: Array.isArray(value.tags) ? value.tags.filter((tag) => tag && typeof tag === "object") : [],
    trusted: Boolean(value.trusted),
    revision: nonNegativeInteger(value.revision),
    synced_at: String(value.synced_at || value.last_refreshed_at || ""),
    state: statuses.has(value.state) ? value.state : "idle",
    mode: modes.has(value.mode) ? value.mode : "unknown",
    cursor: positiveSafeInteger(value.cursor),
    last_event_at: String(value.last_event_at || ""),
    last_refreshed_at: String(value.last_refreshed_at || value.synced_at || ""),
    updated_at: String(value.updated_at || ""),
    error: String(value.error || "")
  };
}

export function normalizeWorkset(value) {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  const id = String(value.id || "").trim();
  const name = String(value.name || "").trim().slice(0, 80);
  if (!id || !name) return null;
  const projectIds = Array.isArray(value.project_ids)
    ? [...new Set(value.project_ids.map((item) => String(item || "").trim()).filter(Boolean))]
    : [];
  return {
    id,
    name,
    project_ids: projectIds,
    created_at: String(value.created_at || ""),
    updated_at: String(value.updated_at || value.created_at || "")
  };
}

export function defaultSettings() {
  return {
    codex_proxy: {
      enabled: false,
      url: "http://127.0.0.1:7890"
    },
    task_source: {
      enabled: true,
      base_url: DEFAULT_WORKSHOP_BASE_URL,
      service_name: "workshop",
      auth_mode: "nebula",
      access_token: "",
      refresh_token: "",
      token_type: "Bearer",
      access_token_expires_at: 0,
      refresh_token_expires_at: 0,
      last_login_activity_at: 0,
      auth_state: "logged_out",
      auth_error: "",
      user_id: "",
      username: "",
      app_id: "arckit-runtime",
      session_id: ""
    }
  };
}

export function normalizeSettings(settings = {}) {
  const defaults = defaultSettings();
  const proxy = settings.codex_proxy && typeof settings.codex_proxy === "object"
    ? settings.codex_proxy
    : {};
  const taskSource = settings.task_source && typeof settings.task_source === "object"
    ? settings.task_source
    : {};
  return {
    codex_proxy: {
      enabled: Boolean(proxy.enabled),
      url: String(proxy.url || defaults.codex_proxy.url).trim() || defaults.codex_proxy.url
    },
    task_source: normalizeTaskSourceSettings({
      ...defaults.task_source,
      ...taskSource,
      service_name: safeIdentifier(taskSource.service_name, defaults.task_source.service_name),
      app_id: safeIdentifier(taskSource.app_id, defaults.task_source.app_id)
    })
  };
}

export function publicSettings(settings = {}) {
  const normalized = normalizeSettings(settings);
  const taskSource = normalized.task_source;
  const exposesDebugHeaders = taskSource.auth_mode === "headers";
  return {
    codex_proxy: normalized.codex_proxy,
    task_source: {
      enabled: taskSource.enabled,
      base_url: taskSource.base_url,
      service_name: taskSource.service_name,
      auth_mode: taskSource.auth_mode,
      user_id: exposesDebugHeaders ? taskSource.user_id : "",
      username: exposesDebugHeaders ? taskSource.username : "",
      app_id: taskSource.app_id,
      session_id: exposesDebugHeaders ? taskSource.session_id : "",
      access_token: "",
      access_token_configured: Boolean(taskSource.access_token),
      refresh_session_configured: Boolean(taskSource.refresh_token),
      authentication: authProjection(taskSource)
    }
  };
}

export function defaultAutomationState() {
  return {
    enabled: false,
    queue_paused: false,
    concurrency_limit: 3,
    project_bindings: {},
    project_participation: {},
    active_executions: {},
    selected_execution_id: "",
    acceptance_feedback_items: [],
    attention_items: [],
    recovery_items: [],
    recent_completions: []
  };
}

export function normalizeAutomationState(value = {}) {
  const activeExecutionsInput = value.active_executions && typeof value.active_executions === "object" && !Array.isArray(value.active_executions)
    ? value.active_executions
    : {};
  const activeExecutions = Object.fromEntries(Object.entries(activeExecutionsInput)
    .map(([laneKey, execution]) => {
      const normalized = normalizeActiveTask(execution, laneKey);
      return normalized ? [normalized.workspace_key, normalized] : null;
    })
    .filter(Boolean));
  const legacyActiveTask = normalizeActiveTask(value.active_task);
  if (legacyActiveTask && !activeExecutions[legacyActiveTask.workspace_key]) {
    activeExecutions[legacyActiveTask.workspace_key] = legacyActiveTask;
  }
  const activeFeedbackIds = new Set(Object.values(activeExecutions)
    .filter((execution) => execution.execution_kind === "acceptance_feedback")
    .map((execution) => execution.feedback_id));
  const feedbackItems = Array.isArray(value.acceptance_feedback_items)
    ? value.acceptance_feedback_items.map(normalizeAcceptanceFeedbackItem).filter(Boolean)
    : [];
  for (const item of feedbackItems) {
    if (item.status === "running" && !activeFeedbackIds.has(item.feedback_id)) {
      item.status = "queued";
      item.progress = "Runtime 重启后已重新排队";
      item.ready_at ||= item.updated_at || item.created_at;
    }
  }
  const attentionItems = Array.isArray(value.attention_items) ? value.attention_items.slice(0, 50) : [];
  for (const execution of Object.values(activeExecutions)) {
    if (execution.intervention_kind !== "external_dependency") continue;
    if (attentionItems.some((item) => String(item.task_id) === String(execution.task_id))) continue;
    attentionItems.push({
      id: `ATTENTION-${execution.task_id}`,
      task_id: execution.task_id,
      project_id: execution.project_id,
      run_id: execution.run_id || "",
      feedback_id: execution.feedback_id || "",
      kind: "external_dependency",
      reason: execution.intervention_reason || "存在 Automation 无法自行完成的外部依赖。",
      question: execution.intervention_resume_condition || "请协调依赖完成后确认，Automation 将重新检查并继续。",
      created_at: execution.intervention_started_at || ""
    });
  }
  return {
    enabled: Boolean(value.enabled),
    queue_paused: Boolean(value.queue_paused),
    concurrency_limit: Math.min(8, Math.max(1, Number.parseInt(value.concurrency_limit, 10) || 3)),
    project_bindings: stringMap(value.project_bindings),
    project_participation: booleanMap(value.project_participation),
    active_executions: activeExecutions,
    selected_execution_id: selectExecutionId(value.selected_execution_id, activeExecutions),
    acceptance_feedback_items: feedbackItems,
    attention_items: attentionItems.slice(0, 50),
    recovery_items: Array.isArray(value.recovery_items)
      ? value.recovery_items.slice(0, 50).map((item) => ({ ...item, responsibility: "operator" }))
      : [],
    recent_completions: Array.isArray(value.recent_completions)
      ? value.recent_completions.map((item) => ({
          ...item,
          title: taskDisplayTitle(item?.title, item?.task_id)
        }))
      : []
  };
}

function normalizeStoredTask(value) {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  const content = String(value.content ?? value.title ?? "");
  const displayTitle = taskDisplayTitle(content, value.title || value.id);
  return {
    ...value,
    display_title: displayTitle,
    title: displayTitle,
    content
  };
}

function normalizeActiveTask(value, persistedLaneKey = "") {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  const caseStatuses = new Set(["unbound", "unknown", "active", "resolved"]);
  const closeoutStatuses = new Set(["pending", "running", "completed", "failed"]);
  const remoteCompletionStatuses = new Set(["pending", "writing", "failed"]);
  const caseId = String(value.case_id || "");
  const workspaceKey = String(value.workspace_key || value.local_project_id || value.local_project_path || persistedLaneKey || value.project_id || "").trim();
  if (!workspaceKey) return null;
  const executionId = String(value.execution_id || legacyExecutionId(value, workspaceKey));
  const legacyExternalWait = value.phase === "external_wait";
  return {
    ...value,
    phase: legacyExternalWait ? "awaiting_human" : value.phase,
    execution_id: executionId,
    workspace_key: workspaceKey,
    task_title: taskDisplayTitle(value.task_title, value.task_id),
    execution_kind: value.execution_kind === "acceptance_feedback" ? "acceptance_feedback" : "todo",
    feedback_id: String(value.feedback_id || ""),
    case_id: caseId,
    case_status: caseStatuses.has(value.case_status) ? value.case_status : caseId ? "unknown" : "unbound",
    case_resolved_at: String(value.case_resolved_at || ""),
    case_binding_source: String(value.case_binding_source || ""),
    case_binding_run_id: String(value.case_binding_run_id || ""),
    case_bound_at: String(value.case_bound_at || ""),
    thread_id: String(value.thread_id || ""),
    thread_bound_at: String(value.thread_bound_at || ""),
    intervention_kind: String(value.intervention_kind || (legacyExternalWait ? "external_dependency" : "")),
    intervention_reason: String(value.intervention_reason || (legacyExternalWait ? value.external_wait_reason : "") || ""),
    intervention_resume_condition: String(value.intervention_resume_condition || (legacyExternalWait ? value.external_wait_resume_condition : "") || ""),
    intervention_started_at: String(value.intervention_started_at || (legacyExternalWait ? value.external_wait_started_at : "") || ""),
    last_compaction_turn_id: String(value.last_compaction_turn_id || ""),
    closeout_status: closeoutStatuses.has(value.closeout_status)
      ? value.closeout_status
      : value.closeout_completed_at ? "completed" : "pending",
    closeout_completed_at: String(value.closeout_completed_at || ""),
    remote_completion_status: remoteCompletionStatuses.has(value.remote_completion_status)
      ? value.remote_completion_status
      : "pending"
  };
}

function legacyExecutionId(value, workspaceKey) {
  const identity = [workspaceKey, value.execution_kind || "todo", value.feedback_id || "", value.task_id || "", value.claimed_at || value.started_at || "legacy"].join("\0");
  return `EXEC-${createHash("sha256").update(identity).digest("hex").slice(0, 20)}`;
}

function selectExecutionId(selectedExecutionId, activeExecutions) {
  const requested = String(selectedExecutionId || "");
  const executions = Object.values(activeExecutions);
  if (executions.some((execution) => execution.execution_id === requested)) return requested;
  return executions.sort((left, right) => String(right.started_at || right.claimed_at || "").localeCompare(String(left.started_at || left.claimed_at || "")))[0]?.execution_id || "";
}

export function normalizeAcceptanceFeedbackItem(value) {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  const feedbackId = String(value.feedback_id || "").trim();
  const taskId = String(value.source_task_id || "").trim();
  if (!feedbackId || !taskId) return null;
  const statuses = new Set(["queued", "running", "awaiting_human", "blocked", "resolved", "cancelled"]);
  const status = value.status === "external_wait" ? "awaiting_human" : value.status;
  return {
    feedback_id: feedbackId,
    idempotency_key: String(value.idempotency_key || ""),
    message_id: String(value.message_id || ""),
    original_feedback: String(value.original_feedback || ""),
    status: statuses.has(status) ? status : "queued",
    progress: String(value.progress || "等待执行"),
    source_project_id: String(value.source_project_id || ""),
    source_task_id: taskId,
    source_task_title: taskDisplayTitle(value.source_task_title, taskId),
    source_task_state: ["completed", "accepted"].includes(value.source_task_state) ? value.source_task_state : "completed",
    source_completion_at: String(value.source_completion_at || ""),
    source_run_id: String(value.source_run_id || ""),
    source_case_id: String(value.source_case_id || ""),
    local_project_id: String(value.local_project_id || ""),
    session_id: String(value.session_id || ""),
    thread_id: String(value.thread_id || ""),
    ready_at: String(value.ready_at || value.created_at || ""),
    current_run_id: String(value.current_run_id || ""),
    current_case_id: String(value.current_case_id || ""),
    evidence: Array.isArray(value.evidence) ? value.evidence.map(String).filter(Boolean).slice(0, 50) : [],
    result: String(value.result || ""),
    blocking_reason: String(value.blocking_reason || ""),
    intervention_kind: String(value.intervention_kind || (value.status === "external_wait" ? "external_dependency" : "")),
    created_at: String(value.created_at || ""),
    updated_at: String(value.updated_at || value.created_at || ""),
    resolved_at: String(value.resolved_at || "")
  };
}

export function buildRuntimeEnv(baseEnv, settings) {
  const proxy = normalizeSettings(settings).codex_proxy;
  if (!proxy.enabled) {
    return baseEnv;
  }
  return {
    ...baseEnv,
    HTTP_PROXY: proxy.url,
    HTTPS_PROXY: proxy.url,
    http_proxy: proxy.url,
    https_proxy: proxy.url
  };
}

export function ensureProjectSession(store, projectIdValue) {
  store.sessions ||= {};
  store.messages ||= {};
  store.sessions[projectIdValue] ||= [];
  if (store.sessions[projectIdValue].length === 0) {
    const session = {
      id: `SESSION-${projectIdValue}-default`,
      project_id: projectIdValue,
      title: "Automation",
      kind: "automation-task",
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    store.sessions[projectIdValue].push(session);
    store.messages[session.id] ||= [];
  }
  return store.sessions[projectIdValue][0];
}

export function getSession(store, projectIdValue, sessionIdValue = "") {
  ensureProjectSession(store, projectIdValue);
  const session = sessionIdValue
    ? store.sessions[projectIdValue].find((item) => item.id === sessionIdValue)
    : store.sessions[projectIdValue][0];
  if (!session) {
    throw new Error(`Unknown session: ${sessionIdValue}`);
  }
  store.messages[session.id] ||= [];
  return session;
}

export function findSession(store, projectIdValue, sessionIdValue = "") {
  ensureProjectSession(store, projectIdValue);
  const session = sessionIdValue
    ? store.sessions[projectIdValue].find((item) => item.id === sessionIdValue)
    : store.sessions[projectIdValue][0];
  if (!session) {
    return null;
  }
  store.messages[session.id] ||= [];
  return session;
}

export function deleteProjectSession(store, projectIdValue, sessionIdValue) {
  const sessions = store.sessions?.[projectIdValue] || [];
  const session = sessions.find((item) => item.id === sessionIdValue);
  if (!session) {
    return null;
  }
  store.sessions[projectIdValue] = sessions.filter((item) => item.id !== sessionIdValue);
  delete store.messages?.[sessionIdValue];
  return session;
}

export function findSessionById(store, sessionIdValue) {
  const id = String(sessionIdValue || "");
  for (const [projectIdValue, sessions] of Object.entries(store.sessions || {})) {
    const session = (sessions || []).find((item) => item.id === id);
    if (session) return { project_id: projectIdValue, session };
  }
  return null;
}

export function projectId(projectPath) {
  return createHash("sha256").update(resolve(projectPath)).digest("hex").slice(0, 16);
}

export async function writeJson(path, value) {
  await mkdir(dirname(path), { recursive: true });
  const tempPath = `${path}.${process.pid}.${Date.now()}.${Math.random().toString(16).slice(2)}.tmp`;
  try {
    await writeFile(tempPath, `${JSON.stringify(value, null, 2)}\n`, "utf8");
    await rename(tempPath, path);
  } catch (error) {
    await rm(tempPath, { force: true }).catch(() => {});
    throw error;
  }
}

export async function appendText(path, text) {
  await mkdir(dirname(path), { recursive: true });
  await writeFile(path, text, { encoding: "utf8", flag: "a" });
}

export async function appendJsonLine(path, value) {
  await appendText(path, `${JSON.stringify(value)}\n`);
}

async function readJsonWithRetry(path) {
  let lastError;
  for (let attempt = 0; attempt < 4; attempt += 1) {
    try {
      return JSON.parse(await readFile(path, "utf8"));
    } catch (error) {
      lastError = error;
      if (!(error instanceof SyntaxError) || attempt === 3) {
        break;
      }
      await delay(25 * (attempt + 1));
    }
  }
  throw lastError;
}

function delay(ms) {
  return new Promise((resolveDelay) => setTimeout(resolveDelay, ms));
}

function safeIdentifier(value, fallback) {
  const text = String(value || "").trim();
  return /^[a-zA-Z0-9_-]+$/.test(text) ? text : fallback;
}

function stringMap(value) {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return {};
  }
  return Object.fromEntries(Object.entries(value)
    .map(([key, item]) => [String(key), String(item || "").trim()])
    .filter(([, item]) => item));
}

function booleanMap(value) {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return {};
  }
  return Object.fromEntries(Object.entries(value).map(([key, item]) => [String(key), Boolean(item)]));
}

function compareScalarIds(left, right) {
  return String(left).localeCompare(String(right), undefined, { numeric: true });
}

function safeColorToken(value) {
  const text = String(value || "").trim();
  return /^[a-z0-9-]{1,32}$/i.test(text) ? text : "";
}

function nonNegativeInteger(value) {
  const number = Number(value);
  return Number.isSafeInteger(number) && number >= 0 ? number : 0;
}

function positiveSafeInteger(value) {
  const number = Number(value);
  return Number.isSafeInteger(number) && number > 0 ? number : 0;
}

function normalizeAutomationError(value) {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return {
      code: "task_source_error",
      status: 0,
      message: String(value || "Task source error"),
      project_id: "",
      section: ""
    };
  }
  return {
    code: String(value.code || "task_source_error"),
    status: Number(value.status || 0),
    message: String(value.message || "Task source error"),
    project_id: String(value.project_id || ""),
    section: String(value.section || "")
  };
}
