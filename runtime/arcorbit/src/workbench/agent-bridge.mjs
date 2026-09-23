import { createServer } from 'node:http';
import { randomBytes } from 'node:crypto';
import { workbenchTools } from './protocol.mjs';

// Tokens are per Run, held only in main/child environment, never renderer data.
export function createWorkbenchAgentBridge({ coordinator, getAccountScope, tools = workbenchTools, instructions = "These tools act only on the current ArcOrbit work item. Read its scene and capabilities before making changes." }) {
  const grants=new Map();let server=null, address='',starting=null;
  async function start() {
    if(address)return;
    if(starting)return starting;
    starting=new Promise((resolve,reject)=>{
      server=createServer(async(req,res)=>{
        const grant=grants.get(String(req.headers.authorization || '').replace(/^Bearer /,''));
        res.setHeader('Content-Type','application/json');
        try {
          if(!['/tool','/mcp'].includes(req.url)||req.headers.origin||!grant||grant.scope!==await getAccountScope()) throw new Error('Workbench capability authorization expired.');
          if(req.method!=='POST'){res.statusCode=405;res.setHeader('Allow','POST');res.end();return;}
          let body='';for await(const chunk of req){body+=chunk;if(Buffer.byteLength(body)>128000)throw new Error('Tool request is too large.');}
          if(![...grants.values()].includes(grant))throw new Error('Workbench capability authorization expired.');
          await coordinator.assertAgentGrant?.(grant);
          const request=JSON.parse(body);
          if(req.url==='/mcp') {
            if(request.jsonrpc!=='2.0'||typeof request.method!=='string')throw new Error('Invalid MCP request.');
            if(request.id===undefined){res.statusCode=202;res.end();return;}
            let result;
            if(request.method==='initialize')result={protocolVersion:['2024-11-05','2025-03-26','2025-06-18'].includes(request.params?.protocolVersion)?request.params.protocolVersion:'2025-03-26',capabilities:{tools:{}},serverInfo:{name:'arcorbit_workbench',version:'1.0.0'},instructions};
            else if(request.method==='tools/list')result={tools};
            else if(request.method==='tools/call') {
              try {const value=await coordinator.invokeTool(grant.taskId,{tool:request.params?.name,arguments:request.params?.arguments||{}});result={content:[{type:'text',text:JSON.stringify(value)}]};}
              catch(error){result={isError:true,content:[{type:'text',text:error.message}]};}
            } else if(request.method==='resources/list')result={resources:[]};
            else if(request.method==='resources/templates/list')result={resourceTemplates:[]};
            else if(request.method==='prompts/list')result={prompts:[]};
            else if(request.method==='ping')result={};
            else {res.end(JSON.stringify({jsonrpc:'2.0',id:request.id,error:{code:-32601,message:'Method not found'}}));return;}
            res.end(JSON.stringify({jsonrpc:'2.0',id:request.id,result}));
          } else {
            const result=await coordinator.invokeTool(grant.taskId,request);
            res.end(JSON.stringify({ok:true,result}));
          }
        }catch(error){res.statusCode=400;res.end(JSON.stringify({ok:false,error:error.message}));}
      });
      server.once('error',reject);server.listen(0,'127.0.0.1',()=>{address=`http://127.0.0.1:${server.address().port}/tool`;resolve();});server.unref();
    });
    return starting;
  }
  return {
    async environment(input){const grant=await coordinator.agentEnvironment(input);if(!grant)return {};await start();const token=randomBytes(32).toString('hex');grants.set(token,{...grant,runId:input.runId});return {ARCORBIT_WORKBENCH_BRIDGE:JSON.stringify({url:address,token}),ARCORBIT_WORKBENCH_TOKEN:token};},
    revoke(runId){for(const [token,grant] of grants)if(grant.runId===runId)grants.delete(token);},
    close(){grants.clear();server?.close();}
  };
}
export function workbenchAgentOptions(environment=process.env, tools=workbenchTools) {
  const raw=environment.ARCORBIT_WORKBENCH_BRIDGE;if(!raw)return {};
  const {url,token}=JSON.parse(raw);const parsed=new URL(url);
  if(parsed.hostname!=='127.0.0.1'||parsed.protocol!=='http:'||parsed.pathname!=='/tool'||!token)throw new Error('Invalid workbench bridge.');
  return {threadConfig:{'mcp_servers.arcorbit_workbench':{url:new URL('/mcp',url).href,bearer_token_env_var:'ARCORBIT_WORKBENCH_TOKEN',enabled:true,startup_timeout_sec:10,tool_timeout_sec:300}},dynamicTools:tools,dynamicToolProvider:async params=>{
    const response=await fetch(url,{method:'POST',headers:{Authorization:`Bearer ${token}`,'Content-Type':'application/json'},body:JSON.stringify(params),signal:AbortSignal.timeout(60000)});
    const body=await response.json();if(!body.ok)throw new Error(body.error);return body.result;
  }};
}
