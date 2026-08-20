# ArcOrbit 计划工作空间能力规格

## 文档定位

本文定义 ArcOrbit 用于团队计划对齐的 Chat、Idea、Release、Operations 和 Engineering 工作空间，以及它们与现有 Today、Work、Automation、Feedback 和 Organization 的关系。

这些工作空间当前是产品方向的可交互展示面。计划展示不等于真实接入：页面使用 ArcOrbit 已有的项目、待办、反馈、Run、Project State、Case、Loop、definition/code/diagnosis skill contract 和发布工作流事实组织示意内容，但不因此宣称新的服务端、市场平台、监控平台或 Agent 执行能力已经接入。

## 主导航信息架构

左侧主导航使用三个稳定职责组，并在英文界面中保持统一英文入口名：

1. `PERSONAL`：Today、Chat。
2. `PRODUCT LIFECYCLE`：Idea、Work、Automation、Release、Operations、Feedback。
3. `ORGANIZATION`：Organization、Engineering。

中文语义分别为“个人”“产品全生命周期”“组织能力”。`发布` 在英文界面中显示为 `Release`，`运营` 显示为 `Operations`；同一界面不混用中英文入口名。

Today 仍是跨产品的今日推进摘要。Chat 位于 Today 下方，表达尚未固化为产品事项的自由协作。

Idea 位于 Work 上方，作为产品全生命周期的起点。Work、Automation 和 Feedback 保留既有真实能力；Release 和 Operations 位于 Automation 与 Feedback 之间，表达研发完成后的发布与外部运营阶段。

Organization 保留组织治理职责。Engineering 位于其下方，是 Domain Profile 的管理入口。当前 Software Engineering Profile 把软件工程 State 定义、领域 Skills 与生命周期解释组合为一份可编辑配置；团队通过建立、复制、替换和应用 Profile，让同一套 Loop Kernel 与产品生命周期适配不同团队、行业或领域。

## 统一展示边界

所有新增页面都满足以下边界：

- 页面标题、摘要、卡片、状态、时间线和动作可以使用可信的计划示例，帮助团队讨论目标形态。
- 示例优先来自 ArcOrbit 当前真实对象与约束，不虚构已接入的远端接口、权限或自动化结果。
- 未建立真实写入合约的动作以“计划动作”“示意”或不可用状态表达，不产生远端记录、Runtime Run、Project State transition 或发布授权。
- 从 Chat 或 Idea 转入其他形态表示产品计划中的显式确认关系，不等于当前已经完成跨域持久化。
- Work、Automation、Feedback、Organization 和产品反馈中心的既有真实行为不因这些计划页面而改变。
- 顶部产品集观察范围可以为计划页面提供上下文，但不得改变自动领取资格、成员关系、状态真相源或发布授权。

## Chat

### 目标

Chat 是自由度最高的 Agent 协作入口，用于尚未确定应该进入哪一种正式工作形态的问题、解释、探索和讨论。

### 主要内容

- 当前对话和历史对话摘要；
- 可选的产品集或单产品上下文；
- Agent 对问题的正文回答、相关事实和建议的后续形态；
- 将已确认结论转为 Idea、Work 或其他明确形态的计划动作；
- “尚未确认”的显式状态，防止自由讨论被误认为正式项目事实。

### 边界

Chat 不替代一个待办一个持久 thread 的 Automation 对话，也不把普通问答自动写入 Project State、Case 或 Workshop Task。用户确认后才进入后续形态；当前展示页不执行真实转换。

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

1. Chat 中的自由讨论可以在用户确认后形成 Idea 或 Work。
2. Idea 经团队确认后形成正式 Project，并进入 Work。
3. Work 保存可执行待办，Automation 在受控本地项目与 Runtime 边界内执行。
4. Release 汇总候选变更、验证、发布准备与上线观察。
5. Operations 组织对外动作，并把新信号回流到 Feedback、Idea 或 Work。
6. Feedback 保持用户反馈处理工作台职责，为产品生命周期提供外部输入。
7. Organization 描述谁在协作；Engineering 管理这些团队使用哪一份 Domain Profile，以及该 Profile 如何定义 State、映射能力并解释同一生命周期。

任何跨入口转换都要求用户看见来源、目标形态和确认动作。没有真实合约时，页面只展示目标关系，不伪造转换结果。

## 验收口径

- 左侧导航完整显示三个职责组和十项入口，顺序与本文一致。
- `Release` 与 `Operations` 在英文界面使用英文，在中文说明中分别对应“发布”和“运营”。
- 五个新增入口都可以打开独立页面，并展示符合本规格的示意内容。
- 页面明确区分真实项目事实、计划示例和未接入动作。
- Chat 展示自由问答与确认后转换；Idea 展示探索、讨论与确认后建项目。
- Release 同时覆盖发版准备与线上监控；Operations 覆盖对外市场化动作。
- Engineering 提供 Profile Library、State Model 编辑、Capability Mapping、Lifecycle Mapping、变更预览与 Apply 确认的完整管理示意。
- Engineering 支持把 State 定义与领域 Skills 作为一组替换，并显示 Software Engineering 以外的团队或行业 Profile 示例。
- Profile 替换不改变 Idea → Work → Automation → Release → Operations → Feedback 的主流程，也不改变 Loop Kernel 的责任、证据、Gap、handoff、review 和 transition 边界。
- Capability Mapping 不把 entry skills 误作领域能力；所有管理动作均明确标记为不持久化示意。
- 现有 Today、Work、Automation、Feedback、Organization 和账号入口保持可用。
