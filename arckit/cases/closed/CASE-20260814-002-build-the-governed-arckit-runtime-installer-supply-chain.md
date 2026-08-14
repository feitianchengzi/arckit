# Build the governed Arckit Runtime installer supply chain

Case: CASE-20260814-002
Status: closed
Artifact Type: mixed
Selected Gap: none
Updated: 2026-08-14T06:25:46.308Z

## User Intent

Deliver a complete Arckit Runtime installer pipeline with bundled governed skills provisioning, manually selected GitHub packaging, branching-contract enforcement, and only the necessary cross-repository ArcForge support.

## Structured Record

```json
{
  "schema_version": "development-case-record/v5",
  "id": "CASE-20260814-002",
  "title": "Build the governed Arckit Runtime installer supply chain",
  "status": "closed",
  "artifact_type": "mixed",
  "created_at": "2026-08-14T04:58:10.980Z",
  "updated_at": "2026-08-14T06:25:46.308Z",
  "user_intent": "Deliver a complete Arckit Runtime installer pipeline with bundled governed skills provisioning, manually selected GitHub packaging, branching-contract enforcement, and only the necessary cross-repository ArcForge support.",
  "expected_outcome": "An internal user can install and start the complete supported Runtime experience from a manually produced, traceable installer artifact, while Runtime, ArcForge, skills, Git branches, versions, signing boundaries, updates, repair, and release authorization retain explicit ownership.",
  "project_state_ref": "arckit/project/state.record.json",
  "current_round": {
    "goal": "",
    "selected_gap": null
  },
  "facts": [
    {
      "id": "FACT-PACKAGING-001",
      "revision": 1,
      "status": "superseded",
      "statement": "Arckit Runtime currently has an Electron development entry but no formal installer build configuration or GitHub packaging workflow.",
      "basis": "Repository package and workflow inspection.",
      "evidence": [
        "runtime/arckit-runtime/package.json",
        ".github/workflows/"
      ]
    },
    {
      "id": "FACT-PACKAGING-002",
      "revision": 1,
      "status": "accepted",
      "statement": "The operator requires package kind and timing to remain manually selected while all later packaging follows the arckit-git-branching lifecycle and tag naming contract.",
      "basis": "Explicit operator requirement accepted in the current conversation.",
      "evidence": [
        "operator requirement: 2026-08-14 governed manual GitHub packaging"
      ]
    },
    {
      "id": "FACT-PACKAGING-003",
      "revision": 1,
      "status": "accepted",
      "statement": "The complete installer experience requires an ArcForge-backed deterministic skills provisioning boundary, and the adjacent ArcForge repository may be changed only as needed to provide a stable consumable artifact.",
      "basis": "Explicit operator requirement plus the existing Arckit installation policy.",
      "evidence": [
        "README.md",
        "arcforge.skill-project.json",
        "../arcforge/package.json"
      ]
    },
    {
      "id": "FACT-PACKAGING-004",
      "revision": 1,
      "status": "accepted",
      "statement": "Arckit Runtime distribution uses a manually dispatched existing release-intent tag, a deterministic three-resource bundle, a stable ArcForge Embedded Provider, and a separate Desktop Setup Readiness gate for transactional Codex skills provisioning.",
      "basis": "The product, interaction and technical specifications now define one coherent cross-repository contract.",
      "evidence": [
        "arckit/spec/arckit-runtime-distribution.md",
        "arckit/spec/_map/RELATIONS.md",
        "arckit/interaction/setup-readiness/interaction.md",
        "arckit/interaction/setup-readiness/default.html",
        "arckit/tech/arckit-runtime/installer-supply-chain.md",
        "arckit/tech/_map/RELATIONS.md",
        "arcforge.skill-project.json",
        "delivery/skills/arckit-git-branching/references/platform-release-triggers.md"
      ]
    },
    {
      "id": "FACT-PACKAGING-005",
      "revision": 1,
      "status": "accepted",
      "statement": "ArcForge provides arcforge-embedded-provider/v1 and a manual governed workflow that consumes existing tf, beta or appstore tags to produce immutable provider archives, manifests and SHA-256 checksums without creating or moving tags.",
      "basis": "Implemented source, workflow, package builder and passing isolation, release-contract and full-suite verification.",
      "evidence": [
        "../arcforge/src/provider/index.ts",
        "../arcforge/scripts/build-provider-package.mjs",
        "../arcforge/scripts/validate-release-trigger.mjs",
        "../arcforge/.github/workflows/package.yml",
        "../arcforge/tests/provider.test.mjs",
        "../arcforge/tests/release-trigger.test.mjs"
      ]
    },
    {
      "id": "FACT-PACKAGING-006",
      "revision": 1,
      "status": "accepted",
      "statement": "Arckit Runtime can deterministically assemble trusted Runtime capabilities, 13 governed Arckit skills and an exact checksum-bound ArcForge provider into target-native installers selected only by a manual workflow against an existing compliant release-intent tag.",
      "basis": "Implemented workflow, packaging scripts, distribution locks, external attestations and real macOS package smoke evidence.",
      "evidence": [
        ".github/workflows/arckit-runtime-package.yml",
        "runtime/arckit-runtime/scripts/prepare-distribution.mjs",
        "runtime/arckit-runtime/scripts/build-package-config.mjs",
        "runtime/arckit-runtime/scripts/finalize-package-artifacts.mjs",
        "runtime/arckit-runtime/test/package-distribution.test.mjs",
        "verification: macOS x64 DMG verified and packaged resources executed"
      ]
    },
    {
      "id": "FACT-PACKAGING-007",
      "revision": 1,
      "status": "accepted",
      "statement": "Packaged Arckit Desktop Setup Readiness can verify distribution resources, install 12 user-scoped Arckit skills and the ArcForge on-demand loader, defer one project-ambient skill, detect conflicts, preserve unrelated skills, roll back failed source upgrades and block Runtime task starts until post-drift and Codex checks are ready.",
      "basis": "Implemented manager/main/preload/renderer boundary with isolated and packaged real-provider verification.",
      "evidence": [
        "runtime/arckit-runtime/src/skill-provisioning-manager.mjs",
        "runtime/arckit-runtime/src/automation-coordinator.mjs",
        "runtime/arckit-runtime/test/skill-provisioning-manager.test.mjs",
        "runtime/arckit-runtime/test/desktop-renderer.test.mjs",
        "verification: Runtime 169 tests and packaged real-provider Setup smoke passed"
      ]
    },
    {
      "id": "FACT-PACKAGING-008",
      "revision": 1,
      "status": "accepted",
      "statement": "The governed Runtime installer supply chain is reproducible through manual existing-tag workflows, exact provider and payload digests, platform-native runner selection, bounded signing/notarization gates, external final-artifact attestations, packaged Setup provisioning smoke and a verified native macOS x64 DMG; live signed GitHub release activation remains an explicit operator action.",
      "basis": "Passing cross-repository suites, workflow/config regressions, stable provider package digest, distribution smoke, packaged-ASAR digest inspection, DMG verification and direct checksum validation.",
      "evidence": [
        ".github/workflows/arckit-runtime-package.yml",
        "../arcforge/.github/workflows/package.yml",
        "runtime/arckit-runtime/test/package-distribution.test.mjs",
        "runtime/arckit-runtime/scripts/smoke-distribution.mjs",
        "../arcforge/tests/provider.test.mjs",
        "verification: native x64 DMG and external artifact checksum passed"
      ]
    }
  ],
  "state_impacts": [
    {
      "id": "IMPACT-PACKAGING-DELIVERY",
      "fact_id": "FACT-PACKAGING-008",
      "fact_revision": 1,
      "target": {
        "kind": "software_decision",
        "ref": "delivery_and_distribution",
        "revision": 3
      },
      "effect": "upheld",
      "reason": "The manually activated provider and Runtime workflows, deterministic package layout, draft-only publication and local installer acceptance realize the governed delivery decision without taking release authorization from the operator.",
      "gap_ids": [],
      "evidence": [
        ".github/workflows/arckit-runtime-package.yml",
        "../arcforge/.github/workflows/package.yml",
        "runtime/arckit-runtime/test/package-distribution.test.mjs"
      ]
    },
    {
      "id": "IMPACT-PACKAGING-TECH",
      "fact_id": "FACT-PACKAGING-003",
      "fact_revision": 1,
      "target": {
        "kind": "software_invariant",
        "ref": "technical-decisions-remain-explainable",
        "revision": null
      },
      "effect": "upheld",
      "reason": "The cross-repository provider, bundle, state, update and Runtime boundary are durably explainable.",
      "gap_ids": [],
      "evidence": [
        "arckit/tech/arckit-runtime/installer-supply-chain.md",
        "arckit/tech/_map/RELATIONS.md"
      ]
    },
    {
      "id": "IMPACT-PACKAGING-REALIZATION",
      "fact_id": "FACT-PACKAGING-004",
      "fact_revision": 1,
      "target": {
        "kind": "software_invariant",
        "ref": "accepted-facts-are-realized",
        "revision": null
      },
      "effect": "upheld",
      "reason": "The accepted provider, installer assembly and Desktop Setup Readiness behavior are now implemented across both repositories.",
      "gap_ids": [],
      "evidence": [
        "../arcforge/src/provider/index.ts",
        ".github/workflows/arckit-runtime-package.yml",
        "runtime/arckit-runtime/src/skill-provisioning-manager.mjs",
        "runtime/arckit-runtime/desktop/main.mjs",
        "verification: packaged real-provider Setup smoke passed"
      ]
    },
    {
      "id": "IMPACT-PACKAGING-RISK",
      "fact_id": "FACT-PACKAGING-008",
      "fact_revision": 1,
      "target": {
        "kind": "software_invariant",
        "ref": "material-risks-have-credible-evidence",
        "revision": null
      },
      "effect": "upheld",
      "reason": "Provider isolation, resource tamper detection, plan freshness, conflict preservation, upgrade rollback, target-native matrices, signing gates, package checksums and native DMG smoke provide risk-proportionate repeatable evidence.",
      "gap_ids": [],
      "evidence": [
        "runtime/arckit-runtime/test/skill-provisioning-manager.test.mjs",
        "runtime/arckit-runtime/test/package-distribution.test.mjs",
        "../arcforge/tests/provider.test.mjs",
        "verification: Runtime and ArcForge full suites passed"
      ]
    }
  ],
  "gaps": [
    {
      "id": "GAP-PACKAGING-CONTRACT",
      "status": "resolved",
      "goal": "Establish the durable Runtime installer, skills provisioning, ArcForge supply-artifact, manual workflow trigger, versioning, branch/tag validation, signing, update, repair, and repository-ownership contract.",
      "reason": "Implementation boundaries and artifact inputs must be accepted before repository changes can safely depend on them.",
      "derived_from": [
        "case_intent",
        "FACT-PACKAGING-001",
        "FACT-PACKAGING-002",
        "FACT-PACKAGING-003"
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
        "Durable Arckit technical and delivery evidence defining the complete cross-repository installer supply contract."
      ],
      "resolution": {
        "id": "GAP-PACKAGING-CONTRACT",
        "status": "resolved",
        "outcome": "The manually dispatched tag-governed installer, bundled resources, ArcForge provider, Setup Readiness, signing, update, repair and repository ownership contract is durably defined.",
        "reason": "Product, interaction and technical sources agree on the same roles, state transitions, resources, confirmation boundaries and verification requirements.",
        "evidence": [
          "arckit/spec/arckit-runtime-distribution.md",
          "arckit/spec/_map/RELATIONS.md",
          "arckit/interaction/setup-readiness/interaction.md",
          "arckit/interaction/setup-readiness/default.html",
          "arckit/tech/arckit-runtime/installer-supply-chain.md",
          "arckit/tech/_map/RELATIONS.md",
          "arcforge.skill-project.json",
          "delivery/skills/arckit-git-branching/references/platform-release-triggers.md"
        ],
        "occurred_at": "2026-08-14T05:09:51.966Z"
      }
    },
    {
      "id": "GAP-ARCFORGE-EMBEDDED-PROVIDER",
      "status": "resolved",
      "goal": "Provide and verify a stable, explicitly state-rooted ArcForge Embedded Provider package and manually triggered GitHub artifact workflow.",
      "reason": "Runtime packaging and Setup Readiness require an immutable provider API and artifact rather than importing an adjacent source checkout or downloading latest.",
      "derived_from": [
        "FACT-PACKAGING-003",
        "FACT-PACKAGING-004"
      ],
      "blocked_by": [],
      "priority_basis": {
        "blocking": "high",
        "risk": "high",
        "uncertainty": "medium",
        "user_impact": "high"
      },
      "responsibility": "agent",
      "evidence_required": [
        "ArcForge provider source, API tests, package manifest, checksums and a workflow/config validation that can produce the stable artifact."
      ],
      "resolution": {
        "id": "GAP-ARCFORGE-EMBEDDED-PROVIDER",
        "status": "resolved",
        "outcome": "ArcForge now exposes a versioned ESM embedded provider with explicit state isolation, fresh plan confirmation, managed removal, reproducible metadata/checksums, and a manual tag-validated artifact workflow.",
        "reason": "The implementation and its full tests, package construction, archive inspection and checksum validation pass.",
        "evidence": [
          "../arcforge/src/provider/index.ts",
          "../arcforge/tests/provider.test.mjs",
          "../arcforge/tests/release-trigger.test.mjs",
          "../arcforge/scripts/build-provider-package.mjs",
          "../arcforge/scripts/validate-release-trigger.mjs",
          "../arcforge/.github/workflows/package.yml",
          "verification: ../arcforge check, 59 tests, provider package and checksums passed"
        ],
        "occurred_at": "2026-08-14T05:27:18.421Z"
      }
    },
    {
      "id": "GAP-RUNTIME-PACKAGING-PIPELINE",
      "status": "resolved",
      "goal": "Implement the manually dispatched, tag-validated, target-selectable Arckit Runtime GitHub installer packaging pipeline and deterministic bundled resource layout.",
      "reason": "The accepted distribution contract is not realized until Runtime can assemble and package trusted resources, the locked skill payload and an exact ArcForge provider artifact.",
      "derived_from": [
        "FACT-PACKAGING-001",
        "FACT-PACKAGING-002",
        "FACT-PACKAGING-004"
      ],
      "blocked_by": [
        "GAP-ARCFORGE-EMBEDDED-PROVIDER"
      ],
      "priority_basis": {
        "blocking": "high",
        "risk": "high",
        "user_impact": "high"
      },
      "responsibility": "agent",
      "evidence_required": [
        "Arckit packaging scripts/config, manual GitHub workflow, trigger validation, distribution lock and selected-platform artifact smoke evidence."
      ],
      "resolution": {
        "id": "GAP-RUNTIME-PACKAGING-PIPELINE",
        "status": "resolved",
        "outcome": "Arckit Runtime now has a manual-only, existing-tag validated, native-platform GitHub installer workflow with deterministic trusted capability, skill payload and exact ArcForge provider resources.",
        "reason": "Release-trigger tests, complete Runtime tests, arm64/x64 DMG builds, x64 packaged execution, ASAR/resource inspection, DMG verification, SHA-256 and attestation checks all pass.",
        "evidence": [
          ".github/workflows/arckit-runtime-package.yml",
          "runtime/arckit-runtime/scripts/validate-release-trigger.mjs",
          "runtime/arckit-runtime/scripts/prepare-distribution.mjs",
          "runtime/arckit-runtime/scripts/build-package-config.mjs",
          "runtime/arckit-runtime/scripts/finalize-package-artifacts.mjs",
          "runtime/arckit-runtime/test/package-distribution.test.mjs",
          "runtime/arckit-runtime/test/release-trigger.test.mjs",
          "verification: Runtime check 166 tests; macOS arm64/x64 DMG package smoke and x64 packaged-resource execution passed"
        ],
        "occurred_at": "2026-08-14T05:48:32.653Z"
      }
    },
    {
      "id": "GAP-RUNTIME-SKILL-PROVISIONING",
      "status": "resolved",
      "goal": "Implement Desktop Setup Readiness and transactional ArcForge-backed Arckit skill installation, drift, repair, upgrade and readiness gating.",
      "reason": "A single installer is not a complete user experience until the packaged provider and payload can safely establish Codex-discoverable skills without entering the Runtime Kernel.",
      "derived_from": [
        "FACT-PACKAGING-003",
        "FACT-PACKAGING-004"
      ],
      "blocked_by": [
        "GAP-ARCFORGE-EMBEDDED-PROVIDER"
      ],
      "priority_basis": {
        "blocking": "high",
        "risk": "high",
        "user_impact": "high"
      },
      "responsibility": "agent",
      "evidence_required": [
        "Setup manager, narrow IPC/UI states, provisioning integration and tests for clean install, drift, conflicts, rollback and readiness."
      ],
      "resolution": {
        "id": "GAP-RUNTIME-SKILL-PROVISIONING",
        "status": "resolved",
        "outcome": "Desktop now validates bundled resources, stages versioned sources, presents normalized plan/drift, requires plan and separate cleanup confirmations, transactionally provisions Codex skills through the embedded provider, gates task starts, and supports safe upgrade rollback.",
        "reason": "Unit, UI/IPC, full Runtime, real embedded-provider, packaged-ASAR and post-drift smoke evidence all pass.",
        "evidence": [
          "runtime/arckit-runtime/src/skill-provisioning-manager.mjs",
          "runtime/arckit-runtime/desktop/main.mjs",
          "runtime/arckit-runtime/desktop/preload.cjs",
          "runtime/arckit-runtime/desktop/renderer/index.html",
          "runtime/arckit-runtime/desktop/renderer/renderer.js",
          "runtime/arckit-runtime/test/skill-provisioning-manager.test.mjs",
          "runtime/arckit-runtime/test/desktop-renderer.test.mjs",
          "verification: packaged ASAR manager plus real provider install returned ready with 13 same drift items"
        ],
        "occurred_at": "2026-08-14T06:08:34.313Z"
      }
    },
    {
      "id": "GAP-INSTALLER-SUPPLY-VALIDATION",
      "status": "resolved",
      "goal": "Demonstrate the installer supply chain is reproducible and safe through complete local/CI validation, package-content inspection and risk-proportionate install smoke evidence.",
      "reason": "Checksums, signing gates, packaged resource paths, cross-repository artifacts and external target writes carry material release risk that configuration presence alone cannot control.",
      "derived_from": [
        "FACT-PACKAGING-004"
      ],
      "blocked_by": [
        "GAP-RUNTIME-PACKAGING-PIPELINE",
        "GAP-RUNTIME-SKILL-PROVISIONING"
      ],
      "priority_basis": {
        "risk": "high",
        "blocking": "high",
        "user_impact": "high"
      },
      "responsibility": "agent",
      "evidence_required": [
        "Passing ArcForge and Arckit test suites, workflow/config tests, provider/package checksum evidence, package-content smoke checks and explicit remaining external signing evidence."
      ],
      "resolution": {
        "id": "GAP-INSTALLER-SUPPLY-VALIDATION",
        "status": "resolved",
        "outcome": "The cross-repository supply chain now has repeatable full-suite, workflow, provider, payload, native package, checksum, packaged-module and Setup convergence evidence with explicit platform signing gates.",
        "reason": "Runtime and ArcForge suites pass, YAML and trigger contracts pass, the exact provider package is checksum-bound, distribution smoke converges without overwriting unrelated skills, and a rebuilt x64 DMG verifies with the expected packaged resources.",
        "evidence": [
          "runtime/arckit-runtime: npm run check (168 passed, 1 optional layout test skipped, 0 failed)",
          "../arcforge: npm run check && npm test (59 passed, 0 failed)",
          "runtime/arckit-runtime/scripts/smoke-distribution.mjs",
          "runtime/arckit-runtime/release/Arckit-Runtime-0.1.0-tf.b1-tf-b1-mac-x64.dmg",
          "hdiutil verify: x64 DMG checksum valid",
          "provider SHA-256 e0b042783347ca9aed736c70d8a5ddd67324b23c2b375d7486a9c2328dc809b4"
        ],
        "occurred_at": "2026-08-14T06:24:02.513Z"
      }
    }
  ],
  "content_revision": 5,
  "completion_review": {
    "status": "clean",
    "policy": {
      "initial_max_cycles": 5,
      "source": "Operator requested continuous state-driven execution until resolved.",
      "snapshotted_at": "2026-08-14T04:58:10.980Z"
    },
    "additional_cycles_authorized": 0,
    "cycle_count": 1,
    "reviewed_content_revision": 5,
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
        "content_revision": 5,
        "dimensions": {
          "implementation_correctness": "clean",
          "problem_resolution": "clean",
          "verification_credibility": "clean",
          "regression_risk": "clean",
          "minimality": "clean"
        },
        "finding_ids": [],
        "evidence": [
          "Implementation correctness: Runtime check passed 168 tests with one explicit optional layout skip and ArcForge passed 59 tests.",
          "Problem resolution: manual existing-tag workflows build target-native installers with exact provider digest and complete Setup Readiness provisioning.",
          "Verification credibility: YAML, release-trigger, platform config, real provider, distribution smoke, packaged-ASAR digest, DMG and external checksum checks passed.",
          "Regression risk: Setup preserves unrelated skills, blocks conflicts/tampering, rolls back failed upgrades and keeps provisioning outside the Runtime Kernel.",
          "Minimality: Runtime embeds only the stable ArcForge provider and on-demand loader, defers project-scoped skill installation, never creates tags and leaves live release authorization to the operator.",
          "git diff --check passed in both repositories."
        ],
        "occurred_at": "2026-08-14T06:25:46.308Z"
      }
    ],
    "evidence": [
      "Implementation correctness: Runtime check passed 168 tests with one explicit optional layout skip and ArcForge passed 59 tests.",
      "Problem resolution: manual existing-tag workflows build target-native installers with exact provider digest and complete Setup Readiness provisioning.",
      "Verification credibility: YAML, release-trigger, platform config, real provider, distribution smoke, packaged-ASAR digest, DMG and external checksum checks passed.",
      "Regression risk: Setup preserves unrelated skills, blocks conflicts/tampering, rolls back failed upgrades and keeps provisioning outside the Runtime Kernel.",
      "Minimality: Runtime embeds only the stable ArcForge provider and on-demand loader, defers project-scoped skill installation, never creates tags and leaves live release authorization to the operator.",
      "git diff --check passed in both repositories."
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
      "goal": "Make the complete installer and cross-repository supply contract durable across product, interaction and technical fact sources.",
      "outcome": "completed",
      "gap_selection": {
        "mode": "candidate",
        "basis": "The packaging contract is the only ready Case Gap and a causal prerequisite for every requested implementation change.",
        "snapshot_token": "c78ab05854ae35837803252940ac70145b47b1c858ec2b157da2c02044c221f0",
        "selected_ref": "case-gap:CASE-20260814-002:GAP-PACKAGING-CONTRACT",
        "comparison_summary": "Compared all five Project candidates with the registered installer Case Gap; the Project candidates remain separate or are carried by this Case, while the contract directly blocks implementation.",
        "fresh_discovery_summary": "No more important ready fresh candidate was present at opening; implementation obligations exposed by the accepted contract are recorded as future gaps and were not executed in this round.",
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
            "reason": "Deferred because it requires a separate real-scenario validation Case and does not define this installer supply chain."
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
            "reason": "Deferred because general Runtime resilience does not block accepting the packaging contract."
          },
          {
            "ref": "project-gap:GAP-security-real-project-validation",
            "source": "persisted",
            "eligibility": "case_required",
            "disposition": "deferred",
            "priority_basis": {
              "risk": "high",
              "urgency": "medium"
            },
            "reason": "Deferred because it requires a separate permission-bearing project; this round records but does not claim real credential evidence."
          },
          {
            "ref": "project-gap:GAP-delivery-governance",
            "source": "persisted",
            "eligibility": "case_required",
            "disposition": "deferred",
            "priority_basis": {
              "risk": "medium",
              "urgency": "medium"
            },
            "reason": "Deferred as the Project-level delivery obligation is now carried by the selected registered Case."
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
            "reason": "Deferred because cross-record audit is independent of the installer contract."
          },
          {
            "ref": "case-gap:CASE-20260814-002:GAP-PACKAGING-CONTRACT",
            "source": "persisted",
            "eligibility": "ready",
            "disposition": "selected",
            "priority_basis": {
              "blocking": "high",
              "uncertainty": "high",
              "risk": "high",
              "user_impact": "high"
            },
            "reason": "Selected because all downstream cross-repository code and workflow work depends on an accepted artifact, trigger, provisioning and ownership contract."
          }
        ]
      },
      "selected_gap": {
        "id": "GAP-PACKAGING-CONTRACT",
        "responsibility": "agent",
        "goal": "Establish the durable Runtime installer, skills provisioning, ArcForge supply-artifact, manual workflow trigger, versioning, branch/tag validation, signing, update, repair, and repository-ownership contract.",
        "reason": "Implementation boundaries and artifact inputs must be accepted before repository changes can safely depend on them.",
        "derived_from": [
          "case_intent",
          "FACT-PACKAGING-001",
          "FACT-PACKAGING-002",
          "FACT-PACKAGING-003"
        ],
        "blocked_by": [],
        "priority_basis": {
          "blocking": "high",
          "uncertainty": "high",
          "risk": "high",
          "user_impact": "high"
        },
        "evidence_required": [
          "Durable Arckit technical and delivery evidence defining the complete cross-repository installer supply contract."
        ]
      },
      "planned_transition": {
        "goal": "Make the complete installer and cross-repository supply contract durable across product, interaction and technical fact sources.",
        "expected_state_change": "The contract becomes accepted, affected Project decisions become current, and downstream implementation/risk obligations become explicit open Case gaps."
      },
      "accepted_state_delta": {
        "resolved_gap": {
          "id": "GAP-PACKAGING-CONTRACT",
          "status": "resolved",
          "outcome": "The manually dispatched tag-governed installer, bundled resources, ArcForge provider, Setup Readiness, signing, update, repair and repository ownership contract is durably defined.",
          "reason": "Product, interaction and technical sources agree on the same roles, state transitions, resources, confirmation boundaries and verification requirements.",
          "evidence": [
            "arckit/spec/arckit-runtime-distribution.md",
            "arckit/spec/_map/RELATIONS.md",
            "arckit/interaction/setup-readiness/interaction.md",
            "arckit/interaction/setup-readiness/default.html",
            "arckit/tech/arckit-runtime/installer-supply-chain.md",
            "arckit/tech/_map/RELATIONS.md",
            "arcforge.skill-project.json",
            "delivery/skills/arckit-git-branching/references/platform-release-triggers.md"
          ]
        },
        "facts_added": [
          {
            "id": "FACT-PACKAGING-004",
            "revision": 1,
            "status": "accepted",
            "statement": "Arckit Runtime distribution uses a manually dispatched existing release-intent tag, a deterministic three-resource bundle, a stable ArcForge Embedded Provider, and a separate Desktop Setup Readiness gate for transactional Codex skills provisioning.",
            "basis": "The product, interaction and technical specifications now define one coherent cross-repository contract.",
            "evidence": [
              "arckit/spec/arckit-runtime-distribution.md",
              "arckit/spec/_map/RELATIONS.md",
              "arckit/interaction/setup-readiness/interaction.md",
              "arckit/interaction/setup-readiness/default.html",
              "arckit/tech/arckit-runtime/installer-supply-chain.md",
              "arckit/tech/_map/RELATIONS.md",
              "arcforge.skill-project.json",
              "delivery/skills/arckit-git-branching/references/platform-release-triggers.md"
            ]
          }
        ],
        "facts_superseded": [],
        "impacts_added": [
          {
            "id": "IMPACT-PACKAGING-REALIZATION",
            "fact_id": "FACT-PACKAGING-004",
            "fact_revision": 1,
            "target": {
              "kind": "software_invariant",
              "ref": "accepted-facts-are-realized",
              "revision": null
            },
            "effect": "threatened",
            "reason": "The accepted installer contract is not yet implemented in ArcForge provider, Runtime packaging or Desktop provisioning code.",
            "gap_ids": [
              "GAP-ARCFORGE-EMBEDDED-PROVIDER",
              "GAP-RUNTIME-PACKAGING-PIPELINE",
              "GAP-RUNTIME-SKILL-PROVISIONING"
            ],
            "evidence": [
              "arckit/spec/arckit-runtime-distribution.md",
              "arckit/spec/_map/RELATIONS.md",
              "arckit/interaction/setup-readiness/interaction.md",
              "arckit/interaction/setup-readiness/default.html",
              "arckit/tech/arckit-runtime/installer-supply-chain.md",
              "arckit/tech/_map/RELATIONS.md",
              "arcforge.skill-project.json",
              "delivery/skills/arckit-git-branching/references/platform-release-triggers.md"
            ]
          },
          {
            "id": "IMPACT-PACKAGING-RISK",
            "fact_id": "FACT-PACKAGING-004",
            "fact_revision": 1,
            "target": {
              "kind": "software_invariant",
              "ref": "material-risks-have-credible-evidence",
              "revision": null
            },
            "effect": "threatened",
            "reason": "Cross-repository artifacts, target writes, packaged paths, checksums and signing gates need repeatable implementation and package evidence.",
            "gap_ids": [
              "GAP-INSTALLER-SUPPLY-VALIDATION"
            ],
            "evidence": [
              "arckit/spec/arckit-runtime-distribution.md",
              "arckit/spec/_map/RELATIONS.md",
              "arckit/interaction/setup-readiness/interaction.md",
              "arckit/interaction/setup-readiness/default.html",
              "arckit/tech/arckit-runtime/installer-supply-chain.md",
              "arckit/tech/_map/RELATIONS.md",
              "arcforge.skill-project.json",
              "delivery/skills/arckit-git-branching/references/platform-release-triggers.md"
            ]
          }
        ],
        "impacts_updated": [
          {
            "id": "IMPACT-PACKAGING-DELIVERY",
            "fact_id": "FACT-PACKAGING-001",
            "fact_revision": 1,
            "target": {
              "kind": "software_decision",
              "ref": "delivery_and_distribution",
              "revision": 3
            },
            "effect": "threatened",
            "reason": "The delivery contract is accepted but its provider, packaging and provisioning implementation remains open.",
            "gap_ids": [
              "GAP-ARCFORGE-EMBEDDED-PROVIDER",
              "GAP-RUNTIME-PACKAGING-PIPELINE",
              "GAP-RUNTIME-SKILL-PROVISIONING",
              "GAP-INSTALLER-SUPPLY-VALIDATION"
            ],
            "evidence": [
              "arckit/spec/arckit-runtime-distribution.md",
              "arckit/spec/_map/RELATIONS.md",
              "arckit/interaction/setup-readiness/interaction.md",
              "arckit/interaction/setup-readiness/default.html",
              "arckit/tech/arckit-runtime/installer-supply-chain.md",
              "arckit/tech/_map/RELATIONS.md",
              "arcforge.skill-project.json",
              "delivery/skills/arckit-git-branching/references/platform-release-triggers.md"
            ]
          },
          {
            "id": "IMPACT-PACKAGING-TECH",
            "fact_id": "FACT-PACKAGING-003",
            "fact_revision": 1,
            "target": {
              "kind": "software_invariant",
              "ref": "technical-decisions-remain-explainable",
              "revision": null
            },
            "effect": "upheld",
            "reason": "The cross-repository provider, bundle, state, update and Runtime boundary are durably explainable.",
            "gap_ids": [],
            "evidence": [
              "arckit/tech/arckit-runtime/installer-supply-chain.md",
              "arckit/tech/_map/RELATIONS.md"
            ]
          }
        ],
        "gaps_added": [
          {
            "id": "GAP-ARCFORGE-EMBEDDED-PROVIDER",
            "status": "open",
            "goal": "Provide and verify a stable, explicitly state-rooted ArcForge Embedded Provider package and manually triggered GitHub artifact workflow.",
            "reason": "Runtime packaging and Setup Readiness require an immutable provider API and artifact rather than importing an adjacent source checkout or downloading latest.",
            "derived_from": [
              "FACT-PACKAGING-003",
              "FACT-PACKAGING-004"
            ],
            "blocked_by": [],
            "priority_basis": {
              "blocking": "high",
              "risk": "high",
              "uncertainty": "medium",
              "user_impact": "high"
            },
            "responsibility": "agent",
            "evidence_required": [
              "ArcForge provider source, API tests, package manifest, checksums and a workflow/config validation that can produce the stable artifact."
            ],
            "resolution": null
          },
          {
            "id": "GAP-RUNTIME-PACKAGING-PIPELINE",
            "status": "open",
            "goal": "Implement the manually dispatched, tag-validated, target-selectable Arckit Runtime GitHub installer packaging pipeline and deterministic bundled resource layout.",
            "reason": "The accepted distribution contract is not realized until Runtime can assemble and package trusted resources, the locked skill payload and an exact ArcForge provider artifact.",
            "derived_from": [
              "FACT-PACKAGING-001",
              "FACT-PACKAGING-002",
              "FACT-PACKAGING-004"
            ],
            "blocked_by": [
              "GAP-ARCFORGE-EMBEDDED-PROVIDER"
            ],
            "priority_basis": {
              "blocking": "high",
              "risk": "high",
              "user_impact": "high"
            },
            "responsibility": "agent",
            "evidence_required": [
              "Arckit packaging scripts/config, manual GitHub workflow, trigger validation, distribution lock and selected-platform artifact smoke evidence."
            ],
            "resolution": null
          },
          {
            "id": "GAP-RUNTIME-SKILL-PROVISIONING",
            "status": "open",
            "goal": "Implement Desktop Setup Readiness and transactional ArcForge-backed Arckit skill installation, drift, repair, upgrade and readiness gating.",
            "reason": "A single installer is not a complete user experience until the packaged provider and payload can safely establish Codex-discoverable skills without entering the Runtime Kernel.",
            "derived_from": [
              "FACT-PACKAGING-003",
              "FACT-PACKAGING-004"
            ],
            "blocked_by": [
              "GAP-ARCFORGE-EMBEDDED-PROVIDER"
            ],
            "priority_basis": {
              "blocking": "high",
              "risk": "high",
              "user_impact": "high"
            },
            "responsibility": "agent",
            "evidence_required": [
              "Setup manager, narrow IPC/UI states, provisioning integration and tests for clean install, drift, conflicts, rollback and readiness."
            ],
            "resolution": null
          },
          {
            "id": "GAP-INSTALLER-SUPPLY-VALIDATION",
            "status": "open",
            "goal": "Demonstrate the installer supply chain is reproducible and safe through complete local/CI validation, package-content inspection and risk-proportionate install smoke evidence.",
            "reason": "Checksums, signing gates, packaged resource paths, cross-repository artifacts and external target writes carry material release risk that configuration presence alone cannot control.",
            "derived_from": [
              "FACT-PACKAGING-004"
            ],
            "blocked_by": [
              "GAP-RUNTIME-PACKAGING-PIPELINE",
              "GAP-RUNTIME-SKILL-PROVISIONING"
            ],
            "priority_basis": {
              "risk": "high",
              "blocking": "high",
              "user_impact": "high"
            },
            "responsibility": "agent",
            "evidence_required": [
              "Passing ArcForge and Arckit test suites, workflow/config tests, provider/package checksum evidence, package-content smoke checks and explicit remaining external signing evidence."
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
            "observed_revision": 5,
            "set_decision": {
              "status": "settled",
              "statement": "Arckit provides Project/Iteration/Case ledgers, fresh-fact-driven invariant-guided dynamic Case Gap discovery, strict single-Gap Rounds, trusted atomic transitions, maintained development skills, an optional supervised Runtime/Desktop with ordinary-todo and acceptance-feedback lanes, and a Setup Readiness surface that establishes governed Codex skills before Runtime execution.",
              "reason": "The accepted installer contract makes environment readiness and skills provisioning a recoverable product capability without moving it into the Runtime Kernel.",
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
            "reason": "The durable product capability catalog now includes the required installation surface.",
            "evidence": [
              "arckit/spec/arckit-runtime-distribution.md",
              "arckit/interaction/setup-readiness/interaction.md"
            ]
          },
          {
            "area_ref": "runtime_surfaces",
            "observed_revision": 1,
            "set_decision": {
              "status": "settled",
              "statement": "The software comprises repository-owned skills and Node.js ledger CLIs plus an Electron Desktop, Setup Readiness and skill provisioning surface, Runtime supervisor, Codex adapter, and packaged trusted capability resources.",
              "reason": "Installer delivery introduces an explicit Desktop setup surface and packaged resources while retaining the existing Runtime and Agent boundaries.",
              "evidence": [
                "arckit/spec/arckit-runtime-distribution.md",
                "arckit/tech/arckit-runtime/installer-supply-chain.md"
              ],
              "confidence": "high",
              "resume_condition": ""
            },
            "gap_refs": [],
            "reason": "The accepted surface catalog now includes distribution-time and first-run responsibilities.",
            "evidence": [
              "arckit/spec/arckit-runtime-distribution.md",
              "arckit/tech/arckit-runtime/installer-supply-chain.md"
            ]
          },
          {
            "area_ref": "experience_and_interaction",
            "observed_revision": 7,
            "set_decision": {
              "status": "settled",
              "statement": "Application startup first establishes Setup Readiness through resource checks, governed skill plan/drift, explicit confirmation, transactional apply and recoverable conflict states; ready users then continue through session restoration into the Automation Workspace, where persisted candidate comparison, accepted closeout, fresh-read, recovery and acceptance feedback remain in one persistent task conversation.",
              "reason": "The Setup Readiness interaction is now the explicit task-start prerequisite and composes with the existing login and workspace journeys.",
              "evidence": [
                "arckit/interaction/setup-readiness/interaction.md",
                "arckit/interaction/setup-readiness/default.html",
                "arckit/interaction/_map/RELATIONS.md"
              ],
              "confidence": "high",
              "resume_condition": ""
            },
            "gap_refs": [],
            "reason": "The main journey now recovers the installation and repair states that precede Runtime execution.",
            "evidence": [
              "arckit/interaction/setup-readiness/interaction.md",
              "arckit/interaction/setup-readiness/default.html"
            ]
          },
          {
            "area_ref": "technical_foundation",
            "observed_revision": 10,
            "set_decision": {
              "status": "settled",
              "statement": "Arckit uses repository-owned Markdown/JSON state, Node.js ESM ledger and Runtime scripts, an Electron Desktop host, Project v5, Case v5, Transition v8, Snapshot v1, Closeout v2 and Iteration v3. Runtime packages trusted capabilities separately from an Arckit skill payload and a versioned ArcForge Embedded Provider; Desktop Setup Readiness owns provisioning while the policy-neutral Runtime Kernel continues natural $using-arckit execution.",
              "reason": "The accepted supply contract adds explicit package-time and first-run components without duplicating Agent or ledger semantics.",
              "evidence": [
                "arckit/tech/arckit-runtime/installer-supply-chain.md",
                "arckit/tech/arckit-runtime/solution.md"
              ],
              "confidence": "high",
              "resume_condition": ""
            },
            "gap_refs": [
              "GAP-runtime-resilience-and-adapters"
            ],
            "reason": "The technical foundation now includes the governed packaging and provisioning boundary while preserving unrelated resilience work.",
            "evidence": [
              "arckit/tech/arckit-runtime/installer-supply-chain.md",
              "arckit/tech/arckit-runtime/solution.md"
            ]
          },
          {
            "area_ref": "delivery_and_distribution",
            "observed_revision": 2,
            "set_decision": {
              "status": "settled",
              "statement": "Arckit skills are sourced from the repository and synchronized to supported Codex targets through governed availability-aware installation. Runtime/Desktop installers are produced only by manually dispatched GitHub workflows against an existing tf/*, beta/* or appstore/* release-intent tag, bundle locked trusted resources, the Arckit skill payload and an exact ArcForge provider artifact, and support macOS arm64/x64, Windows x64 and Linux x64 with explicit signing and draft-release choices.",
              "reason": "The operator retains package timing and target authorization while immutable tags, locks, checksums, availability and confirmation preserve distribution governance.",
              "evidence": [
                "arckit/spec/arckit-runtime-distribution.md",
                "arckit/tech/arckit-runtime/installer-supply-chain.md",
                "delivery/skills/arckit-git-branching/references/platform-release-triggers.md"
              ],
              "confidence": "high",
              "resume_condition": ""
            },
            "gap_refs": [
              "GAP-delivery-governance"
            ],
            "reason": "The delivery decision now defines the formal installer and manual workflow contract; realization remains tracked by the Case and Project delivery gap.",
            "evidence": [
              "arckit/spec/arckit-runtime-distribution.md",
              "arckit/tech/arckit-runtime/installer-supply-chain.md"
            ]
          }
        ],
        "software_invariant_changes": [],
        "project_gap_changes": [
          {
            "action": "update",
            "gap": {
              "id": "GAP-delivery-governance",
              "goal": "Complete application-target synchronization, drift verification and release acceptance.",
              "reason": "Maintained skills and the Runtime installer supply chain require implementation, drift, package and release evidence before delivery governance is accepted.",
              "affects": [
                {
                  "kind": "software_decision",
                  "ref": "delivery_and_distribution"
                },
                {
                  "kind": "software_invariant",
                  "ref": "accepted-facts-are-realized"
                }
              ],
              "priority_basis": {
                "risk": "high",
                "urgency": "high"
              },
              "dependencies": [],
              "candidate_case_ref": "arckit/cases/active/CASE-20260814-002-build-the-governed-arckit-runtime-installer-supply-chain.md"
            },
            "reason": "The registered Case now carries the concrete installer and skills delivery obligations.",
            "evidence": [
              "arckit/spec/arckit-runtime-distribution.md",
              "arckit/spec/_map/RELATIONS.md",
              "arckit/interaction/setup-readiness/interaction.md",
              "arckit/interaction/setup-readiness/default.html",
              "arckit/tech/arckit-runtime/installer-supply-chain.md",
              "arckit/tech/_map/RELATIONS.md",
              "arcforge.skill-project.json",
              "delivery/skills/arckit-git-branching/references/platform-release-triggers.md"
            ]
          }
        ],
        "selection_context_change": {
          "current_focus": "Implement and validate the governed Arckit Runtime installer supply chain through the active Case, beginning with the stable ArcForge Embedded Provider dependency."
        },
        "evidence": [
          "arckit/spec/arckit-runtime-distribution.md",
          "arckit/spec/_map/RELATIONS.md",
          "arckit/interaction/setup-readiness/interaction.md",
          "arckit/interaction/setup-readiness/default.html",
          "arckit/tech/arckit-runtime/installer-supply-chain.md",
          "arckit/tech/_map/RELATIONS.md",
          "arcforge.skill-project.json",
          "delivery/skills/arckit-git-branching/references/platform-release-triggers.md"
        ]
      },
      "invariant_assessment": {
        "project_revision": 50,
        "judgments": [
          {
            "invariant_ref": "product-expectations-remain-recoverable",
            "disposition": "upheld",
            "reason": "The installer capability, manual release intent, lifecycle and acceptance behavior are authoritative and durable.",
            "fact_refs": [
              "FACT-PACKAGING-004"
            ],
            "evidence": [
              "arckit/spec/arckit-runtime-distribution.md",
              "arckit/spec/_map/RELATIONS.md"
            ],
            "gap_refs": []
          },
          {
            "invariant_ref": "interaction-expectations-remain-recoverable",
            "disposition": "upheld",
            "reason": "Setup Readiness has a durable strategy and projections for checking, confirmation, execution, completion, conflict and blocked recovery.",
            "fact_refs": [
              "FACT-PACKAGING-004"
            ],
            "evidence": [
              "arckit/interaction/setup-readiness/interaction.md",
              "arckit/interaction/setup-readiness/default.html"
            ],
            "gap_refs": []
          },
          {
            "invariant_ref": "visual-language-remains-consistent",
            "disposition": "upheld",
            "reason": "The new setup projection uses the existing grayscale wireframe system and does not change the accepted Desktop visual language.",
            "fact_refs": [],
            "evidence": [
              "arckit/interaction/setup-readiness/default.html",
              "arckit/interaction/wireframe-style.css",
              "arckit/visual/_library/design-tokens.yaml"
            ],
            "gap_refs": []
          },
          {
            "invariant_ref": "technical-decisions-remain-explainable",
            "disposition": "upheld",
            "reason": "Resource ownership, provider API, state roots, packaging, signing, update and Runtime boundaries are explicit.",
            "fact_refs": [
              "FACT-PACKAGING-004"
            ],
            "evidence": [
              "arckit/tech/arckit-runtime/installer-supply-chain.md",
              "arckit/tech/_map/RELATIONS.md"
            ],
            "gap_refs": []
          },
          {
            "invariant_ref": "accepted-facts-are-realized",
            "disposition": "threatened",
            "reason": "The accepted supply contract is not yet realized in the two repositories or Desktop.",
            "fact_refs": [
              "FACT-PACKAGING-004"
            ],
            "evidence": [
              "arckit/spec/arckit-runtime-distribution.md",
              "arckit/spec/_map/RELATIONS.md",
              "arckit/interaction/setup-readiness/interaction.md",
              "arckit/interaction/setup-readiness/default.html",
              "arckit/tech/arckit-runtime/installer-supply-chain.md",
              "arckit/tech/_map/RELATIONS.md",
              "arcforge.skill-project.json",
              "delivery/skills/arckit-git-branching/references/platform-release-triggers.md"
            ],
            "gap_refs": [
              "GAP-ARCFORGE-EMBEDDED-PROVIDER",
              "GAP-RUNTIME-PACKAGING-PIPELINE",
              "GAP-RUNTIME-SKILL-PROVISIONING"
            ]
          },
          {
            "invariant_ref": "material-risks-have-credible-evidence",
            "disposition": "threatened",
            "reason": "Artifact integrity, packaged paths, signing gates and external target writes still need repeatable implementation and smoke evidence.",
            "fact_refs": [
              "FACT-PACKAGING-004"
            ],
            "evidence": [
              "arckit/spec/arckit-runtime-distribution.md",
              "arckit/spec/_map/RELATIONS.md",
              "arckit/interaction/setup-readiness/interaction.md",
              "arckit/interaction/setup-readiness/default.html",
              "arckit/tech/arckit-runtime/installer-supply-chain.md",
              "arckit/tech/_map/RELATIONS.md",
              "arcforge.skill-project.json",
              "delivery/skills/arckit-git-branching/references/platform-release-triggers.md"
            ],
            "gap_refs": [
              "GAP-INSTALLER-SUPPLY-VALIDATION"
            ]
          }
        ]
      },
      "evidence": [
        "arckit/spec/arckit-runtime-distribution.md",
        "arckit/spec/_map/RELATIONS.md",
        "arckit/interaction/setup-readiness/interaction.md",
        "arckit/interaction/setup-readiness/default.html",
        "arckit/tech/arckit-runtime/installer-supply-chain.md",
        "arckit/tech/_map/RELATIONS.md",
        "arcforge.skill-project.json",
        "delivery/skills/arckit-git-branching/references/platform-release-triggers.md"
      ],
      "runtime_result_ref": "",
      "occurred_at": "2026-08-14T05:09:51.966Z"
    },
    {
      "round": 2,
      "transition_schema_version": "arckit-case-transition/v8",
      "goal": "Implement and verify the stable ArcForge Embedded Provider and its governed artifact supply.",
      "outcome": "completed",
      "gap_selection": {
        "mode": "candidate",
        "basis": "Fresh state makes the provider the sole ready Case prerequisite.",
        "snapshot_token": "e1a448068a663575bab5b554cec808e1e777a1cac1cce6efa8bbe11374c94723",
        "selected_ref": "case-gap:CASE-20260814-002:GAP-ARCFORGE-EMBEDDED-PROVIDER",
        "comparison_summary": "Five Project gaps remain deferred to their own Cases; the provider is the sole ready active-Case gap and unblocks both Runtime implementation gaps.",
        "fresh_discovery_summary": "No higher-priority fresh gap was found; discovered state-isolation and trigger-validation defects were repaired inside the selected outcome.",
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
            "reason": "Independent scenario evaluation is outside this installer Case."
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
            "reason": "General resilience is separate from this supply prerequisite."
          },
          {
            "ref": "project-gap:GAP-security-real-project-validation",
            "source": "persisted",
            "eligibility": "case_required",
            "disposition": "deferred",
            "priority_basis": {
              "risk": "high",
              "urgency": "medium"
            },
            "reason": "Permission-bearing validation remains a separate Project obligation."
          },
          {
            "ref": "project-gap:GAP-delivery-governance",
            "source": "persisted",
            "eligibility": "case_required",
            "disposition": "deferred",
            "priority_basis": {
              "risk": "high",
              "urgency": "high"
            },
            "reason": "The active registered Case carries this delivery obligation."
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
            "reason": "Cross-record audit is independent of the provider prerequisite."
          },
          {
            "ref": "case-gap:CASE-20260814-002:GAP-ARCFORGE-EMBEDDED-PROVIDER",
            "source": "persisted",
            "eligibility": "ready",
            "disposition": "selected",
            "priority_basis": {
              "blocking": "high",
              "uncertainty": "medium",
              "risk": "high",
              "user_impact": "high"
            },
            "reason": "It is the only ready Case gap and unblocks Runtime packaging and provisioning."
          }
        ]
      },
      "selected_gap": {
        "id": "GAP-ARCFORGE-EMBEDDED-PROVIDER",
        "responsibility": "agent",
        "goal": "Provide and verify a stable, explicitly state-rooted ArcForge Embedded Provider package and manually triggered GitHub artifact workflow.",
        "reason": "Runtime packaging and Setup Readiness require an immutable provider API and artifact rather than importing an adjacent source checkout or downloading latest.",
        "derived_from": [
          "FACT-PACKAGING-003",
          "FACT-PACKAGING-004"
        ],
        "blocked_by": [],
        "priority_basis": {
          "blocking": "high",
          "uncertainty": "medium",
          "risk": "high",
          "user_impact": "high"
        },
        "evidence_required": [
          "ArcForge provider source, API tests, package manifest, checksums and a workflow/config validation that can produce the stable artifact."
        ]
      },
      "planned_transition": {
        "goal": "Implement and verify the stable ArcForge Embedded Provider and its governed artifact supply.",
        "expected_state_change": "The provider prerequisite becomes accepted and both Runtime implementation gaps become ready on the next fresh read."
      },
      "accepted_state_delta": {
        "resolved_gap": {
          "id": "GAP-ARCFORGE-EMBEDDED-PROVIDER",
          "status": "resolved",
          "outcome": "ArcForge now exposes a versioned ESM embedded provider with explicit state isolation, fresh plan confirmation, managed removal, reproducible metadata/checksums, and a manual tag-validated artifact workflow.",
          "reason": "The implementation and its full tests, package construction, archive inspection and checksum validation pass.",
          "evidence": [
            "../arcforge/src/provider/index.ts",
            "../arcforge/tests/provider.test.mjs",
            "../arcforge/tests/release-trigger.test.mjs",
            "../arcforge/scripts/build-provider-package.mjs",
            "../arcforge/scripts/validate-release-trigger.mjs",
            "../arcforge/.github/workflows/package.yml",
            "verification: ../arcforge check, 59 tests, provider package and checksums passed"
          ]
        },
        "facts_added": [
          {
            "id": "FACT-PACKAGING-005",
            "revision": 1,
            "status": "accepted",
            "statement": "ArcForge provides arcforge-embedded-provider/v1 and a manual governed workflow that consumes existing tf, beta or appstore tags to produce immutable provider archives, manifests and SHA-256 checksums without creating or moving tags.",
            "basis": "Implemented source, workflow, package builder and passing isolation, release-contract and full-suite verification.",
            "evidence": [
              "../arcforge/src/provider/index.ts",
              "../arcforge/scripts/build-provider-package.mjs",
              "../arcforge/scripts/validate-release-trigger.mjs",
              "../arcforge/.github/workflows/package.yml",
              "../arcforge/tests/provider.test.mjs",
              "../arcforge/tests/release-trigger.test.mjs"
            ]
          }
        ],
        "facts_superseded": [],
        "impacts_added": [],
        "impacts_updated": [
          {
            "id": "IMPACT-PACKAGING-DELIVERY",
            "fact_id": "FACT-PACKAGING-001",
            "fact_revision": 1,
            "target": {
              "kind": "software_decision",
              "ref": "delivery_and_distribution",
              "revision": 3
            },
            "effect": "threatened",
            "reason": "Provider supply is implemented; Runtime packaging, provisioning and integrated validation remain open.",
            "gap_ids": [
              "GAP-RUNTIME-PACKAGING-PIPELINE",
              "GAP-RUNTIME-SKILL-PROVISIONING",
              "GAP-INSTALLER-SUPPLY-VALIDATION"
            ],
            "evidence": [
              "../arcforge/.github/workflows/package.yml",
              "../arcforge/scripts/build-provider-package.mjs",
              "arckit/tech/arckit-runtime/installer-supply-chain.md"
            ]
          },
          {
            "id": "IMPACT-PACKAGING-REALIZATION",
            "fact_id": "FACT-PACKAGING-004",
            "fact_revision": 1,
            "target": {
              "kind": "software_invariant",
              "ref": "accepted-facts-are-realized",
              "revision": null
            },
            "effect": "threatened",
            "reason": "The provider portion is realized, but Runtime packaging and Desktop provisioning remain open.",
            "gap_ids": [
              "GAP-RUNTIME-PACKAGING-PIPELINE",
              "GAP-RUNTIME-SKILL-PROVISIONING"
            ],
            "evidence": [
              "../arcforge/src/provider/index.ts",
              "../arcforge/tests/provider.test.mjs",
              "../arcforge/.github/workflows/package.yml"
            ]
          },
          {
            "id": "IMPACT-PACKAGING-RISK",
            "fact_id": "FACT-PACKAGING-004",
            "fact_revision": 1,
            "target": {
              "kind": "software_invariant",
              "ref": "material-risks-have-credible-evidence",
              "revision": null
            },
            "effect": "threatened",
            "reason": "Provider isolation, freshness, removal, triggers and checksums have evidence; Runtime paths, signing and install smoke remain.",
            "gap_ids": [
              "GAP-INSTALLER-SUPPLY-VALIDATION"
            ],
            "evidence": [
              "../arcforge/tests/provider.test.mjs",
              "../arcforge/tests/release-trigger.test.mjs",
              "../arcforge/scripts/build-provider-package.mjs"
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
        "software_definition_changes": [],
        "software_invariant_changes": [],
        "project_gap_changes": [],
        "selection_context_change": null,
        "evidence": []
      },
      "invariant_assessment": {
        "project_revision": 51,
        "judgments": [
          {
            "invariant_ref": "product-expectations-remain-recoverable",
            "disposition": "upheld",
            "reason": "Provider realization conforms to the accepted distribution capability.",
            "fact_refs": [
              "FACT-PACKAGING-004",
              "FACT-PACKAGING-005"
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
            "reason": "Provider operations match Setup Readiness plan, confirmation, apply and recovery semantics.",
            "fact_refs": [
              "FACT-PACKAGING-005"
            ],
            "evidence": [
              "arckit/interaction/setup-readiness/interaction.md",
              "../arcforge/src/provider/index.ts"
            ],
            "gap_refs": []
          },
          {
            "invariant_ref": "visual-language-remains-consistent",
            "disposition": "upheld",
            "reason": "This nonvisual implementation preserves the accepted Setup Readiness projection.",
            "fact_refs": [],
            "evidence": [
              "arckit/interaction/setup-readiness/default.html",
              "arckit/visual/_library/design-tokens.yaml"
            ],
            "gap_refs": []
          },
          {
            "invariant_ref": "technical-decisions-remain-explainable",
            "disposition": "upheld",
            "reason": "API, state roots, evidence digests, transactions, artifact manifest and trigger enforcement are source-visible.",
            "fact_refs": [
              "FACT-PACKAGING-005"
            ],
            "evidence": [
              "arckit/tech/arckit-runtime/installer-supply-chain.md",
              "../arcforge/src/provider/index.ts",
              "../arcforge/README.md"
            ],
            "gap_refs": []
          },
          {
            "invariant_ref": "accepted-facts-are-realized",
            "disposition": "threatened",
            "reason": "Provider realization is complete but Runtime packaging and provisioning remain.",
            "fact_refs": [
              "FACT-PACKAGING-004",
              "FACT-PACKAGING-005"
            ],
            "evidence": [
              "../arcforge/tests/provider.test.mjs",
              "../arcforge/.github/workflows/package.yml"
            ],
            "gap_refs": [
              "GAP-RUNTIME-PACKAGING-PIPELINE",
              "GAP-RUNTIME-SKILL-PROVISIONING"
            ]
          },
          {
            "invariant_ref": "material-risks-have-credible-evidence",
            "disposition": "threatened",
            "reason": "Provider risks are tested; installer assembly, signing and smoke evidence remain.",
            "fact_refs": [
              "FACT-PACKAGING-004",
              "FACT-PACKAGING-005"
            ],
            "evidence": [
              "../arcforge/tests/provider.test.mjs",
              "../arcforge/tests/release-trigger.test.mjs",
              "../arcforge/scripts/build-provider-package.mjs"
            ],
            "gap_refs": [
              "GAP-INSTALLER-SUPPLY-VALIDATION"
            ]
          }
        ]
      },
      "evidence": [
        "../arcforge/src/provider/index.ts",
        "../arcforge/.github/workflows/package.yml",
        "../arcforge/tests/provider.test.mjs",
        "../arcforge/tests/release-trigger.test.mjs",
        "../arcforge/scripts/build-provider-package.mjs",
        "verification: ../arcforge check, 59 tests, provider package and checksums passed"
      ],
      "runtime_result_ref": "",
      "occurred_at": "2026-08-14T05:27:18.421Z"
    },
    {
      "round": 3,
      "transition_schema_version": "arckit-case-transition/v8",
      "goal": "Build and verify the governed Runtime installer assembly and manually dispatched GitHub workflow.",
      "outcome": "completed",
      "gap_selection": {
        "mode": "candidate",
        "basis": "Runtime packaging is the highest-impact ready gap after the provider and contract prerequisites were resolved.",
        "snapshot_token": "eb44e6c1f88d2a5592cdcc984beaaa2d79f36ab90fa6fc71b74f93b1858505a5",
        "selected_ref": "case-gap:CASE-20260814-002:GAP-RUNTIME-PACKAGING-PIPELINE",
        "comparison_summary": "Compared five Project candidates and both ready Case gaps; packaging most directly satisfies the manual installer request and unblocks deterministic Desktop provisioning paths.",
        "fresh_discovery_summary": "Implementation exposed no more important ready fresh gap; final integrated validation remains blocked by packaging and provisioning and is retained for a later round.",
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
            "reason": "Separate real-scenario evaluation Case; it does not block the selected installer implementation."
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
            "reason": "General Runtime resilience remains separate from completing the governed installer pipeline."
          },
          {
            "ref": "project-gap:GAP-security-real-project-validation",
            "source": "persisted",
            "eligibility": "case_required",
            "disposition": "deferred",
            "priority_basis": {
              "risk": "high",
              "urgency": "medium"
            },
            "reason": "Requires a separate permission-bearing project and real credentials; no such evidence is claimed here."
          },
          {
            "ref": "project-gap:GAP-delivery-governance",
            "source": "persisted",
            "eligibility": "case_required",
            "disposition": "deferred",
            "priority_basis": {
              "risk": "high",
              "urgency": "high"
            },
            "reason": "The Project-level obligation is carried by this active installer Case."
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
            "reason": "Cross-record auditing is independent of producing Runtime installers."
          },
          {
            "ref": "case-gap:CASE-20260814-002:GAP-RUNTIME-PACKAGING-PIPELINE",
            "source": "persisted",
            "eligibility": "ready",
            "disposition": "selected",
            "priority_basis": {
              "blocking": "high",
              "risk": "high",
              "user_impact": "high"
            },
            "reason": "Selected because it directly realizes the operator-requested manual package pipeline and establishes the resource layout required by provisioning."
          },
          {
            "ref": "case-gap:CASE-20260814-002:GAP-RUNTIME-SKILL-PROVISIONING",
            "source": "persisted",
            "eligibility": "ready",
            "disposition": "deferred",
            "priority_basis": {
              "blocking": "high",
              "risk": "high",
              "user_impact": "high"
            },
            "reason": "Ready but deferred one round because it depends on the packaged provider and payload paths completed by the selected gap."
          }
        ]
      },
      "selected_gap": {
        "id": "GAP-RUNTIME-PACKAGING-PIPELINE",
        "responsibility": "agent",
        "goal": "Implement the manually dispatched, tag-validated, target-selectable Arckit Runtime GitHub installer packaging pipeline and deterministic bundled resource layout.",
        "reason": "The accepted distribution contract is not realized until Runtime can assemble and package trusted resources, the locked skill payload and an exact ArcForge provider artifact.",
        "derived_from": [
          "FACT-PACKAGING-001",
          "FACT-PACKAGING-002",
          "FACT-PACKAGING-004"
        ],
        "blocked_by": [
          "GAP-ARCFORGE-EMBEDDED-PROVIDER"
        ],
        "priority_basis": {
          "blocking": "high",
          "uncertainty": "",
          "risk": "high",
          "user_impact": "high"
        },
        "evidence_required": [
          "Arckit packaging scripts/config, manual GitHub workflow, trigger validation, distribution lock and selected-platform artifact smoke evidence."
        ]
      },
      "planned_transition": {
        "goal": "Build and verify the governed Runtime installer assembly and manually dispatched GitHub workflow.",
        "expected_state_change": "Runtime packaging becomes a reproducible, tag-governed supply stage and only Desktop provisioning plus integrated validation remain open."
      },
      "accepted_state_delta": {
        "resolved_gap": {
          "id": "GAP-RUNTIME-PACKAGING-PIPELINE",
          "status": "resolved",
          "outcome": "Arckit Runtime now has a manual-only, existing-tag validated, native-platform GitHub installer workflow with deterministic trusted capability, skill payload and exact ArcForge provider resources.",
          "reason": "Release-trigger tests, complete Runtime tests, arm64/x64 DMG builds, x64 packaged execution, ASAR/resource inspection, DMG verification, SHA-256 and attestation checks all pass.",
          "evidence": [
            ".github/workflows/arckit-runtime-package.yml",
            "runtime/arckit-runtime/scripts/validate-release-trigger.mjs",
            "runtime/arckit-runtime/scripts/prepare-distribution.mjs",
            "runtime/arckit-runtime/scripts/build-package-config.mjs",
            "runtime/arckit-runtime/scripts/finalize-package-artifacts.mjs",
            "runtime/arckit-runtime/test/package-distribution.test.mjs",
            "runtime/arckit-runtime/test/release-trigger.test.mjs",
            "verification: Runtime check 166 tests; macOS arm64/x64 DMG package smoke and x64 packaged-resource execution passed"
          ]
        },
        "facts_added": [
          {
            "id": "FACT-PACKAGING-006",
            "revision": 1,
            "status": "accepted",
            "statement": "Arckit Runtime can deterministically assemble trusted Runtime capabilities, 13 governed Arckit skills and an exact checksum-bound ArcForge provider into target-native installers selected only by a manual workflow against an existing compliant release-intent tag.",
            "basis": "Implemented workflow, packaging scripts, distribution locks, external attestations and real macOS package smoke evidence.",
            "evidence": [
              ".github/workflows/arckit-runtime-package.yml",
              "runtime/arckit-runtime/scripts/prepare-distribution.mjs",
              "runtime/arckit-runtime/scripts/build-package-config.mjs",
              "runtime/arckit-runtime/scripts/finalize-package-artifacts.mjs",
              "runtime/arckit-runtime/test/package-distribution.test.mjs",
              "verification: macOS x64 DMG verified and packaged resources executed"
            ]
          }
        ],
        "facts_superseded": [],
        "impacts_added": [],
        "impacts_updated": [
          {
            "id": "IMPACT-PACKAGING-DELIVERY",
            "fact_id": "FACT-PACKAGING-001",
            "fact_revision": 1,
            "target": {
              "kind": "software_decision",
              "ref": "delivery_and_distribution",
              "revision": 3
            },
            "effect": "threatened",
            "reason": "Provider and Runtime packaging are implemented; Desktop provisioning and integrated installer validation remain open.",
            "gap_ids": [
              "GAP-RUNTIME-SKILL-PROVISIONING",
              "GAP-INSTALLER-SUPPLY-VALIDATION"
            ],
            "evidence": [
              ".github/workflows/arckit-runtime-package.yml",
              "runtime/arckit-runtime/scripts/prepare-distribution.mjs",
              "runtime/arckit-runtime/test/package-distribution.test.mjs"
            ]
          },
          {
            "id": "IMPACT-PACKAGING-REALIZATION",
            "fact_id": "FACT-PACKAGING-004",
            "fact_revision": 1,
            "target": {
              "kind": "software_invariant",
              "ref": "accepted-facts-are-realized",
              "revision": null
            },
            "effect": "threatened",
            "reason": "Provider and installer assembly are realized, while Desktop Setup Readiness and transactional user skill provisioning remain open.",
            "gap_ids": [
              "GAP-RUNTIME-SKILL-PROVISIONING"
            ],
            "evidence": [
              ".github/workflows/arckit-runtime-package.yml",
              "runtime/arckit-runtime/scripts/prepare-distribution.mjs",
              "runtime/arckit-runtime/test/package-distribution.test.mjs"
            ]
          },
          {
            "id": "IMPACT-PACKAGING-RISK",
            "fact_id": "FACT-PACKAGING-004",
            "fact_revision": 1,
            "target": {
              "kind": "software_invariant",
              "ref": "material-risks-have-credible-evidence",
              "revision": null
            },
            "effect": "threatened",
            "reason": "Package assembly, immutable inputs, paths, checksums and unsigned local smoke are evidenced; provisioning integration and final cross-platform/signing acceptance remain.",
            "gap_ids": [
              "GAP-INSTALLER-SUPPLY-VALIDATION"
            ],
            "evidence": [
              "runtime/arckit-runtime/test/package-distribution.test.mjs",
              "runtime/arckit-runtime/test/release-trigger.test.mjs",
              "verification: arm64/x64 DMG builds, hdiutil verify and x64 packaged execution passed"
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
        "software_definition_changes": [],
        "software_invariant_changes": [],
        "project_gap_changes": [],
        "selection_context_change": null,
        "evidence": []
      },
      "invariant_assessment": {
        "project_revision": 51,
        "judgments": [
          {
            "invariant_ref": "product-expectations-remain-recoverable",
            "disposition": "upheld",
            "reason": "The installer behavior and operator choices remain explicit and match the implemented workflow.",
            "fact_refs": [
              "FACT-PACKAGING-004",
              "FACT-PACKAGING-006"
            ],
            "evidence": [
              "arckit/spec/arckit-runtime-distribution.md",
              ".github/workflows/arckit-runtime-package.yml"
            ],
            "gap_refs": []
          },
          {
            "invariant_ref": "interaction-expectations-remain-recoverable",
            "disposition": "upheld",
            "reason": "Setup Readiness states and confirmations remain durably specified for the next implementation round.",
            "fact_refs": [
              "FACT-PACKAGING-004"
            ],
            "evidence": [
              "arckit/interaction/setup-readiness/interaction.md",
              "arckit/interaction/setup-readiness/default.html"
            ],
            "gap_refs": []
          },
          {
            "invariant_ref": "visual-language-remains-consistent",
            "disposition": "upheld",
            "reason": "Packaging changes do not alter visual language and retain the accepted Setup Readiness projection.",
            "fact_refs": [],
            "evidence": [
              "arckit/interaction/setup-readiness/default.html",
              "arckit/visual/_library/design-tokens.yaml"
            ],
            "gap_refs": []
          },
          {
            "invariant_ref": "technical-decisions-remain-explainable",
            "disposition": "upheld",
            "reason": "Native runner, ASAR, external resources, immutable provider, signing and attestation boundaries are source-visible.",
            "fact_refs": [
              "FACT-PACKAGING-006"
            ],
            "evidence": [
              "arckit/tech/arckit-runtime/installer-supply-chain.md",
              "runtime/arckit-runtime/scripts/prepare-distribution.mjs",
              ".github/workflows/arckit-runtime-package.yml"
            ],
            "gap_refs": []
          },
          {
            "invariant_ref": "accepted-facts-are-realized",
            "disposition": "threatened",
            "reason": "Packaging is realized but the accepted Setup Readiness provisioning behavior is not yet implemented.",
            "fact_refs": [
              "FACT-PACKAGING-004",
              "FACT-PACKAGING-006"
            ],
            "evidence": [
              "runtime/arckit-runtime/test/package-distribution.test.mjs"
            ],
            "gap_refs": [
              "GAP-RUNTIME-SKILL-PROVISIONING"
            ]
          },
          {
            "invariant_ref": "material-risks-have-credible-evidence",
            "disposition": "threatened",
            "reason": "Installer smoke evidence exists, but provisioning and integrated target/signing validation remain open.",
            "fact_refs": [
              "FACT-PACKAGING-004",
              "FACT-PACKAGING-006"
            ],
            "evidence": [
              "runtime/arckit-runtime/test/package-distribution.test.mjs",
              "verification: macOS package smoke passed"
            ],
            "gap_refs": [
              "GAP-INSTALLER-SUPPLY-VALIDATION"
            ]
          }
        ]
      },
      "evidence": [
        ".github/workflows/arckit-runtime-package.yml",
        "runtime/arckit-runtime/scripts/prepare-distribution.mjs",
        "runtime/arckit-runtime/test/package-distribution.test.mjs",
        "verification: Runtime check and macOS package smoke passed"
      ],
      "runtime_result_ref": "",
      "occurred_at": "2026-08-14T05:48:32.653Z"
    },
    {
      "round": 4,
      "transition_schema_version": "arckit-case-transition/v8",
      "goal": "Implement and verify Desktop Setup Readiness with safe ArcForge-backed skills provisioning outside the Runtime Kernel.",
      "outcome": "completed",
      "gap_selection": {
        "mode": "candidate",
        "basis": "Desktop Setup Readiness and transactional skill provisioning are the sole ready Case gap after installer packaging was resolved.",
        "snapshot_token": "6a9029ab2da533ac47c5ed2cf4497ea9ffd490f6d60e2eea2c36feae8854cb8f",
        "selected_ref": "case-gap:CASE-20260814-002:GAP-RUNTIME-SKILL-PROVISIONING",
        "comparison_summary": "Compared all five Project candidates with the sole ready Case gap; provisioning directly completes the requested installer experience, while the integrated validation gap remains causally blocked until this round closes.",
        "fresh_discovery_summary": "No higher-priority fresh gap was found; development-mode capability duplicate scanning and checksum placement defects discovered during validation were repaired within this selected implementation boundary.",
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
            "reason": "Separate real-scenario evaluation Case; it does not block Desktop provisioning."
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
            "reason": "General Runtime resilience remains outside the installer provisioning boundary."
          },
          {
            "ref": "project-gap:GAP-security-real-project-validation",
            "source": "persisted",
            "eligibility": "case_required",
            "disposition": "deferred",
            "priority_basis": {
              "risk": "high",
              "urgency": "medium"
            },
            "reason": "Requires a separate permission-bearing project and real controlled credentials."
          },
          {
            "ref": "project-gap:GAP-delivery-governance",
            "source": "persisted",
            "eligibility": "case_required",
            "disposition": "deferred",
            "priority_basis": {
              "risk": "high",
              "urgency": "high"
            },
            "reason": "The Project-level delivery obligation remains carried by this active installer Case."
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
            "reason": "Cross-record auditing is independent of Desktop skill provisioning."
          },
          {
            "ref": "case-gap:CASE-20260814-002:GAP-RUNTIME-SKILL-PROVISIONING",
            "source": "persisted",
            "eligibility": "ready",
            "disposition": "selected",
            "priority_basis": {
              "blocking": "high",
              "risk": "high",
              "user_impact": "high"
            },
            "reason": "Selected as the only ready Case implementation gap and the remaining requirement for a complete single-installer experience."
          }
        ]
      },
      "selected_gap": {
        "id": "GAP-RUNTIME-SKILL-PROVISIONING",
        "responsibility": "agent",
        "goal": "Implement Desktop Setup Readiness and transactional ArcForge-backed Arckit skill installation, drift, repair, upgrade and readiness gating.",
        "reason": "A single installer is not a complete user experience until the packaged provider and payload can safely establish Codex-discoverable skills without entering the Runtime Kernel.",
        "derived_from": [
          "FACT-PACKAGING-003",
          "FACT-PACKAGING-004"
        ],
        "blocked_by": [
          "GAP-ARCFORGE-EMBEDDED-PROVIDER"
        ],
        "priority_basis": {
          "blocking": "high",
          "uncertainty": "",
          "risk": "high",
          "user_impact": "high"
        },
        "evidence_required": [
          "Setup manager, narrow IPC/UI states, provisioning integration and tests for clean install, drift, conflicts, rollback and readiness."
        ]
      },
      "planned_transition": {
        "goal": "Implement and verify Desktop Setup Readiness with safe ArcForge-backed skills provisioning outside the Runtime Kernel.",
        "expected_state_change": "The complete packaged user experience becomes realized; only integrated supply-chain validation remains open."
      },
      "accepted_state_delta": {
        "resolved_gap": {
          "id": "GAP-RUNTIME-SKILL-PROVISIONING",
          "status": "resolved",
          "outcome": "Desktop now validates bundled resources, stages versioned sources, presents normalized plan/drift, requires plan and separate cleanup confirmations, transactionally provisions Codex skills through the embedded provider, gates task starts, and supports safe upgrade rollback.",
          "reason": "Unit, UI/IPC, full Runtime, real embedded-provider, packaged-ASAR and post-drift smoke evidence all pass.",
          "evidence": [
            "runtime/arckit-runtime/src/skill-provisioning-manager.mjs",
            "runtime/arckit-runtime/desktop/main.mjs",
            "runtime/arckit-runtime/desktop/preload.cjs",
            "runtime/arckit-runtime/desktop/renderer/index.html",
            "runtime/arckit-runtime/desktop/renderer/renderer.js",
            "runtime/arckit-runtime/test/skill-provisioning-manager.test.mjs",
            "runtime/arckit-runtime/test/desktop-renderer.test.mjs",
            "verification: packaged ASAR manager plus real provider install returned ready with 13 same drift items"
          ]
        },
        "facts_added": [
          {
            "id": "FACT-PACKAGING-007",
            "revision": 1,
            "status": "accepted",
            "statement": "Packaged Arckit Desktop Setup Readiness can verify distribution resources, install 12 user-scoped Arckit skills and the ArcForge on-demand loader, defer one project-ambient skill, detect conflicts, preserve unrelated skills, roll back failed source upgrades and block Runtime task starts until post-drift and Codex checks are ready.",
            "basis": "Implemented manager/main/preload/renderer boundary with isolated and packaged real-provider verification.",
            "evidence": [
              "runtime/arckit-runtime/src/skill-provisioning-manager.mjs",
              "runtime/arckit-runtime/src/automation-coordinator.mjs",
              "runtime/arckit-runtime/test/skill-provisioning-manager.test.mjs",
              "runtime/arckit-runtime/test/desktop-renderer.test.mjs",
              "verification: Runtime 169 tests and packaged real-provider Setup smoke passed"
            ]
          }
        ],
        "facts_superseded": [],
        "impacts_added": [],
        "impacts_updated": [
          {
            "id": "IMPACT-PACKAGING-DELIVERY",
            "fact_id": "FACT-PACKAGING-001",
            "fact_revision": 1,
            "target": {
              "kind": "software_decision",
              "ref": "delivery_and_distribution",
              "revision": 3
            },
            "effect": "threatened",
            "reason": "Provider, packaging and Setup provisioning are implemented; final integrated supply-chain acceptance remains open.",
            "gap_ids": [
              "GAP-INSTALLER-SUPPLY-VALIDATION"
            ],
            "evidence": [
              "runtime/arckit-runtime/src/skill-provisioning-manager.mjs",
              ".github/workflows/arckit-runtime-package.yml",
              "runtime/arckit-runtime/test/skill-provisioning-manager.test.mjs"
            ]
          },
          {
            "id": "IMPACT-PACKAGING-REALIZATION",
            "fact_id": "FACT-PACKAGING-004",
            "fact_revision": 1,
            "target": {
              "kind": "software_invariant",
              "ref": "accepted-facts-are-realized",
              "revision": null
            },
            "effect": "upheld",
            "reason": "The accepted provider, installer assembly and Desktop Setup Readiness behavior are now implemented across both repositories.",
            "gap_ids": [],
            "evidence": [
              "../arcforge/src/provider/index.ts",
              ".github/workflows/arckit-runtime-package.yml",
              "runtime/arckit-runtime/src/skill-provisioning-manager.mjs",
              "runtime/arckit-runtime/desktop/main.mjs",
              "verification: packaged real-provider Setup smoke passed"
            ]
          },
          {
            "id": "IMPACT-PACKAGING-RISK",
            "fact_id": "FACT-PACKAGING-004",
            "fact_revision": 1,
            "target": {
              "kind": "software_invariant",
              "ref": "material-risks-have-credible-evidence",
              "revision": null
            },
            "effect": "threatened",
            "reason": "Provisioning conflict, rollback, tamper and packaged smoke evidence now exists; final cross-repository audit and explicit external signing limits remain to be accepted.",
            "gap_ids": [
              "GAP-INSTALLER-SUPPLY-VALIDATION"
            ],
            "evidence": [
              "runtime/arckit-runtime/test/skill-provisioning-manager.test.mjs",
              "runtime/arckit-runtime/test/package-distribution.test.mjs",
              "verification: packaged x64 DMG and real provider Setup smoke passed"
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
        "software_definition_changes": [],
        "software_invariant_changes": [],
        "project_gap_changes": [],
        "selection_context_change": null,
        "evidence": []
      },
      "invariant_assessment": {
        "project_revision": 51,
        "judgments": [
          {
            "invariant_ref": "product-expectations-remain-recoverable",
            "disposition": "upheld",
            "reason": "Setup gating, availability classes and user confirmations match the distribution specification.",
            "fact_refs": [
              "FACT-PACKAGING-004",
              "FACT-PACKAGING-007"
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
            "reason": "Checking, plan review, apply, ready, conflict, cleanup and blocked states are implemented with narrow actions.",
            "fact_refs": [
              "FACT-PACKAGING-007"
            ],
            "evidence": [
              "arckit/interaction/setup-readiness/interaction.md",
              "runtime/arckit-runtime/desktop/renderer/index.html",
              "runtime/arckit-runtime/desktop/renderer/renderer.js"
            ],
            "gap_refs": []
          },
          {
            "invariant_ref": "visual-language-remains-consistent",
            "disposition": "upheld",
            "reason": "Setup Readiness reuses the Desktop token vocabulary and accepted grayscale interaction projection.",
            "fact_refs": [],
            "evidence": [
              "arckit/interaction/setup-readiness/default.html",
              "runtime/arckit-runtime/desktop/renderer/styles.css",
              "arckit/visual/_library/design-tokens.yaml"
            ],
            "gap_refs": []
          },
          {
            "invariant_ref": "technical-decisions-remain-explainable",
            "disposition": "upheld",
            "reason": "Resource verification, versioned source staging, preview switching, plan freshness, provider writes and Kernel separation are source-visible.",
            "fact_refs": [
              "FACT-PACKAGING-007"
            ],
            "evidence": [
              "arckit/tech/arckit-runtime/installer-supply-chain.md",
              "runtime/arckit-runtime/src/skill-provisioning-manager.mjs",
              "runtime/arckit-runtime/src/automation-coordinator.mjs"
            ],
            "gap_refs": []
          },
          {
            "invariant_ref": "accepted-facts-are-realized",
            "disposition": "upheld",
            "reason": "The complete accepted packaging and Setup provisioning behaviors are implemented and pass packaged-provider smoke evidence.",
            "fact_refs": [
              "FACT-PACKAGING-004",
              "FACT-PACKAGING-006",
              "FACT-PACKAGING-007"
            ],
            "evidence": [
              ".github/workflows/arckit-runtime-package.yml",
              "runtime/arckit-runtime/src/skill-provisioning-manager.mjs",
              "verification: packaged real-provider Setup smoke passed"
            ],
            "gap_refs": []
          },
          {
            "invariant_ref": "material-risks-have-credible-evidence",
            "disposition": "threatened",
            "reason": "Core provisioning and package risks are evidenced, while the final consolidated validation and external signing boundary remain open.",
            "fact_refs": [
              "FACT-PACKAGING-004",
              "FACT-PACKAGING-007"
            ],
            "evidence": [
              "runtime/arckit-runtime/test/skill-provisioning-manager.test.mjs",
              "verification: x64 DMG and packaged Setup smoke passed"
            ],
            "gap_refs": [
              "GAP-INSTALLER-SUPPLY-VALIDATION"
            ]
          }
        ]
      },
      "evidence": [
        "runtime/arckit-runtime/src/skill-provisioning-manager.mjs",
        "runtime/arckit-runtime/test/skill-provisioning-manager.test.mjs",
        "runtime/arckit-runtime/test/desktop-renderer.test.mjs",
        "verification: Runtime 169 tests and packaged real-provider Setup smoke passed"
      ],
      "runtime_result_ref": "",
      "occurred_at": "2026-08-14T06:08:34.313Z"
    },
    {
      "round": 5,
      "transition_schema_version": "arckit-case-transition/v8",
      "goal": "Consolidate reproducible provider, workflow, package-content, Setup provisioning and native installer evidence and close the implementation supply chain.",
      "outcome": "completed",
      "gap_selection": {
        "mode": "candidate",
        "basis": "The integrated installer supply validation gap is the sole ready Case obligation after provider, packaging, and Setup Readiness implementation closed.",
        "snapshot_token": "f723f330a228d468f1737dbb3294423ac94cb49fb3d93b5f1823d1f07f81c50e",
        "selected_ref": "case-gap:CASE-20260814-002:GAP-INSTALLER-SUPPLY-VALIDATION",
        "comparison_summary": "Compared all five Project candidates with the sole ready Case validation gap; complete supply-chain validation directly closes the requested installer work, while the other Project gaps remain independent.",
        "fresh_discovery_summary": "Final review found and repaired the stale macOS ARM runner label, platform-secret injection boundaries, macOS entitlements and notarization verification before accepting the selected gap; no higher-priority fresh gap remains.",
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
            "reason": "This separate real-scenario evaluation does not block installer supply validation."
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
            "reason": "General Runtime resilience and adapter acceptance remain outside this installer Case."
          },
          {
            "ref": "project-gap:GAP-security-real-project-validation",
            "source": "persisted",
            "eligibility": "case_required",
            "disposition": "deferred",
            "priority_basis": {
              "risk": "high",
              "urgency": "medium"
            },
            "reason": "Real controlled-resource validation belongs to a separate permission-bearing project."
          },
          {
            "ref": "project-gap:GAP-delivery-governance",
            "source": "persisted",
            "eligibility": "case_required",
            "disposition": "deferred",
            "priority_basis": {
              "risk": "high",
              "urgency": "high"
            },
            "reason": "This Project-level gap is resolved by the selected Case transition after workflow, drift, package and local acceptance evidence is consolidated."
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
            "reason": "Cross-record audit acceptance is independent of the installer supply chain."
          },
          {
            "ref": "case-gap:CASE-20260814-002:GAP-INSTALLER-SUPPLY-VALIDATION",
            "source": "persisted",
            "eligibility": "ready",
            "disposition": "selected",
            "priority_basis": {
              "blocking": "high",
              "uncertainty": "",
              "risk": "high",
              "user_impact": "high"
            },
            "reason": "Selected as the sole ready Case gap and the final evidence gate for a reproducible installer supply chain."
          }
        ]
      },
      "selected_gap": {
        "id": "GAP-INSTALLER-SUPPLY-VALIDATION",
        "responsibility": "agent",
        "goal": "Demonstrate the installer supply chain is reproducible and safe through complete local/CI validation, package-content inspection and risk-proportionate install smoke evidence.",
        "reason": "Checksums, signing gates, packaged resource paths, cross-repository artifacts and external target writes carry material release risk that configuration presence alone cannot control.",
        "derived_from": [
          "FACT-PACKAGING-004"
        ],
        "blocked_by": [
          "GAP-RUNTIME-PACKAGING-PIPELINE",
          "GAP-RUNTIME-SKILL-PROVISIONING"
        ],
        "priority_basis": {
          "blocking": "high",
          "uncertainty": "",
          "risk": "high",
          "user_impact": "high"
        },
        "evidence_required": [
          "Passing ArcForge and Arckit test suites, workflow/config tests, provider/package checksum evidence, package-content smoke checks and explicit remaining external signing evidence."
        ]
      },
      "planned_transition": {
        "goal": "Consolidate reproducible provider, workflow, package-content, Setup provisioning and native installer evidence and close the implementation supply chain.",
        "expected_state_change": "The final Case gap and threatened impacts become resolved/upheld, delivery governance is accepted for the implemented manually activated pipeline, and the Case advances to Completion Review."
      },
      "accepted_state_delta": {
        "resolved_gap": {
          "id": "GAP-INSTALLER-SUPPLY-VALIDATION",
          "status": "resolved",
          "outcome": "The cross-repository supply chain now has repeatable full-suite, workflow, provider, payload, native package, checksum, packaged-module and Setup convergence evidence with explicit platform signing gates.",
          "reason": "Runtime and ArcForge suites pass, YAML and trigger contracts pass, the exact provider package is checksum-bound, distribution smoke converges without overwriting unrelated skills, and a rebuilt x64 DMG verifies with the expected packaged resources.",
          "evidence": [
            "runtime/arckit-runtime: npm run check (168 passed, 1 optional layout test skipped, 0 failed)",
            "../arcforge: npm run check && npm test (59 passed, 0 failed)",
            "runtime/arckit-runtime/scripts/smoke-distribution.mjs",
            "runtime/arckit-runtime/release/Arckit-Runtime-0.1.0-tf.b1-tf-b1-mac-x64.dmg",
            "hdiutil verify: x64 DMG checksum valid",
            "provider SHA-256 e0b042783347ca9aed736c70d8a5ddd67324b23c2b375d7486a9c2328dc809b4"
          ]
        },
        "facts_added": [
          {
            "id": "FACT-PACKAGING-008",
            "revision": 1,
            "status": "accepted",
            "statement": "The governed Runtime installer supply chain is reproducible through manual existing-tag workflows, exact provider and payload digests, platform-native runner selection, bounded signing/notarization gates, external final-artifact attestations, packaged Setup provisioning smoke and a verified native macOS x64 DMG; live signed GitHub release activation remains an explicit operator action.",
            "basis": "Passing cross-repository suites, workflow/config regressions, stable provider package digest, distribution smoke, packaged-ASAR digest inspection, DMG verification and direct checksum validation.",
            "evidence": [
              ".github/workflows/arckit-runtime-package.yml",
              "../arcforge/.github/workflows/package.yml",
              "runtime/arckit-runtime/test/package-distribution.test.mjs",
              "runtime/arckit-runtime/scripts/smoke-distribution.mjs",
              "../arcforge/tests/provider.test.mjs",
              "verification: native x64 DMG and external artifact checksum passed"
            ]
          }
        ],
        "facts_superseded": [
          {
            "id": "FACT-PACKAGING-001",
            "revision": 1,
            "reason": "The original absence of installer build configuration and a packaging workflow is superseded by the implemented governed supply chain.",
            "evidence": [
              ".github/workflows/arckit-runtime-package.yml",
              "runtime/arckit-runtime/scripts/build-package-config.mjs"
            ]
          }
        ],
        "impacts_added": [],
        "impacts_updated": [
          {
            "id": "IMPACT-PACKAGING-DELIVERY",
            "fact_id": "FACT-PACKAGING-008",
            "fact_revision": 1,
            "target": {
              "kind": "software_decision",
              "ref": "delivery_and_distribution",
              "revision": 3
            },
            "effect": "upheld",
            "reason": "The manually activated provider and Runtime workflows, deterministic package layout, draft-only publication and local installer acceptance realize the governed delivery decision without taking release authorization from the operator.",
            "gap_ids": [],
            "evidence": [
              ".github/workflows/arckit-runtime-package.yml",
              "../arcforge/.github/workflows/package.yml",
              "runtime/arckit-runtime/test/package-distribution.test.mjs"
            ]
          },
          {
            "id": "IMPACT-PACKAGING-RISK",
            "fact_id": "FACT-PACKAGING-008",
            "fact_revision": 1,
            "target": {
              "kind": "software_invariant",
              "ref": "material-risks-have-credible-evidence",
              "revision": null
            },
            "effect": "upheld",
            "reason": "Provider isolation, resource tamper detection, plan freshness, conflict preservation, upgrade rollback, target-native matrices, signing gates, package checksums and native DMG smoke provide risk-proportionate repeatable evidence.",
            "gap_ids": [],
            "evidence": [
              "runtime/arckit-runtime/test/skill-provisioning-manager.test.mjs",
              "runtime/arckit-runtime/test/package-distribution.test.mjs",
              "../arcforge/tests/provider.test.mjs",
              "verification: Runtime and ArcForge full suites passed"
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
        "software_definition_changes": [],
        "software_invariant_changes": [],
        "project_gap_changes": [
          {
            "action": "resolve",
            "gap_id": "GAP-delivery-governance",
            "reason": "The requested application-target synchronization, drift validation and installer supply acceptance are implemented and locally evidenced; creating tags, providing signing credentials and dispatching a real release remain intentional operator-controlled release actions, not missing pipeline implementation.",
            "evidence": [
              ".github/workflows/arckit-runtime-package.yml",
              "../arcforge/.github/workflows/package.yml",
              "runtime/arckit-runtime/scripts/smoke-distribution.mjs",
              "verification: native macOS x64 DMG passed"
            ]
          }
        ],
        "selection_context_change": null,
        "evidence": [
          "CASE-20260814-002 installer supply-chain implementation and validation evidence"
        ]
      },
      "invariant_assessment": {
        "project_revision": 51,
        "judgments": [
          {
            "invariant_ref": "product-expectations-remain-recoverable",
            "disposition": "upheld",
            "reason": "The distribution scope, manual release ownership, availability modes and complete user setup outcome remain explicit and tested.",
            "fact_refs": [
              "FACT-PACKAGING-004",
              "FACT-PACKAGING-008"
            ],
            "evidence": [
              "arckit/spec/arckit-runtime-distribution.md",
              "runtime/arckit-runtime/test/package-distribution.test.mjs"
            ],
            "gap_refs": []
          },
          {
            "invariant_ref": "interaction-expectations-remain-recoverable",
            "disposition": "upheld",
            "reason": "Setup Readiness states, confirmations, conflict recovery and task gating remain documented and implemented.",
            "fact_refs": [
              "FACT-PACKAGING-007",
              "FACT-PACKAGING-008"
            ],
            "evidence": [
              "arckit/interaction/setup-readiness/interaction.md",
              "runtime/arckit-runtime/test/desktop-renderer.test.mjs"
            ],
            "gap_refs": []
          },
          {
            "invariant_ref": "visual-language-remains-consistent",
            "disposition": "upheld",
            "reason": "The Setup surface continues to use the existing Desktop token and component vocabulary.",
            "fact_refs": [],
            "evidence": [
              "arckit/interaction/setup-readiness/default.html",
              "runtime/arckit-runtime/desktop/renderer/styles.css"
            ],
            "gap_refs": []
          },
          {
            "invariant_ref": "technical-decisions-remain-explainable",
            "disposition": "upheld",
            "reason": "Provider API, state isolation, resource layout, plan/apply boundary, release trigger and signature gates are durable in source and technical documentation.",
            "fact_refs": [
              "FACT-PACKAGING-004",
              "FACT-PACKAGING-008"
            ],
            "evidence": [
              "arckit/tech/arckit-runtime/installer-supply-chain.md",
              "../arcforge/src/provider/index.ts",
              ".github/workflows/arckit-runtime-package.yml"
            ],
            "gap_refs": []
          },
          {
            "invariant_ref": "accepted-facts-are-realized",
            "disposition": "upheld",
            "reason": "The accepted provider, packaging and Setup Readiness facts are realized in both repositories and in a rebuilt native installer.",
            "fact_refs": [
              "FACT-PACKAGING-004",
              "FACT-PACKAGING-005",
              "FACT-PACKAGING-006",
              "FACT-PACKAGING-007",
              "FACT-PACKAGING-008"
            ],
            "evidence": [
              "../arcforge/src/provider/index.ts",
              "runtime/arckit-runtime/src/skill-provisioning-manager.mjs",
              "runtime/arckit-runtime/release/Arckit-Runtime-0.1.0-tf.b1-tf-b1-mac-x64.dmg"
            ],
            "gap_refs": []
          },
          {
            "invariant_ref": "material-risks-have-credible-evidence",
            "disposition": "upheld",
            "reason": "Repeatable full suites, exact digests, package-content smoke, conflict/rollback tests, platform matrix assertions, signature gates and native DMG verification proportionately cover the implemented supply risks.",
            "fact_refs": [
              "FACT-PACKAGING-007",
              "FACT-PACKAGING-008"
            ],
            "evidence": [
              "runtime/arckit-runtime: npm run check",
              "../arcforge: npm run check && npm test",
              "runtime/arckit-runtime/scripts/smoke-distribution.mjs",
              "hdiutil verify: x64 DMG valid"
            ],
            "gap_refs": []
          }
        ]
      },
      "evidence": [
        "Runtime check: 168 passed, 1 optional Electron layout test skipped, 0 failed",
        "ArcForge check and tests: 59 passed, 0 failed",
        "Workflow YAML and manual-only contract tests passed",
        "Distribution smoke installed 12 user skills, deferred one project skill, preserved an unrelated skill and converged to 13 same items",
        "Native macOS x64 DMG, packaged Setup module digest and external installer checksum verified",
        "git diff --check passed in both repositories"
      ],
      "runtime_result_ref": "",
      "occurred_at": "2026-08-14T06:24:02.513Z"
    },
    {
      "round": 6,
      "transition_schema_version": "arckit-case-transition/v8",
      "goal": "Review content revision 5 across implementation correctness, problem resolution, verification credibility, regression risk and minimality.",
      "outcome": "completed",
      "gap_selection": {
        "mode": "candidate",
        "basis": "All ordinary Case gaps and impacts are closed, so the deterministic five-dimension Completion Review is the sole ready Case obligation.",
        "snapshot_token": "cf346d69ab2ac1c92b274f056e1f5f13f5c4617b4252a265a7bbe939d556a6de",
        "selected_ref": "case-gap:CASE-20260814-002:CASE-20260814-002:completion-review:1",
        "comparison_summary": "Compared the four remaining independent Project candidates with the sole Case Completion Review; none represents unfinished work inside this installer Case.",
        "fresh_discovery_summary": "A final source, workflow, package, documentation, boundary and validation audit found no unresolved error, omission or excess after the Round 5 runner/signing corrections.",
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
            "reason": "Independent state-loop evaluation is not unfinished installer work."
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
            "reason": "General Runtime resilience remains outside this completed supply-chain scope."
          },
          {
            "ref": "project-gap:GAP-security-real-project-validation",
            "source": "persisted",
            "eligibility": "case_required",
            "disposition": "deferred",
            "priority_basis": {
              "risk": "high",
              "urgency": "medium"
            },
            "reason": "A separate permission-bearing project is required and is not an installer omission."
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
            "reason": "Cross-record audit acceptance is independent of the completed distribution work."
          },
          {
            "ref": "case-gap:CASE-20260814-002:CASE-20260814-002:completion-review:1",
            "source": "persisted",
            "eligibility": "ready",
            "disposition": "selected",
            "priority_basis": {
              "blocking": "high",
              "uncertainty": "low",
              "risk": "high",
              "user_impact": "high"
            },
            "reason": "Selected as the sole ready Case obligation and final semantic quality gate."
          }
        ]
      },
      "selected_gap": {
        "id": "CASE-20260814-002:completion-review:1",
        "responsibility": "agent",
        "goal": "Review the completed implementation for correctness, real problem resolution, verification credibility, regression risk, and minimality.",
        "reason": "All ordinary Case gaps and state impacts are closed.",
        "derived_from": [
          "case_result",
          "content_revision:5"
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
        "goal": "Review content revision 5 across implementation correctness, problem resolution, verification credibility, regression risk and minimality.",
        "expected_state_change": "Completion Review becomes clean and the Case closes as resolved without any content mutation."
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
          "reviewed_content_revision": 5,
          "dimensions": {
            "implementation_correctness": "clean",
            "problem_resolution": "clean",
            "verification_credibility": "clean",
            "regression_risk": "clean",
            "minimality": "clean"
          },
          "findings": [],
          "evidence": [
            "Implementation correctness: Runtime check passed 168 tests with one explicit optional layout skip and ArcForge passed 59 tests.",
            "Problem resolution: manual existing-tag workflows build target-native installers with exact provider digest and complete Setup Readiness provisioning.",
            "Verification credibility: YAML, release-trigger, platform config, real provider, distribution smoke, packaged-ASAR digest, DMG and external checksum checks passed.",
            "Regression risk: Setup preserves unrelated skills, blocks conflicts/tampering, rolls back failed upgrades and keeps provisioning outside the Runtime Kernel.",
            "Minimality: Runtime embeds only the stable ArcForge provider and on-demand loader, defers project-scoped skill installation, never creates tags and leaves live release authorization to the operator.",
            "git diff --check passed in both repositories."
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
        "project_revision": 52,
        "judgments": [
          {
            "invariant_ref": "product-expectations-remain-recoverable",
            "disposition": "upheld",
            "reason": "The final reviewed product outcome and operator release boundary remain explicit and recoverable.",
            "fact_refs": [
              "FACT-PACKAGING-004",
              "FACT-PACKAGING-008"
            ],
            "evidence": [
              "arckit/spec/arckit-runtime-distribution.md",
              "runtime/arckit-runtime/README.md"
            ],
            "gap_refs": []
          },
          {
            "invariant_ref": "interaction-expectations-remain-recoverable",
            "disposition": "upheld",
            "reason": "The reviewed Setup Readiness interaction and narrow confirmation/recovery states are complete.",
            "fact_refs": [
              "FACT-PACKAGING-007",
              "FACT-PACKAGING-008"
            ],
            "evidence": [
              "arckit/interaction/setup-readiness/interaction.md",
              "runtime/arckit-runtime/test/desktop-renderer.test.mjs"
            ],
            "gap_refs": []
          },
          {
            "invariant_ref": "visual-language-remains-consistent",
            "disposition": "upheld",
            "reason": "Completion review found no inconsistent visual vocabulary or unnecessary alternate surface.",
            "fact_refs": [],
            "evidence": [
              "arckit/interaction/setup-readiness/default.html",
              "runtime/arckit-runtime/desktop/renderer/styles.css"
            ],
            "gap_refs": []
          },
          {
            "invariant_ref": "technical-decisions-remain-explainable",
            "disposition": "upheld",
            "reason": "The final provider, package, signing, state isolation and Runtime boundary remain source-visible and documented.",
            "fact_refs": [
              "FACT-PACKAGING-004",
              "FACT-PACKAGING-005",
              "FACT-PACKAGING-008"
            ],
            "evidence": [
              "arckit/tech/arckit-runtime/installer-supply-chain.md",
              "../arcforge/src/provider/index.ts",
              ".github/workflows/arckit-runtime-package.yml"
            ],
            "gap_refs": []
          },
          {
            "invariant_ref": "accepted-facts-are-realized",
            "disposition": "upheld",
            "reason": "Completion review confirms the accepted supply-chain facts are realized without a silent feature or release-ownership gap.",
            "fact_refs": [
              "FACT-PACKAGING-004",
              "FACT-PACKAGING-005",
              "FACT-PACKAGING-006",
              "FACT-PACKAGING-007",
              "FACT-PACKAGING-008"
            ],
            "evidence": [
              "runtime/arckit-runtime/src/skill-provisioning-manager.mjs",
              "../arcforge/src/provider/index.ts",
              "runtime/arckit-runtime/test/package-distribution.test.mjs"
            ],
            "gap_refs": []
          },
          {
            "invariant_ref": "material-risks-have-credible-evidence",
            "disposition": "upheld",
            "reason": "The clean review confirms the evidence is repeatable and proportionate, with live signing correctly bounded as a future operator action.",
            "fact_refs": [
              "FACT-PACKAGING-007",
              "FACT-PACKAGING-008"
            ],
            "evidence": [
              "Runtime full check",
              "ArcForge full check and tests",
              "distribution smoke",
              "native x64 DMG verification",
              "external checksum verification"
            ],
            "gap_refs": []
          }
        ]
      },
      "evidence": [
        "Five-dimension Completion Review for content_revision=5 is clean.",
        "Runtime: 168 passed, 1 optional layout skip, 0 failed.",
        "ArcForge: 59 passed, 0 failed.",
        "Manual workflow, provider digest, packaged resources, Setup convergence, DMG and checksum evidence reviewed.",
        "No unnecessary full ArcForge embedding, automatic tag mutation or Runtime Kernel skill routing was introduced."
      ],
      "runtime_result_ref": "",
      "occurred_at": "2026-08-14T06:25:46.308Z"
    }
  ],
  "case_resolution": {
    "status": "resolved",
    "stage": "resolved",
    "satisfied": [
      "GAP-PACKAGING-CONTRACT",
      "GAP-ARCFORGE-EMBEDDED-PROVIDER",
      "GAP-RUNTIME-PACKAGING-PIPELINE",
      "GAP-RUNTIME-SKILL-PROVISIONING",
      "GAP-INSTALLER-SUPPLY-VALIDATION"
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
    "updated_at": "2026-08-14T06:25:46.308Z"
  }
}
```

## Round Notes

- Case history is canonical in Structured Record.rounds; keep prose notes exceptional.
