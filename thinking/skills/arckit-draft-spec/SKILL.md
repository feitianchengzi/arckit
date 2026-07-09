---
name: arckit-draft-spec
description: 把原始输入、想法、调研或讨论材料整理成产品规格草案、PRD 草案、验收草案或 spec handoff。适用于需要定义前草案、材料归纳、验收口径草拟或交给 arckit-spec 之前的规格输入整理场景。该 skill 不直接维护 arckit/spec 的结果事实。
---

# Arckit Draft Spec

本 skill 负责把材料整理成可进入 `arckit-spec` 的草案。它不改变 `arckit/spec/` 的 source of truth。

## 边界

- 适合：把 intake、会议纪要、市场调研、想法、决策片段整理成规格草案。
- 适合：补齐用户、场景、能力、边界、行为规则、验收点和开放问题。
- 不适合：维护稳定产品规格文件。稳定结果由 `arckit-spec` 写入。
- 不适合：生成实现代码或技术方案。技术设计交给 `arckit-architecture-decision` 或 `arckit-tech`。

## 工作流

1. 识别输入来源和证据强度，保留 source reference。
2. 提取需求候选：目标用户、场景、问题、能力、非能力、约束、验收。
3. 标注不确定性：缺证据、冲突、待用户确认、待验证。
4. 生成规格草案，但避免把过程讨论写成稳定事实。
5. 输出 `spec_draft_handoff`，供 `arckit-spec` 决定如何并入、拆分、归档或拒绝。

## 输出格式

```yaml
spec_draft_handoff:
  source_refs: []
  feature_or_module: ""
  target_users: []
  scenarios: []
  capabilities:
    - name: ""
      behavior: ""
      acceptance: []
      source_basis: []
  non_goals: []
  constraints: []
  open_questions: []
  confidence: low|medium|high
  suggested_result_skill: arckit-spec
```

同时按通用 `process_handoff` 语义映射：`source_refs` 保持来源；已确认的 `capabilities`、`non_goals`、`constraints` 进入 `accepted_facts`；`open_questions` 和低置信内容进入 `gaps` 或 `assumptions`。需要跨回合继续时，将摘要交给 `arckit-pending`。

## 参考和脚本

`references/` 中保留了原始 `all/01-pm/prd-gen` 的 PRD 相关模板，可作为草案结构参考。`scripts/validate_prd.py` 是可选校验脚本，运行前先确认它的规则适用于当前草案。
