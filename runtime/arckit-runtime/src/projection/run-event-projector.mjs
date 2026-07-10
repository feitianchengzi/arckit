function createRunActivity(run) {
  const timestamp = run.started_at || new Date().toISOString();
  return {
    schema_version: "desktop-run-activity/v1",
    entry_capability: run.entry_capability || "using-arckit",
    operator: run.operator || "desktop",
    status: run.status || "running",
    phase: run.adapter === "dry-run" ? "dry-run" : "starting",
    phase_label: run.adapter === "dry-run" ? "Dry run" : "Starting runtime",
    current_step: run.adapter === "dry-run" ? "Generating controlled prompt" : "Launching runtime process",
    started_at: timestamp,
    updated_at: timestamp,
    last_event_at: timestamp,
    thread_id: "",
    turn_id: "",
    plan: [],
    controller_frame: null,
    execution_gate: null,
    executor_binding: null,
    worker_packets: [],
    report_intake_rules: null,
    closeout_rules: null,
    loop_handoff: null,
    pending_controller_event: null,
    agents: [],
    reports: [],
    merge_result: null,
    controller_reducer_result: null,
    artifact_ownership_scan: null,
    round_state: "planned",
    round_state_history: [],
    ledger_stage: null,
    gate_result: null,
    ledger_write_result: null,
    agent_text: "",
    reasoning_text: "",
    command_output: "",
    execution_events: [],
    errors: [],
    timeline: [
      {
        at: timestamp,
        type: "runtime.started",
        label: `${run.adapter || "runtime"} started`,
        detail: `${run.entry_capability || "using-arckit"}: ${run.task || run.id}`
      }
    ],
    raw_events: [],
    controls: {
      steer: run.status === "running",
      interrupt: run.status === "running"
    },
    validation_valid: null,
    round_result: "",
    artifact_paths: {
      events_file: run.events_file || "",
      raw_events_file: run.raw_events_file || "",
      activity_file: run.activity_file || "",
      result_file: run.result_file || "",
      error_file: run.error_file || ""
    }
  };
}

function applyRunCommandResult(run, commandType, result) {
  const activity = run.activity || createRunActivity(run);
  run.activity = activity;
  const normalized = normalizeCommandResult(result);
  const gate = commandType === "gate-result" ? normalized.parsed : normalized.parsed?.gate;
  const allowed = gate?.allowed === true;
  const written = normalized.parsed?.written === true;
  if (commandType === "gate-result") {
    activity.gate_result = normalized;
    activity.ledger_stage = {
      ...(activity.ledger_stage || { schema_version: "arckit-ledger-stage/v1" }),
      status: allowed ? "gate_ready" : "gate_blocked",
      gate_required: true,
      writeback_required: allowed,
      reason: allowed ? "Deterministic ledger gate allowed writeback." : (gate?.reasons || []).join(" | ") || "Deterministic ledger gate blocked writeback."
    };
  }
  if (commandType === "write-ledger-preview" || commandType === "write-ledger") {
    activity.ledger_write_result = normalized;
    if (written) {
      activity.ledger_written_at = new Date().toISOString();
      activity.round_state = "ledger_written";
      activity.ledger_stage = {
        ...(activity.ledger_stage || { schema_version: "arckit-ledger-stage/v1" }),
        status: "written",
        gate_required: true,
        writeback_required: false,
        reason: "Ledger writeback has updated project state."
      };
    } else if (normalized.parsed?.gate?.allowed === false) {
      activity.ledger_stage = {
        ...(activity.ledger_stage || { schema_version: "arckit-ledger-stage/v1" }),
        status: "gate_blocked",
        gate_required: true,
        writeback_required: false,
        reason: (normalized.parsed.gate.reasons || []).join(" | ") || "Deterministic ledger gate blocked writeback."
      };
    }
    if (normalized.parsed?.gate) {
      activity.gate_result = {
        code: normalized.code,
        parsed: normalized.parsed.gate,
        stderr: normalized.stderr,
        stdout: "",
        finished_at: normalized.finished_at
      };
    }
  }
  updateRunActivity(run, {
    phase: commandType,
    current_step: commandType === "gate-result"
      ? allowed ? "Gate allowed ledger writeback" : "Gate blocked ledger writeback"
      : written ? "Ledger writeback completed" : commandType === "write-ledger-preview" ? "Ledger writeback preview completed" : "Ledger writeback did not write",
    timeline: {
      type: `runtime.${commandType}`,
      label: commandType === "gate-result" ? "Gate result" : commandType === "write-ledger-preview" ? "Ledger preview" : "Ledger write",
      detail: summarizeCommandResult(normalized)
    }
  });
}

function normalizeCommandResult(result) {
  return {
    code: result?.code ?? null,
    parsed: result?.parsed || null,
    stderr: truncate(result?.stderr || "", 1200),
    stdout: result?.parsed ? "" : truncate(result?.stdout || "", 1200),
    finished_at: new Date().toISOString()
  };
}

function summarizeCommandResult(result) {
  if (result.parsed?.written === true) {
    return `written · ${result.parsed.changed_files?.length || 0} files`;
  }
  if (result.parsed?.written === false) {
    return `not written · ${result.parsed.gate?.decision || "gate"}`;
  }
  if (result.parsed?.allowed === true) {
    return "allow";
  }
  if (result.parsed?.allowed === false) {
    return `block · ${(result.parsed.reasons || []).slice(0, 2).join(" | ")}`;
  }
  return result.stderr || result.stdout || `exit ${result.code}`;
}

function applyRunEvent(run, { line, parsed }) {
  const event = parsed?.event || null;
  const activity = run.activity || createRunActivity(run);
  run.activity = activity;
  activity.updated_at = new Date().toISOString();
  activity.last_event_at = activity.updated_at;
  addRawEvent(activity, line, event);

  if (!event) {
    updateRunActivity(run, {
      phase: "runtime-output",
      current_step: "Runtime emitted output",
      timeline: {
        type: "runtime.stderr",
        label: "Runtime output",
        detail: truncate(line, 240)
      }
    });
    return activity;
  }

  switch (event.type) {
    case "runtime.loop_frame.created":
      activity.controller_frame = event.loop_frame?.controller_frame || null;
      activity.execution_gate = event.loop_frame?.execution_gate || null;
      activity.executor_binding = event.loop_frame?.executor_binding || null;
      activity.worker_packets = Array.isArray(event.loop_frame?.worker_packets) ? event.loop_frame.worker_packets : [];
      activity.report_intake_rules = event.loop_frame?.report_intake_rules || null;
      activity.closeout_rules = event.loop_frame?.closeout_rules || null;
      updateRunActivity(run, {
        phase: "controller-frame",
        current_step: event.loop_frame?.controller_frame?.round_goal || event.loop_frame?.round_goal || "Controller frame created",
        timeline: {
          type: event.type,
          label: "Controller frame",
          detail: `${event.loop_frame?.execution_gate?.status || "gate"} · ${event.loop_frame?.case_id || event.loop_frame?.selected_gap?.id || ""}`
        }
      });
      break;
    case "runtime.controller_plan.completed":
      activity.controller_plan = event.controller_plan || null;
      activity.controller_plan_status = event.status || "";
      activity.controller_plan_failure_reason = event.failure_reason || "";
      updateRunActivity(run, {
        phase: "controller-planning",
        current_step: controllerPlanStepLabel(event.status),
        timeline: {
          type: event.type,
          label: "Controller plan",
          detail: event.controller_plan?.summary || event.failure_reason || event.status || ""
        }
      });
      break;
    case "runtime.controller_review.completed":
      activity.controller_review = event.controller_review || null;
      activity.controller_review_status = event.status || "";
      activity.controller_review_failure_reason = event.failure_reason || "";
      updateRunActivity(run, {
        phase: "controller-review",
        current_step: event.status === "reviewed" ? "Controller Agent reviewed worker reports" : "Controller Agent review failed",
        timeline: {
          type: event.type,
          label: "Controller review",
          detail: event.controller_review?.summary || event.failure_reason || event.status || ""
        }
      });
      break;
    case "runtime.agent_task.started":
      upsertAgent(activity, {
        task_id: event.task_id,
        role: event.role,
        objective: event.objective,
        status: "running",
        started_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        summary: "",
        current_step: event.objective || "",
        reasoning_text: "",
        agent_text: "",
        command_output: "",
        execution_events: []
      });
      addExecutionEvent(activity, {
        type: "agent_task",
        title: `${event.role} started`,
        detail: event.objective || event.task_id,
        status: "running"
      });
      updateRunActivity(run, {
        phase: "agent-running",
        current_step: `${event.role} is running`,
        timeline: { type: event.type, label: `${event.role} started`, detail: event.task_id || "" }
      });
      break;
    case "runtime.agent_task.fail_fast":
      upsertAgent(activity, {
        task_id: event.task_id,
        role: event.role,
        status: "failed",
        updated_at: new Date().toISOString(),
        summary: event.reason || "Runtime stopped remaining workers after an infrastructure failure.",
        current_step: event.reason || "Runtime stopped remaining workers."
      });
      addExecutionEvent(activity, {
        type: "agent_task_fail_fast",
        title: "Runtime stopped worker chain",
        detail: event.reason || event.task_id || "",
        status: "blocked"
      });
      updateRunActivity(run, {
        phase: "error",
        current_step: event.reason || "Runtime stopped remaining workers.",
        timeline: { type: event.type, label: "Worker chain stopped", detail: event.reason || "" }
      });
      break;
    case "runtime.worker_report.completed":
      upsertAgent(activity, {
        task_id: event.task_id,
        role: event.role,
        status: event.status || event.report?.status || "completed",
        updated_at: new Date().toISOString(),
        summary: event.report?.summary || "",
        current_step: event.report?.recommendation || event.report?.summary || "",
        report: event.report || null
      });
      activity.reports = [...(activity.reports || []).filter((report) => report.task_id !== event.task_id), event.report].filter(Boolean).slice(-20);
      addExecutionEvent(activity, {
        type: "worker_report",
        title: `${event.role} report`,
        detail: event.report?.summary || event.status || "",
        status: event.status || event.report?.status || "completed"
      });
      updateRunActivity(run, {
        phase: "worker-report",
        current_step: `${event.role} returned ${event.status || event.report?.status || "report"}`,
        timeline: { type: event.type, label: `${event.role} report`, detail: event.report?.summary || "" }
      });
      break;
    case "runtime.merge.completed":
      activity.merge_result = event.merge_result || null;
      activity.controller_reducer_result = event.merge_result?.controller_reducer_result || activity.controller_reducer_result || null;
      activity.artifact_ownership_scan = event.merge_result?.artifact_ownership_scan || activity.artifact_ownership_scan || null;
      updateRunActivity(run, {
        phase: "merge",
        current_step: `Merge decision: ${event.merge_result?.decision || "unknown"}`,
        timeline: {
          type: event.type,
          label: "Reports merged",
          detail: event.merge_result?.loop_gate?.reason || event.merge_result?.decision || ""
        }
      });
      break;
    case "runtime.round_state.changed":
      activity.round_state = event.round_state || activity.round_state;
      activity.round_state_history = Array.isArray(event.round_state_history) ? event.round_state_history : activity.round_state_history || [];
      updateRunActivity(run, {
        phase: event.round_state || activity.phase,
        current_step: `Round state: ${event.round_state || "unknown"}`,
        timeline: {
          type: event.type,
          label: "Round state",
          detail: event.round_state || ""
        }
      });
      break;
    case "runtime.dry_run":
      updateRunActivity(run, {
        phase: "dry-run",
        current_step: event.message || "Dry-run prompt generated",
        timeline: { type: event.type, label: "Dry run", detail: event.message || "" }
      });
      break;
    case "codex.initialize.completed":
      updateRunActivity(run, {
        phase: "codex-ready",
        current_step: "Codex app-server initialized",
        timeline: { type: event.type, label: "Codex initialized", detail: "app-server initialize completed" }
      });
      break;
    case "codex.thread.started":
    case "codex.thread.start.completed":
      activity.thread_id = event.thread_id || activity.thread_id;
      updateRunActivity(run, {
        phase: "thread-started",
        current_step: "Codex thread started",
        timeline: { type: event.type, label: "Thread started", detail: event.thread_id || "" }
      });
      break;
    case "codex.turn.started":
    case "codex.turn.start.completed":
      activity.thread_id = event.thread_id || activity.thread_id;
      activity.turn_id = event.turn_id || activity.turn_id;
      updateRunActivity(run, {
        phase: "turn-started",
        current_step: "Codex turn is running",
        timeline: { type: event.type, label: "Turn started", detail: event.turn_id || "" }
      });
      break;
    case "codex.plan.updated":
      activity.plan = normalizePlan(event.plan);
      updateRunActivity(run, {
        phase: "planning",
        current_step: "Plan updated",
        timeline: { type: event.type, label: "Plan updated", detail: summarizePlan(activity.plan) }
      });
      break;
    case "codex.reasoning.delta":
      activity.reasoning_text = appendLimited(activity.reasoning_text, event.text || "", 4000);
      appendAgentStream(activity, event, "reasoning_text", event.text || "", {
        title: "Reasoning summary",
        status: "streaming"
      });
      updateRunActivity(run, {
        phase: "reasoning",
        current_step: "Receiving reasoning summary"
      });
      break;
    case "codex.agent_message.delta":
      if (event.task_id) {
        upsertAgent(activity, {
          task_id: event.task_id,
          role: event.role || "",
          status: "running",
          current_step: "Receiving structured worker report",
          latest_detail: "Receiving structured worker report",
          updated_at: new Date().toISOString()
        });
      } else {
        activity.agent_text = appendLimited(activity.agent_text, event.text || "", 8000);
        appendAgentStream(activity, event, "agent_text", event.text || "", {
          title: "Agent output",
          status: "streaming"
        });
      }
      updateRunActivity(run, {
        phase: "responding",
        current_step: "Receiving Codex response"
      });
      break;
    case "codex.command.output.delta":
      activity.command_output = appendLimited(activity.command_output, event.text || "", 8000);
      appendAgentStream(activity, event, "command_output", event.text || "", {
        title: "Command output",
        status: "streaming"
      });
      addExecutionEvent(activity, {
        type: "command_output",
        title: "Command output",
        detail: event.text || "",
        status: "streaming"
      });
      updateRunActivity(run, {
        phase: "tool-output",
        current_step: "Receiving command output"
      });
      break;
    case "codex.item.started":
      handleCodexItem(activity, event, "started");
      updateRunActivity(run, {
        phase: phaseForItem(event.params?.item, "started"),
        current_step: describeItem(event.params?.item, "started"),
        timeline: {
          type: event.type,
          label: describeItem(event.params?.item, "started"),
          detail: itemDetail(event.params?.item)
        }
      });
      break;
    case "codex.item.completed":
      handleCodexItem(activity, event, "completed");
      updateRunActivity(run, {
        phase: phaseForItem(event.params?.item, "completed"),
        current_step: describeItem(event.params?.item, "completed"),
        timeline: {
          type: event.type,
          label: describeItem(event.params?.item, "completed"),
          detail: itemDetail(event.params?.item)
        }
      });
      break;
    case "codex.error":
      addError(activity, event);
      updateRunActivity(run, {
        phase: "error",
        current_step: errorText(event),
        timeline: { type: event.type, label: event.params?.willRetry ? "Retrying after error" : "Codex error", detail: errorText(event) }
      });
      break;
    case "codex.warning":
      addExecutionEvent(activity, {
        type: "warning",
        title: "Warning",
        detail: event.params?.message || describeEvent(event),
        status: "warning"
      });
      updateRunActivity(run, {
        phase: "warning",
        current_step: event.params?.message || "Warning",
        timeline: { type: event.type, label: "Warning", detail: event.params?.message || "" }
      });
      break;
    case "codex.thread.status.changed":
      updateRunActivity(run, {
        phase: statusPhase(event.params?.status?.type) || activity.phase,
        current_step: `Thread status: ${event.params?.status?.type || "unknown"}`,
        timeline: { type: event.type, label: "Thread status", detail: event.params?.status?.type || "" }
      });
      break;
    case "runtime.operator.steer.sent":
      updateRunActivity(run, {
        phase: "steering",
        current_step: "Steer accepted by runtime",
        timeline: { type: event.type, label: "Steer accepted", detail: event.text || "" }
      });
      break;
    case "runtime.operator.interrupt.sent":
      updateRunActivity(run, {
        phase: "interrupting",
        current_step: "Interrupt accepted by runtime",
        timeline: { type: event.type, label: "Interrupt accepted", detail: event.turn_id || "" }
      });
      break;
    case "runtime.result":
      activity.round_result = event.result?.round_result || activity.round_result;
      activity.round_state = event.result?.round_state || activity.round_state;
      activity.round_state_history = event.result?.round_state_history || activity.round_state_history || [];
      activity.controller_reducer_result = event.result?.controller_reducer_result || activity.controller_reducer_result || null;
      activity.artifact_ownership_scan = event.result?.artifact_ownership_scan || activity.artifact_ownership_scan || null;
      activity.ledger_stage = event.result?.ledger_stage || activity.ledger_stage || null;
      activity.loop_handoff = event.result?.loop_handoff || activity.loop_handoff || null;
      updateRunActivity(run, {
        phase: "result",
        current_step: "Runtime result received",
        timeline: { type: event.type, label: "Runtime result", detail: event.result?.summary || activity.round_result || "" }
      });
      break;
    case "codex.turn.completed":
      updateRunActivity(run, {
        phase: "turn-completed",
        current_step: "Codex turn completed",
        timeline: { type: event.type, label: "Turn completed", detail: event.turn_id || "" }
      });
      break;
    default:
      updateRunActivity(run, {
        phase: event.type?.startsWith("codex.server_request.") ? "waiting-runtime-request" : activity.phase,
        current_step: describeEvent(event),
        timeline: shouldTimelineEvent(event)
          ? { type: event.type || "event", label: describeEvent(event), detail: event.method || "" }
          : null
      });
      break;
  }
  return activity;
}

function controllerPlanStepLabel(status) {
  if (status === "planned") {
    return "Controller Agent planned worker route";
  }
  if (status === "needs_human") {
    return "Controller Agent requested human decision";
  }
  if (status === "blocked") {
    return "Controller Agent blocked worker dispatch";
  }
  return "Controller Agent planning failed";
}

function updateRunActivity(run, update) {
  const activity = run.activity || createRunActivity(run);
  run.activity = activity;
  activity.updated_at = new Date().toISOString();
  activity.last_event_at = activity.updated_at;
  if (update.phase) {
    activity.phase = update.phase;
    activity.phase_label = phaseLabel(update.phase);
  }
  if (update.current_step) {
    activity.current_step = update.current_step;
  }
  if (update.timeline) {
    addTimeline(activity, update.timeline);
  }
  return activity;
}

function finalizeRunActivity(run, { status, exitCode, parsedResult, errorMessage }) {
  const activity = run.activity || createRunActivity(run);
  run.activity = activity;
  activity.status = status;
  activity.updated_at = new Date().toISOString();
  activity.last_event_at = activity.updated_at;
  activity.validation_valid = parsedResult?.validation?.valid ?? null;
  activity.round_result = parsedResult?.runtime_result?.round_result || activity.round_result || "";
  if (Array.isArray(parsedResult?.worker_reports)) {
    activity.reports = parsedResult.worker_reports;
  }
  if (parsedResult?.loop_frame) {
    activity.controller_frame = parsedResult.loop_frame.controller_frame || activity.controller_frame || null;
    activity.execution_gate = parsedResult.loop_frame.execution_gate || activity.execution_gate || null;
    activity.executor_binding = parsedResult.loop_frame.executor_binding || activity.executor_binding || null;
    activity.worker_packets = Array.isArray(parsedResult.loop_frame.worker_packets) ? parsedResult.loop_frame.worker_packets : activity.worker_packets || [];
    activity.report_intake_rules = parsedResult.loop_frame.report_intake_rules || activity.report_intake_rules || null;
    activity.closeout_rules = parsedResult.loop_frame.closeout_rules || activity.closeout_rules || null;
  }
  if (parsedResult?.runtime_result) {
    activity.controller_frame = parsedResult.runtime_result.controller_frame || activity.controller_frame || null;
    activity.execution_gate = parsedResult.runtime_result.execution_gate || activity.execution_gate || null;
    activity.executor_binding = parsedResult.runtime_result.executor_binding || activity.executor_binding || null;
    activity.worker_packets = Array.isArray(parsedResult.runtime_result.worker_packets) ? parsedResult.runtime_result.worker_packets : activity.worker_packets || [];
    activity.report_intake = parsedResult.runtime_result.report_intake || activity.report_intake || null;
    activity.loop_handoff = parsedResult.runtime_result.loop_handoff || activity.loop_handoff || null;
    activity.round_state = parsedResult.runtime_result.round_state || activity.round_state || "";
    activity.round_state_history = parsedResult.runtime_result.round_state_history || activity.round_state_history || [];
    activity.controller_reducer_result = parsedResult.runtime_result.controller_reducer_result || activity.controller_reducer_result || null;
    activity.artifact_ownership_scan = parsedResult.runtime_result.artifact_ownership_scan || activity.artifact_ownership_scan || null;
    activity.ledger_stage = parsedResult.runtime_result.ledger_stage || activity.ledger_stage || null;
  }
  if (Array.isArray(parsedResult?.worker_tasks)) {
    activity.agents = parsedResult.worker_tasks.map((task) => {
      const report = parsedResult.worker_reports?.find((item) => item.task_id === task.id);
      const existing = (activity.agents || []).find((item) => item.task_id === task.id) || {};
      return {
        ...existing,
        task_id: task.id,
        role: task.role,
        objective: task.objective,
        status: report?.status || "completed",
        summary: report?.summary || "",
        current_step: report?.recommendation || existing.current_step || "",
        report: report || existing.report || null,
        updated_at: activity.updated_at
      };
    });
  }
  if (parsedResult?.merge_result) {
    activity.merge_result = parsedResult.merge_result;
  }
  activity.artifact_paths = {
    events_file: run.events_file || "",
    raw_events_file: run.raw_events_file || "",
    activity_file: run.activity_file || "",
    result_file: run.result_file || "",
    error_file: run.error_file || ""
  };
  activity.controls = { steer: false, interrupt: false };
  if (status === "completed") {
    updateRunActivity(run, {
      phase: "finished",
      current_step: activity.round_result
        ? `Completed with round_result=${activity.round_result}`
        : `Completed with exit code ${exitCode}`,
      timeline: {
        type: "runtime.finished",
        label: "Run finished",
        detail: parsedResult?.runtime_result?.summary || `exit ${exitCode}`
      }
    });
  } else if (status === "aborted") {
    updateRunActivity(run, {
      phase: "aborted",
      current_step: errorMessage || "Run aborted before completion",
      timeline: {
        type: "runtime.aborted",
        label: "Run aborted",
        detail: errorMessage || "aborted"
      }
    });
  } else {
    updateRunActivity(run, {
      phase: "failed",
      current_step: errorMessage || `Runtime failed with exit code ${exitCode}`,
      timeline: {
        type: "runtime.failed",
        label: "Run failed",
        detail: errorMessage || `exit ${exitCode}`
      }
    });
  }
  activity.status = status;
}

function handleCodexItem(activity, event, status) {
  const item = event.params?.item || {};
  const type = item.type || "item";
  if (type === "agentMessage") {
    const text = item.text || textFromContent(item.content);
    const report = parseWorkerReportText(text);
    if (event.task_id && report) {
      upsertAgent(activity, {
        task_id: event.task_id,
        role: event.role || report.role || "",
        status: report.status || status || "completed",
        summary: report.summary || "",
        current_step: report.recommendation || report.summary || "",
        latest_detail: report.summary || "",
        report,
        updated_at: new Date().toISOString()
      });
    } else if (text) {
      activity.agent_text = appendLimited(activity.agent_text, text, 8000);
    }
  }
  if (type === "reasoning") {
    const text = item.summary || item.text || textFromContent(item.content);
    if (text) {
      activity.reasoning_text = appendLimited(activity.reasoning_text, text, 4000);
    }
  }
  addExecutionEvent(activity, {
    type,
    title: describeItem(item, status),
    detail: itemDetail(item),
    status
  });
}

function addExecutionEvent(activity, entry) {
  const detail = truncate(entry.detail || "", 1200);
  const last = activity.execution_events.at(-1);
  if (last?.type === entry.type && last?.title === entry.title && last?.detail === detail) {
    last.status = entry.status || last.status;
    last.at = new Date().toISOString();
    return;
  }
  activity.execution_events.push({
    at: new Date().toISOString(),
    type: entry.type || "event",
    title: entry.title || entry.type || "Event",
    detail,
    status: entry.status || ""
  });
  activity.execution_events = activity.execution_events.slice(-80);
}

function appendAgentStream(activity, event, field, text, entry) {
  if (!event.task_id || !text) {
    return;
  }
  const existing = (activity.agents || []).find((item) => item.task_id === event.task_id) || {};
  const limit = field === "reasoning_text" ? 4000 : 8000;
  upsertAgent(activity, {
    task_id: event.task_id,
    role: event.role || existing.role || "",
    status: existing.status || "running",
    updated_at: new Date().toISOString(),
    [field]: appendLimited(existing[field] || "", text, limit),
    current_step: entry.title || existing.current_step || "",
    latest_detail: truncate(text, 360),
    execution_events: appendLimitedEvents(existing.execution_events || [], {
      at: new Date().toISOString(),
      type: field,
      title: entry.title || field,
      detail: truncate(text, 1200),
      status: entry.status || ""
    })
  });
}

function appendLimitedEvents(events, entry) {
  const last = events.at(-1);
  if (last?.type === entry.type && last?.title === entry.title && last?.detail === entry.detail) {
    return [
      ...events.slice(0, -1),
      {
        ...last,
        status: entry.status || last.status,
        at: entry.at
      }
    ].slice(-40);
  }
  return [...events, entry].slice(-40);
}

function upsertAgent(activity, agent) {
  activity.agents ||= [];
  const index = activity.agents.findIndex((item) => item.task_id === agent.task_id);
  const next = {
    ...(index >= 0 ? activity.agents[index] : {}),
    ...agent
  };
  if (index >= 0) {
    activity.agents[index] = next;
  } else {
    activity.agents.push(next);
  }
}

function addError(activity, event) {
  const text = errorText(event);
  activity.errors.push({
    at: new Date().toISOString(),
    message: text,
    will_retry: event.params?.willRetry === true
  });
  activity.errors = activity.errors.slice(-20);
  addExecutionEvent(activity, {
    type: "error",
    title: event.params?.willRetry ? "Retrying after error" : "Codex error",
    detail: text,
    status: event.params?.willRetry ? "retrying" : "failed"
  });
}

function describeItem(item = {}, status = "") {
  const suffix = status ? ` ${status}` : "";
  switch (item.type) {
    case "userMessage":
      return `User message${suffix}`;
    case "agentMessage":
      return `Agent message${suffix}`;
    case "reasoning":
      return `Reasoning summary${suffix}`;
    case "commandExecution":
      return `Command execution${suffix}`;
    case "fileChange":
      return `File change${suffix}`;
    case "toolCall":
      return `Tool call${suffix}`;
    case "webSearch":
      return `Web search${suffix}`;
    default:
      return `${item.type || "Item"}${suffix}`;
  }
}

function phaseForItem(item = {}, status = "") {
  if (item.type === "reasoning") {
    return "reasoning";
  }
  if (item.type === "agentMessage") {
    return "responding";
  }
  if (["commandExecution", "toolCall", "fileChange", "webSearch"].includes(item.type)) {
    return status === "completed" ? "tool-completed" : "tool-running";
  }
  return "working";
}

function itemDetail(item = {}) {
  return firstString([
    item.command,
    item.cmd,
    item.name,
    item.path,
    item.filePath,
    item.summary,
    item.text,
    textFromContent(item.content),
    item.error?.message,
    item.status,
    item.id
  ]);
}

function textFromContent(content) {
  if (!Array.isArray(content)) {
    return "";
  }
  return content
    .map((part) => part?.text || part?.content || "")
    .filter(Boolean)
    .join("\n");
}

function parseWorkerReportText(text) {
  if (!text || typeof text !== "string") {
    return null;
  }
  try {
    const parsed = JSON.parse(text);
    return parsed?.schema_version === "arckit-worker-report/v1" ? parsed : null;
  } catch {
    return null;
  }
}

function errorText(event) {
  const error = event.params?.error || {};
  return firstString([
    error.message,
    error.additionalDetails,
    event.params?.message,
    event.message,
    JSON.stringify(error)
  ]);
}

function firstString(values) {
  for (const value of values) {
    if (typeof value === "string" && value.trim()) {
      return value.trim();
    }
  }
  return "";
}

function statusPhase(status) {
  if (status === "active") {
    return "turn-started";
  }
  if (status === "systemError") {
    return "error";
  }
  if (status === "idle") {
    return "idle";
  }
  return "";
}

function addTimeline(activity, entry) {
  if (!entry) {
    return;
  }
  const last = activity.timeline.at(-1);
  if (last?.type === entry.type && last?.detail === entry.detail) {
    last.at = new Date().toISOString();
    return;
  }
  activity.timeline.push({
    at: new Date().toISOString(),
    type: entry.type,
    label: entry.label || entry.type,
    detail: truncate(entry.detail || "", 360)
  });
  activity.timeline = activity.timeline.slice(-50);
}

function addRawEvent(activity, line, event) {
  activity.raw_events.push({
    at: new Date().toISOString(),
    type: event?.type || "raw",
    text: truncate(line, 1000)
  });
  activity.raw_events = activity.raw_events.slice(-80);
}

function normalizePlan(plan) {
  const items = Array.isArray(plan?.items) ? plan.items : Array.isArray(plan) ? plan : [];
  return items.slice(0, 12).map((item) => ({
    text: String(item.text || item.step || item.title || item.description || item).slice(0, 220),
    status: String(item.status || item.state || "").slice(0, 40)
  }));
}

function summarizePlan(plan) {
  if (!Array.isArray(plan) || plan.length === 0) {
    return "";
  }
  return plan.map((item) => `${item.status ? `${item.status}: ` : ""}${item.text}`).join(" | ");
}

function describeEvent(event) {
  if (!event) {
    return "Runtime emitted output";
  }
  if (event.message) {
    return event.message;
  }
  return event.type || event.method || "Runtime event";
}

function shouldTimelineEvent(event) {
  if (!event?.type) {
    return false;
  }
  return (
    event.type.startsWith("codex.server_request.") ||
    event.type.includes("approval") ||
    event.type.includes("completed") ||
    event.type.includes("failed")
  );
}

function phaseLabel(phase) {
  const labels = {
    starting: "Starting runtime",
    "controller-frame": "Controller frame",
    "loop-frame": "Loop frame",
    "agent-running": "Agent running",
    "worker-report": "Worker report",
    "controller-correction": "Controller input",
    merge: "Merge gate",
    "runtime-output": "Runtime output",
    "codex-ready": "Codex ready",
    "thread-started": "Thread started",
    "turn-started": "Turn running",
    planning: "Planning",
    reasoning: "Reasoning summary",
    responding: "Responding",
    "tool-output": "Tool output",
    "tool-running": "Tool running",
    "tool-completed": "Tool completed",
    "waiting-runtime-request": "Runtime request",
    warning: "Warning",
    error: "Error",
    working: "Working",
    idle: "Idle",
    steering: "Steering",
    interrupting: "Interrupting",
    "gate-result": "Gate result",
    "write-ledger-preview": "Ledger preview",
    "write-ledger": "Ledger write",
    planned: "Round planned",
    authorized: "Round authorized",
    "workers_running": "Workers running",
    "reports_collected": "Reports collected",
    "merge_ready": "Merge ready",
    "ledger_gate_ready": "Ledger gate ready",
    "ledger_written": "Ledger written",
    "next_round_ready": "Next round ready",
    "human_gate_required": "Human gate required",
    "external_wait": "External wait",
    result: "Parsing result",
    "turn-completed": "Turn completed",
    finished: "Finished",
    aborted: "Aborted",
    failed: "Failed",
    "dry-run": "Dry run"
  };
  return labels[phase] || phase;
}

function appendLimited(current, chunk, limit) {
  const next = `${current || ""}${chunk || ""}`;
  return next.length > limit ? next.slice(next.length - limit) : next;
}

function truncate(value, limit) {
  const text = String(value || "");
  return text.length > limit ? `${text.slice(0, limit - 1)}…` : text;
}

function parseEventLine(line) {
  try {
    return JSON.parse(line);
  } catch {
    return null;
  }
}

function summarizeRuntimeResult(status, parsedResult, errorMessage) {
  if (status === "aborted") {
    return errorMessage ? `Run aborted: ${errorMessage}` : "Run aborted.";
  }
  if (errorMessage) {
    return `Run failed: ${errorMessage}`;
  }
  const runtimeResult = parsedResult?.runtime_result;
  if (!runtimeResult) {
    return status === "completed" ? "Run completed without a parsed runtime result." : `Run ${status}.`;
  }
  const parts = [
    `Round result: ${runtimeResult.round_result || "unknown"}.`,
    parsedResult.worker_reports ? `Worker reports: ${parsedResult.worker_reports.length}.` : "",
    parsedResult.merge_result?.decision ? `Merge: ${parsedResult.merge_result.decision}.` : "",
    runtimeResult.summary || "",
    parsedResult.validation?.valid === true ? "Validation: valid." : "Validation: invalid."
  ].filter(Boolean);
  const nextPrompt = runtimeResult.loop_handoff?.next_prompt;
  if (nextPrompt) {
    parts.push(`Next: ${nextPrompt.slice(0, 600)}`);
  }
  return parts.join("\n\n");
}

export {
  applyRunCommandResult,
  applyRunEvent,
  createRunActivity,
  finalizeRunActivity,
  normalizeCommandResult,
  parseEventLine,
  summarizeCommandResult,
  summarizeRuntimeResult,
  updateRunActivity
};
