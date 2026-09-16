# Round Boundary Contract

本文件在选择 Gap、提交 transition 或自动续轮时读取。Direct Codex 与 Runtime 使用相同 ledger snapshot、transition 和 closeout 对象；差异只在 host 如何调用与展示。

## Round opening

先按 [gap-reasoning.md](gap-reasoning.md) 恢复 Case 目标、综合发现独立问题，并显式展示当前 catalog 各不变量的适用对象、依据或未决问题。不变量是必须的保障，不是候选来源上限；跨 Case 的延期清单不能替代 Case 内部问题比较。opening 需在实施前明确本轮问题、优先理由、完成证据和已知暂不解决的问题。

Agent 从 `arckit-ledger-snapshot/v1.candidate_catalog` 恢复全部 active Cases 与 Project persisted candidates，并记录本轮实际发现的 fresh candidates。用户可见 opening 和 `gap_selection.considered` 必须覆盖 snapshot catalog 中的全部 persisted candidates；每项写明 eligibility、selected/deferred/excluded、priority basis 与理由，让任意候选 B 都能看出是否被考虑。恰好一项 selected，`selected_ref` 与 `selected_gap.id` 一致。Agent 可以自然转述 persisted candidate 的 `goal/reason`；这两个描述字段不是 identity token，也不替代 canonical candidate。

Ledger 用 Case-scoped selection token 强校验 Project candidates 与 selected Case candidates，避免无关 Case 的并发提交使当前工作无效；其他 Case 的比较项作为同一 snapshot 下的审计证据，不扩大写入锁。若并发变化让新的 snapshot 出现不同候选，下一轮必须重新比较，不能复用旧 trace。

Candidate apply 时，Ledger 依据稳定 `selected_ref`/Gap id 重新读取当前 ready candidate，并把该 canonical object 写入 round 与 closeout。selection token、Project revision、Case `updated_at`、candidate identity 或 readiness 任一失配仍 fail closed；只有 Agent 的语义等价改写不会触发 stale failure。

比较是语义判断，不使用固定分数。Agent 只声明它实际发现的 fresh candidates，不声称已经穷尽所有潜在工作。用户可见 opening 在执行工作前展示候选与选择理由；transition 保存同一 trace 供 ledger 验收和 closeout 回显。

## Gap 与本轮行动

Persisted Gap 保存未成立的结果、未知、风险或验收边界，不保存未来执行步骤。`planned_transition` 是 fresh state 下只对本轮有效的行动。新增 Gap 即使成为唯一 persisted candidate，也必须在下一 snapshot 中重新比较，不能由上一轮 handoff 自动选中。

每轮从原任务和当前用户增量判断 Gap 的必要性。Persisted Gap、handoff 和 invariant 检查不提供新增授权；独立新问题只记录证据并提示。已偏离范围的旧 Gap 应通过正常取消接口注明理由，不继续执行以清空列表。

一个 Gap 表示当前最关键、最值得独立解决的缺口；它的完成标准是一个有证据支持的问题结论，不是笼统的 Case 最终交付目标。选择理由应交代待回答的问题、独立解决的价值、完成证据和暂不解决的问题，使用既有 goal、reason、priority basis、evidence requirements 与 selection trace 表达，不增加固定阶段。

新事实按它与 selected Gap 的关系处理：

- 用于理解、解决或验证当前缺口：本轮继续使用，例如诊断中的新日志、复现条件、因果证据。
- 暴露另一个独立缺口：记录事实；原任务必需的工作形成候选，提交后 fresh-read 重新比较，不自动接续或顺带完成。
- 暴露原任务范围外的问题：记录提示，不作为当前任务必须清零的义务。

当前缺口已解决就提交，不因还有时间或同一 Agent 可以继续而包揽下一缺口。当前缺口未解决可以提交 partial，resolution 保持 null，下一 Loop 可以继续同一个 Gap。新知识出现、本轮结束和新建 Gap 是三件不同的事。

产品、交互、视觉、技术是事实视角，不是固定 Gap 分类。判断多个动作能否属于同一 Gap，要问它们是否共同证明同一个结论，还是分别完成了可以独立讨论、取舍和验收的决定。一个结论同步多个载体可以同轮；产品意图、交互行为、技术实现即使共享需求，也不能因此一并定案。若仍有独立关键不确定性，先解决其中当前最重要的一项。

例如：根因未知时可能先定位根因，根因已知后才重新比较修复工作；交互语义未知时可能先确定行为，随后再判断是否需要技术验证；相关决策都已清楚时可直接选择实现 Gap。顺序来自事实，不把这些例子变成固定路线图。

Ledger 只校验 snapshot、候选、revision、引用和 transition 结构；上述因果边界由 Agent 正向遵守，不在 Runtime 中复制判断机制或固定工作类型。

## Invariant assessment

每个 v8 transition 都携带当前 Project revision 下完整的 `invariant_assessment`。Agent 从 Case 目标、相关预期、当前事实和未决问题判断责任，再结合动态使用的 skills 对每个 Project invariant 恰好判断一次。选择前显露义务，提交时更新判断；不以 planned transition 的预期动作或本轮实际编辑对象为 applicability 来源。具体状态、证据与反证语义由 Ledger 的 invariant-assessment reference 维护。

不变量的实际定义来自当前 Project State。逐项读取适用条件、应保持的状态和证据要求，不预设分类或数量。`not_relevant` 说明事实为何未触及该长期语义，`upheld` 给出与该 invariant 证据责任相符的持久证据，`threatened` 或 `undetermined` 引用 accepted facts 并绑定至少一个写回后仍 open 的 Case Gap。Ledger 只校验完整覆盖、重复项、引用和处置结构，不判断语义相关性。

完整 assessment 是对义务的识别，不是所有义务已经完成的声明。非 selected Gap 的相关缺口可以保持 threatened/undetermined 并引用开放 Gap；不要为清零不变量而补做独立工作，也不要把“本轮未选择”伪装成 not_relevant。多个 invariant 可以引用同一个真正解决共同问题的 Gap，但不能用一个宽泛 Gap 吞并独立决定。

该 assessment 是本轮事实视角，不是永久豁免。后续 Round 每次重新覆盖全部 catalog；新事实可以把先前 `not_relevant` 或 `upheld` 改判为 `threatened`/`undetermined` 并重开结果型 Gap。

## Closeout 与 fresh-read

Trusted apply 成功后返回 `arckit-round-closeout/v2`，内容来自实际提交后的 canonical state：accepted delta、Project delta、invariant assessment、evidence、resulting revisions、next responsibility 与 post-commit snapshot token。`next_candidate_projection` 固定为 `null`，writeback candidate 不得用于续轮。

Host 必须先展示 closeout，再调用 `loop_snapshot read --after-commit <token>`。返回的 snapshot 必须标记 `observed_after_commit: true`；随后展示 Project/Case revisions、observed time 与 snapshot token，才可开始下一 round opening。Direct Codex 由当前 Agent调用并展示；Runtime 只编排和透传同一 receipt。

## 进展判断与执行交接

每次交接前，由同一 Agent 对照原任务、当前增量、已接受事实和最近执行证据，判断本轮改变了什么、还缺什么、下一步是否值得继续。历史进展声明是待复核的观察，不是已完成证明；轮数、文件数量、写回成功或 Gap 增减不能代替语义判断。

- 实际推进：说明消除的具体不确定性、障碍或新增的验收证据；部分推进可以保留同一个 Gap。
- 必要准备：说明准备工作的必要性、已完成证据及其解除了哪项执行前置。恢复账本、建立 Case 或读取背景不自动等于业务结果改善，也不自动意味着应停止。前置已就绪且仍可在授权范围内推进时继续。
- 重复工作：对照历史说明为何同一问题仍未解决、是否获得了新证据。重复读取、重复造 Gap 或反复生成相同方案不能虚报推进；先选择有依据的不同方法。不存在可行的 Agent 下一步时，交代已尝试的方法与具体阻碍，再选择适当交接。

以上是判断角度，不是固定阶段或必须新增的状态枚举。Host 要求 `task_progress` 时，由 Agent 如实提交 `advanced`、`reason`、`evidence`、`remaining`；无论 `advanced` 为何，是否继续均由交接表达，不由该布尔值或固定阈值推导。缺失声明属于输出不完整，应在同一线程补齐，不能被解释成“无进展”。

交接使用现有责任契约：`agent` 表示有可执行的下一步，写明目标与依据；`human` 仅用于具体且必要的用户决定或输入，写明问题与阻塞关系；`external` 写明外部条件和恢复方式；`none` 表示结束执行并保留尚未完成的义务，不冒充 Case 已完成。Agent 可以明确没有业务进展并继续必要准备；也可以在取得进展后按用户要求停止。

用户停止和显式资源边界始终有效。Runtime 可校验结构、权限、版本与提交合法性，处理进程故障和有界协议重试，并将观察交回同一线程；不得设置语义进展评分或以“连续无进展”覆盖 Agent 交接。旧记录中的阈值仅是历史数据。
