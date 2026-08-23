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
