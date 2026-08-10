# Agent Loop Conversation Protocol

```text
fresh Project decisions/invariants/advancement + all active Cases
-> select/create one Case
-> recover facts and relevant target impacts
-> compare ready dynamic gaps
-> same Agent completes one gap with needed skills/tools
-> transition resolves that gap and records newly discovered state
-> trusted ledger audit/writeback
-> fresh state and automatic next turn
```

没有合适 Case 时，Agent 返回包含 outcome、initial facts/impacts/gaps 的 `case_control.create_case`。注册后必须 fresh-read，不能预测 ledger 生成的 revision 或 candidate snapshot。

补充、纠错和目标变化先更新事实理解，再重新判断 decision/invariant impacts 与 ready gaps；continuation 不按清单顺序或旧 prompt 选择。不同 Case 可以并行，单个 Loop 每轮只关闭一个 gap，canonical commit 按 Project 短暂串行。
