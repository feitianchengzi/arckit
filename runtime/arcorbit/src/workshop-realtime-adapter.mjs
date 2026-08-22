import WebSocket from "ws";
import { EventEmitter } from "node:events";

const RECONNECT_MAX_MS = 30_000;
const INVALIDATION_DEBOUNCE_MS = 300;
const REALTIME_MODE_UNKNOWN = "unknown";
const REALTIME_MODE_RESUMABLE = "resumable";
const REALTIME_MODE_LEGACY = "legacy";

export function createWorkshopRealtimeAdapter({
  taskSource,
  WebSocketImpl = WebSocket,
  readProjectState = async () => ({}),
  writeProjectState = async () => {},
  onInvalidate = async () => {},
  now = () => new Date().toISOString(),
  nowMs = () => Date.now(),
  setTimer = setTimeout,
  clearTimer = clearTimeout
}) {
  const emitter = new EventEmitter();
  const connections = new Map();
  const stateWrites = new Map();
  let stopped = true;

  function persist(projectId, update) {
    const key = String(projectId);
    const previous = stateWrites.get(key) || Promise.resolve();
    const next = previous.catch(() => {}).then(() => writeProjectState(projectId, update));
    stateWrites.set(key, next);
    next.then(() => {
      if (stateWrites.get(key) === next) stateWrites.delete(key);
    }, () => {
      if (stateWrites.get(key) === next) stateWrites.delete(key);
    });
    return next;
  }

  function emit(projectId, state, details = {}) {
    const update = { project_id: String(projectId), state, updated_at: now(), ...details };
    persist(projectId, update).catch((error) => {
      const connection = connections.get(String(projectId));
      if (connection) connection.degraded = true;
      emitter.emit("event", { ...update, state: "degraded", error: error.message });
    });
    emitter.emit("event", update);
  }

  async function updateProjects(projectIds) {
    const desired = new Set((projectIds || []).map(String).filter(Boolean));
    stopped = false;
    for (const [projectId, connection] of connections) {
      if (!desired.has(projectId)) {
        closeConnection(connection, true);
        connections.delete(projectId);
        emit(projectId, "idle", { mode: REALTIME_MODE_UNKNOWN, error: "" });
      }
    }
    for (const projectId of desired) {
      if (!connections.has(projectId)) {
        const connection = newConnection(projectId);
        connections.set(projectId, connection);
        connect(connection).catch((error) => handleFailure(connection, error));
      }
    }
  }

  function newConnection(projectId) {
    return { projectId, socket: null, reconnectTimer: null, authTimer: null, attempt: 0, generation: 0, manual: false, recovering: true, degraded: false, mode: REALTIME_MODE_UNKNOWN, buffered: [], invalidationTimer: null, pendingEvents: [], pendingCursor: 0 };
  }

  async function connect(connection) {
    if (stopped || connection.manual) return;
    connection.generation += 1;
    const generation = connection.generation;
    connection.recovering = true;
    connection.degraded = false;
    connection.mode = REALTIME_MODE_UNKNOWN;
    connection.buffered = [];
    connection.pendingEvents = [];
    connection.pendingCursor = 0;
    if (connection.invalidationTimer) clearTimer(connection.invalidationTimer);
    connection.invalidationTimer = null;
    emit(connection.projectId, connection.attempt ? "reconnecting" : "connecting", { mode: connection.mode, error: "" });
    const config = await taskSource.realtimeConnection(connection.projectId);
    if (stopped || connection.manual || generation !== connection.generation) return;
    const socket = new WebSocketImpl(config.url, config.protocols, { headers: config.headers });
    connection.socket = socket;
    scheduleCredentialReconnect(connection, config.accessTokenExpiresAt, generation);

    bindSocket(socket, "open", () => {
      if (generation !== connection.generation) return;
      connection.attempt = 0;
      emit(connection.projectId, "recovering", { mode: connection.mode, error: "" });
    });
    bindSocket(socket, "message", (input) => {
      if (generation !== connection.generation) return;
      const payload = parseMessage(input);
      if (!payload?.event) return;
      if (payload.event === "system.connected") {
        recover(connection, payload, generation).catch((error) => {
          handleFailure(connection, error);
          socket.close();
        });
      } else if (connection.recovering) {
        connection.buffered.push(payload);
      } else {
        queueInvalidation(connection, payload);
      }
    });
    bindSocket(socket, "error", (error) => {
      if (generation === connection.generation) {
        connection.degraded = true;
        emit(connection.projectId, "degraded", { mode: connection.mode, error: error?.message || "WebSocket error" });
      }
    });
    bindSocket(socket, "close", () => {
      if (generation !== connection.generation || connection.manual || stopped) return;
      scheduleReconnect(connection);
    });
  }

  async function recover(connection, connected, generation) {
    connection.mode = realtimeMode(connected);
    if (connection.mode === REALTIME_MODE_LEGACY) {
      await recoverLegacy(connection, generation);
      return;
    }
    const persisted = await readProjectState(connection.projectId) || {};
    let cursor = positiveInteger(persisted.cursor);
    const latest = positiveInteger(connected.data?.latest_event_id);
    const recoveredEvents = [];
    let refreshed = false;
    if (!cursor) {
      await onInvalidate(connection.projectId, { reason: "initial_snapshot", event_types: ["system.connected"] });
      refreshed = true;
      cursor = latest;
    } else {
      try {
        let hasMore = true;
        while (hasMore && cursor < latest) {
          const page = await taskSource.listProjectEvents(connection.projectId, { afterId: cursor, limit: 500 });
          const events = Array.isArray(page?.events) ? page.events : [];
          recoveredEvents.push(...events.filter((event) => positiveInteger(event.id) > cursor));
          const next = positiveInteger(page?.next_after_id) || cursor;
          hasMore = Boolean(page?.has_more) && next > cursor;
          cursor = next;
        }
      } catch (error) {
        if (error?.code !== "cursor_expired") throw error;
        await onInvalidate(connection.projectId, { reason: "cursor_expired", event_types: ["system.resync_required"] });
        refreshed = true;
        cursor = latest;
      }
      if (recoveredEvents.length) {
        await onInvalidate(connection.projectId, { reason: "replay", event_types: unique(recoveredEvents.map((event) => event.event)) });
        refreshed = true;
        cursor = Math.max(cursor, ...recoveredEvents.map((event) => positiveInteger(event.id)));
      }
    }
    if (generation !== connection.generation || stopped) return;
    const recoveredAt = now();
    await persist(connection.projectId, {
      state: "connected",
      mode: connection.mode,
      cursor,
      error: "",
      last_event_at: latestEventTime(recoveredEvents),
      ...(refreshed ? { last_refreshed_at: recoveredAt } : {}),
      updated_at: recoveredAt
    });
    connection.pendingCursor = cursor;
    connection.recovering = false;
    connection.degraded = false;
    connection.buffered.sort((a, b) => positiveInteger(a.id) - positiveInteger(b.id));
    for (const event of connection.buffered) {
      if (positiveInteger(event.id) > cursor) queueInvalidation(connection, event);
    }
    connection.buffered = [];
    emit(connection.projectId, "connected", { mode: connection.mode, cursor, error: "" });
  }

  async function recoverLegacy(connection, generation) {
    await onInvalidate(connection.projectId, { reason: "legacy_snapshot", event_types: ["system.connected"] });
    if (generation !== connection.generation || stopped) return;
    const refreshedAt = now();
    await persist(connection.projectId, {
      state: "connected",
      mode: connection.mode,
      error: "",
      last_refreshed_at: refreshedAt,
      updated_at: refreshedAt
    });
    connection.pendingCursor = 0;
    connection.recovering = false;
    connection.degraded = false;
    for (const event of connection.buffered) queueInvalidation(connection, event);
    connection.buffered = [];
    emit(connection.projectId, "connected", { mode: connection.mode, error: "" });
  }

  function queueInvalidation(connection, event) {
    const id = positiveInteger(event.id);
    if (connection.mode !== REALTIME_MODE_LEGACY) {
      if (!id || id <= connection.pendingCursor) return;
      connection.pendingCursor = Math.max(connection.pendingCursor, id);
    }
    connection.pendingEvents.push(event);
    if (connection.invalidationTimer) return;
    const generation = connection.generation;
    connection.invalidationTimer = setTimer(async () => {
      connection.invalidationTimer = null;
      const events = connection.pendingEvents.splice(0);
      const cursor = connection.pendingCursor;
      try {
        await onInvalidate(connection.projectId, { reason: "event", event_types: unique(events.map((item) => item.event)) });
        if (generation !== connection.generation || stopped) return;
        const refreshedAt = now();
        const update = {
          state: "connected",
          mode: connection.mode,
          error: "",
          last_event_at: latestEventTime(events) || refreshedAt,
          last_refreshed_at: refreshedAt,
          updated_at: refreshedAt
        };
        if (connection.mode === REALTIME_MODE_RESUMABLE) update.cursor = cursor;
        await persist(connection.projectId, update);
        emit(connection.projectId, "connected", {
          mode: connection.mode,
          ...(connection.mode === REALTIME_MODE_RESUMABLE ? { cursor } : {}),
          error: ""
        });
      } catch (error) {
        connection.pendingEvents.unshift(...events);
        emit(connection.projectId, "degraded", { error: error.message });
        connection.socket?.close();
      }
    }, INVALIDATION_DEBOUNCE_MS);
  }

  function scheduleCredentialReconnect(connection, expiresAt, generation) {
    if (connection.authTimer) clearTimer(connection.authTimer);
    connection.authTimer = null;
    const expiry = Number(expiresAt);
    if (!Number.isFinite(expiry) || expiry <= 0) return;
    const delay = Math.max(1_000, expiry - nowMs() - 60_000);
    connection.authTimer = setTimer(() => {
      connection.authTimer = null;
      if (generation !== connection.generation || connection.manual || stopped) return;
      closeConnection(connection, false);
      connection.manual = false;
      connect(connection).catch((error) => handleFailure(connection, error));
    }, delay);
  }

  function handleFailure(connection, error) {
    connection.degraded = true;
    emit(connection.projectId, "degraded", { mode: connection.mode, error: error?.message || String(error || "Realtime connection failed") });
    if (!connection.manual && !stopped) scheduleReconnect(connection);
  }

  function scheduleReconnect(connection) {
    if (connection.reconnectTimer || connection.manual || stopped) return;
    connection.attempt = Math.min(connection.attempt + 1, 6);
    connection.degraded = true;
    emit(connection.projectId, "reconnecting", { mode: connection.mode, error: "" });
    connection.reconnectTimer = setTimer(() => {
      connection.reconnectTimer = null;
      connect(connection).catch((error) => handleFailure(connection, error));
    }, Math.min(1000 * 2 ** (connection.attempt - 1), RECONNECT_MAX_MS));
  }

  function reconnectAll() {
    for (const connection of connections.values()) {
      closeConnection(connection, false);
      connection.manual = false;
      connection.attempt = 0;
      connect(connection).catch((error) => handleFailure(connection, error));
    }
  }

  function closeConnection(connection, manual) {
    connection.manual = manual;
    connection.generation += 1;
    if (connection.reconnectTimer) clearTimer(connection.reconnectTimer);
    if (connection.authTimer) clearTimer(connection.authTimer);
    if (connection.invalidationTimer) clearTimer(connection.invalidationTimer);
    connection.reconnectTimer = null;
    connection.authTimer = null;
    connection.invalidationTimer = null;
    connection.socket?.close();
    connection.socket = null;
  }

  function stop() {
    stopped = true;
    for (const connection of connections.values()) closeConnection(connection, true);
    connections.clear();
  }

  return {
    onEvent(listener) { emitter.on("event", listener); return () => emitter.off("event", listener); },
    updateProjects,
    reconnectAll,
    stop,
    isDegraded() { return [...connections.values()].some((item) => item.recovering || item.degraded || item.attempt > 0); },
    projectIds() { return [...connections.keys()]; }
  };
}

function bindSocket(socket, event, listener) {
  if (typeof socket.on === "function") socket.on(event, listener);
  else socket.addEventListener(event, listener);
}

function parseMessage(input) {
  const raw = input?.data ?? input;
  try {
    return JSON.parse(typeof raw === "string" ? raw : Buffer.from(raw).toString("utf8"));
  } catch {
    return null;
  }
}

function positiveInteger(value) {
  const number = Number(value);
  return Number.isSafeInteger(number) && number > 0 ? number : 0;
}

function realtimeMode(connected) {
  const data = connected?.data;
  const hasLatest = data && typeof data === "object" && Object.prototype.hasOwnProperty.call(data, "latest_event_id");
  const latest = Number(data?.latest_event_id);
  if (Number(connected?.schema_version) === 1 && hasLatest && Number.isSafeInteger(latest) && latest >= 0) {
    return REALTIME_MODE_RESUMABLE;
  }
  if (connected?.schema_version === undefined || connected?.schema_version === null) {
    return REALTIME_MODE_LEGACY;
  }
  throw new Error(`Unsupported Workshop realtime schema: ${String(connected.schema_version)}`);
}

function unique(values) { return [...new Set(values.filter(Boolean))]; }

function latestEventTime(events) {
  return (events || []).map((event) => String(event?.occurred_at || "")).filter(Boolean).sort().at(-1) || "";
}
