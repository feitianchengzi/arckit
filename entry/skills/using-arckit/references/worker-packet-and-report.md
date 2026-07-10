# Worker Packet And Report

Worker packets are the only work units that executors should run.

## Worker Packet

```yaml
worker_packet:
  schema_version: arckit-worker-packet/v1
  worker_id: ""
  worker_type: product | tech | implementation | verification | diagnosis | closeout
  role: ""
  project_root: ""
  case_id: ""
  round_goal: ""
  task: ""
  context_refs: []
  allowed_actions: []
  forbidden_actions: []
  allowed_skills: []
  allowed_paths: []
  stop_condition: ""
  expected_report_schema: arckit-worker-report/v1
```

The packet must be narrow enough to paste into a separate Agent chat.

## Worker Report

```yaml
worker_report:
  schema_version: arckit-worker-report/v1
  task_id: ""
  worker_type: product | tech | implementation | verification | diagnosis | closeout
  role: ""
  status: completed | partial | blocked | failed | invalid
  summary: ""
  findings: []
  evidence: []
  changes: []
  artifact_impacts: []
  risks: []
  unknowns: []
  recommendation: ""
  requires_main_agent_decision: false
  requires_human_decision: false
```

`requires_main_agent_decision=true` means the Controller should review, merge, revise, or generate the next round.

`requires_human_decision=true` means the report requires user authorization, priority, risk acceptance, business judgment, aesthetics, release responsibility, or another non-delegable human decision.

## Intake Rules

Accept only when:

- `task_id` matches an issued packet's `worker_id`.
- `worker_type` matches the issued packet, and role/task stay within packet scope.
- Skill usage stays within packet `allowed_skills`.
- Evidence is present or explicitly marked unavailable.
- Risks and unknowns are visible.
- The report does not claim whole-round closeout.

Reject or request revision when:

- The worker expanded scope.
- The report lacks required fields.
- Evidence is missing for completed claims.
- It changes stable facts without the owning capability or Controller packet authorizing it.
