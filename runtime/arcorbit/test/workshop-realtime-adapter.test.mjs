import assert from "node:assert/strict";
import test from "node:test";
import { EventEmitter } from "node:events";
import { createWorkshopRealtimeAdapter } from "../src/workshop-realtime-adapter.mjs";

class FakeWebSocket extends EventEmitter {
  static instances = [];
  constructor(url, protocols, options) {
    super();
    this.url = url;
    this.protocols = protocols;
    this.options = options;
    this.closed = false;
    FakeWebSocket.instances.push(this);
  }
  close() {
    if (this.closed) return;
    this.closed = true;
    this.emit("close");
  }
  message(payload) { this.emit("message", JSON.stringify(payload)); }
}

test("realtime adapter replays a persisted cursor before accepting buffered live events", async () => {
  FakeWebSocket.instances = [];
  const invalidations = [];
  const states = new Map([["12", { cursor: 40 }]]);
  const adapter = createWorkshopRealtimeAdapter({
    WebSocketImpl: FakeWebSocket,
    taskSource: {
      async realtimeConnection() { return { url: "wss://workshop.test/ws", protocols: ["workshop-ws"], headers: {} }; },
      async listProjectEvents(_projectId, { afterId }) {
        assert.equal(afterId, 40);
        return { events: [{ id: 41, event: "task.updated" }], next_after_id: 41, latest_event_id: 41, has_more: false };
      }
    },
    readProjectState: async (projectId) => states.get(String(projectId)),
    writeProjectState: async (projectId, update) => states.set(String(projectId), { ...(states.get(String(projectId)) || {}), ...update }),
    onInvalidate: async (projectId, details) => invalidations.push({ projectId: String(projectId), ...details }),
    setTimer(callback) { callback(); return 1; },
    clearTimer() {}
  });

  await adapter.updateProjects(["12"]);
  await new Promise((resolve) => setImmediate(resolve));
  const socket = FakeWebSocket.instances[0];
  socket.emit("open");
  socket.message({ schema_version: 1, event: "system.connected", project_id: 12, data: { latest_event_id: 41 } });
  socket.message({ id: 42, event: "task.created", project_id: 12, occurred_at: "2026-08-22T00:00:00.000Z" });
  await new Promise((resolve) => setImmediate(resolve));
  await new Promise((resolve) => setImmediate(resolve));

  assert.deepEqual(invalidations.map((item) => item.reason), ["replay", "event"]);
  assert.equal(states.get("12").cursor, 42);
  assert.equal(states.get("12").state, "connected");
  assert.equal(states.get("12").last_event_at, "2026-08-22T00:00:00.000Z");
  assert.ok(states.get("12").last_refreshed_at);
  adapter.stop();
});

test("realtime adapter converts an expired cursor into a current-state refresh", async () => {
  FakeWebSocket.instances = [];
  const invalidations = [];
  const states = new Map([["9", { cursor: 3 }]]);
  const adapter = createWorkshopRealtimeAdapter({
    WebSocketImpl: FakeWebSocket,
    taskSource: {
      async realtimeConnection() { return { url: "wss://workshop.test/ws", protocols: [], headers: {} }; },
      async listProjectEvents() { throw Object.assign(new Error("expired"), { code: "cursor_expired" }); }
    },
    readProjectState: async () => states.get("9"),
    writeProjectState: async (_projectId, update) => states.set("9", { ...states.get("9"), ...update }),
    onInvalidate: async (_projectId, details) => invalidations.push(details)
  });
  await adapter.updateProjects(["9"]);
  await new Promise((resolve) => setImmediate(resolve));
  const socket = FakeWebSocket.instances[0];
  socket.emit("open");
  socket.message({ schema_version: 1, event: "system.connected", project_id: 9, data: { latest_event_id: 88 } });
  await new Promise((resolve) => setImmediate(resolve));

  assert.equal(invalidations[0].reason, "cursor_expired");
  assert.equal(states.get("9").cursor, 88);
  adapter.stop();
});

test("realtime adapter reconnects before the websocket credential expires", async () => {
  FakeWebSocket.instances = [];
  const timers = [];
  let connectionCalls = 0;
  const adapter = createWorkshopRealtimeAdapter({
    WebSocketImpl: FakeWebSocket,
    taskSource: {
      async realtimeConnection() {
        connectionCalls += 1;
        return { url: "wss://workshop.test/ws", protocols: [], headers: {}, accessTokenExpiresAt: 120_000 };
      },
      async listProjectEvents() { return { events: [], next_after_id: 0, has_more: false }; }
    },
    nowMs: () => 0,
    readProjectState: async () => ({}),
    writeProjectState: async () => {},
    onInvalidate: async () => {},
    setTimer(callback, delay) {
      const timer = { callback, delay, cleared: false };
      timers.push(timer);
      return timer;
    },
    clearTimer(timer) { timer.cleared = true; }
  });

  await adapter.updateProjects(["12"]);
  await new Promise((resolve) => setImmediate(resolve));
  assert.equal(connectionCalls, 1);
  const credentialTimer = timers.find((timer) => timer.delay === 60_000);
  assert.ok(credentialTimer);

  credentialTimer.callback();
  await new Promise((resolve) => setImmediate(resolve));

  assert.equal(connectionCalls, 2);
  assert.equal(FakeWebSocket.instances.length, 2);
  adapter.stop();
});

test("realtime adapter treats an old Workshop handshake as legacy and refreshes id-less events without touching the cursor", async () => {
  FakeWebSocket.instances = [];
  const invalidations = [];
  const writes = [];
  let cursorReads = 0;
  let replayCalls = 0;
  const adapter = createWorkshopRealtimeAdapter({
    WebSocketImpl: FakeWebSocket,
    taskSource: {
      async realtimeConnection() { return { url: "wss://old-workshop.test/ws", protocols: ["workshop-ws"], headers: {} }; },
      async listProjectEvents() { replayCalls += 1; throw new Error("legacy service has no replay route"); }
    },
    readProjectState: async () => { cursorReads += 1; return { cursor: 77 }; },
    writeProjectState: async (_projectId, update) => writes.push(update),
    onInvalidate: async (_projectId, details) => invalidations.push(details)
  });

  await adapter.updateProjects(["12"]);
  await new Promise((resolve) => setImmediate(resolve));
  const socket = FakeWebSocket.instances[0];
  socket.emit("open");
  socket.message({ event: "system.connected", project_id: 12, data: { message: "connected" } });
  await new Promise((resolve) => setImmediate(resolve));
  socket.message({ event: "task.updated", project_id: 12, occurred_at: "2026-08-22T00:00:00.000Z" });
  await new Promise((resolve) => setTimeout(resolve, 350));

  adapter.reconnectAll();
  await new Promise((resolve) => setImmediate(resolve));
  const reconnected = FakeWebSocket.instances[1];
  reconnected.emit("open");
  reconnected.message({ event: "system.connected", project_id: 12, data: { message: "connected again" } });
  await new Promise((resolve) => setImmediate(resolve));

  assert.deepEqual(invalidations.map((item) => item.reason), ["legacy_snapshot", "event", "legacy_snapshot"]);
  assert.equal(cursorReads, 0);
  assert.equal(replayCalls, 0);
  assert.equal(writes.some((update) => Object.hasOwn(update, "cursor")), false);
  assert.equal(writes.at(-1).mode, "legacy");
  assert.equal(writes.at(-1).state, "connected");
  assert.equal(adapter.isDegraded(), false);
  adapter.stop();
});
