// One product observation scope. Execution and object ownership never change here.
export function productScope(platform = {}, selected = 'all') {
  const ids = (platform.active_workset?.project_ids || []).map(String);
  const projectId = ids.includes(String(selected)) ? String(selected) : 'all';
  const projectIds = projectId === 'all' ? ids : [projectId];
  return { key: JSON.stringify([String(platform.user?.id || ''), String(platform.active_workset?.id || ''), projectId]), projectId, projectIds };
}
export const includesProject = (scope, id) => scope.projectIds.includes(String(id || ''));
export function scopedChatProjects(projects, platform, scope) {
  const localIds = new Set((platform.projects || []).filter(p => includesProject(scope, p.id)).map(p => String(p.local_project_id || p.id)));
  return projects.filter(p => localIds.has(String(p.id)));
}
export function restoredSelection(items, current, remembered, id = item => String(item.id)) {
  return [current, remembered].find(value => value && items.some(item => id(item) === String(value))) || String(items[0] ? id(items[0]) : '');
}
export function syncSummary(snapshot = {}, platform = {}, {authenticated = true, syncing = false} = {}) {
  const projects = Object.entries(snapshot.realtime?.projects || {});
  const errors = (platform.errors || []).map(e => `${e.section || e.source || '平台'}：${e.message || e.error || '同步失败'}`);
  for (const [id, health] of projects) if (health.error || ['degraded','reconnecting'].includes(health.state)) errors.push(`产品 ${id}：${health.error || '正在重连'}`);
  for(const error of snapshot.source_errors||[]) errors.push(typeof error==='string'?error:`${error.section||'任务源'}：${error.message||error.error||'同步失败'}`);
  if (['error','degraded'].includes(snapshot.source_status) && !errors.length) errors.unshift(snapshot.source_error || '任务源部分同步失败');
  if (['error','degraded','unknown'].includes(platform.source_status) && !errors.length) errors.push('平台来源尚未全部同步成功');
  const busy = syncing || snapshot.source_status === 'syncing';
  return { label: !authenticated || snapshot.source_status === 'unauthenticated' ? '未登录' : busy ? '正在同步…' : errors.length ? '部分同步失败' : snapshot.synced_at ? '已同步' : '尚未同步', time: snapshot.synced_at || '', errors, busy };
}

// Serialize owner transitions. A scope switch must not overwrite another object's draft.
export function createChatScopeController({coordinator, getScope, getProjects, defaults, storage}) {
  let previousKey = '', tail = Promise.resolve();
  const selections = new Map(), drafts = new Map();
  function read(key) { try { return JSON.parse(storage?.getItem(key) || 'null'); } catch { return null; } }
  function write(key, value) { try { storage?.setItem(key, JSON.stringify(value)); } catch {} }
  function capture(key = previousKey) {
    if (!key) return;
    const value = coordinator.getState(), owner = value.owner;
    const selection = {...owner}; selections.set(key, selection); write(`arcorbit:chat-scope:${key}`, selection);
    if (!owner.session_id && owner.project_id) {
      const account = JSON.parse(key)[0], draftKey = `${account}:${owner.project_id}`;
      const draft = {text:value.draft, configuration:value.configuration};
      drafts.set(draftKey,draft); write(`arcorbit:chat-scope-draft:${draftKey}`,draft);
    }
  }
  function reconcile() {
    tail = tail.catch(() => {}).then(async () => {
      const scope = getScope(), key = scope.key;
      if (previousKey && previousKey !== key) capture();
      const value = coordinator.getState(), projects = getProjects(), ids = new Set(projects.map(p => String(p.id)));
      const validOwner = ids.has(String(value.owner.project_id));
      const accountChanged = previousKey && JSON.parse(previousKey)[0] !== JSON.parse(key)[0];
      previousKey = key;
      if (validOwner && !accountChanged) { capture(); return; }
      const saved = selections.get(key) || read(`arcorbit:chat-scope:${key}`);
      const session = value.snapshot.sessions.find(s => s.id === saved?.session_id && ids.has(String(s.project_id)));
      await coordinator.flushDraft();
      if (key !== getScope().key) return;
      if (!projects.length) await coordinator.clearScopeSelection();
      else if (session) await coordinator.selectSession(session.id);
      else {
        const project = projects.find(p => String(p.id) === saved?.project_id) || projects[0];
        const draftKey = `${JSON.parse(key)[0]}:${project?.id || ''}`;
        const draft = drafts.get(draftKey) || read(`arcorbit:chat-scope-draft:${draftKey}`);
        await coordinator.newDraft(project?.id || '', draft?.configuration || defaults());
        if (draft && key === getScope().key) coordinator.setDraft(draft.text);
      }
      if (key === getScope().key) capture();
    });
    return tail;
  }
  return {reconcile, capture};
}
