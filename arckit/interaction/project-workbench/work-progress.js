/* Local scenario snapshots, not an execution protocol or an Agent implementation. */
(() => {
 const M=window.WorkModel;
 const fixtures={
  '101':{current:'尚未开始执行',achieved:[],next:'先确认列表与输入框之间的焦点边界',remaining:['方向键在输入框与列表中的行为需要分别核对'],source:'事情要求'},
  '102':{current:'已形成离线恢复方案初稿，等待讨论',achieved:['已区分离线、重连与重新打开三种场景'],next:'确认重新联网后是否自动重试提交',remaining:['草稿保留期限尚未确定','多人编辑冲突需要明确恢复入口'],source:'方案初稿'},
  '103':{current:'检查图片请求失败后的重试与状态恢复',achieved:['已核对列表和详情的图片加载入口'],next:'先验证失效资源与暂时断网是否需要不同提示',remaining:['失败后再次加载是否清除旧错误','列表与详情的重试行为是否一致'],plan:['复现列表中的图片请求失败','检查详情中的错误状态恢复','区分网络失败与资源失效提示','验证手动重试是否重复发起请求'],source:'Agent 工作摘要'},
  '104':{current:'已核对移动行为，等待确认记录的保留方式',achieved:['已确认目标创建成功后才删除源事情','已确认评论、附件与会话目前不会复制'],next:'依据你的决定补充移动影响说明',remaining:['需要确认如何访问源评论与附件'],source:'Agent 工作摘要'},
  '105':{current:'布局调整与检查记录已整理',achieved:['已压缩标题区域并保留主要操作','已检查窄窗口滚动与消息关闭后的阅读位置'],next:'由你检查成果并完成验收',remaining:[],source:'工作结果'},
  '106':{current:'等待测试环境提供消息同步接口',achieved:[],next:'环境负责人部署后，重新检查同步行为',remaining:['测试环境接口尚未就绪'],source:'事情说明'},
  '107':{current:'验收已通过',achieved:['逐事情草稿保留行为已确认'],next:'',remaining:[],source:'验收记录'},
  '109':{current:'历史图片迁移受阻',achieved:[],next:'补充历史附件与来源地址的映射',remaining:['缺少历史图片的来源映射'],source:'事情说明'}
 };
 // Each entry is an observed local outcome. Editing a plan never advances these snapshots.
 const observations={
  '101':[{current:'检查切换事情后草稿和列表位置是否保持',achieved:'已整理列表与输入框的键盘操作边界',next:'检查焦点返回后的继续输入',remaining:['草稿与焦点恢复仍需核对']},{current:'键盘导航调整说明已整理',achieved:'已整理焦点、草稿与列表位置的检查结果',next:'查看工作结果并验收',remaining:[],complete:true}],
  '102':[{current:'补充离线与重连时的失败恢复说明',achieved:'已整理未发送草稿与已提交内容的保留方式',next:'检查方案是否覆盖提交冲突',remaining:['确认冲突时如何保留两份内容']},{current:'离线恢复方案已整理',achieved:'已补充失败重试与冲突处理说明',next:'检查方案内容是否达到预期',remaining:[],complete:true}],
  '103':[{current:'核对手动重试后的图片状态',achieved:'已整理网络失败和资源失效的处理差异',next:'检查列表与详情是否使用一致的反馈',remaining:['详情重试后的错误提示仍需核对']},{current:'检查列表与详情的重试结果',achieved:'已检查手动重试后的错误状态恢复',next:'整理图片加载检查记录',remaining:['汇总两个入口的检查结果']},{current:'图片加载修复记录已整理',achieved:'已整理列表、详情与失效资源的检查结果',next:'查看成果并核对验收标准',remaining:[],complete:true}],
  '104':[{current:'移动规则与影响范围已整理',achieved:'已将确认的记录保留方式写入移动说明',next:'检查跨项目移动规则',remaining:[],complete:true}]
 };
 function ensure(t){
  if(t.progressVersion===1)return t.progress;
  t.progress={current:'尚未形成工作判断',achieved:[],next:'先明确这件事情的目标与范围',remaining:[],plan:[],source:'事情要求',...structuredClone(fixtures[t.id]||{})};
  if(['completed','accepted'].includes(t.status)){t.progress.current=t.status==='accepted'?'验收已通过':'工作已完成，等待检查';t.progress.next=t.status==='accepted'?'':'查看成果并核对验收标准';t.progress.remaining=[];t.progress.plan=[];}
  t.progressVersion=1;t.scenarioCursor=0;
  // Prior versions generated all of these arrays automatically, including during Chat.
  delete t.plan;delete t.step;
  return t.progress;
 }
 function apply(t,change){const p=ensure(t);p.next=change.next;p.plan=change.plan;p.nextSource='用户调整';p.updatedAt=new Date().toISOString();if(t.mode==='auto'){p.current='正在重新核对调整后的工作范围';p.source='Agent 工作摘要';}p.revision=(p.revision||0)+1;t.directionChanged=true;}
 function change(t,next,plan){M.writable();ensure(t);if(['completed','accepted','cancelled'].includes(t.status))throw Error('事情已收束，请从验收入口继续。');if(!next.trim())throw Error('请填写下一步安排。');const value={next:next.trim(),plan:plan.split('\n').map(x=>x.trim()).filter(Boolean)};if(t.mode==='auto'){t.pendingDirection=value;M.record(t,'已提交安排调整，等待当前工作结束',{actor:'我',kind:'decision'});}else{apply(t,value);M.record(t,'已调整下一步：'+value.next,{actor:'我',kind:'decision'});}M.save();}
 function start(t){const p=ensure(t);if(t.mode==='auto')p.current='正在处理：'+p.next;}
 function analyze(t,text){const p=ensure(t);p.source='Agent 工作摘要';p.updatedAt=new Date().toISOString();p.lastInstruction=text;if(!fixtures[t.id]){p.current='已收到目标与补充要求，仍需明确具体处理方式';p.next='围绕你的补充继续讨论：'+text;p.remaining=['具体方案和后续安排尚待明确'];}t.analysis=t.id==='102'?'已区分离线、重连与重启场景。下一处需要确认的是恢复联网后的重试行为。':'已保留你的补充，后续工作将结合当前目标继续判断。';}
 function advance(t){
  const p=ensure(t);
  if(t.pendingDirection){apply(t,t.pendingDirection);M.record(t,'安排已生效：'+t.pendingDirection.next,{actor:'Agent',kind:'decision'});delete t.pendingDirection;return;}
  if(t.directionChanged){p.current='正在核对调整后的工作安排';return;}
  const snapshot=observations[t.id]?.[t.scenarioCursor];
  if(!snapshot){p.current='正在核对目标与已有资料';return;}
  t.scenarioCursor++;p.current=snapshot.current;if(!p.achieved.includes(snapshot.achieved))p.achieved.push(snapshot.achieved);p.next=snapshot.next;p.remaining=snapshot.remaining;p.source='Agent 工作摘要';p.updatedAt=new Date().toISOString();
  M.record(t,snapshot.achieved,{actor:'Agent',kind:snapshot.complete?'result':'execution'});
  if(snapshot.complete){t.mode='done';t.status='completed';p.plan=[];M.message(t,'agent','工作结果已整理，可以查看成果并核对验收标准。');}
 }
 function views({esc,button}){
  return function progress(t){const p=ensure(t),done=['completed','accepted','cancelled'].includes(t.status);let label='当前工作';if(t.mode==='paused')label='暂停前的工作';else if(t.mode==='queued')label='准备推进';else if(done)label='工作结果';
   return `<section class="work-progress"><div class="block-heading"><h3>${label}</h3>${button('tab','查看过程','text-button','data-tab="activity"')}</div><div class="progress-summary"><strong>${esc(t.status==='accepted'?'验收已通过':t.status==='cancelled'?'事情已取消':p.current)}</strong><small>来源：${esc(p.source)}${p.updatedAt?' · '+new Date(p.updatedAt).toLocaleTimeString('zh-CN',{hour:'2-digit',minute:'2-digit'}):''}</small></div>
    ${p.achieved.length?`<div class="progress-facts"><span class="small-label">已取得的进展</span><ul class="requirement-list">${p.achieved.slice(-2).map(x=>`<li>${esc(x)}</li>`).join('')}</ul></div>`:''}
    ${p.remaining.length&&!done?`<div class="progress-facts"><span class="small-label">尚待解决</span><ul class="requirement-list">${p.remaining.map(x=>`<li>${esc(x)}</li>`).join('')}</ul></div>`:''}
    ${p.next&&t.status!=='accepted'&&t.status!=='cancelled'?`<div class="next-action"><div><span class="small-label">${t.mode==='auto'?'接下来准备':t.mode==='decision'||t.status==='blocked'?'条件满足后':'下一步'}</span><p>${esc(p.next)}</p>${p.nextSource?`<small class="small-label">${esc(p.nextSource)}</small>`:''}</div>${!done?button('adjust-direction','调整安排','text-button'):button('tab','检查成果','text-button','data-tab="results"')}</div>`:''}
    ${p.lastInstruction?`<p class="adopted-instruction">最近采用的补充：${esc(p.lastInstruction)}</p>`:''}
    ${t.pendingDirection?`<div class="direction-pending"><strong>安排调整待生效</strong><p>${esc(t.pendingDirection.next)}</p><small>当前工作继续；到下一执行边界后采用新安排。</small></div>`:''}
    ${p.plan.length&&!done?`<details class="plan-disclosure" data-plan-owner="${t.id}" ${M.state.expandedPlans?.[t.id]?'open':''}><summary>当前计划 <span>可随新信息调整</span></summary><ul class="requirement-list">${p.plan.map(x=>`<li>${esc(x)}</li>`).join('')}</ul>${button('adjust-direction','调整计划','text-button')}</details>`:''}</section>`;
  };
 }
 window.WorkProgress={ensure,start,advance,analyze,change,views};M.state.tasks.forEach(ensure);M.save();
})();
