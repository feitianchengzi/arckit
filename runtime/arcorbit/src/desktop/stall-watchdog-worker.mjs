import { parentPort, workerData } from 'node:worker_threads';
import { randomUUID } from 'node:crypto';
import { performance } from 'node:perf_hooks';
import { writeStallRecord, createStallRecords } from './stall-records.mjs';
import { createStallProfiler } from './stall-profiler.mjs';

const { directory, version, platform, arch, osRelease, runtimeVersions, thresholdMs = 2000, tickMs = 250, recoveryMs = 3000 } = workerData;
const profiler = createStallProfiler();
let mainBeat = performance.now(), rendererBeat = 0, rendererActive = false;
let suspended = false, lastTick = performance.now(), healthySince = 0, lastMetrics = null;
let incident = null, lastWrite = 0, writes = Promise.resolve(), finalizing = 0;
const operations = new Map(), sampleRequests = new Map();
const records = createStallRecords({directory});
const finalizingIds = new Set();
function prune() { writes = writes.then(()=>records.prune()).catch(error=>parentPort.postMessage({type:'error',code:error.code || error.name})); }
prune();
setInterval(prune, 60000).unref();
parentPort.on('message', message => {
  if(message.type !== 'clear') return;
  writes = writes.then(async()=> {
    try { parentPort.postMessage({type:'clear-result',id:message.id,result:await records.clear(message.tokens, [incident?.id, ...finalizingIds])}); }
    catch(error) {parentPort.postMessage({type:'clear-result',id:message.id,error:error.message});}
  });
});

function persist(record = incident) {
  const copy = structuredClone(record);
  writes = writes.then(() => writeStallRecord(directory, copy)).catch(error => {
    parentPort.postMessage({ type: 'error', code: error.code || error.name });
  });
  return writes;
}
function reset() { mainBeat = performance.now(); rendererBeat = 0; rendererActive = false; healthySince = 0; }
function recentOperations(start) {
  return [...operations.values()].filter(x => !x.ended_at || Date.parse(x.ended_at) >= Date.parse(start) - 10000)
    .sort((a, b) => Number(!b.ended_at) - Number(!a.ended_at) || (b.duration_ms || 0) - (a.duration_ms || 0)).slice(0, 12);
}
function requestRecoverySample(id) {
  return new Promise(resolve => {
    const timer = setTimeout(() => { sampleRequests.delete(id); resolve(null); }, 2500);
    sampleRequests.set(id, value => { clearTimeout(timer); sampleRequests.delete(id); resolve(value); });
    parentPort.postMessage({ type: 'sample', request_id: id });
  });
}
async function finalize(record) {
  finalizing++; finalizingIds.add(record.id);
  try {
    const [after, profile] = await Promise.all([
      requestRecoverySample(record.id),
      profiler.capture(record.started_at, record.last_responsive_at || record.first_responsive_at || record.recovered_at)
    ]);
    record.metrics_after = after;
    record.recovery_sample_status = after ? 'captured' : 'unavailable';
    record.cpu_profile = profile;
    record.operations = recentOperations(record.started_at);
    const gc = (after?.gc_events || []).filter(x => Date.parse(x.at) >= Date.parse(record.started_at) - 1000);
    record.gc = { scope: 'main_v8', summary_scope: 'count/duration/max describe retained events; sample_interval_totals include events evicted from the ring',
      sample_interval_totals: after && record.metrics_before?.gc_totals ? { from: record.metrics_before.at, to: after.at, count: after.gc_totals.count - record.metrics_before.gc_totals.count, duration_ms: Math.round((after.gc_totals.duration_ms - record.metrics_before.gc_totals.duration_ms) * 100) / 100 } : null, delivery: 'observer callbacks run after the event loop resumes', count: gc.length,
      total_duration_ms: Math.round(gc.reduce((sum, x) => sum + x.duration_ms, 0) * 100) / 100,
      max_duration_ms: Math.max(0, ...gc.map(x => x.duration_ms)), events: gc.slice(-8), events_omitted: Math.max(0, gc.length - 8), retained_event_limit: 64 };
    if (record.metrics_after) delete record.metrics_after.gc_events;
    await persist(record);
  } finally { finalizing--; finalizingIds.delete(record.id); }
}
parentPort.on('message', message => {
  if (message.type === 'health') writes.then(() => parentPort.postMessage({ type: 'health', id: message.id, healthy: !suspended && !incident && !finalizing && healthySince > 0 && performance.now() - healthySince >= recoveryMs && performance.now() - mainBeat < thresholdMs && (!rendererActive || performance.now() - rendererBeat < thresholdMs) }));
  if (message.type === 'main') mainBeat = performance.now();
  if (message.type === 'renderer') { rendererBeat = performance.now(); rendererActive = message.active === true; }
  if (message.type === 'metrics') {
    if (message.value) lastMetrics = message.value;
    if (message.request_id) sampleRequests.get(message.request_id)?.(message.value);
  }
  if (message.type === 'operation') {
    operations.set(message.value.id, message.value);
    while (operations.size > 128) operations.delete(operations.keys().next().value);
  }
  if (message.type === 'suspend') { suspended = true; reset(); }
  if (message.type === 'resume') { suspended = false; reset(); }
  if (message.type === 'renderer-reset') { rendererActive = false; rendererBeat = 0; }
  if (message.type === 'close') { profiler.close(); }
});
setInterval(() => {
  const now = performance.now(), tickGap = now - lastTick; lastTick = now;
  if (suspended || tickGap > Math.max(5000, thresholdMs * 3)) { reset(); return; }
  const mainDelay = now - mainBeat;
  const rendererDelay = rendererActive && rendererBeat ? now - rendererBeat : 0;
  const delay = Math.max(mainDelay, rendererDelay);
  if (delay >= thresholdMs) {
    if (incident && healthySince) incident.recovery_interruptions++;
    healthySince = 0;
    if (!incident) {
      incident = { schema: 'arcorbit-stall/v2', id: `stall-${Date.now()}-${randomUUID()}`,
        started_at: new Date(Date.now() - delay).toISOString(), detected_at: new Date().toISOString(),
        first_responsive_at: null, last_responsive_at: null, recovery_interruptions: 0, recovered_at: null, source: mainDelay >= thresholdMs ? 'main' : 'renderer',
        threshold_ms: thresholdMs, max_heartbeat_gap_ms: Math.round(delay),
        max_main_heartbeat_gap_ms: Math.round(mainDelay), max_renderer_heartbeat_gap_ms: Math.round(rendererDelay),
        renderer_heartbeat_relay: 'via_main; main blockage can delay both',
        version, platform, arch, os_release: osRelease, runtime_versions: runtimeVersions,
        metrics_before: lastMetrics ? { ...lastMetrics, gc_events: undefined } : null, metrics_after: null,
        cpu_profile: { status: 'pending', target: 'main' }, operations: recentOperations(new Date().toISOString()),
        note: 'Observations, not root cause. Profile samples target main V8, not renderer/native stacks. Operation names/counts only; no arguments, chat text or file contents.' };
      persist(); lastWrite = now;
      parentPort.postMessage({ type: 'sample' });
    }
    if (mainDelay >= thresholdMs) incident.source = 'main';
    incident.max_main_heartbeat_gap_ms = Math.max(incident.max_main_heartbeat_gap_ms, Math.round(mainDelay));
    incident.max_renderer_heartbeat_gap_ms = Math.max(incident.max_renderer_heartbeat_gap_ms, Math.round(rendererDelay));
    incident.max_heartbeat_gap_ms = Math.max(incident.max_heartbeat_gap_ms, Math.round(delay));
    if (now - lastWrite >= 5000) { persist(); lastWrite = now; }
  } else {
    if (!healthySince) {
      healthySince = now;
      if (incident) { incident.last_responsive_at = new Date().toISOString(); incident.first_responsive_at ||= incident.last_responsive_at; }
    }
    if (now - healthySince >= recoveryMs && incident) {
      incident.recovered_at = new Date().toISOString();
      const completed = incident; incident = null;
      void finalize(completed).catch(error => parentPort.postMessage({ type: 'error', code: error.code || error.name }));
    }
  }
}, tickMs);
