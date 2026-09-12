const VERSION = 'arckit-case-execution/v1';

// Host recovery state, never an Agent claim or a replacement for canonical Case state.
export function isCaseCheckpoint(value) {
  if (value?.schema_version !== VERSION || !['loop', 'completed'].includes(value.phase)
    || !Array.isArray(value.case_chain) || !Array.isArray(value.trusted_ledger_changed_files)) return false;
  const ids = new Set();
  for (const [index, link] of value.case_chain.entries()) {
    if (typeof link?.case_id !== 'string' || !link.case_id.trim() || ids.has(link.case_id)) return false;
    if (!index && (link.predecessor_case_id !== '' || link.discovery !== null)) return false;
    if (index && (link.predecessor_case_id !== value.case_chain[index - 1].case_id
      || !isDiscovery(link.discovery) || link.discovery.source_case_id !== link.predecessor_case_id)) return false;
    ids.add(link.case_id);
  }
  if (value.case_id !== (value.case_chain.at(-1)?.case_id || '')) return false;
  if (value.pending_continuation && (!value.case_id || value.phase !== 'loop'
    || value.pending_continuation.source_case_id !== value.case_id || !isDiscovery(value.pending_continuation))) return false;
  return value.trusted_ledger_changed_files.every((item) => typeof item === 'string');
}

export function createCaseCheckpoint(context = {}) {
  if (context.case_checkpoint) {
    if (!isCaseCheckpoint(context.case_checkpoint)) throw new Error('Invalid Runtime execution checkpoint.');
    return structuredClone(context.case_checkpoint);
  }
  const caseId = String(context.case_id || '');
  return {
    schema_version: VERSION, phase: 'loop', case_id: caseId,
    case_chain: caseId ? [{ case_id: caseId, predecessor_case_id: '', discovery: null }] : [],
    pending_continuation: null,
    trusted_ledger_changed_files: [...new Set(context.trusted_ledger_changed_files || [])]
  };
}

export function acceptLedgerCheckpoint(previous, ledger) {
  if (ledger?.written !== true) return previous;
  const next = structuredClone(previous);
  const ids = [...new Set([ledger.case_control_result?.case_id, ledger.case_transition_result?.case_id, ledger.command_receipt?.case_id].filter(Boolean))];
  if (ids.length > 1) throw new Error('Conflicting Case identities in a trusted Ledger receipt.');
  const caseId = ids[0] || next.case_id;
  if (caseId && caseId !== next.case_id) {
    if (next.case_id && (!next.pending_continuation || next.case_chain.some((link) => link.case_id === caseId))) {
      throw new Error('Case binding changed without an accepted continuation.');
    }
    next.case_chain.push({ case_id: caseId, predecessor_case_id: next.case_id, discovery: next.pending_continuation });
    next.case_id = caseId;
    next.pending_continuation = null;
  }
  next.trusted_ledger_changed_files = [...new Set([...next.trusted_ledger_changed_files, ...(ledger.changed_files || [])])];
  next.phase = acceptedCaseCompletion(ledger) && !next.pending_continuation ? 'completed' : 'loop';
  return next;
}

export function resumeCaseCheckpoint(previous, discovery) {
  if (previous.phase !== 'completed' || !previous.case_id || !isDiscovery(discovery)) {
    throw new Error('Continuation requires an accepted Case completion and concrete discovery evidence.');
  }
  return { ...structuredClone(previous), phase: 'loop', pending_continuation: {
    source_case_id: previous.case_id, summary: discovery.summary, evidence: [...discovery.evidence]
  } };
}

export function caseRuntimeContext(context = {}, checkpoint) {
  return {
    ...context, case_id: checkpoint.case_id,
    case_binding: checkpoint.case_id ? {
      status: 'bound', case_id: checkpoint.case_id, source: 'runtime_ledger',
      case_ids: checkpoint.case_chain.map((link) => link.case_id)
    } : { status: 'unbound', case_ids: [], observations: [] },
    case_checkpoint: structuredClone(checkpoint)
  };
}

export function acceptedCaseCompletion(ledger) {
  if (ledger?.written !== true) return false;
  const resolution = ledger.case_transition_result?.case_resolution;
  return resolution?.status === 'resolved' || resolution?.loop_handoff?.next_responsibility === 'none'
    || ledger.case_control_result?.action === 'bind_closed_case';
}

function isDiscovery(value) {
  return typeof value?.summary === 'string' && value.summary.trim().length > 0
    && Array.isArray(value.evidence) && value.evidence.every((item) => typeof item === 'string')
    && value.evidence.some((item) => item.trim());
}
