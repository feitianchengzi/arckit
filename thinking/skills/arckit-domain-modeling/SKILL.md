---
name: arckit-domain-modeling
description: 梳理领域模型、实体、值对象、状态、不变量、领域事件、聚合边界、上下文映射或事件风暴结果。适用于需要形成领域建模 handoff、澄清业务结构或为后续规格/技术方案提供模型输入的场景。输出 domain_modeling_handoff，不直接维护 arckit/tech 或 arckit/spec。
---

# Arckit Domain Modeling

本 skill 负责把业务领域结构建模成可交接的过程产物。它不直接修改长期产品或技术事实源。

## 边界

- 适合：领域词汇、实体关系、状态机、不变量、领域事件、聚合边界、上下文映射。
- 适合：把业务复杂性转成 `arckit-spec` 或 `arckit-tech` 可接收的 handoff。
- 不适合：直接写产品规格、数据模型 YAML 或 API 契约。
- 不适合：生成代码骨架。

## 工作流

1. 收集业务语言和关键场景，区分用户语言、系统语言和实现术语。
2. 提取实体、值对象、聚合、领域事件、命令、策略和不变量。
3. 标注状态转换、边界上下文、跨上下文关系和一致性要求。
4. 找出冲突、缺口和需要用户确认的政策边界。
5. 输出 `domain_modeling_handoff`，交给 `arckit-spec` 或 `arckit-tech`。

## 输出格式

```yaml
domain_modeling_handoff:
  domain: ""
  glossary: []
  entities: []
  value_objects: []
  aggregates: []
  domain_events: []
  commands: []
  invariants: []
  state_transitions: []
  bounded_contexts: []
  open_questions: []
  downstream_candidates:
    - arckit-spec
    - arckit-tech
```

同时按通用 `process_handoff` 语义映射：已确认的术语、实体、聚合、事件、不变量和上下文关系进入 `accepted_facts`；`open_questions` 进入 `gaps`；边界不确定或政策未确认的内容进入 `assumptions`；跨上下文风险进入 `risks`。

## 参考和脚本

`references/` 中保留了原始 `all/03-architect/model` 的建模参考与示例数据。`scripts/validate_event_storming.py`、`scripts/validate_modeling.py`、`scripts/validate_strategy.py` 是可选校验脚本，不作为事实源。
