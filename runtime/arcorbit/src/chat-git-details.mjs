import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { lstat, open, realpath } from 'node:fs/promises';
import { constants } from 'node:fs';
import { join, dirname, relative, isAbsolute } from 'node:path';
import { createRepositoryService } from './release/repository-service.mjs';
const exec = promisify(execFile), MAX = 2 * 1024 * 1024, PAGE = 40;
const commitId = value => { if (!/^[a-f0-9]{40,64}$/.test(value || '')) throw Error('提交标识无效。'); return value; };
const filePath = value => { if (typeof value !== 'string' || value.includes('\0') || isAbsolute(value) || value.split(/[\\/]/).includes('..') || value.split(/[\\/]/).includes('.git')) throw Error('需要工作区内的相对路径。'); if (!value) throw Error('请选择文件。'); return value; };
const text = bytes => { try { return new TextDecoder('utf-8', { fatal: true }).decode(bytes); } catch { throw Error('内容不是有效 UTF-8，无法预览。'); } };

// Only requested pages, one commit or one file are read. No remote access.
export function createChatGitDetails({ repository = createRepositoryService() } = {}) {
  async function git(root, args) {
    try {
      const { stdout } = await exec('git', ['--no-pager', '--literal-pathspecs', ...args], { cwd: root, encoding: 'buffer', maxBuffer: MAX,
        timeout: 30000, env: { ...process.env, GIT_OPTIONAL_LOCKS: '0', GIT_TERMINAL_PROMPT: '0' } });
      return text(stdout);
    } catch (error) {
      if (error.code === 'ERR_CHILD_PROCESS_STDIO_MAXBUFFER') throw Error('内容过大，无法在此预览。');
      throw error;
    }
  }
  async function range(root) {
    const branch=(await git(root,['rev-parse','--abbrev-ref','HEAD'])).trim();
    const remote=(await git(root,['config','--get',`branch.${branch}.remote`]).catch(()=>'' )).trim();
    if(remote==='.')throw Error('上游为本地分支，不能作为待推送或待拉取提交。');
    const [head, upstream] = await Promise.all([
      git(root, ['rev-parse', '--verify', 'HEAD']), git(root, ['rev-parse', '--verify', '@{upstream}']).catch(() => '')
    ]);
    if (!upstream) throw Error('当前分支没有可用上游，无法比较提交。');
    return { head: head.trim(), upstream: upstream.trim() };
  }
  return {
    async read(root, action, input) {
      const repo = await repository.identity(root);
      if (action === 'commits') {
        const refs = await range(repo.root), offset = input.offset ?? 0;
        if (!Number.isSafeInteger(offset) || offset < 0 || offset > 100000 || !['ahead', 'behind'].includes(input.direction)) throw Error('提交查询无效。');
        const key = `${refs.head}:${refs.upstream}`;
        if (input.range && input.range !== key) throw Error('分支已变化，请返回概览后重新查看。');
        const selection = input.direction === 'ahead' ? `${refs.upstream}..${refs.head}` : `${refs.head}..${refs.upstream}`;
        const raw = await git(repo.root, ['log', '--format=%H%x00%s%x00%an%x00%aI', `--skip=${offset}`, `--max-count=${PAGE + 1}`, selection, '--']);
        const rows = raw.trimEnd().split('\n').filter(Boolean).map(line => { const [id, subject, author, date] = line.split('\0'); return { id, subject, author, date }; });
        return { range: key, commits: rows.slice(0, PAGE), next_offset: rows.length > PAGE ? offset + PAGE : null };
      }
      if (action === 'commit') {
        const id = commitId(input.commit);
        const description = await git(repo.root, ['show', '-s', '--format=%H%n%an%n%aI%n%B', id, '--']);
        // First-parent comparison also covers merge commits; --root covers the initial commit.
        const files = await git(repo.root, ['diff-tree', '--root', '--no-commit-id', '--name-only', '-r', '-z', `${id}^`, id, '--'])
          .catch(() => git(repo.root, ['diff-tree', '--root', '--no-commit-id', '--name-only', '-r', '-z', id, '--']));
        return { id, description, files: files.split('\0').filter(Boolean) };
      }
      if (action !== 'diff') throw Error('不支持的 Git 查看操作。');
      const name = filePath(input.path), modes = ['worktree', 'staged', 'untracked', 'commit'];
      if (!modes.includes(input.mode)) throw Error('差异类型无效。');
      if (input.mode === 'untracked') {
        const tracked = await git(repo.root, ['ls-files', '-z', '--', name]);
        if (tracked) throw Error('文件状态已变化，请返回概览后重新查看。');
        const path = join(repo.root, name), parent = relative(repo.root, await realpath(dirname(path)));
        if (parent === '..' || parent.startsWith('../') || isAbsolute(parent)) throw Error('路径超出工作区。');
        const info = await lstat(path);
        if (!info.isFile() || info.isSymbolicLink()) throw Error('特殊文件无法预览。');
        if (info.size > MAX) throw Error('文件过大，无法预览。');
        const handle = await open(path, constants.O_RDONLY | (constants.O_NOFOLLOW || 0));
        let bytes;
        try { const buffer=Buffer.alloc(MAX+1); const {bytesRead}=await handle.read(buffer,0,buffer.length,0); bytes=buffer.subarray(0,bytesRead); } finally { await handle.close(); }
        if (bytes.length > MAX) throw Error('文件过大，无法预览。');
        if (bytes.includes(0)) throw Error('二进制内容无法预览。');
        return { content: text(bytes), label: '未跟踪文件内容' };
      }
      let args = ['diff', '--no-ext-diff', '--no-textconv', '--no-color', '--no-renames'];
      if (input.mode === 'staged') args.push('--cached');
      if (input.mode === 'commit') {
        const id = commitId(input.commit);
        const parent = await git(repo.root, ['rev-parse', '--verify', `${id}^`]).catch(() => '');
        args = parent ? [...args, parent.trim(), id] : ['show', '--format=', '--no-ext-diff', '--no-textconv', '--no-color', id];
      }
      const patch = await git(repo.root, [...args, '--', name]);
      return { content: patch, label: input.mode === 'staged' ? '已暂存差异' : input.mode === 'commit' ? '提交相对第一父提交的差异' : '未暂存差异（冲突保留 Git 标记）' };
    }
  };
}
