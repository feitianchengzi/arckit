(() => {
 const M=window.WorkModel,V=window.WorkViews,D=window.WorkDetails,{esc,icon,button}=V;
 const dialog=document.getElementById('dialog');let returnFocus,toastTimer,composing=false;
 function toast(text){const el=document.getElementById('toast');el.textContent=text;el.classList.add('show');clearTimeout(toastTimer);toastTimer=setTimeout(()=>el.classList.remove('show'),3600);}
 function capture(){
  for(const el of document.querySelectorAll('[data-scroll-key]'))if(!el.closest('[inert]'))M.state.reading[el.dataset.scrollKey]={top:el.scrollTop,left:el.scrollLeft,bottom:el.scrollHeight-el.scrollTop-el.clientHeight<35};
 }
 function render({follow=false}={}){
  capture();const active=document.activeElement,runtimeFocus=active?.closest('.runtime-status-host')?{action:active.dataset.action,task:active.dataset.task}:null,field=active?.matches('.composer textarea,#search')?{selector:active.id?'#'+active.id:'.composer textarea',owner:active.closest('form')?.dataset.owner,start:active.selectionStart,end:active.selectionEnd}:null;
  M.save();V.render();
  for(const el of document.querySelectorAll('[data-scroll-key]')){const pos=M.state.reading[el.dataset.scrollKey];if(pos){el.scrollTop=follow&&el.classList.contains('messages')&&pos.bottom?el.scrollHeight:pos.top;el.scrollLeft=pos.left;}else if(el.classList.contains('messages'))el.scrollTop=el.scrollHeight;}
  if(runtimeFocus&&M.state.runOpen&&!dialog.open){const el=runtimeFocus.action?document.querySelector('[data-action="'+runtimeFocus.action+'"]'+(runtimeFocus.task?'[data-task="'+runtimeFocus.task+'"]':'')):document.querySelector('.runtime-popover');el?.focus({preventScroll:true});}
  if(field&&!dialog.open){const el=document.querySelector(field.selector);if(el&&(!field.owner||el.closest('form')?.dataset.owner===field.owner)){el.focus({preventScroll:true});el.setSelectionRange(field.start,field.end);}}
 }
 function closeRuntime(focus=false){M.state.runOpen=false;document.querySelector('.runtime-popover')?.remove();const trigger=document.querySelector('[data-action=runtime-status]');trigger?.setAttribute('aria-expanded','false');if(focus)trigger?.focus({preventScroll:true});}
 function selectFirst(){const items=M.visible();if(!items.some(t=>t.id===M.state.selected)){M.state.selected=items[0]?.id||null;M.state.surface='detail';M.state.tab='scene';}}
 function select(id){if(!M.state.tasks.some(t=>t.id===id))return;M.state.selected=id;M.state.surface='detail';M.state.tab='scene';M.state.listOpen=false;render();}
 function close(){if(dialog.open)dialog.close();dialog.innerHTML='';dialog.className='';if(returnFocus?.isConnected)returnFocus.focus({preventScroll:true});}
 function open(title,body,footer='',form=''){
  returnFocus=document.activeElement;dialog.dataset.owner=M.current()?.id||'';dialog.dataset.revision=M.current()?.revision??'';
  dialog.className='';dialog.innerHTML=`${form?`<form data-form="${form}">`:''}<header class="dialog-heading"><h2 id="dialog-title">${title}</h2>${button('close',icon('close'),'icon-button','aria-label="关闭"')}</header><div class="dialog-body">${body}</div><div class="form-error" role="alert"></div>${footer?`<footer class="dialog-actions">${footer}</footer>`:''}${form?'</form>':''}`;
  if(!dialog.open)dialog.showModal();setTimeout(()=>dialog.querySelector('textarea,input:not([type=checkbox]),select')?.focus(),0);
 }
 const cancel=()=>button('close','取消');const submit=text=>`<button type="submit" class="primary">${text}</button>`;
 function chat(t){if(!t)return;if(dialog.open)close();M.state.selected=t.id;M.state.surface='chat';M.state.listOpen=false;render();document.querySelector('.message-popover textarea:not(:disabled)')?.focus({preventScroll:true});}
 function closeChat(){M.state.surface='detail';render();document.querySelector('.detail-base .composer [data-action=chat]')?.focus({preventScroll:true});}
 function newWork(manual=false){
  if(!M.state.newDraft&&M.state.scope!=='all')M.state.newProject=M.state.scope;
  open(manual?'创建事情':'开始一件新的事情',`<p>${manual?'记录目标与完成标准，准备好后开始推进。':'说说你想做什么，我们从这里一起往前走。'}</p><label class="field">所属项目<select name="project"><option value="">选择项目</option>${M.projects.map(p=>`<option value="${p.id}" ${M.state.newProject===p.id?'selected':''}>${p.name}</option>`).join('')}</select></label><label class="field">${manual?'事情内容':'你想推进什么？'}<textarea name="intent" placeholder="例如：分析移动端离线恢复，先明确行为，再考虑实现。" required>${esc(M.state.newDraft)}</textarea></label><div class="new-owner"><span class="avatar">G</span><span>执行人：我</span><span class="subtle">待评审 · 先交流</span></div>${manual?'':`<div class="suggestions" style="margin-top:20px">${button('fill-intent','分析离线恢复方案','',`data-text="先分析移动端离线时如何保留未发送的评论，明确恢复联网后的行为。"`)}${button('fill-intent','整理本周反馈','',`data-text="整理本周反馈中的重复问题，一起判断哪些需要推进。"`)}</div>`}`,button(manual?'new':'new-manual',manual?'从交流开始':'用表单创建','quiet')+cancel()+submit(manual?'创建事情':'发起并交流'),manual?'new-manual':'new');
 }
 function autoConfirm(t){open('开始 Auto',`<p>沿用当前目标和协作记录，持续推进这件事情。</p><dl class="attributes"><dt>事情</dt><dd>${esc(t.title)}</dd><dt>项目</dt><dd>${esc(M.project(t.project).name)}</dd><dt>执行人</dt><dd>${esc(t.assignee)}</dd></dl><section class="notice"><strong>${t.status==='review'?'确认这件事情已可以处理':'准备开始执行'}</strong><p>当前工作区繁忙时会进入队列。你可以随时补充要求，或暂停后讨论。</p></section>`,cancel()+button('confirm-auto',t.status==='review'?'确认并开始':'开始 Auto','primary',`data-task="${t.id}"`));}
 function edit(t){open('编辑事情',`<label class="field">目标与内容<textarea name="body" required>${esc(t.body)}</textarea></label><div class="two-fields"><label class="field">执行人<select name="assignee">${['我','林舟','未分配'].map(x=>`<option ${t.assignee===x?'selected':''}>${x}</option>`).join('')}</select></label><label class="field">事情状态<select name="status">${Object.entries(M.states).map(([id,name])=>`<option value="${id}" ${t.status===id?'selected':''}>${name}</option>`).join('')}</select></label><label class="field">优先级<select name="priority">${['最高','高','中','低','无优先级'].map(x=>`<option ${t.priority===x?'selected':''}>${x}</option>`).join('')}</select></label><label class="field">标签<input name="tag" value="${esc(t.tag)}"></label></div><p>更改执行人或状态后，正在进行的 Auto 将暂停，等待核对。</p>`,cancel()+submit('保存修改'),'edit');}
 function settings(){open('执行与连接',`<div class="settings-row"><div><strong>自动领取</strong><small>自动处理符合条件的待处理事情。交流中的事情保持待评审。</small></div><input type="checkbox" data-setting="autoClaim" aria-label="自动领取" ${M.state.autoClaim?'checked':''}></div>${M.projects.map(p=>`<div class="settings-row"><div><strong>${p.name}</strong><small>允许在此设备运行 Auto</small></div><input type="checkbox" data-project-config="${p.id}" aria-label="${p.name} 本机执行" ${M.state.config[p.id]?'checked':''}></div>`).join('')}<div class="settings-row"><div><strong>并行执行</strong><small>不同项目工作区最多同时运行 3 件事情</small></div><span>${M.state.tasks.filter(t=>t.mode==='auto').length} / 3</span></div>`,button('close','完成','primary'));}
 function resources(){open('资料与专业视图',`<p>${V.scopeName()} · 按工作内容进入专业视图</p><div class="resource-grid">${[['产品资料','理念、规格、交互与技术事实'],['需求与反馈','反馈来源与事情关联'],['代码与变更','源码、Diff 与 Git'],['验证与验收','测试结果与验收问题'],['发布与交付','构建与发布记录'],['组织与能力','成员与可用能力']].map(([title,desc])=>button('resource',`<span><strong>${title}</strong><small style="display:block;margin-top:7px;color:var(--muted)">${desc}</small></span>`,'',`data-resource="${title}"`)).join('')}</div>`,button('close','返回工作'));}
 function decide(t){open('确认下一步',`<p>${esc(t.decision)}</p><div class="decision-options">${button('confirm-decision','保留源记录入口，移动后仍可追溯','',`data-choice="保留源记录入口，移动后仍可追溯"`)}${button('confirm-decision','本次仅移动内容，记录留在原项目','',`data-choice="本次仅移动内容，记录留在原项目"`)}</div>`,button('chat','先讨论','quiet'));}
 function handle(action,el){
  const t=M.state.tasks.find(x=>x.id===(el.dataset.task||(dialog.open&&dialog.contains(el)?dialog.dataset.owner:M.state.selected)));
  switch(action){
   case 'runtime-status':if(M.state.runOpen){closeRuntime(true);}else{M.state.runOpen=true;M.state.listOpen=false;render();document.querySelector('.runtime-popover')?.focus({preventScroll:true});}break;
   case 'close-runtime':closeRuntime(true);break;
   case 'runtime-select':closeRuntime();M.state.scope=t.project;M.state.filter='all';M.state.query='';M.state.assigneeFilter='all';M.state.priorityFilter='all';select(t.id);document.querySelector('.detail-base [data-action=properties]')?.focus({preventScroll:true});break;
   case 'runtime-settings':closeRuntime();settings();break;
   case 'adjust-direction':{const p=window.WorkProgress.ensure(t),value=t.pendingDirection||p;open('调整接下来的安排',`<p>${t.mode==='auto'?'当前工作继续，新安排在下一执行边界生效。':t.mode==='paused'?'保存后保持暂停；准备好后再继续 Auto。':'明确接下来关注什么，已有进展保持记录。'}</p><label class="field">下一步<textarea name="next" required>${esc(value.next)}</textarea></label><label class="field">当前计划（可选，每行一项）<textarea name="plan" placeholder="有明确安排时再填写，可留空。">${esc(value.plan.join('\n'))}</textarea></label>`,cancel()+submit(t.mode==='auto'?'提交调整':'保存安排'),'direction');break;}
   case 'properties':open('事情属性',V.properties(t),button('edit','编辑属性','primary'));dialog.classList.add('properties-dialog');break;
   case 'edit-criteria':if(t.status==='accepted')throw new Error('已验收的标准保留只读。');D.ensure(t);open('完成与验收标准','<p>与概览、成果与验收共用；每行填写一条可检查的标准。</p><label class="field">标准<textarea name="criteria" required>'+esc(t.criteria.map(x=>x.text).join('\n'))+'</textarea></label>',cancel()+submit('保存标准'),'criteria');break;
   case 'add-material':open('添加参考资料','<label class="field">名称<input name="name" required></label><label class="field">资料内容或链接<textarea name="content" required></textarea></label><label class="form-check"><input name="included" type="checkbox" checked>加入 Agent 后续工作的上下文</label>',cancel()+submit('添加资料'),'material');break;
   case 'view-material':{const x=t.materials[Number(el.dataset.index)];open(esc(x.name),'<p class="section-caption">'+esc(x.kind)+' · '+(x.included?'已加入后续上下文':'未加入上下文')+'</p><div class="document-preview">'+esc(x.content)+'</div>',button('remove-material','移除资料','quiet',`data-index="${el.dataset.index}"`)+button('close','返回'));break;}
   case 'toggle-context':{M.writable();const x=t.materials[Number(el.dataset.index)];x.included=!x.included;M.record(t,(x.included?'加入上下文：':'移出上下文：')+x.name,{actor:'我',kind:'collaboration'});render();toast(x.included?'已加入后续上下文；当前步骤保持不变。':'已从后续上下文移出。');break;}
   case 'remove-material':M.writable();M.record(t,'移除资料：'+t.materials[Number(el.dataset.index)].name,{actor:'我',kind:'collaboration'});t.materials.splice(Number(el.dataset.index),1);close();render();break;
   case 'add-agreement':case 'edit-agreement':case 'message-agreement':case 'comment-agreement':{D.ensure(t);const index=Number(el.dataset.index),x=action==='edit-agreement'?t.agreements[index]:null;const text=x?.text||(action==='message-agreement'?t.messages[index].text:action==='comment-agreement'?t.comments[index]:'');open(x?'编辑共同约定':'保存共同约定','<label class="field">约定内容<textarea name="agreement" required>'+esc(text)+'</textarea></label><label class="form-check"><input type="checkbox" name="accepted" '+(x?.accepted?'checked':'')+'>确认采纳，供后续工作沿用</label><p class="section-caption">未采纳的内容作为建议保留。</p>',cancel()+submit('保存约定'),'agreement');dialog.dataset.agreementIndex=x?index:'';dialog.dataset.messageIndex=action==='message-agreement'?index:(x?.messageIndex??'');dialog.dataset.source=x?.source||(action==='message-agreement'?'协作消息':action==='comment-agreement'?'协作留言':'手动添加');break;}
   case 'adopt-agreement':M.writable();t.agreements[Number(el.dataset.index)].accepted=true;M.record(t,'采纳约定：'+t.agreements[Number(el.dataset.index)].text,{actor:'我',kind:'decision',messageIndex:t.agreements[Number(el.dataset.index)].messageIndex});render();toast('约定已采纳，概览同步更新。');break;
   case 'comment-agent':t.draft='请根据这条补充继续分析：\n'+t.comments[Number(el.dataset.index)];chat(t);toast('已放入输入框，发送后交给 Agent。');break;
   case 'message-context':chat(t);{const node=document.querySelector('[data-message-index="'+Number(el.dataset.index)+'"]');if(node){node.scrollIntoView({block:'center'});node.classList.add('message-highlight');}}break;
   case 'view-output':{const x=D.outputs(t)[Number(el.dataset.index)];open(esc(x.name),'<p class="section-caption">'+esc(x.kind)+' · '+esc(x.version)+'</p><div class="document-preview">'+esc(x.content)+'</div>',button('close','返回详情'));break;}
   case 'add-output':open('添加成果','<label class="field">成果名称<input name="name" required></label><label class="field">内容或成果链接<textarea name="content" required></textarea></label>',cancel()+submit('保存成果'),'output');break;
   case 'activity-filter':M.state.activityFilter=el.dataset.filter;render();break;
   case 'new-child':open('添加子事情','<p>关联父事情 #'+t.id+' · '+esc(t.title)+'</p><label class="field">目标与内容<textarea name="child" required></textarea></label>',cancel()+submit('创建子事情'),'child');break;
   case 'close':close();break;
   case 'select':select(t.id);break;
   case 'toggle-list':M.state.listOpen=!M.state.listOpen;render();break;
   case 'project':M.state.scope=el.dataset.project;M.state.filter='all';M.state.query='';M.state.assigneeFilter='all';M.state.priorityFilter='all';selectFirst();M.state.surface='detail';M.state.listOpen=false;render();break;
   case 'scope-all':case 'all-tasks':M.state.scope='all';M.state.filter=action==='scope-all'?'attention':'all';M.state.query='';M.state.assigneeFilter='all';M.state.priorityFilter='all';selectFirst();M.state.listOpen=false;render();break;
   case 'clear-filters':M.state.filter='all';M.state.query='';M.state.assigneeFilter='all';M.state.priorityFilter='all';selectFirst();render();break;
   case 'new':newWork();break;
   case 'new-manual':newWork(true);break;
   case 'fill-intent':dialog.querySelector('[name=intent]').value=el.dataset.text;M.state.newDraft=el.dataset.text;M.save();dialog.querySelector('[name=intent]').focus();break;
   case 'chat':chat(t);break;
   case 'close-chat':closeChat();break;
   case 'tab':M.state.tab=el.dataset.tab;render();break;
   case 'analyze':M.send(t,'先分析这件事情的目标、范围与验收口径，暂不开始 Auto。');M.state.surface='chat';render({follow:true});break;
   case 'auto':autoConfirm(t);break;
   case 'confirm-auto':M.start(t);close();render();toast(t.mode==='queued'?'已加入 Auto 队列。':'Auto 已开始，可以随时补充要求。');break;
   case 'pause':M.writable();if(t.mode!=='auto')throw new Error('当前执行状态已变化，请刷新后核对。');t.mode='paused';M.record(t,'你暂停了执行，开始讨论');chat(t);toast('执行已暂停，准备好后可以继续。');break;
   case 'resume':if(t.mode!=='paused')throw new Error('当前执行已经不处于暂停状态。');M.restore(t);if(t.pending.length){M.record(t,'已采用补充要求：'+t.pending.join('；'));t.pending=[];}close();render();toast('Auto 已继续。');break;
   case 'stop':open('停止执行',`<p>停止“${esc(t.title)}”的 Auto，保留已经完成的工作。事情不会被标记为完成或取消。</p>`,cancel()+button('confirm-stop','停止执行','primary'));break;
   case 'confirm-stop':M.writable();if(t.status!=='progress'||!['auto','paused'].includes(t.mode))throw new Error('执行状态已经变化，无需停止。');t.mode='stopped';M.record(t,'你停止了当前执行');close();render();toast('执行已停止，工作内容已保留。');break;
   case 'recover':M.restore(t);render();toast('已恢复本次执行。');break;
   case 'unqueue':M.writable();t.mode='manual';M.record(t,'你撤回了 Auto 请求');render();break;
   case 'unblock':M.writable();t.status='ready';t.mode='manual';M.record(t,'事情已恢复为待处理');render();break;
   case 'recheck':M.restore(t);M.record(t,'已重新检查并继续');render();break;
   case 'decision':decide(t);break;
   case 'confirm-decision':if(t.mode!=='decision')throw new Error('这个决定已处理，请查看最新状态。');M.restore(t);M.message(t,'user',el.dataset.choice);D.ensure(t);t.agreements.push({text:el.dataset.choice,accepted:true,source:'用户决定',messageIndex:t.messages.length-1});M.record(t,'你决定：'+el.dataset.choice,{actor:'我',kind:'decision',messageIndex:t.messages.length-1});t.decision='';close();render();toast('决定已提交，Auto 继续。');break;
   case 'edit':edit(t);break;
   case 'accept':M.writable();if(!D.canAccept(t))throw new Error('请确认验收标准并处理尚未解决的问题。');t.status='accepted';t.mode='accepted';M.record(t,'你确认验收通过',{actor:'我',kind:'result'});render();toast('已验收。');break;
   case 'issue':open('提出验收问题',`<p>关联 #${t.id} · ${esc(t.title)}</p><label class="field">问题与预期结果<textarea name="issue" required placeholder="描述出现问题的条件与期望行为…"></textarea></label>`,cancel()+submit('提交问题'),'issue');break;
   case 'resolve-issue':M.writable();t.issues[Number(el.dataset.index)].resolved=true;M.record(t,'验收问题已标记解决：'+t.issues[Number(el.dataset.index)].text,{actor:'我',kind:'result'});render();break;
   case 'comment':open('添加评论','<label class="field">评论内容<textarea name="comment" required></textarea></label>',cancel()+submit('保存评论'),'comment');break;
   case 'artifact':M.state.tab='results';close();render();break;
   case 'evidence':M.state.tab='activity';close();render();break;
   case 'model':open('交流配置',`<label class="field">模型<select name="model">${['默认模型','快速模型','深度模型'].map(x=>`<option ${t.model===x?'selected':''}>${x}</option>`).join('')}</select></label><label class="field">推理强度<select name="level">${['默认强度','较低','较高'].map(x=>`<option ${t.level===x?'selected':''}>${x}</option>`).join('')}</select></label>`,cancel()+submit('保存'),'model');break;
   case 'filters':open('筛选事情',`<label class="field">执行人<select name="assigneeFilter">${[['all','全部'],['我','我'],['林舟','林舟'],['未分配','未分配']].map(([id,name])=>`<option value="${id}" ${M.state.assigneeFilter===id?'selected':''}>${name}</option>`).join('')}</select></label><label class="field">优先级<select name="priorityFilter">${['all','最高','高','中','低','无优先级'].map(x=>`<option value="${x}" ${M.state.priorityFilter===x?'selected':''}>${x==='all'?'全部':x}</option>`).join('')}</select></label>`,cancel()+submit('应用筛选'),'filters');break;
   case 'resources':resources();break;
   case 'resource':{const title=el.dataset.resource,items=M.state.tasks.filter(x=>M.state.scope==='all'||x.project===M.state.scope);open(esc(title),`<p>${V.scopeName()}</p><div class="resource-lines">${items.slice(0,4).map(x=>`<div class="resource-line"><strong>${esc(x.title)}</strong><small>${M.states[x.status]} · ${esc(M.project(x.project).name)}</small>${button('open-related','打开相关事情','text-button',`data-task="${x.id}"`)}</div>`).join('')}</div>`,button('resources','返回项目资源'));break;}
   case 'open-related':close();select(t.id);break;
   case 'settings':settings();break;
  }
 }
 document.addEventListener('click',event=>{const el=event.target.closest('[data-action]');if(M.state.runOpen&&!event.target.closest('.runtime-status-host'))closeRuntime();if(!el||el.disabled)return;try{handle(el.dataset.action,el);}catch(error){showError(error);}});
 function showError(error){const el=dialog.open?dialog.querySelector('.form-error'):null;if(el)el.textContent=error.message;else toast(error.message);}
 document.addEventListener('input',event=>{
  const el=event.target;
  if(el.matches('.composer textarea')){const owner=M.state.tasks.find(t=>t.id===el.closest('form').dataset.owner);if(owner)owner.draft=el.value;M.save();}
  if(el.name==='intent'){M.state.newDraft=el.value;M.save();}
  if(el.id==='search'){M.state.query=el.value;selectFirst();render();}
 });
 document.addEventListener('change',event=>{const el=event.target;if(el.matches('[data-criterion]')){try{M.writable();const t=M.current();if(t.status!=='completed')throw new Error('当前不能更改验收结论。');const c=t.criteria[Number(el.dataset.criterion)];c.checked=el.checked;M.record(t,(c.checked?'确认通过：':'撤回确认：')+c.text,{actor:'我',kind:'result'});render();}catch(error){el.checked=!el.checked;showError(error);}return;}if(el.id==='state-filter'){M.state.filter=el.value;selectFirst();render();}if(el.name==='project'){M.state.newProject=el.value;M.save();}if(el.dataset.setting){M.state[el.dataset.setting]=el.checked;render();}if(el.dataset.projectConfig){M.state.config[el.dataset.projectConfig]=el.checked;M.save();}});
 document.addEventListener('submit',event=>{
  const form=event.target;if(!form.dataset.form||!form.isConnected)return;event.preventDefault();const data=new FormData(form);const t=M.state.tasks.find(x=>x.id===(form.dataset.owner||dialog.dataset.owner));
  try{
   switch(form.dataset.form){
    case 'direction':if(t.revision!==Number(dialog.dataset.revision))throw new Error('工作有了新的进展，请核对后重新调整；输入内容已保留。');window.WorkProgress.change(t,String(data.get('next')),String(data.get('plan')));close();render();toast(t.mode==='auto'?'已提交，将在下一执行边界生效。':'安排已保存。');break;
    case 'criteria':{M.writable();if(t.status==='accepted')throw new Error('事情已验收，标准不能修改。');D.ensure(t);const lines=String(data.get('criteria')).split('\n').map(x=>x.trim()).filter(Boolean);if(!lines.length)throw new Error('请填写至少一条标准。');t.criteria=lines.map(text=>({text,checked:t.criteria.some(x=>x.text===text&&x.checked)}));M.record(t,'更新完成与验收标准',{actor:'我',kind:'decision'});close();render();break;}
    case 'material':case 'output':{M.writable();D.ensure(t);const name=String(data.get('name')).trim(),content=String(data.get('content')).trim();if(!name||!content)throw new Error('请填写名称和内容。');if(form.dataset.form==='material'){t.materials.push({id:'material-'+Date.now(),name,content,kind:/^https?:\/\//i.test(content)?'链接':'文档',author:'我',included:data.has('included')});M.record(t,'添加资料：'+name,{actor:'我',kind:'collaboration'});}else{t.outputs.push({id:'output-'+Date.now(),name,content,kind:'成果',version:'版本 v1'});M.record(t,'添加成果：'+name,{actor:'我',kind:'result'});}close();render();break;}
    case 'agreement':{M.writable();const text=String(data.get('agreement')).trim();if(!text)throw new Error('请填写约定。');const x={text,accepted:data.has('accepted'),source:dialog.dataset.source};if(dialog.dataset.messageIndex!=='')x.messageIndex=Number(dialog.dataset.messageIndex);if(dialog.dataset.agreementIndex!=='')t.agreements[Number(dialog.dataset.agreementIndex)]=x;else t.agreements.push(x);M.record(t,(x.accepted?'确认约定：':'保存待确认约定：')+text,{actor:'我',kind:'decision',messageIndex:x.messageIndex});close();render();toast(x.accepted?'已采纳，概览同步更新。':'已保存，可在资料与协作中采纳。');break;}
    case 'child':{const text=String(data.get('child')).trim();if(!text)throw new Error('请描述子事情。');const parent=t.id,child=M.create(text,t.project,false);child.parent=parent;D.ensure(child);M.record(t,'创建子事情 #'+child.id+'：'+child.title,{actor:'我',kind:'collaboration'});M.state.selected=parent;close();render();toast('已创建子事情，执行人为你。');break;}
    case 'new':case 'new-manual':{const isChat=form.dataset.form==='new';M.create(data.get('intent'),data.get('project'),isChat);M.state.surface=isChat?'chat':'detail';M.state.listOpen=false;close();render({follow:true});toast('事情已建立，执行人为你。');break;}
    case 'message':M.send(t,data.get('message'));render({follow:true});if(t.mode==='auto')toast('已收到补充要求，将在下一步采用。');else if(M.state.surface!=='chat')toast('工作内容已更新。');break;
    case 'edit':{M.writable();if(t.revision!==Number(dialog.dataset.revision))throw new Error('事情有了新的进展。已保留你的修改，请关闭后核对最新内容再编辑。');const body=String(data.get('body')).trim();if(!body)throw new Error('目标不能为空。');const changed=t.assignee!==data.get('assignee')||t.status!==data.get('status');if(t.body!==body){D.ensure(t);t.criteria.forEach(x=>x.checked=false);}t.body=body;t.title=body.split('\n')[0].slice(0,55);t.assignee=data.get('assignee');t.status=data.get('status');t.priority=data.get('priority');t.tag=data.get('tag');if(changed&&M.ownsLane(t)){t.mode='failed';M.record(t,'归属或状态变化，执行暂停等待核对');}else if(changed)t.mode=t.status==='accepted'?'accepted':t.status==='completed'?'done':'manual';M.record(t,'你更新了事情内容与属性',{actor:'我',kind:'decision'});close();render();toast('已保存修改。');break;}
    case 'issue':M.writable();if(t.status!=='completed')throw new Error('当前状态不能提出验收问题。');if(!String(data.get('issue')).trim())throw new Error('请输入问题。');t.issues.push({text:String(data.get('issue')).trim(),resolved:false});M.record(t,'新增验收问题：'+String(data.get('issue')).trim(),{actor:'我',kind:'result'});M.state.surface='detail';M.state.tab='results';close();render();break;
    case 'comment':M.writable();if(!String(data.get('comment')).trim())throw new Error('请输入评论。');(t.comments??=[]).push(String(data.get('comment')).trim());M.record(t,'你添加了评论：'+String(data.get('comment')).trim(),{actor:'我',kind:'collaboration'});close();render();break;
    case 'model':t.model=data.get('model');t.level=data.get('level');M.save();close();render();break;
    case 'filters':M.state.assigneeFilter=data.get('assigneeFilter');M.state.priorityFilter=data.get('priorityFilter');selectFirst();close();render();break;
   }
  }catch(error){showError(error);}
 });
 document.addEventListener('toggle',event=>{if(event.target.matches('details[data-plan-owner]')){M.state.expandedPlans??={};M.state.expandedPlans[event.target.dataset.planOwner]=event.target.open;M.save();}},true);
 document.addEventListener('compositionstart',()=>composing=true);document.addEventListener('compositionend',()=>composing=false);
 document.addEventListener('keydown',event=>{if(event.isComposing)return;if(event.key==='Enter'&&(event.metaKey||event.ctrlKey)&&event.target.closest('[data-form=message]')){event.preventDefault();event.target.closest('form').requestSubmit();}if(event.key==='Escape'&&!dialog.open){if(M.state.runOpen){event.preventDefault();closeRuntime(true);}else if(M.state.listOpen){M.state.listOpen=false;render();}else if(M.state.surface==='chat'){event.preventDefault();closeChat();}}});
 dialog.addEventListener('cancel',event=>{event.preventDefault();close();});
 M.state.reading??={};M.state.runOpen=false;M.state.surface='detail';M.state.listOpen=false;selectFirst();V.render();
 function tick(){if(composing||M.state.offline)return;if(!M.state.tasks.some(t=>['auto','queued'].includes(t.mode))&&!M.state.autoClaim)return;try{M.advance();render({follow:true});}catch(error){showError(error);}}
 if(new URLSearchParams(location.search).get('autoplay')!=='off')setInterval(tick,15000);
 window.WorkPrototype={model:M,render,openChat:chat,tick};
})();
