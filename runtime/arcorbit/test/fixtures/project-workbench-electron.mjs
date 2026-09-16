import {app,BrowserWindow,ipcMain} from 'electron';
import assert from 'node:assert/strict';
import {mkdtemp,readFile,writeFile,mkdir,rm} from 'node:fs/promises';
import {join,dirname} from 'node:path';
import {tmpdir} from 'node:os';
import {fileURLToPath} from 'node:url';
const here=dirname(fileURLToPath(import.meta.url)),base=await mkdtemp(join(tmpdir(),'workbench-gui-'));
const output=process.argv[process.argv.indexOf('--evidence')+1]||join(base,'evidence');
app.setPath('userData',join(base,'user'));app.disableHardwareAcceleration();
const errors=[],checks=[];let window;
const scene=id=>({task_id:id,revision:0,goal_version:'goal',criteria:[{id:'c1',text:'已有页面可继续使用',checked:false,status:'accepted'}],agreements:[{id:'g1',text:'事情保持一个主协作会话',status:'accepted',source:'user',at:new Date().toISOString()}],plan:[],context:[],reports:[{id:'r1',current:'核对项目边界与交互细节',summary:'已确认新页面与原服务的组合方式',advances:['保留共享事情服务','确认主会话持续性'],remaining:['验证窄窗口交互'],next:'实际检查消息弹层',artifacts:[],source:'agent_claim',at:new Date().toISOString()}],events:[],pause_requested:false});
const tasks=[{id:'1',project_id:'p',content:'# 统一项目事情台\n\n目标是让人围绕事情表达目标、检查结果、处理例外和改变方向。\n\n'+Array.from({length:14},(_,i)=>`需要核对的项目细节 ${i+1}：保留已有能力并支持持续协作。`).join('\n\n'),executor_id:'7',executor_name:'Glare',priority:1,state:'pending_review'},...Array.from({length:20},(_,i)=>({id:String(i+2),project_id:i%2?'q':'p',content:`项目事情 ${i+2} · 检查结果与处理例外`,executor_id:'7',executor_name:'Glare',priority:2,state:i===0?'completed':'pending'}))];
const scenes=Object.fromEntries(tasks.map(t=>[t.id,scene(t.id)])),messages={},calls=[];
const snap=()=>({account_scope:'fixture-user',user:{id:'7',name:'Glare'},projects:[{id:'p',name:'ArcOrbit',local_project_id:'local',state:'healthy'},{id:'q',name:'协作平台',local_project_id:'local-q',state:'healthy'}],local_projects:[{id:'local',name:'ArcOrbit'}],tasks,scenes,runtime:{queue:[{id:'3',task_id:'3'}],attention_items:[{task_id:'2',reason:'待验收'}],recovery_items:[],active_executions:[{task_id:'4',execution_id:'e4',phase:'running'}]},settings:{codex:{chat:{model:'gpt-6-astra',reasoning_effort:'high'}}},source_status:'healthy',errors:[]});
let snapshotReads=0,detailReads=0;const taskActivity={};
ipcMain.handle('pw:snapshot',()=>{snapshotReads++;return snap();});
ipcMain.handle('pw:detail',(_event,id)=>(detailReads++,{task:tasks.find(t=>t.id===id),scene:scenes[id],local_project:{id:'local',name:'ArcOrbit'},session:null,messages:messages[id]||[],runs:taskActivity[id]?[{id:taskActivity[id].id,status:'running'}]:[],activity:taskActivity[id]?.activity||null,result:null,executions:[],history:[],attachments:[],attachment_error:'',feedback:[],recovery:[],attention:[],current_turn_owner:'',children:[],user:{id:'7'},members:[]}));
ipcMain.handle('pw:command',(_event,action,input)=>{calls.push({action,input});if(action==='chat.send'){messages[input.task_id]||=[];messages[input.task_id].push({id:crypto.randomUUID(),role:'user',kind:'text',content:input.text,created_at:new Date().toISOString()},{id:crypto.randomUUID(),role:'assistant',kind:'text',content:'已读取当前事情。这个讨论会继续保留在主协作会话中。',created_at:new Date().toISOString()});return {};}
 if(action==='task.create'){const id=String(tasks.length+1);tasks.push({id,project_id:input.project_id,content:input.content,state:'pending_review',executor_id:'7'});scenes[id]=scene(id);return {task_id:id};}
 if(action==='plan.set'){scenes[input.task_id].plan=input.input.items;scenes[input.task_id].revision++;}
 return {};
});
app.whenReady().then(async()=>{let failed=false;
try{
 await mkdir(output,{recursive:true});
 const preload=(await readFile(join(here,'organization-center-preload.cjs'),'utf8')).replace('onEvent: () => () => {},', 'onEvent: listener => { globalThis.runtimeListeners ||= []; globalThis.runtimeListeners.push(listener); return ()=>{}; }, emitTestRunEvent: event => { for(const listener of globalThis.runtimeListeners || []) listener(event); },').replace('contextBridge.exposeInMainWorld("arckitDesktop", {',`contextBridge.exposeInMainWorld("arckitDesktop", {\n releaseSnapshot:async()=>({projects:[],records:[]}),projectWorkbenchSnapshot:()=>ipcRenderer.invoke('pw:snapshot'),projectWorkbenchDetail:id=>ipcRenderer.invoke('pw:detail',id),projectWorkbenchCommand:(action,input)=>ipcRenderer.invoke('pw:command',action,input),onProjectWorkbenchEvent:()=>()=>{},`);
 await writeFile(join(base,'preload.cjs'),preload);
 window=new BrowserWindow({show:false,width:1440,height:960,webPreferences:{preload:join(base,'preload.cjs'),contextIsolation:true,sandbox:false}});
 window.webContents.on('console-message',(_event,level,message)=>{if(level>=3)errors.push(message);});window.webContents.on('render-process-gone',(_event,detail)=>errors.push(detail.reason));
 await window.loadFile(join(here,'../../desktop/renderer/index.html'));
 const js=code=>window.webContents.executeJavaScript(code);
 async function wait(code,label){for(let i=0;i<100;i++){if(await js(code))return;await new Promise(r=>setTimeout(r,40));}throw new Error('Timed out: '+label);}
 await wait(`document.querySelector('#projectWorkbenchView .pw-heading').textContent.includes('统一项目事情台')`,'initial workbench');
 // Exercise production scroll handlers and an unchanged refresh in Chromium.
 await js(`new Promise(resolve=>setTimeout(resolve,350))`);
 const scrollCheck=await js(`(async()=>{
   const original=Storage.prototype.setItem;let writes=0;
   Storage.prototype.setItem=function(...args){if(args[0].startsWith('arcorbit-workbench:'))writes++;return original.apply(this,args);};
   try{
     for(const selector of ['.pw-body','.pw-rows']){const node=document.querySelector(selector);for(let i=0;i<60;i++){node.scrollTop=i;node.dispatchEvent(new Event('scroll'));}}
     const during=writes;await new Promise(resolve=>setTimeout(resolve,400));
     const saved=JSON.parse(localStorage.getItem('arcorbit-workbench:fixture-user'));
     return {during,after:writes,body:saved.scroll['1:overview'],list:saved.scroll.list};
   }finally{Storage.prototype.setItem=original;}
 })()`);
 assert.equal(scrollCheck.during,0);assert.equal(scrollCheck.after,1);assert.equal(scrollCheck.body,59);assert.equal(scrollCheck.list,59);checks.push('scroll state writes coalesce after scrolling and retain both positions');
 await js(`window.workbenchBodyBefore=document.querySelector('.pw-body').firstElementChild;document.querySelector('.pw-body details').open=true;document.querySelector('#workbenchSyncSettings').click();new Promise(resolve=>setTimeout(resolve,350))`);
 assert(await js(`document.querySelector('.pw-body').firstElementChild===window.workbenchBodyBefore && document.querySelector('.pw-body details').open`));checks.push('unchanged refresh retains detail DOM and expanded sections');
 const backgroundBefore={snapshotReads,detailReads};
 const backgroundCheck=await js(`(async()=>{
   const before=(await arckitDesktop.getTestCalls()).filter(c=>c[0]==='platformSnapshot').length;
   let hiddenMutations=0;const observer=new MutationObserver(records=>hiddenMutations+=records.length);
   for(const node of document.querySelectorAll('[data-page-view]'))if(node.dataset.pageView!=='project-workbench')observer.observe(node,{subtree:true,childList:true});
   for(let i=0;i<3;i++){await arckitDesktop.emitTestWorkSyncEvent();await arckitDesktop.emitTestAutomationEvent();await new Promise(resolve=>setTimeout(resolve,400));}
   observer.disconnect();return {platformReads:(await arckitDesktop.getTestCalls()).filter(c=>c[0]==='platformSnapshot').length-before,hiddenMutations};
 })()`);
 assert.equal(backgroundCheck.platformReads,0);assert.equal(backgroundCheck.hiddenMutations,0);
 assert.equal(snapshotReads-backgroundBefore.snapshotReads,3);assert.equal(detailReads-backgroundBefore.detailReads,3);checks.push('event bursts refresh only the workbench with no hidden legacy rendering');
 taskActivity['1']={id:'R1',activity:{projection_revision:0,messages:[]}};
 await js(`document.querySelector('#workbenchSyncSettings').click();new Promise(resolve=>setTimeout(resolve,350))`);
 const activityBefore={snapshotReads,detailReads};
 await js(`(async()=>{for(const runId of ['other-run','R1']){await arckitDesktop.emitTestRunEvent({type:'run.activity_changed',runId,owner:{run_id:runId},patch:{schema_version:'run.activity.patch/v1',run_id:runId,base_revision:0,revision:1,changed:{},message_upserts:[{id:'progress',role:'assistant',content:'增量消息已到达',created_at:'2026-09-16'}]}});await new Promise(resolve=>setTimeout(resolve,350));}})()`);
 assert.equal(snapshotReads,activityBefore.snapshotReads);assert.equal(detailReads,activityBefore.detailReads);
 await js(`document.querySelector('[data-pw-action="chat.open"]').click()`);assert(await js(`document.querySelector('.pw-messages').textContent.includes('增量消息已到达')`));
 await js(`document.querySelector('[data-pw-action="chat.close"]').click()`);checks.push('selected run deltas remain available on chat open without full detail reads');
 assert(await js(`document.querySelector('#projectWorkbenchView').classList.contains('is-active')`));checks.push('new default page with real production renderer');
 assert(await js(`document.querySelector('.sidebar-footer').contains(document.querySelector('#legacyPagesButton'))`));
 assert(await js(`getComputedStyle(document.querySelector('.commandbar')).display==='none' && getComputedStyle(document.querySelector('.primary-nav > [data-page="project-workbench"]')).display==='none'`));
 assert(await js(`document.querySelector('#projectWorkbenchNav').textContent.includes('需要我关注') && document.querySelector('#projectWorkbenchNav').textContent.includes('个人与团队项目')`));
 assert(await js(`document.querySelector('.pw-top').getBoundingClientRect().height===54 && !document.querySelector('.pw-top [data-pw-action=sync]')`));
 assert(await js(`document.querySelector('.pw-list-head').getBoundingClientRect().height<=90 && document.querySelector('.pw-search-field .pw-icon') && document.querySelector('[data-pw-action=filters]').getAttribute('aria-label')==='更多筛选'`));
 await js(`document.querySelector('[data-pw-action=filters]').click()`);assert(await js(`!document.querySelector('.pw-extra').hidden && document.querySelector('[data-pw-action=filters]').getAttribute('aria-expanded')==='true'`));await js(`document.querySelector('[data-pw-action=filters]').click()`);
 await js(`document.querySelector('#workbenchSettingsButton').click()`);assert(await js(`!document.querySelector('#settingsOverlay').classList.contains('hidden') && document.querySelector('#workbenchSyncSettings') && document.querySelector('#workbenchFeedbackSettings')`));await js(`document.querySelector('#closeSettingsButton').click()`);
 checks.push('prototype shell: bottom legacy access, project navigation, one top bar, settings utilities and compact list controls');

 assert(await js(`document.querySelector('#legacyPagesMenu').hidden`));await js(`document.querySelector('#legacyPagesButton').click()`);
 assert(await js(`!document.querySelector('#legacyPagesMenu').hidden`));checks.push('legacy secondary menu opens');
 const legacyReadsBefore=await js(`arckitDesktop.getTestCalls().then(calls=>calls.filter(c=>c[0]==='platformSnapshot').length)`);
 for(const page of ['today','chat','product','idea','work','command','release','operations','feedback','organization','engineering']){await js(`document.querySelector('#legacyPagesButton').click();document.querySelector('[data-page="${page}"]').click()`);await wait(`document.querySelector('[data-page-view="${page}"]').classList.contains('is-active')`,page);}
 await wait(`arckitDesktop.getTestCalls().then(calls=>calls.filter(c=>c[0]==='platformSnapshot').length>${legacyReadsBefore})`,'legacy data refreshed');
 checks.push('all eleven legacy pages remain reachable with fresh data');await js(`document.querySelector('[data-page="project-workbench"]').click()`);await wait(`document.querySelector('.pw-task-row[aria-selected=true]')`,'return');
 assert(await js(`document.querySelectorAll('.pw-list-foot [data-pw-action=create]').length===1 && document.querySelectorAll('.pw-top [data-pw-action=create]').length===0`));assert.equal(await js(`document.querySelector('.pw-task-row').getBoundingClientRect().height`),44);checks.push('single-line 44px rows, compact header, one bottom creation entry');
 await js(`document.querySelector('.pw-body').scrollTop=210;document.querySelector('[data-pw-action="chat.open"]').click()`);
 assert(await js(`document.querySelector('.pw-detail').inert&&!document.querySelector('.pw-chat').hidden`));assert(await js(`!document.querySelector('.pw-list').inert`));checks.push('chat is center-only and leaves list interactive');
 await js(`document.querySelector('[data-pw-action="chat.close"]').click()`);assert(await js(`document.querySelector('.pw-body').scrollTop>=200`));checks.push('closing chat preserves detail reading position');
 await js(`document.querySelector('.pw-composer textarea').value='保持这个草稿';document.querySelector('.pw-composer textarea').dispatchEvent(new Event('input',{bubbles:true}));document.querySelector('[data-pw-action=select][data-id="2"]').click()`);await wait(`document.querySelector('.pw-heading').textContent.includes('#2')`,'select2');
 assert.equal(await js(`document.querySelector('.pw-composer textarea').value`),'');await js(`document.querySelector('[data-pw-action=select][data-id="1"]').click()`);await wait(`document.querySelector('.pw-composer textarea').value==='保持这个草稿'`,'draft restored');checks.push('per-task persistent drafts');
 await js(`document.querySelector('[data-pw-action=send]').click()`);await wait(`document.querySelector('.pw-messages').textContent.includes('主协作会话')`,'messages');assert(calls.some(c=>c.action==='chat.send'));checks.push('composer sends task-scoped command and opens real message renderer');
 await window.capturePage().then(image=>writeFile(join(output,'workbench-messages.png'),image.toPNG()));
 await js(`document.querySelector('[data-pw-action="chat.close"]').click();document.querySelector('[data-pw-action=runtime]').click()`);assert(await js(`!document.querySelector('.pw-runtime').hidden`));assert(await js(`document.querySelector('.pw-runtime-body').textContent.includes('需要处理') && document.querySelector('.pw-runtime-body').textContent.includes('正在执行') && document.querySelector('.pw-runtime-body').textContent.includes('等待执行') && document.querySelector('.pw-runtime footer').textContent.includes('执行设置')`));await js('new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve)))');await window.capturePage().then(image=>writeFile(join(output,'workbench-runtime.png'),image.toPNG()));await js(`document.querySelector('[data-pw-action="runtime.select"][data-id="3"]').click()`);await wait(`document.querySelector('.pw-heading').textContent.includes('#3')`,'cross-project runtime');checks.push('runtime popover routes across projects');
 for(const tab of ['overview','context','results','activity']){await js(`document.querySelector('[data-pw-action=tab][data-id="${tab}"]').click()`);assert(await js(`document.querySelector('[data-pw-action=tab][data-id="${tab}"]').getAttribute('aria-selected')==='true'`));}checks.push('four independent detail categories');
 await js(`document.querySelector('[data-pw-action=tab][data-id=overview]').click()`);await js('new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve)))');await window.capturePage().then(image=>writeFile(join(output,'workbench-overview.png'),image.toPNG()));
 const geometry=[];for(const width of [1440,1000,760,390]){window.setSize(width,900);await new Promise(r=>setTimeout(r,120));geometry.push(await js(`({width:innerWidth,scroll:document.documentElement.scrollWidth,body:document.body.scrollWidth})`));if(width<=760){await js(`document.querySelector('[data-pw-action=list]').click()`);assert(await js(`getComputedStyle(document.querySelector('.pw-list')).display==='flex'`));await js(`document.querySelector('[data-pw-action="list.close"]').click()`);}}
 assert(geometry.every(g=>g.scroll<=g.width&&g.body<=g.width),JSON.stringify(geometry));checks.push('760px list drawer and 390px no horizontal overflow');
 await window.capturePage().then(image=>writeFile(join(output,'workbench-mobile.png'),image.toPNG()));
 assert.equal(errors.length,0,errors.join('\n'));const report={ok:true,checks,geometry,errors};await writeFile(join(output,'electron-verification.json'),JSON.stringify(report,null,2));console.log(JSON.stringify(report));
}catch(error){failed=true;console.error(error.stack);if(window)await window.capturePage().then(image=>writeFile(join(output,'failure.png'),image.toPNG()));}finally{window?.destroy();await rm(base,{recursive:true,force:true});app.exit(failed?1:0);}

}).catch(error=>{console.error(error);app.exit(1);});
