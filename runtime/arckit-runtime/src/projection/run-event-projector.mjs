function createRunActivity(run) {
  const timestamp = run.started_at || new Date().toISOString();
  return {
    schema_version: "desktop-run-activity/v3",
    run_id: run.id || "",
    task_id: run.task_id || "",
    case_id: "",
    entry_capability: "runtime",
    operator: run.operator || "desktop",
    status: run.status || "running",
    phase: run.adapter === "dry-run" ? "dry-run" : "starting",
    phase_label: run.adapter === "dry-run" ? "Dry run" : "Starting runtime",
    current_step: run.adapter === "dry-run" ? "Generating Agent invocation" : "Launching Runtime",
    started_at: timestamp,
    updated_at: timestamp,
    last_event_at: timestamp,
    round_index: 0,
    thread_id: run.thread_id || "",
    turn_id: "",
    plan: [],
    controller_frame: null,
    execution_gate: null,
    executor_binding: null,
    loop_handoff: null,
    agent_loop_result: null,
    artifact_ownership_scan: null,
    round_state: "planned",
    round_state_history: [],
    ledger_stage: null,
    gate_result: null,
    ledger_write_result: null,
    closeout_result: null,
    context_compactions: [],
    agent_text: "",
    reasoning_text: "",
    command_output: "",
    messages: [normalizeRunMessage({
      id: `runtime:${run.id || "run"}:started`, role: "system", actor: "runtime", actor_label: "Runtime",
      kind: "status", content: run.task ? `开始执行：${truncate(run.task, 600)}` : "Runtime 已启动。", status: "active", created_at: timestamp
    })],
    timeline: [],
    token_usage: emptyTokenUsage(),
    usage_warnings: [],
    performance: emptyPerformance(),
    validation_valid: null,
    error: ""
  };
}

function applyRunEvent(run, { parsed }) {
  const event = parsed?.event;
  if (!event) return run.activity;
  const activity = run.activity || createRunActivity(run);
  run.activity = activity;
  const now = new Date().toISOString();
  activity.updated_at = now;
  activity.last_event_at = now;

  switch (event.type) {
    case "runtime.session_round.started":
      activity.round_index = Number(event.round_index || activity.round_index || 0);
      updateRunActivity(run, { phase: "agent-loop", current_step: `Starting gap round ${activity.round_index}` });
      break;
    case "runtime.agent_loop.started":
      updateRunActivity(run, { phase: "agent-loop", current_step: "Codex Agent is advancing one Case gap" });
      upsertMessage(activity, {
        id: `agent:${activity.round_index}:status`, role: "assistant", actor: "agent", actor_label: "Codex Agent", kind: "status",
        content: "Agent 正在推进一个 Case gap。", status: "active"
      });
      break;
    case "runtime.agent_loop.completed":
      activity.case_id = event.case_id || activity.case_id;
      activity.agent_loop_result = {
        action: event.action || "",
        summary: event.summary || "",
        case_id: event.case_id || ""
      };
      upsertMessage(activity, {
        id: `agent:${activity.round_index}:result`, role: "assistant", actor: "agent", actor_label: "Codex Agent", kind: "result",
        content: event.summary || "Agent Loop 已完成。", status: "completed"
      });
      break;
    case "runtime.context_compaction.started":
      updateCompaction(activity, event, "running");
      updateRunActivity(run, { phase: "context-compacting", current_step: "Compacting the current Codex thread" });
      break;
    case "runtime.context_compaction.completed":
      updateCompaction(activity, event, "completed");
      updateRunActivity(run, { phase: "agent-loop", current_step: "Context compacted; continuing the next gap" });
      break;
    case "codex.thread.start.completed":
    case "codex.thread.resume.completed":
    case "codex.thread.reused":
    case "codex.thread.started":
      activity.thread_id = event.thread_id || activity.thread_id;
      break;
    case "codex.thread.recovery_fallback":
      activity.thread_id = event.thread_id || activity.thread_id;
      addUsageWarning(activity, {
        id: `thread-recovery-${event.thread_id}`, type: "thread_recovery_fallback", lane: "agent",
        message: `Persisted thread ${event.missing_thread_id || ""} was unavailable; Runtime created ${event.thread_id || ""}.`, evidence: event.reason || ""
      });
      break;
    case "codex.turn.start.completed":
    case "codex.turn.started":
      activity.thread_id = event.thread_id || activity.thread_id;
      activity.turn_id = event.turn_id || activity.turn_id;
      markTurn(activity, event, "running");
      break;
    case "codex.turn.completed":
      markTurn(activity, event, "completed");
      break;
    case "codex.thread.tokenUsage.updated":
      applyTokenUsage(activity, event);
      break;
    case "codex.command.duplicate.suppressed":
      addUsageWarning(activity, {
        id: `duplicate-command-${event.item_id || Date.now()}`, type: "duplicate_command", lane: "agent",
        message: event.warning || "An equivalent command is already running.", evidence: `${event.cwd || ""} ${event.command || ""}`.trim()
      });
      break;
    case "codex.agent_message.delta":
      activity.agent_text = appendLimited(activity.agent_text, event.text || "", 24_000);
      upsertMessage(activity, {
        id: `agent:${activity.turn_id || activity.round_index}:stream`, role: "assistant", actor: "agent", actor_label: "Codex Agent", kind: "message",
        content: activity.agent_text, status: "streaming"
      });
      break;
    case "codex.reasoning.delta":
      activity.reasoning_text = appendLimited(activity.reasoning_text, event.text || "", 12_000);
      break;
    case "codex.command.output.delta":
      activity.command_output = appendLimited(activity.command_output, event.text || "", 12_000);
      break;
    case "codex.item.started":
      startCommand(activity, event);
      break;
    case "codex.item.completed":
      finishCommand(activity, event);
      projectCompletedItem(activity, event);
      break;
    case "runtime.agent_loop_result":
      activity.agent_loop_result = event.result || null;
      break;
    case "runtime.task_closeout_result":
      activity.closeout_result = event.result || null;
      updateRunActivity(run, { phase: "closeout", current_step: event.result?.summary || "Task closeout completed" });
      upsertMessage(activity, {
        id: `agent:closeout:${activity.turn_id || "final"}`, role: "assistant", actor: "agent", actor_label: "Codex Agent", kind: "closeout",
        content: event.result?.summary || "Git closeout completed.", status: event.result?.status === "completed" ? "completed" : "failed"
      });
      break;
    case "runtime.result":
      applyRuntimeResult(activity, event.result, event.validation);
      break;
    case "runtime.ledger_write.completed":
      applyLedgerWrite(activity, event.result);
      break;
    default:
      if (event.type?.includes("error") || event.type?.endsWith(".failed")) activity.error = event.message || event.error || activity.error;
      break;
  }
  activity.timeline = activity.timeline.slice(-200);
  activity.messages = activity.messages.slice(-200);
  return activity;
}

function applyRuntimeResult(activity, result, validation) {
  if (!result) return;
  activity.round_state = result.round_state || activity.round_state;
  activity.round_state_history = result.round_state_history || activity.round_state_history;
  activity.controller_frame = result.controller_frame || activity.controller_frame;
  activity.execution_gate = result.execution_gate || activity.execution_gate;
  activity.executor_binding = result.executor_binding || activity.executor_binding;
  activity.agent_loop_result = result.agent_loop_result || activity.agent_loop_result;
  activity.artifact_ownership_scan = result.artifact_ownership_scan || activity.artifact_ownership_scan;
  activity.ledger_stage = result.ledger_stage || activity.ledger_stage;
  activity.loop_handoff = result.loop_handoff || activity.loop_handoff;
  activity.case_id = result.case_transition?.case_id || result.case_control_handoff?.case_id || activity.case_id;
  activity.validation_valid = validation?.valid ?? activity.validation_valid;
  activity.current_step = result.summary || activity.current_step;
}

function applyLedgerWrite(activity, result) {
  activity.ledger_write_result = { parsed: result || null };
  if (result?.written) {
    activity.ledger_stage = { ...(activity.ledger_stage || {}), status: "written", writeback_required: false };
    activity.loop_handoff = result.case_transition_result?.case_resolution?.loop_handoff || activity.loop_handoff;
  }
}

function applyRunCommandResult(run, commandType, result) {
  const activity = run.activity || createRunActivity(run);
  run.activity = activity;
  const normalized = normalizeCommandResult(result);
  if (commandType === "gate-result") activity.gate_result = normalized;
  if (commandType === "write-ledger") {
    activity.ledger_write_result = normalized;
    if (normalized.parsed?.written) {
      activity.ledger_stage = { ...(activity.ledger_stage || {}), status: "written", writeback_required: false };
      activity.loop_handoff = normalized.parsed.case_transition_result?.case_resolution?.loop_handoff || activity.loop_handoff;
    }
  }
  activity.updated_at = new Date().toISOString();
  return activity;
}

function updateRunActivity(run, patch = {}) {
  const activity = run.activity || createRunActivity(run);
  run.activity = activity;
  Object.assign(activity, Object.fromEntries(Object.entries(patch).filter(([key]) => key !== "timeline")));
  if (patch.timeline) activity.timeline.push({ ...patch.timeline, at: patch.timeline.at || new Date().toISOString() });
  activity.updated_at = new Date().toISOString();
  return activity;
}

function addRunMessage(activity, message) {
  return upsertMessage(activity, message);
}

function upsertMessage(activity, message) {
  const normalized = normalizeRunMessage(message);
  const index = activity.messages.findIndex((item) => item.id === normalized.id);
  if (index >= 0) {
    normalized.created_at = activity.messages[index].created_at;
    normalized.revision = Number(activity.messages[index].revision || 1) + 1;
    activity.messages[index] = normalized;
  } else activity.messages.push(normalized);
  return normalized;
}

function normalizeRunMessage(message) {
  const now = new Date().toISOString();
  return {
    id: String(message.id || `message:${Date.now()}`), role: message.role || "system", actor: message.actor || "runtime",
    actor_label: message.actor_label || "Runtime", kind: message.kind || "status", content: String(message.content || ""),
    detail: String(message.detail || ""), status: message.status || "completed", created_at: message.created_at || now,
    updated_at: now, revision: Number(message.revision || 1), item_id: String(message.item_id || "")
  };
}

function finalizeRunActivity(run, { status, exitCode, parsedResult, errorMessage }) {
  const activity = run.activity || createRunActivity(run);
  run.activity = activity;
  activity.status = status;
  activity.phase = status;
  activity.phase_label = status === "completed" ? "Completed" : status === "aborted" ? "Aborted" : "Failed";
  activity.current_step = summarizeRuntimeResult(status, parsedResult, errorMessage);
  activity.error = errorMessage || activity.error;
  activity.exit_code = exitCode;
  activity.finished_at = new Date().toISOString();
  if (parsedResult?.runtime_result) applyRuntimeResult(activity, parsedResult.runtime_result, parsedResult.validation);
  if (parsedResult?.closeout_result) activity.closeout_result = parsedResult.closeout_result;
  upsertMessage(activity, {
    id: `runtime:${run.id}:finished`, role: "system", actor: "runtime", actor_label: "Runtime", kind: "status",
    content: activity.current_step, status: status === "completed" ? "completed" : "failed"
  });
  return activity;
}

function emptyTokenUsage() {
  return { schema_version: "runtime-token-usage/v2", summary: counts(), model_context_window: 0, max_context_utilization: 0, threads: [], turns: [], lanes: [], updated_at: "" };
}

function applyTokenUsage(activity, event) {
  const params = event.params || event.raw_rpc?.params || {};
  const usage = params.tokenUsage || {};
  const threadId = String(params.threadId || event.thread_id || "");
  const turnId = String(params.turnId || event.turn_id || "");
  if (!threadId || !turnId || !usage.total) return;
  const projection = activity.token_usage?.schema_version === "runtime-token-usage/v2" ? activity.token_usage : emptyTokenUsage();
  activity.token_usage = projection;
  const total = normalizeCounts(usage.total);
  const last = normalizeCounts(usage.last);
  const window = Math.max(0, Number(usage.modelContextWindow || 0));
  const utilization = window > 0 ? Math.min(last.input_tokens / window, 1) : 0;
  const existingThread = projection.threads.find((item) => item.thread_id === threadId);
  const baseline = projection.turns.find((item) => item.thread_id === threadId && item.turn_id === turnId)?.baseline_total || existingThread?.latest_total || counts();
  replaceBy(projection.threads, "thread_id", { thread_id: threadId, lane: "agent", latest_total: total, model_context_window: window, updated_at: new Date().toISOString() });
  replaceComposite(projection.turns, { thread_id: threadId, turn_id: turnId, lane: "agent", baseline_total: baseline, usage: subtract(total, baseline), last_request: last, model_context_window: window, context_utilization: utilization, updated_at: new Date().toISOString() });
  projection.summary = sum(projection.threads.map((item) => item.latest_total));
  projection.model_context_window = Math.max(0, ...projection.threads.map((item) => item.model_context_window));
  projection.max_context_utilization = Math.max(0, ...projection.turns.map((item) => item.context_utilization));
  projection.lanes = [{ lane: "agent", ...projection.summary }];
  projection.updated_at = new Date().toISOString();
  if (utilization >= 0.8) addUsageWarning(activity, {
    id: `context-pressure-${threadId}-${turnId}`, type: "context_pressure", lane: "agent",
    message: `Latest request uses ${(utilization * 100).toFixed(1)}% of the model context window.`, evidence: `${last.input_tokens}/${window}`
  });
}

function emptyPerformance() { return { turns: [], commands: [], model_time_ms: 0, command_time_ms: 0, slowest_command: null }; }
function markTurn(activity, event, status) {
  const turnId = event.turn_id || event.raw_rpc?.params?.turnId || event.raw_rpc?.params?.turn?.id || activity.turn_id;
  if (!turnId) return;
  const now = Date.now();
  const existing = activity.performance.turns.find((item) => item.turn_id === turnId);
  if (!existing) activity.performance.turns.push({ turn_id: turnId, thread_id: event.thread_id || activity.thread_id, started_at_ms: now, completed_at_ms: status === "completed" ? now : 0, duration_ms: 0 });
  else if (status === "completed") { existing.completed_at_ms = now; existing.duration_ms = Math.max(0, now - existing.started_at_ms); }
  activity.performance.model_time_ms = activity.performance.turns.reduce((sumValue, item) => sumValue + Number(item.duration_ms || 0), 0);
}

function startCommand(activity, event) {
  const item = event.item || event.params?.item || event.raw_rpc?.params?.item || {};
  if (item.type !== "commandExecution") return;
  activity.performance.commands.push({ item_id: item.id || event.item_id || "", lane: "agent", command: item.command || item.cmd || "", cwd: item.cwd || "", started_at_ms: Number(item.startedAtMs || Date.now()), completed_at_ms: 0, duration_ms: 0, status: "running" });
}
function finishCommand(activity, event) {
  const item = event.item || event.params?.item || event.raw_rpc?.params?.item || {};
  const command = activity.performance.commands.find((entry) => entry.item_id === (item.id || event.item_id));
  if (!command) return;
  command.completed_at_ms = Number(item.completedAtMs || Date.now()); command.duration_ms = Math.max(0, command.completed_at_ms - command.started_at_ms); command.status = Number(item.exitCode ?? 0) === 0 ? "completed" : "failed";
  activity.performance.command_time_ms = activity.performance.commands.reduce((sumValue, entry) => sumValue + Number(entry.duration_ms || 0), 0);
  activity.performance.slowest_command = [...activity.performance.commands].sort((left, right) => right.duration_ms - left.duration_ms)[0] || null;
}

function projectCompletedItem(activity, event) {
  const item = event.item || event.params?.item || event.raw_rpc?.params?.item || {};
  if (!item.id) return;
  if (item.type === "reasoning" && item.summary) {
    upsertMessage(activity, {
      id: `agent:item:${item.id}`, role: "assistant", actor: "agent", actor_label: "Codex Agent", kind: "reasoning",
      content: item.summary, status: "completed", item_id: item.id
    });
  }
  if (item.type === "commandExecution") {
    upsertMessage(activity, {
      id: `tool:item:${item.id}`, role: "tool", actor: "tool", actor_label: "Tool", kind: "command",
      content: item.command || item.cmd || "Command completed.", detail: item.aggregatedOutput || "",
      status: Number(item.exitCode ?? 0) === 0 ? "completed" : "failed", item_id: item.id
    });
  }
}

function updateCompaction(activity, event, status) {
  const item = { thread_id: event.thread_id || activity.thread_id, source_turn_id: event.source_turn_id || event.turn_id || "", compaction_turn_id: event.compaction_turn_id || "", context_utilization: Number(event.context_utilization || 0), status, updated_at: new Date().toISOString() };
  const index = activity.context_compactions.findIndex((entry) => entry.source_turn_id === item.source_turn_id);
  if (index >= 0) activity.context_compactions[index] = item; else activity.context_compactions.push(item);
}

function addUsageWarning(activity, warning) {
  const entry = { ...warning, blocking: false, created_at: new Date().toISOString() };
  const index = activity.usage_warnings.findIndex((item) => item.id === entry.id);
  if (index >= 0) activity.usage_warnings[index] = entry; else activity.usage_warnings.push(entry);
  activity.usage_warnings = activity.usage_warnings.slice(-50);
}

function normalizeCommandResult(result) {
  if (!result) return { ok: false, exit_code: null, stdout: "", stderr: "", parsed: null };
  const stdout = String(result.stdout || "");
  let parsed = result.parsed || null;
  if (!parsed && stdout.trim()) { try { parsed = JSON.parse(stdout); } catch {} }
  return { ok: result.ok ?? result.exit_code === 0, exit_code: result.exit_code ?? null, stdout, stderr: String(result.stderr || ""), parsed };
}
function summarizeCommandResult(result) { const normalized = normalizeCommandResult(result); return normalized.parsed ? JSON.stringify(normalized.parsed) : normalized.stderr || normalized.stdout || "No command output."; }
function summarizeRuntimeResult(status, parsedResult, errorMessage) {
  if (status === "aborted") return errorMessage ? `Run aborted: ${errorMessage}` : "Run aborted.";
  if (errorMessage) return `Run failed: ${errorMessage}`;
  if (parsedResult?.closeout_result) return parsedResult.closeout_result.summary || "Task closeout completed.";
  const result = parsedResult?.runtime_result;
  if (!result) return status === "completed" ? "Run completed." : `Run ${status}.`;
  return [`Round result: ${result.round_result || "unknown"}.`, result.summary || "", parsedResult.validation?.valid === true ? "Validation: valid." : "Validation: invalid."].filter(Boolean).join("\n\n");
}

function parseEventLine(line) { try { return JSON.parse(line); } catch { return null; } }
function counts() { return { logical_total_tokens: 0, input_tokens: 0, cached_input_tokens: 0, uncached_input_tokens: 0, output_tokens: 0, reasoning_output_tokens: 0 }; }
function normalizeCounts(value = {}) { const input = Number(value.inputTokens || 0); const cached = Number(value.cachedInputTokens || 0); return { logical_total_tokens: Number(value.totalTokens || input + Number(value.outputTokens || 0)), input_tokens: input, cached_input_tokens: cached, uncached_input_tokens: Math.max(0, input - cached), output_tokens: Number(value.outputTokens || 0), reasoning_output_tokens: Number(value.reasoningOutputTokens || 0) }; }
function subtract(value, baseline) { return Object.fromEntries(Object.keys(counts()).map((key) => [key, Math.max(0, Number(value[key] || 0) - Number(baseline[key] || 0))])); }
function sum(values) { return values.reduce((result, value) => { for (const key of Object.keys(result)) result[key] += Number(value?.[key] || 0); return result; }, counts()); }
function replaceBy(items, key, value) { const index = items.findIndex((item) => item[key] === value[key]); if (index >= 0) items[index] = value; else items.push(value); }
function replaceComposite(items, value) { const index = items.findIndex((item) => item.thread_id === value.thread_id && item.turn_id === value.turn_id); if (index >= 0) items[index] = value; else items.push(value); }
function appendLimited(current, delta, limit) { const next = `${current || ""}${delta || ""}`; return next.length > limit ? next.slice(-limit) : next; }
function truncate(value, limit) { const text = String(value || ""); return text.length > limit ? `${text.slice(0, limit - 1)}…` : text; }

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
