import { traceStallOperation, tracedIpcHandler, installStallOperationSink } from '../src/desktop/stall-operations.mjs';
import { boundStallRecord } from '../src/desktop/stall-records.mjs';
import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, readdir, readFile, rm, writeFile } from 'node:fs/promises';
import { readdirSync, readFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { setTimeout as delay } from 'node:timers/promises';
import { createStallRecords, writeStallRecord } from '../src/desktop/stall-records.mjs';
import { createStallMonitor } from '../src/desktop/stall-monitor.mjs';

async function fixture(t) {
  const directory = await mkdtemp(join(tmpdir(), 'arcorbit-stall-'));
  t.after(() => rm(directory, { recursive: true, force: true }));
  return directory;
}
const incident = id => ({ schema: 'arcorbit-stall/v1', id: `stall-${id}`, started_at: '2026-11-05T00:00:00Z', source: 'renderer', recovered_at: '2026-11-05T00:00:05Z', max_heartbeat_gap_ms: 2500 });
async function until(fn, timeout = 5000) {
  const start = Date.now();
  while (Date.now() - start < timeout) { const result = await fn(); if (result) return result; await delay(30); }
  throw new Error('condition timed out');
}

test('watchdog writes during a real blocked main event loop, with fresh recovery diagnostics', async t => {
  const directory = await fixture(t);
  const monitor = createStallMonitor({ directory, version: 'test', getMetrics: () => [{ pid: 1, type: 'Browser', cpu: { percentCPUUsage: 12 }, memory: { workingSetSize: 200 } }], timing: { thresholdMs: 150, tickMs: 25, recoveryMs: 120 } });
  t.after(() => monitor.close());
  await delay(300);
  function simulatedMainWork() { const end = Date.now() + 500; while (Date.now() < end) { /* intentional main-thread stall */ } }
  traceStallOperation('test.main.parse', simulatedMainWork, { chars: 123456 });
  // Synchronous read before yielding proves the worker wrote while main was blocked.
  const names = readdirSync(directory).filter(n => n.endsWith('.json'));
  assert.equal(names.length, 1);
  const during = JSON.parse(readFileSync(join(directory, names[0]), 'utf8'));
  assert.equal(during.source, 'main'); assert.equal(during.recovered_at, null);
  const reports = await until(async () => { const r = await monitor.pending(); return r.length && r[0].content.includes('metrics_after') && r; });
  const recovered = JSON.parse(await readFile(join(directory, names[0]), 'utf8'));
  assert.ok(recovered.recovered_at); assert.ok(recovered.max_heartbeat_gap_ms >= 150);
  assert.equal(recovered.metrics_before.processes[0].cpu_percent, 12);
  assert.equal(reports.length, 1);
  assert.equal(recovered.schema, 'arcorbit-stall/v2');
  assert.ok(Date.parse(recovered.metrics_after.at) >= Date.parse(recovered.recovered_at));
  assert.ok(Date.parse(recovered.first_responsive_at) < Date.parse(recovered.recovered_at));
  assert.ok(recovered.metrics_after.main_memory_bytes.heap_used > 0);
  assert.ok(recovered.metrics_after.main_memory_bytes.external >= 0);
  assert.equal(recovered.cpu_profile.status, 'captured');
  assert.ok(recovered.cpu_profile.top.some(item => item.stack.some(frame => frame.fn === 'simulatedMainWork')), JSON.stringify(recovered.cpu_profile));
  assert.ok(recovered.operations.some(x => x.name === 'test.main.parse' && x.duration_ms >= 450 && x.chars === 123456));
});

test('renderer heartbeats detect hangs; hidden renderer and sleep are excluded', async t => {
  const directory = await fixture(t);
  const monitor = createStallMonitor({ directory, version: 'test', timing: { thresholdMs: 150, tickMs: 25, recoveryMs: 100 } });
  t.after(() => monitor.close());
  monitor.rendererBeat(false); await delay(350);
  assert.equal((await monitor.pending()).length, 0);
  monitor.suspend(); monitor.rendererBeat(true); await delay(350); monitor.resume();
  await delay(250); assert.equal((await monitor.pending()).length, 0);
  monitor.rendererBeat(true); await delay(300);
  assert.deepEqual(await monitor.pending(), []);
  const timer = setInterval(() => monitor.rendererBeat(true), 25); t.after(() => clearInterval(timer));
  const reports = await until(async () => { const r = await monitor.pending(); return r.length && r; });
  assert.equal(reports[0].source, 'renderer');
});

test('operation tracing preserves sync/async results and failures without argument contents', async () => {
  const events = [], stop = installStallOperationSink(event => events.push(event));
  try {
    const sync = tracedIpcHandler('chat-read', (_event, secret) => secret);
    assert.equal(sync({}, 'private chat body'), 'private chat body');
    const asyncHandler = tracedIpcHandler('chat-load', async () => 42);
    assert.equal(await asyncHandler({}), 42);
    assert.throws(() => traceStallOperation('read', () => { throw new Error('private path'); }), /private path/);
    await assert.rejects(traceStallOperation('write', async () => { throw new Error('private body'); }), /private body/);
    assert.equal(events.filter(x => x.phase === 'end').length, 4);
    assert.equal(events.filter(x => x.status === 'error').length, 2);
    assert.ok(!JSON.stringify(events).includes('private'));
  } finally { stop(); }
});

test('rich records stay bounded with explicit omission counts, and legacy records remain readable', async t => {
  const directory = await fixture(t);
  const rich = { ...incident('rich'), schema: 'arcorbit-stall/v2', cpu_profile: { status: 'captured', top: Array.from({length:6}, () => ({self_ms:100, stack:Array.from({length:5}, () => ({fn:'f'.repeat(90),file:'p'.repeat(140),line:1}))})) }, operations:Array.from({length:12}, (_,id) => ({id,name:'n'.repeat(100),started_at:'2026-11-05T00:00:00Z',duration_ms:123})), gc:{events:[]} };
  const bounded = boundStallRecord(rich);
  assert.ok(JSON.stringify(bounded).length <= 8000);
  assert.ok(bounded.omitted.cpu_stacks + bounded.omitted.operations > 0);
  await writeStallRecord(directory, rich); await writeStallRecord(directory, incident('legacy'));
  const records = createStallRecords({directory});
  const reports = await records.list(); assert.equal(reports.length, 2);
  assert.ok(reports.every(x=>x.content.length <= 9000));
});

test('real GC observations and Buffer/heap accounting survive a main-thread stall', async t => {
  const directory = await fixture(t);
  const { execFile } = await import('node:child_process');
  const { promisify } = await import('node:util');
  const moduleUrl = new URL('../src/desktop/stall-monitor.mjs', import.meta.url).href;
  const script = `
    import {createStallMonitor} from ${JSON.stringify(moduleUrl)};
    import {setTimeout as delay} from 'node:timers/promises';
    import {readdir,readFile} from 'node:fs/promises';
    import {join} from 'node:path';
    const directory=${JSON.stringify(directory)};
    const monitor=createStallMonitor({directory,version:'gc-test',timing:{thresholdMs:150,tickMs:25,recoveryMs:100}});
    try {
      await delay(350);
      globalThis.buffer=Buffer.alloc(8*1024*1024,1);
      function allocateAndCollect(){const end=Date.now()+500;while(Date.now()<end){let a=new Array(10000).fill(123);global.gc();}}
      allocateAndCollect();
      let found=false;
      for(let i=0;i<100;i++){await delay(30);if((await monitor.pending()).length){found=true;break;}}
      if(!found) throw Error('no recovered record');
      const file=(await readdir(directory)).find(x=>x.endsWith('.json'));
      const record=JSON.parse(await readFile(join(directory,file),'utf8'));
      console.log(JSON.stringify({gc:record.gc,memory:record.metrics_after.main_memory_bytes}));
    } finally {await monitor.close();}
  `;
  const scriptPath = join(directory, 'gc-probe.mjs');
  await writeFile(scriptPath, script);
  const {stdout} = await promisify(execFile)(process.execPath, ['--expose-gc', scriptPath], {timeout:15000});
  const result=JSON.parse(stdout.trim());
  assert.ok(result.gc.count > 0); assert.ok(result.gc.total_duration_ms > 0);
  assert.ok(result.gc.events.every(x=>Number.isFinite(x.kind) && Number.isFinite(x.duration_ms)));
  assert.ok(result.memory.array_buffers >= 8*1024*1024); assert.ok(result.memory.heap_used > 0);
});

test('a failed recovery sample is explicitly unavailable, never substituted with the old sample', async t => {
  const directory = await fixture(t); let samples = 0;
  const monitor = createStallMonitor({directory,version:'failure-test',getMetrics:()=>{ if(samples++) throw Error('sample unavailable'); return []; },timing:{thresholdMs:150,tickMs:25,recoveryMs:100}});
  t.after(()=>monitor.close()); await delay(300);
  const end=Date.now()+400;while(Date.now()<end){}
  await until(async()=> (await monitor.pending()).length);
  const record=JSON.parse(await readFile(join(directory,(await readdir(directory)).find(x=>x.endsWith('.json'))),'utf8'));
  assert.ok(record.metrics_before); assert.equal(record.metrics_after,null);
  assert.equal(record.recovery_sample_status,'unavailable');
});

test('diagnostics aggregate ranges, preserve evidence through analysis and clear only viewed finalized bytes', async t => {
  const directory = await fixture(t), now = Date.parse('2026-11-06T00:00:00Z');
  const records=createStallRecords({directory,now:()=>now});
  await writeStallRecord(directory,incident('first'));
  await writeStallRecord(directory,{...incident('old'),started_at:'2026-11-03T00:00:00Z'});
  await writeStallRecord(directory,{...incident('active'),recovered_at:null});
  await writeFile(join(directory,'stall-corrupt.json'),'{');
  const view=await records.overview('24h');
  assert.equal(view.count,2);assert.equal(view.unreadable,1);
  assert.equal((await records.overview('all')).count,3);
  const analysis=await records.analysis('all');
  assert.match(analysis.text,/不创建待办/);
  assert.ok(analysis.text.includes(directory));
  assert.ok(!analysis.text.includes('stall-old'));assert.equal((await records.list()).length,3);
  assert.ok(!(await readdir(directory)).includes('analyses'));
  await writeStallRecord(directory,{...incident('first'),max_heartbeat_gap_ms:9000});
  await writeStallRecord(directory,incident('new'));
  const result=await records.clear(view.records.map(r=>r.token), ['stall-active']);
  assert.equal(result.deleted,0);assert.equal(result.retained,1);
  assert.match(analysis.text,/全部留存记录，截至 2026-11-06T00:00:00.000Z/);
  const updated=await records.overview('24h');
  assert.equal((await records.clear(updated.records.map(r=>r.token), ['stall-active'])).deleted,2);
  assert.equal((await records.overview('all')).count,2);
  const stale=await records.overview('all');
  assert.equal((await records.clear(stale.records.map(r=>r.token))).deleted,2); // crash leftovers are removable
  await assert.rejects(records.overview('invalid'),/无效/);
});

test('retention prunes expired/oldest records without touching unknown files and bounds large analysis context', async t => {
  const directory=await fixture(t), now=Date.parse('2026-11-06T00:00:00Z');
  await writeStallRecord(directory,{...incident('expired'),started_at:'2026-10-01T00:00:00Z',recovered_at:'2026-10-01T00:00:05Z'});
  await writeStallRecord(directory,incident('recent'));
  await writeStallRecord(directory,{...incident('newest'),started_at:'2026-11-05T23:00:00Z'});
  await writeFile(join(directory,'unrelated.txt'),'keep');
  const records=createStallRecords({directory,now:()=>now,maxBytes:250});
  await records.prune();
  assert.deepEqual((await records.overview('all')).records.map(r=>r.id),['stall-newest']);
  assert.equal(await readFile(join(directory,'unrelated.txt'),'utf8'),'keep');
  for(let i=0;i<20;i++) await writeStallRecord(directory,{...incident(`many-${i}`),extra:'x'.repeat(4000)});
  const analysis=await records.analysis('all');
  assert.ok(analysis.text.length<2000);assert.doesNotMatch(analysis.text,/extra|many-0/);
  assert.equal((await records.list()).length,21);
  assert.ok(!(await readdir(directory)).includes('analyses'));
});

test('diagnostic IPC validates renderer identity and contains no task prompt or submission', async () => {
  const {runInNewContext}=await import('node:vm');
  const source=await readFile(new URL('../desktop/main.mjs',import.meta.url),'utf8');
  const handlers=new Map(), calls=[];
  const start=source.indexOf("  handle('arckit:stall-overview'");
  const end=source.indexOf('\n',source.indexOf("  handle('arckit:stall-clear'",start));
  runInNewContext(source.slice(start,end),{handle:(name,fn)=>handlers.set(name,fn),assertMainRenderer:event=>{if(event!=='trusted')throw Error('denied');},stallMonitor:{overview:r=>calls.push(['overview',r]),analysis:r=>calls.push(['analysis',r]),promptSettings:()=>calls.push(['prompt']),savePrompt:t=>calls.push(['prompt-save',t]),clear:t=>calls.push(['clear',t])}});
  for(const [name,handler] of handlers) {assert.throws(()=>handler('other','all'),/denied/);handler('trusted','all');}
  assert.equal(calls.length,5);
  const renderer=await readFile(new URL('../desktop/renderer/renderer.js',import.meta.url),'utf8');
  assert.doesNotMatch(source+renderer,/offerStallTask|createStallTask|startStallPrompts|stall-offer|stall-create-task/);
});


test('analysis passes an absolute directory and fixed UTC bounds without reading or writing logs', async t => {
  const directory = join(await fixture(t), 'does-not-exist');
  let calls = 0;
  const records = createStallRecords({directory, now:()=>Date.parse('2026-11-15T13:00:00Z') + calls++ * 1000});
  const day = await records.analysis('24h');
  assert.match(day.text, /2026-11-14T13:00:00.000Z 至 2026-11-15T13:00:00.000Z/);
  assert.match(day.text, /started_at/);
  const week = await records.analysis('7d');
  assert.match(week.text, /2026-11-08T13:00:01.000Z 至 2026-11-15T13:00:01.000Z/);
  await assert.rejects(records.analysis('invalid'), /无效/);
  await assert.rejects(readdir(directory), {code:'ENOENT'});
});
