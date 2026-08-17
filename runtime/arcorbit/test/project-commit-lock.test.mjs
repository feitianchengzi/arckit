import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { once } from 'node:events';
import { mkdtemp } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import test from 'node:test';

import { withProjectCommitLock } from '../../../entry/skills/arckit-development-ledger/scripts/project-commit-lock.mjs';

const lockModuleUrl = new URL('../../../entry/skills/arckit-development-ledger/scripts/project-commit-lock.mjs', import.meta.url).href;

test('Project ledger commit lock serializes separate processes', async () => {
  const projectRoot = await mkdtemp(join(tmpdir(), 'arckit-project-lock-'));
  let child;
  let childOutput = '';

  await withProjectCommitLock(projectRoot, async () => {
    const source = `
      import { withProjectCommitLock } from ${JSON.stringify(lockModuleUrl)};
      await withProjectCommitLock(process.argv[1], async () => process.stdout.write('acquired'));
    `;
    child = spawn(process.execPath, ['--input-type=module', '--eval', source, projectRoot], { stdio: ['ignore', 'pipe', 'pipe'] });
    child.stdout.setEncoding('utf8');
    child.stdout.on('data', (chunk) => { childOutput += chunk; });
    await delay(120);
    assert.equal(childOutput, '');
  });

  const [exitCode] = await once(child, 'exit');
  assert.equal(exitCode, 0);
  assert.equal(childOutput, 'acquired');
});

function delay(milliseconds) {
  return new Promise((resolveDelay) => setTimeout(resolveDelay, milliseconds));
}
