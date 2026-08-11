# Agent Loop Conversation Protocol

```text
fresh Project decisions/invariants/advancement + all active Cases
-> select/create one Case
-> recover facts and actual target impacts
-> compare persisted ready candidates with necessary work exposed in this turn
-> select a candidate or define one Agent-owned, ready, current-turn fresh Gap
-> same Agent completes one gap with needed skills/tools
-> transition resolves that one gap and records accepted state
-> trusted ledger audit/writeback
-> fresh state; independently judge the next turn
```

没有合适 Case 时，Agent 返回 `case_control.create_case`：包含 outcome、至少一个 accepted fact，以及基于当前主要阻塞或不确定性得出的一个 initial gap。`initial_impacts` 只有在现有证据已经表明 Project target 受到实际影响时才填写，否则为空；不得用它预测完整影响范围。注册后必须 fresh-read，不能预测 ledger 生成的 revision 或 candidate snapshot。

补充、纠错和目标变化先更新事实理解，再重新判断最重要的 candidate/fresh Gap；continuation 不按清单顺序或旧 prompt 选择，也不要求上一轮预排后续 gaps。Invariant 只约束本轮 accepted transition，不生成工作类型。不同 Case 可以并行，单个 Loop 每轮只关闭一个 gap，canonical commit 按 Project 短暂串行。
