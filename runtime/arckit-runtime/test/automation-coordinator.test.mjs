import assert from "node:assert/strict";
import { EventEmitter } from "node:events";
import test from "node:test";
import { buildQueue, compareQueueTasks, createAutomationCoordinator } from "../src/automation-coordinator.mjs";
import { normalizeStore } from "../src/desktop/desktop-store.mjs";

test("automation queue is deterministic across priority, confirmation time, project, and task id", () => {
  const items = [
    { id: "B", project_id: "2", priority: 10, state_changed_at: "2026-08-02T09:00:00Z" },
    { id: "A", project_id: "1", priority: 10, state_changed_at: "2026-08-02T09:00:00Z" },
    { id: "C", project_id: "1", priority: 20, state_changed_at: "2026-08-02T10:00:00Z" },
    { id: "D", project_id: "1", priority: 10, state_changed_at: "2026-08-02T08:00:00Z" }
  ];
  assert.deepEqual(items.sort(compareQueueTasks).map((item) => item.id), ["C", "D", "A", "B"]);
});

test("automation coordinator claims one eligible pending task and starts one Runtime", async () => {
  const events = new EventEmitter();
  let store = normalizeStore({
    projects: [{ id: "LOCAL-1", name: "Local Runtime", path: "/workspace/runtime" }],
    settings: { task_source: { enabled: true, base_url: "https://workshop.example", access_token: "token" } }
  });
  const runs = [];
  const messages = [];
  const runManager = {
    onEvent(listener) { events.on("event", listener); return () => events.off("event", listener); },
    async readDesktopStore() { return store; },
    async updateDesktopStore(updater) { store = normalizeStore(await updater(store) || store); return store; },
    async listProjects() { return store.projects; },
    async listRuns() { return runs; },
    async listSessions() { return [{ id: "SESSION-1" }]; },
    async addMessage(_projectId, message) { messages.push(message); return message; },
    async startRun(input) { const run = { id: "RUN-1", project_id: input.projectId, session_id: input.sessionId, status: "running" }; runs.push(run); return run; },
    async controlRun() { return { ok: true }; }
  };
  const remote = {
    task: { id: "TASK-1", project_id: "REMOTE-1", title: "Implement", content: "Implement automation", state: "pending", priority: 100, version: "v1", state_changed_at: "2026-08-02T08:00:00Z" }
  };
  const taskSource = {
    async getCurrentUser() { return { id: "USER-1", name: "Glare" }; },
    async listProjects() { return [{ id: "REMOTE-1", name: "Runtime" }]; },
    async listTasks() { return [remote.task]; },
    async getTask() { return remote.task; },
    async updateTask({ state }) { remote.task = { ...remote.task, state, version: state === "in_progress" ? "v2" : "v3" }; return remote.task; }
  };
  const coordinator = createAutomationCoordinator({ runManager, taskSourceFactory: () => taskSource, now: () => "2026-08-02T10:00:00.000Z" });

  await coordinator.sync();
  await coordinator.bindProject("REMOTE-1", "LOCAL-1");
  await coordinator.setProjectParticipation("REMOTE-1", true);
  await coordinator.setEnabled(true);

  const snapshot = await coordinator.getSnapshot();
  assert.equal(remote.task.state, "in_progress");
  assert.equal(runs.length, 1);
  assert.equal(messages.length, 1);
  assert.equal(snapshot.active_task.task_id, "TASK-1");
  assert.equal(snapshot.active_task.run_id, "RUN-1");
  assert.equal(snapshot.active_task.phase, "running");
  assert.equal(snapshot.queue.length, 0);

  events.emit("event", {
    type: "run.finished",
    runId: "RUN-1",
    status: "completed",
    result: {
      runtime_result: {
        ledger_stage: { writeback_required: true },
        loop_handoff: { status: "complete", next_responsibility: "none" }
      }
    },
    activity: { ledger_write_result: { parsed: { written: true } } }
  });
  await new Promise((resolve) => setTimeout(resolve, 20));
  const completedSnapshot = await coordinator.getSnapshot();
  assert.equal(remote.task.state, "completed");
  assert.equal(completedSnapshot.active_task, null);
  assert.equal(completedSnapshot.recent_completions[0].task_id, "TASK-1");
  coordinator.dispose();
});

test("buildQueue excludes unbound and non-participating project tasks", () => {
  const tasks = [
    { id: "1", project_id: "A", state: "pending", priority: 1 },
    { id: "2", project_id: "B", state: "pending", priority: 2 }
  ];
  const automation = {
    project_bindings: { A: "LOCAL-A" },
    project_participation: { A: true, B: true },
    snapshot: { errors: [] }
  };
  const queue = buildQueue(tasks, automation, new Map([["A", { name: "A" }], ["B", { name: "B" }]]), new Map([["LOCAL-A", { id: "LOCAL-A", path: "/a" }]]));
  assert.deepEqual(queue.map((task) => task.id), ["1"]);
  assert.equal(queue[0].queue_position, 1);
});

test("a project task sync failure preserves its snapshot and only excludes that project from dispatch", async () => {
  let store = normalizeStore({
    projects: [
      { id: "LOCAL-A", name: "Local A", path: "/workspace/a" },
      { id: "LOCAL-B", name: "Local B", path: "/workspace/b" }
    ],
    settings: { task_source: { enabled: true, base_url: "https://workshop.example", access_token: "token" } },
    automation: {
      project_bindings: { A: "LOCAL-A", B: "LOCAL-B" },
      project_participation: { A: true, B: true },
      snapshot: {
        source_status: "healthy",
        projects: [{ id: "A", name: "Project A" }, { id: "B", name: "Project B" }],
        tasks: [{ id: "STALE-A", project_id: "A", title: "Preserved", state: "pending", priority: 50, version: "v1" }]
      }
    }
  });
  const runManager = {
    onEvent() { return () => {}; },
    async readDesktopStore() { return store; },
    async updateDesktopStore(updater) { store = normalizeStore(await updater(store) || store); return store; },
    async listProjects() { return store.projects; },
    async listRuns() { return []; }
  };
  const taskSource = {
    async getCurrentUser() { return { id: "USER-1", name: "Glare" }; },
    async listProjects() { return [{ id: "A", name: "Project A" }, { id: "B", name: "Project B" }]; },
    async listTasks(projectId) {
      if (projectId === "A") throw new Error("Project A unavailable");
      return [{ id: "FRESH-B", project_id: "B", title: "Executable", state: "pending", priority: 100, version: "v2" }];
    }
  };
  const coordinator = createAutomationCoordinator({ runManager, taskSourceFactory: () => taskSource });

  const snapshot = await coordinator.sync({ dispatch: false });

  assert.equal(snapshot.source_status, "degraded");
  assert.deepEqual(snapshot.tasks.map((task) => task.id).sort(), ["FRESH-B", "STALE-A"]);
  assert.deepEqual(snapshot.queue.map((task) => task.id), ["FRESH-B"]);
  assert.equal(snapshot.projects.find((project) => project.id === "A").source_status, "error");
  assert.equal(snapshot.projects.find((project) => project.id === "B").eligible, true);
  coordinator.dispose();
});

test("a candidate version change schedules a fresh sync without deadlocking the current sync", async () => {
  let store = normalizeStore({
    projects: [{ id: "LOCAL-1", name: "Local", path: "/workspace/local" }],
    settings: { task_source: { enabled: true, base_url: "https://workshop.example", access_token: "token" } },
    automation: {
      enabled: true,
      project_bindings: { REMOTE: "LOCAL-1" },
      project_participation: { REMOTE: true }
    }
  });
  let listCount = 0;
  const runManager = {
    onEvent() { return () => {}; },
    async readDesktopStore() { return store; },
    async updateDesktopStore(updater) { store = normalizeStore(await updater(store) || store); return store; },
    async listProjects() { return store.projects; },
    async listRuns() { return []; }
  };
  const taskSource = {
    async getCurrentUser() { return { id: "USER-1", name: "Glare" }; },
    async listProjects() { return [{ id: "REMOTE", name: "Remote" }]; },
    async listTasks() {
      listCount += 1;
      return [{ id: "TASK-1", project_id: "REMOTE", title: "Changed", state: listCount === 1 ? "pending" : "cancelled", version: "v1" }];
    },
    async getTask() { return { id: "TASK-1", project_id: "REMOTE", state: "pending", version: "v2" }; }
  };
  const coordinator = createAutomationCoordinator({ runManager, taskSourceFactory: () => taskSource });

  await Promise.race([
    coordinator.sync(),
    new Promise((_, reject) => setTimeout(() => reject(new Error("sync deadlocked")), 250))
  ]);
  await new Promise((resolve) => setTimeout(resolve, 20));

  assert.equal(listCount >= 2, true);
  assert.equal((await coordinator.getSnapshot()).active_task, null);
  coordinator.dispose();
});

test("startup sync restores one in-progress task and freezes on multiple in-progress tasks", async () => {
  let store = normalizeStore({
    projects: [{ id: "LOCAL-1", name: "Local", path: "/workspace/local" }],
    settings: { task_source: { enabled: true, base_url: "https://workshop.example", access_token: "token" } },
    automation: {
      enabled: true,
      project_bindings: { REMOTE: "LOCAL-1" },
      project_participation: { REMOTE: true }
    }
  });
  let tasks = [{ id: "TASK-1", project_id: "REMOTE", title: "Resume", state: "in_progress", version: "v2" }];
  const runManager = {
    onEvent() { return () => {}; },
    async readDesktopStore() { return store; },
    async updateDesktopStore(updater) { store = normalizeStore(await updater(store) || store); return store; },
    async listProjects() { return store.projects; },
    async listRuns() { return []; }
  };
  const taskSource = {
    async getCurrentUser() { return { id: "USER-1", name: "Glare" }; },
    async listProjects() { return [{ id: "REMOTE", name: "Remote" }]; },
    async listTasks() { return tasks; }
  };
  const coordinator = createAutomationCoordinator({ runManager, taskSourceFactory: () => taskSource });

  const unique = await coordinator.sync({ dispatch: false });
  assert.equal(unique.active_task.task_id, "TASK-1");
  assert.equal(unique.active_task.local_project_path, "/workspace/local");
  assert.equal(unique.recovery_items[0].type, "discovered_in_progress");

  await runManager.updateDesktopStore((draft) => {
    draft.automation.active_task = null;
    draft.automation.recovery_items = [];
    return draft;
  });
  tasks = [
    { id: "TASK-1", project_id: "REMOTE", title: "First", state: "in_progress", version: "v2" },
    { id: "TASK-2", project_id: "REMOTE", title: "Second", state: "in_progress", version: "v3" }
  ];
  const multiple = await coordinator.sync({ dispatch: false });
  assert.equal(multiple.active_task, null);
  assert.equal(multiple.recovery_items[0].type, "multiple_active_tasks");
  assert.match(multiple.recovery_items[0].message, /TASK-1, TASK-2/);
  coordinator.dispose();
});

test("an external terminal state safely stops Runtime and can accept the server fact", async () => {
  const events = new EventEmitter();
  let store = normalizeStore({
    projects: [{ id: "LOCAL-1", name: "Local", path: "/workspace/local" }],
    settings: { task_source: { enabled: true, base_url: "https://workshop.example", access_token: "token" } },
    automation: {
      enabled: true,
      project_bindings: { REMOTE: "LOCAL-1" },
      project_participation: { REMOTE: true },
      active_task: {
        task_id: "TASK-1",
        project_id: "REMOTE",
        task_title: "Changed elsewhere",
        local_project_id: "LOCAL-1",
        local_project_path: "/workspace/local",
        server_version: "v1",
        phase: "running",
        run_id: "RUN-1"
      }
    }
  });
  const controls = [];
  const runManager = {
    onEvent(listener) { events.on("event", listener); return () => events.off("event", listener); },
    async readDesktopStore() { return store; },
    async updateDesktopStore(updater) { store = normalizeStore(await updater(store) || store); return store; },
    async listProjects() { return store.projects; },
    async listRuns() { return [{ id: "RUN-1", project_id: "LOCAL-1", status: "running" }]; },
    isRunActive(runId) { return runId === "RUN-1"; },
    async controlRun(runId, control) { controls.push({ runId, control }); }
  };
  const taskSource = {
    async getCurrentUser() { return { id: "USER-1", name: "Glare" }; },
    async listProjects() { return [{ id: "REMOTE", name: "Remote" }]; },
    async listTasks() { return [{ id: "TASK-1", project_id: "REMOTE", title: "Changed elsewhere", state: "cancelled", version: "v2" }]; }
  };
  const coordinator = createAutomationCoordinator({ runManager, taskSourceFactory: () => taskSource });

  const recoverySnapshot = await coordinator.sync({ dispatch: false });
  assert.deepEqual(controls, [{ runId: "RUN-1", control: { type: "interrupt" } }]);
  assert.equal(recoverySnapshot.active_task.phase, "recovery");
  assert.equal(recoverySnapshot.recovery_items[0].type, "external_state_change");
  assert.deepEqual(recoverySnapshot.recovery_items[0].actions, ["retry_sync", "accept_server_state"]);

  const accepted = await coordinator.resolveRecovery({
    recoveryId: recoverySnapshot.recovery_items[0].id,
    action: "accept_server_state"
  });
  assert.equal(accepted.active_task, null);
  assert.equal(accepted.recovery_items.length, 0);
  coordinator.dispose();
});
