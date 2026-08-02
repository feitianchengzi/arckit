import assert from "node:assert/strict";
import test from "node:test";
import { createWorkshopTaskSource, TaskSourceError } from "../src/task-source-adapter.mjs";

test("Workshop task source reads the current user, project-owned tasks, and all seven states", async () => {
  const calls = [];
  const fetchImpl = async (url, options) => {
    calls.push({ url: String(url), options });
    const pathname = new URL(url).pathname;
    if (pathname.endsWith("/users")) {
      return jsonResponse({ data: { user: { id: 7, username: "glare" } } });
    }
    if (pathname.endsWith("/organizations")) {
      return jsonResponse({ data: { organizations: [{ id: 31, name: "Arckit" }] } });
    }
    if (pathname.endsWith("/projects")) {
      const organizationId = new URL(url).searchParams.get("organization_id");
      return organizationId
        ? jsonResponse({ data: { projects: [{ id: 12, name: "Runtime Organization" }] } })
        : jsonResponse({ data: { projects: [{ id: 11, name: "Runtime" }] } });
    }
    if (pathname.endsWith("/tasks")) {
      return jsonResponse({ data: { tasks: [{ id: 21, project_id: 11, content: "Implement queue", state: "pending", priority: 0, updated_at: "2026-08-02T00:00:00Z" }] } });
    }
    throw new Error(`Unexpected URL: ${url}`);
  };
  const source = createWorkshopTaskSource({
    settings: {
      enabled: true,
      base_url: "https://workshop.example",
      service_name: "workshop",
      auth_mode: "bearer",
      access_token: "secret"
    },
    fetchImpl
  });

  assert.deepEqual(await source.getCurrentUser(), { id: "7", name: "glare", raw: { id: 7, username: "glare" } });
  assert.deepEqual((await source.listProjects()).map((project) => project.id), ["11", "12"]);
  assert.equal(calls.some((call) => new URL(call.url).searchParams.get("organization_id") === "31"), true);
  const tasks = await source.listTasks("11");
  assert.equal(tasks[0].title, "Implement queue");
  assert.equal(tasks[0].priority, 100);
  const taskUrl = new URL(calls.at(-1).url);
  assert.deepEqual(taskUrl.searchParams.getAll("state"), ["pending_review", "pending", "in_progress", "completed", "accepted", "cancelled", "blocked"]);
  assert.equal(calls.every((call) => call.options.headers.Authorization === "Bearer secret"), true);
});

test("Workshop task source sends conditional state updates and reports version conflicts", async () => {
  const calls = [];
  const source = createWorkshopTaskSource({
    settings: { enabled: true, base_url: "https://workshop.example", access_token: "token" },
    fetchImpl: async (url, options) => {
      calls.push({ url: String(url), options });
      return jsonResponse({ message: "Task changed elsewhere" }, 409);
    }
  });

  await assert.rejects(
    source.updateTask({ taskId: "21", projectId: "11", state: "in_progress", expectedVersion: "v3" }),
    (error) => error instanceof TaskSourceError && error.code === "version_conflict" && error.status === 409
  );
  assert.equal(calls[0].options.method, "PUT");
  assert.equal(calls[0].options.headers["If-Match"], "v3");
  assert.equal(calls[0].options.body, JSON.stringify({ state: "in_progress" }));
});

test("Workshop task source fails closed while it is unconfigured", () => {
  assert.throws(
    () => createWorkshopTaskSource({ settings: { enabled: false, base_url: "" } }),
    (error) => error instanceof TaskSourceError && error.code === "unconfigured"
  );
});

function jsonResponse(payload, status = 200) {
  return new Response(JSON.stringify(payload), {
    status,
    headers: { "content-type": "application/json" }
  });
}
