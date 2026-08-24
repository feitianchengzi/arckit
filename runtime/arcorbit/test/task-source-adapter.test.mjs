import assert from "node:assert/strict";
import test from "node:test";
import { createWorkshopTaskSource, normalizeTask, TaskSourceError } from "../src/task-source-adapter.mjs";

test("Workshop task normalization preserves complete detail metadata", () => {
  const task = normalizeTask({
    id: 21,
    project_id: 11,
    content: "Ship Work detail",
    state: "completed",
    creator_id: 7,
    executor_id: 8,
    creator: { id: 7, username: "glare" },
    executor: { id: 8, username: "lin" },
    tags: "3,4",
    created_at: "2026-08-20T01:00:00Z",
    updated_at: "2026-08-21T02:00:00Z",
    completion_at: "2026-08-21T03:00:00Z"
  });

  assert.equal(task.creator.username, "glare");
  assert.equal(task.assignee.username, "lin");
  assert.equal(task.completion_at, "2026-08-21T03:00:00Z");
  assert.equal(task.created_at, "2026-08-20T01:00:00Z");
  assert.equal(task.updated_at, "2026-08-21T02:00:00Z");
  assert.equal(task.tags, "3,4");
});

test("Workshop task normalization keeps content lossless and derives one bounded display title", () => {
  const content = `  第一行\n\t${"👨‍👩‍👧‍👦".repeat(65)}  `;
  const task = normalizeTask({ id: 21, project_id: 11, content, state: "pending" });

  assert.equal(task.content, content);
  assert.equal(task.title, task.display_title);
  assert.equal(task.title.startsWith("第一行 "), true);
  assert.equal(task.title.endsWith("…"), true);
  assert.equal([...new Intl.Segmenter(undefined, { granularity: "grapheme" }).segment(task.title)].length, 64);
});

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

test("Workshop task source recovers the stable current-user id from the accepted Nebula access token", async () => {
  const accessToken = testJwt({ token_type: "access", user_id: 7, sub: "7", username: "glare" });
  const source = createWorkshopTaskSource({
    settings: {
      enabled: true,
      base_url: "https://workshop.example",
      service_name: "workshop",
      auth_mode: "nebula",
      access_token: accessToken,
      refresh_token: "refresh-1"
    },
    fetchImpl: async (url) => {
      assert.equal(new URL(url).pathname.endsWith("/users"), true);
      return jsonResponse({ data: { user: { username: "glare", avatar: "avatar.png" } } });
    }
  });

  const user = await source.getCurrentUser();
  assert.equal(user.id, "7");
  assert.equal(user.name, "glare");
  assert.deepEqual(user.raw, { username: "glare", avatar: "avatar.png" });
});

test("Workshop task source rejects conflicting or malformed Nebula identity claims", async () => {
  const createSource = (accessToken) => createWorkshopTaskSource({
    settings: {
      enabled: true,
      base_url: "https://workshop.example",
      service_name: "workshop",
      auth_mode: "nebula",
      access_token: accessToken,
      refresh_token: "refresh-1"
    },
    fetchImpl: async () => jsonResponse({ data: { user: { username: "glare" } } })
  });

  assert.equal((await createSource(testJwt({ token_type: "access", user_id: 7, sub: "8" })).getCurrentUser()).id, "");
  assert.equal((await createSource("not-a-jwt").getCurrentUser()).id, "");
  assert.equal((await createSource(testJwt({ token_type: "refresh", user_id: 7, sub: "7" })).getCurrentUser()).id, "");
});

test("Workshop task source rejects a current-user response completed after logout", async () => {
  let settings = {
    enabled: true,
    base_url: "https://workshop.example",
    service_name: "workshop",
    auth_mode: "nebula",
    access_token: testJwt({ token_type: "access", user_id: 7, sub: "7" }),
    refresh_token: "refresh-1"
  };
  let releaseUserRequest;
  let markUserRequestStarted;
  const userRequestStarted = new Promise((resolve) => { markUserRequestStarted = resolve; });
  const source = createWorkshopTaskSource({
    readSettings: async () => settings,
    saveSettings: async (next) => { settings = next; return settings; },
    fetchImpl: async (url) => {
      assert.equal(new URL(url).pathname.endsWith("/users"), true);
      markUserRequestStarted();
      await new Promise((resolve) => { releaseUserRequest = resolve; });
      return jsonResponse({ data: { user: { username: "glare" } } });
    }
  });

  const currentUser = source.getCurrentUser();
  await userRequestStarted;
  await source.logout();
  releaseUserRequest();

  await assert.rejects(
    currentUser,
    (error) => error instanceof TaskSourceError && error.code === "unauthenticated"
  );
});

test("Workshop platform adapter reads organizations, members, full project tasks, and V1 feedback without widening automation tasks", async () => {
  const source = createWorkshopTaskSource({
    settings: { enabled: true, base_url: "https://workshop.example", access_token: "secret", username: "glare" },
    fetchImpl: async (url) => {
      const target = new URL(url);
      if (target.pathname.endsWith("/organizations/31/members")) {
        return jsonResponse({ data: { members: [{ id: 91, user_id: 7, username: "glare", role: "owner", is_me: true }] } });
      }
      if (target.pathname.endsWith("/organizations")) {
        return jsonResponse({ data: { organizations: [{ id: 31, name: "Arckit", creator_id: 7 }] } });
      }
      if (target.pathname.endsWith("/projects")) {
        const organizationId = target.searchParams.get("organization_id");
        return jsonResponse({ data: { projects: organizationId ? [{
          id: 12,
          name: "Runtime",
          members: [
            { id: 92, user_id: 7, username: "glare", role: "owner", is_me: true, duty: "Engineering" },
            { id: 93, user_id: 8, username: "teammate", role: "member" }
          ]
        }] : [] } });
      }
      if (target.pathname.endsWith("/tasks")) {
        return jsonResponse({ data: { tasks: [
          { id: 21, project_id: 12, content: "Mine", state: "pending", executor_id: 7 },
          { id: 22, project_id: 12, content: "Teammate", state: "in_progress", executor_id: 8 }
        ] } });
      }
      if (target.pathname.endsWith("/feedbacks")) {
        return jsonResponse({ data: { feedbacks: [{
          id: 51,
          project_id: 12,
          short_id: "FB-51",
          title: "Improve queue",
          content: "Needs grouping",
          data: JSON.stringify({ priority: "P1", ignored: false, task_id: 21 })
        }] } });
      }
      throw new Error(`Unexpected URL: ${url}`);
    }
  });

  assert.deepEqual((await source.platform.listOrganizations()).map((item) => item.id), ["31"]);
  assert.equal((await source.platform.listOrganizationMembers("31"))[0].role, "owner");
  assert.equal((await source.listProjects()).find((project) => project.id === "12").raw.organization_id, "31");
  const members = await source.platform.listProjectMembers("12");
  assert.deepEqual(members.map((item) => item.user_id), ["7", "8"]);
  const platformTasks = await source.platform.listProjectTasks("12");
  assert.deepEqual(platformTasks.map((item) => item.id), ["21", "22"]);
  const automationTasks = await source.listTasks("12");
  assert.deepEqual(automationTasks.map((item) => item.id), ["21"]);
  const feedback = await source.platform.listFeedbackV1("12");
  assert.equal(feedback[0].priority, "P1");
  assert.equal(feedback[0].linked_task_id, "21");
});

test("Workshop task source routes Feedback V2 through the authenticated fixed user namespace", async () => {
  const calls = [];
  const source = createWorkshopTaskSource({
    settings: {
      enabled: true,
      base_url: "https://workshop.example",
      service_name: "workshop",
      auth_mode: "bearer",
      access_token: "secret"
    },
    feedbackV2ProjectIds: "11",
    feedbackV2NotificationProjectIds: "11",
    fetchImpl: async (url, options) => {
      calls.push({ url: String(url), options });
      return jsonResponse({ data: { feedbacks: [{ id: 51, project_id: 11, data: "{}" }] } });
    }
  });

  const feedback = await source.platform.listFeedbackV2("11");
  assert.equal(feedback[0].feedback_source, "v2");
  const target = new URL(calls[0].url);
  assert.equal(target.pathname, "/workshop/v2/user/feedbacks");
  assert.equal(target.searchParams.get("project_id"), "11");
  assert.equal(calls[0].options.headers.Authorization, "Bearer secret");
  assert.equal(calls[0].options.body, undefined);
});

test("Workshop task source probes Feedback V2 for every project by default and permits explicit narrowing", () => {
  const previousProjectIds = process.env.ARCORBIT_FEEDBACK_V2_PROJECT_IDS;
  const previousNotificationProjectIds = process.env.ARCORBIT_FEEDBACK_V2_NOTIFICATION_PROJECT_IDS;
  delete process.env.ARCORBIT_FEEDBACK_V2_PROJECT_IDS;
  delete process.env.ARCORBIT_FEEDBACK_V2_NOTIFICATION_PROJECT_IDS;

  try {
    const settings = {
      enabled: true,
      base_url: "https://workshop.example",
      service_name: "workshop",
      auth_mode: "bearer",
      access_token: "secret"
    };
    const defaultProbe = createWorkshopTaskSource({ settings, fetchImpl: async () => jsonResponse({}) });
    const narrowed = createWorkshopTaskSource({
      settings,
      feedbackV2ProjectIds: "12",
      feedbackV2NotificationProjectIds: "12",
      fetchImpl: async () => jsonResponse({})
    });

    assert.equal(defaultProbe.platform.isFeedbackV2ProjectEnabled("11"), true);
    assert.equal(defaultProbe.platform.isFeedbackV2NotificationsProjectEnabled("11"), true);
    assert.equal(narrowed.platform.isFeedbackV2ProjectEnabled("11"), false);
    assert.equal(narrowed.platform.isFeedbackV2NotificationsProjectEnabled("11"), false);
    assert.equal(narrowed.platform.isFeedbackV2ProjectEnabled("12"), true);
  } finally {
    if (previousProjectIds === undefined) delete process.env.ARCORBIT_FEEDBACK_V2_PROJECT_IDS;
    else process.env.ARCORBIT_FEEDBACK_V2_PROJECT_IDS = previousProjectIds;
    if (previousNotificationProjectIds === undefined) delete process.env.ARCORBIT_FEEDBACK_V2_NOTIFICATION_PROJECT_IDS;
    else process.env.ARCORBIT_FEEDBACK_V2_NOTIFICATION_PROJECT_IDS = previousNotificationProjectIds;
  }
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

test("Workshop realtime connection and replay stay behind the authenticated task-source boundary", async () => {
  const calls = [];
  const source = createWorkshopTaskSource({
    settings: {
      enabled: true,
      base_url: "https://workshop.example",
      service_name: "workshop",
      auth_mode: "bearer",
      access_token: "secret"
    },
    fetchImpl: async (url, options) => {
      calls.push({ url: String(url), options });
      return jsonResponse({ data: { events: [{ id: 8, event: "task.updated", project_id: 12 }], next_after_id: 8, has_more: false } });
    }
  });

  const connection = await source.realtimeConnection("12");
  assert.equal(connection.url, "wss://workshop.example/workshop/v1/user/projects/12/ws");
  assert.deepEqual(connection.protocols, ["workshop-ws", "nebula-auth.secret"]);
  assert.equal(connection.headers.Authorization, "Bearer secret");
  const replay = await source.listProjectEvents("12", { afterId: 7, limit: 50 });
  assert.equal(replay.events[0].id, 8);
  const replayUrl = new URL(calls[0].url);
  assert.equal(replayUrl.pathname, "/workshop/v1/user/projects/12/events");
  assert.equal(replayUrl.searchParams.get("after_id"), "7");
});

test("Workshop replay exposes an expired cursor as a stable adapter error", async () => {
  const source = createWorkshopTaskSource({
    settings: { enabled: true, base_url: "https://workshop.example", access_token: "secret" },
    fetchImpl: async () => jsonResponse({ code: "EVENT_CURSOR_EXPIRED", error: { message: "expired" } }, 410)
  });
  await assert.rejects(
    source.listProjectEvents("12", { afterId: 7 }),
    (error) => error instanceof TaskSourceError && error.code === "cursor_expired"
  );
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
  assert.equal(settings.last_login_activity_at, 1_000_000);
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
  assert.equal(settings.last_login_activity_at, timestamp);
  assert.deepEqual(new Set(businessHeaders), new Set(["Bearer new-access"]));
});

test("Workshop startup recovery rotates a session within the seven-day activity window", async () => {
  const day = 24 * 60 * 60_000;
  let timestamp = 20 * day;
  let settings = {
    enabled: true,
    base_url: "https://workshop.example",
    service_name: "workshop",
    auth_mode: "nebula",
    access_token: "old-access",
    refresh_token: "refresh-1",
    access_token_expires_at: timestamp + day,
    refresh_token_expires_at: timestamp + 14 * day,
    last_login_activity_at: timestamp - 7 * day
  };
  let refreshCount = 0;
  let releaseStartupRefresh;
  let markStartupRefreshStarted;
  const startupRefreshStarted = new Promise((resolve) => { markStartupRefreshStarted = resolve; });
  const source = createWorkshopTaskSource({
    readSettings: async () => settings,
    saveSettings: async (next) => { settings = next; return settings; },
    now: () => timestamp,
    fetchImpl: async (url) => {
      const pathname = new URL(url).pathname;
      if (pathname.endsWith("/users")) return jsonResponse({ data: { user: { id: 1, username: "glare" } } });
      assert.equal(pathname.endsWith("/refresh_token"), true);
      refreshCount += 1;
      markStartupRefreshStarted();
      await new Promise((resolve) => { releaseStartupRefresh = resolve; });
      return jsonResponse({ data: {
        access_token: `access-${refreshCount + 1}`,
        refresh_token: `refresh-${refreshCount + 1}`,
        expires_in: 3600,
        refresh_expires_in: 7 * 24 * 60 * 60
      } });
    }
  });

  const firstStatus = source.getAuthStatus();
  await startupRefreshStarted;
  let secondSettled = false;
  const secondStatus = source.getAuthStatus().then((value) => {
    secondSettled = true;
    return value;
  });
  await Promise.resolve();
  assert.equal(secondSettled, false);
  releaseStartupRefresh();
  const [first, second] = await Promise.all([firstStatus, secondStatus]);

  assert.equal(first.status, "authenticated");
  assert.equal(second.status, "authenticated");
  assert.equal(refreshCount, 1);
  assert.equal(settings.refresh_token, "refresh-2");
  assert.equal(settings.last_login_activity_at, timestamp);

  const firstActivityAt = settings.last_login_activity_at;
  timestamp += 30 * 60_000;
  assert.equal((await source.getCurrentUser()).name, "glare");
  assert.equal(settings.last_login_activity_at, firstActivityAt);

  timestamp += 6 * day;
  const restartedSource = createWorkshopTaskSource({
    readSettings: async () => settings,
    saveSettings: async (next) => { settings = next; return settings; },
    now: () => timestamp,
    fetchImpl: async (url) => {
      assert.equal(new URL(url).pathname.endsWith("/refresh_token"), true);
      refreshCount += 1;
      return jsonResponse({ data: {
        access_token: `access-${refreshCount + 1}`,
        refresh_token: `refresh-${refreshCount + 1}`,
        expires_in: 3600,
        refresh_expires_in: 7 * 24 * 60 * 60
      } });
    }
  });

  assert.equal((await restartedSource.getAuthStatus()).status, "authenticated");
  assert.equal(refreshCount, 2);
  assert.equal(settings.refresh_token, "refresh-3");
  assert.equal(settings.last_login_activity_at, timestamp);
});

test("Workshop startup recovery migrates a legacy session without a local activity timestamp", async () => {
  const timestamp = 30_000_000;
  let settings = {
    enabled: true,
    base_url: "https://workshop.example",
    auth_mode: "nebula",
    access_token: "legacy-access",
    refresh_token: "legacy-refresh",
    refresh_token_expires_at: timestamp + 60_000
  };
  let refreshCount = 0;
  const source = createWorkshopTaskSource({
    readSettings: async () => settings,
    saveSettings: async (next) => { settings = next; return settings; },
    now: () => timestamp,
    fetchImpl: async () => {
      refreshCount += 1;
      return jsonResponse({ data: { access_token: "migrated-access", refresh_token: "migrated-refresh", refresh_expires_in: 604800 } });
    }
  });

  assert.equal((await source.getAuthStatus()).status, "authenticated");
  assert.equal(refreshCount, 1);
  assert.equal(settings.last_login_activity_at, timestamp);
  assert.equal(settings.refresh_token, "migrated-refresh");
});

test("Workshop startup recovery expires a partial session missing its refresh credential", async () => {
  const timestamp = 30_000_000;
  let settings = {
    enabled: true,
    base_url: "https://workshop.example",
    auth_mode: "nebula",
    auth_state: "authenticated",
    access_token: "still-valid-access",
    refresh_token: "",
    access_token_expires_at: timestamp + 60 * 60_000,
    last_login_activity_at: timestamp - 60_000
  };
  let fetchCalled = false;
  const source = createWorkshopTaskSource({
    readSettings: async () => settings,
    saveSettings: async (next) => { settings = next; return settings; },
    now: () => timestamp,
    fetchImpl: async () => {
      fetchCalled = true;
      return jsonResponse({});
    }
  });

  const authentication = await source.getAuthStatus();

  assert.equal(fetchCalled, false);
  assert.equal(authentication.status, "expired");
  assert.equal(authentication.authenticated, false);
  assert.equal(authentication.can_refresh, false);
  assert.equal(settings.access_token, "");
  assert.equal(settings.refresh_token, "");
  assert.equal(settings.last_login_activity_at, 0);
});

test("Workshop expires a session only after more than seven days without valid login activity", async () => {
  const day = 24 * 60 * 60_000;
  const timestamp = 20 * day;
  let settings = {
    enabled: true,
    base_url: "https://workshop.example",
    auth_mode: "nebula",
    access_token: "old-access",
    refresh_token: "refresh-1",
    refresh_token_expires_at: timestamp + day,
    last_login_activity_at: timestamp - 7 * day - 1
  };
  let fetchCalled = false;
  const source = createWorkshopTaskSource({
    readSettings: async () => settings,
    saveSettings: async (next) => { settings = next; return settings; },
    now: () => timestamp,
    fetchImpl: async () => {
      fetchCalled = true;
      return jsonResponse({});
    }
  });

  const authentication = await source.getAuthStatus();

  assert.equal(fetchCalled, false);
  assert.equal(authentication.status, "expired");
  assert.equal(authentication.can_refresh, false);
  assert.equal(settings.access_token, "");
  assert.equal(settings.refresh_token, "");
  assert.equal(settings.last_login_activity_at, 0);
});

test("Workshop preserves a recoverable startup session after a transient refresh failure", async () => {
  const day = 24 * 60 * 60_000;
  const timestamp = 20 * day;
  let settings = {
    enabled: true,
    base_url: "https://workshop.example",
    auth_mode: "nebula",
    access_token: "old-access",
    refresh_token: "refresh-1",
    refresh_token_expires_at: timestamp + day,
    last_login_activity_at: timestamp - 6 * day
  };
  const source = createWorkshopTaskSource({
    readSettings: async () => settings,
    saveSettings: async (next) => { settings = next; return settings; },
    now: () => timestamp,
    fetchImpl: async () => { throw new Error("temporary network outage"); }
  });

  const authentication = await source.getAuthStatus();

  assert.equal(authentication.status, "authenticated");
  assert.equal(authentication.can_refresh, true);
  assert.match(authentication.error, /temporary network outage/);
  assert.equal(settings.access_token, "old-access");
  assert.equal(settings.refresh_token, "refresh-1");
  assert.equal(settings.last_login_activity_at, timestamp - 6 * day);
});

test("Workshop preserves a recoverable startup session after an authentication service failure", async () => {
  const day = 24 * 60 * 60_000;
  const timestamp = 20 * day;
  let settings = {
    enabled: true,
    base_url: "https://workshop.example",
    auth_mode: "nebula",
    access_token: "old-access",
    refresh_token: "refresh-1",
    refresh_token_expires_at: timestamp + day,
    last_login_activity_at: timestamp - 6 * day
  };
  const source = createWorkshopTaskSource({
    readSettings: async () => settings,
    saveSettings: async (next) => { settings = next; return settings; },
    now: () => timestamp,
    fetchImpl: async () => jsonResponse({ error: { message: "service temporarily unavailable" } }, 503)
  });

  const authentication = await source.getAuthStatus();

  assert.equal(authentication.status, "authenticated");
  assert.match(authentication.error, /temporarily unavailable/);
  assert.equal(settings.access_token, "old-access");
  assert.equal(settings.refresh_token, "refresh-1");
});

test("Workshop clears a startup session explicitly rejected by the authentication server", async () => {
  const day = 24 * 60 * 60_000;
  const timestamp = 20 * day;
  let settings = {
    enabled: true,
    base_url: "https://workshop.example",
    auth_mode: "nebula",
    access_token: "old-access",
    refresh_token: "revoked-refresh",
    refresh_token_expires_at: timestamp + day,
    last_login_activity_at: timestamp - day
  };
  const source = createWorkshopTaskSource({
    readSettings: async () => settings,
    saveSettings: async (next) => { settings = next; return settings; },
    now: () => timestamp,
    fetchImpl: async () => jsonResponse({ error: { message: "refresh token revoked" } }, 401)
  });

  const authentication = await source.getAuthStatus();

  assert.equal(authentication.status, "expired");
  assert.equal(authentication.can_refresh, false);
  assert.equal(settings.access_token, "");
  assert.equal(settings.refresh_token, "");
  assert.equal(settings.last_login_activity_at, 0);
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

function testJwt(payload) {
  const encode = (value) => Buffer.from(JSON.stringify(value)).toString("base64url");
  return `${encode({ alg: "RS256", typ: "JWT" })}.${encode(payload)}.test-signature`;
}
