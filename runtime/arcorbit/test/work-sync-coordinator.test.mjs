import assert from "node:assert/strict";
import test from "node:test";
import { DESKTOP_STORE_VERSION, normalizeStore } from "../src/desktop/desktop-store.mjs";
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

test("Automation keeps a Catalog project visible when its first task sync fails", async () => {
  const state = createState({
    platform: {
      active_workset_id: "WORKSET-DEFAULT",
      worksets: [{ id: "WORKSET-DEFAULT", name: "Main", project_ids: ["12"] }]
    }
  });
  const projects = [{ id: "12", name: "Atlas", current_user_id: "7" }];
  const platformSource = {
    async listProjectTasks() { throw Object.assign(new Error("tasks forbidden"), { code: "forbidden", status: 403 }); },
    async listProjectTags() { return []; },
    async updateTask() { throw new Error("unused"); }
  };
  const coordinator = createWorkSyncCoordinator({
    runManager: state.runManager,
    taskSource: authenticatedTaskSource(projects, platformSource),
    platformSource
  });

  await coordinator.reconcile();
  const automation = await coordinator.getSnapshot({ automationOnly: true });

  assert.deepEqual(automation.projects.map((project) => project.id), ["12"]);
  assert.deepEqual(automation.tasks, []);
  assert.equal(automation.project_states["12"].trusted, false);
  assert.deepEqual(automation.errors.map((error) => [error.project_id, error.section, error.code]), [["12", "tasks", "forbidden"]]);
  assert.equal(state.store.platform.task_sync.rehydration_required, true);
});

test("a tag failure does not invalidate confirmed project tasks", async () => {
  const state = createState({
    platform: {
      active_workset_id: "WORKSET-DEFAULT",
      worksets: [{ id: "WORKSET-DEFAULT", name: "Main", project_ids: ["12"] }]
    }
  });
  const projects = [{ id: "12", name: "Atlas", current_user_id: "7" }];
  const platformSource = {
    async listProjectTasks() { return [{ id: "T-12", project_id: "12", executor_id: "7", state: "pending", content: "ready" }]; },
    async listProjectTags() { throw Object.assign(new Error("tags forbidden"), { code: "forbidden", status: 403 }); },
    async updateTask() { throw new Error("unused"); }
  };
  const coordinator = createWorkSyncCoordinator({
    runManager: state.runManager,
    taskSource: authenticatedTaskSource(projects, platformSource),
    platformSource
  });

  await coordinator.reconcile();
  const automation = await coordinator.getSnapshot({ automationOnly: true });

  assert.deepEqual(automation.tasks.map((task) => task.id), ["T-12"]);
  assert.equal(automation.project_states["12"].trusted, true);
  assert.deepEqual(automation.errors.map((error) => [error.section, error.code]), [["tags", "forbidden"]]);
  assert.equal(state.store.platform.task_sync.rehydration_required, false);
});

test("the first v16 reconciliation rehydrates a v15 store without changing bindings or participation", async () => {
  const state = createState({
    version: 15,
    projects: [{ id: "LOCAL-12", name: "Atlas local", path: "/workspace/atlas" }],
    automation: {
      project_bindings: { "12": "LOCAL-12" },
      project_participation: { "12": true }
    },
    platform: {
      active_workset_id: "WORKSET-DEFAULT",
      worksets: [{ id: "WORKSET-DEFAULT", name: "Main", project_ids: ["12"] }],
      task_sync: {
        identity_key: "7",
        user: { id: "7" },
        project_catalog: [{ id: "12", name: "Old Atlas", current_user_id: "7" }],
        projects: {
          "12": {
            project: { id: "12", name: "Old Atlas", current_user_id: "7" },
            tasks: [{ id: "OLD", project_id: "12", executor_id: "7", state: "pending" }],
            tags: [],
            trusted: true
          }
        },
        source_status: "healthy"
      }
    }
  });
  const projects = [{ id: "12", name: "Atlas", current_user_id: "7" }];
  const platformSource = {
    async listProjectTasks() { return [{ id: "CURRENT", project_id: "12", executor_id: "7", state: "pending" }]; },
    async listProjectTags() { return []; },
    async updateTask() { throw new Error("unused"); }
  };
  const coordinator = createWorkSyncCoordinator({
    runManager: state.runManager,
    taskSource: authenticatedTaskSource(projects, platformSource),
    platformSource
  });

  assert.equal(state.store.platform.task_sync.projects["12"].trusted, false);
  await coordinator.reconcile({ reason: "startup-rehydration" });
  const automation = await coordinator.getSnapshot({ automationOnly: true });

  assert.equal(state.store.version, DESKTOP_STORE_VERSION);
  assert.deepEqual(state.store.platform.worksets[0].project_ids, ["12"]);
  assert.deepEqual(state.store.automation.project_bindings, { "12": "LOCAL-12" });
  assert.deepEqual(state.store.automation.project_participation, { "12": true });
  assert.equal(state.store.platform.task_sync.rehydration_required, false);
  assert.deepEqual(automation.projects.map((project) => project.name), ["Atlas"]);
  assert.deepEqual(automation.tasks.map((task) => task.id), ["CURRENT"]);
});

test("a reconcile demand added during an in-flight pass is processed by a following generation", async () => {
  const state = createState({
    platform: {
      active_workset_id: "WORKSET-DEFAULT",
      worksets: [{ id: "WORKSET-DEFAULT", name: "Main", project_ids: ["1"] }]
    }
  });
  const projects = [
    { id: "1", name: "One", current_user_id: "7" },
    { id: "2", name: "Two", current_user_id: "7" }
  ];
  let releaseFirst;
  let firstStarted;
  const started = new Promise((resolve) => { firstStarted = resolve; });
  const calls = [];
  const platformSource = {
    async listProjectTasks(projectId) {
      calls.push(String(projectId));
      if (String(projectId) === "1" && calls.length === 1) {
        firstStarted();
        await new Promise((resolve) => { releaseFirst = resolve; });
      }
      return [{ id: `T-${projectId}`, project_id: String(projectId), executor_id: "7", state: "pending" }];
    },
    async listProjectTags() { return []; },
    async updateTask() { throw new Error("unused"); }
  };
  const coordinator = createWorkSyncCoordinator({
    runManager: state.runManager,
    taskSource: authenticatedTaskSource(projects, platformSource),
    platformSource
  });

  const first = coordinator.reconcile({ reason: "startup" });
  await started;
  await state.runManager.updateDesktopStore((store) => {
    store.platform.worksets[0].project_ids.push("2");
    return store;
  });
  const second = coordinator.reconcile({ reason: "workset-changed" });
  releaseFirst();
  await Promise.all([first, second]);

  assert.equal(calls.filter((id) => id === "1").length, 2);
  assert.equal(calls.filter((id) => id === "2").length, 1);
  assert.deepEqual((await coordinator.getSnapshot({ automationOnly: true })).projects.map((project) => project.id), ["1", "2"]);
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

test("task product replacement confirms the target before deleting the source and copies only approved fields", async () => {
  const state = createState(replacementStore());
  const calls = [];
  const remote = {
    "1": [{ ...state.store.platform.task_sync.projects["1"].tasks[0] }],
    "2": []
  };
  const platformSource = {
    async listProjectTasks(projectId) { return remote[String(projectId)].map((task) => ({ ...task })); },
    async listProjectTags() { return []; },
    async createTask(input) {
      calls.push(["create", { ...input }]);
      const task = { id: "T-2", project_id: "2", content: input.content, state: input.state, priority: input.priority, executor_id: input.executor_id, father_id: input.father_id, tags: input.tags };
      remote["2"].push(task);
      return task;
    },
    async deleteTask(taskId) {
      calls.push(["delete", String(taskId)]);
      remote["1"] = remote["1"].filter((task) => String(task.id) !== String(taskId));
      return { id: String(taskId), deleted: true };
    }
  };
  const coordinator = createWorkSyncCoordinator({
    runManager: state.runManager,
    taskSource: authenticatedTaskSource(replacementProjects(), platformSource),
    platformSource,
    now: () => "2026-08-25T12:00:00.000Z"
  });

  const result = await coordinator.replaceTaskProject({
    source_task_id: "T-1",
    target_project_id: "2",
    content: "copied body",
    state: "completed",
    priority: "2",
    executor_id: "9",
    father_id: "P-2",
    tags: "TAG-2",
    attachments: ["must-not-copy"],
    thread_id: "must-not-copy"
  });

  assert.equal(result.status, "completed");
  assert.equal(result.outcome, "source_deleted");
  assert.deepEqual(calls, [
    ["create", { project_id: "2", content: "copied body", state: "completed", priority: "2", executor_id: "9", father_id: "P-2", tags: "TAG-2" }],
    ["delete", "T-1"]
  ]);
  assert.equal(state.store.platform.task_sync.projects["1"].tasks.some((task) => task.id === "T-1"), false);
  assert.equal(state.store.platform.task_sync.projects["2"].tasks.some((task) => task.id === "T-2"), true);
  assert.deepEqual(state.store.platform.task_sync.task_replacements, {});
});

test("task product replacement never deletes the source when target creation fails", async () => {
  const state = createState(replacementStore());
  let deleteCalls = 0;
  const platformSource = {
    async listProjectTasks(projectId) { return state.store.platform.task_sync.projects[String(projectId)].tasks; },
    async listProjectTags() { return []; },
    async createTask() { throw new Error("target create failed"); },
    async deleteTask() { deleteCalls += 1; }
  };
  const coordinator = createWorkSyncCoordinator({
    runManager: state.runManager,
    taskSource: authenticatedTaskSource(replacementProjects(), platformSource),
    platformSource
  });

  await assert.rejects(coordinator.replaceTaskProject({ source_task_id: "T-1", target_project_id: "2" }), /target create failed/);

  assert.equal(deleteCalls, 0);
  assert.equal(state.store.platform.task_sync.projects["1"].tasks.some((task) => task.id === "T-1"), true);
  assert.deepEqual(state.store.platform.task_sync.task_replacements, {});
});

test("task product replacement persists a delete failure and retries without creating another target", async () => {
  const state = createState(replacementStore());
  let createCalls = 0;
  let deleteCalls = 0;
  let allowDelete = false;
  const remote = {
    "1": [{ ...state.store.platform.task_sync.projects["1"].tasks[0] }],
    "2": []
  };
  const platformSource = {
    async listProjectTasks(projectId) { return remote[String(projectId)].map((task) => ({ ...task })); },
    async listProjectTags() { return []; },
    async createTask(input) {
      createCalls += 1;
      const task = { id: "T-2", project_id: "2", content: input.content, state: input.state };
      remote["2"].push(task);
      return task;
    },
    async deleteTask(taskId) {
      deleteCalls += 1;
      if (!allowDelete) throw Object.assign(new Error("source delete failed"), { code: "network_error" });
      remote["1"] = remote["1"].filter((task) => String(task.id) !== String(taskId));
      return { id: String(taskId), deleted: true };
    }
  };
  let coordinator = createWorkSyncCoordinator({
    runManager: state.runManager,
    taskSource: authenticatedTaskSource(replacementProjects(), platformSource),
    platformSource
  });

  const partial = await coordinator.replaceTaskProject({ source_task_id: "T-1", target_project_id: "2" });
  assert.equal(partial.status, "partial");
  assert.equal(partial.partial_result.target_task_id, "T-2");
  assert.equal(createCalls, 1);
  assert.equal(state.store.platform.task_sync.task_replacements["1:T-1"].status, "source_delete_failed");

  coordinator = createWorkSyncCoordinator({
    runManager: state.runManager,
    taskSource: authenticatedTaskSource(replacementProjects(), platformSource),
    platformSource
  });
  assert.equal((await coordinator.replaceTaskProject({ source_task_id: "T-1", target_project_id: "2" })).status, "partial");
  assert.equal(createCalls, 1);
  allowDelete = true;
  const recovered = await coordinator.retryTaskProjectReplacement({ replacement_id: "1:T-1" });

  assert.equal(recovered.status, "completed");
  assert.equal(createCalls, 1);
  assert.equal(deleteCalls, 2);
  assert.deepEqual(state.store.platform.task_sync.task_replacements, {});
});

test("task product replacement can explicitly keep both confirmed tasks", async () => {
  const state = createState(replacementStore());
  state.store.platform.task_sync.task_replacements["1:T-1"] = {
    id: "1:T-1", status: "source_delete_failed", source_task_id: "T-1", source_project_id: "1",
    target_task_id: "T-2", target_project_id: "2", error: "offline"
  };
  const platformSource = {
    async listProjectTasks(projectId) { return state.store.platform.task_sync.projects[String(projectId)].tasks; },
    async listProjectTags() { return []; }
  };
  const coordinator = createWorkSyncCoordinator({
    runManager: state.runManager,
    taskSource: authenticatedTaskSource(replacementProjects(), platformSource),
    platformSource
  });

  const result = await coordinator.keepTaskProjectReplacement({ replacement_id: "1:T-1" });

  assert.equal(result.outcome, "kept_both");
  assert.deepEqual(state.store.platform.task_sync.task_replacements, {});
  assert.equal(state.store.platform.task_sync.projects["1"].tasks.some((task) => task.id === "T-1"), true);
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

function replacementProjects() {
  return [
    { id: "1", name: "Source", current_user_id: "7" },
    { id: "2", name: "Target", current_user_id: "7" }
  ];
}

function replacementStore() {
  return {
    platform: {
      active_workset_id: "WORKSET-DEFAULT",
      worksets: [{ id: "WORKSET-DEFAULT", name: "Main", project_ids: ["1", "2"] }],
      task_sync: {
        identity_key: "7",
        user: { id: "7" },
        project_catalog: replacementProjects(),
        source_status: "healthy",
        projects: {
          "1": { project: replacementProjects()[0], tasks: [{ id: "T-1", project_id: "1", executor_id: "7", content: "source body", state: "pending", comments: ["not copied"] }], tags: [], trusted: true, revision: 1 },
          "2": { project: replacementProjects()[1], tasks: [], tags: [], trusted: true, revision: 1 }
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
  let store = normalizeStore({ version: DESKTOP_STORE_VERSION, ...(input || {}) });
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
