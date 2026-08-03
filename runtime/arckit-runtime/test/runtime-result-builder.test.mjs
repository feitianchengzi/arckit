import assert from "node:assert/strict";
import test from "node:test";
import { createRuntimeResultFromMerge } from "../src/kernel/runtime-result-builder.mjs";

test("planning needs_human survives result construction without a Controller review", () => {
  const reason = "Controller requested a human decision before worker dispatch.";
  const result = createRuntimeResultFromMerge({
    mergeResult: {
      evidence: ["controller_plan"],
      changed_files: [],
      artifact_ownership_scan: emptyOwnershipScan(),
      source_projection_check: {
        source_facts_changed: [],
        projection_artifacts_changed: [],
        source_unknown: true,
        deferred_projections: [],
        blocked_projections: [reason]
      },
      report_intake: {
        accepted: [],
        rejected: [],
        needs_revision: [],
        needs_controller_decision: [],
        needs_human_decision: [reason],
        missing: []
      },
      loop_gate: {
        status: "needs_human",
        next_responsibility: "human",
        trigger_mode: "user_decision",
        human_decision_required: true,
        reason
      },
      controller_reducer_result: {
        controller_review: null,
        controller_review_failure_reason: "",
        controller_plan: { status: "needs_human" }
      }
    },
    reports: [],
    loopFrame: {
      case_id: "CASE-20260802-002",
      case_updated_at: "2026-08-02T16:36:37.278Z",
      conversation_locale: "zh-Hans",
      controller_frame: {
        route_plan: {
          selected_gap: {
            id: "new-case-required:point-cloud-copy",
            case_id: "CASE-20260802-002",
            facet: "product_expectation",
            responsibility: "human",
            current_state: "case mismatch",
            target_state: "new Case selected",
            next_transition: "Create and select the Agent-requested Case."
          }
        },
        controller_plan: {
          planned_transition: {
            goal: "Create and select the Agent-requested Case.",
            expected_state_change: "case mismatch -> new Case selected"
          },
          continuation_intent: {
            goal: "Confirm whether to create the new Case.",
            state_transition: "case mismatch -> confirmation pending",
            next_prompt: "Please confirm whether to create the new Case."
          }
        }
      },
      execution_gate: {},
      executor_binding: {},
      worker_packets: []
    },
    round: {
      gap_id: "new-case-required:point-cloud-copy",
      facet: "product_expectation",
      responsibility: "human",
      current_state: "case mismatch",
      target_state: "new Case selected",
      next_transition: "Create and select the Agent-requested Case.",
      round_goal: "Confirm whether to create the new Case.",
      required_context_refs: [],
      stop_conditions: [],
      max_auto_rounds: 8
    },
    compiledPrompt: {
      conversation_locale: "zh-Hans",
      output_schema: "runtime/arckit-runtime/schemas/runtime-result.schema.json"
    },
    dryRun: false,
    roundState: { state: "authorized", history: [] }
  });

  assert.equal(result.round_outcome.status, "needs_human");
  assert.equal(result.round_result, "needs_human");
  assert.equal(result.loop_handoff.status, "needs_human");
  assert.equal(result.loop_handoff.next_responsibility, "human");
  assert.equal(result.loop_handoff.agent_continuation_available, false);
  assert.equal(result.loop_handoff.human_decision_required, true);
  assert.equal(result.loop_handoff.trigger_mode, "user_decision");
  assert.equal(result.loop_handoff.human_gate.required, true);
  assert.equal(result.loop_handoff.human_gate.decision_needed, "Please confirm whether to create the new Case.");
  assert.equal(result.ledger_stage.status, "human_blocked");
});

function emptyOwnershipScan() {
  return {
    schema_version: "arckit-artifact-ownership-scan/v1",
    classified: [],
    source_facts_changed: [],
    projection_artifacts_changed: [],
    implementation_evidence: [],
    pending_items: [],
    runtime_logs: [],
    unknown_artifacts: []
  };
}
