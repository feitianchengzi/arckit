import { safeSemanticText, SEMANTIC_LIMITS } from './context-boundary.mjs';

export function selectNextRound(snapshot, options = {}) {
  const taskGoal = safeSemanticText(options.task, { maxLength: SEMANTIC_LIMITS.goal });
  const selectionContext = snapshot.projectState.advancement?.selection_context || {};
  const activeCases = Array.isArray(snapshot.activeCases) ? snapshot.activeCases : [];
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
  const candidateProjectGaps = (snapshot.projectState.advancement?.project_gaps || []).map((gap) => ({
    id: gap.id || '',
    goal: gap.goal || '',
    reason: gap.reason || '',
    affects: gap.affects || [],
    priority_basis: gap.priority_basis || {},
    dependencies: gap.dependencies || [],
    candidate_case_ref: gap.candidate_case_ref || '',
  }));
  const roundGoal = taskGoal
    || safeSemanticText(selectionContext.next_case_intent, { maxLength: SEMANTIC_LIMITS.transition })
    || 'Select or create a bounded Case, then advance one evidence-backed Case State transition.';

  return {
    gap_id: 'CASE-GAP-AGENT-SELECTED',
    scope: 'case',
    case_id: '',
    case_updated_at: '',
    goal: roundGoal,
    reason: activeCases.length
      ? 'The Agent must semantically select one active Case for this Loop and advance one of its current candidate gaps; Runtime does not preselect Case identity.'
      : 'Project State has no active Case; the Agent must create one before gap execution.',
    derived_from: activeCases.length ? ['active_cases', 'project_state'] : ['project_state', 'user_intent'],
    blocked_by: [],
    priority_basis: { blocking: 'high', uncertainty: 'medium', risk: 'medium', user_impact: 'high' },
    responsibility: 'agent',
    evidence_required: ['A semantic Case control or one evidence-backed Case transition.'],
    round_goal: roundGoal,
    candidate_cases: candidateCases,
    candidate_case_gaps: [],
    candidate_project_gaps: candidateProjectGaps,
    case_control: {
      next_case_intent: safeSemanticText(selectionContext.next_case_intent || '', { maxLength: SEMANTIC_LIMITS.transition }),
      priority_basis: safeSemanticText(selectionContext.priority_basis || '', { maxLength: SEMANTIC_LIMITS.reason }),
      stop_condition: safeSemanticText(selectionContext.stop_condition || '', { maxLength: SEMANTIC_LIMITS.reason }),
    },
    conversation_locale: options.conversationLocale || 'en',
    required_outputs: ['case_transition', 'round_outcome', 'case_outcome', 'project_state_delta', 'loop_handoff'],
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
    max_auto_rounds: options.maxNoProgressRounds || 8,
  };
}

function compact(values) {
  return values.filter(Boolean);
}
