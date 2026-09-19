// Only dependencies of the selected detail belong here. Connection timestamps
// and other projects' activity must not invalidate attachments or conversation.
export function workbenchDetailKey(snapshot, taskId) {
  const task = snapshot?.tasks?.find(item => String(item.id) === String(taskId));
  const project = snapshot?.projects?.find(item => String(item.id) === String(task?.project_id));
  const runtime = Object.fromEntries(Object.entries(snapshot?.runtime || {}).filter(([, value]) => Array.isArray(value))
    .map(([key, items]) => [key, items.filter(item => String(item.task_id || item.source_task_id || item.id) === String(taskId))]));
  const binding = project && { id: project.id, name: project.name, local_project_id: project.local_project_id, members: project.members };
  return JSON.stringify([snapshot?.account_scope, snapshot?.user, task, binding,
    snapshot?.scenes?.[taskId], runtime,
    snapshot?.tasks?.filter(item => String(item.father_id) === String(taskId))]);
}

export function workEventAffectsDetail(event, task) {
  if (!task) return true;
  const ids = event.projectIds || (event.projectId ? [event.projectId] : null);
  return !ids || ids.some(id => String(id) === String(task.project_id));
}
