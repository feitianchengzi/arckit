import { createHash } from 'node:crypto';
import { EventEmitter } from 'node:events';
import { chatRoot } from './chat-workspace-files.mjs';
import { createChatGitDetails } from './chat-git-details.mjs';
import { createChatGitObserver } from './chat-git-observer.mjs';

const hash = value => createHash('sha256').update(JSON.stringify(value)).digest('hex');
export function createChatGit({ runManager, getAccountScope, authorizeSession,
  observer = createChatGitObserver(), details = createChatGitDetails() }) {
  const bindings = new Map(), events = new EventEmitter();
  let epoch = 0;
  async function owner(projectId) {
    const [store, account] = await Promise.all([
      runManager.readDesktopChatMetadata?.() || runManager.readDesktopStore(), getAccountScope()
    ]);
    const project = store.projects.find(p => p.id === projectId);
    if (!project?.path) throw Error('工作区未绑定或不可用。');
    const sessions = Object.values(store.sessions || {}).flat().filter(s => s.project_id === projectId && !s.chat_hidden);
    if (sessions.length && !(await Promise.all(sessions.map(s => authorizeSession(s, { store })))).some(Boolean)) {
      throw Error('当前账号无法访问此工作区。');
    }
    const root = await chatRoot(project.path);
    const key = hash([account || 'local', root.path, root.identity]);
    return { project_id: projectId, root: root.path, key,
      workspace: hash([projectId, project.path, key]) };
  }
  async function assertCurrent(binding) {
    if (bindings.get(binding.project_id) !== binding || (await owner(binding.project_id)).workspace !== binding.workspace) {
      throw Error('账号或工作区已变化，请重新读取。');
    }
  }
  function publicResult(binding, state) {
    const value = state.value ? { ...state.value } : null;
    if (value) delete value.remote_url;
    return { project_id: binding.project_id, workspace: binding.workspace, ...state, value };
  }
  function remove(id) { const b = bindings.get(id); bindings.delete(id); b?.handle.release(); }
  async function publish(binding, state) {
    const sequence = binding.sequence = (binding.sequence || 0) + 1;
    try { await assertCurrent(binding); if (sequence === binding.sequence) events.emit('event', publicResult(binding, state)); }
    catch {
      if (bindings.get(binding.project_id) === binding) {
        remove(binding.project_id);
        events.emit('event', { project_id: binding.project_id, workspace: binding.workspace,
          value: null, stale: true, error: '账号或工作区已变化，请重新读取。', unavailable: true });
      }
    }
  }
  async function observe(projectIds) {
    if (!Array.isArray(projectIds) || projectIds.length > 200 || projectIds.some(id => typeof id !== 'string')) throw Error('项目列表无效。');
    const currentEpoch = ++epoch, ids = [...new Set(projectIds)];
    for (const id of bindings.keys()) if (!ids.includes(id)) remove(id);
    return Promise.all(ids.map(async id => {
      try {
        const context = await owner(id);
        if (currentEpoch !== epoch) throw Error('观察范围已变化。');
        let binding = bindings.get(id);
        if (binding?.workspace !== context.workspace) { remove(id); binding = null; }
        if (!binding) {
          binding = { ...context }; bindings.set(id, binding);
          binding.handle = observer.observe(context, state => { void publish(binding, state); });
        }
        await binding.handle.ready; await binding.handle.refresh(); await assertCurrent(binding);
        if (currentEpoch !== epoch) throw Error('观察范围已变化。');
        return publicResult(binding, binding.handle.read());
      } catch (error) {
        if (currentEpoch === epoch) remove(id);
        return { project_id: id, value: null, stale: true, unavailable: true, error: error.message };
      }
    }));
  }
  async function command(action, input = {}) {
    if (action === 'observe') return observe(input.project_ids);
    if (action === 'release') { close(); return { released: true }; }
    if (!['refresh', 'fetch', 'commits', 'commit', 'diff'].includes(action)) throw Error('不支持的 Git 状态操作。');
    const binding = bindings.get(input.project_id);
    if (!binding || !input.expected_workspace || input.expected_workspace !== binding.workspace) throw Error('请先读取当前工作区。');
    await assertCurrent(binding);
    if (['commits', 'commit', 'diff'].includes(action)) {
      const data = await details.read(binding.root, action, input);
      await assertCurrent(binding);
      return { project_id: binding.project_id, workspace: binding.workspace, data };
    }
    const state = action === 'fetch' ? await binding.handle.fetch(() => assertCurrent(binding)) : await binding.handle.refresh();
    await assertCurrent(binding);
    return publicResult(binding, state);
  }
  function close() { epoch++; for (const id of [...bindings.keys()]) remove(id); observer.close(); }
  return { command, refreshAll: () => observer.refreshAll(), close,
    onEvent(listener) { events.on('event', listener); return () => events.off('event', listener); } };
}
