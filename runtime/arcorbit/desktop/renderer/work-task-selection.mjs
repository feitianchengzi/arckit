export function nextCompletedAcceptanceTaskId(tasks = [], selectedTaskId = "") {
  const completedTasks = tasks.filter((task) => (
    task?.state === "completed"
    && task.tree_matched !== false
  ));
  const selectedIndex = completedTasks.findIndex((task) => String(task.id) === String(selectedTaskId));
  if (selectedIndex < 0 || completedTasks.length < 2) return "";
  const targetIndex = selectedIndex === 0 ? 1 : selectedIndex - 1;
  return String(completedTasks[targetIndex]?.id || "");
}

export function completedAcceptanceSelectionAfterSuccess({
  currentSelectedTaskId = "",
  adjacentTaskId = "",
  acceptanceSelectionIntentEpoch = 0,
  currentSelectionIntentEpoch = 0
} = {}) {
  const currentSelection = String(currentSelectedTaskId || "");
  if (Number(currentSelectionIntentEpoch) !== Number(acceptanceSelectionIntentEpoch)) return currentSelection;
  return String(adjacentTaskId || "");
}
