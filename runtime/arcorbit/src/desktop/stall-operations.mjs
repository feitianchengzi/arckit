import { performance } from 'node:perf_hooks';
let sink = null, sequence = 0;
export function installStallOperationSink(next) { sink = next; return () => { if (sink === next) sink = null; }; }
export function beginStallOperation(name, counts = {}) {
  if (!sink) return () => {};
  const target = sink, started = performance.now(), id = ++sequence;
  const safeCounts = Object.fromEntries(Object.entries(counts).filter(([key, value]) => ['bytes', 'chars', 'items', 'rows'].includes(key) && Number.isFinite(value) && value >= 0));
  const base = { id, name: String(name).slice(0, 100), started_at: new Date().toISOString(), ...safeCounts };
  try { target({ ...base, phase: 'start' }); } catch {}
  let ended = false;
  return (status = 'ok', resultCounts = {}) => {
    if (ended) return; ended = true;
    try { target({ ...base, ...Object.fromEntries(Object.entries(resultCounts).filter(([key, value]) => ['bytes', 'chars', 'items', 'rows'].includes(key) && Number.isFinite(value) && value >= 0)), phase: 'end', status: status === 'ok' ? 'ok' : 'error', duration_ms: Math.round((performance.now() - started) * 100) / 100, ended_at: new Date().toISOString() }); } catch {}
  };
}
export function traceStallOperation(name, operation, counts) {
  const end = beginStallOperation(name, counts);
  try {
    const result = operation();
    if (result && typeof result.then === 'function') return result.then(value => { end(); return value; }, error => { end('error'); throw error; });
    end(); return result;
  } catch (error) { end('error'); throw error; }
}
// Explicitly register application-owned IPC names; never capture arguments or responses.
export function tracedIpcHandler(name, handler) {
  return function (...args) { return traceStallOperation(`ipc:${name}`, () => handler.apply(this, args)); };
}
