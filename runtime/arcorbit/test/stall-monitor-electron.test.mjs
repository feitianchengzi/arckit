import test from 'node:test';
import assert from 'node:assert/strict';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { fileURLToPath } from 'node:url';
import electron from 'electron';
test('Electron stall heartbeat and runtime diagnostics hand off multi-record context to Chat', {
  skip: process.env.ARCORBIT_STALL_ELECTRON_TEST !== '1' && 'set ARCORBIT_STALL_ELECTRON_TEST=1', timeout: 45000
}, async () => {
  const env = { ...process.env, ELECTRON_DISABLE_SECURITY_WARNINGS: 'true' }; delete env.ELECTRON_RUN_AS_NODE;
  const { stdout } = await promisify(execFile)(electron, [fileURLToPath(new URL('./fixtures/stall-monitor-electron.mjs', import.meta.url))], { env, timeout: 40000, maxBuffer: 1024 * 1024 });
  assert.equal(JSON.parse(stdout.trim()).status, 'passed');
});
