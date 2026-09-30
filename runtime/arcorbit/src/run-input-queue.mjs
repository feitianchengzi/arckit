import { readFile, writeFile, rename } from 'node:fs/promises';

// Durable user input belongs to the run that accepted it. Never replay an uncertain
// delivery on restart: the original turn may already have consumed it.
export function createRunInputQueue({ file, send, changed = () => {}, now = () => new Date().toISOString() }) {
  let entries = [], turnId = '', chain = Promise.resolve(), closed = false;
  const timers = new Map();
  const serial = fn => { const result = chain.then(fn); chain = result.catch(() => {}); return result; };
  async function persist() { await writeFile(`${file}.tmp`, JSON.stringify(entries)); await rename(`${file}.tmp`, file); changed(); }
  async function pump() {
    if (!turnId || closed) return;
    for (const entry of entries.filter(e => e.delivery_status === 'queued')) {
      entry.delivery_status = 'sending'; entry.turn_id = turnId; entry.updated_at = now();
      await persist();
      try {
        send({ type: 'steer', request_id: entry.client_request_id, expected_turn_id: turnId, message: entry.prompt || entry.content });
        timers.set(entry.client_request_id, setTimeout(() => void acknowledge({ request_id: entry.client_request_id, status: 'unknown', error: '未取得接收确认，请核对对话后决定是否重新发送。' }), 15000));
      } catch (error) { entry.delivery_status = 'failed'; entry.delivery_error = error.message; await persist(); }
    }
  }
  function acknowledge(event) { return serial(async () => {
    const entry = entries.find(e => e.client_request_id === event.request_id);
    if (!entry || entry.delivery_status === 'delivered') return;
    clearTimeout(timers.get(event.request_id)); timers.delete(event.request_id);
    entry.delivery_status = event.status; entry.delivery_error = event.error || ''; entry.updated_at = now();
    if (event.status === 'queued' && entry.turn_id === turnId) turnId = '';
    await persist();
    if (event.status === 'queued' && turnId) await pump();
  }); }
  return {
    enqueue(input) { return serial(async () => {
      if (closed) throw Error('执行已结束，请刷新后发送。');
      const existing = entries.find(e => e.client_request_id === input.client_request_id);
      if (existing) {
        if (existing.content !== input.content) throw Error('消息标识已用于不同内容。');
        return existing;
      }
      const entry = { ...input, id: `input:${input.client_request_id}`, role: 'user', kind: 'text', status: 'completed', delivery_status: 'queued', created_at: now(), updated_at: now() };
      entries.push(entry); await persist(); await pump(); return entry;
    }); },
    turn(id) { return serial(async () => { turnId = id || ''; await pump(); }); },
    acknowledge,
    messages: () => entries.map(({prompt, ...entry}) => ({...entry})),
    close() { return serial(async () => {
      closed = true;
      for (const timer of timers.values()) clearTimeout(timer); timers.clear();
      for (const entry of entries) {
        if (!['queued','sending'].includes(entry.delivery_status)) continue;
        entry.delivery_error = entry.delivery_status === 'queued' ? '执行结束前尚未送达，请重新发送。' : '执行结束，未取得接收确认，请核对后决定是否重发。';
        entry.delivery_status = entry.delivery_status === 'queued' ? 'failed' : 'unknown';
      }
      if (entries.length) await persist();
    }); }
  };
}
export async function readRunInputs(file) {
  try { return JSON.parse(await readFile(file, 'utf8')).map(({prompt, ...m}) => ({ ...m,
    ...(['queued','sending'].includes(m.delivery_status) ? {delivery_status: m.delivery_status === 'queued' ? 'failed' : 'unknown', delivery_error:'执行连接已结束；消息不会自动重发。'} : {}) })); }
  catch (error) { if (error.code === 'ENOENT') return []; throw error; }
}
