# Decouple Runtime authentication from task-source enablement

Case: CASE-20260802-004
Status: closed
Artifact Type: mixed
Selected Gap: none
Updated: 2026-08-02T10:28:38.596Z

## User Intent

Use the built-in Workshop server for login without requiring users to configure or enable the task source first, while keeping business synchronization gated by source enablement.

## Structured Record

```json
{
  "schema_version": "development-case-record/v3",
  "id": "CASE-20260802-004",
  "title": "Decouple Runtime authentication from task-source enablement",
  "status": "closed",
  "artifact_type": "mixed",
  "created_at": "2026-08-02T10:24:28.630Z",
  "updated_at": "2026-08-02T10:28:38.596Z",
  "user_intent": "Use the built-in Workshop server for login without requiring users to configure or enable the task source first, while keeping business synchronization gated by source enablement.",
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
      "reason": "The existing product contract already requires the official Workshop server by default and says ordinary users do not enter connection settings; the fix restores that behavior for verification and login.",
      "evidence": [
        "arckit/spec/agentic-software-development/runtime-automation-workspace.md",
        "runtime/arckit-runtime/src/task-source-adapter.mjs"
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
      "reason": "The Login interaction accepts only verification type, target, and code; removing the hidden task-source toggle prerequisite restores the documented direct send-code and login path without changing the UI.",
      "evidence": [
        "arckit/interaction/login/interaction.md",
        "runtime/arckit-runtime/test/task-source-adapter.test.mjs"
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
      "reason": "The correction changes only main-process adapter gating; no page composition, component state, token, color, typography, or visual feedback changes.",
      "evidence": [
        "runtime/arckit-runtime/src/task-source-adapter.mjs",
        "runtime/arckit-runtime/desktop/renderer/styles.css"
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
      "reason": "The adapter now treats public NebulaAuth endpoints and authenticated Workshop business synchronization as separate gates: auth uses normalized built-in connection defaults, while business requests still require synchronization enablement and authentication.",
      "evidence": [
        "arckit/tech/arckit-runtime/solution.md",
        "runtime/arckit-runtime/src/task-source-adapter.mjs"
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
      "reason": "Factory-time and authentication-time source-enable checks were removed; only business requests invoke the renamed synchronization-enable guard, and successful login still enables synchronization and switches to NebulaAuth.",
      "evidence": [
        "runtime/arckit-runtime/src/task-source-adapter.mjs",
        "runtime/arckit-runtime/test/task-source-adapter.test.mjs"
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
      "reason": "Focused tests reproduce the persisted disabled and bearer legacy state, verify exact built-in auth-server URLs, prove login re-enables Nebula synchronization, and prove disabled business synchronization makes no network call; the full Runtime check passes 68 tests with one opt-in layout test skipped.",
      "evidence": [
        "runtime/arckit-runtime/test/task-source-adapter.test.mjs",
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
      "snapshotted_at": "2026-08-02T10:24:28.630Z"
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
          "arckit/interaction/login/interaction.md",
          "arckit/tech/arckit-runtime/solution.md",
          "runtime/arckit-runtime/src/task-source-adapter.mjs",
          "runtime/arckit-runtime/test/task-source-adapter.test.mjs",
          "runtime/arckit-runtime/package.json"
        ],
        "occurred_at": "2026-08-02T10:28:38.596Z"
      }
    ],
    "evidence": [
      "arckit/spec/agentic-software-development/runtime-automation-workspace.md",
      "arckit/interaction/login/interaction.md",
      "arckit/tech/arckit-runtime/solution.md",
      "runtime/arckit-runtime/src/task-source-adapter.mjs",
      "runtime/arckit-runtime/test/task-source-adapter.test.mjs",
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
      "goal": "Restore configuration-free Workshop verification login while preserving the task synchronization enablement boundary.",
      "outcome": "completed",
      "planned_transition": "Align Runtime authentication with the existing product, interaction, and technical contracts; implement and verify the bounded adapter correction.",
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
              "reason": "The existing product contract already requires the official Workshop server by default and says ordinary users do not enter connection settings; the fix restores that behavior for verification and login.",
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
              "applicability": "required",
              "maturity": "formalized",
              "target_maturity": "formalized",
              "alignment": "aligned",
              "target_alignment": "aligned",
              "resolution": "resolved",
              "reason": "The Login interaction accepts only verification type, target, and code; removing the hidden task-source toggle prerequisite restores the documented direct send-code and login path without changing the UI.",
              "next_transition": ""
            },
            "evidence": [
              "arckit/interaction/login/interaction.md",
              "runtime/arckit-runtime/test/task-source-adapter.test.mjs"
            ]
          },
          {
            "facet": "visual_expectation",
            "set": {
              "applicability": "not_required",
              "resolution": "resolved",
              "reason": "The correction changes only main-process adapter gating; no page composition, component state, token, color, typography, or visual feedback changes.",
              "next_transition": ""
            },
            "evidence": [
              "runtime/arckit-runtime/src/task-source-adapter.mjs",
              "runtime/arckit-runtime/desktop/renderer/styles.css"
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
              "reason": "The adapter now treats public NebulaAuth endpoints and authenticated Workshop business synchronization as separate gates: auth uses normalized built-in connection defaults, while business requests still require synchronization enablement and authentication.",
              "next_transition": ""
            },
            "evidence": [
              "arckit/tech/arckit-runtime/solution.md",
              "runtime/arckit-runtime/src/task-source-adapter.mjs"
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
              "reason": "Factory-time and authentication-time source-enable checks were removed; only business requests invoke the renamed synchronization-enable guard, and successful login still enables synchronization and switches to NebulaAuth.",
              "next_transition": ""
            },
            "evidence": [
              "runtime/arckit-runtime/src/task-source-adapter.mjs",
              "runtime/arckit-runtime/test/task-source-adapter.test.mjs"
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
              "reason": "Focused tests reproduce the persisted disabled and bearer legacy state, verify exact built-in auth-server URLs, prove login re-enables Nebula synchronization, and prove disabled business synchronization makes no network call; the full Runtime check passes 68 tests with one opt-in layout test skipped.",
              "next_transition": ""
            },
            "evidence": [
              "runtime/arckit-runtime/test/task-source-adapter.test.mjs",
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
        "arckit/interaction/login/interaction.md",
        "arckit/tech/arckit-runtime/solution.md",
        "runtime/arckit-runtime/src/task-source-adapter.mjs",
        "runtime/arckit-runtime/test/task-source-adapter.test.mjs",
        "runtime/arckit-runtime/package.json"
      ],
      "runtime_result_ref": "",
      "occurred_at": "2026-08-02T10:27:49.081Z"
    },
    {
      "round": 2,
      "goal": "Review the configuration-free authentication correction for correctness, completeness, and minimality.",
      "outcome": "completed",
      "planned_transition": "Record a clean review for content revision 1 and resolve the bounded Case.",
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
            "arckit/interaction/login/interaction.md",
            "arckit/tech/arckit-runtime/solution.md",
            "runtime/arckit-runtime/src/task-source-adapter.mjs",
            "runtime/arckit-runtime/test/task-source-adapter.test.mjs",
            "runtime/arckit-runtime/package.json"
          ]
        },
        "resolved_review_findings": [],
        "review_budget_extension": null
      },
      "evidence": [
        "runtime/arckit-runtime/src/task-source-adapter.mjs",
        "runtime/arckit-runtime/test/task-source-adapter.test.mjs",
        "runtime/arckit-runtime/package.json"
      ],
      "runtime_result_ref": "",
      "occurred_at": "2026-08-02T10:28:38.596Z"
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
          "case:CASE-20260802-004"
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
    "updated_at": "2026-08-02T10:28:38.596Z"
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
