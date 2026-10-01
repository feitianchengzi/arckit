import test from 'node:test';
import assert from 'node:assert/strict';
import {execFile} from 'node:child_process';
import {promisify} from 'node:util';
import {fileURLToPath} from 'node:url';
import electron from 'electron';
test('Auto keeps stable conversation buttons and opens its own shared transcript without sync',{
 skip:process.env.ARCORBIT_AUTO_CONVERSATION_TEST!=='1'&&'set ARCORBIT_AUTO_CONVERSATION_TEST=1'
},async()=>{
 const env={...process.env,ELECTRON_DISABLE_SECURITY_WARNINGS:'true'};delete env.ELECTRON_RUN_AS_NODE;
 const {stdout}=await promisify(execFile)(electron,[fileURLToPath(new URL('./fixtures/automation-conversation-electron.mjs',import.meta.url))],{env,timeout:30000,maxBuffer:1024*1024});
 assert.equal(JSON.parse(stdout.trim()).status,'passed');
});
