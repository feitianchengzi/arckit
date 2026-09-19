(() => {
  const M = window.ChatModel;
  const esc = value => String(value ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const icon = () => '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" aria-hidden="true"><path d="M4 4h6v6H4zM14 4h6v6h-6zM4 14h6v6H4zM14 14h6v6h-6z"/></svg>';
  const btn = (action, label, extra = '') => `<button type="button" data-chat-action="${action}" ${extra}>${label}</button>`;
  const labels = { starting: '正在启动', running: '正在回答', waiting_approval: '等待批准', interrupting: '正在停止', interrupted: '已中断', failed: '失败', completed: '已完成' };
  const paragraph = value => esc(value).replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>').replace(/\n/g, '<br>');
  function content(text) {
    return window.ChatMarkdown(text).replace(/<pre>/g, `<div class="code-block">${btn('copy', '复制代码')}<pre>`).replace(/<\/pre>/g, '</pre></div>').replace(/<table>/g,'<div class="chat-table"><table>').replace(/<\/table>/g,'</table></div>');
  }
  function sidebar() {
    return `<aside class="sidebar"><a class="brand" href="../platform-workspace/default.html"><span class="brand-mark">a</span><strong>ArcOrbit</strong></a><nav class="page-navigation" aria-label="主导航"></nav><div class="sidebar-bottom"><div class="connection">${M.state.offline ? '连接中断' : '已保存到此设备'}</div><button class="account-bottom account-trigger" type="button" data-account-open aria-label="个人中心：账户与 Runtime"><span class="avatar">G</span><span>Glare<small>Workshop 账户</small></span>${icon()}</button></div></aside>`;
  }
  function groups() {
    return M.state.projects.map(p => ({ ...p, items: M.state.sessions.filter(s => s.project === p.id).sort((a, b) => b.updated - a.updated || a.id.localeCompare(b.id)) }))
      .filter(p => p.items.length).sort((a, b) => b.items[0].updated - a.items[0].updated || a.name.localeCompare(b.name)).map(p => {
        const full = M.state.expanded[p.id] || p.items.findIndex(s => s.id === M.state.selected) >= 10;
        return `<section class="session-group"><h2><span>${esc(p.name)}${p.ready ? '' : ' · 不可用'}</span><small>${p.items.length}</small></h2>${(full ? p.items : p.items.slice(0, 10)).map(s => `<button type="button" class="session-row ${s.id === M.state.selected ? 'selected' : ''}" data-chat-action="select" data-id="${s.id}" aria-current="${s.id === M.state.selected}" title="${esc(s.title)}"><strong>${esc(s.title)}</strong><small>${labels[s.status]} · ${new Date(s.updated).toLocaleTimeString('zh-CN',{hour:'2-digit',minute:'2-digit'})}${s.unread ? ` · ${s.unread} 条新内容` : ''}</small></button>`).join('')}${p.items.length > 10 ? btn('history', full ? '收起历史会话' : `查看历史会话（其余 ${p.items.length - 10} 个）`, `data-project="${p.id}" aria-expanded="${!!full}"`) : ''}</section>`;
      }).join('') || '<p class="list-empty">暂无历史会话，从新建对话开始。</p>';
  }
  function messages(s) {
    if (!s) return '<div class="chat-empty"><h2>从一个问题开始</h2><p>选择工作区，与 Codex 讨论目标、实现或新的想法。</p></div>';
    return s.messages.map((m, i) => `<article class="chat-message ${m.role}" data-message="${i}"><div class="message-byline"><strong>${m.role === 'user' ? '你' : 'Codex'}</strong>${m.streaming ? '<span>正在回答</span>' : ''}</div>${content(m.text)}${m.reasoning ? `<details data-disclosure="${i}"><summary>分析摘要</summary><p>${paragraph(m.reasoning)}</p></details>` : ''}${m.tool ? `<details data-disclosure="tool-${i}"><summary>${esc(m.tool)}</summary><p>操作结果保留在当前会话中。</p></details>` : ''}</article>`).join('') +
      (s.status === 'waiting_approval' ? `<section class="chat-approval"><h3>需要允许执行命令</h3><p><code>npm run check</code> · ${esc(M.project(s.project).name)} · 本 turn</p><div>${btn('reject', '拒绝')}${btn('approve', '允许本次')}</div></section>` : '') +
      (s.error ? `<section class="chat-error"><p>${esc(s.error)}</p>${s.status === 'failed' ? btn('retry', '重试') + btn('edit-retry', '编辑后发送') : ''}</section>` : '');
  }
  function center() {
    const s = M.current(), o = M.owner(), p = M.project(o.project), active = M.active(s);
    return `<section class="chat-center" aria-label="Chat 对话"><header class="chat-heading"><div><h1>${esc(s?.title || '新对话')}</h1>${s ? `<p>${esc(p?.name)} · 固定工作区</p>` : `<label>会话属于 <select id="chat-project" aria-label="新会话所属项目"><option value="">选择工作区</option>${M.state.projects.filter(p => p.ready).map(p => `<option value="${p.id}" ${o.project === p.id ? 'selected' : ''}>${esc(p.name)}</option>`).join('')}</select></label>`}</div>${s ? `<div class="chat-heading-actions">${btn('rename', '重命名')}${btn('delete', '删除')}</div>` : ''}</header>
      <div class="chat-thread" tabindex="0" aria-label="消息记录"><div class="chat-reading">${messages(s)}</div></div>
      ${s && !s.follow ? btn('latest', `回到最新${s.unread ? ` · ${s.unread}` : ''}`, 'class="chat-latest"') : ''}
      <div class="chat-compose-wrap">${!p?.ready ? `<div class="workspace-blocked"><p>需要本地目录与可用的项目环境，草稿会保留。</p>${btn('bind', '选择项目并绑定本地目录')}</div>` : ''}<form id="chat-compose" class="chat-composer"><textarea id="chat-input" aria-label="发送给 Codex" placeholder="${active ? '可以继续编辑下一条草稿…' : '输入问题，或继续当前讨论…'}" rows="3">${esc(o.draft)}</textarea><div class="chat-compose-controls"><label>Model<input id="chat-model" maxlength="200" list="chat-model-options" value="${esc(o.model)}"></label><label>Level<input id="chat-level" maxlength="200" list="chat-level-options" value="${esc(o.level)}"></label><a href="../engineering-profile/default.html" target="_blank" rel="noopener">技能</a>${active ? btn('stop', s.status === 'interrupting' ? '正在停止…' : '停止', s.status === 'interrupting' ? 'disabled' : '') : `<button type="submit" class="primary" ${!o.draft.trim() || !p?.ready ? 'disabled' : ''}>发送</button>`}</div><datalist id="chat-model-options">${M.state.catalogUnavailable ? '' : '<option value="gpt-6-astra"></option>'}</datalist><datalist id="chat-level-options">${!M.state.catalogUnavailable && o.model === 'gpt-6-astra' ? ['low','medium','high','xhigh','max','ultra'].map(v => `<option value="${v}"></option>`).join('') : ''}</datalist><p class="chat-compose-note">${esc(p?.name || '尚未选择工作区')} · Enter 发送，Shift + Enter 换行${M.state.catalogUnavailable ? ' · 清单不可用，可手动输入' : ''}</p></form></div></section>`;
  }
  function render() {
    document.getElementById('chat-app').innerHTML = `<div class="app-shell project-desk chat-shell">${sidebar()}<main class="workspace"><header class="topbar"><strong>Chat</strong><div class="top-actions">${btn('toggle-list', '会话列表', 'class="chat-list-toggle" aria-controls="chat-sessions" aria-expanded="' + !!M.state.listOpen + '"')}<span class="chat-connection">${M.state.offline ? '连接中断' : 'Codex 已连接'}</span>${M.state.offline ? btn('refresh', '重试同步') : ''}</div></header><div class="chat-layout ${M.state.listOpen ? 'list-open' : ''}">${center()}<aside id="chat-sessions" class="chat-sessions" aria-label="会话列表"><header><h2>会话</h2>${btn('toggle-list', '关闭', 'class="chat-list-close" aria-label="关闭会话列表"')}</header><div class="session-groups">${groups()}</div><footer>${btn('new', '＋ 新建对话', 'class="primary"')}</footer></aside></div></main></div>`;
  }
  window.ChatViews = { render, esc, btn, icon, page: 'Chat' };
  window.NavigationHost = window.ChatViews;
})();
