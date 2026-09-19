import { matchesLocalTask } from './task-filter.mjs';
import {createHash,randomUUID} from 'node:crypto';
import {findSessionById} from './desktop/desktop-store.mjs';
import {normalizeChatContext} from './chat-context.mjs';
import {acquireTaskTurn,taskTurnOwner} from './workbench/task-turn-lock.mjs';
import {createWorkbenchAgentBridge,workbenchAgentOptions} from './workbench/agent-bridge.mjs';
import {workbenchTools} from './workbench/protocol.mjs';
import {listWorkspaceFiles,workspacePath} from './release/workspace-files.mjs';
const active=s=>['starting','running','waiting_approval'].includes(s?.status);
const version=t=>createHash('sha256').update(JSON.stringify([t.content,t.priority,t.state,t.updated_at])).digest('hex');
const nativeTools=[{name:'arcorbit_todo',description:'Read/write native todos in this Chat project. list/read return latest objects and versions. create makes a separate todo; associate=true organizes this conversation as its main todo without replacing its thread. update requires the version returned by read. Reuse request_id on retries; never invent success. Does not start Automation.',inputSchema:{type:'object',properties:{action:{type:'string',enum:['list','read','create','update']},task_id:{type:'string'},content:{type:'string'},priority:{type:'integer'},version:{type:'string'},request_id:{type:'string'},associate:{type:'boolean'}},required:['action'],additionalProperties:false}}];
const tools=[...nativeTools,...workbenchTools];
export function createChatNative({runManager,workSync,workbench,automation,chat,getAccountScope,resolveSceneSkills,listProjectMembers=async()=>[]}){
 const leases=new Map(),turns=new Map(),queues=new Map();
 // Catalog, authorization and task context use metadata only. Receipts still update messages.
 const readStore=()=>runManager.readDesktopChatMetadata?.() || runManager.readDesktopStore();
 const updateStore=fn=>runManager.updateDesktopStoreWithMessages?.(fn) || runManager.updateDesktopStore(fn);
 async function projectContext(projectId,sessionId=''){
  const [scope,store,work]=await Promise.all([getAccountScope(),readStore(),workSync.getSnapshot()]);
  if(!scope)throw Error('请先登录 Workshop 后使用待办能力。');
  const local=store.projects.find(p=>p.id===projectId);if(!local)throw Error('本地工作区不可用。');
  const session=sessionId?findSessionById(store,sessionId)?.session:null;
  if(sessionId&&(!session||session.project_id!==projectId))throw Error('会话与工作区不匹配。');
  if(session?.workbench_account_scope&&session.workbench_account_scope!==scope)throw Error('会话属于另一个账号。');
  const projects=work.project_catalog?.length?work.project_catalog:work.projects || [];
  const remote=projects.filter(p=>store.automation.project_bindings?.[p.id]===projectId);
  const project=session?.remote_project_id?remote.find(p=>String(p.id)===String(session.remote_project_id)):remote.length===1?remote[0]:null;
  if(!project)throw Error('请为当前工作区绑定唯一的可访问项目。');
  return {scope,store,work,local,project,session};
 }
 async function authorizeSession(session,accessContext){
  if(!session.workbench_account_scope)return true;
  if(accessContext){
   accessContext.nativeScope ||= Promise.all([getAccountScope(),workSync.getSnapshot()]);
   const [scope,work]=await accessContext.nativeScope,store=accessContext.store;
   return scope===session.workbench_account_scope&&(work.project_catalog?.length?work.project_catalog:work.projects||[]).some(p=>String(p.id)===String(session.remote_project_id)&&store.automation.project_bindings?.[p.id]===session.project_id);
  }
  try{await projectContext(session.project_id,session.id);return true}catch{return false}
 }
 function taskIn(ctx,id){const t=(ctx.work.tasks||[]).find(t=>String(t.id)===String(id)&&String(t.project_id)===String(ctx.project.id));if(!t)throw Error('待办不存在、不可访问或不属于当前项目。');return t}
 async function sync(ctx){const result=await workSync.reconcile({reason:'chat-native',allProjects:false,projectIds:[String(ctx.project.id)]});const errors=(result?.errors||[]).filter(e=>!e.project_id||String(e.project_id)===String(ctx.project.id));if(errors.length)throw Error('待办同步失败：'+errors.map(e=>e.message).join('；'));return projectContext(ctx.local.id,ctx.session?.id)}
 function sourceKey(ctx,id){return JSON.stringify([ctx.scope,String(id)])}
 function publicTask(ctx,t){const s=Object.values(ctx.store.sessions||{}).flat().find(s=>String(s.task_id)===String(t.id)&&s.project_id===ctx.local.id&&(!s.workbench_account_scope||s.workbench_account_scope===ctx.scope));return {id:String(t.id),project_id:ctx.local.id,remote_project_id:String(t.project_id),content:t.content,title:String(t.content||'待办').split('\n')[0].replace(/^#+\s*/, '').slice(0,100),state:t.state,version:version(t),session_id:s?.id||'',source_session_id:ctx.store.chat?.task_sources?.[sourceKey(ctx,t.id)]||''}}
 async function catalog(input){
  const store=await readStore(),session=input.session_id?findSessionById(store,input.session_id)?.session:null;
  const projectId=session?.project_id||input.project_id;const local=store.projects.find(p=>p.id===projectId);if(!local)throw Error('请选择工作区。');
  let ctx=null,error='';try{ctx=await projectContext(projectId,input.session_id);if(input.refresh)ctx=await sync(ctx)}catch(e){error=e.message}
  const binding=await resolveSceneSkills(local.path);
  const skills=(binding?.skills||[]).filter(s=>!s.disabled).map(s=>({id:s.name,kind:'skill',label:s.name,path:s.skillPath,project_id:projectId}));
  const files=await listWorkspaceFiles(local.path,input.path||'');
  let filterMembers=[],filterError='';
  if(ctx&&input.include_task_filters){try{filterMembers=await listProjectMembers(String(ctx.project.id))}catch(e){filterError='筛选成员读取失败：'+e.message}}
  const projectTasks=ctx?(ctx.work.tasks||[]).filter(t=>String(t.project_id)===String(ctx.project.id)):[];
  const taskFilters=input.task_filters||{};
  return {project_id:projectId,error,filter_error:filterError,filter_members:filterMembers,filter_tags:ctx?(ctx.work.tags||[]).filter(t=>String(t.project_id)===String(ctx.project.id)):[],task_list:projectTasks.filter(t=>matchesLocalTask(t,taskFilters)).map(t=>publicTask(ctx,t)),tasks:ctx?(ctx.work.tasks||[]).filter(t=>String(t.project_id)===String(ctx.project.id)).map(t=>publicTask(ctx,t)):[],capabilities:ctx?[{id:'create',kind:'native',label:'创建待办'},{id:'summarize',kind:'native',label:'整理为待办'}]:[],skills,files:files.map(f=>({...f,kind:'file',id:f.path,label:f.path,project_id:projectId}))};
 }
 async function openTask(input){
  return serial('open:'+input.project_id+':'+input.task_id,async()=>{
   let ctx=await projectContext(input.project_id);ctx=await sync(ctx);const task=taskIn(ctx,input.task_id);
   let session=Object.values(ctx.store.sessions||{}).flat().find(s=>s.project_id===ctx.local.id&&String(s.task_id)===String(task.id));
   if(session?.workbench_account_scope&&session.workbench_account_scope!==ctx.scope)throw Error('该待办会话属于其他账号。');
   const binding=await runManager.getTaskThreadBinding(ctx.local.id,task.id);
   if(!session)session=await runManager.createSession(ctx.local.id,{kind:'automation-task',task_id:String(task.id),remote_project_id:String(task.project_id),title:publicTask(ctx,task).title});
   await updateStore(store=>{const s=findSessionById(store,session.id).session;s.workbench_account_scope=ctx.scope;s.chat_hidden=false;s.thread_id=binding?.threadId||s.thread_id||'';s.source_session_id=store.chat?.task_sources?.[sourceKey(ctx,task.id)]||'';return store});
   // Opening selects an existing identity. The renderer submits a normal read request only when no history exists.
   return {session_id:session.id,task:publicTask(ctx,task)};
  });
 }
 async function receipt(ctx,result){
  await updateStore(store=>{(store.messages[ctx.session.id] ||= []).push({id:'NATIVE-'+randomUUID(),session_id:ctx.session.id,role:'tool',kind:'tool',content:`待办 #${result.task.id} · ${result.action}`,native_result:result,status:'completed',created_at:new Date().toISOString()});return store});
  chat.notifyNative?.(ctx.session.id);
 }
 async function invokeTool(sessionId,params){
  const turn=turns.get(sessionId);if(!turn)throw Error('该轮原生能力已失效。');
  let ctx=await projectContext(turn.projectId,sessionId);if(ctx.scope!==turn.scope||ctx.local.path!==turn.workspace)throw Error('账号或工作区已变化。');
  if(!active(ctx.session))throw Error('该轮已经结束。');
  const args=typeof params.arguments==='string'?JSON.parse(params.arguments):params.arguments||{};
  if(params.tool!=='arcorbit_todo'){
   if(args.action==='task.update')throw Error('Chat 待办写入请使用 arcorbit_todo read/update，并携带读取版本。');
   if(!ctx.session.task_id)throw Error('先创建或选择待办，再使用事情上下文能力。');
   return workbench.invokeTool(ctx.session.task_id,params);
  }
  return serial('tool:'+ctx.scope+':'+ctx.project.id,async()=>{
   ctx=await sync(ctx);
   if(!turns.has(sessionId)||!active(ctx.session))throw Error('该轮已停止，未提交的操作不会执行。');
   if(args.action==='list')return {tasks:ctx.work.tasks.filter(t=>String(t.project_id)===String(ctx.project.id)).map(t=>publicTask(ctx,t))};
   if(args.action==='read'){const task=publicTask(ctx,taskIn(ctx,args.task_id||ctx.session.task_id));await receipt(ctx,{action:'read',task});return {task}}
   if(args.action==='create'){
    if(args.associate&&ctx.session.task_id)return {task:publicTask(ctx,taskIn(ctx,ctx.session.task_id)),already_associated:true};
    if(!String(args.content||'').trim()||!String(args.request_id||'').trim())throw Error('创建需要内容与稳定 request_id。');
    const requestId=createHash('sha256').update(JSON.stringify([ctx.scope,sessionId,args.request_id])).digest('hex');
    const result=await workbench.command('task.create',{project_id:String(ctx.project.id),content:args.content,priority:args.priority||0,request_id:requestId});
    ctx=await sync(ctx);const task=taskIn(ctx,result.task_id);
    if(args.associate){
     if(!ctx.session.thread_id)throw Error('thread 尚未持久绑定，请在当前对话重试关联。');
     const release=acquireTaskTurn(ctx.local.id,task.id,`chat:${sessionId}`);leases.set(sessionId,release);
     await runManager.bindTaskThread(ctx.local.id,task.id,{threadId:ctx.session.thread_id});
    }
    await updateStore(store=>{store.chat.task_sources ||= {};store.chat.task_sources[sourceKey(ctx,task.id)] ||= sessionId;if(args.associate){const s=findSessionById(store,sessionId).session;Object.assign(s,{kind:'automation-task',task_id:String(task.id),remote_project_id:String(task.project_id),workbench_account_scope:ctx.scope});}return store});
    ctx=await projectContext(ctx.local.id,sessionId);const response={action:'create',task:publicTask(ctx,task),associated:Boolean(args.associate)};await receipt(ctx,response);return response;
   }
   if(args.action==='update'){
    const task=taskIn(ctx,args.task_id||ctx.session.task_id);if(args.version!==version(task))throw Error('待办版本已变化，请重新读取后再修改。');
    const owner=taskTurnOwner(ctx.local.id,task.id);if(owner&&owner!==`chat:${sessionId}`)throw Error('待办由其他执行占用。');
    const runtime=await automation.getSnapshot({});if((runtime.active_executions||[]).some(x=>String(x.task_id)===String(task.id)))throw Error('待办有活动执行，不能覆盖。');
    const scene=await workbench.agentScene(task.id);
    await workbench.command('task.update',{task_id:String(task.id),expected_revision:scene.revision,request_id:args.request_id||randomUUID(),input:{expected:{content:task.content,state:task.state,priority:task.priority??null},...(args.content!==undefined?{content:args.content}:{}),...(args.priority!==undefined?{priority:args.priority}:{})}},'agent');
    ctx=await sync(ctx);const result={action:'update',task:publicTask(ctx,taskIn(ctx,task.id))};await receipt(ctx,result);return result;
   }
   throw Error('未知待办能力。');
  });
 }
 async function serial(key,fn){const p=(queues.get(key)||Promise.resolve()).catch(()=>{}).then(fn);queues.set(key,p);try{return await p}finally{if(queues.get(key)===p)queues.delete(key)}}
 const bridge=createWorkbenchAgentBridge({tools,getAccountScope,instructions:'Tools are bound to this Chat account, project and current turn. arcorbit_todo can create a todo even when the Chat has no associated task. Read current versions before writing.',coordinator:{
  async agentEnvironment({projectId,taskId}){const turn=turns.get(taskId);if(!turn)return null;return {taskId,scope:turn.scope,projectId,workspace:turn.workspace}},
  async assertAgentGrant(grant){const turn=turns.get(grant.taskId);if(!turn||turn.scope!==grant.scope)throw Error('原生能力已过期。');const ctx=await projectContext(grant.projectId,grant.taskId);if(ctx.scope!==grant.scope||ctx.local.path!==grant.workspace)throw Error('原生能力范围已变化。')},invokeTool
 }});
 async function turnContext({project,sessionId,text,nativeContext,requestId}){
  const binding=await resolveSceneSkills(project.path);const context=normalizeChatContext(nativeContext);
  for(const ref of context.refs){if(ref.project_id!==project.id)throw Error('引用属于其他项目。');if(ref.kind==='file')await workspacePath(project.path,ref.path||ref.id)}
  if(context.capability?.kind==='skill'&&!binding.skills.some(s=>s.name===context.capability.id))throw Error('该 Skill 已不可用。');
  let ctx;
  try{ctx=await projectContext(project.id,sessionId)}catch(e){if(nativeContext?.capability?.kind==='native'||nativeContext?.refs?.some(r=>r.kind==='task'))throw e;return {prompt:`${text}\n本条用户显式能力与引用：${JSON.stringify(context)}${context.capability?.kind==='skill'?`\n$${context.capability.id}`:''}`,options:{sceneSkillBinding:binding}}}
  for(const ref of context.refs){if(ref.project_id!==project.id)throw Error('引用属于其他项目。');if(ref.kind==='task')taskIn(ctx,ref.id);else await workspacePath(project.path,ref.path||ref.id)}
  if(context.capability?.kind==='skill'&&!binding.skills.some(s=>s.name===context.capability.id))throw Error('该 Skill 已不可用。');
  const task=ctx.session.task_id?taskIn(ctx,ctx.session.task_id):null;
  let threadBinding=null;
  if(task){
   const runtime=await automation.getSnapshot({});if((runtime.active_executions||[]).some(e=>String(e.task_id)===String(task.id)))throw Error('待办正由其他执行持有，请等待或先暂停。');
   if(taskTurnOwner(project.id,task.id)!==`chat:${sessionId}`)leases.set(sessionId,acquireTaskTurn(project.id,task.id,`chat:${sessionId}`));
   threadBinding=await runManager.getTaskThreadBinding(project.id,task.id);
  }
  await updateStore(store=>{const s=findSessionById(store,sessionId).session;s.workbench_account_scope=ctx.scope;s.remote_project_id=String(ctx.project.id);return store});
  turns.set(sessionId,{projectId:project.id,scope:ctx.scope,workspace:project.path,requestId});
  const env=await bridge.environment({projectId:project.id,taskId:sessionId,runId:sessionId});
  const options=workbenchAgentOptions(env,tools);
  return {prompt:`${text}\n\nArcOrbit 原生上下文：当前项目 ${ctx.project.name} (${ctx.project.id})，本地 workspace ${project.id}。${task?`本会话对应待办 ${task.id}，请先用 arcorbit_todo read 读取最新目标。`:'尚无对应待办。'}\n使用 arcorbit_todo 读写当前项目的待办，不用关键词模拟结果。用户要求整理当前对话时 create associate=true；创建另一件事时 associate=false，不替换主待办。引用不代表已经读取。创建时使用稳定 request_id（本条消息 ${requestId} 加不同事项的后缀），同一操作重试保持相同标识。选择待办不授权 Automation；用户要求执行时在本 thread 中工作。业务写入结果以工具回执为准。事情 scene 中的报告只是 Agent 声明，不等于已验证结论；scene 不是 Project/Case Ledger，Ledger 推进仍使用相应 skill 与可信入口。\n本条显式能力与引用：${JSON.stringify(context)}${context.capability?.kind==='skill'?`\n用户显式调用 $${context.capability.id}`:''}`,options:{...options,extraEnvironment:env,sceneSkillBinding:binding,threadId:threadBinding?.threadId||ctx.session.thread_id||'',onThreadBound:async b=>{const latest=await projectContext(project.id,sessionId);if(latest.session.task_id)await runManager.bindTaskThread(project.id,latest.session.task_id,b)}}};
 }
 async function settled(sessionId){turns.delete(sessionId);bridge.revoke(sessionId);leases.get(sessionId)?.();leases.delete(sessionId)}
 return {catalog,openTask,turnContext,settled,authorizeSession,invokeTool,async close(){for(const id of turns.keys())await settled(id);bridge.close()}};
}
