export const CHAT_SESSION_PREVIEW_LIMIT = 10;

function compareUpdatedAt(left, right) {
  return String(right.updated_at || "").localeCompare(String(left.updated_at || ""));
}

function compareSessions(left, right) {
  return compareUpdatedAt(left, right) || String(left.id || "").localeCompare(String(right.id || ""));
}

export function groupChatSessions({ sessions = [], projects = [] } = {}) {
  const projectsById = new Map(projects.map((project) => [String(project.id || ""), project]));
  const groupsByProjectId = new Map();

  for (const session of sessions) {
    const projectId = String(session.project_id || "");
    const project = projectsById.get(projectId);
    const group = groupsByProjectId.get(projectId) || {
      project_id: projectId,
      project_name: String(project?.name || projectId || "不可用的工作区"),
      available: Boolean(project),
      sessions: []
    };
    group.sessions.push(session);
    groupsByProjectId.set(projectId, group);
  }

  return [...groupsByProjectId.values()]
    .map((group) => ({ ...group, sessions: [...group.sessions].sort(compareSessions) }))
    .sort((left, right) => compareUpdatedAt(left.sessions[0], right.sessions[0])
      || left.project_name.localeCompare(right.project_name)
      || left.project_id.localeCompare(right.project_id));
}

export function chatSessionVisibility(group, {
  expanded = false,
  selectedSessionId = "",
  limit = CHAT_SESSION_PREVIEW_LIMIT
} = {}) {
  const previewLimit = Math.max(1, Math.trunc(Number(limit) || CHAT_SESSION_PREVIEW_LIMIT));
  const selectedIndex = group.sessions.findIndex((session) => session.id === selectedSessionId);
  const selectedRequiresHistory = selectedIndex >= previewLimit;
  const showAll = expanded || selectedRequiresHistory;
  return {
    expanded: showAll,
    selected_requires_history: selectedRequiresHistory,
    hidden_count: Math.max(0, group.sessions.length - previewLimit),
    sessions: showAll ? group.sessions : group.sessions.slice(0, previewLimit)
  };
}
