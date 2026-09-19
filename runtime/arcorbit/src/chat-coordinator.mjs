import { normalizeChatContext } from './chat-context.mjs';
import {
  normalizeCodexExecutionSettings,
  normalizeCodexSettings,
  validateCodexExecutionSettingsPatch
} from "./codex-model-settings.mjs";
import { createHash, randomUUID } from "node:crypto";
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
  getTurnContext = async () => ({}),
  sessionKind = "chat",
  acceptedSessionKinds = [sessionKind],
  authorizeSession = async () => true,
  onTurnSettled = async () => {},
  approvalTimeoutMs = 5 * 60_000,
  streamNotifyMs = 32,
  now = () => new Date().toISOString(),
  idFactory = () => randomUUID()
}) {
  if (!runManager) throw new TypeError("ChatCoordinator requires a Desktop Run Manager.");
  const accepts = session => acceptedSessionKinds.includes(session.kind);
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

  const readChatMetadata = () => runManager.readDesktopChatMetadata?.() || runManager.readDesktopStore();
  const updateChatMetadata = updater => runManager.updateDesktopChatMetadata
    ? runManager.updateDesktopChatMetadata(updater)
    : runManager.updateDesktopStore(store => updater(store, store.settings));

  async function ensureInitialized() {
    if (initialized) return;
    const metadata = await readChatMetadata();
    // Only legacy synthetic sessions require inspecting history during migration.
    const hasLegacyDefaults = Object.entries(metadata.sessions || {}).some(([projectId, sessions]) =>
      sessions.some(session => session.id === `SESSION-${projectId}-default` && session.title === "Automation"));
    const initialize = hasLegacyDefaults ? updateChatStore : updateChatMetadata;
    await initialize((store) => {
      // Migrate only unused synthetic defaults, with message partitions loaded.
      for (const [projectId, sessions] of Object.entries(store.sessions || {})) {
        for (const session of [...sessions]) {
          if (session.id !== `SESSION-${projectId}-default` || session.title !== "Automation"
            || session.task_id || session.thread_id || session.turn_id || session.draft
            || ACTIVE_STATUSES.has(session.status)
            || store.messages?.[session.id]?.length
            || store.runs?.some(run => run.session_id === session.id)) continue;
          deleteProjectSession(store, projectId, session.id);
          if (store.chat.selected_session_id === session.id) store.chat.selected_session_id = "";
        }
      }
      for (const sessions of Object.values(store.sessions || {})) {
        for (const session of sessions || []) {
          if (accepts(session) && ACTIVE_STATUSES.has(session.status)) {
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
    const store = await (runManager.readDesktopChatSnapshotStore?.(input) || readChatStore());
    const sessions = Object.values(store.sessions || {}).flat()
      .filter((session) => accepts(session) && !session.chat_hidden)
      .sort((left, right) => String(right.created_at || "").localeCompare(String(left.created_at || "")) || String(left.id).localeCompare(String(right.id)));
    const accessContext={store};
    const allowed = await Promise.all(sessions.map(session => authorizeSession(session,accessContext)));
    for(let i=sessions.length-1;i>=0;i--)if(!allowed[i])sessions.splice(i,1);
    const explicitSelection = Object.prototype.hasOwnProperty.call(input, "session_id");
    const requestedId = String(explicitSelection ? input.session_id || "" : store.chat?.selected_session_id || "");
    const selected = sessions.find((session) => session.id === requestedId) || null;
    const chatDefaults = normalizeCodexSettings(store.settings?.codex).chat;
    const selectedConfiguration = normalizeCodexExecutionSettings(
      selected || store.chat?.draft,
      chatDefaults
    );
    const pendingApprovals = sessions.flatMap((session) => projectedSessionMessages(store.messages?.[session.id] || [], liveMessages.get(session.id))
      .filter((message) => message.kind === "approval" && message.status === "pending")
      .map((message) => ({ ...publicMessage(message), session_id: session.id, project_id: session.project_id, session_title: session.title })));
    return {
      generated_at: now(),
      projects: (store.projects || []).map(({ id, name }) => ({ id, name })),
      sessions: sessions.map((session) => publicSession(session, chatDefaults)),
      selected_session_id: selected?.id || "",
      messages: selected ? projectedSessionMessages(store.messages?.[selected.id] || [], liveMessages.get(selected.id)).map(publicMessage) : [],
      pending_approvals: pendingApprovals,
      draft: {
        project_id: String(selected?.project_id || store.chat?.draft?.project_id || ""),
        text: String(selected ? selected.draft || "" : store.chat?.draft?.text || ""),
        native_context: normalizeChatContext(selected ? selected.native_context : store.chat?.draft?.native_context),
        ...selectedConfiguration
      }
    };
  }

  async function createDraft(input = {}) {
    await ensureInitialized();
    const sessionId = String(input.session_id || "");
    const projectId = String(input.project_id || "");
    const text = String(input.text || "").slice(0, 100_000);
    const requestedConfiguration = configurationFromInput(input);
    // Drafts are session metadata; never hydrate or clone transcript history here.
    const store = await readChatMetadata();
    if (sessionId) {
      const located = findSessionById(store, sessionId);
      if (located && !await authorizeSession(located.session, { store })) throw new Error("该会话属于其他账号或不可访问的项目。");
    }
    if (projectId && !store.projects.some((project) => project.id === projectId)) throw new Error("Select an available local Product Workspace.");
    const updateMetadata = runManager.updateDesktopChatMetadata
      ? (update) => runManager.updateDesktopChatMetadata(update)
      : (update) => runManager.updateDesktopStore(draft => update(draft, draft.settings));
    await updateMetadata((draft, settings) => {
      draft.chat ||= {};
      const chatDefaults = normalizeCodexSettings(settings?.codex).chat;
      if (sessionId) {
        const located = findSessionById(draft, sessionId);
        if (!located || !accepts(located.session)) throw new Error("Unknown Chat session.");
        located.session.draft = text;
        located.session.native_context=normalizeChatContext(input.native_context);
        if (requestedConfiguration) Object.assign(located.session, requestedConfiguration);
        located.session.updated_at = now();
        draft.chat.selected_session_id = sessionId;
        return draft;
      }
      draft.chat.selected_session_id = "";
      const configuration = requestedConfiguration || normalizeCodexExecutionSettings(draft.chat.draft, chatDefaults);
      draft.chat.draft = { project_id: projectId, text, native_context:normalizeChatContext(input.native_context), ...configuration, updated_at: now() };
      return draft;
    });
    changed("chat.draft.changed");
    // Autosave callers only need persistence acknowledgement. Navigation callers
    // retain the default snapshot response for adopting the new draft owner.
    if (input.response === "ack") return { saved: true, session_id: sessionId, project_id: projectId };
    return getSnapshot({ session_id: sessionId });
  }

  async function select(input = {}) {
    await ensureInitialized();
    const sessionId = String(input.session_id || "");
    const metadata = await readChatMetadata();
    if (sessionId) {
      const located = findSessionById(metadata, sessionId);
      if (located && !await authorizeSession(located.session, { store: metadata })) {
        throw new Error("该会话属于其他账号或不可访问的项目。");
      }
    }
    await updateChatMetadata((store) => {
      store.chat ||= {};
      if (sessionId) {
        const located = findSessionById(store, sessionId);
        if (!located || !accepts(located.session) || located.session.chat_hidden) throw new Error("Unknown Chat session (missing or hidden).");
      }
      store.chat.selected_session_id = sessionId;
      return store;
    });
    return getSnapshot({ session_id: sessionId });
  }

  async function rename(input = {}) {
    await ensureInitialized();
    if(input.session_id){const located=findSessionById(await readChatStore(),String(input.session_id));if(located && !await authorizeSession(located.session))throw new Error("该会话属于其他账号或不可访问的项目。");}
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
    if(input.session_id){const located=findSessionById(await readChatStore(),String(input.session_id));if(located && !await authorizeSession(located.session))throw new Error("该会话属于其他账号或不可访问的项目。");}
    const nativeContext=normalizeChatContext(input.native_context);
    const text = String(input.text || (nativeContext.capability ? `请调用 ${nativeContext.capability.label}` : nativeContext.refs.length ? "请分析引用的上下文。" : "")).trim();
    if (!text) throw new Error("Enter a message before sending.");
    const requestId = requireId(input.client_request_id, "client_request_id");
    let sessionId = String(input.session_id || "");
    let project;
    let acceptedMessage = false;
    let shouldStart = false;
    let turnConfiguration;
    const requestedConfiguration = configurationFromInput(input);
    const yoloMode = normalizeCodexSettings((await runManager.getSettings()).codex).yolo_mode;

    await updateChatStore((store) => {
      let located = sessionId ? findSessionById(store, sessionId) : null;
      const replay = findChatRequest(store, requestId, acceptedSessionKinds);
      if (replay) {
        if (sessionId && sessionId !== replay.session.id) throw new Error("Chat request id belongs to another session.");
        sessionId = replay.session.id;
        located = replay;
      }
      if (sessionId && !located) throw new Error("Unknown Chat session.");
      if (located && !accepts(located.session)) throw new Error("The selected session does not belong to Chat.");
      const projectId = located?.project_id || String(input.project_id || store.chat?.draft?.project_id || "");
      project = store.projects.find((item) => item.id === projectId);
      if (!project) throw new Error("Select an available local Product Workspace before sending.");
      const creating = !located;
      if (creating) {
        sessionId = `CHAT-${idFactory()}`;
        const createdAt = now();
        const chatDefaults = normalizeCodexSettings(store.settings?.codex).chat;
        const configuration = requestedConfiguration || normalizeCodexExecutionSettings(store.chat?.draft, chatDefaults);
        const session = {
          id: sessionId,
          project_id: project.id,
          kind: sessionKind,
          title: boundedTitle(text),
          thread_id: "",
          turn_id: "",
          retry_client_request_id: "",
          status: "starting",
          error: "",
          draft: "",
          ...configuration,
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
      if (requestedConfiguration) Object.assign(located.session, requestedConfiguration);
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
          native_context:nativeContext,
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
      if(!input.preserve_draft){located.session.draft = "";located.session.native_context=normalizeChatContext();}
      located.session.retry_client_request_id = requestId;
      located.session.updated_at = createdAt;
      turnConfiguration = normalizeCodexExecutionSettings(
        located.session,
        normalizeCodexSettings(store.settings?.codex).chat
      );
      if (sessionKind === "chat") {
        store.chat.selected_session_id = sessionId;
        store.chat.draft = { project_id: project.id, text: "", updated_at: createdAt };
      }
      shouldStart = true;
      return store;
    });
    if (!shouldStart) return getSnapshot({ session_id: sessionId });
    if (acceptedMessage) changed("chat.message.accepted", sessionId);
    changed("chat.turn.starting", sessionId);
    try {
      const owner = await ownerFor(sessionId, project);
      owner.completion = consumeTurn({ owner, sessionId, project, text, nativeContext, requestId, configuration: { ...turnConfiguration, yoloMode } });
    } catch (error) {
      await failSession(sessionId, error);
      throw error;
    }
    return getSnapshot({ session_id: sessionId });
  }

  async function consumeTurn({ owner, sessionId, project, text, nativeContext, requestId, configuration }) {
    try {
      await setupReadinessPreflight(resolve(project.path));
      if (owner.cancelled) return;
      const store = await readChatStore();
      const located = findSessionById(store, sessionId);
      if (!located || !accepts(located.session)) throw new Error("Chat session disappeared before the turn started.");
      const executable = normalizeExecutable(getCodexExecutable());
      const settings = await runManager.getSettings();
      const env = prependPath(buildRuntimeEnv({ ...process.env }, settings), executable.pathEntries);
      const codexSettings = normalizeCodexExecutionSettings(
        configuration,
        normalizeCodexSettings(settings.codex).chat
      );
      const context = await getTurnContext({ project, sessionId, text, nativeContext, requestId, yoloMode: configuration.yoloMode });
      const skillFingerprint = context.options?.sceneSkillBinding?.fingerprint || '';
      if (owner.skillFingerprint && owner.skillFingerprint !== skillFingerprint) {
        await owner.adapter.close();
        owner.adapter = createAdapter();
      }
      owner.skillFingerprint = skillFingerprint;
      if (context.options?.commandEnvironment || context.options?.extraEnvironment) {
        const signature=createHash('sha256').update(JSON.stringify([executable.command,Object.entries({...context.options.commandEnvironment,...context.options.extraEnvironment}).sort(([a],[b])=>a.localeCompare(b))])).digest('hex');
        if(owner.commandEnvironmentSignature && owner.commandEnvironmentSignature!==signature){
          await owner.adapter.close();owner.adapter=createAdapter();
        }
        owner.commandEnvironmentSignature=signature;
      }
      const options = {
        ...context.options,
        model: codexSettings.model,
        reasoningEffort: codexSettings.reasoning_effort,
        resultKind: "chat",
        threadKey: `chat:${sessionId}`,
        threadId: context.options?.threadId || located.session.thread_id || "",
        approvalPolicy: "on-request",
        yoloMode: configuration.yoloMode,
        codexBin: executable.command,
        env: { ...(context.options?.commandEnvironment || env), ...(context.options?.extraEnvironment || {}) },
        approvalProvider: (request) => requestApproval(sessionId, request),
        onThreadBound: async (binding) => { await context.options?.onThreadBound?.(binding); await bindThread(sessionId, binding); }
      };
      owner.adapterStarted = true;
      for await (const event of owner.adapter.runTurn({ projectRoot: project.path, prompt: context.prompt || text, options })) {
        await projectEvent(sessionId, event);
      }
    } catch (error) {
      await failSession(sessionId, error);
    } finally {
      owner.adapterStarted = false;
      owner.completion = null;
      if (sessionKind !== "chat") { await owner.adapter.close(); owners.delete(sessionId); }
      await onTurnSettled({ sessionId });
    }
  }

  async function interrupt(input = {}) {
    await ensureInitialized();
    if(input.session_id){const located=findSessionById(await readChatStore(),String(input.session_id));if(located && !await authorizeSession(located.session))throw new Error("该会话属于其他账号或不可访问的项目。");}
    const sessionId = requireId(input.session_id, "session_id");
    const owner = owners.get(sessionId);
    if (!owner?.completion) throw new Error("This conversation has no active turn.");
    const currentStore = await readChatStore();
    const current = findSessionById(currentStore, sessionId);
    if (!current || !accepts(current.session)) throw new Error("Unknown Chat session.");
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
    if(input.session_id){const located=findSessionById(await readChatStore(),String(input.session_id));if(located && !await authorizeSession(located.session))throw new Error("该会话属于其他账号或不可访问的项目。");}
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
    if(input.session_id){const located=findSessionById(await readChatStore(),String(input.session_id));if(located && !await authorizeSession(located.session))throw new Error("该会话属于其他账号或不可访问的项目。");}
    const sessionId = requireId(input.session_id, "session_id");
    const owner = owners.get(sessionId);
    if (owner?.completion) {
      await interrupt({ session_id: sessionId });
      await withTimeout(owner.completion, 15_000, "Timed out waiting for the active Chat turn to stop.");
    }
    let removed = null;
    await updateChatStore((store) => {
      const located = findSessionById(store, sessionId);
      if (!located || !accepts(located.session)) throw new Error("Unknown Chat session.");
      if(located.session.task_id){located.session.chat_hidden=true;removed=located.session;}
      else removed = deleteProjectSession(store, located.project_id, sessionId);
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
      if (["commandExecution", "fileChange", "toolCall", "webSearch", "dynamicToolCall"].includes(item.type)) {
        upsertToolMessage(sessionId, item, "running");
        scheduleStreamNotification(sessionId);
      }
      return;
    }
    if (event.type === "codex.item.completed") {
      const item = event.params?.item || {};
      if (["commandExecution", "fileChange", "toolCall", "webSearch", "dynamicToolCall"].includes(item.type)) {
        upsertToolMessage(sessionId, item, toolSucceeded(item) ? "completed" : "failed");
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
        turn_id: session.turn_id,
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
      if (!located || !accepts(located.session)) throw new Error(`Unknown Chat session: ${sessionId}`);
      mutation(located.session, store);
      return store;
    });
  }

  function changed(type, sessionId = "") {
    emitter.emit("event", { type, session_id: sessionId, occurred_at: now() });
  }

  function upsertToolMessage(sessionId, item, status) {
    const itemId = String(item.id || "tool");
    const previous = liveMessages.get(sessionId)?.get(liveMessageKey(itemId, "tool"));
    upsertLiveMessage(sessionId, {
      role: "tool", kind: "tool", item_id: itemId,
      content: toolSummary(item, previous?.content), status
    });
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
    notifyNative:sessionId=>changed("chat.native.updated",sessionId),
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

function publicSession(session, fallback) {
  return {
    id: session.id,
    project_id: session.project_id,
    title: session.title,
    task_id:String(session.task_id || ""),remote_project_id:String(session.remote_project_id || ""),source_session_id:String(session.source_session_id || ""),
    native_context:normalizeChatContext(session.native_context),
    status: session.status,
    error: session.error || "",
    retry_client_request_id: session.status === "failed" ? String(session.retry_client_request_id || "") : "",
    ...normalizeCodexExecutionSettings(session, fallback),
    created_at: session.created_at,
    updated_at: session.updated_at
  };
}

function configurationFromInput(input = {}) {
  const hasModel = Object.prototype.hasOwnProperty.call(input, "model");
  const hasEffort = Object.prototype.hasOwnProperty.call(input, "reasoning_effort");
  if (!hasModel && !hasEffort) return null;
  const configuration = { model: input.model, reasoning_effort: input.reasoning_effort };
  validateCodexExecutionSettingsPatch(configuration);
  return normalizeCodexExecutionSettings(configuration);
}

function publicMessage(message) {
  return {
    id: String(message.id || ""),
    role: ["user", "assistant", "tool", "system"].includes(message.role) ? message.role : "system",
    kind: ["text", "reasoning", "tool", "approval", "error"].includes(message.kind) ? message.kind : "text",
    content: String(message.content || ""),
    native_context:normalizeChatContext(message.native_context),
    native_result:message.native_result || null,
    status: String(message.status || "completed"),
    approval_request_id: String(message.approval_request_id || ""),
    approval_method: String(message.approval_method || ""),
    turn_id: String(message.turn_id || ""),
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

function toolSummary(item, previousContent = "") {
  if (item.type === "dynamicToolCall") return `${item.tool || "产品工具"}\n输入：${JSON.stringify(item.arguments || {})}\n结果：${JSON.stringify(Array.isArray(item.contentItems)?item.contentItems.map(c=>c.type==='inputImage'?{type:'inputImage',description:'已提供材料图片'}:c):(item.result || []))}`.slice(0, 30000);
  if (item.type === "commandExecution") return String(item.command || item.cmd || "运行命令").slice(0, 400);
  if (item.type === "fileChange") return fileChangeSummary(item) || previousContent || "更新项目文件";
  if (item.type === "webSearch") return String(item.query || "搜索资料").slice(0, 400);
  return String(item.name || item.tool || "使用工具").slice(0, 400);
}

function fileChangeSummary(item) {
  const pathValue = (value) => typeof value === "string" ? value.replace(/[\u0000-\u001f\u007f]/g, " ").trim() : "";
  const readPath = (change) => pathValue(change?.path) || pathValue(change?.filePath);
  const paths = [...new Set((Array.isArray(item.changes) ? item.changes : []).map(readPath).filter(Boolean))];
  if (!paths.length) {
    const fallback = readPath(item);
    if (fallback) paths.push(fallback);
  }
  if (!paths.length) return "";
  const targets = paths.slice(0, 3).map((path) => {
    const characters = Array.from(path);
    return characters.length <= 120 ? path : `${characters.slice(0, 48).join("")}…${characters.slice(-71).join("")}`;
  });
  return `更新 ${targets.join("、")}${paths.length > 3 ? ` 等 ${paths.length} 个文件` : ""}`;
}

function toolSucceeded(item) {
  if (item.type === "dynamicToolCall") return item.success !== false;
  const code = item.exitCode ?? item.exit_code;
  return code === undefined || code === null || code === 0;
}

function approvalKey(sessionId, requestId) { return `${sessionId}:${requestId}`; }
function requireId(value, name) {
  const result = String(value || "").trim();
  if (!result || result.length > 200) throw new Error(`${name} is required.`);
  return result;
}
function findChatRequest(store, requestId, acceptedSessionKinds = ["chat"]) {
  for (const [projectId, sessions] of Object.entries(store.sessions || {})) {
    for (const session of sessions || []) {
      if (!acceptedSessionKinds.includes(session.kind)) continue;
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
