(() => {
 const C=window.GlobalContext,{esc}=C;
 const native=window.ChatViews||window.WorkViews;
 const page=native?(window.ChatViews?'Chat':'Thing'):document.body.dataset.page;
 const header=document.createElement('header');header.className='gc-topbar';header.setAttribute('aria-label','全局顶部栏');
 const nav=C.pages.map(([name])=>`<a href="${C.href(name)}" ${name===page?'aria-current="page"':''}>${name}</a>`).join('');
 header.innerHTML=`<details class="gc-navigation"><summary aria-label="页面导航">☰</summary><nav>${nav}</nav></details><details class="gc-scope"><summary>产品范围</summary><div class="gc-scope-content"><label><span>产品集</span><select id="gc-set" aria-label="当前产品集">${C.sets.map(s=>`<option value="${s.id}">${s.name}</option>`).join('')}</select></label><label><span>查看</span><select id="gc-project" aria-label="产品观察范围"></select></label><button id="gc-manage" title="管理当前产品集">管理</button></div></details><details class="gc-controls"><summary id="gc-compact-status">状态与操作</summary><div class="gc-controls-content"><details id="gc-sync"><summary id="gc-sync-label">尚未同步</summary><div class="gc-popup"><p id="gc-sync-detail"></p></div></details><details id="gc-runtime"><summary id="gc-runtime-label">运行状态</summary><div class="gc-popup"><strong>所有已授权产品 · 本设备</strong><div id="gc-runs"></div><label><input id="gc-enabled" type="checkbox">自动领取</label><button id="gc-pause">暂停领取</button></div></details><a class="gc-feedback" href="../product-feedback-center/default.html" title="给 ArcOrbit 提反馈" aria-label="产品反馈"><svg class="gc-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 5h14v11H9l-4 3V5Z"></path><path d="M8 9h8M8 12h6"></path></svg><strong>产品反馈</strong></a><button id="gc-refresh" class="gc-icon-button" title="同步任务源" aria-label="同步任务源"><svg class="gc-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M20 7v5h-5M4 17v-5h5"></path><path d="M6.2 8A7 7 0 0 1 18.8 7M17.8 16A7 7 0 0 1 5.2 17"></path></svg></button><button class="gc-icon-button" data-account-open title="设置" aria-label="设置"><svg class="gc-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="3"></circle><path d="M12 3v2M12 19v2M3 12h2M19 12h2M5.6 5.6 7 7M17 17l1.4 1.4M18.4 5.6 17 7M7 17l-1.4 1.4"></path></svg></button></div></details>`;
 const q=id=>header.querySelector('#'+id);
 const compact=matchMedia('(max-width:760px)');
 function fit(){for(const cls of ['gc-scope','gc-controls'])header.querySelector('.'+cls).open=!compact.matches;}
 compact.addEventListener('change',fit);fit();
 const dialog=document.createElement('dialog');dialog.className='gc-dialog';dialog.innerHTML='<form method="dialog"><h2>设置</h2><p>账户与本机配置作用于整个应用。</p><button>关闭</button></form>';document.body.append(dialog);
 function paint(){
  q('gc-set').value=C.state.set;
  q('gc-project').innerHTML='<option value="all">全部产品</option>'+C.projects.filter(p=>C.sets.find(s=>s.id===C.state.set).ids.includes(p.id)).map(p=>`<option value="${p.id}">${p.name}</option>`).join('');q('gc-project').value=C.state.project;
  header.querySelector('.gc-scope>summary').textContent=C.projects.find(p=>p.id===C.state.project)?.name||C.sets.find(s=>s.id===C.state.set).name;
  const label=({none:'尚未同步',syncing:'同步中',healthy:'已同步',error:'部分同步失败',offline:'未登录'})[C.state.sync];
  q('gc-sync-label').textContent=label;q('gc-compact-status').textContent=label;q('gc-sync-detail').textContent=`任务源 / Work / Feedback：${label}。${C.state.time?'最近成功同步 '+new Date(C.state.time).toLocaleTimeString():'尚无成功同步时间'}。${C.state.sync==='error'?'Feedback 来源失败，保留最近可信内容。':''}Git 资料与 Agent 对话不属于此同步状态。`;
  q('gc-refresh').disabled=C.state.sync==='syncing'||C.state.sync==='offline';
  q('gc-runtime-label').textContent=C.state.attention?.length?'运行 · '+C.state.attention.length+' 项待处理':C.state.runs.length?'运行中 '+C.state.runs.length:C.state.queue?.length?'排队 '+C.state.queue.length:'运行空闲';
  const groups=[['需要处理',C.state.attention||[]],['正在执行',C.state.runs],['等待执行',C.state.queue||[]]];
  q('gc-runs').innerHTML=groups.filter(([,items])=>items.length).map(([title,items])=>`<section><h3>${title}</h3>${items.map(r=>`<button data-gc-run="${r.id}">${esc(C.projects.find(p=>p.id===r.project)?.name)} · ${esc(r.title)}</button>`).join('')}</section>`).join('')||'<p>没有活动执行</p>';
  q('gc-enabled').checked=C.state.enabled;q('gc-pause').disabled=!C.state.enabled;q('gc-pause').textContent=C.state.paused?'继续领取':'暂停领取';
 }
 const manage=document.createElement('dialog');manage.className='gc-dialog';manage.setAttribute('aria-label','管理产品集');document.body.append(manage);
 q('gc-manage').onclick=()=>{const set=C.sets.find(s=>s.id===C.state.set);manage.innerHTML=`<form><h2>管理 ${esc(set.name)}</h2><p>选择要展示的产品；不改变本地关联或自动执行授权。</p><fieldset><legend>展示产品</legend>${C.projects.map(p=>`<label style="display:block;padding:8px"><input type="checkbox" name="project" value="${p.id}" ${set.ids.includes(p.id)?'checked':''}> ${esc(p.name)}</label>`).join('')}</fieldset><p><button type="button" data-cancel>取消</button> <button type="submit">保存推进范围</button></p></form>`;manage.showModal();manage.querySelector('[data-cancel]').onclick=()=>manage.close();manage.querySelector('form').onsubmit=e=>{e.preventDefault();const ids=[...manage.querySelectorAll('[name=project]:checked')].map(e=>e.value);C.state.setMembers={...C.state.setMembers,[set.id]:ids};set.ids=ids;manage.close();scope='';C.change('all');if(native)native.render();};};
 manage.addEventListener('close',()=>q('gc-manage').focus());
 q('gc-set').onchange=e=>C.change('all',e.target.value);q('gc-project').onchange=e=>C.change(e.target.value);
 q('gc-enabled').onchange=e=>{C.state.enabled=e.target.checked;if(window.WorkModel){WorkModel.state.autoClaim=C.state.enabled;WorkModel.save();}C.emit();};
 q('gc-pause').onclick=()=>{C.state.paused=!C.state.paused;C.emit();};
 q('gc-refresh').onclick=()=>{C.state.sync='syncing';C.emit();setTimeout(()=>{C.state.sync=C.state.failSync?'error':'healthy';if(!C.state.failSync)C.state.time=Date.now();C.emit();},300);};
 header.addEventListener('click',e=>{const run=[...C.state.runs,...C.state.queue||[],...C.state.attention||[]].find(r=>r.id===e.target.closest('[data-gc-run]')?.dataset.gcRun);if(run){C.change(run.project,C.sets.find(s=>s.ids.includes(run.project)).id);C.remember('Thing',run.id);if(page==='Thing'){WorkModel.state.selected=run.id;WorkViews.render();q('gc-runtime').open=false;}else location.href=C.href('Thing');}if(e.target.closest('[data-account-open]')&&!document.getElementById('account-dialog'))dialog.showModal();});
 document.addEventListener('keydown',e=>{if(e.key!=='Escape'||document.querySelector('dialog[open]'))return;const open=[...header.querySelectorAll('details[open]')].filter(d=>compact.matches||!d.matches('.gc-scope,.gc-controls')).at(-1);if(open){e.preventDefault();e.stopImmediatePropagation();open.open=false;open.querySelector('summary').focus();}},true);
 document.addEventListener('click',e=>{if(!header.contains(e.target))header.querySelectorAll('details[open]').forEach(d=>{if(compact.matches||!d.matches('.gc-scope,.gc-controls'))d.open=false;});});
 let scope='';
 const chatId=id=>({atlas:'orbit',borealis:'feedback'})[id]||id;
 function adopt(){
  if(!native)return;
  const next=C.scopeKey();if(scope===next)return;
  const M=window.ChatModel||window.WorkModel;
  if(window.ChatModel){
   const items=M.state.sessions.filter(s=>C.includes(chatId(s.project)));
   const valid=M.current()&&C.includes(chatId(M.current().project));
   const keepDraft=scope&&!M.current()&&C.includes(chatId(M.state.newDraft.project));
   const currentDraft=keepDraft?{...M.state.newDraft}:null;
   M.state.selected=valid?M.current().id:keepDraft?'':C.state.selections['Chat:'+C.scopeKey()]===''?'':C.select('Chat',items,'');
   if(!M.state.selected&&keepDraft)M.state.newDraft=currentDraft;
   else if(!M.state.selected){const p=M.state.projects.find(p=>C.includes(chatId(p.id)));M.state.newDraft={model:M.state.newDraft.model,level:M.state.newDraft.level,draft:'',...C.state.drafts['chat-new:'+p?.id],project:p?.id||''};}
  }else{
   const items=M.state.tasks.filter(t=>C.includes(t.project));M.state.selected=C.select('Thing',items,M.current()?.id);M.state.scope=C.state.project;
   M.state.filter='all';M.state.query='';M.state.assigneeFilter='all';M.state.priorityFilter='all';M.state.surface='detail';M.state.newProject=C.ids()[0]||'';
  }
  scope=next;M.save();
 }
 C.before(()=>{
  if(!native)return;const M=window.ChatModel||window.WorkModel;
  C.remember(page,M.state.selected);
  if(window.ChatModel){const s=M.current();if(s)s.scroll=document.querySelector('.chat-thread')?.scrollTop||0;else C.state.drafts['chat-new:'+M.state.newDraft.project]={...M.state.newDraft};}
  M.save();
 });
 function attach(){
  if(!native){document.querySelector('.gc-stage').prepend(header);paint();return;}
  const old=document.querySelector('.topbar');
  const toggle=old?.querySelector('[data-chat-action=toggle-list],[data-action=toggle-list]');
  if(toggle){toggle.classList.add('gc-local-toggle');(document.querySelector('.chat-heading')||document.querySelector('.message-popup-header .popup-heading')||document.querySelector('.work-meta')||document.querySelector('.workspace')).prepend(toggle);}
  old?.replaceWith(header);
  document.querySelectorAll('.sidebar-bottom>.connection,.sidebar-bottom>.sync-state').forEach(el=>el.remove());
  document.querySelectorAll('.page-navigation a').forEach(a=>{a.removeAttribute('target');});
  if(window.ChatModel){const s=ChatModel.current();if(s&&s.scroll!==null)document.querySelector('.chat-thread').scrollTop=s.scroll;}
  if(window.WorkModel){C.state.runs=WorkModel.state.tasks.filter(t=>t.mode==='auto').map(t=>({id:t.id,project:t.project,title:t.title,phase:'running'}));C.state.queue=WorkModel.state.tasks.filter(t=>t.mode==='queued').map(t=>({id:t.id,project:t.project,title:t.title}));C.state.attention=WorkModel.state.tasks.filter(t=>['decision','paused','external','failed'].includes(t.mode)).map(t=>({id:t.id,project:t.project,title:t.title}));C.save();}
  paint();
 }
 if(native){const original=native.render;native.render=()=>{header.remove();adopt();original();attach();};adopt();native.render();}
 else attach();
 C.on(()=>{const changed=scope!==C.scopeKey();adopt();if(native&&changed){if(window.ChatPrototype)ChatPrototype.render({capturePosition:false});else WorkPrototype.render();}else paint();});
 window.GlobalShell={paint,header,chatId};
})();
