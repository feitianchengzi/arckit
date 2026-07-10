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
      controller_frame: activity?.controller_frame || null,
      execution_gate: activity?.execution_gate || null,
      executor_binding: activity?.executor_binding || null,
      worker_packets: summarizeWorkerPackets(activity?.worker_packets || []),
      report_intake: activity?.report_intake || activity?.merge_result?.report_intake || null,
      worker_reports: summarizeWorkerReports(activity?.reports || []),
      merge_gate: activity?.merge_result?.loop_gate || null,
      loop_handoff: activity?.loop_handoff || null,
      pending_controller_event: activity?.pending_controller_event || null,
      gate_result: activity?.gate_result?.parsed || activity?.ledger_write_result?.parsed?.gate || null,
      ledger_write_result: activity?.ledger_write_result?.parsed || null,
      latest_next_prompt: latestNextPrompt
    },
    project_loop_control: projectStatus?.loop_control || null,
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
    task: packet.task || packet.objective || "",
    context_refs: Array.isArray(packet.context_refs) ? packet.context_refs : packet.inputs?.known_state_paths || []
  }));
}

function summarizeWorkerReports(reports) {
  return (Array.isArray(reports) ? reports : []).map((report) => ({
    task_id: report.task_id || "",
    role: report.role || "",
    status: report.status || "",
    summary: report.summary || "",
    recommendation: report.recommendation || "",
    requires_main_agent_decision: report.requires_main_agent_decision === true
  }));
}
