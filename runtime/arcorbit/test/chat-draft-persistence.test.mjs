import assert from 'node:assert/strict';
import test from 'node:test';
import {mkdtemp,rm,readFile} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {createDesktopStore} from '../src/desktop/desktop-store.mjs';
import {createChatCoordinator} from '../src/chat-coordinator.mjs';

test('draft acknowledgement persists metadata without hydrating or modifying message history',async()=>{
 const root=await mkdtemp(join(tmpdir(),'arcorbit-draft-persistence-'));
 const options={dataDir:root,runsDir:join(root,'runs'),storePath:join(root,'desktop-store.json')};
 try{
  const seed=createDesktopStore(options);
  await seed.updateStore(s=>{
   s.projects=[{id:'P',path:root,name:'Project'}];
   s.sessions.P=[{id:'S',project_id:'P',kind:'chat',status:'completed',title:'Conversation'}];
   s.messages.S=[{id:'M',role:'assistant',kind:'text',content:'历史内容'.repeat(100000),status:'completed'}];
   return s;
  });
  const before=JSON.parse(await readFile(options.storePath,'utf8'));
  const messageFile=before.partitions.message_file;
  const messageBytes=await readFile(join(root,messageFile));
  let historyReads=0,historyWrites=0,authorized=0,allow=true;
  const store=createDesktopStore({...options,io:{async readJson(path){if(path.includes('desktop-session-messages.'))historyReads++;return JSON.parse(await readFile(path,'utf8'))}}});
  const c=createChatCoordinator({runManager:{updateDesktopChatMetadata:store.updateChatMetadata,readDesktopStore:store.readControlStore,updateDesktopStore:store.updateControlStore,readDesktopStoreWithMessages:store.readStoreWithMessages,updateDesktopStoreWithMessages:fn=>{historyWrites++;return store.updateStoreWithMessages(fn)}},getCodexExecutable:()=>({command:'codex'}),authorizeSession:async(session,context)=>{authorized++;assert.equal(session.id,'S');assert.ok(context?.store);return allow}});
  const context={capability:{kind:'native',id:'create',label:'创建待办',path:'',project_id:''},refs:[]};
  const saved=await c.createDraft({session_id:'S',project_id:'P',text:'中文草稿',model:'gpt-6-astra',reasoning_effort:'high',native_context:context,response:'ack'});
  assert.deepEqual(saved,{saved:true,session_id:'S',project_id:'P'});
  assert.equal(historyReads,0);assert.equal(historyWrites,0);assert.equal(authorized,1);
  assert.equal(JSON.parse(await readFile(options.storePath,'utf8')).partitions.message_file,messageFile);
  assert.deepEqual(await readFile(join(root,messageFile)),messageBytes);
  const reopened=createDesktopStore(options);const restored=await reopened.readControlStore();
  assert.equal(restored.sessions.P.find(s=>s.id==='S').draft,'中文草稿');
  assert.equal(restored.sessions.P.find(s=>s.id==='S').reasoning_effort,'high');
  assert.deepEqual(restored.sessions.P.find(s=>s.id==='S').native_context,context);
  allow=false;await assert.rejects(c.createDraft({session_id:'S',project_id:'P',text:'unauthorized',response:'ack'}),/不可访问/);
  assert.equal((await store.readControlStore()).sessions.P.find(s=>s.id==='S').draft,'中文草稿');
  allow=true;const snapshot=await c.createDraft({session_id:'S',project_id:'P',text:'default snapshot'});
  assert.equal(snapshot.messages[0].id,'M');assert.equal(snapshot.draft.text,'default snapshot');
  assert.equal(historyReads,1);
 }finally{await rm(root,{recursive:true,force:true})}
});

test('metadata commits share the store queue and do not overwrite concurrent messages or publish failed writes',async()=>{
 const {writeFile}=await import('node:fs/promises');
 const root=await mkdtemp(join(tmpdir(),'arcorbit-chat-metadata-'));
 let fail=false;
 const options={dataDir:root,runsDir:join(root,'runs'),storePath:join(root,'desktop-store.json'),io:{async writeJson(path,value){if(fail&&path===join(root,'desktop-store.json'))throw Error('disk unavailable');await writeFile(path,JSON.stringify(value))}}};
 try{
  const store=createDesktopStore(options);
  await store.updateStore(s=>{s.projects=[{id:'P',name:'Project',path:root}];s.sessions.P=[{id:'S',project_id:'P',kind:'chat',status:'completed'}];s.messages.S=[];return s});
  await Promise.all([
   store.updateStore(s=>{s.messages.S.push({id:'M',content:'persisted concurrently'});return s}),
   store.updateChatMetadata(s=>{s.sessions.P[0].draft='saved draft';return s}),
   store.updateControlStore(s=>{s.projects[0].name='Changed project';return s})
  ]);
  const merged=await store.readStoreWithMessages();
  assert.equal(merged.messages.S[0].id,'M');assert.equal(merged.sessions.P[0].draft,'saved draft');assert.equal(merged.projects[0].name,'Changed project');
  const before=await readFile(options.storePath,'utf8');fail=true;
  await assert.rejects(store.updateChatMetadata(s=>{s.sessions.P[0].draft='not committed';return s}),/disk unavailable/);
  assert.equal((await store.readControlStore()).sessions.P[0].draft,'saved draft');assert.equal(await readFile(options.storePath,'utf8'),before);
  fail=false;await store.updateChatMetadata(s=>{s.sessions.P[0].draft='retry';return s});
  const reopened=createDesktopStore({...options,io:{}});
  const restored=await reopened.readStoreWithMessages();assert.equal(restored.sessions.P[0].draft,'retry');assert.equal(restored.messages.S[0].id,'M');
 }finally{await rm(root,{recursive:true,force:true})}
});
