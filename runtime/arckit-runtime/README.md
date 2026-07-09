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

Worker roles are selected by the dynamic route plan. Runtime does not trigger every role on every run.

Available roles include:

- `controller_state_reader`
- `controller_route_auditor`
- `source_fact_worker`
- `implementation_worker`
- `verification_worker`
- `closeout_controller`

For an empty or state-discovery project, the first execution route is source-fact establishment. Runtime must not start `implementation_worker` just because the user message says "build" or "develop"; implementation requires enough source facts, boundaries, and validation expectations to avoid product guessing.

Dry-run mode is Packet Preview: it generates controller frame, execution gate and worker packets without starting Codex or fabricating worker reports.

## Capability Manifests

Runtime reads `arckit.capability.json` manifests from core Arckit skills. `SKILL.md` remains human/agent guidance, but Runtime routing uses machine-readable capability metadata where available.

Capability manifests are routing and boundary metadata only. Runtime does not read `SKILL.md` bodies as control logic and does not inject skill bodies into worker prompts. Worker prompts list allowed skills as explicit `$skill-name` triggers so Codex-like Agents can use their own installed skill mechanism.

Current manifest-backed capabilities include:

- `using-arckit`
- `arckit-development-ledger`
- `arckit-implementation-handoff`
- `arckit-debug-diagnosis`
- `arckit-spec`
- `arckit-architecture-decision`

## Commands

Initialize an empty or existing local project:

```bash
node runtime/arckit-runtime/bin/arckit-runtime.mjs init-project --project .
```

Run an agentic preview:

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

Sending a message when idle starts a controller round. Packet Preview generates the execution packet and leaves `execution_gate=pending`. Run Packet authorizes the same packet and binds Desktop Runtime as executor. Sending a message while a run is active sends Controller input and interrupts the current execution so the next round can classify the correction or supplement. Stop interrupts the active Codex turn.

Empty projects are valid inputs. Adding a project initializes `arckit/project`, active case state, and the first project-discovery gap automatically.

## Boundary

Runtime owns:

- project initialization
- state recovery
- round state machine
- loop frame compilation
- capability manifest routing
- worker packet creation
- worker lifecycle
- event storage
- report validation
- controller reducer and deterministic merge
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
- packet preview, execution authorization, pause, interrupt, continue
- evidence and gate visibility
- automatic ledger gate/writeback after eligible `round_result=done`
