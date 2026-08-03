import assert from "node:assert/strict";
import { EventEmitter } from "node:events";
import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { PassThrough } from "node:stream";
import test from "node:test";
import { buildAutoContinuationRuntimeContext, buildWriteLedgerCommandArgs, createDesktopRunManager, evaluateAutoContinuation } from "../src/desktop-run-manager.mjs";

test("Desktop ledger commands reference the userData run without copying it into the project", () => {
  const args = buildWriteLedgerCommandArgs({
    id: "RUN-20260803-072154820Z",
    project_path: "/workspace/project",
    result_file: "/desktop-user-data/runs/RUN-20260803-072154820Z/result.json"
  });

  assert.deepEqual(args, [
    "write-ledger",
    "--project", "/workspace/project",
    "--file", "/desktop-user-data/runs/RUN-20260803-072154820Z/result.json",
    "--runtime-record-ref", "arckit-runtime://runs/RUN-20260803-072154820Z",
    "--json"
  ]);
  assert.equal(args.some((item) => item.includes("arckit/project/runtime-results")), false);
});

test("auto continuation carries machine context without creating operator input", () => {
  const context = buildAutoContinuationRuntimeContext({
    id: "RUN-1",
    result_file: "/runs/RUN-1/result.json",
    activity_file: "/runs/RUN-1/activity.json"
  }, {
    next_prompt: "Continue from the latest Case State.",
    responsibility_reason: "Another agent gap is available."
  });

  assert.deepEqual(context, {
    kind: "auto_continuation",
    source_run_id: "RUN-1",
    source_result_ref: "/runs/RUN-1/result.json",
    source_activity_ref: "/runs/RUN-1/activity.json",
    continuation: {
      next_prompt: "Continue from the latest Case State.",
      responsibility_reason: "Another agent gap is available."
    }
  });
  assert.equal("operator_input" in context, false);
});

test("no_progress_limit allows the declared number of fresh agent retries", () => {
  const parsedResult = autoBridgeResult({ noProgressLimit: 1 });
  const first = evaluateAutoContinuation({
    sourceRun: autoBridgeRun({ noProgressStreak: 0 }),
    parsedResult
  });
  const exhausted = evaluateAutoContinuation({
    sourceRun: autoBridgeRun({ noProgressStreak: 1 }),
    parsedResult
  });

  assert.equal(first.allowed, true);
  assert.equal(first.next_no_progress_streak, 1);
  assert.equal(exhausted.allowed, false);
  assert.equal(exhausted.reason, "no_progress_limit");
});

test("automatic Desktop policy promotes an eligible ledger manual bridge", () => {
  const parsedResult = autoBridgeResult({ noProgressLimit: 1, triggerMode: "manual_bridge" });
  const automatic = evaluateAutoContinuation({
    sourceRun: autoBridgeRun({ noProgressStreak: 0, continuationPolicy: "automatic" }),
    parsedResult
  });
  const supervised = evaluateAutoContinuation({
    sourceRun: autoBridgeRun({ noProgressStreak: 0 }),
    parsedResult
  });

  assert.equal(automatic.allowed, true);
  assert.equal(automatic.reason, "automation_policy");
  assert.equal(supervised.allowed, false);
  assert.equal(supervised.reason, "not_requested");
});

test("automatic Desktop policy never promotes a human decision handoff", () => {
  const parsedResult = autoBridgeResult({
    noProgressLimit: 1,
    triggerMode: "user_decision",
    nextResponsibility: "human",
    humanDecisionRequired: true
  });
  const decision = evaluateAutoContinuation({
    sourceRun: autoBridgeRun({ noProgressStreak: 0, continuationPolicy: "automatic" }),
    parsedResult
  });

  assert.equal(decision.allowed, false);
  assert.equal(decision.requested, false);
});

test("deterministic ledger progress renews the max_auto_rounds safety budget", () => {
  const progressed = evaluateAutoContinuation({
    sourceRun: autoBridgeRun({
      noProgressStreak: 0,
      continuationPolicy: "automatic",
      autoDepth: 8,
      roundsSinceProgress: 8,
      ledgerWritten: true
    }),
    parsedResult: autoBridgeResult({ noProgressLimit: 2, ledgerWriteRequired: true, triggerMode: "manual_bridge" })
  });
  const exhausted = evaluateAutoContinuation({
    sourceRun: autoBridgeRun({
      noProgressStreak: 0,
      continuationPolicy: "automatic",
      autoDepth: 8,
      roundsSinceProgress: 8
    }),
    parsedResult: autoBridgeResult({ noProgressLimit: 20 })
  });

  assert.equal(progressed.allowed, true);
  assert.equal(progressed.next_rounds_since_progress, 0);
  assert.equal(exhausted.allowed, false);
  assert.equal(exhausted.reason, "max_auto_rounds");
});

test("a stale deterministic ledger gate triggers a bounded fresh-state replan", () => {
  const sourceRun = autoBridgeRun({ noProgressStreak: 0 });
  sourceRun.activity.gate_result = {
    parsed: {
      allowed: false,
      reasons: ["case_control_handoff is stale for Project State."]
    }
  };
  const parsedResult = autoBridgeResult({ noProgressLimit: 1, ledgerWriteRequired: true });
  const decision = evaluateAutoContinuation({ sourceRun, parsedResult });
  const context = buildAutoContinuationRuntimeContext(sourceRun, parsedResult.runtime_result.loop_handoff, decision);

  assert.equal(decision.allowed, true);
  assert.equal(decision.reason, "fresh_state_replan");
  assert.equal(context.recovery.kind, "fresh_state_replan");
  assert.equal(context.continuation.next_prompt, "Reload fresh state and continue.");
});

test("a deterministic Case transition rejection triggers a bounded state replan", () => {
  const sourceRun = autoBridgeRun({ noProgressStreak: 0 });
  sourceRun.activity.ledger_write_result = {
    parsed: {
      written: false,
      rejection: {
        kind: "case_transition_rejected",
        recoverable: true,
        reason: "facets.product_expectation claims resolved without reaching its evidence-backed target"
      }
    }
  };
  const parsedResult = autoBridgeResult({ noProgressLimit: 1, ledgerWriteRequired: true });
  const decision = evaluateAutoContinuation({ sourceRun, parsedResult });
  const context = buildAutoContinuationRuntimeContext(sourceRun, parsedResult.runtime_result.loop_handoff, decision);

  assert.equal(decision.allowed, true);
  assert.equal(decision.reason, "state_replan");
  assert.equal(context.recovery.kind, "state_replan");
  assert.match(context.recovery.reason, /rejected the proposed Case transition/);
});

test("a persisted pre-structured Case transition rejection remains automatically recoverable", () => {
  const sourceRun = autoBridgeRun({ noProgressStreak: 0 });
  sourceRun.activity.ledger_write_result = {
    code: 1,
    parsed: null,
    stderr: [
      "Error: facets.product_expectation claims resolved without reaching its evidence-backed target",
      "    at applyCaseTransitionToRecord (case-transition.mjs:213:34)",
      "    at applyRuntimeLedgerWriteback (runtime-writeback.mjs:17:27)"
    ].join("\n")
  };
  const decision = evaluateAutoContinuation({
    sourceRun,
    parsedResult: autoBridgeResult({ noProgressLimit: 1, ledgerWriteRequired: true })
  });

  assert.equal(decision.allowed, true);
  assert.equal(decision.reason, "state_replan");
  assert.equal(decision.ledger_rejection.legacy_record, true);
});

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
  const spawnCalls = [];
  const spawnProcess = (command, args) => {
    spawnCalls.push({ command, args });
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
      runtimeContext: {
        kind: "auto_continuation",
        source_run_id: "RUN-SOURCE",
        continuation: { next_prompt: "Continue from fresh Case State." }
      },
      dryRun: true
    });

    const contextIndex = spawnCalls[0].args.indexOf("--runtime-context");
    assert.ok(contextIndex > 0);
    assert.deepEqual(JSON.parse(spawnCalls[0].args[contextIndex + 1]), {
      kind: "auto_continuation",
      source_run_id: "RUN-SOURCE",
      continuation: { next_prompt: "Continue from fresh Case State." }
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

test("desktop run manager starts a silent direct agent task with only the requested prompt", async () => {
  const dataDir = await mkdtemp(join(tmpdir(), "arckit-direct-agent-task-"));
  const storePath = join(dataDir, "desktop-store.json");
  await writeFile(storePath, `${JSON.stringify({
    version: 4,
    projects: [{ id: "PROJECT-1", name: "Project", path: dataDir }],
    runs: [],
    sessions: { "PROJECT-1": [{ id: "SESSION-1", project_id: "PROJECT-1", title: "Chat" }] },
    messages: { "SESSION-1": [] },
    settings: {}
  }, null, 2)}\n`, "utf8");

  const children = [];
  const spawnCalls = [];
  const spawnProcess = (command, args) => {
    spawnCalls.push({ command, args });
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
    const run = await manager.startAgentTask({
      projectId: "PROJECT-1",
      sessionId: "SESSION-1",
      task: "git commit",
      adapter: "codex-app-server",
      approvalPolicy: "on-request"
    });

    assert.equal(run.entry_capability, "agent-task");
    assert.deepEqual(spawnCalls[0].args.slice(0, 7), [
      join(dataDir, "bin/arckit-runtime.mjs"),
      "agent-task",
      "--project", dataDir,
      "--json",
      "--task", "git commit"
    ]);
    assert.equal(spawnCalls[0].args.includes("--runtime-context"), false);
    assert.equal(spawnCalls[0].args.includes("--max-auto-rounds"), false);
    assert.equal(spawnCalls[0].args.includes("--packet-file"), false);
    assert.equal(spawnCalls[0].args.includes("--adapter"), false);
    assert.deepEqual(await manager.listMessages("PROJECT-1", "SESSION-1"), []);
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

function autoBridgeRun({
  noProgressStreak,
  continuationPolicy = "",
  autoDepth = 0,
  roundsSinceProgress = 0,
  ledgerWritten = false
}) {
  return {
    id: "RUN-SOURCE",
    status: "completed",
    adapter: "codex-app-server",
    auto_continue_depth: autoDepth,
    auto_no_progress_streak: noProgressStreak,
    auto_rounds_since_progress: roundsSinceProgress,
    max_auto_rounds: 8,
    continuation_policy: continuationPolicy,
    activity: {
      gate_result: null,
      ledger_write_result: ledgerWritten ? { parsed: { written: true } } : null
    }
  };
}

function autoBridgeResult({
  noProgressLimit,
  ledgerWriteRequired = false,
  triggerMode = "auto_bridge",
  nextResponsibility = "agent",
  humanDecisionRequired = false
}) {
  return {
    validation: { valid: true },
    runtime_result: {
      ledger_stage: { writeback_required: ledgerWriteRequired },
      loop_handoff: {
        status: "continue",
        next_responsibility: nextResponsibility,
        agent_continuation_available: nextResponsibility === "agent",
        human_decision_required: humanDecisionRequired,
        trigger_mode: triggerMode,
        next_prompt: "Reload fresh state and continue.",
        progress_guard: {
          no_progress_limit: noProgressLimit,
          max_auto_rounds: 8
        }
      }
    }
  };
}
