import test from 'node:test';
import assert from 'node:assert/strict';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { fileURLToPath } from 'node:url';
import electron from 'electron';

test('titlebar-free production shell keeps controls, navigation and sync settings usable', {
  skip: process.env.ARCORBIT_ELECTRON_LAYOUT_TEST !== '1' && 'Set ARCORBIT_ELECTRON_LAYOUT_TEST=1'
}, async () => {
  const env = {...process.env}; delete env.ELECTRON_RUN_AS_NODE;
  const fixture = fileURLToPath(new URL('./fixtures/titlebar-free-electron.mjs', import.meta.url));
  const {stdout} = await promisify(execFile)(electron, [fixture], {env, timeout:60000});
  const result = JSON.parse(stdout.trim());
  assert.equal(result.passed, true);
  assert.equal(result.measurements, 14);
});
