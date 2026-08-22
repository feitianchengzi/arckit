import assert from "node:assert/strict";
import test from "node:test";
import {
  captureTaskAttachmentRequest,
  invalidateTaskAttachmentCaches,
  isTaskAttachmentRequestCurrent,
  taskAttachmentIdentityKey
} from "../src/work-task-attachment-cache.mjs";

function cacheState() {
  return {
    platformTaskAttachments: { "7": { status: "loaded", items: [{ id: 1 }] } },
    platformTaskAttachmentPreviews: { "7:1:file.png": "data:image/png;base64,old" },
    pendingTaskCommentResources: { "7": [{ object_key: "workshop/draft.png" }] },
    taskAttachmentCacheEpoch: 2,
    taskAttachmentIdentityEpoch: 4
  };
}

test("TaskAttachment snapshot invalidation refreshes remote caches without discarding the current comment draft", () => {
  const state = cacheState();
  const remoteRequest = captureTaskAttachmentRequest(state);
  const uploadRequest = captureTaskAttachmentRequest(state, { identityOnly: true });

  invalidateTaskAttachmentCaches(state);

  assert.deepEqual(state.platformTaskAttachments, {});
  assert.deepEqual(state.platformTaskAttachmentPreviews, {});
  assert.deepEqual(state.pendingTaskCommentResources, { "7": [{ object_key: "workshop/draft.png" }] });
  assert.equal(state.taskAttachmentCacheEpoch, 3);
  assert.equal(isTaskAttachmentRequestCurrent(state, remoteRequest), false);
  assert.equal(isTaskAttachmentRequestCurrent(state, uploadRequest), true);
});

test("TaskAttachment identity invalidation clears every remote and pending resource and rejects stale async writes", () => {
  const state = cacheState();
  const remoteRequest = captureTaskAttachmentRequest(state);
  const uploadRequest = captureTaskAttachmentRequest(state, { identityOnly: true });

  invalidateTaskAttachmentCaches(state, { clearPending: true });

  assert.deepEqual(state.platformTaskAttachments, {});
  assert.deepEqual(state.platformTaskAttachmentPreviews, {});
  assert.deepEqual(state.pendingTaskCommentResources, {});
  assert.equal(state.taskAttachmentCacheEpoch, 3);
  assert.equal(state.taskAttachmentIdentityEpoch, 5);
  assert.equal(isTaskAttachmentRequestCurrent(state, remoteRequest), false);
  assert.equal(isTaskAttachmentRequestCurrent(state, uploadRequest), false);
});

test("TaskAttachment identity follows the immutable Workshop user before the login fallback", () => {
  assert.equal(taskAttachmentIdentityKey({ platform: { user: { id: 42 } }, authentication: { authenticated: true, identity: "user@example.test" } }), "user:42");
  assert.equal(taskAttachmentIdentityKey({ authentication: { authenticated: true, identity: "user@example.test" } }), "auth:user@example.test");
  assert.equal(taskAttachmentIdentityKey(), "");
});
