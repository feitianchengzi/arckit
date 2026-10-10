import test from 'node:test';
import assert from 'node:assert/strict';
import { EventEmitter } from 'node:events';
import { createChatFilesObserver } from '../src/chat-files-observer.mjs';

const pause = ms => new Promise(resolve => setTimeout(resolve, ms));

test('directory observer coalesces invalidations, narrows scope and releases watchers', async () => {
  const watchers = new Map(), states = [];
  const observer = createChatFilesObserver({ debounceMs: 5, pollMs: 50000,
    watchFs: (path, _options, change) => { const watcher = new EventEmitter(); watcher.change = change; watcher.close = () => { watcher.closed = true; }; watchers.set(path, watcher); return watcher; } });
  const handle = observer.observe({ key: 'workspace', root: '/root' }, state => states.push(state));
  handle.update(new Map([['', '/root'], ['src', '/root/src']]));
  for (let i = 0; i < 20; i++) watchers.get('/root/src').change('change', `file-${i}`);
  await pause(20);
  assert.equal(states.length, 1);
  assert.deepEqual(states[0].invalidated, ['src']);
  assert.equal(states[0].version, 1);
  handle.update(new Map([['', '/root']]));
  assert.equal(watchers.get('/root/src').closed, true);
  handle.release(); assert.equal(watchers.get('/root').closed, true);
});

test('watch failure is explicit, polling retries and invalidates the retained scope', async () => {
  let attempts = 0; const states = [];
  const observer = createChatFilesObserver({ debounceMs: 2, pollMs: 8,
    watchFs: () => { attempts++; throw Error(attempts === 1 ? 'unsupported' : 'still unsupported'); } });
  const handle = observer.observe({ key: 'workspace', root: '/root' }, state => states.push(state));
  const initial = handle.update(new Map([['', '/root']]));
  assert.equal(initial.stale, true); assert.match(initial.watch_error, /unsupported/);
  await pause(30);
  assert.ok(attempts >= 2); assert.ok(states.some(state => state.invalidated.includes('')));
  assert.ok(states.every(state => state.stale));
  handle.release(); observer.close();
});
