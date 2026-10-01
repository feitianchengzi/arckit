import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, mkdir, writeFile, rm, realpath } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { EventEmitter } from 'node:events';
import { createRepositoryService } from '../src/release/repository-service.mjs';
import { createChatGitObserver } from '../src/chat-git-observer.mjs';
import { createChatGit } from '../src/chat-git.mjs';
import { createChatGitState } from '../desktop/renderer/chat-git-state.mjs';
const exec = promisify(execFile);
const git = async (root, ...args) => (await exec('git', args, { cwd: root, env: {
  ...process.env, GIT_CONFIG_NOSYSTEM: '1', GIT_TERMINAL_PROMPT: '0',
  GIT_AUTHOR_NAME: 'Test', GIT_AUTHOR_EMAIL: 'test@example.invalid',
  GIT_COMMITTER_NAME: 'Test', GIT_COMMITTER_EMAIL: 'test@example.invalid'
} })).stdout;
async function fixture(t) {
  const base = await realpath(await mkdtemp(join(tmpdir(), 'chat-git-')));
  t.after(() => rm(base, { recursive: true, force: true }));
  const root = join(base, 'repo'); await mkdir(root);
  await git(root, 'init', '-b', 'main'); await writeFile(join(root, 'file'), 'base\n');
  await git(root, 'add', '.'); await git(root, '-c', 'commit.gpgsign=false', 'commit', '-m', 'base');
  return { base, root };
}
async function until(predicate) {
  const deadline = Date.now() + 6000;
  while (Date.now() < deadline) { if (await predicate()) return; await new Promise(r => setTimeout(r, 25)); }
  assert.fail('state did not converge');
}
test('light summary: local files, staging, cached divergence, conflicts and non-repository', async t => {
  const { base, root } = await fixture(t), repository = createRepositoryService();
  assert.equal((await repository.summary(root)).dirty, false);
  await writeFile(join(root, 'new space.txt'), 'new');
  let s = await repository.summary(root); assert.equal(s.files.length, 1); assert.equal(s.files[0].working_dir, '?');
  await git(root, 'add', '.'); s = await repository.summary(root); assert.equal(s.files[0].index, 'A');
  await git(root, '-c', 'commit.gpgsign=false', 'commit', '-m', 'new');
  const remote = join(base, 'remote.git'); await git(base, 'init', '--bare', remote);
  await git(root, 'remote', 'add', 'origin', remote); await git(root, 'push', '-u', 'origin', 'main');
  const other = join(base, 'other'); await git(base, 'clone', '-b', 'main', remote, other);
  await writeFile(join(other, 'file'), 'remote\n'); await git(other, 'add', '.'); await git(other, '-c', 'commit.gpgsign=false', 'commit', '-m', 'remote'); await git(other, 'push');
  s = await repository.summary(root); assert.equal(s.behind, 0, 'local refresh does not fetch');
  await repository.fetchSummary(root, 'origin'); assert.equal((await repository.summary(root)).behind, 1);
  await writeFile(join(root, 'file'), 'local\n'); await git(root, 'add', '.'); await git(root, '-c', 'commit.gpgsign=false', 'commit', '-m', 'local');
  s = await repository.summary(root); assert.equal(s.ahead, 1); assert.equal(s.behind, 1);
  assert.equal(s.log, undefined); assert.equal(s.branches, undefined); assert.equal(s.stashes, undefined);
  await assert.rejects(git(root, 'merge', 'origin/main'));
  s = await repository.summary(root); assert.deepEqual(s.conflicted, ['file']);
  const plain = join(base, 'plain'); await mkdir(plain);
  assert.deepEqual(await repository.summary(plain), { kind: 'not_repository' });
  await assert.rejects(repository.summary(join(base, 'missing')));
});

test('real filesystem observation shares watchers and catches external edit, stage, commit and push', async t => {
  const { root, base } = await fixture(t); const states = [];
  const remote = join(base, 'remote.git'); await git(base, 'init', '--bare', remote);
  await git(root, 'remote', 'add', 'origin', remote); await git(root, 'push', '-u', 'origin', 'main');
  const observer = createChatGitObserver({ pollMs: 50000, debounceMs: 20 }); t.after(() => observer.close());
  const a = observer.observe({ key: 'same-root', root }, state => states.push(state));
  const b = observer.observe({ key: 'same-root', root }, () => {}); await a.ready; await b.ready;
  await writeFile(join(root, 'file'), 'outside');
  await until(() => a.read().value?.dirty);
  await git(root, 'add', '.'); await until(() => a.read().value?.files[0]?.index === 'M');
  await git(root, '-c', 'commit.gpgsign=false', 'commit', '-m', 'external');
  await until(() => a.read().value && !a.read().value.dirty);
  await until(() => a.read().value.ahead === 1);
  await git(root, 'push'); await until(() => a.read().value.ahead === 0);
  assert.equal(a.read().remote.checked_at, null, 'external push is not a verified fetch');
  assert.deepEqual(a.read(), b.read()); assert.ok(states.length >= 3);
  a.release(); await writeFile(join(root, 'another'), 'x'); await until(() => b.read().value?.dirty);
  b.release();
});

test('watch events coalesce, polling recovers missed events, failures retain last value and remote check time', async t => {
  let count = 0, dirty = false, failure = false, fetchFailure = false, fetches = 0;
  const watchers = [];
  const observer = createChatGitObserver({ pollMs: 60, debounceMs: 10,
    watchFs: (_path, _options, change) => { const w = new EventEmitter(); w.change = change; w.close = () => { w.closed = true; }; watchers.push(w); return w; },
    repository: {
      summary: async () => { count++; if (failure) throw Error('unreadable'); return { kind: 'repository', dirty, remote: 'origin', remote_url: 'local', tracking: 'origin/main' }; },
      fetchSummary: async () => { fetches++; if (fetchFailure) throw Error('offline'); }
    }
  }); t.after(() => observer.close());
  const a = observer.observe({ key: 'k', root: '/repo' }, () => {}), b = observer.observe({ key: 'k', root: '/repo' }, () => {});
  await a.ready; await b.ready; assert.equal(watchers.length, 1);
  const start = count; for (let i = 0; i < 20; i++) watchers[0].change();
  await new Promise(r => setTimeout(r, 25)); assert.ok(count - start <= 2);
  dirty = true; await until(() => a.read().value.dirty); assert.equal(fetches, 0);
  const good = a.read(); failure = true; await a.refresh();
  assert.equal(a.read().stale, true); assert.equal(a.read().value.dirty, true); assert.equal(a.read().read_at, good.read_at);
  failure = false; await a.refresh(); await a.fetch(); const checked = a.read().remote.checked_at;
  assert.ok(checked); fetchFailure = true; await a.fetch();
  assert.equal(a.read().remote.checked_at, checked); assert.equal(a.read().remote.error, 'offline');
  a.release(); assert.equal(watchers[0].closed, undefined); b.release(); assert.equal(watchers[0].closed, true);
});

test('closed observations ignore late results; watcher failure is explicit and polling remains available', async t => {
  let resolveRead, calls = 0;
  const observer = createChatGitObserver({ watchFs: () => { throw Error('unsupported'); }, pollMs: 50000,
    repository: { summary: () => new Promise(r => { resolveRead = r; }) } });
  t.after(() => observer.close());
  const h = observer.observe({ key: 'old', root: '/old' }, () => { calls++; });
  h.release(); resolveRead({ kind: 'repository', dirty: false }); await h.ready; assert.equal(calls, 0);
  const next = observer.observe({ key: 'new', root: '/new' }, () => {});
  resolveRead({ kind: 'not_repository' }); await next.ready;
  assert.equal(next.read().state, undefined); assert.equal(next.read().watch_error, 'unsupported');
});

test('Chat owner guard rejects old tokens and late replies after rebinding or account changes', async t => {
  const { root, base } = await fixture(t); const other = join(base, 'plain'); await mkdir(other);
  let account = 'a', allowed = true, resume;
  const store = { projects: [{ id: 'p', path: root }], sessions: { p: [{ id: 's', project_id: 'p' }] } };
  const repository = { summary: async () => ({ kind: 'repository', dirty: false }) };
  const observer = createChatGitObserver({ repository, pollMs: 50000 });
  const service = createChatGit({ observer, runManager: { readDesktopChatMetadata: async () => store },
    getAccountScope: async () => account, authorizeSession: async () => allowed }); t.after(() => service.close());
  const [first] = await service.command('observe', { project_ids: ['p'] }); assert.ok(first.workspace);
  repository.summary = () => new Promise(r => { resume = r; });
  const pending = service.command('refresh', { project_id: 'p', expected_workspace: first.workspace });
  await until(() => Boolean(resume)); account = 'b'; resume({ kind: 'repository', dirty: true });
  await assert.rejects(pending, /变化/);
  repository.summary = async () => ({ kind: 'repository', dirty: false });
  const [second] = await service.command('observe', { project_ids: ['p'] }); assert.notEqual(first.workspace, second.workspace);
  await assert.rejects(service.command('fetch', { project_id: 'p', expected_workspace: first.workspace }), /读取/);
  store.projects[0].path = other;
  await assert.rejects(service.command('refresh', { project_id: 'p', expected_workspace: second.workspace }), /变化/);
  allowed = false; const [denied] = await service.command('observe', { project_ids: ['p'] }); assert.equal(denied.unavailable, true);
  const [missing] = await service.command('observe', { project_ids: ['missing'] }); assert.equal(missing.unavailable, true);
});

test('overlapping refreshes finish instead of starving under frequent invalidation', async t => {
  let reads = 0;
  const observer = createChatGitObserver({ watchFs: () => { throw Error('no-watch'); }, pollMs: 10, debounceMs: 5,
    repository: { summary: async () => { reads++; await new Promise(r => setTimeout(r, 40)); return { kind: 'not_repository' }; } } });
  t.after(() => observer.close());
  const handle = observer.observe({ key: 'slow', root: '/slow' }, () => {});
  await Promise.race([handle.ready, new Promise((_, reject) => { const timer = setTimeout(() => reject(Error('starved')), 1000); timer.unref(); })]);
  assert.ok(reads <= 2); handle.release();
});

test('renderer lifecycle ignores stale scope responses and workspace events, releases on leave, refreshes on switch', async () => {
  let listener, resolveFirst;
  let context = { active: true, project_ids: ['a'], scope: 'one', selected_project_id: 'a' };
  const calls = [];
  const api = { onChatGitEvent: fn => { listener = fn; return () => {}; }, chatGit: async (action, input) => {
    calls.push({ action, input });
    if (action === 'observe' && input.project_ids[0] === 'a') return new Promise(r => { resolveFirst = r; });
    if (action === 'observe') return [{ project_id: 'b', workspace: 'token-b', value: { dirty: false } }];
    return { project_id: 'b', workspace: 'token-b', value: { dirty: true } };
  } };
  const state = createChatGitState({ api, getContext: () => context, document: null });
  const first = state.sync(); context = { ...context, project_ids: ['b'], selected_project_id: 'b' }; await state.sync();
  resolveFirst([{ project_id: 'a', workspace: 'token-a' }]); await first;
  assert.equal(state.get('a'), undefined); assert.equal(state.get('b').value.dirty, false);
  listener({ project_id: 'b', workspace: 'wrong', value: { dirty: true } }); assert.equal(state.get('b').value.dirty, false);
  await state.refresh('b'); assert.equal(state.get('b').value.dirty, true);
  listener({ project_id: 'b', workspace: 'token-b', version: 2, value: { dirty: false } });
  listener({ project_id: 'b', workspace: 'token-b', version: 1, value: { dirty: true } });
  assert.equal(state.get('b').value.dirty, false, 'late older version does not overwrite a new event');
  context = { ...context, selected_project_id: '' }; await state.sync();
  assert.equal(calls.filter(c => c.action === 'observe').length, 3);
  context.active = false; await state.sync(); assert.equal(state.get('b'), undefined); assert.equal(calls.at(-1).action, 'release');
  state.destroy();
});

test('on-demand Git details: staged/worktree, literal filenames, paged commits and invalid input', async t => {
  const { createChatGitDetails } = await import('../src/chat-git-details.mjs');
  const { root, base } = await fixture(t), details=createChatGitDetails();
  const initial=(await git(root,'rev-parse','HEAD')).trim();
  await writeFile(join(root,'file'),'staged\n'); await git(root,'add','file');
  await writeFile(join(root,'file'),'worktree\n');
  assert.match((await details.read(root,'diff',{path:'file',mode:'staged'})).content,/\+staged/);
  assert.match((await details.read(root,'diff',{path:'file',mode:'worktree'})).content,/\+worktree/);
  await writeFile(join(root,'[a].txt'),'literal <script>');
  assert.equal((await details.read(root,'diff',{path:'[a].txt',mode:'untracked'})).content,'literal <script>');
  await writeFile(join(root,'binary'),Buffer.from([0,1,2]));
  await assert.rejects(details.read(root,'diff',{path:'binary',mode:'untracked'}),/二进制/);
  await assert.rejects(details.read(root,'diff',{path:'../outside',mode:'untracked'}),/相对路径/);
  await assert.rejects(details.read(root,'commit',{commit:'--help'}),/提交标识/);
  const first=await details.read(root,'commit',{commit:initial});assert.deepEqual(first.files,['file']);
  assert.match((await details.read(root,'diff',{path:'file',mode:'commit',commit:initial})).content,/\+base/);
  await git(root,'init','--bare',join(base,'remote.git'));await git(root,'remote','add','origin',join(base,'remote.git'));await git(root,'push','-u','origin','main');
  for(let i=0;i<42;i++)await git(root,'-c','commit.gpgsign=false','commit','--allow-empty','-m',`page ${i}`);
  const one=await details.read(root,'commits',{direction:'ahead'});assert.equal(one.commits.length,40);assert.equal(one.next_offset,40);
  const two=await details.read(root,'commits',{direction:'ahead',offset:40,range:one.range});assert.equal(two.commits.length,2);assert.equal(two.next_offset,null);
  await git(root,'-c','commit.gpgsign=false','commit','--allow-empty','-m','changed');
  await assert.rejects(details.read(root,'commits',{direction:'ahead',offset:40,range:one.range}),/分支已变化/);
});

test('summary states never equate unknown or cached remote data with clean synchronization', async () => {
  const {gitSummary}=await import('../desktop/renderer/chat-git-surface.mjs');
  const value={kind:'repository',files:[],conflicted:[],tracking:'origin/main',ahead:0,behind:0};
  assert.match(gitSummary().label,/读取中/);
  assert.match(gitSummary({value,stale:true}).label,/过期/);
  assert.match(gitSummary({value,error:'failed'}).label,/失败/);
  assert.match(gitSummary({value}).meaning,/尚未获取远端/);
  assert.match(gitSummary({value:{...value,ahead:2}}).label,/↑2/);
  assert.match(gitSummary({value:{...value,ahead:2,behind:3}}).label,/分歧/);
  assert.match(gitSummary({value:{...value,conflicted:['a'],files:[{path:'a'},{path:'a'}]}}).label,/1 个冲突 · 1 个文件/);
  assert.match(gitSummary({value:{...value,comparison_available:false,ahead:2}}).meaning,/未设置可比较/);
  assert.doesNotMatch(gitSummary({value:{...value,comparison_available:false,ahead:2}}).label,/↑2/);
  assert.match(gitSummary({value,remote:{error:'offline'}}).label,/远端获取失败/);
});

test('detail response is rejected if project binding changes during the read', async t => {
  const {root,base}=await fixture(t),other=join(base,'other');await mkdir(other);
  let bound=root,finish,started;
  const began=new Promise(r=>started=r);
  const service=createChatGit({runManager:{readDesktopChatMetadata:async()=>({projects:[{id:'p',path:bound}],sessions:{}})},getAccountScope:async()=> 'account',authorizeSession:async()=>true,
    details:{read:async()=>{started();await new Promise(r=>finish=r);return {content:'old secret'};}}});
  t.after(()=>service.close());const [state]=await service.command('observe',{project_ids:['p']});
  const pending=service.command('diff',{project_id:'p',expected_workspace:state.workspace,path:'file',mode:'worktree'});
  await began;bound=other;finish();await assert.rejects(pending,/已变化/);
});

test('local upstream is not presented or read as remote push/pull work', async t => {
  const {root}=await fixture(t);
  await git(root,'branch','local');await git(root,'branch','--set-upstream-to=local');
  await git(root,'-c','commit.gpgsign=false','commit','--allow-empty','-m','local ahead');
  const value=await createRepositoryService().summary(root);
  assert.equal(value.upstream_kind,'local');assert.equal(value.comparison_available,false);assert.equal(value.ahead,1);
  const {gitSummary}=await import('../desktop/renderer/chat-git-surface.mjs');
  assert.doesNotMatch(gitSummary({value}).label,/↑|↓/);assert.match(gitSummary({value}).meaning,/上游为本地分支/);
  const {createChatGitDetails}=await import('../src/chat-git-details.mjs');
  await assert.rejects(createChatGitDetails().read(root,'commits',{direction:'ahead'}),/上游为本地分支/);
  await git(root,'remote','add','origin','/missing-remote');
  assert.equal((await createRepositoryService().summary(root)).remote,'origin','configured remote still offers explicit Fetch');
});
