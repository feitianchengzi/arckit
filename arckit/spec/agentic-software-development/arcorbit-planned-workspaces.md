# ArcOrbit Chat 与计划工作空间能力规格


## 文档定位

本文定义 ArcOrbit 的真实 Chat、Operations 计划工作空间和 Engineering 内置 Skills 管理页面，并说明它们与现有 Today、Work、Automation、Feedback 和 Organization 的关系。

Chat 是由 Codex app-server 驱动的本地项目自由对话工作空间。Operations 是产品方向的可交互展示面，不因此宣称新的市场或监控平台已经接入。Engineering 真实管理 ArcOrbit 随包安装 Skills 的 Chat / Automation 使用方式，不管理用户自行安装的其他 Skills。

## 主导航信息架构

左侧主导航保留既有职责组并增加 Product 入口，并在英文界面中保持统一英文入口名：

1. `PERSONAL`：Today、Chat。
2. `PRODUCT`：Product。
3. `PRODUCT LIFECYCLE`：Idea、Work、Automation、Release、Operations、Feedback。
4. `ORGANIZATION`：Organization、Engineering。

中文语义分别为“个人”“产品全生命周期”“组织能力”。`发布` 在英文界面中显示为 `Release`，`运营` 显示为 `Operations`；同一界面不混用中英文入口名。

Today 仍是跨产品的今日推进摘要。Chat 位于 Today 下方，提供不依赖待办或 Case 的本地项目自由协作。

Idea 位于 Work 上方，作为产品全生命周期的起点。Work、Automation 和 Feedback 保留既有真实能力；Release 和 Operations 位于 Automation 与 Feedback 之间，表达研发完成后的发布与外部运营阶段。

Organization 保留组织治理职责。Engineering 位于其下方，是本机 ArcOrbit 内置 Skills 的安装后管理入口；组织级 Domain Profile 不属于当前能力。

## 统一工作空间边界

所有页面都满足以下边界：

- Chat 会话列表直接按本地 Product Workspace 分组，不要求先选择项目；新对话在首条消息发送前显式显示并允许切换目标工作区。没有可用本地工作区时保留草稿，但不启动对话。
- Chat 会话、消息、Codex thread 绑定和运行状态由 ArcOrbit 本地持久化，不写入 Workshop、Project State、Case 或 Automation queue。
- Chat 中的工具和文件操作继续受 Codex sandbox、workspace roots 与 approval policy 约束；Renderer 不获得 Codex 进程、凭据、文件系统或通用 RPC 权限。
- Operations 的标题、摘要、卡片、状态、时间线和动作可以使用可信的计划示例，帮助团队讨论目标形态。
- 计划示例优先来自 ArcOrbit 当前真实对象与约束，不虚构已接入的远端接口、权限或自动化结果。
- 未建立真实写入合约的计划动作以“计划动作”“示意”或不可用状态表达，不产生远端记录、Runtime Run、Project State transition 或发布授权。
- Chat 与 Idea、Work 等正式形态之间没有转换、关联或来源写入；自由对话只保留为独立 Chat 会话。
- Work、Automation、Feedback、Organization 和产品反馈中心的既有真实行为不因这些计划页面而改变。
- 顶部产品范围统一筛选 Chat 会话及新建可选工作区，单产品时继承归属；它不得改变自动领取资格、成员关系、状态真相源或发布授权。

## Chat

### 目标

Chat 是面向本地 Product Workspace 的自由 Codex 对话入口。用户在不创建待办、Case 或 Automation Run 的前提下完成提问、解释、探索、讨论和明确请求的 Agent 操作。

### 会话能力

- Chat 中央消息与 Composer 填满可用宽度并保留合理边距，右侧列表可拖拽调宽、输入区可上下拖拽调高；760px 及以下会话列表为可收起抽屉，选择后关闭，Esc 恢复触发按钮焦点，页面切换不丢失会话草稿。
- Chat 右栏直接按 Product Workspace 分组展示当前用户的本地会话，并支持新建、选择、重命名和删除。项目及组内会话使用稳定顺序，活跃、选中和更新不触发重排；会话单行展示。
- 每个项目默认最多显示 5 个会话；有剩余时显示“查看更多”，每次增加 5 条。点击项目标题展开或收起所有会话，收起再展开恢复 5 条。展开、收起和浏览历史不改变当前会话或后台 turn。
- 新会话在用户提交第一条非空消息时落盘；未发送的空白新会话只保留一个临时草稿，不污染历史列表。
- 临时新会话在标题区和 Composer 边界摘要中显式显示目标 Product Workspace。目标默认取当前会话所属的可用工作区，没有当前会话时取最近成功使用的可用工作区；用户可在首条消息发送前快速切换，切换保留草稿且不创建 session 或 thread。
- 每个会话在首个 turn 前固定绑定一个 Product Workspace、本地项目根和持久 Codex thread。切换产品会创建新会话，不把既有 thread 迁移到另一个工作目录。
- 会话保留标题、创建与更新时间、工作区引用、thread 绑定、消息记录、草稿和最近运行状态。标题默认取第一条用户消息的有界摘要，并允许用户修改。
- 删除会话前显示确认；活动 turn 先 interrupt 并等待进入终态，再移除 ArcOrbit 的本地会话、消息和 thread 绑定。删除不声明擦除 Codex 自身可能保留的底层 thread 数据。
- 应用重启后恢复会话列表、消息、草稿和 thread 绑定；重启前仍在生成的 turn 以“已中断”恢复，不自动继续执行。
- 首次进入或从其他页面返回 Chat 时，页面立即切换到 Chat 壳并显示内存中最近一次会话、消息与草稿投影；fresh snapshot 在后台同步并提供可见但不阻塞阅读和输入的状态。后台同步失败保留现有投影和重试入口，不让用户继续停留在旧页面等待。

### 消息与运行能力

- Chat 是 ArcOrbit Conversation Surface 的体验基准。Automation Intervention Workbench 直接使用同一个消息列表、Markdown/代码复制、reasoning、工具/权限状态、流式更新、滚动锚点和“回到最新”实现；共享只发生在无业务语义的对话呈现层，不合并两类 session、thread、Composer 权限或控制状态。
- Composer 接受多行文本，支持输入法组合，`Enter` 发送、`Shift+Enter` 换行；空白内容和重复提交不启动 turn。
- 用户消息在提交成功后立即进入 transcript；Agent 正文以稳定消息 ID 流式更新，不为每个 delta 创建新消息。
- Assistant 正文支持段落、列表、引用、链接、代码块与复制。reasoning 默认折叠；工具调用以单行活动展示开始、进行中、完成或失败，不把完整 stdout、stderr、文件正文或 raw protocol payload 填入普通消息。
- 生成期间 Composer 保留草稿编辑能力，并提供明确的停止按钮。停止调用当前 Codex turn 的 interrupt，保留已显示的部分回答并标记“已中断”；再次继续会启动同一 thread 的新 turn，不伪装成恢复原 turn。
- 一个会话同一时间只有一个活动 turn；不同 Chat 会话的执行所有权彼此隔离，也不占用或解除 Automation 的任务执行 lease。
- 用户切换会话或页面不会隐式中断活动 turn；对应会话在列表中显示运行状态，返回后继续接收同一 turn 的投影。
- transcript 位于底部阈值内时自动跟随新内容；用户上滚后保持阅读位置并显示“回到最新”。
- app-server 初始化、thread resume、turn start、权限请求、运行失败和进程退出均产生可恢复状态。可重试错误保留用户输入、部分消息与 thread 绑定；只有 Codex 明确确认 thread 不存在时才创建替代 thread，并显示恢复记录。

### 工作区与权限

- 首次发送前必须在新会话内确认一个已绑定本地目录且 Setup Readiness 可用的 Product Workspace；即使只有一个可用工作区，页面也持续显示其归属。不存在可用工作区时页面说明阻塞原因，并提供前往工作区配置的恢复入口。
- Product Workspace 决定 Codex 的 `cwd`、workspace root、project skill discovery 和文件权限边界；会话消息不会自动注入整个 Workset、Workshop 任务或 ledger state。
- Chat 直接使用 Codex 自由对话 prompt，不触发 `$using-arckit`，不要求 `arckit-agent-loop-result/v1`，也不调用 trusted ledger entrypoint。
- Codex 发起需要批准的文件、命令或网络操作时，沿用 app-server 的用户 approval request；拒绝只影响该操作或 turn，不改变 Workshop 与 Automation 状态。

### 边界

Chat 不替代一个待办一个持久 thread 的 Automation 对话，也不复用 Automation task session、task thread binding、Case、Run、队列或 human Gate。普通问答和 Agent 操作不自动写入 Project State、Case、Workshop Task、Idea 或其他正式对象。Chat 不提供任何“转为 Idea”“创建 Work”或类似转换动作。

Chat 与 Automation 共享 Conversation Surface 不表示共享消息数据或执行能力。Automation 专属的 gap、round、ledger、证据、耗时、用量、恢复和提交能力只存在于 Automation 左右面板；Chat 不读取也不显示这些对象。

Chat 不提供附件、语音、共享链接、跨设备同步、会话分支或模型管理；它使用 ArcOrbit 当前配置的 Codex 能力，集中保证文本自由对话及其会话、消息、停止和恢复体验。

## Idea

Idea 的真实产品能力以 [Product 管理与 Idea 接入](arcorbit-product-management.md) 为准。该能力建立独立场景会话和产品事实，不改变普通 Chat 的自由对话边界。

## Release / 发布

Release 的真实终端、Git、源码、任务与 Agent 行为以 [Release 本地交付工作台](arcorbit-release-workspace.md) 为准。复用现有项目绑定，不因页面存在自动授予远端发布能力。

## Operations / 运营

### 目标

Operations 展示面向外部用户和市场的运营动作，把发布后的传播、内容、活动、渠道和效果信号纳入同一产品生命周期讨论。

### 主要内容

- 待发布、进行中和已复盘的外部动作；
- 目标受众、渠道、内容主题、负责人和时间窗口；
- 与 Release、Feedback 和 Work 的关系；
- 用户反馈、触达和转化等效果信号的示意摘要；
- 将发现的问题或机会转为 Idea、Work 或 Feedback 跟进的计划动作。

### 边界

Operations 页面不宣称已经接入广告、社交媒体、邮件、分析或 CRM 平台，不自动发布外部内容，也不把示意指标当作真实商业数据。

## Engineering

Engineering 是本机全局的 ArcOrbit 内置 Skills 安装后管理页面。用户可以查看内置安装状态、按名称或当前使用方式筛选、调整 Chat / Automation 的直接发现、按需使用或停用状态，并恢复场景默认。具体集合、生效时机与核心保护见 [场景技能规格](arcorbit-scene-skills.md)。

Automation 固定使用官方 using-arckit 与 arckit-development-ledger 两个核心 skill；Chat 可独立配置官方 Loop 配套。用户级、项目级、其他 catalog 和本地目录 Skills 不显示且不受 Engineering 操作。Engineering 不编辑 Project/Case 模型，也不为 Gap 选择技能。

## 生命周期关系

计划关系遵守显式确认原则：

1. Chat 保持独立自由对话，不自动进入产品生命周期对象。
2. Idea 经团队确认后形成正式 Project，并进入 Work。
3. Work 保存可执行待办，Automation 在受控本地项目与 Runtime 边界内执行。
4. Release 汇总候选变更、验证、发布准备与上线观察。
5. Operations 组织对外动作，并把新信号回流到 Feedback、Idea 或 Work。
6. Feedback 保持用户反馈处理工作台职责，为产品生命周期提供外部输入。
7. Organization 描述谁在协作；Engineering 只管理 ArcOrbit 内置 Skills 在本机 Chat / Automation 的使用方式。

Idea、Work、Release、Operations 与 Feedback 的跨入口关系要求用户看见来源、目标形态和确认动作。Chat 当前不参与这些转换关系。

## 验收口径

- 左侧导航完整显示四个职责组和十一项入口，顺序与本文一致。
- `Release` 与 `Operations` 在英文界面使用英文，在中文说明中分别对应“发布”和“运营”。
- 五个入口都可以打开独立页面；Chat 提供真实 Codex 对话，Idea 遵守 Product 管理规格，Engineering 提供真实内置 Skills 安装后管理；Operations 展示计划内容。
- 页面明确区分真实 Chat 状态、真实项目事实、计划示例和未接入动作。
- Chat 会话列表在全局产品范围内按 Product Workspace 分组；每组默认最多显示 5 条，查看更多每次增加 5 条，项目收起再展开恢复 5 条。
- Chat 新对话在首条消息发送前显式显示目标 Product Workspace，允许保留草稿快速切换；发送后项目归属固定，不能迁移既有 thread。
- Chat 支持工作区绑定、新建/切换/重命名/删除会话、持久 thread、流式消息、工具活动、停止、重试、错误恢复和重启恢复。
- Chat 与 Automation Intervention 的消息列表由同一 Conversation Surface 呈现；对 Markdown、代码复制、reasoning、工具/权限状态、流式消息和滚动行为的修改不需要在两处重复实现或验收。
- Chat 停止后保留部分回答并以新 turn 继续；删除活动会话先完成 interrupt，且不会误删其他会话。
- Chat 不调用 state-driven Runtime、trusted ledger、Workshop mutation 或其他对象转换；Automation task session 与 thread 不进入 Chat 列表。
- Idea 展示探索、讨论与确认后建项目。
- Release 同时覆盖发版准备与线上监控；Operations 覆盖对外市场化动作。
- 现有 Today、Work、Automation、Feedback、Organization 和账号入口保持可用。

- Engineering 的可信内置集合、紧凑管理、真实保存、核心保护与 Chat 入口遵守场景技能规格；安装和旧副本迁移仍由 Setup Readiness 负责。
