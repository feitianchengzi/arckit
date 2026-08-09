# Agent Loop Input Boundary

## 权威顺序

当前用户增量、fresh canonical Project/Case facts、execution authorization 与已接受 ledger state 覆盖 thread 历史、旧 selected gap、旧 revision、旧授权和未接受 claim。Thread 提供语义连续性，不是事实源。

Runtime digest 从 fresh records 确定性派生，至少包含 Project revision 与选择依据、全部 active Cases 的 revisions、意图、facet 摘要、candidate gaps、问题、handoffs、completion review 摘要和 canonical refs。它是恢复索引，不是 transcript 摘要；Agent 可以为完成当前 gap 主动读取引用、源码、配置、测试与其他必要事实。

## 两种桥接

- Runtime 桥接：当前 invocation 提供原始待办意图、当前增量、fresh digest、授权和 compact result schema；同一活动待办在一个 Codex thread 中按 gap 发起多个 turns。
- 人工桥接：没有 Runtime digest 时，Agent 主动读取 Project State、全部 active Cases 和必要事实源，并在当前对话中持续推进。

两种桥接使用相同 Case/gap/transition/closeout 语义。Runtime 不把 Agent 降格为只消费内联 facts 的纯函数；人工桥接也不能用对话记忆替代 fresh revisions。

## 执行边界

当前 Agent 可以在同一 turn 内使用工具和其他 skills 完成 selected gap。Sandbox、approval policy、工作区根、用户授权和 destructive-action 规则决定真实执行权限；Runtime 不通过语义 prompt 禁止正常的读取、实现、构建或验证。

只有实际创建独立 sub-agent、外部 Worker 或独立复审时才跨 thread 传递 packet/report。概念上的 planning、execution、review 都可由当前 Agent 在同一 turn 内完成。

## 停止与责任

- revision 或 selected gap 过期：停止写回，从 fresh state 重新规划。
- Agent 可自行补齐证据：在当前 turn 继续，不转人工。
- 需要审美、商业、授权或风险接受：human handoff。
- 等待系统外结果：external handoff，并写明恢复条件。
- 长构建或测试仍在运行：继续观察同一工具执行，除非收到显式 interrupt。
