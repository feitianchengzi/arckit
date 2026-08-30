# Upgrade ArcOrbit Codex CLI installation and updates

Case: CASE-20260829-003
Status: closed
Artifact Type: mixed
Selected Gap: none
Updated: 2026-08-29T17:43:21.909Z

## User Intent

Make Codex CLI discovery, installation selection, update checks, updates, proxy use, and recovery source-aware and reliable across supported local execution scopes.

## Structured Record

```json
{
  "schema_version": "development-case-record/v5",
  "id": "CASE-20260829-003",
  "title": "Upgrade ArcOrbit Codex CLI installation and updates",
  "status": "closed",
  "artifact_type": "mixed",
  "created_at": "2026-08-29T17:01:31.603Z",
  "updated_at": "2026-08-29T17:43:21.909Z",
  "user_intent": "Make Codex CLI discovery, installation selection, update checks, updates, proxy use, and recovery source-aware and reliable across supported local execution scopes.",
  "expected_outcome": "ArcOrbit preserves every healthy Codex installation, recommends or invokes the correct owner-specific lifecycle, reports update availability without false negatives, and verifies the exact executable after mutation.",
  "project_state_ref": "arckit/project/state.record.json",
  "current_round": {
    "goal": "",
    "selected_gap": null
  },
  "facts": [
    {
      "id": "FACT-20260829-003-001",
      "revision": 1,
      "status": "accepted",
      "statement": "The operator approved a complete upgrade of ArcOrbit Codex CLI installation and update flows based on the researched standalone, npm, Homebrew, Windows, WSL, proxy, and version-check boundaries.",
      "basis": "Current operator instruction and accepted implementation plan.",
      "evidence": [
        "system:current_operator_input",
        "runtime/arcorbit/src/codex-setup-manager.mjs",
        "runtime/arcorbit/src/codex-executable-resolver.mjs"
      ]
    },
    {
      "id": "FACT-20260829-003-002",
      "revision": 1,
      "status": "accepted",
      "statement": "ArcOrbit models Codex as a complete installation inventory with one active binding, execution-scope isolation, proven/inferred/unknown owner confidence, owner-aware installation advice, independent update status, shared proxy context, and exact post-mutation verification.",
      "basis": "The approved research conclusions are now expressed consistently in authoritative product and technical sources.",
      "evidence": [
        "arckit/spec/arcorbit-distribution.md",
        "arckit/tech/arcorbit/installer-supply-chain.md",
        "arckit/spec/INDEX.md",
        "arckit/tech/INDEX.md"
      ]
    },
    {
      "id": "FACT-20260829-003-003",
      "revision": 1,
      "status": "superseded",
      "statement": "The current ArcOrbit production implementation still projects one selected executable, enables managed updates only for standalone provenance, and does not expose structured installed/latest versions or owner-specific update-check status.",
      "basis": "Direct inspection of the current resolver and setup manager.",
      "evidence": [
        "runtime/arcorbit/src/codex-executable-resolver.mjs:108",
        "runtime/arcorbit/src/codex-setup-manager.mjs:285",
        "runtime/arcorbit/src/codex-setup-manager.mjs:718",
        "runtime/arcorbit/src/codex-setup-manager.mjs:720"
      ]
    },
    {
      "id": "FACT-20260829-003-004",
      "revision": 1,
      "status": "accepted",
      "statement": "ArcOrbit main-process Codex setup now preserves all independently runnable native candidates, resolves proven npm/Homebrew/managed-standalone ownership, recommends suitable installation methods, checks same-owner latest versions with bounded caching, routes fixed owner mutations through the current proxy context, and fails closed unless fresh target identity and version postconditions hold.",
      "basis": "Direct implementation and focused automated tests across resolver, lifecycle, setup manager, proxy, receipt, and owner mutation boundaries.",
      "evidence": [
        "runtime/arcorbit/src/codex-executable-resolver.mjs",
        "runtime/arcorbit/src/codex-installation-lifecycle.mjs",
        "runtime/arcorbit/src/codex-owner-receipt-store.mjs",
        "runtime/arcorbit/src/codex-setup-manager.mjs",
        "runtime/arcorbit/test/codex-installation-lifecycle.test.mjs",
        "runtime/arcorbit/test/codex-owner-receipt-store.test.mjs",
        "runtime/arcorbit/test/codex-setup-manager.test.mjs"
      ]
    },
    {
      "id": "FACT-20260829-003-005",
      "revision": 1,
      "status": "accepted",
      "statement": "ArcOrbit Setup Readiness now exposes the complete Codex installation inventory and active selection reason, owner/confidence, installed and latest versions, install recommendations, independent update states, owner-specific update controls, manual refresh, and explicit inferred-standalone adoption through confirmation-bound typed IPC.",
      "basis": "Direct interaction implementation and automated IPC/Renderer contract evidence.",
      "evidence": [
        "arckit/interaction/setup-readiness/interaction.md",
        "runtime/arcorbit/desktop/renderer/index.html",
        "runtime/arcorbit/desktop/renderer/renderer.js",
        "runtime/arcorbit/src/desktop/codex-setup-ipc.mjs",
        "runtime/arcorbit/test/codex-setup-ipc.test.mjs",
        "runtime/arcorbit/test/desktop-renderer.test.mjs"
      ]
    }
  ],
  "state_impacts": [
    {
      "id": "IMPACT-20260829-003-001",
      "fact_id": "FACT-20260829-003-002",
      "fact_revision": 1,
      "target": {
        "kind": "software_decision",
        "ref": "product_capabilities",
        "revision": 40
      },
      "effect": "upheld",
      "reason": "The durable product source now defines the complete source-aware Codex setup capability.",
      "gap_ids": [],
      "evidence": [
        "arckit/spec/arcorbit-distribution.md"
      ]
    },
    {
      "id": "IMPACT-20260829-003-002",
      "fact_id": "FACT-20260829-003-002",
      "fact_revision": 1,
      "target": {
        "kind": "software_decision",
        "ref": "external_integrations",
        "revision": 14
      },
      "effect": "upheld",
      "reason": "The external integration boundary now fixes exact owner adapters, release sources, proxy context, and Renderer restrictions.",
      "gap_ids": [],
      "evidence": [
        "arckit/tech/arcorbit/installer-supply-chain.md"
      ]
    },
    {
      "id": "IMPACT-20260829-003-003",
      "fact_id": "FACT-20260829-003-002",
      "fact_revision": 1,
      "target": {
        "kind": "software_decision",
        "ref": "technical_foundation",
        "revision": 45
      },
      "effect": "upheld",
      "reason": "Inventory, advisor, update checker, network context, and mutation postconditions are technically recoverable.",
      "gap_ids": [],
      "evidence": [
        "arckit/tech/arcorbit/installer-supply-chain.md"
      ]
    },
    {
      "id": "IMPACT-20260829-003-004",
      "fact_id": "FACT-20260829-003-004",
      "fact_revision": 1,
      "target": {
        "kind": "software_invariant",
        "ref": "accepted-facts-are-realized",
        "revision": null
      },
      "effect": "upheld",
      "reason": "The accepted backend lifecycle model is directly realized by production modules and exact postcondition checks.",
      "gap_ids": [],
      "evidence": [
        "runtime/arcorbit/src/codex-installation-lifecycle.mjs",
        "runtime/arcorbit/src/codex-setup-manager.mjs"
      ]
    },
    {
      "id": "IMPACT-20260829-003-005",
      "fact_id": "FACT-20260829-003-004",
      "fact_revision": 1,
      "target": {
        "kind": "software_invariant",
        "ref": "material-risks-have-credible-evidence",
        "revision": null
      },
      "effect": "upheld",
      "reason": "False-negative discovery, path-only ownership, wrong-owner mutation, stale target, proxy, and update-check failure boundaries have focused repeatable tests.",
      "gap_ids": [],
      "evidence": [
        "runtime/arcorbit/test/codex-executable-resolver.test.mjs",
        "runtime/arcorbit/test/codex-installation-lifecycle.test.mjs",
        "runtime/arcorbit/test/codex-setup-manager.test.mjs"
      ]
    },
    {
      "id": "IMPACT-20260829-003-006",
      "fact_id": "FACT-20260829-003-005",
      "fact_revision": 1,
      "target": {
        "kind": "software_decision",
        "ref": "experience_and_interaction",
        "revision": 62
      },
      "effect": "upheld",
      "reason": "The Setup interaction now gives users explicit source-aware state, choices, confirmations, and recovery without exposing arbitrary execution input.",
      "gap_ids": [],
      "evidence": [
        "arckit/interaction/setup-readiness/interaction.md",
        "runtime/arcorbit/desktop/renderer/renderer.js"
      ]
    }
  ],
  "gaps": [
    {
      "id": "GAP-20260829-003-001",
      "status": "resolved",
      "goal": "Establish the authoritative product and technical contract for source-aware Codex installation and update lifecycle behavior.",
      "reason": "Implementation choices depend on stable identities, states, ownership proof, proxy, and postcondition semantics that are not yet fully authoritative.",
      "derived_from": [
        "FACT-20260829-003-001"
      ],
      "blocked_by": [],
      "priority_basis": {
        "blocking": "high",
        "risk": "high"
      },
      "responsibility": "agent",
      "evidence_required": [
        "arckit/spec/arcorbit-distribution.md",
        "arckit/tech/arcorbit/installer-supply-chain.md"
      ],
      "resolution": {
        "id": "GAP-20260829-003-001",
        "status": "resolved",
        "outcome": "ArcOrbit Codex installation and update lifecycle behavior is defined across execution scope, inventory, owner proof, recommendations, update status, proxy use, and mutation postconditions.",
        "reason": "The product and technical sources agree and their indexes expose the maintained contract.",
        "evidence": [
          "arckit/spec/arcorbit-distribution.md",
          "arckit/tech/arcorbit/installer-supply-chain.md",
          "arckit/spec/INDEX.md",
          "arckit/tech/INDEX.md"
        ],
        "occurred_at": "2026-08-29T17:08:30.304Z"
      }
    },
    {
      "id": "GAP-20260829-003-002",
      "status": "resolved",
      "goal": "Implement and verify source-aware Codex installation inventory, install advice, update checks, owner-specific mutations, proxy propagation, and mutation postconditions in the ArcOrbit main process.",
      "reason": "The stable lifecycle contract is authoritative, while the current resolver and setup manager still expose a single selected probe and standalone-only managed update path.",
      "derived_from": [
        "FACT-20260829-003-002",
        "FACT-20260829-003-003"
      ],
      "blocked_by": [],
      "priority_basis": {
        "blocking": "high",
        "risk": "high",
        "user_impact": "high"
      },
      "responsibility": "agent",
      "evidence_required": [
        "runtime/arcorbit/src/codex-executable-resolver.mjs",
        "runtime/arcorbit/src/codex-setup-manager.mjs",
        "runtime/arcorbit/test/codex-executable-resolver.test.mjs",
        "runtime/arcorbit/test/codex-setup-manager.test.mjs"
      ],
      "resolution": {
        "id": "GAP-20260829-003-002",
        "status": "resolved",
        "outcome": "ArcOrbit now maintains a complete native installation inventory, proves owner adapters, advises install methods, checks owner channels, propagates proxy context, persists standalone receipts, and verifies exact update targets.",
        "reason": "The resolver, lifecycle module, setup manager, Desktop network context, receipt store, and focused tests realize the accepted backend contract.",
        "evidence": [
          "runtime/arcorbit/src/codex-executable-resolver.mjs",
          "runtime/arcorbit/src/codex-installation-lifecycle.mjs",
          "runtime/arcorbit/src/codex-owner-receipt-store.mjs",
          "runtime/arcorbit/src/codex-setup-manager.mjs",
          "runtime/arcorbit/desktop/main.mjs",
          "runtime/arcorbit/test/codex-installation-lifecycle.test.mjs",
          "runtime/arcorbit/test/codex-setup-manager.test.mjs"
        ],
        "occurred_at": "2026-08-29T17:37:56.838Z"
      }
    },
    {
      "id": "GAP-20260829-003-003",
      "status": "resolved",
      "goal": "Expose and verify installation inventory, recommendation, source, current/latest version, update-check failure, conflict, and owner-specific recovery in Setup Readiness.",
      "reason": "The stable interaction states require the Desktop UI and typed IPC to present the new backend model without collapsing healthy, missing, broken, and check-failed states.",
      "derived_from": [
        "FACT-20260829-003-002"
      ],
      "blocked_by": [
        "GAP-20260829-003-002"
      ],
      "priority_basis": {
        "blocking": "medium",
        "risk": "medium",
        "user_impact": "high"
      },
      "responsibility": "agent",
      "evidence_required": [
        "runtime/arcorbit/src/desktop-setup-readiness-context.mjs",
        "runtime/arcorbit/desktop/renderer/renderer.js",
        "runtime/arcorbit/test/codex-setup-ipc.test.mjs"
      ],
      "resolution": {
        "id": "GAP-20260829-003-003",
        "status": "resolved",
        "outcome": "Setup Readiness now presents active and shadowed installations, owner confidence, installed/latest versions, suitable install methods, update-check recovery, owner-specific update, and explicit standalone management confirmation.",
        "reason": "Renderer, preload, main-process confirmation, typed IPC, interaction facts, and UI-focused automated tests agree on the new lifecycle states.",
        "evidence": [
          "arckit/interaction/setup-readiness/interaction.md",
          "runtime/arcorbit/desktop/renderer/index.html",
          "runtime/arcorbit/desktop/renderer/renderer.js",
          "runtime/arcorbit/src/desktop/codex-setup-ipc.mjs",
          "runtime/arcorbit/test/codex-setup-ipc.test.mjs",
          "runtime/arcorbit/test/desktop-renderer.test.mjs"
        ],
        "occurred_at": "2026-08-29T17:40:52.136Z"
      }
    }
  ],
  "content_revision": 3,
  "completion_review": {
    "status": "clean",
    "policy": {
      "initial_max_cycles": 3,
      "source": "operator-approved implementation plan",
      "snapshotted_at": "2026-08-29T17:01:31.603Z"
    },
    "additional_cycles_authorized": 0,
    "cycle_count": 1,
    "reviewed_content_revision": 3,
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
        "content_revision": 3,
        "dimensions": {
          "implementation_correctness": "clean",
          "problem_resolution": "clean",
          "verification_credibility": "clean",
          "regression_risk": "clean",
          "minimality": "clean"
        },
        "finding_ids": [],
        "evidence": [
          "runtime/arcorbit/test/codex-installation-lifecycle.test.mjs",
          "runtime/arcorbit/test/codex-owner-receipt-store.test.mjs",
          "runtime/arcorbit/test/codex-executable-resolver.test.mjs",
          "runtime/arcorbit/test/codex-setup-manager.test.mjs",
          "runtime/arcorbit/test/codex-setup-ipc.test.mjs",
          "runtime/arcorbit/test/desktop-renderer.test.mjs",
          "/tmp/arcorbit-codex-validation.log",
          "/tmp/arcorbit-codex-check.log"
        ],
        "occurred_at": "2026-08-29T17:43:21.909Z"
      }
    ],
    "evidence": [
      "runtime/arcorbit/test/codex-installation-lifecycle.test.mjs",
      "runtime/arcorbit/test/codex-owner-receipt-store.test.mjs",
      "runtime/arcorbit/test/codex-executable-resolver.test.mjs",
      "runtime/arcorbit/test/codex-setup-manager.test.mjs",
      "runtime/arcorbit/test/codex-setup-ipc.test.mjs",
      "runtime/arcorbit/test/desktop-renderer.test.mjs",
      "/tmp/arcorbit-codex-validation.log",
      "/tmp/arcorbit-codex-check.log"
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
      "goal": "Establish the authoritative product and technical contract for source-aware Codex installation and update lifecycle behavior.",
      "outcome": "completed",
      "gap_selection": {
        "mode": "candidate",
        "basis": "The lifecycle contract is the blocking prerequisite for every implementation choice in the approved upgrade.",
        "snapshot_token": "d3fd53024ab700b286aa0416d1b1445db2857e4c17454d1f6acb7626d69fcbcb",
        "selected_ref": "case-gap:CASE-20260829-003:GAP-20260829-003-001",
        "comparison_summary": "Compared the ready Case gap, four unrelated Project gaps, and downstream implementation work; the contract gap remained the only eligible prerequisite for this Case.",
        "fresh_discovery_summary": "The accepted contract exposes separate backend realization and Setup presentation obligations; both are persisted for later fresh selection.",
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
            "reason": "The operator-approved Codex lifecycle Case is independent and currently carries the selected blocking prerequisite."
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
            "reason": "The operator-approved Codex lifecycle Case is independent and currently carries the selected blocking prerequisite."
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
            "reason": "The operator-approved Codex lifecycle Case is independent and currently carries the selected blocking prerequisite."
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
            "reason": "The operator-approved Codex lifecycle Case is independent and currently carries the selected blocking prerequisite."
          },
          {
            "ref": "case-gap:CASE-20260829-003:GAP-20260829-003-001",
            "source": "persisted",
            "eligibility": "ready",
            "disposition": "selected",
            "priority_basis": {
              "blocking": "high",
              "uncertainty": "",
              "risk": "high",
              "user_impact": ""
            },
            "reason": "It is the only accepted prerequisite for owner-aware implementation."
          },
          {
            "ref": "fresh-gap:CASE-20260829-003:GAP-20260829-003-002",
            "source": "fresh",
            "eligibility": "blocked",
            "disposition": "deferred",
            "priority_basis": {
              "blocking": "high",
              "risk": "high",
              "user_impact": "high"
            },
            "reason": "It depends on accepting the contract established in this transition."
          },
          {
            "ref": "fresh-gap:CASE-20260829-003:GAP-20260829-003-003",
            "source": "fresh",
            "eligibility": "blocked",
            "disposition": "deferred",
            "priority_basis": {
              "blocking": "medium",
              "risk": "medium",
              "user_impact": "high"
            },
            "reason": "It depends on the contract and backend model."
          }
        ]
      },
      "selected_gap": {
        "id": "GAP-20260829-003-001",
        "responsibility": "agent",
        "goal": "Establish the authoritative product and technical contract for source-aware Codex installation and update lifecycle behavior.",
        "reason": "Implementation choices depend on stable identities, states, ownership proof, proxy, and postcondition semantics that are not yet fully authoritative.",
        "derived_from": [
          "FACT-20260829-003-001"
        ],
        "blocked_by": [],
        "priority_basis": {
          "blocking": "high",
          "uncertainty": "",
          "risk": "high",
          "user_impact": ""
        },
        "evidence_required": [
          "arckit/spec/arcorbit-distribution.md",
          "arckit/tech/arcorbit/installer-supply-chain.md"
        ]
      },
      "planned_transition": {
        "goal": "Establish the authoritative product and technical contract for source-aware Codex installation and update lifecycle behavior.",
        "expected_state_change": "Source-aware installation identity, owner proof, recommendation, update states, proxy use, and postconditions become authoritative recoverable facts."
      },
      "accepted_state_delta": {
        "resolved_gap": {
          "id": "GAP-20260829-003-001",
          "status": "resolved",
          "outcome": "ArcOrbit Codex installation and update lifecycle behavior is defined across execution scope, inventory, owner proof, recommendations, update status, proxy use, and mutation postconditions.",
          "reason": "The product and technical sources agree and their indexes expose the maintained contract.",
          "evidence": [
            "arckit/spec/arcorbit-distribution.md",
            "arckit/tech/arcorbit/installer-supply-chain.md",
            "arckit/spec/INDEX.md",
            "arckit/tech/INDEX.md"
          ]
        },
        "facts_added": [
          {
            "id": "FACT-20260829-003-002",
            "revision": 1,
            "status": "accepted",
            "statement": "ArcOrbit models Codex as a complete installation inventory with one active binding, execution-scope isolation, proven/inferred/unknown owner confidence, owner-aware installation advice, independent update status, shared proxy context, and exact post-mutation verification.",
            "basis": "The approved research conclusions are now expressed consistently in authoritative product and technical sources.",
            "evidence": [
              "arckit/spec/arcorbit-distribution.md",
              "arckit/tech/arcorbit/installer-supply-chain.md",
              "arckit/spec/INDEX.md",
              "arckit/tech/INDEX.md"
            ]
          },
          {
            "id": "FACT-20260829-003-003",
            "revision": 1,
            "status": "accepted",
            "statement": "The current ArcOrbit production implementation still projects one selected executable, enables managed updates only for standalone provenance, and does not expose structured installed/latest versions or owner-specific update-check status.",
            "basis": "Direct inspection of the current resolver and setup manager.",
            "evidence": [
              "runtime/arcorbit/src/codex-executable-resolver.mjs:108",
              "runtime/arcorbit/src/codex-setup-manager.mjs:285",
              "runtime/arcorbit/src/codex-setup-manager.mjs:718",
              "runtime/arcorbit/src/codex-setup-manager.mjs:720"
            ]
          }
        ],
        "facts_superseded": [],
        "impacts_added": [
          {
            "id": "IMPACT-20260829-003-001",
            "fact_id": "FACT-20260829-003-002",
            "fact_revision": 1,
            "target": {
              "kind": "software_decision",
              "ref": "product_capabilities",
              "revision": 40
            },
            "effect": "upheld",
            "reason": "The durable product source now defines the complete source-aware Codex setup capability.",
            "gap_ids": [],
            "evidence": [
              "arckit/spec/arcorbit-distribution.md"
            ]
          },
          {
            "id": "IMPACT-20260829-003-002",
            "fact_id": "FACT-20260829-003-002",
            "fact_revision": 1,
            "target": {
              "kind": "software_decision",
              "ref": "external_integrations",
              "revision": 14
            },
            "effect": "upheld",
            "reason": "The external integration boundary now fixes exact owner adapters, release sources, proxy context, and Renderer restrictions.",
            "gap_ids": [],
            "evidence": [
              "arckit/tech/arcorbit/installer-supply-chain.md"
            ]
          },
          {
            "id": "IMPACT-20260829-003-003",
            "fact_id": "FACT-20260829-003-002",
            "fact_revision": 1,
            "target": {
              "kind": "software_decision",
              "ref": "technical_foundation",
              "revision": 45
            },
            "effect": "upheld",
            "reason": "Inventory, advisor, update checker, network context, and mutation postconditions are technically recoverable.",
            "gap_ids": [],
            "evidence": [
              "arckit/tech/arcorbit/installer-supply-chain.md"
            ]
          },
          {
            "id": "IMPACT-20260829-003-004",
            "fact_id": "FACT-20260829-003-003",
            "fact_revision": 1,
            "target": {
              "kind": "software_invariant",
              "ref": "accepted-facts-are-realized",
              "revision": null
            },
            "effect": "threatened",
            "reason": "Production code does not yet realize the accepted lifecycle contract.",
            "gap_ids": [
              "GAP-20260829-003-002",
              "GAP-20260829-003-003"
            ],
            "evidence": [
              "runtime/arcorbit/src/codex-setup-manager.mjs"
            ]
          },
          {
            "id": "IMPACT-20260829-003-005",
            "fact_id": "FACT-20260829-003-003",
            "fact_revision": 1,
            "target": {
              "kind": "software_invariant",
              "ref": "material-risks-have-credible-evidence",
              "revision": null
            },
            "effect": "threatened",
            "reason": "False-negative detection, wrong-owner mutation, proxy failure classification, and shadowed updates still require repeatable implementation evidence.",
            "gap_ids": [
              "GAP-20260829-003-002",
              "GAP-20260829-003-003"
            ],
            "evidence": [
              "runtime/arcorbit/test/codex-setup-manager.test.mjs"
            ]
          }
        ],
        "impacts_updated": [],
        "gaps_added": [
          {
            "id": "GAP-20260829-003-002",
            "status": "open",
            "goal": "Implement and verify source-aware Codex installation inventory, install advice, update checks, owner-specific mutations, proxy propagation, and mutation postconditions in the ArcOrbit main process.",
            "reason": "The stable lifecycle contract is authoritative, while the current resolver and setup manager still expose a single selected probe and standalone-only managed update path.",
            "derived_from": [
              "FACT-20260829-003-002",
              "FACT-20260829-003-003"
            ],
            "blocked_by": [],
            "priority_basis": {
              "blocking": "high",
              "risk": "high",
              "user_impact": "high"
            },
            "responsibility": "agent",
            "evidence_required": [
              "runtime/arcorbit/src/codex-executable-resolver.mjs",
              "runtime/arcorbit/src/codex-setup-manager.mjs",
              "runtime/arcorbit/test/codex-executable-resolver.test.mjs",
              "runtime/arcorbit/test/codex-setup-manager.test.mjs"
            ],
            "resolution": null
          },
          {
            "id": "GAP-20260829-003-003",
            "status": "open",
            "goal": "Expose and verify installation inventory, recommendation, source, current/latest version, update-check failure, conflict, and owner-specific recovery in Setup Readiness.",
            "reason": "The stable interaction states require the Desktop UI and typed IPC to present the new backend model without collapsing healthy, missing, broken, and check-failed states.",
            "derived_from": [
              "FACT-20260829-003-002"
            ],
            "blocked_by": [
              "GAP-20260829-003-002"
            ],
            "priority_basis": {
              "blocking": "medium",
              "risk": "medium",
              "user_impact": "high"
            },
            "responsibility": "agent",
            "evidence_required": [
              "runtime/arcorbit/src/desktop-setup-readiness-context.mjs",
              "runtime/arcorbit/desktop/renderer/renderer.js",
              "runtime/arcorbit/test/codex-setup-ipc.test.mjs"
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
            "observed_revision": 39,
            "set_decision": {
              "status": "settled",
              "statement": "ArcOrbit 保留既有 Desktop、Runtime、Chat、Automation、Feedback 与 Work 能力和边界。Work 是 Workshop 待办同步与本地 Task Projection 的唯一客户端所有者；新建和编辑 Sheet 提供完整七状态，编辑 Sheet 是异常纠偏兜底，Inspector 按当前状态提供有限下一步动作。Work Inspector 默认更宽，支持可访问拖拽调宽与跨应用重启恢复，并使用内容、紧凑属性、协作和验收语义分区。Work 编辑待办允许把内容复制到当前产品集内另一个可写产品，并在目标创建获 Workshop 确认后删除源 Task。目标 Task 获得新身份，仅复制正文、状态、优先级及目标产品内重新选择的关联字段，不继承评论、附件、Run、session、thread、Gate 或验收问题。Work 负责两阶段 mutation 和部分成功恢复；Automation 只消费服务器确认后的本地状态。Setup Readiness 在应用冷启动时 fresh-check Desktop Store 中全部已关联本地项目相对于内置 payload 的 skill drift；新增或改变本地项目关联及用户主动重试会再次检查。项目集、具体项目、Workset 等纯查看切换、解除关联和 task start 不重新扫描 skills，task start 只消费已验证缓存并 fail closed。trusted Case binding 的既有能力和边界保持不变。Setup Readiness 对同名项目 skill、loader、共享资源和用户按需 catalog 冲突保留 typed diagnostic；当 provider 证明安全目标与唯一内置来源时，用户可逐项选择“备份并使用当前应用包覆盖所选同名 skill”，未选和无关内容保持不变。Feedback 中已忽略且未关联待办的反馈可恢复为待处理，恢复只在服务端确认 pending 后生效。 Today、Work、Automation 与 Organization 必须从同一可访问 Project Catalog 得到项目身份；项目存在、项目绑定、同步就绪和执行资格彼此独立，项目详情同步失败不得使项目消失。 Codex Setup 维护完整 installation inventory 与唯一 active binding，按 execution scope 和 owner 证明选择既有安装、生成安装建议、检查更新并在 mutation 后复验实际 executable；更新查询失败不把健康 Codex 降级为未安装。",
              "reason": "操作者确认的安装与更新升级已经形成稳定产品规格。",
              "evidence": [
                "Current operator input, 2026-08-27",
                "arckit/spec/agentic-software-development/arcorbit-platform-capabilities.md",
                "arckit/interaction/platform-workspace/interaction.md",
                "arckit/spec/agentic-software-development/arcorbit-work-management.md",
                "arckit/interaction/automation-workspace/interaction.md",
                "arckit/tech/arcorbit/realtime-synchronization-solution.md",
                "arckit/spec/arcorbit-distribution.md"
              ],
              "confidence": "high",
              "resume_condition": "当 Codex 官方安装渠道、owner 语义、execution scope 或 Setup 生命周期改变时重审。",
              "revision": 39
            },
            "gap_refs": [],
            "reason": "本轮建立了完整 Codex 安装和更新产品能力。",
            "evidence": [
              "arckit/spec/arcorbit-distribution.md"
            ]
          },
          {
            "area_ref": "external_integrations",
            "observed_revision": 13,
            "set_decision": {
              "status": "settled",
              "statement": "ArcOrbit 继续通过显式 main-process adapters 集成 Codex app-server/CLI、Workshop 和 Feedback，并保持 Renderer 无凭据、无通用请求能力。真实 Chat 使用可复用的 Codex Conversation 基础层处理 app-server initialize、persistent thread start/resume、turn start/interrupt、streamed items、token usage 和 approval request；ChatCoordinator 直接提交用户文本，不设置 Agent Loop output schema，也不调用 state-driven Runtime、trusted ledger 或 Automation Coordinator。Workshop Task Source 与 realtime adapter 只服务 main-process Work Sync；Work Sync 负责订阅范围、REST 对账、mutation 和本地投影发布，Automation 不直接集成 Workshop。Feedback V2 和产品反馈 SDK 的既有契约与恢复行为保持不变。Workshop Feedback SDK 用户端和 Console 开发者端共同定义双向 V2 消息域；ArcOrbit 对 Workset 项目默认探测开发者能力，列表失败回退 V1，单项失败仅降级对应动作，不用安装包 allowlist 隐藏能力。Feedback V2 的忽略恢复采用固定 POST /feedbacks/{id}/restore 领域合约，仅允许 ignored 原子进入 pending；缺少 provider 合约时失败关闭，不通过通用 update 或 Renderer 本地状态伪装成功。Codex Setup 额外通过固定 main-process allowlist 集成 OpenAI 官方 macOS/Linux/Windows standalone installer 和 codex login、login status、logout 接口；网络、权限、process、capability 与 status 失败分别恢复，Renderer 不能提供 URL、argv、environment 或 shell。 Codex Setup 通过固定 main-process adapters 集成 OpenAI standalone release channel、exact npm registry context、exact Homebrew cask context 与明确 WSL distro transport；所有网络操作复用脱敏代理 context，Renderer 不能提供 URL、package spec、registry、cask、argv、environment 或 shell。",
              "reason": "来源感知更新要求每个外部 owner 具有固定且可证明的 adapter 边界。",
              "evidence": [
                "arckit/tech/arcorbit/platform-composition-solution.md",
                "runtime/arcorbit/src/workshop-platform-adapter.mjs",
                "/Users/Glare/Library/Developer/ModularProgram/hoewo/Workshop-Feedbacks/webapps/feedback-console-web/src/lib/api/feedbackV2Client.ts",
                "arckit/tech/arcorbit/installer-supply-chain.md"
              ],
              "confidence": "high",
              "resume_condition": "当 Codex 官方发布源、npm/Homebrew 命令契约、WSL transport 或代理边界改变时重审。",
              "revision": 13
            },
            "gap_refs": [],
            "reason": "本轮明确了 owner-specific external adapters。",
            "evidence": [
              "arckit/tech/arcorbit/installer-supply-chain.md"
            ]
          },
          {
            "area_ref": "technical_foundation",
            "observed_revision": 44,
            "set_decision": {
              "status": "settled",
              "statement": "Arckit 与 ArcOrbit 的既有 ledger、Electron、Runtime、Platform Coordinator、Work Sync、Chat、Setup Readiness 和 trusted case-control 技术边界保持不变。Work Inspector 偏好继续由 Desktop Store、typed preload action 和 Renderer 持有。应用冷启动的 coordinated Setup Readiness 由 main process fresh-read Desktop Store 中全部本地 Product Workspace roots；新增或改变本地关联及用户主动 retry 使用相同 aggregate check，显式空 roots 清除既有 project plan 并执行 global-only。Renderer 项目/Workset 筛选不触发检查，解除关联跳过检查。SkillProvisioningManager.assertReady(projectRoot) 只读取内存 snapshot，要求 ready 且 project root 位于最近成功检查的 plan.project_roots；Chat/Automation task start 不调用 provider 或扫描 skills。SkillProvisioningManager 的 plan、drift、同名冲突诊断和 backup-and-overwrite-selected 事务边界保持不变。Feedback V1 恢复通过受控 update 同时写入 ignored=false、feedback_state=pending 和 status=analyzing；V2 恢复由 Platform Adapter、Coordinator、main IPC、preload 和 Renderer 的 restoreFeedbackV2 typed action 链调用固定 provider route，并只在服务端确认后刷新投影。新版启动必须执行有代际的 rehydration：规范化旧 Store、刷新可访问 Catalog、按需求集合协调对账并在 dispatch 前只开放健康项目。任务与标签独立确认；重建期间新增需求必须触发后续一轮，不能被进行中的 reconcile 吞掉。Case/Loop 继续保留 external_wait 作为内部停止原因；Automation Coordinator 将其确定性投影为 awaiting_human + external_dependency，Store 迁移旧 external_wait 并补建 attention，typed confirm-external-dependency IPC 校验 execution 后复用原 session/thread。Workset Feedback V2 notification snapshot 与 `/feedbacks/{id}/messages` 是两个独立新鲜度域；Renderer 以当前 feedback id、未读投影和有身份的会话加载状态协调刷新，不把 refreshSnapshot 视为消息已刷新。消息请求必须去重或隔离过期响应，并在成功投影消息后才调用 typed mark-read；失败不清除缓存消息或草稿。 Codex setup 将完整 InstallationInventory、active binding、InstallAdvisor、UpdateChecker、owner adapter 与 SetupNetworkContext 分层；路径分类仅作 hint，mutation 需要 owner proof，并以完整 inventory refresh 和 exact version/binding postcondition 判定成功。",
              "reason": "原单一 resolver 结果不足以安全支持多来源安装和更新。",
              "evidence": [
                "runtime/arcorbit/desktop/renderer/renderer.js:2324",
                "runtime/arcorbit/desktop/renderer/renderer.js:2380",
                "runtime/arcorbit/desktop/renderer/renderer.js:2514",
                "runtime/arcorbit/src/platform-coordinator.mjs:23",
                "runtime/arcorbit/src/workshop-platform-adapter.mjs:124",
                "arckit/tech/arcorbit/installer-supply-chain.md"
              ],
              "confidence": "high",
              "resume_condition": "当 executable identity、package owner proof、update channel 或 mutation postcondition 改变时重审。",
              "revision": 44
            },
            "gap_refs": [],
            "reason": "本轮明确了 source-aware lifecycle 技术基础。",
            "evidence": [
              "arckit/tech/arcorbit/installer-supply-chain.md"
            ]
          }
        ],
        "software_invariant_changes": [],
        "project_gap_changes": [],
        "selection_context_change": null,
        "evidence": [
          "arckit/spec/arcorbit-distribution.md",
          "arckit/tech/arcorbit/installer-supply-chain.md",
          "arckit/spec/INDEX.md",
          "arckit/tech/INDEX.md"
        ]
      },
      "invariant_assessment": {
        "project_revision": 321,
        "judgments": [
          {
            "invariant_ref": "product-expectations-remain-recoverable",
            "disposition": "upheld",
            "reason": "Installation, recommendation, update, failure, conflict, and recovery semantics are durable in the product source.",
            "fact_refs": [
              "FACT-20260829-003-002"
            ],
            "evidence": [
              "arckit/spec/arcorbit-distribution.md"
            ],
            "gap_refs": []
          },
          {
            "invariant_ref": "interaction-expectations-remain-recoverable",
            "disposition": "upheld",
            "reason": "The product source distinguishes visible missing, broken, check-failed, update, recommendation, and conflict states sufficiently for later UI realization.",
            "fact_refs": [
              "FACT-20260829-003-002"
            ],
            "evidence": [
              "arckit/spec/arcorbit-distribution.md"
            ],
            "gap_refs": []
          },
          {
            "invariant_ref": "visual-language-remains-consistent",
            "disposition": "not_relevant",
            "reason": "This contract round does not establish or change visual presentation rules.",
            "fact_refs": [],
            "evidence": [],
            "gap_refs": []
          },
          {
            "invariant_ref": "technical-decisions-remain-explainable",
            "disposition": "upheld",
            "reason": "Component responsibilities, owner proof, network context, update source, and mutation postconditions are explicit.",
            "fact_refs": [
              "FACT-20260829-003-002"
            ],
            "evidence": [
              "arckit/tech/arcorbit/installer-supply-chain.md"
            ],
            "gap_refs": []
          },
          {
            "invariant_ref": "accepted-facts-are-realized",
            "disposition": "threatened",
            "reason": "The current implementation remains single-binding and standalone-only.",
            "fact_refs": [
              "FACT-20260829-003-003"
            ],
            "evidence": [
              "runtime/arcorbit/src/codex-setup-manager.mjs"
            ],
            "gap_refs": [
              "GAP-20260829-003-002",
              "GAP-20260829-003-003"
            ]
          },
          {
            "invariant_ref": "material-risks-have-credible-evidence",
            "disposition": "threatened",
            "reason": "The accepted safety rules still need backend and UI regression evidence.",
            "fact_refs": [
              "FACT-20260829-003-003"
            ],
            "evidence": [
              "runtime/arcorbit/test/codex-setup-manager.test.mjs"
            ],
            "gap_refs": [
              "GAP-20260829-003-002",
              "GAP-20260829-003-003"
            ]
          }
        ]
      },
      "evidence": [
        "arckit/spec/arcorbit-distribution.md",
        "arckit/tech/arcorbit/installer-supply-chain.md",
        "arckit/spec/INDEX.md",
        "arckit/tech/INDEX.md"
      ],
      "runtime_result_ref": "",
      "occurred_at": "2026-08-29T17:08:30.304Z"
    },
    {
      "round": 2,
      "transition_schema_version": "arckit-case-transition/v8",
      "goal": "Implement and verify the source-aware Codex lifecycle in the ArcOrbit main process.",
      "outcome": "completed",
      "gap_selection": {
        "mode": "candidate",
        "basis": "The backend lifecycle gap is the only ready Case gap and blocks the Setup presentation gap.",
        "snapshot_token": "e42b19ed8a5a9ca736f5d64b4011a77872c18da7346fb1bc4383f8592b730690",
        "selected_ref": "case-gap:CASE-20260829-003:GAP-20260829-003-002",
        "comparison_summary": "Compared the ready backend Case gap with four unrelated Project gaps; the backend gap directly realizes the operator-approved lifecycle and unblocks its presentation gap.",
        "fresh_discovery_summary": "Implementation and tests establish a complete native installation lifecycle; the existing Setup presentation gap becomes the next eligible Case work.",
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
            "reason": "It is unrelated to the active operator-approved Codex lifecycle Case."
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
            "reason": "It is unrelated to the active operator-approved Codex lifecycle Case."
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
            "reason": "It is unrelated to the active operator-approved Codex lifecycle Case."
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
            "reason": "It is unrelated to the active operator-approved Codex lifecycle Case."
          },
          {
            "ref": "case-gap:CASE-20260829-003:GAP-20260829-003-002",
            "source": "persisted",
            "eligibility": "ready",
            "disposition": "selected",
            "priority_basis": {
              "blocking": "high",
              "uncertainty": "",
              "risk": "high",
              "user_impact": "high"
            },
            "reason": "It is the blocking implementation gap and has direct repeatable source and test evidence."
          }
        ]
      },
      "selected_gap": {
        "id": "GAP-20260829-003-002",
        "responsibility": "agent",
        "goal": "Implement and verify source-aware Codex installation inventory, install advice, update checks, owner-specific mutations, proxy propagation, and mutation postconditions in the ArcOrbit main process.",
        "reason": "The stable lifecycle contract is authoritative, while the current resolver and setup manager still expose a single selected probe and standalone-only managed update path.",
        "derived_from": [
          "FACT-20260829-003-002",
          "FACT-20260829-003-003"
        ],
        "blocked_by": [],
        "priority_basis": {
          "blocking": "high",
          "uncertainty": "",
          "risk": "high",
          "user_impact": "high"
        },
        "evidence_required": [
          "runtime/arcorbit/src/codex-executable-resolver.mjs",
          "runtime/arcorbit/src/codex-setup-manager.mjs",
          "runtime/arcorbit/test/codex-executable-resolver.test.mjs",
          "runtime/arcorbit/test/codex-setup-manager.test.mjs"
        ]
      },
      "planned_transition": {
        "goal": "Implement and verify the source-aware Codex lifecycle in the ArcOrbit main process.",
        "expected_state_change": "Discovery preserves all candidates, ownership is metadata-proven, install and update decisions are owner-aware, proxy context is shared, and mutation success requires an exact fresh postcondition."
      },
      "accepted_state_delta": {
        "resolved_gap": {
          "id": "GAP-20260829-003-002",
          "status": "resolved",
          "outcome": "ArcOrbit now maintains a complete native installation inventory, proves owner adapters, advises install methods, checks owner channels, propagates proxy context, persists standalone receipts, and verifies exact update targets.",
          "reason": "The resolver, lifecycle module, setup manager, Desktop network context, receipt store, and focused tests realize the accepted backend contract.",
          "evidence": [
            "runtime/arcorbit/src/codex-executable-resolver.mjs",
            "runtime/arcorbit/src/codex-installation-lifecycle.mjs",
            "runtime/arcorbit/src/codex-owner-receipt-store.mjs",
            "runtime/arcorbit/src/codex-setup-manager.mjs",
            "runtime/arcorbit/desktop/main.mjs",
            "runtime/arcorbit/test/codex-installation-lifecycle.test.mjs",
            "runtime/arcorbit/test/codex-setup-manager.test.mjs"
          ]
        },
        "facts_added": [
          {
            "id": "FACT-20260829-003-004",
            "revision": 1,
            "status": "accepted",
            "statement": "ArcOrbit main-process Codex setup now preserves all independently runnable native candidates, resolves proven npm/Homebrew/managed-standalone ownership, recommends suitable installation methods, checks same-owner latest versions with bounded caching, routes fixed owner mutations through the current proxy context, and fails closed unless fresh target identity and version postconditions hold.",
            "basis": "Direct implementation and focused automated tests across resolver, lifecycle, setup manager, proxy, receipt, and owner mutation boundaries.",
            "evidence": [
              "runtime/arcorbit/src/codex-executable-resolver.mjs",
              "runtime/arcorbit/src/codex-installation-lifecycle.mjs",
              "runtime/arcorbit/src/codex-owner-receipt-store.mjs",
              "runtime/arcorbit/src/codex-setup-manager.mjs",
              "runtime/arcorbit/test/codex-installation-lifecycle.test.mjs",
              "runtime/arcorbit/test/codex-owner-receipt-store.test.mjs",
              "runtime/arcorbit/test/codex-setup-manager.test.mjs"
            ]
          }
        ],
        "facts_superseded": [
          {
            "id": "FACT-20260829-003-003",
            "revision": 1,
            "reason": "The single-binding standalone-only implementation description is no longer current after the backend lifecycle upgrade.",
            "evidence": [
              "runtime/arcorbit/src/codex-installation-lifecycle.mjs",
              "runtime/arcorbit/src/codex-setup-manager.mjs"
            ]
          }
        ],
        "impacts_added": [],
        "impacts_updated": [
          {
            "id": "IMPACT-20260829-003-004",
            "fact_id": "FACT-20260829-003-004",
            "fact_revision": 1,
            "target": {
              "kind": "software_invariant",
              "ref": "accepted-facts-are-realized",
              "revision": null
            },
            "effect": "upheld",
            "reason": "The accepted backend lifecycle model is directly realized by production modules and exact postcondition checks.",
            "gap_ids": [],
            "evidence": [
              "runtime/arcorbit/src/codex-installation-lifecycle.mjs",
              "runtime/arcorbit/src/codex-setup-manager.mjs"
            ]
          },
          {
            "id": "IMPACT-20260829-003-005",
            "fact_id": "FACT-20260829-003-004",
            "fact_revision": 1,
            "target": {
              "kind": "software_invariant",
              "ref": "material-risks-have-credible-evidence",
              "revision": null
            },
            "effect": "upheld",
            "reason": "False-negative discovery, path-only ownership, wrong-owner mutation, stale target, proxy, and update-check failure boundaries have focused repeatable tests.",
            "gap_ids": [],
            "evidence": [
              "runtime/arcorbit/test/codex-executable-resolver.test.mjs",
              "runtime/arcorbit/test/codex-installation-lifecycle.test.mjs",
              "runtime/arcorbit/test/codex-setup-manager.test.mjs"
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
        "evidence": [
          "runtime/arcorbit/src/codex-installation-lifecycle.mjs",
          "runtime/arcorbit/src/codex-setup-manager.mjs"
        ]
      },
      "invariant_assessment": {
        "project_revision": 322,
        "judgments": [
          {
            "invariant_ref": "product-expectations-remain-recoverable",
            "disposition": "upheld",
            "reason": "The authoritative product lifecycle remains aligned with the backend realization.",
            "fact_refs": [
              "FACT-20260829-003-002",
              "FACT-20260829-003-004"
            ],
            "evidence": [
              "arckit/spec/arcorbit-distribution.md"
            ],
            "gap_refs": []
          },
          {
            "invariant_ref": "interaction-expectations-remain-recoverable",
            "disposition": "not_relevant",
            "reason": "This transition accepts backend lifecycle realization; Setup presentation remains a separate open gap.",
            "fact_refs": [],
            "evidence": [],
            "gap_refs": []
          },
          {
            "invariant_ref": "visual-language-remains-consistent",
            "disposition": "not_relevant",
            "reason": "This backend transition does not establish or alter a durable visual-language rule.",
            "fact_refs": [],
            "evidence": [],
            "gap_refs": []
          },
          {
            "invariant_ref": "technical-decisions-remain-explainable",
            "disposition": "upheld",
            "reason": "Inventory, owner proof, update adapters, proxy context, receipts, and postconditions remain explicit and documented.",
            "fact_refs": [
              "FACT-20260829-003-004"
            ],
            "evidence": [
              "arckit/tech/arcorbit/installer-supply-chain.md",
              "runtime/arcorbit/src/codex-installation-lifecycle.mjs"
            ],
            "gap_refs": []
          },
          {
            "invariant_ref": "accepted-facts-are-realized",
            "disposition": "upheld",
            "reason": "Production source directly realizes the backend fact accepted in this transition.",
            "fact_refs": [
              "FACT-20260829-003-004"
            ],
            "evidence": [
              "runtime/arcorbit/src/codex-executable-resolver.mjs",
              "runtime/arcorbit/src/codex-setup-manager.mjs"
            ],
            "gap_refs": []
          },
          {
            "invariant_ref": "material-risks-have-credible-evidence",
            "disposition": "upheld",
            "reason": "Focused automated tests cover the material backend lifecycle risks proportionately.",
            "fact_refs": [
              "FACT-20260829-003-004"
            ],
            "evidence": [
              "runtime/arcorbit/test/codex-installation-lifecycle.test.mjs",
              "runtime/arcorbit/test/codex-setup-manager.test.mjs"
            ],
            "gap_refs": []
          }
        ]
      },
      "evidence": [
        "runtime/arcorbit/src/codex-executable-resolver.mjs",
        "runtime/arcorbit/src/codex-installation-lifecycle.mjs",
        "runtime/arcorbit/src/codex-owner-receipt-store.mjs",
        "runtime/arcorbit/src/codex-setup-manager.mjs",
        "runtime/arcorbit/test/codex-installation-lifecycle.test.mjs",
        "runtime/arcorbit/test/codex-setup-manager.test.mjs"
      ],
      "runtime_result_ref": "",
      "occurred_at": "2026-08-29T17:37:56.838Z"
    },
    {
      "round": 3,
      "transition_schema_version": "arckit-case-transition/v8",
      "goal": "Expose and verify the source-aware Codex lifecycle in Setup Readiness.",
      "outcome": "completed",
      "gap_selection": {
        "mode": "candidate",
        "basis": "The Setup presentation gap is now the only ready Case gap after backend lifecycle acceptance.",
        "snapshot_token": "008ee6436e10172c429075f867e2d57b565c0a0137556e6b37a12d9d53f4eedf",
        "selected_ref": "case-gap:CASE-20260829-003:GAP-20260829-003-003",
        "comparison_summary": "Compared the ready Setup presentation gap with four unrelated Project gaps; it is the remaining operator-approved Case obligation.",
        "fresh_discovery_summary": "No additional implementation gap emerged; completion review remains after accepting the typed UI and interaction evidence.",
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
            "reason": "It is unrelated to the active Codex lifecycle Case."
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
            "reason": "It is unrelated to the active Codex lifecycle Case."
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
            "reason": "It is unrelated to the active Codex lifecycle Case."
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
            "reason": "It is unrelated to the active Codex lifecycle Case."
          },
          {
            "ref": "case-gap:CASE-20260829-003:GAP-20260829-003-003",
            "source": "persisted",
            "eligibility": "ready",
            "disposition": "selected",
            "priority_basis": {
              "blocking": "medium",
              "uncertainty": "",
              "risk": "medium",
              "user_impact": "high"
            },
            "reason": "It is the final Case implementation obligation and now has typed UI, IPC, interaction, and automated evidence."
          }
        ]
      },
      "selected_gap": {
        "id": "GAP-20260829-003-003",
        "responsibility": "agent",
        "goal": "Expose and verify installation inventory, recommendation, source, current/latest version, update-check failure, conflict, and owner-specific recovery in Setup Readiness.",
        "reason": "The stable interaction states require the Desktop UI and typed IPC to present the new backend model without collapsing healthy, missing, broken, and check-failed states.",
        "derived_from": [
          "FACT-20260829-003-002"
        ],
        "blocked_by": [
          "GAP-20260829-003-002"
        ],
        "priority_basis": {
          "blocking": "medium",
          "uncertainty": "",
          "risk": "medium",
          "user_impact": "high"
        },
        "evidence_required": [
          "runtime/arcorbit/src/desktop-setup-readiness-context.mjs",
          "runtime/arcorbit/desktop/renderer/renderer.js",
          "runtime/arcorbit/test/codex-setup-ipc.test.mjs"
        ]
      },
      "planned_transition": {
        "goal": "Expose and verify the source-aware Codex lifecycle in Setup Readiness.",
        "expected_state_change": "Users can distinguish inventory, active owner, installed/latest versions, install advice, update consultation failures, owner-specific actions, and explicit standalone adoption through typed confirmed actions."
      },
      "accepted_state_delta": {
        "resolved_gap": {
          "id": "GAP-20260829-003-003",
          "status": "resolved",
          "outcome": "Setup Readiness now presents active and shadowed installations, owner confidence, installed/latest versions, suitable install methods, update-check recovery, owner-specific update, and explicit standalone management confirmation.",
          "reason": "Renderer, preload, main-process confirmation, typed IPC, interaction facts, and UI-focused automated tests agree on the new lifecycle states.",
          "evidence": [
            "arckit/interaction/setup-readiness/interaction.md",
            "runtime/arcorbit/desktop/renderer/index.html",
            "runtime/arcorbit/desktop/renderer/renderer.js",
            "runtime/arcorbit/src/desktop/codex-setup-ipc.mjs",
            "runtime/arcorbit/test/codex-setup-ipc.test.mjs",
            "runtime/arcorbit/test/desktop-renderer.test.mjs"
          ]
        },
        "facts_added": [
          {
            "id": "FACT-20260829-003-005",
            "revision": 1,
            "status": "accepted",
            "statement": "ArcOrbit Setup Readiness now exposes the complete Codex installation inventory and active selection reason, owner/confidence, installed and latest versions, install recommendations, independent update states, owner-specific update controls, manual refresh, and explicit inferred-standalone adoption through confirmation-bound typed IPC.",
            "basis": "Direct interaction implementation and automated IPC/Renderer contract evidence.",
            "evidence": [
              "arckit/interaction/setup-readiness/interaction.md",
              "runtime/arcorbit/desktop/renderer/index.html",
              "runtime/arcorbit/desktop/renderer/renderer.js",
              "runtime/arcorbit/src/desktop/codex-setup-ipc.mjs",
              "runtime/arcorbit/test/codex-setup-ipc.test.mjs",
              "runtime/arcorbit/test/desktop-renderer.test.mjs"
            ]
          }
        ],
        "facts_superseded": [],
        "impacts_added": [
          {
            "id": "IMPACT-20260829-003-006",
            "fact_id": "FACT-20260829-003-005",
            "fact_revision": 1,
            "target": {
              "kind": "software_decision",
              "ref": "experience_and_interaction",
              "revision": 62
            },
            "effect": "upheld",
            "reason": "The Setup interaction now gives users explicit source-aware state, choices, confirmations, and recovery without exposing arbitrary execution input.",
            "gap_ids": [],
            "evidence": [
              "arckit/interaction/setup-readiness/interaction.md",
              "runtime/arcorbit/desktop/renderer/renderer.js"
            ]
          }
        ],
        "impacts_updated": [],
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
        "evidence": [
          "arckit/interaction/setup-readiness/interaction.md",
          "runtime/arcorbit/desktop/renderer/renderer.js"
        ]
      },
      "invariant_assessment": {
        "project_revision": 322,
        "judgments": [
          {
            "invariant_ref": "product-expectations-remain-recoverable",
            "disposition": "upheld",
            "reason": "The user-visible lifecycle remains aligned with the authoritative product states.",
            "fact_refs": [
              "FACT-20260829-003-002",
              "FACT-20260829-003-005"
            ],
            "evidence": [
              "arckit/spec/arcorbit-distribution.md"
            ],
            "gap_refs": []
          },
          {
            "invariant_ref": "interaction-expectations-remain-recoverable",
            "disposition": "upheld",
            "reason": "Inventory, advice, update, failure, confirmation, and adoption states are durably specified and implemented.",
            "fact_refs": [
              "FACT-20260829-003-005"
            ],
            "evidence": [
              "arckit/interaction/setup-readiness/interaction.md",
              "runtime/arcorbit/desktop/renderer/renderer.js"
            ],
            "gap_refs": []
          },
          {
            "invariant_ref": "visual-language-remains-consistent",
            "disposition": "not_relevant",
            "reason": "The implementation reuses existing Setup surfaces and tokens without establishing a new durable visual-language rule.",
            "fact_refs": [],
            "evidence": [],
            "gap_refs": []
          },
          {
            "invariant_ref": "technical-decisions-remain-explainable",
            "disposition": "upheld",
            "reason": "Renderer input remains bounded by confirmation-bound typed IPC and fixed main-process adapters.",
            "fact_refs": [
              "FACT-20260829-003-004",
              "FACT-20260829-003-005"
            ],
            "evidence": [
              "runtime/arcorbit/src/desktop/codex-setup-ipc.mjs",
              "runtime/arcorbit/desktop/main.mjs"
            ],
            "gap_refs": []
          },
          {
            "invariant_ref": "accepted-facts-are-realized",
            "disposition": "upheld",
            "reason": "The accepted UI lifecycle fact is directly realized by Renderer and IPC source.",
            "fact_refs": [
              "FACT-20260829-003-005"
            ],
            "evidence": [
              "runtime/arcorbit/desktop/renderer/renderer.js",
              "runtime/arcorbit/src/desktop/codex-setup-ipc.mjs"
            ],
            "gap_refs": []
          },
          {
            "invariant_ref": "material-risks-have-credible-evidence",
            "disposition": "upheld",
            "reason": "Typed confirmation authority, method binding, update refresh, and bounded UI exposure have focused automated coverage.",
            "fact_refs": [
              "FACT-20260829-003-005"
            ],
            "evidence": [
              "runtime/arcorbit/test/codex-setup-ipc.test.mjs",
              "runtime/arcorbit/test/desktop-renderer.test.mjs"
            ],
            "gap_refs": []
          }
        ]
      },
      "evidence": [
        "arckit/interaction/setup-readiness/interaction.md",
        "runtime/arcorbit/desktop/renderer/index.html",
        "runtime/arcorbit/desktop/renderer/renderer.js",
        "runtime/arcorbit/src/desktop/codex-setup-ipc.mjs",
        "runtime/arcorbit/test/codex-setup-ipc.test.mjs",
        "runtime/arcorbit/test/desktop-renderer.test.mjs"
      ],
      "runtime_result_ref": "",
      "occurred_at": "2026-08-29T17:40:52.136Z"
    },
    {
      "round": 4,
      "transition_schema_version": "arckit-case-transition/v8",
      "goal": "Review the complete Codex installation and update lifecycle implementation.",
      "outcome": "completed",
      "gap_selection": {
        "mode": "candidate",
        "basis": "All ordinary Case gaps are resolved and the deterministic completion-review candidate is ready.",
        "snapshot_token": "051bd2dba27f77dcade7640e22cb724bcedc7191fb6183813db8291e8801782c",
        "selected_ref": "case-gap:CASE-20260829-003:CASE-20260829-003:completion-review:1",
        "comparison_summary": "Compared the required completion review with four unrelated Project gaps; review is the only remaining Case obligation.",
        "fresh_discovery_summary": "Review found no implementation defect or missing operator outcome; two unrelated Electron fixtures remain unverified only because sandbox-external execution was not authorized.",
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
            "reason": "It is unrelated to completion of the active Codex lifecycle Case."
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
            "reason": "It is unrelated to completion of the active Codex lifecycle Case."
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
            "reason": "It is unrelated to completion of the active Codex lifecycle Case."
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
            "reason": "It is unrelated to completion of the active Codex lifecycle Case."
          },
          {
            "ref": "case-gap:CASE-20260829-003:CASE-20260829-003:completion-review:1",
            "source": "persisted",
            "eligibility": "ready",
            "disposition": "selected",
            "priority_basis": {
              "blocking": "high",
              "uncertainty": "low",
              "risk": "high",
              "user_impact": "high"
            },
            "reason": "It is the required final review after all implementation gaps and state impacts closed."
          }
        ]
      },
      "selected_gap": {
        "id": "CASE-20260829-003:completion-review:1",
        "responsibility": "agent",
        "goal": "Review the completed implementation for correctness, real problem resolution, verification credibility, regression risk, and minimality.",
        "reason": "All ordinary Case gaps and state impacts are closed.",
        "derived_from": [
          "case_result",
          "content_revision:3"
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
        "goal": "Review the complete Codex installation and update lifecycle implementation.",
        "expected_state_change": "The Case closes only if implementation, problem resolution, verification, regression risk, and minimality are all clean."
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
          "reviewed_content_revision": 3,
          "dimensions": {
            "implementation_correctness": "clean",
            "problem_resolution": "clean",
            "verification_credibility": "clean",
            "regression_risk": "clean",
            "minimality": "clean"
          },
          "findings": [],
          "evidence": [
            "runtime/arcorbit/test/codex-installation-lifecycle.test.mjs",
            "runtime/arcorbit/test/codex-owner-receipt-store.test.mjs",
            "runtime/arcorbit/test/codex-executable-resolver.test.mjs",
            "runtime/arcorbit/test/codex-setup-manager.test.mjs",
            "runtime/arcorbit/test/codex-setup-ipc.test.mjs",
            "runtime/arcorbit/test/desktop-renderer.test.mjs",
            "/tmp/arcorbit-codex-validation.log",
            "/tmp/arcorbit-codex-check.log"
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
        "evidence": [
          "runtime/arcorbit/README.md",
          "arckit/spec/arcorbit-distribution.md",
          "arckit/tech/arcorbit/installer-supply-chain.md",
          "arckit/interaction/setup-readiness/interaction.md"
        ]
      },
      "invariant_assessment": {
        "project_revision": 322,
        "judgments": [
          {
            "invariant_ref": "product-expectations-remain-recoverable",
            "disposition": "upheld",
            "reason": "The final implementation remains aligned with the authoritative install and update product contract.",
            "fact_refs": [
              "FACT-20260829-003-002",
              "FACT-20260829-003-004",
              "FACT-20260829-003-005"
            ],
            "evidence": [
              "arckit/spec/arcorbit-distribution.md"
            ],
            "gap_refs": []
          },
          {
            "invariant_ref": "interaction-expectations-remain-recoverable",
            "disposition": "upheld",
            "reason": "The complete Setup journey and recovery states remain durably specified and implemented.",
            "fact_refs": [
              "FACT-20260829-003-005"
            ],
            "evidence": [
              "arckit/interaction/setup-readiness/interaction.md",
              "runtime/arcorbit/desktop/renderer/renderer.js"
            ],
            "gap_refs": []
          },
          {
            "invariant_ref": "visual-language-remains-consistent",
            "disposition": "not_relevant",
            "reason": "The Case introduces no new durable visual-language decision and reuses existing Setup styles.",
            "fact_refs": [],
            "evidence": [],
            "gap_refs": []
          },
          {
            "invariant_ref": "technical-decisions-remain-explainable",
            "disposition": "upheld",
            "reason": "The final inventory, owner, network, mutation, IPC, and receipt boundaries are documented and traceable.",
            "fact_refs": [
              "FACT-20260829-003-004",
              "FACT-20260829-003-005"
            ],
            "evidence": [
              "arckit/tech/arcorbit/installer-supply-chain.md",
              "runtime/arcorbit/src/codex-installation-lifecycle.mjs"
            ],
            "gap_refs": []
          },
          {
            "invariant_ref": "accepted-facts-are-realized",
            "disposition": "upheld",
            "reason": "Backend and Setup presentation facts are realized by production source and typed actions.",
            "fact_refs": [
              "FACT-20260829-003-004",
              "FACT-20260829-003-005"
            ],
            "evidence": [
              "runtime/arcorbit/src/codex-setup-manager.mjs",
              "runtime/arcorbit/desktop/renderer/renderer.js"
            ],
            "gap_refs": []
          },
          {
            "invariant_ref": "material-risks-have-credible-evidence",
            "disposition": "upheld",
            "reason": "All changed lifecycle boundaries have focused passing tests; the two full-suite failures are unrelated Electron launch SIGABRTs caused by sandbox execution, not assertion failures.",
            "fact_refs": [
              "FACT-20260829-003-004",
              "FACT-20260829-003-005"
            ],
            "evidence": [
              "/tmp/arcorbit-codex-validation.log",
              "/tmp/arcorbit-codex-check.log"
            ],
            "gap_refs": []
          }
        ]
      },
      "evidence": [
        "runtime/arcorbit/src/codex-installation-lifecycle.mjs",
        "runtime/arcorbit/src/codex-setup-manager.mjs",
        "runtime/arcorbit/desktop/renderer/renderer.js",
        "/tmp/arcorbit-codex-validation.log",
        "/tmp/arcorbit-codex-check.log"
      ],
      "runtime_result_ref": "",
      "occurred_at": "2026-08-29T17:43:21.909Z"
    }
  ],
  "case_resolution": {
    "status": "resolved",
    "stage": "resolved",
    "satisfied": [
      "GAP-20260829-003-001",
      "GAP-20260829-003-002",
      "GAP-20260829-003-003"
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
    "updated_at": "2026-08-29T17:43:21.909Z"
  }
}
```

## Round Notes

- Case history is canonical in Structured Record.rounds; keep prose notes exceptional.
