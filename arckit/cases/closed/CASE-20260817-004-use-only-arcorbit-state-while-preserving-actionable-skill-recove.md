# Use only ArcOrbit state while preserving actionable skill recovery

Case: CASE-20260817-004
Status: closed
Artifact Type: mixed
Selected Gap: none
Updated: 2026-08-17T15:51:35.610Z

## User Intent

Remove compatibility with the legacy @arckit/runtime Desktop state and make the canonical @arckit/arcorbit state independently recover existing skill anomalies through explicit safe actions.

## Structured Record

```json
{
  "schema_version": "development-case-record/v5",
  "id": "CASE-20260817-004",
  "title": "Use only ArcOrbit state while preserving actionable skill recovery",
  "status": "closed",
  "artifact_type": "mixed",
  "created_at": "2026-08-17T15:44:06.933Z",
  "updated_at": "2026-08-17T15:51:35.610Z",
  "user_intent": "Remove compatibility with the legacy @arckit/runtime Desktop state and make the canonical @arckit/arcorbit state independently recover existing skill anomalies through explicit safe actions.",
  "expected_outcome": "ArcOrbit uses only its new userData identity; a changed skill with no relation is classified as recoverable, can be backed up and reinstalled from the current bundle, establishes a new relation, and reaches ready without consulting or migrating legacy Runtime state.",
  "project_state_ref": "arckit/project/state.record.json",
  "current_round": {
    "goal": "",
    "selected_gap": null
  },
  "facts": [
    {
      "id": "FACT-ARCORBIT-NEW-STATE-ONLY",
      "revision": 1,
      "status": "accepted",
      "statement": "ArcOrbit must use its canonical new Electron userData identity @arckit/arcorbit without reading, migrating, or reusing the legacy @arckit/runtime Desktop state; when existing skills are anomalous under the new identity, Setup Readiness must provide a safe recovery action that makes them usable.",
      "basis": "Explicit user correction after testing the local installer on 2026-08-17.",
      "evidence": [
        "Current user direction dated 2026-08-17: only handle the new ArcOrbit state; do not retain legacy compatibility; detected anomalies must be recoverable and usable."
      ]
    },
    {
      "id": "FACT-ARCORBIT-NEW-STATE-IMPLEMENTED",
      "revision": 1,
      "status": "accepted",
      "statement": "ArcOrbit binds Electron userData exclusively to appData/@arckit/arcorbit and does not read, migrate, or reuse the legacy @arckit/runtime Desktop state.",
      "basis": "Runtime implementation, stable technical source, identity tests, and packaged app.asar inspection agree.",
      "evidence": [
        "ArcOrbit main binds Electron userData exclusively to appData/@arckit/arcorbit through canonicalArcOrbitUserDataPath; package app.asar contains the canonical function and @arckit/arcorbit identity and no @arckit/runtime state binding.",
        "arckit/tech/arcorbit/installer-supply-chain.md",
        "runtime/arcorbit/test/desktop-user-data.test.mjs"
      ]
    },
    {
      "id": "FACT-ARCORBIT-NEW-STATE-RECOVERY-VERIFIED",
      "revision": 1,
      "status": "accepted",
      "statement": "When the new ArcOrbit consumer has no relation and an existing skill differs, Setup Readiness exposes backup-and-reinstall from the current bundle; confirmed recovery preserves a backup, establishes a new ArcOrbit relation, and converges to ready without consulting or changing the legacy relation.",
      "basis": "Automated manager coverage and a disposable packaged-resource end-to-end reproduction.",
      "evidence": [
        "Focused Setup Readiness, renderer, distribution, and identity suite passed 19/19; the full ArcOrbit check passed 196 tests with one explicit Electron layout skip and zero failures.",
        "Packaged-resource disposable reproduction kept one legacy relation unchanged, observed zero initial ArcOrbit relations, classified arckit-development-ledger as unmanaged-conflict, exposed current-bundle-reinstall, established one ArcOrbit relation, and converged to ready.",
        "Unsigned local DMG runtime/arcorbit/release/ArcOrbit-0.1.0-local.20260817154730-local-20260817154730-mac-x64.dmg has SHA-256 2e9ef93bfecb37708baa83b5ae1bf1f530b07852b4f4bc22b7d600f8c7294ee0."
      ]
    }
  ],
  "state_impacts": [
    {
      "id": "IMPACT-ARCORBIT-NEW-STATE-INTERACTION",
      "fact_id": "FACT-ARCORBIT-NEW-STATE-ONLY",
      "fact_revision": 1,
      "target": {
        "kind": "software_decision",
        "ref": "experience_and_interaction",
        "revision": 9
      },
      "effect": "upheld",
      "reason": "Setup Readiness now uses only the current ArcOrbit identity and exposes the provider-backed fallback when that identity lacks a relation.",
      "gap_ids": [],
      "evidence": [
        "arckit/interaction/setup-readiness/interaction.md",
        "arckit/interaction/setup-readiness/default.html",
        "Packaged-resource disposable reproduction kept one legacy relation unchanged, observed zero initial ArcOrbit relations, classified arckit-development-ledger as unmanaged-conflict, exposed current-bundle-reinstall, established one ArcOrbit relation, and converged to ready."
      ]
    },
    {
      "id": "IMPACT-ARCORBIT-NEW-STATE-TECHNICAL",
      "fact_id": "FACT-ARCORBIT-NEW-STATE-ONLY",
      "fact_revision": 1,
      "target": {
        "kind": "software_decision",
        "ref": "technical_foundation",
        "revision": 15
      },
      "effect": "upheld",
      "reason": "Implementation and technical source consistently use the canonical @arckit/arcorbit identity without legacy state reuse.",
      "gap_ids": [],
      "evidence": [
        "arckit/tech/arcorbit/installer-supply-chain.md",
        "ArcOrbit main binds Electron userData exclusively to appData/@arckit/arcorbit through canonicalArcOrbitUserDataPath; package app.asar contains the canonical function and @arckit/arcorbit identity and no @arckit/runtime state binding."
      ]
    },
    {
      "id": "IMPACT-ARCORBIT-NEW-STATE-REALIZATION",
      "fact_id": "FACT-ARCORBIT-NEW-STATE-ONLY",
      "fact_revision": 1,
      "target": {
        "kind": "software_invariant",
        "ref": "accepted-facts-are-realized",
        "revision": null
      },
      "effect": "upheld",
      "reason": "The local package realizes the new-state-only boundary and recovers a changed unowned skill to ready.",
      "gap_ids": [],
      "evidence": [
        "Focused Setup Readiness, renderer, distribution, and identity suite passed 19/19; the full ArcOrbit check passed 196 tests with one explicit Electron layout skip and zero failures.",
        "Packaged-resource disposable reproduction kept one legacy relation unchanged, observed zero initial ArcOrbit relations, classified arckit-development-ledger as unmanaged-conflict, exposed current-bundle-reinstall, established one ArcOrbit relation, and converged to ready.",
        "Unsigned local DMG runtime/arcorbit/release/ArcOrbit-0.1.0-local.20260817154730-local-20260817154730-mac-x64.dmg has SHA-256 2e9ef93bfecb37708baa83b5ae1bf1f530b07852b4f4bc22b7d600f8c7294ee0."
      ]
    }
  ],
  "gaps": [
    {
      "id": "GAP-ARCORBIT-NEW-STATE-RECOVERY",
      "status": "resolved",
      "goal": "Make ArcOrbit use only the canonical @arckit/arcorbit Desktop state while preserving an end-to-end backup-and-reinstall recovery path for changed unowned skills that establishes a new relation and reaches ready.",
      "reason": "Legacy state reuse violates the corrected product boundary; removing it must not restore the original conflict dead end.",
      "derived_from": [
        "FACT-ARCORBIT-NEW-STATE-ONLY"
      ],
      "blocked_by": [],
      "priority_basis": {
        "blocking": "high",
        "risk": "high",
        "user_impact": "high",
        "urgency": "high"
      },
      "responsibility": "agent",
      "evidence_required": [
        "Implementation and durable sources explicitly use only the new ArcOrbit state identity.",
        "Automated tests prove the legacy state is not consulted and changed unowned skills expose backup-and-reinstall.",
        "A disposable new-state reproduction completes backup, bundled reinstall, new relation establishment, and ready convergence."
      ],
      "resolution": {
        "id": "GAP-ARCORBIT-NEW-STATE-RECOVERY",
        "status": "resolved",
        "outcome": "ArcOrbit now uses only appData/@arckit/arcorbit, while a relation-free changed target is recoverable through confirmed backup-and-current-bundle reinstall and establishes a new ArcOrbit relation.",
        "reason": "Implementation, full regression tests, package inspection, and an isolated packaged-resource recovery all match the corrected boundary.",
        "evidence": [
          "ArcOrbit main binds Electron userData exclusively to appData/@arckit/arcorbit through canonicalArcOrbitUserDataPath; package app.asar contains the canonical function and @arckit/arcorbit identity and no @arckit/runtime state binding.",
          "Focused Setup Readiness, renderer, distribution, and identity suite passed 19/19; the full ArcOrbit check passed 196 tests with one explicit Electron layout skip and zero failures.",
          "Packaged-resource disposable reproduction kept one legacy relation unchanged, observed zero initial ArcOrbit relations, classified arckit-development-ledger as unmanaged-conflict, exposed current-bundle-reinstall, established one ArcOrbit relation, and converged to ready.",
          "Unsigned local DMG runtime/arcorbit/release/ArcOrbit-0.1.0-local.20260817154730-local-20260817154730-mac-x64.dmg has SHA-256 2e9ef93bfecb37708baa83b5ae1bf1f530b07852b4f4bc22b7d600f8c7294ee0."
        ],
        "occurred_at": "2026-08-17T15:50:50.718Z"
      }
    }
  ],
  "content_revision": 1,
  "completion_review": {
    "status": "clean",
    "policy": {
      "initial_max_cycles": 10,
      "source": "runtime/arcorbit/config/case-policy.json",
      "snapshotted_at": "2026-08-17T15:44:06.933Z"
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
          "Reviewed the complete diff: the only runtime identity change is canonical @arckit/arcorbit binding; the existing provider-gated recovery transaction remains unchanged.",
          "Automated test proves a legacy consumer relation may coexist but the ArcOrbit consumer begins with zero relations, takes the fallback, creates only its own relation, and leaves the legacy relation unchanged.",
          "ArcOrbit full check passed 196 tests with one explicit skip and zero failures; focused identity/recovery suite passed 19/19; distribution smoke reached 14 same and zero drift.",
          "Packaged-resource recovery reproduced unmanaged conflict to current-bundle-reinstall to ready, and app.asar inspection found the ArcOrbit identity without a legacy Runtime state binding.",
          "DMG SHA-256 2e9ef93bfecb37708baa83b5ae1bf1f530b07852b4f4bc22b7d600f8c7294ee0."
        ],
        "occurred_at": "2026-08-17T15:51:35.610Z"
      }
    ],
    "evidence": [
      "Reviewed the complete diff: the only runtime identity change is canonical @arckit/arcorbit binding; the existing provider-gated recovery transaction remains unchanged.",
      "Automated test proves a legacy consumer relation may coexist but the ArcOrbit consumer begins with zero relations, takes the fallback, creates only its own relation, and leaves the legacy relation unchanged.",
      "ArcOrbit full check passed 196 tests with one explicit skip and zero failures; focused identity/recovery suite passed 19/19; distribution smoke reached 14 same and zero drift.",
      "Packaged-resource recovery reproduced unmanaged conflict to current-bundle-reinstall to ready, and app.asar inspection found the ArcOrbit identity without a legacy Runtime state binding.",
      "DMG SHA-256 2e9ef93bfecb37708baa83b5ae1bf1f530b07852b4f4bc22b7d600f8c7294ee0."
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
      "goal": "Replace the legacy userData binding with the canonical ArcOrbit identity and verify the existing fallback under a relation-free new consumer.",
      "outcome": "completed",
      "gap_selection": {
        "mode": "candidate",
        "basis": "The corrected new-state-only recovery gap is the sole ready obligation for this Case and directly blocks the user goal.",
        "snapshot_token": "da55490db37c9a2de14a41980cbb286e59a586cc39f78a0b65e2d1c5cb1b98fb",
        "selected_ref": "case-gap:CASE-20260817-004:GAP-ARCORBIT-NEW-STATE-RECOVERY",
        "comparison_summary": "Selected the current Case recovery gap; four broader Project gaps require separate Cases and do not supersede this correction.",
        "fresh_discovery_summary": "Implementation and packaged-resource verification revealed no additional unresolved work.",
        "considered": [
          {
            "ref": "case-gap:CASE-20260817-004:GAP-ARCORBIT-NEW-STATE-RECOVERY",
            "source": "persisted",
            "eligibility": "ready",
            "disposition": "selected",
            "priority_basis": {
              "blocking": "high",
              "uncertainty": "",
              "risk": "high",
              "user_impact": "high",
              "urgency": "high"
            },
            "reason": "This is the only ready Case gap and directly implements the corrected user boundary."
          },
          {
            "ref": "project-gap:GAP-agent-scenario-evaluation",
            "source": "persisted",
            "eligibility": "case_required",
            "disposition": "deferred",
            "priority_basis": {
              "risk": "high"
            },
            "reason": "Separate Project work outside the current corrected recovery boundary."
          },
          {
            "ref": "project-gap:GAP-runtime-resilience-and-adapters",
            "source": "persisted",
            "eligibility": "case_required",
            "disposition": "deferred",
            "priority_basis": {
              "risk": "high"
            },
            "reason": "Separate Project work outside the current corrected recovery boundary."
          },
          {
            "ref": "project-gap:GAP-security-real-project-validation",
            "source": "persisted",
            "eligibility": "case_required",
            "disposition": "deferred",
            "priority_basis": {
              "risk": "high"
            },
            "reason": "Separate Project work outside the current corrected recovery boundary."
          },
          {
            "ref": "project-gap:GAP-cross-record-audit",
            "source": "persisted",
            "eligibility": "case_required",
            "disposition": "deferred",
            "priority_basis": {
              "risk": "high"
            },
            "reason": "Separate Project work outside the current corrected recovery boundary."
          }
        ]
      },
      "selected_gap": {
        "id": "GAP-ARCORBIT-NEW-STATE-RECOVERY",
        "responsibility": "agent",
        "goal": "Make ArcOrbit use only the canonical @arckit/arcorbit Desktop state while preserving an end-to-end backup-and-reinstall recovery path for changed unowned skills that establishes a new relation and reaches ready.",
        "reason": "Legacy state reuse violates the corrected product boundary; removing it must not restore the original conflict dead end.",
        "derived_from": [
          "FACT-ARCORBIT-NEW-STATE-ONLY"
        ],
        "blocked_by": [],
        "priority_basis": {
          "blocking": "high",
          "uncertainty": "",
          "risk": "high",
          "user_impact": "high",
          "urgency": "high"
        },
        "evidence_required": [
          "Implementation and durable sources explicitly use only the new ArcOrbit state identity.",
          "Automated tests prove the legacy state is not consulted and changed unowned skills expose backup-and-reinstall.",
          "A disposable new-state reproduction completes backup, bundled reinstall, new relation establishment, and ready convergence."
        ]
      },
      "planned_transition": {
        "goal": "Replace the legacy userData binding with the canonical ArcOrbit identity and verify the existing fallback under a relation-free new consumer.",
        "expected_state_change": "Code, durable interaction and technical sources, tests, and a local package all use only @arckit/arcorbit while changed unowned skills recover through backup-and-reinstall to ready."
      },
      "accepted_state_delta": {
        "resolved_gap": {
          "id": "GAP-ARCORBIT-NEW-STATE-RECOVERY",
          "status": "resolved",
          "outcome": "ArcOrbit now uses only appData/@arckit/arcorbit, while a relation-free changed target is recoverable through confirmed backup-and-current-bundle reinstall and establishes a new ArcOrbit relation.",
          "reason": "Implementation, full regression tests, package inspection, and an isolated packaged-resource recovery all match the corrected boundary.",
          "evidence": [
            "ArcOrbit main binds Electron userData exclusively to appData/@arckit/arcorbit through canonicalArcOrbitUserDataPath; package app.asar contains the canonical function and @arckit/arcorbit identity and no @arckit/runtime state binding.",
            "Focused Setup Readiness, renderer, distribution, and identity suite passed 19/19; the full ArcOrbit check passed 196 tests with one explicit Electron layout skip and zero failures.",
            "Packaged-resource disposable reproduction kept one legacy relation unchanged, observed zero initial ArcOrbit relations, classified arckit-development-ledger as unmanaged-conflict, exposed current-bundle-reinstall, established one ArcOrbit relation, and converged to ready.",
            "Unsigned local DMG runtime/arcorbit/release/ArcOrbit-0.1.0-local.20260817154730-local-20260817154730-mac-x64.dmg has SHA-256 2e9ef93bfecb37708baa83b5ae1bf1f530b07852b4f4bc22b7d600f8c7294ee0."
          ]
        },
        "facts_added": [
          {
            "id": "FACT-ARCORBIT-NEW-STATE-IMPLEMENTED",
            "revision": 1,
            "status": "accepted",
            "statement": "ArcOrbit binds Electron userData exclusively to appData/@arckit/arcorbit and does not read, migrate, or reuse the legacy @arckit/runtime Desktop state.",
            "basis": "Runtime implementation, stable technical source, identity tests, and packaged app.asar inspection agree.",
            "evidence": [
              "ArcOrbit main binds Electron userData exclusively to appData/@arckit/arcorbit through canonicalArcOrbitUserDataPath; package app.asar contains the canonical function and @arckit/arcorbit identity and no @arckit/runtime state binding.",
              "arckit/tech/arcorbit/installer-supply-chain.md",
              "runtime/arcorbit/test/desktop-user-data.test.mjs"
            ]
          },
          {
            "id": "FACT-ARCORBIT-NEW-STATE-RECOVERY-VERIFIED",
            "revision": 1,
            "status": "accepted",
            "statement": "When the new ArcOrbit consumer has no relation and an existing skill differs, Setup Readiness exposes backup-and-reinstall from the current bundle; confirmed recovery preserves a backup, establishes a new ArcOrbit relation, and converges to ready without consulting or changing the legacy relation.",
            "basis": "Automated manager coverage and a disposable packaged-resource end-to-end reproduction.",
            "evidence": [
              "Focused Setup Readiness, renderer, distribution, and identity suite passed 19/19; the full ArcOrbit check passed 196 tests with one explicit Electron layout skip and zero failures.",
              "Packaged-resource disposable reproduction kept one legacy relation unchanged, observed zero initial ArcOrbit relations, classified arckit-development-ledger as unmanaged-conflict, exposed current-bundle-reinstall, established one ArcOrbit relation, and converged to ready.",
              "Unsigned local DMG runtime/arcorbit/release/ArcOrbit-0.1.0-local.20260817154730-local-20260817154730-mac-x64.dmg has SHA-256 2e9ef93bfecb37708baa83b5ae1bf1f530b07852b4f4bc22b7d600f8c7294ee0."
            ]
          }
        ],
        "facts_superseded": [],
        "impacts_added": [],
        "impacts_updated": [
          {
            "id": "IMPACT-ARCORBIT-NEW-STATE-INTERACTION",
            "fact_id": "FACT-ARCORBIT-NEW-STATE-ONLY",
            "fact_revision": 1,
            "target": {
              "kind": "software_decision",
              "ref": "experience_and_interaction",
              "revision": 9
            },
            "effect": "upheld",
            "reason": "Setup Readiness now uses only the current ArcOrbit identity and exposes the provider-backed fallback when that identity lacks a relation.",
            "gap_ids": [],
            "evidence": [
              "arckit/interaction/setup-readiness/interaction.md",
              "arckit/interaction/setup-readiness/default.html",
              "Packaged-resource disposable reproduction kept one legacy relation unchanged, observed zero initial ArcOrbit relations, classified arckit-development-ledger as unmanaged-conflict, exposed current-bundle-reinstall, established one ArcOrbit relation, and converged to ready."
            ]
          },
          {
            "id": "IMPACT-ARCORBIT-NEW-STATE-TECHNICAL",
            "fact_id": "FACT-ARCORBIT-NEW-STATE-ONLY",
            "fact_revision": 1,
            "target": {
              "kind": "software_decision",
              "ref": "technical_foundation",
              "revision": 15
            },
            "effect": "upheld",
            "reason": "Implementation and technical source consistently use the canonical @arckit/arcorbit identity without legacy state reuse.",
            "gap_ids": [],
            "evidence": [
              "arckit/tech/arcorbit/installer-supply-chain.md",
              "ArcOrbit main binds Electron userData exclusively to appData/@arckit/arcorbit through canonicalArcOrbitUserDataPath; package app.asar contains the canonical function and @arckit/arcorbit identity and no @arckit/runtime state binding."
            ]
          },
          {
            "id": "IMPACT-ARCORBIT-NEW-STATE-REALIZATION",
            "fact_id": "FACT-ARCORBIT-NEW-STATE-ONLY",
            "fact_revision": 1,
            "target": {
              "kind": "software_invariant",
              "ref": "accepted-facts-are-realized",
              "revision": null
            },
            "effect": "upheld",
            "reason": "The local package realizes the new-state-only boundary and recovers a changed unowned skill to ready.",
            "gap_ids": [],
            "evidence": [
              "Focused Setup Readiness, renderer, distribution, and identity suite passed 19/19; the full ArcOrbit check passed 196 tests with one explicit Electron layout skip and zero failures.",
              "Packaged-resource disposable reproduction kept one legacy relation unchanged, observed zero initial ArcOrbit relations, classified arckit-development-ledger as unmanaged-conflict, exposed current-bundle-reinstall, established one ArcOrbit relation, and converged to ready.",
              "Unsigned local DMG runtime/arcorbit/release/ArcOrbit-0.1.0-local.20260817154730-local-20260817154730-mac-x64.dmg has SHA-256 2e9ef93bfecb37708baa83b5ae1bf1f530b07852b4f4bc22b7d600f8c7294ee0."
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
        "project_revision": 80,
        "judgments": [
          {
            "invariant_ref": "product-expectations-remain-recoverable",
            "disposition": "upheld",
            "reason": "The corrected new-state-only recovery outcome is explicit in accepted Case facts and stable interaction behavior.",
            "fact_refs": [
              "FACT-ARCORBIT-NEW-STATE-ONLY",
              "FACT-ARCORBIT-NEW-STATE-RECOVERY-VERIFIED"
            ],
            "evidence": [
              "arckit/interaction/setup-readiness/interaction.md",
              "Packaged-resource disposable reproduction kept one legacy relation unchanged, observed zero initial ArcOrbit relations, classified arckit-development-ledger as unmanaged-conflict, exposed current-bundle-reinstall, established one ArcOrbit relation, and converged to ready."
            ],
            "gap_refs": []
          },
          {
            "invariant_ref": "interaction-expectations-remain-recoverable",
            "disposition": "upheld",
            "reason": "Startup checks only the current identity and the relation-free conflict has an explicit recovery action.",
            "fact_refs": [
              "FACT-ARCORBIT-NEW-STATE-ONLY",
              "FACT-ARCORBIT-NEW-STATE-RECOVERY-VERIFIED"
            ],
            "evidence": [
              "arckit/interaction/setup-readiness/interaction.md",
              "arckit/interaction/setup-readiness/default.html",
              "Packaged-resource disposable reproduction kept one legacy relation unchanged, observed zero initial ArcOrbit relations, classified arckit-development-ledger as unmanaged-conflict, exposed current-bundle-reinstall, established one ArcOrbit relation, and converged to ready."
            ],
            "gap_refs": []
          },
          {
            "invariant_ref": "visual-language-remains-consistent",
            "disposition": "not_relevant",
            "reason": "The correction changes state identity and recovery semantics without changing visual-language rules.",
            "fact_refs": [],
            "evidence": [],
            "gap_refs": []
          },
          {
            "invariant_ref": "technical-decisions-remain-explainable",
            "disposition": "upheld",
            "reason": "The canonical userData identity and provider recovery boundary are explicit and match implementation.",
            "fact_refs": [
              "FACT-ARCORBIT-NEW-STATE-IMPLEMENTED"
            ],
            "evidence": [
              "arckit/tech/arcorbit/installer-supply-chain.md",
              "ArcOrbit main binds Electron userData exclusively to appData/@arckit/arcorbit through canonicalArcOrbitUserDataPath; package app.asar contains the canonical function and @arckit/arcorbit identity and no @arckit/runtime state binding."
            ],
            "gap_refs": []
          },
          {
            "invariant_ref": "accepted-facts-are-realized",
            "disposition": "upheld",
            "reason": "Packaged execution proves the new state remains independent and can recover to ready.",
            "fact_refs": [
              "FACT-ARCORBIT-NEW-STATE-IMPLEMENTED",
              "FACT-ARCORBIT-NEW-STATE-RECOVERY-VERIFIED"
            ],
            "evidence": [
              "Focused Setup Readiness, renderer, distribution, and identity suite passed 19/19; the full ArcOrbit check passed 196 tests with one explicit Electron layout skip and zero failures.",
              "Packaged-resource disposable reproduction kept one legacy relation unchanged, observed zero initial ArcOrbit relations, classified arckit-development-ledger as unmanaged-conflict, exposed current-bundle-reinstall, established one ArcOrbit relation, and converged to ready."
            ],
            "gap_refs": []
          },
          {
            "invariant_ref": "material-risks-have-credible-evidence",
            "disposition": "upheld",
            "reason": "Identity isolation, stale assessment, rollback, backup, relation establishment, regressions, and packaged execution are covered.",
            "fact_refs": [
              "FACT-ARCORBIT-NEW-STATE-RECOVERY-VERIFIED"
            ],
            "evidence": [
              "ArcOrbit main binds Electron userData exclusively to appData/@arckit/arcorbit through canonicalArcOrbitUserDataPath; package app.asar contains the canonical function and @arckit/arcorbit identity and no @arckit/runtime state binding.",
              "Focused Setup Readiness, renderer, distribution, and identity suite passed 19/19; the full ArcOrbit check passed 196 tests with one explicit Electron layout skip and zero failures.",
              "Packaged-resource disposable reproduction kept one legacy relation unchanged, observed zero initial ArcOrbit relations, classified arckit-development-ledger as unmanaged-conflict, exposed current-bundle-reinstall, established one ArcOrbit relation, and converged to ready.",
              "Unsigned local DMG runtime/arcorbit/release/ArcOrbit-0.1.0-local.20260817154730-local-20260817154730-mac-x64.dmg has SHA-256 2e9ef93bfecb37708baa83b5ae1bf1f530b07852b4f4bc22b7d600f8c7294ee0."
            ],
            "gap_refs": []
          }
        ]
      },
      "evidence": [
        "ArcOrbit main binds Electron userData exclusively to appData/@arckit/arcorbit through canonicalArcOrbitUserDataPath; package app.asar contains the canonical function and @arckit/arcorbit identity and no @arckit/runtime state binding.",
        "Focused Setup Readiness, renderer, distribution, and identity suite passed 19/19; the full ArcOrbit check passed 196 tests with one explicit Electron layout skip and zero failures.",
        "Packaged-resource disposable reproduction kept one legacy relation unchanged, observed zero initial ArcOrbit relations, classified arckit-development-ledger as unmanaged-conflict, exposed current-bundle-reinstall, established one ArcOrbit relation, and converged to ready.",
        "Unsigned local DMG runtime/arcorbit/release/ArcOrbit-0.1.0-local.20260817154730-local-20260817154730-mac-x64.dmg has SHA-256 2e9ef93bfecb37708baa83b5ae1bf1f530b07852b4f4bc22b7d600f8c7294ee0."
      ],
      "runtime_result_ref": "",
      "occurred_at": "2026-08-17T15:50:50.718Z"
    },
    {
      "round": 2,
      "transition_schema_version": "arckit-case-transition/v8",
      "goal": "Review content revision 1 against the corrected new-state-only outcome.",
      "outcome": "completed",
      "gap_selection": {
        "mode": "candidate",
        "basis": "All ordinary work is closed and the derived completion review is the only ready Case candidate.",
        "snapshot_token": "53200f65377e3f9ee14902db29de78775e6f4806d103ecd296f5f3897aaf2649",
        "selected_ref": "case-gap:CASE-20260817-004:CASE-20260817-004:completion-review:1",
        "comparison_summary": "Selected the terminal review; four unrelated Project gaps remain separate-case work.",
        "fresh_discovery_summary": "Diff, package, and recovery review revealed no material fresh gap.",
        "considered": [
          {
            "ref": "case-gap:CASE-20260817-004:CASE-20260817-004:completion-review:1",
            "source": "persisted",
            "eligibility": "ready",
            "disposition": "selected",
            "priority_basis": {
              "blocking": "high",
              "uncertainty": "low",
              "risk": "high",
              "user_impact": "high"
            },
            "reason": "Terminal correctness gate for the corrected implementation."
          },
          {
            "ref": "project-gap:GAP-agent-scenario-evaluation",
            "source": "persisted",
            "eligibility": "case_required",
            "disposition": "deferred",
            "priority_basis": {
              "risk": "high"
            },
            "reason": "Separate Project work outside this Case."
          },
          {
            "ref": "project-gap:GAP-runtime-resilience-and-adapters",
            "source": "persisted",
            "eligibility": "case_required",
            "disposition": "deferred",
            "priority_basis": {
              "risk": "high"
            },
            "reason": "Separate Project work outside this Case."
          },
          {
            "ref": "project-gap:GAP-security-real-project-validation",
            "source": "persisted",
            "eligibility": "case_required",
            "disposition": "deferred",
            "priority_basis": {
              "risk": "high"
            },
            "reason": "Separate Project work outside this Case."
          },
          {
            "ref": "project-gap:GAP-cross-record-audit",
            "source": "persisted",
            "eligibility": "case_required",
            "disposition": "deferred",
            "priority_basis": {
              "risk": "high"
            },
            "reason": "Separate Project work outside this Case."
          }
        ]
      },
      "selected_gap": {
        "id": "CASE-20260817-004:completion-review:1",
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
        "goal": "Review content revision 1 against the corrected new-state-only outcome.",
        "expected_state_change": "Record a clean five-dimension review without content mutation and resolve the Case."
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
          "reviewer": "agent",
          "outcome": "clean",
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
            "Reviewed the complete diff: the only runtime identity change is canonical @arckit/arcorbit binding; the existing provider-gated recovery transaction remains unchanged.",
            "Automated test proves a legacy consumer relation may coexist but the ArcOrbit consumer begins with zero relations, takes the fallback, creates only its own relation, and leaves the legacy relation unchanged.",
            "ArcOrbit full check passed 196 tests with one explicit skip and zero failures; focused identity/recovery suite passed 19/19; distribution smoke reached 14 same and zero drift.",
            "Packaged-resource recovery reproduced unmanaged conflict to current-bundle-reinstall to ready, and app.asar inspection found the ArcOrbit identity without a legacy Runtime state binding.",
            "DMG SHA-256 2e9ef93bfecb37708baa83b5ae1bf1f530b07852b4f4bc22b7d600f8c7294ee0."
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
        "project_revision": 80,
        "judgments": [
          {
            "invariant_ref": "product-expectations-remain-recoverable",
            "disposition": "upheld",
            "reason": "The corrected new-state-only outcome and safe fallback are durable and realized.",
            "fact_refs": [
              "FACT-ARCORBIT-NEW-STATE-ONLY",
              "FACT-ARCORBIT-NEW-STATE-RECOVERY-VERIFIED"
            ],
            "evidence": [
              "arckit/interaction/setup-readiness/interaction.md",
              "Automated test proves a legacy consumer relation may coexist but the ArcOrbit consumer begins with zero relations, takes the fallback, creates only its own relation, and leaves the legacy relation unchanged."
            ],
            "gap_refs": []
          },
          {
            "invariant_ref": "interaction-expectations-remain-recoverable",
            "disposition": "upheld",
            "reason": "The current identity and relation-free recovery path are coherent in source, projection, and package behavior.",
            "fact_refs": [
              "FACT-ARCORBIT-NEW-STATE-ONLY",
              "FACT-ARCORBIT-NEW-STATE-RECOVERY-VERIFIED"
            ],
            "evidence": [
              "arckit/interaction/setup-readiness/interaction.md",
              "arckit/interaction/setup-readiness/default.html",
              "Packaged-resource recovery reproduced unmanaged conflict to current-bundle-reinstall to ready, and app.asar inspection found the ArcOrbit identity without a legacy Runtime state binding."
            ],
            "gap_refs": []
          },
          {
            "invariant_ref": "visual-language-remains-consistent",
            "disposition": "not_relevant",
            "reason": "No visual-language rule or styling changed.",
            "fact_refs": [],
            "evidence": [],
            "gap_refs": []
          },
          {
            "invariant_ref": "technical-decisions-remain-explainable",
            "disposition": "upheld",
            "reason": "The unique ArcOrbit state identity and provider-owned fallback are explicit and implementation-aligned.",
            "fact_refs": [
              "FACT-ARCORBIT-NEW-STATE-IMPLEMENTED"
            ],
            "evidence": [
              "arckit/tech/arcorbit/installer-supply-chain.md",
              "Reviewed the complete diff: the only runtime identity change is canonical @arckit/arcorbit binding; the existing provider-gated recovery transaction remains unchanged."
            ],
            "gap_refs": []
          },
          {
            "invariant_ref": "accepted-facts-are-realized",
            "disposition": "upheld",
            "reason": "Package inspection and disposable execution prove new-state isolation and ready convergence.",
            "fact_refs": [
              "FACT-ARCORBIT-NEW-STATE-IMPLEMENTED",
              "FACT-ARCORBIT-NEW-STATE-RECOVERY-VERIFIED"
            ],
            "evidence": [
              "Automated test proves a legacy consumer relation may coexist but the ArcOrbit consumer begins with zero relations, takes the fallback, creates only its own relation, and leaves the legacy relation unchanged.",
              "Packaged-resource recovery reproduced unmanaged conflict to current-bundle-reinstall to ready, and app.asar inspection found the ArcOrbit identity without a legacy Runtime state binding."
            ],
            "gap_refs": []
          },
          {
            "invariant_ref": "material-risks-have-credible-evidence",
            "disposition": "upheld",
            "reason": "Isolation, backup, stale assessment, rollback, relation ownership, regressions, and the built artifact are covered.",
            "fact_refs": [
              "FACT-ARCORBIT-NEW-STATE-RECOVERY-VERIFIED"
            ],
            "evidence": [
              "Reviewed the complete diff: the only runtime identity change is canonical @arckit/arcorbit binding; the existing provider-gated recovery transaction remains unchanged.",
              "Automated test proves a legacy consumer relation may coexist but the ArcOrbit consumer begins with zero relations, takes the fallback, creates only its own relation, and leaves the legacy relation unchanged.",
              "ArcOrbit full check passed 196 tests with one explicit skip and zero failures; focused identity/recovery suite passed 19/19; distribution smoke reached 14 same and zero drift.",
              "Packaged-resource recovery reproduced unmanaged conflict to current-bundle-reinstall to ready, and app.asar inspection found the ArcOrbit identity without a legacy Runtime state binding.",
              "DMG SHA-256 2e9ef93bfecb37708baa83b5ae1bf1f530b07852b4f4bc22b7d600f8c7294ee0."
            ],
            "gap_refs": []
          }
        ]
      },
      "evidence": [
        "Reviewed the complete diff: the only runtime identity change is canonical @arckit/arcorbit binding; the existing provider-gated recovery transaction remains unchanged.",
        "Automated test proves a legacy consumer relation may coexist but the ArcOrbit consumer begins with zero relations, takes the fallback, creates only its own relation, and leaves the legacy relation unchanged.",
        "ArcOrbit full check passed 196 tests with one explicit skip and zero failures; focused identity/recovery suite passed 19/19; distribution smoke reached 14 same and zero drift.",
        "Packaged-resource recovery reproduced unmanaged conflict to current-bundle-reinstall to ready, and app.asar inspection found the ArcOrbit identity without a legacy Runtime state binding.",
        "DMG SHA-256 2e9ef93bfecb37708baa83b5ae1bf1f530b07852b4f4bc22b7d600f8c7294ee0."
      ],
      "runtime_result_ref": "",
      "occurred_at": "2026-08-17T15:51:35.610Z"
    }
  ],
  "case_resolution": {
    "status": "resolved",
    "stage": "resolved",
    "satisfied": [
      "GAP-ARCORBIT-NEW-STATE-RECOVERY"
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
    "updated_at": "2026-08-17T15:51:35.610Z"
  }
}
```

## Round Notes

- Case history is canonical in Structured Record.rounds; keep prose notes exceptional.
