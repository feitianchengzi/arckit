import {app,BrowserWindow} from 'electron';
import assert from 'node:assert/strict';
import {mkdtemp,mkdir,readFile,writeFile,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join,dirname} from 'node:path';
import {fileURLToPath} from 'node:url';
const here=dirname(fileURLToPath(import.meta.url)),base=await mkdtemp(join(tmpdir(),'arcorbit-global-create-'));
const out=process.env.ARCORBIT_TEST_OUTPUT||await mkdtemp(join(tmpdir(),'arcorbit-global-create-evidence-'));
process.env.ARCORBIT_CHAT_STREAM_PERFORMANCE_FIXTURE='1';
app.setPath('userData',join(base,'user'));app.disableHardwareAcceleration();app.on('window-all-closed',()=>{});
app.whenReady().then(async()=>{
 let preload=await readFile(join(here,'organization-center-preload.cjs'),'utf8');
 preload=preload.replace('const calls = [];','const calls = []; let createFails=false, refreshFails=false, createDelay=0;');
 preload=preload.replace('contextBridge.exposeInMainWorld("arckitDesktop", {',`contextBridge.exposeInMainWorld("arckitDesktop", {
  releaseSnapshot:async()=>({projects:[],records:[]}),releaseDetail:async id=>({project:{id,name:'Fixture',path:'',status:'unbound'},tasks:[],records:[],scripts:{},capabilities:{}}),
  syncWork:async()=>({}),
  setCreateScenario:async value=>{createFails=!!value.fail;refreshFails=!!value.refreshFail;createDelay=value.delay||0;},
  creationCalls:async()=>calls.filter(c=>c[0]==='task.create'),
  setEmptyCreateScope:async()=>{platform.active_workset.project_ids=[];},
  projectWorkbenchSnapshot:async()=>({account_scope:'fixture',projects:platform.projects,tasks:platform.tasks,runtime:automation,global_runtime:automation,source_status:'healthy'}),
  projectWorkbenchDetail:async()=>({}),onProjectWorkbenchEvent:()=>{},`);
 preload=preload.replace('platformSnapshot: async (input) => {','platformSnapshot: async (input) => { if(refreshFails)throw Error("refresh unavailable");');
 preload=preload.replace('if (command === "task.create") {','if (command === "task.create") { await new Promise(r=>setTimeout(r,createDelay)); if(createFails)throw Error("create rejected");');
 await mkdir(out,{recursive:true});await writeFile(join(base,'preload.cjs'),preload);
 const win=new BrowserWindow({show:false,width:1440,height:960,webPreferences:{preload:join(base,'preload.cjs'),contextIsolation:true,sandbox:false}});
 const errors=[],checks=[],layout=[];let status=0;
 win.webContents.on('console-message',(_e,level,message)=>{if(level>=3&&!message.includes('当前范围没有可创建待办'))errors.push(message)});
 const js=s=>win.webContents.executeJavaScript(s),pause=()=>new Promise(r=>setTimeout(r,250));
 const click=id=>js(`document.getElementById(${JSON.stringify(id)}).click()`);
 const fill=()=>js(`document.querySelector('#platformActionFields [name=content]').value='随时记录待办';`);
 const open=async()=>{await click('globalCreateTaskButton');await pause();};
 const submit=()=>js(`document.getElementById('platformActionForm').requestSubmit()`);
 const visible=()=>js(`!document.getElementById('platformActionOverlay').classList.contains('hidden')`);
 const page=async name=>{await js(`document.querySelector('[data-page="${name}"]').click()`);await pause();};
 try{
  await win.loadFile(join(here,'../../desktop/renderer/index.html'));await pause();await pause();
  await js(`document.getElementById('productScopeSelect').value='11';document.getElementById('productScopeSelect').dispatchEvent(new Event('change',{bubbles:true}))`);await pause();
  const pages=['today','chat','project-workbench','work','feedback','command','operations','organization','engineering','product','idea','release'];
  for(const name of pages){
   await page(name);const before=await js(`document.querySelector('[data-page-view].is-active')?.id`);
   await open();assert.equal(await visible(),true,name);assert.equal(await js('document.activeElement.name'),'content');
   assert.equal(await js(`document.querySelector('#platformActionFields [name=project_id]').value`),'11');
   assert.equal(await js(`document.querySelector('#platformActionFields [name=state]').value`),'pending_review');
   assert.equal(await js(`document.querySelector('#platformActionFields [name=executor_id]').value`),'');
   await click('cancelPlatformActionButton');assert.equal(await visible(),false);assert.equal(await js('document.activeElement.id'),'globalCreateTaskButton');
   assert.equal(await js(`document.querySelector('[data-page-view].is-active')?.id`),before);
  }
  checks.push('12 primary routes: shared entry, scoped defaults, content focus, cancel and original route/focus');
  await page('chat');await js(`document.getElementById('chatInput').value='保留对话草稿';document.getElementById('chatInput').dispatchEvent(new Event('input',{bubbles:true}));window.originalInput=document.getElementById('chatInput');`);
  await open();await fill();await js('arckitDesktop.setCreateScenario({fail:true,delay:600})');await submit();await submit();
  assert.equal(await js(`document.getElementById('confirmPlatformActionButton').disabled`),true);
  await js(`document.dispatchEvent(new KeyboardEvent('keydown',{key:'Escape',bubbles:true}))`);assert.equal(await visible(),true);
  await new Promise(r=>setTimeout(r,750));assert.equal(await visible(),true);assert.match(await js(`document.getElementById('platformActionStatus').textContent`),/create rejected/);
  assert.equal(await js(`document.querySelector('#platformActionFields [name=content]').value`),'随时记录待办');assert.equal((await js('arckitDesktop.creationCalls()')).length,1);
  await js('arckitDesktop.setCreateScenario({})');await submit();await pause();await pause();assert.equal(await visible(),false);
  assert.equal((await js('arckitDesktop.creationCalls()')).length,2);
  assert.equal(await js(`document.getElementById('chatInput')===originalInput&&originalInput.value==='保留对话草稿'`),true);
  assert.equal(await js(`document.querySelector('[data-page-view].is-active').id`),'chatView');
  checks.push('Busy blocks duplicate submit/Escape; rejection retains inputs; retry succeeds without replacing Chat draft');
  await open();await fill();await js('arckitDesktop.setCreateScenario({refreshFail:true})');await submit();await pause();await pause();
  assert.equal(await visible(),false);assert.match(await js(`document.getElementById('toast').textContent`),/已创建.*刷新失败/);
  assert.equal((await js('arckitDesktop.creationCalls()')).length,3);await js('arckitDesktop.setCreateScenario({})');
  checks.push('Confirmed creation with refresh failure closes and reports created, without a second create');
  await page('work');await click('createTaskButton');await pause();await fill();await submit();await pause();await pause();
  assert.equal(await visible(),false);assert.equal(await js('document.activeElement.id'),'createTaskButton');
  assert.equal(await js(`document.querySelector('[data-page-view].is-active').id`),'workView');
  await js(`document.getElementById('productScopeSelect').value='all';document.getElementById('productScopeSelect').dispatchEvent(new Event('change',{bubbles:true}))`);await pause();await open();await fill();
  assert.equal(await js(`document.querySelectorAll('#platformActionFields [name=project_id] option').length`),2);
  assert.equal(await js(`document.querySelector('#platformActionFields [name=project_id]').value`),'11');
  await js(`document.querySelector('#platformActionFields [name=executor_id]').value='7';document.querySelector('#platformActionFields [name=priority]').value='1';document.querySelector('#platformActionFields [name=project_id]').value='12';document.querySelector('#platformActionFields [name=project_id]').dispatchEvent(new Event('change',{bubbles:true}));`);
  assert.equal(await js(`document.querySelector('#platformActionFields [name=executor_id]').value`),'');
  assert.equal(await js(`document.querySelector('#platformActionFields [name=content]').value`),'随时记录待办');
  assert.equal(await js(`document.querySelector('#platformActionFields [name=priority]').value`),'1');
  assert.equal(await js(`!!document.querySelector('#platformActionFields [name=executor_id] option[value="7"]')`),false);
  await click('cancelPlatformActionButton');checks.push('All-products defaults to first; switching within range refreshes dependent choices and preserves content/priority');
  await open();await js(`document.getElementById('confirmPlatformActionButton').focus();document.dispatchEvent(new KeyboardEvent('keydown',{key:'Tab',bubbles:true,cancelable:true}))`);assert.equal(await js('document.activeElement.id'),'closePlatformActionButton');
  await js(`document.dispatchEvent(new KeyboardEvent('keydown',{key:'Tab',shiftKey:true,bubbles:true,cancelable:true}))`);assert.equal(await js('document.activeElement.id'),'confirmPlatformActionButton');await click('cancelPlatformActionButton');
  checks.push('Work entry shares submission; focus cycles inside modal and restores to Work trigger');
  for(const width of [1440,1000,760,390])for(const theme of ['light','dark']){
   win.setSize(width,960);await pause();await js(`document.documentElement.dataset.theme='${theme}'`);const beforeWidth=await js('document.documentElement.scrollWidth');await open();
   const size=await js(`(()=>{const b=document.getElementById('globalCreateTaskButton').getBoundingClientRect(),d=document.querySelector('.platform-action-panel').getBoundingClientRect();return {width:innerWidth,right:b.right,left:b.left,button:b.width,dialogRight:d.right,dialogLeft:d.left,documentWidth:document.documentElement.scrollWidth};})()`);
   assert.ok(size.button>=32&&size.left>=0&&size.right<=size.width);assert.ok(size.dialogLeft>=0&&size.dialogRight<=size.width);assert.ok(size.documentWidth<=beforeWidth,JSON.stringify({size,beforeWidth}));layout.push({...size,beforeWidth,theme});
   if(width===1440||width===390)await writeFile(join(out,`create-${width}-${theme}.png`),(await win.webContents.capturePage()).toPNG());
   win.webContents.sendInputEvent({type:'keyDown',keyCode:'ESC'});win.webContents.sendInputEvent({type:'keyUp',keyCode:'ESC'});await pause();assert.equal(await visible(),false);
  }
  checks.push('1440/1000/760/390px light/dark: top-level action and modal fit; native Escape closes');
  await js('arckitDesktop.setEmptyCreateScope()');await click('syncButton');await pause();await pause();await open();assert.equal(await visible(),false);assert.match(await js(`document.getElementById('toast').textContent`),/没有可创建/);
  checks.push('Empty product scope explains recovery without opening a form');assert.deepEqual(errors,[]);
  await writeFile(join(out,'result.json'),JSON.stringify({status:'passed',checks,errors,layout,boundary:'Production HTML/CSS/Renderer with controlled preload API fixtures; no live Workshop writes or packaged app deployment.'},null,2)+'\n');console.log(JSON.stringify({status:'passed',checks,output:out}));
 }catch(e){status=1;await writeFile(join(out,'failure.json'),JSON.stringify({error:String(e.stack),errors},null,2));console.error(e,errors);console.error(await js(`JSON.stringify([...document.querySelectorAll("body *")].filter(e=>{const r=e.getBoundingClientRect();return r.width&&r.right>innerWidth+1}).slice(0,15).map(e=>({id:e.id,cls:e.className,right:e.getBoundingClientRect().right})))`));}
 finally{win.destroy();await rm(base,{recursive:true,force:true,maxRetries:5,retryDelay:100}).catch(()=>{});app.exit(status);}
});
