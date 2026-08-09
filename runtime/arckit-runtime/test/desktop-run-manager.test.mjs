import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { EventEmitter } from "node:events";
import { mkdir, mkdtemp, readFile, readdir, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { PassThrough } from "node:stream";
import test from "node:test";
import { buildWriteLedgerCommandArgs, createDesktopRunManager } from "../src/desktop-run-manager.mjs";

test("Desktop ledger commands reference the userData run without copying it into the project", () => {
  const args = buildWriteLedgerCommandArgs({
    id: "RUN-20260803-072154820Z",
    project_path: "/workspace/project",
    result_file: "/desktop-user-data/runs/RUN-20260803-072154820Z/result.json"
  });
  assert.deepEqual(args, [
    "write-ledger", "--project", "/workspace/project", "--file", "/desktop-user-data/runs/RUN-20260803-072154820Z/result.json",
    "--runtime-record-ref", "arckit-runtime://runs/RUN-20260803-072154820Z", "--json"
  ]);
});

test("desktop run manager reads canonical active and closed Case records for reconciliation", async () => {
  const dataDir = await mkdtemp(join(tmpdir(), "arckit-case-reader-"));
  const projectDir = join(dataDir, "project");
  await mkdir(join(projectDir, "arckit/project"), { recursive: true });
  await mkdir(join(projectDir, "arckit/cases/active"), { recursive: true });
  await mkdir(join(projectDir, "arckit/cases/closed"), { recursive: true });
  await writeStore(dataDir, projectDir);
  await writeFile(join(projectDir, "arckit/project/state.record.json"), `${JSON.stringify({
    active_case_refs: ["arckit/cases/active/CASE-20260807-001-active.md"]
  })}\n`, "utf8");
  await writeCaseFixture(join(projectDir, "arckit/cases/active/CASE-20260807-001-active.md"), {
    id: "CASE-20260807-001", status: "active", case_resolution: { status: "unresolved" }
  });
  await writeCaseFixture(join(projectDir, "arckit/cases/closed/CASE-20260806-001-closed.md"), {
    id: "CASE-20260806-001", status: "closed", case_resolution: { status: "resolved" }
  });

  try {
    const manager = createDesktopRunManager({ runtimeRoot: new URL("..", import.meta.url).pathname, dataDir });
    const cases = await manager.listProjectCaseStates("PROJECT-1");
    assert.deepEqual(cases.map((item) => [item.case_id, item.location]), [
      ["CASE-20260807-001", "active"], ["CASE-20260806-001", "closed"]
    ]);
  } finally {
    await rm(dataDir, { recursive: true, force: true });
  }
});

test("a restarted run loads the persisted task thread binding before spawning Runtime", async () => {
  const dataDir = await mkdtemp(join(tmpdir(), "arckit-thread-binding-"));
  await writeStore(dataDir, dataDir);
  const bindingDir = join(dataDir, "thread-bindings", "PROJECT-1");
  await mkdir(bindingDir, { recursive: true });
  const key = createHash("sha256").update("TASK-1").digest("hex").slice(0, 24);
  await writeFile(join(bindingDir, `${key}.json`), `${JSON.stringify({
    schema_version: "arckit-codex-thread-binding/v1",
    task_id: "TASK-1",
    threadId: "THREAD-PERSISTED",
    boundAt: "2026-08-09T00:00:00Z"
  })}\n`, "utf8");
  const children = [];
  const calls = [];
  const manager = createDesktopRunManager({
    runtimeRoot: dataDir,
    dataDir,
    spawnProcess(command, args) {
      calls.push({ command, args });
      return fakeChild(children);
    },
    ensureProject: async () => ({ initialized: false, repaired: false })
  });

  try {
    const run = await manager.startRun({ projectId: "PROJECT-1", taskId: "TASK-1", task: "Resume", dryRun: true });
    assert.equal(run.thread_id, "THREAD-PERSISTED");
    const index = calls[0].args.indexOf("--thread-id");
    assert.equal(calls[0].args[index + 1], "THREAD-PERSISTED");
    assert.equal((await manager.getTaskThreadBinding("PROJECT-1", "TASK-1")).threadId, "THREAD-PERSISTED");
  } finally {
    await manager.abortActiveRuns({ graceMs: 0 });
    destroyChildren(children);
    await rm(dataDir, { recursive: true, force: true });
  }
});

test("desktop run manager refuses to remove a project with an active state-driven run", async () => {
  const dataDir = await mkdtemp(join(tmpdir(), "arckit-active-project-"));
  await writeStore(dataDir, dataDir);
  const children = [];
  const calls = [];
  const manager = createDesktopRunManager({
    runtimeRoot: dataDir,
    dataDir,
    spawnProcess(command, args) { calls.push({ command, args }); return fakeChild(children); },
    ensureProject: async () => ({ initialized: false, repaired: false })
  });
  try {
    await manager.startRun({
      projectId: "PROJECT-1", taskId: "TASK-1", task: "Keep running", maxNoProgressRounds: 0,
      runtimeContext: { closeout_only: true, case_id: "CASE-20260809-001" }, dryRun: true
    });
    const contextIndex = calls[0].args.indexOf("--runtime-context");
    assert.deepEqual(JSON.parse(calls[0].args[contextIndex + 1]), { closeout_only: true, case_id: "CASE-20260809-001" });
    assert.equal(calls[0].args[calls[0].args.indexOf("--max-no-progress-rounds") + 1], "1");
    await assert.rejects(manager.removeProject("PROJECT-1"), /Stop the active run/);
  } finally {
    await manager.abortActiveRuns({ graceMs: 0 });
    destroyChildren(children);
    await rm(dataDir, { recursive: true, force: true });
  }
});

test("desktop run manager persists semantic messages without duplicating high-frequency deltas", async () => {
  const dataDir = await mkdtemp(join(tmpdir(), "arckit-message-stream-"));
  await writeStore(dataDir, dataDir);
  const children = [];
  const manager = createDesktopRunManager({
    runtimeRoot: dataDir,
    dataDir,
    spawnProcess() { return fakeChild(children); },
    ensureProject: async () => ({ initialized: false, repaired: false })
  });
  try {
    const run = await manager.startRun({ projectId: "PROJECT-1", taskId: "TASK-1", task: "Test messages", dryRun: true });
    const child = children[0];
    for (let index = 0; index < 500; index += 1) {
      child.stderr.write(`${JSON.stringify({ event: {
        type: "codex.reasoning.delta", thread_id: "THREAD-1", turn_id: "TURN-1", item_id: "REASON-1", text: "x"
      } })}\n`);
    }
    child.stderr.write(`${JSON.stringify({ event: {
      type: "codex.item.completed", thread_id: "THREAD-1", turn_id: "TURN-1",
      params: { item: { id: "REASON-1", type: "reasoning", summary: "Agent inspected the current state." } }
    } })}\n`);
    await new Promise((resolve) => setTimeout(resolve, 240));
    const records = (await readFile(run.messages_file, "utf8")).trim().split(/\r?\n/).map(JSON.parse);
    assert.equal(records.length, 2);
    assert.equal(records[1].message.content, "Agent inspected the current state.");
    assert.deepEqual((await readdir(join(dataDir, "runs", run.id))).filter((name) => name.includes("events")), []);
  } finally {
    await manager.abortActiveRuns({ graceMs: 0 });
    destroyChildren(children);
    await rm(dataDir, { recursive: true, force: true });
  }
});

async function writeStore(dataDir, projectDir) {
  await writeFile(join(dataDir, "desktop-store.json"), `${JSON.stringify({
    version: 9,
    projects: [{ id: "PROJECT-1", name: "Project", path: projectDir }],
    runs: [],
    sessions: { "PROJECT-1": [{ id: "SESSION-1", project_id: "PROJECT-1", title: "Task" }] },
    messages: { "SESSION-1": [] },
    settings: {},
    automation: {}
  }, null, 2)}\n`, "utf8");
}

async function writeCaseFixture(file, record) {
  await writeFile(file, `# ${record.id}\n\n## Structured Record\n\n\`\`\`json\n${JSON.stringify(record, null, 2)}\n\`\`\`\n`, "utf8");
}

function fakeChild(children) {
  const child = new EventEmitter();
  child.stdin = new PassThrough();
  child.stdout = new PassThrough();
  child.stderr = new PassThrough();
  child.exitCode = 0;
  child.signalCode = null;
  children.push(child);
  return child;
}

function destroyChildren(children) {
  for (const child of children) {
    child.stdin.destroy();
    child.stdout.destroy();
    child.stderr.destroy();
  }
}
