// Read-only product diagnosis: synthetic events, isolated temporary Desktop Store.
// Prints observations without asserting that the current defect must remain.
import assert from "node:assert/strict";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { createDesktopStore } from "../../../runtime/arcorbit/src/desktop/desktop-store.mjs";
import { createChatCoordinator } from "../../../runtime/arcorbit/src/chat-coordinator.mjs";
import { renderConversationSurfaceMessage } from "../../../runtime/arcorbit/desktop/renderer/conversation-surface.mjs";

const root = await mkdtemp(join(tmpdir(), "chat-file-display-diagnosis-"));
const storeOptions = { dataDir: root, runsDir: join(root, "runs"), storePath: join(root, "desktop-store.json") };
const store = createDesktopStore(storeOptions);
await store.updateStore((draft) => {
  draft.projects.push({ id: "PROJECT-DIAG", name: "Diagnosis", path: root, added_at: new Date().toISOString() });
  return draft;
});
const optionsFor = (source) => ({
  runManager: {
    readDesktopStore: source.readStore,
    updateDesktopStore: source.updateStore,
    getSettings: async () => ({ codex_proxy: { enabled: false, url: "" } })
  },
  getCodexExecutable: () => ({ command: "unused-synthetic-adapter", pathEntries: [] }),
  setupReadinessPreflight: async () => {}
});
const paths = ["src/view.js", "src/styles.css"];
const item = { id: "EDIT-DIAG", type: "fileChange", status: "completed", changes: paths.map((path) => ({ path, kind: { type: "update" }, diff: "SYNTHETIC_DIFF_BODY" })) };
let release;
let reached;
const gate = new Promise((resolve) => { release = resolve; });
const started = new Promise((resolve) => { reached = resolve; });
let reopened;
const coordinator = createChatCoordinator({
  ...optionsFor(store),
  createAdapter: () => ({
    async *runTurn({ options }) {
      await options.onThreadBound({ threadId: "THREAD-DIAG", resumed: false });
      yield { type: "codex.turn.started", turn_id: "TURN-DIAG" };
      yield { type: "codex.item.started", params: { item: { ...item, status: "inProgress" } } };
      reached();
      await gate;
      yield { type: "codex.item.completed", params: { item } };
      yield { type: "codex.turn.completed", turn_id: "TURN-DIAG", turn: { status: "completed" } };
    },
    async interrupt() { release(); },
    close() {}
  })
});
const observations = { input_paths: paths };
function observe(messages) {
  const tools = messages.filter((message) => message.role === "tool");
  assert.equal(tools.length, 1, "started/completed must retain one tool message");
  const message = tools[0];
  const html = renderConversationSurfaceMessage(message);
  return {
    id: message.id, kind: message.kind, content: message.content, status: message.status,
    paths_in_content: paths.map((path) => message.content.includes(path)),
    paths_in_html: paths.map((path) => html.includes(path)),
    diff_in_html: html.includes("SYNTHETIC_DIFF_BODY")
  };
}
try {
  const sent = await coordinator.send({ project_id: "PROJECT-DIAG", client_request_id: "REQUEST-DIAG", text: "Synthetic file-change diagnosis" });
  await started;
  const sessionId = sent.selected_session_id;
  observations.live = observe((await coordinator.getSnapshot({ session_id: sessionId })).messages);
  release();
  const deadline = Date.now() + 5_000;
  while (true) {
    const snapshot = await coordinator.getSnapshot({ session_id: sessionId });
    if (snapshot.sessions.find((session) => session.id === sessionId)?.status === "completed") {
      observations.completed = observe(snapshot.messages);
      break;
    }
    assert.ok(Date.now() < deadline, "synthetic turn timed out");
    await new Promise((resolve) => setTimeout(resolve, 5));
  }
  observations.persisted = observe((await store.readStore()).messages[sessionId]);
  await coordinator.close();
  reopened = createChatCoordinator(optionsFor(createDesktopStore(storeOptions)));
  observations.reopened = observe((await reopened.getSnapshot({ session_id: sessionId })).messages);
  assert.equal(observations.live.id, observations.completed.id);
  assert.equal(observations.completed.id, observations.reopened.id);
  console.log(JSON.stringify(observations, null, 2));
} finally {
  release();
  await coordinator.close();
  await reopened?.close();
  await rm(root, { recursive: true, force: true });
}
