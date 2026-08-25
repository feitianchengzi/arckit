# Restore ArcOrbit automation after abrupt process loss

Case: CASE-20260825-001
Status: closed
Artifact Type: code
Selected Gap: none
Updated: 2026-08-25T02:23:19.097Z

## User Intent

Diagnose and correct ArcOrbit automation recovery when power loss or process termination interrupts an active Runtime.

## Structured Record

```json
{
  "schema_version": "development-case-record/v5",
  "id": "CASE-20260825-001",
  "title": "Restore ArcOrbit automation after abrupt process loss",
  "status": "closed",
  "artifact_type": "code",
  "created_at": "2026-08-25T02:02:09.386Z",
  "updated_at": "2026-08-25T02:23:19.097Z",
  "user_intent": "Diagnose and correct ArcOrbit automation recovery when power loss or process termination interrupts an active Runtime.",
  "expected_outcome": "After abrupt Desktop termination, startup deterministically reconciles persisted active-task, Run, thread-binding, and server task state, then safely resumes the same todo/thread or surfaces an actionable recovery state without false-running UI.",
  "project_state_ref": "arckit/project/state.record.json",
  "current_round": {
    "goal": "",
    "selected_gap": null
  },
  "facts": [
    {
      "id": "FACT-POWER-LOSS-RECOVERY",
      "revision": 1,
      "status": "accepted",
      "statement": "After a computer power loss and two ArcOrbit restarts, todo 1155 remained server-side in_progress and retained its local active-task and persistent Codex thread binding, but its last Run remained aborted, no replacement Run was created, no ArcOrbit Runtime process existed, and persisted active-task phase was recovery with an empty recovery_items array.",
      "basis": "Current operator report plus read-only inspection of ArcOrbit Desktop state, Run records, thread binding, and process table on 2026-08-25.",
      "evidence": [
        "Current operator input, 2026-08-25",
        "runtime/arcorbit/src/automation-coordinator.mjs",
        "runtime/arcorbit/src/desktop-run-manager.mjs"
      ]
    },
    {
      "id": "FACT-POWER-LOSS-ROOT-CAUSE",
      "revision": 1,
      "status": "superseded",
      "statement": "ArcOrbit startup recovery incorrectly treats recovery_items as an authoritative prerequisite and removes the matching marker before the replacement Run is durably bound; interruption or an orphaned recovery phase therefore leaves a server in-progress active task and persistent thread with no Runtime and no self-healing startup path.",
      "basis": "Deterministic failing tests reproduce both the orphaned recovery state and the premature marker consumption boundary, and the startup coordinator source matches every observed state transition.",
      "evidence": [
        "runtime/arcorbit/test/automation-coordinator.test.mjs",
        "runtime/arcorbit/src/automation-coordinator.mjs:1719",
        "runtime/arcorbit/src/automation-coordinator.mjs:1751"
      ]
    },
    {
      "id": "FACT-POWER-LOSS-ROOT-CAUSE",
      "revision": 2,
      "status": "accepted",
      "statement": "ArcOrbit derives startup recovery from persisted active-task, local task state, live Run ownership, thread binding, and control boundaries; when an interrupted phase has no live Runtime and no specific operator recovery decision, it reconstructs a process-missing recovery and consumes that marker only in the Store mutation that binds the replacement Run, while failed starts retain one actionable same-thread recovery item.",
      "basis": "The coordinator implementation, stable technical contract, and deterministic startup/fallback regressions establish the crash-consistent recovery boundary.",
      "evidence": [
        "runtime/arcorbit/src/automation-coordinator.mjs",
        "runtime/arcorbit/test/automation-coordinator.test.mjs",
        "arckit/tech/arcorbit/desktop-execution-solution.md",
        "node --test runtime/arcorbit/test/automation-coordinator.test.mjs runtime/arcorbit/test/desktop-run-manager.test.mjs runtime/arcorbit/test/desktop-store.test.mjs runtime/arcorbit/test/runtime-process-environment.test.mjs: 74 passed",
        "npm --prefix runtime/arcorbit run check: 394 passed, 9 skipped, only sandboxed Electron fixture failed; isolated unsandboxed fixture: 1 passed"
      ]
    }
  ],
  "state_impacts": [
    {
      "id": "IMPACT-POWER-LOSS-TECHNICAL",
      "fact_id": "FACT-POWER-LOSS-ROOT-CAUSE",
      "fact_revision": 2,
      "target": {
        "kind": "software_decision",
        "ref": "technical_foundation",
        "revision": 33
      },
      "effect": "upheld",
      "reason": "The one-thread-per-todo Runtime lifecycle now reconstructs lost process ownership from durable facts and preserves the thread across replacement Runs.",
      "gap_ids": [],
      "evidence": [
        "runtime/arcorbit/src/automation-coordinator.mjs",
        "runtime/arcorbit/test/automation-coordinator.test.mjs",
        "arckit/tech/arcorbit/desktop-execution-solution.md",
        "node --test runtime/arcorbit/test/automation-coordinator.test.mjs runtime/arcorbit/test/desktop-run-manager.test.mjs runtime/arcorbit/test/desktop-store.test.mjs runtime/arcorbit/test/runtime-process-environment.test.mjs: 74 passed",
        "npm --prefix runtime/arcorbit run check: 394 passed, 9 skipped, only sandboxed Electron fixture failed; isolated unsandboxed fixture: 1 passed"
      ]
    },
    {
      "id": "IMPACT-POWER-LOSS-OPERATIONS",
      "fact_id": "FACT-POWER-LOSS-ROOT-CAUSE",
      "fact_revision": 2,
      "target": {
        "kind": "software_decision",
        "ref": "observability_and_operation",
        "revision": 8
      },
      "effect": "upheld",
      "reason": "A missing Runtime now produces either deterministic same-thread resumption or one persisted actionable recovery item instead of a silent false-running state.",
      "gap_ids": [],
      "evidence": [
        "runtime/arcorbit/src/automation-coordinator.mjs",
        "runtime/arcorbit/test/automation-coordinator.test.mjs",
        "arckit/tech/arcorbit/desktop-execution-solution.md",
        "node --test runtime/arcorbit/test/automation-coordinator.test.mjs runtime/arcorbit/test/desktop-run-manager.test.mjs runtime/arcorbit/test/desktop-store.test.mjs runtime/arcorbit/test/runtime-process-environment.test.mjs: 74 passed",
        "npm --prefix runtime/arcorbit run check: 394 passed, 9 skipped, only sandboxed Electron fixture failed; isolated unsandboxed fixture: 1 passed"
      ]
    },
    {
      "id": "IMPACT-POWER-LOSS-REALIZATION",
      "fact_id": "FACT-POWER-LOSS-ROOT-CAUSE",
      "fact_revision": 2,
      "target": {
        "kind": "software_invariant",
        "ref": "accepted-facts-are-realized",
        "revision": null
      },
      "effect": "upheld",
      "reason": "The implementation and stable technical contract now realize abrupt-process-loss recovery.",
      "gap_ids": [],
      "evidence": [
        "runtime/arcorbit/src/automation-coordinator.mjs",
        "runtime/arcorbit/test/automation-coordinator.test.mjs",
        "arckit/tech/arcorbit/desktop-execution-solution.md",
        "node --test runtime/arcorbit/test/automation-coordinator.test.mjs runtime/arcorbit/test/desktop-run-manager.test.mjs runtime/arcorbit/test/desktop-store.test.mjs runtime/arcorbit/test/runtime-process-environment.test.mjs: 74 passed",
        "npm --prefix runtime/arcorbit run check: 394 passed, 9 skipped, only sandboxed Electron fixture failed; isolated unsandboxed fixture: 1 passed"
      ]
    },
    {
      "id": "IMPACT-POWER-LOSS-RISK",
      "fact_id": "FACT-POWER-LOSS-ROOT-CAUSE",
      "fact_revision": 2,
      "target": {
        "kind": "software_invariant",
        "ref": "material-risks-have-credible-evidence",
        "revision": null
      },
      "effect": "upheld",
      "reason": "Deterministic regressions cover orphan reconstruction, durable marker consumption, live-Run deduplication, unsafe recovery preservation, and failed-start fallback.",
      "gap_ids": [],
      "evidence": [
        "runtime/arcorbit/src/automation-coordinator.mjs",
        "runtime/arcorbit/test/automation-coordinator.test.mjs",
        "arckit/tech/arcorbit/desktop-execution-solution.md",
        "node --test runtime/arcorbit/test/automation-coordinator.test.mjs runtime/arcorbit/test/desktop-run-manager.test.mjs runtime/arcorbit/test/desktop-store.test.mjs runtime/arcorbit/test/runtime-process-environment.test.mjs: 74 passed",
        "npm --prefix runtime/arcorbit run check: 394 passed, 9 skipped, only sandboxed Electron fixture failed; isolated unsandboxed fixture: 1 passed"
      ]
    }
  ],
  "gaps": [
    {
      "id": "GAP-DIAGNOSE-POWER-LOSS-RECOVERY",
      "status": "resolved",
      "goal": "Reproduce the abrupt-termination startup state transition and establish the exact code-level root cause and required recovery invariant.",
      "reason": "The observed persisted state proves execution did not resume, but a safe architecture change requires distinguishing shutdown-event loss, startup reconciliation gaps, stale recovery-item coupling, and thread-binding recovery behavior.",
      "derived_from": [
        "case_intent",
        "FACT-POWER-LOSS-RECOVERY"
      ],
      "blocked_by": [],
      "priority_basis": {
        "blocking": "high",
        "uncertainty": "high",
        "risk": "high",
        "user_impact": "high"
      },
      "responsibility": "agent",
      "evidence_required": [
        "A deterministic automated reproduction of abrupt termination or equivalent persisted startup state.",
        "Code-path evidence explaining every observed state field and why startup creates no replacement Run.",
        "A stated recovery invariant that covers power loss without relying on graceful-shutdown events."
      ],
      "resolution": {
        "id": "GAP-DIAGNOSE-POWER-LOSS-RECOVERY",
        "status": "resolved",
        "outcome": "The failure is reproduced and traced to non-authoritative recovery eligibility plus premature recovery-marker consumption.",
        "reason": "An exact persisted-state test produces zero replacement Runs; a second test proves the marker is removed before startRun. The source requires a runtime_incomplete/runtime_process_missing item even when active_task, server state, detached Run, and thread binding independently prove a resumable execution.",
        "evidence": [
          "runtime/arcorbit/test/automation-coordinator.test.mjs",
          "runtime/arcorbit/src/automation-coordinator.mjs:1751"
        ],
        "occurred_at": "2026-08-25T02:12:58.864Z"
      }
    },
    {
      "id": "GAP-IMPLEMENT-POWER-LOSS-RECOVERY",
      "status": "resolved",
      "goal": "Make startup recovery self-healing and crash-consistent for interrupted active automation without creating duplicate Runs or losing the persisted Codex thread.",
      "reason": "Recovery eligibility must be derived from authoritative persisted execution and server facts, while the operator-facing recovery marker must remain durable until the replacement Run is atomically bound; fallback must surface an actionable recovery state when automatic resume is unsafe or fails.",
      "derived_from": [
        "FACT-POWER-LOSS-ROOT-CAUSE"
      ],
      "blocked_by": [],
      "priority_basis": {
        "blocking": "high",
        "uncertainty": "low",
        "risk": "high",
        "user_impact": "high"
      },
      "responsibility": "agent",
      "evidence_required": [
        "Passing tests for orphaned recovery phase, marker durability until replacement Run binding, same-thread resume, and no duplicate live Run.",
        "Passing fallback tests for unsafe or failed automatic resume with an actionable persisted recovery item.",
        "Relevant ArcOrbit automation and Desktop regression suite passes."
      ],
      "resolution": {
        "id": "GAP-IMPLEMENT-POWER-LOSS-RECOVERY",
        "status": "resolved",
        "outcome": "Startup recovery is self-healing and crash-consistent for interrupted automation while preserving same-thread execution and explicit operator boundaries.",
        "reason": "Coordinator startup now reconstructs missing recovery intent from authoritative persisted execution facts, retains the marker until replacement Run binding, replaces it atomically with a failed-start recovery when needed, and refuses automatic restart for live or specifically blocked ownership states.",
        "evidence": [
          "runtime/arcorbit/src/automation-coordinator.mjs",
          "runtime/arcorbit/test/automation-coordinator.test.mjs",
          "arckit/tech/arcorbit/desktop-execution-solution.md",
          "node --test runtime/arcorbit/test/automation-coordinator.test.mjs runtime/arcorbit/test/desktop-run-manager.test.mjs runtime/arcorbit/test/desktop-store.test.mjs runtime/arcorbit/test/runtime-process-environment.test.mjs: 74 passed",
          "npm --prefix runtime/arcorbit run check: 394 passed, 9 skipped, only sandboxed Electron fixture failed; isolated unsandboxed fixture: 1 passed"
        ],
        "occurred_at": "2026-08-25T02:22:15.992Z"
      }
    }
  ],
  "content_revision": 2,
  "completion_review": {
    "status": "clean",
    "policy": {
      "initial_max_cycles": 3,
      "source": "Operator authorized autonomous diagnosis, architectural correction, fallback design, and validation on 2026-08-25.",
      "snapshotted_at": "2026-08-25T02:02:09.386Z"
    },
    "additional_cycles_authorized": 0,
    "cycle_count": 1,
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
          "git diff --check: passed",
          "runtime/arcorbit/src/automation-coordinator.mjs",
          "runtime/arcorbit/test/automation-coordinator.test.mjs",
          "arckit/tech/arcorbit/desktop-execution-solution.md",
          "node --test runtime/arcorbit/test/automation-coordinator.test.mjs runtime/arcorbit/test/desktop-run-manager.test.mjs runtime/arcorbit/test/desktop-store.test.mjs runtime/arcorbit/test/runtime-process-environment.test.mjs: 74 passed",
          "npm --prefix runtime/arcorbit run check: 394 passed, 9 skipped, only sandboxed Electron fixture failed; isolated unsandboxed fixture: 1 passed"
        ],
        "occurred_at": "2026-08-25T02:23:19.097Z"
      }
    ],
    "evidence": [
      "git diff --check: passed",
      "runtime/arcorbit/src/automation-coordinator.mjs",
      "runtime/arcorbit/test/automation-coordinator.test.mjs",
      "arckit/tech/arcorbit/desktop-execution-solution.md",
      "node --test runtime/arcorbit/test/automation-coordinator.test.mjs runtime/arcorbit/test/desktop-run-manager.test.mjs runtime/arcorbit/test/desktop-store.test.mjs runtime/arcorbit/test/runtime-process-environment.test.mjs: 74 passed",
      "npm --prefix runtime/arcorbit run check: 394 passed, 9 skipped, only sandboxed Electron fixture failed; isolated unsandboxed fixture: 1 passed"
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
      "transition_schema_version": "arckit-case-transition/v8",
      "goal": "Establish the deterministic root cause and the correct durable recovery boundary.",
      "outcome": "completed",
      "gap_selection": {
        "mode": "candidate",
        "basis": "The power-loss recovery diagnosis is the only ready Case gap and blocks a safe implementation.",
        "snapshot_token": "49e9133f32415dbf1edb15c7996dbc589733b692cbb739839f81dd6b9125caa3",
        "selected_ref": "case-gap:CASE-20260825-001:GAP-DIAGNOSE-POWER-LOSS-RECOVERY",
        "comparison_summary": "Compared the four persisted Project gaps with the incident-specific Case gap; the reproduced user-blocking recovery defect has higher immediate risk and is ready in the selected Case.",
        "fresh_discovery_summary": "Diagnosis discovered a downstream implementation obligation: derive startup recoverability from authoritative persisted execution facts and consume the recovery marker only when a replacement Run is bound.",
        "considered": [
          {
            "ref": "project-gap:GAP-agent-scenario-evaluation",
            "source": "persisted",
            "eligibility": "case_required",
            "disposition": "deferred",
            "priority_basis": {
              "uncertainty": "high",
              "risk": "high"
            },
            "reason": "Requires a separate Case and does not unblock the live recovery incident."
          },
          {
            "ref": "project-gap:GAP-runtime-resilience-and-adapters",
            "source": "persisted",
            "eligibility": "case_required",
            "disposition": "deferred",
            "priority_basis": {
              "risk": "high",
              "urgency": "medium"
            },
            "reason": "Broader resilience work remains; this Case handles the proven recovery defect without absorbing the full Project gap."
          },
          {
            "ref": "project-gap:GAP-security-real-project-validation",
            "source": "persisted",
            "eligibility": "case_required",
            "disposition": "deferred",
            "priority_basis": {
              "risk": "high",
              "urgency": "medium"
            },
            "reason": "Unrelated to the observed Runtime recovery failure."
          },
          {
            "ref": "project-gap:GAP-cross-record-audit",
            "source": "persisted",
            "eligibility": "case_required",
            "disposition": "deferred",
            "priority_basis": {
              "risk": "high",
              "urgency": "high"
            },
            "reason": "Unrelated to restoring the interrupted Runtime process."
          },
          {
            "ref": "case-gap:CASE-20260825-001:GAP-DIAGNOSE-POWER-LOSS-RECOVERY",
            "source": "persisted",
            "eligibility": "ready",
            "disposition": "selected",
            "priority_basis": {
              "blocking": "high",
              "uncertainty": "high",
              "risk": "high",
              "user_impact": "high"
            },
            "reason": "Exact-state reproduction and code-path analysis can establish the root cause now."
          }
        ]
      },
      "selected_gap": {
        "id": "GAP-DIAGNOSE-POWER-LOSS-RECOVERY",
        "responsibility": "agent",
        "goal": "Reproduce the abrupt-termination startup state transition and establish the exact code-level root cause and required recovery invariant.",
        "reason": "The observed persisted state proves execution did not resume, but a safe architecture change requires distinguishing shutdown-event loss, startup reconciliation gaps, stale recovery-item coupling, and thread-binding recovery behavior.",
        "derived_from": [
          "case_intent",
          "FACT-POWER-LOSS-RECOVERY"
        ],
        "blocked_by": [],
        "priority_basis": {
          "blocking": "high",
          "uncertainty": "high",
          "risk": "high",
          "user_impact": "high"
        },
        "evidence_required": [
          "A deterministic automated reproduction of abrupt termination or equivalent persisted startup state.",
          "Code-path evidence explaining every observed state field and why startup creates no replacement Run.",
          "A stated recovery invariant that covers power loss without relying on graceful-shutdown events."
        ]
      },
      "planned_transition": {
        "goal": "Establish the deterministic root cause and the correct durable recovery boundary.",
        "expected_state_change": "Resolve diagnosis and leave one evidence-bounded implementation gap for the architectural correction."
      },
      "accepted_state_delta": {
        "resolved_gap": {
          "id": "GAP-DIAGNOSE-POWER-LOSS-RECOVERY",
          "status": "resolved",
          "outcome": "The failure is reproduced and traced to non-authoritative recovery eligibility plus premature recovery-marker consumption.",
          "reason": "An exact persisted-state test produces zero replacement Runs; a second test proves the marker is removed before startRun. The source requires a runtime_incomplete/runtime_process_missing item even when active_task, server state, detached Run, and thread binding independently prove a resumable execution.",
          "evidence": [
            "runtime/arcorbit/test/automation-coordinator.test.mjs",
            "runtime/arcorbit/src/automation-coordinator.mjs:1751"
          ]
        },
        "facts_added": [
          {
            "id": "FACT-POWER-LOSS-ROOT-CAUSE",
            "revision": 1,
            "status": "accepted",
            "statement": "ArcOrbit startup recovery incorrectly treats recovery_items as an authoritative prerequisite and removes the matching marker before the replacement Run is durably bound; interruption or an orphaned recovery phase therefore leaves a server in-progress active task and persistent thread with no Runtime and no self-healing startup path.",
            "basis": "Deterministic failing tests reproduce both the orphaned recovery state and the premature marker consumption boundary, and the startup coordinator source matches every observed state transition.",
            "evidence": [
              "runtime/arcorbit/test/automation-coordinator.test.mjs",
              "runtime/arcorbit/src/automation-coordinator.mjs:1719",
              "runtime/arcorbit/src/automation-coordinator.mjs:1751"
            ]
          }
        ],
        "facts_superseded": [],
        "impacts_added": [
          {
            "id": "IMPACT-POWER-LOSS-TECHNICAL",
            "fact_id": "FACT-POWER-LOSS-ROOT-CAUSE",
            "fact_revision": 1,
            "target": {
              "kind": "software_decision",
              "ref": "technical_foundation",
              "revision": 33
            },
            "effect": "threatened",
            "reason": "The persistent one-thread-per-todo Runtime lifecycle is not restart-safe while recovery eligibility depends on a disposable projection.",
            "gap_ids": [
              "GAP-IMPLEMENT-POWER-LOSS-RECOVERY"
            ],
            "evidence": []
          },
          {
            "id": "IMPACT-POWER-LOSS-OPERATIONS",
            "fact_id": "FACT-POWER-LOSS-ROOT-CAUSE",
            "fact_revision": 1,
            "target": {
              "kind": "software_decision",
              "ref": "observability_and_operation",
              "revision": 8
            },
            "effect": "threatened",
            "reason": "Restart reconciliation can silently expose false-running state without an attached Runtime or actionable recovery item.",
            "gap_ids": [
              "GAP-IMPLEMENT-POWER-LOSS-RECOVERY"
            ],
            "evidence": []
          },
          {
            "id": "IMPACT-POWER-LOSS-REALIZATION",
            "fact_id": "FACT-POWER-LOSS-ROOT-CAUSE",
            "fact_revision": 1,
            "target": {
              "kind": "software_invariant",
              "ref": "accepted-facts-are-realized",
              "revision": null
            },
            "effect": "threatened",
            "reason": "The implementation does not realize the accepted restart-recovery contract.",
            "gap_ids": [
              "GAP-IMPLEMENT-POWER-LOSS-RECOVERY"
            ],
            "evidence": []
          },
          {
            "id": "IMPACT-POWER-LOSS-RISK",
            "fact_id": "FACT-POWER-LOSS-ROOT-CAUSE",
            "fact_revision": 1,
            "target": {
              "kind": "software_invariant",
              "ref": "material-risks-have-credible-evidence",
              "revision": null
            },
            "effect": "threatened",
            "reason": "Abrupt termination and repeated restart safety lack a passing deterministic regression proof.",
            "gap_ids": [
              "GAP-IMPLEMENT-POWER-LOSS-RECOVERY"
            ],
            "evidence": []
          }
        ],
        "impacts_updated": [],
        "gaps_added": [
          {
            "id": "GAP-IMPLEMENT-POWER-LOSS-RECOVERY",
            "status": "open",
            "goal": "Make startup recovery self-healing and crash-consistent for interrupted active automation without creating duplicate Runs or losing the persisted Codex thread.",
            "reason": "Recovery eligibility must be derived from authoritative persisted execution and server facts, while the operator-facing recovery marker must remain durable until the replacement Run is atomically bound; fallback must surface an actionable recovery state when automatic resume is unsafe or fails.",
            "derived_from": [
              "FACT-POWER-LOSS-ROOT-CAUSE"
            ],
            "blocked_by": [],
            "priority_basis": {
              "blocking": "high",
              "uncertainty": "low",
              "risk": "high",
              "user_impact": "high"
            },
            "responsibility": "agent",
            "evidence_required": [
              "Passing tests for orphaned recovery phase, marker durability until replacement Run binding, same-thread resume, and no duplicate live Run.",
              "Passing fallback tests for unsafe or failed automatic resume with an actionable persisted recovery item.",
              "Relevant ArcOrbit automation and Desktop regression suite passes."
            ],
            "resolution": null
          }
        ],
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
      "invariant_assessment": {
        "project_revision": 231,
        "judgments": [
          {
            "invariant_ref": "product-expectations-remain-recoverable",
            "disposition": "threatened",
            "reason": "The accepted automatic restart-recovery capability fails for an orphaned persisted recovery state.",
            "fact_refs": [
              "FACT-POWER-LOSS-ROOT-CAUSE"
            ],
            "evidence": [
              "runtime/arcorbit/test/automation-coordinator.test.mjs"
            ],
            "gap_refs": [
              "GAP-IMPLEMENT-POWER-LOSS-RECOVERY"
            ]
          },
          {
            "invariant_ref": "interaction-expectations-remain-recoverable",
            "disposition": "threatened",
            "reason": "The operator can see an active automation association while no Runtime executes and no recovery action is projected.",
            "fact_refs": [
              "FACT-POWER-LOSS-ROOT-CAUSE"
            ],
            "evidence": [
              "runtime/arcorbit/src/automation-coordinator.mjs"
            ],
            "gap_refs": [
              "GAP-IMPLEMENT-POWER-LOSS-RECOVERY"
            ]
          },
          {
            "invariant_ref": "visual-language-remains-consistent",
            "disposition": "not_relevant",
            "reason": "The diagnosis changes no visual-language or presentation rule.",
            "fact_refs": [],
            "evidence": [],
            "gap_refs": []
          },
          {
            "invariant_ref": "technical-decisions-remain-explainable",
            "disposition": "threatened",
            "reason": "The persisted execution state machine lacks a crash-consistent authority boundary between active task, recovery projection, and replacement Run binding.",
            "fact_refs": [
              "FACT-POWER-LOSS-ROOT-CAUSE"
            ],
            "evidence": [
              "runtime/arcorbit/src/automation-coordinator.mjs"
            ],
            "gap_refs": [
              "GAP-IMPLEMENT-POWER-LOSS-RECOVERY"
            ]
          },
          {
            "invariant_ref": "accepted-facts-are-realized",
            "disposition": "threatened",
            "reason": "The current implementation does not realize process-restart recovery for this valid persisted state.",
            "fact_refs": [
              "FACT-POWER-LOSS-ROOT-CAUSE"
            ],
            "evidence": [
              "runtime/arcorbit/test/automation-coordinator.test.mjs"
            ],
            "gap_refs": [
              "GAP-IMPLEMENT-POWER-LOSS-RECOVERY"
            ]
          },
          {
            "invariant_ref": "material-risks-have-credible-evidence",
            "disposition": "threatened",
            "reason": "The newly reproduced power-loss risk needs passing crash-consistency and fallback regressions.",
            "fact_refs": [
              "FACT-POWER-LOSS-ROOT-CAUSE"
            ],
            "evidence": [
              "runtime/arcorbit/test/automation-coordinator.test.mjs"
            ],
            "gap_refs": [
              "GAP-IMPLEMENT-POWER-LOSS-RECOVERY"
            ]
          }
        ]
      },
      "evidence": [
        "runtime/arcorbit/test/automation-coordinator.test.mjs",
        "runtime/arcorbit/src/automation-coordinator.mjs",
        "Current operator input, 2026-08-25"
      ],
      "runtime_result_ref": "direct-agent:power-loss-recovery:diagnosis",
      "occurred_at": "2026-08-25T02:12:58.864Z"
    },
    {
      "round": 2,
      "transition_schema_version": "arckit-case-transition/v8",
      "goal": "Complete the crash-consistent startup recovery implementation and prove its automatic and fallback paths.",
      "outcome": "completed",
      "gap_selection": {
        "mode": "candidate",
        "basis": "The implementation gap is the only ready Case obligation and directly resolves the reproduced power-loss incident.",
        "snapshot_token": "c91f632ef001b78a47302f0e1e0f10cdc33f9bd8aaf9265aafbbb9103d148107",
        "selected_ref": "case-gap:CASE-20260825-001:GAP-IMPLEMENT-POWER-LOSS-RECOVERY",
        "comparison_summary": "Compared the incident implementation gap with four Project-level candidates; the ready user-blocking recovery correction remains the highest-priority bounded work and all Project candidates require separate Cases.",
        "fresh_discovery_summary": "Implementation and regression review found no additional Case gap: unsafe states preserve their specific recovery boundary, live ownership prevents duplicate execution, and start failure remains actionable.",
        "considered": [
          {
            "ref": "project-gap:GAP-agent-scenario-evaluation",
            "source": "persisted",
            "eligibility": "case_required",
            "disposition": "deferred",
            "priority_basis": {
              "uncertainty": "high",
              "risk": "high"
            },
            "reason": "This Project-level candidate requires a separate Case and does not block closing the incident-specific recovery correction."
          },
          {
            "ref": "project-gap:GAP-runtime-resilience-and-adapters",
            "source": "persisted",
            "eligibility": "case_required",
            "disposition": "deferred",
            "priority_basis": {
              "risk": "high",
              "urgency": "medium"
            },
            "reason": "This Project-level candidate requires a separate Case and does not block closing the incident-specific recovery correction."
          },
          {
            "ref": "project-gap:GAP-security-real-project-validation",
            "source": "persisted",
            "eligibility": "case_required",
            "disposition": "deferred",
            "priority_basis": {
              "risk": "high",
              "urgency": "medium"
            },
            "reason": "This Project-level candidate requires a separate Case and does not block closing the incident-specific recovery correction."
          },
          {
            "ref": "project-gap:GAP-cross-record-audit",
            "source": "persisted",
            "eligibility": "case_required",
            "disposition": "deferred",
            "priority_basis": {
              "risk": "high",
              "urgency": "high"
            },
            "reason": "This Project-level candidate requires a separate Case and does not block closing the incident-specific recovery correction."
          },
          {
            "ref": "case-gap:CASE-20260825-001:GAP-IMPLEMENT-POWER-LOSS-RECOVERY",
            "source": "persisted",
            "eligibility": "ready",
            "disposition": "selected",
            "priority_basis": {
              "blocking": "high",
              "uncertainty": "low",
              "risk": "high",
              "user_impact": "high"
            },
            "reason": "The implementation gap is the only ready Case gap and now has direct code, regression, fallback, and architecture evidence."
          }
        ]
      },
      "selected_gap": {
        "id": "GAP-IMPLEMENT-POWER-LOSS-RECOVERY",
        "responsibility": "agent",
        "goal": "Make startup recovery self-healing and crash-consistent for interrupted active automation without creating duplicate Runs or losing the persisted Codex thread.",
        "reason": "Recovery eligibility must be derived from authoritative persisted execution and server facts, while the operator-facing recovery marker must remain durable until the replacement Run is atomically bound; fallback must surface an actionable recovery state when automatic resume is unsafe or fails.",
        "derived_from": [
          "FACT-POWER-LOSS-ROOT-CAUSE"
        ],
        "blocked_by": [],
        "priority_basis": {
          "blocking": "high",
          "uncertainty": "low",
          "risk": "high",
          "user_impact": "high"
        },
        "evidence_required": [
          "Passing tests for orphaned recovery phase, marker durability until replacement Run binding, same-thread resume, and no duplicate live Run.",
          "Passing fallback tests for unsafe or failed automatic resume with an actionable persisted recovery item.",
          "Relevant ArcOrbit automation and Desktop regression suite passes."
        ]
      },
      "planned_transition": {
        "goal": "Complete the crash-consistent startup recovery implementation and prove its automatic and fallback paths.",
        "expected_state_change": "Resolve the implementation gap, supersede the defective recovery fact, uphold all incident impacts, and advance the Case to Completion Review."
      },
      "accepted_state_delta": {
        "resolved_gap": {
          "id": "GAP-IMPLEMENT-POWER-LOSS-RECOVERY",
          "status": "resolved",
          "outcome": "Startup recovery is self-healing and crash-consistent for interrupted automation while preserving same-thread execution and explicit operator boundaries.",
          "reason": "Coordinator startup now reconstructs missing recovery intent from authoritative persisted execution facts, retains the marker until replacement Run binding, replaces it atomically with a failed-start recovery when needed, and refuses automatic restart for live or specifically blocked ownership states.",
          "evidence": [
            "runtime/arcorbit/src/automation-coordinator.mjs",
            "runtime/arcorbit/test/automation-coordinator.test.mjs",
            "arckit/tech/arcorbit/desktop-execution-solution.md",
            "node --test runtime/arcorbit/test/automation-coordinator.test.mjs runtime/arcorbit/test/desktop-run-manager.test.mjs runtime/arcorbit/test/desktop-store.test.mjs runtime/arcorbit/test/runtime-process-environment.test.mjs: 74 passed",
            "npm --prefix runtime/arcorbit run check: 394 passed, 9 skipped, only sandboxed Electron fixture failed; isolated unsandboxed fixture: 1 passed"
          ]
        },
        "facts_added": [
          {
            "id": "FACT-POWER-LOSS-ROOT-CAUSE",
            "revision": 2,
            "status": "accepted",
            "statement": "ArcOrbit derives startup recovery from persisted active-task, local task state, live Run ownership, thread binding, and control boundaries; when an interrupted phase has no live Runtime and no specific operator recovery decision, it reconstructs a process-missing recovery and consumes that marker only in the Store mutation that binds the replacement Run, while failed starts retain one actionable same-thread recovery item.",
            "basis": "The coordinator implementation, stable technical contract, and deterministic startup/fallback regressions establish the crash-consistent recovery boundary.",
            "evidence": [
              "runtime/arcorbit/src/automation-coordinator.mjs",
              "runtime/arcorbit/test/automation-coordinator.test.mjs",
              "arckit/tech/arcorbit/desktop-execution-solution.md",
              "node --test runtime/arcorbit/test/automation-coordinator.test.mjs runtime/arcorbit/test/desktop-run-manager.test.mjs runtime/arcorbit/test/desktop-store.test.mjs runtime/arcorbit/test/runtime-process-environment.test.mjs: 74 passed",
              "npm --prefix runtime/arcorbit run check: 394 passed, 9 skipped, only sandboxed Electron fixture failed; isolated unsandboxed fixture: 1 passed"
            ]
          }
        ],
        "facts_superseded": [
          {
            "id": "FACT-POWER-LOSS-ROOT-CAUSE",
            "revision": 1,
            "reason": "The diagnosed defective recovery behavior has been replaced by the crash-consistent implementation.",
            "evidence": [
              "runtime/arcorbit/src/automation-coordinator.mjs",
              "runtime/arcorbit/test/automation-coordinator.test.mjs",
              "arckit/tech/arcorbit/desktop-execution-solution.md",
              "node --test runtime/arcorbit/test/automation-coordinator.test.mjs runtime/arcorbit/test/desktop-run-manager.test.mjs runtime/arcorbit/test/desktop-store.test.mjs runtime/arcorbit/test/runtime-process-environment.test.mjs: 74 passed",
              "npm --prefix runtime/arcorbit run check: 394 passed, 9 skipped, only sandboxed Electron fixture failed; isolated unsandboxed fixture: 1 passed"
            ]
          }
        ],
        "impacts_added": [],
        "impacts_updated": [
          {
            "id": "IMPACT-POWER-LOSS-TECHNICAL",
            "target": {
              "kind": "software_decision",
              "ref": "technical_foundation",
              "revision": 33
            },
            "reason": "The one-thread-per-todo Runtime lifecycle now reconstructs lost process ownership from durable facts and preserves the thread across replacement Runs.",
            "fact_id": "FACT-POWER-LOSS-ROOT-CAUSE",
            "fact_revision": 2,
            "effect": "upheld",
            "gap_ids": [],
            "evidence": [
              "runtime/arcorbit/src/automation-coordinator.mjs",
              "runtime/arcorbit/test/automation-coordinator.test.mjs",
              "arckit/tech/arcorbit/desktop-execution-solution.md",
              "node --test runtime/arcorbit/test/automation-coordinator.test.mjs runtime/arcorbit/test/desktop-run-manager.test.mjs runtime/arcorbit/test/desktop-store.test.mjs runtime/arcorbit/test/runtime-process-environment.test.mjs: 74 passed",
              "npm --prefix runtime/arcorbit run check: 394 passed, 9 skipped, only sandboxed Electron fixture failed; isolated unsandboxed fixture: 1 passed"
            ]
          },
          {
            "id": "IMPACT-POWER-LOSS-OPERATIONS",
            "target": {
              "kind": "software_decision",
              "ref": "observability_and_operation",
              "revision": 8
            },
            "reason": "A missing Runtime now produces either deterministic same-thread resumption or one persisted actionable recovery item instead of a silent false-running state.",
            "fact_id": "FACT-POWER-LOSS-ROOT-CAUSE",
            "fact_revision": 2,
            "effect": "upheld",
            "gap_ids": [],
            "evidence": [
              "runtime/arcorbit/src/automation-coordinator.mjs",
              "runtime/arcorbit/test/automation-coordinator.test.mjs",
              "arckit/tech/arcorbit/desktop-execution-solution.md",
              "node --test runtime/arcorbit/test/automation-coordinator.test.mjs runtime/arcorbit/test/desktop-run-manager.test.mjs runtime/arcorbit/test/desktop-store.test.mjs runtime/arcorbit/test/runtime-process-environment.test.mjs: 74 passed",
              "npm --prefix runtime/arcorbit run check: 394 passed, 9 skipped, only sandboxed Electron fixture failed; isolated unsandboxed fixture: 1 passed"
            ]
          },
          {
            "id": "IMPACT-POWER-LOSS-REALIZATION",
            "target": {
              "kind": "software_invariant",
              "ref": "accepted-facts-are-realized",
              "revision": null
            },
            "reason": "The implementation and stable technical contract now realize abrupt-process-loss recovery.",
            "fact_id": "FACT-POWER-LOSS-ROOT-CAUSE",
            "fact_revision": 2,
            "effect": "upheld",
            "gap_ids": [],
            "evidence": [
              "runtime/arcorbit/src/automation-coordinator.mjs",
              "runtime/arcorbit/test/automation-coordinator.test.mjs",
              "arckit/tech/arcorbit/desktop-execution-solution.md",
              "node --test runtime/arcorbit/test/automation-coordinator.test.mjs runtime/arcorbit/test/desktop-run-manager.test.mjs runtime/arcorbit/test/desktop-store.test.mjs runtime/arcorbit/test/runtime-process-environment.test.mjs: 74 passed",
              "npm --prefix runtime/arcorbit run check: 394 passed, 9 skipped, only sandboxed Electron fixture failed; isolated unsandboxed fixture: 1 passed"
            ]
          },
          {
            "id": "IMPACT-POWER-LOSS-RISK",
            "target": {
              "kind": "software_invariant",
              "ref": "material-risks-have-credible-evidence",
              "revision": null
            },
            "reason": "Deterministic regressions cover orphan reconstruction, durable marker consumption, live-Run deduplication, unsafe recovery preservation, and failed-start fallback.",
            "fact_id": "FACT-POWER-LOSS-ROOT-CAUSE",
            "fact_revision": 2,
            "effect": "upheld",
            "gap_ids": [],
            "evidence": [
              "runtime/arcorbit/src/automation-coordinator.mjs",
              "runtime/arcorbit/test/automation-coordinator.test.mjs",
              "arckit/tech/arcorbit/desktop-execution-solution.md",
              "node --test runtime/arcorbit/test/automation-coordinator.test.mjs runtime/arcorbit/test/desktop-run-manager.test.mjs runtime/arcorbit/test/desktop-store.test.mjs runtime/arcorbit/test/runtime-process-environment.test.mjs: 74 passed",
              "npm --prefix runtime/arcorbit run check: 394 passed, 9 skipped, only sandboxed Electron fixture failed; isolated unsandboxed fixture: 1 passed"
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
      "invariant_assessment": {
        "project_revision": 231,
        "judgments": [
          {
            "invariant_ref": "product-expectations-remain-recoverable",
            "disposition": "upheld",
            "reason": "An interrupted in-progress automation now resumes from persistent execution facts or presents a bounded recovery state.",
            "fact_refs": [
              "FACT-POWER-LOSS-ROOT-CAUSE"
            ],
            "evidence": [
              "runtime/arcorbit/src/automation-coordinator.mjs",
              "runtime/arcorbit/test/automation-coordinator.test.mjs",
              "arckit/tech/arcorbit/desktop-execution-solution.md",
              "node --test runtime/arcorbit/test/automation-coordinator.test.mjs runtime/arcorbit/test/desktop-run-manager.test.mjs runtime/arcorbit/test/desktop-store.test.mjs runtime/arcorbit/test/runtime-process-environment.test.mjs: 74 passed",
              "npm --prefix runtime/arcorbit run check: 394 passed, 9 skipped, only sandboxed Electron fixture failed; isolated unsandboxed fixture: 1 passed"
            ],
            "gap_refs": []
          },
          {
            "invariant_ref": "interaction-expectations-remain-recoverable",
            "disposition": "upheld",
            "reason": "The operator sees a single durable recovery action when automatic continuation is unsafe or fails.",
            "fact_refs": [
              "FACT-POWER-LOSS-ROOT-CAUSE"
            ],
            "evidence": [
              "runtime/arcorbit/src/automation-coordinator.mjs",
              "runtime/arcorbit/test/automation-coordinator.test.mjs",
              "arckit/tech/arcorbit/desktop-execution-solution.md",
              "node --test runtime/arcorbit/test/automation-coordinator.test.mjs runtime/arcorbit/test/desktop-run-manager.test.mjs runtime/arcorbit/test/desktop-store.test.mjs runtime/arcorbit/test/runtime-process-environment.test.mjs: 74 passed",
              "npm --prefix runtime/arcorbit run check: 394 passed, 9 skipped, only sandboxed Electron fixture failed; isolated unsandboxed fixture: 1 passed"
            ],
            "gap_refs": []
          },
          {
            "invariant_ref": "visual-language-remains-consistent",
            "disposition": "not_relevant",
            "reason": "The recovery state-machine correction changes no visual-language rule.",
            "fact_refs": [],
            "evidence": [],
            "gap_refs": []
          },
          {
            "invariant_ref": "technical-decisions-remain-explainable",
            "disposition": "upheld",
            "reason": "The technical contract now states the recovery authority, reconstruction conditions, transaction boundary, and operator exceptions.",
            "fact_refs": [
              "FACT-POWER-LOSS-ROOT-CAUSE"
            ],
            "evidence": [
              "runtime/arcorbit/src/automation-coordinator.mjs",
              "runtime/arcorbit/test/automation-coordinator.test.mjs",
              "arckit/tech/arcorbit/desktop-execution-solution.md",
              "node --test runtime/arcorbit/test/automation-coordinator.test.mjs runtime/arcorbit/test/desktop-run-manager.test.mjs runtime/arcorbit/test/desktop-store.test.mjs runtime/arcorbit/test/runtime-process-environment.test.mjs: 74 passed",
              "npm --prefix runtime/arcorbit run check: 394 passed, 9 skipped, only sandboxed Electron fixture failed; isolated unsandboxed fixture: 1 passed"
            ],
            "gap_refs": []
          },
          {
            "invariant_ref": "accepted-facts-are-realized",
            "disposition": "upheld",
            "reason": "The startup coordinator realizes the accepted abrupt-process-loss recovery contract.",
            "fact_refs": [
              "FACT-POWER-LOSS-ROOT-CAUSE"
            ],
            "evidence": [
              "runtime/arcorbit/src/automation-coordinator.mjs",
              "runtime/arcorbit/test/automation-coordinator.test.mjs",
              "arckit/tech/arcorbit/desktop-execution-solution.md",
              "node --test runtime/arcorbit/test/automation-coordinator.test.mjs runtime/arcorbit/test/desktop-run-manager.test.mjs runtime/arcorbit/test/desktop-store.test.mjs runtime/arcorbit/test/runtime-process-environment.test.mjs: 74 passed",
              "npm --prefix runtime/arcorbit run check: 394 passed, 9 skipped, only sandboxed Electron fixture failed; isolated unsandboxed fixture: 1 passed"
            ],
            "gap_refs": []
          },
          {
            "invariant_ref": "material-risks-have-credible-evidence",
            "disposition": "upheld",
            "reason": "Focused and broader Desktop regressions prove the normal, duplicate-prevention, unsafe, and failed-start paths.",
            "fact_refs": [
              "FACT-POWER-LOSS-ROOT-CAUSE"
            ],
            "evidence": [
              "runtime/arcorbit/src/automation-coordinator.mjs",
              "runtime/arcorbit/test/automation-coordinator.test.mjs",
              "arckit/tech/arcorbit/desktop-execution-solution.md",
              "node --test runtime/arcorbit/test/automation-coordinator.test.mjs runtime/arcorbit/test/desktop-run-manager.test.mjs runtime/arcorbit/test/desktop-store.test.mjs runtime/arcorbit/test/runtime-process-environment.test.mjs: 74 passed",
              "npm --prefix runtime/arcorbit run check: 394 passed, 9 skipped, only sandboxed Electron fixture failed; isolated unsandboxed fixture: 1 passed"
            ],
            "gap_refs": []
          }
        ]
      },
      "evidence": [
        "runtime/arcorbit/src/automation-coordinator.mjs",
        "runtime/arcorbit/test/automation-coordinator.test.mjs",
        "arckit/tech/arcorbit/desktop-execution-solution.md",
        "node --test runtime/arcorbit/test/automation-coordinator.test.mjs runtime/arcorbit/test/desktop-run-manager.test.mjs runtime/arcorbit/test/desktop-store.test.mjs runtime/arcorbit/test/runtime-process-environment.test.mjs: 74 passed",
        "npm --prefix runtime/arcorbit run check: 394 passed, 9 skipped, only sandboxed Electron fixture failed; isolated unsandboxed fixture: 1 passed"
      ],
      "runtime_result_ref": "direct-agent:power-loss-recovery:implementation",
      "occurred_at": "2026-08-25T02:22:15.992Z"
    },
    {
      "round": 3,
      "transition_schema_version": "arckit-case-transition/v8",
      "goal": "Independently review the completed recovery correction across all five mandatory completion dimensions.",
      "outcome": "completed",
      "gap_selection": {
        "mode": "candidate",
        "basis": "All ordinary Case gaps and impacts are closed, so the required Completion Review is the only ready Case candidate.",
        "snapshot_token": "5c557e9d6ae9110cbe28e199a3b5fe7b90a52c775dea3bfc8626edcd0eff785a",
        "selected_ref": "case-gap:CASE-20260825-001:CASE-20260825-001:completion-review:1",
        "comparison_summary": "Compared the ready Completion Review with four Project-level candidates; only the review is eligible inside this Case and it blocks deterministic closure.",
        "fresh_discovery_summary": "Review of the state machine, failure boundaries, tests, technical contract, and full-suite evidence found no correctness, resolution, credibility, regression, or minimality finding.",
        "considered": [
          {
            "ref": "project-gap:GAP-agent-scenario-evaluation",
            "source": "persisted",
            "eligibility": "case_required",
            "disposition": "deferred",
            "priority_basis": {
              "uncertainty": "high",
              "risk": "high"
            },
            "reason": "This Project-level candidate belongs to another Case and is outside the bounded incident completion review."
          },
          {
            "ref": "project-gap:GAP-runtime-resilience-and-adapters",
            "source": "persisted",
            "eligibility": "case_required",
            "disposition": "deferred",
            "priority_basis": {
              "risk": "high",
              "urgency": "medium"
            },
            "reason": "This Project-level candidate belongs to another Case and is outside the bounded incident completion review."
          },
          {
            "ref": "project-gap:GAP-security-real-project-validation",
            "source": "persisted",
            "eligibility": "case_required",
            "disposition": "deferred",
            "priority_basis": {
              "risk": "high",
              "urgency": "medium"
            },
            "reason": "This Project-level candidate belongs to another Case and is outside the bounded incident completion review."
          },
          {
            "ref": "project-gap:GAP-cross-record-audit",
            "source": "persisted",
            "eligibility": "case_required",
            "disposition": "deferred",
            "priority_basis": {
              "risk": "high",
              "urgency": "high"
            },
            "reason": "This Project-level candidate belongs to another Case and is outside the bounded incident completion review."
          },
          {
            "ref": "case-gap:CASE-20260825-001:CASE-20260825-001:completion-review:1",
            "source": "persisted",
            "eligibility": "ready",
            "disposition": "selected",
            "priority_basis": {
              "blocking": "high",
              "uncertainty": "low",
              "risk": "high",
              "user_impact": "high"
            },
            "reason": "The mandatory Completion Review is the only ready Case obligation and can independently assess the completed content revision."
          }
        ]
      },
      "selected_gap": {
        "id": "CASE-20260825-001:completion-review:1",
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
        "goal": "Independently review the completed recovery correction across all five mandatory completion dimensions.",
        "expected_state_change": "Record a clean review for content revision 2 and close the Case with no unresolved obligation."
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
            "git diff --check: passed",
            "runtime/arcorbit/src/automation-coordinator.mjs",
            "runtime/arcorbit/test/automation-coordinator.test.mjs",
            "arckit/tech/arcorbit/desktop-execution-solution.md",
            "node --test runtime/arcorbit/test/automation-coordinator.test.mjs runtime/arcorbit/test/desktop-run-manager.test.mjs runtime/arcorbit/test/desktop-store.test.mjs runtime/arcorbit/test/runtime-process-environment.test.mjs: 74 passed",
            "npm --prefix runtime/arcorbit run check: 394 passed, 9 skipped, only sandboxed Electron fixture failed; isolated unsandboxed fixture: 1 passed"
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
      "invariant_assessment": {
        "project_revision": 231,
        "judgments": [
          {
            "invariant_ref": "product-expectations-remain-recoverable",
            "disposition": "upheld",
            "reason": "Review confirms an orphaned in-progress automation resumes or exposes an actionable bounded recovery.",
            "fact_refs": [
              "FACT-POWER-LOSS-ROOT-CAUSE"
            ],
            "evidence": [
              "runtime/arcorbit/src/automation-coordinator.mjs",
              "runtime/arcorbit/test/automation-coordinator.test.mjs",
              "arckit/tech/arcorbit/desktop-execution-solution.md"
            ],
            "gap_refs": []
          },
          {
            "invariant_ref": "interaction-expectations-remain-recoverable",
            "disposition": "upheld",
            "reason": "Review confirms automatic recovery never bypasses an explicit operator decision and failed starts remain visible and actionable.",
            "fact_refs": [
              "FACT-POWER-LOSS-ROOT-CAUSE"
            ],
            "evidence": [
              "runtime/arcorbit/src/automation-coordinator.mjs",
              "runtime/arcorbit/test/automation-coordinator.test.mjs",
              "arckit/tech/arcorbit/desktop-execution-solution.md"
            ],
            "gap_refs": []
          },
          {
            "invariant_ref": "visual-language-remains-consistent",
            "disposition": "not_relevant",
            "reason": "The reviewed change has no visual-language surface.",
            "fact_refs": [],
            "evidence": [],
            "gap_refs": []
          },
          {
            "invariant_ref": "technical-decisions-remain-explainable",
            "disposition": "upheld",
            "reason": "Review confirms the implementation follows the documented authority and transaction boundaries without embedding a special-case workaround.",
            "fact_refs": [
              "FACT-POWER-LOSS-ROOT-CAUSE"
            ],
            "evidence": [
              "runtime/arcorbit/src/automation-coordinator.mjs",
              "runtime/arcorbit/test/automation-coordinator.test.mjs",
              "arckit/tech/arcorbit/desktop-execution-solution.md"
            ],
            "gap_refs": []
          },
          {
            "invariant_ref": "accepted-facts-are-realized",
            "disposition": "upheld",
            "reason": "Code, tests, and technical documentation consistently realize the accepted recovery fact.",
            "fact_refs": [
              "FACT-POWER-LOSS-ROOT-CAUSE"
            ],
            "evidence": [
              "runtime/arcorbit/src/automation-coordinator.mjs",
              "runtime/arcorbit/test/automation-coordinator.test.mjs",
              "arckit/tech/arcorbit/desktop-execution-solution.md"
            ],
            "gap_refs": []
          },
          {
            "invariant_ref": "material-risks-have-credible-evidence",
            "disposition": "upheld",
            "reason": "Focused regressions and the broader Desktop suite cover the material recovery, duplication, fallback, and compatibility risks.",
            "fact_refs": [
              "FACT-POWER-LOSS-ROOT-CAUSE"
            ],
            "evidence": [
              "git diff --check: passed",
              "runtime/arcorbit/src/automation-coordinator.mjs",
              "runtime/arcorbit/test/automation-coordinator.test.mjs",
              "arckit/tech/arcorbit/desktop-execution-solution.md",
              "node --test runtime/arcorbit/test/automation-coordinator.test.mjs runtime/arcorbit/test/desktop-run-manager.test.mjs runtime/arcorbit/test/desktop-store.test.mjs runtime/arcorbit/test/runtime-process-environment.test.mjs: 74 passed",
              "npm --prefix runtime/arcorbit run check: 394 passed, 9 skipped, only sandboxed Electron fixture failed; isolated unsandboxed fixture: 1 passed"
            ],
            "gap_refs": []
          }
        ]
      },
      "evidence": [
        "git diff --check: passed",
        "runtime/arcorbit/src/automation-coordinator.mjs",
        "runtime/arcorbit/test/automation-coordinator.test.mjs",
        "arckit/tech/arcorbit/desktop-execution-solution.md",
        "node --test runtime/arcorbit/test/automation-coordinator.test.mjs runtime/arcorbit/test/desktop-run-manager.test.mjs runtime/arcorbit/test/desktop-store.test.mjs runtime/arcorbit/test/runtime-process-environment.test.mjs: 74 passed",
        "npm --prefix runtime/arcorbit run check: 394 passed, 9 skipped, only sandboxed Electron fixture failed; isolated unsandboxed fixture: 1 passed"
      ],
      "runtime_result_ref": "direct-agent:power-loss-recovery:completion-review",
      "occurred_at": "2026-08-25T02:23:19.097Z"
    }
  ],
  "case_resolution": {
    "status": "resolved",
    "stage": "resolved",
    "satisfied": [
      "GAP-DIAGNOSE-POWER-LOSS-RECOVERY",
      "GAP-IMPLEMENT-POWER-LOSS-RECOVERY"
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
    "updated_at": "2026-08-25T02:23:19.097Z"
  }
}
```

## Round Notes

- Case history is canonical in Structured Record.rounds; keep prose notes exceptional.
