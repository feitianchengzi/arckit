import test from 'node:test';
import assert from 'node:assert/strict';
import { parseHTML } from 'linkedom';
import { createProjectWorkbenchSurface } from '../desktop/renderer/project-workbench-surface.mjs';
import { applyWorkSyncHealth } from '../desktop/renderer/work-sync-health.mjs';
import { emptyScene } from '../src/workbench/scene-store.mjs';
import { readFile } from 'node:fs/promises';
import vm from 'node:vm';

async function harness(t, getScope = ()=>null) {
  const { window, document } = parseHTML('<html><body><main id="root"></main></body></html>');
  const previous = Object.fromEntries(['window', 'document', 'localStorage'].map(key => [key, Object.getOwnPropertyDescriptor(globalThis, key)]));
  Object.assign(globalThis, { window, document, localStorage: { getItem: () => null, setItem() {} } });
  Object.defineProperty(window.HTMLSelectElement.prototype, 'value', {
    configurable: true,
    get() { return this.querySelector('option[selected]')?.value ?? ''; },
    set(value) { for (const option of this.querySelectorAll('option')) option.toggleAttribute('selected', option.value === value); }
  });
  t.mock.timers.enable({ apis: ['setTimeout'] });
  t.after(() => { t.mock.timers.reset(); for (const [key, descriptor] of Object.entries(previous)) { if (descriptor) Object.defineProperty(globalThis, key, descriptor); else delete globalThis[key]; } });
  const snapshot = { account_scope: 'user', projects: [{ id: 'p' }, { id: 'q' }], tasks: [
    { id: '1', project_id: 'p', content: 'First', state: 'pending_review' },
    { id: '2', project_id: 'q', content: 'Second', state: 'pending_review' }
  ], runtime: {} };
  const events = {}, counts = { snapshot: 0, detail: 0 }, health = [];
  const api = {
    onWorkSyncEvent(fn) { events.work = fn; }, onAutomationEvent(fn) { events.auto = fn; },
    onProjectWorkbenchEvent(fn) { events.scene = fn; },
    async projectWorkbenchSnapshot() { counts.snapshot++; return structuredClone(snapshot); },
    async projectWorkbenchDetail(id) { counts.detail++; return {
      task: structuredClone(snapshot.tasks.find(t => t.id === id)), scene: emptyScene(id),
      executions: [], history: [], attention: [], recovery: [], children: [], feedback: [], attachments: [], messages: [], runs: []
    }; }
  };
  const root = document.querySelector('#root');
  const surface = createProjectWorkbenchSurface({ root, api, getScope, navigate() {}, openSettings() {}, onSyncHealth(snapshot) { health.push(snapshot.source_status); } });
  surface.state.active = true;
  await surface.refresh();
  const flush = async () => { t.mock.timers.tick(180); await new Promise(resolve => setImmediate(resolve)); };
  assert.equal(surface.state.error, '');
  return { snapshot, events, counts, api, surface, root, flush, health };
}

test('connection notices perform zero reads; unrelated content and automation reuse selected detail', async t => {
  const h = await harness(t);
  const rows = h.root.querySelector('.pw-rows').firstElementChild;
  for (const type of ['work.syncing', 'work.sync', 'work.sync']) h.events.work({ type, projectId: 'q', state: 'connected' });
  await h.flush();
  assert.deepEqual(h.counts, { snapshot: 1, detail: 1 });
  assert.equal(h.root.querySelector('.pw-rows').firstElementChild, rows);
  h.snapshot.tasks[1].content = 'Second changed';
  h.snapshot.projects[0].state = 'connected';
  h.snapshot.source_status = 'healthy';
  h.events.work({ type: 'work.changed', projectIds: ['q'] }); h.events.auto({ type: 'automation.changed' });
  await h.flush();
  assert.deepEqual(h.counts, { snapshot: 2, detail: 1 });
  assert.equal(h.health.at(-1), 'healthy');
  assert.match(h.root.querySelector('.pw-rows').textContent, /Second changed/);
  h.events.auto({ type: 'automation.changed' }); await h.flush();
  assert.deepEqual(h.counts, { snapshot: 3, detail: 1 });
  h.events.work({ type: 'work.changed', projectIds: ['p'] }); await h.flush();
  assert.deepEqual(h.counts, { snapshot: 4, detail: 2 });
  await h.surface.refresh(); // explicit and periodic refresh still confirm attachments
  assert.deepEqual(h.counts, { snapshot: 5, detail: 3 });
});

test('selected execution changes refresh details and errors remain retryable', async t => {
  const h = await harness(t);
  h.snapshot.runtime.attention_items = [{ task_id: '1', reason: 'intervention' }];
  h.events.auto({}); await h.flush(); assert.equal(h.counts.detail, 2);
  const read = h.api.projectWorkbenchDetail;
  h.api.projectWorkbenchDetail = async () => { throw new Error('temporary failure'); };
  h.snapshot.tasks[0].content = 'New target';
  h.events.auto({}); await h.flush(); assert.match(h.surface.state.error, /temporary failure/);
  h.api.projectWorkbenchDetail = read;
  h.events.auto({}); await h.flush(); assert.equal(h.surface.state.detail.task.content, 'New target');
  assert.equal(h.surface.state.error, '');
});

test('content invalidation during a read is consumed by a following refresh', async t => {
  const h = await harness(t);
  let release, entered;
  const started = new Promise(resolve => { entered = resolve; });
  const blocked = new Promise(resolve => { release = resolve; });
  const read = h.api.projectWorkbenchSnapshot;
  let once = true;
  h.api.projectWorkbenchSnapshot = async () => { const result = await read(); if (once) { once = false; entered(); await blocked; } return result; };
  const refreshing = h.surface.refresh({ detail: false }); await started;
  h.snapshot.tasks[0].content = 'After request';
  h.events.work({ type: 'work.changed', projectIds: ['p'] }); await h.flush();
  release(); await refreshing;
  assert.equal(h.surface.state.detail.task.content, 'After request');
  assert.deepEqual(h.counts, { snapshot: 3, detail: 2 });
});

test('selection, account changes and removed tasks do not retain another detail', async t => {
  const h = await harness(t);
  h.root.querySelector('[data-pw-action=select][data-id="2"]').click();
  await new Promise(resolve => setImmediate(resolve));
  assert.equal(h.surface.state.detail.task.id, '2');
  h.snapshot.account_scope = 'other'; h.snapshot.tasks = [{ id: '3', project_id: 'p', content: 'Other user', state: 'pending_review' }];
  h.events.work({ type: 'work.changed', reason: 'session-cleared' }); await h.flush();
  assert.equal(h.surface.state.detail.task.id, '3');
  h.snapshot.tasks = [];
  h.events.work({ type: 'work.changed', projectIds: ['p'] }); await h.flush();
  assert.equal(h.surface.state.detail, null);
});

test('a delayed old detail cannot overwrite a newly selected task or its draft', async t => {
  const h = await harness(t);
  let release, entered;
  const started = new Promise(resolve => { entered = resolve; });
  const blocked = new Promise(resolve => { release = resolve; });
  const read = h.api.projectWorkbenchDetail;
  let once = true;
  h.api.projectWorkbenchDetail = async id => { const result = await read(id); if (once) { once = false; entered(); await blocked; } return result; };
  const refreshing = h.surface.refresh(); await started;
  h.surface.state.drafts['2'] = { text: 'Keep my draft' };
  h.root.querySelector('[data-pw-action=select][data-id="2"]').click();
  release(); await refreshing;
  assert.equal(h.surface.state.detail.task.id, '2');
  assert.equal(h.root.querySelector('.pw-composer textarea').value, 'Keep my draft');
});

test('a failed forced detail refresh retries even when the snapshot key is unchanged', async t => {
  const h = await harness(t), read = h.api.projectWorkbenchDetail;
  h.api.projectWorkbenchDetail = async () => { throw new Error('attachments unavailable'); };
  h.events.work({ type: 'work.changed', projectIds: ['p'] }); await h.flush();
  assert.match(h.surface.state.error, /attachments unavailable/);
  h.api.projectWorkbenchDetail = read;
  h.events.auto({}); await h.flush();
  assert.equal(h.counts.detail, 2); assert.equal(h.surface.state.error, '');
});

test('activity filters repaint reused detail without fetching data', async t => {
  const h = await harness(t);
  h.surface.state.detail.scene.events = [
    { id: 'task', action: 'task.update', summary: 'Task event', at: '2026-09-17', actor: 'user' },
    { id: 'run', action: 'auto.start', summary: 'Execution event', at: '2026-09-17', actor: 'user' }
  ];
  h.root.querySelector('[data-pw-action=tab][data-id=activity]').click();
  assert.match(h.root.querySelector('.pw-body').textContent, /Execution event/);
  h.root.querySelector('[data-pw-action="activity.filter"][data-id=task]').click();
  assert.match(h.root.querySelector('.pw-body').textContent, /Task event/);
  assert.doesNotMatch(h.root.querySelector('.pw-body').textContent, /Execution event/);
  h.root.querySelector('[data-pw-action="activity.filter"][data-id=execution]').click();
  assert.match(h.root.querySelector('.pw-body').textContent, /Execution event/);
  assert.doesNotMatch(h.root.querySelector('.pw-body').textContent, /Task event/);
  h.root.querySelector('[data-pw-action="activity.filter"][data-id=all]').click();
  assert.match(h.root.querySelector('.pw-body').textContent, /Task event/);
  assert.deepEqual(h.counts, { snapshot: 1, detail: 1 });
});

test('health events update only source and realtime projection, preserving content', () => {
  const snapshot = { source_status: 'healthy', tasks: [{ id: '1' }], realtime: { projects: {} } };
  const tasks = snapshot.tasks;
  assert.equal(applyWorkSyncHealth(snapshot, { type: 'work.syncing' }), true);
  assert.equal(snapshot.source_status, 'syncing');
  applyWorkSyncHealth(snapshot, { type: 'work.sync', project_id: 'p', state: 'reconnecting', mode: 'resumable' });
  assert.equal(snapshot.realtime.status, 'reconnecting');
  applyWorkSyncHealth(snapshot, { type: 'work.sync', projectId: 'p', state: 'connected', cursor: 10 });
  assert.equal(snapshot.realtime.status, 'connected'); assert.equal(snapshot.realtime.projects.p.cursor, 10);
  assert.equal(snapshot.tasks, tasks);
  assert.equal(applyWorkSyncHealth(snapshot, { type: 'work.changed' }), false);
  assert.equal(applyWorkSyncHealth(snapshot, { type: 'work.error' }), false);
});

test('the production renderer rebuilds only the visible workspace', async () => {
  const source = await readFile(new URL('../desktop/renderer/renderer.js', import.meta.url), 'utf8');
  const render = source.slice(source.indexOf('function render() {'), source.indexOf('\nfunction renderWorkSurface()'));
  const shared = ['dismissStaleMemberAddSheet', 'renderPageVisibility', 'renderNavigation', 'renderCommandBar', 'renderWorkset'];
  const pages = { today: 'renderToday', chat: 'renderChat', organization: 'renderOrganization', work: 'renderPlatformWork', feedback: 'renderPlatformFeedback', command: 'renderCommandCenter', tasks: 'renderTaskBrowser', workbench: 'renderWorkbench', recovery: 'renderRecovery' };
  for (const page of [...Object.keys(pages), 'project-workbench']) {
    const calls = [];
    const context = { state: { page }, ...Object.fromEntries([...shared, ...Object.values(pages)].map(name => [name, () => calls.push(name)])) };
    vm.runInNewContext(render + '\nrender();', context);
    assert.deepEqual(calls.filter(name => !shared.includes(name)), pages[page] ? [pages[page]] : []);
  }
});

test('production sync subscription handles health without scheduling data reads', async () => {
  const source = await readFile(new URL('../desktop/renderer/renderer.js', import.meta.url), 'utf8');
  const subscription = source.slice(source.indexOf('  api.onWorkSyncEvent('), source.indexOf('  api.onChatEvent('));
  let listener, reads = 0, statusPaints = 0;
  const context = { api: { onWorkSyncEvent(fn) { listener = fn; } }, state: { page: 'command', snapshot: {} }, applyWorkSyncHealth,
    renderNavigation() { statusPaints++; }, renderCommandSyncSummary() {}, renderGlobalStatus() {}, scheduleRefresh() { reads++; } };
  vm.runInNewContext(subscription, context);
  for (const type of ['work.sync', 'work.syncing']) listener({ type, projectId: 'p', state: 'connected' });
  assert.equal(reads, 0); assert.equal(statusPaints, 2);
  listener({ type: 'work.changed' }); listener({ type: 'work.error' }); assert.equal(reads, 2);
});


test('Thing follows shared scope, restores object drafts and never fetches outside the selected product',async t=>{
 let scope={key:'A',projectId:'p',projectIds:['p']};const h=await harness(t,()=>scope);
 assert.equal(h.surface.state.task,'1');assert.doesNotMatch(h.root.querySelector('.pw-rows').textContent,/Second/);
 const input=h.root.querySelector('.pw-composer textarea');input.value='draft for first';input.dispatchEvent(new window.Event('input',{bubbles:true}));
 scope={key:'B',projectId:'q',projectIds:['q']};await h.surface.scopeChanged();
 assert.equal(h.surface.state.task,'2');assert.equal(h.surface.state.detail.task.id,'2');assert.doesNotMatch(h.root.querySelector('.pw-rows').textContent,/First/);
 scope={key:'A',projectId:'p',projectIds:['p']};await h.surface.scopeChanged();
 assert.equal(h.surface.state.task,'1');assert.equal(input.value,'draft for first');
 scope={key:'empty',projectId:'all',projectIds:[]};await h.surface.scopeChanged();
 assert.equal(h.surface.state.task,'');assert.equal(h.surface.state.detail,null);assert.doesNotMatch(h.root.querySelector('.pw-rows').textContent,/First|Second/);
});


test('Thing refresh updates global runtime without overwriting unrelated state', async () => {
 const source=await readFile(new URL('../desktop/renderer/renderer.js',import.meta.url),'utf8');
 const callback=source.slice(source.indexOf('onSyncHealth: snapshot => {')+'onSyncHealth: '.length,source.indexOf('\n});\nconst engineeringSurface'));
 let paints=0;const tasks=[{id:'kept'}];const state={snapshot:{tasks,queue:[],enabled:true}};
 const context={state,renderNavigation(){},renderGlobalStatus(){paints++;}};
 const update=vm.runInNewContext('('+callback+')',context);
 update({runtime:{queue:[]},global_runtime:{queue:[{id:'global'}],active_executions:[{task_id:'running'}],enabled:false,queue_paused:true},source_status:'healthy'});
 assert.equal(state.snapshot.queue[0].id,'global');assert.equal(state.snapshot.active_executions.length,1);
 assert.equal(state.snapshot.enabled,false);assert.equal(state.snapshot.queue_paused,true);
 assert.equal(state.snapshot.tasks,tasks);assert.equal(paints,1);
 update({source_status:'syncing'});assert.equal(state.snapshot.queue.length,1);
});
