import { isCurrentProjectUser } from '../../src/desktop/today-guidance.mjs';

// Display-only: keep member names and submitted executor IDs unchanged.
export function executorLabel(name, executorId, currentUserId) {
  return `${name}${isCurrentProjectUser(executorId, currentUserId) ? '（我）' : ''}`;
}
