# CASE-20260912-001 verification

## Accepted behavior

- Desktop settings normalize Codex preferences into independent `chat` and `automation` Model/Level pairs.
- A valid legacy flat `settings.codex.model/reasoning_effort` pair initializes both scene pairs; later writes preserve scene isolation.
- A new Chat draft inherits the Chat defaults. Model/Level edits beside the Composer persist with that draft or session and do not update Automation defaults.
- Chat captures an immutable Model/Level snapshot when a message is accepted. Later Composer edits affect only a later turn, while the session keeps the same thread.
- Automation reads only the Automation pair at Run creation and persists the selected Model/Level on the Run.

## Verification receipts

- Syntax checks for the changed main-process, store, coordinator and Renderer modules: passed.
- Focused state, migration, Chat and Automation suite: 62 passed, 0 failed.
- Real Electron settings and Chat Composer behavior: 1 passed, 0 failed. This covers two scene groups, model-specific suggestions, unknown manual values, save/reopen, failure draft retention, new-chat default inheritance and Composer draft persistence.
- The two pre-existing Electron suites that aborted when the first full suite launched Electron processes concurrently passed in isolation: 2 passed, 0 failed.
- Full ArcOrbit test inventory rerun with `--test-concurrency=1`: exit code 0 for all 737 tests (706 passed, 31 skipped, 0 failed).
- `git diff --check`: passed.

## Evidence boundaries

The Electron tests use the existing deterministic Codex catalog and IPC fixture; they verify the real Renderer and preload behavior without claiming live account authorization for any model. Packaging, signing and external service behavior are unchanged by this Case.
