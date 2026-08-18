# Fix repeated ArcOrbit window launches after todo execution starts

Case: CASE-20260818-006
Status: closed
Artifact Type: code
Selected Gap: none
Updated: 2026-08-18T18:02:39.627Z

## User Intent

Diagnose and fix the ArcOrbit automation defect that repeatedly opens new application windows after a todo enters execution.

## Structured Record

```json
{
  "schema_version": "development-case-record/v5",
  "id": "CASE-20260818-006",
  "title": "Fix repeated ArcOrbit window launches after todo execution starts",
  "status": "closed",
  "artifact_type": "code",
  "created_at": "2026-08-18T17:47:32.684Z",
  "updated_at": "2026-08-18T18:02:39.627Z",
  "user_intent": "Diagnose and fix the ArcOrbit automation defect that repeatedly opens new application windows after a todo enters execution.",
  "expected_outcome": "Starting one todo execution reuses the intended ArcOrbit application/runtime instance and never triggers an unbounded sequence of new application windows.",
  "project_state_ref": "arckit/project/state.record.json",
  "current_round": {
    "goal": "",
    "selected_gap": null
  },
  "facts": [
    {
      "id": "FACT-WINDOW-LOOP-REPORT",
      "revision": 1,
      "status": "accepted",
      "statement": "When an automated todo enters execution, ArcOrbit begins repeatedly launching one new application window after another.",
      "basis": "Direct user report received 2026-08-19; the observed behavior is accepted as the incident symptom while root cause remains unknown.",
      "evidence": [
        "User report received 2026-08-19"
      ]
    },
    {
      "id": "FACT-INTERNAL-NODE-MODE-LOST",
      "revision": 1,
      "status": "accepted",
      "statement": "In packaged ArcOrbit, bin/arcorbit.mjs deletes ELECTRON_RUN_AS_NODE before createStateStore invokes runLedgerScript; runLedgerScript defaults to the Electron process.execPath with an empty nodeEnv, so its trusted protocol/ledger script launch enters Desktop mode, creates a new window, and the new instance resumes the same in-progress todo, recursively repeating the chain.",
      "basis": "Static call-chain analysis, existing incident Run records, and a controlled installed-package process-tree reproduction agree on the trigger, state transition, process identities, repeated timing, and UI symptom.",
      "evidence": [
        "runtime/arcorbit/bin/arcorbit.mjs",
        "runtime/arcorbit/src/runtime-process-environment.mjs",
        "runtime/arcorbit/src/ledger-scripts.mjs",
        "runtime/arcorbit/src/state-store.mjs",
        "runtime/arcorbit/src/automation-coordinator.mjs",
        "arckit-runtime://runs/RUN-20260818-174446682Z",
        "arckit-runtime://runs/RUN-20260818-174449219Z",
        "arckit-runtime://runs/RUN-20260818-174452019Z"
      ]
    },
    {
      "id": "FACT-INTERNAL-NODE-BOUNDARY-REPAIRED",
      "revision": 1,
      "status": "accepted",
      "statement": "ArcOrbit now centralizes runtimeNodeChildEnvironment: Electron-hosted Runtime-owned Node launches explicitly receive ELECTRON_RUN_AS_NODE=1, while bin/arcorbit.mjs still removes the flag from the Runtime process environment before Codex/external children are created.",
      "basis": "Source diff, focused regression tests, the full ArcOrbit check, an unsigned local package build, and packaged-host process-tree sampling all agree.",
      "evidence": [
        "runtime/arcorbit/src/runtime-process-environment.mjs",
        "runtime/arcorbit/src/ledger-scripts.mjs",
        "runtime/arcorbit/src/project-initializer.mjs",
        "runtime/arcorbit/src/desktop-run-manager.mjs",
        "runtime/arcorbit/test/runtime-process-environment.test.mjs",
        "npm --prefix runtime/arcorbit run check: 213 tests, 211 passed, 2 environment-gated skipped, 0 failed",
        "Local unsigned macOS x64 package build 20260818175707: succeeded",
        "Packaged-host init-project and Runtime dry-run process-tree regression 2026-08-19: both exited 0; trusted ledger Node child observed; no Desktop entrypoint, GPU helper, or Renderer helper observed"
      ]
    }
  ],
  "state_impacts": [
    {
      "id": "IMPACT-TECH-INTERNAL-NODE-BOUNDARY",
      "fact_id": "FACT-INTERNAL-NODE-MODE-LOST",
      "fact_revision": 1,
      "target": {
        "kind": "software_decision",
        "ref": "technical_foundation",
        "revision": 18
      },
      "effect": "upheld",
      "reason": "The Desktop/Runtime/trusted-ledger host boundary is restored by explicit internal Node child environment handling.",
      "gap_ids": [],
      "evidence": [
        "runtime/arcorbit/src/runtime-process-environment.mjs",
        "runtime/arcorbit/src/ledger-scripts.mjs",
        "runtime/arcorbit/src/project-initializer.mjs",
        "runtime/arcorbit/src/desktop-run-manager.mjs",
        "runtime/arcorbit/test/runtime-process-environment.test.mjs",
        "npm --prefix runtime/arcorbit run check: 213 tests, 211 passed, 2 environment-gated skipped, 0 failed",
        "Local unsigned macOS x64 package build 20260818175707: succeeded",
        "Packaged-host init-project and Runtime dry-run process-tree regression 2026-08-19: both exited 0; trusted ledger Node child observed; no Desktop entrypoint, GPU helper, or Renderer helper observed"
      ]
    },
    {
      "id": "IMPACT-REALIZATION-WINDOW-LOOP",
      "fact_id": "FACT-INTERNAL-NODE-MODE-LOST",
      "fact_revision": 1,
      "target": {
        "kind": "software_invariant",
        "ref": "accepted-facts-are-realized",
        "revision": null
      },
      "effect": "upheld",
      "reason": "A packaged Runtime and its trusted ledger children complete without creating a Desktop or graphics/renderer process subtree.",
      "gap_ids": [],
      "evidence": [
        "runtime/arcorbit/src/runtime-process-environment.mjs",
        "runtime/arcorbit/src/ledger-scripts.mjs",
        "runtime/arcorbit/src/project-initializer.mjs",
        "runtime/arcorbit/src/desktop-run-manager.mjs",
        "runtime/arcorbit/test/runtime-process-environment.test.mjs",
        "npm --prefix runtime/arcorbit run check: 213 tests, 211 passed, 2 environment-gated skipped, 0 failed",
        "Local unsigned macOS x64 package build 20260818175707: succeeded",
        "Packaged-host init-project and Runtime dry-run process-tree regression 2026-08-19: both exited 0; trusted ledger Node child observed; no Desktop entrypoint, GPU helper, or Renderer helper observed"
      ]
    },
    {
      "id": "IMPACT-RISK-WINDOW-LOOP",
      "fact_id": "FACT-INTERNAL-NODE-MODE-LOST",
      "fact_revision": 1,
      "target": {
        "kind": "software_invariant",
        "ref": "material-risks-have-credible-evidence",
        "revision": null
      },
      "effect": "upheld",
      "reason": "Focused, full-suite, package-build, and packaged process-tree evidence now control the runaway-window regression risk.",
      "gap_ids": [],
      "evidence": [
        "runtime/arcorbit/src/runtime-process-environment.mjs",
        "runtime/arcorbit/src/ledger-scripts.mjs",
        "runtime/arcorbit/src/project-initializer.mjs",
        "runtime/arcorbit/src/desktop-run-manager.mjs",
        "runtime/arcorbit/test/runtime-process-environment.test.mjs",
        "npm --prefix runtime/arcorbit run check: 213 tests, 211 passed, 2 environment-gated skipped, 0 failed",
        "Local unsigned macOS x64 package build 20260818175707: succeeded",
        "Packaged-host init-project and Runtime dry-run process-tree regression 2026-08-19: both exited 0; trusted ledger Node child observed; no Desktop entrypoint, GPU helper, or Renderer helper observed"
      ]
    }
  ],
  "gaps": [
    {
      "id": "GAP-DIAGNOSE-WINDOW-LAUNCH-LOOP",
      "status": "resolved",
      "goal": "Establish the exact reproducible execution path and root cause that makes one todo execution repeatedly launch new ArcOrbit application windows.",
      "reason": "The safe repair boundary depends on whether the repeated windows originate from application instance handling, self-spawn configuration, retry/recovery orchestration, or another runtime boundary.",
      "derived_from": [
        "case_intent",
        "FACT-WINDOW-LOOP-REPORT"
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
        "A repeatable reproduction or deterministic test plus code-path/runtime evidence that fully matches the trigger, repeated-window behavior, state changes, location, and timing."
      ],
      "resolution": {
        "id": "GAP-DIAGNOSE-WINDOW-LAUNCH-LOOP",
        "status": "resolved",
        "outcome": "The repeated-window loop is traced to loss of Electron embedded-Node mode between Runtime bootstrap and trusted ledger child launches.",
        "reason": "Packaged-host reproduction showed the first Runtime child enter Node mode, then protocol-compatibility.mjs launched through the same Electron process.execPath after ELECTRON_RUN_AS_NODE had been deleted; that child created GPU/Renderer processes and resumed the same in-progress task, matching the observed recursive timing and run records.",
        "evidence": [
          "runtime/arcorbit/bin/arcorbit.mjs",
          "runtime/arcorbit/src/runtime-process-environment.mjs",
          "runtime/arcorbit/src/ledger-scripts.mjs",
          "runtime/arcorbit/src/state-store.mjs",
          "runtime/arcorbit/src/automation-coordinator.mjs",
          "arckit-runtime://runs/RUN-20260818-174446682Z",
          "arckit-runtime://runs/RUN-20260818-174449219Z",
          "arckit-runtime://runs/RUN-20260818-174452019Z"
        ],
        "occurred_at": "2026-08-18T17:55:11.139Z"
      }
    },
    {
      "id": "GAP-FIX-INTERNAL-NODE-SUBPROCESS-BOUNDARY",
      "status": "resolved",
      "goal": "Make every Runtime-owned Node script launch retain an explicit Node-capable host/environment while keeping ELECTRON_RUN_AS_NODE out of Codex and other external child processes, so trusted ledger probes cannot enter ArcOrbit Desktop.",
      "reason": "The accepted root-cause evidence shows that the Runtime bootstrap globally removes ELECTRON_RUN_AS_NODE before runLedgerScript later reuses the Electron process.execPath with an empty nodeEnv.",
      "derived_from": [
        "FACT-WINDOW-LOOP-REPORT",
        "FACT-INTERNAL-NODE-MODE-LOST"
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
        "Regression coverage proving internal ledger scripts retain Node mode after Runtime bootstrap sanitization while Codex/external children do not inherit it.",
        "ArcOrbit automated checks and a packaged-host reproduction showing one todo start produces one Runtime without any new Desktop/GPU/Renderer process tree."
      ],
      "resolution": {
        "id": "GAP-FIX-INTERNAL-NODE-SUBPROCESS-BOUNDARY",
        "status": "resolved",
        "outcome": "Runtime-owned Node children now explicitly regain Electron embedded-Node mode without exposing the flag to Codex/external children, and packaged execution no longer enters Desktop recursively.",
        "reason": "The shared helper is used by every internal launcher; full tests pass and a newly built packaged app completed project initialization and a Runtime dry-run with trusted ledger child processes but no Desktop/GPU/Renderer descendants.",
        "evidence": [
          "runtime/arcorbit/src/runtime-process-environment.mjs",
          "runtime/arcorbit/src/ledger-scripts.mjs",
          "runtime/arcorbit/src/project-initializer.mjs",
          "runtime/arcorbit/src/desktop-run-manager.mjs",
          "runtime/arcorbit/test/runtime-process-environment.test.mjs",
          "npm --prefix runtime/arcorbit run check: 213 tests, 211 passed, 2 environment-gated skipped, 0 failed",
          "Local unsigned macOS x64 package build 20260818175707: succeeded",
          "Packaged-host init-project and Runtime dry-run process-tree regression 2026-08-19: both exited 0; trusted ledger Node child observed; no Desktop entrypoint, GPU helper, or Renderer helper observed"
        ],
        "occurred_at": "2026-08-18T18:00:13.956Z"
      }
    }
  ],
  "content_revision": 2,
  "completion_review": {
    "status": "clean",
    "policy": {
      "initial_max_cycles": 3,
      "source": "$using-arckit user-invoked autonomous Case policy",
      "snapshotted_at": "2026-08-18T17:47:32.684Z"
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
          "git diff --check: clean on 2026-08-19",
          "runtime/arcorbit/src/runtime-process-environment.mjs",
          "runtime/arcorbit/src/ledger-scripts.mjs",
          "runtime/arcorbit/src/project-initializer.mjs",
          "runtime/arcorbit/src/desktop-run-manager.mjs",
          "runtime/arcorbit/test/runtime-process-environment.test.mjs",
          "Focused Node tests: 21 passed, 0 failed",
          "npm --prefix runtime/arcorbit run check: 213 tests, 211 passed, 2 environment-gated skipped, 0 failed",
          "Unsigned macOS x64 package build 20260818175707: succeeded",
          "Packaged-host init-project and Runtime dry-run process-tree regression 2026-08-19: both exited 0; no Desktop/GPU/Renderer descendants",
          "Post-regression process check 2026-08-19: no ArcOrbit process remained"
        ],
        "occurred_at": "2026-08-18T18:02:39.627Z"
      }
    ],
    "evidence": [
      "git diff --check: clean on 2026-08-19",
      "runtime/arcorbit/src/runtime-process-environment.mjs",
      "runtime/arcorbit/src/ledger-scripts.mjs",
      "runtime/arcorbit/src/project-initializer.mjs",
      "runtime/arcorbit/src/desktop-run-manager.mjs",
      "runtime/arcorbit/test/runtime-process-environment.test.mjs",
      "Focused Node tests: 21 passed, 0 failed",
      "npm --prefix runtime/arcorbit run check: 213 tests, 211 passed, 2 environment-gated skipped, 0 failed",
      "Unsigned macOS x64 package build 20260818175707: succeeded",
      "Packaged-host init-project and Runtime dry-run process-tree regression 2026-08-19: both exited 0; no Desktop/GPU/Renderer descendants",
      "Post-regression process check 2026-08-19: no ArcOrbit process remained"
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
      "goal": "Trace and reproduce the packaged todo-start process tree until the repeated Desktop-entry cause is proven.",
      "outcome": "completed",
      "gap_selection": {
        "mode": "candidate",
        "basis": "The diagnosis Gap directly blocks a safe repair for an execution-loop incident and outranks unrelated Project obligations.",
        "snapshot_token": "03513237813aadbb599a2bfa64e1c87c438ebda2834f517855d99871a0c80e6a",
        "selected_ref": "case-gap:CASE-20260818-006:GAP-DIAGNOSE-WINDOW-LAUNCH-LOOP",
        "comparison_summary": "Compared all four persisted Project gaps with the incident Case diagnosis; only the diagnosis was ready, incident-scoped, and immediately blocking user execution.",
        "fresh_discovery_summary": "No more important ready fresh candidate existed at round opening. Diagnosis exposed a downstream repair obligation, recorded as a blocked fresh candidate for the next post-closeout snapshot.",
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
            "reason": "Important validation work, but unrelated to the active window-launch incident."
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
            "reason": "Broad resilience work does not establish this incident root cause and has no registered Case."
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
            "reason": "Security validation is unrelated to repeated Desktop process creation."
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
            "reason": "Cross-record auditing is not the cause of Electron re-entry and requires a separate Case."
          },
          {
            "ref": "case-gap:CASE-20260818-006:GAP-DIAGNOSE-WINDOW-LAUNCH-LOOP",
            "source": "persisted",
            "eligibility": "ready",
            "disposition": "selected",
            "priority_basis": {
              "blocking": "high",
              "uncertainty": "high",
              "risk": "high",
              "user_impact": "high"
            },
            "reason": "Root-cause evidence is required before choosing the repair boundary."
          },
          {
            "ref": "fresh-gap:CASE-20260818-006:GAP-FIX-INTERNAL-NODE-SUBPROCESS-BOUNDARY",
            "source": "fresh",
            "eligibility": "blocked",
            "disposition": "deferred",
            "priority_basis": {
              "blocking": "high",
              "uncertainty": "low",
              "risk": "high",
              "user_impact": "high"
            },
            "reason": "The repair became well-defined only from the diagnosis fact established in this round and must wait for closeout/fresh-read."
          }
        ]
      },
      "selected_gap": {
        "id": "GAP-DIAGNOSE-WINDOW-LAUNCH-LOOP",
        "responsibility": "agent",
        "goal": "Establish the exact reproducible execution path and root cause that makes one todo execution repeatedly launch new ArcOrbit application windows.",
        "reason": "The safe repair boundary depends on whether the repeated windows originate from application instance handling, self-spawn configuration, retry/recovery orchestration, or another runtime boundary.",
        "derived_from": [
          "case_intent",
          "FACT-WINDOW-LOOP-REPORT"
        ],
        "blocked_by": [],
        "priority_basis": {
          "blocking": "high",
          "uncertainty": "high",
          "risk": "high",
          "user_impact": "high"
        },
        "evidence_required": [
          "A repeatable reproduction or deterministic test plus code-path/runtime evidence that fully matches the trigger, repeated-window behavior, state changes, location, and timing."
        ]
      },
      "planned_transition": {
        "goal": "Trace and reproduce the packaged todo-start process tree until the repeated Desktop-entry cause is proven.",
        "expected_state_change": "Replace the unknown-cause diagnosis Gap with an accepted exact root-cause fact and one causally downstream repair Gap."
      },
      "accepted_state_delta": {
        "resolved_gap": {
          "id": "GAP-DIAGNOSE-WINDOW-LAUNCH-LOOP",
          "status": "resolved",
          "outcome": "The repeated-window loop is traced to loss of Electron embedded-Node mode between Runtime bootstrap and trusted ledger child launches.",
          "reason": "Packaged-host reproduction showed the first Runtime child enter Node mode, then protocol-compatibility.mjs launched through the same Electron process.execPath after ELECTRON_RUN_AS_NODE had been deleted; that child created GPU/Renderer processes and resumed the same in-progress task, matching the observed recursive timing and run records.",
          "evidence": [
            "runtime/arcorbit/bin/arcorbit.mjs",
            "runtime/arcorbit/src/runtime-process-environment.mjs",
            "runtime/arcorbit/src/ledger-scripts.mjs",
            "runtime/arcorbit/src/state-store.mjs",
            "runtime/arcorbit/src/automation-coordinator.mjs",
            "arckit-runtime://runs/RUN-20260818-174446682Z",
            "arckit-runtime://runs/RUN-20260818-174449219Z",
            "arckit-runtime://runs/RUN-20260818-174452019Z"
          ]
        },
        "facts_added": [
          {
            "id": "FACT-INTERNAL-NODE-MODE-LOST",
            "revision": 1,
            "status": "accepted",
            "statement": "In packaged ArcOrbit, bin/arcorbit.mjs deletes ELECTRON_RUN_AS_NODE before createStateStore invokes runLedgerScript; runLedgerScript defaults to the Electron process.execPath with an empty nodeEnv, so its trusted protocol/ledger script launch enters Desktop mode, creates a new window, and the new instance resumes the same in-progress todo, recursively repeating the chain.",
            "basis": "Static call-chain analysis, existing incident Run records, and a controlled installed-package process-tree reproduction agree on the trigger, state transition, process identities, repeated timing, and UI symptom.",
            "evidence": [
              "runtime/arcorbit/bin/arcorbit.mjs",
              "runtime/arcorbit/src/runtime-process-environment.mjs",
              "runtime/arcorbit/src/ledger-scripts.mjs",
              "runtime/arcorbit/src/state-store.mjs",
              "runtime/arcorbit/src/automation-coordinator.mjs",
              "arckit-runtime://runs/RUN-20260818-174446682Z",
              "arckit-runtime://runs/RUN-20260818-174449219Z",
              "arckit-runtime://runs/RUN-20260818-174452019Z"
            ]
          }
        ],
        "facts_superseded": [],
        "impacts_added": [
          {
            "id": "IMPACT-TECH-INTERNAL-NODE-BOUNDARY",
            "fact_id": "FACT-INTERNAL-NODE-MODE-LOST",
            "fact_revision": 1,
            "target": {
              "kind": "software_decision",
              "ref": "technical_foundation",
              "revision": 18
            },
            "effect": "threatened",
            "reason": "The packaged Runtime does not preserve the accepted separation between Desktop hosting and trusted Node ledger execution.",
            "gap_ids": [
              "GAP-FIX-INTERNAL-NODE-SUBPROCESS-BOUNDARY"
            ],
            "evidence": [
              "runtime/arcorbit/bin/arcorbit.mjs",
              "runtime/arcorbit/src/runtime-process-environment.mjs",
              "runtime/arcorbit/src/ledger-scripts.mjs",
              "runtime/arcorbit/src/state-store.mjs",
              "runtime/arcorbit/src/automation-coordinator.mjs",
              "arckit-runtime://runs/RUN-20260818-174446682Z",
              "arckit-runtime://runs/RUN-20260818-174449219Z",
              "arckit-runtime://runs/RUN-20260818-174452019Z"
            ]
          },
          {
            "id": "IMPACT-REALIZATION-WINDOW-LOOP",
            "fact_id": "FACT-INTERNAL-NODE-MODE-LOST",
            "fact_revision": 1,
            "target": {
              "kind": "software_invariant",
              "ref": "accepted-facts-are-realized",
              "revision": null
            },
            "effect": "threatened",
            "reason": "One todo does not currently realize the accepted single supervised Runtime execution behavior in the packaged application.",
            "gap_ids": [
              "GAP-FIX-INTERNAL-NODE-SUBPROCESS-BOUNDARY"
            ],
            "evidence": [
              "runtime/arcorbit/bin/arcorbit.mjs",
              "runtime/arcorbit/src/runtime-process-environment.mjs",
              "runtime/arcorbit/src/ledger-scripts.mjs",
              "runtime/arcorbit/src/state-store.mjs",
              "runtime/arcorbit/src/automation-coordinator.mjs",
              "arckit-runtime://runs/RUN-20260818-174446682Z",
              "arckit-runtime://runs/RUN-20260818-174449219Z",
              "arckit-runtime://runs/RUN-20260818-174452019Z"
            ]
          },
          {
            "id": "IMPACT-RISK-WINDOW-LOOP",
            "fact_id": "FACT-INTERNAL-NODE-MODE-LOST",
            "fact_revision": 1,
            "target": {
              "kind": "software_invariant",
              "ref": "material-risks-have-credible-evidence",
              "revision": null
            },
            "effect": "threatened",
            "reason": "The child-process boundary lacks regression evidence preventing Electron Desktop re-entry.",
            "gap_ids": [
              "GAP-FIX-INTERNAL-NODE-SUBPROCESS-BOUNDARY"
            ],
            "evidence": [
              "runtime/arcorbit/bin/arcorbit.mjs",
              "runtime/arcorbit/src/runtime-process-environment.mjs",
              "runtime/arcorbit/src/ledger-scripts.mjs",
              "runtime/arcorbit/src/state-store.mjs",
              "runtime/arcorbit/src/automation-coordinator.mjs",
              "arckit-runtime://runs/RUN-20260818-174446682Z",
              "arckit-runtime://runs/RUN-20260818-174449219Z",
              "arckit-runtime://runs/RUN-20260818-174452019Z"
            ]
          }
        ],
        "impacts_updated": [],
        "gaps_added": [
          {
            "id": "GAP-FIX-INTERNAL-NODE-SUBPROCESS-BOUNDARY",
            "status": "open",
            "goal": "Make every Runtime-owned Node script launch retain an explicit Node-capable host/environment while keeping ELECTRON_RUN_AS_NODE out of Codex and other external child processes, so trusted ledger probes cannot enter ArcOrbit Desktop.",
            "reason": "The accepted root-cause evidence shows that the Runtime bootstrap globally removes ELECTRON_RUN_AS_NODE before runLedgerScript later reuses the Electron process.execPath with an empty nodeEnv.",
            "derived_from": [
              "FACT-WINDOW-LOOP-REPORT",
              "FACT-INTERNAL-NODE-MODE-LOST"
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
              "Regression coverage proving internal ledger scripts retain Node mode after Runtime bootstrap sanitization while Codex/external children do not inherit it.",
              "ArcOrbit automated checks and a packaged-host reproduction showing one todo start produces one Runtime without any new Desktop/GPU/Renderer process tree."
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
        "project_revision": 106,
        "judgments": [
          {
            "invariant_ref": "product-expectations-remain-recoverable",
            "disposition": "upheld",
            "reason": "The expected one-thread-per-todo supervised execution outcome remains explicit; the new fact exposes implementation non-realization rather than ambiguity in the product contract.",
            "fact_refs": [
              "FACT-INTERNAL-NODE-MODE-LOST"
            ],
            "evidence": [
              "arckit/spec/agentic-software-development/runtime-automation-workspace.md"
            ],
            "gap_refs": []
          },
          {
            "invariant_ref": "interaction-expectations-remain-recoverable",
            "disposition": "upheld",
            "reason": "The intended todo claim and continuous Automation interaction remains recoverable; the observed window multiplication is an implementation fault, not an accepted interaction change.",
            "fact_refs": [
              "FACT-INTERNAL-NODE-MODE-LOST"
            ],
            "evidence": [
              "arckit/interaction/automation-workspace/interaction.md"
            ],
            "gap_refs": []
          },
          {
            "invariant_ref": "visual-language-remains-consistent",
            "disposition": "not_relevant",
            "reason": "The root-cause fact concerns process hosting and lifecycle recursion; it neither establishes nor changes any visual-language or component-presentation rule.",
            "fact_refs": [],
            "evidence": [],
            "gap_refs": []
          },
          {
            "invariant_ref": "technical-decisions-remain-explainable",
            "disposition": "threatened",
            "reason": "The packaged child-process implementation violates the intended Desktop/Runtime/trusted-ledger host boundary and needs an explicit repair.",
            "fact_refs": [
              "FACT-INTERNAL-NODE-MODE-LOST"
            ],
            "evidence": [],
            "gap_refs": [
              "GAP-FIX-INTERNAL-NODE-SUBPROCESS-BOUNDARY"
            ]
          },
          {
            "invariant_ref": "accepted-facts-are-realized",
            "disposition": "threatened",
            "reason": "The actual packaged execution creates recursively resumed Desktop instances instead of one supervised Runtime for the todo.",
            "fact_refs": [
              "FACT-INTERNAL-NODE-MODE-LOST"
            ],
            "evidence": [],
            "gap_refs": [
              "GAP-FIX-INTERNAL-NODE-SUBPROCESS-BOUNDARY"
            ]
          },
          {
            "invariant_ref": "material-risks-have-credible-evidence",
            "disposition": "threatened",
            "reason": "The repeatable runaway-window risk is proven but not yet controlled by a fix and regression evidence.",
            "fact_refs": [
              "FACT-INTERNAL-NODE-MODE-LOST"
            ],
            "evidence": [],
            "gap_refs": [
              "GAP-FIX-INTERNAL-NODE-SUBPROCESS-BOUNDARY"
            ]
          }
        ]
      },
      "evidence": [
        "runtime/arcorbit/bin/arcorbit.mjs",
        "runtime/arcorbit/src/runtime-process-environment.mjs",
        "runtime/arcorbit/src/ledger-scripts.mjs",
        "runtime/arcorbit/src/state-store.mjs",
        "runtime/arcorbit/src/automation-coordinator.mjs",
        "arckit-runtime://runs/RUN-20260818-174446682Z",
        "arckit-runtime://runs/RUN-20260818-174449219Z",
        "arckit-runtime://runs/RUN-20260818-174452019Z"
      ],
      "runtime_result_ref": "arckit-runtime://runs/RUN-20260818-174446682Z",
      "occurred_at": "2026-08-18T17:55:11.139Z"
    },
    {
      "round": 2,
      "transition_schema_version": "arckit-case-transition/v8",
      "goal": "Centralize the Electron embedded-Node environment for Runtime-owned children, apply it at every internal launcher, and verify source and packaged-host behavior.",
      "outcome": "completed",
      "gap_selection": {
        "mode": "candidate",
        "basis": "The repair Gap is the only ready incident-scoped Case candidate and directly closes all three threatened impacts.",
        "snapshot_token": "f8a58096b19d2e0f795aa5bc7844e5057fccbae649263ab5fadf56f1887f6f7d",
        "selected_ref": "case-gap:CASE-20260818-006:GAP-FIX-INTERNAL-NODE-SUBPROCESS-BOUNDARY",
        "comparison_summary": "Compared all four persisted Project gaps with the ready repair; only the repair is registered to the active incident Case and can restore packaged todo execution.",
        "fresh_discovery_summary": "No additional fresh candidate was discovered; implementation and proportionate regression evidence fit the already accepted repair boundary.",
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
            "reason": "Unrelated scenario-evaluation work remains outside this incident Case."
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
            "reason": "The broad resilience backlog does not replace the exact ready child-process repair."
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
            "reason": "Security project validation is unrelated to this execution-host defect."
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
            "reason": "Cross-record auditing cannot restore the broken packaged Node child boundary."
          },
          {
            "ref": "case-gap:CASE-20260818-006:GAP-FIX-INTERNAL-NODE-SUBPROCESS-BOUNDARY",
            "source": "persisted",
            "eligibility": "ready",
            "disposition": "selected",
            "priority_basis": {
              "blocking": "high",
              "uncertainty": "low",
              "risk": "high",
              "user_impact": "high"
            },
            "reason": "It is the only ready Case Gap and its accepted root cause precisely defines the minimal fix."
          }
        ]
      },
      "selected_gap": {
        "id": "GAP-FIX-INTERNAL-NODE-SUBPROCESS-BOUNDARY",
        "responsibility": "agent",
        "goal": "Make every Runtime-owned Node script launch retain an explicit Node-capable host/environment while keeping ELECTRON_RUN_AS_NODE out of Codex and other external child processes, so trusted ledger probes cannot enter ArcOrbit Desktop.",
        "reason": "The accepted root-cause evidence shows that the Runtime bootstrap globally removes ELECTRON_RUN_AS_NODE before runLedgerScript later reuses the Electron process.execPath with an empty nodeEnv.",
        "derived_from": [
          "FACT-WINDOW-LOOP-REPORT",
          "FACT-INTERNAL-NODE-MODE-LOST"
        ],
        "blocked_by": [],
        "priority_basis": {
          "blocking": "high",
          "uncertainty": "low",
          "risk": "high",
          "user_impact": "high"
        },
        "evidence_required": [
          "Regression coverage proving internal ledger scripts retain Node mode after Runtime bootstrap sanitization while Codex/external children do not inherit it.",
          "ArcOrbit automated checks and a packaged-host reproduction showing one todo start produces one Runtime without any new Desktop/GPU/Renderer process tree."
        ]
      },
      "planned_transition": {
        "goal": "Centralize the Electron embedded-Node environment for Runtime-owned children, apply it at every internal launcher, and verify source and packaged-host behavior.",
        "expected_state_change": "Trusted ledger and Runtime-owned Node children stay in Node mode after bootstrap sanitization, while external children remain sanitized and the recursive Desktop launch path is eliminated."
      },
      "accepted_state_delta": {
        "resolved_gap": {
          "id": "GAP-FIX-INTERNAL-NODE-SUBPROCESS-BOUNDARY",
          "status": "resolved",
          "outcome": "Runtime-owned Node children now explicitly regain Electron embedded-Node mode without exposing the flag to Codex/external children, and packaged execution no longer enters Desktop recursively.",
          "reason": "The shared helper is used by every internal launcher; full tests pass and a newly built packaged app completed project initialization and a Runtime dry-run with trusted ledger child processes but no Desktop/GPU/Renderer descendants.",
          "evidence": [
            "runtime/arcorbit/src/runtime-process-environment.mjs",
            "runtime/arcorbit/src/ledger-scripts.mjs",
            "runtime/arcorbit/src/project-initializer.mjs",
            "runtime/arcorbit/src/desktop-run-manager.mjs",
            "runtime/arcorbit/test/runtime-process-environment.test.mjs",
            "npm --prefix runtime/arcorbit run check: 213 tests, 211 passed, 2 environment-gated skipped, 0 failed",
            "Local unsigned macOS x64 package build 20260818175707: succeeded",
            "Packaged-host init-project and Runtime dry-run process-tree regression 2026-08-19: both exited 0; trusted ledger Node child observed; no Desktop entrypoint, GPU helper, or Renderer helper observed"
          ]
        },
        "facts_added": [
          {
            "id": "FACT-INTERNAL-NODE-BOUNDARY-REPAIRED",
            "revision": 1,
            "status": "accepted",
            "statement": "ArcOrbit now centralizes runtimeNodeChildEnvironment: Electron-hosted Runtime-owned Node launches explicitly receive ELECTRON_RUN_AS_NODE=1, while bin/arcorbit.mjs still removes the flag from the Runtime process environment before Codex/external children are created.",
            "basis": "Source diff, focused regression tests, the full ArcOrbit check, an unsigned local package build, and packaged-host process-tree sampling all agree.",
            "evidence": [
              "runtime/arcorbit/src/runtime-process-environment.mjs",
              "runtime/arcorbit/src/ledger-scripts.mjs",
              "runtime/arcorbit/src/project-initializer.mjs",
              "runtime/arcorbit/src/desktop-run-manager.mjs",
              "runtime/arcorbit/test/runtime-process-environment.test.mjs",
              "npm --prefix runtime/arcorbit run check: 213 tests, 211 passed, 2 environment-gated skipped, 0 failed",
              "Local unsigned macOS x64 package build 20260818175707: succeeded",
              "Packaged-host init-project and Runtime dry-run process-tree regression 2026-08-19: both exited 0; trusted ledger Node child observed; no Desktop entrypoint, GPU helper, or Renderer helper observed"
            ]
          }
        ],
        "facts_superseded": [],
        "impacts_added": [],
        "impacts_updated": [
          {
            "id": "IMPACT-TECH-INTERNAL-NODE-BOUNDARY",
            "fact_id": "FACT-INTERNAL-NODE-MODE-LOST",
            "fact_revision": 1,
            "target": {
              "kind": "software_decision",
              "ref": "technical_foundation",
              "revision": 18
            },
            "effect": "upheld",
            "reason": "The Desktop/Runtime/trusted-ledger host boundary is restored by explicit internal Node child environment handling.",
            "gap_ids": [],
            "evidence": [
              "runtime/arcorbit/src/runtime-process-environment.mjs",
              "runtime/arcorbit/src/ledger-scripts.mjs",
              "runtime/arcorbit/src/project-initializer.mjs",
              "runtime/arcorbit/src/desktop-run-manager.mjs",
              "runtime/arcorbit/test/runtime-process-environment.test.mjs",
              "npm --prefix runtime/arcorbit run check: 213 tests, 211 passed, 2 environment-gated skipped, 0 failed",
              "Local unsigned macOS x64 package build 20260818175707: succeeded",
              "Packaged-host init-project and Runtime dry-run process-tree regression 2026-08-19: both exited 0; trusted ledger Node child observed; no Desktop entrypoint, GPU helper, or Renderer helper observed"
            ]
          },
          {
            "id": "IMPACT-REALIZATION-WINDOW-LOOP",
            "fact_id": "FACT-INTERNAL-NODE-MODE-LOST",
            "fact_revision": 1,
            "target": {
              "kind": "software_invariant",
              "ref": "accepted-facts-are-realized",
              "revision": null
            },
            "effect": "upheld",
            "reason": "A packaged Runtime and its trusted ledger children complete without creating a Desktop or graphics/renderer process subtree.",
            "gap_ids": [],
            "evidence": [
              "runtime/arcorbit/src/runtime-process-environment.mjs",
              "runtime/arcorbit/src/ledger-scripts.mjs",
              "runtime/arcorbit/src/project-initializer.mjs",
              "runtime/arcorbit/src/desktop-run-manager.mjs",
              "runtime/arcorbit/test/runtime-process-environment.test.mjs",
              "npm --prefix runtime/arcorbit run check: 213 tests, 211 passed, 2 environment-gated skipped, 0 failed",
              "Local unsigned macOS x64 package build 20260818175707: succeeded",
              "Packaged-host init-project and Runtime dry-run process-tree regression 2026-08-19: both exited 0; trusted ledger Node child observed; no Desktop entrypoint, GPU helper, or Renderer helper observed"
            ]
          },
          {
            "id": "IMPACT-RISK-WINDOW-LOOP",
            "fact_id": "FACT-INTERNAL-NODE-MODE-LOST",
            "fact_revision": 1,
            "target": {
              "kind": "software_invariant",
              "ref": "material-risks-have-credible-evidence",
              "revision": null
            },
            "effect": "upheld",
            "reason": "Focused, full-suite, package-build, and packaged process-tree evidence now control the runaway-window regression risk.",
            "gap_ids": [],
            "evidence": [
              "runtime/arcorbit/src/runtime-process-environment.mjs",
              "runtime/arcorbit/src/ledger-scripts.mjs",
              "runtime/arcorbit/src/project-initializer.mjs",
              "runtime/arcorbit/src/desktop-run-manager.mjs",
              "runtime/arcorbit/test/runtime-process-environment.test.mjs",
              "npm --prefix runtime/arcorbit run check: 213 tests, 211 passed, 2 environment-gated skipped, 0 failed",
              "Local unsigned macOS x64 package build 20260818175707: succeeded",
              "Packaged-host init-project and Runtime dry-run process-tree regression 2026-08-19: both exited 0; trusted ledger Node child observed; no Desktop entrypoint, GPU helper, or Renderer helper observed"
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
        "project_revision": 106,
        "judgments": [
          {
            "invariant_ref": "product-expectations-remain-recoverable",
            "disposition": "upheld",
            "reason": "The repair preserves the already documented single supervised execution product outcome without changing scope or acceptance meaning.",
            "fact_refs": [
              "FACT-INTERNAL-NODE-BOUNDARY-REPAIRED"
            ],
            "evidence": [
              "arckit/spec/agentic-software-development/runtime-automation-workspace.md"
            ],
            "gap_refs": []
          },
          {
            "invariant_ref": "interaction-expectations-remain-recoverable",
            "disposition": "upheld",
            "reason": "Todo execution now follows the existing Automation interaction without spawning additional Desktop windows or changing user-visible state semantics.",
            "fact_refs": [
              "FACT-INTERNAL-NODE-BOUNDARY-REPAIRED"
            ],
            "evidence": [
              "arckit/interaction/automation-workspace/interaction.md"
            ],
            "gap_refs": []
          },
          {
            "invariant_ref": "visual-language-remains-consistent",
            "disposition": "not_relevant",
            "reason": "The repair changes process environments and launch boundaries only; it does not establish or alter any durable visual rule.",
            "fact_refs": [],
            "evidence": [],
            "gap_refs": []
          },
          {
            "invariant_ref": "technical-decisions-remain-explainable",
            "disposition": "upheld",
            "reason": "The Runtime-owned Node versus external-child environment boundary is explicit in one helper and consumed consistently by all three internal launchers.",
            "fact_refs": [
              "FACT-INTERNAL-NODE-BOUNDARY-REPAIRED"
            ],
            "evidence": [
              "runtime/arcorbit/src/runtime-process-environment.mjs",
              "runtime/arcorbit/src/ledger-scripts.mjs",
              "runtime/arcorbit/src/project-initializer.mjs",
              "runtime/arcorbit/src/desktop-run-manager.mjs"
            ],
            "gap_refs": []
          },
          {
            "invariant_ref": "accepted-facts-are-realized",
            "disposition": "upheld",
            "reason": "Source and packaged-host evidence demonstrate trusted ledger execution without recursive Desktop entry.",
            "fact_refs": [
              "FACT-INTERNAL-NODE-BOUNDARY-REPAIRED"
            ],
            "evidence": [
              "runtime/arcorbit/test/runtime-process-environment.test.mjs",
              "Packaged-host init-project and Runtime dry-run process-tree regression 2026-08-19: no Desktop/GPU/Renderer process observed"
            ],
            "gap_refs": []
          },
          {
            "invariant_ref": "material-risks-have-credible-evidence",
            "disposition": "upheld",
            "reason": "The regression is covered at helper/launcher level, across the full suite, and in a real packaged Electron process tree.",
            "fact_refs": [
              "FACT-INTERNAL-NODE-BOUNDARY-REPAIRED"
            ],
            "evidence": [
              "runtime/arcorbit/test/runtime-process-environment.test.mjs",
              "npm --prefix runtime/arcorbit run check: 213 tests, 211 passed, 2 environment-gated skipped, 0 failed",
              "Packaged-host process-tree regression 2026-08-19: both probes exited 0 with no helper or Desktop entry"
            ],
            "gap_refs": []
          }
        ]
      },
      "evidence": [
        "runtime/arcorbit/src/runtime-process-environment.mjs",
        "runtime/arcorbit/src/ledger-scripts.mjs",
        "runtime/arcorbit/src/project-initializer.mjs",
        "runtime/arcorbit/src/desktop-run-manager.mjs",
        "runtime/arcorbit/test/runtime-process-environment.test.mjs",
        "npm --prefix runtime/arcorbit run check: 213 tests, 211 passed, 2 environment-gated skipped, 0 failed",
        "Local unsigned macOS x64 package build 20260818175707: succeeded",
        "Packaged-host init-project and Runtime dry-run process-tree regression 2026-08-19: both exited 0; trusted ledger Node child observed; no Desktop entrypoint, GPU helper, or Renderer helper observed"
      ],
      "runtime_result_ref": "",
      "occurred_at": "2026-08-18T18:00:13.956Z"
    },
    {
      "round": 3,
      "transition_schema_version": "arckit-case-transition/v8",
      "goal": "Perform the mandatory five-dimension completion review for the repaired repeated-window incident.",
      "outcome": "completed",
      "gap_selection": {
        "mode": "candidate",
        "basis": "The completion review is the only ready Case obligation after the causal diagnosis, minimal repair, and packaged-host regression all closed cleanly.",
        "snapshot_token": "6e117d3c6ec0219a4f4e799a9c5c92ab778802f22fabd97bf7046fd354220e15",
        "selected_ref": "case-gap:CASE-20260818-006:CASE-20260818-006:completion-review:1",
        "comparison_summary": "Compared the four unrelated Project gaps with the active Case completion review; only the review is ready, incident-scoped, and required before resolution.",
        "fresh_discovery_summary": "Fresh diff, process, focused-test, full-suite, package-build, and packaged-host evidence exposed no more important ordinary gap or review finding.",
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
            "reason": "This Project-level obligation belongs to a separate Case and does not outrank the active incident completion gate."
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
            "reason": "This Project-level obligation belongs to a separate Case and does not outrank the active incident completion gate."
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
            "reason": "This Project-level obligation belongs to a separate Case and does not outrank the active incident completion gate."
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
            "reason": "This Project-level obligation belongs to a separate Case and does not outrank the active incident completion gate."
          },
          {
            "ref": "case-gap:CASE-20260818-006:CASE-20260818-006:completion-review:1",
            "source": "persisted",
            "eligibility": "ready",
            "disposition": "selected",
            "priority_basis": {
              "blocking": "high",
              "uncertainty": "low",
              "risk": "high",
              "user_impact": "high"
            },
            "reason": "All ordinary incident gaps and state impacts are closed; semantic completion review is the only ready Case obligation."
          }
        ]
      },
      "selected_gap": {
        "id": "CASE-20260818-006:completion-review:1",
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
        "goal": "Perform the mandatory five-dimension completion review for the repaired repeated-window incident.",
        "expected_state_change": "Record a clean review against content revision 2 and resolve the Case without mutating its accepted implementation content."
      },
      "accepted_state_delta": {
        "facts_added": [],
        "facts_superseded": [],
        "impacts_added": [],
        "impacts_updated": [],
        "gaps_added": [],
        "gaps_cancelled": [],
        "resolved_gap": null,
        "resolved_open_questions": [],
        "completed_handoffs": [],
        "resolved_review_findings": [],
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
            "git diff --check: clean on 2026-08-19",
            "runtime/arcorbit/src/runtime-process-environment.mjs",
            "runtime/arcorbit/src/ledger-scripts.mjs",
            "runtime/arcorbit/src/project-initializer.mjs",
            "runtime/arcorbit/src/desktop-run-manager.mjs",
            "runtime/arcorbit/test/runtime-process-environment.test.mjs",
            "Focused Node tests: 21 passed, 0 failed",
            "npm --prefix runtime/arcorbit run check: 213 tests, 211 passed, 2 environment-gated skipped, 0 failed",
            "Unsigned macOS x64 package build 20260818175707: succeeded",
            "Packaged-host init-project and Runtime dry-run process-tree regression 2026-08-19: both exited 0; no Desktop/GPU/Renderer descendants",
            "Post-regression process check 2026-08-19: no ArcOrbit process remained"
          ]
        },
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
        "project_revision": 106,
        "judgments": [
          {
            "invariant_ref": "product-expectations-remain-recoverable",
            "disposition": "upheld",
            "reason": "The repair preserves the already documented single supervised execution product outcome without changing scope or acceptance meaning.",
            "fact_refs": [
              "FACT-INTERNAL-NODE-BOUNDARY-REPAIRED"
            ],
            "evidence": [
              "arckit/spec/agentic-software-development/runtime-automation-workspace.md"
            ],
            "gap_refs": []
          },
          {
            "invariant_ref": "interaction-expectations-remain-recoverable",
            "disposition": "upheld",
            "reason": "Todo execution now follows the existing Automation interaction without spawning additional Desktop windows or changing user-visible state semantics.",
            "fact_refs": [
              "FACT-INTERNAL-NODE-BOUNDARY-REPAIRED"
            ],
            "evidence": [
              "arckit/interaction/automation-workspace/interaction.md"
            ],
            "gap_refs": []
          },
          {
            "invariant_ref": "visual-language-remains-consistent",
            "disposition": "not_relevant",
            "reason": "The repair changes process environments and launch boundaries only; it does not establish or alter any durable visual rule.",
            "fact_refs": [],
            "evidence": [],
            "gap_refs": []
          },
          {
            "invariant_ref": "technical-decisions-remain-explainable",
            "disposition": "upheld",
            "reason": "The Runtime-owned Node versus external-child environment boundary is explicit in one helper and consumed consistently by all three internal launchers.",
            "fact_refs": [
              "FACT-INTERNAL-NODE-BOUNDARY-REPAIRED"
            ],
            "evidence": [
              "runtime/arcorbit/src/runtime-process-environment.mjs",
              "runtime/arcorbit/src/ledger-scripts.mjs",
              "runtime/arcorbit/src/project-initializer.mjs",
              "runtime/arcorbit/src/desktop-run-manager.mjs"
            ],
            "gap_refs": []
          },
          {
            "invariant_ref": "accepted-facts-are-realized",
            "disposition": "upheld",
            "reason": "Source and packaged-host evidence demonstrate trusted ledger execution without recursive Desktop entry.",
            "fact_refs": [
              "FACT-INTERNAL-NODE-BOUNDARY-REPAIRED"
            ],
            "evidence": [
              "runtime/arcorbit/test/runtime-process-environment.test.mjs",
              "Packaged-host init-project and Runtime dry-run process-tree regression 2026-08-19: no Desktop/GPU/Renderer process observed"
            ],
            "gap_refs": []
          },
          {
            "invariant_ref": "material-risks-have-credible-evidence",
            "disposition": "upheld",
            "reason": "The regression is covered at helper/launcher level, across the full suite, and in a real packaged Electron process tree.",
            "fact_refs": [
              "FACT-INTERNAL-NODE-BOUNDARY-REPAIRED"
            ],
            "evidence": [
              "runtime/arcorbit/test/runtime-process-environment.test.mjs",
              "npm --prefix runtime/arcorbit run check: 213 tests, 211 passed, 2 environment-gated skipped, 0 failed",
              "Packaged-host process-tree regression 2026-08-19: both probes exited 0 with no helper or Desktop entry"
            ],
            "gap_refs": []
          }
        ]
      },
      "evidence": [
        "git diff --check: clean on 2026-08-19",
        "runtime/arcorbit/src/runtime-process-environment.mjs",
        "runtime/arcorbit/src/ledger-scripts.mjs",
        "runtime/arcorbit/src/project-initializer.mjs",
        "runtime/arcorbit/src/desktop-run-manager.mjs",
        "runtime/arcorbit/test/runtime-process-environment.test.mjs",
        "Focused Node tests: 21 passed, 0 failed",
        "npm --prefix runtime/arcorbit run check: 213 tests, 211 passed, 2 environment-gated skipped, 0 failed",
        "Unsigned macOS x64 package build 20260818175707: succeeded",
        "Packaged-host init-project and Runtime dry-run process-tree regression 2026-08-19: both exited 0; no Desktop/GPU/Renderer descendants",
        "Post-regression process check 2026-08-19: no ArcOrbit process remained"
      ],
      "runtime_result_ref": "",
      "occurred_at": "2026-08-18T18:02:39.627Z"
    }
  ],
  "case_resolution": {
    "status": "resolved",
    "stage": "resolved",
    "satisfied": [
      "GAP-DIAGNOSE-WINDOW-LAUNCH-LOOP",
      "GAP-FIX-INTERNAL-NODE-SUBPROCESS-BOUNDARY"
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
    "updated_at": "2026-08-18T18:02:39.627Z"
  }
}
```

## Round Notes

- Case history is canonical in Structured Record.rounds; keep prose notes exceptional.
