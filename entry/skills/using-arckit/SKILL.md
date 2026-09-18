---
name: using-arckit
description: "在 Arckit 项目中开始、恢复与持续推进已授权事项时使用。依据可信场景定义与 Project/Case State 选择有界 Gap，控制局部前置、探索与正式建立的边界；不代替领域能力或 Ledger 写回。"
---

# Using Arckit

本 skill 是通用状态驱动控制算法，不硬编码工作类型、产物类别或执行流程，也不规定 skill、路径和工作顺序。场景语义来自可信 snapshot.state_definition 与 Project State；更换场景时替换状态定义及适配器，不改 Loop 方法。事实变化通过 Case impacts 和动态 gaps 推进。

## 全程约束

- **范围**：用户原任务、当前增量与未撤回授权决定工作范围；状态、候选和后续发现不提供新增授权。
- **事实**：依据可信的当前 Project/Case State 判断，历史上下文、普通文件读取和写回返回值不能替代 fresh snapshot。
- **聚焦**：每轮只推进一个可共同决策、共同验收的有界缺口；全面理解事实和识别义务，不等于本轮解决全部缺口。
- **保障**：不变量给出场景责任范围；候选来源不限，但业务 Gap 必须对应相关责任。控制、恢复与交接义务按其自身契约处理，不伪造业务映射。
- **职责**：Agent 判断任务是否推进及是否继续，Ledger 负责可信校验与写回，Runtime 执行交接与用户控制；Agent 不直接手改 ledger。

## 职责与 Host 接入

当前 Agent 负责恢复全部相关信息、判断下一 gap 的优先级、动态选择 skills/tools/paths、完成工作并验证。Runtime 不做语义预路由。

本入口维护状态驱动方法；`arckit-development-ledger` 维护状态模型、提交接口与可信脚本。Runtime 通过各自 manifest 分别调用，不在 prompt 或代码中重写本方法，也不从文件路径推断事实相关性。原有候选比较、因果边界和不变量判断全部适用。

Host 提供自动续轮、拒绝恢复或完成后的新发现时，读取 [references/runtime-host-boundary.md](references/runtime-host-boundary.md)。该 reference 只解释执行上下文与方法的衔接，不替代正常 Loop。

## 状态驱动 Loop

### 1. 恢复全部相关信息

Case 是本次目标及其已知义务；Gap 是其中尚未成立的具体结果；Loop 是围绕一个 Gap 取得证据、提交状态并重新选择的一轮。先理解结果，再填写协议。

**取得可信快照。** 每轮只接受 ledger capability 产出的 `arckit-ledger-snapshot/v1`。Runtime 未提供时，Agent 从已安装的 `arckit-development-ledger` manifest 解析同一个 `loop_snapshot` entrypoint 并自行调用；普通文件读取和 writeback 返回值都不能冒充 fresh snapshot。

**检查可用性。** fresh canonical state 不可用且 ledger compatibility probe 报告协议不一致时，先进入协议恢复模式；此时不得创建、选择或推进普通 Case Gap。恢复规则按需读取 [references/protocol-compatibility-recovery.md](references/protocol-compatibility-recovery.md)。 `unavailable` 时暂停普通 Loop；协议恢复由同一 Agent 完成语义 reconciliation，trusted ledger 原子验收成功后重新调用 snapshot，再从原始用户事项判断。

**读取场景契约。** 读取 snapshot.state_definition.definition 的事实分类、选择规则、完成规则、实现判断指引和状态来源；首次使用该场景时，按定义指引读取随包概念示例。结合项目确认维护对象、实现载体、生效方式及验证方式，不按文件扩展名推断事实角色。稳定上下文在 Case 中保存一次，后续确认仍适用后引用；变化时更新，未知时说明缺口。定义缺失或不可用时先恢复可信能力。

**恢复状态与证据。** `available` 时读取用户当前增量、fresh Project/Iteration、全部 active Cases、场景定义、当前决策、不变量与 candidate catalog，再读取完成判断所需的持久事实载体和工作区证据。

- 当前软件适配器的 Project `project-state-record/v5` 给出领域决策清单、当前决策、不变量和推进上下文。Agent 必须逐项理解它们，但不会为每项制造过场 gap。
- 所有 active Case 使用 `development-case-record/v5`。Case 只记录实际相关的 facts、targeted impacts、dynamic gaps、问题、handoff 和 completion review。

额外读取可以支持当前 Gap 的调查、实现与验证；新候选必须先通过原任务范围判断。正向轮次见 [references/controller-conversation-protocol.md](references/controller-conversation-protocol.md)，输入边界见 [references/controller-input-boundary.md](references/controller-input-boundary.md)。

### 2. 选择或创建 Case

结合用户意图、Project gaps、active Cases、风险和依赖选择唯一 Case。没有合适 Case 时返回 `case_control.create_case`：明确 intent/outcome、至少一个 accepted fact（用户明确提出目标本身即可构成事实，不代表方案已经确定），以及由这些当前事实直接支持的 initial gaps。已知未完成义务及真实依赖一并保留，不预测未知执行链。首个 Gap 依据关键阻塞与不确定性产生：可能是定位根因、明确产品行为、交互决策、技术验证，也可能直接实现；这些是例子，不是固定阶段或必经顺序。只有现有证据已经表明某个 Project target 受到实际影响时才创建 initial impact；允许为空，不预测影响范围。

### 3. 动态选择下一 Gap

**识别相关义务。** 选择 Gap 前读取 [references/gap-reasoning.md](references/gap-reasoning.md)，从原任务、用户增量、相关预期、当前事实、执行反馈、依赖与外部条件综合发现问题。同时逐项读取当前 Project invariant catalog 的 applies_when、must_hold、evidence_expectation 与 priority，理解后显式说明各项在本 Case 的适用对象、依据和未决问题，作为选题依据之一。Applicability 包括尚未调查的必要预期与缺失，不从 planned transition 或准备修改哪些内容倒推。维度的数量、内容和证据责任完全来自动态读取的定义；required 表示必须考虑，不表示本轮清零或固定排序。

Invariant 不规定工作类型、skill、路径或执行顺序，也不等于必须更新某个载体。实际相关的长期判断不能静默遗漏：已有事实充分时显式确认，事实域无关时说明依据，相关但未解决时如实标记并由开放 Gap 承接，不为了让所有判断变成 upheld 而补做独立决策。

只有原任务验收必需、确实阻塞原任务或修复本次修改引入的回归时，缺失、过时、含糊、冲突或证据不足的结果才形成当前 Case 的 open Gap；独立问题作为提示，不因 invariant 检查扩大任务。既有结论不会永久豁免，后续事实可以重新威胁它并产生新 Gap。

只有当前 transition 会对 Project target 形成可接受结论时才记录 impact。对实际相关 target 的判断为：

- 已满足：`upheld` + 持久证据。
- 被威胁：`threatened` + open gap。
- 证据不足：`undetermined` + 调查/澄清 gap。
- 不相关：不创建 impact；但在本轮 `invariant_assessment` 中记录 `not_relevant` 理由。

**先判断当前能否推进。** 按场景规则检查局部事实与共享依赖。问：剩余未知的不同答案，是否会改变本次结果、关键约束或验收标准？若会改变重要决定，先选择能区分答案的取证问题；若不影响本范围，说明依据并保留未知。前置未满足的候选先处理前置或交接，优先级不能绕过资格。将选择依据写入 planned_transition.selection_assessment，字段语义见 [references/selection-assessment.md](references/selection-assessment.md)。它区分探索与正式建立，并明确本轮验收及未决义务。

**明确这一轮要成立什么。** Gap 表达尚未成立的具体结果，说明缺什么、成立后改变什么、何种证据足够。子结果共享目标、前提和验收边界时可以合并；若答案会改变后续方向、影响多个对象或需要独立取舍，则在这个判断处收紧边界。工作量、文件或测试数量不直接决定 Gap 数；大工作可 partial 跨轮，小任务可只有一个普通 Gap。遵守场景中的事实顺序与合并禁区。

**比较候选并展示选择。** 根据本轮 snapshot 比较 ledger 为全部 active Cases 与 Project 派生的 persisted candidates，以及当前上下文刚显露的 fresh candidates，在合格候选中选择最能解除当前目标关键阻塞、减少重大返工或产生直接价值的结果。影响面、不确定性、风险与依赖用于解释判断，不按陌生程度排序。选择前向用户展示独立 round opening：列出全部 persisted candidates、实际发现的 fresh candidates、selected/deferred/excluded 与简短理由；不得声称穷尽了未发现的 fresh work。完整 trace 随 transition 保存，其中 Project 与 selected Case scope 由 Case-scoped selection token 强绑定，以保留无关 Cases 的并发推进。细则见 [references/round-boundary-contract.md](references/round-boundary-contract.md)。

**普通工作闭合后选择 Review。** Completion Review 是唯一显式语义自查，只在授权范围内的普通工作闭合后检查结果正确性、问题是否真实解决、验证可信度、回归风险与最小性。普通 Gap 的证据收集和确定性校验不是额外 Review 阶段。

### 4. 同一 Agent 完成一个 Gap

**工作到当前结果成立或需要重新决定。** 围绕 selected Gap 的结果动态使用必要 skills/tools。调查、比较、试验可用于证明当前结果；证据足够时验收，未足够则保留 partial。若需要另行选择的独立结果或重要决定首次具备条件，或新证据使已接受预期、关键前提、责任或验收边界需要重定，保存当前证据及义务，提交并 fresh-read 重选。同一验收内的动作依赖就绪、约束内的方法调整与常规排障可继续；独立因果问题按场景规则处理。不因探索标签自动换 Gap，也不以实验存在宣称正式兑现；关键前置缺失仍先取得依据。

专业 skills 是独立可复用能力，不是不变量的一一对应执行模块。Agent 依据当前目标选择并读取其方法，在授权与 selected Gap 边界内使用；专业 skill 包含的后续流程不自动扩大本轮目标。若其必要步骤与当前边界冲突，显式报告冲突和剩余义务，不能静默越界或跳过方法门禁。

**处理新事实。** 新事实用于理解、解决或验证当前选中的缺口时，可以在本轮继续使用；暴露另一个独立缺口时，只记录事实与必要候选，不顺带解决。当前缺口解决后提交并 fresh-read，再独立选择下一 Gap；需要用户决定时交接人工。

若新事实证明既有 Gap 过宽或前提失效，按 gap-reasoning 的重新界定规则保留未完成义务，通过可信接口记录取消/替代后 fresh-read 重选；不把取消宣称为完成，不为续轮换号。

**维护已建立的结论。** 全面理解相关事实与判断不变量，不等于本轮补齐全部预期事实。只建立解决 selected Gap 所需的新结论；同一有界结论集合可以同步多个事实载体；相关低风险结论可以共同建立，独立重要决策与场景规定不可合并的结论必须分开。

结论形成或改变的当轮维护对应事实载体，优先更新已有文档。新反证须重审全部实际相关判断，明确哪些旧主张失效或仍有依据；不以文件存在、测试数量或某一问题已修复支持其他未决主张。

### 5. 提交 Transition

**普通 Gap 提交。** 未完成验收时如实提交 `round_outcome: partial` 和已有证据，普通 Gap 的 resolution 为 `null`，保留原 Gap；不得为满足校验而虚报完成或制造替代 Gap。写回成功不等于原任务有进展：交接中说明实际消除的障碍或新增的验收证据，以及距原任务完成还缺什么。

**选择提交接口。** Agent 不直接手改 ledger；只向 trusted entrypoint 提交 Case control、Case transition 或 handoff。

- Host 声明 `arckit-semantic-case-command/v1` output 时，读取 [references/semantic-command-handoff.md](references/semantic-command-handoff.md)，提交 snapshot-bound 语义命令：Agent 显式声明候选比较、事实、Gap、影响、Project decision/invariant 判断及其关系，使用 typed stable refs 与 command-local handles，不生成 canonical id/revision、selected Gap 副本、反向索引或内部 Transition。Trusted Ledger 独占确定性物化和原子提交。
- Direct Agent 未获得该 output contract 时，按 [references/closeout-handoff.md](references/closeout-handoff.md) 使用 canonical `arckit-case-transition/v8` 入口。

两种 transport 都只承载同一个 Agent 语义主张；软件定义决策在被真正澄清的当轮就进入 Project State。

**Review 提交。** Completion Review candidate 只由 review result 或独立 human budget authorization 完成，不使用普通 Gap 的 resolution，也不携带 Case 内容变化；findings 由 Ledger 派生为下一轮普通修复 Gap。

### 6. 自动续轮

每次交接前读取 [references/round-boundary-contract.md](references/round-boundary-contract.md) 的“进展判断与执行交接”，结合原任务、当前证据和历史观察判断实际推进、必要准备或重复工作，明确下一责任与理由。进展判断属于 Agent；Runtime 不按轮数、写回、Gap 变化或缺失字段替代判断。

Transition 接受后结束本轮。未验收完成时保留 selected Gap，不为续轮另造 Gap；后续选择仍须重新判断原任务范围与当前优先级。

Ledger 写回成功后，先向用户展示其 `arckit-round-closeout/v2`：实际接受的 facts/impacts/gaps/Project changes、完整 invariant judgments、结果 revision 和证据；该 receipt 不包含下一 candidate。随后用 receipt 的 post-commit token 单独调用 `loop_snapshot`，展示 fresh-read receipt 后才可独立判断下一 Gap。Runtime 也必须按同一顺序透传这两个 receipt，不重新组装语义。其余续轮和停止规则见 [references/round-boundary-contract.md](references/round-boundary-contract.md)。

## 输出

- 协议不一致时：trusted reconciliation 结果、保真声明、剩余不确定性和 fresh-read handoff
- selected Case 和动态 Gap，或完整 `case_control.create_case`
- 本轮 selection_assessment、决策、事实、invariants、skills/tools 与 evidence 摘要
- Host-bound `arckit-semantic-case-command/v1`、direct `arckit-case-transition/v8`，或明确 handoff
- 用户可见的 round opening、accepted round closeout 与 post-write fresh-read receipt
- `round_outcome`、`case_resolution`、`project_state_delta`、`loop-handoff/v2`
- 原任务进展、依据、剩余义务与执行交接；Host 要求时按 `task_progress` 和 `handoff` 契约提交
