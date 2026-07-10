export function canAuthorizeRun({ run, activity }) {
  return Boolean(run)
    && run.status !== "running"
    && run.adapter === "dry-run"
    && activity?.execution_gate?.status === "pending"
    && Array.isArray(activity.worker_packets)
    && activity.worker_packets.length > 0;
}

export function deriveRuntimeControlState({ run, project, session, activity, latestNextPrompt = "" }) {
  const base = {
    state: "no_context",
    primary_action: "none",
    primary_label: "",
    reason: "No selected project, chat, or run.",
    run_id: run?.id || ""
  };
  if (!project || !session || !run) {
    return base;
  }
  if (run.status === "running") {
    return {
      ...base,
      state: "running",
      reason: activity?.current_step || "Run is still active."
    };
  }
  if (canAuthorizeRun({ run, activity })) {
    return {
      ...base,
      state: "packet_pending_authorization",
      primary_action: "run_packet",
      primary_label: "Run Packet",
      reason: "Preview packet has a pending execution gate."
    };
  }
  if (activity?.pending_controller_event) {
    return {
      ...base,
      state: "interrupted_pending_controller_event",
      primary_action: "resume_with_update",
      primary_label: "Resume With Update",
      reason: "Interrupted run has controller input that still needs recovery."
    };
  }

  const ledgerWrite = activity?.ledger_write_result?.parsed || null;
  const gateResult = activity?.gate_result?.parsed || ledgerWrite?.gate || null;
  const ledgerStage = activity?.ledger_stage || null;
  if (ledgerWrite?.written === true || ledgerStage?.status === "written") {
    return {
      ...base,
      state: "ledger_written",
      primary_action: "start_next_round",
      primary_label: "Start Next Round",
      reason: "Ledger writeback has updated project state."
    };
  }
  if (ledgerStage?.status === "gate_blocked") {
    return {
      ...base,
      state: "ledger_writeback_blocked",
      primary_action: "resolve_gate",
      primary_label: "Resolve Gate",
      reason: ledgerStage.reason || "Ledger gate blocked writeback."
    };
  }
  if (run.status === "failed" || activity?.validation_valid === false) {
    return {
      ...base,
      state: "failed_or_invalid",
      primary_action: "diagnose",
      primary_label: "Diagnose",
      reason: run.status === "failed" ? "Run failed." : "Runtime result validation failed."
    };
  }

  if (ledgerStage?.status === "gate_ready" && ledgerStage?.writeback_required === true) {
    return {
      ...base,
      state: activity?.round_state === "ledger_gate_ready" ? "ledger_gate_ready" : "ledger_writeback_ready",
      primary_action: "write_ledger",
      primary_label: "Write Ledger",
      reason: ledgerStage.reason || "Runtime result has validated progress and awaits ledger writeback."
    };
  }

  const runtimeDone = run.round_result === "done"
    || activity?.round_result === "done"
    || activity?.loop_handoff?.status === "done"
    || activity?.merge_result?.loop_gate?.status === "done";
  if (runtimeDone) {
    if (gateResult?.allowed === false || ledgerWrite?.written === false && ledgerWrite?.gate?.allowed === false) {
      return {
        ...base,
        state: "ledger_writeback_blocked",
        primary_action: "resolve_gate",
        primary_label: "Resolve Gate",
        reason: (gateResult?.reasons || ledgerWrite?.gate?.reasons || []).join(" | ") || "Ledger gate blocked writeback."
      };
    }
    return {
      ...base,
      state: activity?.round_state === "ledger_gate_ready" ? "ledger_gate_ready" : "ledger_writeback_ready",
      primary_action: "write_ledger",
      primary_label: "Write Ledger",
      reason: "Runtime result is done and awaits ledger writeback."
    };
  }

  const handoff = activity?.loop_handoff || {};
  const loopGate = activity?.merge_result?.loop_gate || {};
  const reportIntake = activity?.report_intake || activity?.merge_result?.report_intake || {};
  const reports = Array.isArray(activity?.reports) ? activity.reports : [];
  const workerPackets = Array.isArray(activity?.worker_packets) ? activity.worker_packets : [];
  const missing = Array.isArray(reportIntake.missing) ? reportIntake.missing : [];
  const needsRevision = Array.isArray(reportIntake.needs_revision) ? reportIntake.needs_revision : [];
  const rejected = Array.isArray(reportIntake.rejected) ? reportIntake.rejected : [];

  if (requiresHumanDecision(activity)) {
    return {
      ...base,
      state: "human_gate_required",
      primary_action: "respond_to_gate",
      primary_label: "Respond To Gate",
      reason: handoff.responsibility_reason || loopGate.reason || "Human decision is required."
    };
  }
  if (handoff.next_responsibility === "external" || handoff.trigger_mode === "external_wait" || run.round_result === "external_wait") {
    return {
      ...base,
      state: "external_wait",
      primary_action: "resume_with_update",
      primary_label: "Resume With Update",
      reason: handoff.responsibility_reason || "The loop is waiting on an external result."
    };
  }
  if (isAgentRecoverable(activity)) {
    return {
      ...base,
      state: handoff.trigger_mode === "auto_bridge" ? "agent_auto_continue_ready" : "agent_recoverable",
      primary_action: handoff.trigger_mode === "auto_bridge" ? "auto_continue" : "continue_next_round",
      primary_label: handoff.trigger_mode === "auto_bridge" ? "Auto Continue" : "Continue Next Round",
      reason: handoff.responsibility_reason || loopGate.reason || "Agent can continue with the available loop handoff."
    };
  }
  if (handoff.status === "blocked" || loopGate.status === "blocked") {
    return {
      ...base,
      state: "hard_blocked",
      primary_action: "resolve_blocker",
      primary_label: "Resolve Hard Blocker",
      reason: handoff.responsibility_reason || loopGate.reason || "Loop is blocked."
    };
  }
  if (reports.length > 0 && (missing.length > 0 || needsRevision.length > 0 || rejected.length > 0)) {
    return {
      ...base,
      state: "reviewing_reports",
      primary_action: "review_reports",
      primary_label: "Resume Review",
      reason: "Worker reports need controller review or revision."
    };
  }
  if (workerPackets.length > 0 && missing.length > 0) {
    return {
      ...base,
      state: "waiting_worker_reports",
      primary_action: "review_reports",
      primary_label: "Review Reports",
      reason: "Worker packets exist and required reports are missing."
    };
  }
  if (latestNextPrompt && (
    handoff.agent_continuation_available === true
    || handoff.next_responsibility === "agent"
    || handoff.status === "continue"
    || loopGate.status === "continue"
  )) {
    return {
      ...base,
      state: "agent_resumable",
      primary_action: "continue_next_round",
      primary_label: "Continue Next Round",
      reason: handoff.responsibility_reason || loopGate.reason || "Agent continuation is available."
    };
  }
  return {
    ...base,
    reason: "No runtime control action is available."
  };
}

export function isAgentRecoverable(activity) {
  const handoff = activity?.loop_handoff || {};
  const loopGate = activity?.merge_result?.loop_gate || {};
  return handoff.agent_continuation_available === true
    && handoff.next_responsibility === "agent"
    && handoff.human_decision_required !== true
    && (handoff.status === "blocked" || loopGate.status === "blocked");
}

export function requiresHumanDecision(activity) {
  return activity?.loop_handoff?.human_decision_required === true
    || activity?.loop_handoff?.next_responsibility === "human"
    || activity?.loop_handoff?.trigger_mode === "user_decision"
    || activity?.merge_result?.loop_gate?.human_decision_required === true
    || activity?.merge_result?.loop_gate?.next_responsibility === "human"
    || activity?.merge_result?.loop_gate?.trigger_mode === "user_decision";
}
