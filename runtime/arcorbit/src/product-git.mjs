import { mkdir, mkdtemp, rm, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
export { runLocalCommand as runProductCommand } from './local-command-runtime.mjs';
import { runLocalCommand as runProductCommand } from './local-command-runtime.mjs';
export const PRODUCT_BRANCH = 'refs/heads/arcorbit/product';
export function githubUrl(value) {
  const url = String(value || '').trim();
  if (!/^(https:\/\/github\.com\/|git@github\.com:|ssh:\/\/git@github\.com\/)[A-Za-z0-9_.-]+\/[A-Za-z0-9_.-]+(?:\.git)?\/?$/.test(url)) throw new Error('请输入不含凭据的 GitHub 仓库地址。');
  return url;
}
export function createProductGit({ protocol, run = runProductCommand, allowLocalRemote = false }) {
  const remote = value => allowLocalRemote ? value : githubUrl(value);
  async function prepare(root) {
    await mkdir(root, { recursive: true, mode: 0o700 });
    await run('git', ['init', '--bare', root]);
  }
  const git = (root, args, env = {}) => run('git', ['--git-dir', root, '-c', 'core.hooksPath=/dev/null', ...args], { env: {GIT_TERMINAL_PROMPT:'0', ...env} });
  async function read(root, url) {
    remote(url); await prepare(root);
    const refs = await git(root, ['ls-remote', '--heads', url, PRODUCT_BRANCH]);
    const sha = refs.split(/\s/)[0];
    if (!sha) return { sha: '', record: null };
    if (!/^[a-f0-9]{40,64}$/.test(sha)) throw new Error('远端资料引用无效。');
    await git(root, ['fetch', '--no-tags', url, PRODUCT_BRANCH]);
    // Read the fetched object, not a stale ls-remote observation.
    const fetched = await git(root, ['rev-parse', 'FETCH_HEAD']);
    const record = protocol.validateRecord(JSON.parse(await git(root, ['show', `${fetched}:${protocol.RECORD_PATH}`])));
    return { sha: fetched, record };
  }
  async function publish(root, url, record, expectedSha) {
    protocol.validateRecord(record); const current = await read(root,url);
    if (current.sha !== expectedSha) return { conflict: true, remote: current };
    const temp = await mkdtemp(join(tmpdir(), 'arcorbit-product-git-'));
    try {
      const env = {GIT_INDEX_FILE:join(temp,'index')};
      await git(root, ['read-tree', ...(current.sha ? [current.sha] : ['--empty'])], env);
      const file = join(temp,'record.json'); await writeFile(file, `${JSON.stringify(record,null,2)}\n`);
      const blob = await git(root, ['hash-object','-w',file]);
      await git(root, ['update-index','--add','--cacheinfo','100644',blob,protocol.RECORD_PATH],env);
      const tree = await git(root,['write-tree'],env);
      const sha = await git(root,['commit-tree',tree,...(current.sha ? ['-p',current.sha]:[]),'-m','Update product management record']);
      try { await git(root,['push',url,`${sha}:${PRODUCT_BRANCH}`]); }
      catch(e) {
        const actual = await read(root,url).catch(() => null);
        if (actual?.sha === sha) return {sha,record};
        if (actual && actual.sha !== current.sha) return {conflict:true,remote:actual,local_commit:sha};
        const error = new Error('资料推送失败；本机内容已保留。请检查 Git 身份、网络和仓库写权限。', {cause:e}); error.local_commit=sha; throw error;
      }
      return {sha,record};
    } finally { await rm(temp,{recursive:true,force:true}); }
  }
  return {read,publish};
}
