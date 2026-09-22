import {app,BrowserWindow} from 'electron';
import assert from 'node:assert/strict';
import {mkdtemp,mkdir,readFile,writeFile,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join,dirname} from 'node:path';
import {fileURLToPath} from 'node:url';
const here=dirname(fileURLToPath(import.meta.url)),base=await mkdtemp(join(tmpdir(),'arcorbit-create-settings-fixture-'));
const out=process.env.ARCORBIT_TEST_OUTPUT||await mkdtemp(join(tmpdir(),'arcorbit-create-settings-evidence-'));
const profile=process.env.ARCORBIT_CREATE_SETTINGS_PROFILE||join(base,'profile');
const phase=process.env.ARCORBIT_CREATE_SETTINGS_PHASE||'exercise';
process.env.ARCORBIT_CHAT_STREAM_PERFORMANCE_FIXTURE='1';
app.setPath('userData',profile);app.disableHardwareAcceleration();app.on('window-all-closed',()=>{});
app.whenReady().then(async()=>{
 let preload=await readFile(join(here,'organization-center-preload.cjs'),'utf8');
 preload=preload.replace('const calls = [];','const calls = []; let createFails=false, refreshFails=false, createDelay=0, testAccount="7", hintReadFailure=false;');
 preload=preload.replace('identity: "glare@example.test"','identity: `account-${testAccount}@example.test`');
 preload=preload.replace('contextBridge.exposeInMainWorld("arckitDesktop", {',`contextBridge.exposeInMainWorld("arckitDesktop", {
  setHintScenario:async value=>{
   hintReadFailure=!!value.readFailure;
   const w=platform.product_workspaces.find(p=>p.id==='11'),p=automation.projects.find(p=>p.id==='11');
   Object.assign(w,{current_user_id:'7',current_user_role:'owner'},value.workspace||{});
   Object.assign(p,{local_project_id:'local-11',local_project_path:'/repo/arcorbit',participating:true,source_status:'healthy'},value.project||{});
   Object.assign(automation,{enabled:true,queue_paused:false,source_status:'healthy',errors:[],recovery_items:[],attention_items:[],active_executions:[],concurrency:{available:3}},value.automation||{});
   for(const listener of automationListeners)listener({type:'automation.changed',reason:'hint-scenario'});
  },
  releaseSnapshot:async()=>({projects:[],records:[]}),releaseDetail:async id=>({project:{id,name:'Fixture',path:'',status:'unbound'},tasks:[],records:[],scripts:{},capabilities:{}}),syncWork:async()=>({}),
  setCreateScenario:async value=>{createFails=!!value.fail;refreshFails=!!value.refreshFail;createDelay=value.delay||0;},
  creationCalls:async()=>calls.filter(c=>c[0]==='task.create'),
  setCreateAccount:async id=>{testAccount=id;platform.user=id?{id,name:'Fixture '+id}:null;},
  invalidateCreateOptions:async()=>{platform.members=platform.members.filter(m=>String(m.user_id)!=='7');platform.tasks=platform.tasks.filter(t=>t.id!=='W-11');platform.tags=platform.tags.filter(t=>String(t.id)!=='201');},
  projectWorkbenchSnapshot:async()=>({account_scope:'fixture',projects:platform.projects,tasks:platform.tasks,runtime:automation,global_runtime:automation,source_status:'healthy'}),
  projectWorkbenchDetail:async()=>({}),onProjectWorkbenchEvent:()=>{},`);
 preload=preload.replace('checkSetupReadiness: async () => ({ status: "ready", first_install: false, checks: [], distribution: {}, counts: {} })', 'checkSetupReadiness: async input => {calls.push(["hintSetupCheck",input]);return {status:"ready"};}');
 preload=preload.replace('platformSnapshot: async (input) => {','platformSnapshot: async (input) => { if(hintReadFailure)throw Error("hint refresh unavailable"); if(refreshFails && input?.sections?.length===1 && input.sections[0]==="tasks")throw Error("refresh unavailable");');
 preload=preload.replace('if (command === "task.create") {','if (command === "task.create") { await new Promise(r=>setTimeout(r,createDelay)); if(createFails)throw Error("create rejected");');
 await mkdir(out,{recursive:true});await writeFile(join(base,'preload.cjs'),preload);
 const win=new BrowserWindow({show:false,width:1440,height:1050,webPreferences:{preload:join(base,'preload.cjs'),contextIsolation:true,sandbox:false}});
 const errors=[],checks=[];let exitCode=0;
 win.webContents.on('console-message',(_e,level,message)=>{if(level>=3)errors.push(message);});
 const js=s=>win.webContents.executeJavaScript(s),pause=()=>new Promise(r=>setTimeout(r,250));
 const click=id=>js(`document.getElementById(${JSON.stringify(id)}).click()`);
 const open=async(id='globalCreateTaskButton')=>{await click(id);await pause();};
 const close=()=>click('cancelPlatformActionButton');
 const get=name=>js(`document.querySelector('#platformActionFields [name="${name}"]').value`);
 const set=(name,value)=>js(`(()=>{const el=document.querySelector('#platformActionFields [name="${name}"]');el.value=${JSON.stringify(value)};el.dispatchEvent(new Event('change',{bubbles:true}));})()`);
 const visible=()=>js(`!document.getElementById('platformActionOverlay').classList.contains('hidden')`);
 const toggle=()=>js(`document.querySelector('[data-task-create-reuse]').click()`);
 const enabled=()=>js(`document.querySelector('[data-task-create-reuse]').checked`);
 const submit=async()=>{await js(`document.getElementById('platformActionForm').requestSubmit()`);await pause();await pause();};
 const scope=async value=>{await js(`document.getElementById('productScopeSelect').value=${JSON.stringify(value)};document.getElementById('productScopeSelect').dispatchEvent(new Event('change',{bubbles:true}))`);await pause();await pause();};
 const sync=async()=>{await click('syncButton');await pause();await pause();};
 const page=async name=>{await js(`document.querySelector('[data-page="${name}"]').click()`);await pause();};
 const stored=()=>js(`Object.fromEntries(Object.entries(localStorage).filter(([key])=>key.startsWith('arcorbit:task-creation-settings:')).map(([key,value])=>[key,JSON.parse(value)]))`);
 const fill=async(content='只保留选项，不记住正文')=>{await set('project_id','11');await set('content',content);await set('state','pending');await set('executor_id','7');await set('father_id','W-11');await set('priority','0');await js(`document.querySelector('[name=tag_ids][value="201"]').checked=true;document.querySelector('[name=tag_ids][value="202"]').checked=true;`);};
 const assertRestored=async()=>{assert.equal(await get('content'),'');assert.equal(await get('project_id'),'11');assert.equal(await get('state'),'pending');assert.equal(await get('executor_id'),'7');assert.equal(await get('father_id'),'W-11');assert.equal(await get('priority'),'0');assert.deepEqual(await js(`Array.from(document.querySelectorAll('[name=tag_ids]:checked')).map(el=>el.value)`),['201','202']);};
 try{
  await win.loadFile(join(here,'../../desktop/renderer/index.html'));await pause();await pause();await scope('11');
  await js('arckitDesktop.setHintScenario({})');await pause();await pause();await open();
  const hint=()=>js(`document.querySelector('[data-task-create-automation]').textContent`);
  const scenario=async value=>{await js(`arckitDesktop.setHintScenario(${JSON.stringify(value)})`);await pause();await pause();};
  await set('content','后台变化不能覆盖正文');
  for(const taskState of ['pending_review','pending','in_progress','completed','accepted','cancelled','blocked'])for(const executor of ['','7','8']){
   await set('state',taskState);await set('executor_id',executor);
   assert.match(await hint(),taskState==='pending'&&executor==='7'?/Automation 已开启/:/本待办不自动领取/);
  }
  assert.equal(await js(`document.querySelector('[name=state]').closest('.platform-action-field').querySelector('small')===null`),true);
  assert.equal(await js(`document.querySelector('[name=executor_id]').closest('.platform-action-field').querySelector('small')===null`),true);
  assert.equal(await js(`arckitDesktop.getTestCalls().then(calls=>calls.some(([name,input])=>name==='hintSetupCheck'&&input.projectId==='local-11'))`),true);
  checks.push('真实表单七状态×三执行人组合，两个旧提示移除且仅保留合并区');
  await set('state','pending');await set('executor_id','7');
  for(const [config,expected] of [
   [{readFailure:true},/待确认/],
   [{workspace:{current_user_id:''}},/待确认/],
   [{project:{source_status:'error'}},/待确认/],
   [{project:{local_project_id:'',local_project_path:''}},/绑定本地目录/],
   [{project:{participating:false},workspace:{current_user_role:'member'}},/联系项目管理员/],
   [{automation:{enabled:false}},/已关闭/],
   [{automation:{queue_paused:true}},/已暂停/],
   [{automation:{recovery_items:[{freeze_scope:'global'}]}},/等待处理/],
   [{automation:{recovery_items:[{project_id:'12'}]}},/已开启/],
   [{automation:{concurrency:{available:0}}},/等待空位/],
   [{},/已开启/]
  ]){await scenario(config);assert.match(await hint(),expected);}
  await js(`document.querySelector('[name=content]').focus();document.querySelector('[name=content]').setSelectionRange(2,4);window.keptTextarea=document.querySelector('[name=content]')`);
  await scenario({automation:{queue_paused:true}});assert.equal(await get('content'),'后台变化不能覆盖正文');assert.equal(await js(`document.activeElement===keptTextarea&&keptTextarea===document.querySelector('[name=content]')&&keptTextarea.selectionStart===2`),true);
  checks.push('后台快照更新未知、绑定、权限、关闭、暂停、恢复与忙碌；其他产品恢复不误阻断，正文节点/焦点/选区保留');
  await scenario({});await toggle();await submit();await open();assert.equal(await get('content'),'');assert.equal(await get('state'),'pending');assert.equal(await get('executor_id'),'7');assert.match(await hint(),/已开启/);
  await close();await scope('all');await open();await set('project_id','12');assert.equal(await get('executor_id'),'');assert.match(await hint(),/本待办不自动领取/);await set('project_id','11');await set('executor_id','7');await scenario({});
  checks.push('成功后复用值立即计算提示；切产品先清空关联并更新原因');
  for(const theme of ['light','dark']){await js(`document.documentElement.dataset.theme='${theme}';document.querySelector('[data-task-create-automation]').scrollIntoView({block:'center'})`);await pause();await writeFile(join(out,theme+'.png'),(await win.webContents.capturePage()).toPNG());}
  win.setSize(600,850);await pause();assert.equal(await js(`(()=>{const p=document.querySelector('.platform-action-panel');return p.scrollWidth<=p.clientWidth+1;})()`),true);await writeFile(join(out,'narrow.png'),(await win.webContents.capturePage()).toPNG());
  win.webContents.sendInputEvent({type:'keyDown',keyCode:'ESC'});win.webContents.sendInputEvent({type:'keyUp',keyCode:'ESC'});await pause();assert.equal(await js('document.activeElement.id'),'globalCreateTaskButton');
  checks.push('明暗绿色开启标记、600px 无横向溢出、Escape 焦点恢复');assert.deepEqual(errors,[]);
  await writeFile(join(out,'result.json'),JSON.stringify({status:'passed',checks,errors,boundary:'Production Renderer with isolated API; no live writes.'},null,2));console.log(JSON.stringify({status:'passed',checks,output:out}));
 }catch(error){exitCode=1;await writeFile(join(out,'failure.json'),JSON.stringify({error:String(error.stack),checks,errors},null,2));console.error(error,errors);}
 finally{win.destroy();await rm(base,{recursive:true,force:true,maxRetries:5,retryDelay:100}).catch(()=>{});app.exit(exitCode);}
});
