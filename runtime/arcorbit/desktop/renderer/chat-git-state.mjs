// Observation lifecycle is independent of the details container. Responses are
// scoped by both the visible project set and the main-process workspace token.
export function createChatGitState({ api, getContext, onChange = () => {}, document: doc = globalThis.document }) {
  const states = new Map(); let signature = '', epoch = 0, disposed = false;
  function accept(state) {
    const current = states.get(state.project_id);
    if (current?.workspace === state.workspace && (current?.version || 0) > (state.version || 0)) return;
    states.set(state.project_id, state);
  }
  const context = () => { const c = getContext(); return { ...c, active: c.active && !doc?.hidden }; };
  async function sync() {
    if (disposed || !api.chatGit) return;
    const c = context(), ids = [...new Set(c.project_ids || [])].sort();
    const next = c.active ? JSON.stringify([c.scope, ids, c.selected_project_id]) : '';
    if (next === signature) return;
    signature = next; const request = ++epoch;
    for (const id of states.keys()) if (!c.active || !ids.includes(id)) states.delete(id);
    if (!c.active) { await api.chatGit('release'); return; }
    try {
      const result = await api.chatGit('observe', { project_ids: ids });
      if (request !== epoch || disposed) return;
      for (const state of result) accept(state);
      onChange();
    } catch (error) {
      if (request !== epoch || disposed) return;
      for (const id of ids) states.set(id, { project_id: id, value: null, ...states.get(id), stale: true, error: error.message });
      onChange();
    }
  }
  const off = api.onChatGitEvent?.(state => {
    const c = context(); if (!c.active || !(c.project_ids || []).includes(state.project_id)) return;
    const current = states.get(state.project_id);
    // Initial events precede observe's reply; that reply supplies the token.
    if (!current?.workspace || current.workspace !== state.workspace) return;
    accept(state); onChange();
    if (state.unavailable) { signature = ''; void sync(); }
  });
  const visibility = () => { void sync(); };
  doc?.addEventListener('visibilitychange', visibility);
  async function action(name, projectId) {
    const state = states.get(projectId); if (!state?.workspace) throw Error('Git 状态尚未就绪。');
    const request = epoch;
    const result = await api.chatGit(name, { project_id: projectId, expected_workspace: state.workspace });
    if (request === epoch && states.get(projectId)?.workspace === result.workspace) { accept(result); onChange(); }
    return result;
  }
  return { sync, retry() { signature=''; return sync(); }, get: id => states.get(id), refresh: id => action('refresh', id), fetch: id => action('fetch', id),
    reset() { epoch++; signature = ''; states.clear(); void api.chatGit?.('release'); },
    destroy() { disposed = true; epoch++; off?.(); doc?.removeEventListener('visibilitychange', visibility); states.clear(); void api.chatGit?.('release'); } };
}
