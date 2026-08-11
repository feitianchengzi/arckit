# Case Completion Review

Completion Review 是普通动态 gaps、问题、handoff 和 threatened/undetermined impacts 全部闭合后的 Case 终态门禁，也是唯一显式语义自查。它不是软件事实、Project decision/invariant 或普通 facet，也不承担常规产品、交互、视觉、技术、代码或验证补齐；普通 Gap 的证据收集和 ledger 校验不构成额外 Review。

Ledger 在已持久化普通工作闭合后派生 Review candidate；同一 Agent 若从 fresh state 发现更重要的普通工作，可用 `fresh` 选择先完成它。只有不存在此类工作时才执行语义审查。Review finding 先转成普通 dynamic gap；只有后续调查确认的稳定结论才可能通过普通 transition 成为 fact。clean Review 关闭 Case 后，Runtime 只可执行 Git-only closeout。

## 五个维度

- `implementation_correctness`：实现符合 relevant accepted facts、software decisions 与 upheld invariants。
- `problem_resolution`：原始问题或目标真实闭合。
- `verification_credibility`：验证覆盖主要风险并可重复。
- `regression_risk`：没有未处理的回归与边界破坏。
- `minimality`：没有无必要修改或过度设计。

Review 必须绑定当前 `content_revision` 并提供证据。clean 不能带 finding，也不能与内容 mutation 同轮提交。

Finding 类型为 `error | omission | excess`，并转换为普通 dynamic gap。修复或有证据的处置提升 content revision，使旧 Review 失效；随后重新审查。Review 可以意外发现定义或设计遗漏，但这只是查缺补漏，不是日常文档推进机制。

自主 `cycle_count` 只统计 reviewer=agent；上限是 policy snapshot 加 human-authorized extension。最后一个授权轮次仍不 clean 时进入 human-only gap。只有当前 human responsibility 可提交人工 clean Review、风险处置或带证据的有限预算扩展；既有计数不清零。
