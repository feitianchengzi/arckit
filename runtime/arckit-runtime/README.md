# Arckit Runtime

Arckit Runtime automates the work a person normally performs around one continuous Codex conversation. It does not replace the Codex Agent's semantic reasoning, workspace execution, native skill discovery, validation, or Git capability.

## Runtime boundary

The Runtime kernel owns:

- task-source synchronization, claiming, and remote closeout;
- Project/Case snapshot reads and serial one-gap loop scheduling;
- one persistent Codex thread binding per todo;
- process-restart recovery through `thread/resume`;
- deterministic schema, revision, authorization, and ledger gates;
- trusted `arckit-development-ledger` entrypoint invocation;
- token/context telemetry, same-thread compaction, lifecycle tracing, and operator intervention;
- same-thread final validation, repair, and Git closeout.

The Codex Agent owns:

- selecting one active Case and one current candidate gap;
- interpreting the gap and repository facts;
- choosing any Codex-discoverable installed skills and tools;
- editing, building, testing, diagnosing, and self-reviewing;
- returning one evidence-backed Case control, Case transition, or responsibility handoff.

Runtime capability policy contains exactly two explicit bindings:

- `using-arckit`: the natural `$using-arckit` Agent entry trigger;
- `arckit-development-ledger`: trusted deterministic Case control/writeback entrypoints.

Runtime has no fixed skill routing, skill allowlist for gap execution, execution-role registry, predicted path scope, or separate planning/review/commit Agent pipeline.

## One todo, one Codex thread

The first Agent invocation starts a non-ephemeral Codex thread. Runtime writes the opaque thread id to its task binding file before starting the first turn. Every later gap, validation, repair, completion review, and Git closeout uses the same thread.

After a process or Desktop restart, the binding file is loaded before spawning Runtime and app-server calls `thread/resume`. A missing persisted thread is the only condition that permits a replacement thread; transient resume failures remain recoverable errors instead of silently discarding context.

After each successful ledger transition, Runtime projects the ledger-owned round closeout, then reads the latest request's context utilization. At 80% or above it runs Codex compaction on the same loaded thread and records the compaction. It then uses the closeout's post-commit token with the trusted ledger snapshot entrypoint; only a verified fresh-read can continue to the next gap.

There is no wall-clock limit, productive-round limit, or long-command watchdog. The configured automatic-round value is only a consecutive no-progress recovery budget and resets after deterministic ledger progress.

## State-driven loop

```text
claim todo
-> load or establish persistent thread binding
-> read the trusted ledger snapshot and persisted candidate catalog
-> invoke $using-arckit once for one gap
-> Agent compares persisted/fresh candidates, executes, verifies, and returns a structured claim
-> Runtime validates and calls trusted ledger writeback
-> inspect context usage and compact at >= 80%
-> show canonical round closeout
-> verify a post-commit fresh-read and continue automatically
-> when Case is resolved, use the same thread for final checks and Git commit
-> complete the remote todo
```

Automatic execution pauses only for an explicit human-responsibility handoff. External waits and recoverable Runtime failures are reported with their actual responsibility and recovery action; they are not mislabeled as human decisions.

## Prompt contract

Each gap turn begins with the manifest-declared natural trigger:

```text
$using-arckit
```

The remaining input is a compact invocation containing the original user intent on the first turn, the current continuation increment, fresh canonical Project/Case facts, revisions, locale, and execution authorization. If canonical records do not satisfy the manifest-declared ledger protocol, Runtime passes the typed compatibility result to the same Agent thread instead of terminating before Agent execution; the Agent owns semantic reconciliation and the trusted ledger entrypoint owns freshness, validation, and atomic writeback. Runtime does not locate or read Codex-installed `SKILL.md` files, compare installed skill versions or directory drift, duplicate skill contents, inject a second skill input item, list other installed skills, or encode which skill the Agent should choose.

Codex structured output uses `schemas/agent-loop-result.schema.json`. Runtime persists semantic activity rather than raw prompt transcripts or high-frequency deltas.

## CLI

Dry-run the current repository:

```bash
node runtime/arckit-runtime/bin/arckit-runtime.mjs run \
  --project . \
  --task "Advance the next evidence-backed Case gap" \
  --dry-run \
  --json
```

Run with Codex app-server and a durable task binding:

```bash
node runtime/arckit-runtime/bin/arckit-runtime.mjs run \
  --project /path/to/project \
  --task "Implement and verify the confirmed todo" \
  --task-id TASK-123 \
  --thread-binding-file /path/to/runtime-data/thread-bindings/TASK-123.json \
  --adapter codex-app-server \
  --stream-events \
  --json
```

Resume explicitly when an existing thread id is already known:

```bash
node runtime/arckit-runtime/bin/arckit-runtime.mjs run \
  --project /path/to/project \
  --task-id TASK-123 \
  --thread-id THREAD-ID \
  --adapter codex-app-server \
  --json
```

Probe app-server compatibility:

```bash
npm --prefix runtime/arckit-runtime run probe:app-server
```

Run verification:

```bash
npm --prefix runtime/arckit-runtime run check
```

## Desktop recovery and observability

Desktop persists active-task checkpoints for Case identity, thread identity, closeout state, and remote completion state. Canonical Case state remains in the project ledger; Runtime execution records and thread bindings remain in Desktop-owned data.

Lifecycle traces cover readiness, task claim, Agent turns, commands, ledger application, compaction, same-thread closeout, and remote completion. Traces contain bounded identifiers and timings, not prompt text, command arguments, environment values, credentials, or hidden reasoning.

The Workbench shows the bound Codex thread, current Agent Loop result, token/cache totals, context pressure and compactions, command timing, ledger state, and Git closeout result.
