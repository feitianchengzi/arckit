# 直接 Case Transition 提交

## 三层结果

`round_outcome` 说明本轮是否产生可接受结果；`case_resolution` 说明整个事项是否闭合；`project_state_delta` 说明本轮被接受事实对 Project 软件定义、软件不变量、Project gaps 或 selection context 的直接影响。三者互不替代。

## Case transition v8

```yaml
schema_version: arckit-case-transition/v8
case_id: CASE-YYYYMMDD-NNN
case_updated_at: "expected Case revision"
project_revision: 12
gap_selection:
  mode: candidate
  basis: "why this is the most important current action"
  snapshot_token: "selected Case scoped token from trusted snapshot"
  selected_ref: "case-gap:CASE-...:GAP-..."
  comparison_summary: "how persisted and discovered fresh candidates compared"
  fresh_discovery_summary: "what fresh work was actually discovered"
  considered: []
selected_gap: {}
planned_transition: { goal: "...", expected_state_change: "..." }
accepted_state_delta:
  resolved_gap: null
  facts_added: []
  facts_superseded: []
  impacts_added: []
  impacts_updated: []
  gaps_added: []
  gaps_cancelled: []
  resolved_open_questions: []
  completed_handoffs: []
  completion_review_result: null
  resolved_review_findings: []
  review_budget_extension: null
project_state_delta:
  software_definition_changes: []
  software_invariant_changes: []
  project_gap_changes: []
  selection_context_change: null
  evidence: []
invariant_assessment:
  project_revision: 12
  judgments:
    - invariant_ref: technical-decisions-remain-explainable
      disposition: threatened
      reason: "A newly accepted fact exposes an unresolved technical-contract question."
      fact_refs: [FACT-003]
      evidence: []
      gap_refs: [GAP-TECH-JUDGMENT]
evidence: []
unresolved: []
round_outcome: completed
case_resolution: { claimed_status: unresolved, reason: "..." }
```

`gap_selection.mode=candidate` 时，`selected_ref` 与 `selected_gap.id` 精确指向当前 candidate；`selected_gap.goal/reason` 允许 Agent 作不改变验收主张的自然语言转述，Ledger 以 snapshot token、Case revision、稳定引用和当前 ready 状态重新解析 canonical candidate，并将 canonical 内容写入 round 与 closeout。`mode=fresh` 时，`selected_gap` 描述一个尚未持久化、Agent-owned、无未闭合依赖并在本轮完成的普通 Gap。`considered` 覆盖 selected Case scope 的 persisted candidates 和本轮实际发现的 fresh candidates，恰好一项 `selected`。两种模式都只关闭一个验收主张。`gaps_added` 只记录结果型未解决义务，不保存未来 Loop 的执行步骤；新增 Gap 只能在下一次 fresh-read 后被执行。关闭最后一个 threatened/undetermined impact 的承接 gap 时，必须将 impact 更新为 upheld 或绑定新 gap。

候选比较、因果边界、完整 invariant assessment 与 post-commit fresh-read 按 [轮次边界](round-boundary-contract.md) 执行。这里的模板只展示结构；精确字段以 [transition schema](../schema/case-transition.schema.json) 和 validator 为准。

Project delta 不等待 Case resolved：长期结论在被澄清的当轮就更新对应 software decision；新事实使旧结论失效时标记 stale 并绑定 Project gap；任何被接受的 Gap 也可更新 Project gaps 和 selection context。所有 changes 都绑定 observed Project revision 并在 Project lock 内与 Case transition 原子提交。

软件定义 change 更新协议已有 decision area；非核心 invariant 才允许 add/update/retire，且必须是跨 Case 的抽象正确性约束。核心 invariant 只允许由协议升级用 `sync_core` 精确同步 canonical 定义。不得写入 skill、path、owner、固定流程或把项目具体事实变成 invariant。

Completion Review 与执行交接分别按 [完成审查](completion-review.md) 和 [执行上下文](execution-context.md) 处理。
