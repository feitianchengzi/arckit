const URGENCY_RANK = {
  critical: 4,
  high: 3,
  medium: 2,
  low: 1
};

export function selectNextRound(snapshot, options = {}) {
  const gaps = Array.isArray(snapshot.projectState.state_gaps)
    ? snapshot.projectState.state_gaps
    : [];
  const selectedGap = [...gaps].sort(compareGapPriority)[0] || null;
  const loopControl = snapshot.projectState.loop_control || {};
  const dimension = selectedGap?.dimension || "unknown";
  const dimensionState = snapshot.projectState.completeness_dimensions?.[dimension] || {};

  const roundGoal = selectedGap?.next_transition
    || dimensionState.next_transition
    || loopControl.next_transition
    || "Inspect project state and produce a safe next-round handoff.";

  return {
    gap_id: selectedGap?.id || "NO-GAP",
    dimension,
    urgency: selectedGap?.urgency || "low",
    risk: selectedGap?.risk || "low",
    current_state: selectedGap?.current_state || dimensionState.current_state || "unknown",
    target_state: selectedGap?.target_state || dimensionState.target_state || "unknown",
    impact: selectedGap?.impact || dimensionState.gap || "",
    round_goal: roundGoal,
    conversation_locale: options.conversationLocale || "en",
    required_outputs: [
      "artifact_impact_scan",
      "source_projection_check",
      "runtime_result",
      "loop_handoff"
    ],
    required_context_refs: compact([
      snapshot.paths.projectState,
      snapshot.paths.stateBrief,
      snapshot.paths.activeIteration,
      ...(Array.isArray(snapshot.paths.activeCases) ? snapshot.paths.activeCases : []),
      snapshot.paths.casesIndex,
      snapshot.paths.pendingIndex,
      snapshot.paths.specIndex,
      snapshot.paths.techIndex
    ]),
    stop_conditions: [
      "Stop if source facts are unknown and the requested change would only update a projection.",
      "Stop if human_decision_required is true.",
      "Stop if validation cannot prove progress against the selected state gap.",
      "Stop if the turn would require destructive or cross-workspace actions."
    ],
    max_rounds: options.maxRounds || 1
  };
}

function compareGapPriority(left, right) {
  const urgencyDelta = (URGENCY_RANK[right.urgency] || 0) - (URGENCY_RANK[left.urgency] || 0);
  if (urgencyDelta !== 0) {
    return urgencyDelta;
  }
  return (URGENCY_RANK[right.risk] || 0) - (URGENCY_RANK[left.risk] || 0);
}

function compact(values) {
  return values.filter(Boolean);
}
