/* Formal interaction fixtures. All operations are local; no native/Agent service is called. */
(() => {
 const M=window.ChatModel, clone=x=>JSON.parse(JSON.stringify(x));
 function init(){
  if(M.state.nativeVersion===1)return;
  M.state.nativeVersion=1;M.state.nativeTab='sessions';M.state.nativeSearch='';
  M.state.tasks=[{id:'T201',project:'atlas',title:'恢复会话阅读位置',content:'切换会话后恢复原阅读位置。',state:'待处理',revision:1},{id:'T202',project:'atlas',title:'完善离线草稿恢复',content:'应用重启后保留未发送消息。',state:'待处理',revision:1},{id:'T301',project:'borealis',title:'优化反馈列表筛选',content:'保留上次筛选条件。',state:'待处理',revision:1}];
  M.state.nativeNext=401;
 }
 init();
 const task=id=>M.state.tasks.find(t=>t.id===id);
 const context=()=>M.owner().composeContext ||= {capability:null,refs:[]};
 const hasContext=()=>Boolean(context().capability||context().refs.length);
 const inScope=id=>!window.GlobalContext||GlobalContext.includes(({atlas:'orbit',borealis:'feedback'})[id]||id);
 const availableTasks=()=>M.state.tasks.filter(t=>t.project===M.owner().project&&inScope(t.project));
 const capabilities=[{id:'create',kind:'原生能力',label:'创建待办',detail:'当前项目的另一件事'}, {id:'summarize',kind:'原生能力',label:'整理为待办',detail:'当前讨论成为待办，继续同一会话'}, {id:'diagnose',kind:'Skill',label:'问题诊断',detail:'arckit-debug-diagnosis · 按证据定位问题'}];
 function refs(){return [{id:'file-chat',project:M.owner().project,kind:'文件',label:'chat-workspace/interaction.md',detail:'项目文件 · 对话交互说明'},...availableTasks().map(t=>({id:t.id,project:t.project,kind:'待办',label:t.title,detail:t.id+' · 引用不会切换会话'}))]}
 function checkContext(c,project){for(const r of c.refs){if(r.project!==project)throw Error('引用不属于当前项目，请移除后重新选择。');if(r.kind==='待办'&&(!task(r.id)||task(r.id).unavailable))throw Error('引用的待办不可访问，请移除该引用后重试。')}}
 function classify(s,text,c){
  if(s.forcedNative)return clone(s.forcedNative);
  if(text==='重试刚才的操作'&&s.nativeRetry)return clone(s.nativeRetry);
  if(c.capability?.id==='summarize'||/把这段对话.*待办/.test(text))return {kind:'whole'};
  if(c.capability?.id==='create'||s.nativePending==='create'||text==='给 Chat 增加会话搜索'||/另外.*待办/.test(text))return {kind:'create',title:text.replace(/^另外帮我记一个待办[：:]?\s*/,'').split('。')[0]};
  if(c.capability?.id==='diagnose')return {kind:'skill'};
  if(/补充完成标准/.test(text))return {kind:'update',taskId:s.mainTask,revision:task(s.mainTask)?.revision};
  if(/继续执行/.test(text))return {kind:'execute',taskId:s.mainTask};
  if(/遗漏|旁支/.test(text))return {kind:'suggest'};
  if(s.nativePending==='suggestion'&&text==='记成另一个待办')return {kind:'create',title:'补充滚动恢复的边界测试'};
  if(c.refs.length)return {kind:'reference'};
  return null;
 }
 const baseSend=M.send;
 M.send=function(){
  const owner=M.owner();if(M.active(M.current()))return;
  const c=clone(context()),text=owner.draft.trim();
  if(!text&&!hasContext())return;
  checkContext(c,owner.project);
  const op=classify(owner,text,c),old=owner.draft;
  if(!text)owner.draft='请使用本条所选能力与引用。';
  let s;try{s=baseSend()}catch(e){owner.draft=old;throw e}
  if(!s){owner.draft=old;return}
  if(!text&&s.messages.length===2)s.title=c.capability?.label||'上下文讨论';
  s.messages.at(-2).context=c;s.messages.at(-2).text=text||'使用所选能力与引用';
  s.composeContext={capability:null,refs:[]};M.state.newDraft.composeContext={capability:null,refs:[]};
  if(op){s.nativeTurn={...op,requestId:crypto.randomUUID(),text,context:c};s.nativeRetry=null;s.messages.at(-1).tools=[]}
  delete s.forcedNative;M.save();return s;
 };
 function request(text,operation){
  const o=M.owner();if(M.active(M.current()))throw Error('请等待当前回答结束，或先停止。');
  const draft=o.draft,c=o.composeContext;o.draft=text;o.composeContext={capability:null,refs:[]};o.forcedNative=operation;
  try {return M.send()} finally {delete o.forcedNative;o.draft=draft;o.composeContext=c;M.save()}
 }
 function complete(s,j,m){
  const t=task(j.taskId||s.mainTask),write=['create','whole','update'].includes(j.kind);
  if(write&&M.state.nativeFailure){M.state.nativeFailure=false;throw Error('原生能力写入失败，尚未保存。可以回复“重试刚才的操作”。')}
  if((j.taskId||['update','execute'].includes(j.kind))&&(!t||t.unavailable))throw Error('待办不存在或已无权访问。对话历史与草稿保留。');
  if(t&&t.project!==s.project)throw Error('待办不属于当前会话项目。');
  if(t?.occupied&&['update','execute'].includes(j.kind))throw Error('待办正在由其他执行持有，请先等待或在运行入口处理。');
  if(j.kind==='whole'&&s.mainTask){m.text='当前会话已对应待办，可继续补充或执行。';m.card=s.mainTask;return}
  if(j.kind==='create'||j.kind==='whole'){
   if(j.kind==='create'&&!j.text&&!j.title){s.nativePending='create';m.text='想在当前项目记下什么？直接告诉我内容。';return}
   const id='T'+M.state.nativeNext++,title=j.kind==='whole'?s.title:(j.title||j.text).slice(0,120);
   const created={id,project:s.project,title,content:j.kind==='whole'?'整理当前讨论的目标、约束和完成标准。\n'+s.messages.filter(x=>x.role==='user').slice(0,-1).map(x=>x.text).join('\n'):j.text||title,state:'待评审',revision:1,sourceSession:s.id,thread:j.kind==='whole'?s.thread:null};
   M.state.tasks.push(created);if(j.kind==='whole')s.mainTask=id;s.nativePending=null;
   m.tools.push({label:'已创建待办 · '+id,detail:'原生能力成功回执（本地样本）'});m.card=id;
   m.text=j.kind==='whole'?'已整理为待办，继续使用当前会话。':'已记为当前项目的另一条待办，当前讨论继续。';return;
  }
  if(j.kind==='read'){m.text=t.title+'\n\n'+t.content+'\n\n可以继续分析、补充内容或要求执行。';return}
  if(j.kind==='update'){
   if(j.revision!==t.revision){j.revision=t.revision;throw Error('待办版本已变化，本次未覆盖。请读取最新内容，核对后重新提出修改。')}
   t.content+='\n完成标准：切换会话后恢复原阅读位置。';t.revision++;
   m.tools.push({label:'已写回待办 · '+t.id,detail:'版本 '+t.revision});m.text='已补充完成标准，可重新读取最新内容。';m.card=t.id;return;
  }
  if(j.kind==='execute'){m.text='将基于最新目标检查实现、修改并验证。本次为原型模拟，没有执行代码或更改业务完成状态。';return}
  if(j.kind==='skill'){m.tools.push({label:'已载入 Skill · 问题诊断',detail:'读取方法指令的本地模拟'});m.text='将结合当前问题和所提供的上下文，检查复现条件与证据。本条为样本反馈。';return}
  if(j.kind==='suggest'){s.nativePending='suggestion';m.text='还可以补充滚动恢复的边界测试。需要记成另一个待办时，直接告诉我即可。';return}
  m.text='已读取本条引用。引用不会切换会话或自动修改对象，可继续讨论。';
 }
 const baseTick=M.tick;
 M.tick=function(){
  const pending=M.state.sessions.filter(s=>s.nativeTurn&&M.active(s));
  const states=pending.map(s=>[s,s.status]);for(const s of pending)s.status='native-held';
  let changed=baseTick();for(const [s,status]of states)s.status=status;
  for(const s of pending){
   const j=s.nativeTurn,m=s.messages.at(-1);changed=true;
   if(s.status==='interrupting'){s.status='interrupted';m.streaming=false;m.text+='\n操作已停止，未提交的写入没有执行。';delete s.nativeTurn;continue}
   if(s.status==='waiting_approval')continue;
   if(M.state.offline){s.status='failed';s.error='连接中断，请恢复后重试。';s.nativeRetry=clone(j);continue}
   s.status='running';s.step++;m.tools ||= [];
   if(s.step===1){m.tools=[{label:'已读取当前项目与可用能力',detail:M.project(s.project)?.name||s.project}];for(const r of j.context.refs)m.tools.push({label:'已读取引用 · '+r.label,detail:r.kind==='待办'?task(r.id)?.content||'引用不可访问':'项目文件样本：会话保存草稿与阅读位置。'})}
   if(s.step===2&&j.taskId){const t=task(j.taskId);m.tools.push({label:'读取待办 · '+j.taskId,detail:t?.content||'对象不可访问'})}
   if(s.step>=3){
    try{checkContext(j.context,s.project);complete(s,j,m);s.status='completed';s.error='';s.nativeRetry=null;delete s.nativeTurn}
    catch(e){s.status='failed';s.error=e.message;m.text=e.message;s.nativeRetry=clone(j)}
    m.streaming=false;
   }
   if(!s.follow||s.id!==M.state.selected)s.unread++;
  }
  if(changed)M.save();return changed;
 };
 // A reload does not replay any business write or pending native request.
 for(const s of M.state.sessions)if(s.nativeTurn&&M.active(s)){s.status='interrupted';s.error='应用退出时中断；请核对后发起新请求。';delete s.nativeTurn}
 window.ChatNative={task,context,hasContext,inScope,availableTasks,capabilities,refs,request,init};
})();
