// Shared deterministic projection. Product meaning and plan choices belong to the Agent/person.
export function intakeMissing(plan, product, projects = []) {
  const missing = [];
  const add = (field, message) => missing.push({field, message});
  if (!plan) return [{field:'plan',message:'等待 Agent 准备接入方案，或直接填写。'}];
  if (plan.mode === 'existing') {
    const project = projects.find(p => String(p.id) === String(plan.project_id));
    if (!project) add('plan.project_id','请选择一个可访问项目。');
    else if (!isGithub(project.git_url)) add('plan.project_id','这个项目尚未配置 GitHub 仓库，请换一个项目或在 Organization 中完善。');
  } else {
    if (!plan.name?.trim()) add('plan.name','请填写项目名称。');
    if (plan.repository === 'create') {
      if (!/^[A-Za-z0-9][A-Za-z0-9-]{0,99}$/.test(plan.github_owner || '')) add('plan.github_owner','请选择或填写 GitHub 主体。');
      if (!/^[A-Za-z0-9][A-Za-z0-9_.-]{0,99}$/.test(plan.github_name || '')) add('plan.github_name','请填写有效仓库名。');
    } else if (!isGithub(plan.git_url)) add('plan.git_url','请填写 GitHub 仓库地址，或选择新建仓库。');
  }
  if (plan.directory === 'material' && !product.material_path) add('plan.directory','请选择本地材料目录，或选择其他正式工作目录。');
  if (plan.directory !== 'material' && !plan.workspace_path) add('plan.workspace_path','请选择正式目录位置；应用内部工作区不作为源码目录。');
  return missing;
}
export function isGithub(url) { return /^(https:\/\/github\.com\/|git@github\.com:|ssh:\/\/git@github\.com\/)[A-Za-z0-9_.-]+\/[A-Za-z0-9_.-]+\/?$/.test(url || ''); }
export function intakePhase(p, {session, dirty = false, plan, projects = []} = {}) {
  if (p.kind === 'formal') return {key:'complete',title:'已完成录入',hint:'产品已纳入管理。你可以查看产品，或共享管理资料。'};
  if (p.intake_execution?.status === 'running') return {key:'executing',title:'正在接入',hint:'正在核对并执行你确认的方案，成功步骤会保留。'};
  if (p.intake_execution?.status === 'failed') return {key:'blocked',title:'接入尚未完成',hint:p.intake_execution.error || '请核对已完成步骤，再继续。'};
  if (['starting','running','waiting_approval','interrupting'].includes(session?.status)) return {key:'analyzing',title:session.status==='waiting_approval'?'等待你的授权':'Agent 正在整理',hint:'查看右侧分析和工具结果；你也可以修改左侧内容或停止本轮。'};
  if (p.analysis?.status === 'starting') return {key:'analyzing',title:'正在连接 Agent',hint:'本机草稿已保存，正在开始材料理解。'};
  if (session?.status === 'failed' || p.analysis?.status === 'failed') return {key:'blocked',title:'Agent 暂时不可用',hint:session?.error || p.analysis.error || '可重试整理，或直接填写并完成接入。'};
  if (session?.status === 'interrupted' || p.analysis?.status === 'interrupted') return {key:'interrupted',title:'整理已中断',hint:'已有内容和对话已保留。继续整理会沿用这次 Idea。'};
  if (!plan && !p.proposal && !p.plan && p.analysis?.attempt_id && session?.status==='completed')return {key:'needs_input',title:'等待补充或继续整理',hint:'本轮尚未形成接入方案，请在右侧回答问题或继续整理；也可以直接填写。'};
  if (!plan && !p.proposal && !p.plan) return {key:'start',title:p.material_path?'材料已准备好':'描述你的想法',hint:p.material_path?'让 Agent 查看材料并准备接入方案，也可以直接填写。':'用一句话说明想做什么，Agent 会帮你整理并准备接入。'};
  if (dirty) return {key:'editing',title:'审阅并修改方案',hint:'可直接修改以下结果；保存后，Agent 与你使用同一份内容。'};
  const missing=intakeMissing(plan || p.plan,p,projects);
  return missing.length ? {key:'needs_input',title:'还需要你的选择',hint:missing[0].message} : {key:'ready',title:'接入方案已准备好',hint:'核对项目、仓库和目录，确认后开始正式接入。'};
}
