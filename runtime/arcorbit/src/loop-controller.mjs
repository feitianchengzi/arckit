import { safeSemanticText, SEMANTIC_LIMITS } from './context-boundary.mjs';

export function selectNextRound(snapshot, options = {}) {
  const taskGoal = safeSemanticText(options.task, { maxLength: SEMANTIC_LIMITS.goal });
  if (snapshot?.compatibility?.status === 'incompatible') {
    return protocolRecoveryRound(snapshot, options, taskGoal);
  }
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
  const candidateProjectGaps = (snapshot.candidateCatalog?.persisted_candidates || [])
    .filter((item) => item.kind === 'project_gap')
    .map((item) => item.gap);
  const roundGoal = taskGoal
    || safeSemanticText(selectionContext.next_case_intent, { maxLength: SEMANTIC_LIMITS.transition })
    || 'Select or create a bounded Case, then advance one evidence-backed Case State transition.';

  return {
    gap_id: 'CASE-GAP-AGENT-SELECTED',
    scope: 'case',
    case_id: '',
    case_updated_at: '',
    goal: roundGoal,
    reason: 'Fresh canonical candidates for the Agent; selection and execution intent belong to the active skill and current user instruction.',
    derived_from: activeCases.length ? ['active_cases', 'project_state'] : ['project_state', 'user_intent'],
    blocked_by: [],
    priority_basis: {},
    responsibility: 'agent',
    evidence_required: ['A semantic Case control or one evidence-backed Case transition.'],
    round_goal: roundGoal,
    candidate_cases: candidateCases,
    candidate_case_gaps: [],
    candidate_project_gaps: candidateProjectGaps,
    candidate_catalog: snapshot.candidateCatalog || { persisted_candidates: [], persisted_obligations: [] },
    case_control: {
      next_case_intent: safeSemanticText(selectionContext.next_case_intent || '', { maxLength: SEMANTIC_LIMITS.transition }),
      priority_basis: safeSemanticText(selectionContext.priority_basis || '', { maxLength: SEMANTIC_LIMITS.reason }),
      stop_condition: safeSemanticText(selectionContext.stop_condition || '', { maxLength: SEMANTIC_LIMITS.reason }),
    },
    conversation_locale: options.conversationLocale || 'en',
    required_outputs: ['case_command', 'round_outcome', 'case_outcome', 'loop_handoff'],
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
    stop_conditions: [],
  };
}

function protocolRecoveryRound(snapshot, options, taskGoal) {
  const compatibility = snapshot.compatibility;
  return {
    gap_id: 'LEDGER-PROTOCOL-RECOVERY',
    scope: 'ledger',
    case_id: '',
    case_updated_at: '',
    goal: 'Restore canonical Project/Case/Iteration readability under the current ledger protocol, then fresh-read and resume the original user intent.',
    reason: `Canonical state is unavailable: ${compatibility.recovery_mode}; affected refs: ${(compatibility.affected_refs || []).join(', ') || 'unknown'}.`,
    derived_from: ['protocol_compatibility', compatibility.snapshot_token],
    blocked_by: [],
    priority_basis: { blocking: 'critical', uncertainty: 'high', risk: 'high', user_impact: 'high' },
    responsibility: 'agent',
    evidence_required: ['trusted protocol reconciliation result', 'post-write compatible probe'],
    round_goal: taskGoal || 'Recover the canonical ledger protocol without advancing ordinary Case work.',
    candidate_cases: [],
    candidate_case_gaps: [],
    candidate_project_gaps: [],
    case_control: {},
    conversation_locale: options.conversationLocale || 'en',
    required_outputs: ['trusted_protocol_reconciliation_or_explicit_recovery_handoff'],
    required_context_refs: compact([
      ...(compatibility.affected_refs || []),
    ]),
    stop_conditions: [
      'Do not create or advance a normal Case while canonical state is incompatible.',
      'Stop for human input if semantic preservation cannot be established from durable facts.',
      'After trusted reconciliation, return an Agent continuation that requires a fresh canonical read.',
    ],
  };
}

function compact(values) {
  return values.filter(Boolean);
}
