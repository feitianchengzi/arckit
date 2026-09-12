---
name: arckit-state-driven-loop
description: 在 Arckit 项目中推进、恢复或交接软件开发事项，并维护 Project、Case 与 Loop 状态。适用于持续开发和可信状态记账；单纯咨询不要求创建 Case，人的业务决定与发布授权仍由人负责。
---

# Arckit State Driven Loop

由同一 Agent 根据当前事实选择一个 Gap，完成并提交可信 Ledger，重新读取状态后再判断下一轮。本包同时包含 Agent 工作方法与确定性记账实现，无需另一个 Ledger skill。

## 职责边界

- Agent 理解意图、比较 Gap、选择 skills/tools/paths、执行、验证并提出语义主张。Gap 内的方法由 Agent 判断。
- 包内 Ledger 校验协议、revision、候选身份、引用和证据结构，原子提交 Project/Case/Iteration；不替 Agent 判断业务相关性。
- Host 提供会话连续性、当前授权、输入与结果传输。Runtime 使用 manifest 声明的入口，不复制 skill 流程或预测执行路径。
- 每轮只接受一个 Gap 的验收主张。依赖本轮才建立的实质事实的下游结果，留待提交并 fresh-read 后重新选择。
- Canonical ledger 只通过本包可信脚本写入；手工文件读取、Agent claim 和 writeback 结果都不替代 trusted snapshot。

## 1. 恢复意图与状态

结合当前用户输入、已有授权和任务上下文，判断继续、调整或停止。按 [执行上下文](references/execution-context.md) 处理恢复绑定、责任和停止；用户停止执行不等于 Case 完成。

取得 Host 提供的 `arckit-ledger-snapshot/v1`。直接 Agent 未收到时，从本包 [manifest](arckit.capability.json) 解析 `loop_snapshot`，在目标项目工作目录调用绝对入口路径。初次接入或需要初始化时读 [记账接口](references/ledger-interface.md)。

- `available`：读取 Project 决策、不变量、推进状态、全部 active Cases、Iteration 与 candidate catalog；主动补读相关持久事实和工作区证据。
- `unavailable`：暂停普通 Case 工作，读 [协议恢复](references/protocol-reconciliation.md)，由同一 Agent 形成 reconciliation，可信验收后重新读取 snapshot。

状态模型、决策与 invariant 含义不清楚时读 [状态模型](references/project-state-model.md)。Thread 历史帮助恢复上下文，当前输入和 fresh state 决定本轮行动。

## 2. 绑定 Case

依据用户意图和现有事实选择一个合适的 Case。已有可信绑定先核对 fresh state，避免重复创建。

没有合适 Case 时，按 [记账接口](references/ledger-interface.md) 提交 `case_control.create_case`：声明意图、预期结果、至少一个当前事实，以及由事实直接支持的具体 initial gap。只有实际受影响的 Project target 才填写 initial impacts，允许为空。创建验收后 fresh-read 再选 Gap。

## 3. 选择本轮 Gap

读取 [轮次边界](references/round-boundary-contract.md)，比较全部 persisted candidates 与本轮实际发现的 fresh work。基于依赖、阻塞、风险、信息增益、用户影响和可验证性选择唯一 Gap；向用户展示候选处置及选择理由，保存完整 selection trace。

从 fresh Case facts 审视当前全部 Project invariants：已充分成立的确认，无关的说明依据，实际缺失、过时、冲突或证据不足的形成开放 Gap。无需为每个 decision/invariant 制造工作轮次。

若一个尚未接受的实质事实会改变下游结果的对象、范围或验收方式，本轮先建立该事实。选择退出条件是：一个由当前事实足以界定的验收结果，以及只服务该结果的 `planned_transition`。

## 4. 执行并验证

自主使用必要 skills、工具和路径完成当前结果。实现与对应验证可以共同服务一个 Gap；普通工具反馈和实现调整不自动变成新的流程阶段。

证据若暴露会改变当前验收边界的新事实，记录该事实与后续 Gap，结束本轮工作。持久产品、交互、视觉、技术事实在实际相关的 Gap 自然维护，不留给最终 Review 常规补齐。

## 5. 提交、回执与 fresh-read

根据调用环境选择接口：

- Host 声明 Semantic Case Command：读 [语义提交](references/semantic-command-handoff.md)，只提交显式语义与 typed refs，由 Ledger 生成 canonical bookkeeping。
- 直接调用完整 transition：读 [直接提交](references/direct-transition.md) 和 [输入传输](references/transition-transport.md)，按 schema 绑定当前 revisions 与 selection token。

提交包含单一验收主张、实际 Case/Project delta、完整 invariant assessment、证据和未完成义务。展示 Ledger 实际接受的 `round_closeout`；再用其 post-commit token 调用 `loop_snapshot`，确认 `observed_after_commit: true` 并展示读取回执。下一 Gap 只能从新 snapshot 独立选择。

revision、候选或结构被拒绝时保留原错误，按原因修正主张或 fresh-read；未接受的主张不算完成。执行停止和责任按执行上下文处理，技术失败不自动变成人工业务决定。

## 6. 完成审查与交接

普通义务闭合后，按 [完成审查](references/completion-review.md) 对 Ledger 派生的 Review candidate 做唯一显式语义自查。Review 只报告结果；finding 由 Ledger 派生普通修复 Gap，下一轮修复后再 Review。当前内容的 clean Review 经可信验收才完成 Case。

Host 请求 `task_closeout` 时读 [任务收尾](references/task-closeout.md)。否则根据 fresh state 自动继续；只有需要人类决定才交人，外部等待保存恢复条件。

## 汇报

说明本轮 Gap、实际接受的改变和证据、Case 状态、fresh-read 回执，以及继续、停止或交接的责任与恢复条件。执行结束时明确区分“已完成 Case”和“保留未完成 Case”。
