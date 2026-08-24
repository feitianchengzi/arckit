# Semantic Case Command Handoff

当 Host output schema 声明 `arckit-semantic-case-command/v1` 时使用本契约。Agent 生成业务语义，trusted Ledger 生成 canonical bookkeeping；Runtime 只传输和投影。

## Agent 必须声明

- `case_id` 与绑定当前 Case 的 `selection.snapshot_token`。
- 完整 persisted candidate 比较、唯一 `selected_ref`，以及本轮实际发现的 fresh candidate。
- 本轮目标、一个验收主张、事实、Gap、影响、Project decision/invariant 变化、完整 invariant assessment、证据和 unresolved 语义。
- 每条关系的方向与类型。脚本不会根据 statement、reason、路径或空字段猜测关系。

## Selected Gap 主张

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

Materializer 在编译内部 Transition 前校验 selected candidate 与 claim 形态：Agent 违反 Review/普通 Gap 的主张互斥时返回可修复的 `claim_invalid`；只有确定性物化或内部实现自身失败才归 Ledger 责任。

成功结果返回 `arckit-semantic-command-receipt/v1`、内部 transition result、`arckit-round-closeout/v2` 与 post-commit snapshot token。下一 Gap 仍只来自独立 fresh-read。
