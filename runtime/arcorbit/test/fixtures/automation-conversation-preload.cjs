module.exports = base => {
 const events=new Set(),chatEvents=new Set(),autoEvents=new Set(),stats={sync:0,opens:0,messages:0,runs:0,activity:0};
 const active={...base.active_executions.find(e=>e.task_id==='W-RUNNING'),local_project_id:'local-11',session_id:'AUTO-SESSION',local_project_path:'/repo/arcorbit'};
 const messages=[{id:'manual',role:'assistant',kind:'text',content:'人工讨论历史',status:'completed'},{id:'auto',role:'assistant',kind:'text',content:'自动执行历史',status:'completed'}];
 const run={id:active.run_id,project_id:'local-11',session_id:active.session_id,task_id:active.task_id,status:'running',started_at:'2026-10-01T00:00:00Z',activity:{thread_id:'SHARED-THREAD',messages:[],rounds:[],current_step:'执行中'}};
 const snapshot=()=>({...base,selected_execution_id:active.execution_id,active_task:active,active_execution:active,active_executions:[active],active_run:run,execution_history:[{...active,history_id:active.execution_id,status:active.phase,active:true}],recent_completions:[]});
 const owner={run_id:run.id,project_id:run.project_id,session_id:run.session_id,task_id:run.task_id};
 return {
  automationSnapshot:async()=>snapshot(),
  onEvent:f=>{events.add(f);return()=>events.delete(f);},onChatEvent:f=>{chatEvents.add(f);return()=>chatEvents.delete(f);},onAutomationEvent:f=>{autoEvents.add(f);return()=>autoEvents.delete(f);},
  listMessages:async(project,session)=>{stats.messages++;if(project!=='local-11'||session!=='AUTO-SESSION')throw Error('wrong identity');return messages;},
  listRuns:async()=>{stats.runs++;return [run];},runActivitySnapshot:async()=>{stats.activity++;return {run,owner};},
  chatNativeOpen:async()=>{stats.opens++;throw Error('Viewing Auto must not open/sync a task');},syncAutomation:async()=>{stats.sync++;return snapshot();},
  chatSnapshot:async()=>({sessions:[{id:active.session_id,project_id:'local-11',task_id:active.task_id,title:'共享对话',status:'completed'}],projects:[{id:'local-11',name:'ArcOrbit'}],selected_session_id:active.session_id,messages,draft:{project_id:'local-11',text:''}}),
  publishAutoViewProgress:async()=>{run.activity.current_step+='.';for(const f of events)f({type:'run.activity_changed',runId:run.id,owner});},
  publishAutoViewMessage:async()=>{messages.push({id:'input',role:'user',kind:'text',content:'补充执行说明',delivery_status:'delivered',status:'completed'});for(const f of chatEvents)f({type:'chat.conversation.updated',session_id:run.session_id});},
  publishAutoViewSnapshot:async()=>{for(const f of autoEvents)f({type:'automation.changed'});},
  getAutoViewStats:async()=>stats
 };
};
