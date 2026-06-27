---
name: arckit-turn-adaptation
description: 当 ArcKit 软件项目协作任务进行中，用户在首轮目标之后继续补充信息、纠正 agent、改变验证方式、调整停止条件、切换目标、纠正项目事实、要求暂停或追问为什么跳过记忆时使用。它是 turn-level 入口适配 skill，负责判断这条后续消息如何改变当前 workflow frame、artifact routing 或 workflow memory closeout；不用于首轮任务入口编排，也不直接写入 workflow memory、spec、tech、pending 等事实源。
---

# ArcKit Turn Adaptation

本 skill 处理 ArcKit 任务执行中的后续用户消息。它把“补充信息”和“流程纠偏”分开，避免 `using-arckit` 在首轮入口编排之外继续膨胀，也避免把 artifact impact scan 和 workflow memory closeout 混成一个判断。

## 硬约束

- 本 skill 只在已有或正在形成的 ArcKit workflow frame 上工作；首轮软件项目协作入口仍由 `using-arckit` 处理。
- 收到后续用户消息时，先分类 turn 类型，再决定是否重编 workflow frame、更新 artifact routing、生成 `workflow_correction_ledger` 或停止当前任务。
- 只有 workflow 纠偏信号才能生成 `workflow_correction_ledger`；普通补充信息、项目事实纠正和目标切换不要误写成 workflow signal。
- `turn_type` 是主处理类型，不是唯一信号槽；如果一条后续消息同时包含暂停、换目标、事实纠正和 workflow 纠偏，仍必须保留 workflow 纠偏信号并输出 ledger。
- 用户使用“后续/以后/当前项目/不要/只需要/必须/我来处理/为什么没有学习/为什么跳过”等表达，并改变 agent 的流程选择、验证方式、确认点、工具使用或停止条件时，默认判定为 `user_workflow_correction`。
- 项目事实没有变化只影响 spec/tech/interaction/visual 等 artifact 路由，不等于 workflow memory closeout 可以跳过。
- 本 skill 不写 workflow signal；它只把 `workflow_correction_ledger` 交给 `arckit-workflow-memory` 做 signal decision。

## 主流程

### 1. 定位 Turn 上下文

输入：后续用户消息、当前或最近的 `workflow_frame`、已执行动作、已改文件、artifact impact scan 状态、memory overlay 和当前停止条件。

动作：
- 判断这条消息是否发生在首轮目标之后。
- 读取当前 workflow frame 中的 `final_goal`、`current_phase`、`selected_capabilities`、`confirmation_points`、`stop_conditions`、`artifact_targets` 和验证策略。
- 如果没有可用 frame，回退给 `using-arckit` 重新建立入口 frame。

退出条件：明确本轮是 turn adaptation，或交回 `using-arckit` 做首轮入口编排。

### 2. 分类 Turn 类型

动作：
- 将后续消息分类为以下一种主类型：
  - `supplemental_context`：补充材料、约束或背景，但不纠正 agent 流程。
  - `user_workflow_correction`：纠正流程选择、验证方式、确认点、工具使用、停止条件或记忆判断。
  - `goal_change`：改变最终交付目标，可能需要结束旧 frame 并建立新 frame。
  - `artifact_fact_correction`：纠正产品、技术、交互、视觉、治理或 pending 事实。
  - `pause_or_stop`：要求暂停、停止、稍等或不要继续执行。
  - `clarification_answer`：回答 agent 之前提出的问题。
- 如同时命中多个类型，`turn_type` 优先级为：`pause_or_stop`、`goal_change`、`user_workflow_correction`、`artifact_fact_correction`、`clarification_answer`、`supplemental_context`。
- 单独记录 `secondary_signals`。只要 `secondary_signals` 或 `turn_type` 中包含 workflow 纠偏，后续必须进入 Workflow Correction Ledger 门禁。

退出条件：得到 `turn_type`、`secondary_signals` 和一句分类依据。

### 3. 产出适配动作

动作：
- `supplemental_context`：更新当前 frame 的 constraints、evidence 或 assumptions；通常不写 workflow signal。
- `clarification_answer`：解除对应阻塞或确认点；继续原 frame 或按答案重编。
- `artifact_fact_correction`：更新 artifact impact scan，把稳定事实交给对应结果型 skill，把未决内容交给 `arckit-pending`。
- `goal_change`：说明旧 frame 是否结束、保留或废弃，并交回 `using-arckit` 编译新 frame。
- `pause_or_stop`：停止当前执行，报告已完成动作、未完成动作和必要 closeout。
- `user_workflow_correction`：生成 `workflow_correction_ledger`，并要求 workflow frame 重新编译或调整停止条件。
- 当 `turn_type` 不是 `user_workflow_correction`、但 `secondary_signals` 包含 workflow 纠偏时，先按主类型处理停止、目标或事实路由，再生成 `workflow_correction_ledger` 交给 workflow memory closeout。

退出条件：输出 `turn_adaptation_decision`，说明下一步进入哪个 skill 或继续哪个 frame。

### 4. Workflow Correction Ledger

当 `turn_type=user_workflow_correction`，或 `secondary_signals` 包含 workflow 纠偏时执行。

动作：
- 生成 `workflow_correction_ledger`：
  - `correction_text`：用户原话或忠实摘要。
  - `affected_workflow_area`：`verification|compile/test|confirmation|artifact routing|stop condition|tool use|memory closeout|workflow framing`。
  - `scope_hint`：`current_project|user_global|one_off|unknown`。
  - `changed_frame`：是否改变本轮 workflow frame、验证强度、停止条件、工具调用或确认点。
  - `default_signal_decision`：默认 `write_signal`；只有用户明确说一次性或不要记录时才改为 `skip`。
  - `handoff_target`：通常为 `arckit-workflow-memory`，如同时涉及项目事实则另列结果型 skill。
- 典型例子：用户说“当前项目写完代码后，只需要自查是否有错误、多余、遗漏，不需要编译，我人工编译”时，`affected_workflow_area=verification|compile/test|stop condition`，`scope_hint=current_project`，`changed_frame=true`，`default_signal_decision=write_signal`。

退出条件：ledger 足够让 `arckit-workflow-memory` 不再重新解析原始对话也能做 signal decision。

### 5. Closeout 交接

动作：
- 把 `turn_adaptation_decision` 交回当前 workflow frame。
- 如果存在 `workflow_correction_ledger`，在 final closeout 前交给 `arckit-workflow-memory`。
- 如果 artifact impact scan 全部 skipped，但存在 workflow correction，仍必须进入 workflow memory closeout。

退出条件：后续 skill、artifact 路由和 workflow memory closeout 输入明确。

## 输出

本 skill 输出：

- `turn_type`
- `secondary_signals`
- `turn_classification_reason`
- `turn_adaptation_decision`
- `frame_delta`
- `artifact_routing_delta`
- `workflow_correction_ledger`，仅当存在 workflow 纠偏时输出
- `handoff_targets`

当存在 workflow 纠偏时，最终 closeout 必须包含：

```yaml
workflow_memory_closeout:
  correction_detected: yes
  signal_decision: write_signal | update_candidate_only | skip
  skip_reason: ""
```

如果 `correction_detected=yes` 且 `signal_decision=skip`，必须解释为什么它不是可复用纠偏，或说明它被哪个 accepted workflow patch 完全覆盖。
