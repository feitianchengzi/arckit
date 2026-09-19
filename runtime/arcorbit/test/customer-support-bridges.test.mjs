import assert from "node:assert/strict";
import test from "node:test";
import {
  buildCustomerFeedbackSteerMessage,
  closeoutDraftTarget,
  continuationContext,
  createAutomationCoordinator
} from "../src/automation-coordinator.mjs";
import { normalizeTask } from "../src/task-source-adapter.mjs";

// 桥1：Task 携带客户反馈来源，normalizeTask 不得丢弃 source_feedback_id。
test("normalizeTask keeps the customer feedback source as a first-class field", () => {
  const task = normalizeTask({ id: 200, project_id: 11, state: "pending", content: "fix login", source_feedback_id: 5 });
  assert.equal(task.source_feedback_id, "5");
  const withoutSource = normalizeTask({ id: 201, project_id: 11, state: "pending", content: "internal todo" });
  assert.equal(withoutSource.source_feedback_id, "");
});

// 桥1：claim 后 active_task 贯通 customer_feedback_id，runtimeContext 提供受控来源引用。
test("claiming a customer-feedback task binds the feedback id onto the active execution", async () => {
  const starts = [];
  const store = claimableStore();
  const coordinator = createAutomationCoordinator({
    runManager: fakeRunManager(store, starts, { async preflightRun() {} }),
    setupReadinessPreflight: async () => {},
    taskSource: unusedTaskSource(),
    workSync: fakeClaimWorkSync(store)
  });

  await coordinator.maybeStartNext();

  assert.equal(store.automation.active_task?.customer_feedback_id, "5");
  assert.equal(starts.length, 1);
  const context = continuationContext(store.automation.active_task, store.automation.snapshot.tasks[0]);
  assert.equal(context.customer_feedback_ref, "customer-feedback:5");
  coordinator.dispose();
});

test("continuationContext omits the customer feedback ref for internal tasks", () => {
  const context = continuationContext({ task_id: "t" }, { content: "internal" });
  assert.equal("customer_feedback_ref" in context, false);
});

// 桥2：closeout 草稿回写只面向客户反馈，验收反馈（AF-*）不得误写客户草稿。
test("closeoutDraftTarget only resolves customer-feedback executions with a local project", () => {
  assert.deepEqual(closeoutDraftTarget({ customer_feedback_id: "5", local_project_id: "local", task_id: "200" }), {
    feedbackId: "5",
    projectId: "local"
  });
  assert.equal(closeoutDraftTarget({ feedback_id: "AF-1", local_project_id: "local", task_id: "t" }), null);
  assert.equal(closeoutDraftTarget({ customer_feedback_id: "5", local_project_id: "", task_id: "200" }), null);
  assert.equal(closeoutDraftTarget(null), null);
});

test("a completed customer-feedback closeout writes a pending_review draft for the customer", async () => {
  const drafts = [];
  const store = closeoutStore();
  const manager = fakeRunManager(store, []);
  const coordinator = createAutomationCoordinator({
    runManager: manager,
    taskSource: recordingTaskSource(drafts)
  });

  await manager.emitEvent({
    type: "run.finished",
    runId: "RUN-CLOSEOUT",
    status: "completed",
    result: {
      stop_reason: "completed",
      validation: { valid: true, issues: [] },
      closeout_result: {
        schema_version: "arckit-task-closeout-result/v1",
        status: "completed",
        outcome: "committed",
        summary: "完成登录修复",
        evidence: [],
        commit_hash: "abc123",
        modified_files: ["src/auth/login.ts"],
        error: ""
      }
    }
  });

  assert.equal(drafts.length, 1);
  assert.equal(drafts[0].path, "/feedbacks/5/drafts");
  assert.equal(drafts[0].options.body.task_id, "200");
  assert.ok(drafts[0].options.body.content.includes("完成登录修复"));
  assert.deepEqual(drafts[0].options.body.source_files, ["src/auth/login.ts"]);
  assert.equal(store.automation.active_task.closeout_status, "completed");
  coordinator.dispose();
});

// 桥3：客户追问经硬关联门控注入同一线程。
test("customer feedback steer message is built only from customer content", () => {
  assert.equal(buildCustomerFeedbackSteerMessage({ feedbackId: "5", content: "  进展如何？ " }), "[customer-follow-up feedback:5] 进展如何？");
  assert.equal(buildCustomerFeedbackSteerMessage({ feedbackId: "5", content: "   " }), "");
  assert.equal(buildCustomerFeedbackSteerMessage({ feedbackId: "", content: "进展如何？" }), "");
});

test("a customer follow-up steers the matching running execution only", async () => {
  const steers = [];
  const store = steerStore();
  const coordinator = createAutomationCoordinator({
    runManager: fakeRunManager(store, [], {
      async getRun() { return { id: "RUN-ACTIVE", status: "running" }; },
      async controlRun(runId, input) { steers.push({ runId, input }); }
    })
  });

  const steered = await coordinator.handleCustomerFeedbackEvent({
    feedback_id: 5,
    project_id: "p",
    sender_type: "customer",
    content: "登录修复进展如何？"
  });
  assert.equal(steered.matched, true);
  assert.equal(steered.steered, true);
  assert.equal(steers.length, 1);
  assert.equal(steers[0].runId, "RUN-ACTIVE");
  assert.equal(steers[0].input.type, "steer");
  assert.equal(steers[0].input.message, "[customer-follow-up feedback:5] 登录修复进展如何？");

  const developerEcho = await coordinator.handleCustomerFeedbackEvent({
    feedback_id: 5,
    project_id: "p",
    sender_type: "developer",
    content: "内部备注"
  });
  assert.equal(developerEcho.matched, false);
  assert.equal(developerEcho.steered, false);

  const otherFeedback = await coordinator.handleCustomerFeedbackEvent({
    feedback_id: 999,
    project_id: "p",
    sender_type: "customer",
    content: "其他反馈"
  });
  assert.equal(otherFeedback.reason, "no_active_case");

  const projectMismatch = await coordinator.handleCustomerFeedbackEvent({
    feedback_id: 5,
    project_id: "other-project",
    sender_type: "customer",
    content: "项目不匹配"
  });
  assert.equal(projectMismatch.reason, "project_mismatch");
  assert.equal(steers.length, 1);
  coordinator.dispose();
});

test("a customer follow-up never steers when the matching run is not running", async () => {
  const steers = [];
  const coordinator = createAutomationCoordinator({
    runManager: fakeRunManager(steerStore(), [], {
      async getRun() { return { id: "RUN-ACTIVE", status: "attention" }; },
      async controlRun(runId, input) { steers.push({ runId, input }); }
    })
  });

  const result = await coordinator.handleCustomerFeedbackEvent({
    feedback_id: 5,
    project_id: "p",
    sender_type: "customer",
    content: "进展如何？"
  });
  assert.equal(result.matched, true);
  assert.equal(result.steered, false);
  assert.equal(result.reason, "run_not_running");
  assert.equal(steers.length, 0);
  coordinator.dispose();
});

function unusedTaskSource() {
  return { async requestV2() { throw new Error("task source must not be called during claim"); } };
}

function recordingTaskSource(drafts) {
  return {
    async requestV2(path, options = {}) {
      drafts.push({ path, options });
      return { code: 0, data: { message_id: 1, state: "pending_review" } };
    }
  };
}

function claimableStore() {
  return {
    projects: [{ id: "local", path: "/workspace", name: "demo" }],
    settings: { task_source: {} },
    automation: {
      enabled: true,
      queue_paused: false,
      project_bindings: { p: "local" },
      project_participation: { p: true },
      snapshot: {
        source_status: "healthy",
        errors: [],
        user: { id: "u", name: "tester" },
        projects: [{ id: "p", current_user_role: "owner" }],
        tasks: [{
          id: "200",
          project_id: "p",
          title: "fix login",
          content: "修复登录问题",
          state: "pending",
          priority: 2,
          confirmed_at: "2026-09-01T00:00:00Z",
          source_feedback_id: "5"
        }]
      },
      active_executions: {},
      active_task: null,
      selected_execution_id: "",
      acceptance_feedback_items: [],
      attention_items: [],
      recovery_items: [],
      recent_completions: []
    }
  };
}

function fakeClaimWorkSync(store) {
  return {
    attachLocalProjection(current) { return current; },
    async reconcile() {},
    async refreshProject() {},
    async updateTaskState({ taskId, state }) {
      const task = store.automation.snapshot.tasks.find((item) => String(item.id) === String(taskId));
      const claimed = { ...task, state };
      store.automation.snapshot.tasks = store.automation.snapshot.tasks.map((item) => (
        String(item.id) === String(taskId) ? claimed : item
      ));
      return claimed;
    }
  };
}

function closeoutStore() {
  return {
    projects: [{ id: "local", path: "/workspace", name: "demo" }],
    settings: { task_source: {} },
    automation: {
      enabled: true,
      queue_paused: false,
      project_bindings: { p: "local" },
      project_participation: { p: true },
      snapshot: {
        source_status: "logged_out",
        errors: [],
        user: null,
        projects: [{ id: "p" }],
        tasks: [{ id: "200", project_id: "p", title: "fix login", content: "修复登录问题", state: "in_progress", source_feedback_id: "5" }]
      },
      active_task: {
        task_id: "200",
        project_id: "p",
        customer_feedback_id: "5",
        local_project_id: "local",
        local_project_path: "/workspace",
        task_title: "fix login",
        phase: "closeout_running",
        case_id: "CASE-20260918-001",
        case_status: "resolved",
        case_binding_source: "runtime_ledger",
        case_binding_run_id: "RUN-ACTIVE",
        case_bound_at: "2026-09-18T00:00:00Z",
        case_resolved_at: "2026-09-18T00:10:00Z",
        closeout_status: "running",
        closeout_completed_at: "",
        remote_completion_status: "pending",
        run_id: "RUN-CLOSEOUT",
        session_id: "SESSION-T",
        thread_id: "THREAD-PERSISTED",
        started_at: "2026-09-18T00:00:00Z",
        intervention_kind: "",
        intervention_reason: "",
        intervention_resume_condition: "",
        intervention_started_at: ""
      },
      active_executions: {},
      selected_execution_id: "",
      acceptance_feedback_items: [],
      attention_items: [],
      recovery_items: [],
      recent_completions: []
    }
  };
}

function steerStore() {
  const store = closeoutStore();
  store.automation.active_task = {
    ...store.automation.active_task,
    phase: "running",
    closeout_status: "pending",
    run_id: "RUN-ACTIVE"
  };
  store.automation.active_executions = {
    local: {
      execution_id: "EXEC-1",
      workspace_key: "local",
      task_id: "200",
      project_id: "p",
      customer_feedback_id: "5",
      local_project_id: "local",
      run_id: "RUN-ACTIVE",
      phase: "running"
    }
  };
  return store;
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
      return { location: "closed", record: { id: "CASE-20260918-001", status: "closed", updated_at: "2026-09-18T00:00:00Z", case_resolution: { status: "resolved" } } };
    },
    async listProjectCaseStates() { return []; },
    async listSessions() { return [{ id: "SESSION-T", task_id: "200" }]; },
    async createSession() { return { id: "SESSION-T" }; },
    async addMessage() {},
    async startRun(input) {
      starts.push(input);
      return { id: "RUN-STARTED", thread_id: input.threadId, project_id: "local", session_id: input.sessionId };
    },
    ...overrides
  };
}
