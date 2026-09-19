/* Proposed client composition of existing sources. All writes are local simulations. */
(() => {
  const assetFields=['vision','audience','principles','description','iterationName','iterationGoal','iterationTag'];
  const snapshot=p=>({...Object.fromEntries(assetFields.map(k=>[k,p[k]||''])),iterationHistory:Concept.clone(p.iterationHistory||[])});
  function defaults(p){
    const ledger=p.id==='p-ledger', feedback=p.id==='p-feedback', seeded=ledger||feedback;
    p.vision ??= ledger?'让每个人都能轻松理解和掌控自己的日常开支。':feedback?'让有价值的用户反馈得到持续回应。':'';
    p.audience ??= ledger?'希望建立记账习惯的个人与家庭':feedback?'产品负责人、研发团队与产品用户':'';
    p.principles ??= seeded?'先解决高频问题。\n让结果可理解、可追溯。':'';
    p.iterationName ??= seeded?(ledger?'0.2 · 真实可用':'0.3 · 反馈协作'):'';
    p.iterationGoal ??= seeded?p.goal:'';
    p.iterationTag ??= seeded?(ledger?'iteration:0.2':'iteration:0.3'):'';
    p.taskTags ??= p.iterationTag?[p.iterationTag]:[];
    p.taskId ??= ledger?'482':feedback?'507':'';
    p.myResponsibility ??= true;
    p.docs ??= {status:seeded?'shared':'local',revision:1,base:seeded?snapshot(p):null,history:[],conflict:false};
    p.releases ??= seeded?[{name:'v0.1.0',kind:'正式发布',date:'2026-09-01'}]:[];
    p.feedback ??= seeded?{id:ledger?'81':'92',unread:true,title:ledger?'刷新后账单不见了':'反馈图片打不开',message:ledger?'已经补充复现步骤，刷新浏览器后刚录入的账单消失。':'补充说明：网络恢复后可以重新加载图片了。',replies:[],taskId:p.taskId}:null;
    return p;
  }
  const sources=()=>Concept.state.sources ||= {work:true,github:true,feedback:true};
  const markDraft=p=>{defaults(p);p.docs.status=p.repo?'draft':'local';};
  function changed(p){defaults(p);const base=p.docs.base||{};return assetFields.filter(k=>(p[k]||'')!==(base[k]||''));}
  function publish(p){
    defaults(p);
    if(!p.repo)return '请先关联仓库，草稿仍保存在本机。';
    if(!sources().github)return '仓库暂不可用，草稿已保留。';
    if(Concept.state.demoRepoReadOnly)return '当前账号不能直接提交到资料分支。草稿已保留，可在 GitHub 按仓库规则提交 PR。';
    if(p.docs.conflict)return '仓库资料已有新版本，请先核对差异。';
    p.docs.revision++;p.docs.base=snapshot(p);p.docs.status='shared';
    p.docs.history.unshift({revision:p.docs.revision,time:new Date().toLocaleTimeString('zh-CN'),title:'更新产品资料'});
    Concept.append(p,'tool','产品资料已提交到仓库（模拟）',`仅提交已确认的产品资料；版本 ${p.docs.revision}。正式实现仍需客户端接入 Git。`,Concept.productConversation(p));
    Concept.emit(p.id);return '';
  }
  function responsibilities(){
    return Concept.state.products.flatMap(p=>{
      defaults(p);const list=[];
      if(p.remoteId&&p.myResponsibility&&['proposed','review','paused'].includes(p.work))list.push({p,source:p.work==='paused'?'本机 Automation':'待办',title:p.work==='review'?'验收工作结果':p.work==='paused'?'继续已暂停的执行':'确认待办范围',detail:taskTitle(p),href:`#${p.work==='paused'?'automation':'work'}/${p.id}`,stale:p.work!=='paused'&&!sources().work});
      if(p.step==='failed')list.push({p,source:'本机接入',title:'恢复项目目录连接',detail:'远程项目已创建，继续完成本机连接。',href:`#add/${p.id}`});
      return list;
    });
  }
  const taskTitle=p=>p.id==='p-feedback'?'反馈图片直接查看':p.taskId?'记账数据持久化':'下一步工作';
  function matched(p,tag=p.iterationTag){return Boolean(p.remoteId&&p.work!=='none'&&tag&&p.taskTags.includes(tag));}
  function progress(p){defaults(p);if(!sources().work)return '进度暂不可确认';if(!matched(p))return '尚未关联待办';return p.work==='accepted'?'1 / 1 已验收':p.work==='review'?'0 / 1 已验收 · 1 项待验收':'0 / 1 已验收';}
  function readFeedback(p){if(!sources().feedback)return false;p.feedback.unread=false;Concept.emit(p.id);return true;}
  window.Support={defaults,sources,changed,markDraft,publish,responsibilities,taskTitle,matched,progress,readFeedback};
})();
