import assert from 'node:assert/strict';
import test from 'node:test';
import { mkdtemp, rm, readFile, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { createDesktopStore } from '../src/desktop/desktop-store.mjs';
import { createWorkSyncCoordinator } from '../src/work-sync-coordinator.mjs';
import { createPlatformCoordinator } from '../src/platform-coordinator.mjs';

async function fixture(t, io) {
  const root = await mkdtemp(join(tmpdir(), 'arcorbit-state-access-'));
  t.after(() => rm(root, { recursive: true, force: true }));
  const options = { dataDir: root, runsDir: join(root, 'runs'), storePath: join(root, 'desktop-store.json'), io };
  const store = createDesktopStore(options);
  await store.updateControlStore(draft => {
    draft.platform.worksets[0].project_ids = ['1'];
    draft.platform.task_sync.project_catalog = [{ id: '1' }, { id: '2' }];
    draft.platform.task_sync.projects = Object.fromEntries(['1', '2'].map(id => [id, {
      project: { id }, tasks: [{ id: `T-${id}`, project_id: id, content: 'body'.repeat(5000), state: 'pending' }], tags: [], trusted: true
    }]));
  });
  return { store, options };
}

test('committed views and projected copies isolate mutations and retain old revisions', async t => {
  const { store } = await fixture(t);
  const old = await store.captureStateView();
  assert.throws(() => { old.state.platform.task_sync.projects['1'].tasks[0].content = 'corrupt'; }, TypeError);
  const settings = await store.queryControlStore(state => state.settings);
  settings.codex.chat.model = 'caller-owned';
  assert.notEqual((await store.queryControlStore(state => state.settings)).codex.chat.model, 'caller-owned');
  await store.updateTaskSync(sync => { sync.projects['1'].state = 'connected'; });
  const next = await store.captureStateView();
  assert.equal(next.revision, old.revision + 1);
  assert.equal(old.state.platform.task_sync.projects['1'].state, 'idle');
  assert.equal(next.state.platform.task_sync.projects['1'].state, 'connected');
  assert.equal(next.state.platform.task_sync.projects['2'].tasks, old.state.platform.task_sync.projects['2'].tasks);
  assert.equal(next.state.sessions, old.state.sessions);
});

test('task-sync failed commit preserves published and durable state, queue recovers', async t => {
  let fail = false;
  const { store, options } = await fixture(t, { async writeJson(path, value) {
    if (fail && path.endsWith('desktop-store.json')) throw Error('injected control commit failure');
    await writeFile(path, JSON.stringify(value));
  } });
  const old = await store.captureStateView();
  const disk = await readFile(options.storePath, 'utf8');
  fail = true;
  await assert.rejects(store.updateTaskSync(sync => { sync.projects['1'].state = 'connected'; }), /injected/);
  assert.equal((await store.captureStateView()).state, old.state);
  assert.equal(await readFile(options.storePath, 'utf8'), disk);
  await assert.rejects(store.updateTaskSync(sync => { sync.projects['1'].tasks[0].content = 'invalid mutation'; }), TypeError);
  fail = false;
  await Promise.all([
    store.updateTaskSync(sync => { sync.projects['1'].state = 'connected'; }),
    store.updateControlStore(draft => { draft.settings.codex.chat.model = 'new-model'; })
  ]);
  const reopened = await createDesktopStore(options).captureStateView();
  assert.equal(reopened.state.platform.task_sync.projects['1'].state, 'connected');
  assert.equal(reopened.state.settings.codex.chat.model, 'new-model');
});

test('Work Sync uses shared revisions, keeps public snapshots mutable and commits task responses', async t => {
  const { store } = await fixture(t);
  const manager = {
    captureDesktopStateView: store.captureStateView,
    updateDesktopTaskSync: store.updateTaskSync,
    readDesktopStore() { throw Error('unexpected global copy'); },
    updateDesktopStore() { throw Error('unexpected global update'); }
  };
  const source = {
    async updateTask(id, input) { return { id, project_id: '1', ...input }; },
    async listProjectTasks() { return [{ id: 'T-1', project_id: '1', state: 'completed', content: 'updated' }]; },
    async listProjectTags() { return []; }
  };
  const sync = createWorkSyncCoordinator({ runManager: manager, taskSource: {}, platformSource: source });
  const view = await store.captureStateView();
  await sync.updateRealtimeProjectState('1', { state: 'connected' });
  const old = await sync.getSnapshot({}, view);
  assert.equal(old.project_states['1'].state, 'idle');
  old.tasks[0].content = 'caller';
  assert.notEqual((await sync.getSnapshot()).tasks[0].content, 'caller');
  const result = await sync.updateTask('T-1', { state: 'completed' });
  result.content = 'caller';
  assert.equal((await sync.getSnapshot()).tasks.find(task => task.id === 'T-1').content, 'updated');
});

test('platform snapshot captures once and supplies the identical revision to both coordinators', async t => {
  const { store } = await fixture(t);
  let captures = 0;
  const views = [];
  const coordinator = createPlatformCoordinator({
    runManager: { async captureDesktopStateView() { captures++; return store.captureStateView(); }, readDesktopStore() { throw Error('global copy'); } },
    automationCoordinator: { async getSnapshot(_filter, view) { views.push(view); return { projects: [], queue: [], project_bindings: {} }; } },
    workSync: { async getSnapshot(_filter, view) { views.push(view); return { projects: [], tasks: [], tags: [], errors: [], project_catalog: [] }; } },
    platformSource: { async listOrganizations() { return []; }, async listProjects() { return []; } }
  });
  await coordinator.getSnapshot({ sections: [] });
  assert.equal(captures, 1);
  assert.equal(views.length, 2);
  assert.equal(views[0], views[1]);
});


test('task-sync replacements normalize inputs and detach caller-owned task bodies', async t => {
  const { store } = await fixture(t);
  const task = { id: 'T-new', content: 'new body', raw: { nested: 'original' } };
  await store.updateTaskSync(sync => {
    sync.projects['1'].tasks = [null, task];
    sync.projects['1'].tags = [null, 'invalid', { id: 'tag' }];
  });
  task.raw.nested = 'changed by caller';
  const project = await store.queryControlStore(state => state.platform.task_sync.projects['1']);
  assert.equal(project.tasks.length, 1);
  assert.equal(project.tasks[0].raw.nested, 'original');
  assert.equal(project.tags.length, 1);
});
