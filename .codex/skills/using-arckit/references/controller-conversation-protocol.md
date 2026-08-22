# Agent Loop Conversation Protocol

```text
trusted ledger snapshot
-> incompatible: same-Agent semantic reconciliation -> trusted atomic apply -> fresh-read
-> compatible: fresh Project decisions/invariants/advancement + all active Cases
-> select/create one Case
-> recover facts and actual target impacts
-> assess every current Project invariant against fresh Case facts and dynamically selected skills
-> compare persisted ready candidates with necessary work exposed in this turn
-> when a downstream result depends on an unaccepted material fact or decision, select the Gap that establishes that prerequisite
-> select a candidate or define one Agent-owned, ready, current-turn fresh Gap
-> same Agent completes one gap with needed skills/tools
-> transition resolves that one acceptance claim, records new facts/future gaps without consuming them for downstream work, and stops work
-> trusted ledger audit/writeback -> user-visible round closeout
-> post-commit trusted snapshot receipt
-> user-visible fresh-read; independently judge the next turn
```

协议恢复分支不创建 Case/Gap、不推进产品状态；它只恢复 canonical ledger 在当前协议下的可读性。恢复后从原始用户意图重新进入正常分支，不复用恢复前的 revision 或 candidate。

没有合适 Case 时，Agent 返回 `case_control.create_case`：包含 outcome、至少一个 accepted fact，以及由当前事实直接支持的一个 initial gap。若尚未接受的前置条件会改变下游结果，initial gap 只建立该条件，不同时包含依赖它的下游结果。`initial_impacts` 只有在现有证据已经表明 Project target 受到实际影响时才填写，否则为空；不得用它预测完整影响范围。注册后必须 fresh-read，不能预测 ledger 生成的 revision 或 candidate snapshot。

补充、纠错和目标变化先更新事实理解，再重新判断最重要的 candidate/fresh Gap；continuation 不按清单顺序或旧 prompt 选择，也不要求上一轮预排后续 gaps。Invariant 指导 Agent 发现必须显式判断的 Case 义务，但不生成固定工作类型：判断结果可以是 upheld、not relevant，或由 threatened/undetermined 暴露一个动态 Gap。不同 Case 可以并行，单个 Loop 每轮只接受一个 gap claim，canonical commit 按 Project 短暂串行。
