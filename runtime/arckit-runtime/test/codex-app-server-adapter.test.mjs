import assert from "node:assert/strict";
import test from "node:test";
import { createCodexAppServerAdapter, waitForActiveTurn } from "../adapters/codex-app-server-adapter.mjs";

test("one app-server client reuses Controller, Case builder, and Case verifier threads", async () => {
  const client = new FakeClient();
  const adapter = createCodexAppServerAdapter({ clientFactory: () => client });

  const controllerPlan = await collect(adapter.runTurn({
    projectRoot: "/workspace/project",
    prompt: "plan",
    options: { resultKind: "agent-task", threadKey: "controller" }
  }));
  const specWorker = await collect(adapter.runTurn({
    projectRoot: "/workspace/project",
    prompt: "specify",
    options: { resultKind: "agent-task", threadKey: "worker:CASE-1:builder" }
  }));
  const resumedSpecWorker = await collect(adapter.runTurn({
    projectRoot: "/workspace/project",
    prompt: "reconcile spec",
    options: { resultKind: "agent-task", threadKey: "worker:CASE-1:builder" }
  }));
  await collect(adapter.runTurn({
    projectRoot: "/workspace/project",
    prompt: "verify",
    options: { resultKind: "agent-task", threadKey: "worker:CASE-1:verifier" }
  }));
  const controllerReview = await collect(adapter.runTurn({
    projectRoot: "/workspace/project",
    prompt: "review",
    options: { resultKind: "agent-task", threadKey: "controller" }
  }));
  adapter.close();

  assert.equal(client.requests.filter(({ method }) => method === "initialize").length, 1);
  assert.equal(client.requests.filter(({ method }) => method === "thread/start").length, 3);
  const turnStarts = client.requests.filter(({ method }) => method === "turn/start");
  assert.equal(turnStarts[0].params.threadId, "THREAD-1");
  assert.equal(turnStarts[1].params.threadId, "THREAD-2");
  assert.equal(turnStarts[2].params.threadId, "THREAD-2");
  assert.equal(turnStarts[3].params.threadId, "THREAD-3");
  assert.equal(turnStarts[4].params.threadId, "THREAD-1");
  assert.equal(controllerPlan.some(({ type }) => type === "codex.thread.start.completed"), true);
  assert.equal(specWorker.some(({ type }) => type === "codex.thread.start.completed"), true);
  assert.equal(resumedSpecWorker.some(({ type }) => type === "codex.thread.reused"), true);
  assert.equal(controllerReview.some(({ type }) => type === "codex.thread.reused"), true);
  assert.equal(client.closeCount, 1);
});

test("discarding a failed Worker lane forces a fresh thread on retry", async () => {
  const client = new FakeClient();
  const adapter = createCodexAppServerAdapter({ clientFactory: () => client });
  const threadKey = "worker:CASE-1:builder";

  await collect(adapter.runTurn({ projectRoot: "/workspace/project", prompt: "first", options: { resultKind: "agent-task", threadKey } }));
  assert.equal(adapter.discardThread(threadKey), true);
  await collect(adapter.runTurn({ projectRoot: "/workspace/project", prompt: "retry", options: { resultKind: "agent-task", threadKey } }));
  adapter.close();

  const turnStarts = client.requests.filter(({ method }) => method === "turn/start");
  assert.equal(turnStarts[0].params.threadId, "THREAD-1");
  assert.equal(turnStarts[1].params.threadId, "THREAD-2");
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
