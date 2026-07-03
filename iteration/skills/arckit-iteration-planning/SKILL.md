---
name: arckit-iteration-planning
description: 维护项目高维迭代规划、阶段目标、迭代边界和归属判断规则。默认由 using-arckit 在判断本轮需要区分当前/下一轮/后续迭代边界时路由触发；用户明确点名本 skill、维护本 skill 本身或隔离测试时可直接使用。不拆执行任务，不替代实现、debug、spec、设计或 project governance。
---

# Arckit Iteration Planning

本 skill 维护高维迭代地图。它回答“不同迭代各自解决什么问题、如何判断一个反馈/需求/问题属于哪一轮、什么暂不纳入”，不维护具体任务表，不执行具体问题，也不自动写入 `arckit-project-governance-workflow`。

默认产物独立保存到：

```text
arckit/planning/iteration-map.md
```

## 边界

- 适合：建立或更新项目的迭代地图、阶段主题、迭代目标、范围边界和归属规则。
- 适合：说明当前迭代、下一迭代、后续迭代分别关注什么，以及如何判断反馈应归属哪一轮。
- 适合：把模糊目标补成高维迭代说明，例如“本轮验证核心闭环”“下一轮补体验和效率”“后续再做自动化能力”。
- 适合：为反馈、需求、问题清单或 governance 候选任务提供归属依据。
- 不适合：拆当前执行任务、写 owner、安排日程、开始实现或 debug。
- 不适合：维护团队职责。职责上下文交给 `arckit-team-responsibility`。
- 不适合：自动并入 `arckit-project-governance-workflow`；如需并入，输出候选影响，由用户或后续流程决定。

## 工作流

1. 查找已有项目计划、产品定义、反馈记录、团队约束和用户当前说明。
2. 提取或补齐迭代地图：当前迭代、下一迭代、后续迭代、暂不纳入。
3. 为每个迭代写清：核心意图、纳入边界、排除边界、成功信号、典型输入类型。
4. 定义归属规则：什么反馈/需求/问题应进入当前、下一轮、后续、pending 或 record only。
5. 对不确定归属输出 `required_user_decision`，不要把 proposed 迭代地图写成已确认承诺。

## 归属规则

候选项归入当前迭代通常需要满足至少一条：

- 直接支撑当前迭代的核心意图和成功信号。
- 属于当前迭代明确纳入边界。
- 严重到阻塞当前验证、真实使用、数据正确性、安全或交付判断。
- 是当前迭代反馈暴露的核心风险，必须解决后才能判断本轮是否成立。

候选项通常进入下一轮或后续：

- 有价值但不阻塞当前迭代判断。
- 属于体验打磨、效率提升、扩展能力或自动化能力。
- 需要先补定义、调研、设计或技术判断。
- 和当前迭代目标不同，但与下一阶段方向匹配。

## 输出格式

```yaml
iteration_map:
  source_refs: []
  artifact_path: arckit/planning/iteration-map.md
  status: confirmed | proposed
  iterations:
    - iteration_id: ""
      label: current | next | later | not_now
      intent: ""
      include_boundary: []
      exclude_boundary: []
      success_signals: []
      typical_inputs: []
      notes: []
  assignment_rules:
    current: []
    next: []
    later: []
    pending: []
    record_only: []
  open_questions: []
```

候选项归属判断：

```yaml
iteration_assignment:
  item_id: ""
  assigned_to: current | next | later | pending | record_only | needs_decision
  reason: ""
  iteration_fit: ""
  severity_or_evidence_basis: ""
  boundary_conflicts: []
  required_user_decision: ""
```
