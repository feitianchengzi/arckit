import test from 'node:test';
import assert from 'node:assert/strict';
import {execFile} from 'node:child_process';
import {promisify} from 'node:util';
import {mkdtemp,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {fileURLToPath} from 'node:url';
import electron from 'electron';
test('ordinary task creation remembers only successful selections across accounts and process restart', {
 skip:process.env.ARCORBIT_ELECTRON_CREATE_SETTINGS_TEST!=='1'&&'set ARCORBIT_ELECTRON_CREATE_SETTINGS_TEST=1', timeout:100_000
},async()=>{
 const profile=await mkdtemp(join(tmpdir(),'arcorbit-create-settings-profile-'));
 const output=process.env.ARCORBIT_TEST_OUTPUT||await mkdtemp(join(tmpdir(),'arcorbit-create-settings-output-'));
 try{
  for(const phase of ['exercise','restart']){
   const env={...process.env,ARCORBIT_CREATE_SETTINGS_PHASE:phase,ARCORBIT_CREATE_SETTINGS_PROFILE:profile,ARCORBIT_TEST_OUTPUT:join(output,phase),ELECTRON_DISABLE_SECURITY_WARNINGS:'true'};delete env.ELECTRON_RUN_AS_NODE;
   const {stdout}=await promisify(execFile)(electron,[fileURLToPath(new URL('./fixtures/task-creation-settings-electron.mjs',import.meta.url))],{env,timeout:45_000,maxBuffer:1024*1024});
   assert.equal(JSON.parse(stdout.trim()).status,'passed');
  }
 }finally{await rm(profile,{recursive:true,force:true,maxRetries:5,retryDelay:100});}
});
