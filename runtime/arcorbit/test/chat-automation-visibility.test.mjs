import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { createDesktopRunManager } from '../src/desktop-run-manager.mjs';
import { normalizeStore } from '../src/desktop/desktop-store.mjs';
import { createChatCoordinator } from '../src/chat-coordinator.mjs';
import { createChatNative } from '../src/chat-native.mjs';

test('legacy task visibility preserves explicit opens, deletions and Chat-origin identities', () => {
  const sessions = [
    { id: 'BACKGROUND', kind: 'automation-task', thread_id: 'T' },
    { id: 'OPENED', kind: 'automation-task', chat_hidden: false },
    { id: 'CHAT-linked', kind: 'automation-task' },
    { id: 'CHAT-deleted', kind: 'automation-task', chat_hidden: true },
    { id: 'FREE', kind: 'chat' }
  ];
  const normalized = normalizeStore({ sessions: { local: sessions } });
  assert.deepEqual(normalized.sessions.local.map(s => s.chat_hidden), [true, false, false, true, false]);
  assert.equal(normalized.sessions.local[0].thread_id, 'T');
  assert.deepEqual(normalizeStore(normalized).sessions, normalized.sessions);
});

test('background task stays hidden until explicit open, with identity retained across refresh and restart', async t => {
  const root = await mkdtemp(join(tmpdir(), 'chat-visibility-'));
  t.after(() => rm(root, { recursive: true, force: true }));
  const manager = () => createDesktopRunManager({ runtimeRoot: root, dataDir: root });
  const runManager = manager();
  await runManager.updateDesktopStore(s => {
    s.projects.push({ id: 'local', name: 'Fixture', path: root });
    s.automation.project_bindings = { remote: 'local' };
    return s;
  });
  await runManager.bindTaskThread('local', 'task', { threadId: 'ORIGINAL-THREAD' });
  const task = await runManager.createSession('local', { kind: 'automation-task', task_id: 'task', remote_project_id: 'remote' });
  const free = await runManager.createSession('local', { kind: 'chat' });
  const work = { projects: [{ id: 'remote' }], project_catalog: [{ id: 'remote' }], tasks: [{ id: 'task', project_id: 'remote', content: 'Task' }], errors: [] };
  let native;
  const chat = createChatCoordinator({ runManager, acceptedSessionKinds: ['chat', 'automation-task'], authorizeSession: (s, c) => native.authorizeSession(s, c) });
  native = createChatNative({ runManager, chat, getAccountScope: async () => 'account:test', workSync: { getSnapshot: async () => work, reconcile: async () => work } });
  t.after(async () => { await chat.close(); await native.close(); });
  const ids = async () => (await chat.getSnapshot()).sessions.map(s => s.id);
  assert.equal(task.chat_hidden, true);
  assert.deepEqual(await ids(), [free.id]);
  await assert.rejects(chat.select({ session_id: task.id }), /hidden/);
  const opened = await native.openTask({ project_id: 'local', task_id: 'task' });
  assert.equal(opened.session_id, task.id);
  assert.ok((await ids()).includes(task.id));
  assert.equal((await chat.select({ session_id: task.id })).selected_session_id, task.id);
  assert.equal((await native.openTask({ project_id: 'local', task_id: 'task' })).session_id, task.id);
  const restarted = manager();
  const persisted = (await restarted.listSessions('local')).find(s => s.id === task.id);
  assert.equal(persisted.chat_hidden, false);
  assert.equal(persisted.thread_id, 'ORIGINAL-THREAD');
  assert.equal((await restarted.getTaskThreadBinding('local', 'task')).threadId, 'ORIGINAL-THREAD');
  await chat.delete({ session_id: task.id });
  assert.deepEqual(await ids(), [free.id]);
  assert.equal((await native.openTask({ project_id: 'local', task_id: 'task' })).session_id, task.id);
  assert.ok((await ids()).includes(task.id));
  assert.equal((await runManager.listSessions('local')).filter(s => s.task_id === 'task').length, 1);
});
