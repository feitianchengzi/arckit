import { selectEffectiveLoopHandoff } from './effective-handoff.mjs';

// Execution disposition is independent of the Case resolution. This is the
// single interpretation boundary shared by live delivery and restart recovery.
export function executionOutcome({ result = null, activity = null, status = '' } = {}) {
  const runtime = result?.runtime_result;
  const handoff = selectEffectiveLoopHandoff({ runtimeResult: runtime, activity });
  const ledger = result?.ledger_write_result || activity?.ledger_write_result?.parsed;
  const reason = ledger?.rejection?.reason || ledger?.gate?.reasons?.filter(Boolean).join('\n') || activity?.error || runtime?.summary || handoff.responsibility_reason || result?.next_action || '';
  const stop = result?.stop_reason || '';
  const outcome = (state, responsibility = 'none') => ({ schema_version: 'arcorbit-execution-outcome/v1', state, responsibility, reason });
  if (result?.validation?.valid === false || ledger?.rejection
    || ((runtime?.ledger_stage?.writeback_required || activity?.ledger_stage?.writeback_required) && ledger?.written !== true)) return outcome('failed', ledger?.rejection?.responsibility || 'runtime');
  if (['invalid_result', 'no_progress_limit', 'snapshot_stale_limit', 'agent_repair_limit', 'closeout_failed', 'ledger_write_failed', 'protocol_incompatible', 'materialization_failed', 'infrastructure_recovery'].includes(stop)) return outcome('failed', 'runtime');
  if (status === 'aborted') return outcome('failed', 'runtime');
  if (status === 'failed' && !['stopped', 'case_binding_required'].includes(stop)) return outcome('failed', 'runtime');
  if (handoff.human_decision_required || handoff.next_responsibility === 'human' || stop === 'human_intervention') return outcome('needs_human', 'human');
  if (handoff.next_responsibility === 'external' || handoff.status === 'external_wait' || stop === 'external_wait') return outcome('waiting_external', 'external');
  if (stop === 'stopped') return outcome('stopped');
  const acceptedCompletion = acceptedCaseCompletion(ledger);
  if (acceptedCompletion || (stop === 'completed' && result?.closeout_result?.status === 'completed')) return outcome('completed');
  const agent = result?.agent_loop_result || activity?.agent_loop_result || runtime?.agent_loop_result;
  if (handoff.next_responsibility === 'none' && agent?.action === 'handoff') return outcome('stopped');
  if (handoff.next_responsibility === 'agent') return outcome('continue', 'agent');
  return outcome('failed', 'runtime');
}

export function acceptedCaseCompletion(ledger) {
  if (ledger?.written !== true) return false;
  const resolution = ledger.case_transition_result?.case_resolution;
  return resolution?.status === 'resolved' || resolution?.loop_handoff?.next_responsibility === 'none'
    || ledger.case_control_result?.action === 'bind_closed_case';
}
