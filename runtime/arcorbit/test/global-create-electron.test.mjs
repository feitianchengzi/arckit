import test from 'node:test';
import assert from 'node:assert/strict';
import {execFile} from 'node:child_process';
import {promisify} from 'node:util';
import {fileURLToPath} from 'node:url';
import electron from 'electron';
test('global quick creation uses the production form without leaving the current workspace', {
  skip:process.env.ARCORBIT_ELECTRON_GLOBAL_CREATE_TEST!=='1'&&'set ARCORBIT_ELECTRON_GLOBAL_CREATE_TEST=1',
  timeout:60_000
},async()=>{
  const env={...process.env,ELECTRON_DISABLE_SECURITY_WARNINGS:'true'};delete env.ELECTRON_RUN_AS_NODE;
  const {stdout}=await promisify(execFile)(electron,[fileURLToPath(new URL('./fixtures/global-create-electron.mjs',import.meta.url))],{env,timeout:55_000,maxBuffer:1024*1024});
  const result=JSON.parse(stdout.trim());assert.equal(result.status,'passed');assert.equal(result.checks.length,7);
});
