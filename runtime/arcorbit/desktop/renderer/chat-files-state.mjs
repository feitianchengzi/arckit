export const fileParent = path => path.split('/').slice(0, -1).join('/');
export const fileName = path => path.split('/').at(-1);
export const fileDirty = tab => tab.text != null && tab.text !== tab.base;
export function createChatFilesState({ api, changed = () => {} }) {
  const sessions = new Map();
  let current = null, ownerKey = '', epoch = 0, error = '', pending;
  const emit = () => changed();
  async function select(owner, force = false) {
    const key = JSON.stringify(owner);
    if (!force && key === ownerKey) return pending;
    ownerKey = key; const request = ++epoch;
    if (current?.owner.project_id !== owner.project_id) current = null;
    if (!owner.project_id) { current = null; error = '请选择工作区。'; emit(); return; }
    pending = (async () => {
      try {
        const context = await api.chatFiles('context', owner);
        if (request !== epoch) return;
        error = '';
        const stale = [...sessions.values()].find(s => s.owner.project_id === owner.project_id && s.workspace !== context.workspace && s.tabs.some(fileDirty));
        if (stale) { stale.invalid = true; stale.error = '工作区或账号已变化。请复制或放弃旧草稿后重新打开，旧草稿不能写入新工作区。'; current = stale; emit(); return; }
        let s = sessions.get(context.workspace);
        if (!s) { s = {...context, owner, tabs: [], active: '', directories: new Map(), expanded: new Set(), selected: '', error: '', invalid: false}; sessions.set(s.workspace, s); }
        // A failed context lookup blocks operations, but is not proof that the
        // identity changed. Only a fresh matching token may restore this session.
        // Different identities with drafts returned through the stale branch above.
        s.invalid = false; s.error = '';
        s.owner = {...owner}; current = s; emit();
        if (!s.directories.has('') || force) await list(s, '');
      } catch (e) { if (request === epoch) { error = e.message; if (current) { current.invalid = true; current.error = error; } emit(); } }
    })();
    return pending;
  }
  async function command(s, action, input = {}) {
    if (s.invalid) throw Error('旧工作区已失效，请先处理保留草稿。');
    try { return await api.chatFiles(action, {...s.owner, expected_workspace: s.workspace, ...input}); }
    catch (e) { if (/工作区或账号已变化|会话不存在或不可访问/.test(e.message)) { s.invalid = true; s.error = e.message; } throw e; }
  }
  async function list(s, path, more = false) {
    const old = s.directories.get(path);
    if (old?.loading) return;
    const state = {...old, entries: old?.entries || [], loading: true, error: ''}; s.directories.set(path, state); emit();
    try {
      const result = await command(s, 'list', {path, offset: more ? old?.next_offset || 0 : 0, directory_revision: more ? old?.directory_revision : undefined});
      Object.assign(state, result, {entries: more ? [...old.entries, ...result.entries] : result.entries});
    } catch (e) { state.error = e.message; }
    finally { state.loading = false; emit(); }
  }
  async function openFile(s, path) {
    const request = epoch;
    const existing = s.tabs.find(t => t.path === path);
    if (existing) { s.active = path; emit(); await check(s, existing); return existing; }
    s.opening ||= new Map();
    if (s.opening.has(path)) return s.opening.get(path);
    const promise = (async () => {
      const file = await command(s, 'read', {path});
      if (request !== epoch || current !== s) return null;
      const tab = {...file, base: file.text, error: '', saving: false, id: crypto.randomUUID(), model: null, view: null};
      s.tabs.push(tab); s.active = path; emit(); return tab;
    })();
    s.opening.set(path, promise); emit();
    try { return await promise; } finally { s.opening.delete(path); emit(); }
  }
  async function check(s, t) {
    if (t.text == null || t.saving || s.invalid) return;
    try { const disk = await command(s, 'read', {path: t.path}); t.error = disk.revision === t.revision ? '' : '磁盘文件已变化。草稿已保留，请查看磁盘或重新读取。'; }
    catch (e) { t.error = e.message; }
    emit();
  }
  async function save(s, t) {
    if (t.saving) return t.saving;
    if (t.text == null) throw Error('该文件不能作为文本保存。');
    const text = t.text;
    t.saving = (async () => {
      try { const result = await command(s, 'save', {path: t.path, text, revision: t.revision}); t.base = text; t.revision = result.revision; t.error = ''; }
      catch (e) { t.error = e.message; throw e; }
      finally { t.saving = false; emit(); }
    })(); emit(); return t.saving;
  }
  async function reload(s, t) {
    const file = await command(s, 'read', {path: t.path});
    if (file.text == null) throw Error(file.unsupported || '文件不能作为文本读取。');
    Object.assign(t, file, {base: file.text, error: ''}); t.model?.setValue(file.text); emit();
  }
  function close(s, t) {
    const index = s.tabs.indexOf(t); if (index < 0) return;
    t.subscription?.dispose(); t.model?.dispose(); s.tabs.splice(index, 1);
    if (s.active === t.path) s.active = s.tabs[Math.min(index, s.tabs.length - 1)]?.path || '';
    emit();
  }
  const affected = (s, path) => s.tabs.filter(t => t.path === path || t.path.startsWith(path + '/'));
  async function rename(s, path, name) {
    if (affected(s, path).some(t => t.saving)) throw Error('请等待保存完成后重命名。');
    const result = await command(s, 'rename', {path, name});
    const replace = value => value === path || value.startsWith(path + '/') ? result.path + value.slice(path.length) : value;
    for (const t of affected(s, path)) t.path = replace(t.path);
    // Monaco resource identities remain stable across rename, preserving undo.
    // The path -> resource mapping migrates with each tab rather than recreating models.
    s.active = replace(s.active); s.selected = result.path;
    s.expanded = new Set([...s.expanded].map(replace)); s.directories.clear();
    await refresh(s); emit();
    return result;
  }
  async function trash(s, path) {
    if (affected(s, path).some(t => t.saving)) throw Error('请等待保存完成后删除。');
    await command(s, 'trash', {path}); for (const t of [...affected(s, path)]) close(s, t);
    s.directories.clear(); await refresh(s);
  }
  async function refresh(s) { await list(s, ''); for (const dir of s.expanded) await list(s, dir); for (const t of s.tabs) await check(s, t); }
  function discardSession(s) { for (const t of [...s.tabs]) close(s, t); sessions.delete(s.workspace); if (current === s) current = null; ownerKey = ''; emit(); }
  function reset() { ++epoch; for (const s of [...sessions.values()]) discardSession(s); current = null; ownerKey = ''; error = ''; emit(); }
  const pendingSaves = () => [...sessions.values()].flatMap(s => s.tabs.map(t => t.saving).filter(Boolean));
  async function settleSaves() { while (pendingSaves().length) await Promise.allSettled(pendingSaves()); }
  return {sessions, select, command, list, openFile, check, save, reload, close, rename, trash, affected, refresh, discardSession, reset,
    pendingSaves, settleSaves,
    current: () => current, error: () => error, changed: emit, dirty: () => [...sessions.values()].flatMap(s => s.tabs.filter(fileDirty).map(t => ({s,t})))};
}
