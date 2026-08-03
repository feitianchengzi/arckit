# Commit completed Runtime work before updating remote todo

Case: CASE-20260803-001
Status: closed
Artifact Type: code
Selected Gap: none
Updated: 2026-08-03T12:33:35.508Z

## User Intent

优化 runtime/arckit-runtime：待办对应 Case 关闭后，先启动一个只接收 git commit 指令的 agent；仅在该 agent 成功完成后，才把远端待办更新为 completed。commit agent 不附带任何 message 或额外提示。

## Structured Record

```json
{
  "schema_version": "development-case-record/v3",
  "id": "CASE-20260803-001",
  "title": "Commit completed Runtime work before updating remote todo",
  "status": "closed",
  "artifact_type": "code",
  "created_at": "2026-08-03T12:23:03.842Z",
  "updated_at": "2026-08-03T12:33:35.508Z",
  "user_intent": "优化 runtime/arckit-runtime：待办对应 Case 关闭后，先启动一个只接收 git commit 指令的 agent；仅在该 agent 成功完成后，才把远端待办更新为 completed。commit agent 不附带任何 message 或额外提示。",
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
      "reason": "The stable product specification requires a commit agent with the sole input git commit after Case closure and before remote todo completion.",
      "evidence": [
        "arckit/spec/agentic-software-development/runtime-automation-workspace.md"
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
      "reason": "The change adds no user interaction, control, input, navigation, or decision surface; it only changes automated backend sequencing after a terminal handoff.",
      "evidence": [
        "arckit/spec/agentic-software-development/runtime-automation-workspace.md",
        "arckit/tech/arckit-runtime/solution.md"
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
      "reason": "The change introduces no page composition, component state, visual token, style, or feedback requirement.",
      "evidence": [
        "arckit/spec/agentic-software-development/runtime-automation-workspace.md",
        "arckit/tech/arckit-runtime/solution.md"
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
      "reason": "The technical solution fixes a direct agent-task execution plane between terminal Case closure and remote todo completion.",
      "evidence": [
        "arckit/tech/arckit-runtime/solution.md"
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
      "reason": "Runtime now exposes a direct silent agent-task command, Desktop can launch it without Runtime/Case context, and Automation Coordinator inserts it after terminal Case closure and before remote completion with commit-specific recovery.",
      "evidence": [
        "runtime/arckit-runtime/adapters/codex-app-server-adapter.mjs",
        "runtime/arckit-runtime/src/cli.mjs",
        "runtime/arckit-runtime/src/desktop-run-manager.mjs",
        "runtime/arckit-runtime/src/automation-coordinator.mjs",
        "runtime/arckit-runtime/README.md"
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
      "reason": "Focused ordering, exact-prompt, silent-message, failure recovery, and restart recovery tests pass, and the full Runtime check passes 104 tests with one opt-in Electron layout test skipped.",
      "evidence": [
        "runtime/arckit-runtime/test/automation-coordinator.test.mjs",
        "runtime/arckit-runtime/test/desktop-run-manager.test.mjs",
        "runtime/arckit-runtime/package.json"
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
      "snapshotted_at": "2026-08-03T12:23:03.842Z"
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
          "runtime/arckit-runtime/test/automation-coordinator.test.mjs",
          "runtime/arckit-runtime/test/desktop-run-manager.test.mjs",
          "runtime/arckit-runtime/adapters/codex-app-server-adapter.mjs",
          "runtime/arckit-runtime/src/cli.mjs",
          "runtime/arckit-runtime/src/desktop-run-manager.mjs",
          "runtime/arckit-runtime/src/automation-coordinator.mjs",
          "arckit/spec/agentic-software-development/runtime-automation-workspace.md",
          "arckit/tech/arckit-runtime/solution.md",
          "npm run check",
          "git diff --check"
        ],
        "occurred_at": "2026-08-03T12:33:35.508Z"
      }
    ],
    "evidence": [
      "runtime/arckit-runtime/test/automation-coordinator.test.mjs",
      "runtime/arckit-runtime/test/desktop-run-manager.test.mjs",
      "runtime/arckit-runtime/adapters/codex-app-server-adapter.mjs",
      "runtime/arckit-runtime/src/cli.mjs",
      "runtime/arckit-runtime/src/desktop-run-manager.mjs",
      "runtime/arckit-runtime/src/automation-coordinator.mjs",
      "arckit/spec/agentic-software-development/runtime-automation-workspace.md",
      "arckit/tech/arckit-runtime/solution.md",
      "npm run check",
      "git diff --check"
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
      "goal": "Formalize the remote todo completion behavior after Case closure.",
      "outcome": "completed",
      "planned_transition": "product_expectation becomes required, formalized, aligned, and resolved.",
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
              "reason": "The stable product specification requires a commit agent with the sole input git commit after Case closure and before remote todo completion."
            },
            "evidence": [
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
        "arckit/spec/agentic-software-development/runtime-automation-workspace.md"
      ],
      "runtime_result_ref": "",
      "occurred_at": "2026-08-03T12:25:42.009Z"
    },
    {
      "round": 2,
      "goal": "Formalize the post-Case commit agent execution boundary.",
      "outcome": "completed",
      "planned_transition": "technical_expectation becomes evidence-backed and resolved.",
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
              "reason": "The technical solution fixes a direct agent-task execution plane between terminal Case closure and remote todo completion."
            },
            "evidence": [
              "arckit/tech/arckit-runtime/solution.md"
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
        "arckit/tech/arckit-runtime/solution.md"
      ],
      "runtime_result_ref": "",
      "occurred_at": "2026-08-03T12:26:11.270Z"
    },
    {
      "round": 3,
      "goal": "Determine that no interaction artifact is required.",
      "outcome": "completed",
      "planned_transition": "interaction_expectation becomes evidence-backed and resolved.",
      "accepted_state_delta": {
        "facets": [
          {
            "facet": "interaction_expectation",
            "set": {
              "applicability": "not_required",
              "resolution": "resolved",
              "reason": "The change adds no user interaction, control, input, navigation, or decision surface; it only changes automated backend sequencing after a terminal handoff."
            },
            "evidence": [
              "arckit/spec/agentic-software-development/runtime-automation-workspace.md",
              "arckit/tech/arckit-runtime/solution.md"
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
        "arckit/tech/arckit-runtime/solution.md"
      ],
      "runtime_result_ref": "",
      "occurred_at": "2026-08-03T12:26:11.455Z"
    },
    {
      "round": 4,
      "goal": "Determine that no visual artifact is required.",
      "outcome": "completed",
      "planned_transition": "visual_expectation becomes evidence-backed and resolved.",
      "accepted_state_delta": {
        "facets": [
          {
            "facet": "visual_expectation",
            "set": {
              "applicability": "not_required",
              "resolution": "resolved",
              "reason": "The change introduces no page composition, component state, visual token, style, or feedback requirement."
            },
            "evidence": [
              "arckit/spec/agentic-software-development/runtime-automation-workspace.md",
              "arckit/tech/arckit-runtime/solution.md"
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
        "arckit/tech/arckit-runtime/solution.md"
      ],
      "runtime_result_ref": "",
      "occurred_at": "2026-08-03T12:26:11.633Z"
    },
    {
      "round": 5,
      "goal": "Implement the direct commit-agent execution plane and completion ordering.",
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
              "reason": "Runtime now exposes a direct silent agent-task command, Desktop can launch it without Runtime/Case context, and Automation Coordinator inserts it after terminal Case closure and before remote completion with commit-specific recovery."
            },
            "evidence": [
              "runtime/arckit-runtime/adapters/codex-app-server-adapter.mjs",
              "runtime/arckit-runtime/src/cli.mjs",
              "runtime/arckit-runtime/src/desktop-run-manager.mjs",
              "runtime/arckit-runtime/src/automation-coordinator.mjs",
              "runtime/arckit-runtime/README.md"
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
        "runtime/arckit-runtime/adapters/codex-app-server-adapter.mjs",
        "runtime/arckit-runtime/src/cli.mjs",
        "runtime/arckit-runtime/src/desktop-run-manager.mjs",
        "runtime/arckit-runtime/src/automation-coordinator.mjs",
        "runtime/arckit-runtime/README.md"
      ],
      "runtime_result_ref": "",
      "occurred_at": "2026-08-03T12:32:50.759Z"
    },
    {
      "round": 6,
      "goal": "Verify strict commit ordering, prompt isolation, recovery behavior, restart behavior, and the full Runtime regression suite.",
      "outcome": "completed",
      "planned_transition": "verification_state becomes required, confirmed, aligned, and resolved.",
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
              "reason": "Focused ordering, exact-prompt, silent-message, failure recovery, and restart recovery tests pass, and the full Runtime check passes 104 tests with one opt-in Electron layout test skipped."
            },
            "evidence": [
              "runtime/arckit-runtime/test/automation-coordinator.test.mjs",
              "runtime/arckit-runtime/test/desktop-run-manager.test.mjs",
              "runtime/arckit-runtime/package.json"
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
        "runtime/arckit-runtime/test/automation-coordinator.test.mjs",
        "runtime/arckit-runtime/test/desktop-run-manager.test.mjs",
        "runtime/arckit-runtime/package.json"
      ],
      "runtime_result_ref": "",
      "occurred_at": "2026-08-03T12:32:51.069Z"
    },
    {
      "round": 7,
      "goal": "Review the complete Case result for correctness, completeness, and minimality.",
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
            "runtime/arckit-runtime/test/automation-coordinator.test.mjs",
            "runtime/arckit-runtime/test/desktop-run-manager.test.mjs",
            "runtime/arckit-runtime/adapters/codex-app-server-adapter.mjs",
            "runtime/arckit-runtime/src/cli.mjs",
            "runtime/arckit-runtime/src/desktop-run-manager.mjs",
            "runtime/arckit-runtime/src/automation-coordinator.mjs",
            "arckit/spec/agentic-software-development/runtime-automation-workspace.md",
            "arckit/tech/arckit-runtime/solution.md",
            "npm run check",
            "git diff --check"
          ]
        },
        "resolved_review_findings": [],
        "review_budget_extension": null
      },
      "evidence": [
        "runtime/arckit-runtime/test/automation-coordinator.test.mjs",
        "runtime/arckit-runtime/test/desktop-run-manager.test.mjs",
        "runtime/arckit-runtime/adapters/codex-app-server-adapter.mjs",
        "runtime/arckit-runtime/src/cli.mjs",
        "runtime/arckit-runtime/src/desktop-run-manager.mjs",
        "runtime/arckit-runtime/src/automation-coordinator.mjs",
        "arckit/spec/agentic-software-development/runtime-automation-workspace.md",
        "arckit/tech/arckit-runtime/solution.md",
        "npm run check",
        "git diff --check"
      ],
      "runtime_result_ref": "",
      "occurred_at": "2026-08-03T12:33:35.508Z"
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
          "case:CASE-20260803-001"
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
    "updated_at": "2026-08-03T12:33:35.508Z"
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
