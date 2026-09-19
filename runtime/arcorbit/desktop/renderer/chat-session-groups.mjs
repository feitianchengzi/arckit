export const CHAT_SESSION_PREVIEW_LIMIT = 5;

// Immutable identity/creation keys keep refreshes and active turns from moving rows.
export function groupChatSessions({ sessions = [], projects = [] } = {}) {
  const projectsById = new Map(projects.map(project => [String(project.id || ''), project]));
  const groups = new Map(projects.map(project => [String(project.id), {
    project_id: String(project.id), project_name: String(project.name || project.id),
    available: true, sessions: []
  }]));
  for (const session of sessions) {
    const id = String(session.project_id || '');
    const project = projectsById.get(id);
    if (!groups.has(id)) groups.set(id, {
      project_id: id, project_name: String(project?.name || id || '不可用的工作区'),
      available: Boolean(project), sessions: []
    });
    groups.get(id).sessions.push(session);
  }
  return [...groups.values()].sort((a, b) => a.project_id.localeCompare(b.project_id))
    .map(group => ({ ...group, sessions: group.sessions.slice().sort((a, b) =>
      String(b.created_at || '').localeCompare(String(a.created_at || ''))
      || String(a.id || '').localeCompare(String(b.id || ''))) }));
}

export function chatSessionVisibility(group, { collapsed = false, limit = CHAT_SESSION_PREVIEW_LIMIT } = {}) {
  const count = Math.max(CHAT_SESSION_PREVIEW_LIMIT, Math.trunc(Number(limit) || CHAT_SESSION_PREVIEW_LIMIT));
  return {
    collapsed,
    hidden_count: collapsed ? group.sessions.length : Math.max(0, group.sessions.length - count),
    sessions: collapsed ? [] : group.sessions.slice(0, count)
  };
}
