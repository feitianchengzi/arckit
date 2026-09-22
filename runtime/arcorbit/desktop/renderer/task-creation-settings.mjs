// Local UI preference only: never persist task content or submit the switch to Workshop.
const PREFIX = 'arcorbit:task-creation-settings:v1:';
const text = value => typeof value === 'string' || typeof value === 'number' ? String(value) : '';
export function taskCreationSettingsKey({ authentication = {}, platform = {}, taskSource = {} } = {}) {
  const userId = text(platform.user?.id).trim();
  if (!authentication.authenticated || !userId) return '';
  return PREFIX + JSON.stringify([
    text(taskSource.base_url).replace(/\/+$/, ''), text(taskSource.service_name),
    userId, text(authentication.identity).trim()
  ]);
}
export function taskCreationSelection(values = {}) {
  return {
    project_id: text(values.project_id), state: text(values.state),
    executor_id: text(values.executor_id), father_id: text(values.father_id),
    tag_ids: [...new Set((Array.isArray(values.tag_ids) ? values.tag_ids : []).map(text).filter(Boolean))],
    priority: text(values.priority)
  };
}
export function readTaskCreationSettings(storage, key) {
  const empty = { version: 1, enabled: false, last: null };
  if (!key) return { ...empty, notice: '当前账户身份尚未就绪，暂时无法沿用创建设置。' };
  try {
    const value = JSON.parse(storage.getItem(key) || 'null');
    if (!value || value.version !== 1) return { ...empty, notice: '' };
    return { version: 1, enabled: value.enabled === true,
      last: value.last && typeof value.last === 'object' && !Array.isArray(value.last) ? taskCreationSelection(value.last) : null,
      notice: '' };
  } catch {
    return { ...empty, notice: '无法读取上次创建设置，本次已使用默认值。' };
  }
}
export function writeTaskCreationSettings(storage, key, settings) {
  if (!key) throw new Error('当前账户身份尚未就绪');
  storage.setItem(key, JSON.stringify({ version: 1, enabled: settings.enabled === true,
    last: settings.last ? taskCreationSelection(settings.last) : null }));
}
export function restoreTaskCreationSettings(settings, { projects, defaultProjectId, states, priorities, candidatesForProject }) {
  const defaults = { project_id: text(defaultProjectId), state: 'pending_review', executor_id: '', father_id: '', tag_ids: [], priority: '' };
  if (!settings.enabled || !settings.last) return { values: defaults, notice: settings.notice || '' };
  const last = settings.last;
  const sameProject = projects.some(option => text(option.value) === last.project_id);
  const values = { ...defaults, project_id: sameProject ? last.project_id : defaults.project_id };
  let invalid = false;
  for (const [name, options] of [['state', states], ['priority', priorities]]) {
    if (options.some(option => text(option.value) === last[name])) values[name] = last[name];
    else invalid = true;
  }
  if (sameProject) {
    const candidates = candidatesForProject(values.project_id);
    for (const name of ['executor_id', 'father_id']) {
      if (candidates[name].some(option => text(option.value) === last[name])) values[name] = last[name];
      else invalid = true;
    }
    const tagIds = new Set(candidates.tag_ids.map(text));
    values.tag_ids = last.tag_ids.filter(id => tagIds.has(id));
    if (values.tag_ids.length !== last.tag_ids.length) invalid = true;
  }
  const notice = !sameProject
    ? '上次产品不在当前范围，已使用当前产品；请重新选择执行人、父待办和标签。'
    : invalid ? '部分上次选项已不可用，已恢复为可用默认值，请检查后创建。' : '';
  return { values, notice };
}
