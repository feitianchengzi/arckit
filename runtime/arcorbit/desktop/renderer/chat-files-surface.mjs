import { createChatFilesState, fileParent, fileName, fileDirty } from './chat-files-state.mjs';
import { createFileDialog, fileEscape as esc } from './chat-files-dialog.mjs';
const button = (action, label, path = '', extra = '') => `<button type="button" data-chat-file="${action}" data-path="${esc(path)}" ${extra}>${label}</button>`;
const language = path => ({js:'javascript',mjs:'javascript',cjs:'javascript',ts:'typescript',tsx:'typescript',jsx:'javascript',md:'markdown',css:'css',html:'html',py:'python',go:'go'})[path.split('.').pop()] || 'plaintext';
let vendorPromise;
const vendor = () => vendorPromise ||= import('./vendor/release-vendor.js').catch(e => {vendorPromise=null;throw e;});

export function createChatFilesSurface({api, coordinator, getOwner, isVisible, getPanel, setPanel, closeList, openList, notify, setChatSuspended = () => {}}) {
  const root = document.getElementById('chatView'), main = root.querySelector('.chat-main'), sidebar = document.getElementById('chatSessionsPanel');
  const treeHost = document.createElement('section'); treeHost.id = 'chatFilesTree'; treeHost.className = 'chat-files-tree-host'; sidebar.append(treeHost);
  const tabs = document.createElement('div'); tabs.className = 'chat-file-tabs'; tabs.setAttribute('role','tablist'); tabs.setAttribute('aria-label','Chat 和文件'); main.prepend(tabs);
  const pane = document.createElement('section'); pane.className = 'chat-file-pane'; pane.innerHTML = `<div class="chat-file-tools"><strong></strong>${button('save','保存')}${button('reload','重新读取')}${button('disk','查看磁盘')}${button('copy-draft','复制草稿')}${button('reveal','在系统中显示')}${button('editor-retry','重试编辑器')}</div><p class="chat-file-status" role="status"></p><div class="chat-file-editor"></div>`; main.append(pane);
  const menu = document.createElement('div'); menu.className = 'chat-file-menu'; menu.hidden = true; menu.role = 'menu'; document.body.append(menu);
  const dialog = createFileDialog();
  const model = createChatFilesState({api, changed: render});
  let editor, monacoApi, attached, editorRequest = 0, menuSession, menuPath, cursor = {start:0,end:0}, lastTabs = '', lastTree = '';
  const active = () => {const s=model.current();return s?.tabs.find(t=>t.path===s.active);};
  const ownerMatches = s => model.current() === s && s.owner.project_id === getOwner().project_id;
  const assertOwner = s => {if(!ownerMatches(s))throw Error('项目已切换，旧文件操作已取消。');};
  const focusRow = path => [...treeHost.querySelectorAll('[data-file-row]')].find(n=>n.dataset.fileRow===path)?.focus();
  const hideMenu = (restore=false) => {menu.hidden=true;if(restore)focusRow(menuPath);};
  function treeRows(s, dir='', depth=1) {
    const state=s.directories.get(dir);
    if(!state)return button('load','加载目录',dir);
    return (state.error?`<p role="alert">${esc(state.error)}${button('load','重试',dir)}</p>`:'')+state.entries.map(e=>`<div class="chat-file-row" role="treeitem" tabindex="${s.selected===e.path?0:-1}" aria-level="${depth}" aria-selected="${s.selected===e.path}" ${e.kind==='directory'?`aria-expanded="${s.expanded.has(e.path)}"`:''} data-file-row="${esc(e.path)}" style="--depth:${depth}">${button('open',`${e.kind==='directory'?(s.expanded.has(e.path)?'▾':'▸'):e.kind==='link'?'↗':'·'} <span>${esc(e.name)}</span>${e.kind==='link'?'<small>链接</small>':''}`,e.path,'class="chat-file-name" tabindex="-1"')}${button('menu','⋯',e.path,`aria-label="${esc(e.name)} 更多操作" tabindex="-1"`)}</div>${e.kind==='directory'&&s.expanded.has(e.path)?`<div role="group">${treeRows(s,e.path,depth+1)}</div>`:''}`).join('')+(state.loading?'<p role="status">正在读取…</p>':state.next_offset!=null?button('more',`加载更多（剩余 ${state.total-state.entries.length} 项）`,dir):!state.entries.length&&!state.error?'<p class="chat-file-empty">空文件夹</p>':'');
  }
  function render() {
    const s=model.current(), t=active();
    if (!ownerMatches(s || {owner:{}})) hideMenu();
    treeHost.hidden=getPanel()!=='files';
    const html=s?`<div class="chat-file-tree-tools"><strong>${esc(s.name)}</strong>${button('refresh','刷新')}${button('new-file','新建文件')}${button('new-directory','新建文件夹')}</div>${s.error?`<p role="alert">${esc(s.error)}</p>`:''}${s.invalid?button('discard-workspace','放弃旧工作区草稿并重新打开'):''}<div class="chat-file-tree" role="tree" aria-label="项目文件">${treeRows(s)}</div>${s.opening?.size?'<p role="status">正在打开文件…</p>':''}`:`<p role="status">${esc(model.error()||'正在读取工作区…')}</p>${button('context-retry','重试')}`;
    if(html!==lastTree){const scroll=treeHost.querySelector('.chat-file-tree')?.scrollTop||0;const focus=document.activeElement?.dataset.fileRow;treeHost.innerHTML=html;lastTree=html;const tree=treeHost.querySelector('.chat-file-tree');if(tree)tree.scrollTop=scroll;if(focus)focusRow(focus);if(!treeHost.querySelector('[tabindex="0"]'))treeHost.querySelector('[data-file-row]')?.setAttribute('tabindex','0');}
    tabs.hidden=!s?.tabs.length;
    const tabHtml=s?button('chat','Chat','','role="tab" aria-selected="'+!s.active+'"')+s.tabs.map(x=>`<span class="chat-file-tab">${button('tab',`${esc(fileName(x.path))}${s.tabs.some(y=>y!==x&&fileName(y.path)===fileName(x.path))?' · '+esc(fileParent(x.path)):''}${fileDirty(x)?' ●':''}`,x.path,`role="tab" title="${esc(x.path)}" aria-selected="${s.active===x.path}"`)}${button('close','×',x.path,`aria-label="关闭 ${esc(x.path)}"`)}</span>`).join('')+button('show-files','文件','','class="chat-file-drawer-toggle"'):'';
    if(tabHtml!==lastTabs){tabs.innerHTML=tabHtml;lastTabs=tabHtml;const chosen=tabs.querySelector('[aria-selected="true"]')?.closest('.chat-file-tab');if(chosen){const r=chosen.getBoundingClientRect(),b=tabs.getBoundingClientRect();if(r.right>b.right)tabs.scrollLeft+=r.right-b.right;}}
    if(t||!isVisible())setChatSuspended(true);
    pane.hidden=!t; main.classList.toggle('has-chat-file',Boolean(t));
    if(!t&&isVisible())setChatSuspended(false);
    if(editor&&attached!==t){if(attached&&!attached.model?.isDisposed())attached.view=editor.saveViewState();editor.setModel(null);attached=null;}
    if(t){pane.querySelector('strong').textContent=t.path;pane.querySelector('.chat-file-status').textContent=t.error||(t.unsupported?(t.unsupported+(t.target?' 目标：'+t.target:'')):'')||(t.saving?'正在保存…':fileDirty(t)?'未保存':'已保存');
      pane.querySelector('[data-chat-file="save"]').disabled=t.text==null||Boolean(t.saving)||s.invalid;
      pane.querySelector('[data-chat-file="reload"]').disabled=Boolean(t.saving)||s.invalid;
      pane.querySelector('[data-chat-file="editor-retry"]').hidden=!t.editorFailed;
      pane.querySelector('[data-chat-file="copy-draft"]').disabled=t.text==null;
      if(t.model&&monacoApi&&t.model.getLanguageId()!==language(t.path))monacoApi.editor.setModelLanguage(t.model,language(t.path));
      const host=pane.querySelector('.chat-file-editor');host.hidden=t.text==null;
      if(t.text!=null&&!t.editorLoading&&!t.editorFailed&&attached!==t)void attach(s,t);
    }
  }
  async function attach(s,t) {
    const token=++editorRequest;t.editorLoading=true;
    try {
      const {monaco}=await vendor();
      monacoApi=monaco;
      if(token!==editorRequest||active()!==t||model.current()!==s)return;
      const theme=()=>monaco.editor.setTheme(document.documentElement.dataset.theme==='dark'?'vs-dark':'vs'); theme();
      if(!editor){editor=monaco.editor.create(pane.querySelector('.chat-file-editor'),{model:null,automaticLayout:true,minimap:{enabled:false},fontSize:13,scrollBeyondLastLine:false});window.addEventListener('arcorbit:appearance',theme);editor.addCommand(monaco.KeyMod.CtrlCmd|monaco.KeyCode.KeyS,()=>void run('save'));}
      if(!t.model){t.model=monaco.editor.createModel(t.text,language(t.path),monaco.Uri.parse(`arcorbit-chat://workspace/${s.workspace}/${encodeURIComponent(t.id)}/${t.path.split('/').map(encodeURIComponent).join('/')}`));t.subscription=t.model.onDidChangeContent(()=>{t.text=t.model.getValue();model.changed();});}
      editor.setModel(t.model);attached=t;if(t.view)editor.restoreViewState(t.view);editor.layout();
    }catch(e){t.editorFailed=true;t.error='编辑器加载失败：'+e.message;}
    finally{
      t.editorLoading=false;
      // A stale request may have prevented the active tab from starting another
      // attachment while its loading flag was set. Reconcile the current tab,
      // including when the old tab was closed or its workspace changed.
      render();
    }
  }
  async function confirmDirty(s,targets,title,proceed) {
    if(!targets.some(fileDirty)){await proceed();return true;}
    return dialog.show({title,body:`<p>${targets.filter(fileDirty).map(t=>esc(t.path)).join('<br>')}</p><p>这些文件有未保存修改。</p>`,actions:[{label:'保存并继续',run:async()=>{for(const t of targets.filter(fileDirty))await model.save(s,t);if(targets.some(fileDirty))throw Error('保存期间有新输入，请再次保存。');await proceed();}},{label:'放弃修改',run:proceed}]});
  }
  async function action(name,path='',s=model.current()) {
    if(name==='context-retry'){return model.select(getOwner(),true);}
    if(name==='show-files'){setPanel('files');openList();return;}
    if(!s)return;assertOwner(s);
    const t=s.tabs.find(t=>t.path===(path||s.active)), entry=[...s.directories.values()].flatMap(d=>d.entries).find(e=>e.path===(path||s.selected));
    if(name==='chat'){s.active='';render();document.getElementById('chatInput').focus();return;}
    if(name==='tab'){s.active=path;render();await model.check(s,t);return;}
    if(name==='open'){
      s.selected=path;
      if(entry?.kind==='directory'){if(s.expanded.has(path))s.expanded.delete(path);else{s.expanded.add(path);if(!s.directories.has(path))await model.list(s,path);}render();focusRow(path);return;}
      const tab=await model.openFile(s,path);if(tab&&ownerMatches(s)){closeList();render();editor?.focus();}return;
    }
    if(name==='refresh'){await model.select(getOwner(),true);if(model.current()===s&&!s.invalid)await model.refresh(s);return;}
    if(name==='load'||name==='more')return model.list(s,path,name==='more');
    if(name==='save')return model.save(s,t);
    if(name==='editor-retry'){if(t){t.error='';t.editorFailed=false;await attach(s,t);render();}return;}
    if(name==='close'){if(t.saving)await t.saving;return confirmDirty(s,[t],'关闭文件？',async()=>{assertOwner(s);model.close(s,t);});}
    if(name==='reload')return dialog.show({title:'重新读取文件？',body:'<p>放弃当前草稿并加载磁盘内容。</p>',actions:[{label:'放弃并重新读取',run:async()=>{assertOwner(s);await model.reload(s,t);}}]});
    if(name==='disk'){const disk=await model.command(s,'read',{path:t.path});assertOwner(s);return dialog.show({title:'当前磁盘内容',body:`<pre>${esc(disk.text??disk.unsupported)}</pre>`,actions:[{label:'返回编辑',run:async()=>{}}]});}
    if(name==='copy-draft'){await navigator.clipboard.writeText(t.text||'');notify('草稿已复制。');return;}
    if(name==='reveal')return model.command(s,'reveal',{path:path||t?.path||s.selected});
    if(name==='copy-path'||name==='reference'){
      const value=path+(entry?.kind==='directory'?'/':'');
      if(name==='copy-path'){await navigator.clipboard.writeText(value);notify('相对路径已复制。');return;}
      const context=await api.chatFiles('context',getOwner());assertOwner(s);if(context.workspace!==s.workspace)throw Error('工作区已变化，引用已取消。');
      const text=coordinator.getState().draft||'',start=Math.min(cursor.start,text.length),end=Math.min(cursor.end,text.length),before=text.slice(0,start),after=text.slice(end);
      const insert=(before&&!/\s$/.test(before)?' ':'')+value+(after&&!/^\s/.test(after)?' ':'');coordinator.setDraft(before+insert+after);await coordinator.flushDraft();
      s.active='';closeList();render();const input=document.getElementById('chatInput');input.value=coordinator.getState().draft;input.focus();input.setSelectionRange((before+insert).length,(before+insert).length);return;
    }
    if(name==='new-file'||name==='new-directory'||name==='rename'){
      const target=path||s.selected,dir=entry?.kind==='directory'?target:fileParent(target);
      return dialog.show({title:name==='rename'?'重命名':name==='new-file'?'新建文件':'新建文件夹',body:`<p>${esc(name==='rename'?target:dir||'工作区根目录')}</p><label>名称<input name="name" required value="${esc(name==='rename'?fileName(target):'')}"></label>`,actions:[{label:'确定',run:async data=>{assertOwner(s);if(name==='rename')await model.rename(s,target,data.get('name'));else{const result=await model.command(s,name==='new-file'?'create-file':'create-directory',{path:dir,name:data.get('name')});s.expanded.add(dir);s.selected=result.path;await model.list(s,dir);if(name==='new-file')await model.openFile(s,result.path);}render();}}]});
    }
    if(name==='trash'){
      const targets=model.affected(s,path),dirty=targets.some(fileDirty);
      return dialog.show({title:'移入系统废纸篓？',body:`<p>${esc(path)}${entry?.kind==='directory'?' 及其中全部内容':''}</p>${dirty?'<p>包含未保存文件。</p>':''}`,actions:[{label:dirty?'保存并删除':'确认删除',run:async()=>{assertOwner(s);for(const t of targets.filter(fileDirty))await model.save(s,t);if(targets.some(fileDirty))throw Error('有新输入，请再次保存。');await model.trash(s,path);}},...(dirty?[{label:'放弃修改并删除',run:async()=>{assertOwner(s);await model.trash(s,path);}}]:[])]});
    }
    if(name==='discard-workspace')return dialog.show({title:'放弃旧工作区草稿？',body:'<p>放弃后将读取新的工作区。需要保留的内容请先复制。</p>',actions:[{label:'放弃并重新打开',run:async()=>{model.discardSession(s);await model.select(getOwner(),true);}}]});
  }
  async function run(name,path,s){const current=s||model.current();if(current&&!current.invalid)current.error='';try{await action(name,path,s);}catch(e){const message=e.message.replace(/^Error invoking remote method '[^']+': Error: /,'');notify(message);if(current){current.error=message;render();}}}
  function showMenu(path,anchor){menuSession=model.current();menuPath=path;menu.innerHTML=[['open','打开 / 展开'],['new-file','新建文件'],['new-directory','新建文件夹'],['rename','重命名'],['trash','删除到废纸篓'],['copy-path','复制相对路径'],['reference','添加相对路径引用到 Chat'],['reveal','在系统中显示']].map(([a,l])=>button(a,l,path,'role="menuitem"')).join('');menu.hidden=false;const r=anchor.getBoundingClientRect();menu.style.left=Math.max(8,Math.min(r.left,innerWidth-menu.offsetWidth-8))+'px';menu.style.top=Math.max(8,Math.min(r.bottom,innerHeight-menu.offsetHeight-8))+'px';menu.querySelector('button').focus();}
  document.addEventListener('click',e=>{const b=e.target.closest('[data-chat-file]');if(!b){hideMenu();return;}const s=menu.contains(b)?menuSession:model.current();if(b.dataset.chatFile==='menu'){showMenu(b.dataset.path,b);return;}hideMenu();void run(b.dataset.chatFile,b.dataset.path,s);});
  treeHost.addEventListener('contextmenu',e=>{const row=e.target.closest('[data-file-row]');if(row){e.preventDefault();showMenu(row.dataset.fileRow,row);}});
  for(const event of ['select','keyup','click','input'])document.getElementById('chatInput').addEventListener(event,e=>{cursor={start:e.target.selectionStart,end:e.target.selectionEnd};});
  document.addEventListener('keydown',e=>{
    if(dialog.isOpen())return;
    if(!menu.hidden){if(e.key==='Escape'){e.preventDefault();hideMenu(true);}if(['ArrowDown','ArrowUp'].includes(e.key)){e.preventDefault();const items=[...menu.querySelectorAll('button')],i=items.indexOf(document.activeElement);items[(i+(e.key==='ArrowDown'?1:items.length-1))%items.length].focus();}return;}
    const row=e.target.closest('[data-file-row]'),s=model.current();
    if(row){const path=row.dataset.fileRow,rows=[...treeHost.querySelectorAll('[data-file-row]')],i=rows.indexOf(row);
      if(['ArrowDown','ArrowUp','ArrowLeft','ArrowRight','Home','End','Enter','F2','ContextMenu'].includes(e.key)||(e.shiftKey&&e.key==='F10'))e.preventDefault();
      if(['ArrowDown','ArrowUp','Home','End'].includes(e.key)){const next=rows[e.key==='Home'?0:e.key==='End'?rows.length-1:Math.max(0,Math.min(rows.length-1,i+(e.key==='ArrowDown'?1:-1)))];s.selected=next.dataset.fileRow;render();focusRow(s.selected);}
      if(e.key==='Enter'||e.key==='ArrowRight'&&!s.expanded.has(path))void run('open',path);
      if(e.key==='ArrowLeft'){if(s.expanded.has(path)){s.expanded.delete(path);render();focusRow(path);}else focusRow(fileParent(path));}
      if(e.key==='F2')void run('rename',path);
      if(e.key==='ContextMenu'||e.shiftKey&&e.key==='F10')showMenu(path,row);
    }
    if(tabs.contains(e.target)&&['ArrowLeft','ArrowRight','Home','End'].includes(e.key)){e.preventDefault();const list=[...tabs.querySelectorAll('[role="tab"]')],i=list.indexOf(e.target),next=list[e.key==='Home'?0:e.key==='End'?list.length-1:(i+(e.key==='ArrowRight'?1:list.length-1))%list.length];void action(next.dataset.chatFile,next.dataset.path).then(()=>tabs.querySelector('[aria-selected="true"]')?.focus());}
    if(isVisible()&&active()&&(e.metaKey||e.ctrlKey)&&e.key.toLowerCase()==='s'){e.preventDefault();void run('save');}
  });
  window.addEventListener('focus',()=>{if(isVisible())void model.select(getOwner(),true).then(()=>{const s=model.current();if(s&&!s.invalid)for(const t of s.tabs)void model.check(s,t);});});
  window.addEventListener('beforeunload',e=>{if(model.dirty().length||model.pendingSaves().length){e.preventDefault();e.returnValue=false;}});
  async function prepareLeave(){await model.settleSaves();const dirty=model.dirty();if(!dirty.length)return true;return dialog.show({title:'保存文件修改后离开？',body:`<p>${dirty.map(({s,t})=>esc(s.name+' / '+t.path)).join('<br>')}</p>`,actions:[{label:'全部保存并继续',run:async()=>{for(const {s,t} of dirty)await model.save(s,t);if(model.dirty().length)throw Error('仍有未保存修改，请处理后继续。');}},{label:'放弃修改并继续',run:async()=>{model.reset();}}]});}
  return {sync(){if(isVisible())void model.select(getOwner());render();},prepareLeave,reset:model.reset,model,editor:()=>editor,fileActive:()=>Boolean(active())};
}
