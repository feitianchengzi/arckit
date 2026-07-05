---
name: arckit-turn-adaptation
description: 解析 ArcKit 软件研发会话中的后续消息是否改变当前 workflow frame、目标、事实路由、停止条件、验证策略或 workflow memory 判断。默认由 using-arckit 在后续消息可能产生 frame_delta、artifact_routing_delta 或 workflow_correction_ledger 时路由触发；用户明确点名本 skill、维护本 skill 本身或隔离测试时可直接使用。不用于首轮入口编排，不维护项目账本或稳定事实源。
---

# ArcKit Turn Adaptation

`arckit-turn-adaptation` 是当前研发会话的变更控制 skill。它不推进功能实现，也不写事实源；它判断用户后续一句话改变了哪个协作层级，并输出可交给 `using-arckit`、`arckit-development-ledger` 和 `arckit-workflow-memory` 的结构化 delta。

## 硬约束

- 本 skill 只在已有或正在形成的 ArcKit `workflow_frame` 上工作；首轮软件项目协作入口仍由 `using-arckit` 处理。
- 触发本 skill 的重点是后续消息可能改变 frame、路线、目标、事实路由、暂停/停止、验证策略、确认点、工具边界、术语边界或 workflow memory 判断。
- 后续消息只是在当前 frame 下继续推进时，交回 `using-arckit` 继续协调，不生成额外 turn adaptation 结论。
- 只有 workflow 纠偏信号才能生成 `workflow_correction_ledger`；项目事实纠正、目标变化和普通补充信息不自动成为 workflow signal。
- 一条消息可以同时包含主类型和 secondary signals；只要存在 workflow 纠偏信号，就必须输出 `workflow_correction_ledger`。
- 本 skill 不写 workflow signal、candidate 或 accepted patch；它只把 `workflow_correction_ledger` 交给 `arckit-workflow-memory` 做 signal decision。

## 主流程

### 1. 定位当前 Frame

输入：后续用户消息、当前或最近的 `workflow_frame`、`workflow_resolution`、`project_state_record`、`development_case_record`、已执行动作、已改文件、artifact impact scan、execution record 状态和停止条件。

动作：
- 判断消息是否发生在首轮入口之后。
- 读取当前 frame 的 current_round_goal、current_round_gap、selected_capabilities、artifact_targets、confirmation_points、verification_strategy、stop_conditions 和 pending handoffs。
- 没有可用 frame 时，输出 `handoff_target=using-arckit`，由入口重新建立项目账本和 frame。

退出条件：明确当前消息是否需要 turn adaptation，以及可比较的 frame 基线。

### 2. 判断影响层级

将消息分类为一个主类型，并保留 secondary signals：

- `continue_current_frame`：在现有 frame 内继续推进，不改变目标、路线、事实路由或协作规则。
- `supplemental_context`：补充约束、材料或背景，会改变当前 frame 的 evidence、constraints 或 assumptions。
- `clarification_answer`：回答确认点或解除阻塞，会改变当前 frame 的 confirmation_points 或 blocked 状态。
- `artifact_fact_correction`：纠正产品、交互、视觉、技术、项目账本或 pending 事实，会改变 artifact routing。
- `source_projection_correction`：指出上一轮只更新了下游产物、漏掉上游源事实，或指出某个变更层级被低估，需要重新定位源事实和投影产物。
- `goal_change`：改变最终交付目标、当前轮目标或 case 边界，需要结束、保留或重编 frame。
- `pause_or_stop`：要求暂停、停止、等待或只汇报状态，会改变 stop condition。
- `user_workflow_correction`：纠正流程选择、workflow resolution、复用方式、execution record、验证方式、确认点、工具使用、停止条件、术语边界或记忆判断。

主类型优先级：`pause_or_stop`、`goal_change`、`source_projection_correction`、`user_workflow_correction`、`artifact_fact_correction`、`clarification_answer`、`supplemental_context`、`continue_current_frame`。

退出条件：得到 `turn_type`、`secondary_signals` 和一句分类依据。

### 3. 输出 Frame Delta

动作：
- `continue_current_frame`：输出 `handoff_target=using-arckit`，说明继续原 frame，不需要独立适配。
- `supplemental_context`：输出需要并入 frame 的 constraints、evidence、assumptions 或 open_questions。
- `clarification_answer`：输出解除的 confirmation point、blocked item 和下一步 frame 状态。
- `artifact_fact_correction`：输出 `artifact_routing_delta`，说明应更新 ledger、pending、spec、interaction、visual 或 tech 中的哪一类事实。
- `source_projection_correction`：输出 `artifact_routing_delta.correction_kind=source_projection_mismatch`，列出被用户指出遗漏的源事实、已更新但可能只是投影的产物、需要重开或补写的事实源，以及 case 是否需要重新审计。
- `goal_change`：输出旧 frame 的处理方式：close、supersede、defer 或 keep_as_parallel_case，并交回 `using-arckit` 重编。
- `pause_or_stop`：输出已完成、未完成、需要保存的 ledger 状态和 closeout 要求。
- `user_workflow_correction`：输出 `frame_delta`，并进入 Workflow Correction Ledger。

退出条件：`using-arckit` 能据此继续原 frame、重编 frame、更新账本、路由事实源、停止或进入 workflow memory closeout。

### 4. Workflow Correction Ledger

当 `turn_type=user_workflow_correction`，或 secondary signals 包含 workflow 纠偏时执行。

动作：
- 生成 `workflow_correction_ledger`：
  - `correction_text`：用户原话或忠实摘要。
  - `affected_workflow_area`：`workflow resolution|execution record|verification|compile/test|confirmation|artifact routing|stop condition|tool use|memory closeout|workflow framing|terminology`。
  - `scope_hint`：`current_project|user_global|one_off|unknown`。
  - `changed_frame`：是否改变本轮 workflow frame、workflow resolution、execution record、验证强度、停止条件、工具调用或确认点。
  - `default_signal_decision`：默认 `write_signal`；只有用户明确说一次性或不要记录时才改为 `skip`。
  - `handoff_target`：通常为 `arckit-workflow-memory`，如同时涉及项目事实则另列 ledger 或事实源 skill。

退出条件：ledger 足够让 `arckit-workflow-memory` 不再重新解析原始对话也能做 signal decision。

### 5. 交接

动作：
- 把 `turn_adaptation_decision` 交回 `using-arckit`。
- 需要项目状态、case 或迭代账本更新时，交给 `arckit-development-ledger`。
- 需要稳定事实源更新时，交给对应 `arckit-spec|arckit-interaction|arckit-visual|arckit-tech`。
- 存在 `workflow_correction_ledger` 时，在 final closeout 前交给 `arckit-workflow-memory`。

退出条件：后续 frame、账本更新、事实路由、停止状态和 workflow memory closeout 输入明确。

## 输出

- `turn_type`
- `secondary_signals`
- `turn_classification_reason`
- `turn_adaptation_decision`
- `frame_delta`
- `artifact_routing_delta`
  - 当 `turn_type=source_projection_correction` 时，必须包含 `correction_kind: source_projection_mismatch`、`missing_source_facts`、`projection_artifacts_updated`、`required_reopen_or_update` 和 `handoff_targets`。
- `ledger_delta`
- `workflow_correction_ledger`，仅当存在 workflow 纠偏时输出
- `handoff_targets`
