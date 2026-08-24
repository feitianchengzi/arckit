import assert from "node:assert/strict";
import test from "node:test";
import { createWorkshopPlatformAdapter, normalizeFeedbackV1, normalizeFeedbackV2, normalizeMember } from "../src/workshop-platform-adapter.mjs";

test("Workshop member normalization never invents an id-shaped username", () => {
  assert.equal(normalizeMember({ id: 91, user_id: 7, username: "Glare" }, { projectId: 11 }).username, "Glare");
  assert.equal(normalizeMember({ id: 92, user_id: 8 }, { projectId: 11 }).username, "");
});

test("Workshop platform adapter keeps Feedback V2 in fixed project-scoped routes", async () => {
  const calls = [];
  const uploads = [];
  const adapter = createWorkshopPlatformAdapter({
    request: async () => ({}),
    requestV2: async (path, options = {}) => {
      calls.push({ path, options });
      if (path === "/feedbacks") return { feedbacks: [{ id: 51, project_id: 11, triage_status: "accepted", customer_status: "developing", task_id: 42, data: "{}" }] };
      if (path.endsWith("/messages") && !options.method) return { messages: [{ id: 71, feedback_id: 51, project_id: 11, sender_type: "customer", content: "Need help", attachments: [{ id: 91, type: "file", object_key: "feedback/51/log.txt", url: "https://oss.example.test/feedback/51/log.txt", file_name: "log.txt" }] }] };
      if (path === "/feedback-notifications") return { notifications: [{ id: 81, project_id: 11, feedback_id: 51, sender_type: "customer" }], unread_count: 1 };
      if (path.endsWith("/upload-policies")) return { object_key: "feedback/51/log.txt", upload_url: "https://oss.example.test", fields: { key: "feedback/51/log.txt" } };
      if (path.includes("/oss/credentials")) return { access_key_id: "id" };
      return { id: 72, feedback_id: 51, project_id: 11, sender_type: "developer", content: options.body?.content || "", attachments: options.body?.attachments || [] };
    },
    listProjects: async () => [],
    normalizeTask: (value) => value,
    feedbackV2ProjectIds: "11",
    feedbackV2NotificationProjectIds: "11",
    uploadWithPolicy: async (policy, file) => uploads.push({ policy, file }),
    signAttachmentUrl: ({ objectKey, credentials }) => `https://oss.example.test/${objectKey}?id=${credentials.access_key_id}`
  });

  assert.equal(adapter.isFeedbackV2ProjectEnabled(11), true);
  assert.equal(adapter.isFeedbackV2ProjectEnabled(12), false);
  const feedback = await adapter.listFeedbackV2(11);
  assert.equal(feedback[0].feedback_source, "v2");
  assert.equal(feedback[0].linked_task_id, "42");
  assert.equal(feedback[0].customer_status, "developing");
  const listedMessage = (await adapter.listFeedbackV2Messages(11, 51))[0];
  assert.equal(listedMessage.sender_type, "customer");
  assert.deepEqual(listedMessage.attachments[0], {
    id: "91",
    type: "file",
    object_key: "feedback/51/log.txt",
    file_name: "log.txt",
    mime_type: "",
    size: 0
  });
  assert.equal("url" in listedMessage.attachments[0], false);
  assert.equal((await adapter.listFeedbackV2Notifications(11)).unread_count, 1);
  await adapter.markFeedbackV2NotificationsRead(11, { feedback_id: 51 });
  const attachment = await adapter.uploadFeedbackV2DeveloperAttachment(11, {
    feedback_id: 51,
    file: { file_name: "log.txt", mime_type: "text/plain", size: 3, bytes: new Uint8Array([1, 2, 3]) }
  });
  assert.equal(attachment.object_key, "feedback/51/log.txt");
  assert.equal(uploads.length, 1);
  const message = await adapter.createFeedbackV2DeveloperMessage(11, { feedback_id: 51, content: "Fixed", attachments: [attachment] });
  assert.equal(message.sender_type, "developer");
  assert.equal(await adapter.getFeedbackV2AttachmentUrl(11, { feedback_id: 51, attachment_id: 91, object_key: "feedback/51/log.txt" }), "https://oss.example.test/feedback/51/log.txt?id=id");
  await adapter.ignoreFeedbackV2(11, 51);
  await adapter.convertFeedbackV2ToTask(11, { feedback_id: 51, content: "Follow up", state: "pending_review", executor_id: 7 });
  assert.equal(calls.some((call) => call.path === "/feedbacks/51/ignore" && call.options.method === "POST"), true);
  assert.equal(calls.some((call) => call.path === "/feedbacks/51/convert-to-task" && call.options.body.executor_id === 7), true);
  await assert.rejects(adapter.listFeedbackV2(12), /not enabled/);
  await assert.rejects(adapter.createFeedbackV2DeveloperMessage(11, { feedback_id: 51, content: "", attachments: [] }), /requires text or an attachment/);
});

test("Feedback V2 normalization preserves V1 compatibility and explicit statuses", () => {
  const value = normalizeFeedbackV2({ id: 51, project_id: 11, triage_status: "ignored", customer_status: "released", data: "{}" });
  assert.equal(value.processing_state, "ignored");
  assert.equal(value.ignored, true);
  assert.equal(value.customer_status, "released");
  assert.equal(value.priority, "P2");
});

test("Workshop platform management uses the existing bounded service routes and fields", async () => {
  const calls = [];
  const adapter = createWorkshopPlatformAdapter({
    request: async (path, options = {}) => {
      calls.push({ path, options });
      if (path === "/projects/11/tags" && !options.method) return { tags: [{ id: 8, project_id: 11, name: "desktop" }] };
      if (path === "/tasks/attachments" && !options.method) return { attachments: [{ id: 9, task_id: 21, type: "url", content: "https://example.test" }] };
      return { id: calls.length };
    },
    listProjects: async () => [],
    normalizeTask: (value) => value
  });

  assert.deepEqual(await adapter.listProjectTags("11"), [{ id: "8", project_id: "11", name: "desktop" }]);
  assert.equal((await adapter.listTaskAttachments("21"))[0].type, "url");
  await adapter.createOrganization({ name: "Team", description: "Product team" });
  await adapter.inviteProjectMember("11", { role: "member", expires_in: 24, max_uses: 2 });
  await adapter.updateProjectMember("11", { target_user_id: 7, role: "admin", duty: "Engineering" });
  await adapter.createTask({ project_id: 11, content: "Ship platform", state: "pending_review", executor_id: 7, father_id: 20, priority: 0, tags: "desktop" });
  await adapter.updateTask("21", { priority: null });
  await adapter.createTaskAttachment({ task_id: 21, type: "url", content: "https://example.test/spec" });
  await adapter.createTag("11", { name: "platform" });
  await adapter.createFeedbackV1({ project_id: 11, title: "Feedback", content: "Detail", data: { priority: "P1", ignored: false } });

  assert.deepEqual(calls[2], { path: "/organizations", options: { method: "POST", body: { name: "Team", description: "Product team" } } });
  assert.deepEqual(calls[3], { path: "/projects/11/invitations", options: { method: "POST", body: { role: "member", expires_in: 24, max_uses: 2 } } });
  assert.deepEqual(calls[4], { path: "/projects/11/members/role", options: { method: "PUT", body: { target_user_id: 7, role: "admin", duty: "Engineering" } } });
  assert.deepEqual(calls[5].options.body, { project_id: 11, content: "Ship platform", state: "pending_review", executor_id: 7, father_id: 20, priority: 0, tags: "desktop" });
  assert.deepEqual(calls[6], { path: "/tasks/21", options: { method: "PUT", body: { priority: null } } });
  assert.deepEqual(calls[7], { path: "/tasks/attachments", options: { method: "POST", body: { task_id: 21, type: "url", content: "https://example.test/spec" } } });
  assert.deepEqual(calls[8], { path: "/projects/11/tags", options: { method: "POST", body: { project_id: 11, name: "platform" } } });
  assert.deepEqual(calls[9].options.body, { project_id: 11, title: "Feedback", content: "Detail", data: JSON.stringify({ priority: "P1", ignored: false }) });
  assert.equal("addProjectMember" in adapter, false);
});

test("Workshop platform adapter keeps TaskAttachment OSS credentials behind bounded resource methods", async () => {
  const calls = [];
  const adapter = createWorkshopPlatformAdapter({
    request: async (path) => {
      calls.push(path);
      if (path === "/oss/credentials") return { root_path: "/workshop", access_key_id: "id" };
      return {};
    },
    listProjects: async () => [],
    normalizeTask: (value) => value,
    uploadTaskResource: async ({ credentials, kind, file }) => ({ object_key: `${credentials.root_path}/${kind}/${file.file_name}` }),
    signTaskResourceUrl: ({ objectKey, credentials, download }) => `https://oss.example.test/${objectKey}?id=${credentials.access_key_id}&download=${download}`
  });
  assert.deepEqual(await adapter.uploadTaskAttachmentResource({ kind: "file", file: { file_name: "log.txt" } }), { object_key: "/workshop/file/log.txt" });
  assert.equal(await adapter.getTaskAttachmentResourceUrl("workshop/file/log.txt", { download: true }), "https://oss.example.test/workshop/file/log.txt?id=id&download=true");
  assert.deepEqual(calls, ["/oss/credentials", "/oss/credentials"]);
});

test("Workshop platform management validates ids and rejects unsupported owner assignment", async () => {
  const adapter = createWorkshopPlatformAdapter({ request: async () => ({}), listProjects: async () => [], normalizeTask: (value) => value });
  assert.throws(() => adapter.createTask({ project_id: "not-an-id", content: "Invalid" }), /Project id is invalid/);
  assert.throws(() => adapter.updateProjectMember("11", { target_user_id: 7, role: "owner" }), /Member role is invalid/);
  assert.throws(() => adapter.inviteProjectMember("11", { role: "owner" }), /Member role is invalid/);
});

test("Workshop task queries serialize multi-value filters and normalize the bounded task tree", async () => {
  const calls = [];
  const adapter = createWorkshopPlatformAdapter({
    request: async (path, options = {}) => {
      calls.push({ path, options });
      if (path === "/tasks/tree") return {
        total: 1,
        tasks: [{ id: 21, project_id: 11, content: "Parent", matched: false, children: [{ id: 22, project_id: 11, father_id: 21, content: "Child", matched: true }] }]
      };
      return { tasks: [{ id: 22, project_id: 11, content: "Child" }], total: 1 };
    },
    listProjects: async () => [],
    normalizeTask: (value) => ({ ...value, id: String(value.id), project_id: String(value.project_id), father_id: value.father_id ? String(value.father_id) : "" })
  });

  await adapter.listProjectTasks("11", {
    states: ["pending", "blocked"], creator_ids: [7, 8], executor_ids: [9], tag_ids: [3, 4], priorities: [0, 2], search_key: " release "
  });
  assert.deepEqual(calls[0], {
    path: "/tasks",
    options: { query: { project_id: "11", state: "pending,blocked", creator_id: "7,8", executor_id: "9", tags: "3,4", priority: "0,2", search_key: "release", page: 1, page_size: 200 } }
  });

  const tree = await adapter.listProjectTaskTree("11", { states: ["pending"], start_time: "2026-05-16", end_time: "2026-08-23" });
  assert.equal(calls[1].path, "/tasks/tree");
  assert.equal(calls[1].options.query.state, "pending");
  assert.equal(calls[1].options.query.start_time, "2026-05-16T00:00:00.000Z");
  assert.equal(calls[1].options.query.end_time, "2026-08-23T23:59:59.999Z");
  assert.equal(tree.total, 2);
  assert.equal(tree.matched_total, 1);
  assert.deepEqual(tree.flattened.map((task) => [task.id, task.tree_depth, task.tree_matched]), [["21", 0, false], ["22", 1, true]]);
  await assert.rejects(adapter.listProjectTaskTree("11", { start_time: "2026-01-01", end_time: "2026-08-23" }), /cannot exceed 100 days/);
});

test("Workshop platform adapter normalizes historical Feedback V1 processing fields", () => {
  const converted = normalizeFeedbackV1({
    id: 51,
    project_id: 11,
    task_id: 42,
    task_state: "in_progress",
    triage_status: "accepted",
    data: JSON.stringify({ feedback_state: "待处理", ai_priority: "1" })
  });
  assert.equal(converted.linked_task_id, "42");
  assert.equal(converted.linked_task_state, "in_progress");
  assert.equal(converted.processing_state, "converted");
  assert.equal(converted.priority, "P1");

  const legacy = normalizeFeedbackV1({
    id: 52,
    project_id: 11,
    data: JSON.stringify({ converted_task_id: 43, task_state: "completed", priority_level: 3 })
  });
  assert.equal(legacy.linked_task_id, "43");
  assert.equal(legacy.processing_state, "converted");
  assert.equal(legacy.priority, "P3");

  const ignored = normalizeFeedbackV1({ id: 53, project_id: 11, triage_status: "ignored", data: "{}" });
  assert.equal(ignored.ignored, true);
  assert.equal(ignored.processing_state, "ignored");
  assert.equal(ignored.priority, "P2");

  const developing = normalizeFeedbackV1({ id: 54, project_id: 11, status: "developing", data: "{}" });
  assert.equal(developing.processing_state, "in_progress");
  assert.equal(developing.priority, "P2");
});

test("Workshop platform adapter follows service pagination and keeps organization governance bounded", async () => {
  const calls = [];
  const adapter = createWorkshopPlatformAdapter({
    request: async (path, options = {}) => {
      calls.push({ path, options });
      if (path === "/organization/projects") {
        const page = options.query.page;
        const count = page === 1 ? 200 : 1;
        return { projects: Array.from({ length: count }, (_, index) => ({ id: (page - 1) * 200 + index + 1, name: `Project ${index}`, members: [] })), total: 201 };
      }
      return { ok: true };
    },
    listProjects: async () => [],
    normalizeTask: (value) => value
  });

  const projects = await adapter.listOrganizationProjects("31", { visibility: "all_projects" });
  assert.equal(projects.length, 201);
  assert.equal(projects.every((project) => project.organization_id === "31"), true);
  assert.deepEqual(calls.slice(0, 2).map((call) => [call.path, call.options.query.page, call.options.query.page_size]), [["/organization/projects", 1, 200], ["/organization/projects", 2, 200]]);

  await adapter.updateProject("11", { name: "Renamed", organization_id: 99 });
  await adapter.joinOrganization({ invite_code: "ORG-CODE" });
  await adapter.joinProject({ invite_code: "PROJECT-CODE" });
  assert.deepEqual(calls[2].options.body, { name: "Renamed" });
  assert.deepEqual(calls[3], { path: "/organizations/join", options: { method: "POST", body: { invite_code: "ORG-CODE" } } });
  assert.deepEqual(calls[4], { path: "/projects/join", options: { method: "POST", body: { invite_code: "PROJECT-CODE" } } });
});
