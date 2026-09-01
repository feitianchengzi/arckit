#!/usr/bin/env node

const http = require("http");
const https = require("https");
const { randomBytes } = require("crypto");

const BASE_URL = process.env.BASE_URL || "http://localhost:8081/workshop/v1";
const WS_BASE_URL = BASE_URL.replace(/^http/, "ws");
const SERVICE_NAME =
  process.env.SERVICE_NAME ||
  (() => {
    try {
      const parts = new URL(BASE_URL).pathname.split("/").filter(Boolean);
      return parts[0] || "todo";
    } catch (_) {
      return "todo";
    }
  })();
const WS_SUBPROTOCOL =
  process.env.WS_SUBPROTOCOL || `${SERVICE_NAME}-ws`;

const users = {
  u1: { id: "11111111-1111-1111-1111-111111111111", name: "alice" },
  u2: { id: "22222222-2222-2222-2222-222222222222", name: "bob" },
  u3: { id: "33333333-3333-3333-3333-333333333333", name: "carol" },
};

let pass = 0;
let fail = 0;

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function waitForHealth(retries = 10, delayMs = 1000) {
  const url = `${BASE_URL}/public/health`;
  for (let i = 0; i < retries; i++) {
    try {
      const res = await fetch(url);
      if (res.ok) return true;
    } catch (_) {
      // ignore
    }
    await sleep(delayMs);
  }
  return false;
}

async function request(userKey, method, path, body) {
  const user = users[userKey];
  if (!user) throw new Error(`unknown user: ${userKey}`);
  const headers = {
    "X-User-ID": user.id,
    "X-User-Username": user.name,
  };
  const options = { method, headers };
  if (body !== undefined) {
    headers["Content-Type"] = "application/json";
    options.body = typeof body === "string" ? body : JSON.stringify(body);
  }

  const res = await fetch(`${BASE_URL}${path}`, options);
  const text = await res.text();
  let json = null;
  try {
    json = JSON.parse(text);
  } catch (_) {
    // non-json
  }
  return { status: res.status, text, json };
}

function connectWebSocket(projectId, userKey) {
  const user = users[userKey];
  if (!user) throw new Error(`unknown user: ${userKey}`);
  const url = `${WS_BASE_URL}/user/projects/${projectId}/ws`;
  const headers = {
    "X-User-ID": user.id,
    "X-User-Username": user.name,
    Origin: "http://localhost",
  };

  return new Promise((resolve, reject) => {
    let ws;
    try {
      ws = new WebSocket(url, [WS_SUBPROTOCOL], { headers });
    } catch (err) {
      reject(err);
      return;
    }

    const queue = [];
    const waiters = [];

    function onEvent(evt) {
      queue.push(evt);
      for (let i = 0; i < waiters.length; i++) {
        const waiter = waiters[i];
        const idx = queue.findIndex((e) => waiter.match(e));
        if (idx >= 0) {
          const hit = queue.splice(idx, 1)[0];
          clearTimeout(waiter.timer);
          waiters.splice(i, 1);
          waiter.resolve(hit);
          break;
        }
      }
    }

    ws.onmessage = (msg) => {
      const raw = msg.data;
      let data = null;
      try {
        data = JSON.parse(typeof raw === "string" ? raw : raw.toString());
      } catch (_) {
        // ignore non-json
      }
      if (data && data.event) {
        onEvent(data);
      }
    };

    ws.onopen = () => {
      resolve({
        ws,
        waitForEvent(eventName, timeoutMs = 5000) {
          const match = (e) => e.event === eventName;
          const idx = queue.findIndex(match);
          if (idx >= 0) {
            const hit = queue.splice(idx, 1)[0];
            return Promise.resolve(hit);
          }
          return new Promise((res, rej) => {
            const timer = setTimeout(() => {
              const err = new Error(`timeout waiting for event: ${eventName}`);
              rej(err);
            }, timeoutMs);
            waiters.push({ match, resolve: res, timer });
          });
        },
        close() {
          try {
            ws.close();
          } catch (_) {
            // ignore
          }
        },
      });
    };

    ws.onerror = (err) => {
      reject(err);
    };

    ws.onclose = () => {
      // no-op
    };
  });
}

async function wsUpgradeStatus(url, headers) {
  const u = new URL(url);
  const key = randomBytes(16).toString("base64");
  const baseHeaders = {
    Connection: "Upgrade",
    Upgrade: "websocket",
    "Sec-WebSocket-Key": key,
    "Sec-WebSocket-Version": "13",
  };
  const finalHeaders = { ...baseHeaders, ...headers };
  const lib = u.protocol === "https:" || u.protocol === "wss:" ? https : http;
  return new Promise((resolve, reject) => {
    const req = lib.request(
      {
        method: "GET",
        hostname: u.hostname,
        port: u.port,
        path: `${u.pathname}${u.search}`,
        headers: finalHeaders,
      },
      (res) => {
        res.resume();
        resolve(res.statusCode);
      }
    );
    req.on("upgrade", (res, socket) => {
      socket.destroy();
      resolve(res.statusCode || 101);
    });
    req.on("error", (err) => reject(err));
    req.end();
  });
}

function checkCode(label, expected, resp) {
  const code = resp?.json?.code;
  if (code === expected) {
    console.log(`PASS: ${label}`);
    pass += 1;
  } else {
    console.log(`FAIL: ${label} (expected=${expected} got=${code})`);
    if (resp?.json) {
      console.log(JSON.stringify(resp.json));
    } else {
      console.log(resp?.text || "<empty response>");
    }
    fail += 1;
  }
}

function checkNotOk(label, resp) {
  const code = resp?.json?.code;
  if (code && code !== "OK") {
    console.log(`PASS: ${label} (blocked with ${code})`);
    pass += 1;
  } else {
    console.log(`FAIL: ${label} (unexpected OK)`);
    if (resp?.json) {
      console.log(JSON.stringify(resp.json));
    }
    fail += 1;
  }
}

(async () => {
  console.log("== Health ==");
  const ok = await waitForHealth();
  if (!ok) {
    console.log(`FAIL: health not reachable at ${BASE_URL}/public/health`);
    process.exit(1);
  }
  let resp = await request("u1", "GET", "/public/health");
  checkCode("health", "OK", resp);

  resp = await request("u1", "GET", "/user/header-info");
  checkCode("header-info user", "OK", resp);

  resp = await request("u1", "GET", "/apikey/header-info");
  checkCode("header-info apikey", "OK", resp);

  console.log("== Users ==");
  resp = await request("u1", "POST", "/user/users", { username: "alice", avatar: "https://example.com/alice.png" });
  checkCode("create user1", "OK", resp);

  resp = await request("u2", "POST", "/user/users", { username: "bob", avatar: "https://example.com/bob.png" });
  checkCode("create user2", "OK", resp);

  resp = await request("u3", "POST", "/user/users", { username: "carol", avatar: "https://example.com/carol.png" });
  checkCode("create user3", "OK", resp);

  resp = await request("u1", "GET", "/user/users");
  checkCode("get user1", "OK", resp);

  resp = await request("u1", "PUT", "/user/users", { avatar: "https://example.com/alice2.png" });
  checkCode("update user1", "OK", resp);

  resp = await request("u1", "PUT", "/user/users", {});
  checkCode("update user1 missing fields", "USER_MISSING_FIELDS", resp);

  resp = await request("u1", "GET", "/user/oss/credentials");
  if (resp?.json?.code === "OK") {
    console.log("PASS: get oss credentials");
    pass += 1;
  } else {
    console.log("WARN: get oss credentials failed");
    console.log(resp?.json ? JSON.stringify(resp.json) : resp.text);
  }

  console.log("== Organization ==");
  resp = await request("u1", "POST", "/user/organizations", { name: "Test Org", description: "Org for API tests" });
  checkCode("create organization", "OK", resp);
  const ORG_ID = resp?.json?.data?.id;
  if (!ORG_ID) {
    console.log("FAIL: ORG_ID missing, aborting remaining tests");
    process.exit(1);
  }
  console.log(`ORG_ID=${ORG_ID}`);

  resp = await request("u1", "GET", `/user/organizations?page=1&page_size=10`);
  checkCode("list organizations", "OK", resp);

  resp = await request("u1", "GET", `/user/organizations/${ORG_ID}/members?page=1&page_size=10`);
  checkCode("list org members", "OK", resp);
  const members = resp?.json?.data?.members || [];
  const me = members.find((m) => m.is_me);
  const ORG_MEMBER_ID_U1 = me?.id;
  const USER1_NUM_ID = me?.user_id;
  console.log(`ORG_MEMBER_ID_U1=${ORG_MEMBER_ID_U1} USER1_NUM_ID=${USER1_NUM_ID}`);

  resp = await request("u1", "PUT", `/user/organizations/${ORG_ID}`, { name: "Test Org Updated", description: "Updated" });
  checkCode("update organization", "OK", resp);

  resp = await request("u1", "POST", `/user/organizations/${ORG_ID}/invitations`, { role: "member", expires_in: 24, max_uses: 2 });
  checkCode("invite org member", "OK", resp);
  const ORG_INVITE_CODE = resp?.json?.data?.invite_code;
  console.log(`ORG_INVITE_CODE=${ORG_INVITE_CODE}`);

  resp = await request("u2", "POST", `/user/organizations/join`, { invite_code: ORG_INVITE_CODE });
  checkCode("join org user2", "OK", resp);
  const ORG_MEMBER_ID_U2 = resp?.json?.data?.id;
  const USER2_NUM_ID = resp?.json?.data?.user_id;
  console.log(`ORG_MEMBER_ID_U2=${ORG_MEMBER_ID_U2} USER2_NUM_ID=${USER2_NUM_ID}`);

  resp = await request("u1", "POST", `/user/organizations/${ORG_ID}/invitations`, { role: "member", expires_in: 24, max_uses: 1 });
  checkCode("invite org member 2", "OK", resp);
  const ORG_INVITE_CODE2 = resp?.json?.data?.invite_code;
  console.log(`ORG_INVITE_CODE2=${ORG_INVITE_CODE2}`);

  resp = await request("u3", "POST", `/user/organizations/join`, { invite_code: ORG_INVITE_CODE2 });
  checkCode("join org user3", "OK", resp);
  const ORG_MEMBER_ID_U3 = resp?.json?.data?.id;
  const USER3_NUM_ID = resp?.json?.data?.user_id;
  console.log(`ORG_MEMBER_ID_U3=${ORG_MEMBER_ID_U3} USER3_NUM_ID=${USER3_NUM_ID}`);

  resp = await request("u1", "PUT", `/user/organizations/${ORG_ID}/members/role`, { target_user_id: USER2_NUM_ID, role: "admin" });
  checkCode("set org role user2 admin", "OK", resp);

  resp = await request("u2", "PUT", `/user/organizations/${ORG_ID}/members/role`, { target_user_id: USER3_NUM_ID, role: "admin" });
  checkCode("org role update by non-owner", "ORGANIZATION_NO_PERMISSION", resp);

  console.log("== Project ==");
  resp = await request("u1", "POST", `/user/projects`, { name: "API Test Project", git_url: "https://github.com/example/repo.git", organization_id: ORG_ID });
  checkCode("create project", "OK", resp);
  const PROJECT_ID = resp?.json?.data?.id;
  if (!PROJECT_ID) {
    console.log("FAIL: PROJECT_ID missing, aborting remaining tests");
    process.exit(1);
  }
  console.log(`PROJECT_ID=${PROJECT_ID}`);

  console.log("== WebSocket ==");
  let wsClient = null;
  let wsClient2 = null;
  try {
    const nonMemberStatus = await wsUpgradeStatus(
      `${WS_BASE_URL}/user/projects/${PROJECT_ID}/ws`,
      {
        "X-User-ID": users.u3.id,
        "X-User-Username": users.u3.name,
        "Sec-WebSocket-Protocol": WS_SUBPROTOCOL,
        Origin: "http://localhost",
      }
    );
    if (nonMemberStatus === 403) {
      console.log("PASS: ws non-member forbidden (403)");
      pass += 1;
    } else {
      console.log(`FAIL: ws non-member expected 403 got ${nonMemberStatus}`);
      fail += 1;
    }

    wsClient = await connectWebSocket(PROJECT_ID, "u1");
    await wsClient.waitForEvent("system.connected", 5000);
    console.log("PASS: ws connected");
    pass += 1;

    wsClient.close();
    await sleep(200);
    wsClient = await connectWebSocket(PROJECT_ID, "u1");
    await wsClient.waitForEvent("system.connected", 5000);
    console.log("PASS: ws reconnect");
    pass += 1;
  } catch (err) {
    console.log(`FAIL: ws connect (${err?.message || err})`);
    fail += 1;
  }

  async function expectEvent(name, label) {
    if (!wsClient) {
      console.log(`SKIP: ${label || name} (ws not connected)`);
      return;
    }
    try {
      await wsClient.waitForEvent(name, 5000);
      console.log(`PASS: ws event ${label || name}`);
      pass += 1;
    } catch (err) {
      console.log(`FAIL: ws event ${label || name} (${err?.message || err})`);
      fail += 1;
    }
  }

  resp = await request("u1", "GET", `/user/projects?page=1&page_size=10`);
  checkCode("list user projects", "OK", resp);

  resp = await request("u1", "PUT", `/user/projects/${PROJECT_ID}`, { name: "API Test Project Updated", git_url: "https://github.com/example/repo2.git" });
  checkCode("update project", "OK", resp);
  await expectEvent("project.updated", "project.updated");

  resp = await request("u1", "POST", `/user/projects/${PROJECT_ID}/invitations`, { role: "member", expires_in: 24, max_uses: 1 });
  checkCode("invite project member", "OK", resp);
  await expectEvent("project_invitation.created", "project_invitation.created");
  const PROJ_INVITE_CODE = resp?.json?.data?.invite_code;
  console.log(`PROJ_INVITE_CODE=${PROJ_INVITE_CODE}`);

  resp = await request("u2", "POST", `/user/projects/join`, { invite_code: PROJ_INVITE_CODE });
  checkCode("join project user2", "OK", resp);
  await expectEvent("project_member.created", "project_member.created (join)");

  try {
    wsClient2 = await connectWebSocket(PROJECT_ID, "u2");
    await wsClient2.waitForEvent("system.connected", 5000);
    console.log("PASS: ws connected (u2)");
    pass += 1;
  } catch (err) {
    console.log(`FAIL: ws connect u2 (${err?.message || err})`);
    fail += 1;
  }

  resp = await request("u1", "POST", `/user/projects/${PROJECT_ID}/members`, { organization_member_id: ORG_MEMBER_ID_U3 });
  checkCode("add project member by org member id", "OK", resp);
  await expectEvent("project_member.created", "project_member.created (org add)");

  resp = await request("u1", "PUT", `/user/projects/${PROJECT_ID}/members/role`, { target_user_id: USER2_NUM_ID, role: "admin" });
  checkCode("set project role user2 admin", "OK", resp);
  await expectEvent("project_member.updated", "project_member.updated");

  resp = await request("u2", "PUT", `/user/projects/${PROJECT_ID}/members/role`, { target_user_id: USER3_NUM_ID, role: "admin" });
  checkCode("project role update by non-owner", "PROJECT_NO_PERMISSION", resp);

  resp = await request("u2", "GET", `/user/organization/projects?organization_id=${ORG_ID}&page=1&page_size=10`);
  checkCode("list org projects by admin", "OK", resp);

  console.log("== Tags ==");
  resp = await request("u1", "POST", `/user/projects/${PROJECT_ID}/tags`, { project_id: PROJECT_ID, name: "urgent" });
  checkCode("create tag", "OK", resp);
  const TAG_ID = resp?.json?.data?.id;
  console.log(`TAG_ID=${TAG_ID}`);
  if (wsClient && wsClient2) {
    try {
      await Promise.all([
        wsClient.waitForEvent("tag.created", 5000),
        wsClient2.waitForEvent("tag.created", 5000),
      ]);
      console.log("PASS: ws broadcast tag.created (u1,u2)");
      pass += 1;
    } catch (err) {
      console.log(`FAIL: ws broadcast tag.created (${err?.message || err})`);
      fail += 1;
    }
  } else {
    await expectEvent("tag.created", "tag.created");
  }

  resp = await request("u1", "GET", `/user/projects/${PROJECT_ID}/tags?page=1&page_size=10`);
  checkCode("list tags", "OK", resp);

  resp = await request("u1", "PUT", `/user/tags/${TAG_ID}`, { name: "urgent-updated" });
  checkCode("update tag", "OK", resp);
  await expectEvent("tag.updated", "tag.updated");

  resp = await request("u1", "DELETE", `/user/tags/${TAG_ID}`);
  checkCode("delete tag", "OK", resp);
  await expectEvent("tag.deleted", "tag.deleted");

  resp = await request("u1", "GET", `/user/projects/${PROJECT_ID}/tags?include_deleted=true&page=1&page_size=10`);
  checkCode("list tags include deleted", "OK", resp);

  console.log("== Tasks ==");
  resp = await request("u1", "POST", `/user/tasks`, {
    project_id: PROJECT_ID,
    content: "Top task",
    state: "pending",
    executor_id: USER2_NUM_ID,
    priority: 0,
    tags: "alpha,beta",
  });
  checkCode("create task", "OK", resp);
  const TASK_ID = resp?.json?.data?.id;
  console.log(`TASK_ID=${TASK_ID}`);
  await expectEvent("task.created", "task.created");

  resp = await request("u1", "POST", `/user/tasks`, {
    project_id: PROJECT_ID,
    content: "Child task",
    father_id: TASK_ID,
    state: "pending",
  });
  checkCode("create child task", "OK", resp);
  const CHILD_TASK_ID = resp?.json?.data?.id;
  console.log(`CHILD_TASK_ID=${CHILD_TASK_ID}`);
  await expectEvent("task.created", "task.created (child)");

  resp = await request("u1", "PUT", `/user/tasks/${TASK_ID}`, { state: "in_progress", executor_id: USER2_NUM_ID });
  checkCode("update task to in_progress", "OK", resp);
  await expectEvent("task.updated", "task.updated");

  resp = await request("u3", "PUT", `/user/tasks/${TASK_ID}`, { content: "try update by member" });
  checkCode("update in_progress task by non-executor", "TASK_NO_PERMISSION", resp);

  resp = await request("u2", "PUT", `/user/tasks/${TASK_ID}`, { state: "completed" });
  checkCode("update task by executor", "OK", resp);

  resp = await request("u1", "GET", `/user/tasks?project_id=${PROJECT_ID}&page=1&page_size=10`);
  checkCode("list tasks", "OK", resp);

  resp = await request("u1", "GET", `/user/tasks?project_id=${PROJECT_ID}&father_id=0&page=1&page_size=10`);
  checkCode("list top-level tasks", "OK", resp);

  resp = await request("u1", "GET", `/user/tasks?project_id=${PROJECT_ID}&father_id=${TASK_ID}&page=1&page_size=10`);
  checkCode("list child tasks", "OK", resp);

  console.log("== Task Attachments ==");
  resp = await request("u1", "POST", `/user/tasks/attachments`, { task_id: TASK_ID, type: "text", content: "note 1" });
  checkCode("create attachment text", "OK", resp);
  const ATTACH_ID = resp?.json?.data?.id;
  console.log(`ATTACH_ID=${ATTACH_ID}`);
  await expectEvent("task_attachment.created", "task_attachment.created");

  resp = await request("u1", "POST", `/user/tasks/attachments`, { task_id: TASK_ID, type: "url", content: "https://example.com/doc" });
  checkCode("create attachment url", "OK", resp);
  await expectEvent("task_attachment.created", "task_attachment.created (url)");

  resp = await request("u1", "GET", `/user/tasks/attachments?task_id=${TASK_ID}&page=1&page_size=10`);
  checkCode("list attachments", "OK", resp);

  resp = await request("u1", "PUT", `/user/tasks/attachments/${ATTACH_ID}`, { content: "note 1 updated" });
  checkCode("update attachment", "OK", resp);
  await expectEvent("task_attachment.updated", "task_attachment.updated");

  resp = await request("u2", "PUT", `/user/tasks/attachments/${ATTACH_ID}`, { content: "update by non-creator" });
  checkNotOk("update attachment by non-creator", resp);

  resp = await request("u1", "DELETE", `/user/tasks/attachments/${ATTACH_ID}`);
  checkCode("delete attachment", "OK", resp);
  await expectEvent("task_attachment.deleted", "task_attachment.deleted");

  resp = await request("u1", "GET", `/user/tasks/attachments?task_id=${TASK_ID}&include_deleted=true&page=1&page_size=10`);
  checkCode("list attachments include deleted", "OK", resp);

  console.log("== Task Deletions ==");
  resp = await request("u1", "POST", `/user/tasks`, { project_id: PROJECT_ID, content: "Temp in progress", state: "in_progress" });
  checkCode("create temp in_progress task", "OK", resp);
  const TEMP_TASK_ID = resp?.json?.data?.id;
  console.log(`TEMP_TASK_ID=${TEMP_TASK_ID}`);
  await expectEvent("task.created", "task.created (temp)");

  resp = await request("u3", "DELETE", `/user/tasks/${TEMP_TASK_ID}`);
  checkCode("delete in_progress task by non-executor", "TASK_NO_PERMISSION", resp);

  resp = await request("u1", "DELETE", `/user/tasks/${TEMP_TASK_ID}`);
  checkCode("delete in_progress task by owner", "OK", resp);
  await expectEvent("task.deleted", "task.deleted (temp)");

  resp = await request("u1", "DELETE", `/user/tasks/${CHILD_TASK_ID}`);
  checkCode("delete child task", "OK", resp);
  await expectEvent("task.deleted", "task.deleted (child)");

  resp = await request("u1", "DELETE", `/user/tasks/${TASK_ID}`);
  checkCode("delete main task", "OK", resp);
  await expectEvent("task.deleted", "task.deleted (main)");

  resp = await request("u1", "GET", `/user/tasks?project_id=${PROJECT_ID}&include_deleted=true&page=1&page_size=10`);
  checkCode("list tasks include deleted", "OK", resp);

  console.log("== Project Cleanup ==");
  resp = await request("u2", "DELETE", `/user/projects/${PROJECT_ID}`);
  checkCode("delete project by non-owner", "PROJECT_NO_PERMISSION", resp);

  resp = await request("u1", "DELETE", `/user/projects/${PROJECT_ID}`);
  checkCode("delete project by owner", "OK", resp);
  await expectEvent("project.deleted", "project.deleted");
  if (wsClient) wsClient.close();
  if (wsClient2) wsClient2.close();

  console.log("== Organization Cleanup ==");
  resp = await request("u2", "DELETE", `/user/organizations/${ORG_ID}`);
  checkCode("delete org by non-owner", "ORGANIZATION_NO_PERMISSION", resp);

  resp = await request("u1", "DELETE", `/user/organizations/${ORG_ID}`);
  checkCode("delete org by owner", "OK", resp);

  console.log("== Summary ==");
  console.log(`PASS=${pass} FAIL=${fail}`);
})();
