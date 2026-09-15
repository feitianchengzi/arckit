---
name: using-arckit
description: "在 Arckit 项目中持续推进真实软件开发事项。依据 fresh Project 软件定义决策/不变量/推进状态与 Case facts/state impacts/dynamic gaps，选择最值得优先处理的 gap，由同一 Agent 动态使用必要 skills/tools 完成并形成可信 transition；在当前授权范围内自动续轮，区分 Case 完成、用户停止、人工决定与外部等待。"
---

# Using Arckit

本 skill 是通用状态驱动控制算法，不硬编码工作类型、产物类别或执行流程，也不规定 skill、路径和工作顺序。项目个性化来自 Project State 的显式软件定义清单及其已沉淀决策；事实变化通过 Case impacts 和动态 gaps 推进。

## 全程约束

- **范围**：用户原任务、当前增量与未撤回授权决定工作范围；状态、候选和后续发现不提供新增授权。
- **事实**：依据可信的当前 Project/Case State 判断，历史上下文、普通文件读取和写回返回值不能替代 fresh snapshot。
- **聚焦**：每轮只推进一个独立缺口；全面理解事实和识别义务，不等于本轮解决全部缺口。
- **职责**：Agent 判断任务是否推进及是否继续，Ledger 负责可信校验与写回，Runtime 执行交接与用户控制；Agent 不直接手改 ledger。

## 职责与 Host 接入

当前 Agent 负责恢复全部相关信息、判断下一 gap 的优先级、动态选择 skills/tools/paths、完成工作并验证。Runtime 不做语义预路由。

本入口维护状态驱动方法；`arckit-development-ledger` 维护状态模型、提交接口与可信脚本。Runtime 通过各自 manifest 分别调用，不在 prompt 或代码中重写本方法，也不从文件路径推断事实相关性。原有候选比较、因果边界和不变量判断全部适用。

Host 提供自动续轮、拒绝恢复或完成后的新发现时，读取 [references/runtime-host-boundary.md](references/runtime-host-boundary.md)。该 reference 只解释执行上下文与方法的衔接，不替代正常 Loop。

## 状态驱动 Loop

### 1. 恢复全部相关信息

**取得可信快照。** 每轮只接受 ledger capability 产出的 `arckit-ledger-snapshot/v1`。Runtime 未提供时，Agent 从已安装的 `arckit-development-ledger` manifest 解析同一个 `loop_snapshot` entrypoint 并自行调用；普通文件读取和 writeback 返回值都不能冒充 fresh snapshot。

**检查可用性。** fresh canonical state 不可用且 ledger compatibility probe 报告协议不一致时，先进入协议恢复模式；此时不得创建、选择或推进普通 Case Gap。恢复规则按需读取 [references/protocol-compatibility-recovery.md](references/protocol-compatibility-recovery.md)。 `unavailable` 时暂停普通 Loop；协议恢复由同一 Agent 完成语义 reconciliation，trusted ledger 原子验收成功后重新调用 snapshot，再从原始用户事项判断。

**恢复状态与证据。** `available` 时读取用户当前增量、fresh Project/Iteration、全部 active Cases、15 项软件定义决策、软件不变量与 candidate catalog，再读取完成判断所需的持久事实载体和工作区证据。

- Project `project-state-record/v5` 明确给出软件能力决策清单、当前决策、抽象软件不变量和当前推进上下文。Agent 必须逐项理解它们，但不会为每项制造过场 gap。
- 所有 active Case 使用 `development-case-record/v5`。Case 只记录实际相关的 facts、targeted impacts、dynamic gaps、问题、handoff 和 completion review。

额外读取可以支持当前 Gap 的调查、实现与验证；新候选必须先通过原任务范围判断。正向轮次见 [references/controller-conversation-protocol.md](references/controller-conversation-protocol.md)，输入边界见 [references/controller-input-boundary.md](references/controller-input-boundary.md)。

### 2. 选择或创建 Case

结合用户意图、Project gaps、active Cases、风险和依赖选择唯一 Case。没有合适 Case 时返回 `case_control.create_case`：明确 intent/outcome、至少一个 accepted fact，以及由这些当前事实直接支持的一个具体 initial gap。首个 Gap 依据关键阻塞与不确定性产生：可能是定位根因、明确产品行为、交互决策、技术验证，也可能直接实现；这些是例子，不是固定阶段或必经顺序。只有现有证据已经表明某个 Project target 受到实际影响时才创建 initial impact；允许为空，不预测影响范围。

### 3. 动态选择下一 Gap

**识别相关义务。** 选择 Gap 前，使用当前 Project invariant catalog 逐项审视 fresh Case facts、既有 impacts/gaps 和本轮可用 skills。Agent 必须识别 fresh facts 是否建立、改变、否定、暴露缺失、使既有长期事实过时、产生歧义或冲突。Applicability 从这些事实对长期语义的影响产生，不从 planned transition 或“本轮是否准备修改某类内容”倒推。逐项读取当前不变量的 applies_when、must_hold、evidence_expectation 与 priority，按其实际定义判断相关性与证据；不预设数量、名称、领域或通用证据分类，也不以其他不变量的证据替代当前要求。

Invariant 不规定工作类型、skill、路径或执行顺序，也不等于必须更新某个载体。实际相关的长期判断不能静默遗漏：已有事实充分时显式确认，事实域无关时说明依据，相关但未解决时如实标记并由开放 Gap 承接，不为了让所有判断变成 upheld 而补做独立决策。

只有原任务验收必需、确实阻塞原任务或修复本次修改引入的回归时，缺失、过时、含糊、冲突或证据不足的结果才形成当前 Case 的 open Gap；独立问题作为提示，不因 invariant 检查扩大任务。既有结论不会永久豁免，后续事实可以重新威胁它并产生新 Gap。

只有当前 transition 会对 Project target 形成可接受结论时才记录 impact。对实际相关 target 的判断为：

- 已满足：`upheld` + 持久证据。
- 被威胁：`threatened` + open gap。
- 证据不足：`undetermined` + 调查/澄清 gap。
- 不相关：不创建 impact；但在本轮 `invariant_assessment` 中记录 `not_relevant` 理由。

**界定一个独立缺口。** 一个 Loop 只提交一个 selected Case Gap 的单一验收主张。该 Gap 是原任务范围内当前最关键、最值得独立解决的缺口，具有明确的待回答问题与完成证据；一轮推进一个 Gap，同一 Gap 可以跨轮完成。每轮重新判断其与原任务的必要关系，不预先制定 impacts 或未来 gap 链。

选择时说明：当前缺口要回答什么、为什么最值得先独立解决、什么证据表示它已解决，以及哪些相关问题暂不解决。如果一个候选包进了可分别作出和验收的多个决定，先选其中最关键的缺口；不能只因它们共享最终需求或同一组文件而合并。`planned_transition` 围绕这个缺口安排必要行动，不预先包揽其解决后的下一件事。

**比较候选并展示选择。** 根据本轮 snapshot 比较 ledger 为全部 active Cases 与 Project 派生的 persisted candidates，以及当前上下文刚显露的 fresh candidates，再按阻塞程度、风险、信息增益、依赖、用户影响与可验证性选择一个。选择前向用户展示独立 round opening：列出全部 persisted candidates、实际发现的 fresh candidates、selected/deferred/excluded 与简短理由；不得声称穷尽了未发现的 fresh work。完整 trace 随 transition 保存，其中 Project 与 selected Case scope 由 Case-scoped selection token 强绑定，以保留无关 Cases 的并发推进。细则见 [references/round-boundary-contract.md](references/round-boundary-contract.md)。

**普通工作闭合后选择 Review。** Completion Review 是唯一显式语义自查，只在普通工作闭合后检查实施正确性、问题是否真实解决、验证可信度、回归风险与最小性。普通 Gap 的证据收集和确定性校验不是额外 Review 阶段。

### 4. 同一 Agent 完成一个 Gap

**完成当前问题。** 围绕 selected Gap 的待解决问题读取相关上下文并动态使用必要 skills/tools，完成其结论和证据。例如定位根因时可以补日志、复现、验证假设；确认根因后实施修复通常属于另一个缺口，应提交后重新选择。读到另一领域的事实不等于要在本轮为该领域作出新决定；判断是否跨 Gap 看独立问题与结论，不看 skill 数量、文档数量或软件领域名称。

**处理新事实。** 新事实用于理解、解决或验证当前选中的缺口时，可以在本轮继续使用；暴露另一个独立缺口时，只记录事实与必要候选，不顺带解决。当前缺口解决后提交并 fresh-read，再独立选择下一 Gap；需要用户决定时交接人工。

**维护已建立的结论。** 全面理解相关事实与判断不变量，不等于本轮补齐全部预期事实。只建立解决 selected Gap 所需的新结论；同一个结论可以同步多个事实载体，但产品、交互、视觉、技术中的独立决策不能因属于同一需求而合并完成。

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
- 本轮使用的决策、事实、invariants、skills/tools 与 evidence 摘要
- Host-bound `arckit-semantic-case-command/v1`、direct `arckit-case-transition/v8`，或明确 handoff
- 用户可见的 round opening、accepted round closeout 与 post-write fresh-read receipt
- `round_outcome`、`case_resolution`、`project_state_delta`、`loop-handoff/v2`
- 原任务进展、依据、剩余义务与执行交接；Host 要求时按 `task_progress` 和 `handoff` 契约提交
