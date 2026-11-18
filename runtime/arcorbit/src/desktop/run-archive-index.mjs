import { Worker } from 'node:worker_threads';
import { readFile, stat } from 'node:fs/promises';
import { join } from 'node:path';
import { writeJson } from './desktop-store.mjs';

export function createRunArchiveIndex({ runsDir, now = Date.now, ttlMs = 1000 }) {
  const file = join(runsDir, 'conversation-index.json');
  let entries = null;
  let pending = null;
  let refreshedAt = -Infinity;
  let directoryStamp = '';
  let diagnostics = { parsedFiles: 0, parsedBytes: 0 };
  async function refresh() {
    if (pending) return pending;
    pending = (async () => {
      const info = await stat(runsDir).catch(e => { if (e.code === 'ENOENT') return null; throw e; });
      const stamp = info ? `${info.mtimeMs}:${info.ctimeMs}` : '';
      if (entries && stamp === directoryStamp && now() - refreshedAt < ttlMs) return entries;
      if (!entries) {
        try {
          const cached = JSON.parse(await readFile(file, 'utf8'));
          entries = cached.schema_version === 'run-conversation-index/v1' ? cached.entries : {};
        } catch { entries = {}; } // A derived index is always rebuildable.
      }
      const result = await new Promise((resolve, reject) => {
        const worker = new Worker(new URL('./run-archive-index-worker.mjs', import.meta.url),
          { workerData: { runsDir, previous: entries }, execArgv: [] });
        worker.once('message', resolve);
        worker.once('error', reject);
        worker.once('exit', code => { if (code) reject(new Error(`Archive index worker exited: ${code}`)); });
      });
      entries = result.entries;
      diagnostics = { parsedFiles: result.parsedFiles, parsedBytes: result.parsedBytes };
      refreshedAt = now();
      await writeJson(file, { schema_version: 'run-conversation-index/v1', entries }).catch(() => {});
      const after = await stat(runsDir).catch(() => null);
      directoryStamp = after ? `${after.mtimeMs}:${after.ctimeMs}` : '';
      return entries;
    })().finally(() => { pending = null; });
    return pending;
  }
  return { refresh, diagnostics: () => ({ ...diagnostics }), async find(session, threadId) {
    return Object.entries(await refresh()).filter(([, item]) =>
      (item.session_id === session.id && item.project_id === session.project_id)
      || ((!item.project_id || item.project_id === session.project_id) && threadId
        && item.thread_id === threadId && item.task_id === String(session.task_id))
    ).map(([id]) => id);
  } };
}
