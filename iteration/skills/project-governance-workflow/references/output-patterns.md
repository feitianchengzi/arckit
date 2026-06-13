# Output Patterns

当用户要求计划、Goal Intake、Next Goal Recommendation、Roadmap 草案、Structure Audit 或项目专属治理文档时，使用本参考。

正文使用用户的系统语言。结构化字段名保持英文。

## Planning Artifact

```yaml
project_plan:
  objective:
  current_focus:
  constraints:
  non_goals:

current_goals:
  - id:
    title:
    status:
    source_backlog:
    why_now:
    expected_outcome:
    success_criteria:
    non_goals:
    remaining_uncertainty:

goal_scope:
  goal_id:
  must_have:
  nice_to_have:
  non_goals:
  risk_controls:
```

## Goal Intake

当用户提出、修改或要求设定 Goal 时使用。不要只根据用户措辞直接接受 Goal。

```yaml
goal_intake:
  user_proposed_goal:
  historical_sources_checked:
  evidence_supporting:
  evidence_conflicting:
  relation_to_active_goals:
  recommendation: accept | revise | keep_as_candidate | reject_or_defer
  required_user_decision:
```

## Next Goal Recommendation

当需要建议下一步追求哪个 Goal 时使用。在用户确认之前，或没有已接受 Decision 支持之前，该建议仍只是提案。

```yaml
next_goal_recommendation:
  recommended_goal:
  source_evidence:
  why_now:
  alternatives:
  tradeoffs:
  remaining_uncertainty:
  required_user_decision:
```

## Iteration 和 Tasks

```yaml
current_iteration:
  id:
  name:
  theme:
  primary_goal_id:
  supporting_goal_ids:
  reason_for_mix:
  review_date:
  selected_scope:
  excluded_scope:
  success_criteria:

tasks:
  - title:
    goal_id:
    iteration_id:
    owner:
    status:
    done_when:
    evidence:
```

## Review 和 Goal Progress

```yaml
iteration_review:
  iteration_id:
  primary_goal_id:
  supporting_goal_ids:
  result:
  evidence:
  what_worked:
  what_failed:
  risks:
  next_iteration_candidates:

goal_progress:
  - goal_id:
    covered_iterations:
    completed_tasks:
    evidence:
    remaining_uncertainty:
    status:
```

## Roadmap

Roadmap 是排序层，不是更大的 Goal。每个条目都需要 `source` 和 `status`。

```yaml
roadmap:
  now:
    - item:
      item_type: goal | goal_candidate | backlog | decision
      source:
      status: accepted | proposed | deferred | rejected_or_out_of_scope
      rationale:
  next:
    - item:
      item_type:
      source:
      status:
      rationale:
  later:
    - item:
      item_type:
      source:
      status:
      rationale:
  not_now:
    - item:
      item_type:
      source:
      status:
      rationale:
```

## Small Project Variant

对于很小的项目，可以使用单数 `current_goal`，但不要暗示该 Goal 会随着当前 Iteration 结束。

```yaml
current_goal:
  title:
  source_backlog:
  why_now:
  expected_outcome:
  success_criteria:

current_iteration:
  name:
  theme:
  primary_goal_id:
  supporting_goal_ids:
  reason_for_mix:
  review_date:
  selected_scope:
  excluded_scope:
```

## Structure Audit

当用户要求文档层级、增长控制、归档、检索或迁移时，编辑前先使用本结构。

```yaml
structure_audit:
  current_symptoms:
  proposed_layers:
  files_to_keep_short:
  workflow_ledgers:
  reference_library:
  indexes_needed:
  archive_candidates:
  migration_steps:
  link_risk:
```

## 项目专属 Markdown 文档

当用户要求可复用或项目专属治理文档时，包含：

- 当前上下文
- Backlog 来源
- 活跃 Goals
- Goal 范围边界
- Iteration 计划和 Goal 组合
- Task 列表
- Iteration Review 检查清单
- Goal Progress Review 检查清单
- Decision 记录
- Roadmap 调整

当项目使用多个文档时，创建或更新：

- 一个带文档地图的简短入口文档。
- 每个 planning concern 对应一个 artifact 文档。
- 相关文档之间的交叉链接。
- 一段说明：常见更新应该编辑哪个文件。
