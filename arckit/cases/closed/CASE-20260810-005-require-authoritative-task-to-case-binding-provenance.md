# Require authoritative task-to-Case binding provenance

Case: CASE-20260810-005
Status: closed
Artifact Type: code
Selected Gap: none
Updated: 2026-08-10T17:18:07.967Z

## User Intent

Prevent Runtime automation from binding an unassociated todo to an unrelated Case based on repository cardinality or ambiguous fallback data.

## Structured Record

```json
{
  "schema_version": "development-case-record/v5",
  "id": "CASE-20260810-005",
  "title": "Require authoritative task-to-Case binding provenance",
  "status": "closed",
  "artifact_type": "code",
  "created_at": "2026-08-10T16:54:47.007Z",
  "updated_at": "2026-08-10T17:18:07.967Z",
  "user_intent": "Prevent Runtime automation from binding an unassociated todo to an unrelated Case based on repository cardinality or ambiguous fallback data.",
  "expected_outcome": "Case recovery and closeout use only task-scoped authoritative binding evidence; absent or conflicting evidence enters recovery instead of selecting a Case, starting closeout, committing, or completing a remote todo.",
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
      "statement": "Workshop todo 1060 run RUN-20260810-163606356Z started with closeout_only=true and CASE-20260810-003 although the preceding failed run produced no Case and CASE-20260810-003 was an unrelated Project State migration Case.",
      "basis": "Desktop store, lifecycle trace, prior run result, canonical JuSong Case content, and coordinator control flow form a complete observed identity and timing chain.",
      "evidence": [
        "arckit-runtime://runs/RUN-20260810-163606356Z",
        "arckit-runtime://runs/RUN-20260810-160126477Z",
        "runtime/arckit-runtime/src/automation-coordinator.mjs",
        "runtime/arckit-runtime/src/desktop-run-manager.mjs"
      ]
    },
    {
      "id": "FACT-002",
      "revision": 1,
      "status": "accepted",
      "statement": "Automation now binds a task to a Case only from a successful trusted ledger write for that task run, rejects conflicting trusted identities, and gates closeout plus remote completion on authoritative binding and a fresh consistently closed/resolved canonical Case.",
      "basis": "Coordinator control paths, persisted binding provenance, incident replay, focused regression tests, full Runtime checks, and the maintained Desktop execution contract agree on the same fail-closed behavior.",
      "evidence": [
        "runtime/arckit-runtime/src/automation-coordinator.mjs",
        "runtime/arckit-runtime/src/desktop/desktop-store.mjs",
        "runtime/arckit-runtime/test/automation-coordinator.test.mjs",
        "arckit/tech/arckit-runtime/desktop-execution-solution.md",
        "verification:npm-run-check:96-tests-95-pass-1-conditional-skip",
        "verification:incident-binding-replay:effective-unbound"
      ]
    },
    {
      "id": "FACT-003",
      "revision": 1,
      "status": "accepted",
      "statement": "Initial Runtime execution presents all active Cases without preselecting one and lets the Agent select or create the Case; CLI handoff is unavailable until a trusted ledger result establishes the binding and therefore cannot interrupt an unbound Runtime.",
      "basis": "Loop selection remains identity-empty, Coordinator checks trusted binding before interrupt, CLI prompt requires the established Case, and focused plus full-suite tests cover both unbound refusal and bound handoff.",
      "evidence": [
        "runtime/arckit-runtime/src/loop-controller.mjs",
        "runtime/arckit-runtime/src/automation-coordinator.mjs",
        "runtime/arckit-runtime/src/interactive-cli-launcher.mjs",
        "runtime/arckit-runtime/test/case-transition.test.mjs",
        "runtime/arckit-runtime/test/automation-coordinator.test.mjs",
        "runtime/arckit-runtime/test/interactive-cli-launcher.test.mjs",
        "arckit/tech/arckit-runtime/desktop-execution-solution.md",
        "verification:npm-run-check:100-tests-99-pass-1-conditional-skip"
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
        "ref": "data_and_state",
        "revision": 1
      },
      "effect": "upheld",
      "reason": "Task-to-Case identity is now persisted with explicit trusted-ledger provenance and legacy bare Case IDs are treated as unbound.",
      "gap_ids": [],
      "evidence": [
        "runtime/arckit-runtime/src/automation-coordinator.mjs",
        "runtime/arckit-runtime/src/desktop/desktop-store.mjs",
        "arckit/tech/arckit-runtime/desktop-execution-solution.md"
      ]
    },
    {
      "id": "IMPACT-002",
      "fact_id": "FACT-002",
      "fact_revision": 1,
      "target": {
        "kind": "software_decision",
        "ref": "external_integrations",
        "revision": 1
      },
      "effect": "upheld",
      "reason": "Git closeout and Workshop completion refuse unbound tasks, while remote completion additionally requires a fresh consistently resolved canonical Case.",
      "gap_ids": [],
      "evidence": [
        "runtime/arckit-runtime/src/automation-coordinator.mjs",
        "runtime/arckit-runtime/test/automation-coordinator.test.mjs",
        "verification:incident-binding-replay:effective-unbound"
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
      "reason": "Regression coverage exercises sole unrelated Case, concurrent CLI Case creation, trusted and conflicting bindings, stale closeout retry, and both remote-completion gates.",
      "gap_ids": [],
      "evidence": [
        "runtime/arckit-runtime/test/automation-coordinator.test.mjs",
        "verification:npm-run-check:96-tests-95-pass-1-conditional-skip"
      ]
    }
  ],
  "gaps": [
    {
      "id": "GAP-RUNTIME-AUTHORITATIVE-CASE-BINDING",
      "status": "resolved",
      "goal": "Accept Case identity only from current task-scoped authoritative evidence, reject ambiguous/conflicting identities, and prevent unbound tasks from entering closeout or remote completion.",
      "reason": "Repository cardinality and first-valid fallbacks cannot prove semantic identity and currently permit cross-task completion.",
      "derived_from": [
        "case_intent",
        "FACT-001",
        "GAP-runtime-resilience-and-adapters",
        "data_and_state",
        "external_integrations",
        "material-risks-have-credible-evidence"
      ],
      "blocked_by": [],
      "priority_basis": {
        "blocking": "critical",
        "uncertainty": "low",
        "risk": "critical",
        "user_impact": "high"
      },
      "responsibility": "agent",
      "evidence_required": [
        "unbound task plus unrelated sole closed v5 Case does not bind or close out",
        "CLI Case discovery does not bind concurrent unrelated Cases without authoritative provenance",
        "conflicting run Case identifiers enter recovery instead of selecting the first value",
        "pre-bound and current-run ledger-derived Case recovery still works",
        "full Runtime test suite"
      ],
      "resolution": {
        "id": "GAP-RUNTIME-AUTHORITATIVE-CASE-BINDING",
        "status": "resolved",
        "outcome": "Task-to-Case binding and all completion paths now fail closed unless trusted task-run ledger evidence establishes one unambiguous identity.",
        "reason": "Heuristic selection was removed, provenance is persisted, conflicts recover, and tests plus the real incident replay verify the intended behavior.",
        "evidence": [
          "runtime/arckit-runtime/src/automation-coordinator.mjs",
          "runtime/arckit-runtime/test/automation-coordinator.test.mjs",
          "verification:npm-run-check:96-tests-95-pass-1-conditional-skip",
          "verification:incident-binding-replay:effective-unbound"
        ],
        "occurred_at": "2026-08-10T17:08:38.148Z"
      }
    },
    {
      "id": "CASE-20260810-005:review-finding:FINDING-CLI-HANDOFF-BEFORE-BINDING",
      "status": "resolved",
      "goal": "Resolve review finding: CLI handoff can interrupt an unbound Runtime before the Agent has selected or created a Case, leaving no authoritative channel for Runtime to recover the Case chosen inside the independent terminal.",
      "reason": "omission found by completion review",
      "derived_from": [
        "completion_review",
        "content_revision:1"
      ],
      "blocked_by": [],
      "priority_basis": {
        "blocking": "high",
        "risk": "high"
      },
      "responsibility": "agent",
      "evidence_required": [
        "runtime/arckit-runtime/src/automation-coordinator.mjs",
        "runtime/arckit-runtime/src/interactive-cli-launcher.mjs",
        "user-clarification:agent-owns-case-selection"
      ],
      "resolution": {
        "id": "CASE-20260810-005:review-finding:FINDING-CLI-HANDOFF-BEFORE-BINDING",
        "status": "resolved",
        "outcome": "Unbound Runtime execution remains under the Agent until trusted ledger binding exists; only then can CLI assume the same task and Case identity.",
        "reason": "The Coordinator now checks authoritative binding before any interrupt, the CLI prompt rejects missing Case identity, and both sides of the gate have regression coverage.",
        "evidence": [
          "runtime/arckit-runtime/src/automation-coordinator.mjs",
          "runtime/arckit-runtime/src/interactive-cli-launcher.mjs",
          "runtime/arckit-runtime/test/automation-coordinator.test.mjs",
          "runtime/arckit-runtime/test/interactive-cli-launcher.test.mjs",
          "verification:npm-run-check:100-tests-99-pass-1-conditional-skip"
        ],
        "occurred_at": "2026-08-10T17:17:12.151Z"
      }
    }
  ],
  "content_revision": 2,
  "completion_review": {
    "status": "clean",
    "policy": {
      "initial_max_cycles": 3,
      "source": "runtime/arckit-runtime/config/case-policy.json",
      "snapshotted_at": "2026-08-10T16:54:47.007Z"
    },
    "additional_cycles_authorized": 0,
    "cycle_count": 2,
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
        "outcome": "findings",
        "content_revision": 1,
        "dimensions": {
          "implementation_correctness": "findings",
          "problem_resolution": "clean",
          "verification_credibility": "clean",
          "regression_risk": "findings",
          "minimality": "clean"
        },
        "finding_ids": [
          "FINDING-CLI-HANDOFF-BEFORE-BINDING"
        ],
        "evidence": [
          "user-clarification:agent-owns-case-selection",
          "runtime/arckit-runtime/src/automation-coordinator.mjs",
          "runtime/arckit-runtime/src/interactive-cli-launcher.mjs",
          "runtime/arckit-runtime/test/case-transition.test.mjs"
        ],
        "occurred_at": "2026-08-10T17:16:04.146Z"
      },
      {
        "cycle": 2,
        "autonomous_cycle": 2,
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
          "runtime/arckit-runtime/src/automation-coordinator.mjs",
          "runtime/arckit-runtime/src/desktop/desktop-store.mjs",
          "runtime/arckit-runtime/src/interactive-cli-launcher.mjs",
          "runtime/arckit-runtime/src/loop-controller.mjs",
          "runtime/arckit-runtime/test/automation-coordinator.test.mjs",
          "runtime/arckit-runtime/test/interactive-cli-launcher.test.mjs",
          "runtime/arckit-runtime/test/case-transition.test.mjs",
          "arckit/tech/arckit-runtime/desktop-execution-solution.md",
          "verification:npm-run-check:100-tests-99-pass-1-conditional-skip",
          "verification:focused-binding-and-handoff-tests:27-pass",
          "verification:incident-binding-replay:effective-unbound",
          "verification:project-and-case-ledger-audits:ok",
          "verification:git-diff-check:clean"
        ],
        "occurred_at": "2026-08-10T17:18:07.967Z"
      }
    ],
    "evidence": [
      "user-clarification:agent-owns-case-selection",
      "runtime/arckit-runtime/src/automation-coordinator.mjs",
      "runtime/arckit-runtime/src/interactive-cli-launcher.mjs",
      "runtime/arckit-runtime/test/case-transition.test.mjs",
      "runtime/arckit-runtime/src/desktop/desktop-store.mjs",
      "runtime/arckit-runtime/src/loop-controller.mjs",
      "runtime/arckit-runtime/test/automation-coordinator.test.mjs",
      "runtime/arckit-runtime/test/interactive-cli-launcher.test.mjs",
      "arckit/tech/arckit-runtime/desktop-execution-solution.md",
      "verification:npm-run-check:100-tests-99-pass-1-conditional-skip",
      "verification:focused-binding-and-handoff-tests:27-pass",
      "verification:incident-binding-replay:effective-unbound",
      "verification:project-and-case-ledger-audits:ok",
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
      "goal": "Replace heuristic Case selection with provenance-bound identity and guard every closeout/completion path.",
      "outcome": "completed",
      "selected_gap": {
        "id": "GAP-RUNTIME-AUTHORITATIVE-CASE-BINDING",
        "responsibility": "agent",
        "goal": "Accept Case identity only from current task-scoped authoritative evidence, reject ambiguous/conflicting identities, and prevent unbound tasks from entering closeout or remote completion.",
        "reason": "Repository cardinality and first-valid fallbacks cannot prove semantic identity and currently permit cross-task completion.",
        "derived_from": [
          "case_intent",
          "FACT-001",
          "GAP-runtime-resilience-and-adapters",
          "data_and_state",
          "external_integrations",
          "material-risks-have-credible-evidence"
        ],
        "blocked_by": [],
        "priority_basis": {
          "blocking": "critical",
          "uncertainty": "low",
          "risk": "critical",
          "user_impact": "high"
        },
        "evidence_required": [
          "unbound task plus unrelated sole closed v5 Case does not bind or close out",
          "CLI Case discovery does not bind concurrent unrelated Cases without authoritative provenance",
          "conflicting run Case identifiers enter recovery instead of selecting the first value",
          "pre-bound and current-run ledger-derived Case recovery still works",
          "full Runtime test suite"
        ]
      },
      "planned_transition": {
        "goal": "Replace heuristic Case selection with provenance-bound identity and guard every closeout/completion path.",
        "expected_state_change": "The incident gap is resolved with implementation, regression, replay, and stable technical-contract evidence; threatened impacts become upheld."
      },
      "accepted_state_delta": {
        "facts_added": [
          {
            "id": "FACT-002",
            "revision": 1,
            "status": "accepted",
            "statement": "Automation now binds a task to a Case only from a successful trusted ledger write for that task run, rejects conflicting trusted identities, and gates closeout plus remote completion on authoritative binding and a fresh consistently closed/resolved canonical Case.",
            "basis": "Coordinator control paths, persisted binding provenance, incident replay, focused regression tests, full Runtime checks, and the maintained Desktop execution contract agree on the same fail-closed behavior.",
            "evidence": [
              "runtime/arckit-runtime/src/automation-coordinator.mjs",
              "runtime/arckit-runtime/src/desktop/desktop-store.mjs",
              "runtime/arckit-runtime/test/automation-coordinator.test.mjs",
              "arckit/tech/arckit-runtime/desktop-execution-solution.md",
              "verification:npm-run-check:96-tests-95-pass-1-conditional-skip",
              "verification:incident-binding-replay:effective-unbound"
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
              "ref": "data_and_state",
              "revision": 1
            },
            "effect": "upheld",
            "reason": "Task-to-Case identity is now persisted with explicit trusted-ledger provenance and legacy bare Case IDs are treated as unbound.",
            "gap_ids": [],
            "evidence": [
              "runtime/arckit-runtime/src/automation-coordinator.mjs",
              "runtime/arckit-runtime/src/desktop/desktop-store.mjs",
              "arckit/tech/arckit-runtime/desktop-execution-solution.md"
            ]
          },
          {
            "id": "IMPACT-002",
            "fact_id": "FACT-002",
            "fact_revision": 1,
            "target": {
              "kind": "software_decision",
              "ref": "external_integrations",
              "revision": 1
            },
            "effect": "upheld",
            "reason": "Git closeout and Workshop completion refuse unbound tasks, while remote completion additionally requires a fresh consistently resolved canonical Case.",
            "gap_ids": [],
            "evidence": [
              "runtime/arckit-runtime/src/automation-coordinator.mjs",
              "runtime/arckit-runtime/test/automation-coordinator.test.mjs",
              "verification:incident-binding-replay:effective-unbound"
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
            "reason": "Regression coverage exercises sole unrelated Case, concurrent CLI Case creation, trusted and conflicting bindings, stale closeout retry, and both remote-completion gates.",
            "gap_ids": [],
            "evidence": [
              "runtime/arckit-runtime/test/automation-coordinator.test.mjs",
              "verification:npm-run-check:96-tests-95-pass-1-conditional-skip"
            ]
          }
        ],
        "gaps_added": [],
        "gaps_cancelled": [],
        "resolved_open_questions": [],
        "completed_handoffs": [],
        "resolved_review_findings": [],
        "resolved_gap": {
          "id": "GAP-RUNTIME-AUTHORITATIVE-CASE-BINDING",
          "status": "resolved",
          "outcome": "Task-to-Case binding and all completion paths now fail closed unless trusted task-run ledger evidence establishes one unambiguous identity.",
          "reason": "Heuristic selection was removed, provenance is persisted, conflicts recover, and tests plus the real incident replay verify the intended behavior.",
          "evidence": [
            "runtime/arckit-runtime/src/automation-coordinator.mjs",
            "runtime/arckit-runtime/test/automation-coordinator.test.mjs",
            "verification:npm-run-check:96-tests-95-pass-1-conditional-skip",
            "verification:incident-binding-replay:effective-unbound"
          ]
        },
        "completion_review_result": null,
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
        "runtime/arckit-runtime/src/automation-coordinator.mjs",
        "runtime/arckit-runtime/src/desktop/desktop-store.mjs",
        "runtime/arckit-runtime/test/automation-coordinator.test.mjs",
        "arckit/tech/arckit-runtime/desktop-execution-solution.md",
        "verification:npm-run-check:96-tests-95-pass-1-conditional-skip",
        "verification:incident-binding-replay:effective-unbound"
      ],
      "runtime_result_ref": "",
      "occurred_at": "2026-08-10T17:08:38.148Z"
    },
    {
      "round": 2,
      "goal": "Review the authoritative binding implementation against the clarified Agent-owned Case-selection boundary.",
      "outcome": "completed",
      "selected_gap": {
        "id": "CASE-20260810-005:completion-review:1",
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
        "goal": "Review the authoritative binding implementation against the clarified Agent-owned Case-selection boundary.",
        "expected_state_change": "Record any remaining lifecycle omission as a repair gap before closure."
      },
      "accepted_state_delta": {
        "facts_added": [],
        "facts_superseded": [],
        "impacts_added": [],
        "impacts_updated": [],
        "gaps_added": [],
        "gaps_cancelled": [],
        "resolved_open_questions": [],
        "completed_handoffs": [],
        "resolved_review_findings": [],
        "review_budget_extension": null,
        "resolved_gap": null,
        "completion_review_result": {
          "outcome": "findings",
          "reviewer": "agent",
          "reviewed_content_revision": 1,
          "dimensions": {
            "implementation_correctness": "findings",
            "problem_resolution": "clean",
            "verification_credibility": "clean",
            "regression_risk": "findings",
            "minimality": "clean"
          },
          "findings": [
            {
              "id": "FINDING-CLI-HANDOFF-BEFORE-BINDING",
              "kind": "omission",
              "statement": "CLI handoff can interrupt an unbound Runtime before the Agent has selected or created a Case, leaving no authoritative channel for Runtime to recover the Case chosen inside the independent terminal.",
              "responsibility": "agent",
              "artifact_refs": [
                "runtime/arckit-runtime/src/automation-coordinator.mjs",
                "runtime/arckit-runtime/src/interactive-cli-launcher.mjs"
              ],
              "evidence": [
                "user-clarification:agent-owns-case-selection",
                "runtime/arckit-runtime/src/automation-coordinator.mjs",
                "runtime/arckit-runtime/src/interactive-cli-launcher.mjs"
              ]
            }
          ],
          "evidence": [
            "user-clarification:agent-owns-case-selection",
            "runtime/arckit-runtime/src/automation-coordinator.mjs",
            "runtime/arckit-runtime/src/interactive-cli-launcher.mjs",
            "runtime/arckit-runtime/test/case-transition.test.mjs"
          ]
        }
      },
      "project_state_delta": {
        "software_definition_changes": [],
        "software_invariant_changes": [],
        "project_gap_changes": [],
        "selection_context_change": null,
        "evidence": []
      },
      "evidence": [
        "user-clarification:agent-owns-case-selection",
        "runtime/arckit-runtime/src/automation-coordinator.mjs",
        "runtime/arckit-runtime/src/interactive-cli-launcher.mjs"
      ],
      "runtime_result_ref": "",
      "occurred_at": "2026-08-10T17:16:04.146Z"
    },
    {
      "round": 3,
      "goal": "Keep initial Case selection Agent-owned while making CLI handoff conditional on an accepted binding checkpoint.",
      "outcome": "completed",
      "selected_gap": {
        "id": "CASE-20260810-005:review-finding:FINDING-CLI-HANDOFF-BEFORE-BINDING",
        "responsibility": "agent",
        "goal": "Resolve review finding: CLI handoff can interrupt an unbound Runtime before the Agent has selected or created a Case, leaving no authoritative channel for Runtime to recover the Case chosen inside the independent terminal.",
        "reason": "omission found by completion review",
        "derived_from": [
          "completion_review",
          "content_revision:1"
        ],
        "blocked_by": [],
        "priority_basis": {
          "blocking": "high",
          "uncertainty": "",
          "risk": "high",
          "user_impact": ""
        },
        "evidence_required": [
          "runtime/arckit-runtime/src/automation-coordinator.mjs",
          "runtime/arckit-runtime/src/interactive-cli-launcher.mjs",
          "user-clarification:agent-owns-case-selection"
        ]
      },
      "planned_transition": {
        "goal": "Keep initial Case selection Agent-owned while making CLI handoff conditional on an accepted binding checkpoint.",
        "expected_state_change": "Resolve the review finding with a pre-interrupt binding gate, bound-path regression coverage, and the stable technical contract."
      },
      "accepted_state_delta": {
        "facts_added": [
          {
            "id": "FACT-003",
            "revision": 1,
            "status": "accepted",
            "statement": "Initial Runtime execution presents all active Cases without preselecting one and lets the Agent select or create the Case; CLI handoff is unavailable until a trusted ledger result establishes the binding and therefore cannot interrupt an unbound Runtime.",
            "basis": "Loop selection remains identity-empty, Coordinator checks trusted binding before interrupt, CLI prompt requires the established Case, and focused plus full-suite tests cover both unbound refusal and bound handoff.",
            "evidence": [
              "runtime/arckit-runtime/src/loop-controller.mjs",
              "runtime/arckit-runtime/src/automation-coordinator.mjs",
              "runtime/arckit-runtime/src/interactive-cli-launcher.mjs",
              "runtime/arckit-runtime/test/case-transition.test.mjs",
              "runtime/arckit-runtime/test/automation-coordinator.test.mjs",
              "runtime/arckit-runtime/test/interactive-cli-launcher.test.mjs",
              "arckit/tech/arckit-runtime/desktop-execution-solution.md",
              "verification:npm-run-check:100-tests-99-pass-1-conditional-skip"
            ]
          }
        ],
        "facts_superseded": [],
        "impacts_added": [],
        "impacts_updated": [],
        "gaps_added": [],
        "gaps_cancelled": [],
        "resolved_open_questions": [],
        "completed_handoffs": [],
        "resolved_review_findings": [
          "FINDING-CLI-HANDOFF-BEFORE-BINDING"
        ],
        "resolved_gap": {
          "id": "CASE-20260810-005:review-finding:FINDING-CLI-HANDOFF-BEFORE-BINDING",
          "status": "resolved",
          "outcome": "Unbound Runtime execution remains under the Agent until trusted ledger binding exists; only then can CLI assume the same task and Case identity.",
          "reason": "The Coordinator now checks authoritative binding before any interrupt, the CLI prompt rejects missing Case identity, and both sides of the gate have regression coverage.",
          "evidence": [
            "runtime/arckit-runtime/src/automation-coordinator.mjs",
            "runtime/arckit-runtime/src/interactive-cli-launcher.mjs",
            "runtime/arckit-runtime/test/automation-coordinator.test.mjs",
            "runtime/arckit-runtime/test/interactive-cli-launcher.test.mjs",
            "verification:npm-run-check:100-tests-99-pass-1-conditional-skip"
          ]
        },
        "completion_review_result": null,
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
        "user-clarification:agent-owns-case-selection",
        "runtime/arckit-runtime/src/loop-controller.mjs",
        "runtime/arckit-runtime/src/automation-coordinator.mjs",
        "runtime/arckit-runtime/src/interactive-cli-launcher.mjs",
        "runtime/arckit-runtime/test/automation-coordinator.test.mjs",
        "runtime/arckit-runtime/test/interactive-cli-launcher.test.mjs",
        "runtime/arckit-runtime/test/case-transition.test.mjs",
        "arckit/tech/arckit-runtime/desktop-execution-solution.md",
        "verification:npm-run-check:100-tests-99-pass-1-conditional-skip"
      ],
      "runtime_result_ref": "",
      "occurred_at": "2026-08-10T17:17:12.151Z"
    },
    {
      "round": 4,
      "goal": "Perform the final implementation-focused review after closing the CLI pre-binding handoff omission.",
      "outcome": "completed",
      "selected_gap": {
        "id": "CASE-20260810-005:completion-review:2",
        "responsibility": "agent",
        "goal": "Review the completed implementation for correctness, real problem resolution, verification credibility, regression risk, and minimality.",
        "reason": "All ordinary Case gaps and state impacts are closed.",
        "derived_from": [
          "case_result",
          "content_revision:2"
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
        "goal": "Perform the final implementation-focused review after closing the CLI pre-binding handoff omission.",
        "expected_state_change": "Accept a clean review for content revision 2 and resolve the Case."
      },
      "accepted_state_delta": {
        "facts_added": [],
        "facts_superseded": [],
        "impacts_added": [],
        "impacts_updated": [],
        "gaps_added": [],
        "gaps_cancelled": [],
        "resolved_open_questions": [],
        "completed_handoffs": [],
        "resolved_review_findings": [],
        "review_budget_extension": null,
        "resolved_gap": null,
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
            "runtime/arckit-runtime/src/automation-coordinator.mjs",
            "runtime/arckit-runtime/src/desktop/desktop-store.mjs",
            "runtime/arckit-runtime/src/interactive-cli-launcher.mjs",
            "runtime/arckit-runtime/src/loop-controller.mjs",
            "runtime/arckit-runtime/test/automation-coordinator.test.mjs",
            "runtime/arckit-runtime/test/interactive-cli-launcher.test.mjs",
            "runtime/arckit-runtime/test/case-transition.test.mjs",
            "arckit/tech/arckit-runtime/desktop-execution-solution.md",
            "verification:npm-run-check:100-tests-99-pass-1-conditional-skip",
            "verification:focused-binding-and-handoff-tests:27-pass",
            "verification:incident-binding-replay:effective-unbound",
            "verification:project-and-case-ledger-audits:ok",
            "verification:git-diff-check:clean"
          ]
        }
      },
      "project_state_delta": {
        "software_definition_changes": [],
        "software_invariant_changes": [],
        "project_gap_changes": [],
        "selection_context_change": null,
        "evidence": []
      },
      "evidence": [
        "verification:npm-run-check:100-tests-99-pass-1-conditional-skip",
        "verification:focused-binding-and-handoff-tests:27-pass",
        "verification:incident-binding-replay:effective-unbound",
        "verification:project-and-case-ledger-audits:ok",
        "verification:git-diff-check:clean"
      ],
      "runtime_result_ref": "",
      "occurred_at": "2026-08-10T17:18:07.967Z"
    }
  ],
  "case_resolution": {
    "status": "resolved",
    "stage": "resolved",
    "satisfied": [
      "GAP-RUNTIME-AUTHORITATIVE-CASE-BINDING",
      "CASE-20260810-005:review-finding:FINDING-CLI-HANDOFF-BEFORE-BINDING"
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
    "updated_at": "2026-08-10T17:18:07.967Z"
  }
}
```

## Round Notes

- Case history is canonical in Structured Record.rounds; keep prose notes exceptional.
