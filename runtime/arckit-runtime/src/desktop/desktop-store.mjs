import { createHash } from "node:crypto";
import { existsSync } from "node:fs";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";

export function createDesktopStore({ dataDir, runsDir, storePath }) {
  async function ensureStore() {
    await mkdir(dataDir, { recursive: true });
    await mkdir(runsDir, { recursive: true });
    if (!existsSync(storePath)) {
      await writeJson(storePath, { version: 4, projects: [], runs: [], sessions: {}, messages: {}, settings: defaultSettings() });
    }
  }

  async function readStore() {
    await ensureStore();
    const store = JSON.parse(await readFile(storePath, "utf8"));
    return normalizeStore(store);
  }

  async function updateStore(updater) {
    const store = await readStore();
    const next = await updater(store) || store;
    await writeJson(storePath, next);
    return next;
  }

  return {
    ensureStore,
    readStore,
    updateStore
  };
}

export function normalizeStore(store) {
  const normalized = {
    version: 4,
    projects: Array.isArray(store.projects) ? store.projects : [],
    runs: Array.isArray(store.runs) ? store.runs : [],
    sessions: store.sessions && typeof store.sessions === "object" ? store.sessions : {},
    messages: store.messages && typeof store.messages === "object" ? store.messages : {},
    settings: normalizeSettings(store.settings || {})
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
    if (run.session_id) {
      return run;
    }
    const session = ensureProjectSession(normalized, run.project_id);
    return { ...run, session_id: session.id };
  });
  return normalized;
}

export function defaultSettings() {
  return {
    codex_proxy: {
      enabled: false,
      url: "http://127.0.0.1:7890"
    }
  };
}

export function normalizeSettings(settings = {}) {
  const defaults = defaultSettings();
  const proxy = settings.codex_proxy && typeof settings.codex_proxy === "object"
    ? settings.codex_proxy
    : {};
  return {
    codex_proxy: {
      enabled: Boolean(proxy.enabled),
      url: String(proxy.url || defaults.codex_proxy.url).trim() || defaults.codex_proxy.url
    }
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

export function projectId(projectPath) {
  return createHash("sha256").update(resolve(projectPath)).digest("hex").slice(0, 16);
}

export async function writeJson(path, value) {
  await mkdir(dirname(path), { recursive: true });
  await writeFile(path, `${JSON.stringify(value, null, 2)}\n`, "utf8");
}

export async function appendText(path, text) {
  await mkdir(dirname(path), { recursive: true });
  await writeFile(path, text, { encoding: "utf8", flag: "a" });
}

export async function appendJsonLine(path, value) {
  await appendText(path, `${JSON.stringify(value)}\n`);
}
