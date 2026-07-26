# Case Fact Contract

当 definition skill 收到 `case_fact_gap` 时，进入 managed-case 模式。人工直接使用 skill 和 Runtime Worker 共享同一输入输出语义，差别只在 packet、授权与结果传递方式。

## 输入

```yaml
case_fact_gap:
  case_id: CASE-YYYYMMDD-NNN
  case_updated_at: "expected Case revision"
  id: CASE-YYYYMMDD-NNN:product_expectation
  facet: product_expectation | interaction_expectation | visual_expectation | technical_expectation
  responsibility: agent | human | external
  current_state: "..."
  target_state: "..."
  next_transition: "..."
  evidence_required: []
  implementation_refs: []
```

skill 先验证 gap 属于自己的事实域，再读取 INDEX、相关稳定事实源、实现证据和验证证据。`case_fact_gap` 是绑定特定 Case revision 的工作目标，不是写 Case ledger 的授权；skill 只维护自己拥有的事实源并回传 claim。revision 已变化时，旧 claim 只能作为证据候选，不能直接写回。

## 动态顺序

- 规格先行：把已确认预期正式化，再用实现或验证证据判断 alignment。
- 代码先行：把代码视为候选实现事实，提炼稳定行为；能确认时补入事实源，不能确认时保留 unresolved 或 human decision。
- 混合推进：只完成当前 gap 所要求的一次有证据状态转移，不强制调用其他 definition skill，也不固定各类定义、实现和验证的先后顺序。
- 确实不需要文档：只有任务范围、运行表面和风险证据足以支持时，输出 `applicability: not_required`、明确 reason 和 evidence；缺少判断依据时仍是 unresolved。

`deferred` 不是完成状态。暂不处理的事实仍输出 unresolved；移交只能说明 owner 与恢复条件，Case 的确定性审计仍决定能否 resolved。

## 输出

managed-case 模式在原有 `document_scope` 之外必须输出：

```yaml
fact_result:
  schema_version: arckit-fact-result/v1
  mode: managed_case
  case_id: CASE-YYYYMMDD-NNN
  facet: product_expectation
  outcome: updated | confirmed_existing | not_required | blocked | needs_human
  applicability: required | not_required
  maturity: exploratory | confirmed | formalized
  target_maturity: exploratory | confirmed | formalized
  alignment: unreconciled | stale | diverged | aligned
  target_alignment: aligned
  resolution: unresolved | resolved | blocked
  reason: "..."
  source_refs: []
  implementation_refs: []
  evidence: []
  unresolved: []
  human_decision_required: false
```

- `resolved` 必须有非空 evidence，并达到声明的 target maturity/alignment。
- `not_required` 必须有明确 reason 和 evidence。
- 实现改变而事实源未同步时，alignment 使用 `stale` 或 `diverged`，resolution 保持 `unresolved`。
- skill 不输出 `case_resolution`、不关闭 Case、不更新 Project State；Controller 接受或拒绝 `fact_result`，ledger 应用 transition 并派生结果。

standalone 模式没有 `case_fact_gap`，继续只维护事实源；仍输出 `fact_result.mode: standalone`，`case_id` 为空，但不形成 ledger claim。
