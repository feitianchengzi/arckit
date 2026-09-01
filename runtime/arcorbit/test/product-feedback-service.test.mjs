import assert from "node:assert/strict";
import test from "node:test";
import {
  createProductFeedbackService,
  normalizeProductFeedbackMode
} from "../src/product-feedback-service.mjs";
import { createWorkshopTaskSource } from "../src/task-source-adapter.mjs";

function withService(options = {}) {
  const surfaceCalls = [];
  const surface = {
    async open(value) { surfaceCalls.push(["open", value]); },
    async prepare(value) { surfaceCalls.push(["prepare", value]); },
    async switchMode(value) { surfaceCalls.push(["switchMode", value]); return { status: "ready", mode: value }; },
    async retry() { surfaceCalls.push(["retry"]); return { status: "loading" }; },
    close() { surfaceCalls.push(["close"]); }
  };
  const service = createProductFeedbackService({
    apiKey: "test-feedback-key",
    projectId: 107,
    getAuthStatus: async () => ({ authenticated: true }),
    getCurrentUser: async () => ({ id: 731 }),
    surface,
    ...options
  });
  return { service, surfaceCalls };
}

test("product feedback reports operator-injected configuration", async () => {
  const { service } = withService();
  assert.deepEqual(await service.getStatus(), {
    integration_mode: "sdk-webview",
    sdk_auth_mode: "apiKey",
    notifications_enabled: true,
    credential_strategy: "operator-injected",
    configured: true,
    project_id: 107,
    unread_count: 0
  });
  assert.equal(typeof service.saveConfig, "undefined");
  assert.equal(typeof service.clearConfig, "undefined");
});

test("product feedback opens the operator-configured apiKey SDK contract for the current Workshop user", async () => {
  const { service, surfaceCalls } = withService();
  assert.deepEqual(await service.open("submit"), { status: "opened", mode: "submit" });
  assert.deepEqual(surfaceCalls, [["open", {
    mode: "submit",
    config: {
      feedbackV2Enabled: true,
      feedbackV2AuthMode: "apiKey",
      apiKey: "test-feedback-key",
      projectId: 107,
      customUserId: "731",
      gatewayUrl: "https://api.feitianchengzi.com",
      theme: "system",
      feedbackV2NotificationsEnabled: true
    }
  }]]);
});

test("product feedback opens for a real Nebula user response whose stable id is carried by the access token", async () => {
  const userId = "731";
  const encode = (value) => Buffer.from(JSON.stringify(value)).toString("base64url");
  const accessToken = `${encode({ alg: "RS256", typ: "JWT" })}.${encode({ token_type: "access", user_id: userId, sub: userId })}.test-signature`;
  const taskSource = createWorkshopTaskSource({
    settings: {
      enabled: true,
      base_url: "https://workshop.example",
      service_name: "workshop",
      auth_mode: "nebula",
      access_token: accessToken,
      refresh_token: "refresh-1"
    },
    fetchImpl: async () => new Response(JSON.stringify({ data: { user: { username: "glare", avatar: "avatar.png" } } }), {
      status: 200,
      headers: { "content-type": "application/json" }
    })
  });
  const { service, surfaceCalls } = withService({
    getAuthStatus: () => taskSource.getAuthStatus(),
    getCurrentUser: () => taskSource.getCurrentUser()
  });

  assert.deepEqual(await service.open("submit"), { status: "opened", mode: "submit" });
  assert.equal(surfaceCalls[0][1].config.customUserId, userId);
});

test("product feedback only gates on Workshop login and stable identity", async () => {
  const loggedOut = withService({ getAuthStatus: async () => ({ authenticated: false }) }).service;
  assert.deepEqual(await loggedOut.open(), { status: "requires_auth", reason: "workshop_login_required" });
  const missingUser = withService({ getCurrentUser: async () => ({}) }).service;
  assert.deepEqual(await missingUser.open(), { status: "requires_auth", reason: "current_user_unavailable" });
});

test("feedback modes are bounded", () => {
  assert.equal(normalizeProductFeedbackMode("status"), "status");
  assert.throws(() => normalizeProductFeedbackMode("external"), { code: "invalid_feedback_mode" });
});

test("product feedback fails closed when operator configuration is absent", async () => {
  const surface = {
    async open() { throw new Error("must not open"); },
    async prepare() { throw new Error("must not prepare"); },
    async switchMode() {},
    async retry() {},
    close() {}
  };
  const service = createProductFeedbackService({
    getAuthStatus: async () => ({ authenticated: true }),
    getCurrentUser: async () => ({ id: 731 }),
    surface
  });
  assert.deepEqual(await service.getStatus(), {
    integration_mode: "sdk-webview",
    sdk_auth_mode: "apiKey",
    notifications_enabled: true,
    credential_strategy: "operator-injected",
    configured: false,
    project_id: 0,
    unread_count: 0
  });
  assert.deepEqual(await service.open(), { status: "unavailable", reason: "product_feedback_not_configured" });
  assert.deepEqual(await service.refreshUnread(), { status: "unavailable", reason: "product_feedback_not_configured", unread_count: 0 });
});

test("product feedback exposes bounded unread state and prepares without opening", async () => {
  const { service, surfaceCalls } = withService();
  const observed = [];
  service.onUnreadCount((count) => observed.push(count));
  assert.deepEqual(await service.refreshUnread(), { status: "ready", unread_count: 0 });
  assert.equal(surfaceCalls[0][0], "prepare");
  assert.equal(surfaceCalls[0][1].config.projectId, 107);
  assert.equal(surfaceCalls[0][1].config.feedbackV2NotificationsEnabled, true);
  service.acceptUnreadCount(7);
  assert.deepEqual(observed, [7]);
  assert.equal((await service.getStatus()).unread_count, 7);
  service.resetSession();
  assert.deepEqual(observed, [7, 0]);
});
