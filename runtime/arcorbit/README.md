# ArcOrbit

ArcOrbit automates the work a person normally performs around one continuous Codex conversation. It does not replace the Codex Agent's semantic reasoning, workspace execution, native skill discovery, validation, or Git capability.

ArcOrbit is source-available under the [PolyForm Perimeter License 1.0.1](LICENSE). Personal, team, and enterprise internal use and modification are permitted. Providing a product or service that competes with ArcOrbit is not permitted, even when provided free of charge. Commercial, OEM, white-label, and competing-use licensing inquiries may be sent to `hi@feitianchengzi.com`.

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

### Codex executable discovery on Windows

ArcOrbit accepts both native `codex.exe` executables and npm-installed `codex.cmd` shims. Resolution is fail-closed: every candidate must exist and complete `--version` successfully before Desktop stores it for Chat or Automation. Windows candidates are evaluated in this order:

1. the explicit `ARCORBIT_CODEX_BIN` override (`ARCKIT_CODEX_BIN` remains a legacy fallback);
2. `codex.exe` or `codex.cmd` found through `PATH`;
3. the conventional `%APPDATA%\npm\codex.cmd` npm shim;
4. the standalone installer candidates under `%USERPROFILE%\.local\bin`;
5. versioned Codex Desktop runtimes under `%LOCALAPPDATA%\OpenAI\Codex\bin\<runtime>\codex.exe`, newest first, followed by the unversioned `bin\codex.exe` fallback.

After ArcOrbit installs, updates, or explicitly migrates Codex, the immediate fresh discovery temporarily prefers the standalone candidates so the operation succeeds only if the managed executable is actually selected. Codex Desktop runtimes are reported as `desktop-runtime`; they remain eligible for explicit standalone migration but never for ArcOrbit-managed in-place updates.

Native executables launch directly. Command shims launch through a non-interactive Windows PowerShell boundary that transports the executable path and argument array in environment-backed JSON, preserving `app-server` and `--stdio` as separate arguments without interpolating them into a shell command. ArcOrbit does not execute binaries directly from the access-controlled `Program Files\WindowsApps` package directory.

The Desktop runtime fallback lets ArcOrbit work when Codex Desktop is installed and has prepared its per-user runtime but no standalone CLI is installed. That location is treated as a discovered, version-probed candidate rather than a guaranteed OpenAI installation contract. If neither a CLI nor a runnable Desktop runtime is present, Setup Readiness remains blocked and asks the user to install or repair Codex instead of starting a Loop that cannot initialize app-server.

Dry-run the current repository:

```bash
node runtime/arcorbit/bin/arcorbit.mjs run \
  --project . \
  --task "Advance the next evidence-backed Case gap" \
  --dry-run \
  --json
```

Run with Codex app-server and a durable task binding:

```bash
node runtime/arcorbit/bin/arcorbit.mjs run \
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
node runtime/arcorbit/bin/arcorbit.mjs run \
  --project /path/to/project \
  --task-id TASK-123 \
  --thread-id THREAD-ID \
  --adapter codex-app-server \
  --json
```

Probe app-server compatibility:

```bash
npm --prefix runtime/arcorbit run probe:app-server
```

Run verification:

```bash
npm --prefix runtime/arcorbit run check
```

## Local provider and Runtime build

With `arckit` and `arcforge` checked out as sibling directories and dependencies already installed in both repositories, run this command from the Arckit repository root:

```bash
npm --prefix runtime/arcorbit run package:local
```

The command validates both repositories, builds `../arcforge`'s embedded provider, binds its local-only version, manifest and SHA-256 into Runtime resources, smoke-tests the packaged provisioning payload, and builds the current host's unsigned installer. Supported hosts are macOS arm64/x64, Windows x64 and Linux x64. Provider artifacts are written to `../arcforge/release/provider-release`; Runtime resources and installers are written to `runtime/arcorbit/dist-package` and `runtime/arcorbit/release`.

For a faster development loop that prepares and verifies `dist-package/resources` without invoking Electron Builder:

```bash
npm --prefix runtime/arcorbit run package:local -- --resources-only
npm --prefix runtime/arcorbit run desktop
```

Use `--arcforge-root <path>` when ArcForge is not the sibling checkout, and `--build-id <id>` when a stable local identifier is useful; build IDs follow SemVer prerelease identifier rules. Local outputs are explicitly versioned as `local`, always use signing mode `disabled`, and are development-validation artifacts only. They are not substitutes for immutable-tagged artifacts from the governed manual packaging workflows.

## Desktop recovery and observability

Desktop persists active-task checkpoints for Case identity, thread identity, closeout state, and remote completion state. Canonical Case state remains in the project ledger; Runtime execution records and thread bindings remain in Desktop-owned data.

Lifecycle traces cover readiness, task claim, Agent turns, commands, ledger application, compaction, same-thread closeout, and remote completion. Traces contain bounded identifiers and timings, not prompt text, command arguments, environment values, credentials, or hidden reasoning.

The Workbench shows the bound Codex thread, current Agent Loop result, token/cache totals, context pressure and compactions, command timing, ledger state, and Git closeout result.

## Governed installer packages

The repository workflow `.github/workflows/arcorbit-package.yml` is manually dispatched. The operator chooses an existing immutable `tf/vx.x.x-bN`, `beta/vx.x.x-rcN`, or `appstore/vx.x.x` tag, one installer target (or all), the signing gate, an exact ArcForge provider release, and its SHA-256. The workflow validates the selected tag commit, package version, active `release/*` baseline, and higher release lines. It never creates or moves a branch or tag.

Every installer carries three independently verifiable resources outside ASAR:

- trusted Runtime capability manifests and ledger entrypoints;
- the complete governed Arckit skill payload and its source/content manifest;
- the exact `arcforge-embedded-provider/v1` package selected by release tag and digest.

The application package also carries the ArcOrbit license and third-party notices. The governed Arckit skill payload carries the Apache License 2.0 with each independently distributed skill.

On startup, Desktop's main process validates those resources and fresh-checks every local Product Workspace in the Desktop Store against the packaged skill payload before Automation can start. With no local workspace it remains a global-only check; the last Renderer project filter never narrows the startup scope. Setup Readiness opens when any associated project needs installation, has drift, or contains a conflict. It stages the packaged payload into the app data source store and only applies a provider plan after the user expands the target summary and confirms the plan digest. Changed managed targets and loader conflicts are never overwritten; `managed-stale` removal uses a separate path-bound confirmation.

Automation task starts have an independent Setup Readiness preflight in addition to the existing Runtime project/capability preflight. A later drift therefore routes back to setup instead of letting the Runtime Kernel infer or repair Codex skill discovery itself.

The embedded `distribution-lock.json` binds those inputs before packaging. Because a file cannot contain its own final digest, each completed installer also has an external `distribution-attestation.json` that binds the installer SHA-256 to the embedded lock digest; the downloadable `checksums.txt` sits beside the installers so its relative filenames verify directly. Actions artifacts are always retained; attaching them to a GitHub Release requires the explicit `draft-release` option and never publishes or mutates an already published release.

For a private ArcForge repository, configure the minimal read-only `ARCFORGE_READ_TOKEN` repository secret. Target signing secrets live in the workflow-selected `internal`, `beta`, or `appstore` GitHub Environment. `required` applies to macOS packaging and needs `MAC_CSC_LINK`, `MAC_CSC_KEY_PASSWORD`, and either `APPLE_API_KEY_BASE64` plus its key ID/issuer/team ID or the Apple ID credential set. The API-key secret contains the base64-encoded `.p8` bytes; the macOS job validates and decodes them into an owner-only file under `RUNNER_TEMP`, exports only that temporary path as `APPLE_API_KEY`, and prefers API-key authentication when both credential sets exist. Windows and Linux packages are currently built and attested as unsigned regardless of the macOS signing gate. The governed workflow defaults to `required`; `disabled` remains an explicit unsigned macOS internal-test choice, while `auto` records and verifies a macOS signature only when credentials were available.
