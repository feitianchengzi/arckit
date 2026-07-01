# Workflow Memory Schema

## Workflow Resolution

每个进入 ArcKit 的任务开始时都必须输出 workflow resolution。Resolution 的目标是绑定可复用场景工作流；它不是新建本次任务 workflow。

```yaml
workflow_resolution:
  scope_checked:
    - project
    - user
  project_fingerprint: ""
  resolution_source: project_accepted|project_candidate|user_accepted|user_candidate|arckit_default|new_candidate_required|pending
  bound_workflow_id: ""
  bound_candidate_id: ""
  match_reason: ""
  applied_overlay: true|false
  new_candidate_required: true|false
  execution_record_target: "~/.arckit/workflows/<scope-path>/executions/YYYY-MM-DD/exec-YYYYMMDD-short-slug.yaml"
  index_status:
    project: current|missing|stale|incomplete|not_checked
    user: current|missing|stale|incomplete|not_checked
  fallback_scan_performed: true|false
  write_permission: available|needs_permission|unavailable
```

## Signal Decision

每次 workflow memory closeout 都必须先输出 signal decision。Decision 是收口动作，不等同于 signal 文件。

```yaml
workflow_memory_closeout:
  correction_detected: yes|no
  signal_decision: write_signal|update_candidate_only|skip
  skip_reason: ""
  ledger_source: arckit-turn-adaptation|using-arckit|none
```

当 `correction_detected=yes` 且 `signal_decision=skip` 时，`skip_reason` 必须说明该纠偏为什么不是可复用流程学习，或说明完全覆盖它的 accepted workflow patch。

```yaml
signal_decision:
  action: write_signal|update_candidate_only|skip
  reason: ""
  matched_workflow: ""
  applied_overlay: ""
  novelty: none|low|medium|high
  outcome: succeeded|failed|blocked|partial
```

## Signal

`scope: project` 的 signal 默认路径是 `~/.arckit/workflows/projects/<project-fingerprint>/signals/`；`scope: user` 的 signal 默认路径是 `~/.arckit/workflows/user/signals/`。如果 `scope=project` 但因权限或指纹问题降级到 user 目录，必须在 `notes` 和 closeout 输出中说明降级原因。

```yaml
id: "sig-YYYYMMDD-short-slug"
type: workflow_signal
created_at: "YYYY-MM-DD"
scope: user|project
scenario: bug-diagnosis|feature-implementation|code-review|product-concept|technical-solution|skill-validation|project-governance|release-operations
source_task: ""
project_root: ""
project_fingerprint: ""
fingerprint_confidence: high|medium|low
workflow_frame:
  scenario: ""
  signals: []
  runtime_situation: {}
  workflow_resolution: {}
  workflow_composition_reasoning: {}
  final_goal: ""
  current_phase: ""
  phase_reason: ""
  workflow_source: ""
  available_arckit_capabilities: []
  selected_capabilities: []
  why_not_selected: {}
  skills: []
  handoffs: []
  artifact_targets: []
  artifact_impact_scan: {}
  reflection_gates: []
  adaptation_triggers: []
  next_recompile_condition: ""
  memory_overlay: []
  execution_record_target: ""
  confirmation_points: []
  stop_conditions: []
skills_used: []
evidence:
  files_read: []
  commands: []
  files_written: []
  verification: []
outcome: succeeded|failed|blocked|partial
reusable_pattern_hint: ""
workflow_patch_shape: ""
promotion_hint: none|candidate_possible
notes: []
```

## Signal Pending Write

当当前环境不能直接写入 memory root、沙箱需要权限、或用户明确边界阻止写入时输出。仅仅因为 memory root 尚未初始化，不应输出 pending write；可写时应直接初始化。

```yaml
type: workflow_signal_pending_write
reason: permission_required|write_boundary_forbidden|tool_unavailable
requested_permission: ""
bootstrap_required: true|false
target_paths:
  root: "~/.arckit/workflows"
  scope_path: "user|projects/<project-fingerprint>"
  index: "~/.arckit/workflows/<scope-path>/INDEX.md"
  signal: "~/.arckit/workflows/<scope-path>/signals/sig-YYYYMMDD-short-slug.yaml"
directories:
  - "~/.arckit/workflows/<scope-path>/signals"
  - "~/.arckit/workflows/<scope-path>/candidates"
  - "~/.arckit/workflows/<scope-path>/accepted"
  - "~/.arckit/workflows/<scope-path>/executions"
signal:
  id: "sig-YYYYMMDD-short-slug"
  type: workflow_signal
  created_at: "YYYY-MM-DD"
  scope: user|project
  scenario: ""
  source_task: ""
  project_root: ""
  workflow_frame: {}
  skills_used: []
  evidence:
    files_read: []
    commands: []
    files_written: []
    verification: []
  outcome: succeeded|failed|blocked|partial
  reusable_pattern_hint: ""
  workflow_patch_shape: ""
  promotion_hint: none|candidate_possible
```

## Execution Record

Execution record 记录本次任务如何应用绑定的 scenario workflow。它可以每次新增；它不是 workflow、不是 candidate，也不替代 signal decision。

```yaml
id: "exec-YYYYMMDD-short-slug"
type: workflow_execution_record
created_at: "YYYY-MM-DD"
scope: user|project
scenario: ""
source_task: ""
project_root: ""
project_fingerprint: ""
resolution:
  resolution_source: project_accepted|project_candidate|user_accepted|user_candidate|arckit_default|new_candidate_required|pending
  bound_workflow_id: ""
  bound_candidate_id: ""
  match_reason: ""
  applied_overlay: true|false
workflow_frame_summary:
  final_goal: ""
  current_phase: ""
  selected_capabilities: []
  why_not_selected: {}
  artifact_impact_scan: {}
execution:
  skills_used: []
  files_read: []
  commands: []
  files_written: []
  verification: []
  deviations_from_bound_workflow: []
  user_corrections: []
closeout:
  outcome: succeeded|failed|blocked|partial
  workflow_memory_closeout: {}
  signal_decision: write_signal|update_candidate_only|skip
  candidate_update: ""
  accepted_patch_proposal: ""
notes: []
```

## Execution Record Pending Write

```yaml
type: execution_record_pending_write
reason: permission_required|write_boundary_forbidden|tool_unavailable
target_path: "~/.arckit/workflows/<scope-path>/executions/YYYY-MM-DD/exec-YYYYMMDD-short-slug.yaml"
record_summary:
  scenario: ""
  source_task: ""
  bound_workflow_id: ""
  bound_candidate_id: ""
  outcome: succeeded|failed|blocked|partial
  signal_decision: write_signal|update_candidate_only|skip
```

## Signal Blocked

当用户明确拒绝或明确禁止 workflow memory 写入时输出。

```yaml
type: workflow_signal_blocked
reason: user_declined|external_memory_forbidden|scope_forbidden
would_have_written: "~/.arckit/workflows/<scope-path>/signals/sig-YYYYMMDD-short-slug.yaml"
signal_summary: ""
```

## Candidate

```yaml
id: "cand-short-slug"
type: workflow_candidate_patch
status: candidate
created_at: "YYYY-MM-DD"
updated_at: "YYYY-MM-DD"
scope: user|project
title: ""
scenario: ""
trigger_signals: []
applies_when: []
does_not_apply_when: []
composition_heuristic: ""
patch:
  add_required_steps:
    - id: ""
      skill: ""
      purpose: ""
      required: true
  remove_steps: []
  reorder_steps: []
  handoffs: []
  artifact_impact_scan:
    spec: none|check|update|pending|skipped
    interaction: none|check|update|pending|skipped
    visual: none|check|update|pending|skipped
    tech: none|check|update|pending|skipped
    pending: none|check|update|pending|skipped
    governance: none|check|update|pending|skipped
    verification: none|check|update|pending|skipped
    workflow_memory: none|check|update|pending|skipped
  artifact_targets: []
  reflection_gates: []
  adaptation_triggers: []
  next_recompile_condition: ""
  confirmation_points: []
  stop_conditions: []
evidence_refs: []
success_count: 0
failure_count: 0
risk_notes: []
match_count: 0
last_matched_at: ""
last_outcome: succeeded|failed|blocked|partial
last_match_summary: ""
```

## Candidate Match Update

命中 candidate 且没有新学习信息时使用。该结构只维护 candidate 的匹配与验证状态，不创建完整 signal，也不更新 `INDEX.md` 的 Recent Signals。

```yaml
type: workflow_candidate_match_update
candidate_id: "cand-short-slug"
reason: "matched_candidate_without_new_learning"
matched_at: "YYYY-MM-DD"
outcome: succeeded|failed|blocked|partial
applied_overlay: true|false
frame_changes:
  skills: []
  artifact_impact_scan: []
  reflection_gates: []
match_count_delta: 1
success_count_delta: 1
failure_count_delta: 0
last_match_summary: ""
index_update_required: true
```

## Candidate Pending Write

当多个相似 signals 已足够形成候选工作流，但当前环境不能直接写入 candidate、沙箱需要权限、或用户明确边界阻止写入时输出。仅仅因为 memory root 尚未初始化，不应输出 pending write；可写时应直接初始化并写 candidate。

```yaml
type: workflow_candidate_pending_write
reason: signal_files_pending|permission_required|write_boundary_forbidden|tool_unavailable
target_path: "~/.arckit/workflows/user/candidates/cand-short-slug.yaml"
candidate:
  id: "cand-short-slug"
  type: workflow_candidate_patch
  status: candidate
  scope: user|project
  title: ""
  scenario: ""
  evidence_refs:
    - "pending:sig-YYYYMMDD-short-slug"
  success_count: 0
  failure_count: 0
```

## Candidate Blocked

当已满足 candidate 条件，但用户明确拒绝或明确禁止 workflow candidate 写入时输出。

```yaml
type: workflow_candidate_blocked
reason: user_declined|external_memory_forbidden|scope_forbidden
would_have_written: "~/.arckit/workflows/user/candidates/cand-short-slug.yaml"
evidence_refs:
  - "pending:sig-YYYYMMDD-short-slug"
candidate_summary: ""
```

## Index Update

每次 workflow resolution 都要读取相关 `INDEX.md` 内容。每次 signal、candidate patch、accepted workflow patch 或 execution record 写入成功后，都要同步维护对应 `INDEX.md`。如果索引缺失、过期或没有列出磁盘上已存在的候选文件，应扫描目录兜底并在收口时修复或报告。

```yaml
workflow_index_update:
  scope: user|project
  index_path: "~/.arckit/workflows/user/INDEX.md"
  read: true
  status_before: current|missing|stale|incomplete|not_checked
  fallback_scan:
    performed: true|false
    directories:
      - "~/.arckit/workflows/user/accepted"
      - "~/.arckit/workflows/user/candidates"
    matched_files: []
  entries_added: []
  entries_updated: []
  execution_entries_added: []
  entries_missing_after_update: []
  status_after: current|pending_write|blocked
```

## Index Pending Write

当 signal/candidate/accepted 文件可写或已经写入，但 `INDEX.md` 因沙箱、工具或用户边界无法同步时输出。

```yaml
type: workflow_index_pending_write
reason: permission_required|write_boundary_forbidden|tool_unavailable
index_path: "~/.arckit/workflows/user/INDEX.md"
pending_entries:
  candidates:
    - id: "cand-short-slug"
      scenario: ""
      signals: 2
      updated: "YYYY-MM-DD"
      summary: ""
  signals:
    - id: "sig-YYYYMMDD-short-slug"
      scenario: ""
      outcome: succeeded|failed|blocked|partial
      created: "YYYY-MM-DD"
      summary: ""
  accepted:
    - id: "wf-short-slug"
      scenario: ""
      scope: user|project
      updated: "YYYY-MM-DD"
      summary: ""
  executions:
    - id: "exec-YYYYMMDD-short-slug"
      scenario: ""
      outcome: succeeded|failed|blocked|partial
      created: "YYYY-MM-DD"
      bound_workflow_id: ""
      bound_candidate_id: ""
      summary: ""
```

## Index Blocked

当用户明确禁止维护 workflow memory 索引时输出。

```yaml
type: workflow_index_blocked
reason: user_declined|external_memory_forbidden|scope_forbidden
index_path: "~/.arckit/workflows/user/INDEX.md"
would_have_added_or_updated: []
```

## Pending Signal Buffer

当前对话内的临时工作记忆。即使 signal 文件没有落盘，也必须保留足够信息供 candidate maintenance 使用。

```yaml
pending_signal_buffer:
  - id: "sig-YYYYMMDD-short-slug"
    scenario: ""
    source_task: ""
    project_root: ""
    skills_used: []
    outcome: succeeded|failed|blocked|partial
    reusable_pattern_hint: ""
    similarity_keys:
      - "scenario:<scenario>"
      - "skills:<skill-chain>"
      - "task-shape:<task-shape>"
      - "adaptation:<adaptation-trigger>"
      - "phase:<final-goal>-><current-phase>"
      - "workflow:<workflow-patch-shape>"
      - "verification:<verification-shape>"
```

## Accepted Workflow Patch

```yaml
id: "wf-short-slug"
type: workflow_patch
status: accepted
accepted_at: "YYYY-MM-DD"
accepted_by: user
scope: user|project
title: ""
scenario: ""
priority: 50
triggers:
  scenarios: []
  signals: []
  paths: []
applies_when: []
does_not_apply_when: []
composition_heuristic: ""
patch:
  add_required_steps: []
  remove_steps: []
  reorder_steps: []
  handoffs: []
  artifact_impact_scan:
    spec: none|check|update|pending|skipped
    interaction: none|check|update|pending|skipped
    visual: none|check|update|pending|skipped
    tech: none|check|update|pending|skipped
    pending: none|check|update|pending|skipped
    governance: none|check|update|pending|skipped
    verification: none|check|update|pending|skipped
    workflow_memory: none|check|update|pending|skipped
  artifact_targets: []
  reflection_gates: []
  adaptation_triggers: []
  next_recompile_condition: ""
  confirmation_points: []
  stop_conditions: []
source_candidate: ""
evidence_refs: []
version: 1
```

## INDEX.md

```markdown
# ArcKit Workflow Memory

## Accepted

| Workflow | Scenario | Scope | Updated | Summary |
|---|---|---|---:|---|

## Candidates

| Candidate | Scenario | Signals | Updated | Summary |
|---|---|---:|---:|---|

## Recent Signals

| Signal | Scenario | Outcome | Created | Summary |
|---|---|---|---:|---|

## Recent Executions

| Execution | Scenario | Outcome | Bound Workflow | Created | Summary |
|---|---|---|---|---:|---|
```
