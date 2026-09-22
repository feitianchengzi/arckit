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
 preload=preload.replace('const calls = [];','const calls = []; let createFails=false, refreshFails=false, createDelay=0, testAccount="7";');
 preload=preload.replace('identity: "glare@example.test"','identity: `account-${testAccount}@example.test`');
 preload=preload.replace('contextBridge.exposeInMainWorld("arckitDesktop", {',`contextBridge.exposeInMainWorld("arckitDesktop", {
  releaseSnapshot:async()=>({projects:[],records:[]}),releaseDetail:async id=>({project:{id,name:'Fixture',path:'',status:'unbound'},tasks:[],records:[],scripts:{},capabilities:{}}),syncWork:async()=>({}),
  setCreateScenario:async value=>{createFails=!!value.fail;refreshFails=!!value.refreshFail;createDelay=value.delay||0;},
  creationCalls:async()=>calls.filter(c=>c[0]==='task.create'),
  setCreateAccount:async id=>{testAccount=id;platform.user=id?{id,name:'Fixture '+id}:null;},
  invalidateCreateOptions:async()=>{platform.members=platform.members.filter(m=>String(m.user_id)!=='7');platform.tasks=platform.tasks.filter(t=>t.id!=='W-11');platform.tags=platform.tags.filter(t=>String(t.id)!=='201');},
  projectWorkbenchSnapshot:async()=>({account_scope:'fixture',projects:platform.projects,tasks:platform.tasks,runtime:automation,global_runtime:automation,source_status:'healthy'}),
  projectWorkbenchDetail:async()=>({}),onProjectWorkbenchEvent:()=>{},`);
 preload=preload.replace('platformSnapshot: async (input) => {','platformSnapshot: async (input) => { if(refreshFails && input?.sections?.length===1 && input.sections[0]==="tasks")throw Error("refresh unavailable");');
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
  await win.loadFile(join(here,'../../desktop/renderer/index.html'));await pause();await pause();
  if(phase==='restart'){
   await open();assert.equal(await enabled(),true);await assertRestored();checks.push('新的 Electron 进程使用同一 profile 恢复开关与全部成功选项，正文为空');
  }else{
   await scope('all');await open();assert.equal(await enabled(),false);assert.equal(await get('state'),'pending_review');assert.equal(await get('executor_id'),'');assert.equal(await get('content'),'');assert.equal(await js('document.activeElement.name'),'content');
   await fill();await toggle();assert.equal(await get('content'),'只保留选项，不记住正文');await submit();assert.equal(await visible(),false);
   const payload=(await js('arckitDesktop.creationCalls()')).at(-1)[1];assert.equal(payload.priority,'0');assert.equal(payload.tags,'201,202');assert.equal(payload.executor_id,'7');assert.equal(payload.father_id,'W-11');assert.equal(Object.hasOwn(payload,'reuse'),false);
   assert.equal(JSON.stringify(await stored()).includes('只保留选项'),false);
   await open();await assertRestored();checks.push('首次默认、焦点、切换不覆盖草稿；成功保存六类选项，正文不持久化、开关不进入业务参数');
   await set('priority','3');await set('content','取消草稿');await close();await open();await assertRestored();
   await set('content','失败重试');await set('priority','2');await js('arckitDesktop.setCreateScenario({fail:true,delay:350})');
   await js(`document.getElementById('platformActionForm').requestSubmit();document.getElementById('platformActionForm').requestSubmit()`);assert.equal(await js('document.getElementById("confirmPlatformActionButton").disabled'),true);await pause();await pause();
   assert.equal(await visible(),true);assert.equal(await get('content'),'失败重试');assert.equal(Object.values(await stored())[0].last.priority,'0');
   await js('arckitDesktop.setCreateScenario({})');await submit();await open();assert.equal(await get('priority'),'2');assert.equal(await get('content'),'');
   checks.push('取消/失败不替换成功记录；提交中防重；失败保留草稿并可重试');
   await toggle();assert.equal(await get('priority'),'2');await close();await open();assert.equal(await enabled(),false);assert.equal(await get('state'),'pending_review');assert.equal(await get('priority'),'');
   await set('content','关闭期间成功');await set('priority','3');await submit();await open();await toggle();await close();await open();assert.equal(await get('priority'),'3');
   await fill('刷新失败也记住成功');await js('arckitDesktop.setCreateScenario({refreshFail:true})');await submit();assert.equal(await visible(),false);assert.match(await js('document.getElementById("toast").textContent'),/已创建.*刷新失败/);
   await js('arckitDesktop.setCreateScenario({})');await open();await assertRestored();await close();checks.push('关闭恢复默认且仍更新成功记录；重新开启可复用；刷新失败不撤回成功记录');
   await page('work');await open('createTaskButton');await assertRestored();await close();await page('today');
   await js('arckitDesktop.setCreateAccount("8")');await sync();await open();assert.equal(await enabled(),false);assert.equal(await get('state'),'pending_review');await close();
   await js('arckitDesktop.setCreateAccount("")');await sync();await open();assert.equal(await js('document.querySelector("[data-task-create-reuse]").disabled'),true,JSON.stringify(await js(`(async()=>({user:(await arckitDesktop.platformSnapshot({})).user,auth:await arckitDesktop.getAuthStatus(),toast:document.getElementById('toast').textContent,status:document.querySelector('[data-task-create-settings-status]').textContent,sync:document.getElementById('syncButton').disabled}))()`)));assert.equal(await get('executor_id'),'');await close();
   await js('arckitDesktop.setCreateAccount("7")');await sync();await open();await assertRestored();await close();checks.push('Work 与全局入口共享设置；账户切换隔离；身份未知不读取记录；回到原账户恢复');
   await scope('12');await open();assert.equal(await get('project_id'),'12');assert.equal(await get('executor_id'),'');assert.equal(await get('father_id'),'');assert.equal(await get('priority'),'0');assert.equal(await get('state'),'pending');assert.match(await js('document.querySelector("[data-task-create-settings-status]").textContent'),/上次产品不在当前范围/);await close();
   await scope('all');await open();await assertRestored();await set('project_id','12');await set('project_id','11');assert.equal(await get('executor_id'),'');assert.equal(await get('father_id'),'');assert.equal(await js('document.querySelectorAll("[name=tag_ids]:checked").length'),0);await close();
   await js('arckitDesktop.invalidateCreateOptions()');await sync();await open();assert.equal(await get('executor_id'),'');assert.equal(await get('father_id'),'');assert.deepEqual(await js('Array.from(document.querySelectorAll("[name=tag_ids]:checked")).map(el=>el.value)'),['202']);assert.match(await js('document.querySelector("[data-task-create-settings-status]").textContent'),/部分上次选项已不可用/);await close();
   checks.push('范围外产品安全回退；手动切换清空关联；删除成员/父待办/标签后仅恢复有效交集');
   // Reload restores fixture candidates while preserving real localStorage.
   await win.loadFile(join(here,'../../desktop/renderer/index.html'));await pause();await pause();await open();await assertRestored();
   await js(`window.originalStorageSet=Storage.prototype.setItem;Storage.prototype.setItem=function(key,value){if(key.startsWith('arcorbit:task-creation-settings:'))throw Error('disk unavailable');return originalStorageSet.call(this,key,value);};void 0;`);
   await toggle();assert.equal(await enabled(),true);assert.match(await js('document.querySelector("[data-task-create-settings-status]").textContent'),/未能保存/);
   await set('content','存储失败仍创建');await set('priority','1');await submit();assert.equal(await visible(),false);assert.match(await js('document.getElementById("toast").textContent'),/已创建.*未能保存/);assert.equal(Object.values(await stored())[0].last.priority,'0');
   await js('Storage.prototype.setItem=window.originalStorageSet;void 0');await open();await assertRestored();checks.push('本机写入失败恢复开关；服务器已成功时仍关闭表单并明确设置未保存，不诱导重复创建');
   // Save a known complete selection for an actual second-process restart.
   await fill('重启恢复样例');await submit();await open();
   for(const theme of ['light','dark']){
    await js(`document.documentElement.dataset.theme='${theme}'`);await pause();
    await writeFile(join(out,`create-${theme}.png`),(await win.webContents.capturePage()).toPNG());
   }
   win.setSize(600,850);await pause();assert.equal(await js(`(()=>{const panel=document.querySelector('.platform-action-panel');return panel.scrollWidth<=panel.clientWidth+1&&panel.getBoundingClientRect().right<=innerWidth+1;})()`),true);
   await writeFile(join(out,'create-narrow.png'),(await win.webContents.capturePage()).toPNG());
   await js('document.querySelector("[data-task-create-reuse]").focus()');win.webContents.sendInputEvent({type:'keyDown',keyCode:'Space'});win.webContents.sendInputEvent({type:'keyUp',keyCode:'Space'});await pause();assert.equal(await enabled(),false);await toggle();
   win.webContents.sendInputEvent({type:'keyDown',keyCode:'ESC'});win.webContents.sendInputEvent({type:'keyUp',keyCode:'ESC'});await pause();assert.equal(await visible(),false);assert.equal(await js('document.activeElement.id'),'globalCreateTaskButton');
   checks.push('明暗截图、600px 无横向溢出；Space 切换、Escape 关闭和焦点恢复');
  }
  assert.deepEqual(errors,[]);win.webContents.session.flushStorageData();
  await rm(join(out,'failure.json'),{force:true});
  await writeFile(join(out,'result.json'),JSON.stringify({status:'passed',phase,checks,errors,boundary:'Production Renderer/HTML/CSS and real localStorage with isolated Workshop API fixture; no live service writes or packaged deployment.'},null,2)+'\n');
  console.log(JSON.stringify({status:'passed',phase,checks,output:out}));
 }catch(error){exitCode=1;await writeFile(join(out,'failure.json'),JSON.stringify({error:String(error.stack),checks,errors},null,2));console.error(error,errors);}
 finally{win.destroy();await rm(base,{recursive:true,force:true,maxRetries:5,retryDelay:100}).catch(()=>{});app.exit(exitCode);}
});
