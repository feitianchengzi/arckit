import assert from 'node:assert/strict';
import test from 'node:test';
import {mkdtemp,rm,readFile} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {createDesktopStore} from '../src/desktop/desktop-store.mjs';
import {createChatCoordinator} from '../src/chat-coordinator.mjs';

test('session switching projects one history and global approvals without all-history reads or writes',async()=>{
 const root=await mkdtemp(join(tmpdir(),'arcorbit-chat-switch-'));
 try{
  const options={dataDir:root,runsDir:join(root,'runs'),storePath:join(root,'desktop-store.json')};
  const store=createDesktopStore(options);
  await store.updateStore(s=>{
   s.projects=[{id:'P',name:'Project',path:root}];
   s.sessions.P=['A','B','DENIED','HIDDEN'].map(id=>({id,project_id:'P',kind:'chat',title:id,status:'completed',chat_hidden:id==='HIDDEN'}));
   for(const id of ['A','B','DENIED','HIDDEN'])s.messages[id]=[
    {id:id+'-text',role:'assistant',kind:'text',status:'completed',content:'history '.repeat(20000)},
    {id:id+'-approval',kind:'approval',status:'pending',content:'Approval',approval_request_id:id+'-request'}
   ];return s;
  });
  const before=JSON.parse(await readFile(options.storePath,'utf8')).partitions;
  const coordinator=createChatCoordinator({runManager:{
   readDesktopStore:store.readControlStore,updateDesktopStore:store.updateControlStore,
   readDesktopChatMetadata:store.readChatMetadata,readDesktopChatSnapshotStore:store.readChatSnapshotStore,
   updateDesktopChatMetadata:store.updateChatMetadata,
   readDesktopStoreWithMessages(){throw Error('all-history read')},
   updateDesktopStoreWithMessages(){throw Error('all-history write')}
  },authorizeSession:async(session,context)=>{assert.ok(context?.store);return session.id!=='DENIED'},getCodexExecutable:()=>({command:'codex'})});
  const a=await coordinator.select({session_id:'A'});
  assert.equal(a.selected_session_id,'A');assert.deepEqual(a.messages.map(m=>m.id),['A-text','A-approval']);
  assert.deepEqual(a.pending_approvals.map(m=>m.session_id).sort(),['A','B']);
  await assert.rejects(coordinator.select({session_id:'DENIED'}),/不可访问/);
  await assert.rejects(coordinator.select({session_id:'HIDDEN'}),/hidden/);
  await assert.rejects(coordinator.select({session_id:'MISSING'}),/missing/);
  assert.equal((await store.readChatMetadata()).chat.selected_session_id,'A');
  const projected=await store.readChatSnapshotStore({session_id:'B'});
  assert.equal(projected.messages.B.length,2);assert.deepEqual(projected.messages.A.map(m=>m.id),['A-approval']);
  projected.messages.A[0].status='corrupted';projected.sessions.P[0].title='corrupted';
  assert.equal((await store.readChatSnapshotStore()).messages.A[1].status,'pending');
  assert.equal((await store.readChatMetadata()).sessions.P[0].title,'A');
  await coordinator.select({session_id:'B'});
  assert.deepEqual(JSON.parse(await readFile(options.storePath,'utf8')).partitions,before);
  assert.equal((await createDesktopStore(options).readControlStore()).chat.selected_session_id,'B');
  // Both replacement and deletion invalidate the cached approval projection.
  await store.updateStore(s=>{s.messages.A[1].status='completed';delete s.messages.DENIED;return s});
  const refreshed=await coordinator.getSnapshot();
  assert.deepEqual(refreshed.pending_approvals.map(m=>m.session_id),['B']);
  const empty=await coordinator.select({session_id:''});assert.equal(empty.messages.length,0);
  assert.equal(empty.pending_approvals.length,1);
 }finally{await rm(root,{recursive:true,force:true})}
});

test('projected snapshots keep live deltas and cross-session approval settlement',async()=>{
 const root=await mkdtemp(join(tmpdir(),'arcorbit-chat-switch-live-'));
 let coordinator,release;
 const gate=new Promise(resolve=>{release=resolve});
 let ready;const streaming=new Promise(resolve=>{ready=resolve});
 try{
  const store=createDesktopStore({dataDir:root,runsDir:join(root,'runs'),storePath:join(root,'desktop-store.json')});
  await store.updateStore(s=>{s.projects=[{id:'P',name:'Project',path:root}];return s});
  coordinator=createChatCoordinator({runManager:{
   readDesktopStore:store.readControlStore,updateDesktopStore:store.updateControlStore,
   readDesktopChatMetadata:store.readChatMetadata,readDesktopChatSnapshotStore:store.readChatSnapshotStore,
   updateDesktopChatMetadata:store.updateChatMetadata,
   readDesktopStoreWithMessages:store.readStoreWithMessages,updateDesktopStoreWithMessages:store.updateStoreWithMessages,
   getSettings:async()=>({})
  },getCodexExecutable:()=>({command:'codex'}),createAdapter:()=>({
   async *runTurn({options}){
    await options.onThreadBound({threadId:'THREAD',resumed:false});
    yield {type:'codex.turn.started',turn_id:'TURN'};
    yield {type:'codex.item.started',params:{item:{id:'LIVE',type:'agentMessage',text:''}}};
    yield {type:'codex.agent_message.delta',item_id:'LIVE',text:'Live text'};
    ready();await gate;
    await options.approvalProvider({request_id:'REQUEST',method:'item/commandExecution/requestApproval',params:{command:'pwd'}});
    yield {type:'codex.item.completed',params:{item:{id:'LIVE',type:'agentMessage',text:'Final text'}}};
    yield {type:'codex.turn.completed',turn_id:'TURN',turn:{status:'completed'}};
   },async interrupt(){release()},close(){}
  })});
  const sent=await coordinator.send({project_id:'P',text:'Start',client_request_id:'start'});
  await streaming;
  let snapshot=await coordinator.getSnapshot({session_id:sent.selected_session_id});
  assert.ok(snapshot.messages.some(m=>m.content==='Live text'));
  release();
  const waitFor=async predicate=>{for(let i=0;i<200;i++){const s=await coordinator.getSnapshot({session_id:''});if(predicate(s))return s;await new Promise(r=>setTimeout(r,5))}throw Error('chat state timeout')};
  snapshot=await waitFor(s=>s.pending_approvals.length===1);
  assert.equal(snapshot.messages.length,0);
  const approval=snapshot.pending_approvals[0];assert.equal(approval.session_id,sent.selected_session_id);
  await coordinator.decideApproval({session_id:sent.selected_session_id,request_id:approval.approval_request_id,decision:'accept'});
  await waitFor(s=>s.sessions.find(x=>x.id===sent.selected_session_id)?.status==='completed');
  snapshot=await coordinator.getSnapshot({session_id:sent.selected_session_id});
  assert.equal(snapshot.pending_approvals.length,0);assert.ok(snapshot.messages.some(m=>m.content==='Final text'));
 }finally{release();await coordinator?.close();await rm(root,{recursive:true,force:true})}
});
