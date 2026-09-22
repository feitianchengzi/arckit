import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, mkdir, writeFile, readFile, readdir, symlink, lstat, chmod, rename, rm, realpath } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { createChatFiles } from '../src/chat-files.mjs';
import { MAX_CHAT_FILE } from '../src/chat-workspace-files.mjs';
import { listWorkspaceFiles } from '../src/release/workspace-files.mjs';

async function fixture(t) {
  const base = await mkdtemp(join(tmpdir(), 'arcorbit-chat-files-')), root = join(base, 'workspace');
  await mkdir(root); await mkdir(join(base, 'other')); await mkdir(join(base, 'trash'));
  t.after(() => rm(base, { recursive: true, force: true }));
  let account = 'account:1', allowed = true, trashFails = false, reads = 0, beforeMetadata = async () => {};
  const store = { projects: [{ id: 'p', path: root, name: 'Project' }, { id: 'q', path: join(base, 'other'), name: 'Other' }],
    sessions: { p: [{ id: 's', kind: 'chat', project_id: 'p' }, { id: 's2', kind: 'chat', project_id: 'p' }] } };
  const revealed = [];
  const files = createChatFiles({
    runManager: { readDesktopChatMetadata: async () => { reads++; await beforeMetadata(reads); return structuredClone(store); }, readDesktopStore: () => assert.fail('must not load messages') },
    getAccountScope: async () => account, authorizeSession: async () => allowed,
    trashItem: async path => { if (trashFails) throw Error('系统废纸篓失败'); await rename(path, join(base, 'trash', path.split('/').at(-1))); },
    revealItem: path => { revealed.push(path); }
  });
  const owner = { session_id: 's', project_id: 'p' };
  const context = await files.command('context', owner);
  const call = (action, input = {}) => files.command(action, { ...owner, expected_workspace: context.workspace, ...input });
  return { base, root, files, store, call, context, revealed, setAccount: a => account = a, setAllowed: a => allowed = a,
    setTrashFails: a => trashFails = a, metadataHook: fn => { reads = 0; beforeMetadata = fn; } };
}

test('complete lazy listings include hidden, ignored, links and >1000 entries; pagination detects changes; Release filtering unchanged', async t => {
  const f = await fixture(t);
  for (const dir of ['.git', 'node_modules', 'many']) await mkdir(join(f.root, dir));
  await writeFile(join(f.root, '.env'), 'secret'); await writeFile(join(f.root, '.git', 'config'), 'git');
  await symlink('../other', join(f.root, 'linked'));
  for (let i = 0; i < 1005; i++) await writeFile(join(f.root, 'many', `file-${String(i).padStart(4, '0')}`), '');
  const top = await f.call('list', { path: '' });
  assert.deepEqual(new Set(top.entries.map(e => e.name)), new Set(['.git', 'node_modules', 'many', '.env', 'linked']));
  assert.equal(top.entries.find(e => e.name === 'linked').kind, 'link');
  assert.equal(top.entries[0].kind, 'directory');
  const all = []; let offset = 0, directory_revision;
  do { const page = await f.call('list', { path: 'many', offset, directory_revision }); all.push(...page.entries); offset = page.next_offset; directory_revision = page.directory_revision; } while (offset !== null);
  assert.equal(all.length, 1005); assert.equal(new Set(all.map(e => e.path)).size, 1005);
  await writeFile(join(f.root, 'many', 'new'), '');
  await assert.rejects(f.call('list', { path: 'many', offset: 100, directory_revision }), /目录已变化/);
  assert.deepEqual((await listWorkspaceFiles(f.root)).map(e => e.name), ['many']);
});

test('text save preserves mode/BOM, rejects stale or deleted files, and serializes concurrent saves', async t => {
  const f = await fixture(t); await writeFile(join(f.root, '.env'), '\ufefffirst'); await chmod(join(f.root, '.env'), 0o640);
  let file = await f.call('read', { path: '.env' }); assert.equal(file.text, '\ufefffirst');
  file = await f.call('save', { path: '.env', text: '\ufeffsecond', revision: file.revision });
  assert.equal(await readFile(join(f.root, '.env'), 'utf8'), file.text); assert.equal((await lstat(join(f.root, '.env'))).mode & 0o777, 0o640);
  const outcomes = await Promise.allSettled(['one', 'two'].map(text => f.call('save', { path: '.env', revision: file.revision, text })));
  assert.equal(outcomes.filter(x => x.status === 'fulfilled').length, 1); assert.match(outcomes.find(x => x.status === 'rejected').reason.message, /变化/);
  assert.equal(await readFile(join(f.root, '.env'), 'utf8'), outcomes.find(x => x.status === 'fulfilled').value.text);
  await writeFile(join(f.root, '.env'), 'outside');
  await assert.rejects(f.call('save', { path: '.env', text: 'stale', revision: file.revision }), /变化/);
  await rm(join(f.root, '.env')); await assert.rejects(f.call('save', { path: '.env', text: 'recreate', revision: file.revision }), /ENOENT/);
  assert.equal((await readdir(f.root)).length, 0, 'no temporary file leaks or recreation');
});

test('binary, invalid UTF-8, large files and symlinks stay visible without editable text', async t => {
  const f = await fixture(t);
  await writeFile(join(f.root, 'binary'), Buffer.from([0, 1])); await writeFile(join(f.root, 'invalid'), Buffer.from([0xff]));
  await writeFile(join(f.root, 'large'), Buffer.alloc(MAX_CHAT_FILE + 1, 65));
  await writeFile(join(f.base, 'other', 'outside'), 'untouched'); await symlink('../other', join(f.root, 'linked'));
  for (const path of ['binary', 'invalid', 'large', 'linked']) {
    const result = await f.call('read', { path }); assert.ok(result.unsupported); assert.equal(result.text, undefined);
  }
  assert.equal((await f.call('read', { path: 'linked' })).target, '../other');
  for (const action of ['list', 'read', 'save', 'create-file', 'rename', 'trash', 'reveal']) {
    await assert.rejects(f.call(action, { path: 'linked/outside', name: 'new', text: 'bad', revision: 'fake' }), /符号链接/);
  }
  assert.equal(await readFile(join(f.base, 'other', 'outside'), 'utf8'), 'untouched');
});

test('create, rename and trash do not overwrite; links are revealed and removed as entries; trash failure never deletes', async t => {
  const f = await fixture(t);
  await f.call('create-directory', { path: '', name: 'dir' });
  await f.call('create-file', { path: 'dir', name: '空 格`文件.md' });
  await assert.rejects(f.call('create-file', { path: 'dir', name: '空 格`文件.md' }), /EEXIST/);
  await f.call('create-file', { path: 'dir', name: 'collision' });
  await assert.rejects(f.call('rename', { path: 'dir/空 格`文件.md', name: 'collision' }), /已存在/);
  const renamed = await f.call('rename', { path: 'dir', name: 'renamed' }); assert.equal(renamed.path, 'renamed');
  assert.equal(await readFile(join(f.root, 'renamed', '空 格`文件.md'), 'utf8'), '');
  f.setTrashFails(true); await assert.rejects(f.call('trash', { path: 'renamed' }), /废纸篓失败/); assert.ok((await lstat(join(f.root, 'renamed'))).isDirectory());
  f.setTrashFails(false); await f.call('trash', { path: 'renamed' }); assert.ok((await lstat(join(f.base, 'trash', 'renamed'))).isDirectory());
  await symlink('../other', join(f.root, 'link')); await f.call('reveal', { path: 'link' }); assert.equal(f.revealed[0], join(await realpath(f.root), 'link'));
  await f.call('trash', { path: 'link' }); assert.ok((await lstat(join(f.base, 'trash', 'link'))).isSymbolicLink()); assert.ok((await lstat(join(f.base, 'other'))).isDirectory());
});

test('root operations, traversal, invalid names and arbitrary roots are rejected', async t => {
  const f = await fixture(t);
  for (const path of ['', '..', '../outside', '/tmp', 'a/../b', 'a//b', 'a\\b', 'a\0b']) {
    await assert.rejects(f.call('trash', { path }), /相对路径/);
    await assert.rejects(f.call('rename', { path, name: 'new' }), /相对路径/);
  }
  for (const name of ['', '.', '..', '../outside', 'a/b', 'a\\b', 'a\0b']) await assert.rejects(f.call('create-file', { path: '', name }));
  await assert.rejects(f.files.command('list', { project_id: 'missing', root: f.base }), /工作区/);
  await assert.rejects(f.files.command('list', { project_id: 'p' }), /工作区或账号/);
  await assert.rejects(f.call('list', { path: '', offset: -1 }), /分页/);
  await assert.rejects(f.call('exec', { command: 'anything' }), /不支持/);
});

test('session/account/root guards reject mismatch, hidden/unauthorized sessions and rebinding including same-path replacement', async t => {
  const f = await fixture(t);
  await assert.rejects(f.call('list', { path: '', project_id: 'q' }), /不匹配/);
  await assert.rejects(f.call('list', { path: '', session_id: 'missing' }), /会话/);
  f.setAllowed(false); await assert.rejects(f.call('list', { path: '' }), /会话/); f.setAllowed(true);
  f.store.sessions.p[0].chat_hidden = true; await assert.rejects(f.call('list', { path: '' }), /会话/); f.store.sessions.p[0].chat_hidden = false;
  f.setAccount('account:2'); await assert.rejects(f.call('list', { path: '' }), /账号/); f.setAccount('account:1');
  f.store.projects[0].path = join(f.base, 'other'); await assert.rejects(f.call('list', { path: '' }), /工作区/); f.store.projects[0].path = f.root;
  await rename(f.root, join(f.base, 'old')); await mkdir(f.root); await assert.rejects(f.call('list', { path: '' }), /工作区/);
  const fresh = await f.files.command('context', { project_id: 'p' }); assert.notEqual(fresh.workspace, f.context.workspace); assert.equal(fresh.root, undefined);
});

test('ownership changing while queued or immediately before mutation cancels writes and cleans temporary files', async t => {
  const f = await fixture(t); await writeFile(join(f.root, 'text'), 'original'); const original = await f.call('read', { path: 'text' });
  f.metadataHook(async count => { if (count === 4) f.setAccount('different'); });
  await assert.rejects(f.call('save', { path: 'text', text: 'bad', revision: original.revision }), /账号/);
  assert.equal(await readFile(join(f.root, 'text'), 'utf8'), 'original'); assert.deepEqual(await readdir(f.root), ['text']);
});
