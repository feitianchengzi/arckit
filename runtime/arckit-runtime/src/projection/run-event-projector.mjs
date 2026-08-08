function createRunActivity(run) {
  const timestamp = run.started_at || new Date().toISOString();
  return {
    schema_version: "desktop-run-activity/v2",
    run_id: run.id || "",
    task_id: run.task_id || "",
    case_id: "",
    entry_capability: run.entry_capability || "runtime",
    operator: run.operator || "desktop",
    status: run.status || "running",
    phase: run.adapter === "dry-run" ? "dry-run" : "starting",
    phase_label: run.adapter === "dry-run" ? "Dry run" : "Starting runtime",
    current_step: run.adapter === "dry-run" ? "Generating controlled prompt" : "Launching runtime process",
    started_at: timestamp,
    updated_at: timestamp,
    last_event_at: timestamp,
    round_index: 0,
    thread_id: "",
    turn_id: "",
    plan: [],
    controller_frame: null,
    controller_plan: null,
    execution_gate: null,
    executor_binding: null,
    worker_packets: [],
    report_intake_rules: null,
    closeout_rules: null,
    loop_handoff: null,
    pending_controller_event: null,
    agents: [],
    worker_contexts: [],
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
    messages: [normalizeRunMessage({
      id: `runtime:${run.id || "run"}:started`,
      role: "system",
      actor: "runtime",
      actor_label: "Runtime",
      kind: "status",
      content: run.task ? `开始执行：${truncate(run.task, 600)}` : "Runtime 已启动。",
      status: "running",
      run_id: run.id || "",
      task_id: run.task_id || "",
      created_at: timestamp,
      updated_at: timestamp
    })],
    execution_events: [],
    token_usage: emptyTokenUsage(),
    usage_warnings: [],
    performance: {
      rounds: [],
      turns: [],
      commands: [],
      model_time_ms: 0,
      command_time_ms: 0
    },
    errors: [],
    timeline: [
      {
        at: timestamp,
        type: "runtime.started",
        label: `${run.adapter || "runtime"} started`,
        detail: truncate(`${run.entry_capability || "runtime"}: ${run.task || run.id}`, 360)
      }
    ],
    controls: {
      steer: run.status === "running",
      interrupt: run.status === "running"
    },
    validation_valid: null,
    round_result: "",
    artifact_paths: {
      messages_file: run.messages_file || run.events_file || "",
      activity_file: run.activity_file || "",
      result_file: run.result_file || "",
      error_file: run.error_file || "",
      lifecycle_events_file: run.lifecycle_events_file || "",
      lifecycle_summary_file: run.lifecycle_summary_file || ""
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
      activity.loop_handoff = normalized.parsed?.case_transition_result?.case_resolution?.loop_handoff || activity.loop_handoff;
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
  addRunMessage(activity, {
    id: `runtime:${activity.run_id || "run"}:${commandType}:${activity.round_index || 0}`,
    role: "system",
    actor: "runtime",
    actor_label: "Runtime",
    kind: commandType === "gate-result" ? "gate" : "ledger",
    content: commandType === "gate-result"
      ? allowed ? "确定性 Gate 已允许 ledger 写回。" : `确定性 Gate 已阻止写回：${summarizeCommandResult(normalized)}`
      : written ? "Ledger 写回完成，Case State 已更新。" : `Ledger 未写回：${summarizeCommandResult(normalized)}`,
    status: allowed || written ? "completed" : "warning",
    round_index: activity.round_index || 0
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

  if (!event) {
    addRunMessage(activity, {
      id: `runtime:${activity.run_id || "run"}:stderr:${activity.messages?.length || 0}`,
      role: "system",
      actor: "runtime",
      actor_label: "Runtime",
      kind: "warning",
      content: truncate(line, 1000),
      status: "warning"
    });
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
    case "runtime.lifecycle.span.started":
    case "runtime.lifecycle.span.completed":
      // Lifecycle spans are persisted by Desktop's dedicated trace store. They
      // must not replace the user-facing phase/current-step projection.
      break;
    case "runtime.session_round.started":
      activity.round_index = Number(event.round_index || 0);
      startTiming(activity.performance.rounds, "round_index", activity.round_index, { started_at: Date.now() });
      updateRunActivity(run, {
        phase: "controller-planning",
        current_step: `Starting state-driven round ${event.round_index}`,
        timeline: {
          type: event.type,
          label: `Round ${event.round_index} started`,
          detail: event.project_updated_at || "Fresh ledger snapshot loaded"
        }
      });
      addRunMessage(activity, {
        id: `runtime:${activity.run_id || "run"}:round:${activity.round_index}:started`,
        role: "system",
        actor: "runtime",
        actor_label: "Runtime",
        kind: "round",
        content: `第 ${activity.round_index} 轮开始，已加载最新 Project/Case State。`,
        status: "running",
        round_index: activity.round_index
      });
      break;
    case "runtime.session_round.completed":
      finishTiming(activity.performance.rounds, "round_index", Number(event.round_index || activity.round_index || 0));
      updateRunActivity(run, {
        phase: event.ledger_written ? "write-ledger" : "merge",
        current_step: `Round ${event.round_index} completed with ${event.round_result || "unknown"}`,
        timeline: {
          type: event.type,
          label: `Round ${event.round_index} completed`,
          detail: event.ledger_written ? "Ledger written; continuing from fresh state" : event.round_result || ""
        }
      });
      addRunMessage(activity, {
        id: `runtime:${activity.run_id || "run"}:round:${event.round_index || activity.round_index}:completed`,
        role: "system",
        actor: "runtime",
        actor_label: "Runtime",
        kind: "round",
        content: event.ledger_written
          ? `第 ${event.round_index} 轮完成，ledger 已写回。`
          : `第 ${event.round_index} 轮结束：${event.round_result || "unknown"}。`,
        status: event.round_result === "blocked" ? "warning" : "completed",
        round_index: Number(event.round_index || activity.round_index || 0)
      });
      break;
    case "runtime.ledger_write.completed":
      applyRunCommandResult(run, "write-ledger", {
        code: event.result?.written === true ? 0 : 1,
        parsed: event.result || null,
        stderr: "",
        stdout: ""
      });
      break;
    case "runtime.loop_frame.created":
      activity.case_id = event.loop_frame?.case_id || event.loop_frame?.selected_gap?.case_id || activity.case_id || "";
      activity.controller_frame = event.loop_frame?.controller_frame || null;
      activity.execution_gate = event.loop_frame?.execution_gate || null;
      activity.executor_binding = event.loop_frame?.executor_binding || null;
      activity.worker_packets = Array.isArray(event.loop_frame?.worker_packets) ? event.loop_frame.worker_packets : [];
      activity.report_intake_rules = event.loop_frame?.report_intake_rules || null;
      activity.closeout_rules = event.loop_frame?.closeout_rules || null;
      updateRunActivity(run, {
        phase: "controller-frame",
        current_step: truncate(event.loop_frame?.controller_frame?.round_goal || event.loop_frame?.round_goal || "Controller frame created", 280),
        timeline: {
          type: event.type,
          label: "Controller frame",
          detail: `${event.loop_frame?.execution_gate?.status || "gate"} · ${event.loop_frame?.case_id || event.loop_frame?.selected_gap?.id || ""}`
        }
      });
      break;
    case "runtime.controller_plan.completed":
      activity.controller_plan = event.controller_plan || null;
      activity.case_id = event.controller_plan?.route_plan?.selected_gap?.case_id || activity.case_id || "";
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
      addRunMessage(activity, {
        id: `controller:${activity.run_id || "run"}:round:${activity.round_index}:plan`,
        role: "assistant",
        actor: "controller",
        actor_label: "Controller",
        kind: "plan",
        content: event.controller_plan?.summary || event.failure_reason || controllerPlanStepLabel(event.status),
        status: event.status === "planned" ? "completed" : event.status === "needs_human" ? "waiting" : "warning",
        round_index: activity.round_index
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
      addRunMessage(activity, {
        id: `controller:${activity.run_id || "run"}:round:${activity.round_index}:review`,
        role: "assistant",
        actor: "controller",
        actor_label: "Controller Review",
        kind: "review",
        content: event.controller_review?.summary || event.failure_reason || event.status || "Controller Review 已完成。",
        status: event.status === "reviewed" ? "completed" : "warning",
        round_index: activity.round_index
      });
      if (event.status !== "reviewed") {
        addUsageWarning(activity, {
          id: `controller-review-${activity.round_index || 0}`,
          type: "controller_review_failed",
          lane: "controller",
          message: event.failure_reason || "Controller Review failed or returned unusable report references.",
          evidence: event.controller_review?.summary || event.status || "review_failed"
        });
      }
      break;
    case "runtime.agent_task.started":
      recordWorkerContext(activity, event);
      upsertAgent(activity, {
        task_id: event.task_id,
        worker_type: event.worker_type || "",
        workstream_id: event.workstream_id || "",
        worker_thread_key: event.worker_thread_key || "",
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
      addRunMessage(activity, {
        id: `agent:${event.task_id}:status`,
        role: "assistant",
        actor: "agent",
        actor_label: event.role || workerLabel(event.worker_type),
        kind: "task",
        content: event.objective || `${event.role || "Worker Agent"} 已开始执行。`,
        status: "running",
        task_id: event.task_id,
        round_index: activity.round_index
      });
      break;
    case "runtime.agent_task.fail_fast":
      upsertAgent(activity, {
        task_id: event.task_id,
        worker_type: event.worker_type || "",
        workstream_id: event.workstream_id || "",
        worker_thread_key: event.worker_thread_key || "",
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
      addRunMessage(activity, {
        id: `agent:${event.task_id}:status`,
        role: "assistant",
        actor: "agent",
        actor_label: event.role || workerLabel(event.worker_type),
        kind: "task",
        content: event.reason || "Runtime 已停止剩余 Worker。",
        status: "failed",
        task_id: event.task_id,
        round_index: activity.round_index
      });
      break;
    case "runtime.worker_report.completed":
      upsertAgent(activity, {
        task_id: event.task_id,
        worker_type: event.worker_type || event.report?.worker_type || "",
        workstream_id: event.workstream_id || "",
        worker_thread_key: event.worker_thread_key || "",
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
      addRunMessage(activity, {
        id: `agent:${event.task_id}:report`,
        role: "assistant",
        actor: "agent",
        actor_label: event.role || workerLabel(event.worker_type || event.report?.worker_type),
        kind: "report",
        content: event.report?.summary || event.status || "Worker report 已返回。",
        detail: event.report?.recommendation || "",
        status: ["completed", "success"].includes(event.status || event.report?.status) ? "completed" : event.status || event.report?.status || "completed",
        task_id: event.task_id,
        round_index: activity.round_index
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
      addRunMessage(activity, {
        id: `runtime:${activity.run_id || "run"}:round:${activity.round_index}:merge`,
        role: "system",
        actor: "runtime",
        actor_label: "Runtime",
        kind: "result",
        content: event.merge_result?.loop_gate?.reason || `报告合并结果：${event.merge_result?.decision || "unknown"}。`,
        status: event.merge_result?.decision === "blocked" ? "warning" : "completed",
        round_index: activity.round_index
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
      startTiming(activity.performance.turns, "turn_id", event.turn_id || activity.turn_id, {
        thread_id: event.thread_id || activity.thread_id,
        lane: tokenLane(activity, event),
        round_index: Number(activity.round_index || 0),
        started_at: Date.now()
      });
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
      appendRunMessageContent(activity, {
        id: streamMessageId(activity, event, "progress"),
        role: "assistant",
        actor: event.controller_role ? "controller" : "agent",
        actor_label: event.controller_role ? controllerRoleLabel(event.controller_role) : event.role || workerLabel(event.worker_type),
        kind: "progress",
        text: event.text || "",
        status: "streaming",
        task_id: event.task_id || "",
        thread_id: event.thread_id || activity.thread_id,
        turn_id: event.turn_id || activity.turn_id,
        item_id: event.item_id || "",
        round_index: activity.round_index
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
        if (!event.controller_role || activity.entry_capability === "agent-task") {
          appendRunMessageContent(activity, {
            id: streamMessageId(activity, event, "response"),
            role: "assistant",
            actor: "agent",
            actor_label: activity.entry_capability === "agent-task" ? "Commit Agent" : "Agent",
            kind: "response",
            text: event.text || "",
            status: "streaming",
            thread_id: event.thread_id || activity.thread_id,
            turn_id: event.turn_id || activity.turn_id,
            item_id: event.item_id || "",
            round_index: activity.round_index
          });
        }
      }
      updateRunActivity(run, {
        phase: "responding",
        current_step: "Receiving Codex response"
      });
      break;
    case "codex.command.output.delta":
      updateRunActivity(run, {
        phase: "tool-output",
        current_step: "Receiving command output"
      });
      break;
    case "codex.thread.tokenUsage.updated":
      applyTokenUsage(activity, event);
      updateRunActivity(run, {
        phase: activity.phase,
        current_step: activity.current_step
      });
      break;
    case "codex.command.duplicate.suppressed":
      addUsageWarning(activity, {
        id: `duplicate-command-${event.item_id || activity.usage_warnings.length}`,
        type: "duplicate_command",
        lane: tokenLane(activity, event),
        message: event.warning || "An equivalent command was suppressed while the first process was still running.",
        evidence: [event.cwd, event.command, event.active_item_id].filter(Boolean).join(" · ")
      });
      addExecutionEvent(activity, {
        type: "duplicate_command",
        title: "Duplicate command suppressed",
        detail: [event.cwd, event.command].filter(Boolean).join(" · "),
        status: "warning"
      });
      addRunMessage(activity, {
        id: `tool:${event.item_id || activity.messages?.length}:duplicate`,
        role: "assistant",
        actor: "tool",
        actor_label: "工具",
        kind: "warning",
        content: event.warning || "等价命令已在当前工作区运行，本次调用未启动重复进程。",
        detail: [event.cwd, event.command].filter(Boolean).join(" · "),
        status: "warning",
        task_id: event.task_id || "",
        item_id: event.item_id || "",
        round_index: activity.round_index
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
      addRunMessage(activity, {
        id: `runtime:${activity.run_id || "run"}:error:${activity.errors.length}`,
        role: "system",
        actor: event.task_id ? "agent" : "runtime",
        actor_label: event.role || (event.task_id ? workerLabel(event.worker_type) : "Runtime"),
        kind: "error",
        content: errorText(event),
        status: event.params?.willRetry ? "warning" : "failed",
        task_id: event.task_id || "",
        round_index: activity.round_index
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
      addRunMessage(activity, {
        id: `runtime:${activity.run_id || "run"}:warning:${activity.messages?.length || 0}`,
        role: "system",
        actor: event.task_id ? "agent" : "runtime",
        actor_label: event.role || (event.task_id ? workerLabel(event.worker_type) : "Runtime"),
        kind: "warning",
        content: event.params?.message || describeEvent(event),
        status: "warning",
        task_id: event.task_id || "",
        round_index: activity.round_index
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
      addRunMessage(activity, {
        id: `runtime:${activity.run_id || "run"}:result:${activity.round_index || 0}`,
        role: "system",
        actor: "runtime",
        actor_label: "Runtime",
        kind: "result",
        content: event.result?.summary || `本轮结果：${activity.round_result || "unknown"}。`,
        status: activity.round_result === "blocked" ? "warning" : "completed",
        round_index: activity.round_index
      });
      break;
    case "codex.turn.completed":
      finishTiming(activity.performance.turns, "turn_id", event.turn_id || activity.turn_id);
      activity.performance.model_time_ms = sumDurations(activity.performance.turns);
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
    activity.case_id = parsedResult.loop_frame.case_id || parsedResult.loop_frame.selected_gap?.case_id || activity.case_id || "";
    activity.controller_frame = parsedResult.loop_frame.controller_frame || activity.controller_frame || null;
    activity.execution_gate = parsedResult.loop_frame.execution_gate || activity.execution_gate || null;
    activity.executor_binding = parsedResult.loop_frame.executor_binding || activity.executor_binding || null;
    activity.worker_packets = Array.isArray(parsedResult.loop_frame.worker_packets) ? parsedResult.loop_frame.worker_packets : activity.worker_packets || [];
    activity.report_intake_rules = parsedResult.loop_frame.report_intake_rules || activity.report_intake_rules || null;
    activity.closeout_rules = parsedResult.loop_frame.closeout_rules || activity.closeout_rules || null;
  }
  if (parsedResult?.runtime_result) {
    activity.case_id = parsedResult.runtime_result.case_transition?.case_id || activity.case_id || "";
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
  if (parsedResult?.ledger_write_result) {
    applyRunCommandResult(run, "write-ledger", {
      code: parsedResult.ledger_write_result.written === true ? 0 : 1,
      parsed: parsedResult.ledger_write_result,
      stderr: "",
      stdout: ""
    });
  }
  if (Array.isArray(parsedResult?.worker_tasks)) {
    activity.agents = parsedResult.worker_tasks.map((task) => {
      const report = parsedResult.worker_reports?.find((item) => item.task_id === task.id);
      const existing = (activity.agents || []).find((item) => item.task_id === task.id) || {};
      return {
        ...existing,
        task_id: task.id,
        role: task.role,
        worker_type: task.worker_type || existing.worker_type || "",
        workstream_id: task.workstream_id || existing.workstream_id || "",
        worker_thread_key: task.worker_thread_key || existing.worker_thread_key || "",
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
    messages_file: run.messages_file || run.events_file || "",
    activity_file: run.activity_file || "",
    result_file: run.result_file || "",
    error_file: run.error_file || "",
    lifecycle_events_file: run.lifecycle_events_file || "",
    lifecycle_summary_file: run.lifecycle_summary_file || ""
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
    addRunMessage(activity, {
      id: `runtime:${activity.run_id || "run"}:finished`,
      role: "system",
      actor: "runtime",
      actor_label: "Runtime",
      kind: "result",
      content: parsedResult?.runtime_result?.summary || (activity.round_result ? `执行结束：${activity.round_result}。` : "执行已完成。"),
      status: "completed",
      round_index: activity.round_index
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
    addRunMessage(activity, {
      id: `runtime:${activity.run_id || "run"}:finished`,
      role: "system",
      actor: "runtime",
      actor_label: "Runtime",
      kind: "error",
      content: errorMessage || "执行已中止。",
      status: "failed",
      round_index: activity.round_index
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
    addRunMessage(activity, {
      id: `runtime:${activity.run_id || "run"}:finished`,
      role: "system",
      actor: "runtime",
      actor_label: "Runtime",
      kind: "error",
      content: errorMessage || `Runtime 失败，exit code ${exitCode}。`,
      status: "failed",
      round_index: activity.round_index
    });
  }
  activity.status = status;
}

function handleCodexItem(activity, event, status) {
  const item = event.params?.item || {};
  const type = item.type || "item";
  const itemId = String(item.id || event.params?.itemId || event.item_id || "");
  if (type === "agentMessage") {
    const text = item.text || textFromContent(item.content);
    const report = parseWorkerReportText(text);
    if (event.task_id && report) {
      upsertAgent(activity, {
        task_id: event.task_id,
        worker_type: event.worker_type || report.worker_type || "",
        role: event.role || report.role || "",
        status: report.status || status || "completed",
        summary: report.summary || "",
        current_step: report.recommendation || report.summary || "",
        latest_detail: report.summary || "",
        report,
        updated_at: new Date().toISOString()
      });
    } else if (text) {
      activity.agent_text = mergeCompletedText(activity.agent_text, text, 8000);
      if (!event.controller_role || activity.entry_capability === "agent-task") {
        addRunMessage(activity, {
          id: streamMessageId(activity, { ...event, item_id: itemId }, "response"),
          role: "assistant",
          actor: "agent",
          actor_label: activity.entry_capability === "agent-task" ? "Commit Agent" : "Agent",
          kind: "response",
          content: text,
          status,
          thread_id: event.thread_id || activity.thread_id,
          turn_id: event.turn_id || activity.turn_id,
          item_id: itemId,
          round_index: activity.round_index
        });
      }
    }
  }
  if (type === "reasoning") {
    const text = item.summary || item.text || textFromContent(item.content);
    if (text) {
      activity.reasoning_text = mergeCompletedText(activity.reasoning_text, text, 4000);
      addRunMessage(activity, {
        id: streamMessageId(activity, { ...event, item_id: itemId }, "progress"),
        role: "assistant",
        actor: event.controller_role ? "controller" : "agent",
        actor_label: event.controller_role ? controllerRoleLabel(event.controller_role) : event.role || workerLabel(event.worker_type),
        kind: "progress",
        content: text,
        status,
        task_id: event.task_id || "",
        thread_id: event.thread_id || activity.thread_id,
        turn_id: event.turn_id || activity.turn_id,
        item_id: itemId,
        round_index: activity.round_index
      });
    }
  }
  if (type === "commandExecution") {
    const commandExitCode = item.exitCode ?? item.exit_code;
    if (status === "started") {
      startTiming(activity.performance.commands, "item_id", itemId, {
        command: firstString([item.command, item.cmd]),
        cwd: String(item.cwd || ""),
        lane: tokenLane(activity, event),
        turn_id: String(event.params?.turnId || activity.turn_id || ""),
        started_at: nonNegativeNumber(item.startedAtMs) || Date.now()
      });
    } else {
      finishTiming(activity.performance.commands, "item_id", itemId, nonNegativeNumber(item.completedAtMs) || Date.now());
      activity.performance.command_time_ms = sumDurations(activity.performance.commands);
    }
    addRunMessage(activity, {
      id: `tool:${itemId || activity.messages?.length || 0}`,
      role: "assistant",
      actor: "tool",
      actor_label: "工具",
      kind: "command",
      content: firstString([item.command, item.cmd]) || "执行命令",
      detail: commandMessageDetail(item, status),
      status: commandExitCode === 0 ? "completed" : commandExitCode !== undefined && commandExitCode !== null ? "failed" : status,
      task_id: event.task_id || "",
      thread_id: event.thread_id || activity.thread_id,
      turn_id: event.turn_id || activity.turn_id,
      item_id: itemId,
      round_index: activity.round_index
    });
  }
  if (["fileChange", "toolCall", "webSearch"].includes(type)) {
    addRunMessage(activity, {
      id: `tool:${itemId || activity.messages?.length || 0}`,
      role: "assistant",
      actor: "tool",
      actor_label: "工具",
      kind: type,
      content: itemDetail(item) || describeItem(item, status),
      status,
      task_id: event.task_id || "",
      thread_id: event.thread_id || activity.thread_id,
      turn_id: event.turn_id || activity.turn_id,
      item_id: itemId,
      round_index: activity.round_index
    });
  }
  addExecutionEvent(activity, {
    type,
    title: describeItem(item, status),
    detail: itemDetail(item),
    status
  });
}

function emptyTokenUsage() {
  return {
    schema_version: "runtime-token-usage/v1",
    summary: tokenCounts(),
    model_context_window: 0,
    max_context_utilization: 0,
    threads: [],
    turns: [],
    lanes: [],
    updated_at: ""
  };
}

function applyTokenUsage(activity, event) {
  const params = event.params || event.raw_rpc?.params || {};
  const usage = params.tokenUsage || {};
  const threadId = String(params.threadId || event.thread_id || "").trim();
  const turnId = String(params.turnId || event.turn_id || "").trim();
  if (!threadId || !turnId || !usage.total) return;
  const projection = activity.token_usage?.schema_version === "runtime-token-usage/v1"
    ? activity.token_usage
    : emptyTokenUsage();
  activity.token_usage = projection;
  const currentTotal = normalizeTokenCounts(usage.total);
  const lastRequest = normalizeTokenCounts(usage.last);
  const contextWindow = nonNegativeNumber(usage.modelContextWindow);
  const contextUtilization = contextWindow > 0 ? Math.min(lastRequest.input_tokens / contextWindow, 1) : 0;
  const existingThreadIndex = projection.threads.findIndex((item) => item.thread_id === threadId);
  const existingThread = existingThreadIndex >= 0 ? projection.threads[existingThreadIndex] : null;
  const turnIndex = projection.turns.findIndex((item) => item.thread_id === threadId && item.turn_id === turnId);
  const lane = tokenLane(activity, event);
  const baseline = turnIndex >= 0
    ? projection.turns[turnIndex].baseline_total
    : existingThread?.latest_total || tokenCounts();
  const timestamp = new Date().toISOString();
  const thread = {
    thread_id: threadId,
    lane,
    worker_type: String(event.worker_type || existingThread?.worker_type || ""),
    workstream_id: String(event.workstream_id || existingThread?.workstream_id || ""),
    latest_total: currentTotal,
    model_context_window: contextWindow,
    updated_at: timestamp
  };
  if (existingThreadIndex >= 0) projection.threads[existingThreadIndex] = thread;
  else projection.threads.push(thread);
  const turn = {
    thread_id: threadId,
    turn_id: turnId,
    lane,
    worker_type: String(event.worker_type || ""),
    workstream_id: String(event.workstream_id || ""),
    round_index: Number(activity.round_index || 0),
    baseline_total: baseline,
    usage: subtractTokenCounts(currentTotal, baseline),
    last_request: lastRequest,
    model_context_window: contextWindow,
    context_utilization: contextUtilization,
    updated_at: timestamp
  };
  if (turnIndex >= 0) projection.turns[turnIndex] = turn;
  else projection.turns.push(turn);
  projection.summary = sumTokenCounts(projection.threads.map((item) => item.latest_total));
  projection.model_context_window = Math.max(0, ...projection.threads.map((item) => item.model_context_window || 0));
  projection.max_context_utilization = Math.max(0, ...projection.turns.map((item) => item.context_utilization || 0));
  projection.lanes = [...new Set(projection.threads.map((item) => item.lane))].map((laneName) => ({
    lane: laneName,
    ...sumTokenCounts(projection.threads.filter((item) => item.lane === laneName).map((item) => item.latest_total))
  }));
  projection.updated_at = timestamp;
  if (contextUtilization >= 0.8) {
    addUsageWarning(activity, {
      id: `context-pressure-${threadId}-${turnId}`,
      type: "context_pressure",
      lane,
      thread_id: threadId,
      turn_id: turnId,
      message: `Latest model request uses ${(contextUtilization * 100).toFixed(1)}% of the context window.`,
      evidence: `${lastRequest.input_tokens} / ${contextWindow} input tokens`
    });
  }
}

function tokenLane(activity, event) {
  if ((activity.entry_capability || "") === "agent-task") return "commit";
  if (event.controller_role) return "controller";
  if (event.task_id) return event.worker_type === "verification" ? "verifier" : "builder";
  return "controller";
}

function tokenCounts(values = {}) {
  const input = nonNegativeNumber(values.input_tokens ?? values.inputTokens);
  const cached = Math.min(input, nonNegativeNumber(values.cached_input_tokens ?? values.cachedInputTokens));
  return {
    logical_total_tokens: nonNegativeNumber(values.logical_total_tokens ?? values.totalTokens),
    input_tokens: input,
    cached_input_tokens: cached,
    uncached_input_tokens: Math.max(0, input - cached),
    output_tokens: nonNegativeNumber(values.output_tokens ?? values.outputTokens),
    reasoning_output_tokens: nonNegativeNumber(values.reasoning_output_tokens ?? values.reasoningOutputTokens)
  };
}

function normalizeTokenCounts(values) {
  return tokenCounts(values || {});
}

function subtractTokenCounts(current, baseline) {
  return Object.fromEntries(Object.keys(tokenCounts()).map((key) => [key, Math.max(0, (current[key] || 0) - (baseline[key] || 0))]));
}

function sumTokenCounts(items) {
  const total = tokenCounts();
  for (const item of items) {
    for (const key of Object.keys(total)) total[key] += nonNegativeNumber(item?.[key]);
  }
  return total;
}

function recordWorkerContext(activity, event) {
  const threadKey = String(event.worker_thread_key || "").trim();
  if (!threadKey) return;
  activity.worker_contexts ||= [];
  const index = activity.worker_contexts.findIndex((item) => item.worker_thread_key === threadKey);
  const existing = index >= 0 ? activity.worker_contexts[index] : null;
  const signature = String(event.context_scope_signature || "");
  const timestamp = new Date().toISOString();
  if (existing?.latest_scope_signature && signature && existing.latest_scope_signature !== signature) {
    addUsageWarning(activity, {
      id: `worker-context-scope-${threadKey}-${signature}`,
      type: "worker_context_scope_changed",
      lane: tokenLane(activity, event),
      message: `Worker thread ${threadKey} was reused with a different authorized path/skill scope.`,
      evidence: `${existing.latest_scope_signature} -> ${signature}; workstream=${event.workstream_id || ""}`
    });
  }
  const entry = {
    worker_thread_key: threadKey,
    case_id: String(event.task?.loop_frame_excerpt?.case_id || existing?.case_id || ""),
    worker_type: String(event.worker_type || existing?.worker_type || ""),
    workstream_id: String(event.workstream_id || existing?.workstream_id || ""),
    task_count: Number(existing?.task_count || 0) + 1,
    scope_signatures: [...new Set([...(existing?.scope_signatures || []), signature].filter(Boolean))].slice(-8),
    latest_scope_signature: signature || existing?.latest_scope_signature || "",
    context_digest_version: String(event.context_digest_version || existing?.context_digest_version || ""),
    context_digest_revision: String(event.task?.inputs?.context_digest?.case_updated_at || existing?.context_digest_revision || ""),
    context_ref_count: Number(event.context_ref_count || 0),
    prior_report_count: Number(event.prior_report_count || 0),
    updated_at: timestamp
  };
  if (index >= 0) activity.worker_contexts[index] = entry;
  else activity.worker_contexts.push(entry);
  activity.worker_contexts = activity.worker_contexts.slice(-50);
}

function addUsageWarning(activity, warning) {
  activity.usage_warnings ||= [];
  const entry = {
    id: String(warning.id || `${warning.type}-${activity.usage_warnings.length}`),
    type: String(warning.type || "usage_warning"),
    lane: String(warning.lane || ""),
    thread_id: String(warning.thread_id || ""),
    turn_id: String(warning.turn_id || ""),
    message: String(warning.message || "Runtime usage warning."),
    evidence: String(warning.evidence || ""),
    detected_at: new Date().toISOString(),
    blocking: false
  };
  const index = activity.usage_warnings.findIndex((item) => item.id === entry.id);
  if (index >= 0) activity.usage_warnings[index] = entry;
  else activity.usage_warnings.push(entry);
  activity.usage_warnings = activity.usage_warnings.slice(-50);
}

function nonNegativeNumber(value) {
  const number = Number(value || 0);
  return Number.isFinite(number) && number > 0 ? number : 0;
}

function startTiming(items, key, value, fields) {
  if (!value || !Array.isArray(items)) return;
  const index = items.findIndex((item) => item[key] === value);
  const entry = {
    ...(index >= 0 ? items[index] : {}),
    [key]: value,
    ...fields,
    started_at: index >= 0 ? items[index].started_at || fields.started_at : fields.started_at,
    finished_at: index >= 0 ? items[index].finished_at || 0 : 0,
    duration_ms: index >= 0 ? items[index].duration_ms || 0 : 0
  };
  if (index >= 0) items[index] = entry;
  else items.push(entry);
}

function finishTiming(items, key, value, finishedAt = Date.now()) {
  if (!value || !Array.isArray(items)) return;
  const item = items.find((entry) => entry[key] === value);
  if (!item || item.finished_at) return;
  item.finished_at = finishedAt;
  item.duration_ms = Math.max(0, finishedAt - Number(item.started_at || finishedAt));
}

function sumDurations(items) {
  return (items || []).reduce((total, item) => total + nonNegativeNumber(item.duration_ms), 0);
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
    return parsed?.schema_version === "arckit-worker-report/v2" ? parsed : null;
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

function addRunMessage(activity, input) {
  activity.messages ||= [];
  const id = String(input.id || `message:${activity.run_id || "run"}:${activity.messages.length}`);
  const index = activity.messages.findIndex((message) => message.id === id);
  const existing = index >= 0 ? activity.messages[index] : null;
  const timestamp = new Date().toISOString();
  const next = normalizeRunMessage({
    ...existing,
    ...input,
    id,
    run_id: input.run_id || existing?.run_id || activity.run_id || "",
    task_id: input.task_id || existing?.task_id || activity.task_id || "",
    created_at: existing?.created_at || input.created_at || timestamp,
    updated_at: input.updated_at || timestamp,
    revision: Number(existing?.revision || 0) + 1
  });
  if (index >= 0) activity.messages[index] = next;
  else activity.messages.push(next);
  activity.messages = activity.messages.slice(-200);
  return next;
}

function appendRunMessageContent(activity, input) {
  const existing = (activity.messages || []).find((message) => message.id === input.id);
  return addRunMessage(activity, {
    ...input,
    content: appendLimited(existing?.content || "", input.text || "", 6000)
  });
}

function normalizeRunMessage(message = {}) {
  return {
    schema_version: "desktop-run-message/v1",
    id: String(message.id || ""),
    role: String(message.role || "system"),
    actor: String(message.actor || "runtime"),
    actor_label: String(message.actor_label || "Runtime"),
    kind: String(message.kind || "status"),
    content: truncate(message.content || "", 6000),
    detail: truncate(message.detail || "", 1800),
    status: String(message.status || "completed"),
    run_id: String(message.run_id || ""),
    task_id: String(message.task_id || ""),
    round_index: Number(message.round_index || 0),
    thread_id: String(message.thread_id || ""),
    turn_id: String(message.turn_id || ""),
    item_id: String(message.item_id || ""),
    created_at: String(message.created_at || new Date().toISOString()),
    updated_at: String(message.updated_at || message.created_at || new Date().toISOString()),
    revision: Math.max(1, Number(message.revision || 1))
  };
}

function streamMessageId(activity, event, kind) {
  return [
    event.controller_role ? "controller" : "agent",
    event.task_id || event.controller_role || activity.entry_capability || "agent",
    kind,
    event.item_id || event.turn_id || activity.turn_id || activity.messages?.length || 0
  ].join(":");
}

function controllerRoleLabel(role) {
  if (role === "review") return "Controller Review";
  if (role === "correction") return "Controller Correction";
  return "Controller";
}

function workerLabel(workerType) {
  const labels = {
    product: "产品 Agent",
    interaction: "交互 Agent",
    visual: "视觉 Agent",
    tech: "技术 Agent",
    diagnosis: "诊断 Agent",
    implementation: "实现 Agent",
    verification: "验证 Agent",
    closeout: "收束 Agent"
  };
  return labels[String(workerType || "")] || "Worker Agent";
}

function commandMessageDetail(item, status) {
  const parts = [String(item.cwd || "")];
  const exitCode = item.exitCode ?? item.exit_code;
  if (exitCode !== undefined && exitCode !== null) parts.push(`exit ${exitCode}`);
  else parts.push(status);
  const output = firstString([item.aggregatedOutput, item.output, item.stdout, item.stderr]);
  if (output) parts.push(truncate(output, 1200));
  return parts.filter(Boolean).join(" · ");
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

function mergeCompletedText(current, completed, limit) {
  const currentText = String(current || "");
  const completedText = String(completed || "");
  if (!completedText) {
    return currentText;
  }
  if (!currentText) {
    return appendLimited("", completedText, limit);
  }
  if (currentText.endsWith(completedText)) {
    return currentText;
  }
  if (completedText.endsWith(currentText) || completedText.includes(currentText)) {
    return appendLimited("", completedText, limit);
  }
  return appendLimited(currentText, completedText, limit);
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
  addRunMessage,
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
