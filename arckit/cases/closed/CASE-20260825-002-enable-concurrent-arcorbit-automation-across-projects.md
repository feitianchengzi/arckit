# Enable concurrent ArcOrbit automation across projects

Case: CASE-20260825-002
Status: closed
Artifact Type: mixed
Selected Gap: none
Updated: 2026-08-25T08:22:01.846Z

## User Intent

Upgrade ArcOrbit Automation so independent local project workspaces can execute concurrently while each workspace executes its todos and acceptance feedback serially.

## Structured Record

```json
{
  "schema_version": "development-case-record/v5",
  "id": "CASE-20260825-002",
  "title": "Enable concurrent ArcOrbit automation across projects",
  "status": "closed",
  "artifact_type": "mixed",
  "created_at": "2026-08-25T07:37:09.200Z",
  "updated_at": "2026-08-25T08:22:01.846Z",
  "user_intent": "Upgrade ArcOrbit Automation so independent local project workspaces can execute concurrently while each workspace executes its todos and acceptance feedback serially.",
  "expected_outcome": "ArcOrbit schedules at most one active Automation execution per canonical local workspace, can run multiple independent workspaces concurrently under a bounded global limit, isolates gate/recovery/control state per workspace, and safely restores all active lanes after restart.",
  "project_state_ref": "arckit/project/state.record.json",
  "current_round": {
    "goal": "",
    "selected_gap": null
  },
  "facts": [
    {
      "id": "FACT-MULTI-PROJECT-AUTOMATION-REQUEST",
      "revision": 1,
      "status": "accepted",
      "statement": "The operator explicitly requires ArcOrbit Automation to execute independent projects concurrently while keeping tasks within each project serial.",
      "basis": "Current operator input following a read-only feasibility investigation.",
      "evidence": [
        "Current operator input, 2026-08-25"
      ]
    },
    {
      "id": "FACT-GLOBAL-AUTOMATION-LEASE",
      "revision": 1,
      "status": "accepted",
      "statement": "ArcOrbit currently persists one global active_task and blocks dispatch when any active task, attention item, or global recovery exists, while Desktop Run Manager already supports multiple active child Runs and Work Sync already partitions task projections by project.",
      "basis": "Read-only inspection of the Automation Store, Coordinator, Run Manager, Work Sync, and accepted ArcOrbit technical contracts.",
      "evidence": [
        "runtime/arcorbit/src/desktop/desktop-store.mjs",
        "runtime/arcorbit/src/automation-coordinator.mjs",
        "runtime/arcorbit/src/desktop-run-manager.mjs",
        "runtime/arcorbit/src/work-sync-coordinator.mjs",
        "arckit/tech/arcorbit/solution.md",
        "arckit/tech/arcorbit/desktop-execution-solution.md",
        "arckit/tech/arcorbit/realtime-synchronization-solution.md"
      ]
    },
    {
      "id": "FACT-MULTI-PROJECT-EXECUTION-CONTRACT",
      "revision": 1,
      "status": "accepted",
      "statement": "ArcOrbit Automation partitions execution by canonical local workspace, runs at most one todo or acceptance-feedback item per workspace, admits at most three workspaces concurrently by default, isolates lane attention and recovery, targets controls by stable execution_id, and migrates the legacy singleton active_task into active_executions.",
      "basis": "Accepted product and technical contracts derived from the operator request and current implementation constraints.",
      "evidence": [
        "Current operator input, 2026-08-25",
        "arckit/spec/agentic-software-development/runtime-automation-workspace.md",
        "arckit/tech/arcorbit/solution.md",
        "arckit/tech/arcorbit/desktop-execution-solution.md",
        "arckit/tech/arcorbit/realtime-synchronization-solution.md"
      ]
    },
    {
      "id": "FACT-MULTI-PROJECT-INTERACTION",
      "revision": 1,
      "status": "accepted",
      "statement": "Automation presents a stable active-execution collection and global 3-lane capacity, keeps one explicitly selected execution for detail and controls, and communicates that attention, recovery, CLI handoff, and stop actions affect only that execution lane while healthy lanes continue.",
      "basis": "Accepted Automation interaction source and gray wireframe projection.",
      "evidence": [
        "arckit/interaction/automation-workspace/interaction.md",
        "arckit/interaction/automation-workspace/default.html",
        "arckit/interaction/automation-workspace/runtime-recovery.html",
        "arckit/interaction/_map/feature-matrix.md",
        "arckit/interaction/_map/RELATIONS.md"
      ]
    },
    {
      "id": "FACT-MULTI-PROJECT-AUTOMATION-IMPLEMENTED",
      "revision": 1,
      "status": "accepted",
      "statement": "ArcOrbit Automation now uses a bounded supervisor over canonical local-workspace lanes: each lane owns at most one todo or acceptance-feedback execution, up to three lanes run concurrently by default, lane-local attention and recovery preserve healthy-lane progress, legacy active_task state migrates into active_executions, and Desktop controls target stable execution_id values.",
      "basis": "Implemented Runtime, Store, Work Sync, Run identity, Desktop IPC/Renderer, migration, and repeatable regression evidence.",
      "evidence": [
        "runtime/arcorbit/src/automation-coordinator.mjs",
        "runtime/arcorbit/src/desktop/desktop-store.mjs",
        "runtime/arcorbit/src/work-sync-coordinator.mjs",
        "runtime/arcorbit/src/desktop-run-manager.mjs",
        "runtime/arcorbit/desktop/main.mjs",
        "runtime/arcorbit/desktop/preload.cjs",
        "runtime/arcorbit/desktop/renderer/renderer.js",
        "runtime/arcorbit/desktop/renderer/styles.css",
        "runtime/arcorbit/test/automation-coordinator.test.mjs",
        "runtime/arcorbit/test/desktop-store.test.mjs",
        "runtime/arcorbit/test/desktop-renderer.test.mjs",
        "runtime/arcorbit/test/work-sync-coordinator.test.mjs",
        "Focused Automation/Store/Renderer/Work Sync regression: 115 passed, 0 failed.",
        "ArcOrbit full test run: 396 passed, 9 environment-gated skips; its only sandbox-blocked Electron fixture passed through the approved Electron entrypoint.",
        "Electron experience-realization fixture: all 10 pages and control, keyboard, title, and layout assertions passed."
      ]
    }
  ],
  "state_impacts": [
    {
      "id": "IMPACT-MULTI-PROJECT-PRODUCT",
      "fact_id": "FACT-MULTI-PROJECT-AUTOMATION-REQUEST",
      "fact_revision": 1,
      "target": {
        "kind": "software_decision",
        "ref": "product_capabilities",
        "revision": 27
      },
      "effect": "upheld",
      "reason": "The product specification now defines bounded concurrent workspace lanes with serial work inside each lane.",
      "gap_ids": [],
      "evidence": [
        "Current operator input, 2026-08-25",
        "arckit/spec/agentic-software-development/runtime-automation-workspace.md",
        "arckit/tech/arcorbit/solution.md",
        "arckit/tech/arcorbit/desktop-execution-solution.md",
        "arckit/tech/arcorbit/realtime-synchronization-solution.md"
      ]
    },
    {
      "id": "IMPACT-MULTI-PROJECT-TECHNICAL",
      "fact_id": "FACT-GLOBAL-AUTOMATION-LEASE",
      "fact_revision": 1,
      "target": {
        "kind": "software_decision",
        "ref": "technical_foundation",
        "revision": 34
      },
      "effect": "upheld",
      "reason": "The technical sources now define lane arbitration, persisted active_executions, isolation, migration, and targeted control boundaries.",
      "gap_ids": [],
      "evidence": [
        "Current operator input, 2026-08-25",
        "arckit/spec/agentic-software-development/runtime-automation-workspace.md",
        "arckit/tech/arcorbit/solution.md",
        "arckit/tech/arcorbit/desktop-execution-solution.md",
        "arckit/tech/arcorbit/realtime-synchronization-solution.md"
      ]
    },
    {
      "id": "IMPACT-MULTI-PROJECT-OPERATIONS",
      "fact_id": "FACT-GLOBAL-AUTOMATION-LEASE",
      "fact_revision": 1,
      "target": {
        "kind": "software_decision",
        "ref": "observability_and_operation",
        "revision": 9
      },
      "effect": "upheld",
      "reason": "Operational sources now define an active-execution collection, lane-local recovery, and global capacity visibility.",
      "gap_ids": [],
      "evidence": [
        "Current operator input, 2026-08-25",
        "arckit/spec/agentic-software-development/runtime-automation-workspace.md",
        "arckit/tech/arcorbit/solution.md",
        "arckit/tech/arcorbit/desktop-execution-solution.md",
        "arckit/tech/arcorbit/realtime-synchronization-solution.md"
      ]
    },
    {
      "id": "IMPACT-MULTI-PROJECT-TECH-INVARIANT",
      "fact_id": "FACT-GLOBAL-AUTOMATION-LEASE",
      "fact_revision": 1,
      "target": {
        "kind": "software_invariant",
        "ref": "technical-decisions-remain-explainable",
        "revision": null
      },
      "effect": "upheld",
      "reason": "Partition key, capacity, failure scopes, migration, and control identity are durably explained.",
      "gap_ids": [],
      "evidence": [
        "Current operator input, 2026-08-25",
        "arckit/spec/agentic-software-development/runtime-automation-workspace.md",
        "arckit/tech/arcorbit/solution.md",
        "arckit/tech/arcorbit/desktop-execution-solution.md",
        "arckit/tech/arcorbit/realtime-synchronization-solution.md"
      ]
    },
    {
      "id": "IMPACT-MULTI-PROJECT-DATA-STATE",
      "fact_id": "FACT-MULTI-PROJECT-EXECUTION-CONTRACT",
      "fact_revision": 1,
      "target": {
        "kind": "software_decision",
        "ref": "data_and_state",
        "revision": 16
      },
      "effect": "upheld",
      "reason": "The durable state contract now replaces the singleton with a workspace-keyed active execution collection and defines compatibility migration.",
      "gap_ids": [],
      "evidence": [
        "Current operator input, 2026-08-25",
        "arckit/spec/agentic-software-development/runtime-automation-workspace.md",
        "arckit/tech/arcorbit/solution.md",
        "arckit/tech/arcorbit/desktop-execution-solution.md",
        "arckit/tech/arcorbit/realtime-synchronization-solution.md"
      ]
    },
    {
      "id": "IMPACT-MULTI-PROJECT-INTERACTION",
      "fact_id": "FACT-MULTI-PROJECT-EXECUTION-CONTRACT",
      "fact_revision": 1,
      "target": {
        "kind": "software_decision",
        "ref": "experience_and_interaction",
        "revision": 42
      },
      "effect": "upheld",
      "reason": "The stable interaction source and wireframes now define multi-execution selection, capacity, lane-local feedback, and targeted control semantics.",
      "gap_ids": [],
      "evidence": [
        "arckit/interaction/automation-workspace/interaction.md",
        "arckit/interaction/automation-workspace/default.html",
        "arckit/interaction/automation-workspace/runtime-recovery.html",
        "arckit/interaction/_map/feature-matrix.md",
        "arckit/interaction/_map/RELATIONS.md"
      ]
    },
    {
      "id": "IMPACT-MULTI-PROJECT-REALIZATION",
      "fact_id": "FACT-MULTI-PROJECT-EXECUTION-CONTRACT",
      "fact_revision": 1,
      "target": {
        "kind": "software_invariant",
        "ref": "accepted-facts-are-realized",
        "revision": null
      },
      "effect": "upheld",
      "reason": "The Store, supervisor, lane adapters, Desktop projection, and targeted controls now realize the accepted contract.",
      "gap_ids": [],
      "evidence": [
        "runtime/arcorbit/src/automation-coordinator.mjs",
        "runtime/arcorbit/src/desktop/desktop-store.mjs",
        "runtime/arcorbit/src/work-sync-coordinator.mjs",
        "runtime/arcorbit/src/desktop-run-manager.mjs",
        "runtime/arcorbit/desktop/main.mjs",
        "runtime/arcorbit/desktop/preload.cjs",
        "runtime/arcorbit/desktop/renderer/renderer.js",
        "runtime/arcorbit/desktop/renderer/styles.css",
        "runtime/arcorbit/test/automation-coordinator.test.mjs",
        "runtime/arcorbit/test/desktop-store.test.mjs",
        "runtime/arcorbit/test/desktop-renderer.test.mjs",
        "runtime/arcorbit/test/work-sync-coordinator.test.mjs",
        "Focused Automation/Store/Renderer/Work Sync regression: 115 passed, 0 failed.",
        "ArcOrbit full test run: 396 passed, 9 environment-gated skips; its only sandbox-blocked Electron fixture passed through the approved Electron entrypoint.",
        "Electron experience-realization fixture: all 10 pages and control, keyboard, title, and layout assertions passed."
      ]
    },
    {
      "id": "IMPACT-MULTI-PROJECT-RISK-EVIDENCE",
      "fact_id": "FACT-MULTI-PROJECT-EXECUTION-CONTRACT",
      "fact_revision": 1,
      "target": {
        "kind": "software_invariant",
        "ref": "material-risks-have-credible-evidence",
        "revision": null
      },
      "effect": "upheld",
      "reason": "Repeatable tests cover cap enforcement, serial lanes, targeted isolation, migration, renderer routing, and existing regression behavior.",
      "gap_ids": [],
      "evidence": [
        "runtime/arcorbit/src/automation-coordinator.mjs",
        "runtime/arcorbit/src/desktop/desktop-store.mjs",
        "runtime/arcorbit/src/work-sync-coordinator.mjs",
        "runtime/arcorbit/src/desktop-run-manager.mjs",
        "runtime/arcorbit/desktop/main.mjs",
        "runtime/arcorbit/desktop/preload.cjs",
        "runtime/arcorbit/desktop/renderer/renderer.js",
        "runtime/arcorbit/desktop/renderer/styles.css",
        "runtime/arcorbit/test/automation-coordinator.test.mjs",
        "runtime/arcorbit/test/desktop-store.test.mjs",
        "runtime/arcorbit/test/desktop-renderer.test.mjs",
        "runtime/arcorbit/test/work-sync-coordinator.test.mjs",
        "Focused Automation/Store/Renderer/Work Sync regression: 115 passed, 0 failed.",
        "ArcOrbit full test run: 396 passed, 9 environment-gated skips; its only sandbox-blocked Electron fixture passed through the approved Electron entrypoint.",
        "Electron experience-realization fixture: all 10 pages and control, keyboard, title, and layout assertions passed."
      ]
    }
  ],
  "gaps": [
    {
      "id": "GAP-ACCEPT-MULTI-PROJECT-EXECUTION-BOUNDARY",
      "status": "resolved",
      "goal": "Accept the durable product and technical execution boundary for concurrent Automation across independent local workspaces with strict serial execution inside each workspace.",
      "reason": "Store shape, scheduling, recovery, controls, UI projection, and validation all depend on the partition key, concurrency cap, and distinction between lane-scoped and global failures.",
      "derived_from": [
        "case_intent",
        "FACT-MULTI-PROJECT-AUTOMATION-REQUEST",
        "FACT-GLOBAL-AUTOMATION-LEASE"
      ],
      "blocked_by": [],
      "priority_basis": {
        "blocking": "high",
        "uncertainty": "medium",
        "risk": "high",
        "user_impact": "high"
      },
      "responsibility": "agent",
      "evidence_required": [
        "Durable product and technical documents define the serial partition key and bounded cross-workspace concurrency.",
        "The contract distinguishes lane-scoped attention/recovery from truly global failures.",
        "The contract defines persisted multi-lane execution, targeted controls, restart recovery, and compatibility migration from the legacy singleton state."
      ],
      "resolution": {
        "id": "GAP-ACCEPT-MULTI-PROJECT-EXECUTION-BOUNDARY",
        "status": "resolved",
        "outcome": "The stable contract now uses canonical local workspace lanes, a default global cap of three, lane-local serial arbitration and recovery, targeted execution controls, and singleton-state migration.",
        "reason": "Product and technical sources now provide a coherent recoverable boundary for implementation.",
        "evidence": [
          "Current operator input, 2026-08-25",
          "arckit/spec/agentic-software-development/runtime-automation-workspace.md",
          "arckit/tech/arcorbit/solution.md",
          "arckit/tech/arcorbit/desktop-execution-solution.md",
          "arckit/tech/arcorbit/realtime-synchronization-solution.md"
        ],
        "occurred_at": "2026-08-25T07:48:56.849Z"
      }
    },
    {
      "id": "GAP-DEFINE-MULTI-PROJECT-AUTOMATION-INTERACTION",
      "status": "resolved",
      "goal": "Define a recoverable Automation interaction that exposes multiple concurrent workspace executions and targets controls to one stable execution without confusing queue or intervention state.",
      "reason": "The accepted concurrency contract changes selection, status, intervention, and control semantics visible in the Automation workspace.",
      "derived_from": [
        "FACT-MULTI-PROJECT-EXECUTION-CONTRACT",
        "GAP-ACCEPT-MULTI-PROJECT-EXECUTION-BOUNDARY"
      ],
      "blocked_by": [],
      "priority_basis": {
        "blocking": "high",
        "uncertainty": "medium",
        "risk": "medium",
        "user_impact": "high"
      },
      "responsibility": "agent",
      "evidence_required": [
        "The Automation interaction source defines the active-execution collection, selected execution, lane-local state, capacity feedback, and targeted controls.",
        "The Automation wireframe demonstrates multiple active workspaces without changing the established three-column workspace structure."
      ],
      "resolution": {
        "id": "GAP-DEFINE-MULTI-PROJECT-AUTOMATION-INTERACTION",
        "status": "resolved",
        "outcome": "Automation now exposes active executions, capacity, selected execution identity, lane-local state, and targeted controls while preserving the established page structure.",
        "reason": "Interaction source, default wireframe, recovery projection, index, relations, and feature matrix agree.",
        "evidence": [
          "arckit/interaction/automation-workspace/interaction.md",
          "arckit/interaction/automation-workspace/default.html",
          "arckit/interaction/automation-workspace/runtime-recovery.html",
          "arckit/interaction/_map/feature-matrix.md",
          "arckit/interaction/_map/RELATIONS.md"
        ],
        "occurred_at": "2026-08-25T07:54:55.471Z"
      }
    },
    {
      "id": "GAP-IMPLEMENT-MULTI-PROJECT-AUTOMATION",
      "status": "resolved",
      "goal": "Realize bounded concurrent Automation across independent local workspaces with per-workspace serial dispatch, isolated lifecycle state, restart recovery, and targeted operator controls.",
      "reason": "The current Store and Coordinator still enforce one global active task and global dispatch blocking.",
      "derived_from": [
        "FACT-GLOBAL-AUTOMATION-LEASE",
        "FACT-MULTI-PROJECT-EXECUTION-CONTRACT"
      ],
      "blocked_by": [
        "GAP-DEFINE-MULTI-PROJECT-AUTOMATION-INTERACTION"
      ],
      "priority_basis": {
        "blocking": "high",
        "uncertainty": "high",
        "risk": "high",
        "user_impact": "high"
      },
      "responsibility": "agent",
      "evidence_required": [
        "Two independent workspaces can execute concurrently while a second item in either workspace remains serial.",
        "Attention, recovery, completion, cancellation, and restart affect only the targeted workspace lane unless a documented global boundary applies.",
        "Legacy singleton state migrates safely and stable execution identifiers prevent control or Run collisions.",
        "Focused and full ArcOrbit regression suites pass."
      ],
      "resolution": {
        "id": "GAP-IMPLEMENT-MULTI-PROJECT-AUTOMATION",
        "status": "resolved",
        "outcome": "ArcOrbit now supervises a workspace-keyed active execution collection, starts up to three independent lanes, keeps each lane serial, persists and migrates execution state, isolates lane recovery, and routes Desktop controls by execution_id.",
        "reason": "Implementation, focused regressions, the broader test run, and the approved Electron fixture agree with the accepted product, technical, and interaction contracts.",
        "evidence": [
          "runtime/arcorbit/src/automation-coordinator.mjs",
          "runtime/arcorbit/src/desktop/desktop-store.mjs",
          "runtime/arcorbit/src/work-sync-coordinator.mjs",
          "runtime/arcorbit/src/desktop-run-manager.mjs",
          "runtime/arcorbit/desktop/main.mjs",
          "runtime/arcorbit/desktop/preload.cjs",
          "runtime/arcorbit/desktop/renderer/renderer.js",
          "runtime/arcorbit/desktop/renderer/styles.css",
          "runtime/arcorbit/test/automation-coordinator.test.mjs",
          "runtime/arcorbit/test/desktop-store.test.mjs",
          "runtime/arcorbit/test/desktop-renderer.test.mjs",
          "runtime/arcorbit/test/work-sync-coordinator.test.mjs",
          "Focused Automation/Store/Renderer/Work Sync regression: 115 passed, 0 failed.",
          "ArcOrbit full test run: 396 passed, 9 environment-gated skips; its only sandbox-blocked Electron fixture passed through the approved Electron entrypoint.",
          "Electron experience-realization fixture: all 10 pages and control, keyboard, title, and layout assertions passed."
        ],
        "occurred_at": "2026-08-25T08:20:35.987Z"
      }
    }
  ],
  "content_revision": 3,
  "completion_review": {
    "status": "clean",
    "policy": {
      "initial_max_cycles": 3,
      "source": "using-arckit default autonomous completion review policy",
      "snapshotted_at": "2026-08-25T07:37:09.200Z"
    },
    "additional_cycles_authorized": 0,
    "cycle_count": 1,
    "reviewed_content_revision": 3,
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
        "content_revision": 3,
        "dimensions": {
          "implementation_correctness": "clean",
          "problem_resolution": "clean",
          "verification_credibility": "clean",
          "regression_risk": "clean",
          "minimality": "clean"
        },
        "finding_ids": [],
        "evidence": [
          "runtime/arcorbit/src/automation-coordinator.mjs",
          "runtime/arcorbit/src/desktop/desktop-store.mjs",
          "runtime/arcorbit/src/work-sync-coordinator.mjs",
          "runtime/arcorbit/src/desktop-run-manager.mjs",
          "runtime/arcorbit/desktop/main.mjs",
          "runtime/arcorbit/desktop/preload.cjs",
          "runtime/arcorbit/desktop/renderer/renderer.js",
          "runtime/arcorbit/desktop/renderer/styles.css",
          "runtime/arcorbit/test/automation-coordinator.test.mjs",
          "runtime/arcorbit/test/desktop-store.test.mjs",
          "runtime/arcorbit/test/desktop-renderer.test.mjs",
          "runtime/arcorbit/test/work-sync-coordinator.test.mjs",
          "Focused Automation/Store/Renderer/Work Sync regression after restart coverage: 116 passed, 0 failed.",
          "ArcOrbit broader test run: 396 passed, 9 environment-gated skips; the sandbox-blocked Electron fixture passed separately through the approved Electron entrypoint.",
          "git diff --check passed.",
          "Completion self-review found no correctness, resolution, verification, regression, or minimality finding."
        ],
        "occurred_at": "2026-08-25T08:22:01.846Z"
      }
    ],
    "evidence": [
      "runtime/arcorbit/src/automation-coordinator.mjs",
      "runtime/arcorbit/src/desktop/desktop-store.mjs",
      "runtime/arcorbit/src/work-sync-coordinator.mjs",
      "runtime/arcorbit/src/desktop-run-manager.mjs",
      "runtime/arcorbit/desktop/main.mjs",
      "runtime/arcorbit/desktop/preload.cjs",
      "runtime/arcorbit/desktop/renderer/renderer.js",
      "runtime/arcorbit/desktop/renderer/styles.css",
      "runtime/arcorbit/test/automation-coordinator.test.mjs",
      "runtime/arcorbit/test/desktop-store.test.mjs",
      "runtime/arcorbit/test/desktop-renderer.test.mjs",
      "runtime/arcorbit/test/work-sync-coordinator.test.mjs",
      "Focused Automation/Store/Renderer/Work Sync regression after restart coverage: 116 passed, 0 failed.",
      "ArcOrbit broader test run: 396 passed, 9 environment-gated skips; the sandbox-blocked Electron fixture passed separately through the approved Electron entrypoint.",
      "git diff --check passed.",
      "Completion self-review found no correctness, resolution, verification, regression, or minimality finding."
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
      "goal": "Accept the workspace-lane concurrency contract in stable product and technical sources.",
      "outcome": "completed",
      "gap_selection": {
        "mode": "candidate",
        "basis": "The Case execution-boundary gap is the prerequisite for interaction and implementation; unrelated Project gaps do not advance the operator request.",
        "snapshot_token": "156739bf49ae36dade823d3b132504565bb8cdf47eb80fc6aaeee468d85d5ae6",
        "selected_ref": "case-gap:CASE-20260825-002:GAP-ACCEPT-MULTI-PROJECT-EXECUTION-BOUNDARY",
        "comparison_summary": "Selected the ready Case boundary gap; deferred four unrelated Project gaps.",
        "fresh_discovery_summary": "No stronger fresh gap exists before the execution contract is accepted.",
        "considered": [
          {
            "ref": "project-gap:GAP-agent-scenario-evaluation",
            "source": "persisted",
            "eligibility": "case_required",
            "disposition": "deferred",
            "reason": "Project-wide scenario evaluation is unrelated to this feature boundary.",
            "priority_basis": {
              "blocking": "low",
              "user_impact": "low"
            }
          },
          {
            "ref": "project-gap:GAP-runtime-resilience-and-adapters",
            "source": "persisted",
            "eligibility": "case_required",
            "disposition": "deferred",
            "reason": "General Runtime resilience is broader than the requested Automation concurrency change.",
            "priority_basis": {
              "blocking": "low",
              "user_impact": "low"
            }
          },
          {
            "ref": "project-gap:GAP-security-real-project-validation",
            "source": "persisted",
            "eligibility": "case_required",
            "disposition": "deferred",
            "reason": "Security validation does not establish the scheduling partition.",
            "priority_basis": {
              "blocking": "low",
              "user_impact": "low"
            }
          },
          {
            "ref": "project-gap:GAP-cross-record-audit",
            "source": "persisted",
            "eligibility": "case_required",
            "disposition": "deferred",
            "reason": "Cross-record audit does not establish the scheduling partition.",
            "priority_basis": {
              "blocking": "low",
              "user_impact": "low"
            }
          },
          {
            "ref": "case-gap:CASE-20260825-002:GAP-ACCEPT-MULTI-PROJECT-EXECUTION-BOUNDARY",
            "source": "persisted",
            "eligibility": "ready",
            "disposition": "selected",
            "reason": "This ready gap directly blocks all downstream design and implementation.",
            "priority_basis": {
              "blocking": "high",
              "uncertainty": "medium",
              "risk": "high",
              "user_impact": "high"
            }
          }
        ]
      },
      "selected_gap": {
        "id": "GAP-ACCEPT-MULTI-PROJECT-EXECUTION-BOUNDARY",
        "responsibility": "agent",
        "goal": "Accept the durable product and technical execution boundary for concurrent Automation across independent local workspaces with strict serial execution inside each workspace.",
        "reason": "Store shape, scheduling, recovery, controls, UI projection, and validation all depend on the partition key, concurrency cap, and distinction between lane-scoped and global failures.",
        "derived_from": [
          "case_intent",
          "FACT-MULTI-PROJECT-AUTOMATION-REQUEST",
          "FACT-GLOBAL-AUTOMATION-LEASE"
        ],
        "blocked_by": [],
        "priority_basis": {
          "blocking": "high",
          "uncertainty": "medium",
          "risk": "high",
          "user_impact": "high"
        },
        "evidence_required": [
          "Durable product and technical documents define the serial partition key and bounded cross-workspace concurrency.",
          "The contract distinguishes lane-scoped attention/recovery from truly global failures.",
          "The contract defines persisted multi-lane execution, targeted controls, restart recovery, and compatibility migration from the legacy singleton state."
        ]
      },
      "planned_transition": {
        "goal": "Accept the workspace-lane concurrency contract in stable product and technical sources.",
        "expected_state_change": "The selected boundary gap resolves; interaction and implementation become explicit downstream obligations."
      },
      "accepted_state_delta": {
        "resolved_gap": {
          "id": "GAP-ACCEPT-MULTI-PROJECT-EXECUTION-BOUNDARY",
          "status": "resolved",
          "outcome": "The stable contract now uses canonical local workspace lanes, a default global cap of three, lane-local serial arbitration and recovery, targeted execution controls, and singleton-state migration.",
          "reason": "Product and technical sources now provide a coherent recoverable boundary for implementation.",
          "evidence": [
            "Current operator input, 2026-08-25",
            "arckit/spec/agentic-software-development/runtime-automation-workspace.md",
            "arckit/tech/arcorbit/solution.md",
            "arckit/tech/arcorbit/desktop-execution-solution.md",
            "arckit/tech/arcorbit/realtime-synchronization-solution.md"
          ]
        },
        "facts_added": [
          {
            "id": "FACT-MULTI-PROJECT-EXECUTION-CONTRACT",
            "revision": 1,
            "status": "accepted",
            "statement": "ArcOrbit Automation partitions execution by canonical local workspace, runs at most one todo or acceptance-feedback item per workspace, admits at most three workspaces concurrently by default, isolates lane attention and recovery, targets controls by stable execution_id, and migrates the legacy singleton active_task into active_executions.",
            "basis": "Accepted product and technical contracts derived from the operator request and current implementation constraints.",
            "evidence": [
              "Current operator input, 2026-08-25",
              "arckit/spec/agentic-software-development/runtime-automation-workspace.md",
              "arckit/tech/arcorbit/solution.md",
              "arckit/tech/arcorbit/desktop-execution-solution.md",
              "arckit/tech/arcorbit/realtime-synchronization-solution.md"
            ]
          }
        ],
        "facts_superseded": [],
        "impacts_added": [
          {
            "id": "IMPACT-MULTI-PROJECT-DATA-STATE",
            "fact_id": "FACT-MULTI-PROJECT-EXECUTION-CONTRACT",
            "fact_revision": 1,
            "target": {
              "kind": "software_decision",
              "ref": "data_and_state",
              "revision": 16
            },
            "effect": "upheld",
            "reason": "The durable state contract now replaces the singleton with a workspace-keyed active execution collection and defines compatibility migration.",
            "gap_ids": [],
            "evidence": [
              "Current operator input, 2026-08-25",
              "arckit/spec/agentic-software-development/runtime-automation-workspace.md",
              "arckit/tech/arcorbit/solution.md",
              "arckit/tech/arcorbit/desktop-execution-solution.md",
              "arckit/tech/arcorbit/realtime-synchronization-solution.md"
            ]
          },
          {
            "id": "IMPACT-MULTI-PROJECT-INTERACTION",
            "fact_id": "FACT-MULTI-PROJECT-EXECUTION-CONTRACT",
            "fact_revision": 1,
            "target": {
              "kind": "software_decision",
              "ref": "experience_and_interaction",
              "revision": 41
            },
            "effect": "threatened",
            "reason": "The existing Automation interaction still presents one current execution and does not define targeted multi-execution selection or capacity feedback.",
            "gap_ids": [
              "GAP-DEFINE-MULTI-PROJECT-AUTOMATION-INTERACTION"
            ],
            "evidence": []
          },
          {
            "id": "IMPACT-MULTI-PROJECT-REALIZATION",
            "fact_id": "FACT-MULTI-PROJECT-EXECUTION-CONTRACT",
            "fact_revision": 1,
            "target": {
              "kind": "software_invariant",
              "ref": "accepted-facts-are-realized",
              "revision": null
            },
            "effect": "threatened",
            "reason": "The current singleton Store and Coordinator do not yet realize the accepted multi-lane contract.",
            "gap_ids": [
              "GAP-IMPLEMENT-MULTI-PROJECT-AUTOMATION"
            ],
            "evidence": []
          },
          {
            "id": "IMPACT-MULTI-PROJECT-RISK-EVIDENCE",
            "fact_id": "FACT-MULTI-PROJECT-EXECUTION-CONTRACT",
            "fact_revision": 1,
            "target": {
              "kind": "software_invariant",
              "ref": "material-risks-have-credible-evidence",
              "revision": null
            },
            "effect": "threatened",
            "reason": "Concurrency, isolation, migration, restart, and control-routing risks still require repeatable implementation evidence.",
            "gap_ids": [
              "GAP-IMPLEMENT-MULTI-PROJECT-AUTOMATION"
            ],
            "evidence": []
          }
        ],
        "impacts_updated": [
          {
            "id": "IMPACT-MULTI-PROJECT-PRODUCT",
            "fact_id": "FACT-MULTI-PROJECT-AUTOMATION-REQUEST",
            "fact_revision": 1,
            "target": {
              "kind": "software_decision",
              "ref": "product_capabilities",
              "revision": 27
            },
            "effect": "upheld",
            "reason": "The product specification now defines bounded concurrent workspace lanes with serial work inside each lane.",
            "gap_ids": [],
            "evidence": [
              "Current operator input, 2026-08-25",
              "arckit/spec/agentic-software-development/runtime-automation-workspace.md",
              "arckit/tech/arcorbit/solution.md",
              "arckit/tech/arcorbit/desktop-execution-solution.md",
              "arckit/tech/arcorbit/realtime-synchronization-solution.md"
            ]
          },
          {
            "id": "IMPACT-MULTI-PROJECT-TECHNICAL",
            "fact_id": "FACT-GLOBAL-AUTOMATION-LEASE",
            "fact_revision": 1,
            "target": {
              "kind": "software_decision",
              "ref": "technical_foundation",
              "revision": 34
            },
            "effect": "upheld",
            "reason": "The technical sources now define lane arbitration, persisted active_executions, isolation, migration, and targeted control boundaries.",
            "gap_ids": [],
            "evidence": [
              "Current operator input, 2026-08-25",
              "arckit/spec/agentic-software-development/runtime-automation-workspace.md",
              "arckit/tech/arcorbit/solution.md",
              "arckit/tech/arcorbit/desktop-execution-solution.md",
              "arckit/tech/arcorbit/realtime-synchronization-solution.md"
            ]
          },
          {
            "id": "IMPACT-MULTI-PROJECT-OPERATIONS",
            "fact_id": "FACT-GLOBAL-AUTOMATION-LEASE",
            "fact_revision": 1,
            "target": {
              "kind": "software_decision",
              "ref": "observability_and_operation",
              "revision": 9
            },
            "effect": "upheld",
            "reason": "Operational sources now define an active-execution collection, lane-local recovery, and global capacity visibility.",
            "gap_ids": [],
            "evidence": [
              "Current operator input, 2026-08-25",
              "arckit/spec/agentic-software-development/runtime-automation-workspace.md",
              "arckit/tech/arcorbit/solution.md",
              "arckit/tech/arcorbit/desktop-execution-solution.md",
              "arckit/tech/arcorbit/realtime-synchronization-solution.md"
            ]
          },
          {
            "id": "IMPACT-MULTI-PROJECT-TECH-INVARIANT",
            "fact_id": "FACT-GLOBAL-AUTOMATION-LEASE",
            "fact_revision": 1,
            "target": {
              "kind": "software_invariant",
              "ref": "technical-decisions-remain-explainable",
              "revision": null
            },
            "effect": "upheld",
            "reason": "Partition key, capacity, failure scopes, migration, and control identity are durably explained.",
            "gap_ids": [],
            "evidence": [
              "Current operator input, 2026-08-25",
              "arckit/spec/agentic-software-development/runtime-automation-workspace.md",
              "arckit/tech/arcorbit/solution.md",
              "arckit/tech/arcorbit/desktop-execution-solution.md",
              "arckit/tech/arcorbit/realtime-synchronization-solution.md"
            ]
          }
        ],
        "gaps_added": [
          {
            "id": "GAP-DEFINE-MULTI-PROJECT-AUTOMATION-INTERACTION",
            "status": "open",
            "goal": "Define a recoverable Automation interaction that exposes multiple concurrent workspace executions and targets controls to one stable execution without confusing queue or intervention state.",
            "reason": "The accepted concurrency contract changes selection, status, intervention, and control semantics visible in the Automation workspace.",
            "derived_from": [
              "FACT-MULTI-PROJECT-EXECUTION-CONTRACT",
              "GAP-ACCEPT-MULTI-PROJECT-EXECUTION-BOUNDARY"
            ],
            "blocked_by": [],
            "priority_basis": {
              "blocking": "high",
              "uncertainty": "medium",
              "risk": "medium",
              "user_impact": "high"
            },
            "responsibility": "agent",
            "evidence_required": [
              "The Automation interaction source defines the active-execution collection, selected execution, lane-local state, capacity feedback, and targeted controls.",
              "The Automation wireframe demonstrates multiple active workspaces without changing the established three-column workspace structure."
            ],
            "resolution": null
          },
          {
            "id": "GAP-IMPLEMENT-MULTI-PROJECT-AUTOMATION",
            "status": "open",
            "goal": "Realize bounded concurrent Automation across independent local workspaces with per-workspace serial dispatch, isolated lifecycle state, restart recovery, and targeted operator controls.",
            "reason": "The current Store and Coordinator still enforce one global active task and global dispatch blocking.",
            "derived_from": [
              "FACT-GLOBAL-AUTOMATION-LEASE",
              "FACT-MULTI-PROJECT-EXECUTION-CONTRACT"
            ],
            "blocked_by": [
              "GAP-DEFINE-MULTI-PROJECT-AUTOMATION-INTERACTION"
            ],
            "priority_basis": {
              "blocking": "high",
              "uncertainty": "high",
              "risk": "high",
              "user_impact": "high"
            },
            "responsibility": "agent",
            "evidence_required": [
              "Two independent workspaces can execute concurrently while a second item in either workspace remains serial.",
              "Attention, recovery, completion, cancellation, and restart affect only the targeted workspace lane unless a documented global boundary applies.",
              "Legacy singleton state migrates safely and stable execution identifiers prevent control or Run collisions.",
              "Focused and full ArcOrbit regression suites pass."
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
        "software_definition_changes": [
          {
            "area_ref": "product_capabilities",
            "observed_revision": 26,
            "set_decision": {
              "status": "settled",
              "statement": "ArcOrbit 保留 Setup Readiness、受监督的一待办一 thread Automation、trusted ledger transition、介入/恢复、验收反馈、Workshop 平台组合、Work 日常管理与产品反馈能力。Personal / Chat 升级为绑定本地 Product Workspace 的真实 Codex 自由对话，支持持久会话、固定 thread、流式消息、工具与审批状态、停止、失败/重启恢复、重命名和安全删除；会话列表直接按 Product Workspace 分组，每个项目默认展示最近 10 个会话并提供项目历史入口，新对话在首条消息前显式显示并允许切换目标工作区；Chat 不创建或转换 Idea、Work、Task、Case、ledger 或 Automation Run。Idea、Release、Operations 和 Engineering 继续作为 planning-only 工作空间。Work 是 Workshop 待办同步和本地 Task Projection 的唯一客户端所有者，独立负责 realtime、REST 对账与 mutation；Automation human Gate、Feedback、Organization、Domain Profile 和分发边界保持不变，Automation 只消费 Work 发布的本地待办状态。Work 使用弹出式多维筛选与单行无按钮列表，完整动作归于 Inspector；评论图片随时间线默认加载，点击后进入具备缩放、适配、实际大小、旋转、平移、重置和另存为的独立窗口。Feedback 使用不会随结果数量拉伸的单行列表，详情在独立内部区域滚动；反馈原文与沟通图片默认加载、支持局部失败重试，并与 Work 共用具备缩放、适配、实际大小、旋转、平移、重置和另存为的受控独立图片窗口；Feedback 默认逐项目探测 Workshop 双向会话能力，真实不可用时回退 V1。Automation 人工介入的消息列表直接复用 Chat Conversation Surface；Automation 的 gap/round、ledger、证据、恢复和执行控制能力保持完整并归入左右面板，执行总览提供完整墙钟时间、累计 gap 轮数及逐 gap 的目标、工作和结果。Workshop Task 只保存一个完整 `content`；ArcOrbit 在所有标题场景统一生成最多 64 个 Unicode grapheme clusters、超限以 `…` 结束的单行展示标题，详情只展示一次保留换行的完整正文。 Work 七状态、搜索、筛选、日期和分页只查询本地 Task Projection，点击这些观察条件不会请求服务器或触发后台刷新。 Automation 以规范化本地 Product Workspace 为串行 lane：每条 lane 同时至多一个 todo 或验收反馈，默认全局最多三条 lane 并行；不同远端项目若绑定同一本地工作区仍共享一条 lane。",
              "reason": "接受多项目并行、项目内串行的 Automation 产品边界。",
              "evidence": [
                "Current operator input, 2026-08-24",
                "arckit/spec/agentic-software-development/arcorbit-platform-capabilities.md",
                "arckit/spec/agentic-software-development/arcorbit-work-management.md",
                "arckit/spec/agentic-software-development/runtime-automation-workspace.md",
                "runtime/arcorbit/desktop/renderer/renderer.js",
                "runtime/arcorbit/src/work-task-image-viewer.mjs",
                "Current operator input, 2026-08-25",
                "arckit/interaction/task-browser/interaction.md",
                "arckit/interaction/task-browser/daily-work.html",
                "arckit/interaction/automation-workspace/interaction.md",
                "arckit/interaction/automation-workspace/default.html",
                "arckit/tech/arcorbit/solution.md",
                "arckit/tech/arcorbit/desktop-execution-solution.md",
                "arckit/tech/arcorbit/realtime-synchronization-solution.md"
              ],
              "confidence": "high",
              "resume_condition": "当 Work/Automation 职责、Task Projection 可见范围、页面查询行为或 Workshop 同步入口变化时重审。 当 Automation 并发 lane 的分区键、上限、隔离或恢复语义变化时也需重审。",
              "revision": 26
            },
            "gap_refs": [
              "GAP-agent-scenario-evaluation"
            ],
            "reason": "接受多项目并行、项目内串行的 Automation 产品边界。",
            "evidence": [
              "Current operator input, 2026-08-25",
              "arckit/spec/agentic-software-development/runtime-automation-workspace.md",
              "arckit/tech/arcorbit/solution.md",
              "arckit/tech/arcorbit/desktop-execution-solution.md",
              "arckit/tech/arcorbit/realtime-synchronization-solution.md"
            ]
          },
          {
            "area_ref": "data_and_state",
            "observed_revision": 15,
            "set_decision": {
              "status": "settled",
              "statement": "Canonical development state 继续位于 Project/Iteration/Case ledger，Workshop 继续拥有账户、组织、项目、成员、任务、附件和普通反馈真相；ArcOrbit 继续拥有 Product Workspace 绑定、Workset、Work Sync 的登录代际/项目分区 Task Projection、realtime cursor、Runtime execution/session/thread、介入恢复、验收反馈和 bundled-skill control-plane state；Automation 只拥有执行控制状态，不保存独立远端任务快照。ArcOrbit 还拥有本地 Chat session、消息、Composer 草稿、选中状态、Product Workspace/规范化项目根归属、Codex thread binding、turn/item 引用和最近运行/恢复状态。Chat 数据不写入 Workshop 或 ledger，不与 Automation task session 合并。删除会话仅移除 ArcOrbit 本地记录和恢复能力，不声明擦除 Codex 可能保留的底层 thread；活动删除必须先完成 interrupt，任一步失败均不得部分删除。 Automation 活动状态由单一 active_task 升级为按规范化本地工作区键控的 active_executions；每项拥有稳定 execution_id，旧单例状态在读取时安全迁移。",
              "reason": "接受多 lane 执行状态、稳定身份和兼容迁移模型。",
              "evidence": [
                "arckit/spec/agentic-software-development/arcorbit-planned-workspaces.md",
                "arckit/tech/arcorbit/desktop-execution-solution.md",
                "Current operator input, 2026-08-25",
                "arckit/tech/arcorbit/realtime-synchronization-solution.md",
                "arckit/tech/arcorbit/platform-composition-solution.md",
                "arckit/tech/arcorbit/solution.md",
                "arckit/spec/agentic-software-development/runtime-automation-workspace.md"
              ],
              "confidence": "high",
              "resume_condition": "当 Task Projection 跨设备同步、身份代际、持久化模型或 Automation 状态所有权变化时重审。 当 Automation 并发 lane 的分区键、上限、隔离或恢复语义变化时也需重审。",
              "revision": 15
            },
            "gap_refs": [
              "GAP-cross-record-audit"
            ],
            "reason": "接受多 lane 执行状态、稳定身份和兼容迁移模型。",
            "evidence": [
              "Current operator input, 2026-08-25",
              "arckit/spec/agentic-software-development/runtime-automation-workspace.md",
              "arckit/tech/arcorbit/solution.md",
              "arckit/tech/arcorbit/desktop-execution-solution.md",
              "arckit/tech/arcorbit/realtime-synchronization-solution.md"
            ]
          },
          {
            "area_ref": "technical_foundation",
            "observed_revision": 33,
            "set_decision": {
              "status": "settled",
              "statement": "Arckit 继续使用 repository-owned Markdown/JSON state 与 Node.js ESM ledger CLI；ArcOrbit 继续作为 Electron Desktop/Runtime host，并保留 policy-neutral Runtime Kernel、persistent one-thread-per-todo、Platform Coordinator、restricted Workshop adapters、utilityProcess Runtime、trusted in-process ledger entrypoints、project-only skill provisioning、Feedback SDK WebContents 和现代/旧版 realtime 协议边界。真实 Chat 的 accepted architecture 在 main process 增加独立 ChatCoordinator 和 kind=chat Store ownership，并从现有 Codex adapter 中抽取可复用 Conversation 层：app-server client、persistent thread start/resume、turn start/interrupt、通用事件 projector、token usage 和异步 approval provider。State-driven Runtime 只在该基础层之上保留 using-arckit、Agent Loop schema、fresh ledger snapshot、Gap Loop、Automation lease 和 closeout 语义，Chat 不复用这些语义。每个活动 Chat session 拥有与其固定项目根对应的 adapter owner；不同 Chat session 和 Automation owner 不共享活动 turn 或 lease。typed Chat IPC 只提供 snapshot/create/select/rename/delete/send/interrupt/approvalDecision；select 只持久化经 main process 验证的 Chat session 选择，不改变 draft、thread 或 session updated_at。Renderer 不能提供任意 cwd、thread id、Codex method、文件权限或 shell command。Chat 与 Automation Renderer 共享单一 Conversation Surface 模块和 scroll-follow/event-binding 行为，消费者仅提供规范化消息、Composer policy 与回调；Automation 专属类型由左右面板消费。Run Activity 以结构化 gap_rounds 持久化 round selection/closeout/work summary，任务级执行总览跨 transcript Runs 聚合，不解析被截断的消息文本。ArcOrbit Automation Agent 只输出绑定 fresh snapshot 的 Semantic Case Command；Agent 显式决定事实、Gap、影响、Project decision 与 invariant judgment 的业务语义，trusted Ledger Command Materializer 在 commit lock 内确定性分配身份与 revision、解析 local handle、展开反向关系、编译内部 Transition、完整校验 projected state 并原子提交，Runtime 不复制物化规则。Workshop 继续拥有服务端任务事实；Electron main-process Work Sync 是 Workshop 待办同步的唯一客户端所有者，独占 WebSocket、事件游标、REST 对账、受控 mutation 和按登录代际分区的持久 Task Projection Store。Work 页面全部状态、搜索、筛选、日期和分页从本地投影派生，状态切换不发起远端请求；Renderer 使用分页或虚拟化与事件委托约束大列表同步 DOM 成本。Automation 不拥有 Workshop Task Source、Realtime Adapter、REST 或远端确认，只订阅 Work 发布的本地待办状态变化，并把领取、阻塞、完成、取消和验收动作提交给 Work；Work 只在服务器同步成功后更新本地投影。Workshop Task 的唯一文本事实是完整 `content`；ArcOrbit 在共享归一化边界生成最多 64 个 Unicode extended grapheme clusters 的 `display_title`，超限取前 63 个并追加 `…`。该值只服务 Work/Automation/session/Activity/CLI 展示，可保存历史只读快照但不参与搜索、Agent intent、mutation 或服务端写回。 Automation Coordinator 使用有界 workspace-lane arbiter：lane 内 todo 与验收反馈严格串行，lane 间默认最多三路并发；注意、恢复与控制按 lane/execution_id 隔离，仅认证、目录、Store、Runtime host 和退出属于全局冻结边界。",
              "reason": "接受多项目并行所需的调度、隔离和全局边界。",
              "evidence": [
                "runtime/arcorbit/desktop/renderer/renderer.js:653-735,1165-1187",
                "runtime/arcorbit/src/platform-coordinator.mjs:61-174",
                "runtime/arcorbit/src/workshop-platform-adapter.mjs:85-100",
                "Controlled Electron latency and scale measurements, 2026-08-24",
                "arckit/tech/arcorbit/platform-composition-solution.md",
                "arckit/spec/agentic-software-development/arcorbit-work-management.md",
                "Current operator input, 2026-08-25",
                "arckit/tech/arcorbit/realtime-synchronization-solution.md",
                "arckit/tech/arcorbit/solution.md",
                "arckit/tech/arcorbit/desktop-execution-solution.md",
                "arckit/spec/agentic-software-development/runtime-automation-workspace.md"
              ],
              "confidence": "high",
              "resume_condition": "当 Work Sync 投影边界、订阅范围、Task Source/mutation 所有权或 Automation 本地状态接口变化时重审。 当 Automation 并发 lane 的分区键、上限、隔离或恢复语义变化时也需重审。",
              "revision": 33
            },
            "gap_refs": [
              "GAP-runtime-resilience-and-adapters"
            ],
            "reason": "接受多项目并行所需的调度、隔离和全局边界。",
            "evidence": [
              "Current operator input, 2026-08-25",
              "arckit/spec/agentic-software-development/runtime-automation-workspace.md",
              "arckit/tech/arcorbit/solution.md",
              "arckit/tech/arcorbit/desktop-execution-solution.md",
              "arckit/tech/arcorbit/realtime-synchronization-solution.md"
            ]
          },
          {
            "area_ref": "observability_and_operation",
            "observed_revision": 8,
            "set_decision": {
              "status": "settled",
              "statement": "Runtime persists lifecycle, activity, messages and timing outside the target project, supports restart reconciliation and exposes opaque Run refs. It separately projects ledger candidate catalogs, Agent selection traces, accepted round closeouts and post-commit fresh-read receipts, and also presents ordinary todo state separately from acceptance-feedback queue counts, item status, current Run/Case, progress, evidence and blocking responsibility alongside one active execution. Work Sync exposes per-project realtime health, resumable/legacy mode, modern cursor progress, local projection revision and latest refresh time; it reports reconnecting, degraded, compatible and recovered transitions. Work Sync owns 15-minute reconciliation, lifecycle-triggered current-state recovery and the visible immediate-sync action, has no 60-second disconnected fallback, and records that synchronization never releases a human gate. Automation only references the local task-state and minimal sync-health projections needed for execution recovery. Automation 投影 active_executions 集合、全局占用/上限及每条 lane 的 Run、Gate、恢复和同步摘要；重启逐 lane 对账，暂停、继续、取消和介入均以 execution_id 定向。",
              "reason": "接受多 lane 可观测性、恢复和定向运维控制。",
              "evidence": [
                "runtime/arckit-runtime/src/state-driven-runner.mjs",
                "runtime/arckit-runtime/src/projection/run-event-projector.mjs",
                "runtime/arckit-runtime/src/desktop/transcript-presentation.mjs",
                "arckit/interaction/automation-workspace/interaction.md",
                "arckit/tech/arckit-runtime/desktop-execution-solution.md",
                "Current operator input, 2026-08-22",
                "arckit/spec/agentic-software-development/runtime-automation-workspace.md",
                "arckit/tech/arcorbit/realtime-synchronization-solution.md",
                "arckit/interaction/automation-workspace/default.html",
                "runtime/arcorbit/src/workshop-realtime-adapter.mjs",
                "runtime/arcorbit/desktop/main.mjs",
                "runtime/arcorbit/desktop/renderer/index.html",
                "runtime/arcorbit/desktop/renderer/renderer.js",
                "runtime/arcorbit/src/automation-coordinator.mjs",
                "runtime/arcorbit/src/desktop/desktop-store.mjs",
                "runtime/arcorbit/test/workshop-realtime-adapter.test.mjs",
                "runtime/arcorbit/test/automation-coordinator.test.mjs",
                "runtime/arcorbit/test/desktop-renderer.test.mjs",
                "Verification: npm run check — 250 tests, 248 passed, 2 environment-gated skips, 0 failed, 2026-08-22",
                "Verification: local macOS x64 installer build and arckit-distribution-smoke/v1 passed, build 20260822083310",
                "Current operator input, 2026-08-25",
                "arckit/tech/arcorbit/platform-composition-solution.md",
                "arckit/tech/arcorbit/solution.md",
                "arckit/tech/arcorbit/desktop-execution-solution.md"
              ],
              "confidence": "high",
              "resume_condition": "当 Work Sync 同步节奏、健康投影、恢复入口或 human Gate 隔离变化时重审。 当 Automation 并发 lane 的分区键、上限、隔离或恢复语义变化时也需重审。",
              "revision": 8
            },
            "gap_refs": [
              "GAP-runtime-resilience-and-adapters"
            ],
            "reason": "接受多 lane 可观测性、恢复和定向运维控制。",
            "evidence": [
              "Current operator input, 2026-08-25",
              "arckit/spec/agentic-software-development/runtime-automation-workspace.md",
              "arckit/tech/arcorbit/solution.md",
              "arckit/tech/arcorbit/desktop-execution-solution.md",
              "arckit/tech/arcorbit/realtime-synchronization-solution.md"
            ]
          }
        ],
        "software_invariant_changes": [],
        "project_gap_changes": [],
        "selection_context_change": null,
        "evidence": [
          "Current operator input, 2026-08-25",
          "arckit/spec/agentic-software-development/runtime-automation-workspace.md",
          "arckit/tech/arcorbit/solution.md",
          "arckit/tech/arcorbit/desktop-execution-solution.md",
          "arckit/tech/arcorbit/realtime-synchronization-solution.md"
        ]
      },
      "invariant_assessment": {
        "project_revision": 233,
        "judgments": [
          {
            "invariant_ref": "product-expectations-remain-recoverable",
            "disposition": "upheld",
            "reason": "Product expectations now define the lane key, serial behavior, capacity, and recovery boundaries.",
            "fact_refs": [
              "FACT-MULTI-PROJECT-AUTOMATION-REQUEST",
              "FACT-MULTI-PROJECT-EXECUTION-CONTRACT"
            ],
            "evidence": [
              "Current operator input, 2026-08-25",
              "arckit/spec/agentic-software-development/runtime-automation-workspace.md",
              "arckit/tech/arcorbit/solution.md",
              "arckit/tech/arcorbit/desktop-execution-solution.md",
              "arckit/tech/arcorbit/realtime-synchronization-solution.md"
            ],
            "gap_refs": []
          },
          {
            "invariant_ref": "interaction-expectations-remain-recoverable",
            "disposition": "threatened",
            "reason": "The interaction source still needs multi-execution selection and targeted-control semantics.",
            "fact_refs": [
              "FACT-MULTI-PROJECT-EXECUTION-CONTRACT"
            ],
            "evidence": [],
            "gap_refs": [
              "GAP-DEFINE-MULTI-PROJECT-AUTOMATION-INTERACTION"
            ]
          },
          {
            "invariant_ref": "visual-language-remains-consistent",
            "disposition": "not_relevant",
            "reason": "This round accepts scheduling and state semantics without changing visual-language rules.",
            "fact_refs": [
              "FACT-MULTI-PROJECT-EXECUTION-CONTRACT"
            ],
            "evidence": [],
            "gap_refs": []
          },
          {
            "invariant_ref": "technical-decisions-remain-explainable",
            "disposition": "upheld",
            "reason": "Technical sources explain the arbiter, isolation, state shape, migration, recovery, and controls.",
            "fact_refs": [
              "FACT-GLOBAL-AUTOMATION-LEASE",
              "FACT-MULTI-PROJECT-EXECUTION-CONTRACT"
            ],
            "evidence": [
              "Current operator input, 2026-08-25",
              "arckit/spec/agentic-software-development/runtime-automation-workspace.md",
              "arckit/tech/arcorbit/solution.md",
              "arckit/tech/arcorbit/desktop-execution-solution.md",
              "arckit/tech/arcorbit/realtime-synchronization-solution.md"
            ],
            "gap_refs": []
          },
          {
            "invariant_ref": "accepted-facts-are-realized",
            "disposition": "threatened",
            "reason": "Runtime code still implements a singleton active task.",
            "fact_refs": [
              "FACT-GLOBAL-AUTOMATION-LEASE",
              "FACT-MULTI-PROJECT-EXECUTION-CONTRACT"
            ],
            "evidence": [],
            "gap_refs": [
              "GAP-IMPLEMENT-MULTI-PROJECT-AUTOMATION"
            ]
          },
          {
            "invariant_ref": "material-risks-have-credible-evidence",
            "disposition": "threatened",
            "reason": "Concurrency and isolation risks require focused and full regression evidence.",
            "fact_refs": [
              "FACT-MULTI-PROJECT-EXECUTION-CONTRACT"
            ],
            "evidence": [],
            "gap_refs": [
              "GAP-IMPLEMENT-MULTI-PROJECT-AUTOMATION"
            ]
          }
        ]
      },
      "evidence": [
        "Current operator input, 2026-08-25",
        "arckit/spec/agentic-software-development/runtime-automation-workspace.md",
        "arckit/tech/arcorbit/solution.md",
        "arckit/tech/arcorbit/desktop-execution-solution.md",
        "arckit/tech/arcorbit/realtime-synchronization-solution.md"
      ],
      "runtime_result_ref": "",
      "occurred_at": "2026-08-25T07:48:56.849Z"
    },
    {
      "round": 2,
      "transition_schema_version": "arckit-case-transition/v8",
      "goal": "Accept the multi-execution Automation interaction source and wireframe projection.",
      "outcome": "completed",
      "gap_selection": {
        "mode": "candidate",
        "basis": "The ready interaction gap is the final prerequisite for implementation.",
        "snapshot_token": "36a526a9db1c4bad08972847d79b807aff5163dc6ea56b792095359b6dc8cb40",
        "selected_ref": "case-gap:CASE-20260825-002:GAP-DEFINE-MULTI-PROJECT-AUTOMATION-INTERACTION",
        "comparison_summary": "Selected the only ready Case gap and deferred four unrelated Project gaps.",
        "fresh_discovery_summary": "No stronger fresh gap exists; the implementation gap becomes ready when this transition resolves.",
        "considered": [
          {
            "ref": "project-gap:GAP-agent-scenario-evaluation",
            "source": "persisted",
            "eligibility": "case_required",
            "disposition": "deferred",
            "reason": "Deferred because it is unrelated to this Case interaction boundary.",
            "priority_basis": {
              "blocking": "low",
              "user_impact": "low"
            }
          },
          {
            "ref": "project-gap:GAP-runtime-resilience-and-adapters",
            "source": "persisted",
            "eligibility": "case_required",
            "disposition": "deferred",
            "reason": "Deferred because it is broader than this page interaction.",
            "priority_basis": {
              "blocking": "low",
              "user_impact": "low"
            }
          },
          {
            "ref": "project-gap:GAP-security-real-project-validation",
            "source": "persisted",
            "eligibility": "case_required",
            "disposition": "deferred",
            "reason": "Deferred because it does not define the Automation interaction.",
            "priority_basis": {
              "blocking": "low",
              "user_impact": "low"
            }
          },
          {
            "ref": "project-gap:GAP-cross-record-audit",
            "source": "persisted",
            "eligibility": "case_required",
            "disposition": "deferred",
            "reason": "Deferred because it does not define the Automation interaction.",
            "priority_basis": {
              "blocking": "low",
              "user_impact": "low"
            }
          },
          {
            "ref": "case-gap:CASE-20260825-002:GAP-DEFINE-MULTI-PROJECT-AUTOMATION-INTERACTION",
            "source": "persisted",
            "eligibility": "ready",
            "disposition": "selected",
            "reason": "Selected because it is the only ready Case gap and unblocks implementation.",
            "priority_basis": {
              "blocking": "high",
              "uncertainty": "medium",
              "risk": "medium",
              "user_impact": "high"
            }
          }
        ]
      },
      "selected_gap": {
        "id": "GAP-DEFINE-MULTI-PROJECT-AUTOMATION-INTERACTION",
        "responsibility": "agent",
        "goal": "Define a recoverable Automation interaction that exposes multiple concurrent workspace executions and targets controls to one stable execution without confusing queue or intervention state.",
        "reason": "The accepted concurrency contract changes selection, status, intervention, and control semantics visible in the Automation workspace.",
        "derived_from": [
          "FACT-MULTI-PROJECT-EXECUTION-CONTRACT",
          "GAP-ACCEPT-MULTI-PROJECT-EXECUTION-BOUNDARY"
        ],
        "blocked_by": [],
        "priority_basis": {
          "blocking": "high",
          "uncertainty": "medium",
          "risk": "medium",
          "user_impact": "high"
        },
        "evidence_required": [
          "The Automation interaction source defines the active-execution collection, selected execution, lane-local state, capacity feedback, and targeted controls.",
          "The Automation wireframe demonstrates multiple active workspaces without changing the established three-column workspace structure."
        ]
      },
      "planned_transition": {
        "goal": "Accept the multi-execution Automation interaction source and wireframe projection.",
        "expected_state_change": "The interaction impact becomes upheld and the implementation gap becomes ready."
      },
      "accepted_state_delta": {
        "resolved_gap": {
          "id": "GAP-DEFINE-MULTI-PROJECT-AUTOMATION-INTERACTION",
          "status": "resolved",
          "outcome": "Automation now exposes active executions, capacity, selected execution identity, lane-local state, and targeted controls while preserving the established page structure.",
          "reason": "Interaction source, default wireframe, recovery projection, index, relations, and feature matrix agree.",
          "evidence": [
            "arckit/interaction/automation-workspace/interaction.md",
            "arckit/interaction/automation-workspace/default.html",
            "arckit/interaction/automation-workspace/runtime-recovery.html",
            "arckit/interaction/_map/feature-matrix.md",
            "arckit/interaction/_map/RELATIONS.md"
          ]
        },
        "facts_added": [
          {
            "id": "FACT-MULTI-PROJECT-INTERACTION",
            "revision": 1,
            "status": "accepted",
            "statement": "Automation presents a stable active-execution collection and global 3-lane capacity, keeps one explicitly selected execution for detail and controls, and communicates that attention, recovery, CLI handoff, and stop actions affect only that execution lane while healthy lanes continue.",
            "basis": "Accepted Automation interaction source and gray wireframe projection.",
            "evidence": [
              "arckit/interaction/automation-workspace/interaction.md",
              "arckit/interaction/automation-workspace/default.html",
              "arckit/interaction/automation-workspace/runtime-recovery.html",
              "arckit/interaction/_map/feature-matrix.md",
              "arckit/interaction/_map/RELATIONS.md"
            ]
          }
        ],
        "facts_superseded": [],
        "impacts_added": [],
        "impacts_updated": [
          {
            "id": "IMPACT-MULTI-PROJECT-INTERACTION",
            "fact_id": "FACT-MULTI-PROJECT-EXECUTION-CONTRACT",
            "fact_revision": 1,
            "target": {
              "kind": "software_decision",
              "ref": "experience_and_interaction",
              "revision": 42
            },
            "effect": "upheld",
            "reason": "The stable interaction source and wireframes now define multi-execution selection, capacity, lane-local feedback, and targeted control semantics.",
            "gap_ids": [],
            "evidence": [
              "arckit/interaction/automation-workspace/interaction.md",
              "arckit/interaction/automation-workspace/default.html",
              "arckit/interaction/automation-workspace/runtime-recovery.html",
              "arckit/interaction/_map/feature-matrix.md",
              "arckit/interaction/_map/RELATIONS.md"
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
        "software_definition_changes": [
          {
            "area_ref": "experience_and_interaction",
            "observed_revision": 41,
            "set_decision": {
              "status": "settled",
              "statement": "ArcOrbit 保持 Personal、Product Lifecycle、Organization 三组导航和既有 Work、Automation、Feedback、Organization、Setup、账户及产品反馈语义。Personal / Chat 使用按 Product Workspace 分组的会话列表、独立 transcript 和 Composer：页面无需预先选择项目，每个项目默认显示最近 10 个会话并在超出时从组底部展开完整历史；新对话在首条非空消息前显式显示目标工作区，默认取当前会话或最近成功使用的可用工作区，允许保留草稿快速切换，发送后会话固定绑定该本地 Product Workspace 和 Codex thread。支持选择、重命名、删除、跨页面后台运行和重启恢复。消息以稳定 item 流式更新，支持 Markdown、代码复制、折叠非空 reasoning、单行工具状态、用户审批和智能自动滚动。starting、running、waiting approval 状态均可停止；interrupt 保留部分回答，继续操作会在同一 thread 启动新 turn。删除活动会话先等待 interrupt 终态，失败时不部分删除。没有可用本地工作区时允许保留草稿但禁止发送，并提供配置恢复入口。Chat 不调用 state-driven Runtime，不转换其他对象；Automation task thread、human Gate、Composer 与执行控制保持独立，但人工介入中间消息区直接复用 Chat Conversation Surface。Idea、Release、Operations 和 Engineering 继续呈现计划交互。Chat 返回页面时先用缓存会话和 transcript 立即切换，再后台刷新并显示同步或失败状态；Work 横排筛选使用弹出菜单且列表单行无按钮，评论图片自动加载且在独立窗口完成常用查看操作，单图失败不阻塞时间线；Feedback 列表中的每条记录保持固定单行高度且不因记录较少而拉伸，详情由右栏内部滚动容器承载且滚动不改变列表位置，反馈原文和双向沟通图片默认加载，单图失败不阻塞详情并可就地重试，点击图片后与 Work 共用受控独立窗口。Automation 左栏承载任务、项目、边界、当前选择和介入控制；右栏承载完整执行墙钟时间、累计 gap 轮数、逐 gap 目标/工作/结果，以及 Run、token、Gate、ledger、Git、证据和结构化结果。Automation 专属 loop/round/ledger 事件不进入中间对话流。Work 待办状态切换必须立即确认新的选中状态，并直接显示当前登录代际本地 Task Projection 的匹配结果或 Work Sync 初始化态；状态、搜索、筛选、日期和分页变化不触发 Workshop 请求，也不显示由该点击触发的后台刷新。Work Sync 的连接、补取、对账和错误状态在独立同步反馈中呈现，Automation、认证、组织、成员与 Feedback 状态不得阻塞本地查询交互，大列表不得通过同步整表重建阻塞 Renderer。Work 七状态工具条使用不受右侧项目名、命中数、补全树数量、状态计数和刷新提示变化影响的稳定几何；动态摘要限制在固定单行区域并在超出时省略，常规与响应式布局均不因内容变化改变工具条宽高或状态按钮区宽度。待办列表、队列、当前运行、确认对话和 Intervention Workbench 顶部统一显示折叠空白且最多 64 个 Unicode grapheme clusters 的单行标题；Work 与 Automation 详情只展示一次保留换行的完整正文，Workbench 顶部保持固定高度。Work 与 Feedback 共享页面级主工作区骨架：全局产品集栏下只保留一条固定高度且不换行的页面控制轨，列表与详情双栏取得其余全部可用高度，页面外层不滚动，面板标题保持可见且两侧正文独立滚动。Work 常规宽度在控制轨显示七状态分段、搜索、统一多维筛选入口和创建动作，窄窗口把状态收敛为当前状态菜单并把低频动作收入更多操作；Feedback 常规宽度显示搜索、处理状态、排序和刷新，窄窗口保留搜索与当前状态并把排序、刷新等低频动作收入更多操作。加载、空态、错误、长列表和长详情不改变控制轨与双栏几何，宽度切换不重置筛选、选择或滚动位置。 Automation Command Center 以活动 execution 列表展示默认最多 3 条 workspace lane，显式选中一项投影 Run、Case、Gate 与恢复详情；选择不改变执行，暂停、停止、CLI 接管、介入和恢复均以 execution_id 定向，lane 局部等待或故障不阻止其他健康 lane。",
              "reason": "接受多 workspace 并行时的活动执行选择、容量反馈与定向控制交互。",
              "evidence": [
                "Current operator input, 2026-08-25",
                "arckit/interaction/task-browser/interaction.md",
                "arckit/interaction/task-browser/daily-work.html",
                "arckit/interaction/platform-workspace/interaction.md",
                "arckit/interaction/platform-workspace/default.html",
                "arckit/interaction/_map/RELATIONS.md",
                "arckit/visual/_library/brief.md",
                "arckit/visual/_library/design-tokens.yaml",
                "arckit/spec/agentic-software-development/arcorbit-work-management.md",
                "arckit/spec/agentic-software-development/runtime-automation-workspace.md",
                "arckit/spec/agentic-software-development/arcorbit-platform-capabilities.md",
                "arckit/interaction/automation-workspace/interaction.md",
                "arckit/interaction/automation-workspace/default.html",
                "arckit/interaction/automation-workspace/runtime-recovery.html",
                "arckit/interaction/_map/feature-matrix.md"
              ],
              "confidence": "high",
              "resume_condition": "当 Work 状态/筛选查询、同步反馈位置、初始化/过期状态或 Automation 本地状态入口变化时重审。 当活动 execution 选择、全局容量或 lane 局部控制反馈变化时也需重审。",
              "revision": 41
            },
            "gap_refs": [],
            "reason": "接受多 workspace 并行时的活动执行选择、容量反馈与定向控制交互。",
            "evidence": [
              "arckit/interaction/automation-workspace/interaction.md",
              "arckit/interaction/automation-workspace/default.html",
              "arckit/interaction/automation-workspace/runtime-recovery.html",
              "arckit/interaction/_map/feature-matrix.md",
              "arckit/interaction/_map/RELATIONS.md"
            ]
          }
        ],
        "software_invariant_changes": [],
        "project_gap_changes": [],
        "selection_context_change": null,
        "evidence": [
          "arckit/interaction/automation-workspace/interaction.md",
          "arckit/interaction/automation-workspace/default.html",
          "arckit/interaction/automation-workspace/runtime-recovery.html",
          "arckit/interaction/_map/feature-matrix.md",
          "arckit/interaction/_map/RELATIONS.md"
        ]
      },
      "invariant_assessment": {
        "project_revision": 234,
        "judgments": [
          {
            "invariant_ref": "product-expectations-remain-recoverable",
            "disposition": "upheld",
            "reason": "The interaction projection is consistent with the accepted product lane contract.",
            "fact_refs": [
              "FACT-MULTI-PROJECT-EXECUTION-CONTRACT",
              "FACT-MULTI-PROJECT-INTERACTION"
            ],
            "evidence": [
              "arckit/interaction/automation-workspace/interaction.md",
              "arckit/interaction/automation-workspace/default.html",
              "arckit/interaction/automation-workspace/runtime-recovery.html",
              "arckit/interaction/_map/feature-matrix.md",
              "arckit/interaction/_map/RELATIONS.md"
            ],
            "gap_refs": []
          },
          {
            "invariant_ref": "interaction-expectations-remain-recoverable",
            "disposition": "upheld",
            "reason": "The source and wireframes cover selection, capacity, targeted controls, lane-local recovery, and global freeze boundaries.",
            "fact_refs": [
              "FACT-MULTI-PROJECT-INTERACTION"
            ],
            "evidence": [
              "arckit/interaction/automation-workspace/interaction.md",
              "arckit/interaction/automation-workspace/default.html",
              "arckit/interaction/automation-workspace/runtime-recovery.html",
              "arckit/interaction/_map/feature-matrix.md",
              "arckit/interaction/_map/RELATIONS.md"
            ],
            "gap_refs": []
          },
          {
            "invariant_ref": "visual-language-remains-consistent",
            "disposition": "upheld",
            "reason": "The new state reuses the existing gray wireframe components and introduces no color or new visual language.",
            "fact_refs": [
              "FACT-MULTI-PROJECT-INTERACTION"
            ],
            "evidence": [
              "arckit/interaction/automation-workspace/interaction.md",
              "arckit/interaction/automation-workspace/default.html",
              "arckit/interaction/automation-workspace/runtime-recovery.html",
              "arckit/interaction/_map/feature-matrix.md",
              "arckit/interaction/_map/RELATIONS.md"
            ],
            "gap_refs": []
          },
          {
            "invariant_ref": "technical-decisions-remain-explainable",
            "disposition": "upheld",
            "reason": "Interaction identity and state scopes follow the accepted execution_id and workspace-lane technical boundary.",
            "fact_refs": [
              "FACT-MULTI-PROJECT-EXECUTION-CONTRACT",
              "FACT-MULTI-PROJECT-INTERACTION"
            ],
            "evidence": [
              "arckit/interaction/automation-workspace/interaction.md",
              "arckit/interaction/automation-workspace/default.html",
              "arckit/interaction/automation-workspace/runtime-recovery.html",
              "arckit/interaction/_map/feature-matrix.md",
              "arckit/interaction/_map/RELATIONS.md"
            ],
            "gap_refs": []
          },
          {
            "invariant_ref": "accepted-facts-are-realized",
            "disposition": "threatened",
            "reason": "Runtime code still needs to realize the accepted product and interaction facts.",
            "fact_refs": [
              "FACT-MULTI-PROJECT-EXECUTION-CONTRACT",
              "FACT-MULTI-PROJECT-INTERACTION"
            ],
            "evidence": [],
            "gap_refs": [
              "GAP-IMPLEMENT-MULTI-PROJECT-AUTOMATION"
            ]
          },
          {
            "invariant_ref": "material-risks-have-credible-evidence",
            "disposition": "threatened",
            "reason": "Concurrency, isolation, migration, restart, and control routing still need repeatable implementation tests.",
            "fact_refs": [
              "FACT-MULTI-PROJECT-EXECUTION-CONTRACT",
              "FACT-MULTI-PROJECT-INTERACTION"
            ],
            "evidence": [],
            "gap_refs": [
              "GAP-IMPLEMENT-MULTI-PROJECT-AUTOMATION"
            ]
          }
        ]
      },
      "evidence": [
        "arckit/interaction/automation-workspace/interaction.md",
        "arckit/interaction/automation-workspace/default.html",
        "arckit/interaction/automation-workspace/runtime-recovery.html",
        "arckit/interaction/_map/feature-matrix.md",
        "arckit/interaction/_map/RELATIONS.md"
      ],
      "runtime_result_ref": "",
      "occurred_at": "2026-08-25T07:54:55.471Z"
    },
    {
      "round": 3,
      "transition_schema_version": "arckit-case-transition/v8",
      "goal": "Implement and verify bounded multi-project Automation with serial workspace lanes.",
      "outcome": "completed",
      "gap_selection": {
        "mode": "candidate",
        "basis": "The implementation gap is the only ready Case gap after the product, technical, and interaction contracts were accepted.",
        "snapshot_token": "2f6cecb0d5ade8f91dcf6de16c37cd5d34b9a689727f51e6dc6a618675a56409",
        "selected_ref": "case-gap:CASE-20260825-002:GAP-IMPLEMENT-MULTI-PROJECT-AUTOMATION",
        "comparison_summary": "Selected the only ready Case gap and deferred four unrelated Project gaps.",
        "fresh_discovery_summary": "Implementation and review found no stronger fresh gap; Completion Review remains the deterministic next phase.",
        "considered": [
          {
            "ref": "project-gap:GAP-agent-scenario-evaluation",
            "source": "persisted",
            "eligibility": "case_required",
            "disposition": "deferred",
            "reason": "Unrelated scenario evaluation remains a separate Project gap.",
            "priority_basis": {
              "blocking": "low",
              "user_impact": "low"
            }
          },
          {
            "ref": "project-gap:GAP-runtime-resilience-and-adapters",
            "source": "persisted",
            "eligibility": "case_required",
            "disposition": "deferred",
            "reason": "Broader Runtime resilience remains outside this bounded multi-project implementation.",
            "priority_basis": {
              "blocking": "low",
              "user_impact": "low"
            }
          },
          {
            "ref": "project-gap:GAP-security-real-project-validation",
            "source": "persisted",
            "eligibility": "case_required",
            "disposition": "deferred",
            "reason": "Real permission-bearing security validation remains a separate Project gap.",
            "priority_basis": {
              "blocking": "low",
              "user_impact": "low"
            }
          },
          {
            "ref": "project-gap:GAP-cross-record-audit",
            "source": "persisted",
            "eligibility": "case_required",
            "disposition": "deferred",
            "reason": "Cross-record governance remains a separate Project gap.",
            "priority_basis": {
              "blocking": "low",
              "user_impact": "low"
            }
          },
          {
            "ref": "case-gap:CASE-20260825-002:GAP-IMPLEMENT-MULTI-PROJECT-AUTOMATION",
            "source": "persisted",
            "eligibility": "ready",
            "disposition": "selected",
            "reason": "Selected because it is the only ready Case gap and directly realizes the accepted multi-project contract.",
            "priority_basis": {
              "blocking": "high",
              "uncertainty": "high",
              "risk": "high",
              "user_impact": "high"
            }
          }
        ]
      },
      "selected_gap": {
        "id": "GAP-IMPLEMENT-MULTI-PROJECT-AUTOMATION",
        "responsibility": "agent",
        "goal": "Realize bounded concurrent Automation across independent local workspaces with per-workspace serial dispatch, isolated lifecycle state, restart recovery, and targeted operator controls.",
        "reason": "The current Store and Coordinator still enforce one global active task and global dispatch blocking.",
        "derived_from": [
          "FACT-GLOBAL-AUTOMATION-LEASE",
          "FACT-MULTI-PROJECT-EXECUTION-CONTRACT"
        ],
        "blocked_by": [
          "GAP-DEFINE-MULTI-PROJECT-AUTOMATION-INTERACTION"
        ],
        "priority_basis": {
          "blocking": "high",
          "uncertainty": "high",
          "risk": "high",
          "user_impact": "high"
        },
        "evidence_required": [
          "Two independent workspaces can execute concurrently while a second item in either workspace remains serial.",
          "Attention, recovery, completion, cancellation, and restart affect only the targeted workspace lane unless a documented global boundary applies.",
          "Legacy singleton state migrates safely and stable execution identifiers prevent control or Run collisions.",
          "Focused and full ArcOrbit regression suites pass."
        ]
      },
      "planned_transition": {
        "goal": "Implement and verify bounded multi-project Automation with serial workspace lanes.",
        "expected_state_change": "The implementation gap resolves, realization and risk impacts become upheld, and the Case becomes eligible for Completion Review."
      },
      "accepted_state_delta": {
        "resolved_gap": {
          "id": "GAP-IMPLEMENT-MULTI-PROJECT-AUTOMATION",
          "status": "resolved",
          "outcome": "ArcOrbit now supervises a workspace-keyed active execution collection, starts up to three independent lanes, keeps each lane serial, persists and migrates execution state, isolates lane recovery, and routes Desktop controls by execution_id.",
          "reason": "Implementation, focused regressions, the broader test run, and the approved Electron fixture agree with the accepted product, technical, and interaction contracts.",
          "evidence": [
            "runtime/arcorbit/src/automation-coordinator.mjs",
            "runtime/arcorbit/src/desktop/desktop-store.mjs",
            "runtime/arcorbit/src/work-sync-coordinator.mjs",
            "runtime/arcorbit/src/desktop-run-manager.mjs",
            "runtime/arcorbit/desktop/main.mjs",
            "runtime/arcorbit/desktop/preload.cjs",
            "runtime/arcorbit/desktop/renderer/renderer.js",
            "runtime/arcorbit/desktop/renderer/styles.css",
            "runtime/arcorbit/test/automation-coordinator.test.mjs",
            "runtime/arcorbit/test/desktop-store.test.mjs",
            "runtime/arcorbit/test/desktop-renderer.test.mjs",
            "runtime/arcorbit/test/work-sync-coordinator.test.mjs",
            "Focused Automation/Store/Renderer/Work Sync regression: 115 passed, 0 failed.",
            "ArcOrbit full test run: 396 passed, 9 environment-gated skips; its only sandbox-blocked Electron fixture passed through the approved Electron entrypoint.",
            "Electron experience-realization fixture: all 10 pages and control, keyboard, title, and layout assertions passed."
          ]
        },
        "facts_added": [
          {
            "id": "FACT-MULTI-PROJECT-AUTOMATION-IMPLEMENTED",
            "revision": 1,
            "status": "accepted",
            "statement": "ArcOrbit Automation now uses a bounded supervisor over canonical local-workspace lanes: each lane owns at most one todo or acceptance-feedback execution, up to three lanes run concurrently by default, lane-local attention and recovery preserve healthy-lane progress, legacy active_task state migrates into active_executions, and Desktop controls target stable execution_id values.",
            "basis": "Implemented Runtime, Store, Work Sync, Run identity, Desktop IPC/Renderer, migration, and repeatable regression evidence.",
            "evidence": [
              "runtime/arcorbit/src/automation-coordinator.mjs",
              "runtime/arcorbit/src/desktop/desktop-store.mjs",
              "runtime/arcorbit/src/work-sync-coordinator.mjs",
              "runtime/arcorbit/src/desktop-run-manager.mjs",
              "runtime/arcorbit/desktop/main.mjs",
              "runtime/arcorbit/desktop/preload.cjs",
              "runtime/arcorbit/desktop/renderer/renderer.js",
              "runtime/arcorbit/desktop/renderer/styles.css",
              "runtime/arcorbit/test/automation-coordinator.test.mjs",
              "runtime/arcorbit/test/desktop-store.test.mjs",
              "runtime/arcorbit/test/desktop-renderer.test.mjs",
              "runtime/arcorbit/test/work-sync-coordinator.test.mjs",
              "Focused Automation/Store/Renderer/Work Sync regression: 115 passed, 0 failed.",
              "ArcOrbit full test run: 396 passed, 9 environment-gated skips; its only sandbox-blocked Electron fixture passed through the approved Electron entrypoint.",
              "Electron experience-realization fixture: all 10 pages and control, keyboard, title, and layout assertions passed."
            ]
          }
        ],
        "facts_superseded": [],
        "impacts_added": [],
        "impacts_updated": [
          {
            "id": "IMPACT-MULTI-PROJECT-REALIZATION",
            "fact_id": "FACT-MULTI-PROJECT-EXECUTION-CONTRACT",
            "fact_revision": 1,
            "target": {
              "kind": "software_invariant",
              "ref": "accepted-facts-are-realized",
              "revision": null
            },
            "effect": "upheld",
            "reason": "The Store, supervisor, lane adapters, Desktop projection, and targeted controls now realize the accepted contract.",
            "gap_ids": [],
            "evidence": [
              "runtime/arcorbit/src/automation-coordinator.mjs",
              "runtime/arcorbit/src/desktop/desktop-store.mjs",
              "runtime/arcorbit/src/work-sync-coordinator.mjs",
              "runtime/arcorbit/src/desktop-run-manager.mjs",
              "runtime/arcorbit/desktop/main.mjs",
              "runtime/arcorbit/desktop/preload.cjs",
              "runtime/arcorbit/desktop/renderer/renderer.js",
              "runtime/arcorbit/desktop/renderer/styles.css",
              "runtime/arcorbit/test/automation-coordinator.test.mjs",
              "runtime/arcorbit/test/desktop-store.test.mjs",
              "runtime/arcorbit/test/desktop-renderer.test.mjs",
              "runtime/arcorbit/test/work-sync-coordinator.test.mjs",
              "Focused Automation/Store/Renderer/Work Sync regression: 115 passed, 0 failed.",
              "ArcOrbit full test run: 396 passed, 9 environment-gated skips; its only sandbox-blocked Electron fixture passed through the approved Electron entrypoint.",
              "Electron experience-realization fixture: all 10 pages and control, keyboard, title, and layout assertions passed."
            ]
          },
          {
            "id": "IMPACT-MULTI-PROJECT-RISK-EVIDENCE",
            "fact_id": "FACT-MULTI-PROJECT-EXECUTION-CONTRACT",
            "fact_revision": 1,
            "target": {
              "kind": "software_invariant",
              "ref": "material-risks-have-credible-evidence",
              "revision": null
            },
            "effect": "upheld",
            "reason": "Repeatable tests cover cap enforcement, serial lanes, targeted isolation, migration, renderer routing, and existing regression behavior.",
            "gap_ids": [],
            "evidence": [
              "runtime/arcorbit/src/automation-coordinator.mjs",
              "runtime/arcorbit/src/desktop/desktop-store.mjs",
              "runtime/arcorbit/src/work-sync-coordinator.mjs",
              "runtime/arcorbit/src/desktop-run-manager.mjs",
              "runtime/arcorbit/desktop/main.mjs",
              "runtime/arcorbit/desktop/preload.cjs",
              "runtime/arcorbit/desktop/renderer/renderer.js",
              "runtime/arcorbit/desktop/renderer/styles.css",
              "runtime/arcorbit/test/automation-coordinator.test.mjs",
              "runtime/arcorbit/test/desktop-store.test.mjs",
              "runtime/arcorbit/test/desktop-renderer.test.mjs",
              "runtime/arcorbit/test/work-sync-coordinator.test.mjs",
              "Focused Automation/Store/Renderer/Work Sync regression: 115 passed, 0 failed.",
              "ArcOrbit full test run: 396 passed, 9 environment-gated skips; its only sandbox-blocked Electron fixture passed through the approved Electron entrypoint.",
              "Electron experience-realization fixture: all 10 pages and control, keyboard, title, and layout assertions passed."
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
        "evidence": [
          "runtime/arcorbit/src/automation-coordinator.mjs",
          "runtime/arcorbit/src/desktop/desktop-store.mjs",
          "runtime/arcorbit/src/work-sync-coordinator.mjs",
          "runtime/arcorbit/src/desktop-run-manager.mjs",
          "runtime/arcorbit/desktop/main.mjs",
          "runtime/arcorbit/desktop/preload.cjs",
          "runtime/arcorbit/desktop/renderer/renderer.js",
          "runtime/arcorbit/desktop/renderer/styles.css",
          "runtime/arcorbit/test/automation-coordinator.test.mjs",
          "runtime/arcorbit/test/desktop-store.test.mjs",
          "runtime/arcorbit/test/desktop-renderer.test.mjs",
          "runtime/arcorbit/test/work-sync-coordinator.test.mjs",
          "Focused Automation/Store/Renderer/Work Sync regression: 115 passed, 0 failed.",
          "ArcOrbit full test run: 396 passed, 9 environment-gated skips; its only sandbox-blocked Electron fixture passed through the approved Electron entrypoint.",
          "Electron experience-realization fixture: all 10 pages and control, keyboard, title, and layout assertions passed."
        ]
      },
      "invariant_assessment": {
        "project_revision": 235,
        "judgments": [
          {
            "invariant_ref": "product-expectations-remain-recoverable",
            "disposition": "upheld",
            "reason": "The implementation realizes the accepted workspace-lane product contract without changing its documented boundaries.",
            "fact_refs": [
              "FACT-MULTI-PROJECT-EXECUTION-CONTRACT",
              "FACT-MULTI-PROJECT-INTERACTION",
              "FACT-MULTI-PROJECT-AUTOMATION-IMPLEMENTED"
            ],
            "evidence": [
              "runtime/arcorbit/src/automation-coordinator.mjs",
              "runtime/arcorbit/src/desktop/desktop-store.mjs",
              "runtime/arcorbit/src/work-sync-coordinator.mjs",
              "runtime/arcorbit/src/desktop-run-manager.mjs",
              "runtime/arcorbit/desktop/main.mjs",
              "runtime/arcorbit/desktop/preload.cjs",
              "runtime/arcorbit/desktop/renderer/renderer.js",
              "runtime/arcorbit/desktop/renderer/styles.css",
              "runtime/arcorbit/test/automation-coordinator.test.mjs",
              "runtime/arcorbit/test/desktop-store.test.mjs",
              "runtime/arcorbit/test/desktop-renderer.test.mjs",
              "runtime/arcorbit/test/work-sync-coordinator.test.mjs",
              "Focused Automation/Store/Renderer/Work Sync regression: 115 passed, 0 failed.",
              "ArcOrbit full test run: 396 passed, 9 environment-gated skips; its only sandbox-blocked Electron fixture passed through the approved Electron entrypoint.",
              "Electron experience-realization fixture: all 10 pages and control, keyboard, title, and layout assertions passed."
            ],
            "gap_refs": []
          },
          {
            "invariant_ref": "interaction-expectations-remain-recoverable",
            "disposition": "upheld",
            "reason": "The Desktop projects the active execution collection, capacity, selection, and execution-targeted controls defined by the interaction source.",
            "fact_refs": [
              "FACT-MULTI-PROJECT-INTERACTION",
              "FACT-MULTI-PROJECT-AUTOMATION-IMPLEMENTED"
            ],
            "evidence": [
              "runtime/arcorbit/src/automation-coordinator.mjs",
              "runtime/arcorbit/src/desktop/desktop-store.mjs",
              "runtime/arcorbit/src/work-sync-coordinator.mjs",
              "runtime/arcorbit/src/desktop-run-manager.mjs",
              "runtime/arcorbit/desktop/main.mjs",
              "runtime/arcorbit/desktop/preload.cjs",
              "runtime/arcorbit/desktop/renderer/renderer.js",
              "runtime/arcorbit/desktop/renderer/styles.css",
              "runtime/arcorbit/test/automation-coordinator.test.mjs",
              "runtime/arcorbit/test/desktop-store.test.mjs",
              "runtime/arcorbit/test/desktop-renderer.test.mjs",
              "runtime/arcorbit/test/work-sync-coordinator.test.mjs",
              "Focused Automation/Store/Renderer/Work Sync regression: 115 passed, 0 failed.",
              "ArcOrbit full test run: 396 passed, 9 environment-gated skips; its only sandbox-blocked Electron fixture passed through the approved Electron entrypoint.",
              "Electron experience-realization fixture: all 10 pages and control, keyboard, title, and layout assertions passed."
            ],
            "gap_refs": []
          },
          {
            "invariant_ref": "visual-language-remains-consistent",
            "disposition": "upheld",
            "reason": "The active-execution selector reuses existing cards, pills, tokens, typography, and responsive grid behavior.",
            "fact_refs": [
              "FACT-MULTI-PROJECT-INTERACTION",
              "FACT-MULTI-PROJECT-AUTOMATION-IMPLEMENTED"
            ],
            "evidence": [
              "runtime/arcorbit/desktop/renderer/renderer.js",
              "runtime/arcorbit/desktop/renderer/styles.css",
              "Electron experience-realization fixture passed."
            ],
            "gap_refs": []
          },
          {
            "invariant_ref": "technical-decisions-remain-explainable",
            "disposition": "upheld",
            "reason": "The supervisor/lane split, persisted execution collection, stable execution identity, lane metadata, bounded cap, and explicit global recovery scope match the accepted technical sources.",
            "fact_refs": [
              "FACT-MULTI-PROJECT-EXECUTION-CONTRACT",
              "FACT-MULTI-PROJECT-AUTOMATION-IMPLEMENTED"
            ],
            "evidence": [
              "runtime/arcorbit/src/automation-coordinator.mjs",
              "runtime/arcorbit/src/desktop/desktop-store.mjs",
              "runtime/arcorbit/src/work-sync-coordinator.mjs",
              "runtime/arcorbit/src/desktop-run-manager.mjs",
              "runtime/arcorbit/desktop/main.mjs",
              "runtime/arcorbit/desktop/preload.cjs",
              "runtime/arcorbit/desktop/renderer/renderer.js",
              "runtime/arcorbit/desktop/renderer/styles.css",
              "runtime/arcorbit/test/automation-coordinator.test.mjs",
              "runtime/arcorbit/test/desktop-store.test.mjs",
              "runtime/arcorbit/test/desktop-renderer.test.mjs",
              "runtime/arcorbit/test/work-sync-coordinator.test.mjs",
              "Focused Automation/Store/Renderer/Work Sync regression: 115 passed, 0 failed.",
              "ArcOrbit full test run: 396 passed, 9 environment-gated skips; its only sandbox-blocked Electron fixture passed through the approved Electron entrypoint.",
              "Electron experience-realization fixture: all 10 pages and control, keyboard, title, and layout assertions passed."
            ],
            "gap_refs": []
          },
          {
            "invariant_ref": "accepted-facts-are-realized",
            "disposition": "upheld",
            "reason": "Independent workspaces run concurrently, each workspace owns one serial lease, and all operator actions route to one stable execution.",
            "fact_refs": [
              "FACT-MULTI-PROJECT-EXECUTION-CONTRACT",
              "FACT-MULTI-PROJECT-INTERACTION",
              "FACT-MULTI-PROJECT-AUTOMATION-IMPLEMENTED"
            ],
            "evidence": [
              "runtime/arcorbit/src/automation-coordinator.mjs",
              "runtime/arcorbit/src/desktop/desktop-store.mjs",
              "runtime/arcorbit/src/work-sync-coordinator.mjs",
              "runtime/arcorbit/src/desktop-run-manager.mjs",
              "runtime/arcorbit/desktop/main.mjs",
              "runtime/arcorbit/desktop/preload.cjs",
              "runtime/arcorbit/desktop/renderer/renderer.js",
              "runtime/arcorbit/desktop/renderer/styles.css",
              "runtime/arcorbit/test/automation-coordinator.test.mjs",
              "runtime/arcorbit/test/desktop-store.test.mjs",
              "runtime/arcorbit/test/desktop-renderer.test.mjs",
              "runtime/arcorbit/test/work-sync-coordinator.test.mjs",
              "Focused Automation/Store/Renderer/Work Sync regression: 115 passed, 0 failed.",
              "ArcOrbit full test run: 396 passed, 9 environment-gated skips; its only sandbox-blocked Electron fixture passed through the approved Electron entrypoint.",
              "Electron experience-realization fixture: all 10 pages and control, keyboard, title, and layout assertions passed."
            ],
            "gap_refs": []
          },
          {
            "invariant_ref": "material-risks-have-credible-evidence",
            "disposition": "upheld",
            "reason": "Repeatable tests cover the three-lane cap, same-workspace serialization, targeted control and recovery isolation, singleton migration, renderer routing, and existing Automation regressions.",
            "fact_refs": [
              "FACT-MULTI-PROJECT-EXECUTION-CONTRACT",
              "FACT-MULTI-PROJECT-AUTOMATION-IMPLEMENTED"
            ],
            "evidence": [
              "runtime/arcorbit/src/automation-coordinator.mjs",
              "runtime/arcorbit/src/desktop/desktop-store.mjs",
              "runtime/arcorbit/src/work-sync-coordinator.mjs",
              "runtime/arcorbit/src/desktop-run-manager.mjs",
              "runtime/arcorbit/desktop/main.mjs",
              "runtime/arcorbit/desktop/preload.cjs",
              "runtime/arcorbit/desktop/renderer/renderer.js",
              "runtime/arcorbit/desktop/renderer/styles.css",
              "runtime/arcorbit/test/automation-coordinator.test.mjs",
              "runtime/arcorbit/test/desktop-store.test.mjs",
              "runtime/arcorbit/test/desktop-renderer.test.mjs",
              "runtime/arcorbit/test/work-sync-coordinator.test.mjs",
              "Focused Automation/Store/Renderer/Work Sync regression: 115 passed, 0 failed.",
              "ArcOrbit full test run: 396 passed, 9 environment-gated skips; its only sandbox-blocked Electron fixture passed through the approved Electron entrypoint.",
              "Electron experience-realization fixture: all 10 pages and control, keyboard, title, and layout assertions passed."
            ],
            "gap_refs": []
          }
        ]
      },
      "evidence": [
        "runtime/arcorbit/src/automation-coordinator.mjs",
        "runtime/arcorbit/src/desktop/desktop-store.mjs",
        "runtime/arcorbit/src/work-sync-coordinator.mjs",
        "runtime/arcorbit/src/desktop-run-manager.mjs",
        "runtime/arcorbit/desktop/main.mjs",
        "runtime/arcorbit/desktop/preload.cjs",
        "runtime/arcorbit/desktop/renderer/renderer.js",
        "runtime/arcorbit/desktop/renderer/styles.css",
        "runtime/arcorbit/test/automation-coordinator.test.mjs",
        "runtime/arcorbit/test/desktop-store.test.mjs",
        "runtime/arcorbit/test/desktop-renderer.test.mjs",
        "runtime/arcorbit/test/work-sync-coordinator.test.mjs",
        "Focused Automation/Store/Renderer/Work Sync regression: 115 passed, 0 failed.",
        "ArcOrbit full test run: 396 passed, 9 environment-gated skips; its only sandbox-blocked Electron fixture passed through the approved Electron entrypoint.",
        "Electron experience-realization fixture: all 10 pages and control, keyboard, title, and layout assertions passed."
      ],
      "runtime_result_ref": "",
      "occurred_at": "2026-08-25T08:20:35.987Z"
    },
    {
      "round": 4,
      "transition_schema_version": "arckit-case-transition/v8",
      "goal": "Perform the implementation-focused Completion Review for the multi-project Automation change.",
      "outcome": "completed",
      "gap_selection": {
        "mode": "candidate",
        "basis": "All ordinary Case gaps and impacts are closed; implementation-focused review is now the only ready Case obligation.",
        "snapshot_token": "cd6d865c4ca6c4d352a45e0f58b2693c589f8ae45b3eb8bd21aec77087015ce4",
        "selected_ref": "case-gap:CASE-20260825-002:CASE-20260825-002:completion-review:1",
        "comparison_summary": "Selected the ready Completion Review and deferred four unrelated Project gaps.",
        "fresh_discovery_summary": "Code, state, migration, isolation, restart, UI, and regression review found no stronger fresh gap.",
        "considered": [
          {
            "ref": "project-gap:GAP-agent-scenario-evaluation",
            "source": "persisted",
            "eligibility": "case_required",
            "disposition": "deferred",
            "reason": "Separate Project-level scenario evaluation does not supersede this Case completion review.",
            "priority_basis": {
              "blocking": "low",
              "user_impact": "low"
            }
          },
          {
            "ref": "project-gap:GAP-runtime-resilience-and-adapters",
            "source": "persisted",
            "eligibility": "case_required",
            "disposition": "deferred",
            "reason": "Broader Runtime resilience remains outside this Case.",
            "priority_basis": {
              "blocking": "low",
              "user_impact": "low"
            }
          },
          {
            "ref": "project-gap:GAP-security-real-project-validation",
            "source": "persisted",
            "eligibility": "case_required",
            "disposition": "deferred",
            "reason": "Real permission-bearing validation remains outside this Case.",
            "priority_basis": {
              "blocking": "low",
              "user_impact": "low"
            }
          },
          {
            "ref": "project-gap:GAP-cross-record-audit",
            "source": "persisted",
            "eligibility": "case_required",
            "disposition": "deferred",
            "reason": "Cross-record audit remains outside this Case.",
            "priority_basis": {
              "blocking": "low",
              "user_impact": "low"
            }
          },
          {
            "ref": "case-gap:CASE-20260825-002:CASE-20260825-002:completion-review:1",
            "source": "persisted",
            "eligibility": "ready",
            "disposition": "selected",
            "reason": "Selected because all ordinary Case obligations are closed and no stronger fresh implementation gap was found.",
            "priority_basis": {
              "blocking": "high",
              "uncertainty": "low",
              "risk": "high",
              "user_impact": "high"
            }
          }
        ]
      },
      "selected_gap": {
        "id": "CASE-20260825-002:completion-review:1",
        "responsibility": "agent",
        "goal": "Review the completed implementation for correctness, real problem resolution, verification credibility, regression risk, and minimality.",
        "reason": "All ordinary Case gaps and state impacts are closed.",
        "derived_from": [
          "case_result",
          "content_revision:3"
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
        "goal": "Perform the implementation-focused Completion Review for the multi-project Automation change.",
        "expected_state_change": "A clean five-dimension review closes the Case without mutating accepted content."
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
          "reviewed_content_revision": 3,
          "dimensions": {
            "implementation_correctness": "clean",
            "problem_resolution": "clean",
            "verification_credibility": "clean",
            "regression_risk": "clean",
            "minimality": "clean"
          },
          "findings": [],
          "evidence": [
            "runtime/arcorbit/src/automation-coordinator.mjs",
            "runtime/arcorbit/src/desktop/desktop-store.mjs",
            "runtime/arcorbit/src/work-sync-coordinator.mjs",
            "runtime/arcorbit/src/desktop-run-manager.mjs",
            "runtime/arcorbit/desktop/main.mjs",
            "runtime/arcorbit/desktop/preload.cjs",
            "runtime/arcorbit/desktop/renderer/renderer.js",
            "runtime/arcorbit/desktop/renderer/styles.css",
            "runtime/arcorbit/test/automation-coordinator.test.mjs",
            "runtime/arcorbit/test/desktop-store.test.mjs",
            "runtime/arcorbit/test/desktop-renderer.test.mjs",
            "runtime/arcorbit/test/work-sync-coordinator.test.mjs",
            "Focused Automation/Store/Renderer/Work Sync regression after restart coverage: 116 passed, 0 failed.",
            "ArcOrbit broader test run: 396 passed, 9 environment-gated skips; the sandbox-blocked Electron fixture passed separately through the approved Electron entrypoint.",
            "git diff --check passed.",
            "Completion self-review found no correctness, resolution, verification, regression, or minimality finding."
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
        "evidence": [
          "runtime/arcorbit/src/automation-coordinator.mjs",
          "runtime/arcorbit/src/desktop/desktop-store.mjs",
          "runtime/arcorbit/src/work-sync-coordinator.mjs",
          "runtime/arcorbit/src/desktop-run-manager.mjs",
          "runtime/arcorbit/desktop/main.mjs",
          "runtime/arcorbit/desktop/preload.cjs",
          "runtime/arcorbit/desktop/renderer/renderer.js",
          "runtime/arcorbit/desktop/renderer/styles.css",
          "runtime/arcorbit/test/automation-coordinator.test.mjs",
          "runtime/arcorbit/test/desktop-store.test.mjs",
          "runtime/arcorbit/test/desktop-renderer.test.mjs",
          "runtime/arcorbit/test/work-sync-coordinator.test.mjs",
          "Focused Automation/Store/Renderer/Work Sync regression after restart coverage: 116 passed, 0 failed.",
          "ArcOrbit broader test run: 396 passed, 9 environment-gated skips; the sandbox-blocked Electron fixture passed separately through the approved Electron entrypoint.",
          "git diff --check passed.",
          "Completion self-review found no correctness, resolution, verification, regression, or minimality finding."
        ]
      },
      "invariant_assessment": {
        "project_revision": 235,
        "judgments": [
          {
            "invariant_ref": "product-expectations-remain-recoverable",
            "disposition": "upheld",
            "reason": "The implementation realizes the accepted workspace-lane product contract without changing its documented boundaries.",
            "fact_refs": [
              "FACT-MULTI-PROJECT-EXECUTION-CONTRACT",
              "FACT-MULTI-PROJECT-INTERACTION",
              "FACT-MULTI-PROJECT-AUTOMATION-IMPLEMENTED"
            ],
            "evidence": [
              "runtime/arcorbit/src/automation-coordinator.mjs",
              "runtime/arcorbit/src/desktop/desktop-store.mjs",
              "runtime/arcorbit/src/work-sync-coordinator.mjs",
              "runtime/arcorbit/src/desktop-run-manager.mjs",
              "runtime/arcorbit/desktop/main.mjs",
              "runtime/arcorbit/desktop/preload.cjs",
              "runtime/arcorbit/desktop/renderer/renderer.js",
              "runtime/arcorbit/desktop/renderer/styles.css",
              "runtime/arcorbit/test/automation-coordinator.test.mjs",
              "runtime/arcorbit/test/desktop-store.test.mjs",
              "runtime/arcorbit/test/desktop-renderer.test.mjs",
              "runtime/arcorbit/test/work-sync-coordinator.test.mjs",
              "Focused Automation/Store/Renderer/Work Sync regression: 115 passed, 0 failed.",
              "ArcOrbit full test run: 396 passed, 9 environment-gated skips; its only sandbox-blocked Electron fixture passed through the approved Electron entrypoint.",
              "Electron experience-realization fixture: all 10 pages and control, keyboard, title, and layout assertions passed."
            ],
            "gap_refs": []
          },
          {
            "invariant_ref": "interaction-expectations-remain-recoverable",
            "disposition": "upheld",
            "reason": "The Desktop projects the active execution collection, capacity, selection, and execution-targeted controls defined by the interaction source.",
            "fact_refs": [
              "FACT-MULTI-PROJECT-INTERACTION",
              "FACT-MULTI-PROJECT-AUTOMATION-IMPLEMENTED"
            ],
            "evidence": [
              "runtime/arcorbit/src/automation-coordinator.mjs",
              "runtime/arcorbit/src/desktop/desktop-store.mjs",
              "runtime/arcorbit/src/work-sync-coordinator.mjs",
              "runtime/arcorbit/src/desktop-run-manager.mjs",
              "runtime/arcorbit/desktop/main.mjs",
              "runtime/arcorbit/desktop/preload.cjs",
              "runtime/arcorbit/desktop/renderer/renderer.js",
              "runtime/arcorbit/desktop/renderer/styles.css",
              "runtime/arcorbit/test/automation-coordinator.test.mjs",
              "runtime/arcorbit/test/desktop-store.test.mjs",
              "runtime/arcorbit/test/desktop-renderer.test.mjs",
              "runtime/arcorbit/test/work-sync-coordinator.test.mjs",
              "Focused Automation/Store/Renderer/Work Sync regression: 115 passed, 0 failed.",
              "ArcOrbit full test run: 396 passed, 9 environment-gated skips; its only sandbox-blocked Electron fixture passed through the approved Electron entrypoint.",
              "Electron experience-realization fixture: all 10 pages and control, keyboard, title, and layout assertions passed."
            ],
            "gap_refs": []
          },
          {
            "invariant_ref": "visual-language-remains-consistent",
            "disposition": "upheld",
            "reason": "The active-execution selector reuses existing cards, pills, tokens, typography, and responsive grid behavior.",
            "fact_refs": [
              "FACT-MULTI-PROJECT-INTERACTION",
              "FACT-MULTI-PROJECT-AUTOMATION-IMPLEMENTED"
            ],
            "evidence": [
              "runtime/arcorbit/desktop/renderer/renderer.js",
              "runtime/arcorbit/desktop/renderer/styles.css",
              "Electron experience-realization fixture passed."
            ],
            "gap_refs": []
          },
          {
            "invariant_ref": "technical-decisions-remain-explainable",
            "disposition": "upheld",
            "reason": "The supervisor/lane split, persisted execution collection, stable execution identity, lane metadata, bounded cap, and explicit global recovery scope match the accepted technical sources.",
            "fact_refs": [
              "FACT-MULTI-PROJECT-EXECUTION-CONTRACT",
              "FACT-MULTI-PROJECT-AUTOMATION-IMPLEMENTED"
            ],
            "evidence": [
              "runtime/arcorbit/src/automation-coordinator.mjs",
              "runtime/arcorbit/src/desktop/desktop-store.mjs",
              "runtime/arcorbit/src/work-sync-coordinator.mjs",
              "runtime/arcorbit/src/desktop-run-manager.mjs",
              "runtime/arcorbit/desktop/main.mjs",
              "runtime/arcorbit/desktop/preload.cjs",
              "runtime/arcorbit/desktop/renderer/renderer.js",
              "runtime/arcorbit/desktop/renderer/styles.css",
              "runtime/arcorbit/test/automation-coordinator.test.mjs",
              "runtime/arcorbit/test/desktop-store.test.mjs",
              "runtime/arcorbit/test/desktop-renderer.test.mjs",
              "runtime/arcorbit/test/work-sync-coordinator.test.mjs",
              "Focused Automation/Store/Renderer/Work Sync regression: 115 passed, 0 failed.",
              "ArcOrbit full test run: 396 passed, 9 environment-gated skips; its only sandbox-blocked Electron fixture passed through the approved Electron entrypoint.",
              "Electron experience-realization fixture: all 10 pages and control, keyboard, title, and layout assertions passed."
            ],
            "gap_refs": []
          },
          {
            "invariant_ref": "accepted-facts-are-realized",
            "disposition": "upheld",
            "reason": "Independent workspaces run concurrently, each workspace owns one serial lease, and all operator actions route to one stable execution.",
            "fact_refs": [
              "FACT-MULTI-PROJECT-EXECUTION-CONTRACT",
              "FACT-MULTI-PROJECT-INTERACTION",
              "FACT-MULTI-PROJECT-AUTOMATION-IMPLEMENTED"
            ],
            "evidence": [
              "runtime/arcorbit/src/automation-coordinator.mjs",
              "runtime/arcorbit/src/desktop/desktop-store.mjs",
              "runtime/arcorbit/src/work-sync-coordinator.mjs",
              "runtime/arcorbit/src/desktop-run-manager.mjs",
              "runtime/arcorbit/desktop/main.mjs",
              "runtime/arcorbit/desktop/preload.cjs",
              "runtime/arcorbit/desktop/renderer/renderer.js",
              "runtime/arcorbit/desktop/renderer/styles.css",
              "runtime/arcorbit/test/automation-coordinator.test.mjs",
              "runtime/arcorbit/test/desktop-store.test.mjs",
              "runtime/arcorbit/test/desktop-renderer.test.mjs",
              "runtime/arcorbit/test/work-sync-coordinator.test.mjs",
              "Focused Automation/Store/Renderer/Work Sync regression: 115 passed, 0 failed.",
              "ArcOrbit full test run: 396 passed, 9 environment-gated skips; its only sandbox-blocked Electron fixture passed through the approved Electron entrypoint.",
              "Electron experience-realization fixture: all 10 pages and control, keyboard, title, and layout assertions passed."
            ],
            "gap_refs": []
          },
          {
            "invariant_ref": "material-risks-have-credible-evidence",
            "disposition": "upheld",
            "reason": "Repeatable tests cover the three-lane cap, same-workspace serialization, targeted control and recovery isolation, singleton migration, renderer routing, and existing Automation regressions.",
            "fact_refs": [
              "FACT-MULTI-PROJECT-EXECUTION-CONTRACT",
              "FACT-MULTI-PROJECT-AUTOMATION-IMPLEMENTED"
            ],
            "evidence": [
              "runtime/arcorbit/src/automation-coordinator.mjs",
              "runtime/arcorbit/src/desktop/desktop-store.mjs",
              "runtime/arcorbit/src/work-sync-coordinator.mjs",
              "runtime/arcorbit/src/desktop-run-manager.mjs",
              "runtime/arcorbit/desktop/main.mjs",
              "runtime/arcorbit/desktop/preload.cjs",
              "runtime/arcorbit/desktop/renderer/renderer.js",
              "runtime/arcorbit/desktop/renderer/styles.css",
              "runtime/arcorbit/test/automation-coordinator.test.mjs",
              "runtime/arcorbit/test/desktop-store.test.mjs",
              "runtime/arcorbit/test/desktop-renderer.test.mjs",
              "runtime/arcorbit/test/work-sync-coordinator.test.mjs",
              "Focused Automation/Store/Renderer/Work Sync regression: 115 passed, 0 failed.",
              "ArcOrbit full test run: 396 passed, 9 environment-gated skips; its only sandbox-blocked Electron fixture passed through the approved Electron entrypoint.",
              "Electron experience-realization fixture: all 10 pages and control, keyboard, title, and layout assertions passed."
            ],
            "gap_refs": []
          }
        ]
      },
      "evidence": [
        "runtime/arcorbit/src/automation-coordinator.mjs",
        "runtime/arcorbit/src/desktop/desktop-store.mjs",
        "runtime/arcorbit/src/work-sync-coordinator.mjs",
        "runtime/arcorbit/src/desktop-run-manager.mjs",
        "runtime/arcorbit/desktop/main.mjs",
        "runtime/arcorbit/desktop/preload.cjs",
        "runtime/arcorbit/desktop/renderer/renderer.js",
        "runtime/arcorbit/desktop/renderer/styles.css",
        "runtime/arcorbit/test/automation-coordinator.test.mjs",
        "runtime/arcorbit/test/desktop-store.test.mjs",
        "runtime/arcorbit/test/desktop-renderer.test.mjs",
        "runtime/arcorbit/test/work-sync-coordinator.test.mjs",
        "Focused Automation/Store/Renderer/Work Sync regression after restart coverage: 116 passed, 0 failed.",
        "ArcOrbit broader test run: 396 passed, 9 environment-gated skips; the sandbox-blocked Electron fixture passed separately through the approved Electron entrypoint.",
        "git diff --check passed.",
        "Completion self-review found no correctness, resolution, verification, regression, or minimality finding."
      ],
      "runtime_result_ref": "",
      "occurred_at": "2026-08-25T08:22:01.846Z"
    }
  ],
  "case_resolution": {
    "status": "resolved",
    "stage": "resolved",
    "satisfied": [
      "GAP-ACCEPT-MULTI-PROJECT-EXECUTION-BOUNDARY",
      "GAP-DEFINE-MULTI-PROJECT-AUTOMATION-INTERACTION",
      "GAP-IMPLEMENT-MULTI-PROJECT-AUTOMATION"
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
    "updated_at": "2026-08-25T08:22:01.846Z"
  }
}
```

## Round Notes

- Case history is canonical in Structured Record.rounds; keep prose notes exceptional.
