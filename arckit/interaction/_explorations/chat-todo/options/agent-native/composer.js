// Candidate composer interaction only. No real skill, file or native tool is called.
window.Composer=(()=>{
 const dialog=$('#context-picker');let triggerElement=null,token='',category='all';
 const capabilities=[
  {id:'create',kind:'原生能力',label:'创建待办',detail:'在当前项目记下另一件事'},
  {id:'summarize',kind:'原生能力',label:'整理为待办',detail:'把当前讨论整理为对应待办，沿用本会话'},
  {id:'diagnose',kind:'Skill',label:'问题诊断',detail:'arckit-debug-diagnosis · 用证据定位问题'}
 ];
 const files=[{id:'file-chat',kind:'文件',label:'chat-workspace/interaction.md',detail:'当前项目 · 对话交互说明'}];
 const context=()=>{const s=current();s.composeContext||={capability:null,refs:[]};return s.composeContext};
 function candidates(){return [...(category!=='refs'?capabilities:[]),...(category!=='capabilities'?[...files,...state.tasks.filter(t=>t.project===current().workspace).map(t=>({id:t.id,kind:'待办',label:t.title,detail:t.id+' · 引用内容，不切换会话'}))]:[])]}
 function results(){
  const q=$('#picker-search').value.toLowerCase(),items=candidates().filter(x=>(x.label+x.kind+x.detail).toLowerCase().includes(q));
  $('#picker-results').innerHTML=['调用能力','引用上下文'].map(group=>{
   const rows=items.filter(x=>(['原生能力','Skill'].includes(x.kind)?'调用能力':'引用上下文')===group);
   return rows.length?`<section><small>${group}</small>${rows.map(x=>`<button type="button" data-pick="${x.id}" class="pick-option"><span>${esc(x.label)} <em>${esc(x.kind)}</em></span><small>${esc(x.detail)}</small></button>`).join('')}</section>`:'';
  }).join('')||'<p class="empty">没有匹配项，换个关键词试试。</p>';
 }
 function close(restore=true){dialog.close();if(restore)triggerElement?.focus()}
 function open(mode='all',prefix=''){
  if(dialog.open)return;triggerElement=document.activeElement;category=mode;token=prefix;
  $('#picker-search').value='';results();
  const rect=$('#composer').getBoundingClientRect();
  dialog.style.left=Math.max(12,Math.min(rect.left,innerWidth-372))+'px';
  dialog.style.bottom=Math.max(12,innerHeight-rect.top+8)+'px';
  dialog.style.maxHeight=Math.max(160,Math.min(420,rect.top-20))+'px';
  dialog.showModal();$('#picker-search').focus();
 }
 function select(item){
  const c=context();
  if(['原生能力','Skill'].includes(item.kind))c.capability=item;
  else if(!c.refs.some(r=>r.id===item.id))c.refs.push(item);
  if(token&&$('#draft').value===token){$('#draft').value='';current().draft=''}
  persist();render();if(dialog.open)close(false);$('#draft').focus();
 }
 function render(){
  const c=context();
  const all=[...(c.capability?[{...c.capability,slot:'capability'}]:[]),...c.refs.map(x=>({...x,slot:x.id}))];
  $('#composer-context').innerHTML=all.map(x=>`<span class="context-chip"><span>${esc(x.kind)} · ${esc(x.label)}</span><button type="button" data-remove-context="${x.slot}" aria-label="移除${esc(x.label)}">×</button></span>`).join('');
  $('#draft').placeholder=c.capability?.id==='create'?'描述要在当前项目记下的事情…':'发送消息；/ 调用能力，@ 引用上下文…';
 }
 $('#invoke').onclick=()=>open();$('#picker-close').onclick=()=>close();
 dialog.addEventListener('cancel',e=>{e.preventDefault();close()});
 dialog.addEventListener('click',e=>{const button=e.target.closest('[data-pick]');if(button)select(candidates().find(x=>x.id===button.dataset.pick))});
 $('#picker-search').oninput=results;
 dialog.addEventListener('keydown',e=>{
  const buttons=[...dialog.querySelectorAll('[data-pick]')],index=buttons.indexOf(document.activeElement);
  if(e.key==='ArrowDown'||e.key==='ArrowUp'){e.preventDefault();buttons[(index+(e.key==='ArrowDown'?1:-1)+buttons.length)%buttons.length]?.focus()}
  if(e.key==='Enter'&&document.activeElement.id==='picker-search'){e.preventDefault();buttons[0]?.click()}
 });
 $('#composer-context').onclick=e=>{const b=e.target.closest('[data-remove-context]');if(!b)return;const c=context();if(b.dataset.removeContext==='capability')c.capability=null;else c.refs=c.refs.filter(x=>x.id!==b.dataset.removeContext);persist();render();$('#draft').focus()};
 $('#draft').addEventListener('compositionend',()=>api.trigger());
 const api={render,open,choose:id=>select(capabilities.find(x=>x.id===id)),trigger:()=>{const text=$('#draft').value;if(text==='/'||text==='@')open(text==='/'?'capabilities':'refs',text)},take:()=>{
  const c=context(),copy=JSON.parse(JSON.stringify(c));current().composeContext={capability:null,refs:[]};persist();render();return copy;
 }};
 render();return api;
})();
