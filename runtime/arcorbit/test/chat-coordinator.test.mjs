import assert from "node:assert/strict";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";
import { createChatCoordinator } from "../src/chat-coordinator.mjs";
import { createDesktopStore } from "../src/desktop/desktop-store.mjs";

test("ChatCoordinator creates isolated persistent Chat sessions and resumes their thread", async () => {
  const fixture = await chatFixture();
  const calls = [];
  let adapterCount = 0;
  const coordinator = createChatCoordinator({
    ...fixture.options,
    idFactory: sequenceId(),
    createAdapter() {
      const adapterId = ++adapterCount;
      return completedAdapter(adapterId, calls);
    }
  });
  try {
    await coordinator.createDraft({ project_id: "PROJECT-1", text: "draft" });
    let snapshot = await coordinator.send({
      project_id: "PROJECT-1", client_request_id: "REQUEST-1", text: "Explain the architecture"
    });
    const sessionId = snapshot.selected_session_id;
    snapshot = await waitForChatTerminal(coordinator, sessionId);
    assert.match(sessionId, /^CHAT-/);
    assert.equal(snapshot.sessions[0].status, "completed");
    assert.deepEqual(snapshot.messages.map(({ role, content }) => [role, content]), [
      ["user", "Explain the architecture"], ["assistant", "answer-1"]
    ]);

    snapshot = await coordinator.send({
      session_id: sessionId, client_request_id: "REQUEST-2", text: "Continue"
    });
    snapshot = await waitForChatTerminal(coordinator, sessionId);
    assert.equal(calls.length, 2);
    assert.equal(calls[0].options.resultKind, "chat");
    assert.equal(Object.hasOwn(calls[0].options, "outputSchema"), false);
    assert.equal(calls[1].options.threadId, "THREAD-1");
    assert.equal(adapterCount, 1);
    assert.equal(snapshot.messages.filter((message) => message.role === "user").length, 2);

    await coordinator.createDraft({ project_id: "PROJECT-1" });
    let other = await coordinator.send({ project_id: "PROJECT-1", client_request_id: "REQUEST-3", text: "Separate" });
    other = await waitForChatTerminal(coordinator, other.selected_session_id);
    assert.notEqual(other.selected_session_id, sessionId);
    assert.equal(adapterCount, 2);
  } finally {
    await coordinator.close();
    await fixture.cleanup();
  }
});

test("ChatCoordinator keeps high-frequency deltas in memory and emits a bounded stream projection", async () => {
  const fixture = await chatFixture();
  const baseUpdateDesktopStore = fixture.options.runManager.updateDesktopStore;
  let storeWrites = 0;
  let releaseTurn;
  let markDeltasProjected;
  const deltasProjected = new Promise((resolve) => { markDeltasProjected = resolve; });
  const events = [];
  const coordinator = createChatCoordinator({
    ...fixture.options,
    runManager: {
      ...fixture.options.runManager,
      async updateDesktopStore(...args) {
        storeWrites += 1;
        return baseUpdateDesktopStore(...args);
      }
    },
    streamNotifyMs: 5,
    idFactory: sequenceId(),
    createAdapter: () => ({
      async *runTurn({ options }) {
        await options.onThreadBound({ threadId: "THREAD-STREAM", resumed: false });
        yield { type: "codex.turn.started", turn_id: "TURN-STREAM" };
        for (let index = 0; index < 1_000; index += 1) {
          yield { type: "codex.agent_message.delta", item_id: "ITEM-STREAM", text: "x" };
        }
        markDeltasProjected();
        await new Promise((resolve) => { releaseTurn = resolve; });
        yield { type: "codex.turn.completed", turn_id: "TURN-STREAM", turn: { status: "completed" } };
      },
      async interrupt() { releaseTurn?.(); },
      close() {}
    })
  });
  const removeListener = coordinator.onEvent((event) => events.push(event));
  try {
    const started = await coordinator.send({ project_id: "PROJECT-1", client_request_id: "REQUEST-STREAM", text: "Stream" });
    await deltasProjected;
    const patchDeadline = Date.now() + 250;
    while (!events.some((event) => event.type === "chat.message.changed") && Date.now() < patchDeadline) {
      await new Promise((resolve) => setTimeout(resolve, 5));
    }

    const patchEvents = events.filter((event) => event.type === "chat.message.changed");
    const projected = await coordinator.getSnapshot({ session_id: started.selected_session_id });
    const persistedBeforeBoundary = await fixture.options.runManager.readDesktopStore();
    assert.equal(patchEvents.length, 1);
    assert.equal(patchEvents[0].messages[0].content.length, 1_000);
    assert.equal(projected.messages.find((message) => message.role === "assistant").content.length, 1_000);
    assert.equal((persistedBeforeBoundary.messages[started.selected_session_id] || []).some((message) => message.role === "assistant"), false);
    assert.ok(storeWrites <= 4, `expected bounded persistence before the turn boundary, received ${storeWrites} writes`);

    releaseTurn();
    const completed = await waitForChatTerminal(coordinator, started.selected_session_id);
    const assistantMessages = completed.messages.filter((message) => message.role === "assistant");
    assert.equal(assistantMessages.length, 1);
    assert.equal(assistantMessages[0].content.length, 1_000);
    assert.equal(assistantMessages[0].status, "completed");
    assert.ok(storeWrites <= 5, `expected one terminal persistence write, received ${storeWrites} total writes`);
  } finally {
    removeListener();
    releaseTurn?.();
    await coordinator.close();
    await fixture.cleanup();
  }
});

test("ChatCoordinator replays an unbound first-send request without creating another session or turn", async () => {
  const fixture = await chatFixture();
  let adapterRuns = 0;
  const coordinatorOptions = {
    ...fixture.options,
    idFactory: sequenceId(),
    createAdapter: () => ({
      async *runTurn({ options }) {
        adapterRuns += 1;
        await options.onThreadBound({ threadId: "THREAD-REPLAY", resumed: false });
        yield { type: "codex.turn.started", turn_id: "TURN-REPLAY" };
        yield { type: "codex.turn.completed", turn_id: "TURN-REPLAY", turn: { status: "completed" } };
      },
      async interrupt() {},
      close() {}
    })
  };
  let coordinator = createChatCoordinator(coordinatorOptions);
  try {
    const input = { project_id: "PROJECT-1", client_request_id: "REQUEST-REPLAY", text: "one request" };
    const first = await coordinator.send(input);
    const immediateReplay = await coordinator.send(input);
    assert.equal(immediateReplay.selected_session_id, first.selected_session_id);
    await waitForChatTerminal(coordinator, first.selected_session_id);

    await coordinator.close();
    coordinator = createChatCoordinator(coordinatorOptions);
    const restartedReplay = await coordinator.send(input);
    const store = await fixture.options.runManager.readDesktopStore();
    const chatSessions = Object.values(store.sessions).flat().filter((session) => session.kind === "chat");
    const userMessages = Object.values(store.messages).flat().filter((message) => message.role === "user");

    assert.equal(restartedReplay.selected_session_id, first.selected_session_id);
    assert.equal(chatSessions.length, 1);
    assert.equal(userMessages.length, 1);
    assert.equal(userMessages[0].client_request_id, "REQUEST-REPLAY");
    assert.equal(adapterRuns, 1);
  } finally {
    await coordinator.close();
    await fixture.cleanup();
  }
});

test("ChatCoordinator persists an explicit selection across restart without mutating session state", async () => {
  const fixture = await chatFixture();
  await fixture.options.runManager.updateDesktopStore((store) => {
    store.sessions["PROJECT-1"].push(
      {
        id: "CHAT-A", project_id: "PROJECT-1", kind: "chat", title: "First", draft: "draft A",
        thread_id: "THREAD-A", turn_id: "", status: "completed",
        created_at: "2026-08-23T00:00:00Z", updated_at: "2026-08-23T00:00:01Z"
      },
      {
        id: "CHAT-B", project_id: "PROJECT-1", kind: "chat", title: "Second", draft: "draft B",
        thread_id: "THREAD-B", turn_id: "", status: "completed",
        created_at: "2026-08-23T00:00:02Z", updated_at: "2026-08-23T00:00:03Z"
      }
    );
    store.messages["CHAT-A"] = [];
    store.messages["CHAT-B"] = [];
    store.chat.selected_session_id = "CHAT-A";
    return store;
  });
  const coordinator = createChatCoordinator({ ...fixture.options, createAdapter: () => completedAdapter(1, []) });
  try {
    const before = await fixture.options.runManager.readDesktopStore();
    const selected = await coordinator.select({ session_id: "CHAT-B" });
    const after = await fixture.options.runManager.readDesktopStore();
    assert.equal(selected.selected_session_id, "CHAT-B");
    assert.deepEqual(after.sessions["PROJECT-1"], before.sessions["PROJECT-1"]);
    await assert.rejects(coordinator.select({ session_id: "MISSING" }), /Unknown Chat session/);

    await coordinator.close();
    const restarted = createChatCoordinator({ ...fixture.options, createAdapter: () => completedAdapter(2, []) });
    try {
      const restored = await restarted.getSnapshot();
      assert.equal(restored.selected_session_id, "CHAT-B");
      assert.equal(restored.draft.text, "draft B");
    } finally {
      await restarted.close();
    }
  } finally {
    await coordinator.close();
    await fixture.cleanup();
  }
});

test("ChatCoordinator restores an explicit new-chat draft across restart when sessions already exist", async () => {
  const fixture = await chatFixture();
  await fixture.options.runManager.updateDesktopStore((store) => {
    store.sessions["PROJECT-1"].push({
      id: "CHAT-A", project_id: "PROJECT-1", kind: "chat", title: "Existing", draft: "session draft",
      thread_id: "THREAD-A", turn_id: "", status: "completed",
      created_at: "2026-08-23T00:00:00Z", updated_at: "2026-08-23T00:00:01Z"
    });
    store.messages["CHAT-A"] = [];
    store.chat.selected_session_id = "CHAT-A";
    return store;
  });
  const coordinator = createChatCoordinator({ ...fixture.options, createAdapter: () => completedAdapter(1, []) });
  try {
    await coordinator.createDraft({ project_id: "PROJECT-1", text: "unsent new draft" });
    await coordinator.close();
    const restarted = createChatCoordinator({ ...fixture.options, createAdapter: () => completedAdapter(2, []) });
    try {
      const restored = await restarted.getSnapshot();
      assert.equal(restored.selected_session_id, "");
      assert.equal(restored.draft.project_id, "PROJECT-1");
      assert.equal(restored.draft.text, "unsent new draft");
      assert.equal(restored.sessions.some((session) => session.id === "CHAT-A"), true);
    } finally {
      await restarted.close();
    }
  } finally {
    await coordinator.close();
    await fixture.cleanup();
  }
});

test("ChatCoordinator holds app-server approval until a typed decision and fails closed on rejection", async () => {
  const fixture = await chatFixture();
  const decisions = [];
  const coordinator = createChatCoordinator({
    ...fixture.options,
    idFactory: sequenceId(),
    createAdapter: () => approvalAdapter(decisions)
  });
  try {
    await coordinator.createDraft({ project_id: "PROJECT-1" });
    let requested;
    const requestedEvent = new Promise((resolve) => {
      coordinator.onEvent((event) => {
        if (event.type === "chat.approval.requested") { requested = event; resolve(); }
      });
    });
    const starting = await coordinator.send({ project_id: "PROJECT-1", client_request_id: "REQUEST-1", text: "Change a file" });
    await requestedEvent;
    const waiting = await coordinator.getSnapshot({ session_id: requested.session_id });
    const approval = waiting.messages.find((message) => message.kind === "approval");
    assert.equal(waiting.sessions[0].status, "waiting_approval");
    assert.equal(approval.status, "pending");

    await coordinator.decideApproval({
      session_id: requested.session_id,
      request_id: approval.approval_request_id,
      decision: "decline"
    });
    const completed = await waitForChatTerminal(coordinator, starting.selected_session_id);
    assert.deepEqual(decisions, [false]);
    assert.equal(completed.messages.find((message) => message.kind === "approval").status, "failed");
  } finally {
    await coordinator.close();
    await fixture.cleanup();
  }
});

test("ChatCoordinator reconciles an orphaned active turn as interrupted without exposing its thread", async () => {
  const fixture = await chatFixture();
  await fixture.options.runManager.updateDesktopStore((store) => {
    store.sessions["PROJECT-1"].push({
      id: "CHAT-ORPHANED", project_id: "PROJECT-1", kind: "chat", title: "Recover me",
      thread_id: "THREAD-PRIVATE", turn_id: "TURN-PRIVATE", status: "running",
      created_at: "2026-08-23T00:00:00Z", updated_at: "2026-08-23T00:00:01Z"
    });
    store.messages["CHAT-ORPHANED"] = [];
    return store;
  });
  const coordinator = createChatCoordinator({ ...fixture.options, createAdapter: () => completedAdapter(1, []) });
  try {
    const snapshot = await coordinator.getSnapshot({ session_id: "CHAT-ORPHANED" });
    assert.equal(snapshot.sessions.find((item) => item.id === "CHAT-ORPHANED").status, "interrupted");
    assert.equal(JSON.stringify(snapshot).includes("THREAD-PRIVATE"), false);
    assert.deepEqual(snapshot.projects, [{ id: "PROJECT-1", name: "Project" }]);
  } finally {
    await coordinator.close();
    await fixture.cleanup();
  }
});

test("ChatCoordinator records Setup Readiness failure and never starts Codex", async () => {
  const fixture = await chatFixture();
  let adapterRuns = 0;
  const coordinator = createChatCoordinator({
    ...fixture.options,
    setupReadinessPreflight: async () => { throw new Error("Project skills are not ready."); },
    createAdapter() {
      const adapter = completedAdapter(1, []);
      return {
        ...adapter,
        async *runTurn(input) { adapterRuns += 1; yield* adapter.runTurn(input); }
      };
    },
    idFactory: sequenceId()
  });
  try {
    const starting = await coordinator.send({ project_id: "PROJECT-1", client_request_id: "REQUEST-FAIL", text: "Hello" });
    const snapshot = await waitForChatTerminal(coordinator, starting.selected_session_id);
    assert.equal(snapshot.sessions[0].status, "failed");
    assert.deepEqual(snapshot.messages.map((message) => message.kind), ["text", "error"]);
    assert.equal(adapterRuns, 0);
  } finally {
    await coordinator.close();
    await fixture.cleanup();
  }
});

test("ChatCoordinator preserves a terminal error when turn completion follows it", async () => {
  const fixture = await chatFixture();
  const coordinator = createChatCoordinator({
    ...fixture.options,
    idFactory: sequenceId(),
    createAdapter: () => ({
      async *runTurn({ options }) {
        await options.onThreadBound({ threadId: "THREAD-TERMINAL-ERROR", resumed: false });
        yield { type: "codex.turn.started", turn_id: "TURN-TERMINAL-ERROR" };
        yield { type: "codex.agent_message.delta", item_id: "ITEM-PARTIAL", text: "partial answer" };
        yield { type: "codex.error", params: { error: { message: "terminal boom" } } };
        yield { type: "codex.turn.completed", turn_id: "TURN-TERMINAL-ERROR", turn: { status: "failed" } };
      },
      async interrupt() {},
      close() {}
    })
  });
  let stopListening = () => {};
  try {
    const completionProjected = new Promise((resolve) => {
      stopListening = coordinator.onEvent((event) => {
        if (event.type === "chat.turn.completed") resolve();
      });
    });
    const starting = await coordinator.send({
      project_id: "PROJECT-1",
      client_request_id: "REQUEST-TERMINAL-ERROR",
      text: "Trigger a terminal error"
    });
    await completionProjected;
    const snapshot = await coordinator.getSnapshot({ session_id: starting.selected_session_id });
    const session = snapshot.sessions.find((item) => item.id === starting.selected_session_id);
    const partial = snapshot.messages.find((message) => message.content === "partial answer");

    assert.equal(session.status, "failed");
    assert.equal(session.error, "terminal boom");
    assert.equal(session.retry_client_request_id, "REQUEST-TERMINAL-ERROR");
    assert.equal(partial.status, "failed");
    assert.deepEqual(
      snapshot.messages.filter((message) => message.kind === "error").map((message) => message.content),
      ["terminal boom"]
    );
  } finally {
    stopListening();
    await coordinator.close();
    await fixture.cleanup();
  }
});

test("ChatCoordinator completes a turn that recovers from a retryable app-server error", async () => {
  const fixture = await chatFixture();
  const coordinator = createChatCoordinator({
    ...fixture.options,
    idFactory: sequenceId(),
    createAdapter: () => ({
      async *runTurn({ options }) {
        await options.onThreadBound({ threadId: "THREAD-RETRYABLE-ERROR", resumed: false });
        yield { type: "codex.turn.started", turn_id: "TURN-RETRYABLE-ERROR" };
        yield { type: "codex.error", params: { willRetry: true, error: { message: "temporary outage" } } };
        yield { type: "codex.agent_message.delta", item_id: "ITEM-RECOVERED", text: "recovered answer" };
        yield { type: "codex.turn.completed", turn_id: "TURN-RETRYABLE-ERROR", turn: { status: "completed" } };
      },
      async interrupt() {},
      close() {}
    })
  });
  let stopListening = () => {};
  try {
    const completionProjected = new Promise((resolve) => {
      stopListening = coordinator.onEvent((event) => {
        if (event.type === "chat.turn.completed") resolve();
      });
    });
    const starting = await coordinator.send({
      project_id: "PROJECT-1",
      client_request_id: "REQUEST-RETRYABLE-ERROR",
      text: "Recover from a transient error"
    });
    await completionProjected;
    const snapshot = await coordinator.getSnapshot({ session_id: starting.selected_session_id });
    const session = snapshot.sessions.find((item) => item.id === starting.selected_session_id);
    const recovered = snapshot.messages.find((message) => message.content === "recovered answer");

    assert.equal(session.status, "completed");
    assert.equal(session.error, "");
    assert.equal(session.retry_client_request_id, "");
    assert.equal(recovered.status, "completed");
    assert.equal(snapshot.messages.some((message) => message.kind === "error"), false);
  } finally {
    stopListening();
    await coordinator.close();
    await fixture.cleanup();
  }
});

test("ChatCoordinator retries a failed startup with the persisted request and thread without duplicating the user message", async () => {
  const fixture = await chatFixture();
  const calls = [];
  let runCount = 0;
  const coordinatorOptions = {
    ...fixture.options,
    idFactory: sequenceId(),
    createAdapter: () => ({
      async *runTurn(input) {
        calls.push(input);
        runCount += 1;
        if (runCount === 1) {
          await input.options.onThreadBound({ threadId: "THREAD-RETRY", resumed: false });
          throw new Error("turn/start transport failed");
        }
        yield { type: "codex.turn.started", turn_id: "TURN-RETRY" };
        yield { type: "codex.turn.completed", turn_id: "TURN-RETRY", turn: { status: "completed" } };
      },
      async interrupt() {},
      close() {}
    })
  };
  let coordinator = createChatCoordinator(coordinatorOptions);
  try {
    const starting = await coordinator.send({
      project_id: "PROJECT-1", client_request_id: "REQUEST-RETRY", text: "same request"
    });
    const failed = await waitForChatTerminal(coordinator, starting.selected_session_id);
    assert.equal(failed.sessions[0].status, "failed");
    assert.equal(failed.sessions[0].retry_client_request_id, "REQUEST-RETRY");

    await coordinator.close();
    coordinator = createChatCoordinator(coordinatorOptions);
    const restored = await coordinator.getSnapshot({ session_id: starting.selected_session_id });
    assert.equal(restored.sessions[0].retry_client_request_id, "REQUEST-RETRY");

    await coordinator.send({
      session_id: starting.selected_session_id,
      client_request_id: failed.sessions[0].retry_client_request_id,
      text: "edited request"
    });
    const completed = await waitForChatTerminal(coordinator, starting.selected_session_id);
    const userMessages = completed.messages.filter((message) => message.role === "user");
    assert.equal(completed.sessions[0].status, "completed");
    assert.equal(completed.sessions[0].retry_client_request_id, "");
    assert.deepEqual(userMessages.map((message) => message.content), ["edited request"]);
    assert.equal(calls.length, 2);
    assert.equal(calls[1].options.threadId, "THREAD-RETRY");
  } finally {
    await coordinator.close();
    await fixture.cleanup();
  }
});

test("ChatCoordinator interrupts an active turn before atomically deleting only that session", async () => {
  const fixture = await chatFixture();
  let release;
  let interrupted = false;
  const coordinator = createChatCoordinator({
    ...fixture.options,
    idFactory: sequenceId(),
    createAdapter: () => ({
      async *runTurn({ options }) {
        await options.onThreadBound({ threadId: "THREAD-DELETE", resumed: false });
        yield { type: "codex.turn.started", turn_id: "TURN-DELETE" };
        await new Promise((resolve) => { release = resolve; });
        yield { type: "codex.turn.completed", turn_id: "TURN-DELETE", turn: { status: "interrupted" } };
      },
      async interrupt() { interrupted = true; release?.(); },
      close() {}
    })
  });
  try {
    const started = await coordinator.send({ project_id: "PROJECT-1", client_request_id: "REQUEST-DELETE", text: "Keep this partial answer" });
    while (!release) await new Promise((resolve) => setTimeout(resolve, 5));
    const result = await coordinator.delete({ session_id: started.selected_session_id });
    assert.equal(interrupted, true);
    assert.equal(result.deleted_session_id, started.selected_session_id);
    assert.equal(result.snapshot.sessions.some((session) => session.id === started.selected_session_id), false);
  } finally {
    await coordinator.close();
    await fixture.cleanup();
  }
});

test("ChatCoordinator times out an unanswered approval as a visible fail-closed decision", async () => {
  const fixture = await chatFixture();
  const decisions = [];
  const coordinator = createChatCoordinator({
    ...fixture.options,
    approvalTimeoutMs: 10,
    idFactory: sequenceId(),
    createAdapter: () => approvalAdapter(decisions)
  });
  try {
    const starting = await coordinator.send({ project_id: "PROJECT-1", client_request_id: "REQUEST-TIMEOUT", text: "Wait for approval" });
    const completed = await waitForChatTerminal(coordinator, starting.selected_session_id);
    assert.deepEqual(decisions, [false]);
    assert.equal(completed.messages.find((message) => message.kind === "approval").status, "failed");
    assert.equal(completed.sessions[0].status, "completed");
  } finally {
    await coordinator.close();
    await fixture.cleanup();
  }
});

test("ChatCoordinator can stop during startup without launching a cancelled Codex turn", async () => {
  const fixture = await chatFixture();
  let releasePreflight;
  let preflightStarted;
  const enteredPreflight = new Promise((resolve) => { preflightStarted = resolve; });
  let adapterRuns = 0;
  const coordinator = createChatCoordinator({
    ...fixture.options,
    idFactory: sequenceId(),
    setupReadinessPreflight: async () => {
      preflightStarted();
      await new Promise((resolve) => { releasePreflight = resolve; });
    },
    createAdapter() {
      const adapter = completedAdapter(1, []);
      return { ...adapter, async *runTurn(input) { adapterRuns += 1; yield* adapter.runTurn(input); } };
    }
  });
  try {
    const started = await coordinator.send({ project_id: "PROJECT-1", client_request_id: "REQUEST-STARTING", text: "Stop before launch" });
    await enteredPreflight;
    const interruptingEvent = new Promise((resolve) => coordinator.onEvent((event) => {
      if (event.type === "chat.turn.interrupting") resolve();
    }));
    const stopping = coordinator.interrupt({ session_id: started.selected_session_id });
    await interruptingEvent;
    releasePreflight();
    const stopped = await stopping;
    assert.equal(stopped.sessions.find((session) => session.id === started.selected_session_id).status, "interrupted");
    assert.equal(adapterRuns, 0);
  } finally {
    await coordinator.close();
    await fixture.cleanup();
  }
});

async function chatFixture() {
  const root = await mkdtemp(join(tmpdir(), "arcorbit-chat-"));
  const store = createDesktopStore({ dataDir: root, runsDir: join(root, "runs"), storePath: join(root, "desktop-store.json") });
  await store.updateStore((draft) => {
    draft.projects.push({ id: "PROJECT-1", name: "Project", path: root, added_at: "2026-08-23T00:00:00Z" });
    return draft;
  });
  const runManager = {
    readDesktopStore: store.readStore,
    updateDesktopStore: store.updateStore,
    getSettings: async () => ({ codex_proxy: { enabled: false, url: "" } })
  };
  return {
    options: {
      runManager,
      getCodexExecutable: () => ({ command: "codex", pathEntries: [] }),
      setupReadinessPreflight: async () => {}
    },
    cleanup: () => rm(root, { recursive: true, force: true })
  };
}

function completedAdapter(adapterId, calls) {
  return {
    async *runTurn({ options }) {
      calls.push({ options });
      const threadId = options.threadId || `THREAD-${adapterId}`;
      await options.onThreadBound({ threadId, resumed: Boolean(options.threadId) });
      yield { type: "codex.turn.started", turn_id: `TURN-${calls.length}` };
      yield { type: "codex.agent_message.delta", item_id: `ITEM-${calls.length}`, text: `answer-${adapterId}` };
      yield { type: "codex.turn.completed", turn_id: `TURN-${calls.length}`, turn: { status: "completed" } };
    },
    async interrupt() {},
    close() {}
  };
}

function approvalAdapter(decisions) {
  return {
    async *runTurn({ options }) {
      await options.onThreadBound({ threadId: "THREAD-APPROVAL", resumed: false });
      yield { type: "codex.turn.started", turn_id: "TURN-APPROVAL" };
      const decision = await options.approvalProvider({
        request_id: "APPROVAL-1",
        method: "item/fileChange/requestApproval",
        params: { itemId: "FILE-1" }
      });
      decisions.push(decision);
      yield { type: "codex.turn.completed", turn_id: "TURN-APPROVAL", turn: { status: "completed" } };
    },
    async interrupt() {},
    close() {}
  };
}

function sequenceId() {
  let index = 0;
  return () => `ID-${++index}`;
}

async function waitForChatTerminal(coordinator, sessionId, timeoutMs = 2_000) {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    const snapshot = await coordinator.getSnapshot({ session_id: sessionId });
    const session = snapshot.sessions.find((item) => item.id === sessionId);
    if (session && !["starting", "running", "waiting_approval", "interrupting"].includes(session.status)) return snapshot;
    await new Promise((resolve) => setTimeout(resolve, 5));
  }
  throw new Error(`Timed out waiting for ${sessionId} to finish.`);
}
