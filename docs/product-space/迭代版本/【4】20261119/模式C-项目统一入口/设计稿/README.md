# 模式C · 项目统一入口 · 交互设计稿

打开 [project-panel.html](project-panel.html)。单文件、零依赖、双击可开，无需构建、网络或后端依赖。本稿复刻 ArcOrbit 桌面端真实外壳（与模式A squeeze-flow 同源 style/sprite），覆盖已拍板的 7 项决策：**单入口导航、可逆双工作区、积压=挤压区推广、同一套沟通空间+多数决、显性立项动作、三数据来源、完整规则编辑器**。

背景示例：3 个种子项目——P-01「云协作 · 导出权限」（面板管理）、P-02「智能填单助手」（idea 阶段，本稿主链路）、P-03「数据看板重构」（面板管理）。

## 已拍板的 7 项决策（不可回退）

| # | 决策 | 稿内落点 |
| --- | --- | --- |
| 1 | **可逆双工作区**：idea 阶段 ↔ 面板管理可随时切换，卡片与规则在切换中保留 | idea 页头「回到 idea 阶段探讨」/ 面板页头「回到 idea 阶段探讨」；事件 `phase.changed` |
| 2 | **积压 = 挤压区推广**：面板唯一「待讨论」状态段，不进七态计数 | 控制轨首位 chip「积压」，八 chip（积压 + 七态），七态和与积压互斥；摘要文案「面板状态段，不进七态计数」 |
| 3 | **idea 讨论 = 同一套沟通空间 + 多数决**：宿主为项目对象 | idea 页「项目沟通空间」常驻内联（无门槛，创建即 opened）；卡片讨论走 `#reviewSlide`（有门槛）；同一 `buildDiscussionBody` 渲染 |
| 4 | **自动化 = 完整规则编辑器**（从零建） | 面板「自动化规则」子页：规则列表（启停开关 + 触发→动作 + 已触发次数）+ 新建表单（名称/触发条件/执行动作） |
| 5 | **单入口 + 阶段 tab**：合并 Product + Idea | 左侧栏仅一个「项目」入口（计数 = 项目总数）；列表页「idea 阶段 / 面板管理」两个 tab 过滤 |
| 6 | **数据来源三选**：Workshop 任务源 / GitHub Issues / Feedback | 面板顶部 `#sourceStrip` 三张来源卡：接入/同步/反馈进积压 |
| 7 | **显性立项动作**：结论通过 → 点立项 → 首批卡片进积压 + 补配仓库 → 转面板阶段 | idea 侧栏「立项动作」卡：结论前禁用并解释；通过后展示 3 张拆解草稿 +「立项 → 进入面板管理」→ 立项确认弹层（4 项 checklist） |

## 界面结构（复刻真实外壳）

- **左侧栏**：12 项主导航，**仅「项目」一项可用**（`data-page="project"`），无 Product / Idea 独立入口。
- **列表页**（`#projectListView`）：控制轨（阶段 tab「idea 阶段 / 面板管理」+ 搜索 + 创建项目）+ 项目卡片网格（阶段 pill、成员头像栈、卡片数、讨论徽标）。
- **idea 工作区**（`#projectIdeaView`）：头部（返回 / 项目名 / 阶段 pill / 立项按钮）+ 左「项目沟通空间」（参与者头像栈 + 添加成员选择器 + 议题/观点/草案投票/结论/摘要，内联常驻）+ 右「项目上下文与立项」（阶段/仓库/来源/成员事实 + 立项动作卡）。
- **面板工作区**（`#projectPanelView`）：头部（返回 / 项目名 / 阶段 pill / 回到 idea）+ 子页切换「卡片面板 / 自动化规则」；卡片面板 = 来源卡 strip + 控制轨（八 chip + 搜索）+ 卡片表 + 右详情（来源引用 / 讨论门槛+搁置 / 摘要 / 拆解草稿 / **全状态机流转** / 风险确认 / Agent 提问条）；规则子页 = 规则列表（启停 + 已触发次数）+ 新建表单。
- **立项确认弹层** `#solidifyModal`：4 项 checklist（阶段迁移 / 补配仓库 / 首批卡片 / 数据来源）。
- **创建项目弹层** `#createProjectModal`：**阶段单选**（idea 阶段默认 / 面板管理阶段），选面板管理才显示仓库字段。
- **沟通空间**：idea 页内联；卡片讨论复用 `#reviewSlide` 侧滑（640px，与模式A 同构）。
- **评审路径浮层** `#reviewPath`：身份切换（王珂/林晓/Agent）、模拟 Agent 提问、重置演示、出站事件日志（`project_events` 契约）。

## 立项主链路（P-02 智能填单助手）

1. 列表默认 **idea 阶段 tab**：仅 P-02；导航「项目」计数 3。
2. 打开 P-02 → idea 工作区：沟通空间已 opened、参与者 [王珂]、Agent 初步分析、立项按钮**禁用**（无结论）。
3. 切 **林晓** → 「加入讨论」→ 分母 2；切回王珂 →「＋ 添加成员」→ 成员选择器（4 人，王珂/林晓禁用「已参与」）→ 选**陈默** → 分母 3。
4. 切 **Agent**：无起草/投票/添加按钮，仍可发观点；切回王珂。
5. 王珂**起草结论草案** → 自动赞成 **1/3**，未过半，无通过按钮。
6. 切林晓 → **投赞成** → **2/3** 过半 →「**通过结论**」→ 结论生效：侧栏立项卡解锁、3 张拆解草稿出现、事件 `discussion.approved`。
7. 等约 1 秒 → **Agent 过程摘要**生成（不阻塞）。
8. 点「**立项**」→ 确认弹层（4 项 checklist）→「确认立项」→ 转**面板管理阶段**：阶段 pill 变化、3 张草稿卡进**积压**、Workshop 任务源自动接入、切入面板视图、事件 `project.solidified`。
9. 面板验证：积压 chip = 3、七态和 = 0、摘要文案「不进七态计数」；接入 GitHub → 同步 1 条 Issue 进积压；「反馈进入积压」→ 新卡 C-FB111。
10. **可逆**：「回到 idea 阶段探讨」→ 阶段 pill 回 idea、草稿保留、事件 `phase.changed`；再次立项 → **不重复生成卡片**（去重，事件「新增 0 张」）。

## 卡片面（P-01 云协作 · 导出权限）

11. 列表切**面板管理 tab** → 打开 P-01：八 chip（积压 = 2，**七态和 = 4**，互斥）、三来源均已接入；卡片详情「来源引用」行展示 `Workshop/GitHub/Feedback · 引用号`。
12. 选 C-201（未讨论）→ 详情**只有讨论门槛** →「开启讨论」→ 沟通空间打开（Agent 初步分析、`discussion.opened`）；切林晓「加入讨论」→ 关闭；可「搁置讨论」/「取消搁置」（`discussion.shelved`，搁置暂停起草/投票/通过）。
13. **全状态机流转**（积压 + 七态全覆盖，chip 跟随）：进入待办 → 开始执行 → 提交评审 → 评审通过 / 打回修改 → 验收（终态）；标记阻塞 → 解除阻塞；任意非终态可取消（accepted/cancelled 为终态无动作）。已开启讨论 →「开始执行/验收」**不弹风险**。
14. 切回积压 chip → 选 C-202（未讨论）→「开始执行」→ 弹「**未经讨论决策**」风险确认 → 返回不变 / 「仍要执行」→ in_progress；未讨论「验收」同理弹风险（按钮「仍要验收」）。
15. 「模拟 Agent 提问」→ 详情 attention 条 → 回复关闭（`attention.answered`）→ 回沟通空间可见回复。
16. 切「自动化规则」子页：3 条种子规则、启停开关（R-03 启用 → `rule.enabled`）、新建规则（→ 4 条，`rule.created`）；回卡片面「反馈进入积压」→ 匹配触发条件的规则真实执行（`rule.fired`，「已触发 N 次」累计）。
17. 「重置演示」→ 全部复位。

## 升级落点表（本稿交互 ↔ 现状真实组件）

| 稿内交互 | 升级内容 | 现状组件 | 落点端 |
| --- | --- | --- | --- |
| 单入口「项目」+ 阶段 tab | 合并 Product + Idea 导航（同源 products.json 按 kind 过滤） | `index.html` 导航两项；`product-surface.mjs:101` | Web + 桌面 |
| 可逆双工作区 | 项目增加 `phase` 字段（idea/panel），显式迁移事件 | `project.go:38` 无 phase（新增）；`recordProjectEvent` | 服务端 + 两端 |
| 积压状态段 | 面板独立 chip，**不进七态计数**（同模式A 挤压区语义推广到全卡片） | 桌面七态 chips；`TasksPage` 分组 | Web + 桌面 |
| idea 常驻沟通空间 | 宿主 = 项目对象，创建即 opened，无门槛 | 新 discussion 宿主；渲染同模式A `CommentSection` 升格 | 服务端 + 两端 |
| 显性立项动作 | 结论通过 → checklist 确认 → 首批卡片进积压 + 补配仓库 + 转 phase | 新 `project.solidified` 事件；`task.subtask.create` 同款 | 服务端 + 两端 |
| 数据来源 strip | Workshop / GitHub / Feedback 接入态 + 同步进积压 | `feedback_task_links`、`ConvertFeedbackToTask` zone 变体；GitHub 同步新增 | 服务端 |
| 规则编辑器 | 项目级「触发 → 动作」CRUD + 启停 + **事件真实触发**（进积压/反馈/状态变更/结论通过 → `rule.fired`） | `automation-coordinator.buildPendingCandidates`（执行段既有）；规则元数据新增 | 服务端 + 桌面 |
| 全状态机流转 | 积压 + 七态完整动作：进入待办/开始执行/提交评审/评审通过/打回/验收/阻塞/解除/取消；执行与验收未讨论走风险门禁 | 桌面 Work 七态 chips + `PUT /tasks/:id` 状态机；`TasksPage` | Web + 桌面 |
| 来源引用深链 | 卡片事实表「来源引用」行（FB-*/#N/T-*） | `feedback_task_links`、GitHub issue 号、Workshop task id | 服务端 + 两端 |
| 搁置讨论 | 沟通空间「搁置/取消搁置」，暂停起草投票，徽标「已搁置」 | 模式A 已有 `shelve` 同语义 | 同模式A |
| 卡片讨论（复用模式A） | 门槛 / 摘要 / 沟通空间 / 多数决 / 风险门禁 / 提问 | 同模式A 落点表（§升级落点表） | 同模式A |

## 出站事件（`project_events` 契约，稿内事件日志实时可见）

`project.created`、`project.solidified`、`phase.changed`、`discussion.opened`、`discussion.shelved`、`discussion.unshelved`、`agent.preliminary_analysis`、`participant.added`、`participant.joined`、`proposal.created`、`vote.cast`、`discussion.approved`、`discussion.summary_generated`、`card.backlog_entered`、`source.connected`、`rule.created`、`rule.enabled`、`rule.disabled`、`rule.fired`、`task.state_changed`、`agent.question_raised`、`attention.answered`、`member.opinion_added`、`agent.opinion_added`。

## 边界

- 全部为本地模拟，不连接后端/模型；投票、通知、摘要生成、GitHub 同步为交互触发 + 定时模拟。
- 本稿复刻桌面端外壳与类名（与模式A 同源 CSS），Web 落地按落点表分端实现。
- 日期基准 2026-11-19；刷新即重置；引导在默认折叠的 `#reviewPath`。
- 只覆盖模式C 项目统一入口；卡片讨论的站内挤压区链路见 [../../模式A-平台内使用/](../../模式A-平台内使用/)；外部集成见 [../../模式B-PaaS数据驱动/](../../模式B-PaaS数据驱动/)。
- 方案文档 `../项目统一入口方案.md` 待设计稿评审通过后补写。

## 验证记录

2026-11-19（初版 187 项 + 全链路补强）：jsdom 无头冒烟 **221 项全部通过**（`smoke5.js`），运行时无脚本错误、JS 语法 OK、无代码注释。覆盖 18 段：结构与单入口 → 创建弹层 → P-02 idea 工作区 → 加入讨论/成员选择器 → Agent 权限 → 起草/投票/显性通过 → 摘要异步 → 立项 checklist + `project.solidified` → 三来源 → 可逆回 idea + 再立项去重 → P-01 八 chip → 讨论门槛 + 沟通空间 → 进入待办/开始执行 → 未讨论执行风险确认 → Agent 提问回复 → 规则列表/启停/新建 → **全状态机（提交评审/评审通过/打回/验收终态/未讨论验收风险/解除阻塞/取消终态）** → **来源引用行 + 搁置讨论 + `rule.fired` 真实触发** → 重置复位。
