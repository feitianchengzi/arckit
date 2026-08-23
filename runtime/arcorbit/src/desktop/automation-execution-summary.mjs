const TERMINAL_RUN_STATUSES = new Set(["completed", "failed", "aborted", "interrupted", "cancelled"]);

export function summarizeAutomationExecution(runs = [], { now = Date.now() } = {}) {
  const orderedRuns = [...runs].filter(Boolean).sort((left, right) => timestamp(left.started_at || left.activity?.started_at) - timestamp(right.started_at || right.activity?.started_at));
  const startedAt = firstDate(orderedRuns.map((run) => run.started_at || run.activity?.started_at));
  const active = orderedRuns.some((run) => !TERMINAL_RUN_STATUSES.has(String(run.status || run.activity?.status || "running").toLowerCase()));
  const finishedAt = active ? "" : lastDate(orderedRuns.map((run) => run.finished_at || run.activity?.finished_at));
  const gapRounds = orderedRuns.flatMap((run) => projectedGapRounds(run)).sort(compareGapRounds);
  const endMs = finishedAt ? timestamp(finishedAt) : Number(now);
  const startMs = timestamp(startedAt);
  return {
    started_at: startedAt,
    finished_at: finishedAt,
    duration_ms: startMs > 0 && endMs >= startMs ? endMs - startMs : 0,
    active,
    run_count: orderedRuns.length,
    gap_round_count: gapRounds.length,
    gap_rounds: gapRounds,
    complete_projection: gapRounds.every((round) => round.projection_source === "gap_rounds"),
  };
}

function projectedGapRounds(run) {
  const activity = run.activity || {};
  if (Array.isArray(activity.gap_rounds) && activity.gap_rounds.length) {
    return activity.gap_rounds.map((round) => normalizeRound(run, round, "gap_rounds"));
  }
  if (!activity.round_closeout && !activity.round_selection && !activity.round_index) return [];
  const receipt = activity.round_closeout || {};
  const selectedGap = receipt.selected_gap || activity.controller_frame?.selected_gap || {};
  return [normalizeRound(run, {
    round_index: receipt.round || activity.round_index || 0,
    case_id: receipt.case_id || activity.case_id || "",
    selected_gap_id: selectedGap.id || selectedGapId(activity.round_selection),
    goal: selectedGap.goal || "",
    selection_summary: activity.round_selection?.comparison_summary || activity.round_selection?.basis || "",
    work_summary: activity.agent_loop_result?.summary || "",
    outcome: receipt.accepted_state_delta?.resolved_gap?.outcome || receipt.case_resolution?.reason || "",
    status: receipt.status || activity.status || run.status || "unknown",
    started_at: activity.started_at || run.started_at || "",
    finished_at: receipt.occurred_at || activity.finished_at || run.finished_at || "",
    project_revision: receipt.resulting_state?.project_revision ?? null,
  }, "legacy_latest")];
}

function normalizeRound(run, round, projectionSource) {
  return {
    run_id: String(run.id || ""),
    round_index: Number(round.round_index || 0),
    case_id: String(round.case_id || ""),
    selected_gap_id: String(round.selected_gap_id || ""),
    goal: String(round.goal || ""),
    selection_summary: String(round.selection_summary || ""),
    work_summary: String(round.work_summary || ""),
    outcome: String(round.outcome || ""),
    status: String(round.status || "unknown"),
    started_at: String(round.started_at || ""),
    finished_at: String(round.finished_at || ""),
    project_revision: round.project_revision ?? null,
    projection_source: projectionSource,
  };
}

function selectedGapId(selection = {}) {
  const ref = selection.selected_ref || (selection.considered || []).find((item) => item.disposition === "selected")?.ref || "";
  return String(ref).split(":").at(-1) || "";
}

function compareGapRounds(left, right) {
  return timestamp(left.started_at) - timestamp(right.started_at)
    || String(left.run_id).localeCompare(String(right.run_id))
    || left.round_index - right.round_index;
}

function firstDate(values) {
  return values.filter((value) => timestamp(value) > 0).sort((left, right) => timestamp(left) - timestamp(right))[0] || "";
}

function lastDate(values) {
  return values.filter((value) => timestamp(value) > 0).sort((left, right) => timestamp(right) - timestamp(left))[0] || "";
}

function timestamp(value) {
  const parsed = Date.parse(value || "");
  return Number.isFinite(parsed) ? parsed : 0;
}
