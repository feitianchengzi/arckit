---
name: arckit-refactor-strategy
description: 为代码结构治理、模块拆分、依赖整理、状态管理收敛或技术债处理形成行为不变、分阶段、可验证的重构策略。默认由 using-arckit 在用户明确要求重构，或 debug/implementation 证据显示需要结构性治理且直接修改风险较高时路由触发；用户明确点名本 skill、维护本 skill 本身或隔离测试时可直接使用。不用于新功能设计、架构拍板、产品取舍或无证据的大重写。
---

# ArcKit Refactor Strategy

本 skill 负责把重构从“顺手改一片”变成可控的工程策略。它不替代 `arckit-architecture-decision` 的重大技术取舍，不替代 coding agent 的具体代码修改；它定义重构目标、边界、阶段、验证和停止条件。

## 硬约束

- 重构默认必须保持外部行为不变。任何行为变化都必须显式列为 separate change，并回到对应 spec/interaction/tech 或用户确认。
- 不在用户未要求、证据不足或问题可用证据指向的局部修复解决时推动大重构。
- 不把“代码看起来不优雅”作为充分理由；需要维护成本、重复逻辑、边界污染、测试困难、性能风险、诊断证据或实现交接风险作为依据。
- 每个阶段都必须有验证方式和停止条件。
- 发现需要架构方向选择时，输出 handoff 给 `arckit-architecture-decision`，不在本 skill 内拍板。

## 主流程

### 1. 判断是否需要重构策略

输入：用户请求、代码结构线索、debug 证据、implementation handoff、测试结果、project/case 状态。

动作：
- 区分 bug 修复、正向开发、局部整理、系统性重构和架构决策。
- 判断是否存在足够重构依据。
- 若证据指向的局部修复即可解决当前问题，建议回到 `arckit-debug-diagnosis` 或实现 adapter。

退出条件：确认进入重构策略，或说明为什么不进入。

### 2. 固定行为边界

动作：
- 写清需要保持不变的用户可见行为、API、数据格式、权限、错误语义、性能约束和兼容性。
- 标记允许改变的内部结构和禁止触碰的区域。
- 识别缺少回归证据的高风险路径。

退出条件：重构前的行为护栏清楚。

### 3. 拆分阶段

动作：
- 将重构拆成可独立验证的阶段，例如提取边界、补测试、移动代码、替换调用、清理旧路径。
- 每阶段说明目标、输入、允许修改范围、验证方式、回滚或停止条件。
- 避免把功能新增、视觉调整、依赖升级和重构混入同一阶段，除非有明确理由和验证边界。

退出条件：阶段计划能被 coding agent 或人类逐段执行。

### 4. 生成重构 handoff

动作：
- 输出 `refactor_strategy_handoff`。
- 标记是否需要先补测试、先做 architecture decision、先做人类确认或先冻结功能变化。
- 写清完成后需要回写的 case、tech、pending 或 workflow memory。

退出条件：接收方能按阶段执行、验证和停止。

## 输出格式

```yaml
refactor_strategy_handoff:
  status: ready | blocked | not_recommended
  reason: ""
  refactor_goal: ""
  evidence:
    - source: ""
      summary: ""
  behavior_must_remain:
    - ""
  allowed_change_scope: []
  forbidden_change_scope: []
  risks: []
  phases:
    - name: ""
      goal: ""
      allowed_changes: []
      verification: []
      stop_conditions: []
  prerequisite_handoffs:
    - arckit-architecture-decision
    - arckit-debug-diagnosis
    - arckit-implementation-handoff
  arckit_writeback:
    case: ""
    tech: []
    pending: []
    workflow_memory: []
  open_questions: []
```

## 完成标准

- 说明为什么需要或不需要重构。
- 明确行为不变护栏。
- 阶段边界清楚，能独立验证。
- 不把架构拍板、产品变化或审美判断隐藏在“重构”名义下。
