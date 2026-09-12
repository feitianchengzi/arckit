# Unify arckit-state-driven-loop capability and invocation surfaces

Case: CASE-20260911-005
Status: closed
Artifact Type: mixed
Selected Gap: none
Updated: 2026-09-11T13:32:03.858Z

## User Intent

合并两个 entry skills 并整体优化架构和内容，名称 arckit-state-driven-loop。

## Structured Record

```json
{
  "schema_version": "development-case-record/v5",
  "id": "CASE-20260911-005",
  "title": "Unify arckit-state-driven-loop capability and invocation surfaces",
  "status": "closed",
  "artifact_type": "mixed",
  "created_at": "2026-09-11T13:18:41.291Z",
  "updated_at": "2026-09-11T13:32:03.858Z",
  "user_intent": "合并两个 entry skills 并整体优化架构和内容，名称 arckit-state-driven-loop。",
  "expected_outcome": "单一自包含 skill 对外提供 Agent 入口和可信 Ledger；Runtime、分发与文档一致，保留单 Gap state driven loop。",
  "project_state_ref": "arckit/project/state.record.json",
  "current_round": {
    "goal": "",
    "selected_gap": null
  },
  "facts": [
    {
      "id": "FACT-20260911-005-001",
      "revision": 1,
      "status": "accepted",
      "statement": "用户确认将 using-arckit 与 arckit-development-ledger 合并为 arckit-state-driven-loop，保留单 Gap、可信写入和 fresh-read；当前源码有两个包及互斥绑定。",
      "basis": "用户授权及维护源和 capability policy 检查。",
      "evidence": [
        "AGENTS.md",
        "runtime/arcorbit/config/capability-policy.json"
      ]
    },
    {
      "id": "FACT-20260911-005-002",
      "revision": 1,
      "status": "accepted",
      "statement": "arckit-state-driven-loop 已统一 Agent 入口与包内可信 Ledger，Runtime 和分发使用一个包；旧场景偏好可恢复，单 Gap、Review 和 post-commit fresh-read 保持。",
      "basis": "代码、定向状态转换测试与文档核对",
      "evidence": [
        "arckit/cases/evidence/CASE-20260911-005/skill-consolidation.md"
      ]
    },
    {
      "id": "FACT-20260911-005-003",
      "revision": 1,
      "status": "accepted",
      "statement": "arckit-state-driven-loop 已统一 Agent 入口与包内可信 Ledger，Runtime 和分发使用一个包；旧场景偏好可恢复，单 Gap、Review 和 post-commit fresh-read 保持。",
      "basis": "代码、定向状态转换测试与文档核对",
      "evidence": [
        "arckit/cases/evidence/CASE-20260911-005/skill-consolidation.md"
      ]
    }
  ],
  "state_impacts": [],
  "gaps": [
    {
      "id": "GAP-20260911-005-001",
      "status": "resolved",
      "goal": "提供内容统一且接口分离的 arckit-state-driven-loop，并使 Runtime 与分发使用同一包。",
      "reason": "已确定的能力边界需要在维护源及消费端一致实现。",
      "derived_from": [
        "FACT-20260911-005-001"
      ],
      "blocked_by": [],
      "priority_basis": {
        "risk": "high",
        "blocking": "high"
      },
      "responsibility": "agent",
      "evidence_required": [
        "Merged self-contained package, runtime integration tests and contract documentation."
      ],
      "resolution": {
        "id": "GAP-20260911-005-001",
        "status": "resolved",
        "outcome": "State Driven Loop 能力边界已实现并通过定向回归。",
        "reason": "源代码、skill、prompt、文档与重启持久化路径统一。",
        "evidence": [
          "arckit/cases/evidence/CASE-20260911-005/skill-consolidation.md"
        ],
        "occurred_at": "2026-09-11T13:29:55.141Z"
      }
    },
    {
      "id": "CASE-20260911-005:review-finding:RF-20260911-005-001",
      "status": "resolved",
      "goal": "Resolve review finding: 规格索引仍宣称默认双能力 Runtime policy；需同步为单包双接口并校正受影响索引摘要。",
      "reason": "omission found by completion review",
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
        "arckit/spec/INDEX.md"
      ],
      "resolution": {
        "id": "CASE-20260911-005:review-finding:RF-20260911-005-001",
        "status": "resolved",
        "outcome": "State Driven Loop 能力边界已实现并通过定向回归。",
        "reason": "源代码、skill、prompt、文档与重启持久化路径统一。",
        "evidence": [
          "arckit/cases/evidence/CASE-20260911-005/skill-consolidation.md"
        ],
        "occurred_at": "2026-09-11T13:31:34.449Z"
      }
    }
  ],
  "content_revision": 2,
  "completion_review": {
    "status": "clean",
    "policy": {
      "initial_max_cycles": 10,
      "source": "runtime/arcorbit/config/case-policy.json",
      "snapshotted_at": "2026-09-11T13:18:41.291Z"
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
          "regression_risk": "clean",
          "minimality": "clean"
        },
        "finding_ids": [
          "RF-20260911-005-001"
        ],
        "evidence": [
          "arckit/cases/evidence/CASE-20260911-005/skill-consolidation.md"
        ],
        "occurred_at": "2026-09-11T13:31:00.459Z"
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
          "arckit/cases/evidence/CASE-20260911-005/skill-consolidation.md"
        ],
        "occurred_at": "2026-09-11T13:32:03.858Z"
      }
    ],
    "evidence": [
      "arckit/cases/evidence/CASE-20260911-005/skill-consolidation.md"
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
      "goal": "提供内容统一且接口分离的 arckit-state-driven-loop，并使 Runtime 与分发使用同一包。",
      "outcome": "completed",
      "gap_selection": {
        "mode": "candidate",
        "basis": "当前用户授权的统一 State Driven Loop 架构优化优先；其他 Case 保持独立责任。",
        "snapshot_token": "09671ebdfa3eb170c6d7e9f928e80883264cd1f7d06867f2524df9c8f9fdf6cb",
        "selected_ref": "case-gap:CASE-20260911-005:GAP-20260911-005-001",
        "comparison_summary": "选中当前 Case 的实现或完成检查候选，其他产品与外部授权候选不属于本项。",
        "fresh_discovery_summary": "未发现需要新增的实现义务；真实 Agent 隔离验证作为后续可选交接明确披露。",
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
            "ref": "case-gap:CASE-20260911-005:GAP-20260911-005-001",
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
        "id": "GAP-20260911-005-001",
        "responsibility": "agent",
        "goal": "提供内容统一且接口分离的 arckit-state-driven-loop，并使 Runtime 与分发使用同一包。",
        "reason": "已确定的能力边界需要在维护源及消费端一致实现。",
        "derived_from": [
          "FACT-20260911-005-001"
        ],
        "blocked_by": [],
        "priority_basis": {
          "blocking": "high",
          "uncertainty": "",
          "risk": "high",
          "user_impact": ""
        },
        "evidence_required": [
          "Merged self-contained package, runtime integration tests and contract documentation."
        ]
      },
      "planned_transition": {
        "goal": "提供内容统一且接口分离的 arckit-state-driven-loop，并使 Runtime 与分发使用同一包。",
        "expected_state_change": "统一能力包与消费端获得验证并保存可信结果。"
      },
      "accepted_state_delta": {
        "facts_added": [
          {
            "id": "FACT-20260911-005-002",
            "revision": 1,
            "status": "accepted",
            "statement": "arckit-state-driven-loop 已统一 Agent 入口与包内可信 Ledger，Runtime 和分发使用一个包；旧场景偏好可恢复，单 Gap、Review 和 post-commit fresh-read 保持。",
            "basis": "代码、定向状态转换测试与文档核对",
            "evidence": [
              "arckit/cases/evidence/CASE-20260911-005/skill-consolidation.md"
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
          "id": "GAP-20260911-005-001",
          "status": "resolved",
          "outcome": "State Driven Loop 能力边界已实现并通过定向回归。",
          "reason": "源代码、skill、prompt、文档与重启持久化路径统一。",
          "evidence": [
            "arckit/cases/evidence/CASE-20260911-005/skill-consolidation.md"
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
        "project_revision": 374,
        "judgments": [
          {
            "invariant_ref": "product-expectations-remain-recoverable",
            "disposition": "upheld",
            "reason": "单包双接口及场景核心选择已同步规格。",
            "fact_refs": [
              "FACT-20260911-005-001"
            ],
            "gap_refs": [],
            "evidence": [
              "arckit/cases/evidence/CASE-20260911-005/skill-consolidation.md"
            ]
          },
          {
            "invariant_ref": "interaction-expectations-remain-recoverable",
            "disposition": "upheld",
            "reason": "场景入口引用和单个核心开关与实现一致。",
            "fact_refs": [
              "FACT-20260911-005-001"
            ],
            "gap_refs": [],
            "evidence": [
              "arckit/cases/evidence/CASE-20260911-005/skill-consolidation.md"
            ]
          },
          {
            "invariant_ref": "visual-language-remains-consistent",
            "disposition": "not_relevant",
            "reason": "本事项不改变视觉语言、主题或组件样式。",
            "fact_refs": [
              "FACT-20260911-005-001"
            ],
            "gap_refs": [],
            "evidence": []
          },
          {
            "invariant_ref": "technical-decisions-remain-explainable",
            "disposition": "upheld",
            "reason": "单包双接口、manifest 解析和 prompt 所有权已同步技术方案。",
            "fact_refs": [
              "FACT-20260911-005-001"
            ],
            "gap_refs": [],
            "evidence": [
              "arckit/cases/evidence/CASE-20260911-005/skill-consolidation.md"
            ]
          },
          {
            "invariant_ref": "accepted-facts-are-realized",
            "disposition": "upheld",
            "reason": "分发、可信写入、单 Gap Loop、Review 和场景升级回归证明新入口已实现。",
            "fact_refs": [
              "FACT-20260911-005-001"
            ],
            "gap_refs": [],
            "evidence": [
              "arckit/cases/evidence/CASE-20260911-005/skill-consolidation.md"
            ]
          },
          {
            "invariant_ref": "material-risks-have-credible-evidence",
            "disposition": "upheld",
            "reason": "完整检查及失败复测包括 GUI 已记录，真实 Agent 隔离验证边界已披露。",
            "fact_refs": [
              "FACT-20260911-005-001"
            ],
            "gap_refs": [],
            "evidence": [
              "arckit/cases/evidence/CASE-20260911-005/skill-consolidation.md"
            ]
          }
        ]
      },
      "evidence": [
        "arckit/cases/evidence/CASE-20260911-005/skill-consolidation.md"
      ],
      "runtime_result_ref": "",
      "occurred_at": "2026-09-11T13:29:55.141Z"
    },
    {
      "round": 2,
      "transition_schema_version": "arckit-case-transition/v8",
      "goal": "Review the completed implementation for correctness, real problem resolution, verification credibility, regression risk, and minimality.",
      "outcome": "completed",
      "gap_selection": {
        "mode": "candidate",
        "basis": "当前用户授权的统一 State Driven Loop 架构优化优先；其他 Case 保持独立责任。",
        "snapshot_token": "9ede92c4dc3b97dcf3b8e344424561f8725f907919b494f314ec4d7f5199ed14",
        "selected_ref": "case-gap:CASE-20260911-005:CASE-20260911-005:completion-review:1",
        "comparison_summary": "选中当前 Case 的实现或完成检查候选，其他产品与外部授权候选不属于本项。",
        "fresh_discovery_summary": "发现现行规格索引遗漏，通过 Review finding 派生下一轮修复。",
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
            "ref": "case-gap:CASE-20260911-005:CASE-20260911-005:completion-review:1",
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
        "id": "CASE-20260911-005:completion-review:1",
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
        "expected_state_change": "统一能力包与消费端获得验证并保存可信结果。"
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
            "regression_risk": "clean",
            "minimality": "clean"
          },
          "findings": [
            {
              "id": "RF-20260911-005-001",
              "kind": "omission",
              "statement": "规格索引仍宣称默认双能力 Runtime policy；需同步为单包双接口并校正受影响索引摘要。",
              "responsibility": "agent",
              "artifact_refs": [
                "arckit/spec/INDEX.md"
              ],
              "evidence": [
                "arckit/spec/INDEX.md"
              ]
            }
          ],
          "evidence": [
            "arckit/cases/evidence/CASE-20260911-005/skill-consolidation.md"
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
        "project_revision": 374,
        "judgments": [
          {
            "invariant_ref": "product-expectations-remain-recoverable",
            "disposition": "upheld",
            "reason": "单包双接口及场景核心选择已同步规格。",
            "fact_refs": [
              "FACT-20260911-005-001"
            ],
            "gap_refs": [],
            "evidence": [
              "arckit/cases/evidence/CASE-20260911-005/skill-consolidation.md"
            ]
          },
          {
            "invariant_ref": "interaction-expectations-remain-recoverable",
            "disposition": "upheld",
            "reason": "场景入口引用和单个核心开关与实现一致。",
            "fact_refs": [
              "FACT-20260911-005-001"
            ],
            "gap_refs": [],
            "evidence": [
              "arckit/cases/evidence/CASE-20260911-005/skill-consolidation.md"
            ]
          },
          {
            "invariant_ref": "visual-language-remains-consistent",
            "disposition": "not_relevant",
            "reason": "本事项不改变视觉语言、主题或组件样式。",
            "fact_refs": [
              "FACT-20260911-005-001"
            ],
            "gap_refs": [],
            "evidence": []
          },
          {
            "invariant_ref": "technical-decisions-remain-explainable",
            "disposition": "upheld",
            "reason": "单包双接口、manifest 解析和 prompt 所有权已同步技术方案。",
            "fact_refs": [
              "FACT-20260911-005-001"
            ],
            "gap_refs": [],
            "evidence": [
              "arckit/cases/evidence/CASE-20260911-005/skill-consolidation.md"
            ]
          },
          {
            "invariant_ref": "accepted-facts-are-realized",
            "disposition": "upheld",
            "reason": "分发、可信写入、单 Gap Loop、Review 和场景升级回归证明新入口已实现。",
            "fact_refs": [
              "FACT-20260911-005-001"
            ],
            "gap_refs": [],
            "evidence": [
              "arckit/cases/evidence/CASE-20260911-005/skill-consolidation.md"
            ]
          },
          {
            "invariant_ref": "material-risks-have-credible-evidence",
            "disposition": "upheld",
            "reason": "完整检查及失败复测包括 GUI 已记录，真实 Agent 隔离验证边界已披露。",
            "fact_refs": [
              "FACT-20260911-005-001"
            ],
            "gap_refs": [],
            "evidence": [
              "arckit/cases/evidence/CASE-20260911-005/skill-consolidation.md"
            ]
          }
        ]
      },
      "evidence": [
        "arckit/cases/evidence/CASE-20260911-005/skill-consolidation.md"
      ],
      "runtime_result_ref": "",
      "occurred_at": "2026-09-11T13:31:00.459Z"
    },
    {
      "round": 3,
      "transition_schema_version": "arckit-case-transition/v8",
      "goal": "Resolve review finding: 规格索引仍宣称默认双能力 Runtime policy；需同步为单包双接口并校正受影响索引摘要。",
      "outcome": "completed",
      "gap_selection": {
        "mode": "candidate",
        "basis": "当前用户授权的统一 State Driven Loop 架构优化优先；其他 Case 保持独立责任。",
        "snapshot_token": "710f5bcb32b4666f83b66e31a04e1cadadc5cde13b7c7829950ee9ef152d844a",
        "selected_ref": "case-gap:CASE-20260911-005:CASE-20260911-005:review-finding:RF-20260911-005-001",
        "comparison_summary": "选中当前 Case 的实现或完成检查候选，其他产品与外部授权候选不属于本项。",
        "fresh_discovery_summary": "未发现需要新增的实现义务；真实 Agent 隔离验证作为后续可选交接明确披露。",
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
            "ref": "case-gap:CASE-20260911-005:CASE-20260911-005:review-finding:RF-20260911-005-001",
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
        "id": "CASE-20260911-005:review-finding:RF-20260911-005-001",
        "responsibility": "agent",
        "goal": "Resolve review finding: 规格索引仍宣称默认双能力 Runtime policy；需同步为单包双接口并校正受影响索引摘要。",
        "reason": "omission found by completion review",
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
          "arckit/spec/INDEX.md"
        ]
      },
      "planned_transition": {
        "goal": "Resolve review finding: 规格索引仍宣称默认双能力 Runtime policy；需同步为单包双接口并校正受影响索引摘要。",
        "expected_state_change": "统一能力包与消费端获得验证并保存可信结果。"
      },
      "accepted_state_delta": {
        "facts_added": [
          {
            "id": "FACT-20260911-005-003",
            "revision": 1,
            "status": "accepted",
            "statement": "arckit-state-driven-loop 已统一 Agent 入口与包内可信 Ledger，Runtime 和分发使用一个包；旧场景偏好可恢复，单 Gap、Review 和 post-commit fresh-read 保持。",
            "basis": "代码、定向状态转换测试与文档核对",
            "evidence": [
              "arckit/cases/evidence/CASE-20260911-005/skill-consolidation.md"
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
          "id": "CASE-20260911-005:review-finding:RF-20260911-005-001",
          "status": "resolved",
          "outcome": "State Driven Loop 能力边界已实现并通过定向回归。",
          "reason": "源代码、skill、prompt、文档与重启持久化路径统一。",
          "evidence": [
            "arckit/cases/evidence/CASE-20260911-005/skill-consolidation.md"
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
        "project_revision": 374,
        "judgments": [
          {
            "invariant_ref": "product-expectations-remain-recoverable",
            "disposition": "upheld",
            "reason": "单包双接口及场景核心选择已同步规格。",
            "fact_refs": [
              "FACT-20260911-005-001"
            ],
            "gap_refs": [],
            "evidence": [
              "arckit/cases/evidence/CASE-20260911-005/skill-consolidation.md"
            ]
          },
          {
            "invariant_ref": "interaction-expectations-remain-recoverable",
            "disposition": "upheld",
            "reason": "场景入口引用和单个核心开关与实现一致。",
            "fact_refs": [
              "FACT-20260911-005-001"
            ],
            "gap_refs": [],
            "evidence": [
              "arckit/cases/evidence/CASE-20260911-005/skill-consolidation.md"
            ]
          },
          {
            "invariant_ref": "visual-language-remains-consistent",
            "disposition": "not_relevant",
            "reason": "本事项不改变视觉语言、主题或组件样式。",
            "fact_refs": [
              "FACT-20260911-005-001"
            ],
            "gap_refs": [],
            "evidence": []
          },
          {
            "invariant_ref": "technical-decisions-remain-explainable",
            "disposition": "upheld",
            "reason": "单包双接口、manifest 解析和 prompt 所有权已同步技术方案。",
            "fact_refs": [
              "FACT-20260911-005-001"
            ],
            "gap_refs": [],
            "evidence": [
              "arckit/cases/evidence/CASE-20260911-005/skill-consolidation.md"
            ]
          },
          {
            "invariant_ref": "accepted-facts-are-realized",
            "disposition": "upheld",
            "reason": "分发、可信写入、单 Gap Loop、Review 和场景升级回归证明新入口已实现。",
            "fact_refs": [
              "FACT-20260911-005-001"
            ],
            "gap_refs": [],
            "evidence": [
              "arckit/cases/evidence/CASE-20260911-005/skill-consolidation.md"
            ]
          },
          {
            "invariant_ref": "material-risks-have-credible-evidence",
            "disposition": "upheld",
            "reason": "完整检查及失败复测包括 GUI 已记录，真实 Agent 隔离验证边界已披露。",
            "fact_refs": [
              "FACT-20260911-005-001"
            ],
            "gap_refs": [],
            "evidence": [
              "arckit/cases/evidence/CASE-20260911-005/skill-consolidation.md"
            ]
          }
        ]
      },
      "evidence": [
        "arckit/cases/evidence/CASE-20260911-005/skill-consolidation.md"
      ],
      "runtime_result_ref": "",
      "occurred_at": "2026-09-11T13:31:34.449Z"
    },
    {
      "round": 4,
      "transition_schema_version": "arckit-case-transition/v8",
      "goal": "Review the completed implementation for correctness, real problem resolution, verification credibility, regression risk, and minimality.",
      "outcome": "completed",
      "gap_selection": {
        "mode": "candidate",
        "basis": "当前用户授权的统一 State Driven Loop 架构优化优先；其他 Case 保持独立责任。",
        "snapshot_token": "10a2742d32812ba3f67d05a3b8c962cbfc12ab742001e626de044933a2c2f54a",
        "selected_ref": "case-gap:CASE-20260911-005:CASE-20260911-005:completion-review:2",
        "comparison_summary": "选中当前 Case 的实现或完成检查候选，其他产品与外部授权候选不属于本项。",
        "fresh_discovery_summary": "未发现需要新增的实现义务；真实 Agent 隔离验证作为后续可选交接明确披露。",
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
            "ref": "case-gap:CASE-20260911-005:CASE-20260911-005:completion-review:2",
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
        "id": "CASE-20260911-005:completion-review:2",
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
        "expected_state_change": "统一能力包与消费端获得验证并保存可信结果。"
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
            "arckit/cases/evidence/CASE-20260911-005/skill-consolidation.md"
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
        "project_revision": 374,
        "judgments": [
          {
            "invariant_ref": "product-expectations-remain-recoverable",
            "disposition": "upheld",
            "reason": "单包双接口及场景核心选择已同步规格。",
            "fact_refs": [
              "FACT-20260911-005-001"
            ],
            "gap_refs": [],
            "evidence": [
              "arckit/cases/evidence/CASE-20260911-005/skill-consolidation.md"
            ]
          },
          {
            "invariant_ref": "interaction-expectations-remain-recoverable",
            "disposition": "upheld",
            "reason": "场景入口引用和单个核心开关与实现一致。",
            "fact_refs": [
              "FACT-20260911-005-001"
            ],
            "gap_refs": [],
            "evidence": [
              "arckit/cases/evidence/CASE-20260911-005/skill-consolidation.md"
            ]
          },
          {
            "invariant_ref": "visual-language-remains-consistent",
            "disposition": "not_relevant",
            "reason": "本事项不改变视觉语言、主题或组件样式。",
            "fact_refs": [
              "FACT-20260911-005-001"
            ],
            "gap_refs": [],
            "evidence": []
          },
          {
            "invariant_ref": "technical-decisions-remain-explainable",
            "disposition": "upheld",
            "reason": "单包双接口、manifest 解析和 prompt 所有权已同步技术方案。",
            "fact_refs": [
              "FACT-20260911-005-001"
            ],
            "gap_refs": [],
            "evidence": [
              "arckit/cases/evidence/CASE-20260911-005/skill-consolidation.md"
            ]
          },
          {
            "invariant_ref": "accepted-facts-are-realized",
            "disposition": "upheld",
            "reason": "分发、可信写入、单 Gap Loop、Review 和场景升级回归证明新入口已实现。",
            "fact_refs": [
              "FACT-20260911-005-001"
            ],
            "gap_refs": [],
            "evidence": [
              "arckit/cases/evidence/CASE-20260911-005/skill-consolidation.md"
            ]
          },
          {
            "invariant_ref": "material-risks-have-credible-evidence",
            "disposition": "upheld",
            "reason": "完整检查及失败复测包括 GUI 已记录，真实 Agent 隔离验证边界已披露。",
            "fact_refs": [
              "FACT-20260911-005-001"
            ],
            "gap_refs": [],
            "evidence": [
              "arckit/cases/evidence/CASE-20260911-005/skill-consolidation.md"
            ]
          }
        ]
      },
      "evidence": [
        "arckit/cases/evidence/CASE-20260911-005/skill-consolidation.md"
      ],
      "runtime_result_ref": "",
      "occurred_at": "2026-09-11T13:32:03.858Z"
    }
  ],
  "case_resolution": {
    "status": "resolved",
    "stage": "resolved",
    "satisfied": [
      "GAP-20260911-005-001",
      "CASE-20260911-005:review-finding:RF-20260911-005-001"
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
    "updated_at": "2026-09-11T13:32:03.858Z"
  }
}
```

## Round Notes

- Case history is canonical in Structured Record.rounds; keep prose notes exceptional.
