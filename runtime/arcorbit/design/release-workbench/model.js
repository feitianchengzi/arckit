/* Sample existing projects and bindings. Never invokes a server or a real process. */
window.ReleasePrototype = (() => {
  const key='arcorbit-release-prototype-v3';
  const copy=value=>structuredClone(value);
  const clock=()=>new Date().toLocaleTimeString('zh-CN',{hour:'2-digit',minute:'2-digit'});
  const files=[
    {id:'config',name:'build-config.json',staged:false,lines:[['context','{'],['remove','  "files": ["src/**"],'],['add','  "files": ["src/**", "resources/**"],'],['context','}']]},
    {id:'view',name:'release-view.js',staged:false,lines:[['context','function releaseView(build) {'],['remove','  return renderStatus(build);'],['add','  return renderStatus(build, { artifacts: true });'],['context','}']]}
  ];
  function project(id,name,workspace,path,cwd,kind,command,dev,artifact,buildId,failed){
    const source=id==='11'?'a18c7e2':'d914ea2';
    const build={id:buildId,projectId:id,name:kind==='app'?'本地安装包':'生产构建',status:failed?'failed':'success',at:'今天 '+(id==='11'?'11:20':'10:42'),source,dirty:failed,branch:'main',command,cwd:path+'/'+cwd,artifact,kind,progress:100,error:failed?'资源清单缺少 renderer/styles.css，未生成产物。':'',duration:'18 秒',configRevision:1};
    return {id,name,workspace,path,cwd,kind,command,dev,artifact,branch:'main',revision:source,ahead:0,files:failed?copy(files):[],file:'config',commitDraft:'',fixed:false,
      builds:[build],selectedBuild:buildId,instances:[],view:'local',scroll:{},chatDraft:'',agentBusy:false,context:null,
      messages:[{role:'agent',text:`这段对话固定属于 ${name} 的本地工作区。\n\n${failed?'最近一次构建失败，可以附加错误日志一起检查。':'项目已有成功构建，可以继续运行验证或准备发布。'}\n切换顶部查看范围后，消息和执行结果仍留在这里。`,actions:failed?[['analyze','分析最近失败',buildId]]:[['ask-build','准备本地构建']]}],
      sessions:[{id:`${id}-shell`,name:'zsh',cwd:path+'/'+cwd,owner:'你',draft:'',history:[],lines:[{text:`${name} · ${path}/${cwd}`,kind:'dim'},{text:'会话已固定工作区。输入 help 查看模拟命令。',kind:'dim'}]},
        {id:`${id}-build-${buildId}`,name:`构建 #${buildId}`,cwd:build.cwd,owner:'你',draft:'',history:[],lines:[{text:'❯ '+command,kind:'command'},{text:failed?'ERROR missing resource: renderer/styles.css':'✓ 构建完成 · '+artifact,kind:failed?'error':'success'}]}],session:`${id}-shell`,
      release:null,remoteTag:`beta/v0.9.0-rc1`,remoteRevision:source,
      environment:{version:'v0.8.2',previous:null,status:'healthy',at:'昨天 16:30',events:[],pendingVersion:null},latestRelease:'v0.8.2'};
  }
  function fresh(){return {version:3,activeWorkset:'core',scope:'all',focus:null,hideAgent:innerWidth<900,hideTerminal:false,nextBuild:1042,notice:null,
    worksets:[{id:'core',name:'核心推进',projectIds:['11','12','13']},{id:'web',name:'Web 产品',projectIds:['12','13']}],
    projects:[project('11','ArcOrbit','LOCAL-ARCKIT','~/Projects/arckit','runtime/arcorbit','app','npm run package:local','npm run desktop','release/ArcOrbit-local-arm64.dmg',1041,true),
      project('12','Workshop Todo','LOCAL-WORKSHOP','~/Projects/workshop','apps/todo-web','web','npm run build','npm run dev -- --port 5173','dist/',208,false),
      project('13','Feedback Console','LOCAL-FEEDBACK','~/Projects/feedback','apps/feedback-console','web','npm run build','npm run dev -- --port 5174','dist/',87,false)]};}
  let state;try{state=JSON.parse(localStorage.getItem(key));if(state?.version!==3)state=fresh();}catch{state=fresh();}
  for(const p of state.projects){
    if(p.agentBusy){p.agentBusy=false;p.messages.push({role:'agent',text:'页面重载，模拟回答已中断。你的消息已保留，可以继续提问。'});}
    for(const b of p.builds)if(b.status==='running'){b.status='interrupted';b.error='页面重载，模拟构建已中断。日志保留，可重新构建。';}
    for(const i of p.instances)i.running=false;
    for(const s of p.sessions)s.owner='你';
    if(p.release?.status==='running')p.release.status='interrupted';
    if(p.environment.status==='deploying'){p.environment.status='interrupted';p.environment.events.unshift({text:'页面重载，部署结果待核对；保留原版本。',at:clock()});}
  }
  const find=id=>state.projects.find(p=>p.id===String(id));
  const workset=()=>state.worksets.find(w=>w.id===state.activeWorkset);
  const visible=()=>state.projects.filter(p=>workset().projectIds.includes(p.id));
  const current=()=>find(state.scope==='all'?state.focus:state.scope)||null;
  const currentBuild=p=>p.builds.find(b=>b.id===p.selectedBuild)||p.builds[0];
  const session=p=>p.sessions.find(s=>s.id===p.session)||p.sessions[0];
  const busy=p=>p.builds.some(b=>b.status==='running');
  const active=()=>state.projects.flatMap(p=>[
    ...p.builds.filter(b=>b.status==='running').map(b=>({project:p,id:b.id,label:`构建 #${b.id}`,type:'build'})),
    ...p.instances.filter(i=>i.running).map(i=>({project:p,id:i.id,label:i.name,type:'instance'})),
    ...(p.agentBusy?[{project:p,label:'Agent 正在回答',type:'agent'}]:[]),
    ...(p.release?.status==='running'?[{project:p,label:'发布构建',type:'release'}]:[]),
    ...(p.environment.status==='deploying'?[{project:p,label:'测试环境部署',type:'environment'}]:[])
  ]);
  function save(){try{localStorage.setItem(key,JSON.stringify(state));}catch{}}
  return {key,copy,clock,find,workset,visible,current,currentBuild,session,busy,active,save,get state(){return state;},reset(){state=fresh();save();}};
})();
