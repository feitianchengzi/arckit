# Prevent Runtime schema failures from entering retry loops

Case: CASE-20260810-002
Status: closed
Artifact Type: code
Selected Gap: none
Updated: 2026-08-10T16:34:22.892Z

## User Intent

Repair the Runtime output-schema contract and failure classification that caused Workshop todo 1060 to repeat the same invalid_json_schema turn eight times.

## Structured Record

```json
{
  "schema_version": "development-case-record/v5",
  "id": "CASE-20260810-002",
  "title": "Prevent Runtime schema failures from entering retry loops",
  "status": "closed",
  "artifact_type": "code",
  "created_at": "2026-08-10T16:23:30.278Z",
  "updated_at": "2026-08-10T16:34:22.892Z",
  "user_intent": "Repair the Runtime output-schema contract and failure classification that caused Workshop todo 1060 to repeat the same invalid_json_schema turn eight times.",
  "expected_outcome": "Codex-bound output schemas pass strict preflight, non-retryable request/schema failures stop immediately without agent continuation, no-progress limits are honored, and Desktop does not report blocked runs as completed.",
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
      "statement": "Runtime run RUN-20260810-160126477Z submitted an invalid nullable-object output schema, converted the app-server invalid_json_schema failure into an agent retry handoff, repeated eight no-progress rounds, and surfaced the process as completed although no Case or ledger transition was produced.",
      "basis": "Persisted Runtime result plus the exact schema, adapter, continuation, and Desktop status code paths reproduce every observed event.",
      "evidence": [
        "arckit-runtime://runs/RUN-20260810-160126477Z",
        "runtime/arckit-runtime/schemas/agent-loop-result.schema.json",
        "runtime/arckit-runtime/src/codex-output-schema.mjs",
        "runtime/arckit-runtime/adapters/codex-app-server-adapter.mjs",
        "runtime/arckit-runtime/src/state-driven-runner.mjs",
        "runtime/arckit-runtime/src/desktop-run-manager.mjs"
      ]
    },
    {
      "id": "FACT-002",
      "revision": 1,
      "status": "accepted",
      "statement": "Runtime now enforces strict nullable-object output schemas locally and remotely, treats terminal Codex request failures as non-retryable turn errors, clamps no-progress retries to the handoff guard, and prevents semantic Runtime failures from being displayed as completed.",
      "basis": "The repaired code paths are covered by focused regressions, the complete Runtime check, and a real Codex app-server structured-output acceptance probe.",
      "evidence": [
        "runtime/arckit-runtime/schemas/agent-loop-result.schema.json",
        "runtime/arckit-runtime/src/codex-output-schema.mjs",
        "runtime/arckit-runtime/adapters/codex-app-server-adapter.mjs",
        "runtime/arckit-runtime/src/state-driven-runner.mjs",
        "runtime/arckit-runtime/src/desktop-run-manager.mjs",
        "runtime/arckit-runtime/test/codex-output-schema.test.mjs",
        "runtime/arckit-runtime/test/codex-app-server-adapter.test.mjs",
        "runtime/arckit-runtime/test/state-driven-runner.test.mjs",
        "runtime/arckit-runtime/test/desktop-run-manager.test.mjs",
        "verification:npm-run-check:87-tests-86-pass-1-conditional-skip",
        "verification:codex-app-server-output-schema-probe:accepted:2026-08-11"
      ]
    }
  ],
  "state_impacts": [
    {
      "id": "IMPACT-001",
      "fact_id": "FACT-002",
      "fact_revision": 1,
      "target": {
        "kind": "software_decision",
        "ref": "external_integrations",
        "revision": 1
      },
      "effect": "upheld",
      "reason": "The output schema now uses explicit strict object branches, local preflight detects union-object and untyped enum defects, and terminal app-server errors reject the Agent turn instead of becoming retry handoffs.",
      "gap_ids": [],
      "evidence": [
        "runtime/arckit-runtime/schemas/agent-loop-result.schema.json",
        "runtime/arckit-runtime/src/codex-output-schema.mjs",
        "runtime/arckit-runtime/adapters/codex-app-server-adapter.mjs",
        "runtime/arckit-runtime/test/codex-output-schema.test.mjs",
        "runtime/arckit-runtime/test/codex-app-server-adapter.test.mjs",
        "verification:codex-app-server-output-schema-probe:accepted:2026-08-11"
      ]
    },
    {
      "id": "IMPACT-002",
      "fact_id": "FACT-002",
      "fact_revision": 1,
      "target": {
        "kind": "software_decision",
        "ref": "observability_and_operation",
        "revision": 1
      },
      "effect": "upheld",
      "reason": "Runtime now honors the stricter handoff no-progress guard, while Desktop maps semantic stop failures to failed even when the child process exits with code zero.",
      "gap_ids": [],
      "evidence": [
        "runtime/arckit-runtime/src/state-driven-runner.mjs",
        "runtime/arckit-runtime/src/desktop-run-manager.mjs",
        "runtime/arckit-runtime/test/state-driven-runner.test.mjs",
        "runtime/arckit-runtime/test/desktop-run-manager.test.mjs"
      ]
    },
    {
      "id": "IMPACT-003",
      "fact_id": "FACT-002",
      "fact_revision": 1,
      "target": {
        "kind": "software_invariant",
        "ref": "material-risks-have-credible-evidence",
        "revision": null
      },
      "effect": "upheld",
      "reason": "Focused regressions, the full Runtime check, and a real app-server structured-output probe cover the repaired integration and status boundaries.",
      "gap_ids": [],
      "evidence": [
        "runtime/arckit-runtime/test/codex-output-schema.test.mjs",
        "runtime/arckit-runtime/test/codex-app-server-adapter.test.mjs",
        "runtime/arckit-runtime/test/state-driven-runner.test.mjs",
        "runtime/arckit-runtime/test/desktop-run-manager.test.mjs",
        "verification:npm-run-check:87-tests-86-pass-1-conditional-skip",
        "verification:codex-app-server-output-schema-probe:accepted:2026-08-11"
      ]
    }
  ],
  "gaps": [
    {
      "id": "GAP-RUNTIME-SCHEMA-ERROR-RECOVERY",
      "status": "resolved",
      "goal": "Make all Codex output-schema object branches strict and ensure deterministic request/schema failures terminate without repeated Agent turns or completed-status projection.",
      "reason": "This single failure chain blocks every Runtime todo before semantic execution and amplifies one configuration error into repeated turns and misleading completion state.",
      "derived_from": [
        "case_intent",
        "FACT-001",
        "GAP-runtime-resilience-and-adapters",
        "external_integrations",
        "observability_and_operation",
        "material-risks-have-credible-evidence"
      ],
      "blocked_by": [],
      "priority_basis": {
        "blocking": "critical",
        "uncertainty": "low",
        "risk": "high",
        "user_impact": "high"
      },
      "responsibility": "agent",
      "evidence_required": [
        "strict nullable-object schema regression tests",
        "non-retryable Codex failure continuation test",
        "no-progress limit test",
        "Desktop blocked-run status test",
        "full Runtime test suite"
      ],
      "resolution": {
        "id": "GAP-RUNTIME-SCHEMA-ERROR-RECOVERY",
        "status": "resolved",
        "outcome": "Runtime rejects malformed output schemas before submission, Codex terminal request errors stop the Agent turn, no-progress guards are honored, and Desktop reports semantic Runtime failures as failed.",
        "reason": "All required implementation paths and regressions are present; the full suite and a live app-server Schema probe pass.",
        "evidence": [
          "runtime/arckit-runtime/schemas/agent-loop-result.schema.json",
          "runtime/arckit-runtime/src/codex-output-schema.mjs",
          "runtime/arckit-runtime/adapters/codex-app-server-adapter.mjs",
          "runtime/arckit-runtime/src/state-driven-runner.mjs",
          "runtime/arckit-runtime/src/desktop-run-manager.mjs",
          "runtime/arckit-runtime/test/codex-output-schema.test.mjs",
          "runtime/arckit-runtime/test/codex-app-server-adapter.test.mjs",
          "runtime/arckit-runtime/test/state-driven-runner.test.mjs",
          "runtime/arckit-runtime/test/desktop-run-manager.test.mjs",
          "verification:npm-run-check:87-tests-86-pass-1-conditional-skip",
          "verification:codex-app-server-output-schema-probe:accepted:2026-08-11"
        ],
        "occurred_at": "2026-08-10T16:33:46.161Z"
      }
    }
  ],
  "content_revision": 1,
  "completion_review": {
    "status": "clean",
    "policy": {
      "initial_max_cycles": 3,
      "source": "runtime/arckit-runtime/config/case-policy.json",
      "snapshotted_at": "2026-08-10T16:23:30.278Z"
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
          "review:implementation-correctness:strict-anyOf-object-definitions-and-terminal-error-path-inspected",
          "review:problem-resolution:original-invalid-json-schema-retry-chain-is-broken-at-preflight-and-terminal-error-boundaries",
          "review:verification-credibility:focused-regressions-plus-full-runtime-suite-plus-live-app-server-probe",
          "review:regression-risk:human-and-external-handoffs-remain-distinct-from-semantic-failure-stop-reasons",
          "review:minimality:changes-confined-to-schema-validation-failure-classification-progress-guard-status-projection-and-tests",
          "verification:npm-run-check:87-tests-86-pass-1-conditional-skip",
          "verification:codex-app-server-output-schema-probe:accepted:2026-08-11",
          "verification:project-state-audit:ok",
          "verification:case-audit:review-ready",
          "verification:git-diff-check:clean"
        ],
        "occurred_at": "2026-08-10T16:34:22.892Z"
      }
    ],
    "evidence": [
      "review:implementation-correctness:strict-anyOf-object-definitions-and-terminal-error-path-inspected",
      "review:problem-resolution:original-invalid-json-schema-retry-chain-is-broken-at-preflight-and-terminal-error-boundaries",
      "review:verification-credibility:focused-regressions-plus-full-runtime-suite-plus-live-app-server-probe",
      "review:regression-risk:human-and-external-handoffs-remain-distinct-from-semantic-failure-stop-reasons",
      "review:minimality:changes-confined-to-schema-validation-failure-classification-progress-guard-status-projection-and-tests",
      "verification:npm-run-check:87-tests-86-pass-1-conditional-skip",
      "verification:codex-app-server-output-schema-probe:accepted:2026-08-11",
      "verification:project-state-audit:ok",
      "verification:case-audit:review-ready",
      "verification:git-diff-check:clean"
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
      "goal": "Repair strict structured-output validation and prevent terminal request failures from becoming misleading retry loops.",
      "outcome": "completed",
      "selected_gap": {
        "id": "GAP-RUNTIME-SCHEMA-ERROR-RECOVERY",
        "responsibility": "agent",
        "goal": "Make all Codex output-schema object branches strict and ensure deterministic request/schema failures terminate without repeated Agent turns or completed-status projection.",
        "reason": "This single failure chain blocks every Runtime todo before semantic execution and amplifies one configuration error into repeated turns and misleading completion state.",
        "derived_from": [
          "case_intent",
          "FACT-001",
          "GAP-runtime-resilience-and-adapters",
          "external_integrations",
          "observability_and_operation",
          "material-risks-have-credible-evidence"
        ],
        "blocked_by": [],
        "priority_basis": {
          "blocking": "critical",
          "uncertainty": "low",
          "risk": "high",
          "user_impact": "high"
        },
        "evidence_required": [
          "strict nullable-object schema regression tests",
          "non-retryable Codex failure continuation test",
          "no-progress limit test",
          "Desktop blocked-run status test",
          "full Runtime test suite"
        ]
      },
      "planned_transition": {
        "goal": "Repair strict structured-output validation and prevent terminal request failures from becoming misleading retry loops.",
        "expected_state_change": "The implementation gap is resolved with strict Schema evidence, terminal-error propagation, bounded no-progress behavior, and accurate Desktop status projection."
      },
      "accepted_state_delta": {
        "resolved_gap": {
          "id": "GAP-RUNTIME-SCHEMA-ERROR-RECOVERY",
          "status": "resolved",
          "outcome": "Runtime rejects malformed output schemas before submission, Codex terminal request errors stop the Agent turn, no-progress guards are honored, and Desktop reports semantic Runtime failures as failed.",
          "reason": "All required implementation paths and regressions are present; the full suite and a live app-server Schema probe pass.",
          "evidence": [
            "runtime/arckit-runtime/schemas/agent-loop-result.schema.json",
            "runtime/arckit-runtime/src/codex-output-schema.mjs",
            "runtime/arckit-runtime/adapters/codex-app-server-adapter.mjs",
            "runtime/arckit-runtime/src/state-driven-runner.mjs",
            "runtime/arckit-runtime/src/desktop-run-manager.mjs",
            "runtime/arckit-runtime/test/codex-output-schema.test.mjs",
            "runtime/arckit-runtime/test/codex-app-server-adapter.test.mjs",
            "runtime/arckit-runtime/test/state-driven-runner.test.mjs",
            "runtime/arckit-runtime/test/desktop-run-manager.test.mjs",
            "verification:npm-run-check:87-tests-86-pass-1-conditional-skip",
            "verification:codex-app-server-output-schema-probe:accepted:2026-08-11"
          ]
        },
        "facts_added": [
          {
            "id": "FACT-002",
            "revision": 1,
            "status": "accepted",
            "statement": "Runtime now enforces strict nullable-object output schemas locally and remotely, treats terminal Codex request failures as non-retryable turn errors, clamps no-progress retries to the handoff guard, and prevents semantic Runtime failures from being displayed as completed.",
            "basis": "The repaired code paths are covered by focused regressions, the complete Runtime check, and a real Codex app-server structured-output acceptance probe.",
            "evidence": [
              "runtime/arckit-runtime/schemas/agent-loop-result.schema.json",
              "runtime/arckit-runtime/src/codex-output-schema.mjs",
              "runtime/arckit-runtime/adapters/codex-app-server-adapter.mjs",
              "runtime/arckit-runtime/src/state-driven-runner.mjs",
              "runtime/arckit-runtime/src/desktop-run-manager.mjs",
              "runtime/arckit-runtime/test/codex-output-schema.test.mjs",
              "runtime/arckit-runtime/test/codex-app-server-adapter.test.mjs",
              "runtime/arckit-runtime/test/state-driven-runner.test.mjs",
              "runtime/arckit-runtime/test/desktop-run-manager.test.mjs",
              "verification:npm-run-check:87-tests-86-pass-1-conditional-skip",
              "verification:codex-app-server-output-schema-probe:accepted:2026-08-11"
            ]
          }
        ],
        "facts_superseded": [],
        "impacts_added": [],
        "impacts_updated": [
          {
            "id": "IMPACT-001",
            "fact_id": "FACT-002",
            "fact_revision": 1,
            "target": {
              "kind": "software_decision",
              "ref": "external_integrations",
              "revision": 1
            },
            "effect": "upheld",
            "reason": "The output schema now uses explicit strict object branches, local preflight detects union-object and untyped enum defects, and terminal app-server errors reject the Agent turn instead of becoming retry handoffs.",
            "gap_ids": [],
            "evidence": [
              "runtime/arckit-runtime/schemas/agent-loop-result.schema.json",
              "runtime/arckit-runtime/src/codex-output-schema.mjs",
              "runtime/arckit-runtime/adapters/codex-app-server-adapter.mjs",
              "runtime/arckit-runtime/test/codex-output-schema.test.mjs",
              "runtime/arckit-runtime/test/codex-app-server-adapter.test.mjs",
              "verification:codex-app-server-output-schema-probe:accepted:2026-08-11"
            ]
          },
          {
            "id": "IMPACT-002",
            "fact_id": "FACT-002",
            "fact_revision": 1,
            "target": {
              "kind": "software_decision",
              "ref": "observability_and_operation",
              "revision": 1
            },
            "effect": "upheld",
            "reason": "Runtime now honors the stricter handoff no-progress guard, while Desktop maps semantic stop failures to failed even when the child process exits with code zero.",
            "gap_ids": [],
            "evidence": [
              "runtime/arckit-runtime/src/state-driven-runner.mjs",
              "runtime/arckit-runtime/src/desktop-run-manager.mjs",
              "runtime/arckit-runtime/test/state-driven-runner.test.mjs",
              "runtime/arckit-runtime/test/desktop-run-manager.test.mjs"
            ]
          },
          {
            "id": "IMPACT-003",
            "fact_id": "FACT-002",
            "fact_revision": 1,
            "target": {
              "kind": "software_invariant",
              "ref": "material-risks-have-credible-evidence",
              "revision": null
            },
            "effect": "upheld",
            "reason": "Focused regressions, the full Runtime check, and a real app-server structured-output probe cover the repaired integration and status boundaries.",
            "gap_ids": [],
            "evidence": [
              "runtime/arckit-runtime/test/codex-output-schema.test.mjs",
              "runtime/arckit-runtime/test/codex-app-server-adapter.test.mjs",
              "runtime/arckit-runtime/test/state-driven-runner.test.mjs",
              "runtime/arckit-runtime/test/desktop-run-manager.test.mjs",
              "verification:npm-run-check:87-tests-86-pass-1-conditional-skip",
              "verification:codex-app-server-output-schema-probe:accepted:2026-08-11"
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
      "evidence": [
        "runtime/arckit-runtime/schemas/agent-loop-result.schema.json",
        "runtime/arckit-runtime/src/codex-output-schema.mjs",
        "runtime/arckit-runtime/adapters/codex-app-server-adapter.mjs",
        "runtime/arckit-runtime/src/state-driven-runner.mjs",
        "runtime/arckit-runtime/src/desktop-run-manager.mjs",
        "runtime/arckit-runtime/test/codex-output-schema.test.mjs",
        "runtime/arckit-runtime/test/codex-app-server-adapter.test.mjs",
        "runtime/arckit-runtime/test/state-driven-runner.test.mjs",
        "runtime/arckit-runtime/test/desktop-run-manager.test.mjs",
        "verification:npm-run-check:87-tests-86-pass-1-conditional-skip",
        "verification:codex-app-server-output-schema-probe:accepted:2026-08-11"
      ],
      "runtime_result_ref": "",
      "occurred_at": "2026-08-10T16:33:46.161Z"
    },
    {
      "round": 2,
      "goal": "Independently review the completed Runtime repair across all five required completion dimensions.",
      "outcome": "completed",
      "selected_gap": {
        "id": "CASE-20260810-002:completion-review:1",
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
        "goal": "Independently review the completed Runtime repair across all five required completion dimensions.",
        "expected_state_change": "Record a clean review for content revision 1 and close the Case if deterministic audit confirms every obligation is satisfied."
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
            "review:implementation-correctness:strict-anyOf-object-definitions-and-terminal-error-path-inspected",
            "review:problem-resolution:original-invalid-json-schema-retry-chain-is-broken-at-preflight-and-terminal-error-boundaries",
            "review:verification-credibility:focused-regressions-plus-full-runtime-suite-plus-live-app-server-probe",
            "review:regression-risk:human-and-external-handoffs-remain-distinct-from-semantic-failure-stop-reasons",
            "review:minimality:changes-confined-to-schema-validation-failure-classification-progress-guard-status-projection-and-tests",
            "verification:npm-run-check:87-tests-86-pass-1-conditional-skip",
            "verification:codex-app-server-output-schema-probe:accepted:2026-08-11",
            "verification:project-state-audit:ok",
            "verification:case-audit:review-ready",
            "verification:git-diff-check:clean"
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
        "review:implementation-correctness:strict-anyOf-object-definitions-and-terminal-error-path-inspected",
        "review:problem-resolution:original-invalid-json-schema-retry-chain-is-broken-at-preflight-and-terminal-error-boundaries",
        "review:verification-credibility:focused-regressions-plus-full-runtime-suite-plus-live-app-server-probe",
        "review:regression-risk:human-and-external-handoffs-remain-distinct-from-semantic-failure-stop-reasons",
        "review:minimality:changes-confined-to-schema-validation-failure-classification-progress-guard-status-projection-and-tests",
        "verification:npm-run-check:87-tests-86-pass-1-conditional-skip",
        "verification:codex-app-server-output-schema-probe:accepted:2026-08-11",
        "verification:project-state-audit:ok",
        "verification:case-audit:review-ready",
        "verification:git-diff-check:clean"
      ],
      "runtime_result_ref": "",
      "occurred_at": "2026-08-10T16:34:22.892Z"
    }
  ],
  "case_resolution": {
    "status": "resolved",
    "stage": "resolved",
    "satisfied": [
      "GAP-RUNTIME-SCHEMA-ERROR-RECOVERY"
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
    "updated_at": "2026-08-10T16:34:22.892Z"
  }
}
```

## Round Notes

- Case history is canonical in Structured Record.rounds; keep prose notes exceptional.
