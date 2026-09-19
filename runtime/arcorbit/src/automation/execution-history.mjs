// History is a projection of durable execution identities, never a new task.
export function buildExecutionHistory(automation = {}) {
  const active = Object.values(automation.active_executions || {});
  if (!active.length && automation.active_task) active.push(automation.active_task);
  const stopped = automation.stopped_executions || [];
  const records = [...active, ...stopped].filter(item => !item.feedback_id).map(item => ({
    ...item, history_id: item.execution_id || item.id || item.run_id,
    status: item.phase, title: item.task_title, active: active.includes(item)
  }));
  for (const feedback of automation.acceptance_feedback_items || []) {
    const execution = active.find(item => item.feedback_id === feedback.feedback_id)
      || stopped.find(item => item.feedback_id === feedback.feedback_id) || {};
    records.push({
      ...execution, history_id: feedback.feedback_id, feedback_id: feedback.feedback_id,
      execution_kind: 'acceptance_feedback', task_id: feedback.source_task_id,
      project_id: feedback.source_project_id, local_project_id: feedback.local_project_id,
      title: feedback.original_feedback, task_title: feedback.source_task_title,
      status: feedback.status, progress: feedback.progress,
      archived_at: feedback.archived_at || '', updated_at: feedback.updated_at,
      run_id: execution.run_id || feedback.current_run_id || '',
      session_id: execution.session_id || feedback.session_id,
      thread_id: execution.thread_id || feedback.thread_id,
      active: active.includes(execution)
    });
  }
  const seen = new Set();
  return records.filter(item => item.history_id && !seen.has(item.history_id) && seen.add(item.history_id))
    .sort((a, b) => String(b.updated_at || b.stopped_at || b.started_at || '').localeCompare(String(a.updated_at || a.stopped_at || a.started_at || '')));
}

export function workbenchExecutionTarget(snapshot, { taskId = '', feedbackId = '', runId = '', historyId = '' } = {}) {
  const history = snapshot.execution_history || [];
  if (historyId) return history.find(item => item.history_id === historyId) || null;
  if (feedbackId) return history.find(item => item.feedback_id === feedbackId) || null;
  // Opening an old Run must not silently target another feedback on the same todo.
  if (runId) return history.find(item => item.run_id === runId && (!taskId || String(item.task_id) === String(taskId))) || null;
  if (taskId) return history.find(item => item.active && String(item.task_id) === String(taskId)) || null;
  return history.find(item => item.execution_id === snapshot.selected_execution_id) || null;
}
