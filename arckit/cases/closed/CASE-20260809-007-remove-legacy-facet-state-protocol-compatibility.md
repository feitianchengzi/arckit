# Remove legacy facet state protocol compatibility

Case: CASE-20260809-007
Status: closed
Artifact Type: mixed
Selected Gap: none
Updated: 2026-08-09T18:42:34.239Z

## User Intent

Remove the old facet-based State and transition protocol plus legacy Runtime and ledger compatibility branches. Keep the new desired-condition, facts, state-impacts, dynamic-gaps and implementation-focused completion review protocol as the only supported model. Projects still using the old protocol will be upgraded explicitly when adopted.

## Structured Record

```json
{
  "schema_version": "development-case-record/v4",
  "id": "CASE-20260809-007",
  "title": "Remove legacy facet state protocol compatibility",
  "status": "closed",
  "artifact_type": "mixed",
  "created_at": "2026-08-09T18:14:30.785Z",
  "updated_at": "2026-08-09T18:42:34.239Z",
  "user_intent": "Remove the old facet-based State and transition protocol plus legacy Runtime and ledger compatibility branches. Keep the new desired-condition, facts, state-impacts, dynamic-gaps and implementation-focused completion review protocol as the only supported model. Projects still using the old protocol will be upgraded explicitly when adopted.",
  "expected_outcome": "Schemas, ledger entrypoints, Runtime contracts, skills, specifications and tests expose only the new protocol; no v3/facet compatibility path remains; full verification and final implementation review pass.",
  "project_state_ref": "arckit/project/state.record.json",
  "current_round": {
    "goal": "",
    "selected_gap": null
  },
  "facts": [
    {
      "id": "FACT-legacy-compatibility-not-required",
      "revision": 1,
      "status": "accepted",
      "statement": "Arckit no longer needs to accept, transition, render, audit, or run the old facet-based state protocol. A project still on the old protocol will be upgraded explicitly when the new protocol is adopted there.",
      "basis": "Explicit user product decision in the continuation request on 2026-08-10.",
      "evidence": [
        "case:user-decision-drop-legacy-state-compatibility-2026-08-10"
      ]
    },
    {
      "id": "FACT-legacy-surface-inventory",
      "revision": 1,
      "status": "accepted",
      "statement": "Legacy state support spans the ledger Case/transition schemas and dual branches, Runtime schema validation/state reading/gating/digest normalization, definition-skill facet handoff contracts and capability prompts, stable docs, and v3/facet-specific tests. Closed historical Case files can remain non-canonical archives and do not require active parser support.",
      "basis": "Repository-wide identifier and behavior inventory after the compatibility requirement was withdrawn.",
      "evidence": [
        "entry/skills/arckit-development-ledger/scripts/development-case.mjs",
        "entry/skills/arckit-development-ledger/scripts/case-transition.mjs",
        "runtime/arckit-runtime/src/state-store.mjs",
        "runtime/arckit-runtime/src/agent-orchestrator.mjs",
        "runtime/arckit-runtime/src/gate-engine.mjs",
        "runtime/arckit-runtime/src/validator.mjs",
        "definition/skills/_arckit_shared/case-fact-contract.md",
        "runtime/arckit-runtime/test/case-transition.test.mjs",
        "runtime/arckit-runtime/test/coherent-agent-loop.test.mjs"
      ]
    }
  ],
  "state_impacts": [
    {
      "id": "IMPACT-product-contract",
      "fact_id": "FACT-legacy-compatibility-not-required",
      "fact_revision": 1,
      "condition_ref": "product_behavior.observable-behavior-has-durable-expectation",
      "effect": "upheld",
      "reason": "The product specification now states current-protocol-only execution and explicit semantic project upgrades.",
      "gap_ids": [],
      "evidence": [
        "arckit/spec/agentic-software-development/product-concepts.md",
        "arckit/spec/agentic-software-development/runtime-automation-workspace.md"
      ]
    },
    {
      "id": "IMPACT-technical-contract",
      "fact_id": "FACT-legacy-compatibility-not-required",
      "fact_revision": 1,
      "condition_ref": "architecture_foundation.changed-contracts-remain-explainable",
      "effect": "upheld",
      "reason": "The technical solution now defines v4 as the only accepted contract and separates explicit project upgrade work from Runtime compatibility.",
      "gap_ids": [],
      "evidence": [
        "arckit/tech/arckit-runtime/state-condition-ledger-solution.md",
        "arckit/tech/arckit-runtime/solution.md",
        "arckit/tech/arckit-runtime/desktop-execution-solution.md"
      ]
    },
    {
      "id": "IMPACT-implementation",
      "fact_id": "FACT-legacy-compatibility-not-required",
      "fact_revision": 1,
      "condition_ref": "implementation_coverage.accepted-facts-are-realized",
      "effect": "upheld",
      "reason": "Ledger, Runtime, Desktop reader, skills, prompts, manifests, and schemas now implement the current v4-only contract and generic dynamic gap behavior.",
      "gap_ids": [],
      "evidence": [
        "entry/skills/arckit-development-ledger/scripts/development-case.mjs",
        "entry/skills/arckit-development-ledger/scripts/case-transition.mjs",
        "runtime/arckit-runtime/src/state-store.mjs",
        "runtime/arckit-runtime/src/project-initializer.mjs",
        "runtime/arckit-runtime/src/desktop-run-manager.mjs",
        "definition/skills/_arckit_shared/case-gap-contract.md"
      ]
    },
    {
      "id": "IMPACT-verification",
      "fact_id": "FACT-legacy-compatibility-not-required",
      "fact_revision": 1,
      "condition_ref": "quality_validation.material-risks-have-credible-evidence",
      "effect": "upheld",
      "reason": "Regression coverage proves v4-only rejection, dynamic gap execution, Review repair flow, Desktop archive filtering, and the full Runtime suite passes.",
      "gap_ids": [],
      "evidence": [
        "runtime/arckit-runtime/test/case-transition.test.mjs",
        "runtime/arckit-runtime/test/coherent-agent-loop.test.mjs",
        "runtime/arckit-runtime/test/desktop-run-manager.test.mjs",
        "runtime/arckit-runtime/test/state-condition-case.test.mjs",
        "command:npm run check (82 passed, 1 environment-gated skip)",
        "command:quick_validate.py (6 skills valid)"
      ]
    }
  ],
  "gaps": [
    {
      "id": "GAP-inventory-legacy-contract",
      "status": "resolved",
      "goal": "Identify the complete old-protocol surface and establish the exact removal boundary across schemas, ledger, Runtime, skills, documentation and tests.",
      "reason": "The removal is authorized, but implementation should start from evidence of every compatibility path so the new protocol becomes singular without leaving dead or contradictory branches.",
      "derived_from": [
        "FACT-legacy-compatibility-not-required"
      ],
      "blocked_by": [],
      "priority_basis": {
        "blocking": "high",
        "uncertainty": "high",
        "risk": "high",
        "user_impact": "medium"
      },
      "responsibility": "agent",
      "evidence_required": [
        "repository-wide legacy protocol inventory",
        "durable new-only product and technical boundary"
      ],
      "resolution": {
        "status": "resolved",
        "outcome": "The old protocol surface is identified across schemas, ledger scripts, Runtime readers/gates/digest normalization, definition-skill contracts, prompts, capability manifests, documentation and legacy-focused tests; the durable contract now requires only v4 and explicit per-project upgrades.",
        "reason": "Repository-wide search plus product and technical document updates establish a complete, actionable removal boundary.",
        "evidence": [
          "arckit/spec/agentic-software-development/product-concepts.md",
          "arckit/spec/agentic-software-development/runtime-automation-workspace.md",
          "arckit/tech/arckit-runtime/state-condition-ledger-solution.md",
          "arckit/tech/arckit-runtime/solution.md",
          "arckit/tech/arckit-runtime/desktop-execution-solution.md"
        ],
        "occurred_at": "2026-08-09T18:18:55.208Z"
      }
    },
    {
      "id": "GAP-remove-legacy-implementation",
      "status": "resolved",
      "goal": "Remove all active v3/facet compatibility code and skill contracts, make v4 the sole accepted protocol, replace legacy tests with v4-only rejection and behavior coverage, and pass full verification.",
      "reason": "The durable contract is now singular, while executable code and reusable Agent instructions still expose the withdrawn protocol.",
      "derived_from": [
        "FACT-legacy-compatibility-not-required",
        "FACT-legacy-surface-inventory",
        "IMPACT-implementation",
        "IMPACT-verification"
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
        "no active legacy schema or runtime branch",
        "definition skills consume generic dynamic gaps rather than facet packets",
        "v4-only regression and rejection tests",
        "full repository checks pass"
      ],
      "resolution": {
        "status": "resolved",
        "outcome": "The repository now accepts only v4 Project/Case/transition state and uses generic dynamic gaps across Runtime and definition skills.",
        "reason": "Legacy schemas, migration and compatibility branches, facet packets, prompts, manifests, and fixtures were removed or replaced with current-protocol rejection coverage.",
        "evidence": [
          "entry/skills/arckit-development-ledger/scripts/development-case.mjs",
          "entry/skills/arckit-development-ledger/scripts/case-transition.mjs",
          "definition/skills/_arckit_shared/case-gap-contract.md",
          "runtime/arckit-runtime/test/case-transition.test.mjs",
          "command:npm run check (82 passed, 1 environment-gated skip)"
        ],
        "occurred_at": "2026-08-09T18:41:56.522Z"
      }
    }
  ],
  "content_revision": 2,
  "completion_review": {
    "status": "clean",
    "policy": {
      "initial_max_cycles": 3,
      "source": "runtime/arckit-runtime/config/case-policy.json",
      "snapshotted_at": "2026-08-09T18:14:30.785Z"
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
          "command:npm run check (82 passed, 1 environment-gated skip)",
          "command:quick_validate.py (6 skills valid)",
          "command:git diff --check",
          "command:legacy protocol surface scan returned no active implementation references",
          "runtime/arckit-runtime/test/case-transition.test.mjs",
          "runtime/arckit-runtime/test/state-condition-case.test.mjs"
        ],
        "occurred_at": "2026-08-09T18:42:34.239Z"
      }
    ],
    "evidence": [
      "command:npm run check (82 passed, 1 environment-gated skip)",
      "command:quick_validate.py (6 skills valid)",
      "command:git diff --check",
      "command:legacy protocol surface scan returned no active implementation references",
      "runtime/arckit-runtime/test/case-transition.test.mjs",
      "runtime/arckit-runtime/test/state-condition-case.test.mjs"
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
      "goal": "Formalize the current-only protocol boundary and convert the repository-wide legacy inventory into one implementation gap.",
      "outcome": "completed",
      "planned_transition": "The product and technical contract become unambiguous; implementation and verification impacts remain open under a concrete removal gap.",
      "accepted_state_delta": {
        "resolved_gap": {
          "id": "GAP-inventory-legacy-contract",
          "status": "resolved",
          "outcome": "The old protocol surface is identified across schemas, ledger scripts, Runtime readers/gates/digest normalization, definition-skill contracts, prompts, capability manifests, documentation and legacy-focused tests; the durable contract now requires only v4 and explicit per-project upgrades.",
          "reason": "Repository-wide search plus product and technical document updates establish a complete, actionable removal boundary.",
          "evidence": [
            "arckit/spec/agentic-software-development/product-concepts.md",
            "arckit/spec/agentic-software-development/runtime-automation-workspace.md",
            "arckit/tech/arckit-runtime/state-condition-ledger-solution.md",
            "arckit/tech/arckit-runtime/solution.md",
            "arckit/tech/arckit-runtime/desktop-execution-solution.md"
          ]
        },
        "facts_added": [
          {
            "id": "FACT-legacy-surface-inventory",
            "revision": 1,
            "status": "accepted",
            "statement": "Legacy state support spans the ledger Case/transition schemas and dual branches, Runtime schema validation/state reading/gating/digest normalization, definition-skill facet handoff contracts and capability prompts, stable docs, and v3/facet-specific tests. Closed historical Case files can remain non-canonical archives and do not require active parser support.",
            "basis": "Repository-wide identifier and behavior inventory after the compatibility requirement was withdrawn.",
            "evidence": [
              "entry/skills/arckit-development-ledger/scripts/development-case.mjs",
              "entry/skills/arckit-development-ledger/scripts/case-transition.mjs",
              "runtime/arckit-runtime/src/state-store.mjs",
              "runtime/arckit-runtime/src/agent-orchestrator.mjs",
              "runtime/arckit-runtime/src/gate-engine.mjs",
              "runtime/arckit-runtime/src/validator.mjs",
              "definition/skills/_arckit_shared/case-fact-contract.md",
              "runtime/arckit-runtime/test/case-transition.test.mjs",
              "runtime/arckit-runtime/test/coherent-agent-loop.test.mjs"
            ]
          }
        ],
        "facts_superseded": [],
        "impacts_added": [],
        "impacts_updated": [
          {
            "id": "IMPACT-product-contract",
            "fact_id": "FACT-legacy-compatibility-not-required",
            "fact_revision": 1,
            "condition_ref": "product_behavior.observable-behavior-has-durable-expectation",
            "effect": "upheld",
            "reason": "The product specification now states current-protocol-only execution and explicit semantic project upgrades.",
            "gap_ids": [],
            "evidence": [
              "arckit/spec/agentic-software-development/product-concepts.md",
              "arckit/spec/agentic-software-development/runtime-automation-workspace.md"
            ]
          },
          {
            "id": "IMPACT-technical-contract",
            "fact_id": "FACT-legacy-compatibility-not-required",
            "fact_revision": 1,
            "condition_ref": "architecture_foundation.changed-contracts-remain-explainable",
            "effect": "upheld",
            "reason": "The technical solution now defines v4 as the only accepted contract and separates explicit project upgrade work from Runtime compatibility.",
            "gap_ids": [],
            "evidence": [
              "arckit/tech/arckit-runtime/state-condition-ledger-solution.md",
              "arckit/tech/arckit-runtime/solution.md",
              "arckit/tech/arckit-runtime/desktop-execution-solution.md"
            ]
          },
          {
            "id": "IMPACT-implementation",
            "fact_id": "FACT-legacy-compatibility-not-required",
            "fact_revision": 1,
            "condition_ref": "implementation_coverage.accepted-facts-are-realized",
            "effect": "threatened",
            "reason": "The implementation still contains the inventoried dual-protocol branches and facet contracts.",
            "gap_ids": [
              "GAP-remove-legacy-implementation"
            ],
            "evidence": [
              "entry/skills/arckit-development-ledger/scripts/case-transition.mjs",
              "runtime/arckit-runtime/src/gate-engine.mjs"
            ]
          },
          {
            "id": "IMPACT-verification",
            "fact_id": "FACT-legacy-compatibility-not-required",
            "fact_revision": 1,
            "condition_ref": "quality_validation.material-risks-have-credible-evidence",
            "effect": "undetermined",
            "reason": "Current tests still exercise legacy behavior and do not yet prove a v4-only boundary.",
            "gap_ids": [
              "GAP-remove-legacy-implementation"
            ],
            "evidence": [
              "runtime/arckit-runtime/test/case-transition.test.mjs",
              "runtime/arckit-runtime/test/coherent-agent-loop.test.mjs"
            ]
          }
        ],
        "gaps_added": [
          {
            "id": "GAP-remove-legacy-implementation",
            "status": "open",
            "goal": "Remove all active v3/facet compatibility code and skill contracts, make v4 the sole accepted protocol, replace legacy tests with v4-only rejection and behavior coverage, and pass full verification.",
            "reason": "The durable contract is now singular, while executable code and reusable Agent instructions still expose the withdrawn protocol.",
            "derived_from": [
              "FACT-legacy-compatibility-not-required",
              "FACT-legacy-surface-inventory",
              "IMPACT-implementation",
              "IMPACT-verification"
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
              "no active legacy schema or runtime branch",
              "definition skills consume generic dynamic gaps rather than facet packets",
              "v4-only regression and rejection tests",
              "full repository checks pass"
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
      "evidence": [
        "arckit/spec/agentic-software-development/product-concepts.md",
        "arckit/spec/agentic-software-development/runtime-automation-workspace.md",
        "arckit/tech/arckit-runtime/state-condition-ledger-solution.md",
        "arckit/tech/arckit-runtime/solution.md",
        "arckit/tech/arckit-runtime/desktop-execution-solution.md",
        "entry/skills/arckit-development-ledger/scripts/development-case.mjs",
        "entry/skills/arckit-development-ledger/scripts/case-transition.mjs",
        "runtime/arckit-runtime/src/agent-orchestrator.mjs",
        "definition/skills/_arckit_shared/case-fact-contract.md"
      ],
      "runtime_result_ref": "",
      "occurred_at": "2026-08-09T18:18:55.208Z"
    },
    {
      "round": 2,
      "goal": "Remove all active v3/facet compatibility code and skill contracts, make v4 the sole accepted protocol, replace legacy tests with v4-only rejection and behavior coverage, and pass full verification.",
      "outcome": "completed",
      "planned_transition": "Remove the legacy protocol surfaces, uphold implementation and verification impacts, and expose completion review.",
      "accepted_state_delta": {
        "resolved_gap": {
          "id": "GAP-remove-legacy-implementation",
          "status": "resolved",
          "outcome": "The repository now accepts only v4 Project/Case/transition state and uses generic dynamic gaps across Runtime and definition skills.",
          "reason": "Legacy schemas, migration and compatibility branches, facet packets, prompts, manifests, and fixtures were removed or replaced with current-protocol rejection coverage.",
          "evidence": [
            "entry/skills/arckit-development-ledger/scripts/development-case.mjs",
            "entry/skills/arckit-development-ledger/scripts/case-transition.mjs",
            "definition/skills/_arckit_shared/case-gap-contract.md",
            "runtime/arckit-runtime/test/case-transition.test.mjs",
            "command:npm run check (82 passed, 1 environment-gated skip)"
          ]
        },
        "facts_added": [],
        "facts_superseded": [],
        "impacts_added": [],
        "impacts_updated": [
          {
            "id": "IMPACT-implementation",
            "fact_id": "FACT-legacy-compatibility-not-required",
            "fact_revision": 1,
            "condition_ref": "implementation_coverage.accepted-facts-are-realized",
            "effect": "upheld",
            "reason": "Ledger, Runtime, Desktop reader, skills, prompts, manifests, and schemas now implement the current v4-only contract and generic dynamic gap behavior.",
            "gap_ids": [],
            "evidence": [
              "entry/skills/arckit-development-ledger/scripts/development-case.mjs",
              "entry/skills/arckit-development-ledger/scripts/case-transition.mjs",
              "runtime/arckit-runtime/src/state-store.mjs",
              "runtime/arckit-runtime/src/project-initializer.mjs",
              "runtime/arckit-runtime/src/desktop-run-manager.mjs",
              "definition/skills/_arckit_shared/case-gap-contract.md"
            ]
          },
          {
            "id": "IMPACT-verification",
            "fact_id": "FACT-legacy-compatibility-not-required",
            "fact_revision": 1,
            "condition_ref": "quality_validation.material-risks-have-credible-evidence",
            "effect": "upheld",
            "reason": "Regression coverage proves v4-only rejection, dynamic gap execution, Review repair flow, Desktop archive filtering, and the full Runtime suite passes.",
            "gap_ids": [],
            "evidence": [
              "runtime/arckit-runtime/test/case-transition.test.mjs",
              "runtime/arckit-runtime/test/coherent-agent-loop.test.mjs",
              "runtime/arckit-runtime/test/desktop-run-manager.test.mjs",
              "runtime/arckit-runtime/test/state-condition-case.test.mjs",
              "command:npm run check (82 passed, 1 environment-gated skip)",
              "command:quick_validate.py (6 skills valid)"
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
      "evidence": [
        "entry/skills/arckit-development-ledger/schema/development-case-record.schema.json",
        "entry/skills/arckit-development-ledger/schema/case-transition.schema.json",
        "runtime/arckit-runtime/schemas/agent-loop-result.schema.json",
        "definition/skills/_arckit_shared/case-gap-contract.md",
        "command:npm run check (82 passed, 1 environment-gated skip)",
        "command:quick_validate.py (6 skills valid)"
      ],
      "runtime_result_ref": "",
      "occurred_at": "2026-08-09T18:41:56.522Z"
    },
    {
      "round": 3,
      "goal": "Review the completed implementation for correctness, real problem resolution, verification credibility, regression risk, and minimality.",
      "outcome": "completed",
      "planned_transition": "Record a clean implementation-focused review for the current content revision and resolve the Case.",
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
            "command:npm run check (82 passed, 1 environment-gated skip)",
            "command:quick_validate.py (6 skills valid)",
            "command:git diff --check",
            "command:legacy protocol surface scan returned no active implementation references",
            "runtime/arckit-runtime/test/case-transition.test.mjs",
            "runtime/arckit-runtime/test/state-condition-case.test.mjs"
          ]
        },
        "resolved_review_findings": [],
        "review_budget_extension": null
      },
      "evidence": [
        "command:npm run check (82 passed, 1 environment-gated skip)",
        "command:quick_validate.py (6 skills valid)",
        "command:git diff --check",
        "command:legacy protocol surface scan returned no active implementation references",
        "runtime/arckit-runtime/test/case-transition.test.mjs",
        "runtime/arckit-runtime/test/state-condition-case.test.mjs"
      ],
      "runtime_result_ref": "",
      "occurred_at": "2026-08-09T18:42:34.239Z"
    }
  ],
  "case_resolution": {
    "status": "resolved",
    "stage": "resolved",
    "satisfied": [
      "GAP-inventory-legacy-contract",
      "GAP-remove-legacy-implementation"
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
    "updated_at": "2026-08-09T18:42:34.239Z"
  },
  "project_impact_candidate": {
    "status": "none",
    "changes": [],
    "condition_changes": [],
    "evidence": []
  }
}
```

## Round Notes

- Case history is canonical in Structured Record.rounds; keep prose notes exceptional.
