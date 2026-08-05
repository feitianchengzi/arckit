# Prioritize final handoff freshness in todo automation

Case: CASE-20260804-003
Status: closed
Artifact Type: code
Selected Gap: none
Updated: 2026-08-04T17:01:16.287Z

## User Intent

Ensure automated state-driven loops continue until completion and pause only when the final effective handoff requires human intervention, including recovery from stale continuing projections.

## Structured Record

```json
{
  "schema_version": "development-case-record/v3",
  "id": "CASE-20260804-003",
  "title": "Prioritize final handoff freshness in todo automation",
  "status": "closed",
  "artifact_type": "code",
  "created_at": "2026-08-04T16:53:43.226Z",
  "updated_at": "2026-08-04T17:01:16.287Z",
  "user_intent": "Ensure automated state-driven loops continue until completion and pause only when the final effective handoff requires human intervention, including recovery from stale continuing projections.",
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
      "reason": "Automated todos must keep executing the state-driven loop until terminal completion and expose a pause only when the final effective handoff explicitly requires a human.",
      "evidence": [
        "arckit/spec/agentic-software-development/runtime-automation-workspace.md",
        "arckit/spec/agentic-software-development/controller-worker-loop.md"
      ],
      "next_transition": ""
    },
    "interaction_expectation": {
      "applicability": "required",
      "maturity": "formalized",
      "target_maturity": "formalized",
      "alignment": "aligned",
      "target_alignment": "aligned",
      "resolution": "resolved",
      "reason": "The existing Command Center contract already distinguishes uninterrupted automatic execution from an explicit requires_human attention state; the fix restores that documented projection without adding a new interaction.",
      "evidence": [
        "arckit/interaction/automation-workspace/interaction.md",
        "runtime/arckit-runtime/src/automation-coordinator.mjs"
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
      "reason": "The correction changes handoff source selection and persisted automation state reconciliation only; it introduces no renderer, layout, component, theme, or token change.",
      "evidence": [
        "runtime/arckit-runtime/src/kernel/effective-handoff.mjs",
        "runtime/arckit-runtime/src/automation-coordinator.mjs"
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
      "reason": "The final Runtime or projected activity handoff is the freshest session control fact; a ledger-derived handoff is a fallback because it can represent an earlier successful round within the same state-driven session.",
      "evidence": [
        "arckit/tech/arckit-runtime/solution.md",
        "runtime/arckit-runtime/src/kernel/effective-handoff.mjs"
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
      "reason": "One shared selector now enforces final Runtime/activity precedence in completion handling, detached recovery, and legacy Desktop continuation evaluation; detached human handoffs rebuild awaiting_human and attention state.",
      "evidence": [
        "runtime/arckit-runtime/src/kernel/effective-handoff.mjs",
        "runtime/arckit-runtime/src/automation-coordinator.mjs",
        "runtime/arckit-runtime/src/desktop-run-manager.mjs",
        "runtime/arckit-runtime/test/automation-coordinator.test.mjs",
        "runtime/arckit-runtime/test/desktop-run-manager.test.mjs"
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
      "reason": "Focused regressions cover both conflicting handoff directions and stale continuing restart recovery; the complete Runtime syntax and test suite passes.",
      "evidence": [
        "node --test runtime/arckit-runtime/test/desktop-run-manager.test.mjs runtime/arckit-runtime/test/automation-coordinator.test.mjs",
        "npm run check --prefix runtime/arckit-runtime",
        "runtime/arckit-runtime/test/state-driven-runner.test.mjs"
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
      "snapshotted_at": "2026-08-04T16:53:43.226Z"
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
          "runtime/arckit-runtime/src/kernel/effective-handoff.mjs",
          "runtime/arckit-runtime/src/automation-coordinator.mjs",
          "runtime/arckit-runtime/src/desktop-run-manager.mjs",
          "runtime/arckit-runtime/test/automation-coordinator.test.mjs",
          "runtime/arckit-runtime/test/desktop-run-manager.test.mjs",
          "runtime/arckit-runtime/test/state-driven-runner.test.mjs",
          "npm run check --prefix runtime/arckit-runtime",
          "git diff --check"
        ],
        "occurred_at": "2026-08-04T17:01:16.287Z"
      }
    ],
    "evidence": [
      "runtime/arckit-runtime/src/kernel/effective-handoff.mjs",
      "runtime/arckit-runtime/src/automation-coordinator.mjs",
      "runtime/arckit-runtime/src/desktop-run-manager.mjs",
      "runtime/arckit-runtime/test/automation-coordinator.test.mjs",
      "runtime/arckit-runtime/test/desktop-run-manager.test.mjs",
      "runtime/arckit-runtime/test/state-driven-runner.test.mjs",
      "npm run check --prefix runtime/arckit-runtime",
      "git diff --check"
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
      "goal": "Resolve product_expectation from durable repository evidence.",
      "outcome": "completed",
      "planned_transition": "product_expectation becomes evidence-backed and resolved for the bounded handoff freshness correction.",
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
              "reason": "Automated todos must keep executing the state-driven loop until terminal completion and expose a pause only when the final effective handoff explicitly requires a human."
            },
            "evidence": [
              "arckit/spec/agentic-software-development/runtime-automation-workspace.md",
              "arckit/spec/agentic-software-development/controller-worker-loop.md"
            ],
            "unresolved": []
          }
        ],
        "resolved_open_questions": [],
        "completed_handoffs": [],
        "completion_review_result": null,
        "resolved_review_findings": [],
        "review_budget_extension": null
      },
      "evidence": [
        "arckit/spec/agentic-software-development/runtime-automation-workspace.md",
        "arckit/spec/agentic-software-development/controller-worker-loop.md"
      ],
      "runtime_result_ref": "",
      "occurred_at": "2026-08-04T16:59:56.731Z"
    },
    {
      "round": 2,
      "goal": "Resolve interaction_expectation from durable repository evidence.",
      "outcome": "completed",
      "planned_transition": "interaction_expectation becomes evidence-backed and resolved for the bounded handoff freshness correction.",
      "accepted_state_delta": {
        "facets": [
          {
            "facet": "interaction_expectation",
            "set": {
              "applicability": "required",
              "maturity": "formalized",
              "target_maturity": "formalized",
              "alignment": "aligned",
              "target_alignment": "aligned",
              "resolution": "resolved",
              "reason": "The existing Command Center contract already distinguishes uninterrupted automatic execution from an explicit requires_human attention state; the fix restores that documented projection without adding a new interaction."
            },
            "evidence": [
              "arckit/interaction/automation-workspace/interaction.md",
              "runtime/arckit-runtime/src/automation-coordinator.mjs"
            ],
            "unresolved": []
          }
        ],
        "resolved_open_questions": [],
        "completed_handoffs": [],
        "completion_review_result": null,
        "resolved_review_findings": [],
        "review_budget_extension": null
      },
      "evidence": [
        "arckit/interaction/automation-workspace/interaction.md",
        "runtime/arckit-runtime/src/automation-coordinator.mjs"
      ],
      "runtime_result_ref": "",
      "occurred_at": "2026-08-04T16:59:57.005Z"
    },
    {
      "round": 3,
      "goal": "Resolve visual_expectation from durable repository evidence.",
      "outcome": "completed",
      "planned_transition": "visual_expectation becomes evidence-backed and resolved for the bounded handoff freshness correction.",
      "accepted_state_delta": {
        "facets": [
          {
            "facet": "visual_expectation",
            "set": {
              "applicability": "not_required",
              "resolution": "resolved",
              "reason": "The correction changes handoff source selection and persisted automation state reconciliation only; it introduces no renderer, layout, component, theme, or token change."
            },
            "evidence": [
              "runtime/arckit-runtime/src/kernel/effective-handoff.mjs",
              "runtime/arckit-runtime/src/automation-coordinator.mjs"
            ],
            "unresolved": []
          }
        ],
        "resolved_open_questions": [],
        "completed_handoffs": [],
        "completion_review_result": null,
        "resolved_review_findings": [],
        "review_budget_extension": null
      },
      "evidence": [
        "runtime/arckit-runtime/src/kernel/effective-handoff.mjs",
        "runtime/arckit-runtime/src/automation-coordinator.mjs"
      ],
      "runtime_result_ref": "",
      "occurred_at": "2026-08-04T16:59:57.278Z"
    },
    {
      "round": 4,
      "goal": "Resolve technical_expectation from durable repository evidence.",
      "outcome": "completed",
      "planned_transition": "technical_expectation becomes evidence-backed and resolved for the bounded handoff freshness correction.",
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
              "reason": "The final Runtime or projected activity handoff is the freshest session control fact; a ledger-derived handoff is a fallback because it can represent an earlier successful round within the same state-driven session."
            },
            "evidence": [
              "arckit/tech/arckit-runtime/solution.md",
              "runtime/arckit-runtime/src/kernel/effective-handoff.mjs"
            ],
            "unresolved": []
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
        "runtime/arckit-runtime/src/kernel/effective-handoff.mjs"
      ],
      "runtime_result_ref": "",
      "occurred_at": "2026-08-04T16:59:57.550Z"
    },
    {
      "round": 5,
      "goal": "Resolve implementation_state from durable repository evidence.",
      "outcome": "completed",
      "planned_transition": "implementation_state becomes evidence-backed and resolved for the bounded handoff freshness correction.",
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
              "reason": "One shared selector now enforces final Runtime/activity precedence in completion handling, detached recovery, and legacy Desktop continuation evaluation; detached human handoffs rebuild awaiting_human and attention state."
            },
            "evidence": [
              "runtime/arckit-runtime/src/kernel/effective-handoff.mjs",
              "runtime/arckit-runtime/src/automation-coordinator.mjs",
              "runtime/arckit-runtime/src/desktop-run-manager.mjs",
              "runtime/arckit-runtime/test/automation-coordinator.test.mjs",
              "runtime/arckit-runtime/test/desktop-run-manager.test.mjs"
            ],
            "unresolved": []
          }
        ],
        "resolved_open_questions": [],
        "completed_handoffs": [],
        "completion_review_result": null,
        "resolved_review_findings": [],
        "review_budget_extension": null
      },
      "evidence": [
        "runtime/arckit-runtime/src/kernel/effective-handoff.mjs",
        "runtime/arckit-runtime/src/automation-coordinator.mjs",
        "runtime/arckit-runtime/src/desktop-run-manager.mjs",
        "runtime/arckit-runtime/test/automation-coordinator.test.mjs",
        "runtime/arckit-runtime/test/desktop-run-manager.test.mjs"
      ],
      "runtime_result_ref": "",
      "occurred_at": "2026-08-04T16:59:57.811Z"
    },
    {
      "round": 6,
      "goal": "Resolve verification_state from durable repository evidence.",
      "outcome": "completed",
      "planned_transition": "verification_state becomes evidence-backed and resolved for the bounded handoff freshness correction.",
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
              "reason": "Focused regressions cover both conflicting handoff directions and stale continuing restart recovery; the complete Runtime syntax and test suite passes."
            },
            "evidence": [
              "node --test runtime/arckit-runtime/test/desktop-run-manager.test.mjs runtime/arckit-runtime/test/automation-coordinator.test.mjs",
              "npm run check --prefix runtime/arckit-runtime",
              "runtime/arckit-runtime/test/state-driven-runner.test.mjs"
            ],
            "unresolved": []
          }
        ],
        "resolved_open_questions": [],
        "completed_handoffs": [],
        "completion_review_result": null,
        "resolved_review_findings": [],
        "review_budget_extension": null
      },
      "evidence": [
        "node --test runtime/arckit-runtime/test/desktop-run-manager.test.mjs runtime/arckit-runtime/test/automation-coordinator.test.mjs",
        "npm run check --prefix runtime/arckit-runtime",
        "runtime/arckit-runtime/test/state-driven-runner.test.mjs"
      ],
      "runtime_result_ref": "",
      "occurred_at": "2026-08-04T16:59:58.082Z"
    },
    {
      "round": 7,
      "goal": "Review the complete handoff freshness correction for correctness, completeness, and minimality.",
      "outcome": "completed",
      "planned_transition": "Record a clean completion review for content_revision=6 and resolve the Case.",
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
            "runtime/arckit-runtime/src/kernel/effective-handoff.mjs",
            "runtime/arckit-runtime/src/automation-coordinator.mjs",
            "runtime/arckit-runtime/src/desktop-run-manager.mjs",
            "runtime/arckit-runtime/test/automation-coordinator.test.mjs",
            "runtime/arckit-runtime/test/desktop-run-manager.test.mjs",
            "runtime/arckit-runtime/test/state-driven-runner.test.mjs",
            "npm run check --prefix runtime/arckit-runtime",
            "git diff --check"
          ]
        },
        "resolved_review_findings": [],
        "review_budget_extension": null
      },
      "evidence": [
        "runtime/arckit-runtime/src/kernel/effective-handoff.mjs",
        "runtime/arckit-runtime/src/automation-coordinator.mjs",
        "runtime/arckit-runtime/src/desktop-run-manager.mjs",
        "runtime/arckit-runtime/test/automation-coordinator.test.mjs",
        "runtime/arckit-runtime/test/desktop-run-manager.test.mjs",
        "runtime/arckit-runtime/test/state-driven-runner.test.mjs",
        "npm run check --prefix runtime/arckit-runtime",
        "git diff --check"
      ],
      "runtime_result_ref": "",
      "occurred_at": "2026-08-04T17:01:16.287Z"
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
          "case:CASE-20260804-003"
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
    "updated_at": "2026-08-04T17:01:16.287Z"
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
