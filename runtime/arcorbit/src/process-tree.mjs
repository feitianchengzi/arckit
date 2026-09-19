import { execFileSync } from 'node:child_process';

// Utility processes have no private process group. Capture descendants while
// the parent is alive; never find processes by a broad command-name pattern.
export function descendantPids(rootPid) {
  if (!Number.isInteger(rootPid) || rootPid <= 1 || process.platform === 'win32') return [];
  const rows = execFileSync('ps', ['-axo', 'pid=,ppid='], { encoding: 'utf8' }).trim().split('\n').map(line => line.trim().split(/\s+/).map(Number));
  const owned = new Set([rootPid]);
  let changed = true;
  while (changed) {
    changed = false;
    for (const [pid, parent] of rows) if (owned.has(parent) && !owned.has(pid)) { owned.add(pid); changed = true; }
  }
  return [...owned].filter(pid => pid !== rootPid).reverse();
}
export function terminateProcessTree(child, signal = 'SIGKILL') {
  if (!child?.pid) return child?.kill?.(signal);
  if (process.platform === 'win32') {
    try { execFileSync('taskkill', ['/PID', String(child.pid), '/T', '/F'], { stdio: 'ignore' }); }
    catch (error) { if (child.exitCode === null) throw error; }
    return;
  }
  for (const pid of [...descendantPids(child.pid), child.pid]) {
    try { process.kill(pid, signal); } catch (error) { if (error.code !== 'ESRCH') throw error; }
  }
}
