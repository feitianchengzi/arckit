# Feature PRD — 客户支持通道（反馈→开发 loop→产物交付全链路）

> 本文档配套 [`customer-support-orchestration-plan.md`](../../产品规划/customer-support-orchestration-plan.md)（权威实现版本，位于产品规划）与 [`customer-support-sequence-diagrams.md`](./customer-support-sequence-diagrams.md)（时序图，同目录）。
> 历史设计 [`customer-support-channel-design.md`](../../产品规划/customer-support-channel-design.md) 已归档，其中有效部分（反馈四类型、SLA、角色定义）已并入本文档。

---

## 文档信息

| 字段 | 说明 |
|------|------|
| **文档编号** | PRD-FEAT-customer-support-v1.0 |
| **功能名称** | 客户支持通道（对客入口 + 开发 loop + 产物交付出口） |
| **核心价值** | 让 arc 的需求开发 loop 在真实客户代码仓库上端到端跑通到可交付产物 |
| **迭代目标** | 打通"客户反馈→智能客服→分诊→Task→Codex loop→进展草稿→验收→产物交付"全链路，单客户试点验证 |
| **关联需求** | US-01 ~ US-09 |
| **状态** | 草稿 |
| **创建日期** | 2026-09-08 |
| **更新日期** | 2026-09-08 |
| **文档Owner** | Arckit 团队 |

---

## 1. 功能概述

### 1.1 功能定位

arc 的核心是需求开发 loop（coding agent 接需求目标后自主开发到达成）。本期不做客服系统，而是给已有的开发 loop 接一个**对客入口**（智能客服 + 反馈 SDK）和一个**对客出口**（产物交付），验证 loop 能在真实客户的真实代码仓库上端到端跑到可交付产物。

代码仓库托管在 Arckit 团队侧，每客户独立；最终交付客户的是构建产物（非代码、非部署到客户环境）。智能客服是对客的统一出入口形态，不是独立产品。

### 1.2 目标用户

| 用户类型 | 特征描述 | 核心诉求 |
|---------|---------|---------|
| 接入方企业用户（客户） | 使用接入方企业产品的人员，通过嵌入的 SDK 反馈问题 | 反馈有入口、有响应、有进度、有可验证交付物 |
| Arckit 团队（内部） | 负责客户软件开发/维护，用 arc 平台跑开发 loop | 反馈能分诊、能进 loop、进展能同步、产物能交付 |

### 1.3 核心价值

| 维度 | 描述 |
|------|------|
| 用户价值 | 反馈从数月缩到数天，可看到可验证的产物指向 |
| 业务价值 | 验证 arc 核心 loop 能端到端服务真实客户，是 arc 平台核心假设的证明 |
| 技术价值 | 复用已建成的 Task 7 态机 + Gap-driven Loop + Codex 线程贯穿，仅补入口出口与三条桥 |

### 1.4 优先级（RICE 评分）

| 指标 | 说明 | 得分 |
|------|------|------|
| **Reach（覆盖）** | 单客户试点，影响 1 个客户的全部反馈用户 | 50 |
| **Impact（影响）** | 验证平台核心假设，影响程度高 | 3 |
| **Confidence（置信度）** | 现状基线经代码核实，执行层已建成，置信高 | 80% |
| **Effort（工作量）** | 入口出口+三桥+知识库，约 2-3 人月 | 3 |
| **RICE Score** | 50 × 3 × 0.8 / 3 | **40** |

---

## 2. 功能需求

### 2.1 用户故事

| 故事ID | 角色 | 目标 | 价值 | 优先级 | 验收条件 |
|--------|------|------|------|--------|---------|
| US-01 | 客户 | 通过 SDK 对话式反馈问题 | 门槛低、信息被主动收集 | P0 | 对话追问后形成结构化结果，客户确认提交生成 Feedback |
| US-02 | 客户 | 在 SDK 查看我的反馈状态与进度 | 知道反馈被跟进 | P0 | 我的反馈列表显示状态时间线，收到进展能确认/补充 |
| US-03 | 客户 | 向智能客服提问常见问题 | 简单问题直接得到答复 | P1 | 命中知识库生成草稿，处理人确认后回复客户 |
| US-04 | 内部 | 对反馈做分诊决策（做/不做） | 决定反馈是否进开发 | P0 | owner/admin 门控，可转 Task 或忽略并回复说明 |
| US-05 | 内部 | 认领并处理开发任务 | 推进开发 loop | P0 | Task 从 pending 认领后进 in_progress，进 Codex loop |
| US-06 | 内部 | 确认进展草稿后发送客户 | 进展同步可控 | P0 | closeout 生成草稿，处理人确认后客户收到 |
| US-07 | 内部 | 验收任务并交付产物 | 闭环到可验证交付 | P0 | accept 后构建产物，artifact_url 回写，客户可见 |
| US-08 | 客户 | 处理中追问进展 | 不丢失上下文拿到回复 | P1 | 同 feedback_id 活跃 Case 经 steer 注入生成草稿回复 |
| US-09 | 内部 | 管理知识库源与检索测试 | 智能客服可答可控 | P1 | 可查看代码仓库/文档/FAQ 同步状态，触发重建索引 |

### 2.2 功能列表

| 功能ID | 功能名称 | 描述 | 优先级 | 关联故事 | 状态 |
|--------|---------|------|--------|---------|------|
| F-01 | SDK 对话式反馈 | 对话追问→结构化结果→确认提交 | P0 | US-01 | 待开发 |
| F-02 | SDK 我的反馈 | 状态时间线、进展确认、补充追问 | P0 | US-02,08 | 待开发 |
| F-03 | 智能客服两层知识库检索 | 客户私有库+共享产品库检索，置信度标注，草稿确认 | P1 | US-03,09 | 待开发 |
| F-04 | 反馈分诊门控 | role 兜底门控，转 Task/忽略+回复 | P0 | US-04 | 待开发 |
| F-05 | Task→Case 语义桥（桥1） | Gap.derived_from 加受控来源 | P0 | US-05 | 待开发 |
| F-06 | 进展草稿确认（桥2） | closeout→草稿→人工确认→发客户 | P0 | US-06 | 待开发 |
| F-07 | 产物交付回写 | accept→构建→artifact_url 回写 | P0 | US-07 | 待开发 |
| F-08 | 用户询问 steer 注入（桥3） | 硬关联门控+草稿确认 | P1 | US-08 | 待开发 |
| F-09 | 知识库管理面板 | 同步状态、重建索引、检索测试 | P1 | US-09 | 待开发 |
| F-10 | workspace 绑客户代码目录 | runtime 按客户项目绑本地仓库 | P0 | US-05 | 待开发 |

### 2.3 详细规格

#### F-01：SDK 对话式反馈

**功能描述**: 客户在 SDK 内通过自然语言对话反馈问题，智能客服追问收集位置/现象/期望，形成结构化结果待客户确认后提交。

**前置条件**:
- SDK 已嵌入宿主应用并配置 project_id
- 客户已建立 custom_user_id

**主要行为**:
1. 客户打开 SDK，智能客服主动问候
2. 客户描述问题（文字/截图）
3. 智能客服判断信息完整度，缺失则追问（页面？现象？期望？）
4. 形成结构化结果展示给客户确认
5. 客户确认→创建 Feedback（status=pending, triage_status=pending）

**业务规则**:
- 结构化结果必须含 position/phenomenon/expect 三字段（可补充）
- 同一对话内可多次补充更新整理
- 提交后 Feedback 编号回显给客户

**边界条件**:
| 边界场景 | 处理方式 |
|---------|---------|
| 客户只发一句话无上下文 | 追问补全三字段 |
| 客户中途切换话题 | 丢弃未确认的 collecting，重新收集 |
| 附件上传失败 | OSS 重试，不阻断文本提交 |

---

#### F-03：智能客服两层知识库检索

**功能描述**: 客户提问后，智能客服并行检索客户私有库（代码仓库+项目文档）与共享产品库（arckit facts+FAQ），合并结果标注命中来源与置信度，高置信生成草稿回复（处理人确认后发），低置信转追问收集。

**前置条件**:
- 客户私有库已索引（代码仓库语义索引 + 文档 RAG）
- 共享产品库已同步

**主要行为**:
1. 客户提问
2. 并行检索两层库
3. 合并结果，标注每个命中的来源（客户库/产品库）与置信度分数
4. 置信度≥阈值→生成草稿回复（含来源标注）→落库待确认 message
5. 置信度<阈值→转追问收集→创建 Feedback

**业务规则**:
- 客户私有库按项目隔离，每客户独立索引（代码仓库在 Arckit 团队侧）
- 共享产品库所有项目共用
- 代码语义检索独立选型（符号/调用关系），不塞进 WeKnora（WeKnora 仅承文档）
- 初期所有草稿经处理人确认后发送，不自动直发

**边界条件**:
| 边界场景 | 处理方式 |
|---------|---------|
| 两层库都未命中 | 转追问收集创建 Feedback |
| 客户库命中但产品库冲突 | 以客户库为准（客户实际实现优先） |
| 检索服务超时 | 降级为追问收集，不阻断 |
| 置信度阈值无标注集 | 初期人工拍保守值（规则硬匹配才算高置信） |

---

#### F-07：产物交付回写

**功能描述**: Task accepted 后构建产物，产物地址回写 Task，客户在 SDK 可见"已交付 + 产物指向"。部署不在本期。

**前置条件**:
- Task 已 accepted
- closeout 已完成（Git 收尾）

**主要行为**:
1. 验收通过 Task→accepted
2. 本地构建产物
3. artifact_url 回写 Task
4. Feedback status→completed，通知客户交付完成+产物指向

**业务规则**:
- 交付的是构建产物，不是部署
- artifact_url 必须可验证指向（哪怕是人工填的下载链接）
- 部署由客户自完成或人工提供，不在 arc loop 内

---

## 3. UI 设计

> 设计稿位于 `docs/product-space/迭代版本/【1】20260904/设计稿/`，两屏：
> - `01-客户端支持助手.html`：SDK 客户端
> - `02-内部工作台.html`：ArcOrbit 内部工作台
> 渲染逻辑 `prototype.js`，补充布局 `prototype.css`，视觉 token 全部来自 `runtime/arcorbit/desktop/renderer/styles.css`。

### 3.1 页面布局

**设计稿**: `docs/product-space/迭代版本/【1】20260904/设计稿/`

客户端 SDK（窄列 IM 形态）：

| 区域 | 位置 | 功能 | 说明 |
|------|------|------|------|
| 头部 | top | 标题+说明 | "有问题？先问问支持助手" |
| 标签栏 | top | 对话/我的反馈 | 切换视图 |
| 对话区 | center | IM 双气泡+整理确认卡 | 客服左/客户右 |
| 输入区 | bottom | 文本框+发送 | placeholder 随阶段变 |
| 我的反馈 | center | 列表↔详情 push 导航 | 状态时间线+补充 |

内部工作台（ArcOrbit 桌面外壳）：

| 区域 | 位置 | 功能 | 说明 |
|------|------|------|------|
| 标题栏 | top | sync 状态+窗口控制 | ArcOrbit 外壳 |
| 侧边栏 | left | 主导航 | Today/Feedback/Work/Drafts/Organization |
| 命令栏 | top | 面包屑+项目切换+新建 | 项目隔离 |
| 主内容区 | center | 视图分发 | today/feedback/work/drafts/org 五视图 |

### 3.2 组件说明

| 组件名 | 类型 | 说明 | 状态列表 |
|--------|------|------|---------|
| im-bubble | 气泡 | IM 消息，客服左/客户右 | 客服/客户/系统/连续 |
| sdk-summary-card | 卡片 | 结构化结果整理确认 | 待确认/编辑中 |
| feedback-list-item | 列表项 | 反馈条目 | 待判断/已流转/已忽略 |
| task-row | 树行 | Linear 风格任务树 | 7 态+优先级+子进度 |
| state-marker | 圆点 | 任务状态色点 | 7 色 |
| delivery-track | 步进 | 交付轨道 | 完成/进行中/待开始 |
| todo-badge | 角标 | 待建项标注 | — |
| knowledge-source-row | 表行 | 知识源状态 | 已同步/索引中/未同步 |
| retrieval-result | 卡片 | 检索命中来源+置信度（新增） | 命中/未命中/低置信 |

### 3.3 样式规范

全部复用 ArcOrbit Desktop token，不在原型内重定义：

| 规范项 | 规范值 | 说明 |
|--------|--------|------|
| 主色调 | --violet-600 #5c55e6 | 品牌/激活/主按钮 |
| 文字色 | --ink-900 ~ --ink-400 | 标题到次要文字 |
| 字号 | 28/20/16/15/14/13/12/11 | display→micro |
| 间距单位 | 4px 基准 | row-compact 40/row-default 44 |
| 圆角 | sm 6/md 10/lg 16 | |
| 阴影 | --shadow-sm/--shadow-lg | |
| 字体 | Inter, -apple-system, PingFang SC | |

### 3.4 响应式设计

| 断点 | 宽度范围 | 布局变化 |
|------|---------|---------|
| SDK 客户端 | ≤760 | 单列 IM，覆盖 ArcOrbit min-width:1100 |
| 工作台 | ≥1100 | 标准 sidebar+stage 桌面布局 |
| 工作台窄 | <760 | 降级（试点不做移动端适配） |

---

## 4. 交互流程

### 4.1 主流程

```
[客户] 打开 SDK 对话
  ↓
[智能客服] 追问收集(位置/现象/期望)
  ↓
[判断] 信息完整?
  ↓ [是]                    ↓ [否]
[呈现结构化结果]          [继续追问]
  ↓                          ↓
[客户确认提交]            [客户补充]
  ↓
[创建 Feedback, triage=pending]
  ↓
[内部] 分诊决策(role门控)
  ↓ [做]                   ↓ [不做]
[ConvertFeedbackToTask]   [triage=ignored,回复说明]
  ↓
[workspace 绑客户代码目录]
  ↓
[Task→Case, Codex loop 自主开发]
  ↓
[Git 收尾 + 构建产物]
  ↓
[进展草稿 → 处理人确认 → 发客户]
  ↓
[验收 accept → artifact_url 回写]
  ↓
[客户收到交付完成 + 产物指向]
```

**流程说明**:
1. 智能客服检索辅助人工，未命中转追问收集
2. 分诊门控试点期 role 兜底
3. Codex loop 接需求目标后自主开发到达成，是核心验证目标
4. 产物交付而非部署

### 4.2 异常分支

| 异常场景 | 触发条件 | 处理方式 | 用户提示 |
|---------|---------|---------|---------|
| 知识库检索超时 | 检索服务 >10s | 降级追问收集 | "我先帮你记录下来转团队跟进" |
| 越权分诊 | member 角色 triage | 403 | "需要项目管理员确认" |
| Task 无 executor | pending 未认领 | 不进 loop，待认领 | 工作台"待认领" |
| Codex loop 阻塞 | Gap 长期无 transition | blocked 态，人工介入 | 工作台"已阻塞" |
| 构建失败 | 产物构建失败 | 不回写 artifact_url，退回 in_progress | 内部可见"构建失败，退回处理" |
| steer 无活跃 Case | 用户询问但无绑定 Case | 走人工回复兜底 | 客户无感，人工回复 |

### 4.3 状态机

| 对象 | 状态列表 | 状态转换触发条件 |
|------|---------|---------------|
| Feedback | pending→accepted→converted→in_progress→completed→released / ignored | 分诊/转任务/Task回写/交付 |
| Task | pending_review→pending→in_progress→completed→pending_review(待验收)→accepted / cancelled/blocked | confirm/claim/loop达成/submit/accept/reject/block |
| 草稿 | pending_review→sent | 处理人确认发送 |
| 交付 | step1→step4(已验收→构建→冒烟→客户确认) | orgDeliver 推进 |

**状态转换图**:
```
Feedback: pending --分诊--> accepted/ignored --转任务--> converted --Task--> in_progress --Task accepted--> completed --交付回写--> released
Task: pending_review --confirm--> pending --claim--> in_progress --loop达成--> completed --submit--> pending_review --accept--> accepted
草稿: pending_review --确认--> sent
```

---

## 5. 接口定义

### 5.1 提交反馈（V2，已有扩展）

**方法**: `POST`
**路径**: `/api/v1/projects/{projectId}/feedbacks`
**描述**: SDK 提交结构化反馈
**鉴权**: API Key / Bearer Token

**请求体**:
```json
{
  "content": "string",
  "custom_user_id": "string",
  "data": { "priority": "P2", "structured": { "position": "", "phenomenon": "", "expect": "" } },
  "attachments": []
}
```

**响应示例（成功）**:
```json
{ "code": 0, "data": { "id": 830141, "short_id": "FB-830141", "status": "pending" }, "message": "success" }
```

---

### 5.2 智能客服检索（待建）

**方法**: `POST`
**路径**: `/api/v1/projects/{projectId}/feedbacks/retrieve`
**描述**: 两层知识库检索，返回命中来源与置信度
**鉴权**: Bearer Token

**请求体**:
```json
{ "query": "string", "conversation_id": "string" }
```

**响应示例**:
```json
{
  "code": 0,
  "data": {
    "hits": [
      { "source": "customer_lib", "type": "code", "title": "模块X", "snippet": "...", "score": 0.82 },
      { "source": "product_lib", "type": "faq", "title": "如何登录", "snippet": "...", "score": 0.75 }
    ],
    "confidence": 0.82,
    "draft_reply": "...",
    "need_collect": false
  }
}
```

**错误码**:
| 错误码 | HTTP状态 | 含义 | 处理建议 |
|--------|---------|------|---------|
| 0 | 200 | 成功 | - |
| 40301 | 403 | 无权限 | 联系管理员 |
| 50001 | 500 | 检索服务异常 | 降级追问收集 |

---

### 5.3 转为开发任务（已有）

**方法**: `POST`
**路径**: `/api/v1/projects/{projectId}/feedbacks/{feedbackId}/convert`
**描述**: 分诊决策转 Task
**鉴权**: Bearer Token（role 门控）

**请求体**:
```json
{ "title": "string", "executor_id": 0, "priority": "P2" }
```

**响应示例**:
```json
{ "code": 0, "data": { "task_id": 198, "feedback_status": "converted" }, "message": "success" }
```

---

### 5.4 产物交付回写（待建）

**方法**: `POST`
**路径**: `/api/v1/projects/{projectId}/tasks/{taskId}/artifact`
**描述**: 构建产物地址回写
**鉴权**: Bearer Token

**请求体**:
```json
{ "artifact_url": "string", "build_id": "string" }
```

**响应示例**:
```json
{ "code": 0, "data": { "task_id": 200, "feedback_status": "completed" }, "message": "success" }
```

---

## 6. 数据模型

### 6.1 TypeScript 接口定义

```typescript
// 反馈 — 对齐 services/workshop-api/models/feedback.go
interface Feedback {
  id: number;
  project_id: number;
  short_id: string;
  title: string;
  content: string;
  status: FeedbackStatus;
  triage_status: TriageStatus;
  type: FeedbackType;
  input_mode: 'dialog' | 'form';
  custom_user_id: string;
  user_email: string | null;
  data: { priority: Priority; structured: StructuredInfo };
  last_message_at: number;
  last_customer_message_at: number;
  hasPendingProgress: boolean;
}

enum FeedbackStatus {
  PENDING = 'pending', ACCEPTED = 'accepted', CONVERTED = 'converted',
  IN_PROGRESS = 'in_progress', COMPLETED = 'completed',
  IGNORED = 'ignored', RELEASED = 'released',
}
enum TriageStatus { PENDING = 'pending', ACCEPTED = 'accepted', IGNORED = 'ignored' }
enum FeedbackType { ISSUE = 'issue', SUGGESTION = 'suggestion', QUESTION = 'question', CONSULTATION = 'consultation' }

interface StructuredInfo { position: string; phenomenon: string; expect: string }

// Task — 对齐 models/task.go
interface Task {
  id: number; project_id: number; father_id: number | null;
  content: string; state: TaskState;
  executor_id: number | null; creator_id: number;
  priority: number; tags: string;
  source_feedback_id: number | null;
  artifact_url?: string;       // 新增：产物交付回写
  created_at: number;
}
enum TaskState {
  PENDING_REVIEW = 'pending_review', PENDING = 'pending', IN_PROGRESS = 'in_progress',
  COMPLETED = 'completed', ACCEPTED = 'accepted', CANCELLED = 'cancelled', BLOCKED = 'blocked',
}

// FeedbackMessage — 对齐 models/feedback_workflow.go
interface FeedbackMessage {
  id: number; feedback_id: number;
  sender_type: 'customer' | 'developer' | 'system';
  content: string; metadata: Record<string, unknown>;
  attachments: Attachment[]; created_at: number;
}

// FeedbackTaskLink
interface FeedbackTaskLink {
  feedback_id: number; task_id: number;
  relation_type: 'converted_to' | 'related' | 'duplicate';
  is_primary: boolean; created_by: number;
}

// 草稿（桥2）— 基于 FeedbackMessage(sender_type=system) 扩展
interface Draft {
  id: number; project_id: number; feedback_id: number; task_id: number;
  state: 'pending_review' | 'sent';
  content: string; created_at: number;
}

// 检索结果（新增，智能客服）
interface RetrievalHit {
  source: 'customer_lib' | 'product_lib';
  type: 'code' | 'doc' | 'faq';
  title: string; snippet: string; score: number;
}

// 知识源
interface KnowledgeSource {
  id: number; project_id: number | null;
  name: string; type: '代码仓库' | '项目文档' | 'FAQ' | '公共知识';
  status: '已同步' | '索引中' | '未同步';
  scope: 'project' | 'public';
}

// 交付轨道
interface Delivery { task_id: number; step: number; feedback_id: number | null }
```

### 6.2 字段说明

| 字段名 | 类型 | 必填 | 说明 | 约束 |
|--------|------|------|------|------|
| id | number | 是 | 唯一标识 | 自增 |
| status | enum | 是 | 反馈状态 | 7 态 |
| triage_status | enum | 是 | 分诊状态 | 3 态 |
| type | enum | 是 | 反馈类型 | issue/suggestion/question/consultation |
| artifact_url | string | 否 | 产物地址 | accept 后回写 |
| source_feedback_id | number | 否 | Task 来源反馈 | 桥1 追溯 |
| confidence | number | 否 | 检索置信度 | 0-1 |

### 6.3 ERD

```
Feedback 1 --- N FeedbackMessage
  |
  1
  |
  N
FeedbackTaskLink N --- 1 Task
                      |
                      1
                      |
                      N
                   (source_feedback_id 回溯)
```

**关系说明**:
| 关系 | 类型 | 说明 |
|------|------|------|
| Feedback → FeedbackMessage | 一对多 | 对话记录 |
| Feedback ↔ Task | 多对多 | 经 FeedbackTaskLink，relation_type=converted_to |
| Task → artifact_url | 一对一 | accept 后回写 |

---

## 7. 验收标准

### 7.1 功能验收

| 场景ID | 验收场景 | 前置条件 | 测试数据 | 操作步骤 | 预期结果 | 优先级 |
|--------|---------|---------|---------|---------|---------|--------|
| AC-F01 | 对话反馈提交 | SDK 已嵌入配置 | "自定义模块报错" | 1.打开SDK 2.描述问题 3.追问补充 4.确认 | 生成 FB 编号，status=pending | P0 |
| AC-F02 | 我的反馈查看 | 已有反馈 | FB-830141 | 1.切我的反馈 2.点条目 | 显示状态时间线+最新进展 | P0 |
| AC-F03 | 分诊转任务 | FB 待判断 | FB-830141 | 1.选反馈 2.转任务 3.指派 | 生成 TASK，FB=converted | P0 |
| AC-F04 | 越权分诊 | member 账号 | FB | member 调 convert | 403 拒绝 | P0 |
| AC-F05 | 认领进 loop | TASK pending | TASK-195 | 1.认领 | state=in_progress，进 Codex 线程 | P0 |
| AC-F06 | 进展草稿确认 | closeout 完成 | 草稿 | 1.编辑 2.确认发送 | 客户收到，FB=有进展 | P0 |
| AC-F07 | 验收+产物交付 | TASK 待验收 | TASK-200 | 1.通过 2.构建 | artifact_url 回写，FB=completed | P0 |
| AC-F08 | 智能客服检索 | 知识库已索引 | "如何登录" | 1.提问 | 命中产品库，草稿+来源标注 | P1 |
| AC-F09 | steer 追问 | 活跃 Case | 客户追问 | 1.发送询问 | 同 feedback_id 注入，生成草稿 | P1 |
| AC-F10 | 知识库管理 | 管理员 | 代码仓库 | 1.查看状态 2.重建索引 | 状态更新，可检索测试 | P1 |

### 7.2 性能验收

| 指标 | 目标值 | 测试方法 |
|-----|--------|---------|
| SDK 首屏加载 | <2s（P95） | Lighthouse |
| 反馈提交响应 | <500ms（P99） | 压测 |
| 知识库检索 P95 | <2s | 压测 |
| Codex loop Gap 推进 | 视目标复杂度 | 端到端时序 |

### 7.3 安全验收

| 检查项 | 验收标准 |
|--------|--------|
| 鉴权 | 未登录访问受保护接口返回 401 |
| 分诊权限 | member 角色调 triage 返回 403 |
| 项目隔离 | 跨项目访问反馈/任务返回 403 |
| 知识库隔离 | 客户私有库跨客户检索返回空/403 |

### 7.4 兼容性验收

| 环境 | 要求 |
|------|------|
| 浏览器（SDK） | Chrome 90+、Safari 14+、Edge 90+ |
| 桌面端（工作台） | macOS 12+、Windows 10+（Electron） |
| 屏幕分辨率 | 1280×720+（工作台）/760+（SDK） |

---

## 8. 非功能需求

### 8.1 性能

| 指标 | 目标值 | 测量周期 | 监控工具 |
|-----|--------|---------|---------|
| SDK FCP | <1.5s（P75） | 实时 | Lighthouse |
| 反馈接口 P95 | <500ms | 实时 | Prometheus |
| 检索 P95 | <2s | 实时 | Prometheus |
| Codex loop | 端到端可达成 | 每次 | loop receipt |

### 8.2 可用性

| 指标 | 目标值 | 备注 |
|-----|--------|------|
| 系统可用性 | >99%（试点） | 单客户可接受 |
| 检索降级 | 超时转追问收集 | 不阻断 |
| loop 阻塞恢复 | 人工介入 | blocked 态 |

### 8.3 安全

- [ ] API 鉴权中间件保护
- [ ] 分诊 role 门控（试点兜底）
- [ ] 客户私有库按项目隔离
- [ ] 产物 artifact_url 不泄露内部路径
- [ ] 操作审计日志留存

### 8.4 可扩展性

| 维度 | 目标 | 实现方式 |
|------|------|---------|
| 水平扩展 | workshop-api 无状态水平扩展 | 现有架构 |
| 多客户 | 试点单客户，下期多租户 | 项目隔离边界已就绪 |
| 知识库 | 每客户独立索引 | WeKnora workspace + 代码检索独立选型 |

### 8.5 可维护性

| 维度 | 要求 |
|------|------|
| 代码覆盖率 | 核心逻辑 >80% |
| 日志 | 分诊/loop/交付关键节点完整记录 |
| 文档 | 本 PRD + 时序图 + orchestration-plan 三份配套 |
| 监控 | 反馈/任务/检索核心指标 |

---

## 附录

### 附录A：术语表

| 术语 | 定义 |
|-----|------|
| arc | Arckit 协议层 + 产品，核心是需求开发 loop |
| 开发 loop | coding agent 接需求目标后自主开发到达成的 Case/Gap 推进 |
| 桥1 | Task→Case，Gap.derived_from 加受控来源 |
| 桥2 | closeout→进展草稿→人工确认→发客户 |
| 桥3 | 用户询问→steer 注入同一线程（硬关联门控） |
| 产物交付 | 构建产物 artifact_url 回写，部署不在本期 |
| 两层知识库 | 客户私有库（代码+文档）+ 共享产品库（facts+FAQ） |

### 附录B：外围系统依赖

| 系统名称 | 依赖关系 | 接口/SDK | 负责人 | SLA |
|---------|---------|---------|--------|-----|
| WeKnora | 文档知识库承载 | REST API | Arckit | 检索 P95<2s |
| 代码语义检索 | 代码仓库问答（独立选型） | 待定 | Arckit | 待定 |
| 构建产物 | 本地打包 | 待定/人工 | Arckit | 试点人工 |

### 附录C：待决策事项

| 事项ID | 事项描述 | 备选方案 | 决策人 | 期限 | 状态 |
|--------|---------|---------|--------|------|------|
| Q-01 | 代码语义检索选型 | 自建/Sourcegraph类/LSC | Arckit | 步骤5前 | ⏳待决策 |
| Q-02 | 产物构建是否走线上打包平台 | 人工/对接打包平台 | Arckit | 下期 | ⏳待决策 |
| Q-03 | 置信度阈值标定方法 | 人工拍/标注集回测 | Arckit | 下期 | ⏳待决策 |
| Q-04 | capabilities 是否本期建 | 不建(role兜底)/建 | Arckit | — | ✅已决策：不建 |

### 附录D：变更历史

| 版本 | 日期 | 变更内容 | 变更人 | 审核人 |
|-----|------|---------|--------|--------|
| v1.0 | 2026-09-08 | 初始版本，基于代码核实基线+确定的产品定位 | Arckit | — |
