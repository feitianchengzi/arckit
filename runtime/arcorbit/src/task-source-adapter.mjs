import { createWorkshopPlatformAdapter } from "./workshop-platform-adapter.mjs";
import { signFeedbackAttachmentUrl, uploadFeedbackAttachmentWithPolicy } from "./feedback-v2-attachment-access.mjs";
import { signWorkTaskAttachmentUrl, uploadWorkTaskAttachmentResource } from "./work-task-attachment-resource.mjs";

export const TASK_STATES = Object.freeze([
  "pending_review",
  "pending",
  "in_progress",
  "completed",
  "accepted",
  "cancelled",
  "blocked"
]);

export const DEFAULT_WORKSHOP_BASE_URL = "https://api.feitianchengzi.com";

const TERMINAL_STATES = new Set(["accepted", "cancelled"]);
const AUTH_STATES = new Set(["logged_out", "authenticated", "refreshing", "expired"]);
const PAGE_SIZE = 200;
const REFRESH_WINDOW_MS = 5 * 60_000;
const SESSION_INACTIVITY_WINDOW_MS = 7 * 24 * 60 * 60_000;

export class TaskSourceError extends Error {
  constructor(message, { code = "task_source_error", status = 0, details = null } = {}) {
    super(message);
    this.name = "TaskSourceError";
    this.code = code;
    this.status = status;
    this.details = details;
  }
}

export function createWorkshopTaskSource({
  settings,
  readSettings,
  saveSettings,
  fetchImpl = globalThis.fetch,
  now = () => Date.now(),
  feedbackV2ProjectIds = process.env.ARCORBIT_FEEDBACK_V2_PROJECT_IDS || "*",
  feedbackV2NotificationProjectIds = process.env.ARCORBIT_FEEDBACK_V2_NOTIFICATION_PROJECT_IDS || "*"
}) {
  let config = normalizeTaskSourceSettings(settings);
  let refreshPromise = null;
  let startupRecoveryPromise = null;
  let startupRecoveryAttempted = false;
  let authEpoch = 0;
  let projectExecutorIds = new Map();

  if (typeof fetchImpl !== "function") {
    throw new TaskSourceError("Fetch is unavailable in this runtime.", { code: "unavailable" });
  }

  async function loadConfig() {
    if (typeof readSettings === "function") {
      config = normalizeTaskSourceSettings(await readSettings());
    }
    return config;
  }

  async function persistConfig(next) {
    config = normalizeTaskSourceSettings(next);
    if (typeof saveSettings === "function") {
      const saved = await saveSettings(config);
      config = normalizeTaskSourceSettings(saved?.task_source ?? saved ?? config);
    }
    return config;
  }

  async function sendVerification(input) {
    const request = normalizeVerificationRequest(input);
    const current = await loadConfig();
    await publicRequest(current, "auth-server", "/send_verification", {
      method: "POST",
      body: {
        code_type: request.code_type,
        target: request.target,
        purpose: "login"
      }
    });
    return {
      sent: true,
      code_type: request.code_type,
      masked_target: maskIdentity(request.target),
      cooldown_seconds: 60
    };
  }

  async function loginWithCode(input) {
    const request = normalizeLoginRequest(input);
    const current = await loadConfig();
    const body = request.code_type === "email"
      ? { email: request.target, code: request.code, code_type: "email", purpose: "login" }
      : { phone: request.target, code: request.code, code_type: "sms", purpose: "login" };
    const payload = await publicRequest(current, "auth-server", "/login", { method: "POST", body });
    const tokens = extractAuthTokens(payload?.tokens ?? payload);
    if (!tokens) {
      throw new TaskSourceError("Login response did not include a reusable Workshop session.", {
        code: "invalid_response"
      });
    }
    const user = payload?.user && typeof payload.user === "object" ? payload.user : {};
    authEpoch += 1;
    startupRecoveryAttempted = true;
    await persistConfig(applyNebulaTokens(current, tokens, {
      username: user.username || user.email || user.phone || request.target,
      now: now()
    }));
    return getAuthStatus();
  }

  async function logout() {
    authEpoch += 1;
    startupRecoveryAttempted = true;
    const current = await loadConfig();
    await persistConfig({
      ...current,
      auth_mode: "nebula",
      access_token: "",
      refresh_token: "",
      token_type: "Bearer",
      access_token_expires_at: 0,
      refresh_token_expires_at: 0,
      last_login_activity_at: 0,
      user_id: "",
      username: "",
      session_id: "",
      auth_state: "logged_out",
      auth_error: ""
    });
    return getAuthStatus();
  }

  async function getAuthStatus() {
    if (!startupRecoveryAttempted) {
      startupRecoveryAttempted = true;
      startupRecoveryPromise = recoverStartupSession()
        .finally(() => { startupRecoveryPromise = null; });
    }
    if (startupRecoveryPromise) return startupRecoveryPromise;
    const current = await loadConfig();
    return authProjection(current, { refreshing: Boolean(refreshPromise), now: now() });
  }

  async function recoverStartupSession() {
    let current = await loadConfig();
    if (shouldAttemptStartupRecovery(current)) {
      try {
        current = await refreshNebulaToken();
      } catch (error) {
        const normalized = normalizeError(error);
        current = await loadConfig();
        if (isRetryableRefreshFailure(normalized)) {
          return authProjection({ ...current, auth_error: normalized.message }, {
            refreshing: Boolean(refreshPromise),
            now: now()
          });
        }
      }
    }
    return authProjection(current, { refreshing: Boolean(refreshPromise), now: now() });
  }

  async function refreshNebulaToken() {
    if (refreshPromise) {
      return refreshPromise;
    }
    const current = await loadConfig();
    if (refreshPromise) {
      return refreshPromise;
    }
    if (!current.refresh_token || refreshTokenExpired(current, now()) || sessionInactive(current, now())) {
      if (current.auth_state === "logged_out") {
        throw new TaskSourceError("请先登录 Workshop。", { code: "unauthenticated" });
      }
      await expireSession(current, "Workshop 登录已过期，请重新登录。");
      throw new TaskSourceError("Workshop 登录已过期，请重新登录。", { code: "unauthenticated" });
    }
    const refreshEpoch = authEpoch;
    refreshPromise = (async () => {
      try {
        const payload = await publicRequest(current, "auth-server", "/refresh_token", {
          method: "POST",
          body: { refresh_token: current.refresh_token }
        });
        const tokens = extractAuthTokens(payload);
        if (!tokens) {
          throw new TaskSourceError("Token refresh response was invalid.", { code: "invalid_response" });
        }
        if (authEpoch !== refreshEpoch) {
          throw new TaskSourceError("Workshop 会话已变化。", { code: "unauthenticated" });
        }
        return persistConfig(applyNebulaTokens(current, tokens, { username: current.username, now: now() }));
      } catch (error) {
        const normalized = normalizeError(error);
        if (authEpoch !== refreshEpoch) {
          throw new TaskSourceError("Workshop 会话已变化。", { code: "unauthenticated" });
        }
        if (isCredentialRejection(normalized)) {
          await expireSession(current, normalized.message);
          throw new TaskSourceError(normalized.message || "Workshop 登录已过期，请重新登录。", {
            code: "unauthenticated",
            status: normalized.status,
            details: normalized.details
          });
        }
        throw normalized;
      } finally {
        refreshPromise = null;
      }
    })();
    return refreshPromise;
  }

  async function expireSession(current, message) {
    await persistConfig({
      ...current,
      access_token: "",
      refresh_token: "",
      access_token_expires_at: 0,
      refresh_token_expires_at: 0,
      last_login_activity_at: 0,
      auth_state: "expired",
      auth_error: String(message || "Workshop 登录已过期，请重新登录。")
    });
  }

  async function request(path, options = {}) {
    return versionedRequest("v1", path, options);
  }

  async function requestV2(path, options = {}) {
    return versionedRequest("v2", path, options);
  }

  async function versionedRequest(version, path, { method = "GET", query = {}, body, expectedVersion = "" } = {}) {
    let current = await loadConfig();
    assertTaskSourceEnabled(current);
    if (current.auth_mode === "nebula" && sessionInactive(current, now())) {
      await expireSession(current, "Workshop 登录已超过七天未活动，请重新登录。");
      throw new TaskSourceError("Workshop 登录已超过七天未活动，请重新登录。", { code: "unauthenticated" });
    }
    if (current.auth_mode === "nebula" && tokenExpiresSoon(current, now())) {
      current = await refreshNebulaToken();
    }
    assertAuthenticated(current);
    let result = await fetchJson(buildBusinessUrl(current, path, query, version), {
      method,
      headers: buildHeaders(current, body !== undefined, expectedVersion),
      body
    });
    if (result.response.status === 401 && current.auth_mode === "nebula" && current.refresh_token) {
      current = await refreshNebulaToken();
      result = await fetchJson(buildBusinessUrl(current, path, query, version), {
        method,
        headers: buildHeaders(current, body !== undefined, expectedVersion),
        body
      });
    }
    if (!isSuccessfulResponse(result.response, result.payload)) {
      if (result.response.status === 401 && current.auth_mode === "nebula") {
        await expireSession(current, extractErrorMessage(result.payload, result.response.status));
      }
      throw responseError(result.payload, result.response.status);
    }
    return result.payload?.data ?? result.payload;
  }

  async function realtimeConnection(projectId) {
    let current = await loadConfig();
    assertTaskSourceEnabled(current);
    if (current.auth_mode === "nebula" && sessionInactive(current, now())) {
      await expireSession(current, "Workshop 登录已超过七天未活动，请重新登录。");
      throw new TaskSourceError("Workshop 登录已超过七天未活动，请重新登录。", { code: "unauthenticated" });
    }
    if (current.auth_mode === "nebula" && tokenExpiresSoon(current, now())) {
      current = await refreshNebulaToken();
    }
    assertAuthenticated(current);
    const httpUrl = buildBusinessUrl(current, `/projects/${encodeURIComponent(projectId)}/ws`, {});
    httpUrl.protocol = httpUrl.protocol === "https:" ? "wss:" : "ws:";
    const bearer = ["nebula", "bearer"].includes(current.auth_mode) && current.access_token
      ? `${current.token_type || "Bearer"} ${current.access_token}`
      : "";
    return {
      url: httpUrl.toString(),
      protocols: current.access_token ? ["workshop-ws", `nebula-auth.${current.access_token}`] : ["workshop-ws"],
      accessTokenExpiresAt: current.access_token_expires_at,
      headers: current.auth_mode === "headers"
        ? buildHeaders(current, false, "")
        : bearer ? { Authorization: bearer } : {}
    };
  }

  async function publicRequest(current, serviceName, path, { method = "POST", body } = {}) {
    const result = await fetchJson(buildServiceUrl(current, serviceName, "public", path), {
      method,
      headers: {
        Accept: "application/json",
        ...(body === undefined ? {} : { "Content-Type": "application/json" })
      },
      body
    });
    if (!isSuccessfulResponse(result.response, result.payload)) {
      throw responseError(result.payload, result.response.status);
    }
    return result.payload?.data ?? result.payload;
  }

  async function fetchJson(url, { method, headers, body }) {
    let response;
    try {
      response = await fetchImpl(url, {
        method,
        headers,
        body: body === undefined ? undefined : JSON.stringify(body)
      });
    } catch (error) {
      throw new TaskSourceError(error?.message || "Task source request failed.", {
        code: "network_error",
        details: error
      });
    }
    return { response, payload: await readPayload(response) };
  }

  async function listProjects() {
    const current = await loadConfig();
    const [standaloneProjects, organizations] = await Promise.all([
      requestAllPages("/projects", {}, ["projects", "items"]),
      requestAllPages("/organizations", {}, ["organizations", "items"])
    ]);
    const organizationProjectLists = await mapWithConcurrency(organizations, 3, async (organization) => {
      const organizationId = scalarId(organization.id);
      const projects = await requestAllPages("/projects", { organization_id: organizationId }, ["projects", "items"]);
      return projects.map((project) => ({ ...project, organization_id: scalarId(project.organization_id) || organizationId }));
    });
    const projects = [
      ...standaloneProjects,
      ...organizationProjectLists.flat()
    ];
    const normalized = dedupeById(projects.map((project) => normalizeProject(project, current.username)).filter(Boolean));
    projectExecutorIds = new Map(normalized
      .filter((project) => project.current_user_id)
      .map((project) => [project.id, project.current_user_id]));
    return normalized;
  }

  async function requestAllPages(path, query, keys) {
    const values = [];
    const seen = new Set();
    for (let page = 1; page <= 1000; page += 1) {
      const payload = await request(path, { query: { ...query, page, page_size: PAGE_SIZE } });
      const items = extractList(payload, keys);
      let added = 0;
      for (const item of items) {
        const key = scalarId(item?.id) || JSON.stringify(item);
        if (seen.has(key)) continue;
        seen.add(key);
        values.push(item);
        added += 1;
      }
      const total = Number(payload?.total ?? payload?.meta?.total);
      if ((Number.isFinite(total) && total >= 0 && values.length >= total) || items.length < PAGE_SIZE || added === 0) break;
    }
    return values;
  }

  const platform = createWorkshopPlatformAdapter({
    request,
    requestV2,
    listProjects,
    normalizeTask,
    feedbackV2ProjectIds,
    feedbackV2NotificationProjectIds,
    uploadWithPolicy: (policy, file) => uploadFeedbackAttachmentWithPolicy(fetchImpl, policy, file),
    signAttachmentUrl: signFeedbackAttachmentUrl,
    uploadTaskResource: uploadWorkTaskAttachmentResource,
    signTaskResourceUrl: signWorkTaskAttachmentUrl
  });

  return {
    consistency: "conditional",
    platform,
    sendVerification,
    loginWithCode,
    logout,
    getAuthStatus,
	realtimeConnection,
	async listProjectEvents(projectId, { afterId = 0, limit = 500 } = {}) {
		return request(`/projects/${encodeURIComponent(projectId)}/events`, {
			query: { after_id: afterId, limit }
		});
	},
    async getCurrentUser() {
      const requestEpoch = authEpoch;
      const payload = await request("/users");
      if (authEpoch !== requestEpoch) {
        throw new TaskSourceError("Workshop 会话已变化。", { code: "unauthenticated" });
      }
      const user = normalizeUser(payload?.user ?? payload);
      if (!user || user.id) return user;
      const current = await loadConfig();
      if (authEpoch !== requestEpoch) {
        throw new TaskSourceError("Workshop 会话已变化。", { code: "unauthenticated" });
      }
      const sessionUserId = current.auth_mode === "nebula"
        ? nebulaAccessTokenUserId(current.access_token)
        : current.auth_mode === "headers" ? scalarId(current.user_id) : "";
      return sessionUserId ? { ...user, id: sessionUserId } : user;
    },
    listProjects,
    async listTasks(projectId, options = {}) {
      const executorId = requireProjectExecutorId(projectId, options, projectExecutorIds);
      const tasks = await requestAllPages("/tasks", { project_id: projectId, executor_id: executorId, state: TASK_STATES }, ["tasks", "items"]);
      return tasks
        .map((task) => normalizeTask(task, projectId))
        .filter((task) => task?.executor_id === executorId);
    },
    async getTask(taskId, projectId = "", options = {}) {
      if (!projectId) {
        throw new TaskSourceError("Project id is required to refresh a task.", { code: "invalid_project" });
      }
      const executorId = requireProjectExecutorId(projectId, options, projectExecutorIds);
      const tasks = await requestAllPages("/tasks", { project_id: projectId, executor_id: executorId, state: TASK_STATES }, ["tasks", "items"]);
      return tasks
        .map((task) => normalizeTask(task, projectId))
        .find((task) => task?.id === String(taskId) && task.executor_id === executorId) || null;
    },
    async updateTask({ taskId, projectId = "", executorId: requestedExecutorId = "", state, expectedVersion = "" }) {
      if (!TASK_STATES.includes(state)) {
        throw new TaskSourceError(`Unsupported task state: ${state}`, { code: "invalid_state" });
      }
      const executorId = requireProjectExecutorId(projectId, { executorId: requestedExecutorId }, projectExecutorIds);
      const payload = await request(`/tasks/${encodeURIComponent(taskId)}`, {
        method: "PUT",
        body: { state },
        expectedVersion
      });
      const task = normalizeTask(payload?.task ?? payload, projectId);
      if (!task || task.executor_id !== executorId) {
        throw new TaskSourceError("Task is no longer assigned to the current user.", { code: "not_assigned" });
      }
      return task;
    }
  };
}

export function normalizeTaskSourceSettings(value = {}) {
  return {
    enabled: value.enabled !== false,
    base_url: String(value.base_url || DEFAULT_WORKSHOP_BASE_URL).trim().replace(/\/+$/, ""),
    service_name: /^[a-zA-Z0-9_-]+$/.test(value.service_name) ? value.service_name : "workshop",
    auth_mode: ["nebula", "bearer", "headers"].includes(value.auth_mode) ? value.auth_mode : "nebula",
    access_token: String(value.access_token || "").trim(),
    refresh_token: String(value.refresh_token || "").trim(),
    token_type: String(value.token_type || "Bearer").trim() || "Bearer",
    access_token_expires_at: finiteTimestamp(value.access_token_expires_at),
    refresh_token_expires_at: finiteTimestamp(value.refresh_token_expires_at),
    last_login_activity_at: finiteTimestamp(value.last_login_activity_at),
    auth_state: AUTH_STATES.has(value.auth_state) ? value.auth_state : inferAuthState(value),
    auth_error: String(value.auth_error || "").trim(),
    user_id: String(value.user_id || "").trim(),
    username: String(value.username || "").trim(),
    app_id: String(value.app_id || "arckit-runtime").trim() || "arckit-runtime",
    session_id: String(value.session_id || "").trim()
  };
}

export function authProjection(settings, { refreshing = false, now = Date.now() } = {}) {
  const current = normalizeTaskSourceSettings(settings);
  let status = current.auth_state;
  if (refreshing) status = "refreshing";
  else if (status !== "expired" && current.auth_mode === "nebula" && (refreshTokenExpired(current, now) || sessionInactive(current, now))) status = "expired";
  else if (status !== "expired" && (current.access_token || current.refresh_token || (current.auth_mode === "headers" && current.user_id))) status = "authenticated";
  else if (status !== "expired") status = "logged_out";
  return {
    status,
    authenticated: status === "authenticated" || status === "refreshing",
    masked_identity: maskIdentity(current.username || current.user_id || ""),
    can_refresh: Boolean(current.auth_mode === "nebula" && current.refresh_token && !refreshTokenExpired(current, now) && !sessionInactive(current, now)),
    error: status === "expired" ? current.auth_error || "Workshop 登录已过期，请重新登录。" : current.auth_error
  };
}

export function normalizeTask(value, fallbackProjectId = "") {
  if (!value || typeof value !== "object") return null;
  const id = scalarId(value.id ?? value.task_id);
  const projectId = scalarId(value.project_id ?? value.projectId ?? fallbackProjectId);
  if (!id || !projectId) return null;
  const state = TASK_STATES.includes(value.state) ? value.state : String(value.state || "unknown");
  return {
    id,
    project_id: projectId,
    title: String(value.title || value.content || value.name || `Task ${id}`).trim(),
    content: String(value.content || value.description || value.title || "").trim(),
    father_id: scalarId(value.father_id ?? value.fatherId),
    state,
    priority: normalizePriority(value.priority),
    version: String(value.version ?? value.updated_at ?? value.updatedAt ?? value.etag ?? ""),
    state_changed_at: String(value.state_changed_at ?? value.stateChangedAt ?? value.updated_at ?? value.updatedAt ?? ""),
    created_at: String(value.created_at ?? value.createdAt ?? ""),
    updated_at: String(value.updated_at ?? value.updatedAt ?? ""),
    completion_at: String(value.completion_at ?? value.completionAt ?? ""),
    creator_id: scalarId(value.creator_id ?? value.creatorId),
    executor_id: scalarId(value.executor_id ?? value.executorId),
    creator: value.creator ?? null,
    assignee: value.assignee ?? value.executor ?? value.owner ?? null,
    tags: String(value.tags || ""),
    terminal: TERMINAL_STATES.has(state),
    raw: value
  };
}

function normalizeProject(value, currentUsername = "") {
  if (!value || typeof value !== "object") return null;
  const id = scalarId(value.id ?? value.project_id);
  if (!id) return null;
  const members = Array.isArray(value.members) ? value.members : [];
  const currentMember = members.find((member) => member?.is_me === true)
    || members.find((member) => currentUsername && String(member?.username || "") === currentUsername);
  return {
    id,
    name: String(value.name || value.title || `Project ${id}`).trim(),
    description: String(value.description || "").trim(),
    updated_at: String(value.updated_at ?? value.updatedAt ?? ""),
    current_user_id: scalarId(value.current_user_id ?? value.currentUserId ?? currentMember?.user_id),
    raw: value
  };
}

function requireProjectExecutorId(projectId, options, projectExecutorIds) {
  const executorId = scalarId(options?.executor_id ?? options?.executorId ?? projectExecutorIds.get(String(projectId)));
  if (!executorId) {
    throw new TaskSourceError("Cannot identify the current Workshop user in this project.", {
      code: "current_user_unresolved"
    });
  }
  return executorId;
}

function normalizeUser(value) {
  if (!value || typeof value !== "object") return null;
  return {
    id: scalarId(value.id ?? value.user_id ?? value.uuid),
    name: String(value.name || value.username || value.email || value.phone || "Current user").trim(),
    raw: value
  };
}

function nebulaAccessTokenUserId(value) {
  const parts = String(value || "").split(".");
  if (parts.length !== 3 || !parts[1]) return "";
  let claims;
  try {
    claims = JSON.parse(Buffer.from(parts[1], "base64url").toString("utf8"));
  } catch {
    return "";
  }
  if (!claims || typeof claims !== "object" || claims.token_type !== "access") return "";
  const userId = scalarId(claims.user_id);
  const subject = scalarId(claims.sub);
  if (!userId || (subject && subject !== userId)) return "";
  return userId;
}

function normalizeVerificationRequest(value = {}) {
  const codeType = value.code_type ?? value.codeType;
  const target = String(value.target || "").trim();
  if (!["email", "sms"].includes(codeType)) {
    throw new TaskSourceError("验证码类型无效。", { code: "invalid_auth_input" });
  }
  if (!validTarget(codeType, target)) {
    throw new TaskSourceError(codeType === "email" ? "请输入有效邮箱。" : "请输入有效手机号。", { code: "invalid_auth_input" });
  }
  return { code_type: codeType, target };
}

function normalizeLoginRequest(value = {}) {
  const request = normalizeVerificationRequest(value);
  const code = String(value.code || "").trim();
  if (!/^\d{4,8}$/.test(code)) {
    throw new TaskSourceError("请输入有效验证码。", { code: "invalid_auth_input" });
  }
  return { ...request, code };
}

function validTarget(codeType, target) {
  if (codeType === "email") return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(target);
  return /^\+?[0-9][0-9\s-]{5,19}$/.test(target);
}

function applyNebulaTokens(current, tokens, { username, now }) {
  const accessExpires = finiteTimestamp(tokens.access_token_expires_at)
    || (Number(tokens.expires_in) > 0 ? now + Number(tokens.expires_in) * 1000 : 0);
  const refreshExpires = finiteTimestamp(tokens.refresh_token_expires_at)
    || (Number(tokens.refresh_expires_in) > 0 ? now + Number(tokens.refresh_expires_in) * 1000 : 0);
  return {
    ...current,
    enabled: true,
    auth_mode: "nebula",
    access_token: String(tokens.access_token || ""),
    refresh_token: String(tokens.refresh_token || ""),
    token_type: "Bearer",
    access_token_expires_at: accessExpires,
    refresh_token_expires_at: refreshExpires,
    last_login_activity_at: now,
    username: String(username || current.username || ""),
    auth_state: "authenticated",
    auth_error: ""
  };
}

function extractAuthTokens(value) {
  if (!value || typeof value !== "object") return null;
  const tokens = value.tokens && typeof value.tokens === "object" ? value.tokens : value;
  return tokens.access_token && tokens.refresh_token ? tokens : null;
}

function tokenExpiresSoon(current, timestamp) {
  return Boolean(current.access_token_expires_at && current.access_token_expires_at - timestamp < REFRESH_WINDOW_MS);
}

function refreshTokenExpired(current, timestamp) {
  return Boolean(current.refresh_token_expires_at && current.refresh_token_expires_at <= timestamp);
}

function sessionInactive(current, timestamp) {
  return Boolean(current.last_login_activity_at && timestamp - current.last_login_activity_at > SESSION_INACTIVITY_WINDOW_MS);
}

function shouldAttemptStartupRecovery(current) {
  return current.auth_mode === "nebula"
    && current.auth_state !== "logged_out"
    && current.auth_state !== "expired"
    && Boolean(current.access_token || current.refresh_token);
}

function isCredentialRejection(error) {
  return error?.code === "unauthenticated" || error?.code === "forbidden";
}

function isRetryableRefreshFailure(error) {
  return !isCredentialRejection(error);
}

function assertTaskSourceEnabled(current) {
  if (!current.enabled || !current.base_url) {
    throw new TaskSourceError("Workshop task synchronization is disabled.", { code: "disabled" });
  }
}

function assertAuthenticated(current) {
  if (["nebula", "bearer"].includes(current.auth_mode) && !current.access_token) {
    throw new TaskSourceError("请先登录 Workshop。", { code: "unauthenticated" });
  }
  if (current.auth_mode === "headers" && !current.user_id) {
    throw new TaskSourceError("请先配置调试用户。", { code: "unauthenticated" });
  }
}

function buildBusinessUrl(current, path, query, version = "v1") {
  const url = buildServiceUrl(current, current.service_name, "user", path, version);
  for (const [key, value] of Object.entries(query || {})) {
    if (value === undefined || value === "") continue;
    if (Array.isArray(value)) {
      for (const item of value) url.searchParams.append(key, String(item));
    } else {
      url.searchParams.set(key, String(value));
    }
  }
  return url;
}

function buildServiceUrl(current, serviceName, authLevel, path, version = "v1") {
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  if (!/^v[12]$/.test(version)) throw new TaskSourceError("Unsupported Workshop API version.", { code: "invalid_version" });
  return new URL(`${current.base_url}/${serviceName}/${version}/${authLevel}${normalizedPath}`);
}

function buildHeaders(current, hasBody, expectedVersion) {
  const headers = { Accept: "application/json" };
  if (hasBody) headers["Content-Type"] = "application/json";
  if (expectedVersion) headers["If-Match"] = expectedVersion;
  if (["nebula", "bearer"].includes(current.auth_mode)) {
    if (current.access_token) headers.Authorization = `${current.token_type || "Bearer"} ${current.access_token}`;
  } else {
    headers["X-User-ID"] = current.user_id;
    headers["X-User-Username"] = current.username;
    headers["X-User-AppID"] = current.app_id;
    if (current.session_id) headers["X-User-SessionID"] = current.session_id;
  }
  return headers;
}

async function readPayload(response) {
  const text = await response.text();
  if (!text) return null;
  try {
    return JSON.parse(text);
  } catch {
    throw new TaskSourceError("Task source returned invalid JSON.", { code: "invalid_response", status: response.status });
  }
}

function isSuccessfulResponse(response, payload) {
  return response.ok && payload?.success !== false && (!payload?.code || payload.code === "OK");
}

function responseError(payload, status) {
  return new TaskSourceError(extractErrorMessage(payload, status), {
	code: payload?.code === "EVENT_CURSOR_EXPIRED" ? "cursor_expired" : statusCode(status),
    status,
    details: payload
  });
}

function extractList(payload, keys) {
  if (Array.isArray(payload)) return payload;
  for (const key of keys) if (Array.isArray(payload?.[key])) return payload[key];
  return [];
}

function dedupeById(items) {
  return [...new Map(items.map((item) => [item.id, item])).values()];
}

async function mapWithConcurrency(items, limit, mapper) {
  const results = new Array(items.length);
  let cursor = 0;
  const runners = Array.from({ length: Math.min(Math.max(limit, 1), items.length) }, async () => {
    while (cursor < items.length) {
      const index = cursor++;
      results[index] = await mapper(items[index], index);
    }
  });
  await Promise.all(runners);
  return results;
}

function normalizePriority(value) {
  if (typeof value === "number" && Number.isFinite(value)) return Math.max(0, 100 - value);
  const text = String(value || "").trim().toUpperCase();
  const match = text.match(/^P([0-9]+)$/);
  return match ? Math.max(0, 100 - Number(match[1])) : Number(value) || 0;
}

function scalarId(value) {
  return ["string", "number"].includes(typeof value) && String(value).trim() ? String(value).trim() : "";
}

function finiteTimestamp(value) {
  const timestamp = Number(value);
  return Number.isFinite(timestamp) && timestamp > 0 ? timestamp : 0;
}

function inferAuthState(value) {
  if (value.auth_error) return "expired";
  if (value.access_token || value.refresh_token || (value.auth_mode === "headers" && value.user_id)) return "authenticated";
  return "logged_out";
}

function maskIdentity(value) {
  const text = String(value || "").trim();
  if (!text) return "";
  const at = text.indexOf("@");
  if (at > 0) return `${text.slice(0, Math.min(2, at))}${at > 2 ? "•••" : "•"}${text.slice(at)}`;
  if (text.length <= 5) return `${text.slice(0, 1)}••`;
  return `${text.slice(0, 3)}••••${text.slice(-2)}`;
}

function extractErrorMessage(payload, status) {
  return String(payload?.error?.message || payload?.message || payload?.error || `Task source request failed (${status}).`);
}

function statusCode(status) {
  if (status === 401) return "unauthenticated";
  if (status === 403) return "forbidden";
  if (status === 409 || status === 412) return "version_conflict";
  if (status >= 500) return "service_unavailable";
  return "request_failed";
}

function normalizeError(error) {
  if (error instanceof TaskSourceError) return error;
  return new TaskSourceError(error?.message || String(error || "Task source error"));
}
