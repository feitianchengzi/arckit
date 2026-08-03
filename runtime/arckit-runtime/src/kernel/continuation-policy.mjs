export const AUTOMATIC_CONTINUATION_POLICY = "automatic";

export function isAgentContinuationHandoff(handoff) {
  return handoff?.next_responsibility === "agent"
    && handoff?.agent_continuation_available === true
    && handoff?.human_decision_required !== true
    && ["auto_bridge", "manual_bridge"].includes(handoff?.trigger_mode)
    && Boolean(handoff?.next_prompt);
}

export function shouldAutomaticallyBridge(handoff, continuationPolicy = "") {
  if (!isAgentContinuationHandoff(handoff)) return false;
  return handoff.trigger_mode === "auto_bridge"
    || continuationPolicy === AUTOMATIC_CONTINUATION_POLICY;
}

export function normalizeContinuationPolicy(value) {
  return value === AUTOMATIC_CONTINUATION_POLICY ? AUTOMATIC_CONTINUATION_POLICY : "";
}
