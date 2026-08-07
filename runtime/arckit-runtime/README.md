# Arckit Runtime

Arckit Runtime is the control plane for state-driven agentic software development. It keeps loop control outside model prompts and uses Codex app-server for bounded Controller and Worker turns.

## Product Shape

```text
Arckit Desktop
  current-user projects, server tasks, automation queue, on-demand intervention, evidence, recovery

Arckit Runtime
  one state-driven process, persistent app-server, controller reducer, ledger gate and writeback

Agent Workers
  Codex app-server turns that execute one worker packet and return one worker report

Arckit Project Files
  project state, cases, facts, pending, handoffs, runtime evidence
```

The Runtime owns the loop. Workers do not decide case closure, final next responsibility, human gates, source/projection ownership, or ledger writeback.

Runtime is not a semantic truth judge. Workers, Controller LLM turns, or humans make semantic judgments and submit structured claims. Runtime verifies the claim shape, evidence presence, artifact ownership, gate rules, and state transitions.

The product kernel is deterministic:

```text
User Input
  -> Controller Plan (reuse/select/create Case)
  -> Optional Trusted Case Control Writeback
  -> Fresh State Read
  -> Controller Plan (select Case gap)
  -> Zero or More Worker Dispatches
  -> Controller Review (accept evidence-backed delta)
  -> Runtime Guard
  -> Ledger Gate
  -> Atomic Case Transition Writeback
  -> Fresh State Read
  -> Next Control State
  -> Desktop UI
```

Desktop displays this runtime control state. It does not infer business state from prompt text or worker prose.

## Agentic Loop

Each run is one state-driven session and produces a final-round compatibility envelope plus:

- `session_mode=state-driven`
- `round_count`
- `session_rounds`
- `ledger_write_result`
- `stop_reason` and `paused_for_human`

- `loop_frame`
- `route_plan`
- `worker_tasks`
- `worker_reports`
- `round_state`
- `round_state_history`
- `round_execution_packet`
- `merge_result`
- `controller_reducer_result`
- `artifact_ownership_scan`
- `ledger_stage`
- `runtime_result`
- raw and normalized event evidence

Worker types are stable capability classes (`product`, `tech`, `implementation`, `verification`, `diagnosis`, `closeout`). Worker roles are per-round semantic names selected by the dynamic route plan. Runtime does not trigger every worker type on every run.

In executing Codex mode, Runtime first verifies that the installed Controller skill matches the repository capability protocol, then invokes the manifest-declared `$using-arckit` Agent skill in a bounded Controller turn and asks for an `arckit-controller-plan/v3`.
The Controller Agent chooses one mutually exclusive execution plane: deterministic Runtime actions, Worker dispatch, or a zero-Worker direct-evidence route. It proposes the minimum worker route when the Worker plane is selected, using project state,
candidate gaps, local evidence, and operator task. Runtime still owns final validation: it normalizes
the proposed route and validates schema, authorization, evidence, report intake, and ledger gates.
If a planned Controller result fails structural validation, Runtime returns the validation reason and rejected plan to `$using-arckit` for one automatic correction attempt; it never silently deletes contradictory fields, invents a code-rule route, or auto-adds missing workers. A semantic `needs_human`/`blocked`, an unavailable Controller, or a second invalid plan stops the round. Dry-run mode does not start the Controller Agent, so it cannot fabricate worker packets.

The same `$using-arckit` invocation is used for Controller Review after worker reports arrive, or immediately when operator input and existing stable facts already supply enough evidence. Agent text input contains only the skill trigger and the minimum phase facts: verbatim human input, canonical state or runtime evidence refs, revision, execution authorization, and allowed capability refs. Codex app-server receives the output schema as a machine parameter. Runtime does not keep a second copy of Controller workflow, output-field instructions, or closeout rules in prompt templates.

One executing Runtime session owns one long-lived Codex app-server process and multiple semantic conversation lanes. Controller planning and plan correction use `controller:project:planning`; Worker report review uses `controller:case:{case_id}:review`, so project selection history and a Case's evidence review do not share one broad transcript. Workers reuse `worker:{case_id}:{worker_type}:{workstream_id}` only when the Controller declares the same stable workstream for a coherent objective and path domain. Runtime validates and combines this identity but does not infer it from task keywords. Every Worker turn also receives a bounded canonical `context_digest`; current packet and canonical facts supersede thread history, while same-round prior reports remain separate evidence. Case, worker-type, or workstream changes create distinct Worker lanes, and infrastructure-failed lanes are discarded before retry. Turn completion closes only the turn event queue; the adapter closes the app-server when the state-driven session terminates.

Desktop automation creates one task session per remote todo. Initial execution, continuations, interventions, recovery, and commit share one user-facing message stream, while different todos never use the project default chat as an automation fallback. Runtime, Controller, Worker, tool summaries, and operator input are ordered together regardless of internal thread count. Run activity projects deduplicated thread/turn Token Usage, model and command durations, and non-blocking usage warnings. Equivalent active commands in the same working directory are single-flight; monitoring does not impose a fixed token-total or total-round completion limit.

After workers report, Runtime reduces report evidence into a deterministic Runtime Guard result before applying
Controller Review closeout. Controller Review may decide semantic `continue`, `needs_human`, or `blocked`, but it
cannot prepare ledger writeback unless the Runtime Guard proves all issued reports, direct Controller evidence, source/projection
checks, execution authorization, and risk/unknown gates are clean.

Worker reports separate human-readable change descriptions from machine-readable artifact impact claims.
`changes` is prose for display and review only. Runtime Guard uses `artifact_impacts[]` as the protocol input:
each item binds one artifact path to an operation, semantic claim, summary, and evidence. Runtime classifies those
artifact paths with the ownership map, checks them against worker `allowed_paths`, and blocks closeout when a report
describes changes without structured artifact impacts.

Runtime Guard blockers are structured with `type`, `severity`, `recoverable_by`, `target`, `suggested_action`, and
`summary`. Guard does not auto-repair missing reports, invalid reports, missing evidence, or human gates by itself;
it marks whether the gap is agent-recoverable, human-owned, or runtime-blocked so the Controller/loop policy can
decide the next repair round.

Worker roles and route modes are agent-defined within the stable worker type set. Runtime does not preselect a first route for empty projects and does not infer implementation, discovery, verification, or closeout strategy from keywords. The Controller Agent must justify the route, selected worker types, selected roles, skill bindings, evidence requirements, and next loop handoff.

Dry-run mode is Controller Preview: it generates the controller frame and execution gate without starting Codex, running Controller Agent planning, fabricating worker packets, or fabricating worker reports.

## Capability And Skill Selection

Runtime scans capability manifests, applies `config/capability-policy.json`, and exposes only the retained Arckit capabilities. The current v2 policy divides the seven retained capabilities into mutually exclusive execution planes: Controller (`using-arckit`), Runtime (`arckit-development-ledger`), and Worker (`arckit-spec`, `arckit-interaction`, `arckit-visual`, `arckit-tech`, `arckit-debug-diagnosis`). A project manifest outside the policy is ignored.

Manifests also declare how Runtime invokes a capability. Controller phases use the Agent-native `$using-arckit` trigger. Project initialization, Agent-directed Case creation/registration, and Case transition writeback resolve repository-trusted `runtime_entrypoints` from `arckit-development-ledger`; entrypoints cannot escape the skill directory, and a target project's same-id manifest cannot shadow the repository implementation. Runtime retains deterministic schema, authorization, path, lifecycle, and ledger hard gates, while the skill owns ledger scripts and semantic writeback. No copied ledger scripts live under Runtime.

Every accepted transition binds `case_updated_at` and the complete selected candidate gap. The gate delegates canonical transition validation to the ledger capability, rejects stale Controller frames, and the ledger commits Case, Project, iteration, projections, and indexes with rollback on failure. The same Runtime process performs trusted writeback, emits the ledger result, fresh-reads canonical state, and immediately starts the next agent-owned round. Recoverable gate or transition rejection also replans from a fresh read within the no-progress budget. Successful writeback resets that budget; `--max-auto-rounds` limits consecutive rounds without ledger progress rather than total productive rounds. Human decisions set `paused_for_human=true`; external waits and exhausted safety budgets terminate without being misreported as human intervention. Desktop skips its legacy post-run ledger and cross-process auto-continue stages for `session_mode=state-driven`.

The Controller chooses `worker_type`, stable `workstream_id`, `role`, and `allowed_skills` for each worker intent only from the filtered Worker registry and current state gap. Controller and Runtime capabilities remain visible as protocol/service context but cannot be bound to Workers. The policy file is the explicit capability-selection boundary; Runtime kernel code remains generic and does not hard-code per-round workflow routes, fixed worker order, fixed skill sequences, business-specific first gaps, or infer workstreams from task keywords. Runtime injects selected `$skill-name` triggers only after policy and manifest binding checks. A Controller plan or existing packet with a Controller, Runtime, unknown, or unavailable Worker capability fails closed instead of silently dropping the invalid ID.

Worker turns receive a bounded context digest derived from the fresh Case record plus explicit same-round prior reports. Codex thread reuse is scoped to Case, semantic worker type, and Controller-declared workstream. Project-level Controller planning, Case-level review, and Worker execution use separate thread keys; hidden ephemeral thread history is never the recovery source after a Runtime restart.

## Commands

Initialize an empty or existing local project:

```bash
node runtime/arckit-runtime/bin/arckit-runtime.mjs init-project --project .
```

Run a controller preview:

```bash
node runtime/arckit-runtime/bin/arckit-runtime.mjs run --project . --task "build the first feature" --dry-run --json
```

Run real Codex app-server workers:

```bash
node runtime/arckit-runtime/bin/arckit-runtime.mjs run \
  --project . \
  --task "continue the active Arckit case" \
  --adapter codex-app-server \
  --max-auto-rounds 8 \
  --stream-events \
  --supervise-stdin
```

Run a direct agent task without entering the Controller/Case loop:

```bash
node runtime/arckit-runtime/bin/arckit-runtime.mjs agent-task \
  --project . \
  --task "git commit" \
  --json \
  --stream-events
```

Desktop uses this execution plane after a task's Case closes. The commit invocation supplies only `git commit`; it does not add a Chat message, Runtime context, or commit message.

Authorize and run an existing preview packet:

```bash
node runtime/arckit-runtime/bin/arckit-runtime.mjs run \
  --project . \
  --packet-file result.json \
  --adapter codex-app-server \
  --stream-events \
  --supervise-stdin
```

Saved packets carry the Case revision and complete selected gap. Runtime rejects them before Worker execution if the Case or gap has changed; Project State does not hold an exclusive Loop selection, and Runtime does not migrate old packets.

While a real run is active:

```text
/steer revise the current worker task and avoid changing unrelated files
/interrupt
```

Validate, gate, and write ledger:

```bash
node runtime/arckit-runtime/bin/arckit-runtime.mjs validate-result --file result.json
node runtime/arckit-runtime/bin/arckit-runtime.mjs gate-result --project . --file result.json --json
node runtime/arckit-runtime/bin/arckit-runtime.mjs write-ledger --project . --file result.json --dry-run --json
node runtime/arckit-runtime/bin/arckit-runtime.mjs write-ledger --project . --file result.json --json
```

`write-ledger` only commits canonical Project/Case/Iteration state. It does not copy the full Runtime result into the target repository. Desktop owns the result, final activity, compact `messages.jsonl`, and error log under Electron `userData`; it does not duplicate the raw delta stream into `events.jsonl` and `raw-events.jsonl`. Desktop passes an opaque `arckit-runtime://runs/RUN-...` reference during writeback. Direct CLI callers may omit the reference.

## Desktop Client

Start from `runtime/arckit-runtime`:

```bash
npm install
npm run desktop
```

Desktop is the intended product surface:

- Left rail: current-user projects, seven server task states, task-source health, and local Runtime health.
- Center: Automation Command Center, project-scoped Task Browser, on-demand Intervention Workbench, and Recovery Center.
- Right inspector: project source, local workspace binding, execution boundary, evidence, and controlled recovery actions.

The Command Center signs in to Workshop with an email or SMS verification code, then synchronizes the current user, standalone and organization projects, and only tasks whose `executor_id` matches the current project member through one main-process-only service. Creator-only, unassigned, and other-user tasks are excluded from views, counts, and automation. Access tokens refresh before expiry and after the first `401`, with concurrent refreshes sharing one request. Each remote project can be bound to one local Arckit project and explicitly allowed for auto-claiming. The global Auto-claim switch controls whether new work is claimed across those authorized projects, while Pause claiming temporarily freezes the next claim without stopping the active task. The queue contains only eligible `pending` tasks and sorts them by priority, pending time, project id, and task id.

Automation conditionally claims one task as `in_progress`, persists the remote-task/local-project/run association, and starts the existing Runtime loop. It never starts a second active task. After Runtime and ledger close with a complete handoff, it starts the direct commit agent and keeps the remote task `in_progress`; only a successful commit-agent run permits the `completed` writeback and selection of another task.

An active task can be switched to an interactive Codex CLI from the Command Center. Desktop first interrupts the Runtime and waits for its process to stop, then opens a visible terminal in the bound project with plain interactive `codex`, `$using-arckit`, the original todo intent, and the known Case id. The CLI does not inherit Runtime-internal threads. While CLI owns execution, the remote task stays `in_progress` and the queue remains frozen. “Resume automation” and Desktop startup read the fresh active/closed Case: an active agent-owned Case starts a fresh Runtime, a human handoff opens intervention, and a resolved Case skips directly to commit and completion writeback. Closing the terminal alone never marks the task complete.

Desktop startup reconciles local Run and canonical Case facts before task-source authentication. Store v8 persists separate Case, commit, and remote-completion checkpoints. If authentication is unavailable after a resolved Case, the UI reports “Case complete, waiting for remote closeout”; restoring authentication retries only the remote `completed` writeback and never repeats Runtime or an already completed commit agent.

Chat is not a permanent navigation surface. The Intervention Workbench loads the task message stream and evidence when a user reviews a run or the Runtime requires human input. High-frequency text, reasoning, and command deltas update an in-memory message; only semantic message snapshots are persisted and Renderer refresh notifications are coalesced. Read-only review has no composer; explicit intervention submits a steer or fresh continuation for the same active task. Recovery Center preserves state for claim, start, run, external-change, and completion-writeback failures.

Task source settings default to the production Workshop and NebulaAuth contracts used by Workshop Desktop. Credentials stay in the Electron main-process store; neither access nor refresh tokens are returned to Renderer. Logout clears the account-scoped remote snapshot while preserving local projects, bindings, run history, and proxy settings. Without a valid session, Desktop remains usable for local project registration and Runtime history but synchronization and automatic claiming stay disabled.

Empty projects are valid inputs. Adding a project initializes only `arckit/project`. The Controller selects one existing active Case for each Loop without writing Project selection state, or requests a new bounded Case; Runtime invokes the trusted `case_control` entrypoint only for creation, and the ledger allocates and atomically registers the Case id. Different Case Loops can execute concurrently, while canonical ledger commits serialize under a cross-process Project lock. Runtime does not invent a neutral Case, parse task keywords, or choose a first business gap.

Case creation snapshots `completion_review.max_autonomous_cycles` from `config/case-policy.json`. Once all content facets, questions, and handoffs are complete, the ledger exposes a `completion_review` gap instead of resolving the Case. Findings drive repair gaps and content revision changes; a clean review must cover the latest revision. If the last authorized autonomous review is still not clean, Runtime receives a human-only handoff and cannot auto-continue until a human reviews, disposes findings, or explicitly authorizes a bounded extension.

## Boundary

Runtime owns:

- project initialization
- state recovery
- round state machine
- loop frame compilation
- capability manifest loading
- Controller Agent planning/review schema enforcement
- worker packet creation from Controller Agent plans
- worker lifecycle
- compact semantic message storage and final activity projection
- report validation
- report reduction, Runtime Guard hard gates, Controller Agent closeout review, and ledger gate preparation
- artifact ownership classification
- source/projection gates
- ledger writeback

Workers own:

- bounded reading
- bounded implementation or diagnosis
- producing `arckit-worker-report/v2`

`requires_main_agent_decision=true` means the Controller Reducer must consume an internal decision request. It does not by itself stop closeout. Only `requires_human_decision=true` creates a human gate.

Desktop owns:

- project-sourced task observation and explicit local-workspace binding
- deterministic single-task automation controls, pause, interrupt, and recovery
- safe execution ownership handoff between Runtime and an interactive Codex CLI, reconciled through canonical Case State
- on-demand read-only review and human intervention for the active Runtime
- Controller/Worker progress, evidence, gate, and ledger visibility
- automatic ledger gate/writeback whenever an evidence-backed Case transition is gate-ready, including unresolved Cases that should continue
