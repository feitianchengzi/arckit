# Upgrade Project State v5 content evidence

Case: CASE-20260810-003
Status: closed
Artifact Type: document
Selected Gap: none
Updated: 2026-08-10T16:36:04.384Z

## User Intent

Upgrade the canonical Project State JSON content to satisfy the current project-state-record/v5 requirements with accurate project-specific decisions and durable repository evidence.

## Structured Record

```json
{
  "schema_version": "development-case-record/v5",
  "id": "CASE-20260810-003",
  "title": "Upgrade Project State v5 content evidence",
  "status": "closed",
  "artifact_type": "document",
  "created_at": "2026-08-10T16:33:26.472Z",
  "updated_at": "2026-08-10T16:36:04.384Z",
  "user_intent": "Upgrade the canonical Project State JSON content to satisfy the current project-state-record/v5 requirements with accurate project-specific decisions and durable repository evidence.",
  "expected_outcome": "The existing v5 structure and active advancement are preserved while stale or non-durable software-decision evidence is replaced with valid repository-owned evidence; canonical JSON, Markdown projection, Iteration, and Case records pass trusted validation and cross-record audit.",
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
      "statement": "The canonical Project State already uses the v5 structure and contains all 15 protocol-defined decision areas and six core software invariants, but four decision areas still cite stale paths or transient verification labels instead of current durable repository evidence.",
      "basis": "Fresh inspection of arckit/project/state.record.json against the v5 model and repository file inventory.",
      "evidence": [
        "arckit/project/state.record.json",
        "entry/skills/arckit-development-ledger/references/project-state-model.md"
      ]
    },
    {
      "id": "FACT-002",
      "revision": 1,
      "status": "accepted",
      "statement": "All local evidence references in the 15 Project State software decisions resolve to current repository files after replacing two removed document paths, one removed source path, and three transient verification labels.",
      "basis": "Fresh filesystem resolution check across every software_definition.decision_areas[*].decision.evidence entry.",
      "evidence": [
        "arckit/spec/agentic-software-development/runtime-automation-workspace.md",
        "arckit/tech/arckit-runtime/desktop-execution-solution.md",
        "arckit/visual/_library/brief.md",
        "arckit/visual/_library/design-tokens.yaml",
        "runtime/arckit-runtime/desktop/renderer/styles.css",
        "entry/skills/arckit-development-ledger/schema/project-state-record.schema.json",
        "entry/skills/arckit-development-ledger/schema/development-case-record.schema.json",
        "entry/skills/arckit-development-ledger/schema/case-transition.schema.json",
        "entry/skills/arckit-development-ledger/scripts/project-software-definition.mjs",
        "entry/skills/arckit-development-ledger/scripts/project-invariants.mjs",
        "runtime/arckit-runtime/schemas/agent-loop-result.schema.json",
        "runtime/arckit-runtime/schemas/runtime-result.schema.json",
        "runtime/arckit-runtime/test/project-ledger-governance.test.mjs",
        "runtime/arckit-runtime/test/state-condition-case.test.mjs",
        "arckit/cases/closed/CASE-20260810-001-implement-explicit-software-definition-project-state.md",
        "runtime/arckit-runtime/src/observability/lifecycle-trace.mjs",
        "runtime/arckit-runtime/src/desktop/desktop-store.mjs",
        "runtime/arckit-runtime/src/runtime-record-ref.mjs"
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
        "ref": "experience_and_interaction",
        "revision": 2
      },
      "effect": "upheld",
      "reason": "experience_and_interaction now cites current durable repository evidence and remains a settled Project decision.",
      "gap_ids": [],
      "evidence": [
        "arckit/spec/agentic-software-development/runtime-automation-workspace.md",
        "arckit/tech/arckit-runtime/desktop-execution-solution.md"
      ]
    },
    {
      "id": "IMPACT-002",
      "fact_id": "FACT-001",
      "fact_revision": 1,
      "target": {
        "kind": "software_decision",
        "ref": "visual_language",
        "revision": 2
      },
      "effect": "upheld",
      "reason": "visual_language now cites current durable repository evidence and remains a settled Project decision.",
      "gap_ids": [],
      "evidence": [
        "arckit/visual/_library/brief.md",
        "arckit/visual/_library/design-tokens.yaml",
        "runtime/arckit-runtime/desktop/renderer/styles.css"
      ]
    },
    {
      "id": "IMPACT-003",
      "fact_id": "FACT-001",
      "fact_revision": 1,
      "target": {
        "kind": "software_decision",
        "ref": "technical_foundation",
        "revision": 3
      },
      "effect": "upheld",
      "reason": "technical_foundation now cites current durable repository evidence and remains a settled Project decision.",
      "gap_ids": [],
      "evidence": [
        "entry/skills/arckit-development-ledger/schema/project-state-record.schema.json",
        "entry/skills/arckit-development-ledger/schema/development-case-record.schema.json",
        "entry/skills/arckit-development-ledger/schema/case-transition.schema.json",
        "entry/skills/arckit-development-ledger/scripts/project-software-definition.mjs",
        "entry/skills/arckit-development-ledger/scripts/project-invariants.mjs",
        "runtime/arckit-runtime/schemas/agent-loop-result.schema.json",
        "runtime/arckit-runtime/schemas/runtime-result.schema.json",
        "runtime/arckit-runtime/test/project-ledger-governance.test.mjs",
        "runtime/arckit-runtime/test/state-condition-case.test.mjs",
        "arckit/cases/closed/CASE-20260810-001-implement-explicit-software-definition-project-state.md"
      ]
    },
    {
      "id": "IMPACT-004",
      "fact_id": "FACT-001",
      "fact_revision": 1,
      "target": {
        "kind": "software_decision",
        "ref": "observability_and_operation",
        "revision": 2
      },
      "effect": "upheld",
      "reason": "observability_and_operation now cites current durable repository evidence and remains a settled Project decision.",
      "gap_ids": [],
      "evidence": [
        "arckit/tech/arckit-runtime/desktop-execution-solution.md",
        "runtime/arckit-runtime/src/observability/lifecycle-trace.mjs",
        "runtime/arckit-runtime/src/desktop/desktop-store.mjs",
        "runtime/arckit-runtime/src/runtime-record-ref.mjs"
      ]
    },
    {
      "id": "IMPACT-005",
      "fact_id": "FACT-001",
      "fact_revision": 1,
      "target": {
        "kind": "software_invariant",
        "ref": "changed-contracts-remain-explainable",
        "revision": null
      },
      "effect": "upheld",
      "reason": "All affected Project decisions now resolve to current repository-owned evidence, restoring durable contract recoverability.",
      "gap_ids": [],
      "evidence": [
        "arckit/spec/agentic-software-development/runtime-automation-workspace.md",
        "arckit/tech/arckit-runtime/desktop-execution-solution.md",
        "arckit/visual/_library/brief.md",
        "arckit/visual/_library/design-tokens.yaml",
        "runtime/arckit-runtime/desktop/renderer/styles.css",
        "entry/skills/arckit-development-ledger/schema/project-state-record.schema.json",
        "entry/skills/arckit-development-ledger/schema/development-case-record.schema.json",
        "entry/skills/arckit-development-ledger/schema/case-transition.schema.json",
        "entry/skills/arckit-development-ledger/scripts/project-software-definition.mjs",
        "entry/skills/arckit-development-ledger/scripts/project-invariants.mjs",
        "runtime/arckit-runtime/schemas/agent-loop-result.schema.json",
        "runtime/arckit-runtime/schemas/runtime-result.schema.json",
        "runtime/arckit-runtime/test/project-ledger-governance.test.mjs",
        "runtime/arckit-runtime/test/state-condition-case.test.mjs",
        "arckit/cases/closed/CASE-20260810-001-implement-explicit-software-definition-project-state.md",
        "runtime/arckit-runtime/src/observability/lifecycle-trace.mjs",
        "runtime/arckit-runtime/src/desktop/desktop-store.mjs",
        "runtime/arckit-runtime/src/runtime-record-ref.mjs"
      ]
    }
  ],
  "gaps": [
    {
      "id": "GAP-PROJECT-STATE-V5-CONTENT",
      "status": "resolved",
      "goal": "Replace stale or transient Project State decision evidence with current durable repository evidence while preserving the complete v5 decision/invariant structure and current advancement state.",
      "reason": "Content-level migration is incomplete even though the JSON already satisfies the structural v5 schema.",
      "derived_from": [
        "case_intent",
        "FACT-001",
        "experience_and_interaction",
        "visual_language",
        "technical_foundation",
        "observability_and_operation",
        "changed-contracts-remain-explainable"
      ],
      "blocked_by": [],
      "priority_basis": {
        "blocking": "high",
        "uncertainty": "low",
        "risk": "medium",
        "user_impact": "high"
      },
      "responsibility": "agent",
      "evidence_required": [
        "all software-decision local evidence refs resolve",
        "project-state-record/v5 validation",
        "cross-record audit",
        "STATE.md projection parity"
      ],
      "resolution": {
        "id": "GAP-PROJECT-STATE-V5-CONTENT",
        "status": "resolved",
        "outcome": "Project State v5 content now uses current durable evidence for interaction, visual language, technical foundation, and observability decisions while preserving all 15 areas, six invariants, project gaps, and both active Case refs.",
        "reason": "Repository inspection identified and replaced every stale path and transient verification label in software-decision evidence.",
        "evidence": [
          "arckit/spec/agentic-software-development/runtime-automation-workspace.md",
          "arckit/tech/arckit-runtime/desktop-execution-solution.md",
          "arckit/visual/_library/brief.md",
          "arckit/visual/_library/design-tokens.yaml",
          "runtime/arckit-runtime/desktop/renderer/styles.css",
          "entry/skills/arckit-development-ledger/schema/project-state-record.schema.json",
          "entry/skills/arckit-development-ledger/schema/development-case-record.schema.json",
          "entry/skills/arckit-development-ledger/schema/case-transition.schema.json",
          "entry/skills/arckit-development-ledger/scripts/project-software-definition.mjs",
          "entry/skills/arckit-development-ledger/scripts/project-invariants.mjs",
          "runtime/arckit-runtime/schemas/agent-loop-result.schema.json",
          "runtime/arckit-runtime/schemas/runtime-result.schema.json",
          "runtime/arckit-runtime/test/project-ledger-governance.test.mjs",
          "runtime/arckit-runtime/test/state-condition-case.test.mjs",
          "arckit/cases/closed/CASE-20260810-001-implement-explicit-software-definition-project-state.md",
          "runtime/arckit-runtime/src/observability/lifecycle-trace.mjs",
          "runtime/arckit-runtime/src/desktop/desktop-store.mjs",
          "runtime/arckit-runtime/src/runtime-record-ref.mjs"
        ],
        "occurred_at": "2026-08-10T16:35:10.475Z"
      }
    }
  ],
  "content_revision": 1,
  "completion_review": {
    "status": "clean",
    "policy": {
      "initial_max_cycles": 3,
      "source": "using-arckit:user-request:2026-08-11",
      "snapshotted_at": "2026-08-10T16:33:26.472Z"
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
          "arckit/cases/active/CASE-20260810-003-upgrade-project-state-v5-content-evidence.md",
          "entry/skills/arckit-development-ledger/schema/project-state-record.schema.json",
          "runtime/arckit-runtime/test/project-ledger-governance.test.mjs",
          "runtime/arckit-runtime/test/state-condition-case.test.mjs",
          "verification:project-state-validate:ok",
          "verification:project-state-cross-record-audit:ok",
          "verification:decision-evidence-resolution:15-decisions-0-missing-0-transient",
          "verification:node-test:14-pass"
        ],
        "occurred_at": "2026-08-10T16:36:04.384Z"
      }
    ],
    "evidence": [
      "arckit/project/state.record.json",
      "arckit/project/STATE.md",
      "arckit/cases/active/CASE-20260810-003-upgrade-project-state-v5-content-evidence.md",
      "entry/skills/arckit-development-ledger/schema/project-state-record.schema.json",
      "runtime/arckit-runtime/test/project-ledger-governance.test.mjs",
      "runtime/arckit-runtime/test/state-condition-case.test.mjs",
      "verification:project-state-validate:ok",
      "verification:project-state-cross-record-audit:ok",
      "verification:decision-evidence-resolution:15-decisions-0-missing-0-transient",
      "verification:node-test:14-pass"
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
      "goal": "Correct the content-level v5 migration defects in Project State decision evidence.",
      "outcome": "completed",
      "selected_gap": {
        "id": "GAP-PROJECT-STATE-V5-CONTENT",
        "responsibility": "agent",
        "goal": "Replace stale or transient Project State decision evidence with current durable repository evidence while preserving the complete v5 decision/invariant structure and current advancement state.",
        "reason": "Content-level migration is incomplete even though the JSON already satisfies the structural v5 schema.",
        "derived_from": [
          "case_intent",
          "FACT-001",
          "experience_and_interaction",
          "visual_language",
          "technical_foundation",
          "observability_and_operation",
          "changed-contracts-remain-explainable"
        ],
        "blocked_by": [],
        "priority_basis": {
          "blocking": "high",
          "uncertainty": "low",
          "risk": "medium",
          "user_impact": "high"
        },
        "evidence_required": [
          "all software-decision local evidence refs resolve",
          "project-state-record/v5 validation",
          "cross-record audit",
          "STATE.md projection parity"
        ]
      },
      "planned_transition": {
        "goal": "Correct the content-level v5 migration defects in Project State decision evidence.",
        "expected_state_change": "Four affected software decisions advance to new revisions backed only by current durable repository evidence; the Case gap and its threatened/undetermined impacts close."
      },
      "accepted_state_delta": {
        "resolved_gap": {
          "id": "GAP-PROJECT-STATE-V5-CONTENT",
          "status": "resolved",
          "outcome": "Project State v5 content now uses current durable evidence for interaction, visual language, technical foundation, and observability decisions while preserving all 15 areas, six invariants, project gaps, and both active Case refs.",
          "reason": "Repository inspection identified and replaced every stale path and transient verification label in software-decision evidence.",
          "evidence": [
            "arckit/spec/agentic-software-development/runtime-automation-workspace.md",
            "arckit/tech/arckit-runtime/desktop-execution-solution.md",
            "arckit/visual/_library/brief.md",
            "arckit/visual/_library/design-tokens.yaml",
            "runtime/arckit-runtime/desktop/renderer/styles.css",
            "entry/skills/arckit-development-ledger/schema/project-state-record.schema.json",
            "entry/skills/arckit-development-ledger/schema/development-case-record.schema.json",
            "entry/skills/arckit-development-ledger/schema/case-transition.schema.json",
            "entry/skills/arckit-development-ledger/scripts/project-software-definition.mjs",
            "entry/skills/arckit-development-ledger/scripts/project-invariants.mjs",
            "runtime/arckit-runtime/schemas/agent-loop-result.schema.json",
            "runtime/arckit-runtime/schemas/runtime-result.schema.json",
            "runtime/arckit-runtime/test/project-ledger-governance.test.mjs",
            "runtime/arckit-runtime/test/state-condition-case.test.mjs",
            "arckit/cases/closed/CASE-20260810-001-implement-explicit-software-definition-project-state.md",
            "runtime/arckit-runtime/src/observability/lifecycle-trace.mjs",
            "runtime/arckit-runtime/src/desktop/desktop-store.mjs",
            "runtime/arckit-runtime/src/runtime-record-ref.mjs"
          ]
        },
        "facts_added": [
          {
            "id": "FACT-002",
            "revision": 1,
            "status": "accepted",
            "statement": "All local evidence references in the 15 Project State software decisions resolve to current repository files after replacing two removed document paths, one removed source path, and three transient verification labels.",
            "basis": "Fresh filesystem resolution check across every software_definition.decision_areas[*].decision.evidence entry.",
            "evidence": [
              "arckit/spec/agentic-software-development/runtime-automation-workspace.md",
              "arckit/tech/arckit-runtime/desktop-execution-solution.md",
              "arckit/visual/_library/brief.md",
              "arckit/visual/_library/design-tokens.yaml",
              "runtime/arckit-runtime/desktop/renderer/styles.css",
              "entry/skills/arckit-development-ledger/schema/project-state-record.schema.json",
              "entry/skills/arckit-development-ledger/schema/development-case-record.schema.json",
              "entry/skills/arckit-development-ledger/schema/case-transition.schema.json",
              "entry/skills/arckit-development-ledger/scripts/project-software-definition.mjs",
              "entry/skills/arckit-development-ledger/scripts/project-invariants.mjs",
              "runtime/arckit-runtime/schemas/agent-loop-result.schema.json",
              "runtime/arckit-runtime/schemas/runtime-result.schema.json",
              "runtime/arckit-runtime/test/project-ledger-governance.test.mjs",
              "runtime/arckit-runtime/test/state-condition-case.test.mjs",
              "arckit/cases/closed/CASE-20260810-001-implement-explicit-software-definition-project-state.md",
              "runtime/arckit-runtime/src/observability/lifecycle-trace.mjs",
              "runtime/arckit-runtime/src/desktop/desktop-store.mjs",
              "runtime/arckit-runtime/src/runtime-record-ref.mjs"
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
              "ref": "experience_and_interaction",
              "revision": 2
            },
            "effect": "upheld",
            "reason": "experience_and_interaction now cites current durable repository evidence and remains a settled Project decision.",
            "gap_ids": [],
            "evidence": [
              "arckit/spec/agentic-software-development/runtime-automation-workspace.md",
              "arckit/tech/arckit-runtime/desktop-execution-solution.md"
            ]
          },
          {
            "id": "IMPACT-002",
            "fact_id": "FACT-001",
            "fact_revision": 1,
            "target": {
              "kind": "software_decision",
              "ref": "visual_language",
              "revision": 2
            },
            "effect": "upheld",
            "reason": "visual_language now cites current durable repository evidence and remains a settled Project decision.",
            "gap_ids": [],
            "evidence": [
              "arckit/visual/_library/brief.md",
              "arckit/visual/_library/design-tokens.yaml",
              "runtime/arckit-runtime/desktop/renderer/styles.css"
            ]
          },
          {
            "id": "IMPACT-003",
            "fact_id": "FACT-001",
            "fact_revision": 1,
            "target": {
              "kind": "software_decision",
              "ref": "technical_foundation",
              "revision": 3
            },
            "effect": "upheld",
            "reason": "technical_foundation now cites current durable repository evidence and remains a settled Project decision.",
            "gap_ids": [],
            "evidence": [
              "entry/skills/arckit-development-ledger/schema/project-state-record.schema.json",
              "entry/skills/arckit-development-ledger/schema/development-case-record.schema.json",
              "entry/skills/arckit-development-ledger/schema/case-transition.schema.json",
              "entry/skills/arckit-development-ledger/scripts/project-software-definition.mjs",
              "entry/skills/arckit-development-ledger/scripts/project-invariants.mjs",
              "runtime/arckit-runtime/schemas/agent-loop-result.schema.json",
              "runtime/arckit-runtime/schemas/runtime-result.schema.json",
              "runtime/arckit-runtime/test/project-ledger-governance.test.mjs",
              "runtime/arckit-runtime/test/state-condition-case.test.mjs",
              "arckit/cases/closed/CASE-20260810-001-implement-explicit-software-definition-project-state.md"
            ]
          },
          {
            "id": "IMPACT-004",
            "fact_id": "FACT-001",
            "fact_revision": 1,
            "target": {
              "kind": "software_decision",
              "ref": "observability_and_operation",
              "revision": 2
            },
            "effect": "upheld",
            "reason": "observability_and_operation now cites current durable repository evidence and remains a settled Project decision.",
            "gap_ids": [],
            "evidence": [
              "arckit/tech/arckit-runtime/desktop-execution-solution.md",
              "runtime/arckit-runtime/src/observability/lifecycle-trace.mjs",
              "runtime/arckit-runtime/src/desktop/desktop-store.mjs",
              "runtime/arckit-runtime/src/runtime-record-ref.mjs"
            ]
          },
          {
            "id": "IMPACT-005",
            "fact_id": "FACT-001",
            "fact_revision": 1,
            "target": {
              "kind": "software_invariant",
              "ref": "changed-contracts-remain-explainable",
              "revision": null
            },
            "effect": "upheld",
            "reason": "All affected Project decisions now resolve to current repository-owned evidence, restoring durable contract recoverability.",
            "gap_ids": [],
            "evidence": [
              "arckit/spec/agentic-software-development/runtime-automation-workspace.md",
              "arckit/tech/arckit-runtime/desktop-execution-solution.md",
              "arckit/visual/_library/brief.md",
              "arckit/visual/_library/design-tokens.yaml",
              "runtime/arckit-runtime/desktop/renderer/styles.css",
              "entry/skills/arckit-development-ledger/schema/project-state-record.schema.json",
              "entry/skills/arckit-development-ledger/schema/development-case-record.schema.json",
              "entry/skills/arckit-development-ledger/schema/case-transition.schema.json",
              "entry/skills/arckit-development-ledger/scripts/project-software-definition.mjs",
              "entry/skills/arckit-development-ledger/scripts/project-invariants.mjs",
              "runtime/arckit-runtime/schemas/agent-loop-result.schema.json",
              "runtime/arckit-runtime/schemas/runtime-result.schema.json",
              "runtime/arckit-runtime/test/project-ledger-governance.test.mjs",
              "runtime/arckit-runtime/test/state-condition-case.test.mjs",
              "arckit/cases/closed/CASE-20260810-001-implement-explicit-software-definition-project-state.md",
              "runtime/arckit-runtime/src/observability/lifecycle-trace.mjs",
              "runtime/arckit-runtime/src/desktop/desktop-store.mjs",
              "runtime/arckit-runtime/src/runtime-record-ref.mjs"
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
            "observed_revision": 1,
            "set_decision": {
              "status": "settled",
              "statement": "Users can invoke using-arckit conversationally; Desktop users select a project/todo, observe one persistent Agent conversation, steer it, and recover persisted runs.",
              "reason": "The current coherent-Agent journey, persistence, steering, recovery, and user-visible message behavior are defined by the Runtime workspace specification and Desktop execution contract.",
              "evidence": [
                "arckit/spec/agentic-software-development/runtime-automation-workspace.md",
                "arckit/tech/arckit-runtime/desktop-execution-solution.md"
              ],
              "confidence": "high",
              "resume_condition": ""
            },
            "gap_refs": [],
            "reason": "Replace stale or transient experience_and_interaction evidence with current durable repository evidence.",
            "evidence": [
              "arckit/spec/agentic-software-development/runtime-automation-workspace.md",
              "arckit/tech/arckit-runtime/desktop-execution-solution.md"
            ]
          },
          {
            "area_ref": "visual_language",
            "observed_revision": 1,
            "set_decision": {
              "status": "settled",
              "statement": "Visual requirements apply to the Desktop workspace and follow its durable visual specification; CLI and ledger surfaces remain text-native.",
              "reason": "The maintained visual brief and token library define the Desktop presentation language, while the shipped renderer stylesheet is its executable surface.",
              "evidence": [
                "arckit/visual/_library/brief.md",
                "arckit/visual/_library/design-tokens.yaml",
                "runtime/arckit-runtime/desktop/renderer/styles.css"
              ],
              "confidence": "high",
              "resume_condition": ""
            },
            "gap_refs": [],
            "reason": "Replace stale or transient visual_language evidence with current durable repository evidence.",
            "evidence": [
              "arckit/visual/_library/brief.md",
              "arckit/visual/_library/design-tokens.yaml",
              "runtime/arckit-runtime/desktop/renderer/styles.css"
            ]
          },
          {
            "area_ref": "technical_foundation",
            "observed_revision": 2,
            "set_decision": {
              "status": "settled",
              "statement": "Arckit uses repository-owned Markdown/JSON state, Node.js ESM ledger and Runtime scripts, an Electron desktop host, Project State v5, Case/Transition v5, and Iteration v3 with trusted atomic transitions.",
              "reason": "The accepted v5 cutover is durably represented by canonical schemas, ledger scripts, Runtime contracts, automated regression tests, and its closed implementation Case.",
              "evidence": [
                "entry/skills/arckit-development-ledger/schema/project-state-record.schema.json",
                "entry/skills/arckit-development-ledger/schema/development-case-record.schema.json",
                "entry/skills/arckit-development-ledger/schema/case-transition.schema.json",
                "entry/skills/arckit-development-ledger/scripts/project-software-definition.mjs",
                "entry/skills/arckit-development-ledger/scripts/project-invariants.mjs",
                "runtime/arckit-runtime/schemas/agent-loop-result.schema.json",
                "runtime/arckit-runtime/schemas/runtime-result.schema.json",
                "runtime/arckit-runtime/test/project-ledger-governance.test.mjs",
                "runtime/arckit-runtime/test/state-condition-case.test.mjs",
                "arckit/cases/closed/CASE-20260810-001-implement-explicit-software-definition-project-state.md"
              ],
              "confidence": "high",
              "resume_condition": ""
            },
            "gap_refs": [
              "GAP-runtime-resilience-and-adapters"
            ],
            "reason": "Replace stale or transient technical_foundation evidence with current durable repository evidence.",
            "evidence": [
              "entry/skills/arckit-development-ledger/schema/project-state-record.schema.json",
              "entry/skills/arckit-development-ledger/schema/development-case-record.schema.json",
              "entry/skills/arckit-development-ledger/schema/case-transition.schema.json",
              "entry/skills/arckit-development-ledger/scripts/project-software-definition.mjs",
              "entry/skills/arckit-development-ledger/scripts/project-invariants.mjs",
              "runtime/arckit-runtime/schemas/agent-loop-result.schema.json",
              "runtime/arckit-runtime/schemas/runtime-result.schema.json",
              "runtime/arckit-runtime/test/project-ledger-governance.test.mjs",
              "runtime/arckit-runtime/test/state-condition-case.test.mjs",
              "arckit/cases/closed/CASE-20260810-001-implement-explicit-software-definition-project-state.md"
            ]
          },
          {
            "area_ref": "observability_and_operation",
            "observed_revision": 1,
            "set_decision": {
              "status": "settled",
              "statement": "Runtime persists lifecycle, activity, messages and timing outside the target project, supports restart reconciliation, and exposes opaque run refs for canonical traceability.",
              "reason": "The Desktop execution contract and current Runtime sources define persistent messages, lifecycle events, timing, restart recovery, and canonical opaque-reference boundaries.",
              "evidence": [
                "arckit/tech/arckit-runtime/desktop-execution-solution.md",
                "runtime/arckit-runtime/src/observability/lifecycle-trace.mjs",
                "runtime/arckit-runtime/src/desktop/desktop-store.mjs",
                "runtime/arckit-runtime/src/runtime-record-ref.mjs"
              ],
              "confidence": "high",
              "resume_condition": ""
            },
            "gap_refs": [
              "GAP-runtime-resilience-and-adapters"
            ],
            "reason": "Replace stale or transient observability_and_operation evidence with current durable repository evidence.",
            "evidence": [
              "arckit/tech/arckit-runtime/desktop-execution-solution.md",
              "runtime/arckit-runtime/src/observability/lifecycle-trace.mjs",
              "runtime/arckit-runtime/src/desktop/desktop-store.mjs",
              "runtime/arckit-runtime/src/runtime-record-ref.mjs"
            ]
          }
        ],
        "software_invariant_changes": [],
        "project_gap_changes": [],
        "selection_context_change": null,
        "evidence": [
          "arckit/spec/agentic-software-development/runtime-automation-workspace.md",
          "arckit/tech/arckit-runtime/desktop-execution-solution.md",
          "arckit/visual/_library/brief.md",
          "arckit/visual/_library/design-tokens.yaml",
          "runtime/arckit-runtime/desktop/renderer/styles.css",
          "entry/skills/arckit-development-ledger/schema/project-state-record.schema.json",
          "entry/skills/arckit-development-ledger/schema/development-case-record.schema.json",
          "entry/skills/arckit-development-ledger/schema/case-transition.schema.json",
          "entry/skills/arckit-development-ledger/scripts/project-software-definition.mjs",
          "entry/skills/arckit-development-ledger/scripts/project-invariants.mjs",
          "runtime/arckit-runtime/schemas/agent-loop-result.schema.json",
          "runtime/arckit-runtime/schemas/runtime-result.schema.json",
          "runtime/arckit-runtime/test/project-ledger-governance.test.mjs",
          "runtime/arckit-runtime/test/state-condition-case.test.mjs",
          "arckit/cases/closed/CASE-20260810-001-implement-explicit-software-definition-project-state.md",
          "runtime/arckit-runtime/src/observability/lifecycle-trace.mjs",
          "runtime/arckit-runtime/src/desktop/desktop-store.mjs",
          "runtime/arckit-runtime/src/runtime-record-ref.mjs"
        ]
      },
      "evidence": [
        "arckit/spec/agentic-software-development/runtime-automation-workspace.md",
        "arckit/tech/arckit-runtime/desktop-execution-solution.md",
        "arckit/visual/_library/brief.md",
        "arckit/visual/_library/design-tokens.yaml",
        "runtime/arckit-runtime/desktop/renderer/styles.css",
        "entry/skills/arckit-development-ledger/schema/project-state-record.schema.json",
        "entry/skills/arckit-development-ledger/schema/development-case-record.schema.json",
        "entry/skills/arckit-development-ledger/schema/case-transition.schema.json",
        "entry/skills/arckit-development-ledger/scripts/project-software-definition.mjs",
        "entry/skills/arckit-development-ledger/scripts/project-invariants.mjs",
        "runtime/arckit-runtime/schemas/agent-loop-result.schema.json",
        "runtime/arckit-runtime/schemas/runtime-result.schema.json",
        "runtime/arckit-runtime/test/project-ledger-governance.test.mjs",
        "runtime/arckit-runtime/test/state-condition-case.test.mjs",
        "arckit/cases/closed/CASE-20260810-001-implement-explicit-software-definition-project-state.md",
        "runtime/arckit-runtime/src/observability/lifecycle-trace.mjs",
        "runtime/arckit-runtime/src/desktop/desktop-store.mjs",
        "runtime/arckit-runtime/src/runtime-record-ref.mjs"
      ],
      "runtime_result_ref": "",
      "occurred_at": "2026-08-10T16:35:10.475Z"
    },
    {
      "round": 2,
      "goal": "Review the Project State v5 content upgrade for correctness, resolution, evidence quality, regression safety, and minimality.",
      "outcome": "completed",
      "selected_gap": {
        "id": "CASE-20260810-003:completion-review:1",
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
        "goal": "Review the Project State v5 content upgrade for correctness, resolution, evidence quality, regression safety, and minimality.",
        "expected_state_change": "Record a clean review for content_revision 1 and close the Case without further Project content mutation."
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
            "arckit/cases/active/CASE-20260810-003-upgrade-project-state-v5-content-evidence.md",
            "entry/skills/arckit-development-ledger/schema/project-state-record.schema.json",
            "runtime/arckit-runtime/test/project-ledger-governance.test.mjs",
            "runtime/arckit-runtime/test/state-condition-case.test.mjs",
            "verification:project-state-validate:ok",
            "verification:project-state-cross-record-audit:ok",
            "verification:decision-evidence-resolution:15-decisions-0-missing-0-transient",
            "verification:node-test:14-pass"
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
        "arckit/cases/active/CASE-20260810-003-upgrade-project-state-v5-content-evidence.md",
        "entry/skills/arckit-development-ledger/schema/project-state-record.schema.json",
        "runtime/arckit-runtime/test/project-ledger-governance.test.mjs",
        "runtime/arckit-runtime/test/state-condition-case.test.mjs",
        "verification:project-state-validate:ok",
        "verification:project-state-cross-record-audit:ok",
        "verification:decision-evidence-resolution:15-decisions-0-missing-0-transient",
        "verification:node-test:14-pass"
      ],
      "runtime_result_ref": "",
      "occurred_at": "2026-08-10T16:36:04.384Z"
    }
  ],
  "case_resolution": {
    "status": "resolved",
    "stage": "resolved",
    "satisfied": [
      "GAP-PROJECT-STATE-V5-CONTENT"
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
    "updated_at": "2026-08-10T16:36:04.384Z"
  }
}
```

## Round Notes

- Case history is canonical in Structured Record.rounds; keep prose notes exceptional.
