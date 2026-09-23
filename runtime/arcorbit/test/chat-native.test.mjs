import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp,rm,writeFile} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {createDesktopStore} from '../src/desktop/desktop-store.mjs';
import {createChatCoordinator} from '../src/chat-coordinator.mjs';
import {createChatNative} from '../src/chat-native.mjs';
import {createProjectWorkbench} from '../src/workbench/coordinator.mjs';
import {acquireTaskTurn} from '../src/workbench/task-turn-lock.mjs';
async function fixture(t){
 const root=await mkdtemp(join(tmpdir(),'chat-native-'));t.after(()=>rm(root,{recursive:true,force:true}));await writeFile(join(root,'README.md'),'file context');
 const db=createDesktopStore({dataDir:root,runsDir:join(root,'runs'),storePath:join(root,'store.json')});
 await db.updateStore(s=>{s.projects.push({id:'local',name:'Project',path:root});s.automation.project_bindings={p:'local'};return s});
 const bindings=new Map(),calls=[];let account='account:7',counter=0,operation=async()=>{},result,turnError,latestOptions;
 const work={projects:[{id:'p',name:'Project',current_user_id:'7'}],project_catalog:[{id:'p',name:'Project',current_user_id:'7'}],tasks:[{id:'1',project_id:'p',content:'existing',state:'pending_review',priority:0,executor_id:'7'},{id:'foreign',project_id:'other',content:'secret',state:'pending'}],errors:[]};
 const runtime={active_executions:[],queue:[],execution_history:[]};
 const runManager={readDesktopStore:db.readStore,updateDesktopStore:db.updateStore,getSettings:async()=>({codex:{chat:{model:'test',reasoning_effort:'high'}}}),listSessions:async id=>(await db.readStore()).sessions[id]||[],listProjects:async()=>(await db.readStore()).projects,listRuns:async()=>[],getTaskThreadBinding:async(p,id)=>bindings.get(String(id)),bindTaskThread:async(p,id,b)=>{if(bindings.has(String(id)))assert.equal(bindings.get(String(id)).threadId,b.threadId);bindings.set(String(id),b)},createSession:async(p,input)=>{const s={...input,id:'TASK-'+(++counter),project_id:p,status:'completed',created_at:new Date().toISOString()};await db.updateStore(d=>{(d.sessions[p] ||= []).push(s);d.messages[s.id]=[];return d});return s}};
 const workSync={getSnapshot:async()=>structuredClone(work),reconcile:async()=>structuredClone(work)};
 const platform={executeAction:async(action,input)=>{calls.push({action,input});if(action==='task.attachments.list')return [];if(action==='task.create'){const task={...input,id:String(2+work.tasks.length)};work.tasks.push(task);return task}if(action==='task.update'){const task=work.tasks.find(t=>t.id===input.task_id);if(input.expected)assert.equal(input.expected.content,task.content);Object.assign(task,input);return task}}};
 const automation={getSnapshot:async()=>runtime,maybeStartNext:async()=>{}};
 const scene=async()=>({skills:[],fingerprint:'same'});let native,workbench;
 const chat=createChatCoordinator({runManager,getCodexExecutable:()=>({command:'test',pathEntries:[]}),acceptedSessionKinds:['chat','automation-task'],authorizeSession:s=>native.authorizeSession(s),getTurnContext:i=>native.turnContext(i),onTurnSettled:async({sessionId})=>{await native.settled(sessionId);await workbench.settleChat(sessionId)},createAdapter:()=>({async *runTurn({options}){latestOptions=options;await options.onThreadBound({threadId:options.threadId||'THREAD-'+(++counter)});yield {type:'codex.turn.started',turn_id:'TURN-'+counter};try{result=await operation(options)}catch(e){turnError=e;throw e}yield {type:'codex.turn.completed'}},async close(){},async interrupt(){}})});
 workbench=createProjectWorkbench({dataDir:join(root,'scenes'),runManager,workSync,platform,automation,getAccountScope:async()=>account,chatCoordinator:chat,getCodexExecutable:()=>({command:'test'}),resolveSceneSkills:scene});
 native=createChatNative({runManager,workSync,workbench,automation,chat,getAccountScope:async()=>account,resolveSceneSkills:scene});
 t.after(async()=>{await chat.close();await native.close();await workbench.close()});
 async function send(session_id,fn,extra={}){operation=fn;result=turnError=undefined;const snapshot=await chat.send({session_id,project_id:'local',text:'request',client_request_id:'request-'+(++counter),...extra});const id=snapshot.selected_session_id;for(let i=0;i<100;i++){await new Promise(r=>setTimeout(r,10));const s=(await chat.getSnapshot({session_id:id})).sessions.find(s=>s.id===id);if(!['starting','running'].includes(s?.status))return {id,result,error:turnError,snapshot:await chat.getSnapshot({session_id:id})}}throw Error('turn timeout')}
 const call=(options,args)=>options.dynamicToolProvider({tool:'arcorbit_todo',arguments:args});
 return {chat,native,workbench,db,work,runtime,bindings,calls,send,call,setAccount:v=>account=v,getOptions:()=>latestOptions};
}
test('real bridge creates related todo without rebinding, associates whole thread and restores hidden identity',async t=>{
 const f=await fixture(t);
 let a=await f.send('',o=>f.call(o,{action:'create',content:'another',request_id:'other'}));assert.equal(a.error,undefined);const id=a.id,other=a.result.task.id;
 assert.equal(a.snapshot.sessions.find(s=>s.id===id).task_id,'');assert.equal((await f.native.catalog({project_id:'local',session_id:id})).tasks.find(t=>t.id===other).session_id,'');const originalTitle=a.snapshot.sessions.find(s=>s.id===id).title;assert.equal((await f.native.catalog({project_id:'local',session_id:id})).tasks.find(t=>t.id===other).source_session_id,id);
 await f.chat.createDraft({session_id:id,text:'unsent',native_context:{capability:{id:'create',kind:'native',label:'创建待办'},refs:[]}});
 a=await f.send(id,o=>f.call(o,{action:'create',content:'main',request_id:'main',associate:true}),{preserve_draft:true});assert.equal(a.error,undefined);const main=a.result.task.id,thread=f.bindings.get(main).threadId;
 assert.equal(a.snapshot.draft.text,'unsent');assert.equal(a.snapshot.sessions.find(s=>s.id===id).task_id,main);assert.equal(a.snapshot.sessions.find(s=>s.id===id).title,originalTitle);assert.equal((await f.native.catalog({project_id:'local',session_id:id})).tasks.find(t=>t.id===main).title,'main');
 a=await f.send(id,o=>f.call(o,{action:'create',content:'main',request_id:'main',associate:true}));assert.equal(a.result.already_associated,true);assert.equal(f.calls.filter(x=>x.action==='task.create').length,2);
 assert.equal((await f.native.openTask({project_id:'local',task_id:main})).session_id,id);await f.chat.delete({session_id:id});assert.ok(!(await f.chat.getSnapshot()).sessions.some(s=>s.id===id));
 assert.equal((await f.native.openTask({project_id:'local',task_id:main})).session_id,id);assert.equal(f.bindings.get(main).threadId,thread);
 const otherSession=await f.native.openTask({project_id:'local',task_id:other});assert.notEqual(otherSession.session_id,id);assert.equal((await f.chat.getSnapshot({session_id:otherSession.session_id})).sessions.find(s=>s.id===otherSession.session_id).source_session_id,id);
 await assert.rejects(f.getOptions().dynamicToolProvider({tool:'arcorbit_todo',arguments:{action:'list'}}),/expired|失效|过期/);
});
test('same task discussion identity is shared with Thing; read/write enforce project/version/owner/account boundaries',async t=>{
 const f=await fixture(t);const opened=await f.native.openTask({project_id:'local',task_id:'1'});
 let a=await f.send(opened.session_id,o=>f.call(o,{action:'read',task_id:'1'}));assert.equal(a.error,undefined);const v=a.result.task.version;
 a=await f.send(opened.session_id,o=>f.call(o,{action:'update',task_id:'1',version:v,content:'new goal'}));assert.equal(a.error,undefined);assert.equal(f.work.tasks[0].content,'new goal');
 a=await f.send(opened.session_id,o=>f.call(o,{action:'update',task_id:'1',version:v,content:'stale'}));assert.match(a.error.message,/版本/);assert.equal(f.work.tasks[0].content,'new goal');
 a=await f.send(opened.session_id,o=>f.call(o,{action:'read',task_id:'foreign'}));assert.match(a.error.message,/项目/);
 a=await f.send(opened.session_id,o=>o.dynamicToolProvider({tool:'arcorbit_call',arguments:{action:'task.update',input:{content:'bypass'}}}));assert.match(a.error.message,/读取版本/);assert.equal(f.work.tasks[0].content,'new goal');
 const detail=await f.workbench.detail('1');assert.equal(detail.session.id,opened.session_id);
 const release=acquireTaskTurn('local','1','other');t.after(release);a=await f.send(opened.session_id,()=>assert.fail('must not start'));assert.match(a.snapshot.sessions.find(s=>s.id===opened.session_id).error,/已有 Agent/);release();
 f.setAccount('account:8');await assert.rejects(f.chat.send({session_id:opened.session_id,text:'secret',client_request_id:'cross'}),/账号/);assert.ok(!(await f.chat.getSnapshot()).sessions.some(s=>s.id===opened.session_id));
});
test('first-turn context is snapshotted and references cannot escape project; catalogue reflects real files',async t=>{
 const f=await fixture(t);const cat=await f.native.catalog({project_id:'local'});assert.ok(cat.files.some(f=>f.path==='README.md'));assert.ok(!cat.tasks.some(t=>t.id==='foreign'));
 const native_context={capability:{kind:'native',id:'create',label:'创建待办'},refs:[{kind:'file',id:'README.md',path:'README.md',project_id:'local',label:'README'}]};
 let a=await f.send('',async o=>{assert.ok(o.dynamicTools.some(t=>t.name==='arcorbit_todo'));return 'ok'},{text:'',native_context});assert.equal(a.error,undefined);assert.equal(a.snapshot.messages[0].native_context.capability.id,'create');
 a=await f.send(a.id,()=>assert.fail('bad reference must not run'),{native_context:{refs:[{kind:'file',path:'../outside',project_id:'local'}]}});assert.match(a.snapshot.sessions.find(s=>s.id===a.id).error,/ENOENT|工作区/);
});

test('snapshot lists sessions by their own creation time despite todo creation and later activity', async t => {
 const f=await fixture(t);
 const first=await f.send('',o=>f.call(o,{action:'create',content:'unrelated todo',request_id:'sorting-other'}));
 const second=await f.send('',async()=>{});
 await f.db.updateStore(store=>{
  for(const session of store.sessions.local){
   if(session.id==='SESSION-local-default'){session.chat_hidden=true;continue}
   session.created_at=session.id===first.id?'2026-09-01T00:00:00Z':'2026-09-19T00:00:00Z';
   session.updated_at=session.id===first.id?'2026-09-30T00:00:00Z':'2026-09-19T00:00:00Z';
  }
  return store;
 });
 const snapshot=await f.chat.getSnapshot();
 assert.deepEqual(snapshot.sessions.map(s=>s.id),[second.id,first.id]);
 assert.equal(snapshot.sessions.length,2);
 assert.ok(f.work.tasks.length>2);
});

test('Chat task filters use Work semantics while references and session identities remain independent', async t=>{
 const f=await fixture(t);
 const created=await f.send('',async()=>{});
 f.work.tags=[{id:'ui',project_id:'p',name:'界面'},{id:'secret',project_id:'other',name:'不可见'}];
 const base={project_id:'p',state:'pending',creator_id:'7',executor_id:'8',priority:1,tags:[{id:'ui'}],created_at:'2026-09-19T23:59:59.999Z'};
 f.work.tasks.push({...base,id:'match',content:'独立待办标题\n搜索正文'}, {...base,id:'no-match',state:'blocked',content:'另一条'}, {...base,id:'outside',project_id:'other',content:'搜索正文'});
 const filters={states:['pending'],search_key:'搜索正文',creator_ids:['7'],executor_ids:['8'],tag_ids:['ui'],priorities:['1'],start_time:'2026-09-19',end_time:'2026-09-19'};
 const query=async task_filters=>f.native.catalog({project_id:'local',session_id:created.id,include_task_filters:true,task_filters});
 let result=await query(filters);assert.deepEqual(result.task_list.map(t=>t.id),['match']);assert.ok(result.tasks.some(t=>t.id==='no-match'));assert.equal(result.task_list[0].session_id,'');assert.deepEqual(result.filter_tags.map(t=>t.id),['ui']);
 for(const [key,value]of Object.entries({states:['completed'],creator_ids:['9'],executor_ids:['9'],tag_ids:['unknown'],priorities:['0'],search_key:'does not exist',start_time:'2026-09-20',end_time:'2026-09-18'}))assert.deepEqual((await query({...filters,[key]:value})).task_list,[],key);
 assert.equal((await query({...filters,priorities:['0','1']})).task_list.length,1);
 assert.equal((await f.chat.getSnapshot()).sessions.filter(s=>s.id===created.id).length,1);
});

test('Work opening is idempotent and preserves the task thread for versioned Agent edits', async t => {
 const f=await fixture(t);
 f.bindings.set('1',{threadId:'WORK-THREAD'});
 const opened=await Promise.all(Array.from({length:4},()=>f.native.openTask({project_id:'local',task_id:'1'})));
 assert.equal(new Set(opened.map(x=>x.session_id)).size,1);
 const id=opened[0].session_id;
 assert.equal((await f.db.readStore()).sessions.local.filter(s=>s.task_id==='1').length,1);
 assert.equal((await f.db.readStore()).sessions.local.find(s=>s.id===id).thread_id,'WORK-THREAD');
 assert.equal(f.calls.length,0,'opening does not mutate or execute the todo');
 const turn=await f.send(id,async options=>{
  assert.equal(options.threadId,'WORK-THREAD');
  const {task}=await f.call(options,{action:'read'});
  return f.call(options,{action:'update',version:task.version,content:'Updated from Work-bound Chat',request_id:'work-chat-update'});
 });
 assert.equal(turn.error,undefined);assert.equal(turn.result.task.content,'Updated from Work-bound Chat');
 assert.equal(f.work.tasks[0].content,turn.result.task.content);
 assert.equal((await f.native.openTask({project_id:'local',task_id:'1'})).session_id,id);
 await assert.rejects(f.native.openTask({project_id:'local',task_id:'foreign'}),/项目/);
});
