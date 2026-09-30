import { buildExecutionHistory } from './automation/execution-history.mjs';
import { findSessionById } from './desktop/desktop-store.mjs';

// The product boundary shared by Chat and Automation. Runtime retains its Loop;
// task leases retain exclusive execution until the transport confirms release.
export function createTaskConversation({ runManager, automation, validateInput = async input => input.text }) {
  const read = () => runManager.readDesktopChatMetadata();
  async function sessionFor(id) { return findSessionById(await read(), id)?.session; }
  return {
    async snapshot(snapshot) {
      const store = await read();
      const history = buildExecutionHistory(store.automation || {});
      for (const s of snapshot.sessions) {
        if (!s.task_id) continue;
        const run = runManager.taskConversationRun(s);
        const previous = history.find(e => String(e.task_id) === s.task_id && e.local_project_id === s.project_id && !e.archived_at);
        s.execution = run ? { mode: 'automation', run_id: run.id, status: 'running' } : previous && !['resolved','cancelled'].includes(previous.status) ? {mode:'discussion',status:previous.status,resumable:true} : null;
        if (run) { s.status = 'running'; s.error = ''; }
      }
      const session = findSessionById(store, snapshot.selected_session_id)?.session;
      if (session?.task_id) {
        snapshot.messages = mergeTaskConversation(snapshot.messages, await runManager.taskConversationHistory(session));
      }
      return snapshot;
    },
    async send(input) {
      const session = await sessionFor(input.session_id);
      if (!session?.task_id) return false;
      const previous = input.client_request_id && (await runManager.taskConversationHistory(session)).find(m => m.client_request_id === input.client_request_id);
      if (previous) {
        if (previous.content !== input.text) throw Error('消息标识已用于不同内容。');
        return true;
      }
      const run = runManager.taskConversationRun(session);
      if (!run) return false;
      const prompt = await validateInput(input, session);
      await runManager.controlRun(run.id, { type: 'steer', request_id: input.client_request_id, message: input.text, prompt, native_context: input.native_context });
      await runManager.updateDesktopChatMetadata(store => {
        const s = findSessionById(store, session.id)?.session;
        if (s && !input.preserve_draft) { s.draft = ''; s.native_context = {capability:null, refs:[]}; }
        return store;
      });
      return true;
    },
    async interrupt(id) {
      const session = await sessionFor(id);
      if (!session?.task_id) return false;
      const run = runManager.taskConversationRun(session);
      if (!run) return false;
      const snapshot = await automation().getSnapshot({});
      const execution = (snapshot.active_executions || []).find(e => e.run_id === run.id);
      if (!execution) throw Error('执行状态已变化，请刷新后接管。');
      await automation().stopCurrent({execution_id: execution.execution_id});
      return true;
    }
  };
}

export function mergeTaskConversation(chat, runtime) {
  const merged = new Map();
  for (const message of [...runtime, ...chat]) {
    const identity = message.client_request_id ? `request:${message.client_request_id}`
      : message.thread_id && message.turn_id && message.item_id ? `item:${message.thread_id}:${message.turn_id}:${message.item_id}:${message.kind}`
      : message.source_message_id || message.id;
    // Native receipts and run control messages may appear in both old stores.
    const previous = merged.get(identity);
    merged.set(identity, previous?.delivery_status && !message.delivery_status ? previous : message);
  }
  return [...merged.values()].sort((a,b) => String(a.created_at || '').localeCompare(String(b.created_at || '')) || String(a.id).localeCompare(String(b.id)));
}
