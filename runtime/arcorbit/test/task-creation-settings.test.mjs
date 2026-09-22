import test from 'node:test';
import assert from 'node:assert/strict';
import { taskCreationSettingsKey, taskCreationSelection, readTaskCreationSettings, writeTaskCreationSettings, restoreTaskCreationSettings } from '../desktop/renderer/task-creation-settings.mjs';
const identity = { authentication: { authenticated: true, identity: 'one' }, platform: { user: { id: '7' } }, taskSource: { base_url: 'https://example.test', service_name: 'workshop' } };
const sample = { project_id: '11', state: 'pending', executor_id: '7', father_id: 'parent', tag_ids: ['tag', 'removed'], priority: '0', content: 'never persist', reuse: 'on' };
const context = { projects: [{ value: '11' }, { value: '12' }], defaultProjectId: '12', states: [{ value: 'pending_review' }, { value: 'pending' }], priorities: ['', '0', '1', '2', '3'].map(value => ({ value })), candidatesForProject: () => ({ executor_id: [{ value: '' }, { value: '7' }], father_id: [{ value: '' }, { value: 'parent' }], tag_ids: ['tag'] }) };
function storage() { const entries = new Map(); return { entries, getItem: key => entries.get(key), setItem: (key, value) => entries.set(key, value) }; }
test('remembered settings are isolated by account/source and unavailable without authenticated identity', () => {
  const key = taskCreationSettingsKey(identity), store = storage();
  writeTaskCreationSettings(store, key, { enabled: true, last: sample });
  for (const other of [{ ...identity, platform: { user: { id: '8' } } }, { ...identity, taskSource: { ...identity.taskSource, base_url: 'https://other.test' } }, { ...identity, authentication: { authenticated: true, identity: 'two' } }]) {
    assert.equal(readTaskCreationSettings(store, taskCreationSettingsKey(other)).last, null);
  }
  assert.equal(taskCreationSettingsKey({ ...identity, authentication: { authenticated: false } }), '');
  assert.equal(taskCreationSettingsKey({ ...identity, platform: {} }), '');
  assert.equal(readTaskCreationSettings(store, '').last, null);
  assert.equal(taskCreationSettingsKey({ ...identity, taskSource: { ...identity.taskSource, base_url: 'https://example.test/' } }), key);
});
test('persist only six selections, including explicit no priority; disabling retains successful settings', () => {
  const key = taskCreationSettingsKey(identity), store = storage();
  writeTaskCreationSettings(store, key, { enabled: true, last: sample });
  assert.equal([...store.entries.values()].join().includes('never persist'), false);
  const read = readTaskCreationSettings(store, key);
  assert.deepEqual(Object.keys(read.last).sort(), ['executor_id', 'father_id', 'priority', 'project_id', 'state', 'tag_ids']);
  writeTaskCreationSettings(store, key, { ...read, enabled: false });
  assert.deepEqual(readTaskCreationSettings(store, key).last, read.last);
  assert.equal(taskCreationSelection({ ...sample, priority: undefined }).priority, '');
});
test('restore scoped product and valid association intersection, with invalid values explained', () => {
  const restored = restoreTaskCreationSettings({ enabled: true, last: taskCreationSelection(sample) }, context);
  assert.deepEqual(restored.values, { project_id: '11', state: 'pending', executor_id: '7', father_id: 'parent', tag_ids: ['tag'], priority: '0' });
  assert.match(restored.notice, /部分上次选项已不可用/);
  const invalid = restoreTaskCreationSettings({ enabled: true, last: taskCreationSelection({ ...sample, state: 'bad', priority: 'bad', executor_id: 'bad', father_id: 'bad' }) }, context);
  assert.equal(invalid.values.state, 'pending_review');assert.equal(invalid.values.priority, '');assert.equal(invalid.values.executor_id, '');assert.equal(invalid.values.father_id, '');
});
test('out-of-scope product resets associations while retaining valid independent values', () => {
  const result = restoreTaskCreationSettings({ enabled: true, last: taskCreationSelection(sample) }, { ...context, projects: [{ value: '12' }] });
  assert.deepEqual(result.values, { project_id: '12', state: 'pending', executor_id: '', father_id: '', tag_ids: [], priority: '0' });
  assert.match(result.notice, /上次产品不在当前范围/);
  const disabled = restoreTaskCreationSettings({ enabled: false, last: sample }, context);
  assert.equal(disabled.values.state, 'pending_review');assert.equal(disabled.values.project_id, '12');
});
test('corrupt/unavailable storage reads safely; failed writes are explicit and do not fabricate persistence', () => {
  assert.equal(readTaskCreationSettings({ getItem() { return '{'; } }, 'key').enabled, false);
  assert.match(readTaskCreationSettings({ getItem() { throw Error('unavailable'); } }, 'key').notice, /无法读取/);
  assert.throws(() => writeTaskCreationSettings({ setItem() { throw Error('disk'); } }, 'key', { enabled: true, last: sample }), /disk/);
  assert.throws(() => writeTaskCreationSettings(storage(), '', {}), /身份/);
  assert.equal(readTaskCreationSettings({ getItem() { return '{"version":2,"enabled":true}'; } }, 'key').last, null);
});
