(() => {
 const M=ChatModel,N=ChatNative,P=ChatPrototype,V=ChatNativeViews,esc=ChatViews.esc;
 const picker=document.getElementById('native-picker');let returnFocus=null,prefix='',mode='all';
 const input=()=>document.getElementById('chat-input');
 const notify=text=>{document.getElementById('chat-notice').textContent=text};
 const candidates=()=>[...(mode!=='refs'?N.capabilities:[]),...(mode!=='capabilities'?N.refs():[])];
 function options(){const q=document.getElementById('native-query').value.toLowerCase(),rows=candidates().filter(x=>(x.kind+x.label+x.detail).toLowerCase().includes(q));document.getElementById('native-options').innerHTML=['调用能力','引用上下文'].map(group=>{
  const items=rows.filter(x=>(['原生能力','Skill'].includes(x.kind)?'调用能力':'引用上下文')===group);
  return items.length?`<section><h3>${group}</h3>${items.map(x=>`<button class="native-option" type="button" data-native-pick="${x.id}">${esc(x.label)} · ${esc(x.kind)}<small>${esc(x.detail)}</small></button>`).join('')}</section>`:'';
 }).join('')||'<p>没有匹配项，请调整搜索。</p>'}
 function close(focus=true){picker.close();if(focus){if(returnFocus?.isConnected)returnFocus.focus();else input()?.focus()}prefix=''}
 function open(category='all',token=''){
  if(picker.open)return;returnFocus=document.activeElement;mode=category;prefix=token;
  picker.innerHTML='<div class="native-picker-heading"><strong id="native-picker-title">能力与引用</strong><button type="button" data-native-close>关闭</button></div><input id="native-query" aria-label="搜索能力与引用" placeholder="搜索能力、Skill、文件或待办"><div id="native-options"></div><p class="native-picker-note">选择后放入输入框，发送时交给 Agent。</p><footer class="native-picker-footer"><a href="../engineering-profile/default.html" target="_blank" rel="noopener">技能设置 ↗</a></footer>';
  options();ChatPopup.show(picker,'[data-native-action=invoke]',640);document.getElementById('native-query').focus();
 }
 function choose(item){const c=N.context();if(['原生能力','Skill'].includes(item.kind))c.capability=item;else if(!c.refs.some(r=>r.id===item.id))c.refs.push(item);
  if(prefix&&M.owner().draft===prefix)M.owner().draft='';
  if(picker.open)close(false);P.render();input().focus();M.save();
 }
 function trigger(){const text=M.owner().draft;if(text==='/'||text==='@')open(text==='/'?'capabilities':'refs',text)}
 function openTask(id){
  const t=N.task(id);if(!t||t.unavailable)throw Error('待办不可访问，对话和草稿保持。');if(!N.inScope(t.project))throw Error('待办不在当前产品范围。');
  const existing=M.state.sessions.find(s=>s.thread===t.thread);if(existing){P.select(existing.id);return}
  if(!M.project(t.project)?.ready)throw Error('请先恢复待办项目的工作区。');
  const savedDraft=M.state.newDraft;P.select(null);
  M.state.newDraft={project:t.project,draft:'',model:savedDraft.model||'gpt-6-astra',level:savedDraft.level||'high'};
  try{const s=N.request('读取这个待办，继续在这里讨论。',{kind:'read',taskId:t.id});s.mainTask=t.id;s.title=t.title;if(t.thread)s.thread=t.thread;else t.thread=s.thread;M.state.listOpen=false;P.render({capturePosition:false});input().focus()}
  finally{M.state.newDraft=savedDraft;M.save()}
 }
 document.addEventListener('click',e=>{
  const b=e.target.closest('[data-native-action]');if(!b)return;
  try{
   switch(b.dataset.nativeAction){
    case 'invoke':open();break;
    case 'model-settings':window.ChatModelSettings.open();break;
    case 'convert':N.request('把这段对话整理成待办。',{kind:'whole'});P.render({capturePosition:false});break;
    case 'create':if(M.state.listOpen){M.state.listOpen=false;P.render()}choose(N.capabilities.find(x=>x.id==='create'));break;
    case 'task':openTask(b.dataset.id);break;
    case 'source':P.select(b.dataset.id);break;
    case 'read':N.request('读取待办的最新内容。',{kind:'read',taskId:b.dataset.id});P.render({capturePosition:false});break;
    case 'remove':{const c=N.context();if(b.dataset.id==='capability')c.capability=null;else c.refs=c.refs.filter(x=>x.id!==b.dataset.id);P.render();input().focus();break}
   }
  }catch(error){notify(error.message)}
 });
 document.addEventListener('input',e=>{
  if(e.target.id==='native-search'){M.state.nativeSearch=e.target.value;P.render()}
  if(e.target.id==='chat-input'){
   const submit=document.querySelector('#chat-compose button[type=submit]');if(submit)submit.disabled=(!M.owner().draft.trim()&&!N.hasContext())||!M.project(M.owner().project)?.ready;
   if(!e.isComposing)trigger();
  }
 });
 document.addEventListener('compositionend',e=>{if(e.target.id==='chat-input')trigger()});
 document.addEventListener('change',e=>{if(e.target.id==='chat-project'){const removed=N.context().refs.length;N.context().refs=[];M.save();P.render();if(removed)notify('已切换工作区，原项目引用已移除；正文和能力选择保留。')}});
 picker.addEventListener('input',e=>{if(e.target.id==='native-query')options()});
 picker.addEventListener('click',e=>{if(e.target.closest('[data-native-close]'))close();const b=e.target.closest('[data-native-pick]');if(b)choose(candidates().find(x=>x.id===b.dataset.nativePick))});
 picker.addEventListener('cancel',e=>{e.preventDefault();close()});
 picker.addEventListener('keydown',e=>{
  const buttons=[...picker.querySelectorAll('[data-native-pick]')],index=buttons.indexOf(document.activeElement);
  if(['ArrowDown','ArrowUp'].includes(e.key)){e.preventDefault();buttons[(index+(e.key==='ArrowDown'?1:-1)+buttons.length)%buttons.length]?.focus()}
  if(e.key==='Enter'&&e.target.id==='native-query'){e.preventDefault();buttons[0]?.click()}
 });
 const scenario=P.scenario;
 P.scenario=function(name){
  if(name==='native-failure')M.state.nativeFailure=true;
  else if(name==='native-conflict'){const t=N.task(M.current()?.mainTask);if(t){t.revision++;t.content+='\n其他用户补充的最新约束。'}}
  else if(name==='native-occupied'){const t=N.task(M.current()?.mainTask);if(t)t.occupied=true}
  else if(name==='native-unavailable'){const t=N.task(M.current()?.mainTask);if(t)t.unavailable=true}
  else if(name==='native-reset'){M.state.tasks.forEach(t=>{delete t.occupied;delete t.unavailable});M.state.nativeFailure=false}
  else return scenario(name);
  M.save();P.render();
 };
 window.addEventListener('message',e=>{if(new URLSearchParams(location.search).get('scenarioTools')==='on'&&e.source===parent&&e.data?.type==='chat-native-scenario')P.scenario(e.data.name)});
 window.ChatNativeInput={open,choose,openTask};
})();
