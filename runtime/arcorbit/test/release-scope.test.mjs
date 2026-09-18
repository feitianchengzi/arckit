import test from 'node:test';
import assert from 'node:assert/strict';
import {parseHTML} from 'linkedom';
import {createReleaseSurface} from '../desktop/renderer/release-surface.mjs';

test('Release retains valid project and command drafts across scopes, ignores late details',async t=>{
 const {window,document}=parseHTML('<html><body><section id="releaseView"></section></body></html>');
 const prior=Object.fromEntries(['window','document','ResizeObserver','requestAnimationFrame','cancelAnimationFrame'].map(k=>[k,globalThis[k]]));
 Object.assign(globalThis,{window,document,ResizeObserver:class{observe(){}disconnect(){}},requestAnimationFrame:fn=>setTimeout(fn,0),cancelAnimationFrame:clearTimeout});
 window.HTMLElement.prototype.scrollTo=function({top}){this.scrollTop=top;};
 t.after(()=>Object.assign(globalThis,prior));
 const projects=[{id:'a',name:'A',path:'/a'},{id:'b',name:'B',path:'/b'}];let releaseLate;
 const detail=id=>({project:projects.find(p=>p.id===id),records:[],repository:null,scripts:{}});
 const pending=[];let slow=false;
 const surface=createReleaseSurface({api:{releaseSnapshot:async()=>({projects,records:[]}),releaseDetail:async id=>slow&&id==='a'?await new Promise(r=>releaseLate=()=>r(detail(id))):detail(id)},normalizeChatSnapshot:x=>x,formatTime:x=>x,performAction:fn=>{const p=fn();pending.push(p);return p;}});
 t.after(()=>surface.destroy());
 const show=async id=>{surface.show({active:true,projectId:id,workset:{id:'set',project_ids:['a','b']}});await Promise.all(pending.splice(0));};
 await show('a');const input=document.getElementById('releaseCommandInput');input.value='draft A';input.oninput({target:input});
 await show('all');assert.match(document.getElementById('releaseContext').textContent,/A/);assert.equal(document.getElementById('releaseCommandInput').value,'draft A');
 await show('b');await show('a');assert.equal(document.getElementById('releaseCommandInput').value,'draft A');
 slow=true;surface.show({active:true,projectId:'all',workset:{id:'other',project_ids:['a']}});await new Promise(r=>setTimeout(r,0));
 surface.show({active:true,projectId:'b',workset:{id:'set',project_ids:['a','b']}});await new Promise(r=>setTimeout(r,0));releaseLate();await Promise.all(pending.splice(0));
 assert.match(document.getElementById('releaseContext').textContent,/B/);
 surface.show({active:true,projectId:'all',workset:{id:'empty',project_ids:[]}});await Promise.all(pending.splice(0));assert.match(document.getElementById('releaseMain').textContent,/当前范围没有项目/);
});
