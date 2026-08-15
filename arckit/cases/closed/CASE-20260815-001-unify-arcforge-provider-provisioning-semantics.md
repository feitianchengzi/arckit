# Unify ArcForge provider provisioning semantics

Case: CASE-20260815-001
Status: closed
Artifact Type: mixed
Selected Gap: none
Updated: 2026-08-15T05:56:52.686Z

## User Intent

Persist the ArcForge Core/provider responsibility boundary and optimize the shared-asset provisioning implementation so Runtime uses the same canonical semantics as ordinary ArcForge.

## Structured Record

```json
{
  "schema_version": "development-case-record/v5",
  "id": "CASE-20260815-001",
  "title": "Unify ArcForge provider provisioning semantics",
  "status": "closed",
  "artifact_type": "mixed",
  "created_at": "2026-08-15T05:39:26.493Z",
  "updated_at": "2026-08-15T05:56:52.686Z",
  "user_intent": "Persist the ArcForge Core/provider responsibility boundary and optimize the shared-asset provisioning implementation so Runtime uses the same canonical semantics as ordinary ArcForge.",
  "expected_outcome": "ArcForge Core remains the single implementation of provisioning semantics; the embedded provider only adapts the packaged payload contract, Runtime fails closed on incompatible providers, and tests prove declared shared assets are planned, applied and drifted consistently.",
  "project_state_ref": "arckit/project/state.record.json",
  "current_round": {
    "goal": "",
    "selected_gap": null
  },
  "facts": [
    {
      "id": "FACT-PROVIDER-BOUNDARY-001",
      "revision": 1,
      "status": "accepted",
      "statement": "A macOS installation built from the GitHub-packaged Runtime contains definition/skills/_arckit_shared in the packaged source payload, but Setup Readiness does not announce or install that directory while other skills install normally.",
      "basis": "The user reproduced the released installer behavior on another macOS computer and verified both the packaged payload and final Codex skills directory.",
      "evidence": [
        "user retest: packaged macOS Runtime includes _arckit_shared in source but provider apply omits it"
      ]
    },
    {
      "id": "FACT-PROVIDER-BOUNDARY-002",
      "revision": 1,
      "status": "accepted",
      "statement": "ArcForge CLI, Desktop and embedded provider are intended to share ArcForge Core provisioning semantics; provider capability scope and release version may differ, but overlapping plan/apply/drift behavior must not be independently reimplemented or semantically diverge.",
      "basis": "The user accepted the architecture analysis, and the existing provider imports the same core source functions and packages the provider-used core/shared modules as a versioned artifact.",
      "evidence": [
        "../arcforge/src/provider/index.ts",
        "../arcforge/src/commands/index.ts",
        "../arcforge/scripts/build-provider-package.mjs",
        "arckit/tech/arckit-runtime/installer-supply-chain.md"
      ]
    },
    {
      "id": "FACT-PROVIDER-BOUNDARY-REALIZED",
      "revision": 1,
      "status": "accepted",
      "statement": "ArcForge provisioning uses one canonical Core plan for skills and shared assets. The embedded provider converts payload.manifest.json sharedAssetPaths into Core source input, exposes Core-computed asset destinations and declares declared-shared-assets/v1; Runtime rejects incompatible or incomplete plans, displays provider destinations without fallback construction, and the macOS-arm64 distribution smoke installs _arckit_shared with clean post-drift.",
      "basis": "Durable architecture documentation, direct Core/provider plan equality, transactional provider tests, complete ArcForge and Runtime suites, provider artifact inspection and installed-target distribution smoke agree.",
      "evidence": [
        "arckit/tech/arckit-runtime/installer-supply-chain.md",
        "arckit/tech/INDEX.md",
        "../arcforge/src/shared/types.ts",
        "../arcforge/src/core/sources.ts",
        "../arcforge/src/core/skill-availability.ts",
        "../arcforge/src/core/skill-availability-apply.ts",
        "../arcforge/src/core/skill-availability-drift.ts",
        "../arcforge/src/provider/index.ts",
        "../arcforge/scripts/build-provider-package.mjs",
        "../arcforge/tests/provider.test.mjs",
        "runtime/arckit-runtime/scripts/prepare-distribution.mjs",
        "runtime/arckit-runtime/src/skill-provisioning-manager.mjs",
        "runtime/arckit-runtime/desktop/renderer/renderer.js",
        "runtime/arckit-runtime/test/package-distribution.test.mjs",
        "runtime/arckit-runtime/test/skill-provisioning-manager.test.mjs",
        "runtime/arckit-runtime/scripts/smoke-distribution.mjs",
        "verification: ArcForge npm test passed 61 of 61",
        "verification: Runtime npm run check passed 184, failed 0, skipped 1",
        "verification: macOS-arm64 distribution smoke installed 1 shared asset and converged with missing 0 changed 0 same 14",
        "verification: ArcForge npm run check and both repositories git diff --check passed"
      ]
    }
  ],
  "state_impacts": [
    {
      "id": "IMPACT-PROVIDER-BOUNDARY-TECH",
      "fact_id": "FACT-PROVIDER-BOUNDARY-002",
      "fact_revision": 1,
      "target": {
        "kind": "software_decision",
        "ref": "technical_foundation",
        "revision": 12
      },
      "effect": "upheld",
      "reason": "The durable architecture and implementation now enforce ArcForge Core as the sole provisioning semantic source with provider and Runtime kept as bounded adapters.",
      "gap_ids": [],
      "evidence": [
        "arckit/tech/arckit-runtime/installer-supply-chain.md",
        "../arcforge/src/core/skill-availability.ts",
        "../arcforge/src/provider/index.ts",
        "runtime/arckit-runtime/src/skill-provisioning-manager.mjs",
        "verification: ArcForge npm test passed 61 of 61",
        "verification: Runtime npm run check passed 184, failed 0, skipped 1",
        "verification: macOS-arm64 distribution smoke installed 1 shared asset and converged with missing 0 changed 0 same 14",
        "verification: ArcForge npm run check and both repositories git diff --check passed"
      ]
    },
    {
      "id": "IMPACT-PROVIDER-BOUNDARY-DELIVERY",
      "fact_id": "FACT-PROVIDER-BOUNDARY-001",
      "fact_revision": 1,
      "target": {
        "kind": "software_decision",
        "ref": "delivery_and_distribution",
        "revision": 3
      },
      "effect": "upheld",
      "reason": "The locked provider capability and packaged payload now produce a complete Codex installation including _arckit_shared.",
      "gap_ids": [],
      "evidence": [
        "runtime/arckit-runtime/scripts/prepare-distribution.mjs",
        "runtime/arckit-runtime/scripts/smoke-distribution.mjs",
        "verification: ArcForge npm test passed 61 of 61",
        "verification: Runtime npm run check passed 184, failed 0, skipped 1",
        "verification: macOS-arm64 distribution smoke installed 1 shared asset and converged with missing 0 changed 0 same 14",
        "verification: ArcForge npm run check and both repositories git diff --check passed"
      ]
    },
    {
      "id": "IMPACT-PROVIDER-BOUNDARY-REALIZATION",
      "fact_id": "FACT-PROVIDER-BOUNDARY-001",
      "fact_revision": 1,
      "target": {
        "kind": "software_invariant",
        "ref": "accepted-facts-are-realized",
        "revision": null
      },
      "effect": "upheld",
      "reason": "The same provider artifact and Runtime distribution flow installs the required shared directory and post-apply drift converges.",
      "gap_ids": [],
      "evidence": [
        "../arcforge/tests/provider.test.mjs",
        "runtime/arckit-runtime/scripts/smoke-distribution.mjs",
        "verification: ArcForge npm test passed 61 of 61",
        "verification: Runtime npm run check passed 184, failed 0, skipped 1",
        "verification: macOS-arm64 distribution smoke installed 1 shared asset and converged with missing 0 changed 0 same 14",
        "verification: ArcForge npm run check and both repositories git diff --check passed"
      ]
    }
  ],
  "gaps": [
    {
      "id": "GAP-PROVIDER-BOUNDARY-UNIFY",
      "status": "resolved",
      "goal": "Make the durable architecture and implementation enforce ArcForge Core as the single provisioning semantic source while the embedded provider correctly adapts manifest-declared shared assets for plan, apply and drift.",
      "reason": "The released Runtime payload is complete, but provider source normalization drops an explicitly declared shared asset, producing behavior that differs from ordinary ArcForge and invalidating the previous installation acceptance claim.",
      "derived_from": [
        "FACT-PROVIDER-BOUNDARY-001",
        "FACT-PROVIDER-BOUNDARY-002"
      ],
      "blocked_by": [],
      "priority_basis": {
        "blocking": "high",
        "risk": "high",
        "user_impact": "high",
        "uncertainty": "low"
      },
      "responsibility": "agent",
      "evidence_required": [
        "Durable technical facts define allowed provider surface/version differences and forbid duplicate provisioning semantics.",
        "Provider passes declared shared assets into the shared ArcForge Core plan/apply/drift pipeline without Runtime implementing copy semantics.",
        "Provider compatibility and cross-boundary regression evidence fail closed and prove installed-target convergence."
      ],
      "resolution": {
        "id": "GAP-PROVIDER-BOUNDARY-UNIFY",
        "status": "resolved",
        "outcome": "ArcForge Core now owns shared-asset discovery, destinations, digests, apply, drift and relation state; provider adapts manifest declarations and projects the Core plan, while Runtime gates capabilities and completeness without deriving install targets.",
        "reason": "Core/provider conformance tests, complete repository checks, provider packaging and a real macOS-arm64 distribution smoke prove the single implementation installs _arckit_shared and converges cleanly.",
        "evidence": [
          "arckit/tech/arckit-runtime/installer-supply-chain.md",
          "arckit/tech/INDEX.md",
          "../arcforge/src/shared/types.ts",
          "../arcforge/src/core/sources.ts",
          "../arcforge/src/core/skill-availability.ts",
          "../arcforge/src/core/skill-availability-apply.ts",
          "../arcforge/src/core/skill-availability-drift.ts",
          "../arcforge/src/provider/index.ts",
          "../arcforge/scripts/build-provider-package.mjs",
          "../arcforge/tests/provider.test.mjs",
          "runtime/arckit-runtime/scripts/prepare-distribution.mjs",
          "runtime/arckit-runtime/src/skill-provisioning-manager.mjs",
          "runtime/arckit-runtime/desktop/renderer/renderer.js",
          "runtime/arckit-runtime/test/package-distribution.test.mjs",
          "runtime/arckit-runtime/test/skill-provisioning-manager.test.mjs",
          "runtime/arckit-runtime/scripts/smoke-distribution.mjs",
          "verification: ArcForge npm test passed 61 of 61",
          "verification: Runtime npm run check passed 184, failed 0, skipped 1",
          "verification: macOS-arm64 distribution smoke installed 1 shared asset and converged with missing 0 changed 0 same 14",
          "verification: ArcForge npm run check and both repositories git diff --check passed"
        ],
        "occurred_at": "2026-08-15T05:51:40.850Z"
      }
    }
  ],
  "content_revision": 1,
  "completion_review": {
    "status": "clean",
    "policy": {
      "initial_max_cycles": 3,
      "source": "$using-arckit user-authorized loop",
      "snapshotted_at": "2026-08-15T05:39:26.493Z"
    },
    "additional_cycles_authorized": 0,
    "cycle_count": 1,
    "reviewed_content_revision": 1,
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
        "outcome": "clean",
        "content_revision": 1,
        "dimensions": {
          "implementation_correctness": "clean",
          "problem_resolution": "clean",
          "verification_credibility": "clean",
          "regression_risk": "clean",
          "minimality": "clean"
        },
        "finding_ids": [],
        "evidence": [
          "arckit/tech/arckit-runtime/installer-supply-chain.md",
          "../arcforge/src/core/skill-availability.ts",
          "../arcforge/src/core/skill-availability-apply.ts",
          "../arcforge/src/core/skill-availability-drift.ts",
          "../arcforge/src/provider/index.ts",
          "../arcforge/tests/provider.test.mjs",
          "runtime/arckit-runtime/src/skill-provisioning-manager.mjs",
          "runtime/arckit-runtime/scripts/prepare-distribution.mjs",
          "runtime/arckit-runtime/scripts/smoke-distribution.mjs",
          "runtime/arckit-runtime/test/package-distribution.test.mjs",
          "runtime/arckit-runtime/test/skill-provisioning-manager.test.mjs",
          "verification: direct Core/provider plan conformance and availability tests passed 26 of 26",
          "verification: ArcForge full test suite passed 61 of 61 and TypeScript checks passed",
          "verification: Runtime focused provisioning and UI tests passed 14 of 14",
          "verification: Runtime full check passed 184, failed 0, skipped 1",
          "verification: macOS-arm64 distribution smoke installed 1 shared asset and converged with missing 0 changed 0 same 14",
          "verification: both repository diffs and trusted Project/Case audits passed"
        ],
        "occurred_at": "2026-08-15T05:56:52.686Z"
      }
    ],
    "evidence": [
      "arckit/tech/arckit-runtime/installer-supply-chain.md",
      "../arcforge/src/core/skill-availability.ts",
      "../arcforge/src/core/skill-availability-apply.ts",
      "../arcforge/src/core/skill-availability-drift.ts",
      "../arcforge/src/provider/index.ts",
      "../arcforge/tests/provider.test.mjs",
      "runtime/arckit-runtime/src/skill-provisioning-manager.mjs",
      "runtime/arckit-runtime/scripts/prepare-distribution.mjs",
      "runtime/arckit-runtime/scripts/smoke-distribution.mjs",
      "runtime/arckit-runtime/test/package-distribution.test.mjs",
      "runtime/arckit-runtime/test/skill-provisioning-manager.test.mjs",
      "verification: direct Core/provider plan conformance and availability tests passed 26 of 26",
      "verification: ArcForge full test suite passed 61 of 61 and TypeScript checks passed",
      "verification: Runtime focused provisioning and UI tests passed 14 of 14",
      "verification: Runtime full check passed 184, failed 0, skipped 1",
      "verification: macOS-arm64 distribution smoke installed 1 shared asset and converged with missing 0 changed 0 same 14",
      "verification: both repository diffs and trusted Project/Case audits passed"
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
      "goal": "Persist the single-semantic-source boundary, make shared assets first-class Core plan items, reduce provider and Runtime to adapters and compatibility gates, and verify the packaged macOS installation path.",
      "outcome": "completed",
      "gap_selection": {
        "mode": "candidate",
        "basis": "The reproduced provider omission blocks the current released installation outcome and has a bounded, directly verifiable Core/provider/Runtime repair, so it outranks broader unrelated Project gaps.",
        "snapshot_token": "8687c87a2d53a099eaa04e4272b27897f7d43e00f651ed6684d94bff6596a3f0",
        "selected_ref": "case-gap:CASE-20260815-001:GAP-PROVIDER-BOUNDARY-UNIFY",
        "comparison_summary": "Selected the ready provider-boundary Case Gap; deferred the four case-required Project gaps because none blocks or better matches the user-reproduced packaged-install regression.",
        "fresh_discovery_summary": "No additional fresh candidate was discovered; implementation and verification stayed inside the accepted Core/provider/Runtime boundary.",
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
            "reason": "Requires a separate real-scenario evaluation Case and does not unblock the current installer regression."
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
            "reason": "Its timeout, compaction and broader adapter scope remains separate from the bounded provisioning adapter defect."
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
            "reason": "The accepted facts do not involve credentials, sensitive data or a permission-bearing external resource."
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
            "reason": "Cross-record auditing remains important but does not repair the user-visible packaged installation failure."
          },
          {
            "ref": "case-gap:CASE-20260815-001:GAP-PROVIDER-BOUNDARY-UNIFY",
            "source": "persisted",
            "eligibility": "ready",
            "disposition": "selected",
            "priority_basis": {
              "blocking": "high",
              "uncertainty": "low",
              "risk": "high",
              "user_impact": "high"
            },
            "reason": "It directly covers the accepted architecture decision, provider omission, implementation boundary and repeatable installed-target evidence."
          }
        ]
      },
      "selected_gap": {
        "id": "GAP-PROVIDER-BOUNDARY-UNIFY",
        "responsibility": "agent",
        "goal": "Make the durable architecture and implementation enforce ArcForge Core as the single provisioning semantic source while the embedded provider correctly adapts manifest-declared shared assets for plan, apply and drift.",
        "reason": "The released Runtime payload is complete, but provider source normalization drops an explicitly declared shared asset, producing behavior that differs from ordinary ArcForge and invalidating the previous installation acceptance claim.",
        "derived_from": [
          "FACT-PROVIDER-BOUNDARY-001",
          "FACT-PROVIDER-BOUNDARY-002"
        ],
        "blocked_by": [],
        "priority_basis": {
          "blocking": "high",
          "uncertainty": "low",
          "risk": "high",
          "user_impact": "high"
        },
        "evidence_required": [
          "Durable technical facts define allowed provider surface/version differences and forbid duplicate provisioning semantics.",
          "Provider passes declared shared assets into the shared ArcForge Core plan/apply/drift pipeline without Runtime implementing copy semantics.",
          "Provider compatibility and cross-boundary regression evidence fail closed and prove installed-target convergence."
        ]
      },
      "planned_transition": {
        "goal": "Persist the single-semantic-source boundary, make shared assets first-class Core plan items, reduce provider and Runtime to adapters and compatibility gates, and verify the packaged macOS installation path.",
        "expected_state_change": "Resolve the provider-boundary Gap with durable architecture facts, canonical Core behavior and repeatable distribution evidence."
      },
      "accepted_state_delta": {
        "resolved_gap": {
          "id": "GAP-PROVIDER-BOUNDARY-UNIFY",
          "status": "resolved",
          "outcome": "ArcForge Core now owns shared-asset discovery, destinations, digests, apply, drift and relation state; provider adapts manifest declarations and projects the Core plan, while Runtime gates capabilities and completeness without deriving install targets.",
          "reason": "Core/provider conformance tests, complete repository checks, provider packaging and a real macOS-arm64 distribution smoke prove the single implementation installs _arckit_shared and converges cleanly.",
          "evidence": [
            "arckit/tech/arckit-runtime/installer-supply-chain.md",
            "arckit/tech/INDEX.md",
            "../arcforge/src/shared/types.ts",
            "../arcforge/src/core/sources.ts",
            "../arcforge/src/core/skill-availability.ts",
            "../arcforge/src/core/skill-availability-apply.ts",
            "../arcforge/src/core/skill-availability-drift.ts",
            "../arcforge/src/provider/index.ts",
            "../arcforge/scripts/build-provider-package.mjs",
            "../arcforge/tests/provider.test.mjs",
            "runtime/arckit-runtime/scripts/prepare-distribution.mjs",
            "runtime/arckit-runtime/src/skill-provisioning-manager.mjs",
            "runtime/arckit-runtime/desktop/renderer/renderer.js",
            "runtime/arckit-runtime/test/package-distribution.test.mjs",
            "runtime/arckit-runtime/test/skill-provisioning-manager.test.mjs",
            "runtime/arckit-runtime/scripts/smoke-distribution.mjs",
            "verification: ArcForge npm test passed 61 of 61",
            "verification: Runtime npm run check passed 184, failed 0, skipped 1",
            "verification: macOS-arm64 distribution smoke installed 1 shared asset and converged with missing 0 changed 0 same 14",
            "verification: ArcForge npm run check and both repositories git diff --check passed"
          ]
        },
        "facts_added": [
          {
            "id": "FACT-PROVIDER-BOUNDARY-REALIZED",
            "revision": 1,
            "status": "accepted",
            "statement": "ArcForge provisioning uses one canonical Core plan for skills and shared assets. The embedded provider converts payload.manifest.json sharedAssetPaths into Core source input, exposes Core-computed asset destinations and declares declared-shared-assets/v1; Runtime rejects incompatible or incomplete plans, displays provider destinations without fallback construction, and the macOS-arm64 distribution smoke installs _arckit_shared with clean post-drift.",
            "basis": "Durable architecture documentation, direct Core/provider plan equality, transactional provider tests, complete ArcForge and Runtime suites, provider artifact inspection and installed-target distribution smoke agree.",
            "evidence": [
              "arckit/tech/arckit-runtime/installer-supply-chain.md",
              "arckit/tech/INDEX.md",
              "../arcforge/src/shared/types.ts",
              "../arcforge/src/core/sources.ts",
              "../arcforge/src/core/skill-availability.ts",
              "../arcforge/src/core/skill-availability-apply.ts",
              "../arcforge/src/core/skill-availability-drift.ts",
              "../arcforge/src/provider/index.ts",
              "../arcforge/scripts/build-provider-package.mjs",
              "../arcforge/tests/provider.test.mjs",
              "runtime/arckit-runtime/scripts/prepare-distribution.mjs",
              "runtime/arckit-runtime/src/skill-provisioning-manager.mjs",
              "runtime/arckit-runtime/desktop/renderer/renderer.js",
              "runtime/arckit-runtime/test/package-distribution.test.mjs",
              "runtime/arckit-runtime/test/skill-provisioning-manager.test.mjs",
              "runtime/arckit-runtime/scripts/smoke-distribution.mjs",
              "verification: ArcForge npm test passed 61 of 61",
              "verification: Runtime npm run check passed 184, failed 0, skipped 1",
              "verification: macOS-arm64 distribution smoke installed 1 shared asset and converged with missing 0 changed 0 same 14",
              "verification: ArcForge npm run check and both repositories git diff --check passed"
            ]
          }
        ],
        "facts_superseded": [],
        "impacts_added": [],
        "impacts_updated": [
          {
            "id": "IMPACT-PROVIDER-BOUNDARY-TECH",
            "fact_id": "FACT-PROVIDER-BOUNDARY-002",
            "fact_revision": 1,
            "target": {
              "kind": "software_decision",
              "ref": "technical_foundation",
              "revision": 12
            },
            "effect": "upheld",
            "reason": "The durable architecture and implementation now enforce ArcForge Core as the sole provisioning semantic source with provider and Runtime kept as bounded adapters.",
            "gap_ids": [],
            "evidence": [
              "arckit/tech/arckit-runtime/installer-supply-chain.md",
              "../arcforge/src/core/skill-availability.ts",
              "../arcforge/src/provider/index.ts",
              "runtime/arckit-runtime/src/skill-provisioning-manager.mjs",
              "verification: ArcForge npm test passed 61 of 61",
              "verification: Runtime npm run check passed 184, failed 0, skipped 1",
              "verification: macOS-arm64 distribution smoke installed 1 shared asset and converged with missing 0 changed 0 same 14",
              "verification: ArcForge npm run check and both repositories git diff --check passed"
            ]
          },
          {
            "id": "IMPACT-PROVIDER-BOUNDARY-DELIVERY",
            "fact_id": "FACT-PROVIDER-BOUNDARY-001",
            "fact_revision": 1,
            "target": {
              "kind": "software_decision",
              "ref": "delivery_and_distribution",
              "revision": 3
            },
            "effect": "upheld",
            "reason": "The locked provider capability and packaged payload now produce a complete Codex installation including _arckit_shared.",
            "gap_ids": [],
            "evidence": [
              "runtime/arckit-runtime/scripts/prepare-distribution.mjs",
              "runtime/arckit-runtime/scripts/smoke-distribution.mjs",
              "verification: ArcForge npm test passed 61 of 61",
              "verification: Runtime npm run check passed 184, failed 0, skipped 1",
              "verification: macOS-arm64 distribution smoke installed 1 shared asset and converged with missing 0 changed 0 same 14",
              "verification: ArcForge npm run check and both repositories git diff --check passed"
            ]
          },
          {
            "id": "IMPACT-PROVIDER-BOUNDARY-REALIZATION",
            "fact_id": "FACT-PROVIDER-BOUNDARY-001",
            "fact_revision": 1,
            "target": {
              "kind": "software_invariant",
              "ref": "accepted-facts-are-realized",
              "revision": null
            },
            "effect": "upheld",
            "reason": "The same provider artifact and Runtime distribution flow installs the required shared directory and post-apply drift converges.",
            "gap_ids": [],
            "evidence": [
              "../arcforge/tests/provider.test.mjs",
              "runtime/arckit-runtime/scripts/smoke-distribution.mjs",
              "verification: ArcForge npm test passed 61 of 61",
              "verification: Runtime npm run check passed 184, failed 0, skipped 1",
              "verification: macOS-arm64 distribution smoke installed 1 shared asset and converged with missing 0 changed 0 same 14",
              "verification: ArcForge npm run check and both repositories git diff --check passed"
            ]
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
        "software_definition_changes": [
          {
            "area_ref": "technical_foundation",
            "observed_revision": 11,
            "set_decision": {
              "status": "settled",
              "statement": "Arckit uses repository-owned Markdown/JSON state, Node.js ESM ledger and Runtime scripts, an Electron Desktop host, Project v5, Case v5, Transition v8, Snapshot v1, Closeout v2 and Iteration v3. Runtime packages trusted capabilities separately from an Arckit skill payload and a versioned ArcForge Embedded Provider; Desktop Setup Readiness owns provisioning while the policy-neutral Runtime Kernel continues natural $using-arckit execution. ArcForge Core is the sole implementation of overlapping provisioning semantics; CLI, Desktop and Embedded Provider are adapters, and Runtime consumes a capability-gated provider artifact without deriving installation targets.",
              "reason": "The accepted provider boundary distinguishes allowed surface/version differences from forbidden semantic duplication and is now realized by the canonical asset plan and packaged installation path.",
              "evidence": [
                "arckit/tech/arckit-runtime/installer-supply-chain.md",
                "../arcforge/src/core/skill-availability.ts",
                "../arcforge/src/provider/index.ts",
                "runtime/arckit-runtime/src/skill-provisioning-manager.mjs",
                "verification: ArcForge npm test passed 61 of 61",
                "verification: Runtime npm run check passed 184, failed 0, skipped 1",
                "verification: macOS-arm64 distribution smoke installed 1 shared asset and converged with missing 0 changed 0 same 14",
                "verification: ArcForge npm run check and both repositories git diff --check passed"
              ],
              "confidence": "high",
              "resume_condition": ""
            },
            "gap_refs": [
              "GAP-runtime-resilience-and-adapters"
            ],
            "reason": "The durable technical foundation now explicitly records the single provisioning semantic source while preserving the independent broader Runtime resilience gap.",
            "evidence": [
              "arckit/tech/arckit-runtime/installer-supply-chain.md",
              "../arcforge/src/core/skill-availability.ts",
              "../arcforge/src/provider/index.ts",
              "runtime/arckit-runtime/src/skill-provisioning-manager.mjs",
              "verification: ArcForge npm test passed 61 of 61",
              "verification: Runtime npm run check passed 184, failed 0, skipped 1",
              "verification: macOS-arm64 distribution smoke installed 1 shared asset and converged with missing 0 changed 0 same 14",
              "verification: ArcForge npm run check and both repositories git diff --check passed"
            ]
          }
        ],
        "software_invariant_changes": [],
        "project_gap_changes": [],
        "selection_context_change": null,
        "evidence": [
          "arckit/tech/arckit-runtime/installer-supply-chain.md",
          "../arcforge/src/core/skill-availability.ts",
          "../arcforge/src/provider/index.ts",
          "runtime/arckit-runtime/src/skill-provisioning-manager.mjs",
          "verification: ArcForge npm test passed 61 of 61",
          "verification: Runtime npm run check passed 184, failed 0, skipped 1",
          "verification: macOS-arm64 distribution smoke installed 1 shared asset and converged with missing 0 changed 0 same 14",
          "verification: ArcForge npm run check and both repositories git diff --check passed"
        ]
      },
      "invariant_assessment": {
        "project_revision": 66,
        "judgments": [
          {
            "invariant_ref": "product-expectations-remain-recoverable",
            "disposition": "upheld",
            "reason": "The existing Setup Readiness complete-provisioning expectation remains accurate and is now backed by the provider capability and installed-target smoke.",
            "fact_refs": [
              "FACT-PROVIDER-BOUNDARY-001",
              "FACT-PROVIDER-BOUNDARY-REALIZED"
            ],
            "evidence": [
              "arckit/spec/arckit-runtime-distribution.md",
              "runtime/arckit-runtime/scripts/smoke-distribution.mjs",
              "verification: ArcForge npm test passed 61 of 61",
              "verification: Runtime npm run check passed 184, failed 0, skipped 1",
              "verification: macOS-arm64 distribution smoke installed 1 shared asset and converged with missing 0 changed 0 same 14",
              "verification: ArcForge npm run check and both repositories git diff --check passed"
            ],
            "gap_refs": []
          },
          {
            "invariant_ref": "interaction-expectations-remain-recoverable",
            "disposition": "upheld",
            "reason": "Setup Readiness now displays provider-planned shared assets and blocks omitted declarations without changing the accepted confirmation or recovery journey.",
            "fact_refs": [
              "FACT-PROVIDER-BOUNDARY-REALIZED"
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
            "reason": "The facts change provisioning semantics and textual plan contents, not durable visual tokens, layout or presentation rules.",
            "fact_refs": [],
            "evidence": [],
            "gap_refs": []
          },
          {
            "invariant_ref": "technical-decisions-remain-explainable",
            "disposition": "upheld",
            "reason": "The Core/provider/Runtime responsibility boundary, allowed differences, capability negotiation and asset data flow are durably specified and match the implementation.",
            "fact_refs": [
              "FACT-PROVIDER-BOUNDARY-002",
              "FACT-PROVIDER-BOUNDARY-REALIZED"
            ],
            "evidence": [
              "arckit/tech/arckit-runtime/installer-supply-chain.md",
              "../arcforge/src/core/skill-availability.ts",
              "../arcforge/src/provider/index.ts",
              "runtime/arckit-runtime/src/skill-provisioning-manager.mjs"
            ],
            "gap_refs": []
          },
          {
            "invariant_ref": "accepted-facts-are-realized",
            "disposition": "upheld",
            "reason": "The built provider and Runtime distribution install _arckit_shared to the Codex skills root and converge with no missing or changed managed resource.",
            "fact_refs": [
              "FACT-PROVIDER-BOUNDARY-001",
              "FACT-PROVIDER-BOUNDARY-REALIZED"
            ],
            "evidence": [
              "runtime/arckit-runtime/scripts/smoke-distribution.mjs",
              "verification: ArcForge npm test passed 61 of 61",
              "verification: Runtime npm run check passed 184, failed 0, skipped 1",
              "verification: macOS-arm64 distribution smoke installed 1 shared asset and converged with missing 0 changed 0 same 14",
              "verification: ArcForge npm run check and both repositories git diff --check passed"
            ],
            "gap_refs": []
          },
          {
            "invariant_ref": "material-risks-have-credible-evidence",
            "disposition": "upheld",
            "reason": "Version capability rejection, Core/provider conformance, stale digest rejection, transactional apply/removal and full distribution smoke provide repeatable evidence for the material regression boundary.",
            "fact_refs": [
              "FACT-PROVIDER-BOUNDARY-REALIZED"
            ],
            "evidence": [
              "../arcforge/tests/provider.test.mjs",
              "runtime/arckit-runtime/test/package-distribution.test.mjs",
              "runtime/arckit-runtime/test/skill-provisioning-manager.test.mjs",
              "verification: ArcForge npm test passed 61 of 61",
              "verification: Runtime npm run check passed 184, failed 0, skipped 1",
              "verification: macOS-arm64 distribution smoke installed 1 shared asset and converged with missing 0 changed 0 same 14",
              "verification: ArcForge npm run check and both repositories git diff --check passed"
            ],
            "gap_refs": []
          }
        ]
      },
      "evidence": [
        "arckit/tech/arckit-runtime/installer-supply-chain.md",
        "arckit/tech/INDEX.md",
        "../arcforge/src/shared/types.ts",
        "../arcforge/src/core/sources.ts",
        "../arcforge/src/core/skill-availability.ts",
        "../arcforge/src/core/skill-availability-apply.ts",
        "../arcforge/src/core/skill-availability-drift.ts",
        "../arcforge/src/provider/index.ts",
        "../arcforge/scripts/build-provider-package.mjs",
        "../arcforge/tests/provider.test.mjs",
        "runtime/arckit-runtime/scripts/prepare-distribution.mjs",
        "runtime/arckit-runtime/src/skill-provisioning-manager.mjs",
        "runtime/arckit-runtime/desktop/renderer/renderer.js",
        "runtime/arckit-runtime/test/package-distribution.test.mjs",
        "runtime/arckit-runtime/test/skill-provisioning-manager.test.mjs",
        "runtime/arckit-runtime/scripts/smoke-distribution.mjs",
        "verification: ArcForge npm test passed 61 of 61",
        "verification: Runtime npm run check passed 184, failed 0, skipped 1",
        "verification: macOS-arm64 distribution smoke installed 1 shared asset and converged with missing 0 changed 0 same 14",
        "verification: ArcForge npm run check and both repositories git diff --check passed"
      ],
      "runtime_result_ref": "",
      "occurred_at": "2026-08-15T05:51:40.850Z"
    },
    {
      "round": 2,
      "transition_schema_version": "arckit-case-transition/v8",
      "goal": "Independently review content revision 1 across all five completion dimensions.",
      "outcome": "completed",
      "gap_selection": {
        "mode": "candidate",
        "basis": "All ordinary Case obligations are closed, so the independently derived completion review is the only ready Case work and is required before resolution.",
        "snapshot_token": "017ea3ceccf5109defaa939e506658d41ea51f45cf0b0547e24f54a915058e13",
        "selected_ref": "case-gap:CASE-20260815-001:CASE-20260815-001:completion-review:1",
        "comparison_summary": "Selected the ready completion review; deferred the four broader Project gaps because they neither invalidate the completed provider repair nor belong to this Case scope.",
        "fresh_discovery_summary": "Independent diff inspection, repeatable tests and trusted audits found no new error, omission or excess requiring a fresh repair gap.",
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
            "reason": "It requires separate isolated Agent scenarios and does not alter the evidence for this bounded provisioning repair."
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
            "reason": "Its timeout, compaction and broader adapter work remains independent of the now-tested provisioning boundary."
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
            "reason": "This review has no real permission-bearing project evidence and cannot claim that separate security outcome."
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
            "reason": "Current trusted audits pass, but accepting cross-record auditing in broad real use remains a separate Project result."
          },
          {
            "ref": "case-gap:CASE-20260815-001:CASE-20260815-001:completion-review:1",
            "source": "persisted",
            "eligibility": "ready",
            "disposition": "selected",
            "priority_basis": {
              "blocking": "high",
              "uncertainty": "low",
              "risk": "high",
              "user_impact": "high"
            },
            "reason": "It is the required terminal gate for the unchanged content revision and directly tests whether the user-reproduced failure is genuinely resolved."
          }
        ]
      },
      "selected_gap": {
        "id": "CASE-20260815-001:completion-review:1",
        "responsibility": "agent",
        "goal": "Review the completed implementation for correctness, real problem resolution, verification credibility, regression risk, and minimality.",
        "reason": "All ordinary Case gaps and state impacts are closed.",
        "derived_from": [
          "case_result",
          "content_revision:1"
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
        "goal": "Independently review content revision 1 across all five completion dimensions.",
        "expected_state_change": "Accept a clean review for the unchanged implementation and resolve CASE-20260815-001 only if all dimensions remain clean."
      },
      "accepted_state_delta": {
        "resolved_gap": null,
        "facts_added": [],
        "facts_superseded": [],
        "impacts_added": [],
        "impacts_updated": [],
        "gaps_added": [],
        "gaps_cancelled": [],
        "resolved_open_questions": [],
        "completed_handoffs": [],
        "completion_review_result": {
          "outcome": "clean",
          "reviewer": "agent",
          "reviewed_content_revision": 1,
          "dimensions": {
            "implementation_correctness": "clean",
            "problem_resolution": "clean",
            "verification_credibility": "clean",
            "regression_risk": "clean",
            "minimality": "clean"
          },
          "findings": [],
          "evidence": [
            "arckit/tech/arckit-runtime/installer-supply-chain.md",
            "../arcforge/src/core/skill-availability.ts",
            "../arcforge/src/core/skill-availability-apply.ts",
            "../arcforge/src/core/skill-availability-drift.ts",
            "../arcforge/src/provider/index.ts",
            "../arcforge/tests/provider.test.mjs",
            "runtime/arckit-runtime/src/skill-provisioning-manager.mjs",
            "runtime/arckit-runtime/scripts/prepare-distribution.mjs",
            "runtime/arckit-runtime/scripts/smoke-distribution.mjs",
            "runtime/arckit-runtime/test/package-distribution.test.mjs",
            "runtime/arckit-runtime/test/skill-provisioning-manager.test.mjs",
            "verification: direct Core/provider plan conformance and availability tests passed 26 of 26",
            "verification: ArcForge full test suite passed 61 of 61 and TypeScript checks passed",
            "verification: Runtime focused provisioning and UI tests passed 14 of 14",
            "verification: Runtime full check passed 184, failed 0, skipped 1",
            "verification: macOS-arm64 distribution smoke installed 1 shared asset and converged with missing 0 changed 0 same 14",
            "verification: both repository diffs and trusted Project/Case audits passed"
          ]
        },
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
        "project_revision": 67,
        "judgments": [
          {
            "invariant_ref": "product-expectations-remain-recoverable",
            "disposition": "upheld",
            "reason": "Review confirms Setup Readiness now presents and installs the complete governed payload, including provider-planned shared assets, without changing its accepted product meaning.",
            "fact_refs": [
              "FACT-PROVIDER-BOUNDARY-001",
              "FACT-PROVIDER-BOUNDARY-REALIZED"
            ],
            "evidence": [
              "arckit/spec/arckit-runtime-distribution.md",
              "runtime/arckit-runtime/scripts/smoke-distribution.mjs",
              "verification: Runtime full check passed 184, failed 0, skipped 1",
              "verification: macOS-arm64 distribution smoke installed 1 shared asset and converged with missing 0 changed 0 same 14"
            ],
            "gap_refs": []
          },
          {
            "invariant_ref": "interaction-expectations-remain-recoverable",
            "disposition": "upheld",
            "reason": "Review confirms the existing confirmation and recovery journey is preserved while the plan now exposes shared asset destinations and fails closed on omission.",
            "fact_refs": [
              "FACT-PROVIDER-BOUNDARY-REALIZED"
            ],
            "evidence": [
              "arckit/interaction/setup-readiness/interaction.md",
              "runtime/arckit-runtime/desktop/renderer/renderer.js",
              "runtime/arckit-runtime/test/desktop-renderer.test.mjs",
              "verification: Runtime focused provisioning and UI tests passed 14 of 14"
            ],
            "gap_refs": []
          },
          {
            "invariant_ref": "visual-language-remains-consistent",
            "disposition": "not_relevant",
            "reason": "Review confirms the change adds provisioning facts to the existing textual plan surface without changing visual tokens, layout rules or visual language.",
            "fact_refs": [],
            "evidence": [],
            "gap_refs": []
          },
          {
            "invariant_ref": "technical-decisions-remain-explainable",
            "disposition": "upheld",
            "reason": "Review confirms Core remains the sole provisioning semantic implementation while provider and Runtime are bounded adapters with explicit capability negotiation.",
            "fact_refs": [
              "FACT-PROVIDER-BOUNDARY-002",
              "FACT-PROVIDER-BOUNDARY-REALIZED"
            ],
            "evidence": [
              "arckit/tech/arckit-runtime/installer-supply-chain.md",
              "../arcforge/src/core/skill-availability.ts",
              "../arcforge/src/provider/index.ts",
              "runtime/arckit-runtime/src/skill-provisioning-manager.mjs",
              "verification: direct Core/provider plan conformance and availability tests passed 26 of 26"
            ],
            "gap_refs": []
          },
          {
            "invariant_ref": "accepted-facts-are-realized",
            "disposition": "upheld",
            "reason": "Review confirms the built provider path installs _arckit_shared into the Codex skills root and post-apply drift converges.",
            "fact_refs": [
              "FACT-PROVIDER-BOUNDARY-001",
              "FACT-PROVIDER-BOUNDARY-REALIZED"
            ],
            "evidence": [
              "../arcforge/tests/provider.test.mjs",
              "runtime/arckit-runtime/scripts/smoke-distribution.mjs",
              "verification: macOS-arm64 distribution smoke installed 1 shared asset and converged with missing 0 changed 0 same 14",
              "verification: Runtime full check passed 184, failed 0, skipped 1"
            ],
            "gap_refs": []
          },
          {
            "invariant_ref": "material-risks-have-credible-evidence",
            "disposition": "upheld",
            "reason": "Review confirms capability rejection, manifest-plan completeness, digest staleness, transaction rollback/removal, full suites and real distribution smoke cover the material regression boundary.",
            "fact_refs": [
              "FACT-PROVIDER-BOUNDARY-REALIZED"
            ],
            "evidence": [
              "../arcforge/tests/provider.test.mjs",
              "runtime/arckit-runtime/test/package-distribution.test.mjs",
              "runtime/arckit-runtime/test/skill-provisioning-manager.test.mjs",
              "verification: ArcForge full test suite passed 61 of 61 and TypeScript checks passed",
              "verification: Runtime full check passed 184, failed 0, skipped 1",
              "verification: both repository diffs and trusted Project/Case audits passed"
            ],
            "gap_refs": []
          }
        ]
      },
      "evidence": [
        "arckit/tech/arckit-runtime/installer-supply-chain.md",
        "../arcforge/src/core/skill-availability.ts",
        "../arcforge/src/provider/index.ts",
        "../arcforge/tests/provider.test.mjs",
        "runtime/arckit-runtime/src/skill-provisioning-manager.mjs",
        "runtime/arckit-runtime/scripts/prepare-distribution.mjs",
        "runtime/arckit-runtime/scripts/smoke-distribution.mjs",
        "runtime/arckit-runtime/test/package-distribution.test.mjs",
        "runtime/arckit-runtime/test/skill-provisioning-manager.test.mjs",
        "verification: direct Core/provider plan conformance and availability tests passed 26 of 26",
        "verification: ArcForge full test suite passed 61 of 61 and TypeScript checks passed",
        "verification: Runtime focused provisioning and UI tests passed 14 of 14",
        "verification: Runtime full check passed 184, failed 0, skipped 1",
        "verification: macOS-arm64 distribution smoke installed 1 shared asset and converged with missing 0 changed 0 same 14",
        "verification: both repository diffs and trusted Project/Case audits passed"
      ],
      "runtime_result_ref": "",
      "occurred_at": "2026-08-15T05:56:52.686Z"
    }
  ],
  "case_resolution": {
    "status": "resolved",
    "stage": "resolved",
    "satisfied": [
      "GAP-PROVIDER-BOUNDARY-UNIFY"
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
    "updated_at": "2026-08-15T05:56:52.686Z"
  }
}
```

## Round Notes

- Case history is canonical in Structured Record.rounds; keep prose notes exceptional.
