export const ROUND_STATES = [
  "planned",
  "authorized",
  "workers_running",
  "reports_collected",
  "merge_ready",
  "ledger_gate_ready",
  "ledger_written",
  "next_round_ready",
  "blocked",
  "human_gate_required",
  "external_wait",
  "failed"
];

export function createRoundStateMachine(initialState = "planned", reason = "Round plan created.") {
  return {
    schema_version: "arckit-round-state-machine/v1",
    state: initialState,
    history: [
      {
        state: initialState,
        at: new Date().toISOString(),
        reason
      }
    ]
  };
}

export function transitionRoundState(machine, nextState, reason) {
  if (!ROUND_STATES.includes(nextState)) {
    throw new Error(`Unknown round state: ${nextState}`);
  }
  if (machine.state === nextState && machine.history.length > 0) {
    return machine;
  }
  machine.state = nextState;
  machine.history.push({
    state: nextState,
    at: new Date().toISOString(),
    reason: reason || ""
  });
  return machine;
}

export function stateFromLoopGate(loopGate = {}) {
  if (loopGate.human_decision_required === true || loopGate.next_responsibility === "human") {
    return "human_gate_required";
  }
  if (loopGate.next_responsibility === "external" || loopGate.trigger_mode === "external_wait") {
    return "external_wait";
  }
  if (loopGate.status === "blocked") {
    return "blocked";
  }
  if (loopGate.status === "done") {
    return "ledger_gate_ready";
  }
  return "next_round_ready";
}
