# Controller Conversation Protocol

`using-arckit` controls one project conversation round. It does not execute worker tasks by itself.

## Turn Delta

Classify every input:

- `first_turn`: no prior project loop is available.
- `new_case`: the input starts a new development case.
- `resume_next_prompt`: the user says continue from the previous handoff.
- `continue_case`: the user continues the same case with a new instruction.
- `supplement`: the user adds context that may revise packet context.
- `correction`: the user corrects a misunderstanding, fact, packet, or report.
- `goal_change`: the user changes the objective enough that old packets may be invalid.
- `pause_or_stop`: the user asks to stop, pause, or defer.
- `report_intake`: the user brings back one or more worker reports.
- `status_query`: the user asks what is happening or what remains.

## Round Status

Use one controller status at a time:

- `planning`: controller is forming the round.
- `waiting_authorization`: execution gate is pending.
- `waiting_worker`: worker packets have been issued and reports are missing.
- `reviewing_worker`: reports are being checked against intake rules.
- `ready_to_close`: required reports and evidence are enough for closeout.
- `done`: this round is closed.
- `blocked`: controller cannot progress without missing state, permission, tool, report, or external result.

## Execution Gate

Default to pending unless the current input or operator explicitly authorizes execution.

Allowed authorization sources:

- `user_message`
- `runtime_authorization`
- `auto_run_policy`
- `external_platform`
- `none`

Allowed executors:

- `human_runtime`
- `runtime_executor`
- `current_agent`
- `external_agent`
- `none`

## Human Bridge

When no automated executor is available, the human can bridge packets and reports:

1. Copy worker packets to worker Agent chats.
2. Bring worker reports back to the Controller chat.
3. Send corrections and supplements to Controller first.
4. Use the Controller's next prompt to continue the next round.

The human is not responsible for Controller judgment unless `human_decision_required=true`.
