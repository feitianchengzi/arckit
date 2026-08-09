# Remove Runtime skill installation drift enforcement

Case: CASE-20260809-004
Status: closed
Artifact Type: mixed
Selected Gap: none
Updated: 2026-08-09T13:51:24.557Z

## User Intent

Remove Runtime code that constructs Codex skill installation paths, reads SKILL.md or installed skill contents, and locks execution to a repository-matching skill version; preserve manifest-declared using-arckit trigger invocation, trusted ledger entrypoints, and Codex-native skill discovery.

## Structured Record

```json
{
  "schema_version": "development-case-record/v3",
  "id": "CASE-20260809-004",
  "title": "Remove Runtime skill installation drift enforcement",
  "status": "closed",
  "artifact_type": "mixed",
  "created_at": "2026-08-09T13:45:48.414Z",
  "updated_at": "2026-08-09T13:51:24.557Z",
  "user_intent": "Remove Runtime code that constructs Codex skill installation paths, reads SKILL.md or installed skill contents, and locks execution to a repository-matching skill version; preserve manifest-declared using-arckit trigger invocation, trusted ledger entrypoints, and Codex-native skill discovery.",
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
      "reason": "Existing product principles require Runtime to invoke the manifest-declared using-arckit trigger while leaving installed-skill discovery and loading to Codex; Runtime installation-path, content, version, and drift enforcement is outside that role.",
      "evidence": [
        "AGENTS.md",
        "arckit/spec/agentic-software-development/skill-architecture.md",
        "arckit/spec/agentic-software-development/product-architecture.md"
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
      "reason": "Removing internal installed-skill compatibility checks does not add or alter user actions, page states, task controls, or decision interactions.",
      "evidence": [
        "arckit/spec/agentic-software-development/runtime-automation-workspace.md",
        "runtime/arckit-runtime/src/desktop-run-manager.mjs"
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
      "reason": "Removing internal installed-skill path and drift checks does not change layout, components, styling, tokens, or visual behavior.",
      "evidence": [
        "runtime/arckit-runtime/desktop/renderer/renderer.js",
        "arckit/spec/agentic-software-development/runtime-automation-workspace.md"
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
      "reason": "The Runtime architecture now explicitly limits readiness and invocation to repository capability manifests, policy, trusted entrypoints, and the natural trigger; Codex owns installed-skill discovery, version selection, and loading, and Runtime must not access or compare its skill installation directory.",
      "evidence": [
        "arckit/tech/arckit-runtime/solution.md",
        "runtime/arckit-runtime/README.md",
        "AGENTS.md"
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
      "reason": "Runtime no longer derives CODEX_HOME skill paths, reads installed SKILL.md or manifests, recursively compares skill directories, enforces protocol revisions, or returns installed_skills from readiness. Agent invocation and Desktop preflight now validate only repository capability metadata, the natural trigger, and trusted ledger entrypoints.",
      "evidence": [
        "runtime/arckit-runtime/src/capability-registry.mjs",
        "runtime/arckit-runtime/src/agent-orchestrator.mjs",
        "runtime/arckit-runtime/src/desktop-run-manager.mjs",
        "runtime/arckit-runtime/test/coherent-agent-loop.test.mjs",
        "runtime/arckit-runtime/test/desktop-run-manager.test.mjs"
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
      "reason": "Focused tests prove Agent execution succeeds with a nonexistent codexHome and Desktop readiness returns the manifest trigger and trusted entrypoints without installed skill data. The full 82-test suite, dry-run smoke, app-server probe, static production-source search, ledger audits, and diff checks pass.",
      "evidence": [
        "runtime/arckit-runtime/test/coherent-agent-loop.test.mjs",
        "runtime/arckit-runtime/test/desktop-run-manager.test.mjs",
        "runtime/arckit-runtime/test/capability-policy.test.mjs",
        "runtime/arckit-runtime/package.json",
        "runtime/arckit-runtime/src/capability-registry.mjs",
        "entry/skills/arckit-development-ledger/scripts/project-state.mjs",
        "entry/skills/arckit-development-ledger/scripts/project-iteration.mjs",
        "entry/skills/arckit-development-ledger/scripts/development-case.mjs"
      ],
      "next_transition": ""
    }
  },
  "content_revision": 6,
  "completion_review": {
    "status": "clean",
    "policy": {
      "initial_max_cycles": 3,
      "source": "runtime/arckit-runtime/config/case-policy.json",
      "snapshotted_at": "2026-08-09T13:45:48.414Z"
    },
    "additional_cycles_authorized": 0,
    "cycle_count": 1,
    "reviewed_content_revision": 6,
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
        "content_revision": 6,
        "dimensions": {
          "correctness": "clean",
          "completeness": "clean",
          "minimality": "clean"
        },
        "finding_ids": [],
        "evidence": [
          "runtime/arckit-runtime/src/capability-registry.mjs",
          "runtime/arckit-runtime/src/agent-orchestrator.mjs",
          "runtime/arckit-runtime/src/desktop-run-manager.mjs",
          "runtime/arckit-runtime/test/coherent-agent-loop.test.mjs",
          "runtime/arckit-runtime/test/desktop-run-manager.test.mjs",
          "runtime/arckit-runtime/test/capability-policy.test.mjs",
          "arckit/tech/arckit-runtime/solution.md",
          "runtime/arckit-runtime/README.md",
          "runtime/arckit-runtime/package.json"
        ],
        "occurred_at": "2026-08-09T13:51:24.557Z"
      }
    ],
    "evidence": [
      "runtime/arckit-runtime/src/capability-registry.mjs",
      "runtime/arckit-runtime/src/agent-orchestrator.mjs",
      "runtime/arckit-runtime/src/desktop-run-manager.mjs",
      "runtime/arckit-runtime/test/coherent-agent-loop.test.mjs",
      "runtime/arckit-runtime/test/desktop-run-manager.test.mjs",
      "runtime/arckit-runtime/test/capability-policy.test.mjs",
      "arckit/tech/arckit-runtime/solution.md",
      "runtime/arckit-runtime/README.md",
      "runtime/arckit-runtime/package.json"
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
      "goal": "Confirm the product boundary for Runtime and Codex-native skill discovery.",
      "outcome": "completed",
      "planned_transition": "product_expectation becomes required, formalized, aligned, and resolved using existing product architecture evidence.",
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
              "reason": "Existing product principles require Runtime to invoke the manifest-declared using-arckit trigger while leaving installed-skill discovery and loading to Codex; Runtime installation-path, content, version, and drift enforcement is outside that role.",
              "next_transition": ""
            },
            "evidence": [
              "AGENTS.md",
              "arckit/spec/agentic-software-development/skill-architecture.md",
              "arckit/spec/agentic-software-development/product-architecture.md"
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
        "AGENTS.md",
        "arckit/spec/agentic-software-development/skill-architecture.md",
        "arckit/spec/agentic-software-development/product-architecture.md"
      ],
      "runtime_result_ref": "",
      "occurred_at": "2026-08-09T13:46:26.699Z"
    },
    {
      "round": 2,
      "goal": "Determine whether interaction_expectation changes for this Runtime boundary correction.",
      "outcome": "completed",
      "planned_transition": "interaction_expectation becomes evidence-backed not_required and resolved.",
      "accepted_state_delta": {
        "facets": [
          {
            "facet": "interaction_expectation",
            "set": {
              "applicability": "not_required",
              "resolution": "resolved",
              "reason": "Removing internal installed-skill compatibility checks does not add or alter user actions, page states, task controls, or decision interactions.",
              "next_transition": ""
            },
            "evidence": [
              "arckit/spec/agentic-software-development/runtime-automation-workspace.md",
              "runtime/arckit-runtime/src/desktop-run-manager.mjs"
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
        "arckit/spec/agentic-software-development/runtime-automation-workspace.md",
        "runtime/arckit-runtime/src/desktop-run-manager.mjs"
      ],
      "runtime_result_ref": "",
      "occurred_at": "2026-08-09T13:46:49.840Z"
    },
    {
      "round": 3,
      "goal": "Determine whether visual_expectation changes for this Runtime boundary correction.",
      "outcome": "completed",
      "planned_transition": "visual_expectation becomes evidence-backed not_required and resolved.",
      "accepted_state_delta": {
        "facets": [
          {
            "facet": "visual_expectation",
            "set": {
              "applicability": "not_required",
              "resolution": "resolved",
              "reason": "Removing internal installed-skill path and drift checks does not change layout, components, styling, tokens, or visual behavior.",
              "next_transition": ""
            },
            "evidence": [
              "runtime/arckit-runtime/desktop/renderer/renderer.js",
              "arckit/spec/agentic-software-development/runtime-automation-workspace.md"
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
        "runtime/arckit-runtime/desktop/renderer/renderer.js",
        "arckit/spec/agentic-software-development/runtime-automation-workspace.md"
      ],
      "runtime_result_ref": "",
      "occurred_at": "2026-08-09T13:46:50.631Z"
    },
    {
      "round": 4,
      "goal": "Formalize that Runtime never reads or version-locks Codex-installed skills.",
      "outcome": "completed",
      "planned_transition": "technical_expectation becomes required, formalized, aligned, and resolved.",
      "accepted_state_delta": {
        "facets": [
          {
            "facet": "technical_expectation",
            "set": {
              "applicability": "required",
              "maturity": "formalized",
              "target_maturity": "formalized",
              "alignment": "aligned",
              "target_alignment": "aligned",
              "resolution": "resolved",
              "reason": "The Runtime architecture now explicitly limits readiness and invocation to repository capability manifests, policy, trusted entrypoints, and the natural trigger; Codex owns installed-skill discovery, version selection, and loading, and Runtime must not access or compare its skill installation directory.",
              "next_transition": ""
            },
            "evidence": [
              "arckit/tech/arckit-runtime/solution.md",
              "runtime/arckit-runtime/README.md",
              "AGENTS.md"
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
        "arckit/tech/arckit-runtime/solution.md",
        "runtime/arckit-runtime/README.md",
        "AGENTS.md"
      ],
      "runtime_result_ref": "",
      "occurred_at": "2026-08-09T13:47:43.480Z"
    },
    {
      "round": 5,
      "goal": "Delete Runtime-installed skill path, content, version, and drift enforcement while preserving repository manifest validation.",
      "outcome": "completed",
      "planned_transition": "implementation_state becomes required, confirmed, aligned, and resolved.",
      "accepted_state_delta": {
        "facets": [
          {
            "facet": "implementation_state",
            "set": {
              "applicability": "required",
              "maturity": "confirmed",
              "target_maturity": "confirmed",
              "alignment": "aligned",
              "target_alignment": "aligned",
              "resolution": "resolved",
              "reason": "Runtime no longer derives CODEX_HOME skill paths, reads installed SKILL.md or manifests, recursively compares skill directories, enforces protocol revisions, or returns installed_skills from readiness. Agent invocation and Desktop preflight now validate only repository capability metadata, the natural trigger, and trusted ledger entrypoints.",
              "next_transition": ""
            },
            "evidence": [
              "runtime/arckit-runtime/src/capability-registry.mjs",
              "runtime/arckit-runtime/src/agent-orchestrator.mjs",
              "runtime/arckit-runtime/src/desktop-run-manager.mjs",
              "runtime/arckit-runtime/test/coherent-agent-loop.test.mjs",
              "runtime/arckit-runtime/test/desktop-run-manager.test.mjs"
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
        "runtime/arckit-runtime/src/capability-registry.mjs",
        "runtime/arckit-runtime/src/agent-orchestrator.mjs",
        "runtime/arckit-runtime/src/desktop-run-manager.mjs",
        "runtime/arckit-runtime/test/coherent-agent-loop.test.mjs",
        "runtime/arckit-runtime/test/desktop-run-manager.test.mjs"
      ],
      "runtime_result_ref": "",
      "occurred_at": "2026-08-09T13:50:05.076Z"
    },
    {
      "round": 6,
      "goal": "Verify Runtime no longer reads or version-locks Codex-installed skills while repository capability invocation remains valid.",
      "outcome": "completed",
      "planned_transition": "verification_state becomes required, confirmed, aligned, and resolved; Case becomes review_ready.",
      "accepted_state_delta": {
        "facets": [
          {
            "facet": "verification_state",
            "set": {
              "applicability": "required",
              "maturity": "confirmed",
              "target_maturity": "confirmed",
              "alignment": "aligned",
              "target_alignment": "aligned",
              "resolution": "resolved",
              "reason": "Focused tests prove Agent execution succeeds with a nonexistent codexHome and Desktop readiness returns the manifest trigger and trusted entrypoints without installed skill data. The full 82-test suite, dry-run smoke, app-server probe, static production-source search, ledger audits, and diff checks pass.",
              "next_transition": ""
            },
            "evidence": [
              "runtime/arckit-runtime/test/coherent-agent-loop.test.mjs",
              "runtime/arckit-runtime/test/desktop-run-manager.test.mjs",
              "runtime/arckit-runtime/test/capability-policy.test.mjs",
              "runtime/arckit-runtime/package.json",
              "runtime/arckit-runtime/src/capability-registry.mjs",
              "entry/skills/arckit-development-ledger/scripts/project-state.mjs",
              "entry/skills/arckit-development-ledger/scripts/project-iteration.mjs",
              "entry/skills/arckit-development-ledger/scripts/development-case.mjs"
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
        "runtime/arckit-runtime/test/coherent-agent-loop.test.mjs",
        "runtime/arckit-runtime/test/desktop-run-manager.test.mjs",
        "runtime/arckit-runtime/test/capability-policy.test.mjs",
        "runtime/arckit-runtime/package.json",
        "runtime/arckit-runtime/src/capability-registry.mjs"
      ],
      "runtime_result_ref": "",
      "occurred_at": "2026-08-09T13:50:46.569Z"
    },
    {
      "round": 7,
      "goal": "Review removal of Runtime-installed skill enforcement for correctness, completeness, and minimality.",
      "outcome": "completed",
      "planned_transition": "completion_review becomes clean for content_revision=6 and the Case resolves.",
      "accepted_state_delta": {
        "facets": [],
        "resolved_open_questions": [],
        "completed_handoffs": [],
        "completion_review_result": {
          "outcome": "clean",
          "reviewer": "agent",
          "reviewed_content_revision": 6,
          "dimensions": {
            "correctness": "clean",
            "completeness": "clean",
            "minimality": "clean"
          },
          "findings": [],
          "evidence": [
            "runtime/arckit-runtime/src/capability-registry.mjs",
            "runtime/arckit-runtime/src/agent-orchestrator.mjs",
            "runtime/arckit-runtime/src/desktop-run-manager.mjs",
            "runtime/arckit-runtime/test/coherent-agent-loop.test.mjs",
            "runtime/arckit-runtime/test/desktop-run-manager.test.mjs",
            "runtime/arckit-runtime/test/capability-policy.test.mjs",
            "arckit/tech/arckit-runtime/solution.md",
            "runtime/arckit-runtime/README.md",
            "runtime/arckit-runtime/package.json"
          ]
        },
        "resolved_review_findings": [],
        "review_budget_extension": null
      },
      "evidence": [
        "runtime/arckit-runtime/src/capability-registry.mjs",
        "runtime/arckit-runtime/src/agent-orchestrator.mjs",
        "runtime/arckit-runtime/src/desktop-run-manager.mjs",
        "runtime/arckit-runtime/test/coherent-agent-loop.test.mjs",
        "runtime/arckit-runtime/test/desktop-run-manager.test.mjs",
        "runtime/arckit-runtime/test/capability-policy.test.mjs",
        "arckit/tech/arckit-runtime/solution.md",
        "runtime/arckit-runtime/README.md",
        "runtime/arckit-runtime/package.json"
      ],
      "runtime_result_ref": "",
      "occurred_at": "2026-08-09T13:51:24.557Z"
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
          "case:CASE-20260809-004"
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
    "updated_at": "2026-08-09T13:51:24.557Z"
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
