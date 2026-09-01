import { isDeepStrictEqual } from "node:util";

const PATCH_VERSION = "run.activity.patch/v1";
const ACTIVITY_MESSAGES_FIELD = "messages";
const ACTIVITY_REVISION_FIELD = "projection_revision";

export function createRunActivityPatch({ runId, previous, current, baseRevision, revision }) {
  const previousActivity = previous && typeof previous === "object" ? previous : {};
  const currentActivity = current && typeof current === "object" ? current : {};
  const changed = {};
  const removed = [];
  const fields = new Set([...Object.keys(previousActivity), ...Object.keys(currentActivity)]);
  fields.delete(ACTIVITY_MESSAGES_FIELD);
  fields.delete(ACTIVITY_REVISION_FIELD);
  for (const field of fields) {
    if (!(field in currentActivity)) {
      removed.push(field);
      continue;
    }
    if (!isDeepStrictEqual(previousActivity[field], currentActivity[field])) {
      changed[field] = structuredClone(currentActivity[field]);
    }
  }

  const previousMessages = new Map((previousActivity.messages || []).map((message) => [String(message.id || ""), message]));
  const currentMessages = new Map((currentActivity.messages || []).map((message) => [String(message.id || ""), message]));
  const messageUpserts = [];
  const messageRemovals = [];
  for (const [id, message] of currentMessages) {
    if (!id || isDeepStrictEqual(previousMessages.get(id), message)) continue;
    messageUpserts.push(structuredClone(message));
  }
  for (const id of previousMessages.keys()) {
    if (id && !currentMessages.has(id)) messageRemovals.push(id);
  }

  return {
    schema_version: PATCH_VERSION,
    run_id: String(runId || currentActivity.run_id || ""),
    base_revision: nonNegativeInteger(baseRevision),
    revision: nonNegativeInteger(revision),
    changed,
    removed,
    message_upserts: messageUpserts,
    message_removals: messageRemovals
  };
}

export function activityPatchHasChanges(patch) {
  return Object.keys(patch?.changed || {}).length > 0
    || (patch?.removed || []).length > 0
    || (patch?.message_upserts || []).length > 0
    || (patch?.message_removals || []).length > 0;
}

function nonNegativeInteger(value) {
  const number = Number(value);
  return Number.isInteger(number) && number >= 0 ? number : 0;
}
