import { constants } from 'node:fs';
import { realpath, lstat, readdir, readlink, open, mkdir, rename, unlink } from 'node:fs/promises';
import { relative, isAbsolute, dirname, join } from 'node:path';
import { createHash, randomUUID } from 'node:crypto';

export const MAX_CHAT_FILE = 2 * 1024 * 1024;
const hash = value => createHash('sha256').update(value).digest('hex');
const same = (a, b) => a.dev === b.dev && a.ino === b.ino;
export function chatRelative(value = '', allowRoot = false) {
  if (typeof value !== 'string' || value.includes('\0') || value.includes('\\') || isAbsolute(value)
    || (!value && !allowRoot) || (value && value.split('/').some(p => !p || p === '.' || p === '..'))) {
    throw Error('需要工作区内的相对路径。');
  }
  return value;
}
export function chatEntryName(value) {
  chatRelative(value);
  if (value.includes('/')) throw Error('名称不能包含路径分隔符。');
  return value;
}
export async function chatRoot(root) {
  const path = await realpath(root), stat = await lstat(path);
  if (!stat.isDirectory()) throw Error('工作区目录不可用。');
  return { path, identity: `${stat.dev}:${stat.ino}` };
}
// Every existing segment is checked. This is not an OS sandbox against a hostile
// process replacing parent directories between syscalls.
async function locate(root, name, { leafLink = false, rootAllowed = false } = {}) {
  chatRelative(name, rootAllowed);
  let path = root;
  for (const [index, part] of name.split('/').filter(Boolean).entries()) {
    path = join(path, part);
    const stat = await lstat(path);
    const leaf = index === name.split('/').length - 1;
    if (stat.isSymbolicLink() && !(leaf && leafLink)) throw Error('不通过符号链接访问文件内容。');
    if (!leaf && !stat.isDirectory()) throw Error('父路径不是目录。');
  }
  const rel = relative(root, path);
  if (rel === '..' || rel.startsWith('../') || isAbsolute(rel)) throw Error('路径超出工作区。');
  return path;
}
async function readText(root, name) {
  const path = await locate(root, name), before = await lstat(path);
  if (!before.isFile() || before.size > MAX_CHAT_FILE) throw Error('仅支持 2 MiB 以内的 UTF-8 普通文本文件。');
  const handle = await open(path, constants.O_RDONLY | constants.O_NOFOLLOW | constants.O_NONBLOCK);
  try {
    const stat = await handle.stat();
    if (!stat.isFile() || !same(before, stat) || stat.size > MAX_CHAT_FILE) throw Error('文件身份已变化，请重新读取。');
    const buffer = Buffer.alloc(MAX_CHAT_FILE + 1);
    let length = 0;
    while (length < buffer.length) {
      const { bytesRead } = await handle.read(buffer, length, buffer.length - length, length);
      if (!bytesRead) break;
      length += bytesRead;
    }
    if (length > MAX_CHAT_FILE) throw Error('文件已超过 2 MiB，不能作为文本编辑。');
    const after = await handle.stat();
    if (stat.size !== after.size || stat.mtimeMs !== after.mtimeMs || stat.ctimeMs !== after.ctimeMs
      || !same(stat, await lstat(await locate(root, name)))) throw Error('读取期间文件已变化，请重试。');
    const data = buffer.subarray(0, length);
    if (data.includes(0)) throw Error('二进制文件不能作为文本编辑。');
    let text;
    try { text = new TextDecoder('utf-8', { fatal: true, ignoreBOM: true }).decode(data); }
    catch { throw Error('文件不是有效的 UTF-8 文本。'); }
    return { path: name, text, revision: hash(data), size: length, stat };
  } finally { await handle.close(); }
}
const publicText = ({ stat, ...value }) => value;
async function absent(path) {
  try { await lstat(path); } catch (error) { if (error.code === 'ENOENT') return; throw error; }
  throw Error('目标已存在，不能覆盖。');
}
export async function performChatFile(root, action, input, { assertCurrent, trashItem, revealItem } = {}) {
  const check = assertCurrent || (async () => {});
  await check();
  const name = chatRelative(input.path ?? '', ['list', 'create-file', 'create-directory'].includes(action));
  if (action === 'list') {
    const path = await locate(root, name, { rootAllowed: true });
    const entries = (await readdir(path, { withFileTypes: true })).map(e => ({
      name: e.name, path: name ? `${name}/${e.name}` : e.name,
      kind: e.isSymbolicLink() ? 'link' : e.isDirectory() ? 'directory' : e.isFile() ? 'file' : 'special'
    })).sort((a, b) => Number(b.kind === 'directory') - Number(a.kind === 'directory') || a.name.localeCompare(b.name) || (a.name < b.name ? -1 : a.name > b.name ? 1 : 0));
    const revision = hash(JSON.stringify(entries));
    const offset = input.offset ?? 0, limit = input.limit ?? 100;
    if (!Number.isSafeInteger(offset) || offset < 0 || !Number.isSafeInteger(limit) || limit < 1 || limit > 500) throw Error('目录分页参数无效。');
    if (offset && input.directory_revision !== revision) throw Error('目录已变化，请刷新后重新加载。');
    await check();
    return { entries: entries.slice(offset, offset + limit), directory_revision: revision, next_offset: offset + limit < entries.length ? offset + limit : null, total: entries.length };
  }
  if (action === 'read') {
    const path = await locate(root, name, { leafLink: true }), stat = await lstat(path);
    if (stat.isSymbolicLink()) { const target = await readlink(path); await check(); return { path: name, kind: 'link', target, unsupported: '符号链接仅显示目标，不通过链接读写。' }; }
    if (!stat.isFile() || stat.size > MAX_CHAT_FILE) { await check(); return { path: name, kind: stat.isFile() ? 'file' : 'special', unsupported: '仅支持 2 MiB 以内的 UTF-8 普通文本文件。' }; }
    try { const file = await readText(root, name); await check(); return { kind: 'file', ...publicText(file) }; }
    catch (error) { if (/二进制|有效的 UTF-8/.test(error.message)) { await check(); return { path: name, kind: 'file', unsupported: error.message }; } throw error; }
  }
  if (action === 'save') {
    if (typeof input.text !== 'string' || Buffer.byteLength(input.text) > MAX_CHAT_FILE || input.text.includes('\0')) throw Error('仅支持 2 MiB 以内的文本。');
    const current = await readText(root, name);
    if (!input.revision || current.revision !== input.revision) throw Error('磁盘文件已变化，草稿已保留；请查看磁盘或重新读取。');
    const path = await locate(root, name), tmp = join(dirname(path), `.arcorbit-${randomUUID()}.tmp`);
    try {
      const handle = await open(tmp, constants.O_WRONLY | constants.O_CREAT | constants.O_EXCL | constants.O_NOFOLLOW, current.stat.mode & 0o777);
      try { await handle.writeFile(input.text, 'utf8'); await handle.chmod(current.stat.mode & 0o777); await handle.sync(); } finally { await handle.close(); }
      const latest = await readText(root, name);
      if (latest.revision !== input.revision || !same(latest.stat, current.stat)) throw Error('保存期间文件已变化，草稿已保留。');
      await check();
      await locate(root, name);
      await rename(tmp, path);
      return { path: name, text: input.text, revision: hash(Buffer.from(input.text)), size: Buffer.byteLength(input.text) };
    } finally { await unlink(tmp).catch(error => { if (error.code !== 'ENOENT') throw error; }); }
  }
  if (action === 'create-file' || action === 'create-directory') {
    const entry = chatEntryName(input.name), parent = await locate(root, name, { rootAllowed: true }), target = join(parent, entry);
    await check(); await locate(root, name, { rootAllowed: true });
    if (action === 'create-directory') await mkdir(target);
    else { const handle = await open(target, constants.O_WRONLY | constants.O_CREAT | constants.O_EXCL | constants.O_NOFOLLOW, 0o666); await handle.close(); }
    return { path: name ? `${name}/${entry}` : entry, kind: action === 'create-file' ? 'file' : 'directory' };
  }
  const path = await locate(root, name, { leafLink: true });
  if (action === 'rename') {
    const entry = chatEntryName(input.name), target = join(dirname(path), entry);
    await absent(target); await check(); await locate(root, name, { leafLink: true }); await absent(target);
    await rename(path, target);
    return { previous_path: name, path: [...name.split('/').slice(0, -1), entry].join('/') };
  }
  if (action === 'trash' || action === 'reveal') {
    const operation = action === 'trash' ? trashItem : revealItem;
    if (!operation) throw Error('系统文件操作不可用。');
    await check(); await locate(root, name, { leafLink: true });
    await operation(path);
    return { path: name, [action === 'trash' ? 'trashed' : 'revealed']: true };
  }
  throw Error('不支持的文件操作。');
}
