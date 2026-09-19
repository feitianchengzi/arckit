import assert from 'node:assert/strict';
import test from 'node:test';
import {execFile} from 'node:child_process';
import {promisify} from 'node:util';
import {fileURLToPath} from 'node:url';
import electron from 'electron';
test('real Electron autosave uses real metadata persistence without transferring or copying history',{
 skip:process.env.ARCORBIT_ELECTRON_CHAT_DRAFT_TEST!=='1'&&'set ARCORBIT_ELECTRON_CHAT_DRAFT_TEST=1'
},async()=>{
 const env={...process.env,ARCORBIT_CHAT_DRAFT_STORAGE_FIXTURE:'1',ARCORBIT_CHAT_STREAM_PERFORMANCE_FIXTURE:'1',ELECTRON_DISABLE_SECURITY_WARNINGS:'true'};delete env.ELECTRON_RUN_AS_NODE;
 const {stdout}=await promisify(execFile)(electron,[fileURLToPath(new URL('./fixtures/chat-draft-storage-electron.mjs',import.meta.url))],{env,timeout:25000});
 const r=JSON.parse(stdout.trim());console.log(JSON.stringify(r));
 assert.equal(r.saves.length,4);assert.ok(r.saves.every(x=>x.response==='ack'&&x.bytes<200));
 assert.equal(r.fullReads,0);assert.equal(r.fullWrites,0);assert.equal(r.history_unchanged,true);assert.equal(r.draft,'中文草稿保留');
 assert.ok(r.saves.every(x=>x.ms<200));assert.ok(r.max_main_loop_delay_ms<150);
});
