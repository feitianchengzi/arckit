# Instrument Runtime todo execution lifecycle latency

Case: CASE-20260807-006
Status: closed
Artifact Type: mixed
Selected Gap: none
Updated: 2026-08-07T15:52:18.510Z

## User Intent

为 arckit-runtime 待办执行的全生命周期增加可关联、可聚合的结构化耗时埋点，使新待办测试后能精准区分 Runtime 架构开销、Agent 模型执行耗时、特定 Worker/skill/tool 阶段耗时、ledger 与外部同步耗时。

## Structured Record

```json
{
  "schema_version": "development-case-record/v3",
  "id": "CASE-20260807-006",
  "title": "Instrument Runtime todo execution lifecycle latency",
  "status": "closed",
  "artifact_type": "mixed",
  "created_at": "2026-08-07T15:31:00.590Z",
  "updated_at": "2026-08-07T15:52:18.510Z",
  "user_intent": "为 arckit-runtime 待办执行的全生命周期增加可关联、可聚合的结构化耗时埋点，使新待办测试后能精准区分 Runtime 架构开销、Agent 模型执行耗时、特定 Worker/skill/tool 阶段耗时、ledger 与外部同步耗时。",
  "expected_outcome": "",
  "project_state_ref": "arckit/project/state.record.json",
  "current_round": {
    "goal": "",
    "selected_gap": null
  },
  "facets": {
    "product_expectation": {
      "applicability": "required",
      "maturity": "confirmed",
      "target_maturity": "confirmed",
      "alignment": "aligned",
      "target_alignment": "aligned",
      "resolution": "resolved",
      "reason": "用户要求一个待办从领取到远端完成的全生命周期耗时可观测，并能区分架构编排、具体 Worker/skill/tool、外部依赖与收尾阶段；README 与实现对外暴露稳定 trace/summary/CLI 行为。",
      "evidence": [
        "arckit/cases/active/CASE-20260807-006-instrument-runtime-todo-execution-lifecycle-latency.md",
        "runtime/arckit-runtime/README.md"
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
      "reason": "本 Case 交付专用 trace 文件、Run/Completion 数据字段和分析 CLI，不改变已有 Desktop 用户操作流程或交互状态机。",
      "evidence": [
        "runtime/arckit-runtime/README.md",
        "runtime/arckit-runtime/src/cli.mjs"
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
      "reason": "本 Case 不新增或修改 Renderer 视觉表面；生命周期事件明确不进入用户可见 current-step/timeline 投影。",
      "evidence": [
        "runtime/arckit-runtime/src/projection/run-event-projector.mjs"
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
      "reason": "稳定技术方案定义 trace/span 关联、wall/monotonic 时钟、成本中心、脱敏、持久化、exclusive time 聚合和诊断倾向，并与代码实现一致。",
      "evidence": [
        "arckit/tech/arckit-runtime/solution.md",
        "runtime/arckit-runtime/src/observability/lifecycle-trace.mjs"
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
      "reason": "Automation、Run Manager、Runtime session、Controller/Worker、Codex adapter、tool、ledger、commit 和远端完成均已接入同一 trace，且 trace 事件不触发 transcript 写入或覆盖 UI 当前步骤。",
      "evidence": [
        "runtime/arckit-runtime/src/observability/lifecycle-trace.mjs",
        "runtime/arckit-runtime/src/automation-coordinator.mjs",
        "runtime/arckit-runtime/src/desktop-run-manager.mjs",
        "runtime/arckit-runtime/src/state-driven-runner.mjs",
        "runtime/arckit-runtime/src/agent-orchestrator.mjs",
        "runtime/arckit-runtime/adapters/codex-app-server-adapter.mjs",
        "runtime/arckit-runtime/src/projection/run-event-projector.mjs",
        "runtime/arckit-runtime/src/cli.mjs"
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
      "reason": "单测覆盖父子 exclusive time、trace 持久化、待办跨 claim/runtime/commit/completion 的 trace 传播；全量 Runtime check 与带 trace_id 的 dry-run smoke 均通过。",
      "evidence": [
        "runtime/arckit-runtime/test/lifecycle-trace.test.mjs",
        "runtime/arckit-runtime/test/automation-coordinator.test.mjs",
        "runtime/arckit-runtime/test/state-driven-runner.test.mjs",
        "runtime/arckit-runtime/test/codex-app-server-adapter.test.mjs",
        "npm run check",
        "node runtime/arckit-runtime/bin/arckit-runtime.mjs run --project . --task \"验证待办生命周期埋点\" --dry-run --json --stream-events --lifecycle-trace-id TRACE-SMOKE-20260807 --lifecycle-parent-span-id SPAN-DESKTOP-SMOKE --lifecycle-run-id RUN-SMOKE"
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
      "snapshotted_at": "2026-08-07T15:31:00.590Z"
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
          "runtime/arckit-runtime/src/observability/lifecycle-trace.mjs",
          "runtime/arckit-runtime/src/automation-coordinator.mjs",
          "runtime/arckit-runtime/src/desktop-run-manager.mjs",
          "runtime/arckit-runtime/src/state-driven-runner.mjs",
          "runtime/arckit-runtime/src/agent-orchestrator.mjs",
          "runtime/arckit-runtime/adapters/codex-app-server-adapter.mjs",
          "runtime/arckit-runtime/src/projection/run-event-projector.mjs",
          "runtime/arckit-runtime/test/lifecycle-trace.test.mjs",
          "runtime/arckit-runtime/test/automation-coordinator.test.mjs",
          "arckit/tech/arckit-runtime/solution.md",
          "runtime/arckit-runtime/README.md",
          "npm run check",
          "node runtime/arckit-runtime/bin/arckit-runtime.mjs run --project . --task \"验证待办生命周期埋点\" --dry-run --json --stream-events --lifecycle-trace-id TRACE-SMOKE-20260807 --lifecycle-parent-span-id SPAN-DESKTOP-SMOKE --lifecycle-run-id RUN-SMOKE"
        ],
        "occurred_at": "2026-08-07T15:52:18.510Z"
      }
    ],
    "evidence": [
      "runtime/arckit-runtime/src/observability/lifecycle-trace.mjs",
      "runtime/arckit-runtime/src/automation-coordinator.mjs",
      "runtime/arckit-runtime/src/desktop-run-manager.mjs",
      "runtime/arckit-runtime/src/state-driven-runner.mjs",
      "runtime/arckit-runtime/src/agent-orchestrator.mjs",
      "runtime/arckit-runtime/adapters/codex-app-server-adapter.mjs",
      "runtime/arckit-runtime/src/projection/run-event-projector.mjs",
      "runtime/arckit-runtime/test/lifecycle-trace.test.mjs",
      "runtime/arckit-runtime/test/automation-coordinator.test.mjs",
      "arckit/tech/arckit-runtime/solution.md",
      "runtime/arckit-runtime/README.md",
      "npm run check",
      "node runtime/arckit-runtime/bin/arckit-runtime.mjs run --project . --task \"验证待办生命周期埋点\" --dry-run --json --stream-events --lifecycle-trace-id TRACE-SMOKE-20260807 --lifecycle-parent-span-id SPAN-DESKTOP-SMOKE --lifecycle-run-id RUN-SMOKE"
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
      "goal": "Decide whether product_expectation is required and, within this same bounded facet, advance it as far as the accepted evidence supports.",
      "outcome": "completed",
      "planned_transition": "product_expectation becomes evidence-backed and resolved for this bounded Case.",
      "accepted_state_delta": {
        "facets": [
          {
            "facet": "product_expectation",
            "set": {
              "applicability": "required",
              "maturity": "confirmed",
              "target_maturity": "confirmed",
              "alignment": "aligned",
              "target_alignment": "aligned",
              "resolution": "resolved",
              "reason": "用户要求一个待办从领取到远端完成的全生命周期耗时可观测，并能区分架构编排、具体 Worker/skill/tool、外部依赖与收尾阶段；README 与实现对外暴露稳定 trace/summary/CLI 行为。"
            },
            "evidence": [
              "arckit/cases/active/CASE-20260807-006-instrument-runtime-todo-execution-lifecycle-latency.md",
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
        "arckit/cases/active/CASE-20260807-006-instrument-runtime-todo-execution-lifecycle-latency.md",
        "runtime/arckit-runtime/README.md"
      ],
      "runtime_result_ref": "",
      "occurred_at": "2026-08-07T15:48:46.200Z"
    },
    {
      "round": 2,
      "goal": "Decide whether interaction_expectation is required and, within this same bounded facet, advance it as far as the accepted evidence supports.",
      "outcome": "completed",
      "planned_transition": "interaction_expectation becomes evidence-backed and resolved for this bounded Case.",
      "accepted_state_delta": {
        "facets": [
          {
            "facet": "interaction_expectation",
            "set": {
              "applicability": "not_required",
              "resolution": "resolved",
              "reason": "本 Case 交付专用 trace 文件、Run/Completion 数据字段和分析 CLI，不改变已有 Desktop 用户操作流程或交互状态机。"
            },
            "evidence": [
              "runtime/arckit-runtime/README.md",
              "runtime/arckit-runtime/src/cli.mjs"
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
        "runtime/arckit-runtime/README.md",
        "runtime/arckit-runtime/src/cli.mjs"
      ],
      "runtime_result_ref": "",
      "occurred_at": "2026-08-07T15:48:46.515Z"
    },
    {
      "round": 3,
      "goal": "Decide whether visual_expectation is required and, within this same bounded facet, advance it as far as the accepted evidence supports.",
      "outcome": "completed",
      "planned_transition": "visual_expectation becomes evidence-backed and resolved for this bounded Case.",
      "accepted_state_delta": {
        "facets": [
          {
            "facet": "visual_expectation",
            "set": {
              "applicability": "not_required",
              "resolution": "resolved",
              "reason": "本 Case 不新增或修改 Renderer 视觉表面；生命周期事件明确不进入用户可见 current-step/timeline 投影。"
            },
            "evidence": [
              "runtime/arckit-runtime/src/projection/run-event-projector.mjs"
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
        "runtime/arckit-runtime/src/projection/run-event-projector.mjs"
      ],
      "runtime_result_ref": "",
      "occurred_at": "2026-08-07T15:48:46.809Z"
    },
    {
      "round": 4,
      "goal": "Decide whether technical_expectation is required and, within this same bounded facet, advance it as far as the accepted evidence supports.",
      "outcome": "completed",
      "planned_transition": "technical_expectation becomes evidence-backed and resolved for this bounded Case.",
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
              "reason": "稳定技术方案定义 trace/span 关联、wall/monotonic 时钟、成本中心、脱敏、持久化、exclusive time 聚合和诊断倾向，并与代码实现一致。"
            },
            "evidence": [
              "arckit/tech/arckit-runtime/solution.md",
              "runtime/arckit-runtime/src/observability/lifecycle-trace.mjs"
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
        "runtime/arckit-runtime/src/observability/lifecycle-trace.mjs"
      ],
      "runtime_result_ref": "",
      "occurred_at": "2026-08-07T15:48:47.103Z"
    },
    {
      "round": 5,
      "goal": "Decide whether implementation_state is required and, within this same bounded facet, advance it as far as the accepted evidence supports.",
      "outcome": "completed",
      "planned_transition": "implementation_state becomes evidence-backed and resolved for this bounded Case.",
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
              "reason": "Automation、Run Manager、Runtime session、Controller/Worker、Codex adapter、tool、ledger、commit 和远端完成均已接入同一 trace，且 trace 事件不触发 transcript 写入或覆盖 UI 当前步骤。"
            },
            "evidence": [
              "runtime/arckit-runtime/src/observability/lifecycle-trace.mjs",
              "runtime/arckit-runtime/src/automation-coordinator.mjs",
              "runtime/arckit-runtime/src/desktop-run-manager.mjs",
              "runtime/arckit-runtime/src/state-driven-runner.mjs",
              "runtime/arckit-runtime/src/agent-orchestrator.mjs",
              "runtime/arckit-runtime/adapters/codex-app-server-adapter.mjs",
              "runtime/arckit-runtime/src/projection/run-event-projector.mjs",
              "runtime/arckit-runtime/src/cli.mjs"
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
        "runtime/arckit-runtime/src/observability/lifecycle-trace.mjs",
        "runtime/arckit-runtime/src/automation-coordinator.mjs",
        "runtime/arckit-runtime/src/desktop-run-manager.mjs",
        "runtime/arckit-runtime/src/state-driven-runner.mjs",
        "runtime/arckit-runtime/src/agent-orchestrator.mjs",
        "runtime/arckit-runtime/adapters/codex-app-server-adapter.mjs",
        "runtime/arckit-runtime/src/projection/run-event-projector.mjs",
        "runtime/arckit-runtime/src/cli.mjs"
      ],
      "runtime_result_ref": "",
      "occurred_at": "2026-08-07T15:48:47.389Z"
    },
    {
      "round": 6,
      "goal": "Decide whether verification_state is required and, within this same bounded facet, advance it as far as the accepted evidence supports.",
      "outcome": "completed",
      "planned_transition": "verification_state becomes evidence-backed and resolved for this bounded Case.",
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
              "reason": "单测覆盖父子 exclusive time、trace 持久化、待办跨 claim/runtime/commit/completion 的 trace 传播；全量 Runtime check 与带 trace_id 的 dry-run smoke 均通过。"
            },
            "evidence": [
              "runtime/arckit-runtime/test/lifecycle-trace.test.mjs",
              "runtime/arckit-runtime/test/automation-coordinator.test.mjs",
              "runtime/arckit-runtime/test/state-driven-runner.test.mjs",
              "runtime/arckit-runtime/test/codex-app-server-adapter.test.mjs",
              "npm run check",
              "node runtime/arckit-runtime/bin/arckit-runtime.mjs run --project . --task \"验证待办生命周期埋点\" --dry-run --json --stream-events --lifecycle-trace-id TRACE-SMOKE-20260807 --lifecycle-parent-span-id SPAN-DESKTOP-SMOKE --lifecycle-run-id RUN-SMOKE"
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
        "runtime/arckit-runtime/test/lifecycle-trace.test.mjs",
        "runtime/arckit-runtime/test/automation-coordinator.test.mjs",
        "runtime/arckit-runtime/test/state-driven-runner.test.mjs",
        "runtime/arckit-runtime/test/codex-app-server-adapter.test.mjs",
        "npm run check",
        "node runtime/arckit-runtime/bin/arckit-runtime.mjs run --project . --task \"验证待办生命周期埋点\" --dry-run --json --stream-events --lifecycle-trace-id TRACE-SMOKE-20260807 --lifecycle-parent-span-id SPAN-DESKTOP-SMOKE --lifecycle-run-id RUN-SMOKE"
      ],
      "runtime_result_ref": "",
      "occurred_at": "2026-08-07T15:48:47.680Z"
    },
    {
      "round": 7,
      "goal": "Review the complete Case result for correctness, completeness, and minimality, then record a clean result or evidence-backed findings.",
      "outcome": "completed",
      "planned_transition": "Completion review for content_revision=6 becomes clean and the ledger closes the Case.",
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
            "runtime/arckit-runtime/src/observability/lifecycle-trace.mjs",
            "runtime/arckit-runtime/src/automation-coordinator.mjs",
            "runtime/arckit-runtime/src/desktop-run-manager.mjs",
            "runtime/arckit-runtime/src/state-driven-runner.mjs",
            "runtime/arckit-runtime/src/agent-orchestrator.mjs",
            "runtime/arckit-runtime/adapters/codex-app-server-adapter.mjs",
            "runtime/arckit-runtime/src/projection/run-event-projector.mjs",
            "runtime/arckit-runtime/test/lifecycle-trace.test.mjs",
            "runtime/arckit-runtime/test/automation-coordinator.test.mjs",
            "arckit/tech/arckit-runtime/solution.md",
            "runtime/arckit-runtime/README.md",
            "npm run check",
            "node runtime/arckit-runtime/bin/arckit-runtime.mjs run --project . --task \"验证待办生命周期埋点\" --dry-run --json --stream-events --lifecycle-trace-id TRACE-SMOKE-20260807 --lifecycle-parent-span-id SPAN-DESKTOP-SMOKE --lifecycle-run-id RUN-SMOKE"
          ]
        },
        "resolved_review_findings": [],
        "review_budget_extension": null
      },
      "evidence": [
        "runtime/arckit-runtime/src/observability/lifecycle-trace.mjs",
        "runtime/arckit-runtime/src/automation-coordinator.mjs",
        "runtime/arckit-runtime/src/desktop-run-manager.mjs",
        "runtime/arckit-runtime/src/state-driven-runner.mjs",
        "runtime/arckit-runtime/src/agent-orchestrator.mjs",
        "runtime/arckit-runtime/adapters/codex-app-server-adapter.mjs",
        "runtime/arckit-runtime/src/projection/run-event-projector.mjs",
        "runtime/arckit-runtime/test/lifecycle-trace.test.mjs",
        "runtime/arckit-runtime/test/automation-coordinator.test.mjs",
        "arckit/tech/arckit-runtime/solution.md",
        "runtime/arckit-runtime/README.md",
        "npm run check",
        "node runtime/arckit-runtime/bin/arckit-runtime.mjs run --project . --task \"验证待办生命周期埋点\" --dry-run --json --stream-events --lifecycle-trace-id TRACE-SMOKE-20260807 --lifecycle-parent-span-id SPAN-DESKTOP-SMOKE --lifecycle-run-id RUN-SMOKE"
      ],
      "runtime_result_ref": "",
      "occurred_at": "2026-08-07T15:52:18.510Z"
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
          "case:CASE-20260807-006"
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
    "updated_at": "2026-08-07T15:52:18.510Z"
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
