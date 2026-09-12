import test from 'node:test';
import assert from 'node:assert/strict';
import { parseHTML } from 'linkedom';
import { createEngineeringSurface } from '../desktop/renderer/engineering-surface.mjs';

const tick = () => new Promise(resolve => setImmediate(resolve));
test('Engineering persists toggles and atomic replacement; Chat shortcut selects its own scene', async () => {
 const {document,window}=parseHTML('<body><textarea id="draft">保留草稿</textarea><button id="chat">技能</button><section id="root"></section></body>');
 const root=document.getElementById('root'),requests=[],navigation=[];
 const data={revision:1,errors:[],scenes:[{id:'chat',enabledCount:0},{id:'automation',enabledCount:2}],skills:[
 {id:'builtin:arckit-state-driven-loop',name:'arckit-state-driven-loop',description:'Loop',source:'builtin',path:'/official/entry',available:true,protected:true,enabled:{chat:false,automation:true}},
 {id:'builtin:spec',name:'spec',description:'Specifications',source:'builtin',path:'/official/spec',available:true,protected:false,enabled:{chat:false,automation:true}},
 {id:'local:custom',name:'custom',description:'User skill',source:'local',path:'/local/custom',available:true,protected:false,enabled:{chat:false,automation:false}}
 ]};
 const surface=createEngineeringSurface({root,chatButton:document.getElementById('chat'),navigate:page=>navigation.push(page),api:{engineeringSnapshot:async()=>structuredClone(data),engineeringUpdate:async input=>{
 requests.push(input);for(const change of input.changes||[])data.skills.find(x=>x.id===change.id).enabled[input.scene]=change.mode ? change.mode==='direct' : change.enabled;data.revision++;return structuredClone(data);
 }}});
 await surface.refresh();
 assert.equal(root.querySelector('[data-mode="builtin:arckit-state-driven-loop"]').disabled,true);
 const dialog=root.querySelector('dialog');dialog.showModal=()=>{dialog.open=true;};
 root.querySelector('[data-replace="builtin:spec"]').click();assert.equal(dialog.open,true);
 const select=root.querySelector('[data-role="replacement"]');Object.defineProperty(select,'value',{value:'local:custom'});
 dialog.returnValue='replace';dialog.dispatchEvent(new window.Event('close'));await tick();
 assert.deepEqual(requests[0],{scene:'automation',expectedRevision:1,changes:[{id:'builtin:spec',enabled:false},{id:'local:custom',enabled:true}]});
 document.getElementById('chat').click();await tick();
 assert.equal(surface.getScene(),'chat');assert.equal(navigation.at(-1),'engineering');
 assert.equal(root.querySelector('[data-mode="builtin:arckit-state-driven-loop"]').disabled,false);
 const toggle=root.querySelector('[data-mode="local:custom"]');Object.defineProperty(toggle,'value',{value:'direct'});toggle.dispatchEvent(new window.Event('change',{bubbles:true}));await tick();
 assert.equal(requests[1].scene,'chat');assert.equal(requests[1].expectedRevision,2);
 root.querySelector('[data-action="back"]').click();assert.equal(navigation.at(-1),'chat');assert.equal(document.getElementById('draft').value,'保留草稿');
});

test('missing selected skills remain switchable so users can recover configuration', async () => {
 const {document}=parseHTML('<section id="root"></section>'),root=document.getElementById('root');
 const surface=createEngineeringSurface({root,navigate(){},api:{engineeringSnapshot:async()=>({revision:1,errors:[],scenes:[],skills:[{id:'missing',name:'Missing',source:'local',path:'/gone',available:false,enabled:{automation:true,chat:false},error:'Gone'}]})}});
 await surface.refresh();assert.equal(root.querySelector('[data-mode="missing"]').disabled,false);assert.match(root.textContent,/Gone/);
});
