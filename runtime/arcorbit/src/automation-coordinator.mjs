import { EventEmitter } from "node:events";
import { randomUUID } from "node:crypto";
import { selectEffectiveLoopHandoff } from "./kernel/effective-handoff.mjs";
import { buildCodexCliHandoffPrompt, createInteractiveCodexCliLauncher } from "./interactive-cli-launcher.mjs";
import { taskDisplayTitle } from "./task-display-title.mjs";
import { snapshotFromStore } from "./work-sync-coordinator.mjs";

const STATE_LABELS = Object.freeze({
  pending_review: "待评审",
  pending: "待处理",
  in_progress: "进行中",
  completed: "已完成",
  accepted: "已验收",
  cancelled: "已取消",
  blocked: "已阻塞"
});
const CASE_ID_PATTERN = /^CASE-\d{8}-\d{3}$/;
const AUTHORITATIVE_CASE_BINDING_SOURCE = "runtime_ledger";
const TASK_STATES = Object.freeze(["pending_review", "pending", "in_progress", "completed", "accepted", "cancelled", "blocked"]);

export function createAutomationCoordinator({
  runManager,
  workSync,
  now = () => new Date().toISOString(),
  cliLauncher = createInteractiveCodexCliLauncher(),
  setupReadinessPreflight = async () => ({ ready: true }),
  wait = (milliseconds) => new Promise((resolve) => setTimeout(resolve, milliseconds)),
  safeStopTimeoutMs = 8_000
}) {
  workSync ||= createStoreBackedTaskStateBoundary(runManager);
  const emitter = new EventEmitter();
  let syncPromise = null;
  let dispatchPromise = null;
  let runEventQueue = Promise.resolve();

  const unsubscribeRunManager = runManager.onEvent((event) => {
    runEventQueue = runEventQueue
      .then(() => handleRunEvent(event))
      .catch((error) => emit("automation.error", { message: error.message }));
  });

  async function getSnapshot(filter = {}) {
    const [store, localProjects, runs] = await Promise.all([
      readStore(),
      runManager.listProjects(),
      listRunSummaries(runManager)
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
    const acceptanceFeedbackQueue = buildAcceptanceFeedbackQueue(automation.acceptance_feedback_items, {
      selectedProjectId: String(filter.project_id || "all")
    });
    const activeRun = automation.active_task?.run_id
      ? await getRunDetail(runManager, runs, automation.active_task.run_id)
      : null;
    const activeTask = automation.active_task
      ? {
          ...automation.active_task,
          task_title: taskDisplayTitle(automation.active_task.task_title, automation.active_task.task_id),
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
        pendingCandidates,
        acceptanceFeedbackItems: automation.acceptance_feedback_items
      }));
    return {
      generated_at: now(),
      enabled: automation.enabled,
      queue_paused: automation.queue_paused,
      source_status: automation.snapshot.source_status,
      source_errors: automation.snapshot.errors,
	  realtime: automation.realtime,
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
      todo_queue: queue,
      blocked_pending_tasks: blockedPendingTasks,
      acceptance_feedback_queue: acceptanceFeedbackQueue,
      acceptance_feedback_counts: countAcceptanceFeedback(automation.acceptance_feedback_items, selectedProjectId),
      active_execution: activeTask,
      active_task: activeTask,
      active_run: activeRun,
      attention_items: automation.attention_items,
      recovery_items: automation.recovery_items.map((item) => ({
        ...item,
        actions: recoveryActionsForItem(item, automation.active_task)
      })),
      recent_completions: automation.recent_completions.map((item) => {
        const run = runs.find((candidate) => candidate.id === item.run_id) || null;
        return {
          ...item,
          title: taskDisplayTitle(item.title, item.task_id),
          local_project_id: item.local_project_id || run?.project_id || "",
          session_id: item.session_id || run?.session_id || "",
          run_status: run?.status || ""
        };
      }),
      usage_baseline: buildUsageBaseline(runs, {
        projectId: activeTask?.local_project_id || "",
        excludeRunId: activeRun?.id || ""
      }),
      health: deriveHealth(automation, queue, blockedPendingTasks, acceptanceFeedbackQueue)
    };
  }

  async function sync({ dispatch = true, resumeRecoverable = false } = {}) {
    if (syncPromise) return syncPromise;
    syncPromise = (async () => {
      await workSync.reconcile({ dispatch: false, reason: "automation-request" });
      await reconcileDetachedRunCompletion({ allowRemoteCompletion: false });
      await reconcileCanonicalCaseState({ allowRemoteCompletion: false });
      return handleTaskProjectionChanged({ type: "work.changed", reason: "automation-sync", dispatch, resumeRecoverable });
    })();
    try {
      return await syncPromise;
    } finally {
      syncPromise = null;
    }
  }

	async function refreshProject(projectId, { dispatch = true } = {}) {
		const remoteId = requiredId(projectId, "Remote project");
		await workSync.refreshProject(remoteId, { reason: "automation-request" });
		return handleTaskProjectionChanged({ type: "work.changed", reason: "project-refresh", projectId: remoteId, dispatch });
	}

  async function handleTaskProjectionChanged({ reason = "local-task-state", dispatch = true, resumeRecoverable = false } = {}) {
    await patchAutomation((automation) => {
      for (const project of automation.snapshot.projects) {
        const id = String(project.id);
        if (!(id in automation.project_participation)) automation.project_participation[id] = false;
      }
      reconcileActiveTask(automation);
      reconcileUnassociatedInProgress(automation, now());
    });
    await reconcileDetachedRunCompletion({ allowRemoteCompletion: true });
    await reconcileCanonicalCaseState({ allowRemoteCompletion: true });
    await stopRuntimeForExternalChange();
    await reconcileRuntimePresence();
    if (resumeRecoverable) await resumeRecoverableTaskOnStartup();
    emit("automation.changed", { reason });
    if (dispatch) await maybeStartNext();
    return getSnapshot();
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
    await patchAutomation((automation) => {
      automation.enabled = false;
      automation.queue_paused = false;
      if (automation.active_task?.execution_kind === "acceptance_feedback") {
        const item = automation.acceptance_feedback_items.find((entry) => entry.feedback_id === automation.active_task.feedback_id);
        if (item) {
          item.status = "queued";
          item.progress = "Workshop 退出后保留，等待重新登录";
          item.ready_at ||= now();
          item.updated_at = now();
        }
      }
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
    await workSync.reconcile({ dispatch: false, reason: "automation-participation" });
    await maybeStartNext();
    return getSnapshot({ project_id: remoteId });
  }

  async function updateTaskState({ taskId, state, expectedState = "" }) {
    if (!TASK_STATES.includes(state)) {
      throw new Error(`Unsupported task state: ${state}`);
    }
    const store = await readStore();
    const task = store.automation.snapshot.tasks.find((item) => String(item.id) === String(taskId));
    if (!task) {
      throw new Error(`Unknown task: ${taskId}`);
    }
    if (expectedState && task.state !== expectedState) {
      throw new Error(`Task ${task.id} is ${task.state}, expected ${expectedState}.`);
    }
    if (state === "accepted" && store.automation.acceptance_feedback_items.some((item) => (
      String(item.source_task_id) === String(task.id)
      && !["resolved", "cancelled"].includes(item.status)
    ))) {
      throw new Error("仍有未解决的验收问题，不能标记为已验收。");
    }
    const updated = await workSync.updateTaskState({ taskId: task.id, state, expectedState: expectedState || task.state });
    emit("automation.changed", { reason: "task-state", taskId: task.id, state });
    await handleTaskProjectionChanged({ reason: "task-state", dispatch: true });
    return updated;
  }

  async function submitIntervention({ taskId, message }) {
    const text = String(message || "").trim();
    if (!text) {
      throw new Error("Intervention message is required.");
    }
    const store = await readStore();
    const active = store.automation.active_task;
    if (!active || String(active.task_id) !== String(taskId)) {
      throw new Error("The selected task is not the active task.");
    }
    const run = await getRunDetail(runManager, [], active.run_id, { projectId: active.local_project_id });
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
          kind: active.execution_kind === "acceptance_feedback" ? "acceptance_feedback_intervention" : "human_intervention",
          feedback_id: active.feedback_id || "",
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
        maxNoProgressRounds: 8
      });
      await patchAutomation((automation) => {
        automation.active_task.phase = "running";
        automation.active_task.run_id = nextRun.id;
        automation.attention_items = automation.attention_items.filter((item) => item.task_id !== active.task_id);
        if (automation.active_task.execution_kind === "acceptance_feedback") {
          const item = automation.acceptance_feedback_items.find((entry) => entry.feedback_id === automation.active_task.feedback_id);
          if (item) {
            item.status = "running";
            item.progress = "已收到人工说明，Agent 继续处理";
            item.current_run_id = nextRun.id;
            item.updated_at = now();
          }
        }
      });
    }
    emit("automation.changed", { reason: "intervention-submitted", taskId: active.task_id });
    return getSnapshot();
  }

  async function submitAcceptanceFeedback({ taskId, message, idempotencyKey = "" }) {
    const text = String(message || "").trim();
    const key = String(idempotencyKey || "").trim();
    if (!text) throw new Error("验收问题不能为空。");
    if (!key) throw new Error("验收问题缺少幂等标识。");
    const store = await readStore();
    const existing = store.automation.acceptance_feedback_items.find((item) => item.idempotency_key === key);
    if (existing && (String(existing.source_task_id) !== String(taskId) || existing.original_feedback !== text)) {
      throw new Error("验收问题幂等标识与另一项提交冲突。");
    }
    const task = store.automation.snapshot.tasks.find((item) => String(item.id) === String(taskId));
    if (!task || task.state !== "completed") {
      throw new Error("只有已完成待办可以提出验收问题。");
    }
    const completion = [...store.automation.recent_completions]
      .find((item) => String(item.task_id) === String(task.id));
    if (!completion?.local_project_id || !completion.session_id || !completion.thread_id) {
      throw new Error("The source task has no recoverable local project, task session, or persistent Agent thread.");
    }
    let sourceCaseId = CASE_ID_PATTERN.test(String(completion.case_id || "")) ? completion.case_id : "";
    if (!sourceCaseId && completion.run_id) {
      const sourceRun = await getRunDetail(runManager, [], completion.run_id, { projectId: completion.local_project_id });
      const binding = extractAuthoritativeCaseBindingFromRun(sourceRun);
      if (binding.status === "bound") sourceCaseId = binding.case_id;
    }
    if (!sourceCaseId) {
      throw new Error("The source task completion has no authoritative Case binding.");
    }
    const timestamp = now();
    let feedbackId = existing?.feedback_id || `AF-${randomUUID()}`;
    if (!existing) {
      await patchAutomation((automation) => {
        if (automation.acceptance_feedback_items.some((item) => item.idempotency_key === key)) return;
        automation.acceptance_feedback_items.unshift({
          feedback_id: feedbackId,
          idempotency_key: key,
          message_id: "",
          original_feedback: text,
          status: "queued",
          progress: automation.active_task ? "等待执行租约" : "等待执行",
          source_project_id: String(task.project_id),
          source_task_id: String(task.id),
          source_task_title: taskDisplayTitle(task.content, task.title || task.id),
          source_task_state: task.state,
          source_completion_at: completion.completed_at || "",
          source_run_id: completion.run_id || "",
          source_case_id: sourceCaseId,
          local_project_id: completion.local_project_id,
          session_id: completion.session_id,
          thread_id: completion.thread_id,
          ready_at: timestamp,
          current_run_id: "",
          current_case_id: "",
          evidence: [],
          result: "",
          blocking_reason: "",
          created_at: timestamp,
          updated_at: timestamp,
          resolved_at: ""
        });
      });
    }
    let current = (await readStore()).automation.acceptance_feedback_items.find((item) => item.idempotency_key === key);
    if (!current || String(current.source_task_id) !== String(task.id) || current.original_feedback !== text) {
      throw new Error("验收问题幂等标识与另一项提交冲突。");
    }
    feedbackId = current.feedback_id;
    if (!current.message_id) {
      const messages = typeof runManager.listMessages === "function"
        ? await runManager.listMessages(current.local_project_id, current.session_id)
        : [];
      const entry = messages.find((message) => message.feedback_id === feedbackId) || await runManager.addMessage(current.local_project_id, {
          session_id: current.session_id,
          role: "user",
          kind: "acceptance_feedback",
          content: text,
          task_id: current.source_task_id,
          feedback_id: feedbackId
        });
      await patchAutomation((automation) => {
        const item = automation.acceptance_feedback_items.find((candidate) => candidate.feedback_id === feedbackId);
        if (!item) return;
        item.message_id = entry.id;
        item.updated_at = now();
      });
      current = { ...current, message_id: entry.id };
    }
    emit("automation.changed", { reason: "acceptance-feedback-submitted", taskId: task.id, feedbackId });
    await maybeStartNext();
    return (await getSnapshot()).acceptance_feedback_queue.find((item) => item.feedback_id === feedbackId)
      || (await readStore()).automation.acceptance_feedback_items.find((item) => item.feedback_id === feedbackId);
  }

  async function stopCurrent() {
    const store = await readStore();
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

  async function handoffToCodexCli() {
    const store = await readStore();
    const active = store.automation.active_task;
    if (!active) throw new Error("No active task to hand off to Codex CLI.");
    if (["closeout_running", "completing", "awaiting_human"].includes(active.phase)) {
      throw new Error(`The active task cannot switch to Codex CLI while phase=${active.phase}.`);
    }
    if (active.phase === "cli_handoff") return reopenCodexCli();

    const sourceRun = await getRunDetail(runManager, [], active.run_id, { projectId: active.local_project_id });
    const caseBinding = await resolveTaskCaseBinding(active, sourceRun);
    if (caseBinding.status === "conflict") {
      throw new Error("Codex CLI handoff was refused because authoritative Case bindings conflict.");
    }
    if (caseBinding.status !== "bound") {
      throw new Error("Codex CLI handoff is not available until the Agent selects or creates a Case and a trusted Runtime ledger write establishes the binding.");
    }

    await patchAutomation((automation) => {
      if (automation.active_task?.task_id === active.task_id) {
        automation.active_task.phase = "switching_to_cli";
        automation.active_task.cli_handoff_source_run_id = active.run_id || "";
      }
    });
    emit("automation.changed", { reason: "cli-handoff-stopping-runtime", taskId: active.task_id });

    try {
      if (active.run_id && runManager.isRunActive?.(active.run_id)) {
        await runManager.controlRun(active.run_id, { type: "interrupt" });
        const stopped = await waitForRunStop(active.run_id);
        if (!stopped) {
          throw new Error("Runtime did not stop within the safe handoff window; Codex CLI was not launched.");
        }
      }
      return launchCodexCliForActiveTask(active);
    } catch (error) {
      await addRecovery({
        type: "cli_handoff_failed",
        task: active,
        message: error.message,
        actions: ["retry_cli_handoff", "retry_start", "mark_blocked"]
      });
      return getSnapshot();
    }
  }

  async function reopenCodexCli() {
    const store = await readStore();
    const active = store.automation.active_task;
    if (!active || active.phase !== "cli_handoff") {
      throw new Error("The active task is not currently handed off to Codex CLI.");
    }
    try {
      return await launchCodexCliForActiveTask(active);
    } catch (error) {
      await addRecovery({
        type: "cli_handoff_failed",
        task: active,
        message: error.message,
        actions: ["retry_cli_handoff", "retry_start", "mark_blocked"]
      });
      return getSnapshot();
    }
  }

  async function resumeRuntimeFromCodexCli() {
    const store = await readStore();
    const active = store.automation.active_task;
    if (!active || !["cli_handoff", "recovery"].includes(active.phase)) {
      throw new Error("No Codex CLI handoff is available to return to Runtime.");
    }
    const outcome = await reconcileCanonicalCaseState({ allowAgentResume: true, requireCase: true });
    if (outcome === "agent_resumed" || outcome === "resolved" || outcome === "human") {
      return getSnapshot();
    }
    return getSnapshot();
  }

  async function launchCodexCliForActiveTask(active) {
    const store = await readStore();
    const current = store.automation.active_task;
    if (!current || current.task_id !== active.task_id) throw new Error("The active task changed during CLI handoff.");
    const task = store.automation.snapshot.tasks.find((item) => String(item.id) === String(current.task_id));
    const project = store.projects.find((item) => item.id === current.local_project_id);
    if (!task || !project?.path) throw new Error("The local project binding or remote task snapshot is missing.");

    const sourceRun = await getRunDetail(runManager, [], current.run_id, { projectId: current.local_project_id });
    const caseBinding = await resolveTaskCaseBinding(current, sourceRun);
    if (caseBinding.status === "conflict") {
      throw new Error("Codex CLI handoff was refused because authoritative Case bindings conflict.");
    }
    if (caseBinding.status !== "bound") {
      throw new Error("Codex CLI handoff requires an authoritative task-to-Case binding.");
    }
    const caseId = caseBinding.case_id;
    const prompt = buildCodexCliHandoffPrompt({
      caseId,
      taskTitle: taskDisplayTitle(task.content, task.title || current.task_title || current.task_id),
      taskIntent: buildAutomationTask(task)
    });
    if (!current.thread_id) throw new Error("The active task has no persisted Codex thread to resume in CLI.");
    await cliLauncher.launch({ projectPath: project.path, threadId: current.thread_id, prompt });
    await patchAutomation((automation) => {
      if (automation.active_task?.task_id !== current.task_id) return;
      automation.active_task.phase = "cli_handoff";
      automation.active_task.case_id = caseId || "";
      automation.active_task.cli_handoff_at ||= now();
      automation.recovery_items = automation.recovery_items.filter((item) => (
        item.task_id !== current.task_id || !["cli_handoff_failed", "safe_stop_requested", "runtime_process_missing"].includes(item.type)
      ));
    });
    emit("automation.changed", { reason: "cli-handoff-started", taskId: current.task_id, caseId: caseId || "" });
    return getSnapshot();
  }

  async function waitForRunStop(runId) {
    if (typeof runManager.isRunActive !== "function") return true;
    const deadline = Date.now() + Math.max(0, safeStopTimeoutMs);
    while (runManager.isRunActive(runId) && Date.now() < deadline) {
      await wait(Math.min(100, Math.max(1, safeStopTimeoutMs)));
    }
    return !runManager.isRunActive(runId);
  }

  async function resolveRecovery({ recoveryId, action, message = "" }) {
    const store = await readStore();
    const recovery = store.automation.recovery_items.find((item) => item.id === recoveryId);
    if (!recovery) {
      throw new Error(`Unknown recovery item: ${recoveryId}`);
    }
    const availableActions = recoveryActionsForItem(recovery, store.automation.active_task);
    if (!availableActions.includes(action)) {
      throw new Error(`Recovery action ${action} is not allowed.`);
    }
    if (action === "retry_sync") {
      await removeRecovery(recoveryId);
      return sync();
    }
    if (action === "retry_start") {
      await removeRecovery(recoveryId);
      await patchAutomation((automation) => {
        if (automation.active_task) {
          automation.active_task.phase = "starting";
          automation.active_task.closeout_status = "pending";
          if (automation.active_task.execution_kind === "acceptance_feedback") {
            const item = automation.acceptance_feedback_items.find((entry) => entry.feedback_id === automation.active_task.feedback_id);
            if (item) {
              item.status = "running";
              item.progress = "正在重试验收问题执行";
              item.blocking_reason = "";
              item.updated_at = now();
            }
          }
        }
      });
      await startRuntimeForActiveTask();
      return getSnapshot();
    }
    if (action === "feedback_continue") {
      const text = String(message || "").trim();
      if (!text) throw new Error("Recovery feedback is required.");
      const active = store.automation.active_task;
      if (!active || String(active.task_id) !== String(recovery.task_id)) {
        throw new Error("The recovery item is not bound to the active task.");
      }
      if (!active.thread_id) {
        throw new Error("Recovery feedback requires the task's persisted Agent thread.");
      }
      const project = store.projects.find((item) => item.id === active.local_project_id);
      const task = store.automation.snapshot.tasks.find((item) => String(item.id) === String(active.task_id));
      if (!project || !task) throw new Error("The recovery task or its local project binding is missing.");
      const session = await ensureTaskSession(active, task);
      const sourceRun = await getRunDetail(runManager, [], recovery.run_id || active.run_id, { projectId: active.local_project_id });
      await patchAutomation((automation) => {
        if (automation.active_task?.task_id === active.task_id) automation.active_task.phase = "starting";
      });
      try {
        const nextRun = await runManager.startRun({
          projectId: project.id,
          sessionId: session.id,
          taskId: active.task_id,
          task: text,
          threadId: active.thread_id,
          runtimeContext: {
            kind: "recovery_feedback",
            recovery_id: recovery.id,
            recovery_type: recovery.type,
            source_run_id: sourceRun?.id || recovery.run_id || active.run_id || "",
            source_result_ref: sourceRun?.result_file || "",
            source_activity_ref: sourceRun?.activity_file || ""
          },
          adapter: "codex-app-server",
          approvalPolicy: "on-request",
          continuationPolicy: "automatic",
          maxNoProgressRounds: 8,
          ...lifecycleRunInput(lifecycleContextFromActive(active))
        });
        await runManager.addMessage(project.id, {
          session_id: session.id,
          role: "user",
          kind: "recovery_feedback",
          content: text,
          run_id: nextRun.id,
          task_id: active.task_id
        });
        await patchAutomation((automation) => {
          if (automation.active_task?.task_id !== active.task_id) return;
          automation.active_task.phase = "running";
          automation.active_task.run_id = nextRun.id;
          automation.active_task.thread_id = nextRun.thread_id || active.thread_id;
          automation.recovery_items = automation.recovery_items.filter((item) => item.id !== recoveryId);
        });
        emit("automation.changed", { reason: "recovery-feedback-submitted", taskId: active.task_id, runId: nextRun.id });
        return getSnapshot();
      } catch (error) {
        await patchAutomation((automation) => {
          if (automation.active_task?.task_id === active.task_id) automation.active_task.phase = "recovery";
        });
        throw error;
      }
    }
    if (action === "retry_cli_handoff") {
      await removeRecovery(recoveryId);
      return launchCodexCliForActiveTask(store.automation.active_task);
    }
    if (action === "retry_complete") {
      await completeRemoteTask();
      return getSnapshot();
    }
    if (action === "retry_closeout") {
      await removeRecovery(recoveryId);
      await startSameThreadCloseout();
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
      if (store.automation.active_task?.execution_kind === "acceptance_feedback") {
        const feedbackId = store.automation.active_task.feedback_id;
        await patchAutomation((automation) => {
          const item = automation.acceptance_feedback_items.find((entry) => entry.feedback_id === feedbackId);
          if (item) {
            item.status = "blocked";
            item.progress = recovery.message || "验收问题执行已阻塞";
            item.blocking_reason = item.progress;
            item.updated_at = now();
          }
          automation.active_task = null;
          automation.attention_items = automation.attention_items.filter((entry) => entry.feedback_id !== feedbackId);
          automation.recovery_items = automation.recovery_items.filter((entry) => entry.id !== recoveryId && entry.feedback_id !== feedbackId);
        });
        emit("automation.changed", { reason: "acceptance-feedback-blocked", feedbackId, taskId });
        await maybeStartNext();
        return getSnapshot();
      }
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
      const store = await readStore();
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
      const feedbackQueue = buildAcceptanceFeedbackQueue(automation.acceptance_feedback_items);
      const selection = selectNextExecution(queue, feedbackQueue);
      if (!selection) {
        return null;
      }
      if (selection.kind === "acceptance_feedback") {
        return startAcceptanceFeedbackExecution(selection.item);
      }
      const candidate = selection.item;
      const lifecycleContext = await startTodoLifecycleTrace(candidate);
      const claimSpan = startTodoLifecycleSpan(lifecycleContext, {
        name: "work_sync.claim",
        category: "work_sync",
        cost_center: "external",
        attributes: { task_id: candidate.id, project_id: candidate.project_id }
      });
      try {
        const readinessSpan = startTodoLifecycleSpan(lifecycleContext, {
          name: "runtime.readiness_preflight",
          category: "desktop",
          cost_center: "orchestration",
          attributes: { task_id: candidate.id, project_id: candidate.project_id }
        });
        try {
          await setupReadinessPreflight(candidate.local_project_path);
          await runManager.preflightRun?.({
            projectId: candidate.local_project_id,
            task: buildAutomationTask(candidate),
            adapter: "codex-app-server"
          });
          endTodoLifecycleSpan(lifecycleContext, readinessSpan, { status: "ok" });
        } catch (error) {
          endTodoLifecycleSpan(lifecycleContext, readinessSpan, { status: "error", error });
          endTodoLifecycleSpan(lifecycleContext, claimSpan, { status: "error", error });
          await finishTodoLifecycleTrace(lifecycleContext, { status: "error", error });
          await addRecovery({
            type: "readiness_failed",
            task: candidate,
            message: error.message,
            actions: ["retry_sync"],
            freezeScope: "global"
          });
          return null;
        }
        const updateSpan = startTodoLifecycleSpan(lifecycleContext, {
          parent_span_id: claimSpan?.span_id,
          name: "work_sync.mark_in_progress",
          category: "work_sync",
          cost_center: "external"
        });
        let claimed;
        try {
          claimed = await workSync.updateTaskState({ taskId: candidate.id, state: "in_progress", expectedState: "pending" });
          endTodoLifecycleSpan(lifecycleContext, updateSpan, { status: "ok" });
        } catch (error) {
          endTodoLifecycleSpan(lifecycleContext, updateSpan, { status: "error", error });
          throw error;
        }
        await patchAutomation((next) => {
          next.active_task = {
            task_id: claimed.id,
            project_id: claimed.project_id,
            task_title: taskDisplayTitle(claimed.content, claimed.title || claimed.id),
            local_project_id: candidate.local_project_id,
            local_project_path: candidate.local_project_path,
            server_version: claimed.version,
            phase: "starting",
            case_id: "",
            case_status: "unbound",
            case_resolved_at: "",
            case_binding_source: "",
            case_binding_run_id: "",
            case_bound_at: "",
            thread_id: "",
            thread_bound_at: "",
            last_compaction_turn_id: "",
            closeout_status: "pending",
            closeout_completed_at: "",
            remote_completion_status: "pending",
            run_id: "",
            session_id: "",
            claimed_at: now(),
            started_at: "",
            lifecycle_trace_id: lifecycleContext?.trace_id || "",
            lifecycle_root_span_id: lifecycleContext?.root_span_id || "",
            lifecycle_events_file: lifecycleContext?.events_file || "",
            lifecycle_summary_file: lifecycleContext?.summary_file || ""
          };
        });
        endTodoLifecycleSpan(lifecycleContext, claimSpan, {
          status: "ok",
          attributes: { remote_state: claimed.state || "in_progress" }
        });
        emit("automation.changed", { reason: "task-claimed", taskId: claimed.id });
        return startRuntimeForActiveTask();
      } catch (error) {
        endTodoLifecycleSpan(lifecycleContext, claimSpan, { status: "error", error });
        await finishTodoLifecycleTrace(lifecycleContext, { status: "error", error });
        if (["version_conflict", "conflict", "not_found"].includes(error?.code)) {
          emit("automation.claim-conflict", { taskId: candidate.id });
          await addRecovery({
            type: "claim_failed",
            task: candidate,
            message: error.message,
            actions: ["retry_sync"],
            freezeScope: "global"
          });
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

  async function startAcceptanceFeedbackExecution(candidate) {
    const store = await readStore();
    const current = store.automation.acceptance_feedback_items.find((item) => item.feedback_id === candidate.feedback_id);
    if (!current || current.status !== "queued") return null;
    const sourceTask = store.automation.snapshot.tasks.find((task) => String(task.id) === String(current.source_task_id));
    const project = store.projects.find((item) => String(item.id) === String(current.local_project_id));
    if (!sourceTask || sourceTask.state !== "completed" || !project
      || !current.session_id || !current.thread_id || !current.message_id) {
      await patchAutomation((automation) => {
        const item = automation.acceptance_feedback_items.find((entry) => entry.feedback_id === current.feedback_id);
        if (!item) return;
        item.status = "blocked";
        item.progress = "缺少可恢复的来源待办、会话、thread 或用户消息";
        item.blocking_reason = item.progress;
        item.updated_at = now();
      });
      emit("automation.changed", { reason: "acceptance-feedback-blocked", feedbackId: current.feedback_id });
      return null;
    }
    let leaseEstablished = false;
    try {
      await setupReadinessPreflight(project.path);
      await runManager.preflightRun?.({
        projectId: current.local_project_id,
        task: current.original_feedback,
        adapter: "codex-app-server"
      });
      await patchAutomation((automation) => {
        const item = automation.acceptance_feedback_items.find((entry) => entry.feedback_id === current.feedback_id);
        if (!item || item.status !== "queued" || automation.active_task) return;
        item.status = "running";
        item.progress = "正在启动新 Run";
        item.updated_at = now();
        automation.active_task = feedbackActiveExecution(item, project);
      });
      const refreshed = await readStore();
      if (refreshed.automation.active_task?.feedback_id !== current.feedback_id) return null;
      leaseEstablished = true;
      emit("automation.changed", { reason: "acceptance-feedback-starting", feedbackId: current.feedback_id });
      return startRuntimeForActiveTask();
    } catch (error) {
      if (leaseEstablished) return null;
      await patchAutomation((automation) => {
        const item = automation.acceptance_feedback_items.find((entry) => entry.feedback_id === current.feedback_id);
        if (!item) return;
        item.status = "blocked";
        item.progress = error.message;
        item.blocking_reason = error.message;
        item.updated_at = now();
        if (!automation.active_task) {
          automation.active_task = feedbackActiveExecution(item, project, { phase: "recovery" });
        }
        automation.recovery_items = upsertById(automation.recovery_items, {
          id: `RECOVERY-feedback-start-failed-${item.feedback_id}`,
          type: "feedback_start_failed",
          task_id: item.source_task_id,
          project_id: item.source_project_id,
          run_id: item.current_run_id || "",
          feedback_id: item.feedback_id,
          message: error.message,
          freeze_scope: "global",
          responsibility: "operator",
          actions: ["retry_start", "mark_blocked"],
          created_at: now()
        });
      });
      emit("automation.changed", { reason: "acceptance-feedback-start-failed", feedbackId: current.feedback_id });
      return null;
    }
  }

  async function startRuntimeForActiveTask() {
    const store = await readStore();
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
    const lifecycleContext = lifecycleContextFromActive(active);
    const startSpan = startTodoLifecycleSpan(lifecycleContext, {
      name: "desktop.runtime_start",
      category: "desktop",
      cost_center: "orchestration",
      attributes: { task_id: active.task_id, project_id: active.project_id }
    });
    try {
      const session = await ensureTaskSession(active, task);
      if (!active.started_at && active.execution_kind !== "acceptance_feedback") {
        await runManager.addMessage(project.id, {
          session_id: session.id,
          role: "user",
          kind: "automation-task",
          content: task.content ?? task.title ?? "",
          task_id: active.task_id
        });
      }
      const closeoutOnly = active.phase === "closeout_starting" || active.closeout_status === "running";
      const caseBinding = persistedCaseBinding(active);
      if (closeoutOnly && caseBinding.status !== "bound") {
        throw new Error("Task closeout requires an authoritative task-to-Case binding from a trusted Runtime ledger write.");
      }
      const run = await runManager.startRun({
        projectId: project.id,
        sessionId: session.id,
        taskId: active.task_id,
        task: active.execution_kind === "acceptance_feedback"
          ? buildAcceptanceFeedbackTask(store.automation.acceptance_feedback_items.find((item) => item.feedback_id === active.feedback_id))
          : buildAutomationTask(task),
        threadId: active.thread_id || "",
        runtimeContext: closeoutOnly
          ? active.execution_kind === "acceptance_feedback"
            ? { closeout_only: true, case_id: caseBinding.case_id, kind: "acceptance_feedback", feedback_id: active.feedback_id }
            : { closeout_only: true, case_id: caseBinding.case_id }
          : active.execution_kind === "acceptance_feedback"
            ? acceptanceFeedbackRuntimeContext(store.automation.acceptance_feedback_items.find((item) => item.feedback_id === active.feedback_id))
            : null,
        adapter: "codex-app-server",
        approvalPolicy: "on-request",
        continuationPolicy: "automatic",
        maxNoProgressRounds: 8,
        ...lifecycleRunInput(lifecycleContext)
      });
      await patchAutomation((automation) => {
        if (!automation.active_task || automation.active_task.task_id !== active.task_id) return;
        automation.active_task.run_id = run.id;
        automation.active_task.thread_id = run.thread_id || automation.active_task.thread_id || "";
        automation.active_task.phase = closeoutOnly ? "closeout_running" : "running";
        automation.active_task.started_at = now();
        if (automation.active_task.execution_kind === "acceptance_feedback") {
          const item = automation.acceptance_feedback_items.find((entry) => entry.feedback_id === automation.active_task.feedback_id);
          if (item) {
            item.current_run_id = run.id;
            item.status = "running";
            item.progress = closeoutOnly ? "正在完成同线程 Git 收尾" : "Agent 正在处理验收问题";
            item.updated_at = now();
          }
        }
      });
      endTodoLifecycleSpan(lifecycleContext, startSpan, { status: "ok", attributes: { run_id: run.id } });
      emit("automation.changed", { reason: "runtime-started", taskId: active.task_id, runId: run.id });
      return run;
    } catch (error) {
      endTodoLifecycleSpan(lifecycleContext, startSpan, { status: "error", error });
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
    if (event.type !== "run.finished") {
      return;
    }
    const store = await readStore();
    const active = store.automation.active_task;
    if (!active || active.run_id !== event.runId) {
      return;
    }
    const eventThreadId = String(event.result?.thread_id || "");
    if (eventThreadId && eventThreadId !== active.thread_id) {
      await patchAutomation((automation) => {
        if (automation.active_task?.run_id !== event.runId) return;
        automation.active_task.thread_id = eventThreadId;
        automation.active_task.thread_bound_at ||= now();
      });
    }
    const caseBinding = await resolveTaskCaseBinding(active, {
      id: event.runId,
      activity: event.activity,
      result: event.result
    });
    if (caseBinding.status === "conflict") return;
    if (active.execution_kind === "acceptance_feedback" && caseBinding.status === "bound") {
      await patchAutomation((automation) => {
        const item = automation.acceptance_feedback_items.find((entry) => entry.feedback_id === active.feedback_id);
        if (!item) return;
        item.current_case_id = caseBinding.case_id;
        item.current_run_id = event.runId;
        item.updated_at = now();
      });
    }
    if (active.cli_handoff_source_run_id === event.runId
      && ["switching_to_cli", "cli_handoff", "recovery"].includes(active.phase)) return;
    if (["closeout_starting", "closeout_running"].includes(active.phase)) {
      if (caseBinding.status !== "bound") {
        await addRecovery({
          type: "case_binding_missing",
          task: active,
          message: "A closeout result was ignored because this task has no authoritative Case binding.",
          actions: ["retry_start", "mark_blocked"]
        });
        return;
      }
      return finishSameThreadCloseout(active, event);
    }
    const runtimeResult = event.result?.runtime_result || null;
    const handoff = selectEffectiveLoopHandoff({ runtimeResult, activity: event.activity });
    const ledgerRequired = runtimeResult?.ledger_stage?.writeback_required === true;
    const ledgerWritten = event.activity?.ledger_write_result?.parsed?.written === true;
    const ledgerFailure = ledgerFailureReason({ result: event.result, activity: event.activity });
    const runtimeFailure = String(event.activity?.error || event.result?.next_action || "").trim();
    if (ledgerRequired && !ledgerWritten) {
      await addRecovery({
        type: "runtime_incomplete",
        task: active,
        message: ledgerFailure || runtimeFailure || "Runtime stopped because the required ledger writeback was not accepted.",
        actions: ["retry_start", "mark_blocked"]
      });
      return;
    }
    if (handoff.next_responsibility === "human" || handoff.human_decision_required === true) {
      await setAwaitingHuman({ active, runId: event.runId, handoff });
      return;
    }
    const caseComplete = handoff.next_responsibility === "none" || handoff.status === "complete";
    if (event.status === "completed" && caseComplete && (!ledgerRequired || ledgerWritten)) {
      if (caseBinding.status !== "bound") {
        await addRecovery({
          type: "case_binding_missing",
          task: active,
          message: "Runtime reported completion without an authoritative task-to-Case binding from a trusted ledger write.",
          actions: ["retry_start", "mark_blocked"]
        });
        return;
      }
      if (event.result?.closeout_result?.status === "completed") {
        if (active.execution_kind === "acceptance_feedback") {
          await finishAcceptanceFeedback(active, event, event.result.closeout_result);
          return;
        }
        await markCloseoutCompleted(active, event.runId, event.result.closeout_result);
        const refreshed = await readStore();
        if (isRemoteSourceReady(refreshed.automation.snapshot.source_status)) await completeRemoteTask();
      } else {
        await startSameThreadCloseout();
      }
      return;
    }
    await addRecovery({
      type: "runtime_incomplete",
      task: active,
      message: event.status === "completed"
        ? ledgerFailure || handoff.responsibility_reason || "Runtime stopped before the task reached a complete handoff."
        : ledgerFailure || runtimeFailure || `Runtime finished with status ${event.status}.`,
      actions: ["retry_start", "mark_blocked"]
    });
  }

  async function startSameThreadCloseout() {
    const store = await readStore();
    const active = store.automation.active_task;
    if (!active) return null;
    if (active.closeout_status === "completed") return null;
    const caseBinding = persistedCaseBinding(active);
    if (caseBinding.status !== "bound") {
      await addRecovery({
        type: "case_binding_missing",
        task: active,
        message: "Git closeout was refused because this task has no authoritative Case binding.",
        actions: ["retry_start", "mark_blocked"]
      });
      return null;
    }
    if (!active.thread_id) {
      const binding = await runManager.getTaskThreadBinding?.(active.local_project_id, active.task_id);
      if (binding?.threadId) {
        active.thread_id = String(binding.threadId);
        await patchAutomation((automation) => {
          if (automation.active_task?.task_id === active.task_id) {
            automation.active_task.thread_id = active.thread_id;
            automation.active_task.thread_bound_at ||= binding.boundAt || now();
          }
        });
      }
    }
    if (!active.thread_id) {
      await addRecovery({
        type: "thread_binding_missing",
        task: active,
        message: "The resolved task has no persisted Codex thread id for same-thread Git closeout.",
        actions: ["retry_start", "mark_blocked"]
      });
      return null;
    }
    const lifecycleContext = lifecycleContextFromActive(active);
    const startSpan = startTodoLifecycleSpan(lifecycleContext, {
      name: "desktop.same_thread_closeout_start",
      category: "desktop",
      cost_center: "closeout",
      attributes: { task_id: active.task_id }
    });
    await patchAutomation((automation) => {
      if (automation.active_task?.task_id === active.task_id) {
        automation.active_task.phase = "closeout_starting";
        automation.active_task.closeout_status = "running";
      }
    });
    try {
      const run = await startRuntimeForActiveTask();
      if (!run) throw new Error("Same-thread closeout Runtime did not start.");
      endTodoLifecycleSpan(lifecycleContext, startSpan, { status: "ok", attributes: { run_id: run.id } });
      emit("automation.changed", { reason: "same-thread-closeout-started", taskId: active.task_id, runId: run.id });
      return run;
    } catch (error) {
      endTodoLifecycleSpan(lifecycleContext, startSpan, { status: "error", error });
      await patchAutomation((automation) => {
        if (automation.active_task?.task_id === active.task_id) automation.active_task.closeout_status = "failed";
      });
      await addRecovery({
        type: "closeout_start_failed",
        task: active,
        message: error.message,
        actions: ["retry_closeout", "mark_blocked"]
      });
      return null;
    }
  }

  async function finishSameThreadCloseout(active, event) {
    if (persistedCaseBinding(active).status !== "bound") {
      await addRecovery({
        type: "case_binding_missing",
        task: active,
        message: "A closeout result cannot complete the task without an authoritative Case binding.",
        actions: ["retry_start", "mark_blocked"]
      });
      return;
    }
    const result = selectTaskCloseoutResult(event);
    if (event.status === "completed" && result?.status === "completed") {
      if (active.execution_kind === "acceptance_feedback") {
        await finishAcceptanceFeedback(active, event, result);
        return;
      }
      await markCloseoutCompleted(active, event.runId, result);
      const refreshed = await readStore();
      if (isRemoteSourceReady(refreshed.automation.snapshot.source_status)) await completeRemoteTask();
      else emit("automation.changed", { reason: "remote-completion-pending", taskId: active.task_id });
      return;
    }
    await patchAutomation((automation) => {
      if (automation.active_task?.task_id === active.task_id) automation.active_task.closeout_status = "failed";
    });
    await addRecovery({
      type: "closeout_failed",
      task: active,
      message: result?.error || `Same-thread closeout finished with status ${event.status}.`,
      actions: ["retry_closeout", "mark_blocked"]
    });
  }

  async function finishAcceptanceFeedback(active, event, result) {
    await patchAutomation((automation) => {
      const item = automation.acceptance_feedback_items.find((entry) => entry.feedback_id === active.feedback_id);
      if (!item) return;
      item.status = "resolved";
      item.progress = "验收问题已解决";
      item.current_run_id = event.runId;
      item.current_case_id = active.case_id || item.current_case_id;
      item.result = result?.outcome || "completed";
      item.evidence = [...new Set([...item.evidence, result?.commit_hash || "", item.current_case_id || ""].filter(Boolean))];
      item.resolved_at = now();
      item.updated_at = item.resolved_at;
      automation.active_task = null;
      automation.attention_items = automation.attention_items.filter((entry) => entry.feedback_id !== active.feedback_id && entry.task_id !== active.task_id);
      automation.recovery_items = automation.recovery_items.filter((entry) => entry.feedback_id !== active.feedback_id);
    });
    emit("automation.changed", { reason: "acceptance-feedback-resolved", feedbackId: active.feedback_id, taskId: active.task_id });
    await maybeStartNext();
  }

  async function completeRemoteTask({ syncAfter = true } = {}) {
    const store = await readStore();
    const active = store.automation.active_task;
    if (!active) return null;
    const caseBinding = persistedCaseBinding(active);
    if (caseBinding.status !== "bound") {
      await addRecovery({
        type: "case_binding_missing",
        task: active,
        message: "Remote completion was refused because this task has no authoritative Case binding.",
        actions: ["retry_start", "mark_blocked"]
      });
      return null;
    }
    let canonicalCase = null;
    try {
      if (typeof runManager.getProjectCaseState === "function") {
        canonicalCase = await runManager.getProjectCaseState(active.local_project_id, caseBinding.case_id);
      }
    } catch {
      canonicalCase = null;
    }
    if (!isCanonicalCaseResolved(canonicalCase)) {
      await addRecovery({
        type: "case_not_resolved",
        task: active,
        message: `Remote completion was refused because canonical Case ${caseBinding.case_id} is not resolved.`,
        actions: ["retry_sync", "retry_start", "mark_blocked"]
      });
      return null;
    }
    const lifecycleContext = lifecycleContextFromActive(active);
    const completionSpan = startTodoLifecycleSpan(lifecycleContext, {
      name: "work_sync.complete",
      category: "work_sync",
      cost_center: "external",
      attributes: { task_id: active.task_id, project_id: active.project_id }
    });
    await patchAutomation((automation) => {
      if (automation.active_task) {
        automation.active_task.phase = "completing";
        automation.active_task.remote_completion_status = "writing";
      }
    });
    try {
      const updateSpan = startTodoLifecycleSpan(lifecycleContext, {
        parent_span_id: completionSpan?.span_id,
        name: "work_sync.mark_completed",
        category: "work_sync",
        cost_center: "external"
      });
      let completed;
      try {
        completed = await workSync.updateTaskState({ taskId: active.task_id, state: "completed", expectedState: "in_progress" });
        endTodoLifecycleSpan(lifecycleContext, updateSpan, { status: "ok" });
      } catch (error) {
        endTodoLifecycleSpan(lifecycleContext, updateSpan, { status: "error", error });
        throw error;
      }
      await patchAutomation((automation) => {
        automation.recent_completions.unshift({
          task_id: completed.id,
          project_id: completed.project_id,
          title: taskDisplayTitle(completed.content, completed.title || completed.id),
          run_id: active.run_id,
          case_id: active.case_id || "",
          thread_id: active.thread_id || "",
          local_project_id: active.local_project_id,
          session_id: active.session_id || "",
          completed_at: now(),
          lifecycle_trace_id: active.lifecycle_trace_id || "",
          lifecycle_events_file: active.lifecycle_events_file || "",
          lifecycle_summary_file: active.lifecycle_summary_file || ""
        });
        automation.active_task = null;
        automation.attention_items = automation.attention_items.filter((item) => item.task_id !== active.task_id);
        automation.recovery_items = automation.recovery_items.filter((item) => item.task_id !== active.task_id);
      });
      endTodoLifecycleSpan(lifecycleContext, completionSpan, { status: "ok", attributes: { remote_state: "completed" } });
      const lifecycleSummary = await finishTodoLifecycleTrace(lifecycleContext, {
        status: "ok",
        attributes: { task_id: active.task_id, final_state: "completed" }
      });
      if (lifecycleSummary) {
        await patchAutomation((automation) => {
          const completion = automation.recent_completions.find((item) => String(item.task_id) === String(active.task_id));
          if (completion) completion.lifecycle_summary = compactLifecycleSummary(lifecycleSummary);
        });
      }
      emit("automation.changed", { reason: "task-completed", taskId: completed.id });
      if (syncAfter) {
        await sync();
      }
      return completed;
    } catch (error) {
      endTodoLifecycleSpan(lifecycleContext, completionSpan, { status: "error", error });
      await patchAutomation((automation) => {
        if (automation.active_task?.task_id === active.task_id) {
          automation.active_task.remote_completion_status = "failed";
        }
      });
      await addRecovery({
        type: "completion_writeback_failed",
        task: active,
        message: error.message,
        actions: ["retry_sync", "retry_complete", "mark_blocked"]
      });
      return null;
    }
  }

  async function reconcileDetachedRunCompletion({ allowRemoteCompletion = true } = {}) {
    const store = await readStore();
    const active = store.automation.active_task;
    if (["switching_to_cli", "cli_handoff"].includes(active?.phase)) return null;
    if (!active?.run_id || runManager.isRunActive?.(active.run_id)) return null;

    const latest = await getRunDetail(runManager, [], active.run_id, { projectId: active.local_project_id });
    if (!latest) return null;

    const caseBinding = await resolveTaskCaseBinding(active, latest);
    if (caseBinding.status === "conflict") return null;

    if (latest.status !== "completed") return null;
    if (["closeout_starting", "closeout_running"].includes(active.phase)) {
      if (caseBinding.status !== "bound") {
        await addRecovery({
          type: "case_binding_missing",
          task: active,
          message: "Detached closeout completion was ignored because this task has no authoritative Case binding.",
          actions: ["retry_start", "mark_blocked"]
        });
        return null;
      }
      const result = await runManager.readRunResult?.(latest.id).catch(() => null);
      const closeout = selectTaskCloseoutResult({ result, activity: latest.activity });
      if (closeout?.status !== "completed") return null;
      await markCloseoutCompleted(active, latest.id, closeout);
      if (active.execution_kind === "acceptance_feedback") {
        await finishAcceptanceFeedback(active, { runId: latest.id }, closeout);
        return "resolved";
      }
      if (allowRemoteCompletion) return completeRemoteTask({ syncAfter: false });
      return "remote_completion_pending";
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
    if (ledgerRequired && !ledgerWritten) {
      const recoveryExists = store.automation.recovery_items.some((item) => (
        item.type === "runtime_incomplete"
        && String(item.task_id) === String(active.task_id)
        && String(item.run_id) === String(latest.id)
      ));
      if (!recoveryExists) {
        await addRecovery({
          type: "runtime_incomplete",
          task: active,
          message: ledgerFailureReason({ result: latest.result, activity })
            || handoff.responsibility_reason
            || "Runtime stopped because the required ledger writeback was not accepted.",
          actions: ["retry_start", "mark_blocked"]
        });
      }
      return null;
    }
    if (!caseComplete) return null;
    if (caseBinding.status !== "bound") {
      await addRecovery({
        type: "case_binding_missing",
        task: active,
        message: "Detached Runtime completion has no authoritative task-to-Case binding; closeout was not started.",
        actions: ["retry_start", "mark_blocked"]
      });
      return null;
    }

    await patchAutomation((automation) => {
      if (automation.active_task?.task_id !== active.task_id) return;
      automation.active_task.run_id = latest.id;
      automation.active_task.phase = "completing";
      automation.recovery_items = automation.recovery_items.filter((item) => item.task_id !== active.task_id);
    });
    return startSameThreadCloseout();
  }

  async function reconcileCanonicalCaseState({ allowAgentResume = false, requireCase = false, allowRemoteCompletion = true } = {}) {
    if (typeof runManager.getProjectCaseState !== "function") return "unsupported";
    const store = await readStore();
    const active = store.automation.active_task;
    if (!active || ["closeout_running", "completing"].includes(active.phase)) return "not_applicable";
    if (active.phase === "switching_to_cli") return "handoff_in_progress";
    if (active.run_id && runManager.isRunActive?.(active.run_id) && active.phase !== "cli_handoff") return "runtime_active";

    const run = await getRunDetail(runManager, [], active.run_id, { projectId: active.local_project_id });
    const caseBinding = await resolveTaskCaseBinding(active, run);
    if (caseBinding.status === "conflict") return "conflict";
    if (caseBinding.status !== "bound") {
      if (requireCase || active.phase === "cli_handoff") {
        await addRecovery({
          type: "case_reconciliation_failed",
          task: active,
          message: "No authoritative Case binding exists for this active task. Runtime will not infer identity from repository contents, an old Run cache, or terminal state.",
          actions: ["retry_cli_handoff", "retry_start", "mark_blocked"]
        });
        return "missing";
      }
      return "unbound";
    }
    const caseId = caseBinding.case_id;
    let caseState;
    try {
      caseState = await runManager.getProjectCaseState(active.local_project_id, caseId);
    } catch (error) {
      if (!requireCase && active.phase !== "cli_handoff") return "unreadable";
      await addRecovery({
        type: "case_reconciliation_failed",
        task: { ...active, case_id: caseId },
        message: `Canonical Case ${caseId} could not be read: ${error.message}`,
        actions: ["retry_sync", "retry_start", "mark_blocked"]
      });
      return "unreadable";
    }
    if (!caseState?.record) {
      if (!requireCase && active.phase !== "cli_handoff") return "missing";
      await addRecovery({
        type: "case_reconciliation_failed",
        task: { ...active, case_id: caseId },
        message: `Canonical Case ${caseId} is neither an active Project Case nor a closed Case.`,
        actions: ["retry_sync", "retry_start", "mark_blocked"]
      });
      return "missing";
    }

    const record = caseState.record;
    const resolution = record.case_resolution || {};
    if (isCanonicalCaseResolved(caseState)) {
      const closeoutCompleted = active.closeout_status === "completed";
      await patchAutomation((automation) => {
        if (automation.active_task?.task_id !== active.task_id) return;
        automation.active_task.case_id = caseId;
        automation.active_task.case_status = "resolved";
        automation.active_task.case_resolved_at ||= record.updated_at || now();
        automation.active_task.remote_completion_status = "pending";
        if (closeoutCompleted) {
          automation.active_task.phase = "remote_completion_pending";
        }
        automation.recovery_items = automation.recovery_items.filter((item) => item.task_id !== active.task_id);
      });
      if (closeoutCompleted) {
        if (active.execution_kind === "acceptance_feedback") {
          await finishAcceptanceFeedback(active, { runId: active.run_id }, { outcome: active.closeout_outcome || "completed", commit_hash: active.closeout_commit_hash || "" });
          return "resolved";
        }
        if (allowRemoteCompletion) await completeRemoteTask({ syncAfter: false });
        return allowRemoteCompletion ? "resolved" : "remote_completion_pending";
      }
      await startSameThreadCloseout();
      return "resolved";
    }

    const handoff = resolution.loop_handoff || {};
    await patchAutomation((automation) => {
      if (automation.active_task?.task_id !== active.task_id) return;
      automation.active_task.case_id = caseId;
      automation.active_task.case_status = "active";
    });
    if (handoff.next_responsibility === "human" || handoff.human_decision_required === true) {
      await setAwaitingHuman({ active: { ...active, case_id: caseId }, runId: active.run_id, handoff });
      return "human";
    }

    // A human handoff can be newer than canonical Case state because handoff-only
    // turns do not write the ledger. Only an explicit operator-owned resume path
    // may clear awaiting_human; periodic reconciliation must remain fail-closed.
    if (allowAgentResume && caseState.location === "active") {
      await patchAutomation((automation) => {
        if (automation.active_task?.task_id !== active.task_id) return;
        automation.active_task.case_id = caseId;
        automation.active_task.phase = "starting";
        automation.active_task.cli_handoff_ended_at = now();
        automation.attention_items = automation.attention_items.filter((item) => item.task_id !== active.task_id);
        automation.recovery_items = automation.recovery_items.filter((item) => item.task_id !== active.task_id);
      });
      await startRuntimeForActiveTask();
      return "agent_resumed";
    }
    return "active";
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
      title: `待办 · ${taskDisplayTitle(task?.content, task?.title || active.task_title || active.task_id)}`,
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

  async function resolveTaskCaseBinding(active, run) {
    const binding = mergeCaseBindings(
      persistedCaseBinding(active),
      extractAuthoritativeCaseBindingFromRun(run)
    );
    if (binding.status === "conflict") {
      await addRecovery({
        type: "case_binding_conflict",
        task: active,
        message: `Conflicting authoritative Case bindings were detected (${binding.case_ids.join(", ")}); Runtime refused to choose one.`,
        actions: ["retry_start", "mark_blocked"]
      });
      return binding;
    }
    if (binding.status === "bound" && (
      active.case_id !== binding.case_id
      || active.case_binding_source !== binding.source
      || active.case_binding_run_id !== binding.run_id
    )) {
      await patchAutomation((automation) => {
        if (automation.active_task?.task_id !== active.task_id) return;
        automation.active_task.case_id = binding.case_id;
        automation.active_task.case_binding_source = binding.source;
        automation.active_task.case_binding_run_id = binding.run_id;
        automation.active_task.case_bound_at ||= now();
      });
    }
    if (binding.status === "unbound" && active.case_id) {
      await patchAutomation((automation) => {
        if (automation.active_task?.task_id !== active.task_id) return;
        automation.active_task.case_id = "";
        automation.active_task.case_status = "unbound";
        automation.active_task.case_resolved_at = "";
        automation.active_task.case_binding_source = "";
        automation.active_task.case_binding_run_id = "";
        automation.active_task.case_bound_at = "";
      });
    }
    return binding;
  }

  async function setAwaitingHuman({ active, runId, handoff }) {
    await patchAutomation((automation) => {
      if (automation.active_task?.task_id !== active.task_id) return;
      automation.active_task.run_id = runId;
      automation.active_task.phase = "awaiting_human";
      automation.recovery_items = automation.recovery_items.filter((item) => (
        item.task_id !== active.task_id
        || !["runtime_incomplete", "runtime_process_missing"].includes(item.type)
      ));
      automation.attention_items = upsertById(automation.attention_items, {
        id: `ATTENTION-${automation.active_task.task_id}`,
        task_id: automation.active_task.task_id,
        project_id: automation.active_task.project_id,
        run_id: runId,
        feedback_id: active.feedback_id || "",
        reason: handoff.responsibility_reason || "Runtime requires a human decision.",
        question: handoff.human_gate?.decision_needed || handoff.next_prompt || "Review the Runtime request and provide direction.",
        created_at: now()
      });
      if (active.execution_kind === "acceptance_feedback") {
        const item = automation.acceptance_feedback_items.find((entry) => entry.feedback_id === active.feedback_id);
        if (item) {
          item.status = "awaiting_human";
          item.progress = handoff.responsibility_reason || "等待人工判断";
          item.current_run_id = runId;
          item.updated_at = now();
        }
      }
    });
    emit("automation.changed", { reason: "awaiting-human", taskId: active.task_id });
  }

  async function markCloseoutCompleted(active, runId, result) {
    await patchAutomation((automation) => {
      if (automation.active_task?.task_id !== active.task_id) return;
      automation.active_task.run_id = runId;
      automation.active_task.closeout_status = "completed";
      automation.active_task.closeout_completed_at ||= now();
      automation.active_task.closeout_outcome = result?.outcome || "";
      automation.active_task.closeout_commit_hash = result?.commit_hash || "";
      automation.active_task.remote_completion_status = "pending";
      automation.active_task.phase = "remote_completion_pending";
      if (automation.active_task.execution_kind === "acceptance_feedback") {
        automation.active_task.phase = "feedback_closeout_completed";
        const item = automation.acceptance_feedback_items.find((entry) => entry.feedback_id === active.feedback_id);
        if (item) {
          item.progress = "Git 收尾已完成";
          item.updated_at = now();
        }
      }
      automation.recovery_items = automation.recovery_items.filter((item) => (
        item.task_id !== active.task_id
        || !["closeout_failed", "closeout_start_failed", "runtime_process_missing"].includes(item.type)
      ));
    });
  }

  async function addRecovery({ type, task, message, actions, freezeScope = "global" }) {
    await patchAutomation((automation) => {
      const taskId = task?.task_id || task?.id || "unknown";
      const active = automation.active_task;
      const availableActions = recoveryActionsForItem({ task_id: taskId, actions }, active);
      if (automation.active_task) automation.active_task.phase = "recovery";
      if (active?.execution_kind === "acceptance_feedback") {
        const feedback = automation.acceptance_feedback_items.find((entry) => entry.feedback_id === active.feedback_id);
        if (feedback) {
          feedback.status = "blocked";
          feedback.progress = message;
          feedback.blocking_reason = message;
          feedback.updated_at = now();
        }
      }
      automation.recovery_items = upsertById(automation.recovery_items, {
        id: `RECOVERY-${type}-${taskId}`,
        type,
        task_id: taskId,
        project_id: task?.project_id || "",
        run_id: task?.run_id || "",
        feedback_id: active?.feedback_id || "",
        message,
        freeze_scope: freezeScope,
        responsibility: "operator",
        actions: availableActions,
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
    const store = await readStore();
    const active = store.automation.active_task;
    if (!active || ["starting", "continuing", "switching_to_cli", "cli_handoff", "awaiting_human", "remote_completion_pending", "completing", "recovery"].includes(active.phase)) return;
    if (active.run_id && runManager.isRunActive?.(active.run_id)) return;
    if (active.phase === "closeout_running") {
      await addRecovery({
        type: "closeout_process_missing",
        task: active,
        message: "The same-thread closeout Runtime is no longer attached locally.",
        actions: ["retry_closeout", "mark_blocked"]
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

  async function resumeRecoverableTaskOnStartup() {
    const store = await readStore();
    const automation = store.automation;
    const active = automation.active_task;
    if (!automation.enabled || !active || automation.attention_items.length > 0) return "not_applicable";
    if (active.run_id && runManager.isRunActive?.(active.run_id)) return "runtime_active";
    const task = automation.snapshot.tasks.find((item) => String(item.id) === String(active.task_id));
    if (active.execution_kind === "acceptance_feedback") {
      const feedback = automation.acceptance_feedback_items.find((item) => item.feedback_id === active.feedback_id);
      if (!feedback || !["running", "blocked"].includes(feedback.status) || !task || task.state !== "completed") {
        return "feedback_not_recoverable";
      }
    } else if (!task || task.state !== "in_progress") return "task_not_in_progress";
    const recovery = automation.recovery_items.find((item) => (
      String(item.task_id) === String(active.task_id)
      && ["runtime_incomplete", "runtime_process_missing"].includes(item.type)
      && recoveryActionsForItem(item, active).includes("retry_start")
    ));
    if (!recovery) return "recovery_not_safe";
    await removeRecovery(recovery.id);
    await patchAutomation((next) => {
      if (next.active_task?.task_id !== active.task_id) return;
      next.active_task.phase = "starting";
      next.active_task.closeout_status = "pending";
      if (next.active_task.execution_kind === "acceptance_feedback") {
        const feedback = next.acceptance_feedback_items.find((item) => item.feedback_id === next.active_task.feedback_id);
        if (feedback) {
          feedback.status = "running";
          feedback.progress = "应用重启后正在恢复同一验收问题执行";
          feedback.blocking_reason = "";
          feedback.updated_at = now();
        }
      }
    });
    const run = await startRuntimeForActiveTask();
    if (!run) return "start_failed";
    emit("automation.changed", {
      reason: "startup-recovery-resumed",
      taskId: active.task_id,
      sourceRunId: recovery.run_id || active.run_id || "",
      runId: run.id
    });
    return "resumed";
  }

  async function stopRuntimeForExternalChange() {
    const store = await readStore();
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
      workSync.attachLocalProjection(store);
      mutator(store.automation, store);
      return store;
    });
  }

  async function readStore() {
    const store = await runManager.readDesktopStore();
    return workSync.attachLocalProjection(store);
  }

  function emit(type, payload) {
    emitter.emit("event", { type, at: now(), ...payload });
  }

  async function startTodoLifecycleTrace(task) {
    if (typeof runManager.startLifecycleTrace !== "function") return null;
    try {
      return await runManager.startLifecycleTrace({
        task_id: task.id,
        project_id: task.project_id,
        local_project_id: task.local_project_id || "",
        trigger: "automation_queue"
      });
    } catch (error) {
      emit("automation.error", { reason: "lifecycle-trace-start", message: error.message });
      return null;
    }
  }

  function startTodoLifecycleSpan(context, input) {
    if (!context || typeof runManager.startLifecycleSpan !== "function") return null;
    try {
      return runManager.startLifecycleSpan(context, input);
    } catch (error) {
      emit("automation.error", { reason: "lifecycle-span-start", message: error.message });
      return null;
    }
  }

  function endTodoLifecycleSpan(context, span, input) {
    if (!context || !span || typeof runManager.endLifecycleSpan !== "function") return null;
    try {
      return runManager.endLifecycleSpan(context, span, input);
    } catch (error) {
      emit("automation.error", { reason: "lifecycle-span-end", message: error.message });
      return null;
    }
  }

  async function finishTodoLifecycleTrace(context, input) {
    if (!context || typeof runManager.finishLifecycleTrace !== "function") return null;
    try {
      return await runManager.finishLifecycleTrace(context, input);
    } catch (error) {
      emit("automation.error", { reason: "lifecycle-trace-finish", message: error.message });
      return null;
    }
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
	refreshProject,
    handleTaskProjectionChanged,
    setEnabled,
    setQueuePaused,
    clearRemoteSession,
    bindProject,
    setProjectParticipation,
    updateTaskState,
    submitIntervention,
    submitAcceptanceFeedback,
    stopCurrent,
    handoffToCodexCli,
    reopenCodexCli,
    resumeRuntimeFromCodexCli,
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
            : projectError ? "work_sync_error" : "eligible"
      };
    });
}

export function compareQueueTasks(left, right) {
  return Number(right.priority || 0) - Number(left.priority || 0)
    || timestamp(left.state_changed_at || left.updated_at || left.created_at) - timestamp(right.state_changed_at || right.updated_at || right.created_at)
    || String(left.project_id).localeCompare(String(right.project_id))
    || String(left.id).localeCompare(String(right.id));
}

export function buildAcceptanceFeedbackQueue(items = [], { selectedProjectId = "all" } = {}) {
  return items
    .filter((item) => ["queued", "running", "awaiting_human", "blocked"].includes(item.status))
    .filter((item) => selectedProjectId === "all" || String(item.source_project_id) === String(selectedProjectId))
    .sort(compareAcceptanceFeedback)
    .map((item, index) => ({ ...item, queue_position: index + 1 }));
}

export function compareAcceptanceFeedback(left, right) {
  return timestamp(left.ready_at || left.created_at) - timestamp(right.ready_at || right.created_at)
    || String(left.feedback_id).localeCompare(String(right.feedback_id));
}

export function selectNextExecution(todoQueue = [], feedbackQueue = []) {
  const todo = todoQueue[0] || null;
  const feedback = feedbackQueue.find((item) => item.status === "queued") || null;
  if (!todo && !feedback) return null;
  if (!todo) return { kind: "acceptance_feedback", item: feedback };
  if (!feedback) return { kind: "todo", item: todo };
  const todoReady = timestamp(todo.state_changed_at || todo.updated_at || todo.created_at);
  const feedbackReady = timestamp(feedback.ready_at || feedback.created_at);
  if (feedbackReady < todoReady) return { kind: "acceptance_feedback", item: feedback };
  if (todoReady < feedbackReady) return { kind: "todo", item: todo };
  return String(feedback.feedback_id).localeCompare(String(todo.id)) < 0
    ? { kind: "acceptance_feedback", item: feedback }
    : { kind: "todo", item: todo };
}

function countAcceptanceFeedback(items = [], projectId = "all") {
  const counts = Object.fromEntries(["queued", "running", "awaiting_human", "blocked", "resolved", "cancelled"].map((status) => [status, 0]));
  for (const item of items) {
    if (projectId !== "all" && String(item.source_project_id) !== String(projectId)) continue;
    if (item.status in counts) counts[item.status] += 1;
  }
  counts.open = counts.queued + counts.running + counts.awaiting_human + counts.blocked;
  return counts;
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

function enrichTask(task, { automation, project, localProject, queue, pendingCandidates, acceptanceFeedbackItems = [] }) {
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
    queue_position: queueItem?.queue_position || null,
    acceptance_feedback_items: acceptanceFeedbackItems
      .filter((item) => String(item.source_task_id) === String(task.id))
      .sort((left, right) => timestamp(right.created_at) - timestamp(left.created_at))
  };
}

function deriveHealth(automation, queue, blockedPendingTasks = [], acceptanceFeedbackQueue = []) {
  if (automation.recovery_items.length > 0) return { state: "recovery", label: "需要恢复", tone: "danger" };
  if (automation.attention_items.length > 0) return { state: "attention", label: "等待人工", tone: "warning" };
  if (automation.snapshot.source_status === "logged_out") return { state: "logged_out", label: "Workshop 未登录", tone: "neutral" };
  if (automation.snapshot.source_status === "unauthenticated") return { state: "unauthenticated", label: "认证已失效", tone: "danger" };
  if (automation.snapshot.source_status !== "healthy") return { state: automation.snapshot.source_status, label: "任务源异常", tone: "warning" };
  if (!automation.enabled) return { state: "disabled", label: "自动领取已关闭", tone: "neutral" };
  if (automation.queue_paused) return { state: "paused", label: "领取已暂停", tone: "neutral" };
  if (automation.active_task) return { state: "running", label: "自动执行中", tone: "accent" };
  if (blockedPendingTasks.length > 0) return { state: "configuration_required", label: "待处理任务尚不可领取", tone: "warning" };
  if (queue.length === 0 && acceptanceFeedbackQueue.length === 0) return { state: "idle", label: "队列已清空", tone: "success" };
  return { state: "ready", label: "准备领取", tone: "success" };
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
  if (active.execution_kind === "acceptance_feedback") {
    if (task.state !== "completed") {
      automation.recovery_items = upsertById(automation.recovery_items, {
        id: `RECOVERY-feedback-source-change-${active.feedback_id}`,
        type: "external_state_change",
        task_id: active.task_id,
        project_id: active.project_id,
        run_id: active.run_id,
        feedback_id: active.feedback_id,
        message: `验收问题的来源待办已变为 ${task.state}。`,
        freeze_scope: "global",
        responsibility: "operator",
        actions: ["retry_sync", "accept_server_state"],
        created_at: new Date().toISOString()
      });
    }
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
    task_title: taskDisplayTitle(task.content, task.title || task.id),
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

function recoveryActionsForItem(item, active) {
  const actions = [...(item?.actions || [])];
  if (!active
    || String(active.task_id) !== String(item?.task_id)
    || !active.thread_id
    || !actions.includes("retry_start")
    || actions.includes("feedback_continue")) {
    return actions;
  }
  actions.splice(Math.max(0, actions.indexOf("mark_blocked")), 0, "feedback_continue");
  return actions;
}

function requiredId(value, label) {
  const id = String(value || "").trim();
  if (!id) throw new Error(`${label} id is required.`);
  return id;
}

function createStoreBackedTaskStateBoundary(runManager) {
  function attachLocalProjection(store) {
    if (store.automation?.snapshot) return store;
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
  return {
    attachLocalProjection,
    async reconcile() { return attachLocalProjection(await runManager.readDesktopStore()).automation.snapshot; },
    async refreshProject() { return attachLocalProjection(await runManager.readDesktopStore()).automation.snapshot; },
    async updateTaskState({ taskId, state, expectedState = "" }) {
      let updated = null;
      await runManager.updateDesktopStore((store) => {
        attachLocalProjection(store);
        const task = store.automation.snapshot.tasks.find((item) => String(item.id) === String(taskId));
        if (!task) throw Object.assign(new Error(`Unknown local task: ${taskId}`), { code: "not_found" });
        if (expectedState && task.state !== expectedState) {
          throw Object.assign(new Error(`Task ${task.id} is ${task.state}, expected ${expectedState}.`), { code: "conflict" });
        }
        task.state = state;
        updated = structuredClone(task);
        return store;
      });
      return updated;
    }
  };
}

function scalarId(value) {
  return ["string", "number"].includes(typeof value) && String(value).trim()
    ? String(value).trim()
    : "";
}

function isRemoteSourceReady(sourceStatus) {
  return sourceStatus === "healthy" || sourceStatus === "degraded";
}

function lifecycleContextFromActive(active = {}) {
  const traceId = String(active.lifecycle_trace_id || "").trim();
  if (!traceId) return null;
  return {
    trace_id: traceId,
    root_span_id: String(active.lifecycle_root_span_id || "").trim(),
    events_file: String(active.lifecycle_events_file || "").trim(),
    summary_file: String(active.lifecycle_summary_file || "").trim()
  };
}

function lifecycleRunInput(context, parentSpanId = "") {
  if (!context?.trace_id) return {};
  return {
    lifecycleTraceId: context.trace_id,
    lifecycleRootSpanId: context.root_span_id || "",
    lifecycleParentSpanId: parentSpanId || context.root_span_id || "",
    lifecycleEventsFile: context.events_file || "",
    lifecycleSummaryFile: context.summary_file || ""
  };
}

function compactLifecycleSummary(summary = {}) {
  return {
    schema_version: summary.schema_version || "arckit-lifecycle-summary/v1",
    trace_id: summary.trace_id || "",
    status: summary.status || "",
    total_ms: Number(summary.total_ms || 0),
    span_count: Number(summary.span_count || 0),
    open_span_count: Number(summary.open_span_count || 0),
    error_span_count: Number(summary.error_span_count || 0),
    cost_centers: Array.isArray(summary.cost_centers) ? summary.cost_centers.slice(0, 8) : [],
    phase_hotspots: Array.isArray(summary.phase_hotspots) ? summary.phase_hotspots.slice(0, 10) : [],
    diagnosis: summary.diagnosis || null
  };
}

function timestamp(value) {
  const result = Date.parse(value || "");
  return Number.isFinite(result) ? result : Number.MAX_SAFE_INTEGER;
}

export function buildAutomationTask(task) {
  return String(task?.content ?? task?.title ?? "");
}

export function buildInterventionTask(message) {
  return String(message || "").trim();
}

export function buildAcceptanceFeedbackTask(item = {}) {
  return String(item.original_feedback || "").trim();
}

function acceptanceFeedbackRuntimeContext(item = {}) {
  return {
    kind: "acceptance_feedback",
    feedback_id: item.feedback_id || "",
    source_task_id: item.source_task_id || "",
    source_run_id: item.source_run_id || "",
    source_case_id: item.source_case_id || "",
    source_completion_at: item.source_completion_at || ""
  };
}

function feedbackActiveExecution(item, project, { phase = "starting" } = {}) {
  return {
    execution_kind: "acceptance_feedback",
    feedback_id: item.feedback_id,
    task_id: item.source_task_id,
    project_id: item.source_project_id,
    task_title: taskDisplayTitle(item.source_task_title, item.source_task_id),
    local_project_id: item.local_project_id,
    local_project_path: project?.path || "",
    phase,
    case_id: "",
    case_status: "unbound",
    case_resolved_at: "",
    case_binding_source: "",
    case_binding_run_id: "",
    case_bound_at: "",
    thread_id: item.thread_id,
    thread_bound_at: item.created_at,
    closeout_status: "pending",
    closeout_completed_at: "",
    remote_completion_status: "pending",
    run_id: "",
    session_id: item.session_id,
    claimed_at: item.created_at,
    started_at: ""
  };
}

export function extractCaseIdFromRun(run) {
  const binding = extractAuthoritativeCaseBindingFromRun(run);
  return binding.status === "bound" ? binding.case_id : "";
}

export function selectTaskCloseoutResult({ result, activity } = {}) {
  const candidates = [
    result?.closeout_result,
    activity?.closeout_result,
    ...[...(activity?.messages || [])]
      .reverse()
      .map((message) => message?.structured_data?.value)
  ];
  return candidates.find(isTaskCloseoutResult) || null;
}

function isTaskCloseoutResult(value) {
  return value?.schema_version === "arckit-task-closeout-result/v1"
    && ["completed", "needs_human", "failed"].includes(value.status)
    && ["committed", "no_changes", "none"].includes(value.outcome)
    && typeof value.summary === "string"
    && Array.isArray(value.evidence)
    && value.evidence.every((item) => typeof item === "string")
    && typeof value.commit_hash === "string"
    && typeof value.error === "string";
}

function ledgerFailureReason({ result, activity } = {}) {
  const ledgers = [
    activity?.ledger_write_result?.parsed,
    result?.ledger_write_result
  ];
  for (const ledger of ledgers) {
    const reason = String(ledger?.rejection?.reason || "").trim();
    if (reason) return reason;
    const gateReasons = ledger?.gate?.reasons;
    if (Array.isArray(gateReasons) && gateReasons.some(Boolean)) {
      return gateReasons.filter(Boolean).join("\n");
    }
  }
  return "";
}

export function extractAuthoritativeCaseBindingFromRun(run) {
  const ledgers = [
    ...((run?.activity?.ledger_write_receipts || []).map((receipt, index) => ({
      value: receipt?.parsed,
      source: `activity.ledger_write_receipts[${index}]`
    }))),
    { value: run?.activity?.ledger_write_result?.parsed, source: "activity.ledger_write_result" },
    { value: run?.result?.ledger_write_result, source: "result.ledger_write_result" }
  ].filter(({ value }) => value?.written === true);
  const observations = [];
  for (const ledger of ledgers) {
    for (const value of [
      ledger.value.case_control_result?.case_id,
      ledger.value.case_transition_result?.case_id,
      ledger.value.command_receipt?.case_id
    ]) {
      const caseId = String(value || "").trim();
      if (CASE_ID_PATTERN.test(caseId)
        && !observations.some((item) => item.case_id === caseId && item.evidence === ledger.source)) {
        observations.push({ case_id: caseId, evidence: ledger.source });
      }
    }
  }
  const caseIds = [...new Set(observations.map((item) => item.case_id))];
  if (caseIds.length > 1) return { status: "conflict", case_ids: caseIds, observations };
  if (caseIds.length === 0) return { status: "unbound", case_ids: [], observations: [] };
  return {
    status: "bound",
    case_id: caseIds[0],
    case_ids: caseIds,
    source: AUTHORITATIVE_CASE_BINDING_SOURCE,
    run_id: String(run?.id || ""),
    observations
  };
}

export function persistedCaseBinding(active) {
  const caseId = String(active?.case_id || "").trim();
  const source = String(active?.case_binding_source || "");
  const runId = String(active?.case_binding_run_id || "");
  if (!CASE_ID_PATTERN.test(caseId) || source !== AUTHORITATIVE_CASE_BINDING_SOURCE || !runId) {
    return { status: "unbound", case_ids: [], observations: [] };
  }
  return { status: "bound", case_id: caseId, case_ids: [caseId], source, run_id: runId, observations: [] };
}

export function mergeCaseBindings(left, right) {
  if (left?.status === "conflict") return left;
  if (right?.status === "conflict") return right;
  if (left?.status !== "bound") return right?.status === "bound" ? right : { status: "unbound", case_ids: [], observations: [] };
  if (right?.status !== "bound") return left;
  if (left.case_id === right.case_id) return right;
  return {
    status: "conflict",
    case_ids: [...new Set([left.case_id, right.case_id])],
    observations: [...(left.observations || []), ...(right.observations || [])]
  };
}

export function isCanonicalCaseResolved(caseState) {
  return caseState?.location === "closed"
    && caseState?.record?.status === "closed"
    && caseState?.record?.case_resolution?.status === "resolved";
}

export function buildUsageBaseline(runs, { projectId = "", excludeRunId = "" } = {}) {
  const samples = (runs || []).filter((run) => (
    run.id !== excludeRunId
    && (!projectId || run.project_id === projectId)
    && (run.entry_capability || "runtime") === "runtime"
    && run.status === "completed"
    && Number(runUsageSummary(run).logical_total_tokens || 0) > 0
  )).slice(0, 20);
  return {
    schema_version: "runtime-usage-baseline/v1",
    kind: "runtime_history_median",
    sample_size: samples.length,
    logical_total_tokens: median(samples.map((run) => runUsageSummary(run).logical_total_tokens)),
    cached_input_tokens: median(samples.map((run) => runUsageSummary(run).cached_input_tokens)),
    uncached_input_tokens: median(samples.map((run) => runUsageSummary(run).uncached_input_tokens)),
    output_tokens: median(samples.map((run) => runUsageSummary(run).output_tokens)),
    model_time_ms: median(samples.map((run) => runPerformanceSummary(run).model_time_ms || 0)),
    command_time_ms: median(samples.map((run) => runPerformanceSummary(run).command_time_ms || 0))
  };
}

async function listRunSummaries(runManager) {
  if (typeof runManager.listRunSummaries === "function") {
    return runManager.listRunSummaries({});
  }
  return runManager.listRuns({});
}

async function getRunDetail(runManager, summaries, runId, { projectId = "" } = {}) {
  if (!runId) return null;
  if (typeof runManager.getRun === "function") {
    return runManager.getRun(runId);
  }
  const projected = summaries.find((run) => run.id === runId) || null;
  if (projected?.activity || typeof runManager.listRuns !== "function") return projected;
  const runs = await runManager.listRuns(projectId ? { projectId } : {});
  return runs.find((run) => run.id === runId) || projected;
}

function runUsageSummary(run) {
  return run?.run_summary?.token_usage || run?.activity?.token_usage?.summary || {};
}

function runPerformanceSummary(run) {
  return run?.run_summary?.performance || run?.activity?.performance || {};
}

function median(values) {
  const sorted = values.map(Number).filter(Number.isFinite).sort((left, right) => left - right);
  if (sorted.length === 0) return 0;
  const middle = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 0 ? (sorted[middle - 1] + sorted[middle]) / 2 : sorted[middle];
}
