const WORK_ACTIONS = Object.freeze({
  pending_review: ["confirm_work"],
  completed: ["accept_work", "raise_acceptance_issue"],
  blocked: ["return_work", "cancel_work"]
});

const PRIORITY = Object.freeze({
  chat_approval: 10,
  automation_attention: 20,
  automation_recovery: 30,
  feedback_link_recovery: 40,
  work_replacement_recovery: 45,
  work_completed: 50,
  work_blocked: 60,
  work_pending_review: 70
});

function text(value) {
  return String(value ?? "");
}

function timestamp(value) {
  const parsed = Date.parse(value || "");
  return Number.isFinite(parsed) ? parsed : 0;
}

function sourceProjectId(value = {}) {
  return text(value.project_id || value.source_project_id || value.workspace_id);
}

function sourceObjectId(value = {}) {
  return text(value.source_object_id || value.task_id || value.feedback_id || value.session_id || value.execution_id || value.id);
}

function isCurrentUser(candidateId, currentUserId) {
  const candidate = text(candidateId).trim();
  const current = text(currentUserId).trim();
  return Boolean(candidate && current && candidate === current);
}

function setupForProject(setup, setupByProject, project) {
  const projectId = text(project.id);
  const localId = text(project.local_project_id);
  return setupByProject?.[projectId]
    || (localId ? setupByProject?.[localId] : null)
    || (text(setup?.project_id) === projectId || text(setup?.local_project_id) === localId ? setup : null)
    || setup
    || {};
}

export function deriveProjectConfiguration(project = {}, { setup = {}, setupByProject = {} } = {}) {
  const accessible = project.accessible !== false;
  const bound = Boolean(project.local_project_id || project.local_project_path);
  const projectSetup = setupForProject(setup, setupByProject, project);
  const setupStatus = bound ? text(projectSetup.status || "unknown") : "not_checked";
  const setupReady = bound && setupStatus === "ready";
  const participating = setupReady && project.participating === true;
  const unknown = project.source_status === "unknown" || project.source_status === "degraded" || project.source_unknown === true;

  let blocker = null;
  if (!accessible) blocker = { code: "project_inaccessible", label: "项目当前不可访问", action_id: "retry_project_source" };
  else if (unknown) blocker = { code: "project_source_unknown", label: "项目来源状态未知", action_id: "retry_project_source" };
  else if (!bound) blocker = { code: "local_workspace_missing", label: "选择当前设备上的本地目录", action_id: "bind_workspace" };
  else if (["checking", "applying"].includes(setupStatus)) blocker = { code: "setup_checking", label: "正在检查项目环境", action_id: "" };
  else if (!setupReady) blocker = { code: "setup_action_required", label: setupStatus === "conflict" ? "处理项目环境冲突" : "完成项目环境检查", action_id: "check_setup" };
  else if (!participating) blocker = { code: "participation_disabled", label: "允许此项目在本机参与 Automation", action_id: "enable_project" };

  return {
    accessible,
    bound,
    setup_status: setupStatus,
    setup_ready: setupReady,
    participating,
    ready: blocker === null,
    blocker,
    steps: [
      { id: "project_access", label: "项目可访问", complete: accessible && !unknown },
      { id: "local_workspace", label: "本地目录", complete: bound },
      { id: "project_setup", label: "项目环境", complete: setupReady },
      { id: "project_participation", label: "本机参与", complete: participating }
    ]
  };
}

function intervention(input) {
  const projectId = sourceProjectId(input);
  const objectId = sourceObjectId(input);
  return {
    ...input,
    id: text(input.id) || `${input.kind}:${projectId}:${objectId}`,
    source_key: `${input.source}:${objectId}`,
    project_id: projectId,
    source_object_id: objectId,
    current_user_responsible: true,
    priority: PRIORITY[input.kind] ?? 999,
    created_at: text(input.created_at),
    updated_at: text(input.updated_at || input.created_at)
  };
}

function chatInterventions(chat = {}) {
  const sessions = new Map((chat.sessions || []).map((session) => [text(session.id), session]));
  const pending = Array.isArray(chat.pending_approvals)
    ? chat.pending_approvals
    : (chat.messages || []).filter((message) => message.kind === "approval" && message.status === "pending").map((message) => ({
        ...message,
        session_id: message.session_id || chat.selected_session_id
      }));
  return pending.map((approval) => {
    const session = sessions.get(text(approval.session_id)) || {};
    return intervention({
      id: `chat:${approval.session_id}:${approval.approval_request_id || approval.id}`,
      kind: "chat_approval",
      source: "chat",
      project_id: approval.project_id || session.project_id,
      source_object_id: approval.approval_request_id || approval.id,
      title: approval.title || "Chat 正在等待操作授权",
      reason: approval.content || approval.reason || "当前对话需要你允许或拒绝工具动作后才能继续。",
      context: { ...approval, session_title: session.title || "" },
      actions: ["allow_once", "decline_and_continue"],
      created_at: approval.created_at,
      updated_at: approval.updated_at
    });
  });
}

function automationInterventions(automation = {}) {
  const attention = (automation.attention_items || []).filter((item) => item.responsibility !== "automation").map((item) => intervention({
    ...item,
    id: `automation-attention:${item.id || sourceObjectId(item)}`,
    kind: "automation_attention",
    source: "automation",
    source_kind: item.kind || "intervention",
    source_item_id: item.id || "",
    source_object_id: sourceObjectId(item),
    title: item.title || item.question || "Automation 等待你的决定",
    reason: item.reason || item.question || item.message || "当前执行需要人工补充事实或作出决定。",
    actions: item.actions?.length ? item.actions : item.kind === "external_dependency" ? ["confirm_external_dependency"] : ["submit_intervention"]
  }));
  const recovery = (automation.recovery_items || []).filter((item) => item.responsibility !== "automation").map((item) => intervention({
    ...item,
    id: `automation-recovery:${item.id || sourceObjectId(item)}`,
    kind: "automation_recovery",
    source: "automation",
    source_kind: item.type || "recovery",
    source_item_id: item.id || "",
    source_object_id: sourceObjectId(item),
    title: item.title || "恢复自动执行",
    reason: item.message || item.reason || "自动执行需要你选择恢复方式。",
    actions: item.actions || []
  }));
  return [...attention, ...recovery];
}

function workInterventions(tasks = [], projectsById) {
  return tasks.filter((task) => Object.hasOwn(WORK_ACTIONS, task.state)).filter((task) => {
    const currentUserId = projectsById.get(text(task.project_id))?.current_user_id;
    return task.current_user_responsible === true || isCurrentUser(task.responsible_user_id || task.executor_id, currentUserId);
  }).map((task) => intervention({
    ...task,
    id: `work:${task.id}:${task.state}`,
    kind: `work_${task.state}`,
    source: "work",
    source_object_id: task.id,
    title: task.state === "pending_review" ? "确认待办可处理" : task.state === "completed" ? "验收已完成待办" : "处理已阻塞待办",
    reason: task.state === "pending_review" ? task.content || "待办需要确认后才能进入待处理。" : task.state === "completed" ? "完成结果需要验收或提出验收问题。" : task.blocked_reason || task.content || "待办已阻塞，需要选择恢复路径。",
    actions: WORK_ACTIONS[task.state]
  }));
}

function workReplacementInterventions(replacements = []) {
  return replacements.filter((item) => item.status === "source_delete_failed" || item.status === "source_delete_pending").map((item) => intervention({
    ...item,
    id: `work-replacement:${item.id}`,
    kind: "work_replacement_recovery",
    source: "work",
    project_id: item.source_project_id,
    source_object_id: item.id,
    title: "收口跨项目待办移动",
    reason: item.error || `目标待办 ${item.target_task_id} 已创建，但源待办 ${item.source_task_id} 尚未删除。`,
    actions: ["retry_task_replacement", "keep_task_replacement"],
    created_at: item.created_at,
    updated_at: item.updated_at
  }));
}

function feedbackInterventions(feedbackLinkRecoveries = {}) {
  return Object.entries(feedbackLinkRecoveries || {}).map(([feedbackId, recovery]) => intervention({
    ...recovery,
    id: `feedback-link:${feedbackId}`,
    kind: "feedback_link_recovery",
    source: "feedback",
    source_item_id: feedbackId,
    feedback_id: feedbackId,
    source_object_id: feedbackId,
    title: "收口 Feedback 转待办",
    reason: recovery.message || `待办 ${recovery.task_id || ""} 已创建，但尚未与反馈关联。`,
    actions: ["retry_feedback_link"]
  }));
}

function stableUnique(items) {
  const unique = new Map();
  for (const item of items) {
    const previous = unique.get(item.source_key);
    if (!previous || item.priority < previous.priority || timestamp(item.updated_at) > timestamp(previous.updated_at)) unique.set(item.source_key, item);
  }
  return [...unique.values()].sort((left, right) => left.priority - right.priority
    || timestamp(left.created_at) - timestamp(right.created_at)
    || left.id.localeCompare(right.id));
}

function mergeProjects(platform = {}) {
  const values = new Map();
  for (const project of [...(platform.projects || []), ...(platform.product_workspaces || [])]) {
    const id = text(project.id);
    if (!id) continue;
    values.set(id, { ...(values.get(id) || {}), ...project, id });
  }
  return [...values.values()].sort((left, right) => text(left.name).localeCompare(text(right.name), "zh-CN") || left.id.localeCompare(right.id));
}

function projectMatches(item, selectedProjectId) {
  return selectedProjectId === "all" || sourceProjectId(item) === selectedProjectId;
}

export function deriveTodayWorkspace({
  platform = {},
  automation = {},
  setup = {},
  setupByProject = {},
  chat = {},
  feedbackLinkRecoveries = {},
  selectedProjectId = "all",
  selectedMode = "",
  selectedItemId = ""
} = {}) {
  const allProjects = mergeProjects(platform).map((project) => ({
    ...project,
    current_user_id: project.current_user_id || platform.user?.id || ""
  }));
  const projectIndex = new Map(allProjects.map((project) => [project.id, project]));
  const allInterventions = stableUnique([
    ...chatInterventions(chat),
    ...automationInterventions(automation),
    ...workReplacementInterventions(platform.task_replacements || []),
    ...workInterventions(platform.today_tasks || platform.tasks || automation.tasks || [], projectIndex),
    ...feedbackInterventions(feedbackLinkRecoveries)
  ]);
  const hasExplicitTodayScope = Array.isArray(platform.today_project_ids);
  const configuredProjectIds = new Set(hasExplicitTodayScope ? platform.today_project_ids.map(text) : allProjects.map((project) => project.id));
  const visibleProjectIds = new Set([
    ...configuredProjectIds,
    ...allInterventions.map((item) => item.project_id).filter(Boolean)
  ]);
  const unknownProjectIds = new Set((platform.errors || []).map((error) => text(error.project_id)).filter(Boolean));
  const projects = allProjects.filter((project) => visibleProjectIds.has(project.id)).map((project) => {
    const configuration = deriveProjectConfiguration({ ...project, source_unknown: unknownProjectIds.has(project.id) }, { setup, setupByProject });
    const responsibilityCount = allInterventions.filter((item) => item.project_id === project.id).length;
    const running = (automation.active_executions || []).some((execution) => text(execution.project_id) === project.id);
    return {
      ...project,
      in_today_scope: configuredProjectIds.has(project.id),
      configuration,
      responsibility_count: responsibilityCount,
      automatic_status: running ? "running" : configuration.ready ? "idle" : "blocked"
    };
  }).sort((left, right) => Number(right.responsibility_count > 0) - Number(left.responsibility_count > 0)
    || Number(!right.configuration.ready) - Number(!left.configuration.ready)
    || Number(right.configuration.blocker?.code === "project_source_unknown") - Number(left.configuration.blocker?.code === "project_source_unknown")
    || text(left.name).localeCompare(text(right.name), "zh-CN"));
  const scope = selectedProjectId === "all" || visibleProjectIds.has(text(selectedProjectId)) ? text(selectedProjectId) : "all";
  const interventions = allInterventions.filter((item) => projectMatches(item, scope));
  const configurations = projects.filter((project) => configuredProjectIds.has(project.id) && projectMatches({ project_id: project.id }, scope) && !project.configuration.ready).map((project) => ({
    id: `configuration:${project.id}`,
    kind: "project_configuration",
    source: "project",
    project_id: project.id,
    source_object_id: project.id,
    title: project.configuration.blocker?.label || "完成项目配置",
    reason: "只处理阻塞 Automation 在此设备领任务和执行的当前唯一条件。",
    actions: project.configuration.blocker?.action_id ? [project.configuration.blocker.action_id] : [],
    configuration: project.configuration,
    context: project
  }));
  const mode = selectedMode || (projects.length === 0 || configurations.length > 0 ? "configuration" : "intervention");
  const items = mode === "configuration" ? configurations : interventions;
  const selected = items.find((item) => item.id === selectedItemId) || items[0] || null;
  const activeProjectIds = new Set((automation.active_executions || []).map((item) => text(item.project_id)).filter(Boolean));
  const automaticRecoveryProjectIds = new Set((automation.recovery_items || []).filter((item) => item.responsibility === "automation").map(sourceProjectId).filter(Boolean));
  const unknownSources = [...new Set((platform.errors || []).map((error) => text(error.section || "unknown")).filter(Boolean))];
  const configuredProjects = projects.filter((project) => project.in_today_scope);

  return {
    mode,
    selected_project_id: scope,
    selected_item_id: selected?.id || "",
    selected_item: selected,
    projects,
    interventions,
    configurations,
    counts: {
      responsibilities: allInterventions.length,
      configured_projects: configuredProjects.length,
      configuration_incomplete: configuredProjects.filter((project) => !project.configuration.ready).length,
      unknown_sources: unknownSources.length
    },
    non_human_summary: {
      ready_projects: configuredProjects.filter((project) => project.configuration.ready).length,
      running_projects: activeProjectIds.size,
      automatic_recovery_projects: automaticRecoveryProjectIds.size,
      unknown_sources: unknownSources
    }
  };
}
