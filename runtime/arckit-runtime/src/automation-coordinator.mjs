import { EventEmitter } from "node:events";
import { createWorkshopTaskSource, TASK_STATES, TaskSourceError } from "./task-source-adapter.mjs";
import { isAgentContinuationHandoff } from "./kernel/continuation-policy.mjs";
import { selectEffectiveLoopHandoff } from "./kernel/effective-handoff.mjs";

const STATE_LABELS = Object.freeze({
  pending_review: "待评审",
  pending: "待处理",
  in_progress: "进行中",
  completed: "已完成",
  accepted: "已验收",
  cancelled: "已取消",
  blocked: "已阻塞"
});
const COMMIT_AGENT_TASK = "git commit";

export function createAutomationCoordinator({
  runManager,
  taskSourceFactory = createWorkshopTaskSource,
  now = () => new Date().toISOString()
}) {
  const emitter = new EventEmitter();
  let syncPromise = null;
  let dispatchPromise = null;
  let remoteSessionEpoch = 0;
  let runEventQueue = Promise.resolve();

  const unsubscribeRunManager = runManager.onEvent((event) => {
    runEventQueue = runEventQueue
      .then(() => handleRunEvent(event))
      .catch((error) => emit("automation.error", { message: error.message }));
  });

  async function getSnapshot(filter = {}) {
    const [store, localProjects, runs] = await Promise.all([
      runManager.readDesktopStore(),
      runManager.listProjects(),
      runManager.listRuns({})
    ]);
    const automation = store.automation;
    const taskCounts = countTasks(automation.snapshot.tasks);
    const projectIndex = new Map(automation.snapshot.projects.map((project) => [String(project.id), project]));
    const localIndex = new Map(localProjects.map((project) => [String(project.id), project]));
    const projects = automation.snapshot.projects.map((project) => {
      const remoteId = String(project.id);
      const localId = automation.project_bindings[remoteId] || "";
      const localProject = localIndex.get(localId) || null;
      const participating = automation.project_participation[remoteId] === true;
      const errors = automation.snapshot.errors.filter((error) => String(error.project_id || "") === remoteId);
      return {
        ...project,
        local_project_id: localId,
        local_project_name: localProject?.name || "",
        local_project_path: localProject?.path || "",
        participating,
        source_status: errors.length > 0 ? "error" : "healthy",
        eligible: Boolean(localProject && participating && errors.length === 0),
        task_counts: taskCounts.byProject[remoteId] || emptyStateCounts()
      };
    });
    const pendingCandidates = buildPendingCandidates(automation.snapshot.tasks, automation, projectIndex, localIndex);
    const queue = pendingCandidates
      .filter((task) => task.eligible)
      .sort(compareQueueTasks)
      .map((task, index) => ({ ...task, queue_position: index + 1 }));
    const blockedPendingTasks = pendingCandidates.filter((task) => !task.eligible);
    const activeRun = automation.active_task?.run_id
      ? runs.find((run) => run.id === automation.active_task.run_id) || null
      : null;
    const activeTask = automation.active_task
      ? {
          ...automation.active_task,
          local_project_path: automation.active_task.local_project_path
            || localIndex.get(automation.active_task.local_project_id)?.path
            || ""
        }
      : null;
    const selectedProjectId = String(filter.project_id || "all");
    const selectedState = TASK_STATES.includes(filter.state) ? filter.state : "";
    const tasks = automation.snapshot.tasks
      .filter((task) => selectedProjectId === "all" || String(task.project_id) === selectedProjectId)
      .filter((task) => !selectedState || task.state === selectedState)
      .map((task) => enrichTask(task, {
        automation,
        project: projectIndex.get(String(task.project_id)),
        localProject: localIndex.get(automation.project_bindings[String(task.project_id)] || ""),
        queue,
        pendingCandidates
      }));
    return {
      generated_at: now(),
      enabled: automation.enabled,
      queue_paused: automation.queue_paused,
      source_status: automation.snapshot.source_status,
      source_errors: automation.snapshot.errors,
      synced_at: automation.snapshot.synced_at,
      user: automation.snapshot.user,
      local_projects: localProjects,
      projects,
      selected_project_id: selectedProjectId,
      selected_state: selectedState,
      state_counts: selectedProjectId === "all"
        ? taskCounts.all
        : taskCounts.byProject[selectedProjectId] || emptyStateCounts(),
      tasks,
      queue,
      blocked_pending_tasks: blockedPendingTasks,
      active_task: activeTask,
      active_run: activeRun,
      attention_items: automation.attention_items,
      recovery_items: automation.recovery_items,
      recent_completions: automation.recent_completions.map((item) => {
        const run = runs.find((candidate) => candidate.id === item.run_id) || null;
        return {
          ...item,
          local_project_id: item.local_project_id || run?.project_id || "",
          session_id: item.session_id || run?.session_id || "",
          run_status: run?.status || ""
        };
      }),
      usage_baseline: buildUsageBaseline(runs, {
        projectId: activeTask?.local_project_id || "",
        excludeRunId: activeRun?.id || ""
      }),
      health: deriveHealth(automation, queue, blockedPendingTasks)
    };
  }

  async function sync({ dispatch = true } = {}) {
    if (syncPromise) {
      return syncPromise;
    }
    syncPromise = (async () => {
      const syncEpoch = remoteSessionEpoch;
      await patchAutomation((automation) => {
        automation.snapshot.source_status = "syncing";
        automation.snapshot.errors = [];
      });
      emit("automation.syncing", {});
      const store = await runManager.readDesktopStore();
      let taskSource;
      try {
        taskSource = taskSourceFactory({ settings: store.settings.task_source });
      } catch (error) {
        await patchAutomation((automation) => {
          automation.snapshot.source_status = error.code === "unconfigured" ? "unconfigured" : "error";
          automation.snapshot.errors = [errorRecord(error)];
        });
        emit("automation.changed", { reason: "sync-unavailable" });
        return getSnapshot();
      }

      if (typeof taskSource.getAuthStatus === "function") {
        const authentication = await taskSource.getAuthStatus();
        if (syncEpoch !== remoteSessionEpoch) return getSnapshot();
        if (!authentication.authenticated) {
          await patchAutomation((automation) => {
            if (authentication.status === "expired") {
              automation.snapshot.source_status = "unauthenticated";
              automation.snapshot.errors = [{ code: "unauthenticated", message: authentication.error || "Workshop 登录已过期，请重新登录。" }];
            } else {
              automation.snapshot = {
                user: null,
                projects: [],
                tasks: [],
                synced_at: "",
                source_status: "logged_out",
                errors: []
              };
            }
          });
          emit("automation.changed", { reason: "sync-requires-login" });
          return getSnapshot();
        }
      }

      try {
        const [user, projects] = await Promise.all([
          taskSource.getCurrentUser(),
          taskSource.listProjects()
        ]);
        const taskResults = await mapWithConcurrency(projects, 4, async (project) => {
          const executorId = currentExecutorId(project, user);
          try {
            if (!executorId) {
              throw new TaskSourceError("Cannot identify the current Workshop user in this project.", {
                code: "current_user_unresolved"
              });
            }
            return {
              project,
              executorId,
              tasks: await taskSource.listTasks(project.id, { executorId }),
              error: null
            };
          } catch (error) {
            return { project, executorId, tasks: [], error };
          }
        });
        const errors = taskResults
          .filter((result) => result.error)
          .map((result) => errorRecord(result.error, result.project.id));
        const tasks = taskResults.flatMap((result) => result.error
          ? retainAssignedSnapshotTasks(store.automation.snapshot.tasks, result.project.id, result.executorId)
          : result.tasks);
        if (syncEpoch !== remoteSessionEpoch) return getSnapshot();
        await patchAutomation((automation) => {
          automation.snapshot = {
            user,
            projects,
            tasks,
            synced_at: now(),
            source_status: errors.length > 0 ? "degraded" : "healthy",
            errors
          };
          for (const project of projects) {
            const id = String(project.id);
            if (!(id in automation.project_participation)) {
              automation.project_participation[id] = false;
            }
          }
          reconcileActiveTask(automation);
          reconcileUnassociatedInProgress(automation, now());
        });
        await reconcileDetachedRunCompletion();
        await stopRuntimeForExternalChange();
        await reconcileRuntimePresence();
        await resumeEligibleAgentRecovery();
        emit("automation.changed", { reason: "sync-complete" });
        if (dispatch) {
          await maybeStartNext();
        }
        return getSnapshot();
      } catch (error) {
        if (syncEpoch !== remoteSessionEpoch) return getSnapshot();
        await patchAutomation((automation) => {
          automation.snapshot.source_status = error.code === "unauthenticated" ? "unauthenticated" : "error";
          automation.snapshot.errors = [errorRecord(error)];
        });
        emit("automation.changed", { reason: "sync-failed" });
        return getSnapshot();
      }
    })();
    try {
      return await syncPromise;
    } finally {
      syncPromise = null;
    }
  }

  async function setEnabled(enabled) {
    await patchAutomation((automation) => {
      automation.enabled = Boolean(enabled);
      if (enabled) automation.queue_paused = false;
    });
    emit("automation.changed", { reason: enabled ? "enabled" : "disabled" });
    if (enabled) {
      await sync();
    }
    return getSnapshot();
  }

  async function setQueuePaused(paused) {
    await patchAutomation((automation) => {
      automation.queue_paused = Boolean(paused);
    });
    emit("automation.changed", { reason: paused ? "queue-paused" : "queue-resumed" });
    if (!paused) {
      await maybeStartNext();
    }
    return getSnapshot();
  }

  async function clearRemoteSession() {
    remoteSessionEpoch += 1;
    await patchAutomation((automation) => {
      automation.enabled = false;
      automation.queue_paused = false;
      automation.snapshot = {
        user: null,
        projects: [],
        tasks: [],
        synced_at: "",
        source_status: "logged_out",
        errors: []
      };
      automation.active_task = null;
      automation.attention_items = [];
      automation.recovery_items = [];
    });
    emit("automation.changed", { reason: "remote-session-cleared" });
    return getSnapshot();
  }

  async function bindProject(remoteProjectId, localProjectId) {
    const remoteId = requiredId(remoteProjectId, "Remote project");
    const localId = String(localProjectId || "").trim();
    const localProjects = await runManager.listProjects();
    if (localId && !localProjects.some((project) => project.id === localId)) {
      throw new Error(`Unknown local project: ${localId}`);
    }
    await patchAutomation((automation) => {
      if (localId) automation.project_bindings[remoteId] = localId;
      else delete automation.project_bindings[remoteId];
    });
    emit("automation.changed", { reason: "project-binding", projectId: remoteId });
    await maybeStartNext();
    return getSnapshot({ project_id: remoteId });
  }

  async function setProjectParticipation(remoteProjectId, participating) {
    const remoteId = requiredId(remoteProjectId, "Remote project");
    await patchAutomation((automation) => {
      automation.project_participation[remoteId] = Boolean(participating);
    });
    emit("automation.changed", { reason: "project-participation", projectId: remoteId });
    await maybeStartNext();
    return getSnapshot({ project_id: remoteId });
  }

  async function updateTaskState({ taskId, state, expectedState = "" }) {
    if (!TASK_STATES.includes(state)) {
      throw new Error(`Unsupported task state: ${state}`);
    }
    const store = await runManager.readDesktopStore();
    const task = store.automation.snapshot.tasks.find((item) => String(item.id) === String(taskId));
    if (!task) {
      throw new Error(`Unknown task: ${taskId}`);
    }
    if (expectedState && task.state !== expectedState) {
      throw new Error(`Task ${task.id} is ${task.state}, expected ${expectedState}.`);
    }
    const source = taskSourceFactory({ settings: store.settings.task_source });
    const project = store.automation.snapshot.projects.find((item) => String(item.id) === String(task.project_id));
    const executorId = requireCurrentExecutorId(project, store.automation.snapshot.user);
    const latest = await source.getTask(task.id, task.project_id, { executorId });
    if (!latest) {
      scheduleSync("task-reassigned");
      throw new TaskSourceError("Task is no longer assigned to the current user.", { code: "not_assigned" });
    }
    const updated = await source.updateTask({
      taskId: task.id,
      projectId: task.project_id,
      executorId,
      state,
      expectedVersion: latest.version
    });
    await patchAutomation((automation) => replaceTask(automation, updated));
    emit("automation.changed", { reason: "task-state", taskId: task.id, state });
    await sync();
    return updated;
  }

  async function submitIntervention({ taskId, message }) {
    const text = String(message || "").trim();
    if (!text) {
      throw new Error("Intervention message is required.");
    }
    const store = await runManager.readDesktopStore();
    const active = store.automation.active_task;
    if (!active || String(active.task_id) !== String(taskId)) {
      throw new Error("The selected task is not the active task.");
    }
    const runs = await runManager.listRuns({ projectId: active.local_project_id });
    const run = runs.find((item) => item.id === active.run_id);
    const attention = store.automation.attention_items.find((item) => String(item.task_id) === String(active.task_id));
    if (run?.status === "running") {
      await runManager.controlRun(run.id, { type: "steer", message: text });
      await patchAutomation((automation) => {
        automation.active_task.phase = "running";
        automation.attention_items = automation.attention_items.filter((item) => item.task_id !== active.task_id);
      });
    } else {
      const task = store.automation.snapshot.tasks.find((item) => String(item.id) === String(active.task_id));
      const session = await ensureTaskSession(active, task);
      await runManager.addMessage(active.local_project_id, {
        session_id: session.id,
        role: "user",
        kind: "intervention",
        content: text,
        task_id: active.task_id
      });
      const nextRun = await runManager.startRun({
        projectId: active.local_project_id,
        sessionId: session.id,
        taskId: active.task_id,
        task: buildInterventionTask(text),
        runtimeContext: {
          kind: "human_intervention",
          source_run_id: run?.id || active.run_id || "",
          source_result_ref: run?.result_file || "",
          source_activity_ref: run?.activity_file || "",
          human_gate: {
            reason: attention?.reason || "",
            decision_needed: attention?.question || ""
          }
        },
        adapter: "codex-app-server",
        approvalPolicy: "on-request",
        continuationPolicy: "automatic",
        maxAutoRounds: 8
      });
      await patchAutomation((automation) => {
        automation.active_task.phase = "running";
        automation.active_task.run_id = nextRun.id;
        automation.attention_items = automation.attention_items.filter((item) => item.task_id !== active.task_id);
      });
    }
    emit("automation.changed", { reason: "intervention-submitted", taskId: active.task_id });
    return getSnapshot();
  }

  async function stopCurrent() {
    const store = await runManager.readDesktopStore();
    const active = store.automation.active_task;
    if (!active?.run_id) {
      throw new Error("No active Runtime to stop.");
    }
    await runManager.controlRun(active.run_id, { type: "interrupt" });
    await addRecovery({
      type: "safe_stop_requested",
      task: active,
      message: "Runtime stop was requested. The remote task remains in progress until facts are reconciled.",
      actions: ["retry_sync", "retry_start", "mark_blocked"]
    });
    return getSnapshot();
  }

  async function resolveRecovery({ recoveryId, action }) {
    const store = await runManager.readDesktopStore();
    const recovery = store.automation.recovery_items.find((item) => item.id === recoveryId);
    if (!recovery) {
      throw new Error(`Unknown recovery item: ${recoveryId}`);
    }
    if (!recovery.actions.includes(action)) {
      throw new Error(`Recovery action ${action} is not allowed.`);
    }
    if (action === "retry_sync") {
      await removeRecovery(recoveryId);
      return sync();
    }
    if (action === "retry_start") {
      await removeRecovery(recoveryId);
      await patchAutomation((automation) => {
        if (automation.active_task) automation.active_task.phase = "starting";
      });
      await startRuntimeForActiveTask();
      return getSnapshot();
    }
    if (action === "retry_complete") {
      await completeRemoteTask();
      return getSnapshot();
    }
    if (action === "retry_commit") {
      await removeRecovery(recoveryId);
      await startCommitAgent();
      return getSnapshot();
    }
    if (action === "accept_server_state") {
      const taskId = recovery.task_id || store.automation.active_task?.task_id;
      await patchAutomation((automation) => {
        if (automation.active_task?.task_id === taskId) automation.active_task = null;
        automation.attention_items = automation.attention_items.filter((item) => item.task_id !== taskId);
        automation.recovery_items = automation.recovery_items.filter((item) => item.task_id !== taskId);
      });
      return sync();
    }
    if (action === "mark_blocked") {
      const taskId = recovery.task_id || store.automation.active_task?.task_id;
      await updateTaskState({ taskId, state: "blocked" });
      await patchAutomation((automation) => {
        automation.active_task = null;
        automation.attention_items = [];
        automation.recovery_items = automation.recovery_items.filter((item) => item.id !== recoveryId && item.task_id !== taskId);
      });
      return sync();
    }
    throw new Error(`Unsupported recovery action: ${action}`);
  }

  async function maybeStartNext() {
    if (dispatchPromise) {
      return dispatchPromise;
    }
    dispatchPromise = (async () => {
      const store = await runManager.readDesktopStore();
      const automation = store.automation;
      if (!automation.enabled
        || automation.queue_paused
        || automation.active_task
        || automation.attention_items.length > 0
        || automation.recovery_items.some((item) => item.freeze_scope === "global")
        || !["healthy", "degraded"].includes(automation.snapshot.source_status)) {
        return null;
      }
      const localIndex = new Map(store.projects.map((project) => [String(project.id), project]));
      const projectIndex = new Map(automation.snapshot.projects.map((project) => [String(project.id), project]));
      const queue = buildQueue(automation.snapshot.tasks, automation, projectIndex, localIndex);
      const candidate = queue[0];
      if (!candidate) {
        return null;
      }
      const taskSource = taskSourceFactory({ settings: store.settings.task_source });
      try {
        const executorId = requireCurrentExecutorId(
          projectIndex.get(String(candidate.project_id)),
          automation.snapshot.user
        );
        const latest = await taskSource.getTask(candidate.id, candidate.project_id, { executorId });
        if (!latest || latest.state !== "pending" || (candidate.version && latest.version && candidate.version !== latest.version)) {
          scheduleSync("candidate-changed");
          return null;
        }
        const claimed = await taskSource.updateTask({
          taskId: candidate.id,
          projectId: candidate.project_id,
          executorId,
          state: "in_progress",
          expectedVersion: latest.version
        });
        await patchAutomation((next) => {
          replaceTask(next, claimed);
          next.active_task = {
            task_id: claimed.id,
            project_id: claimed.project_id,
            task_title: claimed.title,
            local_project_id: candidate.local_project_id,
            local_project_path: candidate.local_project_path,
            server_version: claimed.version,
            phase: "starting",
            run_id: "",
            session_id: "",
            claimed_at: now(),
            started_at: ""
          };
        });
        emit("automation.changed", { reason: "task-claimed", taskId: claimed.id });
        return startRuntimeForActiveTask();
      } catch (error) {
        if (error instanceof TaskSourceError && error.code === "version_conflict") {
          emit("automation.claim-conflict", { taskId: candidate.id });
          scheduleSync("claim-conflict");
          return null;
        }
        await addRecovery({
          type: "claim_failed",
          task: candidate,
          message: error.message,
          actions: ["retry_sync"],
          freezeScope: "global"
        });
        return null;
      }
    })();
    try {
      return await dispatchPromise;
    } finally {
      dispatchPromise = null;
    }
  }

  async function startRuntimeForActiveTask() {
    const store = await runManager.readDesktopStore();
    const active = store.automation.active_task;
    if (!active) {
      return null;
    }
    const project = store.projects.find((item) => item.id === active.local_project_id);
    const task = store.automation.snapshot.tasks.find((item) => item.id === active.task_id);
    if (!project || !task) {
      await addRecovery({
        type: "start_failed",
        task: active,
        message: "The local project binding or remote task snapshot is missing.",
        actions: ["retry_sync", "mark_blocked"]
      });
      return null;
    }
    try {
      const session = await ensureTaskSession(active, task);
      await runManager.addMessage(project.id, {
        session_id: session.id,
        role: "user",
        kind: "automation-task",
        content: task.content || task.title,
        task_id: active.task_id
      });
      const run = await runManager.startRun({
        projectId: project.id,
        sessionId: session.id,
        taskId: active.task_id,
        task: buildAutomationTask(task),
        adapter: "codex-app-server",
        approvalPolicy: "on-request",
        continuationPolicy: "automatic",
        maxAutoRounds: 8
      });
      await patchAutomation((automation) => {
        if (!automation.active_task || automation.active_task.task_id !== active.task_id) return;
        automation.active_task.run_id = run.id;
        automation.active_task.phase = "running";
        automation.active_task.started_at = now();
      });
      emit("automation.changed", { reason: "runtime-started", taskId: active.task_id, runId: run.id });
      return run;
    } catch (error) {
      await addRecovery({
        type: "start_failed",
        task: active,
        message: error.message,
        actions: ["retry_start", "mark_blocked"]
      });
      return null;
    }
  }

  async function handleRunEvent(event) {
    if (event.type === "run.auto_continue.started") {
      await patchAutomation((automation) => {
        if (automation.active_task?.run_id === event.sourceRunId) {
          const taskId = automation.active_task.task_id;
          automation.active_task.run_id = event.runId;
          automation.active_task.phase = "running";
          automation.recovery_items = automation.recovery_items.filter((item) => (
            item.task_id !== taskId || !["runtime_incomplete", "runtime_continuation_stopped", "runtime_process_missing"].includes(item.type)
          ));
        }
      });
      emit("automation.changed", { reason: "runtime-auto-continue", runId: event.runId });
      return;
    }
    if (["run.auto_continue.not_started", "run.auto_continue.failed"].includes(event.type)) {
      const store = await runManager.readDesktopStore();
      const active = store.automation.active_task;
      if (!active || active.run_id !== event.sourceRunId) return;
      await addRecovery({
        type: "runtime_continuation_stopped",
        task: active,
        message: event.message || `Runtime auto-continuation stopped: ${event.reason || "unknown reason"}.`,
        actions: ["retry_start", "mark_blocked"]
      });
      return;
    }
    if (event.type !== "run.finished") {
      return;
    }
    const store = await runManager.readDesktopStore();
    const active = store.automation.active_task;
    if (!active || active.run_id !== event.runId) {
      return;
    }
    if (active.phase === "committing") {
      if (event.status === "completed") {
        await completeRemoteTask();
      } else {
        await addRecovery({
          type: "commit_failed",
          task: active,
          message: `Commit agent finished with status ${event.status}.`,
          actions: ["retry_commit", "mark_blocked"]
        });
      }
      return;
    }
    const runtimeResult = event.result?.runtime_result || null;
    const handoff = selectEffectiveLoopHandoff({ runtimeResult, activity: event.activity });
    const ledgerRequired = runtimeResult?.ledger_stage?.writeback_required === true;
    const ledgerWritten = event.activity?.ledger_write_result?.parsed?.written === true;
    if (handoff.next_responsibility === "human" || handoff.human_decision_required === true) {
      await setAwaitingHuman({ active, runId: event.runId, handoff });
      return;
    }
    if (event.status === "completed" && isAgentContinuationHandoff(handoff)) {
      await patchAutomation((automation) => {
        if (automation.active_task?.run_id === event.runId) {
          automation.active_task.phase = "continuing";
        }
      });
      emit("automation.changed", { reason: "runtime-continuing", taskId: active.task_id });
      return;
    }
    const caseComplete = handoff.next_responsibility === "none" || handoff.status === "complete";
    if (event.status === "completed" && caseComplete && (!ledgerRequired || ledgerWritten)) {
      await startCommitAgent();
      return;
    }
    await addRecovery({
      type: "runtime_incomplete",
      task: active,
      message: event.status === "completed"
        ? handoff.responsibility_reason || "Runtime stopped before the task reached a complete handoff."
        : `Runtime finished with status ${event.status}.`,
      actions: ["retry_start", "mark_blocked"]
    });
  }

  async function startCommitAgent() {
    const store = await runManager.readDesktopStore();
    const active = store.automation.active_task;
    if (!active) return null;
    await patchAutomation((automation) => {
      if (automation.active_task?.task_id === active.task_id) {
        automation.active_task.phase = "committing";
      }
    });
    try {
      const task = store.automation.snapshot.tasks.find((item) => String(item.id) === String(active.task_id));
      const session = await ensureTaskSession(active, task);
      const run = await runManager.startAgentTask({
        projectId: active.local_project_id,
        sessionId: session.id,
        taskId: active.task_id,
        task: COMMIT_AGENT_TASK,
        adapter: "codex-app-server",
        approvalPolicy: "on-request"
      });
      await patchAutomation((automation) => {
        if (automation.active_task?.task_id !== active.task_id) return;
        automation.active_task.case_run_id ||= active.run_id;
        automation.active_task.run_id = run.id;
        automation.active_task.commit_run_id = run.id;
        automation.active_task.phase = "committing";
      });
      emit("automation.changed", { reason: "commit-agent-started", taskId: active.task_id, runId: run.id });
      return run;
    } catch (error) {
      await addRecovery({
        type: "commit_start_failed",
        task: active,
        message: error.message,
        actions: ["retry_commit", "mark_blocked"]
      });
      return null;
    }
  }

  async function completeRemoteTask({ syncAfter = true } = {}) {
    const store = await runManager.readDesktopStore();
    const active = store.automation.active_task;
    if (!active) return null;
    const task = store.automation.snapshot.tasks.find((item) => item.id === active.task_id);
    const source = taskSourceFactory({ settings: store.settings.task_source });
    await patchAutomation((automation) => {
      if (automation.active_task) automation.active_task.phase = "completing";
    });
    try {
      const project = store.automation.snapshot.projects.find((item) => String(item.id) === String(active.project_id));
      const executorId = requireCurrentExecutorId(project, store.automation.snapshot.user);
      const latest = await source.getTask(active.task_id, active.project_id, { executorId });
      if (!latest || latest.state !== "in_progress") {
        throw new TaskSourceError("Task is no longer assigned to the current user or is no longer in progress.", {
          code: "not_assigned"
        });
      }
      const completed = await source.updateTask({
        taskId: active.task_id,
        projectId: active.project_id,
        executorId,
        state: "completed",
        expectedVersion: latest.version || task?.version || active.server_version
      });
      await patchAutomation((automation) => {
        replaceTask(automation, completed);
        automation.recent_completions.unshift({
          task_id: completed.id,
          project_id: completed.project_id,
          title: completed.title,
          run_id: active.case_run_id || active.run_id,
          commit_run_id: active.commit_run_id || "",
          local_project_id: active.local_project_id,
          session_id: active.session_id || "",
          completed_at: now()
        });
        automation.recent_completions = automation.recent_completions.slice(0, 30);
        automation.active_task = null;
        automation.attention_items = automation.attention_items.filter((item) => item.task_id !== active.task_id);
        automation.recovery_items = automation.recovery_items.filter((item) => item.task_id !== active.task_id);
      });
      emit("automation.changed", { reason: "task-completed", taskId: completed.id });
      if (syncAfter) {
        await sync();
      }
      return completed;
    } catch (error) {
      await addRecovery({
        type: "completion_writeback_failed",
        task: active,
        message: error.message,
        actions: ["retry_sync", "retry_complete", "mark_blocked"]
      });
      return null;
    }
  }

  async function reconcileDetachedRunCompletion() {
    const store = await runManager.readDesktopStore();
    const active = store.automation.active_task;
    if (!active?.run_id || runManager.isRunActive?.(active.run_id)) return null;

    const runs = await runManager.listRuns({ projectId: active.local_project_id });
    const runByParent = new Map();
    for (const run of runs) {
      const parentId = String(run.auto_continue_from_run_id || "").trim();
      if (!parentId) continue;
      const existing = runByParent.get(parentId);
      if (!existing || compareRunRecency(existing, run) < 0) {
        runByParent.set(parentId, run);
      }
    }

    let latest = runs.find((run) => run.id === active.run_id) || null;
    const visited = new Set();
    while (latest && !visited.has(latest.id)) {
      visited.add(latest.id);
      const child = runByParent.get(latest.id);
      if (!child) break;
      latest = child;
    }
    if (!latest) return null;

    if (active.phase === "committing" && latest.entry_capability === "agent-task" && latest.status !== "completed") {
      if (["failed", "aborted"].includes(latest.status)) {
        await addRecovery({
          type: "commit_failed",
          task: { ...active, run_id: latest.id },
          message: `Commit agent finished with status ${latest.status}.`,
          actions: ["retry_commit", "mark_blocked"]
        });
      }
      return null;
    }

    if (latest.status !== "completed") return null;

    if (active.phase === "committing" && latest.entry_capability === "agent-task") {
      await patchAutomation((automation) => {
        if (automation.active_task?.task_id !== active.task_id) return;
        automation.active_task.run_id = latest.id;
        automation.active_task.phase = "completing";
        automation.recovery_items = automation.recovery_items.filter((item) => item.task_id !== active.task_id);
      });
      return completeRemoteTask({ syncAfter: false });
    }

    const activity = latest.activity || {};
    const handoff = selectEffectiveLoopHandoff({ activity });
    if (handoff.next_responsibility === "human" || handoff.human_decision_required === true) {
      await setAwaitingHuman({ active, runId: latest.id, handoff });
      return null;
    }
    const caseComplete = handoff.next_responsibility === "none"
      || handoff.status === "done"
      || handoff.status === "complete";
    const ledgerRequired = activity.ledger_stage?.writeback_required === true;
    const ledgerWritten = activity.ledger_write_result?.parsed?.written === true;
    if (!caseComplete || (ledgerRequired && !ledgerWritten)) return null;

    await patchAutomation((automation) => {
      if (automation.active_task?.task_id !== active.task_id) return;
      automation.active_task.run_id = latest.id;
      automation.active_task.phase = "completing";
      automation.recovery_items = automation.recovery_items.filter((item) => item.task_id !== active.task_id);
    });
    return startCommitAgent();
  }

  async function ensureTaskSession(active, task) {
    const sessions = await runManager.listSessions(active.local_project_id);
    if (active.session_id) {
      const existing = sessions.find((item) => item.id === active.session_id);
      if (!existing) {
        throw new Error(`The task session no longer exists: ${active.session_id}`);
      }
      if (existing.task_id && String(existing.task_id) !== String(active.task_id)) {
        throw new Error(`The task session belongs to another task: ${existing.task_id}`);
      }
      return existing;
    }
    const session = await runManager.createSession(active.local_project_id, {
      title: `待办 · ${task?.title || active.task_title || active.task_id}`,
      kind: "automation-task",
      task_id: active.task_id,
      remote_project_id: active.project_id
    });
    await patchAutomation((automation) => {
      if (automation.active_task?.task_id === active.task_id) {
        automation.active_task.session_id = session.id;
      }
    });
    return session;
  }

  async function setAwaitingHuman({ active, runId, handoff }) {
    await patchAutomation((automation) => {
      if (automation.active_task?.task_id !== active.task_id) return;
      automation.active_task.run_id = runId;
      automation.active_task.phase = "awaiting_human";
      automation.recovery_items = automation.recovery_items.filter((item) => (
        item.task_id !== active.task_id
        || !["runtime_incomplete", "runtime_continuation_stopped", "runtime_process_missing"].includes(item.type)
      ));
      automation.attention_items = upsertById(automation.attention_items, {
        id: `ATTENTION-${automation.active_task.task_id}`,
        task_id: automation.active_task.task_id,
        project_id: automation.active_task.project_id,
        run_id: runId,
        reason: handoff.responsibility_reason || "Runtime requires a human decision.",
        question: handoff.human_gate?.decision_needed || handoff.next_prompt || "Review the Runtime request and provide direction.",
        created_at: now()
      });
    });
    emit("automation.changed", { reason: "awaiting-human", taskId: active.task_id });
  }

  async function addRecovery({ type, task, message, actions, freezeScope = "global" }) {
    await patchAutomation((automation) => {
      const taskId = task?.task_id || task?.id || "unknown";
      if (automation.active_task) automation.active_task.phase = "recovery";
      automation.recovery_items = upsertById(automation.recovery_items, {
        id: `RECOVERY-${type}-${taskId}`,
        type,
        task_id: taskId,
        project_id: task?.project_id || "",
        run_id: task?.run_id || "",
        message,
        freeze_scope: freezeScope,
        responsibility: "operator",
        actions,
        created_at: now()
      });
    });
    emit("automation.changed", { reason: "recovery", type });
  }

  async function removeRecovery(recoveryId) {
    await patchAutomation((automation) => {
      automation.recovery_items = automation.recovery_items.filter((item) => item.id !== recoveryId);
    });
  }

  async function reconcileRuntimePresence() {
    const store = await runManager.readDesktopStore();
    const active = store.automation.active_task;
    if (!active || ["starting", "continuing", "awaiting_human", "completing", "recovery"].includes(active.phase)) return;
    if (active.run_id && runManager.isRunActive?.(active.run_id)) return;
    if (active.phase === "committing") {
      await addRecovery({
        type: "commit_process_missing",
        task: active,
        message: "The commit agent run is no longer attached locally.",
        actions: ["retry_commit", "mark_blocked"]
      });
      return;
    }
    await addRecovery({
      type: "runtime_process_missing",
      task: active,
      message: active.run_id
        ? "The active task association was restored, but its Runtime process is no longer attached."
        : "The server task is in progress, but no Runtime run is attached locally.",
      actions: ["retry_start", "mark_blocked"]
    });
  }

  async function resumeEligibleAgentRecovery() {
    const store = await runManager.readDesktopStore();
    const active = store.automation.active_task;
    if (!active || active.phase !== "recovery" || !active.run_id) return;
    const recovery = store.automation.recovery_items.find((item) => (
      item.task_id === active.task_id
      && item.run_id === active.run_id
      && ["runtime_incomplete", "runtime_continuation_stopped"].includes(item.type)
    ));
    if (!recovery || typeof runManager.resumeAutoContinuation !== "function") return;
    const runs = await runManager.listRuns({ projectId: active.local_project_id });
    const run = runs.find((item) => item.id === active.run_id);
    const handoff = selectEffectiveLoopHandoff({ activity: run?.activity });
    if (run?.status !== "completed" || !isAgentContinuationHandoff(handoff)) return;

    await patchAutomation((automation) => {
      if (automation.active_task?.run_id !== active.run_id) return;
      automation.active_task.phase = "continuing";
      automation.recovery_items = automation.recovery_items.filter((item) => (
        item.task_id !== active.task_id || !["runtime_incomplete", "runtime_continuation_stopped", "runtime_process_missing"].includes(item.type)
      ));
    });
    try {
      const result = await runManager.resumeAutoContinuation(active.run_id);
      if (result?.status !== "started") {
        await addRecovery({
          type: "runtime_continuation_stopped",
          task: active,
          message: result?.message || "Runtime automatic continuation did not start.",
          actions: ["retry_start", "mark_blocked"]
        });
      }
    } catch (error) {
      await addRecovery({
        type: "runtime_continuation_stopped",
        task: active,
        message: error.message,
        actions: ["retry_start", "mark_blocked"]
      });
    }
  }

  async function stopRuntimeForExternalChange() {
    const store = await runManager.readDesktopStore();
    const active = store.automation.active_task;
    if (!active) return;
    const recovery = store.automation.recovery_items.find((item) => (
      item.task_id === active.task_id && ["external_state_change", "task_missing"].includes(item.type)
    ));
    if (!recovery) return;
    let stopError = "";
    if (active.run_id && runManager.isRunActive?.(active.run_id)) {
      try {
        await runManager.controlRun(active.run_id, { type: "interrupt" });
      } catch (error) {
        stopError = error.message;
      }
    }
    await patchAutomation((automation) => {
      if (automation.active_task?.task_id === active.task_id) automation.active_task.phase = "recovery";
      const item = automation.recovery_items.find((candidate) => candidate.id === recovery.id);
      if (item) {
        item.message = stopError
          ? `${item.message} Runtime safe stop failed: ${stopError}. Review preserved evidence before accepting the server state.`
          : `${item.message} Runtime safe stop was requested; accept the server state after reviewing preserved evidence.`;
        item.actions = ["retry_sync", "accept_server_state"];
      }
    });
  }

  async function patchAutomation(mutator) {
    return runManager.updateDesktopStore((store) => {
      mutator(store.automation, store);
      return store;
    });
  }

  function emit(type, payload) {
    emitter.emit("event", { type, at: now(), ...payload });
  }

  function scheduleSync(reason) {
    setTimeout(() => {
      sync().catch((error) => emit("automation.error", { reason, message: error.message }));
    }, 0);
  }

  return {
    onEvent(listener) {
      emitter.on("event", listener);
      return () => emitter.off("event", listener);
    },
    dispose() {
      unsubscribeRunManager?.();
    },
    getSnapshot,
    sync,
    setEnabled,
    setQueuePaused,
    clearRemoteSession,
    bindProject,
    setProjectParticipation,
    updateTaskState,
    submitIntervention,
    stopCurrent,
    resolveRecovery,
    maybeStartNext
  };
}

export function buildQueue(tasks, automation, projectIndex, localIndex) {
  return buildPendingCandidates(tasks, automation, projectIndex, localIndex)
    .filter((task) => task.eligible)
    .sort(compareQueueTasks)
    .map((task, index) => ({ ...task, queue_position: index + 1 }));
}

export function buildPendingCandidates(tasks, automation, projectIndex, localIndex) {
  return tasks
    .filter((task) => task.state === "pending")
    .map((task) => {
      const remoteId = String(task.project_id);
      const localProjectId = automation.project_bindings[remoteId] || "";
      const localProject = localIndex.get(localProjectId) || null;
      const project = projectIndex.get(remoteId) || null;
      const projectError = automation.snapshot.errors.some((error) => String(error.project_id || "") === remoteId);
      return {
        ...task,
        project_name: project?.name || remoteId,
        local_project_id: localProjectId,
        local_project_path: localProject?.path || "",
        eligible: Boolean(localProject && automation.project_participation[remoteId] === true && !projectError),
        eligibility_reason: !localProject
          ? "未绑定本地工作区"
          : automation.project_participation[remoteId] !== true
            ? "项目未允许自动领取"
            : projectError ? "任务源异常" : "可执行",
        eligibility_code: !localProject
          ? "project_unbound"
          : automation.project_participation[remoteId] !== true
            ? "project_not_participating"
            : projectError ? "task_source_error" : "eligible"
      };
    });
}

export function compareQueueTasks(left, right) {
  return Number(right.priority || 0) - Number(left.priority || 0)
    || timestamp(left.state_changed_at || left.updated_at || left.created_at) - timestamp(right.state_changed_at || right.updated_at || right.created_at)
    || String(left.project_id).localeCompare(String(right.project_id))
    || String(left.id).localeCompare(String(right.id));
}

function countTasks(tasks) {
  const all = emptyStateCounts();
  const byProject = {};
  for (const task of tasks) {
    if (!TASK_STATES.includes(task.state)) continue;
    all[task.state] += 1;
    const id = String(task.project_id);
    byProject[id] ||= emptyStateCounts();
    byProject[id][task.state] += 1;
  }
  return { all, byProject };
}

function emptyStateCounts() {
  return Object.fromEntries(TASK_STATES.map((state) => [state, 0]));
}

function compareRunRecency(left, right) {
  const depthDelta = Number(left?.auto_continue_depth || 0) - Number(right?.auto_continue_depth || 0);
  if (depthDelta !== 0) return depthDelta;
  const timeDelta = String(left?.started_at || "").localeCompare(String(right?.started_at || ""));
  if (timeDelta !== 0) return timeDelta;
  return String(left?.id || "").localeCompare(String(right?.id || ""));
}

function currentExecutorId(project, user) {
  const direct = scalarId(project?.current_user_id ?? project?.currentUserId);
  if (direct) return direct;
  const members = Array.isArray(project?.raw?.members)
    ? project.raw.members
    : Array.isArray(project?.members) ? project.members : [];
  const currentMember = members.find((member) => member?.is_me === true)
    || members.find((member) => user?.name && String(member?.username || "") === String(user.name));
  return scalarId(currentMember?.user_id ?? user?.id);
}

function requireCurrentExecutorId(project, user) {
  const executorId = currentExecutorId(project, user);
  if (!executorId) {
    throw new TaskSourceError("Cannot identify the current Workshop user in this project.", {
      code: "current_user_unresolved"
    });
  }
  return executorId;
}

function retainAssignedSnapshotTasks(tasks, projectId, executorId) {
  if (!executorId) return [];
  return tasks.filter((task) => String(task.project_id) === String(projectId))
    .filter((task) => scalarId(task.executor_id ?? task.raw?.executor_id) === executorId);
}

function enrichTask(task, { automation, project, localProject, queue, pendingCandidates }) {
  const queueItem = queue.find((item) => item.id === task.id);
  const pendingCandidate = pendingCandidates.find((item) => item.id === task.id);
  return {
    ...task,
    state_label: STATE_LABELS[task.state] || task.state,
    project_name: project?.name || String(task.project_id),
    local_project_id: localProject?.id || "",
    local_project_path: localProject?.path || "",
    participating: automation.project_participation[String(task.project_id)] === true,
    eligible: Boolean(queueItem),
    eligibility_code: pendingCandidate?.eligibility_code || "not_pending",
    eligibility_reason: pendingCandidate?.eligibility_reason || "任务当前不是待处理状态",
    queue_position: queueItem?.queue_position || null
  };
}

function deriveHealth(automation, queue, blockedPendingTasks = []) {
  if (automation.recovery_items.length > 0) return { state: "recovery", label: "需要恢复", tone: "danger" };
  if (automation.attention_items.length > 0) return { state: "attention", label: "等待人工", tone: "warning" };
  if (automation.snapshot.source_status === "logged_out") return { state: "logged_out", label: "Workshop 未登录", tone: "neutral" };
  if (automation.snapshot.source_status === "unauthenticated") return { state: "unauthenticated", label: "认证已失效", tone: "danger" };
  if (automation.snapshot.source_status !== "healthy") return { state: automation.snapshot.source_status, label: "任务源异常", tone: "warning" };
  if (!automation.enabled) return { state: "disabled", label: "自动领取已关闭", tone: "neutral" };
  if (automation.queue_paused) return { state: "paused", label: "领取已暂停", tone: "neutral" };
  if (automation.active_task) return { state: "running", label: "自动执行中", tone: "accent" };
  if (blockedPendingTasks.length > 0) return { state: "configuration_required", label: "待处理任务尚不可领取", tone: "warning" };
  if (queue.length === 0) return { state: "idle", label: "队列已清空", tone: "success" };
  return { state: "ready", label: "准备领取", tone: "success" };
}

function replaceTask(automation, task) {
  if (!task) return;
  const index = automation.snapshot.tasks.findIndex((item) => item.id === task.id);
  if (index >= 0) automation.snapshot.tasks[index] = task;
  else automation.snapshot.tasks.push(task);
}

function reconcileActiveTask(automation) {
  const active = automation.active_task;
  if (!active) return;
  const task = automation.snapshot.tasks.find((item) => item.id === active.task_id);
  if (!task) {
    automation.recovery_items = upsertById(automation.recovery_items, {
      id: `RECOVERY-task-missing-${active.task_id}`,
      type: "task_missing",
      task_id: active.task_id,
      project_id: active.project_id,
      run_id: active.run_id,
      message: "The active task is missing from the latest server snapshot.",
      freeze_scope: "global",
      responsibility: "operator",
      actions: ["retry_sync"],
      created_at: new Date().toISOString()
    });
    return;
  }
  if (task.state !== "in_progress") {
    automation.recovery_items = upsertById(automation.recovery_items, {
      id: `RECOVERY-external-change-${active.task_id}`,
      type: "external_state_change",
      task_id: active.task_id,
      project_id: active.project_id,
      run_id: active.run_id,
      message: `The active task changed to ${task.state} on the server.`,
      freeze_scope: "global",
      responsibility: "operator",
      actions: ["retry_sync", "accept_server_state"],
      created_at: new Date().toISOString()
    });
  }
}

function reconcileUnassociatedInProgress(automation, occurredAt) {
  if (automation.active_task) return;
  automation.recovery_items = automation.recovery_items.filter((item) => ![
    "multiple_active_tasks",
    "discovered_in_progress"
  ].includes(item.type));
  const projectErrors = new Set(automation.snapshot.errors.map((error) => String(error.project_id || "")).filter(Boolean));
  const candidates = automation.snapshot.tasks.filter((task) => {
    const projectId = String(task.project_id);
    return task.state === "in_progress"
      && Boolean(automation.project_bindings[projectId])
      && automation.project_participation[projectId] === true
      && !projectErrors.has(projectId);
  });
  if (candidates.length === 0) return;
  if (candidates.length > 1) {
    automation.recovery_items = upsertById(automation.recovery_items, {
      id: "RECOVERY-multiple-active-tasks",
      type: "multiple_active_tasks",
      task_id: "multiple",
      project_id: "",
      run_id: "",
      message: `Multiple server tasks are in progress (${candidates.map((task) => task.id).join(", ")}). Mark non-target tasks blocked in Task Browser, then retry sync.`,
      freeze_scope: "global",
      responsibility: "operator",
      actions: ["retry_sync"],
      created_at: occurredAt
    });
    return;
  }
  const task = candidates[0];
  const projectId = String(task.project_id);
  automation.active_task = {
    task_id: task.id,
    project_id: projectId,
    task_title: task.title,
    local_project_id: automation.project_bindings[projectId],
    local_project_path: "",
    server_version: task.version,
    phase: "recovery",
    run_id: "",
    session_id: "",
    claimed_at: "",
    started_at: ""
  };
  automation.recovery_items = upsertById(automation.recovery_items, {
    id: `RECOVERY-discovered-in-progress-${task.id}`,
    type: "discovered_in_progress",
    task_id: task.id,
    project_id: projectId,
    run_id: "",
    message: "A unique in-progress server task was restored. Confirm resuming the same task or mark it blocked.",
    freeze_scope: "global",
    responsibility: "operator",
    actions: ["retry_start", "mark_blocked"],
    created_at: occurredAt
  });
}

function upsertById(items, item) {
  const filtered = items.filter((candidate) => candidate.id !== item.id);
  return [item, ...filtered].slice(0, 50);
}

async function mapWithConcurrency(items, limit, mapper) {
  const results = new Array(items.length);
  let cursor = 0;
  const workers = Array.from({ length: Math.min(Math.max(limit, 1), items.length) }, async () => {
    while (cursor < items.length) {
      const index = cursor++;
      results[index] = await mapper(items[index], index);
    }
  });
  await Promise.all(workers);
  return results;
}

function errorRecord(error, projectId = "") {
  return {
    code: error?.code || "task_source_error",
    status: Number(error?.status || 0),
    message: error?.message || String(error),
    project_id: String(projectId || "")
  };
}

function requiredId(value, label) {
  const id = String(value || "").trim();
  if (!id) throw new Error(`${label} id is required.`);
  return id;
}

function scalarId(value) {
  return ["string", "number"].includes(typeof value) && String(value).trim()
    ? String(value).trim()
    : "";
}

function timestamp(value) {
  const result = Date.parse(value || "");
  return Number.isFinite(result) ? result : Number.MAX_SAFE_INTEGER;
}

export function buildAutomationTask(task) {
  return String(task?.content || task?.title || "").trim();
}

export function buildInterventionTask(message) {
  return String(message || "").trim();
}

export function buildUsageBaseline(runs, { projectId = "", excludeRunId = "" } = {}) {
  const samples = (runs || []).filter((run) => (
    run.id !== excludeRunId
    && (!projectId || run.project_id === projectId)
    && (run.entry_capability || "runtime") === "runtime"
    && run.status === "completed"
    && Number(run.activity?.token_usage?.summary?.logical_total_tokens || 0) > 0
  )).slice(0, 20);
  return {
    schema_version: "runtime-usage-baseline/v1",
    kind: "runtime_history_median",
    sample_size: samples.length,
    logical_total_tokens: median(samples.map((run) => run.activity.token_usage.summary.logical_total_tokens)),
    cached_input_tokens: median(samples.map((run) => run.activity.token_usage.summary.cached_input_tokens)),
    uncached_input_tokens: median(samples.map((run) => run.activity.token_usage.summary.uncached_input_tokens)),
    output_tokens: median(samples.map((run) => run.activity.token_usage.summary.output_tokens)),
    model_time_ms: median(samples.map((run) => run.activity?.performance?.model_time_ms || 0)),
    command_time_ms: median(samples.map((run) => run.activity?.performance?.command_time_ms || 0))
  };
}

function median(values) {
  const sorted = values.map(Number).filter(Number.isFinite).sort((left, right) => left - right);
  if (sorted.length === 0) return 0;
  const middle = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 0 ? (sorted[middle - 1] + sorted[middle]) / 2 : sorted[middle];
}
