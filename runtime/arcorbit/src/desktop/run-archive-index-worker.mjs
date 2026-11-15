import { parentPort, workerData } from 'node:worker_threads';
import { readdir, readFile, stat } from 'node:fs/promises';
import { join } from 'node:path';

// Legacy activities may contain megabytes of transcript. Parse them off the UI
// thread once, retaining only ownership and a freshness fingerprint.
const { runsDir, previous = {} } = workerData;
const entries = {};
let parsedFiles = 0;
let parsedBytes = 0;
for (const dir of await readdir(runsDir, { withFileTypes: true }).catch(e => {
  if (e.code === 'ENOENT') return [];
  throw e;
})) {
  if (!dir.isDirectory()) continue;
  const file = join(runsDir, dir.name, 'activity.json');
  try {
    const before = await stat(file);
    const signature = `${before.size}:${before.mtimeMs}:${before.ctimeMs}`;
    if (previous[dir.name]?.signature === signature) {
      entries[dir.name] = previous[dir.name];
      continue;
    }
    const text = await readFile(file, 'utf8');
    const activity = JSON.parse(text);
    parsedFiles += 1;
    parsedBytes += Buffer.byteLength(text);
    entries[dir.name] = { signature, project_id: activity.project_id || '',
      session_id: activity.session_id || '', task_id: String(activity.task_id || ''),
      thread_id: activity.thread_id || '' };
  } catch (error) {
    if (error.code !== 'ENOENT') throw error;
  }
}
parentPort.postMessage({ entries, parsedFiles, parsedBytes });
