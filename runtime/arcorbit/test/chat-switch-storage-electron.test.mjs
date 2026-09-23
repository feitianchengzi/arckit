import assert from 'node:assert/strict';
import {execFile} from 'node:child_process';
import {promisify} from 'node:util';
import {fileURLToPath} from 'node:url';
import electron from 'electron';
import test from 'node:test';
test('real storage, IPC and Chat shell switch long histories while flushing Chinese drafts',{
 skip:process.env.ARCORBIT_ELECTRON_CHAT_SWITCH_TEST!=='1'&&'set ARCORBIT_ELECTRON_CHAT_SWITCH_TEST=1'
},async()=>{
 const env={...process.env,ARCORBIT_CHAT_STREAM_PERFORMANCE_FIXTURE:'1',ARCORBIT_CHAT_SWITCH_STORAGE_FIXTURE:'1',ELECTRON_DISABLE_SECURITY_WARNINGS:'true'};delete env.ELECTRON_RUN_AS_NODE;
 const {stdout}=await promisify(execFile)(electron,[fileURLToPath(new URL('./fixtures/chat-switch-storage-electron.mjs',import.meta.url))],{env,timeout:20000});
 const r=JSON.parse(stdout.trim());
 assert.equal(r.fullReads,0);assert.equal(r.fullWrites,0);assert.equal(r.partitions_unchanged,true);
 assert.deepEqual(r.saved_drafts,['切换前中文草稿','切换前中文草稿']);
 assert.equal(r.drafts.length,4);assert.ok(r.drafts.every(d=>d.response==='ack'));
 assert.deepEqual(r.renderer.map(s=>s.messages),[500,1,500,1]);
 for(const s of r.renderer){assert.ok(s.visible_ms<250,JSON.stringify(s));assert.ok(s.settled_ms<350,JSON.stringify(s));assert.ok(Math.abs(s.bottom)<2,JSON.stringify(s))}
 assert.ok(r.max_main_loop_delay_ms<100,JSON.stringify(r));
 console.log(JSON.stringify({renderer:r.renderer,backend:r.selections,max_main_loop_delay_ms:r.max_main_loop_delay_ms}));
});
