// Explicit local protocol probe: no turn/start, model inference or remote business writes.
import assert from 'node:assert/strict';
import {mkdtemp,rm,writeFile} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {JsonRpcStdioClient} from '../../src/json-rpc-stdio-client.mjs';
import {createWorkbenchAgentBridge,workbenchAgentOptions} from '../../src/workbench/agent-bridge.mjs';
const root=await mkdtemp(join(tmpdir(),'arcorbit-native-mcp-'));let client,createdThread='';
const calls=[];const coordinator={agentEnvironment:async()=>({scope:'isolated-native-test',taskId:'fixture-task'}),assertAgentGrant:async()=>{},invokeTool:async(taskId,params)=>{calls.push({taskId,tool:params.tool});return {task_id:taskId,source:'isolated protocol fixture',revision:0};}};
const bridge=createWorkbenchAgentBridge({coordinator,getAccountScope:async()=> 'isolated-native-test'});
try {
 const environment=await bridge.environment({runId:'native-probe'});
 client=new JsonRpcStdioClient({command:process.env.ARCORBIT_TEST_CODEX_BIN||'codex',args:['app-server','--stdio','-c','mcp_servers={}'],cwd:root,stderr:'ignore',env:{...process.env,...environment}});
 await client.request('initialize',{clientInfo:{name:'arcorbit_workbench_protocol_probe',version:'1'},capabilities:{experimentalApi:true}});client.notify('initialized',{});
 const started=await client.request('thread/start',{cwd:root,ephemeral:false,approvalPolicy:'never',config:{mcp_servers:{}}});
 const threadId=started.thread.id;createdThread=threadId;
 await client.request('thread/inject_items',{threadId,items:[{type:'message',role:'user',content:[{type:'input_text',text:'Isolated ArcOrbit protocol fixture. No model turn should run.'}]}]});
 await client.request('thread/unsubscribe',{threadId});
 const resumed=await client.request('thread/resume',{threadId,cwd:root,config:workbenchAgentOptions(environment).threadConfig});
 assert.equal(resumed.thread.id,threadId);
 const status=await client.request('mcpServerStatus/list',{threadId});
 const server=status.data.find(s=>s.name==='arcorbit_workbench');assert(server,JSON.stringify(status));
 assert(Object.values(server.tools).some(t=>t.name==='arcorbit_scene_read'),JSON.stringify(server));
 const called=await client.request('mcpServer/tool/call',{threadId,server:'arcorbit_workbench',tool:'arcorbit_scene_read',arguments:{}});
 assert(calls.some(c=>c.taskId==='fixture-task'&&c.tool==='arcorbit_scene_read'));
 const result={ok:true,thread_preserved:true,tool_discovered:true,tool_called:true,model_turns_started:0,remote_business_writes:0};
 if(process.argv[2])await writeFile(process.argv[2],JSON.stringify(result,null,2)+'\n');
 console.log(JSON.stringify(result));
}finally{if(createdThread)await client?.request('thread/archive',{threadId:createdThread}).catch(()=>{});client?.close();bridge.close();await rm(root,{recursive:true,force:true});}
