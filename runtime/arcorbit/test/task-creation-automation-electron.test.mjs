import test from 'node:test';
import assert from 'node:assert/strict';
import {execFile} from 'node:child_process';
import {promisify} from 'node:util';
import {fileURLToPath} from 'node:url';
import electron from 'electron';
import {join} from 'node:path';
test('creation Automation guidance uses current form and scoped background facts', {
  skip:process.env.ARCORBIT_ELECTRON_CREATE_AUTOMATION_TEST!=='1'&&'set ARCORBIT_ELECTRON_CREATE_AUTOMATION_TEST=1',
  timeout:60_000
},async()=>{
  const env={...process.env,ELECTRON_DISABLE_SECURITY_WARNINGS:'true'};delete env.ELECTRON_RUN_AS_NODE;
  if(env.ARCORBIT_TEST_OUTPUT)env.ARCORBIT_TEST_OUTPUT=join(env.ARCORBIT_TEST_OUTPUT,'automation-hint');
  const {stdout}=await promisify(execFile)(electron,[fileURLToPath(new URL('./fixtures/task-creation-automation-electron.mjs',import.meta.url))],{env,timeout:55_000,maxBuffer:1024*1024});
  const result=JSON.parse(stdout.trim());assert.equal(result.status,'passed');assert.equal(result.checks.length,4);
});
