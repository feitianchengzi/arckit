import { workbenchAgentOptions } from './agent-bridge.mjs';
import { workbenchTools } from './protocol.mjs';
import { randomUUID, createHash } from 'node:crypto';
import { realpath, readFile, stat } from 'node:fs/promises';
import { resolve, relative, basename, isAbsolute } from 'node:path';
import { EventEmitter } from 'node:events';
import { createChatCoordinator } from '../chat-coordinator.mjs';
import { taskDisplayTitle } from '../task-display-title.mjs';
import { normalizeTaskAttachmentUrl } from '../work-task-attachment-content.mjs';
import { createSceneStore, emptyScene, goalVersion } from './scene-store.mjs';
import { acquireTaskTurn, taskTurnOwner } from './task-turn-lock.mjs';

const activeChat = status => ['starting', 'running', 'waiting_approval', 'interrupting'].includes(status);
const text = (value, max = 100000) => String(value || '').trim().slice(0, max);
const list = value => Array.isArray(value) ? value : [];
const capabilities = [
  ['scene.read', '读取事情、上下文及版本', {}],
  ['report', '提交 Agent 当前工作、进展、剩余问题与成果声明', { current:'string', advances:'string[]', remaining:'string[]', next:'string', plan:'string[]', artifacts:'{path, summary, version}[]' }],
  ['agreement.propose','提出待采纳的约定',{text:'string'}], ['criteria.propose','提出待采纳的完成标准',{text:'string'}],
  ['material.add','添加共享文本或链接资料',{type:'text | url',content:'string'}],
  ['comment.add','发表共享事情留言',{content:'string'}],
  ['task.update','更新当前事情正文或优先级',{content:'string?',priority:'integer?'}],
  ['task.subtask.create','在当前事情下创建待评审子事情',{content:'string'}]
].map(([name,description,input]) => ({name,description,input,scope:'current_task',owner: name.startsWith('task.') || name.startsWith('material') || name.startsWith('comment') ? 'workshop' : 'workbench_scene'}));

export function createProjectWorkbench({ dataDir, runManager, workSync, platform, automation, getAccountScope,
  getCodexExecutable, setupReadinessPreflight, getAgentEnvironment = async () => ({}), revokeAgentEnvironment = () => {}, softwareCapabilities = () => [], callSoftware = async () => { throw new Error("软件能力不可用。"); }, resolveSceneSkills = async () => null, createAdapter, now = () => new Date().toISOString() }) {
  const scenes = createSceneStore({ dataDir, now });
  const emitter = new EventEmitter();
  const turnLeases = new Map();
  const commandQueues = new Map();
  const changed = () => emitter.emit('event', { type:'workbench.changed' });
  const chat = createChatCoordinator({ runManager, getCodexExecutable, setupReadinessPreflight, createAdapter,
    sessionKind:'automation-task', getTurnContext: turnContext,
    onTurnSettled: async ({sessionId}) => { revokeAgentEnvironment(`chat:${sessionId}`); turnLeases.get(sessionId)?.(); turnLeases.delete(sessionId); changed(); await automation.maybeStartNext?.(); }
  });
  chat.onEvent(event => emitter.emit('event', { ...event, type: `workbench.${event.type}` }));
  async function authority() {
    const scope = await getAccountScope();
    if (!scope) throw new Error('请先登录 Workshop。');
    return scope;
  }
  async function snapshot() {
    const scope = await authority();
    const [work, runtime, store, local, db] = await Promise.all([workSync.getSnapshot(), automation.getSnapshot({}), runManager.readDesktopStore(), runManager.listProjects(), scenes.read(scope)]);
    const projects = (work.project_catalog?.length ? work.project_catalog : work.projects || []).map(project => ({ id:String(project.id), name:project.name,
      local_project_id:store.automation.project_bindings?.[project.id] || '', participating:Boolean(store.automation.project_participation?.[project.id]), members:project.raw?.members || project.members || [],
      state:work.project_states?.[project.id]?.state || 'not_loaded' }));
    const ids = new Set(projects.map(p => p.id));
    return { account_scope:scope, user:work.user, projects, local_projects:local.map(({id,name})=>({id,name})), tasks:work.tasks.filter(task => ids.has(String(task.project_id))),
      runtime:{...runtime,queue:store.automation.enabled?runtime.queue:list(runtime.queue).filter(t=>store.automation.requested_tasks?.[t.id])}, scenes:Object.fromEntries(Object.entries(db.scenes).filter(([id])=>work.tasks.some(task=>String(task.id)===id)).map(([id,s])=>[id,{revision:s.revision,pause_requested:s.pause_requested}])),
      source_status:work.source_status, errors:work.errors, settings:await runManager.getSettings() };
  }
  async function taskContext(taskId) {
    const scope = await authority();
    const [work, store, db] = await Promise.all([workSync.getSnapshot(),runManager.readDesktopStore(),scenes.read(scope)]);
    const task = work.tasks.find(t=>String(t.id)===String(taskId));
    if (!task) throw new Error('事情不存在或当前账号无权访问，请同步后重试。');
    const localId = store.automation.project_bindings?.[task.project_id] || '';
    const local = store.projects.find(p=>p.id===localId);
    return {scope,task,work,store,local,scene:db.scenes[task.id] || emptyScene(task.id)};
  }
  async function detail(taskId) {
    const ctx = await taskContext(taskId);
    const {task, scene, local, store} = ctx;
    const runtime = await automation.getSnapshot({});
    const executions = list(runtime.active_executions).filter(e=>String(e.task_id)===String(task.id));
    const history = list(runtime.execution_history).filter(e=>String(e.task_id || e.source_task_id)===String(task.id));
    const sessions = local ? await runManager.listSessions(local.id) : [];
    const boundSession = sessions.find(s=>s.id===scene.session_id) || sessions.find(s=>s.kind==='automation-task' && String(s.task_id)===String(task.id));
    const otherAccount=boundSession?.workbench_account_scope && boundSession.workbench_account_scope!==ctx.scope;
    const session=otherAccount?null:boundSession;
    const discussion = session ? await chat.getSnapshot({session_id:session.id}) : {messages:[],sessions:[]};
    const runs = local && !otherAccount ? (await runManager.listRuns({projectId:local.id})).filter(r=>String(r.task_id)===String(task.id)) : [];
    const latestRun = runs[0] || null;
    // Hydrate only the selected task's latest activity, never all historical transcripts.
    const activity = latestRun ? (await runManager.getRunActivitySnapshot(latestRun.id))?.run?.activity : null;
    let attachments = [], attachmentError = '';
    try { attachments = await platform.executeAction('task.attachments.list',{task_id:task.id}); }
    catch(error) { attachmentError=error.message; }
    const effectiveScene = structuredClone(scene);
    if (effectiveScene.goal_version && effectiveScene.goal_version !== goalVersion(task.content)) effectiveScene.criteria = effectiveScene.criteria.map(c=>({...c,checked:false}));
    const results = activity?.agent_loop_result || null;
    return { task, scene:effectiveScene, local_project:local ? {id:local.id,name:local.name} : null,
      session:discussion.sessions.find(s=>s.id===session?.id) || null, thread_bound:Boolean(session?.thread_id || latestRun?.thread_id),
      messages:discussion.messages, runs:runs.map(r=>({id:r.id,status:r.status,started_at:r.started_at,finished_at:r.finished_at,run_summary:r.run_summary})),
      activity, result:results, executions, history, attachments:list(attachments), attachment_error:attachmentError,
      feedback:list(store.automation.acceptance_feedback_items).filter(i=>String(i.source_task_id)===String(task.id)),
      recovery:list(runtime.recovery_items).filter(i=>String(i.task_id)===String(task.id)),
      attention:list(runtime.attention_items).filter(i=>String(i.task_id)===String(task.id)),
      conversation_unavailable:otherAccount?'本机主会话属于另一个账号，需要原账号移交。':'',
      current_turn_owner:local ? taskTurnOwner(local.id,task.id) : '',
      children:ctx.work.tasks.filter(t=>String(t.father_id)===String(task.id)),
      user:ctx.work.user, members:(ctx.work.project_catalog || []).find(p=>String(p.id)===String(task.project_id))?.raw?.members || [] };
  }
  async function ensureSession(ctx, persist = true) {
    if (!ctx.local) throw new Error('请先为该项目绑定本地工作区。');
    const existing=(await runManager.listSessions(ctx.local.id)).find(s=>s.kind==='automation-task' && String(s.task_id)===String(ctx.task.id));
    if(existing?.workbench_account_scope && existing.workbench_account_scope!==ctx.scope)throw new Error('本机主会话属于另一个账号，需要原账号移交。');
    const session=existing || await runManager.createSession(ctx.local.id,{kind:'automation-task',task_id:ctx.task.id,remote_project_id:ctx.task.project_id,title:taskDisplayTitle(ctx.task.content)});
    await runManager.updateDesktopStore(store=>{const bound=store.sessions[ctx.local.id].find(s=>s.id===session.id);bound.workbench_account_scope=ctx.scope;return store;});
    if (persist) await scenes.mutate(ctx.scope,db=>{ const s=db.scenes[ctx.task.id] ||= emptyScene(ctx.task.id); s.session_id=session.id; });
    return session;
  }
  async function turnContext({project,sessionId,text:message}) {
    const session=(await runManager.listSessions(project.id)).find(s=>s.id===sessionId);
    const ctx=await taskContext(session.task_id);
    const binding=await runManager.getTaskThreadBinding(project.id,session.task_id);
    const agentEnvironment=await getAgentEnvironment({projectId:project.id,taskId:session.task_id,runId:`chat:${sessionId}`});
    const bridgeOptions=workbenchAgentOptions(agentEnvironment);
    return { prompt:`${message}\n\nArcOrbit discussion context: use arcorbit_scene_read to read the current work item, scene and shared references. Read relevant referenced files yourself; inclusion is not evidence that a file has been read. Reports are Agent claims, not silently accepted facts. Scene state is not the Project/Case Ledger. Use arcorbit_scene_update for scene progress, not Ledger transitions or Case closure. For a Ledger workflow, follow its skill and trusted entrypoints. Discussion does not authorize automatic execution.`, options:{
      threadConfig:bridgeOptions.threadConfig,extraEnvironment:agentEnvironment,sceneSkillBinding:await resolveSceneSkills(project.path), threadId:binding?.threadId || session.thread_id || '', dynamicTools:workbenchTools,
      dynamicToolProvider:async params=>{const latest=await taskContext(ctx.task.id);if(latest.scope!==ctx.scope||latest.local?.path!==project.path)throw new Error('账号或工作区已变化。');return invokeTool(ctx.task.id,params);},
      onThreadBound:binding=>runManager.bindTaskThread(project.id,session.task_id,binding)
    }};
  }
  async function invokeTool(taskId, params) {
    if(params.tool==='arcorbit_scene_read') return agentScene(taskId);
    if(params.tool==='arcorbit_capabilities') return {capabilities:[...capabilities,...softwareCapabilities()]};
    const args=typeof params.arguments==='string'?JSON.parse(params.arguments):params.arguments || {};
    if(params.tool==='arcorbit_scene_update' || params.tool==='arcorbit_call') {const result=await command(args.action,{...args,task_id:String(taskId)},'agent');return result.last_capability_result?.action===args.action ? {revision:result.revision,...result.last_capability_result} : result;}
    throw new Error('未知事情工具。');
  }
  async function agentScene(taskId) {
    const ctx=await taskContext(taskId);
    if(ctx.scene.plan_status==='pending') await scenes.mutate(ctx.scope,db=>{db.scenes[taskId].plan_status='read';db.scenes[taskId].revision+=1;ctx.scene=db.scenes[taskId];});
    const attachments=await platform.executeAction('task.attachments.list',{task_id:ctx.task.id});
    return {task:ctx.task,scene:ctx.scene,materials:list(attachments).filter(a=>ctx.scene.context.some(c=>String(c.id)===String(a.id)&&c.included)),
      revision:ctx.scene.revision, source:'Workshop task + local personal scene; reports are claims', capabilities};
  }
  async function send(input) {
    const ctx=await taskContext(input.task_id);
    const runtime=await automation.getSnapshot({});
    const execution=list(runtime.active_executions).find(e=>String(e.task_id)===String(ctx.task.id));
    if(execution && ['running','closeout_running','starting'].includes(execution.phase) && !ctx.scene.pause_requested) {
      const requestId=text(input.request_id,200);if(!requestId)throw new Error('消息缺少请求标识。');
      let replay=false;
      await scenes.mutate(ctx.scope,db=>{const s=db.scenes[ctx.task.id] ||= emptyScene(ctx.task.id);s.message_receipts ||= {};const receipt=s.message_receipts[requestId];if(receipt){if(receipt.text!==text(input.text))throw new Error('消息请求标识已用于其他内容。');replay=true;return;}s.message_receipts[requestId]={text:text(input.text),status:'sending',at:now()};});
      if(replay){const receipt=(await scenes.read(ctx.scope)).scenes[ctx.task.id].message_receipts[requestId];if(receipt.status!=='delivered')throw new Error('上次消息投递结果尚未确认，请检查运行消息后再补充。');return {status:'already_received'};}
      try {await automation.submitIntervention({execution_id:execution.execution_id,taskId:ctx.task.id,message:text(input.text)});}
      catch(error){await scenes.mutate(ctx.scope,db=>{db.scenes[ctx.task.id].message_receipts[requestId].status='unconfirmed';});throw error;}
      await scenes.mutate(ctx.scope,db=>{const s=db.scenes[ctx.task.id];s.message_receipts[requestId].status='delivered';s.events.push({id:randomUUID(),action:'chat.steer',actor:'user',at:now(),request_id:requestId,summary:'补充消息已交给当前执行，等待 Agent 读取',message_id:''});s.revision++;});
      return {status:'delivered'};
    }
    if(execution?.active_run?.status==='running' || execution?.phase==='cli_handoff') throw new Error('正在暂停或已交给外部 CLI；请等待执行释放后再讨论。');
    const session=await ensureSession(ctx);
    const release=acquireTaskTurn(ctx.local.id,ctx.task.id,`chat:${session.id}`);
    turnLeases.set(session.id,release);
    try { const result=await chat.send({session_id:session.id,project_id:ctx.local.id,text:input.text,client_request_id:input.request_id,model:input.model,reasoning_effort:input.reasoning_effort});if(!activeChat(result.sessions.find(s=>s.id===session.id)?.status)){release();turnLeases.delete(session.id);}return result; }
    catch(error) {release();turnLeases.delete(session.id);throw error;}
  }
  async function create(input) {
    const scope=await authority(), requestId=text(input.request_id,200);
    if(!requestId || !text(input.content)) throw new Error('请填写事情内容。');
    const work=await workSync.getSnapshot();
    if(!(work.project_catalog || work.projects).some(p=>String(p.id)===String(input.project_id))) throw new Error('请选择可访问的项目。');
    const fingerprint=JSON.stringify([input.project_id,input.content,input.father_id || '',input.executor_id || work.user?.id]);
    let existing;
    await scenes.mutate(scope,db=>{
      existing=db.creations[requestId];
      if(existing && existing.fingerprint!==fingerprint) throw new Error('创建标识已用于另一件事情。');
      if(!existing) db.creations[requestId]={fingerprint,status:'started',at:now()};
    });
    if(existing?.task_id) return {task_id:existing.task_id};
    if(existing) throw new Error('此前创建结果尚未确认，请同步事情列表后检查，避免重复创建。');
    const task=await platform.executeAction(input.father_id?'task.subtask.create':'task.create',{project_id:input.project_id,content:input.content,father_id:input.father_id || undefined,executor_id:input.executor_id || work.user?.id,state:'pending_review',priority:input.priority || 0});
    const taskId=String(task.id || task.task?.id || '');
    if(!taskId) throw new Error('服务未返回事情标识，请同步检查。');
    await scenes.mutate(scope,db=>{db.creations[requestId].task_id=taskId;db.creations[requestId].status='completed';db.scenes[taskId] ||= emptyScene(taskId);});
    changed();return {task_id:taskId};
  }
  async function command(action,input={},actor='user') {
    const scope=await authority();
    const key=`${scope}:${input.task_id || 'create'}`;
    const operation=(commandQueues.get(key)||Promise.resolve()).then(()=>execute(action,input,actor));
    commandQueues.set(key,operation.catch(()=>{}));
    try {return await operation;} finally {changed();}
  }
  async function execute(action,input,actor) {
    if(actor==='agent' && !capabilities.some(c=>c.name===action) && !softwareCapabilities().some(c=>c.name===action)) throw new Error('该操作需要用户主动执行。');
    if(action==='task.create') return create(input);
    if(action==='sync') {
      await workSync.reconcile({reason:'project-workbench'});
      const work=await workSync.getSnapshot();
      const ids=input.project_id?[String(input.project_id)]:(work.project_catalog||work.projects||[]).map(p=>String(p.id));
      const failures=[];
      for(let i=0;i<ids.length;i+=4){const results=await Promise.allSettled(ids.slice(i,i+4).map(id=>workSync.refreshProject(id)));for(const result of results)if(result.status==='rejected')failures.push(result.reason?.message||'项目同步失败');}
      if(failures.length)throw new Error(failures.join('；'));
      return snapshot();
    }
    if(action==='project.bind') {await automation.bindProject(input.project_id,input.local_project_id);return snapshot();}
    if(action==='scene.read') return agentScene(input.task_id);
    const ctx=await taskContext(input.task_id), {task,scope}=ctx;
    if(action==='asset.preview') {
      if(!ctx.local)throw new Error('没有本地工作区。');
      const assetPath=text(input.input?.path,2000);
      const root=await realpath(ctx.local.path),file=await realpath(resolve(root,assetPath)),rel=relative(root,file);
      if(rel.startsWith('..')||isAbsolute(rel))throw new Error('成果不在当前工作区内。');
      const info=await stat(file);if(!info.isFile()||info.size>2*1024*1024)throw new Error('该成果无法内嵌预览，请在项目文件中查看。');
      const content=await readFile(file);
      return {name:basename(file),path:rel,version:createHash('sha256').update(content).digest('hex'),content:content.toString('utf8').slice(0,100000),truncated:info.size>100000};
    }
    if(action==='chat.send') { if(task.state==='accepted')throw new Error('已验收事情只读。');return send(input); }
    if(action==='chat.stop') {const s=await ensureSession(ctx);return chat.interrupt({session_id:s.id});}
    if(action==='chat.approval') {const s=await ensureSession(ctx);return chat.decideApproval({...input,session_id:s.id});}
    if(task.state==='accepted') throw new Error('已验收事情只读。');
    const payload=input.input || {};
    return scenes.change(scope,task.id,{...input,action,actor,input:payload}, async scene=>{
      const runtime=await automation.getSnapshot({});
      const active=list(runtime.active_executions).find(e=>String(e.task_id)===String(task.id));
      const history=list(runtime.execution_history).find(e=>String(e.task_id || e.source_task_id)===String(task.id));
      if(softwareCapabilities().some(c=>c.name===action)) {
        scene.last_capability_result={action,result:await callSoftware(action,payload,{task,local:ctx.local,scope,actor}),at:now()};
      } else if(action==='task.update') {
        const changes=actor==='agent'?{...(payload.content!==undefined?{content:payload.content}:{}),...(payload.priority!==undefined?{priority:payload.priority}:{})}:payload;
        if(changes.state==='accepted') throw new Error('请使用验收操作。');
        await platform.executeAction('task.update',{...changes,task_id:task.id,expected_state:task.state});
        if(changes.content!==undefined && changes.content!==task.content) {scene.criteria=scene.criteria.map(c=>({...c,checked:false}));scene.goal_version=goalVersion(changes.content);}
      } else if(action==='task.subtask.create') {
        await platform.executeAction(action,{project_id:task.project_id,father_id:task.id,content:payload.content,executor_id:ctx.work.user?.id,state:'pending_review'});
      } else if(action==='auto.start') {
        if(taskTurnOwner(ctx.local?.id,task.id)) throw new Error('请等待当前讨论结束后再启动 Auto。');
        if(!ctx.local) throw new Error('请先绑定本地工作区。');
        if(String(task.executor_id)!==String(ctx.work.user?.id)) throw new Error('只有分配给自己的事情可以在此设备 Auto。');
        if(!['pending_review','pending','blocked'].includes(task.state)) throw new Error('当前状态不能直接 Auto，请使用恢复操作。');
        await ensureSession(ctx, false);
        await automation.updateTaskState({taskId:task.id,state:'pending',expectedState:task.state});
        await automation.enqueueTask(task.id);scene.pause_requested=false;
      } else if(action==='auto.unqueue') {await automation.dequeueTask(task.id);await automation.updateTaskState({taskId:task.id,state:'pending_review',expectedState:'pending'});
      } else if(action==='auto.pause' || action==='auto.stop') {
        if(!active) throw new Error('没有可停止的执行。');
        await automation.stopCurrent({execution_id:active.execution_id});scene.pause_requested=action==='auto.pause';
      } else if(action==='auto.resume') {
        if(taskTurnOwner(ctx.local?.id,task.id)) throw new Error('请等待当前讨论结束。');
        if(!history) throw new Error('尚无可恢复的执行。');
        await automation.manageExecution({history_id:history.history_id,action:'resume',message:payload.message || ''});scene.pause_requested=false;
      } else if(action==='auto.external') {if(!active) throw new Error('执行已结束。');await automation.confirmExternalDependency({execution_id:active.execution_id});
      } else if(action==='auto.recover') {await automation.resolveRecovery({recoveryId:payload.recovery_id,action:payload.action,message:payload.message});
      } else if(action==='criteria.set' || action==='criteria.propose') {
        const rows=list(payload.items || text(payload.text).split('\n')).map(v=>typeof v==='string'?{text:v}:v).filter(v=>text(v.text));
        const incoming=rows.map(v=>({id:v.id || randomUUID(),text:text(v.text,1000),checked:false,status:actor==='agent'?'proposed':'accepted'}));scene.criteria=action==='criteria.propose'?[...scene.criteria,...incoming]:incoming;scene.goal_version=goalVersion(task.content);
      } else if(action==='criteria.check') {const item=scene.criteria.find(c=>c.id===payload.id);if(!item) throw new Error('标准已变化。');if(scene.goal_version!==goalVersion(task.content)) {scene.criteria.forEach(c=>c.checked=false);scene.goal_version=goalVersion(task.content);}item.checked=Boolean(payload.checked);item.status='accepted';
      } else if(action==='agreement.add' || action==='agreement.propose') {scene.agreements.push({id:randomUUID(),text:text(payload.text),status:actor==='agent'?'proposed':'accepted',source:actor,message_id:payload.message_id || '',at:now()});
      } else if(action==='agreement.update') {const item=scene.agreements.find(a=>a.id===payload.id);if(!item) throw new Error('约定已变化。');if(payload.text!==undefined)item.text=text(payload.text);if(payload.status)item.status=payload.status;
      } else if(action==='plan.set') {scene.plan=list(payload.items).map(v=>text(v,1000)).filter(Boolean);scene.plan_status=active?.active_run?.status==='running'?'pending':'available';if(scene.plan_status==='pending')await automation.submitIntervention({execution_id:active.execution_id,taskId:task.id,message:'用户调整了当前安排，请在下一处安全边界使用 arcorbit_scene_read 读取并重新判断。安排不是完成判据。'});
      } else if(action==='report') {scene.reports.push({id:randomUUID(),...normalizeReport(payload),source:actor==='agent'?'agent_claim':'user_selected_message',message_id:payload.message_id || '',at:now()});if(payload.plan) {scene.plan=list(payload.plan).map(v=>text(v,1000));scene.plan_status='agent_proposed';}
      } else if(['material.add','comment.add'].includes(action)) {
        const type=action==='comment.add'?'text':payload.type || 'text';
        const content=type==='url'?normalizeTaskAttachmentUrl(payload.content):text(payload.content);
        if(!content || !['text','url','file'].includes(type)) throw new Error('资料类型或内容无效。');
        const a=await platform.executeAction('task.attachment.create',{task_id:task.id,type,content});
        if(a?.id)scene.context.push({id:String(a.id),included:action==='material.add',kind:action==='comment.add'?'comment':'material',version:String(a.updated_at || a.created_at || now())});
      } else if(action==='material.remove') {const attachments=await platform.executeAction('task.attachments.list',{task_id:task.id});if(!list(attachments).some(a=>String(a.id)===String(payload.id))) throw new Error('附件不属于当前事情。');await platform.executeAction('task.attachment.delete',{attachment_id:payload.id});scene.context=scene.context.filter(c=>c.id!==String(payload.id));
      } else if(action==='context.include') {const item=scene.context.find(c=>c.id===String(payload.id));if(item)item.included=Boolean(payload.included);else scene.context.push({id:String(payload.id),included:Boolean(payload.included),kind:'material',version:payload.version || ''});
      } else if(action==='acceptance.feedback') {await automation.submitAcceptanceFeedback({taskId:task.id,message:payload.text,idempotencyKey:input.request_id});
      } else if(action==='acceptance.accept') {
        if(task.state!=='completed') throw new Error('事情尚未完成。');
        if(scene.criteria.length && (scene.goal_version!==goalVersion(task.content) || scene.criteria.some(c=>!c.checked || c.status!=='accepted'))) throw new Error('请先核对当前目标的全部完成标准。');
        const feedback=(await runManager.readDesktopStore()).automation.acceptance_feedback_items || [];
        if(feedback.some(f=>String(f.source_task_id)===String(task.id)&&!['resolved','cancelled'].includes(f.status)))throw new Error('仍有未解决的验收问题。');
        await automation.updateTaskState({taskId:task.id,state:'accepted',expectedState:'completed'});
      } else throw new Error(`未知事情操作：${action}`);
    });
  }
  return {snapshot,detail,command,invokeTool,agentScene,capabilities:()=>capabilities,
    async agentEnvironment({projectId,taskId}) {if(!taskId)return null;const ctx=await taskContext(taskId);if(ctx.local?.id!==projectId)throw new Error('Agent 工作区与事情不匹配。');return {taskId:String(taskId),scope:ctx.scope,projectId,workspace:ctx.local.path};},
    async assertAgentGrant(grant){const ctx=await taskContext(grant.taskId);if(ctx.scope!==grant.scope||ctx.local?.id!==grant.projectId||ctx.local?.path!==grant.workspace)throw new Error('事情工作区或账号已变化，原执行不能继续调用能力。');},
    onEvent(fn){emitter.on('event',fn);return()=>emitter.off('event',fn);},async close(){await chat.close();for(const release of turnLeases.values())release();turnLeases.clear();}};
}
function normalizeReport(input) {return {current:text(input.current,4000),summary:text(input.summary,4000),advances:list(input.advances).map(v=>text(v,1000)),remaining:list(input.remaining).map(v=>text(v,1000)),next:text(input.next,2000),artifacts:list(input.artifacts).slice(0,50).map(a=>({path:text(a.path,2000),summary:text(a.summary,2000),version:text(a.version,200)}))};}
