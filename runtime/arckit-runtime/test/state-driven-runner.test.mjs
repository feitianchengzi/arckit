import assert from "node:assert/strict";
import test from "node:test";
import { decideSessionContinuation, effectiveNoProgressLimit, runStateDrivenSession } from "../src/state-driven-runner.mjs";

test("state-driven session fresh-reads after writeback and stays in one adapter process", async () => {
  let reads = 0;
  let roundCalls = 0;
  let ledgerCalls = 0;
  const readArgs = [];
  const sessionEvents = [];
  const adapter = closeoutAdapter();
  const snapshots = [snapshot(1), snapshot(2)];
  const stateStore = {
    async readSnapshot(options = {}) {
      readArgs.push(options);
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
      maxNoProgressRounds: 3,
      onEvent(event) { sessionEvents.push(event); }
    },
    dependencies: {
      async runRound({ snapshot: current, options }) {
        roundCalls += 1;
        assert.equal(options.agentAdapter, adapter);
        assert.equal(current.projectState.project.revision, roundCalls);
        const loop = loopResult(roundCalls === 1 ? agentHandoff() : terminalHandoff());
        loop.agentLoopResult = agentSelectionResult(roundCalls);
        return loop;
      },
      async writeRoundLedger() {
        ledgerCalls += 1;
        return ledgerCalls === 1
          ? {
            written: true, changed_files: ["case.md"], post_commit_snapshot_token: "POST-COMMIT-1",
            round_closeout: { schema_version: "arckit-round-closeout/v2", status: "accepted", round: 1, case_id: "CASE-1", selected_gap: { id: "GAP-1" }, accepted_state_delta: { facts_added: [], gaps_added: [] }, invariant_assessment: { project_revision: 1, judgments: [] }, resulting_state: { project_revision: 2 } },
            case_control_result: { case_id: "CASE-1" }
          }
          : {
            written: true,
            changed_files: ["case.md", "state.record.json"],
            case_transition_result: { case_resolution: { loop_handoff: terminalHandoff() } }
          };
      }
    }
  });

  assert.equal(reads, 2);
  assert.deepEqual(readArgs, [{}, { afterCommitToken: "POST-COMMIT-1" }]);
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
  const candidatesIndex = sessionEvents.findIndex((event) => event.type === "runtime.round_candidates");
  const selectionIndex = sessionEvents.findIndex((event) => event.type === "runtime.round_selection");
  const closeoutIndex = sessionEvents.findIndex((event) => event.type === "runtime.round_closeout");
  const freshReadIndex = sessionEvents.findIndex((event) => event.type === "runtime.fresh_read.completed");
  const nextRoundIndex = sessionEvents.findIndex((event) => event.type === "runtime.session_round.started" && event.round_index === 2);
  assert.ok(candidatesIndex >= 0 && candidatesIndex < selectionIndex && selectionIndex < closeoutIndex && closeoutIndex < freshReadIndex && freshReadIndex < nextRoundIndex);
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

test("writeback-required terminal result cannot complete without an accepted ledger write", () => {
  const decision = decideSessionContinuation({
    runtimeResult: {
      round_result: "done",
      ledger_stage: { writeback_required: true }
    },
    ledgerWriteResult: {
      written: false,
      gate: { allowed: false, reasons: ["transition rejected"] }
    },
    handoff: terminalHandoff()
  });

  assert.deepEqual(decision, {
    continue: false,
    madeProgress: false,
    reason: "ledger_write_failed"
  });
});

test("rejected terminal ledger write reaches retry limit without Git closeout", async () => {
  const adapter = closeoutAdapter();
  const result = await runStateDrivenSession({
    projectRoot: "/workspace/project",
    stateStore: { async readSnapshot() { return snapshot(1); } },
    options: { agentAdapter: adapter, task: "finish", maxNoProgressRounds: 1 },
    dependencies: {
      async runRound() {
        const loop = loopResult(terminalHandoff());
        loop.agentLoopResult = agentSelectionResult(1);
        return loop;
      },
      async writeRoundLedger() {
        return {
          written: false,
          rejection: {
            kind: "ledger_gate_rejected",
            recoverable: true,
            responsibility: "agent",
            reason: "transition rejected"
          },
          changed_files: []
        };
      }
    }
  });

  assert.equal(result.stop_reason, "ledger_retry_limit");
  assert.equal(result.closeout_result, null);
  assert.deepEqual(adapter.prompts, []);
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

function snapshot(revision) {
  return {
    snapshotToken: `SNAPSHOT-${revision}`,
    candidateCatalog: {
      persisted_candidates: [{ ref: `case-gap:CASE-1:GAP-${revision}`, case_id: "CASE-1", gap: { id: `GAP-${revision}` } }],
      persisted_obligations: []
    },
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

function agentSelectionResult(round) {
  const ref = `case-gap:CASE-1:GAP-${round}`;
  return {
    schema_version: "arckit-agent-loop-result/v1",
    action: "case_transition",
    summary: `Advanced GAP-${round}.`,
    case_transition: {
      case_id: "CASE-1",
      selected_gap: { id: `GAP-${round}` },
      gap_selection: {
        mode: "candidate",
        basis: "Highest current risk.",
        snapshot_token: `SNAPSHOT-${round}`,
        selected_ref: ref,
        comparison_summary: "Compared the persisted candidate with no fresh candidate.",
        fresh_discovery_summary: "No fresh candidates found.",
        considered: [{ ref, source: "persisted", eligibility: "ready", disposition: "selected", priority_basis: { risk: "high" }, reason: "Only ready candidate." }]
      }
    }
  };
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
