# 从协作、任务到软件状态

## Buzz、Dashi Taskboard 与 Arckit 产品概念调研报告

## 文档信息

- 日期：2026-08-07
- 类型：产品概念调研与决策分析
- 受众：尚未系统了解 Buzz、Dashi Taskboard 和 Arckit 的产品、设计、研发与平台协作者
- 目的：解释三个项目分别在解决什么问题、为什么会出现相似功能、核心机制如何生发外围能力，以及它们在产品概念上的根本差异
- 状态：当前调研判断，不是已接受的 Arckit `spec` 或 `tech` 事实

## 一页结论

Buzz、Dashi Taskboard 和 Arckit 都在尝试解决同一个时代背景下的问题：

> 当人和 AI Agent 共同完成真实、持续的软件工作时，如何让协作不随一次对话结束而丢失，并让后来的人或 Agent 能够继续推进。

三个项目选择了不同的连续性对象：

| 项目 | 主要保持的连续性 | 一句话产品定义 |
| --- | --- | --- |
| Buzz | 协作连续性 | 人和 Agent 共享的协作空间 |
| Dashi Taskboard | 工作连续性 | 人和 Agent 共享的工作队列 |
| Arckit | 软件状态连续性 | 人和 Agent 共享的软件状态演进协议 |

它们并不是简单的“事件系统、任务系统、状态系统”三选一。事件、任务和状态在三个项目中都存在，真正的差异是：

1. 系统把什么当作最需要持续保存的核心对象。
2. 系统原生守护什么不变量。
3. 系统用什么条件判断一次工作已经成立或闭环。

进一步概括：

> Buzz 关注大家共同经历了什么；Dashi 关注一项工作推进到了哪里；Arckit 关注软件实际上改变了什么。

站到平台高度看，三者的生发方向也不同：Buzz 通过把更多参与者和动作纳入统一事件协议而横向扩张；Dashi 通过把更多上下文、执行器和验收方式挂到 Task 上而围绕工作项扩张；Arckit 通过把产品定义、研发执行、证据、交付和反馈接回连续软件状态而纵向闭环。

## 1. 为什么需要这份比较

初看三个项目时，很容易产生两种相反感受：

- 它们差异很大：Buzz 像协作平台，Dashi 像任务板，Arckit 像状态驱动研发协议。
- 它们又非常相似：都有任务、状态、Agent、评论或消息、执行、审查、证据、人工介入和自动化。

两种感受都没有错。困惑来自把不同层次的概念放到了同一个维度比较：

- `state-driven loop` 描述系统如何判断并推动真实变化，属于控制与演进机制。
- `signed event` 描述参与者行为如何被记录、验证和传播，属于协作与数据机制。
- `task lifecycle` 描述一项工作如何被包装、分配、执行和验收，属于工作组织机制。

它们本来就可以同时存在。成熟产品为了完成完整用户旅程，也必然会向其他层次扩展，因此最终功能列表可能越来越接近。但功能相似不代表产品核心相同。

## 2. 共同背景：人和 Agent 如何完成持续的真实工作

传统开发工具通常分别处理聊天、任务、代码、CI、发布和反馈。AI Agent 加入之后，又出现新的断裂：

- Agent 的工作可能只存在于一次会话中。
- 人不知道 Agent 具体做了什么、依据是什么。
- 多个 Agent 或多个人之间需要反复解释上下文。
- 任务显示完成，不一定代表软件已经满足预期。
- 代码发生变化，不一定说明产品、交互、视觉或技术决策已经一致。
- 后来的参与者可能只能翻聊天记录，无法直接恢复当前真实状态。

Buzz、Dashi 和 Arckit 都在减少这些断裂，只是它们选择了不同的切入点：

```text
共同协作如何持续        → Buzz
一项工作如何持续        → Dashi Taskboard
软件真实状态如何持续    → Arckit
```

## 3. 三个项目分别是什么

### 3.1 Buzz：人和 Agent 共享的协作空间

Buzz 是一个可自托管的团队协作空间。人和 Agent 可以进入相同的 Room 或 Channel，发送消息、运行工作流、处理代码、参与审查并留下统一的活动历史。

Buzz 的重要设计是：人、Agent、Workflow 和代码相关操作都使用同一种身份与事件模型。它不把 Agent 只当作隐藏在聊天机器人背后的工具，而是把 Agent 当作协作空间中的成员。

Buzz 主要解决的问题是：

> 如何让人和 Agent 的沟通、操作、代码协作和自动化活动进入同一个可追溯、可搜索、可继续响应的协作网络。

其核心价值包括：

- 人和 Agent 共享空间，而不是分别存在于聊天工具和自动化后台。
- 每个行为有明确来源和统一审计路径。
- 消息、代码、CI、审批和工作流可以在同一上下文中被搜索和理解。
- Agent 能够参与协作，而不仅是生成一段回答。

### 3.2 Dashi Taskboard：人和 Agent 共享的工作队列

Dashi Taskboard 是一个 local-first 的 Issue Board，可以通过浏览器、CLI 和内置 Skill 与 Codex 协作，也可以嵌入 Codex 的桌面界面。

它围绕 Task/Issue 组织工作。任务可以被创建、排序、领取、执行、评论、绑定 Codex Thread、Branch 或 Worktree，并经过自验证、人工审查和最终完成。

Dashi 主要解决的问题是：

> 如何为人和 Codex Agent 提供一个明确、持久、可领取、可追踪和可验收的工作对象。

其核心价值包括：

- 用户能清楚看到现在有哪些工作。
- Agent 能领取一项明确任务并绑定执行上下文。
- 任务状态不会只存在于对话里。
- 执行、自验证、人工审查和完成形成清晰闭环。
- 多客户端或多执行者可以通过版本控制减少状态覆盖和领取冲突。

### 3.3 Arckit：人和 Agent 共享的软件状态演进协议

Arckit 的核心可以概括为 `state-driven loop`：每轮从软件项目当前的真实状态出发，选择一个有边界的状态缺口，通过合适的能力产生事实、实现或验证证据，再决定是否接受一次状态变化。

Arckit 主要解决的问题是：

> 即使协作已经发生、任务已经执行，我们如何知道软件是否真的从原状态推进到了目标状态，并让这个结论能够被后续的人或 Agent 恢复和继续使用。

其核心对象包括：

- `Project State`：软件项目当前可恢复的宏观状态。
- `Case`：一个持续推进特定项目状态变化的事项上下文。
- `Loop`：一次有边界、可观察、可收口的状态推进。
- `Evidence`：支持状态变化的文档、代码、测试、日志、构建或人工确认。
- `Handoff`：当前责任需要转移给人、Agent 或外部系统时的可恢复接力。

其核心价值包括：

- 不把“Agent 做过了”自动当成完成。
- 不把“Task 已完成”自动当成软件状态已经满足。
- 不把“代码存在”自动当成产品预期、技术方案或验证已经成立。
- 每次被接受的进展都对应可解释、有证据、可恢复的状态变化。

## 4. 真正可比的尺度：连续性、核心不变量与闭环条件

### 4.1 什么是核心不变量

产品核心不应通过“它能实现哪些功能”来判断。足够复杂的软件通常都能实现任务、消息、状态和自动化。

更有效的判断方式是：

> 哪条规则一旦被破坏，这个产品就失去了最主要的价值？

| 项目 | 原生守护的核心不变量 |
| --- | --- |
| Buzz | 每个协作动作有明确身份来源，并进入共同协议和共享历史，其他参与者可以看见、搜索和响应 |
| Dashi | 每项工作有明确状态、执行上下文、下一责任和验收边界 |
| Arckit | 每次被接受的研发进展都对应有证据、可解释、可恢复的软件状态变化 |

### 4.2 三种不同的闭环

| 项目 | 一次工作如何闭环 |
| --- | --- |
| Buzz | 相关协作事件进入共享空间，参与者能够继续观察、搜索、响应或触发自动化 |
| Dashi | Task 经过领取、执行、自验证、审查和人工验收进入完成状态 |
| Arckit | 一个真实状态缺口被证据支持地解决，并写入新的 Case/Project State |

这三种闭环可以同时成立，也可能出现差异。例如：

```text
Buzz：Agent 已经发布了修复和 CI 结果
Dashi：任务已经进入 done
Arckit：Case 仍然缺少真实场景验证
```

这不一定是谁对谁错，而是三个系统回答的问题不同。

## 5. Buzz 的“身份签名”和“协作事件”是什么意思

这是理解 Buzz 时最容易产生距离感的概念。

### 5.1 身份签名

Buzz 基于 Nostr 事件模型。可以把一条事件粗略理解为：

```text
作者公钥
+ 事件类型
+ 时间
+ 内容和关联对象
+ 数字签名
```

人或 Agent 持有自己的密钥：

- 私钥用于签名。
- 公钥用于验证事件由哪个密钥身份发出。
- 如果事件内容被修改，原签名将无法通过验证。

它证明的是“这条未被篡改的记录由这个密钥身份发出”，并不自动证明内容一定正确，也不必然等于现实世界中的实名身份。

### 5.2 协作事件

协作事件不是只指聊天消息，而是参与者在共享空间里做出的动作，例如：

- 人发送一条消息。
- Agent 回复分析结果。
- 创建 Channel。
- 提交 Patch。
- CI 发布执行结果。
- 人批准一次发布。
- Workflow 执行一个步骤。
- 用户修改 Canvas。

Buzz 尽量把这些动作表达为具有共同结构的事件。由此带来的产品优势是：不同来源和不同类型的协作行为可以使用相似的身份、订阅、搜索、审计和自动化机制。

### 5.3 能力如何从事件模型生发

Buzz 的核心并不直接等于“聊天”。一旦选择“统一身份下的签名事件”作为协作底座，为了让事件真正支撑团队工作，就会连续产生一组平台要求：

| 从核心产生的要求 | 推导原因 | 生发出的平台能力 |
| --- | --- | --- |
| 事件必须有共同发生的边界 | 否则参与者不知道自己属于哪个团队、项目或上下文 | Community、Room、Channel、Thread、DM、成员关系与权限 |
| 人、Agent 和 Workflow 必须使用相同参与者模型 | 否则 Agent 仍只是隐藏工具，无法被提及、授权、审计或积累历史 | 统一身份、Agent 成员、Owner Attestation、Persona、Agent Team、远程 Agent |
| 事件必须能被持续观察和重新发现 | 只写入事件而无法订阅、搜索和聚合，不会形成协作连续性 | 实时分发、通知、Home/Activity、搜索、审计、项目记忆 |
| 不同事件之间必须具有可理解的关联 | 否则消息、代码、审批和执行结果仍是彼此孤立的日志 | Reply、Thread、引用、Reaction、关联对象、语义化 Activity Feed |
| 事件到达后必须能触发后续动作 | 协作网络若只能记录过去，就无法主动推进工作 | Workflow、定时/消息/Reaction/Webhook 触发器、执行 Trace、审批 Gate |
| 软件研发行为也必须进入共同协议 | 否则团队仍要在聊天、代码托管、CI 和评审之间切换上下文 | Git hosting、Patch、Ref update、Branch Channel、CI 结果、Review、Signed Approval、Release |
| 工作空间边界必须可由团队掌控 | 身份、历史和代码若依附单一 SaaS，难以兑现主权协作 | 自托管 Relay、Community 隔离、多社区、标准协议和可替换执行基础设施 |

其推导主线可以压缩为：

```text
签名事件
  → 需要共同边界，形成协作空间
  → 需要稳定作者，形成统一人机身份与权限
  → 需要持续响应，形成订阅、搜索、通知和活动流
  → 需要让事件推动事件，形成 Workflow 与审批
  → 需要覆盖真实软件工作，形成 Forge、CI、Review 和 Release
  → 形成以共享协议为底座的人机协作平台
```

因此，Buzz 的平台扩张方式主要是**横向协议化**：不断把新的协作对象和协作动作翻译成同一身份模型下、可关联、可搜索、可触发的事件。

这条路径自然擅长统一协作表面和参与者关系，但“事件已经发生且来源可信”并不自动回答“软件的产品预期、实现和验证是否已经完整成立”。后一个判断需要额外的领域状态模型或项目规则。

## 6. Dashi 的 Task 为什么不只是一个状态字段

Dashi 的核心不是“数据库里有 Task”，而是 Task 是用户和 Agent 共同工作的主要容器。

任务承载：

- 要做什么；
- 当前状态和优先级；
- 谁正在处理；
- 评论、附件和依赖；
- Codex Thread；
- Branch 或 Worktree；
- 自验证结果；
- 人工是否接受。

典型生命周期可以简化为：

```text
todo
  → Agent 领取
  → in_progress
  → 实现与自验证
  → in_review
  → 用户确认
  → done
```

### 6.1 能力如何从 Task 生命周期生发

Dashi 一旦把 Task/Issue 选为人和 Agent 共同工作的持久中心，就不能只保存标题和一个状态字段。为了让任务能够真正被交给 Codex、由人接手并最终验收，会产生以下平台要求：

| 从核心产生的要求 | 推导原因 | 生发出的平台能力 |
| --- | --- | --- |
| 多项工作必须可见且可排序 | 单个 Task 无法回答团队现在应该先做什么 | Board、Backlog、个人/项目队列、优先级、标签、筛选、截止时间 |
| Task 必须有明确生命周期和责任 | 否则多人或 Agent 会重复领取、覆盖状态或无人收口 | `todo / in_progress / in_review / blocked / done`、Assignee、Claim、乐观版本控制 |
| 一个 Task 必须携带足够上下文 | 执行者不能只凭标题理解目标、历史和阻塞 | 描述、评论、附件、图片、父子项、依赖和相关任务 |
| Task 必须连接真实执行环境 | 否则看板与代码工作仍是两套孤立系统 | Codex Skill、Thread、Branch、Worktree、Workspace path、模型与 Sandbox 选择 |
| 执行过程必须可观察 | 人需要知道 Agent 正在做什么，并能在错误权限或路径下及时停止 | AI Chat、命令/文件/MCP/Web/Todo 事件流、停止与恢复 |
| Task 必须有验收边界 | Agent 自称完成不能直接代表用户接受 | 自验证评论、`in_review`、人工接受后进入 `done`、Blocked/Canceled 处理 |
| 本地执行与多人共享必须并存 | 代码、设备路径和 Codex 环境在本地，工作队列又需要共享 | Local-first SQLite、浏览器/HTTP/CLI、SSE、Cloudflare Worker/D1/R2、Local Companion |
| 多步骤任务需要表达工作流 | 单一线性状态不足以描述复杂触发、条件和外部能力 | `workflow_id`、项目 Workflow Workspace、可视化节点、条件与 Skill/MCP/API/Git 集成建模 |

其推导主线可以压缩为：

```text
持久 Task
  → 需要组织多项工作，形成 Board 与 Queue
  → 需要避免责任冲突，形成生命周期、领取和版本控制
  → 需要真正执行，连接 Codex Thread、Branch 与 Worktree
  → 需要人能够判断结果，形成 Review 与显式验收
  → 需要跨设备和团队使用，形成本地执行与云端共享
  → 形成以工作项为中心的人机执行平台
```

因此，Dashi 的平台扩张方式主要是**围绕工作项向内加深、向外连接**：把更多上下文、执行器、协作者、关系和自动化入口挂接到 Task 生命周期，使工作更容易安排、领取、执行、审查和关闭。

这条路径自然擅长工作吞吐、责任归属和 Codex 落地，但 Task 被人工设为 `done` 仍然只直接证明“这项工作被接受”。它不会自动证明更大的产品状态、跨 Task 完整性或真实发布后的效果已经成立。

需要注意当前成熟度：Dashi 已有完整任务闭环、Codex 绑定和 AI Chat；可视化 Workflow Workspace 已具备节点、连线、条件和多类能力入口，但在本次调研基线中主要是持久化与编排建模表面，尚不能等同于一套完整的通用 Workflow 执行引擎。

## 7. Arckit 为什么有任务和状态，却不是 Task-driven

Arckit 并不排斥 Task。其长期产品概念中，`WorkItem` 用来承接团队工作安排，`Case` 用来承接真实项目状态变化。

两者回答不同问题：

| 对象 | 回答的问题 |
| --- | --- |
| WorkItem / Task | 团队安排了什么工作，优先级和责任人是什么 |
| Case | 这项工作需要让软件的哪部分状态发生什么变化 |

Task 状态和软件状态可能不一致：

- Task 已完成，但实现没有测试证据。
- 代码已提交，但产品预期没有满足。
- Bug 表面消失，但根因没有确认。
- 页面已实现，但交互恢复路径仍不完整。
- 一次执行失败，却产生了有效诊断证据，使 Case 得到真实推进。
- 一个用户任务需要多个 Case 才能完整解决。

Arckit 因而选择：Task 可以触发或关联 Case，但不能直接替代 Case State。

### 7.1 State-driven loop

```text
读取当前 Project / Case State
  → 找到一个真实状态缺口
  → 选择适合当前缺口的能力
  → 产生事实变更、实现或诊断结果
  → 收集验证证据
  → 判断是否接受这次状态变化
  → 写入新的 Case / Project State
  → 从 fresh state 开始下一轮
```

### 7.2 能力如何从 State-driven loop 生发

如果只把 Arckit 的生发能力写成“根据 gap 调用哪个 Skill”，实际上只描述了单次 Loop 的执行路由，没有解释 `state-driven loop` 为什么会进一步长成研发平台。

一旦平台承诺让软件状态持续、可恢复、可验证地演进，就必须覆盖状态变化发生之前、之中和之后的完整产品生命线：

| 从核心产生的要求 | 推导原因 | 生发出的平台能力 |
| --- | --- | --- |
| 状态必须属于一个持续存在的 Product/Project | 否则每个 Case 只是孤立修复，无法形成产品长期上下文 | Product Studio、Product Blueprint、Project State、统一产品入口 |
| 外部需求、任务和反馈必须能够落到状态缺口 | 否则团队队列与软件真实缺口仍然分离 | Work Hub、WorkItem、Attention、Handoff、Approval、Decision Request |
| 每次推进必须有边界且能接力 | 否则 Agent 会在一次会话里无限扩张，失败后也无法恢复 | Case、Loop、Round、Run、Controller/Worker、上下文恢复与确定性 Transition |
| “预期是什么”和“实际是什么”必须有稳定事实来源 | 没有领域事实，就无法判断 gap，更无法评价实现是否正确 | Spec、Interaction、Visual、Tech、代码与运行事实、模块化索引和事实所有权 |
| 当前 gap 必须连接合适的执行能力 | 状态本身不会改变，需要人、Agent、工具或外部系统实际行动 | Developer Workbench、Automation Runtime、Agent/工具适配、Skill 与 Capability 选择 |
| 状态变化必须由证据支持 | “执行过”不等于“改变成立” | Evidence、测试/日志/截图/Build/人工确认、Verification、Debug、Review 与 Gate |
| 代码完成后还必须成为可使用的软件版本 | 不进入构建、测试和发布，产品的现实状态没有真正改变 | Delivery Center、Build、Release Candidate、TestFlight/商店集成、发布授权与回滚 |
| 真实使用必须能够反向改变下一轮状态 | 发布不是软件生命周期的终点，用户反馈可能揭示新的 gap | Feedback Hub、App SDK、反馈归并、版本关联、修复验证与下一轮 Work/Case |
| 成功的方法必须能够复用和治理 | 每次都重新发明能力会让平台无法规模化 | Capability Hub、Skill/SkillSetVersion、模板、工程能力、适用性与版本治理 |
| 所有产品表面必须共享可关联对象 | 否则七个产品单元会重新变成七个信息孤岛 | 统一平台底座、身份、权限、领域 ID、关系、事件、审计、集成与数据一致性 |

其平台级推导主线是：

```text
State-driven loop
  → 状态必须有长期归属，形成 Product 与 Project State
  → gap 必须进入团队责任系统，形成 Work Hub 与 Handoff
  → 推进必须可执行、可接力，形成 Workbench 与 Runtime
  → 转移必须有事实依据，形成多领域预期、Evidence 与 Gate
  → 软件必须真正到达用户，形成 Delivery Center
  → 用户现实必须重新进入状态，形成 Feedback Hub
  → 重复有效的方法需要复用，形成 Capability Hub
  → 所有对象需要同一身份、权限、关系和事件底座，形成统一平台
```

Skill 调用只是其中“当前 gap 如何连接执行能力”的一条：产品行为缺口可进入 Spec，交互缺口可进入 Interaction，视觉缺口可进入 Visual，架构或契约缺口可进入 Tech，事实异常可进入 Debug，随后再连接实现、验证、人类判断或外部系统。Skill 的价值是让能力可选、可复用、可治理；它不是平台能力生发的全部。

因此，Arckit 的平台扩张方式主要是**沿软件生命周期纵向闭环**：把创意、定义、执行、证据、交付和反馈都解释为连续软件状态中的输入、gap、transition 或新一轮现实证据。

这条路径自然擅长跨阶段完整性与事实恢复，但 `state-driven loop` 本身不会自动产生优秀的实时聊天体验、团队社交关系或高效看板交互。这些需要被建设为平台表面，同时继续服从软件状态语义。

## 8. 从核心到平台：三条能力生发路径的横向对比

### 8.1 相同平台能力为什么都会出现

完整的软件协作平台最终都要面对协作者、工作、执行、上下文、治理、代码、交付和反馈，因此三者会生发出大量相似产品表面。但相似功能在不同系统里承担的是不同因果责任。

| 平台维度 | Buzz 的推导 | Dashi 的推导 | Arckit 的推导 | 最终语义差异 |
| --- | --- | --- | --- | --- |
| 协作与身份 | 事件必须知道由谁签发、对谁可见 | Task 必须知道谁创建、领取、评论和验收 | State transition 必须知道责任、授权和证据来源 | Buzz 把身份作为协议根；Dashi 把身份用于任务责任；Arckit 把身份用于状态责任与 Gate |
| 工作组织 | 事件过多后需要注意力、频道、Project/Issue 入口 | Task 本身直接要求 Board、Queue、优先级和依赖 | gap 与 Handoff 需要进入人类可管理的 Work Hub | 表面都可能有任务板；Buzz 组织协作注意力，Dashi 组织工作流转，Arckit 组织状态推进责任 |
| Agent 与自动化 | Agent 是协作成员，事件可以触发 Workflow | Agent 是 Task 执行者，任务绑定 Codex 环境 | Agent/Skill/Runtime 是解决当前 gap 的可选执行能力 | Buzz 优化参与和可见性；Dashi 优化领取和落地；Arckit 优化执行与目标状态、证据的对应关系 |
| 上下文与恢复 | 从共同事件、频道和身份历史恢复 | 从 Task、评论、Thread、Branch/Worktree 恢复 | 从 Product/Project/Case 当前状态、Evidence 和 Handoff 恢复 | 分别恢复“发生过什么”“这项工作到哪了”“软件现在是什么” |
| 评审、审批与信任 | Signed Approval 证明谁批准了什么事件或提交 | `in_review → done` 表达用户显式接受 Task | Gate 判断某份 Evidence 是否足以接受状态变化 | 三者都有人工批准，但批准对象和结论范围不同 |
| 代码与工程 | 把 Git、Patch、CI、Review 纳入同一事件网络 | 把 Task 绑定到 Codex、Branch、Worktree 和验证评论 | 把实现、诊断、测试、Build 视为状态变化的执行与证据 | Buzz 统一工程协作流；Dashi 连接工作项与开发环境；Arckit 判断工程事实是否改变软件状态 |
| 交付与发布 | Release Agent/Workflow 延续事件与审批链 | Release 可以成为 Task、关联项或自动化节点 | Delivery 是让软件从“代码存在”进入“用户可使用”的必要状态阶段 | 都能出现发布功能，但只有 Arckit 核心天然要求发布现实回写产品状态 |
| 用户反馈与学习 | 反馈可作为消息、Forum/Issue 和可搜索历史 | 反馈可成为新 Task、评论、附件和关联项 | Feedback 是用户现实对 Product State 的新证据和下一轮 gap 来源 | Buzz 保存共同反馈历史，Dashi把反馈变成工作，Arckit要求反馈重新进入软件生命周期 |
| 能力生态 | 新事件 Kind、Client、Agent、Workflow Action 扩大网络 | 新 Skill/MCP/API/节点扩大 Task 可执行范围 | 新 Skill/模板/工程能力扩大可处理 gap，并以版本和证据治理 | 三者都会有插件或能力市场，但生态单位分别偏协议动作、任务执行能力和状态转移能力 |

共同能力的出现并不说明三个核心最终等价。它说明真实研发本来就需要多个层次；区别在于每个平台从自己的核心出发，为什么需要这些能力，以及最后让哪个对象拥有解释权。

### 8.2 三种平台扩张的“几何形状”

```text
Buzz：横向扩张
更多参与者 × 更多协作动作 × 更多共享空间
        ↓
都进入统一签名事件网络

Dashi：围绕工作项扩张
更多上下文 × 更多执行器 × 更多关系 × 更多验收方式
        ↓
都挂接到 Task 生命周期

Arckit：沿软件生命周期纵向闭环
创意 → 定义 → 工作 → 执行 → 证据 → 交付 → 反馈
        ↓
都回到连续 Product / Project State
```

这三个方向会在外层相遇：Buzz 会长出任务和 Forge，Dashi 会长出协作和 Workflow，Arckit 会长出 Work Hub、Activity、权限和 Runtime。但它们最自然的下一步、数据模型中心和完成判断仍由各自的扩张方向决定。

### 8.3 同一个功能，在三个系统中可能有不同含义

| 表面功能 | Buzz 中的含义 | Dashi 中的含义 | Arckit 中的含义 |
| --- | --- | --- | --- |
| Agent | 协作空间成员，拥有身份、成员关系和活动历史 | Task 执行者，与任务和 Codex Thread 关联 | 受当前 Case gap、能力、路径和证据要求约束的执行能力 |
| Task | 一种可以通过事件表达和协作的工作对象 | 系统核心业务对象 | 外部 Work 入口，可创建或关联 Case，但不等于 Case |
| Event | 协作事实的基本记录方式 | Task 变化通知、AI 执行流或客户端同步信号 | 执行过程、证据或审计输入，通常不直接成为语义状态 |
| State | 由事件历史和投影形成的协作空间状态 | Task workflow 状态 | 表达软件定义、实现、验证和未决问题的语义 checkpoint |
| 评论/对话 | 共享协作历史的重要组成 | Task 上的上下文和沟通 | 原始语义材料或 Handoff 输入，不能自动提升为稳定事实 |
| 人工批准 | 一条有身份来源、可审计的协作行为 | 允许 Task 从 review 进入 done | 为某项状态变化提供必要判断、授权或证据 |
| 完成 | 相关协作流程已有明确结果事件 | Task 生命周期达到完成状态 | Case 必要 facet 和完成态复审得到证据支持，并更新软件状态 |
| 搜索 | 在共同事件历史中恢复协作上下文 | 查找 Task、评论和项目工作 | 发现稳定事实、当前 Case、证据与待解决 gap |

## 9. 三个项目并不是同一维度上的替代方案

可以把它们理解为同一条人机协作链上的三个观察层：

```text
社会协调层：谁参与、谁做了什么、其他人如何看见和响应
    Buzz 的核心位于这里

工作协调层：做哪件事、谁负责、当前流转到哪里
    Dashi 的核心位于这里

语义与事实协调层：软件当前真实缺什么、什么证据足以改变状态
    Arckit 的核心位于这里
```

这不是严格的上下游产品架构，也不代表一个项目必须依赖另一个项目。它只是说明三个核心概念的主要关注层不同。

### 9.1 为什么它们会向其他层扩展

任何一个完整产品都不能只停留在单层：

- Buzz 为了支持真实团队工作，会需要 Task、Workflow、审批、Git 和执行状态。
- Dashi 为了支持多人和 Agent 执行，会需要身份、评论、事件同步、验证和协作历史。
- Arckit 为了形成完整产品体验，会需要 Work Hub、任务、运行事件、身份、权限、消息和通知。

因此会出现：

> 功能趋同，但语义中心仍然不同。

### 9.2 “能够实现”不等于“原生保证”

从技术上，一个足够可扩展的系统可以模拟另外两个系统的大量能力：

- Buzz 可以通过新事件类型表达 Task 和状态变化。
- Dashi 可以不断扩展 Task 字段来表达事实、证据和验收。
- Arckit 的平台表面可以建设消息、身份、任务和事件系统。

但产品核心不是看它理论上能否编码某个对象，而是看：

- 哪种对象是产品默认组织用户体验的中心；
- 哪些约束被系统原生执行；
- 哪类失败会被系统视为根本失败；
- 产品首先优化什么价值。

### 9.3 比较时必须区分三个成熟度层次

本报告后续案例同时讨论当前产品与平台方向，因此统一使用三个口径：

- **当前已有**：在本次固定 commit 的文档或实现中已经存在。
- **明确方向**：项目的 Vision、README 或 Arckit 候选平台蓝图已经明确描述，但未必实现完成。
- **核心推演**：依据核心不变量可以合理生发，但项目尚未明确承诺的能力。

具体而言：Buzz 当前已具备协作空间、签名事件、Agent、Workflow、搜索审计和 Git hosting，但更完整的 Project binding、Issue、Merge coordinator、Reputation 等 Forge 能力仍有设计中内容；Dashi 当前已具备任务闭环、Codex 执行上下文和本地/云协作，而可视化 Workflow 目前不应被表述为已经完整执行任意工作流；Arckit 的七个产品单元属于长期候选蓝图，不是现有正式产品完成度声明。

## 10. 同尺度真实案例：线上保存故障从反馈到新版本验证

### 10.1 固定场景与比较条件

假设团队运营一款已经上线的 2C iOS App。版本 `2.3` 发布后两天内，18 名用户反馈“弱网下点击保存偶尔没有反应”。现有日志只能看到部分请求超时，尚不能确定是客户端重复提交、服务端超时、UI 状态恢复还是多者共同导致。

团队需要完成的不是“提交一段修复代码”，而是一个真实研发闭环：

1. 收集并归并用户反馈，判断影响范围和优先级。
2. 明确弱网下保存、等待、失败提示、重试和幂等的预期。
3. 复现并定位客户端、API 或服务端的真实根因。
4. 由 iOS 开发者、服务端开发者和 AI Agent 完成必要变更。
5. 完成评审、自动化测试、弱网设备验证和回归验证。
6. 生成 TestFlight 版本，由发布负责人批准灰度。
7. 观察新版本指标，并邀请原反馈用户确认问题是否消失。

参与者固定为：产品负责人、iOS 开发者、服务端开发者、AI 编码 Agent、评审/测试人员、发布负责人和反馈用户。下面不比较“谁能列出更多功能”，而比较每个系统会如何组织同一组人、事实和阶段。

### 10.2 Buzz：把完整研发过程组织成可共同参与的事件网络

1. **反馈进入与归并。** 用户反馈首先进入支持 Channel、Thread 或 Forum/Issue 入口。Triage Agent 订阅新消息，搜索相似反馈和历史版本事件，把 18 条报告关联到同一讨论，并提及产品负责人和相关开发者。当前协作与搜索能力可以直接承载这一步；更正式的 NIP-34 Issue 属于 Forge 的明确方向。
2. **责任和方案形成。** 团队在同一 Channel 内讨论影响范围、复现条件和预期行为。每条发言、Agent 分析和决定都有作者身份。团队可以通过约定、Workflow 或项目对象表达负责人，但 Buzz 的根对象仍是参与者在共享空间中产生的事件，而不是预先定义的软件状态 facet。
3. **代码执行。** 在 Buzz 明确描述的 Forge 模式中，修复 Branch 对应一个 Branch Channel。iOS Agent 提交 Patch，服务端 Agent 检查幂等与超时路径，CI Workflow 对 Ref update 作出响应，测试、Lint 和构建结果继续发布在同一 Channel。当前 Git hosting、Git events 和 Workflow 已存在；自动 Project binding、完整 Branch Channel/Forge 体验仍包含设计中部分。
4. **评审与批准。** Reviewer 逐段评论 diff；维护者对明确 commit 产生 Signed Approval；Merge 状态引用审批和 CI 结果。Buzz 的模型在这里要强保证“谁批准了哪个对象、完整事件链是什么”；本次基线中审批基础设施已存在，但 Workflow 执行器的暂停/恢复接线和完整 Merge coordinator 尚未全部完成。
5. **中断与接手。** 如果 iOS Agent 执行中断，接手者从 Branch Channel 的消息、Patch、工具 Activity、CI 和审批历史恢复已经发生的事情；使用新的身份继续协作。远程 Agent 和更强的持久 Agent 身份是 Buzz 的明确平台方向。
6. **交付与用户验证。** Release Agent/Workflow 可以监听主分支，生成变更说明、请求人工批准并发布构建；支持 Channel 可以继续收集 TestFlight 反馈和原用户确认。这些行为仍能进入同一搜索与审计链。
7. **系统如何认为工作闭环。** Buzz 最自然的闭环是：问题讨论、Patch、CI、批准、Merge、Release 和反馈都出现了清晰、可验证来源的结果事件，参与者可以共同确认和继续响应。至于“18 条反馈是否已经充分验证”“产品行为和技术契约是否全部同步”，需要项目额外定义 Workflow、Issue 字段或领域规则；签名事件本身不替团队作这个语义判断。

Buzz 在这个案例中最强的地方，是把跨角色、跨工具、跨 Agent 的研发经过变成同一协作网络，而不是让关键决定散落在聊天、Git、CI 和自动化后台。

### 10.3 Dashi：把完整研发过程组织成可领取、可执行、可验收的工作结构

1. **反馈进入与归并。** 团队创建高优先级 Bug Task，描述版本、弱网条件和已知日志，附上用户截图和原始反馈；重复反馈以评论或相关任务挂接。Task 进入团队 Board，所有人立刻知道这是一项待处理工作。
2. **责任和拆分。** 主 Task 可以建立“iOS 复现与修复”“服务端幂等检查”“弱网回归”“TestFlight 灰度”等子 Task，并用 Blocks/Blocked by 表达依赖。Assignee、状态、优先级和乐观版本控制避免两名执行者同时领取或覆盖进度。
3. **代码执行。** iOS Agent 通过 `$manage-taskboard ISSUE-ID` 读取描述、评论和附件，领取任务并进入 `in_progress`；Task 绑定 Codex Thread 与 Branch/Worktree。内置 AI Chat 可以选择模型、Reasoning、Sandbox、Skill 和 MCP，并把命令、文件修改和工具活动实时展示给人。服务端任务以相同方式在自己的开发上下文推进。
4. **评审与批准。** 执行者在评论中记录根因、实现摘要、测试命令、结果和风险，把 Task 移到 `in_review`。评审者检查 diff、设备验证与回归结果；只有用户明确接受后进入 `done`。这给工作项提供了非常直接的责任和验收边界。
5. **中断与接手。** 如果 Agent 中断，接手者打开 Task 即可看到目标、状态、评论、附件、Thread、Branch/Worktree 和最后验证结果；若状态版本已变化，更新冲突会被显式发现。恢复中心是“这项工作当前到哪里”。
6. **交付与用户验证。** TestFlight 和用户回访可以作为子 Task、相关 Task 或评论继续管理；也可以在项目 Workflow Workspace 中设计 Git 状态、测试、API 和部署节点。当前基线下，这个可视化 Workspace 更适合被理解为工作流设计与关联表面，真正执行仍需 Codex、外部服务或后续执行层承接。
7. **系统如何认为工作闭环。** Dashi 最自然的闭环是：主 Task 及必要子 Task 已执行、自验证、进入 Review，并由用户明确接受为 `done`。它直接证明工作责任已经关闭；“整个 2.3.1 Release 是否完整”“反馈指标是否达到长期产品目标”需要再由上层 Task 结构、人工规则或外部系统表达。

Dashi 在这个案例中最强的地方，是迅速把模糊反馈转成团队和 Codex 都能领取、追踪、接手和验收的工作对象。

### 10.4 Arckit：把完整研发过程组织成有证据的软件状态演进

1. **反馈进入与归并。** Feedback Hub 将 18 条反馈关联到 Product、版本 `2.3` 和相关行为，形成 WorkItem；团队确认优先级后建立 Case。Case 的起点不是“有一个 Bug Task”，而是明确当前状态缺口：已发布版本在弱网保存场景下的实际行为与产品预期不一致，根因和影响范围未知。
2. **责任和问题建模。** 当前 Project/Case State 区分已经成立的事实与待解决 gap：产品对失败与重试的要求是否明确，Interaction 是否定义等待/失败/恢复状态，Tech 是否已有幂等与超时契约，实际实现和验证证据分别缺什么。只处理与本故障相关的 facet，不要求机械地走完所有文档类型。Work Hub 再把诊断、人工决策或外部等待呈现给对应责任人。
3. **代码执行。** Controller 每轮从 fresh Case State 选择一个有边界 gap；Runtime 或 Developer Workbench 将它交给合适的人、Agent 和本地/云端工具。Debug 能力先用日志、弱网模拟和代码路径确认根因；必要时 Spec/Interaction/Tech 更新稳定预期；实现 Agent 只修改被证据指向的客户端或服务端路径。Skill 选择服务于 gap，不构成固定流水线。
4. **评审与批准。** 每轮 Run 产生的 Patch、测试、设备录屏、日志、API 指标、Build 和人工判断都只是候选 Evidence。Gate 判断它们是否足以支持具体 transition，例如“根因已确认”“客户端恢复行为已对齐”“服务端幂等契约已验证”。高风险取舍、发布授权和体验判断交给人，不由 Agent 自我声明完成。
5. **中断与接手。** 如果 Agent 中断，接手者优先读取 Case 当前状态：目标、已接受的事实变化、证据、未解决 gap、风险、Handoff 和下一责任；无需重放完整对话才能知道软件现在处于什么状态。原始 Run 和对话仍可用于审计和追根。
6. **交付与用户验证。** Delivery Center 将已验证代码组织成 `2.3.1` Build/Release Candidate，经人工批准进入 TestFlight 灰度。版本指标、崩溃/超时数据和原反馈用户确认回到 Feedback Hub，成为“修复在真实使用中是否成立”的新 Evidence；若仍有失败，会生成下一轮 gap，而不是把发布自动当成终点。
7. **系统如何认为工作闭环。** Arckit 最自然的闭环是：与本 Case 有关的预期、根因、实现、验证、交付和反馈状态都获得足够证据，完成态复审通过，Case transition 被接受并汇总进 Project State。它不要求一个 Case 吞掉整个产品历史，但要求自己声称解决的状态范围真实成立。

Arckit 在这个案例中最强的地方，是把“发现问题、改变代码、交付版本、获得真实反馈”连接成可恢复的软件状态因果链，而不是仅保存执行经过或工作项状态。

### 10.5 同一研发阶段的直接对照

| 研发阶段 | Buzz 的中心对象与动作 | Dashi 的中心对象与动作 | Arckit 的中心对象与动作 |
| --- | --- | --- | --- |
| 反馈进入 | Channel/Thread/Issue 中的签名事件，Agent 搜索与归并 | Bug Task、评论、附件、优先级 | Feedback → WorkItem → Case state gap |
| 组织责任 | 成员、提及、频道、Workflow/项目约定 | Assignee、Board、子任务、依赖、状态 | WorkItem/Handoff 负责社会协调，Case 负责软件状态变化 |
| Agent 执行 | Agent 作为成员在 Branch Channel 发布工具活动、Patch 和结果 | Agent 领取 Task，绑定 Codex Thread 与 Branch/Worktree | Agent/Skill/Run 根据当前 gap 执行并回传候选 Evidence |
| 评审批准 | Signed Approval 证明谁批准了哪个提交或事件 | Review 后由用户明确把 Task 接受为 done | Gate 判断 Evidence 是否足以接受特定 state transition |
| 中断恢复 | 从共同协作历史和 Branch Channel 恢复 | 从 Task Detail 和执行上下文恢复 | 从当前 Case/Project State、Evidence 和 Handoff 恢复 |
| 构建发布 | Release Workflow/Agent 延续事件和审批链 | Release Task、评论、关系或外部自动化 | Build/Release 是软件现实状态的必要阶段，并受发布授权约束 |
| 用户验证 | 新反馈继续成为可搜索、可响应事件 | 新反馈进入原 Task 评论或关联 Task | 新反馈作为版本现实 Evidence，关闭或重新打开状态 gap |
| 闭环含义 | 共同历史中出现明确结果并可继续响应 | 工作项经过执行、Review 与人工验收 | 声称解决的软件状态范围被证据支持并写入新状态 |

### 10.6 压力测试：修复提交了，但灰度仍失败

假设三个系统都已经完成 Merge，而 TestFlight 中仍有 2 名用户复现：

- Buzz 会忠实记录新的反馈事件、对应版本、参与者响应和下一次 Patch；是否推翻之前的“完成”结论，取决于 Issue/Workflow 与团队约定。
- Dashi 会重新打开原 Task，或创建一个关联/阻塞 Task，再次进入任务生命周期；之前 Task 是否算错误关闭，由用户和团队工作规则判断。
- Arckit 会把真实反馈视为反证：如果原 Case 声称“弱网保存问题已在真实版本解决”，该 transition 的证据不再充分，需要恢复或建立后续 Case；如果原 Case 只声称“根因已确认并完成候选修复”，则保留已成立部分，只推进尚未成立的交付与反馈 facet。

这个压力测试揭示了最根本的差异：三者都能继续工作，但分别从**新协作事件、重新开启的工作项、被现实证据修正的软件状态**开始下一轮。

## 11. 从案例反推三个产品的根本差异

### 11.1 它们最先把现实翻译成什么

- Buzz：把现实翻译成参与者可见、可验证来源、可继续响应的协作事件。
- Dashi：把现实翻译成有责任、有生命周期、可执行和可验收的工作项。
- Arckit：把现实翻译成当前软件状态与目标状态之间、需要证据消除的 gap。

### 11.2 它们最自然的分解方式是什么

- Buzz 按协作上下文、参与者和事件关联分解：Community、Channel、Thread、Branch Channel。
- Dashi 按工作责任和依赖分解：Project、Task、Subtask、Blocks、Assignee。
- Arckit 按软件状态变化和证据边界分解：Product/Project、WorkItem、Case、facet、Loop、Run。

### 11.3 它们各自最不能容忍什么失败

- Buzz 最不能容忍关键协作发生在共同协议之外，导致作者、历史或响应关系不可追溯。
- Dashi 最不能容忍工作无人负责、上下文丢失、状态冲突或没有明确验收出口。
- Arckit 最不能容忍系统声称软件已经推进，但没有足够事实和证据支持这个结论。

### 11.4 它们需要从其他层补什么

- Buzz 若要管理完整软件生命周期，需要在事件之上增加更强的工作对象、领域状态和完成规则。
- Dashi 若要判断跨 Task 的产品完整性，需要在任务结构之上增加持续 Product/Project State 与证据语义。
- Arckit 若要成为易用平台，需要在状态协议之外建设优秀的协作网络、工作表面、身份权限、实时活动和执行体验。

这里的“需要补”不是核心缺陷，而是任何单一核心进入完整平台后都必须承担的产品化工作。区别在于补进来的能力是服务原核心，还是逐渐改变了平台的解释中心。

## 12. 为什么相似能力不会自动消除核心差异

三个系统都可以拥有消息、任务、Agent、Workflow、Review、审批、日志、代码、发布和反馈，但需要继续追问四个问题：

1. 用户默认从哪个对象进入工作？
2. 系统原生约束和验证的是什么？
3. 什么证据足以宣布完成，完成结论覆盖多大范围？
4. 当现实反驳旧结论时，系统从哪里恢复下一轮？

对应到本案例：

| 判断问题 | Buzz | Dashi | Arckit |
| --- | --- | --- | --- |
| 默认入口 | 共享空间与活动流 | Board 与 Task Detail | Product/Project State、Work/Attention 与 Case |
| 原生强约束 | 事件来源、传播、关联和共同历史 | Task 责任、生命周期、执行上下文和验收 | gap、Evidence、Gate 与可恢复 transition |
| 完成结论 | 某个协作过程已有明确结果 | 某项工作已被接受 | 某个明确软件状态范围已经成立 |
| 现实反证后的恢复点 | 新事件与原 Channel | Reopen/关联 Task | 修正或继续 Case/Project State |

所以，相似功能只说明三个产品都在进入真实研发；核心差异仍决定它们如何解释这些功能、如何组合平台，以及最后信任哪一种完成结论。

## 13. 常见疑惑与回答

### 疑惑一：Arckit 中也有任务和状态，为什么还说它不同？

因为区别不在于有没有 Task 和 State，而在于什么拥有最终解释权。

Arckit 中 Task/WorkItem 表达团队安排；Case State 表达软件真实推进。Task 可以是输入和投影，但 Task 状态不会自动证明软件状态已经成立。

### 疑惑二：Dashi 也有状态流转，它是不是也是 state-driven？

广义上可以这样说，但它主要驱动的是 Task workflow state。Arckit 所说的 `state-driven loop` 主要驱动软件定义、实现、验证、问题和 Handoff 的语义状态。

两者不是状态与非状态的区别，而是“任务管理状态”和“软件研发状态”的区别。

### 疑惑三：Buzz 的 Event 也是事实，和 Arckit Evidence 或 Ledger 有什么区别？

Buzz 的签名事件首先确认行为来源、内容完整性和共享历史。Arckit 的 Evidence 和 Ledger 进一步判断：这些行为或产物是否足以支持某个软件状态变化。

“Agent 发布了测试结果”是一条可验证来源的事件；“该测试结果足以让 verification facet 进入 resolved”是另一层语义判断。

### 疑惑四：这些是不是从不同角度解决同一个问题？

是。共同问题是人和 Agent 如何跨时间持续完成真实工作。

但它们处理的是不同类型的不确定性：

| 项目 | 主要减少的不确定性 |
| --- | --- |
| Buzz | 来源与共同认知不确定性：谁做了什么，其他参与者是否看见 |
| Dashi | 责任与工作流不确定性：做什么、谁负责、进行到哪里 |
| Arckit | 真实性与完整性不确定性：软件现在是什么、是否真的满足预期 |

### 疑惑五：如果功能最后都很相似，核心差异还有意义吗？

有意义。核心会持续影响：

- 默认产品首页展示什么；
- 数据模型以什么对象为中心；
- 哪些操作需要强约束；
- 怎样定义失败和恢复；
- 怎样衡量产品是否成功。

例如：

- Buzz 更自然地以 Room、Timeline、成员和搜索组织体验。
- Dashi 更自然地以 Board、Queue、Task Detail 和 Review 组织体验。
- Arckit 更自然地以 Product/Project State、Case gap、Evidence、Attention 和 Recovery 组织体验。

### 疑惑六：一个核心是否会隐式包含另外两个核心？

会包含部分能力，但不等于自动获得另外两个核心的全部价值。

- Arckit 需要事件和任务作为输入、执行和投影，但 `state-driven loop` 本身不会自动产生优秀的实时社交协作体验。
- Buzz 可以用事件表示任务和状态，但事件可验证不等于软件状态变化已经被正确判断。
- Dashi 可以扩展丰富的状态和证据字段，但 Task 完成不天然等于产品与实现事实完整。

所谓“隐式包含”，通常意味着为了完成自己的核心目标，产品必须补齐其他层的最低能力，而不是三个核心最终完全等价。

### 疑惑七：哪个项目更底层或更先进？

这不是一个稳定、有效的排序。

- Buzz 在统一人机身份、协作协议和事件历史方面更深入。
- Dashi 在 Codex 工作项、任务领取、执行上下文和人工验收方面更直接。
- Arckit 在软件事实、状态缺口、证据转移和跨会话恢复方面更深入。

更合适的问题是：某个具体场景最需要解决哪一种连续性和不确定性。

## 14. 对 Arckit 产品方向的启示

### 14.1 不应通过“功能是否独有”判断 Arckit 的价值

任务、评论、Agent、Workflow、审批、日志、搜索和看板都可能出现在其他产品中。Arckit 的差异不应建立在这些功能是否独有，而应建立在：

> 所有功能是否最终服务于 evidence-backed state transition，以及在参与者、工具和会话变化后，软件状态是否仍然可恢复、可验证、可继续。

### 14.2 外围产品表面可以相似，核心语义不能丢失

Arckit 未来可能出现类似任务板、协作时间线、Agent 活动、审批中心或消息工作台的产品表面。表面相似并不削弱核心差异。

关键是保持语义边界：

- Task 不直接等于 Case。
- Event 不直接等于 accepted fact。
- Conversation 不直接等于 state。
- Agent result 不直接等于 evidence accepted。
- Task done 不直接等于 Case resolved。
- Case resolved 不自动等于 Project 维度完成。

### 14.3 平台产品应按状态闭环生发，而不是按 Skill 清单生发

`state-driven loop` 首先决定平台必须覆盖哪些真实阶段，而不是先决定要安装哪些能力。Product Studio 保持状态的产品归属，Work Hub 承接责任与注意力，Workbench 和 Runtime 执行一次有边界的推进，Delivery Center 让代码成为可使用版本，Feedback Hub 让用户现实回到下一轮，Capability Hub 才负责复用其中反复有效的能力。

每个新平台场景都可以通过以下问题检验是否真正属于同一个核心：

1. 它维护的是软件生命周期中的哪类真实状态？
2. 哪种输入会暴露 gap，并由哪个产品表面承接？
3. 人、Agent、工具或外部系统如何完成一次有边界的推进？
4. 哪些 Evidence 与人工判断足以接受状态变化？
5. 变化如何影响交付、用户现实和下一轮 Project State？
6. 哪部分成功方法值得沉淀为可复用、可版本化、可治理的 Capability？

在这个结构里，Spec、Interaction、Visual、Tech、Debug、Implementation 和 Verification 是可组合的事实或执行能力；调用哪一个 Skill 只是单次 Loop 的路由问题。平台价值来自它们共同服务于同一条产品生命线，而不是能力数量本身。

## 15. 最终判断

三个项目的相似来自共同时代问题，差异来自各自选择了不同的连续性中心和核心不变量。

可以用三句话作为团队后续讨论的共同起点：

> Buzz 让人和 Agent 在同一个协作网络中持续共同工作。

> Dashi 让人和 Agent 围绕明确工作项形成可管理的执行闭环。

> Arckit 让人和 Agent 围绕真实软件状态形成可验证、可恢复的演进闭环。

进一步压缩：

> Buzz 保持协作连续性，Dashi 保持工作连续性，Arckit 保持软件状态连续性。

这三者不是简单互斥的产品类别，也不是同一个抽象维度上的三种实现。完整产品可能覆盖三种能力，但它首先选择守护什么，仍然决定其产品中心、架构取舍、交互方式和长期演进方向。

## 参考资料与调研边界

### Buzz

- [Buzz repository](https://github.com/block/buzz)
- [Buzz README](https://github.com/block/buzz/blob/f53bbd1152464ecbb1de495e2d1d959e156138f0/README.md)
- [Buzz Architecture](https://github.com/block/buzz/blob/f53bbd1152464ecbb1de495e2d1d959e156138f0/ARCHITECTURE.md)
- [Buzz Vision](https://github.com/block/buzz/blob/f53bbd1152464ecbb1de495e2d1d959e156138f0/VISION.md)
- [Buzz Projects / Forge Vision](https://github.com/block/buzz/blob/f53bbd1152464ecbb1de495e2d1d959e156138f0/VISION_PROJECTS.md)
- [Buzz Agent Vision](https://github.com/block/buzz/blob/f53bbd1152464ecbb1de495e2d1d959e156138f0/VISION_AGENT.md)
- [Buzz Activity Vision](https://github.com/block/buzz/blob/f53bbd1152464ecbb1de495e2d1d959e156138f0/VISION_ACTIVITY.md)
- 本报告调研基线：`f53bbd1152464ecbb1de495e2d1d959e156138f0`

### Dashi Taskboard

- [Dashi Taskboard repository](https://github.com/chuspeeism/dashi-taskboard)
- [Dashi Taskboard README](https://github.com/chuspeeism/dashi-taskboard/blob/677b54451db707ae6132486b6593b7be11e4ee09/README.md)
- [manage-taskboard Skill](https://github.com/chuspeeism/dashi-taskboard/tree/677b54451db707ae6132486b6593b7be11e4ee09/skills/manage-taskboard)
- [Cloud collaboration](https://github.com/chuspeeism/dashi-taskboard/blob/677b54451db707ae6132486b6593b7be11e4ee09/docs/cloud-collaboration.md)
- [AI Chat service](https://github.com/chuspeeism/dashi-taskboard/blob/677b54451db707ae6132486b6593b7be11e4ee09/server/ai-chat.mjs)
- [Task domain model](https://github.com/chuspeeism/dashi-taskboard/blob/677b54451db707ae6132486b6593b7be11e4ee09/shared/domain.mjs)
- [Workflow control-flow model](https://github.com/chuspeeism/dashi-taskboard/blob/677b54451db707ae6132486b6593b7be11e4ee09/shared/workflow-control-flow.mjs)
- 本报告调研基线：`677b54451db707ae6132486b6593b7be11e4ee09`

### Arckit

- [问题背景](../../spec/agentic-software-development/problem-background.md)
- [解决思路](../../spec/agentic-software-development/solution-principles.md)
- [产品概念](../../spec/agentic-software-development/product-concepts.md)
- [产品架构](../../spec/agentic-software-development/product-architecture.md)
- [Skill 架构](../../spec/agentic-software-development/skill-architecture.md)
- [Controller Worker Loop](../../spec/agentic-software-development/controller-worker-loop.md)
- [Arckit Runtime 技术方案](../../tech/arckit-runtime/solution.md)
- [AI 原生软件产品研发平台候选蓝图](../../pending/items/2026-07-14-ai-native-software-product-development-platform-blueprint.md)

平台蓝图当前仍为 `candidate / process_handoff`。本报告使用它理解 Arckit 的长期产品方向，但不会把其中尚未确认的七个产品单元、领域模型和系统边界表述为已经接受或实现的正式事实。

## 后续可讨论问题

1. Arckit 对外最容易理解的核心产品语言，应该是“软件状态连续性”“state-driven loop”，还是两者的组合？
2. Product、WorkItem、Case 和 Run 在未来产品界面中应如何让普通用户自然理解，而不暴露过多协议术语？
3. Arckit 的协作时间线应该突出 raw events，还是突出被接受的 state transitions 与 Evidence？
4. 哪些 Task 状态可以由 Case transition 自动投影，哪些必须保留独立人工判断？
5. 如何评估 Arckit 的成功：任务吞吐、Agent 自动化比例，还是软件状态恢复和正确推进的质量？
