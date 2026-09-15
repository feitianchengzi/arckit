import { readFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { buildArtifactOwnershipScan, createArtifactImpactScan } from "../artifact-ownership-map.mjs";
import { loadRuntimeCapabilityForEntrypoint, resolveCapabilityContract } from "../capability-registry.mjs";

const runtimeRoot = join(dirname(fileURLToPath(import.meta.url)), "../..");
const casePolicyRef = "runtime/arcorbit/config/case-policy.json";
const casePolicyPath = join(runtimeRoot, "config/case-policy.json");

export async function createCaseControlRuntimeResult({ controllerPlan, loopFrame, round, snapshot, compiledPrompt, roundState, contract }) {
  contract ||= resolveCapabilityContract(await loadRuntimeCapabilityForEntrypoint({ projectRoot: snapshot.projectRoot, entrypoint: "case_control" }), "case_control");
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
    schema_version: contract.schema_version,
    action: control.action,
    expected_project_revision: snapshot.projectState?.project?.revision ?? 0,
    ...Object.fromEntries(Object.entries(control).filter(([key]) => !["type", "schema_version", "expected_project_revision", "review_policy"].includes(key))),
    ...(control.action === "create_case" ? { review_policy: { max_autonomous_cycles: maxReviewCycles, source: casePolicyRef } } : {})
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
      human_gate: { required: false, reason: "", decision_needed: "" }
    }
  };
}

function unique(values) {
  return [...new Set(values.filter(Boolean))];
}
