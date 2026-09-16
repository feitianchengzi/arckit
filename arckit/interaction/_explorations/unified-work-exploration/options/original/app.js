(() => {
 const M=window.WorkModel,V=window.WorkViews,{esc,icon,button}=V;
 const dialog=document.getElementById('dialog');let toastTimer,returnFocus;
 function toast(text){const el=document.getElementById('toast');el.textContent=text;el.classList.add('show');clearTimeout(toastTimer);toastTimer=setTimeout(()=>el.classList.remove('show'),4200);}
 function render(){M.save();V.render();}
 function select(id){if(!M.state.tasks.some(t=>t.id===id))return;M.state.selected=id;M.state.tab='scene';render();}
 function selectFirst(){const tasks=M.visible();if(!tasks.some(t=>t.id===M.state.selected))M.state.selected=tasks[0]?.id||null;}
 function close(){if(dialog.open)dialog.close();dialog.className='';dialog.innerHTML='';if(returnFocus?.isConnected)returnFocus.focus();else document.querySelector('.composer textarea:not(:disabled)')?.focus({preventScroll:true});}
 function open(title,body,footer='',form=''){
  returnFocus=document.activeElement;dialog.className='';
  dialog.innerHTML=`${form?`<form data-form="${form}">`:''}<header class="dialog-heading"><h2 id="dialog-title">${title}</h2>${button('close',icon('close'),'icon-button','aria-label="关闭"')}</header><div class="dialog-body">${body}</div><div class="form-error" role="alert"></div>${footer?`<footer class="dialog-actions">${footer}</footer>`:''}${form?'</form>':''}`;
  if(!dialog.open)dialog.showModal();
  setTimeout(()=>dialog.querySelector('textarea,input:not([type=checkbox]),select')?.focus(),0);
 }
 const cancel=()=>button('close','取消');
 const submit=text=>`<button type="submit" class="primary">${text}</button>`;
 function newWork(){if(!M.state.newDraft&&M.state.scope!=='all')M.state.newProject=M.state.scope;open('从一句话开始',`<p>首条消息成功提交后，自然建立一件事情。执行人为你；先交流，不自动开始 Auto。</p><label class="field">所属项目<select name="project"><option value="">选择项目</option>${M.projects.map(p=>`<option value="${p.id}" ${M.state.newProject===p.id?'selected':''}>${p.name}</option>`).join('')}</select></label><label class="field">你想推进什么？<textarea name="intent" placeholder="例如：先分析一下移动端离线后，如何恢复未发送的评论。" required>${esc(M.state.newDraft)}</textarea></label><div class="suggestions">${button('example-new','分析移动端离线恢复','',`data-text="先分析移动端离线时如何保留未发送的评论，明确恢复联网后的行为。"`)}${button('example-new','整理本周反馈','',`data-text="帮我整理本周反馈，先找出重复问题，再讨论哪些值得推进。"`)}</div><p class="subtle" style="margin-top:18px;margin-bottom:0">也可以${button('new-form','用表单建立事情','text-button')}，保留精确录入方式。</p>`,cancel()+submit('发起并交流'),'new');}
 function chat(t){
  if(!t)return;M.state.selected=t.id;render();returnFocus=document.activeElement;
  dialog.className='chat-dialog';dialog.dataset.owner=t.id;
  dialog.innerHTML=`<header class="dialog-heading"><div><h2 id="dialog-title">围绕这件事交流</h2><p class="chat-header-sub">${esc(M.project(t.project).name)} · #${t.id} · ${esc(t.title)}</p></div>${button('close',icon('close'),'icon-button','aria-label="收起交流"')}</header><div class="chat-subbar">${V.tag(t)}<span>执行人 ${esc(t.assignee)}</span>${t.mode==='auto'?button('pause','暂停并讨论'):t.mode==='paused'?button('resume','继续 Auto','primary'):''}</div><div class="messages">${t.messages.length?t.messages.map(m=>`<div class="message ${m.role==='user'?'user':'agent'}"><div class="message-label">${m.role==='user'?'你':'ArcOrbit Agent · 模拟'}</div><p>${esc(m.text)}</p></div>`).join(''):`<div class="chat-empty">${icon('chat')}<h3>上下文已经在这里。</h3><p>你可以直接讨论当前目标，无需重新介绍事情。</p></div>`}</div><div class="form-error" role="alert"></div>${V.composer(t,true)}`;
  if(!dialog.open)dialog.showModal();
  const messages=dialog.querySelector('.messages');messages.scrollTop=messages.scrollHeight;
  dialog.querySelector('textarea:not(:disabled)')?.focus();
 }
 function autoConfirm(t){
  if(!['review','ready'].includes(t.status))throw new Error('本事情当前不适合启动新的 Auto，请使用恢复或验收入口。');
  open('将这件事情交给 Auto',`<p>从当前目标继续推进，沿用已有分析、补充要求与协作记录。</p><dl class="attributes"><dt>事情</dt><dd>#${t.id} · ${esc(t.title)}</dd><dt>项目</dt><dd>${esc(M.project(t.project).name)}</dd><dt>执行人</dt><dd>${esc(t.assignee)}（保持不变）</dd><dt>执行方式</dt><dd>本机 Auto · 同工作区串行</dd></dl><section class="notice"><strong>${t.status==='review'?'确认目标可处理，然后开始执行':'本次开始仅作用于这件事情'}</strong><p>${t.status==='review'?'这是待评审事情。开始后确认其可处理，并申请 Auto。':'不会开启整个项目的自动领取。'} 若工作区正忙，将进入等待队列。</p></section><p>原型用“演示控制 → 推进一个执行步骤”模拟后续进展。真实能力不在本页执行。</p>`,cancel()+button('confirm-auto',t.status==='review'?'确认可处理并开始':'开始 Auto','primary',`data-task="${t.id}"`));
 }
 function edit(t){open('编辑事情',`<label class="field">目标与内容<textarea name="body" required>${esc(t.body)}</textarea></label><div class="two-fields"><label class="field">执行人<select name="assignee">${['我','林舟','未分配'].map(x=>`<option ${t.assignee===x?'selected':''}>${x}</option>`).join('')}</select></label><label class="field">事情状态<select name="status">${Object.entries(M.states).map(([id,name])=>`<option value="${id}" ${t.status===id?'selected':''}>${name}</option>`).join('')}</select></label><label class="field">优先级<select name="priority">${['最高','高','中','低','无优先级'].map(x=>`<option ${t.priority===x?'selected':''}>${x}</option>`).join('')}</select></label><label class="field">标签<input name="tag" value="${esc(t.tag)}"></label></div><p>修改内容不会新建事情。运行期间改变执行人或业务状态，会暂停当前模拟执行并要求核对。</p><input type="hidden" name="owner" value="${t.id}">`,cancel()+submit('保存修改'),'edit');}
 function settings(){open('执行与连接',`<p>保留项目级执行准备、全局领取和跨项目并发入口。设置不随当前筛选隐式变化。</p><div class="settings-row"><div><strong>自动领取</strong><small>只消费符合条件的待处理事情。交流中的新事情保持待评审。</small></div><input type="checkbox" data-setting="autoClaim" aria-label="自动领取" ${M.state.autoClaim?'checked':''}></div>${M.projects.map(p=>`<div class="settings-row"><div><strong>${p.name}</strong><small>${M.state.config[p.id]?'本机工作区与执行准备已就绪':'执行准备缺失，暂时无法开始 Auto'}</small></div><input type="checkbox" data-project-config="${p.id}" aria-label="${p.name} 执行准备" ${M.state.config[p.id]?'checked':''}></div>`).join('')}<div class="settings-row"><div><strong>执行容量</strong><small>示例为 3 个工作区并行；同一工作区的不同事情串行。</small></div><span>${M.state.tasks.filter(t=>t.mode==='auto').length} / 3</span></div><p style="margin-top:20px;margin-bottom:0">正式产品的安装、认证、权限、CLI 接管与运行恢复入口仍需保留；本轮只演示结构和上述开关。</p>`,button('close','完成','primary'));}
 function demo(){open('演示控制',`<p>三份原型使用独立的本机数据。Agent 回应与执行为固定模拟，以下控件帮助检查关键状态。</p><div class="demo-actions">${button('demo-select','直接 Auto · #101','',`data-task="101"`)}${button('demo-select','先分析 · #102','',`data-task="102"`)}${button('demo-select','运行中介入 · #103','',`data-task="103"`)}${button('demo-select','处理决定 · #104','',`data-task="104"`)}${button('demo-select','检查与验收 · #105','',`data-task="105"`)}</div><div class="settings-row"><div><strong>离线</strong><small>保留已有内容和输入，写入失败；关闭后可原位重试。</small></div><input type="checkbox" data-setting="offline" aria-label="模拟离线" ${M.state.offline?'checked':''}></div><div class="settings-row"><div><strong>下次提交失败</strong><small>用于检查发起、交流或执行失败后的草稿保留。</small></div><input type="checkbox" data-setting="failNext" aria-label="下次提交失败" ${M.state.failNext?'checked':''}></div><div class="demo-actions">${button('advance','推进一个执行步骤','primary')}${button('simulate-failure','中断当前执行')}${button('reset-confirm','重置本方案数据')}</div><p>语音仅预留入口，不访问麦克风。刷新保留事情、输入草稿与模拟进度；不会重放发起请求。</p>`,button('close','返回体验'));}
 function resources(){open('项目资料与专业视图',`<p>生命周期作为稳定可达的专业视角保留。当前范围：${V.scopeName()}。</p><div class="resource-grid">${[['产品资料','理念、规格、交互与技术事实'],['需求与反馈','原始反馈、来源与待办关联'],['代码与变更','源码、Diff、终端与 Git'],['验证与验收','测试结果、独立验收问题'],['发布与交付','构建、发布记录与交付证据'],['组织与能力','成员、权限与可用技能']].map(([title,desc])=>button('resource-preview',`<span><strong>${title}</strong><small style="display:block;color:var(--muted);margin-top:5px">${desc}</small></span>`,'',`data-resource="${title}"`)).join('')}</div><p style="margin-top:20px;margin-bottom:0">本轮展示入口与归属，不模拟这些专业工具的完整操作。原有能力仍从事情现场或项目资源进入。</p>`,button('close','返回工作现场'));}
 function decision(t){open('决定下一步',`<p>${esc(t.decision||'根据当前分析确认下一步。')}</p><div class="decision-options">${button('decide','保留源记录入口，移动后仍可追溯','',`data-choice="保留源记录入口，移动后仍可追溯"`)}${button('decide','本次仅移动内容，记录保持在原项目','',`data-choice="本次仅移动内容，记录保持在原项目"`)}</div><p style="margin-top:18px;margin-bottom:0">选择后将决定交给本事情，继续原 Auto。也可以先交流，决定保持未解决。</p>`,button('chat','先讨论'), '');}
 function preservePaint(){const scrolls=[...document.querySelectorAll('.work-scroll,.task-rows,.attention-main')].map(e=>[e.className,e.scrollTop,e.scrollLeft]);render();for(const[c,y,x]of scrolls){const el=document.querySelector('.'+c.split(' ')[0]);if(el){el.scrollTop=y;el.scrollLeft=x;}}}
 function handle(action,el){
  const t=el.dataset.task?M.state.tasks.find(x=>x.id===el.dataset.task):M.current();
  switch(action){
   case 'close':close();break;
   case 'new':newWork();break;
   case 'new-form':open('创建事情',`<label class="field">所属项目<select name="project">${M.projects.map(p=>`<option value="${p.id}" ${M.state.newProject===p.id?'selected':''}>${p.name}</option>`).join('')}</select></label><label class="field">事情内容<textarea name="intent" required>${esc(M.state.newDraft)}</textarea><small>执行人为你，初始为待评审。创建后可以直接操作、交流或选择 Auto。</small></label>`,cancel()+submit('创建事情'),'new-manual');break;
   case 'example-new':{const input=dialog.querySelector('[name=intent]');input.value=el.dataset.text;M.state.newDraft=el.dataset.text;M.save();input.focus();break;}
   case 'select':select(el.dataset.task);break;
   case 'demo-select':M.state.scope=t.project;M.state.filter='all';M.state.query='';select(t.id);close();break;
   case 'project':M.state.scope=el.dataset.project;M.state.filter='all';M.state.query='';selectFirst();render();break;
   case 'scope-all':M.state.scope='all';M.state.filter=M.view==='attention'?'all':'attention';M.state.query='';if(M.view==='attention')M.state.selected=null;else selectFirst();render();break;
   case 'all-tasks':M.state.scope='all';M.state.filter='all';M.state.query='';if(M.view==='attention'){open('所有事情',M.state.tasks.map(x=>button('choose-one',`<span>#${x.id} · ${esc(x.title)}</span>`,'task-row',`data-task="${x.id}"`)).join(''),button('close','关闭'));}else{selectFirst();render();}break;
   case 'clear-filters':M.state.filter='all';M.state.query='';selectFirst();render();break;
   case 'close-detail':M.state.selected=null;render();break;
   case 'choose-task':open('切换事情',`<p>${V.scopeName()} · 切换时保留每件事情的目标、执行与输入草稿。</p>${M.visible().map(x=>button('choose-one',`<span>#${x.id} · ${esc(x.title)}</span>`,'task-row',`data-task="${x.id}"`)).join('')}`,button('close','关闭'));break;
   case 'choose-one':select(t.id);close();break;
   case 'tab':M.state.tab=el.dataset.tab;render();break;
   case 'chat':chat(t);break;
   case 'analyze':{if(!t)break;M.send(t,'先分析这件事情的目标、范围与验收口径，暂不开始 Auto。');render();toast('分析已出现在工作现场，消息保持收起。');break;}
   case 'auto':autoConfirm(t);break;
   case 'confirm-auto':M.start(t);render();close();toast(t.mode==='queued'?'已进入 Auto 队列，执行人保持不变。':'Auto 已开始，目标与交流记录保持连续。');break;
   case 'pause':M.writable();if(t.mode!=='auto')throw new Error('当前没有可暂停的执行。');t.mode='paused';M.record(t,'用户暂停执行并进入讨论，已完成工作保留');M.save();render();chat(t);toast('模拟执行已暂停。讨论不会自动恢复 Auto。');break;
   case 'resume':M.writable();if(t.mode!=='paused')throw new Error('只有已暂停的执行可以继续。');if(t.pending.length){M.record(t,'已采用暂停前的补充要求：'+t.pending.join('；'));t.pending=[];}M.restore(t);M.record(t,'用户继续 Auto，沿用原事情的协作上下文');render();close();toast('已继续 Auto。');break;
   case 'stop':open('停止当前执行',`<p>停止“${esc(t.title)}”的 Auto。已完成操作和协作记录保留；这不会把事情标记为完成或取消。</p>`,cancel()+button('confirm-stop','停止执行','primary'));break;
   case 'confirm-stop':M.writable();t.mode='stopped';M.record(t,'用户停止 Auto，未完成事实保留');render();close();toast('执行已停止，事情状态保留。可编辑状态后重新安排。');break;
   case 'unqueue':M.writable();t.mode='manual';M.record(t,'用户撤回本次 Auto 请求');render();toast('已退出 Auto 队列，事情仍保留。');break;
   case 'decision':decision(t);break;
   case 'decide':M.writable();M.message(t,'user',el.dataset.choice);M.record(t,'用户决定：'+el.dataset.choice);t.mode='auto';t.decision='';render();close();toast('决定已提交，原 Auto 继续。');break;
   case 'recheck':M.writable();t.mode='auto';if(!t.plan.length)t.plan=['确认外部条件','继续验证','整理结果'];M.record(t,'模拟重新检查通过，继续原执行');render();toast('示例外部条件已就绪，继续执行。');break;
   case 'recover':M.restore(t);M.record(t,'用户恢复原执行并重新核对事实');render();toast('已恢复本次模拟执行。');break;
   case 'unblock':M.writable();t.status='ready';t.mode='manual';M.record(t,'用户将事情恢复为待处理');render();break;
   case 'edit':edit(t);break;
   case 'accept':M.writable();if(t.status!=='completed'||t.issues.some(x=>!x.resolved))throw new Error('请先处理未解决的验收问题。');t.status='accepted';t.mode='accepted';M.record(t,'用户确认验收通过');render();toast('已验收，成果与记录保留。');break;
   case 'issue':open('提出独立验收问题',`<p>关联 #${t.id}，保留原事情的完成结果；问题单独记录与跟进。</p><label class="field">发现了什么问题？<textarea name="issue" required placeholder="描述复现条件与预期结果…"></textarea></label>`,cancel()+submit('提交验收问题'),'issue');break;
   case 'resolve-issue':M.writable();t.issues[Number(el.dataset.index)].resolved=true;M.record(t,'示例验收问题已解决');render();toast('已模拟解决，可继续验收。');break;
   case 'comment':open('添加协作评论','<label class="field">评论内容<textarea name="comment" required></textarea><small>团队评论与 Agent 交流分开保存，避免混淆消息对象。</small></label>',cancel()+submit('保存评论'),'comment');break;
   case 'artifact':open('工作结果摘要',`<p>${esc(t.title)}</p><section class="analysis-block"><h3>结果示例</h3><p>本事情的目标已按示例计划推进。此处演示产物独立于消息存在，刷新或收起交流后仍可访问。</p></section><p style="margin-top:20px">当前没有真实文件变更、构建或测试结果。正式产品在这里链接真实产物。</p>`,button('close','返回现场'));break;
   case 'evidence':open('证据与运行详情',`<p>诊断信息按需展开，不占据默认工作现场。以下均为原型身份与模拟记录。</p><dl class="attributes"><dt>事情</dt><dd>#${t.id}</dd><dt>协作身份</dt><dd>${esc(t.thread)}</dd><dt>推进方式</dt><dd>${M.modes[t.mode]}</dd><dt>修订</dt><dd>${t.revision}</dd><dt>执行进展</dt><dd>${Math.min(t.step,t.plan.length)} / ${t.plan.length}</dd></dl><p>正式映射保留 Run / Case / Loop、工具活动、权限、耗时与 Token、文件证据及 CLI 接管；这些专业能力本轮未模拟。</p>`,button('close','返回现场'));break;
   case 'voice':open('同一件事，同一个交流入口','<p>未来语音会把转写后的要求交给当前事情，与文字使用相同上下文。完整消息仍按需展开。</p><p>本原型不录音、不访问麦克风、不合成播报。语音输入、播报开关与停止执行将分别控制。</p>',button('close','知道了','primary'));break;
   case 'model':open('本事情的交流配置',`<p>这里保留模型与推理强度选择的位置。选项仅为演示，不承诺真实可用模型。</p><label class="field">模型<select name="model">${['默认模型','快速模型','深度模型'].map(x=>`<option ${t.model===x?'selected':''}>${x}</option>`).join('')}</select></label><label class="field">强度<select name="level">${['默认强度','较低','较高'].map(x=>`<option ${t.level===x?'selected':''}>${x}</option>`).join('')}</select></label>`,cancel()+submit('保存'),'model');break;
   case 'filters':open('事情筛选','<p>当前原型提供状态和全文搜索。正式整合在这里继续保留执行人、创建人、优先级、标签、日期等筛选，以及父子关系显示。</p><p>所有筛选只改变观察范围，不改变 Auto 队列和任务状态。</p>',button('close','返回'));break;
   case 'resources':resources();break;
   case 'resource-preview':open(esc(el.dataset.resource),`<p>当前范围：${V.scopeName()}。</p><section class="notice"><strong>专业视图入口示意</strong><p>用于验证生命周期能力在项目下的可发现性。本轮没有接入此专业视图的数据与操作。</p></section><p>正式实现可直接打开完整工具，也可由当前事情打开并携带对象引用；打开视图不会更改事情状态。</p>`,button('resources','返回项目资源')+button('close','关闭'));break;
   case 'settings':settings();break;
   case 'demo':demo();break;
   case 'advance':M.advance();render();close();toast('模拟执行已推进一步；打开的消息保持收起。');break;
   case 'simulate-failure':if(!t||t.mode!=='auto')throw new Error('请先选择一件正在 Auto 的事情。');t.mode='failed';M.record(t,'模拟执行中断，现场已保留');render();close();break;
   case 'reset-confirm':open('重置本方案的体验进度','<p>清除此方案的模拟事情、消息和草稿，恢复初始示例。其他方案不受影响。</p>',cancel()+button('reset','重置本方案','primary'));break;
   case 'reset':M.reset();render();close();toast('已恢复本方案的初始示例。');break;
  }
 }
 document.addEventListener('click',event=>{
  const el=event.target.closest('[data-action]');if(!el||el.disabled)return;
  try{handle(el.dataset.action,el);}catch(error){if(dialog.open){const target=dialog.querySelector('.form-error');if(target)target.textContent=error.message;else toast(error.message);}else toast(error.message);}
 });
 document.addEventListener('input',event=>{
  const el=event.target;
  if(el.matches('[data-form=message] textarea')){const t=M.state.tasks.find(x=>x.id===el.closest('form').dataset.owner);if(t)t.draft=el.value;M.save();}
  if(el.matches('[name=intent]')){M.state.newDraft=el.value;M.save();}
  if(el.id==='search'){const caret=el.selectionStart;M.state.query=el.value;selectFirst();render();const input=document.getElementById('search');input.focus();input.setSelectionRange(caret,caret);}
 });
 document.addEventListener('change',event=>{
  const el=event.target;
  if(el.id==='view-picker'){location.href='workbench.html?view='+el.value;return;}
  if(el.id==='state-filter'){M.state.filter=el.value;selectFirst();render();return;}
  if(el.matches('[name=project]')){M.state.newProject=el.value;M.save();}
  if(el.dataset.setting){M.state[el.dataset.setting]=el.checked;preservePaint();}
  if(el.dataset.projectConfig){M.state.config[el.dataset.projectConfig]=el.checked;M.save();}
 });
 document.addEventListener('submit',event=>{
  const form=event.target;if(!form.dataset.form||!form.isConnected)return;event.preventDefault();
  const data=new FormData(form);const t=form.dataset.owner?M.state.tasks.find(x=>x.id===form.dataset.owner):M.current();
  try {
   switch(form.dataset.form){
    case 'new':case 'new-manual':{const created=M.create(data.get('intent'),data.get('project'),form.dataset.form==='new');render();close();toast(`已建立 #${created.id}，执行人为你。${form.dataset.form==='new'?'可以继续交流，或选择 Auto。':''}`);break;}
    case 'message':{const isChat=dialog.open&&dialog.contains(form);M.send(t,data.get('message'));preservePaint();if(isChat)chat(t);toast(t.mode==='auto'?'已接收，下一执行边界生效。':'要求已记入当前事情，工作现场已更新。');break;}
    case 'edit':{M.writable();const owner=M.state.tasks.find(x=>x.id===data.get('owner'));const changedControl=owner.assignee!==data.get('assignee')||owner.status!==data.get('status');owner.body=String(data.get('body')).trim();if(!owner.body)throw new Error('目标不能为空。');owner.title=owner.body.split('\n')[0].slice(0,55);owner.assignee=data.get('assignee');owner.status=data.get('status');owner.priority=data.get('priority');owner.tag=data.get('tag');if(changedControl&&M.ownsLane(owner)){owner.mode='failed';M.record(owner,'状态或执行人变化，当前执行暂停等待核对');}else if(owner.status==='accepted')owner.mode='accepted';else if(owner.status==='completed')owner.mode='done';else if(changedControl)owner.mode='manual';M.record(owner,'用户更新事情内容或属性');render();close();toast('已保存。Agent 后续使用同一份目标。');break;}
    case 'issue':M.writable();if(t.status!=='completed')throw new Error('仅已完成的事情可以提出验收问题。');if(!String(data.get('issue')).trim())throw new Error('请输入验收问题。');t.issues.push({text:String(data.get('issue')).trim(),resolved:false});M.record(t,'新增独立验收问题');M.state.tab='results';render();close();break;
    case 'comment':M.writable();if(!String(data.get('comment')).trim())throw new Error('请输入评论。');(t.comments??=[]).push(String(data.get('comment')).trim());M.record(t,'用户添加协作评论');render();close();break;
    case 'model':t.model=data.get('model');t.level=data.get('level');render();close();toast('已保存本事情配置，不改变协作身份。');break;
   }
  } catch(error){const errorEl=dialog.open?dialog.querySelector('.form-error'):null;if(errorEl)errorEl.textContent=error.message;else toast(error.message);}
 });
 document.addEventListener('keydown',event=>{
  if(event.isComposing)return;
  if(event.key==='Enter'&&(event.metaKey||event.ctrlKey)&&event.target.closest('[data-form=message]')){event.preventDefault();event.target.closest('form').requestSubmit();}
 });
 dialog.addEventListener('cancel',event=>{event.preventDefault();close();});
 if(!M.visible().some(t=>t.id===M.state.selected)&&M.view!=='attention')selectFirst();
 V.render();
 window.WorkPrototype={model:M,render,openChat:chat};
})();
