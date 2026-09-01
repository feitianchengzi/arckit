export function createSingleFlightActivitySync({
  consume,
  isEligible = () => true,
  shouldPause = () => false,
  schedule = (callback, delay) => setTimeout(callback, delay),
  onError = () => {}
}) {
  const pending = [];
  let timer = null;
  let inFlight = null;

  function enqueue(event, delay = 0) {
    if (!isEligible(event)) return false;
    pending.push(event);
    if (!timer && !inFlight) timer = schedule(flush, delay);
    return true;
  }

  async function flush() {
    timer = null;
    if (inFlight) return inFlight;
    if (shouldPause()) {
      if (pending.length > 0 && !timer) timer = schedule(flush, 80);
      return null;
    }
    inFlight = (async () => {
      while (pending.length > 0) {
        const event = pending.shift();
        if (!isEligible(event)) continue;
        await consume(event);
      }
    })();
    try {
      await inFlight;
    } catch (error) {
      onError(error);
    } finally {
      inFlight = null;
      if (pending.length > 0 && !timer) timer = schedule(flush, 0);
    }
    return null;
  }

  return {
    enqueue,
    flush,
    state() {
      return { pending: pending.length, scheduled: Boolean(timer), in_flight: Boolean(inFlight) };
    }
  };
}

export function activityOwnerMatchesRun(owner, run) {
  if (!run) return false;
  const expected = owner && typeof owner === "object" ? owner : {};
  return [
    [expected.run_id, run.id],
    [expected.project_id, run.project_id],
    [expected.session_id, run.session_id],
    [expected.task_id, run.task_id]
  ].every(([ownerValue, runValue]) => !ownerValue || !runValue || String(ownerValue) === String(runValue));
}

export function applyRunActivityPatch(run, patch) {
  if (!run?.activity || patch?.schema_version !== "run.activity.patch/v1") return null;
  if (String(patch.run_id || "") !== String(run.id || "")) return null;
  const currentRevision = Number(run.activity.projection_revision || 0);
  if (Number(patch.base_revision) !== currentRevision || Number(patch.revision) !== currentRevision + 1) return null;
  const activity = { ...run.activity, ...(patch.changed || {}) };
  for (const field of patch.removed || []) delete activity[field];
  const removedMessages = new Set((patch.message_removals || []).map(String));
  const messageUpserts = new Map((patch.message_upserts || []).map((message) => [String(message.id || ""), message]));
  activity.messages = (activity.messages || [])
    .filter((message) => !removedMessages.has(String(message.id || "")))
    .map((message) => messageUpserts.get(String(message.id || "")) || message);
  const existingMessageIds = new Set(activity.messages.map((message) => String(message.id || "")));
  for (const [id, message] of messageUpserts) {
    if (id && !existingMessageIds.has(id)) activity.messages.push(message);
  }
  activity.projection_revision = Number(patch.revision);
  return { ...run, activity };
}
