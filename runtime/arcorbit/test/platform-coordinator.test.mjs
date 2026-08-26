import assert from "node:assert/strict";
import test from "node:test";
import { normalizeStore } from "../src/desktop/desktop-store.mjs";
import { createPlatformCoordinator as createProductionPlatformCoordinator } from "../src/platform-coordinator.mjs";

function createPlatformCoordinator(options) {
  return createProductionPlatformCoordinator({
    ...options,
    workSync: options.workSync || fixtureWorkSync(options.platformSource)
  });
}

function fixtureWorkSync(platformSource) {
  return {
    async getSnapshot() {
      const projects = await platformSource.listProjects();
      const results = await Promise.all(projects.map(async (project) => {
        try {
          const taskValue = await platformSource.listProjectTasks(project.id, {});
          return {
            project,
            tasks: Array.isArray(taskValue) ? taskValue : taskValue.flattened || [],
            tags: await platformSource.listProjectTags(project.id),
            error: null
          };
        } catch (error) {
          return { project, tasks: [], tags: [], error };
        }
      }));
      return {
        user: null,
        project_catalog: projects,
        projects,
        tasks: results.flatMap((item) => item.tasks.map((task) => ({ ...task, project_id: String(task.project_id || item.project.id) }))),
        tags: results.flatMap((item) => item.tags.map((tag) => ({ ...tag, project_id: String(tag.project_id || item.project.id) }))),
        source_status: results.some((item) => item.error) ? "degraded" : "healthy",
        errors: results.filter((item) => item.error).map((item) => ({
          project_id: String(item.project.id), code: String(item.error.code || "platform_source_error"), status: 0, message: item.error.message
        }))
      };
    },
    async reconcile() {},
    async createTask(input) { return platformSource.createTask(input); },
    async replaceTaskProject(input) { return platformSource.replaceTaskProject(input); },
    async retryTaskProjectReplacement(input) { return platformSource.retryTaskProjectReplacement(input); },
    async keepTaskProjectReplacement(input) { return platformSource.keepTaskProjectReplacement(input); },
    async updateTask(taskId, input) { return platformSource.updateTask(taskId, input); },
    async updateTaskState({ taskId, state }) { return platformSource.updateTask(taskId, { state }); },
    async deleteTask(taskId) { return platformSource.deleteTask(taskId); }
  };
}

function staticWorkSync({ projects, tasks, tags = [], source_status = "healthy", errors = [] }) {
  return {
    async getSnapshot() { return { user: null, project_catalog: projects, projects, tasks, tags, source_status, errors }; },
    async reconcile() {}
  };
}

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
    listOrganizationProjects: async () => projects,
    listPersonalProjects: async () => [],
    listProjectMembers: async (projectId) => [{ id: `M-${projectId}`, user_id: "7", role: "owner" }],
    listProjectTasks: async (projectId) => [{ id: `T-${projectId}`, project_id: projectId, state: "pending" }],
    listFeedbackV1: async (projectId) => [{ id: `F-${projectId}`, project_id: projectId, title: "Feedback", file: `https://example.test/${projectId}/screen.png` }],
    listProjectTags: async (projectId) => [{ id: `TAG-${projectId}`, project_id: projectId, name: "platform" }]
  };
  const coordinator = createPlatformCoordinator({ runManager, automationCoordinator, platformSource, now: () => "2026-08-18T00:00:00.000Z" });

  const initial = await coordinator.getSnapshot({});
  assert.equal(initial.ui_preferences.work_inspector_width_px, 440);
  assert.deepEqual(initial.active_workset.project_ids, ["11", "12"]);
  assert.deepEqual(initial.product_workspaces.map((item) => item.name), ["Alpha", "Beta"]);
  assert.deepEqual(initial.tasks.map((item) => item.project_name), ["Alpha", "Beta"]);
  assert.deepEqual(initial.feedback_v1.map((item) => item.project_name), ["Alpha", "Beta"]);
  assert.deepEqual(initial.tags.map((item) => item.project_name), ["Alpha", "Beta"]);
  assert.equal("acceptance_feedback_queue" in initial.automation, false);
  assert.deepEqual(initial.organization_members.map((item) => item.organization_id), ["31"]);
  assert.equal(initial.organization_scopes[0].project_visibility, "all_projects");
  assert.deepEqual(initial.organization_scopes[0].projects.map((item) => item.name), ["Alpha", "Beta"]);
  assert.equal(await coordinator.getFeedbackAttachmentUrl({ project_id: "11", feedback_id: "F-11", feedback_source: "v1" }), "https://example.test/11/screen.png");
  await assert.rejects(() => coordinator.getFeedbackAttachmentUrl({ project_id: "11", feedback_id: "F-unknown", feedback_source: "v1" }), /不属于当前反馈记录/);
  assert.deepEqual(await coordinator.setWorkInspectorWidth(612.4), { work_inspector_width_px: 612 });
  assert.equal(store.platform.ui_preferences.work_inspector_width_px, 612);

  await coordinator.updateWorkset({ id: "WORKSET-DEFAULT", project_ids: ["12"] });
  assert.deepEqual(store.platform.worksets[0].project_ids, ["12"]);
  assert.deepEqual(store.automation.project_participation, { "11": true, "12": false });
  const single = await coordinator.getSnapshot({ sections: ["overview"] });
  assert.deepEqual(single.product_workspaces.map((item) => item.name), ["Beta"]);
  assert.deepEqual(single.organization_scopes[0].projects.map((item) => item.name), ["Alpha", "Beta"]);
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

test("platform coordinator projects task-tree lineage and matched counts without flattening away hierarchy metadata", async () => {
  const tasks = [
    { id: "21", project_id: "11", state: "pending", father_id: "", created_at: "2026-06-01" },
    { id: "22", project_id: "11", state: "pending", father_id: "21", created_at: "2026-06-02" },
    { id: "23", project_id: "11", state: "blocked", father_id: "", created_at: "2026-06-03" }
  ];
  const coordinator = createPlatformCoordinator({
    runManager: { readDesktopStore: async () => normalizeStore({ platform: { worksets: [{ id: "WORKSET-DEFAULT", name: "Main", project_ids: ["11"] }], active_workset_id: "WORKSET-DEFAULT" } }), updateDesktopStore: async () => {} },
    automationCoordinator: { getSnapshot: async () => ({ source_status: "healthy", projects: [], queue: [], attention_items: [], recovery_items: [] }) },
    workSync: staticWorkSync({ projects: [{ id: "11", name: "Alpha" }], tasks }),
    platformSource: new Proxy({
      listProjects: async () => [{ id: "11", name: "Alpha" }],
      listProjectTaskTree: async (projectId, filters) => {
        treeCalls.push([projectId, filters]);
        return { tasks: [{ id: "21", tree_depth: 0, children: [] }], flattened: [{ id: "21", tree_depth: 0, tree_matched: false }, { id: "22", tree_depth: 1, tree_matched: true }], total: 2, matched_total: 1 };
      },
      listProjectTasks: async (projectId, filters) => {
        countCalls.push([projectId, filters]);
        return [{ id: "22", state: "pending" }, { id: "23", state: "blocked" }];
      }
    }, { get: (target, key) => target[key] || (async () => []) })
  });
  const filters = { tree: true, states: ["pending"], start_time: "2026-05-16", end_time: "2026-08-23" };
  const snapshot = await coordinator.getSnapshot({ sections: ["tasks"], task_filters: filters });
  assert.deepEqual(snapshot.tasks.map((task) => [task.id, task.project_name, task.tree_depth]), [["21", "Alpha", 0], ["22", "Alpha", 1]]);
  assert.deepEqual(snapshot.task_trees.map((tree) => [tree.project_id, tree.total, tree.matched_total]), [["11", 2, 2]]);
  assert.deepEqual(snapshot.product_workspaces[0].task_counts, { pending: 2, blocked: 1 });
});

test("dedicated Work query excludes unrelated snapshots and returns a bounded task window", async () => {
  const calls = [];
  const tasks = Array.from({ length: 1000 }, (_, index) => ({
    id: String(index + 1), project_id: "11", state: "pending", content: `desktop ${index}`,
    creator_id: "7", executor_id: "8", tags: "TAG-1", priority: 1, created_at: "2026-06-01"
  }));
  const coordinator = createPlatformCoordinator({
    runManager: { readDesktopStore: async () => normalizeStore({ platform: { worksets: [{ id: "WORKSET-DEFAULT", name: "Main", project_ids: ["11"] }], active_workset_id: "WORKSET-DEFAULT" } }), updateDesktopStore: async () => {} },
    automationCoordinator: { getSnapshot: async () => { throw new Error("Automation must not participate in Work query"); } },
    workSync: staticWorkSync({ projects: [{ id: "11", name: "Alpha" }], tasks, tags: [{ id: "TAG-1", project_id: "11", name: "Desktop" }] }),
    platformSource: {
      listProjects: async () => { calls.push("projects"); return [{ id: "11", name: "Alpha" }]; },
      listProjectTaskTree: async (_projectId, filters) => { calls.push(["tasks", filters]); return { tasks: [], flattened: tasks, total: 1000, matched_total: 1000 }; },
      listProjectTags: async () => { calls.push("tags"); return [{ id: "TAG-1", name: "Desktop" }]; },
      listOrganizations: async () => { throw new Error("Organizations must not participate in Work query"); },
      listOrganizationMembers: async () => { throw new Error("Members must not participate in Work query"); },
      listFeedbackV1: async () => { throw new Error("Feedback must not participate in Work query"); }
    }
  });

  const result = await coordinator.queryWork({
    query_key: "complete-query-key", workset_id: "WORKSET-DEFAULT", project_id: "all", state: "pending",
    creator_ids: ["7"], executor_ids: ["8"], tag_ids: ["TAG-1"], priorities: ["1"],
    search_key: "desktop", start_time: "2026-01-01", end_time: "2026-08-24", offset: 0, limit: 80
  });

  assert.equal(result.schema_version, "arcorbit-work-query/v1");
  assert.equal(result.query_key, "complete-query-key");
  assert.equal(result.tasks.length, 80);
  assert.deepEqual(result.window, { offset: 0, limit: 80, returned: 80, total: 1000, has_more: true });
  assert.equal(result.product_workspaces[0].task_counts.pending, 1000);
  assert.equal(result.product_workspaces[0].task_tree.tasks.length, 0);
  assert.deepEqual(calls, []);
});

test("dedicated Work query derives all status counts from one local projection and the same non-state filters", async () => {
  const tasks = [
    { id: "P-1", project_id: "11", state: "pending", content: "desktop pending", creator_id: "7" },
    { id: "P-2", project_id: "11", state: "pending", content: "other pending", creator_id: "7" },
    { id: "C-1", project_id: "11", state: "completed", content: "desktop completed", creator_id: "7" },
    { id: "B-1", project_id: "11", state: "blocked", content: "desktop blocked", creator_id: "8" }
  ];
  const coordinator = createPlatformCoordinator({
    runManager: { readDesktopStore: async () => normalizeStore({ platform: { worksets: [{ id: "WORKSET-DEFAULT", name: "Main", project_ids: ["11"] }], active_workset_id: "WORKSET-DEFAULT" } }), updateDesktopStore: async () => {} },
    automationCoordinator: { getSnapshot: async () => { throw new Error("Automation must not participate in Work query"); } },
    workSync: staticWorkSync({ projects: [{ id: "11", name: "Alpha" }], tasks }),
    platformSource: new Proxy({}, { get: () => async () => { throw new Error("Workshop must not participate in Work query"); } })
  });

  const result = await coordinator.queryWork({
    query_key: "all-status-counts", state: "pending", search_key: "desktop", creator_ids: ["7"]
  });

  assert.deepEqual(result.product_workspaces[0].task_counts, {
    pending_review: 0, pending: 1, in_progress: 0, completed: 1, accepted: 0, cancelled: 0, blocked: 0
  });
  assert.deepEqual(result.tasks.map((task) => task.id), ["P-1"]);
});

test("dedicated Work query retains ancestor lineage around a matched window", async () => {
  const coordinator = createPlatformCoordinator({
    runManager: { readDesktopStore: async () => normalizeStore({ platform: { worksets: [{ id: "WORKSET-DEFAULT", name: "Main", project_ids: ["11"] }], active_workset_id: "WORKSET-DEFAULT" } }), updateDesktopStore: async () => {} },
    automationCoordinator: { getSnapshot: async () => { throw new Error("Automation must not participate in Work query"); } },
    workSync: staticWorkSync({ projects: [{ id: "11", name: "Alpha" }], tasks: [
      { id: "ROOT", project_id: "11", state: "completed", father_id: "" },
      { id: "CHILD", project_id: "11", state: "pending", father_id: "ROOT" }
    ] }),
    platformSource: {
      listProjects: async () => [{ id: "11", name: "Alpha" }],
      listProjectTaskTree: async () => ({
        tasks: [], total: 2, matched_total: 1,
        flattened: [
          { id: "ROOT", state: "completed", tree_depth: 0, tree_matched: false, tree_ancestor_ids: [] },
          { id: "CHILD", state: "pending", tree_depth: 1, tree_matched: true, tree_ancestor_ids: ["ROOT"] }
        ]
      }),
      listProjectTags: async () => []
    }
  });

  const result = await coordinator.queryWork({ query_key: "tree-query", state: "pending", offset: 0, limit: 1 });
  assert.deepEqual(result.tasks.map((task) => task.id), ["ROOT", "CHILD"]);
  assert.deepEqual(result.window, { offset: 0, limit: 1, returned: 1, total: 1, has_more: false });
});

test("platform coordinator binds TaskAttachment upload and access to a visible task and persisted record", async () => {
  const calls = [];
  const platformSource = new Proxy({
    listProjects: async () => [{ id: "11", name: "Alpha" }],
    listProjectTasks: async () => [{ id: "21", project_id: "11" }],
    listTaskAttachments: async () => [{ id: "31", task_id: "21", type: "text", content: "[image](workshop/a.png) [file](workshop/a.pdf)" }],
    uploadTaskAttachmentResource: async (input) => { calls.push(["upload", input]); return { object_key: "workshop/new.png" }; },
    getTaskAttachmentResourceUrl: async (key, options) => { calls.push(["url", key, options]); return `https://oss.example.test/${key}`; }
  }, { get: (target, key) => target[key] || (async () => []) });
  const coordinator = createPlatformCoordinator({
    runManager: { readDesktopStore: async () => normalizeStore({}), updateDesktopStore: async () => {} },
    automationCoordinator: { getSnapshot: async () => ({ projects: [], queue: [], attention_items: [], recovery_items: [] }) },
    platformSource
  });
  assert.deepEqual(await coordinator.uploadTaskAttachmentResource({ project_id: "11", task_id: "21", kind: "image", file: { size: 3 } }), { object_key: "workshop/new.png" });
  assert.equal(await coordinator.getTaskAttachmentResourceUrl({ task_id: "21", attachment_id: "31", object_key: "workshop/a.pdf", download: true }), "https://oss.example.test/workshop/a.pdf");
  await assert.rejects(coordinator.getTaskAttachmentResourceUrl({ task_id: "21", attachment_id: "31", object_key: "workshop/other.pdf" }), /不属于/);
  await assert.rejects(coordinator.uploadTaskAttachmentResource({ project_id: "11", task_id: "99", kind: "file", file: {} }), /不可见/);
  assert.equal(calls.length, 2);
});

test("organization governance uses role-based project visibility without inheriting Workset scope", async () => {
  const visibilityCalls = [];
  const coordinator = createPlatformCoordinator({
    runManager: {
      readDesktopStore: async () => normalizeStore({ platform: { active_workset_id: "WORKSET-DEFAULT", worksets: [{ id: "WORKSET-DEFAULT", name: "One product", project_ids: ["11"] }] } }),
      updateDesktopStore: async () => normalizeStore({})
    },
    automationCoordinator: { getSnapshot: async () => ({ source_status: "healthy", user: { id: "7" }, projects: [], queue: [], attention_items: [], recovery_items: [] }) },
    platformSource: {
      listOrganizations: async () => [{ id: "31", name: "Owned" }, { id: "32", name: "Member" }],
      listOrganizationMembers: async (id) => id === "31"
        ? [{ id: "M31", user_id: "7", organization_id: "31", role: "owner", is_me: true }]
        : [{ id: "M32", user_id: "7", organization_id: "32", role: "member", is_me: true }],
      listProjects: async () => [{ id: "11", name: "Selected", organization_id: "31", raw: { organization_id: 31, members: [] } }],
      listOrganizationProjects: async (id, options) => {
        visibilityCalls.push([id, options.visibility]);
        return id === "31"
          ? [{ id: "11", name: "Selected", organization_id: "31" }, { id: "12", name: "Unselected", organization_id: "31" }]
          : [{ id: "13", name: "Participating only", organization_id: "32" }];
      },
      listPersonalProjects: async () => [
        { id: "21", name: "Personal", raw: { members: [{ user_id: 7, role: "owner", is_me: true }] } },
        { id: "22", name: "External", raw: { members: [{ user_id: 7, role: "member", is_me: true, is_external: true }] } }
      ],
      listProjectMembers: async () => [], listProjectTasks: async () => [], listFeedbackV1: async () => [], listProjectTags: async () => []
    }
  });

  const snapshot = await coordinator.getSnapshot({ sections: ["overview", "organizations", "members"] });
  assert.deepEqual(visibilityCalls, [["31", "all_projects"], ["32", "participating_projects"]]);
  assert.deepEqual(snapshot.product_workspaces.map((project) => project.id), ["11"]);
  assert.deepEqual(snapshot.organization_scopes.map((scope) => [scope.id, scope.project_visibility, scope.projects.map((project) => project.id)]), [
    ["31", "all_projects", ["11", "12"]],
    ["32", "participating_projects", ["13"]]
  ]);
  assert.deepEqual(snapshot.personal_projects.map((project) => project.id), ["21", "22"]);
  assert.deepEqual(snapshot.personal_projects.map((project) => [project.id, project.organization_id, project.external_participation]), [
    ["21", "", false],
    ["22", "", true]
  ]);
});

test("platform coordinator exposes bounded management actions and omits unsafe direct project-member add", async () => {
  const calls = [];
  const automationRefreshes = [];
  const acceptanceIssues = [{ feedback_id: "AF-OPEN", status: "queued" }];
  const platformSource = new Proxy({
    listProjects: async () => [{ id: "11", name: "Alpha" }],
    updateProjectMember: async (projectId, input) => { calls.push(["member.update", projectId, input]); return { ok: true }; },
    createTask: async (input) => { calls.push(["task.create", input]); return { id: 42, ...input }; },
    updateTask: async (taskId, input) => { calls.push(["task.update", taskId, input]); return { id: taskId, ...input }; },
    listProjectTasks: async () => [{ id: "42", father_id: "" }, { id: "43", father_id: "42" }, { id: "44", father_id: "43" }],
    updateFeedbackV1: async (feedbackId, input) => { calls.push(["feedback.update", feedbackId, input]); return { id: feedbackId }; }
  }, { get: (target, key) => target[key] || (async () => []) });
  const coordinator = createPlatformCoordinator({
    runManager: { readDesktopStore: async () => normalizeStore({}), updateDesktopStore: async () => normalizeStore({}) },
    automationCoordinator: {
      getSnapshot: async () => ({ source_status: "healthy", projects: [], tasks: [{ id: "42", acceptance_feedback_items: acceptanceIssues }] }),
      refreshProject: async (projectId, options) => { automationRefreshes.push([projectId, options]); return {}; }
    },
    platformSource
  });

  await coordinator.executeAction("project.member.update", { project_id: 11, target_user_id: 7, duty: "Design" });
  await coordinator.executeAction("feedback.to_task", { feedback_id: 51, project_id: 11, task_content: "Follow up", executor_id: 8, metadata: { priority: "P1" } });
  assert.deepEqual(calls[0], ["member.update", 11, { project_id: 11, target_user_id: 7, duty: "Design" }]);
  assert.deepEqual(calls[1], ["task.create", { project_id: 11, content: "Follow up", state: "pending_review", executor_id: 8, priority: undefined, tags: undefined }]);
  assert.equal(calls[2][0], "feedback.update");
  assert.equal(calls[2][1], 51);
  assert.deepEqual(
    { ...calls[2][2].data, converted_at: "<dynamic>" },
    {
      priority: "P1",
      feedback_state: "converted",
      status: "developing",
      task_id: "42",
      converted_task_id: "42",
      converted_at: "<dynamic>",
      task_state: "pending_review"
    }
  );
  assert.equal(Number.isNaN(Date.parse(calls[2][2].data.converted_at)), false);
  const created = await coordinator.executeAction("task.create", { project_id: "11", content: "Local pending review", executor_id: 7, state: "accepted" });
  assert.equal(created.state, "accepted");
  assert.deepEqual(calls.at(-1), ["task.create", { project_id: "11", content: "Local pending review", executor_id: 7, state: "accepted" }]);
  assert.deepEqual(automationRefreshes, []);
  await coordinator.executeAction("task.update", { task_id: "42", content: "Updated", state: "accepted", expected_state: "pending_review" });
  assert.deepEqual(calls.at(-1), ["task.update", "42", { content: "Updated", state: "accepted" }]);
  acceptanceIssues[0].status = "resolved";
  await coordinator.executeAction("task.subtask.create", { project_id: "11", father_id: "42", content: "Child", state: "accepted" });
  assert.deepEqual(calls.at(-1), ["task.create", { project_id: "11", father_id: "42", content: "Child", state: "accepted" }]);
  assert.deepEqual(automationRefreshes, []);
  await assert.rejects(coordinator.executeAction("task.update", { task_id: "42", state: "unknown" }), /Unsupported task state/);
  await coordinator.executeAction("task.reparent", { project_id: "11", task_id: "44", father_id: "42" });
  assert.deepEqual(calls.at(-1), ["task.update", "44", { father_id: "42" }]);
  await assert.rejects(coordinator.executeAction("task.reparent", { project_id: "11", task_id: "42", father_id: "44" }), /不能形成循环/);
  await assert.rejects(coordinator.executeAction("project.member.add", { project_id: 11, target_user_id: 7 }), /Unsupported platform action/);
});

test("platform coordinator restricts task project replacement to the active Workset and typed recovery actions", async () => {
  const calls = [];
  const store = normalizeStore({
    platform: {
      active_workset_id: "WORKSET-DEFAULT",
      worksets: [{ id: "WORKSET-DEFAULT", name: "Main", project_ids: ["11", "12"] }]
    }
  });
  const workSync = {
    async getSnapshot() {
      return {
        project_catalog: [{ id: "11", name: "Source" }, { id: "12", name: "Target" }, { id: "13", name: "Outside" }],
        tasks: [
          { id: "T-1", project_id: "11", content: "source", state: "pending" },
          { id: "P-12", project_id: "12", content: "parent", state: "pending" }
        ],
        tags: [], errors: [], source_status: "healthy", task_replacements: []
      };
    },
    async replaceTaskProject(input) { calls.push(["replace", input]); return { status: "completed" }; },
    async retryTaskProjectReplacement(input) { calls.push(["retry", input]); return { status: "completed" }; },
    async keepTaskProjectReplacement(input) { calls.push(["keep", input]); return { status: "completed" }; }
  };
  const coordinator = createProductionPlatformCoordinator({
    runManager: { readDesktopStore: async () => store, updateDesktopStore: async () => store },
    platformSource: {},
    workSync,
    automationCoordinator: { getSnapshot: async () => ({ source_status: "healthy", projects: [], tasks: [], queue: [], attention_items: [], recovery_items: [], health: {} }) }
  });

  await coordinator.executeAction("task.replace_project", {
    source_task_id: "T-1", target_project_id: "12", content: "edited", state: "completed", father_id: "P-12", attachments: ["not-forwarded"]
  });
  await coordinator.executeAction("task.replace_project.retry_delete", { replacement_id: "11:T-1" });
  await coordinator.executeAction("task.replace_project.keep_both", { replacement_id: "11:T-1" });

  assert.deepEqual(calls, [
    ["replace", { source_task_id: "T-1", target_project_id: "12", content: "edited", state: "completed", priority: undefined, executor_id: undefined, father_id: "P-12", tags: undefined }],
    ["retry", { replacement_id: "11:T-1" }],
    ["keep", { replacement_id: "11:T-1" }]
  ]);
  await assert.rejects(
    coordinator.executeAction("task.replace_project", { source_task_id: "T-1", target_project_id: "13" }),
    /不在当前产品集/
  );
  await assert.rejects(
    coordinator.executeAction("task.replace_project", { source_task_id: "T-1", target_project_id: "12", father_id: "T-1" }),
    /父待办不属于目标产品/
  );
});

test("successful task creation is not reported as failed when the immediate Automation refresh degrades", async () => {
  const coordinator = createPlatformCoordinator({
    runManager: { readDesktopStore: async () => normalizeStore({}), updateDesktopStore: async () => normalizeStore({}) },
    automationCoordinator: {
      getSnapshot: async () => ({ source_status: "healthy", projects: [], tasks: [] }),
      refreshProject: async () => { throw new Error("controlled refresh failure"); }
    },
    platformSource: new Proxy({
      createTask: async (input) => ({ id: "NEW-1", ...input })
    }, { get: (target, key) => target[key] || (async () => []) })
  });

  assert.deepEqual(
    await coordinator.executeAction("task.create", { project_id: "11", content: "Created once" }),
    { id: "NEW-1", project_id: "11", content: "Created once", state: "pending_review" }
  );
});

test("feedback association recovery reuses the created task and never creates another task", async () => {
  const calls = [];
  let associationFailuresRemaining = 2;
  let linkedTaskId = "";
  const platformSource = new Proxy({
    listProjects: async () => [{ id: "11", name: "Alpha" }],
    createTask: async (input) => { calls.push(["task.create", input]); return { id: 42, state: "pending_review" }; },
    listProjectTasks: async (projectId) => { calls.push(["task.list", projectId]); return [{ id: "42", project_id: String(projectId), state: "pending_review" }]; },
    listFeedbackV1: async (projectId) => { calls.push(["feedback.list", projectId]); return [{ id: "51", project_id: String(projectId), metadata: { priority: "P1" }, linked_task_id: linkedTaskId }]; },
    updateFeedbackV1: async (feedbackId, input) => {
      calls.push(["feedback.update", feedbackId, input]);
      if (associationFailuresRemaining > 0) {
        associationFailuresRemaining -= 1;
        throw new Error("temporary feedback update failure");
      }
      linkedTaskId = String(input.data.task_id);
      return { id: String(feedbackId), project_id: "11", linked_task_id: String(input.data.task_id), metadata: input.data };
    }
  }, { get: (target, key) => target[key] || (async () => []) });
  const coordinator = createPlatformCoordinator({
    runManager: { readDesktopStore: async () => normalizeStore({}), updateDesktopStore: async () => normalizeStore({}) },
    automationCoordinator: { getSnapshot: async () => ({ source_status: "healthy", projects: [], tasks: [] }) },
    platformSource
  });

  const partial = await coordinator.executeAction("feedback.to_task", {
    feedback_id: 51,
    project_id: 11,
    task_content: "Follow up",
    metadata: { priority: "P1" }
  });
  assert.equal(partial.status, "partial");
  assert.deepEqual(partial.partial_result, { status: "task_created_feedback_link_failed", task_id: "42", task_state: "pending_review" });

  await assert.rejects(
    coordinator.executeAction("feedback.link_task", { feedback_id: 51, project_id: 11, task_id: 42 }),
    /temporary feedback update failure/
  );
  const recovered = await coordinator.executeAction("feedback.link_task", { feedback_id: 51, project_id: 11, task_id: 42 });
  assert.equal(recovered.status, "completed");
  assert.equal(recovered.already_linked, false);
  assert.equal(calls.filter(([kind]) => kind === "task.create").length, 1);
  assert.equal(calls.filter(([kind]) => kind === "feedback.update").length, 3);
  assert.equal(recovered.feedback.linked_task_id, "42");
  const idempotent = await coordinator.executeAction("feedback.link_task", { feedback_id: 51, project_id: 11, task_id: 42 });
  assert.equal(idempotent.already_linked, true);
  assert.equal(calls.filter(([kind]) => kind === "feedback.update").length, 3);

  linkedTaskId = "43";
  await assert.rejects(
    coordinator.executeAction("feedback.link_task", { feedback_id: 51, project_id: 11, task_id: 42 }),
    /already linked to task 43/
  );
  linkedTaskId = "";

  await assert.rejects(
    coordinator.executeAction("feedback.link_task", { feedback_id: 51, project_id: 11, task_id: 404 }),
    /Task 404 is not available/
  );
  await assert.rejects(
    coordinator.executeAction("feedback.link_task", { feedback_id: 404, project_id: 11, task_id: 42 }),
    /Feedback 404 is not available/
  );
  await assert.rejects(
    coordinator.executeAction("feedback.link_task", { feedback_id: "", project_id: 11, task_id: 42 }),
    /Feedback id is invalid/
  );
  assert.equal(calls.filter(([kind]) => kind === "task.create").length, 1);
});

test("platform coordinator exposes project-gated Feedback V2 facts and dedicated actions", async () => {
  let store = normalizeStore({ platform: { worksets: [{ id: "WORKSET-DEFAULT", name: "V2", project_ids: ["11", "12"] }] } });
  const calls = [];
  const platformSource = new Proxy({
    isFeedbackV2ProjectEnabled: (id) => String(id) === "11",
    isFeedbackV2NotificationsProjectEnabled: (id) => String(id) === "11",
    listOrganizations: async () => [],
    listProjects: async () => [{ id: "11", name: "V2" }, { id: "12", name: "V1" }],
    listFeedbackV2: async () => [{ id: "51", project_id: "11", feedback_source: "v2", title: "Conversation" }],
    listFeedbackV2Notifications: async () => ({ notifications: [{ id: "81", feedback_id: "51" }], unread_count: 1 }),
    listFeedbackV1: async (id) => String(id) === "12" ? [{ id: "52", project_id: "12", title: "Legacy" }] : [],
    listFeedbackV2Messages: async (projectId, feedbackId) => { calls.push(["messages", projectId, feedbackId]); return [{ id: "71" }]; },
    uploadFeedbackV2DeveloperAttachment: async (_projectId, input) => ({ type: "file", object_key: "feedback/log.txt", file_name: input.file.file_name, mime_type: input.file.mime_type, size: input.file.size }),
    createFeedbackV2DeveloperMessage: async (projectId, input) => { calls.push(["reply", projectId, input]); return { id: "72", ...input }; },
    markFeedbackV2NotificationsRead: async (projectId, input) => { calls.push(["read", projectId, input]); return { marked_count: 1 }; },
    ignoreFeedbackV2: async (projectId, feedbackId) => { calls.push(["ignore", projectId, feedbackId]); return { id: feedbackId }; },
    convertFeedbackV2ToTask: async (projectId, input) => { calls.push(["convert", projectId, input]); return { task: { id: 42 } }; },
    getFeedbackV2AttachmentUrl: async (projectId, input) => { calls.push(["attachment", projectId, input]); return "https://oss.example.test/file"; }
  }, { get: (target, key) => target[key] || (async () => []) });
  const coordinator = createPlatformCoordinator({
    runManager: {
      readDesktopStore: async () => store,
      updateDesktopStore: async (updater) => { store = normalizeStore(await updater(store) || store); return store; }
    },
    automationCoordinator: { getSnapshot: async () => ({ source_status: "healthy", projects: [], queue: [], attention_items: [], recovery_items: [] }) },
    platformSource,
    now: () => "2026-08-23T00:00:00.000Z"
  });

  const snapshot = await coordinator.getSnapshot({ sections: ["feedback"] });
  assert.deepEqual(snapshot.feedback_v1.map((item) => item.id), ["51", "52"]);
  assert.equal(snapshot.product_workspaces[0].feedback_management.status, "available");
  assert.equal(snapshot.product_workspaces[0].feedback_management.unread_count, 1);
  assert.deepEqual(snapshot.product_workspaces[0].feedback_management.unread_feedback_ids, ["51"]);
  assert.equal(snapshot.product_workspaces[1].feedback_management.status, "unavailable");
  assert.equal(snapshot.capabilities.feedback_v2, "available");

  await coordinator.getFeedbackV2Messages({ project_id: 11, feedback_id: 51 });
  await coordinator.sendFeedbackV2Reply({ project_id: 11, feedback_id: 51, content: "Fixed", file: { file_name: "log.txt", mime_type: "text/plain", size: 1, bytes: new Uint8Array([1]) } });
  await coordinator.markFeedbackV2Read({ project_id: 11, feedback_id: 51 });
  await coordinator.ignoreFeedbackV2({ project_id: 11, feedback_id: 51 });
  await coordinator.convertFeedbackV2ToTask({ project_id: 11, feedback_id: 51, content: "Task" });
  assert.equal(await coordinator.getFeedbackV2AttachmentUrl({ project_id: 11, feedback_id: 51, attachment_id: 91, object_key: "feedback/log.txt" }), "https://oss.example.test/file");
  assert.deepEqual(calls.map(([kind]) => kind), ["messages", "reply", "read", "ignore", "convert", "attachment"]);
  assert.equal(calls[1][2].attachments[0].object_key, "feedback/log.txt");
  await assert.rejects(coordinator.getFeedbackV2Messages({ project_id: 12, feedback_id: 52 }), /未启用/);
});

test("Feedback V2 action failures degrade only that feature and preserve loaded facts", async () => {
  let store = normalizeStore({ platform: { worksets: [{ id: "WORKSET-DEFAULT", name: "V2", project_ids: ["11"] }] } });
  const coordinator = createPlatformCoordinator({
    runManager: { readDesktopStore: async () => store, updateDesktopStore: async (updater) => { store = normalizeStore(await updater(store) || store); return store; } },
    automationCoordinator: { getSnapshot: async () => ({ source_status: "healthy", projects: [], queue: [], attention_items: [], recovery_items: [] }) },
    platformSource: new Proxy({
      isFeedbackV2ProjectEnabled: () => true,
      isFeedbackV2NotificationsProjectEnabled: () => false,
      listOrganizations: async () => [],
      listProjects: async () => [{ id: "11", name: "V2" }],
      listFeedbackV2: async () => [{ id: "51", project_id: "11", feedback_source: "v2", title: "Loaded" }],
      listFeedbackV2Messages: async () => { throw Object.assign(new Error("forbidden"), { code: "forbidden", status: 403 }); }
    }, { get: (target, key) => target[key] || (async () => []) })
  });
  await coordinator.getSnapshot({ sections: ["feedback"] });
  await assert.rejects(coordinator.getFeedbackV2Messages({ project_id: 11, feedback_id: 51 }), /forbidden/);
  const after = await coordinator.getSnapshot({ sections: ["feedback"] });
  assert.equal(after.feedback_v1[0].title, "Loaded");
  assert.equal(after.product_workspaces[0].feedback_management.features.messages, false);
  assert.equal(after.product_workspaces[0].feedback_management.errors.messages.status, 403);
});
