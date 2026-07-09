const ARTIFACT_KEYS = [
  "project",
  "intake",
  "cases",
  "spec",
  "interaction",
  "visual",
  "tech",
  "debug",
  "pending",
  "workflow_memory",
  "agent_context",
  "handoff"
];

export function validateRuntimeResult(result) {
  const issues = [];

  requireObject(result, "result", issues);
  requireEqual(result?.schema_version, "arckit-runtime-result/v1", "schema_version", issues);
  requireEnum(result?.round_result, ["done", "continue", "blocked", "needs_human", "external_wait"], "round_result", issues);
  requireEnum(result?.round_state, [
    "planned",
    "authorized",
    "workers_running",
    "reports_collected",
    "merge_ready",
    "ledger_gate_ready",
    "ledger_written",
    "next_round_ready",
    "blocked",
    "human_gate_required",
    "external_wait",
    "failed"
  ], "round_state", issues);
  requireArray(result?.round_state_history, "round_state_history", issues);
  requireArray(result?.changed_files, "changed_files", issues);
  requireObject(result?.artifact_impact_scan, "artifact_impact_scan", issues);
  for (const key of ARTIFACT_KEYS) {
    requireString(result?.artifact_impact_scan?.[key], `artifact_impact_scan.${key}`, issues);
  }
  requireObject(result?.artifact_ownership_scan, "artifact_ownership_scan", issues);
  requireEqual(result?.artifact_ownership_scan?.schema_version, "arckit-artifact-ownership-scan/v1", "artifact_ownership_scan.schema_version", issues);
  requireArray(result?.artifact_ownership_scan?.classified, "artifact_ownership_scan.classified", issues);
  requireArray(result?.artifact_ownership_scan?.source_facts_changed, "artifact_ownership_scan.source_facts_changed", issues);
  requireArray(result?.artifact_ownership_scan?.projection_artifacts_changed, "artifact_ownership_scan.projection_artifacts_changed", issues);
  requireArray(result?.artifact_ownership_scan?.implementation_evidence, "artifact_ownership_scan.implementation_evidence", issues);
  requireArray(result?.artifact_ownership_scan?.pending_items, "artifact_ownership_scan.pending_items", issues);
  requireArray(result?.artifact_ownership_scan?.runtime_logs, "artifact_ownership_scan.runtime_logs", issues);
  requireArray(result?.artifact_ownership_scan?.unknown_artifacts, "artifact_ownership_scan.unknown_artifacts", issues);
  requireObject(result?.source_projection_check, "source_projection_check", issues);
  requireArray(result?.source_projection_check?.source_facts_changed, "source_projection_check.source_facts_changed", issues);
  requireArray(result?.source_projection_check?.projection_artifacts_changed, "source_projection_check.projection_artifacts_changed", issues);
  requireBoolean(result?.source_projection_check?.source_unknown, "source_projection_check.source_unknown", issues);
  requireArray(result?.source_projection_check?.deferred_projections, "source_projection_check.deferred_projections", issues);
  requireArray(result?.source_projection_check?.blocked_projections, "source_projection_check.blocked_projections", issues);
  requireObject(result?.controller_reducer_result, "controller_reducer_result", issues);
  requireObject(result?.controller_frame, "controller_frame", issues);
  requireObject(result?.execution_gate, "execution_gate", issues);
  requireObject(result?.executor_binding, "executor_binding", issues);
  requireArray(result?.worker_packets, "worker_packets", issues);
  requireObject(result?.report_intake, "report_intake", issues);
  requireObject(result?.ledger_stage, "ledger_stage", issues);
  requireEqual(result?.ledger_stage?.schema_version, "arckit-ledger-stage/v1", "ledger_stage.schema_version", issues);
  requireEnum(result?.ledger_stage?.status, ["not_ready", "gate_ready", "gate_blocked", "human_blocked", "blocked", "written"], "ledger_stage.status", issues);
  requireBoolean(result?.ledger_stage?.gate_required, "ledger_stage.gate_required", issues);
  requireBoolean(result?.ledger_stage?.writeback_required, "ledger_stage.writeback_required", issues);
  requireString(result?.ledger_stage?.reason, "ledger_stage.reason", issues);
  requireArray(result?.validation_evidence, "validation_evidence", issues);
  requireObject(result?.loop_handoff, "loop_handoff", issues);
  requireEqual(result?.loop_handoff?.version, "loop-handoff/v1", "loop_handoff.version", issues);
  requireEnum(result?.loop_handoff?.status, ["continue", "done", "needs_human", "blocked", "deferred"], "loop_handoff.status", issues);
  requireEnum(result?.loop_handoff?.next_responsibility, ["agent", "human", "external", "none"], "loop_handoff.next_responsibility", issues);
  requireBoolean(result?.loop_handoff?.agent_continuation_available, "loop_handoff.agent_continuation_available", issues);
  requireBoolean(result?.loop_handoff?.human_decision_required, "loop_handoff.human_decision_required", issues);
  requireEnum(result?.loop_handoff?.trigger_mode, ["manual_bridge", "auto_bridge", "user_decision", "external_wait", "none"], "loop_handoff.trigger_mode", issues);
  requireString(result?.loop_handoff?.responsibility_reason, "loop_handoff.responsibility_reason", issues);
  requireString(result?.loop_handoff?.next_prompt, "loop_handoff.next_prompt", issues);
  requireObject(result?.loop_handoff?.agent_instruction, "loop_handoff.agent_instruction", issues);
  requireString(result?.loop_handoff?.agent_instruction?.goal, "loop_handoff.agent_instruction.goal", issues);
  requireArray(result?.loop_handoff?.agent_instruction?.required_context_refs, "loop_handoff.agent_instruction.required_context_refs", issues);
  requireArray(result?.loop_handoff?.agent_instruction?.required_actions, "loop_handoff.agent_instruction.required_actions", issues);
  requireArray(result?.loop_handoff?.agent_instruction?.required_checks, "loop_handoff.agent_instruction.required_checks", issues);
  requireString(result?.loop_handoff?.agent_instruction?.stop_condition, "loop_handoff.agent_instruction.stop_condition", issues);
  requireObject(result?.loop_handoff?.human_gate, "loop_handoff.human_gate", issues);
  requireBoolean(result?.loop_handoff?.human_gate?.required, "loop_handoff.human_gate.required", issues);
  requireString(result?.loop_handoff?.human_gate?.reason, "loop_handoff.human_gate.reason", issues);
  requireString(result?.loop_handoff?.human_gate?.decision_needed, "loop_handoff.human_gate.decision_needed", issues);
  requireObject(result?.loop_handoff?.progress_guard, "loop_handoff.progress_guard", issues);
  requireString(result?.loop_handoff?.progress_guard?.expected_state_change, "loop_handoff.progress_guard.expected_state_change", issues);
  requireString(result?.loop_handoff?.progress_guard?.actual_state_change, "loop_handoff.progress_guard.actual_state_change", issues);
  requireInteger(result?.loop_handoff?.progress_guard?.no_progress_limit, "loop_handoff.progress_guard.no_progress_limit", issues);
  requireInteger(result?.loop_handoff?.progress_guard?.max_auto_rounds, "loop_handoff.progress_guard.max_auto_rounds", issues);

  if (result?.loop_handoff?.human_decision_required && result?.loop_handoff?.next_responsibility !== "human") {
    issues.push({
      path: "loop_handoff",
      message: "human_decision_required=true requires next_responsibility=human."
    });
  }

  if (result?.loop_handoff?.next_responsibility === "agent" && result?.loop_handoff?.trigger_mode === "user_decision") {
    issues.push({
      path: "loop_handoff.trigger_mode",
      message: "agent continuation must use manual_bridge or auto_bridge, not user_decision."
    });
  }

  return {
    valid: issues.length === 0,
    issues
  };
}

function requireObject(value, path, issues) {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    issues.push({ path, message: "Expected object." });
  }
}

function requireArray(value, path, issues) {
  if (!Array.isArray(value)) {
    issues.push({ path, message: "Expected array." });
  }
}

function requireString(value, path, issues) {
  if (typeof value !== "string") {
    issues.push({ path, message: "Expected string." });
  }
}

function requireBoolean(value, path, issues) {
  if (typeof value !== "boolean") {
    issues.push({ path, message: "Expected boolean." });
  }
}

function requireInteger(value, path, issues) {
  if (!Number.isInteger(value)) {
    issues.push({ path, message: "Expected integer." });
  }
}

function requireEnum(value, allowed, path, issues) {
  if (!allowed.includes(value)) {
    issues.push({ path, message: `Expected one of: ${allowed.join(", ")}.` });
  }
}

function requireEqual(value, expected, path, issues) {
  if (value !== expected) {
    issues.push({ path, message: `Expected ${JSON.stringify(expected)}.` });
  }
}
