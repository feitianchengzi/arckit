import { isTaskCloseoutResult } from '../task-closeout-contract.mjs';
import { isCaseCheckpoint, createCaseCheckpoint, acceptLedgerCheckpoint as acceptCaseLedger,
  resumeCaseCheckpoint } from '../kernel/case-execution.mjs';
export { acceptedCaseCompletion } from '../kernel/case-execution.mjs';

// Automation recovery format v1 remains readable across upgrades. Git phases belong here.
export function caseCheckpointFromExecution(value) {
  const { closeout_result, ...state } = value;
  return { ...state, schema_version: 'arckit-case-execution/v1', phase: value.phase === 'closeout' ? 'completed' : 'loop' };
}
export function executionCheckpointFromCase(state) {
  return { ...structuredClone(state), schema_version: 'arcorbit-execution-checkpoint/v1',
    phase: state.phase === 'completed' ? 'closeout' : 'loop', closeout_result: null };
}
export function isExecutionCheckpoint(value) {
  return value?.schema_version === 'arcorbit-execution-checkpoint/v1' && ['loop', 'closeout'].includes(value.phase)
    && isCaseCheckpoint(caseCheckpointFromExecution(value))
    && (!value.closeout_result || (value.phase === 'closeout' && isTaskCloseoutResult(value.closeout_result)));
}
export function createExecutionCheckpoint(context = {}) {
  if (context.execution_checkpoint) {
    if (!isExecutionCheckpoint(context.execution_checkpoint)) throw new Error('Invalid Automation execution checkpoint.');
    return structuredClone(context.execution_checkpoint);
  }
  const next = executionCheckpointFromCase(createCaseCheckpoint(context));
  if (context.closeout_only) next.phase = 'closeout';
  return next;
}
export function acceptLedgerCheckpoint(previous, ledger) {
  return ledger?.written === true
    ? executionCheckpointFromCase(acceptCaseLedger(caseCheckpointFromExecution(previous), ledger)) : previous;
}
export function acceptCloseoutCheckpoint(previous, result) {
  if (previous.phase !== 'closeout' || !previous.case_id || !isTaskCloseoutResult(result)) {
    throw new Error('Task closeout requires a bound, accepted Case completion and a valid result.');
  }
  return result.status === 'resume_loop'
    ? executionCheckpointFromCase(resumeCaseCheckpoint(caseCheckpointFromExecution(previous), result))
    : { ...structuredClone(previous), closeout_result: structuredClone(result) };
}
export function executionRuntimeContext(context = {}, checkpoint) {
  return { ...context, case_id: checkpoint.case_id,
    case_binding: checkpoint.case_id ? { status: 'bound', case_id: checkpoint.case_id, source: 'runtime_ledger',
      case_ids: checkpoint.case_chain.map(link => link.case_id) } : { status: 'unbound', case_ids: [], observations: [] },
    closeout_only: checkpoint.phase === 'closeout', execution_checkpoint: structuredClone(checkpoint) };
}
export function checkpointFromRun(run) {
  return [run?.result?.execution_checkpoint, run?.activity?.execution_checkpoint].find(isExecutionCheckpoint) || null;
}
