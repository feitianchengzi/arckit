const escape = value => String(value ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
const modeLabels = { direct: '直接发现', 'on-demand': '按需使用', disabled: '已停用' };

export function createEngineeringSurface({ root, api, navigate, chatButton }) {
  let scene = 'automation', snapshot = null, busy = false, active = false, loading = null, error = '', message = '', query = '', status = '';
  root.innerHTML = `<div class="page engineering-page"><header class="page-heading split-heading engineering-heading"><div><p class="eyebrow">ENGINEERING</p><h1>内置 Skills</h1><p>管理 ArcOrbit 随包 Skills 的场景可用性。你自行安装的 Skills 由 Codex 管理，不会显示在这里。</p></div><button class="secondary-button" data-action="back">返回 Chat</button></header>
    <section class="panel-card engineering-controls"><div class="engineering-control-row"><div class="engineering-scenes" role="tablist" aria-label="技能使用场景"><button data-scene="chat" role="tab">Chat</button><button data-scene="automation" role="tab">Automation</button></div><p data-role="scope"></p></div><div class="engineering-toolbar"><input type="search" data-role="search" aria-label="搜索内置 Skill" placeholder="搜索内置 Skill…"><select data-role="status" aria-label="使用状态"><option value="">全部状态</option><option value="direct">直接发现</option><option value="on-demand">按需使用</option><option value="disabled">已停用</option></select><button class="secondary-button" data-action="refresh">刷新</button><button class="text-button" data-action="reset">恢复默认</button></div></section>
    <section class="engineering-summary" aria-label="当前场景摘要"><article class="panel-card"><strong data-role="managed-count">—</strong><span>内置总数</span></article><article class="panel-card"><strong data-role="direct-count">—</strong><span>直接发现</span></article><article class="panel-card"><strong data-role="demand-count">—</strong><span>按需使用</span></article><article class="panel-card"><strong data-role="disabled-count">—</strong><span>已停用</span></article></section>
    <div class="engineering-status-line"><p data-role="feedback" role="status" aria-live="polite"></p><span data-role="result-count"></span></div><div data-role="errors" role="alert"></div>
    <section class="panel-card engineering-inventory" aria-label="ArcOrbit 内置 Skills"><div class="engineering-list-header" aria-hidden="true"><span>Skill</span><span>安装状态</span><span>使用方式</span></div><div data-role="skills" class="engineering-skill-list"></div></section></div>`;
  const el = name => root.querySelector(`[data-role="${name}"]`);
  async function refresh() {
    if (loading) return loading;
    loading = Promise.resolve().then(async () => {
      try { if (!api.engineeringSnapshot) throw new Error('内置 Skills 服务不可用。'); snapshot = await api.engineeringSnapshot(); error = ''; }
      catch (failure) { error = failure.message; }
    }).finally(() => { loading = null; render(); });
    render();
    return loading;
  }
  async function mutate(action) {
    if (busy) return;
    busy = true; error = ''; message = ''; render();
    try { const result = await action(); if (result) { snapshot = result; message = scene === 'chat' ? '已保存；下一条 Chat 消息使用新配置。' : '已保存；下一次 Automation 运行使用新配置。'; } }
    catch (failure) { error = failure.message; }
    finally { busy = false; render(); }
  }
  const save = changes => mutate(() => api.engineeringUpdate({ scene, expectedRevision: snapshot.revision, changes }));
  function render() {
    root.setAttribute('aria-busy', String(busy || Boolean(loading)));
    root.querySelectorAll('[data-scene]').forEach(button => { const selected = button.dataset.scene === scene; button.setAttribute('aria-selected', String(selected)); button.classList.toggle('is-active', selected); button.disabled = busy; });
    root.querySelectorAll('[data-action]').forEach(button => { button.disabled = busy || (Boolean(loading) && ['reset', 'refresh'].includes(button.dataset.action)); });
    el('scope').textContent = scene === 'chat'
      ? '下一条消息生效；既有对话历史保持不变。'
      : '下一次运行生效；当前运行保持启动时配置。';
    const current = snapshot?.scenes?.find(x => x.id === scene);
    el('managed-count').textContent = current?.managedCount ?? '—';
    el('direct-count').textContent = current?.enabledCount ?? '—';
    el('demand-count').textContent = current?.onDemandCount ?? '—';
    el('disabled-count').textContent = current?.disabledCount ?? '—';
    el('feedback').textContent = message || (snapshot ? `配置版本 ${snapshot.revision} · 安装内容 ${snapshot.catalogVersion || '已验证'}` : '正在读取内置 Skills…');
    el('errors').innerHTML = [error].filter(Boolean).map(text => `<p class="engineering-error">${escape(text)}</p>`).join('');
    if (chatButton && snapshot) chatButton.textContent = `内置 Skills · ${snapshot.scenes.find(x => x.id === 'chat')?.managedCount || 0}`;
    renderList();
  }
  function renderList() {
    const normalizedQuery = query.trim().toLowerCase();
    const skills = (snapshot?.skills || []).filter(x => x.source === 'builtin').filter(x => {
      const mode = x.modes?.[scene] || (x.enabled?.[scene] ? 'direct' : 'disabled');
      return (!status || mode === status) && `${x.name} ${x.description}`.toLowerCase().includes(normalizedQuery);
    });
    el('result-count').textContent = snapshot ? `显示 ${skills.length} / ${(snapshot.skills || []).filter(x => x.source === 'builtin').length}` : '';
    el('skills').innerHTML = skills.map(skill => {
      const locked = skill.protected && scene === 'automation';
      const currentMode = skill.modes?.[scene] || (skill.enabled?.[scene] ? 'direct' : 'disabled');
      const modes = [['direct','直接发现'],['on-demand','按需使用'],['disabled','停用']].filter(([mode]) => mode !== 'on-demand' || (skill.qualifiedName && skill.name !== 'arcforge-on-demand'));
      return `<article class="engineering-skill" data-skill="${escape(skill.id)}"><div class="engineering-skill-main"><div class="engineering-skill-heading"><h2>${escape(skill.name)}</h2>${skill.protected ? `<span class="engineering-core">${scene === 'automation' ? '核心锁定' : '官方核心'}</span>` : ''}</div><p>${escape(skill.description)}</p><details><summary>安装路径</summary><code>${escape(skill.path)}</code></details></div><div class="engineering-install-state"><span class="status-pill ${skill.available ? 'success' : 'blocked'}">${skill.available ? '已安装' : '需修复'}</span>${!skill.available ? `<small class="engineering-error">${escape(skill.error)}</small>` : ''}</div><label class="engineering-skill-mode"><span class="sr-only">${escape(skill.name)} 使用方式</span><select data-mode="${escape(skill.id)}" aria-label="${escape(skill.name)} 使用方式" ${busy || locked ? 'disabled' : ''}>${modes.map(([mode,label]) => `<option value="${mode}" ${currentMode === mode ? 'selected' : ''} ${!skill.available && mode !== 'disabled' ? 'disabled' : ''}>${label}</option>`).join('')}</select>${locked ? '<small>Automation 必需</small>' : `<small>${escape(modeLabels[currentMode] || currentMode)}</small>`}</label></article>`;
    }).join('') || `<div class="engineering-empty">${snapshot ? '没有匹配的内置 Skill。' : '读取中…'}${snapshot ? '<button class="text-button" data-action="clear-filters" type="button">清除筛选</button>' : ''}</div>`;
  }
  root.addEventListener('input', event => { if (event.target === el('search')) { query = event.target.value; renderList(); } });
  root.addEventListener('change', event => {
    if (event.target === el('status')) { status = event.target.value; renderList(); }
    if (event.target.dataset.mode) save([{ id: event.target.dataset.mode, mode: event.target.value }]);
  });
  root.addEventListener('click', event => {
    const button = event.target.closest('button'); if (!button || busy) return;
    if (button.dataset.scene) { scene = button.dataset.scene; message = ''; render(); return; }
    if (button.dataset.action === 'back') navigate('chat');
    if (button.dataset.action === 'refresh') refresh();
    if (button.dataset.action === 'reset' && snapshot) mutate(() => api.engineeringUpdate({ scene, expectedRevision: snapshot.revision, reset: true }));
    if (button.dataset.action === 'clear-filters') { query = ''; status = ''; el('search').value = ''; el('status').value = ''; renderList(); }
  });
  chatButton?.addEventListener('click', () => { scene = 'chat'; message = ''; navigate('engineering'); refresh(); });
  api.onEngineeringEvent?.(value => { snapshot = value; render(); });
  render();
  return { show(value, chatVisible = false) { if ((value && !active) || (chatVisible && !snapshot && !loading)) refresh(); active = value; }, refresh, getScene: () => scene };
}
