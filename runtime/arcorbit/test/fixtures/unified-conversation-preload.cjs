const listeners=new Set(),automationListeners=new Set(),calls=[];
const session={id:'TASK-CHAT',project_id:'local-11',remote_project_id:'11',task_id:'W-11',title:'统一待办对话',status:'running',execution:{mode:'automation'},model:'gpt-6-astra',reasoning_effort:'high'};
const messages=[{id:'manual',role:'assistant',kind:'text',content:'先前的人工讨论',status:'completed'}, {id:'auto',role:'assistant',kind:'text',content:'Auto 执行输出',status:'completed'}, {id:'result',role:'system',actor:'runtime',kind:'status',content:'同线程执行进展',status:'completed'}];let draft='';
const snapshot=()=>({sessions:[session],projects:[{id:'local-11',name:'ArcOrbit Local'}],selected_session_id:session.id,messages,draft:{project_id:'local-11',text:draft},pending_approvals:[]});
const changed=()=>{for(const listener of listeners)listener({type:'chat.conversation.updated',session_id:session.id});};
module.exports={
 chatSnapshot:async()=>snapshot(),selectChat:async()=>snapshot(),createChat:async input=>{draft=input.text;return snapshot();},
 chatNativeCatalog:async()=>({tasks:[{id:'W-11',title:session.title,state:'in_progress'}],capabilities:[],skills:[],files:[]}),
 chatNativeOpen:async input=>{calls.push(['open',input]);return {session_id:session.id};},
 onAutomationEvent:listener=>{automationListeners.add(listener);return()=>automationListeners.delete(listener);},
 setAutoFinished:async()=>{session.execution=null;session.status='completed';for(const listener of automationListeners)listener({type:'automation.changed'});},
 onChatEvent:listener=>{listeners.add(listener);return()=>listeners.delete(listener);},
 sendChatMessage:async input=>{calls.push(['send',input]);messages.push({id:input.client_request_id,role:'user',kind:'text',content:input.text,status:'completed',delivery_status:session.execution?.mode==='automation'?'queued':undefined});draft='';return snapshot();},
 interruptChat:async()=>{calls.push(['pause']);session.execution={mode:'discussion',resumable:true};session.status='interrupted';changed();return snapshot();},
 projectWorkbenchDetail:async()=>({scene:{revision:1}}),
 projectWorkbenchCommand:async(action,input)=>{calls.push([action,input]);if(action!=='auto.resume')throw Error('Unexpected command');session.execution={mode:'automation'};session.status='running';changed();return {};},
 setTestDelivery:async status=>{messages.at(-1).delivery_status=status;changed();},
 getUnifiedCalls:async()=>calls
};
