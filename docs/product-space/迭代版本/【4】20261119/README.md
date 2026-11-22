# 【4】反馈挤压区与卡片讨论：项目-待办-自动化升级（三模式）

迭代日期：2026-11-19。状态：方案与交互设计稿评审阶段，尚未工程实现。

本迭代按使用方式拆分为三个独立目录管理，共享模型收敛在本文件，避免各模式互相混淆：

| 模式 | 目录 | 面向对象 | 一句话定位 |
| --- | --- | --- | --- |
| 模式A · 平台内使用 | [模式A-平台内使用/](模式A-平台内使用/) | 平台第一方用户（团队成员 + Agent），覆盖 Web 与 ArcOrbit 桌面端 | 反馈作为待办的一个渠道进入「挤压区」，围绕卡片讨论决策后进入待办，由既有自动化链路领取与执行 |
| 模式B · PaaS 数据驱动 | [模式B-PaaS数据驱动/](模式B-PaaS数据驱动/) | 不使用平台 UI 的外部系统 | 平台作为 PaaS：外部系统通过 API 读写、Webhook 事件订阅、Agent 能力调用实现自己的数据驱动 |
| 模式C · 项目统一入口 | [模式C-项目统一入口/](模式C-项目统一入口/) | 平台第一方用户（项目维度） | 合并 Product + Idea 为单入口，项目按「idea 阶段 ↔ 面板管理」可逆双工作区推进：idea 常驻沟通空间多数决 → 显性立项 → 面板积压（挤压区推广）+ 三数据来源 + 项目级规则编辑器 |

## 文档清单

- [模式A-平台内使用/平台内交互方案.md](模式A-平台内使用/平台内交互方案.md)：**基于现状真实组件链路的升级方案**——现状盘点（含桌面端）、差距诊断、P0/P1/P2 升级项（每项标注现状组件与落点端）。
- [模式A-平台内使用/设计稿/README.md](模式A-平台内使用/设计稿/README.md)：站内全链路点击评审路径 + 升级落点表。
- [模式A-平台内使用/设计稿/squeeze-flow.html](模式A-平台内使用/设计稿/squeeze-flow.html)：可交互原型，浏览器直接打开，零依赖。
- [模式B-PaaS数据驱动/PaaS集成方案.md](模式B-PaaS数据驱动/PaaS集成方案.md)：基于既有 `project_events`/realtime 管道的 L1/L2/L3 升级、事件契约与落地拆分。
- [模式B-PaaS数据驱动/设计稿/README.md](模式B-PaaS数据驱动/设计稿/README.md)：外部集成点击评审路径。
- [模式B-PaaS数据驱动/设计稿/paas-integration.html](模式B-PaaS数据驱动/设计稿/paas-integration.html)：可交互原型，外部系统视角（订阅 → 事件日志 → API 调试 → BI 看板）。
- [模式C-项目统一入口/设计稿/README.md](模式C-项目统一入口/设计稿/README.md)：7 项拍板决策 + 立项主链路评审路径 + 升级落点表。
- [模式C-项目统一入口/设计稿/project-panel.html](模式C-项目统一入口/设计稿/project-panel.html)：可交互原型，浏览器直接打开，零依赖（单入口导航 / 可逆双工作区 / 立项 / 积压 / 来源 / 规则编辑器）。
- `模式C-项目统一入口/项目统一入口方案.md`：**待设计稿评审通过后补写**。

## 背景

现状「反馈 → 人工流转为待办」是一次性直线：反馈受理后由成员手动点流转，团队没有围绕「这个需求值不值得做」的公开讨论场；面板上看不到哪些事正在被积压挤压；自动化只覆盖执行段；反馈会话与待办评论是两个割裂的沟通平面。桌面端（ArcOrbit）已有完整的自动化队列、人工介入与恢复原语，但与卡片讨论平面互不相通。

本迭代把直线改为分层漏斗——**每一环都落在现有组件上做升级，不新造平行系统**：

```
反馈（渠道）→ 挤压区（待讨论卡片池）→ 卡片讨论（人 + Agent）→ 决策通过 → 待办状态段
     → 既有自动化队列领取/执行（buildPendingCandidates）→ 既有 attention 原语承载 Agent 提问 → 完成回写反馈
```

同时明确第二种使用方式：外部系统不打开平台 UI，平台以 PaaS 形态提供数据与能力支撑，外部自行完成数据驱动。

## 现状链路（真实组件，两模式共同的事实基线）

| 环节 | Web 端 | ArcOrbit 桌面端 | 服务端 |
| --- | --- | --- | --- |
| 反馈受理 | `feedback-console` `FeedbackManagementDialog` | Feedback 页 `renderPlatformFeedback`，详情自动触发 AI 分诊 `ensureFeedbackTriage` | `POST /feedbacks/:id/triage`、`feedbacks.data.triage` |
| 反馈→待办 | 行内「流转为待办」→ `CreateTaskDialog` | `platform-coordinator` action `feedback.to_task` | `ConvertFeedbackToTask` → `feedback_task_links` + `Task.source_feedback_id` |
| 待办面板 | `todo-web` `TasksPage`（按项目分组 + 七态筛选）、`ProjectDetailPage` | Work 页：七状态 chips 计数 + 单状态表格 + 详情 Inspector（`renderPlatformWork`/`renderTaskDetail`），数据走本地投影 `queryWork` | `GET /tasks`、`/tasks/tree`、`project_events` |
| 卡片讨论 | 抽屉 `TaskDetailContent` + `CommentSection`（复用 `task.attachments`） | 详情「评论与附件时间线」`task-comment-panel` | `POST /tasks/attachments`（type=text） |
| 自动化准入 | — | `automation-coordinator.buildPendingCandidates`：**仅 `pending` ∧ 本地绑定 ∧ 项目参与**；lane 同工作区串行；领取 = `updateTaskState(expectedState)` 乐观并发 | `PUT /tasks/:id` |
| Agent 执行上下文 | — | `buildAutomationTask` **只取 `task.content/title`** + Arckit ledger/Case 快照；**不读评论/附件**；轮间上下文压缩（≥0.8） | — |
| 人工介入 | — | `attention_items`（`human_decision` 带 `question`）→ `attention-strip` 条幅 → 介入工作台 `interventionComposer`；`recovery_items` → 恢复中心 | — |
| 通知/事件 | 项目 WS `GET /projects/:id/ws` + `GET /projects/:id/events`（`project_events` 事务内写入） | `arckit:automation-event` / `work-sync-event` IPC → 静默刷新 + 单条 toast + 导航徽标 | `recordProjectEvent`/`notifyProjectEvent` |

## 共享核心模型（两模式共同遵守，单点定义；均标注现状落点）

### 1. 挤压区（Squeeze Zone）＝ 积压（模式C 推广为面板唯一待讨论段）

- **面板状态段，不是第八种任务状态**。七态任务机保持不变；挤压区是面板上的独立分组/chip。
- **模式C 推广**：同一概念在项目面板里叫「积压」，仍是面板状态段、**不进七态计数**（八 chip = 积压 + 七态，两者互斥）；是三数据来源（Workshop / GitHub / Feedback）卡片的统一入口段。
- 落点：`todo-web` 面板分组；桌面 Work 页在七状态 chips 旁新增「挤压区」chip（计数同 `workNavCount` 模式）；数据由卡片讨论状态字段过滤，不改 `tasks.state`。
- 进入：反馈「进入挤压区」（`convert-to-task` 的 zone 变体，替代直接流转）、数据来源同步、立项首批拆解草稿；离开：决策通过 → 落 `pending_review`；搁置 → 留区标记；放弃 → 既有 `cancelled`/忽略链路。

### 2. 讨论状态徽标（挂在挤压区卡片上）

`讨论中 → 待决策 → 已通过 / 已搁置 / 提问中`。派生字段，不进任务状态机；渲染在 `TodoItem`/Work 表格行与详情头部。

### 3. 结构化讨论对象（Discussion）

三段式：**议题 Topic → 观点 Opinion（人/Agent，对应现有评论与反馈会话的发言）→ 结论 Decision（仅人）**。底层新表承载结构，渲染复用现有 `CommentSection` / `task-comment-panel` 时间线，不新造聊天组件。

### 4. 卡片上下文面板

项目名、`git_url`（Project 已有字段）、反馈来源深链（`source_feedback_id` 已有）、执行人、优先级、讨论结构摘要。落点：桌面 `renderTaskDetail` 属性事实表（已有本地工作区/自动执行资格行）与 Web 抽屉同步扩展。面板字段 = 模式B `GET /tasks/:id/context` 契约的可视化。

### 5. 自动化三触发点（全部挂既有链路）

| 触发点 | 升级动作 | 现状组件 |
| --- | --- | --- |
| ① 卡片进入挤压区 | Agent 预分析写入时间线系统事件 | `ensureFeedbackTriage` 同款模式（详情打开即触发、带失败闸门） |
| ② 决策结论通过 | Agent 拆解子任务草稿，人确认后落库 | `task.subtask.create` action 已有；`task.decomposed` 写 `project_events` |
| ③ 执行中遇阻 | Agent 提问回写卡片 + 通知 | **复用 `attention_items.human_decision.question` → `attention-strip` 条幅 + 介入工作台**，新增「回写卡片讨论区」与通知偏好，不新造提问系统 |

### 6. 讨论资产注入规则（与现状一致 + 一个显式增量）

- **现状**：`buildAutomationTask` 只取 `content/title`，评论/附件本就不进执行上下文——「讨论全文不主动注入」不是新约束，是既有事实，本迭代**保持**。
- **增量**：决策通过后，把**结论一行**（`decision.verdict`）显式附入 `continuationContext.original_task`，让执行中的 Agent 拿到决策边界；讨论全文仍不注入，仅人工显式引用才进入。
- 待办卡片仅显示讨论结构摘要；「查看完整过程」下钻（现有评论流 + 反馈会话深链）。

### 7. 事件契约清单（模式A交互原语 ↔ 模式B 出站事件，一一对应）

| 事件 | 触发时机 | 模式A 对应交互 | 现状事件管道 |
| --- | --- | --- | --- |
| `card.squeezed` | 卡片进入挤压区 | 反馈「进入挤压区」 | `project_events` + `task.created` |
| `discussion.opinion_added` | 新增观点（人/Agent） | 讨论发言 | `task_attachment.created` |
| `discussion.decided` | 结论产出 | 「标记决策结论」 | 新增，走 `recordProjectEvent` |
| `task.decomposed` | Agent 拆解完成 | 子任务树生成 | 新增 + `task.created` |
| `agent.question_raised` | Agent 主动提问 | 卡片提问条 + `attention-strip` | 现状 `automation.changed(awaiting-human)` 的卡片侧镜像 |
| `task.state_changed` | 七态跃迁 | 状态选择器 | `task.updated` |
| `project.solidified` | 显性立项（模式C） | 立项确认弹层通过 | 新增，走 `recordProjectEvent` |
| `phase.changed` | idea ↔ 面板管理可逆切换（模式C） | 页头阶段动作 | 新增，走 `recordProjectEvent` |
| `card.backlog_entered` | 卡片进入积压（模式C，来源同步/反馈/立项草稿） | 来源卡同步 / 反馈进积压 | `card.squeezed` 的面板全量版 |
| `source.connected` / `rule.created` / `rule.enabled` | 来源接入与规则编辑（模式C） | 来源卡 / 规则编辑器 | 新增，走 `recordProjectEvent` |

### 8. 模式C 项目统一入口（7 项拍板，不可回退）

1. **可逆双工作区**：项目增加 `phase`（idea / panel），两侧页头显式切换，卡片与规则在切换中保留（`phase.changed`）。
2. **积压 = 挤压区推广**：见 §1；面板唯一待讨论段，不进七态计数。
3. **idea 讨论 = 同一套沟通空间 + 多数决**：宿主为项目对象，创建即 opened（无卡片门槛）；卡片讨论仍走门槛 + `#reviewSlide`；渲染同一 `buildDiscussionBody`。
4. **自动化 = 完整规则编辑器**：项目级「触发条件 → 执行动作」从零建（列表启停 + 新建表单），执行段复用既有 `buildPendingCandidates`。
5. **单入口 + 阶段 tab**：导航合并 Product + Idea 为一个「项目」；列表按阶段 tab 过滤。
6. **数据来源本期三选**：Workshop 任务源 / GitHub Issues / Feedback，接入态 + 同步进积压。
7. **显性立项动作**：讨论结论通过 → 点「立项」→ checklist 确认 → 首批拆解草稿进积压 + 补配仓库 → 转面板阶段（`project.solidified`；重复立项去重不重复出卡）。

## 优先级

- P0（2–3 天，纯前端为主）：挤压区状态段（Web 分组 + 桌面 Work chip）、讨论徽标、卡片上下文面板扩展、讨论结构摘要与完整过程下钻（先用现有评论承载）；模式C 单入口导航与阶段 tab、积压 chip、立项动作（依赖 P1 的 phase 字段）。
- P1（3–5 天）：Discussion 落库与决策门禁、反馈「进入挤压区」入口（console + 桌面 Feedback 页 action）、决策通过落 `pending_review` + 事件广播；模式C `phase` 字段与 `project.solidified`/`phase.changed`、三数据来源接入、规则编辑器元数据。
- P2（需排期，依赖 P1）：状态衔接自动化（含 Work 详情「立即交给 ArcOrbit」暴露 `enqueueTask`）、Agent 拆解草稿确认、`attention.question` 打通卡片回写、`continuationContext` 附结论一行、项目自动化规则扩展。
