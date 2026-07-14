# AI 原生软件产品研发平台整体规划

## Status

- State: candidate
- Type: process_handoff
- Source: 用户目标、Arckit 产品规格、现有项目文档与代码、已运行平台业务事实
- Created: 2026-07-14
- Updated: 2026-07-14
- Decision: 作为团队整体规划对齐基线，讨论确认后拆分提升到正式产品规格与技术方案

## 文档定位

本文描述团队计划建设的完整 AI 原生软件产品研发平台。

它面向团队整体规划，统一说明：

- 平台要解决什么问题、形成什么产品价值。
- 用户、团队成员、AI、被研发的 iOS App、开发工具和平台系统如何共同组成完整系统。
- Web 端、本地桌面端、Agent 客户端、服务器、项目仓库、反馈平台和外部服务如何分工。
- 产品中心、工作中心、自动化执行中心、能力中心、发布中心和反馈中心如何串联。
- `arckit`、`arcflow`、`arc`、`workshop-desktop`、`workshop-feedback`、`workshop-todo-website`、`arckit-code` 和 `arcforge` 的现有能力如何进入目标架构。
- 人和 AI 如何在统一事实、权限和接力协议下协作完成软件研发。
- 框架 MVP 先跑通哪条真实业务链路，后续如何逐步扩展。

本文是一份正向产品规划。当前状态是团队讨论稿，重点是建立共同目标和系统边界；具体数据模型、接口契约、页面交互和仓库迁移方案将在本规划对齐后继续定义。

## 一、产品愿景

团队将建设一套覆盖软件产品全生命周期的 AI 原生研发平台。

平台从产品创意开始，连接立项、产品定义、研发工作区、工作项、AI 自动化、人类开发、验证、TestFlight、用户反馈、问题处理和能力沉淀，让一个产品从想法进入真实使用后仍然保持连续、可恢复、可追踪的研发状态。

平台的一句话定义是：

> 一个以 Product 为业务起点、以 Project State 为可恢复工程状态、以 Case 和 Loop 为推进内核、以 Capability 和 Skill 为执行能力、以 Build、Release 和 Feedback 为闭环回流的 AI 原生软件产品研发平台。

平台最终形成两条相互促进的闭环：

### 1. 产品交付闭环

```text
ProductIdea
  → 团队判断与立项
  → Product
  → ProductWorkspace
  → WorkItem
  → Case
  → Loop
  → 人类或 AI 执行
  → 验证与状态写回
  → Build / Release
  → TestFlight / 真实用户使用
```

### 2. 产品学习闭环

```text
用户反馈 / 运行结果 / 验收发现
  → Feedback / Evaluation / Pending
  → 人类确认与分流
  → WorkItem / Case
  → 修复、改进或产品判断
  → 新 Build / Release
  → 反馈状态同步与用户验证
  → Capability / Skill / Workflow Memory 候选
  → 人类确认后沉淀
  → 后续产品和任务复用
```

产品交付闭环让团队持续把想法变成真实软件；产品学习闭环让真实使用和研发经验持续提升后续交付质量。

## 二、完整系统范围

目标系统是由人、AI、软件产品、客户端、平台服务和外部服务共同构成的完整业务系统，而不是单一服务端应用。

系统包含以下参与者与运行载体：

### 1. 人类参与者

- 产品创意师：发现机会、形成创意、持续补充产品证据。
- 团队负责人：判断立项、优先级、研发模式、自动化边界和发布责任。
- 产品与设计协作者：定义产品行为、交互、视觉和验收预期。
- iOS 开发者：在本地项目中使用 Codex 类工具进行实现、诊断和验证。
- 基建能力维护者：沉淀账号、反馈、OSS、网关、发布等可复用能力。
- 反馈处理者：确认反馈真实性、处理方式和关闭条件。
- 测试用户：通过 TestFlight 使用产品、提交反馈并验证修复结果。

### 2. AI 参与者

- 产品分析 Agent：协助形成 ProductIdea、产品判断、规格草案和研究材料。
- Controller Agent：读取 Project State 和 Case，决定本轮要推进的状态缺口与最小执行路线。
- Worker Agent：在受控范围内完成产品、技术、实现、诊断、验证或收口工作。
- 反馈辅助 Agent：提供相似反馈归并建议、信息完整性判断和澄清建议。
- Reflection Agent：从运行和验收证据中识别可复用改进候选。

### 3. 被研发的软件产品

- 团队创建和维护的 2C iOS App。
- App 的本地代码仓库、GitHub 仓库和 `arckit/` 项目事实。
- App 的测试版、TestFlight Build、正式 Release 和运行环境。
- App 内集成的反馈 SDK、账号、网关、OSS 等基础能力。

### 4. 开发者使用的工具

- Codex CLI、Codex Desktop 或其他 Codex 类编码 Agent。
- 本地 IDE、Xcode、Git、GitHub CLI 和构建工具。
- 安装到 Agent 环境中的 `arckit`、`arckit-code` 和项目级 skills。
- 用于 skill 安装、同步和 drift 检查的 `arcforge`。

### 5. 平台自己的产品表面

- 平台 Web 端：团队共享的产品、工作、自动化、能力和发布控制面。
- 平台本地桌面端：连接本地仓库、Agent、用户确认和执行证据的 Local Workbench。
- 平台服务器：承载组织、产品、工作项、运行、集成、事件和权限能力。
- Feedback Center：接收和处理 App 用户反馈。
- 现有 Todo 平台：承载当前人类待办列表和轻量状态协作。

### 6. 外部系统

- GitHub：仓库、commit、branch、PR、Issue 和 CI。
- Apple Developer、App Store Connect、TestFlight：构建、发布和测试分发。
- 阿里云：服务器、API 网关、OSS、数据库和平台部署。
- 账号、短信、邮件、通知和其他团队基础服务。

## 三、系统总体架构

完整系统按“体验入口、业务控制、研发协议、执行运行、能力资产、基础设施”六层组织。

```text
┌─────────────────────────────────────────────────────────────────────┐
│                         人与真实软件产品                              │
│                                                                     │
│  产品创意师  团队负责人  iOS 开发者  基建维护者  反馈处理者  测试用户 │
│                                │                                    │
│                         2C iOS App + Feedback SDK                    │
└───────────────────────────────┬─────────────────────────────────────┘
                                │
┌───────────────────────────────▼─────────────────────────────────────┐
│                             体验入口层                               │
│                                                                     │
│  平台 Web 端      Local Workbench      Codex CLI/Desktop      Xcode │
│  产品/工作/运行     本地仓库/确认/执行     Agent 对话与工具执行        │
└───────────────────────────────┬─────────────────────────────────────┘
                                │
┌───────────────────────────────▼─────────────────────────────────────┐
│                             业务控制层                               │
│                                                                     │
│  Product Center   Work Center   Automation Center   Release Center │
│  Capability Center   Feedback Center   Decision / Handoff / Policy  │
└───────────────────────────────┬─────────────────────────────────────┘
                                │
┌───────────────────────────────▼─────────────────────────────────────┐
│                             研发协议层                               │
│                                                                     │
│  ProductWorkspace   Project State   Case   Loop   Handoff           │
│  Spec / Interaction / Visual / Tech / Pending / Evaluation          │
│  Agent Context   Workflow Memory   Evidence / State Delta           │
└───────────────────────────────┬─────────────────────────────────────┘
                                │
┌───────────────────────────────▼─────────────────────────────────────┐
│                             执行运行层                               │
│                                                                     │
│  Controller → Worker Packet → Agent Run → Worker Report             │
│       → Runtime Guard → Human Gate → Ledger Writeback               │
│                                                                     │
│  本地 Codex app-server / 未来云端 Worker / CI / 外部 Adapter         │
└───────────────────────────────┬─────────────────────────────────────┘
                                │
┌───────────────────────────────▼─────────────────────────────────────┐
│                             能力资产层                               │
│                                                                     │
│  Capability Registry   SkillSetVersion   arckit   arckit-code       │
│  项目级 skills   ArcForge   模板   验证清单   示例实现               │
└───────────────────────────────┬─────────────────────────────────────┘
                                │
┌───────────────────────────────▼─────────────────────────────────────┐
│                           基础设施与外部系统                          │
│                                                                     │
│  Platform API / DB / Event Store / Object Storage / Secret Store    │
│  GitHub / App Store Connect / TestFlight / AliCloud / Auth / OSS    │
└─────────────────────────────────────────────────────────────────────┘
```

### 架构核心关系

- Web 端负责团队共享视图、业务决策、状态观察和授权。
- Local Workbench 负责把云端控制面连接到开发者本地仓库和本地 Agent。
- Codex 类 Agent 负责语义理解、文档和代码执行、证据收集与结构化报告。
- Arckit Runtime 负责确定性的 packet、权限、report、gate 和 ledger 控制。
- `arckit/` 项目工作区保存可版本化、可恢复的软件项目事实。
- 平台服务器保存组织级业务对象、运行控制状态和跨项目关系。
- Feedback Center 保存反馈领域事实，并把可行动反馈送入研发闭环。
- Capability 与 Skill 让重复出现的研发能力可被不同 Product 复用。

## 四、核心产品模块

### 4.1 Product Center

Product Center 是团队管理产品机会和正式产品的共同入口。

它承载：

- ProductIdea 列表、详情、证据、讨论和状态。
- ProductIdea 的持续补充与版本历史。
- 团队负责人记录的产品决策。
- ProductIdea 到 Product 的立项提升。
- Product 的负责人、目标用户、当前阶段和研发模式。
- Product 的 ProductWorkspace、Build、Release、Feedback 和研发状态概览。

Product Center 回答：

> 团队正在观察哪些产品机会，哪些产品已经立项，每个产品当前处于什么状态。

第一版 ProductIdea 支持 Markdown 正文和结构化元数据。产品创意师可在 Codex 中使用 Arckit skills 形成草案，再通过 CLI、Local Workbench 或 Web 上传到 Product Center。

### 4.2 ProductWorkspace 与 Project State

ProductWorkspace 是一个正式 Product 的研发工作区绑定。

它连接：

- GitHub 仓库。
- 开发者本地目录。
- `arckit/` 项目事实目录。
- 当前技术栈和平台目标。
- 默认 SkillSetVersion。
- 已选 Capability。
- 构建、发布和环境配置引用。
- 当前 Project State 和 active Case。

Project State 是 ProductWorkspace 中最高层的可恢复工程状态。它表达：

- 产品和项目当前要达成什么目标。
- 产品、交互、视觉、技术等预期事实的成熟度。
- 当前实现已经覆盖什么。
- 哪些结果已经验证。
- 当前有哪些风险、未决项和 active Case。
- 下一步由人、AI 或外部系统继续什么。

平台 Web 端展示 Project State 的投影；Git 仓库中的 Arckit ledger 保持项目事实来源和完整证据引用。

### 4.3 Work Center

Work Center 是人类和 AI 共用的工作入口。

它承载：

- WorkItem 创建、分配、优先级和状态。
- 来自 Product、Feedback、Capability、Release 或人工输入的工作项。
- AI 自动化优先、人类主导或混合执行方式。
- 与 Case、Loop、Run、commit、PR 和 Build 的关联。
- Handoff、人工决策请求和外部等待事项。
- 当前谁需要处理什么，以及处理完成后交给谁。

WorkItem 是团队计划和分配单位；当一个 WorkItem 需要持续推进 Project State、经过多轮执行、验证或接力时，平台为它创建或绑定 Case。

### 4.4 Case 与 Loop Center

Case 是研发事项持续推进的工程承载对象，Loop 是 Case 的一次业务推进循环。

Case 保存：

- 要推进的 Project State gap。
- 目标状态和完成条件。
- 当前事实依据和约束。
- 允许与禁止的执行范围。
- 多轮执行、验证和接力结果。
- 关闭时产生的 Project State delta。

Loop 保存：

- 本轮为什么启动。
- 本轮选择了哪个状态缺口。
- 本轮使用哪些角色、skills 和执行器。
- 本轮产生哪些 report、evidence、change、pending 或 handoff。
- 本轮结果是 done、continue、needs_human、blocked 还是 external_wait。
- 下一步责任人和恢复方式。

WorkItem、Case、Loop 和 Run 保持明确分工：

| 对象 | 主要问题 |
|---|---|
| WorkItem | 谁需要做什么，如何排队和分配 |
| Case | 为什么持续推进，目标状态和证据要求是什么 |
| Loop | 这一次业务循环推进了什么 |
| Run | 某个 Agent 或外部执行器实际运行了什么 |

### 4.5 Automation Center

Automation Center 是 AI 自动化运行的观察和控制中心。

它展示：

- Controller 对本轮目标、gap 和 route plan 的判断。
- Execution Gate 和授权来源。
- Worker Packet、绑定 skill 和执行边界。
- Worker 状态、Agent 输出、命令、文件影响和错误。
- Worker Report、Evidence、Artifact Impact 和风险。
- Runtime Guard、Controller Review、Human Gate 和 Ledger Gate。
- Continue、Interrupt、Resume、Retry 和 Handoff。
- Project State 与 Case 写回结果。

Automation Center 不依赖用户阅读完整模型日志。它把运行过程转化为团队能够理解的状态、证据、阻塞和下一步责任。

### 4.6 Capability Center

Capability Center 管理团队可复用的软件研发和基础设施能力。

每个 Capability 至少包含：

- 能力名称和业务价值。
- 适用平台和产品场景。
- 输入参数与配置契约。
- 安全、权限和隐私边界。
- 依赖服务和外部系统。
- 对应 skills、模板、示例实现和版本。
- 自动化程度与人类确认点。
- 验证方式和通过证据。
- 已接入 Product 和使用记录。

首批 Capability 包括：

- SwiftUI iOS 默认工程。
- 账号与身份接入。
- Feedback SDK 与反馈平台接入。
- OSS 图片可控访问。
- 统一 API 网关。
- TestFlight 发布准备。

Capability 是产品可选择的能力；Skill 是 Agent 执行能力时使用的方法包；ArcForge 负责 Skill 的来源、安装、同步、审计和 drift。

### 4.7 Release Center

Release Center 连接研发结果和真实用户使用。

它承载：

- Build、版本号、构建号和代码 commit。
- Release Candidate 和目标环境。
- TestFlight checklist 和人工操作 Handoff。
- App Store Connect、签名、证书、隐私声明和权限说明状态。
- 当前 Build 对应的 WorkItem、Case、修复内容和已知问题。
- Feedback 的发现版本、修复版本和用户验证版本。

Release Center 让“开发完成”继续推进为“真实用户可以验证的版本”，并为反馈闭环提供准确版本锚点。

### 4.8 Feedback Center

Feedback Center 继续承载完整反馈业务闭环：

```text
App SDK
  → 用户提交反馈、截图、日志和设备信息
  → Feedback Center 接收
  → 人工处理者查看、确认和补充
  → 转为 WorkItem
  → 人类或 AI 研发处理
  → 关联修复 Build
  → 状态同步给反馈平台和用户
```

AI 在 Feedback Center 提供：

- 相似反馈归并建议。
- 反馈类型和影响范围建议。
- 信息完整性判断。
- 面向用户的澄清问题建议。
- 与历史 WorkItem、Case 和 Release 的关联建议。

反馈处理者负责最终确认反馈是否合并、是否进入研发、由谁处理以及何时关闭。

### 4.9 Local Workbench

Local Workbench 是平台自己的本地桌面端，是云端平台与本地软件研发环境之间的安全执行桥。

它负责：

- 管理本地 ProductWorkspace 和目录绑定。
- 登录平台并同步当前用户的 Product、WorkItem 和 Handoff。
- 打开本地仓库、Xcode、Codex CLI 或 Codex Desktop。
- 检查和安装所需 skills。
- 执行 ArcForge drift check。
- 展示 Controller Packet 和执行授权。
- 启动本地 Codex app-server worker。
- 展示本地 Run、证据、错误和下一步状态。
- 提供高影响操作确认页。
- 回传 Worker Report、commit、PR、Build 和 Handoff 结果。
- 在断网或平台不可用时保留可恢复的本地工作状态。

Local Workbench 不替代 Codex、Xcode 或 GitHub。它把这些工具放到统一的产品上下文、Case、Loop 和授权模型中。

### 4.10 平台 Web 端

平台 Web 端是团队共享控制面。

主要导航建议为：

- Products：ProductIdea、Product、Workspace、Release 和 Feedback 概览。
- Work：WorkItem、Case、Handoff 和个人工作队列。
- Automation：Loop、Run、Agent、Gate、Evidence 和恢复操作。
- Capabilities：Capability、SkillSet、验证和使用情况。
- Feedback：进入或嵌入 Feedback Center。
- Settings：组织、成员、角色、集成、策略和通知。

Product Center、Work Center、Automation Center、Capability Center 和 Release Center 是同一个 Web 产品中的不同业务视图，共享统一身份、对象链接和事件时间线。

### 4.11 平台服务器

平台服务器由业务服务、运行控制服务、集成服务和基础服务组成。

业务服务包括：

- Identity / Organization Service。
- Product / ProductIdea Service。
- Workspace / Project State Projection Service。
- WorkItem / Case Link Service。
- Release / Build Service。
- Capability Registry Service。
- Decision / Comment / Handoff Service。

运行控制服务包括：

- Automation Runtime API。
- Controller / Worker Scheduler。
- Run Event Store。
- Evidence / Artifact Reference Service。
- Gate / Ledger Sync Service。
- Notification / Human Gate Service。

集成服务包括：

- GitHub Integration。
- Local Workbench Connection。
- Feedback Integration。
- Todo Integration。
- App Store Connect / TestFlight Adapter。
- ArcForge / Skill Registry Adapter。
- 阿里云 OSS、网关和部署适配。

平台服务器负责跨项目和跨执行端的确定性状态、权限、事件与关联；Agent 负责需要语义理解和判断的工作。

## 五、核心领域对象及关系

### 5.1 组织和人员

- Organization：团队或组织空间。
- Member：组织成员。
- Role：成员在产品、反馈、能力和发布场景中的职责。
- Automation Policy：组织或 Product 对 AI 自动执行范围的约束。

### 5.2 产品对象

- ProductIdea：尚未立项的产品候选。
- Decision：围绕创意、立项、优先级、方案和发布的决策记录。
- Product：已经进入正式建设和持续运营的产品。
- ProductWorkspace：Product 与代码仓库、本地目录、Arckit facts、skills 和环境的研发绑定。

### 5.3 研发推进对象

- Project State：ProductWorkspace 当前可恢复的软件工程状态。
- WorkItem：团队分配、排队和跟踪的工作项。
- Case：持续推进某个 Project State gap 的研发事项。
- Loop：Case 的一次完整业务推进循环。
- Handoff：人、Agent、外部系统之间的结构化交接材料。

### 5.4 自动化对象

- Controller Plan：本轮 gap、路线、worker 和停止条件。
- Worker Packet：单个 Worker 的受控执行输入。
- AutomationRun：一次 Controller 或 Worker 的执行记录。
- Worker Report：Worker 的结构化结果。
- Evidence：文件、命令、测试、日志、截图、构建、commit 和外部结果引用。
- Gate Result：执行授权、report intake、runtime guard、human gate 和 ledger gate 结果。

### 5.5 能力对象

- Capability：产品可复用能力。
- Skill：Agent 可调用的方法和协议能力包。
- SkillSetVersion：某个 Workspace 或 Run 实际使用的 skill 版本集合。
- CapabilityValidation：能力接入和验证记录。

### 5.6 交付与反馈对象

- Build：一次可识别的软件构建。
- Release：面向 TestFlight 或生产环境的发布记录。
- Feedback：用户提交的反馈事实。
- FeedbackGroup：经人工确认或 AI 辅助形成的相似反馈组。
- FeedbackResolution：反馈的处理结论、WorkItem、修复 Build 和用户验证状态。

### 5.7 主要关系

```text
Organization
  ├── ProductIdea ──approved──> Product
  ├── Member
  └── Capability

Product
  ├── ProductWorkspace
  │     ├── Project State
  │     ├── SkillSetVersion
  │     ├── WorkItem ──binds──> Case ──contains──> Loop
  │     │                                  └── AutomationRun
  │     └── Build ──promoted──> Release
  └── Feedback ──triaged──> WorkItem

Loop
  ├── Worker Packet
  ├── Worker Report
  ├── Evidence
  ├── Handoff / Human Gate / External Wait
  └── Verified State Delta ──writeback──> Project State

Capability
  ├── Skills
  ├── Templates
  ├── Services
  ├── Configuration Contract
  └── Validation Checklist
```

## 六、模块之间如何串联

### 6.1 产品创意进入平台

1. 产品创意师在 Codex CLI、Codex Desktop 或 Local Workbench 中启动产品分析。
2. Agent 使用 Arckit 产品创意、调研、决策和草案 skills 生成 ProductIdea 草案。
3. 草案通过平台 CLI、Local Workbench 或 Web 上传到 Product Center。
4. Product Center 保存结构化元数据、Markdown 正文、来源和版本。
5. 团队成员补充评论、证据和候选方案。
6. 团队负责人记录立项、观察、暂停或拒绝决策。
7. 立项后系统创建 Product 和 ProductWorkspace 初始化流程。

### 6.2 ProductWorkspace 初始化

1. 平台创建或绑定 GitHub 仓库。
2. Local Workbench 绑定开发者本地目录。
3. 平台初始化 iOS 工程和 `arckit/` 项目工作区。
4. Arckit 建立 Project State、首个 Case 和恢复上下文。
5. ArcForge 应用所需 `arckit`、`arckit-code` 和项目级 skills。
6. 平台记录 SkillSetVersion 和 Capability 选择。
7. Product Center 展示 Workspace 已具备的事实、能力和当前状态缺口。
8. Work Center 生成第一批产品级 WorkItem。

### 6.3 WorkItem 进入 AI 自动化

1. 团队负责人或开发者将 WorkItem 标记为 AI 自动化优先。
2. 平台读取 WorkItem、ProductWorkspace、Project State、相关事实和 Automation Policy。
3. WorkItem 创建或绑定 Case。
4. Controller Agent 选择本轮 Project State gap 和最小 worker route。
5. Runtime 生成 Controller Packet 和 Execution Gate。
6. 用户在 Web 或 Local Workbench 中授权执行。
7. 本地或云端 Worker 使用允许的 skills 执行。
8. Worker 返回 report、evidence 和 artifact impacts。
9. Runtime Guard 和 Controller Review 判断本轮结果。
10. Gate 通过后，Ledger Writeback 更新 Case 和 Project State。
11. WorkItem 进入 review、done、blocked 或等待下一轮。

### 6.4 AI 转交人类并重新交回 AI

1. Worker 发现需要账号审批、云控制台、证书、产品取舍、风险接受或人类实现。
2. Loop 生成 Handoff，说明当前目标、事实、阻塞、已完成内容和交回条件。
3. Work Center 把 Handoff 分配给对应角色。
4. 人类在 Local Workbench、Codex、Xcode 或外部系统中完成处理。
5. 人类回写 commit、PR、操作结果、证据和说明。
6. Controller 判断 Case 是否可以继续、验证、关闭或恢复 AI 执行。
7. 如果仍有 Agent 可继续的工作，平台创建下一轮 Loop。

### 6.5 开发结果进入 TestFlight

1. WorkItem 和 Case 达到实现与验证条件。
2. Release Center 创建 Build 或 Release Candidate。
3. Capability Center 提供 TestFlight 发布能力和验证 checklist。
4. AI 自动完成可安全自动化的工程配置、文档检查和构建准备。
5. 必须由人处理的证书、签名、App Store Connect 或发布责任生成 Handoff。
6. 人类完成上传和发布确认。
7. Release Center 记录版本、构建号、TestFlight 状态、关联 commit 和已知问题。
8. Product Center 展示当前可测试版本。

### 6.6 测试用户反馈回到研发

1. 测试用户在 iOS App 内通过 Feedback SDK 提交问题或建议。
2. Feedback Center 接收内容、截图、日志、设备和 Build 信息。
3. AI 提供归并、分类和澄清建议。
4. 反馈处理者确认反馈类型、影响和处理方式。
5. 可行动反馈创建 WorkItem，并关联 Product、Build 和原始 Feedback。
6. WorkItem 根据风险和 Automation Policy 进入 AI 或人类处理。
7. 修复完成后关联新 Build。
8. Feedback Center 同步 fixed、answered、rejected、deferred 或 awaiting verification 状态。
9. 测试用户在新 TestFlight Build 上确认结果。

### 6.7 重复能力沉淀为 Capability

1. 人类或 AI 从多个 Product 的接入和运行中识别重复能力。
2. 基建维护者创建 Capability 候选。
3. 团队确认适用场景、配置、安全和验证边界。
4. 具体实现方法进入 `arckit-code` 或项目级 skill。
5. Capability Center 记录 skill、模板、服务和版本关系。
6. ArcForge 完成安装、同步、审计和 drift 管理。
7. 后续 Product 选择 Capability 后，平台生成有边界的 WorkItem 和验证要求。

## 七、人和 AI 的分工协作

平台采用“人负责目标与责任，AI 负责语义和执行，Runtime 负责确定性控制”的三方分工。

### 7.1 人类负责

- 提出产品目标、真实场景和价值判断。
- 决定 ProductIdea 是否立项。
- 选择优先级、研发模式和自动化边界。
- 确认产品、交互、视觉和关键技术取舍。
- 授权高影响操作和外部系统操作。
- 接受风险、发布版本并承担产品责任。
- 处理 AI 当前无法可靠完成的工作。
- 确认反馈是否进入研发以及何时关闭。
- 确认 Capability、Skill 和 Workflow Memory 是否值得长期沉淀。

### 7.2 AI 负责

- 理解自然语言和项目上下文。
- 形成创意、调研、规格、方案和 handoff 草案。
- 从 Project State 和 Case 判断可推进的 gap。
- 在 worker packet 边界内修改文档和代码。
- 使用工具运行构建、测试、诊断和验证。
- 收集 evidence，形成结构化 report。
- 对反馈提供归并、分类和澄清建议。
- 从执行和验收结果中生成经验候选。
- 在人类处理完成后恢复下一轮工作。

### 7.3 Runtime 和平台代码负责

- 管理项目、身份、权限、队列和运行状态。
- 校验 packet、report、evidence 和 artifact ownership。
- 控制 Execution Gate、Human Gate 和 Ledger Gate。
- 持久化 Run、事件、证据引用和审计记录。
- 保证只有验证后的 state delta 写回 Project State。
- 管理暂停、恢复、重试、超时和通知。
- 把本地 Agent、云端 Worker 和外部系统放入同一套协议。

### 7.4 协作原则

- 人和 AI 读取同一个 ProductWorkspace 和 Arckit facts。
- 人类主导与 AI 自动化使用同一套 Capability 和 skills。
- AI 遇到人类职责时生成明确 Handoff，而不是留下一段无法恢复的日志。
- 人类处理完成后可以把同一个 Case 交回 AI，不需要重新解释完整背景。
- Runtime 校验结构、证据、权限和写回条件，不替代人或 Agent 做语义判断。
- Product State 的变化由证据和 gate 驱动，不由某一次模型输出直接决定。

## 八、各端之间的协作关系

### 8.1 Web 端与本地桌面端

Web 端拥有团队共享控制视图；本地桌面端拥有设备级工作区和本地执行连接。

```text
Web 端
  ├── 展示 Product / WorkItem / Case / Loop / Release
  ├── 团队讨论、决策、分配和授权
  └── 观察跨成员、跨设备和跨产品状态
          │
          │ Platform API / Event Stream
          ▼
Local Workbench
  ├── 绑定本地 repo 和 Xcode 工程
  ├── 连接 Codex app-server / CLI
  ├── 处理本地权限与确认
  ├── 收集本地文件和命令证据
  └── 回传 report、commit、PR 和 Build
```

### 8.2 Local Workbench 与 Codex 类 Agent

Local Workbench 负责运行控制和上下文装配；Codex 类 Agent 负责执行。

```text
Local Workbench
  → 选择 ProductWorkspace
  → 读取平台 WorkItem / Case / Packet
  → 检查 SkillSet 和权限
  → 启动 Codex thread / turn
  → 展示执行过程
  → 收集 Worker Report
  → 回传平台
```

开发者仍可以直接在 Codex CLI 或 Codex Desktop 中工作。项目中的 `AGENTS.md`、Arckit facts、skills 和 Handoff 让直接工作与平台自动化保持兼容。

### 8.3 iOS App 与平台

iOS App 是平台研发闭环的真实产物和运行入口。

```text
平台选择 Capability
  → Agent / 开发者在 iOS 工程中接入
  → Build / TestFlight
  → 用户真实使用
  → Feedback SDK / 运行证据
  → 平台 WorkItem / Case
  → 新 Build
```

平台核心协议保持技术栈中立；MVP 通过 iOS 和 SwiftUI Capability 验证完整链路。

### 8.4 平台与 GitHub

GitHub 提供代码协作和工程证据：

- ProductWorkspace 绑定 GitHub 仓库。
- WorkItem、Case 和 Run 关联 branch、commit 和 PR。
- Worker Report 引用 diff、review 和 CI 结果。
- Release 关联可追溯 commit。
- 平台通过 GitHub integration 创建、读取和回写必要对象。

### 8.5 平台与反馈、待办服务

- Feedback Center 是反馈事实源，通过 integration 创建 WorkItem 并接收修复状态。
- Todo 平台继续服务当前人类待办列表，通过 mapping 与中央 WorkItem 同步必要状态。
- Case、Loop、Run 和 Evidence 保留在 Arckit/Automation 领域，不扩张 Todo 的任务模型。

## 九、事实源与数据归属

平台通过明确的数据归属避免 Web 数据库、本地仓库和外部平台形成相互冲突的事实副本。

| 内容 | 主事实源 | 其他系统中的形态 |
|---|---|---|
| ProductIdea、Product、组织、成员 | 平台数据库 | Web/桌面端投影 |
| WorkItem、分配、Automation Policy | 平台数据库 | Todo 映射、桌面端缓存 |
| Product spec、interaction、visual、tech | Product Git 仓库 `arckit/` | 平台索引和预览 |
| Project State、Case、Loop Handoff | Arckit ledger | 平台带 commit 的状态投影 |
| Run、原始事件、Worker Report | Runtime Event Store | Arckit 保存摘要与 evidence refs |
| commit、PR、CI | GitHub | 平台关联与状态缓存 |
| Build、Release、TestFlight 状态 | Release Center + 外部平台引用 | Product 和 Feedback 关联 |
| Feedback 和用户对话 | Feedback Center | 平台保存链接和研发映射 |
| Capability 元数据 | Capability Center | Product 选择与 Run 快照 |
| Skill 源文件 | `arckit`、`arckit-code`、项目 skill repo | ArcForge 安装和 drift 状态 |
| 密钥、证书、token | Secret Store / 系统钥匙串 | 平台只保存引用和配置状态 |

平台修改 Git 中的正式事实时，通过 Agent 生成变更、人工确认、commit/PR 和 ledger gate 完成，不在数据库中静默创建第二套正式 spec。

## 十、现有能力整合方案

目标架构以现有能力为基础建设，优先整合和明确边界，逐步收敛重复实现。

### 10.1 `arckit`

进入目标系统的能力：

- Project State、Case、Loop 和 Handoff 产品语义。
- 产品、交互、视觉、技术、pending、agent context 和 workflow memory 事实体系。
- Controller Worker Loop 和 execution gate 协议。
- 可安装的 Agent skills 和 capability manifests。
- Runtime Guard、Ledger Gate 和 state writeback 的当前实现基础。

目标定位：

> 统一研发协议、项目事实模型、Agent 能力层和 Runtime Kernel 的来源。

### 10.2 `arcflow`

进入目标系统的能力：

- Web、Server、Desktop shell 的平台实现基础。
- Project、Item、Iteration、Run 和 Agent 的已有模型与界面。
- Run 事件、执行观察、队列和进程管理能力。
- Project Data、Personal Pack 和经验资产探索。
- 多 Agent adapter 和自动执行研究。

目标定位：

> 平台 Web/Server 控制面的主要承载项目，逐步接入 Arckit 统一领域语义和 Runtime Kernel。

Arcflow 的 Item 映射为 WorkItem；Case、Loop、Gate 和 ledger 采用 Arckit 协议；已有固定 workflow 作为可选执行策略存在，不成为平台唯一流程。

### 10.3 `arc`

当前可读取的实际项目路径为 `../zqshi/arc`。

进入目标系统的能力候选：

- 组织、多租户、成员、角色和权限设计。
- Project、Version、Requirement 和 Artifact 模型。
- 账号、配额、GitHub、Agent Adapter 和部署基础。
- FastAPI、PostgreSQL、pgvector 和 SaaS 工程实践。
- 产出物渲染、领域模型和经验引擎探索。

目标定位：

> SaaS 和成熟业务能力的供体，按统一领域契约选择性复用。

### 10.4 `workshop-desktop`

进入目标系统的能力：

- 本地项目和目录绑定。
- 本地记录、当前上下文和人类确认页。
- Workshop 任务源连接。
- Codex app-server 派发和运行状态。
- 本地 app server、`workshop` CLI 和受限 token。
- Skill 分发、安装和更新入口。

目标定位：

> 平台 Local Workbench，统一承接本地项目、Agent 执行、安全确认和结果回传。

Arckit Runtime Desktop 中已经验证的 supervisor 和 agent loop 视图逐步进入 Local Workbench，形成一个长期本地客户端。

### 10.5 `workshop-feedback`

进入目标系统的现有闭环：

- App 端集成 SDK。
- 用户反馈提交。
- Feedback Center 人工处理和确认。
- 反馈转待办跟进。
- 处理状态同步。

目标定位：

> 独立 Feedback Center 和标准 Product Capability，通过统一 WorkItem、Build 和 Feedback integration 进入研发闭环。

### 10.6 `workshop-todo-website`

进入目标系统的能力：

- 项目和成员。
- 待办列表、父子任务、状态、执行人、标签和优先级。
- 当前团队日常使用的人类任务入口。
- 阿里云静态托管、网关和后端服务实践。

目标定位：

> MVP 阶段的人类工作队列和 Todo Adapter；中央平台逐步形成统一 Work Center 后，再决定长期独立或迁移关系。

### 10.7 `arckit-code`

进入目标系统的能力：

- SwiftUI 工程和编码实践。
- 账号、反馈、OSS、网关、TestFlight 等技术栈接入 skills。
- 平台和语言相关的实现、验证与发布方法。

目标定位：

> Capability 的技术实现方法中心。

### 10.8 `arcforge`

进入目标系统的能力：

- Skill 来源、安装、同步、profile 和目标管理。
- 已安装副本 drift 检查。
- 团队共享和发布准备。
- 多 Agent 环境中的 Skill 生命周期治理。

目标定位：

> SkillSetVersion 和 Capability 实现资产的治理基础设施。

### 10.9 已有阿里云、账号、网关和 OSS 能力

进入目标系统的能力：

- 统一认证和用户身份。
- API Gateway 和服务路由。
- OSS 静态资源和图片存储。
- 已部署平台的运行环境和运维经验。

目标定位：

> 平台 MVP 的基础云环境，支撑 Web、API、反馈、Todo 和集成服务运行。

## 十一、MVP 产品范围

MVP 选择一个真实 2C iOS App 作为试点，用本地 AI 执行优先的方式跑通完整纵向链路。

### 11.1 MVP 目标

MVP 证明以下能力可以组成一个完整系统：

- 产品创意可进入统一中心并完成立项。
- 正式 Product 可创建可执行的 ProductWorkspace。
- 人类和 AI 可围绕同一个 WorkItem、Case 和 Project State 协作。
- AI 自动化可在本地 Agent 和 Runtime 控制下执行。
- 阻塞可以转成人类 Handoff，并在处理后交回 AI。
- 开发结果可以进入 Build 和 TestFlight 记录。
- 真实用户反馈可以转为研发工作并关联修复版本。
- Capability 和 SkillSet 可以被记录、应用和验证。

### 11.2 MVP 业务链路

```text
ProductIdea 草案
  → 团队负责人批准立项
  → Product / ProductWorkspace
  → GitHub + 本地 iOS 工程 + arckit + SkillSet
  → 首批 WorkItem
  → 一个 AI 自动化 Case / Loop
  → 一个人类 Handoff 并交回 AI
  → Build / TestFlight checklist
  → 测试用户提交 Feedback
  → 人工确认并转 WorkItem
  → 修复 Case / Loop
  → 新 Build
  → Feedback 状态同步和用户验证
```

### 11.3 MVP 必备模块

- ProductIdea、Product 和 ProductWorkspace 最小 Web 页面。
- WorkItem、Case 链接、Handoff 和个人工作队列。
- AutomationRun、Worker Report、Evidence 和 Gate 展示。
- Arckit Runtime 与项目 ledger 同步。
- Local Workbench 的平台登录、项目绑定和本地 Agent 执行。
- Feedback Center 到中央 WorkItem 的适配。
- Todo 平台的任务映射或兼容入口。
- Build、Release Candidate 和 TestFlight checklist。
- Capability Registry 和 SkillSetVersion 快照。
- GitHub 仓库、commit 和 PR 关联。

### 11.4 MVP 自动化边界

MVP 优先实现：

- 本地 Codex worker 执行。
- Controller Packet、Execution Gate 和 Worker Report。
- Git 仓库事实读取与 Arckit ledger 写回。
- WorkItem、Case、Run 和 Feedback 的对象关联。
- TestFlight 前置检查和人工 Handoff。

MVP 后续继续扩展：

- 云端隔离 Worker 和并行 Agent。
- 自动创建完整 App Store Connect 配置。
- AI 自动归并并直接处置反馈。
- 全网热点和市场数据自动采集。
- 复杂组织权限、计费和专家市场。
- 完整自动发布和生产运维。

### 11.5 MVP 验收标准

1. 团队成员能在 Product Center 查看、讨论和批准 ProductIdea。
2. 批准后能创建 ProductWorkspace 并绑定 GitHub、本地目录和 Arckit facts。
3. WorkItem 能创建或绑定 Case，平台能展示其目标 gap 和事实依据。
4. Local Workbench 能运行一个真实 Codex worker loop。
5. Run 能产生可定位的 Worker Report、Evidence、文件影响和结果状态。
6. Gate 通过后能更新 Case 和 Project State，并保留 repo commit 或 evidence refs。
7. AI 阻塞时能创建人类 Handoff，人类处理后能恢复同一个 Case。
8. Release Center 能记录 TestFlight Build、关联 commit、WorkItem 和已知问题。
9. Feedback Center 能把真实反馈转为中央 WorkItem，并在修复后同步目标 Build 和状态。
10. 团队能从 Product 或 Feedback 一路追踪到 WorkItem、Case、Loop、Run、commit、Build 和最终状态。

## 十二、产品演进路线

### 阶段一：统一产品与协议基线

目标：让所有项目围绕同一套对象和事实边界工作。

主要结果：

- 对齐 Product、Workspace、WorkItem、Case、Loop、Run、Build、Feedback 和 Capability。
- 对齐各对象的事实源和状态机。
- 确认 Arcflow 控制面、Arckit Kernel、Local Workbench 和外部服务分工。
- 定义跨系统 ID、链接和事件契约。

### 阶段二：完成框架 MVP

目标：用一个真实 iOS App 跑通产品交付和反馈修复双闭环。

主要结果：

- Product Center、Work Center、Automation Center 和 Release Center 最小可用。
- Local Workbench 连接平台与本地 Codex。
- Feedback、Todo、GitHub 和 Arckit ledger 完成集成。
- 首批 Capability 可以被 Product 选择和验证。

### 阶段三：提升 AI 执行可靠性

目标：让更多研发工作在受控边界内自动推进。

主要结果：

- Controller 动态路由和多 Worker 执行稳定。
- 云端或本地隔离工作区。
- 失败分类、自动修复轮次和停止条件。
- 更完整的 Evidence、验收和回跳机制。
- AI 反馈聚类、澄清和关联建议。
- Workflow Memory 和 Capability 候选沉淀闭环。

### 阶段四：形成多产品研发平台

目标：让团队持续并行建设和运营多个 2C App。

主要结果：

- 跨产品组合管理、团队工作队列和组织权限。
- Capability 在多个 Product 中复用和度量。
- 统一 Release、Feedback 和质量指标。
- 多项目 Agent 自动化队列和资源策略。
- 组织级经验、质量和交付数据闭环。

### 阶段五：扩展生态和商业化

目标：把平台能力从团队自用扩展为可配置、可分发的产品。

主要结果：

- 团队版 SaaS 和多组织支持。
- Capability / Skill / Domain Pack 生态。
- 云端 Agent 执行和企业级治理。
- 第三方反馈、任务、代码、发布和基础设施集成。
- 面向更多软件平台和知识密集型领域扩展。

## 十三、团队对齐建议

本轮团队讨论建议优先确认以下共识：

1. 整体产品定位是否统一为“AI 原生软件产品研发平台”，而不是待办系统或单一 Agent 客户端。
2. Product 是否作为平台业务根，Project State 是否作为单个 ProductWorkspace 的最高工程恢复对象。
3. WorkItem、Case、Loop 和 Run 是否接受本文定义的分工。
4. 是否采用“Arcflow 控制面 + Arckit 协议和 Runtime Kernel + Workshop Desktop Local Workbench”的主架构。
5. Product Center、Work Center、Automation Center、Capability Center 和 Release Center 是否作为同一 Web 产品的不同模块。
6. Workshop Feedback 是否保持独立反馈事实源，通过 WorkItem、Build 和状态事件接入平台。
7. Workshop Todo 是否在 MVP 阶段继续作为人类任务入口，中央 Work Center 成熟后再决定长期关系。
8. 是否用一个真实 iOS App 同时验证创意到 TestFlight、反馈到修复版本两条链路。
9. 首批 Capability 是否确定为 SwiftUI、账号、反馈、OSS、网关和 TestFlight。
10. 平台 MVP 是否优先本地 Codex 执行，再逐步扩展云端 Worker。

## 十四、规划成功标准

当本规划落地后，团队将获得以下能力：

- 每个产品从创意开始拥有连续、可恢复的产品和研发上下文。
- 人类和 AI 围绕同一套事实、能力、工作项和状态协作。
- AI 自动化运行具有明确授权、边界、证据、失败原因和接力状态。
- 开发者可以继续使用 Codex、Xcode 和 GitHub，同时自然接入平台闭环。
- 产品负责人可以看到产品、工作、运行、发布和反馈之间的完整关系。
- 测试用户的反馈可以进入可追踪的研发链路，并回到可验证的新版本。
- 重复出现的基础能力和研发方法可以被沉淀、治理和跨产品复用。
- 团队可以在同一架构上持续扩展更多 iOS App、更多 Agent 和更多自动化能力。

## Current Judgment

当前建议以本文作为团队讨论的整体蓝图。产品方向、系统参与者、模块分工、端到端业务链路和现有能力整合关系已经具备共同讨论基础。

下一步应先完成团队对齐，再把确认内容分别提升为：

- 平台总体产品概念与模块规格。
- 核心领域对象与状态关系。
- Web、Local Workbench 和 iOS App 的交互架构。
- 平台服务、Runtime、Git/DB 同步和外部集成技术方案。
- 框架 MVP 的迭代计划与验收方案。

## Process Handoff

- Kind: spec_draft_handoff
- Source Skill: arckit-draft-spec
- Target Candidate Skills: arckit-spec, arckit-architecture-decision, arckit-domain-modeling, arckit-tech, arckit-interaction, arckit-visual
- Source Refs:
  - `arckit/spec/agentic-software-development/product-concepts.md`
  - `arckit/spec/agentic-software-development/product-architecture.md`
  - `arckit/spec/agentic-software-development/controller-worker-loop.md`
  - `arckit/spec/agentic-software-development/skill-architecture.md`
  - `runtime/arckit-runtime/README.md`
  - `../hoewo/arcflow/arckit/spec/arcflow-framework/product-architecture.md`
  - `../hoewo/arcflow/arckit/spec/arcflow-framework/agent-work-reliability-model.md`
  - `../hoewo/workshop-desktop/README.md`
  - `../hoewo/workshop-desktop/docs/domain.md`
  - `../hoewo/workshop-feedback/specs/main/idea/idea.md`
  - `../hoewo/workshop-todo-website/frontend/script/架构和部署技术方案总结.md`
  - `../zqshi/arc/README.md`
  - 用户对 Workshop Feedback 与 Workshop Todo 当前业务能力的补充

### Accepted Facts

- Arckit 的产品主轴是 Project State 通过 Case 和 Loop 被持续推进。
- Skills 是 Agent 能力包，Runtime/Desktop 拥有产品级运行控制职责。
- Workshop Feedback 已形成 SDK、反馈提交、人工确认、转待办和状态同步闭环。
- Workshop Todo 当前主要承载待办列表和人类轻量任务协作。
- Workshop Desktop 已具备本地项目、Codex 派发、确认页、CLI 和受限回写能力。
- 目标 MVP 以 2C iOS App 建设和 TestFlight 反馈闭环为首个真实场景。

### Assumptions

- Arcflow 适合作为统一平台 Web/Server 控制面的主要承载项目。
- Arckit Runtime 可以演进为平台唯一的研发 Loop Kernel。
- Workshop Desktop 可以吸收 Runtime Desktop 的 supervisor 能力并成为长期 Local Workbench。
- 现有账号、网关和阿里云基础设施可支持平台 MVP。

### Gaps

- 统一对象的正式 schema、ID 和状态机尚未定义。
- 平台数据库和 Git Arckit ledger 的同步协议尚未定义。
- Arcflow、Arckit Runtime 和 Workshop Desktop 的代码整合边界尚未形成技术方案。
- Product Center、Work Center 和 Release Center 的正式交互规格尚未形成。
- 首个真实 iOS 试点 Product 尚未在本文中指定。

### Risks

- Arcflow Item、Arckit Case 和 Todo Task 可能继续形成语义重叠。
- Web 数据库和 Git 项目事实可能形成双写漂移。
- Arcflow Desktop、Arckit Runtime Desktop 和 Workshop Desktop 可能重复演进。
- 固定研发阶段可能进入 Runtime Kernel，削弱动态路线能力。
- 过早扩大云端自动化、权限和发布范围可能延迟纵向 MVP 闭环。

### Rejected Items

- 把完整系统定义为单一服务端系统。
- 把平台定义为待办管理工具或单一 Codex 客户端。
- 让每个现有项目继续拥有独立且互不兼容的任务、运行和事实模型。
- 在框架 MVP 前重写所有现有平台或一次性迁移全部数据。

### Suggested Next

- 团队评审本文并确认“团队对齐建议”中的十项共识。
- 使用 `arckit-domain-modeling` 正式定义核心对象、状态和上下文边界。
- 使用 `arckit-architecture-decision` 确认控制面、Runtime、Local Workbench 和外部服务拆分。
- 使用 `arckit-spec` 将确认后的产品概念、模块和业务规则拆入正式规格。
- 使用 `arckit-tech` 定义平台数据、同步、Runtime 和 integration 技术方案。

## Revisit When

- 团队完成整体规划评审并返回修改意见。
- 准备把讨论稿提升为正式产品规格和技术架构。
- 准备选择首个真实 iOS Product 进入框架 MVP。

## Related Areas

- `arckit/spec/agentic-software-development/`
- `runtime/arckit-runtime/`
- `arckit/pending/`

## Notes

- 本文优先表达目标系统和正向建设方案；历史方案差异与仓库迁移细节留给后续架构决策。
- 本文中的“平台”同时包含人、AI、被研发产品、客户端、服务器、项目事实和外部服务。

## Outcome

待团队评审后填写。
