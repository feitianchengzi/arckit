# Case Completion Review

Case 的完成态复审是六个内容 facet 全部满足后的终态门禁，不是第七个普通 facet，也不复用过程中的 `verification_state`。

## 派生阶段

```text
working
-> review_ready
-> repairing -> review_ready（可重复）
-> resolved

最后一个授权自主复审仍不 clean
-> needs_human
```

- `working`：至少一个 facet、open question 或 pending handoff 未完成。
- `review_ready`：`base_ready=true`，没有 open review finding，当前 revision 尚无 clean 结论。
- `repairing`：存在 open review findings，且自主复审预算未耗尽。
- `needs_human`：复审主动要求人类，或最后一个授权自主复审仍不 clean。
- `resolved`：当前 `content_revision` 的三维结果均为 clean，且无 open finding。

## Transition 规则

`completion_review_result` 必须覆盖 correctness、completeness、minimality，绑定当前 `content_revision` 并提供 evidence。clean 结果不能携带 finding，也不能与 facet 更新或 finding 修复一起提交。

findings 使用 `error | omission | excess`，保存受影响 facet、artifact refs、责任方和证据。修复通过 `resolved_review_findings` 写回；resolved 与 dismissed 都必须说明原因并提供证据，且都会提升内容 revision、使旧复审失效。

自主 `cycle_count` 只统计 reviewer=agent 的有效复审。有效上限为：

```text
policy.initial_max_cycles + additional_cycles_authorized
```

第 N 个有效自主复审可以 clean；如果第 N 个结果仍为 findings 或 needs_human，ledger 在同一 transition 保存结果并进入 human-only gap，不允许第 N+1 个自主复审。

## 人工处置

人类可以处理 findings、提交 human clean review，或通过 `review_budget_extension` 追加正整数轮次。追加预算必须来自当前 human-responsibility gap，包含 `authorized_by=human`、原因和证据；既有 `cycle_count` 不清零。没有明确人工授权时，Agent 和 Runtime 都不能修改复审上限。
