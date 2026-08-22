# Case Gap Contract

Definition skill 在 Agent 判断某个 dynamic gap 需要维护其事实域时进入 managed-case 模式。Gap 只表达当前缺少的结果，不预先指定 facet、skill、文档路径或固定工作顺序；Agent 依据完整 Case、Project、实现和验证上下文动态选择所需能力。

## 输入

```yaml
case_gap:
  case_id: CASE-YYYYMMDD-NNN
  case_updated_at: "expected Case revision"
  id: GAP-stable-id
  goal: "当前需要得到的结果"
  reason: "为什么它现在重要"
  derived_from: []
  blocked_by: []
  priority_basis: {}
  responsibility: agent | human | external
  evidence_required: []
  relevant_facts: []
  relevant_state_impacts: []
  context_refs: []
```

`case_gap` 是绑定特定 Case revision 的工作目标，不是写 ledger 的授权。Skill 必须先读取 gap 与全部相关上下文，再判断自己的事实域是否需要查询、更新、确认既有事实或明确不适用；不得仅凭 gap 标题、代码现状或文档现状推断结论。revision 已变化时，旧结果只能作为候选证据。

## 动态工作原则

- 当前工作的先后顺序由 Agent 基于阻塞、风险、信息增益、依赖、用户影响和可验证性决定，definition skill 不规定规格、交互、视觉、技术、实现或测试的顺序。
- 维护某一事实域时，结论基于全部相关信息。清楚就是清楚，不清楚就保留 unresolved；不创建“已清楚但与代码未对齐”一类中间状态。
- 如果 gap 的可信完成需要改变本 skill 管理的稳定事实源，应在本次工作中更新；如果已有内容已充分表达，则确认既有事实；如果与该事实域无关，则明确不适用。
- Skill 只完成当前 gap 中属于自己的事实维护，不决定下一个 gap、不关闭 Case、不更新 Project/Case State。Agent 汇总工具和 skill 结果后形成一次 transition。
- Completion Review 只在普通 gaps 全部闭合后查缺补漏，并重点验证实现；不能把常规文档补齐推迟到 Review。

## 输出

managed-case 模式在原有 `document_scope` 之外输出：

```yaml
fact_result:
  schema_version: arckit-fact-result/v2
  mode: managed_case
  case_id: CASE-YYYYMMDD-NNN
  gap_id: GAP-stable-id
  outcome: updated | confirmed_existing | not_applicable | blocked | needs_human
  facts:
    - statement: "稳定事实"
      basis: "为什么可以接受"
      source_refs: []
      evidence: []
  unresolved: []
  human_decision_required: false
```

- `updated` 与 `confirmed_existing` 必须给出非空事实、来源和足以支持结论的证据。
- `not_applicable` 只说明当前 gap 不需要该事实域，不会在 Case 中形成固定的 not-required 状态项。
- `blocked` 或 `needs_human` 必须说明 unresolved、责任和恢复所需信息。
- Skill 不输出 Case resolution、facet 状态、maturity、alignment、后续 gap 或 Project impact。

standalone 模式没有 `case_gap`，继续直接维护或查询事实源；仍输出 `fact_result.mode: standalone`，`case_id` 与 `gap_id` 为空，但不形成 ledger claim。
