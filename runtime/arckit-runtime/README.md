# Arckit Runtime

Arckit Runtime is the control plane for state-driven agentic software development. It keeps loop control outside model prompts and uses Codex app-server for bounded Controller and Worker turns.

## Product Shape

```text
Arckit Desktop
  current-user projects, server tasks, automation queue, on-demand intervention, evidence, recovery

Arckit Runtime
  runtime kernel, controller reducer, round state machine, artifact ownership map, ledger gate, ledger writeback

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

Each run now produces:

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

In executing Codex mode, Runtime first invokes the manifest-declared `$using-arckit` Agent skill in a bounded Controller turn and asks for an `arckit-controller-plan/v2`.
The Controller Agent proposes the minimum worker route—including a valid zero-Worker route—and role-scoped worker intents from project state,
candidate gaps, local evidence, and operator task. Runtime still owns final validation: it normalizes
the proposed route and validates schema, authorization, evidence, report intake, and ledger gates.
If the Controller plan is invalid, blocked, or unavailable, the round is blocked instead of silently using
a code-rule route or auto-adding missing workers. Dry-run mode does not start the Controller Agent, so it cannot fabricate worker packets.

The same `$using-arckit` invocation is used for Controller Review after worker reports arrive, or immediately when operator input and existing stable facts already supply enough evidence. Runtime supplies the state/context envelope, capability registries, output schema, and hard constraints; the loaded skill remains the semantic source for planning, report intake, and closeout. Runtime does not keep a second copy of that Controller workflow in prompt templates.

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

Manifests also declare how Runtime invokes a capability. Controller phases use the Agent-native `$using-arckit` trigger. Project initialization and ledger writeback resolve repository-trusted `runtime_entrypoints` from `arckit-development-ledger`; entrypoints cannot escape the skill directory, and a target project's same-id manifest cannot shadow the repository implementation. Runtime retains deterministic schema, authorization, path, lifecycle, and ledger hard gates, while the skill owns ledger scripts and semantic writeback. No copied ledger scripts live under Runtime.

Every accepted transition binds `case_updated_at` and the complete selected candidate gap. The gate delegates canonical transition validation to the ledger capability, rejects stale Controller frames, and the ledger commits Case, Project, iteration, projections, and indexes with rollback on failure. Auto continuation always starts from a fresh state read and stops on no progress or `--max-auto-rounds`.

The Controller chooses `worker_type`, `role`, and `allowed_skills` for each worker intent only from the filtered Worker registry and current state gap. Controller and Runtime capabilities remain visible as protocol/service context but cannot be bound to Workers. The policy file is the explicit capability-selection boundary; Runtime kernel code remains generic and does not hard-code per-round workflow routes, fixed worker order, fixed skill sequences, or business-specific first gaps. Runtime injects selected `$skill-name` triggers only after policy and manifest binding checks. A Controller plan or existing packet with a Controller, Runtime, unknown, or unavailable Worker capability fails closed instead of silently dropping the invalid ID.

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

Authorize and run an existing preview packet:

```bash
node runtime/arckit-runtime/bin/arckit-runtime.mjs run \
  --project . \
  --packet-file result.json \
  --adapter codex-app-server \
  --stream-events \
  --supervise-stdin
```

Saved packets carry the Case revision and complete selected gap. Runtime rejects them before Worker execution if the Case, Project selection, or gap has changed; it does not migrate old packets.

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

The Command Center synchronizes the current Workshop user, projects, and project-owned tasks through a main-process-only adapter. Each remote project can be bound to one local Arckit project and explicitly opted into automation. The queue contains only eligible `pending` tasks and sorts them by priority, pending time, project id, and task id.

Automation conditionally claims one task as `in_progress`, persists the remote-task/local-project/run association, and starts the existing Runtime loop. It never starts a second active task. After Runtime and ledger close with a complete handoff, it writes the remote task as `completed` before selecting another task.

Chat is not a permanent navigation surface. The Intervention Workbench loads transcript and evidence when a user reviews a run or the Runtime requires human input. Read-only review has no composer; explicit intervention submits a steer or fresh continuation for the same active task. Recovery Center preserves state for claim, start, run, external-change, and completion-writeback failures.

Task source settings support the Workshop `/workshop/v1/user` contract used by Workshop Desktop. Credentials stay in the Electron main-process store and the access token is never returned to Renderer. Without a configured task source, Desktop remains usable for local project registration and Runtime history but automatic claiming stays disabled.

Empty projects are valid inputs. Adding a project initializes `arckit/project` and one neutral active Case whose unresolved facets are exposed as `candidate_gaps`. Runtime does not choose a first business gap; the Controller selects one from the current Case facts and operator intent.

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
- event storage
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
- on-demand read-only review and human intervention for the active Runtime
- Controller/Worker progress, evidence, gate, and ledger visibility
- automatic ledger gate/writeback whenever an evidence-backed Case transition is gate-ready, including unresolved Cases that should continue
