# Implement Case-driven definition completeness loop

Case: CASE-20260726-001
Status: closed
Artifact Type: mixed
Selected Gap: none
Updated: 2026-07-26T18:58:51.973Z

## User Intent

Use Case State to dynamically drive spec-first, code-first, and mixed software development while ensuring complete evidence-backed definition artifacts; align human-agent and Runtime behavior without fixed skill sequences.

## Structured Record

```json
{
  "schema_version": "development-case-record/v3",
  "id": "CASE-20260726-001",
  "title": "Implement Case-driven definition completeness loop",
  "status": "closed",
  "artifact_type": "mixed",
  "created_at": "2026-07-26T16:52:02.090Z",
  "updated_at": "2026-07-26T18:58:51.973Z",
  "user_intent": "Use Case State to dynamically drive spec-first, code-first, and mixed software development while ensuring complete evidence-backed definition artifacts; align human-agent and Runtime behavior without fixed skill sequences.",
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
      "reason": "The macro Project, bounded Case, unordered candidate-gap selection, and one-transition Loop semantics are formalized as stable product facts.",
      "evidence": [
        "arckit/spec/agentic-software-development/product-concepts.md",
        "arckit/spec/agentic-software-development/product-architecture.md",
        "arckit/spec/agentic-software-development/controller-worker-loop.md",
        "entry/skills/using-arckit/SKILL.md"
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
      "reason": "This bounded protocol and runtime-state cutover introduces no new user task flow, navigation, input, error-recovery interaction, or wireframe source; the Desktop only projects the same Project/Case/Round control state with corrected labels.",
      "evidence": [
        "arckit/spec/agentic-software-development/product-architecture.md",
        "runtime/arckit-runtime/desktop/renderer/renderer.js"
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
      "reason": "The change adds no visual direction, design token, theme, component appearance, or aesthetic decision; it only changes state semantics and textual projection fields.",
      "evidence": [
        "runtime/arckit-runtime/desktop/renderer/renderer.js",
        "runtime/arckit-runtime/desktop/renderer/styles.css"
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
      "reason": "The Case v2, Project v3, shared transition entrypoint, capability invocation, Runtime gate, and state-store boundaries are formalized and match the implementation.",
      "evidence": [
        "arckit/tech/arckit-runtime/solution.md",
        "entry/skills/arckit-development-ledger/schema/development-case-record.schema.json",
        "entry/skills/arckit-development-ledger/schema/case-transition.schema.json",
        "entry/skills/arckit-development-ledger/schema/project-state-record.schema.json"
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
      "reason": "Definition skills, Controller, ledger scripts, Runtime orchestration, gate, state store, schemas, renderer, and repository records use only the new Case-driven model.",
      "evidence": [
        "definition/skills/_arckit_shared/case-fact-contract.md",
        "entry/skills/arckit-development-ledger/scripts/development-case.mjs",
        "entry/skills/arckit-development-ledger/scripts/case-transition.mjs",
        "entry/skills/arckit-development-ledger/scripts/runtime-writeback.mjs",
        "runtime/arckit-runtime/src/loop-controller.mjs",
        "runtime/arckit-runtime/src/agent-orchestrator.mjs",
        "runtime/arckit-runtime/src/gate-engine.mjs"
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
      "reason": "Spec-first, code-first, explicit not_required, unordered Runtime selection, shared non-dry writeback, syntax, skill structure, ledger audit, and repository smoke scenarios pass.",
      "evidence": [
        "runtime/arckit-runtime/test/case-transition.test.mjs",
        "runtime/arckit-runtime/test/capability-registry.test.mjs",
        "npm run check --prefix runtime/arckit-runtime",
        "npm run smoke --prefix runtime/arckit-runtime",
        "skill-creator quick_validate for six changed skills",
        "project, iteration, and all Case audits"
      ],
      "next_transition": ""
    }
  },
  "open_questions": [],
  "decisions": [],
  "pending_handoffs": [],
  "process_notes": [],
  "rounds": [
    {
      "round": 1,
      "goal": "Complete the one-time Case-driven state model cutover across skills, ledger, Runtime, repository facts, and tests.",
      "outcome": "completed",
      "planned_transition": "All six Case facets move from unknown to evidence-backed required targets or explicit not_required judgments.",
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
              "reason": "The macro Project, bounded Case, unordered candidate-gap selection, and one-transition Loop semantics are formalized as stable product facts.",
              "next_transition": ""
            },
            "evidence": [
              "arckit/spec/agentic-software-development/product-concepts.md",
              "arckit/spec/agentic-software-development/product-architecture.md",
              "arckit/spec/agentic-software-development/controller-worker-loop.md",
              "entry/skills/using-arckit/SKILL.md"
            ]
          },
          {
            "facet": "interaction_expectation",
            "set": {
              "applicability": "not_required",
              "resolution": "resolved",
              "reason": "This bounded protocol and runtime-state cutover introduces no new user task flow, navigation, input, error-recovery interaction, or wireframe source; the Desktop only projects the same Project/Case/Round control state with corrected labels.",
              "next_transition": ""
            },
            "evidence": [
              "arckit/spec/agentic-software-development/product-architecture.md",
              "runtime/arckit-runtime/desktop/renderer/renderer.js"
            ]
          },
          {
            "facet": "visual_expectation",
            "set": {
              "applicability": "not_required",
              "resolution": "resolved",
              "reason": "The change adds no visual direction, design token, theme, component appearance, or aesthetic decision; it only changes state semantics and textual projection fields.",
              "next_transition": ""
            },
            "evidence": [
              "runtime/arckit-runtime/desktop/renderer/renderer.js",
              "runtime/arckit-runtime/desktop/renderer/styles.css"
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
              "reason": "The Case v2, Project v3, shared transition entrypoint, capability invocation, Runtime gate, and state-store boundaries are formalized and match the implementation.",
              "next_transition": ""
            },
            "evidence": [
              "arckit/tech/arckit-runtime/solution.md",
              "entry/skills/arckit-development-ledger/schema/development-case-record.schema.json",
              "entry/skills/arckit-development-ledger/schema/case-transition.schema.json",
              "entry/skills/arckit-development-ledger/schema/project-state-record.schema.json"
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
              "reason": "Definition skills, Controller, ledger scripts, Runtime orchestration, gate, state store, schemas, renderer, and repository records use only the new Case-driven model.",
              "next_transition": ""
            },
            "evidence": [
              "definition/skills/_arckit_shared/case-fact-contract.md",
              "entry/skills/arckit-development-ledger/scripts/development-case.mjs",
              "entry/skills/arckit-development-ledger/scripts/case-transition.mjs",
              "entry/skills/arckit-development-ledger/scripts/runtime-writeback.mjs",
              "runtime/arckit-runtime/src/loop-controller.mjs",
              "runtime/arckit-runtime/src/agent-orchestrator.mjs",
              "runtime/arckit-runtime/src/gate-engine.mjs"
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
              "reason": "Spec-first, code-first, explicit not_required, unordered Runtime selection, shared non-dry writeback, syntax, skill structure, ledger audit, and repository smoke scenarios pass.",
              "next_transition": ""
            },
            "evidence": [
              "runtime/arckit-runtime/test/case-transition.test.mjs",
              "runtime/arckit-runtime/test/capability-registry.test.mjs",
              "npm run check --prefix runtime/arckit-runtime",
              "npm run smoke --prefix runtime/arckit-runtime",
              "skill-creator quick_validate for six changed skills",
              "project, iteration, and all Case audits"
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
        "arckit/spec/agentic-software-development/product-concepts.md",
        "arckit/spec/agentic-software-development/product-architecture.md",
        "arckit/tech/arckit-runtime/solution.md",
        "entry/skills/arckit-development-ledger/scripts/case-transition.mjs",
        "runtime/arckit-runtime/test/case-transition.test.mjs",
        "npm run check --prefix runtime/arckit-runtime"
      ],
      "runtime_result_ref": "",
      "occurred_at": "2026-07-26T17:13:51.436Z"
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
          "case:CASE-20260726-001"
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
    "updated_at": "2026-07-26T18:58:51.973Z"
  },
  "project_impact_candidate": {
    "status": "accepted",
    "changes": [
      {
        "dimension": "product_behavior",
        "from_state": "designed",
        "to_state": "implemented",
        "reason": "Project/Case/Loop separation, unordered Case candidate-gap selection, definition completeness, and equivalent human/Runtime transition semantics are implemented and locally verified.",
        "evidence": [
          "arckit/spec/agentic-software-development/product-concepts.md",
          "entry/skills/using-arckit/SKILL.md",
          "entry/skills/arckit-development-ledger/scripts/case-transition.mjs",
          "runtime/arckit-runtime/src/loop-controller.mjs",
          "runtime/arckit-runtime/test/case-transition.test.mjs"
        ],
        "evidence_maturity": "validated",
        "gap": "The behavior still needs isolated real-agent scenario evaluation before project-level acceptance.",
        "next_transition": "Run Skill First scenarios with fresh agents for spec-first, code-first, mixed, and not_required Case paths."
      }
    ],
    "evidence": [
      "CASE-20260726-001 implementation and validation evidence"
    ]
  },
  "content_revision": 1,
  "completion_review": {
    "status": "clean",
    "policy": {
      "initial_max_cycles": 3,
      "source": "repository-migration:runtime/arckit-runtime/config/case-policy.json",
      "snapshotted_at": "2026-07-26T17:44:10.682Z"
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
          "migration:CASE-20260726-001:pre-v3-resolved-case"
        ],
        "occurred_at": "2026-07-26T17:44:10.682Z"
      }
    ],
    "evidence": [
      "migration:CASE-20260726-001:pre-v3-resolved-case"
    ],
    "escalation": null,
    "human_authorizations": []
  }
}
```

## Round Notes

- Case history is canonical in Structured Record.rounds; keep prose notes exceptional.
