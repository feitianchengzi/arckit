import { activityOwnerMatchesRun, applyRunActivityPatch, createSingleFlightActivitySync } from './run-activity-sync.mjs';

// Activity packets already carry revisioned deltas. They do not invalidate the
// project list, attachments, or every other task's detail.
export function createWorkbenchActivitySync({ getDetail, readActivity, onUpdate, onError, shouldPause, schedule }) {
  function selectedRun(detail) {
    const run = detail?.runs?.[0];
    return run ? { ...run, project_id: detail.local_project?.id, task_id: detail.task.id, activity: detail.activity } : null;
  }
  function matches(event, detail) {
    const run = selectedRun(detail);
    return Boolean(run && String(event?.runId || '') === String(run.id) && activityOwnerMatchesRun(event.owner, run));
  }
  return createSingleFlightActivitySync({
    schedule, shouldPause, onError,
    isEligible: event => matches(event, getDetail()),
    consume: async event => {
      const detail = getDetail();
      if (!matches(event, detail)) return;
      let run = applyRunActivityPatch(selectedRun(detail), event.patch);
      if (!run) {
        const snapshot = await readActivity(event.runId);
        // A task switch or full detail refresh supersedes this request.
        if (getDetail() !== detail || !matches(event, detail)) return;
        if (String(snapshot?.run?.id || '') !== String(event.runId)
          || !activityOwnerMatchesRun(snapshot.owner, selectedRun(detail))) return;
        run = snapshot.run;
      }
      const previous = detail.activity;
      const detailChanged = ['agent_loop_result', 'ledger_write_result', 'closeout_result']
        .some(key => previous?.[key] !== run.activity?.[key]);
      detail.activity = run.activity;
      detail.result = run.activity?.agent_loop_result || null;
      onUpdate(detail, { detailChanged });
    }
  });
}
