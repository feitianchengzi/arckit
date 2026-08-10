# Case Completion Review

Completion Review 是普通动态 gaps、问题、handoff 和 threatened/undetermined impacts 全部闭合后的终态门禁。它不承担常规产品、交互、视觉、技术、代码或验证补齐，也不是普通 facet。

## 五个维度

- `implementation_correctness`：实现符合 relevant accepted facts 与 upheld conditions。
- `problem_resolution`：原始问题或目标真实闭合。
- `verification_credibility`：验证覆盖主要风险并可重复。
- `regression_risk`：没有未处理的回归与边界破坏。
- `minimality`：没有无必要修改或过度设计。

Review 必须绑定当前 `content_revision` 并提供证据。clean 不能带 finding，也不能与内容 mutation 同轮提交。

Finding 类型为 `error | omission | excess`，并转换为普通 dynamic gap。修复或有证据的处置提升 content revision，使旧 Review 失效；随后重新审查。Review 可以意外发现定义或设计遗漏，但这只是查缺补漏，不是日常文档推进机制。

自主 `cycle_count` 只统计 reviewer=agent；上限是 policy snapshot 加 human-authorized extension。最后一个授权轮次仍不 clean 时进入 human-only gap。只有当前 human responsibility 可提交人工 clean Review、风险处置或带证据的有限预算扩展；既有计数不清零。
