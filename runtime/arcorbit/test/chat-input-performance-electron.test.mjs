import assert from 'node:assert/strict';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { fileURLToPath } from 'node:url';
import electron from 'electron';
import test from 'node:test';
const execFileAsync=promisify(execFile);
test('Chat typing does not repaint native lists or restart slow catalog queries',{
 skip:process.env.ARCORBIT_ELECTRON_CHAT_INPUT_TEST!=='1'&&'set ARCORBIT_ELECTRON_CHAT_INPUT_TEST=1 to run real Electron input regression'
},async()=>{
 const env={...process.env,ARCORBIT_CHAT_STREAM_PERFORMANCE_FIXTURE:'1',ELECTRON_DISABLE_SECURITY_WARNINGS:'true'};
 delete env.ELECTRON_RUN_AS_NODE;
 const {stdout}=await execFileAsync(electron,[fileURLToPath(new URL('./fixtures/chat-input-performance-electron.mjs',import.meta.url))],{env,timeout:25000});
 const result=JSON.parse(stdout.trim());
 assert.equal(result.identity_mutations,0);
 assert.equal(result.slow_request_calls,1);
 assert.equal(result.task_list_present,false);
 assert.equal(result.calls_from_typing_after_idle,0);
 assert.equal(result.catalog_calls_from_stream,0);
 assert.equal(result.draft_saved,true);
 assert.ok(result.elapsed_ms<150,`100 inputs took ${result.elapsed_ms} ms`);
 assert.equal(result.draft,'中'.repeat(100)+'文字中文');
 console.log(JSON.stringify(result));
});
