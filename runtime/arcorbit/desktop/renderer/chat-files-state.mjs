export const fileParent = path => path.split('/').slice(0, -1).join('/');
export const fileName = path => path.split('/').at(-1);
export const fileDirty = tab => tab.text != null && tab.text !== tab.base;
export function fileFocusFallback(path, before, after) {
  const available = new Set(after);
  for (let parent = fileParent(path); parent; parent = fileParent(parent)) if (available.has(parent)) return parent;
  const index = before.indexOf(path);
  if (index >= 0) {
    for (let i = index + 1; i < before.length; i++) if (available.has(before[i])) return before[i];
    for (let i = index - 1; i >= 0; i--) if (available.has(before[i])) return before[i];
  }
  return after[0] || '';
}
export function createChatFilesState({ api, changed = () => {}, loadingDelayMs = 160 }) {
  const sessions = new Map();
  let current = null, ownerKey = '', epoch = 0, error = '', pending, observation = '', active = false, resumeRequired = false;
  let observationPending = Promise.resolve(), releasePending = Promise.resolve();
  const emit = () => changed();
  const visibleDirectory = (s, path) => {
    if (!path) return true;
    const parts = path.split('/');
    for (let i = 1; i <= parts.length; i++) if (!s.expanded.has(parts.slice(0, i).join('/'))) return false;
    return true;
  };
  const observedPaths = s => ['', ...[...s.expanded].filter(path => s.directories.has(path) && visibleDirectory(s, path))];
  const visiblePaths = (s, path = '', result = []) => {
    for (const entry of s.directories.get(path)?.entries || []) {
      result.push(entry.path);
      if (entry.kind === 'directory' && s.expanded.has(entry.path)) visiblePaths(s, entry.path, result);
    }
    return result;
  };
  async function command(s, action, input = {}) {
    if (s.invalid) throw Error('旧工作区已失效，请先处理保留草稿。');
    try { return await api.chatFiles(action, {...s.owner, expected_workspace: s.workspace, ...input}); }
    catch (e) { if (/工作区或账号已变化|会话不存在或不可访问/.test(e.message)) { s.invalid = true; s.error = e.message; } throw e; }
  }
  async function observe(s, force = false, request = epoch) {
    if (!active || request !== epoch || s.invalid || current !== s) return;
    observationPending = observationPending.catch(() => {}).then(async () => {
      if (!active || request !== epoch || s.invalid || current !== s) return;
      const paths = observedPaths(s).sort(), signature = JSON.stringify([s.workspace, paths]);
      if (!force && observation === signature) return;
      observation = signature;
      try {
        const state = await command(s, 'observe', { paths });
        if (active && request === epoch && current === s && state.workspace === s.workspace) { s.watch_error = state.watch_error || ''; emit(); }
      } catch (e) {
        if (active && request === epoch && current === s) { observation = ''; s.watch_error = e.message; emit(); }
      }
    });
    return observationPending;
  }
  async function release() {
    observation = '';
    releasePending = observationPending = observationPending.catch(() => {}).then(() => api.chatFiles('release').catch(() => {}));
    await releasePending;
  }
  async function deactivate() {
    active = false; ++epoch; ownerKey = ''; resumeRequired = true;
    await release();
  }
  async function select(owner, force = false) {
    const key = JSON.stringify(owner);
    if (!force && key === ownerKey) return pending;
    active = false; ownerKey = key; const request = ++epoch, refreshRequired = force || resumeRequired;
    if (current?.owner.project_id !== owner.project_id) { current = null; void release(); }
    if (!owner.project_id) { current = null; error = '请选择工作区。'; void release(); emit(); return; }
    pending = (async () => {
      try {
        await releasePending;
        if (request !== epoch) return;
        const context = await api.chatFiles('context', owner);
        if (request !== epoch) return;
        error = '';
        const stale = [...sessions.values()].find(s => s.owner.project_id === owner.project_id && s.workspace !== context.workspace && s.tabs.some(fileDirty));
        if (stale) { stale.invalid = true; stale.error = '工作区或账号已变化。请复制或放弃旧草稿后重新打开，旧草稿不能写入新工作区。'; current = stale; void release(); emit(); return; }
        let s = sessions.get(context.workspace);
        if (!s) { s = {...context, owner, tabs: [], active: '', directories: new Map(), expanded: new Set(), selected: '', focusRecovery: null, error: '', invalid: false, watch_error: ''}; sessions.set(s.workspace, s); }
        // A failed context lookup blocks operations, but is not proof that the
        // identity changed. Only a fresh matching token may restore this session.
        s.invalid = false; s.error = ''; s.owner = {...owner}; current = s; active = true; emit();
        if (!s.directories.has('')) await list(s, '', false, false, request);
        else if (refreshRequired) await refresh(s, request);
        if (!active || request !== epoch || current !== s) return;
        await observe(s, true, request);
        if (current === s && request === epoch) resumeRequired = false;
      } catch (e) { if (request === epoch) { active = false; error = e.message; if (current) { current.invalid = true; current.error = error; } void release(); emit(); } }
    })();
    return pending;
  }
  function prune(s, path, entries, before) {
    const children = new Set(entries.filter(entry => entry.kind === 'directory').map(entry => entry.path));
    for (const expanded of [...s.expanded]) if (fileParent(expanded) === path && !children.has(expanded)) {
      for (const candidate of [...s.expanded]) if (candidate === expanded || candidate.startsWith(expanded + '/')) s.expanded.delete(candidate);
      for (const candidate of [...s.directories.keys()]) if (candidate === expanded || candidate.startsWith(expanded + '/')) s.directories.delete(candidate);
    }
    if (s.selected && ![...s.directories.values()].some(directory => directory.entries?.some(entry => entry.path === s.selected))) {
      const removed = s.selected, target = fileFocusFallback(removed, before, visiblePaths(s));
      s.selected = ''; s.focusRecovery = target ? { removed, target } : null;
    }
  }
  async function list(s, path, more = false, background = false, request = epoch) {
    if (!active || request !== epoch || current !== s || s.invalid) return;
    const old = s.directories.get(path);
    if (old?.pending) {
      if (!more && old.pendingEpoch !== request) {
        await old.pending;
        if (active && request === epoch && current === s && !s.invalid) return list(s, path, false, background, request);
        return;
      }
      if (!more) old.again = true;
      return old.pending;
    }
    const trusted = Boolean(old?.directory_revision), state = old || { entries: [] };
    state.error = ''; state.stale = false; state.refreshing = trusted || background;
    s.directories.set(path, state);
    let delay;
    if (!trusted && !background) delay = setTimeout(() => { if (state.pending) { state.loading = true; emit(); } }, loadingDelayMs);
    emit();
    state.pendingEpoch = request;
    state.pending = (async () => {
      try {
        if (more) {
          const result = await command(s, 'list', { path, offset: old?.next_offset || 0, directory_revision: old?.directory_revision });
          if (!active || request !== epoch || current !== s) return;
          Object.assign(state, result, { entries: [...(old?.entries || []), ...result.entries] });
        } else {
          const before = visiblePaths(s);
          const first = await command(s, 'list', { path, offset: 0 });
          if (!active || request !== epoch || current !== s) return;
          const entries = [...first.entries], target = Math.max(old?.entries?.length || 0, first.entries.length);
          let next = first.next_offset;
          while (next !== null && entries.length < target) {
            const page = await command(s, 'list', { path, offset: next, directory_revision: first.directory_revision });
            if (!active || request !== epoch || current !== s) return;
            entries.push(...page.entries); next = page.next_offset;
          }
          Object.assign(state, first, { entries, next_offset: next });
          prune(s, path, entries, before);
        }
        state.stale = false;
      } catch (e) { if (active && request === epoch && current === s) { state.error = e.message; state.stale = trusted; } }
    })();
    try { await state.pending; }
    finally {
      clearTimeout(delay); state.pending = null; state.pendingEpoch = null; state.loading = false; state.refreshing = false;
      const again = state.again; state.again = false; emit();
      if (active && request === epoch && current === s && !s.invalid) void observe(s, false, request);
      if (again && active && current === s && !s.invalid) queueMicrotask(() => { void list(s, path, false, true); });
    }
  }
  const reconcile = (s, path, request = epoch) => list(s, path, false, true, request);
  async function setExpanded(s, path, expanded) {
    const request = epoch;
    if (path) {
      if (expanded) s.expanded.add(path); else s.expanded.delete(path);
    }
    emit(); await observe(s, false, request);
    if (!active || request !== epoch || current !== s || !expanded) return;
    if (!s.directories.has(path)) { await list(s, path, false, false, request); return; }
    const visible = [...s.directories.keys()].filter(candidate => candidate === path || candidate.startsWith(path + '/')).filter(candidate => visibleDirectory(s, candidate));
    await Promise.all(visible.map(candidate => reconcile(s, candidate, request)));
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
    s.active = replace(s.active); s.selected = result.path;
    s.expanded = new Set([...s.expanded].map(replace)); s.directories.clear(); observation = '';
    await refresh(s); emit(); return result;
  }
  async function trash(s, path) {
    if (affected(s, path).some(t => t.saving)) throw Error('请等待保存完成后删除。');
    await command(s, 'trash', {path}); for (const t of [...affected(s, path)]) close(s, t);
    s.directories.clear(); observation = ''; await refresh(s);
  }
  async function refresh(s, request = epoch) {
    await reconcile(s, '', request);
    if (!active || request !== epoch || current !== s) return;
    for (const dir of observedPaths(s).filter(Boolean)) {
      await reconcile(s, dir, request);
      if (!active || request !== epoch || current !== s) return;
    }
    for (const t of s.tabs) await check(s, t);
    if (active && request === epoch && current === s) await observe(s, true, request);
  }
  function discardSession(s) {
    for (const t of [...s.tabs]) close(s, t); sessions.delete(s.workspace);
    if (current === s) { active = false; current = null; void release(); }
    ownerKey = ''; emit();
  }
  function reset() { active = false; ++epoch; for (const s of [...sessions.values()]) discardSession(s); current = null; ownerKey = ''; error = ''; resumeRequired = false; void release(); emit(); }
  const pendingSaves = () => [...sessions.values()].flatMap(s => s.tabs.map(t => t.saving).filter(Boolean));
  async function settleSaves() { while (pendingSaves().length) await Promise.allSettled(pendingSaves()); }
  const off = api.onChatFilesEvent?.(event => {
    const s = sessions.get(event.workspace);
    if (!active || !s || current !== s || event.project_id !== s.project_id) return;
    const request = epoch;
    s.watch_error = event.watch_error || '';
    for (const path of event.invalidated || []) if (s.directories.has(path)) void reconcile(s, path, request);
    emit();
  });
  return {sessions, select, command, list, reconcile, setExpanded, observe, release, deactivate, openFile, check, save, reload, close, rename, trash, affected, refresh, discardSession, reset,
    pendingSaves, settleSaves, destroy() { off?.(); reset(); }, current: () => current, error: () => error, changed: emit,
    dirty: () => [...sessions.values()].flatMap(s => s.tabs.filter(fileDirty).map(t => ({s,t})))};
}
