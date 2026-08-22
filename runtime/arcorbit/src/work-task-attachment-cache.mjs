function epoch(value) {
  return Math.max(0, Math.trunc(Number(value) || 0));
}

export function taskAttachmentIdentityKey({ platform = {}, authentication = {} } = {}) {
  const userId = String(platform?.user?.id ?? "").trim();
  if (userId) return `user:${userId}`;
  const identity = authentication?.authenticated ? String(authentication.identity || "").trim() : "";
  return identity ? `auth:${identity}` : "";
}

export function invalidateTaskAttachmentCaches(state, { clearPending = false } = {}) {
  state.platformTaskAttachments = {};
  state.platformTaskAttachmentPreviews = {};
  state.taskAttachmentCacheEpoch = epoch(state.taskAttachmentCacheEpoch) + 1;
  if (clearPending) {
    state.pendingTaskCommentResources = {};
    state.taskAttachmentIdentityEpoch = epoch(state.taskAttachmentIdentityEpoch) + 1;
  }
}

export function captureTaskAttachmentRequest(state, { identityOnly = false } = {}) {
  return {
    identityOnly,
    identityEpoch: epoch(state.taskAttachmentIdentityEpoch),
    cacheEpoch: identityOnly ? null : epoch(state.taskAttachmentCacheEpoch)
  };
}

export function isTaskAttachmentRequestCurrent(state, request) {
  if (!request || epoch(state.taskAttachmentIdentityEpoch) !== request.identityEpoch) return false;
  return request.identityOnly || epoch(state.taskAttachmentCacheEpoch) === request.cacheEpoch;
}
