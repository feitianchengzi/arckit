import assert from "node:assert/strict";
import test from "node:test";

import { deriveRuntimeControlState } from "../src/kernel/control-state.mjs";
import { applyRunCommandResult, createRunActivity } from "../src/projection/run-event-projector.mjs";

const project = { id: "PROJECT-1" };
const session = { id: "SESSION-1" };

test("gate-ready Case transition is writeback-ready even while the Case continues", () => {
  const result = deriveRuntimeControlState({
    project,
    session,
    run: { id: "RUN-1", status: "completed", round_result: "continue" },
    activity: {
      round_state: "ledger_gate_ready",
      ledger_stage: {
        status: "gate_ready",
        writeback_required: true,
        reason: "Accepted Case delta is ready."
      }
    }
  });

  assert.equal(result.state, "ledger_gate_ready");
  assert.equal(result.primary_action, "write_ledger");
});

test("round done without a gate-ready transition does not use the removed writeback shortcut", () => {
  const result = deriveRuntimeControlState({
    project,
    session,
    run: { id: "RUN-2", status: "completed", round_result: "done" },
    activity: {
      ledger_stage: { status: "not_ready", writeback_required: false },
      loop_handoff: {
        status: "done",
        next_responsibility: "none",
        agent_continuation_available: false,
        human_decision_required: false,
        trigger_mode: "none"
      }
    }
  });

  assert.equal(result.state, "no_context");
  assert.equal(result.primary_action, "none");
});

test("ledger-derived completion review escalation replaces an earlier agent continuation", () => {
  const run = { id: "RUN-3", status: "completed", adapter: "codex", started_at: "2026-07-27T00:00:00.000Z" };
  run.activity = createRunActivity(run);
  run.activity.loop_handoff = {
    status: "continue",
    next_responsibility: "agent",
    agent_continuation_available: true,
    human_decision_required: false,
    trigger_mode: "auto_bridge"
  };
  applyRunCommandResult(run, "write-ledger", {
    parsed: {
      written: true,
      case_transition_result: {
        case_resolution: {
          loop_handoff: {
            status: "needs_human",
            next_responsibility: "human",
            agent_continuation_available: false,
            human_decision_required: true,
            trigger_mode: "user_decision",
            responsibility_reason: "Completion review budget is exhausted."
          }
        }
      }
    }
  });

  const result = deriveRuntimeControlState({ project, session, run, activity: run.activity });
  assert.equal(run.activity.loop_handoff.next_responsibility, "human");
  assert.equal(result.state, "human_gate_required");
  assert.equal(result.primary_action, "respond_to_gate");
});
