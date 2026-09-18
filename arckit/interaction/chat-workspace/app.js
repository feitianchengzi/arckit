(() => {
  const M = window.ChatModel, V = window.ChatViews, { esc, btn } = V;
  const dialog = document.getElementById('chat-dialog');
  let resizeDrag = null;
  let composing = false, noticeTimer, returnFocus, listScroll = 0;
  function notice(text) { document.getElementById('chat-notice').textContent = text; clearTimeout(noticeTimer); noticeTimer = setTimeout(() => document.getElementById('chat-notice').textContent = '', 4000); }
  function capture() {
    const thread = document.querySelector('.chat-thread'), s = M.current();
    if (thread && s) { s.scroll = thread.scrollTop; s.follow = thread.scrollHeight - thread.clientHeight - thread.scrollTop < 45; }
    listScroll = document.querySelector('.session-groups')?.scrollTop || 0;
  }
  function render({ capturePosition = true } = {}) {
    if (composing || resizeDrag) return;
    if (capturePosition) capture();
    const active = document.activeElement;
    const field = active?.matches('#chat-input,#chat-model,#chat-level') ? { id: active.id, start: active.selectionStart, end: active.selectionEnd } : null;
    const action = active?.dataset.chatAction ? { name: active.dataset.chatAction, id: active.dataset.id, project: active.dataset.project } : null;
    const disclosures = [...document.querySelectorAll('[data-disclosure][open]')].map(el => el.dataset.disclosure);
    V.render();
    const s = M.current(), thread = document.querySelector('.chat-thread');
    if (s) thread.scrollTop = s.follow || s.scroll === null ? thread.scrollHeight : s.scroll;
    document.querySelector('.session-groups').scrollTop = listScroll;
    for (const id of disclosures) document.querySelector(`[data-disclosure="${id}"]`)?.setAttribute('open','');
    if (M.state.listOpen && innerWidth <= 760) document.querySelector('.chat-center').inert = true;
    if (!dialog.open && !document.getElementById('account-dialog')?.open) {
      if (field) { const node = document.getElementById(field.id); node?.focus(); if (node && field.start !== null) node.setSelectionRange(field.start, field.end); }
      else if (action) [...document.querySelectorAll('[data-chat-action]')].find(el => el.dataset.chatAction === action.name && el.dataset.id === action.id && el.dataset.project === action.project)?.focus({ preventScroll: true });
    }
    M.save();
  }
  function select(id) {
    capture(); M.state.selected = id; M.state.listOpen = false;
    if (M.current()) M.current().unread = 0;
    render({ capturePosition: false }); document.getElementById('chat-input').focus({ preventScroll: true });
  }
  function close() {
    dialog.close(); dialog.innerHTML = '';
    if (returnFocus?.isConnected) returnFocus.focus();
    else document.getElementById('chat-input')?.focus({ preventScroll: true });
  }
  function open(title, body, submit, form) {
    returnFocus = document.activeElement;
    dialog.innerHTML = `<form data-chat-form="${form}"><h2 id="chat-dialog-title">${title}</h2>${body}<p role="alert"></p><footer>${btn('close','取消')}<button type="submit" class="primary">${submit}</button></footer></form>`;
    dialog.showModal(); (dialog.querySelector('input,select') || dialog.querySelector('button')).focus();
  }
  function send() {
    try { const s = M.send(); if (s) { s.follow = true; render({ capturePosition: false }); document.getElementById('chat-input').focus(); } }
    catch (error) { notice(error.message); M.save(); }
  }
  function tick() { capture(); if (M.tick()) render({ capturePosition: false }); }
  function toggleList() {
    M.state.listOpen = !M.state.listOpen; render();
    if (M.state.listOpen) document.querySelector('.chat-list-close').focus();
    else document.querySelector('.chat-list-toggle').focus();
  }
  function resize(kind, value) {
    const layout=document.querySelector('.chat-layout'), center=document.querySelector('.chat-center');
    if(kind==='width') { M.state.sidebarWidth=Math.max(220,Math.min(560,layout.clientWidth-360,value));layout.style.setProperty('--chat-list-width',M.state.sidebarWidth+'px'); }
    else { M.state.inputHeight=Math.max(66,Math.min(420,center.clientHeight/2,value));document.querySelector('#chat-input').style.height=M.state.inputHeight+'px'; }
    M.save();
  }
  document.addEventListener('pointerdown',e=>{
    const handle=e.target.closest('[data-resize]'); if(!handle||e.button!==0)return;
    e.preventDefault(); const kind=handle.dataset.resize;
    resizeDrag={kind,origin:kind==='width'?e.clientX:e.clientY,size:document.querySelector(kind==='width'?'.chat-sessions':'#chat-input').getBoundingClientRect()[kind==='width'?'width':'height']};
    handle.setPointerCapture(e.pointerId);
  });
  document.addEventListener('pointermove',e=>{if(resizeDrag)resize(resizeDrag.kind,resizeDrag.size+resizeDrag.origin-(resizeDrag.kind==='width'?e.clientX:e.clientY));});
  for(const event of ['pointerup','pointercancel','lostpointercapture'])document.addEventListener(event,()=>{resizeDrag=null;});
  document.addEventListener('keydown',e=>{
    const kind=e.target.dataset?.resize;if(!kind)return;
    const up=kind==='width'?'ArrowLeft':'ArrowUp',down=kind==='width'?'ArrowRight':'ArrowDown';
    if(e.key!==up&&e.key!==down)return;e.preventDefault();resize(kind,(kind==='width'?(M.state.sidebarWidth||300):(M.state.inputHeight||90))+(e.key===up?20:-20));
  });
  document.addEventListener('click', async event => {
    const el = event.target.closest('[data-chat-action]'); if (!el) return;
    const s = M.current();
    try {
      switch (el.dataset.chatAction) {
        case 'new': {
          const defaults = M.state.accountSettings;
          if (!M.state.newDraft.draft) {
            M.state.newDraft.model = defaults?.codexChatModel || 'gpt-6-astra';
            M.state.newDraft.level = defaults?.codexChatEffort || 'high';
            M.state.newDraft.project = (s && M.project(s.project)?.ready ? s.project : M.state.newDraft.project) || '';
          }
          select(null); break;
        }
        case 'select': select(el.dataset.id); break;
        case 'toggle-list': toggleList(); break;
        case 'history': M.state.limits[el.dataset.project] = (M.state.limits[el.dataset.project]||5)+5; render(); break;
        case 'project': M.state.collapsed[el.dataset.project]=!M.state.collapsed[el.dataset.project]; delete M.state.limits[el.dataset.project]; render(); break;
        case 'rename': open('重命名会话', `<label>会话标题<input name="title" value="${esc(s.title)}" required maxlength="120"></label>`, '保存', 'rename'); break;
        case 'delete': open('删除会话', `<p>${esc(s.title)} · ${esc(M.project(s.project).name)} · ${s.messages.length} 条消息</p><p>${M.active(s) ? '将先停止当前回答，成功后删除本地会话记录。' : '将删除此会话的本地消息、草稿与恢复记录。'}不承诺擦除 Codex 自身保留的底层数据。</p>`, '确认删除', 'delete'); break;
        case 'close': close(); break;
        case 'stop': s.status = 'interrupting'; render(); break;
        case 'latest': s.follow = true; s.unread = 0; render({ capturePosition: false }); break;
        case 'refresh': M.writable(); notice('会话已同步。'); render(); break;
        case 'retry': {
          M.writable(); if (M.active(s)) break;
          if (!M.project(s.project)?.ready) throw Error('请先恢复工作区。');
          s.status = 'starting'; s.error = ''; s.step = 0; s.turnConfig = { model: s.model, level: s.level };
          if (s.messages.at(-1)?.role === 'assistant') Object.assign(s.messages.at(-1), { text: '', streaming: true });
          else s.messages.push({ role: 'assistant', text: '', streaming: true });
          render(); break;
        }
        case 'edit-retry': s.draft = s.lastInput || ''; s.error = ''; render(); document.getElementById('chat-input').focus(); break;
        case 'approve': case 'reject':
          M.writable(); s.messages.push({ role: 'assistant', text: el.dataset.chatAction === 'approve' ? '已允许本次命令，继续检查。' : '本次命令已拒绝，将保留现有结果继续讨论。', streaming: true }); s.status = 'running'; s.step = 0; render(); break;
        case 'copy':
          try { await navigator.clipboard.writeText(el.parentElement.querySelector('code').textContent); notice('代码已复制。'); }
          catch { notice('无法访问剪贴板，请选择代码后复制。'); }
          break;
        case 'bind': open('绑定项目工作区', `<p>选择可访问项目及其本地目录，检查成功后返回当前草稿。</p><label>项目<select name="project" ${s ? 'disabled' : ''}>${M.state.projects.filter(p => !s || p.id === s.project).map(p => `<option value="${p.id}">${esc(p.name)}</option>`).join('')}</select></label><label>本地目录<input name="path" value="/Projects/atlas" required></label>`, '绑定并检查', 'bind'); break;
      }
    } catch (error) { notice(error.message); }
  });
  document.addEventListener('input', event => {
    const o = M.owner();
    if (event.target.id === 'chat-input') o.draft = event.target.value;
    if (event.target.id === 'chat-model') {
      o.model = event.target.value;

    }
    if (event.target.id === 'chat-level') o.level = event.target.value;
    const submit = document.querySelector('#chat-compose button[type=submit]');
    if (submit) submit.disabled = !o.draft.trim() || !M.project(o.project)?.ready;
    M.save();
  });
  document.addEventListener('change', event => {
    if (event.target.id === 'chat-project') { M.state.newDraft.project = event.target.value; render(); }
  });
  document.addEventListener('submit', async event => {
    if (event.target.id === 'chat-compose') { event.preventDefault(); if (!composing) send(); return; }
    if (!event.target.dataset.chatForm) return;
    event.preventDefault(); const form = event.target;
    if (form.dataset.busy) return;
    const data = new FormData(form), s = M.current();
    try {
      M.writable();
      if (form.dataset.chatForm === 'rename') { const title = data.get('title').trim(); if (!title) throw Error('会话标题不能为空。'); s.title = title; }
      if (form.dataset.chatForm === 'delete') {
        form.dataset.busy = 'true'; form.querySelectorAll('button').forEach(b => b.disabled = true);
        if (M.active(s)) { s.status = 'interrupting'; await new Promise(resolve => setTimeout(resolve, 350)); M.writable(); }
        M.state.sessions = M.state.sessions.filter(x => x.id !== s.id); M.state.selected = M.state.sessions[0]?.id || null;
      }
      if (form.dataset.chatForm === 'bind') {
        const path = data.get('path').trim(); if (!path.startsWith('/')) throw Error('请输入本地目录的完整路径。');
        const p = M.project(s?.project || data.get('project')); p.path = path; p.ready = true; if (!s) M.owner().project = p.id;
      }
      close(); render({ capturePosition: form.dataset.chatForm !== 'delete' });
    } catch (error) { form.querySelector('[role=alert]').textContent = error.message; }
    finally { delete form.dataset.busy; form.querySelectorAll('button').forEach(b => b.disabled = false); }
  });
  document.addEventListener('compositionstart', event => { if (event.target.id === 'chat-input') composing = true; });
  document.addEventListener('compositionend', event => { if (event.target.id === 'chat-input') { composing = false; M.owner().draft = event.target.value; M.save(); } });
  document.addEventListener('keydown', event => {
    if (document.getElementById('account-dialog')?.open) return;
    if (event.key === 'Enter' && event.target.id === 'chat-input' && !event.shiftKey && !event.isComposing && !composing) { event.preventDefault(); if (!M.active(M.current())) send(); }
    if (event.key === 'Escape') {
      if (dialog.open) { event.preventDefault(); if (!dialog.querySelector('[data-busy]')) close(); }
      else if (M.state.listOpen) { event.preventDefault(); toggleList(); }
    }
  });
  dialog.addEventListener('cancel', event => { event.preventDefault(); if (!dialog.querySelector('[data-busy]')) close(); });
  document.addEventListener('scroll', event => {
    if (event.target.matches?.('.chat-thread')) {
      const s = M.current(); if (!s) return;
      s.scroll = event.target.scrollTop; s.follow = event.target.scrollHeight - event.target.clientHeight - event.target.scrollTop < 45;
      if (s.follow) s.unread = 0;
      let latest = document.querySelector('.chat-latest');
      if (!s.follow && !latest) { latest = document.createElement('button'); latest.type = 'button'; latest.className = 'chat-latest'; latest.dataset.chatAction = 'latest'; latest.textContent = '回到最新'; document.querySelector('.chat-center').append(latest); }
      if (s.follow) latest?.remove(); M.save();
    }
  }, true);
  function scenario(name) {
    const s = M.current();
    if (name === 'reset') { M.reset(); location.reload(); return; }
    if (name === 'empty') { M.state.sessions = []; M.state.selected = null; }
    if (name === 'offline') M.state.offline = true;
    if (name === 'failure') M.state.failNext = true;
    if (name === 'catalog') M.state.catalogUnavailable = true;
    if (name === 'no-workspace') M.state.projects.forEach(p => p.ready = false);
    if (name === 'permission' && s) s.status = 'waiting_approval';
    if (name === 'failed' && s) { s.status = 'failed'; s.error = '连接失败；会话和部分回答已保留。'; }
    if (name === 'long' && s) s.messages.push({ role:'assistant', text: Array.from({length:30},(_,i)=>`段落 ${i+1}：保留会话独立的阅读位置。`).join('\n\n') + '\n\n| 检查 | 结果 |\n| --- | --- |\n| 草稿 | 保留 |\n\n```json\n' + 'very-long-result:'.repeat(150) + '\n```', reasoning:'先核对项目责任与消息归属，再检查恢复行为。', tool:'更新 desktop/main.mjs、desktop/preload.mjs' });
    if (name === 'recover') { M.state.offline = false; M.state.failNext = false; M.state.catalogUnavailable = false; M.state.projects.forEach(p => p.ready = true); }
    render();
  }
  window.ChatPrototype = { render, tick, scenario, select };
  window.addEventListener('message', event => { if (new URLSearchParams(location.search).get('scenarioTools') === 'on' && event.source === parent && event.data?.type === 'chat-scenario') scenario(event.data.name); });
  render({ capturePosition:false });
  if (new URLSearchParams(location.search).get('autoplay') !== 'off') setInterval(tick, 900);
})();
