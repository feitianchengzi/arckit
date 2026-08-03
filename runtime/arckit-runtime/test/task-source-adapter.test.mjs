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
        ? jsonResponse({ data: { projects: [{ id: 12, name: "Runtime Organization", members: [{ user_id: 7, username: "glare", is_me: true }] }] } })
        : jsonResponse({ data: { projects: [{ id: 11, name: "Runtime", members: [{ user_id: 7, username: "glare", is_me: true }] }] } });
    }
    if (pathname.endsWith("/tasks")) {
      return jsonResponse({ data: { tasks: [
        { id: 21, project_id: 11, content: "Implement queue", state: "pending", executor_id: 7, priority: 0, updated_at: "2026-08-02T00:00:00Z" },
        { id: 22, project_id: 11, content: "Assigned elsewhere", state: "pending", executor_id: 8, priority: 1, updated_at: "2026-08-02T00:00:00Z" }
      ] } });
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
  assert.equal(tasks.length, 1);
  assert.equal(tasks[0].title, "Implement queue");
  assert.equal(tasks[0].executor_id, "7");
  assert.equal(tasks[0].priority, 100);
  const taskUrl = new URL(calls.at(-1).url);
  assert.equal(taskUrl.searchParams.get("executor_id"), "7");
  assert.deepEqual(taskUrl.searchParams.getAll("state"), ["pending_review", "pending", "in_progress", "completed", "accepted", "cancelled", "blocked"]);
  assert.equal(calls.every((call) => call.options.headers.Authorization === "Bearer secret"), true);
});

test("Workshop task source fails closed when the current project executor cannot be identified", async () => {
  const source = createWorkshopTaskSource({
    settings: { enabled: true, base_url: "https://workshop.example", access_token: "secret", username: "glare" },
    fetchImpl: async (url) => {
      const pathname = new URL(url).pathname;
      if (pathname.endsWith("/users")) return jsonResponse({ data: { user: { username: "glare" } } });
      if (pathname.endsWith("/organizations")) return jsonResponse({ data: { organizations: [] } });
      if (pathname.endsWith("/projects")) return jsonResponse({ data: { projects: [{ id: 11, name: "Runtime", members: [] }] } });
      throw new Error(`Unexpected URL: ${url}`);
    }
  });

  await source.listProjects();
  await assert.rejects(
    source.listTasks("11"),
    (error) => error instanceof TaskSourceError && error.code === "current_user_unresolved"
  );
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
    source.updateTask({ taskId: "21", projectId: "11", executorId: "7", state: "in_progress", expectedVersion: "v3" }),
    (error) => error instanceof TaskSourceError && error.code === "version_conflict" && error.status === 409
  );
  assert.equal(calls[0].options.method, "PUT");
  assert.equal(calls[0].options.headers["If-Match"], "v3");
  assert.equal(calls[0].options.body, JSON.stringify({ state: "in_progress" }));
});

test("Workshop task source rejects a state update response reassigned to another executor", async () => {
  const source = createWorkshopTaskSource({
    settings: { enabled: true, base_url: "https://workshop.example", access_token: "token" },
    fetchImpl: async () => jsonResponse({ data: {
      task: { id: 21, project_id: 11, content: "Reassigned", state: "in_progress", executor_id: 8 }
    } })
  });

  await assert.rejects(
    source.updateTask({ taskId: "21", projectId: "11", executorId: "7", state: "in_progress", expectedVersion: "v3" }),
    (error) => error instanceof TaskSourceError && error.code === "not_assigned"
  );
});

test("Workshop business synchronization remains closed while the task source is disabled", async () => {
  let fetchCalled = false;
  const source = createWorkshopTaskSource({
    settings: { enabled: false, base_url: "" },
    fetchImpl: async () => {
      fetchCalled = true;
      return jsonResponse({ data: {} });
    }
  });

  await assert.rejects(
    source.listProjects(),
    (error) => error instanceof TaskSourceError && error.code === "disabled"
  );
  assert.equal(fetchCalled, false);
});

test("Workshop authentication uses the built-in server even when business synchronization is disabled", async () => {
  let settings = {
    enabled: false,
    base_url: "",
    service_name: "workshop",
    auth_mode: "bearer"
  };
  const calls = [];
  const source = createWorkshopTaskSource({
    readSettings: async () => settings,
    saveSettings: async (next) => { settings = next; return settings; },
    now: () => 1_000_000,
    fetchImpl: async (url, options) => {
      calls.push({ url: String(url), options });
      if (String(url).endsWith("/send_verification")) return jsonResponse({ data: { message: "sent" } });
      if (String(url).endsWith("/login")) {
        return jsonResponse({ data: {
          user: { email: "glare@example.com" },
          tokens: { access_token: "access-1", refresh_token: "refresh-1", expires_in: 3600, refresh_expires_in: 7200 }
        } });
      }
      throw new Error(`Unexpected URL: ${url}`);
    }
  });

  const sent = await source.sendVerification({ code_type: "email", target: "glare@example.com" });
  const authentication = await source.loginWithCode({ code_type: "email", target: "glare@example.com", code: "123456" });

  assert.equal(sent.masked_target, "gl•••@example.com");
  assert.equal(calls[0].url, "https://api.feitianchengzi.com/auth-server/v1/public/send_verification");
  assert.equal(calls[1].url, "https://api.feitianchengzi.com/auth-server/v1/public/login");
  assert.deepEqual(JSON.parse(calls[0].options.body), { code_type: "email", target: "glare@example.com", purpose: "login" });
  assert.deepEqual(JSON.parse(calls[1].options.body), { email: "glare@example.com", code: "123456", code_type: "email", purpose: "login" });
  assert.equal(settings.enabled, true);
  assert.equal(settings.auth_mode, "nebula");
  assert.equal(settings.access_token, "access-1");
  assert.equal(settings.refresh_token, "refresh-1");
  assert.equal(settings.access_token_expires_at, 4_600_000);
  assert.equal(authentication.status, "authenticated");
  assert.equal(authentication.masked_identity, "gl•••@example.com");
  assert.equal("identity" in authentication, false);
  assert.equal("access_token" in authentication, false);
  assert.equal("refresh_token" in authentication, false);
});

test("Workshop task source refreshes an expiring session once across concurrent requests", async () => {
  const timestamp = 5_000_000;
  let settings = {
    enabled: true,
    base_url: "https://workshop.example",
    service_name: "workshop",
    auth_mode: "nebula",
    access_token: "old-access",
    refresh_token: "refresh-1",
    access_token_expires_at: timestamp + 1_000,
    refresh_token_expires_at: timestamp + 3_600_000
  };
  let refreshCount = 0;
  const businessHeaders = [];
  const source = createWorkshopTaskSource({
    readSettings: async () => settings,
    saveSettings: async (next) => { settings = next; return settings; },
    now: () => timestamp,
    fetchImpl: async (url, options) => {
      const pathname = new URL(url).pathname;
      if (pathname.endsWith("/refresh_token")) {
        refreshCount += 1;
        await new Promise((resolve) => setTimeout(resolve, 5));
        return jsonResponse({ data: { access_token: "new-access", refresh_token: "refresh-2", expires_in: 3600, refresh_expires_in: 7200 } });
      }
      businessHeaders.push(options.headers.Authorization);
      if (pathname.endsWith("/users")) return jsonResponse({ data: { user: { id: 1, username: "glare" } } });
      if (pathname.endsWith("/organizations")) return jsonResponse({ data: { organizations: [] } });
      if (pathname.endsWith("/projects")) return jsonResponse({ data: { projects: [] } });
      throw new Error(`Unexpected URL: ${url}`);
    }
  });

  await Promise.all([source.getCurrentUser(), source.listProjects()]);

  assert.equal(refreshCount, 1);
  assert.equal(settings.refresh_token, "refresh-2");
  assert.deepEqual(new Set(businessHeaders), new Set(["Bearer new-access"]));
});

test("Workshop task source refreshes and retries the first 401 exactly once", async () => {
  let settings = {
    enabled: true,
    base_url: "https://workshop.example",
    service_name: "workshop",
    auth_mode: "nebula",
    access_token: "old-access",
    refresh_token: "refresh-1"
  };
  let userRequests = 0;
  let refreshCount = 0;
  const headers = [];
  const source = createWorkshopTaskSource({
    readSettings: async () => settings,
    saveSettings: async (next) => { settings = next; return settings; },
    fetchImpl: async (url, options) => {
      const pathname = new URL(url).pathname;
      if (pathname.endsWith("/refresh_token")) {
        refreshCount += 1;
        return jsonResponse({ data: { access_token: "new-access", refresh_token: "refresh-2" } });
      }
      if (pathname.endsWith("/users")) {
        userRequests += 1;
        headers.push(options.headers.Authorization);
        return userRequests === 1
          ? jsonResponse({ error: { message: "expired" } }, 401)
          : jsonResponse({ data: { user: { id: 1, username: "glare" } } });
      }
      throw new Error(`Unexpected URL: ${url}`);
    }
  });

  assert.equal((await source.getCurrentUser()).name, "glare");
  assert.equal(refreshCount, 1);
  assert.equal(userRequests, 2);
  assert.deepEqual(headers, ["Bearer old-access", "Bearer new-access"]);
});

test("Workshop logout clears both tokens and projects a logged-out state", async () => {
  let settings = {
    enabled: true,
    base_url: "https://workshop.example",
    auth_mode: "nebula",
    access_token: "access",
    refresh_token: "refresh",
    username: "glare@example.com"
  };
  const source = createWorkshopTaskSource({
    readSettings: async () => settings,
    saveSettings: async (next) => { settings = next; return settings; }
  });

  const authentication = await source.logout();

  assert.equal(settings.access_token, "");
  assert.equal(settings.refresh_token, "");
  assert.equal(settings.username, "");
  assert.equal(authentication.status, "logged_out");
  assert.equal(authentication.authenticated, false);
});

test("logout cannot be overwritten by an in-flight token refresh", async () => {
  let settings = {
    enabled: true,
    base_url: "https://workshop.example",
    auth_mode: "nebula",
    access_token: "old-access",
    refresh_token: "old-refresh",
    access_token_expires_at: 1,
    username: "glare@example.com"
  };
  let releaseRefresh;
  let markRefreshStarted;
  const refreshStarted = new Promise((resolve) => { markRefreshStarted = resolve; });
  const source = createWorkshopTaskSource({
    readSettings: async () => settings,
    saveSettings: async (next) => { settings = next; return settings; },
    now: () => 10_000,
    fetchImpl: async (url) => {
      if (new URL(url).pathname.endsWith("/refresh_token")) {
        markRefreshStarted();
        await new Promise((resolve) => { releaseRefresh = resolve; });
        return jsonResponse({ data: { access_token: "resurrected-access", refresh_token: "resurrected-refresh" } });
      }
      throw new Error(`Unexpected URL: ${url}`);
    }
  });

  const request = source.getCurrentUser();
  await refreshStarted;
  await source.logout();
  releaseRefresh();
  await assert.rejects(request, (error) => error instanceof TaskSourceError && error.code === "unauthenticated");

  assert.equal(settings.auth_state, "logged_out");
  assert.equal(settings.access_token, "");
  assert.equal(settings.refresh_token, "");
});

function jsonResponse(payload, status = 200) {
  return new Response(JSON.stringify(payload), {
    status,
    headers: { "content-type": "application/json" }
  });
}
