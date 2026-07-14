import assert from "node:assert/strict";
import { EventEmitter } from "node:events";
import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { PassThrough } from "node:stream";
import test from "node:test";
import { createDesktopRunManager } from "../src/desktop-run-manager.mjs";

test("desktop run manager deletes a chat, persists the change, and emits its replacement", async () => {
  const dataDir = await mkdtemp(join(tmpdir(), "arckit-run-manager-"));
  const storePath = join(dataDir, "desktop-store.json");
  await writeFile(storePath, `${JSON.stringify({
    version: 4,
    projects: [{ id: "PROJECT-1", name: "Project", path: dataDir }],
    runs: [],
    sessions: {
      "PROJECT-1": [
        { id: "SESSION-1", project_id: "PROJECT-1", title: "First" },
        { id: "SESSION-2", project_id: "PROJECT-1", title: "Second" }
      ]
    },
    messages: {
      "SESSION-1": [{ id: "MESSAGE-1", content: "Delete me" }],
      "SESSION-2": [{ id: "MESSAGE-2", content: "Keep me" }]
    },
    settings: {}
  }, null, 2)}\n`, "utf8");

  try {
    const manager = createDesktopRunManager({
      runtimeRoot: new URL("..", import.meta.url).pathname,
      dataDir
    });
    const events = [];
    manager.onEvent((event) => events.push(event));

    const result = await manager.deleteSession("PROJECT-1", "SESSION-1");
    const persisted = JSON.parse(await readFile(storePath, "utf8"));

    assert.deepEqual(result, {
      deleted_session_id: "SESSION-1",
      next_session_id: "SESSION-2"
    });
    assert.deepEqual(persisted.sessions["PROJECT-1"].map((session) => session.id), ["SESSION-2"]);
    assert.equal("SESSION-1" in persisted.messages, false);
    assert.equal(persisted.messages["SESSION-2"][0].content, "Keep me");
    assert.equal(events.at(-1).type, "session.deleted");
    assert.equal(events.at(-1).nextSessionId, "SESSION-2");
  } finally {
    await rm(dataDir, { recursive: true, force: true });
  }
});

test("desktop run manager refuses to remove a project with an active run", async () => {
  const dataDir = await mkdtemp(join(tmpdir(), "arckit-active-project-"));
  const storePath = join(dataDir, "desktop-store.json");
  await writeFile(storePath, `${JSON.stringify({
    version: 4,
    projects: [{ id: "PROJECT-1", name: "Project", path: dataDir }],
    runs: [],
    sessions: {
      "PROJECT-1": [{ id: "SESSION-1", project_id: "PROJECT-1", title: "Chat" }]
    },
    messages: { "SESSION-1": [] },
    settings: {}
  }, null, 2)}\n`, "utf8");

  const children = [];
  const spawnProcess = () => {
    const child = new EventEmitter();
    child.stdin = new PassThrough();
    child.stdout = new PassThrough();
    child.stderr = new PassThrough();
    child.exitCode = 0;
    child.signalCode = null;
    children.push(child);
    return child;
  };
  const manager = createDesktopRunManager({
    runtimeRoot: dataDir,
    dataDir,
    spawnProcess,
    ensureProject: async () => ({ initialized: false, repaired: false })
  });

  try {
    await manager.startRun({
      projectId: "PROJECT-1",
      sessionId: "SESSION-1",
      task: "Keep running",
      dryRun: true
    });

    await assert.rejects(
      manager.removeProject("PROJECT-1"),
      /Stop the active run before removing this project\./
    );
    await assert.rejects(
      manager.deleteSession("PROJECT-1", "SESSION-1"),
      /Stop the active run before deleting this chat\./
    );
    assert.equal((await manager.listProjects()).length, 1);

    await manager.abortActiveRuns({ graceMs: 0 });
    await manager.removeProject("PROJECT-1");
    assert.equal((await manager.listProjects()).length, 0);
  } finally {
    await manager.abortActiveRuns({ graceMs: 0 });
    for (const child of children) {
      child.stdin.destroy();
      child.stdout.destroy();
      child.stderr.destroy();
    }
    await rm(dataDir, { recursive: true, force: true });
  }
});
