(() => {
 const M=ChatModel,N=ChatNative,V=ChatViews,{esc}=V;
 const button=(action,label,extra='')=>`<button type="button" data-native-action="${action}" ${extra}>${label}</button>`;
 function chips(c,editable=false){return [...(c?.capability?[{...c.capability,slot:'capability'}]:[]),...(c?.refs||[]).map(r=>({...r,slot:r.id}))].map(x=>`<span class="native-chip"><span>${esc(x.kind)} · ${esc(x.label)}</span>${editable?button('remove','×',`data-id="${x.slot}" aria-label="移除${esc(x.label)}"`):''}</span>`).join('')}
 function card(id){const t=N.task(id);if(!t)return '<p>待办已不可访问，历史内容保留。</p>';const same=t.thread===M.current()?.thread;return button('task',`<span><strong>${esc(t.title)}</strong><small>${t.id} · ${esc(t.state)}</small><small>${same?'对应当前会话':'从本会话创建 · '+(t.thread?'已有独立对话':'尚未开始独立对话')}</small></span><span>${same?'当前会话':t.thread?'打开对话 →':'开始对话 →'}</span>`,`class="native-card" data-id="${id}"`)}
 const base=V.render;
 V.render=function(){
  base();N.init();const s=M.current(),o=M.owner(),c=N.context(),t=N.task(s?.mainTask);
  const head=document.querySelector('.chat-heading-actions');
  if(head)head.insertAdjacentHTML('afterbegin',button('convert',s.mainTask?'已对应待办':'整理为待办',s.mainTask||M.active(s)?'disabled':''));
  if(t){const p=document.querySelector('.chat-heading p');p.innerHTML=`本会话对应待办 ${button('read',`${esc(t.id)} · ${esc(t.state)} · 查看最新内容`,`data-id="${t.id}"`)}`;if(t.sourceSession&&t.sourceSession!==s.id){const source=M.state.sessions.find(x=>x.id===t.sourceSession);p.innerHTML+=source?` · ${button('source','创建于：'+esc(source.title),`data-id="${source.id}"`)}`:' · 来源会话已删除'}}
  document.querySelector('.chat-compose-controls').insertAdjacentHTML('afterbegin',button('invoke','＋ 能力与引用','aria-haspopup="dialog"'));
  document.querySelector('#chat-input').insertAdjacentHTML('beforebegin',`<div class="native-chips" id="native-chips">${chips(c,true)}</div>`);
  document.querySelector('#chat-input').placeholder=c.capability?.id==='create'?'描述要在当前项目记下的事情…':'发送消息；/ 调用能力，@ 引用上下文…';
  document.querySelector('.chat-compose-controls a').remove();
  document.querySelectorAll('.chat-compose-controls label').forEach(el=>el.remove());
  document.querySelector('[data-native-action=invoke]').insertAdjacentHTML('afterend',button('model-settings',`模型能力 · ${esc(o.level)}`,`aria-haspopup="dialog" title="${esc(o.model)} · ${esc(o.level)}"`));
  const submit=document.querySelector('#chat-compose button[type=submit]');if(submit)submit.disabled=(!o.draft.trim()&&!N.hasContext())||!M.project(o.project)?.ready;
  document.querySelector('.chat-sessions > header').insertAdjacentHTML('afterend',`<label class="native-search"><span class="sr-only">搜索会话</span><input id="native-search" value="${esc(M.state.nativeSearch||'')}" placeholder="搜索会话" aria-label="搜索列表"></label>`);
  for(const row of document.querySelectorAll('.session-row')){const session=M.state.sessions.find(x=>x.id===row.dataset.id);row.hidden=Boolean(M.state.nativeSearch&&!session?.title.includes(M.state.nativeSearch))}
  if(s)for(const [i,m]of s.messages.entries()){
   const el=document.querySelector(`[data-message="${i}"]`);if(!el)continue;
   if(m.context)el.querySelector('.message-byline').insertAdjacentHTML('afterend',`<div class="native-chips">${chips(m.context)}</div>`);
   for(const [j,tool]of (m.tools||[]).entries())el.insertAdjacentHTML('beforeend',`<details data-disclosure="native-${i}-${j}"><summary>${esc(tool.label)}</summary><p>${esc(tool.detail)}</p></details>`);
   if(m.card)el.insertAdjacentHTML('beforeend',card(m.card));
  }
 };
 window.ChatNativeViews={chips,button};
})();
