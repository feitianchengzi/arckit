# Direct project member addition completion review

Reviewed CASE-20260911-003 content revision 2 against the supplied trusted snapshot. Selected completion-review:1; no implementation or canonical record edits in this review.

## Finding: success response identity is not verified

Priority: P2. Kind: omission. Responsibility: agent.

The accepted technical contract at arckit/tech/arcorbit/platform-composition-solution.md requires validating the successful response project_id and user_id against the selected project and organization member before synchronizing governance projections. directMemberAction in runtime/arcorbit/src/platform-coordinator.mjs returns completed for any resolved addProjectMember response. The adapter returns the response without identity validation, and createMemberAddFlow trusts completed. The Renderer refresh callback checks snapshot errors and account identity but does not verify that the selected target is present.

A deterministic reproduction using the production coordinator and flow returns an empty response, then a response for project 999/user 888 when project 11/user 17 was selected. Both enter done and publish the success message. See review-response-identity.json. Refresh was a successful substitute; this demonstrates missing validation, not actual misrouting by the deployed service.

Required repair after trusted acceptance: validate the successful response against the captured project and target user, treat absent/mismatched identity as an unconfirmed mutation outcome, and test valid, empty, and mismatched responses plus reconciliation. Do not blindly retry an uncertain write.

## Five dimensions

- Implementation correctness: findings. Successful mutation identity validation is missing.
- Problem resolution: findings. The normal path is implemented, but the UI can report that the selected member joined without a response confirming that identity.
- Verification credibility: findings. Existing PostgreSQL and Electron evidence remains valid within its documented scope. Coordinator/flow fixtures accept incomplete success objects and omit negative response identity coverage.
- Regression risk: findings. Incorrect success feedback can hide an incomplete operation; existing authorization, transaction, pagination and stale-context evidence does not cover this boundary.
- Minimality: clean. Feature changes stay within the existing handler, adapter, coordinator and governance UI; unrelated Engineering work is outside this review. No new framework or state owner is needed for repair.

## Invariant assessment

- product-expectations-remain-recoverable: upheld. The product specification clearly defines server-confirmed addition and independent invitations.
- interaction-expectations-remain-recoverable: upheld. The interaction specification preserves confirmation, uncertain-result reconciliation and refresh-only recovery requirements; implementation nonconformance is identified above.
- visual-language-remains-consistent: upheld. The module uses existing dialog, field, list and button styles. Prior Electron evidence covers focus restoration; no new theme is introduced.
- technical-decisions-remain-explainable: upheld. The technical contract explicitly states response identity validation; the durable expectation needs no revision.
- accepted-facts-are-realized: threatened. Accepted facts FACT-20260911-003-004 and FACT-20260911-003-006 require confirmed, identity-correct success; the reproduction demonstrates a missing check. Required open obligation is the repair derived from this review finding.
- material-risks-have-credible-evidence: threatened. FACT-20260911-003-007 documents valid existing tests, but those tests do not establish response identity safety. Required open obligation is the same repair and negative tests.

## Submission blocker

No honest valid semantic review command can currently express the two threatened judgments in this state. All ordinary Case gaps are closed. The trusted installed semantic-case-command.mjs allocates local:review-finding handles only as review-finding, resolves judgment gap_refs strictly as existing Case gaps or explicitly added local gaps, and projectedCaseSets does not include review-derived gaps. Completion Review simultaneously prohibits gaps_added and other Case content mutations. case-transition.mjs derives finding repair gaps later during applyReview.

Confirmed by reading the installed capability at /Applications/arcorbit.app/Contents/Resources/arcorbit/trusted-capabilities/arckit-development-ledger/scripts/semantic-case-command.mjs (createReferenceResolver, materializeAssessment, projectedCaseSets, validateAssessmentAgainstProjectedCase), as well as the repository copy and case-transition.mjs applyReview. This is a source-inspected representational blocker, not an observed write rejection; no write was attempted.

Required external action: provide a trusted protocol path for review findings to support threatened invariant judgments, including their derived open repair obligations, then fresh-read and submit this review. Do not allocate canonical IDs in Agent output or label threatened realization as upheld to bypass the restriction. Current invocation forbids protocol recovery and ordinary ledger writes, so neither was attempted.

## Evidence scope

Reviewed production handler, adapter, coordinator, Renderer integration, member-add module, focused tests, PostgreSQL test and existing implementation-verification.json/Electron result. The normal-path test evidence is retained, not rerun because no implementation changed. No deployment, installed-package validation or real account mutation occurred.
