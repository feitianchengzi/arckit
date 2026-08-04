# Support parallel Case execution with serialized Project aggregation

Case: CASE-20260803-002
Status: closed
Artifact Type: mixed
Selected Gap: none
Updated: 2026-08-03T19:06:09.500Z

## User Intent

Allow multiple active Cases to advance concurrently through independent Loops while preserving per-Case revision safety and serializing shared Project, iteration, and projection commits.

## Structured Record

```json
{
  "schema_version": "development-case-record/v3",
  "id": "CASE-20260803-002",
  "title": "Support parallel Case execution with serialized Project aggregation",
  "status": "closed",
  "artifact_type": "mixed",
  "created_at": "2026-08-03T18:41:15.634Z",
  "updated_at": "2026-08-03T19:06:09.500Z",
  "user_intent": "Allow multiple active Cases to advance concurrently through independent Loops while preserving per-Case revision safety and serializing shared Project, iteration, and projection commits.",
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
      "reason": "Stable product specifications define per-Loop Case selection, parallel execution across different active Cases, and serialized canonical aggregation.",
      "evidence": [
        "arckit/spec/agentic-software-development/product-concepts.md",
        "arckit/spec/agentic-software-development/product-architecture.md",
        "arckit/spec/agentic-software-development/controller-worker-loop.md"
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
      "reason": "This bounded change alters state and Runtime semantics without introducing a new user interaction flow.",
      "evidence": [
        "arckit/spec/agentic-software-development/controller-worker-loop.md",
        "runtime/arckit-runtime/src/desktop-run-manager.mjs"
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
      "reason": "No visual surface or design token changes are required for the ledger concurrency model.",
      "evidence": [
        "runtime/arckit-runtime/src/desktop-run-manager.mjs",
        "runtime/arckit-runtime/test/parallel-case.test.mjs"
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
      "reason": "The Runtime solution defines Project State v4, per-Loop Case selection, Case transition v3 dual revisions, and a cross-process Project commit lock.",
      "evidence": [
        "arckit/tech/arckit-runtime/solution.md",
        "entry/skills/arckit-development-ledger/schema/project-state-record.schema.json",
        "entry/skills/arckit-development-ledger/schema/case-transition.schema.json"
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
      "reason": "Controller, Runtime, ledger, migration, Desktop projection, and skill contracts implement independent active Case advancement with serialized canonical commits.",
      "evidence": [
        "entry/skills/arckit-development-ledger/scripts/project-commit-lock.mjs",
        "entry/skills/arckit-development-ledger/scripts/case-transition.mjs",
        "entry/skills/arckit-development-ledger/scripts/project-state.mjs",
        "runtime/arckit-runtime/src/loop-controller.mjs",
        "runtime/arckit-runtime/src/gate-engine.mjs"
      ],
      "next_transition": ""
    },
    "verification_state": {
      "applicability": "required",
      "maturity": "confirmed",
      "target_maturity": "confirmed",
      "alignment": "aligned",
      "target_alignment": "aligned",
      "resolution": "resolved",
      "reason": "The full Runtime test suite and dedicated multi-Case and cross-process lock regressions pass.",
      "evidence": [
        "runtime/arckit-runtime/test/parallel-case.test.mjs",
        "runtime/arckit-runtime/test/project-commit-lock.test.mjs",
        "npm test: 115 tests, 114 passed, 1 skipped"
      ],
      "next_transition": ""
    }
  },
  "content_revision": 6,
  "completion_review": {
    "status": "clean",
    "policy": {
      "initial_max_cycles": 3,
      "source": "runtime/arckit-runtime/config/case-policy.json",
      "snapshotted_at": "2026-08-03T18:41:15.634Z"
    },
    "additional_cycles_authorized": 0,
    "cycle_count": 1,
    "reviewed_content_revision": 6,
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
        "content_revision": 6,
        "dimensions": {
          "correctness": "clean",
          "completeness": "clean",
          "minimality": "clean"
        },
        "finding_ids": [],
        "evidence": [
          "runtime/arckit-runtime: npm run check passed (115 tests; 114 passed; 1 existing environment-gated Electron test skipped)",
          "parallel Case regression coverage passed: independent unresolved progress, serialized closeout conflict recovery, and cross-process commit lock",
          "using-arckit and arckit-development-ledger quick_validate passed",
          "Project State audit and review-ready Case audit passed",
          "JSON parsing and git diff --check passed",
          "isolated Controller and ledger forward-tests found no semantic contradiction; review clarifications were incorporated"
        ],
        "occurred_at": "2026-08-03T19:06:09.500Z"
      }
    ],
    "evidence": [
      "runtime/arckit-runtime: npm run check passed (115 tests; 114 passed; 1 existing environment-gated Electron test skipped)",
      "parallel Case regression coverage passed: independent unresolved progress, serialized closeout conflict recovery, and cross-process commit lock",
      "using-arckit and arckit-development-ledger quick_validate passed",
      "Project State audit and review-ready Case audit passed",
      "JSON parsing and git diff --check passed",
      "isolated Controller and ledger forward-tests found no semantic contradiction; review clarifications were incorporated"
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
      "goal": "Decide whether product_expectation is required and, within this same bounded facet, advance it as far as the accepted evidence supports.",
      "outcome": "completed",
      "planned_transition": "product_expectation becomes evidence-backed and resolved.",
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
              "reason": "Stable product specifications define per-Loop Case selection, parallel execution across different active Cases, and serialized canonical aggregation."
            },
            "evidence": [
              "arckit/spec/agentic-software-development/product-concepts.md",
              "arckit/spec/agentic-software-development/product-architecture.md",
              "arckit/spec/agentic-software-development/controller-worker-loop.md"
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
        "arckit/spec/agentic-software-development/product-concepts.md",
        "arckit/spec/agentic-software-development/product-architecture.md",
        "arckit/spec/agentic-software-development/controller-worker-loop.md"
      ],
      "runtime_result_ref": "",
      "occurred_at": "2026-08-03T18:59:53.708Z"
    },
    {
      "round": 2,
      "goal": "Decide whether interaction_expectation is required and, within this same bounded facet, advance it as far as the accepted evidence supports.",
      "outcome": "completed",
      "planned_transition": "interaction_expectation becomes evidence-backed and resolved.",
      "accepted_state_delta": {
        "facets": [
          {
            "facet": "interaction_expectation",
            "set": {
              "applicability": "not_required",
              "resolution": "resolved",
              "reason": "This bounded change alters state and Runtime semantics without introducing a new user interaction flow."
            },
            "evidence": [
              "arckit/spec/agentic-software-development/controller-worker-loop.md",
              "runtime/arckit-runtime/src/desktop-run-manager.mjs"
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
        "arckit/spec/agentic-software-development/controller-worker-loop.md",
        "runtime/arckit-runtime/src/desktop-run-manager.mjs"
      ],
      "runtime_result_ref": "",
      "occurred_at": "2026-08-03T18:59:53.971Z"
    },
    {
      "round": 3,
      "goal": "Decide whether visual_expectation is required and, within this same bounded facet, advance it as far as the accepted evidence supports.",
      "outcome": "completed",
      "planned_transition": "visual_expectation becomes evidence-backed and resolved.",
      "accepted_state_delta": {
        "facets": [
          {
            "facet": "visual_expectation",
            "set": {
              "applicability": "not_required",
              "resolution": "resolved",
              "reason": "No visual surface or design token changes are required for the ledger concurrency model."
            },
            "evidence": [
              "runtime/arckit-runtime/src/desktop-run-manager.mjs",
              "runtime/arckit-runtime/test/parallel-case.test.mjs"
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
        "runtime/arckit-runtime/src/desktop-run-manager.mjs",
        "runtime/arckit-runtime/test/parallel-case.test.mjs"
      ],
      "runtime_result_ref": "",
      "occurred_at": "2026-08-03T18:59:54.221Z"
    },
    {
      "round": 4,
      "goal": "Decide whether technical_expectation is required and, within this same bounded facet, advance it as far as the accepted evidence supports.",
      "outcome": "completed",
      "planned_transition": "technical_expectation becomes evidence-backed and resolved.",
      "accepted_state_delta": {
        "facets": [
          {
            "facet": "technical_expectation",
            "set": {
              "applicability": "required",
              "maturity": "formalized",
              "target_maturity": "formalized",
              "alignment": "aligned",
              "target_alignment": "aligned",
              "resolution": "resolved",
              "reason": "The Runtime solution defines Project State v4, per-Loop Case selection, Case transition v3 dual revisions, and a cross-process Project commit lock."
            },
            "evidence": [
              "arckit/tech/arckit-runtime/solution.md",
              "entry/skills/arckit-development-ledger/schema/project-state-record.schema.json",
              "entry/skills/arckit-development-ledger/schema/case-transition.schema.json"
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
        "arckit/tech/arckit-runtime/solution.md",
        "entry/skills/arckit-development-ledger/schema/project-state-record.schema.json",
        "entry/skills/arckit-development-ledger/schema/case-transition.schema.json"
      ],
      "runtime_result_ref": "",
      "occurred_at": "2026-08-03T18:59:54.477Z"
    },
    {
      "round": 5,
      "goal": "Decide whether implementation_state is required and, within this same bounded facet, advance it as far as the accepted evidence supports.",
      "outcome": "completed",
      "planned_transition": "implementation_state becomes evidence-backed and resolved.",
      "accepted_state_delta": {
        "facets": [
          {
            "facet": "implementation_state",
            "set": {
              "applicability": "required",
              "maturity": "confirmed",
              "target_maturity": "confirmed",
              "alignment": "aligned",
              "target_alignment": "aligned",
              "resolution": "resolved",
              "reason": "Controller, Runtime, ledger, migration, Desktop projection, and skill contracts implement independent active Case advancement with serialized canonical commits."
            },
            "evidence": [
              "entry/skills/arckit-development-ledger/scripts/project-commit-lock.mjs",
              "entry/skills/arckit-development-ledger/scripts/case-transition.mjs",
              "entry/skills/arckit-development-ledger/scripts/project-state.mjs",
              "runtime/arckit-runtime/src/loop-controller.mjs",
              "runtime/arckit-runtime/src/gate-engine.mjs"
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
        "entry/skills/arckit-development-ledger/scripts/project-commit-lock.mjs",
        "entry/skills/arckit-development-ledger/scripts/case-transition.mjs",
        "entry/skills/arckit-development-ledger/scripts/project-state.mjs",
        "runtime/arckit-runtime/src/loop-controller.mjs",
        "runtime/arckit-runtime/src/gate-engine.mjs"
      ],
      "runtime_result_ref": "",
      "occurred_at": "2026-08-03T18:59:54.722Z"
    },
    {
      "round": 6,
      "goal": "Decide whether verification_state is required and, within this same bounded facet, advance it as far as the accepted evidence supports.",
      "outcome": "completed",
      "planned_transition": "verification_state becomes evidence-backed and resolved.",
      "accepted_state_delta": {
        "facets": [
          {
            "facet": "verification_state",
            "set": {
              "applicability": "required",
              "maturity": "confirmed",
              "target_maturity": "confirmed",
              "alignment": "aligned",
              "target_alignment": "aligned",
              "resolution": "resolved",
              "reason": "The full Runtime test suite and dedicated multi-Case and cross-process lock regressions pass."
            },
            "evidence": [
              "runtime/arckit-runtime/test/parallel-case.test.mjs",
              "runtime/arckit-runtime/test/project-commit-lock.test.mjs",
              "npm test: 115 tests, 114 passed, 1 skipped"
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
        "runtime/arckit-runtime/test/parallel-case.test.mjs",
        "runtime/arckit-runtime/test/project-commit-lock.test.mjs",
        "npm test: 115 tests, 114 passed, 1 skipped"
      ],
      "runtime_result_ref": "",
      "occurred_at": "2026-08-03T18:59:54.968Z"
    },
    {
      "round": 7,
      "goal": "Review the complete Case result for correctness, completeness, and minimality, then record a clean result or evidence-backed findings.",
      "outcome": "completed",
      "planned_transition": "Record a clean completion review for the implemented parallel Case execution model.",
      "accepted_state_delta": {
        "facets": [],
        "resolved_open_questions": [],
        "completed_handoffs": [],
        "completion_review_result": {
          "outcome": "clean",
          "reviewer": "agent",
          "reviewed_content_revision": 6,
          "dimensions": {
            "correctness": "clean",
            "completeness": "clean",
            "minimality": "clean"
          },
          "findings": [],
          "evidence": [
            "runtime/arckit-runtime: npm run check passed (115 tests; 114 passed; 1 existing environment-gated Electron test skipped)",
            "parallel Case regression coverage passed: independent unresolved progress, serialized closeout conflict recovery, and cross-process commit lock",
            "using-arckit and arckit-development-ledger quick_validate passed",
            "Project State audit and review-ready Case audit passed",
            "JSON parsing and git diff --check passed",
            "isolated Controller and ledger forward-tests found no semantic contradiction; review clarifications were incorporated"
          ]
        },
        "resolved_review_findings": [],
        "review_budget_extension": null
      },
      "evidence": [
        "runtime/arckit-runtime: npm run check passed (115 tests; 114 passed; 1 existing environment-gated Electron test skipped)",
        "parallel Case regression coverage passed: independent unresolved progress, serialized closeout conflict recovery, and cross-process commit lock",
        "using-arckit and arckit-development-ledger quick_validate passed",
        "Project State audit and review-ready Case audit passed",
        "JSON parsing and git diff --check passed",
        "isolated Controller and ledger forward-tests found no semantic contradiction; review clarifications were incorporated"
      ],
      "runtime_result_ref": "",
      "occurred_at": "2026-08-03T19:06:09.500Z"
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
          "case:CASE-20260803-002"
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
    "updated_at": "2026-08-03T19:06:09.500Z"
  },
  "project_impact_candidate": {
    "status": "none",
    "changes": [],
    "evidence": []
  }
}
```

## Round Notes

- Case history is canonical in Structured Record.rounds; keep prose notes exceptional.
