# Client-only completion review

Reviewed current implementation against accepted client-only contract (FACT-20260911-003-008) and realization evidence (FACT-20260911-003-010).

- Implementation correctness: findings. Response identity validation is correct and its current source digest matches client-only-verification.json. The Sheet omits organization identity and can hide the selected target when the search changes without clearing selection or disabling submission.
- Problem resolution: findings. Direct add exists, but the accepted pre-submit target clarity requirement is incomplete.
- Verification credibility: findings. 101 focused passing tests substantiate coordinator/flow behavior, and historical Electron evidence proves its listed UI checks. Neither checks organization identity or selected-target visibility after changing search. Historical PostgreSQL tests cover the withdrawn server patch only; they are not evidence of current server role enforcement.
- Regression risk: findings. A user may choose one member, filter to another name, and submit the now-hidden original selection. Existing stale-context and refresh recovery tests remain relevant and passing in recorded evidence.
- Minimality: clean. Fixed client command and adapter reuse existing API; service directory is clean. No need for server changes to address this finding.

## Finding: visible submission context

arckit/spec/agentic-software-development/arcorbit-organization-management.md requires organization, project and target member to be explicitly displayed before submission. In runtime/arcorbit/desktop/renderer/project-member-add.mjs, the title contains only project.name, the lead is generic, search filters visible candidate rows independently of state.selected, and confirm.disabled depends on selected being nonempty rather than visible. The search handler only calls render; it neither clears selection nor renders a separate selected-target summary. renderer.js passes project and account context but no explicit organization display context. Thus the selected target can disappear while Add remains enabled, and the organization is absent from the dialog.

Reproduction from source: load candidates A and B; select A; search B; A radio is absent, state.selected still A, Add enabled; submit sends A organization_member_id. This finding is based on code-path inspection, not a claimed new GUI run.

Suggested acceptance: dialog always displays target organization/project and selected member independent of filtering, or invalidates hidden selection; exercise this path in actual Renderer validation. Keep server unchanged.

No implementation edits or new test runs in this review. Review evidence was checked against current coordinator SHA-256 and empty service Git status.
