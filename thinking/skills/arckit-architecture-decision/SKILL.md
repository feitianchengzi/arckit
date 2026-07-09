---
name: arckit-architecture-decision
description: 在正式技术方案沉淀前形成架构决策、ADR、系统拆分、方案权衡、约束分析或技术取舍。适用于技术定义前的决策分析、方案比较、约束梳理和架构风险判断。输出 architecture_decision_handoff，不直接维护 arckit/tech 的结果事实。
---

# Arckit Architecture Decision

本 skill 负责技术方案进入长期文档前的决策分析。它生成过程型 ADR 或权衡材料，供 `arckit-tech` 接收。

## 边界

- 适合：架构取舍、ADR、系统边界、组件拆分、方案比较、风险控制。
- 适合：把工程讨论整理成可沉淀的技术决策输入。
- 不适合：直接维护 `arckit/tech/` 的方案、模型或 API 契约。
- 不适合：具体技术栈编码步骤。编码 skill 维护在 `arckit-code`。

## 工作流

1. 明确决策问题、上下文、约束和不可违反条件。
2. 列出候选方案和排除方案。
3. 对比关键维度：复杂度、可演进性、性能、可靠性、安全、团队掌握度、迁移成本。
4. 记录推荐方案、反对意见、风险控制和验证方式。
5. 输出 `architecture_decision_handoff`，由 `arckit-tech` 决定写入 `research.md`、`solution.md`、`decision.md`、模型或契约。

## 输出格式

```yaml
architecture_decision_handoff:
  decision_question: ""
  context: ""
  constraints: []
  options:
    - name: ""
      summary: ""
      strengths: []
      weaknesses: []
  recommendation: ""
  rejected_options: []
  risks: []
  validation_next: []
  suggested_result_skill: arckit-tech
```

同时按通用 `process_handoff` 语义映射：`context`、`constraints`、`recommendation` 和已确认决策理由进入 `accepted_facts`；未验证条件进入 `assumptions`；`risks` 保持为 `risks`；`rejected_options` 进入 `rejected_items`；`validation_next` 进入 `gaps` 或后续验证动作。

## 参考和脚本

- `references/adr-template.md`：ADR 草案结构。
- `references/patterns.md`：架构模式参考。
- `references/tradeoff-matrix.md`：权衡矩阵参考。
- `scripts/generate_adr.py`、`scripts/evaluate_tradeoff.py`、`scripts/check_system_split.py` 是可选辅助脚本。
