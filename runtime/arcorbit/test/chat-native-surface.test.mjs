import assert from 'node:assert/strict';
import test from 'node:test';
import { readFileSync } from 'node:fs';
import { parseHTML } from 'linkedom';
import { createChatNativeSurface } from '../desktop/renderer/chat-native-surface.mjs';
const tick=()=>new Promise(resolve=>setTimeout(resolve,0));
function setup(){
 const {document,window}=parseHTML(readFileSync(new URL('../desktop/renderer/index.html',import.meta.url),'utf8'));
 Object.defineProperty(window.HTMLSelectElement.prototype,'value',{configurable:true,get(){return this.querySelector('option[selected]')?.value||''},set(value){for(const option of this.querySelectorAll('option'))option.toggleAttribute('selected',option.value===value)}});
 globalThis.document=document;globalThis.window=window;
 let project={id:'P1'},session={id:'S1',task_id:'T1',status:'completed'};
 const state={draft:'',configuration:{},native_context:{capability:null,refs:[]}};
 const calls=[];
 const surface=createChatNativeSurface({api:{chatNativeCatalog(query){return new Promise((resolve,reject)=>calls.push({query,resolve,reject}))}},coordinator:{getState:()=>state,setNativeContext:value=>state.native_context=value,setDraft:value=>state.draft=value},getProject:()=>project,getSession:()=>session,render(){},performAction:fn=>fn(),closeList(){}});
 const result=title=>({tasks:[{id:'T1',title,state:title}],task_list:[{id:'T1',title,state:title}],filter_members:[],filter_tags:[]});
 const startLoad=async()=>{surface.render();};
 return {document,window,surface,state,calls,result,startLoad,setOwner(p,s){project=p;session=s}};
}
test('picker exposes only capabilities and skills while preserving legacy references',async()=>{
 const h=setup(),picker=h.document.querySelector('.chat-capability-menu');
 h.state.native_context.refs=[{id:'README.md',path:'README.md',label:'README.md',kind:'file'}];
 picker.open=true;picker.close=()=>{};
 await h.startLoad();
 h.calls[0].resolve({...h.result('task'),capabilities:[{id:'create',kind:'native',label:'创建待办'},{id:'misfiled-task',kind:'task',label:'错误归类待办'}],skills:[{id:'skill',kind:'skill',label:'Skill'},{id:'misfiled-file',kind:'file',label:'错误归类文件'}],files:[{id:'src',path:'src',label:'src',kind:'file',directory:true},{id:'README.md',path:'README.md',label:'README.md',kind:'file',directory:false}]});
 await tick();
 const picks=[...picker.querySelectorAll('[data-pick]')];
 assert.deepEqual(picks.map(b=>b.dataset.pick),['native:create','skill:skill']);
 assert.equal(picker.querySelector('[data-up]'),null);
 assert.doesNotMatch(picker.textContent,/引用上下文|项目文件|待办 ·|文件夹|上级目录/);
 assert.equal(picker.querySelector('input').getAttribute('placeholder'),'搜索能力或 Skill');
 assert.equal(h.calls[0].query.path,undefined);
 for(const button of picks)button.click();
 assert.equal(h.state.native_context.capability.id,'skill');
 assert.deepEqual(h.state.native_context.refs.map(r=>r.id),['README.md']);
 assert.equal(h.calls.length,1,'selecting a capability does not reload the catalog');
});
test('@ remains ordinary input and does not open the picker',async()=>{
 const h=setup(),input=h.document.getElementById('chatInput'),picker=h.document.querySelector('.chat-capability-menu');
 await h.startLoad();
 input.value='@';input.dispatchEvent(new h.window.Event('input',{bubbles:true}));
 assert.equal(Boolean(picker.open),false);
 assert.equal(h.state.draft,'');
 assert.equal(h.calls.length,1);
});
test('native rendering is read-only and identical in-flight catalog requests are shared',async()=>{
 const h=setup();await h.startLoad();const count=h.calls.length;
 for(let i=0;i<100;i++)h.surface.render();
 const a=h.surface.refresh(false),b=h.surface.refresh();
 assert.equal(a,b);assert.equal(h.calls.length,count);
 h.calls.at(-1).resolve(h.result('latest'));await a;
 assert.match(h.document.querySelector('.chat-native-identity').textContent,/latest/);
 for(let i=0;i<10;i++)h.surface.render();assert.equal(h.calls.length,count);
});
test('task identity stays in the detail host while organize remains a Composer capability',async()=>{
 const h=setup();await h.startLoad();
 assert.equal(h.document.querySelector('.chat-native-tabs,.chat-native-task-list,.chat-task-filter-dialog'),null);
 assert.equal(h.calls[0].query.include_task_filters,undefined);
 assert.equal(h.calls[0].query.task_filters,undefined);
 h.calls[0].resolve(h.result('pending'));await tick();
 assert.ok(h.document.querySelector('[data-read]'));
 h.setOwner({id:'P1'},{id:'S2',status:'completed'});h.surface.render();
 assert.equal(h.document.querySelector('[data-convert]'),null);
 assert.equal(h.document.querySelector('.chat-native-identity').hidden,true);
 h.calls.at(-1).resolve(h.result('pending'));await tick();
});
test('owner changes and clearing scope reject obsolete catalog errors and results',async()=>{
 const h=setup();await h.startLoad();const old=h.calls.at(-1);
 h.setOwner({id:'P2'},{id:'S2',status:'completed'});h.surface.render();const next=h.calls.at(-1);
 assert.equal(next.query.project_id,'P2');
 old.reject(Error('old owner failure'));await tick();
 assert.doesNotMatch(h.document.querySelector('.chat-native-identity').textContent,/old owner failure/);
 h.setOwner(null,null);h.surface.render();next.resolve(h.result('stale owner'));await tick();
 assert.doesNotMatch(h.document.querySelector('.chat-native-identity').textContent,/stale owner/);
});
test('failed catalog allows retry and explicit refresh recovers without automatic retry loops',async()=>{
 const h=setup();await h.startLoad();h.calls.at(-1).reject(Error('offline'));await tick();
 assert.match(h.document.querySelector('.chat-native-identity').textContent,/待读取/);
 const count=h.calls.length;h.surface.render();assert.equal(h.calls.length,count);
 const pending=h.surface.refresh();h.calls.at(-1).resolve(h.result('recovered'));await pending;
 assert.match(h.document.querySelector('.chat-native-identity').textContent,/recovered/);
});

test('composer keeps context-only sending enabled after text is cleared and respects active turns',async()=>{
 const {createConversationComposer}=await import('../desktop/renderer/conversation-composer.mjs');
 const {document}=parseHTML('<textarea></textarea><button id="send"></button><button id="stop"></button><p></p>');
 const sendButton=document.getElementById('send');
 const composer=createConversationComposer({input:document.querySelector('textarea'),sendButton,stopButton:document.getElementById('stop'),hint:document.querySelector('p'),onInput(){},onSend(){},onStop(){}});
 composer.render({draft:'',hasContext:true});assert.equal(sendButton.disabled,false);
 composer.render({draft:'',hasContext:false});assert.equal(sendButton.disabled,true);
 composer.render({draft:'',hasContext:true,active:true});assert.equal(sendButton.disabled,true);
 composer.render({draft:'',hasContext:true,available:false});assert.equal(sendButton.disabled,true);
 composer.destroy();
});
