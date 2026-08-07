# Worker Packet and Report

## Packet v2

`arckit-worker-packet/v2` 必须包含：Worker 身份与 role、稳定 `workstream_id`、task、`case_context.case_id`、`case_context.case_updated_at`、完整 selected Case gap、`context_digest`、`expected_case_impact`、context refs、allowed/forbidden actions、allowed paths、allowed skills、report schema 与 stop condition。保存后再执行的 packet 必须先对照 fresh Case State 校验 revision 和 gap；不兼容旧 packet。

`workstream_id` 由 Controller 根据当前 Case gap、目标连续性和路径域显式声明。同一 Case、同一 Worker 类型中，只有需要继承连续上下文的工作才复用同一 id；独立目标使用不同 id。Runtime 只校验和组合 thread key，不从 role、task 文本、skill 或路径关键词推断 workstream。

`context_digest` 从 fresh canonical Case record 确定性派生，只保存当前 Case revision、意图、selected facet 状态、最近已接受 transition、未解决问题和必要 context refs。它不保存 raw transcript、reasoning 或未接受 claim。同一轮 prior Worker reports 作为独立输入传递，不能混入 digest 冒充 canonical facts；当前 packet 与 canonical facts 始终覆盖复用 thread 中的历史授权和讨论。

`allowed_skills` 只能来自 Worker binding capability manifests。state 不保存 skill 名，Controller 也不能因为 facet 名固定映射 skill；应根据事实源 owner、实现边界和当前证据选择能力。

Worker packet 数量允许为零。当 operator input、现有 stable facts 或已有 verification evidence 已足够支持本轮 Case transition 时，Controller 直接产出 review evidence 与 accepted delta；零 Worker 不是缺失 packet，也不能被 Runtime Guard 自动补成固定 Worker。

## Report v2

`arckit-worker-report/v2` 除常规 summary、findings、evidence、artifact impacts、risks 和 unknowns 外，必须有 `case_state_claims`：

```yaml
case_state_claims:
  - facet: product_expectation
    set:
      applicability: required
      maturity: formalized
      target_maturity: formalized
      alignment: aligned
      target_alignment: aligned
      resolution: resolved
      reason: "稳定行为已写入规格并与实现核对"
    evidence:
      - arckit/spec/example/feature.md
      - src/example.ts
    unresolved: []
```

Worker claim 不是 ledger delta。Controller 必须结合 packet、其他 reports 和证据决定是否进入 `accepted_case_state_delta`。

## Definition fact result

definition skill 的 `arckit-fact-result/v1` 按字段映射到对应 expectation facet claim。`outcome=not_required` 仍必须提供 reason/evidence；`blocked`、`needs_human` 或非空 unresolved 不能被提升成 resolved。

## 停止条件

- 证据不足或 scope 越界时返回 partial/blocked，不补造 claim。
- 需要审美、商业、授权或风险接受时标记 `requires_human_decision`。
- 需要外部系统结果时明确 handoff target 与恢复条件，不把等待写成完成。
