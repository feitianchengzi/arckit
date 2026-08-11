# Closeout and Handoff

## 三层结果

`round_outcome` 说明本轮是否产生可接受结果；`case_resolution` 说明整个事项是否闭合；`project_state_delta` 说明本轮被接受事实对 Project 软件定义、软件不变量、Project gaps 或 selection context 的直接影响。三者互不替代。

## Case transition v6

```yaml
schema_version: arckit-case-transition/v6
case_id: CASE-YYYYMMDD-NNN
case_updated_at: "expected Case revision"
project_revision: 12
gap_selection: { mode: candidate, basis: "why this is the most important current action" }
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
evidence: []
unresolved: []
round_outcome: completed
case_resolution: { claimed_status: unresolved, reason: "..." }
```

`gap_selection.mode=candidate` 时，`selected_gap` 逐字段复现当前 candidate；`mode=fresh` 时，它描述一个尚未持久化、Agent-owned、无未闭合依赖并在本轮完成的普通 Gap。两种模式都只关闭一个 gap。`gaps_added` 只记录本轮已经发现但仍未解决的真实工作，不预先规划未来 Loop。关闭最后一个 threatened/undetermined impact 的承接 gap 时，必须将 impact 更新为 upheld 或绑定新 gap。

Project delta 不等待 Case resolved：产品或技术结论在被澄清的当轮就更新对应 software decision；新事实使旧结论失效时标记 stale 并绑定 Project gap；实现或验证轮也可更新 Project gaps 和 selection context。所有 changes 都绑定 observed Project revision 并在 Project lock 内与 Case transition 原子提交。

软件定义 change 更新协议已有 decision area；非核心 invariant 才允许 add/update/retire，且必须是跨 Case 的抽象正确性约束。核心 invariant 只允许由协议升级用 `sync_core` 精确同步 canonical 定义。不得写入 skill、path、owner、固定流程或把项目具体事实变成 invariant。

## Completion Review 与 handoff

普通工作全部闭合后，Review 只检查 implementation correctness、problem resolution、verification credibility、regression risk 和 minimality。Finding 转成普通动态 gap；修复提升 content revision，随后重新 Review。它是唯一显式语义自查，也是兜底而非常规文档补齐阶段。Case resolved 后的 task closeout 只做 Git 提交判断，不再检查、验证、编辑或修复内容。

只有 `next_responsibility=human` 暂停并要求用户。`external` 保存恢复条件；`agent` fresh-read 后自动继续；`none` 表示 ledger 已派生 resolved。
