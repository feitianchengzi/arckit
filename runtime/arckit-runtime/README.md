# Arckit Runtime

Arckit Runtime is the control plane for state-driven agentic software development. It keeps loop control outside model prompts and uses Codex app-server for bounded Controller and Worker turns.

## Product Shape

```text
Arckit Desktop
  project list, sessions, chat, live work, agent status, evidence, gates

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

- Left rail: projects, chats, runs.
- Center: continuous project chat and live work cards.
- Right rail: loop state, state gaps, controller packet, execution gate, worker status, merge gate, controls, raw events.

Sending a message when idle starts a controller round. Controller Preview shows the recoverable control frame without executing Controller Agent planning or workers. Run Codex asks the Controller Agent to plan the worker route, dispatches bounded workers, then asks the Controller Agent to review reports before merge and ledger gating. Running an existing packet authorizes that packet and still requires Controller Agent review after worker reports are collected. Sending a message while a run is active sends Controller input and interrupts the current execution so the next round can classify the correction or supplement. Stop interrupts the active Codex turn.

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

- human observation
- chat-driven task entry
- controller preview, execution authorization, pause, interrupt, continue
- evidence and gate visibility
- automatic ledger gate/writeback whenever an evidence-backed Case transition is gate-ready, including unresolved Cases that should continue
