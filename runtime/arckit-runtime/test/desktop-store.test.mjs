import assert from "node:assert/strict";
import { mkdtemp, readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";
import { createDesktopStore, deleteProjectSession, normalizeStore, publicSettings } from "../src/desktop/desktop-store.mjs";

test("desktop store serializes concurrent reads and updates", async () => {
  const root = await mkdtemp(join(tmpdir(), "arckit-store-"));
  try {
    const storePath = join(root, "desktop-store.json");
    const store = createDesktopStore({
      dataDir: root,
      runsDir: join(root, "runs"),
      storePath
    });
    await store.updateStore((draft) => {
      draft.projects.push({
        id: "PROJECT-1",
        name: "Project",
        path: root,
        added_at: "2026-07-11T00:00:00.000Z"
      });
      return draft;
    });

    await Promise.all(Array.from({ length: 40 }, (_, index) => {
      if (index % 2 === 0) {
        return store.readStore();
      }
      return store.updateStore((draft) => {
        draft.runs.unshift({
          id: `RUN-${index}`,
          project_id: "PROJECT-1",
          session_id: "SESSION-1",
          status: "completed",
          started_at: `2026-07-11T00:00:${String(index).padStart(2, "0")}.000Z`,
          activity: {
            current_step: "large activity should not be stored in desktop-store.json"
          }
        });
        return draft;
      });
    }));

    const finalStore = await store.readStore();
    const finalStoreText = await readFile(storePath, "utf8");
    assert.equal(finalStore.runs.length, 20);
    assert.equal(finalStore.runs.some((run) => "activity" in run), false);
    assert.doesNotThrow(() => JSON.parse(finalStoreText));
    assert.equal(finalStoreText.includes("large activity should not be stored"), false);
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

test("deleteProjectSession removes only the selected chat and its messages", () => {
  const store = {
    projects: [{ id: "PROJECT-1" }],
    sessions: {
      "PROJECT-1": [
        { id: "SESSION-1", project_id: "PROJECT-1" },
        { id: "SESSION-2", project_id: "PROJECT-1" }
      ]
    },
    messages: {
      "SESSION-1": [{ id: "MESSAGE-1" }],
      "SESSION-2": [{ id: "MESSAGE-2" }]
    }
  };

  const deleted = deleteProjectSession(store, "PROJECT-1", "SESSION-1");

  assert.equal(deleted.id, "SESSION-1");
  assert.deepEqual(store.sessions["PROJECT-1"].map((session) => session.id), ["SESSION-2"]);
  assert.equal("SESSION-1" in store.messages, false);
  assert.deepEqual(store.messages["SESSION-2"], [{ id: "MESSAGE-2" }]);
  assert.equal(deleteProjectSession(store, "PROJECT-1", "UNKNOWN"), null);
});

test("desktop store upgrades automation state and keeps task source tokens out of public settings", () => {
  const store = normalizeStore({
    version: 4,
    settings: {
      task_source: {
        enabled: true,
        base_url: "https://workshop.example/",
        access_token: "top-secret"
      }
    },
    automation: {
      snapshot: {
        source_status: "degraded",
        errors: [{ code: "request_failed", status: 500, message: "Project tasks unavailable", project_id: "12" }]
      }
    }
  });

  assert.equal(store.version, 5);
  assert.equal(store.automation.snapshot.source_status, "degraded");
  assert.deepEqual(store.automation.project_bindings, {});
  const visible = publicSettings(store.settings);
  assert.equal(visible.task_source.access_token, "");
  assert.equal(visible.task_source.access_token_configured, true);
  assert.equal(visible.task_source.base_url, "https://workshop.example");
  assert.deepEqual(store.automation.snapshot.errors[0], {
    code: "request_failed",
    status: 500,
    message: "Project tasks unavailable",
    project_id: "12"
  });
});
