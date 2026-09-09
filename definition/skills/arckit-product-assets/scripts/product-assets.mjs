import { readFile, writeFile, rename, mkdir, lstat, realpath, open, unlink } from 'node:fs/promises';
import { join, resolve, relative, dirname, isAbsolute } from 'node:path';
import { randomUUID, createHash } from 'node:crypto';
import { pathToFileURL } from 'node:url';
export const RECORD_PATH = 'arckit/product/record.json';
export const SCHEMA = 'arcorbit-product/v1';
const statuses = [null, 'exploring', 'active', 'paused', 'archived'];
export function emptyRecord(id = randomUUID()) {
  return { schema_version: SCHEMA, product_id: id, revision: 0, status: null, description: '', vision: '', audience: '', principles: '', assets: [], idea: null };
}
export function assetPath(value) {
  if (typeof value !== 'string' || !value || value.length > 1000 || isAbsolute(value) || value.includes('\\') || value.split('/').some(x => ['..', '.', ''].includes(x)) || /[\x00-\x1f]/.test(value)) throw new Error('资产路径必须是仓库内的相对路径。');
  return value;
}
export function validateRecord(value) {
  if (!value || value.schema_version !== SCHEMA) throw new Error('不支持的产品资料协议。');
  const allowed = Object.keys(emptyRecord());
  if (Object.keys(value).some(k => !allowed.includes(k))) throw new Error('产品资料包含未知字段。');
  if (typeof value.product_id !== 'string' || !/^[a-zA-Z0-9-]{1,100}$/.test(value.product_id)) throw new Error('产品身份无效。');
  if (!Number.isSafeInteger(value.revision) || value.revision < 0 || !statuses.includes(value.status)) throw new Error('产品修订号或状态无效。');
  for (const key of ['description','vision','audience','principles']) if (typeof value[key] !== 'string' || value[key].length > 20000) throw new Error(`产品字段 ${key} 无效。`);
  if (!Array.isArray(value.assets) || value.assets.length > 100) throw new Error('资产引用数量无效。');
  if (value.idea !== null) {
    const idea = value.idea;
    if (!idea || Object.keys(idea).some(k => !['id','name','created_at','recorded_at'].includes(k)) || idea.id !== value.product_id || typeof idea.name !== 'string' || !idea.name.trim() || idea.name.length > 160 || !Number.isFinite(Date.parse(idea.created_at)) || !Number.isFinite(Date.parse(idea.recorded_at))) throw new Error('正式 Idea 元数据无效。');
  }
  const paths = new Set();
  for (const a of value.assets) {
    if (!a || Object.keys(a).some(k => !['title','kind','path'].includes(k)) || typeof a.title !== 'string' || !a.title.trim() || a.title.length > 200 || !['spec','interaction','visual','tech','material','other'].includes(a.kind)) throw new Error('资产引用格式无效。');
    assetPath(a.path); if (paths.has(a.path)) throw new Error('资产引用路径重复。'); paths.add(a.path);
  }
  return structuredClone(value);
}
export const digestRecord = record => createHash('sha256').update(JSON.stringify(validateRecord(record))).digest('hex');
export function reviseRecord(record, patch, expectedRevision) {
  validateRecord(record);
  if (record.revision !== expectedRevision) throw new Error('资料已变化，请重新读取后修改。');
  if (!patch || Array.isArray(patch) || Object.keys(patch).some(k => !['status','description','vision','audience','principles','assets'].includes(k))) throw new Error('不允许修改产品身份或协议。');
  return validateRecord({ ...record, ...patch, revision: record.revision + 1 });
}
export async function safePath(root, path, { createParents = false } = {}) {
  assetPath(path);
  const base = await realpath(root); let current = base;
  const parts = path.split('/');
  for (let i = 0; i < parts.length; i++) {
    current = join(current, parts[i]);
    let s;
    try { s = await lstat(current); } catch (e) {
      if (e.code !== 'ENOENT') throw e;
      if (createParents && i < parts.length - 1) { await mkdir(current, { mode: 0o700 }); s = await lstat(current); }
    }
    if (s?.isSymbolicLink()) throw new Error('产品资料路径不能经过符号链接。');
    if (s && i < parts.length - 1 && !s.isDirectory()) throw new Error('资料父路径不是目录。');
  }
  if (relative(base, current).startsWith('..')) throw new Error('资料路径越界。');
  return current;
}
export async function readRecord(root) {
  const path = await safePath(root, RECORD_PATH);
  try {
    const s = await lstat(path); if (!s.isFile() || s.size > 2000000) throw new Error('产品资料文件类型或大小无效。');
    return validateRecord(JSON.parse(await readFile(path, 'utf8')));
  } catch (e) { if (e.code === 'ENOENT') return null; throw e; }
}
export async function writeRecord(root, record, expectedRevision = null) {
  validateRecord(record); const path = await safePath(root, RECORD_PATH, { createParents: true });
  const lock = `${path}.lock`; let fd;
  try { fd = await open(lock, 'wx', 0o600); } catch (e) { if (e.code === 'EEXIST') throw new Error('资料正在写入；若上次进程中断，请核对并移除 record.json.lock 后重试。'); throw e; }
  const temp = join(dirname(path), `.record-${randomUUID()}.tmp`);
  try {
    const current = await readRecord(root);
    if ((current?.revision ?? null) !== expectedRevision) throw new Error('本地仓库资料已变化，请重新读取。');
    if (current && current.product_id !== record.product_id) throw new Error('资料属于另一个产品，不能覆盖。');
    await writeFile(temp, `${JSON.stringify(record, null, 2)}\n`, { mode: 0o600, flag: 'wx' });
    await rename(temp, path); return record;
  } finally { await fd.close(); await unlink(lock); await unlink(temp).catch(() => {}); }
}
if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  try {
    const [command, root, patchFile, revision] = process.argv.slice(2);
    if (!root || !['read','update','init'].includes(command)) throw new Error('用法: product-assets.mjs read|init <root> 或 update <root> <patch.json> <expected-revision>');
    const current = await readRecord(root);
    let result = current;
    if (command === 'init') result = current || await writeRecord(root, emptyRecord(), null);
    if (command === 'update') {
      if (!current) throw new Error('请先初始化产品资料。');
      result = await writeRecord(root, reviseRecord(current, JSON.parse(await readFile(patchFile, 'utf8')), Number(revision)), Number(revision));
    }
    process.stdout.write(`${JSON.stringify({ok:true,record:result})}\n`);
  } catch(e) { process.stderr.write(`${e.message}\n`); process.exitCode = 1; }
}
