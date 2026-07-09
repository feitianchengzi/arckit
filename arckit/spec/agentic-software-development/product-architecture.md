# 产品架构

## 架构定位

产品架构描述软件开发 Agent 协作与接力协议层中各产品概念如何组合成一个系统。它回答系统整体长什么样、概念之间如何流动、事实如何分工，以及一次协作如何从输入推进到产物、handoff、沉淀和人类接手。

该架构不描述具体能力包或实现细节，也不定义多 Agent 自动化平台的调度、队列、权限、运行环境或 UI。具体执行载体在实现架构或外部平台中定义。

## 整体结构

Arckit 的产品结构由六个核心部分组成：

| 结构 | 输入 | 输出 | 作用 |
|---|---|---|---|
| 语义入口 | prompt、上下文、证据、纠错 | 语义材料 | 接收人的自然表达并保留多义性 |
| 阶段判断 | 语义材料、真实软件预期、显式约束、证据、风险 | 当前阶段、阶段产物 | 判断本轮应该推进到哪里 |
| 产物系统 | 当前阶段、产物目标、最终产物类型 | 最终产物、过程产物 | 定义本轮要产生或维护什么 |
| 事实系统 | 产物、证据、确认程度 | 预期事实、实现事实、过程事实、工作方式事实 | 维护事实类型和边界 |
| 接力系统 | 当前阶段、事实源、执行结果、风险、接收方 | handoff、接力状态、人类接手材料 | 让人类、单 Agent、多 Agent 角色和外部 adapter 能继续同一事项 |
| 演化系统 | 执行结果、验证结果、评测集、用户纠错、接力结果 | 回流、低承诺沉淀、工作方式更新 | 让系统随项目和 AI 能力持续演进 |

这些结构共同服务于一个主轴：Project State 通过 Case 和 Loop 被持续推进。Project State 是最高层产品对象；Case 是推进某个 Project State gap 的承载单元；Loop 是推动 case 前进并产生可验证状态影响的协作循环。

## Desktop / Agent / Skill 分层

Arckit 的执行产品形态采用三层分工：

| 层 | 职责 | 不承担 |
|---|---|---|
| Desktop Runtime | 产品级 runtime control、项目/会话/run、执行授权、状态门禁、ledger writeback、UI control state | 不替代 Agent 的语义推理 |
| Codex 类 Agent | 语义理解、代码/文档执行、工具调用、证据收集、结构化 claim | 不拥有 Project State 写回权或 Desktop runtime 架构 |
| Skill | 安装到 Agent 中的底层能力包，提供可复用执行方法、事实源维护规则、输入输出契约和安全边界 | 不定义 Desktop 架构、产品状态机或自动写回策略 |

该分层保证 Desktop 控制运行，Agent 处理语义和执行，Skill 只增强 Agent 的可复用能力。Project State、Case 和 Loop 的产品语义不由单个 skill 决定。

## 概念关系

产品概念之间的主关系是：

1. 人通过 prompt 输入高压缩的软件研发意图。
2. 系统把 prompt 和上下文识别为语义材料。
3. 语义材料被判断为真实软件预期、当前阶段、显式约束、纠错、证据、风险或未决信息。
4. 系统根据 Project State 判断当前是否存在可推进的状态缺口。
5. 当状态缺口需要持续推进、验证、接力或关闭时，系统创建或选择 case。
6. 当前阶段和真实软件预期决定本轮应该产生阶段产物还是最终产物；最终产物类型用于选择实现承载和验证证据。
7. Loop 在 case 边界内推进本轮目标，并产出证据、报告、变更、pending 或 handoff。
8. 产物进入对应事实系统，成为预期事实、实现事实、过程事实或工作方式事实。
9. 当本轮不能或不应由当前执行体继续时，接力系统生成 handoff、接力状态、Loop Handoff 或人类接手材料。
10. 真实场景预期和外部反馈先进入 intake、pending 或评测集，再根据 triage 结果决定是否创建或更新 case。
11. 验证活动比较预期事实、实现事实和评测集中的场景化预期。
12. 经过验证或确认的 state delta 更新 Project State；不稳定信息进入低承诺空间。
13. 用户纠错、评测结果、执行结果和接力结果反向影响后续阶段判断、事实边界、case 状态和工作方式。

该关系保证系统不把 prompt 直接等同于任务，不把一次实现直接等同于正确预期，也不把某个 agent 或自动化平台的中间状态变成只有它自己能理解的私有上下文。

## Project State 主轴

Project State 是产品架构的最高层恢复对象。它表达项目当前在哪里、下一步最值得推进什么、哪些状态已被验证、哪些状态仍不可靠。

Case 是 Project State 的推进容器。一个项目可以同时存在多个 active、waiting、blocked 或 closed case。每个 case 应绑定一个或多个明确的 Project State gap。

Loop 是 case 的推进循环。一个 case 可以经历多个 loop。每个 loop 只能尝试推进当前 case 的一部分状态，不能静默扩大为新的项目目标。

一次状态推进的标准关系是：

1. Project State 暴露 gap。
2. 系统创建或选择 case。
3. Case 定义目标状态、边界和证据要求。
4. Loop 被触发并推进 case。
5. Loop 产出 evidence、report、change、pending 或 handoff。
6. Case 判断继续、等待、阻塞、人类判断或关闭。
7. Project State 根据验证后的 state delta 更新。

Project State 不由 loop 直接静默改写。Loop 的输出必须先通过 report intake、验证、case closeout 或 ledger gate，才能成为 Project State delta。

## 语义入口

语义入口接收人的 prompt，也接收项目上下文、历史事实、运行证据和用户纠错。

语义入口不立即判断内容真伪。它先保留语义材料的多本体属性，再交给阶段判断和事实系统处理。

语义入口的关键产物是当前任务处境。当前任务处境描述本轮输入在真实软件研发中的位置，包括最终目标、当前阶段候选、显式约束、不确定性、证据和可能影响的事实源。

## 阶段判断

阶段判断把当前任务处境转化为本轮推进点。

阶段判断不按固定流水线执行。它根据真实软件预期、已有事实、显式约束、证据、成本和风险判断当前阶段。

阶段判断不以用户表达是否清晰作为主观判断轴。表达是否具体只影响系统能直接使用哪些显式约束和验收口径；当信息不足、约束冲突或风险较高时，系统通过确认、低承诺沉淀或范围限制处理。

阶段包括输入归档、问题探索、价值判断、需求定义、体验定义、技术定义、任务计划、实现、诊断、验证、审查、交付、运行观察和工作方式沉淀。

## 产物系统

产物系统区分阶段产物、最终产物和过程产物。

阶段产物表达本轮推进到哪里。最终产物表达系统行为如何被稳定改变。过程产物表达生产、验证和协作最终产物所需的中间结果。

产物系统不把“是否重要”作为分类依据。分类依据是产物在软件研发链路中的作用。

产物系统同时识别最终产物类型。Code 类项目的最终产物以可运行软件和代码行为为核心；Skill 类项目的最终产物以 Agent 行为约束和可复用 skill 为核心；document、workflow 或 mixed artifact 也可以作为稳定改变系统行为的最终产物。

最终产物类型不改变阶段判断和前置软件流程。系统仍按真实软件预期判断需求、体验、技术、任务、治理和验收口径；进入实现时通过 `artifact_type` 选择实现 adapter；进入验证时按产物类型收集代码测试、构建日志、运行状态、Agent 执行行为、真实任务试跑、分发状态、文档事实对照或 workflow 回放等证据。

评测集属于过程产物。它承接真实场景预期，用于检查产品方案、最终产物和能力单元是否覆盖真实活动。

评测集不直接改变正式预期事实。评测结果可以触发规格修订、实现修复、任务生成、未决记录或工作方式更新。

Handoff 属于过程产物。它承接已经确认或可采信的事实、范围、风险和验证要求，用于把事项交给人类、单 Agent、多 Agent 角色或外部 adapter 继续执行。

Case 和 Loop 也属于过程产物。Case 承载研发事项的持续推进状态；Loop 承载一次推进循环的触发、执行、验证和接力状态。它们本身不替代预期事实或实现事实，但它们决定 Project State 是否可以被可靠更新。

## 事实系统

事实系统区分四类事实：

| 事实类型 | 表达什么 | 作用 |
|---|---|
| 预期事实 | 应该是什么 | 提供目标、边界和验收口径 |
| 实现事实 | 现在是什么 | 提供当前系统行为和运行证据 |
| 过程事实 | 如何判断、探索和未决 | 保存不稳定但有价值的信息 |
| 工作方式事实 | 人和 Agent 如何协作 | 保存可复用的协作方式 |

事实系统不设置单一最终事实源。不同事实源按问题语义分工。

Agent 启动上下文是事实系统的入口辅助层。它不保存产品功能事实，而是保存 Agent 进入项目时的读取顺序、仓库导航、长期协作规则和事实源路由规则。

Project State 是事实系统的恢复视图，不替代各事实源。Project State 读取事实源、case、pending、验证证据和工作方式事实形成可恢复状态；写回 Project State 时必须保留来源依据和状态变化原因。

## 接力系统

接力系统把当前事项整理为可被另一个执行体恢复的状态。

接力系统处理四类接收方：

- 人类：需要知道当前状态、已确认事实、风险、开放问题和建议下一步。
- Codex 类 Agent：需要明确目标、上下文读取顺序、允许修改范围、禁止触碰范围和验证要求。
- 多 Agent 自动化平台角色：需要结构化 handoff、停止条件、回写位置和失败上报方式。
- 外部 adapter：需要输入、输出、确认点、权限边界和结果回传位置。

接力系统的核心产物包括 `implementation_handoff`、`refactor_strategy_handoff`、`external_adapter_handoff`、pending handoff 和人类接手材料。

接力系统不替代执行。它定义执行前后的共享接口，使自动化平台可以继续推进，也使人类可以在平台无法继续时接手。

Controller Worker Loop 是接力系统在项目对话中的轮次形态。入口能力扮演 Controller：恢复状态、判断 turn delta、生成执行包、接收 worker report、判断 closeout 和输出下一轮 handoff。执行器必须通过 execution gate 显式绑定；绑定对象可以是人类手动分发的 Worker Agent、Desktop Runtime、外部平台或其他被授权执行体。

没有 Desktop 时，人类临时扮演 Runtime，在 Controller 对话和多个 Worker 对话之间搬运 worker packet、worker report、补充和纠错。Desktop 存在时，Desktop 自动化这些搬运动作、worker 生命周期、report intake、merge gate、暂停和继续，但不改变 Controller Worker Loop 的语义。

每轮结束时，接力系统生成 Loop Handoff。Loop Handoff 先判断 `next_responsibility`，再判断 `trigger_mode`：

- `next_responsibility=agent` 表示下一步仍应由 Agent 处理。若当前没有自动续轮调度器，`trigger_mode=manual_bridge`，人类只负责把 `next_prompt` 或 `agent_instruction` 交给下一轮 Agent。
- `next_responsibility=human` 表示下一步需要人类判断、授权、审美、商业取舍、风险接受或发布责任。该状态必须包含 `human_decision_required=true` 和 `decision_needed`。
- `next_responsibility=external` 表示下一步等待外部系统或系统外操作结果，并包含恢复条件。
- `next_responsibility=none` 表示当前事项无需继续。

自动化平台只在 `next_responsibility=agent`、`agent_continuation_available=true` 且 `human_decision_required=false` 时自动触发下一轮。该规则避免把“缺少自动桥、由人手动触发”误判为“需要人类接手”，也避免把真正需要人类承担的判断静默交给 Agent。

Case 关闭必须产生可解释的状态影响。该影响可以是产品、技术、实现、验证、pending 或工作方式上的 Project State delta，也可以是明确的 no-change closure。No-change closure 只在事项重复、无效、过期、不再需要、合并、放弃或转移到外部责任方时成立。

Loop Handoff 不是 Project State 更新本身。它说明本轮影响和下一轮责任；Project State 是否更新由 case closeout、验证证据和状态写回规则决定。

## 演化系统

演化系统处理三类变化：

- 项目演化：需求、实现、验证和运行反馈持续改变项目事实。
- 协作演化：用户纠错和执行经验持续改变工作方式事实。
- AI 能力演化：模型能力、权限、成本和组织约束变化会触发产品方案重新推导。
- 评测演化：真实场景预期和评测结果持续暴露产品方案、最终产物和工作方式的覆盖缺口。
- 外部反馈演化：用户、alpha 测试、线上数据、客户反馈或外部系统结果先进入低承诺入口，再经 triage、case 和验证影响 Project State。

演化系统使 Arckit 不把当前产品方案视为永久静态结构。不同 AI 能力假设可以对应不同版本的产品方案。

## 标准流转

一次协作的标准流转是：

1. 人输入 prompt。
2. 语义入口形成语义材料和当前任务处境。
3. 系统读取 Project State，识别当前状态缺口和可恢复上下文。
4. 阶段判断确定当前阶段和阶段产物。
5. 当状态缺口需要持续推进时，系统创建或选择 case。
6. 产物系统判断本轮涉及的最终产物和过程产物。
7. 事实系统判断信息进入预期事实、实现事实、过程事实、工作方式事实或低承诺空间。
8. 接力系统生成 controller frame、execution gate、worker packet、report intake rules 和 closeout rules；只有 execution gate 被授权并绑定 executor 后，执行体才开始本轮 loop。
9. 当用户输入是场景化预期或外部反馈时，系统先把它维护为评测集、pending 或 intake，而不是直接提升为需求或 Project State。
10. 执行结果以 worker report、实现证据、验证证据或外部结果形式回到 Controller。
11. Controller 根据 report intake rules 和 closeout rules 判断 `done`、`continue`、`needs_human`、`blocked` 或 `external_wait`，并输出 Loop Handoff。
12. 验证比较预期事实、实现事实和评测场景。
13. Case closeout 判断本事项是否继续、等待、阻塞、关闭或产生 no-change closure。
14. 经过验证或确认的 state delta 更新 Project State。
15. 演化系统根据结果、纠错、评测发现、接力结果、外部反馈和能力变化更新后续判断。

## 架构验收口径

产品架构满足规格时，系统表现为：

- 能说明 prompt 如何进入系统。
- 能说明真实软件预期和当前阶段的关系。
- 能说明 Project State、Case 和 Loop 的主轴关系。
- 能说明 Project State 如何通过验证后的 state delta 更新，而不是被 loop 静默改写。
- 能说明哪些事项应创建 case，哪些内容应保留在 pending、intake 或 evaluation。
- 能说明阶段产物、最终产物和过程产物的关系。
- 能说明最终产物类型如何影响实现承载、实现事实和验证证据，而不拆分前置软件流程。
- 能说明显式约束如何影响执行边界，而不是把表达清晰度作为流程主轴。
- 能说明预期事实、实现事实、过程事实和工作方式事实如何分工。
- 能说明 agent 启动上下文如何帮助不同执行体进入项目。
- 能说明 handoff 如何支撑人类、单 Agent、多 Agent 平台和外部 adapter 接力。
- 能说明入口能力为什么不自动执行，以及 execution gate 如何绑定 executor。
- 能说明没有 Desktop 时人类如何作为 Runtime 搬运 worker packet 和 report。
- 能说明真实场景预期如何先进入评测集，而不是直接混同为需求。
- 能说明外部反馈如何先进入低承诺入口，再通过 triage、case 和验证影响 Project State。
- 能说明低承诺空间如何避免信息丢失和事实污染。
- 能说明用户纠错、接力结果和 AI 能力变化如何驱动系统演化。
