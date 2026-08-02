export const TASK_STATES = Object.freeze([
  "pending_review",
  "pending",
  "in_progress",
  "completed",
  "accepted",
  "cancelled",
  "blocked"
]);

const TERMINAL_STATES = new Set(["accepted", "cancelled"]);

export class TaskSourceError extends Error {
  constructor(message, { code = "task_source_error", status = 0, details = null } = {}) {
    super(message);
    this.name = "TaskSourceError";
    this.code = code;
    this.status = status;
    this.details = details;
  }
}

export function createWorkshopTaskSource({ settings, fetchImpl = globalThis.fetch }) {
  const config = normalizeTaskSourceSettings(settings);
  if (!config.enabled || !config.base_url) {
    throw new TaskSourceError("Configure and enable the Workshop task source first.", { code: "unconfigured" });
  }
  if (typeof fetchImpl !== "function") {
    throw new TaskSourceError("Fetch is unavailable in this runtime.", { code: "unavailable" });
  }

  async function request(path, { method = "GET", query = {}, body, expectedVersion = "" } = {}) {
    const url = buildUrl(config, path, query);
    const headers = buildHeaders(config, body !== undefined);
    if (expectedVersion) {
      headers["If-Match"] = expectedVersion;
    }
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
    const payload = await readPayload(response);
    if (!response.ok) {
      throw new TaskSourceError(extractErrorMessage(payload, response.status), {
        code: statusCode(response.status),
        status: response.status,
        details: payload
      });
    }
    return payload?.data ?? payload;
  }

  return {
    consistency: "conditional",
    async getCurrentUser() {
      const payload = await request("/users");
      return normalizeUser(payload?.user ?? payload);
    },
    async listProjects() {
      const [standalonePayload, organizationsPayload] = await Promise.all([
        request("/projects", { query: { page_size: 500 } }),
        request("/organizations", { query: { page_size: 500 } })
      ]);
      const organizations = extractList(organizationsPayload, ["organizations", "items"]);
      const organizationProjectPayloads = await Promise.all(organizations.map((organization) => request("/projects", {
        query: { organization_id: scalarId(organization.id), page_size: 500 }
      })));
      const projects = [
        ...extractList(standalonePayload, ["projects", "items"]),
        ...organizationProjectPayloads.flatMap((payload) => extractList(payload, ["projects", "items"]))
      ];
      return dedupeById(projects.map(normalizeProject).filter(Boolean));
    },
    async listTasks(projectId) {
      const payload = await request("/tasks", {
        query: {
          project_id: projectId,
          state: TASK_STATES,
          page_size: 500
        }
      });
      return extractList(payload, ["tasks", "items"])
        .map((task) => normalizeTask(task, projectId))
        .filter(Boolean);
    },
    async getTask(taskId, projectId = "") {
      if (!projectId) {
        throw new TaskSourceError("Project id is required to refresh a task.", { code: "invalid_project" });
      }
      const payload = await request("/tasks", {
        query: { project_id: projectId, state: TASK_STATES, page_size: 500 }
      });
      return extractList(payload, ["tasks", "items"])
        .map((task) => normalizeTask(task, projectId))
        .find((task) => task?.id === String(taskId)) || null;
    },
    async updateTask({ taskId, projectId = "", state, expectedVersion = "" }) {
      if (!TASK_STATES.includes(state)) {
        throw new TaskSourceError(`Unsupported task state: ${state}`, { code: "invalid_state" });
      }
      const payload = await request(`/tasks/${encodeURIComponent(taskId)}`, {
        method: "PUT",
        body: { state },
        expectedVersion
      });
      return normalizeTask(payload?.task ?? payload, projectId);
    }
  };
}

export function normalizeTaskSourceSettings(value = {}) {
  return {
    enabled: Boolean(value.enabled),
    base_url: String(value.base_url || "").trim().replace(/\/+$/, ""),
    service_name: /^[a-zA-Z0-9_-]+$/.test(value.service_name) ? value.service_name : "workshop",
    auth_mode: value.auth_mode === "headers" ? "headers" : "bearer",
    access_token: String(value.access_token || "").trim(),
    user_id: String(value.user_id || "").trim(),
    username: String(value.username || "").trim(),
    app_id: String(value.app_id || "arckit-runtime").trim() || "arckit-runtime",
    session_id: String(value.session_id || "").trim()
  };
}

export function normalizeTask(value, fallbackProjectId = "") {
  if (!value || typeof value !== "object") {
    return null;
  }
  const id = scalarId(value.id ?? value.task_id);
  const projectId = scalarId(value.project_id ?? value.projectId ?? fallbackProjectId);
  if (!id || !projectId) {
    return null;
  }
  const state = TASK_STATES.includes(value.state) ? value.state : String(value.state || "unknown");
  return {
    id,
    project_id: projectId,
    title: String(value.title || value.content || value.name || `Task ${id}`).trim(),
    content: String(value.content || value.description || value.title || "").trim(),
    state,
    priority: normalizePriority(value.priority),
    version: String(value.version ?? value.updated_at ?? value.updatedAt ?? value.etag ?? ""),
    state_changed_at: String(value.state_changed_at ?? value.stateChangedAt ?? value.updated_at ?? value.updatedAt ?? ""),
    created_at: String(value.created_at ?? value.createdAt ?? ""),
    updated_at: String(value.updated_at ?? value.updatedAt ?? ""),
    assignee: value.assignee ?? value.owner ?? null,
    terminal: TERMINAL_STATES.has(state),
    raw: value
  };
}

function normalizeProject(value) {
  if (!value || typeof value !== "object") {
    return null;
  }
  const id = scalarId(value.id ?? value.project_id);
  if (!id) {
    return null;
  }
  return {
    id,
    name: String(value.name || value.title || `Project ${id}`).trim(),
    description: String(value.description || "").trim(),
    updated_at: String(value.updated_at ?? value.updatedAt ?? ""),
    raw: value
  };
}

function normalizeUser(value) {
  if (!value || typeof value !== "object") {
    return null;
  }
  return {
    id: scalarId(value.id ?? value.user_id ?? value.uuid),
    name: String(value.name || value.username || value.email || value.phone || "Current user").trim(),
    raw: value
  };
}

function dedupeById(items) {
  return [...new Map(items.map((item) => [item.id, item])).values()];
}

function buildUrl(config, path, query) {
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  const url = new URL(`${config.base_url}/${config.service_name}/v1/user${normalizedPath}`);
  for (const [key, value] of Object.entries(query || {})) {
    if (value === undefined || value === "") {
      continue;
    }
    if (Array.isArray(value)) {
      for (const item of value) {
        url.searchParams.append(key, String(item));
      }
    } else {
      url.searchParams.set(key, String(value));
    }
  }
  return url;
}

function buildHeaders(config, hasBody) {
  const headers = { Accept: "application/json" };
  if (hasBody) {
    headers["Content-Type"] = "application/json";
  }
  if (config.auth_mode === "bearer") {
    if (config.access_token) {
      headers.Authorization = `Bearer ${config.access_token}`;
    }
  } else {
    headers["X-User-ID"] = config.user_id;
    headers["X-User-Username"] = config.username;
    headers["X-User-AppID"] = config.app_id;
    if (config.session_id) {
      headers["X-User-SessionID"] = config.session_id;
    }
  }
  return headers;
}

async function readPayload(response) {
  const text = await response.text();
  if (!text) {
    return null;
  }
  try {
    return JSON.parse(text);
  } catch {
    throw new TaskSourceError("Task source returned invalid JSON.", {
      code: "invalid_response",
      status: response.status
    });
  }
}

function extractList(payload, keys) {
  if (Array.isArray(payload)) {
    return payload;
  }
  for (const key of keys) {
    if (Array.isArray(payload?.[key])) {
      return payload[key];
    }
  }
  return [];
}

function normalizePriority(value) {
  if (typeof value === "number" && Number.isFinite(value)) {
    return Math.max(0, 100 - value);
  }
  const text = String(value || "").trim().toUpperCase();
  const match = text.match(/^P([0-9]+)$/);
  return match ? Math.max(0, 100 - Number(match[1])) : Number(value) || 0;
}

function scalarId(value) {
  if (["string", "number"].includes(typeof value) && String(value).trim()) {
    return String(value).trim();
  }
  return "";
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
