# Agent Loop Input Boundary

## 权威顺序

当前用户增量、trusted snapshot receipt 中的 fresh Project/Case/Iteration state、selection token、execution authorization 与已接受 ledger state 高于 thread 历史、旧 gap、旧 revision、旧授权和未接受 claim。Thread 只提供连续性。

Runtime digest 至少包含 Project revision、15 项 software decisions、software invariants、Project gaps、全部 active Case revisions、facts、state impacts、open/blocked/ready gaps、问题、handoffs 与 Review。Digest 是恢复索引，不是 transcript；Agent可以主动读取完成当前 Gap 所需的持久事实载体和工作区证据。

例外仅是 trusted compatibility probe 已证明 canonical state 不可按当前协议读取：此时 digest 必须显式标记 `state_availability: unavailable`，携带完整 compatibility result、affected refs 与 snapshot token，而不是伪造缺失的 Project/Case facts。Agent 先按协议恢复 reference 完成 reconciliation；成功后 fresh-read 才重新建立正常权威顺序。

## 执行边界

同一 Agent 在一个 turn 中从 fresh state 独立判断当前最重要的单一验收主张，并只完成该 Gap。若某项下游结果必须先在本轮建立新的实质事实或决定，当前 Gap 只建立这个前置条件；它被接受并 fresh-read 之前，不执行依赖它的下游结果。Agent 可以选择现有 `candidate`，也可以提出并当轮完成一个 `fresh` Gap；上一轮不负责预先编排后续 gaps 或 impacts。Runtime 不依据 decision/invariant 文本生成 skill、路径、权限或执行角色。真实权限只来自用户授权、sandbox、approval policy 和 destructive-action 规则。

## 停止与责任

- revision 或 candidate 快照过期：停止写回，fresh-read 后重新规划。fresh Gap 也必须绑定 fresh Case/Project revision。
- Agent 可以补齐证据：继续当前工作，不转人工。
- 需要审美、商业、授权、风险接受或其他只能由人决定的事项：human handoff。
- 等待系统外结果：external wait，记录恢复条件；若另有 agent-ready gap，先继续。
- 已授权且仍在产生进展的长时工作：继续观察，不因耗时停止。
