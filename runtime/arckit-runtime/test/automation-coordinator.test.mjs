import assert from "node:assert/strict";
import test from "node:test";
import {
  buildAutomationTask,
  buildQueue,
  createAutomationCoordinator,
  extractAuthoritativeCaseBindingFromRun,
  isCanonicalCaseResolved
} from "../src/automation-coordinator.mjs";

test("automation task preserves only the remote human-authored intent", () => {
  assert.equal(buildAutomationTask({ title: "Fix login", content: "Repair and verify login." }), "Repair and verify login.");
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

function unconfiguredCoordinator(runManager) {
  return createAutomationCoordinator({
    runManager,
    taskSourceFactory() { throw Object.assign(new Error("not logged in"), { code: "unconfigured" }); }
  });
}

function fakeRunManager(store, starts, overrides = {}) {
  let listener = () => {};
  return {
    onEvent(next) { listener = next; return () => { listener = () => {}; }; },
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
