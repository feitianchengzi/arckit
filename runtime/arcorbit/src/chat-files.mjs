import { createHash } from 'node:crypto';
import { findSessionById } from './desktop/desktop-store.mjs';
import { chatRoot, performChatFile } from './chat-workspace-files.mjs';

const actions = new Set(['context', 'list', 'read', 'save', 'create-file', 'create-directory', 'rename', 'trash', 'reveal']);
export function createChatFiles({ runManager, getAccountScope, authorizeSession, trashItem, revealItem }) {
  const queues = new Map();
  async function context(input) {
    const [store, account] = await Promise.all([runManager.readDesktopChatMetadata?.() || runManager.readDesktopStore(), getAccountScope()]);
    const session = input.session_id ? findSessionById(store, String(input.session_id))?.session : null;
    if (input.session_id && (!session || session.chat_hidden || !['chat', 'automation-task'].includes(session.kind)
      || !await authorizeSession(session, { store }))) throw Error('会话不存在或不可访问。');
    if (session && input.project_id && session.project_id !== input.project_id) throw Error('会话与工作区不匹配。');
    const project = store.projects.find(p => p.id === (session?.project_id || input.project_id));
    if (!project) throw Error('请选择可用的本地工作区。');
    const root = await chatRoot(project.path);
    const workspace = createHash('sha256').update(JSON.stringify([account || 'local', project.id, project.path, root.path, root.identity])).digest('hex');
    return { workspace, project_id: project.id, name: project.name, root: root.path };
  }
  async function command(action, input = {}) {
    if (!actions.has(action)) throw Error('不支持的文件操作。');
    const initial = await context(input);
    if (action === 'context') { const { root, ...result } = initial; return result; }
    if (!input.expected_workspace || input.expected_workspace !== initial.workspace) throw Error('工作区或账号已变化，请重新打开文件工作区。');
    const assertCurrent = async () => { if ((await context(input)).workspace !== initial.workspace) throw Error('工作区或账号已变化，操作已取消。'); };
    // Serialize all requests per real root, including callers from different sessions.
    const pending = (queues.get(initial.root) || Promise.resolve()).catch(() => {}).then(async () => {
      await assertCurrent();
      const result = await performChatFile(initial.root, action, input, { assertCurrent, trashItem, revealItem });
      return { ...result, workspace: initial.workspace };
    });
    queues.set(initial.root, pending);
    try { return await pending; } finally { if (queues.get(initial.root) === pending) queues.delete(initial.root); }
  }
  return { command };
}
