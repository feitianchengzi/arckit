import { createStallPromptSettings, renderStallPrompt } from './stall-prompt.mjs';
import { mkdir, readdir, readFile, writeFile, rename, unlink, lstat } from 'node:fs/promises';
import { join, resolve } from 'node:path';
import { createHash } from 'node:crypto';

export const STALL_RETENTION_MS = 7 * 24 * 60 * 60 * 1000;
export const STALL_STORAGE_BYTES = 20 * 1024 * 1024;
const digest = text => createHash('sha256').update(text).digest('hex');
const recordName = /^stall-[\w-]+\.json$/;
export async function writeStallRecord(directory, record) {
  await mkdir(directory, { recursive: true, mode: 0o700 });
  record = boundStallRecord(record);
  if (!recordName.test(`${record.id}.json`)) throw new Error('Invalid stall id');
  const target = join(directory, `${record.id}.json`);
  await writeFile(`${target}.tmp`, JSON.stringify(record), { mode: 0o600 });
  await rename(`${target}.tmp`, target);
}

// Local diagnostics are independent of tasks. Tokens bind clear to the viewed bytes.
export function createStallRecords({ directory, now = Date.now, retentionMs = STALL_RETENTION_MS, maxBytes = STALL_STORAGE_BYTES }) {
  const promptSettings = createStallPromptSettings({ path: resolve(directory, '..', 'stall-analysis-prompt.json') });
  async function entries() {
    await mkdir(directory, { recursive: true, mode: 0o700 });
    const result = []; let unreadable = 0;
    for (const name of (await readdir(directory)).filter(n => recordName.test(n))) {
      try {
        const path = join(directory, name), stat = await lstat(path);
        if (!stat.isFile() || stat.size > 1024 * 1024) { unreadable++; continue; }
        const raw = await readFile(path, 'utf8'), record = JSON.parse(raw);
        if (!['arcorbit-stall/v1', 'arcorbit-stall/v2'].includes(record.schema) || `${record.id}.json` !== name || !Number.isFinite(Date.parse(record.started_at))) { unreadable++; continue; }
        result.push({ path, token: digest(raw), raw, bytes: Buffer.byteLength(raw), record });
      } catch (error) { if (error.code !== 'ENOENT') unreadable++; }
    }
    result.sort((a,b) => Date.parse(b.record.started_at) - Date.parse(a.record.started_at) || a.record.id.localeCompare(b.record.id));
    return { result, unreadable };
  }
  async function remove(entry) {
    try {
      if (digest(await readFile(entry.path, 'utf8')) !== entry.token) return false;
      await unlink(entry.path);
      return true;
    } catch (error) { if (error.code === 'ENOENT') return false; throw error; }
  }
  async function prune() {
    const { result } = await entries(); let bytes = 0;
    // The active incident remains writable; prune finalized records oldest first by budget.
    for (const entry of result) {
      const expired = Date.parse(entry.record.recovered_at || entry.record.started_at) < now() - retentionMs;
      if (expired || (bytes + entry.bytes > maxBytes && entry.record.recovered_at)) await remove(entry);
      else bytes += entry.bytes;
    }
    const snapshots = join(directory, 'analyses');
    // Retire copies from older versions without creating any new analysis directory.
    let total = 0;
    const files = [];
    for (const name of await readdir(snapshots).catch(error => { if (error.code === 'ENOENT') return []; throw error; })) {
      if (!/^analysis-[\w-]+\.json$/.test(name)) continue;
      const path = join(snapshots,name), stat = await lstat(path);
      if(stat.isFile()) files.push({path,stat});
    }
    for(const {path,stat} of files.sort((a,b)=>b.stat.mtimeMs-a.stat.mtimeMs)) {
      total += stat.size;
      if(stat.mtimeMs < now()-retentionMs || total > maxBytes) await unlink(path).catch(e=>{if(e.code!=='ENOENT') throw e;});
    }
  }
  function cutoff(range, at = now()) {
    if (!['24h','7d','all'].includes(range)) throw new Error('无效的诊断时间范围');
    return range === 'all' ? -Infinity : at - (range === '24h' ? 86400000 : STALL_RETENTION_MS);
  }
  async function selected(range = '24h') {
    const since = cutoff(range), { result, unreadable } = await entries();
    return { result: result.filter(e => Date.parse(e.record.started_at) >= since), unreadable };
  }
  async function overview(range = '24h') {
    const {result, unreadable} = await selected(range);
    return { range, captured_at:new Date(now()).toISOString(), unreadable, retention_days:7, max_bytes:maxBytes,
      count: result.length, max_gap_ms:result.reduce((max,e)=>Math.max(max,Number(e.record.max_heartbeat_gap_ms)||0),0),
      records:result.map(e=>({id:e.record.id,token:e.token,started_at:e.record.started_at,recovered_at:e.record.recovered_at,source:e.record.source,version:e.record.app?.version || e.record.version || '',max_gap_ms:e.record.max_heartbeat_gap_ms,bytes:e.bytes})) };
  }
  async function clear(tokens, protectedIds = []) {
    if(!Array.isArray(tokens) || tokens.some(t=>typeof t!=='string')) throw new Error('无效的清理范围');
    const wanted = new Set(tokens), {result} = await entries(); let deleted = 0, retained = 0;
    for(const entry of result) if(wanted.has(entry.token)) {
      if(protectedIds.includes(entry.record.id)) { retained++; continue; }
      if(await remove(entry)) deleted++; else retained++;
    }
    return {deleted,retained};
  }
  async function analysis(range = '24h') {
    const end = now(), start = cutoff(range, end);
    const timeRange = start === -Infinity
      ? `全部留存记录，截至 ${new Date(end).toISOString()}`
      : `${new Date(start).toISOString()} 至 ${new Date(end).toISOString()}`;
    const { template } = await promptSettings.get();
    const text = renderStallPrompt(template, { directory: resolve(directory), timeRange });
    return { text };
  }
  async function list() {
    const {result} = await entries();
    return result.map(e=>({id:e.token,source:e.record.source,content:e.raw,started_at:e.record.started_at}));
  }
  return {list,overview,clear,analysis,prune,promptSettings:promptSettings.get,savePrompt:promptSettings.save};
}

// Collection bounds preserve diagnostic limits independently of Chat/task lengths.
export function boundStallRecord(value) {
  const record = structuredClone(value);
  if (record.schema !== 'arcorbit-stall/v2') return record;
  const omitted = { cpu_stacks: 0, operations: 0, gc_events: record.gc?.events_omitted || 0 };
  const trim = (array, limit, key) => {
    if (array?.length > limit) { omitted[key] += array.length - limit; array.splice(limit); }
  };
  trim(record.cpu_profile?.top, 6, 'cpu_stacks'); trim(record.operations, 12, 'operations'); trim(record.gc?.events, 8, 'gc_events');
  record.omitted = omitted;
  while (JSON.stringify(record).length > 8000) {
    if (record.operations?.length > 2) { record.operations.pop(); omitted.operations++; }
    else if (record.cpu_profile?.top?.length > 1) { record.cpu_profile.top.pop(); omitted.cpu_stacks++; }
    else if (record.gc?.events?.length) { record.gc.events.pop(); omitted.gc_events++; }
    else break;
  }
  return record;
}
