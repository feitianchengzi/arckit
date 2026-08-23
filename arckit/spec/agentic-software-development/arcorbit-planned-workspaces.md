# ArcOrbit Chat 与计划工作空间能力规格

## 文档定位

本文定义 ArcOrbit 的真实 Chat，以及用于团队计划对齐的 Idea、Release、Operations 和 Engineering 工作空间，并说明它们与现有 Today、Work、Automation、Feedback 和 Organization 的关系。

Chat 是由 Codex app-server 驱动的本地项目自由对话工作空间。Idea、Release、Operations 和 Engineering 是产品方向的可交互展示面；它们使用 ArcOrbit 已有的项目、待办、反馈、Run、Project State、Case、Loop、definition/code/diagnosis skill contract 和发布工作流事实组织示意内容，但不因此宣称新的服务端、市场平台、监控平台或 Agent 执行能力已经接入。

## 主导航信息架构

左侧主导航使用三个稳定职责组，并在英文界面中保持统一英文入口名：

1. `PERSONAL`：Today、Chat。
2. `PRODUCT LIFECYCLE`：Idea、Work、Automation、Release、Operations、Feedback。
3. `ORGANIZATION`：Organization、Engineering。

中文语义分别为“个人”“产品全生命周期”“组织能力”。`发布` 在英文界面中显示为 `Release`，`运营` 显示为 `Operations`；同一界面不混用中英文入口名。

Today 仍是跨产品的今日推进摘要。Chat 位于 Today 下方，提供不依赖待办或 Case 的本地项目自由协作。

Idea 位于 Work 上方，作为产品全生命周期的起点。Work、Automation 和 Feedback 保留既有真实能力；Release 和 Operations 位于 Automation 与 Feedback 之间，表达研发完成后的发布与外部运营阶段。

Organization 保留组织治理职责。Engineering 位于其下方，是 Domain Profile 的管理入口。当前 Software Engineering Profile 把软件工程 State 定义、领域 Skills 与生命周期解释组合为一份可编辑配置；团队通过建立、复制、替换和应用 Profile，让同一套 Loop Kernel 与产品生命周期适配不同团队、行业或领域。

## 统一工作空间边界

所有页面都满足以下边界：

- Chat 只以明确选择的本地 Product Workspace 为 Codex 工作目录；没有可用本地工作区时保留草稿，但不启动对话。
- Chat 会话、消息、Codex thread 绑定和运行状态由 ArcOrbit 本地持久化，不写入 Workshop、Project State、Case 或 Automation queue。
- Chat 中的工具和文件操作继续受 Codex sandbox、workspace roots 与 approval policy 约束；Renderer 不获得 Codex 进程、凭据、文件系统或通用 RPC 权限。
- Idea、Release、Operations 和 Engineering 的标题、摘要、卡片、状态、时间线和动作可以使用可信的计划示例，帮助团队讨论目标形态。
- 计划示例优先来自 ArcOrbit 当前真实对象与约束，不虚构已接入的远端接口、权限或自动化结果。
- 未建立真实写入合约的计划动作以“计划动作”“示意”或不可用状态表达，不产生远端记录、Runtime Run、Project State transition 或发布授权。
- Chat 与 Idea、Work 等正式形态之间没有转换、关联或来源写入；自由对话只保留为独立 Chat 会话。
- Work、Automation、Feedback、Organization 和产品反馈中心的既有真实行为不因这些计划页面而改变。
- 顶部产品范围为 Chat 选择本地 Product Workspace，并可为其他计划页面提供上下文；它不得改变自动领取资格、成员关系、状态真相源或发布授权。

## Chat

### 目标

Chat 是面向本地 Product Workspace 的自由 Codex 对话入口。用户在不创建待办、Case 或 Automation Run 的前提下完成提问、解释、探索、讨论和明确请求的 Agent 操作。

### 会话能力

- Chat 左栏按最近活动时间展示当前用户的本地会话，并支持新建、选择、重命名和删除。
- 新会话在用户提交第一条非空消息时落盘；未发送的空白新会话只保留一个临时草稿，不污染历史列表。
- 每个会话在首个 turn 前固定绑定一个 Product Workspace、本地项目根和持久 Codex thread。切换产品会创建新会话，不把既有 thread 迁移到另一个工作目录。
- 会话保留标题、创建与更新时间、工作区引用、thread 绑定、消息记录、草稿和最近运行状态。标题默认取第一条用户消息的有界摘要，并允许用户修改。
- 删除会话前显示确认；活动 turn 先 interrupt 并等待进入终态，再移除 ArcOrbit 的本地会话、消息和 thread 绑定。删除不声明擦除 Codex 自身可能保留的底层 thread 数据。
- 应用重启后恢复会话列表、消息、草稿和 thread 绑定；重启前仍在生成的 turn 以“已中断”恢复，不自动继续执行。

### 消息与运行能力

- Composer 接受多行文本，支持输入法组合，`Enter` 发送、`Shift+Enter` 换行；空白内容和重复提交不启动 turn。
- 用户消息在提交成功后立即进入 transcript；Agent 正文以稳定消息 ID 流式更新，不为每个 delta 创建新消息。
- Assistant 正文支持段落、列表、引用、链接、代码块与复制。reasoning 默认折叠；工具调用以单行活动展示开始、进行中、完成或失败，不把完整 stdout、stderr、文件正文或 raw protocol payload 填入普通消息。
- 生成期间 Composer 保留草稿编辑能力，并提供明确的停止按钮。停止调用当前 Codex turn 的 interrupt，保留已显示的部分回答并标记“已中断”；再次继续会启动同一 thread 的新 turn，不伪装成恢复原 turn。
- 一个会话同一时间只有一个活动 turn；不同 Chat 会话的执行所有权彼此隔离，也不占用或解除 Automation 的任务执行 lease。
- 用户切换会话或页面不会隐式中断活动 turn；对应会话在列表中显示运行状态，返回后继续接收同一 turn 的投影。
- transcript 位于底部阈值内时自动跟随新内容；用户上滚后保持阅读位置并显示“回到最新”。
- app-server 初始化、thread resume、turn start、权限请求、运行失败和进程退出均产生可恢复状态。可重试错误保留用户输入、部分消息与 thread 绑定；只有 Codex 明确确认 thread 不存在时才创建替代 thread，并显示恢复记录。

### 工作区与权限

- 首次发送前必须选择已绑定本地目录且 Setup Readiness 可用的 Product Workspace。不存在可用工作区时页面说明阻塞原因，并提供前往工作区配置的恢复入口。
- Product Workspace 决定 Codex 的 `cwd`、workspace root、project skill discovery 和文件权限边界；会话消息不会自动注入整个 Workset、Workshop 任务或 ledger state。
- Chat 直接使用 Codex 自由对话 prompt，不触发 `$using-arckit`，不要求 `arckit-agent-loop-result/v1`，也不调用 trusted ledger entrypoint。
- Codex 发起需要批准的文件、命令或网络操作时，沿用 app-server 的用户 approval request；拒绝只影响该操作或 turn，不改变 Workshop 与 Automation 状态。

### 边界

Chat 不替代一个待办一个持久 thread 的 Automation 对话，也不复用 Automation task session、task thread binding、Case、Run、队列或 human Gate。普通问答和 Agent 操作不自动写入 Project State、Case、Workshop Task、Idea 或其他正式对象。Chat 不提供任何“转为 Idea”“创建 Work”或类似转换动作。

Chat 不提供附件、语音、共享链接、跨设备同步、会话分支或模型管理；它使用 ArcOrbit 当前配置的 Codex 能力，集中保证文本自由对话及其会话、消息、停止和恢复体验。

## Idea

### 目标

Idea 承接创意探索、机会描述、用户信号和团队讨论，在进入正式项目之前形成可比较、可澄清的产品创意。

### 主要内容

- 处于探索、讨论和已确认状态的创意列表；
- 问题、目标用户、价值假设、证据和主要风险摘要；
- 来自 Chat、Feedback 或团队输入的来源标识；
- 团队成员观点与待确认问题；
- 将已确认创意转为正式 Project 的计划动作。

### 边界

Idea 不是 Workshop Project、Project State 或 Case 的别名。创意只有经过明确确认并建立正式项目上下文后，才进入 Work、Automation 和后续生命周期；当前展示页不创建远端项目。

## Release / 发布

### 目标

Release 展示产品版本推进、发布准备和线上健康监控的整体计划，使团队能够把研发完成状态与交付状态分开讨论。

### 主要内容

- 当前 release train、目标版本、渠道和环境摘要；
- 来自 Work 与 Automation 的候选变更、验证证据和未闭合风险；
- ArcOrbit 已有 `tf/*`、`beta/*`、`appstore/*` release-intent tag 与手动 GitHub workflow 约束；
- 安装包、签名、草稿发布和跨平台产物状态；
- 发布后的健康、事件和回退关注项示意。

### 边界

Release 页面不授权发版，不替代人工 release intent、签名、渠道审批或真实监控系统。页面中的发布、监控和回退动作仅展示计划职责，除非后续建立相应受信合约。

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

### 目标

Engineering 管理当前组织可使用的 Domain Profiles。每个 Profile 把“Loop 要理解和持久化什么”的 State Model、“Agent 如何维护、比较和诊断这些事实”的 Capability Mapping，以及固定产品生命周期各阶段对领域对象的解释组合为一份可版本化配置。当前激活项是 Software Engineering Profile。

用户可以在同一页面选择现有 Profile、从模板复制、新建草稿、编辑 State Model 和 Capability Mapping、比较替换前后的影响，并在确认后应用到目标组织或团队。当前页面只演示完整管理模型，不执行真实保存、安装、同步或应用。

### 主要内容

- Profile Library：当前 Profile、团队草稿与跨行业模板，并提供新建、复制、导入、归档和切换的计划入口；
- Profile 元数据：名称、适用范围、版本、负责人、继承来源、状态与目标团队；
- State Model 编辑器：配置 Project State 的领域定义清单与长期不变量，以及 Case State 的事实类型、影响目标、Gap 分类和证据要求；
- Capability Mapping 编辑器：按“预期事实”“实现现状”“问题定位”三个能力槽位添加、移除、替换领域 Skills，并显示每项能力维护或检查的事实源；
- Lifecycle Mapping：保持 Idea、Work、Automation、Release、Operations、Feedback 主流程稳定，同时配置每个阶段在当前领域中承接的对象、输入和完成证据；
- Change Preview：比较当前激活 Profile 与草稿在 State 定义、能力绑定、生命周期解释和目标团队上的变化；
- Apply 确认：显示作用范围、兼容性检查和回退版本，确认后才允许应用 Profile；当前为不持久化的计划动作；
- Software Engineering、Campaign Operations、Research Program 等跨团队或跨行业示例，用于说明同一 Loop Kernel 如何加载不同领域配置。

### 边界

Engineering 中的编辑对象是 Domain Profile 草稿，不是直接修改当前 canonical Project/Case record。页面把 State Model 与 Capability Mapping 作为一组进行版本化、校验、预览和应用；只有显式确认后的 Profile 版本才影响后续领域工作，既有 Case 与证据不能被静默改写。

当前展示不执行真实保存、skill 安装/同步、profile apply、registry 写入或 Case 迁移。`using-arckit` 与 `arckit-development-ledger` 属于所有 Profile 共用的 Loop Kernel，不属于可替换领域 Skills，也不在 Capability Mapping 中展示。责任、事实、证据、Gap、handoff、review 与 transition 的通用协议边界保持稳定；领域 Skills 维护或检查对应事实源，但不拥有 State，也不决定下一个 Gap。

## 生命周期关系

计划关系遵守显式确认原则：

1. Chat 保持独立自由对话，不自动进入产品生命周期对象。
2. Idea 经团队确认后形成正式 Project，并进入 Work。
3. Work 保存可执行待办，Automation 在受控本地项目与 Runtime 边界内执行。
4. Release 汇总候选变更、验证、发布准备与上线观察。
5. Operations 组织对外动作，并把新信号回流到 Feedback、Idea 或 Work。
6. Feedback 保持用户反馈处理工作台职责，为产品生命周期提供外部输入。
7. Organization 描述谁在协作；Engineering 管理这些团队使用哪一份 Domain Profile，以及该 Profile 如何定义 State、映射能力并解释同一生命周期。

Idea、Work、Release、Operations 与 Feedback 的跨入口关系要求用户看见来源、目标形态和确认动作。Chat 当前不参与这些转换关系。

## 验收口径

- 左侧导航完整显示三个职责组和十项入口，顺序与本文一致。
- `Release` 与 `Operations` 在英文界面使用英文，在中文说明中分别对应“发布”和“运营”。
- 五个入口都可以打开独立页面；Chat 提供真实 Codex 对话，其余四个页面展示符合本规格的计划内容。
- 页面明确区分真实 Chat 状态、真实项目事实、计划示例和未接入动作。
- Chat 支持工作区绑定、新建/切换/重命名/删除会话、持久 thread、流式消息、工具活动、停止、重试、错误恢复和重启恢复。
- Chat 停止后保留部分回答并以新 turn 继续；删除活动会话先完成 interrupt，且不会误删其他会话。
- Chat 不调用 state-driven Runtime、trusted ledger、Workshop mutation 或其他对象转换；Automation task session 与 thread 不进入 Chat 列表。
- Idea 展示探索、讨论与确认后建项目。
- Release 同时覆盖发版准备与线上监控；Operations 覆盖对外市场化动作。
- Engineering 提供 Profile Library、State Model 编辑、Capability Mapping、Lifecycle Mapping、变更预览与 Apply 确认的完整管理示意。
- Engineering 支持把 State 定义与领域 Skills 作为一组替换，并显示 Software Engineering 以外的团队或行业 Profile 示例。
- Profile 替换不改变 Idea → Work → Automation → Release → Operations → Feedback 的主流程，也不改变 Loop Kernel 的责任、证据、Gap、handoff、review 和 transition 边界。
- Capability Mapping 不把 entry skills 误作领域能力；所有管理动作均明确标记为不持久化示意。
- 现有 Today、Work、Automation、Feedback、Organization 和账号入口保持可用。
