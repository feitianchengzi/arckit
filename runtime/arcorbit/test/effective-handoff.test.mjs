import assert from "node:assert/strict";
import test from "node:test";
import { selectEffectiveLoopHandoff } from "../src/kernel/effective-handoff.mjs";

test("a persisted schema-bound Agent result recovers a human handoff from a truncated Runtime tail", () => {
  const result = {
    schema_version: "arckit-agent-loop-result/v1",
    action: "handoff",
    summary: "Human authorization is required.",
    handoff: {
      next_responsibility: "human",
      reason: "The required repository is outside the authorized workspace.",
      next_prompt: "Authorize the adjacent repository.",
      human_decision_required: true
    }
  };

  const handoff = selectEffectiveLoopHandoff({
    activity: {
      loop_handoff: null,
      agent_loop_result: null,
      messages: [{
        kind: "structured",
        structured_data: { schema_version: result.schema_version, value: result }
      }]
    }
  });

  assert.equal(handoff.status, "needs_human");
  assert.equal(handoff.next_responsibility, "human");
  assert.equal(handoff.human_decision_required, true);
  assert.equal(handoff.responsibility_reason, result.handoff.reason);
  assert.equal(handoff.human_gate.decision_needed, result.handoff.next_prompt);
});

test("a complete Runtime handoff remains authoritative over a persisted Agent fallback", () => {
  const handoff = selectEffectiveLoopHandoff({
    runtimeResult: {
      loop_handoff: {
        status: "done",
        next_responsibility: "none",
        human_decision_required: false
      }
    },
    activity: {
      messages: [{
        structured_data: {
          schema_version: "arckit-agent-loop-result/v1",
          value: {
            schema_version: "arckit-agent-loop-result/v1",
            action: "handoff",
            summary: "Older fallback.",
            handoff: {
              next_responsibility: "human",
              reason: "Older reason.",
              next_prompt: "Older question.",
              human_decision_required: true
            }
          }
        }
      }]
    }
  });

  assert.equal(handoff.status, "done");
  assert.equal(handoff.next_responsibility, "none");
});
