# Reuse Worker threads by Case workstream

Case: CASE-20260804-002
Status: closed
Artifact Type: code
Selected Gap: none
Updated: 2026-08-04T15:31:35.227Z

## User Intent

Reuse Worker execution context by Case and primary capability/workstream while preserving Controller separation, implementation-verification independence, packet authorization, and fresh ledger revision checks.

## Structured Record

```json
{
  "schema_version": "development-case-record/v3",
  "id": "CASE-20260804-002",
  "title": "Reuse Worker threads by Case workstream",
  "status": "closed",
  "artifact_type": "code",
  "created_at": "2026-08-04T15:08:10.853Z",
  "updated_at": "2026-08-04T15:31:35.227Z",
  "user_intent": "Reuse Worker execution context by Case and primary capability/workstream while preserving Controller separation, implementation-verification independence, packet authorization, and fresh ledger revision checks.",
  "expected_outcome": "",
  "project_state_ref": "arckit/project/state.record.json",
  "current_round": {
    "goal": "",
    "selected_gap": null
  },
  "facets": {
    "product_expectation": {
      "applicability": "not_required",
      "maturity": "unknown",
      "target_maturity": "unknown",
      "alignment": "unknown",
      "target_alignment": "unknown",
      "resolution": "resolved",
      "reason": "The change is an internal Runtime conversation-context policy and introduces no product behavior or user-facing requirement.",
      "evidence": [
        "runtime/arckit-runtime/README.md",
        "arckit/tech/arckit-runtime/solution.md"
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
      "reason": "The change does not alter Desktop controls, interaction states, or operator workflows.",
      "evidence": [
        "runtime/arckit-runtime/README.md",
        "runtime/arckit-runtime/src/agent-orchestrator.mjs"
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
      "reason": "The change has no rendered UI, visual token, layout, or component appearance impact.",
      "evidence": [
        "runtime/arckit-runtime/src/agent-orchestrator.mjs",
        "runtime/arckit-runtime/src/projection/run-event-projector.mjs"
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
      "reason": "The adopted Runtime architecture defines one Controller thread plus Case-scoped Builder and Verifier lanes, with fresh packet authority and failure rotation.",
      "evidence": [
        "arckit/tech/arckit-runtime/solution.md",
        "arckit/tech/INDEX.md",
        "runtime/arckit-runtime/README.md",
        "runtime/arckit-runtime/src/agent-orchestrator.mjs"
      ],
      "next_transition": ""
    },
    "implementation_state": {
      "applicability": "required",
      "maturity": "formalized",
      "target_maturity": "formalized",
      "alignment": "aligned",
      "target_alignment": "aligned",
      "resolution": "resolved",
      "reason": "Worker tasks receive deterministic Case Builder or Verifier thread keys, adapter turns reuse those keys, failed lanes are discarded, and activity projections retain the identity.",
      "evidence": [
        "runtime/arckit-runtime/src/agent-orchestrator.mjs",
        "runtime/arckit-runtime/adapters/codex-app-server-adapter.mjs",
        "runtime/arckit-runtime/src/projection/run-event-projector.mjs"
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
      "reason": "Focused tests prove Builder reuse, Verifier isolation, Case isolation, packet authority metadata, and failed-lane rotation; the complete Runtime check passes.",
      "evidence": [
        "runtime/arckit-runtime/test/worker-thread-key.test.mjs",
        "runtime/arckit-runtime/test/codex-app-server-adapter.test.mjs",
        "runtime/arckit-runtime/test/capability-registry.test.mjs",
        "command: cd runtime/arckit-runtime && npm run check (127 passed, 1 skipped, 0 failed)"
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
      "snapshotted_at": "2026-08-04T15:08:10.853Z"
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
          "arckit/tech/arckit-runtime/solution.md",
          "runtime/arckit-runtime/src/agent-orchestrator.mjs",
          "runtime/arckit-runtime/adapters/codex-app-server-adapter.mjs",
          "runtime/arckit-runtime/src/projection/run-event-projector.mjs",
          "runtime/arckit-runtime/test/worker-thread-key.test.mjs",
          "runtime/arckit-runtime/test/codex-app-server-adapter.test.mjs",
          "runtime/arckit-runtime/test/capability-registry.test.mjs",
          "command: cd runtime/arckit-runtime && npm run check (127 passed, 1 skipped, 0 failed)"
        ],
        "occurred_at": "2026-08-04T15:31:35.227Z"
      }
    ],
    "evidence": [
      "arckit/tech/arckit-runtime/solution.md",
      "runtime/arckit-runtime/src/agent-orchestrator.mjs",
      "runtime/arckit-runtime/adapters/codex-app-server-adapter.mjs",
      "runtime/arckit-runtime/src/projection/run-event-projector.mjs",
      "runtime/arckit-runtime/test/worker-thread-key.test.mjs",
      "runtime/arckit-runtime/test/codex-app-server-adapter.test.mjs",
      "runtime/arckit-runtime/test/capability-registry.test.mjs",
      "command: cd runtime/arckit-runtime && npm run check (127 passed, 1 skipped, 0 failed)"
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
      "goal": "Resolve product_expectation with bounded evidence for the three-lane Runtime session model.",
      "outcome": "completed",
      "planned_transition": "Decide whether product_expectation is required and, within this same bounded facet, advance it as far as the accepted evidence supports.",
      "accepted_state_delta": {
        "facets": [
          {
            "facet": "product_expectation",
            "set": {
              "applicability": "not_required",
              "resolution": "resolved",
              "reason": "The change is an internal Runtime conversation-context policy and introduces no product behavior or user-facing requirement."
            },
            "evidence": [
              "runtime/arckit-runtime/README.md",
              "arckit/tech/arckit-runtime/solution.md"
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
        "runtime/arckit-runtime/README.md",
        "arckit/tech/arckit-runtime/solution.md"
      ],
      "runtime_result_ref": "",
      "occurred_at": "2026-08-04T15:31:32.853Z"
    },
    {
      "round": 2,
      "goal": "Resolve interaction_expectation with bounded evidence for the three-lane Runtime session model.",
      "outcome": "completed",
      "planned_transition": "Decide whether interaction_expectation is required and, within this same bounded facet, advance it as far as the accepted evidence supports.",
      "accepted_state_delta": {
        "facets": [
          {
            "facet": "interaction_expectation",
            "set": {
              "applicability": "not_required",
              "resolution": "resolved",
              "reason": "The change does not alter Desktop controls, interaction states, or operator workflows."
            },
            "evidence": [
              "runtime/arckit-runtime/README.md",
              "runtime/arckit-runtime/src/agent-orchestrator.mjs"
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
        "runtime/arckit-runtime/README.md",
        "runtime/arckit-runtime/src/agent-orchestrator.mjs"
      ],
      "runtime_result_ref": "",
      "occurred_at": "2026-08-04T15:31:33.244Z"
    },
    {
      "round": 3,
      "goal": "Resolve visual_expectation with bounded evidence for the three-lane Runtime session model.",
      "outcome": "completed",
      "planned_transition": "Decide whether visual_expectation is required and, within this same bounded facet, advance it as far as the accepted evidence supports.",
      "accepted_state_delta": {
        "facets": [
          {
            "facet": "visual_expectation",
            "set": {
              "applicability": "not_required",
              "resolution": "resolved",
              "reason": "The change has no rendered UI, visual token, layout, or component appearance impact."
            },
            "evidence": [
              "runtime/arckit-runtime/src/agent-orchestrator.mjs",
              "runtime/arckit-runtime/src/projection/run-event-projector.mjs"
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
        "runtime/arckit-runtime/src/agent-orchestrator.mjs",
        "runtime/arckit-runtime/src/projection/run-event-projector.mjs"
      ],
      "runtime_result_ref": "",
      "occurred_at": "2026-08-04T15:31:33.640Z"
    },
    {
      "round": 4,
      "goal": "Resolve technical_expectation with bounded evidence for the three-lane Runtime session model.",
      "outcome": "completed",
      "planned_transition": "Decide whether technical_expectation is required and, within this same bounded facet, advance it as far as the accepted evidence supports.",
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
              "reason": "The adopted Runtime architecture defines one Controller thread plus Case-scoped Builder and Verifier lanes, with fresh packet authority and failure rotation."
            },
            "evidence": [
              "arckit/tech/arckit-runtime/solution.md",
              "arckit/tech/INDEX.md",
              "runtime/arckit-runtime/README.md",
              "runtime/arckit-runtime/src/agent-orchestrator.mjs"
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
        "arckit/tech/INDEX.md",
        "runtime/arckit-runtime/README.md",
        "runtime/arckit-runtime/src/agent-orchestrator.mjs"
      ],
      "runtime_result_ref": "",
      "occurred_at": "2026-08-04T15:31:34.033Z"
    },
    {
      "round": 5,
      "goal": "Resolve implementation_state with bounded evidence for the three-lane Runtime session model.",
      "outcome": "completed",
      "planned_transition": "Decide whether implementation_state is required and, within this same bounded facet, advance it as far as the accepted evidence supports.",
      "accepted_state_delta": {
        "facets": [
          {
            "facet": "implementation_state",
            "set": {
              "applicability": "required",
              "maturity": "formalized",
              "target_maturity": "formalized",
              "alignment": "aligned",
              "target_alignment": "aligned",
              "resolution": "resolved",
              "reason": "Worker tasks receive deterministic Case Builder or Verifier thread keys, adapter turns reuse those keys, failed lanes are discarded, and activity projections retain the identity."
            },
            "evidence": [
              "runtime/arckit-runtime/src/agent-orchestrator.mjs",
              "runtime/arckit-runtime/adapters/codex-app-server-adapter.mjs",
              "runtime/arckit-runtime/src/projection/run-event-projector.mjs"
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
        "runtime/arckit-runtime/src/agent-orchestrator.mjs",
        "runtime/arckit-runtime/adapters/codex-app-server-adapter.mjs",
        "runtime/arckit-runtime/src/projection/run-event-projector.mjs"
      ],
      "runtime_result_ref": "",
      "occurred_at": "2026-08-04T15:31:34.438Z"
    },
    {
      "round": 6,
      "goal": "Resolve verification_state with bounded evidence for the three-lane Runtime session model.",
      "outcome": "completed",
      "planned_transition": "Decide whether verification_state is required and, within this same bounded facet, advance it as far as the accepted evidence supports.",
      "accepted_state_delta": {
        "facets": [
          {
            "facet": "verification_state",
            "set": {
              "applicability": "required",
              "maturity": "formalized",
              "target_maturity": "formalized",
              "alignment": "aligned",
              "target_alignment": "aligned",
              "resolution": "resolved",
              "reason": "Focused tests prove Builder reuse, Verifier isolation, Case isolation, packet authority metadata, and failed-lane rotation; the complete Runtime check passes."
            },
            "evidence": [
              "runtime/arckit-runtime/test/worker-thread-key.test.mjs",
              "runtime/arckit-runtime/test/codex-app-server-adapter.test.mjs",
              "runtime/arckit-runtime/test/capability-registry.test.mjs",
              "command: cd runtime/arckit-runtime && npm run check (127 passed, 1 skipped, 0 failed)"
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
        "runtime/arckit-runtime/test/worker-thread-key.test.mjs",
        "runtime/arckit-runtime/test/codex-app-server-adapter.test.mjs",
        "runtime/arckit-runtime/test/capability-registry.test.mjs",
        "command: cd runtime/arckit-runtime && npm run check (127 passed, 1 skipped, 0 failed)"
      ],
      "runtime_result_ref": "",
      "occurred_at": "2026-08-04T15:31:34.827Z"
    },
    {
      "round": 7,
      "goal": "Review the current content revision for correctness, completeness, and minimality.",
      "outcome": "completed",
      "planned_transition": "Review the complete Case result for correctness, completeness, and minimality, then record a clean result or evidence-backed findings.",
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
            "arckit/tech/arckit-runtime/solution.md",
            "runtime/arckit-runtime/src/agent-orchestrator.mjs",
            "runtime/arckit-runtime/adapters/codex-app-server-adapter.mjs",
            "runtime/arckit-runtime/src/projection/run-event-projector.mjs",
            "runtime/arckit-runtime/test/worker-thread-key.test.mjs",
            "runtime/arckit-runtime/test/codex-app-server-adapter.test.mjs",
            "runtime/arckit-runtime/test/capability-registry.test.mjs",
            "command: cd runtime/arckit-runtime && npm run check (127 passed, 1 skipped, 0 failed)"
          ]
        },
        "resolved_review_findings": [],
        "review_budget_extension": null
      },
      "evidence": [
        "arckit/tech/arckit-runtime/solution.md",
        "runtime/arckit-runtime/src/agent-orchestrator.mjs",
        "runtime/arckit-runtime/adapters/codex-app-server-adapter.mjs",
        "runtime/arckit-runtime/src/projection/run-event-projector.mjs",
        "runtime/arckit-runtime/test/worker-thread-key.test.mjs",
        "runtime/arckit-runtime/test/codex-app-server-adapter.test.mjs",
        "runtime/arckit-runtime/test/capability-registry.test.mjs",
        "command: cd runtime/arckit-runtime && npm run check (127 passed, 1 skipped, 0 failed)"
      ],
      "runtime_result_ref": "",
      "occurred_at": "2026-08-04T15:31:35.227Z"
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
          "case:CASE-20260804-002"
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
    "updated_at": "2026-08-04T15:31:35.227Z"
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
