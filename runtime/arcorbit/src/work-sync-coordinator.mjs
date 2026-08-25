import { EventEmitter } from "node:events";
import { TASK_STATES, TaskSourceError, normalizeTask } from "./task-source-adapter.mjs";

const INVALIDATION_DEBOUNCE_MS = 300;

export function createWorkSyncCoordinator({
  runManager,
  taskSource,
  platformSource = taskSource?.platform,
  now = () => new Date().toISOString(),
  wait = (milliseconds) => new Promise((resolve) => setTimeout(resolve, milliseconds))
}) {
  if (!runManager || !taskSource || !platformSource) {
    throw new TypeError("Work Sync requires a run manager, Workshop authenticated service, and platform adapter.");
  }
  const emitter = new EventEmitter();
  const projectRefreshes = new Map();
  const invalidations = new Map();
  let reconcilePromise = null;
  let sessionEpoch = 0;

  async function getSnapshot({ automationOnly = false } = {}) {
    return snapshotFromStore(await runManager.readDesktopStore(), { automationOnly });
  }

  function attachLocalProjection(store) {
    const projection = snapshotFromStore(store, { automationOnly: true });
    store.automation.snapshot = {
      user: projection.user,
      projects: projection.projects,
      tasks: projection.tasks,
      synced_at: projection.synced_at,
      source_status: projection.source_status,
      errors: projection.errors
    };
    store.automation.realtime = projection.realtime;
    return store;
  }

  async function reconcile({ dispatch = true, reason = "reconcile" } = {}) {
    if (reconcilePromise) return reconcilePromise;
    reconcilePromise = (async () => {
      const epoch = sessionEpoch;
      await patchTaskSync((sync) => {
        sync.source_status = "syncing";
        sync.errors = [];
      });
      emit("work.syncing", { reason });
      try {
        const authentication = await taskSource.getAuthStatus();
        if (epoch !== sessionEpoch) return getSnapshot();
        if (!authentication.authenticated) {
          await patchTaskSync((sync) => {
            if (authentication.status === "expired") {
              sync.source_status = "unauthenticated";
              sync.errors = [errorRecord(Object.assign(new Error(authentication.error || "Workshop 登录已过期，请重新登录。"), { code: "unauthenticated" }))];
            } else {
              clearTaskSyncIdentity(sync, "logged_out");
            }
          });
          emit("work.changed", { reason: "requires-login" });
          return getSnapshot();
        }
        const [user, projects] = await Promise.all([
          taskSource.getCurrentUser(),
          taskSource.listProjects()
        ]);
        if (epoch !== sessionEpoch) return getSnapshot();
        const store = await runManager.readDesktopStore();
        const projectIds = demandedProjectIds(store, projects);
        const results = await mapWithConcurrency(projectIds, 4, async (projectId) => loadProject(projectId, projects));
        if (epoch !== sessionEpoch) return getSnapshot();
        const errors = results.filter((result) => result.error).map((result) => errorRecord(result.error, result.projectId));
        const accessibleIds = new Set(projects.map((project) => String(project.id)));
        const identityKey = stableIdentityKey(user, authentication);
        await patchTaskSync((sync) => {
          if (sync.identity_key && sync.identity_key !== identityKey) {
            sync.projects = {};
            sync.session_epoch += 1;
          }
          sync.identity_key = identityKey;
          sync.user = user;
          sync.project_catalog = projects;
          sync.last_reconciled_at = now();
          sync.errors = errors;
          sync.source_status = errors.length > 0 ? "degraded" : "healthy";
          for (const projectId of Object.keys(sync.projects)) {
            if (!accessibleIds.has(projectId)) delete sync.projects[projectId];
          }
          for (const result of results) {
            if (result.error) {
              const previous = sync.projects[result.projectId];
              if (previous) {
                previous.state = "degraded";
                previous.error = String(result.error?.message || result.error);
                previous.updated_at = now();
              }
              continue;
            }
            commitProject(sync, result.project, result.tasks, result.tags, { trusted: true, timestamp: now() });
          }
        });
        emit("work.changed", { reason, projectIds, dispatch });
        return getSnapshot();
      } catch (error) {
        if (epoch !== sessionEpoch) return getSnapshot();
        await patchTaskSync((sync) => {
          sync.source_status = error?.code === "unauthenticated" ? "unauthenticated"
            : error?.code === "unconfigured" ? "unconfigured" : "error";
          sync.errors = [errorRecord(error)];
        });
        emit("work.error", { reason, message: String(error?.message || error) });
        return getSnapshot();
      }
    })();
    try {
      return await reconcilePromise;
    } finally {
      reconcilePromise = null;
    }
  }

  async function refreshProject(projectId, { reason = "project-refresh" } = {}) {
    const id = requiredId(projectId, "Project");
    if (projectRefreshes.has(id)) return projectRefreshes.get(id);
    const promise = (async () => {
      const epoch = sessionEpoch;
      const store = await runManager.readDesktopStore();
      const sync = store.platform.task_sync;
      const project = sync.project_catalog.find((item) => String(item.id) === id)
        || sync.projects[id]?.project;
      if (!project) return reconcile({ reason });
      try {
        const loaded = await loadProject(id, sync.project_catalog);
        if (loaded.error) throw loaded.error;
        if (epoch !== sessionEpoch) return getSnapshot();
        await patchTaskSync((next) => {
          commitProject(next, loaded.project, loaded.tasks, loaded.tags, { trusted: true, timestamp: now() });
          next.errors = next.errors.filter((item) => String(item.project_id || "") !== id);
          next.source_status = next.errors.length > 0 ? "degraded" : "healthy";
        });
        emit("work.changed", { reason, projectIds: [id] });
        return getSnapshot();
      } catch (error) {
        if (epoch !== sessionEpoch) return getSnapshot();
        await patchTaskSync((next) => {
          const current = next.projects[id];
          if (current) {
            current.state = "degraded";
            current.error = String(error?.message || error);
            current.updated_at = now();
          }
          next.errors = [...next.errors.filter((item) => String(item.project_id || "") !== id), errorRecord(error, id)];
          next.source_status = "degraded";
        });
        emit("work.error", { reason, projectId: id, message: String(error?.message || error) });
        throw error;
      }
    })();
    projectRefreshes.set(id, promise);
    try {
      return await promise;
    } finally {
      projectRefreshes.delete(id);
    }
  }

  async function invalidateProject(projectId, input = {}) {
    const id = requiredId(projectId, "Project");
    const current = invalidations.get(id) || { eventTypes: new Set(), promise: null };
    for (const eventType of input.event_types || []) current.eventTypes.add(String(eventType));
    if (!current.promise) {
      const invalidationEpoch = sessionEpoch;
      current.promise = (async () => {
        await wait(INVALIDATION_DEBOUNCE_MS);
        invalidations.delete(id);
        if (invalidationEpoch !== sessionEpoch) return getSnapshot();
        return refreshProject(id, { reason: input.reason || "realtime-invalidation" });
      })();
      invalidations.set(id, current);
    }
    return current.promise;
  }

  async function updateTaskState({ taskId, state, expectedState = "" }) {
    if (!TASK_STATES.includes(state)) throw new TypeError(`Unsupported task state: ${state}`);
    return mutateTask(taskId, { state }, {
      expectedState,
      responseReason: "task-state-response",
      refreshReason: "task-state-confirmed"
    });
  }

  async function createTask(input = {}) {
    const projectId = requiredId(input.project_id, "Project");
    const created = await platformSource.createTask(input);
    const normalized = normalizeTask(created?.task ?? created, projectId);
    if (normalized) await commitTaskResponse(normalized, { reason: "task-created-response" });
    try {
      await refreshProject(projectId, { reason: "task-created" });
    } catch {
      // The remote create already succeeded. Work keeps the response projection and
      // its degraded sync state instead of inviting a duplicate create retry.
    }
    return findLocalTask(await runManager.readDesktopStore(), created?.id ?? created?.task_id) || created;
  }

  async function replaceTaskProject(input = {}) {
    const store = await runManager.readDesktopStore();
    const sourceTask = findLocalTask(store, input.source_task_id);
    if (!sourceTask) throw new TaskSourceError(`Unknown local task: ${input.source_task_id}`, { code: "not_found" });
    const targetProjectId = requiredId(input.target_project_id, "Target project");
    if (String(sourceTask.project_id) === targetProjectId) {
      throw new TaskSourceError("The replacement target must be a different project.", { code: "conflict" });
    }
    const replacementId = taskReplacementId(sourceTask.project_id, sourceTask.id);
    const existing = store.platform.task_sync.task_replacements?.[replacementId];
    if (existing) return partialTaskReplacement(existing);

    const createInput = replacementCreateInput(input, sourceTask, targetProjectId);
    const targetTask = await createTask(createInput);
    const targetTaskId = String(targetTask?.id || targetTask?.task_id || "").trim();
    if (!targetTaskId) throw new TaskSourceError("Workshop created a replacement task without returning its id.", { code: "invalid_response" });
    const replacement = {
      id: replacementId,
      status: "source_delete_pending",
      source_task_id: String(sourceTask.id),
      source_project_id: String(sourceTask.project_id),
      target_task_id: targetTaskId,
      target_project_id: targetProjectId,
      error: "",
      created_at: now(),
      updated_at: now()
    };
    await patchTaskSync((sync) => { sync.task_replacements[replacementId] = replacement; });
    emit("work.changed", {
      reason: "task-replacement-target-confirmed",
      projectIds: [String(sourceTask.project_id), targetProjectId],
      sourceTaskId: String(sourceTask.id),
      targetTaskId
    });
    return deleteReplacementSource(replacementId);
  }

  async function retryTaskProjectReplacement(input = {}) {
    const replacementId = requiredId(input.replacement_id, "Task replacement");
    return deleteReplacementSource(replacementId);
  }

  async function keepTaskProjectReplacement(input = {}) {
    const replacementId = requiredId(input.replacement_id, "Task replacement");
    let replacement;
    await patchTaskSync((sync) => {
      replacement = sync.task_replacements[replacementId];
      if (!replacement) throw new TaskSourceError(`Unknown task replacement: ${replacementId}`, { code: "not_found" });
      delete sync.task_replacements[replacementId];
    });
    emit("work.changed", {
      reason: "task-replacement-kept-both",
      projectIds: [replacement.source_project_id, replacement.target_project_id],
      sourceTaskId: replacement.source_task_id,
      targetTaskId: replacement.target_task_id
    });
    return { ...replacement, status: "completed", outcome: "kept_both" };
  }

  async function deleteReplacementSource(replacementId) {
    const store = await runManager.readDesktopStore();
    const replacement = store.platform.task_sync.task_replacements?.[replacementId];
    if (!replacement) throw new TaskSourceError(`Unknown task replacement: ${replacementId}`, { code: "not_found" });
    const sourceTask = findLocalTask(store, replacement.source_task_id);
    if (!sourceTask) {
      await clearTaskReplacement(replacementId, replacement, "task-replacement-source-already-absent");
      return { ...replacement, status: "completed", outcome: "source_already_absent" };
    }
    try {
      await deleteTask(sourceTask.id);
      await clearTaskReplacement(replacementId, replacement, "task-replacement-completed");
      return { ...replacement, status: "completed", outcome: "source_deleted" };
    } catch (error) {
      const message = String(error?.message || error);
      const failed = { ...replacement, status: "source_delete_failed", error: message, updated_at: now() };
      await patchTaskSync((sync) => { sync.task_replacements[replacementId] = failed; });
      emit("work.error", {
        reason: "task-replacement-source-delete",
        projectId: replacement.source_project_id,
        sourceTaskId: replacement.source_task_id,
        targetTaskId: replacement.target_task_id,
        message
      });
      return partialTaskReplacement(failed, error);
    }
  }

  async function clearTaskReplacement(replacementId, replacement, reason) {
    await patchTaskSync((sync) => { delete sync.task_replacements[replacementId]; });
    emit("work.changed", {
      reason,
      projectIds: [replacement.source_project_id, replacement.target_project_id],
      sourceTaskId: replacement.source_task_id,
      targetTaskId: replacement.target_task_id
    });
  }

  async function updateTask(taskId, input = {}, { expectedState = "" } = {}) {
    if (input.state !== undefined && !TASK_STATES.includes(input.state)) {
      throw new TypeError(`Unsupported task state: ${input.state}`);
    }
    return mutateTask(taskId, input, {
      expectedState,
      responseReason: "task-updated-response",
      refreshReason: "task-updated"
    });
  }

  async function mutateTask(taskId, input, { expectedState = "", responseReason, refreshReason }) {
    const store = await runManager.readDesktopStore();
    const stateMutation = input.state !== undefined;
    const task = findLocalTask(store, taskId, { trustedOnly: stateMutation || Boolean(expectedState) });
    if (!task) throw new TaskSourceError(`Unknown local task: ${taskId}`, { code: "not_found" });
    if (expectedState && task.state !== expectedState) {
      throw new TaskSourceError(`Task ${task.id} is ${task.state}, expected ${expectedState}.`, { code: "conflict" });
    }
    let response;
    try {
      response = await platformSource.updateTask(task.id, input);
      const normalized = normalizeTask(response?.task ?? response, task.project_id);
      if (normalized?.id === task.id) await commitTaskResponse(normalized, { reason: responseReason });
      await refreshProject(task.project_id, { reason: refreshReason });
    } catch (error) {
      await recordMutationFailure(task.project_id, error);
      throw error;
    }
    const confirmed = findLocalTask(await runManager.readDesktopStore(), task.id, { trustedOnly: stateMutation });
    if (stateMutation && (!confirmed || confirmed.state !== input.state)) {
      throw new TaskSourceError(`Work Sync did not observe task ${task.id} in ${input.state}.`, { code: "conflict" });
    }
    return confirmed || response;
  }

  async function deleteTask(taskId) {
    const store = await runManager.readDesktopStore();
    const task = findLocalTask(store, taskId);
    if (!task) throw new TaskSourceError(`Unknown local task: ${taskId}`, { code: "not_found" });
    try {
      const response = await platformSource.deleteTask(task.id);
      await refreshProject(task.project_id, { reason: "task-deleted" });
      return response;
    } catch (error) {
      await recordMutationFailure(task.project_id, error);
      throw error;
    }
  }

  async function clearSession() {
    sessionEpoch += 1;
    invalidations.clear();
    await patchTaskSync((sync) => {
      sync.session_epoch += 1;
      clearTaskSyncIdentity(sync, "logged_out");
    });
    emit("work.changed", { reason: "session-cleared" });
    return getSnapshot();
  }

  async function getRealtimeProjectState(projectId) {
    const store = await runManager.readDesktopStore();
    return store.platform.task_sync.projects[String(projectId)] || {};
  }

  async function updateRealtimeProjectState(projectId, update) {
    const id = requiredId(projectId, "Project");
    await patchTaskSync((sync) => {
      const project = sync.project_catalog.find((item) => String(item.id) === id) || { id, name: id };
      sync.projects[id] = {
        project,
        tasks: [],
        tags: [],
        trusted: false,
        revision: 0,
        synced_at: "",
        state: "idle",
        mode: "unknown",
        cursor: 0,
        last_event_at: "",
        last_refreshed_at: "",
        updated_at: "",
        error: "",
        ...(sync.projects[id] || {}),
        ...update
      };
    });
    emit("work.sync", { projectId: id, ...update });
  }

  async function realtimeProjectIds() {
    const store = await runManager.readDesktopStore();
    return demandedProjectIds(store, store.platform.task_sync.project_catalog);
  }

  async function loadProject(projectId, projects) {
    const id = String(projectId);
    const project = projects.find((item) => String(item.id) === id) || { id, name: id };
    try {
      const [tasks, tags] = await Promise.all([
        platformSource.listProjectTasks(id, { states: TASK_STATES, tree: false }),
        platformSource.listProjectTags(id)
      ]);
      return { projectId: id, project, tasks, tags, error: null };
    } catch (error) {
      return { projectId: id, project, tasks: [], tags: [], error };
    }
  }

  async function commitTaskResponse(task, { reason }) {
    await patchTaskSync((sync) => {
      const project = sync.projects[String(task.project_id)];
      if (!project) return;
      const index = project.tasks.findIndex((item) => String(item.id) === String(task.id));
      if (index >= 0) project.tasks[index] = task;
      else project.tasks.push(task);
      project.revision += 1;
      project.synced_at = now();
      project.last_refreshed_at = project.synced_at;
      project.updated_at = project.synced_at;
    });
    emit("work.changed", { reason, projectIds: [String(task.project_id)], taskId: String(task.id) });
  }

  async function recordMutationFailure(projectId, error) {
    await patchTaskSync((sync) => {
      sync.errors = [...sync.errors.filter((item) => String(item.project_id || "") !== String(projectId)), errorRecord(error, projectId)];
      sync.source_status = "degraded";
    });
    emit("work.error", { reason: "task-mutation", projectId: String(projectId), message: String(error?.message || error) });
  }

  async function patchTaskSync(mutator) {
    return runManager.updateDesktopStore((store) => {
      mutator(store.platform.task_sync, store);
      return store;
    });
  }

  function emit(type, payload) {
    emitter.emit("event", { type, at: now(), ...payload });
  }

  return {
    onEvent(listener) {
      emitter.on("event", listener);
      return () => emitter.off("event", listener);
    },
    getSnapshot,
    attachLocalProjection,
    reconcile,
    refreshProject,
    invalidateProject,
    updateTaskState,
    createTask,
    replaceTaskProject,
    retryTaskProjectReplacement,
    keepTaskProjectReplacement,
    updateTask,
    deleteTask,
    clearSession,
    getRealtimeProjectState,
    updateRealtimeProjectState,
    realtimeProjectIds
  };
}

export function snapshotFromStore(store, { automationOnly = false } = {}) {
  const sync = store?.platform?.task_sync || {};
  const projectRecords = Object.values(sync.projects || {});
  const records = automationOnly ? projectRecords.filter((item) => item.trusted) : projectRecords;
  const catalogIndex = new Map((sync.project_catalog || []).map((project) => [String(project.id), project]));
  const projects = records.map((item) => item.project || catalogIndex.get(String(item.project?.id || ""))).filter(Boolean);
  const tasks = records.flatMap((item) => automationOnly
    ? item.tasks.filter((task) => isCurrentExecutorTask(task, item.project, sync.user))
    : item.tasks);
  const errors = Array.isArray(sync.errors) ? sync.errors : [];
  return {
    user: sync.user || null,
    projects,
    project_catalog: sync.project_catalog || [],
    task_replacements: Object.values(sync.task_replacements || {}),
    tasks,
    tags: records.flatMap((item) => item.tags || []),
    synced_at: String(sync.last_reconciled_at || records.map((item) => item.synced_at).filter(Boolean).sort().at(-1) || ""),
    source_status: String(sync.source_status || "logged_out"),
    errors,
    realtime: realtimeProjection(sync.projects || {}),
    project_states: Object.fromEntries(records.map((item) => [String(item.project?.id || ""), item]))
  };
}

function demandedProjectIds(store, accessibleProjects) {
  const accessible = new Set((accessibleProjects || []).map((project) => String(project.id)));
  const platform = store.platform || {};
  const activeWorkset = (platform.worksets || []).find((item) => item.id === platform.active_workset_id) || platform.worksets?.[0];
  const ids = new Set((activeWorkset?.project_ids || []).map(String));
  for (const [projectId, participating] of Object.entries(store.automation?.project_participation || {})) {
    if (participating) ids.add(String(projectId));
  }
  for (const execution of Object.values(store.automation?.active_executions || {})) {
    if (execution?.project_id) ids.add(String(execution.project_id));
  }
  if (store.automation?.active_task?.project_id) ids.add(String(store.automation.active_task.project_id));
  return [...ids].filter((projectId) => accessible.has(projectId)).sort(compareScalarIds);
}

function commitProject(sync, project, tasks, tags, { trusted, timestamp }) {
  const id = String(project.id);
  const previous = sync.projects[id] || {};
  sync.projects[id] = {
    project,
    tasks,
    tags,
    trusted,
    revision: Number(previous.revision || 0) + 1,
    synced_at: timestamp,
    state: previous.state || "idle",
    mode: previous.mode || "unknown",
    cursor: Number(previous.cursor || 0),
    last_event_at: previous.last_event_at || "",
    last_refreshed_at: timestamp,
    updated_at: timestamp,
    error: ""
  };
}

function findLocalTask(store, taskId, { trustedOnly = false } = {}) {
  const id = String(taskId);
  return Object.values(store?.platform?.task_sync?.projects || {})
    .filter((project) => !trustedOnly || project.trusted)
    .flatMap((project) => project.tasks || [])
    .find((task) => String(task.id) === id) || null;
}

function clearTaskSyncIdentity(sync, status) {
  sync.identity_key = "";
  sync.user = null;
  sync.project_catalog = [];
  sync.projects = {};
  sync.task_replacements = {};
  sync.source_status = status;
  sync.last_reconciled_at = "";
  sync.errors = [];
}

function taskReplacementId(projectId, taskId) {
  return `${String(projectId)}:${String(taskId)}`;
}

function replacementCreateInput(input, sourceTask, targetProjectId) {
  const output = {
    project_id: targetProjectId,
    content: input.content === undefined ? sourceTask.content : input.content,
    state: input.state === undefined ? sourceTask.state : input.state
  };
  for (const key of ["priority", "executor_id", "father_id", "tags"]) {
    if (input[key] !== undefined) output[key] = input[key];
  }
  return output;
}

function partialTaskReplacement(replacement, error = null) {
  return {
    status: "partial",
    error: {
      code: String(error?.code || "source_delete_failed_after_target_creation"),
      message: String(error?.message || replacement.error || `Target task ${replacement.target_task_id} was created, but source task ${replacement.source_task_id} was not deleted.`)
    },
    partial_result: {
      status: "target_created_source_delete_pending",
      replacement_id: replacement.id,
      source_task_id: replacement.source_task_id,
      source_project_id: replacement.source_project_id,
      target_task_id: replacement.target_task_id,
      target_project_id: replacement.target_project_id
    }
  };
}

function isCurrentExecutorTask(task, project, user) {
  const executorId = String(project?.current_user_id || user?.id || "");
  return Boolean(executorId) && String(task?.executor_id || "") === executorId;
}

function realtimeProjection(projects) {
  const entries = Object.fromEntries(Object.entries(projects).map(([id, item]) => [id, {
    state: item.state || "idle",
    mode: item.mode || "unknown",
    cursor: Number(item.cursor || 0),
    last_event_at: item.last_event_at || "",
    last_refreshed_at: item.last_refreshed_at || "",
    updated_at: item.updated_at || "",
    error: item.error || ""
  }]));
  const active = Object.values(entries).filter((item) => item.state !== "idle");
  const states = active.map((item) => item.state);
  const modes = [...new Set(active.map((item) => item.mode).filter((mode) => mode && mode !== "unknown"))];
  return {
    status: states.length === 0 ? "idle"
      : states.every((state) => state === "connected") ? "connected"
        : states.some((state) => state === "degraded") ? "degraded"
          : states.some((state) => state === "reconnecting") ? "reconnecting"
            : states.some((state) => state === "recovering") ? "recovering" : "connecting",
    mode: modes.length === 0 ? "unknown" : modes.length === 1 ? modes[0] : "mixed",
    last_refreshed_at: active.map((item) => item.last_refreshed_at).filter(Boolean).sort().at(-1) || "",
    projects: entries
  };
}

function stableIdentityKey(user, authentication) {
  return String(user?.id || authentication?.masked_identity || "authenticated");
}

function errorRecord(error, projectId = "") {
  return {
    code: String(error?.code || "work_sync_error"),
    status: Number(error?.status || 0),
    message: String(error?.message || error || "Work Sync failed"),
    project_id: String(projectId || "")
  };
}

function requiredId(value, label) {
  const id = String(value || "").trim();
  if (!id) throw new TypeError(`${label} id is required.`);
  return id;
}

async function mapWithConcurrency(values, limit, mapper) {
  const result = new Array(values.length);
  let index = 0;
  async function worker() {
    while (index < values.length) {
      const current = index;
      index += 1;
      result[current] = await mapper(values[current], current);
    }
  }
  await Promise.all(Array.from({ length: Math.min(limit, values.length) }, worker));
  return result;
}

function compareScalarIds(left, right) {
  return String(left).localeCompare(String(right), undefined, { numeric: true });
}
