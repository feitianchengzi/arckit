import { watch } from 'node:fs';

// Filesystem notifications are invalidation hints. Directory listings remain
// authoritative and are re-read by the renderer through the restricted service.
export function createChatFilesObserver({ watchFs = watch, debounceMs = 200, pollMs = 5000 } = {}) {
  const entries = new Map();
  const publicState = e => ({ workspace: e.key, version: e.version || 0,
    invalidated: [], stale: Boolean(e.watchError), watch_error: e.watchError || '' });
  const emit = e => {
    if (e.closed || !e.invalidated.size) return;
    e.version = (e.version || 0) + 1;
    const state = { ...publicState(e), invalidated: [...e.invalidated].sort() };
    e.invalidated.clear();
    for (const listener of e.listeners) listener(state);
  };
  function schedule(e, path) {
    if (e.closed || !e.paths.has(path)) return;
    e.invalidated.add(path);
    if (!e.timer) e.timer = setTimeout(() => { e.timer = null; emit(e); }, debounceMs);
  }
  function closeWatcher(e, path) {
    const watcher = e.watchers.get(path);
    watcher?.close(); e.watchers.delete(path);
  }
  function syncWatchers(e) {
    for (const path of e.watchers.keys()) if (!e.paths.has(path)) closeWatcher(e, path);
    for (const [relative, absolute] of e.paths) if (!e.watchers.has(relative)) {
      try {
        const watcher = watchFs(absolute, { persistent: false }, () => schedule(e, relative));
        watcher.on?.('error', error => {
          closeWatcher(e, relative);
          e.watchError = String(error.message);
          schedule(e, relative);
        });
        e.watchers.set(relative, watcher);
        if (e.watchers.size === e.paths.size) e.watchError = '';
      } catch (error) {
        e.watchError = String(error.message);
        schedule(e, relative);
      }
    }
  }
  function dispose(e) {
    e.closed = true; clearTimeout(e.timer); clearInterval(e.poll);
    for (const path of [...e.watchers.keys()]) closeWatcher(e, path);
    e.listeners.clear(); entries.delete(e.key);
  }
  function observe({ key, root }, listener) {
    let e = entries.get(key);
    if (e && e.root !== root) throw Error('工作区身份与目录不匹配。');
    if (!e) {
      e = { key, root, listeners: new Set(), paths: new Map(), watchers: new Map(),
        invalidated: new Set(), watchError: '', closed: false, version: 0 };
      entries.set(key, e);
      e.poll = setInterval(() => {
        if (!e.watchError && e.watchers.size === e.paths.size) return;
        syncWatchers(e);
        for (const path of e.paths.keys()) schedule(e, path);
      }, pollMs);
      e.poll.unref?.();
    }
    e.listeners.add(listener);
    return {
      read: () => publicState(e),
      update(paths) {
        e.paths = new Map(paths);
        syncWatchers(e);
        return publicState(e);
      },
      release() { e.listeners.delete(listener); if (!e.listeners.size && !e.closed) dispose(e); }
    };
  }
  return { observe, close() { for (const e of [...entries.values()]) dispose(e); } };
}
