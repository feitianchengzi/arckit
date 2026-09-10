import test from 'node:test';
import assert from 'node:assert/strict';
import { realpath, mkdtemp, mkdir, readFile, writeFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { createProcessService } from '../src/release/process-service.mjs';
import { createReleaseCoordinator } from '../src/release/release-coordinator.mjs';

async function fixture(t) {
  const dir = await realpath(await mkdtemp(join(tmpdir(), 'arcorbit-process-')));
  t.after(() => rm(dir, { recursive: true, force: true }));
  await mkdir(join(dir, 'project'));
  return { dir, owner: { scope: 'account', id: '11', path: join(dir, 'project') } };
}
async function until(fn) {
  for (let n = 0; n < 100; n++) {
    const value = await fn();
    if (value) return value;
    await new Promise(resolve => setTimeout(resolve, 50));
  }
  throw new Error('Execution did not reach expected state');
}

test('real tasks survive view detachment, keep ownership, stop and persist across restart', async t => {
  const { dir, owner } = await fixture(t);
  const service = createProcessService({ dataDir: dir });
  t.after(() => service.close());
  // Node inherits the same PATH as developer tasks; no production file is touched.
  const task = await service.start(owner, { command: 'node -e "console.log(123);setInterval(()=>{},1000)"' });
  await until(async () => (await service.read(owner, task.id)).log.includes('123'));
  await assert.rejects(service.read({ ...owner, id: '12' }, task.id), /不属于/);
  await service.control(owner, task.id, 'stop');
  await until(async () => (await service.read(owner, task.id)).status === 'stopped');
  await service.close();
  const resumed = createProcessService({ dataDir: dir });
  t.after(() => resumed.close());
  const record = await resumed.read(owner, task.id);
  assert.equal(record.status, 'stopped');
  assert(record.log.includes('123'));
});

test('restart marks unclosed records interrupted and never attaches an old PID', async t => {
  const { dir, owner } = await fixture(t);
  await writeFile(join(dir, 'executions.json'), JSON.stringify({ version: 1, records: [{ id: 'old', scope: owner.scope, project_id: owner.id, workspace: owner.path, pid: process.pid, status: 'running', log: 'last output' }] }));
  let spawns = 0;
  const service = createProcessService({ dataDir: dir, spawnHost() { spawns++; throw new Error('must not spawn'); } });
  t.after(() => service.close());
  assert.equal((await service.read(owner, 'old')).status, 'interrupted');
  assert.equal(spawns, 0);
});

test('rebound project can stop old work but cannot send stdin or reuse an editor baseline', async t => {
  const { dir, owner } = await fixture(t);
  let path = owner.path;
  const c = createReleaseCoordinator({ dataDir: join(dir, 'state'), getPlatform: async () => ({ projects: [{ id: owner.id, name: 'A', local_project_path: path }] }), getAccountScope: async () => owner.scope, getSettings: async () => ({}), getCodexExecutable: () => 'codex' });
  t.after(() => c.close());
  const task = await c.command('task.start', { project_id: owner.id, command: 'node -e "setInterval(()=>{},1000)"' });
  path = dir;
  assert.equal((await c.command('execution.read', { project_id: owner.id, id: task.id })).workspace, owner.path);
  await assert.rejects(c.command('execution.control', { project_id: owner.id, id: task.id, action: 'write', data: 'x' }), /不属于/);
  await assert.rejects(c.command('files.save', { project_id: owner.id, expected_workspace: owner.path, path: 'file', text: 'x', revision: 'old' }), /已变化/);
  await c.command('execution.control', { project_id: owner.id, id: task.id, action: 'stop' });
  await until(async () => (await c.command('execution.read', { project_id: owner.id, id: task.id })).status === 'stopped');
});
