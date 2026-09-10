import { realpath, lstat, readFile, readdir, writeFile, rename, unlink } from 'node:fs/promises';
import { resolve, relative, isAbsolute, dirname, join } from 'node:path';
import { createHash, randomUUID } from 'node:crypto';
export const digest = value => createHash('sha256').update(value).digest('hex');
export const MAX_FILE = 2 * 1024 * 1024;
const hidden = new Set(['.git', 'node_modules', '.env', '.ssh', '.aws', '.gnupg']);
export function validRelative(value) {
  if (typeof value !== 'string' || value.includes('\0') || isAbsolute(value) || value.split(/[\\/]/).includes('..')) throw new Error('需要工作区内的相对路径。');
  if (value.split(/[\\/]/).some(p => hidden.has(p) || p.startsWith('.env.'))) throw new Error('该路径不在源码浏览范围。');
  return value;
}
export async function workspacePath(root, name = '', { newFile = false } = {}) {
  validRelative(name);
  const base = await realpath(root); const target = resolve(base, name);
  let actual;
  try { actual = await realpath(target); }
  catch (e) { if (!newFile || e.code !== 'ENOENT') throw e; actual = join(await realpath(dirname(target)), target.slice(target.lastIndexOf('/') + 1)); }
  const rel = relative(base, actual);
  if (rel.startsWith('..') || isAbsolute(rel)) throw new Error('路径超出工作区。');
  return actual;
}
export async function readWorkspaceFile(root, name) {
  const path = await workspacePath(root, name); const stat = await lstat(path);
  if (!stat.isFile() || stat.size > MAX_FILE) throw new Error('只支持 2 MiB 以内的源码文本。');
  const data = await readFile(path);
  if(data.length>MAX_FILE)throw new Error('文件已增长，超过文本读取上限。');
  if (data.includes(0)) throw new Error('这是二进制文件，请通过终端或系统工具打开。');
  return { path: name, text: new TextDecoder('utf-8',{fatal:true}).decode(data), revision: digest(data), size: data.length };
}
export async function saveWorkspaceFile(root, input) {
  if (typeof input.text !== 'string' || Buffer.byteLength(input.text) > MAX_FILE) throw new Error('文本过大。');
  const current = await readWorkspaceFile(root, input.path);
  if (current.revision !== input.revision) throw new Error('文件已被其他操作修改，草稿已保留，请重新读取并比较。');
  const path = await workspacePath(root, input.path); const stat = await lstat(path);
  const tmp = join(dirname(path), `.arcorbit-${randomUUID()}.tmp`);
  try {
    await writeFile(tmp, input.text, { flag: 'wx', mode: stat.mode });
    if ((await readWorkspaceFile(root, input.path)).revision !== input.revision) throw new Error('保存期间文件已变化，请重新读取。');
    await rename(tmp, path);
  } finally { await unlink(tmp).catch(e => { if(e.code !== 'ENOENT') throw e; }); }
  return readWorkspaceFile(root, input.path);
}
export async function listWorkspaceFiles(root, directory = '') {
  const path = await workspacePath(root, directory); const entries = await readdir(path, { withFileTypes: true });
  return entries.filter(e => !hidden.has(e.name) && !e.name.startsWith('.env.') && !e.isSymbolicLink()).slice(0, 1000)
    .map(e => ({ name: e.name, path: directory ? `${directory}/${e.name}` : e.name, directory: e.isDirectory() }))
    .sort((a,b) => Number(b.directory)-Number(a.directory) || a.name.localeCompare(b.name));
}
export async function searchWorkspace(root, query) {
  if (typeof query !== 'string' || !query.trim() || query.length > 200) throw new Error('请输入 1–200 字符的搜索内容。');
  const results = []; let visited = 0;
  async function walk(dir, depth) {
    for (const e of await listWorkspaceFiles(root, dir)) {
      if (++visited > 3000 || results.length >= 100) return;
      if (e.directory) { if(depth<8) await walk(e.path, depth+1); continue; }
      if(e.path.toLowerCase().includes(query.toLowerCase())) results.push({path:e.path,line:1,text:'文件名匹配'});
      if(results.length>=100)return;
      try { const file=await readWorkspaceFile(root,e.path); if(file.size>150000)continue;for(const [index,line] of file.text.split('\n').entries()) { if(line.toLowerCase().includes(query.toLowerCase()))results.push({path:e.path,line:index+1,text:line.slice(0,220)});if(results.length>=100)return; } } catch {}
    }
  }
  await walk('',0); return {results,truncated:visited>3000||results.length>=100};
}
