const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const empty=()=>({capability:null,refs:[]});
export function createChatNativeSurface({api,coordinator,getProject,getSession,render,performAction,closeList,onTaskOpened=()=>{}}){
 const input=document.getElementById('chatInput'),foot=document.querySelector('.chat-composer-foot');
 const state=()=>coordinator.getState();
 const owner=()=>({session_id:getSession()?.id||'',project_id:getProject()?.id||''});
 let currentKey='',catalog=null,request=0,mode='all',prefix='',directory='',focus=null,inFlight=null;
 const identity=document.createElement('div');identity.className='chat-native-identity';document.getElementById('chatStatusText').after(identity);
 const chips=document.createElement('div');chips.className='chat-native-chips';foot.before(chips);
 const invoke=document.createElement('button');invoke.type='button';invoke.className='secondary-button';invoke.id='chatNativeInvoke';invoke.textContent='＋ 能力与引用';foot.prepend(invoke);
 const config=document.querySelector('.chat-composer-config');const model=document.createElement('button');model.type='button';model.className='secondary-button';model.id='chatModelSettings';invoke.after(model);
 const modelDialog=document.createElement('dialog');modelDialog.className='chat-native-menu chat-model-menu';modelDialog.setAttribute('aria-label','模型能力设置');modelDialog.innerHTML='<div class="chat-native-menu-head"><strong>模型能力设置</strong><button type="button" data-close>完成</button></div>';modelDialog.append(config);modelDialog.insertAdjacentHTML('beforeend','<p>当前会话 · 调整自动保存，从下一条消息生效。</p>');document.body.append(modelDialog);
 const picker=document.createElement('dialog');picker.className='chat-native-menu chat-capability-menu';picker.setAttribute('aria-label','能力与引用');picker.innerHTML='<div class="chat-native-menu-head"><strong>能力与引用</strong><button type="button" data-close>关闭</button></div><input type="search" aria-label="搜索能力与引用" placeholder="搜索能力、Skill、文件或待办"><div class="chat-native-options"></div><p class="chat-native-menu-note">选择后放入输入框，发送时交给 Agent。</p><footer></footer>';document.body.append(picker);
 picker.querySelector('footer').append(document.getElementById('chatSkillsButton'));
 document.getElementById('chatSkillsButton').textContent='技能设置 ↗';document.getElementById('chatSkillsButton').addEventListener('click',()=>picker.close());
 function position(dialog,button){const r=button.getBoundingClientRect();dialog.style.maxHeight=Math.max(0,r.top-20)+'px';dialog.style.bottom=innerHeight-r.top+8+'px';dialog.style.left=Math.max(12,Math.min(r.left,innerWidth-dialog.getBoundingClientRect().width-12))+'px'}
 function show(dialog,button){focus=document.activeElement;dialog.showModal();position(dialog,button);dialog.querySelector('input,select,button')?.focus()}
 for(const [dialog,button] of [[picker,invoke],[modelDialog,model]]){dialog.querySelector('[data-close]').onclick=()=>dialog.close();dialog.addEventListener('close',()=>{prefix='';(focus?.isConnected?focus:button).focus({preventScroll:true})});dialog.addEventListener('cancel',()=>{prefix=''});window.addEventListener('resize',()=>{if(dialog.open)position(dialog,button)})}
 function context(){return state().native_context||empty()}
 function choose(item){const c=structuredClone(context());if(['native','skill'].includes(item.kind))c.capability=item;else if(!c.refs.some(r=>r.kind===item.kind&&r.id===item.id))c.refs.push(item);coordinator.setNativeContext(c);if(prefix&&state().draft===prefix)coordinator.setDraft('');picker.close();render();input.focus()}
 function candidates(){if(!catalog)return [];return [...(mode==='refs'?[]:[...(catalog.capabilities||[]),...(catalog.skills||[])]),...(mode==='capabilities'?[]:[...(catalog.files||[]),...(catalog.tasks||[]).map(t=>({...t,kind:'task',label:t.title}))])]}
 function options(){const query=picker.querySelector('input').value.toLowerCase(),items=candidates().filter(x=>(x.label+' '+x.kind).toLowerCase().includes(query));const host=picker.querySelector('.chat-native-options');host.innerHTML=(catalog?.error?`<p role="status">${esc(catalog.error)}</p>`:'')+(directory?'<button data-up>← 上级目录</button>':'')+['调用能力','引用上下文'].map(group=>{const rows=items.filter(x=>(['native','skill'].includes(x.kind)?'调用能力':'引用上下文')===group);return rows.length?`<section><h3>${group}</h3>${rows.map((x)=>`<button type="button" data-pick="${esc(x.kind+':'+x.id)}">${esc(x.label)}${x.directory?' /':''}<small>${({native:'原生能力',skill:'Skill',file:x.directory?'文件夹':'项目文件',task:'待办 · '+x.id})[x.kind]}</small></button>`).join('')}</section>`:''}).join('')||'<p>没有匹配项。</p>';host.querySelector('[data-up]')?.addEventListener('click',()=>performAction(async()=>{directory=directory.split('/').slice(0,-1).join('/');await load(true)}));host.querySelectorAll('[data-pick]').forEach(b=>b.onclick=()=>{const item=items.find(x=>x.kind+':'+x.id===b.dataset.pick);if(item.directory)performAction(async()=>{directory=item.path;await load(true)});else choose(item)});}
 // Rendering is read-only. Fetch only for owner changes, explicit actions or source events.
 function load(force=false){
  const o=owner(),ownerKey=JSON.stringify(o);
  if(!o.project_id){request++;inFlight=null;return Promise.resolve()}
  const query={...o,path:directory};
  const key=JSON.stringify(query);
  if(inFlight?.key===key&&inFlight.id===request)return inFlight.promise;
  const id=++request;
  const pending={key,id,promise:null};
  inFlight=pending;
  pending.promise=(async()=>{
   try{
    const result=await api.chatNativeCatalog({...query,refresh:force});
    if(id!==request||ownerKey!==JSON.stringify(owner()))return;
    catalog=result;
    if(picker.open)options();
    paint();
   }catch(e){
    if(id!==request||ownerKey!==JSON.stringify(owner()))return;
    catalog={error:e.message,tasks:[],files:[],skills:[],capabilities:[]};
    if(picker.open)options();
    paint();
   }finally{
    if(inFlight===pending)inFlight=null;
   }
  })();
  return pending.promise;
 }

 async function open(category='all',token=''){if(picker.open)return;mode=category;prefix=token;directory='';picker.querySelector('input').value='';show(picker,invoke);picker.querySelector('input').focus();picker.querySelector('.chat-native-options').textContent='正在读取可用能力…';await load(true);options()}
 invoke.onclick=()=>performAction(()=>open());model.onclick=()=>{show(modelDialog,model);modelDialog.querySelector("select").focus()};
 picker.querySelector('input').addEventListener('input',options);
 picker.addEventListener('keydown',e=>{const buttons=[...picker.querySelectorAll('[data-pick]')];if(['ArrowDown','ArrowUp'].includes(e.key)){e.preventDefault();const i=buttons.indexOf(document.activeElement);buttons[(i+(e.key==='ArrowDown'?1:-1)+buttons.length)%buttons.length]?.focus()}if(e.key==='Enter'&&e.target.matches('input')){e.preventDefault();buttons[0]?.click()}});
 const trigger=()=>{if(input.value==='/'||input.value==='@')performAction(()=>open(input.value==='/'?'capabilities':'refs',input.value))};input.addEventListener('input',e=>{if(!e.isComposing)trigger()});input.addEventListener('compositionend',trigger);
 async function openTask(id){await coordinator.flushDraft();const result=await api.chatNativeOpen({...owner(),task_id:id});await coordinator.selectSession(result.session_id);closeList();onTaskOpened();render();if(!state().snapshot.messages.length){await coordinator.send({text:'读取这个待办，继续在这里分析和讨论。',preserve_draft:true});render()}await load(true)}
 document.getElementById('chatView').addEventListener('click',e=>{const b=e.target.closest('[data-native-task]');if(b)performAction(()=>openTask(b.dataset.nativeTask))});
 function paint(){
  const s=getSession(),t=catalog?.tasks?.find(t=>t.id===s?.task_id);identity.innerHTML=s? s.task_id?`本会话对应待办 #${esc(s.task_id)} · ${esc(t?.state||'待读取')} <button type="button" data-read>查看最新内容</button>${s.source_session_id?` <button data-source="${esc(s.source_session_id)}">创建来源</button>`:''}`:'<button type="button" data-convert>整理为待办</button>':'';
  for(const button of identity.querySelectorAll('[data-convert],[data-read]'))button.disabled=active(s)||state().sending;
  identity.querySelector('[data-convert]')?.addEventListener('click',()=>performAction(async()=>{await coordinator.send({text:'把这段对话整理成当前项目的待办，并关联当前会话。',native_context:{capability:{id:'summarize',kind:'native',label:'整理为待办'},refs:[]},preserve_draft:true});render()}));
  identity.querySelector('[data-read]')?.addEventListener('click',()=>performAction(async()=>{await coordinator.send({text:'读取本会话对应待办的最新内容。',preserve_draft:true});render()}));
  identity.querySelector('[data-source]')?.addEventListener('click',e=>performAction(async()=>{await coordinator.selectSession(e.target.dataset.source);render()}));
 }
 function update(){
  const key=JSON.stringify(owner()),ownerChanged=key!==currentKey;if(ownerChanged){request++;currentKey=key;catalog=null;directory=''}
  const c=context();chips.innerHTML=[c.capability,...c.refs].filter(Boolean).map(x=>`<span>${esc(x.label)} <button type="button" aria-label="移除 ${esc(x.label)}" data-remove="${esc(x.kind+':'+x.id)}">×</button></span>`).join('');chips.querySelectorAll('[data-remove]').forEach(b=>b.onclick=()=>{const next=structuredClone(context());if(next.capability?.kind+':'+next.capability?.id===b.dataset.remove)next.capability=null;next.refs=next.refs.filter(x=>x.kind+':'+x.id!==b.dataset.remove);coordinator.setNativeContext(next);render();input.focus()});
  model.textContent='模型能力 · '+(state().configuration.reasoning_effort||'默认');model.title=state().configuration.model;invoke.disabled=model.disabled=!owner().project_id;
  const s=getSession();if((c.capability||c.refs.length)&&owner().project_id&&!active(s)&&!state().sending)document.getElementById('chatSendButton').disabled=false;
  paint();if(ownerChanged)void load();
 }
 const active=s=>['starting','running','waiting_approval','interrupting'].includes(s?.status);
 return {render:update,refresh:(force=true)=>load(force)};
}
