/*
 * 产品支持链路设计稿 — 渲染逻辑
 *
 * 设计原则：
 *  - 视觉 token / 布局类全部来自 ArcOrbit Desktop styles.css（本文件不定义 token）
 *  - 内部工作台布局类对齐真实 renderer.js / index.html：
 *      Today 三栏(today-project-rail/responsibility-rail/operator)、
 *      Command(page-dashboard/command-grid)、Workbench(workbench-layout)、Recovery(recovery-card)
 *  - commandbar 用真实 workset/productScope 两级筛选（非自造 customer/project）
 *  - 功能逻辑 / seed 数据严格对齐真实代码模型：
 *      Task 7 态、Feedback status 7 态 + triage_status 3 态、
 *      FeedbackMessage sender_type(customer/developer/system) + state(draft/sent 桥2待建)、
 *      FeedbackTaskLink relation_type(converted_to)、executor 分配=认领
 *  - 用户可见文案用业务语言，不暴露 Case/Gap/triage 等协议术语
 *  - 后端零代码缺口用 `// 待建` 注释 + todo-badge 角标标注，不假装已实现
 *
 * 清理记录（相对上一版）：
 *  - 删 Work 页 automation-bar / Gap 时间线 / thread_id 展示（态势回归 Command + Workbench）
 *  - 删 customer/project 两级筛选（改真实 workset/productScope）
 *  - 删 Drafts 独立页（草稿并入 Feedback 详情对话面板，桥2）
 *  - 删 Organization→"验收与交付"重定义（Organization 复原组织治理；验收回归 Today/Command）
 *  - 删 delivery-track 产物交付推进（本期搁置）
 *  - 新增 Command / Workbench / Recovery 三视图（链路实际依赖的运行控制层，设计稿原缺）
 */
'use strict';

/* ============================================================
 * 一、状态常量与映射（严格对齐 services/workshop-api/models）
 * ============================================================ */
const TASK_STATE = {
  PENDING_REVIEW: 'pending_review', PENDING: 'pending', IN_PROGRESS: 'in_progress',
  COMPLETED: 'completed', ACCEPTED: 'accepted', CANCELLED: 'cancelled', BLOCKED: 'blocked',
};
const FB_STATUS = {
  PENDING: 'pending', ACCEPTED: 'accepted', CONVERTED: 'converted', IN_PROGRESS: 'in_progress',
  COMPLETED: 'completed', IGNORED: 'ignored', RELEASED: 'released',
};
const TRIAGE = { PENDING: 'pending', ACCEPTED: 'accepted', IGNORED: 'ignored' };
const SENDER = { CUSTOMER: 'customer', DEVELOPER: 'developer', SYSTEM: 'system' };
const RELATION = { CONVERTED_TO: 'converted_to', RELATED: 'related', DUPLICATE: 'duplicate' };
const ROLE = { OWNER: 'owner', ADMIN: 'admin', MEMBER: 'member' };
const CAP = { TRIAGE: 'triage', EXECUTE: 'execute', ACCEPT: 'accept' };

const TASK_PILL = {
  [TASK_STATE.PENDING_REVIEW]: { label: '待验收', cls: 'pending_review' },
  [TASK_STATE.PENDING]: { label: '待认领', cls: 'pending' },
  [TASK_STATE.IN_PROGRESS]: { label: '处理中', cls: 'in_progress' },
  [TASK_STATE.COMPLETED]: { label: '已解决', cls: 'completed' },
  [TASK_STATE.ACCEPTED]: { label: '已验收', cls: 'accepted' },
  [TASK_STATE.CANCELLED]: { label: '已取消', cls: 'cancelled' },
  [TASK_STATE.BLOCKED]: { label: '已阻塞', cls: 'blocked' },
};
const FB_PILL = {
  [FB_STATUS.PENDING]: { label: '待判断', cls: 'pending' },
  [FB_STATUS.ACCEPTED]: { label: '已受理', cls: 'in_progress' },
  [FB_STATUS.CONVERTED]: { label: '已流转', cls: 'in_progress' },
  [FB_STATUS.IN_PROGRESS]: { label: '处理中', cls: 'in_progress' },
  [FB_STATUS.COMPLETED]: { label: '已解决', cls: 'completed' },
  [FB_STATUS.IGNORED]: { label: '已忽略', cls: 'cancelled' },
  [FB_STATUS.RELEASED]: { label: '已交付', cls: 'accepted' },
};
function customerStatus(fb) {
  if (fb.hasPendingProgress) return { label: '有进展', hint: '待你确认或补充', cls: 'pending' };
  switch (fb.status) {
    case FB_STATUS.PENDING: return { label: '已收到', hint: '等待支持团队回复', cls: 'pending' };
    case FB_STATUS.ACCEPTED:
    case FB_STATUS.CONVERTED: return { label: '处理中', hint: '已转开发跟进', cls: 'in_progress' };
    case FB_STATUS.IN_PROGRESS: return { label: '处理中', hint: '开发处理中', cls: 'in_progress' };
    case FB_STATUS.COMPLETED: return { label: '已解决', hint: '问题已闭环', cls: 'completed' };
    case FB_STATUS.RELEASED: return { label: '已交付', hint: '产物已交付', cls: 'accepted' };
    case FB_STATUS.IGNORED: return { label: '已忽略', hint: '', cls: 'cancelled' };
    default: return { label: '已收到', hint: '', cls: 'pending' };
  }
}
const TASK_PRIO = { 0: { label: '紧急', marker: 'urgent' }, 1: { label: '高', marker: 'high' }, 2: { label: '中', marker: 'medium' }, 3: { label: '低', marker: 'low' } };
const FB_PRIO = { P1: 1, P2: 2, P3: 3 };
const STATE_TONE = {
  [TASK_STATE.PENDING_REVIEW]: 'backlog', [TASK_STATE.PENDING]: 'todo', [TASK_STATE.IN_PROGRESS]: 'progress',
  [TASK_STATE.COMPLETED]: 'review', [TASK_STATE.ACCEPTED]: 'done', [TASK_STATE.CANCELLED]: 'canceled', [TASK_STATE.BLOCKED]: 'blocked',
};
function taskStateToFeedbackStatus(taskState) {
  switch (taskState) {
    case TASK_STATE.PENDING: case TASK_STATE.PENDING_REVIEW: return FB_STATUS.CONVERTED;
    case TASK_STATE.IN_PROGRESS: case TASK_STATE.BLOCKED: return FB_STATUS.IN_PROGRESS;
    case TASK_STATE.COMPLETED: return FB_STATUS.IN_PROGRESS;
    case TASK_STATE.ACCEPTED: return FB_STATUS.COMPLETED;
    case TASK_STATE.CANCELLED: return FB_STATUS.IGNORED;
    default: return FB_STATUS.CONVERTED;
  }
}

/* ============================================================
 * 二、seed 数据（对齐真实模型字段 + workset 作用域）
 * ============================================================ */
const SEED = {
  schema_version: '2026-09-10',
  // 真实 workset（产品集）：project_ids 聚合多个项目；commandbar 两级筛选 = workset + productScope
  worksets: [
    { id: 1, name: 'Acme 试点', project_ids: [1, 2, 3] },
  ],
  active_workset_id: 1,
  selectedProjectId: 'all', // 'all' 或具体 project id
  automation: { enabled: true, queue_paused: false, concurrency_limit: 3 },
  currentUserId: 1,
  sdkCustomUserId: 'u_acme_001',
  members: [
    { id: 1, name: '张三', role: ROLE.ADMIN, caps: [CAP.TRIAGE, CAP.EXECUTE, CAP.ACCEPT] },
    { id: 2, name: '李明', role: ROLE.MEMBER, caps: [CAP.EXECUTE] },
    { id: 3, name: '陈思', role: ROLE.MEMBER, caps: [CAP.EXECUTE] },
  ],
  projects: [
    { id: 1, name: 'Acme Console', customer: 'Acme', git_url: 'https://git.example.com/acme/console', local_path: '/Users/zqs/arckit-workspaces/acme/console', participating: true, organization_id: null },
    { id: 2, name: 'Beta Portal', customer: 'Beta', git_url: 'https://git.example.com/beta/portal', local_path: '/Users/zqs/arckit-workspaces/beta/portal', participating: true, organization_id: null },
    { id: 3, name: 'Acme Admin', customer: 'Acme', git_url: 'https://git.example.com/acme/admin', local_path: '/Users/zqs/arckit-workspaces/acme/admin', participating: true, organization_id: null },
  ],
  feedbacks: [
    { id: 830160, project_id: 1, short_id: 'FB-830160', title: '导出 CSV 中文乱码',
      content: '导出的 CSV 文件用 Excel 打开后中文显示为乱码，疑似编码未设为 UTF-8 BOM。',
      status: FB_STATUS.PENDING, triage_status: TRIAGE.PENDING, type: 'issue', input_mode: 'dialog',
      custom_user_id: 'u_acme_002', user_phone: null, user_email: 'pm@acme.example',
      data: { priority: 'P2', structured: { position: '导出页', phenomenon: 'CSV 中文乱码', expect: 'Excel 正常显示中文' } },
      last_message_at: Date.now() - 1200_000, last_customer_message_at: Date.now() - 1200_000, hasPendingProgress: false,
      ai_triage: { type: 'bug', summary: 'CSV 导出编码问题，疑似缺 UTF-8 BOM', clarity: 85, impact: 60, urgency: 50, priority: 'P2', actionability: 'high', need_more_info: false, confidence: 0.68, reasoning: '明确编码关键词+位置，但置信度未达阈值' } },
    { id: 830141, project_id: 1, short_id: 'FB-830141', title: '自定义模块打开报错',
      content: '在控制台点击"自定义模块"按钮后页面白屏，控制台报 Cannot read property of undefined。',
      status: FB_STATUS.COMPLETED, triage_status: TRIAGE.ACCEPTED, type: 'issue', input_mode: 'dialog',
      custom_user_id: 'u_acme_001', user_phone: null, user_email: 'client@acme.example',
      data: { priority: 'P1', structured: { position: '自定义模块页', phenomenon: '点击后白屏', expect: '正常打开模块配置' } },
      last_message_at: Date.now() - 1200_000, last_customer_message_at: Date.now() - 3400_000, hasPendingProgress: false,
      ai_triage: { type: 'bug', summary: '自定义模块点击白屏，疑似 undefined 访问', clarity: 78, impact: 82, urgency: 70, priority: 'P1', actionability: 'high', need_more_info: false, confidence: 0.72, reasoning: '命中崩溃关键词+明确位置，信息较完整' } },
    { id: 830138, project_id: 1, short_id: 'FB-830138', title: '希望增加批量审批',
      content: '目前审批只能逐条处理，当待办多的时候效率很低，希望支持批量勾选审批。',
      status: FB_STATUS.IN_PROGRESS, triage_status: TRIAGE.ACCEPTED, type: 'suggestion', input_mode: 'dialog',
      custom_user_id: 'u_acme_002', user_phone: null, user_email: 'pm@acme.example',
      data: { priority: 'P2', structured: { position: '审批中心', phenomenon: '只能逐条审批', expect: '批量勾选后一次审批' } },
      last_message_at: Date.now() - 7200_000, last_customer_message_at: Date.now() - 9000_000, hasPendingProgress: false },
    { id: 830130, project_id: 1, short_id: 'FB-830130', title: '密码重置邮件收不到',
      content: '点击忘记密码后一直没收到重置邮件，疑似企业邮箱被过滤。',
      status: FB_STATUS.CONVERTED, triage_status: TRIAGE.ACCEPTED, type: 'issue', input_mode: 'dialog',
      custom_user_id: 'u_acme_001', user_phone: null, user_email: 'client@acme.example',
      data: { priority: 'P2', structured: { position: '忘记密码', phenomenon: '收不到重置邮件', expect: '能收到重置链接' } },
      last_message_at: Date.now() - 1800_000, last_customer_message_at: Date.now() - 1800_000, hasPendingProgress: false },
    { id: 840110, project_id: 2, short_id: 'FB-840110', title: '门户首页加载缓慢',
      content: '首次打开门户首页需要 5 秒以上，希望优化首屏加载速度。',
      status: FB_STATUS.CONVERTED, triage_status: TRIAGE.ACCEPTED, type: 'suggestion', input_mode: 'dialog',
      custom_user_id: 'u_beta_010', user_phone: null, user_email: 'ops@beta.example',
      data: { priority: 'P2', structured: { position: '门户首页', phenomenon: '首屏 5 秒+', expect: '2 秒内打开' } },
      last_message_at: Date.now() - 5400_000, last_customer_message_at: Date.now() - 5400_000, hasPendingProgress: false },
    { id: 830155, project_id: 3, short_id: 'FB-830155', title: '后台成员导出缺字段',
      content: '成员管理页导出 CSV 时缺少"最后登录"字段，希望补上。',
      status: FB_STATUS.IN_PROGRESS, triage_status: TRIAGE.ACCEPTED, type: 'suggestion', input_mode: 'dialog',
      custom_user_id: 'u_acme_003', user_phone: null, user_email: 'admin@acme.example',
      data: { priority: 'P3', structured: { position: '成员管理', phenomenon: '导出缺字段', expect: '含最后登录' } },
      last_message_at: Date.now() - 2800_000, last_customer_message_at: Date.now() - 2800_000, hasPendingProgress: false },
    // 已交付演示反馈（u_acme_001）：task 已 accepted + artifact_url 回写，客户 SDK 可见产物卡
    { id: 830098, project_id: 1, short_id: 'FB-830098', title: '批量导入报错已修复',
      content: '批量导入用户时接口报 500，已修复。',
      status: FB_STATUS.RELEASED, triage_status: TRIAGE.ACCEPTED, type: 'issue', input_mode: 'dialog',
      custom_user_id: 'u_acme_001', user_phone: null, user_email: 'client@acme.example',
      data: { priority: 'P2', structured: { position: '用户导入', phenomenon: '导入报 500', expect: '正常导入' } },
      last_message_at: Date.now() - 86400_000, last_customer_message_at: Date.now() - 86400_000, hasPendingProgress: false },
    // 有进展待确认演示反馈（u_acme_001）：草稿已发，客户侧"有进展待确认"
    { id: 830075, project_id: 1, short_id: 'FB-830075', title: '搜索结果分页丢失',
      content: '搜索后翻到第二页结果会清空。',
      status: FB_STATUS.IN_PROGRESS, triage_status: TRIAGE.ACCEPTED, type: 'issue', input_mode: 'dialog',
      custom_user_id: 'u_acme_001', user_phone: null, user_email: 'client@acme.example',
      data: { priority: 'P2', structured: { position: '搜索页', phenomenon: '翻页结果清空', expect: '保留分页' } },
      last_message_at: Date.now() - 600_000, last_customer_message_at: Date.now() - 7200_000, hasPendingProgress: true },
  ],
  // FeedbackMessage — sender_type 三态；桥2 草稿用 state:'pending_review'|'sent' 标注（FeedbackMessage.state 字段待建 migration）
  messages: [
    { id: 9007, feedback_id: 830160, sender_type: SENDER.CUSTOMER, content: '导出的 CSV 文件用 Excel 打开后中文显示为乱码，疑似编码未设为 UTF-8 BOM。', metadata: { initial: true }, state: 'sent', created_at: Date.now() - 1200_000 },
    { id: 9001, feedback_id: 830141, sender_type: SENDER.CUSTOMER, content: '在控制台点击"自定义模块"按钮后页面白屏，控制台报 Cannot read property of undefined。', metadata: { initial: true }, state: 'sent', created_at: Date.now() - 3600_000 },
    { id: 9010, feedback_id: 830141, sender_type: SENDER.SYSTEM, content: '已转为开发任务 TASK-200，已认领并启动 Codex 开发线程。', metadata: {}, state: 'sent', created_at: Date.now() - 3400_000 },
    // 桥2：closeout 生成的进展草稿（state=pending_review）— 处理人在 Feedback 详情确认后 state→sent
    { id: 9020, feedback_id: 830141, sender_type: SENDER.SYSTEM, content: '未读数刷新问题已定位：多会话并发时 WebSocket 去重逻辑遗漏了跨会话聚合，已补充聚合判断。预计随下一次发布生效，请留意更新。', metadata: { draft: true, task_id: 200 }, state: 'pending_review', created_at: Date.now() - 1200_000 },
    { id: 9002, feedback_id: 830138, sender_type: SENDER.CUSTOMER, content: '目前审批只能逐条处理，当待办多的时候效率很低，希望支持批量勾选审批。', metadata: { initial: true }, state: 'sent', created_at: Date.now() - 9000_000 },
    { id: 9003, feedback_id: 830130, sender_type: SENDER.CUSTOMER, content: '点击忘记密码后一直没收到重置邮件，疑似企业邮箱被过滤。', metadata: { initial: true }, state: 'sent', created_at: Date.now() - 1800_000 },
    { id: 9004, feedback_id: 830130, sender_type: SENDER.SYSTEM, content: '已转为开发任务 TASK-195，处理人待认领。', metadata: {}, state: 'sent', created_at: Date.now() - 1700_000 },
    { id: 9005, feedback_id: 840110, sender_type: SENDER.CUSTOMER, content: '首次打开门户首页需要 5 秒以上，希望优化首屏加载速度。', metadata: { initial: true }, state: 'sent', created_at: Date.now() - 5400_000 },
    { id: 9006, feedback_id: 830155, sender_type: SENDER.CUSTOMER, content: '成员管理页导出 CSV 时缺少"最后登录"字段，希望补上。', metadata: { initial: true }, state: 'sent', created_at: Date.now() - 2800_000 },
    // FB-830098 已交付：产物地址回写（F-07），客户 SDK 可见"已交付 + 产物指向"
    { id: 9030, feedback_id: 830098, sender_type: SENDER.CUSTOMER, content: '批量导入用户时接口报 500。', metadata: { initial: true }, state: 'sent', created_at: Date.now() - 86400_000 },
    { id: 9031, feedback_id: 830098, sender_type: SENDER.SYSTEM, content: '已交付产物，问题已闭环。部署由你方完成。', metadata: { artifact_url: 'https://builds.arckit.example/acme-console/task-189/1730000000.zip', build_id: 'BLD-189-1730000000' }, state: 'sent', created_at: Date.now() - 80000_000 },
    // FB-830075 有进展待客户确认：草稿已发送，hasPendingProgress=true
    { id: 9040, feedback_id: 830075, sender_type: SENDER.CUSTOMER, content: '搜索后翻到第二页结果会清空。', metadata: { initial: true }, state: 'sent', created_at: Date.now() - 7200_000 },
    { id: 9041, feedback_id: 830075, sender_type: SENDER.DEVELOPER, content: '分页状态丢失已定位：翻页时 query 参数未携带 offset。已修复，预计随下一次发布生效。', metadata: { source: 'progress-draft' }, state: 'sent', created_at: Date.now() - 600_000 },
  ],
  tasks: [
    { id: 198, project_id: 1, father_id: null, content: '实现批量审批功能\n在审批中心增加多选 + 批量通过/驳回能力。', state: TASK_STATE.IN_PROGRESS, executor_id: 2, creator_id: 1, priority: 2, tags: '[Feature](#ffabc101)', created_at: Date.now() - 8000_000, source_feedback_id: 830138, thread_id: 'thd_198_a1b2c3', case_id: 'CASE-198', phase: 'in_progress', gaps: [
      { id: 'G1', title: '审批数据层多选状态建模', state: 'done', evidence: 'ApprovalStore.ts 增加 selectedIds Set', at: Date.now() - 7600_000 },
      { id: 'G2', title: '批量通过/驳回 API + 权限校验', state: 'done', evidence: 'POST /batch-approve + role 中间件', at: Date.now() - 5200_000 },
      { id: 'G3', title: '审批中心多选 UI + 批量操作栏', state: 'in_progress', evidence: 'BatchActionBar 组件实现中', at: Date.now() - 800_000 },
      { id: 'G4', title: '并发场景回归测试', state: 'pending', evidence: null, at: null },
    ] },
    { id: 200, project_id: 1, father_id: null, content: '修复通知未读数不刷新\n多会话并发下未读数偶发不刷新，疑似 WebSocket 推送去重问题。', state: TASK_STATE.COMPLETED, executor_id: 3, creator_id: 1, priority: 1, tags: '[Bug](#ffff0000)', created_at: Date.now() - 4000_000, source_feedback_id: 830141, thread_id: 'thd_200_d4e5f6', case_id: 'CASE-200', phase: 'completed', gaps: [
      { id: 'G1', title: '定位 WebSocket 去重逻辑', state: 'done', evidence: 'unreadAggregator.aggregate 跨会话聚合遗漏', at: Date.now() - 3800_000 },
      { id: 'G2', title: '补跨会话聚合判断 + 单测', state: 'done', evidence: '增加 sessionId 维度去重 + jest 用例 3 条', at: Date.now() - 3000_000 },
      { id: 'G3', title: 'Git 收尾提交（runSameThreadCloseout）', state: 'done', evidence: 'commit a1b2c3d on feat/unread-fix', at: Date.now() - 2200_000 },
    ] },
    { id: 195, project_id: 1, father_id: null, content: '密码重置邮件链路排查\n检查邮件发送服务 + 企业邮箱过滤规则。', state: TASK_STATE.PENDING, executor_id: null, creator_id: 1, priority: 2, tags: '[Bug](#ffff0000)', created_at: Date.now() - 1700_000, source_feedback_id: 830130, thread_id: null, case_id: null, phase: 'queued', gaps: [] },
    { id: 210, project_id: 2, father_id: null, content: '优化门户首屏加载\n拆分首屏资源、懒加载非关键模块。', state: TASK_STATE.PENDING, executor_id: null, creator_id: 1, priority: 2, tags: '[Feature](#ffabc101)', created_at: Date.now() - 5000_000, source_feedback_id: 840110, thread_id: null, case_id: null, phase: 'queued', gaps: [] },
    { id: 215, project_id: 3, father_id: null, content: '成员导出补"最后登录"字段\n在 CSV 导出列增加 last_login_at。', state: TASK_STATE.IN_PROGRESS, executor_id: 2, creator_id: 1, priority: 3, tags: '[Feature](#ffabc101)', created_at: Date.now() - 2400_000, source_feedback_id: 830155, thread_id: 'thd_215_g7h8i9', case_id: 'CASE-215', phase: 'in_progress', gaps: [
      { id: 'G1', title: 'CSV 导出列定义定位', state: 'done', evidence: 'exportMembers 的 columns 数组', at: Date.now() - 2000_000 },
      { id: 'G2', title: '增加 last_login_at 列', state: 'in_progress', evidence: '对接 user.last_login_at 字段', at: Date.now() - 200_000 },
    ] },
  ],
  task_links: [
    { feedback_id: 830138, task_id: 198, relation_type: RELATION.CONVERTED_TO, is_primary: true, created_by: 1 },
    { feedback_id: 830141, task_id: 200, relation_type: RELATION.CONVERTED_TO, is_primary: true, created_by: 1 },
    { feedback_id: 830130, task_id: 195, relation_type: RELATION.CONVERTED_TO, is_primary: true, created_by: 1 },
    { feedback_id: 840110, task_id: 210, relation_type: RELATION.CONVERTED_TO, is_primary: true, created_by: 1 },
    { feedback_id: 830155, task_id: 215, relation_type: RELATION.CONVERTED_TO, is_primary: true, created_by: 1 },
  ],
  knowledge_sources: [
    { id: 1, project_id: 1, name: 'Acme Console 代码仓库', type: '代码仓库', status: '已同步', scope: 'project', retrieve_kind: 'code', doc_count: 1284, last_synced: Date.now() - 7200_000, repo_url: 'https://git.example.com/acme/console' },
    { id: 2, project_id: 1, name: 'Acme 产品文档', type: '项目文档', status: '已同步', scope: 'project', retrieve_kind: 'doc', doc_count: 96, last_synced: Date.now() - 14400_000, repo_url: 'https://gitlab.example.com/acme/docs' },
    { id: 3, project_id: 1, name: 'Acme 常见问题', type: 'FAQ', status: '索引中', scope: 'project', retrieve_kind: 'faq', doc_count: 0, last_synced: null, repo_url: null },
    { id: 4, project_id: 2, name: 'Beta 代码仓库', type: '代码仓库', status: '已同步', scope: 'project', retrieve_kind: 'code', doc_count: 842, last_synced: Date.now() - 21600_000, repo_url: 'https://git.example.com/beta/portal' },
    { id: 6, project_id: 3, name: 'Acme Admin 代码仓库', type: '代码仓库', status: '已同步', scope: 'project', retrieve_kind: 'code', doc_count: 612, last_synced: Date.now() - 10800_000, repo_url: 'https://git.example.com/acme/admin' },
    { id: 7, project_id: 3, name: 'Acme Admin 文档', type: '项目文档', status: '未同步', scope: 'project', retrieve_kind: 'doc', doc_count: 0, last_synced: null, repo_url: 'https://gitlab.example.com/acme/admin-docs' },
    { id: 5, name: '共享产品知识库（arckit-spec）', type: '公共知识', status: '已同步', scope: 'public', retrieve_kind: 'doc', doc_count: 320, last_synced: Date.now() - 86400_000, repo_url: 'https://github.com/arckit/arckit-spec' },
  ],
  // 组织治理 scope（对齐真实 platform.organization_scopes：个人项目 + 各组织）
  organization_scopes: [
    { id: 'personal', name: '个人项目', role: 'owner', project_visibility: 'personal', project_ids: [1, 2, 3] },
    { id: 1, name: 'Acme 企业', role: 'admin', project_visibility: 'all', project_ids: [1, 3] },
  ],
  organization_section: 'projects',
  selected_org_scope: 'personal',
  selected_org_project: null,
};

/* ============================================================
 * 三、state 管理
 * ============================================================ */
const STORAGE_KEY = 'arcorbit-support-v3';
const SCHEMA_VERSION = '2026-09-10';
let state = loadState();

function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed && parsed.schema_version === SCHEMA_VERSION && Array.isArray(parsed.worksets)) return parsed;
      localStorage.removeItem(STORAGE_KEY);
    }
  } catch (e) { localStorage.removeItem(STORAGE_KEY); }
  return structuredClone(SEED);
}
function saveState() { localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); }
function resetState() { state = structuredClone(SEED); saveState(); render(); }

/* ============================================================
 * 四、工具函数
 * ============================================================ */
function esc(s) { return String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c])); }
function fmtDate(ts) { const d = new Date(ts); const pad = (n) => String(n).padStart(2, '0'); return `${d.getMonth() + 1}月${d.getDate()}日 ${pad(d.getHours())}:${pad(d.getMinutes())}`; }
function fmtRelative(ts) {
  if (!ts) return '—';
  const diff = Date.now() - ts;
  if (diff < 60_000) return '刚刚';
  if (diff < 3600_000) return `${Math.floor(diff / 60_000)} 分钟前`;
  if (diff < 86400_000) return `${Math.floor(diff / 3600_000)} 小时前`;
  return `${Math.floor(diff / 86400_000)} 天前`;
}
function memberById(id) { return state.members.find((m) => m.id === id); }
function memberName(id) { const m = memberById(id); return m ? m.name : '未指派'; }
function memberInitial(id) { const m = memberById(id); return m ? m.name[0] : '?'; }
function taskById(id) { return state.tasks.find((t) => t.id === id); }
function fbById(id) { return state.feedbacks.find((f) => f.id === id); }
function linkForFeedback(fbId) { return state.task_links.find((l) => l.feedback_id === fbId); }
function linkForTask(taskId) { return state.task_links.find((l) => l.task_id === taskId); }
function taskShortId(id) { return 'TASK-' + String(id).padStart(3, '0'); }
function newShortId(prefix, n) { return prefix + '-' + String(n); }
function firstLine(s) { return String(s).split('\n')[0]; }
function prioTag(p) { return p == null ? null : ({ 0: 'P1', 1: 'P1', 2: 'P2', 3: 'P3' }[p]); }
function projectById(id) { return state.projects.find((p) => p.id === id); }
function customerOf(projectId) { const p = projectById(projectId); return p ? p.customer : null; }

/* 真实 workset/productScope 两级作用域（对齐 platform-coordinator + renderer renderWorkset）*/
function activeWorkset() { return state.worksets.find((w) => w.id === state.active_workset_id) || state.worksets[0]; }
function scopeProjectIds() {
  const ws = activeWorkset();
  const ids = ws ? ws.project_ids : state.projects.map((p) => p.id);
  if (state.selectedProjectId !== 'all') return ids.filter((id) => id === Number(state.selectedProjectId));
  return ids;
}
function inScope(projectId) { return scopeProjectIds().includes(projectId); }
function isSingleProject() { return state.selectedProjectId !== 'all'; }
function currentProject() { return isSingleProject() ? projectById(Number(state.selectedProjectId)) : null; }
function scopeLabel() {
  const ws = activeWorkset();
  if (isSingleProject()) { const p = currentProject(); return p ? `${p.customer} · ${p.name}` : '未选择'; }
  return ws ? `${ws.name} · 全部项目` : '所有项目';
}
function projectFbs() { return state.feedbacks.filter((f) => inScope(f.project_id)); }
function projectTasks() { return state.tasks.filter((t) => inScope(t.project_id)); }
function projectKnowledge() { return state.knowledge_sources.filter((k) => k.scope !== 'project' || inScope(k.project_id)); }
// 草稿 = FeedbackMessage(sender_type=system, state=pending_review)（桥2 落点并入 Feedback 详情）
function draftMessages() { return state.messages.filter((m) => m.sender_type === SENDER.SYSTEM && m.state === 'pending_review'); }
function draftForFeedback(fbId) { return state.messages.find((m) => m.feedback_id === fbId && m.sender_type === SENDER.SYSTEM && m.state === 'pending_review'); }
function pendingQueue() { return projectTasks().filter((t) => t.state === TASK_STATE.PENDING).sort((a, b) => a.created_at - b.created_at); }
function automationEligible(task) {
  const proj = projectById(task.project_id);
  if (!proj) return { ok: false, reason: '项目未找到' };
  if (!state.automation.enabled) return { ok: false, reason: '自动领取已关闭' };
  if (state.automation.queue_paused) return { ok: false, reason: '队列已暂停' };
  if (!proj.local_path) return { ok: false, reason: '未绑定本地工作区' };
  if (!proj.participating) return { ok: false, reason: '项目未允许自动领取' };
  if (!task.executor_id) return { ok: false, reason: '未认领' };
  return { ok: true, reason: '可执行' };
}

/* ============================================================
 * 四-B、智能客服两层知识库检索（模拟 — 后端待建）
 * ============================================================ */
const CONFIDENCE_THRESHOLD = 0.7;
const PRODUCT_KB = [
  { kw: ['登录', 'login', '账号', '密码'], title: '如何登录控制台', snippet: '在登录页输入企业邮箱+密码，支持 SSO 单点登录。', source: 'product_lib', type: 'faq', score: 0.8 },
  { kw: ['批量审批', '审批'], title: '批量审批使用指南', snippet: '审批中心支持多选后一次通过/驳回。', source: 'product_lib', type: 'doc', score: 0.78 },
  { kw: ['用法', '操作', '怎么用'], title: '产品使用指引', snippet: '左侧导航选择模块，顶部"更多"含操作指引。', source: 'product_lib', type: 'faq', score: 0.65 },
  { kw: ['邮箱', '重置', '收不到'], title: '密码重置邮件排查', snippet: '检查企业邮箱过滤规则，重置邮件可能被归类到隔离区。', source: 'product_lib', type: 'faq', score: 0.7 },
];
const CUSTOM_CODE_KB = [
  { kw: ['自定义模块', '白屏', '报错', 'undefined'], title: 'CustomModulePanel.tsx · openModule()', snippet: '点击后读取 moduleConfig，未做空值守卫，config 为 undefined 时白屏。', source: 'customer_lib', type: 'code', score: 0.84 },
  { kw: ['未读', '刷新', 'websocket'], title: 'unreadAggregator.ts · aggregate()', snippet: '多会话并发去重逻辑遗漏跨会话聚合，导致未读数偶发不刷新。', source: 'customer_lib', type: 'code', score: 0.86 },
];
function sdkRetrieve(query) {
  const q = (query || '').toLowerCase();
  if (!q) return { hits: [], confidence: 0, draft_reply: '', need_collect: true };
  const matchKb = (kb) => kb.filter((item) => item.kw.some((k) => q.includes(k.toLowerCase())));
  const custHits = matchKb(CUSTOM_CODE_KB).map((h) => ({ ...h, project: currentProject()?.name }));
  const prodHits = matchKb(PRODUCT_KB);
  const hits = [...custHits, ...prodHits].sort((a, b) => b.score - a.score).slice(0, 3);
  const confidence = hits.length ? hits[0].score : 0;
  const need_collect = confidence < CONFIDENCE_THRESHOLD;
  const draft_reply = hits.length && !need_collect
    ? `${hits[0].snippet}\n\n（来源：${hits[0].source === 'customer_lib' ? '你的项目代码' : '产品知识库'} · 置信度 ${(confidence * 100).toFixed(0)}%）`
    : '';
  return { hits, confidence, draft_reply, need_collect };
}

/* ============================================================
 * 五、主渲染分发
 * ============================================================ */
function render() {
  const page = document.body.dataset.page;
  if (page === 'sdk') renderSdk();
  else if (page === 'workbench') renderInternal();
  else if (page === 'demo') renderDemo();
  saveState();
}

/* ============================================================
 * 六、客户端 SDK 渲染（01-客户端支持助手）— 保持不变
 * ============================================================ */
let sdkView = 'chat';
let sdkConversation = [];
let sdkCollecting = null;
let sdkSelectedFeedbackId = null;

function renderSdk() {
  const app = document.getElementById('app');
  if (sdkConversation.length === 0) {
    sdkConversation = [{ role: 'assistant', text: '你好！我是 Acme 产品支持助手。遇到问题可以直接问，能帮你查到的我直接答；需要人工跟进的，我帮你记录下来，团队处理完会同步给你。', ts: Date.now() }];
  }
  const tab = sdkView === 'mine' ? renderSdkMine() : renderSdkChat();
  app.innerHTML = `
    <div class="sdk-shell">
      <div class="sdk-header">
        <h1>有问题？先问问支持助手 <span class="todo-badge" title="智能客服：两层知识库 + 置信度阈值 — 后端待建">待建·智能客服</span></h1>
        <p>能答的我直接答，答不了的帮你记录并跟进进度。</p>
      </div>
      <div class="sdk-tabs">
        <button class="sdk-tab ${sdkView === 'chat' ? 'is-active' : ''}" data-sdk-tab="chat">对话</button>
        <button class="sdk-tab ${sdkView === 'mine' ? 'is-active' : ''}" data-sdk-tab="mine">我的反馈</button>
      </div>
      ${tab}
    </div>`;
}
function renderSdkChat() {
  const msgs = sdkConversation.map((m, i) => renderImBubble(m, i)).join('');
  const collectCard = sdkCollecting ? renderSdkSummaryCard() : '';
  const placeholder = sdkCollecting ? '补充位置 / 现象 / 期望，发送后自动更新整理…' : '描述你遇到的问题…（可说明页面、现象、期望）';
  return `<div class="sdk-conversation">${msgs}${collectCard}</div><div class="sdk-composer"><textarea id="sdkInput" placeholder="${placeholder}"></textarea><button class="primary-button" id="sdkSend">发送</button></div>`;
}
function renderImBubble(m, idx) {
  const prev = sdkConversation[idx - 1];
  const showAvatar = !prev || prev.role !== m.role;
  const ts = m.ts ? fmtRelative(m.ts) : '';
  if (m.role === 'user') {
    return `<div class="im-row im-mine"><div class="im-bubble-wrap">${ts ? `<time>${ts}</time>` : ''}<div class="im-bubble im-bubble-mine">${esc(m.text)}</div></div>${showAvatar ? '<span class="im-avatar im-avatar-mine">我</span>' : '<span class="im-avatar im-avatar-hidden"></span>'}</div>`;
  }
  if (m.retrieval) {
    return `<div class="im-row im-cs">${showAvatar ? '<span class="im-avatar im-avatar-cs">AI</span>' : '<span class="im-avatar im-avatar-hidden"></span>'}<div class="im-bubble-wrap">${showAvatar ? '<span class="im-name">支持助手</span>' : ''}${renderRetrievalCard(m.retrieval)}${ts ? `<time>${ts}</time>` : ''}</div></div>`;
  }
  return `<div class="im-row im-cs">${showAvatar ? '<span class="im-avatar im-avatar-cs">AI</span>' : '<span class="im-avatar im-avatar-hidden"></span>'}<div class="im-bubble-wrap">${showAvatar ? '<span class="im-name">支持助手</span>' : ''}<div class="im-bubble im-bubble-cs">${esc(m.text)}</div>${ts ? `<time>${ts}</time>` : ''}</div></div>`;
}
function renderRetrievalCard(r) {
  if (!r.hits || !r.hits.length) return `<div class="im-bubble im-bubble-cs"><span class="retrieval-empty">未在知识库中找到匹配，帮你记录下来转给团队跟进。</span></div>`;
  const confLabel = r.confidence >= CONFIDENCE_THRESHOLD ? '高置信·直接回复' : '低置信·转人工';
  const confCls = r.confidence >= CONFIDENCE_THRESHOLD ? 'high' : 'low';
  const hitsHtml = r.hits.map((h) => `<div class="retrieval-hit ${h.source}"><div class="retrieval-hit-head"><span class="retrieval-source ${h.source}">${h.source === 'customer_lib' ? '你的项目代码' : '产品知识库'}</span><span class="retrieval-type">${h.type === 'code' ? '代码符号' : h.type === 'faq' ? 'FAQ' : '文档'}</span><span class="retrieval-score">${(h.score * 100).toFixed(0)}%</span></div><strong>${esc(h.title)}</strong><p>${esc(h.snippet)}</p></div>`).join('');
  const draft = r.draft_reply ? `<div class="retrieval-draft"><span class="retrieval-draft-label">拟回复</span><p>${esc(r.draft_reply)}</p></div>` : '';
  return `<div class="retrieval-card"><div class="retrieval-head"><strong>知识库检索</strong><span class="retrieval-confidence ${confCls}">${confLabel} · ${(r.confidence * 100).toFixed(0)}%</span></div><div class="retrieval-hits">${hitsHtml}</div>${draft}</div>`;
}
function renderSdkSummaryCard() {
  const c = sdkCollecting;
  return `<div class="sdk-summary-card"><div class="summary-head"><strong>帮你整理一下</strong><span class="status-pill pending">待确认</span></div><div class="summary-fields"><div class="summary-field"><span>位置</span><span>${esc(c.position || '（待补充）')}</span></div><div class="summary-field"><span>现象</span><span>${esc(c.phenomenon || '（待补充）')}</span></div><div class="summary-field"><span>期望</span><span>${esc(c.expect || '（待补充）')}</span></div></div><div class="summary-actions"><button class="secondary-button" data-sdk-action="edit">再改改</button><button class="primary-button" data-sdk-action="confirm">确认提交</button></div></div>`;
}
let sdkMineFilter = 'all';
function renderSdkMine() {
  let mine = state.feedbacks.filter((f) => f.custom_user_id === state.sdkCustomUserId);
  mine = mine.slice().sort((a, b) => b.last_message_at - a.last_message_at);
  if (sdkSelectedFeedbackId) {
    const fb = fbById(sdkSelectedFeedbackId);
    if (!fb) { sdkSelectedFeedbackId = null; return renderSdkMine(); }
    const cs = customerStatus(fb);
    const msgs = state.messages.filter((m) => m.feedback_id === fb.id).sort((a, b) => a.created_at - b.created_at);
    const timeline = msgs.map((m) => {
      const label = m.sender_type === SENDER.CUSTOMER ? '你' : m.sender_type === SENDER.DEVELOPER ? '支持团队' : '系统';
      return `<div class="activity-line"><i></i><div><strong>${label}</strong> · ${fmtRelative(m.created_at)}<br>${esc(m.content)}</div></div>`;
    }).join('');
    const latest = msgs.length ? msgs[msgs.length - 1] : null;
    const preview = latest && latest.sender_type !== SENDER.CUSTOMER ? `<div class="sdk-progress-preview">${esc(latest.content)}</div>` : '';
    const artMsg = msgs.find((m) => m.metadata && m.metadata.artifact_url);
    const artifactCard = artMsg ? `<div class="sdk-artifact-card"><div class="sdk-artifact-head"><strong>已交付产物</strong><span class="status-pill accepted">已交付</span></div><code>${esc(artMsg.metadata.artifact_url)}</code><p>构建产物已交付，复制地址下载（部署由你方完成）。</p></div>` : '';
    const lk = linkForFeedback(fb.id);
    const tk = lk ? taskById(lk.task_id) : null;
    const active = tk && [TASK_STATE.IN_PROGRESS, TASK_STATE.PENDING_REVIEW, TASK_STATE.COMPLETED].includes(tk.state);
    // US-02：客户确认收到进展（hasPendingProgress 时显示闭环按钮）
    const ackProgress = fb.hasPendingProgress ? `<div style="margin:10px 0;display:flex;gap:8px;align-items:center;"><button class="primary-button" data-sdk-ack="${fb.id}" style="min-height:30px;font-size:var(--type-caption);">确认收到进展</button><span style="color:var(--ink-500);font-size:var(--type-caption);">或直接补充追问</span></div>` : '';
    // 桥3：活跃 Case → steer 注入；无活跃 → 人工兜底
    const steerHint = active ? `<div class="sdk-steer-hint"><span class="todo-badge" title="桥3：追问注入同一 Codex 线程（硬关联门控）">桥3·注入开发线程</span><span>你的追问会基于当前开发进展回复，团队确认后发送。</span></div>` : (fb.status === FB_STATUS.RELEASED ? '' : `<div class="sdk-steer-hint" style="border-style:solid;border-color:var(--ink-200);background:var(--ink-50);"><span class="todo-badge" title="桥3兜底：无活跃 Case，转人工回复">人工回复</span><span>当前无活跃开发线程，追问将转支持团队人工回复。</span></div>`);
    return `<div class="sdk-feedback-detail"><div class="sdk-back-bar"><button class="text-button" data-sdk-back type="button">← 返回我的反馈</button></div><div class="detail-head"><span class="status-pill ${cs.cls}">${cs.label}</span><h2>${esc(fb.title)}</h2><span class="task-tag">${fb.short_id}</span></div><p class="sdk-detail-hint">${cs.hint}</p><div class="feedback-content-quote">${esc(fb.content)}</div>${artifactCard}${preview}${ackProgress}<div class="detail-section-title">处理进度</div>${timeline || '<p style="color:var(--ink-400);font-size:var(--type-caption)">暂无进展记录</p>'}<div class="detail-section-title">补充信息</div>${steerHint}<div class="sdk-composer" style="border-top:0;padding:0;"><textarea id="sdkSupplement" placeholder="补充说明或追问…"></textarea><button class="primary-button" data-sdk-supplement="${fb.id}">发送</button></div></div>`;
  }
  const filtered = mine.filter((f) => {
    if (sdkMineFilter === 'all') return true;
    const cs = customerStatus(f);
    if (sdkMineFilter === 'received') return cs.label === '已收到';
    if (sdkMineFilter === 'processing') return cs.label === '处理中';
    if (sdkMineFilter === 'progress') return cs.label === '有进展';
    if (sdkMineFilter === 'resolved') return cs.label === '已解决';
    return true;
  });
  const filters = [{ key: 'all', label: '全部' }, { key: 'received', label: '已收到' }, { key: 'processing', label: '处理中' }, { key: 'progress', label: '有进展' }, { key: 'resolved', label: '已解决' }];
  const filterBar = `<div class="sdk-mine-filters">${filters.map((f) => `<button class="sdk-mine-filter ${sdkMineFilter === f.key ? 'is-active' : ''}" data-sdk-mine-filter="${f.key}" type="button">${f.label}</button>`).join('')}</div>`;
  const realtimeHint = `<div class="sdk-realtime-hint" title="SDK 实时推送 — 后端待建（workshop-api 已有 per-project cursor，SDK 侧未接）"><span class="pulse"></span>实时推送待建 · 当前需手动刷新 <span class="todo-badge" style="margin-left:auto;">待建·SDK实时</span></div>`;
  return `<div class="sdk-mine-pane">${filterBar}${realtimeHint}<div class="sdk-feedback-list">${renderSdkFeedbackList(filtered) || '<div class="empty-panel"><strong>没有匹配的反馈</strong><p>换个筛选条件，或在对话里反馈新问题。</p></div>'}</div></div>`;
}
function renderSdkFeedbackList(mine) {
  return mine.map((fb) => {
    const cs = customerStatus(fb);
    const msgs = state.messages.filter((m) => m.feedback_id === fb.id).sort((a, b) => a.created_at - b.created_at);
    const latest = msgs.length ? msgs[msgs.length - 1] : null;
    const latestPreview = latest && latest.sender_type !== SENDER.CUSTOMER ? `<p class="sdk-list-preview">${esc(latest.content)}</p>` : '';
    return `<button class="feedback-list-item" data-sdk-fb="${fb.id}" type="button"><div class="feedback-list-copy"><strong>${esc(fb.title)}</strong><small>${fb.short_id}</small></div><div class="feedback-list-meta"><span class="status-pill ${cs.cls}">${cs.label}</span><time>${fmtRelative(fb.last_message_at)}</time></div>${latestPreview}</button>`;
  }).join('');
}
function sdkHandleQuick(key) {
  if (key === 'mine') { sdkView = 'mine'; sdkSelectedFeedbackId = null; render(); return; }
  sdkView = 'chat';
  if (key === 'usage') {
    sdkConversation.push({ role: 'user', text: '产品怎么用？', ts: Date.now() });
    const r = sdkRetrieve('用法 操作 怎么用');
    sdkConversation.push({ role: 'assistant', retrieval: r, ts: Date.now() + 120 });
    if (r.confidence >= CONFIDENCE_THRESHOLD) sdkConversation.push({ role: 'assistant', text: '需要更具体的指引，告诉我你在用哪个功能。', ts: Date.now() + 200 });
  } else if (key === 'account') {
    sdkConversation.push({ role: 'user', text: '账号和登录怎么配置？', ts: Date.now() });
    const r = sdkRetrieve('登录 账号 密码');
    sdkConversation.push({ role: 'assistant', retrieval: r, ts: Date.now() + 120 });
    if (r.confidence >= CONFIDENCE_THRESHOLD) sdkConversation.push({ role: 'assistant', text: '如需修改个人信息或绑定邮箱，可在右上角头像 → 账号设置中操作。', ts: Date.now() + 200 });
  } else if (key === 'report') {
    sdkConversation.push({ role: 'user', text: '我要反馈一个问题', ts: Date.now() });
    sdkConversation.push({ role: 'assistant', text: '好的，帮你记录。请告诉我：在哪个页面遇到？什么现象？你期望的结果是？', ts: Date.now() + 200 });
    sdkCollecting = { position: '', phenomenon: '', expect: '' };
  }
  render(); scrollConversationDown();
}
function sdkHandleSend() {
  const input = document.getElementById('sdkInput');
  const text = (input?.value || '').trim();
  if (!text) return;
  sdkConversation.push({ role: 'user', text, ts: Date.now() });
  input.value = '';
  if (!sdkCollecting) {
    const r = sdkRetrieve(text);
    if (r.hits.length && r.confidence >= CONFIDENCE_THRESHOLD) {
      sdkConversation.push({ role: 'assistant', retrieval: r, ts: Date.now() + 120 });
      sdkConversation.push({ role: 'assistant', text: `以上是我从${r.hits[0].source === 'customer_lib' ? '你的项目代码' : '产品知识库'}中查到的，希望能帮到你。如果没解决，可以继续描述问题，我帮你记录转给团队跟进。`, ts: Date.now() + 200 });
    } else {
      sdkConversation.push({ role: 'assistant', retrieval: r, ts: Date.now() + 120 });
      sdkCollecting = { position: '', phenomenon: text, expect: '' };
      sdkConversation.push({ role: 'assistant', text: '这个我不太确定，帮你记录下来转给团队跟进。请补充：在哪个页面遇到？你期望的结果是？', ts: Date.now() + 200 });
    }
  } else {
    if (!sdkCollecting.position) sdkCollecting.position = text;
    else if (!sdkCollecting.expect) sdkCollecting.expect = text;
    sdkConversation.push({ role: 'assistant', text: '好的，已记录。可在确认卡里修改后提交。', ts: Date.now() + 200 });
  }
  render(); scrollConversationDown();
}
function scrollConversationDown() { const conv = document.querySelector('.sdk-conversation'); if (conv) setTimeout(() => { conv.scrollTop = conv.scrollHeight; }, 50); }
function sdkHandleAction(action) {
  if (action === 'edit') {
    sdkConversation.push({ role: 'assistant', text: '请在下方补充位置 / 现象 / 期望，我会更新整理。', ts: Date.now() });
    render(); scrollConversationDown();
    const ta = document.querySelector('.sdk-composer textarea'); if (ta) ta.focus();
    return;
  }
  if (action === 'confirm') {
    const c = sdkCollecting;
    if (!c) return;
    const id = Math.max(...state.feedbacks.map((f) => f.id)) + 1;
    const fb = {
      id, short_id: newShortId('FB', id), title: firstLine(c.phenomenon || '客户反馈') || '客户反馈',
      content: [c.position && `位置：${c.position}`, c.phenomenon && `现象：${c.phenomenon}`, c.expect && `期望：${c.expect}`].filter(Boolean).join('\n'),
      status: FB_STATUS.PENDING, triage_status: TRIAGE.PENDING, type: 'issue', input_mode: 'dialog',
      custom_user_id: state.sdkCustomUserId, user_phone: null, user_email: 'client@acme.example',
      data: { priority: 'P2', structured: c }, last_message_at: Date.now(), last_customer_message_at: Date.now(), hasPendingProgress: false, project_id: 1,
    };
    state.feedbacks.unshift(fb);
    state.messages.push({ id: Date.now(), feedback_id: id, sender_type: SENDER.CUSTOMER, content: fb.content, metadata: { initial: true }, state: 'sent', created_at: Date.now() });
    sdkConversation.push({ role: 'assistant', text: `已记录，编号 ${fb.short_id}。支持团队会尽快跟进，有进展会同步给你。`, ts: Date.now() });
    sdkCollecting = null;
    render(); scrollConversationDown();
  }
}

/* ============================================================
 * 七、内部工作台渲染（02-内部工作台）— 重写，7 视图
 * ============================================================ */
let wbView = 'today';
let wbFilter = { fb: 'all', search: '', sort: 'newest', task: 'all', assignee: 'all' };
let wbSelectedFb = null;
let wbSelectedTask = null;
let wbOrgTab = 'members';
let wbWorkbenchMode = 'review';
let wbSelectedRecovery = null;

function renderInternal() {
  renderNav();
  renderScopeFilters();
  renderViewVisibility();
  const viewLabel = { today: '今日待处理', feedback: '反馈治理', work: '任务开发', command: '执行态势', workbench: '人工介入', recovery: '异常恢复', organization: '组织治理' }[wbView];
  const pageTitleEl = document.getElementById('pageTitle');
  if (pageTitleEl) pageTitleEl.textContent = viewLabel;
  const scopeTitle = document.querySelector('.breadcrumbs strong');
  if (scopeTitle) scopeTitle.textContent = scopeLabel();
  // automation toggle 同步
  const autoToggle = document.getElementById('automationEnabled');
  if (autoToggle) autoToggle.checked = state.automation.enabled;
  // 当前身份回显
  const cu = memberById(state.currentUserId);
  const pbStrong = document.querySelector('.profile-button strong');
  const pbSmall = document.querySelector('.profile-button small');
  const pbAvatar = document.querySelector('.profile-button .account-avatar');
  if (pbStrong && cu) pbStrong.textContent = cu.name;
  if (pbSmall && cu) pbSmall.textContent = cu.role === ROLE.MEMBER ? 'member · 无分诊权' : '处理人';
  if (pbAvatar && cu) pbAvatar.textContent = cu.name[0];
  if (wbView === 'today') renderTodayView();
  else if (wbView === 'feedback') renderFeedbackView();
  else if (wbView === 'work') renderWorkView();
  else if (wbView === 'command') renderCommandView();
  else if (wbView === 'workbench') renderWorkbenchView();
  else if (wbView === 'recovery') renderRecoveryView();
  else if (wbView === 'organization') renderOrgView();
}

/* 真实 workset/productScope 两级筛选（对齐 renderer renderWorkset）*/
function renderScopeFilters() {
  const wsSel = document.getElementById('worksetSelect');
  const psSel = document.getElementById('productScopeSelect');
  if (!wsSel || !psSel) return;
  const ws = activeWorkset();
  wsSel.innerHTML = state.worksets.map((w) => `<option value="${w.id}" ${w.id === state.active_workset_id ? 'selected' : ''}>${esc(w.name)} · ${w.project_ids.length}</option>`).join('');
  const projects = ws ? ws.project_ids.map((id) => projectById(id)).filter(Boolean) : state.projects;
  psSel.innerHTML = `<option value="all" ${state.selectedProjectId === 'all' ? 'selected' : ''}>项目集全部 · ${projects.length}</option>` + projects.map((p) => `<option value="${p.id}" ${String(state.selectedProjectId) === String(p.id) ? 'selected' : ''}>${esc(p.name)}</option>`).join('');
}

function renderNav() {
  const nav = document.getElementById('primaryNav');
  const pFbs = projectFbs();
  const pTasks = projectTasks();
  const items = [
    { group: 'PERSONAL', items: [
      { view: 'today', label: 'Today', em: String(pFbs.filter((f) => f.triage_status === TRIAGE.PENDING).length + pTasks.filter((t) => t.state === TASK_STATE.PENDING && !t.executor_id).length + draftMessages().length + pTasks.filter((t) => t.state === TASK_STATE.PENDING_REVIEW).length), icon: 'today' },
    ] },
    { group: 'SUPPORT LIFECYCLE', items: [
      { view: 'feedback', label: 'Feedback', em: String(pFbs.filter((f) => f.triage_status === TRIAGE.PENDING).length), icon: 'feedback' },
      { view: 'work', label: 'Work', em: String(pTasks.filter((t) => t.state === TASK_STATE.IN_PROGRESS).length), icon: 'work' },
      // Command 角标含 attention（含 recovery 项：blocked task 等）— Workbench/Recovery 是 Command 的下钻子页，不独立入导航（对齐真实 renderer.js:1664）
      { view: 'command', label: 'Command', em: String(pTasks.filter((t) => [TASK_STATE.IN_PROGRESS, TASK_STATE.COMPLETED, TASK_STATE.PENDING].includes(t.state)).length + pTasks.filter((t) => t.state === TASK_STATE.BLOCKED).length), icon: 'automation' },
    ] },
    { group: 'GOVERNANCE', items: [
      { view: 'organization', label: 'Organization', em: '', icon: 'organization' },
    ] },
  ];
  nav.innerHTML = items.map((g) => `<p class="nav-label">${g.group}</p>${g.items.map((it) => `<button class="nav-item ${it.view === wbView ? 'is-active' : ''}" data-wb-view="${it.view}" type="button"><svg class="ui-icon" aria-hidden="true"><use href="#icon-${it.icon}"></use></svg><strong>${it.label}</strong><em>${it.em || ''}</em></button>`).join('')}`).join('');
}

function renderViewVisibility() {
  document.querySelectorAll('[data-page-view]').forEach((v) => v.classList.toggle('is-active', v.dataset.pageView === wbView));
}

/* ---- Today 首页：真实三栏（today-project-rail / today-responsibility-rail / today-operator）---- */
function todayResponsibilities() {
  // 对齐 deriveTodayWorkspace 责任类型，映射到支持链路
  const items = [];
  projectFbs().filter((f) => f.triage_status === TRIAGE.PENDING).forEach((f) => items.push({ id: `triage:${f.id}`, kind: '分诊', title: f.title, reason: `${customerOf(f.project_id)} · ${f.short_id}`, projectId: f.project_id, view: 'feedback', fbId: f.id }));
  projectTasks().filter((t) => t.state === TASK_STATE.PENDING && !t.executor_id).forEach((t) => items.push({ id: `claim:${t.id}`, kind: '认领', title: firstLine(t.content), reason: `${customerOf(t.project_id)} · ${taskShortId(t.id)}`, projectId: t.project_id, view: 'work', taskId: t.id }));
  draftMessages().forEach((m) => { const fb = fbById(m.feedback_id); items.push({ id: `draft:${m.id}`, kind: '草稿确认', title: fb ? fb.title : '进展草稿', reason: `${fb ? fb.short_id : ''} · 待确认发送`, projectId: fb ? fb.project_id : null, view: 'feedback', fbId: m.feedback_id }); });
  projectTasks().filter((t) => t.state === TASK_STATE.PENDING_REVIEW).forEach((t) => items.push({ id: `accept:${t.id}`, kind: '验收', title: firstLine(t.content), reason: `${customerOf(t.project_id)} · ${taskShortId(t.id)}`, projectId: t.project_id, view: 'command', taskId: t.id }));
  projectTasks().filter((t) => t.state === TASK_STATE.BLOCKED).forEach((t) => items.push({ id: `blocked:${t.id}`, kind: '阻塞', title: firstLine(t.content), reason: `${customerOf(t.project_id)} · ${taskShortId(t.id)}`, projectId: t.project_id, view: 'recovery', taskId: t.id }));
  return items;
}
function renderTodayView() {
  const root = document.getElementById('viewToday');
  const items = todayResponsibilities();
  const ws = activeWorkset();
  const projects = ws ? ws.project_ids.map((id) => projectById(id)).filter(Boolean) : state.projects;
  const projectRows = projects.map((p) => {
    const cnt = items.filter((i) => i.projectId === p.id).length;
    return `<button class="today-project-row ${Number(state.selectedProjectId) === p.id ? 'is-active' : ''}" data-today-project="${p.id}" type="button"><i>${esc(p.customer[0])}</i><span><strong>${esc(p.name)}</strong><small>${esc(p.customer)}</small></span><em>${cnt}</em></button>`;
  }).join('');
  const respRows = items.length ? items.map((it) => `<button class="today-responsibility-row ${wbSelectedTask === it.id ? 'is-active' : ''}" data-today-item="${it.id}" type="button"><span class="today-responsibility-kind">${esc(it.kind)}</span><strong>${esc(it.title)}</strong><p>${esc(it.reason)}</p><small>${esc(projectById(it.projectId)?.name || '')}</small></button>`).join('') : `<div class="today-list-empty"><strong>当前范围无待处理</strong><p>支持链路各环节已清。</p></div>`;
  const operator = wbSelectedTask ? renderTodayOperator(items.find((i) => i.id === wbSelectedTask)) : `<div class="today-list-empty"><strong>选择左侧责任项</strong><p>查看详情并直达对应视图处理。</p></div>`;
  root.innerHTML = `
    <div class="today-page">
      <header class="today-heading"><div><p class="eyebrow">PERSONAL · TODAY</p><h1>今日待处理</h1><p>按支持链路聚合：分诊 → 认领 → 草稿确认 → 验收 → 阻塞恢复。</p></div><div class="today-heading-status"><span class="health-badge ${items.length ? 'warning' : 'success'}">${items.length} 项</span><small>${scopeLabel()}</small></div></header>
      <div class="today-workspace">
        <aside class="today-project-rail">
          <div class="today-rail-heading"><div><p class="eyebrow">PROJECTS</p><h2>项目</h2></div></div>
          <div class="today-project-list">
            <button class="today-project-row ${state.selectedProjectId === 'all' ? 'is-active' : ''}" data-today-project="all" type="button"><span><strong>全部项目</strong><small>${scopeLabel()}</small></span><em>${items.length}</em></button>
            ${projectRows}
          </div>
        </aside>
        <section class="today-responsibility-rail">
          <div class="today-mode-tabs" role="tablist"><button class="is-active" role="tab" type="button">需要你处理 <em>${items.length}</em></button></div>
          <div class="today-responsibility-list" aria-live="polite">${respRows}</div>
          <footer class="today-automatic-summary"><strong>链路顺序</strong><small>反馈分诊 → 认领开发 → 草稿确认 → 验收 → 恢复</small></footer>
        </section>
        <section class="today-operator" aria-live="polite">${operator}</section>
      </div>
    </div>`;
}
function renderTodayOperator(item) {
  if (!item) return '';
  return `<div style="padding:24px 28px;"><p class="eyebrow">${esc(item.kind)}</p><h2 style="margin:4px 0 10px;font-size:var(--type-title);">${esc(item.title)}</h2><p style="color:var(--ink-500);margin:0 0 16px;">${esc(item.reason)}</p><button class="primary-button" data-today-jump="${item.id}" type="button">前往${item.view === 'feedback' ? '反馈治理' : item.view === 'work' ? '任务开发' : item.view === 'command' ? '执行态势' : '异常恢复'}</button></div>`;
}

/* ---- Feedback 治理（列表 + 详情，草稿并入详情对话面板）---- */
function renderFeedbackView() {
  const root = document.getElementById('viewFeedback');
  let list = projectFbs().slice();
  if (wbFilter.fb === 'pending') list = list.filter((f) => f.triage_status === TRIAGE.PENDING);
  else if (wbFilter.fb === 'converted') list = list.filter((f) => [FB_STATUS.CONVERTED, FB_STATUS.IN_PROGRESS, FB_STATUS.COMPLETED, FB_STATUS.RELEASED].includes(f.status));
  else if (wbFilter.fb === 'ignored') list = list.filter((f) => f.triage_status === TRIAGE.IGNORED);
  if (wbFilter.search) { const q = wbFilter.search.toLowerCase(); list = list.filter((f) => [f.title, f.content, f.short_id, f.custom_user_id, f.user_email].some((s) => (s || '').toLowerCase().includes(q))); }
  if (wbFilter.sort === 'oldest') list.sort((a, b) => a.last_message_at - b.last_message_at);
  else if (wbFilter.sort === 'priority') list.sort((a, b) => (FB_PRIO[b.data.priority] || 2) - (FB_PRIO[a.data.priority] || 2));
  else list.sort((a, b) => b.last_message_at - a.last_message_at);
  const detail = wbSelectedFb ? renderFeedbackDetail(wbSelectedFb) : `<div class="empty-panel"><strong>选择一条反馈</strong><p>这里将显示用户反馈原文和可用处理动作。</p></div>`;
  root.innerHTML = `
    <div class="page platform-page feedback-page primary-workspace-page">
      <section class="panel-card primary-control-rail feedback-toolbar">
        <strong class="control-rail-identity">Feedback</strong>
        <select class="control-rail-select" data-fb-filter>
          <option value="all" ${wbFilter.fb === 'all' ? 'selected' : ''}>全部状态</option>
          <option value="pending" ${wbFilter.fb === 'pending' ? 'selected' : ''}>待判断</option>
          <option value="converted" ${wbFilter.fb === 'converted' ? 'selected' : ''}>已流转</option>
          <option value="ignored" ${wbFilter.fb === 'ignored' ? 'selected' : ''}>已忽略</option>
        </select>
        <input type="search" class="platform-filter" placeholder="搜索编号/正文/客户" data-fb-search value="${esc(wbFilter.search)}">
        <details class="feedback-more-menu"><summary>更多</summary><div class="feedback-secondary-controls"><label><span class="sr-only">排序</span><select data-fb-sort><option value="newest" ${wbFilter.sort === 'newest' ? 'selected' : ''}>最新反馈</option><option value="oldest" ${wbFilter.sort === 'oldest' ? 'selected' : ''}>最早反馈</option><option value="priority" ${wbFilter.sort === 'priority' ? 'selected' : ''}>优先级</option></select></label></div></details>
      </section>
      <div class="feedback-workbench-layout">
        <section class="panel-card feedback-list-panel">
          <div class="section-title-row"><div><span class="section-icon">◌</span><div><h2>反馈列表</h2><p>选择反馈后在右侧查看和处理</p></div></div><span class="status-pill muted">${list.length} 条</span></div>
          <div class="feedback-list workspace-pane-scroll">
            ${list.map((f) => {
              const pill = FB_PILL[f.status] || FB_PILL[FB_STATUS.PENDING];
              const prio = f.data.priority || 'P2';
              const link = linkForFeedback(f.id);
              const draft = draftForFeedback(f.id);
              return `<button class="feedback-list-item ${wbSelectedFb === f.id ? 'is-active' : ''}" data-fb-item="${f.id}" type="button"><div class="feedback-list-copy"><strong>${esc(f.title)}</strong><small>${customerOf(f.project_id)} · ${f.short_id}${link ? ' · ' + taskShortId(link.task_id) : ''}</small></div><div class="feedback-list-meta"><span class="task-tag" style="background:var(--violet-50);color:var(--violet-700);">${esc(customerOf(f.project_id))}</span><span class="status-pill ${pill.cls}">${pill.label}</span>${draft ? '<span class="todo-badge">草稿待确认</span>' : ''}<time>${fmtRelative(f.last_message_at)}</time></div></button>`;
            }).join('') || '<p style="color:var(--ink-400);padding:20px;font-size:var(--type-caption);">无匹配反馈</p>'}
          </div>
        </section>
        <aside class="inspector-card feedback-inspector">
          <div class="section-title-row"><div><span class="section-icon">◇</span><div><h2>反馈详情</h2><p>原文、处理状态与沟通记录</p></div></div></div>
          <div class="feedback-inspector-body"><div class="feedback-inspector-scroll">${detail}</div></div>
        </aside>
      </div>
    </div>`;
}
function renderFeedbackDetail(fbId) {
  const fb = fbById(fbId);
  if (!fb) return '';
  const pill = FB_PILL[fb.status];
  const prio = fb.data.priority || 'P2';
  const link = linkForFeedback(fb.id);
  const s = fb.data.structured || {};
  const msgs = state.messages.filter((m) => m.feedback_id === fb.id).sort((a, b) => a.created_at - b.created_at);
  const convo = msgs.map((m) => renderMessage(m, fb.id)).join('');
  const canConvert = !link && (fb.status === FB_STATUS.PENDING || fb.status === FB_STATUS.ACCEPTED);
  const canIgnore = fb.triage_status !== TRIAGE.IGNORED;
  const draft = draftForFeedback(fb.id);
  return `
    <div class="feedback-inspector-header">
      <div><span class="task-tag">${fb.short_id}</span><h2>${esc(fb.title)}</h2><p>客户 ${esc(fb.custom_user_id)}${fb.user_email ? ' · ' + esc(fb.user_email) : ''} · ${fmtDate(fb.last_message_at)}</p></div>
      <div style="display:flex;gap:6px;flex-wrap:wrap;"><span class="status-pill ${pill.cls}">${pill.label}</span>${fb.ai_triage ? `<span class="todo-badge" title="AI 分诊结果 · 置信度 ${(fb.ai_triage.confidence * 100).toFixed(0)}%">AI 分诊 · ${fb.ai_triage.priority}</span>` : '<span class="todo-badge" title="AI 分诊辅助 — 后端待建">待建·AI 分诊</span>'}</div>
    </div>
    <div class="feedback-field-grid">
      <div class="field-cell"><span>类型</span><span>${esc(fb.type)}</span></div>
      <div class="field-cell"><span>优先级</span><select data-fb-prio ${link ? 'disabled' : ''}>${['P1', 'P2', 'P3'].map((p) => `<option value="${p}" ${prio === p ? 'selected' : ''}>${p}</option>`).join('')}</select></div>
      <div class="field-cell"><span>位置</span><span>${esc(s.position || '—')}</span></div>
      <div class="field-cell"><span>现象</span><span>${esc(s.phenomenon || '—')}</span></div>
      <div class="field-cell" style="grid-column:1/-1;"><span>期望</span><span>${esc(s.expect || '—')}</span></div>
    </div>
    ${renderAiTriagePanel(fb)}
    <div class="feedback-content-quote">${esc(fb.content)}</div>
    ${link ? `<p style="font-size:var(--type-caption);color:var(--ink-500);margin:12px 0 4px;">关联任务 <strong style="color:var(--violet-700);">${taskShortId(link.task_id)}</strong> · <button class="text-button" data-jump="work:${link.task_id}" type="button" style="min-height:auto;padding:0;">查看任务</button></p>` : ''}
    <div class="detail-section-title">对话 ${draft ? '<span class="todo-badge" title="桥2：closeout→草稿→人工确认→发送 — 后端待建">待建·桥2</span>' : ''}</div>
    <div style="display:flex;flex-direction:column;gap:10px;">${convo || '<p style="color:var(--ink-400);font-size:var(--type-caption)">无消息</p>'}</div>
    <div class="inspector-actions">
      <button class="secondary-button" data-fb-action="reply">回复客户</button>
      <button class="primary-button" data-fb-action="convert" ${canConvert ? '' : 'disabled'}>转为开发任务</button>
      <button class="text-button danger" data-fb-action="ignore" ${canIgnore ? '' : 'disabled'}>忽略</button>
    </div>`;
}
function renderAiTriagePanel(fb) {
  const a = fb.ai_triage;
  if (!a) return '';
  const confCls = a.confidence >= 0.7 ? 'high' : 'low';
  const scoreBar = (v) => `<div class="ai-triage-score"><div class="ai-triage-score-bar" style="width:${v}%"></div></div>`;
  return `<details class="ai-triage-panel" ${a.accepted === false ? '' : 'open'}><summary class="ai-triage-head"><strong>AI 分诊初判 ${a.accepted === true ? '· 已采纳' : a.accepted === false ? '· 已人工调整' : ''}</strong><span class="retrieval-confidence ${confCls}">置信度 ${(a.confidence * 100).toFixed(0)}%</span></summary><div class="ai-triage-summary">${esc(a.summary)}</div><div class="ai-triage-fields"><div class="field-cell"><span>类型</span><span>${esc(a.type)}</span></div><div class="field-cell"><span>优先级</span><span class="task-tag" style="background:var(--amber-100);color:var(--amber-700);">${a.priority}</span></div><div class="field-cell"><span>可行动</span><span>${esc(a.actionability)}</span></div><div class="field-cell"><span>需补问</span><span>${a.need_more_info ? '是' : '否'}</span></div></div><div class="ai-triage-scores"><div><small>表达清晰 ${a.clarity}</small>${scoreBar(a.clarity)}</div><div><small>影响面 ${a.impact}</small>${scoreBar(a.impact)}</div><div><small>紧急度 ${a.urgency}</small>${scoreBar(a.urgency)}</div></div><p class="ai-triage-reasoning">${esc(a.reasoning)}</p><div class="ai-triage-actions">${a.accepted === true ? '<span class="status-pill completed">已采纳</span>' : `<button class="secondary-button" data-fb-action="triage-accept" style="min-height:28px;font-size:var(--type-caption);">采纳初判</button><button class="text-button" data-fb-action="triage-adjust" style="min-height:28px;font-size:var(--type-caption);">人工调整</button>`}</div></details>`;
}
function renderMessage(m, fbId) {
  // 桥2 草稿：pending_review system 消息渲染为可确认草稿卡
  if (m.sender_type === SENDER.SYSTEM && m.state === 'pending_review') {
    return `<div class="draft-msg"><div class="draft-msg-head"><strong>进展草稿 · 待确认</strong><span class="todo-badge" title="桥2：草稿确认后发送客户">桥2</span></div><div class="draft-msg-body">${esc(m.content)}</div><div class="draft-msg-actions"><button class="secondary-button" data-draft-edit="${m.id}" style="min-height:28px;font-size:var(--type-caption);">编辑</button><button class="primary-button" data-draft-confirm="${m.id}" style="min-height:28px;font-size:var(--type-caption);">确认发送</button></div></div>`;
  }
  if (m.sender_type === SENDER.SYSTEM) {
    return `<div style="display:flex;align-items:center;gap:8px;"><span style="height:1px;flex:1;background:var(--ink-150);"></span><span class="task-tag" style="background:var(--ink-50);border:1px solid var(--ink-150);">${esc(m.content)} · ${fmtRelative(m.created_at)}</span><span style="height:1px;flex:1;background:var(--ink-150);"></span></div>`;
  }
  const isInitial = m.metadata && m.metadata.initial;
  const label = m.sender_type === SENDER.CUSTOMER ? (isInitial ? '用户原始反馈' : '用户补充') : '开发者更新';
  const tagColor = m.sender_type === SENDER.CUSTOMER ? (isInitial ? 'var(--violet-100);color:var(--violet-700)' : 'var(--amber-100);color:var(--amber-700)') : 'var(--green-100);color:var(--green-600)';
  return `<div style="border:1px solid var(--ink-150);border-radius:var(--radius-md);padding:10px 12px;background:${m.sender_type === SENDER.DEVELOPER ? 'var(--ink-50)' : 'var(--paper)'};"><span class="task-tag" style="background:${tagColor};">${label}</span><div style="font-size:var(--type-body);color:var(--ink-800);margin-top:6px;white-space:pre-wrap;">${esc(m.content)}</div><div style="font-size:var(--type-micro);color:var(--ink-400);margin-top:4px;">${fmtRelative(m.created_at)}</div></div>`;
}

/* ---- Work 任务开发（瘦身：仅待办树 + 详情；态势跳 Command/Workbench）---- */
function renderWorkView() {
  const root = document.getElementById('viewWork');
  let pool = projectTasks();
  if (wbFilter.task !== 'all') pool = pool.filter((t) => t.state === wbFilter.task);
  if (wbFilter.assignee === 'me') pool = pool.filter((t) => t.executor_id === state.currentUserId);
  else if (wbFilter.assignee === 'unassigned') pool = pool.filter((t) => !t.executor_id);
  if (wbFilter.search) { const q = wbFilter.search.toLowerCase(); pool = pool.filter((t) => t.content.toLowerCase().includes(q)); }
  const roots = pool.filter((t) => !t.father_id);
  const groups = [...new Set(roots.map((t) => customerOf(t.project_id)))].filter(Boolean);
  const tree = groups.map((c) => { const gr = roots.filter((t) => customerOf(t.project_id) === c); return gr.length ? `<div class="task-group"><div class="task-group-head"><strong>${esc(c)}</strong><small>${gr.length} 项</small></div>${gr.map((t) => renderTaskTreeItem(t)).join('')}</div>` : ''; }).join('');
  const counts = Object.fromEntries(Object.values(TASK_STATE).map((st) => [st, projectTasks().filter((t) => t.state === st).length]));
  const stateRail = Object.values(TASK_STATE).map((st) => `<button class="work-state-filter ${wbFilter.task === st ? 'is-active' : ''}" data-work-state="${st}" type="button" aria-pressed="${wbFilter.task === st}"><span>●</span><strong>${TASK_PILL[st].label}</strong><em>${counts[st]}</em></button>`).join('');
  const detail = wbSelectedTask ? renderTaskDetail(wbSelectedTask) : `<div class="empty-panel"><strong>选择一个待办</strong><p>这里将显示任务内容、处理人与来源反馈。</p></div>`;
  root.innerHTML = `
    <div class="page platform-page primary-workspace-page work-primary-workspace">
      <section class="panel-card primary-control-rail work-control-rail">
        <strong class="control-rail-identity">Work</strong>
        <div class="work-state-filters" role="tablist" aria-label="待办状态筛选">${stateRail}</div>
        <input type="search" class="platform-filter" placeholder="搜索标题与内容" data-task-search value="${esc(wbFilter.search)}">
        <details class="control-rail-more"><summary aria-label="更多筛选">更多</summary><div><label class="work-assignee-pick"><span>执行人</span><select data-task-assignee-select><option value="all" ${wbFilter.assignee === 'all' ? 'selected' : ''}>全部执行人</option><option value="me" ${wbFilter.assignee === 'me' ? 'selected' : ''}>我的</option><option value="unassigned" ${wbFilter.assignee === 'unassigned' ? 'selected' : ''}>未认领</option></select></label><button class="secondary-button" data-task-reset type="button">重置筛选</button></div></details>
        <button class="primary-button" data-task-create type="button" style="margin-left:auto;">创建待办</button>
      </section>
      <div class="platform-work-layout">
        <section class="panel-card work-list-panel"><div class="section-title-row"><div><span class="section-icon">≡</span><div><h2>待办列表</h2><p>${pool.length} 项</p></div></div></div><div class="workspace-pane-scroll">${tree || '<p style="color:var(--ink-400);padding:20px;font-size:var(--type-caption);">无任务</p>'}</div></section>
        <div class="work-inspector-separator" role="separator" aria-orientation="vertical"></div>
        <aside class="inspector-card task-inspector platform-work-inspector"><div class="section-title-row"><div><span class="section-icon">◇</span><div><h2>待办详情</h2><p>当前选择与协作上下文</p></div></div></div><div class="workspace-pane-scroll">${detail}</div></aside>
      </div>
    </div>`;
}
function renderTaskTreeItem(t) {
  const prio = TASK_PRIO[t.priority];
  const tone = STATE_TONE[t.state];
  const tags = (t.tags || '').match(/\[([^\]]+)\]/g) || [];
  return `<div class="task-row ${wbSelectedTask === t.id ? 'is-selected' : ''}" data-task-item="${t.id}"><div class="task-quick-controls"><span class="prio-marker ${prio ? prio.marker : ''}" title="${prio ? prio.label : '无优先级'}">${t.priority === 0 ? '!' : prio ? '<span class="dot"></span><span class="dot"></span><span class="dot"></span>' : '---'}</span><span class="state-marker ${tone}" title="${TASK_PILL[t.state].label}"></span></div><div class="task-main"><span class="task-chevron" style="visibility:hidden">▸</span><span class="task-title">${esc(firstLine(t.content))}</span></div><div class="task-meta">${tags.slice(0, 2).map((tg) => `<span class="task-tag">${tg.replace(/[\[\]]/g, '')}</span>`).join('')}${t.executor_id ? `<span class="task-assignee">${esc(memberInitial(t.executor_id))}</span>` : '<span class="task-assignee is-empty">?</span>'}<span>${fmtRelative(t.created_at)}</span></div></div>`;
}
function renderTaskDetail(taskId) {
  const t = taskById(taskId);
  if (!t) return '';
  const link = linkForTask(t.id);
  const fb = link ? fbById(link.feedback_id) : null;
  const canAssign = t.state !== TASK_STATE.IN_PROGRESS || t.executor_id === state.currentUserId || t.creator_id === state.currentUserId;
  // Loop 态势：不在此展示 Gap 时间线/thread_id，跳 Command/Workbench
  const loopSummary = (() => {
    if (t.state === TASK_STATE.PENDING) {
      if (!t.executor_id) return '<span style="color:var(--ink-400);">未认领</span>';
      const elig = automationEligible(t);
      return elig.ok ? '<span style="color:var(--violet-700);">已认领 · 等待 Codex 线程启动</span>' : `<span style="color:var(--amber-700);">队列等待 · ${esc(elig.reason)}</span>`;
    }
    if ([TASK_STATE.IN_PROGRESS, TASK_STATE.COMPLETED, TASK_STATE.PENDING_REVIEW, TASK_STATE.BLOCKED].includes(t.state)) {
      return `<span style="color:var(--violet-700);">执行态势 · Case ${esc(t.case_id || '—')}</span> <button class="text-button" data-jump="command" type="button" style="min-height:auto;padding:0 4px;">查看态势</button> <button class="text-button" data-jump="workbench:${t.id}" type="button" style="min-height:auto;padding:0 4px;">介入工作台</button>`;
    }
    if (t.state === TASK_STATE.ACCEPTED) return '<span style="color:var(--green-600);">已验收</span>';
    return '<span style="color:var(--ink-400);">—</span>';
  })();
  return `
    <div class="detail-body">
      <div style="display:flex;align-items:center;gap:8px;flex-wrap:wrap;margin-bottom:12px;"><span class="task-tag">${taskShortId(t.id)}</span><span class="status-pill ${TASK_PILL[t.state].cls}">${TASK_PILL[t.state].label}</span></div>
      <h3 style="margin:0 0 12px;font-size:var(--type-heading);color:var(--ink-900);">${esc(firstLine(t.content))}</h3>
      <div class="detail-field-row"><span>客户</span><span>${esc(customerOf(t.project_id))}</span></div>
      <div class="detail-field-row"><span>状态</span><select data-task-state>${Object.values(TASK_STATE).map((st) => `<option value="${st}" ${t.state === st ? 'selected' : ''}>${TASK_PILL[st].label}</option>`).join('')}</select></div>
      <div class="detail-field-row"><span>处理人</span><select data-task-executor ${canAssign ? '' : 'disabled'}><option value="">未认领</option>${state.members.filter((m) => m.caps.includes(CAP.EXECUTE)).map((m) => `<option value="${m.id}" ${t.executor_id === m.id ? 'selected' : ''}>${esc(m.name)}</option>`).join('')}</select></div>
      <div class="detail-field-row"><span>优先级</span><select data-task-prio>${Object.entries(TASK_PRIO).map(([v, p]) => `<option value="${v}" ${t.priority === Number(v) ? 'selected' : ''}>${p.label}</option>`).join('')}</select></div>
      <div class="detail-field-row"><span>来源反馈</span>${fb ? `<span>${fb.short_id} · ${esc(fb.title)}</span>` : '<span>—</span>'}</div>
      ${fb ? `<div class="detail-field-row"><span>桥1追溯</span><code style="font-size:var(--type-micro);color:var(--violet-700);background:var(--violet-50);padding:2px 6px;border-radius:var(--radius-sm);">derived_from = customer-feedback:${fb.id}</code> <span class="todo-badge decision" title="待决策：前缀泛化 vs 新增 triggered_by 字段">待决策</span></div>` : ''}
      <div class="detail-field-row"><span>执行态势</span>${loopSummary}</div>
      <div class="detail-section-title">任务内容</div>
      <div style="font-size:var(--type-body);color:var(--ink-800);white-space:pre-wrap;">${esc(t.content)}</div>
      ${fb ? `<div class="feedback-content-quote" style="margin-top:12px;">${esc(fb.content)}</div>` : ''}
      <div class="inspector-actions">
        ${t.state === TASK_STATE.PENDING && !t.executor_id ? `<button class="primary-button" data-task-action="claim">认领任务</button>` : ''}
        ${t.state === TASK_STATE.PENDING && t.executor_id ? `<span style="color:var(--violet-700);font-size:var(--type-caption);">已认领，等待自动领取启动 Codex 线程…</span>` : ''}
        ${(t.state === TASK_STATE.IN_PROGRESS || t.state === TASK_STATE.COMPLETED) ? `<button class="primary-button" data-task-action="submit-review">提交待验收 + 生成进展草稿</button>` : ''}
        ${t.state === TASK_STATE.PENDING_REVIEW ? `<button class="primary-button" data-task-accept="${t.id}">验收通过</button><button class="secondary-button" data-task-reject="${t.id}">驳回退回</button>` : ''}
        ${t.state === TASK_STATE.ACCEPTED ? `<span style="color:var(--green-600);font-size:var(--type-caption);font-weight:700;">验收通过 · 该待办已验收，产物已交付</span>` : ''}
      </div>
    </div>`;
}

/* ---- Command 执行态势（page-dashboard：metric-grid + attention-strip + command-grid）---- */
function renderCommandView() {
  const root = document.getElementById('viewCommand');
  const pTasks = projectTasks();
  const running = pTasks.filter((t) => t.state === TASK_STATE.IN_PROGRESS);
  const queue = pendingQueue();
  const acceptQueue = pTasks.filter((t) => t.state === TASK_STATE.PENDING_REVIEW);
  const recent = pTasks.filter((t) => t.state === TASK_STATE.ACCEPTED);
  const attentionCount = acceptQueue.length + pTasks.filter((t) => t.state === TASK_STATE.BLOCKED).length + draftMessages().length;
  const metrics = [
    { label: '自动领取', value: state.automation.enabled ? '运行' : '已关', desc: state.automation.queue_paused ? '队列已暂停' : `并发 ${state.automation.concurrency_limit}`, cls: state.automation.enabled ? 'running' : '' },
    { label: '待处理事项', value: String(attentionCount), desc: '需人工介入', cls: 'attention' },
    { label: '运行中', value: String(running.length), desc: 'Codex 线程活跃', cls: 'running' },
    { label: '普通队列', value: String(queue.length), desc: '待认领/待启动', cls: '' },
    { label: '验收队列', value: String(acceptQueue.length), desc: '待验收任务', cls: 'attention' },
  ];
  const metricHtml = metrics.map((m) => `<article class="metric-card ${m.cls}"><span>${m.label}</span><strong>${m.value}</strong><small>${m.desc}</small></article>`).join('');
  // attention strip：对齐真实 Command attentionHost — 草稿待确认 / recovery item / 正常
  const blockedTasks = projectTasks().filter((t) => t.state === TASK_STATE.BLOCKED);
  const draftCount = draftMessages().length;
  const recoveryCount = blockedTasks.length;
  let attention;
  if (recoveryCount > 0) {
    attention = `<div class="attention-strip danger"><div class="attention-copy"><strong>${recoveryCount} 项异常待恢复</strong><p>任务阻塞 / 执行层断裂，冻结队列不领新任务，需对齐后恢复。</p></div><button class="primary-button" data-jump="recovery" type="button" style="min-height:30px;font-size:var(--type-caption);">进入恢复中心</button></div>`;
  } else if (draftCount > 0) {
    attention = `<div class="attention-strip"><div class="attention-copy"><strong>${draftCount} 条进展草稿待确认</strong><p>closeout 生成，确认后发送客户（桥2 待建）。</p></div><button class="primary-button" data-jump="feedback" type="button" style="min-height:30px;font-size:var(--type-caption);">前往确认</button></div>`;
  } else {
    attention = `<div class="attention-strip is-ready"><div class="attention-copy"><strong>无人工待介入</strong><p>自动化队列正常运行。</p></div></div>`;
  }
  // current run：活跃反馈→Task→Codex 线程，"查看对话"下钻 Workbench（对齐真实 reviewRunButton）
  const currentRun = running.length ? running.map((t) => {
    const link = linkForTask(t.id); const fb = link ? fbById(link.feedback_id) : null;
    return `<div class="fact-row"><small>${taskShortId(t.id)} · ${esc(customerOf(t.project_id))}</small><strong>${esc(firstLine(t.content))}</strong><small>反馈 ${fb ? fb.short_id : '—'} · Case ${esc(t.case_id || '—')} · 线程 ${esc(t.thread_id || '—')}</small></div><div style="margin-top:8px;"><button class="text-button" data-jump="workbench:${t.id}" type="button" style="min-height:26px;font-size:var(--type-caption);">查看对话与执行态势 →</button></div>`;
  }).join('') : '<p style="color:var(--ink-400);font-size:var(--type-caption);padding:15px;">无活跃运行</p>';
  // 普通队列
  const queueHtml = queue.length ? `<table class="data-table"><tbody>${queue.map((t) => `<tr data-jump="work:${t.id}"><td>${taskShortId(t.id)}</td><td>${esc(firstLine(t.content))}</td><td>${esc(customerOf(t.project_id))}</td><td>${t.executor_id ? esc(memberName(t.executor_id)) : '<span style="color:var(--amber-700);">待认领</span>'}</td></tr>`).join('')}</tbody></table>` : '<p style="color:var(--ink-400);font-size:var(--type-caption);padding:12px 15px;">队列已清</p>';
  // 验收队列
  const acceptHtml = acceptQueue.length ? `<table class="data-table"><tbody>${acceptQueue.map((t) => { const link = linkForTask(t.id); const fb = link ? fbById(link.feedback_id) : null; return `<tr data-jump="workbench:${t.id}"><td>${taskShortId(t.id)}</td><td>${esc(firstLine(t.content))}</td><td>${esc(memberName(t.executor_id))}</td><td>${fb ? fb.short_id : '—'}</td></tr>`; }).join('')}</tbody></table>` : '<p style="color:var(--ink-400);font-size:var(--type-caption);padding:12px 15px;">无待验收</p>';
  // 最近完成
  const recentHtml = recent.length ? recent.map((t) => { const link = linkForTask(t.id); const fb = link ? fbById(link.feedback_id) : null; return `<div class="fact-row"><small>${taskShortId(t.id)} · ${esc(customerOf(t.project_id))}</small><strong>${esc(firstLine(t.content))}</strong><small>已验收 · 反馈 ${fb ? fb.short_id : '—'} 已闭环</small></div>`; }).join('') : '<p style="color:var(--ink-400);font-size:var(--type-caption);padding:12px 15px;">无最近完成</p>';
  // inspector
  const ws = activeWorkset();
  const inspector = `<section class="inspector-card"><h3 style="margin:0 0 10px;font-size:var(--type-body);">项目源</h3><div>${ws ? ws.project_ids.map((id) => { const p = projectById(id); return p ? `<div class="fact-row"><small>${esc(p.customer)}</small><strong>${esc(p.name)}</strong><small>${p.local_path ? '已绑定工作区' : '<span style="color:var(--amber-700);">未绑定</span>'}</small></div>` : ''; }).join('') : ''}</div></section><section class="inspector-card"><h3 style="margin:0 0 10px;font-size:var(--type-body);">执行边界</h3><div><div class="fact-row"><small>自动领取</small><strong>${state.automation.enabled ? '开启' : '关闭'}</strong><small>仅作用于已绑定项目</small></div><div class="fact-row"><small>并发上限</small><strong>${state.automation.concurrency_limit}</strong></div></div></section><section class="inspector-card"><h3 style="margin:0 0 10px;font-size:var(--type-body);">桥1追溯 <span class="todo-badge decision" title="待决策：derived_from 前缀泛化 vs triggered_by">待决策</span></h3><div><div class="fact-row"><small>现状</small><strong>task-source-adapter 不拉 FeedbackTaskLink</strong><small>runtime 不知 Task 关联哪条客户反馈</small></div><div class="fact-row"><small>缺失</small><strong>Gap.derived_from 追溯</strong><small>需前缀泛化或新增字段</small></div></div></section>`;
  root.innerHTML = `
    <div class="page page-dashboard">
      <div class="page-heading split-heading"><div><p class="eyebrow">AUTOMATION COMMAND CENTER</p><h1>执行态势</h1><p>自动化队列、当前运行、验收队列与最近完成；反馈→Task→Codex 线程贯穿可视。</p></div><div class="heading-actions"><span class="health-badge ${attentionCount ? 'warning' : 'success'}">${attentionCount ? attentionCount + ' 项待介入' : '健康'}</span></div></div>
      <div class="metric-grid">${metricHtml}</div>
      <div id="attentionHost">${attention}</div>
      <div class="command-grid">
        <div class="command-main">
          <section class="panel-card current-run-card"><div class="section-title-row"><div><span class="section-icon">▶</span><div><h2>当前运行</h2><p>反馈→Task→Codex 线程</p></div></div></div><div class="current-run-panel">${currentRun}</div></section>
          <section class="panel-card queue-card"><div class="section-title-row"><div><span class="section-icon">≡</span><div><h2>普通待办队列</h2><p>待认领/待启动</p></div></div></div>${queueHtml}</section>
          <section class="panel-card queue-card"><div class="section-title-row"><div><span class="section-icon">◇</span><div><h2>验收队列</h2><p>开发完成待验收</p></div></div><span class="status-pill pending_review">${acceptQueue.length} 项</span></div>${acceptHtml}</section>
          <section class="panel-card completions-card"><div class="section-title-row"><div><span class="section-icon">✓</span><div><h2>最近完成</h2><p>已验收闭环</p></div></div></div><div class="completion-list">${recentHtml}</div></section>
        </div>
        <aside class="command-inspector">${inspector}</aside>
      </div>
    </div>`;
}

/* ---- Workbench 人工介入（workbench-layout 三栏：context / transcript / evidence）---- */
// Gap 推进时间线 — 对齐时序图 §4.3 selectNextRound → 推进 → transition → ledger 写回
function renderGapTimeline(t) {
  if (!t.gaps || !t.gaps.length) return '<p style="color:var(--ink-400);font-size:var(--type-micro);">无 Gap 记录</p>';
  const META = {
    done: { label: '已达成', dot: 'var(--green-600)', bg: 'var(--green-100)', fg: 'var(--green-600)' },
    in_progress: { label: '推进中', dot: 'var(--violet-500)', bg: 'var(--violet-100)', fg: 'var(--violet-700)' },
    pending: { label: '待推进', dot: 'var(--ink-300)', bg: 'var(--ink-100)', fg: 'var(--ink-500)' },
  };
  const items = t.gaps.map((g) => {
    const m = META[g.state] || META.pending;
    return `<div class="gap-step"><span class="gap-dot" style="background:${m.dot};"></span><div class="gap-body"><div class="gap-head"><strong>${esc(g.id)} · ${esc(g.title)}</strong><span class="task-tag" style="background:${m.bg};color:${m.fg};">${m.label}</span></div>${g.evidence ? `<div class="gap-evidence">${esc(g.evidence)}</div>` : ''}${g.at ? `<div class="gap-time">${fmtRelative(g.at)}</div>` : ''}</div></div>`;
  }).join('');
  return `<div class="gap-timeline">${items}</div>`;
}
function renderWorkbenchView() {
  const root = document.getElementById('viewWorkbench');
  // 默认选第一可介入任务
  const candidates = projectTasks().filter((t) => [TASK_STATE.IN_PROGRESS, TASK_STATE.COMPLETED, TASK_STATE.PENDING_REVIEW, TASK_STATE.BLOCKED].includes(t.state));
  const t = wbSelectedTask ? taskById(wbSelectedTask) : candidates[0];
  if (t) wbSelectedTask = t.id;
  const link = t ? linkForTask(t.id) : null;
  const fb = link ? fbById(link.feedback_id) : null;
  // 对齐真实 renderer.js:acceptance 由任务状态自动派生（state===completed），非独立模式
  const acceptanceReview = t && t.state === TASK_STATE.COMPLETED;
  const mode = wbWorkbenchMode || 'review';
  const modeLabel = mode === 'intervention' ? '人工处理' : acceptanceReview ? '验收问题' : '只读审查';
  const modeCls = mode === 'intervention' ? 'pending' : acceptanceReview ? 'completed' : 'pending_review';
  // interveneCurrentButton 可见性对齐真实：intervention 模式 / 无活动任务 / acceptanceReview 时隐藏
  const canIntervene = t && mode !== 'intervention' && !acceptanceReview && [TASK_STATE.IN_PROGRESS, TASK_STATE.BLOCKED].includes(t.state);
  // 左栏 fact rows 对齐真实 workbenchContext（11 行）
  const context = t ? `<button class="text-button" data-jump="command" type="button">← 返回自动化</button><div class="workbench-side-controls"><span class="status-pill ${modeCls}">${modeLabel}</span>${canIntervene ? `<button class="secondary-button" data-wb-mode="intervention" style="min-height:28px;font-size:var(--type-caption);">介入当前运行</button>` : ''}</div><div><div class="fact-row"><small>任务</small><strong>${taskShortId(t.id)}</strong></div><div class="fact-row"><small>远端项目</small><strong>${esc(customerOf(t.project_id))} · ${esc(projectById(t.project_id)?.name || '—')}</strong></div><div class="fact-row"><small>本地工作区</small><strong>${esc(projectById(t.project_id)?.local_path || '未绑定')}</strong></div><div class="fact-row"><small>审查范围</small><strong>${acceptanceReview ? '验收问题（task 已完成）' : mode === 'intervention' ? '人工介入（提交授权/事实/决策）' : '只读审查对话与证据'}</strong></div><div class="fact-row"><small>验收问题</small><strong>${acceptanceReview ? '可提交验收问题' : '不适用'}</strong></div><div class="fact-row"><small>Selected Gap</small><strong>${(t.gaps || []).find(g => g.state === 'in_progress')?.id || '尚未选择'}</strong></div><div class="fact-row"><small>来源反馈</small><strong>${fb ? fb.short_id : '—'}</strong></div><div class="fact-row"><small>Case</small><strong>${esc(t.case_id || '—')}</strong></div><div class="fact-row"><small>处理人</small><strong>${esc(memberName(t.executor_id))}</strong></div><div class="fact-row"><small>恢复条件</small><strong>${t.state === TASK_STATE.BLOCKED ? '解除阻塞后恢复' : '返回自动化观察'}</strong></div></div>` : '<p style="color:var(--ink-400);">无可介入任务</p>';
  // transcript：模拟 Codex 对话 + 反馈消息
  const transcript = t ? `<div class="chat-message assistant"><div class="chat-message-meta">支持助手 · ${fmtRelative(t.created_at)}</div><div class="chat-message-content"><p>已接需求目标：${esc(firstLine(t.content))}。开始 Gap-by-Gap 自主开发。</p></div></div><div class="chat-message user"><div class="chat-message-content"><p>Gap 1 已达成：问题定位完成。Gap 2 推进中：实现修复方案。</p></div></div>${fb ? `<div class="chat-message assistant"><div class="chat-message-meta">系统 · ${fmtRelative(fb.last_message_at)}</div><div class="chat-message-content"><p>关联客户反馈 ${fb.short_id}：${esc(fb.content)}</p></div></div>` : ''}` : '<div class="chat-empty"><strong>无对话</strong><p>选择任务查看执行对话。</p></div>';
  // evidence：执行全貌 + Gap 时间线 + 桥2 回写状态
  const draftMsg = fb ? draftForFeedback(fb.id) : null;
  const artifactMsg = fb ? state.messages.find((m) => m.feedback_id === fb.id && m.metadata && m.metadata.artifact_url) : null;
  const evidence = t ? `<div class="workbench-evidence-section"><h4>执行全貌</h4><div class="fact-row"><small>线程</small><strong>${esc(t.thread_id || '—')}</strong></div><div class="fact-row"><small>阶段</small><strong>${esc(t.phase || '—')}</strong></div><div class="fact-row"><small>状态</small><strong>${TASK_PILL[t.state].label}</strong></div></div><div class="workbench-evidence-section"><h4>Gap 推进时间线</h4>${renderGapTimeline(t)}</div><div class="workbench-evidence-section"><h4>桥2 草稿回写 <span class="todo-badge" title="closeout→草稿→确认→发送">待建·桥2</span></h4>${draftMsg ? `<div class="fact-row"><small>草稿</small><strong>已生成（pending_review）</strong><small>处理人确认后 sent</small></div>` : `<div class="fact-row"><small>现状</small><strong>runSameThreadCloseout 只 Git 收尾</strong><small>不回写草稿 FeedbackMessage</small></div>`}</div>${artifactMsg ? `<div class="workbench-evidence-section"><h4>产物交付 <span class="todo-badge" title="部署不在本期，产物指向已回写">产物·已交付</span></h4><div class="fact-row"><small>artifact_url</small><strong style="word-break:break-all;">${esc(artifactMsg.metadata.artifact_url)}</strong></div></div>` : ''}` : '';
  // composer 对齐真实：acceptance 时 placeholder 变"描述验收问题"；intervention 时"提交并恢复自动化"
  const composerPlaceholder = acceptanceReview ? '描述新的验收问题…' : '提供授权、事实或决策，并说明恢复条件…';
  const composerBtn = acceptanceReview ? '提交验收问题' : '提交并恢复自动化';
  root.innerHTML = `
    <div class="workbench-layout">
      <aside class="workbench-context">${context}</aside>
      <section class="workbench-transcript">
        <div class="workbench-heading"><div><p class="eyebrow">INTERVENTION WORKBENCH</p><h1>${t ? taskShortId(t.id) + ' · ' + esc(firstLine(t.content)) : '人工介入'}</h1></div></div>
        <div class="transcript-scroll-area"><div class="conversation-surface chat-transcript" aria-live="polite">${transcript}</div></div>
        <div id="interventionComposer" class="intervention-composer ${mode === 'intervention' || acceptanceReview ? '' : 'hidden'}"><textarea placeholder="${composerPlaceholder}"></textarea><button class="primary-button" type="button">${composerBtn}</button></div>
      </section>
      <aside class="workbench-evidence"><h3>执行全貌与证据</h3>${evidence}</aside>
    </div>`;
}

/* ---- Recovery 异常恢复（recovery-page：recovery-card 列表）---- */
function renderRecoveryView() {
  const root = document.getElementById('viewRecovery');
  // 模拟 recovery items：阻塞任务 + 桥3 未接通的客户追问
  const blocked = projectTasks().filter((t) => t.state === TASK_STATE.BLOCKED);
  const items = blocked.map((t) => ({ id: `blocked:${t.id}`, type: 'Gap 阻塞', message: `任务 ${taskShortId(t.id)} Gap 长期无 transition，需人工介入或恢复。`, task_id: t.id, freeze_scope: 'Gap', responsibility: 'Codex', actions: ['retry_start', 'mark_blocked'] }));
  // 桥3 缺失：客户追问无活跃 Case 路由
  items.push({ id: 'bridge3-missing', type: '桥3 事件路由缺失', message: '客户 FeedbackMessage 到达后，runtime 无"活跃 Case steer"事件路由；work-sync onInvalidate 只刷新 snapshot。', task_id: null, freeze_scope: 'runtime↔workshop-api', responsibility: 'runtime', actions: ['feedback_continue'] });
  root.innerHTML = `
    <div class="page recovery-page">
      <div class="page-heading split-heading"><div><p class="eyebrow">AUTOMATION RECOVERY CENTER</p><h1>恢复一致性</h1><p>对齐服务器任务、本地 Runtime 和 ledger 证据后再恢复队列。</p></div><button class="secondary-button" data-jump="command" type="button">返回态势</button></div>
      <div class="recovery-list">
        ${items.map((it) => `<div class="recovery-card"><div class="recovery-marker"></div><div class="recovery-body"><h2>${esc(it.type)}</h2><p>${esc(it.message)}</p><div class="recovery-meta"><span>任务 ${it.task_id ? taskShortId(it.task_id) : '—'}</span><span>冻结范围 ${esc(it.freeze_scope)}</span><span>责任方 ${esc(it.responsibility)}</span></div>${it.actions.includes('feedback_continue') ? '<div class="recovery-feedback"><label>补充说明</label><textarea rows="3" placeholder="补充客户追问上下文…"></textarea><small>桥3 待建：硬关联门控（derived_from 含同 feedback_id 才注入）</small></div>' : ''}<div class="recovery-actions">${it.actions.map((a) => `<button class="${a === 'mark_blocked' ? 'secondary-button' : 'primary-button'}" data-recovery-action="${a}" data-recovery-id="${it.id}" type="button" style="min-height:28px;font-size:var(--type-caption);">${a === 'retry_start' ? '重试同一任务' : a === 'mark_blocked' ? '标记为已阻塞' : '补充说明并继续'}</button>`).join('')}</div></div></div>`).join('') || '<p style="color:var(--ink-400);padding:20px;font-size:var(--type-caption);">无恢复项</p>'}
      </div>
    </div>`;
}

/* ---- Organization 组织治理（复原：成员 / 知识源 / 项目信息，非"验收与交付"）---- */
function renderOrgView() {
  const root = document.getElementById('viewOrg');
  const scope = orgScope();
  const tabs = [{ key: 'overview', label: '概览' }, { key: 'members', label: '成员' }, { key: 'projects', label: '项目' }];
  const personal = scope && scope.id === 'personal';
  root.innerHTML = `
    <div class="organization-center">
      <aside class="organization-scope-panel">
        <div><p class="eyebrow">GOVERNANCE SCOPE</p><h2>组织与产品</h2><p>不受当前产品集过滤</p></div>
        <div class="organization-scope-actions"><button class="secondary-button" data-org-create-org type="button">新建组织</button><button class="text-button" data-org-join type="button">使用邀请码加入</button></div>
        <div id="organizationScopeList" class="organization-scope-list">${renderOrgScopes()}</div>
      </aside>
      <div class="page platform-page organization-main">
        <div class="page-heading split-heading"><div><p class="eyebrow">ORGANIZATION · ${esc(scope ? scope.name : '—')}</p><h1>${personal ? '个人项目' : '组织治理'}</h1><p>${personal ? '个人与外部参与的项目。' : '组织成员、项目与治理范围。'}创建项目在此页；本地绑定、Workset、Automation 授权分别管理。</p></div><div class="heading-actions"><button class="primary-button" data-project-create type="button">${personal ? '创建个人项目' : '创建组织项目'}</button></div></div>
        <div class="organization-tabs">${tabs.map((t) => `<button class="${(personal && t.key !== 'projects') ? 'disabled' : (state.organization_section === t.key ? 'is-active' : '')}" data-org-tab="${t.key}" type="button" ${personal && t.key !== 'projects' ? 'disabled' : ''}>${t.label}</button>`).join('')}</div>
        <div id="organizationContent">${renderOrgTab()}</div>
      </div>
    </div>`;
}
function renderOrgScopes() {
  return state.organization_scopes.map((s) => `<button class="org-scope-row ${state.selected_org_scope === s.id ? 'is-active' : ''}" data-org-scope="${s.id}" type="button"><strong>${esc(s.name)}</strong><small>${s.role === 'owner' ? '所有者' : s.role} · ${s.project_ids.length} 个项目</small></button>`).join('');
}
function orgScope() { return state.organization_scopes.find((s) => s.id === state.selected_org_scope) || state.organization_scopes[0]; }
function scopeProjects() { const s = orgScope(); return s ? s.project_ids.map((id) => projectById(id)).filter(Boolean) : []; }
function renderOrgTab() {
  const scope = orgScope();
  const personal = scope && scope.id === 'personal';
  if (state.organization_section === 'projects' || personal) {
    const projects = scopeProjects();
    const sel = state.selected_org_project ? projectById(state.selected_org_project) : projects[0];
    if (sel) state.selected_org_project = sel.id;
    const dir = projects.map((p) => `<button class="project-directory-row ${sel && sel.id === p.id ? 'is-active' : ''}" data-org-project="${p.id}" type="button"><i>${esc(p.customer[0])}</i><span><strong>${esc(p.name)}</strong><small>${esc(p.customer)}${p.local_path ? ' · 已绑定' : ' · 未绑定'}</small></span></button>`).join('');
    return `<div class="organization-detail-grid"><section class="panel-card project-directory"><div class="section-title-row"><div><span class="section-icon">≡</span><div><h2>项目目录</h2><p>${projects.length} 个项目</p></div></div><button class="text-button" data-project-create type="button">创建项目</button></div><div class="workspace-pane-scroll">${dir || '<p style="color:var(--ink-400);padding:20px;font-size:var(--type-caption);">无项目</p>'}</div></section><aside class="inspector-card project-inspector">${sel ? renderOrgProjectInspector(sel) : '<div class="empty-panel"><strong>选择项目</strong><p>查看项目详情、绑定与知识源。</p></div>'}</aside></div>`;
  }
  if (state.organization_section === 'members') {
    const sel = state.members[0];
    return `<div class="organization-detail-grid"><section class="panel-card"><div class="section-title-row"><div><span class="section-icon">◇</span><div><h2>成员目录</h2><p>${state.members.length} 人</p></div></div></div><div class="workspace-pane-scroll">${state.members.map((m) => `<button class="project-directory-row ${m.id === state.currentUserId ? 'is-active' : ''}" data-member-switch="${m.id}" type="button"><i>${esc(m.name[0])}</i><span><strong>${esc(m.name)}</strong><small>${m.role} · ${m.caps.length} 能力</small></span></button>`).join('')}</div></section><aside class="inspector-card"><div class="section-title-row"><div><span class="section-icon">◇</span><div><h2>${esc(sel.name)}</h2><p>${sel.role}</p></div></div></div><div class="workspace-pane-scroll"><div class="detail-field-row"><span>角色</span><strong>${sel.role}</strong></div><div class="detail-field-row"><span>能力</span><strong>${sel.caps.map((c) => `<span class="task-tag">${c === CAP.TRIAGE ? '分诊' : c === CAP.EXECUTE ? '处理' : '验收'}</span>`).join(' ')}</strong></div><div class="detail-section-title">能力映射 <span class="todo-badge" title="Duty→Capabilities — 后端待建">待建</span></div><p style="color:var(--ink-500);font-size:var(--type-caption);">点击左侧成员切换演示身份（验证分诊 role 门控）。</p></div></aside></div>`;
  }
  // overview
  const projects = scopeProjects();
  return `<div class="metric-grid acceptance-only"><div class="metric-card"><span>成员</span><strong>${state.members.length}</strong></div><div class="metric-card healthy"><span>可见项目</span><strong>${projects.length}</strong></div><div class="metric-card running"><span>当前角色</span><strong>${scope ? (scope.role === 'owner' ? '所有者' : scope.role) : '—'}</strong></div></div><div class="panel-card"><div class="section-title-row"><div><span class="section-icon">▦</span><div><h2>成员参与全貌</h2><p>成员在各项目的角色与职责</p></div></div></div><table class="data-table"><thead><tr><th>成员</th>${projects.map((p) => `<th>${esc(p.name)}</th>`).join('')}</tr></thead><tbody>${state.members.map((m) => `<tr><td>${esc(m.name)}</td>${projects.map((p) => `<td>${m.role === 'owner' || m.role === 'admin' ? '<span class="task-tag">处理/验收</span>' : '<span class="task-tag">处理</span>'}</td>`).join('')}</tr>`).join('')}</tbody></table>`;
}
// 项目 inspector：组织归属 + 本地绑定 + Workset/Automation 状态 + 知识源（按项目隔离，F-09 新增）
function renderOrgProjectInspector(p) {
  const ws = activeWorkset();
  const inWorkset = ws && ws.project_ids.includes(p.id);
  const kbSources = state.knowledge_sources.filter((k) => k.scope === 'public' || k.project_id === p.id);
  return `<div class="section-title-row"><div><span class="section-icon">◇</span><div><h2>${esc(p.name)}</h2><p>${esc(p.customer)}</p></div></div></div><div class="workspace-pane-scroll">
    <div class="detail-field-row"><span>组织归属</span><strong>${esc(orgScope()?.name || '个人')}</strong></div>
    <div class="detail-field-row"><span>代码仓库</span><strong style="word-break:break-all;">${esc(p.git_url || '—')}</strong></div>
    <div class="detail-field-row"><span>本地工作区</span><strong>${p.local_path ? `<code style="font-size:var(--type-micro);">${esc(p.local_path)}</code>` : '<span style="color:var(--amber-700);">未绑定</span>'}</strong></div>
    <div class="detail-field-row"><span>Workset</span><strong>${inWorkset ? `<span class="status-pill completed">在当前产品集</span>` : '<span class="status-pill pending">未加入</span>'}</strong></div>
    <div class="detail-field-row"><span>Automation</span><strong>${p.participating ? '<span class="status-pill completed">已授权</span>' : '<span class="status-pill pending">未授权</span>'}</strong></div>
    <div class="inspector-actions">
      ${p.local_path ? `<button class="secondary-button" data-ws-bind="${p.id}">重新绑定目录</button>` : `<button class="primary-button" data-ws-bind="${p.id}">选择本地目录</button>`}
      <button class="secondary-button" data-org-edit-project="${p.id}">编辑事实</button>
    </div>
    <div class="detail-section-title">知识源 <span class="todo-badge" title="F-09 知识库管理：真实客户端无，设计稿新增（按项目隔离）">新增·F-09</span></div>
    <p style="color:var(--ink-500);font-size:var(--type-caption);margin:0 0 8px;">客户私有库（代码语义+文档RAG+FAQ）按项目隔离；共享产品库所有项目共用。<span class="todo-badge" title="代码语义检索独立选型 — 后端待建">待建·代码检索</span></p>
    ${renderKbSources(kbSources, p.id)}
    <div class="inspector-actions"><button class="secondary-button" data-kb-add="${p.id}">添加知识源</button></div>
  </div>`;
}
function renderKbSources(list, projectId) {
  if (!list.length) return '<p style="color:var(--ink-400);font-size:var(--type-caption);">无知识源</p>';
  return `<table class="data-table"><thead><tr><th>名称</th><th>类型</th><th>文档数</th><th>同步</th><th style="width:72px;">操作</th></tr></thead><tbody>${list.map((k) => `<tr><td>${esc(k.name)}${k.repo_url ? `<br><code style="font-size:var(--type-micro);color:var(--ink-400);">${esc(k.repo_url)}</code>` : ''}</td><td><span class="task-tag">${k.retrieve_kind === 'code' ? '代码语义' : k.retrieve_kind === 'doc' ? '文档RAG' : 'FAQ'}</span></td><td>${k.doc_count ?? '—'}</td><td><span class="status-pill ${k.status === '已同步' ? 'completed' : 'pending'}">${k.status}</span></td><td><button class="secondary-button" data-kb-rebuild="${k.id}" style="min-height:26px;padding:0 6px;font-size:var(--type-caption);">重建</button></td></tr>`).join('')}</tbody></table>`;
}

/* ============================================================
 * 八、模态弹窗
 * ============================================================ */
function openModal(title, bodyHtml, footHtml) {
  const root = document.getElementById('modalRoot');
  root.innerHTML = `<div class="modal-overlay"><div class="modal-card"><div class="modal-head"><h3>${esc(title)}</h3><button class="icon-button" data-modal-close type="button">✕</button></div><div class="modal-body">${bodyHtml}</div><div class="modal-foot">${footHtml}</div></div></div>`;
}
function closeModal() { document.getElementById('modalRoot').innerHTML = ''; }

/* ============================================================
 * 九、交互处理 — 内部端
 * ============================================================ */
function wbSelectFb(id) { wbSelectedFb = wbSelectedFb === id ? null : id; render(); }
function wbSelectTask(id) { wbSelectedTask = wbSelectedTask === id ? null : id; render(); }

function fbConvert(fbId) {
  const fb = fbById(fbId);
  if (!fb) return;
  const me = memberById(state.currentUserId);
  if (!me || !me.caps.includes(CAP.TRIAGE)) {
    openModal('无分诊权限', `<p style="margin:0;">需要项目管理员（owner/admin）分诊。当前账号「${esc(me ? me.name : '未知')}」无分诊能力（member 调 triage 返回 403）。</p>`, `<button class="primary-button" data-modal-close>知道了</button>`);
    return;
  }
  const executors = state.members.filter((m) => m.caps.includes(CAP.EXECUTE));
  openModal('转为开发任务', `<div class="modal-field"><label>任务标题</label><input id="convTitle" value="${esc('[反馈] ' + fb.title)}"></div><div class="modal-field"><label>处理人</label><select id="convExecutor"><option value="">未指定</option>${executors.map((m) => `<option value="${m.id}">${esc(m.name)}</option>`).join('')}</select></div><div class="modal-field"><label>优先级</label><select id="convPrio">${['P1', 'P2', 'P3'].map((p) => `<option value="${p}" ${fb.data.priority === p ? 'selected' : ''}>${p}</option>`).join('')}</select></div>`, `<button class="secondary-button" data-modal-close>取消</button><button class="primary-button" data-conv-confirm="${fbId}">创建任务</button>`);
}
function fbConvertConfirm(fbId) {
  const fb = fbById(fbId);
  const title = document.getElementById('convTitle').value;
  const executorId = Number(document.getElementById('convExecutor').value) || null;
  const prio = document.getElementById('convPrio').value;
  const newId = Math.max(0, ...state.tasks.map((t) => t.id)) + 1;
  state.tasks.push({ id: newId, project_id: fb.project_id, father_id: null, content: title, state: TASK_STATE.PENDING, executor_id: executorId, creator_id: state.currentUserId, priority: FB_PRIO[prio] || 2, tags: '[Bug](#ffff0000)', created_at: Date.now(), source_feedback_id: fbId, thread_id: null, case_id: null, phase: 'queued' });
  state.task_links.push({ feedback_id: fbId, task_id: newId, relation_type: RELATION.CONVERTED_TO, is_primary: true, created_by: state.currentUserId });
  fb.status = FB_STATUS.CONVERTED;
  fb.triage_status = TRIAGE.ACCEPTED;
  fb.last_message_at = Date.now();
  state.messages.push({ id: Date.now(), feedback_id: fbId, sender_type: SENDER.SYSTEM, content: `已转为开发任务 ${taskShortId(newId)}，处理人 ${executorId ? memberName(executorId) : '待认领'}。`, metadata: {}, state: 'sent', created_at: Date.now() });
  closeModal();
  openModal('已转为开发任务', `<p style="margin:0;">已创建 <strong>${taskShortId(newId)}</strong>，反馈状态更新为「已流转」。</p><p style="color:var(--ink-500);font-size:var(--type-caption);margin:0;">下一步：在任务开发页认领并处理。</p>`, `<button class="secondary-button" data-modal-close>留在反馈页</button><button class="primary-button" data-jump="work:${newId}">前往任务</button>`);
  maybeAutoDispatch(newId);
  render();
}
function fbReply(fbId) {
  openModal('回复客户', `<div class="modal-field"><label>回复内容（客户会在反馈中看到）</label><textarea id="replyText" rows="4">${esc('感谢反馈，我们已收到并开始跟进。')}</textarea></div>`, `<button class="secondary-button" data-modal-close>取消</button><button class="primary-button" data-reply-confirm="${fbId}">发送</button>`);
}
function fbReplyConfirm(fbId) {
  const text = document.getElementById('replyText').value.trim();
  if (!text) return;
  const fb = fbById(fbId);
  state.messages.push({ id: Date.now(), feedback_id: fbId, sender_type: SENDER.DEVELOPER, content: text, metadata: { source: 'feedback-console' }, state: 'sent', created_at: Date.now() });
  fb.last_message_at = Date.now();
  closeModal();
  render();
}
function fbIgnore(fbId) {
  const fb = fbById(fbId);
  const me = memberById(state.currentUserId);
  if (!me || !me.caps.includes(CAP.TRIAGE)) {
    openModal('无分诊权限', `<p style="margin:0;">需要项目管理员（owner/admin）分诊。</p>`, `<button class="primary-button" data-modal-close>知道了</button>`);
    return;
  }
  openModal('忽略反馈并回复说明', `<div class="modal-field"><label>给客户的说明（确认后发送，客户会收到）</label><textarea id="ignoreText" rows="4">${esc('感谢反馈。经评估当前不会安排开发，原因：不在本期范围内。如有疑问可继续在此反馈。')}</textarea></div><p style="color:var(--ink-500);font-size:var(--type-caption);margin:0;">发送后反馈状态更新为「已忽略」，客户可见。</p>`, `<button class="secondary-button" data-modal-close>取消</button><button class="primary-button" data-ignore-confirm="${fbId}">确认忽略并发送</button>`);
}
function fbIgnoreConfirm(fbId) {
  const fb = fbById(fbId);
  const text = (document.getElementById('ignoreText')?.value || '').trim();
  fb.triage_status = TRIAGE.IGNORED;
  fb.status = FB_STATUS.IGNORED;
  fb.last_message_at = Date.now();
  if (text) state.messages.push({ id: Date.now(), feedback_id: fbId, sender_type: SENDER.DEVELOPER, content: text, metadata: { source: 'ignore-explain' }, state: 'sent', created_at: Date.now() });
  closeModal();
  render();
}
function fbPrio(fbId, prio) { const fb = fbById(fbId); fb.data.priority = prio; render(); }
// AI 分诊：采纳初判 → 用 AI 建议填 priority/type，标记已采纳
function fbTriageAccept(fbId) {
  const fb = fbById(fbId);
  if (!fb || !fb.ai_triage) return;
  fb.data.priority = fb.ai_triage.priority || fb.data.priority;
  fb.type = fb.ai_triage.type || fb.type;
  fb.ai_triage.accepted = true;
  openModal('已采纳 AI 分诊初判', `<p style="margin:0;">优先级已更新为 <strong>${fb.ai_triage.priority}</strong>，类型 <strong>${fb.ai_triage.type}</strong>。</p><p style="color:var(--ink-500);font-size:var(--type-caption);margin:0;">下一步：转开发任务或回复客户。</p>`, `<button class="primary-button" data-modal-close>知道了</button>`);
  render();
}
// AI 分诊：人工调整 → 弹窗编辑 priority/type
function fbTriageAdjust(fbId) {
  const fb = fbById(fbId);
  if (!fb) return;
  const a = fb.ai_triage || {};
  openModal('人工调整分诊', `<div class="modal-field"><label>类型</label><select id="triageType"><option value="issue" ${fb.type === 'issue' ? 'selected' : ''}>问题</option><option value="suggestion" ${fb.type === 'suggestion' ? 'selected' : ''}>建议</option><option value="question" ${fb.type === 'question' ? 'selected' : ''}>咨询</option><option value="consultation" ${fb.type === 'consultation' ? 'selected' : ''}>咨询</option></select></div><div class="modal-field"><label>优先级</label><select id="triagePrio">${['P1', 'P2', 'P3'].map((p) => `<option value="${p}" ${fb.data.priority === p ? 'selected' : ''}>${p}</option>`).join('')}</select></div><p style="color:var(--ink-500);font-size:var(--type-caption);margin:0;">AI 建议：${esc(a.priority || '—')} / ${esc(a.type || '—')}（置信度 ${a.confidence ? (a.confidence * 100).toFixed(0) + '%' : '—'}）</p>`, `<button class="secondary-button" data-modal-close>取消</button><button class="primary-button" id="triageAdjustConfirm">确认调整</button>`);
}
function fbTriageAdjustConfirm(fbId) {
  const fb = fbById(fbId);
  if (!fb) return;
  fb.type = document.getElementById('triageType').value;
  fb.data.priority = document.getElementById('triagePrio').value;
  if (fb.ai_triage) fb.ai_triage.accepted = false;
  closeModal();
  render();
}

// 桥2 草稿确认（并入 Feedback 详情）
function draftEdit(msgId) {
  const m = state.messages.find((x) => x.id === msgId);
  if (!m) return;
  openModal('编辑进展草稿', `<div class="modal-field"><label>客户会看到的进展内容</label><textarea id="draftText" rows="5">${esc(m.content)}</textarea></div><p style="color:var(--ink-500);font-size:var(--type-caption);">确认后草稿 state→sent，客户收到。</p>`, `<button class="secondary-button" data-modal-close>取消</button><button class="primary-button" data-draft-confirm="${msgId}">确认发送</button>`);
}
function draftConfirm(msgId) {
  const m = state.messages.find((x) => x.id === msgId);
  if (!m) return;
  const ta = document.getElementById('draftText');
  if (ta) m.content = ta.value.trim();
  m.state = 'sent';
  m.metadata.draft = false;
  const fb = fbById(m.feedback_id);
  if (fb) {
    fb.hasPendingProgress = true;
    fb.last_message_at = Date.now();
    // 草稿确认后作为 developer 消息发客户
    state.messages.push({ id: Date.now() + 1, feedback_id: fb.id, sender_type: SENDER.DEVELOPER, content: m.content, metadata: { source: 'progress-draft' }, state: 'sent', created_at: Date.now() });
  }
  closeModal();
  openModal('进展已发送', `<p style="margin:0;">客户将在反馈中看到此进展，状态更新为「有进展，待你确认」。</p>`, `<button class="secondary-button" data-modal-close>关闭</button><button class="primary-button" data-jump="command">前往态势</button>`);
  render();
}

function taskStateChange(taskId, newState) {
  const t = taskById(taskId);
  const old = t.state;
  t.state = newState;
  const link = linkForTask(taskId);
  if (link) {
    const fb = fbById(link.feedback_id);
    fb.status = taskStateToFeedbackStatus(newState);
    fb.last_message_at = Date.now();
    state.messages.push({ id: Date.now(), feedback_id: fb.id, sender_type: SENDER.SYSTEM, content: `任务 ${taskShortId(taskId)} 状态变更：${TASK_PILL[old].label} → ${TASK_PILL[newState].label}。`, metadata: {}, state: 'sent', created_at: Date.now() });
  }
  render();
}
function taskExecutorChange(taskId, executorId) { const t = taskById(taskId); t.executor_id = executorId || null; render(); }
function taskPrioChange(taskId, prio) { const t = taskById(taskId); t.priority = Number(prio); render(); }
function taskClaim(taskId) {
  const t = taskById(taskId);
  if (!t || t.state !== TASK_STATE.PENDING) return;
  t.executor_id = state.currentUserId;
  t.phase = 'queued';
  render();
  maybeAutoDispatch(taskId);
}
function maybeAutoDispatch(taskId) {
  const t = taskById(taskId);
  if (!t || t.state !== TASK_STATE.PENDING) return;
  if (!automationEligible(t).ok) return;
  setTimeout(() => {
    const cur = taskById(taskId);
    if (!cur || cur.state !== TASK_STATE.PENDING) return;
    if (!automationEligible(cur).ok) return;
    cur.state = TASK_STATE.IN_PROGRESS;
    cur.phase = 'in_progress';
    cur.thread_id = `thd_${cur.id}_${Math.floor(Date.now() / 1000).toString(36)}`;
    cur.case_id = `CASE-${cur.id}`;
    if (!cur.gaps || !cur.gaps.length) cur.gaps = [
      { id: 'G1', title: '问题定位与根因分析', state: 'in_progress', evidence: null, at: Date.now() },
      { id: 'G2', title: '实现修复方案', state: 'pending', evidence: null, at: null },
      { id: 'G3', title: 'Git 收尾提交（runSameThreadCloseout）', state: 'pending', evidence: null, at: null },
    ];
    const link = linkForTask(cur.id);
    if (link) {
      const fb = fbById(link.feedback_id);
      if (fb) {
        fb.status = taskStateToFeedbackStatus(TASK_STATE.IN_PROGRESS);
        fb.last_message_at = Date.now();
        state.messages.push({ id: Date.now(), feedback_id: fb.id, sender_type: SENDER.SYSTEM, content: `已认领并启动 Codex 开发线程（${cur.thread_id}），进入自主开发。`, metadata: { thread_id: cur.thread_id }, state: 'sent', created_at: Date.now() });
      }
    }
    render();
    // Gap-by-Gap 逐步推进（对齐时序图 §4.3：selectNextRound → 推进 → transition → ledger 写回）
    advanceGaps(taskId);
  }, 1200);
}
// Gap 逐个推进：in_progress→done，下一个 pending→in_progress；全部 done → loop 达成 → completed + 桥2 草稿
function advanceGaps(taskId) {
  const step = () => {
    const cur = taskById(taskId);
    if (!cur || cur.state !== TASK_STATE.IN_PROGRESS) return;
    const gaps = cur.gaps || [];
    const idx = gaps.findIndex((g) => g.state === 'in_progress');
    if (idx >= 0) {
      gaps[idx].state = 'done';
      gaps[idx].evidence = `Codex 产出：${gaps[idx].title}（ledger 已写回）`;
      gaps[idx].at = Date.now();
      const next = gaps.find((g) => g.state === 'pending');
      if (next) { next.state = 'in_progress'; next.at = Date.now(); }
      render();
      setTimeout(step, 1100);
    } else {
      // 全部 Gap 达成 → loop 收尾 → completed + 桥2 草稿生成
      cur.state = TASK_STATE.COMPLETED;
      cur.phase = 'completed';
      const lk = linkForTask(cur.id);
      if (lk) {
        const fb2 = fbById(lk.feedback_id);
        if (fb2) {
          fb2.status = taskStateToFeedbackStatus(TASK_STATE.COMPLETED);
          fb2.last_message_at = Date.now();
          if (!draftForFeedback(fb2.id)) {
            state.messages.push({ id: Date.now(), feedback_id: fb2.id, sender_type: SENDER.SYSTEM, content: `${firstLine(cur.content)}已处理完成，预计随下一次发布生效。如有疑问可在反馈中补充。`, metadata: { draft: true, task_id: cur.id }, state: 'pending_review', created_at: Date.now() });
          }
          state.messages.push({ id: Date.now() + 1, feedback_id: fb2.id, sender_type: SENDER.SYSTEM, content: `任务 ${taskShortId(cur.id)} Codex loop 全部 Gap 达成，已 Git 收尾，待提交验收。`, metadata: {}, state: 'sent', created_at: Date.now() });
        }
      }
      render();
    }
  };
  setTimeout(step, 1000);
}
function taskSubmitReview(taskId) {
  const t = taskById(taskId);
  if (t.state !== TASK_STATE.IN_PROGRESS && t.state !== TASK_STATE.COMPLETED) return;
  t.state = TASK_STATE.PENDING_REVIEW;
  t.phase = 'completed';
  const link = linkForTask(taskId);
  const fbId = link ? link.feedback_id : null;
  if (fbId) {
    const fb = fbById(fbId);
    fb.status = taskStateToFeedbackStatus(TASK_STATE.PENDING_REVIEW);
    fb.last_message_at = Date.now();
    state.messages.push({ id: Date.now(), feedback_id: fbId, sender_type: SENDER.SYSTEM, content: `任务 ${taskShortId(taskId)} 已提交待验收。`, metadata: {}, state: 'sent', created_at: Date.now() });
  }
  jumpTo('command');
}

// 验收通过 → accepted + 构建产物 + artifact_url 回写 + 通知客户（对齐 F-07）
function orgAccept(taskId) {
  const t = taskById(taskId);
  if (!t) return;
  const me = memberById(state.currentUserId);
  if (!me || !me.caps.includes(CAP.ACCEPT)) {
    openModal('无验收权限', `<p style="margin:0;">需要验收能力（accept cap）。当前账号「${esc(me ? me.name : '未知')}」无验收能力。</p>`, `<button class="primary-button" data-modal-close>知道了</button>`);
    return;
  }
  t.state = TASK_STATE.ACCEPTED;
  t.phase = 'accepted';
  const link = linkForTask(taskId);
  if (link) {
    const fb = fbById(link.feedback_id);
    if (fb) {
      fb.status = taskStateToFeedbackStatus(TASK_STATE.ACCEPTED);
      fb.last_message_at = Date.now();
      state.messages.push({ id: Date.now(), feedback_id: fb.id, sender_type: SENDER.SYSTEM, content: `任务 ${taskShortId(taskId)} 已验收通过，进入交付流程。`, metadata: {}, state: 'sent', created_at: Date.now() });
    }
  }
  // 构建产物 + artifact_url 回写（F-07：accept 后构建，部署不在本期）
  buildAndDeliverArtifact(taskId);
  closeModal();
  openModal('验收通过 · 产物已交付', `<p style="margin:0;">任务已验收，构建产物地址已回写，客户将在 SDK 看到「已交付 + 产物指向」。</p><p style="color:var(--ink-500);font-size:var(--type-caption);margin:0;">部署不在本期（产物指向出口已通）。</p>`, `<button class="secondary-button" data-modal-close>关闭</button><button class="primary-button" data-jump="feedback:${link ? link.feedback_id : ''}">查看反馈</button>`);
  render();
}
// 验收驳回 → 退回 in_progress
function orgReject(taskId) {
  const t = taskById(taskId);
  if (!t) return;
  t.state = TASK_STATE.IN_PROGRESS;
  t.phase = 'in_progress';
  const link = linkForTask(taskId);
  if (link) {
    const fb = fbById(link.feedback_id);
    if (fb) {
      fb.status = FB_STATUS.IN_PROGRESS;
      fb.last_message_at = Date.now();
      state.messages.push({ id: Date.now(), feedback_id: fb.id, sender_type: SENDER.SYSTEM, content: `任务 ${taskShortId(taskId)} 验收驳回，退回处理。`, metadata: {}, state: 'sent', created_at: Date.now() });
    }
  }
  closeModal();
  openModal('验收驳回', `<p style="margin:0;">任务退回处理中，反馈状态更新为「处理中」。</p>`, `<button class="primary-button" data-modal-close>知道了</button>`);
  render();
}
// 构建产物 + artifact_url 回写（对齐 F-07 产物交付回写；部署不做）
function buildAndDeliverArtifact(taskId) {
  const t = taskById(taskId);
  if (!t) return;
  const proj = projectById(t.project_id);
  const projName = proj ? proj.name : 'project';
  const artifactUrl = `https://builds.arckit.example/${projName.toLowerCase().replace(/\s/g, '-')}/task-${taskId}/${Math.floor(Date.now() / 1000)}.zip`;
  const buildId = `BLD-${taskId}-${Math.floor(Date.now() / 1000)}`;
  const link = linkForTask(taskId);
  if (link) {
    const fb = fbById(link.feedback_id);
    if (fb) {
      fb.status = FB_STATUS.RELEASED; // 交付回写终态（对齐时序图 §4.1）
      fb.hasPendingProgress = false;
      fb.last_message_at = Date.now();
      state.messages.push({ id: Date.now(), feedback_id: fb.id, sender_type: SENDER.SYSTEM, content: `已交付产物（${artifactUrl}），问题闭环。部署由你方完成。`, metadata: { artifact_url: artifactUrl, build_id: buildId }, state: 'sent', created_at: Date.now() });
    }
  }
}

// 创建项目（对齐真实 createProduct：Organization 页 data-project-create，表单 name+git_url，创建后留页刷新）
function createProduct() {
  const scope = orgScope();
  const personal = scope && scope.id === 'personal';
  openModal(personal ? '创建个人项目' : `在 ${scope?.name || ''} 创建项目`, `<p style="color:var(--ink-500);font-size:var(--type-caption);margin:0 0 12px;">组织归属在创建时确定；创建后 ArcOrbit 不提供迁移入口。本地绑定、Workset 和 Automation 授权仍分别管理。</p><div class="modal-field"><label>产品名称</label><input id="prodName" placeholder="例如：虚拟产品 A"></div><div class="modal-field"><label>Git 地址（可选）</label><input id="prodGit" placeholder="可选"></div>`, `<button class="secondary-button" data-modal-close>取消</button><button class="primary-button" id="prodCreateConfirm" data-prod-confirm="${personal ? '' : scope?.id}">创建产品</button>`);
}
on('click', '#prodCreateConfirm', () => {
  const name = document.getElementById('prodName')?.value.trim();
  if (!name) return;
  const git = document.getElementById('prodGit')?.value.trim() || null;
  const scope = orgScope();
  const id = Math.max(0, ...state.projects.map(p => p.id)) + 1;
  const customer = scope && scope.id !== 'personal' ? scope.name.replace(/企业$/, '') : 'Personal';
  state.projects.push({ id, name, customer, git_url: git, local_path: null, participating: false, organization_id: scope && scope.id !== 'personal' ? scope.id : null });
  if (scope) scope.project_ids.push(id);
  closeModal();
  state.selected_org_project = id;
  render();
});

function wsBind(projectId) {
  const p = projectById(projectId);
  if (!p) return;
  const defaultPath = p.local_path || `/Users/zqs/arckit-workspaces/${p.customer.toLowerCase()}/${p.name.toLowerCase().replace(/\s/g, '-')}`;
  openModal('绑定本地工作区目录', `<div class="modal-field"><label>本地代码仓库目录（Codex loop 运行工作区）</label><input id="wsPath" value="${esc(defaultPath)}"></div><p style="color:var(--ink-500);font-size:var(--type-caption);">绑定后自动领取门控才会通过；未绑定的项目任务停在 pending。</p>`, `<button class="secondary-button" data-modal-close>取消</button><button class="primary-button" data-ws-confirm="${projectId}">确认绑定</button>`);
}
function wsConfirm(projectId) {
  const p = projectById(projectId);
  if (!p) return;
  const v = (document.getElementById('wsPath')?.value || '').trim();
  if (!v) return;
  p.local_path = v;
  p.participating = true;
  closeModal();
  render();
}
function kbRebuild(sourceId) {
  const k = state.knowledge_sources.find((x) => x.id === Number(sourceId));
  if (!k) return;
  k.status = '索引中';
  k.doc_count = 0;
  render();
  setTimeout(() => {
    const cur = state.knowledge_sources.find((x) => x.id === Number(sourceId));
    if (!cur) return;
    cur.status = '已同步';
    cur.last_synced = Date.now();
    cur.doc_count = cur.retrieve_kind === 'code' ? 1284 : cur.retrieve_kind === 'doc' ? 96 : 48;
    render();
  }, 1200);
}
function kbTest() {
  const input = document.getElementById('kbTestQuery');
  const q = (input?.value || '').trim();
  if (!q) return;
  window.__kbTestQuery = q;
  window.__kbTestResult = sdkRetrieve(q);
  render();
}

function jumpTo(view, opts = {}) {
  closeModal();
  wbView = view;
  if (view === 'feedback' && opts.fbId != null) wbSelectedFb = opts.fbId;
  if (view === 'work' && opts.taskId != null) wbSelectedTask = opts.taskId;
  if (view === 'workbench' && opts.taskId != null) wbSelectedTask = opts.taskId;
  render();
}
function todayJump(itemId) {
  const items = todayResponsibilities();
  const it = items.find((i) => i.id === itemId);
  if (!it) return;
  if (it.view === 'feedback') jumpTo('feedback', { fbId: it.fbId });
  else if (it.view === 'work') jumpTo('work', { taskId: it.taskId });
  else if (it.view === 'command') { wbSelectedTask = it.taskId; jumpTo('command'); }
  else if (it.view === 'recovery') { jumpTo('recovery'); }
}

/* ============================================================
 * 十、事件委托
 * ============================================================ */
function on(e, sel, fn) { document.addEventListener(e, (ev) => { const t = ev.target.closest(sel); if (t) fn(t, ev); }); }

on('click', '[data-modal-close]', () => closeModal());
on('click', '.modal-overlay', (t, ev) => { if (ev.target === t) closeModal(); });

// SDK
on('click', '[data-sdk-tab]', (t) => { sdkView = t.dataset.sdkTab; sdkSelectedFeedbackId = null; if (sdkView === 'mine') sdkMineFilter = 'all'; render(); });
on('click', '#sdkSend', sdkHandleSend);
on('click', '[data-sdk-action]', (t) => sdkHandleAction(t.dataset.sdkAction));
on('click', '[data-sdk-fb]', (t) => { sdkSelectedFeedbackId = Number(t.dataset.sdkFb); render(); });
on('click', '[data-sdk-mine-filter]', (t) => { sdkMineFilter = t.dataset.sdkMineFilter; sdkSelectedFeedbackId = null; render(); });
on('click', '[data-sdk-back]', () => { sdkSelectedFeedbackId = null; render(); });
// US-02：客户确认收到进展 → hasPendingProgress=false 闭环
on('click', '[data-sdk-ack]', (t) => { const fb = fbById(Number(t.dataset.sdkAck)); if (fb) { fb.hasPendingProgress = false; render(); } });
on('click', '[data-sdk-supplement]', (t) => {
  const fbId = Number(t.dataset.sdkSupplement);
  const ta = document.getElementById('sdkSupplement');
  const text = (ta?.value || '').trim();
  if (!text) return;
  state.messages.push({ id: Date.now(), feedback_id: fbId, sender_type: SENDER.CUSTOMER, content: text, metadata: {}, state: 'sent', created_at: Date.now() });
  const fb = fbById(fbId);
  fb.last_message_at = Date.now();
  fb.last_customer_message_at = Date.now();
  const lk = linkForFeedback(fbId);
  const tk = lk ? taskById(lk.task_id) : null;
  if (tk && [TASK_STATE.IN_PROGRESS, TASK_STATE.PENDING_REVIEW, TASK_STATE.COMPLETED].includes(tk.state)) {
    // 桥3：活跃 Case → steer 注入同一 Codex 线程（硬关联门控：同 feedback_id）
    state.messages.push({ id: Date.now() + 1, feedback_id: fbId, sender_type: SENDER.SYSTEM, content: `已将你的问题注入开发线程（${taskShortId(tk.id)}），基于当前进展生成回复草稿，团队确认后会发你。`, metadata: { steer: true, task_id: tk.id }, state: 'sent', created_at: Date.now() });
  } else {
    // 桥3 兜底：无活跃 Case → 不自由注入（避免上下文污染），转人工回复
    state.messages.push({ id: Date.now() + 1, feedback_id: fbId, sender_type: SENDER.SYSTEM, content: `你的追问已记录。当前无活跃开发线程，已转支持团队人工回复，会尽快回复你。`, metadata: { fallback: true }, state: 'sent', created_at: Date.now() });
  }
  if (ta) ta.value = '';
  render();
});

// 工作台导航 + 作用域
on('click', '[data-wb-view]', (t) => { const v = t.dataset.wbView; if (v) { wbView = v; render(); } });
on('change', '#worksetSelect', (t) => { state.active_workset_id = Number(t.value); state.selectedProjectId = 'all'; window.__kbTestResult = null; wbSelectedFb = null; wbSelectedTask = null; render(); });
on('change', '#productScopeSelect', (t) => { state.selectedProjectId = t.value === 'all' ? 'all' : Number(t.value); window.__kbTestResult = null; wbSelectedFb = null; wbSelectedTask = null; render(); });
on('change', '#automationEnabled', (t) => {
  state.automation.enabled = t.checked;
  if (t.checked) { state.automation.queue_paused = false; render(); projectTasks().filter((x) => x.state === TASK_STATE.PENDING && x.executor_id).forEach((x) => maybeAutoDispatch(x.id)); }
  else { render(); }
});
on('click', '[data-today-project]', (t) => { state.selectedProjectId = t.dataset.todayProject === 'all' ? 'all' : Number(t.dataset.todayProject); render(); });
on('click', '[data-today-item]', (t) => { wbSelectedTask = t.dataset.todayItem; render(); });
on('click', '[data-today-jump]', (t) => todayJump(t.dataset.todayJump));

// 跨 view 跳转
on('click', '[data-jump]', (t) => {
  const spec = t.dataset.jump;
  const [view, ...rest] = spec.split(':');
  if (view === 'work') jumpTo('work', { taskId: Number(rest[0]) });
  else if (view === 'feedback') jumpTo('feedback', { fbId: Number(rest[0]) });
  else if (view === 'workbench') jumpTo('workbench', { taskId: Number(rest[0]) });
  else if (view === 'command') jumpTo('command');
});

// 反馈治理
on('click', '[data-fb-item]', (t) => wbSelectFb(Number(t.dataset.fbItem)));
on('change', '[data-fb-filter]', (t) => { wbFilter.fb = t.value; render(); });
on('input', '[data-fb-search]', (t) => { wbFilter.search = t.value; render(); });
on('change', '[data-fb-sort]', (t) => { wbFilter.sort = t.value; render(); });
on('click', '[data-fb-action]', (t) => { const a = t.dataset.fbAction; if (a === 'convert') fbConvert(wbSelectedFb); else if (a === 'reply') fbReply(wbSelectedFb); else if (a === 'ignore') fbIgnore(wbSelectedFb); else if (a === 'triage-accept') fbTriageAccept(wbSelectedFb); else if (a === 'triage-adjust') fbTriageAdjust(wbSelectedFb); });
on('click', '[data-conv-confirm]', (t) => fbConvertConfirm(Number(t.dataset.convConfirm)));
on('click', '#triageAdjustConfirm', () => fbTriageAdjustConfirm(wbSelectedFb));
on('click', '[data-reply-confirm]', (t) => fbReplyConfirm(Number(t.dataset.replyConfirm)));
on('click', '[data-ignore-confirm]', (t) => fbIgnoreConfirm(Number(t.dataset.ignoreConfirm)));
on('change', '[data-fb-prio]', (t) => fbPrio(wbSelectedFb, t.value));
on('click', '[data-draft-edit]', (t) => draftEdit(Number(t.dataset.draftEdit)));
on('click', '[data-draft-confirm]', (t) => draftConfirm(Number(t.dataset.draftConfirm)));

// 任务开发
on('click', '[data-task-item]', (t) => wbSelectTask(Number(t.dataset.taskItem)));
on('change', '[data-task-assignee-select]', (t) => { wbFilter.assignee = t.value; render(); });
on('click', '[data-work-state]', (t) => { wbFilter.task = wbFilter.task === t.dataset.workState ? 'all' : t.dataset.workState; render(); });
on('click', '[data-task-reset]', () => { wbFilter.task = 'all'; wbFilter.assignee = 'all'; wbFilter.search = ''; render(); });
on('input', '[data-task-search]', (t) => { wbFilter.search = t.value; render(); });
on('change', '[data-task-state]', (t) => taskStateChange(wbSelectedTask, t.value));
on('change', '[data-task-executor]', (t) => taskExecutorChange(wbSelectedTask, Number(t.value)));
on('change', '[data-task-prio]', (t) => taskPrioChange(wbSelectedTask, t.value));
on('click', '[data-task-action]', (t) => { const a = t.dataset.taskAction; if (a === 'submit-review') taskSubmitReview(wbSelectedTask); else if (a === 'claim') taskClaim(wbSelectedTask); });
on('click', '[data-task-accept]', (t) => orgAccept(Number(t.dataset.taskAccept)));
on('click', '[data-task-reject]', (t) => orgReject(Number(t.dataset.taskReject)));
on('click', '[data-task-create]', () => openModal('创建待办', `<div class="modal-field"><label>标题</label><input id="newTaskTitle" placeholder="待办内容"></div><div class="modal-field"><label>优先级</label><select id="newTaskPrio"><option value="2">中</option><option value="1">高</option><option value="0">紧急</option></select></div>`, `<button class="secondary-button" data-modal-close>取消</button><button class="primary-button" id="newTaskConfirm">创建</button>`));
on('click', '#newTaskConfirm', () => {
  const title = document.getElementById('newTaskTitle').value.trim();
  if (!title) return;
  const prio = Number(document.getElementById('newTaskPrio').value);
  const ws = activeWorkset();
  const pid = ws ? ws.project_ids[0] : state.projects[0].id;
  const id = Math.max(0, ...state.tasks.map((t) => t.id)) + 1;
  state.tasks.push({ id, project_id: pid, father_id: null, content: title, state: TASK_STATE.PENDING, executor_id: null, creator_id: state.currentUserId, priority: prio, tags: '[Feature](#ffabc101)', created_at: Date.now(), source_feedback_id: null, thread_id: null, case_id: null, phase: 'queued' });
  closeModal();
  render();
});

// Workbench 模式切换
on('click', '[data-wb-mode]', (t) => { wbWorkbenchMode = t.dataset.wbMode; render(); });

// 组织治理
on('click', '[data-org-tab]', (t) => { state.organization_section = t.dataset.orgTab; render(); });
on('click', '[data-org-scope]', (t) => { state.selected_org_scope = t.dataset.orgScope === 'personal' ? 'personal' : Number(t.dataset.orgScope); state.selected_org_project = null; render(); });
on('click', '[data-org-project]', (t) => { state.selected_org_project = Number(t.dataset.orgProject); render(); });
on('click', '[data-project-create]', () => createProduct());
on('click', '[data-org-create-org]', () => openModal('新建组织', `<div class="modal-field"><label>组织名称</label><input id="orgName" placeholder="例如：Acme 企业"></div>`, `<button class="secondary-button" data-modal-close>取消</button><button class="primary-button" id="orgCreateConfirm">创建</button>`));
on('click', '#orgCreateConfirm', () => { const name = document.getElementById('orgName')?.value.trim(); if (!name) return; const id = Math.max(0, ...state.organization_scopes.map(s => Number(s.id) || 0)) + 1; state.organization_scopes.push({ id, name, role: 'owner', project_visibility: 'all', project_ids: [] }); state.selected_org_scope = id; closeModal(); render(); });
on('click', '[data-org-join]', () => openModal('使用邀请码加入', `<div class="modal-field"><label>邀请码</label><input id="joinCode" placeholder="输入组织邀请码"></div>`, `<button class="secondary-button" data-modal-close>取消</button><button class="primary-button" data-modal-close>加入</button>`));
on('click', '[data-org-edit-project]', (t) => openModal('编辑项目事实', `<div class="modal-field"><label>项目名称</label><input id="editName" value="${esc(projectById(Number(t.dataset.orgEditProject))?.name || '')}"></div><div class="modal-field"><label>Git 地址</label><input id="editGit" value="${esc(projectById(Number(t.dataset.orgEditProject))?.git_url || '')}"></div>`, `<button class="secondary-button" data-modal-close>取消</button><button class="primary-button" data-modal-close>保存</button>`));
on('click', '[data-kb-add]', (t) => { const pid = Number(t.dataset.kbAdd); openModal('添加知识源', `<div class="modal-field"><label>名称</label><input id="kbName" placeholder="例如：项目文档"></div><div class="modal-field"><label>类型</label><select id="kbType"><option value="代码仓库">代码仓库</option><option value="项目文档">项目文档</option><option value="FAQ">FAQ</option></select></div><div class="modal-field"><label>仓库/文档地址（开源知识库）</label><input id="kbRepo" placeholder="https://git.example.com/..."></div>`, `<button class="secondary-button" data-modal-close>取消</button><button class="primary-button" id="kbAddConfirm" data-kb-add-confirm="${pid}">添加</button>`); });
on('click', '[data-kb-add-confirm]', (t) => { const pid = Number(t.dataset.kbAddConfirm); const name = document.getElementById('kbName')?.value.trim(); const type = document.getElementById('kbType')?.value; const repo = document.getElementById('kbRepo')?.value.trim(); if (!name) return; const id = Math.max(0, ...state.knowledge_sources.map(k => k.id)) + 1; state.knowledge_sources.push({ id, project_id: pid, name, type, status: '未同步', scope: 'project', retrieve_kind: type === '代码仓库' ? 'code' : type === 'FAQ' ? 'faq' : 'doc', doc_count: 0, last_synced: null, repo_url: repo || null }); closeModal(); render(); });
on('click', '[data-member-switch]', (t) => { state.currentUserId = Number(t.dataset.memberSwitch); render(); });
on('click', '[data-kb-rebuild]', (t) => kbRebuild(t.dataset.kbRebuild));
on('click', '[data-ws-bind]', (t) => wsBind(Number(t.dataset.wsBind)));
on('click', '[data-ws-confirm]', (t) => wsConfirm(Number(t.dataset.wsConfirm)));
on('click', '[data-kb-test]', () => kbTest());

// 连续演示控制
on('click', '[data-demo-play]', () => { if (demoPlaying) demoPause(); else demoPlay(); });
on('click', '[data-demo-next]', () => { demoPause(); demoNext(); });
on('click', '[data-demo-prev]', () => { demoPause(); demoPrev(); });
on('click', '[data-demo-reset]', () => demoReset());
on('click', '[data-demo-jump]', (t) => { demoPause(); demoJump(Number(t.dataset.demoJump)); });

/* ============================================================
 * 十一、连续演示模式（04-链路演示）— 剧场式自动串演全链路
 * ============================================================ */
// 演示状态
let demoStep = -1;          // -1 未开始；0..N-1 当前已执行步骤
let demoSnapshots = [];     // 每步执行前的 state 快照（demoSnapshots[i] = 执行第 i 步前的状态）；支持回退
let demoPlaying = false;
let demoTimer = null;
let demoView = 'internal';  // 'internal' | 'sdk' 当前视角

// 演示脚本：15 步串联全链路（客户提交 → 分诊 → Loop → 草稿 → 验收 → 交付 → 追问）
// 每步：{ view, act, title, desc }。act 为幂等动作函数（重放安全，支持"从 SEED 重放到 step N"）。
const DEMO_SCRIPT = [
  { view: 'sdk', title: '① 客户提问', desc: '客户在 SDK 提问，智能客服两层知识库检索（低置信）→ 追问收集。',
    act: () => { sdkView = 'chat'; sdkConversation = [{ role: 'assistant', text: '你好！我是 Acme 产品支持助手。遇到问题可以直接问。', ts: Date.now() }]; sdkConversation.push({ role: 'user', text: '自定义模块打开白屏', ts: Date.now() }); const r = sdkRetrieve('自定义模块 白屏 报错'); sdkConversation.push({ role: 'assistant', retrieval: r, ts: Date.now() + 120 }); sdkCollecting = { position: '自定义模块页', phenomenon: '点击后白屏', expect: '正常打开模块配置' }; sdkConversation.push({ role: 'assistant', text: '帮你记录下来转团队跟进。请补充：哪个页面？期望结果？', ts: Date.now() + 200 }); } },
  { view: 'sdk', title: '② 确认提交', desc: '客户确认结构化结果，生成 Feedback（status=pending, triage=pending）。',
    act: () => { sdkHandleAction('confirm'); } },
  { view: 'internal', title: '③ 内部收到反馈', desc: '新反馈到达 Feedback 治理页（待判断）。AI 分诊初判展示。',
    act: () => { jumpTo('feedback', {}); const fb = state.feedbacks.find(f => f.custom_user_id === state.sdkCustomUserId && f.triage_status === TRIAGE.PENDING && f.status === FB_STATUS.PENDING) || state.feedbacks.find(f => f.triage_status === TRIAGE.PENDING && f.status === FB_STATUS.PENDING); if (fb) wbSelectedFb = fb.id; } },
  { view: 'internal', title: '④ AI 分诊 + 转待办', desc: '采纳 AI 初判；分诊决策转为开发任务（创建 TASK + FeedbackTaskLink，FB→converted）。',
    act: () => { const fb = wbSelectedFb ? fbById(wbSelectedFb) : state.feedbacks.find(f => f.status === FB_STATUS.PENDING); if (!fb) return; if (fb.ai_triage && fb.ai_triage.accepted !== true) fbTriageAccept(fb.id); if (!linkForFeedback(fb.id)) { fbConvert(fb.id); fbConvertConfirm(fb.id); closeModal(); } } },
  { view: 'internal', title: '⑤ 认领任务', desc: 'Work 页待认领任务 → 认领（executor 分配），进入 automation 队列。',
    act: () => { const fb = state.feedbacks.find(f => f.custom_user_id === state.sdkCustomUserId && f.status === FB_STATUS.CONVERTED) || state.feedbacks.find(f => f.status === FB_STATUS.CONVERTED); const lk = fb ? linkForFeedback(fb.id) : null; if (!lk) return; const t = taskById(lk.task_id); if (!t) return; jumpTo('work', { taskId: t.id }); wbSelectedTask = t.id; if (t.state === 'pending' && !t.executor_id) taskClaim(t.id); } },
  { view: 'internal', title: '⑥ Codex Loop 启动', desc: '门控满足 → 自动领取 → 起 Codex 线程。Command 态势"查看对话"下钻 Workbench，看 Gap-by-Gap 推进时间线。',
    act: () => { const fb = state.feedbacks.find(f => f.custom_user_id === state.sdkCustomUserId && (f.status === FB_STATUS.CONVERTED || f.status === FB_STATUS.IN_PROGRESS)) || state.feedbacks.find(f => f.status === FB_STATUS.CONVERTED || f.status === FB_STATUS.IN_PROGRESS); const lk = fb ? linkForFeedback(fb.id) : null; if (!lk) return; const t = taskById(lk.task_id); if (!t) return; jumpTo('workbench', { taskId: t.id }); if (t.state === 'pending') maybeAutoDispatch(t.id); } },
  { view: 'internal', title: '⑦ Loop 达成 + 草稿生成', desc: '全部 Gap done → Git 收尾 → closeout 生成进展草稿（pending_review，桥2）。',
    act: () => { const t = state.tasks.find(x => x.state === 'in_progress' || x.state === 'completed'); if (t) { if (t.state === 'in_progress') { t.state = TASK_STATE.COMPLETED; t.phase = 'completed'; } const lk = linkForTask(t.id); const fb = lk ? fbById(lk.feedback_id) : null; if (fb && !draftForFeedback(fb.id)) state.messages.push({ id: Date.now(), feedback_id: fb.id, sender_type: SENDER.SYSTEM, content: `${firstLine(t.content)}已处理完成，预计随下一次发布生效。`, metadata: { draft: true, task_id: t.id }, state: 'pending_review', created_at: Date.now() }); } jumpTo('feedback', {}); const t2 = state.tasks.find(x => x.state === 'completed'); if (t2) { const lk = linkForTask(t2.id); if (lk) wbSelectedFb = lk.feedback_id; } } },
  { view: 'internal', title: '⑧ 草稿确认 → 发送客户', desc: '处理人在 Feedback 详情确认草稿 → state→sent，客户侧"有进展待确认"。',
    act: () => { const fb = state.feedbacks.find(f => f.custom_user_id === state.sdkCustomUserId && draftForFeedback(f.id)) || state.feedbacks.find(f => draftForFeedback(f.id)); if (!fb) return; wbSelectedFb = fb.id; const d = draftForFeedback(fb.id); if (d) draftConfirm(d.id); closeModal(); } },
  { view: 'sdk', title: '⑨ 客户收到进展', desc: '客户 SDK 我的反馈看到"有进展"，确认收到进展（hasPendingProgress→false）。',
    act: () => { sdkView = 'mine'; const fb = state.feedbacks.find(f => f.custom_user_id === state.sdkCustomUserId && f.hasPendingProgress) || state.feedbacks.find(f => f.hasPendingProgress); if (fb) sdkSelectedFeedbackId = fb.id; } },
  { view: 'sdk', title: '⑩ 客户确认进展', desc: '客户点"确认收到进展"，闭环。可继续追问。',
    act: () => { const fb = state.feedbacks.find(f => f.custom_user_id === state.sdkCustomUserId && f.hasPendingProgress) || state.feedbacks.find(f => f.hasPendingProgress); if (fb) { fb.hasPendingProgress = false; sdkSelectedFeedbackId = fb.id; } } },
  { view: 'internal', title: '⑪ 验收', desc: 'Workbench acceptance 模式 → 验收通过（Task→accepted，触发产物交付）。',
    act: () => { const demoFb = state.feedbacks.find(f => f.custom_user_id === state.sdkCustomUserId && (f.status === FB_STATUS.COMPLETED || f.status === FB_STATUS.IN_PROGRESS)); const lk = demoFb ? linkForFeedback(demoFb.id) : null; const t = lk ? taskById(lk.task_id) : state.tasks.find(x => x.state === 'completed' || x.state === 'pending_review'); if (!t) return; if (t.state !== 'pending_review') { t.state = 'pending_review'; } jumpTo('work', { taskId: t.id }); wbSelectedTask = t.id; orgAccept(t.id); closeModal(); } },
  { view: 'internal', title: '⑫ 产物交付回写', desc: '验收通过 → 构建产物 → artifact_url 回写 → FB released。Command 态势可见闭环。',
    act: () => { jumpTo('command', {}); } },
  { view: 'sdk', title: '⑬ 客户收到交付', desc: '客户 SDK 看到"已交付 + 产物指向"（artifact_url）。',
    act: () => { sdkView = 'mine'; const fb = state.feedbacks.find(f => f.custom_user_id === state.sdkCustomUserId && f.status === FB_STATUS.RELEASED) || state.feedbacks.find(f => f.status === FB_STATUS.RELEASED); if (fb) sdkSelectedFeedbackId = fb.id; } },
  { view: 'sdk', title: '⑭ 客户追问（活跃 Case）', desc: '处理中反馈追问 → 桥3 steer 注入开发线程生成草稿回复。',
    act: () => { sdkView = 'mine'; const fb = state.feedbacks.find(f => f.custom_user_id === state.sdkCustomUserId && f.status === FB_STATUS.IN_PROGRESS) || state.feedbacks.find(f => f.status === FB_STATUS.IN_PROGRESS); if (fb) sdkSelectedFeedbackId = fb.id; } },
  { view: 'sdk', title: '⑮ 闭环', desc: '链路完成：反馈→分诊→开发→进展→验收→交付→追问，全环节串联。无活跃 Case 追问走人工兜底。',
    act: () => { sdkView = 'mine'; sdkSelectedFeedbackId = null; } },
];

// 从 SEED 重放到目标步骤（保证任意"上一步/跳转"状态正确）
function demoReplayTo(targetStep) {
  state = structuredClone(SEED);
  sdkView = 'chat'; sdkConversation = []; sdkCollecting = null; sdkSelectedFeedbackId = null;
  wbView = 'today'; wbSelectedFb = null; wbSelectedTask = null; wbWorkbenchMode = 'review'; wbOrgTab = 'members';
  window.__kbTestResult = null; window.__kbTestQuery = '';
  demoStep = -1;
  for (let i = 0; i <= targetStep; i++) {
    const s = DEMO_SCRIPT[i];
    demoView = s.view;
    s.act();
    closeModal(); // 演示步骤不展示弹窗（fbTriageAccept/fbConvertConfirm 等会开弹窗）
    demoStep = i;
  }
  demoView = DEMO_SCRIPT[targetStep].view;
  render();
}

function demoStart() { demoReplayTo(-1 < 0 ? 0 : 0); demoStep = -1; state = structuredClone(SEED); render(); demoNext(); }
function demoNext() {
  if (demoStep >= DEMO_SCRIPT.length - 1) { demoPause(); return; }
  const target = demoStep + 1;
  demoReplayTo(target);
  // 演示 UI 进度更新
  demoUpdateBar();
}
function demoPrev() {
  if (demoStep <= 0) { demoReplayTo(0); demoUpdateBar(); return; }
  demoReplayTo(demoStep - 1);
  demoUpdateBar();
}
function demoJump(step) {
  step = Math.max(-1, Math.min(DEMO_SCRIPT.length - 1, step));
  if (step < 0) { state = structuredClone(SEED); demoStep = -1; render(); demoUpdateBar(); return; }
  demoReplayTo(step); demoUpdateBar();
}
function demoPlay() {
  if (demoStep >= DEMO_SCRIPT.length - 1) demoJump(-1);
  demoPlaying = true; demoUpdateBar();
  const tick = () => {
    if (!demoPlaying) return;
    if (demoStep >= DEMO_SCRIPT.length - 1) { demoPause(); return; }
    demoNext();
    demoTimer = setTimeout(tick, 3200);
  };
  demoTimer = setTimeout(tick, 800);
}
function demoPause() { demoPlaying = false; if (demoTimer) clearTimeout(demoTimer); demoUpdateBar(); }
function demoReset() { demoPause(); state = structuredClone(SEED); demoStep = -1; sdkView = 'chat'; sdkConversation = []; sdkCollecting = null; sdkSelectedFeedbackId = null; demoView = 'internal'; render(); demoUpdateBar(); }

function demoUpdateBar() {
  const bar = document.getElementById('demoBar');
  if (!bar) return;
  const total = DEMO_SCRIPT.length;
  const cur = demoStep < 0 ? 0 : demoStep + 1;
  const pct = (cur / total) * 100;
  const fill = bar.querySelector('.demo-progress-fill');
  if (fill) fill.style.width = pct + '%';
  const titleEl = bar.querySelector('.demo-step-title');
  const descEl = bar.querySelector('.demo-step-desc');
  const idxEl = bar.querySelector('.demo-step-idx');
  if (idxEl) idxEl.textContent = (demoStep < 0 ? '0' : demoStep + 1) + ' / ' + total;
  const cur2 = demoStep < 0 ? null : DEMO_SCRIPT[demoStep];
  if (titleEl) titleEl.textContent = cur2 ? cur2.title : '准备开始';
  if (descEl) descEl.textContent = cur2 ? cur2.desc : '点击播放或下一步，开始串演客户支持链路。';
  const playBtn = bar.querySelector('[data-demo-play]');
  if (playBtn) playBtn.textContent = demoPlaying ? '⏸ 暂停' : '▶ 播放';
  // 高亮当前视角
  document.body.dataset.demoView = demoView;
}

// 演示页渲染：根据 demoView 渲染内部或 SDK 视图
function renderDemo() {
  // 先更新控制条
  demoUpdateBar();
  // 内部壳 vs SDK 壳显隐由 CSS（body[data-demo-view]）控制
  if (demoView === 'sdk') {
    // 隐藏内部壳，显示 SDK 壳
    const internal = document.querySelector('.desktop-app');
    if (internal) internal.style.display = 'none';
    const sdkStage = document.getElementById('sdkStage');
    if (sdkStage) sdkStage.style.display = 'block';
    renderSdk();
  } else {
    const sdkStage = document.getElementById('sdkStage');
    if (sdkStage) sdkStage.style.display = 'none';
    const internal = document.querySelector('.desktop-app');
    if (internal) internal.style.display = 'grid';
    renderInternal();
  }
}

/* ============================================================
 * 十二、初始化
 * ============================================================ */
document.addEventListener('DOMContentLoaded', render);
if (document.readyState !== 'loading') render();
