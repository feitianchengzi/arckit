import assert from 'node:assert/strict';
import test from 'node:test';
import vm from 'node:vm';
import { readFile } from 'node:fs/promises';
import { parseHTML } from 'linkedom';
import { buildExecutionHistory, workbenchExecutionTarget } from '../src/automation/execution-history.mjs';

const renderer = await readFile(new URL('../desktop/renderer/renderer.js', import.meta.url), 'utf8');
function extract(name) {
  const match = renderer.match(new RegExp(`^(?:async )?function ${name}\\(`, 'm'));
  assert.ok(match, name);
  return renderer.slice(match.index, renderer.indexOf('\n}\n', match.index) + 2);
}
const history = buildExecutionHistory({
  stopped_executions: [{ execution_id: 'OLD', feedback_id: 'AF-OLD', task_id: 't', phase: 'stopped', run_id: 'RUN-OLD' }],
  active_executions: { p: { execution_id: 'OTHER', task_id: 'other', phase: 'running', run_id: 'RUN-OTHER' } },
  acceptance_feedback_items: [{ feedback_id: 'AF-OLD', source_task_id: 't', status: 'stopped', original_feedback: 'Original issue' }]
});

test('history shows stopped feedback once and selection never falls through to another execution', () => {
  assert.equal(history.filter(item => item.feedback_id === 'AF-OLD').length, 1);
  const snapshot = { execution_history: history, selected_execution_id: 'OTHER' };
  assert.equal(workbenchExecutionTarget(snapshot, { feedbackId: 'AF-OLD' }).status, 'stopped');
  assert.equal(workbenchExecutionTarget(snapshot, { feedbackId: 'missing' }), null);
  assert.equal(workbenchExecutionTarget(snapshot, { taskId: 't', runId: 'RUN-OTHER' }), null);
  assert.equal(workbenchExecutionTarget(snapshot, { taskId: 't', runId: 'RUN-OLD' }).history_id, 'AF-OLD');
});

test('Continue in a completed todo conversation resumes the selected feedback, never submits a new issue', async () => {
  for (const message of ['继续', '继续执行']) {
    const calls = [];
    const context = vm.createContext({
      state: { snapshot: { execution_history: history, selected_execution_id: 'OTHER' },
        workbenchTask: { id: 't', state: 'completed' }, workbenchFeedbackId: 'AF-OLD', page: 'workbench' },
      workbenchExecutionTarget,
      els: { interventionInput: { value: message } },
      api: { async manageAutomationExecution(input) { calls.push(input); }, async submitAcceptanceFeedback() { assert.fail('must not create feedback'); } },
      renderWorkbench() {}, async refreshSnapshot() {}, showPage() {}
    });
    vm.runInContext([extract('currentWorkbenchExecution'), extract('submitWorkbenchMessage')].join('\n'), context);
    await context.submitWorkbenchMessage();
    assert.deepEqual(JSON.parse(JSON.stringify(calls)), [{ history_id: 'AF-OLD', action: 'resume', message }]);
    assert.equal(context.els.interventionInput.value, '');
  }
});

test('history actions offer resume and cancel for stopped items, and archive only for inactive records', () => {
  const context = vm.createContext({ escapeHtml: String });
  vm.runInContext(extract('executionActionButtons'), context);
  const stopped = context.executionActionButtons({ history_id: 'old', status: 'stopped' });
  const { document } = parseHTML(`<main>${stopped}</main>`);
  assert.deepEqual([...document.querySelectorAll('button')].map(button => button.dataset.executionAction), ['resume', 'cancel', 'archive']);
  assert.doesNotMatch(context.executionActionButtons({ history_id: 'live', active: true, status: 'running' }), /data-execution-action="(?:cancel|archive)"/);
  assert.match(context.executionActionButtons({ history_id: 'archived', archived_at: 'now', status: 'cancelled' }), /取消归档/);
});
