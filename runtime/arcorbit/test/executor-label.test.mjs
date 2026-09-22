import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import vm from 'node:vm';
import { executorLabel } from '../desktop/renderer/executor-label.mjs';

test('executor suffix compares nonempty project identities, never names', () => {
  assert.equal(executorLabel('Lin', 7, '7'), 'Lin（我）');
  assert.equal(executorLabel('Lin', '8', '7'), 'Lin');
  for (const [executor, current] of [['', ''], ['7', ''], ['', '7'], [null, undefined]]) {
    assert.equal(executorLabel('Lin', executor, current), 'Lin');
  }
});

test('legacy task and member labels use project identity and preserve source data', async () => {
  const source = await readFile(new URL('../desktop/renderer/renderer.js', import.meta.url), 'utf8');
  const state = { platform: { user: { id: '8', name: 'Same' },
    product_workspaces: [{ id: 'p', current_user_id: '7' }, { id: 'q', current_user_id: '8' }],
    members: [{ project_id: 'p', user_id: '7', username: 'Same' }, { project_id: 'p', user_id: '8', username: 'Same' }]
  } };
  const context = vm.createContext({ state, executorLabel });
  for (const name of ['personName', 'memberName', 'executorMemberName', 'taskExecutorName', 'projectCurrentUserExecutorId', 'memberSelectOptions']) {
    const start = source.indexOf(`function ${name}(`);
    const end = source.indexOf('\nfunction ', start + 1);
    vm.runInContext(source.slice(start, end), context);
  }
  const task = { project_id: 'p', executor_id: '7', assignee: { username: 'Same' } };
  const before = JSON.stringify(task);
  assert.equal(context.taskExecutorName(task), 'Same（我）');
  assert.equal(context.taskExecutorName({ ...task, executor_id: '8' }), 'Same');
  assert.equal(context.taskExecutorName({ ...task, assignee: null }), 'Same（我）');
  assert.equal(context.taskExecutorName({ project_id: 'p', executor_id: '' }), '未分配');
  assert.equal(context.taskExecutorName({ project_id: 'p', executor_id: '9' }), '执行人姓名不可用');
  assert.equal(context.taskExecutorName({ project_id: 'missing', executor_id: '7', executor_name: 'Same' }), 'Same');
  assert.equal(context.memberSelectOptions('p')[1].label, 'Same（我）');
  assert.equal(context.memberSelectOptions('p')[2].label, 'Same');
  state.platform.product_workspaces[0].current_user_id = '8';
  assert.equal(context.taskExecutorName(task), 'Same');
  assert.equal(context.memberSelectOptions('p')[2].label, 'Same（我）');
  assert.equal(JSON.stringify(task), before);
});

test('explicit Today creation labels the current project executor but submits the raw id', async () => {
  const source = await readFile(new URL('../desktop/renderer/renderer.js', import.meta.url), 'utf8');
  let sheet, submitted;
  const context = vm.createContext({ executorLabel,
    workspaceOptions: () => [{ value: 'p', label: 'Project' }],
    projectCurrentUserExecutorId: () => '7', currentWorkshopUserName: () => 'Same',
    taskPriorityOptions: () => [], platformField: (name, label, options) => ({ name, label, ...options }),
    openPlatformAction: async value => { sheet = value; },
    executeManagedAction: async (_action, input) => { submitted = input; }
  });
  const start = source.indexOf('async function createTaskForArcOrbit(');
  vm.runInContext(source.slice(start, source.indexOf('\nfunction renderOrganization', start)), context);
  await context.createTaskForArcOrbit('p');
  assert.equal(sheet.fields.find(field => field.name === 'executor').value, 'Same（我）');
  await sheet.onSubmit({ project_id: 'p', content: 'Task', priority: '' });
  assert.equal(submitted.executor_id, '7');
  assert.equal(submitted.state, 'pending');
});
