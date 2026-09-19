import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { fileURLToPath } from 'node:url';
import electron from 'electron';
import { electronFixtureArguments } from './electron-fixture-launch.mjs';

test('packaged visual tokens match the authoritative design projection', async () => {
  const [source, packaged] = await Promise.all([
    readFile(new URL('../../../arckit/visual/_library/generated-tokens.css', import.meta.url), 'utf8'),
    readFile(new URL('../desktop/renderer/visual-tokens.css', import.meta.url), 'utf8')
  ]);
  assert.equal(packaged, source, 'Run npm run sync:visual after updating visual tokens');
});
test('production pages apply apricot actions and readable neutral chrome', {
  skip: process.env.ARCORBIT_ELECTRON_LAYOUT_TEST !== '1' && 'Set ARCORBIT_ELECTRON_LAYOUT_TEST=1'
}, async () => {
  const fixture = fileURLToPath(new URL('./fixtures/visual-system-electron.mjs', import.meta.url));
  const env = { ...process.env }; delete env.ELECTRON_RUN_AS_NODE;
  const { stdout } = await promisify(execFile)(electron, electronFixtureArguments(fixture), { env, timeout: 45000 });
  assert.equal(JSON.parse(stdout.trim()).pages.length, 11);
});
