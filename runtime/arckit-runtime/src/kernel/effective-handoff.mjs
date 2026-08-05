export function selectEffectiveLoopHandoff({ runtimeResult = null, activity = null } = {}) {
  // Runtime/session output and its final activity projection are newer than any
  // handoff captured by an earlier successful ledger round in the same run.
  const candidates = [
    runtimeResult?.loop_handoff,
    activity?.loop_handoff,
    activity?.ledger_write_result?.parsed?.case_transition_result?.case_resolution?.loop_handoff
  ];
  return candidates.find(isLoopHandoff) || {};
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
