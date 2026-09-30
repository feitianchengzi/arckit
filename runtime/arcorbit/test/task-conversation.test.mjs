import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, rm, writeFile, readFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { createTaskConversation, mergeTaskConversation } from '../src/task-conversation.mjs';
import { createRunInputQueue, readRunInputs } from '../src/run-input-queue.mjs';
import { createCodexAppServerAdapter } from '../adapters/codex-app-server-adapter.mjs';

test('continuous history retains interactive answers, old run output, tools and delivery identity without duplicates', () => {
  const messages=mergeTaskConversation([{id:'chat',role:'assistant',content:'discussion',created_at:'1'}, {id:'control',role:'user',content:'stop',created_at:'3'}], [
    {id:'run:a:a',role:'assistant',content:'auto',created_at:'2'}, {id:'run:a:control',source_message_id:'control',role:'user',content:'stop',created_at:'3'},
    {id:'input:x',client_request_id:'x',content:'supplement',delivery_status:'delivered',created_at:'4'}]);
  assert.deepEqual(messages.map(m=>m.content),['discussion','auto','stop','supplement']);
});

test('input outbox persists before sending, deduplicates retries, queues turn gaps and reports uncertain restart', async () => {
  const dir=await mkdtemp(join(tmpdir(),'arcorbit-input-'));const file=join(dir,'inputs.json');const sent=[];
  const queue=createRunInputQueue({file,send:packet=>sent.push(packet)});
  try {
    await queue.enqueue({client_request_id:'a',content:'first'});
    assert.equal(sent.length,0);assert.equal(JSON.parse(await readFile(file))[0].delivery_status,'queued');
    await queue.turn('turn-1');assert.equal(sent.length,1);
    await queue.enqueue({client_request_id:'a',content:'first'});assert.equal(sent.length,1);
    await queue.acknowledge({request_id:'a',status:'queued'});
    await queue.turn('turn-2');assert.equal(sent.length,2);
    await queue.acknowledge({request_id:'a',status:'delivered'});
    assert.equal(queue.messages()[0].delivery_status,'delivered');
    await queue.enqueue({client_request_id:'b',content:'uncertain'});
    assert.equal((await readRunInputs(file))[1].delivery_status,'unknown');
    await queue.turn('');await queue.enqueue({client_request_id:'c',content:'pending'});
    await queue.close();
    assert.deepEqual((await readRunInputs(file)).map(m=>m.delivery_status),['delivered','unknown','failed']);
    await assert.rejects(queue.enqueue({client_request_id:'d',content:'late'}),/结束/);
  } finally {await queue.close();await rm(dir,{recursive:true,force:true});}
});

test('a delayed queued receipt does not strand input after a new turn has started', async()=>{
 const dir=await mkdtemp(join(tmpdir(),'arcorbit-input-race-')),sent=[];
 const queue=createRunInputQueue({file:join(dir,'inputs.json'),send:p=>sent.push(p)});
 try{await queue.turn('a');await queue.enqueue({client_request_id:'x',content:'x'});await queue.turn('b');await queue.acknowledge({request_id:'x',status:'queued'});assert.equal(sent.length,2);assert.equal(sent[1].expected_turn_id,'b');await queue.acknowledge({request_id:'x',status:'delivered'});}finally{await queue.close();await rm(dir,{recursive:true,force:true});}
});

test('task routing supplements the owned Auto run, pauses exact execution, and permits discussion after stop',async()=>{
 const session={id:'S',project_id:'P',task_id:'T'},calls=[];
 let run={id:'R',project_id:'P',task_id:'T'},store={sessions:{P:[session]},automation:{}};
 const service=createTaskConversation({runManager:{readDesktopChatMetadata:async()=>store,taskConversationRun:()=>run,taskConversationHistory:async()=>[{id:'a',content:'auto'}],controlRun:async(...args)=>calls.push(args),updateDesktopChatMetadata:async f=>{store=f(store);}},automation:()=>({getSnapshot:async()=>({active_executions:[{run_id:'R',execution_id:'E'}]}),stopCurrent:async input=>{assert.equal(input.execution_id,'E');run=null;}}),validateInput:async i=>i.text});
 assert.equal(await service.send({session_id:'S',client_request_id:'m',text:'new'}),true);assert.equal(calls[0][0],'R');
 const snap=await service.snapshot({sessions:[{...session}],selected_session_id:'S',messages:[{id:'c',content:'chat'}]});assert.equal(snap.sessions[0].execution.mode,'automation');assert.equal(snap.messages.length,2);
 assert.equal(await service.interrupt('S'),true);assert.equal(await service.send({session_id:'S',client_request_id:'n',text:'discuss'}),false);
});

test('real adapter transport releases the writer before another adapter resumes the same thread',async()=>{
 const dir=await mkdtemp(join(tmpdir(),'arcorbit-writer-')),script=join(dir,'codex'),lock=join(dir,'writer');
 await writeFile(script,`#!${process.execPath}\nconst fs=require('fs'),rl=require('readline').createInterface({input:process.stdin});const lock=${JSON.stringify(lock)};let owned=false;const send=x=>console.log(JSON.stringify(x));process.on('SIGTERM',()=>setTimeout(()=>{if(owned)fs.unlinkSync(lock);process.exit(0)},100));rl.on('line',line=>{const m=JSON.parse(line);if(!m.id)return;let result={};if(m.method==='thread/start'||m.method==='thread/resume'){try{fs.writeFileSync(lock,'writer',{flag:'wx'});owned=true;}catch{send({id:m.id,error:{message:'already has an active writer'}});return;}result={thread:{id:'one-thread'}};}if(m.method==='turn/start'){result={turn:{id:'turn'}};send({method:'turn/started',params:{threadId:'one-thread',turn:{id:'turn'}}});}send({id:m.id,result});if(m.method==='turn/start')setTimeout(()=>send({method:'turn/completed',params:{threadId:'one-thread',turn:{id:'turn',status:'completed'}}}),10);});`,{mode:0o755});
 const first=createCodexAppServerAdapter(),second=createCodexAppServerAdapter();
 try{
  for await(const e of first.runTurn({projectRoot:dir,prompt:'discussion',options:{codexBin:script,resultKind:'chat'}})){}
  const closing=first.close();assert.equal(await readFile(lock,'utf8'),'writer');await closing;
  let resumed=false;
  for await(const e of second.runTurn({projectRoot:dir,prompt:'auto',options:{codexBin:script,threadId:'one-thread',resultKind:'chat'}})){if(e.type==='codex.thread.resume.completed')resumed=true;}
  assert.equal(resumed,true);
 }finally{await first.close();await second.close();await rm(dir,{recursive:true,force:true});}
});


test('a supplement retry after Auto finishes never becomes a second Chat turn', async () => {
  const session={id:'S',project_id:'P',task_id:'T'};
  const service=createTaskConversation({runManager:{readDesktopChatMetadata:async()=>({sessions:{P:[session]}}),taskConversationRun:()=>null,taskConversationHistory:async()=>[{client_request_id:'accepted',content:'same',delivery_status:'unknown'}]}});
  assert.equal(await service.send({session_id:'S',client_request_id:'accepted',text:'same'}),true);
  await assert.rejects(service.send({session_id:'S',client_request_id:'accepted',text:'different'}),/不同内容/);
  assert.equal(await service.send({session_id:'S',client_request_id:'new',text:'discussion'}),false);
});
