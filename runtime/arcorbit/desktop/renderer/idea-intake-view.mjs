import { intakeInteraction, DIRECTORY_OPTIONS } from '../../src/product-intake-context.mjs';
import { intakeMissing, intakePhase } from '../../src/product-intake-state.mjs';
const esc=x=>String(x??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const labels={repository:'GitHub 仓库',project:'Workshop 项目',workspace:'正式目录与材料'};
export function renderIdeaIntake({p,d,snapshot,session,manual,confirming,error,field,select,button,advanced}) {
  const missing=intakeMissing(d.plan,p,snapshot.projects);
  const stale=d.revision!==p.record.revision;
  const busy=['starting','running','waiting_approval','interrupting'].includes(session?.status) || p.analysis?.status==='starting';
  const executing=p.intake_execution?.status==='running';
  const hasPlan=Boolean(p.plan || p.proposal || manual);
  const phase=intakePhase(p,{session,dirty:d.dirty,plan:hasPlan?d.plan:null,projects:snapshot.projects});
  const msg=key=>missing.filter(m=>m.field===key).map(m=>`<small class="idea-field-hint">${esc(m.message)}</small>`).join('');
  const input=(label,key,value,type)=>field(label,key,value,type)+msg(key);
  const choose=(label,key,value,items)=>select(label,key,value,items)+msg(key);
  const primary=(a,label,disabled=false)=>button(a,label,`class="primary-button" ${disabled?'disabled':''}`);
  const receipts=Object.entries(p.receipts || {});
  const progress=`<section class="idea-progress" aria-live="polite"><div><p class="eyebrow">${p.kind==='formal'?'录入完成':'本机草稿 · 尚未正式录入'}</p><h2>${esc(phase.title)}</h2><p>${esc(phase.hint)}</p></div><div class="idea-next-action">${p.kind==='formal'?primary('detail','查看产品'):executing?'<span>正在执行已确认方案…</span>':stale?primary('rebase','比较并保留我的修改'):d.dirty&&hasPlan?primary('review-save','保存修改',busy):hasPlan&&!missing.length?primary('approve-agent','审阅并确认接入',busy):hasPlan?primary('focus-missing','补充必要信息',busy):primary('prepare',p.material_path?'开始整理材料':'开始整理想法',busy||(!p.material_path&&!d.patch.description.trim()))}</div></section>`;
  const issues=error?`<div class="product-error" role="alert">${esc(error)}</div>`:'';
  if(p.kind==='formal')return progress+issues+`<section class="product-section"><h2>${esc(p.name)} 已纳入产品管理</h2><dl><dt>GitHub 仓库</dt><dd>${esc(p.sync.url)}</dd><dt>本地目录</dt><dd>${esc(p.material_path)}</dd><dt>资料</dt><dd>已保存到 arckit/product/record.json · ${p.sync.status==='shared'?'已共享':'待共享'}</dd></dl><p>共享只包含产品管理记录。代码和设计正文仍按原仓库流程同步。</p>${p.receipts?.workspace?.result?.copied?`<p>已复制 ${p.receipts.workspace.result.copied.length} 个材料文件；来源保留，源码未自动提交或推送。</p><details><summary>未复制的材料（${p.receipts.workspace.result.skipped.length} 项）</summary><p>${esc(p.receipts.workspace.result.skipped.join('、') || '无')}</p></details>`:''}${button('publish','审阅并共享资料')}${button('more','继续完善产品资料')}</section>`;
  const pending=p.proposal && p.proposal.id!==d.proposal_id;
  const proposal=d.proposal_id?`<p class="idea-proposal-basis"><strong>Agent 整理的建议 · 可直接修改</strong><br>${esc(d.reason || p.proposal?.reason)}</p>`:'';
  const notice=pending?`<div class="product-notice"><strong>Agent 有新建议，你的修改已保留</strong><p>${esc(p.proposal.reason)}</p>${button('merge-proposal','查看并采用新建议')}${button('keep-edits','保留我的修改')}</div>`:'';
  const source=`<section class="idea-source"><strong>${p.material_path?'已选择材料':'空白 Idea'}</strong><p class="product-path">${esc(p.material_path || '用一句话说明你想做什么，其他内容可以边聊边完善。')}</p>${p.material_path?'<small>Agent 可读取文本和 PNG/JPEG/WebP；设计源文件请提供导出图或说明。</small>':''}<div class="product-actions">${button('folder',p.material_path?'更换材料':'添加材料',busy?'disabled':'')}</div></section>`;
  const basic=`<section class="product-section"><h2>${hasPlan?'这个 Idea':'先了解你的想法'}</h2>${proposal}${input(d.plan.mode==='create'?'Idea / 项目名称':'Idea 名称','name',d.name)+msg('plan.name')}${input('简要说明','description',d.patch.description,'textarea')}${!hasPlan?'<p>不必先写完整需求。描述它解决什么问题，或直接让 Agent 从材料中整理。</p>':''}</section>`;
  const plan=d.plan;
  const interaction=intakeInteraction(p,snapshot,plan),directory=interaction.fields['plan.directory'];
  const candidates=snapshot.projects || [];
  const remote=candidates.find(x=>String(x.id)===plan.project_id);
  const owners=p.environment?.github?.owners || [];
  const environmentHtml=`<section class="product-section"><details data-disclosure="environment"><summary>已检测的环境与权限</summary><p>${esc(p.environment?.git?.origin || p.environment?.git?.notice || '尚未检测材料目录 Git 信息')}</p><p>${esc(p.environment?.github?.notice || p.environment?.github?.login || 'GitHub 账号尚未核对')}</p><p>${p.environment?.checked_at?'检查时间：'+esc(p.environment.checked_at):'Agent 可按需检查，失败后仍可继续原生探索。'}</p>${(p.environment?.diagnostics || []).length?`<details data-disclosure="diagnostics"><summary>查看命令诊断（ArcOrbit 业务工具）</summary>${p.environment.diagnostics.map(x=>`<p><strong>${esc(x.stage)}</strong> · ${esc(x.error_code || (x.exit_code===0?'成功':'退出码 '+x.exit_code))}${x.timed_out?' · 超时':''}<br>${esc(x.executable || x.command || '目录/响应核对')} ${esc((x.args || []).join(' '))}<br>${esc(x.stderr || '')}</p>`).join('')}</details>`:''}${button('environment','重新检查 Git 与 GitHub',busy?'disabled':'')}</details></section>`;
  const form=`<section class="product-section idea-plan"><h2>准备怎样接入</h2><p>核对下面的项目、仓库和目录；其他产品资料可以录入后完善。</p>
    ${choose('Workshop 项目','plan.mode',plan.mode,[['create','新建项目'],['existing','关联已有项目']])}
    ${plan.mode==='existing'?choose('已有项目','plan.project_id',plan.project_id,[['','请选择'],...candidates.map(r=>[String(r.id),r.name])]):select('所属组织','plan.organization_id',plan.organization_id,[['','个人项目'],...(snapshot.organizations || []).map(o=>[String(o.id),o.name])])}
    ${plan.mode==='existing'?`<p>仓库：${esc(remote?.git_url || '所选项目尚无 GitHub 仓库')}</p>`:choose('GitHub 仓库','plan.repository',plan.repository,[['existing','使用已有仓库'],['create','新建私有仓库']])+(plan.repository==='create'?input('GitHub 主体 / 组织','plan.github_owner',plan.github_owner)+`<div class="idea-owner-options">${owners.map(o=>button('owner',esc(o.login),`data-owner="${esc(o.login)}"`)).join('')}</div>`+input('仓库名','plan.github_name',plan.github_name):input('仓库地址','plan.git_url',plan.git_url))}
    ${choose(directory.label,'plan.directory',directory.value,DIRECTORY_OPTIONS.map(o=>[o.value,o.label]))}
    <p>${esc(directory.meaning)}</p>
    <p class="product-path"><strong>正式目录位置</strong><br>${esc(directory.actual_path || '尚未选择')}</p>
    ${plan.directory==='selected'?button('workspace','选择正式目录',`data-field="plan.workspace_path" ${executing?'disabled':''}`)+msg('plan.workspace_path'):''}
    ${remote?.local_project_path?button('project-workspace','使用该项目已关联的目录')+`<p class="product-path">${esc(remote.local_project_path)}</p>`:''}
    <p>${esc(directory.material_action)}</p><small>不自动提交或上传源码。应用内部会话工作区不作为正式目录。</small>
    ${p.directory_notice?`<p class="idea-field-hint">${esc(p.directory_notice)}</p>`:''}
    <p>成员：${esc(plan.mode==='existing'?(snapshot.members || []).filter(m=>String(m.project_id)===plan.project_id).map(m=>m.name||m.username||m.user_id).join('、')||'以现有项目成员关系为准':'当前用户为创建者')}。录入后可管理成员与邀请。</p>

    </section>`;
  const summary=plan.mode==='existing'?remote?.name || '未选择':plan.name;
  const organization=plan.mode==='existing'?snapshot.organizations?.find(o=>String(o.id)===String(remote?.organization_id))?.name:snapshot.organizations?.find(o=>String(o.id)===plan.organization_id)?.name;
  const confirmation=confirming?`<section class="product-section idea-confirmation" role="region" aria-label="确认接入方案"><h2>确认这次接入</h2><dl><dt>项目</dt><dd>${plan.mode==='existing'?'关联':'创建'} ${esc(summary)}</dd><dt>组织</dt><dd>${esc(organization || '个人项目')}</dd><dt>仓库</dt><dd>${esc(plan.mode==='existing'?remote?.git_url:plan.repository==='create'?`${plan.github_owner}/${plan.github_name}（新建私有）`:plan.git_url)}</dd><dt>本地目录</dt><dd>${esc(directory.actual_path || '尚未选择')}</dd><dt>材料来源</dt><dd>${esc(interaction.locations.material_source || '空白 Idea')}</dd><dt>材料处理</dt><dd>${esc(directory.material_action)}</dd></dl><p>确认后执行以上操作并保存正式 Idea；不会自动提交或上传材料，也不会启动开发任务。</p><div class="product-actions">${primary('confirm-agent','确认并开始接入',busy||d.dirty||missing.length>0)}${button('confirm-direct','直接执行此方案',executing||d.dirty||missing.length?'disabled':'')}${button('cancel-confirm','返回修改')}</div></section>`:'';
  const receiptHtml=receipts.length?`<section class="product-section"><h2>已有执行结果</h2>${receipts.map(([k,r])=>`<p><strong>${esc(labels[k] || k)}</strong> · ${esc({completed:'已完成',started:'执行中',uncertain:'结果待核对'}[r.status] || r.status)}<br>${esc(r.result?.path || r.result?.name || r.result?.id || r.error || '')}${r.result?.copied?`<br>复制 ${r.result.copied.length} 个文件，跳过 ${(r.result.skipped || []).length} 项；原材料保留，未提交或推送。<details><summary>查看跳过项</summary>${esc((r.result.skipped || []).join('、') || '无')}</details>`:''}</p>`).join('')}<p>成功结果会保留；结果不明时，先在原平台核对并关联已有资源。</p></section>`:'';
  return progress+issues+notice+(stale?`<div class="product-error"><strong>基础资料已更新，你的输入仍保留</strong><p>最新说明：${esc(p.record.description)}</p><p>你的说明：${esc(d.patch.description)}</p><p>最新方案：${esc(p.plan?.name || p.plan?.project_id || '未设置')} / ${esc(p.plan?.git_url || p.plan?.github_name || '未设置仓库')}</p><p>你的方案：${esc(d.plan?.name || d.plan?.project_id || '未设置')} / ${esc(d.plan?.git_url || d.plan?.github_name || '未设置仓库')}</p></div>`:'')+source+basic+environmentHtml+(hasPlan?form:'')+confirmation+receiptHtml+`<div class="product-actions">${button('prepare',p.analysis?'继续整理 / 调整方案':'让 Agent 帮我整理',busy?'disabled':'')}${button('manual','直接填写接入方案',executing?'disabled':'')}${button('setup','查看 Agent 设置')}</div><details data-disclosure="advanced" class="idea-advanced"><summary>可选：产品理念、状态与核心资产</summary>${advanced}</details>`;
}
