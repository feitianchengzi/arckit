import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';
import test from 'node:test';
import { deriveTodayWorkspace } from '../src/desktop/today-workspace.mjs';
import { executorLabel } from '../desktop/renderer/executor-label.mjs';

const source = readFileSync(new URL('../desktop/renderer/renderer.js', import.meta.url), 'utf8');
function renderer() {
  const names = ['renderTodaySourceContext', 'todayFactRows', 'taskCreatorName', 'taskExecutorName', 'personName', 'formatPriority'];
  const functions = names.map(name => {
    const start = source.indexOf(`function ${name}(`);
    return source.slice(start, source.indexOf('\n}\n', start) + 2);
  }).join('\n');
  const members = [{ project_id: 'p', user_id: 'u', name: '项目成员' }];
  const context = vm.createContext({ state: { platform: { members, project_members: [] } }, executorLabel,
    STATE_LABELS: { pending_review: '待评审', completed: '已完成', blocked: '已阻塞' },
    projectCurrentUserExecutorId: () => 'u', feedbackTone: () => '',
    escapeHtml: value => String(value ?? '').replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;') });
  vm.runInContext(functions, context);
  return context;
}
function projectTasks(tasks) {
  return deriveTodayWorkspace({ platform: { projects: [{ id: 'p', name: '项目', current_user_id: 'u' }],
    active_workset: { project_ids: ['p'] }, today_tasks: tasks } }).interventions;
}

test('Today preserves task priorities independently of responsibility ordering', () => {
  const tasks = ['pending_review', 'blocked', 'completed'].map((state, index) => ({ id: state, project_id: 'p', state, executor_id: 'u', priority: 100 - index }));
  const items = projectTasks(tasks);
  assert.deepEqual(items.map(item => item.state), ['completed', 'blocked', 'pending_review']);
  assert.deepEqual(items.map(item => item.priority), [50, 60, 70]);
  assert.deepEqual(items.map(item => item.task_priority), [98, 99, 100]);
  assert.deepEqual(tasks.map(task => task.priority), [100, 99, 98]);
});

test('Today uses detail labels across states, normalized priorities and name fallbacks', () => {
  const render = renderer();
  for (const state of ['pending_review', 'completed', 'blocked']) {
    for (const [priority, expected] of [[100, 'P0'], [99, 'P1'], [98, 'P2'], [97, 'P3'], [0, '普通'], [undefined, '普通']]) {
      const task = { id: 't', project_id: 'p', state, priority, raw: { priority: 1 }, creator_id: 'u', executor_id: 'u', content: '<script>example</script>' };
      const item = projectTasks([task])[0];
      const html = render.renderTodaySourceContext(item);
      assert.ok(html.includes(`<dd>${render.STATE_LABELS[state]}</dd>`));
      assert.ok(html.includes(`<dd>${expected}</dd>`));
      assert.equal(render.formatPriority(task.priority), expected);
      assert.ok(html.includes('<dd>项目成员</dd>'));
      assert.ok(html.includes('<dd>项目成员（我）</dd>'));
      assert.ok(html.includes('&lt;script&gt;'));
      assert.ok(!html.includes('<script>'));
    }
  }
  for (const [extra, creator, executor] of [
    [{ creator_name: '来源创建人' }, '来源创建人', '项目成员（我）'],
    [{ creator: { name: '内嵌创建人' }, assignee: { name: '内嵌执行人' } }, '内嵌创建人', '内嵌执行人（我）'],
    [{ creator_id: '', executor_id: '' }, '未知', '未分配'],
    [{ creator_id: 'other', executor_id: 'other' }, 'other', '执行人姓名不可用']
  ]) {
    const task = { id: 't', project_id: 'p', state: 'pending_review', creator_id: 'u', executor_id: 'u', current_user_responsible: true, ...extra };
    const item = projectTasks([task])[0];
    const html = render.renderTodaySourceContext(item);
    assert.equal(render.taskCreatorName(task), creator);
    assert.equal(render.taskExecutorName(task), executor);
    assert.ok(html.includes(`<dd>${creator}</dd>`));
    assert.ok(html.includes(`<dd>${executor}</dd>`));
  }
});
