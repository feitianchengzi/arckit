import assert from "node:assert/strict";
import test from "node:test";
import { buildAutomationTask, buildQueue, createAutomationCoordinator } from "../src/automation-coordinator.mjs";

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

function fakeRunManager(store, starts) {
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
    }
  };
}
