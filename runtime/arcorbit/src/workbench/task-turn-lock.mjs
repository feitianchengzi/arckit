// Process ownership, shared by interactive task turns and Runtime launches.
// Durable recovery comes from the existing run records and thread-binding files.
const owners = new Map();
export function acquireTaskTurn(projectId, taskId, owner) {
  if (!taskId) return () => {};
  const key = JSON.stringify([String(projectId), String(taskId)]);
  if (owners.has(key)) throw new Error('这件事情已有 Agent 正在工作，请等待当前轮结束或先暂停。');
  owners.set(key, owner);
  return () => { if (owners.get(key) === owner) owners.delete(key); };
}
export function taskTurnOwner(projectId, taskId) { return owners.get(JSON.stringify([String(projectId), String(taskId)])) || ''; }
