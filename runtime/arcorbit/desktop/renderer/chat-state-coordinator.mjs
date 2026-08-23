function normalizeOwner(value = {}) {
  return {
    session_id: String(value.session_id || ""),
    project_id: String(value.project_id || "")
  };
}

function errorMessage(error) {
  return error?.message || String(error);
}

export function createChatStateCoordinator({
  api,
  normalizeSnapshot = (value) => value,
  createRequestId,
  delayMs = 350,
  setTimer = setTimeout,
  clearTimer = clearTimeout
} = {}) {
  for (const method of ["createChat", "selectChat", "deleteChat", "renameChat", "interruptChat", "decideChatApproval", "sendChatMessage", "chatSnapshot"]) {
    if (typeof api?.[method] !== "function") throw new TypeError(`Chat state coordinator requires api.${method}.`);
  }
  if (typeof createRequestId !== "function") throw new TypeError("Chat state coordinator requires a request id factory.");

  let value = {
    snapshot: normalizeSnapshot({}),
    owner: normalizeOwner(),
    draft: "",
    retry_client_request_id: "",
    sending: false,
    error: ""
  };
  let ownerEpoch = 0;
  let sendEpoch = 0;
  let draftRevision = 0;
  let pendingDraft = null;
  let draftTimer = null;
  let persistenceTail = Promise.resolve();

  function sessionById(snapshot, sessionId) {
    return (snapshot.sessions || []).find((session) => session.id === sessionId) || null;
  }

  function currentProjectId() {
    return sessionById(value.snapshot, value.owner.session_id)?.project_id
      || value.owner.project_id
      || value.snapshot.draft?.project_id
      || value.snapshot.projects?.[0]?.id
      || "";
  }

  function draftPayload(text = value.draft) {
    return {
      session_id: value.owner.session_id,
      project_id: currentProjectId(),
      text: String(text || "")
    };
  }

  function clearDraftTimer() {
    if (draftTimer === null) return;
    clearTimer(draftTimer);
    draftTimer = null;
  }

  function enqueueDraft(payload) {
    const request = persistenceTail.catch(() => {}).then(() => api.createChat(payload));
    persistenceTail = request;
    return request;
  }

  function persistPendingDraft() {
    if (!pendingDraft) return persistenceTail;
    const payload = pendingDraft;
    pendingDraft = null;
    clearDraftTimer();
    return enqueueDraft(payload);
  }

  function scheduleDraft() {
    pendingDraft = draftPayload();
    clearDraftTimer();
    draftTimer = setTimer(() => {
      draftTimer = null;
      persistPendingDraft().catch(() => {});
    }, delayMs);
  }

  function beginOwnerTransition() {
    ownerEpoch += 1;
    return ownerEpoch;
  }

  function observeOwner() {
    return ownerEpoch;
  }

  function isCurrent(epoch, sessionId = null) {
    return epoch === ownerEpoch && (sessionId === null || sessionId === value.owner.session_id);
  }

  function adoptSnapshot(snapshotValue, { epoch, strategy = "authoritative", sessionId = null } = {}) {
    if (!isCurrent(epoch, sessionId)) return false;
    const snapshot = normalizeSnapshot(snapshotValue);
    const previous = value;
    const snapshotSelection = String(snapshot.selected_session_id || "");
    const previousSession = sessionById(snapshot, previous.owner.session_id);

    if (strategy === "preserve-owner" && (previousSession || (!previous.owner.session_id && previous.owner.project_id))) {
      value = {
        ...previous,
        snapshot,
        owner: previousSession
          ? { session_id: previous.owner.session_id, project_id: previousSession.project_id || "" }
          : previous.owner
      };
      return true;
    }

    if (strategy === "adopt-session-preserve-draft" && snapshotSelection && sessionById(snapshot, snapshotSelection)) {
      const session = sessionById(snapshot, snapshotSelection);
      value = {
        ...previous,
        snapshot,
        owner: { session_id: snapshotSelection, project_id: session?.project_id || "" }
      };
      return true;
    }

    const selectedSession = sessionById(snapshot, snapshotSelection);
    value = {
      ...previous,
      snapshot,
      owner: selectedSession
        ? { session_id: snapshotSelection, project_id: selectedSession.project_id || "" }
        : { session_id: "", project_id: String(snapshot.draft?.project_id || snapshot.projects?.[0]?.id || "") },
      draft: String(snapshot.draft?.text || "")
    };
    draftRevision += 1;
    return true;
  }

  function adoptDraftOwnerTransition(snapshot, { epoch, acceptedDraftRevision }) {
    return adoptSnapshot(snapshot, {
      epoch,
      strategy: draftRevision === acceptedDraftRevision ? "authoritative" : "preserve-owner"
    });
  }

  async function flushDraft() {
    return persistPendingDraft();
  }

  async function initialize(snapshot) {
    const epoch = beginOwnerTransition();
    adoptSnapshot(snapshot, { epoch });
  }

  async function newDraft(projectId = currentProjectId()) {
    const epoch = beginOwnerTransition();
    value = {
      ...value,
      owner: { session_id: "", project_id: String(projectId || "") },
      draft: "",
      retry_client_request_id: "",
      error: ""
    };
    draftRevision += 1;
    const acceptedDraftRevision = draftRevision;
    await flushDraft();
    const snapshot = await api.createChat({ project_id: value.owner.project_id, text: "" });
    adoptDraftOwnerTransition(snapshot, { epoch, acceptedDraftRevision });
    return snapshot;
  }

  async function changeDraftWorkspace(projectId) {
    const epoch = beginOwnerTransition();
    const draft = value.draft;
    value = {
      ...value,
      owner: { session_id: "", project_id: String(projectId || "") },
      retry_client_request_id: "",
      error: ""
    };
    const acceptedDraftRevision = draftRevision;
    await flushDraft();
    const snapshot = await api.createChat({ project_id: value.owner.project_id, text: draft });
    adoptDraftOwnerTransition(snapshot, { epoch, acceptedDraftRevision });
    return snapshot;
  }

  async function selectSession(sessionId) {
    const epoch = beginOwnerTransition();
    await flushDraft();
    const snapshot = await api.selectChat({ session_id: String(sessionId || "") });
    adoptSnapshot(snapshot, { epoch });
    return snapshot;
  }

  async function deleteCurrentSession() {
    const sessionId = value.owner.session_id;
    if (!sessionId) return null;
    const epoch = beginOwnerTransition();
    value = { ...value, error: "" };
    await flushDraft();
    const result = await api.deleteChat({ session_id: sessionId });
    adoptSnapshot(result.snapshot, { epoch });
    return result;
  }

  async function applySessionMutation(operation) {
    const sessionId = value.owner.session_id;
    if (!sessionId) return null;
    const epoch = observeOwner();
    const snapshot = await operation(sessionId);
    adoptSnapshot(snapshot, { epoch, strategy: "preserve-owner", sessionId });
    return snapshot;
  }

  async function renameCurrentSession(title) {
    return applySessionMutation((sessionId) => api.renameChat({ session_id: sessionId, title: String(title || "") }));
  }

  async function interruptCurrentSession() {
    return applySessionMutation((sessionId) => api.interruptChat({ session_id: sessionId }));
  }

  async function decideApproval(requestId, decision) {
    return applySessionMutation((sessionId) => api.decideChatApproval({
      session_id: sessionId,
      request_id: String(requestId || ""),
      decision: String(decision || "")
    }));
  }

  async function refresh({ quiet = false, resetOwner = false } = {}) {
    const epoch = resetOwner ? beginOwnerTransition() : observeOwner();
    const sessionId = resetOwner ? null : value.owner.session_id;
    try {
      const snapshot = await api.chatSnapshot({ session_id: value.owner.session_id || "" });
      adoptSnapshot(snapshot, {
        epoch,
        strategy: resetOwner ? "authoritative" : "preserve-owner",
        sessionId
      });
      if (!quiet && isCurrent(epoch, sessionId)) value = { ...value, error: "" };
      return snapshot;
    } catch (error) {
      if (!quiet && isCurrent(epoch, sessionId)) value = { ...value, error: errorMessage(error) };
      throw error;
    }
  }

  function setDraft(text) {
    value = { ...value, draft: String(text || "") };
    draftRevision += 1;
    scheduleDraft();
  }

  function prepareRetry() {
    const lastUser = [...(value.snapshot.messages || [])].reverse().find((message) => message.role === "user" && message.kind === "text");
    value = {
      ...value,
      draft: lastUser?.content || value.draft,
      retry_client_request_id: sessionById(value.snapshot, value.owner.session_id)?.retry_client_request_id || ""
    };
    draftRevision += 1;
  }

  async function send() {
    const text = value.draft.trim();
    const projectId = currentProjectId();
    if (!text || !projectId || value.sending) return null;
    const sessionId = value.owner.session_id;
    const session = sessionById(value.snapshot, sessionId);
    const retryId = value.retry_client_request_id;
    const acceptedDraftRevision = draftRevision;
    const clientRequestId = retryId && retryId === String(session?.retry_client_request_id || "")
      ? retryId
      : String(createRequestId());
    const epoch = sessionId ? observeOwner() : beginOwnerTransition();
    const currentSend = ++sendEpoch;
    value = { ...value, sending: true, error: "" };
    try {
      await flushDraft();
      if (!isCurrent(epoch, sessionId || null)) return null;
      if (draftRevision === acceptedDraftRevision) {
        value = { ...value, draft: "" };
        draftRevision += 1;
      }
      const snapshot = await api.sendChatMessage({
        session_id: sessionId,
        project_id: projectId,
        text,
        client_request_id: clientRequestId
      });
      value = { ...value, retry_client_request_id: "" };
      const applied = adoptSnapshot(snapshot, {
        epoch,
        strategy: sessionId ? "preserve-owner" : "adopt-session-preserve-draft",
        sessionId: sessionId || null
      });
      if (applied && !sessionId && value.draft) {
        scheduleDraft();
        await flushDraft();
      }
      return snapshot;
    } catch (error) {
      if (isCurrent(epoch, sessionId || null)) {
        const restoredDraft = value.draft || text;
        value = {
          ...value,
          draft: restoredDraft,
          error: errorMessage(error)
        };
        draftRevision += 1;
        try {
          const snapshot = await api.chatSnapshot({ session_id: value.owner.session_id || "" });
          adoptSnapshot(snapshot, { epoch, strategy: "preserve-owner", sessionId: value.owner.session_id || null });
        } catch {}
      }
      throw error;
    } finally {
      if (currentSend === sendEpoch) value = { ...value, sending: false };
    }
  }

  function getState() {
    return value;
  }

  return {
    getState,
    initialize,
    newDraft,
    changeDraftWorkspace,
    selectSession,
    deleteCurrentSession,
    renameCurrentSession,
    interruptCurrentSession,
    decideApproval,
    refresh,
    setDraft,
    prepareRetry,
    send,
    flushDraft
  };
}
