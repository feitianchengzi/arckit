# Restore Project State selection context after content upgrade

Case: CASE-20260810-004
Status: closed
Artifact Type: document
Selected Gap: none
Updated: 2026-08-10T16:37:21.320Z

## User Intent

Replace the completed content-upgrade focus with the highest-priority existing Project gap so fresh Project State presents a truthful next-work context.

## Structured Record

```json
{
  "schema_version": "development-case-record/v5",
  "id": "CASE-20260810-004",
  "title": "Restore Project State selection context after content upgrade",
  "status": "closed",
  "artifact_type": "document",
  "created_at": "2026-08-10T16:36:41.522Z",
  "updated_at": "2026-08-10T16:37:21.320Z",
  "user_intent": "Replace the completed content-upgrade focus with the highest-priority existing Project gap so fresh Project State presents a truthful next-work context.",
  "expected_outcome": "selection_context.current_focus points to GAP-cross-record-audit after this Case closes, with all other Project State content unchanged.",
  "project_state_ref": "arckit/project/state.record.json",
  "current_round": {
    "goal": "",
    "selected_gap": null
  },
  "facts": [
    {
      "id": "FACT-001",
      "revision": 1,
      "status": "accepted",
      "statement": "After CASE-20260810-003 resolved, advancement.selection_context.current_focus still names that completed upgrade while GAP-cross-record-audit remains an open high-risk, high-urgency Project gap.",
      "basis": "Fresh Project State summary after the content-upgrade completion transition.",
      "evidence": [
        "arckit/project/state.record.json",
        "arckit/cases/closed/CASE-20260810-003-upgrade-project-state-v5-content-evidence.md"
      ]
    },
    {
      "id": "FACT-002",
      "revision": 1,
      "status": "accepted",
      "statement": "GAP-cross-record-audit is the next Project focus after the Project State content upgrade because it remains open with high risk and high urgency.",
      "basis": "Fresh comparison of advancement.project_gaps priority_basis values.",
      "evidence": [
        "arckit/project/state.record.json"
      ]
    }
  ],
  "state_impacts": [
    {
      "id": "IMPACT-001",
      "fact_id": "FACT-001",
      "fact_revision": 1,
      "target": {
        "kind": "software_decision",
        "ref": "data_and_state",
        "revision": 1
      },
      "effect": "upheld",
      "reason": "The canonical selection context now names a currently open Project gap selected from fresh priority evidence.",
      "gap_ids": [],
      "evidence": [
        "arckit/project/state.record.json"
      ]
    }
  ],
  "gaps": [
    {
      "id": "GAP-RESTORE-SELECTION-CONTEXT",
      "status": "resolved",
      "goal": "Set Project State current_focus to the existing highest-priority GAP-cross-record-audit goal after the completed content upgrade.",
      "reason": "Fresh consumers otherwise recover a completed task as the current Project focus.",
      "derived_from": [
        "case_intent",
        "FACT-001",
        "GAP-cross-record-audit",
        "data_and_state"
      ],
      "blocked_by": [],
      "priority_basis": {
        "blocking": "high",
        "uncertainty": "low",
        "risk": "medium",
        "user_impact": "medium"
      },
      "responsibility": "agent",
      "evidence_required": [
        "selection context names an open Project gap",
        "Project State cross-record audit"
      ],
      "resolution": {
        "id": "GAP-RESTORE-SELECTION-CONTEXT",
        "status": "resolved",
        "outcome": "Project current_focus now points to the open GAP-cross-record-audit goal: Accept strict Project, Iteration and Case cross-record auditing in real use.",
        "reason": "This is the only open Project gap whose priority basis is both high risk and high urgency.",
        "evidence": [
          "arckit/project/state.record.json",
          "arckit/cases/closed/CASE-20260810-003-upgrade-project-state-v5-content-evidence.md"
        ],
        "occurred_at": "2026-08-10T16:37:01.352Z"
      }
    }
  ],
  "content_revision": 1,
  "completion_review": {
    "status": "clean",
    "policy": {
      "initial_max_cycles": 3,
      "source": "using-arckit:content-upgrade-closeout:2026-08-11",
      "snapshotted_at": "2026-08-10T16:36:41.522Z"
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
          "arckit/project/state.record.json",
          "arckit/project/STATE.md",
          "verification:project-state-validate:ok",
          "verification:project-state-cross-record-audit:ok",
          "verification:selection-context-matches-open-project-gap"
        ],
        "occurred_at": "2026-08-10T16:37:21.320Z"
      }
    ],
    "evidence": [
      "arckit/project/state.record.json",
      "arckit/project/STATE.md",
      "verification:project-state-validate:ok",
      "verification:project-state-cross-record-audit:ok",
      "verification:selection-context-matches-open-project-gap"
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
      "goal": "Restore a truthful current Project focus after the content-upgrade Case closed.",
      "outcome": "completed",
      "selected_gap": {
        "id": "GAP-RESTORE-SELECTION-CONTEXT",
        "responsibility": "agent",
        "goal": "Set Project State current_focus to the existing highest-priority GAP-cross-record-audit goal after the completed content upgrade.",
        "reason": "Fresh consumers otherwise recover a completed task as the current Project focus.",
        "derived_from": [
          "case_intent",
          "FACT-001",
          "GAP-cross-record-audit",
          "data_and_state"
        ],
        "blocked_by": [],
        "priority_basis": {
          "blocking": "high",
          "uncertainty": "low",
          "risk": "medium",
          "user_impact": "medium"
        },
        "evidence_required": [
          "selection context names an open Project gap",
          "Project State cross-record audit"
        ]
      },
      "planned_transition": {
        "goal": "Restore a truthful current Project focus after the content-upgrade Case closed.",
        "expected_state_change": "selection_context.current_focus names the open high-risk, high-urgency cross-record audit gap and the bounded correction gap closes."
      },
      "accepted_state_delta": {
        "resolved_gap": {
          "id": "GAP-RESTORE-SELECTION-CONTEXT",
          "status": "resolved",
          "outcome": "Project current_focus now points to the open GAP-cross-record-audit goal: Accept strict Project, Iteration and Case cross-record auditing in real use.",
          "reason": "This is the only open Project gap whose priority basis is both high risk and high urgency.",
          "evidence": [
            "arckit/project/state.record.json",
            "arckit/cases/closed/CASE-20260810-003-upgrade-project-state-v5-content-evidence.md"
          ]
        },
        "facts_added": [
          {
            "id": "FACT-002",
            "revision": 1,
            "status": "accepted",
            "statement": "GAP-cross-record-audit is the next Project focus after the Project State content upgrade because it remains open with high risk and high urgency.",
            "basis": "Fresh comparison of advancement.project_gaps priority_basis values.",
            "evidence": [
              "arckit/project/state.record.json"
            ]
          }
        ],
        "facts_superseded": [],
        "impacts_added": [],
        "impacts_updated": [
          {
            "id": "IMPACT-001",
            "fact_id": "FACT-001",
            "fact_revision": 1,
            "target": {
              "kind": "software_decision",
              "ref": "data_and_state",
              "revision": 1
            },
            "effect": "upheld",
            "reason": "The canonical selection context now names a currently open Project gap selected from fresh priority evidence.",
            "gap_ids": [],
            "evidence": [
              "arckit/project/state.record.json"
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
        "selection_context_change": {
          "current_focus": "Accept strict Project, Iteration and Case cross-record auditing in real use."
        },
        "evidence": [
          "arckit/project/state.record.json"
        ]
      },
      "evidence": [
        "arckit/project/state.record.json",
        "arckit/cases/closed/CASE-20260810-003-upgrade-project-state-v5-content-evidence.md"
      ],
      "runtime_result_ref": "",
      "occurred_at": "2026-08-10T16:37:01.352Z"
    },
    {
      "round": 2,
      "goal": "Review the final selection-context correction.",
      "outcome": "completed",
      "selected_gap": {
        "id": "CASE-20260810-004:completion-review:1",
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
        "goal": "Review the final selection-context correction.",
        "expected_state_change": "Record a clean review and close the bounded correction Case without changing Project content."
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
            "arckit/project/state.record.json",
            "arckit/project/STATE.md",
            "verification:project-state-validate:ok",
            "verification:project-state-cross-record-audit:ok",
            "verification:selection-context-matches-open-project-gap"
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
      "evidence": [
        "arckit/project/state.record.json",
        "arckit/project/STATE.md",
        "verification:project-state-validate:ok",
        "verification:project-state-cross-record-audit:ok",
        "verification:selection-context-matches-open-project-gap"
      ],
      "runtime_result_ref": "",
      "occurred_at": "2026-08-10T16:37:21.320Z"
    }
  ],
  "case_resolution": {
    "status": "resolved",
    "stage": "resolved",
    "satisfied": [
      "GAP-RESTORE-SELECTION-CONTEXT"
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
    "updated_at": "2026-08-10T16:37:21.320Z"
  }
}
```

## Round Notes

- Case history is canonical in Structured Record.rounds; keep prose notes exceptional.
