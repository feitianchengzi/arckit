import assert from "node:assert/strict";
import { mkdtemp, readFile, readdir, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";
import { createDesktopStore, deleteProjectSession, DESKTOP_STORE_VERSION, normalizeStore, publicSettings } from "../src/desktop/desktop-store.mjs";

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

test("desktop state kernel reads durable state once and publishes monotonic state views", async () => {
  const root = await mkdtemp(join(tmpdir(), "arckit-state-kernel-"));
  const storePath = join(root, "desktop-store.json");
  let diskReads = 0;
  let diskWrites = 0;
  try {
    const store = createDesktopStore({
      dataDir: root,
      runsDir: join(root, "runs"),
      storePath,
      io: {
        async readJson(path) {
          diskReads += 1;
          return JSON.parse(await readFile(path, "utf8"));
        },
        async writeJson(path, value) {
          diskWrites += 1;
          await writeFile(path, `${JSON.stringify(value)}\n`, "utf8");
        }
      }
    });

    const first = await store.captureStateView();
    const second = await store.captureStateView();
    const compatibleCopy = await store.readStore();
    compatibleCopy.projects.push({ id: "MUST-NOT-LEAK" });

    assert.equal(diskReads, 3);
    assert.equal(diskWrites, 3);
    assert.equal(first.revision, 1);
    assert.equal(second.revision, 1);
    assert.equal(first.state, second.state);
    assert.equal(first.state.projects.length, 0);

    await store.updateStore((draft) => {
      draft.projects.push({ id: "PROJECT-1", name: "Project", path: root });
      return draft;
    });
    const updated = await store.captureStateView();

    assert.equal(diskReads, 3);
    assert.equal(diskWrites, 5);
    assert.equal(updated.revision, 2);
    assert.notEqual(updated.state, first.state);
    assert.deepEqual(updated.state.projects.map((project) => project.id), ["PROJECT-1"]);
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

test("desktop store migrates messages and Task Projection behind an atomic partition manifest", async () => {
  const root = await mkdtemp(join(tmpdir(), "arckit-store-partitions-"));
  const storePath = join(root, "desktop-store.json");
  try {
    await writeFile(storePath, `${JSON.stringify({
      version: 16,
      projects: [{ id: "PROJECT-1", name: "Project", path: root }],
      runs: [],
      sessions: { "PROJECT-1": [{ id: "SESSION-1", project_id: "PROJECT-1", kind: "chat" }] },
      messages: { "SESSION-1": [{ id: "MESSAGE-1", session_id: "SESSION-1", content: "preserved" }] },
      settings: {},
      automation: {},
      platform: {
        task_sync: {
          project_catalog: [{ id: "REMOTE-1" }],
          projects: {
            "REMOTE-1": {
              project: { id: "REMOTE-1" },
              tasks: [{ id: "TASK-1", project_id: "REMOTE-1", state: "pending" }],
              tags: [],
              trusted: true,
              revision: 1
            }
          },
          source_status: "healthy"
        }
      },
      chat: { selected_session_id: "SESSION-1" }
    })}\n`, "utf8");
    const store = createDesktopStore({ dataDir: root, runsDir: join(root, "runs"), storePath });

    const controlView = await store.captureStateView();
    const messageView = await store.readStoreWithMessages();
    const control = JSON.parse(await readFile(storePath, "utf8"));

    assert.equal(controlView.state.messages["SESSION-1"], undefined);
    assert.equal(controlView.state.platform.task_sync.projects["REMOTE-1"].tasks[0].id, "TASK-1");
    assert.equal(messageView.messages["SESSION-1"][0].content, "preserved");
    assert.equal("messages" in control, false);
    assert.equal("task_sync" in control.platform, false);
    assert.equal(control.partitions.schema_version, "desktop-state-partitions/v1");
    assert.match(control.partitions.message_file, /^desktop-session-messages\./);
    assert.match(control.partitions.task_projection_file, /^desktop-task-projection\./);
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

test("partition migration leaves the legacy control snapshot intact when manifest commit fails", async () => {
  const root = await mkdtemp(join(tmpdir(), "arckit-store-partition-rollback-"));
  const storePath = join(root, "desktop-store.json");
  const legacy = {
    version: 16,
    projects: [], runs: [], sessions: {}, messages: { legacy: [{ id: "M-1" }] },
    settings: {}, automation: {}, platform: {}, chat: {}
  };
  try {
    await writeFile(storePath, `${JSON.stringify(legacy)}\n`, "utf8");
    const store = createDesktopStore({
      dataDir: root,
      runsDir: join(root, "runs"),
      storePath,
      io: {
        async readJson(path) { return JSON.parse(await readFile(path, "utf8")); },
        async writeJson(path, value) {
          if (path === storePath) throw new Error("manifest commit failed");
          await writeFile(path, `${JSON.stringify(value)}\n`, "utf8");
        }
      }
    });

    await assert.rejects(store.captureStateView(), /manifest commit failed/);
    assert.deepEqual(JSON.parse(await readFile(storePath, "utf8")), legacy);
    assert.deepEqual((await readdir(root)).filter((file) => file.startsWith("desktop-") && file !== "desktop-store.json"), []);

    const recovered = createDesktopStore({ dataDir: root, runsDir: join(root, "runs"), storePath });
    assert.equal((await recovered.readStoreWithMessages()).messages.legacy[0].id, "M-1");
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

  assert.equal(store.version, DESKTOP_STORE_VERSION);
  assert.equal("realtime" in store.automation, false);
  assert.equal("snapshot" in store.automation, false);
  assert.equal(store.platform.task_sync.source_status, "degraded");
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
  assert.deepEqual(store.platform.task_sync.errors[0], {
    code: "request_failed",
    status: 500,
    message: "Project tasks unavailable",
    project_id: "12",
    section: ""
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
      active_task: { task_id: "t", task_title: legacyTitle, local_project_id: "local" },
      acceptance_feedback_items: [{ feedback_id: "AF-1", source_task_id: "t", source_task_title: legacyTitle }],
      recent_completions: [{ task_id: "t", title: legacyTitle }]
    }
  });

  assert.equal(store.platform.task_sync.projects.p.tasks[0].content, content);
  assert.equal(store.platform.task_sync.projects.p.tasks[0].title.endsWith("…"), true);
  assert.equal(store.automation.active_executions.local.task_title.endsWith("…"), true);
  assert.equal(store.automation.active_executions.local.workspace_key, "local");
  assert.match(store.automation.active_executions.local.execution_id, /^EXEC-[a-f0-9]{20}$/);
  assert.equal("active_task" in store.automation, false);
  assert.equal(store.automation.acceptance_feedback_items[0].source_task_title.endsWith("…"), true);
  assert.equal(store.automation.recent_completions[0].title.endsWith("…"), true);
  assert.equal(store.sessions.local[0].title.startsWith("待办 · legacy "), true);
  assert.equal(store.sessions.local[0].title.endsWith("…"), true);
});

test("desktop store migrates legacy external wait into actionable human intervention", () => {
  const store = normalizeStore({
    automation: {
      active_task: {
        task_id: "t",
        project_id: "p",
        local_project_id: "local",
        phase: "external_wait",
        external_wait_reason: "Provider route is unavailable.",
        external_wait_resume_condition: "Confirm after provider deployment.",
        external_wait_started_at: "2026-08-27T00:00:00Z"
      },
      acceptance_feedback_items: [{
        feedback_id: "AF-1",
        source_task_id: "t",
        source_project_id: "p",
        local_project_id: "local",
        status: "external_wait"
      }]
    }
  });

  const execution = store.automation.active_executions.local;
  assert.equal(execution.phase, "awaiting_human");
  assert.equal(execution.intervention_kind, "external_dependency");
  assert.equal(execution.intervention_reason, "Provider route is unavailable.");
  assert.equal(store.automation.attention_items.length, 1);
  assert.equal(store.automation.attention_items[0].kind, "external_dependency");
  assert.equal(store.automation.attention_items[0].question, "Confirm after provider deployment.");
  assert.equal(store.automation.acceptance_feedback_items[0].status, "awaiting_human");
  assert.equal(store.automation.acceptance_feedback_items[0].intervention_kind, "external_dependency");
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

  assert.equal(store.platform.task_sync.projects.old.state, "idle");
  assert.equal(store.platform.task_sync.projects.current.mode, "legacy");
  assert.equal(store.platform.task_sync.projects.current.cursor, 42);
  assert.equal(store.platform.task_sync.projects.current.last_event_at, "2026-08-22T00:00:00.000Z");
  assert.equal(store.platform.task_sync.projects.current.last_refreshed_at, "2026-08-22T00:00:01.000Z");
});

test("desktop store preserves bounded task replacement recovery state across restart normalization", () => {
  const store = normalizeStore({
    platform: {
      task_sync: {
        task_replacements: {
          "1:T-1": {
            id: "1:T-1",
            status: "source_delete_failed",
            source_task_id: "T-1",
            source_project_id: "1",
            target_task_id: "T-2",
            target_project_id: "2",
            error: "x".repeat(2000),
            created_at: "2026-08-25T00:00:00.000Z"
          },
          invalid: { source_task_id: "missing-target" }
        }
      }
    }
  });

  assert.deepEqual(Object.keys(store.platform.task_sync.task_replacements), ["1:T-1"]);
  assert.equal(store.platform.task_sync.task_replacements["1:T-1"].status, "source_delete_failed");
  assert.equal(store.platform.task_sync.task_replacements["1:T-1"].error.length, 1000);
});

test("desktop store migrates v9 bindings into a local workset without changing automation participation", () => {
  const store = normalizeStore({
    version: 9,
    automation: {
      project_bindings: { "12": "LOCAL-12", "3": "LOCAL-3" },
      project_participation: { "12": true, "3": false }
    }
  });

  assert.equal(store.version, DESKTOP_STORE_VERSION);
  assert.equal(store.platform.active_workset_id, "WORKSET-DEFAULT");
  assert.deepEqual(store.platform.worksets[0].project_ids, ["3", "12"]);
  assert.deepEqual(store.automation.project_participation, { "12": true, "3": false });

  const normalizedAgain = normalizeStore(store);
  assert.deepEqual(normalizedAgain.platform, store.platform);
  assert.deepEqual(normalizedAgain.automation.project_participation, store.automation.project_participation);
});

test("desktop store v16 preserves user control facts and invalidates only derived task readiness", () => {
  const legacy = normalizeStore({
    version: 15,
    projects: [{ id: "LOCAL-1", name: "Local", path: "/workspace" }],
    sessions: { "LOCAL-1": [{ id: "SESSION-1", project_id: "LOCAL-1", kind: "automation-task" }] },
    automation: {
      project_bindings: { "12": "LOCAL-1" },
      project_participation: { "12": true }
    },
    platform: {
      active_workset_id: "WORKSET-UPGRADE",
      worksets: [{ id: "WORKSET-UPGRADE", name: "Upgrade", project_ids: ["12"] }],
      task_sync: {
        identity_key: "user-7",
        user: { id: "7" },
        project_catalog: [{ id: "12", name: "Atlas", current_user_id: "7" }],
        projects: {
          "12": {
            project: { id: "12", name: "Atlas", current_user_id: "7" },
            tasks: [{ id: "T-1", project_id: "12", executor_id: "7", state: "pending" }],
            tags: [{ id: "TAG-1" }],
            trusted: true,
            revision: 9
          }
        },
        source_status: "healthy"
      }
    }
  });

  assert.equal(legacy.version, DESKTOP_STORE_VERSION);
  assert.deepEqual(legacy.platform.worksets[0].project_ids, ["12"]);
  assert.deepEqual(legacy.automation.project_bindings, { "12": "LOCAL-1" });
  assert.deepEqual(legacy.automation.project_participation, { "12": true });
  assert.equal(legacy.sessions["LOCAL-1"][0].id, "SESSION-1");
  assert.deepEqual(legacy.platform.task_sync.project_catalog.map((project) => project.id), ["12"]);
  assert.equal(legacy.platform.task_sync.projects["12"].trusted, false);
  assert.equal(legacy.platform.task_sync.rehydration_required, true);
  assert.equal(legacy.platform.task_sync.source_status, "syncing");

  const normalizedAgain = normalizeStore(legacy);
  assert.equal(normalizedAgain.platform.task_sync.rehydration_required, true);
  assert.equal(normalizedAgain.platform.task_sync.projects["12"].trusted, false);
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

test("desktop store migrates v14 Work Inspector width into a normalized global UI preference", () => {
  const migrated = normalizeStore({ version: 14, platform: {} });
  const clampedLow = normalizeStore({ version: 15, platform: { ui_preferences: { work_inspector_width_px: 120 } } });
  const clampedHigh = normalizeStore({ version: 15, platform: { ui_preferences: { work_inspector_width_px: 900 } } });
  const invalid = normalizeStore({ version: 15, platform: { ui_preferences: { work_inspector_width_px: "invalid" } } });

  assert.equal(migrated.version, DESKTOP_STORE_VERSION);
  assert.equal(migrated.platform.ui_preferences.work_inspector_width_px, 440);
  assert.equal(clampedLow.platform.ui_preferences.work_inspector_width_px, 360);
  assert.equal(clampedHigh.platform.ui_preferences.work_inspector_width_px, 640);
  assert.equal(invalid.platform.ui_preferences.work_inspector_width_px, 440);
  assert.deepEqual(normalizeStore(migrated).platform, migrated.platform);
});

test("desktop store restores the global Work Inspector width after reopening", async () => {
  const root = await mkdtemp(join(tmpdir(), "arckit-inspector-store-"));
  try {
    const options = { dataDir: root, runsDir: join(root, "runs"), storePath: join(root, "desktop-store.json") };
    const first = createDesktopStore(options);
    await first.updateStore((draft) => {
      draft.platform.ui_preferences.work_inspector_width_px = 528;
      return draft;
    });
    const reopened = createDesktopStore(options);
    assert.equal((await reopened.readStore()).platform.ui_preferences.work_inspector_width_px, 528);
  } finally {
    await rm(root, { recursive: true, force: true });
  }
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
