import { safeSemanticText, SEMANTIC_LIMITS } from "./context-boundary.mjs";

export function selectNextRound(snapshot, options = {}) {
  const gaps = Array.isArray(snapshot.projectState.state_gaps)
    ? snapshot.projectState.state_gaps
    : [];
  const loopControl = snapshot.projectState.loop_control || {};
  const taskGoal = safeSemanticText(options.task, { maxLength: SEMANTIC_LIMITS.goal });
  const loopTransition = safeSemanticText(loopControl.next_transition, { maxLength: SEMANTIC_LIMITS.transition });
  const roundGoal = taskGoal
    || loopTransition
    || "Analyze the operator task, project state, candidate gaps, and evidence; then choose the route and next loop handoff.";

  const candidateGaps = gaps.map((gap) => ({
    id: gap.id || "",
    dimension: gap.dimension || "",
    current_state: gap.current_state || "unknown",
    target_state: gap.target_state || "unknown",
    urgency: gap.urgency || "low",
    risk: gap.risk || "low",
    impact: gap.impact || "",
    next_transition: gap.next_transition || "",
    dependencies: Array.isArray(gap.dependencies) ? gap.dependencies : []
  }));

  return {
    gap_id: "AGENT-SELECTED",
    dimension: "agent_selected",
    urgency: "medium",
    risk: "medium",
    current_state: "unknown",
    target_state: "defined",
    impact: "Runtime did not preselect a project gap. The agent must choose the concrete workflow target from the operator task, project state, candidate gaps, and evidence.",
    round_goal: roundGoal,
    candidate_gaps: candidateGaps,
    loop_control: {
      current_loop_focus: safeSemanticText(loopControl.current_loop_focus || "", { maxLength: SEMANTIC_LIMITS.transition }),
      next_transition: loopTransition,
      priority_basis: safeSemanticText(loopControl.priority_basis || "", { maxLength: SEMANTIC_LIMITS.reason }),
      stop_condition: safeSemanticText(loopControl.stop_condition || "", { maxLength: SEMANTIC_LIMITS.reason })
    },
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
      "Stop if the route, evidence, risks, unknowns, or next loop handoff are not explicit.",
      "Stop if human_decision_required is true.",
      "Stop if validation cannot prove progress against the agent-selected route or declared state change.",
      "Stop if the turn would require destructive or cross-workspace actions."
    ],
    max_rounds: options.maxRounds || 1
  };
}

function compact(values) {
  return values.filter(Boolean);
}
