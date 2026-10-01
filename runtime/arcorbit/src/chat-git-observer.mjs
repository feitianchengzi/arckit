import { watch } from 'node:fs';
import { createRepositoryService } from './release/repository-service.mjs';

// Owners supply a canonical directory identity. One entry serves every session
// using that workspace. No network request is made by observation or refresh.
export function createChatGitObserver({ repository = createRepositoryService(), watchFs = watch,
  pollMs = 30000, debounceMs = 200, now = () => Date.now() } = {}) {
  const entries = new Map();
  const remoteEmpty = () => ({ checked_at: null, attempted_at: null, error: '', fetching: false });
  const publicState = e => structuredClone({ ...e.state, version: e.version || 0,
    stale: e.state.stale || (e.state.read_at !== null && now() - e.state.read_at > pollMs * 3), remote: e.remote });
  const emit = e => { if (!e.closed) { e.version = (e.version || 0) + 1; for (const listener of e.listeners) listener(publicState(e)); } };
  function schedule(e) {
    if (e.closed) return;
    e.state.stale = true;
    if (!e.timer) {
      emit(e);
      e.timer = setTimeout(() => { e.timer = null; void refresh(e); }, debounceMs);
    }
  }
  function watchPaths(e, paths) {
    const wanted = new Set(paths.filter(Boolean));
    for (const [path, watcher] of e.watchers) if (!wanted.has(path)) { watcher.close(); e.watchers.delete(path); }
    for (const path of wanted) if (!e.watchers.has(path)) {
      try {
        const watcher = watchFs(path, { recursive: true }, () => schedule(e));
        watcher.on('error', error => {
          watcher.close(); e.watchers.delete(path);
          e.state.watch_error = String(error.message); schedule(e);
        });
        e.watchers.set(path, watcher);
      } catch (error) { e.state.watch_error = String(error.message); }
    }
  }
  async function refresh(e) {
    if (e.closed) return publicState(e);
    if (e.pending) { e.again = true; return e.pending; }
    e.pending = (async () => {
        e.again = false;
        try {
          const value = await repository.summary(e.root);
          if (e.closed) return publicState(e);
          const remoteKey = JSON.stringify([value.remote, value.remote_url, value.tracking]);
          if (remoteKey !== e.remoteKey) { e.remote = remoteEmpty(); e.remoteKey = remoteKey; }
          e.state = { value, read_at: now(), stale: false, error: '', watch_error: '' };
          watchPaths(e, [e.root, value.git_dir, value.common]);
        } catch (error) {
          if (e.closed) return publicState(e);
          // Preserve the last successful value and its original timestamp.
          e.state = { ...e.state, stale: true, error: String(error.message) };
        }
        emit(e);
      return publicState(e);
    })();
    try { return await e.pending; } finally { e.pending = null; if (e.again) schedule(e); }
  }
  function dispose(e) {
    e.closed = true; clearTimeout(e.timer); clearInterval(e.poll);
    for (const watcher of e.watchers.values()) watcher.close();
    e.watchers.clear(); e.listeners.clear(); entries.delete(e.key);
  }
  function observe({ key, root }, listener) {
    let e = entries.get(key);
    if (e && e.root !== root) throw Error('工作区身份与目录不匹配。');
    if (!e) {
      e = { key, root, listeners: new Set(), watchers: new Map(), remote: remoteEmpty(),
        remoteKey: '', state: { value: null, read_at: null, stale: true, error: '', watch_error: '' } };
      entries.set(key, e); watchPaths(e, [root]);
      e.poll = setInterval(() => { void refresh(e); }, pollMs); e.poll.unref?.();
    }
    e.listeners.add(listener);
    const ready = refresh(e);
    return {
      ready, read: () => publicState(e), refresh: () => refresh(e),
      async fetch(assertCurrent = async () => {}) {
        if (e.closed) throw Error('工作区观察已结束。');
        if (e.fetching) return e.fetching;
        e.fetching = (async () => {
          await refresh(e); await assertCurrent();
          if (e.closed || e.state.stale) throw Error('请先重新读取有效的工作区状态。');
          const remote = e.state.value?.remote;
          if (!remote) throw Error('没有可获取的远端。');
          const remoteKey = e.remoteKey;
          e.remote = { ...e.remote, attempted_at: now(), fetching: true, error: '' }; emit(e);
          try {
            await repository.fetchSummary(e.root, remote, assertCurrent);
            await assertCurrent();
            await refresh(e);
            if (!e.closed && remoteKey === e.remoteKey) e.remote = { ...e.remote, checked_at: now(), error: '' };
          } catch (error) {
            if (!e.closed && remoteKey === e.remoteKey) e.remote = { ...e.remote, error: String(error.message) };
          } finally {
            e.remote.fetching = false; emit(e);
          }
          return publicState(e);
        })();
        try { return await e.fetching; } finally { e.fetching = null; }
      },
      release() { e.listeners.delete(listener); if (!e.listeners.size && !e.closed) dispose(e); }
    };
  }
  return { observe, refreshAll: () => Promise.all([...entries.values()].map(refresh)),
    close() { for (const e of [...entries.values()]) dispose(e); } };
}
