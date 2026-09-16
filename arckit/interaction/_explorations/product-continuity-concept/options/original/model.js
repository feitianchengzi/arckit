/* Local concept simulator. No backend, file-body reads, credentials or real Agent. */
(() => {
  const KEY = 'arcorbit-product-continuity-concept-v3';
  const clone = value => JSON.parse(JSON.stringify(value));
  const conversation = (id, title, messages = []) => ({id, title, messages, draft:'', busy:false});
  const msg = (role, text, detail='') => ({id:crypto.randomUUID(), role, text, detail});
  const seed = () => ({version:1, failBinding:false, products:[
    {id:'p-ledger',name:'轻记账',description:'让个人和家庭轻松记录日常收支，知道钱花在了哪里。',goal:'把可演示的记账应用推进到真实可用',stage:'developing',org:'拾光工作室',source:'pocket-ledger',sourceKind:'folder',repo:'github.com/shiguang/pocket-ledger',repoMode:'keep',gitOwner:'shiguang',repoName:'pocket-ledger',location:'existing',path:'~/Projects/pocket-ledger',members:'Glare · 负责人',dirty:[],revision:1,step:'complete',remoteId:'PROJECT-108',bound:true,added:true,work:'proposed',currentConversation:'work',conversations:[conversation('intake','添加与接入',[msg('system','从 pocket-ledger 文件夹添加'),msg('assistant','已沿用现有仓库，并关联拾光工作室的远程项目。产品资料与原始材料已保存。')]),conversation('work','让 Demo 真实可用',[msg('user','帮我看看这个 Demo 接下来最需要完善什么。'),msg('tool','已查看记账流程与数据存储','演示结果：src/store.ts 使用内存数据；刷新页面后记录丢失。'),msg('assistant','现在可以录入和查看账单，但刷新后数据会丢失。建议先完成“记账数据持久化”，让 Demo 能用于连续记账。\n\n左侧是这件工作的范围，你可以修改目标，也可以确认开始。')])]},
    {id:'p-travel',name:'周末去哪',description:'根据距离、天气和同行人，找到适合短途出发的地方。',goal:'明确第一批用户与核心使用场景',stage:'idea',org:'个人',source:'',sourceKind:'blank',repo:'',repoMode:'later',gitOwner:'',repoName:'',location:'later',path:'',members:'Glare · 创建者',dirty:[],revision:1,step:'ready',remoteId:'',bound:false,added:true,work:'none',currentConversation:'intake',conversations:[conversation('intake','最初的想法',[msg('user','想做一个帮我决定周末去哪的小产品。'),msg('assistant','已经保存。我们可以先从“和谁一起出门、愿意走多远”这两个真实决策开始梳理。')])]},
    {id:'p-feedback',name:'团队反馈台',description:'把分散的用户意见转成可持续跟进的产品改进。',goal:'完成反馈图片的查看体验',stage:'developing',org:'拾光工作室',source:'feedback-hub',sourceKind:'folder',repo:'github.com/shiguang/feedback-hub',repoMode:'keep',gitOwner:'shiguang',repoName:'feedback-hub',location:'existing',path:'~/Projects/feedback-hub',members:'Glare · 负责人',dirty:[],revision:1,step:'complete',remoteId:'PROJECT-109',bound:true,added:true,work:'review',currentConversation:'work',conversations:[conversation('intake','添加与接入',[msg('assistant','产品已接入，保留现有仓库与目录。')]),conversation('work','反馈图片查看',[msg('user','把反馈里的图片做成可以直接查看的。'),msg('tool','实现与检查已完成','模拟结果：缩略图、原图查看和加载失败重试均已完成。'),msg('assistant','反馈图片查看已完成。请查看左侧结果，并确认是否符合预期。')])]}
  ]});
  let state;
  try { state=JSON.parse(localStorage.getItem(KEY)); if(state?.version!==1 || !Array.isArray(state.products)) state=seed(); } catch { state=seed(); }
  let saveError = false;
  const save = () => { try { localStorage.setItem(KEY,JSON.stringify(state)); } catch { saveError=true; } };
  for(const p of state.products) {
    for(const c of p.conversations) if(c.busy) { c.busy=false; c.messages.push(msg('system','上次处理已中断，已完成结果保留。可继续处理。')); }
    if(['analyzing','executing'].includes(p.step)) {p.resumeStep=p.step; p.step='paused';}
    if(p.work==='running') p.work='paused';
  }
  save();
  const jobs = new Map();
  const editing = new Map();
  const get = id => state.products.find(p=>p.id===id);
  const current = p => p.conversations.find(c=>c.id===p.currentConversation) || p.conversations[0];
  function productConversation(p){let c=p.conversations.find(c=>c.id==='product');if(!c){c=conversation('product','产品方向与迭代',[msg('assistant','这里可以一起完善产品理念、迭代目标与核心资产。修改先保留为本机草稿，确认提交到仓库后共享。具体工作、执行和反馈继续在对应的 Product Lifecycle 页面处理。')]);p.conversations.push(c);}return c;}
  const emit = (id,kind='state') => { save(); document.dispatchEvent(new CustomEvent('concept-change',{detail:{id,kind}})); };
  const append = (p,role,text,detail='',c=current(p)) => { c.messages.push(msg(role,text,detail)); };
  const cancel = id => { const job=jobs.get(id); if(job) clearTimeout(job.timer); jobs.delete(id); };
  const run = (p,steps,done) => {
    cancel(p.id); const job={timer:null}; jobs.set(p.id,job); const c=current(p); c.busy=true; let i=0; emit(p.id);
    const tick=()=>{if(jobs.get(p.id)!==job)return; if(i<steps.length){steps[i++]();emit(p.id);job.timer=setTimeout(tick,900);}else{jobs.delete(p.id);c.busy=false;done();emit(p.id);}};
    job.timer=setTimeout(tick,650);
  };
  function create() {
    const p={id:`idea-${crypto.randomUUID().slice(0,8)}`,name:'',description:'',goal:'',stage:'idea',org:'',source:'',sourceKind:'',repo:'',repoMode:'later',gitOwner:'',repoName:'',location:'later',path:'',members:'Glare · 创建者',dirty:[],revision:1,step:'empty',remoteId:'',bound:false,added:false,work:'none',currentConversation:'intake',conversations:[conversation('intake','添加 Idea')]};
    state.products.unshift(p);save();return p;
  }
  function edit(p,field,value,origin='界面操作') {
    if(window.Support&&['vision','audience','principles','description','iterationName','iterationGoal','iterationTag'].includes(field))Support.defaults(p);
    const key=p.id+':'+field, previous=editing.has(key)?editing.get(key):p[field];editing.delete(key);
    if(previous===value)return;
    p[field]=value;p.revision++;if(!p.dirty.includes(field))p.dirty.push(field);
    if(window.Support&&['vision','audience','principles','description','iterationName','iterationGoal','iterationTag'].includes(field))Support.markDraft(p);
    const labels={name:'名称',description:'产品说明',org:'项目归属',repo:'仓库地址',repoMode:'仓库方式',gitOwner:'GitHub 主体',repoName:'仓库名称',location:'本地目录方式',path:'本地目录',goal:'推进目标',members:'成员说明',vision:'产品理念',audience:'目标用户',principles:'产品原则',iterationName:'当前迭代',iterationGoal:'迭代目标',iterationTag:'关联标签'};
    const display={keep:'沿用现有仓库',new:'新建仓库',later:'稍后配置',existing:'使用原目录',copy:'复制到指定目录'};
    append(p,'system',`${origin}：${labels[field]||field} → ${display[value]||value||'未填写'}`,'',['vision','audience','principles','iterationName','iterationGoal'].includes(field)?productConversation(p):current(p));
    emit(p.id,'edit');
  }
  function draftField(p,field,value){
    if(window.Support)Support.defaults(p);
    const key=p.id+':'+field;if(!editing.has(key))editing.set(key,p[field]);
    p[field]=value;p.revision++;if(!p.dirty.includes(field))p.dirty.push(field);
    if(window.Support&&['vision','audience','principles','description','iterationName','iterationGoal','iterationTag'].includes(field))Support.markDraft(p);save();
  }
  function analyze(p,source,isDemo=true) {
    p.source=source;p.sourceKind='folder';p.demo=isDemo;p.step='analyzing';
    if(!p.dirty.includes('name')&&!p.name)p.name=source;
    p.currentConversation='intake';append(p,'system',`已添加文件夹：${source}${isDemo?'（演示材料）':'（仅本地文件名；分析使用固定示例）'}`);
    append(p,'assistant','我会先了解已有材料，整理产品内容，并检查接入需要的信息。你可以同时修改左侧内容。');
    run(p,[
      ()=>append(p,'tool','已查看文件夹材料','模拟读取：README.md、package.json、src/ 和设计稿。原型不会读取所选文件的正文。'),
      ()=>{
        if(!p.dirty.includes('name'))p.name=isDemo?'轻记账 Demo':source;
        if(!p.dirty.includes('description'))p.description='帮助个人记录日常收支，查看月度支出与分类统计。当前为可交互 Demo。';
        if(!p.dirty.includes('repo'))p.repo=isDemo?'github.com/lin/pocket-ledger':'';
        if(!p.dirty.includes('repoMode'))p.repoMode=isDemo?'keep':'later';
        if(!p.dirty.includes('location'))p.location=isDemo?'existing':'later';
        if(!p.dirty.includes('path'))p.path=isDemo?'~/Downloads/pocket-ledger':'';
        p.repoName='pocket-ledger';p.gitOwner='shiguang';
        append(p,'tool','已整理产品内容与接入信息','演示发现：记账界面可用，数据仍保存在内存。已有仓库与本地目录仅在 Demo 路径中模拟。');
      }
    ],()=>{p.step='ready';append(p,'assistant',`产品内容已经整理到左侧${isDemo?'，检测到的原仓库建议沿用':''}。\n\n如果希望正式接入，请选择项目归属；也可以先保存 Idea。你手动修改的内容已保留。`);});
  }
  function blank(p) {p.sourceKind='blank';p.step='ready';append(p,'system','从空白 Idea 开始。没有文件夹也可以保存。');emit(p.id);}
  function plan(p) {
    if(current(p).busy)return;
    p.currentConversation='intake';
    if(!p.name.trim()){append(p,'assistant','先给这个 Idea 一个名称，就可以继续。');emit(p.id);return;}
    if(!p.org){append(p,'assistant','还需要确定正式项目属于个人还是工作室。请在左侧选择归属。');emit(p.id);return;}
    if(p.repoMode==='new'&&(!p.gitOwner.trim()||!p.repoName.trim())){append(p,'assistant','新建仓库需要 GitHub 主体和仓库名称，请在左侧补齐。');emit(p.id);return;}
    if(p.repoMode==='keep'&&!p.repo.trim()){append(p,'assistant','请补充要沿用的仓库地址，或选择稍后配置。');emit(p.id);return;}
    if(p.location!=='later'&&!p.path.trim()){append(p,'assistant','请补充本地目标目录，或选择稍后配置。');emit(p.id);return;}
    p.step='confirm';append(p,'assistant','接入方案已整理。确认后，我会按下面的内容执行。你也可以先修改左侧配置，方案会同步更新。');emit(p.id);
  }
  function execute(p) {
    if(current(p).busy || !['confirm','failed','paused'].includes(p.step))return;
    p.currentConversation='intake';p.step='executing';
    append(p,'user',p.remoteId?'继续完成本地连接。':'确认这份接入方案，开始执行。');
    const steps=[];
    if(!p.remoteId)steps.push(()=>{p.remoteId=`PROJECT-DEMO-${p.id.slice(-8)}`;append(p,'tool','远程项目已创建',`${p.org} / ${p.name}\n模拟项目：${p.remoteId}。重试时复用此记录。`);});
    if(!p.repoDone)steps.push(()=>{p.repoDone=true;if(p.repoMode==='new')p.repo=`github.com/${p.gitOwner}/${p.repoName}`;append(p,'tool',p.repoMode==='later'?'仓库已设为稍后配置':'仓库关系已确认',p.repoMode==='later'?'本次不创建或关联仓库。':`模拟仓库：${p.repo}`);});
    run(p,steps,()=>{
      if(state.failBinding&&p.location!=='later'&&!p.bound){state.failBinding=false;p.step='failed';append(p,'tool','本地目录连接失败','演示：目标目录不可写。远程项目和仓库关系已保存，重试只处理本地连接。');append(p,'assistant','远程项目已创建，但本地连接尚未完成。可以修改目录后重试，或稍后再连接。');}
      else{p.bound=p.location!=='later';p.step='complete';p.stage='developing';p.added=true;append(p,'tool',p.bound?'本地目录已连接':'本地连接已留待稍后',p.bound?`模拟目录：${p.path}`:'产品已纳入管理，当前设备尚未准备开发目录。');append(p,'assistant','接入已完成。进入产品后，可以继续查看这些材料与对话，再决定下一步要推进什么。');}
    });
  }
  function stop(p) {cancel(p.id);for(const c of p.conversations)c.busy=false;if(p.work==='running')p.work='paused';else{p.resumeStep=p.step;p.step='paused';}append(p,'system','你已停止处理，已完成的内容与操作保留。');emit(p.id);}
  function resume(p){if(p.work==='paused')return workRun(p);if(p.resumeStep==='analyzing')return analyze(p,p.source,p.demo);return execute(p);}
  function saveIdea(p){p.added=true;p.name=p.name.trim()||'未命名 Idea';if(p.step==='empty')p.step='ready';append(p,'system','Idea 已保存在本机，可在产品中继续完善；尚未接入的内容不会同步给团队。');emit(p.id);}
  function startWork(p){
    let c=p.conversations.find(c=>c.id==='work');if(!c){c=conversation('work','下一步推进');p.conversations.push(c);}p.currentConversation='work';
    if(p.work==='none'){p.work='proposed';p.goal=p.goal||'把 Demo 推进到真实可用';append(p,'user',p.goal);append(p,'tool','已对照产品现状与目标','模拟发现：现有记账数据保存在内存，刷新后丢失。');append(p,'assistant','建议先完成“记账数据持久化”。范围是保存账单、刷新恢复，以及空数据处理。请查看左侧工作范围后确认。');}emit(p.id);
  }
  function workRun(p){
    p.currentConversation='work';p.work='running';append(p,'user','按当前范围继续推进。');
    run(p,[()=>append(p,'tool','正在完成数据保存与恢复','模拟修改账单存储逻辑。'),()=>append(p,'tool','已完成行为检查','模拟检查：新建账单、刷新恢复、空数据初始化。')],()=>{p.work='review';append(p,'assistant','这件工作已完成，等待你的验收。请查看左侧结果；有问题可以直接提出，我会继续处理。');});
  }
  function accept(p){p.work='accepted';append(p,'user','验收通过。');append(p,'assistant','已记录验收结果。这件工作已收口，你可以继续提出产品的下一目标。');emit(p.id);}
  function send(p,text){
    if(!text.trim()||p.conversations.some(c=>c.busy))return;current(p).draft='';append(p,'user',text.trim());
    if(!p.sourceKind){p.sourceKind='blank';p.step='ready';}
    const rename=text.match(/(?:改名为|名称改为|叫做)[「“"‘']?([^\n，,。！？」”"’']+)/);
    let changed=false;
    if(rename){p.name=rename[1].trim();if(!p.dirty.includes('name'))p.dirty.push('name');p.revision++;changed=true;}
    if(/仓库沿用|沿用.*仓库/.test(text)&&p.repo){p.repoMode='keep';changed=true;}
    if(/放到拾光工作室|归属.*拾光/.test(text)){p.org='拾光工作室';changed=true;}
    if(/复制到/.test(text)){const m=text.match(/复制到\s*([^，,。\n]+)/);if(m){p.location='copy';p.path=m[1].trim();changed=true;}}
    if(changed){append(p,'assistant','已按你的要求更新左侧内容。接入方案会使用这些最新值。');emit(p.id);return;}
    if(/接入|纳入.*管理/.test(text)){emit(p.id);plan(p);return;}
    if(/下一步|真实可用/.test(text)&&p.added){startWork(p);return;}
    if(!p.description){p.description=text.trim();p.name=p.name||text.trim().slice(0,14);append(p,'assistant','已把你的描述保存到左侧。可以直接调整名称和说明，先保存为 Idea，或继续准备项目接入。');}
    else append(p,'assistant','已记录这条补充。此概念稿使用预设模拟，不会对任意消息运行真实 Agent。你可以直接编辑左侧内容，或点击示例要求体验联动。');
    emit(p.id);
  }
  window.Concept={state,get,current,productConversation,create,edit,draftField,analyze,blank,plan,execute,stop,resume,saveIdea,startWork,workRun,accept,send,append,emit,save,
    get saveError(){return saveError;},reset(){for(const id of jobs.keys())cancel(id);state=seed();this.state=state;save();},setFailure(value){state.failBinding=value;save();},clone};
})();
