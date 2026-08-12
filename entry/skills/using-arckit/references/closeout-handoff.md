# Closeout and Handoff

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

`gap_selection.mode=candidate` 时，`selected_gap` 逐字段复现当前 candidate；`mode=fresh` 时，它描述一个尚未持久化、Agent-owned、无未闭合依赖并在本轮完成的普通 Gap。`considered` 覆盖 selected Case scope 的 persisted candidates 和本轮实际发现的 fresh candidates，恰好一项 `selected`。两种模式都只关闭一个验收主张。`gaps_added` 只记录结果型未解决义务，不保存未来 Loop 的执行步骤；新增 Gap 只能在下一次 fresh-read 后被执行。关闭最后一个 threatened/undetermined impact 的承接 gap 时，必须将 impact 更新为 upheld 或绑定新 gap。

`selected_gap` 和 `planned_transition` 只能由本轮 trusted snapshot 中已经接受的事实与决定直接支持。本轮 `facts_added` 可以证明 selected Gap，也可以派生 `gaps_added`，但不能在同一 transition 中成为其他下游结果的执行依据；依赖这些事实的结果必须等 closeout 和 post-commit fresh-read 后重新选择。

`invariant_assessment` 必须覆盖 observed Project revision 的全部 software invariants 且每项恰好一次。`not_relevant` 需要理由；`upheld` 需要持久证据；`threatened`/`undetermined` 需要 accepted fact refs 和写回后仍 open 的 Case gap refs。它不代替 `state_impacts`：assessment 是每轮完整判断记录，impact 是 Case 中实际受影响 Project target 的持久关系。

Apply 成功返回 `arckit-round-closeout/v2`；只有该 receipt 中的 accepted delta、invariant assessment 与 resulting revisions 可作为“本轮已接受”证据。其 `next_candidate_projection` 为 `null`，下一 Gap 只能来自独立的 post-commit snapshot。

Project delta 不等待 Case resolved：长期结论在被澄清的当轮就更新对应 software decision；新事实使旧结论失效时标记 stale 并绑定 Project gap；任何被接受的 Gap 也可更新 Project gaps 和 selection context。所有 changes 都绑定 observed Project revision 并在 Project lock 内与 Case transition 原子提交。

软件定义 change 更新协议已有 decision area；非核心 invariant 才允许 add/update/retire，且必须是跨 Case 的抽象正确性约束。核心 invariant 只允许由协议升级用 `sync_core` 精确同步 canonical 定义。不得写入 skill、path、owner、固定流程或把项目具体事实变成 invariant。

## Completion Review 与 handoff

普通工作全部闭合后，Review 只检查 implementation correctness、problem resolution、verification credibility、regression risk 和 minimality。Finding 转成普通动态 gap；解决 finding 会提升 content revision，随后重新 Review。它是唯一显式语义自查，也是兜底而非常规事实维护阶段。Case resolved 后的 task closeout 只做 Git 提交判断，不再产生新的语义工作。

只有 `next_responsibility=human` 暂停并要求用户。`external` 保存恢复条件；`agent` fresh-read 后自动继续；`none` 表示 ledger 已派生 resolved。
