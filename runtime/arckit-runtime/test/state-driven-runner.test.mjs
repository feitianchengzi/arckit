import assert from "node:assert/strict";
import { mkdir, mkdtemp, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";
import { staleCandidateGapSelection } from "../src/agent-orchestrator.mjs";
import { isBoundCaseResolved, readBoundCaseState } from "../src/bound-case-state.mjs";
import { decideSessionContinuation, effectiveNoProgressLimit, runStateDrivenSession } from "../src/state-driven-runner.mjs";

test("state-driven session fresh-reads after writeback and stays in one adapter process", async () => {
  let reads = 0;
  let roundCalls = 0;
  let ledgerCalls = 0;
  const adapter = closeoutAdapter();
  const snapshots = [snapshot(1), snapshot(2)];
  const stateStore = {
    async readSnapshot() {
      return snapshots[reads++];
    }
  };

  const result = await runStateDrivenSession({
    projectRoot: "/workspace/project",
    stateStore,
    options: {
      adapter: "codex-app-server",
      agentAdapter: adapter,
      task: "finish the case",
      conversationLocale: "en",
      maxNoProgressRounds: 3
    },
    dependencies: {
      async runRound({ snapshot: current, options }) {
        roundCalls += 1;
        assert.equal(options.agentAdapter, adapter);
        assert.equal(current.projectState.project.revision, roundCalls);
        return loopResult(roundCalls === 1 ? agentHandoff() : terminalHandoff());
      },
      async writeRoundLedger() {
        ledgerCalls += 1;
        return ledgerCalls === 1
          ? { written: true, changed_files: ["case.md"], case_control_result: { case_id: "CASE-1" } }
          : {
            written: true,
            changed_files: ["case.md", "state.record.json"],
            case_transition_result: { case_resolution: { loop_handoff: terminalHandoff() } }
          };
      }
    }
  });

  assert.equal(reads, 2);
  assert.equal(roundCalls, 2);
  assert.equal(ledgerCalls, 2);
  assert.equal(adapter.closed, 1);
  assert.equal(result.session_mode, "state-driven");
  assert.equal(result.round_count, 2);
  assert.equal(result.stop_reason, "completed");
  assert.equal(result.paused_for_human, false);
  assert.equal(result.thread_id, "THREAD-1");
  assert.equal(adapter.compacted, 1);
  assert.equal(adapter.prompts.length, 1);
  assert.match(adapter.prompts[0], /Git-only closeout/);
  assert.match(adapter.prompts[0], /Do not inspect semantic correctness, run validation, edit files, or repair content/);
  assert.doesNotMatch(adapter.prompts[0], /final proportionate checks|repair issues if necessary/);
});

test("state-driven continuation pauses only for an explicit human handoff", () => {
  const decision = decideSessionContinuation({
    runtimeResult: { round_result: "continue" },
    ledgerWriteResult: { written: true },
    handoff: {
      status: "needs_human",
      next_responsibility: "human",
      human_decision_required: true,
      agent_continuation_available: false,
      next_prompt: "Choose one option."
    }
  });

  assert.deepEqual(decision, {
    continue: false,
    madeProgress: true,
    reason: "human_intervention"
  });
});

test("recoverable ledger rejection automatically replans from fresh state", () => {
  const decision = decideSessionContinuation({
    runtimeResult: { round_result: "continue" },
    ledgerWriteResult: {
      written: false,
      rejection: { recoverable: true, responsibility: "agent" }
    },
    handoff: agentHandoff(),
    noProgressRounds: 0,
    maxNoProgressRounds: 2
  });

  assert.equal(decision.continue, true);
  assert.equal(decision.reason, "fresh_state_replan");
});

test("Runtime progress guards can tighten the configured no-progress limit", () => {
  assert.equal(effectiveNoProgressLimit(8, { progress_guard: { no_progress_limit: 2 } }), 2);
  assert.equal(effectiveNoProgressLimit(1, { progress_guard: { no_progress_limit: 2 } }), 1);
  assert.equal(effectiveNoProgressLimit(8, {}), 8);
});

test("state-driven results persist semantic events without raw Agent deltas", async () => {
  const adapter = closeoutAdapter();
  const result = await runStateDrivenSession({
    projectRoot: "/workspace/project",
    stateStore: { async readSnapshot() { return snapshot(1); } },
    options: { agentAdapter: adapter, task: "finish", maxNoProgressRounds: 2 },
    dependencies: {
      async runRound() {
        const loop = loopResult(terminalHandoff());
        loop.events = [
          { type: "codex.item.agentMessage.delta", delta: "x".repeat(10_000) },
          { type: "runtime.agent_loop.completed", summary: "One gap completed." },
          { type: "runtime.result", result: { raw: "y".repeat(10_000) }, validation: { valid: true, issues: [] } }
        ];
        loop.agentLoopResult = { schema_version: "arckit-agent-loop-result/v1", action: "case_transition", summary: "One gap completed.", case_transition: { case_id: "CASE-1", selected_gap: { id: "GAP-1" } } };
        return loop;
      },
      async writeRoundLedger() {
        return { written: true, changed_files: ["case.md"] };
      }
    }
  });

  assert.deepEqual(result.events, [
    { type: "runtime.agent_loop.completed", summary: "One gap completed." },
    { type: "runtime.result", validation: { valid: true, issues: [] } }
  ]);
  assert.equal(JSON.stringify(result).includes("x".repeat(100)), false);
  assert.equal(JSON.stringify(result).includes("y".repeat(100)), false);
  assert.deepEqual(result.agent_loop_result, {
    schema_version: "arckit-agent-loop-result/v1",
    action: "case_transition",
    summary: "One gap completed.",
    case_id: "CASE-1",
    selected_gap_id: "GAP-1"
  });
});

test("a bound Case already resolved breaks the loop before another Agent turn", async () => {
  const projectRoot = await mkdtemp(join(tmpdir(), "arckit-bound-case-"));
  await mkdir(join(projectRoot, "arckit", "project"), { recursive: true });
  await mkdir(join(projectRoot, "arckit", "cases", "closed"), { recursive: true });
  await writeFile(join(projectRoot, "arckit", "project", "state.record.json"), JSON.stringify({
    advancement: { active_case_refs: [] }
  }));
  await writeFile(join(projectRoot, "arckit", "cases", "closed", "CASE-20260811-001-electron-cutover.md"), [
    "# Closed Case",
    "",
    "## Structured Record",
    "",
    "```json",
    JSON.stringify({
      schema_version: "development-case-record/v5",
      id: "CASE-20260811-001",
      status: "closed",
      updated_at: "2026-08-11T00:00:00Z",
      case_resolution: { status: "resolved" },
      gaps: [{ id: "gap-complete-electron-cutover", status: "resolved" }]
    }),
    "```",
    ""
  ].join("\n"));
  const adapter = closeoutAdapter();
  const lifecycleEvents = [];
  let roundCalls = 0;
  const result = await runStateDrivenSession({
    projectRoot,
    stateStore: { async readSnapshot() { return snapshot(1); } },
    options: {
      agentAdapter: adapter,
      task: "finish the case",
      maxNoProgressRounds: 2,
      lifecycleTraceId: "TRACE-BOUND-CASE",
      lifecycleEventSink(event) { lifecycleEvents.push(event); },
      runtimeContext: { case_id: "CASE-20260811-001", closeout_only: false }
    },
    dependencies: {
      async runRound() { roundCalls += 1; return loopResult(terminalHandoff()); },
      async writeRoundLedger() { return { written: true, changed_files: [] }; }
    }
  });
  assert.equal(roundCalls, 0);
  assert.equal(result.stop_reason, "case_already_resolved");
  assert.equal(result.round_count, 0);
  assert.equal(adapter.prompts.length, 1);
  assert.match(adapter.prompts[0], /Git-only closeout/);
  const roundStart = lifecycleEvents.find((event) => event.type === "runtime.lifecycle.span.started" && event.name === "runtime.round");
  const roundEnd = lifecycleEvents.find((event) => event.type === "runtime.lifecycle.span.completed" && event.span_id === roundStart?.span_id);
  assert.ok(roundStart);
  assert.equal(roundEnd?.status, "ok");
});

test("bound Case lookup rejects legacy and mismatched closed records", async () => {
  const projectRoot = await mkdtemp(join(tmpdir(), "arckit-bound-case-identity-"));
  await mkdir(join(projectRoot, "arckit", "project"), { recursive: true });
  await mkdir(join(projectRoot, "arckit", "cases", "closed"), { recursive: true });
  await writeFile(join(projectRoot, "arckit", "project", "state.record.json"), JSON.stringify({
    advancement: { active_case_refs: [] }
  }));
  await writeClosedCase(projectRoot, "CASE-20260811-010-legacy.md", {
    schema_version: "development-case-record/v4",
    id: "CASE-20260811-010",
    status: "closed",
    case_resolution: { status: "resolved" }
  });
  await writeClosedCase(projectRoot, "CASE-20260811-011-mismatched.md", {
    schema_version: "development-case-record/v5",
    id: "CASE-20260811-099",
    status: "closed",
    case_resolution: { status: "resolved" }
  });

  const legacy = await readBoundCaseState(projectRoot, "CASE-20260811-010");
  const mismatched = await readBoundCaseState(projectRoot, "CASE-20260811-011");
  assert.equal(legacy, null);
  assert.equal(mismatched, null);
  assert.equal(isBoundCaseResolved(legacy), false);
  assert.equal(isBoundCaseResolved(mismatched), false);
});

test("a resolved stale gap becomes a corrective replan instead of a terminal stop", async () => {
  const tasks = [];
  const adapter = closeoutAdapter();
  const activeCaseRecord = {
    id: "CASE-20260811-002",
    updated_at: "2026-08-11T01:00:00Z",
    gaps: [{ id: "gap-complete-electron-cutover", status: "resolved" }],
    case_resolution: { candidate_gaps: [] }
  };
  const stateStore = {
    async readSnapshot() {
      const current = snapshot(1);
      current.activeCases = [{ ref: "arckit/cases/active/CASE-20260811-002-x.md", record: activeCaseRecord }];
      return current;
    }
  };
  let calls = 0;
  const result = await runStateDrivenSession({
    projectRoot: "/workspace/project",
    stateStore,
    options: { agentAdapter: adapter, task: "finish", maxNoProgressRounds: 3 },
    dependencies: {
      async runRound({ options }) {
        calls += 1;
        tasks.push(options.task);
        if (calls === 1) {
          return {
            loopFrame: { selected_gap: null },
            events: [],
            staleGap: { case_id: "CASE-20260811-002", gap_id: "gap-complete-electron-cutover" },
            runtimeResult: {
              round_result: "continue",
              ledger_stage: { status: "not_required", writeback_required: false },
              loop_handoff: agentHandoff()
            },
            validation: { valid: true, issues: [] }
          };
        }
        return loopResult(terminalHandoff());
      },
      async writeRoundLedger() { return { written: true, changed_files: ["case.md"] }; }
    }
  });
  assert.equal(calls, 2);
  assert.match(tasks[1], /already resolved in canonical Case CASE-20260811-002/);
  assert.equal(result.stop_reason, "completed");
});

test("staleCandidateGapSelection flags a resolved gap that is no longer a candidate", () => {
  const selectedGap = { id: "GAP-1", status: "resolved" };
  const snapshot = {
    activeCases: [{
      record: {
        id: "CASE-1",
        updated_at: "T1",
        gaps: [{ id: "GAP-1", status: "resolved" }],
        case_resolution: { candidate_gaps: [] }
      }
    }]
  };
  const result = {
    schema_version: "arckit-agent-loop-result/v1",
    action: "case_transition",
    case_transition: {
      case_id: "CASE-1",
      case_updated_at: "T1",
      gap_selection: { mode: "candidate" },
      selected_gap: selectedGap
    }
  };
  assert.deepEqual(staleCandidateGapSelection(result, snapshot), { case_id: "CASE-1", gap_id: "GAP-1" });
  const matching = {
    ...result,
    case_transition: {
      ...result.case_transition,
      gap_selection: { mode: "candidate" }
    }
  };
  const candidateSnapshot = {
    activeCases: [{
      record: {
        id: "CASE-1",
        updated_at: "T1",
        gaps: [{ id: "GAP-1", status: "open" }],
        case_resolution: { candidate_gaps: [selectedGap] }
      }
    }]
  };
  assert.equal(staleCandidateGapSelection(matching, candidateSnapshot), null);
});

function snapshot(revision) {
  return {
    projectState: {
      project: { revision },
      advancement: { selection_context: {}, project_gaps: [], active_case_refs: [] },
      software_definition: { decision_areas: [] },
      software_invariants: []
    },
    activeCases: [],
    paths: {
      projectState: "arckit/project/state.record.json",
      stateBrief: "arckit/project/STATE.md",
      activeIteration: "",
      activeCases: [],
      casesIndex: "arckit/cases/INDEX.md",
      specIndex: "arckit/spec/INDEX.md",
      interactionIndex: "arckit/interaction/INDEX.md",
      visualIndex: "arckit/visual/INDEX.md",
      techIndex: "arckit/tech/INDEX.md"
    },
    summary: { active_case_count: 0 }
  };
}

async function writeClosedCase(projectRoot, name, record) {
  await writeFile(join(projectRoot, "arckit", "cases", "closed", name), [
    "# Closed Case",
    "",
    "## Structured Record",
    "",
    "```json",
    JSON.stringify(record),
    "```",
    ""
  ].join("\n"));
}

function closeoutAdapter() {
  return {
    name: "codex-app-server",
    closed: 0,
    compacted: 0,
    prompts: [],
    threadId() { return "THREAD-1"; },
    latestContextUsage() {
      return { context_utilization: 0.85, turn_id: "TURN-1" };
    },
    async compactThread() {
      this.compacted += 1;
      return { thread_id: "THREAD-1", turn_id: "TURN-COMPACT" };
    },
    async *runTurn({ prompt }) {
      this.prompts.push(prompt);
      yield {
        type: "runtime.task_closeout_result",
        result: {
          schema_version: "arckit-task-closeout-result/v1",
          status: "completed",
          outcome: "no_changes",
          summary: "No task-scoped changes remain to commit.",
          evidence: ["git status --short"],
          commit_hash: "",
          error: ""
        }
      };
    },
    close() { this.closed += 1; }
  };
}

function loopResult(handoff) {
  return {
    loopFrame: { selected_gap: { id: "GAP-1" } },
    events: [],
    runtimeResult: {
      round_result: handoff.next_responsibility === "none" ? "done" : "continue",
      ledger_stage: { status: "gate_ready", writeback_required: true },
      loop_handoff: handoff
    },
    validation: { valid: true, issues: [] }
  };
}

function agentHandoff() {
  return {
    status: "ready",
    next_responsibility: "agent",
    human_decision_required: false,
    agent_continuation_available: true,
    trigger_mode: "auto_bridge",
    next_prompt: "Continue from fresh state."
  };
}

function terminalHandoff() {
  return {
    status: "complete",
    next_responsibility: "none",
    human_decision_required: false,
    agent_continuation_available: false,
    trigger_mode: "none",
    next_prompt: ""
  };
}
