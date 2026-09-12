import { createHash, randomUUID } from 'node:crypto';
import { mkdir, readFile, rm, stat, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';

const DEFAULT_TIMEOUT_MS = 15_000;
const DEFAULT_STALE_MS = 300_000;
const RETRY_MS = 25;

export async function withProjectCommitLock(projectRoot, operation, options = {}) {
  const root = path.resolve(projectRoot);
  const timeoutMs = options.timeoutMs ?? DEFAULT_TIMEOUT_MS;
  const staleMs = options.staleMs ?? DEFAULT_STALE_MS;
  const lockRoot = path.join(tmpdir(), 'arckit-ledger-locks');
  const lockName = createHash('sha256').update(root).digest('hex');
  const lockDir = path.join(lockRoot, lockName);
  const ownerPath = path.join(lockDir, 'owner.json');
  const token = randomUUID();
  const deadline = Date.now() + timeoutMs;

  await mkdir(lockRoot, { recursive: true });
  while (true) {
    try {
      await mkdir(lockDir);
      await writeFile(ownerPath, `${JSON.stringify({ token, pid: process.pid, project_root: root, acquired_at: new Date().toISOString() })}\n`, { mode: 0o600 });
      break;
    } catch (error) {
      if (error?.code !== 'EEXIST') throw error;
      if (await isStale(lockDir, staleMs)) {
        await rm(lockDir, { recursive: true, force: true });
        continue;
      }
      if (Date.now() >= deadline) throw new Error(`Timed out waiting for the Project ledger commit lock: ${root}`);
      await delay(RETRY_MS);
    }
  }

  try {
    return await operation();
  } finally {
    if (await ownerMatches(ownerPath, token)) await rm(lockDir, { recursive: true, force: true });
  }
}

async function isStale(lockDir, staleMs) {
  try {
    const info = await stat(lockDir);
    return Date.now() - info.mtimeMs > staleMs;
  } catch (error) {
    if (error?.code === 'ENOENT') return false;
    throw error;
  }
}

async function ownerMatches(ownerPath, token) {
  try {
    return JSON.parse(await readFile(ownerPath, 'utf8')).token === token;
  } catch (error) {
    if (error?.code === 'ENOENT') return false;
    throw error;
  }
}

function delay(milliseconds) {
  return new Promise((resolve) => setTimeout(resolve, milliseconds));
}
