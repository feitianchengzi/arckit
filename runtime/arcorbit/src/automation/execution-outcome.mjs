import { selectEffectiveLoopHandoff } from '../kernel/effective-handoff.mjs';
import { selectTaskCloseoutResult, taskCloseoutHandoff } from '../task-closeout-contract.mjs';
import { acceptedCaseCompletion, checkpointFromRun } from './execution-checkpoint.mjs';
export { acceptedCaseCompletion } from './execution-checkpoint.mjs';

export function executionHandoff({ result = null, activity = null } = {}) {
  const currentLedgerHandoff = result?.ledger_write_result?.written === true
    ? result.ledger_write_result.case_transition_result?.case_resolution?.loop_handoff : null;
  const currentLoopHandoff = result?.runtime_result && (Object.hasOwn(result, 'ledger_write_result')
    || result.runtime_result.ledger_stage?.writeback_required === false) ? result.runtime_result.loop_handoff : null;
  return taskCloseoutHandoff(selectTaskCloseoutResult({ result, activity }))
    || currentLedgerHandoff || currentLoopHandoff
    || selectEffectiveLoopHandoff({ runtimeResult: result?.runtime_result, activity });
}

// Execution disposition is independent of the Case resolution. This is the
// single interpretation boundary shared by live delivery and restart recovery.
export function executionOutcome({ result = null, activity = null, status = '' } = {}) {
  if (result?.execution_control?.stop_requested === true) return { schema_version: 'arcorbit-execution-outcome/v1', state: 'stopped', responsibility: 'none', reason: 'Execution stopped; unfinished Case obligations are preserved.' };
  const runtime = result?.runtime_result;
  const handoff = executionHandoff({ result, activity });
  const closeout = selectTaskCloseoutResult({ result, activity });
  const checkpoint = checkpointFromRun({ result, activity });
  const ledger = result?.ledger_write_result || activity?.ledger_write_result?.parsed;
  const reason = ledger?.rejection?.reason || ledger?.gate?.reasons?.filter(Boolean).join('\n') || activity?.error || closeout?.error || closeout?.summary || runtime?.summary || handoff.responsibility_reason || result?.next_action || '';
  const stop = result?.stop_reason || '';
  const outcome = (state, responsibility = 'none') => ({ schema_version: 'arcorbit-execution-outcome/v1', state, responsibility, reason });
  // Older closeout-only envelopes encoded a valid wait as validation:false.
  const legacyCloseoutWait = !runtime && closeout && ['needs_human', 'external_wait'].includes(closeout.status)
    && result?.validation?.valid === false && result.validation.issues?.length === 0;
  if ((result?.validation?.valid === false && !legacyCloseoutWait) || ledger?.rejection
    || ((runtime?.ledger_stage?.writeback_required || activity?.ledger_stage?.writeback_required) && ledger?.written !== true)) return outcome('failed', ledger?.rejection?.responsibility || 'runtime');
  if (['invalid_result', 'no_progress_limit', 'snapshot_stale_limit', 'agent_repair_limit', 'closeout_failed', 'ledger_write_failed', 'protocol_incompatible', 'materialization_failed', 'infrastructure_recovery'].includes(stop)) return outcome('failed', 'runtime');
  if (status === 'aborted') return outcome('failed', 'runtime');
  if (status === 'failed' && !legacyCloseoutWait && !['stopped', 'case_binding_required'].includes(stop)) return outcome('failed', 'runtime');
  if (closeout?.status === 'failed') return outcome('failed', 'runtime');
  if (handoff.human_decision_required || handoff.next_responsibility === 'human' || stop === 'human_intervention') return outcome('needs_human', 'human');
  if (handoff.next_responsibility === 'external' || handoff.status === 'external_wait' || stop === 'external_wait') return outcome('waiting_external', 'external');
  if (stop === 'stopped' || closeout?.status === 'stopped') return outcome('stopped');
  const acceptedCompletion = acceptedCaseCompletion(ledger);
  if ((!checkpoint?.pending_continuation && acceptedCompletion) || closeout?.status === 'completed') return outcome('completed');
  const agent = result?.agent_loop_result || activity?.agent_loop_result || runtime?.agent_loop_result;
  if (handoff.next_responsibility === 'none' && agent?.action === 'handoff') return outcome('stopped');
  if (checkpoint?.pending_continuation) return outcome('continue', 'agent');
  if (handoff.next_responsibility === 'agent') return outcome('continue', 'agent');
  return outcome('failed', 'runtime');
}
