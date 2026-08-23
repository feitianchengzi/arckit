import assert from "node:assert/strict";
import test from "node:test";

import {
  CHAT_SESSION_PREVIEW_LIMIT,
  chatSessionVisibility,
  groupChatSessions
} from "../desktop/renderer/chat-session-groups.mjs";

function session(id, projectId, updatedAt) {
  return { id, project_id: projectId, updated_at: updatedAt, title: id, status: "completed" };
}

test("Chat groups and sorts sessions without a global project filter", () => {
  const groups = groupChatSessions({
    projects: [
      { id: "PROJECT-A", name: "Alpha" },
      { id: "PROJECT-B", name: "Beta" },
      { id: "PROJECT-EMPTY", name: "No history" }
    ],
    sessions: [
      session("A-OLD", "PROJECT-A", "2026-08-20T00:00:00.000Z"),
      session("B-NEW", "PROJECT-B", "2026-08-23T00:00:00.000Z"),
      session("A-NEW", "PROJECT-A", "2026-08-22T00:00:00.000Z"),
      session("ORPHAN", "PROJECT-REMOVED", "2026-08-21T00:00:00.000Z")
    ]
  });

  assert.deepEqual(groups.map((group) => group.project_id), ["PROJECT-B", "PROJECT-A", "PROJECT-REMOVED"]);
  assert.deepEqual(groups[1].sessions.map((item) => item.id), ["A-NEW", "A-OLD"]);
  assert.equal(groups[2].available, false);
  assert.equal(groups.some((group) => group.project_id === "PROJECT-EMPTY"), false);
});

test("Chat shows ten sessions per project and expands only the requested project history", () => {
  const [group] = groupChatSessions({
    projects: [{ id: "PROJECT-A", name: "Alpha" }],
    sessions: Array.from({ length: 12 }, (_, index) => session(
      `CHAT-${String(index + 1).padStart(2, "0")}`,
      "PROJECT-A",
      `2026-08-${String(index + 1).padStart(2, "0")}T00:00:00.000Z`
    ))
  });

  const preview = chatSessionVisibility(group);
  assert.equal(CHAT_SESSION_PREVIEW_LIMIT, 10);
  assert.equal(preview.sessions.length, 10);
  assert.equal(preview.hidden_count, 2);
  assert.equal(preview.expanded, false);

  const expanded = chatSessionVisibility(group, { expanded: true });
  assert.equal(expanded.sessions.length, 12);
  assert.equal(expanded.expanded, true);

  const selectedHistory = chatSessionVisibility(group, { selectedSessionId: "CHAT-01" });
  assert.equal(selectedHistory.sessions.length, 12);
  assert.equal(selectedHistory.selected_requires_history, true);
});
