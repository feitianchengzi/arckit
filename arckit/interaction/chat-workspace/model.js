/* Isolated fixtures: no Codex, filesystem or remote business commands. */
(() => {
  const query = new URLSearchParams(location.search);
  const key = 'arcorbit-interaction-chat-v1' + (query.get('scenarioTools') === 'on' ? '-scenarios' : '');
  const session = (id, project, title, time) => ({ id, project, title, created: time, updated: time, thread: 'chat-thread-' + id,
    model: 'gpt-6-astra', level: 'high', draft: '', status: 'completed', scroll: null, follow: true, unread: 0,
    messages: [{ role: 'user', text: title }, { role: 'assistant', text: '我们可以先明确目标与边界，再根据当前项目的实际情况继续讨论。\n\n你可以补充约束，也可以让我检查相关实现。' }] });
  const initial = () => ({ version: 1, selected: 'a1', expanded: {}, offline: false, failNext: false, catalogUnavailable: false,
    projects: [{ id: 'atlas', name: 'ArcOrbit', path: '/Projects/atlas', ready: true }, { id: 'borealis', name: 'Feedback', path: '/Projects/borealis', ready: true }],
    sessions: [...Array.from({ length: 12 }, (_, i) => session('a' + (i + 1), 'atlas', ['认证边界怎么收敛？', '部署策略中的回滚边界', '整理新人开发流程'][i] || `项目讨论 ${i + 1}`, Date.now() - i * 3600000)), session('b1', 'borealis', '缓存策略比较', Date.now() - 22 * 3600000)],
    newDraft: { project: 'atlas', draft: '', model: 'gpt-6-astra', level: 'high' }, tasks: [] });
  let state;
  try { state = JSON.parse(localStorage.getItem(key)); } catch {}
  if (state?.version !== 1 || !Array.isArray(state.sessions)) state = initial();
  if (!window.GlobalContext) for (const s of state.sessions) if (['running', 'starting', 'waiting_approval', 'interrupting'].includes(s.status)) { s.status = 'interrupted'; s.error = '应用退出时中断；发送新的要求可继续。'; }
  state.collapsed ||= {}; state.limits ||= {};
  for (const s of state.sessions) s.created ??= s.updated;
  function save() { try { localStorage.setItem(key, JSON.stringify(state)); } catch { state.storageError = '本地保存失败，请保留输入后重试。'; } }
  const current = () => state.sessions.find(s => s.id === state.selected);
  const owner = () => current() || state.newDraft;
  const project = id => state.projects.find(p => p.id === id);
  const active = s => s && ['starting', 'running', 'waiting_approval', 'interrupting'].includes(s.status);
  function writable() { if (state.offline) throw Error('连接中断，草稿与已有内容已保留。'); if (state.failNext) { state.failNext = false; throw Error('提交失败，输入已保留，请重试。'); } }
  function send() {
    writable(); let s = current(), o = owner();
    if (active(s)) return;
    if (!o.draft.trim()) return;
    if (window.GlobalContext && !GlobalContext.includes(({atlas:'orbit',borealis:'feedback'})[o.project]||o.project)) throw Error('请在当前产品范围内选择工作区。');
    if (!project(o.project)?.ready) throw Error('需要先绑定本地目录并检查项目环境。');
    if (!o.model.trim() || !o.level.trim()) throw Error('请填写 Model 和 Level。');
    if (!s) {
      const id = crypto.randomUUID(); s = { ...session(id, o.project, o.draft.trim().slice(0, 64), Date.now()), ...o, id, messages: [] };
      state.sessions.push(s); state.selected = s.id; state.newDraft = { ...o, draft: '' };
    }
    s.messages.push({ role: 'user', text: s.draft.trim() }, { role: 'assistant', text: '', streaming: true });
    s.lastInput = s.draft.trim(); s.draft = ''; s.status = 'starting'; s.error = ''; s.step = 0; s.updated = Date.now();
    s.turnConfig = { model: s.model, level: s.level }; save(); return s;
  }
  function tick() {
    let changed = false;
    for (const s of state.sessions) {
      if (s.status === 'interrupting') { s.status = 'interrupted'; s.messages.at(-1).streaming = false; changed = true; continue; }
      if (!['starting', 'running'].includes(s.status)) continue;
      if (state.offline) { s.status = 'failed'; s.error = '连接中断。可重试或编辑后发送。'; changed = true; continue; }
      s.status = 'running'; s.step++; changed = true;
      const chunks = ['我会先沿着当前工作区的上下文梳理这个问题。', '\n\n先明确输入、责任边界与预期结果，再检查相关实现和已有约定。', '\n\n你可以继续补充要求；这段讨论会保留在当前会话中。'];
      s.messages.at(-1).text += chunks[s.step - 1] || '';
      if (s.step >= chunks.length) { s.status = 'completed'; s.messages.at(-1).streaming = false; }
      if (!s.follow || s.id !== state.selected) s.unread++;
    }
    if (changed) save(); return changed;
  }
  function reset() { state = initial(); save(); }
  window.ChatModel = { key, get state() { return state; }, current, owner, project, active, save, writable, send, tick, reset };
  window.AccountHost = window.ChatModel;
})();
