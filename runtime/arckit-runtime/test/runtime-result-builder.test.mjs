import assert from "node:assert/strict";
import test from "node:test";
import { createRuntimeResultFromMerge, shouldPrepareLedgerWriteback } from "../src/kernel/runtime-result-builder.mjs";

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

test("a blocked merge cannot advertise deterministic ledger writeback", () => {
  const selectedGap = {
    id: "CASE-1:implementation_state",
    case_id: "CASE-1",
    facet: "implementation_state",
    responsibility: "agent",
    current_state: "unresolved",
    target_state: "resolved",
    next_transition: "Accept implementation evidence."
  };
  const review = {
    status: "continue",
    summary: "Accept the implementation delta, but Runtime Guard blocked the round.",
    accepted_case_state_delta: {
      facets: [{
        facet: "implementation_state",
        set: { resolution: "resolved" },
        evidence: ["focused tests passed"]
      }],
      resolved_open_questions: [],
      completed_handoffs: [],
      completion_review_result: null,
      resolved_review_findings: [],
      review_budget_extension: null
    },
    case_resolution: {
      claimed_status: "unresolved",
      reason: "Verification remains unresolved.",
      unresolved: ["verification_state"]
    },
    project_impact_candidate: { status: "none", changes: [], evidence: [] },
    continuation_intent: {
      goal: "Replan the blocked round.",
      state_transition: "blocked -> replanned",
      next_prompt: "Replan from current evidence."
    }
  };
  const mergeResult = {
    evidence: ["focused tests passed"],
    changed_files: ["sources/src/example.cpp"],
    artifact_ownership_scan: emptyOwnershipScan(),
    source_projection_check: {
      source_facts_changed: [],
      projection_artifacts_changed: [],
      source_unknown: false,
      deferred_projections: [],
      blocked_projections: ["artifact scope mismatch"]
    },
    report_intake: {
      accepted: ["TASK-1"],
      rejected: [],
      needs_revision: [],
      needs_controller_decision: [],
      needs_human_decision: [],
      missing: []
    },
    loop_gate: {
      status: "blocked",
      next_responsibility: "agent",
      trigger_mode: "manual_bridge",
      human_decision_required: false,
      reason: "Runtime Guard blocked the round."
    },
    controller_reducer_result: {
      controller_review: review,
      controller_review_failure_reason: ""
    }
  };
  const result = createRuntimeResultFromMerge({
    mergeResult,
    reports: [{ status: "completed" }],
    loopFrame: {
      case_id: "CASE-1",
      case_updated_at: "2026-08-04T00:00:00.000Z",
      project_updated_at: "2026-08-04T00:00:00.000Z",
      controller_frame: {
        route_plan: { selected_gap: selectedGap },
        controller_plan: { continuation_intent: review.continuation_intent }
      },
      execution_gate: { status: "authorized" },
      executor_binding: { executor: "desktop_runtime" },
      worker_packets: []
    },
    round: {
      gap_id: selectedGap.id,
      facet: selectedGap.facet,
      round_goal: "Accept implementation evidence.",
      required_context_refs: [],
      stop_conditions: [],
      max_auto_rounds: 8
    },
    compiledPrompt: {
      conversation_locale: "en",
      output_schema: "runtime/arckit-runtime/schemas/runtime-result.schema.json"
    },
    dryRun: false,
    roundState: { state: "merge_ready", history: [] }
  });

  assert.equal(shouldPrepareLedgerWriteback(mergeResult), false);
  assert.equal(result.round_outcome.status, "blocked");
  assert.equal(result.case_transition.round_outcome, "blocked");
  assert.equal(result.ledger_stage.status, "blocked");
  assert.equal(result.ledger_stage.gate_required, false);
  assert.equal(result.ledger_stage.writeback_required, false);
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
