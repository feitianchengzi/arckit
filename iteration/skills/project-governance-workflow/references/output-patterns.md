# Output Patterns

Use this reference when the user asks for a plan, Goal Intake, next Goal recommendation, Roadmap draft, structure audit, or a project-specific governance document.

Keep prose in the user's system language. Keep structured field names in English.

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

Use this when the user proposes, changes, or asks to set a Goal. Do not accept the Goal from wording alone.

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

Use this when recommending what Goal to pursue next. The recommendation is proposed until the user confirms it or an accepted Decision already supports it.

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

## Iteration And Tasks

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

## Review And Goal Progress

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

Roadmap is a sequencing layer, not a larger Goal. Every item needs `source` and `status`.

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

For a very small project, a singular `current_goal` is acceptable, but do not imply that the Goal ends with the current Iteration.

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

Use this before editing when the user asks for document hierarchy, growth control, archive, retrieval, or migration.

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

## Project-Specific Markdown Document

When the user asks for a reusable or project-specific governance document, include:

- Current context
- Backlog sources
- Active Goals
- Goal scope boundary
- Iteration plan and Goal mix
- Task list
- Iteration Review checklist
- Goal Progress Review checklist
- Decision log
- Roadmap adjustment

When the project uses multiple documents, produce or update:

- A short entry document with a document map.
- One artifact document per planning concern.
- Cross-links between related documents.
- A note about which file should be edited for common updates.
