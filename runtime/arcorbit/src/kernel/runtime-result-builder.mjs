import { readFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { buildArtifactOwnershipScan, createArtifactImpactScan } from "../artifact-ownership-map.mjs";

const runtimeRoot = join(dirname(fileURLToPath(import.meta.url)), "../..");
const casePolicyRef = "runtime/arcorbit/config/case-policy.json";
const casePolicyPath = join(runtimeRoot, "config/case-policy.json");

export async function createCaseControlRuntimeResult({ controllerPlan, loopFrame, round, snapshot, compiledPrompt, roundState }) {
  const policy = JSON.parse(await readFile(casePolicyPath, "utf8"));
  const maxReviewCycles = policy?.completion_review?.max_autonomous_cycles;
  if (policy?.schema_version !== "arckit-case-policy/v1" || !Number.isInteger(maxReviewCycles) || maxReviewCycles < 1) {
    throw new Error(`Invalid Runtime Case policy: ${casePolicyPath}`);
  }
  const control = (controllerPlan?.execution_plan?.runtime_actions || []).find((action) => action?.type === "case_control");
  if (!control) throw new Error("Agent result does not contain a case_control Runtime action.");
  const reusesClosedCase = control.action === "bind_closed_case";
  const reason = reusesClosedCase
    ? `Agent requested trusted reuse of closed resolved Case ${control.case_id}: ${control.coverage_reason}.`
    : `Agent requested creation and registration of a bounded Case: ${control.title}.`;
  const handoff = {
    schema_version: "arckit-case-control-handoff/v1",
    action: control.action,
    expected_project_revision: snapshot.projectState?.project?.revision ?? 0,
    ...(reusesClosedCase ? {
      case_id: control.case_id || "",
      expected_case_updated_at: control.expected_case_updated_at || "",
      case_source_digest: control.case_source_digest || "",
      coverage_reason: control.coverage_reason || "",
      coverage_evidence: control.coverage_evidence || []
    } : {
      case_id: control.case_id || "",
      title: control.title || "",
      intent: control.intent || "",
      expected_outcome: control.expected_outcome || "",
      artifact_type: control.artifact_type || "unknown",
      selection_reason: control.selection_reason || "",
      initial_facts: control.initial_facts || [],
      initial_impacts: control.initial_impacts || [],
      initial_gaps: control.initial_gaps || [],
      review_policy: { max_autonomous_cycles: maxReviewCycles, source: casePolicyRef }
    })
  };
  const ownership = buildArtifactOwnershipScan([]);
  const nextPrompt = controllerPlan.continuation_intent.next_prompt;
  const state = {
    ...(roundState || {}),
    state: "ledger_gate_ready",
    history: [...(roundState?.history || []), { state: "ledger_gate_ready", at: new Date().toISOString(), reason }]
  };
  return {
    schema_version: "arckit-runtime-result/v2",
    round_result: reusesClosedCase ? "done" : "continue",
    round_outcome: { status: "completed", reason },
    case_outcome: { status: reusesClosedCase ? "resolved" : "unresolved", reason, unresolved: reusesClosedCase ? [] : ["case_control"] },
    project_state_delta: {
      software_definition_changes: [],
      software_invariant_changes: [],
      project_gap_changes: [],
      selection_context_change: null,
      evidence: []
    },
    case_transition: null,
    case_control_handoff: handoff,
    round_state: state.state,
    round_state_history: state.history,
    summary: reason,
    changed_files: [],
    artifact_impact_scan: createArtifactImpactScan(ownership, { dryRun: false }),
    artifact_ownership_scan: ownership,
    source_projection_check: {
      source_facts_changed: [], projection_artifacts_changed: [], source_unknown: false,
      deferred_projections: [reusesClosedCase
        ? "Task binding is pending deterministic closed Case validation."
        : "Case creation is pending deterministic ledger application."], blocked_projections: []
    },
    agent_loop_result: { schema_version: "arckit-agent-loop-projection/v1", action: "case_control", control_handoff: handoff },
    controller_frame: loopFrame.controller_frame,
    execution_gate: loopFrame.execution_gate,
    executor_binding: loopFrame.executor_binding,
    ledger_stage: {
      schema_version: "arckit-ledger-stage/v1", status: "gate_ready", gate_required: true, writeback_required: true, reason
    },
    validation_evidence: unique(["runtime/arcorbit/schemas/agent-loop-result.schema.json", casePolicyRef, compiledPrompt.output_schema]),
    loop_handoff: {
      version: "loop-handoff/v2", status: reusesClosedCase ? "done" : "continue", next_responsibility: reusesClosedCase ? "none" : "agent", agent_continuation_available: !reusesClosedCase,
      human_decision_required: false, trigger_mode: reusesClosedCase ? "none" : "auto_bridge", responsibility_reason: reason, next_prompt: reusesClosedCase ? "" : nextPrompt,
      agent_instruction: {
        goal: controllerPlan.continuation_intent.goal,
        required_context_refs: round.required_context_refs,
        required_actions: reusesClosedCase ? [] : ["Reload Project and Case State after deterministic Case creation."],
        required_checks: reusesClosedCase
          ? ["trusted closed Case reuse receipt", "authoritative task-to-Case binding"]
          : ["registered Case ref", "fresh Case revision", "derived candidate_gaps"],
        stop_condition: (round.stop_conditions || []).join(" ")
      },
      human_gate: { required: false, reason: "", decision_needed: "" },
      progress_guard: {
        expected_state_change: controllerPlan.continuation_intent.state_transition,
        actual_state_change: reusesClosedCase
          ? "Agent produced an authorized closed Case reuse claim pending deterministic validation."
          : "Agent produced an authorized Case control handoff pending deterministic ledger application.",
        no_progress_limit: 2,
        max_auto_rounds: Number.isInteger(round.max_auto_rounds) ? round.max_auto_rounds : 8
      }
    }
  };
}

function unique(values) {
  return [...new Set(values.filter(Boolean))];
}
