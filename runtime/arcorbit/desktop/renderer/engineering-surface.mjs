const escape = value => String(value ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
const sources = { builtin: 'ArcOrbit 内置', user: '用户技能', project: '项目技能', 'on-demand': 'ArcForge catalog', local: '本地目录' };

export function createEngineeringSurface({ root, api, navigate, chatButton }) {
  let scene = 'automation', snapshot = null, busy = false, active = false, loading = null, error = '', message = '', query = '', source = '';
  root.innerHTML = `<div class="page engineering-page"><header class="page-heading split-heading"><div><p class="eyebrow">ENGINEERING</p><h1>场景技能</h1><p>决定 Agent 在不同场景中可以使用哪些技能。</p></div><button class="secondary-button" data-action="back">返回 Chat</button></header>
    <section class="panel-card engineering-controls"><div class="engineering-scenes" role="tablist" aria-label="技能使用场景"><button data-scene="chat" role="tab">Chat</button><button data-scene="automation" role="tab">Automation</button></div><p data-role="scope"></p><div class="engineering-toolbar"><input type="search" data-role="search" aria-label="搜索技能" placeholder="搜索名称或说明…"><select data-role="source" aria-label="技能来源"><option value="">全部来源</option>${Object.entries(sources).map(([key, label]) => `<option value="${key}">${label}</option>`).join('')}</select><button class="secondary-button" data-action="import">添加本地技能</button><button class="secondary-button" data-action="refresh">刷新</button><button class="text-button" data-action="reset">恢复场景默认</button></div></section>
    <p data-role="feedback" role="status" aria-live="polite"></p><div data-role="errors" role="alert"></div><div data-role="skills" class="engineering-skill-list"></div>
    <dialog data-role="replace"><form method="dialog"><h2>替换技能</h2><p>替换仅改变当前场景，不修改技能文件。</p><select data-role="replacement" aria-label="替换为"></select><div class="engineering-dialog-actions"><button value="cancel" class="secondary-button">取消</button><button value="replace" class="primary-button">替换</button></div></form></dialog></div>`;
  const el = name => root.querySelector(`[data-role="${name}"]`);
  async function refresh() {
    if (loading) return loading;
    loading = Promise.resolve().then(async () => {
      try { if (!api.engineeringSnapshot) throw new Error('场景技能服务不可用。'); snapshot = await api.engineeringSnapshot(); error = ''; }
      catch (failure) { error = failure.message; }
    }).finally(() => { loading = null; render(); });
    render();
    return loading;
  }
  async function mutate(action) {
    if (busy) return;
    busy = true; error = ''; render();
    try { const result = await action(); if (result) { snapshot = result; message = scene === 'chat' ? '已保存，下一条 Chat 消息使用新配置。' : '已保存，下一次 Automation 运行使用新配置。'; } }
    catch (failure) { error = failure.message; }
    finally { busy = false; render(); }
  }
  const save = changes => mutate(() => api.engineeringUpdate({ scene, expectedRevision: snapshot.revision, changes }));
  function render() {
    root.setAttribute('aria-busy', String(busy || Boolean(loading)));
    root.querySelectorAll('[data-scene]').forEach(button => { const selected = button.dataset.scene === scene; button.setAttribute('aria-selected', String(selected)); button.classList.toggle('is-active', selected); button.disabled = busy; });
    root.querySelectorAll('[data-action]').forEach(button => { button.disabled = busy || (Boolean(loading) && ['import', 'reset', 'refresh'].includes(button.dataset.action)); });
    el('scope').textContent = scene === 'chat'
      ? '本机所有 Chat · 默认提供按需入口，其他内置技能按需使用。关闭技能不会清除已有对话历史；需要全新上下文时请新建会话。'
      : '本机所有 Automation · 核心 Loop 固定直接发现。Agent 根据每轮 Gap 选择技能；当前运行保持启动时的配置。';
    const current = snapshot?.scenes.find(x => x.id === scene);
    const count = current?.enabledCount || 0;
    const inherited = current?.inheritedCount || 0;
    el('feedback').textContent = message || (snapshot ? `直接发现 ${count} 个技能 · 按需 ${current?.onDemandCount || 0} 个${inherited ? ` · ${inherited} 个原生技能沿用 Codex 状态` : ''} · 配置版本 ${snapshot.revision}` : '正在读取技能…');
    el('errors').innerHTML = [error, ...(snapshot?.errors || []).map(x => `${x.path}：${x.message}`)].filter(Boolean).map(text => `<p class="engineering-error">${escape(text)}</p>`).join('');
    if (chatButton && snapshot) chatButton.textContent = `技能 · ${snapshot.scenes.find(x => x.id === 'chat')?.enabledCount || 0}`;
    renderList();
  }
  function renderList() {
    const skills = (snapshot?.skills || []).filter(x => (!source || x.source === source) && `${x.name} ${x.description}`.toLowerCase().includes(query.toLowerCase()));
    el('skills').innerHTML = skills.map(skill => {
      const locked = skill.protected && (scene === 'automation' || skill.source !== 'builtin');
      return `<article class="panel-card engineering-skill" data-skill="${escape(skill.id)}"><div class="engineering-skill-main"><div class="engineering-skill-heading"><h2>${escape(skill.name)}</h2><span class="status-pill">${escape(sources[skill.source])}</span>${skill.protected ? `<span class="engineering-core">${skill.source === 'builtin' ? '核心 · 官方版本' : '同名核心不可替换'}</span>` : ''}</div><p>${escape(skill.description)}</p><details><summary>来源路径</summary><code>${escape(skill.path)}</code></details>${!skill.available ? `<p class="engineering-error">${escape(skill.error)}</p>` : ''}</div><div class="engineering-skill-actions"><label><span>使用方式</span><select data-mode="${escape(skill.id)}" aria-label="${escape(skill.name)} 使用方式" ${busy || locked ? 'disabled' : ''}>${[['direct','直接发现'],['on-demand','按需使用'],['disabled','禁用']].filter(([mode]) => mode !== 'on-demand' || (skill.qualifiedName && skill.name !== 'arcforge-on-demand')).map(([mode,label]) => `<option value="${mode}" ${(skill.modes?.[scene] || (skill.enabled[scene] ? 'direct' : 'disabled')) === mode ? 'selected' : ''} ${!skill.available && mode !== 'disabled' ? 'disabled' : ''}>${label}</option>`).join('')}</select></label>${!skill.protected && skill.enabled[scene] ? `<button class="text-button" data-replace="${escape(skill.id)}" ${busy ? 'disabled' : ''}>替换</button>` : ''}</div></article>`;
    }).join('') || `<div class="panel-card engineering-empty">${snapshot ? '没有匹配的技能。可以调整筛选或添加本地技能。' : '读取中…'}</div>`;
  }
  root.addEventListener('input', event => { if (event.target === el('search')) { query = event.target.value; renderList(); } });
  root.addEventListener('change', event => {
    if (event.target === el('source')) { source = event.target.value; renderList(); }
    if (event.target.dataset.mode) save([{ id: event.target.dataset.mode, mode: event.target.value }]);
  });
  root.addEventListener('click', event => {
    const button = event.target.closest('button'); if (!button || busy) return;
    if (button.dataset.scene) { scene = button.dataset.scene; message = ''; render(); return; }
    if (button.dataset.replace) {
      const candidates = snapshot.skills.filter(x => x.id !== button.dataset.replace && !x.protected && x.available && !x.enabled[scene]);
      if (!candidates.length) { error = '没有可替换的技能，请先添加本地技能。'; render(); return; }
      el('replace').dataset.original = button.dataset.replace;
      el('replacement').innerHTML = candidates.map(x => `<option value="${escape(x.id)}">${escape(x.name)} · ${escape(sources[x.source])}</option>`).join('');
      el('replace').showModal(); return;
    }
    if (button.dataset.action === 'back') navigate('chat');
    if (button.dataset.action === 'refresh') refresh();
    if (button.dataset.action === 'import') mutate(() => api.engineeringImport());
    if (button.dataset.action === 'reset' && snapshot) mutate(() => api.engineeringUpdate({ scene, expectedRevision: snapshot.revision, reset: true }));
  });
  el('replace').addEventListener('close', () => { if (el('replace').returnValue === 'replace') save([{ id: el('replace').dataset.original, enabled: false }, { id: el('replacement').value, enabled: true }]); });
  chatButton?.addEventListener('click', () => { scene = 'chat'; message = ''; navigate('engineering'); refresh(); });
  api.onEngineeringEvent?.(value => { snapshot = value; render(); });
  render();
  return { show(value, chatVisible = false) { if ((value && !active) || (chatVisible && !snapshot && !loading)) refresh(); active = value; }, refresh, getScene: () => scene };
}
