import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp,mkdir,writeFile,chmod,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join,delimiter} from 'node:path';
import {buildCommandEnvironment,runLocalCommand,redactCommandText} from '../src/local-command-runtime.mjs';
import {inspectProductEnvironment} from '../src/product-environment.mjs';

test('CLI environment includes common installs; discovery and actual execution share a selected executable without changing the parent PATH',async t=>{
 const parent=process.env.PATH,root=await mkdtemp(join(tmpdir(),'idea-cli-'));t.after(()=>rm(root,{recursive:true,force:true}));
 const bin=join(root,'bin');await mkdir(bin);const gh=join(bin,'gh');await writeFile(gh,'#!/bin/sh\ncase "$2" in user) echo \'{"login":"verified-user"}\';; *) echo \'[{"login":"verified-org"}]\';; esac\n');await chmod(gh,0o755);
 const env=buildCommandEnvironment({PATH:'/usr/bin:/bin'},{pathEntries:[bin]});assert.ok(env.PATH.split(delimiter).includes('/usr/local/bin'));
 const result=await inspectProductEnvironment({}, {env,includeGithub:true,run:(b,a,o)=>runLocalCommand(b,a,{...o,env})});
 assert.equal(result.github.login,'verified-user');assert.equal(result.command_environment.executables.gh,gh);assert.ok(result.diagnostics.every(d=>d.executable===gh&&d.exit_code===0));
 assert.equal(JSON.parse(await runLocalCommand('gh',['api','user'],{env})).login,'verified-user');assert.equal(process.env.PATH,parent);
});
test('process failures retain launch code, nonzero exit, timeout and redact environment secrets',async()=>{
 await assert.rejects(runLocalCommand('/nonexistent-arcorbit-command',[]),e=>e.diagnostic.exit_code===null&&e.diagnostic.error_code==='ENOENT');
 await assert.rejects(runLocalCommand(process.execPath,['-e','process.stderr.write(process.env.GH_TOKEN);process.exit(7)'],{env:{...process.env,GH_TOKEN:'private-test-value'}}),e=>e.diagnostic.exit_code===7&&!JSON.stringify(e.diagnostic).includes('private-test-value')&&!e.message.includes('private-test-value'));
 await assert.rejects(runLocalCommand(process.execPath,['-e','setTimeout(()=>{},10000)'],{timeout:50}),e=>e.diagnostic.timed_out===true&&e.diagnostic.exit_code===null);
 assert.doesNotMatch(redactCommandText('https://name:password@example.com/?token=abcd\nAuthorization: Bearer abcdef\nghp_exampleprivatevalue'),/password|abcd|abcdef|exampleprivatevalue/);
});
test('Git root, path, origin, account and organizations retain independent facts and failures',async()=>{
 const result=await inspectProductEnvironment({material_path:'/nonexistent-idea-dir'}, {includeGithub:true,run:async(bin,args)=>{
  if(args.includes('rev-parse'))return '/nonexistent-idea-dir';
  if(args.includes('get-url'))throw Object.assign(new Error('origin missing'),{code:2,stderr:'No such remote'});
  if(args[1]==='user')return '{"login":"signed-in","token":"must-not-leak"}';
  throw Object.assign(new Error('network failed'),{code:1,stderr:'connection timed out'});
 }});
 assert.equal(result.git.status,'repository');assert.equal(result.github.status,'authenticated');assert.equal(result.github.owners.length,1);
 assert.ok(result.diagnostics.some(d=>d.stage==='git.path'&&d.error_code==='ENOENT'));assert.ok(result.diagnostics.some(d=>d.stage==='git.origin'&&d.exit_code===2));assert.ok(result.diagnostics.some(d=>d.stage==='github.organizations'&&d.exit_code===1));assert.doesNotMatch(JSON.stringify(result),/must-not-leak/);
});
test('missing command does not become unauthenticated; malformed API output has its own stage and bounded redacted errors',async()=>{
 const missing=await inspectProductEnvironment({}, {includeGithub:true,run:async()=>{throw Object.assign(new Error('spawn gh ENOENT'),{code:'ENOENT'});}});
 assert.equal(missing.github.status,'unavailable');assert.equal(missing.diagnostics[0].error_code,'ENOENT');assert.doesNotMatch(missing.github.notice,/完成.*登录.*重试/);
 const malformed=await inspectProductEnvironment({}, {includeGithub:true,run:async()=>'{broken-token-private'});
 assert.equal(malformed.diagnostics.at(-1).stage,'github.user-format');assert.doesNotMatch(JSON.stringify(malformed),/broken-token-private/);
});
