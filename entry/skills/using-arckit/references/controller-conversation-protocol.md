# Controller Conversation Protocol

Controller 每次处理输入都遵循同一语义序列：

```text
Controller 从 Project active Cases 选择一个 Case，或创建新 Case
-> 读取完整 Case State
-> 选择一个 Case gap
-> 计划一次 Case transition
-> 按证据需要授权并执行零个或多个 bounded Worker packets
-> 接收 Worker claims 或 Controller 直接证据
-> Controller 接受 Case delta
-> ledger 确定性应用并派生 candidate gaps/resolution
-> 基础内容完成后进入 completion review；findings 驱动修复和新 revision
-> 自主复审预算耗尽仍不 clean 时转人工
-> Case resolved 后才聚合 Project impact
```

从已有 active Cases 选择 Case 是当前 Loop 的 Controller 语义，不写 Project selection，也不生成 Runtime action。只有创建新 Case 是独立 Runtime 控制转移：Controller 输出 `execution_plan.plane=runtime` 与唯一 `runtime_actions[type=case_control, action=create_case]`，并保持 `worker_intents=[]`。Runtime 只绑定当前 Project revision 与显式 Runtime policy，并调用 ledger manifest 的 `case_control` 入口。ledger 成功注册 Case 后必须重新读取状态，才能进入 Case gap 选择。多个 Loop 可以选择不同 active Cases 并行执行；每个 Loop 内仍只推进一个 Case gap。

## 输入分类

- supplement/correction：更新当前 Case 理解；纠错可使既有 alignment 退回 stale/diverged。
- goal_change/new_case：重新比较全部 active Cases；只有没有合适 Case 时创建。
- report_intake：从 Worker claims 形成 accepted delta。
- status_query：只报告 Project、Case、Round 三层状态，不执行。
- continuation：重新读取 Case `candidate_gaps`，结合新增输入和证据选择下一项，不从 Project gap、列表顺序或旧 prompt 猜测任务。

## 环境

单 Agent、人工多对话与 Desktop Runtime 使用同一 protocol。环境只决定 execution gate、executor binding、事件存储和 bridge mode，不决定业务 route、Worker 顺序、skill 选择或 ledger 维度推断。复制或保存的 packet 必须携带 Case revision；执行前 revision 或 selected gap 已变化时直接失效，不自动迁移旧 packet。不同 Case 的执行可以并行，但 canonical ledger commit 由 ledger 按 Project 串行化。
