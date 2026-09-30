/* Shared task conversation scenarios. Local simulation only; never starts Runtime. */
(() => {
  const M=ChatModel,V=ChatViews,P=ChatPrototype;
  const render=V.render,send=M.send,tick=M.tick;
  function delivery(message) { return ({queued:'等待送达',delivered:'已送达',unknown:'送达未确认'})[message.delivery] || ''; }
  V.render=function(){
    render();const s=M.current();if(!s?.autoMode)return;
    const controls=document.querySelector('.chat-compose-controls');
    if(s.autoMode==='running') {
      controls.querySelector('[data-chat-action=stop]')?.remove();
      controls.insertAdjacentHTML('beforeend',`<button type="submit" class="primary" ${s.draft.trim()?'':'disabled'}>补充信息</button><button type="button" data-task-conversation="pause">暂停并接管</button>`);
    } else controls.insertAdjacentHTML('beforeend','<button type="button" data-task-conversation="resume">继续 Auto</button>');
    document.querySelector('.chat-compose-note').textContent=s.autoMode==='running'?'Auto 正在执行；补充信息进入同一对话。':'Auto 已暂停；讨论不自动恢复执行。';
    s.messages.forEach((m,i)=>{if(m.delivery)document.querySelector(`[data-message="${i}"] .message-byline`)?.insertAdjacentHTML('beforeend',`<span>${delivery(m)}</span>`);});
  };
  M.send=function(){
    const s=M.current();if(s?.autoMode!=='running')return send();
    if(!s.draft.trim())return;
    s.messages.push({role:'user',text:s.draft.trim(),delivery:'queued'});s.draft='';M.save();return s;
  };
  M.tick=function(){
    const s=M.current();if(s?.autoMode!=='running')return tick();
    const pending=s.messages.find(m=>m.delivery==='queued');if(!pending)return false;
    pending.delivery=M.state.autoDeliveryUnknown?'unknown':'delivered';M.save();return true;
  };
  document.addEventListener('click',e=>{
    const button=e.target.closest('[data-task-conversation]');if(!button)return;
    const s=M.current();s.autoMode=button.dataset.taskConversation==='pause'?'paused':'running';s.status=s.autoMode==='running'?'running':'interrupted';
    s.messages.push({role:'assistant',text:s.autoMode==='running'?'Auto 在同一对话继续执行。':'自动推进已暂停，可以继续讨论。'});M.save();P.render();
  });
  function scenario(name){
    const s=M.current();if(!s)return;
    if(name==='auto-running') {s.autoMode='running';s.status='running';s.messages.push({role:'assistant',text:'Auto 正在同一待办对话中执行。'});}
    if(name==='auto-unknown')M.state.autoDeliveryUnknown=true;
    if(name==='auto-recover')M.state.autoDeliveryUnknown=false;
    P.render();
  }
  window.TaskConversationPrototype={scenario};
  window.addEventListener('message',e=>{if(new URLSearchParams(location.search).get('scenarioTools')==='on'&&e.source===parent&&e.data?.type==='chat-auto-scenario')scenario(e.data.name);});
  P.render();
})();
