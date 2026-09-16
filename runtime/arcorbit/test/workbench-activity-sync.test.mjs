import test from 'node:test';
import assert from 'node:assert/strict';
import { createWorkbenchActivitySync } from '../desktop/renderer/workbench-activity-sync.mjs';

const detail = () => ({ task: { id: 'T1' }, local_project: { id: 'P1' }, runs: [{ id: 'R1' }], activity: { projection_revision: 0, messages: [] }, result: null });
const event = (base = 0, runId = 'R1') => ({
  runId, owner: { run_id: runId, task_id: 'T1', project_id: 'P1' },
  patch: { schema_version: 'run.activity.patch/v1', run_id: runId, base_revision: base, revision: base + 1,
    changed: {}, message_upserts: [{ id: 'M1', role: 'assistant', content: `progress ${base + 1}` }] }
});
function fixture(readActivity = async () => { throw new Error('unexpected snapshot read'); }) {
  let current = detail();
  const updates = [], errors = [];
  const sync = createWorkbenchActivitySync({ getDetail: () => current, readActivity,
    onUpdate: value => updates.push(value), onError: error => errors.push(error), schedule: () => 1 });
  return { sync, updates, errors, get current() { return current; }, set current(value) { current = value; } };
}

test('workbench applies ordered activity deltas without reloading lists or detail', async () => {
  const f = fixture();
  f.sync.enqueue(event());f.sync.enqueue(event(1));
  await f.sync.flush();
  assert.equal(f.current.activity.projection_revision, 2);
  assert.equal(f.current.activity.messages[0].content, 'progress 2');
  assert.equal(f.updates.length, 2);assert.deepEqual(f.errors, []);
});

test('inactive workbench and unrelated task or project events do no work', async () => {
  const f = fixture();
  assert.equal(f.sync.enqueue(event(0, 'R2')), false);
  assert.equal(f.sync.enqueue({ ...event(), owner: { task_id: 'T2' } }), false);
  assert.equal(f.sync.enqueue({ ...event(), owner: { project_id: 'P2' } }), false);
  f.current = null;assert.equal(f.sync.enqueue(event()), false);
  await f.sync.flush();assert.equal(f.updates.length, 0);
});

test('a revision gap hydrates only the selected run, then continues applying deltas', async () => {
  let reads = 0;
  const f = fixture(async id => { reads++;assert.equal(id, 'R1');return { owner: event().owner,
    run: { id, activity: { projection_revision: 4, messages: [], agent_loop_result: { summary: 'verified' } } } }; });
  f.sync.enqueue(event(3));f.sync.enqueue(event(4));await f.sync.flush();
  assert.equal(reads, 1);assert.equal(f.current.activity.projection_revision, 5);
  assert.equal(f.current.result.summary, 'verified');assert.deepEqual(f.errors, []);
});

test('activity responses cannot overwrite a switched task or a newer full detail', async () => {
  for (const replacement of [null, detail(), { ...detail(), task: { id: 'T2' }, runs: [{ id: 'R2' }] }]) {
    let resolve;const f = fixture(() => new Promise(r => { resolve = r; }));
    const original = f.current;f.sync.enqueue(event(5));const pending = f.sync.flush();
    f.current = replacement;resolve({ owner: event().owner, run: { id: 'R1', activity: { projection_revision: 6 } } });
    await pending;assert.equal(original.activity.projection_revision, 0);assert.equal(f.updates.length, 0);
  }
});

test('fallback rejects a different run or owner and reports read errors', async () => {
  for (const snapshot of [null, { run: { id: 'R2' } }, { run: { id: 'R1' }, owner: { task_id: 'T2' } }]) {
    const f = fixture(async () => snapshot);f.sync.enqueue(event(2));await f.sync.flush();
    assert.equal(f.updates.length, 0);assert.equal(f.current.activity.projection_revision, 0);
  }
  const f = fixture(async () => { throw new Error('offline'); });f.sync.enqueue(event(2));await f.sync.flush();
  assert.equal(f.errors[0].message, 'offline');
});

test('message-only deltas do not invalidate detail content, result changes do', async () => {
  const current = detail(), changes = [];
  const sync = createWorkbenchActivitySync({ getDetail: () => current, schedule: () => 1,
    onUpdate: (_detail, change) => changes.push(change.detailChanged) });
  sync.enqueue(event());
  sync.enqueue({ ...event(1), patch: { ...event(1).patch, changed: { agent_loop_result: { summary: 'done' } } } });
  sync.enqueue({ ...event(2), patch: { ...event(2).patch, removed: ['agent_loop_result'] } });
  await sync.flush();assert.deepEqual(changes, [false, true, true]);assert.equal(current.result, null);
});
