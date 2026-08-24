---
name: using-arckit
description: "在 Arckit 项目中持续推进真实软件开发事项。依据 fresh Project 软件定义决策/不变量/推进状态与 Case facts/state impacts/dynamic gaps，选择最值得优先处理的 gap，由同一 Agent 动态使用必要 skills/tools 完成并形成可信 transition；自动续轮直到 resolved，只有 human responsibility 暂停。"
---

# Using Arckit

本 skill 是通用状态驱动控制算法，不硬编码工作类型、产物类别或执行流程，也不规定 skill、路径和工作顺序。项目个性化来自 Project State 的显式软件定义清单及其已沉淀决策；事实变化通过 Case impacts 和动态 gaps 推进。

## 硬边界

- fresh canonical state 不可用且 ledger compatibility probe 报告协议不一致时，先进入协议恢复模式；此时不得创建、选择或推进普通 Case Gap。恢复规则按需读取 [references/protocol-compatibility-recovery.md](references/protocol-compatibility-recovery.md)。
- Project `project-state-record/v5` 明确给出软件能力决策清单、当前决策、抽象软件不变量和当前推进上下文。Agent 必须逐项理解它们，但不会为每项制造过场 gap。
- 所有 active Case 使用 `development-case-record/v5`。Case 只记录实际相关的 facts、targeted impacts、dynamic gaps、问题、handoff 和 completion review。
- 当前 Agent 负责恢复全部相关信息、判断下一 gap 的优先级、动态选择 skills/tools/paths、完成工作并验证。Runtime 不做语义预路由。
- 一个 Loop 只提交一个 selected Case Gap 的单一验收主张。该 Gap 是本轮 fresh canonical facts 已经足以界定的最小实质推进，不用 Case 最终结果吞并尚未成立的因果阶段；每轮都重新判断，不预先制定 impacts 或未来 gap 链。
- Project software invariants 是每轮发现 Case 义务的抽象指导。Agent 必须从 fresh Case facts 识别它们是否建立、改变、否定、暴露缺失、使既有长期事实过时、产生歧义或冲突，再结合动态选择的 skills 对全部 invariants 显式作出判断；实际相关但尚未成立或证据不足的结果必须成为 open Case Gap。
- 后续行动的对象、必要性、范围或验收方式只要取决于本轮尚未接受的事实或决定，当前 Gap 就必须先建立该前置事实或决定；即使同一 Agent 能立即继续，也必须 closeout 后由下一轮 fresh-read 重新选择后续 Gap。
- 本轮新发现的事实可以证明 selected Gap，并可写入 Case、暴露、重开或新增后续 Gap；不得再消费这些新事实去完成其他下游结果。当前 Gap transition 接受后即结束。
- 持久事实是否需要维护由当前 Gap、Project decisions/invariants 和现实证据共同决定，并在最合适的 Gap 中自然发生，而不是靠最终 Review 常规补齐。
- Completion Review 是唯一显式语义自查，只在普通工作闭合后检查实施正确性、问题是否真实解决、验证可信度、回归风险与最小性。普通 Gap 的证据收集和确定性校验不是额外 Review 阶段。
- Completion Review candidate 只由 review result 或独立 human budget authorization 完成，不使用普通 Gap 的 resolution，也不携带 Case 内容变化；findings 由 Ledger 派生为下一轮普通修复 Gap。
- Agent 不直接手改 ledger；只向 trusted entrypoint 提交 Case control、Case transition 或 handoff。
- 每轮只接受 ledger capability 产出的 `arckit-ledger-snapshot/v1`。Runtime 未提供时，Agent 从已安装的 `arckit-development-ledger` manifest 解析同一个 `loop_snapshot` entrypoint 并自行调用；普通文件读取和 writeback 返回值都不能冒充 fresh snapshot。

## 状态驱动 Loop

### 1. 恢复全部相关信息

先取得 trusted ledger snapshot。`available` 时读取用户当前增量、fresh Project/Iteration、全部 active Cases、15 项软件定义决策、软件不变量与 candidate catalog，再读取完成判断所需的持久事实载体和工作区证据。额外读取可以发现 fresh candidate 或证明当前 Gap，但其中新显露的实质事实在被本轮 transition 接受前不能成为下游工作的执行依据。`unavailable` 时暂停普通 Loop，按协议恢复 reference 由同一 Agent 完成语义 reconciliation；trusted ledger 原子验收成功后重新调用 snapshot，再从原始用户事项判断。正向轮次见 [references/controller-conversation-protocol.md](references/controller-conversation-protocol.md)，输入边界见 [references/controller-input-boundary.md](references/controller-input-boundary.md)。

### 2. 选择或创建 Case

结合用户意图、Project gaps、active Cases、风险和依赖选择唯一 Case。没有合适 Case 时返回 `case_control.create_case`：明确 intent/outcome、至少一个 accepted fact，以及由这些当前事实直接支持的一个具体 initial gap。若尚未接受的实质事实或决定会改变后续结果，initial gap 只建立该前置条件，不同时包含依赖它的下游结果。只有现有证据已经表明某个 Project target 受到实际影响时才创建 initial impact；允许为空，不预测影响范围。

### 3. 动态选择下一 Gap

根据本轮 snapshot 比较 ledger 为全部 active Cases 与 Project 派生的 persisted candidates，以及当前上下文刚显露的 fresh candidates，再按阻塞程度、风险、信息增益、依赖、用户影响与可验证性选择一个。选择前向用户展示独立 round opening：列出全部 persisted candidates、实际发现的 fresh candidates、selected/deferred/excluded 与简短理由；不得声称穷尽了未发现的 fresh work。完整 trace 随 transition 保存，其中 Project 与 selected Case scope 由 Case-scoped selection token 强绑定，以保留无关 Cases 的并发推进。细则见 [references/round-boundary-contract.md](references/round-boundary-contract.md)。

Gap 只描述 fresh canonical facts 已经足以界定的下一项最小可接受状态推进；Case 的最终结果本身不自动构成当前 Gap。选择前先判断是否存在会改变下游对象、范围、相关 invariant、风险或验收方式的未接受事实或决定；存在时先选择建立该前置条件的 Gap。`planned_transition` 只写完成这一项推进的方法，不能写成“先建立 X，再依据 X 完成 Y”。详细分轮规则见 [references/round-boundary-contract.md](references/round-boundary-contract.md)。

多个行动只有在它们共同服务的结论于本轮开始前已经由 fresh state 确定、且任一行动都不依赖本轮新事实时，才可共同完成一个 Gap。证据可以在本轮形成；若其形成过程改变了当前主张或事实边界，就写回事实和后续 Gap并结束本轮。

选择 Gap 前，使用当前 Project invariant catalog 逐项审视 fresh Case facts、既有 impacts/gaps 和本轮可用 skills。Applicability 从事实对长期语义的影响产生，不从 planned transition 或“本轮是否准备修改某类内容”倒推。产品、交互、视觉和技术 invariant 分别维护其权威长期预期或决策；realization 判断现实状态是否兑现这些事实；risk 判断重要风险主张是否有可信依据。三类证据不能互相替代。

Invariant 不规定工作类型、skill、路径或执行顺序，也不等于必须更新某个载体；它要求实际相关的长期判断不能静默遗漏：已有事实充分时显式确认，事实域无关时说明依据，缺失、过时、含糊、冲突或证据不足时形成 Case Gap。既有结论不会永久豁免，后续事实可以重新威胁它并产生新 Gap。

只有当前 transition 会对 Project target 形成可接受结论时才记录 impact。对实际相关 target 的判断为：

- 已满足：`upheld` + 持久证据。
- 被威胁：`threatened` + open gap。
- 证据不足：`undetermined` + 调查/澄清 gap。
- 不相关：不创建 impact；但在本轮 `invariant_assessment` 中记录 `not_relevant` 理由。

### 4. 同一 Agent 完成一个 Gap

围绕 Gap goal 读取所有相关上下文并动态使用必要 skills/tools，只完成使该唯一验收主张和 evidence requirement 真实成立所需的行动。若本轮形成的新事实决定了新的下游结果，只记录事实、impact 与后续 Gap并结束本轮，不因为它们服务于同一 Case 最终结果就继续执行。

### 5. 提交 Transition

Host 声明 `arckit-semantic-case-command/v1` output 时，读取 [references/semantic-command-handoff.md](references/semantic-command-handoff.md)，提交 snapshot-bound 语义命令：Agent 显式声明候选比较、事实、Gap、影响、Project decision/invariant 判断及其关系，使用 typed stable refs 与 command-local handles，不生成 canonical id/revision、selected Gap 副本、反向索引或内部 Transition。Trusted Ledger 独占确定性物化和原子提交。Direct Agent 未获得该 output contract 时，按 [references/closeout-handoff.md](references/closeout-handoff.md) 使用 canonical `arckit-case-transition/v8` 入口。两种 transport 都只承载同一个 Agent 语义主张；软件定义决策在被真正澄清的当轮就进入 Project State。

### 6. 自动续轮

Ledger 写回成功后，先向用户展示其 `arckit-round-closeout/v2`：实际接受的 facts/impacts/gaps/Project changes、完整 invariant judgments、结果 revision 和证据；该 receipt 不包含下一 candidate。随后用 receipt 的 post-commit token 单独调用 `loop_snapshot`，展示 fresh-read receipt 后才可独立判断下一 Gap。Runtime 也必须按同一顺序透传这两个 receipt，不重新组装语义。其余续轮和停止规则见 [references/round-boundary-contract.md](references/round-boundary-contract.md)。

## 输出

- 协议不一致时：trusted reconciliation 结果、保真声明、剩余不确定性和 fresh-read handoff
- selected Case 和动态 Gap，或完整 `case_control.create_case`
- 本轮使用的决策、事实、invariants、skills/tools 与 evidence 摘要
- Host-bound `arckit-semantic-case-command/v1`、direct `arckit-case-transition/v8`，或明确 handoff
- 用户可见的 round opening、accepted round closeout 与 post-write fresh-read receipt
- `round_outcome`、`case_resolution`、`project_state_delta`、`loop-handoff/v2`
