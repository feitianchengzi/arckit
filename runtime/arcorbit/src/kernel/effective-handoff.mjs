export function selectEffectiveLoopHandoff({ runtimeResult = null, activity = null } = {}) {
  // A completed schema-bound Agent message is persisted before the Runtime
  // emits its derived result. It is therefore the recovery source when a
  // process exits after item/completed but before the final event tail drains.
  const candidates = [
    runtimeResult?.loop_handoff,
    agentLoopHandoff(activity?.agent_loop_result),
    latestPersistedAgentLoopHandoff(activity?.messages),
    activity?.loop_handoff,
    activity?.ledger_write_result?.parsed?.case_transition_result?.case_resolution?.loop_handoff
  ];
  return candidates.find(isLoopHandoff) || {};
}

export function agentLoopHandoff(result) {
  if (result?.schema_version !== "arckit-agent-loop-result/v1" || !result.handoff) return null;
  const source = result.handoff;
  const responsibility = String(source.next_responsibility || "");
  if (!responsibility) return null;
  const needsHuman = responsibility === "human" || source.human_decision_required === true;
  return {
    version: "loop-handoff/v2",
    status: needsHuman
      ? "needs_human"
      : responsibility === "none" ? "done" : responsibility === "external" ? "external_wait" : "continue",
    next_responsibility: responsibility,
    agent_continuation_available: responsibility === "agent",
    human_decision_required: needsHuman,
    trigger_mode: needsHuman
      ? "user_decision"
      : responsibility === "none" ? "none" : responsibility === "external" ? "external_wait" : "auto_bridge",
    responsibility_reason: String(source.reason || result.summary || ""),
    next_prompt: String(source.next_prompt || ""),
    human_gate: {
      required: needsHuman,
      reason: needsHuman ? String(source.reason || result.summary || "") : "",
      decision_needed: needsHuman ? String(source.next_prompt || "") : ""
    }
  };
}

function latestPersistedAgentLoopHandoff(messages) {
  if (!Array.isArray(messages)) return null;
  for (let index = messages.length - 1; index >= 0; index -= 1) {
    const structured = messages[index]?.structured_data;
    if (structured?.schema_version !== "arckit-agent-loop-result/v1") continue;
    const handoff = agentLoopHandoff(structured.value);
    if (handoff) return handoff;
  }
  return null;
}

function isLoopHandoff(value) {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return false;
  }
  return [
    value.status,
    value.next_responsibility,
    value.trigger_mode,
    value.next_prompt
  ].some((field) => typeof field === "string" && field.length > 0)
    || typeof value.human_decision_required === "boolean"
    || typeof value.agent_continuation_available === "boolean";
}
