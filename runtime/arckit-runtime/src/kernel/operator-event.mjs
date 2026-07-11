import { compactText, safeSemanticText, SEMANTIC_LIMITS } from "../context-boundary.mjs";

export function buildDesktopOperatorEvent({
  action,
  userInput = "",
  controlState,
  project,
  session,
  run,
  activity,
  projectStatus,
  latestNextPrompt = ""
}) {
  return {
    schema_version: "arckit-desktop-operator-event/v1",
    action,
    user_input: userInput || "",
    control_state: {
      state: controlState.state,
      primary_action: controlState.primary_action,
      primary_label: controlState.primary_label,
      reason: controlState.reason
    },
    project: project
      ? {
        id: project.id,
        name: project.name,
        path: project.path
      }
      : null,
    session: session
      ? {
        id: session.id,
        title: session.title || ""
      }
      : null,
    source_run: run
      ? {
        id: run.id,
        status: run.status,
        adapter: run.adapter || "",
        round_result: run.round_result || activity?.round_result || "",
        validation_valid: run.validation_valid ?? activity?.validation_valid ?? null,
        result_file: run.result_file || "",
        activity_file: run.activity_file || ""
      }
      : null,
    controller_context: {
      controller_frame: summarizeControllerFrame(activity?.controller_frame),
      execution_gate: summarizeExecutionGate(activity?.execution_gate),
      executor_binding: summarizeExecutorBinding(activity?.executor_binding),
      worker_packets: summarizeWorkerPackets(activity?.worker_packets || []),
      report_intake: activity?.report_intake || activity?.merge_result?.report_intake || null,
      worker_reports: summarizeWorkerReports(activity?.reports || []),
      merge_gate: summarizeLoopGate(activity?.merge_result?.loop_gate),
      loop_handoff: summarizeLoopHandoff(activity?.loop_handoff),
      pending_controller_event: activity?.pending_controller_event || null,
      gate_result: summarizeGateResult(activity?.gate_result?.parsed || activity?.ledger_write_result?.parsed?.gate),
      ledger_write_result: summarizeLedgerWriteResult(activity?.ledger_write_result?.parsed),
      latest_next_prompt: latestNextPrompt
    },
    project_loop_control: summarizeLoopControl(projectStatus?.loop_control),
    project_top_gap: projectStatus?.top_gap || null
  };
}

export function buildControllerOperatorTask(operatorEvent) {
  return [
    "Arckit Desktop operator event.",
    "",
    "Controller instruction:",
    "- Recover project state, latest run activity, loop handoff, report intake, gate result, and ledger write result.",
    "- Classify user_input as supplement, correction, goal_change, report_intake, status_query, new_case, or continuation.",
    "- Decide the next business step from Arckit state. Do not assume the UI action determines the business path.",
    "- If a packet is stale, say so and generate a replacement packet or ask for a human decision.",
    "- If ledger writeback is blocked, explain the gate evidence and produce the next recoverable action.",
    "",
    JSON.stringify(operatorEvent, null, 2)
  ].join("\n");
}

function summarizeWorkerPackets(packets) {
  return (Array.isArray(packets) ? packets : []).map((packet) => ({
    worker_id: packet.worker_id || packet.id || "",
    role: packet.role || "",
    task: compactText(packet.task || packet.objective || "", SEMANTIC_LIMITS.workerObjective),
    context_refs: Array.isArray(packet.context_refs) ? packet.context_refs : packet.inputs?.known_state_paths || []
  }));
}

function summarizeWorkerReports(reports) {
  return (Array.isArray(reports) ? reports : []).map((report) => ({
    task_id: report.task_id || "",
    role: report.role || "",
    status: report.status || "",
    summary: compactText(report.summary || "", SEMANTIC_LIMITS.reason),
    recommendation: compactText(report.recommendation || "", SEMANTIC_LIMITS.reason),
    requires_main_agent_decision: report.requires_main_agent_decision === true
  }));
}

function summarizeControllerFrame(frame) {
  if (!frame || typeof frame !== "object") {
    return null;
  }
  return {
    schema_version: frame.schema_version || "arckit-controller-frame/v1",
    case_id: frame.case_id || "",
    round_status: frame.round_status || "",
    round_goal: safeSemanticText(frame.round_goal, { maxLength: SEMANTIC_LIMITS.goal }),
    turn_delta: frame.turn_delta || null,
    old_packet_valid: frame.old_packet_valid ?? null,
    selected_gap: frame.selected_gap || null,
    route_plan: summarizeRoutePlan(frame.route_plan),
    controller_plan_summary: compactText(frame.controller_plan?.summary || "", SEMANTIC_LIMITS.reason),
    controller_plan_status: frame.controller_plan?.status || ""
  };
}

function summarizeRoutePlan(routePlan) {
  if (!routePlan || typeof routePlan !== "object") {
    return null;
  }
  return {
    mode: routePlan.mode || "",
    selected_roles: Array.isArray(routePlan.selected_roles) ? routePlan.selected_roles : [],
    selected_worker_types: Array.isArray(routePlan.selected_worker_types) ? routePlan.selected_worker_types : [],
    selected_gap: routePlan.selected_gap
      ? {
        id: routePlan.selected_gap.id || "",
        dimension: routePlan.selected_gap.dimension || "",
        current_state: compactText(routePlan.selected_gap.current_state || "", SEMANTIC_LIMITS.reason),
        target_state: compactText(routePlan.selected_gap.target_state || "", SEMANTIC_LIMITS.reason),
        next_transition: safeSemanticText(routePlan.selected_gap.next_transition || "", { maxLength: SEMANTIC_LIMITS.transition })
      }
      : null,
    reason: compactText(routePlan.reason || "", SEMANTIC_LIMITS.reason),
    requires_human_confirmation: routePlan.requires_human_confirmation === true
  };
}

function summarizeExecutionGate(gate) {
  if (!gate || typeof gate !== "object") {
    return null;
  }
  return {
    status: gate.status || "",
    required_decision: compactText(gate.required_decision || "", SEMANTIC_LIMITS.reason),
    executor_binding_required: gate.executor_binding_required === true
  };
}

function summarizeExecutorBinding(binding) {
  if (!binding || typeof binding !== "object") {
    return null;
  }
  return {
    executor: binding.executor || "",
    authorization_source: binding.authorization_source || "",
    reason: compactText(binding.reason || "", SEMANTIC_LIMITS.reason)
  };
}

function summarizeLoopGate(gate) {
  if (!gate || typeof gate !== "object") {
    return null;
  }
  return {
    status: gate.status || "",
    next_responsibility: gate.next_responsibility || "",
    trigger_mode: gate.trigger_mode || "",
    human_decision_required: gate.human_decision_required === true,
    reason: compactText(gate.reason || "", SEMANTIC_LIMITS.reason)
  };
}

function summarizeLoopHandoff(handoff) {
  if (!handoff || typeof handoff !== "object") {
    return null;
  }
  return {
    version: handoff.version || "loop-handoff/v1",
    status: handoff.status || "",
    next_responsibility: handoff.next_responsibility || "",
    agent_continuation_available: handoff.agent_continuation_available === true,
    human_decision_required: handoff.human_decision_required === true,
    trigger_mode: handoff.trigger_mode || "",
    responsibility_reason: compactText(handoff.responsibility_reason || "", SEMANTIC_LIMITS.reason),
    next_prompt: safeSemanticText(handoff.next_prompt || "", { maxLength: SEMANTIC_LIMITS.nextPrompt }),
    agent_instruction: {
      goal: safeSemanticText(handoff.agent_instruction?.goal || "", { maxLength: SEMANTIC_LIMITS.goal }),
      required_context_refs: Array.isArray(handoff.agent_instruction?.required_context_refs) ? handoff.agent_instruction.required_context_refs : [],
      required_actions: Array.isArray(handoff.agent_instruction?.required_actions) ? handoff.agent_instruction.required_actions.map((item) => compactText(item, SEMANTIC_LIMITS.reason)) : [],
      required_checks: Array.isArray(handoff.agent_instruction?.required_checks) ? handoff.agent_instruction.required_checks : []
    },
    human_gate: handoff.human_gate || null,
    progress_guard: {
      expected_state_change: safeSemanticText(handoff.progress_guard?.expected_state_change || "", { maxLength: SEMANTIC_LIMITS.transition }),
      actual_state_change: compactText(handoff.progress_guard?.actual_state_change || "", SEMANTIC_LIMITS.reason),
      no_progress_limit: Number.isInteger(handoff.progress_guard?.no_progress_limit) ? handoff.progress_guard.no_progress_limit : 0,
      max_auto_rounds: Number.isInteger(handoff.progress_guard?.max_auto_rounds) ? handoff.progress_guard.max_auto_rounds : 0
    }
  };
}

function summarizeGateResult(gate) {
  if (!gate || typeof gate !== "object") {
    return null;
  }
  return {
    allowed: gate.allowed === true,
    decision: gate.decision || "",
    reasons: Array.isArray(gate.reasons) ? gate.reasons.map((item) => compactText(item, SEMANTIC_LIMITS.reason)) : [],
    warnings: Array.isArray(gate.warnings) ? gate.warnings.map((item) => compactText(item, SEMANTIC_LIMITS.reason)) : []
  };
}

function summarizeLedgerWriteResult(result) {
  if (!result || typeof result !== "object") {
    return null;
  }
  return {
    written: result.written === true,
    dry_run: result.dry_run === true,
    run_id: result.run_id || "",
    changed_files: Array.isArray(result.changed_files) ? result.changed_files : [],
    gate: summarizeGateResult(result.gate)
  };
}

function summarizeLoopControl(loopControl) {
  if (!loopControl || typeof loopControl !== "object") {
    return null;
  }
  return {
    current_loop_focus: safeSemanticText(loopControl.current_loop_focus || "", { maxLength: SEMANTIC_LIMITS.transition }),
    next_transition: safeSemanticText(loopControl.next_transition || "", { maxLength: SEMANTIC_LIMITS.transition }),
    priority_basis: compactText(loopControl.priority_basis || "", SEMANTIC_LIMITS.reason),
    stop_condition: compactText(loopControl.stop_condition || "", SEMANTIC_LIMITS.reason),
    next_responsibility: loopControl.next_responsibility || "",
    agent_continuation_available: loopControl.agent_continuation_available === true,
    human_decision_required: loopControl.human_decision_required === true,
    trigger_mode: loopControl.trigger_mode || "",
    continuation_prompt: safeSemanticText(loopControl.continuation_prompt || "", { maxLength: SEMANTIC_LIMITS.nextPrompt }),
    responsibility_reason: compactText(loopControl.responsibility_reason || "", SEMANTIC_LIMITS.reason)
  };
}
