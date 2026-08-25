import assert from "node:assert/strict";
import test from "node:test";
import { normalizeStore } from "../src/desktop/desktop-store.mjs";
import { createWorkSyncCoordinator } from "../src/work-sync-coordinator.mjs";

test("Work Sync reconciles the Workset, Automation participation, and active-task demand union", async () => {
  const calls = [];
  const state = createState({
    platform: {
      active_workset_id: "WORKSET-DEFAULT",
      worksets: [{ id: "WORKSET-DEFAULT", name: "Main", project_ids: ["1"] }]
    },
    automation: {
      project_participation: { "2": true, "3": false },
      active_task: { task_id: "T-3", project_id: "3" }
    }
  });
  const projects = [
    { id: "1", name: "Work", current_user_id: "7" },
    { id: "2", name: "Automation", current_user_id: "7" },
    { id: "3", name: "Active", current_user_id: "7" },
    { id: "4", name: "Unused", current_user_id: "7" }
  ];
  const platformSource = {
    async listProjectTasks(projectId) {
      calls.push(["tasks", String(projectId)]);
      return [
        { id: `ME-${projectId}`, project_id: String(projectId), executor_id: "7", state: "pending", content: "mine" },
        { id: `OTHER-${projectId}`, project_id: String(projectId), executor_id: "8", state: "pending", content: "other" }
      ];
    },
    async listProjectTags(projectId) { calls.push(["tags", String(projectId)]); return []; },
    async updateTask() { throw new Error("unused"); }
  };
  const coordinator = createWorkSyncCoordinator({
    runManager: state.runManager,
    taskSource: authenticatedTaskSource(projects, platformSource),
    platformSource,
    now: () => "2026-08-25T00:00:00.000Z"
  });

  await coordinator.reconcile();

  assert.deepEqual(calls.map((call) => call.join(":")), ["tasks:1", "tags:1", "tasks:2", "tags:2", "tasks:3", "tags:3"]);
  const work = await coordinator.getSnapshot();
  const automation = await coordinator.getSnapshot({ automationOnly: true });
  assert.equal(work.tasks.length, 6);
  assert.deepEqual(automation.tasks.map((task) => task.id), ["ME-1", "ME-2", "ME-3"]);
  assert.equal(state.store.automation.snapshot, undefined);
  assert.equal(state.store.automation.realtime, undefined);
});

test("Work Sync keeps the local task state unchanged when a mutation fails", async () => {
  const state = createState(preloadedStore({ state: "pending" }));
  const platformSource = {
    async listProjectTasks() { return state.store.platform.task_sync.projects["1"].tasks; },
    async listProjectTags() { return []; },
    async updateTask() { throw Object.assign(new Error("conflict"), { code: "version_conflict", status: 409 }); }
  };
  const coordinator = createWorkSyncCoordinator({
    runManager: state.runManager,
    taskSource: authenticatedTaskSource([{ id: "1", current_user_id: "7" }], platformSource),
    platformSource
  });

  await assert.rejects(coordinator.updateTaskState({ taskId: "T-1", state: "in_progress", expectedState: "pending" }), /conflict/);

  assert.equal(state.store.platform.task_sync.projects["1"].tasks[0].state, "pending");
  assert.equal(state.store.platform.task_sync.source_status, "degraded");
  assert.equal(state.store.platform.task_sync.errors[0].code, "version_conflict");
});

test("Work Sync publishes a successful mutation only after the project projection confirms it", async () => {
  const state = createState(preloadedStore({ state: "pending" }));
  let remoteState = "pending";
  const platformSource = {
    async listProjectTasks() {
      return [{ ...state.store.platform.task_sync.projects["1"].tasks[0], state: remoteState }];
    },
    async listProjectTags() { return []; },
    async updateTask(taskId, input) {
      remoteState = input.state;
      return { id: taskId, project_id: "1", executor_id: "7", content: "todo", state: remoteState };
    }
  };
  const coordinator = createWorkSyncCoordinator({
    runManager: state.runManager,
    taskSource: authenticatedTaskSource([{ id: "1", current_user_id: "7" }], platformSource),
    platformSource
  });

  const updated = await coordinator.updateTaskState({ taskId: "T-1", state: "in_progress", expectedState: "pending" });

  assert.equal(updated.state, "in_progress");
  assert.equal(state.store.platform.task_sync.projects["1"].tasks[0].state, "in_progress");
  assert.equal(state.store.platform.task_sync.projects["1"].trusted, true);
});

test("Work Sync submits combined field and state edits once and publishes only the confirmed response", async () => {
  const state = createState(preloadedStore({ state: "pending", content: "before" }));
  const calls = [];
  let remoteTask = { ...state.store.platform.task_sync.projects["1"].tasks[0] };
  const platformSource = {
    async listProjectTasks() { return [remoteTask]; },
    async listProjectTags() { return []; },
    async updateTask(taskId, input) {
      calls.push([taskId, input]);
      remoteTask = { ...remoteTask, ...input };
      return remoteTask;
    }
  };
  const coordinator = createWorkSyncCoordinator({
    runManager: state.runManager,
    taskSource: authenticatedTaskSource([{ id: "1", current_user_id: "7" }], platformSource),
    platformSource
  });

  const updated = await coordinator.updateTask("T-1", { content: "after", state: "completed" }, { expectedState: "pending" });

  assert.deepEqual(calls, [["T-1", { content: "after", state: "completed" }]]);
  assert.equal(updated.content, "after");
  assert.equal(updated.state, "completed");
  assert.equal(state.store.platform.task_sync.projects["1"].tasks[0].state, "completed");
});

test("a successful Work refresh clears the previous project degradation", async () => {
  const input = preloadedStore({ state: "pending" });
  input.platform.task_sync.source_status = "degraded";
  input.platform.task_sync.errors = [{ code: "network_error", message: "offline", project_id: "1" }];
  const state = createState(input);
  const platformSource = {
    async listProjectTasks() { return state.store.platform.task_sync.projects["1"].tasks; },
    async listProjectTags() { return []; },
    async updateTask() { throw new Error("unused"); }
  };
  const coordinator = createWorkSyncCoordinator({
    runManager: state.runManager,
    taskSource: authenticatedTaskSource([{ id: "1", current_user_id: "7" }], platformSource),
    platformSource
  });

  await coordinator.refreshProject("1");

  assert.equal(state.store.platform.task_sync.source_status, "healthy");
  assert.deepEqual(state.store.platform.task_sync.errors, []);
});

test("a successful remote create is not reported as failed when Work reconciliation degrades", async () => {
  const state = createState(preloadedStore({ state: "pending" }));
  let createCalls = 0;
  const platformSource = {
    async listProjectTasks() { throw Object.assign(new Error("offline"), { code: "network_error" }); },
    async listProjectTags() { return []; },
    async createTask(input) {
      createCalls += 1;
      return { id: "T-2", project_id: input.project_id, executor_id: "7", content: input.content, state: "pending" };
    },
    async updateTask() { throw new Error("unused"); }
  };
  const coordinator = createWorkSyncCoordinator({
    runManager: state.runManager,
    taskSource: authenticatedTaskSource([{ id: "1", current_user_id: "7" }], platformSource),
    platformSource
  });

  const created = await coordinator.createTask({ project_id: "1", content: "new todo" });

  assert.equal(createCalls, 1);
  assert.equal(created.id, "T-2");
  assert.equal(state.store.platform.task_sync.projects["1"].tasks.some((task) => task.id === "T-2"), true);
  assert.equal(state.store.platform.task_sync.source_status, "degraded");
});

test("a late reconciliation result cannot restore a cleared Work identity", async () => {
  const state = createState({
    platform: { active_workset_id: "WORKSET-DEFAULT", worksets: [{ id: "WORKSET-DEFAULT", name: "Main", project_ids: ["1"] }] }
  });
  let releaseProjects;
  const projects = new Promise((resolve) => { releaseProjects = resolve; });
  const platformSource = {
    async listProjectTasks() { return [{ id: "LATE", project_id: "1", executor_id: "7", state: "pending" }]; },
    async listProjectTags() { return []; },
    async updateTask() {}
  };
  const taskSource = authenticatedTaskSource([], platformSource);
  taskSource.listProjects = async () => projects;
  const coordinator = createWorkSyncCoordinator({ runManager: state.runManager, taskSource, platformSource });

  const pending = coordinator.reconcile();
  await new Promise((resolve) => setImmediate(resolve));
  await coordinator.clearSession();
  releaseProjects([{ id: "1", current_user_id: "7" }]);
  await pending;

  assert.equal(state.store.platform.task_sync.source_status, "logged_out");
  assert.deepEqual(state.store.platform.task_sync.projects, {});
  assert.equal(state.store.platform.task_sync.user, null);
});

function preloadedStore(task) {
  return {
    platform: {
      active_workset_id: "WORKSET-DEFAULT",
      worksets: [{ id: "WORKSET-DEFAULT", name: "Main", project_ids: ["1"] }],
      task_sync: {
        identity_key: "7",
        user: { id: "7" },
        project_catalog: [{ id: "1", name: "Main", current_user_id: "7" }],
        source_status: "healthy",
        projects: {
          "1": {
            project: { id: "1", name: "Main", current_user_id: "7" },
            tasks: [{ id: "T-1", project_id: "1", executor_id: "7", content: "todo", ...task }],
            tags: [], trusted: true, revision: 1
          }
        }
      }
    }
  };
}

function authenticatedTaskSource(projects, platform) {
  return {
    platform,
    async getAuthStatus() { return { authenticated: true, status: "authenticated", masked_identity: "user" }; },
    async getCurrentUser() { return { id: "7", name: "tester" }; },
    async listProjects() { return projects; }
  };
}

function createState(input) {
  let store = normalizeStore(input || {});
  return {
    get store() { return store; },
    runManager: {
      async readDesktopStore() { return structuredClone(store); },
      async updateDesktopStore(updater) {
        store = normalizeStore(await updater(structuredClone(store)) || store);
        return structuredClone(store);
      }
    }
  };
}
