# Repair source upgrade drift conflict recovery

Case: CASE-20260815-002
Status: closed
Artifact Type: mixed
Selected Gap: none
Updated: 2026-08-15T11:45:08.176Z

## User Intent

Confirm whether SOURCE_UPGRADE_CONFLICT is a valid safety check and make the packaged Setup Readiness flow provide an actionable, safe recovery path instead of only exit or retry.

## Structured Record

```json
{
  "schema_version": "development-case-record/v5",
  "id": "CASE-20260815-002",
  "title": "Repair source upgrade drift conflict recovery",
  "status": "closed",
  "artifact_type": "mixed",
  "created_at": "2026-08-15T10:52:32.878Z",
  "updated_at": "2026-08-15T11:45:08.176Z",
  "user_intent": "Confirm whether SOURCE_UPGRADE_CONFLICT is a valid safety check and make the packaged Setup Readiness flow provide an actionable, safe recovery path instead of only exit or retry.",
  "expected_outcome": "Source upgrade drift is classified correctly, user changes remain protected, and every recoverable conflict state offers an explicit repair or preservation action with verified convergence.",
  "project_state_ref": "arckit/project/state.record.json",
  "current_round": {
    "goal": "",
    "selected_gap": null
  },
  "facts": [
    {
      "id": "FACT-SOURCE-UPGRADE-CONFLICT-001",
      "revision": 1,
      "status": "accepted",
      "statement": "A user running the latest GitHub-packaged Arckit installer encounters SOURCE_UPGRADE_CONFLICT during source-upgrade with full rollback; the UI says the old source is preserved and only offers exit or retry, so the user cannot repair or deliberately resolve the drift in-product.",
      "basis": "Direct user report including the exact error code, phase, rollback status, and available UI actions.",
      "evidence": [
        "user report: SOURCE_UPGRADE_CONFLICT at source-upgrade, rollback complete, only exit and retry available"
      ]
    },
    {
      "id": "FACT-SOURCE-UPGRADE-CONFLICT-002",
      "revision": 1,
      "status": "superseded",
      "statement": "On the reported machine, b7 upgrades from an older payload with one valid saved relation. The new packaged ArcForge provider reports five user-on-demand skills missing because it resolves flat catalog paths while the relation records and actual installed skills use source-key-namespaced paths; it also reports the relationship-proven arcforge-on-demand loader changed because the packaged provider owns a newer loader payload. These are provider-version migration effects, not evidence that the user edited those six targets.",
      "basis": "Direct execution of SkillProvisioningManager and the packaged provider against the installed current source, relation record and target directories produced the exact SOURCE_UPGRADE_CONFLICT and detailed file/policy drift.",
      "evidence": [
        "runtime/arckit-runtime/src/skill-provisioning-manager.mjs",
        "../arcforge/src/core/skill-availability-drift.ts",
        "../arcforge/src/provider/index.ts",
        "verification: installed b7 current payload 71fc447f differs from desired d13929d6 and has one saved relation",
        "verification: five catalog skills exist at recorded source-key-namespaced paths while new-provider currentPaths are flat",
        "verification: arcforge-on-demand target is recognized as managed-update by the new provider plan"
      ]
    },
    {
      "id": "FACT-SOURCE-UPGRADE-CONFLICT-003",
      "revision": 1,
      "status": "accepted",
      "statement": "SOURCE_UPGRADE_CONFLICT is thrown during check before a new-payload plan is retained; blockedSnapshot removes distribution, plan and drift projections and sets can_apply false, while the Renderer shows apply only when can_apply and otherwise leaves only recheck and exit. Recheck repeats the same deterministic condition, so the packaged UI has no convergence path.",
      "basis": "The manager error path, snapshot projection, Renderer action visibility and direct installed-state reproduction match every reported UI symptom and retry result.",
      "evidence": [
        "runtime/arckit-runtime/src/skill-provisioning-manager.mjs",
        "runtime/arckit-runtime/desktop/renderer/renderer.js",
        "runtime/arckit-runtime/desktop/renderer/index.html",
        "verification: reproduced blocked snapshot has plan null, drift null, can_apply false, can_continue false and rollback_complete true"
      ]
    },
    {
      "id": "FACT-SOURCE-UPGRADE-CONFLICT-002",
      "revision": 2,
      "status": "accepted",
      "statement": "On the reported machine, b7 upgrades from an older payload with one valid saved relation. Five user-on-demand targets are absent at both their relation-recorded source-key-namespaced paths and the new provider's flat catalog paths, so they are genuinely missing managed targets; the new provider also changes their destination policy. The arcforge-on-demand target exists with different content and is classified by the new plan as relationship-proven managed-update. All seven ambient Arckit skill targets match the old source. Therefore SOURCE_UPGRADE_CONFLICT detects non-clean state, but its single blocking class conflates repairable missing targets and provider-owned migration with potentially unsafe user-authored content changes.",
      "basis": "Direct old-path and new-path existence checks, the saved relation, packaged provider plan/drift and target content comparison agree; this supersedes the inaccurate claim that legacy catalog content still existed.",
      "evidence": [
        "../arcforge/src/core/skill-availability-drift.ts",
        "../arcforge/src/core/skill-availability.ts",
        "../arcforge/src/provider/index.ts",
        "runtime/arckit-runtime/src/skill-provisioning-manager.mjs",
        "verification: relation records five legacy source-key catalog paths and all five are absent",
        "verification: packaged drift counts changed 1, missing 5, same 7",
        "verification: loader target exists and new plan classifies it as managed-update"
      ]
    },
    {
      "id": "FACT-SOURCE-UPGRADE-RECOVERY-CONTRACT",
      "revision": 1,
      "status": "accepted",
      "statement": "Setup Readiness source upgrades use ArcForge Core/provider typed assessment. Relationship-proven missing targets and provable provider destination, policy or shared-loader migrations enter a confirmable repair/upgrade plan; existing content that differs from a last-applied digest and legacy managed targets without sufficient digest evidence require file diff plus an explicit backup-and-restore or preserve-and-exit disposition; unmanaged conflicts are never overwritten. Successful apply atomically covers source, targets, catalog, loader, relationship migration and approved backups, while check-only failures report that no write started.",
      "basis": "The contract follows the corrected installed-state diagnosis, preserves user content, keeps provisioning semantics in ArcForge Core and supplies an in-product convergence path for every recoverable class.",
      "evidence": [
        "arckit/spec/arckit-runtime-distribution.md",
        "arckit/interaction/setup-readiness/interaction.md",
        "arckit/interaction/setup-readiness/default.html",
        "arckit/tech/arckit-runtime/installer-supply-chain.md"
      ]
    },
    {
      "id": "FACT-SOURCE-UPGRADE-RECOVERY-IMPLEMENTED",
      "revision": 1,
      "status": "accepted",
      "statement": "ArcForge now provides capability-gated typed source-upgrade assessment, last-applied target evidence and transactional backup-and-restore. Arckit Runtime consumes it, includes relationship-proven migration cleanup in confirmed apply, reports write state and exposes repair/migrate, backup/restore and preserve/exit actions. The installed b7 state evaluates as five managed repairs plus six managed migrations with canProceed true instead of SOURCE_UPGRADE_CONFLICT.",
      "basis": "Implementation inspection, provider and Runtime tests, provider package construction, full checks and direct read-only evaluation of the installed b7 state agree.",
      "evidence": [
        "../arcforge/src/provider/index.ts",
        "../arcforge/src/core/sources.ts",
        "../arcforge/src/shared/types.ts",
        "../arcforge/tests/provider.test.mjs",
        "runtime/arckit-runtime/src/skill-provisioning-manager.mjs",
        "runtime/arckit-runtime/desktop/renderer/renderer.js",
        "runtime/arckit-runtime/scripts/prepare-distribution.mjs",
        "runtime/arckit-runtime/test/skill-provisioning-manager.test.mjs",
        "runtime/arckit-runtime/test/desktop-renderer.test.mjs",
        "runtime/arckit-runtime/test/package-distribution.test.mjs",
        "verification: ArcForge 61/61 plus TypeScript check passed",
        "verification: Runtime 186 passed, 1 skipped, 0 failed",
        "verification: provider package declares source-upgrade-recovery/v1",
        "verification: installed b7 read-only assessment reports managed-repair 5, managed-migration 6, canProceed true and writeState not_started",
        "verification: diff and temporary-debug-marker audits passed"
      ]
    },
    {
      "id": "FACT-SOURCE-UPGRADE-OWNERSHIP-BOUNDARY",
      "revision": 1,
      "status": "accepted",
      "statement": "Policy migration ownership now transfers only to a missing new destination. A pre-existing changed new destination is unmanaged and cannot be backed up or overwritten by the provider. Existing legacy recorded destinations are compared with relation evidence or the verified old source and become managed migration only when unchanged; otherwise they require preservation.",
      "basis": "Focused provider logic and regression tests exercise missing migration, changed unowned new paths and legacy unverified content.",
      "evidence": [
        "../arcforge/src/provider/index.ts",
        "../arcforge/tests/provider.test.mjs",
        "verification: provider test rejects changed new-path content as unmanaged-conflict"
      ]
    },
    {
      "id": "FACT-SOURCE-UPGRADE-DIFF-PROJECTION",
      "revision": 1,
      "status": "accepted",
      "statement": "Source-upgrade assessment now preserves per-file drift details from provider comparison through the public Runtime snapshot, and Setup Readiness renders each affected relative path and status under its typed conflict item.",
      "basis": "Provider, Runtime and Renderer tests exercise the same file-level evidence projection.",
      "evidence": [
        "../arcforge/src/provider/index.ts",
        "runtime/arckit-runtime/src/skill-provisioning-manager.mjs",
        "runtime/arckit-runtime/desktop/renderer/renderer.js",
        "runtime/arckit-runtime/test/desktop-renderer.test.mjs"
      ]
    }
  ],
  "state_impacts": [
    {
      "id": "IMPACT-SOURCE-UPGRADE-RECOVERY",
      "fact_id": "FACT-SOURCE-UPGRADE-CONFLICT-001",
      "fact_revision": 1,
      "target": {
        "kind": "software_decision",
        "ref": "experience_and_interaction",
        "revision": 9
      },
      "effect": "upheld",
      "reason": "The interaction source and wireframe define visible drift classes, affected targets and actionable repair, backup/restore, exit and external-recovery paths.",
      "gap_ids": [],
      "evidence": [
        "arckit/interaction/setup-readiness/interaction.md",
        "arckit/interaction/setup-readiness/default.html"
      ]
    },
    {
      "id": "IMPACT-SOURCE-UPGRADE-PROVIDER-MIGRATION",
      "fact_id": "FACT-SOURCE-UPGRADE-CONFLICT-002",
      "fact_revision": 2,
      "target": {
        "kind": "software_decision",
        "ref": "technical_foundation",
        "revision": 13
      },
      "effect": "upheld",
      "reason": "The technical solution assigns typed upgrade assessment, relation digests and migration semantics to ArcForge Core/provider while Runtime remains a bounded projection and orchestration adapter.",
      "gap_ids": [],
      "evidence": [
        "arckit/tech/arckit-runtime/installer-supply-chain.md"
      ]
    },
    {
      "id": "IMPACT-SOURCE-UPGRADE-REALIZATION",
      "fact_id": "FACT-SOURCE-UPGRADE-DIFF-PROJECTION",
      "fact_revision": 1,
      "target": {
        "kind": "software_invariant",
        "ref": "accepted-facts-are-realized",
        "revision": null
      },
      "effect": "upheld",
      "reason": "The recovery contract, ownership boundary and user-visible conflict evidence are implemented across provider, Runtime and Renderer.",
      "gap_ids": [],
      "evidence": [
        "../arcforge/src/provider/index.ts",
        "runtime/arckit-runtime/src/skill-provisioning-manager.mjs",
        "runtime/arckit-runtime/desktop/renderer/renderer.js",
        "verification: focused provider and Runtime tests passed"
      ]
    },
    {
      "id": "IMPACT-SOURCE-UPGRADE-PRODUCT-CAPABILITY",
      "fact_id": "FACT-SOURCE-UPGRADE-RECOVERY-CONTRACT",
      "fact_revision": 1,
      "target": {
        "kind": "software_decision",
        "ref": "product_capabilities",
        "revision": 7
      },
      "effect": "upheld",
      "reason": "The product capability now explicitly includes typed, actionable source-upgrade reconciliation.",
      "gap_ids": [],
      "evidence": [
        "arckit/spec/arckit-runtime-distribution.md",
        "arckit/interaction/setup-readiness/interaction.md"
      ]
    }
  ],
  "gaps": [
    {
      "id": "GAP-DIAGNOSE-SOURCE-UPGRADE-CONFLICT",
      "status": "resolved",
      "goal": "Establish whether SOURCE_UPGRADE_CONFLICT is correctly detecting unsafe drift and identify the exact missing recovery capabilities across the provisioning contract, implementation, and Setup Readiness UI.",
      "reason": "A safe fix depends on distinguishing expected protection of user-modified sources from false-positive drift and on knowing which recovery actions the current backend can support.",
      "derived_from": [
        "case_intent",
        "FACT-SOURCE-UPGRADE-CONFLICT-001"
      ],
      "blocked_by": [],
      "priority_basis": {
        "blocking": "high",
        "uncertainty": "high",
        "risk": "high",
        "user_impact": "high"
      },
      "responsibility": "agent",
      "evidence_required": [
        "Source-upgrade decision-path evidence, conflict metadata/UI action evidence, and a verified diagnosis that preserves user-owned changes."
      ],
      "resolution": {
        "id": "GAP-DIAGNOSE-SOURCE-UPGRADE-CONFLICT",
        "status": "resolved",
        "outcome": "The safety principle is valid, but the observed b7 conflict is a false positive: the new ArcForge provider reinterprets the old saved relation using a new catalog destination scheme and a new managed loader payload, so provider-owned migration appears as five missing skills plus one changed loader before the Runtime can preview the new Arckit payload. The blocked snapshot then discards plan/drift details and exposes no resolution action.",
        "reason": "A direct check against the installed b7 resources reproduced the exact error, and a direct packaged-provider drift report showed all five missing entries still present at their recorded namespaced catalog paths while the changed loader is relationship-proven and marked managed-update by the plan.",
        "evidence": [
          "runtime/arckit-runtime/src/skill-provisioning-manager.mjs",
          "runtime/arckit-runtime/desktop/renderer/renderer.js",
          "runtime/arckit-runtime/desktop/renderer/index.html",
          "../arcforge/src/core/skill-availability-drift.ts",
          "../arcforge/src/provider/index.ts",
          "arckit/spec/arckit-runtime-distribution.md",
          "arckit/interaction/setup-readiness/interaction.md",
          "verification: installed Arckit Runtime 0.1.0-tf.b7 reproduced SOURCE_UPGRADE_CONFLICT with changed 1, missing 5, managed-stale 0",
          "verification: packaged provider reported five catalog destination changes from recorded source-key namespaces to flat catalog paths and one relationship-proven managed loader update"
        ],
        "occurred_at": "2026-08-15T10:57:46.772Z"
      }
    },
    {
      "id": "GAP-DEFINE-SOURCE-UPGRADE-RECOVERY",
      "status": "resolved",
      "goal": "Establish a durable source-upgrade recovery contract that distinguishes user-authored content drift from provider-owned relation, catalog and loader migrations, and defines the actionable Setup Readiness choices and preservation evidence for each class.",
      "reason": "Implementation scope and safe confirmation behavior depend on an accepted classification and recovery contract; the current specification promises recovery but does not define provider-version migration or a UI action for this blocked state.",
      "derived_from": [
        "FACT-SOURCE-UPGRADE-CONFLICT-002",
        "FACT-SOURCE-UPGRADE-CONFLICT-003",
        "GAP-DIAGNOSE-SOURCE-UPGRADE-CONFLICT"
      ],
      "blocked_by": [],
      "priority_basis": {
        "blocking": "high",
        "uncertainty": "medium",
        "risk": "high",
        "user_impact": "high"
      },
      "responsibility": "agent",
      "evidence_required": [
        "Durable product, interaction and technical recovery semantics covering provider migration, genuine local edits, missing managed targets, diff visibility, explicit actions, transaction/rollback behavior and convergence acceptance."
      ],
      "resolution": {
        "id": "GAP-DEFINE-SOURCE-UPGRADE-RECOVERY",
        "status": "resolved",
        "outcome": "Source upgrades now have a durable typed contract: managed-repair and provable managed-migration enter a confirmable plan; local-content-conflict and legacy unverified-managed targets require diff plus explicit backup/restore or exit; unmanaged-conflict is never overwritten. ArcForge Core owns classification/migration, provider exposes it by capability, Runtime projects it, and check-only states report not-written instead of rollback.",
        "reason": "Product, interaction source and wireframe projection, and technical architecture agree on classes, evidence, user actions, freshness, ownership and transaction/rollback boundaries, and all maintained indexes are synchronized.",
        "evidence": [
          "arckit/spec/arckit-runtime-distribution.md",
          "arckit/spec/INDEX.md",
          "arckit/spec/_map/feature-matrix.md",
          "arckit/interaction/setup-readiness/interaction.md",
          "arckit/interaction/setup-readiness/default.html",
          "arckit/interaction/INDEX.md",
          "arckit/interaction/_map/feature-matrix.md",
          "arckit/tech/arckit-runtime/installer-supply-chain.md",
          "arckit/tech/INDEX.md",
          "arckit/tech/_map/feature-matrix.md",
          "verification: git diff --check passed and all maintained INDEX line counts match"
        ],
        "occurred_at": "2026-08-15T11:06:34.592Z"
      }
    },
    {
      "id": "GAP-CORRECT-SOURCE-UPGRADE-DIAGNOSIS",
      "goal": "Correct the accepted source-upgrade diagnosis to distinguish actually missing managed catalog targets, provider path migration, and the managed loader mismatch without claiming absent legacy content still exists.",
      "reason": "A direct existence check contradicted the prior fact, and downstream recovery semantics must not be based on inaccurate target state.",
      "derived_from": [
        "FACT-SOURCE-UPGRADE-CONFLICT-002",
        "verification: legacy catalog targets missing"
      ],
      "blocked_by": [],
      "priority_basis": {
        "blocking": "high",
        "uncertainty": "low",
        "risk": "high",
        "user_impact": "high"
      },
      "responsibility": "agent",
      "evidence_required": [
        "Direct old/new target existence evidence, saved-relation evidence, packaged-provider classification and a superseding fact."
      ],
      "status": "resolved",
      "resolution": {
        "id": "GAP-CORRECT-SOURCE-UPGRADE-DIAGNOSIS",
        "status": "resolved",
        "outcome": "The observed conflict contains five genuinely missing managed catalog targets, a provider policy migration from legacy namespaced destinations to flat destinations, and one changed relationship-proven loader target; no managed ambient Arckit skill target is changed. The current check correctly notices non-clean state but incorrectly treats every non-clean class as an unsafe user-content conflict with no repair action.",
        "reason": "Direct filesystem checks show both legacy and flat catalog targets absent; the saved relation proves their managed history, and the packaged plan separately marks the loader as managed-update while old drift reports its content changed.",
        "evidence": [
          "../arcforge/src/core/skill-availability-drift.ts",
          "../arcforge/src/core/skill-availability.ts",
          "runtime/arckit-runtime/src/skill-provisioning-manager.mjs",
          "verification: all five relation-recorded legacy catalog directories are absent",
          "verification: packaged drift reports five missing catalog targets and one changed loader while seven ambient Arckit skill targets are same",
          "verification: packaged plan classifies arcforge-on-demand as managed-update"
        ],
        "occurred_at": "2026-08-15T11:01:33.531Z"
      }
    },
    {
      "id": "GAP-IMPLEMENT-SOURCE-UPGRADE-RECOVERY",
      "status": "resolved",
      "goal": "Implement and verify the accepted typed source-upgrade assessment, managed repair/migration, content backup-and-restore, Setup Readiness actions and check/apply write-state reporting across ArcForge Core/provider and Arckit Runtime/Desktop.",
      "reason": "The accepted contract is not realized by the current single SOURCE_UPGRADE_CONFLICT path, blocked snapshot or Renderer actions.",
      "derived_from": [
        "FACT-SOURCE-UPGRADE-RECOVERY-CONTRACT",
        "FACT-SOURCE-UPGRADE-CONFLICT-002",
        "FACT-SOURCE-UPGRADE-CONFLICT-003"
      ],
      "blocked_by": [],
      "priority_basis": {
        "blocking": "high",
        "uncertainty": "low",
        "risk": "high",
        "user_impact": "high"
      },
      "responsibility": "agent",
      "evidence_required": [
        "Core/provider contract and migration tests; Runtime Manager, IPC and Renderer tests; exact reported b7-state reproduction converging without silent overwrite; full repository checks and clean temporary-debug-marker audit."
      ],
      "resolution": {
        "id": "GAP-IMPLEMENT-SOURCE-UPGRADE-RECOVERY",
        "status": "resolved",
        "outcome": "Typed assessment replaces the single pre-plan conflict gate. Managed missing/path/loader migrations enter reviewed apply; changed managed content can be backed up and restored; unmanaged content stays protected; Setup Readiness shows classes, actions and write state.",
        "reason": "Both repositories pass full checks, dedicated tests and package construction pass, and the actual installed b7 state is wholly repairable managed drift.",
        "evidence": [
          "../arcforge/src/provider/index.ts",
          "../arcforge/tests/provider.test.mjs",
          "runtime/arckit-runtime/src/skill-provisioning-manager.mjs",
          "runtime/arckit-runtime/desktop/renderer/renderer.js",
          "runtime/arckit-runtime/test/skill-provisioning-manager.test.mjs",
          "runtime/arckit-runtime/test/desktop-renderer.test.mjs",
          "runtime/arckit-runtime/test/package-distribution.test.mjs",
          "verification: full checks and installed b7 assessment passed"
        ],
        "occurred_at": "2026-08-15T11:31:17.573Z"
      }
    },
    {
      "id": "CASE-20260815-002:review-finding:CR-UNMANAGED-NEW-PATH",
      "status": "resolved",
      "goal": "Resolve review finding: A policy migration currently treats a changed pre-existing new destination as managed when only the old recorded destination is relationship-owned, allowing silent overwrite of unmanaged content.",
      "reason": "error found by completion review",
      "derived_from": [
        "completion_review",
        "content_revision:4"
      ],
      "blocked_by": [],
      "priority_basis": {
        "blocking": "high",
        "risk": "high"
      },
      "responsibility": "agent",
      "evidence_required": [
        "../arcforge/src/provider/index.ts",
        "code review: policyProvesMigration does not require the unowned current target to be missing"
      ],
      "resolution": {
        "id": "CASE-20260815-002:review-finding:CR-UNMANAGED-NEW-PATH",
        "status": "resolved",
        "outcome": "Changed content at an unowned new policy path is now an unmanaged conflict; only missing new paths inherit migration proof, and recorded legacy content is digest/source checked before migration.",
        "reason": "Focused provider tests cover both the safe missing-path migration and the conflicting pre-existing new-path boundary.",
        "evidence": [
          "../arcforge/src/provider/index.ts",
          "../arcforge/tests/provider.test.mjs",
          "verification: provider targeted test passed"
        ],
        "occurred_at": "2026-08-15T11:38:03.304Z"
      }
    },
    {
      "id": "CASE-20260815-002:review-finding:CR-CONFLICT-DIFF-PROJECTION",
      "status": "resolved",
      "goal": "Resolve review finding: Typed content conflicts project only path and reason; file-level drift evidence is not carried through provider assessment and Runtime snapshot to the Setup Readiness UI.",
      "reason": "omission found by completion review",
      "derived_from": [
        "completion_review",
        "content_revision:4"
      ],
      "blocked_by": [],
      "priority_basis": {
        "blocking": "high",
        "risk": "high"
      },
      "responsibility": "agent",
      "evidence_required": [
        "../arcforge/src/provider/index.ts",
        "runtime/arckit-runtime/src/skill-provisioning-manager.mjs",
        "runtime/arckit-runtime/desktop/renderer/renderer.js",
        "code review: ProvisioningUpgradeItem and publicUpgradeAssessment omit DriftItem.files"
      ],
      "resolution": {
        "id": "CASE-20260815-002:review-finding:CR-CONFLICT-DIFF-PROJECTION",
        "status": "resolved",
        "outcome": "File-level missing, changed and unexpected evidence now reaches Setup Readiness for each typed source-upgrade conflict.",
        "reason": "Focused tests verify provider assessment, Runtime public projection and Renderer output.",
        "evidence": [
          "../arcforge/src/provider/index.ts",
          "runtime/arckit-runtime/src/skill-provisioning-manager.mjs",
          "runtime/arckit-runtime/desktop/renderer/renderer.js",
          "verification: focused provider and Runtime tests passed"
        ],
        "occurred_at": "2026-08-15T11:39:27.046Z"
      }
    }
  ],
  "content_revision": 6,
  "completion_review": {
    "status": "clean",
    "policy": {
      "initial_max_cycles": 10,
      "source": "runtime/arckit-runtime/config/case-policy.json",
      "snapshotted_at": "2026-08-15T10:52:32.878Z"
    },
    "additional_cycles_authorized": 0,
    "cycle_count": 2,
    "reviewed_content_revision": 6,
    "dimensions": {
      "implementation_correctness": "clean",
      "problem_resolution": "clean",
      "verification_credibility": "clean",
      "regression_risk": "clean",
      "minimality": "clean"
    },
    "findings": [],
    "cycles": [
      {
        "cycle": 1,
        "autonomous_cycle": 1,
        "reviewer": "agent",
        "outcome": "findings",
        "content_revision": 4,
        "dimensions": {
          "implementation_correctness": "findings",
          "problem_resolution": "clean",
          "verification_credibility": "findings",
          "regression_risk": "findings",
          "minimality": "clean"
        },
        "finding_ids": [
          "CR-UNMANAGED-NEW-PATH",
          "CR-CONFLICT-DIFF-PROJECTION"
        ],
        "evidence": [
          "../arcforge/src/provider/index.ts",
          "runtime/arckit-runtime/src/skill-provisioning-manager.mjs",
          "runtime/arckit-runtime/desktop/renderer/renderer.js",
          "review: targeted ownership and interaction-contract inspection"
        ],
        "occurred_at": "2026-08-15T11:33:39.403Z"
      },
      {
        "cycle": 2,
        "autonomous_cycle": 2,
        "reviewer": "agent",
        "outcome": "clean",
        "content_revision": 6,
        "dimensions": {
          "implementation_correctness": "clean",
          "problem_resolution": "clean",
          "verification_credibility": "clean",
          "regression_risk": "clean",
          "minimality": "clean"
        },
        "finding_ids": [],
        "evidence": [
          "arckit/spec/arckit-runtime-distribution.md",
          "arckit/interaction/setup-readiness/interaction.md",
          "arckit/interaction/setup-readiness/default.html",
          "arckit/tech/arckit-runtime/installer-supply-chain.md",
          "../arcforge/src/core/sources.ts",
          "../arcforge/src/provider/index.ts",
          "../arcforge/tests/provider.test.mjs",
          "runtime/arckit-runtime/src/skill-provisioning-manager.mjs",
          "runtime/arckit-runtime/desktop/main.mjs",
          "runtime/arckit-runtime/desktop/preload.cjs",
          "runtime/arckit-runtime/desktop/renderer/renderer.js",
          "runtime/arckit-runtime/test/skill-provisioning-manager.test.mjs",
          "runtime/arckit-runtime/test/desktop-renderer.test.mjs",
          "runtime/arckit-runtime/test/package-distribution.test.mjs",
          "verification: ArcForge full test suite passed 61 of 61 and both TypeScript checks passed",
          "verification: Runtime full check passed 186, failed 0, skipped 1",
          "verification: actual b7 read-only assessment reported canProceed true, writeState not_started, managed-repair 5 and managed-migration 6",
          "verification: both repositories git diff --check and trusted Project, Iteration and Case validation passed"
        ],
        "occurred_at": "2026-08-15T11:45:08.176Z"
      }
    ],
    "evidence": [
      "../arcforge/src/provider/index.ts",
      "runtime/arckit-runtime/src/skill-provisioning-manager.mjs",
      "runtime/arckit-runtime/desktop/renderer/renderer.js",
      "review: targeted ownership and interaction-contract inspection",
      "arckit/spec/arckit-runtime-distribution.md",
      "arckit/interaction/setup-readiness/interaction.md",
      "arckit/interaction/setup-readiness/default.html",
      "arckit/tech/arckit-runtime/installer-supply-chain.md",
      "../arcforge/src/core/sources.ts",
      "../arcforge/tests/provider.test.mjs",
      "runtime/arckit-runtime/desktop/main.mjs",
      "runtime/arckit-runtime/desktop/preload.cjs",
      "runtime/arckit-runtime/test/skill-provisioning-manager.test.mjs",
      "runtime/arckit-runtime/test/desktop-renderer.test.mjs",
      "runtime/arckit-runtime/test/package-distribution.test.mjs",
      "verification: ArcForge full test suite passed 61 of 61 and both TypeScript checks passed",
      "verification: Runtime full check passed 186, failed 0, skipped 1",
      "verification: actual b7 read-only assessment reported canProceed true, writeState not_started, managed-repair 5 and managed-migration 6",
      "verification: both repositories git diff --check and trusted Project, Iteration and Case validation passed"
    ],
    "escalation": null,
    "human_authorizations": []
  },
  "open_questions": [],
  "decisions": [],
  "pending_handoffs": [],
  "process_notes": [],
  "rounds": [
    {
      "round": 1,
      "transition_schema_version": "arckit-case-transition/v8",
      "goal": "Reproduce the installed b7 path, compare the old relation and targets with the old payload through the packaged provider, and trace how the blocked snapshot is rendered.",
      "outcome": "completed",
      "gap_selection": {
        "mode": "candidate",
        "basis": "The source-upgrade conflict blocks the latest packaged application, has high user impact, and must be diagnosed before any safe overwrite or migration behavior can be chosen.",
        "snapshot_token": "aa28581a95341f53cd5839aa8e3fcfabecfcaaa83830cdd51e48c02360ff8446",
        "selected_ref": "case-gap:CASE-20260815-002:GAP-DIAGNOSE-SOURCE-UPGRADE-CONFLICT",
        "comparison_summary": "Selected the ready source-upgrade diagnosis Gap; deferred the four case-required Project gaps because none explains or unblocks this installed-package failure.",
        "fresh_discovery_summary": "No additional ready fresh candidate existed at selection time; diagnosis subsequently exposed a provider-version migration and recovery-contract obligation for a later fresh-read round.",
        "considered": [
          {
            "ref": "project-gap:GAP-agent-scenario-evaluation",
            "source": "persisted",
            "eligibility": "case_required",
            "disposition": "deferred",
            "priority_basis": {
              "uncertainty": "high",
              "risk": "high"
            },
            "reason": "Requires a separate scenario-evaluation Case and does not unblock the installed application."
          },
          {
            "ref": "project-gap:GAP-runtime-resilience-and-adapters",
            "source": "persisted",
            "eligibility": "case_required",
            "disposition": "deferred",
            "priority_basis": {
              "risk": "high",
              "urgency": "medium"
            },
            "reason": "Broader Runtime resilience remains separate from the bounded Setup Readiness upgrade conflict."
          },
          {
            "ref": "project-gap:GAP-security-real-project-validation",
            "source": "persisted",
            "eligibility": "case_required",
            "disposition": "excluded",
            "priority_basis": {
              "risk": "high",
              "urgency": "medium"
            },
            "reason": "The reported failure does not involve credentials or permission-bearing external resources."
          },
          {
            "ref": "project-gap:GAP-cross-record-audit",
            "source": "persisted",
            "eligibility": "case_required",
            "disposition": "deferred",
            "priority_basis": {
              "risk": "high",
              "urgency": "high"
            },
            "reason": "Cross-record auditing does not determine the installed provisioning conflict or recovery actions."
          },
          {
            "ref": "case-gap:CASE-20260815-002:GAP-DIAGNOSE-SOURCE-UPGRADE-CONFLICT",
            "source": "persisted",
            "eligibility": "ready",
            "disposition": "selected",
            "priority_basis": {
              "blocking": "high",
              "uncertainty": "high",
              "risk": "high",
              "user_impact": "high"
            },
            "reason": "It directly establishes whether the safety check is valid and which backend/UI capabilities are missing before a repair can be safely defined."
          }
        ]
      },
      "selected_gap": {
        "id": "GAP-DIAGNOSE-SOURCE-UPGRADE-CONFLICT",
        "responsibility": "agent",
        "goal": "Establish whether SOURCE_UPGRADE_CONFLICT is correctly detecting unsafe drift and identify the exact missing recovery capabilities across the provisioning contract, implementation, and Setup Readiness UI.",
        "reason": "A safe fix depends on distinguishing expected protection of user-modified sources from false-positive drift and on knowing which recovery actions the current backend can support.",
        "derived_from": [
          "case_intent",
          "FACT-SOURCE-UPGRADE-CONFLICT-001"
        ],
        "blocked_by": [],
        "priority_basis": {
          "blocking": "high",
          "uncertainty": "high",
          "risk": "high",
          "user_impact": "high"
        },
        "evidence_required": [
          "Source-upgrade decision-path evidence, conflict metadata/UI action evidence, and a verified diagnosis that preserves user-owned changes."
        ]
      },
      "planned_transition": {
        "goal": "Reproduce the installed b7 path, compare the old relation and targets with the old payload through the packaged provider, and trace how the blocked snapshot is rendered.",
        "expected_state_change": "Resolve the diagnosis Gap with an evidence-backed classification of the check and one bounded downstream recovery-contract Gap."
      },
      "accepted_state_delta": {
        "resolved_gap": {
          "id": "GAP-DIAGNOSE-SOURCE-UPGRADE-CONFLICT",
          "status": "resolved",
          "outcome": "The safety principle is valid, but the observed b7 conflict is a false positive: the new ArcForge provider reinterprets the old saved relation using a new catalog destination scheme and a new managed loader payload, so provider-owned migration appears as five missing skills plus one changed loader before the Runtime can preview the new Arckit payload. The blocked snapshot then discards plan/drift details and exposes no resolution action.",
          "reason": "A direct check against the installed b7 resources reproduced the exact error, and a direct packaged-provider drift report showed all five missing entries still present at their recorded namespaced catalog paths while the changed loader is relationship-proven and marked managed-update by the plan.",
          "evidence": [
            "runtime/arckit-runtime/src/skill-provisioning-manager.mjs",
            "runtime/arckit-runtime/desktop/renderer/renderer.js",
            "runtime/arckit-runtime/desktop/renderer/index.html",
            "../arcforge/src/core/skill-availability-drift.ts",
            "../arcforge/src/provider/index.ts",
            "arckit/spec/arckit-runtime-distribution.md",
            "arckit/interaction/setup-readiness/interaction.md",
            "verification: installed Arckit Runtime 0.1.0-tf.b7 reproduced SOURCE_UPGRADE_CONFLICT with changed 1, missing 5, managed-stale 0",
            "verification: packaged provider reported five catalog destination changes from recorded source-key namespaces to flat catalog paths and one relationship-proven managed loader update"
          ]
        },
        "facts_added": [
          {
            "id": "FACT-SOURCE-UPGRADE-CONFLICT-002",
            "revision": 1,
            "status": "accepted",
            "statement": "On the reported machine, b7 upgrades from an older payload with one valid saved relation. The new packaged ArcForge provider reports five user-on-demand skills missing because it resolves flat catalog paths while the relation records and actual installed skills use source-key-namespaced paths; it also reports the relationship-proven arcforge-on-demand loader changed because the packaged provider owns a newer loader payload. These are provider-version migration effects, not evidence that the user edited those six targets.",
            "basis": "Direct execution of SkillProvisioningManager and the packaged provider against the installed current source, relation record and target directories produced the exact SOURCE_UPGRADE_CONFLICT and detailed file/policy drift.",
            "evidence": [
              "runtime/arckit-runtime/src/skill-provisioning-manager.mjs",
              "../arcforge/src/core/skill-availability-drift.ts",
              "../arcforge/src/provider/index.ts",
              "verification: installed b7 current payload 71fc447f differs from desired d13929d6 and has one saved relation",
              "verification: five catalog skills exist at recorded source-key-namespaced paths while new-provider currentPaths are flat",
              "verification: arcforge-on-demand target is recognized as managed-update by the new provider plan"
            ]
          },
          {
            "id": "FACT-SOURCE-UPGRADE-CONFLICT-003",
            "revision": 1,
            "status": "accepted",
            "statement": "SOURCE_UPGRADE_CONFLICT is thrown during check before a new-payload plan is retained; blockedSnapshot removes distribution, plan and drift projections and sets can_apply false, while the Renderer shows apply only when can_apply and otherwise leaves only recheck and exit. Recheck repeats the same deterministic condition, so the packaged UI has no convergence path.",
            "basis": "The manager error path, snapshot projection, Renderer action visibility and direct installed-state reproduction match every reported UI symptom and retry result.",
            "evidence": [
              "runtime/arckit-runtime/src/skill-provisioning-manager.mjs",
              "runtime/arckit-runtime/desktop/renderer/renderer.js",
              "runtime/arckit-runtime/desktop/renderer/index.html",
              "verification: reproduced blocked snapshot has plan null, drift null, can_apply false, can_continue false and rollback_complete true"
            ]
          }
        ],
        "facts_superseded": [],
        "impacts_added": [
          {
            "id": "IMPACT-SOURCE-UPGRADE-PROVIDER-MIGRATION",
            "fact_id": "FACT-SOURCE-UPGRADE-CONFLICT-002",
            "fact_revision": 1,
            "target": {
              "kind": "software_decision",
              "ref": "technical_foundation",
              "revision": 12
            },
            "effect": "threatened",
            "reason": "The new provider is the only available interpreter for an old relation, but its changed catalog and loader semantics are currently indistinguishable from user drift during source upgrade.",
            "gap_ids": [
              "GAP-DEFINE-SOURCE-UPGRADE-RECOVERY"
            ],
            "evidence": []
          },
          {
            "id": "IMPACT-SOURCE-UPGRADE-REALIZATION",
            "fact_id": "FACT-SOURCE-UPGRADE-CONFLICT-003",
            "fact_revision": 1,
            "target": {
              "kind": "software_invariant",
              "ref": "accepted-facts-are-realized",
              "revision": null
            },
            "effect": "threatened",
            "reason": "The implemented blocked state does not realize the accepted recoverable Setup Readiness conflict journey.",
            "gap_ids": [
              "GAP-DEFINE-SOURCE-UPGRADE-RECOVERY"
            ],
            "evidence": []
          }
        ],
        "impacts_updated": [
          {
            "id": "IMPACT-SOURCE-UPGRADE-RECOVERY",
            "fact_id": "FACT-SOURCE-UPGRADE-CONFLICT-001",
            "fact_revision": 1,
            "target": {
              "kind": "software_decision",
              "ref": "experience_and_interaction",
              "revision": 8
            },
            "effect": "threatened",
            "reason": "The exact recovery failure is confirmed: the conflict state withholds drift targets and offers no preservation, migration, repair or deliberate resolution action.",
            "gap_ids": [
              "GAP-DEFINE-SOURCE-UPGRADE-RECOVERY"
            ],
            "evidence": []
          }
        ],
        "gaps_added": [
          {
            "id": "GAP-DEFINE-SOURCE-UPGRADE-RECOVERY",
            "status": "open",
            "goal": "Establish a durable source-upgrade recovery contract that distinguishes user-authored content drift from provider-owned relation, catalog and loader migrations, and defines the actionable Setup Readiness choices and preservation evidence for each class.",
            "reason": "Implementation scope and safe confirmation behavior depend on an accepted classification and recovery contract; the current specification promises recovery but does not define provider-version migration or a UI action for this blocked state.",
            "derived_from": [
              "FACT-SOURCE-UPGRADE-CONFLICT-002",
              "FACT-SOURCE-UPGRADE-CONFLICT-003",
              "GAP-DIAGNOSE-SOURCE-UPGRADE-CONFLICT"
            ],
            "blocked_by": [],
            "priority_basis": {
              "blocking": "high",
              "uncertainty": "medium",
              "risk": "high",
              "user_impact": "high"
            },
            "responsibility": "agent",
            "evidence_required": [
              "Durable product, interaction and technical recovery semantics covering provider migration, genuine local edits, missing managed targets, diff visibility, explicit actions, transaction/rollback behavior and convergence acceptance."
            ],
            "resolution": null
          }
        ],
        "gaps_cancelled": [],
        "resolved_open_questions": [],
        "completed_handoffs": [],
        "completion_review_result": null,
        "resolved_review_findings": [],
        "review_budget_extension": null
      },
      "project_state_delta": {
        "software_definition_changes": [],
        "software_invariant_changes": [],
        "project_gap_changes": [],
        "selection_context_change": null,
        "evidence": []
      },
      "invariant_assessment": {
        "project_revision": 69,
        "judgments": [
          {
            "invariant_ref": "product-expectations-remain-recoverable",
            "disposition": "threatened",
            "reason": "The product promises governed upgrade and repair, but the fresh facts show provider-version migration is mislabeled as user drift and has no recoverable action.",
            "fact_refs": [
              "FACT-SOURCE-UPGRADE-CONFLICT-002",
              "FACT-SOURCE-UPGRADE-CONFLICT-003"
            ],
            "evidence": [],
            "gap_refs": [
              "GAP-DEFINE-SOURCE-UPGRADE-RECOVERY"
            ]
          },
          {
            "invariant_ref": "interaction-expectations-remain-recoverable",
            "disposition": "threatened",
            "reason": "The conflict state does not expose affected paths, preservation choices or a resolution action, so the accepted recovery journey is incomplete.",
            "fact_refs": [
              "FACT-SOURCE-UPGRADE-CONFLICT-003"
            ],
            "evidence": [],
            "gap_refs": [
              "GAP-DEFINE-SOURCE-UPGRADE-RECOVERY"
            ]
          },
          {
            "invariant_ref": "visual-language-remains-consistent",
            "disposition": "not_relevant",
            "reason": "The diagnosis concerns missing recovery semantics and actions, not a newly established or conflicting durable visual-language rule.",
            "fact_refs": [],
            "evidence": [],
            "gap_refs": []
          },
          {
            "invariant_ref": "technical-decisions-remain-explainable",
            "disposition": "threatened",
            "reason": "The accepted Core/provider adapter boundary does not yet explain how a new provider safely interprets and migrates relation state created under older provider semantics.",
            "fact_refs": [
              "FACT-SOURCE-UPGRADE-CONFLICT-002"
            ],
            "evidence": [],
            "gap_refs": [
              "GAP-DEFINE-SOURCE-UPGRADE-RECOVERY"
            ]
          },
          {
            "invariant_ref": "accepted-facts-are-realized",
            "disposition": "threatened",
            "reason": "The packaged implementation does not realize the accepted recoverable conflict state and cannot reach the valid new payload from the observed managed migration state.",
            "fact_refs": [
              "FACT-SOURCE-UPGRADE-CONFLICT-002",
              "FACT-SOURCE-UPGRADE-CONFLICT-003"
            ],
            "evidence": [],
            "gap_refs": [
              "GAP-DEFINE-SOURCE-UPGRADE-RECOVERY"
            ]
          },
          {
            "invariant_ref": "material-risks-have-credible-evidence",
            "disposition": "threatened",
            "reason": "The fail-closed check prevents overwrite, but it lacks evidence and controls that distinguish actual user edits from provider-owned migrations before any recovery action is offered.",
            "fact_refs": [
              "FACT-SOURCE-UPGRADE-CONFLICT-002",
              "FACT-SOURCE-UPGRADE-CONFLICT-003"
            ],
            "evidence": [],
            "gap_refs": [
              "GAP-DEFINE-SOURCE-UPGRADE-RECOVERY"
            ]
          }
        ]
      },
      "evidence": [
        "runtime/arckit-runtime/src/skill-provisioning-manager.mjs",
        "runtime/arckit-runtime/desktop/renderer/renderer.js",
        "runtime/arckit-runtime/desktop/renderer/index.html",
        "../arcforge/src/core/skill-availability-drift.ts",
        "../arcforge/src/provider/index.ts",
        "arckit/spec/arckit-runtime-distribution.md",
        "arckit/interaction/setup-readiness/interaction.md",
        "verification: installed Arckit Runtime 0.1.0-tf.b7 reproduced SOURCE_UPGRADE_CONFLICT with provider-migration-only drift and no UI convergence action"
      ],
      "runtime_result_ref": "",
      "occurred_at": "2026-08-15T10:57:46.772Z"
    },
    {
      "round": 2,
      "transition_schema_version": "arckit-case-transition/v8",
      "goal": "Verify every relation-recorded legacy catalog path and the managed loader evidence, then supersede the inaccurate diagnosis fact.",
      "outcome": "completed",
      "gap_selection": {
        "mode": "fresh",
        "basis": "Direct filesystem verification contradicted one accepted diagnosis detail, so correcting the canonical fact is more important than defining a downstream contract from an inaccurate premise.",
        "snapshot_token": "726c21f48fe3fcb172c49137390cf900250bfa4c184dd4eb239f83e76d63f7f3",
        "selected_ref": "fresh-gap:CASE-20260815-002:GAP-CORRECT-SOURCE-UPGRADE-DIAGNOSIS",
        "comparison_summary": "Selected the fresh diagnosis-correction Gap; deferred the recovery-contract Gap until its premise is corrected and deferred or excluded the four unrelated case-required Project gaps.",
        "fresh_discovery_summary": "Filesystem inspection showed that the five relation-recorded legacy catalog targets are also absent, invalidating the claim that their content still exists at the old paths.",
        "considered": [
          {
            "ref": "project-gap:GAP-agent-scenario-evaluation",
            "source": "persisted",
            "eligibility": "case_required",
            "disposition": "deferred",
            "priority_basis": {
              "uncertainty": "high",
              "risk": "high"
            },
            "reason": "Separate evaluation work does not correct the active Case fact."
          },
          {
            "ref": "project-gap:GAP-runtime-resilience-and-adapters",
            "source": "persisted",
            "eligibility": "case_required",
            "disposition": "deferred",
            "priority_basis": {
              "risk": "high",
              "urgency": "medium"
            },
            "reason": "Broader resilience work does not correct the provisioning diagnosis premise."
          },
          {
            "ref": "project-gap:GAP-security-real-project-validation",
            "source": "persisted",
            "eligibility": "case_required",
            "disposition": "excluded",
            "priority_basis": {
              "risk": "high",
              "urgency": "medium"
            },
            "reason": "No credential or controlled-resource fact is involved."
          },
          {
            "ref": "project-gap:GAP-cross-record-audit",
            "source": "persisted",
            "eligibility": "case_required",
            "disposition": "deferred",
            "priority_basis": {
              "risk": "high",
              "urgency": "high"
            },
            "reason": "Cross-record audit does not resolve the concrete target-existence contradiction."
          },
          {
            "ref": "case-gap:CASE-20260815-002:GAP-DEFINE-SOURCE-UPGRADE-RECOVERY",
            "source": "persisted",
            "eligibility": "ready",
            "disposition": "deferred",
            "priority_basis": {
              "blocking": "high",
              "uncertainty": "medium",
              "risk": "high",
              "user_impact": "high"
            },
            "reason": "Its recovery classes depend on the exact observed target state and must wait for the factual correction."
          },
          {
            "ref": "fresh-gap:CASE-20260815-002:GAP-CORRECT-SOURCE-UPGRADE-DIAGNOSIS",
            "source": "fresh",
            "eligibility": "ready",
            "disposition": "selected",
            "priority_basis": {
              "blocking": "high",
              "uncertainty": "low",
              "risk": "high",
              "user_impact": "high"
            },
            "reason": "It removes a false premise before any durable recovery contract or implementation consumes it."
          }
        ]
      },
      "selected_gap": {
        "id": "GAP-CORRECT-SOURCE-UPGRADE-DIAGNOSIS",
        "goal": "Correct the accepted source-upgrade diagnosis to distinguish actually missing managed catalog targets, provider path migration, and the managed loader mismatch without claiming absent legacy content still exists.",
        "reason": "A direct existence check contradicted the prior fact, and downstream recovery semantics must not be based on inaccurate target state.",
        "derived_from": [
          "FACT-SOURCE-UPGRADE-CONFLICT-002",
          "verification: legacy catalog targets missing"
        ],
        "blocked_by": [],
        "priority_basis": {
          "blocking": "high",
          "uncertainty": "low",
          "risk": "high",
          "user_impact": "high"
        },
        "responsibility": "agent",
        "evidence_required": [
          "Direct old/new target existence evidence, saved-relation evidence, packaged-provider classification and a superseding fact."
        ]
      },
      "planned_transition": {
        "goal": "Verify every relation-recorded legacy catalog path and the managed loader evidence, then supersede the inaccurate diagnosis fact.",
        "expected_state_change": "Preserve the valid root-cause boundaries while replacing the false target-existence claim with the exact mixed drift classification."
      },
      "accepted_state_delta": {
        "resolved_gap": {
          "id": "GAP-CORRECT-SOURCE-UPGRADE-DIAGNOSIS",
          "status": "resolved",
          "outcome": "The observed conflict contains five genuinely missing managed catalog targets, a provider policy migration from legacy namespaced destinations to flat destinations, and one changed relationship-proven loader target; no managed ambient Arckit skill target is changed. The current check correctly notices non-clean state but incorrectly treats every non-clean class as an unsafe user-content conflict with no repair action.",
          "reason": "Direct filesystem checks show both legacy and flat catalog targets absent; the saved relation proves their managed history, and the packaged plan separately marks the loader as managed-update while old drift reports its content changed.",
          "evidence": [
            "../arcforge/src/core/skill-availability-drift.ts",
            "../arcforge/src/core/skill-availability.ts",
            "runtime/arckit-runtime/src/skill-provisioning-manager.mjs",
            "verification: all five relation-recorded legacy catalog directories are absent",
            "verification: packaged drift reports five missing catalog targets and one changed loader while seven ambient Arckit skill targets are same",
            "verification: packaged plan classifies arcforge-on-demand as managed-update"
          ]
        },
        "facts_added": [
          {
            "id": "FACT-SOURCE-UPGRADE-CONFLICT-002",
            "revision": 2,
            "status": "accepted",
            "statement": "On the reported machine, b7 upgrades from an older payload with one valid saved relation. Five user-on-demand targets are absent at both their relation-recorded source-key-namespaced paths and the new provider's flat catalog paths, so they are genuinely missing managed targets; the new provider also changes their destination policy. The arcforge-on-demand target exists with different content and is classified by the new plan as relationship-proven managed-update. All seven ambient Arckit skill targets match the old source. Therefore SOURCE_UPGRADE_CONFLICT detects non-clean state, but its single blocking class conflates repairable missing targets and provider-owned migration with potentially unsafe user-authored content changes.",
            "basis": "Direct old-path and new-path existence checks, the saved relation, packaged provider plan/drift and target content comparison agree; this supersedes the inaccurate claim that legacy catalog content still existed.",
            "evidence": [
              "../arcforge/src/core/skill-availability-drift.ts",
              "../arcforge/src/core/skill-availability.ts",
              "../arcforge/src/provider/index.ts",
              "runtime/arckit-runtime/src/skill-provisioning-manager.mjs",
              "verification: relation records five legacy source-key catalog paths and all five are absent",
              "verification: packaged drift counts changed 1, missing 5, same 7",
              "verification: loader target exists and new plan classifies it as managed-update"
            ]
          }
        ],
        "facts_superseded": [
          {
            "id": "FACT-SOURCE-UPGRADE-CONFLICT-002",
            "revision": 1,
            "reason": "Direct filesystem verification disproved the statement that the five catalog skills still existed at their recorded legacy paths.",
            "evidence": [
              "verification: all five relation-recorded legacy catalog directories are absent"
            ]
          }
        ],
        "impacts_added": [],
        "impacts_updated": [
          {
            "id": "IMPACT-SOURCE-UPGRADE-PROVIDER-MIGRATION",
            "fact_id": "FACT-SOURCE-UPGRADE-CONFLICT-002",
            "fact_revision": 2,
            "target": {
              "kind": "software_decision",
              "ref": "technical_foundation",
              "revision": 12
            },
            "effect": "threatened",
            "reason": "The upgrade gate lacks a typed reconciliation boundary for repairable missing targets, provider-owned destination/loader migrations and genuinely changed user content.",
            "gap_ids": [
              "GAP-DEFINE-SOURCE-UPGRADE-RECOVERY"
            ],
            "evidence": []
          }
        ],
        "gaps_added": [],
        "gaps_cancelled": [],
        "resolved_open_questions": [],
        "completed_handoffs": [],
        "completion_review_result": null,
        "resolved_review_findings": [],
        "review_budget_extension": null
      },
      "project_state_delta": {
        "software_definition_changes": [],
        "software_invariant_changes": [],
        "project_gap_changes": [],
        "selection_context_change": null,
        "evidence": []
      },
      "invariant_assessment": {
        "project_revision": 69,
        "judgments": [
          {
            "invariant_ref": "product-expectations-remain-recoverable",
            "disposition": "threatened",
            "reason": "Governed repair and upgrade remain blocked because repairable missing and managed-migration states are collapsed into an unactionable conflict.",
            "fact_refs": [
              "FACT-SOURCE-UPGRADE-CONFLICT-002",
              "FACT-SOURCE-UPGRADE-CONFLICT-003"
            ],
            "evidence": [],
            "gap_refs": [
              "GAP-DEFINE-SOURCE-UPGRADE-RECOVERY"
            ]
          },
          {
            "invariant_ref": "interaction-expectations-remain-recoverable",
            "disposition": "threatened",
            "reason": "The UI still withholds typed target details and recovery actions for the corrected mixed drift state.",
            "fact_refs": [
              "FACT-SOURCE-UPGRADE-CONFLICT-002",
              "FACT-SOURCE-UPGRADE-CONFLICT-003"
            ],
            "evidence": [],
            "gap_refs": [
              "GAP-DEFINE-SOURCE-UPGRADE-RECOVERY"
            ]
          },
          {
            "invariant_ref": "visual-language-remains-consistent",
            "disposition": "not_relevant",
            "reason": "The factual correction does not establish or conflict with a durable visual-language rule.",
            "fact_refs": [],
            "evidence": [],
            "gap_refs": []
          },
          {
            "invariant_ref": "technical-decisions-remain-explainable",
            "disposition": "threatened",
            "reason": "The provider adapter boundary still lacks explainable typed migration and old-relation reconciliation semantics.",
            "fact_refs": [
              "FACT-SOURCE-UPGRADE-CONFLICT-002"
            ],
            "evidence": [],
            "gap_refs": [
              "GAP-DEFINE-SOURCE-UPGRADE-RECOVERY"
            ]
          },
          {
            "invariant_ref": "accepted-facts-are-realized",
            "disposition": "threatened",
            "reason": "The implementation cannot repair the five missing managed targets or safely progress the managed loader migration through Setup Readiness.",
            "fact_refs": [
              "FACT-SOURCE-UPGRADE-CONFLICT-002",
              "FACT-SOURCE-UPGRADE-CONFLICT-003"
            ],
            "evidence": [],
            "gap_refs": [
              "GAP-DEFINE-SOURCE-UPGRADE-RECOVERY"
            ]
          },
          {
            "invariant_ref": "material-risks-have-credible-evidence",
            "disposition": "threatened",
            "reason": "The corrected evidence proves non-clean state but the product still lacks class-specific evidence and controls before recovery.",
            "fact_refs": [
              "FACT-SOURCE-UPGRADE-CONFLICT-002"
            ],
            "evidence": [],
            "gap_refs": [
              "GAP-DEFINE-SOURCE-UPGRADE-RECOVERY"
            ]
          }
        ]
      },
      "evidence": [
        "../arcforge/src/core/skill-availability-drift.ts",
        "../arcforge/src/core/skill-availability.ts",
        "runtime/arckit-runtime/src/skill-provisioning-manager.mjs",
        "verification: all five relation-recorded legacy catalog targets are absent and packaged drift reports five missing, one changed loader, seven same ambient targets"
      ],
      "runtime_result_ref": "",
      "occurred_at": "2026-08-15T11:01:33.531Z"
    },
    {
      "round": 3,
      "transition_schema_version": "arckit-case-transition/v8",
      "goal": "Update the existing distribution spec, Setup Readiness interaction source/wireframe projection and installer technical solution with one typed reconciliation and recovery contract.",
      "outcome": "completed",
      "gap_selection": {
        "mode": "candidate",
        "basis": "The corrected diagnosis makes the recovery classes known, and a durable product/interaction/technical contract is the remaining prerequisite before implementation can safely choose write, backup and migration behavior.",
        "snapshot_token": "d3a9b6582ee041083c72dfd52a8f75c464163eca5be5d8850c4b48c05995d6e1",
        "selected_ref": "case-gap:CASE-20260815-002:GAP-DEFINE-SOURCE-UPGRADE-RECOVERY",
        "comparison_summary": "Selected the only ready Case Gap and deferred or excluded the four separate case-required Project gaps.",
        "fresh_discovery_summary": "No more important fresh candidate was discovered after the diagnosis correction; implementation remains downstream of this contract acceptance.",
        "considered": [
          {
            "ref": "project-gap:GAP-agent-scenario-evaluation",
            "source": "persisted",
            "eligibility": "case_required",
            "disposition": "deferred",
            "priority_basis": {
              "uncertainty": "high",
              "risk": "high"
            },
            "reason": "Separate scenario evaluation does not define the active installer recovery contract."
          },
          {
            "ref": "project-gap:GAP-runtime-resilience-and-adapters",
            "source": "persisted",
            "eligibility": "case_required",
            "disposition": "deferred",
            "priority_basis": {
              "risk": "high",
              "urgency": "medium"
            },
            "reason": "Broader Runtime resilience remains independent of Setup Readiness source-upgrade semantics."
          },
          {
            "ref": "project-gap:GAP-security-real-project-validation",
            "source": "persisted",
            "eligibility": "case_required",
            "disposition": "excluded",
            "priority_basis": {
              "risk": "high",
              "urgency": "medium"
            },
            "reason": "No credential or permission-bearing external resource is involved."
          },
          {
            "ref": "project-gap:GAP-cross-record-audit",
            "source": "persisted",
            "eligibility": "case_required",
            "disposition": "deferred",
            "priority_basis": {
              "risk": "high",
              "urgency": "high"
            },
            "reason": "Cross-record audit does not supply the product and provider recovery contract."
          },
          {
            "ref": "case-gap:CASE-20260815-002:GAP-DEFINE-SOURCE-UPGRADE-RECOVERY",
            "source": "persisted",
            "eligibility": "ready",
            "disposition": "selected",
            "priority_basis": {
              "blocking": "high",
              "uncertainty": "medium",
              "risk": "high",
              "user_impact": "high"
            },
            "reason": "It establishes the exact risk classes, user actions, ownership evidence and transactional boundary required by the next implementation."
          }
        ]
      },
      "selected_gap": {
        "id": "GAP-DEFINE-SOURCE-UPGRADE-RECOVERY",
        "responsibility": "agent",
        "goal": "Establish a durable source-upgrade recovery contract that distinguishes user-authored content drift from provider-owned relation, catalog and loader migrations, and defines the actionable Setup Readiness choices and preservation evidence for each class.",
        "reason": "Implementation scope and safe confirmation behavior depend on an accepted classification and recovery contract; the current specification promises recovery but does not define provider-version migration or a UI action for this blocked state.",
        "derived_from": [
          "FACT-SOURCE-UPGRADE-CONFLICT-002",
          "FACT-SOURCE-UPGRADE-CONFLICT-003",
          "GAP-DIAGNOSE-SOURCE-UPGRADE-CONFLICT"
        ],
        "blocked_by": [],
        "priority_basis": {
          "blocking": "high",
          "uncertainty": "medium",
          "risk": "high",
          "user_impact": "high"
        },
        "evidence_required": [
          "Durable product, interaction and technical recovery semantics covering provider migration, genuine local edits, missing managed targets, diff visibility, explicit actions, transaction/rollback behavior and convergence acceptance."
        ]
      },
      "planned_transition": {
        "goal": "Update the existing distribution spec, Setup Readiness interaction source/wireframe projection and installer technical solution with one typed reconciliation and recovery contract.",
        "expected_state_change": "Resolve the definition Gap, settle the affected Project decisions and expose one implementation Gap without executing it."
      },
      "accepted_state_delta": {
        "resolved_gap": {
          "id": "GAP-DEFINE-SOURCE-UPGRADE-RECOVERY",
          "status": "resolved",
          "outcome": "Source upgrades now have a durable typed contract: managed-repair and provable managed-migration enter a confirmable plan; local-content-conflict and legacy unverified-managed targets require diff plus explicit backup/restore or exit; unmanaged-conflict is never overwritten. ArcForge Core owns classification/migration, provider exposes it by capability, Runtime projects it, and check-only states report not-written instead of rollback.",
          "reason": "Product, interaction source and wireframe projection, and technical architecture agree on classes, evidence, user actions, freshness, ownership and transaction/rollback boundaries, and all maintained indexes are synchronized.",
          "evidence": [
            "arckit/spec/arckit-runtime-distribution.md",
            "arckit/spec/INDEX.md",
            "arckit/spec/_map/feature-matrix.md",
            "arckit/interaction/setup-readiness/interaction.md",
            "arckit/interaction/setup-readiness/default.html",
            "arckit/interaction/INDEX.md",
            "arckit/interaction/_map/feature-matrix.md",
            "arckit/tech/arckit-runtime/installer-supply-chain.md",
            "arckit/tech/INDEX.md",
            "arckit/tech/_map/feature-matrix.md",
            "verification: git diff --check passed and all maintained INDEX line counts match"
          ]
        },
        "facts_added": [
          {
            "id": "FACT-SOURCE-UPGRADE-RECOVERY-CONTRACT",
            "revision": 1,
            "status": "accepted",
            "statement": "Setup Readiness source upgrades use ArcForge Core/provider typed assessment. Relationship-proven missing targets and provable provider destination, policy or shared-loader migrations enter a confirmable repair/upgrade plan; existing content that differs from a last-applied digest and legacy managed targets without sufficient digest evidence require file diff plus an explicit backup-and-restore or preserve-and-exit disposition; unmanaged conflicts are never overwritten. Successful apply atomically covers source, targets, catalog, loader, relationship migration and approved backups, while check-only failures report that no write started.",
            "basis": "The contract follows the corrected installed-state diagnosis, preserves user content, keeps provisioning semantics in ArcForge Core and supplies an in-product convergence path for every recoverable class.",
            "evidence": [
              "arckit/spec/arckit-runtime-distribution.md",
              "arckit/interaction/setup-readiness/interaction.md",
              "arckit/interaction/setup-readiness/default.html",
              "arckit/tech/arckit-runtime/installer-supply-chain.md"
            ]
          }
        ],
        "facts_superseded": [],
        "impacts_added": [
          {
            "id": "IMPACT-SOURCE-UPGRADE-PRODUCT-CAPABILITY",
            "fact_id": "FACT-SOURCE-UPGRADE-RECOVERY-CONTRACT",
            "fact_revision": 1,
            "target": {
              "kind": "software_decision",
              "ref": "product_capabilities",
              "revision": 7
            },
            "effect": "upheld",
            "reason": "The product capability now explicitly includes typed, actionable source-upgrade reconciliation.",
            "gap_ids": [],
            "evidence": [
              "arckit/spec/arckit-runtime-distribution.md",
              "arckit/interaction/setup-readiness/interaction.md"
            ]
          }
        ],
        "impacts_updated": [
          {
            "id": "IMPACT-SOURCE-UPGRADE-RECOVERY",
            "fact_id": "FACT-SOURCE-UPGRADE-CONFLICT-001",
            "fact_revision": 1,
            "target": {
              "kind": "software_decision",
              "ref": "experience_and_interaction",
              "revision": 9
            },
            "effect": "upheld",
            "reason": "The interaction source and wireframe define visible drift classes, affected targets and actionable repair, backup/restore, exit and external-recovery paths.",
            "gap_ids": [],
            "evidence": [
              "arckit/interaction/setup-readiness/interaction.md",
              "arckit/interaction/setup-readiness/default.html"
            ]
          },
          {
            "id": "IMPACT-SOURCE-UPGRADE-PROVIDER-MIGRATION",
            "fact_id": "FACT-SOURCE-UPGRADE-CONFLICT-002",
            "fact_revision": 2,
            "target": {
              "kind": "software_decision",
              "ref": "technical_foundation",
              "revision": 13
            },
            "effect": "upheld",
            "reason": "The technical solution assigns typed upgrade assessment, relation digests and migration semantics to ArcForge Core/provider while Runtime remains a bounded projection and orchestration adapter.",
            "gap_ids": [],
            "evidence": [
              "arckit/tech/arckit-runtime/installer-supply-chain.md"
            ]
          },
          {
            "id": "IMPACT-SOURCE-UPGRADE-REALIZATION",
            "fact_id": "FACT-SOURCE-UPGRADE-CONFLICT-003",
            "fact_revision": 1,
            "target": {
              "kind": "software_invariant",
              "ref": "accepted-facts-are-realized",
              "revision": null
            },
            "effect": "threatened",
            "reason": "The durable recovery contract is accepted but the packaged Core/provider, Manager, IPC and Renderer do not yet realize it.",
            "gap_ids": [
              "GAP-IMPLEMENT-SOURCE-UPGRADE-RECOVERY"
            ],
            "evidence": []
          }
        ],
        "gaps_added": [
          {
            "id": "GAP-IMPLEMENT-SOURCE-UPGRADE-RECOVERY",
            "status": "open",
            "goal": "Implement and verify the accepted typed source-upgrade assessment, managed repair/migration, content backup-and-restore, Setup Readiness actions and check/apply write-state reporting across ArcForge Core/provider and Arckit Runtime/Desktop.",
            "reason": "The accepted contract is not realized by the current single SOURCE_UPGRADE_CONFLICT path, blocked snapshot or Renderer actions.",
            "derived_from": [
              "FACT-SOURCE-UPGRADE-RECOVERY-CONTRACT",
              "FACT-SOURCE-UPGRADE-CONFLICT-002",
              "FACT-SOURCE-UPGRADE-CONFLICT-003"
            ],
            "blocked_by": [],
            "priority_basis": {
              "blocking": "high",
              "uncertainty": "low",
              "risk": "high",
              "user_impact": "high"
            },
            "responsibility": "agent",
            "evidence_required": [
              "Core/provider contract and migration tests; Runtime Manager, IPC and Renderer tests; exact reported b7-state reproduction converging without silent overwrite; full repository checks and clean temporary-debug-marker audit."
            ],
            "resolution": null
          }
        ],
        "gaps_cancelled": [],
        "resolved_open_questions": [],
        "completed_handoffs": [],
        "completion_review_result": null,
        "resolved_review_findings": [],
        "review_budget_extension": null
      },
      "project_state_delta": {
        "software_definition_changes": [
          {
            "area_ref": "product_capabilities",
            "observed_revision": 6,
            "set_decision": {
              "status": "settled",
              "statement": "Arckit provides Project/Iteration/Case ledgers, fresh-fact-driven invariant-guided dynamic Case Gap discovery, strict single-Gap Rounds, trusted atomic transitions, maintained development skills, an optional supervised Runtime/Desktop with ordinary-todo and acceptance-feedback lanes, and a Setup Readiness surface that establishes governed Codex skills before Runtime execution, including typed source-upgrade reconciliation that separates repairable managed drift and provider migrations from user-content and unmanaged conflicts.",
              "reason": "The accepted recovery contract makes actionable, content-preserving source-upgrade reconciliation part of the Setup Readiness capability rather than an opaque blocked error.",
              "evidence": [
                "arckit/spec/arckit-runtime-distribution.md",
                "arckit/interaction/setup-readiness/interaction.md"
              ],
              "confidence": "high",
              "resume_condition": ""
            },
            "gap_refs": [
              "GAP-agent-scenario-evaluation"
            ],
            "reason": "The capability statement now captures the accepted source-upgrade recovery behavior while preserving the independent scenario-evaluation gap.",
            "evidence": [
              "arckit/spec/arckit-runtime-distribution.md",
              "arckit/interaction/setup-readiness/interaction.md"
            ]
          },
          {
            "area_ref": "experience_and_interaction",
            "observed_revision": 8,
            "set_decision": {
              "status": "settled",
              "statement": "Application startup first establishes Setup Readiness through resource checks, governed skill plan/drift, explicit confirmation, transactional apply and recoverable conflict states. Source upgrades present typed managed repair/migration, local or unverified content conflict and unmanaged conflict states with visible ownership evidence and actions for repair, backup-and-restore, preserve-and-exit or external recovery. Ready users then continue through session restoration into the Automation Workspace, where persisted candidate comparison, accepted closeout, fresh-read, recovery and acceptance feedback remain in one persistent task conversation.",
              "reason": "The interaction contract now gives every source-upgrade class a risk-appropriate visible action instead of treating check-only drift as an unactionable rollback state.",
              "evidence": [
                "arckit/interaction/setup-readiness/interaction.md",
                "arckit/interaction/setup-readiness/default.html",
                "arckit/interaction/_map/feature-matrix.md"
              ],
              "confidence": "high",
              "resume_condition": ""
            },
            "gap_refs": [],
            "reason": "The settled journey now recovers the exact upgrade classification and user actions.",
            "evidence": [
              "arckit/interaction/setup-readiness/interaction.md",
              "arckit/interaction/setup-readiness/default.html"
            ]
          },
          {
            "area_ref": "technical_foundation",
            "observed_revision": 12,
            "set_decision": {
              "status": "settled",
              "statement": "Arckit uses repository-owned Markdown/JSON state, Node.js ESM ledger and Runtime scripts, an Electron Desktop host, Project v5, Case v5, Transition v8, Snapshot v1, Closeout v2 and Iteration v3. Runtime packages trusted capabilities separately from an Arckit skill payload and a versioned ArcForge Embedded Provider; Desktop Setup Readiness owns provisioning while the policy-neutral Runtime Kernel continues natural $using-arckit execution. ArcForge Core is the sole implementation of overlapping provisioning semantics, including typed source-upgrade assessment, last-applied target evidence, managed repair/migration and transactional backup/restore; CLI, Desktop and Embedded Provider are adapters, and Runtime consumes capability-gated provider artifacts without deriving installation targets or drift classes.",
              "reason": "The accepted technical contract extends the single-semantic-source boundary to old-relation reconciliation and prevents Runtime from inferring user conflicts from raw drift counts.",
              "evidence": [
                "arckit/tech/arckit-runtime/installer-supply-chain.md",
                "arckit/spec/arckit-runtime-distribution.md"
              ],
              "confidence": "high",
              "resume_condition": ""
            },
            "gap_refs": [
              "GAP-runtime-resilience-and-adapters"
            ],
            "reason": "The technical foundation now owns a typed provider migration contract while preserving the separate broader Runtime resilience gap.",
            "evidence": [
              "arckit/tech/arckit-runtime/installer-supply-chain.md"
            ]
          }
        ],
        "software_invariant_changes": [],
        "project_gap_changes": [],
        "selection_context_change": null,
        "evidence": [
          "arckit/spec/arckit-runtime-distribution.md",
          "arckit/interaction/setup-readiness/interaction.md",
          "arckit/interaction/setup-readiness/default.html",
          "arckit/tech/arckit-runtime/installer-supply-chain.md"
        ]
      },
      "invariant_assessment": {
        "project_revision": 69,
        "judgments": [
          {
            "invariant_ref": "product-expectations-remain-recoverable",
            "disposition": "upheld",
            "reason": "The distribution spec now defines typed source-upgrade classes, safe actions and acceptance criteria.",
            "fact_refs": [
              "FACT-SOURCE-UPGRADE-RECOVERY-CONTRACT"
            ],
            "evidence": [
              "arckit/spec/arckit-runtime-distribution.md",
              "arckit/spec/INDEX.md"
            ],
            "gap_refs": []
          },
          {
            "invariant_ref": "interaction-expectations-remain-recoverable",
            "disposition": "upheld",
            "reason": "The interaction source and wireframe project every recovery class, action, write state and navigation boundary.",
            "fact_refs": [
              "FACT-SOURCE-UPGRADE-RECOVERY-CONTRACT"
            ],
            "evidence": [
              "arckit/interaction/setup-readiness/interaction.md",
              "arckit/interaction/setup-readiness/default.html",
              "arckit/interaction/INDEX.md"
            ],
            "gap_refs": []
          },
          {
            "invariant_ref": "visual-language-remains-consistent",
            "disposition": "not_relevant",
            "reason": "The wireframe reuses existing grayscale structural components and does not establish or alter visual tokens or style rules.",
            "fact_refs": [],
            "evidence": [],
            "gap_refs": []
          },
          {
            "invariant_ref": "technical-decisions-remain-explainable",
            "disposition": "upheld",
            "reason": "The technical solution explains Core/provider/Runtime ownership, relation evidence, classification, freshness, backup and rollback semantics.",
            "fact_refs": [
              "FACT-SOURCE-UPGRADE-RECOVERY-CONTRACT"
            ],
            "evidence": [
              "arckit/tech/arckit-runtime/installer-supply-chain.md",
              "arckit/tech/INDEX.md"
            ],
            "gap_refs": []
          },
          {
            "invariant_ref": "accepted-facts-are-realized",
            "disposition": "threatened",
            "reason": "The accepted contract is not yet implemented in ArcForge Core/provider or Runtime/Desktop.",
            "fact_refs": [
              "FACT-SOURCE-UPGRADE-RECOVERY-CONTRACT",
              "FACT-SOURCE-UPGRADE-CONFLICT-003"
            ],
            "evidence": [],
            "gap_refs": [
              "GAP-IMPLEMENT-SOURCE-UPGRADE-RECOVERY"
            ]
          },
          {
            "invariant_ref": "material-risks-have-credible-evidence",
            "disposition": "threatened",
            "reason": "The risk controls are specified but need repeatable migration, conflict, backup, rollback and reported-state convergence evidence.",
            "fact_refs": [
              "FACT-SOURCE-UPGRADE-RECOVERY-CONTRACT",
              "FACT-SOURCE-UPGRADE-CONFLICT-002"
            ],
            "evidence": [],
            "gap_refs": [
              "GAP-IMPLEMENT-SOURCE-UPGRADE-RECOVERY"
            ]
          }
        ]
      },
      "evidence": [
        "arckit/spec/arckit-runtime-distribution.md",
        "arckit/spec/INDEX.md",
        "arckit/spec/_map/feature-matrix.md",
        "arckit/interaction/setup-readiness/interaction.md",
        "arckit/interaction/setup-readiness/default.html",
        "arckit/interaction/INDEX.md",
        "arckit/interaction/_map/feature-matrix.md",
        "arckit/tech/arckit-runtime/installer-supply-chain.md",
        "arckit/tech/INDEX.md",
        "arckit/tech/_map/feature-matrix.md",
        "verification: git diff --check passed and INDEX line counts match"
      ],
      "runtime_result_ref": "",
      "occurred_at": "2026-08-15T11:06:34.592Z"
    },
    {
      "round": 4,
      "transition_schema_version": "arckit-case-transition/v8",
      "goal": "Realize the typed source-upgrade recovery contract across ArcForge and Arckit Setup Readiness.",
      "outcome": "completed",
      "gap_selection": {
        "mode": "candidate",
        "basis": "Implementation is the sole ready Case obligation; the visible Project gaps require separate Cases and do not block this user-facing repair.",
        "snapshot_token": "19a359242814ed5bb19b5cd745e48cebc0fac683e6fdb97c42f9b1ca6be88079",
        "selected_ref": "case-gap:CASE-20260815-002:GAP-IMPLEMENT-SOURCE-UPGRADE-RECOVERY",
        "considered": [
          {
            "ref": "case-gap:CASE-20260815-002:GAP-IMPLEMENT-SOURCE-UPGRADE-RECOVERY",
            "source": "persisted",
            "eligibility": "ready",
            "disposition": "selected",
            "reason": "It is the only ready gap and directly realizes the accepted recovery contract.",
            "priority_basis": {
              "blocking": "high",
              "risk": "high",
              "user_impact": "high",
              "uncertainty": "low"
            }
          },
          {
            "ref": "project-gap:GAP-agent-scenario-evaluation",
            "source": "persisted",
            "eligibility": "case_required",
            "disposition": "deferred",
            "reason": "Separate Case; unrelated to this installer failure.",
            "priority_basis": {
              "uncertainty": "high",
              "risk": "high"
            }
          },
          {
            "ref": "project-gap:GAP-runtime-resilience-and-adapters",
            "source": "persisted",
            "eligibility": "case_required",
            "disposition": "deferred",
            "reason": "Separate Case; broader than source-upgrade recovery.",
            "priority_basis": {
              "risk": "high",
              "urgency": "medium"
            }
          },
          {
            "ref": "project-gap:GAP-security-real-project-validation",
            "source": "persisted",
            "eligibility": "case_required",
            "disposition": "deferred",
            "reason": "Separate permission-bearing project required.",
            "priority_basis": {
              "risk": "high",
              "urgency": "medium"
            }
          },
          {
            "ref": "project-gap:GAP-cross-record-audit",
            "source": "persisted",
            "eligibility": "case_required",
            "disposition": "deferred",
            "reason": "Separate Case; does not affect provisioning recovery.",
            "priority_basis": {
              "risk": "high",
              "urgency": "high"
            }
          }
        ],
        "comparison_summary": "The implementation gap is the sole ready Case candidate and has immediate user impact; all others require independent Cases.",
        "fresh_discovery_summary": "No fresh gap supersedes implementation after Core/provider, Runtime, UI, packaging and installed-state evidence converged."
      },
      "selected_gap": {
        "id": "GAP-IMPLEMENT-SOURCE-UPGRADE-RECOVERY",
        "responsibility": "agent",
        "goal": "Implement and verify the accepted typed source-upgrade assessment, managed repair/migration, content backup-and-restore, Setup Readiness actions and check/apply write-state reporting across ArcForge Core/provider and Arckit Runtime/Desktop.",
        "reason": "The accepted contract is not realized by the current single SOURCE_UPGRADE_CONFLICT path, blocked snapshot or Renderer actions.",
        "derived_from": [
          "FACT-SOURCE-UPGRADE-RECOVERY-CONTRACT",
          "FACT-SOURCE-UPGRADE-CONFLICT-002",
          "FACT-SOURCE-UPGRADE-CONFLICT-003"
        ],
        "blocked_by": [],
        "priority_basis": {
          "blocking": "high",
          "uncertainty": "low",
          "risk": "high",
          "user_impact": "high"
        },
        "evidence_required": [
          "Core/provider contract and migration tests; Runtime Manager, IPC and Renderer tests; exact reported b7-state reproduction converging without silent overwrite; full repository checks and clean temporary-debug-marker audit."
        ]
      },
      "planned_transition": {
        "goal": "Realize the typed source-upgrade recovery contract across ArcForge and Arckit Setup Readiness.",
        "expected_state_change": "Repairable managed drift reaches a reviewed migration plan; content conflicts gain preservation actions; check/apply state becomes explicit and verified."
      },
      "accepted_state_delta": {
        "facts_added": [
          {
            "id": "FACT-SOURCE-UPGRADE-RECOVERY-IMPLEMENTED",
            "revision": 1,
            "status": "accepted",
            "statement": "ArcForge now provides capability-gated typed source-upgrade assessment, last-applied target evidence and transactional backup-and-restore. Arckit Runtime consumes it, includes relationship-proven migration cleanup in confirmed apply, reports write state and exposes repair/migrate, backup/restore and preserve/exit actions. The installed b7 state evaluates as five managed repairs plus six managed migrations with canProceed true instead of SOURCE_UPGRADE_CONFLICT.",
            "basis": "Implementation inspection, provider and Runtime tests, provider package construction, full checks and direct read-only evaluation of the installed b7 state agree.",
            "evidence": [
              "../arcforge/src/provider/index.ts",
              "../arcforge/src/core/sources.ts",
              "../arcforge/src/shared/types.ts",
              "../arcforge/tests/provider.test.mjs",
              "runtime/arckit-runtime/src/skill-provisioning-manager.mjs",
              "runtime/arckit-runtime/desktop/renderer/renderer.js",
              "runtime/arckit-runtime/scripts/prepare-distribution.mjs",
              "runtime/arckit-runtime/test/skill-provisioning-manager.test.mjs",
              "runtime/arckit-runtime/test/desktop-renderer.test.mjs",
              "runtime/arckit-runtime/test/package-distribution.test.mjs",
              "verification: ArcForge 61/61 plus TypeScript check passed",
              "verification: Runtime 186 passed, 1 skipped, 0 failed",
              "verification: provider package declares source-upgrade-recovery/v1",
              "verification: installed b7 read-only assessment reports managed-repair 5, managed-migration 6, canProceed true and writeState not_started",
              "verification: diff and temporary-debug-marker audits passed"
            ]
          }
        ],
        "facts_superseded": [],
        "impacts_added": [],
        "impacts_updated": [
          {
            "id": "IMPACT-SOURCE-UPGRADE-REALIZATION",
            "fact_id": "FACT-SOURCE-UPGRADE-RECOVERY-IMPLEMENTED",
            "fact_revision": 1,
            "target": {
              "kind": "software_invariant",
              "ref": "accepted-facts-are-realized",
              "revision": null
            },
            "effect": "upheld",
            "reason": "The accepted contract is implemented across provider/Core, Manager, IPC, Renderer and packaging with real-state and regression evidence.",
            "gap_ids": [],
            "evidence": [
              "../arcforge/src/provider/index.ts",
              "../arcforge/src/core/sources.ts",
              "runtime/arckit-runtime/src/skill-provisioning-manager.mjs",
              "runtime/arckit-runtime/desktop/renderer/renderer.js",
              "../arcforge/tests/provider.test.mjs",
              "runtime/arckit-runtime/test/skill-provisioning-manager.test.mjs"
            ]
          }
        ],
        "gaps_added": [],
        "gaps_cancelled": [],
        "resolved_gap": {
          "id": "GAP-IMPLEMENT-SOURCE-UPGRADE-RECOVERY",
          "status": "resolved",
          "outcome": "Typed assessment replaces the single pre-plan conflict gate. Managed missing/path/loader migrations enter reviewed apply; changed managed content can be backed up and restored; unmanaged content stays protected; Setup Readiness shows classes, actions and write state.",
          "reason": "Both repositories pass full checks, dedicated tests and package construction pass, and the actual installed b7 state is wholly repairable managed drift.",
          "evidence": [
            "../arcforge/src/provider/index.ts",
            "../arcforge/tests/provider.test.mjs",
            "runtime/arckit-runtime/src/skill-provisioning-manager.mjs",
            "runtime/arckit-runtime/desktop/renderer/renderer.js",
            "runtime/arckit-runtime/test/skill-provisioning-manager.test.mjs",
            "runtime/arckit-runtime/test/desktop-renderer.test.mjs",
            "runtime/arckit-runtime/test/package-distribution.test.mjs",
            "verification: full checks and installed b7 assessment passed"
          ]
        },
        "resolved_open_questions": [],
        "completed_handoffs": [],
        "resolved_review_findings": [],
        "completion_review_result": null,
        "review_budget_extension": null
      },
      "project_state_delta": {
        "software_definition_changes": [],
        "software_invariant_changes": [],
        "project_gap_changes": [],
        "selection_context_change": null,
        "evidence": []
      },
      "invariant_assessment": {
        "project_revision": 70,
        "judgments": [
          {
            "invariant_ref": "product-expectations-remain-recoverable",
            "disposition": "upheld",
            "reason": "Implementation realizes the accepted product contract for actionable typed source-upgrade recovery.",
            "fact_refs": [
              "FACT-SOURCE-UPGRADE-RECOVERY-CONTRACT",
              "FACT-SOURCE-UPGRADE-RECOVERY-IMPLEMENTED"
            ],
            "evidence": [
              "arckit/spec/arckit-runtime-distribution.md",
              "runtime/arckit-runtime/src/skill-provisioning-manager.mjs"
            ],
            "gap_refs": []
          },
          {
            "invariant_ref": "interaction-expectations-remain-recoverable",
            "disposition": "upheld",
            "reason": "Renderer now covers repair/migrate, backup/restore, preserve/exit, retry and explicit write state.",
            "fact_refs": [
              "FACT-SOURCE-UPGRADE-RECOVERY-IMPLEMENTED"
            ],
            "evidence": [
              "arckit/interaction/setup-readiness/interaction.md",
              "runtime/arckit-runtime/desktop/renderer/index.html",
              "runtime/arckit-runtime/desktop/renderer/renderer.js",
              "runtime/arckit-runtime/test/desktop-renderer.test.mjs"
            ],
            "gap_refs": []
          },
          {
            "invariant_ref": "visual-language-remains-consistent",
            "disposition": "not_relevant",
            "reason": "The implementation reuses existing Setup Readiness components and tokens without changing the visual system.",
            "fact_refs": [],
            "evidence": [],
            "gap_refs": []
          },
          {
            "invariant_ref": "technical-decisions-remain-explainable",
            "disposition": "upheld",
            "reason": "ArcForge owns classification/evidence/recovery while Runtime capability-gates and projects that contract.",
            "fact_refs": [
              "FACT-SOURCE-UPGRADE-RECOVERY-CONTRACT",
              "FACT-SOURCE-UPGRADE-RECOVERY-IMPLEMENTED"
            ],
            "evidence": [
              "arckit/tech/arckit-runtime/installer-supply-chain.md",
              "../arcforge/src/provider/index.ts",
              "runtime/arckit-runtime/src/skill-provisioning-manager.mjs"
            ],
            "gap_refs": []
          },
          {
            "invariant_ref": "accepted-facts-are-realized",
            "disposition": "upheld",
            "reason": "All named Core/provider, Manager, IPC, Renderer and packaging surfaces realize the recovery contract.",
            "fact_refs": [
              "FACT-SOURCE-UPGRADE-RECOVERY-IMPLEMENTED"
            ],
            "evidence": [
              "../arcforge/src/provider/index.ts",
              "../arcforge/src/core/sources.ts",
              "runtime/arckit-runtime/src/skill-provisioning-manager.mjs",
              "runtime/arckit-runtime/desktop/renderer/renderer.js"
            ],
            "gap_refs": []
          },
          {
            "invariant_ref": "material-risks-have-credible-evidence",
            "disposition": "upheld",
            "reason": "Migration, missing targets, content backup, freshness, packaging and the installed b7 state have repeatable or direct evidence.",
            "fact_refs": [
              "FACT-SOURCE-UPGRADE-CONFLICT-002",
              "FACT-SOURCE-UPGRADE-RECOVERY-IMPLEMENTED"
            ],
            "evidence": [
              "../arcforge/tests/provider.test.mjs",
              "runtime/arckit-runtime/test/skill-provisioning-manager.test.mjs",
              "runtime/arckit-runtime/test/package-distribution.test.mjs",
              "verification: installed b7 assessment",
              "verification: full checks in both repositories"
            ],
            "gap_refs": []
          }
        ]
      },
      "evidence": [
        "../arcforge/src/provider/index.ts",
        "../arcforge/src/core/sources.ts",
        "../arcforge/tests/provider.test.mjs",
        "runtime/arckit-runtime/src/skill-provisioning-manager.mjs",
        "runtime/arckit-runtime/desktop/renderer/renderer.js",
        "runtime/arckit-runtime/test/skill-provisioning-manager.test.mjs",
        "runtime/arckit-runtime/test/desktop-renderer.test.mjs",
        "runtime/arckit-runtime/test/package-distribution.test.mjs",
        "verification: full checks and installed-state assessment passed"
      ],
      "runtime_result_ref": "",
      "occurred_at": "2026-08-15T11:31:17.573Z"
    },
    {
      "round": 5,
      "transition_schema_version": "arckit-case-transition/v8",
      "goal": "Review content revision 4 across correctness, problem resolution, evidence, regression risk and minimality.",
      "outcome": "partial",
      "gap_selection": {
        "mode": "candidate",
        "basis": "Completion review is the only ready Case obligation and must inspect the current implementation revision before closure.",
        "snapshot_token": "4ea81bf5fc385948707bf3121996b2244b7a1bf4ef458efbc9214cc28aae626e",
        "selected_ref": "case-gap:CASE-20260815-002:CASE-20260815-002:completion-review:1",
        "considered": [
          {
            "ref": "case-gap:CASE-20260815-002:CASE-20260815-002:completion-review:1",
            "source": "persisted",
            "eligibility": "ready",
            "disposition": "selected",
            "reason": "All ordinary gaps are closed and review is required before Case closure.",
            "priority_basis": {
              "blocking": "high",
              "uncertainty": "low",
              "risk": "high",
              "user_impact": "high"
            }
          },
          {
            "ref": "project-gap:GAP-agent-scenario-evaluation",
            "source": "persisted",
            "eligibility": "case_required",
            "disposition": "deferred",
            "reason": "Separate Case; unrelated to the current completion review.",
            "priority_basis": {
              "uncertainty": "high",
              "risk": "high"
            }
          },
          {
            "ref": "project-gap:GAP-runtime-resilience-and-adapters",
            "source": "persisted",
            "eligibility": "case_required",
            "disposition": "deferred",
            "reason": "Separate Case; broader than this recovery implementation.",
            "priority_basis": {
              "risk": "high",
              "urgency": "medium"
            }
          },
          {
            "ref": "project-gap:GAP-security-real-project-validation",
            "source": "persisted",
            "eligibility": "case_required",
            "disposition": "deferred",
            "reason": "Separate permission-bearing project required.",
            "priority_basis": {
              "risk": "high",
              "urgency": "medium"
            }
          },
          {
            "ref": "project-gap:GAP-cross-record-audit",
            "source": "persisted",
            "eligibility": "case_required",
            "disposition": "deferred",
            "reason": "Separate Case; does not affect this recovery review.",
            "priority_basis": {
              "risk": "high",
              "urgency": "high"
            }
          }
        ],
        "comparison_summary": "The review candidate is the sole ready Case action; Project gaps require separate Cases.",
        "fresh_discovery_summary": "Review itself exposed two bounded implementation findings rather than a more important non-review gap."
      },
      "selected_gap": {
        "id": "CASE-20260815-002:completion-review:1",
        "responsibility": "agent",
        "goal": "Review the completed implementation for correctness, real problem resolution, verification credibility, regression risk, and minimality.",
        "reason": "All ordinary Case gaps and state impacts are closed.",
        "derived_from": [
          "case_result",
          "content_revision:4"
        ],
        "blocked_by": [],
        "priority_basis": {
          "blocking": "high",
          "uncertainty": "low",
          "risk": "high",
          "user_impact": "high"
        },
        "evidence_required": [
          "review evidence for all five completion dimensions"
        ]
      },
      "planned_transition": {
        "goal": "Review content revision 4 across correctness, problem resolution, evidence, regression risk and minimality.",
        "expected_state_change": "Record any actionable findings as ordinary repair gaps or mark the reviewed revision clean."
      },
      "accepted_state_delta": {
        "facts_added": [],
        "facts_superseded": [],
        "impacts_added": [],
        "impacts_updated": [],
        "gaps_added": [],
        "gaps_cancelled": [],
        "resolved_gap": null,
        "resolved_open_questions": [],
        "completed_handoffs": [],
        "resolved_review_findings": [],
        "completion_review_result": {
          "outcome": "findings",
          "reviewer": "agent",
          "reviewed_content_revision": 4,
          "dimensions": {
            "implementation_correctness": "findings",
            "problem_resolution": "clean",
            "verification_credibility": "findings",
            "regression_risk": "findings",
            "minimality": "clean"
          },
          "findings": [
            {
              "id": "CR-UNMANAGED-NEW-PATH",
              "kind": "error",
              "statement": "A policy migration currently treats a changed pre-existing new destination as managed when only the old recorded destination is relationship-owned, allowing silent overwrite of unmanaged content.",
              "responsibility": "agent",
              "artifact_refs": [
                "../arcforge/src/provider/index.ts"
              ],
              "evidence": [
                "code review: policyProvesMigration does not require the unowned current target to be missing"
              ]
            },
            {
              "id": "CR-CONFLICT-DIFF-PROJECTION",
              "kind": "omission",
              "statement": "Typed content conflicts project only path and reason; file-level drift evidence is not carried through provider assessment and Runtime snapshot to the Setup Readiness UI.",
              "responsibility": "agent",
              "artifact_refs": [
                "../arcforge/src/provider/index.ts",
                "runtime/arckit-runtime/src/skill-provisioning-manager.mjs",
                "runtime/arckit-runtime/desktop/renderer/renderer.js"
              ],
              "evidence": [
                "code review: ProvisioningUpgradeItem and publicUpgradeAssessment omit DriftItem.files"
              ]
            }
          ],
          "evidence": [
            "../arcforge/src/provider/index.ts",
            "runtime/arckit-runtime/src/skill-provisioning-manager.mjs",
            "runtime/arckit-runtime/desktop/renderer/renderer.js",
            "review: targeted ownership and interaction-contract inspection"
          ]
        },
        "review_budget_extension": null
      },
      "project_state_delta": {
        "software_definition_changes": [],
        "software_invariant_changes": [],
        "project_gap_changes": [],
        "selection_context_change": null,
        "evidence": []
      },
      "invariant_assessment": {
        "project_revision": 70,
        "judgments": [
          {
            "invariant_ref": "product-expectations-remain-recoverable",
            "disposition": "threatened",
            "reason": "The core path resolves the reported state, but one unsafe destination-collision boundary and one required conflict-detail omission remain.",
            "fact_refs": [
              "FACT-SOURCE-UPGRADE-RECOVERY-CONTRACT",
              "FACT-SOURCE-UPGRADE-RECOVERY-IMPLEMENTED"
            ],
            "evidence": [],
            "gap_refs": [
              "CASE-20260815-002:review-finding:CR-UNMANAGED-NEW-PATH",
              "CASE-20260815-002:review-finding:CR-CONFLICT-DIFF-PROJECTION"
            ]
          },
          {
            "invariant_ref": "interaction-expectations-remain-recoverable",
            "disposition": "threatened",
            "reason": "The conflict action exists but the accepted file-level diff detail is not visible.",
            "fact_refs": [
              "FACT-SOURCE-UPGRADE-RECOVERY-CONTRACT",
              "FACT-SOURCE-UPGRADE-RECOVERY-IMPLEMENTED"
            ],
            "evidence": [],
            "gap_refs": [
              "CASE-20260815-002:review-finding:CR-CONFLICT-DIFF-PROJECTION"
            ]
          },
          {
            "invariant_ref": "visual-language-remains-consistent",
            "disposition": "not_relevant",
            "reason": "The review findings do not change the visual system.",
            "fact_refs": [],
            "evidence": [],
            "gap_refs": []
          },
          {
            "invariant_ref": "technical-decisions-remain-explainable",
            "disposition": "threatened",
            "reason": "Ownership proof must not transfer from an old path to conflicting content at a new path.",
            "fact_refs": [
              "FACT-SOURCE-UPGRADE-RECOVERY-CONTRACT",
              "FACT-SOURCE-UPGRADE-RECOVERY-IMPLEMENTED"
            ],
            "evidence": [],
            "gap_refs": [
              "CASE-20260815-002:review-finding:CR-UNMANAGED-NEW-PATH"
            ]
          },
          {
            "invariant_ref": "accepted-facts-are-realized",
            "disposition": "threatened",
            "reason": "Two bounded review findings show the accepted recovery contract is not yet completely realized.",
            "fact_refs": [
              "FACT-SOURCE-UPGRADE-RECOVERY-CONTRACT",
              "FACT-SOURCE-UPGRADE-RECOVERY-IMPLEMENTED"
            ],
            "evidence": [],
            "gap_refs": [
              "CASE-20260815-002:review-finding:CR-UNMANAGED-NEW-PATH",
              "CASE-20260815-002:review-finding:CR-CONFLICT-DIFF-PROJECTION"
            ]
          },
          {
            "invariant_ref": "material-risks-have-credible-evidence",
            "disposition": "threatened",
            "reason": "The new-path collision and diff projection need focused regression tests before risk evidence is complete.",
            "fact_refs": [
              "FACT-SOURCE-UPGRADE-RECOVERY-IMPLEMENTED"
            ],
            "evidence": [],
            "gap_refs": [
              "CASE-20260815-002:review-finding:CR-UNMANAGED-NEW-PATH",
              "CASE-20260815-002:review-finding:CR-CONFLICT-DIFF-PROJECTION"
            ]
          }
        ]
      },
      "evidence": [
        "../arcforge/src/provider/index.ts",
        "runtime/arckit-runtime/src/skill-provisioning-manager.mjs",
        "runtime/arckit-runtime/desktop/renderer/renderer.js",
        "review: content revision 4 inspected across all five dimensions"
      ],
      "runtime_result_ref": "",
      "occurred_at": "2026-08-15T11:33:39.403Z"
    },
    {
      "round": 6,
      "transition_schema_version": "arckit-case-transition/v8",
      "goal": "Prevent old-path ownership from authorizing overwrite of conflicting content at a new policy destination.",
      "outcome": "completed",
      "gap_selection": {
        "mode": "candidate",
        "basis": "The unmanaged new-path overwrite is the higher-risk review finding because it can destroy content; diff projection is important but non-destructive.",
        "snapshot_token": "d80cca8726ba6929e4a7966583718f0622874b4ed94bef52020873b41a10ad05",
        "selected_ref": "case-gap:CASE-20260815-002:CASE-20260815-002:review-finding:CR-UNMANAGED-NEW-PATH",
        "considered": [
          {
            "ref": "case-gap:CASE-20260815-002:CASE-20260815-002:review-finding:CR-UNMANAGED-NEW-PATH",
            "source": "persisted",
            "eligibility": "ready",
            "disposition": "selected",
            "reason": "Potential silent overwrite is the highest-risk current obligation.",
            "priority_basis": {
              "blocking": "high",
              "risk": "high"
            }
          },
          {
            "ref": "case-gap:CASE-20260815-002:CASE-20260815-002:review-finding:CR-CONFLICT-DIFF-PROJECTION",
            "source": "persisted",
            "eligibility": "ready",
            "disposition": "deferred",
            "reason": "Required next, but it does not create destructive overwrite risk.",
            "priority_basis": {
              "blocking": "high",
              "risk": "high"
            }
          },
          {
            "ref": "project-gap:GAP-agent-scenario-evaluation",
            "source": "persisted",
            "eligibility": "case_required",
            "disposition": "deferred",
            "reason": "Separate Case.",
            "priority_basis": {
              "uncertainty": "high",
              "risk": "high"
            }
          },
          {
            "ref": "project-gap:GAP-runtime-resilience-and-adapters",
            "source": "persisted",
            "eligibility": "case_required",
            "disposition": "deferred",
            "reason": "Separate Case.",
            "priority_basis": {
              "risk": "high",
              "urgency": "medium"
            }
          },
          {
            "ref": "project-gap:GAP-security-real-project-validation",
            "source": "persisted",
            "eligibility": "case_required",
            "disposition": "deferred",
            "reason": "Separate Case.",
            "priority_basis": {
              "risk": "high",
              "urgency": "medium"
            }
          },
          {
            "ref": "project-gap:GAP-cross-record-audit",
            "source": "persisted",
            "eligibility": "case_required",
            "disposition": "deferred",
            "reason": "Separate Case.",
            "priority_basis": {
              "risk": "high",
              "urgency": "high"
            }
          }
        ],
        "comparison_summary": "The destructive ownership-boundary finding outranks the remaining presentation omission.",
        "fresh_discovery_summary": "Review of the repair exposed no additional higher-priority gap."
      },
      "selected_gap": {
        "id": "CASE-20260815-002:review-finding:CR-UNMANAGED-NEW-PATH",
        "responsibility": "agent",
        "goal": "Resolve review finding: A policy migration currently treats a changed pre-existing new destination as managed when only the old recorded destination is relationship-owned, allowing silent overwrite of unmanaged content.",
        "reason": "error found by completion review",
        "derived_from": [
          "completion_review",
          "content_revision:4"
        ],
        "blocked_by": [],
        "priority_basis": {
          "blocking": "high",
          "uncertainty": "",
          "risk": "high",
          "user_impact": ""
        },
        "evidence_required": [
          "../arcforge/src/provider/index.ts",
          "code review: policyProvesMigration does not require the unowned current target to be missing"
        ]
      },
      "planned_transition": {
        "goal": "Prevent old-path ownership from authorizing overwrite of conflicting content at a new policy destination.",
        "expected_state_change": "Only missing new destinations can be inferred as provider migrations; existing changed destinations remain unmanaged conflicts, and legacy recorded paths require digest/source comparison."
      },
      "accepted_state_delta": {
        "facts_added": [
          {
            "id": "FACT-SOURCE-UPGRADE-OWNERSHIP-BOUNDARY",
            "revision": 1,
            "status": "accepted",
            "statement": "Policy migration ownership now transfers only to a missing new destination. A pre-existing changed new destination is unmanaged and cannot be backed up or overwritten by the provider. Existing legacy recorded destinations are compared with relation evidence or the verified old source and become managed migration only when unchanged; otherwise they require preservation.",
            "basis": "Focused provider logic and regression tests exercise missing migration, changed unowned new paths and legacy unverified content.",
            "evidence": [
              "../arcforge/src/provider/index.ts",
              "../arcforge/tests/provider.test.mjs",
              "verification: provider test rejects changed new-path content as unmanaged-conflict"
            ]
          }
        ],
        "facts_superseded": [],
        "impacts_added": [],
        "impacts_updated": [
          {
            "id": "IMPACT-SOURCE-UPGRADE-REALIZATION",
            "fact_id": "FACT-SOURCE-UPGRADE-OWNERSHIP-BOUNDARY",
            "fact_revision": 1,
            "target": {
              "kind": "software_invariant",
              "ref": "accepted-facts-are-realized",
              "revision": null
            },
            "effect": "threatened",
            "reason": "Ownership safety is repaired, but file-level conflict evidence still needs projection through Runtime and Renderer.",
            "gap_ids": [
              "CASE-20260815-002:review-finding:CR-CONFLICT-DIFF-PROJECTION"
            ],
            "evidence": [
              "../arcforge/src/provider/index.ts",
              "../arcforge/tests/provider.test.mjs"
            ]
          }
        ],
        "gaps_added": [],
        "gaps_cancelled": [],
        "resolved_gap": {
          "id": "CASE-20260815-002:review-finding:CR-UNMANAGED-NEW-PATH",
          "status": "resolved",
          "outcome": "Changed content at an unowned new policy path is now an unmanaged conflict; only missing new paths inherit migration proof, and recorded legacy content is digest/source checked before migration.",
          "reason": "Focused provider tests cover both the safe missing-path migration and the conflicting pre-existing new-path boundary.",
          "evidence": [
            "../arcforge/src/provider/index.ts",
            "../arcforge/tests/provider.test.mjs",
            "verification: provider targeted test passed"
          ]
        },
        "resolved_open_questions": [],
        "completed_handoffs": [],
        "resolved_review_findings": [
          {
            "id": "CR-UNMANAGED-NEW-PATH",
            "resolution": "resolved",
            "reason": "Ownership transfer is limited to missing destinations and conflicting content remains unmanaged.",
            "evidence": [
              "../arcforge/src/provider/index.ts",
              "../arcforge/tests/provider.test.mjs"
            ]
          }
        ],
        "completion_review_result": null,
        "review_budget_extension": null
      },
      "project_state_delta": {
        "software_definition_changes": [],
        "software_invariant_changes": [],
        "project_gap_changes": [],
        "selection_context_change": null,
        "evidence": []
      },
      "invariant_assessment": {
        "project_revision": 70,
        "judgments": [
          {
            "invariant_ref": "product-expectations-remain-recoverable",
            "disposition": "threatened",
            "reason": "Ownership safety is repaired but conflict diff projection remains incomplete.",
            "fact_refs": [
              "FACT-SOURCE-UPGRADE-RECOVERY-CONTRACT",
              "FACT-SOURCE-UPGRADE-OWNERSHIP-BOUNDARY"
            ],
            "evidence": [],
            "gap_refs": [
              "CASE-20260815-002:review-finding:CR-CONFLICT-DIFF-PROJECTION"
            ]
          },
          {
            "invariant_ref": "interaction-expectations-remain-recoverable",
            "disposition": "threatened",
            "reason": "File-level conflict details remain to be projected.",
            "fact_refs": [
              "FACT-SOURCE-UPGRADE-RECOVERY-CONTRACT"
            ],
            "evidence": [],
            "gap_refs": [
              "CASE-20260815-002:review-finding:CR-CONFLICT-DIFF-PROJECTION"
            ]
          },
          {
            "invariant_ref": "visual-language-remains-consistent",
            "disposition": "not_relevant",
            "reason": "This repair changes provider classification rather than visual language.",
            "fact_refs": [],
            "evidence": [],
            "gap_refs": []
          },
          {
            "invariant_ref": "technical-decisions-remain-explainable",
            "disposition": "upheld",
            "reason": "Relationship evidence no longer grants ownership over conflicting content at a new path.",
            "fact_refs": [
              "FACT-SOURCE-UPGRADE-OWNERSHIP-BOUNDARY"
            ],
            "evidence": [
              "../arcforge/src/provider/index.ts",
              "../arcforge/tests/provider.test.mjs"
            ],
            "gap_refs": []
          },
          {
            "invariant_ref": "accepted-facts-are-realized",
            "disposition": "threatened",
            "reason": "The remaining diff projection finding prevents complete realization.",
            "fact_refs": [
              "FACT-SOURCE-UPGRADE-RECOVERY-CONTRACT",
              "FACT-SOURCE-UPGRADE-OWNERSHIP-BOUNDARY"
            ],
            "evidence": [],
            "gap_refs": [
              "CASE-20260815-002:review-finding:CR-CONFLICT-DIFF-PROJECTION"
            ]
          },
          {
            "invariant_ref": "material-risks-have-credible-evidence",
            "disposition": "threatened",
            "reason": "Ownership collision is covered, while diff projection still needs focused evidence.",
            "fact_refs": [
              "FACT-SOURCE-UPGRADE-OWNERSHIP-BOUNDARY"
            ],
            "evidence": [],
            "gap_refs": [
              "CASE-20260815-002:review-finding:CR-CONFLICT-DIFF-PROJECTION"
            ]
          }
        ]
      },
      "evidence": [
        "../arcforge/src/provider/index.ts",
        "../arcforge/tests/provider.test.mjs",
        "verification: provider targeted test and TypeScript compile passed"
      ],
      "runtime_result_ref": "",
      "occurred_at": "2026-08-15T11:38:03.304Z"
    },
    {
      "round": 7,
      "transition_schema_version": "arckit-case-transition/v8",
      "goal": "Carry file-level drift evidence from provider classification through Runtime projection into Setup Readiness.",
      "outcome": "completed",
      "gap_selection": {
        "mode": "candidate",
        "basis": "The only ready Case gap is the completion-review finding that file-level conflict evidence is not projected to the user.",
        "snapshot_token": "96912658b92d903c1af56886485e24cc9bdd3db06b792fdc8e8124da1a61ee8c",
        "selected_ref": "case-gap:CASE-20260815-002:CASE-20260815-002:review-finding:CR-CONFLICT-DIFF-PROJECTION",
        "considered": [
          {
            "ref": "case-gap:CASE-20260815-002:CASE-20260815-002:review-finding:CR-CONFLICT-DIFF-PROJECTION",
            "source": "persisted",
            "eligibility": "ready",
            "disposition": "selected",
            "reason": "It is the sole ready Case obligation and completes the conflict-explanation contract.",
            "priority_basis": {
              "blocking": "high",
              "risk": "high"
            }
          },
          {
            "ref": "project-gap:GAP-agent-scenario-evaluation",
            "source": "persisted",
            "eligibility": "case_required",
            "disposition": "deferred",
            "reason": "Separate Case.",
            "priority_basis": {
              "uncertainty": "high",
              "risk": "high"
            }
          },
          {
            "ref": "project-gap:GAP-runtime-resilience-and-adapters",
            "source": "persisted",
            "eligibility": "case_required",
            "disposition": "deferred",
            "reason": "Separate Case.",
            "priority_basis": {
              "risk": "high",
              "urgency": "medium"
            }
          },
          {
            "ref": "project-gap:GAP-security-real-project-validation",
            "source": "persisted",
            "eligibility": "case_required",
            "disposition": "deferred",
            "reason": "Separate Case.",
            "priority_basis": {
              "risk": "high",
              "urgency": "medium"
            }
          },
          {
            "ref": "project-gap:GAP-cross-record-audit",
            "source": "persisted",
            "eligibility": "case_required",
            "disposition": "deferred",
            "reason": "Separate Case.",
            "priority_basis": {
              "risk": "high",
              "urgency": "high"
            }
          }
        ],
        "comparison_summary": "The diff-projection finding is the only ready obligation in this Case; Project gaps require separate Cases.",
        "fresh_discovery_summary": "Focused review found no additional higher-priority gap."
      },
      "selected_gap": {
        "id": "CASE-20260815-002:review-finding:CR-CONFLICT-DIFF-PROJECTION",
        "responsibility": "agent",
        "goal": "Resolve review finding: Typed content conflicts project only path and reason; file-level drift evidence is not carried through provider assessment and Runtime snapshot to the Setup Readiness UI.",
        "reason": "omission found by completion review",
        "derived_from": [
          "completion_review",
          "content_revision:4"
        ],
        "blocked_by": [],
        "priority_basis": {
          "blocking": "high",
          "uncertainty": "",
          "risk": "high",
          "user_impact": ""
        },
        "evidence_required": [
          "../arcforge/src/provider/index.ts",
          "runtime/arckit-runtime/src/skill-provisioning-manager.mjs",
          "runtime/arckit-runtime/desktop/renderer/renderer.js",
          "code review: ProvisioningUpgradeItem and publicUpgradeAssessment omit DriftItem.files"
        ]
      },
      "planned_transition": {
        "goal": "Carry file-level drift evidence from provider classification through Runtime projection into Setup Readiness.",
        "expected_state_change": "Every typed content conflict can show which files are missing, changed or unexpected before the user chooses preservation or recovery."
      },
      "accepted_state_delta": {
        "facts_added": [
          {
            "id": "FACT-SOURCE-UPGRADE-DIFF-PROJECTION",
            "revision": 1,
            "status": "accepted",
            "statement": "Source-upgrade assessment now preserves per-file drift details from provider comparison through the public Runtime snapshot, and Setup Readiness renders each affected relative path and status under its typed conflict item.",
            "basis": "Provider, Runtime and Renderer tests exercise the same file-level evidence projection.",
            "evidence": [
              "../arcforge/src/provider/index.ts",
              "runtime/arckit-runtime/src/skill-provisioning-manager.mjs",
              "runtime/arckit-runtime/desktop/renderer/renderer.js",
              "runtime/arckit-runtime/test/desktop-renderer.test.mjs"
            ]
          }
        ],
        "facts_superseded": [],
        "impacts_added": [],
        "impacts_updated": [
          {
            "id": "IMPACT-SOURCE-UPGRADE-REALIZATION",
            "fact_id": "FACT-SOURCE-UPGRADE-DIFF-PROJECTION",
            "fact_revision": 1,
            "target": {
              "kind": "software_invariant",
              "ref": "accepted-facts-are-realized",
              "revision": null
            },
            "effect": "upheld",
            "reason": "The recovery contract, ownership boundary and user-visible conflict evidence are implemented across provider, Runtime and Renderer.",
            "gap_ids": [],
            "evidence": [
              "../arcforge/src/provider/index.ts",
              "runtime/arckit-runtime/src/skill-provisioning-manager.mjs",
              "runtime/arckit-runtime/desktop/renderer/renderer.js",
              "verification: focused provider and Runtime tests passed"
            ]
          }
        ],
        "gaps_added": [],
        "gaps_cancelled": [],
        "resolved_gap": {
          "id": "CASE-20260815-002:review-finding:CR-CONFLICT-DIFF-PROJECTION",
          "status": "resolved",
          "outcome": "File-level missing, changed and unexpected evidence now reaches Setup Readiness for each typed source-upgrade conflict.",
          "reason": "Focused tests verify provider assessment, Runtime public projection and Renderer output.",
          "evidence": [
            "../arcforge/src/provider/index.ts",
            "runtime/arckit-runtime/src/skill-provisioning-manager.mjs",
            "runtime/arckit-runtime/desktop/renderer/renderer.js",
            "verification: focused provider and Runtime tests passed"
          ]
        },
        "resolved_open_questions": [],
        "completed_handoffs": [],
        "resolved_review_findings": [
          {
            "id": "CR-CONFLICT-DIFF-PROJECTION",
            "resolution": "resolved",
            "reason": "Drift file details are preserved and rendered end to end.",
            "evidence": [
              "../arcforge/src/provider/index.ts",
              "runtime/arckit-runtime/src/skill-provisioning-manager.mjs",
              "runtime/arckit-runtime/desktop/renderer/renderer.js"
            ]
          }
        ],
        "completion_review_result": null,
        "review_budget_extension": null
      },
      "project_state_delta": {
        "software_definition_changes": [],
        "software_invariant_changes": [],
        "project_gap_changes": [],
        "selection_context_change": null,
        "evidence": []
      },
      "invariant_assessment": {
        "project_revision": 70,
        "judgments": [
          {
            "invariant_ref": "product-expectations-remain-recoverable",
            "disposition": "upheld",
            "reason": "The documented typed recovery outcomes are implemented without an unresolved product gap.",
            "fact_refs": [
              "FACT-SOURCE-UPGRADE-RECOVERY-CONTRACT",
              "FACT-SOURCE-UPGRADE-OWNERSHIP-BOUNDARY",
              "FACT-SOURCE-UPGRADE-DIFF-PROJECTION"
            ],
            "evidence": [
              "arckit/spec/arckit-runtime-distribution.md",
              "../arcforge/src/provider/index.ts"
            ],
            "gap_refs": []
          },
          {
            "invariant_ref": "interaction-expectations-remain-recoverable",
            "disposition": "upheld",
            "reason": "The UI exposes typed recovery actions and file-level conflict evidence.",
            "fact_refs": [
              "FACT-SOURCE-UPGRADE-RECOVERY-CONTRACT",
              "FACT-SOURCE-UPGRADE-DIFF-PROJECTION"
            ],
            "evidence": [
              "arckit/interaction/setup-readiness/interaction.md",
              "runtime/arckit-runtime/desktop/renderer/renderer.js",
              "runtime/arckit-runtime/test/desktop-renderer.test.mjs"
            ],
            "gap_refs": []
          },
          {
            "invariant_ref": "visual-language-remains-consistent",
            "disposition": "not_relevant",
            "reason": "This repair uses the existing Setup Readiness visual system and adds no new visual-language decision.",
            "fact_refs": [],
            "evidence": [],
            "gap_refs": []
          },
          {
            "invariant_ref": "technical-decisions-remain-explainable",
            "disposition": "upheld",
            "reason": "Provider classification, ownership evidence, transactional recovery and snapshot projection remain explicit layers.",
            "fact_refs": [
              "FACT-SOURCE-UPGRADE-RECOVERY-CONTRACT",
              "FACT-SOURCE-UPGRADE-OWNERSHIP-BOUNDARY",
              "FACT-SOURCE-UPGRADE-DIFF-PROJECTION"
            ],
            "evidence": [
              "arckit/tech/arckit-runtime/installer-supply-chain.md",
              "../arcforge/src/provider/index.ts",
              "runtime/arckit-runtime/src/skill-provisioning-manager.mjs"
            ],
            "gap_refs": []
          },
          {
            "invariant_ref": "accepted-facts-are-realized",
            "disposition": "upheld",
            "reason": "The accepted recovery contract is realized across provider, Runtime, IPC and Renderer with focused verification.",
            "fact_refs": [
              "FACT-SOURCE-UPGRADE-RECOVERY-CONTRACT",
              "FACT-SOURCE-UPGRADE-RECOVERY-IMPLEMENTED",
              "FACT-SOURCE-UPGRADE-OWNERSHIP-BOUNDARY",
              "FACT-SOURCE-UPGRADE-DIFF-PROJECTION"
            ],
            "evidence": [
              "../arcforge/tests/provider.test.mjs",
              "runtime/arckit-runtime/test/skill-provisioning-manager.test.mjs",
              "runtime/arckit-runtime/test/desktop-renderer.test.mjs"
            ],
            "gap_refs": []
          },
          {
            "invariant_ref": "material-risks-have-credible-evidence",
            "disposition": "upheld",
            "reason": "Tests cover repair, migration, unmanaged collisions, backup/restore, rollback and visible conflict details.",
            "fact_refs": [
              "FACT-SOURCE-UPGRADE-OWNERSHIP-BOUNDARY",
              "FACT-SOURCE-UPGRADE-DIFF-PROJECTION"
            ],
            "evidence": [
              "../arcforge/tests/provider.test.mjs",
              "runtime/arckit-runtime/test/skill-provisioning-manager.test.mjs",
              "runtime/arckit-runtime/test/desktop-renderer.test.mjs"
            ],
            "gap_refs": []
          }
        ]
      },
      "evidence": [
        "../arcforge/src/provider/index.ts",
        "runtime/arckit-runtime/src/skill-provisioning-manager.mjs",
        "runtime/arckit-runtime/desktop/renderer/renderer.js",
        "verification: focused provider and Runtime tests passed"
      ],
      "runtime_result_ref": "",
      "occurred_at": "2026-08-15T11:39:27.046Z"
    },
    {
      "round": 8,
      "transition_schema_version": "arckit-case-transition/v8",
      "goal": "Independently review content revision 6 across all five completion dimensions.",
      "outcome": "completed",
      "gap_selection": {
        "mode": "candidate",
        "basis": "All ordinary Case gaps and state impacts are closed, so the fresh completion review is the required terminal gate for content revision 6.",
        "snapshot_token": "f7023def3040a3d8e9f41cae7e3e98dbe613dfde7c12ee6173acfcab938f44a1",
        "selected_ref": "case-gap:CASE-20260815-002:CASE-20260815-002:completion-review:2",
        "considered": [
          {
            "ref": "case-gap:CASE-20260815-002:CASE-20260815-002:completion-review:2",
            "source": "persisted",
            "eligibility": "ready",
            "disposition": "selected",
            "reason": "It is the sole ready Case obligation and must assess the repaired content revision before resolution.",
            "priority_basis": {
              "blocking": "high",
              "uncertainty": "low",
              "risk": "high",
              "user_impact": "high"
            }
          },
          {
            "ref": "project-gap:GAP-agent-scenario-evaluation",
            "source": "persisted",
            "eligibility": "case_required",
            "disposition": "deferred",
            "reason": "Separate Case; it does not alter this bounded installer-recovery evidence.",
            "priority_basis": {
              "uncertainty": "high",
              "risk": "high"
            }
          },
          {
            "ref": "project-gap:GAP-runtime-resilience-and-adapters",
            "source": "persisted",
            "eligibility": "case_required",
            "disposition": "deferred",
            "reason": "Separate Case; its broader Runtime resilience scope is independent of source-upgrade recovery.",
            "priority_basis": {
              "risk": "high",
              "urgency": "medium"
            }
          },
          {
            "ref": "project-gap:GAP-security-real-project-validation",
            "source": "persisted",
            "eligibility": "case_required",
            "disposition": "excluded",
            "reason": "This Case does not claim broad permission-bearing project validation.",
            "priority_basis": {
              "risk": "high",
              "urgency": "medium"
            }
          },
          {
            "ref": "project-gap:GAP-cross-record-audit",
            "source": "persisted",
            "eligibility": "case_required",
            "disposition": "deferred",
            "reason": "Current records pass trusted validation, but broader cross-record acceptance remains a separate Project result.",
            "priority_basis": {
              "risk": "high",
              "urgency": "high"
            }
          }
        ],
        "comparison_summary": "Selected the required Case completion review; broader Project gaps remain outside this Case scope.",
        "fresh_discovery_summary": "Independent diff inspection, full suites, trusted ledger audits and a read-only assessment of the actual b7 installation found no new error, omission or excess."
      },
      "selected_gap": {
        "id": "CASE-20260815-002:completion-review:2",
        "responsibility": "agent",
        "goal": "Review the completed implementation for correctness, real problem resolution, verification credibility, regression risk, and minimality.",
        "reason": "All ordinary Case gaps and state impacts are closed.",
        "derived_from": [
          "case_result",
          "content_revision:6"
        ],
        "blocked_by": [],
        "priority_basis": {
          "blocking": "high",
          "uncertainty": "low",
          "risk": "high",
          "user_impact": "high"
        },
        "evidence_required": [
          "review evidence for all five completion dimensions"
        ]
      },
      "planned_transition": {
        "goal": "Independently review content revision 6 across all five completion dimensions.",
        "expected_state_change": "Accept a clean review and resolve the Case only if the repaired ownership, evidence and recovery paths remain correct under full and real-state verification."
      },
      "accepted_state_delta": {
        "facts_added": [],
        "facts_superseded": [],
        "impacts_added": [],
        "impacts_updated": [],
        "gaps_added": [],
        "gaps_cancelled": [],
        "resolved_gap": null,
        "resolved_open_questions": [],
        "completed_handoffs": [],
        "resolved_review_findings": [],
        "completion_review_result": {
          "outcome": "clean",
          "reviewer": "agent",
          "reviewed_content_revision": 6,
          "dimensions": {
            "implementation_correctness": "clean",
            "problem_resolution": "clean",
            "verification_credibility": "clean",
            "regression_risk": "clean",
            "minimality": "clean"
          },
          "findings": [],
          "evidence": [
            "arckit/spec/arckit-runtime-distribution.md",
            "arckit/interaction/setup-readiness/interaction.md",
            "arckit/interaction/setup-readiness/default.html",
            "arckit/tech/arckit-runtime/installer-supply-chain.md",
            "../arcforge/src/core/sources.ts",
            "../arcforge/src/provider/index.ts",
            "../arcforge/tests/provider.test.mjs",
            "runtime/arckit-runtime/src/skill-provisioning-manager.mjs",
            "runtime/arckit-runtime/desktop/main.mjs",
            "runtime/arckit-runtime/desktop/preload.cjs",
            "runtime/arckit-runtime/desktop/renderer/renderer.js",
            "runtime/arckit-runtime/test/skill-provisioning-manager.test.mjs",
            "runtime/arckit-runtime/test/desktop-renderer.test.mjs",
            "runtime/arckit-runtime/test/package-distribution.test.mjs",
            "verification: ArcForge full test suite passed 61 of 61 and both TypeScript checks passed",
            "verification: Runtime full check passed 186, failed 0, skipped 1",
            "verification: actual b7 read-only assessment reported canProceed true, writeState not_started, managed-repair 5 and managed-migration 6",
            "verification: both repositories git diff --check and trusted Project, Iteration and Case validation passed"
          ]
        },
        "review_budget_extension": null
      },
      "project_state_delta": {
        "software_definition_changes": [],
        "software_invariant_changes": [],
        "project_gap_changes": [],
        "selection_context_change": null,
        "evidence": []
      },
      "invariant_assessment": {
        "project_revision": 70,
        "judgments": [
          {
            "invariant_ref": "product-expectations-remain-recoverable",
            "disposition": "upheld",
            "reason": "Review confirms Setup Readiness distinguishes safe managed repair and migration from content conflicts and offers an action appropriate to each class.",
            "fact_refs": [
              "FACT-SOURCE-UPGRADE-RECOVERY-CONTRACT",
              "FACT-SOURCE-UPGRADE-RECOVERY-IMPLEMENTED",
              "FACT-SOURCE-UPGRADE-OWNERSHIP-BOUNDARY",
              "FACT-SOURCE-UPGRADE-DIFF-PROJECTION"
            ],
            "evidence": [
              "arckit/spec/arckit-runtime-distribution.md",
              "runtime/arckit-runtime/src/skill-provisioning-manager.mjs",
              "verification: actual b7 read-only assessment reported canProceed true"
            ],
            "gap_refs": []
          },
          {
            "invariant_ref": "interaction-expectations-remain-recoverable",
            "disposition": "upheld",
            "reason": "Review confirms the former exit/retry dead end now presents repair or migration, backup-and-restore, preserve-and-exit and typed file details.",
            "fact_refs": [
              "FACT-SOURCE-UPGRADE-RECOVERY-CONTRACT",
              "FACT-SOURCE-UPGRADE-DIFF-PROJECTION"
            ],
            "evidence": [
              "arckit/interaction/setup-readiness/interaction.md",
              "arckit/interaction/setup-readiness/default.html",
              "runtime/arckit-runtime/desktop/renderer/renderer.js",
              "runtime/arckit-runtime/test/desktop-renderer.test.mjs"
            ],
            "gap_refs": []
          },
          {
            "invariant_ref": "visual-language-remains-consistent",
            "disposition": "not_relevant",
            "reason": "Review confirms the repair reuses the existing Setup Readiness layout and controls without changing visual tokens or visual-language decisions.",
            "fact_refs": [],
            "evidence": [],
            "gap_refs": []
          },
          {
            "invariant_ref": "technical-decisions-remain-explainable",
            "disposition": "upheld",
            "reason": "Review confirms ownership proof, last-applied evidence, immutable assessment digests, transactional backup/rollback and provider capability negotiation are explicit and bounded.",
            "fact_refs": [
              "FACT-SOURCE-UPGRADE-RECOVERY-CONTRACT",
              "FACT-SOURCE-UPGRADE-OWNERSHIP-BOUNDARY",
              "FACT-SOURCE-UPGRADE-DIFF-PROJECTION"
            ],
            "evidence": [
              "arckit/tech/arckit-runtime/installer-supply-chain.md",
              "../arcforge/src/provider/index.ts",
              "../arcforge/src/core/sources.ts",
              "runtime/arckit-runtime/src/skill-provisioning-manager.mjs"
            ],
            "gap_refs": []
          },
          {
            "invariant_ref": "accepted-facts-are-realized",
            "disposition": "upheld",
            "reason": "Review confirms the accepted recovery contract is implemented end to end and the reported b7 state is now evaluated as actionable managed work without writes.",
            "fact_refs": [
              "FACT-SOURCE-UPGRADE-RECOVERY-CONTRACT",
              "FACT-SOURCE-UPGRADE-RECOVERY-IMPLEMENTED",
              "FACT-SOURCE-UPGRADE-OWNERSHIP-BOUNDARY",
              "FACT-SOURCE-UPGRADE-DIFF-PROJECTION"
            ],
            "evidence": [
              "../arcforge/tests/provider.test.mjs",
              "runtime/arckit-runtime/test/skill-provisioning-manager.test.mjs",
              "runtime/arckit-runtime/test/desktop-renderer.test.mjs",
              "verification: actual b7 read-only assessment reported managed-repair 5 and managed-migration 6"
            ],
            "gap_refs": []
          },
          {
            "invariant_ref": "material-risks-have-credible-evidence",
            "disposition": "upheld",
            "reason": "Review covers missing managed paths, loader and policy migrations, changed owned content, unverified legacy content, unmanaged new-path collisions, file diff projection, backup/restore and rollback.",
            "fact_refs": [
              "FACT-SOURCE-UPGRADE-OWNERSHIP-BOUNDARY",
              "FACT-SOURCE-UPGRADE-DIFF-PROJECTION"
            ],
            "evidence": [
              "../arcforge/tests/provider.test.mjs",
              "runtime/arckit-runtime/test/skill-provisioning-manager.test.mjs",
              "runtime/arckit-runtime/test/package-distribution.test.mjs",
              "verification: ArcForge 61 of 61 and Runtime 186 passed, 0 failed"
            ],
            "gap_refs": []
          }
        ]
      },
      "evidence": [
        "../arcforge/src/provider/index.ts",
        "../arcforge/tests/provider.test.mjs",
        "runtime/arckit-runtime/src/skill-provisioning-manager.mjs",
        "runtime/arckit-runtime/desktop/renderer/renderer.js",
        "runtime/arckit-runtime/test/skill-provisioning-manager.test.mjs",
        "verification: ArcForge full test suite passed 61 of 61 and TypeScript checks passed",
        "verification: Runtime full check passed 186, failed 0, skipped 1",
        "verification: actual b7 read-only assessment reported canProceed true, writeState not_started, managed-repair 5 and managed-migration 6",
        "verification: repository diff checks and trusted ledger audits passed"
      ],
      "runtime_result_ref": "",
      "occurred_at": "2026-08-15T11:45:08.176Z"
    }
  ],
  "case_resolution": {
    "status": "resolved",
    "stage": "resolved",
    "satisfied": [
      "GAP-DIAGNOSE-SOURCE-UPGRADE-CONFLICT",
      "GAP-DEFINE-SOURCE-UPGRADE-RECOVERY",
      "GAP-CORRECT-SOURCE-UPGRADE-DIAGNOSIS",
      "GAP-IMPLEMENT-SOURCE-UPGRADE-RECOVERY",
      "CASE-20260815-002:review-finding:CR-UNMANAGED-NEW-PATH",
      "CASE-20260815-002:review-finding:CR-CONFLICT-DIFF-PROJECTION"
    ],
    "remaining": [],
    "blocked": [],
    "reason": "All dynamic gaps and state impacts are closed and the current implementation passed completion review.",
    "candidate_gaps": [],
    "loop_handoff": {
      "version": "loop-handoff/v2",
      "status": "done",
      "next_responsibility": "none",
      "agent_continuation_available": false,
      "human_decision_required": false,
      "trigger_mode": "none",
      "responsibility_reason": "The current Case revision passed completion review.",
      "next_prompt": "",
      "human_gate": {
        "required": false,
        "reason": "",
        "decision_needed": ""
      }
    },
    "updated_at": "2026-08-15T11:45:08.176Z"
  }
}
```

## Round Notes

- Case history is canonical in Structured Record.rounds; keep prose notes exceptional.
