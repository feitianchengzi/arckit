import test from 'node:test';
import assert from 'node:assert/strict';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { fileURLToPath } from 'node:url';
import electron from 'electron';

test('Release operates real Git, PTY, tasks, source editor and shared scene Chat', {
  skip: process.env.ARCORBIT_RELEASE_ELECTRON_TEST !== '1' && 'set ARCORBIT_RELEASE_ELECTRON_TEST=1 for real Electron verification'
}, async () => {
  const env = { ...process.env };
  delete env.ELECTRON_RUN_AS_NODE;
  const { stdout } = await promisify(execFile)(electron, [fileURLToPath(new URL('./fixtures/release-workspace-electron.mjs', import.meta.url))], { env, timeout: 90000, maxBuffer: 1024 * 1024 });
  const result = JSON.parse(stdout.trim().split('\n').at(-1));
  assert.equal(result.ok, true);
  assert.equal(result.errors.length, 0);
});
