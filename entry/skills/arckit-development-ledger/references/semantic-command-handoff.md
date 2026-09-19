# Semantic Case Command Handoff

首次构造 invariant assessment、发现反证或恢复 upheld 时读取 [invariant-assessment.md](invariant-assessment.md)。选择前显式考虑当前完整 catalog，提交时按各自动态定义的责任更新；不变量是必须的保障，不是全部候选来源。reason 明确具体适用对象、证据支持范围和未决部分，不以笼统“验证通过”覆盖多个判断。

当 Host output schema 声明 `arckit-semantic-case-command/v1` 时使用本契约。Agent 生成业务语义，trusted Ledger 生成 canonical bookkeeping；Runtime 只传输和投影。

## Agent 必须声明

- `case_id` 与绑定当前 Case 的 `selection.snapshot_token`。
- 完整 persisted candidate 比较、唯一 `selected_ref`，以及本轮实际发现的 fresh candidate。
- 本轮目标、一个验收主张、事实、Gap、影响、Project decision/invariant 变化、完整 invariant assessment、证据和 unresolved 语义。
- 每条关系的方向与类型。脚本不会根据 statement、reason、路径或空字段猜测关系。

## Selected Gap 主张

选择说明使用 goal、reason、priority basis、evidence requirements 与必填 planned_transition.selection_assessment 表达有界验收集合、局部前置和结论性质。selection_assessment 使用与 direct v8 相同的结构，invariant_refs 是当前 catalog 的原始 ID；结构见 ../schema/selection-assessment.schema.json。事实、Project decision 变化和 impacts 必须来自当前缺口已经建立的结论；相关低风险结果可以共同决定和验收，但不能合并重要独立取舍，也不能将建立预期与正式兑现合并。完整 invariant assessment 可以保留其他相关缺口未解决，不要求本轮全部 upheld。


- 普通 Case Gap 未验收完成时允许 `round_outcome: partial`、`claim.resolve_selected_gap: null`，提交已有事实和证据并保留同一 Gap；不得为通过校验虚报完成或新增替代 Gap。
- 普通 Case Gap 的完成使用 `claim.resolve_selected_gap`；Completion Review candidate 是 Ledger 派生的审查门禁，不是可由该字段关闭的普通 Gap。
- 选择 Completion Review candidate 时，`resolve_selected_gap` 必须为 `null`，Case 内容变更数组必须为空；只用 `completion_review_result` 提交 clean/findings/needs_human，或只用 `review_budget_extension` 提交 human 授权，两者不能同轮出现。
- Review finding 由 `completion_review_result.findings` 声明并由 Ledger 派生后续普通修复 Gap。修复和事实变化在 fresh-read 后选择该普通 Gap 的下一轮提交，不能与 Review 合并。

## Typed refs

- 新实体使用 command-local handle：`local:fact:<handle>`、`local:gap:<handle>`、`local:impact:<handle>`、`local:project-gap:<handle>`、`local:invariant:<handle>`。
- 既有 Case 实体使用：`case:fact:<id>`、`case:gap:<id>`、`case:impact:<id>`。
- Project target 使用：`project:decision:<id>`、`project:invariant:<id>`、`project:project-gap:<id>`。
- `derived_from` 的协议来源使用 `system:<source>`；新增事实或 Gap 关系仍使用对应 typed ref。
- local handle 只在当前命令内建立显式关系，不是 canonical id hint。Ledger 返回的 receipt 才包含 canonical mapping。

## Agent 不生成

- 新实体 canonical id、fact revision、Case `updated_at` 或 Project revision。
- selected Gap 的复制对象或完成后的 Case status/handoff。
- Project decision 的 observed/post-update revision。
- `Project Gap.affects` 已声明关系的 `decision_area.gap_refs` 反向副本。
- 内部 `arckit-case-transition/v8`。

## Ledger 物化

Trusted writeback 在同一 Project commit lock 内验证 snapshot/candidate freshness，解析 typed refs，分配 id/revision，重建 canonical candidate，展开反向索引，编译 v8，对完整 projected state 预检并原子提交。任何缺失的业务 target、effect、disposition、responsibility 或关系都必须拒绝，不得自动补义。

Materializer 在编译内部 Transition 前校验 selected candidate、命令内身份与动作一致性，并验证本轮主张形成的 Case/Project 投影仍满足确定性闭包：Agent 主张冲突返回可修复的 `claim_invalid`；只有确定性物化或内部实现自身失败才归 Ledger 责任。

成功结果返回 `arckit-semantic-command-receipt/v1`、内部 transition result、`arckit-round-closeout/v2` 与 post-commit snapshot token。下一 Gap 仍只来自独立 fresh-read。

## Review finding 的修复义务引用

Review 不新增普通 Gap。`invariant_assessment.gap_refs` 可以显式引用本次 `completion_review_result.findings` 中已声明的 `local:review-finding:<handle>`；Ledger 将它物化为该 finding 实际派生的开放修复 Gap。未知 handle 仍拒绝，Agent 不预测 Gap ID，也不降低 threatened/undetermined 判断来绕过提交。

## 契约与运行版本

Host 从当前可信 Ledger manifest 的 `agent_contracts` 读取 schema 与本说明；修复源码不等于当前运行副本已更新。使用 snapshot 的 `selection_tokens[case_id]` 提交所选 Case，顶层 `snapshot_token` 是快照观察凭据，不是可互换的选择 token。引用格式错误属于 claim 修复；真实状态过期需要 fresh-read；当前可信实现不能表达合法主张时保留原主张、证据、拒绝和实际能力路径，交回能力故障，不改写为业务已完成。
