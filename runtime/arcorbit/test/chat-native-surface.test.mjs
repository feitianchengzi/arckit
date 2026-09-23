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
 const surface=createChatNativeSurface({api:{chatNativeCatalog(query){return new Promise((resolve,reject)=>calls.push({query,resolve,reject}))}},coordinator:{getState:()=>state},getProject:()=>project,getSession:()=>session,render(){},performAction:fn=>fn(),closeList(){}});
 const result=title=>({tasks:[{id:'T1',title,state:title}],task_list:[{id:'T1',title,state:title}],filter_members:[],filter_tags:[]});
 const startLoad=async()=>{surface.render();};
 return {document,window,surface,calls,result,startLoad,setOwner(p,s){project=p;session=s}};
}
test('native rendering is read-only and identical in-flight catalog requests are shared',async()=>{
 const h=setup();await h.startLoad();const count=h.calls.length;
 for(let i=0;i<100;i++)h.surface.render();
 const a=h.surface.refresh(false),b=h.surface.refresh();
 assert.equal(a,b);assert.equal(h.calls.length,count);
 h.calls.at(-1).resolve(h.result('latest'));await a;
 assert.match(h.document.querySelector('.chat-native-identity').textContent,/latest/);
 for(let i=0;i<10;i++)h.surface.render();assert.equal(h.calls.length,count);
});
test('sidebar keeps sessions only while native association/read controls remain',async()=>{
 const h=setup();await h.startLoad();
 assert.equal(h.document.querySelector('.chat-native-tabs,.chat-native-task-list,.chat-task-filter-dialog'),null);
 assert.equal(h.calls[0].query.include_task_filters,undefined);
 assert.equal(h.calls[0].query.task_filters,undefined);
 h.calls[0].resolve(h.result('pending'));await tick();
 assert.ok(h.document.querySelector('[data-read]'));
 h.setOwner({id:'P1'},{id:'S2',status:'completed'});h.surface.render();
 assert.ok(h.document.querySelector('[data-convert]'));
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
