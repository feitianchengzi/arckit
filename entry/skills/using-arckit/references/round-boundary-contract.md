# Round Boundary Contract

本文件在选择 Gap、提交 transition 或自动续轮时读取。Direct Codex 与 Runtime 使用相同 ledger snapshot、transition 和 closeout 对象；差异只在 host 如何调用与展示。

## Round opening

Agent 从 `arckit-ledger-snapshot/v1.candidate_catalog` 恢复全部 active Cases 与 Project persisted candidates，并记录本轮实际发现的 fresh candidates。用户可见 opening 和 `gap_selection.considered` 必须覆盖 snapshot catalog 中的全部 persisted candidates；每项写明 eligibility、selected/deferred/excluded、priority basis 与理由，让任意候选 B 都能看出是否被考虑。恰好一项 selected，`selected_ref` 与 `selected_gap.id` 一致。Agent 可以自然转述 persisted candidate 的 `goal/reason`；这两个描述字段不是 identity token，也不替代 canonical candidate。

Ledger 用 Case-scoped selection token 强校验 Project candidates 与 selected Case candidates，避免无关 Case 的并发提交使当前工作无效；其他 Case 的比较项作为同一 snapshot 下的审计证据，不扩大写入锁。若并发变化让新的 snapshot 出现不同候选，下一轮必须重新比较，不能复用旧 trace。

Candidate apply 时，Ledger 依据稳定 `selected_ref`/Gap id 重新读取当前 ready candidate，并把该 canonical object 写入 round 与 closeout。selection token、Project revision、Case `updated_at`、candidate identity 或 readiness 任一失配仍 fail closed；只有 Agent 的语义等价改写不会触发 stale failure。

比较是语义判断，不使用固定分数。Agent 只声明它实际发现的 fresh candidates，不声称已经穷尽所有潜在工作。用户可见 opening 在执行工作前展示候选与选择理由；transition 保存同一 trace 供 ledger 验收和 closeout 回显。

## Gap 与本轮行动

Persisted Gap 保存未成立的结果、未知、风险或验收边界，不保存未来执行步骤。`planned_transition` 是 fresh state 下只对本轮有效的行动。新增 Gap 即使成为唯一 persisted candidate，也必须在下一 snapshot 中重新比较，不能由上一轮 handoff 自动选中。

每轮以 trusted snapshot 中已经接受的 Project/Case state 为因果起点。候选结果只有在不需要先建立另一个实质事实或决定时，才可成为当前 Gap。若某个尚未接受的前置条件出现不同结论时，会改变下游结果的对象、范围、相关 invariant、风险或验收方式，当前 Gap 必须先建立这个前置条件。

因此，`planned_transition` 不得包含“先建立 X，再依据 X 完成 Y”的条件链。X 是否需要独立交付不影响分轮；只要 Y 的执行依据来自本轮才建立的 X，X 与 Y 就属于不同 Round。即使同一 Agent 有能力立即完成 Y，也要在接受 X 后 closeout，再从 fresh state 比较下一 Gap。

多个行动可以共同完成一个 Gap，前提是它们共同服务的结论在本轮开始前已经成立，且任一行动都不依赖本轮新事实。证据可以证明当前主张并支持其既定边界内的调整；如果证据形成过程显露了会改变当前主张或事实边界的新情况，就只写入事实、impact 和 open Gap，不继续完成其下游结果。

若当前结果依赖一个尚未接受的前置条件，先以该条件成立为当前 Gap；条件被接受后的下一轮，再依据全部 fresh facts 与 invariants 比较下游候选。若前置条件在本轮开始前已经成立，且结果边界已经确定，则共同完成该结果所需的行动与证据可以留在一个 Gap。

Ledger 只校验 snapshot、候选、revision、引用和 transition 结构；上述因果边界由 Agent 正向遵守，不在 Runtime 中复制判断机制或固定工作类型。

## Invariant assessment

每个 v8 transition 都携带当前 Project revision 下完整的 `invariant_assessment`。Agent 从 fresh Case facts 判断它们是否建立、改变、否定、暴露缺失、使既有长期事实过时、产生歧义或冲突，再结合动态使用的 skills 对每个 Project invariant 恰好判断一次。判断不以 planned transition 的预期动作或本轮实际编辑对象为 applicability 来源。

产品、交互、视觉和技术 invariant 分别要求对应权威长期预期或决策可恢复；realization 判断现实状态是否兑现相关事实；risk 判断重要风险主张是否有可信依据。这些证据责任互不替代，也不静态映射到 skill、路径或工件。`not_relevant` 说明事实为何未触及该长期语义，`upheld` 给出与该 invariant 证据责任相符的持久证据，`threatened` 或 `undetermined` 引用 accepted facts 并绑定至少一个写回后仍 open 的 Case Gap。Ledger 只校验完整覆盖、重复项、引用和处置结构，不判断语义相关性。

该 assessment 是本轮事实视角，不是永久豁免。后续 Round 每次重新覆盖全部 catalog；新事实可以把先前 `not_relevant` 或 `upheld` 改判为 `threatened`/`undetermined` 并重开结果型 Gap。

## Closeout 与 fresh-read

Trusted apply 成功后返回 `arckit-round-closeout/v2`，内容来自实际提交后的 canonical state：accepted delta、Project delta、invariant assessment、evidence、resulting revisions、next responsibility 与 post-commit snapshot token。`next_candidate_projection` 固定为 `null`，writeback candidate 不得用于续轮。

Host 必须先展示 closeout，再调用 `loop_snapshot read --after-commit <token>`。返回的 snapshot 必须标记 `observed_after_commit: true`；随后展示 Project/Case revisions、observed time 与 snapshot token，才可开始下一 round opening。Direct Codex 由当前 Agent调用并展示；Runtime 只编排和透传同一 receipt。
