import test from 'node:test';
import assert from 'node:assert/strict';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { fileURLToPath } from 'node:url';
import electron from 'electron';

test('production Work and Today show self labels, including member pickers and filters', {
  skip: process.env.ARCORBIT_ELECTRON_TODO_EXECUTOR_NAME_TEST !== '1' && 'set ARCORBIT_ELECTRON_TODO_EXECUTOR_NAME_TEST=1'
}, async () => {
  const env = { ...process.env, ELECTRON_DISABLE_SECURITY_WARNINGS: 'true' };
  delete env.ELECTRON_RUN_AS_NODE;
  const { stdout } = await promisify(execFile)(electron, [fileURLToPath(new URL('./fixtures/todo-executor-label-electron.mjs', import.meta.url))], { env, timeout: 20000 });
  const result = JSON.parse(stdout);
  assert.equal(result.workInspectorExecutor, 'Glare（我）');
  assert.equal(result.todayExecutor, 'Glare（我）');
  assert.match(result.executorFilter, /Glare（我）/);
  assert.deepEqual(result.workExecutorCells, [
    { id: 'W-11', label: 'Glare（我）' },
    { id: 'W-NAMELESS', label: '执行人姓名不可用' },
    { id: 'W-UNKNOWN', label: '执行人姓名不可用' },
    { id: 'W-UNASSIGNED', label: '未分配' }
  ]);
  for (const options of [result.createExecutorOptions, result.editExecutorOptions]) {
    assert.deepEqual(options, [{ value: '', label: '未分配' }, { value: '7', label: 'Glare（我）' }, { value: '8', label: 'Lin' }, { value: '9', label: '成员姓名不可用' }]);
  }
  assert.deepEqual(result.otherProjectOptions, [{ value: '', label: '未分配' }, { value: '8', label: 'Lin（我）' }]);
});
