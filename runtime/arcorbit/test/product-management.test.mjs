import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp,realpath,mkdir,readFile,writeFile,rm,symlink } from 'node:fs/promises';
import { join, win32, posix } from 'node:path';
import { workspaceContains } from '../src/product-workspace.mjs';
import { tmpdir } from 'node:os';
import * as protocol from '../../../definition/skills/arckit-product-assets/scripts/product-assets.mjs';
import { createProductCoordinator } from '../src/product-coordinator.mjs';
import { createProductGit,runProductCommand } from '../src/product-git.mjs';
const url='https://github.com/example/idea-demo';
async function fixture(t,extra={}) {
  const root=await realpath(await mkdtemp(join(tmpdir(),'arcorbit-product-')));
  const material=join(root,'source');await mkdir(material);await writeFile(join(material,'README.md'),'Demo for designers');
  let scope='server:user-a';let creates=0;
  const platform={projects:[],organizations:[{id:'o1',name:'Team'}],active_workset:{id:'set',project_ids:[]},errors:[]};
  const options={runCommand:async(bin,args,options)=>{if(bin==='gh')throw new Error('GitHub discovery unavailable in isolated test');return runProductCommand(bin,args,options);},dataDir:join(root,'app'),protocol,skillPath:join(root,'skill','SKILL.md'),getPlatform:async()=>structuredClone(platform),getAccountScope:async()=>scope,getSettings:async()=>({}),getCodexExecutable:()=>({command:'codex',pathEntries:[]}),
    executePlatform:async(_action,input)=>{creates++;const remote={id:`p${creates}`,name:input.name,git_url:input.git_url,organization_id:input.organization_id};platform.projects.push(remote);return remote;},
    bindWorkspace:async(id,path)=>{platform.projects.find(p=>p.id===id).local_project_path=path;platform.active_workset.project_ids.push(id);},...extra};
  const coordinator=createProductCoordinator(options);t.after(async()=>{await coordinator.close();await rm(root,{recursive:true,force:true});});
  return {root,material,platform,options,coordinator,creates:()=>creates,setScope:v=>{scope=v;}};
}
async function approve(c,id,plan) {
  const p=await c.detail(id);await c.command('plan',{id,revision:p.record.revision,plan});
  const fresh=await c.detail(id);return c.command('approve',{id,revision:fresh.record.revision,plan_digest:fresh.plan_digest});
}
const intakePlan=()=>({mode:'create',name:'Demo',organization_id:'',repository:'existing',git_url:url,directory:'material'});

test('temporary blank Idea persists locally; formal completion requires a GitHub repository and directory',async t=>{
 const f=await fixture(t);const c=f.coordinator;const p=await c.command('create');
 assert.equal(p.kind,'temporary');assert.equal(p.record.idea,null);assert.equal((await c.snapshot()).ideas.length,1);
 await assert.rejects(c.command('plan',{id:p.id,revision:0,plan:{...intakePlan(),repository:'none'}}),/GitHub/);
 await assert.rejects(approve(c,p.id,intakePlan()),/目录/);
 assert.equal(f.creates(),0);assert.equal((await c.snapshot()).ideas[0].kind,'temporary');
 const reopened=createProductCoordinator(f.options);t.after(()=>reopened.close());assert.equal((await reopened.snapshot()).ideas[0].id,p.id);
});

test('formal Idea moves to arckit/product and survives loss of the temporary store, recovered only from selected bound directories',async t=>{
 const f=await fixture(t);const c=f.coordinator;const p=await c.command('create',{material_path:f.material});
 await c.command('save',{id:p.id,revision:0,patch:{vision:'Make product work understandable'}});
 const a=await approve(c,p.id,intakePlan());const done=await c.command('execute',{id:p.id,approved_digest:a.approved_digest});
 assert.equal(done.kind,'formal');assert.equal(done.record.status,null);assert.equal(done.record.idea.id,p.id);
 assert.equal(f.creates(),1);assert.equal((await protocol.readRecord(f.material)).vision,'Make product work understandable');
 const store=JSON.parse(await readFile(join(f.root,'app','products.json'),'utf8'));assert.equal(store.ideas.length,0);assert.equal(Object.values(store.controls)[0].record,undefined);
 await c.close();await rm(join(f.root,'app','products.json'));
 const fresh=createProductCoordinator(f.options);t.after(()=>fresh.close());
 let restored=await fresh.refresh();assert.equal(restored.ideas.length,1);assert.equal(restored.ideas[0].id,p.id);assert.equal(restored.ideas[0].record.status,null);
 f.platform.active_workset.project_ids=[];restored=await fresh.refresh();assert.equal(restored.ideas.length,0);assert.equal(restored.records.length,1);
 f.platform.active_workset.project_ids=['p1'];f.platform.projects[0].local_project_path=join(f.root,'missing');restored=await fresh.refresh();assert.equal(restored.ideas.length,0);assert.ok(restored.errors.some(e=>e.project_id==='p1'));
});

test('manual edit invalidates Agent proposal and approval; malformed records and escaping material paths do not write',async t=>{
 const f=await fixture(t);const c=f.coordinator;const p=await c.command('create',{material_path:f.material});
 await c.tool(p.id,{tool:'product_propose',arguments:{revision:0,patch:{description:'Suggested'},reason:'Readme'}});
 const q=(await c.detail(p.id)).proposal;const a=await approve(c,p.id,intakePlan());
 await c.command('save',{id:p.id,revision:(await c.detail(p.id)).record.revision,patch:{description:'Human edit'}});
 await assert.rejects(c.command('accept',{id:p.id,proposal_id:q.id}),/过期/);
 await assert.rejects(c.command('execute',{id:p.id,approved_digest:a.approved_digest}),/确认/);
 assert.equal(f.creates(),0);await assert.rejects(c.materials(p.id,{path:'../outside'}),/路径/);
 await writeFile(join(f.root,'secret'),'secret');await symlink(join(f.root,'secret'),join(f.material,'link'));await assert.rejects(c.materials(p.id,{path:'link'}),/符号链接/);
 await writeFile(join(f.material,'.env'),'SECRET=example');await assert.rejects(c.materials(p.id,{path:'.env'}),/范围/);
 assert.deepEqual((await c.materials(p.id)).files,['README.md']);
 await assert.rejects(c.command('save',{id:p.id,revision:(await c.detail(p.id)).record.revision,patch:{status:'running'}}),/状态/);
 assert.equal((await c.detail(p.id)).record.description,'Human edit');
 f.setScope('server:user-b');assert.equal((await c.snapshot()).ideas.length,0);await assert.rejects(c.detail(p.id),/账号/);
});

test('lost create response remains uncertain across restart and is never blindly replayed',async t=>{
 let count=0;const f=await fixture(t,{executePlatform:async()=>{count++;throw new Error('connection reset after POST');}});const c=f.coordinator;
 const p=await c.command('create',{material_path:f.material});const a=await approve(c,p.id,intakePlan());
 await assert.rejects(c.command('execute',{id:p.id,approved_digest:a.approved_digest}),/待核对/);
 const fresh=createProductCoordinator(f.options);t.after(()=>fresh.close());const b=await approve(fresh,p.id,intakePlan());
 await assert.rejects(fresh.command('execute',{id:p.id,approved_digest:b.approved_digest}),/待核对/);assert.equal(count,1);
 assert.equal((await fresh.detail(p.id)).receipts.project.status,'uncertain');
});

test('protocol preserves corrupt and foreign files, rejects stale revisions and symlink parents',async t=>{
 const root=await mkdtemp(join(tmpdir(),'product-protocol-'));t.after(()=>rm(root,{recursive:true,force:true}));
 let record=protocol.emptyRecord();await protocol.writeRecord(root,record,null);
 await assert.rejects(protocol.writeRecord(root,protocol.reviseRecord(record,{status:'active'},0),5),/已变化/);
 record=await protocol.writeRecord(root,protocol.reviseRecord(record,{status:'paused'},0),0);assert.equal(record.status,'paused');
 await assert.rejects(protocol.writeRecord(root,protocol.emptyRecord(),1),/另一个产品/);
 const path=join(root,protocol.RECORD_PATH);await writeFile(path,'{"schema_version":"unknown"}');await assert.rejects(protocol.readRecord(root),/协议/);
 assert.match(await readFile(path,'utf8'),/unknown/);
 const other=join(root,'other');await mkdir(other);const escaped=join(root,'escaped');await mkdir(escaped);await symlink(other,join(escaped,'arckit'));await assert.rejects(protocol.writeRecord(escaped,protocol.emptyRecord(),null),/符号链接/);
});

test('two independent Git caches share exact records and reject concurrent publication without touching developer index or files',async t=>{
 const root=await mkdtemp(join(tmpdir(),'product-git-'));t.after(()=>rm(root,{recursive:true,force:true}));
 const remote=join(root,'remote.git');await runProductCommand('git',['init','--bare',remote]);
 const run=(bin,args,opts={})=>runProductCommand(bin,args,{...opts,env:{...process.env,...opts.env,GIT_AUTHOR_NAME:'Product Test',GIT_AUTHOR_EMAIL:'test@example.invalid',GIT_COMMITTER_NAME:'Product Test',GIT_COMMITTER_EMAIL:'test@example.invalid'}});
 const git=createProductGit({protocol,run,allowLocalRemote:true});const a=join(root,'a.git'),b=join(root,'b.git');
 let record=protocol.emptyRecord();record={...record,idea:{id:record.product_id,name:'Demo',created_at:new Date().toISOString(),recorded_at:new Date().toISOString()}};
 const first=await git.publish(a,remote,record,'');assert.ok(first.sha);
 const other=await git.read(b,remote);assert.deepEqual(other.record,record);
 const next=protocol.reviseRecord(record,{vision:'A changed'},0);const accepted=await git.publish(a,remote,next,first.sha);
 const conflict=await git.publish(b,remote,protocol.reviseRecord(record,{vision:'B changed'},0),first.sha);assert.equal(conflict.conflict,true);assert.equal(conflict.remote.sha,accepted.sha);
 const checkout=join(root,'checkout');await run('git',['clone','--branch','arcorbit/product',remote,checkout]);
 await writeFile(join(checkout,'code.txt'),'staged original');await run('git',['-C',checkout,'add','code.txt']);await writeFile(join(checkout,'code.txt'),'unstaged later');
 const status=await run('git',['-C',checkout,'status','--porcelain']);const index=await readFile(join(checkout,'.git','index'));
 await git.publish(a,remote,protocol.reviseRecord(next,{audience:'Designers'},1),accepted.sha);
 assert.equal(await run('git',['-C',checkout,'status','--porcelain']),status);assert.deepEqual(await readFile(join(checkout,'.git','index')),index);assert.equal(await readFile(join(checkout,'code.txt'),'utf8'),'unstaged later');
 assert.equal((await protocol.readRecord(checkout)).idea.name,'Demo');
});

test('scene Chat persists thread in private cwd, includes exact user request and uses real product proposal tool',async t=>{
 const calls=[];const f=await fixture(t,{createAdapter:()=>({async *runTurn(call){calls.push(call);await call.options.onThreadBound({threadId:'thread-idea'});yield {type:'codex.turn.started',turn_id:'turn-1'};
 const ctx=await call.options.dynamicToolProvider({tool:'product_context',arguments:{}});await call.options.dynamicToolProvider({tool:'product_propose',arguments:{revision:ctx.record.revision,patch:{vision:'Agent proposal'},reason:'User input'}});
 yield {type:'codex.item.completed',params:{item:{id:'tool-1',type:'dynamicToolCall',tool:'product_propose',arguments:{revision:0},contentItems:[{type:'inputText',text:'proposal saved'}],success:true}}};
 yield {type:'codex.item.completed',params:{item:{id:'answer',type:'agentMessage',text:'请查看左侧建议'}}};yield {type:'codex.turn.completed',turn:{status:'completed'}};},async interrupt(){},close(){}})});
 const c=f.coordinator,p=await c.command('create');let chat=await c.chatAction({id:p.id,action:'send',text:'请整理一个面向设计师的产品',client_request_id:'request-1'});
 for(let i=0;i<50;i++){chat=await c.chatAction({id:p.id,action:'snapshot'});if(chat.sessions[0]?.status==='completed')break;await new Promise(r=>setTimeout(r,10));}
 assert.equal(chat.sessions[0].status,'completed');assert.match(calls[0].prompt,/请整理一个面向设计师的产品/);assert.equal(calls[0].projectRoot,p.workspace);assert.match(chat.messages.find(m=>m.kind==='tool').content,/proposal saved/);assert.equal((await c.detail(p.id)).proposal.patch.vision,'Agent proposal');assert.equal((await c.detail(p.id)).record.vision,'');
 await c.close();const fresh=createProductCoordinator(f.options);t.after(()=>fresh.close());await fresh.chatAction({id:p.id,action:'send',session_id:chat.selected_session_id,text:'继续',client_request_id:'request-2'});
 for(let i=0;i<50&&calls.length<2;i++)await new Promise(r=>setTimeout(r,10));assert.equal(calls[1].options.threadId,'thread-idea');await fresh.close();
});

test('blank Idea can create a private GitHub repository and user-selected checkout with authenticated bounded commands',async t=>{
 const calls=[];let f;
 const run=async(bin,args,options)=>{
  calls.push([bin,...args]);
  if(bin==='gh') {if(args[0]==='repo'&&args[1]==='view')return JSON.stringify({url,nameWithOwner:'example/idea-demo'});return '';}
  if(args[0]==='clone') {const dest=args.at(-1);await runProductCommand('git',['init',dest]);await runProductCommand('git',['-C',dest,'remote','add','origin',url]);return '';}
  return runProductCommand(bin,args,options);
 };
 f=await fixture(t,{runCommand:run});const c=f.coordinator;const p=await c.command('create');
 const destination=join(f.root,'my-development-folder');await mkdir(destination);await c.chooseWorkspace(p.id,destination);
 const approved=await approve(c,p.id,{...intakePlan(),repository:'create',github_owner:'example',github_name:'idea-demo',directory:'selected',workspace_path:destination});
 const result=await c.tool(p.id,{tool:'product_execute',arguments:{approved_digest:approved.approved_digest}});
 assert.equal(result.kind,'formal');assert.equal(result.material_path,destination);assert.ok((await protocol.readRecord(result.material_path)).idea);
 assert.deepEqual(calls.find(x=>x[0]==='gh'&&x[2]==='create'),['gh','repo','create','example/idea-demo','--private']);assert.equal(f.creates(),1);
 await c.refresh();assert.equal((await c.snapshot()).ideas[0].id,p.id);
});

test('Product-only assets persist to bound directory and shared Idea adoption restores canonical id from Git',async t=>{
 const f=await fixture(t,{git:{read:async()=>({sha:'remote-commit',record:shared}),publish:async()=>{throw new Error('unused');}}});
 let shared=protocol.emptyRecord();shared={...shared,revision:4,vision:'From team',idea:{id:shared.product_id,name:'Shared Idea',created_at:new Date().toISOString(),recorded_at:new Date().toISOString()}};
 f.platform.projects.push({id:'p1',name:'Team Product',git_url:url,local_project_path:f.material});f.platform.active_workset.project_ids=['p1'];
 const c=f.coordinator;await c.refresh();const p=await c.command('attach',{project_id:'p1'});
 const adopted=await c.command('sync',{id:p.id,action:'read'});assert.equal(adopted.id,shared.product_id);assert.equal(adopted.kind,'formal');assert.deepEqual(await protocol.readRecord(f.material),shared);
 await c.refresh();assert.equal((await c.snapshot()).ideas[0].id,shared.product_id);
 const external=protocol.reviseRecord(shared,{description:'Edited by a repo tool'},4);await protocol.writeRecord(f.material,external,4);
 await c.refresh();assert.equal((await c.detail(shared.product_id)).sync.status,'local');
});

test('successful intake receipt only replays identical parameters and changed plans require explicit reconciliation',async t=>{
 let fail=true;const f=await fixture(t,{runCommand:async(bin,args,options)=>{if(fail&&args[0]==='init')throw new Error('目录暂不可用');return runProductCommand(bin,args,options);}});const c=f.coordinator;const p=await c.command('create',{material_path:f.material});const first=await approve(c,p.id,intakePlan());
 await assert.rejects(c.command('execute',{id:p.id,approved_digest:first.approved_digest}),/目录/);assert.equal(f.creates(),1);
 await assert.rejects(c.command('execute',{id:p.id,approved_digest:first.approved_digest}),/目录/);assert.equal(f.creates(),1);
 fail=false;
 const changed=await approve(c,p.id,{...intakePlan(),name:'Different product',git_url:'https://github.com/example/other'});
 await assert.rejects(c.command('execute',{id:p.id,approved_digest:changed.approved_digest}),/参数不一致/);assert.equal(f.creates(),1);
 assert.equal((await c.detail(p.id)).kind,'temporary');assert.equal(await protocol.readRecord(f.material),null);
 // The existing resource is preserved, and the human can explicitly select it.
 const associated=await approve(c,p.id,{mode:'existing',project_id:'p1',repository:'none',directory:'material',name:'ignored stale name',git_url:'https://github.com/example/other'});
 assert.equal(associated.plan.name,'');assert.equal(associated.plan.git_url,'');
 const completed=await c.command('execute',{id:p.id,approved_digest:associated.approved_digest});
 assert.equal(completed.name,'Demo');assert.equal(completed.sync.url,url);assert.equal(f.creates(),1);assert.ok((await protocol.readRecord(f.material)).idea);
});

test('unfinished Idea cannot sync or write project assets; publication requires the current formal directory record',async t=>{
 let reads=0,writes=0;const f=await fixture(t,{git:{read:async()=>{reads++;return {sha:'',record:null};},publish:async()=>{writes++;return {sha:'test'};}}});
 const c=f.coordinator;f.platform.projects.push({id:'existing',name:'Existing',git_url:url});
 let p=await c.command('create',{material_path:f.material});await c.command('attach',{id:p.id,project_id:'existing'});p=await c.detail(p.id);
 for(const action of ['read','publish'])await assert.rejects(c.command('sync',{id:p.id,action,revision:p.record.revision,digest:p.record_digest}),/录入未完成/);
 await assert.rejects(c.command('writeLocal',{id:p.id,revision:0}),/录入未完成/);
 assert.equal(await protocol.readRecord(f.material),null);assert.equal(reads,0);assert.equal(writes,0);
 const a=await approve(c,p.id,{mode:'existing',project_id:'existing',repository:'none',directory:'material'});await c.command('execute',{id:p.id,approved_digest:a.approved_digest});p=await c.detail(p.id);
 await c.command('sync',{id:p.id,action:'publish',revision:p.record.revision,digest:p.record_digest});assert.equal(writes,1);
 await protocol.writeRecord(f.material,protocol.reviseRecord(p.record,{vision:'External update'},p.record.revision),p.record.revision);
 await assert.rejects(c.command('sync',{id:p.id,action:'publish',revision:p.record.revision,digest:p.record_digest}),/已变化/);assert.equal(writes,1);
});

test('Agent receives accessible candidates, bounded GitHub discovery and native image content without secrets',async t=>{
 const commands=[];const f=await fixture(t,{runCommand:async(bin,args)=>{commands.push([bin,args]);if(bin==='git')throw new Error('not a repo');if(args[1]==='user')return JSON.stringify({login:'designer',token:'must-not-return'});return JSON.stringify([{login:'design-team',credential:'private'}]);}});
 const c=f.coordinator,p=await c.command('create',{material_path:f.material});f.platform.projects.push({id:'p1',name:'Demo',git_url:url});
 const context=await c.tool(p.id,{tool:'product_context',arguments:{}});assert.equal(context.candidates.projects[0].id,'p1');assert.equal(context.candidates.organizations[0].id,'o1');
 const env=await c.tool(p.id,{tool:'product_environment',arguments:{github:true}});assert.equal(env.github.login,'designer');assert.deepEqual(env.github.owners.map(o=>o.login),['designer','design-team']);assert.doesNotMatch(JSON.stringify(env),/must-not-return|credential/);assert.ok(commands.every(([bin,args])=>bin!=='gh'||args[0]==='api'));
 const png=Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+jB9sAAAAASUVORK5CYII=','base64');await writeFile(join(f.material,'screen.png'),png);
 const image=await c.tool(p.id,{tool:'product_materials',arguments:{path:'screen.png'}});assert.equal(image.contentItems[1].type,'inputImage');assert.match(image.contentItems[1].imageUrl,/^data:image\/png;base64,/);
 await writeFile(join(f.material,'draft.fig'),'design');await assert.rejects(c.materials(p.id,{path:'draft.fig'}),/导出图/);
});
test('partial proposals can be edited atomically, while later material and plan edits invalidate old suggestions and confirmations',async t=>{
 const f=await fixture(t);const c=f.coordinator,p=await c.command('create',{material_path:f.material});
 await c.tool(p.id,{tool:'product_propose',arguments:{revision:0,patch:{description:'Agent description'},plan:{...intakePlan(),git_url:''},reason:'Need repository'}});let d=await c.detail(p.id);
 const saved=await c.command('review',{id:p.id,revision:0,proposal_id:d.proposal.id,name:'Human name',patch:{description:'Human description'},plan:d.proposal.plan});assert.equal(saved.record.description,'Human description');assert.equal(saved.name,'Human name');assert.equal(saved.plan.git_url,'');
 await assert.rejects(c.command('approve',{id:p.id,revision:saved.record.revision,plan_digest:(await c.detail(p.id)).plan_digest}),/GitHub/);
 await c.tool(p.id,{tool:'product_propose',arguments:{revision:saved.record.revision,patch:{description:'Late'},reason:'old source'}});d=await c.detail(p.id);
 await c.chooseMaterial(p.id,f.material);await assert.rejects(c.command('review',{id:p.id,revision:d.record.revision,proposal_id:d.proposal.id,patch:d.proposal.patch,plan:d.plan}),/已变化/);
 assert.equal((await c.detail(p.id)).record.description,'Human description');
});
test('prepare starts once for a material selection, survives reopening, and refreshes the same scene after explicit retry',async t=>{
 let turns=0;const f=await fixture(t,{createAdapter:()=>({async *runTurn({options}){turns++;await options.onThreadBound({threadId:'SAME-THREAD'});yield {type:'codex.turn.started',turn_id:'TURN'};yield {type:'codex.turn.completed',turn:{status:'completed'}};},close(){},async interrupt(){}})});
 const c=f.coordinator,p=await c.command('create',{material_path:f.material});await Promise.all([c.chatAction({id:p.id,action:'prepare',automatic:true}),c.chatAction({id:p.id,action:'prepare',automatic:true})]);
 for(let i=0;i<50;i++){if((await c.chatAction({id:p.id,action:'snapshot'})).sessions[0]?.status==='completed')break;await new Promise(r=>setTimeout(r,10));}
 await c.chatAction({id:p.id,action:'prepare',automatic:true});assert.equal(turns,1);
 await c.chatAction({id:p.id,action:'prepare'});assert.equal(turns,2);assert.equal((await c.chatAction({id:p.id,action:'snapshot'})).sessions.length,1);
});

test('Idea leaves exploration to its existing Agent, shares CLI environment, and refreshes failed tool evidence without losing the thread',async t=>{
 let calls=0,turns=0;const seen=[];
 const f=await fixture(t,{runCommand:async(bin,args,options)=>{
   calls++;seen.push(options.env.PATH);
   if(bin==='git')return runProductCommand(bin,args,options);
   if(calls===1)throw Object.assign(new Error('spawn gh ENOENT'),{code:'ENOENT'});
   return args[1]==='user'?'{"login":"recovered"}':'[]';
 },createAdapter:()=>({async *runTurn({options,prompt}){
   turns++;assert.match(prompt,/允许使用 Codex 原生命令/);assert.doesNotMatch(prompt,/不得通过 shell.*访问材料目录/);
   assert.deepEqual(options.sandboxPolicy,{type:'readOnly',networkAccess:false});assert.ok(options.env.PATH.includes('/usr/local/bin'));
   if(turns===1)assert.equal(calls,0,'No hardcoded environment checks before the Agent');else assert.equal(options.threadId,'EXPLORATION-THREAD');
   await options.onThreadBound({threadId:'EXPLORATION-THREAD'});
   const call=(tool,args={})=>options.dynamicToolProvider({tool,arguments:args});
   const before=await call('product_context');assert.equal(before.command_environment.source,'arcorbit');
   if(turns===1){const failed=await call('product_environment',{github:true});assert.equal(failed.diagnostics[0].error_code,'ENOENT');}
   const fresh=await call('product_environment',{github:true});assert.equal(fresh.github.login,'recovered');assert.equal((await call('product_context')).environment.github.login,'recovered');
   assert.ok(seen.every(path=>path===options.env.PATH));
   yield {type:'codex.turn.completed',turn:{status:'completed'}};
 },close(){},async interrupt(){}})});
 const p=await f.coordinator.command('create');
 for(let n=0;n<2;n++){
  await f.coordinator.chatAction({id:p.id,action:'prepare'});
  for(let i=0;i<100;i++){const s=await f.coordinator.chatAction({id:p.id,action:'snapshot'});if(s.sessions[0]?.status==='completed')break;if(s.sessions[0]?.status==='failed')assert.fail(s.sessions[0].error);await new Promise(r=>setTimeout(r,10));}
 }
 assert.equal(turns,2);assert.equal((await f.coordinator.chatAction({id:p.id,action:'snapshot'})).sessions.length,1);assert.equal(f.creates(),0);
});

test('unresolved production Codex executable does not block independent environment checks or confirmed manual intake',async t=>{
 const {createCodexExecutableResolver}=await import('../src/codex-executable-resolver.mjs');
 const resolver=createCodexExecutableResolver();const f=await fixture(t,{getCodexExecutable:()=>resolver.getResolved()});
 const c=f.coordinator,p=await c.command('create',{material_path:f.material});
 await runProductCommand('git',['init',f.material]);await runProductCommand('git',['-C',f.material,'remote','add','origin',url]);
 await rm(p.workspace,{recursive:true,force:true});
 const context=await c.tool(p.id,{tool:'product_context'});assert.equal(context.kind,'temporary');
 const environment=await c.tool(p.id,{tool:'product_environment',arguments:{github:true}});assert.equal(environment.git.status,'repository');assert.equal(environment.github.status,'unavailable');
 assert.equal(environment.diagnostics.find(d=>d.stage==='git.root').exit_code,0);
 const approved=await approve(c,p.id,intakePlan());const done=await c.command('execute',{id:p.id,approved_digest:approved.approved_digest});assert.equal(done.kind,'formal');assert.equal(f.creates(),1);
});

test('product Git sharing keeps the shared CLI and proxy context instead of overriding it with the parent environment',async t=>{
 let shared;const f=await fixture(t,{getSettings:async()=>({codex_proxy:{enabled:true,url:'http://configured-proxy.invalid:8123'}}),getCodexExecutable:()=>({command:'codex',pathEntries:['/configured-cli/bin']}),runCommand:async(bin,args,options)=>{
  if(args.includes('ls-remote')){shared=options.env;return '';}
  if(bin==='gh')throw new Error('offline test');return runProductCommand(bin,args,options);
 }});
 const c=f.coordinator,p=await c.command('create',{material_path:f.material});const a=await approve(c,p.id,intakePlan());const formal=await c.command('execute',{id:p.id,approved_digest:a.approved_digest});
 await c.command('sync',{id:formal.id,action:'read'});
 assert.equal(shared.HTTP_PROXY,'http://configured-proxy.invalid:8123');assert.equal(shared.HTTPS_PROXY,shared.HTTP_PROXY);assert.ok(shared.PATH.startsWith('/configured-cli/bin'));assert.equal(shared.GIT_TERMINAL_PROMPT,'0');
});

async function checkout(f,name='checkout',origin=url){const path=join(f.root,name);await mkdir(path);await runProductCommand('git',['init',path]);await runProductCommand('git',['-C',path,'remote','add','origin',origin]);return path;}
test('selected checkout receives demo materials, preserves originals, omits secrets and exposes the exact UI semantics',async t=>{
 const f=await fixture(t),c=f.coordinator;const target=await checkout(f);
 await mkdir(join(f.material,'Sources'));await writeFile(join(f.material,'Sources','App.swift'),'struct App {}');await writeFile(join(f.material,'.env'),'private');await symlink(join(f.material,'README.md'),join(f.material,'link.md'));
 const p=await c.command('create',{material_path:f.material});await c.chooseWorkspace(p.id,target);
 const a=await approve(c,p.id,{...intakePlan(),directory:'selected',workspace_path:target});
 const ctx=await c.tool(p.id,{tool:'product_context',arguments:{}}),field=ctx.interaction.fields['plan.directory'];
 assert.equal(field.label,'正式工作目录');assert.equal(field.selected_label,'选择其他工作目录');assert.equal(field.actual_path,target);assert.equal(ctx.interaction.locations.material_source,f.material);assert.notEqual(ctx.interaction.locations.agent_workspace,target);assert.match(field.material_action,/保留来源/);assert.equal(ctx.interaction.actions.find(x=>x.id==='product_execute').available,true);
 const result=await c.command('execute',{id:p.id,approved_digest:a.approved_digest});
 assert.equal(await readFile(join(target,'Sources','App.swift'),'utf8'),'struct App {}');assert.equal(await readFile(join(f.material,'README.md'),'utf8'),'Demo for designers');await assert.rejects(readFile(join(target,'.env')), {code:'ENOENT'});await assert.rejects(readFile(join(target,'link.md')), {code:'ENOENT'});
 assert.deepEqual(result.receipts.workspace.result.skipped.sort(),['.env','link.md']);assert.equal(result.receipts.workspace.result.source_pushed,false);assert.match(await runProductCommand('git',['-C',target,'status','--porcelain']),/\?\? Sources/);assert.ok((await protocol.readRecord(target)).idea);
});
test('workspace grants, nested paths, private app directories, wrong origins and file conflicts fail before remote creation',async t=>{
 const f=await fixture(t),c=f.coordinator,p=await c.command('create',{material_path:f.material});const target=await checkout(f);
 let a=await approve(c,p.id,{...intakePlan(),directory:'selected',workspace_path:target});await assert.rejects(c.command('execute',{id:p.id,approved_digest:a.approved_digest}),/选择器授权/);assert.equal(f.creates(),0);
 await c.chooseWorkspace(p.id,target);await writeFile(join(target,'README.md'),'Existing different content');a=await approve(c,p.id,{...intakePlan(),directory:'selected',workspace_path:target});await assert.rejects(c.command('execute',{id:p.id,approved_digest:a.approved_digest}),/内容冲突.*README/);assert.equal(await readFile(join(target,'README.md'),'utf8'),'Existing different content');
 const nested=join(f.material,'nested');await mkdir(nested);const app=join(f.root,'app','formal');await mkdir(app);const wrong=await checkout(f,'wrong','https://github.com/example/wrong');
 for(const [path,pattern] of [[nested,/嵌套/],[app,/应用数据目录/],[wrong,/origin/]]){await c.chooseWorkspace(p.id,path);a=await approve(c,p.id,{...intakePlan(),directory:'selected',workspace_path:path});await assert.rejects(c.command('execute',{id:p.id,approved_digest:a.approved_digest}),pattern);}
 assert.equal(f.creates(),0);assert.equal((await c.detail(p.id)).kind,'temporary');
});
test('cloning an existing remote and copying materials is retryable after binding failure without duplicate remote creation',async t=>{
 let f,binds=0;const bareRoot=await mkdtemp(join(tmpdir(),'idea-clone-'));t.after(()=>rm(bareRoot,{recursive:true,force:true}));const bare=join(bareRoot,'remote.git');await runProductCommand('git',['init','--bare',bare]);
 f=await fixture(t,{runCommand:async(bin,args,options)=>{if(bin==='git'&&args[0]==='clone'){await runProductCommand('git',['clone','--',bare,args.at(-1)],options);await runProductCommand('git',['-C',args.at(-1),'remote','set-url','origin',url]);return '';}return runProductCommand(bin,args,options);},bindWorkspace:async()=>{if(++binds===1)throw new Error('binding temporarily unavailable');}});
 const c=f.coordinator,p=await c.command('create',{material_path:f.material}),target=join(f.root,'chosen');await mkdir(target);await c.chooseWorkspace(p.id,target);const a=await approve(c,p.id,{...intakePlan(),directory:'selected',workspace_path:target});
 await assert.rejects(c.command('execute',{id:p.id,approved_digest:a.approved_digest}),/binding/);assert.equal(f.creates(),1);assert.equal((await c.detail(p.id)).receipts.workspace.status,'completed');
 const result=await c.command('execute',{id:p.id,approved_digest:a.approved_digest});assert.equal(result.kind,'formal');assert.equal(f.creates(),1);assert.equal(await readFile(join(target,'README.md'),'utf8'),'Demo for designers');
});
test('legacy managed drafts revoke approval and remain incomplete until a user location is selected',async t=>{
 const f=await fixture(t),p=await f.coordinator.command('create');await f.coordinator.close();const file=join(f.root,'app','products.json'),state=JSON.parse(await readFile(file,'utf8'));
 state.ideas[0].plan={...intakePlan(),directory:'managed'};state.ideas[0].approved_digest='historical-confirmation';await writeFile(file,JSON.stringify(state));const c=createProductCoordinator(f.options);t.after(()=>c.close());
 const restored=await c.detail(p.id);assert.equal(restored.plan.directory,'selected');assert.equal(restored.plan.workspace_path,'');assert.equal(restored.approved_digest,'');assert.match(restored.directory_notice,/重新|选择/);
 await assert.rejects(c.command('approve',{id:p.id,revision:restored.record.revision,plan_digest:restored.plan_digest}),/目录位置/);assert.equal(f.creates(),0);
});
test('unknown Git errors remain diagnostics and never trigger init or remote creation',async t=>{
 const calls=[];const f=await fixture(t,{runCommand:async(bin,args)=>{calls.push(args);throw new Error('Git command launch ENOENT');}}),c=f.coordinator,p=await c.command('create',{material_path:f.material}),a=await approve(c,p.id,intakePlan());
 await assert.rejects(c.command('execute',{id:p.id,approved_digest:a.approved_digest}),/ENOENT/);assert.equal(f.creates(),0);assert.equal(calls.some(a=>a[0]==='init'),false);
});

test('formal directory containment distinguishes siblings, ancestors, descendants and drives on Windows and POSIX',()=>{
 for(const [paths,root,inside,sibling,ancestor,other] of [[win32,'C:/ArcOrbit','C:/ArcOrbit/projects/demo','C:/Developer/Demo','C:/','D:/ArcOrbit'],[posix,'/app','/app/products/demo','/Developer/Demo','/','/applications']]){
  assert.equal(workspaceContains(root,inside,paths),true);assert.equal(workspaceContains(root,root,paths),true);
  for(const target of [sibling,ancestor,other])assert.equal(workspaceContains(root,target,paths),false,target);
 }
});
