const CONFLICT = new Set(['U', 'AA', 'DD', 'AU', 'UA', 'DU', 'UD']);
const TRACKED = new Set(['A', 'M', 'D', 'R', 'C', 'T']);

export function normalizeFileGitPath(value) {
  if (typeof value !== 'string' || !value || value.includes('\0')) throw Error('Git 状态包含无效路径。');
  const path = value.replaceAll('\\', '/');
  if (path.startsWith('/') || /^[A-Za-z]:\//.test(path) || path.startsWith('//')) throw Error('Git 状态包含绝对路径。');
  const parts = path.split('/');
  if (parts.some(part => !part || part === '.' || part === '..')) throw Error('Git 状态包含越界路径。');
  return parts.join('/');
}

const parents = path => {
  const parts = path.split('/');
  const result = [''];
  for (let i = 1; i < parts.length; i++) result.push(parts.slice(0, i).join('/'));
  return result;
};

function marker(code, scope) {
  if (!code || code === ' ') return null;
  if (CONFLICT.has(code)) return { code: '!', category: 'conflict', meaning: '存在合并冲突' };
  if (code === '?') return { code: '?', category: 'untracked', meaning: '未跟踪' };
  const normalized = code === 'C' || code === 'T' ? 'M' : code;
  if (!TRACKED.has(code)) return null;
  const label = { A: '新增', M: '修改', D: '删除', R: '重命名' }[normalized];
  return { code: normalized, category: 'tracked', meaning: `${scope === 'index' ? '已暂存' : '未暂存'}${label}` };
}

function fileStatus(file, conflicted) {
  const index = marker(file.index, 'index'), worktree = marker(file.working_dir, 'worktree');
  const hasConflict = conflicted || index?.category === 'conflict' || worktree?.category === 'conflict';
  const markers = hasConflict ? [{ code: '!', category: 'conflict', meaning: '存在合并冲突' }]
    : index?.category === 'untracked' && worktree?.category === 'untracked' ? [index] : [index, worktree].filter(Boolean);
  const category = hasConflict ? 'conflict' : markers.some(item => item.category === 'tracked') ? 'tracked' : 'untracked';
  return { markers, category, label: markers.map(item => item.code).join(' '), meaning: markers.map(item => item.meaning).join('；') };
}

function aggregateStatus(value) {
  const conflict = value.categories.conflict.size, tracked = value.categories.tracked.size, untracked = value.categories.untracked.size;
  const category = conflict ? 'conflict' : tracked ? 'tracked' : 'untracked';
  const label = category === 'conflict' ? '!' : category === 'tracked' ? 'M' : '?';
  const parts = [];
  if (conflict) parts.push(`冲突 ${conflict}`);
  if (tracked) parts.push(`已跟踪变更 ${tracked}`);
  if (untracked) parts.push(`未跟踪 ${untracked}`);
  return { category, label, count: value.paths.size, meaning: `Git：${parts.join('，')}；共 ${value.paths.size} 个后代路径` };
}

export function projectFileGitStatus(value) {
  if (value?.kind === 'not_repository') return { kind: 'not_repository', files: new Map(), directories: new Map() };
  if (value?.kind !== 'repository') throw Error('Git 状态尚未就绪。');
  const rawFiles = Array.isArray(value.files) ? value.files : [];
  const conflicts = new Set((Array.isArray(value.conflicted) ? value.conflicted : []).map(normalizeFileGitPath));
  const normalized = rawFiles.map(file => { const path = normalizeFileGitPath(file.path); return { ...file, path, from: file.from ? normalizeFileGitPath(file.from) : '', key: `path:${path}` }; });
  const files = new Map(), aggregates = new Map();
  const addAggregate = (path, key, category) => {
    for (const parent of parents(path)) {
      let aggregate = aggregates.get(parent);
      if (!aggregate) { aggregate = { paths: new Set(), categories: { conflict: new Set(), tracked: new Set(), untracked: new Set() } }; aggregates.set(parent, aggregate); }
      aggregate.paths.add(key); aggregate.categories[category].add(key);
    }
  };
  for (const file of normalized) {
    const status = fileStatus(file, conflicts.has(file.path));
    if (!status.markers.length) continue;
    files.set(file.path, status);
    addAggregate(file.path, file.key, status.category);
    if (file.from && file.from !== file.path) addAggregate(file.from, file.key, status.category);
    conflicts.delete(file.path);
  }
  for (const path of conflicts) {
    const status = fileStatus({ index: 'U', working_dir: 'U' }, true), key = `conflict:${path}`;
    files.set(path, status); addAggregate(path, key, 'conflict');
  }
  return { kind: 'repository', files, directories: new Map([...aggregates].map(([path, status]) => [path, aggregateStatus(status)])) };
}
