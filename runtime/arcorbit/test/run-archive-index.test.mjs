import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, mkdir, writeFile, rm } from 'node:fs/promises';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { createRunArchiveIndex } from '../src/desktop/run-archive-index.mjs';

test('archive ownership index preserves legacy isolation, refreshes changes, and reopens without parsing transcripts', async () => {
  const runsDir = await mkdtemp(join(tmpdir(), 'arcorbit-archive-index-'));
  const write = async (id, a) => { await mkdir(join(runsDir, id), { recursive: true }); await writeFile(join(runsDir, id, 'activity.json'), JSON.stringify(a)); };
  try {
    await write('legacy', { task_id: 'T', thread_id: 'thread', messages: [{ content: 'x'.repeat(1024 * 1024) }] });
    await write('scoped', { task_id: 'T', session_id: 'S', project_id: 'P' });
    await write('other', { task_id: 'T', thread_id: 'thread', project_id: 'OTHER' });
    const session = { id: 'S', project_id: 'P', task_id: 'T' };
    const index = createRunArchiveIndex({ runsDir, ttlMs: 0 });
    const both = await Promise.all([index.find(session, 'thread'), index.find(session, 'thread')]);
    assert.deepEqual(both[0].sort(), ['legacy', 'scoped']);
    assert.deepEqual(both[1].sort(), both[0]);
    assert.equal(index.diagnostics().parsedFiles, 3);
    const reopened = createRunArchiveIndex({ runsDir, ttlMs: 0 });
    assert.deepEqual((await reopened.find(session, 'thread')).sort(), ['legacy', 'scoped']);
    assert.equal(reopened.diagnostics().parsedBytes, 0);
    await write('scoped', { task_id: 'T', session_id: 'S', project_id: 'OTHER' });
    assert.deepEqual(await reopened.find(session, 'thread'), ['legacy']);
    assert.equal(reopened.diagnostics().parsedFiles, 1);
    await write('new', { task_id: 'T', session_id: 'S', project_id: 'P' });
    assert.deepEqual((await reopened.find(session, 'thread')).sort(), ['legacy', 'new']);
    await rm(join(runsDir, 'legacy'), { recursive: true });
    assert.deepEqual(await reopened.find(session, 'thread'), ['new']);
    await writeFile(join(runsDir, 'conversation-index.json'), 'broken cache');
    assert.deepEqual(await createRunArchiveIndex({ runsDir }).find(session, 'thread'), ['new']);
  } finally { await rm(runsDir, { recursive: true, force: true }); }
});
