import assert from "node:assert/strict";
import test from "node:test";
import { applyRunEvent, createRunActivity } from "../src/projection/run-event-projector.mjs";

test("token usage keeps the latest cumulative snapshot per thread and derives turn deltas", () => {
  const run = runtimeRun();
  run.activity = createRunActivity(run);
  applyRunEvent(run, wrapped(roundEvent(1)));
  applyRunEvent(run, wrapped(usageEvent({
    threadId: "THREAD-C",
    turnId: "TURN-1",
    total: counts(100, 90, 60, 10, 2),
    last: counts(100, 90, 60, 10, 2),
    controller_role: "controller_planner"
  })));
  applyRunEvent(run, wrapped(usageEvent({
    threadId: "THREAD-C",
    turnId: "TURN-1",
    total: counts(150, 135, 100, 15, 3),
    last: counts(50, 45, 40, 5, 1),
    controller_role: "controller_planner"
  })));
  applyRunEvent(run, wrapped(usageEvent({
    threadId: "THREAD-C",
    turnId: "TURN-2",
    total: counts(230, 207, 170, 23, 5),
    last: counts(80, 72, 70, 8, 2),
    controller_role: "controller_reviewer"
  })));
  applyRunEvent(run, wrapped(usageEvent({
    threadId: "THREAD-W",
    turnId: "TURN-W",
    total: counts(50, 45, 20, 5, 1),
    last: counts(50, 45, 20, 5, 1),
    task_id: "TASK-01-builder",
    worker_type: "implementation"
  })));

  assert.equal(run.activity.token_usage.summary.logical_total_tokens, 280);
  assert.equal(run.activity.token_usage.summary.cached_input_tokens, 190);
  assert.equal(run.activity.token_usage.summary.uncached_input_tokens, 62);
  assert.equal(run.activity.token_usage.turns.find((item) => item.turn_id === "TURN-1").usage.logical_total_tokens, 150);
  assert.equal(run.activity.token_usage.turns.find((item) => item.turn_id === "TURN-2").usage.logical_total_tokens, 80);
  assert.equal(run.activity.token_usage.lanes.find((item) => item.lane === "controller").logical_total_tokens, 230);
  assert.equal(run.activity.token_usage.lanes.find((item) => item.lane === "builder").logical_total_tokens, 50);
});

test("context pressure and duplicate commands create non-blocking warnings", () => {
  const run = runtimeRun();
  run.activity = createRunActivity(run);
  applyRunEvent(run, wrapped(usageEvent({
    threadId: "THREAD-C",
    turnId: "TURN-1",
    total: counts(95, 90, 10, 5, 1),
    last: counts(95, 90, 10, 5, 1),
    contextWindow: 100,
    controller_role: "controller_planner"
  })));
  applyRunEvent(run, wrapped({
    type: "codex.command.duplicate.suppressed",
    item_id: "CMD-2",
    active_item_id: "CMD-1",
    cwd: "/workspace/project",
    command: "npm test",
    warning: "Equivalent command already running."
  }));

  assert.deepEqual(run.activity.usage_warnings.map((item) => item.type), ["context_pressure", "duplicate_command"]);
  assert.equal(run.activity.usage_warnings.every((item) => item.blocking === false), true);
});

test("command timings are projected from item lifecycle events", () => {
  const run = runtimeRun();
  run.activity = createRunActivity(run);
  applyRunEvent(run, wrapped({
    type: "codex.item.started",
    task_id: "TASK-01-builder",
    worker_type: "implementation",
    params: { item: { id: "CMD-1", type: "commandExecution", command: "npm test", cwd: "/workspace", startedAtMs: 1_000 } }
  }));
  applyRunEvent(run, wrapped({
    type: "codex.item.completed",
    task_id: "TASK-01-builder",
    worker_type: "implementation",
    params: { item: { id: "CMD-1", type: "commandExecution", command: "npm test", cwd: "/workspace", completedAtMs: 4_000 } }
  }));

  assert.equal(run.activity.performance.command_time_ms, 3_000);
  assert.equal(run.activity.performance.commands[0].lane, "builder");
});

test("Worker context reuse projects workstreams and warns on authorized scope drift without blocking", () => {
  const run = runtimeRun();
  run.activity = createRunActivity(run);
  const base = {
    type: "runtime.agent_task.started",
    worker_type: "implementation",
    workstream_id: "runtime-core",
    worker_thread_key: "worker:CASE-1:implementation:runtime-core",
    context_digest_version: "arckit-worker-context-digest/v1",
    context_ref_count: 4,
    prior_report_count: 1,
    role: "implementer",
    objective: "Implement the bounded Runtime change.",
    task: {
      loop_frame_excerpt: { case_id: "CASE-1" },
      inputs: { context_digest: { case_updated_at: "REV-1" } }
    }
  };
  applyRunEvent(run, wrapped({ ...base, task_id: "TASK-01", context_scope_signature: "scope-a" }));
  applyRunEvent(run, wrapped({
    ...base,
    task_id: "TASK-02",
    context_scope_signature: "scope-b",
    task: { ...base.task, inputs: { context_digest: { case_updated_at: "REV-2" } } }
  }));

  assert.equal(run.activity.worker_contexts.length, 1);
  assert.equal(run.activity.worker_contexts[0].task_count, 2);
  assert.equal(run.activity.worker_contexts[0].workstream_id, "runtime-core");
  assert.deepEqual(run.activity.worker_contexts[0].scope_signatures, ["scope-a", "scope-b"]);
  assert.equal(run.activity.usage_warnings.at(-1).type, "worker_context_scope_changed");
  assert.equal(run.activity.usage_warnings.at(-1).blocking, false);
});

test("Runtime, Controller, Worker, and tool output share one bounded message projection", () => {
  const run = runtimeRun();
  run.activity = createRunActivity(run);
  applyRunEvent(run, wrapped(roundEvent(1)));
  applyRunEvent(run, wrapped({
    type: "runtime.controller_plan.completed",
    status: "planned",
    controller_plan: { summary: "Select the message projection gap." }
  }));
  applyRunEvent(run, wrapped({
    type: "codex.reasoning.delta",
    controller_role: "controller_planner",
    thread_id: "THREAD-C",
    turn_id: "TURN-C",
    item_id: "REASON-1",
    text: "Inspect "
  }));
  applyRunEvent(run, wrapped({
    type: "codex.reasoning.delta",
    controller_role: "controller_planner",
    thread_id: "THREAD-C",
    turn_id: "TURN-C",
    item_id: "REASON-1",
    text: "the current projection."
  }));
  applyRunEvent(run, wrapped({
    type: "codex.item.completed",
    controller_role: "controller_planner",
    thread_id: "THREAD-C",
    turn_id: "TURN-C",
    params: { item: { id: "REASON-1", type: "reasoning", summary: "Projection inspected." } }
  }));
  applyRunEvent(run, wrapped({
    type: "runtime.worker_report.completed",
    task_id: "TASK-W",
    worker_type: "implementation",
    role: "Runtime implementer",
    status: "completed",
    report: { status: "completed", summary: "Message projection implemented.", recommendation: "Run tests." }
  }));
  applyRunEvent(run, wrapped({
    type: "codex.item.completed",
    task_id: "TASK-W",
    worker_type: "implementation",
    thread_id: "THREAD-W",
    turn_id: "TURN-W",
    params: { item: { id: "CMD-1", type: "commandExecution", command: "npm test", cwd: "/workspace", exitCode: 0 } }
  }));

  assert.equal("raw_events" in run.activity, false);
  assert.equal(run.activity.messages.filter((message) => message.item_id === "REASON-1").length, 1);
  assert.equal(run.activity.messages.find((message) => message.item_id === "REASON-1").content, "Projection inspected.");
  assert.equal(run.activity.messages.some((message) => message.actor === "runtime"), true);
  assert.equal(run.activity.messages.some((message) => message.actor === "controller"), true);
  assert.equal(run.activity.messages.some((message) => message.actor === "agent" && message.task_id === "TASK-W"), true);
  assert.equal(run.activity.messages.some((message) => message.actor === "tool" && message.item_id === "CMD-1"), true);
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

function roundEvent(round_index) {
  return { type: "runtime.session_round.started", round_index };
}

function usageEvent({ threadId, turnId, total, last, contextWindow = 1000, ...metadata }) {
  return {
    type: "codex.thread.tokenUsage.updated",
    params: {
      threadId,
      turnId,
      tokenUsage: { total, last, modelContextWindow: contextWindow }
    },
    ...metadata
  };
}

function counts(totalTokens, inputTokens, cachedInputTokens, outputTokens, reasoningOutputTokens) {
  return { totalTokens, inputTokens, cachedInputTokens, outputTokens, reasoningOutputTokens };
}

function wrapped(event) {
  return { line: JSON.stringify({ event }), parsed: { event } };
}
