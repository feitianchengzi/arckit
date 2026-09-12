import assert from 'node:assert/strict';
import test from 'node:test';
import { rm } from 'node:fs/promises';
import { runStateDrivenSession } from '../src/state-driven-runner.mjs';
import { createStateStore } from '../src/state-store.mjs';
import { createAutomationCoordinator, extractAuthoritativeCaseBindingFromRun, mergeCaseBindings } from '../src/automation-coordinator.mjs';
import { applyRunEvent } from '../src/projection/run-event-projector.mjs';
import { createExecutionCheckpoint, acceptLedgerCheckpoint, acceptCloseoutCheckpoint } from '../src/kernel/execution-checkpoint.mjs';
import { executionOutcome } from '../src/kernel/execution-outcome.mjs';
import { runtimeFailureForCompletedProcess } from '../src/desktop-run-manager.mjs';
import { applyRuntimeLedgerWriteback } from '../../../entry/skills/arckit-development-ledger/scripts/runtime-writeback.mjs';
import { projectWithCases, progressTransition, cleanReviewTransition } from './helpers/ledger-cases.mjs';

const closeout = (status = 'completed') => ({ schema_version: 'arckit-task-closeout-result/v2', status,
  outcome: status === 'completed' ? 'no_changes' : 'none', summary: 'The recorded dependency must be resolved before continuing.',
  evidence: ['fixture:closeout-discovery'], commit_hash: '', error: '' });
const caseA = 'CASE-20260912-001';
const caseB = 'CASE-20260912-002';
const accepted = (case_id, complete = false) => ({ written: true, changed_files: ['arckit/project/STATE.md'],
  case_transition_result: { case_id, case_resolution: { status: complete ? 'resolved' : 'unresolved' } } });

function resumedCheckpoint() {
  return acceptCloseoutCheckpoint(acceptLedgerCheckpoint(createExecutionCheckpoint(), accepted(caseA, true)), closeout('resume_loop'));
}

function adapter(results, prompts = []) {
  return { threadId: () => 'THREAD-1', close() {}, async *runTurn({ prompt, options }) {
    assert.equal(options.threadId, 'THREAD-1');
    prompts.push(prompt);
    yield { type: 'runtime.task_closeout_result', result: results.shift() };
  } };
}

test('real Ledger gaps, reviews, closeout continuation and Automation consume one explicit Case chain', async (t) => {
  const projectRoot = await projectWithCases(2);
  t.after(() => rm(projectRoot, { recursive: true, force: true }));
  const stateStore = createStateStore(projectRoot);
  const original = await stateStore.readSnapshot();
  const ids = original.activeCases.map(({ record }) => record.id);
  const run = { id: 'RUN-1', status: 'running' };
  const prompts = [];
  const contexts = [];
  const result = await runStateDrivenSession({ projectRoot, stateStore,
    options: { task: 'Finish the authorized fixture obligations.', threadId: 'THREAD-1', agentAdapter: adapter([closeout('resume_loop'), closeout()], prompts),
      onEvent(event) { applyRunEvent(run, { parsed: { event } }); } },
    dependencies: {
      async runRound({ snapshot, options }) {
        contexts.push(options.runtimeContext);
        const active = snapshot.activeCases[0];
        const review = active.record.case_resolution.candidate_gaps.some((gap) => gap.id.includes(':completion-review:'));
        const transition = (review ? cleanReviewTransition : progressTransition)(active.record, snapshot.projectState.project.revision, 'fixture:execution', snapshot);
        return { loopFrame: { selected_gap: transition.selected_gap }, events: [], validation: { valid: true, issues: [] },
          runtimeResult: { case_transition: transition, round_result: review ? 'done' : 'continue',
            ledger_stage: { status: 'gate_ready', writeback_required: true }, loop_handoff: {
              next_responsibility: review ? 'none' : 'agent', agent_continuation_available: !review,
              human_decision_required: false, next_prompt: review ? '' : 'Read the accepted state and continue.' } } };
      },
      async writeRoundLedger(input) {
        const receipt = await applyRuntimeLedgerWriteback({ ...input, gate: { allowed: true, reasons: [] } });
        assert.equal(receipt.written, true, JSON.stringify(receipt.rejection));
        return receipt;
      }
    }
  });
  assert.equal(result.stop_reason, 'completed');
  assert.equal(result.round_count, 4);
  assert.equal(contexts[1].case_binding.case_id, ids[0]);
  assert.equal(contexts[2].execution_checkpoint.pending_continuation.source_case_id, ids[0]);
  assert.equal(contexts[3].case_binding.case_id, ids[1]);
  assert.deepEqual(result.execution_checkpoint.case_chain.map((link) => link.case_id), ids);
  assert.equal((await stateStore.readSnapshot()).activeCases.length, 0);
  assert.equal(extractAuthoritativeCaseBindingFromRun({ ...run, result }).case_id, ids[1]);
  for (const restart of [false, true]) {
    const fixture = coordinatorFixture({ result, activity: run.activity, case_id: ids[0] });
    t.after(() => fixture.coordinator.dispose());
    if (restart) await fixture.coordinator.sync({ dispatch: false });
    else await fixture.manager.emitEvent({ type: 'run.finished', runId: 'RUN-1', status: 'completed', result, activity: run.activity });
    assert.equal(fixture.store.automation.active_task.case_id, ids[1]);
    assert.equal(fixture.store.automation.active_task.closeout_status, 'completed');
    assert.equal(fixture.store.automation.recovery_items.length, 0);
  }
});

for (const [status, expected] of [['needs_human', 'needs_human'], ['external_wait', 'waiting_external'], ['failed', 'failed']]) {
  test(`closeout-only ${status} has identical live and restart disposition`, async (t) => {
    const result = await runStateDrivenSession({ projectRoot: '/workspace', stateStore: {},
      options: { threadId: 'THREAD-1', agentAdapter: adapter([closeout(status)]), runtimeContext: { closeout_only: true, case_id: caseA } } });
    assert.equal(result.validation.valid, true);
    assert.equal(executionOutcome({ result }).state, expected);
    assert.equal(Boolean(runtimeFailureForCompletedProcess(result)), status === 'failed');
    for (const restart of [false, true]) {
      const fixture = coordinatorFixture({ result, case_id: caseA, phase: 'closeout_running' });
      t.after(() => fixture.coordinator.dispose());
      if (restart) await fixture.coordinator.sync({ dispatch: false });
      else await fixture.manager.emitEvent({ type: 'run.finished', runId: 'RUN-1', status: 'completed', result });
      assert.equal(fixture.store.automation.active_task.phase, { needs_human: 'awaiting_human', waiting_external: 'waiting_external', failed: 'recovery' }[expected]);
      if (status !== 'failed') {
        assert.equal(fixture.store.automation.active_task.intervention_reason, closeout(status).summary);
        assert.equal(fixture.store.automation.recovery_items.length, 0);
      }
    }
  });
}

test('restart between closeout discovery and the next Gap restores Loop context and the same thread', async () => {
  const checkpoint = resumedCheckpoint();
  const prompts = [];
  let roundCalls = 0;
  const result = await runStateDrivenSession({ projectRoot: '/workspace', stateStore: { async readSnapshot() {
    return { projectState: { advancement: {} }, activeCases: [], paths: { activeCases: [] } };
  } }, options: { task: 'Original intent', threadId: 'THREAD-1', runtimeContext: { closeout_only: true, execution_checkpoint: checkpoint },
    agentAdapter: adapter([], prompts) }, dependencies: { async runRound({ options }) {
      roundCalls++;
      assert.equal(options.runtimeContext.closeout_only, false);
      assert.deepEqual(JSON.parse(options.task).closeout_discovery.evidence, checkpoint.pending_continuation.evidence);
      return { loopFrame: {}, events: [], validation: { valid: true }, runtimeResult: {
        round_result: 'blocked', ledger_stage: { writeback_required: false }, loop_handoff: { next_responsibility: 'none' } } };
    } } });
  assert.equal(roundCalls, 1);
  assert.equal(prompts.length, 0);
  assert.equal(result.stop_reason, 'stopped');
  assert.equal(result.closeout_result, null);
  assert.equal(result.execution_checkpoint.pending_continuation.source_case_id, caseA);
});

test('projection durably reduces continuation before the optional checkpoint event tail', () => {
  const run = { id: 'RUN-1' };
  const emit = (event) => applyRunEvent(run, { parsed: { event } });
  emit({ type: 'runtime.execution_checkpoint', checkpoint: createExecutionCheckpoint() });
  emit({ type: 'runtime.ledger_write.completed', result: accepted(caseA, true) });
  emit({ type: 'runtime.task_closeout_result', result: closeout('resume_loop') });
  assert.equal(run.activity.execution_checkpoint.pending_continuation.source_case_id, caseA);
  assert.notEqual(run.activity.messages.find((message) => message.kind === 'closeout').status, 'failed');
  emit({ type: 'runtime.ledger_write.completed', result: accepted(caseB) });
  assert.equal(run.activity.execution_checkpoint.case_id, caseB);
  assert.equal(extractAuthoritativeCaseBindingFromRun(run).status, 'bound');
});

test('unrelated Case receipts still conflict and a continuation cannot replace an unrelated persisted binding', () => {
  assert.throws(() => acceptLedgerCheckpoint(acceptLedgerCheckpoint(createExecutionCheckpoint(), accepted(caseA)), accepted(caseB)), /without an accepted/);
  const run = { id: 'RUN-1', activity: { ledger_write_receipts: [accepted(caseA), accepted(caseB)].map((parsed) => ({ parsed })) } };
  assert.equal(extractAuthoritativeCaseBindingFromRun(run).status, 'conflict');
  run.result = { execution_checkpoint: acceptLedgerCheckpoint(resumedCheckpoint(), accepted(caseB)) };
  const binding = extractAuthoritativeCaseBindingFromRun(run);
  assert.equal(mergeCaseBindings({ status: 'bound', case_id: caseA }, binding).status, 'bound');
  assert.equal(mergeCaseBindings({ status: 'bound', case_id: 'CASE-20260912-003' }, binding).status, 'conflict');
});

function coordinatorFixture({ result, activity = {}, case_id = caseA, phase = 'running', status = 'completed' }) {
  const store = { projects: [{ id: 'local', path: '/workspace', name: 'fixture' }], settings: { task_source: {} }, automation: {
    enabled: true, queue_paused: false, project_bindings: { p: 'local' }, project_participation: { p: true },
    snapshot: { source_status: 'logged_out', errors: [], projects: [{ id: 'p' }], tasks: [{ id: 't', project_id: 'p', title: 'fixture', content: 'finish', state: 'in_progress' }] },
    active_task: { task_id: 't', project_id: 'p', local_project_id: 'local', local_project_path: '/workspace', task_title: 'fixture', phase,
      case_id, case_binding_source: 'runtime_ledger', case_binding_run_id: 'RUN-previous', run_id: 'RUN-1', session_id: 'SESSION-1', thread_id: 'THREAD-1',
      closeout_status: phase === 'closeout_running' ? 'running' : 'pending', started_at: '2026-09-12T00:00:00Z' },
    attention_items: [], recovery_items: [], recent_completions: [] } };
  let listener;
  const starts = [];
  const manager = { onEvent(fn) { listener = fn; return () => {}; }, async emitEvent(event) { listener(event); await new Promise(setImmediate); },
    async readDesktopStore() { return structuredClone(store); }, async updateDesktopStore(fn) { fn(store); return structuredClone(store); },
    async listProjects() { return store.projects; }, isRunActive() { return false; },
    async listRuns() { return [{ id: 'RUN-1', project_id: 'local', status, activity, result }]; },
    async startRun(input) { starts.push(input); return { id: 'RUN-resumed', thread_id: input.threadId, project_id: 'local', session_id: input.sessionId }; },
    async readRunResult() { return result; }, async listSessions() { return [{ id: 'SESSION-1', task_id: 't' }]; } };
  const coordinator = createAutomationCoordinator({ runManager: manager, taskSourceFactory() { throw Object.assign(new Error('not logged in'), { code: 'unconfigured' }); } });
  return { store, manager, coordinator, starts };
}


test('Automation recovers a persisted closeout continuation before process-finalization metadata exists', async (t) => {
  const fixture = coordinatorFixture({ activity: { execution_checkpoint: resumedCheckpoint() }, phase: 'closeout_running', status: 'running' });
  t.after(() => fixture.coordinator.dispose());
  await fixture.coordinator.sync({ dispatch: false, resumeRecoverable: true });
  assert.equal(fixture.starts.length, 1);
  assert.equal(fixture.starts[0].threadId, 'THREAD-1');
  assert.equal(fixture.starts[0].runtimeContext.closeout_only, false);
  assert.equal(fixture.starts[0].runtimeContext.execution_checkpoint.pending_continuation.source_case_id, caseA);
  assert.equal(fixture.store.automation.active_task.phase, 'running');
  assert.equal(fixture.store.automation.recovery_items.length, 0);
});

test('human closeout resume preserves both original intent and the current user decision', async () => {
  const checkpoint = acceptCloseoutCheckpoint(acceptLedgerCheckpoint(createExecutionCheckpoint(), accepted(caseA, true)), closeout('needs_human'));
  const prompts = [];
  await runStateDrivenSession({ projectRoot: '/workspace', stateStore: {}, options: {
    task: 'Use the already authorized commit identity.', threadId: 'THREAD-1', agentAdapter: adapter([closeout()], prompts),
    runtimeContext: { original_task: 'Implement the original feature.', execution_checkpoint: checkpoint }
  } });
  const invocation = JSON.parse(prompts[0].slice(prompts[0].indexOf('{')));
  assert.equal(invocation.original_user_input, 'Implement the original feature.');
  assert.equal(invocation.current_instruction, 'Use the already authorized commit identity.');
  assert.equal(invocation.task_context.authoritative_case_id, caseA);
});

test('explicit stop during closeout releases Automation without remote completion or a human gate', async (t) => {
  const result = await runStateDrivenSession({ projectRoot: '/workspace', stateStore: {}, options: {
    task: 'Stop this execution.', threadId: 'THREAD-1', agentAdapter: adapter([closeout('stopped')]),
    runtimeContext: { case_id: caseA, closeout_only: true }
  } });
  assert.equal(result.stop_reason, 'stopped');
  assert.equal(runtimeFailureForCompletedProcess(result), '');
  for (const restart of [false, true]) {
    const fixture = coordinatorFixture({ result, phase: 'closeout_running' });
    t.after(() => fixture.coordinator.dispose());
    if (restart) await fixture.coordinator.sync({ dispatch: false, resumeRecoverable: true });
    else await fixture.manager.emitEvent({ type: 'run.finished', runId: 'RUN-1', status: 'completed', result });
    assert.equal(fixture.store.automation.active_task, null);
    assert.equal(fixture.store.automation.snapshot.tasks[0].state, 'in_progress');
    assert.equal(fixture.store.automation.stopped_executions.length, 1);
    assert.equal(fixture.store.automation.attention_items.length, 0);
    assert.equal(fixture.starts.length, 0);
  }
});

test('contradictory closeout completion is invalid while historical wait envelopes remain recoverable', async () => {
  const invalid = closeout(); invalid.outcome = 'none';
  const result = await runStateDrivenSession({ projectRoot: '/workspace', stateStore: {}, options: {
    threadId: 'THREAD-1', agentAdapter: adapter([invalid]), runtimeContext: { case_id: caseA, closeout_only: true }
  } });
  assert.equal(result.stop_reason, 'closeout_failed');
  assert.equal(executionOutcome({ result }).state, 'failed');
  const legacy = { validation: { valid: false, issues: [] }, runtime_result: null,
    closeout_result: { ...closeout('needs_human'), schema_version: 'arckit-task-closeout-result/v1' } };
  assert.equal(executionOutcome({ result: legacy, status: 'failed' }).state, 'needs_human');
  legacy.validation.issues.push({ path: 'schema_version', message: 'Bad format.' });
  assert.equal(executionOutcome({ result: legacy }).state, 'failed');
});
