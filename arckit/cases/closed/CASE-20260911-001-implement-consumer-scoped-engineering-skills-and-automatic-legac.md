# Implement consumer-scoped Engineering skills and automatic legacy migration

Case: CASE-20260911-001
Status: closed
Artifact Type: mixed
Selected Gap: none
Updated: 2026-09-11T08:33:32.983Z

## User Intent

Deliver real Engineering scene configuration, independent Chat and Automation skill visibility with protected core skills, app-private catalog and automatic Arckit-only project cleanup without backups.

## Structured Record

```json
{
  "schema_version": "development-case-record/v5",
  "id": "CASE-20260911-001",
  "title": "Implement consumer-scoped Engineering skills and automatic legacy migration",
  "status": "closed",
  "artifact_type": "mixed",
  "created_at": "2026-09-11T07:32:43.987Z",
  "updated_at": "2026-09-11T08:33:32.983Z",
  "user_intent": "Deliver real Engineering scene configuration, independent Chat and Automation skill visibility with protected core skills, app-private catalog and automatic Arckit-only project cleanup without backups.",
  "expected_outcome": "Users can configure and replace scene skills, Chat defaults to no bundled Automation skills but can opt into a Loop, Automation retains protected entrypoints, and environment checks migrate managed legacy copies without touching unrelated skills.",
  "project_state_ref": "arckit/project/state.record.json",
  "current_round": {
    "goal": "",
    "selected_gap": null
  },
  "facts": [
    {
      "id": "FACT-20260911-001-001",
      "revision": 1,
      "status": "accepted",
      "statement": "User authorizes full implementation; core using-arckit and arckit-development-ledger cannot be replaced; Chat may enable them; legacy associated copies are removed without backups.",
      "basis": "user-confirmed requirements and inspected current implementation",
      "evidence": [
        "runtime/arcorbit/src/skill-provisioning-manager.mjs",
        "runtime/arcorbit/src/chat-coordinator.mjs",
        "runtime/arcorbit/desktop/renderer/index.html"
      ]
    },
    {
      "id": "FACT-20260911-001-002",
      "revision": 1,
      "status": "accepted",
      "statement": "Scene skill management contracts are defined; implementation must provide private catalog, independent Chat/Automation bindings and protected core skills with direct legacy cleanup.",
      "basis": "durable definition artifacts",
      "evidence": [
        "arckit/spec/agentic-software-development/arcorbit-scene-skills.md",
        "arckit/interaction/engineering-profile/interaction.md",
        "arckit/tech/arcorbit/scene-skills-solution.md"
      ]
    },
    {
      "id": "FACT-20260911-001-003",
      "revision": 1,
      "status": "accepted",
      "statement": "Engineering now manages persistent Chat/Automation skill selections; official core skills are protected, builtins use the app-owned version catalog, and readiness directly removes proven legacy project copies without backups. Native Codex discovery/disablement, scene isolation, real Electron replacement/persistence and packaged-resource smoke passed. Optional model-request recapture after the path fix was not rerun because the local-port command was declined; no live model execution was used.",
      "basis": "implementation and repeatable scoped verification",
      "evidence": [
        "arckit/spec/agentic-software-development/arcorbit-scene-skills.md",
        "arckit/interaction/engineering-profile/interaction.md",
        "arckit/tech/arcorbit/scene-skills-solution.md",
        "runtime/arcorbit/src/scene-skill-manager.mjs",
        "runtime/arcorbit/src/bundled-skill-catalog.mjs",
        "runtime/arcorbit/src/codex-scene-skills.mjs",
        "runtime/arcorbit/test/scene-skills.test.mjs",
        "runtime/arcorbit/test/scene-skills-discovery.test.mjs",
        "runtime/arcorbit/test/engineering-surface.test.mjs",
        "runtime/arcorbit/test/fixtures/engineering-electron.mjs",
        "runtime/arcorbit/scripts/smoke-distribution.mjs"
      ]
    },
    {
      "id": "FACT-20260911-001-004",
      "revision": 1,
      "status": "accepted",
      "statement": "Engineering IPC snapshot, update and import operations reject non-primary renderer senders before reading settings, saving configuration or opening the native folder picker. The 65-test Desktop renderer suite and syntax/diff checks passed.",
      "basis": "actual IPC handler execution with legitimate and foreign sender identities",
      "evidence": [
        "runtime/arcorbit/desktop/main.mjs",
        "runtime/arcorbit/test/desktop-renderer.test.mjs",
        "arckit/tech/arcorbit/scene-skills-solution.md"
      ]
    }
  ],
  "state_impacts": [],
  "gaps": [
    {
      "id": "GAP-20260911-001-001",
      "status": "resolved",
      "goal": "Establish durable consumer skill storage, visibility, protection, migration and interaction contracts.",
      "reason": "Current Engineering surface is a preview and provisioning conflates project installation with scene visibility.",
      "derived_from": [
        "FACT-20260911-001-001"
      ],
      "blocked_by": [],
      "priority_basis": {
        "blocking": "implementation requires coherent scene boundaries"
      },
      "responsibility": "agent",
      "evidence_required": [
        "accepted spec, interaction and technical design for scene skill management"
      ],
      "resolution": {
        "id": "GAP-20260911-001-001",
        "status": "resolved",
        "outcome": "resolved",
        "reason": "Scene contracts now define storage, visibility, core protection, direct migration and UI behavior.",
        "evidence": [
          "arckit/spec/agentic-software-development/arcorbit-scene-skills.md",
          "arckit/interaction/engineering-profile/interaction.md",
          "arckit/tech/arcorbit/scene-skills-solution.md"
        ],
        "occurred_at": "2026-09-11T07:35:27.536Z"
      }
    },
    {
      "id": "GAP-20260911-001-002",
      "status": "resolved",
      "goal": "Realize the accepted scene skill management contract across Engineering, Chat, Automation initialization and safe automatic migration.",
      "reason": "Current implementation still installs project skills and has no consumer configuration.",
      "derived_from": [
        "FACT-20260911-001-002"
      ],
      "blocked_by": [],
      "priority_basis": {
        "blocking": "requested user behavior remains absent"
      },
      "responsibility": "agent",
      "evidence_required": [
        "tested scene management, Codex binding isolation, real UI and Arckit-only migration"
      ],
      "resolution": {
        "id": "GAP-20260911-001-002",
        "status": "resolved",
        "outcome": "resolved",
        "reason": "Consumer-scoped catalog, Engineering UI, Chat message-boundary binding, Automation run binding and Arckit-only automatic migration are implemented and verified.",
        "evidence": [
          "arckit/spec/agentic-software-development/arcorbit-scene-skills.md",
          "arckit/interaction/engineering-profile/interaction.md",
          "arckit/tech/arcorbit/scene-skills-solution.md",
          "runtime/arcorbit/src/scene-skill-manager.mjs",
          "runtime/arcorbit/src/bundled-skill-catalog.mjs",
          "runtime/arcorbit/src/codex-scene-skills.mjs",
          "runtime/arcorbit/test/scene-skills.test.mjs",
          "runtime/arcorbit/test/scene-skills-discovery.test.mjs",
          "runtime/arcorbit/test/engineering-surface.test.mjs",
          "runtime/arcorbit/test/fixtures/engineering-electron.mjs",
          "runtime/arcorbit/scripts/smoke-distribution.mjs"
        ],
        "occurred_at": "2026-09-11T08:29:59.038Z"
      }
    },
    {
      "id": "CASE-20260911-001:review-finding:FINDING-20260911-001-001",
      "status": "resolved",
      "goal": "Resolve review finding: Engineering IPC snapshot/update/import must validate the primary renderer sender using the established Desktop trust boundary before reading settings, changing selections or opening a folder picker.",
      "reason": "omission found by completion review",
      "derived_from": [
        "completion_review",
        "content_revision:2"
      ],
      "blocked_by": [],
      "priority_basis": {
        "blocking": "high",
        "risk": "high"
      },
      "responsibility": "agent",
      "evidence_required": [
        "runtime/arcorbit/desktop/main.mjs"
      ],
      "resolution": {
        "id": "CASE-20260911-001:review-finding:FINDING-20260911-001-001",
        "status": "resolved",
        "outcome": "resolved",
        "reason": "All three Engineering IPC handlers now enforce the established main-renderer identity before accessing data or dialogs; adversarial caller tests passed.",
        "evidence": [
          "runtime/arcorbit/desktop/main.mjs",
          "runtime/arcorbit/test/desktop-renderer.test.mjs",
          "arckit/tech/arcorbit/scene-skills-solution.md"
        ],
        "occurred_at": "2026-09-11T08:32:52.735Z"
      }
    }
  ],
  "content_revision": 3,
  "completion_review": {
    "status": "clean",
    "policy": {
      "initial_max_cycles": 3,
      "source": "current user authorized complete implementation",
      "snapshotted_at": "2026-09-11T07:32:43.987Z"
    },
    "additional_cycles_authorized": 0,
    "cycle_count": 2,
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
        "outcome": "findings",
        "content_revision": 2,
        "dimensions": {
          "implementation_correctness": "findings",
          "problem_resolution": "clean",
          "verification_credibility": "clean",
          "regression_risk": "findings",
          "minimality": "clean"
        },
        "finding_ids": [
          "FINDING-20260911-001-001"
        ],
        "evidence": [
          "arckit/spec/agentic-software-development/arcorbit-scene-skills.md",
          "arckit/interaction/engineering-profile/interaction.md",
          "arckit/tech/arcorbit/scene-skills-solution.md",
          "runtime/arcorbit/src/scene-skill-manager.mjs",
          "runtime/arcorbit/src/bundled-skill-catalog.mjs",
          "runtime/arcorbit/src/codex-scene-skills.mjs",
          "runtime/arcorbit/test/scene-skills.test.mjs",
          "runtime/arcorbit/test/scene-skills-discovery.test.mjs",
          "runtime/arcorbit/test/engineering-surface.test.mjs",
          "runtime/arcorbit/test/fixtures/engineering-electron.mjs",
          "runtime/arcorbit/scripts/smoke-distribution.mjs"
        ],
        "occurred_at": "2026-09-11T08:31:46.004Z"
      },
      {
        "cycle": 2,
        "autonomous_cycle": 2,
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
          "arckit/spec/agentic-software-development/arcorbit-scene-skills.md",
          "arckit/interaction/engineering-profile/interaction.md",
          "arckit/tech/arcorbit/scene-skills-solution.md",
          "runtime/arcorbit/src/scene-skill-manager.mjs",
          "runtime/arcorbit/src/bundled-skill-catalog.mjs",
          "runtime/arcorbit/src/codex-scene-skills.mjs",
          "runtime/arcorbit/test/scene-skills.test.mjs",
          "runtime/arcorbit/test/scene-skills-discovery.test.mjs",
          "runtime/arcorbit/test/engineering-surface.test.mjs",
          "runtime/arcorbit/test/fixtures/engineering-electron.mjs",
          "runtime/arcorbit/scripts/smoke-distribution.mjs",
          "runtime/arcorbit/desktop/main.mjs",
          "runtime/arcorbit/test/desktop-renderer.test.mjs"
        ],
        "occurred_at": "2026-09-11T08:33:32.983Z"
      }
    ],
    "evidence": [
      "arckit/spec/agentic-software-development/arcorbit-scene-skills.md",
      "arckit/interaction/engineering-profile/interaction.md",
      "arckit/tech/arcorbit/scene-skills-solution.md",
      "runtime/arcorbit/src/scene-skill-manager.mjs",
      "runtime/arcorbit/src/bundled-skill-catalog.mjs",
      "runtime/arcorbit/src/codex-scene-skills.mjs",
      "runtime/arcorbit/test/scene-skills.test.mjs",
      "runtime/arcorbit/test/scene-skills-discovery.test.mjs",
      "runtime/arcorbit/test/engineering-surface.test.mjs",
      "runtime/arcorbit/test/fixtures/engineering-electron.mjs",
      "runtime/arcorbit/scripts/smoke-distribution.mjs",
      "runtime/arcorbit/desktop/main.mjs",
      "runtime/arcorbit/test/desktop-renderer.test.mjs"
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
      "goal": "Establish durable consumer skill storage, visibility, protection, migration and interaction contracts.",
      "outcome": "completed",
      "gap_selection": {
        "mode": "candidate",
        "basis": "candidate",
        "snapshot_token": "dc80971c1553289227b4a1f5f9932e905ca75d57ecac64e5490b9101e16288ae",
        "selected_ref": "case-gap:CASE-20260911-001:GAP-20260911-001-001",
        "comparison_summary": "Current user scene skill contract before its implementation; unrelated candidates deferred.",
        "fresh_discovery_summary": "No additional fresh work selected.",
        "considered": [
          {
            "ref": "project-gap:GAP-agent-scenario-evaluation",
            "source": "persisted",
            "eligibility": "case_required",
            "disposition": "deferred",
            "priority_basis": {
              "reason": "explicit current task priority"
            },
            "reason": "Outside current requested work"
          },
          {
            "ref": "project-gap:GAP-runtime-resilience-and-adapters",
            "source": "persisted",
            "eligibility": "case_required",
            "disposition": "deferred",
            "priority_basis": {
              "reason": "explicit current task priority"
            },
            "reason": "Outside current requested work"
          },
          {
            "ref": "project-gap:GAP-security-real-project-validation",
            "source": "persisted",
            "eligibility": "case_required",
            "disposition": "deferred",
            "priority_basis": {
              "reason": "explicit current task priority"
            },
            "reason": "Outside current requested work"
          },
          {
            "ref": "project-gap:GAP-cross-record-audit",
            "source": "persisted",
            "eligibility": "case_required",
            "disposition": "deferred",
            "priority_basis": {
              "reason": "explicit current task priority"
            },
            "reason": "Outside current requested work"
          },
          {
            "ref": "case-gap:CASE-20260901-001:GAP-20260901-001-005",
            "source": "persisted",
            "eligibility": "blocked",
            "disposition": "deferred",
            "priority_basis": {
              "reason": "explicit current task priority"
            },
            "reason": "Outside current requested work"
          },
          {
            "ref": "case-gap:CASE-20260909-002:GAP-20260909-002-004",
            "source": "persisted",
            "eligibility": "blocked",
            "disposition": "deferred",
            "priority_basis": {
              "reason": "explicit current task priority"
            },
            "reason": "Outside current requested work"
          },
          {
            "ref": "case-gap:CASE-20260911-001:GAP-20260911-001-001",
            "source": "persisted",
            "eligibility": "ready",
            "disposition": "selected",
            "priority_basis": {
              "reason": "explicit current task priority"
            },
            "reason": "Contract for authorized Engineering work"
          }
        ]
      },
      "selected_gap": {
        "id": "GAP-20260911-001-001",
        "responsibility": "agent",
        "goal": "Establish durable consumer skill storage, visibility, protection, migration and interaction contracts.",
        "reason": "Current Engineering surface is a preview and provisioning conflates project installation with scene visibility.",
        "derived_from": [
          "FACT-20260911-001-001"
        ],
        "blocked_by": [],
        "priority_basis": {
          "blocking": "implementation requires coherent scene boundaries",
          "uncertainty": "",
          "risk": "",
          "user_impact": ""
        },
        "evidence_required": [
          "accepted spec, interaction and technical design for scene skill management"
        ]
      },
      "planned_transition": {
        "goal": "Establish durable consumer skill storage, visibility, protection, migration and interaction contracts.",
        "expected_state_change": "Durable scene contract established and implementation gap recorded"
      },
      "accepted_state_delta": {
        "resolved_gap": {
          "id": "GAP-20260911-001-001",
          "status": "resolved",
          "outcome": "resolved",
          "reason": "Scene contracts now define storage, visibility, core protection, direct migration and UI behavior.",
          "evidence": [
            "arckit/spec/agentic-software-development/arcorbit-scene-skills.md",
            "arckit/interaction/engineering-profile/interaction.md",
            "arckit/tech/arcorbit/scene-skills-solution.md"
          ]
        },
        "facts_added": [
          {
            "id": "FACT-20260911-001-002",
            "revision": 1,
            "status": "accepted",
            "statement": "Scene skill management contracts are defined; implementation must provide private catalog, independent Chat/Automation bindings and protected core skills with direct legacy cleanup.",
            "basis": "durable definition artifacts",
            "evidence": [
              "arckit/spec/agentic-software-development/arcorbit-scene-skills.md",
              "arckit/interaction/engineering-profile/interaction.md",
              "arckit/tech/arcorbit/scene-skills-solution.md"
            ]
          }
        ],
        "facts_superseded": [],
        "impacts_added": [],
        "impacts_updated": [],
        "gaps_added": [
          {
            "id": "GAP-20260911-001-002",
            "status": "open",
            "goal": "Realize the accepted scene skill management contract across Engineering, Chat, Automation initialization and safe automatic migration.",
            "reason": "Current implementation still installs project skills and has no consumer configuration.",
            "derived_from": [
              "FACT-20260911-001-002"
            ],
            "blocked_by": [],
            "priority_basis": {
              "blocking": "requested user behavior remains absent"
            },
            "responsibility": "agent",
            "evidence_required": [
              "tested scene management, Codex binding isolation, real UI and Arckit-only migration"
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
        "project_revision": 365,
        "judgments": [
          {
            "invariant_ref": "product-expectations-remain-recoverable",
            "disposition": "upheld",
            "reason": "Durable specification, interaction and architecture record the accepted contract.",
            "fact_refs": [
              "FACT-20260911-001-002"
            ],
            "evidence": [
              "arckit/spec/agentic-software-development/arcorbit-scene-skills.md",
              "arckit/interaction/engineering-profile/interaction.md",
              "arckit/tech/arcorbit/scene-skills-solution.md"
            ],
            "gap_refs": []
          },
          {
            "invariant_ref": "interaction-expectations-remain-recoverable",
            "disposition": "upheld",
            "reason": "Durable specification, interaction and architecture record the accepted contract.",
            "fact_refs": [
              "FACT-20260911-001-002"
            ],
            "evidence": [
              "arckit/spec/agentic-software-development/arcorbit-scene-skills.md",
              "arckit/interaction/engineering-profile/interaction.md",
              "arckit/tech/arcorbit/scene-skills-solution.md"
            ],
            "gap_refs": []
          },
          {
            "invariant_ref": "visual-language-remains-consistent",
            "disposition": "not_relevant",
            "reason": "Existing visual language retained; this round defines behavior and boundaries.",
            "fact_refs": [],
            "evidence": [],
            "gap_refs": []
          },
          {
            "invariant_ref": "technical-decisions-remain-explainable",
            "disposition": "upheld",
            "reason": "Durable specification, interaction and architecture record the accepted contract.",
            "fact_refs": [
              "FACT-20260911-001-002"
            ],
            "evidence": [
              "arckit/spec/agentic-software-development/arcorbit-scene-skills.md",
              "arckit/interaction/engineering-profile/interaction.md",
              "arckit/tech/arcorbit/scene-skills-solution.md"
            ],
            "gap_refs": []
          },
          {
            "invariant_ref": "accepted-facts-are-realized",
            "disposition": "undetermined",
            "reason": "Realization and destructive migration require implementation evidence.",
            "fact_refs": [
              "FACT-20260911-001-002"
            ],
            "evidence": [
              "arckit/spec/agentic-software-development/arcorbit-scene-skills.md",
              "arckit/interaction/engineering-profile/interaction.md",
              "arckit/tech/arcorbit/scene-skills-solution.md"
            ],
            "gap_refs": [
              "GAP-20260911-001-002"
            ]
          },
          {
            "invariant_ref": "material-risks-have-credible-evidence",
            "disposition": "undetermined",
            "reason": "Realization and destructive migration require implementation evidence.",
            "fact_refs": [
              "FACT-20260911-001-002"
            ],
            "evidence": [
              "arckit/spec/agentic-software-development/arcorbit-scene-skills.md",
              "arckit/interaction/engineering-profile/interaction.md",
              "arckit/tech/arcorbit/scene-skills-solution.md"
            ],
            "gap_refs": [
              "GAP-20260911-001-002"
            ]
          }
        ]
      },
      "evidence": [
        "arckit/spec/agentic-software-development/arcorbit-scene-skills.md",
        "arckit/interaction/engineering-profile/interaction.md",
        "arckit/tech/arcorbit/scene-skills-solution.md"
      ],
      "runtime_result_ref": "",
      "occurred_at": "2026-09-11T07:35:27.536Z"
    },
    {
      "round": 2,
      "transition_schema_version": "arckit-case-transition/v8",
      "goal": "Realize the accepted scene skill management contract across Engineering, Chat, Automation initialization and safe automatic migration.",
      "outcome": "completed",
      "gap_selection": {
        "mode": "candidate",
        "basis": "candidate",
        "snapshot_token": "bf5d87f3587dcc0759d32bc966fad79a8126679e444e62dda3df5f0b692e52b5",
        "selected_ref": "case-gap:CASE-20260911-001:GAP-20260911-001-002",
        "comparison_summary": "Authorized scene-skill implementation completed before unrelated project work.",
        "fresh_discovery_summary": "No additional fresh work selected.",
        "considered": [
          {
            "ref": "project-gap:GAP-agent-scenario-evaluation",
            "source": "persisted",
            "eligibility": "case_required",
            "disposition": "deferred",
            "priority_basis": {
              "reason": "explicit current task priority"
            },
            "reason": "Outside current requested work"
          },
          {
            "ref": "project-gap:GAP-runtime-resilience-and-adapters",
            "source": "persisted",
            "eligibility": "case_required",
            "disposition": "deferred",
            "priority_basis": {
              "reason": "explicit current task priority"
            },
            "reason": "Outside current requested work"
          },
          {
            "ref": "project-gap:GAP-security-real-project-validation",
            "source": "persisted",
            "eligibility": "case_required",
            "disposition": "deferred",
            "priority_basis": {
              "reason": "explicit current task priority"
            },
            "reason": "Outside current requested work"
          },
          {
            "ref": "project-gap:GAP-cross-record-audit",
            "source": "persisted",
            "eligibility": "case_required",
            "disposition": "deferred",
            "priority_basis": {
              "reason": "explicit current task priority"
            },
            "reason": "Outside current requested work"
          },
          {
            "ref": "case-gap:CASE-20260901-001:GAP-20260901-001-005",
            "source": "persisted",
            "eligibility": "blocked",
            "disposition": "deferred",
            "priority_basis": {
              "reason": "explicit current task priority"
            },
            "reason": "Outside current requested work"
          },
          {
            "ref": "case-gap:CASE-20260909-002:GAP-20260909-002-004",
            "source": "persisted",
            "eligibility": "blocked",
            "disposition": "deferred",
            "priority_basis": {
              "reason": "explicit current task priority"
            },
            "reason": "Outside current requested work"
          },
          {
            "ref": "case-gap:CASE-20260911-001:GAP-20260911-001-002",
            "source": "persisted",
            "eligibility": "ready",
            "disposition": "selected",
            "priority_basis": {
              "reason": "explicit current task priority"
            },
            "reason": "Current implementation gap for authorized Engineering work"
          },
          {
            "ref": "case-gap:CASE-20260911-003:GAP-20260911-003-001",
            "source": "persisted",
            "eligibility": "ready",
            "disposition": "deferred",
            "priority_basis": {
              "reason": "explicit current task priority"
            },
            "reason": "Outside current requested work"
          }
        ]
      },
      "selected_gap": {
        "id": "GAP-20260911-001-002",
        "responsibility": "agent",
        "goal": "Realize the accepted scene skill management contract across Engineering, Chat, Automation initialization and safe automatic migration.",
        "reason": "Current implementation still installs project skills and has no consumer configuration.",
        "derived_from": [
          "FACT-20260911-001-002"
        ],
        "blocked_by": [],
        "priority_basis": {
          "blocking": "requested user behavior remains absent",
          "uncertainty": "",
          "risk": "",
          "user_impact": ""
        },
        "evidence_required": [
          "tested scene management, Codex binding isolation, real UI and Arckit-only migration"
        ]
      },
      "planned_transition": {
        "goal": "Realize the accepted scene skill management contract across Engineering, Chat, Automation initialization and safe automatic migration.",
        "expected_state_change": "Scene skill contract realized with migration and consumer isolation evidence"
      },
      "accepted_state_delta": {
        "resolved_gap": {
          "id": "GAP-20260911-001-002",
          "status": "resolved",
          "outcome": "resolved",
          "reason": "Consumer-scoped catalog, Engineering UI, Chat message-boundary binding, Automation run binding and Arckit-only automatic migration are implemented and verified.",
          "evidence": [
            "arckit/spec/agentic-software-development/arcorbit-scene-skills.md",
            "arckit/interaction/engineering-profile/interaction.md",
            "arckit/tech/arcorbit/scene-skills-solution.md",
            "runtime/arcorbit/src/scene-skill-manager.mjs",
            "runtime/arcorbit/src/bundled-skill-catalog.mjs",
            "runtime/arcorbit/src/codex-scene-skills.mjs",
            "runtime/arcorbit/test/scene-skills.test.mjs",
            "runtime/arcorbit/test/scene-skills-discovery.test.mjs",
            "runtime/arcorbit/test/engineering-surface.test.mjs",
            "runtime/arcorbit/test/fixtures/engineering-electron.mjs",
            "runtime/arcorbit/scripts/smoke-distribution.mjs"
          ]
        },
        "facts_added": [
          {
            "id": "FACT-20260911-001-003",
            "revision": 1,
            "status": "accepted",
            "statement": "Engineering now manages persistent Chat/Automation skill selections; official core skills are protected, builtins use the app-owned version catalog, and readiness directly removes proven legacy project copies without backups. Native Codex discovery/disablement, scene isolation, real Electron replacement/persistence and packaged-resource smoke passed. Optional model-request recapture after the path fix was not rerun because the local-port command was declined; no live model execution was used.",
            "basis": "implementation and repeatable scoped verification",
            "evidence": [
              "arckit/spec/agentic-software-development/arcorbit-scene-skills.md",
              "arckit/interaction/engineering-profile/interaction.md",
              "arckit/tech/arcorbit/scene-skills-solution.md",
              "runtime/arcorbit/src/scene-skill-manager.mjs",
              "runtime/arcorbit/src/bundled-skill-catalog.mjs",
              "runtime/arcorbit/src/codex-scene-skills.mjs",
              "runtime/arcorbit/test/scene-skills.test.mjs",
              "runtime/arcorbit/test/scene-skills-discovery.test.mjs",
              "runtime/arcorbit/test/engineering-surface.test.mjs",
              "runtime/arcorbit/test/fixtures/engineering-electron.mjs",
              "runtime/arcorbit/scripts/smoke-distribution.mjs"
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
        "project_revision": 368,
        "judgments": [
          {
            "invariant_ref": "product-expectations-remain-recoverable",
            "disposition": "upheld",
            "reason": "Definitions, implementation and scoped tests support the accepted scene skill contract and its boundaries.",
            "fact_refs": [
              "FACT-20260911-001-003"
            ],
            "evidence": [
              "arckit/spec/agentic-software-development/arcorbit-scene-skills.md",
              "arckit/interaction/engineering-profile/interaction.md",
              "arckit/tech/arcorbit/scene-skills-solution.md",
              "runtime/arcorbit/src/scene-skill-manager.mjs",
              "runtime/arcorbit/src/bundled-skill-catalog.mjs",
              "runtime/arcorbit/src/codex-scene-skills.mjs",
              "runtime/arcorbit/test/scene-skills.test.mjs",
              "runtime/arcorbit/test/scene-skills-discovery.test.mjs",
              "runtime/arcorbit/test/engineering-surface.test.mjs",
              "runtime/arcorbit/test/fixtures/engineering-electron.mjs",
              "runtime/arcorbit/scripts/smoke-distribution.mjs"
            ],
            "gap_refs": []
          },
          {
            "invariant_ref": "interaction-expectations-remain-recoverable",
            "disposition": "upheld",
            "reason": "Definitions, implementation and scoped tests support the accepted scene skill contract and its boundaries.",
            "fact_refs": [
              "FACT-20260911-001-003"
            ],
            "evidence": [
              "arckit/spec/agentic-software-development/arcorbit-scene-skills.md",
              "arckit/interaction/engineering-profile/interaction.md",
              "arckit/tech/arcorbit/scene-skills-solution.md",
              "runtime/arcorbit/src/scene-skill-manager.mjs",
              "runtime/arcorbit/src/bundled-skill-catalog.mjs",
              "runtime/arcorbit/src/codex-scene-skills.mjs",
              "runtime/arcorbit/test/scene-skills.test.mjs",
              "runtime/arcorbit/test/scene-skills-discovery.test.mjs",
              "runtime/arcorbit/test/engineering-surface.test.mjs",
              "runtime/arcorbit/test/fixtures/engineering-electron.mjs",
              "runtime/arcorbit/scripts/smoke-distribution.mjs"
            ],
            "gap_refs": []
          },
          {
            "invariant_ref": "visual-language-remains-consistent",
            "disposition": "not_relevant",
            "reason": "Existing visual tokens and control language reused; no new durable visual-language rule.",
            "fact_refs": [],
            "evidence": [],
            "gap_refs": []
          },
          {
            "invariant_ref": "technical-decisions-remain-explainable",
            "disposition": "upheld",
            "reason": "Definitions, implementation and scoped tests support the accepted scene skill contract and its boundaries.",
            "fact_refs": [
              "FACT-20260911-001-003"
            ],
            "evidence": [
              "arckit/spec/agentic-software-development/arcorbit-scene-skills.md",
              "arckit/interaction/engineering-profile/interaction.md",
              "arckit/tech/arcorbit/scene-skills-solution.md",
              "runtime/arcorbit/src/scene-skill-manager.mjs",
              "runtime/arcorbit/src/bundled-skill-catalog.mjs",
              "runtime/arcorbit/src/codex-scene-skills.mjs",
              "runtime/arcorbit/test/scene-skills.test.mjs",
              "runtime/arcorbit/test/scene-skills-discovery.test.mjs",
              "runtime/arcorbit/test/engineering-surface.test.mjs",
              "runtime/arcorbit/test/fixtures/engineering-electron.mjs",
              "runtime/arcorbit/scripts/smoke-distribution.mjs"
            ],
            "gap_refs": []
          },
          {
            "invariant_ref": "accepted-facts-are-realized",
            "disposition": "upheld",
            "reason": "Definitions, implementation and scoped tests support the accepted scene skill contract and its boundaries.",
            "fact_refs": [
              "FACT-20260911-001-003"
            ],
            "evidence": [
              "arckit/spec/agentic-software-development/arcorbit-scene-skills.md",
              "arckit/interaction/engineering-profile/interaction.md",
              "arckit/tech/arcorbit/scene-skills-solution.md",
              "runtime/arcorbit/src/scene-skill-manager.mjs",
              "runtime/arcorbit/src/bundled-skill-catalog.mjs",
              "runtime/arcorbit/src/codex-scene-skills.mjs",
              "runtime/arcorbit/test/scene-skills.test.mjs",
              "runtime/arcorbit/test/scene-skills-discovery.test.mjs",
              "runtime/arcorbit/test/engineering-surface.test.mjs",
              "runtime/arcorbit/test/fixtures/engineering-electron.mjs",
              "runtime/arcorbit/scripts/smoke-distribution.mjs"
            ],
            "gap_refs": []
          },
          {
            "invariant_ref": "material-risks-have-credible-evidence",
            "disposition": "upheld",
            "reason": "Definitions, implementation and scoped tests support the accepted scene skill contract and its boundaries.",
            "fact_refs": [
              "FACT-20260911-001-003"
            ],
            "evidence": [
              "arckit/spec/agentic-software-development/arcorbit-scene-skills.md",
              "arckit/interaction/engineering-profile/interaction.md",
              "arckit/tech/arcorbit/scene-skills-solution.md",
              "runtime/arcorbit/src/scene-skill-manager.mjs",
              "runtime/arcorbit/src/bundled-skill-catalog.mjs",
              "runtime/arcorbit/src/codex-scene-skills.mjs",
              "runtime/arcorbit/test/scene-skills.test.mjs",
              "runtime/arcorbit/test/scene-skills-discovery.test.mjs",
              "runtime/arcorbit/test/engineering-surface.test.mjs",
              "runtime/arcorbit/test/fixtures/engineering-electron.mjs",
              "runtime/arcorbit/scripts/smoke-distribution.mjs"
            ],
            "gap_refs": []
          }
        ]
      },
      "evidence": [
        "arckit/spec/agentic-software-development/arcorbit-scene-skills.md",
        "arckit/interaction/engineering-profile/interaction.md",
        "arckit/tech/arcorbit/scene-skills-solution.md",
        "runtime/arcorbit/src/scene-skill-manager.mjs",
        "runtime/arcorbit/src/bundled-skill-catalog.mjs",
        "runtime/arcorbit/src/codex-scene-skills.mjs",
        "runtime/arcorbit/test/scene-skills.test.mjs",
        "runtime/arcorbit/test/scene-skills-discovery.test.mjs",
        "runtime/arcorbit/test/engineering-surface.test.mjs",
        "runtime/arcorbit/test/fixtures/engineering-electron.mjs",
        "runtime/arcorbit/scripts/smoke-distribution.mjs"
      ],
      "runtime_result_ref": "",
      "occurred_at": "2026-09-11T08:29:59.038Z"
    },
    {
      "round": 3,
      "transition_schema_version": "arckit-case-transition/v8",
      "goal": "Review the completed implementation for correctness, real problem resolution, verification credibility, regression risk, and minimality.",
      "outcome": "completed",
      "gap_selection": {
        "mode": "candidate",
        "basis": "candidate",
        "snapshot_token": "e9c3b0ca26a544d6582871cbf0c259d4cf8efd50bb5531fb4b8bb0a590493b8b",
        "selected_ref": "case-gap:CASE-20260911-001:CASE-20260911-001:completion-review:1",
        "comparison_summary": "Authorized scene-skill implementation completed before unrelated project work.",
        "fresh_discovery_summary": "No additional fresh work selected.",
        "considered": [
          {
            "ref": "project-gap:GAP-agent-scenario-evaluation",
            "source": "persisted",
            "eligibility": "case_required",
            "disposition": "deferred",
            "priority_basis": {
              "reason": "explicit current task priority"
            },
            "reason": "Outside current requested work"
          },
          {
            "ref": "project-gap:GAP-runtime-resilience-and-adapters",
            "source": "persisted",
            "eligibility": "case_required",
            "disposition": "deferred",
            "priority_basis": {
              "reason": "explicit current task priority"
            },
            "reason": "Outside current requested work"
          },
          {
            "ref": "project-gap:GAP-security-real-project-validation",
            "source": "persisted",
            "eligibility": "case_required",
            "disposition": "deferred",
            "priority_basis": {
              "reason": "explicit current task priority"
            },
            "reason": "Outside current requested work"
          },
          {
            "ref": "project-gap:GAP-cross-record-audit",
            "source": "persisted",
            "eligibility": "case_required",
            "disposition": "deferred",
            "priority_basis": {
              "reason": "explicit current task priority"
            },
            "reason": "Outside current requested work"
          },
          {
            "ref": "case-gap:CASE-20260901-001:GAP-20260901-001-005",
            "source": "persisted",
            "eligibility": "blocked",
            "disposition": "deferred",
            "priority_basis": {
              "reason": "explicit current task priority"
            },
            "reason": "Outside current requested work"
          },
          {
            "ref": "case-gap:CASE-20260909-002:GAP-20260909-002-004",
            "source": "persisted",
            "eligibility": "blocked",
            "disposition": "deferred",
            "priority_basis": {
              "reason": "explicit current task priority"
            },
            "reason": "Outside current requested work"
          },
          {
            "ref": "case-gap:CASE-20260911-001:CASE-20260911-001:completion-review:1",
            "source": "persisted",
            "eligibility": "ready",
            "disposition": "selected",
            "priority_basis": {
              "reason": "explicit current task priority"
            },
            "reason": "Current implementation gap for authorized Engineering work"
          },
          {
            "ref": "case-gap:CASE-20260911-003:GAP-20260911-003-001",
            "source": "persisted",
            "eligibility": "ready",
            "disposition": "deferred",
            "priority_basis": {
              "reason": "explicit current task priority"
            },
            "reason": "Outside current requested work"
          }
        ]
      },
      "selected_gap": {
        "id": "CASE-20260911-001:completion-review:1",
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
        "goal": "Review the completed implementation for correctness, real problem resolution, verification credibility, regression risk, and minimality.",
        "expected_state_change": "Completion Review identifies the remaining IPC sender validation boundary"
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
          "outcome": "findings",
          "reviewer": "agent",
          "dimensions": {
            "implementation_correctness": "findings",
            "problem_resolution": "clean",
            "verification_credibility": "clean",
            "regression_risk": "findings",
            "minimality": "clean"
          },
          "findings": [
            {
              "id": "FINDING-20260911-001-001",
              "kind": "omission",
              "statement": "Engineering IPC snapshot/update/import must validate the primary renderer sender using the established Desktop trust boundary before reading settings, changing selections or opening a folder picker.",
              "responsibility": "agent",
              "artifact_refs": [
                "runtime/arcorbit/desktop/main.mjs"
              ],
              "evidence": [
                "runtime/arcorbit/desktop/main.mjs"
              ]
            }
          ],
          "evidence": [
            "arckit/spec/agentic-software-development/arcorbit-scene-skills.md",
            "arckit/interaction/engineering-profile/interaction.md",
            "arckit/tech/arcorbit/scene-skills-solution.md",
            "runtime/arcorbit/src/scene-skill-manager.mjs",
            "runtime/arcorbit/src/bundled-skill-catalog.mjs",
            "runtime/arcorbit/src/codex-scene-skills.mjs",
            "runtime/arcorbit/test/scene-skills.test.mjs",
            "runtime/arcorbit/test/scene-skills-discovery.test.mjs",
            "runtime/arcorbit/test/engineering-surface.test.mjs",
            "runtime/arcorbit/test/fixtures/engineering-electron.mjs",
            "runtime/arcorbit/scripts/smoke-distribution.mjs"
          ],
          "reviewed_content_revision": 2
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
        "project_revision": 368,
        "judgments": [
          {
            "invariant_ref": "product-expectations-remain-recoverable",
            "disposition": "upheld",
            "reason": "Existing accepted facts retain their scoped evidence; the IPC review finding is an investigation/repair obligation, not an accepted new software fact.",
            "fact_refs": [
              "FACT-20260911-001-003"
            ],
            "evidence": [
              "arckit/spec/agentic-software-development/arcorbit-scene-skills.md",
              "arckit/interaction/engineering-profile/interaction.md",
              "arckit/tech/arcorbit/scene-skills-solution.md",
              "runtime/arcorbit/src/scene-skill-manager.mjs",
              "runtime/arcorbit/src/bundled-skill-catalog.mjs",
              "runtime/arcorbit/src/codex-scene-skills.mjs",
              "runtime/arcorbit/test/scene-skills.test.mjs",
              "runtime/arcorbit/test/scene-skills-discovery.test.mjs",
              "runtime/arcorbit/test/engineering-surface.test.mjs",
              "runtime/arcorbit/test/fixtures/engineering-electron.mjs",
              "runtime/arcorbit/scripts/smoke-distribution.mjs"
            ],
            "gap_refs": []
          },
          {
            "invariant_ref": "interaction-expectations-remain-recoverable",
            "disposition": "upheld",
            "reason": "Existing accepted facts retain their scoped evidence; the IPC review finding is an investigation/repair obligation, not an accepted new software fact.",
            "fact_refs": [
              "FACT-20260911-001-003"
            ],
            "evidence": [
              "arckit/spec/agentic-software-development/arcorbit-scene-skills.md",
              "arckit/interaction/engineering-profile/interaction.md",
              "arckit/tech/arcorbit/scene-skills-solution.md",
              "runtime/arcorbit/src/scene-skill-manager.mjs",
              "runtime/arcorbit/src/bundled-skill-catalog.mjs",
              "runtime/arcorbit/src/codex-scene-skills.mjs",
              "runtime/arcorbit/test/scene-skills.test.mjs",
              "runtime/arcorbit/test/scene-skills-discovery.test.mjs",
              "runtime/arcorbit/test/engineering-surface.test.mjs",
              "runtime/arcorbit/test/fixtures/engineering-electron.mjs",
              "runtime/arcorbit/scripts/smoke-distribution.mjs"
            ],
            "gap_refs": []
          },
          {
            "invariant_ref": "visual-language-remains-consistent",
            "disposition": "not_relevant",
            "reason": "Existing visual tokens and control language reused; no new durable visual-language rule.",
            "fact_refs": [],
            "evidence": [],
            "gap_refs": []
          },
          {
            "invariant_ref": "technical-decisions-remain-explainable",
            "disposition": "upheld",
            "reason": "Existing accepted facts retain their scoped evidence; the IPC review finding is an investigation/repair obligation, not an accepted new software fact.",
            "fact_refs": [
              "FACT-20260911-001-003"
            ],
            "evidence": [
              "arckit/spec/agentic-software-development/arcorbit-scene-skills.md",
              "arckit/interaction/engineering-profile/interaction.md",
              "arckit/tech/arcorbit/scene-skills-solution.md",
              "runtime/arcorbit/src/scene-skill-manager.mjs",
              "runtime/arcorbit/src/bundled-skill-catalog.mjs",
              "runtime/arcorbit/src/codex-scene-skills.mjs",
              "runtime/arcorbit/test/scene-skills.test.mjs",
              "runtime/arcorbit/test/scene-skills-discovery.test.mjs",
              "runtime/arcorbit/test/engineering-surface.test.mjs",
              "runtime/arcorbit/test/fixtures/engineering-electron.mjs",
              "runtime/arcorbit/scripts/smoke-distribution.mjs"
            ],
            "gap_refs": []
          },
          {
            "invariant_ref": "accepted-facts-are-realized",
            "disposition": "upheld",
            "reason": "Existing accepted facts retain their scoped evidence; the IPC review finding is an investigation/repair obligation, not an accepted new software fact.",
            "fact_refs": [
              "FACT-20260911-001-003"
            ],
            "evidence": [
              "arckit/spec/agentic-software-development/arcorbit-scene-skills.md",
              "arckit/interaction/engineering-profile/interaction.md",
              "arckit/tech/arcorbit/scene-skills-solution.md",
              "runtime/arcorbit/src/scene-skill-manager.mjs",
              "runtime/arcorbit/src/bundled-skill-catalog.mjs",
              "runtime/arcorbit/src/codex-scene-skills.mjs",
              "runtime/arcorbit/test/scene-skills.test.mjs",
              "runtime/arcorbit/test/scene-skills-discovery.test.mjs",
              "runtime/arcorbit/test/engineering-surface.test.mjs",
              "runtime/arcorbit/test/fixtures/engineering-electron.mjs",
              "runtime/arcorbit/scripts/smoke-distribution.mjs"
            ],
            "gap_refs": []
          },
          {
            "invariant_ref": "material-risks-have-credible-evidence",
            "disposition": "upheld",
            "reason": "Existing accepted facts retain their scoped evidence; the IPC review finding is an investigation/repair obligation, not an accepted new software fact.",
            "fact_refs": [
              "FACT-20260911-001-003"
            ],
            "evidence": [
              "arckit/spec/agentic-software-development/arcorbit-scene-skills.md",
              "arckit/interaction/engineering-profile/interaction.md",
              "arckit/tech/arcorbit/scene-skills-solution.md",
              "runtime/arcorbit/src/scene-skill-manager.mjs",
              "runtime/arcorbit/src/bundled-skill-catalog.mjs",
              "runtime/arcorbit/src/codex-scene-skills.mjs",
              "runtime/arcorbit/test/scene-skills.test.mjs",
              "runtime/arcorbit/test/scene-skills-discovery.test.mjs",
              "runtime/arcorbit/test/engineering-surface.test.mjs",
              "runtime/arcorbit/test/fixtures/engineering-electron.mjs",
              "runtime/arcorbit/scripts/smoke-distribution.mjs"
            ],
            "gap_refs": []
          }
        ]
      },
      "evidence": [
        "arckit/spec/agentic-software-development/arcorbit-scene-skills.md",
        "arckit/interaction/engineering-profile/interaction.md",
        "arckit/tech/arcorbit/scene-skills-solution.md",
        "runtime/arcorbit/src/scene-skill-manager.mjs",
        "runtime/arcorbit/src/bundled-skill-catalog.mjs",
        "runtime/arcorbit/src/codex-scene-skills.mjs",
        "runtime/arcorbit/test/scene-skills.test.mjs",
        "runtime/arcorbit/test/scene-skills-discovery.test.mjs",
        "runtime/arcorbit/test/engineering-surface.test.mjs",
        "runtime/arcorbit/test/fixtures/engineering-electron.mjs",
        "runtime/arcorbit/scripts/smoke-distribution.mjs"
      ],
      "runtime_result_ref": "",
      "occurred_at": "2026-09-11T08:31:46.004Z"
    },
    {
      "round": 4,
      "transition_schema_version": "arckit-case-transition/v8",
      "goal": "Resolve review finding: Engineering IPC snapshot/update/import must validate the primary renderer sender using the established Desktop trust boundary before reading settings, changing selections or opening a folder picker.",
      "outcome": "completed",
      "gap_selection": {
        "mode": "candidate",
        "basis": "candidate",
        "snapshot_token": "96191f64061ff3271aba4390d3553cd2c37f174d79190ca679d58c9853085b64",
        "selected_ref": "case-gap:CASE-20260911-001:CASE-20260911-001:review-finding:FINDING-20260911-001-001",
        "comparison_summary": "Authorized scene-skill implementation completed before unrelated project work.",
        "fresh_discovery_summary": "No additional fresh work selected.",
        "considered": [
          {
            "ref": "project-gap:GAP-agent-scenario-evaluation",
            "source": "persisted",
            "eligibility": "case_required",
            "disposition": "deferred",
            "priority_basis": {
              "reason": "explicit current task priority"
            },
            "reason": "Outside current requested work"
          },
          {
            "ref": "project-gap:GAP-runtime-resilience-and-adapters",
            "source": "persisted",
            "eligibility": "case_required",
            "disposition": "deferred",
            "priority_basis": {
              "reason": "explicit current task priority"
            },
            "reason": "Outside current requested work"
          },
          {
            "ref": "project-gap:GAP-security-real-project-validation",
            "source": "persisted",
            "eligibility": "case_required",
            "disposition": "deferred",
            "priority_basis": {
              "reason": "explicit current task priority"
            },
            "reason": "Outside current requested work"
          },
          {
            "ref": "project-gap:GAP-cross-record-audit",
            "source": "persisted",
            "eligibility": "case_required",
            "disposition": "deferred",
            "priority_basis": {
              "reason": "explicit current task priority"
            },
            "reason": "Outside current requested work"
          },
          {
            "ref": "case-gap:CASE-20260901-001:GAP-20260901-001-005",
            "source": "persisted",
            "eligibility": "blocked",
            "disposition": "deferred",
            "priority_basis": {
              "reason": "explicit current task priority"
            },
            "reason": "Outside current requested work"
          },
          {
            "ref": "case-gap:CASE-20260909-002:GAP-20260909-002-004",
            "source": "persisted",
            "eligibility": "blocked",
            "disposition": "deferred",
            "priority_basis": {
              "reason": "explicit current task priority"
            },
            "reason": "Outside current requested work"
          },
          {
            "ref": "case-gap:CASE-20260911-001:CASE-20260911-001:review-finding:FINDING-20260911-001-001",
            "source": "persisted",
            "eligibility": "ready",
            "disposition": "selected",
            "priority_basis": {
              "reason": "explicit current task priority"
            },
            "reason": "Current implementation gap for authorized Engineering work"
          },
          {
            "ref": "case-gap:CASE-20260911-003:GAP-20260911-003-001",
            "source": "persisted",
            "eligibility": "ready",
            "disposition": "deferred",
            "priority_basis": {
              "reason": "explicit current task priority"
            },
            "reason": "Outside current requested work"
          }
        ]
      },
      "selected_gap": {
        "id": "CASE-20260911-001:review-finding:FINDING-20260911-001-001",
        "responsibility": "agent",
        "goal": "Resolve review finding: Engineering IPC snapshot/update/import must validate the primary renderer sender using the established Desktop trust boundary before reading settings, changing selections or opening a folder picker.",
        "reason": "omission found by completion review",
        "derived_from": [
          "completion_review",
          "content_revision:2"
        ],
        "blocked_by": [],
        "priority_basis": {
          "blocking": "high",
          "uncertainty": "",
          "risk": "high",
          "user_impact": ""
        },
        "evidence_required": [
          "runtime/arcorbit/desktop/main.mjs"
        ]
      },
      "planned_transition": {
        "goal": "Resolve review finding: Engineering IPC snapshot/update/import must validate the primary renderer sender using the established Desktop trust boundary before reading settings, changing selections or opening a folder picker.",
        "expected_state_change": "Engineering IPC origin boundary enforced and review finding resolved"
      },
      "accepted_state_delta": {
        "resolved_gap": {
          "id": "CASE-20260911-001:review-finding:FINDING-20260911-001-001",
          "status": "resolved",
          "outcome": "resolved",
          "reason": "All three Engineering IPC handlers now enforce the established main-renderer identity before accessing data or dialogs; adversarial caller tests passed.",
          "evidence": [
            "runtime/arcorbit/desktop/main.mjs",
            "runtime/arcorbit/test/desktop-renderer.test.mjs",
            "arckit/tech/arcorbit/scene-skills-solution.md"
          ]
        },
        "facts_added": [
          {
            "id": "FACT-20260911-001-004",
            "revision": 1,
            "status": "accepted",
            "statement": "Engineering IPC snapshot, update and import operations reject non-primary renderer senders before reading settings, saving configuration or opening the native folder picker. The 65-test Desktop renderer suite and syntax/diff checks passed.",
            "basis": "actual IPC handler execution with legitimate and foreign sender identities",
            "evidence": [
              "runtime/arcorbit/desktop/main.mjs",
              "runtime/arcorbit/test/desktop-renderer.test.mjs",
              "arckit/tech/arcorbit/scene-skills-solution.md"
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
        "resolved_review_findings": [
          "FINDING-20260911-001-001"
        ],
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
        "project_revision": 368,
        "judgments": [
          {
            "invariant_ref": "product-expectations-remain-recoverable",
            "disposition": "upheld",
            "reason": "Definitions, implementation and scoped tests support the accepted scene skill contract and its boundaries.",
            "fact_refs": [
              "FACT-20260911-001-004"
            ],
            "evidence": [
              "runtime/arcorbit/desktop/main.mjs",
              "runtime/arcorbit/test/desktop-renderer.test.mjs",
              "arckit/tech/arcorbit/scene-skills-solution.md"
            ],
            "gap_refs": []
          },
          {
            "invariant_ref": "interaction-expectations-remain-recoverable",
            "disposition": "upheld",
            "reason": "Definitions, implementation and scoped tests support the accepted scene skill contract and its boundaries.",
            "fact_refs": [
              "FACT-20260911-001-004"
            ],
            "evidence": [
              "runtime/arcorbit/desktop/main.mjs",
              "runtime/arcorbit/test/desktop-renderer.test.mjs",
              "arckit/tech/arcorbit/scene-skills-solution.md"
            ],
            "gap_refs": []
          },
          {
            "invariant_ref": "visual-language-remains-consistent",
            "disposition": "not_relevant",
            "reason": "Existing visual tokens and control language reused; no new durable visual-language rule.",
            "fact_refs": [],
            "evidence": [],
            "gap_refs": []
          },
          {
            "invariant_ref": "technical-decisions-remain-explainable",
            "disposition": "upheld",
            "reason": "Definitions, implementation and scoped tests support the accepted scene skill contract and its boundaries.",
            "fact_refs": [
              "FACT-20260911-001-004"
            ],
            "evidence": [
              "runtime/arcorbit/desktop/main.mjs",
              "runtime/arcorbit/test/desktop-renderer.test.mjs",
              "arckit/tech/arcorbit/scene-skills-solution.md"
            ],
            "gap_refs": []
          },
          {
            "invariant_ref": "accepted-facts-are-realized",
            "disposition": "upheld",
            "reason": "Definitions, implementation and scoped tests support the accepted scene skill contract and its boundaries.",
            "fact_refs": [
              "FACT-20260911-001-004"
            ],
            "evidence": [
              "runtime/arcorbit/desktop/main.mjs",
              "runtime/arcorbit/test/desktop-renderer.test.mjs",
              "arckit/tech/arcorbit/scene-skills-solution.md"
            ],
            "gap_refs": []
          },
          {
            "invariant_ref": "material-risks-have-credible-evidence",
            "disposition": "upheld",
            "reason": "Definitions, implementation and scoped tests support the accepted scene skill contract and its boundaries.",
            "fact_refs": [
              "FACT-20260911-001-004"
            ],
            "evidence": [
              "runtime/arcorbit/desktop/main.mjs",
              "runtime/arcorbit/test/desktop-renderer.test.mjs",
              "arckit/tech/arcorbit/scene-skills-solution.md"
            ],
            "gap_refs": []
          }
        ]
      },
      "evidence": [
        "runtime/arcorbit/desktop/main.mjs",
        "runtime/arcorbit/test/desktop-renderer.test.mjs",
        "arckit/tech/arcorbit/scene-skills-solution.md"
      ],
      "runtime_result_ref": "",
      "occurred_at": "2026-09-11T08:32:52.735Z"
    },
    {
      "round": 5,
      "transition_schema_version": "arckit-case-transition/v8",
      "goal": "Review the completed implementation for correctness, real problem resolution, verification credibility, regression risk, and minimality.",
      "outcome": "completed",
      "gap_selection": {
        "mode": "candidate",
        "basis": "candidate",
        "snapshot_token": "0377ef2690e67edb0d6752f82d78b89040a2c58c39da5be2ce337f30bda503b9",
        "selected_ref": "case-gap:CASE-20260911-001:CASE-20260911-001:completion-review:2",
        "comparison_summary": "Authorized scene-skill implementation completed before unrelated project work.",
        "fresh_discovery_summary": "No additional fresh work selected.",
        "considered": [
          {
            "ref": "project-gap:GAP-agent-scenario-evaluation",
            "source": "persisted",
            "eligibility": "case_required",
            "disposition": "deferred",
            "priority_basis": {
              "reason": "explicit current task priority"
            },
            "reason": "Outside current requested work"
          },
          {
            "ref": "project-gap:GAP-runtime-resilience-and-adapters",
            "source": "persisted",
            "eligibility": "case_required",
            "disposition": "deferred",
            "priority_basis": {
              "reason": "explicit current task priority"
            },
            "reason": "Outside current requested work"
          },
          {
            "ref": "project-gap:GAP-security-real-project-validation",
            "source": "persisted",
            "eligibility": "case_required",
            "disposition": "deferred",
            "priority_basis": {
              "reason": "explicit current task priority"
            },
            "reason": "Outside current requested work"
          },
          {
            "ref": "project-gap:GAP-cross-record-audit",
            "source": "persisted",
            "eligibility": "case_required",
            "disposition": "deferred",
            "priority_basis": {
              "reason": "explicit current task priority"
            },
            "reason": "Outside current requested work"
          },
          {
            "ref": "case-gap:CASE-20260901-001:GAP-20260901-001-005",
            "source": "persisted",
            "eligibility": "blocked",
            "disposition": "deferred",
            "priority_basis": {
              "reason": "explicit current task priority"
            },
            "reason": "Outside current requested work"
          },
          {
            "ref": "case-gap:CASE-20260909-002:GAP-20260909-002-004",
            "source": "persisted",
            "eligibility": "blocked",
            "disposition": "deferred",
            "priority_basis": {
              "reason": "explicit current task priority"
            },
            "reason": "Outside current requested work"
          },
          {
            "ref": "case-gap:CASE-20260911-001:CASE-20260911-001:completion-review:2",
            "source": "persisted",
            "eligibility": "ready",
            "disposition": "selected",
            "priority_basis": {
              "reason": "explicit current task priority"
            },
            "reason": "Current implementation gap for authorized Engineering work"
          },
          {
            "ref": "case-gap:CASE-20260911-003:GAP-20260911-003-001",
            "source": "persisted",
            "eligibility": "ready",
            "disposition": "deferred",
            "priority_basis": {
              "reason": "explicit current task priority"
            },
            "reason": "Outside current requested work"
          }
        ]
      },
      "selected_gap": {
        "id": "CASE-20260911-001:completion-review:2",
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
        "goal": "Review the completed implementation for correctness, real problem resolution, verification credibility, regression risk, and minimality.",
        "expected_state_change": "Completion Review accepts implemented scene skills and verified IPC boundary"
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
          "dimensions": {
            "implementation_correctness": "clean",
            "problem_resolution": "clean",
            "verification_credibility": "clean",
            "regression_risk": "clean",
            "minimality": "clean"
          },
          "findings": [],
          "evidence": [
            "arckit/spec/agentic-software-development/arcorbit-scene-skills.md",
            "arckit/interaction/engineering-profile/interaction.md",
            "arckit/tech/arcorbit/scene-skills-solution.md",
            "runtime/arcorbit/src/scene-skill-manager.mjs",
            "runtime/arcorbit/src/bundled-skill-catalog.mjs",
            "runtime/arcorbit/src/codex-scene-skills.mjs",
            "runtime/arcorbit/test/scene-skills.test.mjs",
            "runtime/arcorbit/test/scene-skills-discovery.test.mjs",
            "runtime/arcorbit/test/engineering-surface.test.mjs",
            "runtime/arcorbit/test/fixtures/engineering-electron.mjs",
            "runtime/arcorbit/scripts/smoke-distribution.mjs",
            "runtime/arcorbit/desktop/main.mjs",
            "runtime/arcorbit/test/desktop-renderer.test.mjs"
          ],
          "reviewed_content_revision": 3
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
        "project_revision": 368,
        "judgments": [
          {
            "invariant_ref": "product-expectations-remain-recoverable",
            "disposition": "upheld",
            "reason": "Accepted implementation and IPC repair facts are supported by domain, renderer, Electron, native Codex discovery and packaged-resource checks; optional model capture remains explicitly scoped as not rerun.",
            "fact_refs": [
              "FACT-20260911-001-003",
              "FACT-20260911-001-004"
            ],
            "evidence": [
              "arckit/spec/agentic-software-development/arcorbit-scene-skills.md",
              "arckit/interaction/engineering-profile/interaction.md",
              "arckit/tech/arcorbit/scene-skills-solution.md",
              "runtime/arcorbit/src/scene-skill-manager.mjs",
              "runtime/arcorbit/src/bundled-skill-catalog.mjs",
              "runtime/arcorbit/src/codex-scene-skills.mjs",
              "runtime/arcorbit/test/scene-skills.test.mjs",
              "runtime/arcorbit/test/scene-skills-discovery.test.mjs",
              "runtime/arcorbit/test/engineering-surface.test.mjs",
              "runtime/arcorbit/test/fixtures/engineering-electron.mjs",
              "runtime/arcorbit/scripts/smoke-distribution.mjs"
            ],
            "gap_refs": []
          },
          {
            "invariant_ref": "interaction-expectations-remain-recoverable",
            "disposition": "upheld",
            "reason": "Accepted implementation and IPC repair facts are supported by domain, renderer, Electron, native Codex discovery and packaged-resource checks; optional model capture remains explicitly scoped as not rerun.",
            "fact_refs": [
              "FACT-20260911-001-003",
              "FACT-20260911-001-004"
            ],
            "evidence": [
              "arckit/spec/agentic-software-development/arcorbit-scene-skills.md",
              "arckit/interaction/engineering-profile/interaction.md",
              "arckit/tech/arcorbit/scene-skills-solution.md",
              "runtime/arcorbit/src/scene-skill-manager.mjs",
              "runtime/arcorbit/src/bundled-skill-catalog.mjs",
              "runtime/arcorbit/src/codex-scene-skills.mjs",
              "runtime/arcorbit/test/scene-skills.test.mjs",
              "runtime/arcorbit/test/scene-skills-discovery.test.mjs",
              "runtime/arcorbit/test/engineering-surface.test.mjs",
              "runtime/arcorbit/test/fixtures/engineering-electron.mjs",
              "runtime/arcorbit/scripts/smoke-distribution.mjs"
            ],
            "gap_refs": []
          },
          {
            "invariant_ref": "visual-language-remains-consistent",
            "disposition": "not_relevant",
            "reason": "Existing visual tokens and control language reused; no new durable visual-language rule.",
            "fact_refs": [],
            "evidence": [],
            "gap_refs": []
          },
          {
            "invariant_ref": "technical-decisions-remain-explainable",
            "disposition": "upheld",
            "reason": "Accepted implementation and IPC repair facts are supported by domain, renderer, Electron, native Codex discovery and packaged-resource checks; optional model capture remains explicitly scoped as not rerun.",
            "fact_refs": [
              "FACT-20260911-001-003",
              "FACT-20260911-001-004"
            ],
            "evidence": [
              "arckit/spec/agentic-software-development/arcorbit-scene-skills.md",
              "arckit/interaction/engineering-profile/interaction.md",
              "arckit/tech/arcorbit/scene-skills-solution.md",
              "runtime/arcorbit/src/scene-skill-manager.mjs",
              "runtime/arcorbit/src/bundled-skill-catalog.mjs",
              "runtime/arcorbit/src/codex-scene-skills.mjs",
              "runtime/arcorbit/test/scene-skills.test.mjs",
              "runtime/arcorbit/test/scene-skills-discovery.test.mjs",
              "runtime/arcorbit/test/engineering-surface.test.mjs",
              "runtime/arcorbit/test/fixtures/engineering-electron.mjs",
              "runtime/arcorbit/scripts/smoke-distribution.mjs"
            ],
            "gap_refs": []
          },
          {
            "invariant_ref": "accepted-facts-are-realized",
            "disposition": "upheld",
            "reason": "Accepted implementation and IPC repair facts are supported by domain, renderer, Electron, native Codex discovery and packaged-resource checks; optional model capture remains explicitly scoped as not rerun.",
            "fact_refs": [
              "FACT-20260911-001-003",
              "FACT-20260911-001-004"
            ],
            "evidence": [
              "arckit/spec/agentic-software-development/arcorbit-scene-skills.md",
              "arckit/interaction/engineering-profile/interaction.md",
              "arckit/tech/arcorbit/scene-skills-solution.md",
              "runtime/arcorbit/src/scene-skill-manager.mjs",
              "runtime/arcorbit/src/bundled-skill-catalog.mjs",
              "runtime/arcorbit/src/codex-scene-skills.mjs",
              "runtime/arcorbit/test/scene-skills.test.mjs",
              "runtime/arcorbit/test/scene-skills-discovery.test.mjs",
              "runtime/arcorbit/test/engineering-surface.test.mjs",
              "runtime/arcorbit/test/fixtures/engineering-electron.mjs",
              "runtime/arcorbit/scripts/smoke-distribution.mjs"
            ],
            "gap_refs": []
          },
          {
            "invariant_ref": "material-risks-have-credible-evidence",
            "disposition": "upheld",
            "reason": "Accepted implementation and IPC repair facts are supported by domain, renderer, Electron, native Codex discovery and packaged-resource checks; optional model capture remains explicitly scoped as not rerun.",
            "fact_refs": [
              "FACT-20260911-001-003",
              "FACT-20260911-001-004"
            ],
            "evidence": [
              "arckit/spec/agentic-software-development/arcorbit-scene-skills.md",
              "arckit/interaction/engineering-profile/interaction.md",
              "arckit/tech/arcorbit/scene-skills-solution.md",
              "runtime/arcorbit/src/scene-skill-manager.mjs",
              "runtime/arcorbit/src/bundled-skill-catalog.mjs",
              "runtime/arcorbit/src/codex-scene-skills.mjs",
              "runtime/arcorbit/test/scene-skills.test.mjs",
              "runtime/arcorbit/test/scene-skills-discovery.test.mjs",
              "runtime/arcorbit/test/engineering-surface.test.mjs",
              "runtime/arcorbit/test/fixtures/engineering-electron.mjs",
              "runtime/arcorbit/scripts/smoke-distribution.mjs"
            ],
            "gap_refs": []
          }
        ]
      },
      "evidence": [
        "arckit/spec/agentic-software-development/arcorbit-scene-skills.md",
        "arckit/interaction/engineering-profile/interaction.md",
        "arckit/tech/arcorbit/scene-skills-solution.md",
        "runtime/arcorbit/src/scene-skill-manager.mjs",
        "runtime/arcorbit/src/bundled-skill-catalog.mjs",
        "runtime/arcorbit/src/codex-scene-skills.mjs",
        "runtime/arcorbit/test/scene-skills.test.mjs",
        "runtime/arcorbit/test/scene-skills-discovery.test.mjs",
        "runtime/arcorbit/test/engineering-surface.test.mjs",
        "runtime/arcorbit/test/fixtures/engineering-electron.mjs",
        "runtime/arcorbit/scripts/smoke-distribution.mjs"
      ],
      "runtime_result_ref": "",
      "occurred_at": "2026-09-11T08:33:32.983Z"
    }
  ],
  "case_resolution": {
    "status": "resolved",
    "stage": "resolved",
    "satisfied": [
      "GAP-20260911-001-001",
      "GAP-20260911-001-002",
      "CASE-20260911-001:review-finding:FINDING-20260911-001-001"
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
    "updated_at": "2026-09-11T08:33:32.983Z"
  }
}
```

## Round Notes

- Case history is canonical in Structured Record.rounds; keep prose notes exceptional.
