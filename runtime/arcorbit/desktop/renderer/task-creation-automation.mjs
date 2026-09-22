const labels = { pending_review: '待评审', pending: '待处理', in_progress: '进行中', completed: '已完成', accepted: '已验收', cancelled: '已取消', blocked: '已阻塞' };
const id = value => String(value ?? '');
const result = (label, message, tone = 'neutral') => ({ label, message, tone });

// A preview of ordinary automatic claiming, never an authorization or a queued-task assertion.
export function taskCreationAutomation({ projectId, taskState, executorId, platform = {}, automation = {}, setup = {}, authentication = {}, sourceReadFailed = false } = {}) {
  const workspace = (platform.product_workspaces || []).find(p => id(p.id) === id(projectId));
  const runtimeProject = (automation.projects || []).find(p => id(p.id) === id(projectId));
  const currentUser = id(workspace?.current_user_id).trim();
  const project = runtimeProject || workspace;
  const sourceStatus = project?.source_status;
  const relevantError = [...(automation.errors || []), ...(platform.errors || [])].some(e => e.section !== 'tags' && (!e.project_id || id(e.project_id) === id(projectId)));
  const unknown = sourceReadFailed || authentication.authenticated !== true || !currentUser || !workspace || !project
    || !['healthy', 'degraded'].includes(automation.source_status) || sourceStatus !== 'healthy' || relevantError
    || typeof automation.enabled !== 'boolean' || typeof automation.queue_paused !== 'boolean';
  if (unknown) return result('Automation 待确认', '当前产品的账户或自动领取状态尚未确认。请使用顶部同步后重试；仍可创建普通待办。', 'warning');
  if (taskState !== 'pending' || id(executorId) !== currentUser) {
    const reasons = [], steps = [];
    if (taskState !== 'pending') { reasons.push(`当前状态为「${labels[taskState] || '未知状态'}」`); steps.push('将状态改为「待处理」'); }
    if (id(executorId) !== currentUser) { reasons.push(executorId ? '执行人是其他成员，本机不会代其领取' : '执行人未分配'); steps.push('将执行人设为「我」'); }
    return result('本待办不自动领取', `${reasons.join('，')}。若希望由本机自动执行，请${steps.join('，并')}。`);
  }
  if (!project.local_project_id || !project.local_project_path) return result('Automation 尚未就绪', '当前产品尚未绑定本地工作区。请在 Today 为该产品绑定本地目录，再检查自动领取条件。', 'warning');
  if (typeof project.participating !== 'boolean') return result('Automation 待确认', '当前产品的自动领取授权尚未确认。请使用顶部同步后重试。', 'warning');
  if (!project.participating) return result('Automation 尚未就绪', '当前产品尚未允许自动领取。' + (['owner', 'admin'].includes(workspace.current_user_role) ? '请在 Today 允许该产品参与自动领取。' : '请联系项目管理员开启该产品的自动领取。'), 'warning');
  if (!automation.enabled) return result('Automation 已关闭', '本机自动领取已关闭。请在顶部「运行」中开启「自动领取」。');
  if (automation.queue_paused) return result('Automation 已暂停', '本机已暂停领取新待办。请在顶部「运行」中继续领取；正在运行的任务不受此开关影响。');
  const scoped = item => item.freeze_scope === 'global'
    || id(item.project_id || item.source_project_id) === id(projectId)
    || id(item.workspace_key || item.local_project_id) === id(project.local_project_id);
  if (!setup.status) return result('Automation 待确认', '项目环境状态尚未确认。请在 Today 检查环境。', 'warning');
  if (setup.status !== 'ready') return result('Automation 等待处理', '项目环境尚未就绪，请在 Today 检查环境。', 'warning');
  if ([...(automation.recovery_items || []), ...(automation.attention_items || [])].some(scoped)) return result('Automation 等待处理', '自动领取正在等待恢复或人工处理，请到 Automation 处理后继续。', 'warning');
  const busy = (automation.active_executions || []).some(scoped) || automation.concurrency?.available === 0;
  return result('Automation 已开启', '待办已分配给你、状态为「待处理」，且项目与本机均已允许自动领取。' + (busy ? '当前有任务正在执行，创建后将等待空位。' : '创建成功后将按队列顺序领取，启动前仍会检查环境。'), 'success');
}
