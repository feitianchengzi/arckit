# Govern State Driven Loop Correctness

Case: CASE-20260726-002
Status: closed
Artifact Type: mixed
Selected Gap: none
Updated: 2026-07-26T18:58:52.062Z

## User Intent

Correct the Case-driven definition completeness loop so human and Runtime bridges support zero-worker transitions, precise responsibility routing, stale-transition rejection, atomic ledger commits, recoverable references, and genuine bounded auto-continuation without retained old logic.

## Structured Record

```json
{
  "schema_version": "development-case-record/v3",
  "id": "CASE-20260726-002",
  "title": "Govern State Driven Loop Correctness",
  "status": "closed",
  "artifact_type": "mixed",
  "created_at": "2026-07-26T17:41:29.229Z",
  "updated_at": "2026-07-26T18:58:52.062Z",
  "user_intent": "Correct the Case-driven definition completeness loop so human and Runtime bridges support zero-worker transitions, precise responsibility routing, stale-transition rejection, atomic ledger commits, recoverable references, and genuine bounded auto-continuation without retained old logic.",
  "expected_outcome": "",
  "project_state_ref": "arckit/project/state.record.json",
  "current_round": {
    "goal": "",
    "selected_gap": null
  },
  "facets": {
    "product_expectation": {
      "applicability": "required",
      "maturity": "formalized",
      "target_maturity": "formalized",
      "alignment": "aligned",
      "target_alignment": "aligned",
      "resolution": "resolved",
      "reason": "Product specifications now define Project-to-Case selection, unordered Case gaps, zero-or-more Workers, revision-bound transitions, fresh-state continuation, and evidence-based completion.",
      "evidence": [
        "arckit/spec/agentic-software-development/controller-worker-loop.md",
        "arckit/spec/agentic-software-development/product-concepts.md",
        "arckit/spec/agentic-software-development/product-architecture.md"
      ],
      "next_transition": ""
    },
    "interaction_expectation": {
      "applicability": "not_required",
      "maturity": "unknown",
      "target_maturity": "unknown",
      "alignment": "unknown",
      "target_alignment": "unknown",
      "resolution": "resolved",
      "reason": "This governance change does not introduce or alter a page-level user interaction contract.",
      "evidence": [
        "case-scope:runtime-and-skill-protocol-without-page-interaction-change"
      ],
      "next_transition": ""
    },
    "visual_expectation": {
      "applicability": "not_required",
      "maturity": "unknown",
      "target_maturity": "unknown",
      "alignment": "unknown",
      "target_alignment": "unknown",
      "resolution": "resolved",
      "reason": "This governance change has no visual style, token, theme, or component appearance surface.",
      "evidence": [
        "case-scope:no-visual-surface"
      ],
      "next_transition": ""
    },
    "technical_expectation": {
      "applicability": "required",
      "maturity": "formalized",
      "target_maturity": "formalized",
      "alignment": "aligned",
      "target_alignment": "aligned",
      "resolution": "resolved",
      "reason": "The Runtime solution documents zero-Worker review, optimistic Case revision binding, canonical ledger validation, rollback-capable commit, and bounded fresh-state auto continuation.",
      "evidence": [
        "arckit/tech/arckit-runtime/solution.md",
        "runtime/arckit-runtime/README.md"
      ],
      "next_transition": ""
    },
    "implementation_state": {
      "applicability": "required",
      "maturity": "confirmed",
      "target_maturity": "confirmed",
      "alignment": "aligned",
      "target_alignment": "aligned",
      "resolution": "resolved",
      "reason": "Controller, Runtime Guard, ledger scripts, schemas, Desktop continuation, and current repository state implement the governed behavior without compatibility routing.",
      "evidence": [
        "entry/skills/arckit-development-ledger/scripts/case-transition.mjs",
        "entry/skills/arckit-development-ledger/scripts/development-case.mjs",
        "runtime/arckit-runtime/src/agent-orchestrator.mjs",
        "runtime/arckit-runtime/src/gate-engine.mjs",
        "runtime/arckit-runtime/src/desktop-run-manager.mjs"
      ],
      "next_transition": ""
    },
    "verification_state": {
      "applicability": "required",
      "maturity": "formalized",
      "target_maturity": "formalized",
      "alignment": "aligned",
      "target_alignment": "aligned",
      "resolution": "resolved",
      "reason": "Runtime regression tests, ledger audits, schema parsing, syntax checks, and repository consistency checks pass.",
      "evidence": [
        "runtime/arckit-runtime/test/case-transition.test.mjs",
        "runtime/arckit-runtime/test/capability-registry.test.mjs",
        "npm run check",
        "project-state.mjs audit",
        "project-iteration.mjs audit",
        "git diff --check"
      ],
      "next_transition": ""
    }
  },
  "open_questions": [],
  "decisions": [],
  "pending_handoffs": [],
  "process_notes": [],
  "rounds": [
    {
      "round": 1,
      "goal": "Formalize and verify the complete state-driven Case loop governance contract.",
      "outcome": "completed",
      "planned_transition": "All six Case facets move from unknown to evidence-backed resolved judgments.",
      "accepted_state_delta": {
        "facets": [
          {
            "facet": "product_expectation",
            "set": {
              "applicability": "required",
              "maturity": "formalized",
              "target_maturity": "formalized",
              "alignment": "aligned",
              "target_alignment": "aligned",
              "resolution": "resolved",
              "reason": "Product specifications now define Project-to-Case selection, unordered Case gaps, zero-or-more Workers, revision-bound transitions, fresh-state continuation, and evidence-based completion.",
              "next_transition": ""
            },
            "evidence": [
              "arckit/spec/agentic-software-development/controller-worker-loop.md",
              "arckit/spec/agentic-software-development/product-concepts.md",
              "arckit/spec/agentic-software-development/product-architecture.md"
            ]
          },
          {
            "facet": "interaction_expectation",
            "set": {
              "applicability": "not_required",
              "resolution": "resolved",
              "reason": "This governance change does not introduce or alter a page-level user interaction contract.",
              "next_transition": ""
            },
            "evidence": [
              "case-scope:runtime-and-skill-protocol-without-page-interaction-change"
            ]
          },
          {
            "facet": "visual_expectation",
            "set": {
              "applicability": "not_required",
              "resolution": "resolved",
              "reason": "This governance change has no visual style, token, theme, or component appearance surface.",
              "next_transition": ""
            },
            "evidence": [
              "case-scope:no-visual-surface"
            ]
          },
          {
            "facet": "technical_expectation",
            "set": {
              "applicability": "required",
              "maturity": "formalized",
              "target_maturity": "formalized",
              "alignment": "aligned",
              "target_alignment": "aligned",
              "resolution": "resolved",
              "reason": "The Runtime solution documents zero-Worker review, optimistic Case revision binding, canonical ledger validation, rollback-capable commit, and bounded fresh-state auto continuation.",
              "next_transition": ""
            },
            "evidence": [
              "arckit/tech/arckit-runtime/solution.md",
              "runtime/arckit-runtime/README.md"
            ]
          },
          {
            "facet": "implementation_state",
            "set": {
              "applicability": "required",
              "maturity": "confirmed",
              "target_maturity": "confirmed",
              "alignment": "aligned",
              "target_alignment": "aligned",
              "resolution": "resolved",
              "reason": "Controller, Runtime Guard, ledger scripts, schemas, Desktop continuation, and current repository state implement the governed behavior without compatibility routing.",
              "next_transition": ""
            },
            "evidence": [
              "entry/skills/arckit-development-ledger/scripts/case-transition.mjs",
              "entry/skills/arckit-development-ledger/scripts/development-case.mjs",
              "runtime/arckit-runtime/src/agent-orchestrator.mjs",
              "runtime/arckit-runtime/src/gate-engine.mjs",
              "runtime/arckit-runtime/src/desktop-run-manager.mjs"
            ]
          },
          {
            "facet": "verification_state",
            "set": {
              "applicability": "required",
              "maturity": "formalized",
              "target_maturity": "formalized",
              "alignment": "aligned",
              "target_alignment": "aligned",
              "resolution": "resolved",
              "reason": "Runtime regression tests, ledger audits, schema parsing, syntax checks, and repository consistency checks pass.",
              "next_transition": ""
            },
            "evidence": [
              "runtime/arckit-runtime/test/case-transition.test.mjs",
              "runtime/arckit-runtime/test/capability-registry.test.mjs",
              "npm run check",
              "project-state.mjs audit",
              "project-iteration.mjs audit",
              "git diff --check"
            ]
          }
        ],
        "resolved_open_questions": [],
        "completed_handoffs": [],
        "completion_review_result": null,
        "resolved_review_findings": [],
        "review_budget_extension": null
      },
      "evidence": [
        "entry/skills/using-arckit/SKILL.md",
        "entry/skills/arckit-development-ledger/SKILL.md",
        "definition/skills/_arckit_shared/case-fact-contract.md",
        "runtime/arckit-runtime/test/case-transition.test.mjs",
        "runtime/arckit-runtime/test/capability-registry.test.mjs"
      ],
      "runtime_result_ref": "",
      "occurred_at": "2026-07-26T17:56:55.930Z"
    }
  ],
  "case_resolution": {
    "status": "resolved",
    "stage": "resolved",
    "base_ready": true,
    "satisfied": [
      "product_expectation",
      "interaction_expectation",
      "visual_expectation",
      "technical_expectation",
      "implementation_state",
      "verification_state",
      "completion_review"
    ],
    "remaining": [],
    "blocked": [],
    "reason": "All Case content is complete and the current content revision has a clean completion review.",
    "candidate_gaps": [],
    "loop_handoff": {
      "version": "loop-handoff/v2",
      "status": "done",
      "next_responsibility": "none",
      "agent_continuation_available": false,
      "human_decision_required": false,
      "trigger_mode": "none",
      "responsibility_reason": "The Case State has no unresolved content gap and the current content revision has a clean completion review.",
      "next_prompt": "",
      "agent_instruction": {
        "goal": "",
        "required_context_refs": [
          "arckit/project/state.record.json",
          "case:CASE-20260726-002"
        ],
        "required_actions": [],
        "required_checks": [
          "case_transition evidence",
          "derived case_resolution"
        ],
        "stop_condition": "Stop after applying one evidence-backed Case transition or producing a human/external handoff."
      },
      "human_gate": {
        "required": false,
        "reason": "",
        "decision_needed": ""
      },
      "progress_guard": {
        "expected_state_change": "",
        "actual_state_change": "",
        "no_progress_limit": 2,
        "max_auto_rounds": 3
      }
    },
    "updated_at": "2026-07-26T18:58:52.062Z"
  },
  "project_impact_candidate": {
    "status": "none",
    "changes": [],
    "evidence": []
  },
  "content_revision": 1,
  "completion_review": {
    "status": "clean",
    "policy": {
      "initial_max_cycles": 3,
      "source": "repository-migration:runtime/arckit-runtime/config/case-policy.json",
      "snapshotted_at": "2026-07-26T17:56:55.930Z"
    },
    "additional_cycles_authorized": 0,
    "cycle_count": 1,
    "reviewed_content_revision": 1,
    "dimensions": {
      "correctness": "clean",
      "completeness": "clean",
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
          "correctness": "clean",
          "completeness": "clean",
          "minimality": "clean"
        },
        "finding_ids": [],
        "evidence": [
          "migration:CASE-20260726-002:pre-v3-resolved-case"
        ],
        "occurred_at": "2026-07-26T17:56:55.930Z"
      }
    ],
    "evidence": [
      "migration:CASE-20260726-002:pre-v3-resolved-case"
    ],
    "escalation": null,
    "human_authorizations": []
  }
}
```

## Round Notes

- Case history is canonical in Structured Record.rounds; keep prose notes exceptional.
