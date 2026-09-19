import assert from 'node:assert/strict';
import {execFile} from 'node:child_process';
import {promisify} from 'node:util';
import {fileURLToPath} from 'node:url';
import electron from 'electron';
import test from 'node:test';
test('long Chat history avoids offscreen layout while preserving reading, streaming and old message actions',{
 skip:process.env.ARCORBIT_ELECTRON_CHAT_LAYOUT_TEST!=='1'&&'set ARCORBIT_ELECTRON_CHAT_LAYOUT_TEST=1'
},async()=>{
 const env={...process.env,ELECTRON_DISABLE_SECURITY_WARNINGS:'true'};delete env.ELECTRON_RUN_AS_NODE;
 const {stdout}=await promisify(execFile)(electron,[fileURLToPath(new URL('./fixtures/chat-switch-layout-electron.mjs',import.meta.url))],{env,timeout:20000});
 const r=JSON.parse(stdout.trim());
 const median=a=>a.sort((a,b)=>a-b)[Math.floor(a.length/2)];
 const baseline=median(r.samples.filter(s=>!s.defer).map(s=>s.dom_ms+s.layout_ms));
 const optimized=median(r.samples.filter(s=>s.defer).map(s=>s.dom_ms+s.layout_ms));
 assert.ok(optimized<baseline*.6,`long-history render ${optimized}ms vs baseline ${baseline}ms`);
 for(const sample of r.samples){assert.equal(sample.messages,500);assert.ok(Math.abs(sample.at_bottom)<2)}
 assert.equal(r.reading.restored.id,r.reading.before.id);
 assert.ok(Math.abs(r.reading.restored.offset-r.reading.before.offset)<2,JSON.stringify(r.reading));
 assert.equal(r.reading.afterStream.id,r.reading.restored.id);
 assert.ok(Math.abs(r.reading.afterStream.offset-r.reading.restored.offset)<2,JSON.stringify(r.reading));
 assert.equal(r.reading.afterAppend.id,r.reading.restored.id);
 assert.ok(Math.abs(r.reading.afterAppend.offset-r.reading.restored.offset)<2);
 assert.equal(r.reading.jumpVisible,true);
 assert.equal(r.history.count,501);assert.deepEqual(r.history.copied,['const old = 1;']);
 assert.deepEqual(r.history.approved,[['APPROVAL','accept']]);assert.deepEqual(r.history.opened,['https://example.com/docs']);
 assert.equal(r.history.searchable,true);assert.ok(Math.abs(r.bottomDistance)<2);assert.equal(r.userScrollTop,0);
 console.log(JSON.stringify({baseline_ms:baseline,optimized_ms:optimized,reading:r.reading}));
});
