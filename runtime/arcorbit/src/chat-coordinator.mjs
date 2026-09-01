import { randomUUID } from "node:crypto";
import { EventEmitter } from "node:events";
import { resolve } from "node:path";
import { createCodexAppServerAdapter } from "../adapters/codex-app-server-adapter.mjs";
import { buildRuntimeEnv, deleteProjectSession, findSessionById } from "./desktop/desktop-store.mjs";

const ACTIVE_STATUSES = new Set(["starting", "running", "waiting_approval", "interrupting"]);

export function createChatCoordinator({
  runManager,
  getCodexExecutable,
  setupReadinessPreflight = async () => {},
  createAdapter = createCodexAppServerAdapter,
  approvalTimeoutMs = 5 * 60_000,
  streamNotifyMs = 32,
  now = () => new Date().toISOString(),
  idFactory = () => randomUUID()
}) {
  if (!runManager) throw new TypeError("ChatCoordinator requires a Desktop Run Manager.");
  const emitter = new EventEmitter();
  const owners = new Map();
  const pendingApprovals = new Map();
  const liveMessages = new Map();
  const pendingStreamNotifications = new Map();
  let initialized = false;
  const readChatStore = () => (
    typeof runManager.readDesktopStoreWithMessages === "function"
      ? runManager.readDesktopStoreWithMessages()
      : runManager.readDesktopStore()
  );
  const updateChatStore = (updater) => (
    typeof runManager.updateDesktopStoreWithMessages === "function"
      ? runManager.updateDesktopStoreWithMessages(updater)
      : runManager.updateDesktopStore(updater)
  );

  async function ensureInitialized() {
    if (initialized) return;
    await updateChatStore((store) => {
      for (const sessions of Object.values(store.sessions || {})) {
        for (const session of sessions || []) {
          if (session.kind === "chat" && ACTIVE_STATUSES.has(session.status)) {
            session.status = "interrupted";
            session.error = "ArcOrbit restarted before this turn reached a terminal state.";
            session.updated_at = now();
          }
        }
      }
      return store;
    });
    initialized = true;
  }

  async function getSnapshot(input = {}) {
    await ensureInitialized();
    const store = await readChatStore();
    const sessions = Object.values(store.sessions || {}).flat()
      .filter((session) => session.kind === "chat")
      .sort((left, right) => String(right.updated_at).localeCompare(String(left.updated_at)));
    const explicitSelection = Object.prototype.hasOwnProperty.call(input, "session_id");
    const requestedId = String(explicitSelection ? input.session_id || "" : store.chat?.selected_session_id || "");
    const selected = sessions.find((session) => session.id === requestedId) || null;
    return {
      generated_at: now(),
      projects: (store.projects || []).map(({ id, name }) => ({ id, name })),
      sessions: sessions.map(publicSession),
      selected_session_id: selected?.id || "",
      messages: selected ? projectedSessionMessages(store.messages?.[selected.id] || [], liveMessages.get(selected.id)).map(publicMessage) : [],
      draft: {
        project_id: String(selected?.project_id || store.chat?.draft?.project_id || ""),
        text: String(selected ? selected.draft || "" : store.chat?.draft?.text || "")
      }
    };
  }

  async function createDraft(input = {}) {
    await ensureInitialized();
    const sessionId = String(input.session_id || "");
    const projectId = String(input.project_id || "");
    const text = String(input.text || "").slice(0, 100_000);
    const store = await readChatStore();
    if (projectId && !store.projects.some((project) => project.id === projectId)) throw new Error("Select an available local Product Workspace.");
    await updateChatStore((draft) => {
      draft.chat ||= {};
      if (sessionId) {
        const located = findSessionById(draft, sessionId);
        if (!located || located.session.kind !== "chat") throw new Error("Unknown Chat session.");
        located.session.draft = text;
        located.session.updated_at = now();
        draft.chat.selected_session_id = sessionId;
        return draft;
      }
      draft.chat.selected_session_id = "";
      draft.chat.draft = { project_id: projectId, text, updated_at: now() };
      return draft;
    });
    changed("chat.draft.changed");
    return getSnapshot({ session_id: sessionId });
  }

  async function select(input = {}) {
    await ensureInitialized();
    const sessionId = String(input.session_id || "");
    await updateChatStore((store) => {
      store.chat ||= {};
      if (sessionId) {
        const located = findSessionById(store, sessionId);
        if (!located || located.session.kind !== "chat") throw new Error("Unknown Chat session.");
      }
      store.chat.selected_session_id = sessionId;
      return store;
    });
    return getSnapshot({ session_id: sessionId });
  }

  async function rename(input = {}) {
    await ensureInitialized();
    const sessionId = requireId(input.session_id, "session_id");
    const title = String(input.title || "").trim().slice(0, 80);
    if (!title) throw new Error("Conversation title cannot be empty.");
    await mutateChatSession(sessionId, (session) => {
      session.title = title;
      session.updated_at = now();
    });
    changed("chat.session.renamed", sessionId);
    return getSnapshot({ session_id: sessionId });
  }

  async function send(input = {}) {
    await ensureInitialized();
    const text = String(input.text || "").trim();
    if (!text) throw new Error("Enter a message before sending.");
    const requestId = requireId(input.client_request_id, "client_request_id");
    let sessionId = String(input.session_id || "");
    let project;
    let acceptedMessage = false;
    let shouldStart = false;

    await updateChatStore((store) => {
      let located = sessionId ? findSessionById(store, sessionId) : null;
      const replay = findChatRequest(store, requestId);
      if (replay) {
        if (sessionId && sessionId !== replay.session.id) throw new Error("Chat request id belongs to another session.");
        sessionId = replay.session.id;
        located = replay;
      }
      if (sessionId && !located) throw new Error("Unknown Chat session.");
      if (located && located.session.kind !== "chat") throw new Error("The selected session does not belong to Chat.");
      const projectId = located?.project_id || String(input.project_id || store.chat?.draft?.project_id || "");
      project = store.projects.find((item) => item.id === projectId);
      if (!project) throw new Error("Select an available local Product Workspace before sending.");
      const creating = !located;
      if (creating) {
        sessionId = `CHAT-${idFactory()}`;
        const createdAt = now();
        const session = {
          id: sessionId,
          project_id: project.id,
          kind: "chat",
          title: boundedTitle(text),
          thread_id: "",
          turn_id: "",
          retry_client_request_id: "",
          status: "starting",
          error: "",
          draft: "",
          created_at: createdAt,
          updated_at: createdAt
        };
        store.sessions[project.id] ||= [];
        store.sessions[project.id].unshift(session);
        store.messages[sessionId] = [];
        located = { project_id: project.id, session };
      }
      const messages = store.messages[sessionId] ||= [];
      const existingMessage = messages.find((message) => message.client_request_id === requestId && message.role === "user");
      const retryingFailedStartup = Boolean(
        existingMessage
        && located.session.status === "failed"
        && located.session.retry_client_request_id === requestId
      );
      if (existingMessage && !retryingFailedStartup) return store;
      if (!creating && ACTIVE_STATUSES.has(located.session.status)) throw new Error("This conversation already has an active turn.");
      const createdAt = now();
      if (existingMessage) {
        existingMessage.content = text;
        existingMessage.updated_at = createdAt;
      } else {
        messages.push({
          id: `CHAT-MSG-${idFactory()}`,
          session_id: sessionId,
          role: "user",
          kind: "text",
          content: text,
          status: "completed",
          client_request_id: requestId,
          thread_id: located.session.thread_id || "",
          turn_id: "",
          item_id: "",
          created_at: createdAt,
          updated_at: createdAt
        });
        acceptedMessage = true;
      }
      located.session.status = "starting";
      located.session.error = "";
      located.session.draft = "";
      located.session.retry_client_request_id = requestId;
      located.session.updated_at = createdAt;
      store.chat.selected_session_id = sessionId;
      store.chat.draft = { project_id: project.id, text: "", updated_at: createdAt };
      shouldStart = true;
      return store;
    });
    if (!shouldStart) return getSnapshot({ session_id: sessionId });
    if (acceptedMessage) changed("chat.message.accepted", sessionId);
    changed("chat.turn.starting", sessionId);
    try {
      const owner = await ownerFor(sessionId, project);
      owner.completion = consumeTurn({ owner, sessionId, project, text });
    } catch (error) {
      await failSession(sessionId, error);
      throw error;
    }
    return getSnapshot({ session_id: sessionId });
  }

  async function consumeTurn({ owner, sessionId, project, text }) {
    try {
      await setupReadinessPreflight(resolve(project.path));
      if (owner.cancelled) return;
      const store = await readChatStore();
      const located = findSessionById(store, sessionId);
      if (!located || located.session.kind !== "chat") throw new Error("Chat session disappeared before the turn started.");
      const executable = normalizeExecutable(getCodexExecutable());
      const settings = await runManager.getSettings();
      const env = prependPath(buildRuntimeEnv({ ...process.env }, settings), executable.pathEntries);
      const options = {
        resultKind: "chat",
        threadKey: `chat:${sessionId}`,
        threadId: located.session.thread_id || "",
        approvalPolicy: "on-request",
        codexBin: executable.command,
        env,
        approvalProvider: (request) => requestApproval(sessionId, request),
        onThreadBound: (binding) => bindThread(sessionId, binding)
      };
      owner.adapterStarted = true;
      for await (const event of owner.adapter.runTurn({ projectRoot: project.path, prompt: text, options })) {
        await projectEvent(sessionId, event);
      }
    } catch (error) {
      await failSession(sessionId, error);
    } finally {
      owner.adapterStarted = false;
      owner.completion = null;
    }
  }

  async function interrupt(input = {}) {
    await ensureInitialized();
    const sessionId = requireId(input.session_id, "session_id");
    const owner = owners.get(sessionId);
    if (!owner?.completion) throw new Error("This conversation has no active turn.");
    const currentStore = await readChatStore();
    const current = findSessionById(currentStore, sessionId);
    if (!current || current.session.kind !== "chat") throw new Error("Unknown Chat session.");
    if (!ACTIVE_STATUSES.has(current.session.status)) return getSnapshot({ session_id: sessionId });
    owner.cancelled = true;
    await mutateChatSession(sessionId, (session) => { session.status = "interrupting"; session.updated_at = now(); });
    changed("chat.turn.interrupting", sessionId);
    if (owner.adapterStarted) {
      try {
        await owner.adapter.interrupt();
      } catch (error) {
        const latest = await getSnapshot({ session_id: sessionId });
        const latestSession = latest.sessions.find((session) => session.id === sessionId);
        if (latestSession && !ACTIVE_STATUSES.has(latestSession.status)) return latest;
        await failSession(sessionId, error);
        throw error;
      }
      await declineSessionApprovals(sessionId);
    } else {
      await declineSessionApprovals(sessionId);
      await withTimeout(owner.completion, 15_000, "Timed out waiting for Chat startup to stop.");
      await mutateChatSession(sessionId, (session) => {
        session.status = "interrupted";
        session.error = "Stopped before Codex started the turn.";
        session.updated_at = now();
      });
      changed("chat.turn.completed", sessionId);
    }
    return getSnapshot({ session_id: sessionId });
  }

  async function decideApproval(input = {}) {
    await ensureInitialized();
    const sessionId = requireId(input.session_id, "session_id");
    const requestId = requireId(input.request_id, "request_id");
    const pending = pendingApprovals.get(approvalKey(sessionId, requestId));
    if (!pending) throw new Error("This approval request is no longer active.");
    if (pending.session_id !== sessionId) throw new Error("Approval request ownership mismatch.");
    await pending.resolve(input.decision === "accept");
    return getSnapshot({ session_id: sessionId });
  }

  async function remove(input = {}) {
    await ensureInitialized();
    const sessionId = requireId(input.session_id, "session_id");
    const owner = owners.get(sessionId);
    if (owner?.completion) {
      await interrupt({ session_id: sessionId });
      await withTimeout(owner.completion, 15_000, "Timed out waiting for the active Chat turn to stop.");
    }
    let removed = null;
    await updateChatStore((store) => {
      const located = findSessionById(store, sessionId);
      if (!located || located.session.kind !== "chat") throw new Error("Unknown Chat session.");
      removed = deleteProjectSession(store, located.project_id, sessionId);
      if (store.chat.selected_session_id === sessionId) store.chat.selected_session_id = "";
      return store;
    });
    owners.get(sessionId)?.adapter.close();
    owners.delete(sessionId);
    cancelStreamNotification(sessionId);
    liveMessages.delete(sessionId);
    await declineSessionApprovals(sessionId);
    changed("chat.session.deleted", sessionId);
    return { deleted_session_id: removed.id, snapshot: await getSnapshot() };
  }

  async function close() {
    for (const pending of pendingStreamNotifications.values()) clearTimeout(pending.timer);
    pendingStreamNotifications.clear();
    await Promise.all([...owners.entries()].map(async ([sessionId, owner]) => {
      if (owner.completion) {
        owner.cancelled = true;
        if (owner.adapterStarted) try { await owner.adapter.interrupt(); } catch {}
        await declineSessionApprovals(sessionId);
        try { await withTimeout(owner.completion, 2_000, ""); } catch {}
      }
      owner.adapter.close();
      cancelStreamNotification(sessionId);
      await mutateChatSession(sessionId, (session, store) => {
        commitLiveMessages(sessionId, session, store);
        if (ACTIVE_STATUSES.has(session.status)) {
          session.status = "interrupted";
          session.error ||= "ArcOrbit closed before this turn reached a terminal state.";
          session.updated_at = now();
        }
        completeRunningMessagesInStore(session, store);
      }).catch(() => {});
    }));
    for (const pending of pendingStreamNotifications.values()) clearTimeout(pending.timer);
    pendingStreamNotifications.clear();
    owners.clear();
    liveMessages.clear();
  }

  async function ownerFor(sessionId, project) {
    let owner = owners.get(sessionId);
    if (!owner) {
      owner = { project_id: project.id, project_path: resolve(project.path), adapter: createAdapter(), completion: null, adapterStarted: false, cancelled: false, thread_id: "", turn_id: "" };
      owners.set(sessionId, owner);
    }
    if (owner.project_id !== project.id || owner.project_path !== resolve(project.path)) throw new Error("Chat adapter ownership does not match the session workspace.");
    if (owner.completion) throw new Error("This conversation already has an active turn.");
    owner.cancelled = false;
    owner.adapterStarted = false;
    return owner;
  }

  async function bindThread(sessionId, binding) {
    const owner = owners.get(sessionId);
    if (owner) owner.thread_id = String(binding.threadId || "");
    await mutateChatSession(sessionId, (session) => {
      session.thread_id = String(binding.threadId || "");
      session.updated_at = now();
    });
    changed("chat.thread.bound", sessionId);
  }

  async function projectEvent(sessionId, event) {
    if (!event?.type) return;
    if (event.type === "codex.turn.started" || event.type === "codex.turn.start.completed") {
      const owner = owners.get(sessionId);
      if (owner) owner.turn_id = String(event.turn_id || "");
      await mutateChatSession(sessionId, (session) => {
        session.turn_id = String(event.turn_id || "");
        session.status = "running";
        session.updated_at = now();
      });
      changed("chat.turn.running", sessionId);
      return;
    }
    if (event.type === "codex.agent_message.delta") {
      upsertLiveMessage(sessionId, {
        role: "assistant", kind: "text", item_id: String(event.item_id || "assistant"), content_delta: String(event.text || ""), status: "running"
      });
      scheduleStreamNotification(sessionId);
      return;
    }
    if (event.type === "codex.reasoning.delta") {
      upsertLiveMessage(sessionId, {
        role: "assistant", kind: "reasoning", item_id: String(event.item_id || "reasoning"), content_delta: String(event.text || ""), status: "running"
      });
      scheduleStreamNotification(sessionId);
      return;
    }
    if (event.type === "codex.item.started") {
      const item = event.params?.item || {};
      if (["commandExecution", "fileChange", "toolCall", "webSearch"].includes(item.type)) {
        upsertLiveMessage(sessionId, {
          role: "tool", kind: "tool", item_id: String(item.id || "tool"), content: toolSummary(item), status: "running"
        });
        scheduleStreamNotification(sessionId);
      }
      return;
    }
    if (event.type === "codex.item.completed") {
      const item = event.params?.item || {};
      if (["commandExecution", "fileChange", "toolCall", "webSearch"].includes(item.type)) {
        upsertLiveMessage(sessionId, {
          role: "tool", kind: "tool", item_id: String(item.id || "tool"), content: toolSummary(item), status: toolSucceeded(item) ? "completed" : "failed"
        });
        await persistLiveMessage(sessionId, { itemId: String(item.id || "tool"), kind: "tool" });
        changed("chat.message.committed", sessionId);
      } else if (item.type === "agentMessage") {
        upsertLiveMessage(sessionId, {
          role: "assistant", kind: "text", item_id: String(item.id || "assistant"),
          ...(item.text !== undefined ? { content: String(item.text || "") } : {}), status: "completed"
        });
        await persistLiveMessage(sessionId, { itemId: String(item.id || "assistant"), kind: "text" });
        changed("chat.message.committed", sessionId);
      } else if (item.type === "reasoning") {
        await persistLiveMessage(sessionId, { itemId: String(item.id || "reasoning"), kind: "reasoning", status: "completed" });
        changed("chat.message.committed", sessionId);
      }
      return;
    }
    if (event.type === "codex.turn.completed") {
      cancelStreamNotification(sessionId);
      await mutateChatSession(sessionId, (session, store) => {
        const turnStatus = String(event.turn?.status || "");
        const interrupted = ["interrupting", "interrupted"].includes(session.status) || turnStatus === "interrupted";
        const failed = session.status === "failed" || turnStatus === "failed";
        session.status = interrupted ? "interrupted" : failed ? "failed" : "completed";
        if (session.status !== "failed") session.retry_client_request_id = "";
        session.turn_id = String(event.turn_id || session.turn_id || "");
        session.updated_at = now();
        commitLiveMessages(sessionId, session, store);
        completeRunningMessagesInStore(session, store);
      });
      changed("chat.turn.completed", sessionId);
      return;
    }
    if (event.type === "codex.error") {
      if (event.params?.willRetry === true) return;
      await failSession(sessionId, new Error(event.params?.error?.message || "Codex turn failed."));
    }
  }

  async function requestApproval(sessionId, request) {
    const requestId = requireId(request.request_id, "approval request id");
    const key = approvalKey(sessionId, requestId);
    if (pendingApprovals.has(key)) return false;
    let resolvePromise;
    const promise = new Promise((resolvePromiseValue) => { resolvePromise = resolvePromiseValue; });
    let timer;
    let settled = false;
    const pending = {
      session_id: sessionId,
      request_id: requestId,
      async resolve(value) {
        if (settled) return;
        settled = true;
        clearTimeout(timer);
        pendingApprovals.delete(key);
        await updateApprovalMessage(sessionId, requestId, value ? "completed" : "failed").catch(() => {});
        resolvePromise(Boolean(value));
      }
    };
    pendingApprovals.set(key, pending);
    timer = setTimeout(() => { pending.resolve(false).catch(() => {}); }, approvalTimeoutMs);
    cancelStreamNotification(sessionId);
    await mutateChatSession(sessionId, (session, store) => {
      commitLiveMessages(sessionId, session, store);
      session.status = "waiting_approval";
      session.updated_at = now();
      store.messages[sessionId] ||= [];
      store.messages[sessionId].push({
        id: `CHAT-APPROVAL-${idFactory()}`,
        session_id: sessionId,
        role: "system",
        kind: "approval",
        content: approvalSummary(request),
        status: "pending",
        approval_request_id: requestId,
        approval_method: request.method,
        created_at: now(),
        updated_at: now()
      });
    });
    changed("chat.approval.requested", sessionId);
    return promise;
  }

  async function declineSessionApprovals(sessionId) {
    await Promise.all([...pendingApprovals.values()].filter((pending) => pending.session_id === sessionId).map((pending) => pending.resolve(false)));
  }

  async function updateApprovalMessage(sessionId, requestId, status) {
    await mutateChatSession(sessionId, (session, store) => {
      const message = (store.messages[sessionId] || []).find((item) => item.approval_request_id === requestId);
      if (message) { message.status = status; message.updated_at = now(); }
      if (session.status === "waiting_approval") session.status = "running";
      session.updated_at = now();
    });
    changed("chat.approval.decided", sessionId);
  }

  async function failSession(sessionId, error) {
    const message = error?.message || String(error);
    cancelStreamNotification(sessionId);
    await mutateChatSession(sessionId, (session, store) => {
      session.status = session.status === "interrupting" ? "interrupted" : "failed";
      session.error = message;
      session.updated_at = now();
      commitLiveMessages(sessionId, session, store);
      completeRunningMessagesInStore(session, store);
      store.messages[sessionId] ||= [];
      store.messages[sessionId].push({
        id: `CHAT-ERROR-${idFactory()}`,
        session_id: sessionId,
        role: "system",
        kind: "error",
        content: message,
        status: "failed",
        thread_id: session.thread_id,
        turn_id: session.turn_id,
        item_id: "",
        created_at: now(),
        updated_at: now()
      });
    });
    await declineSessionApprovals(sessionId);
    changed("chat.turn.failed", sessionId);
  }

  async function mutateChatSession(sessionId, mutation) {
    return updateChatStore((store) => {
      const located = findSessionById(store, sessionId);
      if (!located || located.session.kind !== "chat") throw new Error(`Unknown Chat session: ${sessionId}`);
      mutation(located.session, store);
      return store;
    });
  }

  function changed(type, sessionId = "") {
    emitter.emit("event", { type, session_id: sessionId, occurred_at: now() });
  }

  function upsertLiveMessage(sessionId, input) {
    const owner = owners.get(sessionId);
    const messages = liveMessages.get(sessionId) || new Map();
    const key = liveMessageKey(input.item_id, input.kind);
    let message = messages.get(key);
    if (!message) {
      message = {
        id: `CHAT-MSG-${idFactory()}`,
        session_id: sessionId,
        role: input.role,
        kind: input.kind,
        content: "",
        status: input.status,
        thread_id: owner?.thread_id || "",
        turn_id: owner?.turn_id || "",
        item_id: input.item_id,
        created_at: now(),
        updated_at: now()
      };
      messages.set(key, message);
      liveMessages.set(sessionId, messages);
    }
    message.content = input.content_delta !== undefined ? `${message.content}${input.content_delta}` : input.content !== undefined ? String(input.content || "") : message.content;
    message.status = input.status || message.status;
    message.updated_at = now();
    return message;
  }

  async function persistLiveMessage(sessionId, { itemId, kind, status = "" }) {
    cancelStreamNotification(sessionId);
    const key = liveMessageKey(itemId, kind);
    await mutateChatSession(sessionId, (session, store) => {
      const messages = liveMessages.get(sessionId);
      const message = messages?.get(key);
      if (!message) return;
      if (status) message.status = status;
      upsertPersistedMessage(store.messages[sessionId] ||= [], message);
      store.messages[sessionId] = store.messages[sessionId].slice(-500);
      messages.delete(key);
      if (messages.size === 0) liveMessages.delete(sessionId);
      session.updated_at = message.updated_at;
    });
  }

  function commitLiveMessages(sessionId, session, store) {
    const messages = liveMessages.get(sessionId);
    if (!messages?.size || !store) return;
    store.messages[sessionId] ||= [];
    for (const message of messages.values()) upsertPersistedMessage(store.messages[sessionId], message);
    store.messages[sessionId] = store.messages[sessionId].slice(-500);
    liveMessages.delete(sessionId);
    session.updated_at = now();
  }

  function completeRunningMessagesInStore(session, store) {
    for (const message of store.messages[session.id] || []) {
      if (message.turn_id === session.turn_id && message.status === "running") {
        message.status = session.status === "interrupted" ? "interrupted" : session.status === "failed" ? "failed" : "completed";
        message.updated_at = now();
      }
    }
  }

  function scheduleStreamNotification(sessionId) {
    if (pendingStreamNotifications.has(sessionId)) return;
    const timer = setTimeout(() => {
      pendingStreamNotifications.delete(sessionId);
      const messages = [...(liveMessages.get(sessionId)?.values() || [])].map(publicMessage);
      if (messages.length) emitter.emit("event", { type: "chat.message.changed", session_id: sessionId, messages, occurred_at: now() });
    }, streamNotifyMs);
    pendingStreamNotifications.set(sessionId, { timer });
  }

  function cancelStreamNotification(sessionId) {
    const pending = pendingStreamNotifications.get(sessionId);
    if (!pending) return;
    clearTimeout(pending.timer);
    pendingStreamNotifications.delete(sessionId);
  }

  return {
    getSnapshot,
    createDraft,
    select,
    rename,
    send,
    interrupt,
    decideApproval,
    delete: remove,
    close,
    onEvent(listener) { emitter.on("event", listener); return () => emitter.off("event", listener); }
  };
}

function publicSession(session) {
  return {
    id: session.id,
    project_id: session.project_id,
    title: session.title,
    status: session.status,
    error: session.error || "",
    retry_client_request_id: session.status === "failed" ? String(session.retry_client_request_id || "") : "",
    created_at: session.created_at,
    updated_at: session.updated_at
  };
}

function publicMessage(message) {
  return {
    id: String(message.id || ""),
    role: ["user", "assistant", "tool", "system"].includes(message.role) ? message.role : "system",
    kind: ["text", "reasoning", "tool", "approval", "error"].includes(message.kind) ? message.kind : "text",
    content: String(message.content || ""),
    status: String(message.status || "completed"),
    approval_request_id: String(message.approval_request_id || ""),
    created_at: String(message.created_at || ""),
    updated_at: String(message.updated_at || message.created_at || "")
  };
}

function liveMessageKey(itemId, kind) {
  return `${String(itemId || "")}:${String(kind || "")}`;
}

function upsertPersistedMessage(messages, input) {
  const index = messages.findIndex((message) => message.id === input.id);
  const persisted = { ...input };
  if (index >= 0) messages[index] = persisted;
  else messages.push(persisted);
}

function projectedSessionMessages(persistedMessages, liveMessageMap) {
  if (!liveMessageMap?.size) return persistedMessages;
  const projected = persistedMessages.map((message) => ({ ...message }));
  for (const message of liveMessageMap.values()) upsertPersistedMessage(projected, message);
  return projected;
}

function approvalSummary(request) {
  const params = request.params || {};
  if (request.method.includes("command")) return `运行命令：${String(params.command || "").slice(0, 400)}`;
  if (request.method.includes("fileChange") || request.method.includes("Patch")) return "应用文件变更";
  if (request.method.includes("permissions")) return `授予本轮权限：${Object.keys(params.permissions || {}).join("、") || "未说明"}`;
  return `批准 Codex 操作：${request.method}`;
}

function toolSummary(item) {
  if (item.type === "commandExecution") return String(item.command || item.cmd || "运行命令").slice(0, 400);
  if (item.type === "fileChange") return "更新项目文件";
  if (item.type === "webSearch") return String(item.query || "搜索资料").slice(0, 400);
  return String(item.name || item.tool || "使用工具").slice(0, 400);
}

function toolSucceeded(item) {
  const code = item.exitCode ?? item.exit_code;
  return code === undefined || code === null || code === 0;
}

function approvalKey(sessionId, requestId) { return `${sessionId}:${requestId}`; }
function requireId(value, name) {
  const result = String(value || "").trim();
  if (!result || result.length > 200) throw new Error(`${name} is required.`);
  return result;
}
function findChatRequest(store, requestId) {
  for (const [projectId, sessions] of Object.entries(store.sessions || {})) {
    for (const session of sessions || []) {
      if (session.kind !== "chat") continue;
      const message = (store.messages?.[session.id] || []).find((item) => (
        item.role === "user" && item.client_request_id === requestId
      ));
      if (message) return { project_id: projectId, session, message };
    }
  }
  return null;
}
function boundedTitle(text) { return String(text || "").replace(/\s+/g, " ").trim().slice(0, 64) || "New chat"; }
function normalizeExecutable(value) {
  const command = typeof value === "string" ? value : value?.command;
  if (!String(command || "").trim()) throw new Error("Setup Readiness did not provide a resolved Codex executable.");
  return { command: String(command), pathEntries: Array.isArray(value?.pathEntries) ? value.pathEntries.map(String).filter(Boolean) : [] };
}
function prependPath(env, entries) {
  if (!entries.length) return env;
  const key = Object.keys(env).find((candidate) => candidate.toUpperCase() === "PATH") || "PATH";
  return { ...env, [key]: [...new Set(entries), env[key]].filter(Boolean).join(process.platform === "win32" ? ";" : ":") };
}
function withTimeout(promise, timeoutMs, message) {
  return new Promise((resolvePromise, rejectPromise) => {
    const timer = setTimeout(() => rejectPromise(new Error(message || "Timed out.")), timeoutMs);
    Promise.resolve(promise).then(
      (value) => { clearTimeout(timer); resolvePromise(value); },
      (error) => { clearTimeout(timer); rejectPromise(error); }
    );
  });
}
