import assert from "node:assert/strict";
import { mkdtemp, readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";
import {
  buildLifecycleSummary,
  createLifecycleTraceStore
} from "../src/observability/lifecycle-trace.mjs";

test("lifecycle summary uses parent-child exclusive time to distinguish orchestration from task work", () => {
  const events = [
    ...span("ROOT", "", "todo.lifecycle", "orchestration", 0, 1_000),
    ...span("PLAN", "ROOT", "controller.plan", "orchestration", 0, 400),
    ...span("AGENT", "ROOT", "agent.execute", "task_execution", 400, 900),
    ...span("TOOL", "AGENT", "codex.tool.commandExecution", "task_execution", 500, 700),
    ...span("REMOTE", "ROOT", "task_source.complete", "external", 900, 1_000)
  ];

  const summary = buildLifecycleSummary(events, {
    generatedAt: at(1_000),
    sourceFile: "/trace/events.jsonl"
  });

  assert.equal(summary.total_ms, 1_000);
  assert.equal(cost(summary, "orchestration"), 400);
  assert.equal(cost(summary, "task_execution"), 500);
  assert.equal(cost(summary, "external"), 100);
  assert.equal(summary.diagnosis.tendency, "task_specific");
  assert.equal(summary.diagnosis.primary_hotspot.name, "controller.plan");
});

test("lifecycle trace store persists raw JSONL and a resumable summary", async () => {
  const root = await mkdtemp(join(tmpdir(), "arckit-lifecycle-"));
  let clock = 0;
  const store = createLifecycleTraceStore({
    rootDir: root,
    now: () => at(clock)
  });
  try {
    const trace = await store.startTrace({ task_id: "TASK-1", project_id: "PROJECT-1" });
    clock = 25;
    const child = store.startSpan(trace, {
      name: "task_source.claim",
      category: "task_source",
      cost_center: "external",
      attributes: { diagnostic: "access_token=must-not-persist" }
    });
    clock = 75;
    store.endSpan(trace, child, { status: "ok" });
    clock = 100;
    const summary = await store.finishTrace(trace, { status: "ok" });
    const lines = (await readFile(trace.events_file, "utf8")).trim().split("\n");
    const persisted = JSON.parse(await readFile(trace.summary_file, "utf8"));

    assert.equal(lines.length, 4);
    assert.equal(lines.join("\n").includes("must-not-persist"), false);
    assert.equal(summary.status, "completed");
    assert.equal(persisted.trace_id, trace.trace_id);
    assert.equal(persisted.open_span_count, 0);
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

function span(id, parentId, name, costCenter, start, end) {
  const base = {
    schema_version: "arckit-lifecycle-event/v1",
    trace_id: "TRACE-1",
    span_id: id,
    parent_span_id: parentId,
    name,
    category: name.split(".")[0],
    cost_center: costCenter,
    scope: "test"
  };
  return [
    { ...base, type: "runtime.lifecycle.span.started", at: at(start), started_at: at(start), attributes: {} },
    {
      ...base,
      type: "runtime.lifecycle.span.completed",
      at: at(end),
      started_at: at(start),
      completed_at: at(end),
      duration_ms: end - start,
      status: "ok",
      attributes: {}
    }
  ];
}

function at(milliseconds) {
  return new Date(Date.parse("2026-08-07T00:00:00.000Z") + milliseconds).toISOString();
}

function cost(summary, name) {
  return summary.cost_centers.find((item) => item.name === name)?.exclusive_ms || 0;
}
