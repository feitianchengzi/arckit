import assert from 'node:assert/strict';
import test from 'node:test';
import { executionOutcome } from '../src/kernel/execution-outcome.mjs';
import { runtimeFailureForCompletedProcess } from '../src/desktop-run-manager.mjs';
import { continuationContext } from '../src/automation-coordinator.mjs';

const stopped = () => ({ stop_reason: 'stopped', validation: { valid: true }, agent_loop_result: { action: 'handoff' }, runtime_result: { round_result: 'blocked', loop_handoff: { next_responsibility: 'none', human_decision_required: false }, ledger_stage: { writeback_required: false } } });
test('execution stop does not claim Case completion or require a Case identity', () => {
  assert.equal(executionOutcome({ result: stopped() }).state, 'stopped');
  assert.equal(runtimeFailureForCompletedProcess(stopped()), '');
});
test('the persisted incident is recovered as stop without interpreting assistant prose', () => {
  const result = stopped(); result.stop_reason = 'case_binding_required';
  assert.equal(executionOutcome({ result, status: 'failed' }).state, 'stopped');
  result.agent_loop_result.action = 'case_command';
  assert.equal(executionOutcome({ result, status: 'failed' }).state, 'failed');
});
test('stop cannot conceal a rejected required write or invalid output', () => {
  const result = stopped(); result.ledger_write_result = { written: false, rejection: { reason: 'stale' } };
  assert.equal(executionOutcome({ result }).state, 'failed');
  delete result.ledger_write_result; result.validation.valid = false;
  assert.equal(executionOutcome({ result }).state, 'failed');
});
test('human, external and transport failure remain distinct', () => {
  for (const [responsibility, state] of [['human', 'needs_human'], ['external', 'waiting_external']]) {
    const result = stopped(); delete result.stop_reason;
    result.runtime_result.loop_handoff.next_responsibility = responsibility;
    assert.equal(executionOutcome({ result }).state, state);
    assert.equal(executionOutcome({ result, status: 'failed' }).state, 'failed');
  }
});
test('only accepted completion establishes a software completion outcome', () => {
  const result = stopped(); delete result.stop_reason;
  result.ledger_write_result = { written: true, case_transition_result: { case_resolution: { status: 'resolved', loop_handoff: { next_responsibility: 'none' } } } };
  assert.equal(executionOutcome({ result }).state, 'completed');
});
test('continuation context preserves only provenance-backed binding', () => {
  const active = { task_id: '1301', case_id: 'CASE-20260911-003', case_binding_source: 'runtime_ledger', case_binding_run_id: 'RUN-accepted' };
  assert.equal(continuationContext(active).case_id, active.case_id);
  assert.equal(continuationContext(active).case_binding.run_id, 'RUN-accepted');
  delete active.case_binding_source;
  assert.equal(continuationContext(active).case_id, '');
});

test('complete result receipts take precedence over missing activity and retain rejected-claim responsibility', () => {
  const result = stopped(); delete result.stop_reason;
  result.runtime_result.ledger_stage.writeback_required = true;
  result.ledger_write_result = { written: true, case_transition_result: { case_resolution: { status: 'resolved' } } };
  assert.equal(executionOutcome({ result, activity: {} }).state, 'completed');
  result.ledger_write_result = { written: false, rejection: { responsibility: 'agent', reason: 'invalid claim' } };
  assert.equal(executionOutcome({ result }).responsibility, 'agent');
});
