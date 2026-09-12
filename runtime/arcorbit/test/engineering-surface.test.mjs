import test from 'node:test';
import assert from 'node:assert/strict';
import { parseHTML } from 'linkedom';
import { createEngineeringSurface } from '../desktop/renderer/engineering-surface.mjs';

const tick = () => new Promise(resolve => setImmediate(resolve));
const scene = (id, managedCount, enabledCount, onDemandCount, disabledCount) => ({ id, managedCount, enabledCount, onDemandCount, disabledCount });

test('Engineering renders a dense built-in inventory and never projects user skills', async () => {
  const {document,window}=parseHTML('<body><textarea id="draft">保留草稿</textarea><button id="chat">Skills</button><section id="root"></section></body>');
  const root=document.getElementById('root'),requests=[],navigation=[];
  const data={revision:1,catalogVersion:'catalog-v1',errors:[],scenes:[scene('chat',2,1,1,0),scene('automation',2,2,0,0)],skills:[
    {id:'builtin:using-arckit',name:'using-arckit',description:'Loop',source:'builtin',path:'/official/entry',qualifiedName:'using-arckit',available:true,protected:true,modes:{chat:'on-demand',automation:'direct'},enabled:{chat:false,automation:true}},
    {id:'builtin:arckit-spec',name:'arckit-spec',description:'Specifications',source:'builtin',path:'/official/spec',qualifiedName:'arckit-spec',available:true,protected:false,modes:{chat:'direct',automation:'direct'},enabled:{chat:true,automation:true}},
    {id:'user:private',name:'private-user-skill',description:'Must stay outside ArcOrbit',source:'user',path:'/user/private',available:true,protected:false,modes:{chat:'direct',automation:'direct'},enabled:{chat:true,automation:true}}
  ]};
  const surface=createEngineeringSurface({root,chatButton:document.getElementById('chat'),navigate:page=>navigation.push(page),api:{engineeringSnapshot:async()=>structuredClone(data),engineeringUpdate:async input=>{
    requests.push(input);const item=data.skills.find(x=>x.id===input.changes?.[0]?.id);if(item){item.modes[input.scene]=input.changes[0].mode;item.enabled[input.scene]=input.changes[0].mode==='direct';}data.revision++;return structuredClone(data);
  }}});
  await surface.refresh();
  assert.match(root.textContent,/内置 Skills/);
  assert.equal(root.querySelectorAll('.engineering-summary article').length,4);
  assert.equal(root.querySelectorAll('[data-skill]').length,2);
  assert.equal(root.textContent.includes('private-user-skill'),false);
  assert.equal(root.querySelector('[data-action="import"]'),null);
  assert.equal(root.querySelector('[data-replace]'),null);
  assert.equal(root.querySelector('[data-role="source"]'),null);
  assert.equal(root.querySelector('[data-mode="builtin:using-arckit"]').disabled,true);

  const mode=root.querySelector('[data-mode="builtin:arckit-spec"]');
  Object.defineProperty(mode,'value',{value:'disabled'});mode.dispatchEvent(new window.Event('change',{bubbles:true}));await tick();
  assert.deepEqual(requests[0],{scene:'automation',expectedRevision:1,changes:[{id:'builtin:arckit-spec',mode:'disabled'}]});
  assert.match(root.textContent,/下一次 Automation 运行/);

  document.getElementById('chat').click();await tick();
  assert.equal(surface.getScene(),'chat');assert.equal(navigation.at(-1),'engineering');
  root.querySelector('[data-action="back"]').click();
  assert.equal(navigation.at(-1),'chat');assert.equal(document.getElementById('draft').value,'保留草稿');
});

test('Engineering search and status filters only the current built-in projection', async () => {
  const {document,window}=parseHTML('<section id="root"></section>'),root=document.getElementById('root');
  const data={revision:3,catalogVersion:'v3',errors:[],scenes:[scene('chat',2,1,0,1),scene('automation',2,1,0,1)],skills:[
    {id:'builtin:one',name:'one',description:'first',source:'builtin',path:'/one',available:true,modes:{chat:'direct',automation:'direct'},enabled:{chat:true,automation:true}},
    {id:'builtin:two',name:'two',description:'second',source:'builtin',path:'/two',available:true,modes:{chat:'disabled',automation:'disabled'},enabled:{chat:false,automation:false}}
  ]};
  const surface=createEngineeringSurface({root,navigate(){},api:{engineeringSnapshot:async()=>data,engineeringUpdate:async()=>data}});
  await surface.refresh();
  const search=root.querySelector('[data-role="search"]');Object.defineProperty(search,'value',{value:'two',writable:true});search.dispatchEvent(new window.Event('input',{bubbles:true}));
  assert.equal(root.querySelectorAll('[data-skill]').length,1);assert.match(root.textContent,/显示 1 \/ 2/);
  const status=root.querySelector('[data-role="status"]');Object.defineProperty(status,'value',{value:'direct',writable:true});status.dispatchEvent(new window.Event('change',{bubbles:true}));
  assert.equal(root.querySelectorAll('[data-skill]').length,0);assert.match(root.textContent,/没有匹配的内置 Skill/);
  root.querySelector('[data-action="clear-filters"]').click();
  assert.equal(search.value,'');assert.equal(status.value,'');assert.equal(root.querySelectorAll('[data-skill]').length,2);
});

test('Engineering keeps the last successful list when refresh fails', async () => {
  const {document}=parseHTML('<section id="root"></section>'),root=document.getElementById('root');let calls=0;
  const data={revision:1,catalogVersion:'v1',errors:[],scenes:[scene('chat',1,1,0,0),scene('automation',1,1,0,0)],skills:[{id:'builtin:one',name:'one',description:'first',source:'builtin',path:'/one',available:true,modes:{chat:'direct',automation:'direct'},enabled:{chat:true,automation:true}}]};
  const surface=createEngineeringSurface({root,navigate(){},api:{engineeringSnapshot:async()=>{if(calls++)throw new Error('catalog unavailable');return data;}}});
  await surface.refresh();await surface.refresh();
  assert.equal(root.querySelectorAll('[data-skill]').length,1);assert.match(root.textContent,/catalog unavailable/);
});
