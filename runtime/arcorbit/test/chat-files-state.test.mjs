import test from 'node:test';
import assert from 'node:assert/strict';
import { createChatFilesState, fileDirty, fileFocusFallback } from '../desktop/renderer/chat-files-state.mjs';
const deferred=()=>{let resolve,reject;const promise=new Promise((a,b)=>{resolve=a;reject=b;});return {promise,resolve,reject};};
function fixture(){
  let workspace='root', revision='r1', text='original', saveHook=null, readHook=null, contextHook=null;
  const calls=[];let event;
  const api={onChatFilesEvent:listener=>{event=listener;return()=>{event=null;};},async chatFiles(action,input){calls.push({action,input});if(action==='release')return {released:true};if(action==='context'){if(contextHook)await contextHook(input);return {workspace:input.project_id+workspace,project_id:input.project_id,name:input.project_id};}if(action==='observe')return {workspace:input.expected_workspace,project_id:input.project_id,version:0,invalidated:[],watch_error:''};if(action==='list')return {entries:[{path:'a.txt',name:'a.txt',kind:'file'}],next_offset:null,total:1,directory_revision:'dir'};if(action==='read'){if(readHook)return readHook();return {path:input.path,text,revision};}if(action==='save'){if(saveHook)await saveHook();if(input.revision!==revision)throw Error('版本变化');text=input.text;revision+='x';return {revision,text};}if(action==='rename')return {path:input.name};if(action==='trash')return {};}};
  const state=createChatFilesState({api});return {state,calls,setRoot:r=>workspace=r,setDisk:(t,r)=>{text=t;revision=r;},saveHook:fn=>saveHook=fn,readHook:fn=>readHook=fn,contextHook:fn=>contextHook=fn};
}
test('deleted tree rows prefer the closest visible parent, then the next or previous adjacent row',()=>{
 assert.equal(fileFocusFallback('src/nested/file.js',['src','src/nested','src/nested/file.js','tail'],['src','tail']),'src');
 assert.equal(fileFocusFallback('b',['a','b','c'],['a','c']),'c');
 assert.equal(fileFocusFallback('c',['a','b','c'],['a','b']),'b');
});
test('same identity revalidation recovers from temporary context failure without losing draft or model',async()=>{
 const f=fixture(),m=f.state;await m.select({project_id:'p'});const s=m.current(),t=await m.openFile(s,'a.txt');t.text='valuable';t.model={identity:'model'};t.view={line:4};const resource=t.model;
 f.contextHook(()=>{throw Error('temporary context failure');});await m.select({project_id:'p'},true);assert.equal(s.invalid,true);await assert.rejects(m.save(s,t),/失效/);assert.equal(f.calls.filter(c=>c.action==='save').length,0);
 f.contextHook(null);await m.select({project_id:'p'},true);assert.equal(m.current(),s);assert.equal(s.invalid,false);assert.equal(s.error,'');assert.equal(t.text,'valuable');assert.equal(t.base,'original');assert.equal(t.model,resource);assert.deepEqual(t.view,{line:4});
 await m.save(s,t);assert.equal(t.base,'valuable');assert.equal(fileDirty(t),false);
});
test('recovery cannot accept a different identity or a late response after project switch',async()=>{
 const f=fixture(),m=f.state;await m.select({project_id:'p'});const s=m.current(),t=await m.openFile(s,'a.txt');t.text='draft';
 f.contextHook(()=>{throw Error('temporary');});await m.select({project_id:'p'},true);f.contextHook(null);f.setRoot('new-account-or-root');await m.select({project_id:'p'},true);
 assert.equal(m.current(),s);assert.equal(s.invalid,true);await assert.rejects(m.save(s,t),/失效/);assert.equal(t.text,'draft');
 f.setRoot('root');const gate=deferred();f.contextHook(input=>input.project_id==='p'?gate.promise:undefined);const pending=m.select({project_id:'p'},true);await m.select({project_id:'q'});gate.resolve();await pending;
 assert.equal(m.current().project_id,'q');assert.equal(s.invalid,true);assert.equal(t.text,'draft');
});
test('dedup, project isolation and late reads cannot activate a previous owner',async()=>{
 const f=fixture(),m=f.state;await m.select({project_id:'p',session_id:'s'});const s=m.current();await Promise.all([m.openFile(s,'a.txt'),m.openFile(s,'a.txt')]);assert.equal(s.tabs.length,1);s.tabs[0].text='draft';
 const wait=deferred();f.readHook(()=>wait.promise);const pending=m.openFile(s,'late');await m.select({project_id:'q'});wait.resolve({path:'late',text:'late',revision:'r'});await pending;assert.equal(m.current().tabs.length,0);assert.equal(s.tabs.length,1);
 await m.select({project_id:'p',session_id:'s2'});assert.equal(m.current(),s);assert.equal(s.tabs[0].text,'draft');assert.equal(s.owner.session_id,'s2');
});
test('save captures baseline, later typing remains dirty, conflicts and errors keep draft',async()=>{
 const f=fixture(),m=f.state;await m.select({project_id:'p'});const s=m.current(),t=await m.openFile(s,'a.txt');t.text='sent';const gate=deferred();f.saveHook(()=>gate.promise);const save=m.save(s,t);t.text='typed later';gate.resolve();await save;assert.equal(t.base,'sent');assert.equal(fileDirty(t),true);
 f.setDisk('external','new');await assert.rejects(m.save(s,t),/版本/);assert.equal(t.text,'typed later');assert.ok(t.error);await m.reload(s,t);assert.equal(t.text,'external');assert.equal(fileDirty(t),false);
});
test('root replacement keeps invalid draft until explicit discard; no writes to new root',async()=>{
 const f=fixture(),m=f.state;await m.select({project_id:'p'});const s=m.current(),t=await m.openFile(s,'a.txt');t.text='valuable';f.setRoot('replacement');await m.select({project_id:'p'},true);assert.equal(m.current(),s);assert.equal(s.invalid,true);await assert.rejects(m.save(s,t),/失效/);assert.equal(t.text,'valuable');m.discardSession(s);await m.select({project_id:'p'});assert.notEqual(m.current(),s);assert.equal(m.current().tabs.length,0);
});
test('rename migrates paths while retaining model identity, undo carrier and view; close disposes only selected resource',async()=>{
 const f=fixture(),m=f.state;await m.select({project_id:'p'});const s=m.current(),a=await m.openFile(s,'dir/a.txt'),b=await m.openFile(s,'other.txt');a.text='draft';const resource={dispose(){this.disposed=true;}};a.model=resource;a.view={line:9};s.active=a.path;await m.rename(s,'dir','new');assert.equal(a.path,'new/a.txt');assert.equal(a.text,'draft');assert.equal(a.model,resource);assert.deepEqual(a.view,{line:9});assert.equal(s.active,'new/a.txt');m.close(s,b);assert.equal(resource.disposed,undefined);m.close(s,a);assert.equal(resource.disposed,true);assert.equal(s.active,'');
});

test('filesystem invalidation preserves cached rows and atomically reconciles the current workspace',async()=>{
 let listener,entries=[{path:'old.txt',name:'old.txt',kind:'file'}],revision='one',gate;
 const calls=[];const api={onChatFilesEvent:fn=>{listener=fn;return()=>{};},async chatFiles(action,input={}){calls.push({action,input});
  if(action==='release')return {released:true};
  if(action==='context')return {workspace:'workspace',project_id:'p',name:'Project'};
  if(action==='observe')return {workspace:'workspace',project_id:'p',watch_error:'',invalidated:[],version:0};
  if(action==='list'){if(gate)await gate.promise;return {entries:entries.slice(input.offset||0,(input.offset||0)+100),directory_revision:revision,next_offset:null,total:entries.length};}
 }};
 const state=createChatFilesState({api,loadingDelayMs:5});await state.select({project_id:'p'});const session=state.current();
 assert.deepEqual(session.directories.get('').entries.map(entry=>entry.path),['old.txt']);
 gate=deferred();entries=[{path:'new.txt',name:'new.txt',kind:'file'}];revision='two';
 listener({project_id:'p',workspace:'workspace',version:1,invalidated:[''],watch_error:''});
 await new Promise(resolve=>setTimeout(resolve,12));
 assert.equal(session.directories.get('').loading,false,'background reconciliation never shows blocking loading');
 assert.deepEqual(session.directories.get('').entries.map(entry=>entry.path),['old.txt'],'last trusted rows remain visible while reading');
 gate.resolve();gate=null;await new Promise(resolve=>setTimeout(resolve,0));
 assert.deepEqual(session.directories.get('').entries.map(entry=>entry.path),['new.txt']);
 listener({project_id:'p',workspace:'other',version:2,invalidated:[''],watch_error:'wrong workspace'});
 assert.equal(session.watch_error,'');
 assert.ok(calls.some(call=>call.action==='observe'));
});

test('same-owner re-entry waits for release, reconciles cached directories and resumes observation',async()=>{
 const f=fixture(),m=f.state,owner={project_id:'p',session_id:'s'};
 await m.select(owner);const session=m.current();
 const firstObserve=f.calls.filter(call=>call.action==='observe').length;
 const firstList=f.calls.filter(call=>call.action==='list').length;
 await m.deactivate();
 assert.equal(f.calls.at(-1).action,'release');
 await m.select(owner);
 assert.equal(m.current(),session,'same workspace session and cached file state are retained');
 assert.ok(f.calls.filter(call=>call.action==='observe').length>firstObserve,'observation is re-established for the same owner');
 assert.ok(f.calls.filter(call=>call.action==='list').length>firstList,'returning reconciles cached directories before relying on events');
 const reentry=f.calls.slice(f.calls.findLastIndex(call=>call.action==='release'));
 assert.equal(reentry[0].action,'release');
 assert.ok(reentry.findIndex(call=>call.action==='observe')>0,'new observation starts after release completes');
});

test('deactivation releases after an in-flight observe and discards a late directory reconciliation',async()=>{
 let listener,entries=[{path:'old.txt',name:'old.txt',kind:'file'}],blockedObserve=null,blockedList=null,observeCalls=0,listCalls=0;
 const operations=[];const api={onChatFilesEvent:fn=>{listener=fn;return()=>{};},async chatFiles(action,input={}){
  if(action==='context')return {workspace:'workspace',project_id:'p',name:'Project'};
  if(action==='release'){operations.push('release');return {released:true};}
  if(action==='observe'){
   observeCalls++;const wait=blockedObserve;
   if(wait){operations.push('observe-start');await wait.promise;operations.push('observe-bound');}
   return {workspace:'workspace',project_id:'p',watch_error:'',invalidated:[],version:observeCalls};
  }
  if(action==='list'){
   listCalls++;const result=entries,wait=blockedList;if(wait){operations.push('list-start');await wait.promise;operations.push('list-result');}
   return {entries:result,directory_revision:'dir-'+result[0].path,next_offset:null,total:result.length};
  }
 }};
 const state=createChatFilesState({api}),owner={project_id:'p'};await state.select(owner);const session=state.current();
 blockedObserve=deferred();const beforeObserve=operations.length,pendingObserve=state.observe(session,true);
 await new Promise(resolve=>setImmediate(resolve));const leaving=state.deactivate();await new Promise(resolve=>setImmediate(resolve));
 assert.deepEqual(operations.slice(beforeObserve),['observe-start'],'release waits for the active observe command');
 blockedObserve.resolve();blockedObserve=null;await Promise.all([pendingObserve,leaving]);
 assert.deepEqual(operations.slice(beforeObserve),['observe-start','observe-bound','release']);

 await state.select(owner);blockedList=deferred();entries=[{path:'stale.txt',name:'stale.txt',kind:'file'}];
 const beforeRelease=operations.length,beforeLists=listCalls,pendingList=state.reconcile(session,'');await new Promise(resolve=>setImmediate(resolve));
 await state.deactivate();const callsAtRelease=observeCalls;
 assert.equal(operations.at(-1),'release');
 let reentered=false;const reentry=state.select(owner).then(()=>{reentered=true;});await new Promise(resolve=>setImmediate(resolve));
 assert.equal(reentered,false,'re-entry waits for the stale request before starting an authoritative replacement');
 entries=[{path:'new.txt',name:'new.txt',kind:'file'}];blockedList.resolve();blockedList=null;await Promise.all([pendingList,reentry]);
 assert.deepEqual(session.directories.get('').entries.map(entry=>entry.path),['new.txt'],'the current generation replaces the ignored stale result');
 assert.ok(observeCalls>callsAtRelease,'only the re-entered generation resumes observation');
 assert.equal(listCalls,beforeLists+2,'the stale read is followed by one awaited current-generation reconciliation');
 assert.deepEqual(operations.slice(beforeRelease),['list-start','release','list-result']);
 assert.equal(typeof listener,'function');
});
