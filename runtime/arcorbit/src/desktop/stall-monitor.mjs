import { PerformanceObserver, performance } from 'node:perf_hooks';
import { installStallOperationSink } from './stall-operations.mjs';
import { release } from 'node:os';
import { Worker } from 'node:worker_threads';
import { createStallRecords } from './stall-records.mjs';

export function createStallMonitor({ directory, version, platform = process.platform, arch = process.arch, getMetrics, timing = {} }) {
  const records = createStallRecords({ directory });
  const worker = new Worker(new URL('./stall-watchdog-worker.mjs', import.meta.url), {
    workerData: { directory, version, platform, arch, osRelease: release(), runtimeVersions: { electron: process.versions.electron || null, chrome: process.versions.chrome || null, node: process.versions.node }, ...timing }
  });
  let stopped = false, nextQuery = 0;
  const queries = new Map();
  worker.on('message', message => {
    if (message.type === 'clear-result') queries.get(message.id)?.(message);
    if (message.type === 'sample') sample(message.request_id);
    if (message.type === 'health') queries.get(message.id)?.(message.healthy);
    if (message.type === 'error') console.error('ArcOrbit stall recording failed:', message.code);
  });
  worker.on('error', error => { console.error('ArcOrbit stall watchdog failed:', error.message); });
  const send = message => { if (!stopped) worker.postMessage(message); };
  const removeSink = installStallOperationSink(value => send({ type: 'operation', value }));
  const gcEvents = [];
  const gcTotals = { count: 0, duration_ms: 0 };
  const gcObserver = new PerformanceObserver(list => {
    for (const entry of list.getEntries()) { gcTotals.count++; gcTotals.duration_ms += entry.duration; gcEvents.push({ at: new Date(performance.timeOrigin + entry.startTime).toISOString(), duration_ms: Math.round(entry.duration * 100) / 100, kind: entry.detail?.kind, flags: entry.detail?.flags }); }
    if (gcEvents.length > 64) gcEvents.splice(0, gcEvents.length - 64);
  });
  gcObserver.observe({ entryTypes: ['gc'] });
  const heartbeat = setInterval(() => send({ type: 'main' }), timing.tickMs || 250);
  function sample(requestId) {
    try {
      const processes = (getMetrics?.() || []).map(p => ({ pid: p.pid, type: p.type,
        cpu_percent: Math.round((p.cpu?.percentCPUUsage || 0) * 10) / 10,
        working_set_kb: p.memory?.workingSetSize || 0 })).sort((a, b) => b.cpu_percent - a.cpu_percent).slice(0, 6);
      const memory = process.memoryUsage();
      send({ type: 'metrics', request_id: requestId, value: { at: new Date().toISOString(), processes, main_memory_bytes: { rss: memory.rss, heap_used: memory.heapUsed, heap_total: memory.heapTotal, external: memory.external, array_buffers: memory.arrayBuffers }, gc_events: gcEvents.slice(), gc_totals: { count: gcTotals.count, duration_ms: Math.round(gcTotals.duration_ms * 100) / 100 } } });
    } catch { send({ type: 'metrics', request_id: requestId, value: null }); }
  }
  sample();
  const sampling = setInterval(sample, 5000);
  heartbeat.unref(); sampling.unref(); worker.unref();
  return {
    rendererBeat(active) { send({ type: 'renderer', active }); },
    rendererReset() { send({ type: 'renderer-reset' }); },
    suspend() { send({ type: 'suspend' }); },
    resume() { send({ type: 'resume' }); },
    async pending() {
      if (stopped) return [];
      const ready = await new Promise(resolve => {
        const id = ++nextQuery;
        const done = value => { clearTimeout(timeout); queries.delete(id); resolve(value); };
        const timeout = setTimeout(() => done(false), 2000);
        queries.set(id, done); send({ type: 'health', id });
      });
      return ready ? records.list() : [];
    },
    overview: records.overview,
    analysis: records.analysis,
    promptSettings: records.promptSettings,
    savePrompt: records.savePrompt,
    async clear(tokens) {
      if (stopped) throw new Error('卡顿监控已关闭');
      const result = await new Promise(resolve => {
        const id = ++nextQuery;
        const timer = setTimeout(()=>done({error:'清理超时，请刷新确认结果'}),15000);
        const done = value => {clearTimeout(timer);queries.delete(id);resolve(value);};
        queries.set(id,done);send({type:'clear',id,tokens});
      });
      if (!result || result.error) throw new Error(result?.error || '卡顿监控已关闭');
      return result.result;
    },
    async close() { removeSink(); gcObserver.disconnect(); send({ type: 'close' }); stopped = true; for (const done of queries.values()) done(false); clearInterval(heartbeat); clearInterval(sampling); await worker.terminate(); }
  };
}
