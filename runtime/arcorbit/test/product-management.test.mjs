import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp,mkdir,readFile,writeFile,rm,symlink } from 'node:fs/promises';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import * as protocol from '../../../definition/skills/arckit-product-assets/scripts/product-assets.mjs';
import { createProductCoordinator } from '../src/product-coordinator.mjs';
import { createProductGit,runProductCommand } from '../src/product-git.mjs';
const url='https://github.com/example/idea-demo';
async function fixture(t,extra={}) {
  const root=await mkdtemp(join(tmpdir(),'arcorbit-product-'));
  const material=join(root,'source');await mkdir(material);await writeFile(join(material,'README.md'),'Demo for designers');
  let scope='server:user-a';let creates=0;
  const platform={projects:[],organizations:[{id:'o1',name:'Team'}],active_workset:{id:'set',project_ids:[]},errors:[]};
  const options={dataDir:join(root,'app'),protocol,skillPath:join(root,'skill','SKILL.md'),getPlatform:async()=>structuredClone(platform),getAccountScope:async()=>scope,getSettings:async()=>({}),getCodexExecutable:()=>({command:'codex',pathEntries:[]}),
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
 const approved=await approve(c,p.id,intakePlan());await assert.rejects(c.command('execute',{id:p.id,approved_digest:approved.approved_digest}),/目录/);
 assert.equal(f.creates(),1);assert.equal((await c.snapshot()).ideas[0].kind,'temporary');
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
 await c.command('save',{id:p.id,revision:0,patch:{description:'Human edit'}});
 await assert.rejects(c.command('accept',{id:p.id,proposal_id:q.id}),/过期/);
 await assert.rejects(c.command('execute',{id:p.id,approved_digest:a.approved_digest}),/确认/);
 assert.equal(f.creates(),0);await assert.rejects(c.materials(p.id,{path:'../outside'}),/路径/);
 await writeFile(join(f.root,'secret'),'secret');await symlink(join(f.root,'secret'),join(f.material,'link'));await assert.rejects(c.materials(p.id,{path:'link'}),/符号链接/);
 await writeFile(join(f.material,'.env'),'SECRET=example');await assert.rejects(c.materials(p.id,{path:'.env'}),/范围/);
 assert.deepEqual((await c.materials(p.id)).files,['README.md']);
 await assert.rejects(c.command('save',{id:p.id,revision:1,patch:{status:'running'}}),/状态/);
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

test('blank Idea can create a private GitHub repository and managed checkout with authenticated bounded commands',async t=>{
 const calls=[];let f;
 const run=async(bin,args,options)=>{
  calls.push([bin,...args]);
  if(bin==='gh') {if(args[0]==='repo'&&args[1]==='view')return JSON.stringify({url,nameWithOwner:'example/idea-demo'});return '';}
  if(args[0]==='clone') {const dest=args.at(-1);await runProductCommand('git',['init',dest]);await runProductCommand('git',['-C',dest,'remote','add','origin',url]);return '';}
  return runProductCommand(bin,args,options);
 };
 f=await fixture(t,{runCommand:run});const c=f.coordinator;const p=await c.command('create');
 const approved=await approve(c,p.id,{...intakePlan(),repository:'create',github_owner:'example',github_name:'idea-demo',directory:'managed'});
 const result=await c.tool(p.id,{tool:'product_execute',arguments:{approved_digest:approved.approved_digest}});
 assert.equal(result.kind,'formal');assert.match(result.material_path,/projects/);assert.ok((await protocol.readRecord(result.material_path)).idea);
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
 const f=await fixture(t);const c=f.coordinator;const p=await c.command('create');const first=await approve(c,p.id,intakePlan());
 await assert.rejects(c.command('execute',{id:p.id,approved_digest:first.approved_digest}),/目录/);assert.equal(f.creates(),1);
 await assert.rejects(c.command('execute',{id:p.id,approved_digest:first.approved_digest}),/目录/);assert.equal(f.creates(),1);
 await c.chooseMaterial(p.id,f.material);
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
