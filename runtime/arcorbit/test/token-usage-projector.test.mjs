import assert from "node:assert/strict";
import test from "node:test";
import { applyRunEvent, createRunActivity } from "../src/projection/run-event-projector.mjs";

test("one persistent thread keeps cumulative usage while each turn uses its own delta", () => {
  const run = runtimeRun();
  run.activity = createRunActivity(run);
  applyRunEvent(run, wrapped(usageEvent({
    turnId: "TURN-1",
    total: counts(100, 90, 60, 10, 2),
    last: counts(100, 90, 60, 10, 2)
  })));
  applyRunEvent(run, wrapped(usageEvent({
    turnId: "TURN-1",
    total: counts(150, 135, 100, 15, 3),
    last: counts(50, 45, 40, 5, 1)
  })));
  applyRunEvent(run, wrapped(usageEvent({
    turnId: "TURN-2",
    total: counts(230, 207, 170, 23, 5),
    last: counts(80, 72, 70, 8, 2)
  })));

  assert.equal(run.activity.token_usage.threads.length, 1);
  assert.equal(run.activity.token_usage.summary.logical_total_tokens, 230);
  assert.equal(run.activity.token_usage.summary.cached_input_tokens, 170);
  assert.equal(run.activity.token_usage.summary.uncached_input_tokens, 37);
  assert.equal(run.activity.token_usage.turns.find((item) => item.turn_id === "TURN-1").usage.logical_total_tokens, 150);
  assert.equal(run.activity.token_usage.turns.find((item) => item.turn_id === "TURN-2").usage.logical_total_tokens, 80);
  assert.deepEqual(run.activity.token_usage.lanes.map((item) => item.lane), ["agent"]);
});

test("80 percent context pressure and duplicate commands remain visible non-blocking signals", () => {
  const run = runtimeRun();
  run.activity = createRunActivity(run);
  applyRunEvent(run, wrapped(usageEvent({
    turnId: "TURN-1",
    total: counts(95, 90, 10, 5, 1),
    last: counts(95, 90, 10, 5, 1),
    contextWindow: 100
  })));
  applyRunEvent(run, wrapped({
    type: "codex.command.duplicate.suppressed",
    item_id: "CMD-2",
    cwd: "/workspace/project",
    command: "npm test",
    warning: "Equivalent command already running."
  }));

  assert.deepEqual(run.activity.usage_warnings.map((item) => item.type), ["context_pressure", "duplicate_command"]);
  assert.equal(run.activity.usage_warnings.every((item) => item.blocking === false), true);
});

test("Agent command timings are projected from Codex item lifecycle events", () => {
  const run = runtimeRun();
  run.activity = createRunActivity(run);
  applyRunEvent(run, wrapped({
    type: "codex.item.started",
    params: { item: { id: "CMD-1", type: "commandExecution", command: "npm test", cwd: "/workspace", startedAtMs: 1_000 } }
  }));
  const startedMessage = run.activity.messages.find((message) => message.item_id === "CMD-1");
  assert.equal(startedMessage.status, "streaming");
  assert.equal(startedMessage.content, "npm test");
  applyRunEvent(run, wrapped({
    type: "codex.item.completed",
    params: { item: { id: "CMD-1", type: "commandExecution", command: "npm test", cwd: "/workspace", completedAtMs: 4_000 } }
  }));

  assert.equal(run.activity.performance.command_time_ms, 3_000);
  assert.equal(run.activity.performance.commands[0].lane, "agent");
  const completedMessages = run.activity.messages.filter((message) => message.item_id === "CMD-1");
  assert.equal(completedMessages.length, 1);
  assert.equal(completedMessages[0].status, "completed");
  assert.equal(completedMessages[0].revision, 2);
});

test("one coherent Agent loop projects bounded Agent and tool messages", () => {
  const run = runtimeRun();
  run.activity = createRunActivity(run);
  applyRunEvent(run, wrapped({ type: "runtime.session_round.started", round_index: 1 }));
  applyRunEvent(run, wrapped({ type: "runtime.agent_loop.started", round_index: 1 }));
  applyRunEvent(run, wrapped({
    type: "codex.item.completed",
    thread_id: "THREAD-1",
    turn_id: "TURN-1",
    params: { item: { id: "REASON-1", type: "reasoning", summary: "Inspected the current state." } }
  }));
  applyRunEvent(run, wrapped({
    type: "codex.item.completed",
    thread_id: "THREAD-1",
    turn_id: "TURN-1",
    params: { item: { id: "CMD-1", type: "commandExecution", command: "npm test", cwd: "/workspace", exitCode: 0 } }
  }));
  applyRunEvent(run, wrapped({
    type: "runtime.agent_loop.completed",
    round_index: 1,
    action: "case_transition",
    summary: "Advanced and verified one Case gap.",
    case_id: "CASE-1"
  }));

  assert.equal(run.activity.case_id, "CASE-1");
  assert.equal(run.activity.agent_loop_result.action, "case_transition");
  assert.equal(run.activity.messages.some((message) => message.actor === "agent" && message.item_id === "REASON-1"), true);
  assert.equal(run.activity.messages.some((message) => message.actor === "tool" && message.item_id === "CMD-1"), true);
  assert.equal(run.activity.messages.at(-1).content, "Advanced and verified one Case gap.");
});

test("reasoning projection omits empty summaries and completes non-empty Codex text in place", () => {
  const run = runtimeRun();
  run.activity = createRunActivity(run);
  applyRunEvent(run, wrapped({
    type: "codex.item.completed",
    turn_id: "TURN-1",
    params: { item: { id: "REASON-EMPTY", type: "reasoning", summary: [] } }
  }));
  assert.equal(run.activity.messages.some((message) => message.item_id === "REASON-EMPTY"), false);

  applyRunEvent(run, wrapped({
    type: "codex.reasoning.delta",
    turn_id: "TURN-1",
    item_id: "REASON-1",
    text: "Checking the message projection."
  }));
  const streaming = run.activity.messages.find((message) => message.item_id === "REASON-1");
  assert.equal(streaming.kind, "reasoning");
  assert.equal(streaming.status, "streaming");
  applyRunEvent(run, wrapped({
    type: "codex.item.completed",
    turn_id: "TURN-1",
    params: { item: { id: "REASON-1", type: "reasoning", summary: [{ text: "Checked the projector." }] } }
  }));
  const completed = run.activity.messages.find((message) => message.item_id === "REASON-1");
  assert.equal(completed.content, "Checked the projector.");
  assert.equal(completed.status, "completed");
  assert.equal(run.activity.messages.filter((message) => message.item_id === "REASON-1").length, 1);
});

test("schema-bound Agent output is preserved as structured data beside the formal summary", () => {
  const run = runtimeRun();
  run.activity = createRunActivity(run);
  applyRunEvent(run, wrapped({ type: "codex.turn.started", thread_id: "THREAD-1", turn_id: "TURN-1" }));
  const result = {
    schema_version: "arckit-agent-loop-result/v1",
    action: "case_transition",
    summary: "Advanced one Case gap.",
    case_control: null,
    case_transition: { case_id: "CASE-1", selected_gap: { id: "GAP-1" } },
    changed_files: [],
    artifact_impacts: [],
    risks: [],
    unknowns: [],
    handoff: {}
  };
  const raw = JSON.stringify(result);
  applyRunEvent(run, wrapped({ type: "codex.agent_message.delta", turn_id: "TURN-1", item_id: "MESSAGE-1", text: raw }));
  applyRunEvent(run, wrapped({
    type: "codex.item.completed",
    turn_id: "TURN-1",
    params: { item: { id: "MESSAGE-1", type: "agentMessage", text: raw } }
  }));
  applyRunEvent(run, wrapped({ type: "runtime.agent_loop_result", turn_id: "TURN-1", result }));
  applyRunEvent(run, wrapped({
    type: "runtime.agent_loop.completed",
    action: result.action,
    summary: result.summary,
    case_id: "CASE-1"
  }));

  const structured = run.activity.messages.find((message) => message.kind === "structured");
  assert.equal(structured.content, "");
  assert.equal(structured.structured_data.schema_version, "arckit-agent-loop-result/v1");
  assert.deepEqual(structured.structured_data.value, result);
  assert.equal(structured.structured_data.raw, raw);
  assert.equal(run.activity.messages.some((message) => message.kind === "message" && message.content === raw), false);
  assert.equal(run.activity.messages.some((message) => message.kind === "result" && message.content === result.summary), true);
});

test("round candidate catalog and Agent comparison trace stay visible without Runtime reprioritizing them", () => {
  const run = runtimeRun();
  run.activity = createRunActivity(run);
  applyRunEvent(run, wrapped({
    type: "runtime.round_candidates",
    round_index: 2,
    snapshot_token: "SNAPSHOT-ABCDEF",
    candidate_catalog: {
      persisted_candidates: [{ ref: "case-gap:CASE-1:GAP-A" }, { ref: "case-gap:CASE-1:GAP-B" }],
      persisted_obligations: []
    }
  }));
  applyRunEvent(run, wrapped({
    type: "runtime.round_selection",
    round_index: 2,
    gap_selection: {
      fresh_discovery_summary: "No fresh candidate outranked the persisted work.",
      considered: [
        { ref: "case-gap:CASE-1:GAP-A", disposition: "selected", reason: "Highest regression risk." },
        { ref: "case-gap:CASE-1:GAP-B", disposition: "deferred", reason: "Still considered; lower immediate risk." }
      ]
    }
  }));

  const candidates = run.activity.messages.find((message) => message.id === "runtime:round-candidates:2");
  const selection = run.activity.messages.find((message) => message.id === "runtime:round-selection:2");
  assert.match(candidates.content, /GAP-A/);
  assert.match(candidates.content, /GAP-B/);
  assert.match(selection.content, /GAP-A selected/);
  assert.match(selection.content, /GAP-B deferred/);
  assert.match(selection.content, /lower immediate risk/);
  assert.equal(run.activity.round_selection.considered.length, 2);
});

test("Run Activity retains a structured per-gap overview outside the capped transcript", () => {
  const run = runtimeRun();
  run.activity = createRunActivity(run);
  applyRunEvent(run, wrapped({ type: "runtime.session_round.started", round_index: 2 }));
  applyRunEvent(run, wrapped({
    type: "runtime.round_selection",
    round_index: 2,
    case_id: "CASE-1",
    selected_gap: { id: "GAP-A", goal: "Unify the conversation surface" },
    gap_selection: { selected_ref: "case-gap:CASE-1:GAP-A", comparison_summary: "Highest user impact" }
  }));
  applyRunEvent(run, wrapped({ type: "runtime.agent_loop.completed", round_index: 2, case_id: "CASE-1", summary: "Implemented shared rendering and tests." }));
  applyRunEvent(run, wrapped({
    type: "runtime.round_closeout",
    round_index: 2,
    receipt: {
      status: "accepted", case_id: "CASE-1", selected_gap: { id: "GAP-A", goal: "Unify the conversation surface" }, occurred_at: "2026-08-23T08:15:00.000Z",
      accepted_state_delta: { resolved_gap: { outcome: "Shared surface verified." } }, resulting_state: { project_revision: 9 }
    }
  }));

  assert.equal(run.activity.gap_rounds.length, 1);
  assert.deepEqual(run.activity.gap_rounds[0], {
    round_index: 2,
    case_id: "CASE-1",
    selected_gap_id: "GAP-A",
    goal: "Unify the conversation surface",
    selection_summary: "Highest user impact",
    work_summary: "Implemented shared rendering and tests.",
    outcome: "Shared surface verified.",
    status: "accepted",
    started_at: run.activity.gap_rounds[0].started_at,
    finished_at: "2026-08-23T08:15:00.000Z",
    project_revision: 9
  });
});

test("non-command Codex tools update one stable transcript item from started to completed", () => {
  const run = runtimeRun();
  run.activity = createRunActivity(run);
  applyRunEvent(run, wrapped({
    type: "codex.item.started",
    params: { item: { id: "EDIT-1", type: "fileChange", changes: [{ path: "src/view.js" }] } }
  }));
  applyRunEvent(run, wrapped({
    type: "codex.item.completed",
    params: { item: { id: "EDIT-1", type: "fileChange", changes: [{ path: "src/view.js" }] } }
  }));

  const messages = run.activity.messages.filter((message) => message.item_id === "EDIT-1");
  assert.equal(messages.length, 1);
  assert.equal(messages[0].kind, "file_change");
  assert.equal(messages[0].content, "src/view.js");
  assert.equal(messages[0].status, "completed");
  assert.equal(messages[0].revision, 2);
});

test("context compaction is recorded against the source turn on the same thread", () => {
  const run = runtimeRun();
  run.activity = createRunActivity(run);
  applyRunEvent(run, wrapped({
    type: "runtime.context_compaction.started",
    thread_id: "THREAD-1",
    turn_id: "TURN-2",
    context_utilization: 0.84
  }));
  applyRunEvent(run, wrapped({
    type: "runtime.context_compaction.completed",
    thread_id: "THREAD-1",
    source_turn_id: "TURN-2",
    compaction_turn_id: "TURN-COMPACT",
    context_utilization: 0.84
  }));

  assert.equal(run.activity.context_compactions.length, 1);
  assert.equal(run.activity.context_compactions[0].status, "completed");
  assert.equal(run.activity.context_compactions[0].compaction_turn_id, "TURN-COMPACT");
});

test("Agent repair request stays visible as an in-run recovery instead of a terminal failure", () => {
  const run = runtimeRun();
  run.activity = createRunActivity(run);
  applyRunEvent(run, wrapped({
    type: "runtime.agent_repair.requested",
    round_index: 1,
    attempt: 1,
    max_attempts: 2,
    case_id: "CASE-1",
    selected_gap_id: "GAP-1",
    rejection: {
      kind: "ledger_gate_rejected",
      reason: "not_relevant cannot carry evidence or gaps",
      issues: [{ path: "case_transition.invariant_assessment.judgments[2]", message: "not_relevant cannot carry evidence or gaps" }]
    }
  }));

  assert.equal(run.activity.phase, "agent-repair");
  assert.equal(run.activity.agent_repairs.length, 1);
  assert.equal(run.activity.agent_repairs[0].attempt, 1);
  assert.match(run.activity.current_step, /Agent repair 1\/2/);
  const message = run.activity.messages.find((item) => item.id === "runtime:agent-repair:1:1");
  assert.equal(message.status, "active");
  assert.equal(message.detail, "not_relevant cannot carry evidence or gaps");
});

test("accepted ledger receipts remain append-only when a later write fails", () => {
  const run = runtimeRun();
  run.activity = createRunActivity(run);
  const accepted = {
    written: true,
    post_commit_snapshot_token: "TOKEN-1",
    case_control_result: { case_id: "CASE-20260824-001" }
  };
  applyRunEvent(run, wrapped({
    type: "runtime.ledger_write.completed",
    round_index: 1,
    result: accepted
  }));
  applyRunEvent(run, wrapped({
    type: "runtime.ledger_write.completed",
    round_index: 2,
    result: { written: false, rejection: { kind: "claim_invalid", reason: "invalid claim" } }
  }));

  assert.equal(run.activity.ledger_write_result.parsed.written, false);
  assert.equal(run.activity.ledger_write_receipts.length, 1);
  assert.equal(run.activity.ledger_write_receipts[0].parsed.case_control_result.case_id, "CASE-20260824-001");
  applyRunEvent(run, wrapped({ type: "runtime.ledger_write.completed", round_index: 1, result: accepted }));
  assert.equal(run.activity.ledger_write_receipts.length, 1);
});

function runtimeRun() {
  return {
    id: "RUN-1",
    adapter: "codex-app-server",
    entry_capability: "runtime",
    status: "running",
    started_at: "2026-08-07T00:00:00.000Z"
  };
}

function usageEvent({ turnId, total, last, contextWindow = 1000 }) {
  return {
    type: "codex.thread.tokenUsage.updated",
    params: {
      threadId: "THREAD-1",
      turnId,
      tokenUsage: { total, last, modelContextWindow: contextWindow }
    }
  };
}

function counts(totalTokens, inputTokens, cachedInputTokens, outputTokens, reasoningOutputTokens) {
  return { totalTokens, inputTokens, cachedInputTokens, outputTokens, reasoningOutputTokens };
}

function wrapped(event) {
  return { line: JSON.stringify({ event }), parsed: { event } };
}
