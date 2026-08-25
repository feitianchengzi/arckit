# 补齐 Automation 已关闭 Case 复用绑定与无绑定终态门禁

Case: CASE-20260825-011
Status: closed
Artifact Type: mixed
Selected Gap: none
Updated: 2026-08-25T16:21:38.350Z

## User Intent

让已由 closed resolved Case 覆盖的重复或晚到待办通过可信、幂等、可恢复的 task-to-Case 绑定完成，同时禁止 Runtime 在没有权威绑定时报告完成或启动 Git closeout。

## Structured Record

```json
{
  "schema_version": "development-case-record/v5",
  "id": "CASE-20260825-011",
  "title": "补齐 Automation 已关闭 Case 复用绑定与无绑定终态门禁",
  "status": "closed",
  "artifact_type": "mixed",
  "created_at": "2026-08-25T15:54:36.838Z",
  "updated_at": "2026-08-25T16:21:38.350Z",
  "user_intent": "让已由 closed resolved Case 覆盖的重复或晚到待办通过可信、幂等、可恢复的 task-to-Case 绑定完成，同时禁止 Runtime 在没有权威绑定时报告完成或启动 Git closeout。",
  "expected_outcome": "Agent 可以提交 typed closed-Case coverage claim，trusted ledger 在 fresh canonical state 上验证并返回绑定回执，Desktop 可在正常运行和强退恢复后持久化同一绑定；无绑定完成被提前阻止，恢复中心提供明确且不会循环的处理路径。",
  "project_state_ref": "arckit/project/state.record.json",
  "current_round": {
    "goal": "",
    "selected_gap": null
  },
  "facts": [
    {
      "id": "FACT-AUTOMATION-UNBOUND-COMPLETION",
      "revision": 1,
      "status": "accepted",
      "statement": "ArcOrbit can receive a terminal Agent handoff and completed Git closeout for a todo whose current Run has no trusted ledger receipt and no persisted authoritative task-to-Case binding; when the work was already covered by a closed resolved Case, the current protocol offers no typed reuse binding and Automation enters case_binding_missing recovery.",
      "basis": "Confirmed Runtime activity, Desktop state, and source-code control-flow diagnosis.",
      "evidence": [
        "Current operator-confirmed diagnosis, 2026-08-25",
        "runtime/arcorbit/src/state-driven-runner.mjs",
        "runtime/arcorbit/src/automation-coordinator.mjs",
        "runtime/arcorbit/test/automation-coordinator.test.mjs"
      ]
    },
    {
      "id": "FACT-AUTOMATION-CLOSED-CASE-REUSE-CONTRACT",
      "revision": 1,
      "status": "accepted",
      "statement": "A todo may complete through an existing closed resolved Case only after the Agent submits a typed semantic coverage claim and a trusted ledger entrypoint validates the fresh Case identity and emits an authoritative idempotent binding receipt; Runtime must not report completion or start closeout while the todo remains unbound, and Desktop recovery must reconstruct an accepted receipt after process loss without parsing Agent prose or creating a duplicate Case.",
      "basis": "Current operator approval of the evidence-backed optimization direction.",
      "evidence": [
        "Current operator input, 2026-08-25",
        "runtime/arcorbit/src/automation-coordinator.mjs",
        "runtime/arcorbit/src/state-driven-runner.mjs",
        "entry/skills/arckit-development-ledger/scripts/runtime-case-control.mjs"
      ]
    },
    {
      "id": "FACT-20260825-011-001",
      "revision": 1,
      "status": "accepted",
      "statement": "ArcOrbit implements typed bind_closed_case validation and idempotent receipts, an authoritativeCaseId terminal guard, receipt-based crash recovery, and targeted operator recovery actions.",
      "basis": "Implemented source, stable documentation, and focused regression evidence.",
      "evidence": [
        "runtime/arcorbit/test/runtime-case-control.test.mjs",
        "runtime/arcorbit/test/state-driven-runner.test.mjs",
        "runtime/arcorbit/test/automation-coordinator.test.mjs",
        "Verification: 124 focused Runtime tests passed, 2026-08-26",
        "arckit/spec/agentic-software-development/runtime-automation-workspace.md",
        "arckit/interaction/automation-workspace/interaction.md",
        "arckit/interaction/automation-workspace/runtime-recovery.html",
        "arckit/tech/arcorbit/desktop-execution-solution.md"
      ]
    }
  ],
  "state_impacts": [
    {
      "id": "IMPACT-AUTOMATION-REUSE-PRODUCT",
      "fact_id": "FACT-AUTOMATION-CLOSED-CASE-REUSE-CONTRACT",
      "fact_revision": 1,
      "target": {
        "kind": "software_decision",
        "ref": "product_capabilities",
        "revision": 32
      },
      "effect": "upheld",
      "reason": "The trusted reuse receipt, terminal guard, recovery projection, durable contract, and regression evidence now realize this decision.",
      "gap_ids": [],
      "evidence": [
        "runtime/arcorbit/test/runtime-case-control.test.mjs",
        "runtime/arcorbit/test/state-driven-runner.test.mjs",
        "runtime/arcorbit/test/automation-coordinator.test.mjs",
        "Verification: 124 focused Runtime tests passed, 2026-08-26",
        "arckit/spec/agentic-software-development/runtime-automation-workspace.md",
        "arckit/interaction/automation-workspace/interaction.md",
        "arckit/interaction/automation-workspace/runtime-recovery.html",
        "arckit/tech/arcorbit/desktop-execution-solution.md"
      ]
    },
    {
      "id": "IMPACT-AUTOMATION-REUSE-EXPERIENCE",
      "fact_id": "FACT-AUTOMATION-CLOSED-CASE-REUSE-CONTRACT",
      "fact_revision": 1,
      "target": {
        "kind": "software_decision",
        "ref": "experience_and_interaction",
        "revision": 48
      },
      "effect": "upheld",
      "reason": "The trusted reuse receipt, terminal guard, recovery projection, durable contract, and regression evidence now realize this decision.",
      "gap_ids": [],
      "evidence": [
        "runtime/arcorbit/test/runtime-case-control.test.mjs",
        "runtime/arcorbit/test/state-driven-runner.test.mjs",
        "runtime/arcorbit/test/automation-coordinator.test.mjs",
        "Verification: 124 focused Runtime tests passed, 2026-08-26",
        "arckit/spec/agentic-software-development/runtime-automation-workspace.md",
        "arckit/interaction/automation-workspace/interaction.md",
        "arckit/interaction/automation-workspace/runtime-recovery.html",
        "arckit/tech/arcorbit/desktop-execution-solution.md"
      ]
    },
    {
      "id": "IMPACT-AUTOMATION-REUSE-DATA",
      "fact_id": "FACT-AUTOMATION-CLOSED-CASE-REUSE-CONTRACT",
      "fact_revision": 1,
      "target": {
        "kind": "software_decision",
        "ref": "data_and_state",
        "revision": 17
      },
      "effect": "upheld",
      "reason": "The trusted reuse receipt, terminal guard, recovery projection, durable contract, and regression evidence now realize this decision.",
      "gap_ids": [],
      "evidence": [
        "runtime/arcorbit/test/runtime-case-control.test.mjs",
        "runtime/arcorbit/test/state-driven-runner.test.mjs",
        "runtime/arcorbit/test/automation-coordinator.test.mjs",
        "Verification: 124 focused Runtime tests passed, 2026-08-26",
        "arckit/spec/agentic-software-development/runtime-automation-workspace.md",
        "arckit/interaction/automation-workspace/interaction.md",
        "arckit/interaction/automation-workspace/runtime-recovery.html",
        "arckit/tech/arcorbit/desktop-execution-solution.md"
      ]
    },
    {
      "id": "IMPACT-AUTOMATION-REUSE-TECHNICAL",
      "fact_id": "FACT-AUTOMATION-CLOSED-CASE-REUSE-CONTRACT",
      "fact_revision": 1,
      "target": {
        "kind": "software_decision",
        "ref": "technical_foundation",
        "revision": 36
      },
      "effect": "upheld",
      "reason": "The trusted reuse receipt, terminal guard, recovery projection, durable contract, and regression evidence now realize this decision.",
      "gap_ids": [],
      "evidence": [
        "runtime/arcorbit/test/runtime-case-control.test.mjs",
        "runtime/arcorbit/test/state-driven-runner.test.mjs",
        "runtime/arcorbit/test/automation-coordinator.test.mjs",
        "Verification: 124 focused Runtime tests passed, 2026-08-26",
        "arckit/spec/agentic-software-development/runtime-automation-workspace.md",
        "arckit/interaction/automation-workspace/interaction.md",
        "arckit/interaction/automation-workspace/runtime-recovery.html",
        "arckit/tech/arcorbit/desktop-execution-solution.md"
      ]
    },
    {
      "id": "IMPACT-AUTOMATION-REUSE-OBSERVABILITY",
      "fact_id": "FACT-AUTOMATION-CLOSED-CASE-REUSE-CONTRACT",
      "fact_revision": 1,
      "target": {
        "kind": "software_decision",
        "ref": "observability_and_operation",
        "revision": 10
      },
      "effect": "upheld",
      "reason": "The trusted reuse receipt, terminal guard, recovery projection, durable contract, and regression evidence now realize this decision.",
      "gap_ids": [],
      "evidence": [
        "runtime/arcorbit/test/runtime-case-control.test.mjs",
        "runtime/arcorbit/test/state-driven-runner.test.mjs",
        "runtime/arcorbit/test/automation-coordinator.test.mjs",
        "Verification: 124 focused Runtime tests passed, 2026-08-26",
        "arckit/spec/agentic-software-development/runtime-automation-workspace.md",
        "arckit/interaction/automation-workspace/interaction.md",
        "arckit/interaction/automation-workspace/runtime-recovery.html",
        "arckit/tech/arcorbit/desktop-execution-solution.md"
      ]
    }
  ],
  "gaps": [
    {
      "id": "GAP-AUTHORITATIVE-CLOSED-CASE-REUSE",
      "status": "resolved",
      "goal": "Implement and durably specify the authoritative closed-Case reuse binding, unbound-completion gate, idempotent process-loss recovery, targeted operator recovery actions, and cross-layer regression evidence.",
      "reason": "The accepted contract and confirmed control-flow failure already determine the required cross-layer behavior; all implementation, durable expectation, and validation changes serve this single bounded outcome.",
      "derived_from": [
        "FACT-AUTOMATION-UNBOUND-COMPLETION",
        "FACT-AUTOMATION-CLOSED-CASE-REUSE-CONTRACT"
      ],
      "blocked_by": [],
      "priority_basis": {
        "blocking": "high",
        "urgency": "high",
        "risk": "high",
        "user_impact": "high"
      },
      "responsibility": "agent",
      "evidence_required": [
        "Trusted entrypoint validation and typed receipt tests for closed/resolved, missing, active, stale, conflicting, and idempotent reuse.",
        "Runtime tests proving an unbound terminal handoff cannot report completion or start closeout.",
        "Desktop tests proving accepted reuse binding persistence, process-loss reconstruction, conflict rejection, and non-looping recovery actions.",
        "Durable product, interaction, and technical evidence describing ownership, safety, lifecycle, and recovery semantics."
      ],
      "resolution": {
        "id": "GAP-AUTHORITATIVE-CLOSED-CASE-REUSE",
        "status": "resolved",
        "outcome": "Automation now accepts exact closed/resolved Case reuse only through a trusted idempotent receipt and blocks unbound terminal completion before closeout.",
        "reason": "The ledger entrypoint, runner, Desktop recovery, Renderer actions, stable docs, and regression tests agree on one fail-closed lifecycle.",
        "evidence": [
          "runtime/arcorbit/test/runtime-case-control.test.mjs",
          "runtime/arcorbit/test/state-driven-runner.test.mjs",
          "runtime/arcorbit/test/automation-coordinator.test.mjs",
          "Verification: 124 focused Runtime tests passed, 2026-08-26",
          "arckit/spec/agentic-software-development/runtime-automation-workspace.md",
          "arckit/interaction/automation-workspace/interaction.md",
          "arckit/interaction/automation-workspace/runtime-recovery.html",
          "arckit/tech/arcorbit/desktop-execution-solution.md"
        ],
        "occurred_at": "2026-08-25T16:15:07.922Z"
      }
    }
  ],
  "content_revision": 1,
  "completion_review": {
    "status": "clean",
    "policy": {
      "initial_max_cycles": 10,
      "source": "runtime/arcorbit/config/case-policy.json",
      "snapshotted_at": "2026-08-25T15:54:36.838Z"
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
          "runtime/arcorbit/test/runtime-case-control.test.mjs",
          "runtime/arcorbit/test/state-driven-runner.test.mjs",
          "runtime/arcorbit/test/automation-coordinator.test.mjs",
          "Verification: 125/125 focused Runtime tests passed, 2026-08-26",
          "Verification: syntax checks and git diff --check passed, 2026-08-26",
          "Full npm test audit: 423 passed, 11 skipped, and 3 unrelated pre-existing/parallel Setup Readiness or Electron SIGABRT failures, 2026-08-26",
          "arckit/spec/agentic-software-development/runtime-automation-workspace.md",
          "arckit/interaction/automation-workspace/interaction.md",
          "arckit/interaction/automation-workspace/runtime-recovery.html",
          "arckit/tech/arcorbit/desktop-execution-solution.md"
        ],
        "occurred_at": "2026-08-25T16:21:38.350Z"
      }
    ],
    "evidence": [
      "runtime/arcorbit/test/runtime-case-control.test.mjs",
      "runtime/arcorbit/test/state-driven-runner.test.mjs",
      "runtime/arcorbit/test/automation-coordinator.test.mjs",
      "Verification: 125/125 focused Runtime tests passed, 2026-08-26",
      "Verification: syntax checks and git diff --check passed, 2026-08-26",
      "Full npm test audit: 423 passed, 11 skipped, and 3 unrelated pre-existing/parallel Setup Readiness or Electron SIGABRT failures, 2026-08-26",
      "arckit/spec/agentic-software-development/runtime-automation-workspace.md",
      "arckit/interaction/automation-workspace/interaction.md",
      "arckit/interaction/automation-workspace/runtime-recovery.html",
      "arckit/tech/arcorbit/desktop-execution-solution.md"
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
      "goal": "Accept the implemented trusted closed Case reuse lifecycle and resolve the unbound-completion defect.",
      "outcome": "completed",
      "gap_selection": {
        "mode": "candidate",
        "basis": "The only ready gap in CASE-20260825-011 directly addresses the confirmed blocking Automation lifecycle defect.",
        "snapshot_token": "60ff2aa833dfdd44b16d3435369efa8699440fe260d68b6881372720cd513a56",
        "selected_ref": "case-gap:CASE-20260825-011:GAP-AUTHORITATIVE-CLOSED-CASE-REUSE",
        "comparison_summary": "Compared the current Case gap with every in-scope persisted Project candidate; unrelated broader candidates remain deferred.",
        "fresh_discovery_summary": "No additional unresolved work was discovered after implementation, documentation, and focused regression validation.",
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
            "reason": "This persisted Project candidate remains outside the bounded current Case gap."
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
            "reason": "This persisted Project candidate remains outside the bounded current Case gap."
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
            "reason": "This persisted Project candidate remains outside the bounded current Case gap."
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
            "reason": "This persisted Project candidate remains outside the bounded current Case gap."
          },
          {
            "ref": "case-gap:CASE-20260825-011:GAP-AUTHORITATIVE-CLOSED-CASE-REUSE",
            "source": "persisted",
            "eligibility": "ready",
            "disposition": "selected",
            "priority_basis": {
              "blocking": "high",
              "uncertainty": "",
              "risk": "high",
              "user_impact": "high",
              "urgency": "high"
            },
            "reason": "This high-risk user-blocking gap is implemented and verified in the current round."
          }
        ]
      },
      "selected_gap": {
        "id": "GAP-AUTHORITATIVE-CLOSED-CASE-REUSE",
        "responsibility": "agent",
        "goal": "Implement and durably specify the authoritative closed-Case reuse binding, unbound-completion gate, idempotent process-loss recovery, targeted operator recovery actions, and cross-layer regression evidence.",
        "reason": "The accepted contract and confirmed control-flow failure already determine the required cross-layer behavior; all implementation, durable expectation, and validation changes serve this single bounded outcome.",
        "derived_from": [
          "FACT-AUTOMATION-UNBOUND-COMPLETION",
          "FACT-AUTOMATION-CLOSED-CASE-REUSE-CONTRACT"
        ],
        "blocked_by": [],
        "priority_basis": {
          "blocking": "high",
          "uncertainty": "",
          "risk": "high",
          "user_impact": "high",
          "urgency": "high"
        },
        "evidence_required": [
          "Trusted entrypoint validation and typed receipt tests for closed/resolved, missing, active, stale, conflicting, and idempotent reuse.",
          "Runtime tests proving an unbound terminal handoff cannot report completion or start closeout.",
          "Desktop tests proving accepted reuse binding persistence, process-loss reconstruction, conflict rejection, and non-looping recovery actions.",
          "Durable product, interaction, and technical evidence describing ownership, safety, lifecycle, and recovery semantics."
        ]
      },
      "planned_transition": {
        "goal": "Accept the implemented trusted closed Case reuse lifecycle and resolve the unbound-completion defect.",
        "expected_state_change": "Resolve the selected Gap, uphold all five threatened decision impacts, update durable Project decisions, and enter Completion Review."
      },
      "accepted_state_delta": {
        "resolved_gap": {
          "id": "GAP-AUTHORITATIVE-CLOSED-CASE-REUSE",
          "status": "resolved",
          "outcome": "Automation now accepts exact closed/resolved Case reuse only through a trusted idempotent receipt and blocks unbound terminal completion before closeout.",
          "reason": "The ledger entrypoint, runner, Desktop recovery, Renderer actions, stable docs, and regression tests agree on one fail-closed lifecycle.",
          "evidence": [
            "runtime/arcorbit/test/runtime-case-control.test.mjs",
            "runtime/arcorbit/test/state-driven-runner.test.mjs",
            "runtime/arcorbit/test/automation-coordinator.test.mjs",
            "Verification: 124 focused Runtime tests passed, 2026-08-26",
            "arckit/spec/agentic-software-development/runtime-automation-workspace.md",
            "arckit/interaction/automation-workspace/interaction.md",
            "arckit/interaction/automation-workspace/runtime-recovery.html",
            "arckit/tech/arcorbit/desktop-execution-solution.md"
          ]
        },
        "facts_added": [
          {
            "id": "FACT-20260825-011-001",
            "revision": 1,
            "status": "accepted",
            "statement": "ArcOrbit implements typed bind_closed_case validation and idempotent receipts, an authoritativeCaseId terminal guard, receipt-based crash recovery, and targeted operator recovery actions.",
            "basis": "Implemented source, stable documentation, and focused regression evidence.",
            "evidence": [
              "runtime/arcorbit/test/runtime-case-control.test.mjs",
              "runtime/arcorbit/test/state-driven-runner.test.mjs",
              "runtime/arcorbit/test/automation-coordinator.test.mjs",
              "Verification: 124 focused Runtime tests passed, 2026-08-26",
              "arckit/spec/agentic-software-development/runtime-automation-workspace.md",
              "arckit/interaction/automation-workspace/interaction.md",
              "arckit/interaction/automation-workspace/runtime-recovery.html",
              "arckit/tech/arcorbit/desktop-execution-solution.md"
            ]
          }
        ],
        "facts_superseded": [],
        "impacts_added": [],
        "impacts_updated": [
          {
            "id": "IMPACT-AUTOMATION-REUSE-PRODUCT",
            "fact_id": "FACT-AUTOMATION-CLOSED-CASE-REUSE-CONTRACT",
            "fact_revision": 1,
            "target": {
              "kind": "software_decision",
              "ref": "product_capabilities",
              "revision": 32
            },
            "effect": "upheld",
            "reason": "The trusted reuse receipt, terminal guard, recovery projection, durable contract, and regression evidence now realize this decision.",
            "gap_ids": [],
            "evidence": [
              "runtime/arcorbit/test/runtime-case-control.test.mjs",
              "runtime/arcorbit/test/state-driven-runner.test.mjs",
              "runtime/arcorbit/test/automation-coordinator.test.mjs",
              "Verification: 124 focused Runtime tests passed, 2026-08-26",
              "arckit/spec/agentic-software-development/runtime-automation-workspace.md",
              "arckit/interaction/automation-workspace/interaction.md",
              "arckit/interaction/automation-workspace/runtime-recovery.html",
              "arckit/tech/arcorbit/desktop-execution-solution.md"
            ]
          },
          {
            "id": "IMPACT-AUTOMATION-REUSE-EXPERIENCE",
            "fact_id": "FACT-AUTOMATION-CLOSED-CASE-REUSE-CONTRACT",
            "fact_revision": 1,
            "target": {
              "kind": "software_decision",
              "ref": "experience_and_interaction",
              "revision": 48
            },
            "effect": "upheld",
            "reason": "The trusted reuse receipt, terminal guard, recovery projection, durable contract, and regression evidence now realize this decision.",
            "gap_ids": [],
            "evidence": [
              "runtime/arcorbit/test/runtime-case-control.test.mjs",
              "runtime/arcorbit/test/state-driven-runner.test.mjs",
              "runtime/arcorbit/test/automation-coordinator.test.mjs",
              "Verification: 124 focused Runtime tests passed, 2026-08-26",
              "arckit/spec/agentic-software-development/runtime-automation-workspace.md",
              "arckit/interaction/automation-workspace/interaction.md",
              "arckit/interaction/automation-workspace/runtime-recovery.html",
              "arckit/tech/arcorbit/desktop-execution-solution.md"
            ]
          },
          {
            "id": "IMPACT-AUTOMATION-REUSE-DATA",
            "fact_id": "FACT-AUTOMATION-CLOSED-CASE-REUSE-CONTRACT",
            "fact_revision": 1,
            "target": {
              "kind": "software_decision",
              "ref": "data_and_state",
              "revision": 17
            },
            "effect": "upheld",
            "reason": "The trusted reuse receipt, terminal guard, recovery projection, durable contract, and regression evidence now realize this decision.",
            "gap_ids": [],
            "evidence": [
              "runtime/arcorbit/test/runtime-case-control.test.mjs",
              "runtime/arcorbit/test/state-driven-runner.test.mjs",
              "runtime/arcorbit/test/automation-coordinator.test.mjs",
              "Verification: 124 focused Runtime tests passed, 2026-08-26",
              "arckit/spec/agentic-software-development/runtime-automation-workspace.md",
              "arckit/interaction/automation-workspace/interaction.md",
              "arckit/interaction/automation-workspace/runtime-recovery.html",
              "arckit/tech/arcorbit/desktop-execution-solution.md"
            ]
          },
          {
            "id": "IMPACT-AUTOMATION-REUSE-TECHNICAL",
            "fact_id": "FACT-AUTOMATION-CLOSED-CASE-REUSE-CONTRACT",
            "fact_revision": 1,
            "target": {
              "kind": "software_decision",
              "ref": "technical_foundation",
              "revision": 36
            },
            "effect": "upheld",
            "reason": "The trusted reuse receipt, terminal guard, recovery projection, durable contract, and regression evidence now realize this decision.",
            "gap_ids": [],
            "evidence": [
              "runtime/arcorbit/test/runtime-case-control.test.mjs",
              "runtime/arcorbit/test/state-driven-runner.test.mjs",
              "runtime/arcorbit/test/automation-coordinator.test.mjs",
              "Verification: 124 focused Runtime tests passed, 2026-08-26",
              "arckit/spec/agentic-software-development/runtime-automation-workspace.md",
              "arckit/interaction/automation-workspace/interaction.md",
              "arckit/interaction/automation-workspace/runtime-recovery.html",
              "arckit/tech/arcorbit/desktop-execution-solution.md"
            ]
          },
          {
            "id": "IMPACT-AUTOMATION-REUSE-OBSERVABILITY",
            "fact_id": "FACT-AUTOMATION-CLOSED-CASE-REUSE-CONTRACT",
            "fact_revision": 1,
            "target": {
              "kind": "software_decision",
              "ref": "observability_and_operation",
              "revision": 10
            },
            "effect": "upheld",
            "reason": "The trusted reuse receipt, terminal guard, recovery projection, durable contract, and regression evidence now realize this decision.",
            "gap_ids": [],
            "evidence": [
              "runtime/arcorbit/test/runtime-case-control.test.mjs",
              "runtime/arcorbit/test/state-driven-runner.test.mjs",
              "runtime/arcorbit/test/automation-coordinator.test.mjs",
              "Verification: 124 focused Runtime tests passed, 2026-08-26",
              "arckit/spec/agentic-software-development/runtime-automation-workspace.md",
              "arckit/interaction/automation-workspace/interaction.md",
              "arckit/interaction/automation-workspace/runtime-recovery.html",
              "arckit/tech/arcorbit/desktop-execution-solution.md"
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
            "area_ref": "product_capabilities",
            "observed_revision": 31,
            "set_decision": {
              "status": "settled",
              "statement": "ArcOrbit 保留既有 Desktop、Runtime、Chat、Automation、Feedback 与 Work 能力和边界。Work 是 Workshop 待办同步与本地 Task Projection 的唯一客户端所有者，并允许在新建、编辑和 Inspector 中修改完整七状态。Work 编辑待办允许把内容复制到当前产品集内另一个可写产品，并在目标创建获 Workshop 确认后删除源 Task。目标 Task 获得新身份，仅复制正文、状态、优先级及目标产品内重新选择的关联字段，不继承评论、附件、Run、session、thread、Gate 或验收问题。Work 负责两阶段 mutation 和部分成功恢复；Automation 只消费服务器确认后的本地状态。Setup Readiness 同时提供 Codex CLI executable/version 检测、macOS/Linux/Windows 官方 standalone 安装与更新、独立登录状态检测、无默认值的显式认证方式选择、官方登录/logout 流程和操作后的自动重新验证；只有 Codex 与其它 readiness 条件全部通过才进入 ready。 Automation 支持通过 trusted ledger 的类型化 bind_closed_case 收据，把当前待办绑定到一个精确匹配的 closed/resolved Case；未绑定 terminal handoff 不进入完成或 closeout。",
              "reason": "接受 Automation 已关闭 Case 可信复用、无绑定终态门禁和可恢复生命周期。",
              "evidence": [
                "runtime/arcorbit/test/runtime-case-control.test.mjs",
                "runtime/arcorbit/test/state-driven-runner.test.mjs",
                "runtime/arcorbit/test/automation-coordinator.test.mjs",
                "Verification: 124 focused Runtime tests passed, 2026-08-26",
                "arckit/spec/agentic-software-development/runtime-automation-workspace.md",
                "arckit/interaction/automation-workspace/interaction.md",
                "arckit/interaction/automation-workspace/runtime-recovery.html",
                "arckit/tech/arcorbit/desktop-execution-solution.md"
              ],
              "confidence": "high",
              "resume_condition": "当官方 installer/auth CLI、外部安装迁移政策、支持平台或 ready 条件改变时重审。 当 closed Case 覆盖判定、绑定收据字段、terminal 门禁或恢复动作变化时重审。"
            },
            "gap_refs": [
              "GAP-agent-scenario-evaluation"
            ],
            "reason": "本轮实现和验证已经使该稳定决策可恢复。",
            "evidence": [
              "runtime/arcorbit/test/runtime-case-control.test.mjs",
              "runtime/arcorbit/test/state-driven-runner.test.mjs",
              "runtime/arcorbit/test/automation-coordinator.test.mjs",
              "Verification: 124 focused Runtime tests passed, 2026-08-26",
              "arckit/spec/agentic-software-development/runtime-automation-workspace.md",
              "arckit/interaction/automation-workspace/interaction.md",
              "arckit/interaction/automation-workspace/runtime-recovery.html",
              "arckit/tech/arcorbit/desktop-execution-solution.md"
            ]
          },
          {
            "area_ref": "experience_and_interaction",
            "observed_revision": 47,
            "set_decision": {
              "status": "settled",
              "statement": "ArcOrbit 保持既有 Personal、Product Lifecycle、Organization 导航与 Work、Automation、Feedback、Chat 等交互语义。Work 编辑 Sheet 显示当前产品集内可写产品；切换产品时清空旧产品限定的执行人、父待办和标签选择，并保留正文、状态及优先级草稿。确认界面明确说明将创建新 Task、删除旧 Task、生成新 id，且评论、附件和执行关系不会迁移。提交先创建目标 Task，确认成功后才删除源 Task；创建失败保留源 Task和草稿，删除失败则显示源、目标 Task 及可恢复状态，允许重试删除或明确保留两者。源删除确认后 Automation 安全停止旧 execution；目标 Task 不继承旧 execution。ArcOrbit 主窗口只使用应用自定义标题栏；标题区域支持拖动和双击最大化/还原，原生边缘缩放继续可用，应用内最小化、最大化/还原和关闭按钮必须真实控制当前窗口、保持可聚焦，并同步反映当前窗口状态。Setup Readiness 在 Codex 缺失、损坏、更新或未认证时原位提供恢复：安装/更新展示下载、执行、发现与复核进度；登录先选择无默认值的凭证类型，ChatGPT 再选择无默认值的浏览器或设备码流程，选择完成前继续按钮禁用。成功、取消、超时和失败都重新验证状态并提供明确反馈与重试；活动 Codex owner 阻止更新，外部安装显示所有权而不被静默替换。 Case 绑定缺失恢复明确区分复用已有 Case、作为新事项继续、补充说明和标记阻塞，并保持原 task session 与 Agent thread。",
              "reason": "接受 Automation 已关闭 Case 可信复用、无绑定终态门禁和可恢复生命周期。",
              "evidence": [
                "runtime/arcorbit/test/runtime-case-control.test.mjs",
                "runtime/arcorbit/test/state-driven-runner.test.mjs",
                "runtime/arcorbit/test/automation-coordinator.test.mjs",
                "Verification: 124 focused Runtime tests passed, 2026-08-26",
                "arckit/spec/agentic-software-development/runtime-automation-workspace.md",
                "arckit/interaction/automation-workspace/interaction.md",
                "arckit/interaction/automation-workspace/runtime-recovery.html",
                "arckit/tech/arcorbit/desktop-execution-solution.md"
              ],
              "confidence": "high",
              "resume_condition": "当认证层级、可见方式、安装进度、取消/超时或外部安装恢复行为改变时重审。 当 closed Case 覆盖判定、绑定收据字段、terminal 门禁或恢复动作变化时重审。"
            },
            "gap_refs": [],
            "reason": "本轮实现和验证已经使该稳定决策可恢复。",
            "evidence": [
              "runtime/arcorbit/test/runtime-case-control.test.mjs",
              "runtime/arcorbit/test/state-driven-runner.test.mjs",
              "runtime/arcorbit/test/automation-coordinator.test.mjs",
              "Verification: 124 focused Runtime tests passed, 2026-08-26",
              "arckit/spec/agentic-software-development/runtime-automation-workspace.md",
              "arckit/interaction/automation-workspace/interaction.md",
              "arckit/interaction/automation-workspace/runtime-recovery.html",
              "arckit/tech/arcorbit/desktop-execution-solution.md"
            ]
          },
          {
            "area_ref": "data_and_state",
            "observed_revision": 16,
            "set_decision": {
              "status": "settled",
              "statement": "Canonical development state 继续位于 Project/Iteration/Case ledger，Workshop 继续拥有账户、组织、项目、成员、任务、附件和普通反馈真相；ArcOrbit 继续拥有 Product Workspace 绑定、Workset、Work Sync 的登录代际/项目分区 Task Projection、realtime cursor、Runtime execution/session/thread、介入恢复、验收反馈和 bundled-skill control-plane state；Automation 只拥有执行控制状态，不保存独立远端任务快照。ArcOrbit 还拥有本地 Chat session、消息、Composer 草稿、选中状态、Product Workspace/规范化项目根归属、Codex thread binding、turn/item 引用和最近运行/恢复状态。Chat 数据不写入 Workshop 或 ledger，不与 Automation task session 合并。删除会话仅移除 ArcOrbit 本地记录和恢复能力，不声明擦除 Codex 可能保留的底层 thread；活动删除必须先完成 interrupt，任一步失败均不得部分删除。 Automation 活动状态由单一 active_task 升级为按规范化本地工作区键控的 active_executions；每项拥有稳定 execution_id，旧单例状态在读取时安全迁移。 当前待办到 Case 的权威绑定来自 task session 内 append-only accepted ledger receipt；closed Case 复用收据幂等且可在进程退出后重建 Desktop 投影。",
              "reason": "接受 Automation 已关闭 Case 可信复用、无绑定终态门禁和可恢复生命周期。",
              "evidence": [
                "runtime/arcorbit/test/runtime-case-control.test.mjs",
                "runtime/arcorbit/test/state-driven-runner.test.mjs",
                "runtime/arcorbit/test/automation-coordinator.test.mjs",
                "Verification: 124 focused Runtime tests passed, 2026-08-26",
                "arckit/spec/agentic-software-development/runtime-automation-workspace.md",
                "arckit/interaction/automation-workspace/interaction.md",
                "arckit/interaction/automation-workspace/runtime-recovery.html",
                "arckit/tech/arcorbit/desktop-execution-solution.md"
              ],
              "confidence": "high",
              "resume_condition": "当 Task Projection 跨设备同步、身份代际、持久化模型或 Automation 状态所有权变化时重审。 当 Automation 并发 lane 的分区键、上限、隔离或恢复语义变化时也需重审。 当 closed Case 覆盖判定、绑定收据字段、terminal 门禁或恢复动作变化时重审。"
            },
            "gap_refs": [
              "GAP-cross-record-audit"
            ],
            "reason": "本轮实现和验证已经使该稳定决策可恢复。",
            "evidence": [
              "runtime/arcorbit/test/runtime-case-control.test.mjs",
              "runtime/arcorbit/test/state-driven-runner.test.mjs",
              "runtime/arcorbit/test/automation-coordinator.test.mjs",
              "Verification: 124 focused Runtime tests passed, 2026-08-26",
              "arckit/spec/agentic-software-development/runtime-automation-workspace.md",
              "arckit/interaction/automation-workspace/interaction.md",
              "arckit/interaction/automation-workspace/runtime-recovery.html",
              "arckit/tech/arcorbit/desktop-execution-solution.md"
            ]
          },
          {
            "area_ref": "technical_foundation",
            "observed_revision": 35,
            "set_decision": {
              "status": "settled",
              "statement": "Arckit 继续使用 repository-owned Markdown/JSON state 与 Node.js ESM ledger CLI；ArcOrbit 继续作为 Electron Desktop/Runtime host，并保留 policy-neutral Runtime Kernel、persistent one-thread-per-todo、Platform Coordinator、restricted Workshop adapters、utilityProcess Runtime、trusted in-process ledger entrypoints、project-only skill provisioning、Feedback SDK WebContents 和现代/旧版 realtime 协议边界。真实 Chat 在 main process 使用独立 ChatCoordinator 和 kind=chat Store ownership，并复用 Codex Conversation 层；Chat 与 Automation owner 不共享活动 turn 或 lease。typed Chat IPC、共享 Conversation Surface、结构化 gap_rounds、Semantic Case Command materialization、Work-owned Task Projection/Sync、64-grapheme display_title 和有界 workspace-lane arbiter 的既有边界保持不变。Setup Readiness 增加由 main process 持有的 CodexSetupManager：它维护安装/认证状态、executable provenance、固定三平台 installer、固定登录命令、活动 Codex owner 更新门禁、stdin-only secret transport 和操作后 discovery/version/login-status 复核。preload 只暴露 snapshot/install/update/migrate/login/cancel/logout/recheck/subscribe 等 typed actions，Renderer 不能覆盖 executable、cwd、URL、timeout、environment、args 或 shell command。 trusted case-control 同时支持 create_case 与验证型 bind_closed_case；后者在 Project lock 内校验唯一 closed/resolved Case、updated_at 和 SHA-256，runner 以 authoritativeCaseId 门禁 terminal closeout。",
              "reason": "接受 Automation 已关闭 Case 可信复用、无绑定终态门禁和可恢复生命周期。",
              "evidence": [
                "runtime/arcorbit/test/runtime-case-control.test.mjs",
                "runtime/arcorbit/test/state-driven-runner.test.mjs",
                "runtime/arcorbit/test/automation-coordinator.test.mjs",
                "Verification: 124 focused Runtime tests passed, 2026-08-26",
                "arckit/spec/agentic-software-development/runtime-automation-workspace.md",
                "arckit/interaction/automation-workspace/interaction.md",
                "arckit/interaction/automation-workspace/runtime-recovery.html",
                "arckit/tech/arcorbit/desktop-execution-solution.md"
              ],
              "confidence": "high",
              "resume_condition": "当 manager process host、installer execution、IPC 枚举、active-owner guard 或 post-operation verification 改变时重审。 当 closed Case 覆盖判定、绑定收据字段、terminal 门禁或恢复动作变化时重审。"
            },
            "gap_refs": [
              "GAP-runtime-resilience-and-adapters"
            ],
            "reason": "本轮实现和验证已经使该稳定决策可恢复。",
            "evidence": [
              "runtime/arcorbit/test/runtime-case-control.test.mjs",
              "runtime/arcorbit/test/state-driven-runner.test.mjs",
              "runtime/arcorbit/test/automation-coordinator.test.mjs",
              "Verification: 124 focused Runtime tests passed, 2026-08-26",
              "arckit/spec/agentic-software-development/runtime-automation-workspace.md",
              "arckit/interaction/automation-workspace/interaction.md",
              "arckit/interaction/automation-workspace/runtime-recovery.html",
              "arckit/tech/arcorbit/desktop-execution-solution.md"
            ]
          },
          {
            "area_ref": "observability_and_operation",
            "observed_revision": 9,
            "set_decision": {
              "status": "settled",
              "statement": "Runtime persists lifecycle, activity, messages and timing outside the target project, supports restart reconciliation and exposes opaque Run refs. It separately projects ledger candidate catalogs, Agent selection traces, accepted round closeouts and post-commit fresh-read receipts, and also presents ordinary todo state separately from acceptance-feedback queue counts, item status, current Run/Case, progress, evidence and blocking responsibility alongside one active execution. Work Sync exposes per-project realtime health, resumable/legacy mode, modern cursor progress, local projection revision and latest refresh time; it reports reconnecting, degraded, compatible and recovered transitions. Work Sync owns 15-minute reconciliation, lifecycle-triggered current-state recovery and the visible immediate-sync action, has no 60-second disconnected fallback, and records that synchronization never releases a human gate. Automation only references the local task-state and minimal sync-health projections needed for execution recovery. Automation 投影 active_executions 集合、全局占用/上限及每条 lane 的 Run、Gate、恢复和同步摘要；重启逐 lane 对账，暂停、继续、取消和介入均以 execution_id 定向。 Runtime 以 case_binding_required 明确投影无绑定终态，以 completed_case_reuse receipt 投影成功复用，live 与 detached recovery 使用相同收据事实。",
              "reason": "接受 Automation 已关闭 Case 可信复用、无绑定终态门禁和可恢复生命周期。",
              "evidence": [
                "runtime/arcorbit/test/runtime-case-control.test.mjs",
                "runtime/arcorbit/test/state-driven-runner.test.mjs",
                "runtime/arcorbit/test/automation-coordinator.test.mjs",
                "Verification: 124 focused Runtime tests passed, 2026-08-26",
                "arckit/spec/agentic-software-development/runtime-automation-workspace.md",
                "arckit/interaction/automation-workspace/interaction.md",
                "arckit/interaction/automation-workspace/runtime-recovery.html",
                "arckit/tech/arcorbit/desktop-execution-solution.md"
              ],
              "confidence": "high",
              "resume_condition": "当 Work Sync 同步节奏、健康投影、恢复入口或 human Gate 隔离变化时重审。 当 Automation 并发 lane 的分区键、上限、隔离或恢复语义变化时也需重审。 当 closed Case 覆盖判定、绑定收据字段、terminal 门禁或恢复动作变化时重审。"
            },
            "gap_refs": [
              "GAP-runtime-resilience-and-adapters"
            ],
            "reason": "本轮实现和验证已经使该稳定决策可恢复。",
            "evidence": [
              "runtime/arcorbit/test/runtime-case-control.test.mjs",
              "runtime/arcorbit/test/state-driven-runner.test.mjs",
              "runtime/arcorbit/test/automation-coordinator.test.mjs",
              "Verification: 124 focused Runtime tests passed, 2026-08-26",
              "arckit/spec/agentic-software-development/runtime-automation-workspace.md",
              "arckit/interaction/automation-workspace/interaction.md",
              "arckit/interaction/automation-workspace/runtime-recovery.html",
              "arckit/tech/arcorbit/desktop-execution-solution.md"
            ]
          }
        ],
        "software_invariant_changes": [],
        "project_gap_changes": [],
        "selection_context_change": null,
        "evidence": [
          "runtime/arcorbit/test/runtime-case-control.test.mjs",
          "runtime/arcorbit/test/state-driven-runner.test.mjs",
          "runtime/arcorbit/test/automation-coordinator.test.mjs",
          "Verification: 124 focused Runtime tests passed, 2026-08-26",
          "arckit/spec/agentic-software-development/runtime-automation-workspace.md",
          "arckit/interaction/automation-workspace/interaction.md",
          "arckit/interaction/automation-workspace/runtime-recovery.html",
          "arckit/tech/arcorbit/desktop-execution-solution.md"
        ]
      },
      "invariant_assessment": {
        "project_revision": 257,
        "judgments": [
          {
            "invariant_ref": "product-expectations-remain-recoverable",
            "disposition": "upheld",
            "reason": "The implementation, durable contracts, and focused repeatable tests preserve this invariant for the selected gap.",
            "fact_refs": [],
            "evidence": [
              "runtime/arcorbit/test/runtime-case-control.test.mjs",
              "runtime/arcorbit/test/state-driven-runner.test.mjs",
              "runtime/arcorbit/test/automation-coordinator.test.mjs",
              "Verification: 124 focused Runtime tests passed, 2026-08-26",
              "arckit/spec/agentic-software-development/runtime-automation-workspace.md",
              "arckit/interaction/automation-workspace/interaction.md",
              "arckit/interaction/automation-workspace/runtime-recovery.html",
              "arckit/tech/arcorbit/desktop-execution-solution.md"
            ],
            "gap_refs": []
          },
          {
            "invariant_ref": "interaction-expectations-remain-recoverable",
            "disposition": "upheld",
            "reason": "The implementation, durable contracts, and focused repeatable tests preserve this invariant for the selected gap.",
            "fact_refs": [],
            "evidence": [
              "runtime/arcorbit/test/runtime-case-control.test.mjs",
              "runtime/arcorbit/test/state-driven-runner.test.mjs",
              "runtime/arcorbit/test/automation-coordinator.test.mjs",
              "Verification: 124 focused Runtime tests passed, 2026-08-26",
              "arckit/spec/agentic-software-development/runtime-automation-workspace.md",
              "arckit/interaction/automation-workspace/interaction.md",
              "arckit/interaction/automation-workspace/runtime-recovery.html",
              "arckit/tech/arcorbit/desktop-execution-solution.md"
            ],
            "gap_refs": []
          },
          {
            "invariant_ref": "visual-language-remains-consistent",
            "disposition": "not_relevant",
            "reason": "The recovery action labels and wireframe reuse the established visual language without introducing a new visual rule.",
            "fact_refs": [],
            "evidence": [],
            "gap_refs": []
          },
          {
            "invariant_ref": "technical-decisions-remain-explainable",
            "disposition": "upheld",
            "reason": "The implementation, durable contracts, and focused repeatable tests preserve this invariant for the selected gap.",
            "fact_refs": [],
            "evidence": [
              "runtime/arcorbit/test/runtime-case-control.test.mjs",
              "runtime/arcorbit/test/state-driven-runner.test.mjs",
              "runtime/arcorbit/test/automation-coordinator.test.mjs",
              "Verification: 124 focused Runtime tests passed, 2026-08-26",
              "arckit/spec/agentic-software-development/runtime-automation-workspace.md",
              "arckit/interaction/automation-workspace/interaction.md",
              "arckit/interaction/automation-workspace/runtime-recovery.html",
              "arckit/tech/arcorbit/desktop-execution-solution.md"
            ],
            "gap_refs": []
          },
          {
            "invariant_ref": "accepted-facts-are-realized",
            "disposition": "upheld",
            "reason": "The implementation, durable contracts, and focused repeatable tests preserve this invariant for the selected gap.",
            "fact_refs": [],
            "evidence": [
              "runtime/arcorbit/test/runtime-case-control.test.mjs",
              "runtime/arcorbit/test/state-driven-runner.test.mjs",
              "runtime/arcorbit/test/automation-coordinator.test.mjs",
              "Verification: 124 focused Runtime tests passed, 2026-08-26",
              "arckit/spec/agentic-software-development/runtime-automation-workspace.md",
              "arckit/interaction/automation-workspace/interaction.md",
              "arckit/interaction/automation-workspace/runtime-recovery.html",
              "arckit/tech/arcorbit/desktop-execution-solution.md"
            ],
            "gap_refs": []
          },
          {
            "invariant_ref": "material-risks-have-credible-evidence",
            "disposition": "upheld",
            "reason": "The implementation, durable contracts, and focused repeatable tests preserve this invariant for the selected gap.",
            "fact_refs": [],
            "evidence": [
              "runtime/arcorbit/test/runtime-case-control.test.mjs",
              "runtime/arcorbit/test/state-driven-runner.test.mjs",
              "runtime/arcorbit/test/automation-coordinator.test.mjs",
              "Verification: 124 focused Runtime tests passed, 2026-08-26",
              "arckit/spec/agentic-software-development/runtime-automation-workspace.md",
              "arckit/interaction/automation-workspace/interaction.md",
              "arckit/interaction/automation-workspace/runtime-recovery.html",
              "arckit/tech/arcorbit/desktop-execution-solution.md"
            ],
            "gap_refs": []
          }
        ]
      },
      "evidence": [
        "runtime/arcorbit/test/runtime-case-control.test.mjs",
        "runtime/arcorbit/test/state-driven-runner.test.mjs",
        "runtime/arcorbit/test/automation-coordinator.test.mjs",
        "Verification: 124 focused Runtime tests passed, 2026-08-26",
        "arckit/spec/agentic-software-development/runtime-automation-workspace.md",
        "arckit/interaction/automation-workspace/interaction.md",
        "arckit/interaction/automation-workspace/runtime-recovery.html",
        "arckit/tech/arcorbit/desktop-execution-solution.md"
      ],
      "runtime_result_ref": "runtime/arcorbit/test/.case-011-transition.mjs",
      "occurred_at": "2026-08-25T16:15:07.922Z"
    },
    {
      "round": 2,
      "transition_schema_version": "arckit-case-transition/v8",
      "goal": "Complete the five-dimension implementation review for authoritative closed Case reuse and unbound terminal gating.",
      "outcome": "completed",
      "gap_selection": {
        "mode": "candidate",
        "basis": "All ordinary Case gaps and impacts are resolved; the derived Completion Review is the sole ready candidate in this Case.",
        "snapshot_token": "2796054f1ad3f1e584b1e433559f2f29d04c29b4e1bec43b0e21e0abc9008273",
        "selected_ref": "case-gap:CASE-20260825-011:CASE-20260825-011:completion-review:1",
        "comparison_summary": "Compared the Completion Review with every in-scope persisted Project candidate; broader Project work remains deferred.",
        "fresh_discovery_summary": "The final diff review found and corrected legacy recovery-item normalization and single-byte-source validation; no unresolved in-scope issue remains.",
        "considered": [
          {
            "ref": "project-gap:GAP-agent-scenario-evaluation",
            "source": "persisted",
            "eligibility": "case_required",
            "disposition": "deferred",
            "priority_basis": {
              "blocking": "high",
              "uncertainty": "high",
              "risk": "high",
              "user_impact": "high"
            },
            "reason": "This Project candidate is outside the bounded current Case and requires a separate Case."
          },
          {
            "ref": "project-gap:GAP-runtime-resilience-and-adapters",
            "source": "persisted",
            "eligibility": "case_required",
            "disposition": "deferred",
            "priority_basis": {
              "blocking": "high",
              "uncertainty": "low",
              "risk": "high",
              "user_impact": "high",
              "urgency": "medium"
            },
            "reason": "This Project candidate is outside the bounded current Case and requires a separate Case."
          },
          {
            "ref": "project-gap:GAP-security-real-project-validation",
            "source": "persisted",
            "eligibility": "case_required",
            "disposition": "deferred",
            "priority_basis": {
              "blocking": "high",
              "uncertainty": "low",
              "risk": "high",
              "user_impact": "high",
              "urgency": "medium"
            },
            "reason": "This Project candidate is outside the bounded current Case and requires a separate Case."
          },
          {
            "ref": "project-gap:GAP-cross-record-audit",
            "source": "persisted",
            "eligibility": "case_required",
            "disposition": "deferred",
            "priority_basis": {
              "blocking": "high",
              "uncertainty": "low",
              "risk": "high",
              "user_impact": "high",
              "urgency": "high"
            },
            "reason": "This Project candidate is outside the bounded current Case and requires a separate Case."
          },
          {
            "ref": "case-gap:CASE-20260825-011:CASE-20260825-011:completion-review:1",
            "source": "persisted",
            "eligibility": "ready",
            "disposition": "selected",
            "priority_basis": {
              "blocking": "high",
              "uncertainty": "low",
              "risk": "high",
              "user_impact": "high"
            },
            "reason": "The implementation and its evidence are ready for the required five-dimension Completion Review."
          }
        ]
      },
      "selected_gap": {
        "id": "CASE-20260825-011:completion-review:1",
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
        "goal": "Complete the five-dimension implementation review for authoritative closed Case reuse and unbound terminal gating.",
        "expected_state_change": "Record a clean Completion Review and close the resolved Case."
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
            "runtime/arcorbit/test/runtime-case-control.test.mjs",
            "runtime/arcorbit/test/state-driven-runner.test.mjs",
            "runtime/arcorbit/test/automation-coordinator.test.mjs",
            "Verification: 125/125 focused Runtime tests passed, 2026-08-26",
            "Verification: syntax checks and git diff --check passed, 2026-08-26",
            "Full npm test audit: 423 passed, 11 skipped, and 3 unrelated pre-existing/parallel Setup Readiness or Electron SIGABRT failures, 2026-08-26",
            "arckit/spec/agentic-software-development/runtime-automation-workspace.md",
            "arckit/interaction/automation-workspace/interaction.md",
            "arckit/interaction/automation-workspace/runtime-recovery.html",
            "arckit/tech/arcorbit/desktop-execution-solution.md"
          ],
          "reviewed_content_revision": 1
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
        "project_revision": 258,
        "judgments": [
          {
            "invariant_ref": "product-expectations-remain-recoverable",
            "disposition": "upheld",
            "reason": "The reviewed implementation, durable contracts, fail-closed behavior, and repeatable focused tests preserve this invariant.",
            "fact_refs": [],
            "evidence": [
              "runtime/arcorbit/test/runtime-case-control.test.mjs",
              "runtime/arcorbit/test/state-driven-runner.test.mjs",
              "runtime/arcorbit/test/automation-coordinator.test.mjs",
              "Verification: 125/125 focused Runtime tests passed, 2026-08-26",
              "Verification: syntax checks and git diff --check passed, 2026-08-26",
              "Full npm test audit: 423 passed, 11 skipped, and 3 unrelated pre-existing/parallel Setup Readiness or Electron SIGABRT failures, 2026-08-26",
              "arckit/spec/agentic-software-development/runtime-automation-workspace.md",
              "arckit/interaction/automation-workspace/interaction.md",
              "arckit/interaction/automation-workspace/runtime-recovery.html",
              "arckit/tech/arcorbit/desktop-execution-solution.md"
            ],
            "gap_refs": []
          },
          {
            "invariant_ref": "interaction-expectations-remain-recoverable",
            "disposition": "upheld",
            "reason": "The reviewed implementation, durable contracts, fail-closed behavior, and repeatable focused tests preserve this invariant.",
            "fact_refs": [],
            "evidence": [
              "runtime/arcorbit/test/runtime-case-control.test.mjs",
              "runtime/arcorbit/test/state-driven-runner.test.mjs",
              "runtime/arcorbit/test/automation-coordinator.test.mjs",
              "Verification: 125/125 focused Runtime tests passed, 2026-08-26",
              "Verification: syntax checks and git diff --check passed, 2026-08-26",
              "Full npm test audit: 423 passed, 11 skipped, and 3 unrelated pre-existing/parallel Setup Readiness or Electron SIGABRT failures, 2026-08-26",
              "arckit/spec/agentic-software-development/runtime-automation-workspace.md",
              "arckit/interaction/automation-workspace/interaction.md",
              "arckit/interaction/automation-workspace/runtime-recovery.html",
              "arckit/tech/arcorbit/desktop-execution-solution.md"
            ],
            "gap_refs": []
          },
          {
            "invariant_ref": "visual-language-remains-consistent",
            "disposition": "not_relevant",
            "reason": "The recovery labels and wireframe reuse the established visual language and introduce no new visual rule.",
            "fact_refs": [],
            "evidence": [],
            "gap_refs": []
          },
          {
            "invariant_ref": "technical-decisions-remain-explainable",
            "disposition": "upheld",
            "reason": "The reviewed implementation, durable contracts, fail-closed behavior, and repeatable focused tests preserve this invariant.",
            "fact_refs": [],
            "evidence": [
              "runtime/arcorbit/test/runtime-case-control.test.mjs",
              "runtime/arcorbit/test/state-driven-runner.test.mjs",
              "runtime/arcorbit/test/automation-coordinator.test.mjs",
              "Verification: 125/125 focused Runtime tests passed, 2026-08-26",
              "Verification: syntax checks and git diff --check passed, 2026-08-26",
              "Full npm test audit: 423 passed, 11 skipped, and 3 unrelated pre-existing/parallel Setup Readiness or Electron SIGABRT failures, 2026-08-26",
              "arckit/spec/agentic-software-development/runtime-automation-workspace.md",
              "arckit/interaction/automation-workspace/interaction.md",
              "arckit/interaction/automation-workspace/runtime-recovery.html",
              "arckit/tech/arcorbit/desktop-execution-solution.md"
            ],
            "gap_refs": []
          },
          {
            "invariant_ref": "accepted-facts-are-realized",
            "disposition": "upheld",
            "reason": "The reviewed implementation, durable contracts, fail-closed behavior, and repeatable focused tests preserve this invariant.",
            "fact_refs": [],
            "evidence": [
              "runtime/arcorbit/test/runtime-case-control.test.mjs",
              "runtime/arcorbit/test/state-driven-runner.test.mjs",
              "runtime/arcorbit/test/automation-coordinator.test.mjs",
              "Verification: 125/125 focused Runtime tests passed, 2026-08-26",
              "Verification: syntax checks and git diff --check passed, 2026-08-26",
              "Full npm test audit: 423 passed, 11 skipped, and 3 unrelated pre-existing/parallel Setup Readiness or Electron SIGABRT failures, 2026-08-26",
              "arckit/spec/agentic-software-development/runtime-automation-workspace.md",
              "arckit/interaction/automation-workspace/interaction.md",
              "arckit/interaction/automation-workspace/runtime-recovery.html",
              "arckit/tech/arcorbit/desktop-execution-solution.md"
            ],
            "gap_refs": []
          },
          {
            "invariant_ref": "material-risks-have-credible-evidence",
            "disposition": "upheld",
            "reason": "The reviewed implementation, durable contracts, fail-closed behavior, and repeatable focused tests preserve this invariant.",
            "fact_refs": [],
            "evidence": [
              "runtime/arcorbit/test/runtime-case-control.test.mjs",
              "runtime/arcorbit/test/state-driven-runner.test.mjs",
              "runtime/arcorbit/test/automation-coordinator.test.mjs",
              "Verification: 125/125 focused Runtime tests passed, 2026-08-26",
              "Verification: syntax checks and git diff --check passed, 2026-08-26",
              "Full npm test audit: 423 passed, 11 skipped, and 3 unrelated pre-existing/parallel Setup Readiness or Electron SIGABRT failures, 2026-08-26",
              "arckit/spec/agentic-software-development/runtime-automation-workspace.md",
              "arckit/interaction/automation-workspace/interaction.md",
              "arckit/interaction/automation-workspace/runtime-recovery.html",
              "arckit/tech/arcorbit/desktop-execution-solution.md"
            ],
            "gap_refs": []
          }
        ]
      },
      "evidence": [
        "runtime/arcorbit/test/runtime-case-control.test.mjs",
        "runtime/arcorbit/test/state-driven-runner.test.mjs",
        "runtime/arcorbit/test/automation-coordinator.test.mjs",
        "Verification: 125/125 focused Runtime tests passed, 2026-08-26",
        "Verification: syntax checks and git diff --check passed, 2026-08-26",
        "Full npm test audit: 423 passed, 11 skipped, and 3 unrelated pre-existing/parallel Setup Readiness or Electron SIGABRT failures, 2026-08-26",
        "arckit/spec/agentic-software-development/runtime-automation-workspace.md",
        "arckit/interaction/automation-workspace/interaction.md",
        "arckit/interaction/automation-workspace/runtime-recovery.html",
        "arckit/tech/arcorbit/desktop-execution-solution.md"
      ],
      "runtime_result_ref": "runtime/arcorbit/test/.case-011-completion-review.mjs",
      "occurred_at": "2026-08-25T16:21:38.350Z"
    }
  ],
  "case_resolution": {
    "status": "resolved",
    "stage": "resolved",
    "satisfied": [
      "GAP-AUTHORITATIVE-CLOSED-CASE-REUSE"
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
    "updated_at": "2026-08-25T16:21:38.350Z"
  }
}
```

## Round Notes

- Case history is canonical in Structured Record.rounds; keep prose notes exceptional.
