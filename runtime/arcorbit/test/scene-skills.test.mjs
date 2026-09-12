import nodeTest from 'node:test';
import { pathToFileURL } from 'node:url';
import assert from 'node:assert/strict';
import { mkdtemp, mkdir, writeFile, readFile, access, symlink, rm, realpath } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { createBundledSkillCatalog } from '../src/bundled-skill-catalog.mjs';
import { createSceneSkillManager, validateSceneSkillBinding } from '../src/scene-skill-manager.mjs';
import { createSceneSkillProvisioningManager } from '../src/scene-skill-provisioning.mjs';
import { configureCodexSceneSkills, createOnDemandTools } from '../src/codex-scene-skills.mjs';
import { digest } from '../src/skill-files.mjs';

const providerUrl = process.env.ARCFORGE_TEST_PROVIDER ? pathToFileURL(process.env.ARCFORGE_TEST_PROVIDER).href : new URL('../dist-package/resources/provisioning/arcforge-provider/dist/provider/index.js', import.meta.url).href;
let provider;
try { await access(new URL(providerUrl)); provider = await import(providerUrl); }
catch (error) {
 if (error.code !== 'ENOENT' || process.env.ARCFORGE_TEST_PROVIDER || process.env.ARCFORGE_REQUIRE_PROVIDER_TESTS === '1') throw error;
}
const test = (name, run) => nodeTest(name, {skip: provider ? false : 'Build distribution resources or set ARCFORGE_TEST_PROVIDER for integration tests'}, run);

async function confirmMigration(catalog, roots) {
 const plan=await catalog.planMigration(roots);
 return catalog.migrateProjects(roots,{planDigest:plan.planDigest,confirmed:true});
}

async function skill(folder, name, description = `Use ${name} for its domain.`) {
 await mkdir(folder, {recursive:true}); await writeFile(path.join(folder,'SKILL.md'),`---\nname: ${name}\ndescription: ${description}\n---\nInstructions\n`); return folder;
}
async function fixture({ installed = true } = {}) {
 const root=await realpath(await mkdtemp(path.join(os.tmpdir(),'scene-skills-'))),home=path.join(root,'home'),source=path.join(root,'source'),data=path.join(root,'data'),project=path.join(root,'project');
 await mkdir(project,{recursive:true});
 for(const name of ['using-arckit','arckit-development-ledger','arckit-spec','manual-skill']) await skill(path.join(source,'entry','skills',name),name);
 await writeFile(path.join(source,'arcforge.skill-project.json'),JSON.stringify({version:1,sourceDir:'.',availability:{defaultMode:'user-ambient',skills:[{path:'entry/skills/manual-skill',mode:'user-on-demand'}]}}));
 const catalog=createBundledSkillCatalog({sourceRoot:source,dataRoot:data,homeDir:home,provider});if(installed){const first=await catalog.prepare();await catalog.install({planDigest:first.installation.planDigest,confirmed:true});}
 const options={dataRoot:data,homeDir:home,catalog,getProjectRoots:async()=>[project]};
 return {root,home,source,data,project,catalog,options,manager:createSceneSkillManager(options)};
}
test('scene defaults persist built-in choices and reject non-built-in mutations',async()=>{
 const f=await fixture();let s=await f.manager.snapshot();
 assert.equal(s.scenes.find(x=>x.id==='chat').enabledCount,1);
 assert.equal(s.scenes.find(x=>x.id==='automation').enabledCount,4);
 await assert.rejects(f.manager.update({scene:'automation',expectedRevision:0,changes:[{id:'builtin:using-arckit',enabled:false}]}),/core/);
 assert.equal((await f.manager.snapshot()).revision,0);
 await skill(path.join(f.home,'.codex/skills/my-spec'),'my-spec');
 assert.equal((await f.manager.snapshot()).skills.some(x=>x.name==='my-spec'),false);
 await assert.rejects(f.manager.update({scene:'automation',expectedRevision:0,changes:[{id:'user:my-spec',enabled:true}]}),/only manages ArcOrbit built-in/);
 s=await f.manager.update({scene:'automation',expectedRevision:0,changes:[{id:'builtin:arckit-spec',enabled:false}]});
 const reopened=createSceneSkillManager(f.options);const binding=await reopened.resolveScene('automation',f.project);
 assert.deepEqual(binding.skills.map(x=>x.name).sort(),['arcforge-on-demand','arckit-development-ledger','using-arckit']);
 await assert.rejects(reopened.update({scene:'chat',expectedRevision:0,changes:[]}),/changed/);
 await validateSceneSkillBinding(binding);
 await writeFile(binding.skills[0].skillPath,'changed');
 await assert.rejects(validateSceneSkillBinding(binding),/package|catalog|metadata|changed/i);
});
test('Chat entry visibility is independently configurable and never replaces Automation core',async()=>{
 const f=await fixture();let s=await f.manager.update({scene:'chat',expectedRevision:0,changes:[{id:'builtin:using-arckit',enabled:true}]});
 assert.equal((await f.manager.resolveScene('chat',f.project)).skills.length,2);
 await f.manager.update({scene:'chat',expectedRevision:s.revision,changes:[{id:'builtin:using-arckit',enabled:false}]});
 assert.equal((await f.manager.resolveScene('chat',f.project)).skills.length,1);
 assert.equal((await f.manager.resolveScene('automation',f.project)).skills.length,4);
});
test('editing Automation does not change the Chat process fingerprint', async () => {
 const f=await fixture(),before=await f.manager.resolveScene('chat',f.project);
 await f.manager.update({scene:'automation',expectedRevision:0,changes:[{id:'builtin:arckit-spec',enabled:false}]});
 const after=await f.manager.resolveScene('chat',f.project);assert.notEqual(before.revision,after.revision);assert.equal(before.fingerprint,after.fingerprint);
});
test('legacy cleanup removes known Arckit only, preserves unrelated and linked folders, is idempotent',async()=>{
 const f=await fixture(),local=path.join(f.project,'.codex','skills');
 await skill(path.join(local,'arckit-spec'),'arckit-spec');
 await skill(path.join(local,'arckit-user-tool'),'arckit-user-tool');
 await skill(path.join(local,'using-arckit'),'using-arckit','User maintained unrelated same name');
 const outside=await skill(path.join(f.root,'outside'),'linked-tool');await symlink(outside,path.join(local,'linked-tool'));
 const first=await confirmMigration(f.catalog,[f.project]);assert.equal(first.removed.length,1);assert.equal(first.errors.length,0);assert.equal(first.preserved.length,3);
 await assert.rejects(access(path.join(local,'arckit-spec')));await access(outside);await access(path.join(local,'arckit-user-tool'));
 assert.equal((await confirmMigration(f.catalog,[f.project])).removed.length,0);
});
test('managed modified Arckit copies and competing ownership are preserved',async()=>{
 const f=await fixture(),target=path.join(f.project,'.codex','skills','arckit-spec');await skill(target,'arckit-spec','modified');
 await mkdir(path.join(f.home,'.arcforge','projects'),{recursive:true});
 const record={profile:'arckit-runtime',sourceRoot:path.join(f.data,'skill-sources/arckit/current'),availabilityItems:[{skill:'arckit-spec',destinations:[target]}]};
 await writeFile(path.join(f.home,'.arcforge','projects','owned.json'),JSON.stringify({root:f.data,appliedSources:[record]}));
 assert.equal((await confirmMigration(f.catalog,[f.project])).removed.length,0);
 await skill(target,'arckit-spec');
 await writeFile(path.join(f.home,'.arcforge','projects','other.json'),JSON.stringify({root:f.data,appliedSources:[{...record,profile:'other',sourceRoot:'/other'}]}));
 assert.equal((await confirmMigration(f.catalog,[f.project])).removed.length,0);await access(target);
});
test('stable catalog updates invalidate stale bindings and detect tampered installs',async()=>{
 const f=await fixture();const before=await f.manager.resolveScene('automation',f.project);
 await writeFile(path.join(f.source,'entry/skills/arckit-spec','extra.md'),'new bundled content');
 const update=await f.catalog.prepare();await f.catalog.install({planDigest:update.installation.planDigest,confirmed:true});const after=await f.manager.resolveScene('automation',f.project);
 assert.notEqual(before.catalogVersion,after.catalogVersion);await assert.rejects(validateSceneSkillBinding(before),/changed/);await validateSceneSkillBinding(after);
 const builtin=after.skills.find(x=>x.name==='arckit-spec');await writeFile(path.join(builtin.path,'extra.md'),'tamper');
 assert.ok((await f.catalog.prepare()).installation.blocking.some(x=>x.code==='CATALOG_CONTENT_DRIFT'));
});
test('Codex roots and local config exclude disabled or shadowing native skills and preserve unrelated entries',async()=>{
 const f=await fixture();const binding=await f.manager.resolveScene('chat',f.project),requests=[];
 const client={async request(method,params){requests.push({method,params});return method==='skills/list'?{data:[{cwd:f.project,skills:[...binding.skills.map(x=>({name:x.name,path:x.skillPath,enabled:true})),{name:'using-arckit',path:'/native/using-arckit/SKILL.md',enabled:true},{name:'third-party',path:'/native/third-party/SKILL.md',enabled:true}]}]}:{};}};
 const configured=await configureCodexSceneSkills(client,f.project,binding);
 assert.deepEqual(requests[0],{method:'skills/extraRoots/set',params:{extraRoots:binding.skills.map(x=>x.path)}});
 assert.equal(configured.config['skills.config'].find(x=>x.path==='/native/using-arckit/SKILL.md').enabled,false);
 assert.equal(configured.skillInputs,undefined);
 await assert.rejects(configureCodexSceneSkills({request:async()=>{throw Error('method not found');}},f.project,binding),/extraRoots/);
});
test('readiness lists cleanup without deleting until the reviewed plan is explicitly confirmed',async()=>{
 const f=await fixture();await skill(path.join(f.project,'.codex/skills/arckit-spec'),'arckit-spec');
 const provision=createSceneSkillProvisioningManager({catalog:f.catalog,codexProbe:async()=>({available:true})});
 const result=await provision.check({projectRoot:[f.project]});assert.equal(result.status,'ready');assert.equal(result.can_apply,true);assert.equal(result.migration.pending.length,1);assert.equal(result.migration.removed.length,0);
 await access(path.join(f.project,'.codex/skills/arckit-spec'));
 await provision.check({projectRoot:[f.project]});await provision.recoverSourceUpgrade();await access(path.join(f.project,'.codex/skills/arckit-spec'));
 await assert.rejects(provision.apply({planDigest:result.plan.digest}),/确认/);
 await assert.rejects(f.catalog.migrateProjects([f.project]),/确认/);
 const applied=await provision.apply({planDigest:result.plan.digest,confirmed:true});assert.equal(applied.migration.removed.length,1);await assert.rejects(access(path.join(f.project,'.codex/skills/arckit-spec')));
 assert.deepEqual(result.plan.loader_targets,[]);
 await provision.assertReady(f.project);
});
test('native non-Arckit skills remain Codex-owned while same-name core stays shadowed',async()=>{
 const f=await fixture();await skill(path.join(f.home,'.codex/skills/third-party'),'third-party');await skill(path.join(f.home,'.codex/skills/using-arckit'),'using-arckit');
 const s=await f.manager.snapshot();assert.ok(s.skills.every(x=>x.source==='builtin'));assert.equal(s.skills.some(x=>x.name==='third-party'),false);
 const binding=await f.manager.resolveScene('chat',f.project);assert.deepEqual(binding.skills.map(x=>x.name),['arcforge-on-demand']);
 const thirdParty=path.join(f.home,'.codex/skills/third-party/SKILL.md'),nativeCore=path.join(f.home,'.codex/skills/using-arckit/SKILL.md');
 const client={request:async method=>method==='skills/list'?{data:[{cwd:f.project,skills:[...binding.skills.map(x=>({name:x.name,path:x.skillPath,enabled:true})),{name:'third-party',path:thirdParty,enabled:true},{name:'using-arckit',path:nativeCore,enabled:true}]}]}:{}};
 const overrides=(await configureCodexSceneSkills(client,f.project,binding)).config['skills.config'];
 assert.equal(overrides.some(x=>x.path===path.resolve(thirdParty)),false);
 assert.equal(overrides.find(x=>x.path===path.resolve(nativeCore)).enabled,false);
});
test('project-local skills are absent from Engineering bindings and cannot be mutated', async () => {
 const f=await fixture(),second=path.join(f.root,'second');
 await skill(path.join(f.project,'.codex/skills/domain'),'domain');await skill(path.join(second,'.codex/skills/domain'),'domain');
 const manager=createSceneSkillManager({...f.options,getProjectRoots:async()=>[f.project,second]});
 const snapshot=await manager.snapshot();assert.equal(snapshot.skills.some(x=>x.name==='domain'),false);
 assert.equal((await manager.resolveScene('chat',second)).skills.some(x=>x.name==='domain'),false);
 await assert.rejects(manager.update({scene:'chat',expectedRevision:snapshot.revision,changes:[{id:'project:domain',enabled:true}]}),/only manages ArcOrbit built-in/);
 await rm(path.join(f.project,'.codex/skills/domain'),{recursive:true});
 assert.equal((await manager.resolveScene('chat',f.project)).skills.length,1);
});
test('native Codex disabled settings remain disabled without becoming Engineering state', async () => {
 const f=await fixture();await skill(path.join(f.home,'.codex/skills/domain'),'domain');
 const binding=await f.manager.resolveScene('chat',f.project),nativePath=path.join(f.home,'.codex/skills/domain/SKILL.md');
 const client={request:async method=>method==='skills/list'?{data:[{cwd:f.project,skills:[...binding.skills.map(x=>({name:x.name,path:x.skillPath,enabled:true})),{name:'domain',path:nativePath,enabled:false}]}]}:{}};
 assert.equal((await configureCodexSceneSkills(client,f.project,binding)).config['skills.config'].find(x=>x.path===path.resolve(nativePath)).enabled,false);
 await assert.rejects(f.manager.update({scene:'chat',expectedRevision:0,changes:[{id:'user:domain',enabled:true}]}),/only manages ArcOrbit built-in/);
});
test('non-built-in catalog conflicts stay outside Engineering and cannot be activated there', async () => {
 const f=await fixture(),folder=await skill(path.join(f.home,'.arcforge/catalog/domain'),'domain');
 await writeFile(path.join(f.home,'.arcforge/catalog/index.json'),JSON.stringify({version:2,entries:[{skillName:'domain',installedPath:folder,status:'conflict',contentDigest:'0'.repeat(64)}]}));
 const snapshot=await f.manager.snapshot();assert.equal(snapshot.errors.length,0);assert.equal(snapshot.skills.some(x=>x.name==='domain'),false);
 await assert.rejects(f.manager.update({scene:'chat',expectedRevision:snapshot.revision,changes:[{id:'catalog:domain',enabled:true}]}),/only manages ArcOrbit built-in/);
 await assert.rejects(provider.queryCatalog({stateRoot:path.join(f.home,'.arcforge'),action:'resolve',query:'domain'}),/catalog|Catalog|qualifiedName/);
});

test('dual entries preserve merged Chat preference and excludes retired native entries without deleting them', async () => {
 const f=await fixture();
 const legacy=await skill(path.join(f.home,'.codex/skills/arckit-state-driven-loop'),'arckit-state-driven-loop');
 await mkdir(path.join(f.data,'engineering'),{recursive:true});
 await writeFile(path.join(f.data,'engineering/scene-skills.json'),JSON.stringify({schema_version:'arcorbit-scene-skills/v1',revision:4,localPaths:['/legacy/user/path'],scenes:{chat:{'builtin:arckit-state-driven-loop':true,'user:domain':'disabled'},automation:{}}}));
 const binding=await f.manager.resolveScene('chat',f.project);
 assert.deepEqual(binding.skills.map(x=>x.name),['arcforge-on-demand','arckit-development-ledger','using-arckit']);
 assert.ok(binding.managedNames.includes('arckit-state-driven-loop'));assert.equal(binding.disabledPaths.includes(await realpath(legacy)),false);await access(legacy);
 const client={request:async method=>method==='skills/list'?{data:[{cwd:f.project,skills:[...binding.skills.map(x=>({name:x.name,path:x.skillPath,enabled:true})),{name:'arckit-state-driven-loop',path:path.join(legacy,'SKILL.md'),enabled:true}]}]}:{}};
 assert.equal((await configureCodexSceneSkills(client,f.project,binding)).config['skills.config'].find(x=>x.path===path.join(legacy,'SKILL.md')).enabled,false);
 const s=await f.manager.update({scene:'chat',expectedRevision:4,changes:[{id:'builtin:using-arckit',enabled:false},{id:'builtin:arckit-development-ledger',enabled:false}]});
 assert.equal(s.revision,5);assert.equal((await f.manager.resolveScene('chat',f.project)).skills.length,1);
 const reset=await f.manager.update({scene:'chat',expectedRevision:s.revision,reset:true});assert.equal(reset.revision,6);
 const persisted=JSON.parse(await readFile(path.join(f.data,'engineering/scene-skills.json'),'utf8'));
 assert.equal('builtin:arckit-state-driven-loop' in persisted.scenes.chat,false);
 assert.equal(persisted.scenes.chat['user:domain'],'disabled');assert.deepEqual(persisted.localPaths,['/legacy/user/path']);
});

test('confirmed cleanup refuses a stale plan and preserves every target',async()=>{
 const f=await fixture(),target=path.join(f.project,'.codex/skills/arckit-spec');await skill(target,'arckit-spec');
 const provision=createSceneSkillProvisioningManager({catalog:f.catalog,codexProbe:async()=>({available:true})});
 const planned=await provision.check({projectRoot:[f.project]});
 await writeFile(path.join(target,'user.md'),'changed after review');
 const failed=await provision.apply({planDigest:planned.plan.digest,confirmed:true});
 assert.equal(failed.error.code,'SKILL_MIGRATION_CONFIRMATION_INVALID');assert.equal(failed.can_apply,false);await access(target);
 await assert.rejects(provision.apply({planDigest:planned.plan.digest,confirmed:true}),/确认/);await access(target);
});

test('first installation and on-demand updates are reviewed separately from cleanup',async()=>{
 const f=await fixture({installed:false}),data=path.join(f.root,'fresh-consumer'),target=path.join(f.project,'.codex/skills/arckit-spec');await skill(target,'arckit-spec');
 const catalog=createBundledSkillCatalog({sourceRoot:f.source,dataRoot:data,homeDir:f.home,provider});
 const manager=createSceneSkillProvisioningManager({catalog,codexProbe:async()=>({available:true})});
 const pending=await manager.check({projectRoot:[f.project]});assert.equal(pending.plan.operation,'install');assert.equal(pending.status,'needs-install');
 assert.equal(pending.installation.items.find(i=>i.skill==='manual-skill').status,'install');await assert.rejects(access(pending.catalog.path));await access(target);
 await manager.check();await assert.rejects(access(pending.catalog.path));
 const installed=await manager.apply({planDigest:pending.plan.digest,confirmed:true});assert.equal(installed.plan.operation,'cleanup');assert.equal(installed.migration.removed.length,0);await access(target);
 await assert.rejects(manager.apply({planDigest:pending.plan.digest,confirmed:true}),/确认/);await access(target);
 const cleaned=await manager.apply({planDigest:installed.plan.digest,confirmed:true});assert.equal(cleaned.migration.removed.length,1);
 await writeFile(path.join(f.source,'entry/skills/manual-skill/new.md'),'on-demand update');
 const update=await manager.check();assert.equal(update.plan.operation,'install');assert.equal(update.installation.items.find(i=>i.skill==='manual-skill').status,'update');await access(update.catalog.path);await assert.rejects(access(path.join(update.catalog.path,'manual-skill/new.md')));
});

test('scene modes separate discovery, scoped on-demand lookup and disabled skills',async()=>{
 const f=await fixture();let snapshot=await f.manager.snapshot();
 assert.equal(snapshot.skills.find(x=>x.name==='manual-skill').modes.automation,'on-demand');
 const binding=await f.manager.resolveScene('automation',f.project);
 assert.ok(binding.skills.some(x=>x.name==='arcforge-on-demand'));assert.ok(!binding.skills.some(x=>x.name==='manual-skill'));
 const tools=await createOnDemandTools(binding);
 assert.match(tools.developerInstructions,/本说明仅提供接口，不是调用指令/);
 assert.match(tools.developerInstructions,/不得因自行判断任务缺少能力/);
 const listed=await tools.dynamicToolProvider({tool:'arcforge_catalog',arguments:{action:'list'}});
 assert.deepEqual(listed.candidates.map(x=>x.skillName),['manual-skill']);
 const resolved=await tools.dynamicToolProvider({tool:'arcforge_catalog',arguments:{action:'resolve',query:'manual-skill'}});assert.equal(resolved.status,'resolved');
 assert.equal(resolved.resolved.installedPath,path.join(f.home,'.arcforge/catalog/manual-skill'));
 snapshot=await f.manager.update({scene:'automation',expectedRevision:snapshot.revision,changes:[{id:'builtin:manual-skill',mode:'disabled'}]});
 const disabled=await createOnDemandTools(await f.manager.resolveScene('automation',f.project));
 assert.equal((await disabled.dynamicToolProvider({tool:'arcforge_catalog',arguments:{action:'resolve',query:'manual-skill'}})).status,'not-found');
 assert.equal((await provider.queryCatalog({stateRoot:path.join(f.home,'.arcforge'),action:'resolve',query:'manual-skill'})).status,'resolved');
 const beforePath=resolved.resolved.installedPath;
 snapshot=await f.manager.update({scene:'automation',expectedRevision:snapshot.revision,changes:[{id:'builtin:manual-skill',mode:'direct'}]});
 const direct=await f.manager.resolveScene('automation',f.project);assert.equal(direct.skills.find(x=>x.name==='manual-skill').path,beforePath);assert.ok(!direct.onDemand.some(x=>x.qualifiedName==='manual-skill'));
});

test('skill update and confirmed cleanup do not consult task activity; future bindings use updated skills',async()=>{
 const f=await fixture(),target=path.join(f.home,'.arcforge/catalog/manual-skill/new.md');
 const binding=await f.manager.resolveScene('automation',f.project),before=JSON.stringify(binding);
 const oldTools=await createOnDemandTools(binding);
 await writeFile(path.join(f.source,'entry/skills/manual-skill/new.md'),'new source');
 const legacy=await skill(path.join(f.project,'.codex/skills/arckit-spec'),'arckit-spec');
 const manager=createSceneSkillProvisioningManager({catalog:f.catalog,codexProbe:async()=>({available:true}),activeOwners:async()=>{throw new Error('Environment must not query Chat or Automation activity');}});
 const plan=await manager.check({projectRoot:[f.project]});
 assert.equal(plan.can_apply,true);assert.equal(plan.error,null);assert.equal(plan.plan.operation,'install');
 await assert.rejects(access(target));
 const installed=await manager.apply({planDigest:plan.plan.digest,confirmed:true});
 assert.equal(installed.status,'ready');await access(target);await access(legacy);
 assert.equal(JSON.stringify(binding),before);
 const query={tool:'arcforge_catalog',arguments:{action:'resolve',query:'manual-skill'}};
 await assert.rejects(oldTools.dynamicToolProvider(query),/下一轮重新解析/);
 const next=await f.manager.resolveScene('automation',f.project);assert.notEqual(next.fingerprint,binding.fingerprint);
 assert.equal((await (await createOnDemandTools(next)).dynamicToolProvider(query)).status,'resolved');
 assert.equal(installed.plan.operation,'cleanup');
 const cleaned=await manager.apply({planDigest:installed.plan.digest,confirmed:true});
 assert.equal(cleaned.error,null);await assert.rejects(access(legacy));
 await rm(f.root,{recursive:true,force:true});
});

test('resumed-thread catalog command applies the same scope as the dynamic tool',async()=>{
 const f=await fixture(),binding=await f.manager.resolveScene('automation',f.project);
 const tools=await createOnDemandTools(binding);assert.match(tools.developerInstructions,/--scope-file/);
 const {execFile}=await import('node:child_process'),{promisify}=await import('node:util');
 const command=path.join(path.dirname(binding.catalogContext.providerEntrypoint),'catalog-query.js');
 const scope=path.join(binding.catalogContext.stateRoot,'scopes',`${binding.fingerprint}.json`);
 const run=async args=>JSON.parse((await promisify(execFile)(process.execPath,[command,'--scope-file',scope,...args])).stdout);
 assert.deepEqual((await run(['--action','list'])).candidates.map(x=>x.skillName),['manual-skill']);
 assert.equal((await run(['--action','resolve','--query','arckit-spec'])).status,'not-found');
 assert.equal((await run(['--action','resolve','--query','manual-skill'])).status,'resolved');
});

test('legacy source identities without SemVer require reviewed source replacement, protect drift and stale plans', async () => {
 const f = await fixture({installed:false});
 const old = {sourceRoot:f.source,consumerRoot:f.data,stateRoot:path.join(f.home,'.arcforge'),homeDir:f.home,
  skills:['manual-skill','arckit-spec'],declaredSkillPaths:['entry/skills/manual-skill','entry/skills/arckit-spec'],
  declaredSharedAssetPaths:[],agentTargetIds:['codex'],destinationPolicy:'catalog-only',sourceProvenance:{sourceIdentity:'payload:historical-build'}};
 const oldPlan = await provider.inspectProvisioningPlan(old);
 await provider.applyProvisioningPlan({...old,expectedPlanDigest:oldPlan.planDigest,confirm:true,cleanupPaths:[]});
 const target = path.join(f.home,'.arcforge/catalog/manual-skill/SKILL.md');
 const original = await readFile(target,'utf8');
 await skill(path.join(f.source,'entry/skills/manual-skill'),'manual-skill','Updated upstream');
 await skill(path.join(f.source,'entry/skills/arckit-spec'),'arckit-spec','Updated direct skill');
 let plan = await f.catalog.prepare();
 assert.equal(plan.installation.blocking.length,0);
 assert.equal(plan.installation.items.filter(i=>i.status==='replace-source').length,2);
 assert.equal(await readFile(target,'utf8'),original);
 await assert.rejects(f.catalog.install({planDigest:plan.installation.planDigest}),/确认/);
 await writeFile(target,original+'Local edit');
 const drift = await f.catalog.prepare();
 assert.ok(drift.installation.blocking.length);
 await assert.rejects(f.catalog.install({planDigest:plan.installation.planDigest,confirmed:true}),/变化/);
 assert.equal(await readFile(target,'utf8'),original+'Local edit');
 await writeFile(target,original);
 plan = await f.catalog.prepare();
 await skill(path.join(f.source,'entry/skills/manual-skill'),'manual-skill','Another upstream change');
 await assert.rejects(f.catalog.install({planDigest:plan.installation.planDigest,confirmed:true}),/变化/);
 plan = await f.catalog.prepare();
 const result = await f.catalog.install({planDigest:plan.installation.planDigest,confirmed:true});
 assert.equal(result.ready,true);
 assert.match(await readFile(target,'utf8'),/Another upstream change/);
 await rm(f.root,{recursive:true,force:true});
});
