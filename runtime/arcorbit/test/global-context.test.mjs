import test from 'node:test';
import assert from 'node:assert/strict';
import { productScope, scopedChatProjects, restoredSelection, syncSummary, createChatScopeController } from '../desktop/renderer/global-context.mjs';
import { createChatStateCoordinator } from '../desktop/renderer/chat-state-coordinator.mjs';

const platform={user:{id:'user'},active_workset:{id:'set',project_ids:['A','B','C']},projects:[{id:'A',local_project_id:'local-A'},{id:'B',local_project_id:'local-B'},{id:'C'}]};
test('product scope constrains local Chat workspaces and rejects another workset',()=>{
 const locals=[{id:'local-A'},{id:'local-B'},{id:'unbound'}];
 assert.deepEqual(scopedChatProjects(locals,platform,productScope(platform,'A')).map(p=>p.id),['local-A']);
 assert.deepEqual(scopedChatProjects(locals,platform,productScope(platform,'C')),[]);
 assert.equal(productScope(platform,'removed').projectId,'all');
 assert.deepEqual(productScope({...platform,active_workset:{id:'empty',project_ids:[]}}).projectIds,[]);
 assert.equal(restoredSelection([{id:'1'},{id:'2'}],'1','2'),'1');
 assert.equal(restoredSelection([{id:'2'}],'1','2'),'2');
});
test('global sync never masks a failed source with a successful task timestamp',()=>{
 const snap={source_status:'healthy',synced_at:'2026-09-18T00:00:00Z',realtime:{projects:{A:{state:'degraded',error:'offline'}}}};
 const summary=syncSummary(snap,{errors:[{section:'feedback',message:'denied'}]});
 assert.equal(summary.label,'部分同步失败');assert.equal(summary.time,snap.synced_at);assert.equal(summary.errors.length,2);
 assert.equal(syncSummary(snap,{}, {authenticated:false}).label,'未登录');
 assert.equal(syncSummary(snap,{}, {syncing:true}).label,'正在同步…');
});

test('Chat restores per-scope sessions and unsent drafts without interrupting or reassigning sessions',async()=>{
 let selected='a1',draft={project_id:'local-A',text:''};const sessions=[{id:'a1',project_id:'local-A',draft:'',status:'running'},{id:'b1',project_id:'local-B',draft:''}];
 const projects=[{id:'local-A'},{id:'local-B'}],calls=[];
 const snapshot=()=>({projects,sessions,selected_session_id:selected,messages:selected?[{id:selected,content:selected}]:[],draft:selected?{project_id:sessions.find(s=>s.id===selected).project_id,text:sessions.find(s=>s.id===selected).draft}:draft});
 const api={async createChat(input){calls.push(['draft',input]);if(input.session_id){sessions.find(s=>s.id===input.session_id).draft=input.text;}else{selected='';draft={...input};}return snapshot();},async selectChat({session_id}){selected=session_id;return snapshot();},async chatSnapshot(){return snapshot();},async interruptChat(){throw Error('scope must not stop a turn');},async sendChatMessage(){throw Error('scope must not send');},async deleteChat(){},async renameChat(){},async decideChatApproval(){}};
 const coordinator=createChatStateCoordinator({api,createRequestId:()=> 'request',delayMs:10000});await coordinator.initialize(snapshot());
 let scope=productScope(platform,'A');const storage=new Map();const controller=createChatScopeController({coordinator,getScope:()=>scope,getProjects:()=>scopedChatProjects(projects,platform,scope),defaults:()=>({}),storage:{getItem:k=>storage.get(k),setItem:(k,v)=>storage.set(k,v)}});
 await controller.reconcile();coordinator.setDraft('A session draft');controller.capture();scope=productScope(platform,'B');await controller.reconcile();
 assert.equal(coordinator.getState().owner.project_id,'local-B');assert.equal(coordinator.getState().owner.session_id,'');
 coordinator.setDraft('B unsent');controller.capture();scope=productScope(platform,'A');await controller.reconcile();
 assert.equal(coordinator.getState().owner.session_id,'a1');assert.equal(coordinator.getState().draft,'A session draft');
 scope=productScope(platform,'B');await controller.reconcile();assert.equal(coordinator.getState().draft,'B unsent');
 controller.capture();scope=productScope(platform,'C');await controller.reconcile();assert.equal(coordinator.getState().owner.project_id,'');assert.equal(coordinator.getState().draft,'');
 scope=productScope(platform,'B');await controller.reconcile();assert.equal(coordinator.getState().draft,'B unsent');await coordinator.flushDraft();
 assert.equal(sessions[0].status,'running');assert.deepEqual(sessions.map(s=>s.project_id),['local-A','local-B']);
});

test('Today scope expansion keeps the current valid responsibility before remembered selection',async()=>{
 const {readFile}=await import('node:fs/promises'),{default:vm}=await import('node:vm');
 const source=await readFile(new URL('../desktop/renderer/renderer.js',import.meta.url),'utf8');
 const fn=source.slice(source.indexOf('async function performGlobalScopeChange('),source.indexOf('\nlet chatComposer;'));
 const state={page:'today',selectedProjectId:'A',todaySelectionEpoch:0,todaySelectedItemId:'current'};
 const context={state,globalScopeEpoch:0,scheduleTodayPreferencePersistence(){},rememberScopeViews:()=>({today:{id:'current',project_id:'A'}}),rememberedScopeViews:()=>({today:'remembered'}),chatScopeController:{capture(){},async reconcile(){}},chatStateCoordinator:{async flushDraft(){}},setPlatformTaskSelectionIntent(){},workQueryState:{clear(){}},projectWorkbenchSurface:{async scopeChanged(){}},renderCommandBar(){},renderWorkset(){},renderChat(){},refreshSnapshot:async()=>{},render(){},globalScope:()=>({projectIds:state.selectedProjectId==='all'?['A','B']:[state.selectedProjectId]}),includesProject:(scope,id)=>scope.projectIds.includes(id)};
 const change=vm.runInNewContext('('+fn+')',context);
 await change('all');assert.equal(state.todaySelectedItemId,'current');
 await change('B');assert.equal(state.todaySelectedItemId,'remembered');
});

test('global runtime navigation changes workset and product before selecting the target task',async()=>{
 const {readFile}=await import('node:fs/promises'),{default:vm}=await import('node:vm');
 const source=await readFile(new URL('../desktop/renderer/renderer.js',import.meta.url),'utf8');
 const start=source.indexOf("document.getElementById('globalRuntimeObjects').addEventListener");
 const code=source.slice(start,source.indexOf("  document.getElementById('globalOpenAutomation')",start));
 let listener,request;const calls=[],menu={open:true};const state={selectedProjectId:'A',platform:{active_workset:{id:'first'},worksets:[{id:'second',project_ids:['B']}]}};
 vm.runInNewContext(code,{state,document:{getElementById:id=>id==='globalRuntimeObjects'?{addEventListener:(_event,fn)=>listener=fn}:menu},runAction:fn=>(request=fn()),includesProject:()=>false,globalScope:()=>({}),changeGlobalScope:async(...args)=>calls.push(['scope',...args]),showPage:p=>calls.push(['page',p]),projectWorkbenchSurface:{refresh:async()=>calls.push(['refresh']),selectTask:async id=>calls.push(['task',id])}});
 listener({target:{closest:()=>({dataset:{globalProject:'B',globalTask:'task-B'}})}});await request;
 assert.deepEqual(calls,[['scope','B','second'],['page','project-workbench'],['refresh'],['task','task-B']]);assert.equal(menu.open,false);
});
