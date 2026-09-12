import { createHash, randomUUID } from 'node:crypto';
import { lstat, readFile, readdir, realpath, mkdir, rename, writeFile, rm } from 'node:fs/promises';
import path from 'node:path';

export const digest = value => createHash('sha256').update(value).digest('hex');
export const within = (root, target) => {
  const relative = path.relative(path.resolve(root), path.resolve(target));
  return relative === '' || (!path.isAbsolute(relative) && relative !== '..' && !relative.startsWith(`..${path.sep}`));
};
export async function readJson(file, fallback) {
  try { return JSON.parse(await readFile(file, 'utf8')); }
  catch (error) { if (error.code === 'ENOENT' && fallback !== undefined) return structuredClone(fallback); throw error; }
}
export async function atomicJson(file, value) {
  await mkdir(path.dirname(file), { recursive: true });
  const temp = `${file}.${randomUUID()}.tmp`;
  try { await writeFile(temp, JSON.stringify(value, null, 2) + '\n', { mode: 0o600 }); await rename(temp, file); }
  finally { await rm(temp, { force: true }); }
}
export async function directories(root) {
  try { return (await readdir(root, { withFileTypes: true })).filter(x => x.isDirectory()).map(x => path.join(root, x.name)); }
  catch (error) { if (error.code === 'ENOENT') return []; throw error; }
}
export async function treeManifest(root) {
  const files = [];
  async function walk(dir) {
    for (const entry of await readdir(dir, { withFileTypes: true })) {
      const file = path.join(dir, entry.name);
      if (entry.isSymbolicLink()) throw new Error(`Skill package contains a symbolic link: ${file}`);
      if (entry.isDirectory()) await walk(file);
      else if (entry.isFile()) files.push({ path: path.relative(root, file).split(path.sep).join('/'), sha256: digest(await readFile(file)) });
      else throw new Error(`Unsupported skill package entry: ${file}`);
    }
  }
  await walk(root);
  return files.sort((a, b) => a.path.localeCompare(b.path, 'en'));
}
export async function readSkill(folder) {
  if (!path.isAbsolute(folder)) throw new Error('Skill folder must be an absolute path.');
  const root = await realpath(folder);
  const file = path.join(root, 'SKILL.md');
  const info = await lstat(file);
  if (!info.isFile() || info.isSymbolicLink() || info.size > 1024 * 1024) throw new Error(`Invalid SKILL.md: ${file}`);
  const text = await readFile(file, 'utf8');
  const front = /^---\r?\n([\s\S]*?)\r?\n---(?:\r?\n|$)/.exec(text)?.[1];
  if (!front) throw new Error(`Missing skill metadata: ${file}`);
  const field = name => {
    const value = new RegExp(`^${name}:\\s*(.+)$`, 'm').exec(front)?.[1]?.trim() || '';
    if (value.startsWith('"')) { try { return JSON.parse(value); } catch { /* report as invalid below */ } }
    if (value.startsWith("'")) return value.slice(1, -1).replace(/''/g, "'");
    if (/^[>|][-+]?\s*$/.test(value)) {
      const lines = front.split(/\r?\n/), start = lines.findIndex(x => x.startsWith(`${name}:`));
      const body = [];
      for (const line of lines.slice(start + 1)) { if (line && !/^\s/.test(line)) break; body.push(line.trim()); }
      return body.join(' ').trim();
    }
    return value;
  };
  const name = field('name'), description = field('description');
  if (!/^[a-zA-Z0-9][a-zA-Z0-9._-]*$/.test(name) || !description) throw new Error(`Invalid name or description in ${file}`);
  return { name, description, path: root, skillPath: file, contentDigest: digest(JSON.stringify(await treeManifest(root))) };
}
