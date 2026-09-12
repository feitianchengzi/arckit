// A single project/account owns this operation; a confirmed write is never retried.
export function createMemberAddFlow({ execute, refresh, isCurrent, changed = () => {}, projectId, accountId }) {
  const state = { phase: 'loading', candidates: [], members: [], selected: '', message: '', busy: false };
  let alive = true;
  const current = () => alive && isCurrent();
  const publish = () => { if (current()) changed(state); };
  const input = { project_id: projectId, account_id: accountId };
  async function load() {
    if (state.busy || !current()) return;
    state.busy = true; publish();
    try {
      const result = await execute('project.member.candidates', input);
      if (!current()) return;
      if (result.status !== 'ready') throw new Error(result.error?.message || '候选加载失败，请重试。');
      state.candidates = result.candidates; state.members = result.members;
      if (!state.candidates.some((m) => m.id === state.selected && !state.members.some((p) => p.user_id === m.user_id))) state.selected = '';
      state.phase = 'ready'; state.message = '';
    } catch (error) { if (current()) { state.phase = 'load_failed'; state.message = error.message; } }
    finally { state.busy = false; publish(); }
  }
  async function sync() {
    try {
      await refresh(current);
      if (current()) { state.phase = 'done'; state.message = '成员已加入，项目成员已刷新。'; }
    } catch { if (current()) { state.phase = 'sync_failed'; state.message = '成员已加入，列表同步失败。请重试刷新，无需再次添加。'; } }
  }
  async function submit() {
    if (state.busy || !current()) return;
    if (state.phase === 'done') return;
    if (state.phase === 'ready' && !state.selected) return;
    state.busy = true; publish();
    try {
      if (state.phase === 'sync_failed') { await sync(); return; }
      if (state.phase === 'unknown') {
        const result = await execute('project.member.candidates', input);
        if (!current()) return;
        if (result.status !== 'ready') { state.message = '结果仍不明确，请重新核对。'; return; }
        const target = state.candidates.find((m) => m.id === state.selected);
        if (target && result.members.some((m) => m.user_id === target.user_id)) { await sync(); return; }
        state.candidates = result.candidates; state.members = result.members;
        state.phase = 'ready';
        if (!state.candidates.some((m) => m.id === state.selected)) state.selected = '';
        state.message = '未发现目标成员。可重新选择并重试添加；重复请求不会新增重复成员。';
        return;
      }
      if (state.phase !== 'ready') return;
      const result = await execute('project.member.add', { ...input, organization_member_id: state.selected });
      if (!current()) return;
      if (result.status === 'completed') { await sync(); return; }
      state.phase = result.outcome_unknown ? 'unknown' : 'load_failed';
      state.message = result.outcome_unknown ? '请求结果不明，请先核对项目成员。' : result.error?.message || '添加失败，请刷新候选后重试。';
    } catch { if (current()) { state.phase = 'unknown'; state.message = '连接中断，请先核对项目成员。'; } }
    finally { state.busy = false; publish(); }
  }
  return { state, load, submit, select(id) { if (!state.busy && state.phase === 'ready') { state.selected = state.candidates.some((m) => m.id === id && !state.members.some((p) => p.user_id === m.user_id)) ? id : ''; publish(); } }, close() { alive = false; } };
}

export function openMemberAddSheet({ project, organization, accountId, execute, refresh, isCurrent }) {
  const previousFocus = [...document.querySelectorAll("[data-project-member-add]")].find((button) => button.dataset.projectMemberAdd === String(project.id)) || document.activeElement;
  const overlay = document.createElement('div');
  overlay.className = 'modal-overlay'; overlay.dataset.memberAdd = '';
  const panel = document.createElement('section'); panel.className = 'platform-action-panel';
  panel.setAttribute('role', 'dialog'); panel.setAttribute('aria-modal', 'true'); panel.setAttribute('aria-label', '从组织添加成员');
  const title = document.createElement('h2'); title.textContent = `从组织添加成员 · ${project.name}`;
  const context = document.createElement('p'); context.dataset.memberAddContext = '';
  context.textContent = `组织：${organization?.name || project.organization_id} · 项目：${project.name}`;
  const selection = document.createElement('p'); selection.dataset.memberAddSelection = ''; selection.setAttribute('aria-live', 'polite');
  const lead = document.createElement('p'); lead.textContent = '选择同组织的一位成员，加入后的项目角色为 member。';
  const label = document.createElement('label'); label.className = 'platform-action-field'; label.textContent = '搜索组织成员';
  const search = document.createElement('input'); search.type = 'search'; search.placeholder = '姓名'; label.append(search);
  const list = document.createElement('div'); list.className = 'compact-list';
  const status = document.createElement('p'); status.setAttribute('role', 'status'); status.setAttribute('aria-live', 'polite');
  const actions = document.createElement('div'); actions.className = 'settings-actions';
  const cancel = document.createElement('button'); cancel.type = 'button'; cancel.className = 'secondary-button'; cancel.textContent = '关闭';
  const confirm = document.createElement('button'); confirm.type = 'button'; confirm.className = 'primary-button';
  actions.append(cancel, confirm); panel.append(title, context, lead, label, list, selection, status, actions); overlay.append(panel); document.body.append(overlay);
  let flow;
  function render(s) {
    const selected = s.candidates.find((member) => member.id === s.selected);
    selection.textContent = selected ? `已选择：${selected.username || '未命名成员'}（用户 ${selected.user_id}）` : '尚未选择成员';
    status.textContent = s.busy ? (s.phase === 'loading' ? '正在加载组织成员…' : '正在等待服务器确认…') : s.message;
    search.disabled = s.busy || s.phase !== 'ready';
    confirm.textContent = s.phase === 'unknown' ? '核对项目成员' : s.phase === 'sync_failed' ? '重试刷新' : ['loading', 'load_failed'].includes(s.phase) ? '重新加载' : s.phase === 'done' ? '已完成' : '添加成员';
    confirm.disabled = s.busy || s.phase === 'done' || (s.phase === 'ready' && !s.selected);
    const focusedMember = list.contains(document.activeElement) ? document.activeElement.value : null;
    list.replaceChildren();
    const visible = s.candidates.filter((m) => m.username.toLocaleLowerCase().includes(search.value.trim().toLocaleLowerCase()));
    for (const member of visible) {
      const row = document.createElement('label'); row.className = 'compact-row';
      const radio = document.createElement('input'); radio.type = 'radio'; radio.name = 'organization_member_id'; radio.value = member.id;
      const joined = s.members.some((m) => m.user_id === member.user_id);
      radio.disabled = joined || s.busy || s.phase !== 'ready'; radio.checked = s.selected === member.id;
      radio.addEventListener('change', () => flow.select(member.id));
      const text = document.createElement('span'); text.textContent = `${member.username || '未命名成员'} · ${member.role}${joined ? ' · 已加入' : ''}`;
      row.append(radio, text); list.append(row);
    }
    if (focusedMember) [...list.querySelectorAll("input")].find((input) => input.value === focusedMember && !input.disabled)?.focus();
    if (!visible.length && !s.busy) { const empty = document.createElement('p'); empty.textContent = s.candidates.length ? '没有匹配的组织成员。' : '没有可选组织成员。'; list.append(empty); }
  }
  flow = createMemberAddFlow({ projectId: String(project.id), accountId, execute, refresh, isCurrent, changed: render });
  const close = () => { flow.close(); overlay.remove(); if (previousFocus?.isConnected) previousFocus.focus(); else [...document.querySelectorAll("[data-project-member-add]")].find((button) => button.dataset.projectMemberAdd === String(project.id))?.focus(); };
  cancel.addEventListener('click', close);
  search.addEventListener('input', () => render(flow.state));
  confirm.addEventListener('click', () => ['loading', 'load_failed'].includes(flow.state.phase) ? flow.load() : flow.submit());
  overlay.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') { event.stopPropagation(); close(); }
    if (event.key === 'Tab') {
      const focusable = [...panel.querySelectorAll('input:not(:disabled), button:not(:disabled)')];
      const first = focusable[0], last = focusable.at(-1);
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last?.focus(); }
      else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first?.focus(); }
    }
  });
  render(flow.state); cancel.focus(); void flow.load();
  return close;
}
