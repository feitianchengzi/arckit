import assert from "node:assert/strict";
import test from "node:test";
import { decideSessionContinuation, runStateDrivenSession } from "../src/state-driven-runner.mjs";

test("state-driven session fresh-reads after writeback and stays in one adapter process", async () => {
  let reads = 0;
  let roundCalls = 0;
  let ledgerCalls = 0;
  const adapter = { name: "codex-app-server", closed: 0, close() { this.closed += 1; } };
  const snapshots = [snapshot("REV-1"), snapshot("REV-2")];
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
      maxAutoRounds: 3
    },
    dependencies: {
      async runRound({ snapshot: current, options }) {
        roundCalls += 1;
        assert.equal(options.agentAdapter, adapter);
        assert.equal(current.projectState.project.updated_at, `REV-${roundCalls}`);
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

function snapshot(revision) {
  return {
    projectState: {
      project: { updated_at: revision },
      case_control: {},
      state_gaps: [],
      active_case_refs: []
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

function loopResult(handoff) {
  return {
    loopFrame: { selected_gap: { id: "GAP-1" } },
    agentTasks: [],
    agentReports: [],
    mergeResult: null,
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
