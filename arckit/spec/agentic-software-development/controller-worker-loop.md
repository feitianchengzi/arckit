# Controller Worker Loop

## 定位

Controller Worker Loop 定义没有 Desktop 或自动化平台时，人类、Controller Agent 和 Worker Agent 如何围绕同一轮软件研发任务协作；同时定义 Desktop 后续如何把这个人工过程自动化。

该协议不把入口能力视为执行器。入口能力只负责理解输入、恢复状态、生成执行包、接收 worker report、判断收口和输出下一轮 handoff。真正执行由被显式绑定的 executor 完成。

Controller Worker Loop 是 Project State 通过 Case 和 Loop 被持续推进的对话形态。Controller 先恢复 Project State 和 active case，再判断本轮 loop 是否需要执行、等待、验证、请求人类判断、接收外部反馈或关闭 case。

该协议不把 loop 等同于 Agent 内部工具调用循环。Loop 是一次业务推进循环，必须说明本轮对 case 和 Project State 的影响。

## 角色

| 角色 | 职责 | 不负责 |
|---|---|---|
| Human Runtime | 在多个 Agent 对话之间搬运执行包、报告、补充和纠错，并决定是否授权执行 | 不替代 Controller 判断旧执行包是否失效 |
| Controller Agent | 使用 Arckit 状态生成 controller frame、worker packets、report intake rules、closeout rules 和 next prompt | 不直接修改项目、不直接执行 worker packet、不静默关闭 case |
| Worker Agent | 按 worker packet 执行一个有边界的任务并返回结构化 report | 不自行扩大范围、不决定项目方向、不完成整轮 closeout |
| Desktop Runtime | 自动化 Human Runtime 的搬运、worker 启动、report 收集、merge gate、暂停和继续 | 不改变 Controller Worker Loop 的语义 |

## 人工作业形态

没有 Desktop 时，人类固定保留一个 Controller 对话，并按需打开多个 Worker 对话。

Controller 对话只处理项目 loop 控制：

- 读取或初始化项目状态。
- 创建、选择或恢复当前 case。
- 识别本轮输入和上一轮 handoff 的关系。
- 生成本轮 controller frame。
- 生成一个或多个 worker packet。
- 等待人类把 worker report 带回。
- 审核 report 是否满足 packet 和 closeout rules。
- 输出本轮状态和下一轮 prompt。

Worker 对话只处理 packet：

- 读取 packet 中列出的上下文。
- 执行允许范围内的工作。
- 不修改 packet 外的目标和项目方向。
- 返回 `worker_report`。

## 首轮输入

当人类在 Controller 对话中发起项目任务时，Controller 生成执行包而不是直接执行。

执行包至少包含：

```yaml
controller_frame:
  case_id: ""
  turn_delta: first_turn | new_case | resume_next_prompt | supplement | correction | goal_change | pause_or_stop
  round_goal: ""
  round_status: planning | waiting_worker | reviewing_worker | ready_to_close | done | blocked
  source_projection_check: {}

execution_gate:
  status: pending | authorized | blocked | not_required
  required_decision: ""
  allowed_executors:
    - human_runtime
    - desktop_runtime
    - external_agent
  executor_binding_required: true

worker_packets:
  - worker_id: ""
    role: product | tech | implementation | verification | diagnosis | closeout
    task: ""
    context_refs: []
    allowed_actions: []
    forbidden_actions: []
    allowed_skills: []
    expected_report_schema: worker_report

report_intake_rules:
  accept_when: []
  reject_when: []
  needs_revision_when: []

closeout_rules:
  done_when: []
  continue_when: []
  needs_human_when: []
  blocked_when: []

next_prompt:
  on_done: ""
  on_continue: ""
  on_correction: ""
```

Controller 面向人类的输出必须能直接复制到 Worker 对话，且必须说明当前是否等待执行授权或等待 worker report。

## 执行授权

执行必须经过 execution gate。

默认状态是 `execution_gate.status=pending`。只有在以下情况下可以进入执行：

- 人类明确说执行、由你执行、开始实施、继续执行，或同义表达。
- Desktop 用户点击 Run 或当前会话配置了明确 auto-run policy。
- 外部平台传入已经授权的 execution packet。

如果只是生成方案、拆解任务或讨论方向，Controller 不得把当前 Agent 自动绑定为 executor。

## Worker Report

Worker 完成任务后返回结构化 report。

```yaml
worker_report:
  schema_version: arckit-worker-report/v1
  worker_id: ""
  role: ""
  status: done | partial | blocked | failed | invalid
  summary: ""
  findings: []
  changed_files: []
  evidence: []
  risks: []
  unknowns: []
  recommended_next: ""
  requires_controller_decision: false
```

Controller 接收 report 时必须判断：

- report 是否匹配 worker packet。
- 是否完成 packet 的任务。
- 是否越权扩大范围。
- 是否产生稳定事实、实现证据、pending 或新的 handoff。
- 是否需要补充 worker。
- 是否产生可验证的 case state 或 Project State 影响。
- 当前 round 是否可 closeout。

## 补充与纠错

人类补充或纠错时应先回到 Controller 对话，而不是直接分发给所有 Worker。

Controller 根据输入判断：

- `supplement`：补充信息不必然使当前 packet 失效，但可能改变后续 worker 的上下文。
- `correction`：纠正事实或误解，需要定位受影响的事实、report 或 packet。
- `goal_change`：改变目标，可能需要暂停旧 case、新开 case 或要求人类确认。
- `pause_or_stop`：暂停当前执行包并输出可恢复 handoff。

当旧 packet 失效时，Controller 必须明确通知人类停止使用旧 packet，并生成新的 packet 或等待确认。

## 单轮完成判断

一轮完成不等于某个 Agent 停止输出。Controller 只有在以下条件满足时才能标记 `done`：

- 本轮 `round_goal` 已满足。
- 必需 worker report 均已接收并通过 intake rules。
- 产物、文件变更、事实更新或 handoff 可定位。
- 验证证据足够，或未验证部分已明确记录。
- source fact、projection artifact、implementation evidence 和 pending 已分清。
- active case 或 loop handoff 已更新到可恢复状态。
- 本轮对 case 和 Project State 的影响已经说明；无状态变化时已说明 no-change closure、等待、阻塞或继续原因。

否则只能输出 `continue`、`needs_human`、`blocked` 或 `external_wait`。

## 下一轮

每轮 closeout 必须给出 `next_prompt`。人类可以直接把 `next_prompt` 发回 Controller 对话继续下一轮。

当下一步仍是 Agent 工作但没有 Desktop 自动桥时，状态是：

```yaml
next_responsibility: agent
trigger_mode: manual_bridge
```

这表示人类只负责手动触发下一轮，不表示人类接手项目判断。

## Desktop 自动化

Desktop 自动化的是 Human Runtime 的动作：

- 主 Chat 对应 Controller 对话。
- Worker 会话对应多个 Codex app-server session。
- Run 按钮对应 execution gate 授权。
- Stop 对应 `pause_or_stop`。
- Continue 对应使用 `loop_handoff.next_prompt`。
- 用户补充对应 `supplement`。
- 用户纠错对应 `correction` 或 `goal_change`。
- 右侧状态展示 controller frame、execution gate、executor binding、worker packets、worker reports、merge gate 和 next prompt。

Desktop 不改变 Controller Worker Loop。它只减少人类复制 packet、收集 report 和判断 gate 的操作成本。

## 动态 Controller Loop

Runtime 不固定触发一组 worker。每轮必须先由 Controller 根据当前项目状态、active case、iteration state、用户输入和上一轮 handoff 生成动态 route plan，再按 route plan 派发最小必要 worker。

动态 loop 的标准顺序是：

1. 输入分析：识别用户输入是新任务、继续、补充、纠错、暂停、恢复、report intake、状态查询还是目标变更。
2. 状态恢复：读取或初始化 project state、active case、iteration state、source fact indexes、pending 和上一轮 loop handoff。
3. Gap 选择：找出当前最需要推进的状态 gap，并确认本轮目标。
4. Route plan：判断本轮是 source-fact establishment、route review、implementation execution、verification、external wait、human gate 还是 closeout。
5. Execution gate：如果需要执行，确认是否已授权 executor；未授权时只输出 packet preview。
6. Worker dispatch：只启动 route plan 需要的 worker，不启动与当前 gap 无关的 worker。
7. Report intake：审核 worker report 是否匹配 packet、是否越权、是否有证据、是否需要补 worker 或 Controller 决策。
8. Verification/closeout：验证本轮是否真的推进了目标状态，并判断 `done`、`continue`、`needs_human`、`blocked` 或 `external_wait`。
9. Case impact decision：判断本轮对 active case 和 Project State 的影响，区分 state delta、pending-only、no-change closure、external wait、human gate 和 blocked。
10. Ledger writeback：只有在 runtime result 通过 closeout 和 gate 后，才写回 project、iteration、case 和 runtime execution record。
11. 下一轮推荐：如果 iteration 仍未满足，输出下一轮 packet 或 next prompt；如果 iteration 满足，根据 project state 推荐下一轮 iteration 目标。

空项目首轮必须优先进入 source-fact establishment，而不是 implementation execution。首轮可以写入最小稳定产品意图、行为事实、未确认问题和恢复 handoff；不能因为用户输入包含“开发”或“实现”就直接派发 implementation worker。

实现 worker 只有在以下条件满足时才可派发：

- 目标状态不再是 `unknown`，且本轮 gap 指向 implementation coverage、明确的实现边界、诊断修复或已确认的 implementation handoff。
- 所需 source facts、pending 边界和验证口径足以避免 worker 猜测产品行为、运行表面或验收标准。
- execution gate 已授权并绑定 executor。

source-fact worker 负责建立或更新稳定事实源，并把未确认内容路由到 pending。它不实现产品代码、不直接写 ledger、不关闭 case、不决定人类 gate。

verification worker 不是每轮都必须出现。只有本轮产生了可验证事实源变更、实现变更、诊断结论、handoff 或状态写回准备时才需要派发。没有执行产物时，verification worker 不应只做“没有东西可验”的空审计。

closeout controller 也不替代 ledger writeback。它只判断本轮 runtime result 是否可关闭、是否可继续、是否需要人类、是否阻塞或是否等待外部系统。真正的 project、iteration、case 状态更新由 ledger writeback 在 gate 通过后完成。

Case 关闭必须产生可解释的状态影响。该影响可以是产品、技术、实现、验证、pending 或工作方式上的 Project State delta，也可以是明确的 no-change closure。No-change closure 只在事项重复、无效、过期、不再需要、合并、放弃或转移到外部责任方时成立。

外部反馈不直接进入 Project State。Controller 收到外部反馈时，先把它归类为 intake、pending 或 evaluation sample；只有可行动并需要持续推进的反馈才创建或更新 case。

`requires_main_agent_decision` 和 `human_decision_required` 是不同状态。前者表示 Controller 需要继续合并报告、修订 packet 或生成下一轮；后者表示需要用户做授权、取舍、风险接受、审美或发布责任判断。Runtime 不得把所有 Controller 决策都升级成人类 gate。

## Desktop Runtime 状态机

Desktop Runtime 状态机覆盖从 packet preview 到 ledger writeback 的完整业务 loop。状态恢复不穷举业务任务类型。业务下一步可能是补充 worker、修订 packet、等待外部结果、请求人类判断或关闭 case，这些路径由 Controller 在恢复上下文后判断。

Desktop 只穷举运行时控制态。控制态是 UI 可稳定恢复的有限集合，来自最新 run、activity、runtime result、merge result、loop handoff、report intake、gate result、ledger write result 和项目状态。

恢复控制态包括：

- `no_context`：没有选中项目、chat 或可恢复状态。
- `running`：最新 run 仍在执行。
- `interrupted_pending_controller_event`：运行被人类打断，且存在尚未交给 Controller 处理的输入、纠错或暂停意图。
- `packet_pending_authorization`：已有 preview packet，`execution_gate.status=pending`，且存在 worker packets。
- `waiting_worker_reports`：已有 worker packets，但必需 worker reports 缺失，且触发方式是人工桥或外部 worker。
- `reviewing_reports`：已有 worker reports，但 report intake 仍需要审核、退回、补 worker 或合并判断。
- `human_gate_required`：`human_decision_required=true`、`next_responsibility=human` 或 `trigger_mode=user_decision`。
- `agent_resumable`：`agent_continuation_available=true` 且存在 `next_prompt`，并且没有 human gate。
- `external_wait`：`next_responsibility=external` 或 `trigger_mode=external_wait`。
- `blocked`：handoff 或 merge gate 标记为 blocked。
- `failed_or_invalid`：run 失败、runtime result 无效或无法解析。
- `ledger_writeback_ready`：runtime result 已通过 closeout，`round_result=done`，但尚未写回 ledger。
- `ledger_writeback_blocked`：runtime result 已生成，但 gate result 阻止自动 ledger writeback。
- `ledger_written`：ledger writeback 已成功写入 project、case、iteration 或 runtime execution record，下一轮可以读取新的项目状态。

Desktop 主动作只表达控制态，不表达具体业务决策：

- `packet_pending_authorization` 显示 Run Packet。
- `human_gate_required` 显示 Respond To Gate。
- `agent_resumable` 显示 Resume。
- `external_wait` 显示 Resume With Update。
- `blocked` 显示 Resolve Blocker。
- `failed_or_invalid` 显示 Diagnose。
- `ledger_writeback_ready` 显示 Write Ledger。
- `ledger_writeback_blocked` 显示 Resolve Gate。
- `ledger_written` 显示 Start Next Round。

`packet_pending_authorization` 的 Run Packet 动作授权当前 packet 并绑定 Desktop Runtime 为 executor。`ledger_writeback_ready` 的 Write Ledger 动作运行 gate 和 ledger writeback；写入成功后进入 `ledger_written`。除此之外，点击主动作时 Desktop 不直接决定下一轮要执行的业务路径。Desktop 生成一个 `operator_event`，包含恢复控制态、最新 run id、loop handoff、report intake、worker report 摘要、gate result、ledger write result、用户输入和触发动作，然后启动 Controller run。Controller 根据 `operator_event`、项目状态和事实源判断下一轮应该 revise packet、authorize execution、补 worker、请求人类决策、等待外部系统、诊断失败或 closeout。

当用户在输入框中补充内容时，Desktop 把该内容并入 `operator_event.user_input`，由 Controller 判断它是 supplement、correction、goal_change、report_intake、status_query 还是新的 case。Desktop 不在 UI 层自行判断业务意图。

当 runtime result 的 `round_result=done` 时，Desktop 不直接进入下一轮。系统必须先完成 ledger writeback，或明确展示 gate 阻塞原因。只有 `ledger_written` 状态可以显示 Start Next Round，因为下一轮选择依赖已经更新的 project state、case state 和 iteration state。

## 验收口径

该协议满足规格时，系统表现为：

- 入口能力不会默认把自己变成 executor。
- 人类能看懂当前是 planning、waiting worker、reviewing worker、ready to close、done 还是 blocked。
- 人类能复制 worker packet 到其他 Agent 对话执行。
- Controller 能接收 worker report 并判断旧 packet 是否仍有效。
- Closeout 能清楚说明本轮是否完成、为什么完成或为什么不能完成。
- Closeout 能清楚说明本轮对 case 和 Project State 的影响，或说明 no-change closure、pending-only、external wait、human gate、blocked 的原因。
- 下一轮 prompt 能让 Controller 对话从上一轮 handoff 恢复。
- Desktop 能把同一套人工流程自动化，而不是另起一套执行语义。
- Desktop 重启后能从最新 run 派生有限控制态，并通过 operator event 交给 Controller 判断具体下一步，而不是靠 UI 层不断补业务 if。
- Desktop 在 runtime result 完成后区分 execution done、ledger writeback ready、ledger writeback blocked 和 ledger written，避免下一轮读取旧 project state。
