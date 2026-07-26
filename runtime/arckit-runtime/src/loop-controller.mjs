import { safeSemanticText, SEMANTIC_LIMITS } from './context-boundary.mjs';

export function selectNextRound(snapshot, options = {}) {
  const taskGoal = safeSemanticText(options.task, { maxLength: SEMANTIC_LIMITS.goal });
  const caseControl = snapshot.projectState.case_control || {};
  const activeCases = Array.isArray(snapshot.activeCases) ? snapshot.activeCases : [];
  const selectedCase = activeCases.find((item) => item.ref === caseControl.selected_case_ref) || null;
  const candidateCases = activeCases.map(({ ref, record }) => ({
    ref,
    case_id: record.id,
    title: record.title,
    status: record.status,
    updated_at: record.updated_at,
    expected_outcome: record.expected_outcome,
    case_resolution: record.case_resolution,
    candidate_gaps: record.case_resolution?.candidate_gaps || [],
  }));
  const candidateProjectGaps = (snapshot.projectState.state_gaps || []).map((gap) => ({
    id: gap.id || '',
    dimension: gap.dimension || '',
    current_state: gap.current_state || 'unknown',
    target_state: gap.target_state || 'unknown',
    impact: gap.impact || '',
    next_transition: gap.next_transition || '',
    candidate_case_ref: gap.candidate_case_ref || '',
  }));
  const candidateCaseGaps = selectedCase?.record.case_resolution?.candidate_gaps || [];
  const currentSelection = selectedCase?.record.current_round?.selected_gap || null;
  const selectedGap = currentSelection
    ? candidateCaseGaps.find((gap) => gap.id === currentSelection.id && gap.facet === currentSelection.facet) || null
    : null;
  const roundGoal = taskGoal
    || selectedGap?.next_transition
    || safeSemanticText(caseControl.next_case_intent, { maxLength: SEMANTIC_LIMITS.transition })
    || 'Select or create a bounded Case, then advance one evidence-backed Case State transition.';

  return {
    gap_id: selectedGap?.id || 'CASE-GAP-AGENT-SELECTED',
    scope: 'case',
    case_id: selectedCase?.record.id || '',
    case_updated_at: selectedCase?.record.updated_at || '',
    facet: selectedGap?.facet || '',
    current_state: selectedGap?.current_state || 'unselected',
    target_state: selectedGap?.target_state || 'evidence-backed case transition',
    next_transition: selectedGap?.next_transition || '',
    impact: selectedCase
      ? `Project selected ${selectedCase.record.id}; Controller must advance its Case State, not a project dimension directly.`
      : 'Project State has not selected a Case; Controller must select an active Case or create one before worker execution.',
    round_goal: roundGoal,
    candidate_cases: candidateCases,
    candidate_case_gaps: candidateCaseGaps,
    candidate_project_gaps: candidateProjectGaps,
    case_control: {
      selected_case_ref: caseControl.selected_case_ref || '',
      selection_reason: safeSemanticText(caseControl.selection_reason || '', { maxLength: SEMANTIC_LIMITS.reason }),
      next_case_intent: safeSemanticText(caseControl.next_case_intent || '', { maxLength: SEMANTIC_LIMITS.transition }),
      priority_basis: safeSemanticText(caseControl.priority_basis || '', { maxLength: SEMANTIC_LIMITS.reason }),
      stop_condition: safeSemanticText(caseControl.stop_condition || '', { maxLength: SEMANTIC_LIMITS.reason }),
    },
    conversation_locale: options.conversationLocale || 'en',
    required_outputs: ['case_transition', 'round_outcome', 'case_outcome', 'project_impact', 'loop_handoff'],
    required_context_refs: compact([
      snapshot.paths.projectState,
      snapshot.paths.stateBrief,
      snapshot.paths.activeIteration,
      ...snapshot.paths.activeCases,
      snapshot.paths.casesIndex,
      snapshot.paths.specIndex,
      snapshot.paths.interactionIndex,
      snapshot.paths.visualIndex,
      snapshot.paths.techIndex,
    ]),
    stop_conditions: [
      'Stop if no bounded Case and Case gap are selected.',
      'Stop if the accepted Case State delta or its evidence is incomplete.',
      'Stop when the next Case gap requires human judgment or an external result.',
      'Stop if the turn would require destructive or cross-workspace actions.',
    ],
    max_auto_rounds: options.maxAutoRounds || 8,
  };
}

function compact(values) {
  return values.filter(Boolean);
}
