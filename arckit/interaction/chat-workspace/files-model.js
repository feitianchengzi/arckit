/* Browser-only sample filesystem. Never reads or writes the user's project. */
(() => {
  const sessions = new Map();
  let account = 'sample-account';
  const parent = path => path.split('/').slice(0, -1).join('/');
  const name = path => path.split('/').at(-1);
  function key() {
    const p = ChatModel.project(ChatModel.owner().project);
    return p?.ready ? JSON.stringify([account, p.id, p.path]) : '';
  }
  function seed() {
    const disk = new Map();
    const git = new Map();
    const add = (path, kind, text = '', extra = {}) => disk.set(path, {path, kind, text, revision: 1, ...extra});
    for (const p of ['.git', 'node_modules', 'src', 'src/nested', 'many', 'restricted']) add(p, 'directory');
    add('restricted', 'directory', '', {denied: true});
    add('.env', 'file', 'API_URL=http://localhost\n');
    add('.git/config', 'file', '[core]\n  repositoryformatversion = 0\n');
    add('node_modules/.package-lock.json', 'file', '{}\n');
    add('README.md', 'file', '# 项目说明\n\n这是可编辑的本地样本。\n');
    add('src/app.js', 'file', 'export const greeting = "Hello";\n');
    add('src/nested/app.js', 'file', 'export const nested = true;\n');
    add('空 格`文件.md', 'file', '# 路径引用样本\n');
    add('image.png', 'file', '', {unsupported: '二进制文件不可作为文本编辑。'});
    add('large.log', 'file', '', {unsupported: '文件超过 2 MiB，不能在此编辑。'});
    add('legacy.txt', 'file', '', {unsupported: '文件不是有效 UTF-8 文本。'});
    add('linked', 'link', '', {target: '../outside'});
    for (let i = 0; i < 125; i++) add(`many/file-${String(i).padStart(3, '0')}.txt`, 'file', `${i}\n`);
    git.set('.env', {marker: '!', meaning: '存在冲突'});
    git.set('README.md', {marker: 'A', meaning: '已暂存新增'});
    git.set('src/app.js', {marker: 'M', meaning: '未暂存修改'});
    git.set('src/nested/app.js', {marker: '?', meaning: '未跟踪'});
    git.set('src/removed.js', {marker: 'D', meaning: '已删除'});
    git.set('空 格`文件.md', {marker: 'R', meaning: '已暂存重命名'});
    return {disk, git, gitFreshness: 'fresh', tabs: [], active: '', selected: '', expanded: new Set(), limits: new Map(), error: '', fail: '', trash: [], loading: '', epoch: 0};
  }
  function current() {
    const id = key();
    if (!id) return null;
    if (!sessions.has(id)) sessions.set(id, seed());
    return sessions.get(id);
  }
  const dirty = tab => tab.text != null && tab.text !== tab.base;
  const tab = (s, path = s?.active) => s?.tabs.find(t => t.path === path);
  function assertCurrent(s) {
    if (current() !== s) throw Error('工作区已变化，旧操作已取消。');
  }
  function fail(s, action) {
    assertCurrent(s);
    if (s.fail === action || s.fail === 'all') { s.fail = ''; throw Error('操作失败，原内容和草稿已保留。请重试。'); }
  }
  function children(s, path) {
    if (s.disk.get(path)?.denied) throw Error('没有读取此目录的权限。');
    return [...s.disk.values()].filter(e => parent(e.path) === path)
      .sort((a, b) => Number(b.kind === 'directory') - Number(a.kind === 'directory') || name(a.path).localeCompare(name(b.path)));
  }
  function gitStatus(s, path) {
    const direct = s.git.get(path);
    if (direct && s.disk.has(path)) return {...direct, direct: true};
    const prefix = path ? path + '/' : '';
    const entries = [...s.git].filter(([candidate]) => candidate.startsWith(prefix));
    if (!entries.length) return null;
    const conflict = entries.filter(([, value]) => value.marker.includes('!')).length;
    const untracked = entries.filter(([, value]) => value.marker === '?').length;
    const deleted = entries.filter(([, value]) => value.marker.includes('D')).length;
    const renamed = entries.filter(([, value]) => value.marker.includes('R')).length;
    const tracked = entries.length - conflict - untracked - deleted - renamed;
    const parts = [conflict && `冲突 ${conflict}`, tracked && `已跟踪变化 ${tracked}`, renamed && `重命名 ${renamed}`, deleted && `删除 ${deleted}`, untracked && `未跟踪 ${untracked}`].filter(Boolean);
    return {marker: conflict ? '!' : (tracked || renamed || deleted) ? 'M' : '?', meaning: `包含 Git 变化：${parts.join('，')}，共 ${entries.length} 个路径`, direct: false};
  }
  async function open(s, path) {
    const epoch = ++s.epoch;
    s.loading = path;
    await new Promise(resolve => setTimeout(resolve, s.slow ? 350 : 20));
    if (current() !== s || epoch !== s.epoch) { s.loading = ''; return false; }
    s.loading = '';
    fail(s, 'read');
    const file = s.disk.get(path);
    if (!file) throw Error('文件已消失，请刷新目录。');
    let t = tab(s, path);
    if (!t) {
      t = {path, text: file.unsupported || file.kind !== 'file' ? null : file.text, base: file.text, revision: file.revision,
        unsupported: file.unsupported || (file.kind === 'link' ? `符号链接 → ${file.target}；不展开或编辑链接目标。` : ''), undo: [], redo: [], error: ''};
      s.tabs.push(t);
    }
    s.active = path;
    check(s, t);
    return true;
  }
  function check(s, t) {
    const disk = s.disk.get(t.path);
    if (!disk) t.error = '文件已从磁盘删除；草稿保留，不自动重建。';
    else if (disk.revision !== t.revision) t.error = '磁盘已变化，请查看磁盘或放弃草稿后重新读取。';
  }
  async function save(s, t) {
    fail(s, 'save');
    if (t.text == null || t.saving) throw Error('当前文件不能保存。');
    const text = t.text, revision = t.revision, path = t.path;
    t.saving = true;
    try {
      await new Promise(resolve => setTimeout(resolve, 80));
      assertCurrent(s);
      const file = s.disk.get(path);
      if (!file) throw Error('文件已从磁盘删除，草稿保留。');
      if (file.revision !== revision) throw Error('磁盘已变化，未覆盖；草稿已保留。');
      file.text = text; file.revision++;
      t.base = text; t.revision = file.revision; t.error = '';
    } finally { t.saving = false; }
  }
  function close(s, t) {
    const index = s.tabs.indexOf(t);
    s.tabs.splice(index, 1);
    if (s.active === t.path) s.active = s.tabs[Math.min(index, s.tabs.length - 1)]?.path || '';
  }
  function reload(s, t) {
    fail(s, 'read');
    const file = s.disk.get(t.path);
    if (!file) throw Error('文件已消失，草稿保留。');
    t.text = file.text; t.base = file.text; t.revision = file.revision; t.error = ''; t.undo = []; t.redo = [];
  }
  function validName(value) {
    if (!value.trim() || value === '.' || value === '..' || /[/\\\0]/.test(value)) throw Error('请输入单个有效名称，不能含路径分隔符。');
    return value;
  }
  function create(s, directory, value, kind) {
    fail(s, 'write');
    if (directory && s.disk.get(directory)?.kind !== 'directory') throw Error('目标目录已失效。');
    if (s.disk.get(directory)?.denied) throw Error('没有写入此目录的权限。');
    const path = [directory, validName(value)].filter(Boolean).join('/');
    if (s.disk.has(path)) throw Error('同名项目已存在，不会覆盖。');
    s.disk.set(path, {path, kind, text: '', revision: 1});
    if (kind === 'file') s.git.set(path, {marker: '?', meaning: '未跟踪'});
    s.expanded.add(directory); s.selected = path;
    return path;
  }
  function rename(s, path, value) {
    fail(s, 'write');
    if (!path || !s.disk.has(path)) throw Error('目标已失效，不能重命名。');
    const next = [parent(path), validName(value)].filter(Boolean).join('/');
    if (next === path) return;
    if (s.disk.has(next)) throw Error('同名项目已存在，不会覆盖。');
    const remap = p => p === path || p.startsWith(path + '/') ? next + p.slice(path.length) : p;
    for (const [p, e] of [...s.disk]) if (remap(p) !== p) { s.disk.delete(p); e.path = remap(p); s.disk.set(e.path, e); }
    for (const [p, status] of [...s.git]) if (remap(p) !== p) { s.git.delete(p); s.git.set(remap(p), {...status, marker: 'R', meaning: '已重命名'}); }
    s.tabs.forEach(t => t.path = remap(t.path)); s.active = remap(s.active); s.selected = next;
    s.expanded = new Set([...s.expanded].map(remap));
  }
  const affected = (s, path) => s.tabs.filter(t => t.path === path || t.path.startsWith(path + '/'));
  function trash(s, path) {
    fail(s, 'trash');
    if (!path || !s.disk.has(path)) throw Error('目标已失效，不能删除。');
    const entries = [...s.disk].filter(([p]) => p === path || p.startsWith(path + '/'));
    s.trash.push(entries); entries.forEach(([p]) => s.disk.delete(p));
    for (const [p, status] of [...s.git]) if (p === path || p.startsWith(path + '/')) {
      if (status.marker === '?') s.git.delete(p);
      else s.git.set(p, {marker: 'D', meaning: '已删除'});
    }
    affected(s, path).forEach(t => close(s, t)); s.selected = '';
  }
  function externalChange(s, action) {
    assertCurrent(s);
    if (action === 'create') {
      s.disk.set('src/external-note.js', {path: 'src/external-note.js', kind: 'file', text: 'external\n', revision: 1});
      s.git.set('src/external-note.js', {marker: '?', meaning: '未跟踪'});
    } else if (action === 'rename') {
      const entry = s.disk.get('src/external-note.js');
      if (entry) { s.disk.delete(entry.path); entry.path = 'src/external-renamed.js'; s.disk.set(entry.path, entry); }
      s.git.delete('src/external-note.js'); s.git.set('src/external-renamed.js', {marker: 'R', meaning: '外部重命名'});
    } else if (action === 'delete') {
      s.disk.delete('src/external-renamed.js'); s.git.set('src/external-renamed.js', {marker: 'D', meaning: '外部删除'});
    }
  }
  window.ChatFilesModel = {sessions, key, current, parent, name, children, gitStatus, externalChange, dirty, tab, open, save, close, reload, create, rename, trash, affected, assertCurrent, check,
    setAccount(value) { account = value; }};
})();
