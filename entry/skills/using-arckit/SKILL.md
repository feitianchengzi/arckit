---
name: using-arckit
description: Arckit 项目对话 Controller skill。用于把真实软件项目中的一次用户输入转成可执行但不自动执行的 controller frame、execution gate、worker packets、report intake rules、closeout rules 和 loop handoff。适用于新建/继续/补充/纠错/暂停/恢复项目任务，以及接收 worker report 后判断本轮是否 done、continue、needs_human、blocked 或 external_wait。
---

# Using Arckit

`using-arckit` 把真实软件项目中的一次用户输入整理成可授权、可分发、可观察、可回收、可继续的软件研发 round。

```text
这次项目对话输入如何变成一个可授权、可分发、可观察、可回收、可继续的软件研发 round？
```

它产出 controller frame、execution gate、worker packets、report intake rules、closeout rules 和 loop handoff，供当前对话、人工分发或外部执行环境继续推进。

## 触发时机

当用户输入会影响真实软件项目的状态、事实、执行包、worker report、closeout 或 handoff 时触发。

应该触发：

- 新建、继续或恢复一个项目任务。
- 要求把一个想法、需求、bug、实现、验证、重构或发布事项推进为可执行 round。
- 用户说继续、暂停、恢复、补充、纠错、目标变更或“做到哪了”。
- 用户带回一个或多个 worker report，需要判断是否接受、退回、补 worker 或 closeout。
- 用户反馈 Arckit loop、worker packet、report intake 或 skill 边界不符合预期。
- 已处在 Arckit managed project chat 中，且输入影响下一步行动或项目状态。

不应该触发：

- 与项目状态无关的普通问答。
- 单段代码或单个概念的一次性解释。
- 纯聊天。
- 用户明确说不用 Arckit。
- Worker Agent 已收到具体 worker packet，只需要执行该 packet。

## Controller 流程

每次触发都按以下顺序处理：

1. 恢复上下文：读取 `AGENTS.md`、`arckit/project/state.record.json`、`arckit/project/STATE.md`、active case、iteration state、上一轮 `loop_handoff` 和相关事实源；缺失状态必须显式记录。
2. 判断 `turn_delta`：首轮、新 case、继续、补充、纠错、目标变化、暂停、恢复、report intake 或状态查询。
3. 分析当前状态和候选 gap：由 Controller 基于用户输入、项目状态、证据和约束选择本轮目标；不要让 Runtime 或本 skill 预设固定路线。
4. 生成 `controller_frame`：说明当前 case、本轮目标、round 状态、事实边界和旧 packet 是否仍有效。
5. 生成动态 `route_plan`：只选择本轮最小必要 worker，不把 reader、route、implementation、verification、closeout 当作固定流水线。
6. 生成 `execution_gate`：默认 pending；只有输入或运行环境明确授权时才 authorized。
7. 生成 `worker_packets`：每个 packet 只交给一个 Worker 执行一个有边界的任务。
8. 生成 `report_intake_rules`：定义什么 report 可接受、何时退回、何时需要补 worker、何时要 Controller 或人类判断。
9. 生成 `closeout_rules`：定义本轮 done、continue、needs_human、blocked、external_wait 的判断条件。
10. 接收 worker report 时，按 intake rules 审核 report、更新 controller frame，并决定是否 ready_to_close。
11. closeout：输出本轮状态、证据、source/projection 影响、下一步责任、trigger mode 和 `next_prompt`。

## 动态路由规则

Controller 不默认派发固定 worker 组合，不预设 route mode，也不要求固定 role 名称。每轮只在稳定 `worker_type` 集合内选择必要能力类型，再生成能推进当前目标的最小 packet 集，并解释 route、worker_type、role、skill 绑定、证据要求和停止条件。

- 空项目首轮也不使用固定默认 route；Controller 必须基于用户输入和项目证据判断是澄清、建模、实现、验证、等待人类、等待外部还是其他路线。
- 用户输入包含“开发、实现、修复、编码”不自动等于可实现，也不自动禁止实现；Controller 必须说明判断依据、风险和验证口径。
- 如果需要能力或 skill，Controller 必须基于 Capability Registry 为 packet 绑定 `allowed_skills`；Runtime 可以把这些允许的 skill 触发名注入给对应 Worker，但不能写死每轮 skill 序列或业务路线。
- verification、closeout、handoff 是否需要独立 worker，由 Controller 根据本轮风险、证据和执行边界判断。

`requires_main_agent_decision` 表示 Controller 需要继续合并、修订或生成下一轮；`human_decision_required` 只用于真正需要用户授权、取舍、风险接受、审美或发布责任的情况。

## 执行门禁

`using-arckit` 不自动执行。默认：

```yaml
execution_gate:
  status: pending
  executor_binding_required: true
  bound_executor: null
```

以下情况可以授权执行：

- 用户明确说执行、开始实施、由你执行、继续执行或同义表达。
- 运行环境传入明确授权，或会话配置了明确 auto-run policy。
- 外部平台传入已授权 execution packet。

授权后必须绑定 executor：

```yaml
executor_binding:
  executor: human_runtime | runtime_executor | current_agent | external_agent | none
  authorization_source: user_message | runtime_authorization | auto_run_policy | external_platform | none
  reason: ""
```

普通 Chat 中，当前 Agent 只有在用户明确授权时才能临时兼任 executor。否则它只输出 packet，等待人类分发或确认。

## 输出契约

最小输出是 `round_execution_packet`：

```yaml
  round_execution_packet:
  controller_frame:
    case_id: ""
    turn_delta:
      relation_to_previous_loop: first_turn | new_case | resume_next_prompt | continue_case | supplement | correction | goal_change | pause_or_stop | report_intake | status_query
      reason: ""
      packet_effect: keep | revise | replace | invalidate | close | none
    round_goal: ""
    round_status: planning | waiting_authorization | waiting_worker | reviewing_worker | ready_to_close | done | blocked
    old_packet_valid: true
    source_projection_check:
      source_facts_changed: []
      projection_artifacts_changed: []
      implementation_evidence: []
      pending_items: []
      source_unknown: false

  execution_gate:
    status: pending | authorized | blocked | not_required
    required_decision: ""
    allowed_executors:
      - human_runtime
      - runtime_executor
      - current_agent
      - external_agent
    executor_binding_required: true

  route_plan:
    mode: "<agent-defined route mode>"
    selected_worker_types: []
    selected_roles: []
    suppressed_roles: []
    selected_gap: {}
    reason: ""

  executor_binding:
    executor: null
    authorization_source: none
    reason: ""

  worker_packets:
    - worker_id: ""
      worker_type: product | tech | implementation | verification | diagnosis | closeout
      role: "<agent-defined worker role>"
      task: ""
      context_refs: []
      allowed_actions: []
      forbidden_actions: []
      allowed_skills: []
      expected_report_schema: arckit-worker-report/v1

  report_intake_rules:
    accept_when: []
    reject_when: []
    needs_revision_when: []
    needs_more_workers_when: []

  closeout_rules:
    done_when: []
    continue_when: []
    needs_human_when: []
    blocked_when: []
    external_wait_when: []

  loop_handoff:
    status: continue | done | needs_human | blocked | deferred
    next_responsibility: agent | human | external | none
    agent_continuation_available: true
    human_decision_required: false
    trigger_mode: manual_bridge | auto_bridge | user_decision | external_wait | none
    next_prompt: ""

```

面向用户的输出要短，但必须说明：

- 当前 round 状态。
- 是否等待授权、等待 worker、正在审核 report 或已完成。
- 可复制给 Worker 的 packet。
- 如果本轮已 closeout，下一轮 `next_prompt`。

## Worker Packet 规则

Worker packet 必须能被复制到另一个 Agent 对话中独立执行。

Worker packet 必须说明：

- worker 身份和任务。
- 目标项目、case、round goal。
- 必读上下文。
- 允许修改范围。
- 禁止动作。
- 停止条件。
- report schema。

Worker 不允许：

- 自行扩大目标。
- 自行决定项目方向。
- 关闭 case。
- 把候选判断直接写入稳定事实。
- 跳过 report schema。

## Worker Report Intake

接收 worker report 时，Controller 必须判断：

- report 是否匹配 packet。
- 任务是否完成。
- 是否越权。
- 是否有 evidence。
- 是否有 risks 或 unknowns。
- 是否需要退回、补 worker、人类判断或 closeout。

推荐 report 形状：

```yaml
worker_report:
  schema_version: arckit-worker-report/v1
  task_id: ""
  worker_type: product | tech | implementation | verification | diagnosis | closeout
  role: ""
  status: completed | partial | blocked | failed | invalid
  summary: ""
  findings: []
  evidence: []
  changes: []
  artifact_impacts: []
  risks: []
  unknowns: []
  recommendation: ""
  requires_main_agent_decision: false
  requires_human_decision: false
```

## 补充、纠错和目标变化

用户补充或纠错时，应回到 Controller 对话处理。

- `supplement`：补充上下文，可能修订当前 packet。
- `correction`：纠正事实或误解，必须定位受影响的事实、packet 或 report。
- `goal_change`：改变目标，可能使旧 packet 失效、暂停旧 case 或新开 case。
- `pause_or_stop`：停止分发旧 packet，并输出可恢复 handoff。

如果旧 packet 失效，必须明确输出：

```text
旧 worker packet 已失效，请停止使用。
```

然后生成新 packet 或等待用户确认。

## Closeout 判断

本轮只有在以下条件满足时才能 `done`：

- `round_goal` 已完成。
- 必需 worker report 已接收并通过 intake rules。
- 产物、文件变更、事实更新或 handoff 可定位。
- 验证证据足够；未验证部分已明确记录。
- source fact、projection artifact、implementation evidence 和 pending 已分清。
- active case 或 loop handoff 已更新到可恢复状态。

否则：

- `continue`：下一步仍由 Agent 或 Runtime 继续。
- `needs_human`：需要人类判断、授权、审美、商业取舍、风险接受或发布责任。
- `blocked`：缺状态、权限、工具、依赖或有效 report。
- `external_wait`：等待外部系统或系统外操作。

## 能力边界

- `using-arckit` 负责 Controller 协议：任务处境、turn delta、controller frame、execution gate、worker packets、report intake、closeout 和 loop handoff。
- `using-arckit` 不硬编码每轮业务路线、固定 worker 顺序或固定 skill 序列；它要求 Controller 基于 Capability Registry、状态 gap 和 packet 边界动态选择 `worker_type`、`role` 与 `allowed_skills`。
- 执行环境可以自动分发 packet、收集 report、展示状态和执行 gate，但不改变 Controller 协议。
- 没有自动执行环境时，人类搬运 packet/report 是正常流程。

## References

- `references/controller-conversation-protocol.md`
- `references/worker-packet-and-report.md`
- `references/closeout-handoff.md`
