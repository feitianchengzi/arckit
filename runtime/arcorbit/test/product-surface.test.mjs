import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile,mkdtemp,mkdir,writeFile,rm } from 'node:fs/promises';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { parseHTML } from 'linkedom';
import * as protocol from '../../../definition/skills/arckit-product-assets/scripts/product-assets.mjs';
import { createProductCoordinator } from '../src/product-coordinator.mjs';
import { createProductSurface } from '../desktop/renderer/product-surface.mjs';
const wait=async(fn,label)=>{for(let i=0;i<300;i++){if(fn())return;await new Promise(r=>setTimeout(r,20));}throw new Error(`Timeout: ${label}`);};

test('real Product/Idea DOM and coordinator support folder intake, editing, Agent proposal, formal persistence and Today continuation',async t=>{
 const root=await mkdtemp(join(tmpdir(),'arcorbit-product-dom-'));
 const material=join(root,'demo');await mkdir(material);await writeFile(join(material,'README.md'),'Demo application');
 const {document,window}=parseHTML(await readFile(new URL('../desktop/renderer/index.html',import.meta.url),'utf8'));
 const storage=new Map();globalThis.document=document;globalThis.window=window;globalThis.localStorage={getItem:k=>storage.get(k),setItem:(k,v)=>storage.set(k,v),removeItem:k=>storage.delete(k)};
 globalThis.requestAnimationFrame=fn=>setTimeout(fn,0);globalThis.cancelAnimationFrame=clearTimeout;window.confirm=()=>true;
 window.HTMLElement.prototype.scrollTo=function({top}){this.scrollTop=top;};window.HTMLInputElement.prototype.setSelectionRange=()=>{};
 const platform={projects:[],organizations:[],active_workset:{id:'set',project_ids:[]},product_workspaces:[],errors:[]};const errors=[];
 const c=createProductCoordinator({dataDir:join(root,'app'),protocol,skillPath:join(root,'SKILL.md'),getPlatform:async()=>structuredClone(platform),getAccountScope:async()=> 'local:user',getSettings:async()=>({}),getCodexExecutable:()=> 'codex',executePlatform:async(_a,input)=>{const p={id:'p1',name:input.name,git_url:input.git_url};platform.projects.push(p);return p;},bindWorkspace:async(id,path)=>{platform.projects.find(p=>p.id===id).local_project_path=path;platform.active_workset.project_ids=[id];},
 createAdapter:()=>({async *runTurn({options}){await options.onThreadBound({threadId:'THREAD-IDEA'});yield{type:'codex.turn.started',turn_id:'TURN-IDEA'};const p=await options.dynamicToolProvider({tool:'product_context',arguments:{}});if(p.approved_digest)await options.dynamicToolProvider({tool:'product_execute',arguments:{approved_digest:p.approved_digest}});else await options.dynamicToolProvider({tool:'product_propose',arguments:{revision:p.record.revision,patch:{vision:'让创意持续推进'},reason:'用户说明'}});yield{type:'codex.item.completed',params:{item:{type:'agentMessage',id:'answer',text:'建议在左侧等你审阅'}}};yield{type:'codex.turn.completed',turn:{status:'completed'}};},async interrupt(){},close(){}})});t.after(async()=>{await c.close();await rm(root,{recursive:true,force:true});});
 const api={productSnapshot:i=>i?.refresh?c.refresh():c.snapshot(),productDetail:id=>c.detail(id),productCommand:(a,i)=>c.command(a,i),productChat:i=>c.chatAction(i),pickProductMaterial:i=>i?.id?c.chooseMaterial(i.id,material):c.command('create',{material_path:material}),onProductEvent:fn=>c.onEvent(fn),openWorkExternalLink:async()=>{}};
 const normalize=(s={})=>({sessions:[],projects:[],messages:[],draft:{project_id:'',text:''},selected_session_id:'',...s});
 const surface=createProductSurface({api,normalizeChatSnapshot:normalize,formatTime:x=>x,performAction:async fn=>{try{return await fn();}catch(e){errors.push(e.message);}},getPlatform:()=>platform,navigate:async page=>surface.show(page)});
 const $=s=>document.querySelector(s);const click=s=>{assert.ok($(s),`missing ${s}`);$(s).click();};const input=(s,v)=>{$(s).value=v;$(s).dispatchEvent(new window.Event('input',{bubbles:true}));};
 await surface.show('idea');click('#ideaListHost [data-product-action=new]');await wait(()=>!$('#ideaStart').classList.contains('hidden'),'start');click('#ideaFolder');
 await wait(()=>$('#ideaEditor [data-field=description]'),'editor');assert.match($('#ideaStatus').textContent,/录入未完成.*仅本机/);
 input('#ideaEditor [data-field=description]','管理创意同学的 Demo');click('#ideaEditor [data-product-action=save]');await wait(()=>$('#ideaEditor').textContent.includes('修订 1'),'saved');
 await wait(()=>!$('#ideaChatInput').disabled,'chat ready');input('#ideaChatInput','整理产品理念');click('#ideaChatSend');await wait(()=>$('.product-proposal'),'proposal');assert.equal($('#ideaEditor [data-field=vision]').value,'');
 click('#ideaEditor [data-product-action=accept]');await wait(()=>$('#ideaEditor [data-field=vision]').value==='让创意持续推进','accepted');
 input('#ideaEditor [data-field="plan.git_url"]','https://github.com/example/demo');click('#ideaEditor [data-product-action=plan]');await wait(()=>!$('#ideaEditor [data-product-action=approve]').disabled,'plan');
 click('#ideaEditor [data-product-action=approve-agent]');await wait(()=>$('#ideaStatus').textContent.includes('已录入'),'formal');
 assert.ok((await protocol.readRecord(material)).idea);assert.match($('#ideaTranscript').textContent,/建议在左侧/);
 click('#ideaEditor [data-product-action=detail]');await wait(()=>$('#productDetailHost [data-tab=relations]'),'detail');
 assert.match($('#productDetailHost').textContent,/尚未设置/);assert.doesNotMatch($('#productDetailHost').textContent,/迭代|发布/);
 await surface.show('idea');assert.match($('#ideaListHost').textContent,/已录入/);surface.renderToday();assert.ok($('#todayProductContinuity [data-resume]'));
 assert.deepEqual(errors,[]);
});
