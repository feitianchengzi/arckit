import assert from "node:assert/strict";
import test from "node:test";
import { createCodexAppServerAdapter, waitForActiveTurn } from "../adapters/codex-app-server-adapter.mjs";

test("one app-server client starts one persistent thread and reuses it for every turn", async () => {
  const client = new FakeClient();
  const adapter = createCodexAppServerAdapter({ clientFactory: () => client });
  const binding = [];
  const first = await collect(adapter.runTurn({
    projectRoot: "/workspace/project", prompt: "first gap",
    options: {
      resultKind: "agent-loop-result",
      threadKey: "agent-loop:TASK-1",
      onThreadBound: async (value) => {
        assert.equal(client.requests.some(({ method }) => method === "turn/start"), false);
        binding.push(value);
      }
    }
  }));
  const second = await collect(adapter.runTurn({
    projectRoot: "/workspace/project", prompt: "next gap",
    options: { resultKind: "agent-loop-result", threadKey: "agent-loop:TASK-1" }
  }));
  adapter.close();

  assert.equal(client.requests.filter(({ method }) => method === "initialize").length, 1);
  assert.equal(client.requests.filter(({ method }) => method === "thread/start").length, 1);
  assert.equal(client.requests.find(({ method }) => method === "thread/start").params.ephemeral, false);
  const turnStarts = client.requests.filter(({ method }) => method === "turn/start");
  assert.equal(turnStarts[0].params.threadId, "THREAD-1");
  assert.equal(turnStarts[1].params.threadId, "THREAD-1");
  assert.equal(first.some(({ type }) => type === "codex.thread.start.completed"), true);
  assert.equal(second.some(({ type }) => type === "codex.thread.reused"), true);
  assert.equal(binding[0].threadId, "THREAD-1");
  assert.equal(client.closeCount, 1);
});

test("a new adapter resumes the persisted thread instead of starting a replacement", async () => {
  const client = new FakeClient();
  const adapter = createCodexAppServerAdapter({ clientFactory: () => client });
  const events = await collect(adapter.runTurn({
    projectRoot: "/workspace/project", prompt: "resume",
    options: { resultKind: "agent-loop-result", threadKey: "agent-loop:TASK-1", threadId: "THREAD-PERSISTED" }
  }));
  adapter.close();
  assert.equal(client.requests.filter(({ method }) => method === "thread/start").length, 0);
  assert.equal(client.requests.filter(({ method }) => method === "thread/resume").length, 1);
  assert.equal(client.requests.find(({ method }) => method === "turn/start").params.threadId, "THREAD-PERSISTED");
  assert.equal(events.some(({ type }) => type === "codex.thread.resume.completed"), true);
});

test("matching Agent turns reuse their stable lane", async () => {
  const client = new FakeClient();
  const adapter = createCodexAppServerAdapter({ clientFactory: () => client });
  const options = {
    resultKind: "agent-loop-result",
    threadKey: "agent-loop:TASK-1"
  };

  await collect(adapter.runTurn({ projectRoot: "/workspace/project", prompt: "$using-arckit\n{}", options }));
  await collect(adapter.runTurn({ projectRoot: "/workspace/project", prompt: "$using-arckit\n{}", options }));
  adapter.close();

  const threadStarts = client.requests.filter(({ method }) => method === "thread/start");
  const turnStarts = client.requests.filter(({ method }) => method === "turn/start");
  assert.equal(threadStarts.length, 1);
  assert.equal(client.requests.filter(({ method }) => method === "thread/unsubscribe").length, 0);
  assert.equal(turnStarts[0].params.threadId, turnStarts[1].params.threadId);
  assert.deepEqual(turnStarts[0].params.input, [{ type: "text", text: "$using-arckit\n{}" }]);
});

test("context compaction runs on the same loaded thread", async () => {
  const client = new FakeClient();
  const adapter = createCodexAppServerAdapter({ clientFactory: () => client });
  await collect(adapter.runTurn({
    projectRoot: "/workspace/project", prompt: "$using-arckit\n{}",
    options: { resultKind: "agent-loop-result", threadKey: "agent-loop:TASK-1" }
  }));
  const result = await adapter.compactThread({ threadKey: "agent-loop:TASK-1" });
  adapter.close();
  assert.equal(result.thread_id, "THREAD-1");
  assert.equal(client.requests.filter(({ method }) => method === "thread/compact/start").length, 1);
  assert.equal(client.requests.find(({ method }) => method === "thread/compact/start").params.threadId, "THREAD-1");
});

test("equivalent active commands are single-flight and become a soft event", async () => {
  const client = new DuplicateCommandClient();
  const adapter = createCodexAppServerAdapter({ clientFactory: () => client });
  const events = await collect(adapter.runTurn({
    projectRoot: "/workspace/project",
    prompt: "build once",
    options: { resultKind: "agent-loop-result", threadKey: "agent-loop:TASK-1" }
  }));
  adapter.close();

  assert.equal(client.commandDecisions[0].decision, "accept");
  assert.equal(client.commandDecisions[1].decision, "decline");
  assert.equal(client.commandDecisions[2].decision, "accept");
  assert.equal(events.filter(({ type }) => type === "codex.command.duplicate.suppressed").length, 1);
});

test("permission approvals return the granted profile shape required by app-server", async () => {
  const client = new PermissionClient();
  const adapter = createCodexAppServerAdapter({ clientFactory: () => client });
  await collect(adapter.runTurn({
    projectRoot: "/workspace/project",
    prompt: "request permissions",
    options: { resultKind: "agent-loop-result", threadKey: "agent-loop:TASK-1" }
  }));
  adapter.close();

  assert.deepEqual(client.permissionDecision, {
    permissions: {
      fileSystem: { entries: [] },
      network: { enabled: true }
    },
    scope: "turn"
  });
});

test("terminal app-server errors reject an Agent turn instead of creating a retry handoff", async () => {
  const client = new TerminalErrorClient();
  const adapter = createCodexAppServerAdapter({ clientFactory: () => client });

  await assert.rejects(
    collect(adapter.runTurn({
      projectRoot: "/workspace/project",
      prompt: "invalid schema",
      options: { resultKind: "agent-loop-result", threadKey: "agent-loop:TASK-1" }
    })),
    (error) => {
      assert.equal(error.name, "CodexTurnError");
      assert.equal(error.code, "invalid_json_schema");
      assert.equal(error.retryable, false);
      assert.match(error.message, /additionalProperties/);
      return true;
    }
  );
  adapter.close();
  assert.equal(client.requests.filter(({ method }) => method === "turn/start").length, 1);
});

test("operator control waits for turn/started after turn/start returns", async () => {
  const state = {
    threadId: "THREAD-1",
    turnId: "TURN-1",
    turnStarted: false,
    completed: false
  };
  const waiting = waitForActiveTurn(state, { timeoutMs: 500, pollIntervalMs: 1 });
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
    if (method === "thread/resume") return { thread: { id: params.threadId } };
    if (method === "thread/compact/start") {
      const turn = { id: `COMPACT-${++this.turnCount}` };
      queueMicrotask(() => this.emit("turn/completed", { threadId: params.threadId, turn }));
      return { turn };
    }
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

class PermissionClient extends FakeClient {
  permissionDecision = null;

  async request(method, params) {
    if (method !== "turn/start") return super.request(method, params);
    this.requests.push({ method, params });
    const turn = { id: `TURN-${++this.turnCount}` };
    queueMicrotask(async () => {
      this.emit("turn/started", { threadId: params.threadId, turn });
      this.permissionDecision = await this.requestHandlers[0]({
        method: "item/permissions/requestApproval",
        params: {
          threadId: params.threadId,
          turnId: turn.id,
          itemId: "PERMISSION-1",
          cwd: "/workspace/project",
          startedAtMs: 100,
          permissions: {
            fileSystem: { entries: [] },
            network: { enabled: true }
          }
        }
      });
      this.emit("item/completed", { item: { type: "agentMessage", text: "completed" } });
      this.emit("turn/completed", { threadId: params.threadId, turn });
    });
    return { turn };
  }
}

class TerminalErrorClient extends FakeClient {
  async request(method, params) {
    if (method !== "turn/start") return super.request(method, params);
    this.requests.push({ method, params });
    const turn = { id: `TURN-${++this.turnCount}` };
    queueMicrotask(() => {
      this.emit("turn/started", { threadId: params.threadId, turn });
      this.emit("error", {
        willRetry: false,
        error: {
          message: JSON.stringify({
            error: {
              code: "invalid_json_schema",
              message: "Invalid schema: additionalProperties must be false."
            }
          })
        }
      });
      this.emit("turn/completed", { threadId: params.threadId, turn });
    });
    return { turn };
  }
}
