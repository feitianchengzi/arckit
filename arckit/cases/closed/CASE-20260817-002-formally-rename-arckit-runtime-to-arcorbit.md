# Formally rename arckit-runtime to ArcOrbit

Case: CASE-20260817-002
Status: closed
Artifact Type: mixed
Selected Gap: none
Updated: 2026-08-17T12:41:29.749Z

## User Intent

Formally rename the arckit-runtime product and runtime surface to ArcOrbit across its durable contracts and realized software identity.

## Structured Record

```json
{
  "schema_version": "development-case-record/v5",
  "id": "CASE-20260817-002",
  "title": "Formally rename arckit-runtime to ArcOrbit",
  "status": "closed",
  "artifact_type": "mixed",
  "created_at": "2026-08-17T10:13:35.390Z",
  "updated_at": "2026-08-17T12:41:29.749Z",
  "user_intent": "Formally rename the arckit-runtime product and runtime surface to ArcOrbit across its durable contracts and realized software identity.",
  "expected_outcome": "ArcOrbit is the coherent public product identity for the former arckit-runtime, with explicit compatibility boundaries, updated durable specifications and implementation identifiers, verified packaging/runtime behavior, and no unintended changes to the Arckit protocol or ArcForge identity.",
  "project_state_ref": "arckit/project/state.record.json",
  "current_round": {
    "goal": "",
    "selected_gap": null
  },
  "facts": [
    {
      "id": "FACT-ARCORBIT-RENAME-REQUEST",
      "revision": 1,
      "status": "accepted",
      "statement": "The maintainer has decided that arckit-runtime is to be formally renamed ArcOrbit.",
      "basis": "Explicit user request in the current conversation.",
      "evidence": [
        "Current user request dated 2026-08-17"
      ]
    },
    {
      "id": "FACT-ARCORBIT-NAMING-CONTRACT",
      "revision": 1,
      "status": "accepted",
      "statement": "ArcOrbit is the formal product name for the supervised Arckit Desktop/Runtime. Its canonical repository and distribution locators are runtime/arcorbit, @arckit/arcorbit, bin/arcorbit.mjs and arcorbit, .github/workflows/arcorbit-package.yml, Resources/arcorbit, ArcOrbit-* installer names, and arcorbit-* Actions artifacts. Arckit and ArcForge retain their existing product and protocol identities.",
      "basis": "The user rename decision has been resolved into an explicit product and technical identity table in authoritative specification and supply-chain evidence.",
      "evidence": [
        "arckit/spec/arckit-runtime-distribution.md",
        "arckit/spec/INDEX.md",
        "arckit/tech/arckit-runtime/installer-supply-chain.md",
        "arckit/tech/INDEX.md"
      ]
    },
    {
      "id": "FACT-ARCORBIT-COMPATIBILITY-CONTRACT",
      "revision": 1,
      "status": "accepted",
      "statement": "ArcOrbit retains com.feitianchengzi.arckit.runtime, Workshop app_id arckit-runtime, published arckit-runtime-* schema identifiers, arckit-runtime://runs opaque references, immutable historical records, and an arckit-runtime CLI alias as compatibility identities; current user-visible branding and new artifacts do not use the historical product name.",
      "basis": "These values bind existing platform data, remote service identity, persisted protocol records, historical evidence, or caller scripts and are explicitly separated from current branding.",
      "evidence": [
        "arckit/spec/arckit-runtime-distribution.md",
        "arckit/spec/INDEX.md",
        "arckit/tech/arckit-runtime/installer-supply-chain.md",
        "arckit/tech/INDEX.md"
      ]
    },
    {
      "id": "FACT-ARCORBIT-CURRENT-IDENTITY-INVENTORY",
      "revision": 1,
      "status": "accepted",
      "statement": "Before realization, the live repository component is located at runtime/arckit-runtime, uses package @arckit/runtime, the arckit-runtime bin, Arckit Runtime product labels, Arckit-Runtime installer names, the arckit-runtime packaging workflow, and an arckit-runtime embedded resource root across source, tests, documentation and configuration.",
      "basis": "Tracked-file search and direct inspection of package, Electron builder, distribution assembly, CLI, Desktop, workflow and authoritative documentation sources agree.",
      "evidence": [
        "runtime/arckit-runtime/package.json",
        "runtime/arckit-runtime/scripts/build-package-config.mjs",
        "runtime/arckit-runtime/scripts/prepare-distribution.mjs",
        "runtime/arckit-runtime/src/cli.mjs",
        ".github/workflows/arckit-runtime-package.yml",
        "README.md",
        "AGENTS.md"
      ]
    },
    {
      "id": "FACT-ARCORBIT-REALIZED",
      "revision": 1,
      "status": "accepted",
      "statement": "The tracked live product is realized as ArcOrbit at runtime/arcorbit with package @arckit/arcorbit, canonical arcorbit CLI and executable, ArcOrbit Desktop labels and artifacts, arcorbit workflow and embedded resource root; the legacy arckit-runtime CLI and resource-read fallback plus stable external and protocol identifiers remain intact.",
      "basis": "Repository-wide implementation, current documentation, focused compatibility tests, distribution assembly and the complete Runtime check agree.",
      "evidence": [
        "runtime/arcorbit/package.json",
        "runtime/arcorbit/src/cli.mjs",
        "runtime/arcorbit/scripts/build-package-config.mjs",
        "runtime/arcorbit/src/capability-registry.mjs",
        "arckit/spec/arcorbit-distribution.md",
        "arckit/tech/arcorbit/installer-supply-chain.md",
        ".github/workflows/arcorbit-package.yml",
        "verification: npm run check in runtime/arcorbit passed"
      ]
    }
  ],
  "state_impacts": [
    {
      "id": "IMPACT-ARCORBIT-PRODUCT-IDENTITY",
      "fact_id": "FACT-ARCORBIT-RENAME-REQUEST",
      "fact_revision": 1,
      "target": {
        "kind": "software_decision",
        "ref": "product_intent_and_scope",
        "revision": 2
      },
      "effect": "upheld",
      "reason": "The Project product-scope decision now distinguishes Arckit protocol and skill governance from the formally named ArcOrbit supervised product.",
      "gap_ids": [],
      "evidence": [
        "arckit/spec/arckit-runtime-distribution.md",
        "arckit/spec/INDEX.md",
        "arckit/tech/arckit-runtime/installer-supply-chain.md",
        "arckit/tech/INDEX.md"
      ]
    },
    {
      "id": "IMPACT-ARCORBIT-RUNTIME-SURFACE",
      "fact_id": "FACT-ARCORBIT-NAMING-CONTRACT",
      "fact_revision": 1,
      "target": {
        "kind": "software_decision",
        "ref": "runtime_surfaces",
        "revision": 3
      },
      "effect": "upheld",
      "reason": "The runtime surface decision now identifies ArcOrbit and preserves its boundary from Arckit skills, ledger CLIs and ArcForge.",
      "gap_ids": [],
      "evidence": [
        "arckit/spec/arckit-runtime-distribution.md",
        "arckit/spec/INDEX.md",
        "arckit/tech/arckit-runtime/installer-supply-chain.md",
        "arckit/tech/INDEX.md"
      ]
    },
    {
      "id": "IMPACT-ARCORBIT-REALIZATION",
      "fact_id": "FACT-ARCORBIT-REALIZED",
      "fact_revision": 1,
      "target": {
        "kind": "software_invariant",
        "ref": "accepted-facts-are-realized",
        "revision": null
      },
      "effect": "upheld",
      "reason": "Source, current projections, build metadata and runtime behavior now realize the accepted ArcOrbit contract.",
      "gap_ids": [],
      "evidence": [
        "runtime/arcorbit/package.json",
        "runtime/arcorbit/desktop/renderer/index.html",
        ".github/workflows/arcorbit-package.yml",
        "verification: npm run check in runtime/arcorbit passed"
      ]
    },
    {
      "id": "IMPACT-ARCORBIT-MIGRATION-RISK",
      "fact_id": "FACT-ARCORBIT-COMPATIBILITY-CONTRACT",
      "fact_revision": 1,
      "target": {
        "kind": "software_invariant",
        "ref": "material-risks-have-credible-evidence",
        "revision": null
      },
      "effect": "upheld",
      "reason": "Regression tests prove canonical identity, legacy CLI alias, legacy resource fallback and stable app, service, schema and run-reference identifiers while distribution assembly uses the new resource and artifact identities.",
      "gap_ids": [],
      "evidence": [
        "runtime/arcorbit/test/package-distribution.test.mjs",
        "runtime/arcorbit/test/capability-policy.test.mjs",
        "runtime/arcorbit/test/runtime-record-ref.test.mjs",
        "runtime/arcorbit/test/task-source-adapter.test.mjs",
        "verification: npm run check in runtime/arcorbit passed"
      ]
    }
  ],
  "gaps": [
    {
      "id": "GAP-ARCORBIT-NAMING-CONTRACT",
      "status": "resolved",
      "goal": "Establish the authoritative ArcOrbit naming contract, including which public names and technical identifiers replace arckit-runtime and which Arckit, protocol, historical, or compatibility identifiers remain unchanged.",
      "reason": "The requested formal rename is accepted, but the exact identity mapping and compatibility boundary must be established before repository-wide specification or implementation changes can be scoped safely.",
      "derived_from": [
        "FACT-ARCORBIT-RENAME-REQUEST"
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
        "Authoritative current product, technical, package, executable, storage, protocol, workflow, and documentation identity evidence sufficient to define the rename boundary without erasing historical or compatibility semantics."
      ],
      "resolution": {
        "id": "GAP-ARCORBIT-NAMING-CONTRACT",
        "status": "resolved",
        "outcome": "ArcOrbit is the formal supervised Desktop/Runtime product identity. New source and distribution locators use runtime/arcorbit, @arckit/arcorbit, arcorbit, ArcOrbit artifacts, the arcorbit workflow and resource root; the legacy CLI remains an alias, while the existing Electron appId, Workshop app_id, published arckit-runtime schema/URI identifiers and immutable history remain stable.",
        "reason": "The explicit user decision, current identity inventory, product specification and technical supply-chain contract agree on a complete mapping that separates brand and migratable locators from persistent compatibility identities.",
        "evidence": [
          "arckit/spec/arckit-runtime-distribution.md",
          "arckit/spec/INDEX.md",
          "arckit/tech/arckit-runtime/installer-supply-chain.md",
          "arckit/tech/INDEX.md"
        ],
        "occurred_at": "2026-08-17T10:18:42.877Z"
      }
    },
    {
      "id": "GAP-ARCORBIT-REALIZATION",
      "status": "resolved",
      "goal": "Realize the accepted ArcOrbit identity across live repository source, current documentation, UI labels, package and CLI metadata, repository paths, build workflow, resource layout, fixtures, and verification while preserving every declared compatibility identifier and legacy CLI alias.",
      "reason": "The authoritative naming contract is now explicit, but the tracked implementation and most current references still use the historical arckit-runtime product and locator identities.",
      "derived_from": [
        "FACT-ARCORBIT-RENAME-REQUEST",
        "FACT-ARCORBIT-NAMING-CONTRACT",
        "FACT-ARCORBIT-CURRENT-IDENTITY-INVENTORY"
      ],
      "blocked_by": [
        "GAP-ARCORBIT-NAMING-CONTRACT"
      ],
      "priority_basis": {
        "blocking": "high",
        "uncertainty": "medium",
        "risk": "high",
        "user_impact": "high"
      },
      "responsibility": "agent",
      "evidence_required": [
        "Tracked live-source inventory showing canonical ArcOrbit names and only contract-approved legacy identifiers outside immutable history.",
        "Automated verification of ArcOrbit package, CLI plus legacy alias, Desktop labels, workflow, artifacts, canonical resource layout plus legacy read fallback, and stable schema/URI/bundle/app identities.",
        "Complete ArcOrbit Runtime check and risk-proportionate distribution assembly or packaging evidence."
      ],
      "resolution": {
        "id": "GAP-ARCORBIT-REALIZATION",
        "status": "resolved",
        "outcome": "The live component is now ArcOrbit across repository path, @arckit/arcorbit package, arcorbit CLI and executable, workflow, resources, installers, Desktop labels, current documentation and fixtures, while the declared legacy CLI, resource-read, schema, URI, bundle and Workshop identities remain compatible.",
        "reason": "Canonical source and documentation inventory is consistent, focused rename and compatibility tests pass, distribution assembly passes, and the complete ArcOrbit Runtime check has no failures.",
        "evidence": [
          "runtime/arcorbit/package.json",
          "runtime/arcorbit/scripts/build-package-config.mjs",
          "runtime/arcorbit/scripts/prepare-distribution.mjs",
          "runtime/arcorbit/src/capability-registry.mjs",
          "runtime/arcorbit/test/package-distribution.test.mjs",
          "runtime/arcorbit/test/capability-policy.test.mjs",
          ".github/workflows/arcorbit-package.yml",
          "verification: npm run check in runtime/arcorbit passed 194 tests with 1 environment skip and 0 failures"
        ],
        "occurred_at": "2026-08-17T12:39:56.850Z"
      }
    }
  ],
  "content_revision": 2,
  "completion_review": {
    "status": "clean",
    "policy": {
      "initial_max_cycles": 3,
      "source": "runtime/arckit-runtime/config/case-policy.json",
      "snapshotted_at": "2026-08-17T10:13:35.390Z"
    },
    "additional_cycles_authorized": 0,
    "cycle_count": 1,
    "reviewed_content_revision": 2,
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
        "content_revision": 2,
        "dimensions": {
          "implementation_correctness": "clean",
          "problem_resolution": "clean",
          "verification_credibility": "clean",
          "regression_risk": "clean",
          "minimality": "clean"
        },
        "finding_ids": [],
        "evidence": [
          "runtime/arcorbit/package.json",
          "runtime/arcorbit/scripts/build-package-config.mjs",
          "runtime/arcorbit/src/capability-registry.mjs",
          "runtime/arcorbit/test/package-distribution.test.mjs",
          "runtime/arcorbit/test/capability-policy.test.mjs",
          "arckit/spec/arcorbit-distribution.md",
          "arckit/tech/arcorbit/installer-supply-chain.md",
          "verification: canonical path and stale-current-locator inventory passed",
          "verification: arcorbit CLI help exposes the canonical command",
          "verification: focused identity and compatibility suite passed 41 tests",
          "verification: npm run check in runtime/arcorbit passed 194 tests with 1 environment skip and 0 failures",
          "verification: git diff --check passed"
        ],
        "occurred_at": "2026-08-17T12:41:29.749Z"
      }
    ],
    "evidence": [
      "runtime/arcorbit/package.json",
      "runtime/arcorbit/scripts/build-package-config.mjs",
      "runtime/arcorbit/src/capability-registry.mjs",
      "runtime/arcorbit/test/package-distribution.test.mjs",
      "runtime/arcorbit/test/capability-policy.test.mjs",
      "arckit/spec/arcorbit-distribution.md",
      "arckit/tech/arcorbit/installer-supply-chain.md",
      "verification: canonical path and stale-current-locator inventory passed",
      "verification: arcorbit CLI help exposes the canonical command",
      "verification: focused identity and compatibility suite passed 41 tests",
      "verification: npm run check in runtime/arcorbit passed 194 tests with 1 environment skip and 0 failures",
      "verification: git diff --check passed"
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
      "goal": "Establish and durably record one exact ArcOrbit product, technical-locator, and compatibility-identity contract.",
      "outcome": "completed",
      "gap_selection": {
        "mode": "candidate",
        "basis": "The persisted naming-contract Gap is the only ready Case obligation and blocks every safe implementation change required by the explicit rename request.",
        "snapshot_token": "9ab6c8aa07d08a0a3beb2d027081f739b4789d552698f093ebe34f85d95195c3",
        "selected_ref": "case-gap:CASE-20260817-002:GAP-ARCORBIT-NAMING-CONTRACT",
        "comparison_summary": "Compared all four Project-level obligations with the ready rename Case Gap; the Project gaps remain independent and the naming contract has the highest direct user relevance, blocking value, and migration-risk reduction.",
        "fresh_discovery_summary": "Repository identity evidence exposed a downstream realization obligation, but it depends on the naming contract being accepted and is therefore recorded rather than executed in this round.",
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
            "reason": "Important project validation remains, but it does not define or unblock the explicit ArcOrbit rename."
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
            "reason": "Runtime resilience is independent of the product-identity decision and can continue after the rename Case."
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
            "reason": "The permission-bearing validation scenario is unrelated to establishing the rename contract."
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
            "reason": "Cross-record auditing remains valuable but is not a prerequisite for the current explicit product naming decision."
          },
          {
            "ref": "case-gap:CASE-20260817-002:GAP-ARCORBIT-NAMING-CONTRACT",
            "source": "persisted",
            "eligibility": "ready",
            "disposition": "selected",
            "priority_basis": {
              "blocking": "high",
              "uncertainty": "high",
              "risk": "high",
              "user_impact": "high"
            },
            "reason": "It is the only ready Case Gap and must settle exact rename and compatibility boundaries before repository migration."
          }
        ]
      },
      "selected_gap": {
        "id": "GAP-ARCORBIT-NAMING-CONTRACT",
        "responsibility": "agent",
        "goal": "Establish the authoritative ArcOrbit naming contract, including which public names and technical identifiers replace arckit-runtime and which Arckit, protocol, historical, or compatibility identifiers remain unchanged.",
        "reason": "The requested formal rename is accepted, but the exact identity mapping and compatibility boundary must be established before repository-wide specification or implementation changes can be scoped safely.",
        "derived_from": [
          "FACT-ARCORBIT-RENAME-REQUEST"
        ],
        "blocked_by": [],
        "priority_basis": {
          "blocking": "high",
          "uncertainty": "high",
          "risk": "high",
          "user_impact": "high"
        },
        "evidence_required": [
          "Authoritative current product, technical, package, executable, storage, protocol, workflow, and documentation identity evidence sufficient to define the rename boundary without erasing historical or compatibility semantics."
        ]
      },
      "planned_transition": {
        "goal": "Establish and durably record one exact ArcOrbit product, technical-locator, and compatibility-identity contract.",
        "expected_state_change": "The naming ambiguity is resolved in authoritative product and technical evidence, related Project decisions are current, and implementation work is represented by a separate open realization Gap."
      },
      "accepted_state_delta": {
        "resolved_gap": {
          "id": "GAP-ARCORBIT-NAMING-CONTRACT",
          "status": "resolved",
          "outcome": "ArcOrbit is the formal supervised Desktop/Runtime product identity. New source and distribution locators use runtime/arcorbit, @arckit/arcorbit, arcorbit, ArcOrbit artifacts, the arcorbit workflow and resource root; the legacy CLI remains an alias, while the existing Electron appId, Workshop app_id, published arckit-runtime schema/URI identifiers and immutable history remain stable.",
          "reason": "The explicit user decision, current identity inventory, product specification and technical supply-chain contract agree on a complete mapping that separates brand and migratable locators from persistent compatibility identities.",
          "evidence": [
            "arckit/spec/arckit-runtime-distribution.md",
            "arckit/spec/INDEX.md",
            "arckit/tech/arckit-runtime/installer-supply-chain.md",
            "arckit/tech/INDEX.md"
          ]
        },
        "facts_added": [
          {
            "id": "FACT-ARCORBIT-NAMING-CONTRACT",
            "revision": 1,
            "status": "accepted",
            "statement": "ArcOrbit is the formal product name for the supervised Arckit Desktop/Runtime. Its canonical repository and distribution locators are runtime/arcorbit, @arckit/arcorbit, bin/arcorbit.mjs and arcorbit, .github/workflows/arcorbit-package.yml, Resources/arcorbit, ArcOrbit-* installer names, and arcorbit-* Actions artifacts. Arckit and ArcForge retain their existing product and protocol identities.",
            "basis": "The user rename decision has been resolved into an explicit product and technical identity table in authoritative specification and supply-chain evidence.",
            "evidence": [
              "arckit/spec/arckit-runtime-distribution.md",
              "arckit/spec/INDEX.md",
              "arckit/tech/arckit-runtime/installer-supply-chain.md",
              "arckit/tech/INDEX.md"
            ]
          },
          {
            "id": "FACT-ARCORBIT-COMPATIBILITY-CONTRACT",
            "revision": 1,
            "status": "accepted",
            "statement": "ArcOrbit retains com.feitianchengzi.arckit.runtime, Workshop app_id arckit-runtime, published arckit-runtime-* schema identifiers, arckit-runtime://runs opaque references, immutable historical records, and an arckit-runtime CLI alias as compatibility identities; current user-visible branding and new artifacts do not use the historical product name.",
            "basis": "These values bind existing platform data, remote service identity, persisted protocol records, historical evidence, or caller scripts and are explicitly separated from current branding.",
            "evidence": [
              "arckit/spec/arckit-runtime-distribution.md",
              "arckit/spec/INDEX.md",
              "arckit/tech/arckit-runtime/installer-supply-chain.md",
              "arckit/tech/INDEX.md"
            ]
          },
          {
            "id": "FACT-ARCORBIT-CURRENT-IDENTITY-INVENTORY",
            "revision": 1,
            "status": "accepted",
            "statement": "Before realization, the live repository component is located at runtime/arckit-runtime, uses package @arckit/runtime, the arckit-runtime bin, Arckit Runtime product labels, Arckit-Runtime installer names, the arckit-runtime packaging workflow, and an arckit-runtime embedded resource root across source, tests, documentation and configuration.",
            "basis": "Tracked-file search and direct inspection of package, Electron builder, distribution assembly, CLI, Desktop, workflow and authoritative documentation sources agree.",
            "evidence": [
              "runtime/arckit-runtime/package.json",
              "runtime/arckit-runtime/scripts/build-package-config.mjs",
              "runtime/arckit-runtime/scripts/prepare-distribution.mjs",
              "runtime/arckit-runtime/src/cli.mjs",
              ".github/workflows/arckit-runtime-package.yml",
              "README.md",
              "AGENTS.md"
            ]
          }
        ],
        "facts_superseded": [],
        "impacts_added": [
          {
            "id": "IMPACT-ARCORBIT-RUNTIME-SURFACE",
            "fact_id": "FACT-ARCORBIT-NAMING-CONTRACT",
            "fact_revision": 1,
            "target": {
              "kind": "software_decision",
              "ref": "runtime_surfaces",
              "revision": 3
            },
            "effect": "upheld",
            "reason": "The runtime surface decision now identifies ArcOrbit and preserves its boundary from Arckit skills, ledger CLIs and ArcForge.",
            "gap_ids": [],
            "evidence": [
              "arckit/spec/arckit-runtime-distribution.md",
              "arckit/spec/INDEX.md",
              "arckit/tech/arckit-runtime/installer-supply-chain.md",
              "arckit/tech/INDEX.md"
            ]
          },
          {
            "id": "IMPACT-ARCORBIT-REALIZATION",
            "fact_id": "FACT-ARCORBIT-CURRENT-IDENTITY-INVENTORY",
            "fact_revision": 1,
            "target": {
              "kind": "software_invariant",
              "ref": "accepted-facts-are-realized",
              "revision": null
            },
            "effect": "threatened",
            "reason": "The accepted contract is not yet realized because live source, UI, build, paths and current documentation still carry the historical product identity.",
            "gap_ids": [
              "GAP-ARCORBIT-REALIZATION"
            ],
            "evidence": [
              "runtime/arckit-runtime/package.json",
              "runtime/arckit-runtime/scripts/build-package-config.mjs",
              ".github/workflows/arckit-runtime-package.yml"
            ]
          },
          {
            "id": "IMPACT-ARCORBIT-MIGRATION-RISK",
            "fact_id": "FACT-ARCORBIT-COMPATIBILITY-CONTRACT",
            "fact_revision": 1,
            "target": {
              "kind": "software_invariant",
              "ref": "material-risks-have-credible-evidence",
              "revision": null
            },
            "effect": "undetermined",
            "reason": "The contract defines the compatibility boundary, but no implementation and regression evidence yet proves that the rename preserves stable installation, service and protocol identities.",
            "gap_ids": [
              "GAP-ARCORBIT-REALIZATION"
            ],
            "evidence": [
              "arckit/spec/arckit-runtime-distribution.md",
              "arckit/spec/INDEX.md",
              "arckit/tech/arckit-runtime/installer-supply-chain.md",
              "arckit/tech/INDEX.md"
            ]
          }
        ],
        "impacts_updated": [
          {
            "id": "IMPACT-ARCORBIT-PRODUCT-IDENTITY",
            "fact_id": "FACT-ARCORBIT-RENAME-REQUEST",
            "fact_revision": 1,
            "target": {
              "kind": "software_decision",
              "ref": "product_intent_and_scope",
              "revision": 2
            },
            "effect": "upheld",
            "reason": "The Project product-scope decision now distinguishes Arckit protocol and skill governance from the formally named ArcOrbit supervised product.",
            "gap_ids": [],
            "evidence": [
              "arckit/spec/arckit-runtime-distribution.md",
              "arckit/spec/INDEX.md",
              "arckit/tech/arckit-runtime/installer-supply-chain.md",
              "arckit/tech/INDEX.md"
            ]
          }
        ],
        "gaps_added": [
          {
            "id": "GAP-ARCORBIT-REALIZATION",
            "status": "open",
            "goal": "Realize the accepted ArcOrbit identity across live repository source, current documentation, UI labels, package and CLI metadata, repository paths, build workflow, resource layout, fixtures, and verification while preserving every declared compatibility identifier and legacy CLI alias.",
            "reason": "The authoritative naming contract is now explicit, but the tracked implementation and most current references still use the historical arckit-runtime product and locator identities.",
            "derived_from": [
              "FACT-ARCORBIT-RENAME-REQUEST",
              "FACT-ARCORBIT-NAMING-CONTRACT",
              "FACT-ARCORBIT-CURRENT-IDENTITY-INVENTORY"
            ],
            "blocked_by": [
              "GAP-ARCORBIT-NAMING-CONTRACT"
            ],
            "priority_basis": {
              "blocking": "high",
              "uncertainty": "medium",
              "risk": "high",
              "user_impact": "high"
            },
            "responsibility": "agent",
            "evidence_required": [
              "Tracked live-source inventory showing canonical ArcOrbit names and only contract-approved legacy identifiers outside immutable history.",
              "Automated verification of ArcOrbit package, CLI plus legacy alias, Desktop labels, workflow, artifacts, canonical resource layout plus legacy read fallback, and stable schema/URI/bundle/app identities.",
              "Complete ArcOrbit Runtime check and risk-proportionate distribution assembly or packaging evidence."
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
            "area_ref": "product_intent_and_scope",
            "observed_revision": 1,
            "set_decision": {
              "status": "settled",
              "statement": "Arckit is a repository-owned software-development handoff protocol and skill system that lets one Agent and automation hosts advance durable Project/Case state safely; ArcOrbit is the formally named supervised Desktop/Runtime product that automates this protocol around a continuous Agent conversation.",
              "reason": "The explicit rename decision and authoritative identity contract distinguish the protocol product from its supervised automation product.",
              "evidence": [
                "AGENTS.md",
                "arckit/spec/agentic-software-development/product-architecture.md",
                "arckit/spec/arckit-runtime-distribution.md"
              ],
              "confidence": "high",
              "resume_condition": ""
            },
            "gap_refs": [],
            "reason": "The selected Gap settled the supervised product identity without renaming Arckit itself.",
            "evidence": [
              "arckit/spec/arckit-runtime-distribution.md",
              "arckit/spec/INDEX.md",
              "arckit/tech/arckit-runtime/installer-supply-chain.md",
              "arckit/tech/INDEX.md"
            ]
          },
          {
            "area_ref": "runtime_surfaces",
            "observed_revision": 2,
            "set_decision": {
              "status": "settled",
              "statement": "The software comprises repository-owned Arckit skills and Node.js ledger CLIs plus ArcOrbit, an Electron Desktop with Setup Readiness and skill provisioning, a Runtime supervisor, Codex adapter, and packaged trusted capability resources.",
              "reason": "The naming contract gives the existing supervised surface a distinct recoverable product identity while preserving its responsibilities.",
              "evidence": [
                "arckit/spec/arckit-runtime-distribution.md",
                "arckit/tech/arckit-runtime/installer-supply-chain.md"
              ],
              "confidence": "high",
              "resume_condition": ""
            },
            "gap_refs": [],
            "reason": "The supervised Runtime/Desktop surface is now formally ArcOrbit.",
            "evidence": [
              "arckit/spec/arckit-runtime-distribution.md",
              "arckit/spec/INDEX.md",
              "arckit/tech/arckit-runtime/installer-supply-chain.md",
              "arckit/tech/INDEX.md"
            ]
          },
          {
            "area_ref": "technical_foundation",
            "observed_revision": 14,
            "set_decision": {
              "status": "settled",
              "statement": "Arckit uses repository-owned Markdown/JSON state and Node.js ESM ledger CLIs. ArcOrbit is its Electron Desktop/Runtime host and uses canonical runtime/arcorbit, @arckit/arcorbit, arcorbit CLI/workflow/resource and ArcOrbit artifact identities while preserving the existing Electron appId, Workshop app_id, published arckit-runtime schema ids, arckit-runtime:// run refs and legacy CLI alias. Project v5, Case v5, Transition v8, Snapshot v1, Closeout v2 and Iteration v3 remain unchanged. ArcOrbit packages trusted capabilities separately from an Arckit skill payload and versioned ArcForge Embedded Provider; Desktop Setup Readiness owns provisioning, the policy-neutral Runtime Kernel continues natural $using-arckit execution, and ArcForge Core remains the sole implementation of overlapping provisioning semantics. Repository-local validation uses explicit local metadata and unsigned host-native artifacts that cannot enter governed release-trigger validation.",
              "reason": "The identity contract changes product and migratable locators while explicitly preserving protocol, external-service and installed-application continuity boundaries.",
              "evidence": [
                "arckit/tech/arckit-runtime/installer-supply-chain.md",
                "arckit/spec/arckit-runtime-distribution.md"
              ],
              "confidence": "high",
              "resume_condition": ""
            },
            "gap_refs": [],
            "reason": "The selected Gap establishes exact technical locator and compatibility identities before source migration.",
            "evidence": [
              "arckit/spec/arckit-runtime-distribution.md",
              "arckit/spec/INDEX.md",
              "arckit/tech/arckit-runtime/installer-supply-chain.md",
              "arckit/tech/INDEX.md"
            ]
          },
          {
            "area_ref": "delivery_and_distribution",
            "observed_revision": 4,
            "set_decision": {
              "status": "settled",
              "statement": "Arckit skills are sourced from the repository and synchronized to supported Codex targets through governed availability-aware installation. Governed ArcOrbit installers are produced only by manually dispatched GitHub workflows against an existing tf/*, beta/* or appstore/* release-intent tag, bundle locked trusted resources, the Arckit skill payload and an exact ArcForge provider artifact, and support macOS arm64/x64, Windows x64 and Linux x64 with explicit signing and draft-release choices. A repository-local validation entrypoint may build current-host unsigned artifacts only when provider, ArcOrbit metadata, repository identity and workflow are explicitly labeled local; those artifacts carry no release authorization and are never published by governed workflows.",
              "reason": "The delivery contract adopts ArcOrbit product and artifact identity without changing release authorization or supply-chain boundaries.",
              "evidence": [
                "arckit/spec/arckit-runtime-distribution.md",
                "arckit/tech/arckit-runtime/installer-supply-chain.md",
                "delivery/skills/arckit-git-branching/references/platform-release-triggers.md"
              ],
              "confidence": "high",
              "resume_condition": ""
            },
            "gap_refs": [],
            "reason": "The selected Gap settles the governed distribution product identity.",
            "evidence": [
              "arckit/spec/arckit-runtime-distribution.md",
              "arckit/spec/INDEX.md",
              "arckit/tech/arckit-runtime/installer-supply-chain.md",
              "arckit/tech/INDEX.md"
            ]
          }
        ],
        "software_invariant_changes": [],
        "project_gap_changes": [],
        "selection_context_change": {
          "current_focus": "Realize the accepted ArcOrbit identity across live source, documentation, UI, package, CLI, repository paths, build workflow and resource layout while preserving declared compatibility identifiers."
        },
        "evidence": [
          "arckit/spec/arckit-runtime-distribution.md",
          "arckit/spec/INDEX.md",
          "arckit/tech/arckit-runtime/installer-supply-chain.md",
          "arckit/tech/INDEX.md"
        ]
      },
      "invariant_assessment": {
        "project_revision": 75,
        "judgments": [
          {
            "invariant_ref": "product-expectations-remain-recoverable",
            "disposition": "upheld",
            "reason": "The formal product identity, Arckit and ArcForge boundaries, canonical locators and compatibility exceptions are explicit in authoritative product specification.",
            "fact_refs": [
              "FACT-ARCORBIT-RENAME-REQUEST",
              "FACT-ARCORBIT-NAMING-CONTRACT",
              "FACT-ARCORBIT-COMPATIBILITY-CONTRACT"
            ],
            "evidence": [
              "arckit/spec/arckit-runtime-distribution.md",
              "arckit/spec/INDEX.md"
            ],
            "gap_refs": []
          },
          {
            "invariant_ref": "interaction-expectations-remain-recoverable",
            "disposition": "not_relevant",
            "reason": "The accepted contract changes product labels and technical identity but does not alter user actions, navigation, state transitions, feedback or recovery behavior in this round.",
            "fact_refs": [
              "FACT-ARCORBIT-NAMING-CONTRACT"
            ],
            "evidence": [],
            "gap_refs": []
          },
          {
            "invariant_ref": "visual-language-remains-consistent",
            "disposition": "not_relevant",
            "reason": "No theme, token, layout or component presentation rule is established or changed by selecting the ArcOrbit product name.",
            "fact_refs": [
              "FACT-ARCORBIT-NAMING-CONTRACT"
            ],
            "evidence": [],
            "gap_refs": []
          },
          {
            "invariant_ref": "technical-decisions-remain-explainable",
            "disposition": "upheld",
            "reason": "The canonical locator mapping and stable compatibility identities are explicit with their continuity rationale and affected supply-chain relationships.",
            "fact_refs": [
              "FACT-ARCORBIT-NAMING-CONTRACT",
              "FACT-ARCORBIT-COMPATIBILITY-CONTRACT",
              "FACT-ARCORBIT-CURRENT-IDENTITY-INVENTORY"
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
            "reason": "The current tracked component, UI and build identities remain arckit-runtime and therefore do not yet realize the accepted ArcOrbit contract.",
            "fact_refs": [
              "FACT-ARCORBIT-CURRENT-IDENTITY-INVENTORY"
            ],
            "evidence": [
              "runtime/arckit-runtime/package.json",
              "runtime/arckit-runtime/scripts/build-package-config.mjs",
              ".github/workflows/arckit-runtime-package.yml"
            ],
            "gap_refs": [
              "GAP-ARCORBIT-REALIZATION"
            ]
          },
          {
            "invariant_ref": "material-risks-have-credible-evidence",
            "disposition": "undetermined",
            "reason": "Compatibility identities are now bounded, but implementation and regression evidence has not yet proven path, CLI, resource, packaging and persisted-identity continuity.",
            "fact_refs": [
              "FACT-ARCORBIT-COMPATIBILITY-CONTRACT"
            ],
            "evidence": [
              "arckit/spec/arckit-runtime-distribution.md",
              "arckit/spec/INDEX.md",
              "arckit/tech/arckit-runtime/installer-supply-chain.md",
              "arckit/tech/INDEX.md"
            ],
            "gap_refs": [
              "GAP-ARCORBIT-REALIZATION"
            ]
          }
        ]
      },
      "evidence": [
        "arckit/spec/arckit-runtime-distribution.md",
        "arckit/spec/INDEX.md",
        "arckit/tech/arckit-runtime/installer-supply-chain.md",
        "arckit/tech/INDEX.md",
        "runtime/arckit-runtime/package.json",
        "runtime/arckit-runtime/scripts/build-package-config.mjs",
        "runtime/arckit-runtime/scripts/prepare-distribution.mjs",
        "runtime/arckit-runtime/src/runtime-record-ref.mjs",
        ".github/workflows/arckit-runtime-package.yml",
        "verification: git diff --check passed for the naming-contract documents"
      ],
      "runtime_result_ref": "",
      "occurred_at": "2026-08-17T10:18:42.877Z"
    },
    {
      "round": 2,
      "transition_schema_version": "arckit-case-transition/v8",
      "goal": "Migrate the live product identity to ArcOrbit while preserving declared compatibility identifiers and prove the result with focused and complete Runtime verification.",
      "outcome": "completed",
      "gap_selection": {
        "mode": "candidate",
        "basis": "The realization gap is the only ready Case obligation, directly completes the requested formal rename, and now has implementation plus compatibility evidence.",
        "snapshot_token": "b7cd0e835a668063ed246c59719422c0c820a244ae1882f7d5fe7ad63e7099f4",
        "selected_ref": "case-gap:CASE-20260817-002:GAP-ARCORBIT-REALIZATION",
        "comparison_summary": "Compared the ready ArcOrbit realization gap with all four independent Project gaps; the Case gap remains the only candidate that completes the active user-requested rename and removes its two threatened or undetermined impacts.",
        "fresh_discovery_summary": "Implementation and verification exposed no additional Case gap; compatibility identities are covered by explicit regression evidence and current source inventory.",
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
            "reason": "Independent scenario validation does not block the active product rename."
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
            "reason": "Runtime resilience remains separate from identity realization."
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
            "reason": "Real-project security validation is outside the naming migration boundary."
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
            "reason": "Cross-record acceptance remains a separate Project obligation."
          },
          {
            "ref": "case-gap:CASE-20260817-002:GAP-ARCORBIT-REALIZATION",
            "source": "persisted",
            "eligibility": "ready",
            "disposition": "selected",
            "priority_basis": {
              "blocking": "high",
              "uncertainty": "medium",
              "risk": "high",
              "user_impact": "high"
            },
            "reason": "It is the only ready Case gap and the implementation plus full Runtime check now satisfy its required evidence."
          }
        ]
      },
      "selected_gap": {
        "id": "GAP-ARCORBIT-REALIZATION",
        "responsibility": "agent",
        "goal": "Realize the accepted ArcOrbit identity across live repository source, current documentation, UI labels, package and CLI metadata, repository paths, build workflow, resource layout, fixtures, and verification while preserving every declared compatibility identifier and legacy CLI alias.",
        "reason": "The authoritative naming contract is now explicit, but the tracked implementation and most current references still use the historical arckit-runtime product and locator identities.",
        "derived_from": [
          "FACT-ARCORBIT-RENAME-REQUEST",
          "FACT-ARCORBIT-NAMING-CONTRACT",
          "FACT-ARCORBIT-CURRENT-IDENTITY-INVENTORY"
        ],
        "blocked_by": [
          "GAP-ARCORBIT-NAMING-CONTRACT"
        ],
        "priority_basis": {
          "blocking": "high",
          "uncertainty": "medium",
          "risk": "high",
          "user_impact": "high"
        },
        "evidence_required": [
          "Tracked live-source inventory showing canonical ArcOrbit names and only contract-approved legacy identifiers outside immutable history.",
          "Automated verification of ArcOrbit package, CLI plus legacy alias, Desktop labels, workflow, artifacts, canonical resource layout plus legacy read fallback, and stable schema/URI/bundle/app identities.",
          "Complete ArcOrbit Runtime check and risk-proportionate distribution assembly or packaging evidence."
        ]
      },
      "planned_transition": {
        "goal": "Migrate the live product identity to ArcOrbit while preserving declared compatibility identifiers and prove the result with focused and complete Runtime verification.",
        "expected_state_change": "Resolve GAP-ARCORBIT-REALIZATION, uphold both affected invariants, and advance the Case to implementation-focused completion review."
      },
      "accepted_state_delta": {
        "resolved_gap": {
          "id": "GAP-ARCORBIT-REALIZATION",
          "status": "resolved",
          "outcome": "The live component is now ArcOrbit across repository path, @arckit/arcorbit package, arcorbit CLI and executable, workflow, resources, installers, Desktop labels, current documentation and fixtures, while the declared legacy CLI, resource-read, schema, URI, bundle and Workshop identities remain compatible.",
          "reason": "Canonical source and documentation inventory is consistent, focused rename and compatibility tests pass, distribution assembly passes, and the complete ArcOrbit Runtime check has no failures.",
          "evidence": [
            "runtime/arcorbit/package.json",
            "runtime/arcorbit/scripts/build-package-config.mjs",
            "runtime/arcorbit/scripts/prepare-distribution.mjs",
            "runtime/arcorbit/src/capability-registry.mjs",
            "runtime/arcorbit/test/package-distribution.test.mjs",
            "runtime/arcorbit/test/capability-policy.test.mjs",
            ".github/workflows/arcorbit-package.yml",
            "verification: npm run check in runtime/arcorbit passed 194 tests with 1 environment skip and 0 failures"
          ]
        },
        "facts_added": [
          {
            "id": "FACT-ARCORBIT-REALIZED",
            "revision": 1,
            "status": "accepted",
            "statement": "The tracked live product is realized as ArcOrbit at runtime/arcorbit with package @arckit/arcorbit, canonical arcorbit CLI and executable, ArcOrbit Desktop labels and artifacts, arcorbit workflow and embedded resource root; the legacy arckit-runtime CLI and resource-read fallback plus stable external and protocol identifiers remain intact.",
            "basis": "Repository-wide implementation, current documentation, focused compatibility tests, distribution assembly and the complete Runtime check agree.",
            "evidence": [
              "runtime/arcorbit/package.json",
              "runtime/arcorbit/src/cli.mjs",
              "runtime/arcorbit/scripts/build-package-config.mjs",
              "runtime/arcorbit/src/capability-registry.mjs",
              "arckit/spec/arcorbit-distribution.md",
              "arckit/tech/arcorbit/installer-supply-chain.md",
              ".github/workflows/arcorbit-package.yml",
              "verification: npm run check in runtime/arcorbit passed"
            ]
          }
        ],
        "facts_superseded": [],
        "impacts_added": [],
        "impacts_updated": [
          {
            "id": "IMPACT-ARCORBIT-REALIZATION",
            "fact_id": "FACT-ARCORBIT-REALIZED",
            "fact_revision": 1,
            "target": {
              "kind": "software_invariant",
              "ref": "accepted-facts-are-realized",
              "revision": null
            },
            "effect": "upheld",
            "reason": "Source, current projections, build metadata and runtime behavior now realize the accepted ArcOrbit contract.",
            "gap_ids": [],
            "evidence": [
              "runtime/arcorbit/package.json",
              "runtime/arcorbit/desktop/renderer/index.html",
              ".github/workflows/arcorbit-package.yml",
              "verification: npm run check in runtime/arcorbit passed"
            ]
          },
          {
            "id": "IMPACT-ARCORBIT-MIGRATION-RISK",
            "fact_id": "FACT-ARCORBIT-COMPATIBILITY-CONTRACT",
            "fact_revision": 1,
            "target": {
              "kind": "software_invariant",
              "ref": "material-risks-have-credible-evidence",
              "revision": null
            },
            "effect": "upheld",
            "reason": "Regression tests prove canonical identity, legacy CLI alias, legacy resource fallback and stable app, service, schema and run-reference identifiers while distribution assembly uses the new resource and artifact identities.",
            "gap_ids": [],
            "evidence": [
              "runtime/arcorbit/test/package-distribution.test.mjs",
              "runtime/arcorbit/test/capability-policy.test.mjs",
              "runtime/arcorbit/test/runtime-record-ref.test.mjs",
              "runtime/arcorbit/test/task-source-adapter.test.mjs",
              "verification: npm run check in runtime/arcorbit passed"
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
        "project_revision": 76,
        "judgments": [
          {
            "invariant_ref": "product-expectations-remain-recoverable",
            "disposition": "upheld",
            "reason": "The current ArcOrbit product name, identity mapping and compatibility boundary remain explicit in authoritative specification.",
            "fact_refs": [
              "FACT-ARCORBIT-NAMING-CONTRACT",
              "FACT-ARCORBIT-COMPATIBILITY-CONTRACT",
              "FACT-ARCORBIT-REALIZED"
            ],
            "evidence": [
              "arckit/spec/arcorbit-distribution.md",
              "arckit/spec/INDEX.md"
            ],
            "gap_refs": []
          },
          {
            "invariant_ref": "interaction-expectations-remain-recoverable",
            "disposition": "upheld",
            "reason": "Current interaction sources and realized Desktop labels consistently expose ArcOrbit without changing established actions, states or recovery behavior.",
            "fact_refs": [
              "FACT-ARCORBIT-REALIZED"
            ],
            "evidence": [
              "arckit/interaction/setup-readiness/interaction.md",
              "arckit/interaction/setup-readiness/default.html",
              "runtime/arcorbit/desktop/renderer/index.html"
            ],
            "gap_refs": []
          },
          {
            "invariant_ref": "visual-language-remains-consistent",
            "disposition": "upheld",
            "reason": "Visual strategy, tokens and component rules are unchanged while their product identity projections consistently use ArcOrbit Desktop.",
            "fact_refs": [
              "FACT-ARCORBIT-REALIZED"
            ],
            "evidence": [
              "arckit/visual/INDEX.md",
              "arckit/visual/_library/brief.md",
              "arckit/visual/_library/component-catalog.yaml"
            ],
            "gap_refs": []
          },
          {
            "invariant_ref": "technical-decisions-remain-explainable",
            "disposition": "upheld",
            "reason": "Canonical locators, migration fallback and persistent compatibility identities are documented and reflected directly in source and packaging configuration.",
            "fact_refs": [
              "FACT-ARCORBIT-NAMING-CONTRACT",
              "FACT-ARCORBIT-COMPATIBILITY-CONTRACT",
              "FACT-ARCORBIT-REALIZED"
            ],
            "evidence": [
              "arckit/tech/arcorbit/installer-supply-chain.md",
              "runtime/arcorbit/scripts/build-package-config.mjs",
              "runtime/arcorbit/src/capability-registry.mjs"
            ],
            "gap_refs": []
          },
          {
            "invariant_ref": "accepted-facts-are-realized",
            "disposition": "upheld",
            "reason": "All accepted canonical ArcOrbit brand and locator identities are present in live source, current projections and build workflow.",
            "fact_refs": [
              "FACT-ARCORBIT-NAMING-CONTRACT",
              "FACT-ARCORBIT-REALIZED"
            ],
            "evidence": [
              "runtime/arcorbit/package.json",
              "runtime/arcorbit/src/cli.mjs",
              ".github/workflows/arcorbit-package.yml",
              "verification: repository current-source inventory"
            ],
            "gap_refs": []
          },
          {
            "invariant_ref": "material-risks-have-credible-evidence",
            "disposition": "upheld",
            "reason": "Focused compatibility and distribution tests plus the complete Runtime check cover the migration's stable identifiers and canonical outputs.",
            "fact_refs": [
              "FACT-ARCORBIT-COMPATIBILITY-CONTRACT",
              "FACT-ARCORBIT-REALIZED"
            ],
            "evidence": [
              "runtime/arcorbit/test/package-distribution.test.mjs",
              "runtime/arcorbit/test/capability-policy.test.mjs",
              "runtime/arcorbit/test/runtime-record-ref.test.mjs",
              "verification: npm run check in runtime/arcorbit passed"
            ],
            "gap_refs": []
          }
        ]
      },
      "evidence": [
        "runtime/arcorbit/package.json",
        "runtime/arcorbit/README.md",
        "arckit/spec/arcorbit-distribution.md",
        "arckit/tech/arcorbit/installer-supply-chain.md",
        ".github/workflows/arcorbit-package.yml",
        "verification: focused identity and compatibility suite passed 41 tests",
        "verification: npm run check in runtime/arcorbit passed 194 tests with 1 environment skip and 0 failures",
        "verification: git diff --check passed"
      ],
      "runtime_result_ref": "",
      "occurred_at": "2026-08-17T12:39:56.850Z"
    },
    {
      "round": 3,
      "transition_schema_version": "arckit-case-transition/v8",
      "goal": "Perform the implementation-focused five-dimension completion review for the realized ArcOrbit rename.",
      "outcome": "completed",
      "gap_selection": {
        "mode": "candidate",
        "basis": "The ledger-generated completion review is the only ready Case obligation after all implementation gaps and state impacts closed.",
        "snapshot_token": "0e8f7c31117cbd37cc6d4705de3775439b86df1dfad83bd754314bdcc42b23cd",
        "selected_ref": "case-gap:CASE-20260817-002:CASE-20260817-002:completion-review:1",
        "comparison_summary": "Compared the required completion review with the four independent Project gaps; reviewing the completed active Case is the only ready action that can establish trustworthy resolution of the user request.",
        "fresh_discovery_summary": "Post-implementation inventory, diff audit, CLI inspection and full test evidence exposed no fresh correctness, omission, excess or compatibility gap.",
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
            "reason": "Independent scenario validation remains outside this completed rename Case."
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
            "reason": "Runtime resilience remains an independent future Case."
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
            "reason": "Security validation does not affect the bounded rename completion review."
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
            "reason": "Cross-record acceptance remains a separate Project obligation."
          },
          {
            "ref": "case-gap:CASE-20260817-002:CASE-20260817-002:completion-review:1",
            "source": "persisted",
            "eligibility": "ready",
            "disposition": "selected",
            "priority_basis": {
              "blocking": "high",
              "uncertainty": "low",
              "risk": "high",
              "user_impact": "high"
            },
            "reason": "It is the only ready Case obligation and required before deterministic closure."
          }
        ]
      },
      "selected_gap": {
        "id": "CASE-20260817-002:completion-review:1",
        "responsibility": "agent",
        "goal": "Review the completed implementation for correctness, real problem resolution, verification credibility, regression risk, and minimality.",
        "reason": "All ordinary Case gaps and state impacts are closed.",
        "derived_from": [
          "case_result",
          "content_revision:2"
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
        "goal": "Perform the implementation-focused five-dimension completion review for the realized ArcOrbit rename.",
        "expected_state_change": "Record a clean review for content revision 2 and close the Case if the deterministic audit agrees."
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
          "reviewed_content_revision": 2,
          "dimensions": {
            "implementation_correctness": "clean",
            "problem_resolution": "clean",
            "verification_credibility": "clean",
            "regression_risk": "clean",
            "minimality": "clean"
          },
          "findings": [],
          "evidence": [
            "runtime/arcorbit/package.json",
            "runtime/arcorbit/scripts/build-package-config.mjs",
            "runtime/arcorbit/src/capability-registry.mjs",
            "runtime/arcorbit/test/package-distribution.test.mjs",
            "runtime/arcorbit/test/capability-policy.test.mjs",
            "arckit/spec/arcorbit-distribution.md",
            "arckit/tech/arcorbit/installer-supply-chain.md",
            "verification: canonical path and stale-current-locator inventory passed",
            "verification: arcorbit CLI help exposes the canonical command",
            "verification: focused identity and compatibility suite passed 41 tests",
            "verification: npm run check in runtime/arcorbit passed 194 tests with 1 environment skip and 0 failures",
            "verification: git diff --check passed"
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
        "project_revision": 76,
        "judgments": [
          {
            "invariant_ref": "product-expectations-remain-recoverable",
            "disposition": "upheld",
            "reason": "Authoritative product facts consistently define ArcOrbit and its compatibility boundary.",
            "fact_refs": [
              "FACT-ARCORBIT-NAMING-CONTRACT",
              "FACT-ARCORBIT-COMPATIBILITY-CONTRACT",
              "FACT-ARCORBIT-REALIZED"
            ],
            "evidence": [
              "arckit/spec/arcorbit-distribution.md",
              "arckit/spec/INDEX.md"
            ],
            "gap_refs": []
          },
          {
            "invariant_ref": "interaction-expectations-remain-recoverable",
            "disposition": "upheld",
            "reason": "Interaction sources and live Desktop labels consistently present ArcOrbit while retaining established behavior.",
            "fact_refs": [
              "FACT-ARCORBIT-REALIZED"
            ],
            "evidence": [
              "arckit/interaction/setup-readiness/interaction.md",
              "arckit/interaction/setup-readiness/default.html",
              "runtime/arcorbit/desktop/renderer/index.html"
            ],
            "gap_refs": []
          },
          {
            "invariant_ref": "visual-language-remains-consistent",
            "disposition": "upheld",
            "reason": "The rename updates identity projections without altering the accepted visual system.",
            "fact_refs": [
              "FACT-ARCORBIT-REALIZED"
            ],
            "evidence": [
              "arckit/visual/INDEX.md",
              "arckit/visual/_library/brief.md",
              "arckit/visual/_library/component-catalog.yaml"
            ],
            "gap_refs": []
          },
          {
            "invariant_ref": "technical-decisions-remain-explainable",
            "disposition": "upheld",
            "reason": "Canonical ArcOrbit locators and every retained compatibility identifier are explicit in technical sources and code.",
            "fact_refs": [
              "FACT-ARCORBIT-NAMING-CONTRACT",
              "FACT-ARCORBIT-COMPATIBILITY-CONTRACT",
              "FACT-ARCORBIT-REALIZED"
            ],
            "evidence": [
              "arckit/tech/arcorbit/installer-supply-chain.md",
              "runtime/arcorbit/scripts/build-package-config.mjs",
              "runtime/arcorbit/src/capability-registry.mjs"
            ],
            "gap_refs": []
          },
          {
            "invariant_ref": "accepted-facts-are-realized",
            "disposition": "upheld",
            "reason": "Current source, UI, documentation, workflow and distribution metadata realize the accepted ArcOrbit contract.",
            "fact_refs": [
              "FACT-ARCORBIT-NAMING-CONTRACT",
              "FACT-ARCORBIT-REALIZED"
            ],
            "evidence": [
              "runtime/arcorbit/package.json",
              "runtime/arcorbit/src/cli.mjs",
              ".github/workflows/arcorbit-package.yml",
              "verification: canonical path and stale-current-locator inventory passed"
            ],
            "gap_refs": []
          },
          {
            "invariant_ref": "material-risks-have-credible-evidence",
            "disposition": "upheld",
            "reason": "Compatibility-specific tests, full Runtime tests and real distribution assembly cover the migration risk boundary.",
            "fact_refs": [
              "FACT-ARCORBIT-COMPATIBILITY-CONTRACT",
              "FACT-ARCORBIT-REALIZED"
            ],
            "evidence": [
              "runtime/arcorbit/test/package-distribution.test.mjs",
              "runtime/arcorbit/test/capability-policy.test.mjs",
              "runtime/arcorbit/test/runtime-record-ref.test.mjs",
              "verification: npm run check in runtime/arcorbit passed"
            ],
            "gap_refs": []
          }
        ]
      },
      "evidence": [
        "runtime/arcorbit/package.json",
        "runtime/arcorbit/test/package-distribution.test.mjs",
        "runtime/arcorbit/test/capability-policy.test.mjs",
        "arckit/spec/arcorbit-distribution.md",
        "arckit/tech/arcorbit/installer-supply-chain.md",
        "verification: canonical identity inventory and git diff audit passed",
        "verification: npm run check in runtime/arcorbit passed 194 tests with 1 environment skip and 0 failures"
      ],
      "runtime_result_ref": "",
      "occurred_at": "2026-08-17T12:41:29.749Z"
    }
  ],
  "case_resolution": {
    "status": "resolved",
    "stage": "resolved",
    "satisfied": [
      "GAP-ARCORBIT-NAMING-CONTRACT",
      "GAP-ARCORBIT-REALIZATION"
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
    "updated_at": "2026-08-17T12:41:29.749Z"
  }
}
```

## Round Notes

- Case history is canonical in Structured Record.rounds; keep prose notes exceptional.
