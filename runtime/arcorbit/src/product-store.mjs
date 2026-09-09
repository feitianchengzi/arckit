import { readFile, writeFile, rename, mkdir } from 'node:fs/promises';
import { dirname } from 'node:path';
import { randomUUID } from 'node:crypto';
// Each owner has a separate bounded record; warm reads never touch disk.
export function createProductStore(path, initial) {
  let state; let loading; let tail = Promise.resolve();
  async function load() {
    if (state) return state;
    loading ||= (async () => {
      try { state = JSON.parse(await readFile(path, 'utf8')); }
      catch (e) { if (e.code !== 'ENOENT') throw e; state = structuredClone(initial); }
      return state;
    })();
    return loading;
  }
  return {
    async read() { await tail; return structuredClone(await load()); },
    update(fn) {
      const operation = tail.then(async () => {
        const draft = structuredClone(await load()); const next = await fn(draft) || draft;
        await mkdir(dirname(path), { recursive: true, mode: 0o700 });
        const tmp = `${path}.${randomUUID()}.tmp`;
        await writeFile(tmp, JSON.stringify(next), { mode: 0o600, flag: 'wx' });
        await rename(tmp, path); state = next; return structuredClone(state);
      });
      tail = operation.catch(() => {}); return operation;
    }
  };
}
