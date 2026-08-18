import assert from "node:assert/strict";
import test from "node:test";
import { normalizeStore } from "../src/desktop/desktop-store.mjs";
import { createPlatformCoordinator } from "../src/platform-coordinator.mjs";

test("platform coordinator composes a simultaneous multi-product snapshot without changing automation participation", async () => {
  let store = normalizeStore({
    version: 9,
    automation: {
      project_bindings: { "11": "LOCAL-11", "12": "LOCAL-12" },
      project_participation: { "11": true, "12": false }
    }
  });
  const runManager = {
    readDesktopStore: async () => store,
    updateDesktopStore: async (updater) => { store = normalizeStore(await updater(store) || store); return store; }
  };
  const automationCoordinator = {
    getSnapshot: async () => ({
      source_status: "healthy",
      user: { id: "7", name: "glare" },
      projects: [
        { id: "11", local_project_id: "LOCAL-11", local_project_path: "/repo/one", participating: true, eligible: true },
        { id: "12", local_project_id: "LOCAL-12", local_project_path: "/repo/two", participating: false, eligible: false }
      ],
      queue: [{ id: "21", project_id: "11" }],
      attention_items: [], recovery_items: [], acceptance_feedback_queue: [], acceptance_feedback_counts: {}, health: { state: "ready" }
    })
  };
  const projects = [
    { id: "11", name: "Alpha", raw: { organization_id: 31, members: [{ user_id: 7, role: "owner", is_me: true }] } },
    { id: "12", name: "Beta", raw: { organization_id: 31, members: [{ user_id: 7, role: "member", is_me: true }] } }
  ];
  const platformSource = {
    listOrganizations: async () => [{ id: "31", name: "Team" }],
    listOrganizationMembers: async () => [{ id: "OM-31", user_id: "7", organization_id: "31", role: "owner" }],
    listProjects: async () => projects,
    listProjectMembers: async (projectId) => [{ id: `M-${projectId}`, user_id: "7", role: "owner" }],
    listProjectTasks: async (projectId) => [{ id: `T-${projectId}`, project_id: projectId, state: "pending" }],
    listFeedbackV1: async (projectId) => [{ id: `F-${projectId}`, project_id: projectId, title: "Feedback" }],
    listProjectTags: async (projectId) => [{ id: `TAG-${projectId}`, project_id: projectId, name: "platform" }]
  };
  const coordinator = createPlatformCoordinator({ runManager, automationCoordinator, platformSource, now: () => "2026-08-18T00:00:00.000Z" });

  const initial = await coordinator.getSnapshot({});
  assert.deepEqual(initial.active_workset.project_ids, ["11", "12"]);
  assert.deepEqual(initial.product_workspaces.map((item) => item.name), ["Alpha", "Beta"]);
  assert.deepEqual(initial.tasks.map((item) => item.project_name), ["Alpha", "Beta"]);
  assert.deepEqual(initial.feedback_v1.map((item) => item.project_name), ["Alpha", "Beta"]);
  assert.deepEqual(initial.tags.map((item) => item.project_name), ["Alpha", "Beta"]);
  assert.deepEqual(initial.organization_members.map((item) => item.organization_id), ["31"]);

  await coordinator.updateWorkset({ id: "WORKSET-DEFAULT", project_ids: ["12"] });
  assert.deepEqual(store.platform.worksets[0].project_ids, ["12"]);
  assert.deepEqual(store.automation.project_participation, { "11": true, "12": false });
  const single = await coordinator.getSnapshot({ sections: ["overview"] });
  assert.deepEqual(single.product_workspaces.map((item) => item.name), ["Beta"]);
  assert.deepEqual(single.automation.queue, [{ id: "21", project_id: "11" }]);
});

test("platform coordinator preserves partial product results and exposes section errors", async () => {
  let store = normalizeStore({ automation: { project_bindings: { "11": "LOCAL-11", "12": "LOCAL-12" } } });
  const coordinator = createPlatformCoordinator({
    runManager: {
      readDesktopStore: async () => store,
      updateDesktopStore: async (updater) => { store = normalizeStore(await updater(store) || store); return store; }
    },
    automationCoordinator: { getSnapshot: async () => ({ source_status: "healthy", projects: [], queue: [], attention_items: [], recovery_items: [] }) },
    platformSource: {
      listOrganizations: async () => [],
      listOrganizationMembers: async () => [],
      listProjects: async () => [{ id: "11", name: "Healthy" }, { id: "12", name: "Unavailable" }],
      listProjectMembers: async () => [],
      listProjectTasks: async (id) => id === "12" ? Promise.reject(Object.assign(new Error("service down"), { code: "network_error" })) : [{ id: "T-11", state: "pending" }],
      listFeedbackV1: async () => [],
      listProjectTags: async () => []
    }
  });

  const snapshot = await coordinator.getSnapshot({ sections: ["tasks"] });
  assert.equal(snapshot.source_status, "degraded");
  assert.equal(snapshot.tasks.length, 1);
  assert.deepEqual(snapshot.errors.map((item) => [item.section, item.project_id, item.code]), [["tasks", "12", "network_error"]]);
});

test("platform coordinator exposes bounded management actions and omits unsafe direct project-member add", async () => {
  const calls = [];
  const platformSource = new Proxy({
    updateProjectMember: async (projectId, input) => { calls.push(["member.update", projectId, input]); return { ok: true }; },
    createTask: async (input) => { calls.push(["task.create", input]); return { id: 42, state: "pending_review" }; },
    updateFeedbackV1: async (feedbackId, input) => { calls.push(["feedback.update", feedbackId, input]); return { id: feedbackId }; }
  }, { get: (target, key) => target[key] || (async () => []) });
  const coordinator = createPlatformCoordinator({
    runManager: { readDesktopStore: async () => normalizeStore({}), updateDesktopStore: async () => normalizeStore({}) },
    automationCoordinator: { getSnapshot: async () => ({ source_status: "healthy", projects: [] }) },
    platformSource
  });

  await coordinator.executeAction("project.member.update", { project_id: 11, target_user_id: 7, duty: "Design" });
  await coordinator.executeAction("feedback.to_task", { feedback_id: 51, project_id: 11, task_content: "Follow up", metadata: { priority: "P1" } });
  assert.deepEqual(calls[0], ["member.update", 11, { project_id: 11, target_user_id: 7, duty: "Design" }]);
  assert.deepEqual(calls[2], ["feedback.update", 51, { data: { priority: "P1", task_id: "42", task_state: "pending_review" } }]);
  await assert.rejects(coordinator.executeAction("project.member.add", { project_id: 11, target_user_id: 7 }), /Unsupported platform action/);
});
