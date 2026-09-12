import assert from "node:assert/strict";
import test from "node:test";
import { createChatStateCoordinator } from "../desktop/renderer/chat-state-coordinator.mjs";

test("Chat state keeps Composer configuration with a new draft, workspace changes and send", async () => {
  const creates = [];
  const sends = [];
  let request = 0;
  const snapshotFor = (payload = {}) => ({
    projects: [{ id: "P-1", name: "One" }, { id: "P-2", name: "Two" }],
    sessions: [],
    selected_session_id: "",
    messages: [],
    pending_approvals: [],
    draft: {
      project_id: payload.project_id || "P-1",
      text: payload.text || "",
      model: payload.model || "gpt-6-astra",
      reasoning_effort: payload.reasoning_effort || "high"
    }
  });
  const api = {
    async createChat(payload) { creates.push(payload); return snapshotFor(payload); },
    async sendChatMessage(payload) { sends.push(payload); return snapshotFor(payload); },
    async chatSnapshot() { return snapshotFor(); },
    async selectChat() { return snapshotFor(); },
    async deleteChat() { return snapshotFor(); },
    async renameChat() { return snapshotFor(); },
    async interruptChat() { return snapshotFor(); },
    async decideChatApproval() { return snapshotFor(); }
  };
  const coordinator = createChatStateCoordinator({
    api,
    createRequestId: () => `REQUEST-${++request}`,
    setTimer: () => 1,
    clearTimer: () => {}
  });

  await coordinator.initialize(snapshotFor());
  await coordinator.newDraft("P-1", { model: "chat-model", reasoning_effort: "max" });
  assert.deepEqual(creates.at(-1), {
    session_id: "",
    project_id: "P-1",
    text: "",
    model: "chat-model",
    reasoning_effort: "max"
  });

  coordinator.setDraft("Keep this draft");
  await coordinator.changeDraftWorkspace("P-2");
  assert.deepEqual(creates.at(-1), {
    session_id: "",
    project_id: "P-2",
    text: "Keep this draft",
    model: "chat-model",
    reasoning_effort: "max"
  });

  await coordinator.send();
  assert.deepEqual(sends.at(-1), {
    session_id: "",
    project_id: "P-2",
    text: "Keep this draft",
    client_request_id: "REQUEST-1",
    model: "chat-model",
    reasoning_effort: "max"
  });
});
