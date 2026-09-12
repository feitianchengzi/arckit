// Shared transport maintenance, independent of the semantic capability being invoked.
export async function compactSessionThread({ adapter, threadKey, threadId, options, state }) {
  const usage = adapter.latestContextUsage?.(threadKey);
  if (!(usage?.context_utilization >= 0.8) || !usage.turn_id || usage.turn_id === state.lastCompactedTurnId) return;
  const emit = (event) => {
    options.onEvent?.(event);
    if (options.streamEvents) console.error(JSON.stringify({ event }));
  };
  emit({ type: 'runtime.context_compaction.started', thread_id: threadId,
    turn_id: usage.turn_id, context_utilization: usage.context_utilization });
  const compacted = await adapter.compactThread({ threadKey, threadId, options });
  state.lastCompactedTurnId = usage.turn_id;
  emit({ type: 'runtime.context_compaction.completed', thread_id: threadId,
    source_turn_id: usage.turn_id, compaction_turn_id: compacted.turn_id,
    context_utilization: usage.context_utilization });
}
