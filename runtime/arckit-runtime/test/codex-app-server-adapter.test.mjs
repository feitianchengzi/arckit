import assert from "node:assert/strict";
import test from "node:test";
import { createCodexAppServerAdapter, waitForActiveTurn } from "../adapters/codex-app-server-adapter.mjs";

test("one app-server client reuses the Controller thread while keeping Worker threads isolated", async () => {
  const client = new FakeClient();
  const adapter = createCodexAppServerAdapter({ clientFactory: () => client });

  const controllerPlan = await collect(adapter.runTurn({
    projectRoot: "/workspace/project",
    prompt: "plan",
    options: { resultKind: "agent-task", threadKey: "controller" }
  }));
  const worker = await collect(adapter.runTurn({
    projectRoot: "/workspace/project",
    prompt: "work",
    options: { resultKind: "agent-task" }
  }));
  const controllerReview = await collect(adapter.runTurn({
    projectRoot: "/workspace/project",
    prompt: "review",
    options: { resultKind: "agent-task", threadKey: "controller" }
  }));
  adapter.close();

  assert.equal(client.requests.filter(({ method }) => method === "initialize").length, 1);
  assert.equal(client.requests.filter(({ method }) => method === "thread/start").length, 2);
  const turnStarts = client.requests.filter(({ method }) => method === "turn/start");
  assert.equal(turnStarts[0].params.threadId, "THREAD-1");
  assert.equal(turnStarts[1].params.threadId, "THREAD-2");
  assert.equal(turnStarts[2].params.threadId, "THREAD-1");
  assert.equal(controllerPlan.some(({ type }) => type === "codex.thread.start.completed"), true);
  assert.equal(worker.some(({ type }) => type === "codex.thread.start.completed"), true);
  assert.equal(controllerReview.some(({ type }) => type === "codex.thread.reused"), true);
  assert.equal(client.closeCount, 1);
});

test("operator control waits for turn/started after turn/start returns", async () => {
  const state = {
    threadId: "THREAD-1",
    turnId: "TURN-1",
    turnStarted: false,
    completed: false
  };
  const waiting = waitForActiveTurn(state, { timeoutMs: 100, pollIntervalMs: 1 });
  setTimeout(() => {
    state.turnStarted = true;
  }, 5);
  await waiting;
});

test("operator control does not wait past a completed turn", async () => {
  await assert.rejects(
    waitForActiveTurn({ turnStarted: false, completed: true }, { timeoutMs: 10, pollIntervalMs: 1 }),
    /already completed/
  );
});

async function collect(iterable) {
  const events = [];
  for await (const event of iterable) events.push(event);
  return events;
}

class FakeClient {
  constructor() {
    this.requests = [];
    this.notificationHandlers = [];
    this.requestHandlers = [];
    this.closeHandlers = [];
    this.closeCount = 0;
    this.threadCount = 0;
    this.turnCount = 0;
  }

  onNotification(handler) { this.notificationHandlers.push(handler); }
  onRequest(handler) { this.requestHandlers.push(handler); }
  onClose(handler) { this.closeHandlers.push(handler); }
  notify() {}

  async request(method, params) {
    this.requests.push({ method, params });
    if (method === "initialize") return { server: "fake" };
    if (method === "thread/start") return { thread: { id: `THREAD-${++this.threadCount}` } };
    if (method === "turn/start") {
      const turn = { id: `TURN-${++this.turnCount}` };
      queueMicrotask(() => {
        this.emit("turn/started", { threadId: params.threadId, turn });
        this.emit("item/completed", { item: { type: "agentMessage", text: "completed" } });
        this.emit("turn/completed", { threadId: params.threadId, turn });
      });
      return { turn };
    }
    throw new Error(`Unexpected request: ${method}`);
  }

  emit(method, params) {
    for (const handler of this.notificationHandlers) handler({ method, params });
  }

  close() {
    this.closeCount += 1;
  }
}
