import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile,mkdtemp,realpath,mkdir,writeFile,rm } from 'node:fs/promises';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { parseHTML } from 'linkedom';
import * as protocol from '../../../definition/skills/arckit-product-assets/scripts/product-assets.mjs';
import { createProductCoordinator } from '../src/product-coordinator.mjs';
import { runProductCommand } from '../src/product-git.mjs';
import { createProductSurface } from '../desktop/renderer/product-surface.mjs';
const wait=async(fn,label)=>{for(let i=0;i<300;i++){if(await fn())return;await new Promise(r=>setTimeout(r,20));}throw new Error(`Timeout: ${label}`);};
async function fixture(t,{failAgent=false}={}) {
 const root=await realpath(await mkdtemp(join(tmpdir(),'arcorbit-idea-dom-')));const material=join(root,'demo');await mkdir(material);await writeFile(join(material,'README.md'),'Design review app for creative teams');
 const url='https://github.com/example/demo';await runProductCommand('git',['init',material]);await runProductCommand('git',['-C',material,'remote','add','origin',url]);
 const {document,window}=parseHTML(await readFile(new URL('../desktop/renderer/index.html',import.meta.url),'utf8'));
 const storage=new Map();Object.assign(globalThis,{document,window,localStorage:{getItem:k=>storage.get(k),setItem:(k,v)=>storage.set(k,v),removeItem:k=>storage.delete(k)},requestAnimationFrame:fn=>setTimeout(fn,0),cancelAnimationFrame:clearTimeout});
 window.confirm=()=>true;window.HTMLElement.prototype.scrollTo=function({top}){this.scrollTop=top;};window.HTMLInputElement.prototype.setSelectionRange=()=>{};
 const platform={projects:[{id:'p1',name:'Design review',git_url:url}],organizations:[{id:'o1',name:'Design team'}],active_workset:{id:'set',project_ids:[]},errors:[]};const errors=[],turns=[],tools=[],contexts=[];
 const c=createProductCoordinator({runCommand:async(bin,args,options)=>{if(bin==='gh')throw new Error('No test GitHub account');return runProductCommand(bin,args,options);},dataDir:join(root,'app'),protocol,skillPath:join(root,'SKILL.md'),getPlatform:async()=>structuredClone(platform),getAccountScope:async()=> 'local:user',getSettings:async()=>({}),getCodexExecutable:()=> 'codex',assertCodexReady:async()=>{if(failAgent)throw new Error('请先配置 Codex');},executePlatform:async(_a,input)=>{const p={id:'p2',name:input.name,git_url:input.git_url};platform.projects.push(p);return p;},bindWorkspace:async(id,path)=>{platform.projects.find(p=>p.id===id).local_project_path=path;platform.active_workset.project_ids=[id];},
 createAdapter:()=>({async *runTurn({options,prompt}){
  turns.push(prompt);await options.onThreadBound({threadId:'THREAD-IDEA'});yield{type:'codex.turn.started',turn_id:'TURN-IDEA'};
  const call=async(tool,args={})=>{tools.push(tool);return options.dynamicToolProvider({tool,arguments:args});};
  const p=await call('product_context');contexts.push(p);
  if(p.approved_digest)await call('product_execute',{approved_digest:p.approved_digest});
  else {
   let description=p.record.description;
   if(p.material_path){const list=await call('product_materials');assert.ok(list.files.includes('README.md'));description=(await call('product_materials',{path:'README.md'})).content;}
   const env=await call('product_environment');const repoKey=v=>(v||'').replace(/^https:\/\/github\.com\/|^git@github\.com:/,'').replace(/\.git$/,'');if(p.material_path)assert.equal(repoKey(env.git.origin),repoKey(url));const project=p.candidates.projects.find(r=>repoKey(r.git_url)===repoKey(env.git.origin));
   await call('product_propose',{revision:p.record.revision,patch:{description},plan:project?{mode:'existing',project_id:project.id,repository:'none',directory:'material'}:{mode:'create',name:p.name,organization_id:'',repository:'existing',git_url:'',directory:'managed'},reason:project?'从 README 和真实 origin 识别已有项目':'按你的描述整理，还需要仓库选择'});
  }
  yield{type:'codex.item.completed',params:{item:{type:'agentMessage',id:'answer',text:'已准备可修改的方案，请在左侧核对。'}}};yield{type:'codex.turn.completed',turn:{status:'completed'}};
 },async interrupt(){},close(){}})});
 const api={productSnapshot:i=>i?.refresh?c.refresh():c.snapshot(),productDetail:id=>c.detail(id),productCommand:(a,i)=>c.command(a,i),productChat:i=>c.chatAction(i),pickProductMaterial:i=>i?.id?c.chooseMaterial(i.id,material):c.command('create',{material_path:material}),onProductEvent:fn=>c.onEvent(fn),openWorkExternalLink:async()=>{}};
 const surface=createProductSurface({api,normalizeChatSnapshot:s=>({sessions:[],projects:[],messages:[],draft:{project_id:'',text:''},selected_session_id:'',...s}),formatTime:x=>x,performAction:async fn=>{try{return await fn();}catch(e){errors.push(e.message);}},getPlatform:()=>platform,navigate:async page=>surface.show(page)});
 const $=s=>document.querySelector(s);const click=s=>{assert.ok($(s),`missing ${s}`);assert.ok(!$(s).disabled,`disabled ${s}`);$(s).click();};const input=(s,v)=>{$(s).value=v;$(s).dispatchEvent(new window.Event('input',{bubbles:true}));};
 t.after(async()=>{await new Promise(r=>setTimeout(r,180));await c.close();await rm(root,{recursive:true,force:true});});
 await surface.show('idea');click('#ideaListHost [data-product-action=new]');await wait(()=>!$('#ideaStart').classList.contains('hidden'),'start');
 return {c,api,surface,root,material,platform,errors,turns,tools,contexts,$,click,input};
}
test('folder selection actively reads real materials and Git candidates; edited proposal is confirmed without prompting or manual repository entry',async t=>{
 const f=await fixture(t);const {$,click,input,c,surface,turns,tools,material}=f;
 click('#ideaFolder');await wait(()=>$('#ideaEditor [data-product-action=review-save]')&&!$('#ideaEditor [data-product-action=review-save]').disabled,'editable proposal').catch(e=>{e.message+=' '+$('#ideaEditor').textContent+' '+$('#ideaChatError').textContent;throw e;});
 assert.equal(turns.length,1);assert.ok(tools.includes('product_environment'));assert.equal($('#ideaEditor [data-field=description]').value,'Design review app for creative teams');assert.equal($('#ideaEditor [data-field="plan.project_id"]').value,'p1');
 assert.equal($('#ideaEditor [data-disclosure=advanced]').open,false);assert.match($('#ideaStatus').textContent,/仅本机/);
 input('#ideaEditor [data-field=description]','Human adjusted purpose');click('#ideaEditor [data-product-action=review-save]');await wait(()=>$('#ideaEditor [data-product-action=approve-agent]'),'reviewed');
 const p=(await c.snapshot()).ideas[0];assert.equal(p.record.description,'Human adjusted purpose');assert.equal(p.plan.project_id,'p1');
 await surface.show('idea');click('#ideaListHost [data-open]');await new Promise(r=>setTimeout(r,100));assert.equal(turns.length,1,'reopening must not restart analysis');
 click('#ideaEditor [data-product-action=approve-agent]');assert.ok($('.idea-confirmation'));assert.doesNotMatch($('.idea-confirmation').textContent,/project_id|github_owner/);
 click('#ideaEditor [data-product-action=confirm-agent]');await wait(()=>$('#ideaStatus').textContent.includes('已录入'),'formal');assert.equal((await protocol.readRecord(material)).description,'Human adjusted purpose');
 assert.match($('#ideaTranscript').textContent,/通过界面保存/);assert.equal(turns.length,2);click('#ideaEditor [data-product-action=detail]');await wait(()=>$('#productDetailHost [data-tab=relations]'),'product detail');
 assert.deepEqual(f.errors,[]);
});
test('blank Idea guides a description, keeps incomplete proposals editable and never asks for long product definition',async t=>{
 const f=await fixture(t);const {$,click,input,c,turns}=f;click('#ideaBlank');await wait(()=>$('#ideaEditor [data-field=description]'),'blank editor');assert.equal(turns.length,0);
 input('#ideaEditor [data-field=description]','A tool for my design team');click('#ideaEditor [data-product-action=prepare]');await wait(()=>$('#ideaEditor [data-product-action=review-save]')&&!$('#ideaEditor [data-product-action=review-save]').disabled,'partial proposal');
 click('#ideaEditor [data-product-action=review-save]');await wait(()=>$('#ideaEditor [data-product-action=focus-missing]'),'saved incomplete plan');assert.ok($('#ideaEditor [data-product-action=focus-missing]'));assert.equal($('#ideaEditor [data-product-action=approve-agent]'),null);
 const p=(await c.snapshot()).ideas[0];assert.equal(p.record.description,'A tool for my design team');assert.equal(p.record.vision,'');assert.equal(p.kind,'temporary');assert.deepEqual(f.errors,[]);
});
test('Agent setup failure preserves local draft, exposes recovery and allows direct intake configuration',async t=>{
 const f=await fixture(t,{failAgent:true});const {$,click}=f;click('#ideaFolder');await wait(()=>$('#ideaEditor').textContent.includes('Agent 暂时不可用'),'failed Agent');
 assert.match($('#ideaStatus').textContent,/仅本机/);assert.ok($('#ideaEditor [data-product-action=setup]'));click('#ideaEditor [data-product-action=manual]');assert.ok($('#ideaEditor [data-field="plan.git_url"]'));assert.equal((await f.c.snapshot()).ideas.length,1);
});
test('late Agent proposal cannot overwrite active human edits; keeping edits and sending a message updates shared facts',async t=>{
 const f=await fixture(t);const {$,click,input,c}=f;click('#ideaFolder');await wait(()=>$('#ideaEditor [data-product-action=review-save]')&&!$('#ideaEditor [data-product-action=review-save]').disabled,'proposal');
 input('#ideaEditor [data-field=description]','Keep my edit');const p=(await c.snapshot()).ideas[0];
 await c.tool(p.id,{tool:'product_propose',arguments:{revision:p.record.revision,patch:{description:'Later Agent suggestion'},plan:p.proposal.plan,reason:'Additional material'}});
 await wait(()=>$('#ideaEditor [data-product-action=keep-edits]'),'new suggestion notification');assert.equal($('#ideaEditor [data-field=description]').value,'Keep my edit');
 click('#ideaEditor [data-product-action=keep-edits]');await wait(()=>$('#ideaEditor [data-product-action=approve-agent]')&&!$('#ideaEditor [data-product-action=keep-edits]'),'saved human edit');assert.equal((await c.detail(p.id)).record.description,'Keep my edit');
 input('#ideaEditor [data-field=description]','Saved before sending');input('#ideaChatInput','请按我修改的说明继续整理');click('#ideaChatSend');await wait(()=>f.contexts.length===2,'second turn context').catch(e=>{e.message+=' '+JSON.stringify(f.errors);throw e;});assert.equal(f.contexts[1].record.description,'Saved before sending');
 assert.deepEqual(f.errors,[]);
});

test('late preparation from Idea A cannot replace Idea B conversation or later message ownership',async t=>{
 const f=await fixture(t);const {$,click,input,c,api,surface}=f;
 let release,started=false;const gate=new Promise(r=>release=r),original=api.productChat;
 api.productChat=async i=>{const result=await original(i);if(i.action==='prepare'){started=true;await gate;}return result;};
 click('#ideaFolder');await wait(()=>started,'A preparing');const b=await c.command('create',{name:'Idea B'});
 await surface.show('idea');click(`#ideaListHost [data-open="${b.id}"]`);await wait(()=>$('#ideaTitle').textContent==='Idea B','B selected');release();await new Promise(r=>setTimeout(r,180));
 assert.equal($('#ideaTitle').textContent,'Idea B');assert.doesNotMatch($('#ideaTranscript').textContent,/识别这个应用及已有 Git 仓库/);
 input('#ideaEditor [data-field=description]','B description');input('#ideaChatInput','Only discuss B');click('#ideaChatSend');await wait(()=>f.contexts.some(p=>p.id===b.id),'B context');
 assert.equal(f.contexts.at(-1).id,b.id);assert.equal(f.contexts.at(-1).record.description,'B description');assert.deepEqual(f.errors,[]);
});

test('late save stays on its original Idea and typing during a save is retained',async t=>{
 const f=await fixture(t);const {$,click,input,c,api,surface}=f;click('#ideaFolder');await wait(()=>$('#ideaEditor [data-product-action=review-save]')&&!$('#ideaEditor [data-product-action=review-save]').disabled,'A suggestion');
 const a=(await c.snapshot()).ideas[0];let release,started=false;const gate=new Promise(r=>release=r),original=api.productCommand;
 api.productCommand=async(action,i)=>{const result=await original(action,i);if(action==='review'){started=true;await gate;}return result;};
 input('#ideaEditor [data-field=description]','First saved value');click('#ideaEditor [data-product-action=review-save]');await wait(()=>started,'save held');
 input('#ideaEditor [data-field=description]','Typed while saving');release();await wait(()=>$('#ideaEditor [data-product-action=review-save]')&&!$('#ideaEditor').textContent.includes('基础资料已更新'),'new input preserved');
 assert.equal($('#ideaEditor [data-field=description]').value,'Typed while saving');assert.equal((await c.detail(a.id)).record.description,'First saved value');
 // Hold a second response, switch objects, then let the original result return.
 let release2,started2=false;const gate2=new Promise(r=>release2=r);
 api.productCommand=async(action,i)=>{const result=await original(action,i);if(action==='review'){started2=true;await gate2;}return result;};
 click('#ideaEditor [data-product-action=review-save]');await wait(()=>started2,'second save held');const b=await c.command('create',{name:'Other Idea'});await surface.show('idea');click(`#ideaListHost [data-open="${b.id}"]`);await wait(()=>$('#ideaTitle').textContent==='Other Idea','other selected');release2();await new Promise(r=>setTimeout(r,150));
 assert.equal($('#ideaTitle').textContent,'Other Idea');assert.equal((await c.detail(a.id)).record.description,'Typed while saving');assert.deepEqual(f.errors,[]);
});

test('a blank Idea exposes actual environment diagnostics before a proposal exists and keeps its editable description',async t=>{
 const f=await fixture(t);const {$,click,input}=f;click('#ideaBlank');await wait(()=>$('#ideaEditor [data-field=description]'),'blank editor');
 input('#ideaEditor [data-field=description]','Keep this idea');click('#ideaEditor [data-product-action=environment]');
 await wait(()=>$('#ideaEditor [data-disclosure=diagnostics]'),'diagnostics');
 assert.match($('#ideaEditor [data-disclosure=diagnostics]').textContent,/github.user|gh/);
 assert.doesNotMatch($('#ideaEditor').textContent,/完成 gh 登录后重试/);assert.equal($('#ideaEditor [data-field=description]').value,'Keep this idea');
});

test('a selected formal directory and human edits reach the same-turn Agent context with labels, effects and actual path',async t=>{
 const f=await fixture(t);const {$,click,input,c,api,root}=f;click('#ideaFolder');await wait(()=>$('#ideaEditor [data-product-action=review-save]')&&!$('#ideaEditor [data-product-action=review-save]').disabled,'proposal');
 const target=join(root,'developer');await mkdir(target);api.pickProductWorkspace=async i=>c.chooseWorkspace(i.id,target);
 // Exercise the same native picker action without depending on Linkedom select.value setters.
 const select=$('#ideaEditor [data-field="plan.directory"]');Object.defineProperty(select,'value',{value:'selected',configurable:true});select.dispatchEvent(new window.Event('input',{bubbles:true}));
 await wait(()=>$('#ideaEditor [data-product-action=workspace]'),'directory picker');click('#ideaEditor [data-product-action=workspace]');await wait(()=>$('#ideaEditor').textContent.includes(target),'chosen directory');
 input('#ideaChatInput','正式工作目录现在选择的合适吗？');click('#ideaChatSend');await wait(()=>f.contexts.length===2,'Agent context');const ctx=f.contexts[1];
 assert.equal(ctx.plan.workspace_path,target);assert.equal(ctx.interaction.fields['plan.directory'].selected_label,'选择其他工作目录');assert.equal(ctx.interaction.fields['plan.directory'].actual_path,target);assert.match(ctx.interaction.material_action,/复制材料.*保留来源/);assert.ok(f.turns[1].includes('interaction'));assert.deepEqual(f.errors,[]);
});
