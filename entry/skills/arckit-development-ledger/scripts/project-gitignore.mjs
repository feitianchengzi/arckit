import fs from 'node:fs';
import path from 'node:path';
import { randomUUID } from 'node:crypto';
import { spawnSync } from 'node:child_process';
import { withProjectCommitLock } from './project-commit-lock.mjs';

const BEGIN = '# BEGIN Arckit local state and evidence';
const END = '# END Arckit local state and evidence';
const DIRECTORIES = ['arckit/debug', 'arckit/project', 'arckit/cases'];

function managedContent(text) {
  const newline = text.includes('\r\n') ? '\r\n' : '\n';
  const lines = text.match(/[^\n]*\n|[^\n]+$/g) || [];
  const markers = lines.map((line, index) => ({ line: line.replace(/\r?\n$/, ''), index }))
    .filter(({ line }) => line === BEGIN || line === END);
  if (markers.length && (markers.length !== 2 || markers[0].line !== BEGIN || markers[1].line !== END)) {
    throw new Error('.gitignore: malformed Arckit managed block; repair its BEGIN/END markers before retrying.');
  }
  // Only exact positive directory rules belong to this manager. Do not interpret
  // wildcards, negations, comments, escaped spaces or similarly named paths.
  const targetOf = line => {
    const rule = line.replace(/\r?\n$/, '').replace(/ +$/, '').replace(/^\//, '').replace(/\/$/, '');
    return DIRECTORIES.includes(rule) ? rule : null;
  };
  if (!markers.length) {
    const outside = lines.filter(line => !targetOf(line)).join('');
    const block = [BEGIN, ...DIRECTORIES.map(dir => `/${dir}/`), END].join(newline) + newline;
    return outside + (outside && !outside.endsWith('\n') ? newline : '') + block;
  }
  const start = markers[0].index, end = markers[1].index;
  const seen = new Set();
  const result = [];
  for (let index = 0; index < lines.length; index += 1) {
    if (index === end) {
      for (const dir of DIRECTORIES) if (!seen.has(dir)) result.push(`/${dir}/${newline}`);
    }
    const target = targetOf(lines[index]);
    if (target) {
      if (index < start || index > end || seen.has(target)) continue;
      seen.add(target);
    }
    result.push(lines[index]);
  }
  return result.join('');
}

function readTarget(file) {
  let stat;
  try { stat = fs.lstatSync(file); } catch (error) { if (error.code === 'ENOENT') return null; throw error; }
  if (!stat.isFile() || stat.isSymbolicLink()) throw new Error(`${file}: expected a regular .gitignore file; refusing to replace it.`);
  const bytes = fs.readFileSync(file);
  const text = bytes.toString('utf8');
  if (!Buffer.from(text).equals(bytes) || text.includes('\0')) throw new Error(`${file}: .gitignore must be UTF-8 text.`);
  return { text, mode: stat.mode & 0o777 };
}

function git(root, args, input) {
  const env = { ...process.env, LC_ALL: 'C' };
  // A caller's repository/index override must not redirect preparation elsewhere.
  for (const key of ['GIT_DIR', 'GIT_WORK_TREE', 'GIT_INDEX_FILE', 'GIT_COMMON_DIR', 'GIT_PREFIX']) delete env[key];
  const result = spawnSync('git', ['-C', root, ...args], { encoding: 'utf8', input, env, maxBuffer: 32 * 1024 * 1024 });
  if (result.error) throw result.error;
  return result;
}

function inspectGit(root) {
  const probe = git(root, ['rev-parse', '--is-inside-work-tree']);
  if (probe.status !== 0 && /not a git repository/.test(probe.stderr)) return { status: 'not_a_repository', tracked_paths: [] };
  if (probe.status !== 0 || probe.stdout.trim() !== 'true') throw new Error(`Cannot inspect project Git worktree: ${probe.stderr.trim() || probe.stdout.trim()}`);
  const ignored = git(root, ['check-ignore', '--no-index', '-v', '-z', '--stdin'], DIRECTORIES.map(dir => `${dir}/`).join('\0') + '\0');
  if (![0, 1].includes(ignored.status)) throw new Error(`git check-ignore failed: ${ignored.stderr.trim()}`);
  const fields = ignored.stdout.split('\0');
  const matched = new Set();
  for (let i = 0; i + 3 < fields.length; i += 4) if (fields[i + 2] && !fields[i + 2].startsWith('!')) matched.add(fields[i + 3]);
  const missing = DIRECTORIES.filter(dir => !matched.has(`${dir}/`));
  if (missing.length) throw new Error(`Git ignore rules conflict for ${missing.join(', ')}; check later or nested .gitignore overrides. Project preparation stopped.`);
  const tracked = git(root, ['ls-files', '--cached', '-z', '--', ...DIRECTORIES.map(dir => `${dir}/`)]);
  if (tracked.status !== 0) throw new Error(`git ls-files failed: ${tracked.stderr.trim()}`);
  return { status: 'verified', tracked_paths: [...new Set(tracked.stdout.split('\0').filter(Boolean))] };
}

export async function prepareProjectWorkspace(projectRoot) {
  const root = fs.realpathSync(projectRoot);
  if (!fs.statSync(root).isDirectory()) throw new Error(`Project path is not a directory: ${root}`);
  return withProjectCommitLock(root, () => {
    const file = path.join(root, '.gitignore');
    const before = readTarget(file);
    const content = managedContent(before?.text || '');
    const changed = before?.text !== content;
    if (changed) {
      const temporary = path.join(root, `.gitignore.arckit-${randomUUID()}.tmp`);
      try {
        fs.writeFileSync(temporary, content, { flag: 'wx', mode: before?.mode ?? 0o644 });
        const latest = readTarget(file);
        if (latest?.text !== before?.text) throw new Error('.gitignore changed during preparation; retry without overwriting the concurrent edit.');
        fs.renameSync(temporary, file);
      } finally { fs.rmSync(temporary, { force: true }); }
    }
    // Failure is visible; keep the repaired block for inspection and retry.
    const verification = inspectGit(root);
    return {
      schema_version: 'arckit-workspace-preparation/v1',
      project_root: root,
      changed_files: changed ? ['.gitignore'] : [],
      git_status: verification.status,
      tracked_path_count: verification.tracked_paths.length,
      tracked_path_sample: verification.tracked_paths.slice(0, 20),
      warnings: verification.tracked_paths.length
        ? ['Arckit local state paths are already tracked. Ignore rules do not untrack files; preserve the index and arrange an explicit migration before claiming they are excluded from commits.'] : [],
    };
  });
}
