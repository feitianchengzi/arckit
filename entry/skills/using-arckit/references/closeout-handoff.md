# Closeout and Handoff

## 三层结果

`round_outcome` 说明本轮是否产生可接受结果；`case_resolution` 说明整个事项是否闭合；`project_impact_candidate` 只描述 resolved Case 对 Project dimension state 或 desired conditions 的显式影响。三者互不替代。

## Case transition v4

```yaml
schema_version: arckit-case-transition/v4
case_id: CASE-YYYYMMDD-NNN
case_updated_at: "expected Case revision"
project_updated_at: "observed Project revision"
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
evidence: []
unresolved: []
round_outcome: completed
case_resolution: { claimed_status: unresolved, reason: "..." }
project_impact_candidate:
  status: none
  changes: []
  condition_changes: []
  evidence: []
```

`selected_gap` 必须逐字段复现当前 candidate 快照。普通 transition 必须 resolve 当前 gap；可以同轮接受新事实、更新 impacts 和增加后续 gaps，但不能 resolve 其他 gap。threatened/undetermined impact 必须仍由 open gap 承接；关闭最后一个承接 gap时必须同轮将 impact 更新为 upheld 或绑定新 gap。

resolved closeout 才能原子应用 `project_impact_candidate`。`condition_changes` 只允许 add/update/retire 项目具体 desired condition，不写 skill、path 或执行路线。Project revision 已变化时 fresh-read 并重新聚合，不得只替换 revision。

## Completion Review 与 handoff

普通工作全部闭合后，Review 检查 implementation correctness、problem resolution、verification credibility、regression risk 和 minimality。Finding 转成普通动态 gap；修复提升 content revision，随后重新 Review。自主预算耗尽后只能 human 处置或显式追加预算。

只有 `next_responsibility=human` 暂停并要求用户。`external` 保存恢复条件；`agent` fresh-read 后自动继续；`none` 表示 ledger 已派生 resolved。旧协议项目在进入 Loop 前先完成显式语义升级。
