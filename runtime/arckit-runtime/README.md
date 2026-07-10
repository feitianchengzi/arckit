# Arckit Runtime

Arckit Runtime is the control plane for state-driven agentic software development. It keeps loop control outside model prompts and treats Codex app-server as a bounded worker adapter.

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
  -> Controller Reducer
  -> Round Plan
  -> Worker Dispatch
  -> Report Intake
  -> Deterministic Merge
  -> Ledger Gate
  -> Ledger Writeback
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

In executing Codex mode, Runtime first asks a bounded Controller Agent for an `arckit-controller-plan/v1`.
The Controller Agent proposes the minimum worker route and role-scoped worker intents from project state,
candidate gaps, local evidence, and operator task. Runtime still owns final validation: it normalizes
the proposed route and validates schema, authorization, evidence, report intake, and ledger gates.
If the Controller plan is invalid, blocked, or unavailable, the round is blocked instead of silently using
a code-rule route or auto-adding missing workers. Dry-run mode does not start the Controller Agent, so it cannot fabricate worker packets.

After workers report, Runtime reduces report evidence into a deterministic Runtime Guard result before applying
Controller Review closeout. Controller Review may decide semantic `continue`, `needs_human`, or `blocked`, but it
cannot upgrade a round to `done` unless the Runtime Guard proves required reports, evidence, source/projection
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

Runtime scans capability manifests and exposes their metadata to the Controller Agent as a capability registry. The Controller chooses `worker_type`, `role`, and `allowed_skills` for each worker intent from the registry and current state gap. Runtime may inject the selected `$skill-name` triggers into the corresponding worker prompt, but it must not hard-code per-round workflow routes, fixed worker order, fixed skill sequences, or business-specific first gaps.

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

Empty projects are valid inputs. Adding a project initializes `arckit/project`, active case state, and the first project-discovery gap automatically.

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
- producing `arckit-worker-report/v1`

`requires_main_agent_decision=true` means the Controller Reducer must consume an internal decision request. It does not by itself stop closeout. Only `requires_human_decision=true` creates a human gate.

Desktop owns:

- human observation
- chat-driven task entry
- controller preview, execution authorization, pause, interrupt, continue
- evidence and gate visibility
- automatic ledger gate/writeback after eligible `round_result=done`
