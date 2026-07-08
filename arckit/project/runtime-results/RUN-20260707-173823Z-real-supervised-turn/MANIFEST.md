# Real Codex Supervised Turn Evidence

Status: blocked
Selected gap: GAP-runtime-real-supervised-turn
Adapter: codex-app-server
Codex home: /private/tmp/arckit-codex-home

## Files

- result.json: primary supervised runtime envelope.
- events.jsonl: primary supervised event stream and app-server stderr.
- interrupt-probe-result.json: separate supervised run used to exercise `/interrupt`.
- interrupt-probe-events.jsonl: interrupt probe event stream and app-server stderr.

## Validation

- `npm run check` passed in `runtime/arckit-runtime`.
- `CODEX_HOME=/private/tmp/arckit-codex-home node runtime/arckit-runtime/bin/arckit-runtime.mjs probe-app-server --project . --json` passed.
- Primary supervised run executed in `mode=execute` with `adapter=codex-app-server` and selected `GAP-runtime-real-supervised-turn`.
- Primary event stream included `codex.turn.started`, `runtime.operator.steer.sent`, `codex.turn.completed`, and `runtime.result`.
- Interrupt probe included `runtime.operator.interrupt.sent` and completed with turn status `interrupted`.
- `validate-result --file /private/tmp/arckit-runtime-real-supervised.json` passed structurally.
- `gate-result --project . --file /private/tmp/arckit-runtime-real-supervised.json --json` blocked ledger writeback because the runtime result was `round_result=blocked` and had no inner validation evidence.
- `write-ledger --project . --file /private/tmp/arckit-runtime-real-supervised.json --dry-run --json` produced no write plan for the same gate reasons.

## Blocker

The primary Codex turn could not complete a model response in this sandbox. The app-server stderr records repeated network failures to `https://api.openai.com/v1/responses` with `Operation not permitted`, and the final turn error was `stream disconnected before completion`.

This proves the app-server event stream plus `/steer` and `/interrupt` control paths, but it does not prove the full accepted loop because no `round_result=done` runtime result was produced.
