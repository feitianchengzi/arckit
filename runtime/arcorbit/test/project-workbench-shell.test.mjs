import test from 'node:test';
import assert from 'node:assert/strict';
import { parseHTML } from 'linkedom';
import { createProjectWorkbenchSurface } from '../desktop/renderer/project-workbench-surface.mjs';

// Exercise actual event handlers without a browser or runtime service.
test('workbench shell connects navigation, runtime popover and compact list filters', async t => {
  const { window, document } = parseHTML('<html><body><nav id="nav"></nav><main id="root"></main><button id="outside"></button></body></html>');
  const previous = Object.fromEntries(['window', 'document', 'localStorage'].map(key => [key, Object.getOwnPropertyDescriptor(globalThis, key)]));
  Object.assign(globalThis, { window, document, localStorage: { getItem: () => null, setItem() {} } });
  // linkedom has no browser select-value setter.
  Object.defineProperty(window.HTMLSelectElement.prototype, 'value', {
    configurable: true,
    get() { return this.querySelector('option[selected]')?.value ?? this.querySelector('option')?.value ?? ''; },
    set(value) { for (const option of this.querySelectorAll('option')) option.toggleAttribute('selected', option.value === value); }
  });
  t.after(() => { for (const [key, descriptor] of Object.entries(previous)) { if (descriptor) Object.defineProperty(globalThis, key, descriptor); else delete globalThis[key]; } });
  const snapshot = {
    account_scope: 'test', user: { name: 'Glare' }, projects: [{ id: 'p', name: 'ArcOrbit' }],
    tasks: [
      { id: '1', project_id: 'p', content: '正在执行的事情', state: 'in_progress' },
      { id: '2', project_id: 'p', content: '需要确认的事情', state: 'blocked' },
      { id: '3', project_id: 'p', content: '等待执行的事情', state: 'pending' }
    ],
    runtime: { attention_items: [{ task_id: '2', reason: '需要确认' }], active_executions: [{ task_id: '1', phase: 'running' }], queue: [{ task_id: '3' }] }
  };
  let settingsOpened = 0;
  const root = document.querySelector('#root');
  const surface = createProjectWorkbenchSurface({ root, nav: document.querySelector('#nav'), api: {
    projectWorkbenchSnapshot: async () => snapshot,
    projectWorkbenchDetail: async () => null,
    projectWorkbenchCommand: async () => ({})
  }, navigate() {}, openSettings: () => settingsOpened++ });
  surface.state.active = true;
  await surface.refresh();
  const q = selector => root.querySelector(selector);
  const click = selector => q(selector).click();
  assert.equal(q('.pw-error').textContent, '');
  assert.equal(document.querySelectorAll('.pw-nav-group').length, 3);
  assert.match(document.querySelector('#nav').textContent, /Glare 的工作空间/);
  assert.ok(q('.pw-search-field svg'));
  assert.equal(root.querySelectorAll('[data-pw-action="create"]').length, 1);
  assert.equal(q('[data-pw-action="create"]').parentElement.className, 'pw-list-foot');
  const trigger = q('[data-pw-action="runtime"]');
  assert.match(trigger.textContent, /1 执行中 · 1 排队 · 1 待处理/);
  click('[data-pw-action="runtime"]');
  assert.equal(q('.pw-runtime').hidden, false);
  assert.equal(trigger.getAttribute('aria-expanded'), 'true');
  assert.equal(root.querySelectorAll('.pw-runtime-group').length, 3);
  const esc = new window.Event('keydown', { bubbles: true }); esc.key = 'Escape';
  document.dispatchEvent(esc);
  assert.equal(q('.pw-runtime').hidden, true);
  click('[data-pw-action="runtime"]'); document.querySelector('#outside').click();
  assert.equal(q('.pw-runtime').hidden, true);
  click('[data-pw-action="runtime"]'); click('[data-pw-action="settings"]');
  assert.equal(settingsOpened, 1);
  assert.equal(q('.pw-runtime').hidden, true);
  assert.equal(trigger.getAttribute('aria-expanded'), 'false');
  document.querySelector('[data-nav-action="settings"]').click();
  assert.equal(settingsOpened, 2);
  click('[data-pw-action="filters"]');
  assert.equal(q('.pw-extra').hidden, false);
  assert.equal(q('[data-pw-action="filters"]').getAttribute('aria-expanded'), 'true');
  const filter = q('[data-filter="state"]'); filter.value = 'attention';
  filter.dispatchEvent(new window.Event('change', { bubbles: true }));
  assert.deepEqual([...root.querySelectorAll('.pw-task-row')].map(n => n.dataset.id), ['2']);
  click('[data-pw-action="clear"]');
  assert.equal(root.querySelectorAll('.pw-task-row').length, 3);
  q('.pw-search').value = '等待执行'; q('.pw-search').dispatchEvent(new window.Event('input', { bubbles: true }));
  assert.deepEqual([...root.querySelectorAll('.pw-task-row')].map(n => n.dataset.id), ['3']);
  click('[data-pw-action="runtime"]'); click('[data-pw-action="runtime.select"][data-id="1"]');
  await new Promise(resolve => setImmediate(resolve));
  assert.equal(surface.state.task, '1');
  assert.equal(surface.state.project, 'p');
  assert.equal(surface.state.search, '');
  assert.equal(q('.pw-runtime').hidden, true);
  snapshot.runtime = {};
  await surface.refresh();
  assert.match(trigger.textContent, /运行状态 · 空闲/);
  assert.match(q('.pw-runtime').textContent, /当前没有自动执行中的事情/);
});
