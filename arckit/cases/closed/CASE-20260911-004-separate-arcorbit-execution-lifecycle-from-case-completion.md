# Separate ArcOrbit execution lifecycle from Case completion

Case: CASE-20260911-004
Status: closed
Artifact Type: mixed
Selected Gap: none
Updated: 2026-09-11T10:39:49.658Z

## User Intent

在保留一轮一个 Gap 的 State Driven Loop 前提下，统一 Runtime 执行结果所有权，精简重复 prompt 和错误状态推导。

## Structured Record

```json
{
  "schema_version": "development-case-record/v5",
  "id": "CASE-20260911-004",
  "title": "Separate ArcOrbit execution lifecycle from Case completion",
  "status": "closed",
  "artifact_type": "mixed",
  "created_at": "2026-09-11T10:23:28.194Z",
  "updated_at": "2026-09-11T10:39:49.658Z",
  "user_intent": "在保留一轮一个 Gap 的 State Driven Loop 前提下，统一 Runtime 执行结果所有权，精简重复 prompt 和错误状态推导。",
  "expected_outcome": "停止、人工决定、外部等待、技术故障和可信 Case 完成具有一致的跨层语义，恢复保留绑定，回归测试覆盖运行和重启。",
  "project_state_ref": "arckit/project/state.record.json",
  "current_round": {
    "goal": "",
    "selected_gap": null
  },
  "facts": [
    {
      "id": "FACT-20260911-004-001",
      "revision": 1,
      "status": "accepted",
      "statement": "用户确认保留一轮一个 Gap、可信写回与 fresh-read；运行记录显示 Agent 停止被转换为缺少绑定及人工恢复，恢复入口遗漏已有 Case 绑定，prompt 重复 skill 流程。",
      "basis": "用户授权、RUN-20260911-094827203Z-9de08d28 与源码核对",
      "evidence": [
        "runtime/arcorbit/src/state-driven-runner.mjs",
        "runtime/arcorbit/src/automation-coordinator.mjs",
        "runtime/arcorbit/src/agent-orchestrator.mjs"
      ]
    },
    {
      "id": "FACT-20260911-004-002",
      "revision": 1,
      "status": "accepted",
      "statement": "执行停止独立于 Case 完成；外部等待和技术故障不再自动推导为人工决定；可信绑定与原任务贯穿恢复，停止存档避免重启重领；单 Gap Loop 保持。",
      "basis": "代码、定向状态转换测试与文档核对",
      "evidence": [
        "arckit/cases/evidence/CASE-20260911-004/execution-lifecycle.md"
      ]
    },
    {
      "id": "FACT-20260911-004-003",
      "revision": 1,
      "status": "accepted",
      "statement": "移除 Automation 对写回的重复解释；实时与重启恢复采用统一 executionOutcome，缺少 activity 尾部时可信 result 收据仍被接受，错误责任保留。",
      "basis": "代码、定向状态转换测试与文档核对",
      "evidence": [
        "arckit/cases/evidence/CASE-20260911-004/execution-lifecycle.md"
      ]
    }
  ],
  "state_impacts": [],
  "gaps": [
    {
      "id": "GAP-20260911-004-001",
      "status": "resolved",
      "goal": "实现并验证执行生命周期和 Case 完成分离的一致契约，覆盖 Runtime、Automation、prompt 和 skill。",
      "reason": "当前跨层重复推导改变 Agent 的停止与责任判断。",
      "derived_from": [
        "FACT-20260911-004-001"
      ],
      "blocked_by": [],
      "priority_basis": {
        "blocking": "high",
        "risk": "high"
      },
      "responsibility": "agent",
      "evidence_required": [
        "真实状态转换回归测试",
        "绑定恢复、停止与外部等待测试",
        "skill 和 prompt 契约一致性"
      ],
      "resolution": {
        "id": "GAP-20260911-004-001",
        "status": "resolved",
        "outcome": "执行生命周期边界已实现并通过定向回归。",
        "reason": "源代码、skill、prompt、文档与重启持久化路径统一。",
        "evidence": [
          "arckit/cases/evidence/CASE-20260911-004/execution-lifecycle.md"
        ],
        "occurred_at": "2026-09-11T10:35:41.801Z"
      }
    },
    {
      "id": "CASE-20260911-004:review-finding:RF-20260911-004-001",
      "status": "resolved",
      "goal": "Resolve review finding: Live and detached Automation still duplicate required-ledger-write interpretation outside executionOutcome; partial activity can disagree with complete result receipts. Centralize this decision and preserve failure responsibility.",
      "reason": "excess found by completion review",
      "derived_from": [
        "completion_review",
        "content_revision:1"
      ],
      "blocked_by": [],
      "priority_basis": {
        "blocking": "high",
        "risk": "high"
      },
      "responsibility": "agent",
      "evidence_required": [
        "runtime/arcorbit/src/automation-coordinator.mjs",
        "arckit/cases/evidence/CASE-20260911-004/execution-lifecycle.md"
      ],
      "resolution": {
        "id": "CASE-20260911-004:review-finding:RF-20260911-004-001",
        "status": "resolved",
        "outcome": "执行生命周期边界已实现并通过定向回归。",
        "reason": "源代码、skill、prompt、文档与重启持久化路径统一。",
        "evidence": [
          "arckit/cases/evidence/CASE-20260911-004/execution-lifecycle.md"
        ],
        "occurred_at": "2026-09-11T10:39:32.848Z"
      }
    }
  ],
  "content_revision": 2,
  "completion_review": {
    "status": "clean",
    "policy": {
      "initial_max_cycles": 3,
      "source": "agent bounded completion review",
      "snapshotted_at": "2026-09-11T10:23:28.194Z"
    },
    "additional_cycles_authorized": 0,
    "cycle_count": 2,
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
        "outcome": "findings",
        "content_revision": 1,
        "dimensions": {
          "implementation_correctness": "findings",
          "problem_resolution": "clean",
          "verification_credibility": "clean",
          "regression_risk": "findings",
          "minimality": "clean"
        },
        "finding_ids": [
          "RF-20260911-004-001"
        ],
        "evidence": [
          "arckit/cases/evidence/CASE-20260911-004/execution-lifecycle.md"
        ],
        "occurred_at": "2026-09-11T10:37:17.898Z"
      },
      {
        "cycle": 2,
        "autonomous_cycle": 2,
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
          "arckit/cases/evidence/CASE-20260911-004/execution-lifecycle.md"
        ],
        "occurred_at": "2026-09-11T10:39:49.658Z"
      }
    ],
    "evidence": [
      "arckit/cases/evidence/CASE-20260911-004/execution-lifecycle.md"
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
      "goal": "实现并验证执行生命周期和 Case 完成分离的一致契约，覆盖 Runtime、Automation、prompt 和 skill。",
      "outcome": "completed",
      "gap_selection": {
        "mode": "candidate",
        "basis": "当前用户授权的执行生命周期架构优化优先；其他 Case 保持独立责任。",
        "snapshot_token": "5fb3aaa1f4d93a5b82434127f128315469fbb6bfab964b45e9705797ed21e65d",
        "selected_ref": "case-gap:CASE-20260911-004:GAP-20260911-004-001",
        "comparison_summary": "选中当前 Case 的实现或完成检查候选，其他产品与外部授权候选不属于本项。",
        "fresh_discovery_summary": "未发现需要新增的实现义务；GUI 与真实 Agent 验证范围明确披露。",
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
            "reason": "独立事项保持既有责任"
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
            "reason": "独立事项保持既有责任"
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
            "reason": "独立事项保持既有责任"
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
            "reason": "独立事项保持既有责任"
          },
          {
            "ref": "case-gap:CASE-20260901-001:GAP-20260901-001-005",
            "source": "persisted",
            "eligibility": "ready",
            "disposition": "deferred",
            "priority_basis": {
              "blocking": "",
              "uncertainty": "",
              "risk": "high",
              "user_impact": "",
              "dependency": "blocks public push and source repository archival"
            },
            "reason": "独立事项保持既有责任"
          },
          {
            "ref": "case-gap:CASE-20260909-002:GAP-20260909-002-004",
            "source": "persisted",
            "eligibility": "ready",
            "disposition": "deferred",
            "priority_basis": {
              "blocking": "declined repackage request",
              "uncertainty": "",
              "risk": "",
              "user_impact": "final packaged acceptance"
            },
            "reason": "独立事项保持既有责任"
          },
          {
            "ref": "case-gap:CASE-20260911-003:CASE-20260911-003:completion-review:1",
            "source": "persisted",
            "eligibility": "ready",
            "disposition": "deferred",
            "priority_basis": {
              "blocking": "high",
              "uncertainty": "low",
              "risk": "high",
              "user_impact": "high"
            },
            "reason": "独立事项保持既有责任"
          },
          {
            "ref": "case-gap:CASE-20260911-004:GAP-20260911-004-001",
            "source": "persisted",
            "eligibility": "ready",
            "disposition": "selected",
            "priority_basis": {
              "blocking": "high",
              "uncertainty": "",
              "risk": "high",
              "user_impact": ""
            },
            "reason": "当前授权事项"
          }
        ]
      },
      "selected_gap": {
        "id": "GAP-20260911-004-001",
        "responsibility": "agent",
        "goal": "实现并验证执行生命周期和 Case 完成分离的一致契约，覆盖 Runtime、Automation、prompt 和 skill。",
        "reason": "当前跨层重复推导改变 Agent 的停止与责任判断。",
        "derived_from": [
          "FACT-20260911-004-001"
        ],
        "blocked_by": [],
        "priority_basis": {
          "blocking": "high",
          "uncertainty": "",
          "risk": "high",
          "user_impact": ""
        },
        "evidence_required": [
          "真实状态转换回归测试",
          "绑定恢复、停止与外部等待测试",
          "skill 和 prompt 契约一致性"
        ]
      },
      "planned_transition": {
        "goal": "实现并验证执行生命周期和 Case 完成分离的一致契约，覆盖 Runtime、Automation、prompt 和 skill。",
        "expected_state_change": "执行边界得到验证并保存可信结果。"
      },
      "accepted_state_delta": {
        "facts_added": [
          {
            "id": "FACT-20260911-004-002",
            "revision": 1,
            "status": "accepted",
            "statement": "执行停止独立于 Case 完成；外部等待和技术故障不再自动推导为人工决定；可信绑定与原任务贯穿恢复，停止存档避免重启重领；单 Gap Loop 保持。",
            "basis": "代码、定向状态转换测试与文档核对",
            "evidence": [
              "arckit/cases/evidence/CASE-20260911-004/execution-lifecycle.md"
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
        "resolved_review_findings": [],
        "resolved_gap": {
          "id": "GAP-20260911-004-001",
          "status": "resolved",
          "outcome": "执行生命周期边界已实现并通过定向回归。",
          "reason": "源代码、skill、prompt、文档与重启持久化路径统一。",
          "evidence": [
            "arckit/cases/evidence/CASE-20260911-004/execution-lifecycle.md"
          ]
        },
        "completion_review_result": null,
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
        "project_revision": 372,
        "judgments": [
          {
            "invariant_ref": "product-expectations-remain-recoverable",
            "disposition": "upheld",
            "reason": "执行停止与任务完成的产品边界已同步到功能规格。",
            "fact_refs": [
              "FACT-20260911-004-001"
            ],
            "gap_refs": [],
            "evidence": [
              "arckit/cases/evidence/CASE-20260911-004/execution-lifecycle.md"
            ]
          },
          {
            "invariant_ref": "interaction-expectations-remain-recoverable",
            "disposition": "upheld",
            "reason": "停止、外部等待和人工责任的交互源与线框已同步。",
            "fact_refs": [
              "FACT-20260911-004-001"
            ],
            "gap_refs": [],
            "evidence": [
              "arckit/cases/evidence/CASE-20260911-004/execution-lifecycle.md"
            ]
          },
          {
            "invariant_ref": "visual-language-remains-consistent",
            "disposition": "not_relevant",
            "reason": "本事项不改变视觉语言、主题或组件样式。",
            "fact_refs": [
              "FACT-20260911-004-001"
            ],
            "gap_refs": [],
            "evidence": []
          },
          {
            "invariant_ref": "technical-decisions-remain-explainable",
            "disposition": "upheld",
            "reason": "执行结果解释入口、绑定来源和持久化契约已同步技术方案。",
            "fact_refs": [
              "FACT-20260911-004-001"
            ],
            "gap_refs": [],
            "evidence": [
              "arckit/cases/evidence/CASE-20260911-004/execution-lifecycle.md"
            ]
          },
          {
            "invariant_ref": "accepted-facts-are-realized",
            "disposition": "upheld",
            "reason": "状态转换和重启测试证明停止保留 Case，既有单 Gap 写回和 fresh-read 仍有效。",
            "fact_refs": [
              "FACT-20260911-004-001"
            ],
            "gap_refs": [],
            "evidence": [
              "arckit/cases/evidence/CASE-20260911-004/execution-lifecycle.md"
            ]
          },
          {
            "invariant_ref": "material-risks-have-credible-evidence",
            "disposition": "upheld",
            "reason": "定向回归、完整检查结果和未验证 GUI 边界均有明确记录。",
            "fact_refs": [
              "FACT-20260911-004-001"
            ],
            "gap_refs": [],
            "evidence": [
              "arckit/cases/evidence/CASE-20260911-004/execution-lifecycle.md"
            ]
          }
        ]
      },
      "evidence": [
        "arckit/cases/evidence/CASE-20260911-004/execution-lifecycle.md"
      ],
      "runtime_result_ref": "",
      "occurred_at": "2026-09-11T10:35:41.801Z"
    },
    {
      "round": 2,
      "transition_schema_version": "arckit-case-transition/v8",
      "goal": "Review the completed implementation for correctness, real problem resolution, verification credibility, regression risk, and minimality.",
      "outcome": "completed",
      "gap_selection": {
        "mode": "candidate",
        "basis": "当前用户授权的执行生命周期架构优化优先；其他 Case 保持独立责任。",
        "snapshot_token": "c6888a44ff34472013d598556ae8e98d607905acf46f1bb2b6f428ba8df4b9ac",
        "selected_ref": "case-gap:CASE-20260911-004:CASE-20260911-004:completion-review:1",
        "comparison_summary": "选中当前 Case 的实现或完成检查候选，其他产品与外部授权候选不属于本项。",
        "fresh_discovery_summary": "未发现需要新增的实现义务；GUI 与真实 Agent 验证范围明确披露。",
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
            "reason": "独立事项保持既有责任"
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
            "reason": "独立事项保持既有责任"
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
            "reason": "独立事项保持既有责任"
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
            "reason": "独立事项保持既有责任"
          },
          {
            "ref": "case-gap:CASE-20260901-001:GAP-20260901-001-005",
            "source": "persisted",
            "eligibility": "ready",
            "disposition": "deferred",
            "priority_basis": {
              "blocking": "",
              "uncertainty": "",
              "risk": "high",
              "user_impact": "",
              "dependency": "blocks public push and source repository archival"
            },
            "reason": "独立事项保持既有责任"
          },
          {
            "ref": "case-gap:CASE-20260909-002:GAP-20260909-002-004",
            "source": "persisted",
            "eligibility": "ready",
            "disposition": "deferred",
            "priority_basis": {
              "blocking": "declined repackage request",
              "uncertainty": "",
              "risk": "",
              "user_impact": "final packaged acceptance"
            },
            "reason": "独立事项保持既有责任"
          },
          {
            "ref": "case-gap:CASE-20260911-003:CASE-20260911-003:completion-review:1",
            "source": "persisted",
            "eligibility": "ready",
            "disposition": "deferred",
            "priority_basis": {
              "blocking": "high",
              "uncertainty": "low",
              "risk": "high",
              "user_impact": "high"
            },
            "reason": "独立事项保持既有责任"
          },
          {
            "ref": "case-gap:CASE-20260911-004:CASE-20260911-004:completion-review:1",
            "source": "persisted",
            "eligibility": "ready",
            "disposition": "selected",
            "priority_basis": {
              "blocking": "high",
              "uncertainty": "low",
              "risk": "high",
              "user_impact": "high"
            },
            "reason": "当前授权事项"
          }
        ]
      },
      "selected_gap": {
        "id": "CASE-20260911-004:completion-review:1",
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
        "goal": "Review the completed implementation for correctness, real problem resolution, verification credibility, regression risk, and minimality.",
        "expected_state_change": "执行边界得到验证并保存可信结果。"
      },
      "accepted_state_delta": {
        "facts_added": [],
        "facts_superseded": [],
        "impacts_added": [],
        "impacts_updated": [],
        "gaps_added": [],
        "gaps_cancelled": [],
        "resolved_open_questions": [],
        "completed_handoffs": [],
        "resolved_review_findings": [],
        "resolved_gap": null,
        "completion_review_result": {
          "reviewer": "agent",
          "reviewed_content_revision": 1,
          "outcome": "findings",
          "dimensions": {
            "implementation_correctness": "findings",
            "problem_resolution": "clean",
            "verification_credibility": "clean",
            "regression_risk": "findings",
            "minimality": "clean"
          },
          "findings": [
            {
              "id": "RF-20260911-004-001",
              "kind": "excess",
              "statement": "Live and detached Automation still duplicate required-ledger-write interpretation outside executionOutcome; partial activity can disagree with complete result receipts. Centralize this decision and preserve failure responsibility.",
              "responsibility": "agent",
              "artifact_refs": [
                "runtime/arcorbit/src/automation-coordinator.mjs"
              ],
              "evidence": [
                "arckit/cases/evidence/CASE-20260911-004/execution-lifecycle.md"
              ]
            }
          ],
          "evidence": [
            "arckit/cases/evidence/CASE-20260911-004/execution-lifecycle.md"
          ]
        },
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
        "project_revision": 372,
        "judgments": [
          {
            "invariant_ref": "product-expectations-remain-recoverable",
            "disposition": "upheld",
            "reason": "执行停止与任务完成的产品边界已同步到功能规格。",
            "fact_refs": [
              "FACT-20260911-004-001"
            ],
            "gap_refs": [],
            "evidence": [
              "arckit/cases/evidence/CASE-20260911-004/execution-lifecycle.md"
            ]
          },
          {
            "invariant_ref": "interaction-expectations-remain-recoverable",
            "disposition": "upheld",
            "reason": "停止、外部等待和人工责任的交互源与线框已同步。",
            "fact_refs": [
              "FACT-20260911-004-001"
            ],
            "gap_refs": [],
            "evidence": [
              "arckit/cases/evidence/CASE-20260911-004/execution-lifecycle.md"
            ]
          },
          {
            "invariant_ref": "visual-language-remains-consistent",
            "disposition": "not_relevant",
            "reason": "本事项不改变视觉语言、主题或组件样式。",
            "fact_refs": [
              "FACT-20260911-004-001"
            ],
            "gap_refs": [],
            "evidence": []
          },
          {
            "invariant_ref": "technical-decisions-remain-explainable",
            "disposition": "upheld",
            "reason": "执行结果解释入口、绑定来源和持久化契约已同步技术方案。",
            "fact_refs": [
              "FACT-20260911-004-001"
            ],
            "gap_refs": [],
            "evidence": [
              "arckit/cases/evidence/CASE-20260911-004/execution-lifecycle.md"
            ]
          },
          {
            "invariant_ref": "accepted-facts-are-realized",
            "disposition": "threatened",
            "reason": "重复写回判断可能造成实时与恢复结果不一致。",
            "fact_refs": [
              "FACT-20260911-004-001"
            ],
            "gap_refs": [
              "CASE-20260911-004:review-finding:RF-20260911-004-001"
            ],
            "evidence": [
              "arckit/cases/evidence/CASE-20260911-004/execution-lifecycle.md"
            ]
          },
          {
            "invariant_ref": "material-risks-have-credible-evidence",
            "disposition": "threatened",
            "reason": "重复写回判断可能造成实时与恢复结果不一致。",
            "fact_refs": [
              "FACT-20260911-004-001"
            ],
            "gap_refs": [
              "CASE-20260911-004:review-finding:RF-20260911-004-001"
            ],
            "evidence": [
              "arckit/cases/evidence/CASE-20260911-004/execution-lifecycle.md"
            ]
          }
        ]
      },
      "evidence": [
        "arckit/cases/evidence/CASE-20260911-004/execution-lifecycle.md"
      ],
      "runtime_result_ref": "",
      "occurred_at": "2026-09-11T10:37:17.898Z"
    },
    {
      "round": 3,
      "transition_schema_version": "arckit-case-transition/v8",
      "goal": "Resolve review finding: Live and detached Automation still duplicate required-ledger-write interpretation outside executionOutcome; partial activity can disagree with complete result receipts. Centralize this decision and preserve failure responsibility.",
      "outcome": "completed",
      "gap_selection": {
        "mode": "candidate",
        "basis": "当前用户授权的执行生命周期架构优化优先；其他 Case 保持独立责任。",
        "snapshot_token": "3b85fa69ad817ea458c9f64187e783bb69886cd5b9afb595f763640aa8d5f820",
        "selected_ref": "case-gap:CASE-20260911-004:CASE-20260911-004:review-finding:RF-20260911-004-001",
        "comparison_summary": "选中当前 Case 的实现或完成检查候选，其他产品与外部授权候选不属于本项。",
        "fresh_discovery_summary": "未发现需要新增的实现义务；GUI 与真实 Agent 验证范围明确披露。",
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
            "reason": "独立事项保持既有责任"
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
            "reason": "独立事项保持既有责任"
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
            "reason": "独立事项保持既有责任"
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
            "reason": "独立事项保持既有责任"
          },
          {
            "ref": "case-gap:CASE-20260901-001:GAP-20260901-001-005",
            "source": "persisted",
            "eligibility": "ready",
            "disposition": "deferred",
            "priority_basis": {
              "blocking": "",
              "uncertainty": "",
              "risk": "high",
              "user_impact": "",
              "dependency": "blocks public push and source repository archival"
            },
            "reason": "独立事项保持既有责任"
          },
          {
            "ref": "case-gap:CASE-20260909-002:GAP-20260909-002-004",
            "source": "persisted",
            "eligibility": "ready",
            "disposition": "deferred",
            "priority_basis": {
              "blocking": "declined repackage request",
              "uncertainty": "",
              "risk": "",
              "user_impact": "final packaged acceptance"
            },
            "reason": "独立事项保持既有责任"
          },
          {
            "ref": "case-gap:CASE-20260911-003:CASE-20260911-003:completion-review:1",
            "source": "persisted",
            "eligibility": "ready",
            "disposition": "deferred",
            "priority_basis": {
              "blocking": "high",
              "uncertainty": "low",
              "risk": "high",
              "user_impact": "high"
            },
            "reason": "独立事项保持既有责任"
          },
          {
            "ref": "case-gap:CASE-20260911-004:CASE-20260911-004:review-finding:RF-20260911-004-001",
            "source": "persisted",
            "eligibility": "ready",
            "disposition": "selected",
            "priority_basis": {
              "blocking": "high",
              "uncertainty": "",
              "risk": "high",
              "user_impact": ""
            },
            "reason": "当前授权事项"
          }
        ]
      },
      "selected_gap": {
        "id": "CASE-20260911-004:review-finding:RF-20260911-004-001",
        "responsibility": "agent",
        "goal": "Resolve review finding: Live and detached Automation still duplicate required-ledger-write interpretation outside executionOutcome; partial activity can disagree with complete result receipts. Centralize this decision and preserve failure responsibility.",
        "reason": "excess found by completion review",
        "derived_from": [
          "completion_review",
          "content_revision:1"
        ],
        "blocked_by": [],
        "priority_basis": {
          "blocking": "high",
          "uncertainty": "",
          "risk": "high",
          "user_impact": ""
        },
        "evidence_required": [
          "runtime/arcorbit/src/automation-coordinator.mjs",
          "arckit/cases/evidence/CASE-20260911-004/execution-lifecycle.md"
        ]
      },
      "planned_transition": {
        "goal": "Resolve review finding: Live and detached Automation still duplicate required-ledger-write interpretation outside executionOutcome; partial activity can disagree with complete result receipts. Centralize this decision and preserve failure responsibility.",
        "expected_state_change": "执行边界得到验证并保存可信结果。"
      },
      "accepted_state_delta": {
        "facts_added": [
          {
            "id": "FACT-20260911-004-003",
            "revision": 1,
            "status": "accepted",
            "statement": "移除 Automation 对写回的重复解释；实时与重启恢复采用统一 executionOutcome，缺少 activity 尾部时可信 result 收据仍被接受，错误责任保留。",
            "basis": "代码、定向状态转换测试与文档核对",
            "evidence": [
              "arckit/cases/evidence/CASE-20260911-004/execution-lifecycle.md"
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
        "resolved_review_findings": [],
        "resolved_gap": {
          "id": "CASE-20260911-004:review-finding:RF-20260911-004-001",
          "status": "resolved",
          "outcome": "执行生命周期边界已实现并通过定向回归。",
          "reason": "源代码、skill、prompt、文档与重启持久化路径统一。",
          "evidence": [
            "arckit/cases/evidence/CASE-20260911-004/execution-lifecycle.md"
          ]
        },
        "completion_review_result": null,
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
        "project_revision": 372,
        "judgments": [
          {
            "invariant_ref": "product-expectations-remain-recoverable",
            "disposition": "upheld",
            "reason": "执行停止与任务完成的产品边界已同步到功能规格。",
            "fact_refs": [
              "FACT-20260911-004-001"
            ],
            "gap_refs": [],
            "evidence": [
              "arckit/cases/evidence/CASE-20260911-004/execution-lifecycle.md"
            ]
          },
          {
            "invariant_ref": "interaction-expectations-remain-recoverable",
            "disposition": "upheld",
            "reason": "停止、外部等待和人工责任的交互源与线框已同步。",
            "fact_refs": [
              "FACT-20260911-004-001"
            ],
            "gap_refs": [],
            "evidence": [
              "arckit/cases/evidence/CASE-20260911-004/execution-lifecycle.md"
            ]
          },
          {
            "invariant_ref": "visual-language-remains-consistent",
            "disposition": "not_relevant",
            "reason": "本事项不改变视觉语言、主题或组件样式。",
            "fact_refs": [
              "FACT-20260911-004-001"
            ],
            "gap_refs": [],
            "evidence": []
          },
          {
            "invariant_ref": "technical-decisions-remain-explainable",
            "disposition": "upheld",
            "reason": "执行结果解释入口、绑定来源和持久化契约已同步技术方案。",
            "fact_refs": [
              "FACT-20260911-004-001"
            ],
            "gap_refs": [],
            "evidence": [
              "arckit/cases/evidence/CASE-20260911-004/execution-lifecycle.md"
            ]
          },
          {
            "invariant_ref": "accepted-facts-are-realized",
            "disposition": "upheld",
            "reason": "状态转换和重启测试证明停止保留 Case，既有单 Gap 写回和 fresh-read 仍有效。",
            "fact_refs": [
              "FACT-20260911-004-001"
            ],
            "gap_refs": [],
            "evidence": [
              "arckit/cases/evidence/CASE-20260911-004/execution-lifecycle.md"
            ]
          },
          {
            "invariant_ref": "material-risks-have-credible-evidence",
            "disposition": "upheld",
            "reason": "定向回归、完整检查结果和未验证 GUI 边界均有明确记录。",
            "fact_refs": [
              "FACT-20260911-004-001"
            ],
            "gap_refs": [],
            "evidence": [
              "arckit/cases/evidence/CASE-20260911-004/execution-lifecycle.md"
            ]
          }
        ]
      },
      "evidence": [
        "arckit/cases/evidence/CASE-20260911-004/execution-lifecycle.md"
      ],
      "runtime_result_ref": "",
      "occurred_at": "2026-09-11T10:39:32.848Z"
    },
    {
      "round": 4,
      "transition_schema_version": "arckit-case-transition/v8",
      "goal": "Review the completed implementation for correctness, real problem resolution, verification credibility, regression risk, and minimality.",
      "outcome": "completed",
      "gap_selection": {
        "mode": "candidate",
        "basis": "当前用户授权的执行生命周期架构优化优先；其他 Case 保持独立责任。",
        "snapshot_token": "873886ab962a843bf4cc3e635a8e946b271daba02cd93f60ba6f1e5f437e140b",
        "selected_ref": "case-gap:CASE-20260911-004:CASE-20260911-004:completion-review:2",
        "comparison_summary": "选中当前 Case 的实现或完成检查候选，其他产品与外部授权候选不属于本项。",
        "fresh_discovery_summary": "未发现需要新增的实现义务；GUI 与真实 Agent 验证范围明确披露。",
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
            "reason": "独立事项保持既有责任"
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
            "reason": "独立事项保持既有责任"
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
            "reason": "独立事项保持既有责任"
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
            "reason": "独立事项保持既有责任"
          },
          {
            "ref": "case-gap:CASE-20260901-001:GAP-20260901-001-005",
            "source": "persisted",
            "eligibility": "ready",
            "disposition": "deferred",
            "priority_basis": {
              "blocking": "",
              "uncertainty": "",
              "risk": "high",
              "user_impact": "",
              "dependency": "blocks public push and source repository archival"
            },
            "reason": "独立事项保持既有责任"
          },
          {
            "ref": "case-gap:CASE-20260909-002:GAP-20260909-002-004",
            "source": "persisted",
            "eligibility": "ready",
            "disposition": "deferred",
            "priority_basis": {
              "blocking": "declined repackage request",
              "uncertainty": "",
              "risk": "",
              "user_impact": "final packaged acceptance"
            },
            "reason": "独立事项保持既有责任"
          },
          {
            "ref": "case-gap:CASE-20260911-003:CASE-20260911-003:completion-review:1",
            "source": "persisted",
            "eligibility": "ready",
            "disposition": "deferred",
            "priority_basis": {
              "blocking": "high",
              "uncertainty": "low",
              "risk": "high",
              "user_impact": "high"
            },
            "reason": "独立事项保持既有责任"
          },
          {
            "ref": "case-gap:CASE-20260911-004:CASE-20260911-004:completion-review:2",
            "source": "persisted",
            "eligibility": "ready",
            "disposition": "selected",
            "priority_basis": {
              "blocking": "high",
              "uncertainty": "low",
              "risk": "high",
              "user_impact": "high"
            },
            "reason": "当前授权事项"
          }
        ]
      },
      "selected_gap": {
        "id": "CASE-20260911-004:completion-review:2",
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
        "expected_state_change": "执行边界得到验证并保存可信结果。"
      },
      "accepted_state_delta": {
        "facts_added": [],
        "facts_superseded": [],
        "impacts_added": [],
        "impacts_updated": [],
        "gaps_added": [],
        "gaps_cancelled": [],
        "resolved_open_questions": [],
        "completed_handoffs": [],
        "resolved_review_findings": [],
        "resolved_gap": null,
        "completion_review_result": {
          "reviewer": "agent",
          "reviewed_content_revision": 2,
          "outcome": "clean",
          "dimensions": {
            "implementation_correctness": "clean",
            "problem_resolution": "clean",
            "verification_credibility": "clean",
            "regression_risk": "clean",
            "minimality": "clean"
          },
          "findings": [],
          "evidence": [
            "arckit/cases/evidence/CASE-20260911-004/execution-lifecycle.md"
          ]
        },
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
        "project_revision": 372,
        "judgments": [
          {
            "invariant_ref": "product-expectations-remain-recoverable",
            "disposition": "upheld",
            "reason": "执行停止与任务完成的产品边界已同步到功能规格。",
            "fact_refs": [
              "FACT-20260911-004-001"
            ],
            "gap_refs": [],
            "evidence": [
              "arckit/cases/evidence/CASE-20260911-004/execution-lifecycle.md"
            ]
          },
          {
            "invariant_ref": "interaction-expectations-remain-recoverable",
            "disposition": "upheld",
            "reason": "停止、外部等待和人工责任的交互源与线框已同步。",
            "fact_refs": [
              "FACT-20260911-004-001"
            ],
            "gap_refs": [],
            "evidence": [
              "arckit/cases/evidence/CASE-20260911-004/execution-lifecycle.md"
            ]
          },
          {
            "invariant_ref": "visual-language-remains-consistent",
            "disposition": "not_relevant",
            "reason": "本事项不改变视觉语言、主题或组件样式。",
            "fact_refs": [
              "FACT-20260911-004-001"
            ],
            "gap_refs": [],
            "evidence": []
          },
          {
            "invariant_ref": "technical-decisions-remain-explainable",
            "disposition": "upheld",
            "reason": "执行结果解释入口、绑定来源和持久化契约已同步技术方案。",
            "fact_refs": [
              "FACT-20260911-004-001"
            ],
            "gap_refs": [],
            "evidence": [
              "arckit/cases/evidence/CASE-20260911-004/execution-lifecycle.md"
            ]
          },
          {
            "invariant_ref": "accepted-facts-are-realized",
            "disposition": "upheld",
            "reason": "状态转换和重启测试证明停止保留 Case，既有单 Gap 写回和 fresh-read 仍有效。",
            "fact_refs": [
              "FACT-20260911-004-001"
            ],
            "gap_refs": [],
            "evidence": [
              "arckit/cases/evidence/CASE-20260911-004/execution-lifecycle.md"
            ]
          },
          {
            "invariant_ref": "material-risks-have-credible-evidence",
            "disposition": "upheld",
            "reason": "定向回归、完整检查结果和未验证 GUI 边界均有明确记录。",
            "fact_refs": [
              "FACT-20260911-004-001"
            ],
            "gap_refs": [],
            "evidence": [
              "arckit/cases/evidence/CASE-20260911-004/execution-lifecycle.md"
            ]
          }
        ]
      },
      "evidence": [
        "arckit/cases/evidence/CASE-20260911-004/execution-lifecycle.md"
      ],
      "runtime_result_ref": "",
      "occurred_at": "2026-09-11T10:39:49.658Z"
    }
  ],
  "case_resolution": {
    "status": "resolved",
    "stage": "resolved",
    "satisfied": [
      "GAP-20260911-004-001",
      "CASE-20260911-004:review-finding:RF-20260911-004-001"
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
    "updated_at": "2026-09-11T10:39:49.658Z"
  }
}
```

## Round Notes

- Case history is canonical in Structured Record.rounds; keep prose notes exceptional.
