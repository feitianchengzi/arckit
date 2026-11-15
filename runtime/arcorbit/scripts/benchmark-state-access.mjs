import { readFile, mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { performance } from 'node:perf_hooks';
import { createDesktopStore } from '../src/desktop/desktop-store.mjs';

// Optional baseline source preserves pre-change behavior without checking out or
// modifying the user's worktree. Output goes to stdout for caller-owned evidence.
const baseline = process.argv.find(arg => arg.startsWith('--baseline='))?.slice(11);
let factory = createDesktopStore;
if (baseline) {
  const source = (await readFile(resolve(baseline), 'utf8')).replace(/from (['"])(\.[^'"]+)\1/g,
    (_match, _quote, specifier) => `from '${new URL(specifier, new URL('../src/desktop/desktop-store.mjs', import.meta.url)).href}'`);
  factory = (await import(`data:text/javascript;base64,${Buffer.from(source).toString('base64')}`)).createDesktopStore;
}
const root = await mkdtemp(join(tmpdir(), 'arcorbit-state-access-bench-'));
try {
  const store = factory({ dataDir: root, runsDir: join(root, 'runs'), storePath: join(root, 'desktop-store.json') });
  await store.updateControlStore(state => {
    state.platform.task_sync.projects = Object.fromEntries(Array.from({ length: 10 }, (_, project) => [String(project), {
      project: { id: String(project) }, trusted: true, tags: [],
      tasks: Array.from({ length: 100 }, (_, task) => ({ id: `${project}-${task}`, content: `${project}-${task}:` + 'x'.repeat(20000), state: 'pending' }))
    }]));
  });
  const fixtureBytes = Buffer.byteLength(JSON.stringify((await store.captureStateView()).state));
  const timings = [];
  global.gc?.();
  const heapBefore = process.memoryUsage().heapUsed;
  for (let i = 0; i < 30; i++) {
    const start = performance.now();
    if (store.queryControlStore) await store.queryControlStore(state => state.settings);
    else (await store.readControlStore()).settings;
    timings.push(performance.now() - start);
  }
  const heapAfter = process.memoryUsage().heapUsed;
  const updateStart = performance.now();
  for (let i = 0; i < 5; i++) {
    if (store.updateTaskSync) await store.updateTaskSync(sync => { sync.projects['0'].state = 'connected'; sync.projects['0'].cursor = i + 1; });
    else await store.updateControlStore(state => { state.platform.task_sync.projects['0'].state = 'connected'; state.platform.task_sync.projects['0'].cursor = i + 1; });
  }
  console.log(JSON.stringify({ label: baseline ? 'baseline' : 'optimized', fixture_bytes: fixtureBytes, queries: 30,
    query_total_ms: timings.reduce((a,b)=>a+b,0), query_max_ms: Math.max(...timings), query_heap_growth_bytes: heapAfter-heapBefore,
    metadata_updates: 5, update_total_ms: performance.now()-updateStart }, null, 2));
} finally { await rm(root, { recursive: true, force: true }); }
