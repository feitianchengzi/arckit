import test from 'node:test';
import assert from 'node:assert/strict';
import { createMemberAddFlow } from '../desktop/renderer/project-member-add.mjs';
import { createPlatformCoordinator } from '../src/platform-coordinator.mjs';
import { createWorkshopPlatformAdapter, normalizeMember } from '../src/workshop-platform-adapter.mjs';
const target = { id: '91', user_id: '17', organization_id: '31', username: 'Lin' };
const ready = { status: 'ready', candidates: [target], members: [] };
const deferred = () => { let resolve; const promise = new Promise((r) => resolve=r); return {promise,resolve}; };

test('direct add adapter sends only relation id, traverses organization pages, never invents relation identity', async () => {
 const calls=[];
 const adapter=createWorkshopPlatformAdapter({listProjects:async()=>[],normalizeTask:x=>x,request:async(path,options)=>{
  calls.push([path,options]);
  if(options.method) return {};
  return {members: options.query.page===1 ? Array.from({length:200},(_,i)=>({id:i+1,user_id:i+1000,username:'A'})) : [{id:201,user_id:1200,username:'Last'}],meta:{total:201}};
 }});
 const members=await adapter.listOrganizationMembers('31');assert.equal(members.length,201);assert.equal(members[200].id,'201');
 await adapter.addProjectMember('11',{organization_member_id:'91',role:'owner',user_id:17,url:'invalid'});
 assert.deepEqual(calls.at(-1),['/projects/11/members',{method:'POST',body:{organization_member_id:91}}]);
 assert.equal(normalizeMember({user_id:17},{organizationId:'31'}),null);
 assert.throws(()=>adapter.addProjectMember('../11',{organization_member_id:91}));
});

function coordinatorFixture(role='owner') {
 let account='7';const writes=[];
 const source={ listProjects:async()=>[{id:'11',organization_id:'31'}], listProjectMembers:async()=>[{id:'20',user_id:'7',role}],listOrganizationMembers:async()=>[target],addProjectMember:async(id,input)=>{writes.push([id,input]);return {id:88,project_id:11,user_id:17,role:"member"};} };
 const coordinator=createPlatformCoordinator({platformSource:source,runManager:{},workSync:{},automationCoordinator:{getSnapshot:async()=>({user:{id:account}})}});
 return {source,coordinator,writes,setAccount:id=>account=id};
}
test('bounded main command rejects non-admin, wrong account and target; preserves fixed add input',async()=>{
 for(const role of ['member','']) {
  const f=coordinatorFixture(role);const r=await f.coordinator.executeAction('project.member.add',{project_id:'11',account_id:'7',organization_member_id:'91'});
  assert.equal(r.error.status,403);assert.equal(f.writes.length,0);
 }
 for(const role of ['owner','admin']) {
  const f=coordinatorFixture(role); const input={project_id:'11',account_id:'7',organization_member_id:'91',role:'owner'};
  assert.equal((await f.coordinator.executeAction('project.member.add',input)).status,'completed');
  assert.deepEqual(f.writes,[['11',{organization_member_id:'91'}]]);
  assert.equal((await f.coordinator.executeAction('project.member.add',{...input,organization_member_id:'17'})).error.status,404);
  f.setAccount('8');assert.equal((await f.coordinator.executeAction('project.member.add',input)).error.status,401);
 }
});
test('account change during candidate read prevents write; transport errors retain outcome ambiguity',async()=>{
 const f=coordinatorFixture();f.source.listOrganizationMembers=async()=>{f.setAccount('8');return [target]};
 assert.equal((await f.coordinator.executeAction('project.member.add',{project_id:'11',account_id:'7',organization_member_id:'91'})).error.status,401);assert.equal(f.writes.length,0);
 const g=coordinatorFixture();g.source.addProjectMember=async()=>{throw new Error('connection lost')};
 assert.equal((await g.coordinator.executeAction('project.member.add',{project_id:'11',account_id:'7',organization_member_id:'91'})).outcome_unknown,true);
});
test('confirmed mutation refresh failure retries only reads',async()=>{
 const calls=[];let fail=true;
 const f=createMemberAddFlow({projectId:'11',accountId:'7',isCurrent:()=>true,execute:async cmd=>{calls.push(cmd);return cmd.endsWith('candidates')?ready:{status:'completed'}},refresh:async()=>{if(fail)throw Error('offline')}});
 await f.load();f.select('91');await f.submit();assert.equal(f.state.phase,'sync_failed');fail=false;await f.submit();assert.equal(f.state.phase,'done');assert.equal(calls.filter(x=>x.endsWith('.add')).length,1);
});
test('unknown mutation reconciles before retry, detects existing member',async()=>{
 const calls=[];let joined=false;
 const f=createMemberAddFlow({projectId:'11',accountId:'7',isCurrent:()=>true,execute:async cmd=>{calls.push(cmd);if(cmd.endsWith('.add')){joined=true;return {status:'failed',outcome_unknown:true}}return {...ready,members:joined?[{user_id:'17'}]:[]}},refresh:async()=>{}});
 await f.load();f.select('91');await f.submit();assert.equal(f.state.phase,'unknown');await f.submit();assert.equal(f.state.phase,'done');assert.deepEqual(calls,['project.member.candidates','project.member.add','project.member.candidates']);
});
test('single-flight submit and stale project/account/closed sheet responses never publish or refresh',async()=>{
 for(const invalidation of ['context','close']) {
  const barrier=deferred();let current=true,writes=0,refreshes=0,updates=0;
  const f=createMemberAddFlow({projectId:'11',accountId:'7',isCurrent:()=>current,changed:()=>updates++,execute:async cmd=>{if(cmd.endsWith('candidates'))return ready;writes++;return barrier.promise},refresh:async()=>refreshes++});
  await f.load();f.select('91');const p=f.submit();await f.submit();assert.equal(writes,1);
  if(invalidation==='close')f.close();else current=false;const previous=updates;barrier.resolve({status:'completed'});await p;
  assert.equal(updates,previous);assert.equal(refreshes,0);
 }
});
test('existing member cannot be selected and candidate failure does not permit submission',async()=>{
 const f=createMemberAddFlow({projectId:'11',accountId:'7',isCurrent:()=>true,execute:async()=>({...ready,members:[{user_id:'17'}]}),refresh:async()=>{}});
 await f.load();f.select('91');assert.equal(f.state.selected,'');
 const g=createMemberAddFlow({projectId:'11',accountId:'7',isCurrent:()=>true,execute:async()=>{throw Error('offline')},refresh:async()=>{}});await g.load();assert.equal(g.state.phase,'load_failed');
});

test('organization pagination follows declared total even for short pages and fails closed on repeated pages',async()=>{
 for(const repeated of [false,true]) {
  const adapter=createWorkshopPlatformAdapter({listProjects:async()=>[],normalizeTask:x=>x,request:async(_,{query})=>({members:[{id:repeated?1:query.page,user_id:query.page+20}],meta:{total:2}})});
  if(repeated) await assert.rejects(adapter.listOrganizationMembers(31),/incomplete/);
  else assert.equal((await adapter.listOrganizationMembers(31)).length,2);
 }
});


test('production coordinator and flow confirm only matching member responses and reconcile ambiguous writes', async () => {
 const replies = [null, {}, [], {id:88,user_id:17}, {id:88,project_id:11},
  {id:88,project_id:12,user_id:17}, {id:88,project_id:11,user_id:18},
  {id:0,project_id:11,user_id:17}, {id:88,project_id:11,user_id:17},
  {id:'88',project_id:'11',user_id:'17',role:'admin',duty:'keep'}];
 for (const reply of replies) {
  const f=coordinatorFixture();let writes=0,refreshes=0,joined=false;
  f.source.addProjectMember=async()=>{writes++;return reply};
  const original=f.source.listProjectMembers;
  f.source.listProjectMembers=async()=>[...await original(),...(joined?[{id:'88',project_id:'11',user_id:'17'}]:[])];
  const flow=createMemberAddFlow({projectId:'11',accountId:'7',isCurrent:()=>true,
   execute:(cmd,input)=>f.coordinator.executeAction(cmd,input),refresh:async()=>refreshes++});
  await flow.load();flow.select('91');await flow.submit();
  const valid=reply && !Array.isArray(reply) && Number(reply.id)>0 && Number(reply.project_id)===11 && Number(reply.user_id)===17;
  assert.equal(flow.state.phase,valid?'done':'unknown',JSON.stringify(reply));
  assert.equal(refreshes,valid?1:0);assert.equal(writes,1);
  if(!valid){joined=true;await flow.submit();assert.equal(flow.state.phase,'done');assert.equal(writes,1);assert.equal(refreshes,1);}
 }
});

test('client gates reject personal, inaccessible, cross-organization and nonmember targets before writing', async()=>{
 for(const kind of ['personal','inaccessible','cross-organization','nonmember']) {
  const f=coordinatorFixture();
  if(kind==='personal')f.source.listProjects=async()=>[{id:'11'}];
  if(kind==='inaccessible')f.source.listProjects=async()=>[];
  if(kind==='cross-organization')f.source.listOrganizationMembers=async()=>[{...target,organization_id:'32'}];
  if(kind==='nonmember')f.source.listProjectMembers=async()=>[{user_id:'8',role:'owner'}];
  const r=await f.coordinator.executeAction('project.member.add',{project_id:'11',account_id:'7',organization_member_id:'91'});
  assert.equal(r.status,'failed');assert.equal(r.outcome_unknown,false);assert.equal(f.writes.length,0);
 }
});


test('ambiguous response with no confirmed membership requires a separate user retry',async()=>{
 const f=coordinatorFixture();let writes=0;
 f.source.addProjectMember=async()=>{writes++;return {}};
 const flow=createMemberAddFlow({projectId:'11',accountId:'7',isCurrent:()=>true,
 execute:(cmd,input)=>f.coordinator.executeAction(cmd,input),refresh:async()=>assert.fail('unconfirmed refresh')});
 await flow.load();flow.select('91');await flow.submit();await flow.submit();
 assert.equal(flow.state.phase,'ready');assert.equal(writes,1);
 await flow.submit();assert.equal(writes,2);assert.equal(flow.state.phase,'unknown');
});

test('account change during write cannot publish a confirmed success',async()=>{
 const f=coordinatorFixture();f.source.addProjectMember=async()=>{f.setAccount('8');return {id:88,project_id:11,user_id:17}};
 const result=await f.coordinator.executeAction('project.member.add',{project_id:'11',account_id:'7',organization_member_id:'91'});
 assert.equal(result.status,'failed');assert.equal(result.outcome_unknown,true);
});
