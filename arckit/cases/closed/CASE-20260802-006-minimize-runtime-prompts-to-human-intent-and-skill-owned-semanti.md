# Minimize Runtime Prompts to Human Intent and Skill-Owned Semantics

Case: CASE-20260802-006
Status: closed
Artifact Type: code
Selected Gap: none
Updated: 2026-08-02T13:36:58.576Z

## User Intent

复查并重构 Runtime 所有 Agent prompt：人类只提供真实任务意图、决策和纠正；Runtime 负责自动化控制与事实引用；Controller/Worker 语义由已触发 skills 承担，不在 prompt 中重复。

## Structured Record

```json
{
  "schema_version": "development-case-record/v3",
  "id": "CASE-20260802-006",
  "title": "Minimize Runtime Prompts to Human Intent and Skill-Owned Semantics",
  "status": "closed",
  "artifact_type": "code",
  "created_at": "2026-08-02T13:21:41.303Z",
  "updated_at": "2026-08-02T13:36:58.576Z",
  "user_intent": "复查并重构 Runtime 所有 Agent prompt：人类只提供真实任务意图、决策和纠正；Runtime 负责自动化控制与事实引用；Controller/Worker 语义由已触发 skills 承担，不在 prompt 中重复。",
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
      "reason": "用户确认了人类只提供真实意图、决策与纠正，Runtime 自动承担控制与上下文恢复；稳定行为已写入 Controller Worker Loop 与自动化工作区规格。",
      "evidence": [
        "arckit/spec/agentic-software-development/controller-worker-loop.md",
        "arckit/spec/agentic-software-development/runtime-automation-workspace.md"
      ],
      "next_transition": ""
    },
    "interaction_expectation": {
      "applicability": "required",
      "maturity": "formalized",
      "target_maturity": "formalized",
      "alignment": "aligned",
      "target_alignment": "aligned",
      "resolution": "resolved",
      "reason": "自动续轮不再生成 role=user 消息，人工介入只保留用户输入原文，按需 Chat transcript 的输入归属已稳定定义并与 Desktop 实现对齐。",
      "evidence": [
        "arckit/spec/agentic-software-development/runtime-automation-workspace.md",
        "runtime/arckit-runtime/src/desktop-run-manager.mjs",
        "runtime/arckit-runtime/test/context-boundary.test.mjs"
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
      "reason": "本事项只改变 Runtime 与 Agent 的输入边界和 transcript 角色归属，不改变任何页面布局、样式、token 或视觉组件。",
      "evidence": [
        "arckit/spec/agentic-software-development/controller-worker-loop.md",
        "runtime/arckit-runtime/src/agent-orchestrator.mjs"
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
      "reason": "技术方案明确 skill trigger、最小 phase facts、canonical refs、机器 outputSchema 与 Runtime metadata 的职责边界，且实现保持一致。",
      "evidence": [
        "arckit/tech/arckit-runtime/solution.md",
        "runtime/arckit-runtime/src/agent-orchestrator.mjs",
        "runtime/arckit-runtime/src/prompt-compiler.mjs"
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
      "reason": "Controller、Worker、自动任务、人工介入和自动续轮的 prompt 拼装已收敛到真实人类输入与必要运行事实。",
      "evidence": [
        "runtime/arckit-runtime/src/agent-orchestrator.mjs",
        "runtime/arckit-runtime/src/automation-coordinator.mjs",
        "runtime/arckit-runtime/src/desktop-run-manager.mjs",
        "runtime/arckit-runtime/src/kernel/operator-event.mjs",
        "runtime/arckit-runtime/src/prompt-compiler.mjs"
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
      "reason": "Prompt boundary 定向测试和 Runtime 全量静态/单元检查通过，覆盖 skill trigger、无工作流重复、原始人工输入与自动续轮边界。",
      "evidence": [
        "runtime/arckit-runtime/test/capability-registry.test.mjs",
        "runtime/arckit-runtime/test/context-boundary.test.mjs",
        "runtime/arckit-runtime/test/automation-coordinator.test.mjs",
        "npm run check"
      ],
      "next_transition": ""
    }
  },
  "content_revision": 7,
  "completion_review": {
    "status": "clean",
    "policy": {
      "initial_max_cycles": 3,
      "source": "runtime/arckit-runtime/config/case-policy.json",
      "snapshotted_at": "2026-08-02T13:21:41.303Z"
    },
    "additional_cycles_authorized": 0,
    "cycle_count": 2,
    "reviewed_content_revision": 7,
    "dimensions": {
      "correctness": "clean",
      "completeness": "clean",
      "minimality": "clean"
    },
    "findings": [
      {
        "id": "review-finding-runtime-continuation-context",
        "kind": "omission",
        "statement": "Fresh auto/human continuation no longer fabricates operator input, but it also fails to carry source run and handoff as separate Runtime machine context.",
        "responsibility": "agent",
        "affected_facets": [
          "technical_expectation",
          "implementation_state"
        ],
        "artifact_refs": [
          "runtime/arckit-runtime/src/desktop-run-manager.mjs",
          "runtime/arckit-runtime/src/agent-orchestrator.mjs",
          "runtime/arckit-runtime/src/automation-coordinator.mjs"
        ],
        "evidence": [
          "runtime/arckit-runtime/src/desktop-run-manager.mjs",
          "runtime/arckit-runtime/src/agent-orchestrator.mjs",
          "runtime/arckit-runtime/src/automation-coordinator.mjs"
        ],
        "status": "resolved",
        "resolution_reason": "CLI and Desktop now carry source run/handoff or human gate through a separate runtime_context field, and Controller invocations expose it independently from operator_input.",
        "resolution_evidence": [
          "runtime/arckit-runtime/src/cli.mjs",
          "runtime/arckit-runtime/src/agent-orchestrator.mjs",
          "runtime/arckit-runtime/src/desktop-run-manager.mjs",
          "runtime/arckit-runtime/src/automation-coordinator.mjs",
          "runtime/arckit-runtime/test/capability-registry.test.mjs",
          "runtime/arckit-runtime/test/desktop-run-manager.test.mjs",
          "npm run check",
          "Runtime dry-run runtime_context smoke"
        ],
        "discovered_in_cycle": 1
      }
    ],
    "cycles": [
      {
        "cycle": 1,
        "autonomous_cycle": 1,
        "reviewer": "agent",
        "outcome": "findings",
        "content_revision": 6,
        "dimensions": {
          "correctness": "clean",
          "completeness": "findings",
          "minimality": "clean"
        },
        "finding_ids": [
          "review-finding-runtime-continuation-context"
        ],
        "evidence": [
          "runtime/arckit-runtime/src/desktop-run-manager.mjs",
          "runtime/arckit-runtime/src/agent-orchestrator.mjs",
          "runtime/arckit-runtime/src/automation-coordinator.mjs"
        ],
        "occurred_at": "2026-08-02T13:34:23.088Z"
      },
      {
        "cycle": 2,
        "autonomous_cycle": 2,
        "reviewer": "agent",
        "outcome": "clean",
        "content_revision": 7,
        "dimensions": {
          "correctness": "clean",
          "completeness": "clean",
          "minimality": "clean"
        },
        "finding_ids": [],
        "evidence": [
          "runtime/arckit-runtime/src/agent-orchestrator.mjs",
          "runtime/arckit-runtime/src/prompt-compiler.mjs",
          "runtime/arckit-runtime/src/automation-coordinator.mjs",
          "runtime/arckit-runtime/src/desktop-run-manager.mjs",
          "runtime/arckit-runtime/src/cli.mjs",
          "runtime/arckit-runtime/test/capability-registry.test.mjs",
          "runtime/arckit-runtime/test/context-boundary.test.mjs",
          "runtime/arckit-runtime/test/automation-coordinator.test.mjs",
          "runtime/arckit-runtime/test/desktop-run-manager.test.mjs",
          "npm run check",
          "Runtime dry-run runtime_context smoke",
          "Runtime prompt boilerplate scan"
        ],
        "occurred_at": "2026-08-02T13:36:58.576Z"
      }
    ],
    "evidence": [
      "runtime/arckit-runtime/src/desktop-run-manager.mjs",
      "runtime/arckit-runtime/src/agent-orchestrator.mjs",
      "runtime/arckit-runtime/src/automation-coordinator.mjs",
      "runtime/arckit-runtime/src/prompt-compiler.mjs",
      "runtime/arckit-runtime/src/cli.mjs",
      "runtime/arckit-runtime/test/capability-registry.test.mjs",
      "runtime/arckit-runtime/test/context-boundary.test.mjs",
      "runtime/arckit-runtime/test/automation-coordinator.test.mjs",
      "runtime/arckit-runtime/test/desktop-run-manager.test.mjs",
      "npm run check",
      "Runtime dry-run runtime_context smoke",
      "Runtime prompt boilerplate scan"
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
      "goal": "Resolve product_expectation for the Runtime prompt boundary.",
      "outcome": "completed",
      "planned_transition": "product_expectation unresolved -> resolved",
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
              "reason": "用户确认了人类只提供真实意图、决策与纠正，Runtime 自动承担控制与上下文恢复；稳定行为已写入 Controller Worker Loop 与自动化工作区规格。",
              "next_transition": ""
            },
            "evidence": [
              "arckit/spec/agentic-software-development/controller-worker-loop.md",
              "arckit/spec/agentic-software-development/runtime-automation-workspace.md"
            ],
            "unresolved": []
          }
        ],
        "resolved_open_questions": [],
        "completed_handoffs": [],
        "completion_review_result": null,
        "resolved_review_findings": [],
        "review_budget_extension": null
      },
      "evidence": [
        "arckit/spec/agentic-software-development/controller-worker-loop.md",
        "arckit/spec/agentic-software-development/runtime-automation-workspace.md"
      ],
      "runtime_result_ref": "",
      "occurred_at": "2026-08-02T13:31:50.010Z"
    },
    {
      "round": 2,
      "goal": "Resolve interaction_expectation for the Runtime prompt boundary.",
      "outcome": "completed",
      "planned_transition": "interaction_expectation unresolved -> resolved",
      "accepted_state_delta": {
        "facets": [
          {
            "facet": "interaction_expectation",
            "set": {
              "applicability": "required",
              "maturity": "formalized",
              "target_maturity": "formalized",
              "alignment": "aligned",
              "target_alignment": "aligned",
              "resolution": "resolved",
              "reason": "自动续轮不再生成 role=user 消息，人工介入只保留用户输入原文，按需 Chat transcript 的输入归属已稳定定义并与 Desktop 实现对齐。",
              "next_transition": ""
            },
            "evidence": [
              "arckit/spec/agentic-software-development/runtime-automation-workspace.md",
              "runtime/arckit-runtime/src/desktop-run-manager.mjs",
              "runtime/arckit-runtime/test/context-boundary.test.mjs"
            ],
            "unresolved": []
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
        "runtime/arckit-runtime/src/desktop-run-manager.mjs",
        "runtime/arckit-runtime/test/context-boundary.test.mjs"
      ],
      "runtime_result_ref": "",
      "occurred_at": "2026-08-02T13:32:27.349Z"
    },
    {
      "round": 3,
      "goal": "Resolve visual_expectation for the Runtime prompt boundary.",
      "outcome": "completed",
      "planned_transition": "visual_expectation unresolved -> resolved",
      "accepted_state_delta": {
        "facets": [
          {
            "facet": "visual_expectation",
            "set": {
              "applicability": "not_required",
              "resolution": "resolved",
              "reason": "本事项只改变 Runtime 与 Agent 的输入边界和 transcript 角色归属，不改变任何页面布局、样式、token 或视觉组件。",
              "next_transition": ""
            },
            "evidence": [
              "arckit/spec/agentic-software-development/controller-worker-loop.md",
              "runtime/arckit-runtime/src/agent-orchestrator.mjs"
            ],
            "unresolved": []
          }
        ],
        "resolved_open_questions": [],
        "completed_handoffs": [],
        "completion_review_result": null,
        "resolved_review_findings": [],
        "review_budget_extension": null
      },
      "evidence": [
        "arckit/spec/agentic-software-development/controller-worker-loop.md",
        "runtime/arckit-runtime/src/agent-orchestrator.mjs"
      ],
      "runtime_result_ref": "",
      "occurred_at": "2026-08-02T13:32:27.538Z"
    },
    {
      "round": 4,
      "goal": "Resolve technical_expectation for the Runtime prompt boundary.",
      "outcome": "completed",
      "planned_transition": "technical_expectation unresolved -> resolved",
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
              "reason": "技术方案明确 skill trigger、最小 phase facts、canonical refs、机器 outputSchema 与 Runtime metadata 的职责边界，且实现保持一致。",
              "next_transition": ""
            },
            "evidence": [
              "arckit/tech/arckit-runtime/solution.md",
              "runtime/arckit-runtime/src/agent-orchestrator.mjs",
              "runtime/arckit-runtime/src/prompt-compiler.mjs"
            ],
            "unresolved": []
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
        "runtime/arckit-runtime/src/agent-orchestrator.mjs",
        "runtime/arckit-runtime/src/prompt-compiler.mjs"
      ],
      "runtime_result_ref": "",
      "occurred_at": "2026-08-02T13:32:27.722Z"
    },
    {
      "round": 5,
      "goal": "Resolve implementation_state for the Runtime prompt boundary.",
      "outcome": "completed",
      "planned_transition": "implementation_state unresolved -> resolved",
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
              "reason": "Controller、Worker、自动任务、人工介入和自动续轮的 prompt 拼装已收敛到真实人类输入与必要运行事实。",
              "next_transition": ""
            },
            "evidence": [
              "runtime/arckit-runtime/src/agent-orchestrator.mjs",
              "runtime/arckit-runtime/src/automation-coordinator.mjs",
              "runtime/arckit-runtime/src/desktop-run-manager.mjs",
              "runtime/arckit-runtime/src/kernel/operator-event.mjs",
              "runtime/arckit-runtime/src/prompt-compiler.mjs"
            ],
            "unresolved": []
          }
        ],
        "resolved_open_questions": [],
        "completed_handoffs": [],
        "completion_review_result": null,
        "resolved_review_findings": [],
        "review_budget_extension": null
      },
      "evidence": [
        "runtime/arckit-runtime/src/agent-orchestrator.mjs",
        "runtime/arckit-runtime/src/automation-coordinator.mjs",
        "runtime/arckit-runtime/src/desktop-run-manager.mjs",
        "runtime/arckit-runtime/src/kernel/operator-event.mjs",
        "runtime/arckit-runtime/src/prompt-compiler.mjs"
      ],
      "runtime_result_ref": "",
      "occurred_at": "2026-08-02T13:32:27.898Z"
    },
    {
      "round": 6,
      "goal": "Resolve verification_state for the Runtime prompt boundary.",
      "outcome": "completed",
      "planned_transition": "verification_state unresolved -> resolved",
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
              "reason": "Prompt boundary 定向测试和 Runtime 全量静态/单元检查通过，覆盖 skill trigger、无工作流重复、原始人工输入与自动续轮边界。",
              "next_transition": ""
            },
            "evidence": [
              "runtime/arckit-runtime/test/capability-registry.test.mjs",
              "runtime/arckit-runtime/test/context-boundary.test.mjs",
              "runtime/arckit-runtime/test/automation-coordinator.test.mjs",
              "npm run check"
            ],
            "unresolved": []
          }
        ],
        "resolved_open_questions": [],
        "completed_handoffs": [],
        "completion_review_result": null,
        "resolved_review_findings": [],
        "review_budget_extension": null
      },
      "evidence": [
        "runtime/arckit-runtime/test/capability-registry.test.mjs",
        "runtime/arckit-runtime/test/context-boundary.test.mjs",
        "runtime/arckit-runtime/test/automation-coordinator.test.mjs",
        "npm run check"
      ],
      "runtime_result_ref": "",
      "occurred_at": "2026-08-02T13:32:28.081Z"
    },
    {
      "round": 7,
      "goal": "Review the prompt boundary for correctness, completeness, and minimality.",
      "outcome": "completed",
      "planned_transition": "completion_review pending -> findings_open",
      "accepted_state_delta": {
        "facets": [],
        "resolved_open_questions": [],
        "completed_handoffs": [],
        "completion_review_result": {
          "outcome": "findings",
          "reviewer": "agent",
          "reviewed_content_revision": 6,
          "dimensions": {
            "correctness": "clean",
            "completeness": "findings",
            "minimality": "clean"
          },
          "findings": [
            {
              "id": "review-finding-runtime-continuation-context",
              "kind": "omission",
              "statement": "Fresh auto/human continuation no longer fabricates operator input, but it also fails to carry source run and handoff as separate Runtime machine context.",
              "responsibility": "agent",
              "affected_facets": [
                "technical_expectation",
                "implementation_state"
              ],
              "artifact_refs": [
                "runtime/arckit-runtime/src/desktop-run-manager.mjs",
                "runtime/arckit-runtime/src/agent-orchestrator.mjs",
                "runtime/arckit-runtime/src/automation-coordinator.mjs"
              ],
              "evidence": [
                "runtime/arckit-runtime/src/desktop-run-manager.mjs",
                "runtime/arckit-runtime/src/agent-orchestrator.mjs",
                "runtime/arckit-runtime/src/automation-coordinator.mjs"
              ]
            }
          ],
          "evidence": [
            "runtime/arckit-runtime/src/desktop-run-manager.mjs",
            "runtime/arckit-runtime/src/agent-orchestrator.mjs",
            "runtime/arckit-runtime/src/automation-coordinator.mjs"
          ]
        },
        "resolved_review_findings": [],
        "review_budget_extension": null
      },
      "evidence": [
        "runtime/arckit-runtime/src/desktop-run-manager.mjs",
        "runtime/arckit-runtime/src/agent-orchestrator.mjs",
        "runtime/arckit-runtime/src/automation-coordinator.mjs"
      ],
      "runtime_result_ref": "",
      "occurred_at": "2026-08-02T13:34:23.088Z"
    },
    {
      "round": 8,
      "goal": "Carry continuation evidence as Runtime machine context without changing operator input.",
      "outcome": "completed",
      "planned_transition": "review finding open -> resolved",
      "accepted_state_delta": {
        "facets": [],
        "resolved_open_questions": [],
        "completed_handoffs": [],
        "completion_review_result": null,
        "resolved_review_findings": [
          {
            "id": "review-finding-runtime-continuation-context",
            "resolution": "resolved",
            "reason": "CLI and Desktop now carry source run/handoff or human gate through a separate runtime_context field, and Controller invocations expose it independently from operator_input.",
            "evidence": [
              "runtime/arckit-runtime/src/cli.mjs",
              "runtime/arckit-runtime/src/agent-orchestrator.mjs",
              "runtime/arckit-runtime/src/desktop-run-manager.mjs",
              "runtime/arckit-runtime/src/automation-coordinator.mjs",
              "runtime/arckit-runtime/test/capability-registry.test.mjs",
              "runtime/arckit-runtime/test/desktop-run-manager.test.mjs",
              "npm run check",
              "Runtime dry-run runtime_context smoke"
            ]
          }
        ],
        "review_budget_extension": null
      },
      "evidence": [
        "runtime/arckit-runtime/src/cli.mjs",
        "runtime/arckit-runtime/src/agent-orchestrator.mjs",
        "runtime/arckit-runtime/src/desktop-run-manager.mjs",
        "runtime/arckit-runtime/src/automation-coordinator.mjs",
        "runtime/arckit-runtime/test/capability-registry.test.mjs",
        "runtime/arckit-runtime/test/desktop-run-manager.test.mjs",
        "npm run check",
        "Runtime dry-run runtime_context smoke"
      ],
      "runtime_result_ref": "",
      "occurred_at": "2026-08-02T13:36:30.085Z"
    },
    {
      "round": 9,
      "goal": "Re-review the repaired prompt boundary for correctness, completeness, and minimality.",
      "outcome": "completed",
      "planned_transition": "completion_review pending -> clean",
      "accepted_state_delta": {
        "facets": [],
        "resolved_open_questions": [],
        "completed_handoffs": [],
        "completion_review_result": {
          "outcome": "clean",
          "reviewer": "agent",
          "reviewed_content_revision": 7,
          "dimensions": {
            "correctness": "clean",
            "completeness": "clean",
            "minimality": "clean"
          },
          "findings": [],
          "evidence": [
            "runtime/arckit-runtime/src/agent-orchestrator.mjs",
            "runtime/arckit-runtime/src/prompt-compiler.mjs",
            "runtime/arckit-runtime/src/automation-coordinator.mjs",
            "runtime/arckit-runtime/src/desktop-run-manager.mjs",
            "runtime/arckit-runtime/src/cli.mjs",
            "runtime/arckit-runtime/test/capability-registry.test.mjs",
            "runtime/arckit-runtime/test/context-boundary.test.mjs",
            "runtime/arckit-runtime/test/automation-coordinator.test.mjs",
            "runtime/arckit-runtime/test/desktop-run-manager.test.mjs",
            "npm run check",
            "Runtime dry-run runtime_context smoke",
            "Runtime prompt boilerplate scan"
          ]
        },
        "resolved_review_findings": [],
        "review_budget_extension": null
      },
      "evidence": [
        "runtime/arckit-runtime/src/agent-orchestrator.mjs",
        "runtime/arckit-runtime/src/prompt-compiler.mjs",
        "runtime/arckit-runtime/src/automation-coordinator.mjs",
        "runtime/arckit-runtime/src/desktop-run-manager.mjs",
        "runtime/arckit-runtime/src/cli.mjs",
        "runtime/arckit-runtime/test/capability-registry.test.mjs",
        "runtime/arckit-runtime/test/context-boundary.test.mjs",
        "runtime/arckit-runtime/test/automation-coordinator.test.mjs",
        "runtime/arckit-runtime/test/desktop-run-manager.test.mjs",
        "npm run check",
        "Runtime dry-run runtime_context smoke",
        "Runtime prompt boilerplate scan"
      ],
      "runtime_result_ref": "",
      "occurred_at": "2026-08-02T13:36:58.576Z"
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
          "case:CASE-20260802-006"
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
    "updated_at": "2026-08-02T13:36:58.576Z"
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
