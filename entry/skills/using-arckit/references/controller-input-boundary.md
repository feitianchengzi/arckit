# Agent Loop Input Boundary

## 权威顺序

当前用户增量、fresh Project desired conditions、fresh Case facts/impacts/gaps、execution authorization 与已接受 ledger state 高于 thread 历史、旧 gap、旧 revision、旧授权和未接受 claim。Thread 只提供连续性。

Runtime digest 至少包含 Project revision、dimensions/conditions/Project gaps、全部 active Case revisions、facts、state impacts、open/blocked/ready gaps、问题、handoffs、Review 与 canonical refs。Digest 是恢复索引，不是 transcript；Agent 可以主动读取完成当前 gap 所需的源码、文档、日志、配置和测试。

## 执行边界

同一 Agent 在一个 turn 中完成选择、事实调查、必要 skill/tool 使用、实现、验证和 transition。Runtime 不依据 condition 文本生成 skill、路径、权限或执行角色。真实权限只来自用户授权、sandbox、approval policy 和 destructive-action 规则。

## 停止与责任

- revision 或 selected gap 快照过期：停止写回，fresh-read 后重新规划。
- Agent 可以补齐证据：继续当前工作，不转人工。
- 需要审美、商业、授权、风险接受或其他只能由人决定的事项：human handoff。
- 等待系统外结果：external wait，记录恢复条件；若另有 agent-ready gap，先继续。
- 长构建或测试仍在运行：继续观察，不因耗时停止。
