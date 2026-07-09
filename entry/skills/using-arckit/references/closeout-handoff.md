# Closeout Handoff

Every Controller round must end with recoverable state.

## Completion Audit

```yaml
completion_audit:
  status: done | continue | blocked | needs_human | external_wait
  evidence: []
  missing_evidence: []
  source_projection_status: ""
  verification_status: ""
  reason: ""
```

Use:

- `done`: current round objective is satisfied and evidence is sufficient.
- `continue`: agent can continue with a next round.
- `blocked`: required state, permission, tool, or dependency is missing.
- `needs_human`: human judgment, authorization, priority, aesthetics, or release decision is required.
- `external_wait`: waiting for an external system or out-of-band action.

`done` requires accepted worker reports or an explicit no-execution status round, enough evidence for the round goal, clear source/projection separation, and a recoverable case or handoff update.

`continue` means the next step is still Agent/Runtime work. If there is no automatic bridge, use `trigger_mode=manual_bridge` and provide a next prompt that a human can paste back into Controller.


## Loop Handoff

```yaml
loop_handoff:
  status: continue | done | needs_human | blocked | deferred
  next_responsibility: agent | human | external | none
  agent_continuation_available: true | false
  human_decision_required: true | false
  trigger_mode: manual_bridge | auto_bridge | user_decision | external_wait | none
  responsibility_reason: ""
  next_prompt: ""
  agent_instruction:
    goal: ""
    required_context_refs: []
    required_actions: []
    required_checks: []
    stop_condition: ""
  human_gate:
    required: true | false
    reason: ""
    decision_needed: ""
  progress_guard:
    expected_state_change: ""
    actual_state_change: ""
    no_progress_limit: 1
    max_auto_rounds: 1
```

## Visible Closeout

User-facing closeout should be short, but must include:

- what changed
- what was verified
- what could not be verified
- source/projection impact
- next responsibility
- trigger mode or next prompt when useful

If old worker packets became invalid during the round, the closeout must explicitly say so.
