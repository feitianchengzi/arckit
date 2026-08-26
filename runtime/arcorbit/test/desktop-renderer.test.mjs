import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import vm from "node:vm";
import test from "node:test";
import {
  isConversationSurfaceMessageVisible,
  isTranscriptMessageVisible,
  mergeAutomationTranscript,
  statusGlyph,
  structuredResultPresentation,
  summarizeLoopStatus,
  summarizeToolActivity,
  transcriptMessageType
} from "../src/desktop/transcript-presentation.mjs";
import { copyConversationCode, createConversationSurface, renderConversationSurfaceMessage } from "../desktop/renderer/conversation-surface.mjs";
import { checkDesktopSetupReadiness, combineDesktopSetupReadiness, desktopSetupCheckInput } from "../src/desktop-setup-readiness-context.mjs";
import feedbackV2Ipc from "../desktop/feedback-v2-ipc.cjs";
import { createChatStateCoordinator } from "../desktop/renderer/chat-state-coordinator.mjs";

const { settleFeedbackV2Ipc, unwrapFeedbackV2Ipc } = feedbackV2Ipc;

const rendererPath = new URL("../desktop/renderer/renderer.js", import.meta.url);
const chatStateCoordinatorPath = new URL("../desktop/renderer/chat-state-coordinator.mjs", import.meta.url);
const rendererHtmlPath = new URL("../desktop/renderer/index.html", import.meta.url);
const rendererStylesPath = new URL("../desktop/renderer/styles.css", import.meta.url);
const desktopMainPath = new URL("../desktop/main.mjs", import.meta.url);
const desktopPreloadPath = new URL("../desktop/preload.cjs", import.meta.url);
const codexSetupIpcPath = new URL("../src/desktop/codex-setup-ipc.mjs", import.meta.url);
const imageViewerRendererPath = new URL("../desktop/image-viewer/renderer.js", import.meta.url);
const conversationSurfacePath = new URL("../desktop/renderer/conversation-surface.mjs", import.meta.url);

function chatSnapshot({ selected = "", project = "PROJECT-A", sessions = [], messages = [], draft = "" } = {}) {
  return {
    selected_session_id: selected,
    projects: [{ id: "PROJECT-A", name: "A" }, { id: "PROJECT-B", name: "B" }],
    sessions,
    messages,
    draft: { project_id: project, text: draft }
  };
}

function chatApi(overrides = {}) {
  const snapshot = chatSnapshot();
  return {
    createChat: async () => snapshot,
    selectChat: async () => snapshot,
    deleteChat: async () => ({ snapshot }),
    renameChat: async () => snapshot,
    interruptChat: async () => snapshot,
    decideChatApproval: async () => snapshot,
    sendChatMessage: async () => snapshot,
    chatSnapshot: async () => snapshot,
    ...overrides
  };
}

function createCoordinator(api, options = {}) {
  let request = 0;
  return createChatStateCoordinator({
    api,
    normalizeSnapshot: (value = {}) => ({
      selected_session_id: String(value.selected_session_id || ""),
      projects: value.projects || [],
      sessions: value.sessions || [],
      messages: value.messages || [],
      draft: value.draft || { project_id: "", text: "" }
    }),
    createRequestId: () => `REQUEST-${++request}`,
    ...options
  });
}

function createConversationSurfaceHarness({ scrollHeight = 1000, scrollTop = 900, clientHeight = 100 } = {}) {
  const elementListeners = new Map();
  const buttonListeners = new Map();
  const frames = [];
  const scrollCalls = [];
  const hiddenClasses = new Set(["hidden"]);
  const element = {
    scrollHeight,
    scrollTop,
    clientHeight,
    innerHTML: "",
    addEventListener(type, listener) { elementListeners.set(type, listener); },
    querySelectorAll() { return []; },
    scrollTo(options) { scrollCalls.push(options); },
  };
  const jumpButton = {
    classList: {
      toggle(name, enabled) {
        if (enabled) hiddenClasses.add(name);
        else hiddenClasses.delete(name);
      }
    },
    addEventListener(type, listener) { buttonListeners.set(type, listener); }
  };
  const surface = createConversationSurface({
    element,
    jumpButton,
    requestFrame(callback) { frames.push(callback); }
  });
  return {
    element,
    surface,
    frames,
    scrollCalls,
    jumpHidden: () => hiddenClasses.has("hidden"),
    dispatchElement: (type) => elementListeners.get(type)?.({ type }),
    dispatchButton: (type) => buttonListeners.get(type)?.({ type })
  };
}

test("Chat state coordinator captures draft ownership and flushes before selection changes", async () => {
  const calls = [];
  const timers = [];
  const coordinator = createCoordinator(chatApi({
    createChat: async (payload) => {
      calls.push(payload);
      return chatSnapshot({ selected: payload.session_id, project: payload.project_id, draft: payload.text });
    },
    selectChat: async ({ session_id: sessionId }) => chatSnapshot({
      selected: sessionId,
      sessions: [{ id: sessionId, project_id: "PROJECT-B" }]
    })
  }), {
    setTimer: (callback) => { timers.push(callback); return timers.length; },
    clearTimer: () => {}
  });

  await coordinator.initialize(chatSnapshot({
    selected: "CHAT-A",
    sessions: [{ id: "CHAT-A", project_id: "PROJECT-A" }]
  }));
  coordinator.setDraft("draft A");
  await coordinator.selectSession("CHAT-B");

  assert.deepEqual(calls, [
    { session_id: "CHAT-A", project_id: "PROJECT-A", text: "draft A" }
  ]);
  assert.equal(coordinator.getState().owner.session_id, "CHAT-B");
});

test("Chat and Automation common messages use the same Conversation Surface presentation", () => {
  const markdown = renderConversationSurfaceMessage({
    role: "assistant",
    actor_label: "Codex Agent",
    kind: "message",
    content: "Result with `code`.",
    status: "completed",
    created_at: "2026-08-23T08:00:00.000Z"
  }, { formatTime: () => "16:00" });
  assert.match(markdown, /chat-message assistant/);
  assert.match(markdown, /<code>code<\/code>/);
  assert.match(markdown, /Codex Agent/);

  assert.equal(isConversationSurfaceMessageVisible({ role: "system", actor: "runtime", kind: "round", content: "Round 1" }), false);
  assert.equal(isConversationSurfaceMessageVisible({ role: "assistant", kind: "structured", structured_data: { schema_version: "arckit-round-closeout/v2", value: { schema_version: "arckit-round-closeout/v2" } } }), false);
  assert.equal(isConversationSurfaceMessageVisible({ role: "tool", kind: "command", content: "npm test" }), true);
  assert.equal(isConversationSurfaceMessageVisible({ role: "assistant", kind: "reasoning", content: "Inspecting" }), true);
});

test("Conversation Surface coalesces live follow into one instant scroll per frame", () => {
  const harness = createConversationSurfaceHarness();
  const message = { role: "assistant", kind: "text", content: "delta", status: "running" };

  harness.surface.render({ messages: [message] });
  harness.surface.render({ messages: [{ ...message, content: "delta delta" }] });

  assert.equal(harness.frames.length, 1);
  harness.frames.shift()();
  assert.deepEqual(harness.scrollCalls, [{ top: 1000, behavior: "instant" }]);
  assert.equal(harness.surface.isFollowingLatest(), true);
});

test("Conversation Surface preserves user reading position across repeated renders", () => {
  const harness = createConversationSurfaceHarness({ scrollTop: 420 });
  harness.dispatchElement("scroll");
  assert.equal(harness.surface.isFollowingLatest(), false);

  harness.surface.render({ messages: [{ role: "assistant", kind: "text", content: "first" }] });
  harness.surface.render({ messages: [{ role: "assistant", kind: "text", content: "second" }] });
  harness.element.scrollTop = 0;
  harness.frames.shift()();

  assert.equal(harness.element.scrollTop, 420);
  assert.deepEqual(harness.scrollCalls, []);
  assert.equal(harness.jumpHidden(), false);
});

test("Conversation Surface reserves smooth scrolling for an explicit latest jump", () => {
  const harness = createConversationSurfaceHarness({ scrollTop: 420 });
  harness.dispatchElement("scroll");
  harness.dispatchButton("click");

  assert.deepEqual(harness.scrollCalls, [{ top: 1000, behavior: "smooth" }]);
  harness.dispatchElement("scroll");
  assert.equal(harness.surface.isFollowingLatest(), true);
});

test("Conversation Surface code copy exposes rejection to the shared action boundary", async () => {
  const button = {
    textContent: "复制",
    closest() { return { querySelector() { return { textContent: "const shared = true;" }; } }; }
  };
  await assert.rejects(
    copyConversationCode(button, { clipboard: { async writeText() { throw new Error("Clipboard denied"); } } }),
    /Clipboard denied/
  );
  assert.equal(button.textContent, "复制");

  let copied = "";
  const timers = [];
  await copyConversationCode(button, {
    clipboard: { async writeText(value) { copied = value; } },
    setTimer: (callback, delay) => timers.push({ callback, delay })
  });
  assert.equal(copied, "const shared = true;");
  assert.equal(button.textContent, "已复制");
  assert.equal(timers[0].delay, 1200);
  timers[0].callback();
  assert.equal(button.textContent, "复制");
});

test("Chat state coordinator serializes captured draft owners without applying persistence responses", async () => {
  const calls = [];
  const releases = [];
  const timers = [];
  const coordinator = createCoordinator(chatApi({
    createChat: (payload) => new Promise((resolvePersist) => {
      calls.push(payload);
      releases.push(resolvePersist);
    })
  }), {
    setTimer: (callback) => { timers.push(callback); return timers.length; },
    clearTimer: () => {}
  });

  await coordinator.initialize(chatSnapshot({
    selected: "CHAT-A",
    sessions: [{ id: "CHAT-A", project_id: "PROJECT-A" }]
  }));
  coordinator.setDraft("old");
  timers.shift()();
  await new Promise((resolveImmediate) => setImmediate(resolveImmediate));
  await coordinator.initialize(chatSnapshot({
    selected: "CHAT-B",
    sessions: [{ id: "CHAT-B", project_id: "PROJECT-B" }]
  }));
  coordinator.setDraft("new");
  const flushed = coordinator.flushDraft();

  assert.deepEqual(calls, [{ session_id: "CHAT-A", project_id: "PROJECT-A", text: "old" }]);
  releases.shift()({ selected_session_id: "CHAT-A" });
  await new Promise((resolveImmediate) => setImmediate(resolveImmediate));
  assert.deepEqual(calls, [
    { session_id: "CHAT-A", project_id: "PROJECT-A", text: "old" },
    { session_id: "CHAT-B", project_id: "PROJECT-B", text: "new" }
  ]);
  releases.shift()({ selected_session_id: "CHAT-B" });
  await flushed;
  assert.equal(coordinator.getState().owner.session_id, "CHAT-B");
});

test("Chat session selection flushes the old draft before persisting and applying the target", async () => {
  const order = [];
  const snapshot = chatSnapshot({ selected: "CHAT-B", sessions: [{ id: "CHAT-B", project_id: "PROJECT-B" }], draft: "draft B" });
  const coordinator = createCoordinator(chatApi({
    async createChat(payload) { order.push(["flush", payload]); return chatSnapshot(); },
    async selectChat(input) { order.push(["select", input]); return snapshot; }
  }));
  await coordinator.initialize(chatSnapshot({ selected: "CHAT-A", sessions: [{ id: "CHAT-A", project_id: "PROJECT-A" }] }));
  coordinator.setDraft("draft A");
  await coordinator.selectSession("CHAT-B");
  assert.deepEqual(order, [
    ["flush", { session_id: "CHAT-A", project_id: "PROJECT-A", text: "draft A" }],
    ["select", { session_id: "CHAT-B" }]
  ]);
  assert.equal(coordinator.getState().draft, "draft B");
});

test("Chat session selection ignores a stale response that completes after the latest intent", async () => {
  const calls = [];
  const releases = new Map();
  const coordinator = createCoordinator(chatApi({
    selectChat: ({ session_id: sessionId }) => new Promise((resolveSelect) => {
      calls.push(sessionId);
      releases.set(sessionId, resolveSelect);
    })
  }));

  const first = coordinator.selectSession("CHAT-B");
  const latest = coordinator.selectSession("CHAT-C");
  await new Promise((resolveImmediate) => setImmediate(resolveImmediate));
  assert.deepEqual(calls, ["CHAT-B", "CHAT-C"]);

  releases.get("CHAT-C")(chatSnapshot({ selected: "CHAT-C", sessions: [{ id: "CHAT-C", project_id: "PROJECT-A" }] }));
  await latest;
  releases.get("CHAT-B")(chatSnapshot({ selected: "CHAT-B", sessions: [{ id: "CHAT-B", project_id: "PROJECT-A" }] }));
  await first;

  assert.equal(coordinator.getState().owner.session_id, "CHAT-C");
});

test("Chat session response is invalidated by a later new-draft intent", async () => {
  let releaseSelection;
  const coordinator = createCoordinator(chatApi({
    selectChat: () => new Promise((resolveSelect) => { releaseSelection = resolveSelect; }),
    createChat: async ({ project_id: projectId }) => chatSnapshot({ project: projectId })
  }));

  const pending = coordinator.selectSession("CHAT-B");
  await new Promise((resolveImmediate) => setImmediate(resolveImmediate));
  await coordinator.newDraft("PROJECT-B");
  releaseSelection(chatSnapshot({ selected: "CHAT-B", sessions: [{ id: "CHAT-B", project_id: "PROJECT-A" }] }));
  await pending;

  assert.deepEqual(coordinator.getState().owner, { session_id: "", project_id: "PROJECT-B" });
});

test("Chat new-draft response preserves and persists Composer input typed while its request is pending", async () => {
  const persisted = [];
  let releaseTransition;
  const coordinator = createCoordinator(chatApi({
    createChat: (payload) => {
      persisted.push(payload);
      if (persisted.length === 1) return new Promise((resolveTransition) => { releaseTransition = resolveTransition; });
      return Promise.resolve(chatSnapshot({ project: payload.project_id, draft: payload.text }));
    }
  }), {
    setTimer: () => 1,
    clearTimer: () => {}
  });
  await coordinator.initialize(chatSnapshot({ project: "PROJECT-A", draft: "old draft" }));

  const transition = coordinator.newDraft("PROJECT-B");
  await new Promise((resolveImmediate) => setImmediate(resolveImmediate));
  coordinator.setDraft("typed while new-chat request is pending");
  releaseTransition(chatSnapshot({ project: "PROJECT-B", draft: "" }));
  await transition;
  await coordinator.flushDraft();

  assert.deepEqual(coordinator.getState().owner, { session_id: "", project_id: "PROJECT-B" });
  assert.equal(coordinator.getState().draft, "typed while new-chat request is pending");
  assert.deepEqual(persisted.at(-1), {
    session_id: "",
    project_id: "PROJECT-B",
    text: "typed while new-chat request is pending"
  });
});

test("Chat workspace response preserves and persists newer Composer input for the new draft owner", async () => {
  const persisted = [];
  let releaseTransition;
  const coordinator = createCoordinator(chatApi({
    createChat: (payload) => {
      persisted.push(payload);
      if (persisted.length === 1) return new Promise((resolveTransition) => { releaseTransition = resolveTransition; });
      return Promise.resolve(chatSnapshot({ project: payload.project_id, draft: payload.text }));
    }
  }), {
    setTimer: () => 1,
    clearTimer: () => {}
  });
  await coordinator.initialize(chatSnapshot({ project: "PROJECT-A", draft: "old draft" }));

  const transition = coordinator.changeDraftWorkspace("PROJECT-B");
  await new Promise((resolveImmediate) => setImmediate(resolveImmediate));
  coordinator.setDraft("typed while workspace request is pending");
  releaseTransition(chatSnapshot({ project: "PROJECT-B", draft: "old draft" }));
  await transition;
  await coordinator.flushDraft();

  assert.deepEqual(coordinator.getState().owner, { session_id: "", project_id: "PROJECT-B" });
  assert.equal(coordinator.getState().draft, "typed while workspace request is pending");
  assert.deepEqual(persisted.at(-1), {
    session_id: "",
    project_id: "PROJECT-B",
    text: "typed while workspace request is pending"
  });
});

test("Chat owner intents keep first send on the latest visible workspace and reject the older workspace response", async () => {
  const payloads = [];
  let releaseWorkspace;
  let releaseSend;
  const coordinator = createCoordinator(chatApi({
    createChat: ({ project_id: projectId, text }) => new Promise((resolveWorkspace) => {
      assert.equal(text, "message");
      releaseWorkspace = resolveWorkspace;
    }),
    sendChatMessage: (payload) => new Promise((resolveSend) => {
      payloads.push(payload);
      releaseSend = resolveSend;
    })
  }));
  await coordinator.initialize(chatSnapshot({ project: "PROJECT-A", draft: "message" }));
  const workspace = coordinator.changeDraftWorkspace("PROJECT-B");
  await new Promise((resolveImmediate) => setImmediate(resolveImmediate));
  const send = coordinator.send();
  await new Promise((resolveImmediate) => setImmediate(resolveImmediate));

  releaseSend(chatSnapshot({ selected: "CHAT-B", sessions: [{ id: "CHAT-B", project_id: "PROJECT-B" }] }));
  await send;
  releaseWorkspace(chatSnapshot({ project: "PROJECT-B", draft: "message" }));
  await workspace;

  assert.equal(payloads[0].project_id, "PROJECT-B");
  assert.equal(coordinator.getState().owner.session_id, "CHAT-B");
});

test("Chat background refresh cannot roll back a newer draft-workspace transition", async () => {
  let releaseRefresh;
  let releaseWorkspace;
  const coordinator = createCoordinator(chatApi({
    chatSnapshot: () => new Promise((resolveRefresh) => { releaseRefresh = resolveRefresh; }),
    createChat: () => new Promise((resolveWorkspace) => { releaseWorkspace = resolveWorkspace; })
  }));
  await coordinator.initialize(chatSnapshot({ project: "PROJECT-A", draft: "draft" }));

  const refresh = coordinator.refresh({ quiet: true });
  const workspace = coordinator.changeDraftWorkspace("PROJECT-B");
  await new Promise((resolveImmediate) => setImmediate(resolveImmediate));
  releaseRefresh(chatSnapshot({ project: "PROJECT-A", draft: "stale" }));
  await refresh;
  assert.deepEqual(coordinator.getState().owner, { session_id: "", project_id: "PROJECT-B" });
  assert.equal(coordinator.getState().draft, "draft");

  releaseWorkspace(chatSnapshot({ project: "PROJECT-B", draft: "draft" }));
  await workspace;
});

test("Chat first send adopts the new session without losing or misowning an in-flight draft", async () => {
  const calls = [];
  const timers = [];
  let releaseSend;
  const coordinator = createCoordinator(chatApi({
    createChat: async (payload) => {
      calls.push(payload);
      return chatSnapshot({ selected: payload.session_id, project: payload.project_id, draft: payload.text });
    },
    sendChatMessage: () => new Promise((resolveSend) => { releaseSend = resolveSend; })
  }), {
    setTimer: (callback) => { timers.push(callback); return timers.length; },
    clearTimer: () => {}
  });

  await coordinator.initialize(chatSnapshot({ project: "PROJECT-A", draft: "accepted message" }));
  const sending = coordinator.send();
  await new Promise((resolveImmediate) => setImmediate(resolveImmediate));
  coordinator.setDraft("next message");
  releaseSend(chatSnapshot({
    selected: "CHAT-A",
    sessions: [{ id: "CHAT-A", project_id: "PROJECT-A" }]
  }));
  await sending;

  assert.deepEqual(coordinator.getState().owner, { session_id: "CHAT-A", project_id: "PROJECT-A" });
  assert.equal(coordinator.getState().draft, "next message");
  assert.deepEqual(calls, [{
    session_id: "CHAT-A",
    project_id: "PROJECT-A",
    text: "next message"
  }]);
});

test("Chat send does not clear newer Composer input while the accepted draft is still flushing", async () => {
  const persisted = [];
  const timers = [];
  let releaseOldDraft;
  let releaseSend;
  const coordinator = createCoordinator(chatApi({
    createChat: (payload) => {
      persisted.push(payload);
      if (persisted.length === 1) return new Promise((resolvePersist) => { releaseOldDraft = resolvePersist; });
      return Promise.resolve(chatSnapshot({ selected: payload.session_id, project: payload.project_id, draft: payload.text }));
    },
    sendChatMessage: () => new Promise((resolveSend) => { releaseSend = resolveSend; })
  }), {
    setTimer: (callback) => { timers.push(callback); return timers.length; },
    clearTimer: () => {}
  });
  await coordinator.initialize(chatSnapshot({ project: "PROJECT-A" }));
  coordinator.setDraft("accepted message");
  timers.shift()();
  await new Promise((resolveImmediate) => setImmediate(resolveImmediate));

  const sending = coordinator.send();
  coordinator.setDraft("next message");
  releaseOldDraft(chatSnapshot({ project: "PROJECT-A", draft: "accepted message" }));
  await new Promise((resolveImmediate) => setImmediate(resolveImmediate));
  releaseSend(chatSnapshot({ selected: "CHAT-A", sessions: [{ id: "CHAT-A", project_id: "PROJECT-A" }] }));
  await sending;

  assert.equal(coordinator.getState().draft, "next message");
  assert.deepEqual(persisted.at(-1), { session_id: "CHAT-A", project_id: "PROJECT-A", text: "next message" });
});

test("Chat session mutation response cannot project the old transcript after a later selection", async () => {
  let releaseRename;
  const coordinator = createCoordinator(chatApi({
    renameChat: () => new Promise((resolveRename) => { releaseRename = resolveRename; }),
    selectChat: async ({ session_id: sessionId }) => chatSnapshot({
      selected: sessionId,
      sessions: [{ id: sessionId, project_id: "PROJECT-B" }],
      messages: [{ id: "B-MSG" }]
    })
  }));
  await coordinator.initialize(chatSnapshot({
    selected: "CHAT-A",
    sessions: [{ id: "CHAT-A", project_id: "PROJECT-A" }],
    messages: [{ id: "A-OLD" }]
  }));

  const rename = coordinator.renameCurrentSession("A renamed");
  await coordinator.selectSession("CHAT-B");
  releaseRename(chatSnapshot({
    selected: "CHAT-A",
    sessions: [{ id: "CHAT-A", project_id: "PROJECT-A" }],
    messages: [{ id: "A-MSG" }]
  }));
  await rename;

  assert.equal(coordinator.getState().owner.session_id, "CHAT-B");
  assert.deepEqual(coordinator.getState().snapshot.messages.map((message) => message.id), ["B-MSG"]);
});

test("Chat retry identity is owned by the current failed-session transition", async () => {
  const payloads = [];
  const coordinator = createCoordinator(chatApi({
    sendChatMessage: async (payload) => {
      payloads.push(payload);
      return chatSnapshot({
        selected: "CHAT-A",
        sessions: [{ id: "CHAT-A", project_id: "PROJECT-A", retry_client_request_id: "REQUEST-RETRY" }]
      });
    }
  }));
  await coordinator.initialize(chatSnapshot({
    selected: "CHAT-A",
    sessions: [{ id: "CHAT-A", project_id: "PROJECT-A", retry_client_request_id: "REQUEST-RETRY" }],
    messages: [{ role: "user", kind: "text", content: "retry me" }]
  }));
  coordinator.prepareRetry();
  await coordinator.send();
  assert.equal(payloads[0].client_request_id, "REQUEST-RETRY");
});

test("Chat refresh exposes progress immediately and only the latest refresh may project", async () => {
  const releases = [];
  const coordinator = createCoordinator(chatApi({
    chatSnapshot: () => new Promise((resolveRefresh) => releases.push(resolveRefresh))
  }));
  await coordinator.initialize(chatSnapshot({
    selected: "CHAT-A",
    sessions: [{ id: "CHAT-A", project_id: "PROJECT-A" }],
    messages: [{ id: "CACHED" }]
  }));

  const oldRefresh = coordinator.refresh();
  assert.equal(coordinator.getState().refreshing, true);
  assert.deepEqual(coordinator.getState().snapshot.messages.map((message) => message.id), ["CACHED"]);
  const latestRefresh = coordinator.refresh();
  releases[1](chatSnapshot({ selected: "CHAT-A", sessions: [{ id: "CHAT-A", project_id: "PROJECT-A" }], messages: [{ id: "LATEST" }] }));
  await latestRefresh;
  assert.equal(coordinator.getState().refreshing, false);
  releases[0](chatSnapshot({ selected: "CHAT-A", sessions: [{ id: "CHAT-A", project_id: "PROJECT-A" }], messages: [{ id: "STALE" }] }));
  await oldRefresh;

  assert.deepEqual(coordinator.getState().snapshot.messages.map((message) => message.id), ["LATEST"]);
  assert.equal(coordinator.getState().refreshing, false);
});

test("Chat navigation renders the cached page before starting its background refresh", async () => {
  const source = await readFile(rendererPath, "utf8");
  const start = source.indexOf("function showPage(page)");
  const end = source.indexOf("\nasync function openSettings", start);
  const chatBranch = source.slice(start, end);

  assert.ok(chatBranch.indexOf("renderPageVisibility();") < chatBranch.indexOf("refreshChat()"));
  assert.ok(chatBranch.indexOf("renderChat();") < chatBranch.indexOf("refreshChat()"));
  assert.match(source, /chat\.refreshing \? " · 正在同步"/);
  assert.match(source, /setAttribute\("aria-busy", String\(chat\.refreshing\)\)/);
});

test("Chat Renderer delegates all owner, epoch, projection, retry, send and persistence transitions", async () => {
  const source = await readFile(rendererPath, "utf8");

  for (const method of [
    "newDraft", "changeDraftWorkspace", "selectSession", "deleteCurrentSession",
    "renameCurrentSession", "interruptCurrentSession", "decideApproval", "refresh",
    "setDraft", "prepareRetry", "send"
  ]) {
    assert.match(source, new RegExp(`chatStateCoordinator\\.${method}\\(`));
  }
  assert.doesNotMatch(source, /state\.chat(?:SelectedSessionId|DraftProjectId|Draft|RetryClientRequestId|Sending|Error|\b)/);
  assert.doesNotMatch(source, /keepSelection|preserveDraftOnSelectionAdoption|\.begin\(\)|\.observe\(\)|\.invalidate\(\)/);
});

test("Chat project selector changes only the new draft owner and persisted session ownership stays fixed", async () => {
  const [source, html] = await Promise.all([
    readFile(rendererPath, "utf8"),
    readFile(rendererHtmlPath, "utf8")
  ]);

  assert.match(source, /els\.chatProjectSelect\.disabled = Boolean\(session\) \|\| chat\.snapshot\.projects\.length === 0;/);
  assert.match(source, /chatStateCoordinator\.changeDraftWorkspace\(projectId\)/);
  assert.match(source, /const projectId = defaultChatDraftProject\(\)\?\.id \|\| ""/);
  assert.match(source, /if \(session\) return chat\.snapshot\.projects\.find\(\(project\) => project\.id === session\.project_id\) \|\| null/);
  assert.match(source, /session\.project_id\)}（不可用）/);
  assert.match(source, /els\.chatWorkspacePickerLabel\.textContent = session \? "固定归属" : "新对话属于"/);
  assert.match(html, /id="chatWorkspacePickerLabel">新对话属于/);
  assert.ok(html.indexOf('id="chatProjectSelect"') > html.indexOf('<header class="chat-header">'));
});

test("Chat Renderer groups all snapshot sessions by Product Workspace with bounded inline history", async () => {
  const [source, styles] = await Promise.all([
    readFile(rendererPath, "utf8"),
    readFile(rendererStylesPath, "utf8")
  ]);

  assert.match(source, /groupChatSessions\(\{ sessions: chat\.snapshot\.sessions, projects: chat\.snapshot\.projects \}\)/);
  assert.match(source, /limit: CHAT_SESSION_PREVIEW_LIMIT/);
  assert.match(source, /查看历史会话（其余 \$\{visibility\.hidden_count\} 个）/);
  assert.match(source, /data-chat-history-project-id/);
  assert.match(source, /visibility\.selected_requires_history/);
  assert.match(styles, /\.chat-project-group \{/);
  assert.match(styles, /\.chat-history-toggle \{/);
});

test("Work navigation renders immediately before starting its dedicated query refresh", async () => {
  const source = await readFile(rendererPath, "utf8");
  const workBranch = source.slice(source.indexOf('if (page === "work")'), source.indexOf('if (page === "tasks")'));
  const queryRefresh = source.slice(source.indexOf("async function refreshWorkQuery"), source.indexOf("\nfunction mergeWorkPlatformSnapshot"));

  assert.ok(workBranch.indexOf("renderPageVisibility();") < workBranch.indexOf("refreshWorkQuery()"));
  assert.match(queryRefresh, /workQueryState\.begin\(input\)/);
  assert.match(queryRefresh, /api\.platformWorkQuery\(\{ query_key: request\.key, \.\.\.request\.query \}\)/);
  assert.match(queryRefresh, /request\.cached \|\| emptyWorkQueryProjection/);
  assert.doesNotMatch(queryRefresh, /automationSnapshot|getAuthStatus|platformSnapshot/);
  assert.doesNotMatch(queryRefresh, /renderSyncing\(true\)|syncWork/);
  assert.doesNotMatch(source, /后台刷新/);
});

test("Automation activity invalidation refreshes only the visible Run surface", async () => {
  const source = await readFile(rendererPath, "utf8");
  const eventBranch = source.slice(source.indexOf('if (event.type === "run.activity_changed")'), source.indexOf("window.setInterval"));
  const activityRefresh = source.slice(source.indexOf("async function refreshVisibleAutomationActivity"), source.indexOf("\nfunction scheduleWorkFilterRefresh"));

  assert.match(eventBranch, /scheduleActivityRefresh\(event\.runId, 120\)/);
  assert.doesNotMatch(eventBranch, /scheduleRefresh\(event\.type === "run\.activity_changed"/);
  assert.match(activityRefresh, /api\.automationSnapshot/);
  assert.match(activityRefresh, /activityRunIsVisible\(runId\)/);
  assert.match(activityRefresh, /renderCommandCenter\(\)/);
  assert.match(activityRefresh, /renderWorkbench\(\)/);
  assert.doesNotMatch(activityRefresh, /platformSnapshot|getAuthStatus|render\(\)|routeAuthentication/);
});

test("Work and Feedback assign one control row and all remaining height to their split workbench", async () => {
  const [html, styles] = await Promise.all([readFile(rendererHtmlPath, "utf8"), readFile(rendererStylesPath, "utf8")]);

  assert.match(html, /class="panel-card primary-control-rail work-control-rail"/);
  assert.match(html, /class="panel-card primary-control-rail feedback-toolbar"/);
  assert.match(styles, /\.primary-workspace-page \{[^}]*grid-template-rows: 44px minmax\(0, 1fr\);[^}]*height: 100%;[^}]*min-height: 0;/);
  assert.match(styles, /\.platform-work-layout \{[^}]*min-height: 0;[^}]*overflow: hidden;/);
  assert.match(styles, /\.platform-work-layout > \.panel-card, \.platform-work-inspector \{[^}]*min-height: 0;[^}]*overflow: hidden;/);
  assert.match(styles, /\.workspace-pane-scroll \{[^}]*min-height: 0;[^}]*overflow-y: auto;/);
  assert.match(styles, /\.feedback-workbench-layout \{[^}]*min-height: 0;[^}]*overflow: hidden;/);
  assert.doesNotMatch(styles, /\.feedback-(?:list|inspector)[^{]*\{[^}]*(?:calc\(100vh|max-height: 760px)/);
});

test("desktop primary surface is a simultaneous multi-product platform while preserving Automation", async () => {
  const [source, html, styles, chatCoordinatorSource] = await Promise.all([
    readFile(rendererPath, "utf8"),
    readFile(rendererHtmlPath, "utf8"),
    readFile(rendererStylesPath, "utf8"),
    readFile(chatStateCoordinatorPath, "utf8")
  ]);

  assert.match(html, /MULTI-PRODUCT TODAY/);
  for (const page of ["today", "organization", "work", "command", "feedback"]) {
    assert.match(html, new RegExp(`data-page="${page}"`));
  }
  assert.match(html, /data-page-view="today"/);
  assert.match(html, /data-page-view="organization"/);
  assert.match(html, /data-page-view="work"/);
  assert.match(html, /data-page-view="feedback"/);
  assert.match(html, /id="worksetSelect"/);
  assert.match(html, /不受当前产品集过滤/);
  assert.match(source, /page: "today"/);
  assert.match(source, /api\.platformSnapshot/);
  assert.match(source, /api\.setActiveWorkset/);
  assert.match(source, /api\.updateWorkset\(\{ id: activeWorkset\.id, project_ids: projectIds \}\)/);
  assert.match(html, /id="editWorksetButton"/);
  assert.match(html, /id="createOrganizationButton"/);
  assert.match(html, /id="createTaskButton"/);
  assert.doesNotMatch(html, /id="createFeedbackButton"|创建用户反馈|Workshop Feedback · V1|Feedback V2/);
  for (const id of ["feedbackSearchInput", "feedbackStateFilter", "feedbackSortSelect", "feedbackRefreshButton", "ordinaryFeedbackTable", "feedbackInspector"]) {
    assert.match(html, new RegExp(`id="${id}"`));
  }
  assert.match(html, /class="feedback-workbench-layout"/);
  assert.match(source, /function renderFeedbackInspector\(feedback\)/);
  assert.match(source, /feedbackLinkRecoveries: \{\}/);
  assert.match(source, /class="feedback-link-recovery"[\s\S]*data-feedback-link-retry[\s\S]*仅重试关联/);
  assert.match(styles, /\.feedback-link-recovery \{/);
  assert.match(source, /api\.openFeedbackAttachment\(feedback\.file\)/);
  assert.doesNotMatch(source, /href="\$\{escapeHtml\(feedback\.file\)\}"|target="_blank"/);
  assert.match(source, /function updateFeedbackPriority|async function updateFeedbackPriority/);
  assert.match(source, /const priorityAction = feedback\.linked_task_id[\s\S]*feedback-priority-readonly[\s\S]*data-feedback-priority/);
  assert.match(styles, /\.feedback-priority-readonly \{/);
  const feedbackPriorityHandler = source.slice(source.indexOf("async function updateFeedbackPriority"), source.indexOf("async function ignoreFeedback"));
  assert.match(feedbackPriorityHandler, /if \(feedback\.linked_task_id\) throw new Error/);
  assert.match(feedbackPriorityHandler, /\["P1", "P2", "P3"\]\.includes\(priority\)/);
  assert.match(source, /async function ignoreFeedback/);
  assert.doesNotMatch(source, /async function createFeedback|async function editFeedback|data-feedback-edit/);
  assert.match(styles, /\.feedback-workbench-layout \{ display: grid; grid-template-columns: minmax\(300px, \.72fr\) minmax\(440px, 1\.28fr\)/);
  assert.match(html, /id="platformActionOverlay"/);
  assert.match(source, /api\.executePlatformAction/);
  assert.match(source, /"project\.member\.update"/);
  assert.match(source, /"task\.attachment\.create"/);
  assert.match(source, /"feedback\.to_task"/);
  const feedbackToTaskHandler = source.slice(source.indexOf("async function feedbackToTask"), source.indexOf("async function deleteFeedback"));
  assert.match(feedbackToTaskHandler, /platformField\("task_content", "待办内容", \{ type: "textarea", required: true, value: feedback\.content \}\)/);
  assert.match(feedbackToTaskHandler, /platformField\("executor_id", "执行人", \{ type: "select", options: memberSelectOptions\(feedback\.project_id\) \}\)/);
  assert.match(feedbackToTaskHandler, /if \(feedback\.linked_task_id\) throw new Error/);
  assert.match(feedbackToTaskHandler, /error\?\.partial_result\?\.task_id/);
  assert.match(feedbackToTaskHandler, /state\.feedbackLinkRecoveries\[String\(feedback\.id\)\]/);
  assert.doesNotMatch(feedbackToTaskHandler, /feedback\.title \|\| feedback\.content|执行人 ID/);
  assert.doesNotMatch(feedbackToTaskHandler, /仍要新建另一个待办|Feedback V1/);
  const feedbackLinkRetryHandler = source.slice(source.indexOf("async function retryFeedbackTaskLink"), source.indexOf("async function deleteFeedback"));
  assert.match(feedbackLinkRetryHandler, /"feedback\.link_task"/);
  assert.match(feedbackLinkRetryHandler, /task_id: recovery\.task_id/);
  assert.doesNotMatch(feedbackLinkRetryHandler, /feedback\.to_task|task\.create/);
  const managedActionHandler = source.slice(source.indexOf("async function executeManagedAction"), source.indexOf("function openPlatformAction"));
  assert.match(managedActionHandler, /result\?\.status === "partial"/);
  assert.match(managedActionHandler, /partialError\.partial_result = result\.partial_result/);
  assert.match(source, /function memberSelectOptions\(projectId = ""\).*filter\(\(item\) => !projectId \|\| String\(item\.project_id\) === String\(projectId\)\).*label: memberName\(item\)/);
  assert.doesNotMatch(source, /label: `\$\{item\.project_name\} · \$\{item\.username\}`/);
  assert.match(source, /function taskExecutorName\(task\)/);
  assert.match(source, /String\(item\.project_id \|\| ""\) === projectId && String\(item\.user_id \|\| ""\) === executorId/);
  assert.match(source, /personName\(member\) \|\| "执行人姓名不可用"/);
  assert.doesNotMatch(source, /task\.assignee\?\.username \|\| task\.assignee\?\.name \|\| task\.executor_id/);
  assert.doesNotMatch(source, /`成员 \$\{item\.user_id\}`/);
  const createTaskHandler = source.slice(source.indexOf("async function createTask"), source.indexOf("async function editTask"));
  const editTaskHandler = source.slice(source.indexOf("async function editTask"), source.indexOf("async function deleteTask"));
  assert.match(createTaskHandler, /taskProjectFields\(defaultProjectId\)/);
  assert.match(createTaskHandler, /bindTaskFormProjectScope\(defaultProjectId\)/);
  assert.match(createTaskHandler, /platformField\("state", "状态", \{ type: "select", value: "pending_review", options: taskStateOptions\(\)/);
  assert.match(createTaskHandler, /platformField\("priority", "优先级", \{ type: "select"/);
  assert.doesNotMatch(createTaskHandler, /服务优先级|type: "number"/);
  assert.match(editTaskHandler, /taskProjectFields\(task\.project_id/);
  assert.match(editTaskHandler, /platformField\("project_id", "产品", \{ type: "select", required: true, value: task\.project_id, options: projects \}\)/);
  assert.match(editTaskHandler, /bindTaskFormProjectScope\(task\.project_id/);
  assert.match(editTaskHandler, /"task\.replace_project"/);
  assert.match(editTaskHandler, /source_task_id: task\.id/);
  assert.match(editTaskHandler, /新 ID 不继承评论、附件、Run、thread、Gate 或验收问题/);
  assert.match(editTaskHandler, /platformField\("state", "状态", \{ type: "select", value: task\.state, options: taskStateOptions\(\)/);
  assert.match(editTaskHandler, /expected_state: task\.state/);
  assert.doesNotMatch(editTaskHandler, /acceptance_feedback_items|Automation 管理中的状态只可/);
  assert.match(editTaskHandler, /platformField\("priority", "优先级", \{ type: "select"/);
  assert.match(editTaskHandler, /onSubmit: \(values\) => submitTaskEdit\(task, values\)/);
  assert.match(editTaskHandler, /normalizeTaskFormValues\(rawValues, \{ emptyPriority: "null" \}\)/);
  assert.match(editTaskHandler, /showTaskReplacementRecoveryInSheet\(error\.partial_result/);
  assert.match(source, /async function submitManagedPlatformAction\(\).*setPlatformActionBusy\(true\).*if \(!result\?\.keepOpen\) closePlatformAction\(null\)/s);
  assert.match(source, /function showTaskReplacementRecoveryInSheet\(partial, message\)/);
  assert.match(source, /data-platform-task-replacement-retry/);
  assert.match(source, /data-platform-task-replacement-keep/);
  assert.match(html, /id="platformActionStatus"[^>]+aria-live="polite"/);
  assert.doesNotMatch(editTaskHandler, /服务优先级|type: "number"/);
  assert.match(source, /function taskPriorityOptions\(\).*最高 · 紧急且重要.*高 · 优先处理.*中 · 正常处理.*低 · 可以延后/);
  assert.match(source, /function taskTagField\(projectId, currentTags = ""\)/);
  assert.match(source, /data-task-tag-create|data-task-tag-edit|data-task-tag-delete/);
  assert.match(source, /function buildWorkshopTagName\(displayName, color\)/);
  assert.match(styles, /\.task-project-fields \{ display: contents; \}/);
  assert.match(source, /task_replacements/);
  assert.match(source, /"task\.replace_project\.retry_delete"/);
  assert.match(source, /"task\.replace_project\.keep_both"/);
  assert.match(source, /重试不会再次创建目标待办/);
  assert.match(styles, /\.task-replacement-recovery-actions/);
  assert.match(styles, /\.task-tag-field \{ grid-column: 1 \/ -1;/);
  assert.doesNotMatch(source, /project\.member\.add/);
  const worksetHandler = source.slice(source.indexOf("async function editCurrentWorkset"), source.indexOf("async function toggleProjectInWorkset"));
  assert.doesNotMatch(worksetHandler, /setProjectParticipation|setAutomationEnabled|bindAutomationProject/);
  assert.match(source, /成员页不生成项目邀请|为何这里没有项目邀请/);
  assert.match(source, /create_once_no_list_or_revoke/);
  assert.match(html, /AUTOMATION COMMAND CENTER/);
  assert.match(html, /id="productScopeSelect"/);
  assert.match(html, /id="workStateFilters"/);
  assert.match(html, /id="acceptanceFeedbackOnlyButton"/);
  assert.doesNotMatch(html, /TASK STATUS|id="statusNavigation"|id="projectNavigation"/);
  assert.match(html, /id="queueTable"/);
  assert.match(html, /id="feedbackQueueTable"/);
  assert.match(html, /id="currentRunPanel"/);
  assert.match(source, /const TASK_STATES = \["pending_review", "pending", "in_progress", "completed", "accepted", "cancelled", "blocked"\]/);
  assert.match(source, /api\.automationSnapshot/);
  assert.match(source, /invalidateTaskAttachmentCaches\(state, \{ clearPending: identityChanged \}\)/);
  assert.match(source, /taskAttachmentIdentityKey\(\{ platform: state\.platform, authentication: state\.authentication \}\)/);
  assert.match(source, /state\.platform = emptyPlatformSnapshot\(\);[\s\S]+state\.selectedPlatformTaskId = "";[\s\S]+invalidateTaskAttachmentCaches\(state, \{ clearPending: true \}\)/);
  assert.match(source, /captureTaskAttachmentRequest\(state\)[\s\S]+task\.attachments\.list[\s\S]+isTaskAttachmentRequestCurrent\(state, request\)/);
  assert.match(source, /captureTaskAttachmentRequest\(state, \{ identityOnly: true \}\)[\s\S]+pickWorkTaskAttachment[\s\S]+isTaskAttachmentRequestCurrent\(state, request\)/);
  assert.match(source, /api\.setAutomationEnabled/);
  assert.match(source, /api\.bindAutomationProject/);
  assert.match(source, /blocked_pending_tasks/);
  assert.match(source, /acceptance_feedback_queue/);
  assert.match(source, /api\.submitAcceptanceFeedback/);
  assert.match(source, /验收问题与进展/);
  assert.match(html, /<strong>自动领取<\/strong>/);
  assert.match(html, /控制是否领取新任务；仅作用于已绑定且已授权的项目，不停止当前任务/);
  assert.match(source, /允许此项目自动领取/);
  assert.match(source, /允许自动领取 ·/);
  assert.match(source, /Case 已完成，等待远端收尾/);
  assert.match(source, /Automation Coordinator \/ 任务源/);
  assert.match(source, /phase === "remote_completion_pending"/);
  assert.match(source, /api\.setProjectParticipation\(project\.id, true\)/);
  assert.match(styles, /--sidebar-width: 244px;/);
  assert.match(styles, /--type-body: 14px;/);
  assert.match(styles, /--type-conversation: 15px;/);
  assert.match(styles, /--control-default: 36px;/);
  assert.match(styles, /\.product-grid \{ display: grid; grid-template-columns: repeat\(3, minmax\(0, 1fr\)\)/);
  assert.match(styles, /\.platform-two-column, \.feedback-lanes \{ display: grid;/);
  assert.match(styles, /\.command-grid \{ display: grid; grid-template-columns: minmax\(0, 1fr\) 298px;/);
  assert.match(html, /PERSONAL · CODEX CHAT/);
  for (const id of ["chatProjectSelect", "chatSessionList", "chatTranscript", "chatInput", "chatStopButton", "chatSendButton"]) {
    assert.match(html, new RegExp(`id="${id}"`));
  }
  assert.match(source, /api\.chatSnapshot/);
  assert.match(chatCoordinatorSource, /api\.selectChat/);
  assert.match(chatCoordinatorSource, /api\.sendChatMessage/);
  assert.match(chatCoordinatorSource, /api\.interruptChat/);
  assert.match(chatCoordinatorSource, /api\.decideChatApproval/);
  assert.match(styles, /\.chat-workspace \{/);
});

test("desktop keeps the remaining lifecycle previews inert while Chat is a real isolated Codex surface", async () => {
  const [source, html, styles] = await Promise.all([
    readFile(rendererPath, "utf8"),
    readFile(rendererHtmlPath, "utf8"),
    readFile(rendererStylesPath, "utf8")
  ]);

  const sidebar = html.slice(html.indexOf('<nav class="primary-nav"'), html.indexOf('</nav>'));
  const orderedLabels = [
    "PERSONAL", "Today", "Chat",
    "PRODUCT LIFECYCLE", "Idea", "Work", "Automation", "Release", "Operations", "Feedback",
    "ORGANIZATION", "Organization", "Engineering"
  ];
  let cursor = -1;
  for (const label of orderedLabels) {
    const next = sidebar.indexOf(label, cursor + 1);
    assert.ok(next > cursor, `${label} should appear in the planned navigation order`);
    cursor = next;
  }
  for (const page of ["chat", "idea", "release", "operations", "engineering"]) {
    assert.match(sidebar, new RegExp(`data-page="${page}"`));
    assert.match(html, new RegExp(`data-page-view="${page}"`));
  }
  assert.match(html, /PERSONAL · CODEX CHAT/);
  assert.match(html, /Chat 不创建待办、Idea、Case 或 Automation Run/);
  assert.match(html, /PRODUCT LIFECYCLE · IDEA/);
  assert.match(html, /PRODUCT LIFECYCLE · RELEASE/);
  assert.match(html, /Release 是“发布”的统一英文入口/);
  assert.match(html, /PRODUCT LIFECYCLE · OPERATIONS/);
  assert.match(html, /Operations 是“运营”的统一英文入口/);
  assert.match(html, /ORGANIZATION · DOMAIN PROFILE MANAGEMENT/);
  assert.match(html, /领域模型与能力管理/);
  assert.match(html, /MANAGEMENT PREVIEW · 无真实写入/);
  assert.match(html, /Domain Profiles/);
  assert.match(html, /Software Engineering/);
  assert.match(html, /Campaign Operations/);
  assert.match(html, /Research Program/);
  assert.match(html, /State Model/);
  assert.match(html, /Project State · Software Definition/);
  assert.match(html, /Case State · Engineering Mapping/);
  assert.match(html, /Capability Mapping/);
  assert.match(html, /预期事实/);
  assert.match(html, /实现现状/);
  assert.match(html, /问题定位/);
  assert.match(html, /Lifecycle Mapping/);
  assert.match(html, /Change Preview/);
  assert.match(html, /Review &amp; Apply/);
  assert.match(html, /Stable operating model/);
  assert.match(html, /Idea[\s\S]*Work[\s\S]*Automation[\s\S]*Release[\s\S]*Operations[\s\S]*Feedback/);
  assert.match(html, /LOOP KERNEL · 保持不变/);
  assert.match(html, /Entry capabilities 不进入 Profile/);
  assert.doesNotMatch(sidebar, /data-page="state"|data-page="skills"/);
  assert.doesNotMatch(html, /data-page-view="state"|data-page-view="skills"/);
  assert.doesNotMatch(html, /using-arckit|arckit-development-ledger|Trusted entrypoints/);
  assert.match(html, /PLAN VIEW · 不创建 Project/);
  assert.match(html, /PLAN VIEW · 不授权发版/);
  assert.match(html, /PLAN VIEW · 不调用外部平台/);
  assert.doesNotMatch(html, /data-plan-action|id="createIdeaButton"|id="publishReleaseButton"/);
  assert.match(source, /\["organization", "engineering"\]\.includes\(state\.page\)/);
  assert.match(source, /chat: "Chat", idea: "Idea"/);
  assert.match(source, /release: "Release", operations: "Operations"/);
  assert.match(source, /engineering: "Engineering"/);
  assert.match(styles, /\.planning-three-column/);
  assert.match(styles, /\.planning-boundary/);
  assert.match(styles, /\.profile-management-grid/);
  assert.match(styles, /\.profile-capability-grid/);
  assert.match(styles, /\.profile-lifecycle/);
  assert.doesNotMatch(source, /applyDomainProfile|saveDomainProfile|installDomainSkill/);
});

test("Desktop opens feedback attachments through a bounded main-process HTTPS capability", async () => {
  const [main, preload] = await Promise.all([
    readFile(desktopMainPath, "utf8"),
    readFile(desktopPreloadPath, "utf8")
  ]);
  assert.match(preload, /openFeedbackAttachment: \(value\) => ipcRenderer\.invoke\("arckit:feedback-attachment-open", value\)/);
  assert.match(main, /requireFeedbackAttachmentUrl\(value\)/);
  assert.match(main, /event\.sender !== mainWindow\?\.webContents/);
  assert.match(main, /await shell\.openExternal\(url\)/);
  assert.match(main, /installMainWindowNavigationBoundary\(mainWindow\.webContents, rendererUrl\)/);
});

test("Desktop keeps developer Feedback V2 conversation behind dedicated typed IPC", async () => {
  const [main, preload, source, styles] = await Promise.all([
    readFile(desktopMainPath, "utf8"),
    readFile(desktopPreloadPath, "utf8"),
    readFile(rendererPath, "utf8"),
    readFile(rendererStylesPath, "utf8")
  ]);
  for (const channel of [
    "arckit:feedback-v2-messages",
    "arckit:feedback-v2-reply",
    "arckit:feedback-v2-read",
    "arckit:feedback-v2-ignore",
    "arckit:feedback-v2-update",
    "arckit:feedback-v2-delete",
    "arckit:feedback-v2-convert",
    "arckit:feedback-v2-attachment-open"
  ]) {
    assert.match(main, new RegExp(channel));
    assert.match(preload, new RegExp(channel));
  }
  assert.match(source, /api\.getFeedbackV2Messages/);
  assert.match(source, /api\.sendFeedbackV2Reply/);
  assert.match(source, /api\.markFeedbackV2Read/);
  assert.match(main, /settleFeedbackV2Ipc/);
  assert.match(preload, /unwrapFeedbackV2Ipc/);
  assert.match(source, /state\.feedbackConversations\[String\(feedback\.id\)\]/);
  assert.match(source, /draft: current\?\.draft \|\| ""/);
  assert.match(source, /data-feedback-message-attachment/);
  assert.match(styles, /\.feedback-conversation/);
  assert.doesNotMatch(preload, /fetch|httpRequest|feedbackV2Request|apiKey|Authorization/);
  assert.doesNotMatch(source, /Project 107|FEEDBACK_API_KEY/);
});

test("Feedback V2 typed IPC preserves status and Renderer executes 401 and 404 recovery", async () => {
  const envelope401 = await settleFeedbackV2Ipc(async () => {
    throw Object.assign(new Error("expired"), { code: "unauthenticated", status: 401 });
  });
  assert.deepEqual(envelope401, {
    version: "feedback-v2-ipc-result/v1",
    ok: false,
    error: { code: "unauthenticated", status: 401, message: "expired" }
  });
  assert.throws(() => unwrapFeedbackV2Ipc(envelope401), (error) => error.code === "unauthenticated" && error.status === 401);

  const source = await readFile(rendererPath, "utf8");
  const start = source.indexOf("async function runFeedbackV2Request");
  const end = source.indexOf("\nasync function executeManagedAction", start);
  const recoverySource = source.slice(start, end);
  const calls = { auth: 0, gate: 0, refresh: 0 };
  const context = {
    state: {},
    api: { getAuthStatus: async () => { calls.auth += 1; return { status: "expired", authenticated: false }; } },
    normalizeAuthentication: (value) => value,
    showLoginGate: () => { calls.gate += 1; },
    refreshSnapshot: async () => { calls.refresh += 1; }
  };
  vm.runInNewContext(`${recoverySource}\nglobalThis.runFeedbackV2Request = runFeedbackV2Request;`, context);

  await assert.rejects(context.runFeedbackV2Request(async () => unwrapFeedbackV2Ipc(envelope401)), /expired/);
  assert.deepEqual(calls, { auth: 1, gate: 1, refresh: 0 });

  const envelope404 = await settleFeedbackV2Ipc(async () => {
    throw Object.assign(new Error("missing"), { code: "not_found", status: 404 });
  });
  await assert.rejects(context.runFeedbackV2Request(async () => unwrapFeedbackV2Ipc(envelope404)), /missing/);
  assert.deepEqual(calls, { auth: 1, gate: 1, refresh: 1 });
});

test("Feedback list keeps every feedback on one compact visual row", async () => {
  const [source, styles] = await Promise.all([
    readFile(rendererPath, "utf8"),
    readFile(rendererStylesPath, "utf8")
  ]);
  const renderStart = source.indexOf("function renderPlatformFeedback()");
  const renderEnd = source.indexOf("\nfunction renderFeedbackInspector", renderStart);
  const listSource = source.slice(renderStart, renderEnd);

  assert.match(listSource, /feedback-list-copy/);
  assert.match(listSource, /feedback-list-meta/);
  assert.match(styles, /\.feedback-list \{[^}]*align-content: start;/);
  assert.match(styles, /\.feedback-list-item \{[^}]*align-items: center;[^}]*min-height: var\(--row-compact\) !important;[^}]*padding: 7px 14px;/);
  assert.match(styles, /\.feedback-list-copy \{[^}]*display: flex;[^}]*white-space: nowrap;/);
  assert.match(styles, /\.feedback-list-meta \{[^}]*display: flex;[^}]*white-space: nowrap;/);
  assert.doesNotMatch(styles, /\.feedback-list-copy \{[^}]*display: grid/);
  assert.doesNotMatch(styles, /\.feedback-list-meta \{[^}]*display: grid/);
});

test("Feedback detail scrolls internally and image attachments reuse the managed image viewer", async () => {
  const [source, styles, preload, main] = await Promise.all([
    readFile(rendererPath, "utf8"),
    readFile(rendererStylesPath, "utf8"),
    readFile(desktopPreloadPath, "utf8"),
    readFile(desktopMainPath, "utf8")
  ]);
  assert.match(source, /feedback-inspector-scroll/);
  assert.match(styles, /\.feedback-inspector \{[^}]*overflow: hidden/);
  assert.match(styles, /\.feedback-inspector-scroll \{[^}]*overflow-y: auto;[^}]*overscroll-behavior: contain/);
  assert.match(source, /feedbackResourceIsImage\(attachment\)[\s\S]*renderFeedbackImage/);
  assert.match(source, /api\.previewImage\(job\.input\)/);
  assert.match(source, /api\.openImageViewer\(state\.feedbackImageInputs/);
  assert.match(preload, /previewImage: \(input\) => ipcRenderer\.invoke\("arckit:image-preview", input\)/);
  assert.match(preload, /openImageViewer: \(input\) => ipcRenderer\.invoke\("arckit:image-viewer-open", input\)/);
  assert.match(main, /createImageViewer/);
  assert.match(main, /input\.source === "feedback-file"/);
  assert.match(main, /input\.source === "feedback-v2"/);
  assert.match(main, /ipcMain\.handle\("arckit:image-viewer-open"/);
  assert.match(styles, /\.feedback-image-preview\.is-loaded img/);
});

test("Feedback V2 read state respects notification capability and refreshes visible unread projection", async () => {
  const source = await readFile(rendererPath, "utf8");
  const listStart = source.indexOf("function renderPlatformFeedback");
  const listEnd = source.indexOf("\nfunction renderFeedbackInspector", listStart);
  const workspaceStart = source.indexOf("function feedbackWorkspace");
  const workspaceEnd = source.indexOf("\nfunction renderFeedbackConversation", workspaceStart);
  const loadStart = source.indexOf("async function loadFeedbackConversation");
  const loadEnd = source.indexOf("\nasync function sendFeedbackReply", loadStart);
  const readStateSource = `${source.slice(listStart, listEnd)}\n${source.slice(workspaceStart, workspaceEnd)}\n${source.slice(loadStart, loadEnd)}`;
  const calls = { messages: 0, markRead: 0, renders: 0 };
  const workspace = {
    id: 7,
    feedback_management: {
      features: { mark_read: false },
      unread_count: 3,
      unread_feedback_ids: ["51", "52"]
    }
  };
  const context = {
    state: {
      platform: {
        product_workspaces: [workspace],
        feedback_v1: [{ id: 51, project_id: 7, title: "Needs attention" }]
      },
      feedbackConversations: {},
      selectedFeedbackId: "51",
      feedbackFilter: "",
      feedbackState: "all",
      feedbackSort: "newest"
    },
    els: {
      feedbackSearchInput: { value: "" },
      feedbackStateFilter: { value: "" },
      feedbackSortSelect: { value: "" },
      feedbackListSummary: { textContent: "stale summary" },
      ordinaryFeedbackTable: {
        innerHTML: "stale list",
        querySelectorAll: () => []
      }
    },
    api: {
      getFeedbackV2Messages: async () => { calls.messages += 1; return [{ id: "message-1" }]; },
      markFeedbackV2Read: async () => { calls.markRead += 1; return { marked_count: 2 }; }
    },
    runFeedbackV2Request: async (operation) => operation(),
    renderFeedbackInspector: () => { calls.renders += 1; },
    platformItemMatchesSelectedProject: () => true,
    feedbackProcessingState: () => "pending",
    compareFeedbackItems: () => 0,
    escapeHtml: (value) => String(value ?? ""),
    feedbackExcerpt: (value) => String(value ?? ""),
    formatFeedbackDate: () => "today",
    FEEDBACK_STATE_LABELS: { pending: "待处理" }
  };
  vm.runInNewContext(`${readStateSource}\nglobalThis.loadFeedbackConversation = loadFeedbackConversation;`, context);
  const feedback = { id: 51, project_id: 7 };

  await context.loadFeedbackConversation(feedback);
  assert.equal(calls.messages, 1);
  assert.equal(calls.markRead, 0);
  assert.equal(context.state.feedbackConversations["51"].readError, "");
  assert.equal(workspace.feedback_management.unread_count, 3);
  assert.deepEqual(workspace.feedback_management.unread_feedback_ids, ["51", "52"]);
  assert.equal(context.els.feedbackListSummary.textContent, "stale summary");
  assert.equal(context.els.ordinaryFeedbackTable.innerHTML, "stale list");

  workspace.feedback_management.features.mark_read = true;
  delete context.state.feedbackConversations["51"];
  await context.loadFeedbackConversation(feedback);
  assert.equal(calls.messages, 2);
  assert.equal(calls.markRead, 1);
  assert.equal(context.state.feedbackConversations["51"].readError, "");
  assert.equal(workspace.feedback_management.unread_count, 1);
  assert.deepEqual(workspace.feedback_management.unread_feedback_ids, ["52"]);
  assert.equal(context.els.feedbackListSummary.textContent, "1 条 · 1 未读");
  assert.doesNotMatch(context.els.ordinaryFeedbackTable.innerHTML, /feedback-unread-dot/);
  assert.equal(calls.renders, 4);
});

test("ADVANCE owns one top product-set scope while Work and Automation own their local filters", async () => {
  const [source, html, styles] = await Promise.all([
    readFile(rendererPath, "utf8"),
    readFile(rendererHtmlPath, "utf8"),
    readFile(rendererStylesPath, "utf8")
  ]);

  const sidebar = html.slice(html.indexOf('<aside class="sidebar">'), html.indexOf('<main class="app-stage">'));
  const commandbar = html.slice(html.indexOf('<header class="commandbar">'), html.indexOf('<div class="view-host">'));
  const workView = html.slice(html.indexOf('id="workView"'), html.indexOf('id="feedbackView"'));
  const commandView = html.slice(html.indexOf('id="commandView"'), html.indexOf('id="taskView"'));
  assert.doesNotMatch(sidebar, /TASK STATUS|仅看验收问题|添加本地项目|本地 Runtime|<strong>任务源<\/strong>/);
  assert.match(commandbar, /id="productSetCluster"/);
  assert.match(commandbar, /id="worksetSelect"/);
  assert.match(commandbar, /id="productScopeSelect"/);
  assert.match(commandbar, /管理当前产品集/);
  assert.match(workView, /id="workStateFilters"/);
  assert.match(workView, /class="platform-work-layout"/);
  assert.match(workView, /id="platformWorkInspector"/);
  assert.match(commandView, /id="acceptanceFeedbackOnlyButton"/);
  assert.match(commandView, /仅看验收问题/);
  assert.match(commandView, /验收问题队列/);
  assert.doesNotMatch(commandView, /验收反馈/);
  assert.doesNotMatch(commandView, /AUTOMATION FILTER|id="projectNavigation"/);
  assert.match(html, /id="accountButton"/);
  assert.match(html, /id="accountAvatar"/);
  assert.doesNotMatch(html, /id="sourceHealthButton"|id="runtimeHealthButton"|id="pickProjectButton"/);
  assert.match(source, /advanceProjectsInActiveWorkset\(\)/);
  assert.match(source, /active_workset\?\.project_ids/);
  assert.match(source, /<option value="all">项目集全部/);
  assert.match(source, /item\.project_id \|\| item\.source_project_id/);
  assert.match(source, /!projectId && item\.freeze_scope === "global"/);
  assert.match(source, /snapshot\.active_executions \|\| \[\]/);
  assert.match(source, /data-automation-execution/);
  assert.match(source, /api\.selectAutomationExecution/);
  assert.match(source, /同工作区串行/);
  assert.match(source, /const stateCounts = workStateCounts\(projection\)/);
  assert.match(source, /data-platform-task-select/);
  assert.match(source, /function renderPlatformWorkInspector\(task\)/);
  assert.match(source, /automationTask\?\.state === "completed"/);
  assert.match(source, /该待办已验收，不再接受新的验收问题/);
  assert.doesNotMatch(html.slice(html.indexOf('id="feedbackView"'), html.indexOf('id="commandView"')), /验收问题队列|验收反馈|acceptanceFeedbackPlatformTable/);
  assert.match(source, /state\.platform\.feedback_v1 \|\| \[\]\)\.filter\(platformItemMatchesSelectedProject\)\.length/);
  assert.match(source, /function activeExecutionMatchesSelectedProject\(active\) \{\s+return Boolean\(active\);/);
  assert.match(source, /snapshot\.recovery_items\.length/);
  assert.match(source, /state\.acceptanceFeedbackOnly = !state\.acceptanceFeedbackOnly/);
  assert.match(source, /els\.ordinaryQueueCard\.classList\.toggle\("hidden", state\.acceptanceFeedbackOnly\)/);
  assert.match(source, /platform\.product_workspaces \|\| \[\]\)\.filter\(platformItemMatchesSelectedProject\)/);
  assert.match(source, /projection\.tasks \|\| \[\]\)\.filter\(platformItemMatchesSelectedProject\)/);
  assert.match(source, /localProjectId === "__add_local_project__"/);
  assert.match(source, /const localProject = await api\.pickProject\(\)/);
  assert.match(source, /await api\.bindAutomationProject\(remoteId, localProjectId\)/);
  assert.match(source, /platformUser\.name \|\| platformUser\.username/);
  assert.match(source, /els\.authIdentity\.textContent = authenticated \? currentWorkshopUserName\(\)/);
  assert.match(styles, /\.product-set-cluster/);
  assert.match(styles, /\.work-state-filters/);
  assert.match(styles, /\.filter-toggle/);
  assert.match(styles, /\.account-avatar/);
  assert.match(styles, /#workView\.is-active, #feedbackView\.is-active \{ overflow: hidden; \}/);
  assert.match(styles, /\.primary-workspace-page[^}]+grid-template-rows: 44px minmax\(0, 1fr\)[^}]+height: 100%[^}]+min-height: 0/);
  assert.match(styles, /\.platform-work-layout[^}]+align-items: stretch[^}]+min-height: 0[^}]+overflow: hidden/);
  assert.match(styles, /\.workspace-pane-scroll[^}]+overflow-y: auto[^}]+overscroll-behavior: contain[^}]+scrollbar-gutter: stable/);
});

test("Work exposes local-projection filters, task hierarchy, complete detail, subtasks and TaskAttachment collaboration", async () => {
  const [source, html, styles] = await Promise.all([
    readFile(rendererPath, "utf8"),
    readFile(rendererHtmlPath, "utf8"),
    readFile(rendererStylesPath, "utf8")
  ]);
  const workView = html.slice(html.indexOf('id="workView"'), html.indexOf('id="feedbackView"'));
  for (const id of ["workCreatorFilter", "workExecutorFilter", "workTagFilter", "workPriorityFilter", "workStartDateFilter", "workEndDateFilter", "openTaskReferenceButton", "resetWorkFiltersButton"]) {
    assert.match(workView, new RegExp(`id="${id}"`));
  }
  assert.match(workView, /data-work-filter-menu/);
  assert.doesNotMatch(workView, /<select id="work(?:Creator|Executor|Tag|Priority)Filter" multiple/);
  assert.match(source, /task_filters: state\.page === "work" \? platformTaskFilters\(\) : \{\}/);
  assert.match(source, /tree: true/);
  assert.match(source, /states: \[state\.selectedState\]/);
  assert.doesNotMatch(source.match(/function platformTaskFilters\(\) \{[\s\S]*?\n\}/)?.[0] || "", /states: TASK_STATES/);
  assert.match(source, /function workStateCounts\(projection\)/);
  assert.match(source, /projection\.product_workspaces \|\| \[\]/);
  const countProjection = source.match(/function workStateCounts\(projection\) \{[\s\S]*?\n\}/)?.[0] || "";
  assert.doesNotMatch(countProjection, /state\.platform/);
  assert.match(source, /aria-label="\$\{STATE_LABELS\[taskState\]\}，\$\{stateCounts\[taskState\]\} 项"/);
  assert.match(styles, /\.work-state-filter \{[^}]+position: relative[^}]+grid-template-columns: 15px minmax\(0, 1fr\)/);
  assert.match(styles, /\.work-state-filter em \{[^}]+position: absolute[^}]+top: -6px[^}]+right: -5px/);
  assert.match(source, /hasTreeSummary \? matchedTotal : stateCounts\[state\.selectedState\]/);
  assert.match(source, /Number\.isInteger\(task\.tree_depth\)\) \? scopedTasks : rankTasks\(stateTasks\)/);
  assert.match(source, /task\.tree_depth/);
  assert.match(source, /data-work-inspector-subtask/);
  assert.match(source, /executeManagedAction\("task\.subtask\.create"/);
  assert.match(source, /executeManagedAction\("task\.reparent"/);
  assert.match(source, /function taskAttachmentPanel\(task\)/);
  assert.match(source, /function updatePlatformWorkInspector\(taskId, html\)/);
  assert.match(source, /platformWorkInspectorRender\.html === html/);
  assert.match(source, /template\.content\.querySelector\(selector\)\?\.replaceWith\(editor\)/);
  assert.doesNotMatch(source, /work(?:Comment|Acceptance)Draft/);
  assert.match(source, /task\.attachment\.create.*type: "text"/s);
  assert.match(source, /String\(item\.creator_id\) === userId/);
  assert.match(source, /\["owner", "admin"\]\.includes\(role\)/);
  assert.match(source, /data-task-attachment-retry/);
  assert.match(source, /renderRestrictedMarkdown\(task\.content\)/);
  assert.match(source, /api\.openWorkExternalLink\(button\.dataset\.taskMarkdownExternalLink\)/);
  for (const field of ["创建人", "执行人", "父待办", "优先级", "标签", "创建时间", "更新时间", "完成时间"]) assert.match(source, new RegExp(`\\["${field}"`));
  assert.match(source, /data-work-inspector-copy-reference/);
  for (const action of ["edit", "subtask", "reparent", "attachment", "delete"]) assert.match(source, new RegExp(`data-work-inspector-${action}`));
  const workListSource = source.slice(source.indexOf("function renderPlatformWork()"), source.indexOf("\nfunction renderWorkFilterControls"));
  assert.doesNotMatch(workListSource, /data-platform-task-(?:edit|attachment|delete)/);
  assert.doesNotMatch(workListSource, /<th>管理<\/th>/);
  assert.doesNotMatch(workListSource, /parent-task-ref|task-tags/);
  assert.match(source, /import \{ renderRestrictedMarkdown, resolveWorkTaskReference, workTaskReference, workTaskReferenceSelection \} from "\.\/restricted-markdown\.mjs"/);
  assert.match(source, /navigator\.clipboard\.writeText\(workTaskReference\(task\)\)/);
  assert.match(source, /resolveWorkTaskReference\(reference, platform\)/);
  assert.match(source, /task_filters: \{ tree: false, states: TASK_STATES \}/);
  assert.match(source, /Object\.assign\(state, workTaskReferenceSelection\(target\)\)/);
  assert.match(source, /data-work-inspector-state-save/);
  assert.match(source, /async function updateTaskStateFromInspector/);
  assert.match(source, /Work Sync 提交并等待服务器确认；Automation 只消费确认后的状态/);
  assert.match(styles, /\.work-task-status-editor/);
  assert.match(styles, /\.work-filter-groups/);
  assert.match(html, /id="workFilterSummary"/);
  assert.match(html, /id="workStateSelect"/);
  assert.match(styles, /\.work-filter-popover \{[^}]*position: absolute/);
  assert.match(styles, /\.platform-work-table td \{[^}]*height: 40px;[^}]*white-space: nowrap/);
  assert.match(styles, /\.task-comment-timeline/);
  assert.match(styles, /\.task-markdown-detail/);
  assert.match(styles, /\.task-markdown-detail blockquote/);
  assert.match(styles, /\.task-markdown-link[^}]+cursor: pointer/);
});

test("Work opens allowed Markdown links through a bounded main-process capability", async () => {
  const [main, preload] = await Promise.all([
    readFile(desktopMainPath, "utf8"),
    readFile(desktopPreloadPath, "utf8")
  ]);
  assert.match(preload, /openWorkExternalLink: \(value\) => ipcRenderer\.invoke\("arckit:work-external-link-open", value\)/);
  assert.match(main, /ipcMain\.handle\("arckit:work-external-link-open"/);
  assert.match(main, /assertMainRenderer\(event\)/);
  assert.match(main, /requireWorkExternalLinkUrl\(value\)/);
  assert.match(main, /await shell\.openExternal\(url\)/);
});

test("desktop renders and composes type-preserving TaskAttachment resources through bounded IPC", async () => {
  const [source, preload, main, styles] = await Promise.all([
    readFile(rendererPath, "utf8"),
    readFile(desktopPreloadPath, "utf8"),
    readFile(desktopMainPath, "utf8"),
    readFile(rendererStylesPath, "utf8")
  ]);
  assert.match(source, /parseTaskAttachmentContent\(item\)/);
  assert.match(source, /buildTaskCommentContent\(/);
  assert.match(source, /data-task-comment-add-image/);
  assert.match(source, /data-task-comment-add-file/);
  assert.match(source, /api\.previewWorkTaskAttachment\(job\.input\)/);
  assert.match(source, /TASK_ATTACHMENT_PREVIEW_CONCURRENCY = 3/);
  assert.match(source, /loadMissingTaskAttachmentPreviews\(task\)/);
  assert.match(source, /api\.openImageViewer\(taskAttachmentResourceInput\(button\)\)/);
  assert.match(source, /data-task-attachment-image-retry/);
  assert.match(source, /api\.openWorkTaskAttachment\(taskAttachmentResourceInput\(button\)\)/);
  assert.doesNotMatch(source, /options: \["text", "file", "url"\]/);
  assert.match(preload, /pickWorkTaskAttachment: \(input\) => ipcRenderer\.invoke\("arckit:work-task-attachment-pick", input\)/);
  assert.match(preload, /previewWorkTaskAttachment: \(input\) => ipcRenderer\.invoke\("arckit:work-task-attachment-preview", input\)/);
  assert.match(preload, /openImageViewer: \(input\) => ipcRenderer\.invoke\("arckit:image-viewer-open", input\)/);
  assert.match(preload, /openWorkTaskAttachment: \(input\) => ipcRenderer\.invoke\("arckit:work-task-attachment-open", input\)/);
  assert.match(main, /ipcMain\.handle\("arckit:work-task-attachment-pick"/);
  assert.match(main, /platformCoordinator\.uploadTaskAttachmentResource/);
  assert.match(main, /ipcMain\.handle\("arckit:work-task-attachment-preview"/);
  assert.match(main, /platformCoordinator\.getTaskAttachmentResourceUrl/);
  assert.match(main, /createImageViewer/);
  assert.match(main, /ipcMain\.handle\("arckit:image-viewer-open"/);
  assert.match(main, /ipcMain\.handle\("arckit:image-viewer-save"/);
  assert.match(main, /ipcMain\.handle\("arckit:image-viewer-retry"/);
  const viewerRenderer = await readFile(imageViewerRendererPath, "utf8");
  assert.match(viewerRenderer, /state\.status === "loading"[\s\S]*clearDisplayedImage\(\)/);
  assert.match(viewerRenderer, /els\.image\.removeAttribute\("src"\)/);
  assert.match(main, /ipcMain\.handle\("arckit:work-task-attachment-open"/);
  assert.match(styles, /\.task-comment-images/);
  assert.match(styles, /\.task-comment-pending-resources/);
});

test("desktop exposes Task Browser, on-demand Workbench, and Recovery Center as closed-loop views", async () => {
  const [source, html, styles, conversationSurface] = await Promise.all([
    readFile(rendererPath, "utf8"),
    readFile(rendererHtmlPath, "utf8"),
    readFile(rendererStylesPath, "utf8"),
    readFile(conversationSurfacePath, "utf8")
  ]);

  assert.match(html, /data-page-view="tasks"/);
  assert.doesNotMatch(html, /id="searchButton"|搜索任务、项目或 Run/);
  assert.doesNotMatch(styles, /\.search-trigger/);
  assert.doesNotMatch(source, /els\.searchButton|event\.key\.toLowerCase\(\) === "k"/);
  assert.match(source, /data-feedback-task[\s\S]*else openTaskBrowser\(task\?\.state \|\| "completed", task\?\.id \|\| row\.dataset\.feedbackTask\)/);
  assert.match(source, /data-queue-task[\s\S]*openTaskBrowser\("pending", row\.dataset\.queueTask\)/);
  assert.match(html, /INTERVENTION WORKBENCH/);
  assert.match(html, /data-page-view="workbench"/);
  assert.match(html, /AUTOMATION RECOVERY CENTER/);
  assert.match(html, /data-page-view="recovery"/);
  assert.match(source, /openWorkbench\("intervention"\)/);
  assert.match(source, /state\.workbenchMode !== "intervention"/);
  assert.match(html, /id="interveneCurrentButton"/);
  assert.match(source, /state\.interventionSubmitting = true/);
  assert.match(source, /api\.submitIntervention/);
  assert.match(source, /api\.resolveAutomationRecovery/);
  assert.match(source, /api\.updateAutomationTaskState/);
  assert.match(source, /state\.workbenchRun \|\| state\.snapshot\.active_run/);
  assert.match(source, /state\.workbenchCompletion\?\.local_project_id/);
  assert.match(source, /api\.listMessages\(localProjectId, run\.session_id\)/);
  assert.match(source, /message\.task_id/);
  assert.match(source, /Task Session/);
  assert.match(source, /import \{ taskDisplayTitle \} from "\.\.\/\.\.\/src\/task-display-title\.mjs"/);
  assert.match(source, /const inspectorHtml = `<h2>待办 \$\{escapeHtml\(task\.id\)\}<\/h2><article class="task-markdown-detail">\$\{renderRestrictedMarkdown\(task\.content\)\}/);
  assert.match(source, /taskInspector\.innerHTML = `<h2>待办 \$\{escapeHtml\(task\.id\)\}<\/h2><p>\$\{escapeHtml\(task\.content/);
  assert.doesNotMatch(source, /taskInspector\.innerHTML = `<h2>\$\{escapeHtml\(task\.title\)\}/);
  assert.doesNotMatch(source, /`\$\{task\.title\} \$\{task\.content\} \$\{task\.project_name\}/);
  assert.match(styles, /\.run-heading h3 \{[^}]*text-overflow: ellipsis;[^}]*white-space: nowrap;/);
  assert.match(styles, /\.workbench-heading h1 \{[^}]*text-overflow: ellipsis;[^}]*white-space: nowrap;/);
  assert.match(source, /Token 逻辑总量/);
  assert.match(source, /cached_input_tokens/);
  assert.match(source, /uncached_input_tokens/);
  assert.match(source, /usage_warnings/);
  assert.match(source, /模型 Turn 耗时/);
  assert.match(source, /命令累计耗时/);
  assert.match(source, /历史基线/);
  assert.match(source, /相对历史中位数/);
  assert.match(source, /Codex Thread/);
  assert.match(source, /上下文压缩/);
  assert.match(source, /context_compactions/);
  assert.match(source, /Git 收尾/);
  assert.match(source, /mergeAutomationTranscript/);
  assert.equal((source.match(/createConversationSurface\(\{/g) || []).length, 2);
  assert.equal((source.match(/performAction: runAction/g) || []).length, 2);
  assert.match(source, /chatConversationSurface\.render/);
  assert.match(source, /workbenchConversationSurface\.render/);
  assert.match(conversationSurface, /renderConversationSurfaceMessage/);
  assert.match(source, /run\.activity_changed/);
  assert.match(source, /artifact_paths\?\.messages_file/);
  assert.doesNotMatch(source, /renderRunPlan\(activity\)|renderExecutionEvidence\(activity\)|raw_events/);
  assert.match(source, /artifact_ownership_scan\?\.implementation_evidence/);
  assert.equal((html.match(/class="conversation-surface chat-transcript"/g) || []).length, 2);
  assert.match(html, /class="transcript-scroll-area"/);
  assert.match(html, /id="jumpToLatestButton"/);
  assert.doesNotMatch(source, /transcriptFollowingLatest|chatFollowingLatest/);
  assert.match(conversationSurface, /isNearBottom/);
  assert.match(source, /renderLoopStatus/);
  assert.match(source, /renderToolActivity/);
  assert.match(source, /renderStructuredResult/);
  assert.match(styles, /#workbenchView\.is-active \{ overflow: hidden; \}/);
  assert.match(styles, /\.workbench-layout[^}]+height: 100%[^}]+overflow: hidden/);
  assert.match(styles, /\.workbench-context, \.workbench-evidence[^}]+overflow-y: auto/);
  assert.match(styles, /\.conversation-surface[^}]+overflow-y: auto/);
  assert.doesNotMatch(styles, /\.conversation-surface[^}]+scroll-behavior:\s*smooth/);
  assert.match(source, /完整执行总览/);
  assert.match(source, /gap_round_count/);
  assert.match(source, /renderAutomationPanelActivity/);
  assert.match(styles, /\.tool-activity-summary[^}]+text-overflow: ellipsis[^}]+white-space: nowrap/);
  assert.match(styles, /\.reasoning-disclosure/);
  assert.match(styles, /\.structured-result-raw pre[^}]+overflow: auto/);
});

test("Desktop gates automation behind bounded Setup Readiness plan and confirmation IPC", async () => {
  const [main, preload, source, html, styles] = await Promise.all([
    readFile(desktopMainPath, "utf8"), readFile(desktopPreloadPath, "utf8"),
    readFile(rendererPath, "utf8"), readFile(rendererHtmlPath, "utf8"), readFile(rendererStylesPath, "utf8")
  ]);
  assert.match(html, /id="setupReadiness"/);
  assert.match(html, /id="setupReviewed"/);
  assert.match(html, /id="setupRecoverButton"/);
  assert.match(html, /id="setupRecoveryGuideButton"/);
  assert.match(html, /id="setupCleanupPanel"/);
  assert.match(html, /id="setupCleanupSelectAll"/);
  assert.match(html, /id="setupCleanupButton"/);
  assert.match(html, /id="setupPlanSummary"/);
  assert.match(html, /id="setupReviewHint"/);
  assert.match(html, /id="codexSetupPanel"/);
  assert.match(html, /name="codexAuthMethod" value="chatgpt"/);
  assert.match(html, /name="codexAuthMethod" value="api-key"/);
  assert.match(html, /name="codexAuthMethod" value="access-token"/);
  assert.match(html, /name="codexChatgptFlow" value="browser"/);
  assert.match(html, /name="codexChatgptFlow" value="device"/);
  assert.doesNotMatch(html, /name="codex(?:AuthMethod|ChatgptFlow)"[^>]+checked/);
  assert.match(html, /setupCleanupPanel[\s\S]+id="setupChecks"/);
  assert.match(html, /查看完整安装明细（可选）/);
  assert.match(styles, /\.setup-readiness/);
  assert.match(styles, /\.setup-plan-summary/);
  assert.match(styles, /\.setup-review-hint/);
  assert.match(styles, /\.codex-setup-panel/);
  assert.match(source, /api\.applySetupPlan\(\{ planDigest:/);
  assert.match(source, /setupApplyButton\.disabled = applying \|\| !els\.setupReviewed\.checked/);
  assert.doesNotMatch(source, /setupPlanOpened/);
  assert.match(source, /function syncSetupReview\(plan\)/);
  assert.match(source, /安装计划已更新，请重新确认上方写入目标与变更摘要/);
  assert.match(source, /Codex 用户级写入/);
  assert.match(source, /managed-stale \$\{Number\(counts\.managed_stale/);
  assert.match(source, /api\.recoverSetupUpgrade\(\{ assessmentDigest:/);
  assert.match(source, /backup-and-reinstall/);
  assert.match(source, /备份并按当前应用包重装/);
  assert.match(source, /建立新的受管理关系/);
  assert.match(source, /setupRecoveryGuide/);
  assert.match(source, /navigator\.clipboard\.writeText/);
  assert.match(source, /写入：未开始/);
  assert.match(source, /保留当前内容并退出/);
  assert.match(source, /item\.files\?\.length/);
  assert.match(source, /file\.status/);
  assert.match(source, /api\.planSetupRemoval/);
  assert.match(source, /confirmationDigest/);
  assert.match(source, /data-setup-cleanup-path/);
  assert.match(source, /function renderSetupCleanup\(\)/);
  assert.match(source, /setupCleanupSelectAll/);
  assert.match(source, /确认并清理所选/);
  assert.match(source, /filter\(\(item\) => selected\.has\(item\)\)/);
  assert.match(source, /SETUP_ACTION_FAILED/);
  assert.match(styles, /\.setup-cleanup-row/);
  assert.match(styles, /\.setup-cleanup-panel/);
  assert.match(styles, /\.toast[^}]+z-index: 1200/);
  assert.match(preload, /getSetupReadiness/);
  assert.match(preload, /removeManagedSetupPaths/);
  assert.match(preload, /recoverSetupUpgrade/);
  assert.match(preload, /checkSetupReadiness: \(input\) => ipcRenderer\.invoke\("arckit:setup-check", input\)/);
  assert.match(preload, /loginCodexWithSecret: \(input\) => ipcRenderer\.invoke\("arckit:codex-setup-login-secret", input\)/);
  assert.match(preload, /confirmCodexSetup: \(input\) => ipcRenderer\.invoke\("arckit:codex-setup-confirm", input\)/);
  assert.match(preload, /migrateCodexToStandalone: \(input\) => ipcRenderer\.invoke\("arckit:codex-setup-migrate", input\)/);
  assert.match(main, /setupReadinessPreflight: async \(projectRoot\)/);
  assert.match(main, /const codex = await codexSetupManager\.assertReady\(\)/);
  assert.equal((main.match(/const codex = await codexSetupManager\.assertReady\(\)/g) || []).length, 2);
  assert.match(main, /activeOwners: async \(\) => activeCodexOwnersFromStore/);
  assert.match(main, /recheckReadiness: \(\{ codexProbe \}\) => skillProvisioningManager\.check\(\{ quiet: true, codexProbeResult: codexProbe \}\)/);
  assert.match(main, /codexProbe: async \(\) => codexProbeFromSetupSnapshot\(codexSetupManager\.getSnapshot\(\)\)/);
  assert.match(main, /checkCoordinatedDesktopSetupReadiness\(\{[\s\S]+checkCodex: \(\) => codexSetupManager\.check\(\)[\s\S]+checkSkills: \(setupInput\) => skillProvisioningManager\.check\(setupInput\)/);
  assert.match(main, /skillProvisioningManager\.assertReady\([\s\S]+codexProbeFromSetupSnapshot\(codex\)/);
  assert.equal((main.match(/codexProbeFromSetupSnapshot\(codex\)/g) || []).length, 2);
  assert.doesNotMatch(main, /Promise\.all\(\[[\s\S]+skillProvisioningManager\.check[\s\S]+codexSetupManager\.check\(\)/);
  assert.match(main, /checkCoordinatedDesktopSetupReadiness\(\{/);
  assert.match(source, /api\.checkSetupReadiness\(projectId \? \{ projectId \} : undefined\)/);
  assert.match(source, /setupRetryButton\.addEventListener[\s\S]+await checkSetupReadinessForSelection\(\)/);
  assert.match(source, /await api\.bindAutomationProject\(remoteId, localProjectId\);[\s\S]+await checkSetupReadinessForSelection\(localProjectId\)/);
  assert.match(source, /productScopeSelect\.addEventListener\("change"[\s\S]+await checkSetupReadinessForSelection\(\)/);
  assert.match(source, /plan\.project_roots/);
  assert.match(source, /plan\.loader_targets/);
  assert.match(main, /runtimeCwd: app\.isPackaged \? process\.resourcesPath : runtimeRoot/);
  assert.match(main, /if \(readiness\.status !== "ready"\)/);
  assert.match(source, /els\.codexLoginButton\.disabled = operating \|\| !choiceComplete/);
  assert.match(source, /codex\.operation\?\.device_auth/);
  assert.match(source, /function renderCodexOwnerBlockers\(error\)/);
  assert.match(source, /CODEX_UPDATE_ACTIVE_TASKS/);
  assert.match(source, /codex-owner-blockers/);
  assert.match(source, /button\.disabled = operating \|\| ownerBlocked/);
  assert.match(source, /deviceAuth\.verification_url/);
  assert.match(source, /deviceAuth\.user_code/);
  assert.match(source, /const secret = els\.codexSecretInput\.value;[\s\S]+els\.codexSecretInput\.value = "";[\s\S]+loginCodexWithSecret/);
  assert.match(source, /api\.confirmCodexSetup\(\{ action, \.\.\.intent \}\)[\s\S]+confirmation_id/);
  assert.match(source, /runConfirmedCodexSetupAction\("login"[\s\S]+loginCodexWithSecret/);
  assert.match(source, /runConfirmedCodexSetupAction\("login"[\s\S]+loginCodex\(input\)/);
  assert.match(source, /operation\?\.cancellable !== true \|\| !operation\.id/);
  assert.match(source, /cancelCodexSetup\(\{ operation_id: operation\.id \}\)/);
  assert.match(source, /const cancellableOperation = codex\.operation\?\.cancellable === true && Boolean\(codex\.operation\?\.id\)/);
  assert.match(source, /codexCancelButton\.classList\.toggle\("hidden", !cancellableOperation\)/);
  assert.match(source, /codexCancelButton\.disabled = !cancellableOperation/);
  assert.match(source, /function codexOperationFeedback\(operation\)/);
  assert.match(source, /operation\?\.started_at/);
  assert.match(source, /rechecking-executable/);
  assert.match(source, /rechecking-version/);
  assert.match(source, /rechecking-login-status/);
  assert.match(source, /rechecking-readiness/);
  assert.match(source, /已等待 \$\{elapsedSeconds\} 秒/);
  assert.doesNotMatch(source, /state\.(?:codexSecret|apiKey|accessToken)\s*=/);
  assert.doesNotMatch(preload, /providerLoader|sourceRoot|execFile|writeFile/);
});

test("Desktop resolves project-scoped Setup checks from the trusted local workspace store", () => {
  const store = {
    projects: [
      { id: "LOCAL-B", path: "./fixtures/project-b" },
      { id: "LOCAL-A", path: "./fixtures/project-a" }
    ]
  };

  assert.equal(desktopSetupCheckInput(store), undefined);
  assert.deepEqual(desktopSetupCheckInput(store, { projectId: "LOCAL-A" }), {
    projectRoot: [
      resolve("./fixtures/project-a"),
      resolve("./fixtures/project-b")
    ].sort()
  });
  store.projects[1].path = "./fixtures/project-a-moved";
  assert.deepEqual(desktopSetupCheckInput(store, { projectId: "LOCAL-A" }).projectRoot, [
    resolve("./fixtures/project-a-moved"),
    resolve("./fixtures/project-b")
  ].sort());
  assert.throws(
    () => desktopSetupCheckInput(store, { projectId: "UNKNOWN" }),
    /Unknown local Product Workspace/
  );
});

test("Desktop Setup aggregate rejects stale divergent Codex evidence with an actionable error", () => {
  const combined = combineDesktopSetupReadiness(
    {
      status: "blocked",
      checks: [{ id: "codex", status: "failed", summary: "Codex unavailable" }],
      error: { code: "CODEX_UNAVAILABLE", stage: "codex", message: "Codex unavailable" }
    },
    {
      status: "ready",
      installation: { available: true, provenance: "standalone", version_summary: "codex fixture" },
      authentication: { authenticated: true },
      operation: null,
      error: null
    }
  );

  assert.equal(combined.status, "blocked");
  assert.equal(combined.can_continue, false);
  assert.equal(combined.error.code, "SETUP_EVIDENCE_STALE");
  assert.equal(combined.error.stage, "aggregate");
});

test("Desktop Setup IPC behavior preserves global checks and sends fresh associated roots for a selected project", async () => {
  let storeReads = 0;
  const checkedInputs = [];
  const store = { projects: [
    { id: "LOCAL-A", path: "./fixtures/project-a" },
    { id: "LOCAL-B", path: "./fixtures/project-b" }
  ] };
  const dependencies = {
    readDesktopStore: async () => { storeReads += 1; return store; },
    check: async (input) => { checkedInputs.push(input); return { status: "ready", input }; }
  };

  await checkDesktopSetupReadiness(dependencies);
  assert.equal(storeReads, 0);
  assert.equal(checkedInputs[0], undefined);

  const scoped = await checkDesktopSetupReadiness({ ...dependencies, input: { projectId: "LOCAL-A" } });
  assert.equal(storeReads, 1);
  assert.deepEqual(scoped.input.projectRoot, [resolve("./fixtures/project-a"), resolve("./fixtures/project-b")].sort());

  store.projects[0].path = "./fixtures/project-a-moved";
  const moved = await checkDesktopSetupReadiness({ ...dependencies, input: { projectId: "LOCAL-A" } });
  assert.equal(storeReads, 2);
  assert.deepEqual(moved.input.projectRoot, [resolve("./fixtures/project-a-moved"), resolve("./fixtures/project-b")].sort());
});

test("workbench transcript prioritizes Loop and Agent output while reducing tools to one-line summaries", () => {
  assert.equal(transcriptMessageType({ role: "assistant", actor: "agent", kind: "result" }), "agent");
  assert.equal(transcriptMessageType({ role: "assistant", actor: "agent", kind: "status" }), "loop");
  assert.equal(transcriptMessageType({ role: "tool", actor: "tool", kind: "command" }), "tool");
  assert.equal(transcriptMessageType({ role: "user" }), "user");
  assert.equal(transcriptMessageType({ role: "assistant", actor: "agent", kind: "reasoning" }), "reasoning");
  assert.equal(transcriptMessageType({ role: "assistant", actor: "agent", kind: "structured" }), "structured");

  assert.equal(summarizeToolActivity({ content: "sed -n '1,240p' runtime/arcorbit/desktop/renderer/renderer.js" }), "读取 runtime/arcorbit/desktop/renderer/renderer.js");
  assert.equal(summarizeToolActivity({ content: "npm test" }), "运行测试 · npm test");
  assert.equal(summarizeToolActivity({ content: "git diff --check" }), "查看工作区变更");
  assert.equal(summarizeToolActivity({ kind: "file_change" }), "更新文件");
  assert.equal(summarizeToolActivity({ kind: "file_change", content: "src/view.js" }), "更新 src/view.js");
  assert.equal(summarizeToolActivity({ kind: "web_search", content: "Codex app transcript" }), "搜索网络 · Codex app transcript");
  assert.equal(summarizeLoopStatus({ content: "Agent\n正在推进一个 Case gap。" }), "Agent 正在推进一个 Case gap。");
  assert.equal(statusGlyph("streaming"), "◌");
  assert.equal(statusGlyph("failed"), "×");
});

test("transcript hides empty reasoning and recognizes persisted schema JSON without rewriting it", () => {
  assert.equal(isTranscriptMessageVisible({ role: "assistant", kind: "reasoning", content: "" }), false);
  assert.equal(isTranscriptMessageVisible({ role: "assistant", kind: "reasoning", content: "Checked the state." }), true);
  const value = {
    schema_version: "arckit-agent-loop-result/v1",
    action: "case_transition",
    summary: "Advanced one gap.",
    case_transition: { case_id: "CASE-1", selected_gap: { id: "GAP-1" } },
    risks: ["Visual smoke test pending."],
    unknowns: []
  };
  const raw = JSON.stringify(value);
  const legacyMessage = { role: "assistant", actor: "agent", kind: "message", content: raw };
  assert.equal(transcriptMessageType(legacyMessage), "structured");
  assert.equal(isTranscriptMessageVisible(legacyMessage), true);
  const presentation = structuredResultPresentation(legacyMessage);
  assert.equal(presentation.title, "Agent Loop 结果");
  assert.equal(presentation.schema_version, value.schema_version);
  assert.equal(presentation.raw, raw);
  assert.deepEqual(presentation.fields, [
    { label: "Action", values: ["case_transition"] },
    { label: "Case", values: ["CASE-1"] },
    { label: "Gap", values: ["GAP-1"] },
    { label: "Risks", values: ["Visual smoke test pending."] }
  ]);
});

test("Automation transcript preserves Agent items across intervention, failed recovery Runs and historical review", () => {
  const taskId = "TASK-1";
  const message = (value) => ({ status: "completed", task_id: taskId, ...value });
  const run = (id, status, messages) => ({ id, task_id: taskId, status, activity: { messages } });
  const sessionMessages = [
    message({ id: "USER-1", role: "user", content: "Start the Automation task.", created_at: "2026-08-24T00:00:00Z" }),
    message({ id: "USER-2", role: "user", content: "Continue after the failed Run.", created_at: "2026-08-24T00:02:00Z" }),
    message({ id: "OTHER", role: "user", task_id: "TASK-2", content: "Another task.", created_at: "2026-08-24T00:00:00Z" })
  ];
  const runs = [
    run("RUN-FAILED", "failed", [
      message({ id: "agent:item:SHARED", role: "assistant", actor: "agent", kind: "message", item_id: "SHARED", content: "I found the failure boundary.", created_at: "2026-08-24T00:01:00Z" }),
      message({ id: "tool:item:CMD-1", role: "tool", actor: "tool", kind: "command", item_id: "CMD-1", content: "npm test", status: "failed", created_at: "2026-08-24T00:01:30Z" })
    ]),
    run("RUN-RECOVERED", "completed", [
      message({ id: "agent:item:SHARED", role: "assistant", actor: "agent", kind: "message", item_id: "SHARED", content: "The recovery Run keeps its own Agent item.", created_at: "2026-08-24T00:03:00Z" }),
      message({ id: "agent:item:RESULT", role: "assistant", actor: "agent", kind: "message", item_id: "RESULT", content: "The recovered execution is complete.", created_at: "2026-08-24T00:04:00Z" }),
      message({
        id: "agent:item:STRUCTURED", role: "assistant", actor: "agent", kind: "structured", item_id: "STRUCTURED", content: "", created_at: "2026-08-24T00:05:00Z",
        structured_data: { schema_version: "arckit-agent-loop-result/v2", value: { schema_version: "arckit-agent-loop-result/v2", action: "handoff", summary: "done" } }
      })
    ])
  ];

  const live = mergeAutomationTranscript({ sessionMessages, runs, taskId });
  const historical = mergeAutomationTranscript({ sessionMessages: structuredClone(sessionMessages), runs: structuredClone(runs), taskId });
  assert.deepEqual(historical, live);
  assert.deepEqual(live.map((item) => item.id), ["USER-1", "agent:item:SHARED", "tool:item:CMD-1", "USER-2", "agent:item:SHARED", "agent:item:RESULT", "agent:item:STRUCTURED"]);
  assert.deepEqual(live.filter((item) => item.item_id === "SHARED").map((item) => item.run_id), ["RUN-FAILED", "RUN-RECOVERED"]);
  assert.equal(live.some((item) => item.id === "OTHER"), false);
  assert.equal(live.at(-1).kind, "structured");

  const chatFixture = [
    { role: "user", kind: "text", content: "Start the Chat task." },
    { role: "assistant", kind: "text", content: "I found the boundary." },
    { role: "tool", kind: "tool", content: "npm test" },
    { role: "assistant", kind: "text", content: "The execution is complete." }
  ];
  const automationFixture = [
    live.find((item) => item.id === "USER-1"),
    live.find((item) => item.id === "agent:item:SHARED"),
    live.find((item) => item.id === "tool:item:CMD-1"),
    live.find((item) => item.id === "agent:item:RESULT")
  ];
  assert.deepEqual(
    automationFixture.map(transcriptMessageType),
    chatFixture.map(transcriptMessageType)
  );
  assert.equal(automationFixture.every(isConversationSurfaceMessageVisible), true);
  assert.equal(chatFixture.every(isConversationSurfaceMessageVisible), true);
});

test("Round Closeout v2 presents trusted invariant judgments", () => {
  const value = {
    schema_version: "arckit-round-closeout/v2",
    status: "accepted",
    case_id: "CASE-1",
    round: 2,
    selected_gap: { id: "GAP-TECH" },
    resulting_state: { project_revision: 4 },
    invariant_assessment: {
      project_revision: 3,
      judgments: [
        { invariant_ref: "technical-decisions-remain-explainable", disposition: "threatened" },
        { invariant_ref: "accepted-facts-are-realized", disposition: "upheld" }
      ]
    }
  };
  const presentation = structuredResultPresentation({ role: "system", kind: "structured", structured_data: { value } });
  assert.equal(presentation.title, "Round Closeout");
  assert.deepEqual(presentation.fields.at(-1), {
    label: "Invariant judgments",
    values: ["technical-decisions-remain-explainable: threatened", "accepted-facts-are-realized: upheld"]
  });
});

test("desktop main and preload expose bounded automation IPC without a generic network bridge", async () => {
  const [main, codexSetupIpc, preload, source, html] = await Promise.all([
    readFile(desktopMainPath, "utf8"),
    readFile(codexSetupIpcPath, "utf8"),
    readFile(desktopPreloadPath, "utf8"),
    readFile(rendererPath, "utf8"),
    readFile(rendererHtmlPath, "utf8")
  ]);

  for (const channel of [
    "arckit:setup-status",
    "arckit:setup-check",
    "arckit:setup-apply",
    "arckit:setup-recover-upgrade",
    "arckit:setup-removal-plan",
    "arckit:setup-remove",
    "arckit:codex-setup-confirm",
    "arckit:codex-setup-install",
    "arckit:codex-setup-update",
    "arckit:codex-setup-migrate",
    "arckit:codex-setup-login",
    "arckit:codex-setup-login-secret",
    "arckit:codex-setup-cancel",
    "arckit:codex-setup-logout",
    "arckit:codex-setup-recheck",
    "arckit:setup-continue",
    "arckit:chat-snapshot",
    "arckit:chat-create",
    "arckit:chat-select",
    "arckit:chat-rename",
    "arckit:chat-delete",
    "arckit:chat-send",
    "arckit:chat-interrupt",
    "arckit:chat-approval-decision",
    "arckit:automation-snapshot",
    "arckit:automation-sync",
    "arckit:automation-enabled",
    "arckit:automation-pause",
    "arckit:automation-bind-project",
    "arckit:automation-project-participation",
    "arckit:automation-task-state",
    "arckit:automation-intervene",
    "arckit:automation-acceptance-feedback",
    "arckit:automation-stop",
    "arckit:automation-handoff-cli",
    "arckit:automation-reopen-cli",
    "arckit:automation-resume-runtime",
    "arckit:automation-recovery",
    "arckit:auth-status",
    "arckit:auth-send-verification",
    "arckit:auth-login",
    "arckit:auth-logout"
  ]) {
    assert.match(`${main}\n${codexSetupIpc}`, new RegExp(channel.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")));
  }
  assert.match(preload, /automationSnapshot: \(filter\)/);
  assert.match(preload, /onAutomationEvent: \(listener\)/);
  assert.match(preload, /chatSnapshot: \(input\)/);
  assert.match(preload, /selectChat: \(input\)/);
  assert.match(preload, /sendChatMessage: \(input\)/);
  assert.match(preload, /interruptChat: \(input\)/);
  assert.match(preload, /decideChatApproval: \(input\)/);
  assert.match(preload, /onChatEvent: \(listener\)/);
  assert.doesNotMatch(preload, /require\(["']\.\//, "sandboxed preload must remain self-contained");
  assert.match(preload, /sendAuthVerification: \(input\)/);
  assert.match(preload, /loginWithCode: \(input\)/);
  assert.match(preload, /logoutAuth: \(input\)/);
  assert.match(preload, /handoffAutomationToCli/);
  assert.match(preload, /resumeAutomationRuntime/);
  assert.match(source, /切换到 Codex CLI/);
  assert.match(source, /Codex CLI 接管/);
  assert.match(source, /Arckit skills <strong>\$\{availability\.arckit_total\}/);
  assert.match(source, /user-ambient \$\{availability\.user_ambient\}/);
  assert.match(source, /shared assets \$\{availability\.shared_assets\}/);
  assert.match(source, /plan\.shared_assets/);
  assert.match(source, /ArcForge loader \$\{availability\.arcforge_loader_targets\}/);
  assert.match(source, /补充说明并继续/);
  assert.match(source, /data-recovery-feedback/);
  assert.match(source, /openWorkbench\("review"\)/);
  assert.match(html, /id="automationRefreshButton"[^>]*>立即同步<\/button>/);
  assert.match(source, /automationRefreshButton\.addEventListener\("click", \(\) => runAction\(syncAutomationNow\)\)/);
  assert.match(main, /syncTimer = setInterval[\s\S]+15 \* 60_000/);
  assert.doesNotMatch(main, /fallbackSyncTimer/);
  assert.doesNotMatch(preload, /fetch|httpRequest|requestUrl/);
  assert.doesNotMatch(preload, /startRun:|controlRun:|gateRun:|writeLedger:/);
  assert.doesNotMatch(preload, /addMessage:|createSession:|deleteSession:|addProject:/);
  assert.doesNotMatch(preload, /threadId:|projectRoot:|cwd:|codexMethod:|shellCommand:/);
  assert.doesNotMatch(main, /arckit:start-run|arckit:control-run|arckit:gate-run|arckit:write-ledger/);
  assert.doesNotMatch(source, /\bfetch\s*\(/);
});

test("desktop main and preload expose bounded platform composition IPC without credentials or generic requests", async () => {
  const [main, preload] = await Promise.all([
    readFile(desktopMainPath, "utf8"),
    readFile(desktopPreloadPath, "utf8")
  ]);
  for (const channel of [
    "arckit:platform-snapshot",
    "arckit:platform-work-query",
    "arckit:platform-workset-create",
    "arckit:platform-workset-update",
    "arckit:platform-workset-delete",
    "arckit:platform-workset-active",
    "arckit:platform-workspace-preference"
  ]) {
    const pattern = new RegExp(channel.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"));
    assert.match(main, pattern);
    assert.match(preload, pattern);
  }
  assert.match(main, /createPlatformCoordinator/);
  assert.match(preload, /platformSnapshot: \(input\)/);
  assert.match(preload, /platformWorkQuery: \(input\)/);
  assert.match(preload, /createWorkset: \(input\)/);
  assert.match(preload, /setActiveWorkset: \(worksetId\)/);
  assert.doesNotMatch(preload, /access_token|refresh_token|apiKey|sessionToken|genericRequest/);
});

test("ArcOrbit exposes one authenticated in-product feedback entry without user configuration", async () => {
  const [main, preload, source, html] = await Promise.all([
    readFile(desktopMainPath, "utf8"),
    readFile(desktopPreloadPath, "utf8"),
    readFile(rendererPath, "utf8"),
    readFile(rendererHtmlPath, "utf8")
  ]);
  assert.match(html, /id="productFeedbackButton"/);
  assert.match(html, /id="productFeedbackUnreadBadge"/);
  assert.doesNotMatch(html, /productFeedbackSettings|productFeedbackProjectId|productFeedbackApiKey/);
  assert.match(source, /api\.openProductFeedback\("submit"\)/);
  assert.match(source, /api\.refreshProductFeedbackUnread\(\)/);
  assert.match(source, /api\.onProductFeedbackUnread/);
  assert.match(source, /登录 Workshop 后即可使用 ArcOrbit 产品反馈/);
  assert.doesNotMatch(source, /saveProductFeedbackConfig|clearProductFeedbackConfig|留空保留现有 Key/);
  for (const channel of [
    "arckit:product-feedback-status",
    "arckit:product-feedback-open",
    "arckit:product-feedback-refresh-unread"
  ]) {
    const pattern = new RegExp(channel.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"));
    assert.match(main, pattern);
    assert.match(preload, pattern);
  }
  assert.doesNotMatch(`${main}\n${preload}`, /product-feedback-save|product-feedback-clear|product-feedback-console/);
  assert.doesNotMatch(preload, /apiKey|customUserId/);
  assert.doesNotMatch(preload, /fetch|httpRequest|executeJavaScript|loadURL/);
});

test("task source settings keep the access token write-only in Renderer", async () => {
  const [source, html] = await Promise.all([
    readFile(rendererPath, "utf8"),
    readFile(rendererHtmlPath, "utf8")
  ]);

  assert.match(html, /id="taskSourceToken" type="password"/);
  assert.match(source, /access_token_configured/);
  assert.match(source, /els\.taskSourceToken\.value = ""/);
  assert.doesNotMatch(source, /task_source\.access_token\s*\)/);
  assert.doesNotMatch(source, /refresh_token/);
});

test("desktop account panel supports bounded verification login, expiry, and confirmed logout", async () => {
  const [source, html, styles] = await Promise.all([
    readFile(rendererPath, "utf8"),
    readFile(rendererHtmlPath, "utf8"),
    readFile(rendererStylesPath, "utf8")
  ]);

  assert.match(html, /<body class="auth-pending">/);
  assert.match(html, /id="authBootScreen"/);
  assert.match(html, /正在恢复 Workshop 会话/);
  assert.doesNotMatch(html, /id="settingsPanel"[^>]+role="dialog"/);
  assert.match(html, /id="authLoginPanel"/);
  assert.match(html, /data-auth-type="email"/);
  assert.match(html, /data-auth-type="sms"/);
  assert.match(html, /id="sendVerificationButton"/);
  assert.match(html, /id="loginButton"/);
  assert.match(html, /id="logoutButton"/);
  assert.match(source, /api\.sendAuthVerification/);
  assert.match(source, /api\.loginWithCode/);
  assert.match(source, /requires_confirmation/);
  assert.match(source, /api\.logoutAuth\(\{ confirm_active_task: true \}\)/);
  assert.match(source, /els\.automationEnabled\.disabled = !state\.authentication\.authenticated/);
  assert.match(source, /authBusy: \{ verification: false, login: false, logout: false \}/);
  assert.match(source, /els\.sendVerificationButton\.disabled = state\.authBusy\.verification/);
  assert.match(source, /els\.loginButton\.disabled = state\.authBusy\.login/);
  assert.match(source, /els\.logoutButton\.disabled = state\.authBusy\.logout/);
  assert.match(source, /state\.authentication\.status === "logged_out"/);
  assert.match(source, /if \(state\.loginGate && !force\) return/);
  assert.match(source, /showLoginGate\(\)/);
  assert.match(source, /closeSettings\(\{ force: true \}\)/);
  assert.match(source, /els\.settingsPanel\.removeAttribute\("role"\)/);
  assert.match(source, /els\.settingsPanel\.setAttribute\("role", "dialog"\)/);
  assert.match(styles, /\.modal-overlay\.login-gate/);
  assert.match(styles, /\.auth-pending \.auth-boot-screen \{ display: grid; \}/);
  assert.match(styles, /\.login-gate #closeSettingsButton \{ display: none; \}/);
  assert.match(styles, /\.auth-boot-screen[^}]+var\(--violet-100\)[^}]+var\(--ink-75\)/);
  assert.match(styles, /\.modal-overlay\.login-gate[^}]+var\(--violet-100\)[^}]+var\(--ink-75\)/);
  assert.doesNotMatch(styles, /\.auth-boot-screen[^}]+var\(--ink-950\)/);
  assert.doesNotMatch(styles, /\.modal-overlay\.login-gate[^}]+var\(--ink-950\)/);
});
