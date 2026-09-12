import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, mkdir, writeFile, rm } from 'node:fs/promises';
import path from 'node:path';
import { tmpdir } from 'node:os';
import { JsonRpcStdioClient } from '../src/json-rpc-stdio-client.mjs';
import { configureCodexSceneSkills } from '../src/codex-scene-skills.mjs';
import { digest, readSkill } from '../src/skill-files.mjs';

test('real Codex discovers individual roots and honors canonical enablement paths', { skip: process.env.ARCORBIT_CODEX_DISCOVERY_TEST !== '1' }, async () => {
 const root=await mkdtemp(path.join(tmpdir(),'scene-discovery-')),home=path.join(root,'home'),native=path.join(home,'skills/scene-domain'),extra=path.join(root,'selected/scene-domain');
 for(const folder of [native,extra]){await mkdir(folder,{recursive:true});await writeFile(path.join(folder,'SKILL.md'),'---\nname: scene-domain\ndescription: Scene discovery fixture\n---\nFixture');}
 const start=async(args=[])=>{const client=new JsonRpcStdioClient({command:'codex',args:['app-server',...args],cwd:root,env:{...process.env,CODEX_HOME:home},stderr:'ignore'});await client.request('initialize',{clientInfo:{name:'scene-discovery',version:'1'},capabilities:{experimentalApi:true}});return client;};
 let client;
 try {
  client=await start();const selected=await readSkill(extra);
  const body={schema_version:'arcorbit-scene-skill-binding/v1',scene:'chat',skills:[{...selected,id:'local:fixture',source:'local'}],managedNames:['scene-domain'],disabledPaths:[native]};
  const configured=await configureCodexSceneSkills(client,root,{...body,fingerprint:digest(JSON.stringify(body))});
  // Assert thread/start really parses the dotted override rather than ignoring it.
  await assert.rejects(client.request('thread/start',{cwd:root,ephemeral:true,config:{'skills.config':42}}),/expected a sequence/);
  const thread=await client.request('thread/start',{cwd:root,ephemeral:true,config:configured.config});assert.ok(thread.thread.id);
  client.close();
  const toml='skills.config=['+configured.config['skills.config'].map(x=>`{path=${JSON.stringify(x.path)},enabled=${x.enabled}}`).join(',')+']';
  client=await start(['-c',toml]);await client.request('skills/extraRoots/set',{extraRoots:[selected.path]});
  const listed=await client.request('skills/list',{cwds:[root],forceReload:true}),skills=listed.data[0].skills.filter(x=>x.name==='scene-domain');
  assert.equal(skills.find(x=>x.path===selected.skillPath)?.enabled,true);
  assert.ok(skills.some(x=>x.path!==selected.skillPath&&x.enabled===false),'native shadow must be disabled');
 } finally {client?.close();await rm(root,{recursive:true,force:true});}
});
