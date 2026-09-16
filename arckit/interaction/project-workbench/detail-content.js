/* Local prototype fixtures and detail projections; no repository or service reads. */
(() => {
 const M=window.WorkModel;
 const fixture={
  '101':{criteria:['方向键切换事情，Enter 进入详情，Esc 返回列表','切换事情后，输入草稿和列表位置保持','输入文字时，方向键不触发事情切换'],materials:[{name:'键盘操作约定',kind:'文档',content:'列表获得焦点时支持方向键选择。\nEnter 将焦点移入详情，Esc 返回原列表项。\n输入框内的方向键交由文本编辑处理。',included:true}],agreements:[{text:'本次保留鼠标操作路径，仅补充键盘导航。',accepted:true,source:'事情要求'}]},
  '102':{criteria:['明确离线、恢复联网、重启应用三种场景','区分已保存内容与尚未发送的草稿','说明提交冲突、失败重试和恢复入口'],materials:[{name:'离线恢复场景记录',kind:'文档',content:'场景一：输入评论时断网，保留尚未发送的内容。\n场景二：重新联网，刷新服务器状态后再提交。\n场景三：应用重新打开，恢复逐事情草稿，不自动重发。',included:true}],agreements:[{text:'先确认恢复行为，本次分析不直接修改同步实现。',accepted:true,source:'事情要求'},{text:'恢复联网后，由用户确认重试，避免重复提交。',accepted:false,source:'方案建议'}],outputs:[{name:'离线恢复方案 · 初稿',kind:'方案',version:'草稿 v1',content:'目标\n让用户在离线与重启后继续未完成的输入。\n\n建议行为\n1. 按事情保存草稿，切换页面不丢失。\n2. 离线提交保留原文，显示重试入口。\n3. 恢复连接后先刷新事实，冲突时保留两份内容。\n4. 重新打开应用后恢复草稿，由用户决定何时发送。\n\n待确认\n草稿保存期限，以及多人同时编辑时的处理。'}]},
  '103':{criteria:['列表与详情都能展示可访问的图片','请求失败后可手动重试，保留反馈正文','不可访问的图片显示明确状态'],materials:[{name:'图片加载问题记录',kind:'文档',content:'偶发出现列表图片空白，进入详情后仍不能显示。\n需要检查请求失败、资源失效与重试行为。\n反馈正文应始终可读。',included:true}],agreements:[{text:'仅处理图片加载与重试，不修改反馈原文。',accepted:true,source:'工作范围'}],outputs:[{name:'图片加载排查记录',kind:'分析',version:'记录 v1',content:'已检查列表与详情的加载入口。\n当前关注：请求失败后的状态恢复与重试。\n待检查：失效资源的提示、重复请求与详情刷新。'}]},
  '104':{criteria:['明确跨项目复制的字段与不迁移的内容','移动前可查看影响范围','目标创建失败时保留源事情'],materials:[{name:'跨项目移动现有行为',kind:'文档',content:'先创建目标事情，成功后再删除源事情。\n评论、附件和执行会话当前不复制。\n需要重新确认执行人、父事情和标签。',included:true}],agreements:[{text:'移动失败时，必须保留可继续处理的源记录。',accepted:true,source:'已有行为'}]},
  '105':{criteria:['窄窗口下状态与主要操作完整可见','详情内容内部滚动，底部输入不遮挡正文','打开消息后关闭，回到之前的阅读位置'],materials:[{name:'窄窗口检查范围',kind:'文档',content:'检查 390、760、1024 像素窗口。\n关注标题、状态、主要操作、详情滚动与底部输入。',included:true}],agreements:[{text:'保留右侧单行列表；窄窗口通过入口展开列表。',accepted:true,source:'交互约定'}],outputs:[{name:'窄窗口详情调整说明',kind:'交付说明',version:'结果 v1',content:'完成内容\n压缩详情标题区；详情使用内部滚动。\n消息层仅覆盖中间，关闭后恢复原阅读位置。\n窄窗口收起事情列表，用户可主动展开。\n\n检查范围\n390、760、1024 像素窗口。\n\n交付状态\n布局调整与检查记录已整理，等待人工验收。'},{name:'窗口与阅读位置检查记录',kind:'检查记录',version:'结果 v1',content:'390px：标题与主要动作可见，输入区保持在底部。\n760px：列表可展开，选择事情后收起。\n1024px：详情与右侧事情列表并列。\n消息关闭：恢复详情原阅读位置。\n\n请按验收标准复核当前结果。'}]},
  '109':{criteria:['确认每条历史图片引用的来源','缺少映射时保留原始记录'],materials:[],agreements:[]}
 };
 function ensure(t){
  if(t.detailVersion)return;
  const f=fixture[t.id]||{};
  t.materials=(f.materials||[]).map((x,i)=>({id:'material-'+i,author:'我',...x}));
  t.agreements=(f.agreements||[]).map((x,i)=>({id:'agreement-'+i,...x}));
  t.criteria=(f.criteria||[]).map(text=>({text,checked:t.status==='accepted'}));
  t.outputs=(f.outputs||[]).map((x,i)=>({id:'output-'+i,...x}));
  t.events??=[];t.detailVersion=1;
 }
 function outputs(t){
  ensure(t);const items=[...t.outputs];
  if(t.analysis&&!items.some(x=>x.kind==='方案'))items.push({id:'analysis',name:'目标与范围分析',kind:'分析',version:'当前分析',content:t.analysis+'\n\n建议下一步\n'+[window.WorkProgress.ensure(t).next,...window.WorkProgress.ensure(t).remaining].filter(Boolean).join('\n')});
  if(['completed','accepted'].includes(t.status)&&!items.some(x=>x.kind==='交付说明'))items.push({id:'closeout',name:'工作结果说明',kind:'交付说明',version:'当前结果',content:t.body+'\n\n推进记录\n'+window.WorkProgress.ensure(t).achieved.join('\n')+'\n\n请结合成果和检查记录核对目标。'});
  return items;
 }
 function canAccept(t){ensure(t);return t.status==='completed'&&!t.issues.some(x=>!x.resolved)&&t.criteria.every(x=>x.checked);}
 function views({esc,button,icon}){
  const tab=(id,text)=>button('tab',text,'text-button',`data-tab="${id}"`);
  const head=(title,action='')=>`<div class="block-heading"><h3>${title}</h3>${action}</div>`;
  const muted=text=>`<p class="detail-empty">${text}</p>`;
  const outputRow=(o,i)=>`<div class="detail-row"><span class="file-mark">${icon(o.kind==='检查记录'?'check':'list')}</span><div class="row-copy"><strong>${esc(o.name)}</strong><small>${esc(o.kind)} · ${esc(o.version)}</small></div>${button('view-output','查看','quiet',`data-index="${i}"`)}</div>`;
  function attention(t){
   let title='',body='',action='';
   if(t.mode==='decision'){title='需要你的决定';body=t.decision;action=button('decision','查看选项','primary')+button('chat','先讨论','quiet');}
   else if(t.mode==='paused'){title='执行已暂停';body='可以继续讨论和调整目标，准备好后再继续 Auto。';action=button('resume','继续 Auto','primary');}
   else if(t.mode==='queued'){title='等待执行位置';body='当前项目工作区正在处理其他事情。此时仍可补充要求。';action=button('chat','补充要求','quiet');}
   else if(t.status==='blocked'||t.mode==='external'){title='等待条件就绪';body=t.external||t.body;action=button('comment','补充资料说明','quiet');}
   else if(['failed','stopped'].includes(t.mode)){title='执行已停止，工作记录保留';body='核对停止原因与当前条件后，可以继续处理。';action=button('recover','恢复执行','primary');}
   else if(t.status==='completed'){title='结果已形成，等待你检查';body=t.issues.some(x=>!x.resolved)?'仍有未解决的验收问题，请先检查修复进展。':'检查成果与验收标准，确认这件事是否达到预期。';action=tab('results','检查成果与验收');}
   else if(t.status==='accepted'){title='验收已通过';body='最终结果与处理记录保留在这件事情中。';action=tab('results','查看最终成果');}
   return (title?`<section class="attention-strip ${t.mode==='decision'?'needs-decision':''}"><div><strong>${title}</strong><p>${esc(body)}</p></div><div class="inline-actions">${action}</div></section>`:'')+(t.pending.length?`<section class="pending-note">${icon('clock')}<span>${t.pending.length} 条补充要求待生效：${esc(t.pending.join('；'))}</span>${button('chat','查看','text-button')}</section>`:'');
  }
  const progress=window.WorkProgress.views({esc,button});
  function scene(t){
   ensure(t);const out=outputs(t);
   return `${attention(t)}<section class="goal-block">${head('目标与要求',button('edit','编辑','text-button'))}<p class="preserve">${esc(t.body)}</p></section>
    ${progress(t)}
    ${t.criteria.length?`<section>${head('完成标准',button('edit-criteria','编辑标准','text-button'))}<ul class="requirement-list">${t.criteria.map(x=>`<li>${esc(x.text)}</li>`).join('')}</ul></section>`:`<section class="inline-empty"><span>补充完成标准，让结果更容易检查。</span>${button('edit-criteria','添加标准','text-button')}</section>`}
    ${t.agreements.filter(x=>x.accepted).length?`<section>${head('已确认的约定',tab('attributes','资料与协作'))}<ul class="requirement-list">${t.agreements.filter(x=>x.accepted).map(x=>`<li>${esc(x.text)}</li>`).join('')}</ul></section>`:''}
    ${out.length?`<section>${head('最新成果',tab('results','全部成果'))}${out.slice(0,2).map(outputRow).join('')}</section>`:''}
    <section>${head('子事情',button('new-child','添加子事情','text-button'))}${M.state.tasks.filter(x=>x.parent===t.id).map(x=>`<div class="detail-row"><div class="row-copy"><strong>${esc(x.title)}</strong><small>#${x.id} · ${esc(x.assignee)} · ${M.states[x.status]}</small></div>${button('select','打开','quiet',`data-task="${x.id}"`)}</div>`).join('')||muted('尚未拆分子事情，可以按需拆出独立推进的工作。')}</section>`;
  }
  function attributes(t){ensure(t);return `<section>${head('参考资料',button('add-material',icon('plus')+'添加资料','text-button'))}<p class="section-caption">这件事情的输入依据。加入上下文后，将提供给 Agent 后续处理。</p>${t.materials.map((x,i)=>`<div class="detail-row material-row"><span class="file-mark">${icon('list')}</span><div class="row-copy"><strong>${esc(x.name)}</strong><small>${esc(x.kind)} · ${esc(x.author)}添加 <span class="context-state">${x.included?'已加入上下文':'未加入上下文'}</span></small></div><div class="inline-actions">${button('view-material','查看','quiet',`data-index="${i}"`)}${button('toggle-context',x.included?'移出上下文':'加入上下文','text-button',`data-index="${i}"`)}</div></div>`).join('')||muted('添加参考内容或链接，帮助共同理解这件事情。')}</section>
   <section>${head('共同约定',button('add-agreement','添加约定','text-button'))}<p class="section-caption">明确范围、限制和已经作出的选择，供后续工作沿用。</p>${t.agreements.map((x,i)=>`<div class="agreement-row"><span class="agreement-mark ${x.accepted?'adopted':''}">${icon(x.accepted?'check':'chat')}</span><div class="row-copy"><p>${esc(x.text)}</p><small>${x.accepted?'已采纳':'待确认'} · ${esc(x.source)}</small></div><div class="inline-actions">${!x.accepted?button('adopt-agreement','采纳','quiet',`data-index="${i}"`):''}${x.messageIndex!=null?button('message-context','来源','text-button',`data-index="${x.messageIndex}"`):''}${button('edit-agreement','编辑','text-button',`data-index="${i}"`)}</div></div>`).join('')||muted('在这里记录约定，也可从消息中保存讨论结论。')}</section>
   <section>${head('协作留言',button('comment','添加评论','text-button'))}<p class="section-caption">给参与者的补充和讨论。需要 Agent 处理时，可以主动交给它。</p>${(t.comments||[]).map((x,i)=>`<div class="collaboration-comment"><div class="comment-author"><span class="avatar small-avatar">G</span><strong>我</strong><span>事情留言</span></div><p>${esc(x)}</p><div class="inline-actions">${button('comment-agent','交给 Agent','text-button',`data-index="${i}"`)}${button('comment-agreement','保存为约定','text-button',`data-index="${i}"`)}</div></div>`).join('')||muted('还没有协作留言。')}</section>`;}
  function results(t){ensure(t);const out=outputs(t),complete=['completed','accepted'].includes(t.status),checked=t.criteria.filter(x=>x.checked).length;return `<section>${head('结果摘要',`<span class="muted-label">${complete?'已形成结果':'持续整理中'}</span>`)}<p class="result-summary">${esc(t.status==='accepted'?'这件事情已验收，结果与记录保留可查。':t.status==='completed'?'工作已完成，请结合下方成果和标准检查实际效果。':out.length?'当前已形成可查看的阶段成果，可以继续讨论和完善。':'尚未形成成果。分析方案、工作文件和检查记录会保留在这里。')}</p>${t.analysis?`<p class="section-caption">${esc(t.analysis)}</p>`:''}</section>
   <section>${head('成果清单',button('add-output','添加成果','text-button'))}${out.map(outputRow).join('')||muted('有了可检查的内容后，再添加成果。')}</section>
   <section>${head('验证证据')} ${t.id==='105'?`<div class="evidence-panel"><div class="block-heading"><strong>窗口布局与阅读位置</strong><span class="muted-label">结果 v1</span></div><p>覆盖 390 / 760 / 1024px，检查详情滚动、消息关闭与列表展开。</p><div class="inline-actions"><span class="evidence-label">已记录检查结果 · 待人工复核</span>${button('view-output','查看检查记录','text-button','data-index="1"')}</div></div>`:muted(complete?'尚未关联独立的检查证据，请补充或人工核对。':'尚未形成验证记录。阶段分析不表示验收已经通过。')}</section>
   <section>${head('验收标准',button('edit-criteria','编辑标准','text-button',t.status==='accepted'?'disabled':''))}<p class="section-caption">${t.status==='accepted'?'已确认验收通过。':complete?'逐项核对当前结果；发现偏差时，可以提出验收问题。':'与概览共用完成标准，形成结果后在这里逐项检查。'}</p><div class="criteria-list">${t.criteria.map((x,i)=>`<label class="criterion"><input type="checkbox" data-criterion="${i}" ${x.checked?'checked':''} ${!complete||t.status==='accepted'?'disabled':''}><span>${esc(x.text)}</span>${x.checked?'<small>已确认</small>':''}</label>`).join('')||muted('尚未定义验收标准。')}</div>${complete?`<div class="acceptance-footer"><span>${t.status==='accepted'?'验收已完成':`已确认 ${checked} / ${t.criteria.length} 项 · ${t.issues.filter(x=>!x.resolved).length} 个未解决问题`}</span>${t.status==='completed'?button('accept','验收通过','primary',canAccept(t)?'':'disabled'):''}</div>`:''}</section>
   ${complete?`<section>${head('验收问题',t.status==='completed'?button('issue','提出问题','text-button'):'')}${t.issues.map((x,i)=>`<div class="issue"><div><strong>${esc(x.text)}</strong><small>${x.resolved?'已标记解决':'等待处理 · 事情保持已完成'}</small></div>${!x.resolved?button('resolve-issue','标记已解决','quiet',`data-index="${i}"`):''}</div>`).join('')||muted('当前没有验收问题。')}</section>`:''}`;}
  function activity(t){ensure(t);const filter=M.state.activityFilter||'all',events=t.events.filter(x=>filter==='all'||x.kind===filter),legacy=t.activity.slice(0,Math.max(0,t.activity.length-t.events.length));return `<section>${head('事情活动',button('chat','查看完整消息','text-button'))}<div class="activity-filters">${[['all','全部'],['execution','执行'],['decision','决定与要求'],['collaboration','协作'],['result','成果与验收']].map(([id,name])=>button('activity-filter',name,filter===id?'active':'quiet',`data-filter="${id}"`)).join('')}</div><ol class="event-list">${events.toReversed().map(x=>`<li><span class="event-dot">${icon(x.kind==='result'?'check':x.kind==='collaboration'?'chat':'clock')}</span><div><div class="event-meta">${esc(x.actor)} <time>${new Date(x.at).toLocaleString('zh-CN',{month:'2-digit',day:'2-digit',hour:'2-digit',minute:'2-digit'})}</time></div><p>${esc(x.text)}</p>${x.messageIndex!=null?button('message-context','查看相关消息','text-button',`data-index="${x.messageIndex}"`):''}</div></li>`).join('')}${filter==='all'&&legacy.length?`<li class="legacy-event"><span class="event-dot">${icon('list')}</span><div><div class="event-meta">已有工作记录 <span>时间未记录</span></div>${legacy.map(x=>`<p>${esc(x)}</p>`).join('')}</div></li>`:''}</ol>${!events.length&&filter!=='all'?muted('这个类别暂无记录。'):''}<p class="section-caption">消息中的讨论按需查看；影响目标、执行和验收的变化保留在这里。</p></section>`;}
  function properties(t){ensure(t);return `<dl class="attributes compact-properties"><dt>事情编号</dt><dd>#${t.id}</dd><dt>所属项目</dt><dd>${esc(M.project(t.project).name)}</dd><dt>执行人</dt><dd>${esc(t.assignee)}</dd><dt>事情状态</dt><dd>${M.states[t.status]}</dd><dt>推进方式</dt><dd>${M.modes[t.mode]}</dd><dt>优先级</dt><dd>${esc(t.priority)}</dd><dt>标签</dt><dd>${esc(t.tag||'未设置')}</dd><dt>父事情</dt><dd>${t.parent?'#'+esc(t.parent):'无'}</dd><dt>本机执行</dt><dd>${M.state.config[t.project]?'已准备':'需要配置'}</dd></dl><p class="section-caption">执行人表示责任归属，开始 Auto 后保持不变。</p>`;}
  return {scene,attributes,results,activity,properties};
 }
 window.WorkDetails={ensure,outputs,canAccept,views};
 M.state.tasks.forEach(ensure);
})();
