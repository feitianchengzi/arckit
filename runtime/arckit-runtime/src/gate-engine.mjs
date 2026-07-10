import { validateRuntimeResult } from "./validator.mjs";

export function evaluateRuntimeGates({ runtimeResult, snapshot = null, envelope = null }) {
  const validation = validateRuntimeResult(runtimeResult);
  const reasons = [];
  const warnings = [];

  if (!validation.valid) {
    reasons.push(...validation.issues.map((issue) => `${issue.path}: ${issue.message}`));
  }

  const roundResult = runtimeResult?.round_result || "unknown";
  const ledgerStage = runtimeResult?.ledger_stage || {};
  const progressWriteback = roundResult === "continue"
    && ledgerStage.status === "gate_ready"
    && ledgerStage.writeback_required === true
    && runtimeResult?.loop_handoff?.next_responsibility === "agent"
    && runtimeResult?.loop_handoff?.human_decision_required !== true;

  if (roundResult !== "done" && !progressWriteback) {
    reasons.push(`round_result=${roundResult} is not eligible for automatic ledger writeback.`);
  }

  if (ledgerStage.status && ledgerStage.status !== "gate_ready") {
    reasons.push(`ledger_stage.status=${ledgerStage.status} is not eligible for automatic ledger writeback.`);
  }

  if (runtimeResult?.loop_handoff?.human_decision_required === true) {
    reasons.push("human_decision_required=true blocks automatic ledger writeback.");
  }

  if (runtimeResult?.loop_handoff?.next_responsibility === "human") {
    reasons.push("next_responsibility=human blocks automatic ledger writeback.");
  }

  if (runtimeResult?.loop_handoff?.trigger_mode === "user_decision") {
    reasons.push("trigger_mode=user_decision blocks automatic ledger writeback.");
  }

  const validationEvidence = runtimeResult?.validation_evidence;
  if (!Array.isArray(validationEvidence) || validationEvidence.length === 0) {
    reasons.push("validation_evidence must be non-empty for ledger writeback.");
  }

  const sourceProjection = runtimeResult?.source_projection_check || {};
  const sourceChanged = Array.isArray(sourceProjection.source_facts_changed)
    ? sourceProjection.source_facts_changed
    : [];
  const projectionsChanged = Array.isArray(sourceProjection.projection_artifacts_changed)
    ? sourceProjection.projection_artifacts_changed
    : [];
  const ownership = runtimeResult?.artifact_ownership_scan || {};
  const ownedSourceChanged = Array.isArray(ownership.source_facts_changed) ? ownership.source_facts_changed : [];
  const ownedProjectionsChanged = Array.isArray(ownership.projection_artifacts_changed) ? ownership.projection_artifacts_changed : [];
  const ownedPendingItems = Array.isArray(ownership.pending_items) ? ownership.pending_items : [];
  const unknownArtifacts = Array.isArray(ownership.unknown_artifacts) ? ownership.unknown_artifacts : [];
  if (sourceProjection.source_unknown === true && sourceChanged.length === 0 && projectionsChanged.length > 0) {
    reasons.push("source_unknown=true with projection-only changes blocks ledger writeback.");
  }

  if (ownedProjectionsChanged.length > 0 && ownedSourceChanged.length === 0 && sourceChanged.length === 0) {
    reasons.push(`artifact ownership map detected projection-only changes: ${ownedProjectionsChanged.join(", ")}`);
  }

  if (unknownArtifacts.length > 0) {
    reasons.push(`artifact ownership map contains unknown artifacts: ${unknownArtifacts.join(", ")}`);
  }

  const blockedProjections = Array.isArray(sourceProjection.blocked_projections) ? sourceProjection.blocked_projections : [];
  if (blockedProjections.length > 0 && !progressWriteback) {
    reasons.push("blocked_projections is non-empty.");
  } else if (blockedProjections.length > 0) {
    warnings.push("blocked_projections remain unresolved; progress writeback will record evidence without closing the loop.");
  }

  if (progressWriteback) {
    const intake = runtimeResult?.report_intake || {};
    const unresolvedReports = [
      ...(Array.isArray(intake.rejected) ? intake.rejected : []),
      ...(Array.isArray(intake.needs_revision) ? intake.needs_revision : []),
      ...(Array.isArray(intake.needs_human_decision) ? intake.needs_human_decision : []),
      ...(Array.isArray(intake.missing) ? intake.missing : [])
    ];
    if (unresolvedReports.length > 0) {
      reasons.push(`progress writeback requires resolved report intake; unresolved reports: ${unresolvedReports.join(", ")}`);
    }
    const ledgerOwnedChanged = (runtimeResult?.changed_files || []).some((path) => /^arckit\/(project|cases)\//.test(path));
    if (sourceChanged.length === 0 && ownedSourceChanged.length === 0 && ownedPendingItems.length === 0 && !ledgerOwnedChanged) {
      reasons.push("progress writeback requires source facts, pending items, or ledger-owned changed files.");
    }
  }

  const unsafeChangedFiles = findUnsafeChangedFiles(runtimeResult?.changed_files || []);
  if (unsafeChangedFiles.length > 0) {
    reasons.push(`changed_files contains unsafe paths: ${unsafeChangedFiles.join(", ")}`);
  }

  const selectedRound = envelope?.selected_round || null;
  if (!selectedRound?.gap_id) {
    warnings.push("runtime envelope has no selected_round.gap_id; ledger writeback will record evidence but cannot close a selected gap.");
  }
  if (snapshot && selectedRound?.gap_id) {
    const exists = (snapshot.projectState?.state_gaps || []).some((gap) => gap.id === selectedRound.gap_id);
    if (!exists) {
      warnings.push(`selected_round.gap_id is not present in current project state: ${selectedRound.gap_id}`);
    }
  }

  return {
    schema_version: "arckit-runtime-gate/v1",
    allowed: reasons.length === 0,
    decision: reasons.length === 0 ? "allow" : "block",
    reasons,
    warnings,
    write_scope: reasons.length === 0
      ? ["runtime_execution_record", "project_state", "iteration_state", "active_case", "indexes_and_projections"]
      : [],
    validation,
    selected_round: selectedRound
  };
}

function findUnsafeChangedFiles(paths) {
  return paths.filter((item) => {
    if (typeof item !== "string" || item.length === 0) {
      return true;
    }
    return item.startsWith("/") || item.includes("..") || item.includes("\0");
  });
}
