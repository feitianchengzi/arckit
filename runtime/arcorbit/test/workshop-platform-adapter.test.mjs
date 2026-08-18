import assert from "node:assert/strict";
import test from "node:test";
import { createWorkshopPlatformAdapter } from "../src/workshop-platform-adapter.mjs";

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
  await adapter.createTaskAttachment({ task_id: 21, type: "url", content: "https://example.test/spec" });
  await adapter.createTag("11", { name: "platform" });
  await adapter.createFeedbackV1({ project_id: 11, title: "Feedback", content: "Detail", data: { priority: "P1", ignored: false } });

  assert.deepEqual(calls[2], { path: "/organizations", options: { method: "POST", body: { name: "Team", description: "Product team" } } });
  assert.deepEqual(calls[3], { path: "/projects/11/invitations", options: { method: "POST", body: { role: "member", expires_in: 24, max_uses: 2 } } });
  assert.deepEqual(calls[4], { path: "/projects/11/members/role", options: { method: "PUT", body: { target_user_id: 7, role: "admin", duty: "Engineering" } } });
  assert.deepEqual(calls[5].options.body, { project_id: 11, content: "Ship platform", state: "pending_review", executor_id: 7, father_id: 20, priority: 0, tags: "desktop" });
  assert.deepEqual(calls[6], { path: "/tasks/attachments", options: { method: "POST", body: { task_id: 21, type: "url", content: "https://example.test/spec" } } });
  assert.deepEqual(calls[7], { path: "/projects/11/tags", options: { method: "POST", body: { project_id: 11, name: "platform" } } });
  assert.deepEqual(calls[8].options.body, { project_id: 11, title: "Feedback", content: "Detail", data: JSON.stringify({ priority: "P1", ignored: false }) });
  assert.equal("addProjectMember" in adapter, false);
});

test("Workshop platform management validates ids and rejects unsupported owner assignment", async () => {
  const adapter = createWorkshopPlatformAdapter({ request: async () => ({}), listProjects: async () => [], normalizeTask: (value) => value });
  assert.throws(() => adapter.createTask({ project_id: "not-an-id", content: "Invalid" }), /Project id is invalid/);
  assert.throws(() => adapter.updateProjectMember("11", { target_user_id: 7, role: "owner" }), /Member role is invalid/);
  assert.throws(() => adapter.inviteProjectMember("11", { role: "owner" }), /Member role is invalid/);
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
