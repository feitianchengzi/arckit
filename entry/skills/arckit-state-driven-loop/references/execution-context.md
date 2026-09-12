# 执行上下文与责任

## 权威顺序

当前用户增量、trusted snapshot receipt 中的 fresh Project/Case/Iteration state、selection token、execution authorization 与已接受 ledger state 高于 thread 历史、旧 gap、旧 revision、旧授权和未接受 claim。Thread 只提供连续性。

Runtime digest 至少包含 Project revision、15 项 software decisions、software invariants、Project gaps、全部 active Case revisions、facts、state impacts、open/blocked/ready gaps、问题、handoffs 与 Review。Digest 是恢复索引，不是 transcript；Agent可以主动读取完成当前 Gap 所需的持久事实载体和工作区证据。

例外仅是 trusted compatibility probe 已证明 canonical state 不可按当前协议读取：此时 digest 必须显式标记 `state_availability: unavailable`，携带完整 compatibility result、affected refs 与 snapshot token，而不是伪造缺失的 Project/Case facts。Agent 先按协议恢复 reference 完成 reconciliation；成功后 fresh-read 才重新建立正常权威顺序。

真实权限来自用户授权、sandbox、approval policy 和 destructive-action 规则。单 Gap 的因果边界见 [轮次边界](round-boundary-contract.md)。

## 执行会话与 Case 状态

Case 是否完成由 trusted Ledger 的验收结果决定；执行会话是否继续由 Agent 结合用户最新意图判断。用户明确要求停止时，保留未完成 Case、发现与证据，结束执行；不创建虚假的完成主张，不需要为停止另造 Gap。后续恢复仍从 trusted snapshot 按单 Gap Loop 推进。

Host 接收 `arckit-agent-loop-result/v2` 时，单独的 `action: handoff` 配合 `next_responsibility: none` 表示结束执行，不宣告 Case resolved；带 Case command 的结果先经过可信验收。Case completion 和 Git 收尾只以 trusted receipt 为依据。待办状态修改与软件验收是不同操作，只有实际操作回执才能证明状态已修改。

Host task context 中的已有 Case binding 是带来源的恢复事实，不要求重复创建 Case，也不替代 fresh snapshot。当前指令优先于历史交接；错误分类、失败日志和未接受 claim 是诊断输入，不自动授权修改工具或跨工作区分发。

## 停止与责任

- revision 或 candidate 快照过期：停止写回，fresh-read 后重新规划。fresh Gap 也必须绑定 fresh Case/Project revision。
- Agent 可以补齐证据：继续当前工作，不转人工。
- 需要审美、商业、授权、风险接受或其他只能由人决定的事项：human handoff。
- 等待系统外结果：external wait，记录恢复条件；若另有 agent-ready gap，先继续。
- 已授权且仍在产生进展的长时工作：继续观察，不因耗时停止。

- 执行工具故障：根据已有授权、当前 Gap 和实际生效路径判断可恢复范围；保留故障证据。运行副本更新是外部依赖时如实报告 external，不因工具失败自动要求人作业务决定。
