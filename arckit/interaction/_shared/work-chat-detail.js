/* Isolated interaction samples; no production service or Agent is called. */
(() => {
 const C=GlobalContext,esc=C.esc;
 const project=id=>({orbit:'atlas',feedback:'borealis'})[id]||id;
 function workTask(id){const item=C.state.pageObjects.Work?.find(t=>t.id===id);return item&&{id:item.id,project:project(item.project),title:item.name,content:C.state.drafts['Work:'+id]||item.name,state:'待处理',revision:1};}
 function detail(task){return `<section><h2>待办 ${esc(task.id)}</h2><p>${esc(task.state)}</p></section><section><h3>内容</h3><div style="white-space:pre-wrap;overflow-wrap:anywhere">${esc(task.content)}</div></section><section><h3>属性</h3><p>所属项目：${esc(task.project)}</p><p>优先级：${esc(task.priority??'普通')}</p></section><section><h3>协作</h3><p>暂无附件和评论。</p><label>评论草稿<textarea data-sample-comment="${esc(task.id)}">${esc(C.state.drafts['comment:'+task.id]||'')}</textarea></label></section>`;}
 document.addEventListener('input',e=>{if(e.target.dataset.sampleComment){C.state.drafts['comment:'+e.target.dataset.sampleComment]=e.target.value;C.save();}});
 if(document.body.dataset.page==='Work'){
  const root=document.getElementById('gc-page');
  const paint=()=>{const host=root.querySelector('.gc-object-detail');if(!host||host.querySelector('[data-work-chat]'))return;const task=workTask(host.dataset.selected);if(!task)return;host.insertAdjacentHTML('beforeend',`<div class="work-chat-sample">${detail(task)}<a data-work-chat href="../chat-workspace/default.html?workTask=${encodeURIComponent(task.id)}">打开 Chat</a></div>`);};
  new MutationObserver(paint).observe(root,{childList:true,subtree:true});paint();
 }else{
  const M=ChatModel,N=ChatNative,P=ChatPrototype,V=ChatViews,base=V.render;
  V.render=function(){base();const host=document.querySelector('.chat-sessions'),task=N.task(M.current()?.mainTask),mode=M.state.detailPanel||'sessions';
   host.querySelector('header h2').innerHTML=`<button data-detail-mode="sessions" aria-pressed="${mode==='sessions'}">会话列表</button><button data-detail-mode="detail" aria-pressed="${mode==='detail'}">待办详情</button>`;
   if(mode==='detail'){host.querySelectorAll('.session-groups,.native-search,footer').forEach(n=>n.hidden=true);host.insertAdjacentHTML('beforeend',`<div class="sample-task-detail">${task?(task.unavailable?'<p>待办不可访问，请恢复权限后重试。</p>':detail(task)):'<p>当前会话尚未关联待办。</p>'}</div>`);}
  };
  document.addEventListener('click',e=>{const button=e.target.closest('[data-detail-mode]');if(!button)return;M.state.detailPanel=button.dataset.detailMode;P.render();document.querySelector(`[data-detail-mode="${M.state.detailPanel}"]`)?.focus();M.save();});
  const open=N=>{M.state.detailPanel='detail';ChatNativeInput.openTask(N);P.render();};
  const id=new URLSearchParams(location.search).get('workTask'),task=workTask(id);
  if(task){const existing=N.task(id);if(existing)Object.assign(existing,{content:task.content,title:task.title});else M.state.tasks.push(task);open(id);}else P.render();
 }
})();
