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
  const activityAt = Date.now();
  const store = normalizeStore({
    version: 4,
    settings: {
      task_source: {
        enabled: true,
        base_url: "https://workshop.example/",
        auth_mode: "nebula",
        access_token: "top-secret",
        refresh_token: "refresh-secret",
        last_login_activity_at: activityAt,
        username: "glare@example.com"
      }
    },
    automation: {
      snapshot: {
        source_status: "degraded",
        errors: [{ code: "request_failed", status: 500, message: "Project tasks unavailable", project_id: "12" }]
      },
      recovery_items: [{ id: "RECOVERY-1", responsibility: "human" }]
    }
  });

  assert.equal(store.version, 12);
  assert.deepEqual(store.automation.realtime, { status: "idle", mode: "unknown", last_refreshed_at: "", projects: {} });
  assert.equal(store.automation.snapshot.source_status, "degraded");
  assert.deepEqual(store.automation.project_bindings, {});
  assert.equal(store.automation.recovery_items[0].responsibility, "operator");
  const visible = publicSettings(store.settings);
  assert.equal(visible.task_source.access_token, "");
  assert.equal(visible.task_source.access_token_configured, true);
  assert.equal(visible.task_source.refresh_session_configured, true);
  assert.equal(store.settings.task_source.last_login_activity_at, activityAt);
  assert.equal("last_login_activity_at" in visible.task_source, false);
  assert.equal("refresh_token" in visible.task_source, false);
  assert.equal(visible.task_source.authentication.status, "authenticated");
  assert.equal(visible.task_source.authentication.masked_identity, "gl•••@example.com");
  assert.equal(visible.task_source.username, "");
  assert.doesNotMatch(JSON.stringify(visible), /top-secret|refresh-secret|glare@example\.com/);
  assert.equal(visible.task_source.base_url, "https://workshop.example");
  assert.deepEqual(store.automation.snapshot.errors[0], {
    code: "request_failed",
    status: 500,
    message: "Project tasks unavailable",
    project_id: "12"
  });
});

test("desktop store bounds historical task labels without changing task content", () => {
  const content = `  keep\n${"👩‍💻".repeat(65)}  `;
  const legacyTitle = `legacy\n${"👩‍💻".repeat(65)}`;
  const store = normalizeStore({
    sessions: {
      local: [{ id: "SESSION-T", project_id: "local", kind: "automation-task", title: `待办 · ${legacyTitle}` }]
    },
    automation: {
      snapshot: { tasks: [{ id: "t", project_id: "p", content, title: legacyTitle }] },
      active_task: { task_id: "t", task_title: legacyTitle },
      acceptance_feedback_items: [{ feedback_id: "AF-1", source_task_id: "t", source_task_title: legacyTitle }],
      recent_completions: [{ task_id: "t", title: legacyTitle }]
    }
  });

  assert.equal(store.automation.snapshot.tasks[0].content, content);
  assert.equal(store.automation.snapshot.tasks[0].title.endsWith("…"), true);
  assert.equal(store.automation.active_task.task_title.endsWith("…"), true);
  assert.equal(store.automation.acceptance_feedback_items[0].source_task_title.endsWith("…"), true);
  assert.equal(store.automation.recent_completions[0].title.endsWith("…"), true);
  assert.equal(store.sessions.local[0].title.startsWith("待办 · legacy "), true);
  assert.equal(store.sessions.local[0].title.endsWith("…"), true);
});

test("desktop store preserves realtime diagnostics and ignores idle subscriptions in aggregate health", () => {
  const store = normalizeStore({
    automation: {
      realtime: {
        projects: {
          old: { state: "idle", cursor: 7 },
          current: {
            state: "connected",
            mode: "legacy",
            cursor: 42,
            last_event_at: "2026-08-22T00:00:00.000Z",
            last_refreshed_at: "2026-08-22T00:00:01.000Z"
          }
        }
      }
    }
  });

  assert.equal(store.automation.realtime.status, "connected");
  assert.equal(store.automation.realtime.mode, "legacy");
  assert.equal(store.automation.realtime.last_refreshed_at, "2026-08-22T00:00:01.000Z");
  assert.equal(store.automation.realtime.projects.current.cursor, 42);
  assert.equal(store.automation.realtime.projects.current.last_event_at, "2026-08-22T00:00:00.000Z");
  assert.equal(store.automation.realtime.projects.current.last_refreshed_at, "2026-08-22T00:00:01.000Z");
});

test("desktop store migrates v9 bindings into a local workset without changing automation participation", () => {
  const store = normalizeStore({
    version: 9,
    automation: {
      project_bindings: { "12": "LOCAL-12", "3": "LOCAL-3" },
      project_participation: { "12": true, "3": false }
    }
  });

  assert.equal(store.version, 12);
  assert.equal(store.platform.active_workset_id, "WORKSET-DEFAULT");
  assert.deepEqual(store.platform.worksets[0].project_ids, ["3", "12"]);
  assert.deepEqual(store.automation.project_participation, { "12": true, "3": false });

  const normalizedAgain = normalizeStore(store);
  assert.deepEqual(normalizedAgain.platform, store.platform);
  assert.deepEqual(normalizedAgain.automation.project_participation, store.automation.project_participation);
});

test("desktop store migrates a missing Chat selection without replacing an explicit new-chat selection", () => {
  const sessions = {
    "PROJECT-1": [
      {
        id: "CHAT-A", project_id: "PROJECT-1", kind: "chat", status: "completed",
        created_at: "2026-08-23T00:00:00Z", updated_at: "2026-08-23T00:00:01Z"
      },
      {
        id: "CHAT-B", project_id: "PROJECT-1", kind: "chat", status: "completed",
        created_at: "2026-08-23T00:00:02Z", updated_at: "2026-08-23T00:00:03Z"
      }
    ]
  };

  const migrated = normalizeStore({ version: 11, sessions });
  const explicitNewChat = normalizeStore({ version: 12, sessions, chat: { selected_session_id: "" } });

  assert.equal(migrated.chat.selected_session_id, "CHAT-B");
  assert.equal(explicitNewChat.chat.selected_session_id, "");
});

test("desktop store preserves acceptance feedback and requeues an orphaned running item", () => {
  const store = normalizeStore({
    automation: {
      acceptance_feedback_items: [{
        feedback_id: "AF-1",
        idempotency_key: "KEY-1",
        original_feedback: "结果仍不正确",
        status: "running",
        progress: "Agent 正在处理",
        source_project_id: "p",
        source_task_id: "t",
        source_task_state: "completed",
        local_project_id: "local",
        session_id: "SESSION-T",
        thread_id: "THREAD-T",
        created_at: "2026-08-13T00:00:00Z"
      }]
    }
  });

  assert.equal(store.automation.acceptance_feedback_items.length, 1);
  assert.equal(store.automation.acceptance_feedback_items[0].status, "queued");
  assert.equal(store.automation.acceptance_feedback_items[0].progress, "Runtime 重启后已重新排队");
  assert.equal(store.automation.acceptance_feedback_items[0].source_task_state, "completed");
});

test("desktop store retains every historical reference needed by acceptance review", () => {
  const recentCompletions = Array.from({ length: 520 }, (_, index) => ({
    task_id: `TASK-${index}`,
    run_id: `RUN-${index}`,
    case_id: `CASE-20260813-${String((index % 999) + 1).padStart(3, "0")}`,
    local_project_id: "local",
    session_id: `SESSION-${index}`,
    thread_id: `THREAD-${index}`
  }));
  const acceptanceFeedbackItems = recentCompletions.map((item, index) => ({
    feedback_id: `AF-${index}`,
    idempotency_key: `KEY-${index}`,
    original_feedback: `issue ${index}`,
    status: "resolved",
    source_task_id: item.task_id
  }));

  const store = normalizeStore({ automation: { recent_completions: recentCompletions, acceptance_feedback_items: acceptanceFeedbackItems } });

  assert.equal(store.automation.recent_completions.length, 520);
  assert.equal(store.automation.acceptance_feedback_items.length, 520);
  assert.equal(store.automation.recent_completions.at(-1).task_id, "TASK-519");
});
