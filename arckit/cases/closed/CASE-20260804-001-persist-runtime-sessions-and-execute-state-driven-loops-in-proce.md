# Persist Runtime sessions and execute state-driven loops in-process

Case: CASE-20260804-001
Status: closed
Artifact Type: code
Selected Gap: none
Updated: 2026-08-04T14:13:13.493Z

## User Intent

Implement a long-lived Codex app-server session, reuse one Controller thread for planning and review, and keep automatic state-driven loop rounds inside one Runtime process until completion or a human-owned/external gate requires pause.

## Structured Record

```json
{
  "schema_version": "development-case-record/v3",
  "id": "CASE-20260804-001",
  "title": "Persist Runtime sessions and execute state-driven loops in-process",
  "status": "closed",
  "artifact_type": "code",
  "created_at": "2026-08-04T14:01:47.115Z",
  "updated_at": "2026-08-04T14:13:13.493Z",
  "user_intent": "Implement a long-lived Codex app-server session, reuse one Controller thread for planning and review, and keep automatic state-driven loop rounds inside one Runtime process until completion or a human-owned/external gate requires pause.",
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
      "reason": "The requested runtime behavior is explicit: reuse the app-server and Controller context, fresh-read state after writeback, and pause only for human responsibility.",
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
      "reason": "This bounded change preserves existing Desktop controls and adds no new user interaction contract.",
      "evidence": [
        "runtime/arckit-runtime/src/projection/run-event-projector.mjs",
        "case-scope:no-new-interaction"
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
      "reason": "The runtime lifecycle change has no visual design surface.",
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
      "reason": "The accepted architecture binds one Runtime process to one app-server, reuses one Controller thread, isolates Worker threads, and fresh-reads canonical state between rounds.",
      "evidence": [
        "arckit/tech/arckit-runtime/solution.md",
        "arckit/tech/INDEX.md"
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
      "reason": "The adapter, orchestrator, CLI session runner, Desktop boundary, and event projection implement the bounded lifecycle.",
      "evidence": [
        "runtime/arckit-runtime/adapters/codex-app-server-adapter.mjs",
        "runtime/arckit-runtime/src/state-driven-runner.mjs",
        "runtime/arckit-runtime/src/agent-orchestrator.mjs",
        "runtime/arckit-runtime/src/desktop-run-manager.mjs"
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
      "reason": "Focused lifecycle tests, dry-run smoke, syntax checks, and the complete Runtime test suite pass.",
      "evidence": [
        "runtime/arckit-runtime/test/codex-app-server-adapter.test.mjs",
        "runtime/arckit-runtime/test/state-driven-runner.test.mjs",
        "npm run check",
        "dry-run-smoke:arckit-runtime/v0.3-state-driven"
      ],
      "next_transition": ""
    }
  },
  "content_revision": 1,
  "completion_review": {
    "status": "clean",
    "policy": {
      "initial_max_cycles": 3,
      "source": "runtime/arckit-runtime/config/case-policy.json",
      "snapshotted_at": "2026-08-04T14:01:47.115Z"
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
          "npm run check",
          "git diff --check",
          "runtime/arckit-runtime/test/codex-app-server-adapter.test.mjs",
          "runtime/arckit-runtime/test/state-driven-runner.test.mjs",
          "dry-run-smoke:arckit-runtime/v0.3-state-driven",
          "arckit/tech/arckit-runtime/solution.md"
        ],
        "occurred_at": "2026-08-04T14:13:13.493Z"
      }
    ],
    "evidence": [
      "npm run check",
      "git diff --check",
      "runtime/arckit-runtime/test/codex-app-server-adapter.test.mjs",
      "runtime/arckit-runtime/test/state-driven-runner.test.mjs",
      "dry-run-smoke:arckit-runtime/v0.3-state-driven",
      "arckit/tech/arckit-runtime/solution.md"
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
      "planned_transition": "Resolve the bounded runtime product, non-UI scope, architecture, implementation, and verification facts from accepted evidence.",
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
              "reason": "The requested runtime behavior is explicit: reuse the app-server and Controller context, fresh-read state after writeback, and pause only for human responsibility.",
              "next_transition": ""
            },
            "evidence": [
              "runtime/arckit-runtime/README.md",
              "arckit/tech/arckit-runtime/solution.md"
            ]
          },
          {
            "facet": "interaction_expectation",
            "set": {
              "applicability": "not_required",
              "resolution": "resolved",
              "reason": "This bounded change preserves existing Desktop controls and adds no new user interaction contract.",
              "next_transition": ""
            },
            "evidence": [
              "runtime/arckit-runtime/src/projection/run-event-projector.mjs",
              "case-scope:no-new-interaction"
            ]
          },
          {
            "facet": "visual_expectation",
            "set": {
              "applicability": "not_required",
              "resolution": "resolved",
              "reason": "The runtime lifecycle change has no visual design surface.",
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
              "reason": "The accepted architecture binds one Runtime process to one app-server, reuses one Controller thread, isolates Worker threads, and fresh-reads canonical state between rounds.",
              "next_transition": ""
            },
            "evidence": [
              "arckit/tech/arckit-runtime/solution.md",
              "arckit/tech/INDEX.md"
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
              "reason": "The adapter, orchestrator, CLI session runner, Desktop boundary, and event projection implement the bounded lifecycle.",
              "next_transition": ""
            },
            "evidence": [
              "runtime/arckit-runtime/adapters/codex-app-server-adapter.mjs",
              "runtime/arckit-runtime/src/state-driven-runner.mjs",
              "runtime/arckit-runtime/src/agent-orchestrator.mjs",
              "runtime/arckit-runtime/src/desktop-run-manager.mjs"
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
              "reason": "Focused lifecycle tests, dry-run smoke, syntax checks, and the complete Runtime test suite pass.",
              "next_transition": ""
            },
            "evidence": [
              "runtime/arckit-runtime/test/codex-app-server-adapter.test.mjs",
              "runtime/arckit-runtime/test/state-driven-runner.test.mjs",
              "npm run check",
              "dry-run-smoke:arckit-runtime/v0.3-state-driven"
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
        "arckit/tech/arckit-runtime/solution.md",
        "runtime/arckit-runtime/src/projection/run-event-projector.mjs",
        "case-scope:no-new-interaction",
        "case-scope:no-visual-surface",
        "arckit/tech/INDEX.md",
        "runtime/arckit-runtime/adapters/codex-app-server-adapter.mjs",
        "runtime/arckit-runtime/src/state-driven-runner.mjs",
        "runtime/arckit-runtime/src/agent-orchestrator.mjs",
        "runtime/arckit-runtime/src/desktop-run-manager.mjs",
        "runtime/arckit-runtime/test/codex-app-server-adapter.test.mjs",
        "runtime/arckit-runtime/test/state-driven-runner.test.mjs",
        "npm run check",
        "dry-run-smoke:arckit-runtime/v0.3-state-driven"
      ],
      "runtime_result_ref": "",
      "occurred_at": "2026-08-04T14:12:30.196Z"
    },
    {
      "round": 2,
      "goal": "Review the complete Case result for correctness, completeness, and minimality, then record a clean result or evidence-backed findings.",
      "outcome": "completed",
      "planned_transition": "Record a clean Controller completion review for the current content revision.",
      "accepted_state_delta": {
        "facets": [],
        "resolved_open_questions": [],
        "completed_handoffs": [],
        "resolved_review_findings": [],
        "review_budget_extension": null,
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
            "npm run check",
            "git diff --check",
            "runtime/arckit-runtime/test/codex-app-server-adapter.test.mjs",
            "runtime/arckit-runtime/test/state-driven-runner.test.mjs",
            "dry-run-smoke:arckit-runtime/v0.3-state-driven",
            "arckit/tech/arckit-runtime/solution.md"
          ]
        }
      },
      "evidence": [
        "npm run check",
        "git diff --check",
        "runtime/arckit-runtime/test/codex-app-server-adapter.test.mjs",
        "runtime/arckit-runtime/test/state-driven-runner.test.mjs",
        "dry-run-smoke:arckit-runtime/v0.3-state-driven",
        "arckit/tech/arckit-runtime/solution.md"
      ],
      "runtime_result_ref": "",
      "occurred_at": "2026-08-04T14:13:13.493Z"
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
          "case:CASE-20260804-001"
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
    "updated_at": "2026-08-04T14:13:13.493Z"
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
