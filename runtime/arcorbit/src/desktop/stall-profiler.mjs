import { Session } from 'node:inspector';

// Runs only in the watchdog worker. No inspector socket or debugger pause is used.
export function createStallProfiler({ intervalUs = 10000, windowMs = 30000 } = {}) {
  let session, timer, busy = false, closed = false, state = 'starting', failure = null;
  const segments = [];
  const post = (method, params = {}) => new Promise((resolve, reject) => {
    const timeout = setTimeout(() => reject(new Error('inspector_timeout')), 5000);
    session.post(method, params, (error, value) => { clearTimeout(timeout); error ? reject(error) : resolve(value); });
  });
  function unavailable(error) {
    state = 'unavailable'; failure = String(error.code || error.message || 'inspector_unavailable').slice(0, 80);
    clearInterval(timer); try { session?.disconnect(); } catch {}
  }
  const ready = (async () => {
    try {
      session = new Session(); session.connectToMainThread();
      await post('Profiler.enable'); await post('Profiler.setSamplingInterval', { interval: intervalUs });
      await post('Profiler.start'); state = 'recording';
      timer = setInterval(() => { void rotate(); }, windowMs);
    } catch (error) { unavailable(error); }
  })();
  async function rotate() {
    if (busy || closed || state !== 'recording') return;
    busy = true;
    try {
      const { profile } = await post('Profiler.stop');
      segments.push({ profile, ended: Date.now() });
      while (segments.length > 2) segments.shift();
      if (!closed) await post('Profiler.start');
    } catch (error) { unavailable(error); }
    finally { busy = false; }
  }
  return {
    async capture(start, end) {
      await ready;
      // Serialize with periodic rotation without blocking watchdog heartbeats.
      while (busy && !closed) await new Promise(resolve => setTimeout(resolve, 10));
      await rotate();
      return summarizeProfiles(segments, start, end, { state, failure, intervalUs });
    },
    close() { closed = true; clearInterval(timer); try { session?.disconnect(); } catch {} }
  };
}

function frameLabel(frame = {}) {
  const raw = String(frame.url || '').replaceAll('\\', '/').split(/[?#]/)[0];
  const index = raw.lastIndexOf('/runtime/arcorbit/');
  const file = index >= 0 ? raw.slice(index + 1) : raw.startsWith('node:') ? raw : raw.split('/').pop();
  return { fn: String(frame.functionName || '(anonymous)').slice(0, 90), file: file.slice(-140), line: (frame.lineNumber ?? -1) + 1 };
}
export function summarizeProfiles(segments, start, end, { state, failure, intervalUs }) {
  const from = Date.parse(start), to = Date.parse(end), totals = new Map();
  let samples = 0, sampledMs = 0, coverageStart = Infinity, coverageEnd = 0;
  for (const { profile, ended } of segments) {
    const beginning = ended - (profile.endTime - profile.startTime) / 1000;
    coverageStart = Math.min(coverageStart, beginning); coverageEnd = Math.max(coverageEnd, ended);
    const nodes = new Map(profile.nodes.map(n => [n.id, n])), parents = new Map();
    for (const node of profile.nodes) for (const child of node.children || []) parents.set(child, node.id);
    let clock = beginning;
    for (let i = 0; i < (profile.samples || []).length; i++) {
      const previous = clock; clock += (profile.timeDeltas?.[i] || intervalUs) / 1000;
      const duration = Math.max(0, Math.min(clock, to) - Math.max(previous, from));
      if (!duration) continue;
      samples++; sampledMs += duration;
      const id = profile.samples[i], frame = frameLabel(nodes.get(id)?.callFrame);
      if (frame.fn === '(idle)' || frame.fn === '(root)') continue;
      const stack = []; let current = id;
      for (let depth = 0; current && depth < 5; depth++) {
        stack.push(frameLabel(nodes.get(current)?.callFrame)); current = parents.get(current);
      }
      const key = JSON.stringify(stack);
      const item = totals.get(key) || { self_ms: 0, samples: 0, stack };
      item.self_ms += duration; item.samples++; totals.set(key, item);
    }
  }
  return { status: samples ? 'captured' : state === 'unavailable' ? 'unavailable' : 'no_samples', error: failure,
    target: 'main', sampling_interval_us: intervalUs, samples, sampled_ms: Math.round(sampledMs),
    window_start: start, window_end: end,
    coverage_start: Number.isFinite(coverageStart) ? new Date(coverageStart).toISOString() : null,
    coverage_end: coverageEnd ? new Date(coverageEnd).toISOString() : null,
    timing: 'sample windows aligned to worker receipt; approximate; native frames may appear as (program)',
    top: [...totals.values()].sort((a, b) => b.self_ms - a.self_ms).slice(0, 6).map(x => ({ ...x, self_ms: Math.round(x.self_ms) })) };
}
