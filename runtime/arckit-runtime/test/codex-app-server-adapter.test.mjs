import assert from "node:assert/strict";
import test from "node:test";
import { createCodexAppServerAdapter, waitForActiveTurn } from "../adapters/codex-app-server-adapter.mjs";

test("one app-server client reuses Controller and same-type Worker threads while isolating verification", async () => {
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
    options: { resultKind: "agent-task", threadKey: "worker:CASE-1:product" }
  }));
  const resumedSpecWorker = await collect(adapter.runTurn({
    projectRoot: "/workspace/project",
    prompt: "reconcile spec",
    options: { resultKind: "agent-task", threadKey: "worker:CASE-1:product" }
  }));
  await collect(adapter.runTurn({
    projectRoot: "/workspace/project",
    prompt: "verify",
    options: { resultKind: "agent-task", threadKey: "worker:CASE-1:verification" }
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
  const threadKey = "worker:CASE-1:implementation";

  await collect(adapter.runTurn({ projectRoot: "/workspace/project", prompt: "first", options: { resultKind: "agent-task", threadKey } }));
  assert.equal(adapter.discardThread(threadKey), true);
  await collect(adapter.runTurn({ projectRoot: "/workspace/project", prompt: "retry", options: { resultKind: "agent-task", threadKey } }));
  adapter.close();

  const turnStarts = client.requests.filter(({ method }) => method === "turn/start");
  assert.equal(turnStarts[0].params.threadId, "THREAD-1");
  assert.equal(turnStarts[1].params.threadId, "THREAD-2");
});

test("equivalent active commands are single-flight and become a soft event", async () => {
  const client = new DuplicateCommandClient();
  const adapter = createCodexAppServerAdapter({ clientFactory: () => client });
  const events = await collect(adapter.runTurn({
    projectRoot: "/workspace/project",
    prompt: "build once",
    options: { resultKind: "agent-task", threadKey: "worker:CASE-1:implementation" }
  }));
  adapter.close();

  assert.equal(client.commandDecisions[0].decision, "approve");
  assert.equal(client.commandDecisions[1].decision, "denied");
  assert.equal(client.commandDecisions[2].decision, "approve");
  assert.equal(events.filter(({ type }) => type === "codex.command.duplicate.suppressed").length, 1);
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

class DuplicateCommandClient extends FakeClient {
  constructor() {
    super();
    this.commandDecisions = [];
  }

  async request(method, params) {
    if (method !== "turn/start") return super.request(method, params);
    this.requests.push({ method, params });
    const turn = { id: `TURN-${++this.turnCount}` };
    queueMicrotask(async () => {
      this.emit("turn/started", { threadId: params.threadId, turn });
      const approve = this.requestHandlers[0];
      const base = {
        threadId: params.threadId,
        turnId: turn.id,
        command: "cmake --build build --target tests -j4",
        cwd: "/workspace/project",
        startedAtMs: 100
      };
      this.commandDecisions.push(await approve({ method: "item/commandExecution/requestApproval", params: { ...base, itemId: "CMD-1" } }));
      this.commandDecisions.push(await approve({ method: "item/commandExecution/requestApproval", params: { ...base, command: "cmake --build build --target tests -j2", itemId: "CMD-2", startedAtMs: 200 } }));
      this.emit("item/completed", { item: { id: "CMD-1", type: "commandExecution", command: base.command } });
      this.commandDecisions.push(await approve({ method: "item/commandExecution/requestApproval", params: { ...base, command: "cmake --build build --target tests -j2", itemId: "CMD-3", startedAtMs: 300 } }));
      this.emit("item/completed", { item: { id: "CMD-3", type: "commandExecution", command: base.command } });
      this.emit("item/completed", { item: { type: "agentMessage", text: "completed" } });
      this.emit("turn/completed", { threadId: params.threadId, turn });
    });
    return { turn };
  }
}
