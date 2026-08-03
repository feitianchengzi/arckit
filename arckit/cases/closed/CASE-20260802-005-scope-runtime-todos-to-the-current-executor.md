# Scope Runtime todos to the current executor

Case: CASE-20260802-005
Status: closed
Artifact Type: mixed
Selected Gap: none
Updated: 2026-08-02T12:11:24.760Z

## User Intent

Show, count, queue, and process only Workshop todos whose executor is the currently authenticated user; exclude creator-only, unassigned, and other-user tasks.

## Structured Record

```json
{
  "schema_version": "development-case-record/v3",
  "id": "CASE-20260802-005",
  "title": "Scope Runtime todos to the current executor",
  "status": "closed",
  "artifact_type": "mixed",
  "created_at": "2026-08-02T12:05:06.302Z",
  "updated_at": "2026-08-02T12:11:24.760Z",
  "user_intent": "Show, count, queue, and process only Workshop todos whose executor is the currently authenticated user; exclude creator-only, unassigned, and other-user tasks.",
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
      "reason": "The product specification now defines executor ownership as the sole task inclusion rule across display, counts, queueing, and automation; creator-only, unassigned, and other-user tasks are explicitly excluded.",
      "evidence": [
        "arckit/spec/agentic-software-development/runtime-automation-workspace.md",
        "runtime/arckit-runtime/src/task-source-adapter.mjs"
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
      "reason": "The request changes the synchronized task population, not navigation, controls, user actions, feedback placement, or interaction states.",
      "evidence": [
        "arckit/interaction/automation-workspace/interaction.md",
        "runtime/arckit-runtime/desktop/renderer/renderer.js"
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
      "reason": "No visual hierarchy, component appearance, token, layout, typography, or animation changes are introduced.",
      "evidence": [
        "runtime/arckit-runtime/desktop/renderer/styles.css",
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
      "reason": "The technical solution defines project-member identity resolution, executor_id server filtering, normalized response filtering, safe stale-snapshot retention, and assignment revalidation before all task writes.",
      "evidence": [
        "arckit/tech/arckit-runtime/solution.md",
        "runtime/arckit-runtime/src/task-source-adapter.mjs",
        "runtime/arckit-runtime/src/automation-coordinator.mjs"
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
      "reason": "Runtime resolves the current project user, requests tasks with executor_id, filters normalized responses again, drops unprovable stale tasks, and revalidates assignment before manual updates, automatic claims, and completion writeback.",
      "evidence": [
        "runtime/arckit-runtime/src/task-source-adapter.mjs",
        "runtime/arckit-runtime/src/automation-coordinator.mjs",
        "runtime/arckit-runtime/README.md"
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
      "reason": "Tests verify the executor_id query, local exclusion of another executor, unresolved project identity fail-closed behavior, reassigned update rejection, assigned-only stale snapshot retention, and coordinator executor propagation; the complete Runtime suite passes 69 tests with one opt-in layout test skipped.",
      "evidence": [
        "runtime/arckit-runtime/test/task-source-adapter.test.mjs",
        "runtime/arckit-runtime/test/automation-coordinator.test.mjs",
        "runtime/arckit-runtime/package.json"
      ],
      "next_transition": ""
    }
  },
  "content_revision": 1,
  "completion_review": {
    "status": "clean",
    "policy": {
      "initial_max_cycles": 3,
      "source": "user-confirmed-using-arckit-loop-2026-08-02",
      "snapshotted_at": "2026-08-02T12:05:06.302Z"
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
          "arckit/spec/agentic-software-development/runtime-automation-workspace.md",
          "arckit/tech/arckit-runtime/solution.md",
          "runtime/arckit-runtime/README.md",
          "runtime/arckit-runtime/src/task-source-adapter.mjs",
          "runtime/arckit-runtime/src/automation-coordinator.mjs",
          "runtime/arckit-runtime/test/task-source-adapter.test.mjs",
          "runtime/arckit-runtime/test/automation-coordinator.test.mjs",
          "runtime/arckit-runtime/package.json"
        ],
        "occurred_at": "2026-08-02T12:11:24.760Z"
      }
    ],
    "evidence": [
      "arckit/spec/agentic-software-development/runtime-automation-workspace.md",
      "arckit/tech/arckit-runtime/solution.md",
      "runtime/arckit-runtime/README.md",
      "runtime/arckit-runtime/src/task-source-adapter.mjs",
      "runtime/arckit-runtime/src/automation-coordinator.mjs",
      "runtime/arckit-runtime/test/task-source-adapter.test.mjs",
      "runtime/arckit-runtime/test/automation-coordinator.test.mjs",
      "runtime/arckit-runtime/package.json"
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
      "goal": "Restrict Runtime task visibility, counts, queues, and state writes to Workshop tasks assigned to the authenticated user.",
      "outcome": "completed",
      "planned_transition": "Formalize the current-executor boundary, implement server and local enforcement, and verify fail-closed reassignment behavior.",
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
              "reason": "The product specification now defines executor ownership as the sole task inclusion rule across display, counts, queueing, and automation; creator-only, unassigned, and other-user tasks are explicitly excluded.",
              "next_transition": ""
            },
            "evidence": [
              "arckit/spec/agentic-software-development/runtime-automation-workspace.md",
              "runtime/arckit-runtime/src/task-source-adapter.mjs"
            ]
          },
          {
            "facet": "interaction_expectation",
            "set": {
              "applicability": "not_required",
              "resolution": "resolved",
              "reason": "The request changes the synchronized task population, not navigation, controls, user actions, feedback placement, or interaction states.",
              "next_transition": ""
            },
            "evidence": [
              "arckit/interaction/automation-workspace/interaction.md",
              "runtime/arckit-runtime/desktop/renderer/renderer.js"
            ]
          },
          {
            "facet": "visual_expectation",
            "set": {
              "applicability": "not_required",
              "resolution": "resolved",
              "reason": "No visual hierarchy, component appearance, token, layout, typography, or animation changes are introduced.",
              "next_transition": ""
            },
            "evidence": [
              "runtime/arckit-runtime/desktop/renderer/styles.css",
              "runtime/arckit-runtime/src/automation-coordinator.mjs"
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
              "reason": "The technical solution defines project-member identity resolution, executor_id server filtering, normalized response filtering, safe stale-snapshot retention, and assignment revalidation before all task writes.",
              "next_transition": ""
            },
            "evidence": [
              "arckit/tech/arckit-runtime/solution.md",
              "runtime/arckit-runtime/src/task-source-adapter.mjs",
              "runtime/arckit-runtime/src/automation-coordinator.mjs"
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
              "reason": "Runtime resolves the current project user, requests tasks with executor_id, filters normalized responses again, drops unprovable stale tasks, and revalidates assignment before manual updates, automatic claims, and completion writeback.",
              "next_transition": ""
            },
            "evidence": [
              "runtime/arckit-runtime/src/task-source-adapter.mjs",
              "runtime/arckit-runtime/src/automation-coordinator.mjs",
              "runtime/arckit-runtime/README.md"
            ]
          },
          {
            "facet": "verification_state",
            "set": {
              "applicability": "required",
              "maturity": "confirmed",
              "target_maturity": "confirmed",
              "alignment": "aligned",
              "target_alignment": "aligned",
              "resolution": "resolved",
              "reason": "Tests verify the executor_id query, local exclusion of another executor, unresolved project identity fail-closed behavior, reassigned update rejection, assigned-only stale snapshot retention, and coordinator executor propagation; the complete Runtime suite passes 69 tests with one opt-in layout test skipped.",
              "next_transition": ""
            },
            "evidence": [
              "runtime/arckit-runtime/test/task-source-adapter.test.mjs",
              "runtime/arckit-runtime/test/automation-coordinator.test.mjs",
              "runtime/arckit-runtime/package.json"
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
        "arckit/spec/agentic-software-development/runtime-automation-workspace.md",
        "arckit/tech/arckit-runtime/solution.md",
        "runtime/arckit-runtime/README.md",
        "runtime/arckit-runtime/src/task-source-adapter.mjs",
        "runtime/arckit-runtime/src/automation-coordinator.mjs",
        "runtime/arckit-runtime/test/task-source-adapter.test.mjs",
        "runtime/arckit-runtime/test/automation-coordinator.test.mjs"
      ],
      "runtime_result_ref": "",
      "occurred_at": "2026-08-02T12:10:57.039Z"
    },
    {
      "round": 2,
      "goal": "Review current-executor task scoping across definitions, synchronization, display, queueing, and state writes.",
      "outcome": "completed",
      "planned_transition": "Record a clean completion review for content revision 1 and resolve the Case.",
      "accepted_state_delta": {
        "facets": [],
        "resolved_open_questions": [],
        "completed_handoffs": [],
        "completion_review_result": {
          "outcome": "clean",
          "reviewer": "agent",
          "reviewed_content_revision": 1,
          "dimensions": {
            "correctness": "clean",
            "completeness": "clean",
            "minimality": "clean"
          },
          "findings": [],
          "evidence": [
            "arckit/spec/agentic-software-development/runtime-automation-workspace.md",
            "arckit/tech/arckit-runtime/solution.md",
            "runtime/arckit-runtime/README.md",
            "runtime/arckit-runtime/src/task-source-adapter.mjs",
            "runtime/arckit-runtime/src/automation-coordinator.mjs",
            "runtime/arckit-runtime/test/task-source-adapter.test.mjs",
            "runtime/arckit-runtime/test/automation-coordinator.test.mjs",
            "runtime/arckit-runtime/package.json"
          ]
        },
        "resolved_review_findings": [],
        "review_budget_extension": null
      },
      "evidence": [
        "runtime/arckit-runtime/src/task-source-adapter.mjs",
        "runtime/arckit-runtime/src/automation-coordinator.mjs",
        "runtime/arckit-runtime/test/task-source-adapter.test.mjs",
        "runtime/arckit-runtime/test/automation-coordinator.test.mjs",
        "runtime/arckit-runtime/package.json"
      ],
      "runtime_result_ref": "",
      "occurred_at": "2026-08-02T12:11:24.760Z"
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
          "case:CASE-20260802-005"
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
    "updated_at": "2026-08-02T12:11:24.760Z"
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
