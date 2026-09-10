// Product option meanings are shared by the form and scene Agent; no semantic routing.
export const DIRECTORY_OPTIONS = [
  {value:'material',label:'使用所选材料目录',effect:'沿用材料目录作为正式 Git 工作目录；保留原文件，必要时初始化 Git。'},
  {value:'selected',label:'选择其他工作目录',effect:'使用你选择的对应 GitHub 本地仓库或空文件夹；空目录克隆仓库，复制材料并保留来源。'}
];
export function intakeInteraction(p, candidates={}, plan=p.plan) {
  const v=plan || {},projects=candidates.projects || [];
  const project=projects.find(x=>String(x.id)===String(v.project_id));
  const directory=v.directory==='managed'?'selected':v.directory || (p.material_path?'material':'selected');
  const source=p.source_path || p.material_path || '';
  const target=p.kind==='formal'?p.material_path:directory==='material'?p.material_path || '':v.directory==='managed'?'':v.workspace_path || '';
  const selected=DIRECTORY_OPTIONS.find(x=>x.value===directory);
  const transfer=source?(source===target?'原地保留材料，不复制。':'复制材料到正式目录，保留来源；不复制原 .git、依赖缓存、凭据与符号链接，不覆盖不同内容。'):'空白 Idea，仅准备仓库和产品管理记录。';
  const field=(label,value,meaning,options)=>({label,value,meaning,...options?{options}: {}});
  return {page:'idea-add',revision:p.record.revision,plan_source:plan?'saved_or_explicit_plan':'not_prepared',
    fields:{
      name:field('Idea / 项目名称',v.name || p.name,'新建项目时使用方案名称；关联已有项目沿用服务器名称。'),
      description:field('简要说明',p.record.description,'当前已保存的产品说明。'),
      status:field('产品状态',p.record.status,'由人明确采纳，不从活跃度或接入完成推断。'),
      audience:field('目标用户',p.record.audience,'可选产品资料，不作为录入前置。'),
      vision:field('产品理念',p.record.vision,'可选产品资料，不作为录入前置。'),
      principles:field('产品原则',p.record.principles,'可选产品资料，不作为录入前置。'),
      assets:field('核心资产引用',p.record.assets,'仓库相对路径，正文按原 Git 流程同步。'),
      members:field('成员',v.mode==='existing'?(candidates.members || []).filter(m=>String(m.project_id)===v.project_id):[candidates.user].filter(Boolean),'已有项目沿用成员关系，新建项目当前用户为创建者；录入后在组织管理成员。'),
      'plan.mode':field('Workshop 项目',v.mode || '', '选择创建项目或关联现有项目。',[{value:'create',label:'新建项目'},{value:'existing',label:'关联已有项目'}]),
      'plan.project_id':field('已有项目',v.project_id || '',project?.name || '尚未选择'),
      'plan.organization_id':field('所属组织',v.organization_id || '', 'Workshop 业务组织，与 GitHub 主体分别选择。'),
      'plan.repository':field('GitHub 仓库',v.repository || '', 'existing 使用已有地址；create 新建私有仓库；none 沿用已关联项目的仓库。'),
      'plan.github_owner':field('GitHub 主体 / 组织',v.github_owner || '', 'GitHub 用户或组织；候选不代表已验证创建权限。'),
      'plan.github_name':field('仓库名',v.github_name || '', '创建 GitHub 仓库的名称。'),
      'plan.git_url':field('仓库地址',v.mode==='existing'?project?.git_url || '':v.git_url || '', '正式目录的 origin 必须与这个 GitHub 仓库对应。'),
      'plan.directory':{...field('正式工作目录',directory,selected?.effect,DIRECTORY_OPTIONS),selected_label:selected?.label || '',actual_path:target,material_action:transfer},
      'plan.workspace_path':field('正式目录位置',target,'本机路径；其他目录需原生选择或明确使用已有项目绑定。Agent 不能凭提案授权任意路径。')
    },
    locations:{material_source:source,formal_workspace:target,agent_workspace:p.workspace,agent_workspace_purpose:'应用内部会话工作区，不是正式源码目录'},
    material_action:transfer,source_control_effect:'接入不自动提交或推送源码；共享只推送产品管理记录，正文需另外通过 Git 同步。',
    existing_project_workspace:project?.local_project_path || '',authorized_workspaces:p.workspace_grants || [],
    proposal:p.proposal?{id:p.proposal.id,revision:p.proposal.revision,adoption:'待用户采纳；不能当作已保存或已确认方案'}:null,
    actions:[{id:'workspace',label:'选择正式目录',actor:'human',effect:'打开本机目录选择器，选定后仍可修改并保存方案。'},
      {id:'product_propose',label:'提出可修改建议',actor:'agent',effect:'使用当前 revision 提交；不能自动采纳或授予路径写权限。'},
      {id:'review-save',label:'保存修改',actor:'human',effect:'保存本机草稿；不执行接入。发送消息前保存当前编辑。'},
      {id:'approve-agent',label:'审阅并确认接入',actor:'human',effect:'核对项目、仓库、实际目录与材料处理后确认。'},
      {id:'product_execute',label:'执行已确认方案',actor:'agent_or_human',available:Boolean(p.approved_digest),effect:'只执行与当前确认摘要一致的方案。'},
      {id:'publish',label:'审阅并共享资料',actor:'human',available:p.kind==='formal',effect:'仅共享 arckit/product 管理记录，不上传源码。'}]
  };
}
