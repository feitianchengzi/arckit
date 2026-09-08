/*
 * 产品支持链路设计稿 — 渲染逻辑
 *
 * 设计原则：
 *  - 视觉 token / 组件类全部来自 ArcOrbit Desktop styles.css（本文件不定义 token）
 *  - 功能逻辑 / seed 数据严格对齐真实代码模型：
 *      Task 7 态、Feedback status 7 态 + triage_status 3 态、
 *      FeedbackMessage sender_type(customer/developer/system)、
 *      FeedbackTaskLink relation_type(converted_to)、executor 分配=认领
 *  - 用户可见文案用业务语言（反馈/任务/进展/验收/交付），不暴露 Case/Gap/triage/external_wait 等协议术语
 *  - 后端零代码缺口用 `// 待建` 注释 + 角标标注，不假装已实现
 *
 * 渲染模式对齐 ArcOrbit renderer.js：全局 state + render() 分发 + innerHTML 模板字符串，无框架。
 */
'use strict';

/* ============================================================
 * 一、状态常量与映射（严格对齐 services/workshop-api/models）
 * ============================================================ */

// Task 7 态 — 对齐 models/task.go
const TASK_STATE = {
  PENDING_REVIEW: 'pending_review', // 默认
  PENDING: 'pending',
  IN_PROGRESS: 'in_progress',
  COMPLETED: 'completed',
  ACCEPTED: 'accepted',
  CANCELLED: 'cancelled',
  BLOCKED: 'blocked',
};

// Feedback status 7 态 — 对齐 models/feedback.go
const FB_STATUS = {
  PENDING: 'pending',
  ACCEPTED: 'accepted',
  CONVERTED: 'converted',
  IN_PROGRESS: 'in_progress',
  COMPLETED: 'completed',
  IGNORED: 'ignored',
  RELEASED: 'released',
};

// triage_status 3 态 — 对齐 models/feedback.go
const TRIAGE = { PENDING: 'pending', ACCEPTED: 'accepted', IGNORED: 'ignored' };

// message sender_type — 对齐 models/feedback_workflow.go
const SENDER = { CUSTOMER: 'customer', DEVELOPER: 'developer', SYSTEM: 'system' };

// task_link relation_type — 对齐 FeedbackTaskLink
const RELATION = { CONVERTED_TO: 'converted_to', RELATED: 'related', DUPLICATE: 'duplicate' };

// member role — 对齐 ProjectMember
const ROLE = { OWNER: 'owner', ADMIN: 'admin', MEMBER: 'member' };

// capabilities — 对齐 orchestration-plan 步骤2（Duty→Capabilities，待建）
const CAP = { TRIAGE: 'triage', EXECUTE: 'execute', ACCEPT: 'accept' };

// 内部端 Task 业务文案 pill — 对齐 todo-web LINEAR_STATUS_OPTIONS
const TASK_PILL = {
  [TASK_STATE.PENDING_REVIEW]: { label: '待验收', cls: 'pending_review' },
  [TASK_STATE.PENDING]: { label: '待认领', cls: 'pending' },
  [TASK_STATE.IN_PROGRESS]: { label: '处理中', cls: 'in_progress' },
  [TASK_STATE.COMPLETED]: { label: '已解决', cls: 'completed' },
  [TASK_STATE.ACCEPTED]: { label: '已验收', cls: 'accepted' },
  [TASK_STATE.CANCELLED]: { label: '已取消', cls: 'cancelled' },
  [TASK_STATE.BLOCKED]: { label: '已阻塞', cls: 'blocked' },
};

// 内部端 Feedback 业务文案 pill — 对齐 feedback-console STATE_META
const FB_PILL = {
  [FB_STATUS.PENDING]: { label: '待判断', cls: 'pending' },
  [FB_STATUS.ACCEPTED]: { label: '已受理', cls: 'in_progress' },
  [FB_STATUS.CONVERTED]: { label: '已流转', cls: 'in_progress' },
  [FB_STATUS.IN_PROGRESS]: { label: '处理中', cls: 'in_progress' },
  [FB_STATUS.COMPLETED]: { label: '已解决', cls: 'completed' },
  [FB_STATUS.IGNORED]: { label: '已忽略', cls: 'cancelled' },
  [FB_STATUS.RELEASED]: { label: '已交付', cls: 'accepted' },
};

// 客户端可见简化态 — 对齐 SDK customerStatusFromFeedback
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

// 优先级 — Task priority(0紧急/1高/2中/3低) 对齐 models/task.go；Feedback P1/P2/P3 对齐 feedback-console
const TASK_PRIO = {
  0: { label: '紧急', marker: 'urgent' },
  1: { label: '高', marker: 'high' },
  2: { label: '中', marker: 'medium' },
  3: { label: '低', marker: 'low' },
};
const FB_PRIO = { P1: 1, P2: 2, P3: 3 }; // feedback P 标签 → task priority 映射（对齐 priorityToTaskPriority）
const PRIO_BADGE = { P1: 'P1', P2: 'P2', P3: 'P3' };

// Task 状态 → 状态圆点 tone（对齐 todo-web LinearStatusMarker）
const STATE_TONE = {
  [TASK_STATE.PENDING_REVIEW]: 'backlog',
  [TASK_STATE.PENDING]: 'todo',
  [TASK_STATE.IN_PROGRESS]: 'progress',
  [TASK_STATE.COMPLETED]: 'review',
  [TASK_STATE.ACCEPTED]: 'done',
  [TASK_STATE.CANCELLED]: 'canceled',
  [TASK_STATE.BLOCKED]: 'blocked',
};

// Task 状态 → 回写 Feedback status（对齐 handler/feedback_workflow.go mapTaskStateToFeedbackStatus）
function taskStateToFeedbackStatus(taskState) {
  switch (taskState) {
    case TASK_STATE.PENDING:
    case TASK_STATE.PENDING_REVIEW: return FB_STATUS.CONVERTED;
    case TASK_STATE.IN_PROGRESS:
    case TASK_STATE.BLOCKED: return FB_STATUS.IN_PROGRESS;
    case TASK_STATE.COMPLETED: return FB_STATUS.IN_PROGRESS; // 开发完成待验收，反馈仍处理中
    case TASK_STATE.ACCEPTED: return FB_STATUS.COMPLETED; // 验收通过，开发闭环
    case TASK_STATE.CANCELLED: return FB_STATUS.IGNORED;
    default: return FB_STATUS.CONVERTED;
  }
}

/* ============================================================
 * 二、seed 数据（对齐真实模型字段）
 * ============================================================ */

const SEED = {
  schema_version: '2026-09-08',
  // 多客户多项目（对齐 models/project.go Project；customer 为客户企业，project 为产品线）
  // 试点：Acme 企业下两个项目（Console + Admin），Beta 企业一个项目（Portal）— 体现客户/项目两级
  projects: [
    { id: 1, name: 'Acme Console', customer: 'Acme', git_url: 'https://git.example.com/acme/console', local_path: '/Users/zqs/arckit-workspaces/acme/console', participating: true, organization_id: null },
    { id: 2, name: 'Beta Portal', customer: 'Beta', git_url: 'https://git.example.com/beta/portal', local_path: '/Users/zqs/arckit-workspaces/beta/portal', participating: true, organization_id: null },
    { id: 3, name: 'Acme Admin', customer: 'Acme', git_url: 'https://git.example.com/acme/admin', local_path: '/Users/zqs/arckit-workspaces/acme/admin', participating: true, organization_id: null },
  ],
  // 作用域筛选：客户/项目两级，默认全部（聚合视图跨客户，隔离视图收缩到单客户）
  scope: { customer: 'all', project: 'all' },
  // automation 总闸（对齐 automation-coordinator.mjs：enabled/queue_paused/concurrency_limit）
  automation: { enabled: true, queue_paused: false, concurrency_limit: 3 },
  currentUserId: 1,
  // SDK 侧演示客户身份（对齐 custom_user_id 自由字符串）
  sdkCustomUserId: 'u_acme_001',
  members: [
    { id: 1, name: '张三', role: ROLE.ADMIN, caps: [CAP.TRIAGE, CAP.EXECUTE, CAP.ACCEPT] },
    { id: 2, name: '李明', role: ROLE.MEMBER, caps: [CAP.EXECUTE] },
    { id: 3, name: '陈思', role: ROLE.MEMBER, caps: [CAP.EXECUTE] },
  ],
  feedbacks: [
    {
      id: 830160, project_id: 1, short_id: 'FB-830160', title: '导出 CSV 中文乱码',
      content: '导出的 CSV 文件用 Excel 打开后中文显示为乱码，疑似编码未设为 UTF-8 BOM。',
      status: FB_STATUS.PENDING, triage_status: TRIAGE.PENDING,
      type: 'issue', input_mode: 'dialog',
      custom_user_id: 'u_acme_002', user_phone: null, user_email: 'pm@acme.example',
      data: { priority: 'P2', structured: { position: '导出页', phenomenon: 'CSV 中文乱码', expect: 'Excel 正常显示中文' } },
      last_message_at: Date.now() - 1200_000, last_customer_message_at: Date.now() - 1200_000,
      hasPendingProgress: false,
      // AI 分诊辅助 — 低置信样本（< 0.7 阈值，展示低置信态）
      ai_triage: { type: 'bug', summary: 'CSV 导出编码问题，疑似缺 UTF-8 BOM', clarity: 85, impact: 60, urgency: 50, priority: 'P2', actionability: 'high', need_more_info: false, confidence: 0.68, reasoning: '明确编码关键词+位置，但置信度未达阈值' },
    },
    {
      id: 830141, project_id: 1, short_id: 'FB-830141', title: '自定义模块打开报错',
      content: '在控制台点击"自定义模块"按钮后页面白屏，控制台报 Cannot read property of undefined。',
      status: FB_STATUS.CONVERTED, triage_status: TRIAGE.ACCEPTED,
      type: 'issue', input_mode: 'dialog',
      custom_user_id: 'u_acme_001', user_phone: null, user_email: 'client@acme.example',
      data: { priority: 'P1', structured: { position: '自定义模块页', phenomenon: '点击后白屏', expect: '正常打开模块配置' } },
      last_message_at: Date.now() - 3600_000, last_customer_message_at: Date.now() - 3600_000,
      hasPendingProgress: false,
      // AI 分诊辅助结果 — 对齐 AI反馈分诊方案.md v0.7 结构化输出（后端待建，前端先展示）
      ai_triage: { type: 'bug', summary: '自定义模块点击白屏，疑似 undefined 访问', clarity: 78, impact: 82, urgency: 70, priority: 'P1', actionability: 'high', need_more_info: false, confidence: 0.72, reasoning: '命中崩溃关键词+明确位置，信息较完整' },
    },
    {
      id: 830138, project_id: 1, short_id: 'FB-830138', title: '希望增加批量审批',
      content: '目前审批只能逐条处理，当待办多的时候效率很低，希望支持批量勾选审批。',
      status: FB_STATUS.IN_PROGRESS, triage_status: TRIAGE.ACCEPTED,
      type: 'suggestion', input_mode: 'dialog',
      custom_user_id: 'u_acme_002', user_phone: null, user_email: 'pm@acme.example',
      data: { priority: 'P2', structured: { position: '审批中心', phenomenon: '只能逐条审批', expect: '批量勾选后一次审批' } },
      last_message_at: Date.now() - 7200_000, last_customer_message_at: Date.now() - 9000_000,
      hasPendingProgress: false,
    },
    {
      id: 830130, project_id: 1, short_id: 'FB-830130', title: '密码重置邮件收不到',
      content: '点击忘记密码后一直没收到重置邮件，疑似企业邮箱被过滤。',
      status: FB_STATUS.CONVERTED, triage_status: TRIAGE.ACCEPTED,
      type: 'issue', input_mode: 'dialog',
      custom_user_id: 'u_acme_001', user_phone: null, user_email: 'client@acme.example',
      data: { priority: 'P2', structured: { position: '忘记密码', phenomenon: '收不到重置邮件', expect: '能收到重置链接' } },
      last_message_at: Date.now() - 1800_000, last_customer_message_at: Date.now() - 1800_000,
      hasPendingProgress: false,
    },
    // Beta Portal 项目反馈
    {
      id: 840110, project_id: 2, short_id: 'FB-840110', title: '门户首页加载缓慢',
      content: '首次打开门户首页需要 5 秒以上，希望优化首屏加载速度。',
      status: FB_STATUS.CONVERTED, triage_status: TRIAGE.ACCEPTED,
      type: 'suggestion', input_mode: 'dialog',
      custom_user_id: 'u_beta_010', user_phone: null, user_email: 'ops@beta.example',
      data: { priority: 'P2', structured: { position: '门户首页', phenomenon: '首屏 5 秒+', expect: '2 秒内打开' } },
      last_message_at: Date.now() - 5400_000, last_customer_message_at: Date.now() - 5400_000,
      hasPendingProgress: false,
    },
    // Acme Admin 项目反馈（同客户多项目演示）
    {
      id: 830155, project_id: 3, short_id: 'FB-830155', title: '后台成员导出缺字段',
      content: '成员管理页导出 CSV 时缺少"最后登录"字段，希望补上。',
      status: FB_STATUS.IN_PROGRESS, triage_status: TRIAGE.ACCEPTED,
      type: 'suggestion', input_mode: 'dialog',
      custom_user_id: 'u_acme_003', user_phone: null, user_email: 'admin@acme.example',
      data: { priority: 'P3', structured: { position: '成员管理', phenomenon: '导出缺字段', expect: '含最后登录' } },
      last_message_at: Date.now() - 2800_000, last_customer_message_at: Date.now() - 2800_000,
      hasPendingProgress: false,
    },
  ],
  messages: [
    { id: 9007, feedback_id: 830160, sender_type: SENDER.CUSTOMER, content: '导出的 CSV 文件用 Excel 打开后中文显示为乱码，疑似编码未设为 UTF-8 BOM。', metadata: { initial: true }, attachments: [], created_at: Date.now() - 1200_000 },
    { id: 9001, feedback_id: 830141, sender_type: SENDER.CUSTOMER, content: '在控制台点击"自定义模块"按钮后页面白屏，控制台报 Cannot read property of undefined。', metadata: { initial: true }, attachments: [], created_at: Date.now() - 3600_000 },
    { id: 9010, feedback_id: 830141, sender_type: SENDER.SYSTEM, content: '已转为开发任务 TASK-200，已认领并启动 Codex 开发线程。', metadata: {}, attachments: [], created_at: Date.now() - 3400_000 },
    { id: 9002, feedback_id: 830138, sender_type: SENDER.CUSTOMER, content: '目前审批只能逐条处理，当待办多的时候效率很低，希望支持批量勾选审批。', metadata: { initial: true }, attachments: [], created_at: Date.now() - 9000_000 },
    { id: 9003, feedback_id: 830130, sender_type: SENDER.CUSTOMER, content: '点击忘记密码后一直没收到重置邮件，疑似企业邮箱被过滤。', metadata: { initial: true }, attachments: [], created_at: Date.now() - 1800_000 },
    { id: 9004, feedback_id: 830130, sender_type: SENDER.SYSTEM, content: '已转为开发任务 TASK-195，处理人待认领。', metadata: {}, attachments: [], created_at: Date.now() - 1700_000 },
    { id: 9005, feedback_id: 840110, sender_type: SENDER.CUSTOMER, content: '首次打开门户首页需要 5 秒以上，希望优化首屏加载速度。', metadata: { initial: true }, attachments: [], created_at: Date.now() - 5400_000 },
    { id: 9006, feedback_id: 830155, sender_type: SENDER.CUSTOMER, content: '成员管理页导出 CSV 时缺少"最后登录"字段，希望补上。', metadata: { initial: true }, attachments: [], created_at: Date.now() - 2800_000 },
  ],
  tasks: [
    { id: 198, project_id: 1, father_id: null, content: '实现批量审批功能\n在审批中心增加多选 + 批量通过/驳回能力。', state: TASK_STATE.IN_PROGRESS, executor_id: 2, creator_id: 1, priority: 2, tags: '[Feature](#ffabc101)', created_at: Date.now() - 8000_000, source_feedback_id: 830138, thread_id: 'thd_198_a1b2c3', case_id: 'CASE-198', phase: 'in_progress', gaps: [
      { id: 'G1', title: '审批数据层多选状态建模', state: 'done', evidence: 'ApprovalStore.ts 增加 selectedIds Set', at: Date.now() - 7600_000 },
      { id: 'G2', title: '批量通过/驳回 API + 权限校验', state: 'done', evidence: 'POST /batch-approve + role 中间件', at: Date.now() - 5200_000 },
      { id: 'G3', title: '审批中心多选 UI + 批量操作栏', state: 'in_progress', evidence: 'BatchActionBar 组件实现中', at: Date.now() - 800_000 },
      { id: 'G4', title: '并发场景回归测试', state: 'pending', evidence: null, at: null },
    ] },
    { id: 200, project_id: 1, father_id: null, content: '修复通知未读数不刷新\n多会话并发下未读数偶发不刷新，疑似 WebSocket 推送去重问题。', state: TASK_STATE.PENDING_REVIEW, executor_id: 3, creator_id: 1, priority: 1, tags: '[Bug](#ffff0000)', created_at: Date.now() - 4000_000, source_feedback_id: 830141, thread_id: 'thd_200_d4e5f6', case_id: 'CASE-200', phase: 'completed', gaps: [
      { id: 'G1', title: '定位 WebSocket 去重逻辑', state: 'done', evidence: 'unreadAggregator.aggregate 跨会话聚合遗漏', at: Date.now() - 3800_000 },
      { id: 'G2', title: '补跨会话聚合判断 + 单测', state: 'done', evidence: '增加 sessionId 维度去重 + jest 用例 3 条', at: Date.now() - 3000_000 },
      { id: 'G3', title: 'Git 收尾提交（runSameThreadCloseout）', state: 'done', evidence: 'commit a1b2c3d on feat/unread-fix', at: Date.now() - 2200_000 },
    ] },
    { id: 195, project_id: 1, father_id: null, content: '密码重置邮件链路排查\n检查邮件发送服务 + 企业邮箱过滤规则。', state: TASK_STATE.PENDING, executor_id: null, creator_id: 1, priority: 2, tags: '[Bug](#ffff0000)', created_at: Date.now() - 1700_000, source_feedback_id: 830130, thread_id: null, case_id: null, phase: 'queued' },
    { id: 210, project_id: 2, father_id: null, content: '优化门户首屏加载\n拆分首屏资源、懒加载非关键模块。', state: TASK_STATE.PENDING, executor_id: null, creator_id: 1, priority: 2, tags: '[Feature](#ffabc101)', created_at: Date.now() - 5000_000, source_feedback_id: 840110, thread_id: null, case_id: null, phase: 'queued' },
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
  // 草稿 — 基于 FeedbackMessage(sender_type=system) 扩展；桥2 待建
  drafts: [
    { id: 1, project_id: 1, feedback_id: 830141, task_id: 200, state: 'pending_review', content: '未读数刷新问题已定位：多会话并发时 WebSocket 去重逻辑遗漏了跨会话聚合，已补充聚合判断。预计随下一次发布生效，请留意更新。', created_at: Date.now() - 2000_000 },
  ],
  // 交付轨道步进 — 产物交付 artifact_url 回写（部署不在本期）
  deliveries: [
    { task_id: 200, step: 1, feedback_id: 830141, artifact_url: null, build_id: null },
  ],
  // 知识源 — 两层知识库：客户私有库(代码仓库+项目文档+FAQ) + 共享产品库
  // 增强字段：检索类型 / 文档数 / 最后同步 / 索引状态（对齐智能客服两层检索）
  knowledge_sources: [
    { id: 1, project_id: 1, name: 'Acme Console 代码仓库', type: '代码仓库', status: '已同步', scope: 'project', retrieve_kind: 'code', doc_count: 1284, last_synced: Date.now() - 7200_000 },
    { id: 2, project_id: 1, name: 'Acme 产品文档', type: '项目文档', status: '已同步', scope: 'project', retrieve_kind: 'doc', doc_count: 96, last_synced: Date.now() - 14400_000 },
    { id: 3, project_id: 1, name: 'Acme 常见问题', type: 'FAQ', status: '索引中', scope: 'project', retrieve_kind: 'faq', doc_count: 0, last_synced: null },
    { id: 4, project_id: 2, name: 'Beta 代码仓库', type: '代码仓库', status: '已同步', scope: 'project', retrieve_kind: 'code', doc_count: 842, last_synced: Date.now() - 21600_000 },
    { id: 6, project_id: 3, name: 'Acme Admin 代码仓库', type: '代码仓库', status: '已同步', scope: 'project', retrieve_kind: 'code', doc_count: 612, last_synced: Date.now() - 10800_000 },
    { id: 7, project_id: 3, name: 'Acme Admin 文档', type: '项目文档', status: '未同步', scope: 'project', retrieve_kind: 'doc', doc_count: 0, last_synced: null },
    { id: 5, name: '共享产品知识库', type: '公共知识', status: '已同步', scope: 'public', retrieve_kind: 'doc', doc_count: 320, last_synced: Date.now() - 86400_000 },
  ],
};

/* ============================================================
 * 三、state 管理
 * ============================================================ */
const STORAGE_KEY = 'arcorbit-support-v2';
const SCHEMA_VERSION = '2026-09-08-r2'; // bump when seed structure changes → 旧数据回退 SEED
let state = loadState();

function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      // 严格 schema 版本校验：版本不符直接回退权威 SEED（不补齐陈旧数据，避免退化显示）
      if (parsed && parsed.schema_version === SCHEMA_VERSION && Array.isArray(parsed.projects)) {
        return parsed;
      }
      // 旧版本/旧格式 → 丢弃，用权威 SEED
      localStorage.removeItem(STORAGE_KEY);
    }
  } catch (e) {
    localStorage.removeItem(STORAGE_KEY);
  }
  return structuredClone(SEED);
}
function saveState() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}
function resetState() {
  state = structuredClone(SEED);
  saveState();
  render();
}

/* ============================================================
 * 四、工具函数
 * ============================================================ */
function esc(s) {
  return String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}
function fmtDate(ts) {
  const d = new Date(ts);
  const pad = (n) => String(n).padStart(2, '0');
  return `${d.getMonth() + 1}月${d.getDate()}日 ${pad(d.getHours())}:${pad(d.getMinutes())}`;
}
function fmtRelative(ts) {
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
// 作用域：客户/项目两级筛选（默认全部）。聚合视图跨客户，隔离视图收缩到单客户/单项目。
function projectById(id) { return state.projects.find((p) => p.id === id); }
function customerOf(projectId) { const p = projectById(projectId); return p ? p.customer : null; }
function customers() { return [...new Set(state.projects.map((p) => p.customer))]; }
// 当前 scope 内的项目 id 数组（'all' 全部 / 某客户其所有项目 / 某项目单个）
function scopeProjectIds() {
  const s = state.scope;
  if (s.project !== 'all') return [Number(s.project)];
  if (s.customer !== 'all') return state.projects.filter((p) => p.customer === s.customer).map((p) => p.id);
  return state.projects.map((p) => p.id);
}
function inScope(projectId) { return scopeProjectIds().includes(projectId); }
// scope 是否收缩到单项目（隔离视图用）
function isSingleProject() { return state.scope.project !== 'all'; }
// 当前 scope 标签（面包屑用）
function scopeLabel() {
  const s = state.scope;
  if (s.project !== 'all') { const p = projectById(Number(s.project)); return p ? `${p.customer} · ${p.name}` : '未选择'; }
  if (s.customer !== 'all') return `${s.customer} · 全部项目`;
  return '全部客户';
}
// 兼容：单项目时返回该项目，否则 null（隔离视图项目信息用）
function currentProject() { return isSingleProject() ? projectById(Number(state.scope.project)) : null; }
// 聚合视图作用域过滤（替换原 project* 单值语义）
function projectFbs() { return state.feedbacks.filter((f) => inScope(f.project_id)); }
function projectTasks() { return state.tasks.filter((t) => inScope(t.project_id)); }
function projectDrafts() { return state.drafts.filter((d) => inScope(d.project_id)); }
function projectKnowledge() { return state.knowledge_sources.filter((k) => k.scope !== 'project' || inScope(k.project_id)); }

/* ============================================================
 * 四-B、智能客服两层知识库检索（模拟 — 后端待建）
 * 对齐 orchestration-plan 步骤5 + AI反馈分诊方案：
 *   - 客户私有库（代码仓库语义索引 + 项目文档）按项目隔离
 *   - 共享产品库（arckit facts + FAQ）所有项目共用
 *   - 合并结果标注来源 + 计算置信度
 *   - 初期：高置信生成草稿（待确认），低置信转追问收集
 * ============================================================ */
// 置信度阈值（初期人工拍保守值 — 无标注集前规则硬匹配才算高置信）
const CONFIDENCE_THRESHOLD = 0.7;

// 产品库 FAQ/文档种子（模拟共享产品库内容）
const PRODUCT_KB = [
  { kw: ['登录', 'login', '账号', '密码'], title: '如何登录控制台', snippet: '在登录页输入企业邮箱+密码，支持 SSO 单点登录。', source: 'product_lib', type: 'faq', score: 0.8 },
  { kw: ['批量审批', '审批'], title: '批量审批使用指南', snippet: '审批中心支持多选后一次通过/驳回。', source: 'product_lib', type: 'doc', score: 0.78 },
  { kw: ['用法', '操作', '怎么用'], title: '产品使用指引', snippet: '左侧导航选择模块，顶部"更多"含操作指引。', source: 'product_lib', type: 'faq', score: 0.65 },
  { kw: ['邮箱', '重置', '收不到'], title: '密码重置邮件排查', snippet: '检查企业邮箱过滤规则，重置邮件可能被归类到隔离区。', source: 'product_lib', type: 'faq', score: 0.7 },
];
// 客户私有库（代码）模拟 — 命中代码符号/调用关系
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
  else if (page === 'workbench') renderWorkbench();
  saveState();
}

/* ============================================================
 * 六、客户端 SDK 渲染（01-客户端支持助手）
 * ============================================================ */
let sdkView = 'chat'; // 'chat' | 'mine'
let sdkConversation = []; // {role:'assistant'|'user', text}
let sdkCollecting = null; // 追问收集态 {position, phenomenon, expect}
let sdkSelectedFeedbackId = null;

function renderSdk() {
  const app = document.getElementById('app');
  if (sdkConversation.length === 0) {
    sdkConversation = [
      { role: 'assistant', text: '你好！我是 Acme 产品支持助手。遇到问题可以直接问，能帮你查到的我直接答；需要人工跟进的，我帮你记录下来，团队处理完会同步给你。', ts: Date.now() },
    ];
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
  // IM 双气泡：客服左（头像 + 气泡）、我的右（气泡 + 头像），按角色分行
  const msgs = sdkConversation.map((m, i) => renderImBubble(m, i)).join('');
  const collectCard = sdkCollecting ? renderSdkSummaryCard() : '';
  // 整理确认卡期间仍保留输入框，placeholder 随阶段变化
  const placeholder = sdkCollecting
    ? '补充位置 / 现象 / 期望，发送后自动更新整理…'
    : '描述你遇到的问题…（可说明页面、现象、期望）';
  return `
    <div class="sdk-conversation">${msgs}${collectCard}</div>
    <div class="sdk-composer">
      <textarea id="sdkInput" placeholder="${placeholder}"></textarea>
      <button class="primary-button" id="sdkSend">发送</button>
    </div>`;
}

function renderImBubble(m, idx) {
  const prev = sdkConversation[idx - 1];
  const showAvatar = !prev || prev.role !== m.role; // 同角色连续消息只在首条显示头像
  const ts = m.ts ? fmtRelative(m.ts) : '';
  if (m.role === 'user') {
    // 我的消息：右对齐，灰色气泡
    return `
      <div class="im-row im-mine">
        <div class="im-bubble-wrap">
          ${ts ? `<time>${ts}</time>` : ''}
          <div class="im-bubble im-bubble-mine">${esc(m.text)}</div>
        </div>
        ${showAvatar ? '<span class="im-avatar im-avatar-mine">我</span>' : '<span class="im-avatar im-avatar-hidden"></span>'}
      </div>`;
  }
  // 检索结果卡（智能客服两层知识库命中可视化）
  if (m.retrieval) {
    return `
      <div class="im-row im-cs">
        ${showAvatar ? '<span class="im-avatar im-avatar-cs">AI</span>' : '<span class="im-avatar im-avatar-hidden"></span>'}
        <div class="im-bubble-wrap">
          ${showAvatar ? '<span class="im-name">支持助手</span>' : ''}
          ${renderRetrievalCard(m.retrieval)}
          ${ts ? `<time>${ts}</time>` : ''}
        </div>
      </div>`;
  }
  // 客服消息：左对齐，助手头像 + 浅色卡片气泡
  return `
    <div class="im-row im-cs">
      ${showAvatar ? '<span class="im-avatar im-avatar-cs">AI</span>' : '<span class="im-avatar im-avatar-hidden"></span>'}
      <div class="im-bubble-wrap">
        ${showAvatar ? '<span class="im-name">支持助手</span>' : ''}
        <div class="im-bubble im-bubble-cs">${esc(m.text)}</div>
        ${ts ? `<time>${ts}</time>` : ''}
      </div>
    </div>`;
}

// 检索结果卡 — 展示两层知识库命中来源、类型、置信度（对齐 F-03）
function renderRetrievalCard(r) {
  if (!r.hits || !r.hits.length) {
    return `<div class="im-bubble im-bubble-cs"><span class="retrieval-empty">未在知识库中找到匹配，帮你记录下来转给团队跟进。</span></div>`;
  }
  const confLabel = r.confidence >= CONFIDENCE_THRESHOLD ? '高置信·直接回复' : '低置信·转人工';
  const confCls = r.confidence >= CONFIDENCE_THRESHOLD ? 'high' : 'low';
  const hitsHtml = r.hits.map((h) => `
    <div class="retrieval-hit ${h.source}">
      <div class="retrieval-hit-head">
        <span class="retrieval-source ${h.source}">${h.source === 'customer_lib' ? '你的项目代码' : '产品知识库'}</span>
        <span class="retrieval-type">${h.type === 'code' ? '代码符号' : h.type === 'faq' ? 'FAQ' : '文档'}</span>
        <span class="retrieval-score">${(h.score * 100).toFixed(0)}%</span>
      </div>
      <strong>${esc(h.title)}</strong>
      <p>${esc(h.snippet)}</p>
    </div>`).join('');
  const draft = r.draft_reply
    ? `<div class="retrieval-draft"><span class="retrieval-draft-label">拟回复</span><p>${esc(r.draft_reply)}</p></div>`
    : '';
  return `
    <div class="retrieval-card">
      <div class="retrieval-head">
        <strong>知识库检索</strong>
        <span class="retrieval-confidence ${confCls}">${confLabel} · ${(r.confidence * 100).toFixed(0)}%</span>
      </div>
      <div class="retrieval-hits">${hitsHtml}</div>
      ${draft}
    </div>`;
}

function renderSdkSummaryCard() {
  const c = sdkCollecting;
  return `
    <div class="sdk-summary-card">
      <div class="summary-head">
        <strong>帮你整理一下</strong>
        <span class="status-pill pending">待确认</span>
      </div>
      <div class="summary-fields">
        <div class="summary-field"><span>位置</span><span>${esc(c.position || '（待补充）')}</span></div>
        <div class="summary-field"><span>现象</span><span>${esc(c.phenomenon || '（待补充）')}</span></div>
        <div class="summary-field"><span>期望</span><span>${esc(c.expect || '（待补充）')}</span></div>
      </div>
      <div class="summary-actions">
        <button class="secondary-button" data-sdk-action="edit">再改改</button>
        <button class="primary-button" data-sdk-action="confirm">确认提交</button>
      </div>
    </div>`;
}

let sdkMineFilter = 'all'; // all | received | processing | progress | resolved

function renderSdkMine() {
  // 客户可见反馈（对齐 SDK fetchFeedbackItems，按 custom_user_id 过滤）
  let mine = state.feedbacks.filter((f) => f.custom_user_id === state.sdkCustomUserId);
  // 按日期倒序（last_message_at 降序）
  mine = mine.slice().sort((a, b) => b.last_message_at - a.last_message_at);
  // 单栏 push 导航：列表 ↔ 详情互斥（对齐 SDK openSubmit/openStatus 独立视图）
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
    const preview = latest && latest.sender_type !== SENDER.CUSTOMER
      ? `<div class="sdk-progress-preview">${esc(latest.content)}</div>` : '';
    // 产物指向（对齐 F-07/US-07：accept 后构建产物，artifact_url 回写，客户 SDK 可见"已交付+产物指向"）
    const artMsg = msgs.find((m) => m.metadata && m.metadata.artifact_url);
    const artifactCard = artMsg ? `<div class="sdk-artifact-card"><div class="sdk-artifact-head"><strong>已交付产物</strong><span class="status-pill accepted">已交付</span></div><code>${esc(artMsg.metadata.artifact_url)}</code><p>构建产物已交付，复制地址下载（部署由你方完成）。</p></div>` : '';
    return `
      <div class="sdk-feedback-detail">
        <div class="sdk-back-bar">
          <button class="text-button" data-sdk-back type="button">← 返回我的反馈</button>
        </div>
        <div class="detail-head">
          <span class="status-pill ${cs.cls}">${cs.label}</span>
          <h2>${esc(fb.title)}</h2>
          <span class="task-tag">${fb.short_id}</span>
        </div>
        <p class="sdk-detail-hint">${cs.hint}</p>
        <div class="feedback-content-quote">${esc(fb.content)}</div>
        ${artifactCard}
        ${preview}
        <div class="detail-section-title">处理进度</div>
        ${timeline || '<p style="color:var(--ink-400);font-size:var(--type-caption)">暂无进展记录</p>'}
        <div class="detail-section-title">补充信息</div>
        ${(() => {
          const lk = linkForFeedback(fb.id);
          const tk = lk ? taskById(lk.task_id) : null;
          const active = tk && [TASK_STATE.IN_PROGRESS, TASK_STATE.PENDING_REVIEW].includes(tk.state);
          return active ? `<div class="sdk-steer-hint"><span class="todo-badge" title="桥3：追问注入同一 Codex 线程（硬关联门控）">桥3·注入开发线程</span><span>你的追问会基于当前开发进展回复，团队确认后发送。</span></div>` : '';
        })()}
        <div class="sdk-composer" style="border-top:0;padding:0;">
          <textarea id="sdkSupplement" placeholder="补充说明或追问…"></textarea>
          <button class="primary-button" data-sdk-supplement="${fb.id}">发送</button>
        </div>
      </div>`;
  }
  // 状态筛选
  const filtered = mine.filter((f) => {
    if (sdkMineFilter === 'all') return true;
    const cs = customerStatus(f);
    if (sdkMineFilter === 'received') return cs.label === '已收到';
    if (sdkMineFilter === 'processing') return cs.label === '处理中';
    if (sdkMineFilter === 'progress') return cs.label === '有进展';
    if (sdkMineFilter === 'resolved') return cs.label === '已解决';
    return true;
  });
  const filters = [
    { key: 'all', label: '全部' },
    { key: 'received', label: '已收到' },
    { key: 'processing', label: '处理中' },
    { key: 'progress', label: '有进展' },
    { key: 'resolved', label: '已解决' },
  ];
  const filterBar = `<div class="sdk-mine-filters">${filters.map((f) => `<button class="sdk-mine-filter ${sdkMineFilter === f.key ? 'is-active' : ''}" data-sdk-mine-filter="${f.key}" type="button">${f.label}</button>`).join('')}</div>`;
  return `<div class="sdk-mine-pane">${filterBar}<div class="sdk-feedback-list">${renderSdkFeedbackList(filtered) || '<div class="empty-panel"><strong>没有匹配的反馈</strong><p>换个筛选条件，或在对话里反馈新问题。</p></div>'}</div></div>`;
}

function renderSdkFeedbackList(mine) {
  return mine.map((fb) => {
    const cs = customerStatus(fb);
    const msgs = state.messages.filter((m) => m.feedback_id === fb.id).sort((a, b) => a.created_at - b.created_at);
    const latest = msgs.length ? msgs[msgs.length - 1] : null;
    const latestPreview = latest && latest.sender_type !== SENDER.CUSTOMER
      ? `<p class="sdk-list-preview">${esc(latest.content)}</p>` : '';
    return `
      <button class="feedback-list-item" data-sdk-fb="${fb.id}" type="button">
        <div class="feedback-list-copy">
          <strong>${esc(fb.title)}</strong>
          <small>${fb.short_id}</small>
        </div>
        <div class="feedback-list-meta">
          <span class="status-pill ${cs.cls}">${cs.label}</span>
          <time>${fmtRelative(fb.last_message_at)}</time>
        </div>
        ${latestPreview}
      </button>`;
  }).join('');
}

/* ---- SDK 交互 ---- */
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
  render();
  scrollConversationDown();
}

function sdkHandleSend() {
  const input = document.getElementById('sdkInput');
  const text = (input?.value || '').trim();
  if (!text) return;
  sdkConversation.push({ role: 'user', text, ts: Date.now() });
  input.value = '';
  // 智能客服决策 — 两层知识库检索 + 置信度阈值（后端待建，前端模拟）
  if (!sdkCollecting) {
    const r = sdkRetrieve(text);
    if (r.hits.length && r.confidence >= CONFIDENCE_THRESHOLD) {
      // 高置信：展示检索卡 + 直接回复客户（对齐 F-03 高置信直答）
      sdkConversation.push({ role: 'assistant', retrieval: r, ts: Date.now() + 120 });
      sdkConversation.push({ role: 'assistant', text: `以上是我从${r.hits[0].source === 'customer_lib' ? '你的项目代码' : '产品知识库'}中查到的，希望能帮到你。如果没解决，可以继续描述问题，我帮你记录转给团队跟进。`, ts: Date.now() + 200 });
    } else {
      // 未命中或低置信：展示检索卡（低置信/空命中）+ 转追问收集
      sdkConversation.push({ role: 'assistant', retrieval: r, ts: Date.now() + 120 });
      sdkCollecting = { position: '', phenomenon: text, expect: '' };
      sdkConversation.push({ role: 'assistant', text: '这个我不太确定，帮你记录下来转给团队跟进。请补充：在哪个页面遇到？你期望的结果是？', ts: Date.now() + 200 });
    }
  } else {
    // 追问阶段，补充到 collecting
    if (!sdkCollecting.position) sdkCollecting.position = text;
    else if (!sdkCollecting.expect) sdkCollecting.expect = text;
    sdkConversation.push({ role: 'assistant', text: '好的，已记录。可在确认卡里修改后提交。', ts: Date.now() + 200 });
  }
  render();
  scrollConversationDown();
}

function scrollConversationDown() {
  const conv = document.querySelector('.sdk-conversation');
  if (conv) setTimeout(() => { conv.scrollTop = conv.scrollHeight; }, 50);
}

function sdkHandleAction(action) {
  if (action === 'edit') {
    // 回到追问态
    sdkConversation.push({ role: 'assistant', text: '请在下方补充位置 / 现象 / 期望，我会更新整理。', ts: Date.now() });
    render();
    scrollConversationDown();
    const ta = document.querySelector('.sdk-composer textarea');
    if (ta) ta.focus();
    return;
  }
  if (action === 'confirm') {
    const c = sdkCollecting;
    if (!c) return;
    const id = Math.max(...state.feedbacks.map((f) => f.id)) + 1;
    const fb = {
      id, short_id: newShortId('FB', id), title: firstLine(c.phenomenon || '客户反馈') || '客户反馈',
      content: [c.position && `位置：${c.position}`, c.phenomenon && `现象：${c.phenomenon}`, c.expect && `期望：${c.expect}`].filter(Boolean).join('\n'),
      status: FB_STATUS.PENDING, triage_status: TRIAGE.PENDING,
      type: 'issue', input_mode: 'dialog',
      custom_user_id: state.sdkCustomUserId, user_phone: null, user_email: 'client@acme.example',
      data: { priority: 'P2', structured: c },
      last_message_at: Date.now(), last_customer_message_at: Date.now(),
      hasPendingProgress: false,
    };
    state.feedbacks.unshift(fb);
    state.messages.push({ id: Date.now(), feedback_id: id, sender_type: SENDER.CUSTOMER, content: fb.content, metadata: { initial: true }, attachments: [], created_at: Date.now() });
    sdkConversation.push({ role: 'assistant', text: `已记录，编号 ${fb.short_id}。支持团队会尽快跟进，有进展会同步给你。`, ts: Date.now() });
    sdkCollecting = null;
    render();
    scrollConversationDown();
  }
}

/* ============================================================
 * 七、内部工作台渲染（02-内部工作台）
 * ============================================================ */
let wbView = 'today'; // today | feedback | work | drafts | org
let wbFilter = { fb: 'all', search: '', sort: 'newest', task: 'all', assignee: 'all' };
let wbSelectedFb = null;
let wbSelectedTask = null;
let wbOrgTab = 'accept'; // info | members | accept | delivery | knowledge

function renderWorkbench() {
  renderNav();
  renderScopeFilters();
  renderViewVisibility();
  const viewLabel = { today: '今日待处理', feedback: '反馈治理', work: '任务开发', drafts: '进展确认', org: '验收与交付' }[wbView];
  document.getElementById('crumbTail').textContent = viewLabel;
  const scopeTitle = document.querySelector('.breadcrumbs strong');
  if (scopeTitle) scopeTitle.textContent = scopeLabel();
  // 当前身份回显（members tab 可切换演示身份，验证分诊 role 门控）
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
  else if (wbView === 'drafts') renderDraftsView();
  else if (wbView === 'org') renderOrgView();
}

/* 客户/项目两级筛选（对齐多客户统一框架：聚合视图跨客户，筛选收缩视野）*/
function renderScopeFilters() {
  const custSel = document.getElementById('customerFilter');
  const projSel = document.getElementById('projectFilter');
  if (!custSel || !projSel) return;
  const s = state.scope;
  // 客户筛选：全部 + 各客户
  custSel.innerHTML = `<option value="all" ${s.customer === 'all' ? 'selected' : ''}>全部客户</option>`
    + customers().map((c) => `<option value="${esc(c)}" ${s.customer === c ? 'selected' : ''}>${esc(c)}</option>`).join('');
  // 项目筛选：全部 + scope 内项目（受客户筛选级联）
  const projPool = s.customer === 'all' ? state.projects : state.projects.filter((p) => p.customer === s.customer);
  projSel.innerHTML = `<option value="all" ${s.project === 'all' ? 'selected' : ''}>全部项目</option>`
    + projPool.map((p) => `<option value="${p.id}" ${String(s.project) === String(p.id) ? 'selected' : ''}>${esc(p.name)}</option>`).join('');
}

/* ---- Today 首页：端到端流程引导 ---- */
function renderTodayView() {
  const root = document.getElementById('viewToday');
  const pFbs = projectFbs();
  const pTasks = projectTasks();
  const pDrafts = projectDrafts();
  const pendingFbs = pFbs.filter((f) => f.triage_status === TRIAGE.PENDING);
  const claimTasks = pTasks.filter((t) => t.state === TASK_STATE.PENDING && !t.executor_id);
  const reviewDrafts = pDrafts.filter((d) => d.state === 'pending_review');
  const acceptTasks = pTasks.filter((t) => t.state === TASK_STATE.PENDING_REVIEW);
  const sections = [
    { key: 'feedback', label: '待判断反馈', items: pendingFbs, view: 'feedback', desc: '客户提交后等待分诊' },
    { key: 'work', label: '待认领任务', items: claimTasks, view: 'work', desc: '已转为待办，等待认领' },
    { key: 'drafts', label: '待确认进展', items: reviewDrafts, view: 'drafts', desc: '处理完成，草稿待确认后发送客户' },
    { key: 'org', label: '待验收任务', items: acceptTasks, view: 'org', desc: '开发完成，等待验收通过' },
  ];
  const total = sections.reduce((s, x) => s + x.items.length, 0);
  root.innerHTML = `
    <div class="today-page">
      <header class="today-heading">
        <div><p class="eyebrow">PERSONAL · TODAY</p><h1>今日待处理</h1><p>按支持链路汇总当前项目需要你处理的事项，点击直达。</p></div>
        <div class="today-heading-status"><span class="health-badge ${total > 0 ? 'warning' : 'success'}">${total} 项待处理</span></div>
      </header>
      <div class="today-workspace">
        <section class="today-responsibility-rail" style="grid-column:1/-1;">
          <div class="today-mode-tabs single" role="tablist"><button class="is-active" role="tab" type="button">支持链路 <em>${total}</em></button></div>
          <div class="today-responsibility-list">
            ${sections.map((s) => {
              if (!s.items.length) return `<div class="today-responsibility-row is-done"><div><strong>${s.label}</strong><small>${s.desc}</small></div><span class="status-pill completed">已清</span></div>`;
              return s.items.map((it) => {
                let title, sub, action;
                if (s.key === 'feedback') { title = it.title; sub = `${customerOf(it.project_id)} · ${it.short_id} · ${fmtRelative(it.last_message_at)}`; action = `data-today-jump="feedback:${it.id}"`; }
                else if (s.key === 'work') { title = firstLine(it.content); sub = `${customerOf(it.project_id)} · ${taskShortId(it.id)} · 待认领`; action = `data-today-jump="work:${it.id}"`; }
                else if (s.key === 'drafts') { const fb = fbById(it.feedback_id); title = fb ? fb.title : '草稿'; sub = `${fb ? customerOf(it.project_id) : ''} · ${fb ? fb.short_id : ''} · 待确认`; action = `data-today-jump="drafts:${it.id}"`; }
                else { title = firstLine(it.content); sub = `${customerOf(it.project_id)} · ${taskShortId(it.id)} · 待验收`; action = `data-today-jump="org:${it.id}"`; }
                return `<button class="today-responsibility-row" ${action} type="button"><div><strong>${esc(title)}</strong><small>${esc(sub)}</small></div><span class="status-pill ${s.key === 'feedback' ? 'pending' : s.key === 'work' ? 'pending' : s.key === 'drafts' ? 'in_progress' : 'pending_review'}">${s.label.replace('待','')}</span></button>`;
              }).join('');
            }).join('')}
          </div>
          <footer class="today-automatic-summary"><strong>链路顺序</strong><small>反馈分诊 → 认领开发 → 进展确认 → 验收交付</small></footer>
        </section>
      </div>
    </div>`;
}

function renderNav() {
  const nav = document.getElementById('primaryNav');
  const items = [
    { group: 'PERSONAL', items: [
      { page: 'today', label: 'Today', em: String(projectFbs().filter((f) => f.triage_status === TRIAGE.PENDING).length + projectTasks().filter((t) => t.state === TASK_STATE.PENDING && !t.executor_id).length + projectDrafts().filter((d) => d.state === 'pending_review').length + projectTasks().filter((t) => t.state === TASK_STATE.PENDING_REVIEW).length), view: 'today', icon: 'today' },
      { page: 'chat', label: 'Chat', em: 'Codex', icon: 'chat' },
    ] },
    { group: 'PRODUCT LIFECYCLE', items: [
      { page: 'idea', label: 'Idea', em: '6', icon: 'idea' },
      { page: 'feedback', label: 'Feedback', em: String(projectFbs().filter((f) => f.triage_status === TRIAGE.PENDING).length), view: 'feedback', icon: 'feedback' },
      { page: 'work', label: 'Work', em: String(projectTasks().filter((t) => t.state === TASK_STATE.IN_PROGRESS).length), view: 'work', icon: 'work' },
      { page: 'drafts', label: 'Drafts', em: String(projectDrafts().filter((d) => d.state === 'pending_review').length), view: 'drafts', icon: 'release' },
      { page: 'release', label: 'Release', em: '', icon: 'release' },
      { page: 'operations', label: 'Operations', em: '', icon: 'operations' },
    ] },
    { group: 'ORGANIZATION', items: [
      { page: 'organization', label: 'Organization', em: '', view: 'org', icon: 'organization' },
      { page: 'engineering', label: 'Engineering', em: '', icon: 'engineering' },
    ] },
  ];
  nav.innerHTML = items.map((g) => `
    <p class="nav-label">${g.group}</p>
    ${g.items.map((it) => {
      const active = it.view && it.view === wbView;
      return `<button class="nav-item ${active ? 'is-active' : ''}" data-wb-view="${it.view || ''}" data-page="${it.page}" type="button"><svg class="ui-icon" aria-hidden="true"><use href="#icon-${it.icon}"></use></svg><strong>${it.label}</strong><em>${it.em || ''}</em></button>`;
    }).join('')}
  `).join('');
}

function renderViewVisibility() {
  document.querySelectorAll('[data-page-view]').forEach((v) => {
    v.classList.toggle('is-active', v.dataset.pageView === wbView);
  });
}

/* ---- View A: 反馈治理（对齐 ArcOrbit feedbackView 结构 + FeedbackManagementDialog）---- */
function renderFeedbackView() {
  const root = document.getElementById('viewFeedback');
  let list = projectFbs().slice();
  if (wbFilter.fb === 'pending') list = list.filter((f) => f.triage_status === TRIAGE.PENDING);
  else if (wbFilter.fb === 'converted') list = list.filter((f) => f.status === FB_STATUS.CONVERTED || f.status === FB_STATUS.IN_PROGRESS || f.status === FB_STATUS.COMPLETED);
  else if (wbFilter.fb === 'ignored') list = list.filter((f) => f.triage_status === TRIAGE.IGNORED);
  if (wbFilter.search) {
    const q = wbFilter.search.toLowerCase();
    list = list.filter((f) => [f.title, f.content, f.short_id, f.custom_user_id, f.user_email].some((s) => (s || '').toLowerCase().includes(q)));
  }
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
        <details class="feedback-more-menu">
          <summary>更多</summary>
          <div class="feedback-secondary-controls">
            <label><span class="sr-only">排序</span><select data-fb-sort>
              <option value="newest" ${wbFilter.sort === 'newest' ? 'selected' : ''}>最新反馈</option>
              <option value="oldest" ${wbFilter.sort === 'oldest' ? 'selected' : ''}>最早反馈</option>
              <option value="priority" ${wbFilter.sort === 'priority' ? 'selected' : ''}>优先级</option>
            </select></label>
          </div>
        </details>
      </section>
      <div class="feedback-workbench-layout">
        <section class="panel-card feedback-list-panel" aria-label="反馈列表">
          <div class="section-title-row">
            <div><span class="section-icon">◌</span><div><h2>反馈列表</h2><p>选择反馈后在右侧查看和处理</p></div></div>
            <span class="status-pill muted">${list.length} 条</span>
          </div>
          <div class="feedback-list workspace-pane-scroll">
            ${list.map((f) => {
              const pill = FB_PILL[f.status] || FB_PILL[FB_STATUS.PENDING];
              const prio = f.data.priority || 'P2';
              const link = linkForFeedback(f.id);
              return `
              <button class="feedback-list-item ${wbSelectedFb === f.id ? 'is-active' : ''}" data-fb-item="${f.id}" type="button">
                <div class="feedback-list-copy">
                  <strong>${esc(f.title)}</strong>
                  <small>${customerOf(f.project_id)} · ${f.short_id}${link ? ' · ' + taskShortId(link.task_id) : ''}</small>
                </div>
                <div class="feedback-list-meta">
                  <span class="task-tag" style="background:var(--violet-50);color:var(--violet-700);">${esc(customerOf(f.project_id))}</span>
                  <span class="status-pill ${pill.cls}">${pill.label}</span>
                  <span class="task-tag" style="background:${prio === 'P1' ? 'var(--red-100)' : prio === 'P2' ? 'var(--amber-100)' : 'var(--ink-100)'};color:${prio === 'P1' ? 'var(--red-600)' : prio === 'P2' ? 'var(--amber-700)' : 'var(--ink-600)'};">${prio}</span>
                  <time>${fmtRelative(f.last_message_at)}</time>
                </div>
              </button>`;
            }).join('') || '<p style="color:var(--ink-400);padding:20px;font-size:var(--type-caption);">无匹配反馈</p>'}
          </div>
        </section>
        <aside class="inspector-card feedback-inspector" aria-label="反馈详情">
          <div class="section-title-row">
            <div><span class="section-icon">◇</span><div><h2>反馈详情</h2><p>原文、处理状态与沟通记录</p></div></div>
          </div>
          <div class="feedback-inspector-body">
            <div class="feedback-inspector-scroll">${detail}</div>
          </div>
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
  const convo = msgs.map((m) => renderMessage(m)).join('');
  const canConvert = !link && (fb.status === FB_STATUS.PENDING || fb.status === FB_STATUS.ACCEPTED);
  const canIgnore = fb.triage_status !== TRIAGE.IGNORED;
  return `
    <div class="feedback-inspector-header">
      <div>
        <span class="task-tag">${fb.short_id}</span>
        <h2>${esc(fb.title)}</h2>
        <p>客户 ${esc(fb.custom_user_id)}${fb.user_email ? ' · ' + esc(fb.user_email) : ''} · ${fmtDate(fb.last_message_at)}</p>
      </div>
      <div style="display:flex;gap:6px;flex-wrap:wrap;">
        <span class="status-pill ${pill.cls}">${pill.label}</span>
        ${fb.ai_triage ? `<span class="todo-badge" title="AI 分诊结果 · 置信度 ${(fb.ai_triage.confidence * 100).toFixed(0)}%">AI 分诊 · ${fb.ai_triage.priority}</span>` : '<span class="todo-badge" title="AI 分诊辅助 — 后端待建">待建·AI 分诊</span>'}
      </div>
    </div>
    <div class="feedback-field-grid">
      <div class="field-cell"><span>类型</span><span>${esc(fb.type)}</span></div>
      <div class="field-cell"><span>优先级</span>
        <select data-fb-prio ${link ? 'disabled' : ''}>${['P1', 'P2', 'P3'].map((p) => `<option value="${p}" ${prio === p ? 'selected' : ''}>${p}</option>`).join('')}</select>
      </div>
      <div class="field-cell"><span>位置</span><span>${esc(s.position || '—')}</span></div>
      <div class="field-cell"><span>现象</span><span>${esc(s.phenomenon || '—')}</span></div>
      <div class="field-cell" style="grid-column:1/-1;"><span>期望</span><span>${esc(s.expect || '—')}</span></div>
    </div>
    ${renderAiTriagePanel(fb)}
    <div class="feedback-content-quote">${esc(fb.content)}</div>
    ${link ? `<p style="font-size:var(--type-caption);color:var(--ink-500);margin:12px 0 4px;">关联任务 <strong style="color:var(--violet-700);">${taskShortId(link.task_id)}</strong></p>` : ''}
    <div class="detail-section-title">对话</div>
    <div style="display:flex;flex-direction:column;gap:10px;">${convo || '<p style="color:var(--ink-400);font-size:var(--type-caption)">无消息</p>'}</div>
    <div class="inspector-actions">
      <button class="secondary-button" data-fb-action="reply">回复客户</button>
      <button class="primary-button" data-fb-action="convert" ${canConvert ? '' : 'disabled'}>转为开发任务</button>
      <button class="text-button danger" data-fb-action="ignore" ${canIgnore ? '' : 'disabled'}>忽略</button>
    </div>`;
}

// AI 分诊结果面板 — 对齐 AI反馈分诊方案.md v0.7 结构化输出（去噪/分类/优先级/置信度/补充问题）
function renderAiTriagePanel(fb) {
  const a = fb.ai_triage;
  if (!a) return '';
  const confCls = a.confidence >= 0.7 ? 'high' : 'low';
  const scoreBar = (v) => `<div class="ai-triage-score"><div class="ai-triage-score-bar" style="width:${v}%"></div></div>`;
  return `
    <details class="ai-triage-panel">
      <summary class="ai-triage-head">
        <strong>AI 分诊初判</strong>
        <span class="retrieval-confidence ${confCls}">置信度 ${(a.confidence * 100).toFixed(0)}%</span>
      </summary>
      <div class="ai-triage-summary">${esc(a.summary)}</div>
      <div class="ai-triage-fields">
        <div class="field-cell"><span>类型</span><span>${esc(a.type)}</span></div>
        <div class="field-cell"><span>优先级</span><span class="task-tag" style="background:var(--amber-100);color:var(--amber-700);">${a.priority}</span></div>
        <div class="field-cell"><span>可行动</span><span>${esc(a.actionability)}</span></div>
        <div class="field-cell"><span>需补问</span><span>${a.need_more_info ? '是' : '否'}</span></div>
      </div>
      <div class="ai-triage-scores">
        <div><small>表达清晰 ${a.clarity}</small>${scoreBar(a.clarity)}</div>
        <div><small>影响面 ${a.impact}</small>${scoreBar(a.impact)}</div>
        <div><small>紧急度 ${a.urgency}</small>${scoreBar(a.urgency)}</div>
      </div>
      <p class="ai-triage-reasoning">${esc(a.reasoning)}</p>
      <div class="ai-triage-actions">
        <button class="secondary-button" data-fb-action="triage-accept" style="min-height:28px;font-size:var(--type-caption);">采纳初判</button>
        <button class="text-button" data-fb-action="triage-adjust" style="min-height:28px;font-size:var(--type-caption);">人工调整</button>
      </div>
    </details>`;
}

function renderMessage(m) {
  if (m.sender_type === SENDER.SYSTEM) {
    return `<div style="display:flex;align-items:center;gap:8px;"><span style="height:1px;flex:1;background:var(--ink-150);"></span><span class="task-tag" style="background:var(--ink-50);border:1px solid var(--ink-150);">${esc(m.content)} · ${fmtRelative(m.created_at)}</span><span style="height:1px;flex:1;background:var(--ink-150);"></span></div>`;
  }
  const isInitial = m.metadata && m.metadata.initial;
  const label = m.sender_type === SENDER.CUSTOMER ? (isInitial ? '用户原始反馈' : '用户补充') : '开发者更新';
  const tagColor = m.sender_type === SENDER.CUSTOMER ? (isInitial ? 'var(--violet-100);color:var(--violet-700)' : 'var(--amber-100);color:var(--amber-700)') : 'var(--green-100);color:var(--green-600)';
  return `
    <div style="border:1px solid var(--ink-150);border-radius:var(--radius-md);padding:10px 12px;background:${m.sender_type === SENDER.DEVELOPER ? 'var(--ink-50)' : 'var(--paper)'};">
      <span class="task-tag" style="background:${tagColor};">${label}</span>
      <div style="font-size:var(--type-body);color:var(--ink-800);margin-top:6px;white-space:pre-wrap;">${esc(m.content)}</div>
      <div style="font-size:var(--type-micro);color:var(--ink-400);margin-top:4px;">${fmtRelative(m.created_at)}</div>
    </div>`;
}

/* ---- View B: 任务开发（对齐 ArcOrbit workView 结构 + ProjectDetailPage + TodoTreeItem）---- */
function renderWorkView() {
  const root = document.getElementById('viewWork');
  // 筛选作用于全部任务（含子任务），再按 father_id 组织树
  let pool = projectTasks();
  if (wbFilter.task !== 'all') pool = pool.filter((t) => t.state === wbFilter.task);
  if (wbFilter.assignee === 'me') pool = pool.filter((t) => t.executor_id === state.currentUserId);
  else if (wbFilter.assignee === 'unassigned') pool = pool.filter((t) => !t.executor_id);
  if (wbFilter.search) {
    const q = wbFilter.search.toLowerCase();
    pool = pool.filter((t) => t.content.toLowerCase().includes(q));
  }
  const poolIds = new Set(pool.map((t) => t.id));
  // 渲染树：根在筛选池内，子也仅显示在筛选池内
  const roots = pool.filter((t) => !t.father_id || !poolIds.has(t.father_id));
  // 按客户分组（跨客户统一视图，每组带客户标题）
  const groups = [...new Set(roots.map((t) => customerOf(t.project_id)))].filter(Boolean);
  const tree = groups.map((c) => {
    const gr = roots.filter((t) => customerOf(t.project_id) === c);
    if (!gr.length) return '';
    return `<div class="task-group"><div class="task-group-head"><strong>${esc(c)}</strong><small>${gr.length} 项</small></div>${gr.map((t) => renderTaskTreeItem(t, 0, poolIds)).join('')}</div>`;
  }).join('');
  // 七态 pill 计数（基于当前项目全部任务）
  const counts = Object.fromEntries(Object.values(TASK_STATE).map((st) => [st, projectTasks().filter((t) => t.state === st).length]));
  const stateRail = Object.values(TASK_STATE).map((st) => {
    const active = wbFilter.task === st;
    return `<button class="work-state-filter ${active ? 'is-active' : ''}" data-work-state="${st}" type="button" aria-pressed="${active}"><span>●</span><strong>${TASK_PILL[st].label}</strong><em>${counts[st]}</em></button>`;
  }).join('');
  const detail = wbSelectedTask ? renderTaskDetail(wbSelectedTask) : `<div class="empty-panel"><strong>选择一个待办</strong><p>这里将显示任务内容、处理人与来源反馈。</p></div>`;
  root.innerHTML = `
    <div class="page platform-page primary-workspace-page work-primary-workspace">
      <div class="automation-bar">
        <label class="automation-toggle" title="总闸开关：关闭后已认领任务不进 Codex 线程">
          <input type="checkbox" id="automationToggle" ${state.automation.enabled ? 'checked' : ''}>
          <span></span>自动领取总闸
        </label>
        ${state.automation.queue_paused
          ? '<button class="secondary-button" data-automation-resume type="button" style="min-height:28px;font-size:var(--type-caption);">恢复队列</button>'
          : '<button class="secondary-button" data-automation-pause type="button" style="min-height:28px;font-size:var(--type-caption);">暂停队列</button>'}
        <span class="automation-status">队列 ${pendingQueue().length} 项待领取 · 并发上限 ${state.automation.concurrency_limit} · 已认领待启动 ${pendingQueue().filter((t) => t.executor_id).length}</span>
      </div>
      <section class="panel-card primary-control-rail work-control-rail">
        <strong class="control-rail-identity">Work</strong>
        <div class="work-state-filters" role="tablist" aria-label="待办状态筛选">${stateRail}</div>
        <input type="search" class="platform-filter" placeholder="搜索标题与内容" data-task-search value="${esc(wbFilter.search)}">
        <details class="control-rail-more">
          <summary aria-label="更多筛选">更多</summary>
          <div>
            <label class="work-assignee-pick"><span>执行人</span>
              <select data-task-assignee-select>
                <option value="all" ${wbFilter.assignee === 'all' ? 'selected' : ''}>全部执行人</option>
                <option value="me" ${wbFilter.assignee === 'me' ? 'selected' : ''}>我的</option>
                <option value="unassigned" ${wbFilter.assignee === 'unassigned' ? 'selected' : ''}>未认领</option>
              </select>
            </label>
            <button class="secondary-button" data-task-reset type="button">重置筛选</button>
          </div>
        </details>
        <button class="primary-button" data-task-create type="button" style="margin-left:auto;">创建待办</button>
      </section>
      <div class="platform-work-layout">
        <section class="panel-card work-list-panel">
          <div class="section-title-row">
            <div><span class="section-icon">≡</span><div><h2>待办列表</h2><p>${pool.length} 项</p></div></div>
          </div>
          <div class="workspace-pane-scroll">${tree || '<p style="color:var(--ink-400);padding:20px;font-size:var(--type-caption);">无任务</p>'}</div>
        </section>
        <div class="work-inspector-separator" role="separator" aria-orientation="vertical"></div>
        <aside class="inspector-card task-inspector platform-work-inspector">
          <div class="section-title-row">
            <div><span class="section-icon">◇</span><div><h2>待办详情</h2><p>当前选择与协作上下文</p></div></div>
          </div>
          <div class="workspace-pane-scroll">${detail}</div>
        </aside>
      </div>
    </div>`;
}

function renderTaskTreeItem(t, depth, poolIds) {
  if (depth >= 5) return '';
  const allChildren = state.tasks.filter((c) => c.father_id === t.id);
  // 筛选态下仅显示落在池内的子任务；计数仍按全部子任务
  const children = poolIds ? allChildren.filter((c) => poolIds.has(c.id)) : allChildren;
  const sub = allChildren.length;
  const subDone = allChildren.filter((c) => c.state === TASK_STATE.COMPLETED || c.state === TASK_STATE.ACCEPTED).length;
  const prio = TASK_PRIO[t.priority];
  const tone = STATE_TONE[t.state];
  const tags = (t.tags || '').match(/\[([^\]]+)\]/g) || [];
  return `
    <div class="task-row ${wbSelectedTask === t.id ? 'is-selected' : ''}" data-task-item="${t.id}">
      <div class="task-quick-controls">
        <span class="prio-marker ${prio ? prio.marker : ''}" title="${prio ? prio.label : '无优先级'}">
          ${t.priority === 0 ? '!' : prio ? '<span class="dot"></span><span class="dot"></span><span class="dot"></span>' : '---'}
        </span>
        <span class="state-marker ${tone}" title="${TASK_PILL[t.state].label}"></span>
      </div>
      <div class="task-main">
        ${sub ? `<span class="task-chevron" data-task-toggle="${t.id}">▸</span>` : '<span class="task-chevron" style="visibility:hidden">▸</span>'}
        <span class="task-title">${esc(firstLine(t.content))}</span>
        ${sub ? `<span class="task-subprogress">${subDone}/${sub}</span>` : ''}
      </div>
      <div class="task-meta">
        ${tags.slice(0, 2).map((tg) => `<span class="task-tag">${tg.replace(/[\[\]]/g, '')}</span>`).join('')}
        ${t.executor_id ? `<span class="task-assignee">${esc(memberInitial(t.executor_id))}</span>` : '<span class="task-assignee is-empty">?</span>'}
        <span>${fmtRelative(t.created_at)}</span>
      </div>
    </div>
    <div class="task-children" data-task-children="${t.id}" style="display:none;">
      ${children.map((c) => renderTaskTreeItem(c, depth + 1, poolIds)).join('')}
    </div>`;
}

// automation 门控（对齐 automation-coordinator.mjs buildPendingCandidates + maybeStartNext）
// 认领(executor 分配)后,state 保持 pending,由 automation 自动 dispatch 推进 pending→in_progress
function automationEligible(task) {
  const proj = projectById(task.project_id);
  if (!proj) return { ok: false, reason: '项目未找到' };
  if (!state.automation.enabled) return { ok: false, reason: '自动领取总闸关闭' };
  if (state.automation.queue_paused) return { ok: false, reason: '队列已暂停' };
  if (!proj.local_path) return { ok: false, reason: '未绑定本地工作区' };
  if (!proj.participating) return { ok: false, reason: '项目未允许自动领取' };
  if (!task.executor_id) return { ok: false, reason: '未认领（executor 未分配）' };
  return { ok: true, reason: '可执行' };
}
// pending 队列（对齐 todo_queue，按 created_at 排序算队列位置）
function pendingQueue() {
  return projectTasks().filter((t) => t.state === TASK_STATE.PENDING).sort((a, b) => a.created_at - b.created_at);
}
function queuePosition(taskId) { return pendingQueue().findIndex((t) => t.id === taskId) + 1; }

// Codex 开发 Loop 状态 — 接需求目标后自主开发到达成（对齐 state-driven-runner Gap-driven Loop）
// Gap 推进时间线 — 对齐时序图 §4.3 selectNextRound → 推进 → transition → ledger 写回
function renderGapTimeline(t) {
  if (!t.gaps || !t.gaps.length) return '';
  const META = {
    done: { label: '已达成', dot: 'var(--green-600)', bg: 'var(--green-100)', fg: 'var(--green-600)' },
    in_progress: { label: '推进中', dot: 'var(--violet-500)', bg: 'var(--violet-100)', fg: 'var(--violet-700)' },
    pending: { label: '待推进', dot: 'var(--ink-300)', bg: 'var(--ink-100)', fg: 'var(--ink-500)' },
  };
  const items = t.gaps.map((g) => {
    const m = META[g.state] || META.pending;
    return `<div class="gap-step ${g.state}">
      <span class="gap-dot" style="background:${m.dot};"></span>
      <div class="gap-body">
        <div class="gap-head"><strong>${esc(g.id)} · ${esc(g.title)}</strong><span class="task-tag" style="background:${m.bg};color:${m.fg};">${m.label}</span></div>
        ${g.evidence ? `<div class="gap-evidence">${esc(g.evidence)}</div>` : ''}
        ${g.at ? `<div class="gap-time">${fmtRelative(g.at)}</div>` : ''}
      </div>
    </div>`;
  }).join('');
  return `<div class="gap-timeline">${items}</div>`;
}

function renderLoopState(t) {
  if (t.state === TASK_STATE.PENDING) {
    if (!t.executor_id) return '<span style="color:var(--ink-400);">未认领（executor 未分配）</span>';
    const elig = automationEligible(t);
    if (!elig.ok) return `<span style="color:var(--amber-700);">队列等待中 · ${esc(elig.reason)}</span>`;
    return `<span style="color:var(--violet-700);">队列位置 ${queuePosition(t.id)} · 等待 Codex 线程启动</span>`;
  }
  if (t.state === TASK_STATE.COMPLETED) {
    const done = (t.gaps || []).filter((g) => g.state === 'done').length;
    const total = (t.gaps || []).length;
    return `<div style="display:flex;flex-direction:column;gap:6px;">
      <span><span class="task-tag" style="background:var(--green-100);color:var(--green-600);">Loop 已收尾</span> <span style="color:var(--ink-500);font-size:var(--type-micro);">Gap 全部达成 · 已 Git 提交 · 待提交验收</span></span>
      <span style="color:var(--ink-400);font-size:var(--type-micro);">Case ${esc(t.case_id || '')} · ${done}/${total} Gap 达成</span>
      ${renderGapTimeline(t)}
    </div>`;
  }
  if (t.state === TASK_STATE.PENDING_REVIEW) {
    if (t.phase === 'completed') return `<div style="display:flex;flex-direction:column;gap:6px;"><span style="color:var(--blue-600);">Loop 已收尾 · 待验收</span>${renderGapTimeline(t)}</div>`;
    return '<span style="color:var(--ink-400);">待确认开始（confirm_review → pending）</span>';
  }
  if (t.state === TASK_STATE.ACCEPTED) return '<span style="color:var(--green-600);">Loop 已收尾 · Git 已提交 · 已验收</span>';
  if (t.state === TASK_STATE.BLOCKED) return '<span style="color:var(--amber-700);">Gap 阻塞 · 待人工介入</span>';
  if (t.state === TASK_STATE.IN_PROGRESS) {
    const phaseLabel = t.phase === 'starting' ? '线程启动中' : 'Gap-by-Gap 推进中';
    const done = (t.gaps || []).filter((g) => g.state === 'done').length;
    const total = (t.gaps || []).length;
    return `<div style="display:flex;flex-direction:column;gap:6px;">
      <span><span class="task-tag" style="background:var(--violet-100);color:var(--violet-700);">Codex 线程活跃</span> <code style="font-size:var(--type-micro);color:var(--ink-500);">${esc(t.thread_id || '')}</code></span>
      <span style="color:var(--ink-500);font-size:var(--type-micro);">${phaseLabel} · Case ${esc(t.case_id || '')} · ${done}/${total} Gap 达成</span>
      ${renderGapTimeline(t)}
    </div>`;
  }
  return '<span style="color:var(--ink-400);">—</span>';
}

function renderTaskDetail(taskId) {
  const t = taskById(taskId);
  if (!t) return '';
  const link = linkForTask(t.id);
  const fb = link ? fbById(link.feedback_id) : null;
  const canAssign = t.state !== TASK_STATE.IN_PROGRESS || [ROLE.OWNER, ROLE.ADMIN].includes(memberById(state.currentUserId).role) || t.executor_id === state.currentUserId || t.creator_id === state.currentUserId;
  return `
    <div class="detail-body">
      <div style="display:flex;align-items:center;gap:8px;flex-wrap:wrap;margin-bottom:12px;">
        <span class="task-tag">${taskShortId(t.id)}</span>
        <span class="status-pill ${TASK_PILL[t.state].cls}">${TASK_PILL[t.state].label}</span>
        ${t.thread_id ? `<span class="todo-badge" title="Codex 线程：${t.thread_id}">线程·${esc(t.thread_id)}</span>` : ''}
      </div>
      <h3 style="margin:0 0 12px;font-size:var(--type-heading);color:var(--ink-900);">${esc(firstLine(t.content))}</h3>
      <div class="detail-field-row"><span>客户</span><span>${esc(customerOf(t.project_id))}</span></div>
      <div class="detail-field-row"><span>状态</span>
        <select data-task-state>
          ${Object.values(TASK_STATE).map((st) => `<option value="${st}" ${t.state === st ? 'selected' : ''}>${TASK_PILL[st].label}</option>`).join('')}
        </select>
      </div>
      <div class="detail-field-row"><span>处理人</span>
        <select data-task-executor ${canAssign ? '' : 'disabled'}>
          <option value="">未认领</option>
          ${state.members.filter((m) => m.caps.includes(CAP.EXECUTE)).map((m) => `<option value="${m.id}" ${t.executor_id === m.id ? 'selected' : ''}>${esc(m.name)}</option>`).join('')}
        </select>
      </div>
      <div class="detail-field-row"><span>优先级</span>
        <select data-task-prio>
          ${Object.entries(TASK_PRIO).map(([v, p]) => `<option value="${v}" ${t.priority === Number(v) ? 'selected' : ''}>${p.label}</option>`).join('')}
        </select>
      </div>
      <div class="detail-field-row"><span>创建人</span><span>${esc(memberName(t.creator_id))}</span></div>
      <div class="detail-field-row"><span>创建时间</span><span>${fmtDate(t.created_at)}</span></div>
      <div class="detail-field-row"><span>来源反馈</span>${fb ? `<span>${fb.short_id} · ${esc(fb.title)}</span>` : '<span>—</span>'}</div>
      ${fb ? `<div class="detail-field-row"><span>桥1追溯</span><code style="font-size:var(--type-micro);color:var(--violet-700);background:var(--violet-50);padding:2px 6px;border-radius:var(--radius-sm);">Gap.derived_from = customer-feedback:${fb.id}</code></div>` : ''}
      <div class="detail-field-row"><span>开发 Loop</span>${renderLoopState(t)}</div>
      <div class="detail-section-title">任务内容</div>
      <div style="font-size:var(--type-body);color:var(--ink-800);white-space:pre-wrap;">${esc(t.content)}</div>
      ${fb ? `<div class="feedback-content-quote" style="margin-top:12px;">${esc(fb.content)}</div>` : ''}
      <div class="inspector-actions">
        ${t.state === TASK_STATE.PENDING_REVIEW && t.phase !== 'completed' ? `<button class="primary-button" data-task-action="confirm-review">确认开始（进入待认领）</button>` : ''}
        ${t.state === TASK_STATE.PENDING && !t.executor_id ? `<button class="primary-button" data-task-action="claim">认领任务</button>` : ''}
        ${t.state === TASK_STATE.PENDING && t.executor_id ? `<span style="color:var(--violet-700);font-size:var(--type-caption);">已认领，等待 automation 自动领取并启动 Codex 线程…</span>` : ''}
        ${(t.state === TASK_STATE.IN_PROGRESS || t.state === TASK_STATE.COMPLETED) ? `<button class="primary-button" data-task-action="submit-review">提交待验收 + 生成客户进展</button>` : ''}
      </div>
    </div>`;
}

/* ---- View C: 进展确认（草稿 — 桥2 待建，用 planning-three-column 结构）---- */
let wbSelectedDraft = null;
function renderDraftsView() {
  const root = document.getElementById('viewDrafts');
  const drafts = projectDrafts().slice().sort((a, b) => (a.state === b.state ? b.created_at - a.created_at : (a.state === 'pending_review' ? -1 : 1)));
  const detail = wbSelectedDraft != null ? renderDraftDetail(wbSelectedDraft) : `<div class="empty-panel"><strong>选择一条草稿</strong><p>预览客户将看到的内容，确认后发送。</p></div>`;
  root.innerHTML = `
    <div class="page platform-page planning-page">
      <div class="page-heading split-heading">
        <div>
          <p class="eyebrow">PRODUCT LIFECYCLE · DRAFTS</p>
          <h1>进展确认</h1>
          <p>处理完成后给客户的进展草稿，确认后发送。不会自动发送未经确认的内容。</p>
        </div>
        <span class="todo-badge" title="桥2：closeout→草稿→人工确认→发送 — 后端待建">待建·桥2</span>
      </div>
      <div class="planning-three-column">
        <section class="panel-card planning-list-panel">
          <div class="section-title-row"><div><div><h2>状态</h2><p>按草稿状态分组</p></div></div></div>
          <div class="planning-list">
            <button class="planning-list-item is-active" type="button"><strong>待确认</strong><small>${drafts.filter((d) => d.state === 'pending_review').length} 条</small></button>
            <button class="planning-list-item" type="button"><strong>已发送</strong><small>${drafts.filter((d) => d.state === 'sent').length} 条</small></button>
          </div>
        </section>
        <section class="panel-card planning-detail">
          <div class="section-title-row"><div><div><h2>草稿列表</h2><p>选择草稿查看客户预览</p></div></div></div>
          <div class="workspace-pane-scroll" style="padding:0;">
            ${drafts.map((d) => {
              const fb = fbById(d.feedback_id);
              return `
              <button class="planning-list-item ${wbSelectedDraft === d.id ? 'is-active' : ''}" data-draft-item="${d.id}" type="button">
                <strong>${fb ? fb.short_id : '—'}</strong>
                <small style="overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">${esc(d.content)}</small>
                <span class="status-pill ${d.state === 'pending_review' ? 'pending' : 'completed'}" style="margin-top:4px;">${d.state === 'pending_review' ? '待确认' : '已发送'}</span>
              </button>`;
            }).join('') || '<p style="color:var(--ink-400);padding:20px;font-size:var(--type-caption);">无草稿</p>'}
          </div>
        </section>
        <aside class="inspector-card planning-inspector">
          <div class="section-title-row"><div><div><h2>客户预览</h2><p>客户会看到的内容</p></div></div></div>
          <div style="padding:15px;">${detail}</div>
        </aside>
      </div>
    </div>`;
}

function renderDraftDetail(draftId) {
  const d = state.drafts.find((x) => x.id === draftId);
  if (!d) return '';
  const fb = fbById(d.feedback_id);
  const t = d.task_id ? taskById(d.task_id) : null;
  return `
    <div style="display:flex;align-items:center;gap:6px;margin-bottom:10px;">
      <span class="status-pill ${d.state === 'pending_review' ? 'pending' : 'completed'}">${d.state === 'pending_review' ? '待确认' : '已发送'}</span>
    </div>
    <div class="detail-field-row"><span>关联反馈</span><span>${fb ? fb.short_id : '—'}</span></div>
    <div class="detail-field-row"><span>关联任务</span><span>${t ? taskShortId(t.id) : '—'}</span></div>
    <div class="draft-customer-preview" style="margin-top:12px;">
      <div class="preview-label">客户会看到</div>
      <div class="chat-message assistant"><div style="font-size:var(--type-body);color:var(--ink-800);white-space:pre-wrap;">${esc(d.content)}</div></div>
    </div>
    <div class="inspector-actions" style="margin-top:14px;">
      ${d.state === 'pending_review' ? `<button class="primary-button" data-draft-action="send">编辑并发送</button>` : '<span style="color:var(--ink-400);font-size:var(--type-caption);">已发送给客户</span>'}
    </div>`;
}

/* ---- View D: 验收与交付（对齐 Task accepted + 产物交付 artifact_url 回写，部署不做）---- */
function renderOrgView() {
  const root = document.getElementById('viewOrg');
  const pTasks = projectTasks();
  const pendingAccept = pTasks.filter((t) => t.state === TASK_STATE.PENDING_REVIEW);
  const pDeliveries = state.deliveries.filter((d) => pTasks.some((t) => t.id === d.task_id));
  const delivering = pDeliveries.length;
  const scoped = state.scope.customer !== 'all' || state.scope.project !== 'all';
  const tabs = [
    { key: 'accept', label: '验收' },
    { key: 'delivery', label: '交付' },
    { key: 'members', label: '成员' },
    { key: 'info', label: '项目信息' },
    { key: 'knowledge', label: '知识源' },
  ];
  root.innerHTML = `
    <div class="page platform-page">
      <div class="page-heading split-heading">
        <div>
          <p class="eyebrow">ORGANIZATION · ACCEPT & DELIVERY</p>
          <h1>验收与交付</h1>
          <p>待验收任务通过后构建产物，产物地址回写并通知客户。部署不在本期。</p>
        </div>
      </div>
      <div class="metric-grid">
        <div class="metric-card attention"><span>待验收</span><strong>${pendingAccept.length}</strong></div>
        <div class="metric-card running"><span>交付中</span><strong>${delivering}</strong></div>
        <div class="metric-card healthy"><span>反馈</span><strong>${projectFbs().length}</strong></div>
        <div class="metric-card"><span>知识源</span><strong>${scoped ? projectKnowledge().filter((k) => k.scope === 'project').length : '—'}</strong></div>
      </div>
      <div class="organization-tabs">${tabs.map((t) => `<button class="${wbOrgTab === t.key ? 'is-active' : ''}" data-org-tab="${t.key}" type="button">${t.label}</button>`).join('')}</div>
      <div>${renderOrgTab()}</div>
    </div>`;
}

function renderOrgTab() {
  if (wbOrgTab === 'accept') {
    const list = projectTasks().filter((t) => t.state === TASK_STATE.PENDING_REVIEW);
    if (!list.length) return '<p style="color:var(--ink-400);font-size:var(--type-caption);">无待验收任务</p>';
    return `<table class="data-table"><thead><tr><th>客户</th><th>任务</th><th>处理人</th><th>来源反馈</th><th style="width:200px;">操作</th></tr></thead><tbody>
      ${list.map((t) => {
        const link = linkForTask(t.id);
        const fb = link ? fbById(link.feedback_id) : null;
        return `<tr><td>${esc(customerOf(t.project_id))}</td><td>${taskShortId(t.id)} · ${esc(firstLine(t.content))}</td><td>${esc(memberName(t.executor_id))}</td><td>${fb ? fb.short_id : '—'}</td><td><button class="primary-button" data-org-accept="${t.id}" style="min-height:28px;padding:0 10px;font-size:var(--type-caption);">通过</button> <button class="secondary-button" data-org-reject="${t.id}" style="min-height:28px;padding:0 10px;font-size:var(--type-caption);">驳回</button></td></tr>`;
      }).join('')}
    </tbody></table>`;
  }
  if (wbOrgTab === 'delivery') {
    const dlList = state.deliveries.filter((d) => projectTasks().some((t) => t.id === d.task_id));
    return `
      <p style="color:var(--ink-500);font-size:var(--type-caption);margin:0 0 12px;">验收通过后构建产物，产物地址回写并通知客户；部署不在本期。<span class="todo-badge" title="产物构建 + artifact_url 回写 — 后端待建">待建·产物交付</span></p>
      ${dlList.map((dl) => {
        const t = taskById(dl.task_id);
        if (!t) return '';
        const steps = ['已验收', '构建产物', '地址回写', '已通知客户'];
        return `<div style="margin-bottom:18px;"><div style="margin-bottom:8px;font-weight:700;color:var(--ink-800);font-size:var(--type-label);"><span class="task-tag" style="background:var(--violet-50);color:var(--violet-700);margin-right:6px;">${esc(customerOf(t.project_id))}</span>${taskShortId(t.id)} · ${esc(firstLine(t.content))}</div>
          <div class="delivery-track">
            ${steps.map((s, i) => `<div class="delivery-step ${i < dl.step ? 'is-complete' : i === dl.step ? 'is-current' : ''}"><strong>${s}</strong>${i < dl.step ? '已完成' : i === dl.step ? '进行中' : '待开始'}</div>`).join('')}
          </div>
          ${dl.artifact_url ? `<div class="delivery-artifact"><span class="detail-section-title" style="margin:0;">构建产物</span><code>${esc(dl.artifact_url)}</code><span class="task-tag" style="background:var(--green-100);color:var(--green-600);">${esc(dl.build_id)}</span></div>` : '<p style="color:var(--ink-400);font-size:var(--type-caption);margin-top:8px;">验收通过后构建产物，地址回写至此。</p>'}
          ${dl.step < 4 ? `<button class="secondary-button" data-org-deliver="${dl.task_id}" style="margin-top:8px;min-height:30px;font-size:var(--type-caption);">推进交付</button>` : '<span class="status-pill completed" style="margin-top:8px;">已交付</span>'}
        </div>`;
      }).join('') || '<p style="color:var(--ink-400);font-size:var(--type-caption);">无交付中任务</p>'}`;
  }
  if (wbOrgTab === 'members') {
    return `
      <p style="color:var(--ink-500);font-size:var(--type-caption);margin:0 0 8px;">能力（处理/验收）映射自 ProjectMember.Duty→Capabilities。点击成员行切换演示身份（验证分诊 role 门控）。<span class="todo-badge" title="Duty→Capabilities 结构化 — 后端待建">待建·capabilities</span></p>
      <table class="data-table"><thead><tr><th>姓名</th><th>角色</th><th>能力</th></tr></thead><tbody>
        ${state.members.map((m) => `<tr data-member-switch="${m.id}" class="${m.id === state.currentUserId ? 'is-current-user' : ''}" style="cursor:pointer;"><td>${esc(m.name)}${m.id === state.currentUserId ? ' <span class="task-tag" style="background:var(--violet-100);color:var(--violet-700);">当前</span>' : ''}</td><td>${m.role}</td><td>${m.caps.map((c) => `<span class="task-tag">${c === CAP.TRIAGE ? '分诊' : c === CAP.EXECUTE ? '处理' : '验收'}</span>`).join(' ')}</td></tr>`).join('')}
      </tbody></table>`;
  }
  if (wbOrgTab === 'info') {
    const p = currentProject();
    if (!p) return '<div class="kb-scope-hint"><strong>项目信息</strong><p>在顶部筛选中选择具体项目（非"全部项目"），查看其代码仓库、组织等信息。</p></div>';
    return `<table class="data-table"><tbody>
      <tr><td style="width:120px;">客户</td><td>${esc(p.customer)}</td></tr>
      <tr><td>项目编号</td><td>${p.id}</td></tr>
      <tr><td>项目名称</td><td>${esc(p.name)}</td></tr>
      <tr><td>代码仓库</td><td>${esc(p.git_url)}</td></tr>
      <tr><td>组织</td><td>${p.organization_id || '独立项目'}</td></tr>
      <tr><td>本地工作区</td><td>${p.local_path ? `<code>${esc(p.local_path)}</code>` : '<span style="color:var(--amber-700);font-weight:700;">未绑定（任务停在 pending）</span>'} <button class="secondary-button" data-ws-bind="${p.id}" style="min-height:26px;padding:0 8px;font-size:var(--type-caption);margin-left:6px;">${p.local_path ? '重新绑定' : '绑定目录'}</button></td></tr>
    </tbody></table>
    <p style="color:var(--ink-400);font-size:var(--type-caption);margin-top:8px;">项目编号是数据隔离边界；客户端 SDK 嵌入宿主应用，按项目编号隔离反馈与知识。</p>`;
  }
  if (wbOrgTab === 'knowledge') {
    const all = projectKnowledge();
    const pub = all.filter((k) => k.scope === 'public');
    // 私有知识源仅在 scope 收缩到单客户/单项目时显示（隔离边界）
    const scoped = state.scope.customer !== 'all' || state.scope.project !== 'all';
    const proj = scoped ? all.filter((k) => k.scope === 'project') : [];
    const renderTbl = (list, title) => `
      <div style="margin-bottom:18px;"><div class="detail-section-title">${title}</div>
      <table class="data-table"><thead><tr><th>名称</th><th>检索类型</th><th>文档数</th><th>最后同步</th><th>状态</th><th style="width:96px;">操作</th></tr></thead><tbody>
        ${list.map((k) => `<tr>
          <td>${esc(k.name)}</td>
          <td><span class="task-tag">${k.retrieve_kind === 'code' ? '代码语义' : k.retrieve_kind === 'doc' ? '文档RAG' : 'FAQ'}</span></td>
          <td>${k.doc_count ?? '—'}</td>
          <td>${k.last_synced ? fmtRelative(k.last_synced) : '—'}</td>
          <td><span class="status-pill ${k.status === '已同步' ? 'completed' : 'pending'}">${k.status}</span></td>
          <td><button class="secondary-button" data-kb-rebuild="${k.id}" style="min-height:26px;padding:0 8px;font-size:var(--type-caption);">重建索引</button></td>
        </tr>`).join('')}
      </tbody></table></div>`;
    const privateHint = !scoped ? `<div class="kb-scope-hint"><strong>客户私有知识库按项目隔离</strong><p>在顶部筛选中选择具体客户或项目，查看其代码仓库与文档索引。</p></div>` : '';
    const testBox = `
      <div class="kb-test-box">
        <div class="kb-test-head"><strong>检索测试</strong><span style="color:var(--ink-400);font-size:var(--type-caption);">${scoped ? '模拟智能客服两层检索（当前 scope 内）' : '选择客户/项目后可检索其私有库'}</span></div>
        <div class="kb-test-input"><input id="kbTestQuery" type="search" placeholder="输入测试问题，如：自定义模块白屏" value="${esc(window.__kbTestQuery || '')}" ${scoped ? '' : 'disabled'}><button class="primary-button" data-kb-test type="button" ${scoped ? '' : 'disabled'}>检索</button></div>
        ${window.__kbTestResult ? `
      <div class="kb-test-result">
        <div class="kb-test-head"><strong>检索结果</strong><span class="retrieval-confidence ${window.__kbTestResult.confidence >= CONFIDENCE_THRESHOLD ? 'high' : 'low'}">置信度 ${(window.__kbTestResult.confidence * 100).toFixed(0)}%</span></div>
        ${window.__kbTestResult.hits.map((h) => `
          <div class="retrieval-hit ${h.source}">
            <div class="retrieval-hit-head"><span class="retrieval-source ${h.source}">${h.source === 'customer_lib' ? '客户代码库' : '产品库'}</span><span class="retrieval-type">${h.type === 'code' ? '代码' : h.type}</span><span class="retrieval-score">${(h.score * 100).toFixed(0)}%</span></div>
            <strong>${esc(h.title)}</strong><p>${esc(h.snippet)}</p>
          </div>`).join('') || '<p style="color:var(--ink-400);font-size:var(--type-caption);">未命中</p>'}
      </div>` : ''}
      </div>`;
    return `
      <p style="color:var(--ink-500);font-size:var(--type-caption);margin:0 0 12px;">两层知识库：客户私有库（代码语义索引+文档RAG+FAQ）按项目隔离；共享产品库所有项目共用。<span class="todo-badge" title="代码语义检索独立选型，WeKnora 仅承文档 — 后端待建">待建·代码检索</span></p>
      ${testBox}
      ${privateHint}
      ${scoped ? renderTbl(proj, '项目知识源（仅当前 scope 客户端可见）') : ''}
      ${renderTbl(pub, '公共知识库（所有项目共用）')}`;
  }
  return '';
}

/* ============================================================
 * 七-B、项目管理与跨 view 跳转
 * ============================================================ */
function newProject() {
  openModal('新建项目', `
    <div class="modal-field"><label>客户企业</label><input id="npCustomer" placeholder="如 Acme"></div>
    <div class="modal-field"><label>项目名称</label><input id="npName" placeholder="如 Acme Console"></div>
    <div class="modal-field"><label>代码仓库地址</label><input id="npGit" placeholder="https://git.example.com/..."></div>
    <p style="color:var(--ink-500);font-size:var(--type-caption);">项目创建后筛选自动收缩到该项目；成员/知识源后续在此项目下补充。</p>
  `, `<button class="secondary-button" data-modal-close>取消</button><button class="primary-button" id="npConfirm">创建并切换</button>`);
}
function newProjectConfirm() {
  const customer = document.getElementById('npCustomer').value.trim();
  const name = document.getElementById('npName').value.trim();
  if (!customer || !name) return;
  const git = document.getElementById('npGit').value.trim();
  const id = Math.max(0, ...state.projects.map((p) => p.id)) + 1;
  state.projects.push({ id, name, customer, git_url: git || null, organization_id: null });
  state.scope = { customer, project: id };
  wbSelectedFb = null; wbSelectedTask = null; wbOrgTab = 'accept'; wbView = 'today';
  closeModal();
  render();
}
// 跨 view 跳转（强化端到端链路）
function jumpTo(view, opts = {}) {
  closeModal(); // 跳转前关闭任何残留弹窗（“前往X”按钮场景）
  wbView = view;
  if (view === 'feedback' && opts.fbId != null) wbSelectedFb = opts.fbId;
  if (view === 'work' && opts.taskId != null) wbSelectedTask = opts.taskId;
  if (view === 'drafts' && opts.draftId != null) wbSelectedDraft = opts.draftId;
  if (view === 'org') wbOrgTab = opts.orgTab || 'accept';
  render();
}
// Today 首页跳转
function todayJump(spec) {
  const [view, idStr] = spec.split(':');
  const id = Number(idStr);
  if (view === 'feedback') jumpTo('feedback', { fbId: id });
  else if (view === 'work') jumpTo('work', { taskId: id });
  else if (view === 'drafts') jumpTo('drafts', { draftId: id });
  else if (view === 'org') { wbSelectedTask = id; jumpTo('org', { orgTab: 'accept' }); }
}

/* ============================================================
 * 八、模态弹窗
 * ============================================================ */
function openModal(title, bodyHtml, footHtml) {
  const root = document.getElementById('modalRoot');
  root.innerHTML = `
    <div class="modal-overlay">
      <div class="modal-card">
        <div class="modal-head"><h3>${esc(title)}</h3><button class="icon-button" data-modal-close type="button">✕</button></div>
        <div class="modal-body">${bodyHtml}</div>
        <div class="modal-foot">${footHtml}</div>
      </div>
    </div>`;
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
  // 分诊门控（对齐 US-04 / AC-F04：仅 owner/admin 可 triage，member 返回 403）
  const me = memberById(state.currentUserId);
  if (!me || !me.caps.includes(CAP.TRIAGE)) {
    openModal('无分诊权限', `<p style="margin:0;">需要项目管理员（owner/admin）分诊。当前账号「${esc(me ? me.name : '未知')}」无分诊能力（member 调 triage 返回 403）。</p>`, `<button class="primary-button" data-modal-close>知道了</button>`);
    return;
  }
  const executors = state.members.filter((m) => m.caps.includes(CAP.EXECUTE));
  openModal('转为开发任务', `
    <div class="modal-field"><label>任务标题</label><input id="convTitle" value="${esc('[反馈] ' + fb.title)}"></div>
    <div class="modal-field"><label>处理人</label><select id="convExecutor">
      <option value="">未指定</option>
      ${executors.map((m) => `<option value="${m.id}">${esc(m.name)}</option>`).join('')}
    </select></div>
    <div class="modal-field"><label>优先级</label><select id="convPrio">
      ${['P1', 'P2', 'P3'].map((p) => `<option value="${p}" ${fb.data.priority === p ? 'selected' : ''}>${p}</option>`).join('')}
    </select></div>
  `, `<button class="secondary-button" data-modal-close>取消</button><button class="primary-button" data-conv-confirm="${fbId}">创建任务</button>`);
}

function fbConvertConfirm(fbId) {
  const fb = fbById(fbId);
  const title = document.getElementById('convTitle').value;
  const executorId = Number(document.getElementById('convExecutor').value) || null;
  const prio = document.getElementById('convPrio').value;
  const newId = Math.max(0, ...state.tasks.map((t) => t.id)) + 1;
  state.tasks.push({
    id: newId, project_id: fb.project_id, father_id: null,
    content: title, state: TASK_STATE.PENDING_REVIEW, executor_id: executorId, creator_id: state.currentUserId,
    priority: FB_PRIO[prio] || 2, tags: '[Bug](#ffff0000)', created_at: Date.now(),
    source_feedback_id: fbId, thread_id: null, case_id: null, phase: null,
  });
  state.task_links.push({ feedback_id: fbId, task_id: newId, relation_type: RELATION.CONVERTED_TO, is_primary: true, created_by: state.currentUserId });
  fb.status = FB_STATUS.CONVERTED;
  fb.triage_status = TRIAGE.ACCEPTED;
  fb.last_message_at = Date.now();
  state.messages.push({ id: Date.now(), feedback_id: fbId, sender_type: SENDER.SYSTEM, content: `已转为开发任务 ${taskShortId(newId)}，处理人 ${executorId ? memberName(executorId) : '待认领'}。`, metadata: {}, attachments: [], created_at: Date.now() });
  closeModal();
  // 结果引导：前往任务
  openModal('已转为开发任务', `
    <p style="margin:0;">已创建 <strong>${taskShortId(newId)}</strong>，反馈状态更新为「已流转」。</p>
    <p style="color:var(--ink-500);font-size:var(--type-caption);margin:0;">下一步：在任务开发页认领并处理。</p>
  `, `<button class="secondary-button" data-modal-close>留在反馈页</button><button class="primary-button" data-jump="work:${newId}">前往任务</button>`);
  render();
}

function fbReply(fbId) {
  const fb = fbById(fbId);
  openModal('回复客户', `
    <div class="modal-field"><label>回复内容（客户会在反馈中看到）</label><textarea id="replyText" rows="4">${esc('感谢反馈，我们已收到并开始跟进。')}</textarea></div>
  `, `<button class="secondary-button" data-modal-close>取消</button><button class="primary-button" data-reply-confirm="${fbId}">发送</button>`);
}
function fbReplyConfirm(fbId) {
  const text = document.getElementById('replyText').value.trim();
  if (!text) return;
  const fb = fbById(fbId);
  state.messages.push({ id: Date.now(), feedback_id: fbId, sender_type: SENDER.DEVELOPER, content: text, metadata: { source: 'feedback-console' }, attachments: [], created_at: Date.now() });
  // 回复客户不改变分诊状态：accepted 是分诊决策产物，不是回复的副产物
  fb.last_message_at = Date.now();
  closeModal();
  render();
}
function fbIgnore(fbId) {
  const fb = fbById(fbId);
  if (!fb) return;
  const me = memberById(state.currentUserId);
  if (!me || !me.caps.includes(CAP.TRIAGE)) {
    openModal('无分诊权限', `<p style="margin:0;">需要项目管理员（owner/admin）分诊。当前账号「${esc(me ? me.name : '未知')}」无分诊能力。</p>`, `<button class="primary-button" data-modal-close>知道了</button>`);
    return;
  }
  // 忽略并回复说明（对齐 US-04：忽略分支草稿确认后发客户，不留死信）
  openModal('忽略反馈并回复说明', `
    <div class="modal-field"><label>给客户的说明（确认后发送，客户会收到）</label><textarea id="ignoreText" rows="4">${esc('感谢反馈。经评估当前不会安排开发，原因：不在本期范围内。如有疑问可继续在此反馈。')}</textarea></div>
    <p style="color:var(--ink-500);font-size:var(--type-caption);margin:0;">发送后反馈状态更新为「已忽略」，客户可见。</p>
  `, `<button class="secondary-button" data-modal-close>取消</button><button class="primary-button" data-ignore-confirm="${fbId}">确认忽略并发送</button>`);
}
function fbIgnoreConfirm(fbId) {
  const fb = fbById(fbId);
  if (!fb) return;
  const text = (document.getElementById('ignoreText')?.value || '').trim();
  fb.triage_status = TRIAGE.IGNORED;
  fb.status = FB_STATUS.IGNORED;
  fb.last_message_at = Date.now();
  if (text) state.messages.push({ id: Date.now(), feedback_id: fbId, sender_type: SENDER.DEVELOPER, content: text, metadata: { source: 'ignore-explain' }, attachments: [], created_at: Date.now() });
  closeModal();
  render();
}
function fbPrio(fbId, prio) {
  const fb = fbById(fbId);
  fb.data.priority = prio;
  render();
}

function taskStateChange(taskId, newState) {
  const t = taskById(taskId);
  const old = t.state;
  t.state = newState;
  // 回写关联 feedback（对齐 syncLinkedFeedbacksFromTask）
  const link = linkForTask(taskId);
  if (link) {
    const fb = fbById(link.feedback_id);
    fb.status = taskStateToFeedbackStatus(newState);
    fb.last_message_at = Date.now();
    state.messages.push({ id: Date.now(), feedback_id: fb.id, sender_type: SENDER.SYSTEM, content: `任务 ${taskShortId(taskId)} 状态变更：${TASK_PILL[old].label} → ${TASK_PILL[newState].label}。`, metadata: {}, attachments: [], created_at: Date.now() });
  }
  render();
}
function taskExecutorChange(taskId, executorId) {
  const t = taskById(taskId);
  t.executor_id = executorId || null;
  render();
}
function taskPrioChange(taskId, prio) {
  const t = taskById(taskId);
  t.priority = Number(prio);
  render();
}
// 认领 = 设 executor_id = 当前用户（走 updateTask API，无 claim 端点）
// state 保持 pending，由 automation 自动 dispatch 推进 pending→in_progress（对齐 automation-coordinator.mjs:1439）
function taskClaim(taskId) {
  const t = taskById(taskId);
  if (!t || t.state !== TASK_STATE.PENDING) return;
  t.executor_id = state.currentUserId;
  t.phase = 'queued';
  render();
  // 触发 automation 自动领取判定
  maybeAutoDispatch(taskId);
}
// confirm_review：pending_review → pending（确认可开始，进入待认领队列，对齐 today-guidance.mjs）
function taskConfirmReview(taskId) {
  const t = taskById(taskId);
  if (!t || t.state !== TASK_STATE.PENDING_REVIEW) return;
  t.state = TASK_STATE.PENDING;
  t.phase = 'queued';
  const link = linkForTask(taskId);
  if (link) {
    const fb = fbById(link.feedback_id);
    if (fb) state.messages.push({ id: Date.now(), feedback_id: fb.id, sender_type: SENDER.SYSTEM, content: `任务 ${taskShortId(taskId)} 已确认开始，进入待认领队列。`, metadata: {}, attachments: [], created_at: Date.now() });
  }
  render();
  // 若已分配 executor 且门控满足，触发自动推进
  maybeAutoDispatch(taskId);
}
// automation 自动领取：门控满足时延迟推进 pending→in_progress + 起 Codex 线程
function maybeAutoDispatch(taskId) {
  const t = taskById(taskId);
  if (!t || t.state !== TASK_STATE.PENDING) return;
  const elig = automationEligible(t);
  if (!elig.ok) return; // 门控不满足，停在 pending，UI 由 renderLoopState 提示阻塞原因
  setTimeout(() => {
    const cur = taskById(taskId);
    if (!cur || cur.state !== TASK_STATE.PENDING) return;
    if (!automationEligible(cur).ok) return; // 二次校验（总闸可能被关）
    cur.state = TASK_STATE.IN_PROGRESS;
    cur.phase = 'starting';
    cur.thread_id = `thd_${cur.id}_${Math.floor(Date.now() / 1000).toString(36)}`;
    cur.case_id = `CASE-${cur.id}`;
    if (!cur.gaps) cur.gaps = [
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
        state.messages.push({ id: Date.now(), feedback_id: fb.id, sender_type: SENDER.SYSTEM, content: `已认领并启动 Codex 开发线程（${cur.thread_id}），进入 Gap-driven Loop 自主开发。`, metadata: { thread_id: cur.thread_id }, attachments: [], created_at: Date.now() });
      }
    }
    render();
    // phase: starting → in_progress（线程就绪，开始推进 Gap）
    setTimeout(() => { const c = taskById(taskId); if (c && c.state === TASK_STATE.IN_PROGRESS) { c.phase = 'in_progress'; render(); } }, 900);
    // Gap-by-Gap 推进（对齐时序图 §4.3：selectNextRound → 推进 → transition → ledger 写回）
    advanceGaps(taskId);
  }, 1200);
}
// Gap 逐个推进：in_progress→done，下一个 pending→in_progress；全部 done → loop 达成 → completed（落地 Task completed 态）
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
      // 全部 Gap 达成 → loop 收尾 → completed（对齐时序图 §4.2 in_progress --loop达成--> completed）
      cur.state = TASK_STATE.COMPLETED;
      cur.phase = 'completed';
      const link = linkForTask(cur.id);
      if (link) {
        const fb = fbById(link.feedback_id);
        if (fb) {
          fb.status = taskStateToFeedbackStatus(TASK_STATE.COMPLETED);
          fb.last_message_at = Date.now();
          state.messages.push({ id: Date.now(), feedback_id: fb.id, sender_type: SENDER.SYSTEM, content: `任务 ${taskShortId(cur.id)} Codex loop 全部 Gap 达成，已 Git 收尾，待提交验收。`, metadata: {}, attachments: [], created_at: Date.now() });
        }
      }
      render();
    }
  };
  setTimeout(step, 1000);
}
function taskSubmitReview(taskId) {
  const t = taskById(taskId);
  if (t.state !== TASK_STATE.IN_PROGRESS && t.state !== TASK_STATE.COMPLETED) return; // 仅 loop 收尾/推进中可提交验收
  t.state = TASK_STATE.PENDING_REVIEW;
  t.phase = 'completed'; // 区分"待确认开始"(null)与"已提交待验收"(completed)
  // 生成客户进展草稿（桥2 — 待建）
  const link = linkForTask(taskId);
  const fbId = link ? link.feedback_id : null;
  const draftId = Math.max(0, ...state.drafts.map((d) => d.id)) + 1;
  state.drafts.push({
    id: draftId, project_id: t.project_id, feedback_id: fbId, task_id: taskId, state: 'pending_review',
    content: `${firstLine(t.content)}已处理完成，预计随下一次发布生效，请留意更新。如有疑问可在反馈中补充。`,
    created_at: Date.now(),
  });
  if (fbId) {
    const fb = fbById(fbId);
    fb.status = taskStateToFeedbackStatus(TASK_STATE.PENDING_REVIEW);
    fb.last_message_at = Date.now();
    state.messages.push({ id: Date.now(), feedback_id: fbId, sender_type: SENDER.SYSTEM, content: `任务 ${taskShortId(taskId)} 已提交待验收，已生成客户进展草稿待确认。`, metadata: {}, attachments: [], created_at: Date.now() });
  }
  jumpTo('drafts', { draftId });
}

function draftSelect(id) { wbSelectedDraft = wbSelectedDraft === id ? null : id; render(); }
function draftSend(draftId) {
  const d = state.drafts.find((x) => x.id === draftId);
  if (!d) return;
  openModal('编辑并发送进展', `
    <div class="modal-field"><label>客户会看到的进展内容</label><textarea id="draftText" rows="5">${esc(d.content)}</textarea></div>
    <p style="color:var(--ink-500);font-size:var(--type-caption);">发送后，客户反馈状态将更新为"有进展，待你确认"。</p>
  `, `<button class="secondary-button" data-modal-close>取消</button><button class="primary-button" data-draft-send-confirm="${draftId}">确认发送</button>`);
}
function draftSendConfirm(draftId) {
  const d = state.drafts.find((x) => x.id === draftId);
  d.content = document.getElementById('draftText').value.trim();
  d.state = 'sent';
  const fb = fbById(d.feedback_id);
  if (fb) {
    fb.hasPendingProgress = true; // 客户侧显示"有进展，待你确认"
    fb.last_message_at = Date.now();
    state.messages.push({ id: Date.now(), feedback_id: fb.id, sender_type: SENDER.DEVELOPER, content: d.content, metadata: { source: 'progress-draft' }, attachments: [], created_at: Date.now() });
    state.messages.push({ id: Date.now() + 1, feedback_id: fb.id, sender_type: SENDER.SYSTEM, content: '收到进展', metadata: {}, attachments: [], created_at: Date.now() });
  }
  closeModal();
  openModal('进展已发送', `
    <p style="margin:0;">客户将在反馈中看到此进展，状态更新为「有进展，待你确认」。</p>
    <p style="color:var(--ink-500);font-size:var(--type-caption);margin:0;">下一步：任务进入待验收，由验收人通过后交付。</p>
  `, `<button class="secondary-button" data-modal-close>关闭</button><button class="primary-button" data-jump="org:accept">前往验收</button>`);
  render();
}

function orgAccept(taskId) {
  const t = taskById(taskId);
  t.state = TASK_STATE.ACCEPTED;
  // 进入交付轨道（构建产物 + artifact_url 回写 — 待建，部署不做）
  if (!state.deliveries.find((d) => d.task_id === taskId)) {
    const link = linkForTask(taskId);
    state.deliveries.push({ task_id: taskId, step: 1, feedback_id: link ? link.feedback_id : null });
  }
  const link = linkForTask(taskId);
  if (link) {
    const fb = fbById(link.feedback_id);
    fb.status = taskStateToFeedbackStatus(TASK_STATE.ACCEPTED);
    fb.last_message_at = Date.now();
    state.messages.push({ id: Date.now(), feedback_id: fb.id, sender_type: SENDER.SYSTEM, content: `任务 ${taskShortId(taskId)} 已验收通过，进入交付流程。`, metadata: {}, attachments: [], created_at: Date.now() });
  }
  closeModal();
  openModal('验收通过', `
    <p style="margin:0;">任务已验收，进入交付轨道。</p>
    <p style="color:var(--ink-500);font-size:var(--type-caption);margin:0;">下一步：构建产物，地址回写后通知客户。</p>
  `, `<button class="secondary-button" data-modal-close>关闭</button><button class="primary-button" data-jump="org:delivery">前往交付</button>`);
  render();
}
function orgReject(taskId) {
  const t = taskById(taskId);
  t.state = TASK_STATE.IN_PROGRESS;
  const link = linkForTask(taskId);
  if (link) {
    const fb = fbById(link.feedback_id);
    fb.status = FB_STATUS.IN_PROGRESS;
    state.messages.push({ id: Date.now(), feedback_id: fb.id, sender_type: SENDER.SYSTEM, content: `任务 ${taskShortId(taskId)} 验收驳回，退回处理。`, metadata: {}, attachments: [], created_at: Date.now() });
  }
  render();
}
function orgDeliver(taskId) {
  const dl = state.deliveries.find((d) => d.task_id === taskId);
  if (!dl) return;
  dl.step += 1;
  if (dl.step === 2) {
    // 构建产物步：回写 artifact_url（对齐 F-07 产物交付回写）
    const t = taskById(taskId);
    const projName = t ? projectById(t.project_id)?.name : 'project';
    dl.artifact_url = `https://builds.arckit.example/${(projName || 'project').toLowerCase().replace(/\s/g, '-')}/task-${taskId}/${Date.now()}.zip`;
    dl.build_id = `BLD-${taskId}-${Math.floor(Date.now() / 1000)}`;
  }
  if (dl.step >= 4) {
    const link = linkForTask(taskId);
    if (link) {
      const fb = fbById(link.feedback_id);
      fb.status = FB_STATUS.RELEASED; // 交付回写后的终态（对齐时序图 §4.1）
      fb.hasPendingProgress = false;
      fb.last_message_at = Date.now();
      state.messages.push({ id: Date.now(), feedback_id: fb.id, sender_type: SENDER.SYSTEM, content: `已交付产物（${dl.artifact_url}），问题闭环。`, metadata: { artifact_url: dl.artifact_url }, attachments: [], created_at: Date.now() });
    }
  }
  render();
}

// workspace 绑定本地代码仓库目录（对齐 F-10 / 时序图步骤0：loop 跑起来的工程前置）
function wsBind(projectId) {
  const p = projectById(projectId);
  if (!p) return;
  const defaultPath = p.local_path || `/Users/zqs/arckit-workspaces/${p.customer.toLowerCase()}/${p.name.toLowerCase().replace(/\s/g, '-')}`;
  openModal('绑定本地工作区目录', `
    <div class="modal-field"><label>本地代码仓库目录（Codex loop 运行工作区）</label><input id="wsPath" value="${esc(defaultPath)}"></div>
    <p style="color:var(--ink-500);font-size:var(--type-caption);">绑定后 automation 自动领取门控才会通过；未绑定的项目任务停在 pending，无法启动 Codex 线程。</p>
  `, `<button class="secondary-button" data-modal-close>取消</button><button class="primary-button" data-ws-confirm="${projectId}">确认绑定</button>`);
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

/* 知识库管理：重建索引 + 检索测试（对齐 F-09）*/
function kbRebuild(sourceId) {
  const k = state.knowledge_sources.find((x) => x.id === Number(sourceId));
  if (!k) return;
  k.status = '索引中';
  k.doc_count = 0;
  render();
  // 模拟异步索引完成（真实由 WeKnora/代码检索 worker 回调）
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

/* ============================================================
 * 十、事件委托
 * ============================================================ */
function on(e, sel, fn) { document.addEventListener(e, (ev) => { const t = ev.target.closest(sel); if (t) fn(t, ev); }); }

// 弹窗关闭：[data-modal-close]（✕ / 关闭 / 知道了 等显式关闭按钮）→ 关闭；
// 点遮罩背景（modal-overlay 本身，非其子元素）→ 关闭；
// modal-card 内其他按钮（创建任务/确认忽略/绑定等）不匹配，不误关。
on('click', '[data-modal-close]', () => closeModal());
on('click', '.modal-overlay', (t, ev) => { if (ev.target === t) closeModal(); });

// SDK
on('click', '[data-sdk-tab]', (t) => { sdkView = t.dataset.sdkTab; sdkSelectedFeedbackId = null; if (sdkView === 'mine') sdkMineFilter = 'all'; render(); });
on('click', '[data-sdk-quick]', (t) => sdkHandleQuick(t.dataset.sdkQuick));
on('click', '#sdkSend', sdkHandleSend);
on('click', '[data-sdk-action]', (t) => sdkHandleAction(t.dataset.sdkAction));
on('click', '[data-sdk-fb]', (t) => { sdkSelectedFeedbackId = Number(t.dataset.sdkFb); render(); });
on('click', '[data-sdk-mine-filter]', (t) => { sdkMineFilter = t.dataset.sdkMineFilter; sdkSelectedFeedbackId = null; render(); });
on('click', '[data-sdk-back]', () => { sdkSelectedFeedbackId = null; render(); });
on('click', '[data-sdk-supplement]', (t) => {
  const fbId = Number(t.dataset.sdkSupplement);
  const ta = document.getElementById('sdkSupplement');
  const text = (ta?.value || '').trim();
  if (!text) return;
  state.messages.push({ id: Date.now(), feedback_id: fbId, sender_type: SENDER.CUSTOMER, content: text, metadata: {}, attachments: [], created_at: Date.now() });
  const fb = fbById(fbId);
  fb.last_message_at = Date.now();
  fb.last_customer_message_at = Date.now();
  // 桥3：若该反馈绑定活跃 Case，模拟 steer 注入同一 Codex 线程生成草稿回复（硬关联门控）
  const lk = linkForFeedback(fbId);
  const tk = lk ? taskById(lk.task_id) : null;
  if (tk && [TASK_STATE.IN_PROGRESS, TASK_STATE.PENDING_REVIEW].includes(tk.state)) {
    state.messages.push({ id: Date.now() + 1, feedback_id: fbId, sender_type: SENDER.SYSTEM, content: `已将你的问题注入开发线程（${taskShortId(tk.id)}），基于当前进展生成回复草稿，团队确认后会发你。`, metadata: { steer: true }, attachments: [], created_at: Date.now() });
  }
  if (ta) ta.value = '';
  render();
});

// 工作台导航
on('click', '[data-wb-view]', (t) => { const v = t.dataset.wbView; if (v) { wbView = v; render(); } });

// 客户/项目两级筛选（级联：客户变化时项目重置为全部）
on('change', '#customerFilter', (t) => { state.scope.customer = t.value; state.scope.project = 'all'; window.__kbTestResult = null; window.__kbTestQuery = ''; wbSelectedFb = null; wbSelectedTask = null; render(); });
on('change', '#projectFilter', (t) => { state.scope.project = t.value === 'all' ? 'all' : Number(t.value); window.__kbTestResult = null; window.__kbTestQuery = ''; wbSelectedFb = null; wbSelectedTask = null; render(); });
on('click', '#newProjectButton', newProject);
on('click', '#npConfirm', newProjectConfirm);

// Today 首页跳转
on('click', '[data-today-jump]', (t) => todayJump(t.dataset.todayJump));

// 跨 view 跳转链接
on('click', '[data-jump]', (t) => {
  const spec = t.dataset.jump;
  const [view, ...rest] = spec.split(':');
  if (view === 'work') jumpTo('work', { taskId: Number(rest[0]) });
  else if (view === 'feedback') jumpTo('feedback', { fbId: Number(rest[0]) });
  else if (view === 'org') jumpTo('org', { orgTab: rest[0] || 'accept' });
});

// 反馈治理
on('click', '[data-fb-item]', (t) => wbSelectFb(Number(t.dataset.fbItem)));
on('change', '[data-fb-filter]', (t) => { wbFilter.fb = t.value; render(); });
on('input', '[data-fb-search]', (t) => { wbFilter.search = t.value; render(); });
on('change', '[data-fb-sort]', (t) => { wbFilter.sort = t.value; render(); });
on('click', '[data-fb-action]', (t) => {
  const a = t.dataset.fbAction;
  if (a === 'convert') fbConvert(wbSelectedFb);
  else if (a === 'reply') fbReply(wbSelectedFb);
  else if (a === 'ignore') fbIgnore(wbSelectedFb);
});
on('click', '[data-conv-confirm]', (t) => fbConvertConfirm(Number(t.dataset.convConfirm)));
on('click', '[data-reply-confirm]', (t) => fbReplyConfirm(Number(t.dataset.replyConfirm)));
on('click', '[data-ignore-confirm]', (t) => fbIgnoreConfirm(Number(t.dataset.ignoreConfirm)));
on('change', '[data-fb-prio]', (t) => fbPrio(wbSelectedFb, t.value));

// 任务开发
on('click', '[data-task-item]', (t) => wbSelectTask(Number(t.dataset.taskItem)));
on('change', '#automationToggle', (t) => {
  state.automation.enabled = t.checked;
  if (t.checked) {
    state.automation.queue_paused = false;
    render();
    // 总闸开启：触发所有已认领 pending 任务的 dispatch
    projectTasks().filter((x) => x.state === TASK_STATE.PENDING && x.executor_id).forEach((x) => maybeAutoDispatch(x.id));
  } else { render(); }
});
on('click', '[data-automation-pause]', () => { state.automation.queue_paused = true; render(); });
on('click', '[data-automation-resume]', () => {
  state.automation.queue_paused = false;
  render();
  projectTasks().filter((x) => x.state === TASK_STATE.PENDING && x.executor_id).forEach((x) => maybeAutoDispatch(x.id));
});
on('click', '[data-task-toggle]', (t, ev) => {
  ev.stopPropagation();
  const id = t.dataset.taskToggle;
  const kids = document.querySelector(`[data-task-children="${id}"]`);
  if (kids) { const open = kids.style.display !== 'none'; kids.style.display = open ? 'none' : 'block'; t.textContent = open ? '▸' : '▾'; }
});
on('change', '[data-task-assignee-select]', (t) => { wbFilter.assignee = t.value; render(); });
on('click', '[data-work-state]', (t) => { wbFilter.task = wbFilter.task === t.dataset.workState ? 'all' : t.dataset.workState; render(); });
on('click', '[data-task-reset]', () => { wbFilter.task = 'all'; wbFilter.assignee = 'all'; wbFilter.search = ''; render(); });
on('input', '[data-task-search]', (t) => { wbFilter.search = t.value; render(); });
on('change', '[data-task-state]', (t) => taskStateChange(wbSelectedTask, t.value));
on('change', '[data-task-executor]', (t) => taskExecutorChange(wbSelectedTask, Number(t.value)));
on('change', '[data-task-prio]', (t) => taskPrioChange(wbSelectedTask, t.value));
on('click', '[data-task-action]', (t) => {
  const a = t.dataset.taskAction;
  if (a === 'submit-review') taskSubmitReview(wbSelectedTask);
  else if (a === 'claim') taskClaim(wbSelectedTask);
  else if (a === 'confirm-review') taskConfirmReview(wbSelectedTask);
});

// 进展确认
on('click', '[data-draft-item]', (t) => draftSelect(Number(t.dataset.draftItem)));
on('click', '[data-draft-action]', (t) => { if (t.dataset.draftAction === 'send') draftSend(wbSelectedDraft); });
on('click', '[data-draft-send-confirm]', (t) => draftSendConfirm(Number(t.dataset.draftSendConfirm)));

// 验收与交付
on('click', '[data-org-tab]', (t) => { wbOrgTab = t.dataset.orgTab; render(); });
on('click', '[data-org-accept]', (t) => orgAccept(Number(t.dataset.orgAccept)));
on('click', '[data-org-reject]', (t) => orgReject(Number(t.dataset.orgReject)));
on('click', '[data-member-switch]', (t) => { state.currentUserId = Number(t.dataset.memberSwitch); render(); });
on('click', '[data-org-deliver]', (t) => orgDeliver(Number(t.dataset.orgDeliver)));
on('click', '[data-kb-rebuild]', (t) => kbRebuild(t.dataset.kbRebuild));
on('click', '[data-ws-bind]', (t) => wsBind(Number(t.dataset.wsBind)));
on('click', '[data-ws-confirm]', (t) => wsConfirm(Number(t.dataset.wsConfirm)));
on('click', '[data-kb-test]', () => kbTest());

/* ============================================================
 * 十一、初始化
 * ============================================================ */
document.addEventListener('DOMContentLoaded', render);
if (document.readyState !== 'loading') render();
