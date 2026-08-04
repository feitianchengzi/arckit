# Closeout and Handoff

## 三层结果

1. `round_outcome` 只回答本轮 packet 是否产生可接受结果。
2. `case_resolution` 回答整个 Case 是否仍有 definition、implementation、verification、问题、handoff、完成态复审或 review finding gap。
3. `project_impact_candidate` 只描述 resolved Case 对宏观 Project 维度的候选影响。

三者不能互相替代。round completed 不等于 Case resolved；Case resolved 也不自动提升任何 Project 维度。

## Case transition

```yaml
schema_version: arckit-case-transition/v3
case_id: CASE-YYYYMMDD-NNN
case_updated_at: "expected Case updated_at revision"
project_updated_at: "observed Project updated_at revision"
selected_gap: {}
planned_transition:
  goal: "..."
  expected_state_change: "..."
accepted_state_delta:
  facets: []
  resolved_open_questions: []
  completed_handoffs: []
  completion_review_result: null
  resolved_review_findings: []
  review_budget_extension: null
evidence: []
unresolved: []
round_outcome: completed
case_resolution:
  claimed_status: unresolved | resolved | blocked
  reason: "..."
project_impact_candidate:
  status: none | proposed | accepted
  changes: []
  evidence: []
```

`selected_gap` 必须逐字段复现当前 candidate gap，包括 `responsibility`、`current_state`、`target_state` 和 `next_transition`。ledger 重新审计全部 Case facets：Case revision 或 gap 已过期就拒绝；resolved transition 的 Project revision 已变化也拒绝并要求从 fresh state 重新聚合；unresolved transition 因不聚合 Project State，不以 Project revision 变化作为拒绝条件；resolved claim 强于派生状态时拒绝；unresolved claim 弱于派生状态时允许 ledger 得出 resolved。不同 Case 可以并行执行，canonical Case/Project/iteration/projections/index commit 按 Project 串行化并保持可回滚。

基础内容全部完成后，Controller 仍应声明 unresolved，直到 `completion_review_result` 对当前 `content_revision` 给出三维 clean。复审发现问题时把结构化 findings 写入 Case；修复 findings 后由内容 revision 变化驱动下一轮复审。clean 结果不能与内容修改同轮提交。

自主复审达到 Case 快照上限仍不 clean 时，本轮 closeout 必须是 `needs_human`，下一责任方为 human。Controller 不得为了避开上限把 findings 改写为 clean、重置计数或自行追加预算。只有 human-responsibility gap 可提交人工复审、finding 处置或带证据的有限 `review_budget_extension`。

## Loop handoff v2

- `agent`：Case 仍有可由 Agent 继续选择的 candidate gaps；即使另有 external pending handoff，也应先继续可行动 gap。人工环境为 manual_bridge，Runtime 可用 auto_bridge。
- `human`：需要人类判断或授权；`human_decision_required=true`，trigger 为 user_decision。
- `external`：等待系统外结果；trigger 为 external_wait，并有恢复条件。
- `none`：Case 已由 ledger 派生 resolved。

`deferred` 不再是 handoff 或 resolution 状态。

Runtime 的 auto bridge 每轮只能在已重新读取 ledger 后启动。成功写回重置 no-progress streak；没有状态写回则累积 streak，并在 `no_progress_limit` 或 `max_auto_rounds` 到达时停止。
