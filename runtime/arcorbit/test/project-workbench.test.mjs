import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, rm, readFile, writeFile, symlink } from 'node:fs/promises';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { createDesktopStore } from '../src/desktop/desktop-store.mjs';
import { createProjectWorkbench } from '../src/workbench/coordinator.mjs';
import { createSceneStore } from '../src/workbench/scene-store.mjs';
import { acquireTaskTurn, taskTurnOwner } from '../src/workbench/task-turn-lock.mjs';
import { createWorkbenchAgentBridge, workbenchAgentOptions } from '../src/workbench/agent-bridge.mjs';
import { visibleTasks,runtimeGroups,taskMode } from '../desktop/renderer/project-workbench-model.mjs';

async function fixture(t,{adapter}={}){
 const root=await mkdtemp(join(tmpdir(),'arcorbit-workbench-'));t.after(()=>rm(root,{recursive:true,force:true}));
 const db=createDesktopStore({dataDir:root,runsDir:join(root,'runs'),storePath:join(root,'desktop-store.json')});
 await db.updateStore(s=>{s.projects.push({id:'local',name:'Project',path:root});s.automation.project_bindings={'p':'local'};return s;});
 let account='account:7',binding=null;const calls=[];
 const work={user:{id:'7'},projects:[{id:'p',name:'Project'}],project_catalog:[{id:'p',name:'Project'}],tasks:[{id:'1',project_id:'p',content:'目标',state:'pending_review',executor_id:'7',priority:1}],project_states:{p:{state:'healthy'}},source_status:'healthy',errors:[]};
 const runtime={active_executions:[],execution_history:[],queue:[],attention_items:[],recovery_items:[],acceptance_feedback_items:[]};const attachments=[];
 const runManager={readDesktopStore:db.readStore,updateDesktopStore:db.updateStore,getSettings:async()=>({codex:{chat:{model:'model',reasoning_effort:'medium'}}}),listProjects:async()=>[{id:'local',name:'Project',path:root}],listSessions:async id=>(await db.readStore()).sessions[id]||[],listRuns:async()=>[],getTaskThreadBinding:async()=>binding,bindTaskThread:async(_p,_t,b)=>{if(binding)assert.equal(b.threadId,binding.threadId);binding=b;},createSession:async(project,input)=>{const session={...input,id:'main-session',project_id:project,created_at:new Date().toISOString()};await db.updateStore(s=>{s.sessions[project]||=[];s.sessions[project].push(session);return s;});return session;}};
 const platform={executeAction:async(action,input)=>{calls.push({action,input});if(action==='task.attachments.list')return structuredClone(attachments);if(action==='task.create'||action==='task.subtask.create'){const task={...input,id:String(work.tasks.length+1)};work.tasks.push(task);return task;}if(action==='task.update'){Object.assign(work.tasks.find(t=>t.id===String(input.task_id)),input);return work.tasks[0];}if(action==='task.attachment.create'){const a={...input,id:'a'+attachments.length,created_at:new Date().toISOString()};attachments.push(a);return a;}}};
 const automation={enqueueTask:async id=>calls.push({action:"enqueue",id}),dequeueTask:async()=>{},getSnapshot:async()=>structuredClone(runtime),setProjectParticipation:async()=>{},setEnabled:async()=>{},setQueuePaused:async()=>{},bindProject:async()=>{},updateTaskState:async({taskId,state,expectedState})=>{const task=work.tasks.find(t=>t.id===String(taskId));assert.equal(task.state,expectedState);task.state=state;},submitIntervention:async input=>{calls.push({action:'steer',input});},stopCurrent:async()=>{},manageExecution:async input=>{calls.push({action:'resume',input});},submitAcceptanceFeedback:async input=>runtime.acceptance_feedback_items.push({source_task_id:input.taskId,original_feedback:input.message,status:'queued'})};
 const options={dataDir:join(root,'scenes'),runManager,workSync:{getSnapshot:async()=>structuredClone(work),reconcile:async()=>{},refreshProject:async()=>{}},platform,automation,getAccountScope:async()=>account,getCodexExecutable:()=>({command:'codex'}),setupReadinessPreflight:async()=>{},createAdapter:adapter||(()=>({async *runTurn({options}){await options.onThreadBound({threadId:'thread'});yield {type:'codex.turn.completed',turn:{status:'completed'}};},close(){}}))};
 const c=createProjectWorkbench(options);t.after(()=>c.close());
 const command=async(action,input={})=>c.command(action,{task_id:'1',expected_revision:(await c.detail('1')).scene.revision,request_id:crypto.randomUUID(),input});
 return {root,db,c,options,command,work,runtime,calls,attachments,setAccount:v=>account=v,bind:()=>binding};
}

test('workbench sync delegates a single catalog pass and surfaces degraded results',async t=>{
 const f=await fixture(t);const calls=[];
 f.options.workSync.reconcile=async input=>{calls.push(input);return f.work;};
 f.options.workSync.refreshProject=async()=>{throw new Error('duplicate project refresh');};
 await f.c.command('sync',{});
 assert.deepEqual(calls,[{reason:'project-workbench',allProjects:true,projectIds:[]}]);
 await f.c.command('sync',{project_id:'p'});
 assert.deepEqual(calls[1],{reason:'project-workbench',allProjects:false,projectIds:['p']});
 f.work.errors=[{message:'project offline'}];
 await assert.rejects(f.c.command('sync',{}),/project offline/);
});

test('workbench scene versions reject concurrent edits, preserve accepted criteria when Agent proposes, and survive restart',async t=>{
 const f=await fixture(t);await f.command('criteria.set',{items:['可验收']});const before=await f.c.detail('1');
 await f.c.invokeTool('1',{tool:'arcorbit_scene_update',arguments:{action:'criteria.propose',expected_revision:before.scene.revision,request_id:'proposal',input:{text:'新增建议'}}});
 let d=await f.c.detail('1');assert.equal(d.scene.criteria.length,2);assert.equal(d.scene.criteria[0].status,'accepted');assert.equal(d.scene.criteria[1].status,'proposed');
 await assert.rejects(f.c.command('plan.set',{task_id:'1',expected_revision:0,request_id:'stale',input:{items:['stale']}}),/已更新/);
 const reopened=createProjectWorkbench(f.options);t.after(()=>reopened.close());assert.equal((await reopened.detail('1')).scene.revision,d.scene.revision);
 f.setAccount('account:8');assert.equal((await f.c.detail('1')).scene.revision,0);f.setAccount('');await assert.rejects(f.c.snapshot(),/登录/);
});
test('first Chat creation is self-assigned pending review; retry does not duplicate a task',async t=>{
 const f=await fixture(t);const request={project_id:'p',content:'分析目标',request_id:'new-1'};
 const a=await f.c.command('task.create',request),b=await f.c.command('task.create',request);assert.deepEqual(a,b);assert.equal(f.work.tasks.length,2);assert.equal(f.work.tasks[1].executor_id,'7');assert.equal(f.work.tasks[1].state,'pending_review');
 await assert.rejects(f.c.command('task.create',{...request,content:'changed'}),/另一件/);
});
test('uncertain task creation never silently retries a remote create',async t=>{
 const f=await fixture(t);f.options.platform.executeAction=async()=>{throw new Error('network lost');};await assert.rejects(f.c.command('task.create',{project_id:'p',content:'x',request_id:'uncertain'}),/network/);await assert.rejects(f.c.command('task.create',{project_id:'p',content:'x',request_id:'uncertain'}),/避免重复/);
});
test('task Chat and Auto share persistent task session and thread; a running turn prevents Auto',async t=>{
 let unblock,started;const gate=new Promise(r=>unblock=r),ready=new Promise(r=>started=r);const calls=[];
 const prompts=[];
 const f=await fixture(t,{adapter:()=>({async *runTurn({options,prompt}){calls.push(options);prompts.push(prompt);await options.onThreadBound({threadId:'thread-1'});started();await gate;yield {type:'codex.turn.completed',turn:{status:'completed'}};},close(){},interrupt(){unblock();}})});
 f.options.runManager.getSettings=async()=>({codex:{yolo_mode:true}});
 await f.c.command('chat.send',{task_id:'1',text:'先分析',request_id:'chat-1',model:'model',reasoning_effort:'medium'});await ready;assert.equal(calls[0].yoloMode,true);
 assert.match(prompts[0], /arcorbit_scene_read/);assert.match(prompts[0], /Read relevant referenced files yourself/);
 assert.match(prompts[0], /Scene state is not the Project\/Case Ledger/);
 assert.doesNotMatch(prompts[0], /"scene"|"task"|pending_review|executor_id/);
 assert.match(taskTurnOwner('local','1'),/^chat:/);await assert.rejects(f.command('auto.start'),/讨论/);
 unblock();for(let i=0;i<30&&taskTurnOwner('local','1');i++)await new Promise(r=>setTimeout(r,10));
 assert.equal(taskTurnOwner('local','1'),'');assert.equal(f.bind().threadId,'thread-1');await f.command('auto.start');assert.equal(f.work.tasks[0].state,'pending');
 assert.equal((await f.db.readStore()).sessions.local.filter(s=>s.kind==='automation-task'&&s.task_id==='1').length,1,JSON.stringify((await f.db.readStore()).sessions.local));
 assert.equal((await f.db.readStore()).chat.selected_session_id,'');assert.equal(calls[0].dynamicTools.length,4);
});
test('running messages steer current execution; paused discussion never implicitly resumes Auto',async t=>{
 const f=await fixture(t);f.runtime.active_executions=[{task_id:'1',execution_id:'E1',phase:'running',active_run:{status:'running'}}];
 await f.c.command('chat.send',{task_id:'1',text:'补充',request_id:'s1'});assert.equal(f.calls.at(-1).action,'steer');
 await f.command('auto.pause');assert.equal((await f.c.detail('1')).scene.pause_requested,true);
 await assert.rejects(f.c.command('chat.send',{task_id:'1',text:'改方向',request_id:'s2'}),/等待/);
 assert.equal(f.calls.filter(c=>c.action==='resume').length,0);
});
test('goal edits invalidate acceptance checks; Agent cannot accept or authorize Auto',async t=>{
 const f=await fixture(t);await f.command('criteria.set',{items:['检查']});let d=await f.c.detail('1');await f.command('criteria.check',{id:d.scene.criteria[0].id,checked:true});await f.command('task.update',{content:'新目标'});d=await f.c.detail('1');assert.equal(d.scene.criteria[0].checked,false);
 f.work.tasks[0].state='completed';await assert.rejects(f.command('acceptance.accept'),/完成标准/);
 await assert.rejects(f.c.invokeTool('1',{tool:'arcorbit_call',arguments:{action:'auto.start',request_id:'denied',input:{}}}),/用户主动/);
 await f.command('criteria.check',{id:d.scene.criteria[0].id,checked:true});await f.command('acceptance.accept');assert.equal(f.work.tasks[0].state,'accepted');await assert.rejects(f.command('agreement.add',{text:'change'}),/只读/);
});
test('context includes explicit selected material, comments remain shared, and file preview rejects escapes and symlinks',async t=>{
 const f=await fixture(t);await f.command('material.add',{type:'text',content:'reference'});await f.command('comment.add',{content:'comment'});const scene=await f.c.agentScene('1');assert.equal(scene.materials.length,1);assert.equal(scene.materials[0].content,'reference');assert.equal(f.attachments.length,2);
 await writeFile(join(f.root,'result.txt'),'result');let result=await f.c.command('asset.preview',{task_id:'1',input:{path:'result.txt'}});assert.equal(result.content,'result');assert.match(result.version,/^[a-f0-9]{64}$/);
 await symlink('/etc/hosts',join(f.root,'outside'));await assert.rejects(f.c.command('asset.preview',{task_id:'1',input:{path:'outside'}}),/工作区/);
});
test('scene store accepts identical requests once and refuses reused ids with different payload',async t=>{
 const root=await mkdtemp(join(tmpdir(),'scene-store-'));t.after(()=>rm(root,{recursive:true,force:true}));const s=createSceneStore({dataDir:root});const args={expected_revision:0,request_id:'one',action:'plan.set',input:{items:['a']}};let count=0;await s.change('u','1',args,scene=>{scene.plan=['a'];count++;});await s.change('u','1',args,()=>count++);assert.equal(count,1);await assert.rejects(s.change('u','1',{...args,input:{items:['b']}},()=>{}),/其他操作/);
});
test('task leases permit independent tasks and reject two owners of the same task',()=>{const a=acquireTaskTurn('project','a','chat');assert.throws(()=>acquireTaskTurn('project','a','auto'),/已有 Agent/);const b=acquireTaskTurn('project','b','auto');a();b();});
test('runtime list prioritizes real attention, clears cross-project ambiguity, and filters single-line task titles',()=>{const s={tasks:[{id:'1',project_id:'p',content:'# First\nbody',state:'pending'},{id:'2',project_id:'q',content:'Second',state:'completed'}],runtime:{attention_items:[{task_id:'2',reason:'review'}],active_executions:[{task_id:'1',phase:'running'}]}};assert.equal(runtimeGroups(s)[0].items[0].id,'2');assert.deepEqual(visibleTasks(s,{project:'attention'}).map(t=>t.id),['2']);assert.deepEqual(visibleTasks(s,{project:'all',search:'first'}).map(t=>t.id),['1']);});
test('primary navigation contains one legacy menu with every former main page',async()=>{
 const html=await readFile(new URL('../desktop/renderer/index.html',import.meta.url),'utf8');const legacy=html.split('id="legacyPagesMenu"')[1].split('id="accountButton"')[0];for(const id of ['today','chat','product','idea','work','command','release','operations','feedback','organization','engineering'])assert.match(legacy,new RegExp(`data-page="${id}"`));
 const source=await readFile(new URL('../desktop/renderer/project-workbench-surface.mjs',import.meta.url),'utf8');assert.doesNotMatch(source,/design\/|fixture|model\.js/);assert.match(html,/id="projectWorkbenchView"/);
});
test('runtime bridge uses real loopback transport and revokes a run grant',async t=>{
 const f=await fixture(t);const bridge=createWorkbenchAgentBridge({coordinator:f.c,getAccountScope:()=>Promise.resolve('account:7')});t.after(()=>bridge.close());
 const env=await bridge.environment({projectId:'local',taskId:'1',runId:'run-1'});const config=JSON.parse(env.ARCORBIT_WORKBENCH_BRIDGE);assert.equal(new URL(config.url).hostname,'127.0.0.1');
 const options=workbenchAgentOptions(env);const result=await options.dynamicToolProvider({tool:'arcorbit_scene_read',arguments:{}});assert.equal(result.task.id,'1');
 let response=await fetch(config.url,{method:'POST',headers:{Authorization:`Bearer ${config.token}`,Origin:'https://untrusted.invalid'},body:'{}'});assert.equal(response.status,400);
 bridge.revoke('run-1');await assert.rejects(options.dynamicToolProvider({tool:'arcorbit_scene_read',arguments:{}}),/expired/);
});
test('software adapters expose owners, forward real contracts, and require confirmation before writes',async()=>{
 const {createSoftwareCapabilities}=await import('../src/workbench/software-capabilities.mjs');const calls=[];let confirmed=false,account='u';
 const registry=createSoftwareCapabilities({platform:()=>({listActions:()=>['task.attachment.create','task.update'],executeAction:async(action,input)=>{calls.push({action,input});return {id:'attachment'};}}),release:()=>({command:async(action,input)=>{calls.push({action,input});return {files:[]};}}),product:()=>({snapshot:async()=>({records:[{id:'product-id',remote_project_id:'p'}]}),detail:async id=>({id}),command:async(action,input)=>{calls.push({action,input});return input;}}),engineering:()=>({snapshot:async()=>({revision:3})}),getAccountScope:async()=>account,confirm:async()=>confirmed});
 const ctx={task:{id:'1',project_id:'p'},scope:'u'};
 assert(!registry.list().some(c=>c.name==='platform.task.update'));assert(registry.list().some(c=>c.name==='feedback_v2.reply'));
 await assert.rejects(registry.call('platform.task.attachment.create',{content:'x'},ctx),/未批准/);assert.equal(calls.length,0);
 confirmed=true;await registry.call('platform.task.attachment.create',{content:'x'},ctx);assert.equal(calls[0].input.task_id,'1');assert.equal(calls[0].input.project_id,'p');
 assert.deepEqual(await registry.call('product.read',{},ctx),{id:'product-id'});await registry.call('product.save',{revision:2,patch:{name:'x'}},ctx);assert.equal(calls.at(-1).input.id,'product-id');
 await assert.rejects(registry.call('release.files.read',{project_id:'other',path:'x'},ctx),/超出/);account='other';await assert.rejects(registry.call('engineering.read',{},ctx),/账号/);
});

test('MCP fallback exposes the same scoped scene commands for restored threads',async t=>{
 const f=await fixture(t);const bridge=createWorkbenchAgentBridge({coordinator:f.c,getAccountScope:async()=> 'account:7'});t.after(()=>bridge.close());
 const env=await bridge.environment({projectId:'local',taskId:'1',runId:'restored'});const config=workbenchAgentOptions(env).threadConfig['mcp_servers.arcorbit_workbench'];
 assert.equal(config.bearer_token_env_var,'ARCORBIT_WORKBENCH_TOKEN');assert(!JSON.stringify(config).includes(env.ARCORBIT_WORKBENCH_TOKEN));
 let id=0;const request=async(method,params={})=>{const response=await fetch(config.url,{method:'POST',headers:{Authorization:`Bearer ${env.ARCORBIT_WORKBENCH_TOKEN}`,'Content-Type':'application/json'},body:JSON.stringify({jsonrpc:'2.0',id:++id,method,params})});return response.json();};
 assert.equal((await request('initialize',{protocolVersion:'2025-03-26'})).result.protocolVersion,'2025-03-26');assert.equal((await request('tools/list')).result.tools.length,4);
 let result=(await request('tools/call',{name:'arcorbit_scene_read'})).result;assert.equal(JSON.parse(result.content[0].text).task.id,'1');
 result=(await request('tools/call',{name:'arcorbit_scene_update',arguments:{action:'report',expected_revision:0,request_id:'mcp-report',input:{summary:'restored thread report'}}})).result;assert.equal(result.isError,undefined);assert.equal((await f.c.detail('1')).scene.reports.at(-1).summary,'restored thread report');
 result=(await request('tools/call',{name:'arcorbit_call',arguments:{action:'acceptance.accept',expected_revision:1,request_id:'forbidden',input:{}}})).result;assert.equal(result.isError,true);
 bridge.revoke('restored');assert.match((await request('tools/list')).error,/expired/);
});

// Count source reads instead of relying on machine-dependent timing thresholds.
test('workbench resolves runtime modes once for the whole task list',()=>{
 let reads=0;
 const tasks=Array.from({length:1000},(_,i)=>({get id(){reads++;return String(i);},state:'pending'}));
 const snapshot={tasks,runtime:{queue:tasks.map(t=>({task_id:t.id})),attention_items:[{task_id:'0',reason:'review'}]}};
 reads=0;
 const groups=runtimeGroups(snapshot),modes=new Map(groups.flatMap(g=>g.items.map(i=>[i.id,g.group])));
 assert.equal(taskMode(tasks[0],snapshot,null,modes),'待介入');
 for(const task of tasks.slice(1))assert.equal(taskMode(task,snapshot,null,modes),'已排队');
 assert(reads<=tasks.length*3,`expected linear task reads, got ${reads}`);
 snapshot.scenes={'1':{pause_requested:true}};
 assert.equal(taskMode(tasks[1],snapshot,{current_turn_owner:'auto:run'},modes),'正在暂停');
 assert.equal(taskMode(tasks[1],snapshot,null,modes),'已暂停');
});
