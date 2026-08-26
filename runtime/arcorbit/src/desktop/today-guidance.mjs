const TERMINAL_STATES = new Set(["accepted", "cancelled"]);

function text(value) {
  return String(value ?? "");
}

function projectId(value) {
  return text(value?.project_id || value?.source_project_id || value?.id);
}

function inScope(value, selectedProjectId = "all") {
  return selectedProjectId === "all" || projectId(value) === text(selectedProjectId);
}

function projectError(errors = [], remoteProjectId = "") {
  return errors.some((error) => !error?.project_id || text(error.project_id) === text(remoteProjectId));
}

export function canManageProject(workspace = {}) {
  return ["owner", "admin"].includes(text(workspace.current_user_role).toLowerCase());
}

function currentUserTasks(tasks = [], userId = "", selectedProjectId = "all") {
  return tasks.filter((task) => inScope(task, selectedProjectId) && (
    !userId || text(task.executor_id) === text(userId)
  ));
}

function orderedWorkspaces(platform = {}, selectedProjectId = "all", automationTasks = []) {
  const workspaces = (platform.product_workspaces || []).filter((workspace) => inScope(workspace, selectedProjectId));
  if (selectedProjectId !== "all") return workspaces;
  const taskScore = (workspace) => automationTasks.reduce((score, task) => {
    if (text(task.project_id) !== text(workspace.id)) return score;
    return Math.max(score, task.state === "pending" ? 3 : task.state === "pending_review" ? 2 : task.state === "completed" ? 1 : 0);
  }, 0);
  return [...workspaces].sort((left, right) => taskScore(right) - taskScore(left));
}

function action(kind, input = {}) {
  return { kind, tone: "action", responsibility: "current_user", ...input };
}

function handoff(kind, workspace, input = {}) {
  return action(kind, {
    workspace,
    responsibility: "project_admin",
    action_id: "copy_handoff",
    action_label: "复制处理说明",
    ...input
  });
}

export function deriveReadinessSteps({ workspace = null, setup = {}, automation = {}, userTasks = [], unknown = false } = {}) {
  const hasWorkspace = Boolean(workspace);
  const bound = Boolean(workspace?.local_project_path || workspace?.local_project_id);
  const setupReady = bound && setup?.status === "ready";
  const participating = setupReady && workspace?.participating === true;
  const qualified = participating && userTasks.some((task) => task.state === "pending");
  const globalReady = qualified && automation.enabled === true && automation.queue_paused !== true;
  const values = [
    ["work_context", "工作归属", hasWorkspace],
    ["local_workspace", "本地工作区", bound],
    ["project_setup", "项目环境", setupReady],
    ["project_participation", "项目授权", participating],
    ["work_qualification", "工作资格", qualified],
    ["global_automation", "全局领取", globalReady]
  ];
  let currentSeen = false;
  return values.map(([id, label, complete]) => {
    const status = unknown && !complete ? "unknown" : complete ? "complete" : currentSeen ? "later" : "current";
    if (!complete && !currentSeen) currentSeen = true;
    return { id, label, status };
  });
}

export function deriveTodayGuidance({ platform = {}, automation = {}, setup = {}, authentication = {}, selectedProjectId = "all" } = {}) {
  const allAutomationTasks = (automation.tasks || []).filter((task) => inScope(task, selectedProjectId));
  const userId = text(platform.user?.id || automation.user?.id);
  const userTasks = currentUserTasks(allAutomationTasks, userId, selectedProjectId);
  const workspaces = orderedWorkspaces(platform, selectedProjectId, userTasks);
  const attention = (automation.attention_items || []).find((item) => inScope(item, selectedProjectId));
  const recovery = (automation.recovery_items || []).find((item) => inScope(item, selectedProjectId) || !projectId(item));
  if (authentication.authenticated === false) {
    return action("authentication", { title: "重新登录以继续推进", reason: "Workshop 登录已失效，远端项目和任务状态无法 fresh-read。", action_id: "open_auth", action_label: "重新登录" });
  }
  if (attention || recovery) {
    return action("human_attention", { title: recovery ? "恢复当前自动化" : "处理当前人工事项", reason: text(recovery?.message || attention?.question || attention?.reason), item: recovery || attention, action_id: recovery ? "open_recovery" : "open_attention", action_label: "立即处理" });
  }
  const completed = userTasks.find((task) => task.state === "completed");
  if (completed) return action("completion_review", { title: "审查已完成结果", reason: "已完成任务需要由你确认结果或提出验收问题。", task: completed, action_id: "review_completion", action_label: "审查结果" });
  const errors = platform.errors || [];
  const unknown = platform.source_status === "degraded" || platform.source_status === "error" || errors.length > 0 || ["error", "degraded"].includes(automation.source_status);
  if (unknown) return action("unknown", { title: "部分状态尚未确认", reason: "至少一个事实源读取失败；ArcOrbit 保留已知状态，不把未知解释为空队列或未准备。", action_id: "retry_refresh", action_label: "重新读取" });
  if (!workspaces.length) return action("select_project", { title: "选择要推进的真实项目", reason: "当前 Workset 没有可访问产品；个人使用不要求先创建组织。", action_id: "manage_workset", action_label: "选择项目" });

  for (const workspace of workspaces) {
    const workspaceTasks = userTasks.filter((task) => text(task.project_id) === text(workspace.id));
    if (!workspace.local_project_path && !workspace.local_project_id) {
      if (!canManageProject(workspace)) return handoff("bind_workspace", workspace, { title: "需要项目管理员绑定本地目录", reason: "缺少本地目录会同时阻止 Chat 和本地 Automation。" });
      return action("bind_workspace", { workspace, title: "绑定本地目录", reason: "缺少本地目录会同时阻止 Chat 和本地 Automation。", action_id: "bind_workspace", action_label: "选择本地目录" });
    }
    if (setup?.status !== "ready") return action("project_setup", { workspace, title: "恢复项目环境", reason: "本地目录已绑定，但 Setup Readiness 尚未通过。", action_id: "check_setup", action_label: "检查项目环境" });
    if (!workspace.participating) {
      if (!canManageProject(workspace)) return handoff("enable_project", workspace, { title: "需要项目管理员允许自动领取", reason: "当前角色不能扩大该项目的 Automation 参与范围。" });
      return action("enable_project", { workspace, title: "允许项目自动领取", reason: "只授权当前项目，不修改 Workset、任务状态或全局总闸。", action_id: "enable_project", action_label: "允许此项目" });
    }
    const reviewTask = workspaceTasks.find((task) => task.state === "pending_review");
    if (!workspaceTasks.some((task) => task.state === "pending") && reviewTask) {
      return action("review_task", { workspace, task: reviewTask, title: "确认可开始的工作", reason: "待评审任务不会进入 Automation；先在 Work 确认真实状态。", action_id: "review_task", action_label: "查看并确认" });
    }
    if (!workspaceTasks.some((task) => task.state === "pending")) {
      return action("create_task", { workspace, title: "创建并交给 ArcOrbit", reason: "当前产品没有分配给你的待处理工作。该入口会明确创建为“我 · 待处理”。", action_id: "create_for_arcorbit", action_label: "创建并交给 ArcOrbit" });
    }
  }

  const primaryWorkspace = workspaces.find((workspace) => userTasks.some((task) => text(task.project_id) === text(workspace.id) && task.state === "pending")) || workspaces[0];
  if (automation.enabled !== true) {
    return action("enable_automation", { workspace: primaryWorkspace, title: "开始自动执行", reason: "已有待处理任务满足项目资格；全局总闸只控制新领取。", action_id: "enable_automation", action_label: "开始自动执行" });
  }
  if (automation.queue_paused === true) {
    return action("resume_queue", { workspace: primaryWorkspace, title: "继续自动领取", reason: "已有待处理任务满足资格；恢复领取只解除队列暂停，不修改任务、项目授权或当前执行。", action_id: "resume_queue", action_label: "继续领取" });
  }
  const running = (automation.active_executions || [automation.active_execution].filter(Boolean))[0];
  if (running) return action("running", { workspace: workspaces.find((workspace) => text(workspace.id) === text(running.project_id)) || primaryWorkspace, title: "ArcOrbit 正在推进工作", reason: "当前执行健康运行；只有出现人工事项或恢复状态时才要求操作。", execution: running, action_id: "view_automation", action_label: "查看运行" });
  return action("ready", { workspace: primaryWorkspace, title: "ArcOrbit 已准备就绪", reason: "当前没有需要你处理的事项，ArcOrbit 会继续监听可领取工作。", action_id: "view_automation", action_label: "查看 Automation" });
}

export function deriveWorkEligibilityGuidance({ task = {}, workspace = {}, automationTask = null, currentUserId = "", canManageTask = false, errors = [] } = {}) {
  const assignedToCurrentUser = Boolean(task.executor_id) && text(task.executor_id) === text(currentUserId);
  if (projectError(errors, task.project_id)) return action("unknown", { title: "任务资格尚未确认", reason: "当前项目同步失败，不能把未知状态描述为不可执行。", action_id: "retry_refresh", action_label: "重新读取" });
  if (task.state === "pending_review") {
    if (!assignedToCurrentUser) return canManageTask
      ? action("assign_current_user", { title: "这条待评审任务尚未交给你", reason: "待评审且执行人不是当前用户的任务不会自动执行。", action_id: "edit_assignee", action_label: "修改执行人" })
      : handoff("assign_current_user", workspace, { title: "需要项目管理员确认任务归属", reason: "当前任务待评审且未分配给你；当前角色不能修改。" });
    return canManageTask
      ? action("confirm_review", { title: "先确认任务可以开始", reason: "确认后状态变为待处理；Automation 仍会重新判断项目连接和总闸。", action_id: "confirm_review", action_label: "确认并交给 ArcOrbit" })
      : handoff("confirm_review", workspace, { title: "需要项目管理员确认任务", reason: "待评审任务不会进入自动领取，当前角色不能确认状态。" });
  }
  if (task.state !== "pending") return action("not_pending", { tone: "info", title: "当前状态不进入自动领取", reason: `只有分配给当前用户的待处理任务可成为候选；当前状态为 ${text(task.state)}。`, action_id: "", action_label: "" });
  if (!assignedToCurrentUser) return canManageTask
    ? action("assign_current_user", { title: "这条任务不会由你的 Automation 领取", reason: "待处理任务的执行人不是当前用户。", action_id: "edit_assignee", action_label: "修改执行人" })
    : handoff("assign_current_user", workspace, { title: "需要项目管理员修改执行人", reason: "当前执行人不是你，且当前角色不能修改任务归属。" });
  if (!workspace.local_project_path && !workspace.local_project_id) return canManageProject(workspace)
    ? action("bind_workspace", { workspace, title: "任务已准备好，但缺少本地目录", reason: "绑定目录后留在当前 Inspector 并重新计算资格。", action_id: "bind_workspace", action_label: "选择本地目录" })
    : handoff("bind_workspace", workspace, { title: "需要项目管理员绑定本地目录", reason: "任务状态已准备，但当前角色不能完成项目连接。" });
  if (!workspace.participating) return canManageProject(workspace)
    ? action("enable_project", { workspace, title: "项目尚未允许自动领取", reason: "只修改项目 participation，不改变任务或全局总闸。", action_id: "enable_project", action_label: "允许此项目" })
    : handoff("enable_project", workspace, { title: "需要项目管理员允许自动领取", reason: "当前角色不能扩大项目的 Automation 范围。" });
  if (automationTask?.eligibility_code === "work_sync_error") return action("unknown", { title: "任务源状态未知", reason: "Work Sync 失败，保留任务事实并等待 fresh-read。", action_id: "retry_refresh", action_label: "重新读取" });
  return action("eligible", { tone: "info", title: "任务具备自动执行资格", reason: automationTask?.queue_position ? `当前位于队列第 ${automationTask.queue_position} 项。` : "等待 Automation 根据全局状态领取。", action_id: "view_automation", action_label: "查看 Automation" });
}

export function deriveAutomationGuidance({ automation = {}, platform = {}, selectedProjectId = "all" } = {}) {
  const blocked = (automation.blocked_pending_tasks || []).filter((task) => inScope(task, selectedProjectId));
  const queue = (automation.queue || []).filter((task) => inScope(task, selectedProjectId));
  const tasks = (automation.tasks || []).filter((task) => inScope(task, selectedProjectId));
  const errors = platform.errors || [];
  const recovery = (automation.recovery_items || [])[0];
  const attention = (automation.attention_items || []).find((item) => inScope(item, selectedProjectId));
  if (recovery || attention) return action("human_attention", { title: recovery ? "恢复当前自动化" : "处理当前人工事项", reason: text(recovery?.message || attention?.question || attention?.reason), action_id: recovery ? "open_recovery" : "open_attention", action_label: "立即处理" });
  if (platform.source_status === "degraded" || errors.length || ["error", "degraded"].includes(automation.source_status)) return action("unknown", { title: "队列状态部分未知", reason: "同步未完成，不能把未知候选报告为空队列。", action_id: "retry_refresh", action_label: "重新读取" });
  if (blocked.length) {
    const candidate = blocked.find((task) => task.eligibility_code === "project_unbound") || blocked.find((task) => task.eligibility_code === "project_not_participating") || blocked[0];
    const workspace = (platform.product_workspaces || []).find((item) => text(item.id) === text(candidate.project_id)) || {};
    if (candidate.eligibility_code === "project_unbound") return canManageProject(workspace)
      ? action("bind_workspace", { workspace, candidate_count: blocked.length, title: `${blocked.length} 条工作在等待项目连接`, reason: "不是空队列；待处理任务存在，但缺少本地目录。", action_id: "bind_workspace", action_label: "选择本地目录" })
      : handoff("bind_workspace", workspace, { candidate_count: blocked.length, title: "需要项目管理员绑定本地目录", reason: `${blocked.length} 条待处理任务受此连接缺口影响。` });
    if (candidate.eligibility_code === "project_not_participating") return canManageProject(workspace)
      ? action("enable_project", { workspace, candidate_count: blocked.length, title: `${blocked.length} 条工作尚未获得项目授权`, reason: "不是空队列；允许项目后原位重新计算候选。", action_id: "enable_project", action_label: "允许此项目" })
      : handoff("enable_project", workspace, { candidate_count: blocked.length, title: "需要项目管理员允许自动领取", reason: `${blocked.length} 条待处理任务受项目授权影响。` });
    return action("unknown", { title: "候选存在但任务源异常", reason: candidate.eligibility_reason || "Work Sync 尚未确认候选资格。", action_id: "retry_refresh", action_label: "重新读取" });
  }
  const reviews = tasks.filter((task) => task.state === "pending_review");
  if (!queue.length && reviews.length) return action("review_task", { task: reviews[0], candidate_count: reviews.length, title: `有 ${reviews.length} 条待评审工作`, reason: "待评审不是可领取状态；请先在 Work 确认。", action_id: "review_task", action_label: "查看并确认" });
  if (queue.length && automation.enabled !== true) return action("enable_automation", { candidate_count: queue.length, title: "工作已经准备好", reason: `${queue.length} 条任务可领取，只有全局自动领取仍关闭。`, action_id: "enable_automation", action_label: "开始自动执行" });
  if (queue.length && automation.queue_paused === true) return action("resume_queue", { candidate_count: queue.length, title: "自动领取已暂停", reason: `${queue.length} 条任务具备资格；继续领取不会修改任务、项目授权或当前执行。`, action_id: "resume_queue", action_label: "继续领取" });
  if (queue.length) return action("queue_ready", { tone: "info", candidate_count: queue.length, title: `${queue.length} 条任务可以领取`, reason: "队列来自服务器确认后的当前用户待处理任务。", action_id: "", action_label: "" });
  return action("empty", { tone: "info", title: "当前没有可领取工作", reason: "任务同步已知、没有待处理候选、待评审任务或资格阻断。", action_id: "", action_label: "" });
}
