import assert from 'node:assert/strict';
import fs from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { execFileSync, spawn } from 'node:child_process';
import test from 'node:test';
import { prepareProjectWorkspace } from '../../../entry/skills/arckit-development-ledger/scripts/project-gitignore.mjs';
import { ensureArckitProject } from '../src/project-initializer.mjs';
import { runLedgerScript } from '../src/ledger-scripts.mjs';

const script = fileURLToPath(new URL('../../../entry/skills/arckit-development-ledger/scripts/project-state.mjs', import.meta.url));
const dirs = ['arckit/debug', 'arckit/project', 'arckit/cases'];
function project(t, gitRepo = true) {
  const root = fs.mkdtempSync(join(tmpdir(), 'arckit-ignore-'));
  t.after(() => fs.rmSync(root, { recursive: true, force: true }));
  if (gitRepo) git(root, 'init', '-q');
  return root;
}
function git(root, ...args) { return execFileSync('git', ['-C', root, ...args], { encoding: 'utf8' }); }
function put(root, file, content = 'fixture') { fs.mkdirSync(join(root, file, '..'), { recursive: true }); fs.writeFileSync(join(root, file), content); }
function ignored(root) {
  for (const dir of dirs) assert.match(git(root, 'check-ignore', '--no-index', '-v', `${dir}/probe`), /\.gitignore/);
}

test('new project ignores local state, leaving definitions available for Git', async t => {
  const root = project(t);
  for (const dir of [...dirs, 'arckit/spec', 'arckit/interaction', 'arckit/visual', 'arckit/tech']) put(root, `${dir}/probe`);
  const result = await prepareProjectWorkspace(root);
  assert.deepEqual(result.changed_files, ['.gitignore']);
  assert.equal(result.git_status, 'verified');
  ignored(root);
  const untracked = git(root, 'ls-files', '--others', '--exclude-standard');
  for (const dir of dirs) assert.ok(!untracked.includes(dir));
  for (const dir of ['spec', 'interaction', 'visual', 'tech']) assert.ok(untracked.includes(`arckit/${dir}/probe`));
  const time = fs.statSync(join(root, '.gitignore')).mtimeMs;
  assert.deepEqual((await prepareProjectWorkspace(root)).changed_files, []);
  assert.equal(fs.statSync(join(root, '.gitignore')).mtimeMs, time);
});

test('matches targets individually, consolidates exact rules and preserves block position and contents', async t => {
  const root = project(t), file = join(root, '.gitignore');
  const begin = '# BEGIN Arckit local state and evidence\r\n';
  const end = '# END Arckit local state and evidence\r\n';
  const before = '# existing\r\n/arckit/debug/\r\n';
  const inside = '# custom comment\r\narckit/project/  \r\n\r\ncustom-cache/\r\n';
  const after = 'node_modules/\r\n/arckit/cases\r\n/arckit/project/\r\n/arckit/cases-extra/\r\narckit/*/cache/\r\n';
  fs.writeFileSync(file, before + begin + inside + '/arckit/project/\r\n' + end + after);
  fs.chmodSync(file, 0o640);
  await prepareProjectWorkspace(root);
  const expected = '# existing\r\n' + begin + inside + '/arckit/debug/\r\n/arckit/cases/\r\n' + end
    + 'node_modules/\r\n/arckit/cases-extra/\r\narckit/*/cache/\r\n';
  assert.equal(fs.readFileSync(file, 'utf8'), expected);
  assert.equal(fs.statSync(file).mode & 0o777, 0o640);
  ignored(root);
  const time = fs.statSync(file).mtimeMs;
  assert.deepEqual((await prepareProjectWorkspace(root)).changed_files, []);
  assert.equal(fs.statSync(file).mtimeMs, time);
  fs.writeFileSync(file, expected.replace('/arckit/cases/\r\n', ''));
  await prepareProjectWorkspace(root);
  assert.equal(fs.readFileSync(file, 'utf8'), expected);
});

test('first creation consolidates exact external rules and appends a block', async t => {
  const root = project(t), file = join(root, '.gitignore');
  fs.writeFileSync(file, '# note\n/arckit/project/\narckit/cases\n*.log\n!/keep.log');
  await prepareProjectWorkspace(root);
  assert.equal(fs.readFileSync(file, 'utf8'), '# note\n*.log\n!/keep.log\n# BEGIN Arckit local state and evidence\n/arckit/debug/\n/arckit/project/\n/arckit/cases/\n# END Arckit local state and evidence\n');
  ignored(root);
});

test('later negation is preserved and reported without relocating the block', async t => {
  const root = project(t), file = join(root, '.gitignore');
  await prepareProjectWorkspace(root);
  fs.appendFileSync(file, '!/arckit/project/\n');
  const before = fs.readFileSync(file), time = fs.statSync(file).mtimeMs;
  await assert.rejects(prepareProjectWorkspace(root), /conflict.*arckit\/project/);
  assert.deepEqual(fs.readFileSync(file), before);
  assert.equal(fs.statSync(file).mtimeMs, time);
});

test('complete middle block without final newline is byte-for-byte unchanged', async t => {
  const root = project(t), file = join(root, '.gitignore');
  const text = '# heading\n# BEGIN Arckit local state and evidence\narckit/project\n/arckit/cases/\narckit/debug/\n# END Arckit local state and evidence\n# footer';
  fs.writeFileSync(file, text);
  assert.deepEqual((await prepareProjectWorkspace(root)).changed_files, []);
  assert.equal(fs.readFileSync(file, 'utf8'), text);
});

test('reports tracked paths without changing staged or working content', async t => {
  const root = project(t);
  put(root, 'arckit/project/state.record.json', 'staged');
  put(root, 'unrelated.txt', 'unrelated staged');
  git(root, 'add', '.');
  put(root, 'arckit/project/state.record.json', 'unstaged');
  const index = fs.readFileSync(join(root, '.git/index'));
  const result = await prepareProjectWorkspace(root);
  assert.equal(result.tracked_path_count, 1);
  assert.ok(result.warnings.length);
  assert.deepEqual(fs.readFileSync(join(root, '.git/index')), index);
  assert.equal(fs.readFileSync(join(root, 'arckit/project/state.record.json'), 'utf8'), 'unstaged');
});

test('rejects malformed blocks and symlinks without replacing user content', async t => {
  const root = project(t), file = join(root, '.gitignore');
  fs.writeFileSync(file, '# BEGIN Arckit local state and evidence\nmanual/\n');
  const before = fs.readFileSync(file);
  await assert.rejects(prepareProjectWorkspace(root), /malformed/);
  assert.deepEqual(fs.readFileSync(file), before);
  fs.unlinkSync(file); put(root, 'original', 'manual/\n');
  fs.symlinkSync(join(root, 'original'), file);
  await assert.rejects(prepareProjectWorkspace(root), /regular/);
  assert.equal(fs.readFileSync(join(root, 'original'), 'utf8'), 'manual/\n');
});

test('nested overrides fail visibly rather than claiming successful protection', async t => {
  const root = project(t);
  put(root, 'arckit/.gitignore', '!project/\n');
  await assert.rejects(prepareProjectWorkspace(root), /conflict.*arckit\/project/);
  fs.unlinkSync(join(root, 'arckit/.gitignore'));
  assert.equal((await prepareProjectWorkspace(root)).git_status, 'verified');
});

test('non-Git project is prepared without creating a repository or ledger', async t => {
  const root = project(t, false);
  assert.equal((await prepareProjectWorkspace(root)).git_status, 'not_a_repository');
  assert.ok(!fs.existsSync(join(root, '.git')));
  assert.ok(!fs.existsSync(join(root, 'arckit')));
  git(root, 'init', '-q'); ignored(root);
});

test('failed preparation stops initialization before creating canonical state', async t => {
  const root = project(t);
  fs.mkdirSync(join(root, '.gitignore'));
  await assert.rejects(ensureArckitProject({ projectRoot: root }), /regular/);
  assert.ok(!fs.existsSync(join(root, 'arckit/project/state.record.json')));
});

test('concurrent CLI preparation shares one managed block', async t => {
  const root = project(t);
  await Promise.all(Array.from({ length: 5 }, () => new Promise((done, fail) => {
    const child = spawn(process.execPath, [script, 'prepare-workspace'], { cwd: root });
    let stderr = ''; child.stderr.on('data', data => stderr += data);
    child.on('error', fail); child.on('close', code => code === 0 ? done() : fail(new Error(stderr)));
  })));
  assert.equal(fs.readFileSync(join(root, '.gitignore'), 'utf8').split('# BEGIN').length, 2);
  ignored(root);
});

test('Desktop preparation repairs existing projects and protocol recovery also prepares rules', async t => {
  const root = project(t);
  await ensureArckitProject({ projectRoot: root, projectName: 'Fixture' });
  const state = join(root, 'arckit/project/state.record.json');
  const before = fs.readFileSync(state);
  fs.unlinkSync(join(root, '.gitignore'));
  const result = await ensureArckitProject({ projectRoot: root });
  assert.ok(result.changed_files.includes('.gitignore')); ignored(root);
  assert.deepEqual(fs.readFileSync(state), before);
  const legacy = JSON.parse(before); legacy.schema_version = 'project-state-record/v4';
  fs.writeFileSync(state, JSON.stringify(legacy)); fs.unlinkSync(join(root, '.gitignore'));
  assert.equal((await ensureArckitProject({ projectRoot: root })).recovery_required, true);
  ignored(root);
});

test('direct CLI init and in-process init both prepare rules; read operations stay read-only', async t => {
  const cliRoot = project(t), apiRoot = project(t);
  execFileSync(process.execPath, [script, 'init', '--name', 'CLI'], { cwd: cliRoot }); ignored(cliRoot);
  await runLedgerScript(apiRoot, ['project-state.mjs', 'init', '--name', 'API']); ignored(apiRoot);
  fs.unlinkSync(join(apiRoot, '.gitignore'));
  await runLedgerScript(apiRoot, ['loop-snapshot.mjs', 'read']);
  await runLedgerScript(apiRoot, ['protocol-compatibility.mjs', 'probe']);
  assert.ok(!fs.existsSync(join(apiRoot, '.gitignore')));
});

test('nested workspace and linked worktree rules are relative to their own root', async t => {
  const parent = project(t), nested = join(parent, 'nested'); fs.mkdirSync(nested);
  await prepareProjectWorkspace(nested); ignored(nested);
  assert.ok(!fs.existsSync(join(parent, '.gitignore')));
  git(parent, '-c', 'user.name=Fixture', '-c', 'user.email=fixture@example.test', 'commit', '--allow-empty', '-m', 'fixture');
  const linked = project(t, false); fs.rmdirSync(linked);
  git(parent, 'worktree', 'add', '--detach', linked);
  await prepareProjectWorkspace(linked); ignored(linked);
  assert.ok(fs.statSync(join(linked, '.git')).isFile());
});
