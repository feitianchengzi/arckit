import test from 'node:test';
import assert from 'node:assert/strict';
import { createChatFilesState, fileDirty } from '../desktop/renderer/chat-files-state.mjs';
const deferred=()=>{let resolve,reject;const promise=new Promise((a,b)=>{resolve=a;reject=b;});return {promise,resolve,reject};};
function fixture(){
  let workspace='root', revision='r1', text='original', saveHook=null, readHook=null, contextHook=null;
  const calls=[];
  const api={async chatFiles(action,input){calls.push({action,input});if(action==='context'){if(contextHook)await contextHook(input);return {workspace:input.project_id+workspace,project_id:input.project_id,name:input.project_id};}if(action==='list')return {entries:[{path:'a.txt',name:'a.txt',kind:'file'}],next_offset:null,total:1,directory_revision:'dir'};if(action==='read'){if(readHook)return readHook();return {path:input.path,text,revision};}if(action==='save'){if(saveHook)await saveHook();if(input.revision!==revision)throw Error('版本变化');text=input.text;revision+='x';return {revision,text};}if(action==='rename')return {path:input.name};if(action==='trash')return {};}};
  const state=createChatFilesState({api});return {state,calls,setRoot:r=>workspace=r,setDisk:(t,r)=>{text=t;revision=r;},saveHook:fn=>saveHook=fn,readHook:fn=>readHook=fn,contextHook:fn=>contextHook=fn};
}
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
