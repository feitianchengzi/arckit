import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import {
  buildAcceptanceFeedbackQueue,
  buildAutomationTask,
  buildQueue,
  createAutomationCoordinator,
  extractAuthoritativeCaseBindingFromRun,
  isCanonicalCaseResolved,
  selectTaskCloseoutResult,
  selectNextExecution
} from "../src/automation-coordinator.mjs";

const automationCoordinatorPath = new URL("../src/automation-coordinator.mjs", import.meta.url);

test("automation task preserves only the remote human-authored intent", () => {
  assert.equal(buildAutomationTask({ title: "Fix login", content: "Repair and verify login." }), "Repair and verify login.");
  assert.equal(buildAutomationTask({ title: "display title", content: "  Repair\nexactly.  " }), "  Repair\nexactly.  ");
});

test("queue remains deterministic and excludes ineligible tasks", () => {
  const queue = buildQueue([
    { id: "2", project_id: "p", state: "pending", priority: 1, confirmed_at: "2026-01-02" },
    { id: "1", project_id: "p", state: "pending", priority: 2, confirmed_at: "2026-01-01" }
  ], {
    project_bindings: { p: "local" },
    project_participation: { p: true },
    snapshot: { projects: [{ id: "p" }], errors: [] }
  }, new Map([["p", { id: "p" }]]), new Map([["local", { id: "local", path: "/workspace" }]]));
  assert.deepEqual(queue.map((item) => item.id), ["1", "2"]);
});

test("automation snapshot reads bounded run summaries and only hydrates the active run", async () => {
  const store = recoveryStore({ phase: "running" });
  const calls = { summaries: 0, details: 0, hydratedLists: 0 };
  const runManager = fakeRunManager(store, [], {
    async listRunSummaries() {
      calls.summaries += 1;
      return [{
        id: "RUN-OLD",
        project_id: "local",
        status: "completed",
        run_summary: {
          token_usage: {
            logical_total_tokens: 1200,
            cached_input_tokens: 600,
            uncached_input_tokens: 400,
            output_tokens: 200
          },
          performance: { model_time_ms: 900, command_time_ms: 300 }
        }
      }, {
        id: "RUN-HISTORY",
        project_id: "local",
        status: "completed",
        run_summary: {
          token_usage: {
            logical_total_tokens: 800,
            cached_input_tokens: 300,
            uncached_input_tokens: 350,
            output_tokens: 150
          },
          performance: { model_time_ms: 700, command_time_ms: 200 }
        }
      }];
    },
    async getRun(runId) {
      calls.details += 1;
      assert.equal(runId, "RUN-OLD");
      return { id: runId, project_id: "local", status: "running", activity: { messages: [{ id: "LIVE" }] } };
    },
    async listRuns() {
      calls.hydratedLists += 1;
      throw new Error("Automation snapshot must not hydrate historical Run activity.");
    }
  });
  const coordinator = unconfiguredCoordinator(runManager);

  const snapshot = await coordinator.getSnapshot();

  assert.equal(snapshot.active_run.activity.messages[0].id, "LIVE");
  assert.equal(snapshot.usage_baseline.sample_size, 1);
  assert.equal(snapshot.usage_baseline.logical_total_tokens, 800);
  assert.deepEqual(calls, { summaries: 1, details: 1, hydratedLists: 0 });
  coordinator.dispose();
});

test("automation control and recovery code uses run-id detail instead of project history hydration", async () => {
  const source = await readFile(automationCoordinatorPath, "utf8");
  const controlCode = source.slice(0, source.indexOf("async function listRunSummaries"));
  const detailHelper = source.slice(source.indexOf("async function getRunDetail"), source.indexOf("\nfunction runUsageSummary"));

  assert.doesNotMatch(controlCode, /runManager\.listRuns/);
  assert.match(detailHelper, /runManager\.getRun\(runId\)/);
  assert.match(detailHelper, /projectId \? \{ projectId \} : \{\}/);
});

test("acceptance feedback has an independent stable queue and deterministic execution arbitration", () => {
  const feedbackQueue = buildAcceptanceFeedbackQueue([
    { feedback_id: "AF-2", source_project_id: "p", source_task_id: "t", status: "queued", ready_at: "2026-08-13T00:00:02Z" },
    { feedback_id: "AF-1", source_project_id: "p", source_task_id: "t", status: "queued", ready_at: "2026-08-13T00:00:01Z" },
    { feedback_id: "AF-DONE", source_project_id: "p", source_task_id: "t", status: "resolved", ready_at: "2026-08-13T00:00:00Z" }
  ]);
  assert.deepEqual(feedbackQueue.map((item) => item.feedback_id), ["AF-1", "AF-2"]);
  assert.equal(selectNextExecution([{ id: "TODO-1", created_at: "2026-08-13T00:00:03Z" }], feedbackQueue).kind, "acceptance_feedback");
  assert.equal(selectNextExecution([{ id: "TODO-1", created_at: "2026-08-12T00:00:00Z" }], feedbackQueue).kind, "todo");
});

test("acceptance feedback persists idempotently, keeps the source todo completed, and starts on the same thread", async () => {
  const starts = [];
  const messages = [];
  const store = recoveryStore({ execution_kind: "todo" });
  store.automation.snapshot.source_status = "healthy";
  store.automation.snapshot.tasks[0].state = "completed";
  store.automation.active_task = null;
  store.automation.acceptance_feedback_items = [];
  store.automation.recent_completions.push({
    task_id: "t", project_id: "p", title: "todo", run_id: "RUN-OLD", case_id: "CASE-20260813-001",
    thread_id: "THREAD-PERSISTED", local_project_id: "local", session_id: "SESSION-T", completed_at: "2026-08-13T00:00:00Z"
  });
  const runManager = fakeRunManager(store, starts, {
    async preflightRun() {},
    async listMessages() { return messages; },
    async addMessage(_projectId, message) {
      const entry = { id: `MSG-${messages.length + 1}`, ...message };
      messages.push(entry);
      return entry;
    },
    async startRun(input) {
      starts.push(input);
      return { id: "RUN-FEEDBACK", thread_id: input.threadId, project_id: "local", session_id: input.sessionId };
    }
  });
  const coordinator = createAutomationCoordinator({ runManager, taskSourceFactory() { throw new Error("task source must not be mutated"); } });

  await coordinator.submitAcceptanceFeedback({ taskId: "t", message: "结果仍有旧字段", idempotencyKey: "KEY-1" });
  await coordinator.submitAcceptanceFeedback({ taskId: "t", message: "结果仍有旧字段", idempotencyKey: "KEY-1" });

  assert.equal(store.automation.snapshot.tasks[0].state, "completed");
  assert.equal(store.automation.acceptance_feedback_items.length, 1);
  assert.equal(messages.length, 1);
  assert.equal(messages[0].feedback_id, store.automation.acceptance_feedback_items[0].feedback_id);
  assert.equal(starts.length, 1);
  assert.equal(starts[0].threadId, "THREAD-PERSISTED");
  assert.equal(starts[0].sessionId, "SESSION-T");
  assert.equal(starts[0].runtimeContext.kind, "acceptance_feedback");
  assert.equal(starts[0].runtimeContext.source_run_id, "RUN-OLD");
  const snapshot = await coordinator.getSnapshot({ state: "completed" });
  assert.equal(snapshot.acceptance_feedback_queue.length, 1);
  assert.equal(snapshot.tasks[0].acceptance_feedback_items.length, 1);
  coordinator.dispose();
});

test("accepted tasks cannot receive new acceptance issues", async () => {
  const store = recoveryStore();
  store.automation.snapshot.tasks[0].state = "accepted";
  store.automation.acceptance_feedback_items = [];
  const coordinator = createAutomationCoordinator({
    runManager: fakeRunManager(store, []),
    taskSourceFactory() { throw new Error("task source must not be contacted"); }
  });

  await assert.rejects(
    coordinator.submitAcceptanceFeedback({ taskId: "t", message: "不应接受", idempotencyKey: "KEY-ACCEPTED" }),
    /只有已完成待办可以提出验收问题/
  );
  assert.equal(store.automation.acceptance_feedback_items.length, 0);
  coordinator.dispose();
});

test("a completed task cannot be accepted while an acceptance issue remains open", async () => {
  const store = recoveryStore();
  store.automation.snapshot.tasks[0].state = "completed";
  store.automation.acceptance_feedback_items = [{
    feedback_id: "AF-OPEN", source_task_id: "t", source_project_id: "p", status: "queued"
  }];
  const coordinator = createAutomationCoordinator({
    runManager: fakeRunManager(store, []),
    taskSourceFactory() { throw new Error("task source must not be contacted"); }
  });

  await assert.rejects(
    coordinator.updateTaskState({ taskId: "t", state: "accepted", expectedState: "completed" }),
    /仍有未解决的验收问题/
  );
  assert.equal(store.automation.snapshot.tasks[0].state, "completed");
  coordinator.dispose();
});

test("a queued acceptance feedback item keeps automation health ready when the todo queue is empty", async () => {
  const store = recoveryStore();
  store.automation.snapshot.source_status = "healthy";
  store.automation.snapshot.tasks[0].state = "completed";
  store.automation.active_task = null;
  store.automation.acceptance_feedback_items = [{
    feedback_id: "AF-READY",
    status: "queued",
    source_project_id: "p",
    source_task_id: "t",
    ready_at: "2026-08-13T00:00:00Z"
  }];
  const coordinator = createAutomationCoordinator({
    runManager: fakeRunManager(store, []),
    taskSourceFactory() { throw new Error("task source must not be contacted"); }
  });

  const snapshot = await coordinator.getSnapshot();

  assert.equal(snapshot.todo_queue.length, 0);
  assert.equal(snapshot.acceptance_feedback_queue.length, 1);
  assert.equal(snapshot.health.state, "ready");
  coordinator.dispose();
});

test("acceptance feedback stays in its own queue while another execution owns the lease", async () => {
  const starts = [];
  const messages = [];
  const store = recoveryStore({ execution_kind: "todo" });
  store.automation.snapshot.source_status = "healthy";
  store.automation.snapshot.tasks.push({
    id: "completed-task",
    project_id: "p",
    title: "completed todo",
    state: "completed"
  });
  store.automation.acceptance_feedback_items = [];
  store.automation.recent_completions.push({
    task_id: "completed-task",
    project_id: "p",
    run_id: "RUN-COMPLETED",
    case_id: "CASE-20260813-002",
    thread_id: "THREAD-COMPLETED",
    local_project_id: "local",
    session_id: "SESSION-COMPLETED",
    completed_at: "2026-08-13T00:00:00Z"
  });
  const runManager = fakeRunManager(store, starts, {
    async listMessages() { return messages; },
    async addMessage(_projectId, message) {
      const entry = { id: "MSG-FEEDBACK", ...message };
      messages.push(entry);
      return entry;
    }
  });
  const coordinator = createAutomationCoordinator({
    runManager,
    taskSourceFactory() { throw new Error("task source must not be contacted"); }
  });

  await coordinator.submitAcceptanceFeedback({
    taskId: "completed-task",
    message: "仍有验收问题",
    idempotencyKey: "KEY-LEASE"
  });

  assert.equal(starts.length, 0);
  assert.equal(store.automation.active_task.task_id, "t");
  assert.equal(store.automation.acceptance_feedback_items[0].status, "queued");
  assert.equal(store.automation.acceptance_feedback_items[0].progress, "等待执行租约");
  assert.equal(store.automation.snapshot.tasks.find((task) => task.id === "completed-task").state, "completed");
  coordinator.dispose();
});

test("concurrent conflicting feedback submissions reject the losing payload before writing its message", async () => {
  const starts = [];
  const messages = [];
  const store = recoveryStore();
  store.automation.snapshot.source_status = "healthy";
  store.automation.snapshot.tasks[0].state = "completed";
  store.automation.active_task = null;
  store.automation.acceptance_feedback_items = [];
  store.automation.recent_completions.push({
    task_id: "t",
    project_id: "p",
    run_id: "RUN-OLD",
    case_id: "CASE-20260813-001",
    thread_id: "THREAD-PERSISTED",
    local_project_id: "local",
    session_id: "SESSION-T"
  });
  let releaseReads;
  let initialReads = 0;
  const bothRead = new Promise((resolve) => { releaseReads = resolve; });
  const runManager = fakeRunManager(store, starts, {
    async readDesktopStore() {
      if (store.automation.acceptance_feedback_items.length === 0 && initialReads < 2) {
        initialReads += 1;
        if (initialReads === 2) releaseReads();
        await bothRead;
      }
      return structuredClone(store);
    },
    async listMessages() { return messages; },
    async addMessage(_projectId, message) {
      const entry = { id: `MSG-${messages.length + 1}`, ...message };
      messages.push(entry);
      return entry;
    },
    async preflightRun() {},
    async startRun(input) {
      starts.push(input);
      return { id: "RUN-FEEDBACK", thread_id: input.threadId, project_id: "local", session_id: input.sessionId };
    }
  });
  const coordinator = createAutomationCoordinator({ runManager, taskSourceFactory() { throw new Error("unused"); } });

  const results = await Promise.allSettled([
    coordinator.submitAcceptanceFeedback({ taskId: "t", message: "问题 A", idempotencyKey: "KEY-RACE" }),
    coordinator.submitAcceptanceFeedback({ taskId: "t", message: "问题 B", idempotencyKey: "KEY-RACE" })
  ]);

  assert.equal(results.filter((result) => result.status === "fulfilled").length, 1);
  assert.equal(results.filter((result) => result.status === "rejected").length, 1);
  assert.match(results.find((result) => result.status === "rejected").reason.message, /冲突/);
  assert.equal(store.automation.acceptance_feedback_items.length, 1);
  assert.equal(messages.length, 1);
  assert.equal(messages[0].content, store.automation.acceptance_feedback_items[0].original_feedback);
  coordinator.dispose();
});

test("feedback readiness failure preserves an actionable recovery lease", async () => {
  const store = recoveryStore();
  store.automation.snapshot.source_status = "healthy";
  store.automation.snapshot.tasks[0].state = "completed";
  store.automation.active_task = null;
  store.automation.acceptance_feedback_items = [];
  store.automation.recent_completions.push({
    task_id: "t",
    project_id: "p",
    run_id: "RUN-OLD",
    case_id: "CASE-20260813-001",
    thread_id: "THREAD-PERSISTED",
    local_project_id: "local",
    session_id: "SESSION-T"
  });
  const messages = [];
  const coordinator = createAutomationCoordinator({
    runManager: fakeRunManager(store, [], {
      async listMessages() { return messages; },
      async addMessage(_projectId, message) {
        const entry = { id: "MSG-FEEDBACK", ...message };
        messages.push(entry);
        return entry;
      },
      async preflightRun() { throw new Error("Codex unavailable"); }
    }),
    taskSourceFactory() { throw new Error("unused"); }
  });

  await coordinator.submitAcceptanceFeedback({ taskId: "t", message: "问题", idempotencyKey: "KEY-PREFLIGHT" });

  assert.equal(store.automation.active_task.execution_kind, "acceptance_feedback");
  assert.equal(store.automation.active_task.phase, "recovery");
  assert.equal(store.automation.acceptance_feedback_items[0].status, "blocked");
  assert.deepEqual(store.automation.recovery_items[0].actions, ["retry_start", "mark_blocked"]);
  assert.equal(store.automation.recovery_items[0].feedback_id, store.automation.acceptance_feedback_items[0].feedback_id);
  coordinator.dispose();
});

test("closed Case recovery resumes the persisted thread for same-thread closeout", async () => {
  const starts = [];
  const store = {
    projects: [{ id: "local", path: "/workspace", name: "demo" }],
    settings: { task_source: {} },
    automation: {
      enabled: true,
      queue_paused: false,
      project_bindings: { p: "local" },
      project_participation: { p: true },
      snapshot: {
        source_status: "logged_out", errors: [], user: null, projects: [{ id: "p" }],
        tasks: [{ id: "t", project_id: "p", title: "todo", content: "finish", state: "in_progress" }]
      },
      active_task: {
        task_id: "t", project_id: "p", local_project_id: "local", local_project_path: "/workspace",
        task_title: "todo", phase: "recovery", case_id: "CASE-20260809-001", case_status: "resolved",
        case_binding_source: "runtime_ledger", case_binding_run_id: "RUN-OLD", case_bound_at: "2026-08-09T00:00:00Z",
        case_resolved_at: "", closeout_status: "pending", closeout_completed_at: "", remote_completion_status: "pending",
        run_id: "RUN-OLD", session_id: "SESSION-T", thread_id: "THREAD-PERSISTED", started_at: "2026-08-09T00:00:00Z"
      },
      attention_items: [], recovery_items: [], recent_completions: []
    }
  };
  const runManager = fakeRunManager(store, starts);
  const coordinator = createAutomationCoordinator({
    runManager,
    taskSourceFactory() { throw Object.assign(new Error("not logged in"), { code: "unconfigured" }); }
  });
  await coordinator.sync({ dispatch: false });
  assert.equal(starts.length, 1);
  assert.equal(starts[0].threadId, "THREAD-PERSISTED");
  assert.deepEqual(starts[0].runtimeContext, { closeout_only: true, case_id: "CASE-20260809-001" });
  coordinator.dispose();
});

test("an unbound task never adopts the sole readable closed Case", async () => {
  const starts = [];
  const store = recoveryStore();
  const runManager = fakeRunManager(store, starts, {
    async listProjectCaseStates() {
      return [{
        case_id: "CASE-20260810-003",
        location: "closed",
        record: { id: "CASE-20260810-003", status: "closed", case_resolution: { status: "resolved" } }
      }];
    },
    async getProjectCaseState() {
      throw new Error("An unrelated Case must never be looked up.");
    }
  });
  const coordinator = unconfiguredCoordinator(runManager);

  await coordinator.sync({ dispatch: false });

  assert.equal(starts.length, 0);
  assert.equal(store.automation.active_task.case_id, "");
  assert.equal(store.automation.active_task.case_status, "unbound");
  coordinator.dispose();
});

test("CLI return does not infer a Case from one concurrent repository addition", async () => {
  const starts = [];
  const store = recoveryStore({ phase: "cli_handoff" });
  const runManager = fakeRunManager(store, starts, {
    async listProjectCaseStates() {
      return [{
        case_id: "CASE-20260810-003",
        location: "closed",
        record: { id: "CASE-20260810-003", status: "closed", case_resolution: { status: "resolved" } }
      }];
    }
  });
  const coordinator = unconfiguredCoordinator(runManager);

  await coordinator.resumeRuntimeFromCodexCli();

  assert.equal(starts.length, 0);
  assert.equal(store.automation.active_task.case_id, "");
  assert.equal(store.automation.recovery_items.at(-1).type, "case_reconciliation_failed");
  coordinator.dispose();
});

test("only a trusted ledger write can establish a Case binding", () => {
  const binding = extractAuthoritativeCaseBindingFromRun({
    id: "RUN-CURRENT",
    case_id: "CASE-20260810-099",
    activity: {
      case_id: "CASE-20260810-098",
      controller_frame: { case_id: "CASE-20260810-097" },
      ledger_write_result: {
        parsed: { written: true, case_control_result: { case_id: "CASE-20260810-005" } }
      }
    },
    result: { runtime_result: { case_transition: { case_id: "CASE-20260810-096" } } }
  });

  assert.deepEqual(binding, {
    status: "bound",
    case_id: "CASE-20260810-005",
    case_ids: ["CASE-20260810-005"],
    source: "runtime_ledger",
    run_id: "RUN-CURRENT",
    observations: [{ case_id: "CASE-20260810-005", evidence: "activity.ledger_write_result" }]
  });
});

test("an earlier accepted receipt keeps Case binding after the latest ledger write fails", () => {
  const binding = extractAuthoritativeCaseBindingFromRun({
    id: "RUN-CURRENT",
    activity: {
      ledger_write_receipts: [{
        parsed: { written: true, case_control_result: { case_id: "CASE-20260810-005" } }
      }],
      ledger_write_result: {
        parsed: { written: false, rejection: { kind: "claim_invalid", reason: "later claim failed" } }
      }
    }
  });

  assert.equal(binding.status, "bound");
  assert.equal(binding.case_id, "CASE-20260810-005");
  assert.deepEqual(binding.observations, [{
    case_id: "CASE-20260810-005",
    evidence: "activity.ledger_write_receipts[0]"
  }]);
});

test("accepted receipts for different Cases produce an explicit binding conflict", () => {
  const binding = extractAuthoritativeCaseBindingFromRun({
    id: "RUN-CURRENT",
    activity: {
      ledger_write_receipts: [
        { parsed: { written: true, case_control_result: { case_id: "CASE-20260810-005" } } },
        { parsed: { written: true, command_receipt: { case_id: "CASE-20260810-006" } } }
      ]
    }
  });
  assert.equal(binding.status, "conflict");
  assert.deepEqual(binding.case_ids, ["CASE-20260810-005", "CASE-20260810-006"]);
});

test("canonical completion requires a consistently closed and resolved Case", () => {
  const resolved = {
    location: "closed",
    record: { status: "closed", case_resolution: { status: "resolved" } }
  };
  assert.equal(isCanonicalCaseResolved(resolved), true);
  assert.equal(isCanonicalCaseResolved({ ...resolved, location: "active" }), false);
  assert.equal(isCanonicalCaseResolved({ ...resolved, record: { ...resolved.record, status: "active" } }), false);
  assert.equal(isCanonicalCaseResolved({
    ...resolved,
    record: { ...resolved.record, case_resolution: { status: "unresolved" } }
  }), false);
});

test("closeout result recovery prefers the Runtime envelope and safely falls back to typed Run activity", () => {
  const envelopeResult = closeoutResult({ summary: "envelope" });
  const projectedResult = closeoutResult({ summary: "projected" });
  const messageResult = closeoutResult({ summary: "message" });

  assert.equal(selectTaskCloseoutResult({
    result: { closeout_result: envelopeResult },
    activity: {
      closeout_result: projectedResult,
      messages: [{ structured_data: { value: messageResult } }]
    }
  }), envelopeResult);
  assert.equal(selectTaskCloseoutResult({
    activity: { closeout_result: projectedResult, messages: [] }
  }), projectedResult);
  assert.equal(selectTaskCloseoutResult({
    activity: {
      messages: [
        { structured_data: { value: closeoutResult({ summary: "older" }) } },
        { structured_data: { value: messageResult } }
      ]
    }
  }), messageResult);
});

test("closeout result recovery rejects untyped or malformed structured messages", () => {
  assert.equal(selectTaskCloseoutResult({
    activity: {
      messages: [
        { structured_data: { value: { ...closeoutResult(), schema_version: "arckit-agent-loop-result/v1" } } },
        { structured_data: { value: { ...closeoutResult(), evidence: "not-an-array" } } },
        { content: JSON.stringify(closeoutResult()) }
      ]
    }
  }), null);
});

test("live same-thread closeout recovers a completed result from the typed activity message", async () => {
  const store = recoveryStore({
    phase: "closeout_running",
    case_id: "CASE-20260810-005",
    case_status: "resolved",
    case_binding_source: "runtime_ledger",
    case_binding_run_id: "RUN-BOUND",
    case_bound_at: "2026-08-10T00:00:00Z",
    closeout_status: "running"
  });
  const runManager = fakeRunManager(store, []);
  const coordinator = unconfiguredCoordinator(runManager);

  await runManager.emitEvent({
    type: "run.finished",
    runId: "RUN-OLD",
    status: "completed",
    result: null,
    activity: {
      messages: [{
        kind: "structured",
        structured_data: {
          schema_version: "arckit-task-closeout-result/v1",
          value: closeoutResult({ summary: "Recovered from activity" })
        }
      }]
    }
  });

  assert.equal(store.automation.active_task.closeout_status, "completed");
  assert.equal(store.automation.active_task.phase, "remote_completion_pending");
  assert.equal(store.automation.active_task.closeout_outcome, "no_changes");
  assert.equal(store.automation.recovery_items.length, 0);
  coordinator.dispose();
});

test("detached same-thread closeout recovers a completed result when result.json is missing", async () => {
  const recovered = closeoutResult({ summary: "Recovered after restart" });
  const store = recoveryStore({
    phase: "closeout_running",
    case_id: "CASE-20260810-005",
    case_status: "resolved",
    case_binding_source: "runtime_ledger",
    case_binding_run_id: "RUN-BOUND",
    case_bound_at: "2026-08-10T00:00:00Z",
    closeout_status: "running"
  });
  const runManager = fakeRunManager(store, [], {
    async listRuns() {
      return [{
        id: "RUN-OLD",
        project_id: "local",
        status: "completed",
        activity: {
          messages: [{
            kind: "structured",
            structured_data: {
              schema_version: recovered.schema_version,
              value: recovered
            }
          }]
        }
      }];
    },
    async readRunResult() { return null; }
  });
  const coordinator = unconfiguredCoordinator(runManager);

  await coordinator.sync({ dispatch: false });

  assert.equal(store.automation.active_task, null);
  assert.equal(store.automation.recent_completions[0].task_id, "t");
  assert.equal(store.automation.recovery_items.length, 0);
  coordinator.dispose();
});

test("conflicting trusted ledger Case identifiers enter recovery", async () => {
  const starts = [];
  const store = recoveryStore({
    case_id: "CASE-20260810-005",
    case_status: "active",
    case_binding_source: "runtime_ledger",
    case_binding_run_id: "RUN-BOUND",
    case_bound_at: "2026-08-10T00:00:00Z"
  });
  const runManager = fakeRunManager(store, starts, {
    async listRuns() {
      return [{
        id: "RUN-OLD", project_id: "local", status: "completed",
        activity: {
          ledger_write_result: {
            parsed: { written: true, case_transition_result: { case_id: "CASE-20260810-006" } }
          },
          loop_handoff: { status: "done", next_responsibility: "none" }
        }
      }];
    }
  });
  const coordinator = unconfiguredCoordinator(runManager);

  await coordinator.sync({ dispatch: false });

  assert.equal(starts.length, 0);
  assert.equal(store.automation.active_task.case_id, "CASE-20260810-005");
  assert.equal(store.automation.recovery_items.at(-1).type, "case_binding_conflict");
  coordinator.dispose();
});

test("a Case produced by the task run ledger still resumes resolved closeout", async () => {
  const starts = [];
  const store = recoveryStore();
  const runManager = fakeRunManager(store, starts, {
    async listRuns() {
      return [{
        id: "RUN-OLD", project_id: "local", status: "failed",
        activity: {
          ledger_write_result: {
            parsed: { written: true, case_control_result: { case_id: "CASE-20260810-005" } }
          }
        }
      }];
    },
    async getProjectCaseState(_projectId, caseId) {
      assert.equal(caseId, "CASE-20260810-005");
      return {
        location: "closed",
        record: { id: caseId, status: "closed", updated_at: "2026-08-10T00:00:00Z", case_resolution: { status: "resolved" } }
      };
    }
  });
  const coordinator = unconfiguredCoordinator(runManager);

  await coordinator.sync({ dispatch: false });

  assert.equal(store.automation.active_task.case_id, "CASE-20260810-005");
  assert.equal(store.automation.active_task.case_binding_source, "runtime_ledger");
  assert.equal(store.automation.active_task.case_binding_run_id, "RUN-OLD");
  assert.equal(starts.length, 1);
  assert.deepEqual(starts[0].runtimeContext, { closeout_only: true, case_id: "CASE-20260810-005" });
  coordinator.dispose();
});

test("detached startup recovers an earlier accepted Case receipt after a later failed write", async () => {
  const starts = [];
  const store = recoveryStore();
  const runManager = fakeRunManager(store, starts, {
    async listRuns() {
      return [{
        id: "RUN-OLD", project_id: "local", status: "failed",
        activity: {
          ledger_write_receipts: [{
            parsed: { written: true, case_control_result: { case_id: "CASE-20260810-005" } }
          }],
          ledger_write_result: {
            parsed: { written: false, rejection: { kind: "claim_invalid", reason: "later transition rejected" } }
          }
        }
      }];
    },
    async getProjectCaseState(_projectId, caseId) {
      assert.equal(caseId, "CASE-20260810-005");
      return {
        location: "closed",
        record: { id: caseId, status: "closed", updated_at: "2026-08-10T00:00:00Z", case_resolution: { status: "resolved" } }
      };
    }
  });
  const coordinator = unconfiguredCoordinator(runManager);

  await coordinator.sync({ dispatch: false });

  assert.equal(store.automation.active_task.case_id, "CASE-20260810-005");
  assert.equal(store.automation.active_task.case_binding_source, "runtime_ledger");
  assert.equal(starts.length, 1);
  assert.deepEqual(starts[0].runtimeContext, { closeout_only: true, case_id: "CASE-20260810-005" });
  coordinator.dispose();
});

test("periodic sync preserves a Run human gate even when canonical Case handoff is older", async () => {
  const starts = [];
  const caseId = "CASE-20260812-006";
  const store = recoveryStore({
    phase: "awaiting_human",
    case_id: caseId,
    case_status: "active",
    case_binding_source: "runtime_ledger",
    case_binding_run_id: "RUN-OLD",
    case_bound_at: "2026-08-12T00:00:00Z"
  });
  store.automation.attention_items.push({
    id: "ATTENTION-t",
    task_id: "t",
    project_id: "p",
    run_id: "RUN-OLD",
    reason: "The autonomous completion review budget is exhausted.",
    question: "Authorize more cycles or stop.",
    created_at: "2026-08-12T00:00:00Z"
  });
  const runManager = fakeRunManager(store, starts, {
    async getProjectCaseState(_projectId, requestedCaseId) {
      assert.equal(requestedCaseId, caseId);
      return {
        location: "active",
        record: {
          id: caseId,
          status: "active",
          case_resolution: {
            status: "unresolved",
            loop_handoff: {
              status: "continue",
              next_responsibility: "agent",
              human_decision_required: false,
              responsibility_reason: "Continue completion review."
            }
          }
        }
      };
    }
  });
  const coordinator = unconfiguredCoordinator(runManager);

  await coordinator.sync({ dispatch: false });

  assert.equal(starts.length, 0);
  assert.equal(store.automation.active_task.phase, "awaiting_human");
  assert.equal(store.automation.attention_items.length, 1);

  await coordinator.submitIntervention({ taskId: "t", message: "授权继续处理。" });

  assert.equal(starts.length, 1);
  assert.equal(starts[0].runtimeContext.kind, "human_intervention");
  assert.equal(store.automation.active_task.phase, "running");
  assert.equal(store.automation.attention_items.length, 0);
  coordinator.dispose();
});

test("realtime project refresh preserves an unconfirmed human gate and does not dispatch", async () => {
  const starts = [];
  const caseId = "CASE-20260812-006";
  const store = recoveryStore({
    phase: "awaiting_human",
    case_id: caseId,
    case_status: "active",
    case_binding_source: "runtime_ledger",
    case_binding_run_id: "RUN-OLD",
    case_bound_at: "2026-08-12T00:00:00Z"
  });
  store.automation.snapshot.source_status = "healthy";
  store.automation.snapshot.user = { id: "u" };
  store.automation.snapshot.projects = [{ id: "p", current_user_id: "u" }];
  store.automation.attention_items.push({
    id: "ATTENTION-t", task_id: "t", project_id: "p", run_id: "RUN-OLD",
    reason: "Human confirmation required.", question: "Continue?", created_at: "2026-08-12T00:00:00Z"
  });
  const runManager = fakeRunManager(store, starts, {
    async getProjectCaseState() {
      return {
        location: "active",
        record: {
          id: caseId,
          status: "active",
          case_resolution: {
            status: "unresolved",
            loop_handoff: { status: "continue", next_responsibility: "agent", human_decision_required: false }
          }
        }
      };
    }
  });
  const coordinator = createAutomationCoordinator({
    runManager,
    taskSourceFactory: () => ({
      async listTasks() { return structuredClone(store.automation.snapshot.tasks); }
    })
  });

  await coordinator.refreshProject("p", { dispatch: false });

  assert.equal(starts.length, 0);
  assert.equal(store.automation.active_task.phase, "awaiting_human");
  assert.equal(store.automation.attention_items.length, 1);
  coordinator.dispose();
});

test("Automation source has no Workshop transport or remote task-read dependency", async () => {
  const source = await readFile(automationCoordinatorPath, "utf8");
  assert.doesNotMatch(source, /createWorkshopTaskSource|workshop-realtime-adapter|\.getTask\(|\.listTasks\(|\.updateTask\(/);
  assert.match(source, /workSync\.updateTaskState/);
});

test("retry_start clears stale closeout state and starts a normal Runtime", async () => {
  const starts = [];
  const store = recoveryStore({
    phase: "recovery",
    case_id: "CASE-20260810-003",
    case_status: "resolved",
    closeout_status: "running"
  });
  store.automation.recovery_items.push({
    id: "RECOVERY-closeout-process-missing-t",
    type: "closeout_process_missing",
    task_id: "t",
    project_id: "p",
    run_id: "RUN-OLD",
    actions: ["retry_start", "mark_blocked"]
  });
  const runManager = fakeRunManager(store, starts);
  const coordinator = unconfiguredCoordinator(runManager);

  await coordinator.resolveRecovery({
    recoveryId: "RECOVERY-closeout-process-missing-t",
    action: "retry_start"
  });

  assert.equal(starts.length, 1);
  assert.equal(starts[0].runtimeContext, null);
  assert.equal(store.automation.active_task.phase, "running");
  assert.equal(store.automation.active_task.closeout_status, "pending");
  coordinator.dispose();
});

test("recovery feedback continues the same Agent thread and persists the user message", async () => {
  const starts = [];
  const messages = [];
  const store = recoveryStore({ phase: "recovery" });
  store.automation.recovery_items.push({
    id: "RECOVERY-runtime-incomplete-t",
    type: "runtime_incomplete",
    task_id: "t",
    project_id: "p",
    run_id: "RUN-OLD",
    actions: ["retry_start", "mark_blocked"]
  });
  const runManager = fakeRunManager(store, starts, {
    async addMessage(_projectId, message) { messages.push(message); },
    async listRuns() {
      return [{ id: "RUN-OLD", project_id: "local", status: "failed", result_file: "/runs/old/result.json", activity_file: "/runs/old/activity.json", activity: {} }];
    }
  });
  const coordinator = unconfiguredCoordinator(runManager);

  const snapshot = await coordinator.getSnapshot();
  assert.deepEqual(snapshot.recovery_items[0].actions, ["retry_start", "feedback_continue", "mark_blocked"]);

  await coordinator.resolveRecovery({
    recoveryId: "RECOVERY-runtime-incomplete-t",
    action: "feedback_continue",
    message: "说明文字可以改写，请从 fresh state 继续。"
  });

  assert.equal(starts.length, 1);
  assert.equal(starts[0].threadId, "THREAD-PERSISTED");
  assert.equal(starts[0].sessionId, "SESSION-T");
  assert.equal(starts[0].task, "说明文字可以改写，请从 fresh state 继续。");
  assert.deepEqual(starts[0].runtimeContext, {
    kind: "recovery_feedback",
    recovery_id: "RECOVERY-runtime-incomplete-t",
    recovery_type: "runtime_incomplete",
    source_run_id: "RUN-OLD",
    source_result_ref: "/runs/old/result.json",
    source_activity_ref: "/runs/old/activity.json"
  });
  assert.equal(messages.length, 1);
  assert.equal(messages[0].role, "user");
  assert.equal(messages[0].kind, "recovery_feedback");
  assert.equal(messages[0].content, "说明文字可以改写，请从 fresh state 继续。");
  assert.equal(store.automation.active_task.phase, "running");
  assert.equal(store.automation.recovery_items.length, 0);
  coordinator.dispose();
});

test("initial Desktop sync resumes one recoverable in-progress task on its persisted thread", async () => {
  const starts = [];
  const store = recoveryStore({ phase: "recovery" });
  store.automation.recovery_items.push({
    id: "RECOVERY-runtime-incomplete-t",
    type: "runtime_incomplete",
    task_id: "t",
    project_id: "p",
    run_id: "RUN-OLD",
    actions: ["retry_start", "mark_blocked"]
  });
  const runManager = fakeRunManager(store, starts, {
    async listRuns() {
      return [{ id: "RUN-OLD", project_id: "local", status: "failed", activity: {} }];
    },
    async getProjectCaseState() { return null; }
  });
  const coordinator = createAutomationCoordinator({
    runManager,
    taskSourceFactory: healthyTaskSourceFactory(store)
  });

  await coordinator.sync({ dispatch: false, resumeRecoverable: true });

  assert.equal(starts.length, 1);
  assert.equal(starts[0].threadId, "THREAD-PERSISTED");
  assert.equal(starts[0].sessionId, "SESSION-T");
  assert.equal(starts[0].task, "finish");
  assert.equal(starts[0].runtimeContext, null);
  assert.equal(store.automation.active_task.phase, "running");
  assert.equal(store.automation.recovery_items.length, 0);
  coordinator.dispose();
});

test("initial Desktop sync restores a persisted Agent human handoff instead of retrying it", async () => {
  const starts = [];
  const store = recoveryStore({ phase: "recovery" });
  store.automation.recovery_items.push({
    id: "RECOVERY-runtime-incomplete-t",
    type: "runtime_incomplete",
    task_id: "t",
    project_id: "p",
    run_id: "RUN-OLD",
    actions: ["retry_start", "mark_blocked"]
  });
  const agentResult = {
    schema_version: "arckit-agent-loop-result/v1",
    action: "handoff",
    summary: "等待跨工作区授权。",
    handoff: {
      next_responsibility: "human",
      reason: "修改相邻 Provider 仓库需要明确授权。",
      next_prompt: "请确认是否授权修改 Provider 仓库。",
      human_decision_required: true
    }
  };
  const runManager = fakeRunManager(store, starts, {
    async listRuns() {
      return [{
        id: "RUN-OLD",
        project_id: "local",
        status: "completed",
        activity: {
          messages: [{
            kind: "structured",
            structured_data: { schema_version: agentResult.schema_version, value: agentResult }
          }]
        }
      }];
    },
    async getProjectCaseState() { return null; }
  });
  const coordinator = createAutomationCoordinator({
    runManager,
    taskSourceFactory: healthyTaskSourceFactory(store)
  });

  await coordinator.sync({ dispatch: false, resumeRecoverable: true });

  assert.equal(starts.length, 0);
  assert.equal(store.automation.active_task.phase, "awaiting_human");
  assert.equal(store.automation.recovery_items.length, 0);
  assert.equal(store.automation.attention_items.length, 1);
  assert.equal(store.automation.attention_items[0].reason, "修改相邻 Provider 仓库需要明确授权。");
  assert.equal(store.automation.attention_items[0].question, "请确认是否授权修改 Provider 仓库。");
  coordinator.dispose();
});

test("periodic sync preserves operator recovery instead of repeatedly restarting it", async () => {
  const starts = [];
  const store = recoveryStore({ phase: "recovery" });
  store.automation.recovery_items.push({
    id: "RECOVERY-runtime-incomplete-t",
    type: "runtime_incomplete",
    task_id: "t",
    project_id: "p",
    run_id: "RUN-OLD",
    actions: ["retry_start", "mark_blocked"]
  });
  const runManager = fakeRunManager(store, starts, {
    async listRuns() {
      return [{ id: "RUN-OLD", project_id: "local", status: "failed", activity: {} }];
    },
    async getProjectCaseState() { return null; }
  });
  const coordinator = createAutomationCoordinator({
    runManager,
    taskSourceFactory: healthyTaskSourceFactory(store)
  });

  await coordinator.sync({ dispatch: false });

  assert.equal(starts.length, 0);
  assert.equal(store.automation.active_task.phase, "recovery");
  assert.equal(store.automation.recovery_items.length, 1);
  coordinator.dispose();
});

test("detached rejected ledger write surfaces the gate reason instead of a success handoff", async () => {
  const starts = [];
  const store = recoveryStore({ phase: "running" });
  const runManager = fakeRunManager(store, starts, {
    async listRuns() {
      return [{
        id: "RUN-OLD",
        project_id: "local",
        status: "completed",
        activity: {
          ledger_stage: { writeback_required: true },
          ledger_write_result: {
            parsed: {
              written: false,
              rejection: {
                kind: "ledger_gate_rejected",
                recoverable: true,
                reason: "case_transition: invariant judgment is invalid"
              }
            }
          },
          loop_handoff: {
            status: "done",
            next_responsibility: "none",
            responsibility_reason: "Case completed successfully."
          }
        }
      }];
    }
  });
  const coordinator = unconfiguredCoordinator(runManager);

  await coordinator.sync({ dispatch: false });

  assert.equal(starts.length, 0);
  assert.equal(store.automation.active_task.phase, "recovery");
  assert.equal(store.automation.recovery_items.at(-1).type, "runtime_incomplete");
  assert.equal(store.automation.recovery_items.at(-1).message, "case_transition: invariant judgment is invalid");
  const createdAt = store.automation.recovery_items.at(-1).created_at;

  await coordinator.sync({ dispatch: false });

  assert.equal(store.automation.recovery_items.length, 1);
  assert.equal(store.automation.recovery_items[0].created_at, createdAt);
  coordinator.dispose();
});

test("live rejected ledger write takes precedence over an unaccepted human handoff", async () => {
  const starts = [];
  const store = recoveryStore({ phase: "running" });
  const runManager = fakeRunManager(store, starts);
  const coordinator = unconfiguredCoordinator(runManager);

  await runManager.emitEvent({
    type: "run.finished",
    runId: "RUN-OLD",
    status: "completed",
    activity: {
      ledger_write_result: {
        parsed: {
          written: false,
          rejection: {
            kind: "ledger_gate_rejected",
            recoverable: true,
            reason: "case_transition: invariant judgment is invalid"
          }
        }
      },
      loop_handoff: {
        status: "awaiting_human",
        next_responsibility: "human",
        human_decision_required: true,
        responsibility_reason: "Case needs a human decision."
      }
    },
    result: {
      runtime_result: {
        ledger_stage: { writeback_required: true },
        loop_handoff: {
          status: "awaiting_human",
          next_responsibility: "human",
          human_decision_required: true,
          responsibility_reason: "Case needs a human decision."
        }
      }
    }
  });

  assert.equal(store.automation.active_task.phase, "recovery");
  assert.equal(store.automation.recovery_items.at(-1).type, "runtime_incomplete");
  assert.equal(store.automation.recovery_items.at(-1).message, "case_transition: invariant judgment is invalid");
  coordinator.dispose();
});

test("live accepted ledger handoff overrides a stale pre-commit Runtime handoff", async () => {
  const starts = [];
  const store = recoveryStore({ phase: "running" });
  const runManager = fakeRunManager(store, starts);
  const coordinator = unconfiguredCoordinator(runManager);

  await runManager.emitEvent({
    type: "run.finished",
    runId: "RUN-OLD",
    status: "completed",
    activity: {
      ledger_write_result: {
        parsed: {
          written: true,
          case_transition_result: {
            case_id: "CASE-20260823-001",
            case_resolution: {
              loop_handoff: {
                version: "loop-handoff/v2",
                status: "needs_human",
                next_responsibility: "human",
                agent_continuation_available: false,
                human_decision_required: true,
                trigger_mode: "user_decision",
                responsibility_reason: "The review budget is exhausted.",
                next_prompt: "",
                human_gate: {
                  required: true,
                  reason: "The review budget is exhausted.",
                  decision_needed: "Choose how to continue review."
                }
              }
            }
          }
        }
      },
      loop_handoff: {
        status: "continue",
        next_responsibility: "agent",
        human_decision_required: false,
        responsibility_reason: "Wait for Runtime to commit this transition."
      }
    },
    result: {
      runtime_result: {
        ledger_stage: { writeback_required: true },
        loop_handoff: {
          status: "continue",
          next_responsibility: "agent",
          human_decision_required: false,
          responsibility_reason: "Wait for Runtime to commit this transition."
        }
      }
    }
  });

  assert.equal(store.automation.active_task.phase, "awaiting_human");
  assert.equal(store.automation.recovery_items.length, 0);
  assert.equal(store.automation.attention_items.length, 1);
  assert.equal(store.automation.attention_items[0].reason, "The review budget is exhausted.");
  assert.equal(store.automation.attention_items[0].question, "Choose how to continue review.");
  coordinator.dispose();
});

test("exhausted live Agent repair surfaces the validator reason instead of a generic failed status", async () => {
  const starts = [];
  const store = recoveryStore({ phase: "running" });
  const runManager = fakeRunManager(store, starts);
  const coordinator = unconfiguredCoordinator(runManager);

  await runManager.emitEvent({
    type: "run.finished",
    runId: "RUN-OLD",
    status: "failed",
    activity: {
      error: "case_transition.invariant_assessment.judgments[2]: not_relevant cannot carry evidence or gaps"
    },
    result: {
      stop_reason: "agent_repair_limit",
      next_action: "State-driven Runtime stopped: agent_repair_limit.",
      runtime_result: {
        ledger_stage: { writeback_required: true },
        loop_handoff: { status: "continue", next_responsibility: "agent" }
      }
    }
  });

  assert.equal(store.automation.active_task.phase, "recovery");
  assert.equal(store.automation.recovery_items.at(-1).message, "case_transition.invariant_assessment.judgments[2]: not_relevant cannot carry evidence or gaps");
  coordinator.dispose();
});

test("CLI handoff does not interrupt Runtime before the Agent establishes a trusted Case binding", async () => {
  const starts = [];
  const controls = [];
  let launches = 0;
  const store = recoveryStore({ phase: "running" });
  const runManager = fakeRunManager(store, starts, {
    isRunActive() { return true; },
    async controlRun(runId, control) { controls.push({ runId, control }); }
  });
  const coordinator = createAutomationCoordinator({
    runManager,
    taskSourceFactory() { throw Object.assign(new Error("not logged in"), { code: "unconfigured" }); },
    cliLauncher: { async launch() { launches += 1; } }
  });

  await assert.rejects(
    coordinator.handoffToCodexCli(),
    /until the Agent selects or creates a Case/
  );

  assert.deepEqual(controls, []);
  assert.equal(launches, 0);
  assert.equal(store.automation.active_task.phase, "running");
  coordinator.dispose();
});

test("CLI handoff interrupts and resumes the same thread after trusted Case binding", async () => {
  const starts = [];
  const controls = [];
  const launches = [];
  let running = true;
  const store = recoveryStore({
    phase: "running",
    case_id: "CASE-20260810-005",
    case_status: "active",
    case_binding_source: "runtime_ledger",
    case_binding_run_id: "RUN-OLD",
    case_bound_at: "2026-08-10T00:00:00Z"
  });
  const runManager = fakeRunManager(store, starts, {
    isRunActive() { return running; },
    async controlRun(runId, control) {
      controls.push({ runId, control });
      running = false;
    }
  });
  const coordinator = createAutomationCoordinator({
    runManager,
    taskSourceFactory() { throw Object.assign(new Error("not logged in"), { code: "unconfigured" }); },
    cliLauncher: { async launch(input) { launches.push(input); } }
  });

  await coordinator.handoffToCodexCli();

  assert.deepEqual(controls, [{ runId: "RUN-OLD", control: { type: "interrupt" } }]);
  assert.equal(launches.length, 1);
  assert.equal(launches[0].threadId, "THREAD-PERSISTED");
  assert.match(launches[0].prompt, /CASE-20260810-005/);
  assert.equal(store.automation.active_task.phase, "cli_handoff");
  coordinator.dispose();
});

test("remote completion refuses an unbound task before contacting the task source", async () => {
  const starts = [];
  const store = recoveryStore({ phase: "recovery", closeout_status: "completed" });
  store.automation.recovery_items.push({
    id: "RECOVERY-completion-writeback-failed-t",
    type: "completion_writeback_failed",
    task_id: "t",
    project_id: "p",
    run_id: "RUN-OLD",
    actions: ["retry_complete", "mark_blocked"]
  });
  const runManager = fakeRunManager(store, starts);
  const coordinator = createAutomationCoordinator({
    runManager,
    taskSourceFactory() { throw new Error("Task source must not be contacted."); }
  });

  await coordinator.resolveRecovery({
    recoveryId: "RECOVERY-completion-writeback-failed-t",
    action: "retry_complete"
  });

  assert.equal(store.automation.recovery_items.some((item) => item.type === "case_binding_missing"), true);
  assert.notEqual(store.automation.active_task.phase, "completing");
  coordinator.dispose();
});

test("remote completion refuses a bound but unresolved canonical Case", async () => {
  const starts = [];
  const store = recoveryStore({
    phase: "recovery",
    case_id: "CASE-20260810-005",
    case_status: "active",
    case_binding_source: "runtime_ledger",
    case_binding_run_id: "RUN-OLD",
    case_bound_at: "2026-08-10T00:00:00Z",
    closeout_status: "completed"
  });
  store.automation.recovery_items.push({
    id: "RECOVERY-completion-writeback-failed-t",
    type: "completion_writeback_failed",
    task_id: "t",
    project_id: "p",
    run_id: "RUN-OLD",
    actions: ["retry_complete", "mark_blocked"]
  });
  const runManager = fakeRunManager(store, starts, {
    async getProjectCaseState() {
      return {
        location: "active",
        record: { id: "CASE-20260810-005", status: "active", case_resolution: { status: "unresolved" } }
      };
    }
  });
  const coordinator = createAutomationCoordinator({
    runManager,
    taskSourceFactory() { throw new Error("Task source must not be contacted."); }
  });

  await coordinator.resolveRecovery({
    recoveryId: "RECOVERY-completion-writeback-failed-t",
    action: "retry_complete"
  });

  assert.equal(store.automation.recovery_items.some((item) => item.type === "case_not_resolved"), true);
  assert.notEqual(store.automation.active_task.phase, "completing");
  coordinator.dispose();
});

test("a local pending candidate reaches readiness and submits one state action to Work", async () => {
  const store = recoveryStore();
  store.automation.active_task = null;
  store.automation.snapshot.source_status = "healthy";
  store.automation.snapshot.tasks[0] = {
    ...store.automation.snapshot.tasks[0],
    state: "pending",
    version: "v1"
  };
  let readinessChecks = 0;
  const coordinator = createAutomationCoordinator({
    runManager: fakeRunManager(store, []),
    setupReadinessPreflight: async () => { readinessChecks += 1; }
  });

  await coordinator.sync();
  await new Promise((resolve) => setTimeout(resolve, 20));

  assert.equal(readinessChecks, 1);
  assert.equal(store.automation.snapshot.tasks[0].state, "in_progress");
  coordinator.dispose();
});

test("a persistent claim version conflict becomes one global recovery instead of repeating skills readiness", async () => {
  const store = recoveryStore();
  store.automation.active_task = null;
  store.automation.snapshot.source_status = "healthy";
  store.automation.snapshot.tasks[0] = {
    ...store.automation.snapshot.tasks[0],
    state: "pending",
    version: "v1"
  };
  let readinessChecks = 0;
  const readinessRoots = [];
  const coordinator = createAutomationCoordinator({
    runManager: fakeRunManager(store, []),
    setupReadinessPreflight: async (projectRoot) => { readinessChecks += 1; readinessRoots.push(projectRoot); },
    workSync: {
      attachLocalProjection(current) { return current; },
      async reconcile() {},
      async updateTaskState() {
        throw Object.assign(new Error("Task version changed while claiming it."), { code: "version_conflict" });
      }
    }
  });

  await coordinator.sync();
  await coordinator.sync();

  assert.equal(readinessChecks, 1);
  assert.deepEqual(readinessRoots, ["/workspace"]);
  assert.equal(store.automation.recovery_items.length, 1);
  assert.equal(store.automation.recovery_items[0].type, "claim_failed");
  assert.equal(store.automation.recovery_items[0].freeze_scope, "global");
  assert.deepEqual(store.automation.recovery_items[0].actions, ["retry_sync"]);
  coordinator.dispose();
});

function recoveryStore(overrides = {}) {
  return {
    projects: [{ id: "local", path: "/workspace", name: "demo" }],
    settings: { task_source: {} },
    automation: {
      enabled: true,
      queue_paused: false,
      project_bindings: { p: "local" },
      project_participation: { p: true },
      snapshot: {
        source_status: "logged_out", errors: [], user: null, projects: [{ id: "p" }],
        tasks: [{ id: "t", project_id: "p", title: "todo", content: "finish", state: "in_progress" }]
      },
      active_task: {
        task_id: "t", project_id: "p", local_project_id: "local", local_project_path: "/workspace",
        task_title: "todo", phase: "recovery", case_id: "", case_status: "unbound", case_resolved_at: "",
        case_binding_source: "", case_binding_run_id: "", case_bound_at: "",
        closeout_status: "pending", closeout_completed_at: "", remote_completion_status: "pending",
        run_id: "RUN-OLD", session_id: "SESSION-T", thread_id: "THREAD-PERSISTED",
        started_at: "2026-08-10T00:00:00Z", ...overrides
      },
      attention_items: [], recovery_items: [], recent_completions: []
    }
  };
}

function closeoutResult(overrides = {}) {
  return {
    schema_version: "arckit-task-closeout-result/v1",
    status: "completed",
    outcome: "no_changes",
    summary: "Closeout completed.",
    evidence: [],
    commit_hash: "",
    error: "",
    ...overrides
  };
}

function unconfiguredCoordinator(runManager) {
  return createAutomationCoordinator({
    runManager,
    taskSourceFactory() { throw Object.assign(new Error("not logged in"), { code: "unconfigured" }); }
  });
}

function healthyTaskSourceFactory(store) {
  return () => ({
    async getAuthStatus() { return { authenticated: true, status: "authenticated" }; },
    async getCurrentUser() { return { id: "u", name: "tester" }; },
    async listProjects() { return [{ id: "p", current_user_id: "u" }]; },
    async listTasks() { return structuredClone(store.automation.snapshot.tasks); }
  });
}

function fakeRunManager(store, starts, overrides = {}) {
  let listener = () => {};
  return {
    onEvent(next) { listener = next; return () => { listener = () => {}; }; },
    async emitEvent(event) {
      listener(event);
      await new Promise((resolve) => setImmediate(resolve));
    },
    async readDesktopStore() { return structuredClone(store); },
    async updateDesktopStore(updater) { updater(store); return structuredClone(store); },
    async listProjects() { return store.projects; },
    async listRuns() { return [{ id: "RUN-OLD", project_id: "local", status: "completed", activity: {} }]; },
    isRunActive() { return false; },
    async getProjectCaseState() {
      return { location: "closed", record: { id: "CASE-20260809-001", status: "closed", updated_at: "2026-08-09T00:00:00Z", case_resolution: { status: "resolved" } } };
    },
    async listProjectCaseStates() { return []; },
    async listSessions() { return [{ id: "SESSION-T", task_id: "t" }]; },
    async createSession() { return { id: "SESSION-T" }; },
    async addMessage() {},
    async startRun(input) {
      starts.push(input);
      return { id: "RUN-CLOSEOUT", thread_id: input.threadId, project_id: "local", session_id: input.sessionId };
    },
    ...overrides
  };
}
