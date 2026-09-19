import { realtimeProjection } from '../../src/work-sync-health.mjs';

// Health notifications carry no content invalidation and need no IPC read.
export function applyWorkSyncHealth(snapshot, event) {
  if (event?.type === 'work.syncing') {
    snapshot.source_status = 'syncing';
    return true;
  }
  if (event?.type !== 'work.sync') return false;
  const id = event.projectId || event.project_id;
  if (id && event.state) {
    const projects = snapshot.realtime?.projects || {};
    snapshot.realtime = realtimeProjection({ ...projects, [id]: { ...projects[id], ...event } });
  }
  return true;
}
