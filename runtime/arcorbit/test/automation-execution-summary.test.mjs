import assert from "node:assert/strict";
import test from "node:test";
import { summarizeAutomationExecution } from "../src/desktop/automation-execution-summary.mjs";

test("Automation execution overview aggregates complete time and every structured gap across Runs", () => {
  const summary = summarizeAutomationExecution([
    {
      id: "RUN-1", status: "completed", started_at: "2026-08-23T08:00:00.000Z", finished_at: "2026-08-23T08:10:00.000Z",
      activity: { gap_rounds: [{ round_index: 1, selected_gap_id: "GAP-A", goal: "Define", work_summary: "Updated spec", outcome: "Accepted", status: "accepted", started_at: "2026-08-23T08:00:00.000Z", finished_at: "2026-08-23T08:05:00.000Z" }] }
    },
    {
      id: "RUN-2", status: "completed", started_at: "2026-08-23T08:12:00.000Z", finished_at: "2026-08-23T08:30:00.000Z",
      activity: { gap_rounds: [{ round_index: 2, selected_gap_id: "GAP-B", goal: "Implement", work_summary: "Changed renderer", outcome: "Verified", status: "accepted", started_at: "2026-08-23T08:12:00.000Z", finished_at: "2026-08-23T08:30:00.000Z" }] }
    }
  ]);

  assert.equal(summary.duration_ms, 30 * 60 * 1000);
  assert.equal(summary.run_count, 2);
  assert.equal(summary.gap_round_count, 2);
  assert.deepEqual(summary.gap_rounds.map((round) => round.selected_gap_id), ["GAP-A", "GAP-B"]);
  assert.equal(summary.complete_projection, true);
});

test("Automation execution overview marks active time and recovers one legacy latest round", () => {
  const summary = summarizeAutomationExecution([{
    id: "RUN-LEGACY", status: "running", started_at: "2026-08-23T08:00:00.000Z",
    activity: {
      round_index: 3,
      round_selection: { selected_ref: "case-gap:CASE-1:GAP-LEGACY", comparison_summary: "Selected legacy work" },
      agent_loop_result: { summary: "Legacy summary" }
    }
  }], { now: Date.parse("2026-08-23T08:02:00.000Z") });

  assert.equal(summary.active, true);
  assert.equal(summary.duration_ms, 120_000);
  assert.equal(summary.gap_round_count, 1);
  assert.equal(summary.gap_rounds[0].selected_gap_id, "GAP-LEGACY");
  assert.equal(summary.complete_projection, false);
});

test('overview distinguishes stopped execution, repeated Loops on one Gap, and Agent progress evidence', async () => {
  const { applyRunEvent, finalizeRunActivity } = await import('../src/projection/run-event-projector.mjs');
  const run = { id: 'RUN-STOP', status: 'aborted' };
  const progress = { advanced: false, reason: 'The original acceptance deficit remains.', evidence: ['test:still-failing'], remaining: ['Undo the final point'] };
  for (const round_index of [1, 2]) {
    applyRunEvent(run, { parsed: { event: { type: 'runtime.round_selection', round_index, case_id: 'CASE-1', selected_gap: { id: 'GAP-1', goal: 'Find the cause' } } } });
    applyRunEvent(run, { parsed: { event: { type: 'runtime.execution_progress', round_index,
      progress: { recent_rounds: [{ task_progress: progress, continuation: { continue: false, reason: 'no_progress_limit' } }] } } } });
  }
  finalizeRunActivity(run, { status: 'aborted', parsedResult: { execution_control: { stop_requested: true }, stop_reason: 'stopped' } });
  const summary = summarizeAutomationExecution([run]);
  assert.equal(summary.outcome, 'stopped');
  assert.equal(summary.distinct_gap_count, 1);
  assert.equal(summary.gap_round_count, 2);
  assert.deepEqual(summary.gap_rounds[1].task_progress, progress);
});
