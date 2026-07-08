# Arckit Runtime

Arckit Runtime is the control layer for supervised Arckit loops. It keeps loop control outside the agent and uses the agent as a bounded worker.

M0 implements a dry-run runtime:

- reads `arckit/project/state.record.json`
- reads the active iteration, case index, pending index, spec index, and tech index when present
- selects the highest-priority `state_gaps` item
- compiles a supervised agent prompt
- creates and validates a sample `arckit-runtime-result/v1`

M1 connects the same control contract to Codex app-server events:

- probes Codex app-server JSON-RPC over stdio
- starts a Codex thread and turn through the adapter
- maps app-server notifications into normalized runtime events
- streams events as JSONL with `--stream-events`
- accepts operator controls with `--supervise-stdin`
- sends `/steer <text>` through `turn/steer`
- sends `/interrupt` through `turn/interrupt`

M3 starts the desktop control surface:

- registers local Arckit projects
- presents a three-column project / chat / state workspace
- uses the center chat as the primary task and continuation surface
- starts dry-run or Codex app-server runtime turns from chat messages
- turns messages sent during active work into steer controls
- shows normalized loop events and Arckit state gaps
- runs gate-result and write-ledger from the completed run

## Commands

Run a dry-run round from this package:

```bash
npm run smoke
```

Run from the repository root:

```bash
node runtime/arckit-runtime/bin/arckit-runtime.mjs run --project . --task "inspect the next runtime gap" --dry-run
```

Write machine-readable output:

```bash
node runtime/arckit-runtime/bin/arckit-runtime.mjs run --project . --dry-run --json
```

Validate a runtime result JSON file:

```bash
node runtime/arckit-runtime/bin/arckit-runtime.mjs validate-result --file result.json
```

Gate a runtime result before any ledger write:

```bash
node runtime/arckit-runtime/bin/arckit-runtime.mjs gate-result \
  --project . \
  --file result.json \
  --json
```

Preview ledger writeback:

```bash
node runtime/arckit-runtime/bin/arckit-runtime.mjs write-ledger \
  --project . \
  --file result.json \
  --dry-run \
  --json
```

Apply ledger writeback after the gate allows it:

```bash
node runtime/arckit-runtime/bin/arckit-runtime.mjs write-ledger \
  --project . \
  --file result.json \
  --json
```

Writeback is intentionally narrow. It only writes when `gate-result` allows the runtime result, then updates the project state, active iteration, active case, indexes, and an immutable runtime execution record under `arckit/project/runtime-results/`.

Probe local Codex app-server without starting a model turn:

```bash
node runtime/arckit-runtime/bin/arckit-runtime.mjs probe-app-server --project . --json
```

Start a supervised Codex turn:

```bash
node runtime/arckit-runtime/bin/arckit-runtime.mjs run \
  --project . \
  --task "continue the active Arckit runtime case" \
  --adapter codex-app-server \
  --stream-events \
  --supervise-stdin
```

While the turn is running, type one of these into stdin:

```text
/steer revise the current approach and only update the runtime adapter
/interrupt
```

`probe-app-server` may need access to the local Codex state under `~/.codex`; in a sandboxed agent session this can require explicit approval.

## Desktop Client

Install dependencies once from `runtime/arckit-runtime`:

```bash
npm install
```

Start the desktop client:

```bash
npm run desktop
```

The desktop client stores its local project registry and run history under Electron `userData`. It does not replace the runtime. It launches the same `bin/arckit-runtime.mjs` commands behind the UI, so terminal and desktop runs use the same state selection, prompt contract, event stream, gate engine and ledger writer.

Desktop surface:

- Left: local project list and recent runs for the selected project.
- Left: project chats and recent runs for the selected chat. A chat is the conversation; a run is one execution attempt inside that chat.
- Center: continuous project conversation. Sending a message starts a new runtime turn when idle, or steers the active run when work is running.
- Right: loop state, top state gap, priority dimensions, run controls, gate/write actions and normalized events.

Desktop workflow:

1. Add a local project folder that already contains `arckit/project/state.record.json`.
2. Create or select a chat.
3. Send a message in the center chat.
4. Start either a dry run or a Codex app-server run.
5. Watch loop state and events in the right rail.
6. Send another chat message while work is active to steer the run, or press Stop to interrupt.
7. After the run finishes, use Gate, Preview Ledger, then Write Ledger when the gate allows it.

For Codex app-server runs, the app still depends on local Codex credentials and network access in the environment where the Electron app is launched.

## Runtime Boundary

The runtime owns:

- project state loading
- state gap selection
- prompt compilation
- artifact impact scan enforcement
- source-projection check enforcement
- loop handoff validation
- future ledger writeback
- app-server protocol supervision
- gate decisions before writeback
- controlled project, iteration, and case ledger writeback

The agent owns:

- bounded repository reading
- bounded implementation or diagnosis work
- producing a structured runtime result

The agent does not own the loop decision.
