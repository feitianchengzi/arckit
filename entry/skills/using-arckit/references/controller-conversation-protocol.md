# Agent Loop Conversation Protocol

每次处理输入遵循同一语义序列：

```text
fresh Project + all active Cases
-> select one Case or request create_case
-> select one candidate gap
-> plan one transition
-> same Agent uses needed skills/tools and gathers evidence
-> same Agent reviews the result and claims one delta
-> Runtime structural gate
-> trusted ledger apply and derived resolution/handoff
-> fresh state in the next turn
```

从已有 active Cases 选择 Case 是本轮语义，不写 Project selection。只有创建新 Case 是独立 Runtime control：Agent 返回 `case_control.create_case`；Runtime 绑定当前 Project revision 与显式 review policy后调用 ledger。成功注册后必须 fresh-read，不能在创建前预测新 Case gap。

## 输入分类

- supplement/correction：更新当前 Case 理解；纠错可以使 alignment 退回 stale/diverged。
- goal_change/new_case：重新比较全部 active Cases；只有没有合适 Case 时创建。
- status_query：只报告 Project、Case、Round 三层状态，不执行。
- continuation：结合 fresh candidate gaps、新输入和证据选择下一项，不从列表顺序或旧 prompt 猜测。

## 执行形态

人工 Codex、Desktop Runtime 和其他自动化平台共享该序列。一个 Agent turn 完成选择、执行、自我审查和 transition claim；Runtime 不按阶段派生额外 Agent 调用。不同 Case 可以由不同 Loops 并行推进，单个 Loop 仍只处理一个 gap，canonical ledger commit 按 Project 短暂串行。
