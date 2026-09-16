/* Standalone simulation. No backend, microphone, Codex or Runtime calls. */
(() => {
 const view = ['list','focus','attention'].includes(new URLSearchParams(location.search).get('view')) ? new URLSearchParams(location.search).get('view') : 'list';
 const key = 'arcorbit-unified-work-v1-' + view;
 const projects = [{id:'orbit',name:'ArcOrbit',initial:'A',description:'软件开发的持续协作空间'},{id:'feedback',name:'Feedback',initial:'F',description:'让用户反馈进入产品迭代'},{id:'todo',name:'Workshop Todo',initial:'W',description:'团队事情与协作'}];
 const states = {review:'待评审',ready:'待处理',progress:'进行中',completed:'已完成',accepted:'已验收',blocked:'已阻塞',cancelled:'已取消'};
 const modes = {manual:'由你推进',discussion:'交流分析',queued:'等待 Auto',auto:'Auto 进行中',paused:'已暂停 · 可交流',decision:'等你决定',external:'等待外部条件',failed:'执行需恢复',done:'结果待检查',accepted:'验收通过',stopped:'执行已停止'};
 const base = (id,project,title,status,mode,extra={}) => ({id,project,title,body:title+'。保留现有使用习惯，完成后提供可检查的结果。',status,mode,assignee:'我',priority:'高',tag:'体验',revision:1,thread:'work-thread-'+id,draft:'',messages:[],activity:['事情已建立'],plan:[],pending:[],issues:[],step:0,model:'默认模型',level:'默认强度',...extra});
 function initial() {return {version:1,scope:view==='attention'?'all':'orbit',selected:view==='attention'?null:'101',filter:'all',query:'',tab:'scene',autoClaim:false,offline:false,failNext:false,config:{orbit:true,feedback:true,todo:true},newDraft:'',newProject:'orbit',tasks:[
  base('101','orbit','优化事情列表的键盘导航','ready','manual',{body:'支持方向键切换事情，Enter 打开详情，Esc 返回列表。切换后保留用户草稿与列表位置。',tag:'交互'}),
  base('102','orbit','整理离线恢复方案','review','manual',{body:'先分析应用离线、重新联网和重新打开后的状态恢复策略。需要明确哪些内容保留，以及失败时如何继续。',priority:'中',tag:'方案'}),
  base('103','feedback','修复反馈图片加载','progress','auto',{body:'排查反馈图片偶发无法显示的问题，修复后验证列表和详情中的图片加载。',step:1,plan:['定位图片请求失败原因','修复加载与重试逻辑','验证并整理结果'],messages:[{role:'user',text:'请修复反馈图片偶发加载失败的问题。'},{role:'agent',text:'正在检查图片请求与重试逻辑。结果会出现在工作现场。'}],activity:['已开始 Auto','正在检查图片请求与重试逻辑']}),
  base('104','todo','确认待办跨项目移动规则','progress','decision',{body:'跨项目移动时，目标项目中的执行人、父任务和标签需要重新确认。',plan:['梳理已有移动流程','确认评论与附件的处理方式','实现并验证'],step:1,decision:'移动后是否保留源事情的评论与附件入口？',activity:['已梳理移动流程','需要你确认协作记录的展示方式']}),
  base('105','orbit','修正窄窗口详情排版','completed','done',{body:'窄窗口保留状态、主要操作与输入入口，详情内部滚动。',plan:['调整详情布局','检查窄窗口','整理验证结果'],step:3,activity:['布局调整完成','示例验证通过，等待验收']}),
  base('106','feedback','验证新服务的消息同步','blocked','manual',{body:'等待测试环境提供新的消息同步接口，然后重新检查并继续验证。',external:'测试环境尚未部署新接口。由环境负责人完成部署后，再重新检查。',priority:'中'}),
  base('107','orbit','保留逐事情的输入草稿','accepted','accepted',{priority:'中',tag:'可靠性'}),
  base('108','todo','统一旧版任务编号样式','cancelled','manual',{priority:'低',tag:'维护'}),
  base('109','orbit','迁移历史图片引用','blocked','manual',{body:'缺少历史附件的来源映射，补充材料后可恢复处理。',priority:'中',tag:'数据'})
 ]};}
 let state;let storageAvailable=true;
 try {state=JSON.parse(localStorage.getItem(key));} catch {storageAvailable=false;}
 if (!state || state.version!==1 || !Array.isArray(state.tasks)) state=initial();
 const current = () => state.tasks.find(t=>t.id===state.selected);
 const project = id => projects.find(p=>p.id===id);
 const save = () => {try{localStorage.setItem(key,JSON.stringify(state));}catch{storageAvailable=false;}};
 const visible = () => state.tasks.filter(t=>(state.scope==='all'||t.project===state.scope) && (state.filter==='all'||(state.filter==='attention'?['decision','paused','failed','done'].includes(t.mode):t.status===state.filter)) && (!state.query||[t.title,t.body,t.id,t.assignee,t.tag].join(' ').toLowerCase().includes(state.query.toLowerCase())));
 const ownsLane = t => ['auto','paused','decision','external','failed'].includes(t.mode);
 const record = (t,text) => {t.activity.push(text);t.revision++;};
 const message = (t,role,text) => {t.messages.push({role,text});};
 function writable(){if(state.offline)throw new Error('当前为离线演示。已保留草稿；恢复连接后再提交。');if(state.failNext){state.failNext=false;save();throw new Error('模拟提交失败，内容已保留。重试会继续处理同一件事情。');}}
 function activate(t){
  const busy=state.tasks.some(x=>x.id!==t.id&&x.project===t.project&&ownsLane(x));
  const full=state.tasks.filter(x=>x.id!==t.id&&x.mode==='auto').length>=3;
  t.mode=busy||full?'queued':'auto';t.status=t.mode==='queued'?'ready':'progress';
  if(!t.plan.length)t.plan=['理解目标与现有事实','完成修改并自查','验证结果并整理交付'];
  record(t,t.mode==='queued'?'已申请 Auto，等待当前工作区或并发位置':'已开始 Auto，沿用本事情的协作上下文');
 }
 function start(t){writable();if(!['review','ready'].includes(t.status)||!['manual','discussion','stopped'].includes(t.mode))throw new Error('当前状态不能作为新的 Auto 任务启动。请使用本事情的恢复或继续入口。');if(t.assignee!=='我')throw new Error('需要先核对执行人与操作权限。');if(!state.config[t.project])throw new Error('本项目尚未准备好本机执行环境，请先查看执行设置。');activate(t);save();}
 function advance(){
  writable();
  for(const t of state.tasks.filter(t=>t.mode==='auto')){
   if(t.pending.length){message(t,'agent','已在下一执行边界接收补充要求：'+t.pending.join('；'));record(t,'补充要求已生效：'+t.pending.join('；'));t.pending=[];}
   t.step++;
   if(t.step>=t.plan.length){t.mode='done';t.status='completed';record(t,'示例执行已完成，结果等待检查');message(t,'agent','已完成本次模拟执行。请在结果区域检查产物与验收口径。');}
   else record(t,'正在进行：'+t.plan[t.step]);
  }
  for(const t of state.tasks.filter(t=>t.mode==='queued')) activate(t);
  if(state.autoClaim)for(const t of state.tasks.filter(t=>t.status==='ready'&&t.mode==='manual'&&t.assignee==='我'&&state.config[t.project]))activate(t);
  save();
 }
 function send(t,text){
  writable();if(!text.trim())throw new Error('请先输入要求。');
  if(['completed','accepted','cancelled'].includes(t.status))throw new Error('当前事情已收束。请通过验收问题或新的事情继续工作。');
  message(t,'user',text.trim());
  if(t.mode==='auto') {t.pending.push(text.trim());record(t,'已收到补充说明，等待下一执行边界');}
  else if(['external','failed','stopped'].includes(t.mode)){record(t,'已保存恢复说明，执行状态保持不变');message(t,'agent','说明已记录。请在工作现场核对恢复条件，再选择重新检查或恢复。');}
  else if(t.mode==='queued'){record(t,'已补充待执行要求');message(t,'agent','补充要求已纳入本事情，等待 Auto 开始。');}
  else {
   if(!['paused','decision'].includes(t.mode))t.mode='discussion';
   if(!t.plan.length)t.plan=['确认目标、范围与已有事实','整理方案及需要调整的内容','验证结果并检查验收口径'];
   t.analysis='已把你的要求加入本事情。建议先核对目标与验收口径，方案确认后可交给 Auto。';
   message(t,'agent','已整理一份示例分析，展示在工作现场。你可以直接修改目标，或继续补充要求。');record(t,'分析内容已更新，等待你的下一步选择');
  }
  t.draft='';save();
 }
 function restore(t){
  writable();if(t.status!=='progress'||t.assignee!=='我')throw new Error('请先核对事情状态与执行人，恢复要求事情为进行中且执行人为自己。');
  if(!state.config[t.project])throw new Error('本项目的执行准备尚未就绪。');
  if(state.tasks.some(x=>x.id!==t.id&&x.project===t.project&&ownsLane(x)))throw new Error('同一工作区有其他执行，请等待它释放后再恢复。');
  if(state.tasks.filter(x=>x.id!==t.id&&x.mode==='auto').length>=3)throw new Error('执行位置已占满，请稍后恢复。');
  t.mode='auto';record(t,'用户继续原执行，协作身份保持不变');save();
 }
 function create(text,pid,fromChat=true){
  writable();if(!project(pid))throw new Error('请选择这件事情所属的项目。');if(!text.trim())throw new Error('请描述你想推进的事情。');
  const t=base(String(Math.max(...state.tasks.map(x=>Number(x.id)))+1),pid,text.trim().split('\n')[0].slice(0,55),'review',fromChat?'discussion':'manual',{body:text.trim(),priority:'中',tag:fromChat?'对话发起':'新事情'});
  if(fromChat){message(t,'user',text.trim());message(t,'agent','事情已建立，执行人为你。我会先围绕目标交流；开始 Auto 由你决定。');t.analysis='请核对目标和完成标准。可以继续交流，或直接编辑事情内容。';t.plan=['明确目标与范围','形成可检查的方案','执行与验证'];}
  state.tasks.unshift(t);state.selected=t.id;state.scope=pid;state.filter='all';state.query='';state.newDraft='';state.tab='scene';save();return t;
 }
 window.WorkModel={view,key,projects,states,modes,get state(){return state;},get storageAvailable(){return storageAvailable;},current,project,save,visible,record,message,writable,start,send,create,advance,restore,ownsLane,reset(){state=initial();save();}};
})();
