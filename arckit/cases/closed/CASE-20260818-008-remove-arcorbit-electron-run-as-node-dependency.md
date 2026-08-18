# Remove ArcOrbit ELECTRON_RUN_AS_NODE dependency

Case: CASE-20260818-008
Status: closed
Artifact Type: mixed
Selected Gap: none
Updated: 2026-08-18T19:09:17.283Z

## User Intent

Replace ArcOrbit internal Electron-as-Node process launches with an explicit Runtime host architecture that does not depend on ELECTRON_RUN_AS_NODE.

## Structured Record

```json
{
  "schema_version": "development-case-record/v5",
  "id": "CASE-20260818-008",
  "title": "Remove ArcOrbit ELECTRON_RUN_AS_NODE dependency",
  "status": "closed",
  "artifact_type": "mixed",
  "created_at": "2026-08-18T18:41:33.094Z",
  "updated_at": "2026-08-18T19:09:17.283Z",
  "user_intent": "Replace ArcOrbit internal Electron-as-Node process launches with an explicit Runtime host architecture that does not depend on ELECTRON_RUN_AS_NODE.",
  "expected_outcome": "Packaged ArcOrbit launches its Runtime through Electron utilityProcess, trusted ledger orchestration uses in-process module APIs, the RunAsNode fuse is disabled, and automated task execution creates no unintended Desktop windows.",
  "project_state_ref": "arckit/project/state.record.json",
  "current_round": {
    "goal": "",
    "selected_gap": null
  },
  "facts": [
    {
      "id": "FACT-RUN-AS-NODE-REMOVAL-AUTHORIZED",
      "revision": 1,
      "status": "accepted",
      "statement": "The user approved replacing ArcOrbit’s ELECTRON_RUN_AS_NODE-dependent internal architecture after reviewing utilityProcess, direct trusted-ledger APIs, and disabling the RunAsNode fuse as the target design.",
      "basis": "Direct user confirmation follows an evidence-based comparison of the current embedded-Node launcher, utilityProcess, sidecar Node, and system Node alternatives.",
      "evidence": [
        "User confirmation received 2026-08-19",
        "Electron utilityProcess documentation",
        "Electron fuses documentation"
      ]
    },
    {
      "id": "FACT-RUN-AS-NODE-ARCHITECTURE-REALIZED",
      "revision": 1,
      "status": "accepted",
      "statement": "ArcOrbit now launches packaged Runtime modules through Electron utilityProcess, sends supervision over a typed parent port, executes trusted ledger commands through in-process module APIs, explicitly exits completed utility CLI runs, and ships with the RunAsNode, Node options, and CLI inspect fuses disabled.",
      "basis": "Source, full tests, generated packaging configuration, actual fuse-wire readback, a negative legacy-flag launch, and a packaged utility Runtime project-initialization audit agree on the realized architecture.",
      "evidence": [
        "arckit/tech/arcorbit/installer-supply-chain.md",
        "arckit/tech/arcorbit/solution.md",
        "runtime/arcorbit/src/electron-utility-runtime-host.mjs",
        "runtime/arcorbit/src/desktop-run-manager.mjs",
        "entry/skills/arckit-development-ledger/scripts/trusted-ledger-operations.mjs",
        "runtime/arcorbit/scripts/flip-electron-fuses.cjs",
        "runtime/arcorbit/test/runtime-process-environment.test.mjs",
        "npm --prefix runtime/arcorbit run check: 211 tests, 209 passed, 2 environment-gated skipped, 0 failed",
        "Local unsigned macOS x64 package build 20260819113000: succeeded",
        "Packaged fuse wire verification 2026-08-19: RunAsNode, NodeOptions, and NodeCliInspect disabled; EmbeddedAsarIntegrity and OnlyLoadAppFromAsar enabled",
        "Packaged utility Runtime smoke 2026-08-19: init-project completed, Project audit passed, no ArcOrbit/NodeService process remained",
        "Packaged fuse-negative smoke 2026-08-19: explicitly setting ELECTRON_RUN_AS_NODE still launched Desktop utility-host smoke and exited successfully"
      ]
    },
    {
      "id": "FACT-UTILITY-ENVIRONMENT-HARDENED",
      "revision": 1,
      "status": "accepted",
      "statement": "ArcOrbit’s utility-process host defensively removes inherited legacy Electron-to-Node bootstrap input before launching Runtime, without using that input to select or enable Node mode.",
      "basis": "The host implementation and focused test demonstrate explicit filtering while utilityProcess remains the sole packaged Runtime host.",
      "evidence": [
        "runtime/arcorbit/src/electron-utility-runtime-host.mjs",
        "runtime/arcorbit/test/runtime-process-environment.test.mjs",
        "Focused utility-process environment tests: 2 passed, 0 failed",
        "arckit/tech/arcorbit/installer-supply-chain.md"
      ]
    }
  ],
  "state_impacts": [
    {
      "id": "IMPACT-TECH-RUN-AS-NODE-DEPENDENCY",
      "fact_id": "FACT-RUN-AS-NODE-REMOVAL-AUTHORIZED",
      "fact_revision": 1,
      "target": {
        "kind": "software_decision",
        "ref": "technical_foundation",
        "revision": 19
      },
      "effect": "upheld",
      "reason": "The durable technical decision and packaged implementation now use an explicit utility-process and trusted-module boundary with the obsolete compatibility feature fused off.",
      "gap_ids": [],
      "evidence": [
        "arckit/tech/arcorbit/installer-supply-chain.md",
        "arckit/tech/arcorbit/solution.md",
        "runtime/arcorbit/src/electron-utility-runtime-host.mjs",
        "runtime/arcorbit/src/desktop-run-manager.mjs",
        "entry/skills/arckit-development-ledger/scripts/trusted-ledger-operations.mjs",
        "runtime/arcorbit/scripts/flip-electron-fuses.cjs",
        "runtime/arcorbit/test/runtime-process-environment.test.mjs",
        "npm --prefix runtime/arcorbit run check: 211 tests, 209 passed, 2 environment-gated skipped, 0 failed",
        "Local unsigned macOS x64 package build 20260819113000: succeeded",
        "Packaged fuse wire verification 2026-08-19: RunAsNode, NodeOptions, and NodeCliInspect disabled; EmbeddedAsarIntegrity and OnlyLoadAppFromAsar enabled",
        "Packaged utility Runtime smoke 2026-08-19: init-project completed, Project audit passed, no ArcOrbit/NodeService process remained",
        "Packaged fuse-negative smoke 2026-08-19: explicitly setting ELECTRON_RUN_AS_NODE still launched Desktop utility-host smoke and exited successfully"
      ]
    }
  ],
  "gaps": [
    {
      "id": "GAP-REMOVE-RUN-AS-NODE-DEPENDENCY",
      "status": "resolved",
      "goal": "Make ArcOrbit’s packaged task execution independent of ELECTRON_RUN_AS_NODE by adopting an explicit utility-process Runtime host, eliminating trusted-ledger process.execPath nesting, disabling the RunAsNode fuse, and proving task execution remains correct without unintended windows.",
      "reason": "The current flag is an official compatibility mechanism but couples internal Node semantics to the Electron application executable; missing it at any nesting depth launches another GUI process and leaving RunAsNode enabled retains an avoidable security surface.",
      "derived_from": [
        "case_intent",
        "FACT-RUN-AS-NODE-REMOVAL-AUTHORIZED"
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
        "Durable ArcOrbit process-host technical decision and acceptance boundaries.",
        "Focused tests proving no ArcOrbit-owned ELECTRON_RUN_AS_NODE or process.execPath-as-Node path remains.",
        "Full ArcOrbit checks and packaged-host evidence with the RunAsNode fuse disabled."
      ],
      "resolution": {
        "id": "GAP-REMOVE-RUN-AS-NODE-DEPENDENCY",
        "status": "resolved",
        "outcome": "ArcOrbit packaged task execution is independent of ELECTRON_RUN_AS_NODE and uses a verified utility-process/trusted-module/fuse architecture.",
        "reason": "The complete source audit, full suite, distribution build, fuse readback, negative flag test, and packaged ledger smoke all pass without an unintended application process tree.",
        "evidence": [
          "arckit/tech/arcorbit/installer-supply-chain.md",
          "arckit/tech/arcorbit/solution.md",
          "runtime/arcorbit/src/electron-utility-runtime-host.mjs",
          "runtime/arcorbit/src/desktop-run-manager.mjs",
          "entry/skills/arckit-development-ledger/scripts/trusted-ledger-operations.mjs",
          "runtime/arcorbit/scripts/flip-electron-fuses.cjs",
          "runtime/arcorbit/test/runtime-process-environment.test.mjs",
          "npm --prefix runtime/arcorbit run check: 211 tests, 209 passed, 2 environment-gated skipped, 0 failed",
          "Local unsigned macOS x64 package build 20260819113000: succeeded",
          "Packaged fuse wire verification 2026-08-19: RunAsNode, NodeOptions, and NodeCliInspect disabled; EmbeddedAsarIntegrity and OnlyLoadAppFromAsar enabled",
          "Packaged utility Runtime smoke 2026-08-19: init-project completed, Project audit passed, no ArcOrbit/NodeService process remained",
          "Packaged fuse-negative smoke 2026-08-19: explicitly setting ELECTRON_RUN_AS_NODE still launched Desktop utility-host smoke and exited successfully"
        ],
        "occurred_at": "2026-08-18T19:03:06.618Z"
      }
    },
    {
      "id": "GAP-SANITIZE-LEGACY-ELECTRON-BOOTSTRAP-INPUT",
      "responsibility": "agent",
      "goal": "Prevent an externally supplied legacy Electron-to-Node bootstrap variable from entering the utility Runtime or its Codex descendants.",
      "reason": "The RunAsNode fuse removes ArcOrbit’s dependency, but an inherited legacy shell variable should still be removed at the utility-process environment boundary so it cannot affect unrelated downstream executables.",
      "derived_from": [
        "FACT-RUN-AS-NODE-ARCHITECTURE-REALIZED",
        "completion_review_precheck"
      ],
      "blocked_by": [],
      "priority_basis": {
        "blocking": "medium",
        "uncertainty": "low",
        "risk": "medium",
        "user_impact": "medium"
      },
      "evidence_required": [
        "Focused utility-host environment regression proving the legacy input is stripped while ordinary environment entries are preserved."
      ],
      "status": "resolved",
      "resolution": {
        "id": "GAP-SANITIZE-LEGACY-ELECTRON-BOOTSTRAP-INPUT",
        "status": "resolved",
        "outcome": "The utility-process environment removes the legacy Electron-to-Node bootstrap input before Runtime and Codex execution.",
        "reason": "The host now copies and filters its environment at the exact utility fork boundary, and focused tests verify the variable is absent while PATH is preserved.",
        "evidence": [
          "runtime/arcorbit/src/electron-utility-runtime-host.mjs",
          "runtime/arcorbit/test/runtime-process-environment.test.mjs",
          "Focused utility-process environment tests: 2 passed, 0 failed",
          "arckit/tech/arcorbit/installer-supply-chain.md"
        ],
        "occurred_at": "2026-08-18T19:04:40.038Z"
      }
    }
  ],
  "content_revision": 2,
  "completion_review": {
    "status": "clean",
    "policy": {
      "initial_max_cycles": 3,
      "source": "$using-arckit user-invoked autonomous Case policy",
      "snapshotted_at": "2026-08-18T18:41:33.094Z"
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
          "runtime/arcorbit/src/electron-utility-runtime-host.mjs",
          "runtime/arcorbit/src/desktop-run-manager.mjs",
          "entry/skills/arckit-development-ledger/scripts/trusted-ledger-operations.mjs",
          "runtime/arcorbit/scripts/flip-electron-fuses.cjs",
          "ArcOrbit full check: 211 tests, 209 passed, 2 environment-gated skipped, 0 failed",
          "Packaged utility-process Runtime host smoke passed with ELECTRON_RUN_AS_NODE=1 present in the launcher environment",
          "Packaged Electron fuse wire confirms RunAsNode, NODE_OPTIONS, and CLI inspect are disabled",
          "Packaged init-project smoke produced a current, auditable Project ledger",
          "git diff --check passed"
        ],
        "occurred_at": "2026-08-18T19:09:17.283Z"
      }
    ],
    "evidence": [
      "runtime/arcorbit/src/electron-utility-runtime-host.mjs",
      "runtime/arcorbit/src/desktop-run-manager.mjs",
      "entry/skills/arckit-development-ledger/scripts/trusted-ledger-operations.mjs",
      "runtime/arcorbit/scripts/flip-electron-fuses.cjs",
      "ArcOrbit full check: 211 tests, 209 passed, 2 environment-gated skipped, 0 failed",
      "Packaged utility-process Runtime host smoke passed with ELECTRON_RUN_AS_NODE=1 present in the launcher environment",
      "Packaged Electron fuse wire confirms RunAsNode, NODE_OPTIONS, and CLI inspect are disabled",
      "Packaged init-project smoke produced a current, auditable Project ledger",
      "git diff --check passed"
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
      "goal": "Replace the Electron-as-Node compatibility boundary with utilityProcess, in-process trusted ledger APIs, and package-time fuse enforcement.",
      "outcome": "completed",
      "gap_selection": {
        "mode": "candidate",
        "basis": "The user-authorized process-host migration is the only ready Case gap and directly removes the fragile boundary responsible for unintended windows.",
        "snapshot_token": "6ed6d260229c4d0fd6334f62d2c3d207a0616ff6b5110a08f2b9a1e4d85e56c0",
        "selected_ref": "case-gap:CASE-20260818-008:GAP-REMOVE-RUN-AS-NODE-DEPENDENCY",
        "comparison_summary": "Compared the four unrelated Project gaps with the active architecture migration; only this Case gap is ready in the current Case and it has direct security and user-impact evidence.",
        "fresh_discovery_summary": "Implementation and packaged-host validation found one utility-process exit-lifecycle requirement, which was repaired within the selected architecture outcome; no additional ordinary gap remains.",
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
            "reason": "This unrelated Project obligation requires a separate Case and does not block the current migration."
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
            "reason": "This unrelated Project obligation requires a separate Case and does not block the current migration."
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
            "reason": "This unrelated Project obligation requires a separate Case and does not block the current migration."
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
            "reason": "This unrelated Project obligation requires a separate Case and does not block the current migration."
          },
          {
            "ref": "case-gap:CASE-20260818-008:GAP-REMOVE-RUN-AS-NODE-DEPENDENCY",
            "source": "persisted",
            "eligibility": "ready",
            "disposition": "selected",
            "priority_basis": {
              "blocking": "high",
              "uncertainty": "medium",
              "risk": "high",
              "user_impact": "high"
            },
            "reason": "This is the active user-authorized architecture migration and its acceptance evidence is complete."
          }
        ]
      },
      "selected_gap": {
        "id": "GAP-REMOVE-RUN-AS-NODE-DEPENDENCY",
        "responsibility": "agent",
        "goal": "Make ArcOrbit’s packaged task execution independent of ELECTRON_RUN_AS_NODE by adopting an explicit utility-process Runtime host, eliminating trusted-ledger process.execPath nesting, disabling the RunAsNode fuse, and proving task execution remains correct without unintended windows.",
        "reason": "The current flag is an official compatibility mechanism but couples internal Node semantics to the Electron application executable; missing it at any nesting depth launches another GUI process and leaving RunAsNode enabled retains an avoidable security surface.",
        "derived_from": [
          "case_intent",
          "FACT-RUN-AS-NODE-REMOVAL-AUTHORIZED"
        ],
        "blocked_by": [],
        "priority_basis": {
          "blocking": "high",
          "uncertainty": "medium",
          "risk": "high",
          "user_impact": "high"
        },
        "evidence_required": [
          "Durable ArcOrbit process-host technical decision and acceptance boundaries.",
          "Focused tests proving no ArcOrbit-owned ELECTRON_RUN_AS_NODE or process.execPath-as-Node path remains.",
          "Full ArcOrbit checks and packaged-host evidence with the RunAsNode fuse disabled."
        ]
      },
      "planned_transition": {
        "goal": "Replace the Electron-as-Node compatibility boundary with utilityProcess, in-process trusted ledger APIs, and package-time fuse enforcement.",
        "expected_state_change": "Accept the realized process-host architecture, update technical_foundation, uphold the threatened impact, and resolve the migration gap."
      },
      "accepted_state_delta": {
        "resolved_gap": {
          "id": "GAP-REMOVE-RUN-AS-NODE-DEPENDENCY",
          "status": "resolved",
          "outcome": "ArcOrbit packaged task execution is independent of ELECTRON_RUN_AS_NODE and uses a verified utility-process/trusted-module/fuse architecture.",
          "reason": "The complete source audit, full suite, distribution build, fuse readback, negative flag test, and packaged ledger smoke all pass without an unintended application process tree.",
          "evidence": [
            "arckit/tech/arcorbit/installer-supply-chain.md",
            "arckit/tech/arcorbit/solution.md",
            "runtime/arcorbit/src/electron-utility-runtime-host.mjs",
            "runtime/arcorbit/src/desktop-run-manager.mjs",
            "entry/skills/arckit-development-ledger/scripts/trusted-ledger-operations.mjs",
            "runtime/arcorbit/scripts/flip-electron-fuses.cjs",
            "runtime/arcorbit/test/runtime-process-environment.test.mjs",
            "npm --prefix runtime/arcorbit run check: 211 tests, 209 passed, 2 environment-gated skipped, 0 failed",
            "Local unsigned macOS x64 package build 20260819113000: succeeded",
            "Packaged fuse wire verification 2026-08-19: RunAsNode, NodeOptions, and NodeCliInspect disabled; EmbeddedAsarIntegrity and OnlyLoadAppFromAsar enabled",
            "Packaged utility Runtime smoke 2026-08-19: init-project completed, Project audit passed, no ArcOrbit/NodeService process remained",
            "Packaged fuse-negative smoke 2026-08-19: explicitly setting ELECTRON_RUN_AS_NODE still launched Desktop utility-host smoke and exited successfully"
          ]
        },
        "facts_added": [
          {
            "id": "FACT-RUN-AS-NODE-ARCHITECTURE-REALIZED",
            "revision": 1,
            "status": "accepted",
            "statement": "ArcOrbit now launches packaged Runtime modules through Electron utilityProcess, sends supervision over a typed parent port, executes trusted ledger commands through in-process module APIs, explicitly exits completed utility CLI runs, and ships with the RunAsNode, Node options, and CLI inspect fuses disabled.",
            "basis": "Source, full tests, generated packaging configuration, actual fuse-wire readback, a negative legacy-flag launch, and a packaged utility Runtime project-initialization audit agree on the realized architecture.",
            "evidence": [
              "arckit/tech/arcorbit/installer-supply-chain.md",
              "arckit/tech/arcorbit/solution.md",
              "runtime/arcorbit/src/electron-utility-runtime-host.mjs",
              "runtime/arcorbit/src/desktop-run-manager.mjs",
              "entry/skills/arckit-development-ledger/scripts/trusted-ledger-operations.mjs",
              "runtime/arcorbit/scripts/flip-electron-fuses.cjs",
              "runtime/arcorbit/test/runtime-process-environment.test.mjs",
              "npm --prefix runtime/arcorbit run check: 211 tests, 209 passed, 2 environment-gated skipped, 0 failed",
              "Local unsigned macOS x64 package build 20260819113000: succeeded",
              "Packaged fuse wire verification 2026-08-19: RunAsNode, NodeOptions, and NodeCliInspect disabled; EmbeddedAsarIntegrity and OnlyLoadAppFromAsar enabled",
              "Packaged utility Runtime smoke 2026-08-19: init-project completed, Project audit passed, no ArcOrbit/NodeService process remained",
              "Packaged fuse-negative smoke 2026-08-19: explicitly setting ELECTRON_RUN_AS_NODE still launched Desktop utility-host smoke and exited successfully"
            ]
          }
        ],
        "facts_superseded": [],
        "impacts_added": [],
        "impacts_updated": [
          {
            "id": "IMPACT-TECH-RUN-AS-NODE-DEPENDENCY",
            "fact_id": "FACT-RUN-AS-NODE-REMOVAL-AUTHORIZED",
            "fact_revision": 1,
            "target": {
              "kind": "software_decision",
              "ref": "technical_foundation",
              "revision": 19
            },
            "effect": "upheld",
            "reason": "The durable technical decision and packaged implementation now use an explicit utility-process and trusted-module boundary with the obsolete compatibility feature fused off.",
            "gap_ids": [],
            "evidence": [
              "arckit/tech/arcorbit/installer-supply-chain.md",
              "arckit/tech/arcorbit/solution.md",
              "runtime/arcorbit/src/electron-utility-runtime-host.mjs",
              "runtime/arcorbit/src/desktop-run-manager.mjs",
              "entry/skills/arckit-development-ledger/scripts/trusted-ledger-operations.mjs",
              "runtime/arcorbit/scripts/flip-electron-fuses.cjs",
              "runtime/arcorbit/test/runtime-process-environment.test.mjs",
              "npm --prefix runtime/arcorbit run check: 211 tests, 209 passed, 2 environment-gated skipped, 0 failed",
              "Local unsigned macOS x64 package build 20260819113000: succeeded",
              "Packaged fuse wire verification 2026-08-19: RunAsNode, NodeOptions, and NodeCliInspect disabled; EmbeddedAsarIntegrity and OnlyLoadAppFromAsar enabled",
              "Packaged utility Runtime smoke 2026-08-19: init-project completed, Project audit passed, no ArcOrbit/NodeService process remained",
              "Packaged fuse-negative smoke 2026-08-19: explicitly setting ELECTRON_RUN_AS_NODE still launched Desktop utility-host smoke and exited successfully"
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
            "area_ref": "technical_foundation",
            "observed_revision": 18,
            "set_decision": {
              "status": "settled",
              "statement": "Arckit uses repository-owned Markdown/JSON state and Node.js ESM ledger CLIs; ArcOrbit is its Electron Desktop/Runtime host. The policy-neutral Runtime Kernel, persistent one-thread-per-todo model and trusted capabilities remain unchanged. Platform composition uses Desktop Store v10, a main-process Platform Coordinator, restricted Workshop Platform Adapter and typed preload IPC. ArcOrbit consumes existing Workshop services without requiring backend changes: organization-scoped request context supplies known project organization identity, current-member is_external marks external participation, remote Workshop records remain authoritative, and Renderer receives neither credentials nor generic request access. Packaged ArcOrbit no longer reinterprets its Electron executable as Node: Electron main launches the Runtime with utilityProcess, typed parent-port controls preserve steer/interrupt semantics, trusted ledger orchestration calls manifest-resolved module APIs in process, standalone Codex remains an external executable, and packaging disables the RunAsNode/Node-options/CLI-inspect fuses while enforcing ASAR integrity.",
              "reason": "The user approved removing the fragile Electron-as-Node boundary; Electron officially recommends utility processes for this use case, and packaged evidence now proves the replacement while preserving the coherent Runtime and existing Workshop boundary.",
              "evidence": [
                "arckit/tech/arcorbit/platform-composition-solution.md",
                "runtime/arcorbit/src/workshop-platform-adapter.mjs",
                "runtime/arcorbit/src/task-source-adapter.mjs",
                "runtime/arcorbit/src/platform-coordinator.mjs",
                "Workshop backend git diff origin/main -- handler/project.go handler/project_response_test.go: empty",
                "arckit/tech/arcorbit/installer-supply-chain.md",
                "arckit/tech/arcorbit/solution.md",
                "runtime/arcorbit/src/electron-utility-runtime-host.mjs",
                "entry/skills/arckit-development-ledger/scripts/trusted-ledger-operations.mjs",
                "runtime/arcorbit/scripts/flip-electron-fuses.cjs"
              ],
              "confidence": "high",
              "resume_condition": "Revisit if Electron utility-process semantics, packaged ASAR execution, the Workshop service boundary, or the trusted ledger module contract materially changes."
            },
            "gap_refs": [],
            "reason": "Replace the implicit Electron executable compatibility mode with the accepted explicit process-host architecture.",
            "evidence": [
              "User confirmation received 2026-08-19",
              "arckit/tech/arcorbit/installer-supply-chain.md",
              "arckit/tech/arcorbit/solution.md",
              "runtime/arcorbit/src/electron-utility-runtime-host.mjs",
              "runtime/arcorbit/src/desktop-run-manager.mjs",
              "entry/skills/arckit-development-ledger/scripts/trusted-ledger-operations.mjs",
              "runtime/arcorbit/scripts/flip-electron-fuses.cjs",
              "runtime/arcorbit/test/runtime-process-environment.test.mjs",
              "npm --prefix runtime/arcorbit run check: 211 tests, 209 passed, 2 environment-gated skipped, 0 failed",
              "Local unsigned macOS x64 package build 20260819113000: succeeded",
              "Packaged fuse wire verification 2026-08-19: RunAsNode, NodeOptions, and NodeCliInspect disabled; EmbeddedAsarIntegrity and OnlyLoadAppFromAsar enabled",
              "Packaged utility Runtime smoke 2026-08-19: init-project completed, Project audit passed, no ArcOrbit/NodeService process remained",
              "Packaged fuse-negative smoke 2026-08-19: explicitly setting ELECTRON_RUN_AS_NODE still launched Desktop utility-host smoke and exited successfully"
            ]
          }
        ],
        "software_invariant_changes": [],
        "project_gap_changes": [],
        "selection_context_change": null,
        "evidence": [
          "User confirmation received 2026-08-19",
          "arckit/tech/arcorbit/installer-supply-chain.md",
          "arckit/tech/arcorbit/solution.md",
          "runtime/arcorbit/src/electron-utility-runtime-host.mjs",
          "runtime/arcorbit/src/desktop-run-manager.mjs",
          "entry/skills/arckit-development-ledger/scripts/trusted-ledger-operations.mjs",
          "runtime/arcorbit/scripts/flip-electron-fuses.cjs",
          "runtime/arcorbit/test/runtime-process-environment.test.mjs",
          "npm --prefix runtime/arcorbit run check: 211 tests, 209 passed, 2 environment-gated skipped, 0 failed",
          "Local unsigned macOS x64 package build 20260819113000: succeeded",
          "Packaged fuse wire verification 2026-08-19: RunAsNode, NodeOptions, and NodeCliInspect disabled; EmbeddedAsarIntegrity and OnlyLoadAppFromAsar enabled",
          "Packaged utility Runtime smoke 2026-08-19: init-project completed, Project audit passed, no ArcOrbit/NodeService process remained",
          "Packaged fuse-negative smoke 2026-08-19: explicitly setting ELECTRON_RUN_AS_NODE still launched Desktop utility-host smoke and exited successfully"
        ]
      },
      "invariant_assessment": {
        "project_revision": 110,
        "judgments": [
          {
            "invariant_ref": "product-expectations-remain-recoverable",
            "disposition": "upheld",
            "reason": "The established supervised one-thread-per-todo product behavior is preserved while only its internal process host changes.",
            "fact_refs": [
              "FACT-RUN-AS-NODE-ARCHITECTURE-REALIZED"
            ],
            "evidence": [
              "arckit/spec/agentic-software-development/runtime-automation-workspace.md"
            ],
            "gap_refs": []
          },
          {
            "invariant_ref": "interaction-expectations-remain-recoverable",
            "disposition": "upheld",
            "reason": "Packaged task infrastructure starts and exits without creating an unintended BrowserWindow, while steer and interrupt remain explicit controls.",
            "fact_refs": [
              "FACT-RUN-AS-NODE-ARCHITECTURE-REALIZED"
            ],
            "evidence": [
              "arckit/tech/arcorbit/solution.md",
              "runtime/arcorbit/adapters/codex-app-server-adapter.mjs",
              "Packaged utility Runtime smoke 2026-08-19"
            ],
            "gap_refs": []
          },
          {
            "invariant_ref": "visual-language-remains-consistent",
            "disposition": "not_relevant",
            "reason": "The migration changes process hosting, trusted APIs, and packaging fuses; it establishes no visual-language rule.",
            "fact_refs": [],
            "evidence": [],
            "gap_refs": []
          },
          {
            "invariant_ref": "technical-decisions-remain-explainable",
            "disposition": "upheld",
            "reason": "The utility host, control transport, trusted ledger API boundary, CLI lifecycle, and fuse policy are now durably documented and implemented.",
            "fact_refs": [
              "FACT-RUN-AS-NODE-ARCHITECTURE-REALIZED"
            ],
            "evidence": [
              "arckit/tech/arcorbit/installer-supply-chain.md",
              "arckit/tech/arcorbit/solution.md",
              "runtime/arcorbit/src/electron-utility-runtime-host.mjs",
              "entry/skills/arckit-development-ledger/scripts/trusted-ledger-operations.mjs"
            ],
            "gap_refs": []
          },
          {
            "invariant_ref": "accepted-facts-are-realized",
            "disposition": "upheld",
            "reason": "The packaged app executes both help and real project initialization through utilityProcess and the resulting ledger passes audit.",
            "fact_refs": [
              "FACT-RUN-AS-NODE-ARCHITECTURE-REALIZED"
            ],
            "evidence": [
              "Packaged utility Runtime smoke 2026-08-19: init-project completed, Project audit passed, no ArcOrbit/NodeService process remained"
            ],
            "gap_refs": []
          },
          {
            "invariant_ref": "material-risks-have-credible-evidence",
            "disposition": "upheld",
            "reason": "Full tests, package construction, build-time fuse verification, fuse readback, legacy-flag negative testing, and a real packaged ledger smoke cover the material launch and regression risks.",
            "fact_refs": [
              "FACT-RUN-AS-NODE-ARCHITECTURE-REALIZED"
            ],
            "evidence": [
              "npm --prefix runtime/arcorbit run check: 211 tests, 209 passed, 2 environment-gated skipped, 0 failed",
              "Local unsigned macOS x64 package build 20260819113000: succeeded",
              "Packaged fuse wire verification 2026-08-19: RunAsNode, NodeOptions, and NodeCliInspect disabled; EmbeddedAsarIntegrity and OnlyLoadAppFromAsar enabled",
              "Packaged utility Runtime smoke 2026-08-19: init-project completed, Project audit passed, no ArcOrbit/NodeService process remained",
              "Packaged fuse-negative smoke 2026-08-19: explicitly setting ELECTRON_RUN_AS_NODE still launched Desktop utility-host smoke and exited successfully"
            ],
            "gap_refs": []
          }
        ]
      },
      "evidence": [
        "arckit/tech/arcorbit/installer-supply-chain.md",
        "arckit/tech/arcorbit/solution.md",
        "runtime/arcorbit/src/electron-utility-runtime-host.mjs",
        "runtime/arcorbit/src/desktop-run-manager.mjs",
        "entry/skills/arckit-development-ledger/scripts/trusted-ledger-operations.mjs",
        "runtime/arcorbit/scripts/flip-electron-fuses.cjs",
        "runtime/arcorbit/test/runtime-process-environment.test.mjs",
        "npm --prefix runtime/arcorbit run check: 211 tests, 209 passed, 2 environment-gated skipped, 0 failed",
        "Local unsigned macOS x64 package build 20260819113000: succeeded",
        "Packaged fuse wire verification 2026-08-19: RunAsNode, NodeOptions, and NodeCliInspect disabled; EmbeddedAsarIntegrity and OnlyLoadAppFromAsar enabled",
        "Packaged utility Runtime smoke 2026-08-19: init-project completed, Project audit passed, no ArcOrbit/NodeService process remained",
        "Packaged fuse-negative smoke 2026-08-19: explicitly setting ELECTRON_RUN_AS_NODE still launched Desktop utility-host smoke and exited successfully"
      ],
      "runtime_result_ref": "",
      "occurred_at": "2026-08-18T19:03:06.618Z"
    },
    {
      "round": 2,
      "transition_schema_version": "arckit-case-transition/v8",
      "goal": "Prevent an externally supplied legacy Electron-to-Node bootstrap variable from entering the utility Runtime or its Codex descendants.",
      "outcome": "completed",
      "gap_selection": {
        "mode": "fresh",
        "basis": "A post-implementation pre-review audit exposed one bounded environment-hardening obligation with completed focused evidence.",
        "snapshot_token": "d7e560c07e46e404e45e1d5933703e0960f781be554fd250579562b4ffd21acb",
        "selected_ref": "fresh-gap:CASE-20260818-008:GAP-SANITIZE-LEGACY-ELECTRON-BOOTSTRAP-INPUT",
        "comparison_summary": "Compared the derived completion review and unrelated Project gaps; the fresh hardening gap has direct regression value and must be recorded before reviewing the final content revision.",
        "fresh_discovery_summary": "The utility host now strips the obsolete bootstrap input; focused tests found no additional environment-boundary gap.",
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
            "reason": "This unrelated Project obligation requires a separate Case."
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
            "reason": "This unrelated Project obligation requires a separate Case."
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
            "reason": "This unrelated Project obligation requires a separate Case."
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
            "reason": "This unrelated Project obligation requires a separate Case."
          },
          {
            "ref": "case-gap:CASE-20260818-008:CASE-20260818-008:completion-review:1",
            "source": "persisted",
            "eligibility": "ready",
            "disposition": "deferred",
            "priority_basis": {
              "blocking": "high",
              "uncertainty": "low",
              "risk": "high",
              "user_impact": "high"
            },
            "reason": "The completion review is deferred until the fresh defensive environment boundary is recorded."
          },
          {
            "ref": "fresh-gap:CASE-20260818-008:GAP-SANITIZE-LEGACY-ELECTRON-BOOTSTRAP-INPUT",
            "source": "fresh",
            "eligibility": "ready",
            "disposition": "selected",
            "priority_basis": {
              "blocking": "medium",
              "uncertainty": "low",
              "risk": "medium",
              "user_impact": "medium"
            },
            "reason": "This fresh, already verified defensive boundary prevents legacy input from leaking to the new utility Runtime and should precede final review."
          }
        ]
      },
      "selected_gap": {
        "id": "GAP-SANITIZE-LEGACY-ELECTRON-BOOTSTRAP-INPUT",
        "responsibility": "agent",
        "goal": "Prevent an externally supplied legacy Electron-to-Node bootstrap variable from entering the utility Runtime or its Codex descendants.",
        "reason": "The RunAsNode fuse removes ArcOrbit’s dependency, but an inherited legacy shell variable should still be removed at the utility-process environment boundary so it cannot affect unrelated downstream executables.",
        "derived_from": [
          "FACT-RUN-AS-NODE-ARCHITECTURE-REALIZED",
          "completion_review_precheck"
        ],
        "blocked_by": [],
        "priority_basis": {
          "blocking": "medium",
          "uncertainty": "low",
          "risk": "medium",
          "user_impact": "medium"
        },
        "evidence_required": [
          "Focused utility-host environment regression proving the legacy input is stripped while ordinary environment entries are preserved."
        ]
      },
      "planned_transition": {
        "goal": "Prevent an externally supplied legacy Electron-to-Node bootstrap variable from entering the utility Runtime or its Codex descendants.",
        "expected_state_change": "Accept the utility environment hardening fact and resolve the fresh defensive gap before completion review."
      },
      "accepted_state_delta": {
        "resolved_gap": {
          "id": "GAP-SANITIZE-LEGACY-ELECTRON-BOOTSTRAP-INPUT",
          "status": "resolved",
          "outcome": "The utility-process environment removes the legacy Electron-to-Node bootstrap input before Runtime and Codex execution.",
          "reason": "The host now copies and filters its environment at the exact utility fork boundary, and focused tests verify the variable is absent while PATH is preserved.",
          "evidence": [
            "runtime/arcorbit/src/electron-utility-runtime-host.mjs",
            "runtime/arcorbit/test/runtime-process-environment.test.mjs",
            "Focused utility-process environment tests: 2 passed, 0 failed",
            "arckit/tech/arcorbit/installer-supply-chain.md"
          ]
        },
        "facts_added": [
          {
            "id": "FACT-UTILITY-ENVIRONMENT-HARDENED",
            "revision": 1,
            "status": "accepted",
            "statement": "ArcOrbit’s utility-process host defensively removes inherited legacy Electron-to-Node bootstrap input before launching Runtime, without using that input to select or enable Node mode.",
            "basis": "The host implementation and focused test demonstrate explicit filtering while utilityProcess remains the sole packaged Runtime host.",
            "evidence": [
              "runtime/arcorbit/src/electron-utility-runtime-host.mjs",
              "runtime/arcorbit/test/runtime-process-environment.test.mjs",
              "Focused utility-process environment tests: 2 passed, 0 failed",
              "arckit/tech/arcorbit/installer-supply-chain.md"
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
        "project_revision": 111,
        "judgments": [
          {
            "invariant_ref": "product-expectations-remain-recoverable",
            "disposition": "not_relevant",
            "reason": "This defensive environment filter does not change a durable product capability or acceptance meaning.",
            "fact_refs": [],
            "evidence": [],
            "gap_refs": []
          },
          {
            "invariant_ref": "interaction-expectations-remain-recoverable",
            "disposition": "upheld",
            "reason": "The filtered utility launch preserves the no-extra-window execution interaction.",
            "fact_refs": [
              "FACT-UTILITY-ENVIRONMENT-HARDENED"
            ],
            "evidence": [
              "runtime/arcorbit/test/runtime-process-environment.test.mjs"
            ],
            "gap_refs": []
          },
          {
            "invariant_ref": "visual-language-remains-consistent",
            "disposition": "not_relevant",
            "reason": "No visual rule or presentation changes.",
            "fact_refs": [],
            "evidence": [],
            "gap_refs": []
          },
          {
            "invariant_ref": "technical-decisions-remain-explainable",
            "disposition": "upheld",
            "reason": "The documented utility host now includes an explicit defensive environment boundary without restoring the removed compatibility architecture.",
            "fact_refs": [
              "FACT-UTILITY-ENVIRONMENT-HARDENED"
            ],
            "evidence": [
              "arckit/tech/arcorbit/installer-supply-chain.md",
              "runtime/arcorbit/src/electron-utility-runtime-host.mjs"
            ],
            "gap_refs": []
          },
          {
            "invariant_ref": "accepted-facts-are-realized",
            "disposition": "upheld",
            "reason": "The implementation directly realizes the accepted utility-only Runtime host while filtering obsolete inherited input.",
            "fact_refs": [
              "FACT-UTILITY-ENVIRONMENT-HARDENED"
            ],
            "evidence": [
              "runtime/arcorbit/src/electron-utility-runtime-host.mjs",
              "runtime/arcorbit/test/runtime-process-environment.test.mjs"
            ],
            "gap_refs": []
          },
          {
            "invariant_ref": "material-risks-have-credible-evidence",
            "disposition": "upheld",
            "reason": "Focused tests cover both removal of the legacy input and preservation of normal environment entries.",
            "fact_refs": [
              "FACT-UTILITY-ENVIRONMENT-HARDENED"
            ],
            "evidence": [
              "Focused utility-process environment tests: 2 passed, 0 failed"
            ],
            "gap_refs": []
          }
        ]
      },
      "evidence": [
        "runtime/arcorbit/src/electron-utility-runtime-host.mjs",
        "runtime/arcorbit/test/runtime-process-environment.test.mjs",
        "Focused utility-process environment tests: 2 passed, 0 failed",
        "arckit/tech/arcorbit/installer-supply-chain.md"
      ],
      "runtime_result_ref": "",
      "occurred_at": "2026-08-18T19:04:40.038Z"
    },
    {
      "round": 3,
      "transition_schema_version": "arckit-case-transition/v8",
      "goal": "Complete the autonomous review of the ELECTRON_RUN_AS_NODE architecture removal.",
      "outcome": "completed",
      "gap_selection": {
        "mode": "candidate",
        "basis": "All implementation gaps are resolved, so the Case completion review is the only ready in-Case obligation and blocks resolution.",
        "snapshot_token": "1b955714635a40e3fd4a58da6aba40b1f5eb8517b7858c85ce8142404ba7114b",
        "selected_ref": "case-gap:CASE-20260818-008:CASE-20260818-008:completion-review:1",
        "comparison_summary": "The four repository-wide Project gaps require separate Cases; the ready completion review is scoped to the active Case and is selected.",
        "fresh_discovery_summary": "No fresh defect or unresolved architectural obligation was found after the full test suite, packaged utility-host smoke, fuse readback, legacy-variable negative smoke, and diff hygiene check.",
        "considered": [
          {
            "ref": "project-gap:GAP-agent-scenario-evaluation",
            "source": "persisted",
            "eligibility": "case_required",
            "disposition": "deferred",
            "reason": "This repository-wide evaluation requires a separate Case and does not block the active architecture Case review.",
            "priority_basis": {
              "uncertainty": "high",
              "risk": "high"
            }
          },
          {
            "ref": "project-gap:GAP-runtime-resilience-and-adapters",
            "source": "persisted",
            "eligibility": "case_required",
            "disposition": "deferred",
            "reason": "The broader resilience work requires a separate Case and is outside this bounded process-host migration.",
            "priority_basis": {
              "risk": "high",
              "urgency": "medium"
            }
          },
          {
            "ref": "project-gap:GAP-security-real-project-validation",
            "source": "persisted",
            "eligibility": "case_required",
            "disposition": "deferred",
            "reason": "Real permission-bearing validation requires a separate Case and external controlled resources.",
            "priority_basis": {
              "risk": "high",
              "urgency": "medium"
            }
          },
          {
            "ref": "project-gap:GAP-cross-record-audit",
            "source": "persisted",
            "eligibility": "case_required",
            "disposition": "deferred",
            "reason": "The repository-wide cross-record audit requires a separate Case and does not supersede this Case closeout.",
            "priority_basis": {
              "risk": "high",
              "urgency": "high"
            }
          },
          {
            "ref": "case-gap:CASE-20260818-008:CASE-20260818-008:completion-review:1",
            "source": "persisted",
            "eligibility": "ready",
            "disposition": "selected",
            "reason": "All ordinary Case gaps are resolved and review evidence is complete.",
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
        "id": "CASE-20260818-008:completion-review:1",
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
        "goal": "Complete the autonomous review of the ELECTRON_RUN_AS_NODE architecture removal.",
        "expected_state_change": "Record a clean five-dimension review and resolve the Case without creating follow-up gaps."
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
            "runtime/arcorbit/src/electron-utility-runtime-host.mjs",
            "runtime/arcorbit/src/desktop-run-manager.mjs",
            "entry/skills/arckit-development-ledger/scripts/trusted-ledger-operations.mjs",
            "runtime/arcorbit/scripts/flip-electron-fuses.cjs",
            "ArcOrbit full check: 211 tests, 209 passed, 2 environment-gated skipped, 0 failed",
            "Packaged utility-process Runtime host smoke passed with ELECTRON_RUN_AS_NODE=1 present in the launcher environment",
            "Packaged Electron fuse wire confirms RunAsNode, NODE_OPTIONS, and CLI inspect are disabled",
            "Packaged init-project smoke produced a current, auditable Project ledger",
            "git diff --check passed"
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
        "project_revision": 111,
        "judgments": [
          {
            "invariant_ref": "product-expectations-remain-recoverable",
            "disposition": "upheld",
            "reason": "The accepted no-extra-window execution behavior remains recoverable in the Case facts and packaged Runtime architecture.",
            "fact_refs": [
              "FACT-RUN-AS-NODE-ARCHITECTURE-REALIZED"
            ],
            "evidence": [
              "arckit/cases/active/CASE-20260818-008-remove-arcorbit-electron-run-as-node-dependency.md",
              "runtime/arcorbit/desktop/main.mjs"
            ],
            "gap_refs": []
          },
          {
            "invariant_ref": "interaction-expectations-remain-recoverable",
            "disposition": "upheld",
            "reason": "Automated execution is hosted without opening additional application windows, including when the obsolete variable is injected externally.",
            "fact_refs": [
              "FACT-RUN-AS-NODE-ARCHITECTURE-REALIZED",
              "FACT-UTILITY-ENVIRONMENT-HARDENED"
            ],
            "evidence": [
              "Packaged utility-process Runtime host smoke passed with ELECTRON_RUN_AS_NODE=1 present in the launcher environment"
            ],
            "gap_refs": []
          },
          {
            "invariant_ref": "visual-language-remains-consistent",
            "disposition": "not_relevant",
            "reason": "The process-host migration changes no visual rule or Renderer presentation.",
            "fact_refs": [],
            "evidence": [],
            "gap_refs": []
          },
          {
            "invariant_ref": "technical-decisions-remain-explainable",
            "disposition": "upheld",
            "reason": "The technical documents now identify Electron utilityProcess, typed parent-port control, in-process trusted ledger APIs, and disabled Electron Node-mode fuses as explicit boundaries.",
            "fact_refs": [
              "FACT-RUN-AS-NODE-ARCHITECTURE-REALIZED",
              "FACT-UTILITY-ENVIRONMENT-HARDENED"
            ],
            "evidence": [
              "arckit/tech/arcorbit/installer-supply-chain.md",
              "arckit/tech/arcorbit/solution.md"
            ],
            "gap_refs": []
          },
          {
            "invariant_ref": "accepted-facts-are-realized",
            "disposition": "upheld",
            "reason": "Production code no longer uses the Electron executable as Node, and trusted ledger operations execute through direct module APIs.",
            "fact_refs": [
              "FACT-RUN-AS-NODE-ARCHITECTURE-REALIZED",
              "FACT-UTILITY-ENVIRONMENT-HARDENED"
            ],
            "evidence": [
              "runtime/arcorbit/src/electron-utility-runtime-host.mjs",
              "entry/skills/arckit-development-ledger/scripts/trusted-ledger-operations.mjs",
              "runtime/arcorbit/test/runtime-process-environment.test.mjs"
            ],
            "gap_refs": []
          },
          {
            "invariant_ref": "material-risks-have-credible-evidence",
            "disposition": "upheld",
            "reason": "Source tests, full regression tests, package construction, actual fuse readback, and packaged positive and negative smokes cover the principal launch and distribution risks.",
            "fact_refs": [
              "FACT-RUN-AS-NODE-ARCHITECTURE-REALIZED",
              "FACT-UTILITY-ENVIRONMENT-HARDENED"
            ],
            "evidence": [
              "ArcOrbit full check: 211 tests, 209 passed, 2 environment-gated skipped, 0 failed",
              "Packaged Electron fuse wire confirms RunAsNode, NODE_OPTIONS, and CLI inspect are disabled",
              "git diff --check passed"
            ],
            "gap_refs": []
          }
        ]
      },
      "evidence": [
        "runtime/arcorbit/src/electron-utility-runtime-host.mjs",
        "entry/skills/arckit-development-ledger/scripts/trusted-ledger-operations.mjs",
        "runtime/arcorbit/scripts/flip-electron-fuses.cjs",
        "arckit/tech/arcorbit/installer-supply-chain.md",
        "arckit/tech/arcorbit/solution.md",
        "ArcOrbit full check: 211 tests, 209 passed, 2 environment-gated skipped, 0 failed",
        "Packaged utility-process Runtime host smoke passed with ELECTRON_RUN_AS_NODE=1 present in the launcher environment",
        "git diff --check passed"
      ],
      "runtime_result_ref": "",
      "occurred_at": "2026-08-18T19:09:17.283Z"
    }
  ],
  "case_resolution": {
    "status": "resolved",
    "stage": "resolved",
    "satisfied": [
      "GAP-REMOVE-RUN-AS-NODE-DEPENDENCY",
      "GAP-SANITIZE-LEGACY-ELECTRON-BOOTSTRAP-INPUT"
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
    "updated_at": "2026-08-18T19:09:17.283Z"
  }
}
```

## Round Notes

- Case history is canonical in Structured Record.rounds; keep prose notes exceptional.
