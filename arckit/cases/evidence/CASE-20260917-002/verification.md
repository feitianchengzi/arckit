# ArcOrbit synchronization amplification

## Scope and diagnosis

The user authorized optimization of the diagnosed duplicate project loads and renderer refresh amplification. This does not claim every real-device stall is resolved, and does not change remote ownership, access, automation gates or visual design.

Before the change, Thing sync called reconcile and then refreshProject for every catalog entry. Projects in background demand therefore loaded twice. The previous actual-renderer isolation probe with 1,000 synthetic tasks also recorded snapshot/detail counts increasing from 1/1 to 2/2 after an unrelated connection-status event, and from 2/2 to 4/4 when another status event arrived during a delayed refresh. This demonstrates request amplification, not real-browser frame timing.

## Single reconciliation scope

Work Sync accepts a one-shot catalog scope or additional project IDs, unions/deduplicates against accessible projects, and preserves requests queued during a running generation. Thing consumes that result and surfaces its errors without a second project refresh loop. Background subscriptions and periodic demand retain their existing scope.

Validation: `node --test runtime/arcorbit/test/work-sync-coordinator.test.mjs runtime/arcorbit/test/project-workbench.test.mjs` — 33 passed, zero failures. Tests assert one task/tag call per accessible project, exclusion of inaccessible IDs, retained healthy results on partial failure, wider queued scope, single Workbench delegation, degraded error propagation, existing session-epoch rejection and existing demand-union behavior. A writable task-local TMPDIR was used because this environment has no /tmp directory.

## Fact maintenance

document_scope: change; updated `arckit/tech/arcorbit/project-workbench-solution.md` and `arckit/tech/INDEX.md`. Existing Workbench domain owns this contract; no new domain or split is needed. The solution remains below the splitting threshold.

fact_result: arckit-fact-result/v2; managed_case; CASE-20260917-002; GAP-20260917-002-001; updated. Single catalog reconciliation is the accepted technical contract, supported by the user-authorized optimization, coordinator implementation and the tests above. No human decision required.

## Content versus health refresh

The actual Thing surface now ignores health-only notifications for data loading. Legacy renderer subscriptions update health locally through the same pure realtime projection used by Work Sync. Workbench content invalidations coalesce; unrelated-project and unchanged Automation snapshots reuse selected detail, while selected-project changes, explicit actions and periodic reads still confirm attachments. Failed detail reads invalidate the reuse key. Account scope, selection epoch, deletion, execution and child changes remain relevant. A successful Thing snapshot updates shell sync health without legacy Platform reads.

The actual surface tests observe these cumulative snapshot/detail read counts: baseline 1/1; three health notifications 1/1; unrelated-project content plus Automation notification 2/1; another unchanged Automation event 3/1; selected-project content 4/2; explicit refresh 5/3. Status-only events cause zero additional reads. These tests use deterministic timers and real production rendering code with an isolated DOM and mock service data, not a real Chromium frame-rate benchmark.

The production render dispatcher is executed with instrumented render callbacks and confirms only the visible workspace renders. Its actual Work Sync subscription is executed with instrumented callbacks and confirms health events never schedule data reads, while content and error events do. Tests cover delayed selected-detail responses, per-task draft preservation, identity changes, removed tasks, same-key failure retry and in-flight invalidation.

Final focused command: `node --test runtime/arcorbit/test/workbench-refresh.test.mjs runtime/arcorbit/test/project-workbench-shell.test.mjs runtime/arcorbit/test/workbench-activity-sync.test.mjs runtime/arcorbit/test/desktop-renderer.test.mjs runtime/arcorbit/test/work-sync-coordinator.test.mjs runtime/arcorbit/test/project-workbench.test.mjs runtime/arcorbit/test/workshop-realtime-adapter.test.mjs runtime/arcorbit/test/automation-coordinator.test.mjs runtime/arcorbit/test/platform-coordinator.test.mjs` — 209 passed, zero failures/skips. Production syntax scan and `git diff --check` passed. Electron is not installed in this environment, so window layout, actual frame timings and packaged-app performance are not claimed. List virtualization and changes to polling cadence are outside this evidence-backed optimization.

No temporary product instrumentation was added. The earlier probe log was deleted, and a search for its `ARC_DEBUG:arcorbit-sync-probe` marker in product code and debug output found no remainder.

document_scope: change; updated `arckit/tech/arcorbit/project-workbench-solution.md`, `arckit/tech/arcorbit/realtime-synchronization-solution.md`, and `arckit/tech/INDEX.md`. Both existing domains retain their boundaries; neither needs splitting.

fact_result: arckit-fact-result/v2; managed_case; CASE-20260917-002; GAP-20260917-002-002; updated. Health/content separation, scoped detail invalidation, single-flight continuation and visible-page rendering are the accepted technical contract; evidence is the implementation and reproducible tests above. No human decision required.

## Review finding repair

The independent review added a previously missing activity-filter test and reproduced the local render-reuse regression. Detail repaint dependencies now include the activity filter while the Activity tab is visible. Task-only, execution-only and all-events switching succeeds with snapshot/detail counts remaining 1/1. The same focused suite above now reports **210 passed, zero failures/skips**. Syntax and diff checks pass. This supersedes the pre-review test count and closes the regression identified in `review.md`; it does not change the real-browser performance limitation.
