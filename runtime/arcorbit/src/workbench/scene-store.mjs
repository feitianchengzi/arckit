import { mkdir, readFile, rename, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { createHash, randomUUID } from 'node:crypto';
const digest = value => createHash('sha256').update(String(value)).digest('hex');
export function emptyScene(taskId) {
  return { task_id: String(taskId), revision: 0, goal_version: '', criteria: [], agreements: [], plan: [], context: [], reports: [], events: [], pause_requested: false, session_id: '', receipts: {} };
}
export function createSceneStore({ dataDir, now = () => new Date().toISOString() }) {
  const cache = new Map();
  const queues = new Map();
  async function read(scope) {
    const key = digest(scope);
    if (!cache.has(key)) {
      let value;
      try { value = JSON.parse(await readFile(join(dataDir, `${key}.json`), 'utf8')); }
      catch (error) { if (error.code !== 'ENOENT') throw error; value = { version: 1, scenes: {}, creations: {} }; }
      if (value.version !== 1) throw new Error('事情场景存储版本不兼容。');
      cache.set(key, value);
    }
    return structuredClone(cache.get(key));
  }
  async function mutate(scope, fn) {
    const key = digest(scope);
    const operation = (queues.get(key) || Promise.resolve()).then(async () => {
      const draft = await read(scope);
      const result = await fn(draft);
      await mkdir(dataDir, { recursive: true });
      const file = join(dataDir, `${key}.json`), temporary = `${file}.${randomUUID()}.tmp`;
      await writeFile(temporary, JSON.stringify(draft), { mode: 0o600 });
      await rename(temporary, file);
      cache.set(key, draft);
      return result;
    });
    queues.set(key, operation.catch(() => {}));
    return operation;
  }
  async function change(scope, taskId, { expected_revision, request_id, actor = 'user', action, input = {} }, fn) {
    if (!request_id) throw new Error('操作缺少请求标识。');
    return mutate(scope, async db => {
      const scene = db.scenes[taskId] ||= emptyScene(taskId);
      const fingerprint = digest(JSON.stringify([action, input]));
      if (scene.receipts[request_id]) {
        if (scene.receipts[request_id].fingerprint !== fingerprint) throw new Error('请求标识已用于其他操作。');
        return structuredClone(scene);
      }
      if (expected_revision !== scene.revision) throw new Error('事情已更新，请刷新后重新提交；输入已保留。');
      await fn(scene);
      scene.revision += 1;
      scene.events.push({ id: randomUUID(), action, actor, at: now(), request_id, message_id: input.message_id || '', summary: String(input.summary || input.text || action).slice(0, 500) });
      scene.receipts[request_id] = { fingerprint, at: now() };
      return structuredClone(scene);
    });
  }
  return { read, mutate, change };
}
export const goalVersion = content => digest(content);
