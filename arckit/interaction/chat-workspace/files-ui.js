/* Interactive design only: sample data and textarea stand in for native files/Monaco. */
(() => {
  const F = ChatFilesModel, M = ChatModel, V = ChatViews, P = ChatPrototype, {esc} = V;
  const button = (action, label, path = '', extra = '') => `<button type="button" data-file-action="${action}" data-path="${esc(path)}" ${extra}>${label}</button>`;
  const notice = text => { document.getElementById('chat-notice').textContent = text; };
  const dialog = document.createElement('dialog'); dialog.id = 'file-dialog'; dialog.setAttribute('aria-label', '文件操作'); document.body.append(dialog);
  const menu = document.createElement('div'); menu.id = 'file-menu'; menu.role = 'menu'; menu.hidden = true; document.body.append(menu);
  let menuOwner, menuPath, menuReturn, dialogOwner, dialogReturn, submitDialog, generation = 0, ownerKey = '', cursor = {start: 0, end: 0};
  let retainedPane, retainedKey, retainedTab;
  function closeMenu(restore = true) {
    menu.hidden = true;
    if (restore) focusRow(menuReturn);
  }
  function focusRow(path) {
    const row = [...document.querySelectorAll('[data-file-row]')].find(n => n.dataset.fileRow === path);
    (row || document.querySelector('[data-detail-mode="files"]'))?.focus({preventScroll: true});
  }
  function closeDialog() {
    dialog.close(); dialog.replaceChildren(); submitDialog = null;
    if (dialogReturn?.isConnected) dialogReturn.focus(); else focusRow(F.current()?.selected);
  }
  function showDialog(title, body, submit, onSubmit, alternative) {
    closeMenu(false); dialogOwner = F.current(); dialogReturn = document.activeElement;
    dialog.innerHTML = `<form><h2>${esc(title)}</h2>${body}<p role="alert"></p><footer>${button('cancel','取消')}${alternative ? button('alternate', alternative.label) : ''}<button type="submit">${esc(submit)}</button></footer></form>`;
    submitDialog = async () => {
      F.assertCurrent(dialogOwner);
      await onSubmit(new FormData(dialog.querySelector('form')));
      closeDialog(); render();
    };
    dialog.querySelector('[data-file-action="alternate"]')?.addEventListener('click', async () => {
      try { F.assertCurrent(dialogOwner); await alternative.run(); closeDialog(); render(); }
      catch (e) { dialog.querySelector('[role="alert"]').textContent = e.message; }
    });
    dialog.showModal(); (dialog.querySelector('input') || dialog.querySelector('button')).focus();
  }
  dialog.addEventListener('submit', async e => {
    e.preventDefault();
    if (dialog.dataset.busy) return;
    dialog.dataset.busy = 'true';
    dialog.querySelectorAll('button').forEach(n => n.disabled = true);
    try { await submitDialog(); }
    catch (error) { dialog.querySelector('[role="alert"]').textContent = error.message; }
    finally { delete dialog.dataset.busy; dialog.querySelectorAll('button').forEach(n => n.disabled = false); }
  });
  dialog.addEventListener('cancel', e => { e.preventDefault(); if (!dialog.dataset.busy) closeDialog(); });
  function renderTree(s, dir = '', depth = 1) {
    let entries;
    try { entries = F.children(s, dir); } catch (e) { return `<p role="status">${esc(e.message)} ${button('refresh','重试',dir)}</p>`; }
    const limit = s.limits.get(dir) || 50;
    return entries.slice(0, limit).map(e => {
      const directory = e.kind === 'directory', expanded = s.expanded.has(e.path);
      return `<div role="treeitem" tabindex="${s.selected === e.path ? 0 : -1}" aria-level="${depth}" ${directory ? `aria-expanded="${expanded}"` : ''} aria-selected="${s.selected === e.path}" data-file-row="${esc(e.path)}" class="file-row" style="--depth:${depth}" title="${esc(e.path)}">
        ${button('open', `${directory ? (expanded ? '▾' : '▸') : e.kind === 'link' ? '↗' : '·'} <span>${esc(F.name(e.path))}</span>${e.kind === 'link' ? '<small>链接</small>' : ''}`,e.path,'tabindex="-1" class="file-name"')}
        ${button('menu','⋯',e.path,`aria-label="${esc(F.name(e.path))} 更多操作" class="file-more" tabindex="-1"`)}</div>${directory && expanded ? `<div role="group">${renderTree(s,e.path,depth+1)}</div>` : ''}`;
    }).join('') + (entries.length > limit ? button('more', `加载更多（剩余 ${entries.length-limit} 项）`, dir) : entries.length ? '' : '<p class="file-empty">空文件夹</p>');
  }
  function tree(s) {
    if (!s) return '<p role="status">请选择可用工作区；文件草稿不会写入其他项目。</p>';
    return `<div class="file-tools"><strong title="${esc(M.project(M.owner().project)?.path)}">${esc(M.project(M.owner().project)?.name)}</strong>${button('refresh','刷新')}${button('new-file','新建文件')}${button('new-directory','新建文件夹')}</div>
      ${s.error ? `<p role="alert">${esc(s.error)}</p>` : ''}<div class="file-tree" role="tree" aria-label="项目文件">${renderTree(s)}</div>`;
  }
  function pane(s, t) {
    const host = document.createElement('section'); host.className = 'file-editor-pane'; host.setAttribute('aria-label', '文件内容');
    host.innerHTML = `<div class="file-editor-tools"><strong class="file-path"></strong>${button('save','保存',t.path)}${button('reload','重新读取',t.path)}${button('disk','查看磁盘',t.path)}${button('copy-draft','复制草稿',t.path)}${button('reveal','在系统中显示',t.path)}</div><p class="file-status" role="status"></p><div class="file-edit-body"></div>`;
    const body = host.querySelector('.file-edit-body');
    if (t.text == null) body.innerHTML = `<p>${esc(t.unsupported)}</p>`;
    else {
      body.innerHTML = '<pre class="file-line-numbers" aria-hidden="true"></pre><textarea class="file-text" aria-label="编辑文件内容" spellcheck="false" wrap="off"></textarea>';
      const text = body.querySelector('textarea'); text.value = t.text;
      text.addEventListener('input', () => {
        if (t.text !== text.value) { t.undo.push(t.text); t.redo = []; t.text = text.value; }
        syncPane(host, t); syncTabs(s);
      });
      text.addEventListener('scroll', () => body.querySelector('pre').scrollTop = text.scrollTop);
      text.addEventListener('keydown', e => {
        if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'z') {
          e.preventDefault(); const from = e.shiftKey ? t.redo : t.undo, to = e.shiftKey ? t.undo : t.redo;
          if (from.length) { to.push(t.text); t.text = from.pop(); text.value = t.text; syncPane(host,t); syncTabs(s); }
        }
      });
    }
    return host;
  }
  function syncPane(host, t) {
    host.querySelector('.file-path').textContent = t.path;
    host.querySelectorAll('[data-path]').forEach(b => b.dataset.path = t.path);
    host.querySelector('.file-status').textContent = t.error || (t.saving ? '正在保存…' : F.dirty(t) ? '未保存' : '已保存');
    host.querySelector('[data-file-action="save"]').disabled = t.text == null || t.saving;
    host.querySelector('[data-file-action="reload"]').disabled = t.text == null || t.saving;
    const numbers = host.querySelector('.file-line-numbers');
    if (numbers) numbers.textContent = Array.from({length: t.text.split('\n').length},(_,i)=>i+1).join('\n');
  }
  function syncTabs(s) {
    document.querySelectorAll('[data-file-tab]').forEach(b => {
      const t = F.tab(s,b.dataset.fileTab); if (!t) return;
      const same = s.tabs.filter(x => F.name(x.path) === F.name(t.path)).length > 1;
      b.textContent = `${F.name(t.path)}${same ? ' · '+(F.parent(t.path)||'根目录') : ''}${F.dirty(t) ? ' ●' : ''}`;
      b.setAttribute('aria-label',t.path+(F.dirty(t)?' 未保存':''));
    });
  }
  function capturePane() {
    const currentPane = document.querySelector('.file-editor-pane');
    if (currentPane && retainedTab) {
      const text = currentPane.querySelector('textarea');
      if (text) retainedTab.view = {start:text.selectionStart,end:text.selectionEnd,scroll:text.scrollTop,left:text.scrollLeft};
    }
  }
  const base = V.render;
  V.render = function() {
    capturePane();
    const activeElement = document.activeElement, editorFocused = activeElement?.classList.contains('file-text');
    const treeScroll = document.querySelector('.file-tree')?.scrollTop || 0;
    if (retainedPane?.isConnected) retainedPane.remove();
    base();
    const s = F.current(), key = F.key();
    if (ownerKey !== key) { generation++; closeMenu(false); ownerKey = key; }
    const sidebar = document.querySelector('.chat-sessions');
    sidebar.querySelector('header h2').insertAdjacentHTML('beforeend', `<button data-detail-mode="files" aria-pressed="${M.state.detailPanel==='files'}">文件</button>`);
    if (M.state.detailPanel === 'files') {
      sidebar.querySelectorAll('.session-groups,.native-search,footer,.sample-task-detail').forEach(n=>n.hidden=true);
      sidebar.insertAdjacentHTML('beforeend',`<section class="chat-files">${tree(s)}</section>`);
      const first = sidebar.querySelector('[data-file-row]');
      if (!sidebar.querySelector('[data-file-row][tabindex="0"]') && first) first.tabIndex=0;
      const treeNode = sidebar.querySelector('.file-tree'); if (treeNode) treeNode.scrollTop=treeScroll;
    }
    const center=document.querySelector('.chat-center'), t=F.tab(s);
    if(s?.tabs.length) {
      center.insertAdjacentHTML('afterbegin',`<div class="file-tabs" role="tablist" aria-label="Chat 和文件">${button('chat','Chat','','role="tab" aria-selected="'+!s.active+'"')} ${s.tabs.map(x=>`<span class="file-tab-wrap">${button('tab',esc(F.name(x.path)),x.path,`role="tab" data-file-tab="${esc(x.path)}" title="${esc(x.path)}" aria-selected="${s.active===x.path}"`)}${button('close','×',x.path,`aria-label="关闭 ${esc(x.path)}"`)}</span>`).join('')}</div>`);
      syncTabs(s);
      const strip=center.querySelector('.file-tabs'), active=strip.querySelector('[aria-selected="true"]');
      if(active){const target=active.closest('.file-tab-wrap')||active,r=target.getBoundingClientRect(),b=strip.getBoundingClientRect();if(r.right>b.right)strip.scrollLeft+=r.right-b.right;if(r.left<b.left)strip.scrollLeft-=b.left-r.left;}
    }
    if(t) {
      for(const child of center.children) if(!child.classList.contains('file-tabs'))child.hidden=true;
      if(retainedKey!==key||retainedTab!==t) {retainedPane=pane(s,t);retainedKey=key;retainedTab=t;}
      syncPane(retainedPane,t);center.append(retainedPane);
      const text=retainedPane.querySelector('textarea');
      if(text&&t.view){text.setSelectionRange(t.view.start,t.view.end);text.scrollTop=t.view.scroll;text.scrollLeft=t.view.left;}
      if(editorFocused)text?.focus({preventScroll:true});
    }
  };
  function render(){P.render();}
  async function open(s,path) {
    s.selected=path;
    if(s.disk.get(path)?.kind==='directory'){s.expanded.has(path)?s.expanded.delete(path):s.expanded.add(path);render();focusRow(path);return;}
    const token=generation;
    const promise=F.open(s,path);render();
    const opened=await promise;
    if(!opened||token!==generation)return;
    M.state.listOpen=false;render();document.querySelector('.file-text')?.focus();
  }
  function openMenu(s,path,anchor) {
    s.selected=path;menuOwner=s;menuPath=path;menuReturn=path;
    menu.innerHTML=button('open','打开 / 展开',path)+button('new-file','新建文件',path)+button('new-directory','新建文件夹',path)+button('rename','重命名',path)+button('trash','删除到废纸篓',path)+button('copy-path','复制相对路径',path)+button('reference','添加相对路径引用到 Chat',path)+button('reveal','在系统中显示',path);
    menu.querySelectorAll('button').forEach(b=>b.role='menuitem');
    menu.hidden=false;const r=anchor.getBoundingClientRect();
    menu.style.left=Math.max(8,Math.min(r.left,innerWidth-menu.offsetWidth-8))+'px';
    menu.style.top=Math.max(8,Math.min(r.bottom,innerHeight-menu.offsetHeight-8))+'px';menu.querySelector('button').focus();
  }
  async function action(name,path,s) {
    F.assertCurrent(s);const t=F.tab(s,path), entry=s.disk.get(path);
    if(name==='open')return open(s,path);
    if(name==='chat'){s.active='';render();document.getElementById('chat-input').focus();return;}
    if(name==='tab'){s.active=path;F.check(s,t);render();return;}
    if(name==='refresh'){s.error='';s.limits.clear();s.tabs.forEach(x=>F.check(s,x));render();return;}
    if(name==='more'){s.limits.set(path,(s.limits.get(path)||50)+50);render();return;}
    if(name==='save'){try{const promise=F.save(s,t);render();await promise;}catch(e){t.error=e.message;}render();return;}
    if(name==='close') {
      if(!F.dirty(t)){F.close(s,t);render();return;}
      showDialog('文件尚未保存',`<p>${esc(path)}</p>`,'保存并关闭',async()=>{await F.save(s,t);if(F.dirty(t))throw Error('保存期间有新修改，请再次保存。');F.close(s,t);},{label:'放弃修改',run:()=>F.close(s,t)});return;
    }
    if(name==='reload') {
      const reset=()=>{F.reload(s,t);retainedTab=null;};
      if(F.dirty(t))showDialog('放弃本地修改？',`<p>${esc(path)} 的草稿将被当前磁盘内容替换。</p>`,'放弃并重新读取',reset);
      else{reset();render();}return;
    }
    if(name==='disk'){showDialog('当前磁盘内容',`<pre class="file-disk">${esc(entry?.text??'文件已不存在')}</pre>`,'返回编辑',()=>{});return;}
    if(name==='reference') {
      if(!entry)throw Error('目标已消失，请刷新。');
      const o=M.owner(),value=path+(entry.kind==='directory'?'/':''),start=Math.min(cursor.start,o.draft.length),end=Math.min(cursor.end,o.draft.length);
      const prefix=o.draft.slice(0,start),suffix=o.draft.slice(end),insert=(prefix&&!/\s$/.test(prefix)?' ':'')+value+(suffix&&!/^\s/.test(suffix)?' ':'');
      o.draft=prefix+insert+suffix;M.save();s.active='';M.state.listOpen=false;render();
      const input=document.getElementById('chat-input');input.focus();input.setSelectionRange(prefix.length+insert.length,prefix.length+insert.length);return;
    }
    if(name==='copy-path'||name==='copy-draft'){try{await navigator.clipboard.writeText(name==='copy-path'?path:t.text||'');notice('已复制。');}catch{notice('无法访问剪贴板，请选择文本后复制。');}return;}
    if(name==='reveal'){notice('本地样本：将在系统中定位 '+path+'；原型未调用系统文件管理器。');return;}
    if(name==='new-file'||name==='new-directory') {
      const selected=path||s.selected,dir=s.disk.get(selected)?.kind==='directory'?selected:F.parent(selected);
      showDialog(name==='new-file'?'新建文件':'新建文件夹',`<p>${esc(dir||'工作区根目录')}</p><label>名称<input name="name" required autocomplete="off"></label>`,'创建',async data=>{const p=F.create(s,dir,data.get('name'),name==='new-file'?'file':'directory');if(name==='new-file')await F.open(s,p);});return;
    }
    if(name==='rename') {
      showDialog('重命名',`<p>${esc(path)}</p><label>名称<input name="name" required value="${esc(F.name(path))}"></label>`,'保存',data=>F.rename(s,path,data.get('name')));return;
    }
    if(name==='trash') {
      const pending=F.affected(s,path).filter(F.dirty);
      const remove=()=>F.trash(s,path);
      showDialog('移入废纸篓？',`<p>${esc(path)}${entry?.kind==='directory'?' 及其中全部内容':''}</p><p>${pending.length?'有未保存文件，保存后继续或明确放弃修改。':'可从系统废纸篓恢复。'}</p>`,pending.length?'保存并删除':'确认删除',async()=>{for(const item of pending)await F.save(s,item);remove();},pending.length?{label:'放弃修改并删除',run:remove}:null);return;
    }
  }
  document.addEventListener('click', e=>{
    const b=e.target.closest('[data-file-action]');
    if(!b){if(!menu.hidden&&!menu.contains(e.target))closeMenu(false);return;}
    if(b.dataset.fileAction==='cancel'){if(!dialog.dataset.busy)closeDialog();return;}
    if(b.dataset.fileAction==='alternate')return;
    const s=menu.contains(b)?menuOwner:F.current(),path=b.dataset.path;
    if(!s)return;
    if(b.dataset.fileAction==='menu'){openMenu(s,path,b);return;}
    closeMenu(false);
    Promise.resolve().then(()=>action(b.dataset.fileAction,path,s)).catch(error=>{s.error=error.message;notice(error.message);render();});
  });
  document.addEventListener('contextmenu',e=>{const row=e.target.closest('[data-file-row]');if(!row)return;e.preventDefault();openMenu(F.current(),row.dataset.fileRow,row);});
  for(const type of ['input','select','keyup','click'])document.addEventListener(type,e=>{if(e.target.id==='chat-input')cursor={start:e.target.selectionStart,end:e.target.selectionEnd};});
  document.addEventListener('keydown',e=>{
    if(dialog.open){if(e.key==='Escape'){e.preventDefault();e.stopImmediatePropagation();if(!dialog.dataset.busy)closeDialog();}return;}
    if(!menu.hidden){
      if(e.key==='Escape'){e.preventDefault();e.stopImmediatePropagation();closeMenu();}
      if(['ArrowDown','ArrowUp','Home','End'].includes(e.key)) {e.preventDefault();const items=[...menu.querySelectorAll('button')],i=items.indexOf(document.activeElement);items[e.key==='Home'?0:e.key==='End'?items.length-1:(i+(e.key==='ArrowDown'?1:items.length-1))%items.length].focus();}return;
    }
    if((e.metaKey||e.ctrlKey)&&e.key.toLowerCase()==='s'&&F.tab(F.current())){e.preventDefault();action('save',F.current().active,F.current());return;}
    const row=e.target.closest('[data-file-row]'),s=F.current();
    if(row){
      const path=row.dataset.fileRow,rows=[...document.querySelectorAll('[data-file-row]')],i=rows.indexOf(row),entry=s.disk.get(path);
      if(['ArrowDown','ArrowUp','Home','End','ArrowRight','ArrowLeft','Enter','F2','ContextMenu'].includes(e.key)||(e.shiftKey&&e.key==='F10'))e.preventDefault();
      if(['ArrowDown','ArrowUp','Home','End'].includes(e.key)){const next=rows[e.key==='Home'?0:e.key==='End'?rows.length-1:Math.max(0,Math.min(rows.length-1,i+(e.key==='ArrowDown'?1:-1)))];s.selected=next.dataset.fileRow;rows.forEach(r=>{r.tabIndex=r===next?0:-1;r.setAttribute('aria-selected',String(r===next));});next.focus();}
      if(e.key==='ArrowRight'&&entry.kind==='directory'){s.expanded.add(path);render();focusRow(path);}
      if(e.key==='ArrowLeft'){if(s.expanded.has(path)){s.expanded.delete(path);render();focusRow(path);}else focusRow(F.parent(path));}
      if(e.key==='Enter')action('open',path,s).catch(err=>notice(err.message));
      if(e.key==='F2')action('rename',path,s);
      if(e.key==='ContextMenu'||(e.shiftKey&&e.key==='F10'))openMenu(s,path,row);
    }
    const tabs=e.target.closest('.file-tabs');
    if(tabs&&['ArrowLeft','ArrowRight','Home','End'].includes(e.key)){e.preventDefault();const list=[...tabs.querySelectorAll('[role="tab"]')],i=list.indexOf(e.target),next=list[e.key==='Home'?0:e.key==='End'?list.length-1:(i+(e.key==='ArrowRight'?1:list.length-1))%list.length];next.focus();next.click();queueMicrotask(()=>document.querySelector('.file-tabs [aria-selected="true"]')?.focus({preventScroll:true}));}
  },true);
  window.addEventListener('beforeunload',e=>{if([...F.sessions.values()].some(s=>s.tabs.some(F.dirty))){e.preventDefault();e.returnValue='';}});
  function scenario(name) {
    const s=F.current();if(!s)return;
    if(name==='files-save-failure')s.fail='save';
    if(name==='files-delete-failure')s.fail='trash';
    if(name==='files-read-failure')s.fail='read';
    if(name==='files-conflict'){const t=F.tab(s);if(t){const d=s.disk.get(t.path);if(d){d.text+='\n磁盘上的新内容';d.revision++;F.check(s,t);}}}
    if(name==='files-deleted'){const t=F.tab(s);if(t){s.disk.delete(t.path);F.check(s,t);}}
    if(name==='files-recover'){s.slow=false;s.fail='';s.error='';s.disk.get('restricted').denied=false;}
    if(name==='files-slow')s.slow=true;
    render();
  }
  window.addEventListener('message',e=>{if(new URLSearchParams(location.search).get('scenarioTools')==='on'&&e.source===parent&&e.data?.type==='chat-files-scenario')scenario(e.data.name);});
  window.ChatFileUI={render,scenario,activeEditor:()=>Boolean(F.tab(F.current()))};
  render();
})();
