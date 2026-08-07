import { createHash } from "node:crypto";
import { existsSync } from "node:fs";
import { mkdir, readFile, rename, rm, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { authProjection, DEFAULT_WORKSHOP_BASE_URL, normalizeTaskSourceSettings } from "../task-source-adapter.mjs";

export function createDesktopStore({ dataDir, runsDir, storePath }) {
  let storeQueue = Promise.resolve();

  async function ensureStore() {
    await mkdir(dataDir, { recursive: true });
    await mkdir(runsDir, { recursive: true });
    if (!existsSync(storePath)) {
      await writeJson(storePath, {
        version: 7,
        projects: [],
        runs: [],
        sessions: {},
        messages: {},
        settings: defaultSettings(),
        automation: defaultAutomationState()
      });
    }
  }

  async function readStoreFile() {
    await ensureStore();
    const store = await readJsonWithRetry(storePath);
    return normalizeStore(store);
  }

  async function readStore() {
    await storeQueue;
    return readStoreFile();
  }

  async function updateStore(updater) {
    const operation = storeQueue.catch(() => {}).then(async () => {
      const store = await readStoreFile();
      const next = await updater(store) || store;
      const persisted = normalizeStore(next);
      await writeJson(storePath, persisted);
      return persisted;
    });
    storeQueue = operation.then(() => {}, () => {});
    return operation;
  }

  return {
    ensureStore,
    readStore,
    updateStore
  };
}

export function normalizeStore(store) {
  const normalized = {
    version: 7,
    projects: Array.isArray(store.projects) ? store.projects : [],
    runs: Array.isArray(store.runs) ? store.runs : [],
    sessions: store.sessions && typeof store.sessions === "object" ? store.sessions : {},
    messages: store.messages && typeof store.messages === "object" ? store.messages : {},
    settings: normalizeSettings(store.settings || {}),
    automation: normalizeAutomationState(store.automation || {})
  };
  for (const project of normalized.projects) {
    const legacyMessages = Array.isArray(normalized.messages[project.id]) ? normalized.messages[project.id] : null;
    if (legacyMessages) {
      const session = ensureProjectSession(normalized, project.id);
      normalized.messages[session.id] = legacyMessages.map((message) => ({
        ...message,
        session_id: session.id
      }));
      delete normalized.messages[project.id];
    } else {
      ensureProjectSession(normalized, project.id);
    }
  }
  normalized.runs = normalized.runs.map((run) => {
    const { activity: _activity, ...runRecord } = run || {};
    if (run?.session_id) {
      return runRecord;
    }
    const session = ensureProjectSession(normalized, runRecord.project_id);
    return { ...runRecord, session_id: session.id };
  });
  return normalized;
}

export function defaultSettings() {
  return {
    codex_proxy: {
      enabled: false,
      url: "http://127.0.0.1:7890"
    },
    task_source: {
      enabled: true,
      base_url: DEFAULT_WORKSHOP_BASE_URL,
      service_name: "workshop",
      auth_mode: "nebula",
      access_token: "",
      refresh_token: "",
      token_type: "Bearer",
      access_token_expires_at: 0,
      refresh_token_expires_at: 0,
      auth_state: "logged_out",
      auth_error: "",
      user_id: "",
      username: "",
      app_id: "arckit-runtime",
      session_id: ""
    }
  };
}

export function normalizeSettings(settings = {}) {
  const defaults = defaultSettings();
  const proxy = settings.codex_proxy && typeof settings.codex_proxy === "object"
    ? settings.codex_proxy
    : {};
  const taskSource = settings.task_source && typeof settings.task_source === "object"
    ? settings.task_source
    : {};
  return {
    codex_proxy: {
      enabled: Boolean(proxy.enabled),
      url: String(proxy.url || defaults.codex_proxy.url).trim() || defaults.codex_proxy.url
    },
    task_source: normalizeTaskSourceSettings({
      ...defaults.task_source,
      ...taskSource,
      service_name: safeIdentifier(taskSource.service_name, defaults.task_source.service_name),
      app_id: safeIdentifier(taskSource.app_id, defaults.task_source.app_id)
    })
  };
}

export function publicSettings(settings = {}) {
  const normalized = normalizeSettings(settings);
  const taskSource = normalized.task_source;
  const exposesDebugHeaders = taskSource.auth_mode === "headers";
  return {
    codex_proxy: normalized.codex_proxy,
    task_source: {
      enabled: taskSource.enabled,
      base_url: taskSource.base_url,
      service_name: taskSource.service_name,
      auth_mode: taskSource.auth_mode,
      user_id: exposesDebugHeaders ? taskSource.user_id : "",
      username: exposesDebugHeaders ? taskSource.username : "",
      app_id: taskSource.app_id,
      session_id: exposesDebugHeaders ? taskSource.session_id : "",
      access_token: "",
      access_token_configured: Boolean(taskSource.access_token),
      refresh_session_configured: Boolean(taskSource.refresh_token),
      authentication: authProjection(taskSource)
    }
  };
}

export function defaultAutomationState() {
  return {
    enabled: false,
    queue_paused: false,
    project_bindings: {},
    project_participation: {},
    snapshot: {
      user: null,
      projects: [],
      tasks: [],
      synced_at: "",
      source_status: "logged_out",
      errors: []
    },
    active_task: null,
    attention_items: [],
    recovery_items: [],
    recent_completions: []
  };
}

export function normalizeAutomationState(value = {}) {
  const defaults = defaultAutomationState();
  const snapshot = value.snapshot && typeof value.snapshot === "object" ? value.snapshot : {};
  return {
    enabled: Boolean(value.enabled),
    queue_paused: Boolean(value.queue_paused),
    project_bindings: stringMap(value.project_bindings),
    project_participation: booleanMap(value.project_participation),
    snapshot: {
      user: snapshot.user && typeof snapshot.user === "object" ? snapshot.user : null,
      projects: Array.isArray(snapshot.projects) ? snapshot.projects : [],
      tasks: Array.isArray(snapshot.tasks) ? snapshot.tasks : [],
      synced_at: String(snapshot.synced_at || ""),
      source_status: ["logged_out", "unconfigured", "syncing", "healthy", "degraded", "unauthenticated", "error"].includes(snapshot.source_status)
        ? snapshot.source_status
        : defaults.snapshot.source_status,
      errors: Array.isArray(snapshot.errors) ? snapshot.errors.map(normalizeAutomationError).slice(0, 50) : []
    },
    active_task: value.active_task && typeof value.active_task === "object" ? value.active_task : null,
    attention_items: Array.isArray(value.attention_items) ? value.attention_items.slice(0, 50) : [],
    recovery_items: Array.isArray(value.recovery_items)
      ? value.recovery_items.slice(0, 50).map((item) => ({ ...item, responsibility: "operator" }))
      : [],
    recent_completions: Array.isArray(value.recent_completions) ? value.recent_completions.slice(0, 30) : []
  };
}

export function buildRuntimeEnv(baseEnv, settings) {
  const proxy = normalizeSettings(settings).codex_proxy;
  if (!proxy.enabled) {
    return baseEnv;
  }
  return {
    ...baseEnv,
    HTTP_PROXY: proxy.url,
    HTTPS_PROXY: proxy.url,
    http_proxy: proxy.url,
    https_proxy: proxy.url
  };
}

export function ensureProjectSession(store, projectIdValue) {
  store.sessions ||= {};
  store.messages ||= {};
  store.sessions[projectIdValue] ||= [];
  if (store.sessions[projectIdValue].length === 0) {
    const session = {
      id: `SESSION-${projectIdValue}-default`,
      project_id: projectIdValue,
      title: "Default chat",
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    store.sessions[projectIdValue].push(session);
    store.messages[session.id] ||= [];
  }
  return store.sessions[projectIdValue][0];
}

export function getSession(store, projectIdValue, sessionIdValue = "") {
  ensureProjectSession(store, projectIdValue);
  const session = sessionIdValue
    ? store.sessions[projectIdValue].find((item) => item.id === sessionIdValue)
    : store.sessions[projectIdValue][0];
  if (!session) {
    throw new Error(`Unknown session: ${sessionIdValue}`);
  }
  store.messages[session.id] ||= [];
  return session;
}

export function findSession(store, projectIdValue, sessionIdValue = "") {
  ensureProjectSession(store, projectIdValue);
  const session = sessionIdValue
    ? store.sessions[projectIdValue].find((item) => item.id === sessionIdValue)
    : store.sessions[projectIdValue][0];
  if (!session) {
    return null;
  }
  store.messages[session.id] ||= [];
  return session;
}

export function deleteProjectSession(store, projectIdValue, sessionIdValue) {
  const sessions = store.sessions?.[projectIdValue] || [];
  const session = sessions.find((item) => item.id === sessionIdValue);
  if (!session) {
    return null;
  }
  store.sessions[projectIdValue] = sessions.filter((item) => item.id !== sessionIdValue);
  delete store.messages?.[sessionIdValue];
  return session;
}

export function projectId(projectPath) {
  return createHash("sha256").update(resolve(projectPath)).digest("hex").slice(0, 16);
}

export async function writeJson(path, value) {
  await mkdir(dirname(path), { recursive: true });
  const tempPath = `${path}.${process.pid}.${Date.now()}.${Math.random().toString(16).slice(2)}.tmp`;
  try {
    await writeFile(tempPath, `${JSON.stringify(value, null, 2)}\n`, "utf8");
    await rename(tempPath, path);
  } catch (error) {
    await rm(tempPath, { force: true }).catch(() => {});
    throw error;
  }
}

export async function appendText(path, text) {
  await mkdir(dirname(path), { recursive: true });
  await writeFile(path, text, { encoding: "utf8", flag: "a" });
}

export async function appendJsonLine(path, value) {
  await appendText(path, `${JSON.stringify(value)}\n`);
}

async function readJsonWithRetry(path) {
  let lastError;
  for (let attempt = 0; attempt < 4; attempt += 1) {
    try {
      return JSON.parse(await readFile(path, "utf8"));
    } catch (error) {
      lastError = error;
      if (!(error instanceof SyntaxError) || attempt === 3) {
        break;
      }
      await delay(25 * (attempt + 1));
    }
  }
  throw lastError;
}

function delay(ms) {
  return new Promise((resolveDelay) => setTimeout(resolveDelay, ms));
}

function safeIdentifier(value, fallback) {
  const text = String(value || "").trim();
  return /^[a-zA-Z0-9_-]+$/.test(text) ? text : fallback;
}

function stringMap(value) {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return {};
  }
  return Object.fromEntries(Object.entries(value)
    .map(([key, item]) => [String(key), String(item || "").trim()])
    .filter(([, item]) => item));
}

function booleanMap(value) {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return {};
  }
  return Object.fromEntries(Object.entries(value).map(([key, item]) => [String(key), Boolean(item)]));
}

function normalizeAutomationError(value) {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return {
      code: "task_source_error",
      status: 0,
      message: String(value || "Task source error"),
      project_id: ""
    };
  }
  return {
    code: String(value.code || "task_source_error"),
    status: Number(value.status || 0),
    message: String(value.message || "Task source error"),
    project_id: String(value.project_id || "")
  };
}
