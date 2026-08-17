# AI 原生软件产品研发平台：产品概念与整体规划

## Status

- State: candidate
- Type: process_handoff
- Source: 用户目标、Arckit 产品理念、现有探索项目、已投入使用的平台业务事实
- Created: 2026-07-14
- Updated: 2026-07-14
- Decision: 作为团队整体产品规划讨论稿；对齐后再拆分为正式产品规格、领域模型和技术架构

## 文档定位

本文从最终要建设的产品出发，定义一套覆盖软件产品构思、研发、交付、使用反馈和持续改进的完整平台解决方案。

本文重点回答：

- 平台为谁服务，解决什么问题，带来什么长期价值。
- 整套解决方案由哪些目标产品组成，每个产品承担什么职责。
- 用户、产品团队、各类应用开发者、被研发的 iOS App、开发工具、平台客户端、Web 端和服务器如何组成一个完整系统。
- 各产品如何共享上下文、工作状态和证据，形成端到端闭环。
- AI 应当嵌入哪些产品能力，人与 AI 如何共同完成研发工作。
- 第一版 MVP 应当跑通什么，而不是先把哪些既有系统拼接起来。
- 现有项目可以为目标产品提供哪些能力来源，以及后续应如何评估保留、整合、拆分或替换。

本文不定义平台自身由哪些团队建设，也不讨论平台基础设施维护岗位。这里的角色均为平台服务的用户，关注他们如何借助平台持续建设和运营软件产品。

---

## 一、产品理念

### 1.1 产品愿景

平台的愿景是：

> 让一个软件产品从模糊创意开始，经过团队判断、产品定义、研发执行、测试交付和真实用户反馈，始终拥有连续、可恢复、可执行的产品上下文，并能够由人和 AI 共同持续推进。

平台首先服务于团队持续建设 2C iOS App 的场景，未来可以扩展到其他客户端、Web 产品和更广泛的软件研发项目。

它既是团队共同使用的产品管理与研发协作平台，也是连接本地开发环境、AI 编码工具、自动化执行环境、发布渠道和用户反馈入口的完整解决方案。

### 1.2 平台要改变的工作方式

传统软件研发过程中，产品想法、需求文档、设计、代码、任务、AI 对话、发布记录和用户反馈常常分散在不同工具中。每一次人员交接、AI 会话切换或项目恢复，都需要重新解释背景；AI 可以完成局部工作，却难以持续理解产品状态并对结果负责。

平台将这些分散活动组织成一条连续的产品生命线：

```text
产品创意
  → 产品判断与立项
  → 产品定义与研发准备
  → 工作计划与执行
  → 构建、测试与发布
  → 用户使用与反馈
  → 产品改进
  → 下一轮交付
```

每个环节都会留下结构化状态、决策、证据和下一步责任，使团队成员和 AI 都可以从同一上下文继续工作。

### 1.3 核心产品价值

#### 连续的产品上下文

每个 Product 从创意阶段开始拥有自己的目标、用户、决策、规格、项目状态、工作记录、版本和反馈历史。产品上下文随研发持续演进，不依附于某一次会议、某一份临时文档或某一个 AI 会话。

#### 可执行的研发状态

平台不仅展示“有哪些任务”，还表达产品当前已经具备什么、缺少什么、正在推进什么、完成需要哪些证据，以及下一步由谁继续。

#### 对人类注意力友好的协作

团队成员看到的是需要自己判断、确认、处理或接手的工作。平台负责整理上下文、聚合状态和呈现风险，让人把注意力放在产品判断、质量判断、取舍和授权上。

#### 嵌入完整流程的 AI 能力

AI 不是一个孤立聊天入口，而是产品分析、工作组织、编码、诊断、验证、反馈理解和经验复用中的共同能力。AI 的输入来自平台上下文，输出进入平台状态，并带有证据、边界和后续责任。

#### 从真实用户回到研发的闭环

被研发出来的 App 是平台系统的一部分。用户使用、反馈、版本、修复和验证能够关联到同一个 Product，使真实使用持续影响后续产品决策和研发工作。

#### 可复用的软件建设能力

账号、反馈、网关、存储、发布准备以及各技术栈的工程方法，可以作为产品能力被选择、应用、验证和升级，减少每个 App 从零建设的成本。

---

## 二、产品设计原则

### 2.1 以 Product 为业务主线

平台围绕持续存在的 Product 组织信息。创意、规格、工作、执行、构建、发布和反馈都应能回到对应 Product，而不是分别停留在文档、任务或运行记录中。

### 2.2 以 Project State 表达研发进展

研发进度不仅由任务完成数量体现。平台通过可恢复的 Project State 表达产品定义、工程实现、验证结果、风险和未决问题的实际状态。

### 2.3 以 Work 承接协作，以 Case 和 Loop 推进状态

- Work 表达团队需要处理的事项、责任和优先级。
- Case 表达某个事项要推进的项目状态、完成条件和连续上下文。
- Loop 表达一次有边界、可观察、可收口的推进过程。
- Run 表达某个开发工具、AI Agent、CI 或外部执行器的一次实际执行。

这些对象共同连接团队协作和软件工程执行，但保持各自清晰的职责。

### 2.4 人负责目标、判断与授权

产品立项、优先级、重要需求、体验取舍、敏感操作、质量判断和正式发布由人负责。AI 提供分析、建议和执行能力，平台保存决策依据及执行结果。

### 2.5 AI 能力进入每个产品，而不是形成独立孤岛

每个目标产品都应明确 AI 能做什么、需要什么上下文、输出如何验证，以及何时需要人确认。团队不需要在“人工系统”和“AI 系统”之间来回迁移信息。

### 2.6 中央协作与本地开发并存

团队共享状态、工作和决策由平台 Web 与服务器承载；代码、工程工具、密钥和设备能力仍可留在开发者本地。Developer Workbench 负责连接这两个环境。

### 2.7 用证据推动状态变化

工作完成需要对应的文档变化、代码 diff、测试结果、构建记录、截图、日志、评审或人工确认。平台根据证据推进状态，使自动化结果可理解、可检查、可接手。

### 2.8 现有工具可以继续发挥价值

平台连接 Codex CLI/Desktop、Xcode、GitHub、TestFlight 等开发者已经使用的工具，为它们提供统一产品上下文和协作协议，而不是要求所有工作都发生在一个封闭界面中。

---

## 三、平台解决方案的产品组成

整套解决方案由七个逻辑产品单元和一个统一平台底座组成。

“逻辑产品单元”表示它拥有明确用户、场景、业务对象和价值闭环。MVP 阶段多个单元可以共用同一个 Web 应用、服务器或代码仓库；后续是否独立部署，由实际规模、用户体验和工程边界决定。

| 目标产品 | 主要服务对象 | 核心价值 | 主要产品表面 |
|---|---|---|---|
| 产品策划中心 Product Studio | 产品创意者、产品负责人、产品与设计协作者 | 把创意变成可判断、可立项、可持续演进的 Product | Web、Codex/CLI 同步入口 |
| 工作协作中心 Work Hub | 团队负责人、各类开发者、测试与反馈处理者 | 统一承载任务、接力、待确认事项和个人工作队列 | Web、桌面端 |
| 开发者工作台 Developer Workbench | iOS、服务端、Web、测试与发布开发者 | 把平台上下文带入本地开发环境，并安全回传结果 | 本地桌面端、CLI |
| 自动化运行平台 Automation Runtime | 使用自动化研发能力的产品团队 | 在明确目标、权限和证据要求下持续推进研发状态 | 服务器运行中心、本地或云端执行器 |
| 交付中心 Delivery Center | 产品负责人、开发者、测试与发布协作者 | 把研发结果组织成可测试、可发布、可追溯的版本 | Web、外部发布集成 |
| 反馈与学习平台 Feedback Hub | App 用户、测试用户、反馈处理者、产品与开发团队 | 把真实使用反馈转化为可处理、可验证的产品改进 | App SDK、用户反馈页、Web 处理台 |
| 能力中心 Capability Hub | 产品负责人、各类开发者 | 选择、应用和治理可复用的软件能力与 Agent skills | Web、桌面端、CLI |
| 统一平台底座 | 上述所有产品单元 | 提供身份、权限、领域关联、事件、集成和数据一致性 | 平台服务器与公共 API |

### 3.1 产品策划中心 Product Studio

Product Studio 管理产品从候选创意到正式立项，再到持续演进的产品定义。

#### 服务场景

- 收集来自团队观察、用户反馈、市场变化和个人经验的产品创意。
- 围绕同一个 ProductIdea 持续补充目标用户、问题、证据、差异化和验证方式。
- 记录产品判断、讨论和立项决策。
- 将确认的 ProductIdea 提升为 Product。
- 展示每个 Product 的目标、阶段、主要版本、研发状态和用户反馈概览。

#### 核心能力

- ProductIdea 创建、编辑、版本和状态管理。
- 产品证据、讨论、决策和验证记录。
- Product 立项、负责人、目标和产品阶段。
- Product Blueprint：用户、问题、价值主张、MVP、业务模式和关键风险。
- Product 与 Workspace、Work、Release、Feedback 的统一入口。

#### AI 能力

- 从零散输入中整理 ProductIdea 草案。
- 辅助市场、竞品、用户问题和机会分析。
- 对关键假设、风险和验证方式进行结构化分析。
- 比较候选方向并生成决策材料。
- 根据后续证据更新产品摘要和待验证问题。

AI 可以形成分析和草案；产品是否成立、是否立项以及投入优先级由团队确认。

#### 主要输出

- ProductIdea。
- Product Decision。
- Product。
- Product Blueprint。
- ProductWorkspace 初始化请求。

### 3.2 工作协作中心 Work Hub

Work Hub 是所有团队成员统一查看和处理研发工作的入口。它吸收传统待办工具的轻量体验，同时能够承接 AI 自动化、人工接力、审批和外部等待。

#### 服务场景

- 查看个人、产品和团队工作队列。
- 创建、分配、排序和跟踪 WorkItem。
- 接收 AI 执行产生的 Handoff、确认请求和阻塞事项。
- 从 Feedback、Release、Product Decision 或人工讨论创建工作。
- 完成人工处理后，将同一事项交回自动化流程继续。

#### 核心能力

- WorkItem、优先级、负责人、截止时间和状态。
- 个人队列、产品队列和团队队列。
- Handoff、Approval、Decision Request 和 External Wait。
- WorkItem 与 Product、Case、Run、Feedback、Pull Request、Build 的关联。
- 工作摘要、上下文恢复和跨角色接力。
- 状态通知、订阅和提醒。

#### AI 能力

- 从产品决策、反馈和运行结果中提取候选 WorkItem。
- 补充目标、验收条件、依赖和缺失信息。
- 生成工作摘要、当前阻塞和下一步建议。
- 根据技能、上下文和工作负载提供分配或执行方式建议。
- 识别重复事项和可以合并的工作。

AI 可以提出工作和组织建议；任务是否进入计划、优先级和最终责任人由团队决定。

#### 主要输出

- WorkItem。
- Handoff。
- Approval / Decision Request。
- 与 Case 的创建或绑定关系。

### 3.3 开发者工作台 Developer Workbench

Developer Workbench 是安装在开发者电脑上的平台客户端。它把团队共享的产品与工作上下文连接到本地仓库、Codex 类工具、Xcode、Git 和设备能力。

#### 服务场景

- 开发者选择当前 Product 和 WorkItem，恢复完整上下文。
- 打开或绑定本地仓库和开发工程。
- 在 Codex CLI/Desktop 或其他编码 Agent 中继续工作。
- 查看自动化运行、人工接力和需要确认的本地操作。
- 将文档、代码、测试、commit、PR 和构建结果回传平台。

#### 核心能力

- ProductWorkspace 与本地目录绑定。
- 项目事实、当前 Case、相关 Work 和运行历史装配。
- Agent、IDE、Git、Xcode 和本地命令入口。
- SkillSet 检查、安装和版本对齐。
- 本地权限、密钥引用和高影响操作确认。
- 执行日志、Worker Report 和 Evidence 收集。
- 离线缓存、失败恢复和结果同步。

#### AI 能力

- 基于完整产品和工程上下文编写或修改代码。
- 生成和维护产品、交互、技术与实现文档。
- 诊断问题、补充测试、执行验证和代码审查。
- 汇总本地改动、风险、未完成项和交接说明。
- 在一个 Case 内根据人工处理结果继续后续工作。

开发者可以全程主动操作，也可以审阅自动化结果后接手或交回 AI。

#### 主要输出

- 本地 Run。
- 代码和项目事实变更。
- Worker Report 与 Evidence。
- commit、PR、Build 或 Handoff 引用。

### 3.4 自动化运行平台 Automation Runtime

Automation Runtime 是整套平台持续执行研发工作的运行内核。它将 ProductWorkspace 中的项目状态和 Case 转化为有边界的 Loop，并协调合适的 Agent、Skill、执行环境与人工确认。

#### 服务场景

- 根据 Product、Project State 和 WorkItem 启动自动化工作。
- 将一个持续事项拆成可以执行、验证和收口的 Loop。
- 在开发者本地、云端隔离环境、CI 或外部系统中运行工作。
- 处理失败、重试、等待、人工接力和恢复。
- 将执行结果写回 Case、Work 和 Project State。

#### 核心能力

- Case、Loop、Run 和执行状态管理。
- 上下文装配、能力选择和 Worker Packet。
- 本地 Agent、云端 Agent、CI 和外部 Adapter 接入。
- 权限策略、Execution Gate 和敏感操作确认。
- 结构化报告、证据校验和 Artifact Impact。
- Continue、Retry、Interrupt、Resume 和 Handoff。
- 状态写回、事件记录和完整追踪。

#### AI 能力

- 理解当前项目状态和本轮目标。
- 选择适用的分析、定义、编码、诊断或验证能力。
- 执行语义工作并形成结构化结果。
- 根据证据判断是否需要继续补充、请求人工处理或建议结束。
- 从失败和验证结果中提出下一轮路线。

Runtime 自身负责稳定的运行控制、权限和状态协议；其中调用的 AI 负责语义理解与工作执行。任何状态提升都需要满足对应证据和确认规则。

#### 主要输出

- Case 状态。
- Loop 与 Run。
- Execution Report、Evidence 和 State Delta。
- Handoff 或下一轮执行请求。

### 3.5 交付中心 Delivery Center

Delivery Center 将“研发工作已完成”继续推进为“目标用户可以安装、测试和验证的版本”。

#### 服务场景

- 管理 App Build、测试版本、Release Candidate 和正式 Release。
- 关联版本包含的 WorkItem、Case、commit、PR 和已知问题。
- 组织 TestFlight 准备、内测人群和验证计划。
- 跟踪发布所需的签名、隐私、截图、文案和人工确认。
- 将反馈的发现版本、修复版本和用户验证结果关联起来。

#### 核心能力

- Build、Release Candidate、Release 和 Channel。
- 版本内容、变更说明和已知问题。
- TestFlight checklist、发布 Gate 和人工 Handoff。
- GitHub、CI、App Store Connect 与 TestFlight 集成。
- 测试范围、测试用户和验证结论。
- Feedback 与 Release 的双向关联。

#### AI 能力

- 汇总版本变更和生成发布说明草案。
- 检查发布资料、配置和验证证据的完整性。
- 分析构建或 CI 失败并给出处理建议。
- 根据 Work、Feedback 和风险生成测试重点。
- 形成 Release Candidate 的风险摘要。

正式发布、商店提交和高风险配置变更由有权限的人确认。

#### 主要输出

- Build。
- Release Candidate。
- Release。
- Test Plan 与 Release Decision。

### 3.6 反馈与学习平台 Feedback Hub

Feedback Hub 连接真实 App 用户和产品研发团队。它不仅接收反馈，还负责澄清、归并、处理、研发跟进、版本关联和结果回传。

#### 产品组成

- App Feedback SDK：集成在被研发的 iOS App 中。
- 用户反馈入口：提交问题、建议、截图、日志和补充信息。
- 用户反馈记录页：查看处理状态、补充说明和验证结果。
- 团队反馈处理台：查看、归并、确认、分流和跟踪反馈。
- Feedback Integration：连接 Work Hub、Delivery Center 和 Product Studio。

#### 核心能力

- 用户身份或设备身份关联。
- Feedback、对话、附件、设备、系统和版本信息。
- 人工确认、分类、优先级和处理状态。
- 相似反馈聚合及影响用户范围。
- Feedback 转 WorkItem，关联 Case 和负责人。
- 修复 Build、Release 和用户验证关联。
- fixed、answered、rejected、deferred 等状态同步。

#### AI 能力

- 识别相似反馈并提出归并建议。
- 判断反馈类型、影响范围和信息完整度。
- 生成面向用户的澄清问题，引导补充有效信息。
- 关联历史 Feedback、WorkItem、Case、已知问题和 Release。
- 生成研发事项草案、处理摘要和用户回复草案。
- 从反馈集合中发现产品机会和体验趋势，送回 Product Studio。

反馈是否成立、是否归并、是否进入研发以及何时关闭，由反馈处理者或产品团队确认。

#### 主要输出

- Feedback 与 Conversation。
- Feedback Cluster。
- WorkItem 候选或正式关联。
- Feedback Resolution 与用户验证结果。
- Product Insight 候选。

### 3.7 能力中心 Capability Hub

Capability Hub 管理团队建设软件产品时可以直接选择和复用的能力。它同时连接产品层的“我需要什么能力”和执行层的“Agent 应如何正确完成接入”。

#### 服务场景

- 产品在立项或研发过程中选择所需能力。
- 开发者查看能力适用范围、配置、限制和验证方式。
- Workbench 与 Runtime 获取匹配的 SkillSet、模板和执行说明。
- 团队了解不同 Product 使用的能力版本和验证状态。
- 从成功实践中形成新的 Capability 候选。

#### 核心能力

- Capability 目录、版本、适用平台和依赖。
- 配置契约、安全边界和人工确认点。
- Skill、模板、示例、SDK 和检查清单关联。
- Product Capability Selection。
- SkillSetVersion、安装状态和 drift。
- 验证方法、验证证据和兼容性。
- 使用记录、升级提示和迁移说明。

#### AI 能力

- 根据 Product Blueprint 和技术栈推荐所需 Capability。
- 生成能力接入计划和缺失配置清单。
- 在执行中调用对应 skills 完成集成、迁移和验证。
- 检查已安装能力与目标版本的差异。
- 从重复工作、失败模式和成功实现中提出 Capability 或 Skill 改进候选。

能力是否进入正式目录、版本是否升级以及安全边界如何定义，由团队评审确认。

#### 首批能力范围

- SwiftUI iOS 默认工程能力。
- 账号与身份能力。
- App 内反馈能力。
- 统一 API 网关能力。
- OSS 资源访问能力。
- TestFlight 交付准备能力。

### 3.8 统一平台底座

统一平台底座不是面向用户的独立工作产品，而是七个产品单元共同依赖的系统基础。

它提供：

- 组织、成员、产品和权限。
- 统一对象 ID、跨产品链接和关系图谱。
- 事件流、通知、订阅和状态投影。
- 文件、附件、日志和证据引用。
- GitHub、App Store Connect、TestFlight、账号、网关和云服务集成。
- Secret 引用、审计和安全策略。
- Web、桌面端、SDK、CLI 和 Runtime 使用的公共 API。

---

## 四、完整系统构成

### 4.1 平台服务的角色

#### App 用户与测试用户

通过 TestFlight 或正式渠道使用被研发的 iOS App，提交问题和建议、补充信息，并验证修复结果。

#### 产品创意者与产品负责人

发现产品机会、形成 ProductIdea、判断是否立项、确定产品目标和优先级，并对重要产品决策负责。

#### 产品与设计协作者

定义用户场景、产品行为、交互、视觉和验收预期，持续根据研发和用户反馈调整产品方案。

#### iOS 与其他客户端开发者

建设客户端功能，接入平台 Capability，在本地使用 Xcode、Codex 和 Developer Workbench 完成实现、诊断和验证。

#### 服务端开发者

建设目标 App 所需的业务服务、数据、账号、网关和集成能力，并通过相同的 Work、Case 和交付链路协作。

#### Web 开发者

建设目标产品配套的 Web 页面、运营后台或分享页面，与客户端和服务端共同推进同一个 Product。

#### 测试与发布协作者

组织测试、验证 Build、确认 Release Candidate，并完成需要人工授权的 TestFlight 或正式发布操作。

#### 反馈处理者

理解用户问题，确认反馈分类和处理方式，将需要研发的内容送入 Work Hub，并在版本交付后完成反馈闭环。

同一个团队成员可以承担多个角色。角色只表达在产品流程中的责任，不要求固定组织岗位。

### 4.2 系统运行载体

完整系统横跨用户设备、开发者设备、团队 Web、平台服务器、执行环境和外部服务。

```text
┌──────────────────────────────────────────────────────────────┐
│ App 用户                                                     │
│ iOS App + Feedback SDK + 用户反馈记录                         │
└──────────────────────┬───────────────────────────────────────┘
                       │ Feedback / Version / Usage Evidence
                       ▼
┌──────────────────────────────────────────────────────────────┐
│ 团队 Web                                                     │
│ Product Studio │ Work Hub │ Delivery │ Feedback │ Capability │
└──────────────────────┬───────────────────────────────────────┘
                       │ Platform API / Event Stream
┌──────────────────────▼───────────────────────────────────────┐
│ 平台服务器                                                   │
│ 业务服务 │ Automation Control │ 统一对象关系 │ 集成与权限       │
└───────────────┬───────────────────────────────┬──────────────┘
                │                               │
                ▼                               ▼
┌──────────────────────────────┐   ┌───────────────────────────┐
│ 开发者设备                   │   │ 云端或外部执行环境          │
│ Developer Workbench          │   │ Agent Worker / CI / Adapter │
│ Codex CLI/Desktop + Xcode    │   └─────────────┬─────────────┘
│ Local Repo + Arckit Facts    │                 │
└───────────────┬──────────────┘                 │
                └──────────── Evidence / Result ─┘
                       │
                       ▼
┌──────────────────────────────────────────────────────────────┐
│ GitHub │ App Store Connect │ TestFlight │ 阿里云及目标 App 服务 │
└──────────────────────────────────────────────────────────────┘
```

### 4.3 各产品表面

#### 团队 Web

团队 Web 是共享产品视图，提供 Product Studio、Work Hub、Delivery Center、Feedback Hub 处理台和 Capability Hub。Automation Runtime 的状态、证据和控制入口也通过 Web 呈现。

#### Developer Workbench

Developer Workbench 是平台本地桌面端。它管理本地 Workspace、连接 Agent 与开发工具、处理设备级权限和确认，并把本地结果同步到平台。

#### Codex CLI/Desktop 等开发工具

这些工具是开发者执行语义工作的主要入口。它们通过项目事实、skills、Case 上下文和结构化回传协议与平台协同。

#### iOS App 与 Feedback SDK

被研发的 App 是平台闭环的实际成果。Feedback SDK 是 App 与 Feedback Hub 的标准连接，使用户问题、版本和研发处理可以持续关联。

#### 平台服务器

平台服务器承载七个产品单元的共享业务数据、自动化控制状态、事件、权限、通知和外部集成。它同时向 Web、桌面端、SDK、CLI 和执行器提供 API。

#### 本地与云端执行器

执行器实际运行 Agent、命令、测试和外部操作。MVP 以本地 Codex 执行为主，后续可增加云端隔离 Worker 和 CI Adapter。

---

## 五、统一产品对象

目标产品单元通过一组共享业务对象连接，而不是依靠页面之间的松散跳转。

| 对象 | 含义 | 主要归属 |
|---|---|---|
| ProductIdea | 尚未立项、持续补充证据的产品候选 | Product Studio |
| Product | 团队正式建设和运营的软件产品 | Product Studio |
| ProductBlueprint | 产品用户、问题、价值、范围和关键决策 | Product Studio |
| ProductWorkspace | Product 与代码仓库、本地目录、项目事实、能力和交付环境的绑定 | Product Studio / Workbench |
| ProjectState | 当前产品工程的可恢复状态 | Arckit 项目事实 / Runtime |
| WorkItem | 需要团队安排和处理的工作 | Work Hub |
| Case | 持续推进某个 Project State 变化的上下文 | Automation Runtime |
| Loop | Case 的一次有边界推进循环 | Automation Runtime |
| Run | Agent、开发工具、CI 或 Adapter 的一次实际执行 | Automation Runtime / Workbench |
| Handoff | 需要另一位成员或另一种执行方式接力的工作 | Work Hub |
| Decision | 产品、范围、技术、质量或发布判断及依据 | 对应产品单元 |
| Evidence | 支撑状态变化的文档、代码、测试、日志、构建或确认 | Runtime / Workbench / Delivery |
| Build | 可安装或可测试的软件构建 | Delivery Center |
| Release | 面向某个渠道和用户群交付的版本 | Delivery Center |
| Feedback | 用户提交的问题、建议或对话 | Feedback Hub |
| Capability | 产品可以选择和复用的软件能力 | Capability Hub |
| SkillSetVersion | 某次执行实际使用的 Agent 能力版本快照 | Capability Hub / Runtime |

这些对象形成平台主关系：

```text
ProductIdea → Product → ProductWorkspace → ProjectState
                    │              │
                    │              ├→ WorkItem → Case → Loop → Run
                    │              │                    │
                    │              │                    └→ Evidence / Handoff
                    │              │
                    │              ├→ Build → Release
                    │              │            │
                    │              └← Feedback ←─┘
                    │
                    └→ Capability Selection → SkillSetVersion
```

---

## 六、各产品如何串联

### 6.1 从产品创意到首个 TestFlight 版本

1. 产品创意者在 Product Studio 创建或同步 ProductIdea。
2. 平台中的 AI 能力帮助整理目标用户、问题、证据、MVP、风险和验证计划。
3. 团队在同一个 ProductIdea 中讨论并记录立项决定。
4. ProductIdea 提升为 Product，创建 ProductBlueprint 和 ProductWorkspace。
5. Capability Hub 根据产品目标和技术栈给出首批能力建议。
6. Work Hub 形成产品定义、工程初始化、账号、反馈、后端和发布准备等 WorkItem。
7. 需要持续执行的 WorkItem 创建 Case，并由 Automation Runtime 启动 Loop。
8. Developer Workbench 在本地绑定仓库、项目事实、skills 和 Codex 类工具。
9. 开发者与 AI 在同一个 Case 内完成实现、验证、人工接力和结果回传。
10. Delivery Center 汇总 Build、变更、验证结果和 TestFlight checklist。
11. 有权限的团队成员确认 Release Candidate，并发布给测试用户。

### 6.2 从用户反馈到修复验证

1. 测试用户在 iOS App 中通过 Feedback SDK 提交反馈。
2. Feedback Hub 自动关联 App、用户或设备、系统版本和当前 Build。
3. AI 能力提出归并、分类、影响范围和澄清建议。
4. 反馈处理者确认反馈，必要时与用户继续沟通。
5. 需要研发的反馈创建 WorkItem，并保留 Feedback 关系。
6. WorkItem 进入人工开发或 Automation Runtime 的 Case。
7. Developer Workbench 或云端执行器完成修复并提供 Evidence。
8. Delivery Center 将修复纳入新 Build，并关联原 Feedback。
9. 用户升级 TestFlight 版本后确认结果。
10. Feedback Hub 同步 fixed、answered、rejected 或 deferred 状态。
11. 多条反馈形成的产品趋势可以回到 Product Studio，成为产品改进或新 ProductIdea 的证据。

### 6.3 人工接手与重新交回自动化

1. Runtime 在缺少产品判断、权限、凭证、设备操作或充分证据时创建 Handoff。
2. Handoff 进入 Work Hub 中对应成员的个人队列。
3. 接手者看到 Product、Case、已完成工作、失败原因和明确请求。
4. 人工完成判断、配置、代码修改或验证，并补充结果与 Evidence。
5. Work Hub 将结果写回原 Case。
6. Case 可以由同一开发者继续，也可以重新启动 Automation Loop。

人工与自动化围绕同一个 Case 接力，不需要另建一条失去上下文的任务链。

### 6.4 从一次成功实践到可复用能力

1. 某个 Product 完成账号、反馈、网关、OSS 或发布能力接入。
2. Workbench 与 Runtime 保存实际使用的 Skill、配置契约和验证证据。
3. AI 能力识别其中可以复用的步骤、约束和失败模式。
4. Capability Hub 生成能力改进候选。
5. 团队评审后更新 Capability、Skill、模板或验证清单。
6. 后续 Product 选择新版本能力，获得更稳定的接入路径。

---

## 七、人和 AI 如何基于平台协作

AI 不作为一个需要团队分配工作的独立组织角色。它作为各产品中的分析与执行能力，由平台在明确上下文、权限和验收条件下调用。

| 产品单元 | AI 主要完成 | 人主要完成 |
|---|---|---|
| Product Studio | 整理创意、分析证据、形成草案、比较选项、提示风险 | 判断产品价值、立项、优先级和关键范围 |
| Work Hub | 提取工作、补全上下文、生成摘要、建议分配和识别重复项 | 确认计划、责任、优先级和需要处理的接力 |
| Developer Workbench | 编码、文档、诊断、测试、审查、结果总结 | 提供目标、审阅结果、处理本地权限和复杂实现判断 |
| Automation Runtime | 理解状态缺口、选择能力、执行语义工作、提出下一步 | 定义自动化边界、处理 Gate、确认敏感或关键状态变化 |
| Delivery Center | 汇总变更、检查材料、分析失败、生成测试重点 | 验证质量、确认 Release Candidate 和正式发布 |
| Feedback Hub | 聚类、分类、澄清、关联历史事项、生成回复和工作草案 | 确认反馈事实、处理方式、产品取舍和关闭条件 |
| Capability Hub | 推荐能力、形成接入计划、检查差异、发现复用候选 | 确认能力标准、安全边界、版本和正式发布 |

### 7.1 默认协作模式

平台支持三种工作模式，并允许在同一个 Case 中切换：

- AI 执行优先：适用于目标明确、上下文充分、风险可控且验收可自动化的工作。
- 人类主导：适用于产品判断、体验取舍、高风险操作和需要深度业务理解的工作。
- 人机协作：人定义目标和边界，AI 执行分析或实现，人审阅关键结果，再由 AI 完成后续验证和收口。

### 7.2 协作的共同语言

无论工作由谁完成，都使用同一组信息：

- 当前 Product 和 ProductBlueprint。
- 当前 ProductWorkspace 与 ProjectState。
- WorkItem 和 Case 的目标、边界与完成条件。
- 相关产品、交互、视觉和技术事实。
- 可使用的 Capability 与 SkillSetVersion。
- 运行过程、Evidence、风险和待确认项。
- 下一步责任和恢复条件。

### 7.3 人类确认重点

平台应优先把以下事项呈现给人确认：

- 是否立项以及投入优先级。
- 产品范围和体验取舍。
- 需求、架构或数据边界的关键决定。
- 涉及账号、密钥、生产数据和外部发布的操作。
- AI 结果证据不足或存在多种合理方案。
- Release Candidate 是否达到目标质量。
- 用户反馈是否成立、是否值得开发以及是否可以关闭。

---

## 八、系统架构

### 8.1 逻辑架构

```text
体验产品层
  Product Studio │ Work Hub │ Developer Workbench
  Delivery Center │ Feedback Hub │ Capability Hub
                         │
统一业务层
  Product │ Workspace │ Work │ Feedback │ Delivery │ Capability
                         │
研发状态与自动化层
  ProjectState │ Case │ Loop │ Run │ Handoff │ Evidence
  Automation Runtime │ Arckit Protocol
                         │
执行层
  Codex 类 Agent │ Local Worker │ Cloud Worker │ CI │ External Adapter
                         │
平台底座与集成层
  Identity │ Permission │ Event │ Relation │ Notification │ Secret Ref
  GitHub │ App Store Connect │ TestFlight │ App Backend │ AliCloud
```

### 8.2 Arckit 在系统中的位置

Arckit 提供跨产品、跨 Agent 和跨执行环境的研发协作语义：

- Project State 表达可恢复的项目状态。
- Case 承载一个持续推进事项的上下文。
- Loop 约束一次推进周期。
- Handoff、Pending、Evidence 和 State Delta 支撑接力与状态写回。
- spec、interaction、visual、tech 和 agent context 等项目事实让不同开发工具从同一预期继续。
- skills 为 Agent 提供可安装、可复用的工作方法。

这些能力不会表现为一个孤立的“Arckit 页面”，而会进入 Product Studio、Work Hub、Workbench、Runtime、Delivery 和 Capability Hub 的具体产品体验。

### 8.3 Automation Runtime 在系统中的位置

Automation Runtime 是运行控制产品，负责把 Arckit 的项目状态和协作协议转化为真实执行：

```text
读取 Product / ProjectState / Case
  → 形成本轮目标与执行边界
  → 选择 Capability / Skill / Executor
  → 启动 Run
  → 收集 Report / Evidence
  → 执行 Gate
  → 更新 Case / Work / ProjectState
  → 结束、继续或转 Handoff
```

Runtime 保持执行过程确定、可追踪和可恢复；AI 模型与 Agent 可以替换，Case 和项目状态仍然连续存在。

### 8.4 事实与数据归属

| 信息 | 主要事实来源 | 平台中的使用方式 |
|---|---|---|
| ProductIdea、Product、Work、Handoff、平台权限 | 平台业务数据库 | Web、桌面端和 Runtime 共同读取 |
| 产品规格、交互、视觉、技术与项目上下文 | Product 仓库中的 Arckit facts | 平台索引、预览并引用对应版本 |
| ProjectState、Case 和 Loop 收口 | Arckit ledger / 关联 commit | 平台形成可查询状态投影 |
| Run、事件、报告和原始日志 | Runtime Event Store | 项目事实保存摘要和证据引用 |
| 代码、commit、PR 和 CI | GitHub / Git 仓库 | 平台建立关联与状态投影 |
| Build、TestFlight 和 Release | Delivery Center 与外部发布平台 | Product、Work 和 Feedback 共同引用 |
| Feedback、用户对话和附件 | Feedback Hub | Work、Release 和 Product Insight 引用 |
| Capability、Skill 和版本 | Capability Hub 与 Skill 来源仓库 | Workbench 和 Runtime 使用版本快照 |
| 密钥和证书 | 系统钥匙串或 Secret Store | 平台只保存安全引用和配置状态 |

平台通过统一 ID、版本引用和事件关联不同事实来源，避免在多个系统中维护互相冲突的正式副本。

---

## 九、MVP 产品规划

### 9.1 MVP 目标

MVP 使用一个真实 2C iOS App 跑通两条完整链路：

1. 从 ProductIdea、立项和研发初始化，到首个可供测试用户安装的 TestFlight Build。
2. 从 App 内真实反馈，到确认、研发处理、新 Build、状态同步和用户验证。

MVP 的目标不是证明每个产品单元功能丰富，而是证明七个目标产品单元能够围绕同一个 Product、同一套工作状态和同一条用户价值链协作。

### 9.2 MVP 中的最小产品能力

#### Product Studio

- ProductIdea 创建、文档同步、讨论和立项。
- Product、ProductBlueprint 和 ProductWorkspace。
- Product 全局进展概览。

#### Work Hub

- WorkItem、个人队列、产品队列和优先级。
- Handoff、待确认事项和人工处理回写。
- 与 Feedback、Case、Run、PR 和 Build 的关系。

#### Developer Workbench

- 平台登录和 ProductWorkspace 绑定。
- 本地仓库、Codex app-server/CLI 和 Xcode 连接。
- SkillSet 检查、任务启动、确认和结果回传。

#### Automation Runtime

- 单个本地 Codex Worker 的 Case、Loop 和 Run。
- Execution Gate、Worker Report、Evidence 和状态写回。
- 失败转 Handoff，人工处理后恢复原 Case。

#### Delivery Center

- Build、Release Candidate 和 TestFlight checklist。
- commit、WorkItem、Feedback、已知问题和测试结果关联。
- 人工发布记录和测试用户验证。

#### Feedback Hub

- iOS Feedback SDK 和用户提交入口。
- 人工处理、AI 辅助归并与澄清。
- Feedback 转 WorkItem。
- 修复 Build 与反馈状态同步。

#### Capability Hub

- 首批 Capability 目录。
- Product 能力选择。
- SkillSetVersion 快照、安装检查和最小验证记录。

### 9.3 MVP 主业务流程

```text
ProductIdea
  → 团队立项
  → Product / ProductWorkspace
  → 选择 SwiftUI、账号、反馈、网关、OSS、TestFlight Capability
  → WorkItem / Case
  → 本地 Workbench + Codex 完成初始化和首批功能
  → 人工 Handoff 与恢复
  → Build / TestFlight
  → 用户提交真实 Feedback
  → AI 辅助理解 + 人工确认
  → Feedback 转 WorkItem / Case
  → 修复与新 Build
  → Feedback 状态同步与用户验证
```

### 9.4 MVP 验收标准

1. 产品负责人可以创建并批准一个 ProductIdea，形成正式 Product。
2. Product 可以绑定 GitHub 仓库、本地工程、Arckit facts 和所选 Capability。
3. 团队成员可以在 Work Hub 看到自己需要处理、确认或接力的事项。
4. Developer Workbench 可以恢复 Product、WorkItem 和 Case 上下文，并启动真实 Codex 执行。
5. Runtime 可以记录 Run、Report、Evidence、失败原因和下一步状态。
6. AI 遇到需要人工判断或操作的节点时，可以生成可处理的 Handoff；处理后能够恢复原 Case。
7. Delivery Center 可以形成一个关联代码、工作和测试结果的 TestFlight Build。
8. 测试用户可以在 App 内提交带版本信息的真实反馈。
9. Feedback Hub 可以使用真实 AI 能力提供归并、澄清和事项草案，并由人确认。
10. 反馈处理完成后可以关联新 Build、同步状态并请求用户验证。
11. 团队可以从 Product 一路追踪到 Work、Case、Run、commit、Build、Feedback 和最终结果。

### 9.5 MVP 阶段边界

MVP 优先完成单团队、单个真实 iOS Product、本地 Agent 执行和 TestFlight 闭环。以下能力在纵向闭环稳定后继续建设：

- 大规模云端并行 Worker。
- 多组织商业化、计费和复杂配额。
- 全自动 App Store 正式发布。
- 无人工确认的反馈处置。
- 完整市场数据自动采集。
- 面向所有技术栈的 Capability 体系。

---

## 十、产品演进路线

### 阶段一：产品概念与统一模型

目标是让团队对产品组合、目标用户、核心对象、系统边界和闭环形成共同理解。

主要结果：

- 确认七个产品单元及统一平台底座。
- 确认 Product、ProjectState、Work、Case、Loop、Run、Release、Feedback 和 Capability 的关系。
- 确认团队 Web、本地 Workbench、Runtime、iOS App 和外部系统的分工。
- 选择首个真实 iOS Product。

### 阶段二：纵向闭环 MVP

目标是跑通创意到 TestFlight、反馈到修复验证两条链路。

主要结果：

- 七个产品单元均提供支撑主链路的最小能力。
- 本地 Codex 执行进入真实 Runtime。
- Feedback Hub 和 Work Hub 接入真实 AI 能力。
- Product、Work、Run、Build 和 Feedback 可以端到端追踪。

### 阶段三：自动化可靠性与多开发者协作

目标是让更多研发工作可以稳定交给 AI，同时让不同开发者自然接力。

主要结果：

- 更完整的执行权限、证据、失败分类、重试和恢复。
- iOS、服务端、Web、测试和发布工作围绕同一 Product 协作。
- 云端隔离 Worker 和 CI Adapter。
- Capability 版本、验证和复用闭环。

### 阶段四：多产品研发与运营

目标是让团队并行建设和运营多个 2C App。

主要结果：

- 产品组合、跨产品工作队列和资源视图。
- 统一质量、交付、反馈和产品学习指标。
- Capability 在不同 Product 中复用和持续升级。
- 产品经验、研发经验和用户反馈共同进入下一轮决策。

### 阶段五：平台化与生态扩展

目标是把团队自用能力演进为可配置、可分发的平台产品。

主要结果：

- 多组织和团队版 SaaS。
- Capability、Skill、Template 和 Domain Pack 生态。
- 更多 Agent、开发工具、代码平台和发布渠道集成。
- 从 iOS 扩展到更多软件产品形态。

---

## 十一、现有能力作为目标产品的输入来源

现有项目是能力、经验和验证结果的来源，不直接决定目标产品边界。后续可以根据目标产品需要选择：

- 保留：现有产品边界和体验已经适合目标用户。
- 整合：能力进入新的目标产品，现有项目不再独立演进。
- 拆分：不同能力分别进入多个目标产品或平台底座。
- 重构：保留业务经验和契约，重新实现产品与技术形态。
- 替换或停止：已有方向不再符合目标产品价值。

### 11.1 能力来源映射

| 目标产品 | 可参考的现有来源 | 主要可吸收内容 |
|---|---|---|
| Product Studio | Arckit idea/thinking/spec skills、Arcflow、Arc | 创意分析、产品事实、项目/产出物组织和 Web 产品经验 |
| Work Hub | Workshop Todo、Workshop Feedback、Arcflow Item/Handoff 探索 | 轻量待办体验、反馈转工作、个人队列、运行阻塞和接力 |
| Developer Workbench | Workshop Desktop、ArcOrbit Desktop 探索 | 本地项目绑定、Codex app-server、确认页、CLI、受限回写和运行观察 |
| Automation Runtime | ArcOrbit、Arckit Controller/Worker Loop、Arcflow 自动执行探索 | ProjectState/Case/Loop、packet/report/gate、运行事件、Agent adapter 和恢复 |
| Delivery Center | Arc、Arckit delivery/code skills、现有 GitHub/TestFlight 实践 | 版本、产出物、发布准备、外部集成和验证清单 |
| Feedback Hub | Workshop Feedback | SDK、反馈提交、人工处理、转待办、状态同步和已验证的业务闭环 |
| Capability Hub | Arckit、Arckit-code、ArcForge | Skills、技术栈能力、安装同步、版本、profile 和 drift 治理 |
| 统一平台底座 | Arcflow、Arc、Workshop 系列阿里云部署 | 账号、组织、权限、API、事件、GitHub、部署和 SaaS 工程经验 |

### 11.2 各来源的规划定位

#### Arckit

作为研发协作语义、项目事实协议和 Agent skill 体系的主要来源。它的概念进入多个目标产品，尤其是 Product Studio、Workbench、Runtime 和 Capability Hub。

#### ArcOrbit

作为 Automation Runtime 的核心验证来源。后续重点是评估现有 kernel、Desktop 和协议中哪些进入正式运行产品，哪些应归入 Workbench 或平台底座。

#### Arcflow

作为 Web/Server 控制面、项目与运行观察、多 Agent 执行探索的来源。其现有页面、对象和流程需要按目标产品重新归属，不预设 Arcflow 整体就是未来平台。

#### Workshop Desktop

作为 Developer Workbench 的重要来源。保留其已经验证的本地项目、Codex 调度、安全确认和结果回传经验，并根据目标体验决定整合或重构方式。

#### Workshop Feedback

作为 Feedback Hub 的直接业务来源。现有完整闭环具有真实使用价值；后续重点是加入真实 AI 能力、统一 Product/Work/Release 关系，并评估现有前后端是否继续独立存在。

#### Workshop Todo Website

作为 Work Hub 轻量任务体验和当前团队使用习惯的来源。未来 Work Hub 需要覆盖 WorkItem、Handoff、Approval 和自动化关联，现有 Todo 可以保留为入口、被整合或逐步替换。

#### Arc

作为组织、权限、项目、版本、产出物、GitHub、Agent adapter 和 SaaS 工程经验的来源。按目标领域边界选择性吸收，不把其现有完整产品结构作为目标模板。

#### Arckit-code

作为 Capability 技术实现方法的主要来源，为 iOS、账号、反馈、OSS、网关和发布等能力提供可执行 skills。

#### ArcForge

作为 Capability Hub 中 Skill 来源、安装、同步、版本和 drift 治理的能力来源。

### 11.3 后续整合决策原则

每个现有项目是否保留或整合，应依次回答：

1. 它服务的是哪个目标产品和哪类用户。
2. 它是否已经形成稳定、被验证的用户价值。
3. 它的领域模型是否符合统一产品对象。
4. 它是否可以通过清晰契约独立存在。
5. 保留现状、整合、拆分、重构或替换，哪种方式最有利于目标闭环。

代码仓库关系和服务部署关系在产品边界确认后再进行架构决策。

---

## 十二、团队需要对齐的产品共识

团队评审本文时，建议优先确认：

1. 平台是否统一定位为“覆盖产品构思、研发、交付和反馈学习的 AI 原生软件产品研发平台”。
2. 七个目标产品单元是否完整，是否存在需要合并、拆分或补充的用户价值边界。
3. Product 是否作为业务主线，ProjectState 是否作为工程恢复主线。
4. WorkItem、Case、Loop 和 Run 的职责是否清晰。
5. 团队 Web、本地 Developer Workbench、Automation Runtime 和被研发 App 的关系是否符合实际工作方式。
6. AI 是否应以产品内能力存在，并统一使用上下文、证据、Gate 和 Handoff。
7. Feedback 是否同时服务用户沟通、研发跟进和产品学习。
8. Capability 是否作为产品可以选择、Runtime 可以执行、团队可以验证和升级的复用单元。
9. MVP 是否以一个真实 iOS Product 同时验证“创意到 TestFlight”和“反馈到修复版本”。
10. 现有项目是否统一按能力来源评估，而不提前承诺未来产品与仓库边界。

---

## 十三、规划成功标准

当平台产品概念落地后：

- 产品创意、产品定义、研发状态、交付版本和用户反馈围绕同一个 Product 连续存在。
- 每个团队成员都能看到自己当前需要判断、处理、确认或接力的工作。
- 开发者可以继续使用熟悉的 Codex、Xcode、Git 和 GitHub，同时自然进入平台协作闭环。
- AI 能够在产品分析、工作组织、实现、诊断、交付和反馈处理中发挥真实作用。
- AI 执行具有明确上下文、权限、证据、失败原因和恢复方式。
- 被研发的 iOS App、测试用户和反馈记录成为研发系统的组成部分。
- 一条真实反馈能够追踪到 Work、Case、Run、commit、Build、状态回传和用户验证。
- 软件能力能够被不同 Product 选择、复用、验证和升级。
- 团队可以在同一产品架构上持续建设更多 2C App，并逐步提高自动化程度。

---

## Current Judgment

当前建议采用“七个目标产品单元 + 一个统一平台底座”的产品结构，作为团队进一步讨论的基线：

1. Product Studio。
2. Work Hub。
3. Developer Workbench。
4. Automation Runtime。
5. Delivery Center。
6. Feedback Hub。
7. Capability Hub。
8. 统一平台底座。

这一结构来自完整用户旅程和产品闭环，而不是现有仓库的简单映射。现有项目只作为能力来源，后续在产品边界确认后再决定保留、整合、拆分、重构或替换。

## Process Handoff

- Kind: controller_product_analysis_handoff
- Source: Controller product worker packet
- Target Candidate Skills: arckit-spec, arckit-interaction, arckit-tech
- Source Refs:
  - 用户关于目标产品视角、角色边界和 AI 表达方式的纠偏
  - `arckit/spec/agentic-software-development/product-concepts.md`
  - `arckit/spec/agentic-software-development/product-architecture.md`
  - `arckit/spec/agentic-software-development/controller-worker-loop.md`
  - `arckit/spec/agentic-software-development/skill-architecture.md`
  - `runtime/arcorbit/README.md`
  - `../../hoewo/arcflow/arckit/spec/arcflow-framework/product-architecture.md`
  - `../../hoewo/workshop-desktop/README.md`
  - `../../hoewo/workshop-desktop/docs/domain.md`
  - `../../hoewo/workshop-feedback/specs/main/idea/idea.md`
  - `../../hoewo/workshop-todo-website/frontend/script/架构和部署技术方案总结.md`
  - `../../zqshi/arc/README.md`
  - 用户对已运行 Workshop Feedback 与 Workshop Todo 能力的补充

### Accepted Facts

- 目标文档应从最终产品理念和用户价值出发，而不是以介绍现有项目为主。
- 现有项目均为输入材料和能力来源，不预设未来产品、仓库或服务边界。
- 完整系统包含 App 用户、产品团队、各类目标应用开发者、被研发的 iOS App、Codex 类工具、平台本地桌面端、Web 端、服务器、执行环境和外部服务。
- 本文角色只描述平台服务的用户，不包含建设或维护平台基础设施本身的人员。
- AI 作为各产品中的分析和执行能力表达，不作为独立团队角色拆分。
- Workshop Feedback 已形成 SDK、反馈提交、人工处理确认、转待办、状态同步的业务闭环。
- Workshop Todo 当前主要提供团队日常使用的待办列表。
- Workshop Feedback 与 Workshop Todo 当前尚未对接真实 AI 能力。
- Arckit 的核心产品主轴是 Project State 通过 Case 和 Loop 持续推进。
- 首个框架 MVP 面向真实 2C iOS App 建设与 TestFlight 反馈闭环。

### Assumptions

- 七个逻辑产品单元能够完整覆盖目标用户旅程，但正式命名和边界仍需团队确认。
- Product Studio、Work Hub、Delivery、Feedback 和 Capability 在 MVP 阶段可以共享一个团队 Web Shell。
- Automation Runtime 可以同时协调本地和未来云端执行环境。
- Feedback Hub 可以在保留现有业务价值的同时接入统一 Product、Work 和 Release 模型。

### Gaps

- 七个产品单元的最终命名、独立程度和产品导航尚未确认。
- 核心对象的正式领域模型、状态机和权限模型尚未定义。
- Team Web、Developer Workbench、Runtime 和 Feedback SDK 的正式交互架构尚未形成。
- 统一平台底座与各产品单元的服务边界尚未形成技术方案。
- 首个真实 iOS 试点 Product 尚未指定。
- 现有项目的保留、整合、拆分、重构和停止决策尚未开展。

### Risks

- Product Studio、Work Hub 和 Automation Runtime 之间可能出现对象职责重叠。
- 团队 Web 数据、Git 中的 Arckit facts 和 Runtime 事件可能产生事实边界不清。
- 如果过早按现有仓库确定目标产品，可能限制最终用户体验和领域模型。
- 如果只建设 AI 执行能力而忽略人工接力、交付和反馈，平台将无法形成完整产品闭环。
- 如果 MVP 同时扩展过多产品和技术栈，可能无法验证首个纵向闭环。

### Rejected Items

- 按现有项目逐个介绍并将它们直接定义为未来产品模块。
- 把平台基础设施建设者或维护者作为本文产品角色。
- 把 AI Controller、Worker 或 Reflection 拆成独立团队参与者。
- 仅从服务端系统角度描述平台。
- 在产品概念确认前决定所有仓库合并和系统迁移方案。

### Suggested Next

- 团队先评审七个目标产品单元、角色和两条 MVP 闭环。
- 由 Controller 生成有界 product/tech worker packet，定义核心对象、状态、上下文边界和待确认问题。
- 使用 `arckit-spec` 将确认后的产品单元拆分为正式产品规格。
- 由 Controller 生成有界 tech worker packet，分析 Team Web、Workbench、Runtime、Feedback 和平台底座的系统拆分；确认后的结论由 `arckit-tech` 维护。
- 在目标边界明确后，对现有项目逐一形成保留、整合、拆分、重构或替换建议。

## Revisit When

- 团队完成产品概念评审并反馈产品单元调整意见。
- 准备把候选规划提升为正式产品规格和领域模型。
- 准备指定首个真实 iOS Product 并进入 MVP 设计。

## Related Areas

- `arckit/spec/agentic-software-development/`
- `runtime/arcorbit/`
- `arckit/pending/`

## Notes

- 本版优先定义目标产品、用户价值、产品组合、完整系统和人机协作。
- 现有项目只在“能力来源”部分出现，不承担文档主叙事。
- 本文中的产品单元是逻辑产品边界，不等同于代码仓库或部署单元。

## Outcome

待团队评审后填写。
