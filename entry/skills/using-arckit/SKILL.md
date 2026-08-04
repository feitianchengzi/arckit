---
name: using-arckit
description: "Arckit 项目对话 Controller。把真实软件开发输入或 Worker reports 转成 Project 选 Case、Case 选 gap、Loop 执行一次状态转移的结构化语义。适用于人工在 Codex 类 Agent 中直接协作，也适用于 Runtime 自动桥接；两者必须产生相同的 Case transition、closeout 和 handoff。它不执行 Worker 工作、不写 ledger、不按固定顺序调用 skills。"
---

# Using Arckit

本 skill 是语义 Controller。软件开发顺序可以是规格先行、代码先行或混合推进，但每轮必须从 Case State 的真实 gap 出发，并以有证据的 Case State delta 结束。Runtime 与人工多对话只是两种执行桥，不能改变 Controller 语义。

## 硬边界

- Project State 只表达软件整体位置、项目级 gap、active Case 集合与选择依据，不保存某个 Runtime/Loop 的独占 selected Case、轮次职责或 continuation prompt。
- Case State 保存一次有边界研发事项的 definition、implementation、verification、问题、handoff、内容 revision、完成态复审、candidate gaps 和 resolution。
- Loop 只执行一次计划状态转移，产生 evidence、claims、accepted delta 和 handoff。
- state 描述 gap，不保存 skill 名。Controller 根据 gap、capability manifest 和证据边界动态选择 Worker 能力，不固定 skill 顺序。
- Controller 不执行 Worker 工作、不写 ledger、不把 round 完成等同 Case resolved，也不把 Case resolved 等同 Project 维度已提升。
- 每个 Loop 由 Controller 从全部 active Cases 中选择唯一 Case；不同 Loop 可以并行推进不同 Case。Case 是否沿用或新建由 Controller 根据输入与 Project/Case facts 判断；Runtime 不从任务文本、列表位置或 route mode 推断 Case control 动作。
- `deferred` 不是完成。未处理项仍是 unresolved；只有有 owner 与恢复条件的 handoff 才能转移责任。
- 六个 facet 都完成不等于 Case resolved。Controller 必须继续处理 ledger 派生的 `completion_review`/`review_findings` gap；复审上限耗尽后只能接受人工处置或有证据的人工追加预算。

## 主流程

### 1. 恢复 Project 与 Case

输入：用户消息或 operator event、`project-state-record/v4`、全部 active Case records、iteration、稳定事实源引用、上一轮 handoff。

动作：

- 判断输入是补充、纠错、目标变化、report intake、状态查询、新 Case 或继续。
- 结合 Project State 的选择依据，从全部 active Cases 中选择一个；没有合适 Case 时提出创建新 Case。Project 级 gap 只能用于选 Case，不能直接成为 Worker 的任务状态。
- 读取完整 selected Case，拒绝只凭 Project brief 或上一轮 prompt 推断任务细节。

退出条件：当前 Loop 有唯一 `case_id`。已有 active Case 直接进入 gap 选择，不写 Project selection；没有合适 Case 时输出 `execution_plan.plane=runtime` 与唯一 `runtime_actions[type=case_control]`，其 action 为 `create_case`，同时保持 `worker_intents=[]`。`create_case` 必须给出 title、intent、artifact_type 与 selection_reason。Runtime 把该语义动作封装成 `arckit-case-control-handoff/v1`，绑定 Project revision 和显式复审 policy后调用 ledger；成功注册 Case 并重新读取 Project/Case State 后才能选择 gap。

### 2. 选择 Case gap 与计划 transition

输入：selected Case 的 `case_resolution.candidate_gaps`、全部 facets、open questions、pending handoffs、用户本轮增量。

动作：

- 结合用户意图、现有代码、稳定事实和风险，从 `candidate_gaps` 动态选择一个 `scope=case` 的具体 gap；列表顺序不表达执行优先级。用户纠错可使既有 definition alignment 退回 stale/diverged。
- 输出 `planned_transition.goal` 和 `expected_state_change`。
- 顺序由事实决定：可以先 formalize definition、先实现、先验证、或从实现反向补齐稳定事实。
- 对不适用 facet 也必须计划形成 evidence-backed `not_required` 判断；不能通过跳过来完成。
- `completion_review` 只在 `base_ready=true` 后选择，必须覆盖错误、遗漏、多余三个维度并绑定当前 `content_revision`；`review_findings` 必须先修复或有证据地处置，再进行新一轮复审。
- human-responsibility completion review gap 不能自动桥接。人类可直接复审、处置 findings，或授权有限追加轮次；Controller 不重置既有复审次数。

退出条件：`selected_gap`、目标变化和 evidence requirement 明确。

### 3. 形成执行边界

需要人工或 Runtime 派发 Worker 时，读取 [references/worker-packet-and-report.md](references/worker-packet-and-report.md)。

动作：

- 根据 gap 选择必要 Worker role 和 capability manifest；允许零个或多个 definition/engineering/verification 能力，但不固定顺序。
- 当用户本轮输入、Controller 已读取的稳定事实或现有验证证据已经足以完成一个 transition 时，使用零 Worker 计划并直接在 Controller Review 中提交 evidence-backed delta；不得为满足流程形状而派发空转 Worker。
- 每个 packet 声明 `case_context`、`expected_case_impact`、路径、动作、skills 与停止条件。
- 默认 execution gate 为 pending；只有用户、Runtime policy 或外部平台明确授权才可执行。

退出条件：packet 可由当前 Agent、人工复制桥或 Runtime 自动桥等价执行。

### 4. 接收 reports 并接受 Case claims

输入：`arckit-worker-report/v2`。

动作：

- 校验 packet 身份、scope、证据、artifact impact、risk/unknown 与 `case_state_claims`。
- Worker 只能提 claim；Controller 明确接受或拒绝，形成 `accepted_case_state_delta`。零 Worker 时，Controller 必须在 `evidence` 中列出直接采用的用户确认或稳定事实来源。
- definition skill 的 `fact_result` 可转为对应 facet claim；实现或验证证据可更新其 facet，并使相关 definition alignment 变 stale/diverged。
- 人类判断、外部等待和 agent 可继续工作必须分别归责。

退出条件：所有 report 有 intake 结果，accepted delta 与 evidence 可追溯。

### 5. 分离 closeout 语义

closeout 前读取 [references/closeout-handoff.md](references/closeout-handoff.md)。

必须分别输出：

- `round_outcome`：本轮执行是否完成、部分、阻塞、需人或外部等待。
- `case_resolution`：Controller 对 Case 是 unresolved、resolved 或 blocked 的声明及剩余项。
- `project_impact_candidate`：仅在 Case resolved 时提出的显式项目维度变化；没有就用 `none`。
- `case_transition`：Case id、expected `case_updated_at` 与 observed `project_updated_at` revisions、完整 selected gap、planned transition、accepted delta、evidence、unresolved、上述结果。
- `loop_handoff/v2`：下一责任方和桥接方式。

确定性 ledger 可以拒绝强于 Case 实际状态的 resolved 声明。Controller 不因 report 齐全、测试通过或代码存在而静默关闭 Case。

退出条件：形成一个可交给 `arckit-development-ledger` 的 `arckit-case-transition/v3`，或明确不能写回的阻塞原因。

## 人工与 Runtime 等价性

- 当前 Codex Agent 可在同一对话执行 packet；人类可复制 packet/report；Runtime 可自动创建 Worker、收集 report、过 gate 与调用 ledger。
- 对相同 Project/Case facts 和 reports，三种桥接应得到相同的当前 Loop Case/gap、accepted delta、case resolution 与 next responsibility。
- Runtime hard gate 只校验 schema、证据、授权、路径和合法 transition；业务适用性与事实接受由 Controller 声明，最终合法性由 ledger 派生。
- 每次成功 ledger writeback 后重新读取 Case State 再规划下一轮；不得复用上一轮 revision、selected gap 或 controller frame。自动桥接以真实 ledger 进展、`no_progress_limit` 与 `max_auto_rounds` 共同停止。

## 输出

- `controller_frame`
- `execution_plan`：`runtime`、`worker` 或 `none` 三个互斥执行面；Runtime action 只进入 `runtime_actions`，Worker 只进入 `worker_intents`
- `execution_gate` 与 `executor_binding`
- `worker_packets` 与 `report_intake`
- `round_outcome`
- `case_resolution`
- `project_impact_candidate`
- `case_transition`
- `loop_handoff/v2`
- `ledger_handoff`：新建 Case 时由 Runtime 把 `runtime_actions[type=case_control]` 封装后使用 trusted `case_control` entrypoint；推进任一 active Case gap 时使用 trusted `case_transition` entrypoint
