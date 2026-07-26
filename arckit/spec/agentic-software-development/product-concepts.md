# 产品概念

## 定位

本文件只定义软件开发 Agent 协作与接力协议层中的核心产品概念。它不描述具体实现方式，不描述能力包结构，也不把产品概念绑定到某个具体执行载体。

这些概念共同构成 Arckit 的产品方案基础。完整产品方案不是单一文档，而是由问题背景、产品概念、产品架构和实现架构共同表达。

## 人

人是软件研发目标、价值判断、约束选择、风险接受和最终确认的主体。

人在系统中不只扮演“需求提出者”。人还会提供灵感、原则、纠错、偏好、上下文、阶段目标、验收判断和组织约束。

人的表达可以不完整、不稳定、不专业化。系统承认这种表达是事实，并负责把它转化为可推进的软件研发活动。

## Codex 类 Agent

Codex 类 Agent 是具备软件研发执行能力的 AI 协作者。它可以理解自然语言、读取项目、修改文件、运行命令、生成文档、观察结果并继续对话。

Agent 是执行主体之一，不是传统意义上的静态工具。Agent 能承担一部分产品、工程、验证、沉淀和协作工作，但它仍受上下文、权限、成本、可靠性和组织约束影响。

在 Desktop + Agent + Skill 架构中，Codex 类 Agent 负责语义理解、代码/文档执行、证据收集和结构化 claim 输出。Agent 不拥有 Desktop 的产品/runtime 控制架构，也不直接决定 Project State 写回。

## Desktop Runtime

Desktop Runtime 是 Arckit 的产品级控制面。它负责项目选择、会话、运行记录、执行授权、worker 调度、report intake、状态门禁、ledger writeback 和 UI control state。

Desktop Runtime 不替代 Agent 的语义推理。它把 Agent 或人类给出的语义判断压成可验证的结构化 claim，并用确定性代码检查协议、证据、路径归属、人工门禁和状态写回条件。

## Skill

Skill 是安装到 Codex 类 Agent 中的底层能力包。它为 Agent 提供可复用执行方法、事实源维护规则、输入输出契约、脚本、模板和安全边界。

Skill 不拥有 Desktop Runtime 架构，不定义产品级状态机，不决定自动写回策略，也不作为 Project State 的最高层事实源。Skill 可以帮助 Agent 完成 bounded task，但它不能替代 Desktop、Agent 或人类承担各自的职责。

## 多 Agent 自动化平台

多 Agent 自动化平台是由多个 AI 角色、loop 控制、工具执行、状态管理和人类接手机制组成的软件研发执行环境。

平台可以自动推进日常软件项目开发，例如规划任务、生成 handoff、修改代码、诊断失败、运行验证、回写状态和请求人类确认。平台不等同于 Arckit。平台负责调度、权限、队列、环境、重试、通知和用户界面；Arckit 负责定义平台和人类共同读写的项目事实、case 状态、handoff、开放问题和仓库上下文。

## Arckit 协议层

Arckit 协议层是位于人类、单 Agent、多 Agent 自动化平台和外部工具之间的软件研发协作协议。

它不拥有所有智能能力，也不替代具体编码、设计、发布、CI、部署或项目管理工具。它定义不同执行体如何围绕同一个软件项目理解目标、读取事实、声明边界、交接任务、记录未决、验证结果和回写状态。

Arckit 协议层的核心价值是让协作可恢复。无论上一轮由人类、Codex 类 Agent 还是自动化平台执行，下一轮执行体都能通过 Arckit 记录理解当前状态并继续。

Arckit 协议层的最高层产品对象是 Project State。Case 和 Loop 都服务于 Project State 的持续推进。Agent、skill、runtime、Desktop、handoff 和 ledger 是推进、保护或恢复状态变化的机制，不是最高层产品对象。

## AI 能力假设

AI 能力假设描述某个版本的系统默认可使用什么水平的 Agent 能力。

能力假设包括理解能力、上下文容量、工具权限、执行稳定性、长程任务能力、成本、速度、安全策略、组织授权和行业合规边界。

不同能力假设会推导出不同产品形态。能力假设变化时，系统需要回到问题背景重新推导，而不是简单在旧方案上追加规则。

## Prompt

Prompt 是人向 Agent 传递软件研发意图的自然语言入口。

Prompt 不是单一命令。它可以同时表达真实目标、当前阶段、需求、约束、价值判断、做事方式、实现请求、纠错、素材、未决想法和沉淀意图。

Prompt 的特点是高压缩、多义、上下文依赖和持续演化。系统不能要求人先把 prompt 转化为完整专业文档。

## Agent 启动上下文

Agent 启动上下文是 Agent 或自动化平台进入项目时必须先知道的稳定操作规则。

它包括仓库导航、事实源读取顺序、AGENTS.md 规则、长期协作约定、禁止范围和目录级约束。它不保存聊天记录，不承载产品功能事实，也不替代 spec、tech、interaction、visual 或 case 状态。

## 显式约束

显式约束是 prompt、项目上下文、运行证据或用户纠错中已经明确给出的边界、条件、禁止范围、验收标准、技术限制、时间范围、平台范围或操作要求。

显式约束不等于表达清晰度。系统不对用户表达做主观清晰度评分，只判断哪些约束已经显式给出，哪些仍缺证据或需要确认。

显式约束用于减少无意义追问、避免擅自扩大范围，并指导验证。显式约束之间发生冲突时，系统应暴露冲突，而不是机械执行。

## 语义材料

语义材料是系统从 prompt、项目上下文、历史记录、运行证据和用户纠错中识别出的可理解信息。

语义材料不是稳定事实。它需要经过阶段判断、事实源判断和沉淀判断，才能成为阶段产物、过程事实或正式事实。

## 真实软件预期

真实软件预期是用户最终希望真实世界中的软件或 Agent 系统达到的状态。

它可能包含真实用户、真实场景、真实运行环境、真实上线、真实运营、真实协作和真实迭代。

真实软件预期通常大于单轮对话能完成的范围。系统需要持续区分真实软件预期和本轮可交付内容。

## Project State

Project State 是一个软件项目在 Arckit 视角下的当前可恢复状态。

Project State 不等同于单个 Markdown 文件、JSON 文件或任务列表。它是软件整体的宏观恢复与选择状态，由项目维度、project gaps、active Case 引用、Case 选择和证据引用共同表达。

Project State 至少包含以下维度：

- 目标状态：项目当前要解决什么真实软件预期。
- 宏观完整性：哪些项目能力维度已达到目标，哪些仍存在项目级 gap。
- Case 集合：哪些 bounded matters 处于 active、blocked 或 closed，以及当前选择哪个 Case。
- 迭代位置：项目当前阶段性目标与可追溯的状态变化。
- 证据引用：宏观状态判断由哪些稳定事实、Case 结果和验证证据支撑。

Project State 的作用是让项目在跨人、跨 Agent、跨会话、跨时间后仍能被恢复，而不是依赖上一轮对话记忆。

Project State 可以按维度演进，而不是只有单一全局状态。它不保存单个事项的产品/交互/视觉/技术/实现/验证满足度，也不保存本轮 continuation；这些属于 Case 与 Loop。

每个尚未达到 target、具有明确 gap 且需要继续推进的 Project dimension，必须被一个或多个 Project gap 的 `covered_dimensions` 覆盖。Project gap 可以跨多个宏观维度，但必须声明主维度、覆盖范围、风险、依赖和下一状态转移；它只用于选择或创建 Case，不直接成为 Worker 任务。

Iteration State 是 Project State 的阶段性目标与 resolved-Case 聚合，不是第二个 Loop 控制器。它只保存目标 Project states、带 closed Case 与持久证据的 accepted Project changes、验收状态、blocking Project gaps 和 Case refs。它不保存 next responsibility、trigger mode、continuation prompt、Worker 顺序、round goal 或同态历史日志。

Project 与 Iteration canonical evidence 必须跨会话可恢复。`/tmp`、`/private/tmp`、进程内对象和只存在于某次对话的输出不能作为 canonical evidence ref；需要保留的 Runtime、安装或验证证据必须进入持久路径或由 closed Case 引用。

系统不在缺少来源依据、case 或明确用户授权时静默更新 Project State。

## Case

Case 是围绕一个具体研发事项推进 Project State 的承载单元。

Case 把一个状态缺口、目标状态、边界、证据要求和推进记录聚合到一起。Case 不是普通待办，也不承载所有想法、聊天内容或普通上下文。只有当一个事项需要持续推进、验证、接力、等待、阻塞判断或关闭时，它才成为 case。

Case 对单次研发事项维护六个彼此正交的结果 facet：product expectation、interaction expectation、visual expectation、technical expectation、implementation state 和 verification state。每个 facet 分别表达适用性、当前与目标成熟度、当前与目标对齐度、resolution、理由和证据。开放问题、外部 handoff 与过程备注保持独立，不伪装成结果 facet。

Case 不预设 facet 的推进顺序。规格先行时可以先 formalize definition；代码先行时可以先建立 implementation evidence，再把从代码观察到的预期补充并与实现对齐；混合任务可以在任意 facet 之间往返。Case State 确定性派生全部 unresolved `candidate_gaps`，Controller 根据用户意图、代码、事实和风险选择本轮 gap，数组顺序不代表优先级。

六个 facet、open questions 和 pending handoffs 全部满足后，Case 进入 `base_ready`，但还不能关闭。ledger 随后派生跨 facet 的 `completion_review`：针对当前 `content_revision` 从 correctness（错误）、completeness（遗漏）和 minimality（多余）三个视角复审完整结果。复审不是普通 facet，也不要求显式调用固定 skill；Controller 根据 gap 和风险动态选择零个或多个执行者。

复审 finding 成为 Case 内的结构化未解决事实并驱动修复。任何修复或有证据的处置都会提升 `content_revision`，使旧 clean 结论失效；只有最后一次内容变化之后的复审 clean 才能关闭 Case。Case 在创建时从显式 policy 快照自主复审上限；最后一个授权轮次仍不 clean 时进入 `needs_human`，Agent 不得自行重置计数或追加预算。人类可以复审、处置 finding，或带理由和证据追加有限轮次。

普通想法、未确认风险、外部反馈、过程判断和候选方向默认进入低承诺空间；当前最小能力集使用 active case 的 `open_questions`、`pending_handoffs` 或 evaluation 记录承载。它们只有在需要被持续推进时才创建或更新 case。

Case 至少表达：

- 当前要推进哪个 Project State gap。
- 本事项的目标状态是什么。
- 哪些事实源、开放问题、handoff、约束和证据是依据。
- 六个结果 facet 中哪些达到 evidence-backed required target，哪些经证据判断为 not_required，哪些仍 unresolved。
- 哪些动作允许，哪些动作禁止。
- 当前处于规划、执行、验证、等待、人类判断、阻塞还是关闭。
- 关闭后 Project State 如何变化，或为什么可以无事实变化关闭。

Case 关闭前，每个结果 facet 都必须达到 evidence-backed required target，或形成有理由和证据的 not_required 判断；所有 open question 与 pending handoff 也必须被解决或完成；当前 `content_revision` 还必须获得三维 clean 完成态复审且没有 open finding。Case 关闭后才允许聚合显式 Project State delta，也可以形成明确的 no-change closure。

No-change closure 只在事项被证明重复、无效、过期、不再需要、合并到另一个 case、明确放弃或转移到外部责任方时成立。系统不能把 Agent 停止工作或没有更多输出当成 case 关闭。

## Loop

Loop 是推动一个 case 前进并尝试产生可验证状态变化的一次协作循环。

Loop 不等同于一次模型调用，也不等同于 Agent 内部工具调用循环。Loop 是从触发、恢复上下文、选择目标、执行或等待、验证、接力到生成下一步状态的完整业务循环。

Loop 至少表达：

- 本轮为什么启动。
- 本轮推进 selected Case 的哪个 candidate gap。
- 本轮允许哪些执行体参与。
- 本轮产生了什么证据、报告、变更、开放问题或 handoff。
- 本轮是否实际推进了状态。
- 下一步由 Agent、人类、外部系统还是无人继续。

Loop 的核心输出不是 Agent 输出了什么，而是一项 planned Case transition 是否产生并被接受为有证据的 Case delta，以及下一步由谁继续。

Loop 可以派发零个、一个或多个 Worker。若用户本轮确认、现有稳定事实或已有验证证据已经足以推进 selected gap，Controller 可以不派发 Worker，直接形成可追溯 evidence 与 accepted delta。每个 transition 必须绑定 Case revision；写回后下一轮重新读取状态，不能复用过期判断。

一个 loop 结束时必须分别说明 round outcome、Case resolution claim、Project impact candidate 与 handoff。单轮可以完成而 Case 仍 unresolved；Case 未 resolved 时不更新 Project 维度。Loop 不能因为 Agent 停止输出就被视为完成；完成必须依赖目标满足和证据通过。

## 当前阶段

当前阶段是本轮协作在真实软件研发链路中的位置。

当前阶段可以是输入归档、问题探索、价值判断、需求定义、体验设计、技术定义、任务计划、实现、诊断、验证、审查、交付、运行观察或工作方式沉淀。

当前阶段不是固定流程节点。它由用户目标、已有事实、约束、风险和上下文共同决定。

## 阶段产物

阶段产物是当前阶段应该交付的结果。

阶段产物可以是概念澄清、价值假设、决策结论、需求草案、正式规格、体验规则、技术约束、任务拆解、implementation worker packet、refactor strategy handoff、实现变更、验证报告、审查结论、发布判断、运行观察或待确认事项。

阶段产物不是最终完成状态。它表达当前轮次推进到了哪里。

## 最终产物

最终产物是能稳定改变软件系统或 Agent 系统行为的产物。

传统软件项目中，最终产物通常以代码和可运行服务为核心。AI Agent 时代，最终产物也可以是配置、脚本、模型化指令、工作流规则、行为约束文件或其他能稳定改变系统行为的对象。

最终产物表达实现事实的一部分。

## 最终产物类型

最终产物类型描述本项目稳定改变行为的对象主要是什么。它用于选择实现承载、验证证据和发布或同步治理方式，不用于把需求、设计、技术方案、迭代治理和验证前置流程拆成不同体系。

Code 类最终产物以可被工程工具构建、测试、运行和部署的 code 工作区为核心，源代码目录、工程配置、脚本、资源和部署描述共同表达软件实现；构建产物、运行环境、测试结果、日志、用户行为和线上状态属于实现证据或运行证据。

Skill 类最终产物以可被 Agent 发现、加载和执行的 skill 目录或 Skill 项目为核心；单个 skill 是包含 `SKILL.md` 入口说明文件的目录，可包含 `references/`、`scripts/`、模板或资产等支持资源，并通过 frontmatter 提供名称、描述、目标 Agent 和版本等发现信息；配置组、应用目标、安装同步关系、漂移记录和行为验证结果属于治理、分发、验证或实现证据，不是单个 skill 的组成部分。

不同最终产物类型共享同一套软件研发操作层。需求、体验、技术、计划、治理和验收口径按真实软件预期判断；实现阶段通过 `artifact_type` 选择 code、skill、document、workflow 或 mixed artifact 的承载方式；验证阶段按产物类型收集不同证据。

## 过程产物

过程产物是生产、验证、协作和复盘最终产物所需的中间产物。

过程产物包括原始输入记录、分析过程、决策依据、规格、体验规则、技术方案、任务计划、验证结果、审查结论、运行观察和未决事项。

过程产物不等于不重要。它们决定最终产物是否有方向、边界、价值、验收口径和协作基础。

## Handoff

Handoff 是一个执行体把当前研发事项交给另一个执行体继续处理时必须提供的结构化过程产物。

接收方可以是人类、Codex 类 Agent、多 Agent 平台中的某个角色、技术栈编码能力、Skill First、ArcForge、CI、部署系统或其他外部 adapter。

Handoff 至少说明目标、来源事实、确认程度、允许范围、禁止范围、必须保持不变的行为、风险、验证要求、停止条件、回写位置和开放问题。Handoff 的作用不是替人类或下游能力拍板，而是降低接手成本和误改风险。

## Loop Handoff

Loop Handoff 是 loop 结束时表达下一轮能否继续、由谁继续、如何触发继续的结构化接力状态。

Loop Handoff 不是 case 本身，也不是 Project State 本身。它是 loop 的接力输出，用于说明本轮对 case 和 Project State 的影响，以及下一轮恢复方式。

Loop Handoff 不等同于人类接手。它先判断下一步职责归属，再判断触发方式。职责归属至少包括：

- `agent`：下一步本质上应由 Agent 继续处理。
- `human`：下一步需要人类判断、授权、审美、商业取舍、风险接受或发布责任。
- `external`：下一步等待 CI、云控制台、第三方审批、本地人工编译结果或其他系统外结果。
- `none`：当前事项已完成或无需继续。

触发方式表达下一轮如何开始，至少包括 `manual_bridge`、`auto_bridge`、`user_decision`、`external_wait` 和 `none`。`manual_bridge` 表示下一步本应由 Agent 继续，但当前缺少自动续轮调度器，需要人把 Loop Handoff 中的 `next_prompt` 或 `agent_instruction` 手动交给下一轮 Agent。它不是人类决策，也不表示人类对事项承担产品或工程判断责任。

当 `next_responsibility=agent` 且 `agent_continuation_available=true` 且 `human_decision_required=false` 时，自动化平台可以用 Loop Handoff 触发下一轮 Agent。当前没有自动桥时，人类只承担触发动作，不承担该步骤的决策责任。

当 `human_decision_required=true` 时，系统必须说明需要人类处理的 `decision_needed`。该状态不能被自动桥静默推进。

## 人类接手

人类接手是自动化或 Agent 执行无法可靠继续时，系统把任务交还给人类继续推进的机制。

人类接手不是失败的附属说明，而是 Arckit 协议层的基本产品能力。接手材料应包含当前 case、项目状态、已确认事实、过程事实、实现事实、验证结果、待处理 handoff、风险、开放问题和建议下一步，使人类不需要还原完整对话就能继续操作。

人类接手只适用于下一步职责属于人类或自动化无法可靠继续的情况。由人手动触发本应由 Agent 继续的下一轮属于 `manual_bridge`，不属于人类接手。

## 真实场景预期

真实场景预期是人对真实使用、真实协作或真实运行情境的表达。

它可以描述用户会怎么使用软件、团队会怎么协作、Agent 应该如何响应、运营素材应该来自哪里、发布过程应该如何发生，或某个能力在真实任务中不应该做什么。

真实场景预期不自动等同于需求。它可能是候选需求、验收样本、反例、回归样本、探索材料、风险提示或工作方式纠偏。

外部反馈属于真实场景预期的一种来源。外部反馈不留在普通对话里，也不直接写入正式 Project State。外部反馈默认先进入 active case 的开放问题、待处理 handoff、evaluation sample 或项目可选的低承诺数据 surface；经过 triage 后，只有可行动的反馈才创建或更新 case；只有经过验证、确认或明确接纳后，外部反馈才更新 Project State。

## 评测集

评测集是维护真实场景预期的过程产物集合。

它用于验证产品方案、实现事实、工作方式事实或能力单元是否覆盖真实活动。

评测集不替代正式规格。评测集中的场景经过确认和提炼后，可以提升为预期事实、测试用例、任务、未决项或工作方式事实。

当项目的最终产物是 skill 时，评测集用于验收 skill 是否能在真实研发场景中稳定改变 Agent 行为。当项目的最终产物是 code 时，评测集用于验收软件行为、运行证据和真实用户场景是否满足预期。两类评测共享场景化预期、能力组合、沉淀路径和提升规则，只在证据类型上不同。

## 预期事实

预期事实表达软件或 Agent 系统应该是什么。

它回答目标、价值、行为、边界、验收口径、成功标准和当前阶段范围。

预期事实用于判断实现是否符合期望。

## 实现事实

实现事实表达软件或 Agent 系统现在是什么。

它来自代码、配置、可运行服务、行为约束文件、运行结果、测试结果、日志和环境状态。

实现事实不自动代表正确预期。用户通过实现探索答案时，实现既是过程工具，也是可能的最终产物。

## 过程事实

过程事实表达尚未稳定为预期事实或实现事实的探索、判断、证据、风险和开放问题。

过程事实用于保留思考链路，避免信息丢失，也避免把不稳定判断写入正式事实源。

## 工作方式事实

工作方式事实表达人和 Agent 应该如何协作。

它回答某类任务如何拆解、何时确认、何时验证、何时沉淀、何时停止、何时重新判断。

工作方式事实不承载产品功能事实。它承载协作方式和执行经验。

## 接力状态

接力状态表达当前事项能否被另一个执行体继续处理。

它关注当前目标是否清楚、事实依据是否可定位、范围是否明确、风险是否暴露、验证是否记录、下一步是否可执行，以及是否存在必须由人类确认的问题。接力状态是人机协作和多 Agent 自动化平台之间共享的恢复接口。

接力状态通过 Loop Handoff 区分职责归属和触发机制。人类、Agent、自动化平台和外部 adapter 读取同一份接力状态，但只执行属于自身职责的下一步。

## 低承诺空间

低承诺空间用于保存尚未确认但可能有价值的信息。

当系统无法可靠判断某个信息是否应该成为正式事实时，它进入低承诺空间，而不是被丢弃或直接污染正式事实源。

低承诺空间中的内容可以通过用户确认、重复出现、验证结果、实现结果或后续纠错被提升。

当前最小 skill 集不为低承诺空间设置独立能力。active case 的 `open_questions` 和 `pending_handoffs` 是默认承载；项目仍可保留 `arckit/pending/` 或 `arckit/intake/` 作为数据 surface，但它们不进入 Runtime capability policy。

## 操作层

操作层是位于人和 Agent 执行能力之间的产品层。

它负责把语义材料转化为当前阶段、阶段产物、事实源路由、执行动作、验证关系和沉淀路径。

操作层不等于具体执行载体。它定义系统应该如何理解和组织人类、单 Agent、多 Agent 平台和外部工具共同参与的软件研发活动。
