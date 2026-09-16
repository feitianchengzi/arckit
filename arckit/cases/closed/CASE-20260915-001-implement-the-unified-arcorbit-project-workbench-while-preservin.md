# Implement the unified ArcOrbit project workbench while preserving legacy surfaces

Case: CASE-20260915-001
Status: closed
Artifact Type: mixed
Selected Gap: none
Updated: 2026-09-15T19:42:16.227Z

## User Intent

按用户确认的最终交互原型和技术方向完整实施独立的新项目事情台，旧业务页面保持并通过统一二级菜单访问。

## Structured Record

```json
{
  "schema_version": "development-case-record/v5",
  "id": "CASE-20260915-001",
  "title": "Implement the unified ArcOrbit project workbench while preserving legacy surfaces",
  "status": "closed",
  "artifact_type": "mixed",
  "created_at": "2026-09-15T18:10:36.342Z",
  "updated_at": "2026-09-15T19:42:16.227Z",
  "user_intent": "按用户确认的最终交互原型和技术方向完整实施独立的新项目事情台，旧业务页面保持并通过统一二级菜单访问。",
  "expected_outcome": "新主交互真实连接事情、场景状态、持续 Agent 会话和 Auto；最终原型细节逐项验收，旧页面业务实现保持且全部可访问。",
  "project_state_ref": "arckit/project/state.record.json",
  "current_round": {
    "goal": "",
    "selected_gap": null
  },
  "facts": [
    {
      "id": "FACT-20260915-001-001",
      "revision": 1,
      "status": "accepted",
      "statement": "用户确认项目事情台原型可接受，授权完整实施，要求新业务页面独立实现，旧业务页面与全部入口经统一二级菜单保留。",
      "basis": "当前用户明确实施指令及连续原型反馈。",
      "evidence": [
        "arckit/intake/2026/2026-09-16-arcorbit-unified-workspace.md",
        "runtime/arcorbit/design/project-workbench-v2/README.md"
      ]
    },
    {
      "id": "FACT-20260915-001-002",
      "revision": 1,
      "status": "accepted",
      "statement": "最终原型已汇总为独立新事情台规格、交互状态投影与逐项验收清单；生产实现尚未连接新交互与共享业务能力。",
      "basis": "读取最终原型与当前生产入口、Chat 和 Automation 协调器。",
      "evidence": [
        "arckit/spec/agentic-software-development/arcorbit-project-workbench.md",
        "arckit/interaction/project-workbench/interaction.md",
        "arckit/interaction/project-workbench/default.html",
        "arckit/cases/evidence/CASE-20260915-001/acceptance-matrix.md"
      ]
    },
    {
      "id": "FACT-20260915-001-003",
      "revision": 1,
      "status": "accepted",
      "statement": "独立生产事情台已成为默认入口并保留 11 个旧业务页面；任务/附件、持久场景、同事情主线程、显式单事情 Auto 和受约束 Agent 工具已经接入原服务。全量 789 项 0 失败，后续定向 168 项和最后 13 项通过，Electron 11 组验证通过。未声称真实远端写入或计费模型端到端验证。",
      "basis": "本次生产实现、确定性测试与生产 Renderer 隔离验证。",
      "evidence": [
        "arckit/cases/evidence/CASE-20260915-001/verification.md",
        "arckit/cases/evidence/CASE-20260915-001/acceptance-matrix.md",
        "arckit/spec/agentic-software-development/arcorbit-project-workbench.md",
        "arckit/interaction/project-workbench/interaction.md",
        "arckit/tech/arcorbit/project-workbench-solution.md"
      ]
    },
    {
      "id": "FACT-20260915-001-004",
      "revision": 1,
      "status": "accepted",
      "statement": "两级 Automation clearRemoteSession 均清除 requested_tasks；退出不保留旧账号的显式单事情执行授权。",
      "basis": "完成审查 finding 的实现与验证。",
      "evidence": [
        "arckit/cases/evidence/CASE-20260915-001/review-fix-1.md"
      ]
    },
    {
      "id": "FACT-20260915-001-005",
      "revision": 1,
      "status": "accepted",
      "statement": "同一事情工具桥新增 MCP 接口，Chat turn 与 Auto Run 都注入按账号/事情/工作区授权的 MCP 配置及环境变量；恢复已有 thread 可以发现与调用同一场景服务，无需创建替代线程。",
      "basis": "完成审查 finding 的实现与验证。",
      "evidence": [
        "arckit/cases/evidence/CASE-20260915-001/review-fix-2.md"
      ]
    }
  ],
  "state_impacts": [
    {
      "id": "IMPACT-20260915-001-001",
      "fact_id": "FACT-20260915-001-003",
      "fact_revision": 1,
      "target": {
        "kind": "software_decision",
        "ref": "product_intent_and_scope",
        "revision": 6
      },
      "effect": "upheld",
      "reason": "新事情台实现与保留旧业务形成稳定架构/交互事实。",
      "gap_ids": [],
      "evidence": [
        "arckit/cases/evidence/CASE-20260915-001/verification.md",
        "arckit/cases/evidence/CASE-20260915-001/acceptance-matrix.md",
        "arckit/spec/agentic-software-development/arcorbit-project-workbench.md",
        "arckit/interaction/project-workbench/interaction.md",
        "arckit/tech/arcorbit/project-workbench-solution.md"
      ]
    },
    {
      "id": "IMPACT-20260915-001-002",
      "fact_id": "FACT-20260915-001-003",
      "fact_revision": 1,
      "target": {
        "kind": "software_decision",
        "ref": "product_capabilities",
        "revision": 49
      },
      "effect": "upheld",
      "reason": "新事情台实现与保留旧业务形成稳定架构/交互事实。",
      "gap_ids": [],
      "evidence": [
        "arckit/cases/evidence/CASE-20260915-001/verification.md",
        "arckit/cases/evidence/CASE-20260915-001/acceptance-matrix.md",
        "arckit/spec/agentic-software-development/arcorbit-project-workbench.md",
        "arckit/interaction/project-workbench/interaction.md",
        "arckit/tech/arcorbit/project-workbench-solution.md"
      ]
    },
    {
      "id": "IMPACT-20260915-001-003",
      "fact_id": "FACT-20260915-001-003",
      "fact_revision": 1,
      "target": {
        "kind": "software_decision",
        "ref": "experience_and_interaction",
        "revision": 72
      },
      "effect": "upheld",
      "reason": "新事情台实现与保留旧业务形成稳定架构/交互事实。",
      "gap_ids": [],
      "evidence": [
        "arckit/cases/evidence/CASE-20260915-001/verification.md",
        "arckit/cases/evidence/CASE-20260915-001/acceptance-matrix.md",
        "arckit/spec/agentic-software-development/arcorbit-project-workbench.md",
        "arckit/interaction/project-workbench/interaction.md",
        "arckit/tech/arcorbit/project-workbench-solution.md"
      ]
    },
    {
      "id": "IMPACT-20260915-001-004",
      "fact_id": "FACT-20260915-001-003",
      "fact_revision": 1,
      "target": {
        "kind": "software_decision",
        "ref": "visual_language",
        "revision": 6
      },
      "effect": "upheld",
      "reason": "新事情台实现与保留旧业务形成稳定架构/交互事实。",
      "gap_ids": [],
      "evidence": [
        "arckit/cases/evidence/CASE-20260915-001/verification.md",
        "arckit/cases/evidence/CASE-20260915-001/acceptance-matrix.md",
        "arckit/spec/agentic-software-development/arcorbit-project-workbench.md",
        "arckit/interaction/project-workbench/interaction.md",
        "arckit/tech/arcorbit/project-workbench-solution.md"
      ]
    },
    {
      "id": "IMPACT-20260915-001-005",
      "fact_id": "FACT-20260915-001-003",
      "fact_revision": 1,
      "target": {
        "kind": "software_decision",
        "ref": "data_and_state",
        "revision": 27
      },
      "effect": "upheld",
      "reason": "新事情台实现与保留旧业务形成稳定架构/交互事实。",
      "gap_ids": [],
      "evidence": [
        "arckit/cases/evidence/CASE-20260915-001/verification.md",
        "arckit/cases/evidence/CASE-20260915-001/acceptance-matrix.md",
        "arckit/spec/agentic-software-development/arcorbit-project-workbench.md",
        "arckit/interaction/project-workbench/interaction.md",
        "arckit/tech/arcorbit/project-workbench-solution.md"
      ]
    },
    {
      "id": "IMPACT-20260915-001-006",
      "fact_id": "FACT-20260915-001-003",
      "fact_revision": 1,
      "target": {
        "kind": "software_decision",
        "ref": "external_integrations",
        "revision": 20
      },
      "effect": "upheld",
      "reason": "新事情台实现与保留旧业务形成稳定架构/交互事实。",
      "gap_ids": [],
      "evidence": [
        "arckit/cases/evidence/CASE-20260915-001/verification.md",
        "arckit/cases/evidence/CASE-20260915-001/acceptance-matrix.md",
        "arckit/spec/agentic-software-development/arcorbit-project-workbench.md",
        "arckit/interaction/project-workbench/interaction.md",
        "arckit/tech/arcorbit/project-workbench-solution.md"
      ]
    },
    {
      "id": "IMPACT-20260915-001-007",
      "fact_id": "FACT-20260915-001-003",
      "fact_revision": 1,
      "target": {
        "kind": "software_decision",
        "ref": "technical_foundation",
        "revision": 50
      },
      "effect": "upheld",
      "reason": "新事情台实现与保留旧业务形成稳定架构/交互事实。",
      "gap_ids": [],
      "evidence": [
        "arckit/cases/evidence/CASE-20260915-001/verification.md",
        "arckit/cases/evidence/CASE-20260915-001/acceptance-matrix.md",
        "arckit/spec/agentic-software-development/arcorbit-project-workbench.md",
        "arckit/interaction/project-workbench/interaction.md",
        "arckit/tech/arcorbit/project-workbench-solution.md"
      ]
    }
  ],
  "gaps": [
    {
      "id": "GAP-20260915-001-001",
      "status": "resolved",
      "goal": "将最终已确认原型与过渡要求汇总为完整、可逐项追踪的实施验收基线。",
      "reason": "当前只有迭代原型和讨论，缺少防止功能、状态、恢复和旧页面入口遗漏的统一基线。",
      "derived_from": [
        "FACT-20260915-001-001"
      ],
      "blocked_by": [],
      "priority_basis": {
        "blocking": "后续独立新页面实现必须明确保留哪些行为与边界",
        "user_impact": "防止新旧过渡丢失已有能力"
      },
      "responsibility": "agent",
      "evidence_required": [
        "覆盖最终原型所有可见动作、状态与恢复的验收清单",
        "明确新旧页面隔离和全部旧导航可达的正式预期"
      ],
      "resolution": {
        "id": "GAP-20260915-001-001",
        "status": "resolved",
        "outcome": "基线已记录",
        "reason": "规格、交互状态及验收矩阵覆盖新旧过渡和最终原型",
        "evidence": [
          "arckit/spec/agentic-software-development/arcorbit-project-workbench.md",
          "arckit/interaction/project-workbench/interaction.md",
          "arckit/interaction/project-workbench/default.html",
          "arckit/cases/evidence/CASE-20260915-001/acceptance-matrix.md"
        ],
        "occurred_at": "2026-09-15T18:17:42.971Z"
      }
    },
    {
      "id": "GAP-20260915-001-002",
      "status": "resolved",
      "goal": "实现并验证独立的新事情台及其真实业务、主会话和 Agent 能力集成，保留所有旧页面。",
      "reason": "验收基线已明确，但目前生产壳仍以旧导航与分离 Chat/Work/Automation 为主，缺少新页面及共享场景状态。",
      "derived_from": [
        "FACT-20260915-001-002"
      ],
      "blocked_by": [],
      "priority_basis": {
        "user_impact": "用户明确要求完整实施",
        "risk": "保持旧页面业务和同事情串行线程约束"
      },
      "responsibility": "agent",
      "evidence_required": [
        "验收矩阵逐项对应真实实现与测试",
        "新旧页面导航及真实命令边界回归证据"
      ],
      "resolution": {
        "id": "GAP-20260915-001-002",
        "status": "resolved",
        "outcome": "独立新事情台及集成已实现并验证",
        "reason": "全部旧入口保留，最终原型细节有实现和验证映射。",
        "evidence": [
          "arckit/cases/evidence/CASE-20260915-001/verification.md",
          "arckit/cases/evidence/CASE-20260915-001/acceptance-matrix.md",
          "arckit/spec/agentic-software-development/arcorbit-project-workbench.md",
          "arckit/interaction/project-workbench/interaction.md",
          "arckit/tech/arcorbit/project-workbench-solution.md"
        ],
        "occurred_at": "2026-09-15T19:20:00.747Z"
      }
    },
    {
      "id": "CASE-20260915-001:review-finding:FINDING-20260915-001-001",
      "status": "resolved",
      "goal": "Resolve review finding: 退出远端账号必须清除新增单事情 Auto 请求，避免后续登录继承旧授权。",
      "reason": "error found by completion review",
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
        "runtime/arcorbit/src/automation-coordinator.mjs",
        "arckit/cases/evidence/CASE-20260915-001/completion-review-1.md"
      ],
      "resolution": {
        "id": "CASE-20260915-001:review-finding:FINDING-20260915-001-001",
        "status": "resolved",
        "outcome": "两级 Automation clearRemoteSession 均清除 requested_tasks；退出不保留旧账号的显式单事情执行授权。",
        "reason": "生产修复与针对边界的验证完成。",
        "evidence": [
          "arckit/cases/evidence/CASE-20260915-001/review-fix-1.md"
        ],
        "occurred_at": "2026-09-15T19:26:00.052Z"
      }
    },
    {
      "id": "CASE-20260915-001:review-finding:FINDING-20260915-001-002",
      "status": "resolved",
      "goal": "Resolve review finding: 为已有事情主线程提供恢复后可用的场景工具，不能只依赖 thread/start 的动态工具注册。",
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
        "runtime/arcorbit/src/workbench/agent-bridge.mjs",
        "runtime/arcorbit/adapters/codex-app-server-adapter.mjs",
        "arckit/cases/evidence/CASE-20260915-001/completion-review-1.md"
      ],
      "resolution": {
        "id": "CASE-20260915-001:review-finding:FINDING-20260915-001-002",
        "status": "resolved",
        "outcome": "同一事情工具桥新增 MCP 接口，Chat turn 与 Auto Run 都注入按账号/事情/工作区授权的 MCP 配置及环境变量；恢复已有 thread 可以发现与调用同一场景服务，无需创建替代线程。",
        "reason": "生产修复与针对边界的验证完成。",
        "evidence": [
          "arckit/cases/evidence/CASE-20260915-001/review-fix-2.md"
        ],
        "occurred_at": "2026-09-15T19:40:32.671Z"
      }
    }
  ],
  "content_revision": 4,
  "completion_review": {
    "status": "clean",
    "policy": {
      "initial_max_cycles": 3,
      "source": "Agent-selected bounded completion review; user authorizes implementation and verification",
      "snapshotted_at": "2026-09-15T18:10:36.342Z"
    },
    "additional_cycles_authorized": 0,
    "cycle_count": 2,
    "reviewed_content_revision": 4,
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
          "problem_resolution": "findings",
          "verification_credibility": "clean",
          "regression_risk": "findings",
          "minimality": "clean"
        },
        "finding_ids": [
          "FINDING-20260915-001-001",
          "FINDING-20260915-001-002"
        ],
        "evidence": [
          "arckit/cases/evidence/CASE-20260915-001/completion-review-1.md"
        ],
        "occurred_at": "2026-09-15T19:24:19.427Z"
      },
      {
        "cycle": 2,
        "autonomous_cycle": 2,
        "reviewer": "agent",
        "outcome": "clean",
        "content_revision": 4,
        "dimensions": {
          "implementation_correctness": "clean",
          "problem_resolution": "clean",
          "verification_credibility": "clean",
          "regression_risk": "clean",
          "minimality": "clean"
        },
        "finding_ids": [],
        "evidence": [
          "arckit/cases/evidence/CASE-20260915-001/completion-review-2.md"
        ],
        "occurred_at": "2026-09-15T19:42:16.227Z"
      }
    ],
    "evidence": [
      "arckit/cases/evidence/CASE-20260915-001/completion-review-1.md",
      "arckit/cases/evidence/CASE-20260915-001/completion-review-2.md"
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
      "goal": "将最终已确认原型与过渡要求汇总为完整、可逐项追踪的实施验收基线。",
      "outcome": "completed",
      "gap_selection": {
        "mode": "candidate",
        "basis": "当前明确实施授权优先；基线防遗漏是已选择缺口",
        "snapshot_token": "441bfed74135c9c20c256c13301fd921247cd3f70b1b1f71976a881b3e86cd89",
        "selected_ref": "case-gap:CASE-20260915-001:GAP-20260915-001-001",
        "comparison_summary": "比较全部七项，选择本 Case 基线，四项长期项目风险及两项旧人工授权缺口延期。",
        "fresh_discovery_summary": "基线发现生产新页面和共享业务主会话尚未实现，作为剩余 gap 记录。",
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
            "reason": "属于长期项目验证或旧人工决定，不阻止此次基线汇总"
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
            "reason": "属于长期项目验证或旧人工决定，不阻止此次基线汇总"
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
            "reason": "属于长期项目验证或旧人工决定，不阻止此次基线汇总"
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
            "reason": "属于长期项目验证或旧人工决定，不阻止此次基线汇总"
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
            "reason": "属于长期项目验证或旧人工决定，不阻止此次基线汇总"
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
            "reason": "属于长期项目验证或旧人工决定，不阻止此次基线汇总"
          },
          {
            "ref": "case-gap:CASE-20260915-001:GAP-20260915-001-001",
            "source": "persisted",
            "eligibility": "ready",
            "disposition": "selected",
            "priority_basis": {
              "blocking": "后续独立新页面实现必须明确保留哪些行为与边界",
              "uncertainty": "",
              "risk": "",
              "user_impact": "防止新旧过渡丢失已有能力"
            },
            "reason": "当前用户范围内的先决验收基线"
          }
        ]
      },
      "selected_gap": {
        "id": "GAP-20260915-001-001",
        "responsibility": "agent",
        "goal": "将最终已确认原型与过渡要求汇总为完整、可逐项追踪的实施验收基线。",
        "reason": "当前只有迭代原型和讨论，缺少防止功能、状态、恢复和旧页面入口遗漏的统一基线。",
        "derived_from": [
          "FACT-20260915-001-001"
        ],
        "blocked_by": [],
        "priority_basis": {
          "blocking": "后续独立新页面实现必须明确保留哪些行为与边界",
          "uncertainty": "",
          "risk": "",
          "user_impact": "防止新旧过渡丢失已有能力"
        },
        "evidence_required": [
          "覆盖最终原型所有可见动作、状态与恢复的验收清单",
          "明确新旧页面隔离和全部旧导航可达的正式预期"
        ]
      },
      "planned_transition": {
        "goal": "将最终已确认原型与过渡要求汇总为完整、可逐项追踪的实施验收基线。",
        "expected_state_change": "正式规格和交互事实可恢复，详细清单覆盖最终原型"
      },
      "accepted_state_delta": {
        "resolved_gap": {
          "id": "GAP-20260915-001-001",
          "status": "resolved",
          "outcome": "基线已记录",
          "reason": "规格、交互状态及验收矩阵覆盖新旧过渡和最终原型",
          "evidence": [
            "arckit/spec/agentic-software-development/arcorbit-project-workbench.md",
            "arckit/interaction/project-workbench/interaction.md",
            "arckit/interaction/project-workbench/default.html",
            "arckit/cases/evidence/CASE-20260915-001/acceptance-matrix.md"
          ]
        },
        "facts_added": [
          {
            "id": "FACT-20260915-001-002",
            "revision": 1,
            "status": "accepted",
            "statement": "最终原型已汇总为独立新事情台规格、交互状态投影与逐项验收清单；生产实现尚未连接新交互与共享业务能力。",
            "basis": "读取最终原型与当前生产入口、Chat 和 Automation 协调器。",
            "evidence": [
              "arckit/spec/agentic-software-development/arcorbit-project-workbench.md",
              "arckit/interaction/project-workbench/interaction.md",
              "arckit/interaction/project-workbench/default.html",
              "arckit/cases/evidence/CASE-20260915-001/acceptance-matrix.md"
            ]
          }
        ],
        "facts_superseded": [],
        "impacts_added": [],
        "impacts_updated": [],
        "gaps_added": [
          {
            "id": "GAP-20260915-001-002",
            "status": "open",
            "goal": "实现并验证独立的新事情台及其真实业务、主会话和 Agent 能力集成，保留所有旧页面。",
            "reason": "验收基线已明确，但目前生产壳仍以旧导航与分离 Chat/Work/Automation 为主，缺少新页面及共享场景状态。",
            "derived_from": [
              "FACT-20260915-001-002"
            ],
            "blocked_by": [],
            "priority_basis": {
              "user_impact": "用户明确要求完整实施",
              "risk": "保持旧页面业务和同事情串行线程约束"
            },
            "responsibility": "agent",
            "evidence_required": [
              "验收矩阵逐项对应真实实现与测试",
              "新旧页面导航及真实命令边界回归证据"
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
        "evidence": [
          "arckit/spec/agentic-software-development/arcorbit-project-workbench.md",
          "arckit/interaction/project-workbench/interaction.md",
          "arckit/interaction/project-workbench/default.html",
          "arckit/cases/evidence/CASE-20260915-001/acceptance-matrix.md"
        ]
      },
      "invariant_assessment": {
        "project_revision": 383,
        "judgments": [
          {
            "invariant_ref": "product-expectations-remain-recoverable",
            "disposition": "upheld",
            "reason": "本轮通过可追溯规格、交互投影及原型来源保留当前期望和架构边界",
            "fact_refs": [
              "FACT-20260915-001-002"
            ],
            "evidence": [
              "arckit/spec/agentic-software-development/arcorbit-project-workbench.md",
              "arckit/interaction/project-workbench/interaction.md",
              "arckit/interaction/project-workbench/default.html",
              "arckit/cases/evidence/CASE-20260915-001/acceptance-matrix.md"
            ],
            "gap_refs": []
          },
          {
            "invariant_ref": "interaction-expectations-remain-recoverable",
            "disposition": "upheld",
            "reason": "本轮通过可追溯规格、交互投影及原型来源保留当前期望和架构边界",
            "fact_refs": [
              "FACT-20260915-001-002"
            ],
            "evidence": [
              "arckit/spec/agentic-software-development/arcorbit-project-workbench.md",
              "arckit/interaction/project-workbench/interaction.md",
              "arckit/interaction/project-workbench/default.html",
              "arckit/cases/evidence/CASE-20260915-001/acceptance-matrix.md"
            ],
            "gap_refs": []
          },
          {
            "invariant_ref": "visual-language-remains-consistent",
            "disposition": "upheld",
            "reason": "本轮通过可追溯规格、交互投影及原型来源保留当前期望和架构边界",
            "fact_refs": [
              "FACT-20260915-001-002"
            ],
            "evidence": [
              "arckit/spec/agentic-software-development/arcorbit-project-workbench.md",
              "arckit/interaction/project-workbench/interaction.md",
              "arckit/interaction/project-workbench/default.html",
              "arckit/cases/evidence/CASE-20260915-001/acceptance-matrix.md"
            ],
            "gap_refs": []
          },
          {
            "invariant_ref": "technical-decisions-remain-explainable",
            "disposition": "upheld",
            "reason": "本轮通过可追溯规格、交互投影及原型来源保留当前期望和架构边界",
            "fact_refs": [
              "FACT-20260915-001-002"
            ],
            "evidence": [
              "arckit/spec/agentic-software-development/arcorbit-project-workbench.md",
              "arckit/interaction/project-workbench/interaction.md",
              "arckit/interaction/project-workbench/default.html",
              "arckit/cases/evidence/CASE-20260915-001/acceptance-matrix.md"
            ],
            "gap_refs": []
          },
          {
            "invariant_ref": "accepted-facts-are-realized",
            "disposition": "undetermined",
            "reason": "当前仅完成基线；真实实现及回归证据由开放缺口承担",
            "fact_refs": [
              "FACT-20260915-001-002"
            ],
            "evidence": [
              "arckit/spec/agentic-software-development/arcorbit-project-workbench.md",
              "arckit/interaction/project-workbench/interaction.md",
              "arckit/interaction/project-workbench/default.html",
              "arckit/cases/evidence/CASE-20260915-001/acceptance-matrix.md"
            ],
            "gap_refs": [
              "GAP-20260915-001-002"
            ]
          },
          {
            "invariant_ref": "material-risks-have-credible-evidence",
            "disposition": "undetermined",
            "reason": "当前仅完成基线；真实实现及回归证据由开放缺口承担",
            "fact_refs": [
              "FACT-20260915-001-002"
            ],
            "evidence": [
              "arckit/spec/agentic-software-development/arcorbit-project-workbench.md",
              "arckit/interaction/project-workbench/interaction.md",
              "arckit/interaction/project-workbench/default.html",
              "arckit/cases/evidence/CASE-20260915-001/acceptance-matrix.md"
            ],
            "gap_refs": [
              "GAP-20260915-001-002"
            ]
          }
        ]
      },
      "evidence": [
        "arckit/spec/agentic-software-development/arcorbit-project-workbench.md",
        "arckit/interaction/project-workbench/interaction.md",
        "arckit/interaction/project-workbench/default.html",
        "arckit/cases/evidence/CASE-20260915-001/acceptance-matrix.md"
      ],
      "runtime_result_ref": "",
      "occurred_at": "2026-09-15T18:17:42.971Z"
    },
    {
      "round": 2,
      "transition_schema_version": "arckit-case-transition/v8",
      "goal": "实现并验证独立的新事情台及其真实业务、主会话和 Agent 能力集成，保留所有旧页面。",
      "outcome": "completed",
      "gap_selection": {
        "mode": "candidate",
        "basis": "用户授权完整实现最终事情台，当前唯一未闭合的该事项实施义务。",
        "snapshot_token": "2f8cdf2043985abd433290cab1adb3896aca1d330f113f3c7e729d38e737c881",
        "selected_ref": "case-gap:CASE-20260915-001:GAP-20260915-001-002",
        "comparison_summary": "4 项长期 Project 验证与 2 项历史人工决定不属于本次实施；并行 YOLO 事项独立推进；选择新事情台实施。",
        "fresh_discovery_summary": "逐项检查发现的属性/加载/消息来源细节已在本实施缺口内修正，没有新增独立事项。",
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
            "reason": "独立长期/历史/并行事项，不扩大当前授权范围。"
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
            "reason": "独立长期/历史/并行事项，不扩大当前授权范围。"
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
            "reason": "独立长期/历史/并行事项，不扩大当前授权范围。"
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
            "reason": "独立长期/历史/并行事项，不扩大当前授权范围。"
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
            "reason": "独立长期/历史/并行事项，不扩大当前授权范围。"
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
            "reason": "独立长期/历史/并行事项，不扩大当前授权范围。"
          },
          {
            "ref": "case-gap:CASE-20260915-001:GAP-20260915-001-002",
            "source": "persisted",
            "eligibility": "ready",
            "disposition": "selected",
            "priority_basis": {
              "blocking": "",
              "uncertainty": "",
              "risk": "保持旧页面业务和同事情串行线程约束",
              "user_impact": "用户明确要求完整实施"
            },
            "reason": "当前用户事情台实施范围与验收直接依赖。"
          },
          {
            "ref": "case-gap:CASE-20260915-002:GAP-20260915-002-002",
            "source": "persisted",
            "eligibility": "ready",
            "disposition": "deferred",
            "priority_basis": {
              "blocking": "",
              "uncertainty": "",
              "risk": "关闭后不得遗留全权限",
              "user_impact": "各入口一致生效"
            },
            "reason": "独立长期/历史/并行事项，不扩大当前授权范围。"
          }
        ]
      },
      "selected_gap": {
        "id": "GAP-20260915-001-002",
        "responsibility": "agent",
        "goal": "实现并验证独立的新事情台及其真实业务、主会话和 Agent 能力集成，保留所有旧页面。",
        "reason": "验收基线已明确，但目前生产壳仍以旧导航与分离 Chat/Work/Automation 为主，缺少新页面及共享场景状态。",
        "derived_from": [
          "FACT-20260915-001-002"
        ],
        "blocked_by": [],
        "priority_basis": {
          "blocking": "",
          "uncertainty": "",
          "risk": "保持旧页面业务和同事情串行线程约束",
          "user_impact": "用户明确要求完整实施"
        },
        "evidence_required": [
          "验收矩阵逐项对应真实实现与测试",
          "新旧页面导航及真实命令边界回归证据"
        ]
      },
      "planned_transition": {
        "goal": "实现并验证独立的新事情台及其真实业务、主会话和 Agent 能力集成，保留所有旧页面。",
        "expected_state_change": "独立事情台、共享场景/主线程和真实业务工具已实现并完成范围内验证。"
      },
      "accepted_state_delta": {
        "resolved_gap": {
          "id": "GAP-20260915-001-002",
          "status": "resolved",
          "outcome": "独立新事情台及集成已实现并验证",
          "reason": "全部旧入口保留，最终原型细节有实现和验证映射。",
          "evidence": [
            "arckit/cases/evidence/CASE-20260915-001/verification.md",
            "arckit/cases/evidence/CASE-20260915-001/acceptance-matrix.md",
            "arckit/spec/agentic-software-development/arcorbit-project-workbench.md",
            "arckit/interaction/project-workbench/interaction.md",
            "arckit/tech/arcorbit/project-workbench-solution.md"
          ]
        },
        "facts_added": [
          {
            "id": "FACT-20260915-001-003",
            "revision": 1,
            "status": "accepted",
            "statement": "独立生产事情台已成为默认入口并保留 11 个旧业务页面；任务/附件、持久场景、同事情主线程、显式单事情 Auto 和受约束 Agent 工具已经接入原服务。全量 789 项 0 失败，后续定向 168 项和最后 13 项通过，Electron 11 组验证通过。未声称真实远端写入或计费模型端到端验证。",
            "basis": "本次生产实现、确定性测试与生产 Renderer 隔离验证。",
            "evidence": [
              "arckit/cases/evidence/CASE-20260915-001/verification.md",
              "arckit/cases/evidence/CASE-20260915-001/acceptance-matrix.md",
              "arckit/spec/agentic-software-development/arcorbit-project-workbench.md",
              "arckit/interaction/project-workbench/interaction.md",
              "arckit/tech/arcorbit/project-workbench-solution.md"
            ]
          }
        ],
        "facts_superseded": [],
        "impacts_added": [
          {
            "id": "IMPACT-20260915-001-001",
            "fact_id": "FACT-20260915-001-003",
            "fact_revision": 1,
            "target": {
              "kind": "software_decision",
              "ref": "product_intent_and_scope",
              "revision": 6
            },
            "effect": "upheld",
            "reason": "新事情台实现与保留旧业务形成稳定架构/交互事实。",
            "gap_ids": [],
            "evidence": [
              "arckit/cases/evidence/CASE-20260915-001/verification.md",
              "arckit/cases/evidence/CASE-20260915-001/acceptance-matrix.md",
              "arckit/spec/agentic-software-development/arcorbit-project-workbench.md",
              "arckit/interaction/project-workbench/interaction.md",
              "arckit/tech/arcorbit/project-workbench-solution.md"
            ]
          },
          {
            "id": "IMPACT-20260915-001-002",
            "fact_id": "FACT-20260915-001-003",
            "fact_revision": 1,
            "target": {
              "kind": "software_decision",
              "ref": "product_capabilities",
              "revision": 49
            },
            "effect": "upheld",
            "reason": "新事情台实现与保留旧业务形成稳定架构/交互事实。",
            "gap_ids": [],
            "evidence": [
              "arckit/cases/evidence/CASE-20260915-001/verification.md",
              "arckit/cases/evidence/CASE-20260915-001/acceptance-matrix.md",
              "arckit/spec/agentic-software-development/arcorbit-project-workbench.md",
              "arckit/interaction/project-workbench/interaction.md",
              "arckit/tech/arcorbit/project-workbench-solution.md"
            ]
          },
          {
            "id": "IMPACT-20260915-001-003",
            "fact_id": "FACT-20260915-001-003",
            "fact_revision": 1,
            "target": {
              "kind": "software_decision",
              "ref": "experience_and_interaction",
              "revision": 72
            },
            "effect": "upheld",
            "reason": "新事情台实现与保留旧业务形成稳定架构/交互事实。",
            "gap_ids": [],
            "evidence": [
              "arckit/cases/evidence/CASE-20260915-001/verification.md",
              "arckit/cases/evidence/CASE-20260915-001/acceptance-matrix.md",
              "arckit/spec/agentic-software-development/arcorbit-project-workbench.md",
              "arckit/interaction/project-workbench/interaction.md",
              "arckit/tech/arcorbit/project-workbench-solution.md"
            ]
          },
          {
            "id": "IMPACT-20260915-001-004",
            "fact_id": "FACT-20260915-001-003",
            "fact_revision": 1,
            "target": {
              "kind": "software_decision",
              "ref": "visual_language",
              "revision": 6
            },
            "effect": "upheld",
            "reason": "新事情台实现与保留旧业务形成稳定架构/交互事实。",
            "gap_ids": [],
            "evidence": [
              "arckit/cases/evidence/CASE-20260915-001/verification.md",
              "arckit/cases/evidence/CASE-20260915-001/acceptance-matrix.md",
              "arckit/spec/agentic-software-development/arcorbit-project-workbench.md",
              "arckit/interaction/project-workbench/interaction.md",
              "arckit/tech/arcorbit/project-workbench-solution.md"
            ]
          },
          {
            "id": "IMPACT-20260915-001-005",
            "fact_id": "FACT-20260915-001-003",
            "fact_revision": 1,
            "target": {
              "kind": "software_decision",
              "ref": "data_and_state",
              "revision": 27
            },
            "effect": "upheld",
            "reason": "新事情台实现与保留旧业务形成稳定架构/交互事实。",
            "gap_ids": [],
            "evidence": [
              "arckit/cases/evidence/CASE-20260915-001/verification.md",
              "arckit/cases/evidence/CASE-20260915-001/acceptance-matrix.md",
              "arckit/spec/agentic-software-development/arcorbit-project-workbench.md",
              "arckit/interaction/project-workbench/interaction.md",
              "arckit/tech/arcorbit/project-workbench-solution.md"
            ]
          },
          {
            "id": "IMPACT-20260915-001-006",
            "fact_id": "FACT-20260915-001-003",
            "fact_revision": 1,
            "target": {
              "kind": "software_decision",
              "ref": "external_integrations",
              "revision": 20
            },
            "effect": "upheld",
            "reason": "新事情台实现与保留旧业务形成稳定架构/交互事实。",
            "gap_ids": [],
            "evidence": [
              "arckit/cases/evidence/CASE-20260915-001/verification.md",
              "arckit/cases/evidence/CASE-20260915-001/acceptance-matrix.md",
              "arckit/spec/agentic-software-development/arcorbit-project-workbench.md",
              "arckit/interaction/project-workbench/interaction.md",
              "arckit/tech/arcorbit/project-workbench-solution.md"
            ]
          },
          {
            "id": "IMPACT-20260915-001-007",
            "fact_id": "FACT-20260915-001-003",
            "fact_revision": 1,
            "target": {
              "kind": "software_decision",
              "ref": "technical_foundation",
              "revision": 50
            },
            "effect": "upheld",
            "reason": "新事情台实现与保留旧业务形成稳定架构/交互事实。",
            "gap_ids": [],
            "evidence": [
              "arckit/cases/evidence/CASE-20260915-001/verification.md",
              "arckit/cases/evidence/CASE-20260915-001/acceptance-matrix.md",
              "arckit/spec/agentic-software-development/arcorbit-project-workbench.md",
              "arckit/interaction/project-workbench/interaction.md",
              "arckit/tech/arcorbit/project-workbench-solution.md"
            ]
          }
        ],
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
        "software_definition_changes": [
          {
            "area_ref": "product_intent_and_scope",
            "observed_revision": 5,
            "set_decision": {
              "status": "settled",
              "statement": "Arckit is the repository-owned development protocol and skill system; ArcOrbit is its supervised Desktop/Runtime product and is expanding into a local-project-anchored, multi-product software-development platform for people who coordinate organization, product, member, todo, AI execution, and feedback work without relying on the Todo or Feedback web clients for daily operation. Product 保持产品资料推进能力；Product/Idea 能力保持既有边界。 Release 提供真实本地终端、原生 Git、源码编辑、构建运行及复用 Chat/Idea 的场景 Agent，消费既有工作区绑定；以 arcorbit-release-workspace.md 与 release-workspace-solution.md 为准，外部渠道和监控仍依实际 adapter。 ArcOrbit 的默认主工作入口更新为项目事情台，以项目范围内持续存在的事情承载目标表达、检查成果、处理例外和改变方向；Product 等旧业务仍通过统一二级菜单完整访问。",
              "reason": "用户确认最终项目事情台并授权独立实现及保留全部旧入口；生产代码和验证兑现本次变化。",
              "evidence": [
                "arckit/spec/agentic-software-development/arcorbit-platform-capabilities.md",
                "arckit/pending/prototypes/arcorbit-platform-next/README.md",
                "arckit/spec/agentic-software-development/arcorbit-product-management.md",
                "arckit/spec/agentic-software-development/arcorbit-planned-workspaces.md",
                "runtime/arcorbit/src/chat-coordinator.mjs",
                "runtime/arcorbit/src/platform-coordinator.mjs",
                "arckit/spec/agentic-software-development/arcorbit-release-workspace.md",
                "arckit/tech/arcorbit/release-workspace-solution.md",
                "arckit/interaction/release-workspace/interaction.md",
                "arckit/interaction/release-workspace/default.html",
                "arckit/cases/evidence/CASE-20260915-001/verification.md",
                "arckit/cases/evidence/CASE-20260915-001/acceptance-matrix.md",
                "arckit/spec/agentic-software-development/arcorbit-project-workbench.md",
                "arckit/interaction/project-workbench/interaction.md",
                "arckit/tech/arcorbit/project-workbench-solution.md"
              ],
              "confidence": "high",
              "resume_condition": "Revisit only if the server ownership boundary or protected ArcOrbit Runtime semantics change. 事情身份、主会话、场景所有权或新旧导航边界变化时重审。"
            },
            "gap_refs": [],
            "reason": "新事情台已实现且旧业务隔离保留。",
            "evidence": [
              "arckit/cases/evidence/CASE-20260915-001/verification.md",
              "arckit/cases/evidence/CASE-20260915-001/acceptance-matrix.md",
              "arckit/spec/agentic-software-development/arcorbit-project-workbench.md",
              "arckit/interaction/project-workbench/interaction.md",
              "arckit/tech/arcorbit/project-workbench-solution.md"
            ]
          },
          {
            "area_ref": "product_capabilities",
            "observed_revision": 48,
            "set_decision": {
              "status": "settled",
              "statement": "ArcOrbit 保留既有 Desktop、Runtime、Chat、Automation、Feedback、Work、Setup、Today、Product/Idea 与 Release 能力及既有边界。ArcOrbit 账号与 Runtime 设置分别维护当前设备 Chat 与 Automation 的 Codex Model/Level 默认值：动态候选来自当前 Codex，四个字段始终可人工输入；查询失败或未知当前值不阻止保存。两组缺省均为 gpt-6-astra / high，旧单组有效值迁移为两组初始值，随后独立保存。新 Chat 会话继承 Chat 默认值并可在 Composer 快速调整当前会话后续消息；Automation Run 只读取 Automation 默认值。已接受 Chat turn 与已启动 Run 固定配置，Chat 保持原 thread，任一场景调整不污染另一场景。Engineering 是高密度 ArcOrbit 内置 Skills 安装后管理页面，只管理可信随包 Skills 在 Chat 与 Automation 的使用方式；用户级、项目级、其他 catalog 和本地目录 Skills 不显示且不能通过 Engineering 操作。Setup Readiness 继续独占内置 Skills 的安装、更新、漂移恢复和清理。其他既有 Work、Feedback、Project Catalog、本地工作区绑定、Automation participation、Codex Setup、Today、Product/Idea 与 Release 契约保持不变。 ArcOrbit 各处 Agent 执行统一受设备级 settings.codex.yolo_mode 显式开关控制，缺省关闭；开启跳过审批并解除 Codex 沙箱，后续消息、新 Run 和终端接力捕获，关闭恢复场景策略；业务授权和托管权限上限保持有效。 新增独立项目事情台：创建自分配待评审事情、先讨论或直接单事情 Auto、运行中消息介入与暂停讨论、结构化约定/标准/报告/上下文、成果检查与验收；旧业务能力保留。场景/软件能力工具复用原业务协调器，身份删除/跨项目替换仍走旧页面。",
              "reason": "用户确认最终项目事情台并授权独立实现及保留全部旧入口；生产代码和验证兑现本次变化。",
              "evidence": [
                "arckit/spec/agentic-software-development/arcorbit-scene-skills.md",
                "arckit/spec/agentic-software-development/arcorbit-planned-workspaces.md",
                "arckit/spec/agentic-software-development/arcorbit-platform-capabilities.md",
                "arckit/spec/arcorbit-distribution.md",
                "runtime/arcorbit/src/scene-skill-manager.mjs",
                "arckit/cases/evidence/CASE-20260912-002/verification.md",
                "arckit/cases/evidence/arcorbit-yolo/contract.md",
                "arckit/cases/evidence/CASE-20260915-001/verification.md",
                "arckit/cases/evidence/CASE-20260915-001/acceptance-matrix.md",
                "arckit/spec/agentic-software-development/arcorbit-project-workbench.md",
                "arckit/interaction/project-workbench/interaction.md",
                "arckit/tech/arcorbit/project-workbench-solution.md"
              ],
              "confidence": "high",
              "resume_condition": "当 Engineering 的管理对象、内置身份来源、Setup 所有权或 Chat/Automation 场景模式改变时重审。 事情身份、主会话、场景所有权或新旧导航边界变化时重审。"
            },
            "gap_refs": [
              "GAP-agent-scenario-evaluation"
            ],
            "reason": "新事情台已实现且旧业务隔离保留。",
            "evidence": [
              "arckit/cases/evidence/CASE-20260915-001/verification.md",
              "arckit/cases/evidence/CASE-20260915-001/acceptance-matrix.md",
              "arckit/spec/agentic-software-development/arcorbit-project-workbench.md",
              "arckit/interaction/project-workbench/interaction.md",
              "arckit/tech/arcorbit/project-workbench-solution.md"
            ]
          },
          {
            "area_ref": "experience_and_interaction",
            "observed_revision": 71,
            "set_decision": {
              "status": "settled",
              "statement": "ArcOrbit 的旧业务页面保留既有交互及恢复语义。账号设置覆盖层为 Chat 与 Automation 分别提供可编辑 Model 和 Level 候选输入，Chat Composer 在输入框附近显示并调整当前会话后续消息所用 Model/Level，保存、失败恢复、thread 连续与场景隔离保持既有契约。Engineering 以“内置 Skills”明确范围，在首屏紧凑呈现场景、生效时机、内置总数、直接发现、按需使用、已停用、搜索、状态筛选和三列列表；用户在行内调整内置 Skill 使用方式并接收原位反馈。Automation 核心可见且锁定；搜索与状态可组合并一键清除；刷新或保存失败保留最近可信列表、场景和筛选；窄窗口按两列及单列降级且保持键盘焦点。用户自行安装的 Skills 不进入页面列表、计数、错误或操作，Chat 返回保留原会话与草稿。其他既有 Work Inspector、验收、Setup、Feedback、Today、项目绑定、Product/Idea 与 Release 交互契约保持不变。 ArcOrbit 各处 Agent 执行统一受设备级 settings.codex.yolo_mode 显式开关控制，缺省关闭；开启跳过审批并解除 Codex 沙箱，后续消息、新 Run 和终端接力捕获，关闭恢复场景策略；业务授权和托管权限上限保持有效。 新默认事情台使用左项目范围、右单行列表及底部唯一创建、中央紧凑详情四类别与底部输入；消息默认隐藏并按需在中央覆盖，右列表可操作。运行状态弹层跨项目定位，逐事情草稿/阅读位置保留，760 抽屉、390 无横向溢出。旧 11 个页面入口统一收纳于“全部页面”二级菜单，其业务页面不重写。",
              "reason": "用户确认最终项目事情台并授权独立实现及保留全部旧入口；生产代码和验证兑现本次变化。",
              "evidence": [
                "arckit/interaction/engineering-profile/interaction.md",
                "arckit/interaction/engineering-profile/default.html",
                "runtime/arcorbit/desktop/renderer/engineering-surface.mjs",
                "runtime/arcorbit/desktop/renderer/engineering.css",
                "runtime/arcorbit/test/engineering-surface.test.mjs",
                "runtime/arcorbit/test/fixtures/engineering-electron.mjs",
                "arckit/cases/evidence/arcorbit-yolo/contract.md",
                "arckit/cases/evidence/CASE-20260915-001/verification.md",
                "arckit/cases/evidence/CASE-20260915-001/acceptance-matrix.md",
                "arckit/spec/agentic-software-development/arcorbit-project-workbench.md",
                "arckit/interaction/project-workbench/interaction.md",
                "arckit/tech/arcorbit/project-workbench-solution.md"
              ],
              "confidence": "high",
              "resume_condition": "当 Engineering 信息层级、筛选、场景生效时机、失败恢复、键盘/窄窗行为或非内置隔离边界改变时重审。 事情身份、主会话、场景所有权或新旧导航边界变化时重审。"
            },
            "gap_refs": [],
            "reason": "新事情台已实现且旧业务隔离保留。",
            "evidence": [
              "arckit/cases/evidence/CASE-20260915-001/verification.md",
              "arckit/cases/evidence/CASE-20260915-001/acceptance-matrix.md",
              "arckit/spec/agentic-software-development/arcorbit-project-workbench.md",
              "arckit/interaction/project-workbench/interaction.md",
              "arckit/tech/arcorbit/project-workbench-solution.md"
            ]
          },
          {
            "area_ref": "visual_language",
            "observed_revision": 5,
            "set_decision": {
              "status": "settled",
              "statement": "Visual requirements apply to the Desktop workspace and follow its durable visual specification; CLI and ledger surfaces remain text-native. ArcOrbit 主窗口保持既有单一应用标题栏和平台原生窗口控件差异。Work Inspector 使用既有中性表面、8px 间距节奏、标题层级和可见焦点表达身份动作、内容、紧凑属性、协作和验收分区；分区不只依赖单条顶边，属性在可用宽度下优先两列并在窄宽度降为单列。 新事情台沿用现有主题；200px 项目栏、325px 右列表、44px 单行、紧凑标题与四类别、局部消息覆盖。新页面窄窗允许 390px 布局，旧页面保持原窗口边界；不引入演示数据或演示文案。",
              "reason": "用户确认最终项目事情台并授权独立实现及保留全部旧入口；生产代码和验证兑现本次变化。",
              "evidence": [
                "arckit/visual/_library/brief.md",
                "arckit/interaction/task-browser/daily-work.html",
                "arckit/interaction/wireframe-style.css",
                "arckit/cases/evidence/CASE-20260915-001/verification.md",
                "arckit/cases/evidence/CASE-20260915-001/acceptance-matrix.md",
                "arckit/spec/agentic-software-development/arcorbit-project-workbench.md",
                "arckit/interaction/project-workbench/interaction.md",
                "arckit/tech/arcorbit/project-workbench-solution.md"
              ],
              "confidence": "high",
              "resume_condition": "当平台 chrome 策略或 Work Inspector 表面、间距、焦点、属性列与分区层级改变时重审。 事情身份、主会话、场景所有权或新旧导航边界变化时重审。"
            },
            "gap_refs": [],
            "reason": "新事情台已实现且旧业务隔离保留。",
            "evidence": [
              "arckit/cases/evidence/CASE-20260915-001/verification.md",
              "arckit/cases/evidence/CASE-20260915-001/acceptance-matrix.md",
              "arckit/spec/agentic-software-development/arcorbit-project-workbench.md",
              "arckit/interaction/project-workbench/interaction.md",
              "arckit/tech/arcorbit/project-workbench-solution.md"
            ]
          },
          {
            "area_ref": "data_and_state",
            "observed_revision": 26,
            "set_decision": {
              "status": "settled",
              "statement": "Canonical development state、Workshop 远端真相、ArcOrbit Task Projection、Automation execution、Chat session/thread、Case 绑定收据及其他既有 Desktop 控制事实继续保持原所有权边界。Desktop Store 独占当前设备 `settings.codex.chat.{model,reasoning_effort}` 与 `settings.codex.automation.{model,reasoning_effort}`；旧平铺 `settings.codex.model/reasoning_effort` 的有效值迁移为两组初始值。缺失或非法字段分别归一化为 gpt-6-astra / high，保存 patch 去除首尾空白、拒绝空值、控制字符及超过 200 字符的值，并允许未知模型和级别。Chat session 与未发送草稿持有自身 model/reasoning_effort，新会话从 Chat 默认值继承；更新一个场景、无关设置及重启保留其他有效用户值，不改写用户全局 Codex 配置。Automation Run 保存启动时的 Automation model/effort；已接受 Chat turn 使用发送边界捕获的会话配置。模型清单不是持久事实源，Renderer 只投影和提交这些 Desktop 控制事实。其他既有 Inspector 偏好、Setup recovery、Project Catalog、Workspace Control、Task Readiness、Idea 与 Release 数据边界保持不变。 ArcOrbit 各处 Agent 执行统一受设备级 settings.codex.yolo_mode 显式开关控制，缺省关闭；开启跳过审批并解除 Codex 沙箱，后续消息、新 Run 和终端接力捕获，关闭恢复场景策略；业务授权和托管权限上限保持有效。 事情台共享任务及附件依然属于 Workshop；计划、约定、标准、上下文选择和报告保存在账号隔离的本机场景，revision 和请求收据保护修改。目标变化使检查失效。事情主 session/thread 在 Chat 与 Auto 间复用，互斥保证同事情串行；requested_tasks 表达只启动当前事情的显式请求。",
              "reason": "用户确认最终项目事情台并授权独立实现及保留全部旧入口；生产代码和验证兑现本次变化。",
              "evidence": [
                "arckit/tech/arcorbit/desktop-execution-solution.md",
                "runtime/arcorbit/src/codex-model-settings.mjs",
                "runtime/arcorbit/src/desktop/desktop-store.mjs",
                "runtime/arcorbit/src/chat-coordinator.mjs",
                "runtime/arcorbit/src/desktop-run-manager.mjs",
                "runtime/arcorbit/test/codex-model-settings.test.mjs",
                "arckit/cases/evidence/CASE-20260912-001/verification.md",
                "arckit/cases/evidence/arcorbit-yolo/contract.md",
                "arckit/cases/evidence/CASE-20260915-001/verification.md",
                "arckit/cases/evidence/CASE-20260915-001/acceptance-matrix.md",
                "arckit/spec/agentic-software-development/arcorbit-project-workbench.md",
                "arckit/interaction/project-workbench/interaction.md",
                "arckit/tech/arcorbit/project-workbench-solution.md"
              ],
              "confidence": "high",
              "resume_condition": "当 Desktop Store schema、Chat session/draft 所有权、Automation Run 固定参数或模型清单所有权改变时重审。 事情身份、主会话、场景所有权或新旧导航边界变化时重审。"
            },
            "gap_refs": [
              "GAP-cross-record-audit"
            ],
            "reason": "新事情台已实现且旧业务隔离保留。",
            "evidence": [
              "arckit/cases/evidence/CASE-20260915-001/verification.md",
              "arckit/cases/evidence/CASE-20260915-001/acceptance-matrix.md",
              "arckit/spec/agentic-software-development/arcorbit-project-workbench.md",
              "arckit/interaction/project-workbench/interaction.md",
              "arckit/tech/arcorbit/project-workbench-solution.md"
            ]
          },
          {
            "area_ref": "external_integrations",
            "observed_revision": 19,
            "set_decision": {
              "status": "settled",
              "statement": "ArcOrbit 继续通过显式 main-process adapters 集成 Codex app-server/CLI、Workshop、Feedback、Codex Setup、Product/Idea、GitHub 与 Release 能力，并保持 Renderer 无凭据、无通用请求能力。真实 Chat 继续使用可复用的 Codex Conversation 基础层处理 app-server initialize、persistent thread start/resume、turn start/interrupt、streamed items、token usage 和 approval request；ChatCoordinator 直接提交用户文本，不调用 state-driven Runtime、trusted ledger 或 Automation Coordinator。Codex 模型清单继续由固定无参数 IPC 在主进程查询当前 active executable，失败不发布部分清单或原始错误。Chat turn 从对应 session 读取并在消息接受时固定 model/effort；Automation Run 从 `settings.codex.automation` 读取并在启动时固定。共享 adapter 的 `turn/start.model/effort` 与 CLI `--model`/`--reasoning-effort` 分别生效并保持原 thread。Composer、Chat 默认值和 Automation 默认值相互隔离；清单可见不代表执行授权。其他 Workshop、Feedback、Setup installer、Product/Idea、GitHub 与 Release adapter 契约保持不变。 ArcOrbit 各处 Agent 执行统一受设备级 settings.codex.yolo_mode 显式开关控制，缺省关闭；开启跳过审批并解除 Codex 沙箱，后续消息、新 Run 和终端接力捕获，关闭恢复场景策略；业务授权和托管权限上限保持有效。 事情场景原生动态工具与业务能力目录连接 Platform、Product、Release、Engineering、Feedback；自动 Run 使用本机 loopback 工具桥，短期令牌绑定账号/事情/工作区，退出撤销。实际操作仍执行原服务权限与必要用户确认。",
              "reason": "用户确认最终项目事情台并授权独立实现及保留全部旧入口；生产代码和验证兑现本次变化。",
              "evidence": [
                "arckit/tech/arcorbit/desktop-execution-solution.md",
                "runtime/arcorbit/src/chat-coordinator.mjs",
                "runtime/arcorbit/src/desktop-run-manager.mjs",
                "runtime/arcorbit/adapters/codex-app-server-adapter.mjs",
                "runtime/arcorbit/test/chat-coordinator.test.mjs",
                "runtime/arcorbit/test/desktop-run-manager.test.mjs",
                "arckit/cases/evidence/arcorbit-yolo/contract.md",
                "arckit/cases/evidence/CASE-20260915-001/verification.md",
                "arckit/cases/evidence/CASE-20260915-001/acceptance-matrix.md",
                "arckit/spec/agentic-software-development/arcorbit-project-workbench.md",
                "arckit/interaction/project-workbench/interaction.md",
                "arckit/tech/arcorbit/project-workbench-solution.md"
              ],
              "confidence": "high",
              "resume_condition": "当 app-server turn 参数、CLI 参数、模型清单边界或场景配置路由改变时重审。 事情身份、主会话、场景所有权或新旧导航边界变化时重审。"
            },
            "gap_refs": [
              "GAP-runtime-resilience-and-adapters"
            ],
            "reason": "新事情台已实现且旧业务隔离保留。",
            "evidence": [
              "arckit/cases/evidence/CASE-20260915-001/verification.md",
              "arckit/cases/evidence/CASE-20260915-001/acceptance-matrix.md",
              "arckit/spec/agentic-software-development/arcorbit-project-workbench.md",
              "arckit/interaction/project-workbench/interaction.md",
              "arckit/tech/arcorbit/project-workbench-solution.md"
            ]
          },
          {
            "area_ref": "technical_foundation",
            "observed_revision": 49,
            "set_decision": {
              "status": "settled",
              "statement": "Arckit and ArcOrbit retain their existing ledger, skill, Electron, Runtime, Platform Coordinator, Work Sync, Chat, Setup Readiness, trusted case-control, and repository-relative path boundaries. The public Arckit monorepo additionally owns Todo Web under apps, Feedback Console under apps, the Feedback Web SDK under packages, the shared Workshop API under services, and integration examples under examples. JavaScript surfaces use one root workspace with independent build and release entries; the Workshop API remains an independently testable Go module. Public builds and tests never require the sibling private arckit-ops workspace. Product Coordinator 属于应用层，产品资料使用版本化协议与 revision 校验，正式记录单文件原子维护。同步通过独立 Git index 和资料分支，处理并发拒绝与远端核对，不改变开发 checkout。场景会话使用应用私有固定 cwd，材料范围与正式目录分别保存；运行内核不增加技能路由或工作角色。 Release 提供真实本地终端、原生 Git、源码编辑、构建运行及复用 Chat/Idea 的场景 Agent，消费既有工作区绑定；以 arcorbit-release-workspace.md 与 release-workspace-solution.md 为准，外部渠道和监控仍依实际 adapter。 ProjectWorkbench 为独立业务协调与呈现层，复用 WorkSync、ChatCoordinator、Automation 和 Run Manager；不复制旧业务页面或 Runtime/skill 工作流。场景组件从结构化状态投影，消息从真实 turn/run 投影；Agent 只调用受约束命令，不直接操纵 DOM。",
              "reason": "用户确认最终项目事情台并授权独立实现及保留全部旧入口；生产代码和验证兑现本次变化。",
              "evidence": [
                "arckit/tech/repository-governance/monorepo-solution.md",
                "arckit/tech/arcorbit/solution.md",
                "arckit/tech/arcorbit/platform-composition-solution.md",
                "arckit/cases/evidence/CASE-20260909-001/verification.md",
                "arckit/spec/agentic-software-development/arcorbit-product-management.md",
                "arckit/tech/arcorbit/product-management-solution.md",
                "runtime/arcorbit/src/product-coordinator.mjs",
                "runtime/arcorbit/src/product-git.mjs",
                "runtime/arcorbit/desktop/renderer/product-surface.mjs",
                "runtime/arcorbit/test/product-management.test.mjs",
                "runtime/arcorbit/test/product-surface.test.mjs",
                "definition/skills/arckit-product-assets/SKILL.md",
                "arckit/spec/agentic-software-development/arcorbit-release-workspace.md",
                "arckit/tech/arcorbit/release-workspace-solution.md",
                "arckit/interaction/release-workspace/interaction.md",
                "arckit/interaction/release-workspace/default.html",
                "arckit/cases/evidence/CASE-20260915-001/verification.md",
                "arckit/cases/evidence/CASE-20260915-001/acceptance-matrix.md",
                "arckit/spec/agentic-software-development/arcorbit-project-workbench.md",
                "arckit/interaction/project-workbench/interaction.md",
                "arckit/tech/arcorbit/project-workbench-solution.md"
              ],
              "confidence": "high",
              "resume_condition": "Revisit when workspace tooling, repository-relative capability paths, or source ownership boundaries change. 事情身份、主会话、场景所有权或新旧导航边界变化时重审。"
            },
            "gap_refs": [
              "GAP-runtime-resilience-and-adapters"
            ],
            "reason": "新事情台已实现且旧业务隔离保留。",
            "evidence": [
              "arckit/cases/evidence/CASE-20260915-001/verification.md",
              "arckit/cases/evidence/CASE-20260915-001/acceptance-matrix.md",
              "arckit/spec/agentic-software-development/arcorbit-project-workbench.md",
              "arckit/interaction/project-workbench/interaction.md",
              "arckit/tech/arcorbit/project-workbench-solution.md"
            ]
          }
        ],
        "software_invariant_changes": [],
        "project_gap_changes": [],
        "selection_context_change": null,
        "evidence": [
          "arckit/cases/evidence/CASE-20260915-001/verification.md",
          "arckit/cases/evidence/CASE-20260915-001/acceptance-matrix.md",
          "arckit/spec/agentic-software-development/arcorbit-project-workbench.md",
          "arckit/interaction/project-workbench/interaction.md",
          "arckit/tech/arcorbit/project-workbench-solution.md"
        ]
      },
      "invariant_assessment": {
        "project_revision": 385,
        "judgments": [
          {
            "invariant_ref": "product-expectations-remain-recoverable",
            "disposition": "upheld",
            "reason": "规格与逐项验收矩阵记录最终能力及过渡边界。",
            "fact_refs": [
              "FACT-20260915-001-003"
            ],
            "evidence": [
              "arckit/cases/evidence/CASE-20260915-001/verification.md",
              "arckit/cases/evidence/CASE-20260915-001/acceptance-matrix.md",
              "arckit/spec/agentic-software-development/arcorbit-project-workbench.md",
              "arckit/interaction/project-workbench/interaction.md",
              "arckit/tech/arcorbit/project-workbench-solution.md"
            ],
            "gap_refs": []
          },
          {
            "invariant_ref": "interaction-expectations-remain-recoverable",
            "disposition": "upheld",
            "reason": "交互文档、独立生产页面及 Electron 实际行为一致。",
            "fact_refs": [
              "FACT-20260915-001-003"
            ],
            "evidence": [
              "arckit/cases/evidence/CASE-20260915-001/verification.md",
              "arckit/cases/evidence/CASE-20260915-001/acceptance-matrix.md",
              "arckit/spec/agentic-software-development/arcorbit-project-workbench.md",
              "arckit/interaction/project-workbench/interaction.md",
              "arckit/tech/arcorbit/project-workbench-solution.md"
            ],
            "gap_refs": []
          },
          {
            "invariant_ref": "visual-language-remains-consistent",
            "disposition": "upheld",
            "reason": "新页面沿用主题且窄窗及单行布局有实际截图。",
            "fact_refs": [
              "FACT-20260915-001-003"
            ],
            "evidence": [
              "arckit/cases/evidence/CASE-20260915-001/verification.md",
              "arckit/cases/evidence/CASE-20260915-001/acceptance-matrix.md",
              "arckit/spec/agentic-software-development/arcorbit-project-workbench.md",
              "arckit/interaction/project-workbench/interaction.md",
              "arckit/tech/arcorbit/project-workbench-solution.md"
            ],
            "gap_refs": []
          },
          {
            "invariant_ref": "technical-decisions-remain-explainable",
            "disposition": "upheld",
            "reason": "技术方案记录状态所有权、主线程及命令/工具连接。",
            "fact_refs": [
              "FACT-20260915-001-003"
            ],
            "evidence": [
              "arckit/cases/evidence/CASE-20260915-001/verification.md",
              "arckit/cases/evidence/CASE-20260915-001/acceptance-matrix.md",
              "arckit/spec/agentic-software-development/arcorbit-project-workbench.md",
              "arckit/interaction/project-workbench/interaction.md",
              "arckit/tech/arcorbit/project-workbench-solution.md"
            ],
            "gap_refs": []
          },
          {
            "invariant_ref": "accepted-facts-are-realized",
            "disposition": "upheld",
            "reason": "生产实现接入原协调器，789 项套件和后续定向验证支持实现主张。",
            "fact_refs": [
              "FACT-20260915-001-003"
            ],
            "evidence": [
              "arckit/cases/evidence/CASE-20260915-001/verification.md",
              "arckit/cases/evidence/CASE-20260915-001/acceptance-matrix.md",
              "arckit/spec/agentic-software-development/arcorbit-project-workbench.md",
              "arckit/interaction/project-workbench/interaction.md",
              "arckit/tech/arcorbit/project-workbench-solution.md"
            ],
            "gap_refs": []
          },
          {
            "invariant_ref": "material-risks-have-credible-evidence",
            "disposition": "upheld",
            "reason": "并发/账号/幂等/工具桥/旧页面回归有自动证据；线上远端调用与发布明确不声称验证。",
            "fact_refs": [
              "FACT-20260915-001-003"
            ],
            "evidence": [
              "arckit/cases/evidence/CASE-20260915-001/verification.md",
              "arckit/cases/evidence/CASE-20260915-001/acceptance-matrix.md",
              "arckit/spec/agentic-software-development/arcorbit-project-workbench.md",
              "arckit/interaction/project-workbench/interaction.md",
              "arckit/tech/arcorbit/project-workbench-solution.md"
            ],
            "gap_refs": []
          }
        ]
      },
      "evidence": [
        "arckit/cases/evidence/CASE-20260915-001/verification.md",
        "arckit/cases/evidence/CASE-20260915-001/acceptance-matrix.md",
        "arckit/spec/agentic-software-development/arcorbit-project-workbench.md",
        "arckit/interaction/project-workbench/interaction.md",
        "arckit/tech/arcorbit/project-workbench-solution.md"
      ],
      "runtime_result_ref": "",
      "occurred_at": "2026-09-15T19:20:00.747Z"
    },
    {
      "round": 3,
      "transition_schema_version": "arckit-case-transition/v8",
      "goal": "Review the completed implementation for correctness, real problem resolution, verification credibility, regression risk, and minimality.",
      "outcome": "completed",
      "gap_selection": {
        "mode": "candidate",
        "basis": "普通实施已接受，本事项唯一当前候选为完成审查。",
        "snapshot_token": "adf6f424bbda7ac4fe48d645b2f5c1a6f486161af2adcc1feb9c51310a33ea9d",
        "selected_ref": "case-gap:CASE-20260915-001:CASE-20260915-001:completion-review:1",
        "comparison_summary": "4 项长期项目验证、2 项历史人工决定与并行 YOLO 事项延期；选择本事项完成审查。",
        "fresh_discovery_summary": "审查发现退出排队请求和旧线程工具注册两个边界，需要补修。",
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
            "reason": "独立范围保持原状态。"
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
            "reason": "独立范围保持原状态。"
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
            "reason": "独立范围保持原状态。"
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
            "reason": "独立范围保持原状态。"
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
            "reason": "独立范围保持原状态。"
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
            "reason": "独立范围保持原状态。"
          },
          {
            "ref": "case-gap:CASE-20260915-001:CASE-20260915-001:completion-review:1",
            "source": "persisted",
            "eligibility": "ready",
            "disposition": "selected",
            "priority_basis": {
              "blocking": "high",
              "uncertainty": "low",
              "risk": "high",
              "user_impact": "high"
            },
            "reason": "完成当前事项所必需。"
          },
          {
            "ref": "case-gap:CASE-20260915-002:GAP-20260915-002-002",
            "source": "persisted",
            "eligibility": "ready",
            "disposition": "deferred",
            "priority_basis": {
              "blocking": "",
              "uncertainty": "",
              "risk": "关闭后不得遗留全权限",
              "user_impact": "各入口一致生效"
            },
            "reason": "独立范围保持原状态。"
          }
        ]
      },
      "selected_gap": {
        "id": "CASE-20260915-001:completion-review:1",
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
        "expected_state_change": "五维审查给出2项可执行补修义务。"
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
          "reviewed_content_revision": 2,
          "findings": [
            {
              "id": "FINDING-20260915-001-001",
              "kind": "error",
              "statement": "退出远端账号必须清除新增单事情 Auto 请求，避免后续登录继承旧授权。",
              "responsibility": "agent",
              "artifact_refs": [
                "runtime/arcorbit/src/automation-coordinator.mjs"
              ],
              "evidence": [
                "arckit/cases/evidence/CASE-20260915-001/completion-review-1.md"
              ]
            },
            {
              "id": "FINDING-20260915-001-002",
              "kind": "omission",
              "statement": "为已有事情主线程提供恢复后可用的场景工具，不能只依赖 thread/start 的动态工具注册。",
              "responsibility": "agent",
              "artifact_refs": [
                "runtime/arcorbit/src/workbench/agent-bridge.mjs",
                "runtime/arcorbit/adapters/codex-app-server-adapter.mjs"
              ],
              "evidence": [
                "arckit/cases/evidence/CASE-20260915-001/completion-review-1.md"
              ]
            }
          ],
          "dimensions": {
            "implementation_correctness": "findings",
            "problem_resolution": "findings",
            "verification_credibility": "clean",
            "regression_risk": "findings",
            "minimality": "clean"
          },
          "evidence": [
            "arckit/cases/evidence/CASE-20260915-001/completion-review-1.md"
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
      "invariant_assessment": {
        "project_revision": 386,
        "judgments": [
          {
            "invariant_ref": "product-expectations-remain-recoverable",
            "disposition": "upheld",
            "reason": "规格与逐项验收矩阵记录最终能力及过渡边界。",
            "fact_refs": [
              "FACT-20260915-001-003"
            ],
            "evidence": [
              "arckit/cases/evidence/CASE-20260915-001/completion-review-1.md",
              "arckit/cases/evidence/CASE-20260915-001/verification.md"
            ],
            "gap_refs": []
          },
          {
            "invariant_ref": "interaction-expectations-remain-recoverable",
            "disposition": "upheld",
            "reason": "交互文档、独立生产页面及 Electron 实际行为一致。",
            "fact_refs": [
              "FACT-20260915-001-003"
            ],
            "evidence": [
              "arckit/cases/evidence/CASE-20260915-001/completion-review-1.md",
              "arckit/cases/evidence/CASE-20260915-001/verification.md"
            ],
            "gap_refs": []
          },
          {
            "invariant_ref": "visual-language-remains-consistent",
            "disposition": "upheld",
            "reason": "新页面沿用主题且窄窗及单行布局有实际截图。",
            "fact_refs": [
              "FACT-20260915-001-003"
            ],
            "evidence": [
              "arckit/cases/evidence/CASE-20260915-001/completion-review-1.md",
              "arckit/cases/evidence/CASE-20260915-001/verification.md"
            ],
            "gap_refs": []
          },
          {
            "invariant_ref": "technical-decisions-remain-explainable",
            "disposition": "upheld",
            "reason": "技术方案记录状态所有权、主线程及命令/工具连接。",
            "fact_refs": [
              "FACT-20260915-001-003"
            ],
            "evidence": [
              "arckit/cases/evidence/CASE-20260915-001/completion-review-1.md",
              "arckit/cases/evidence/CASE-20260915-001/verification.md"
            ],
            "gap_refs": []
          },
          {
            "invariant_ref": "accepted-facts-are-realized",
            "disposition": "threatened",
            "reason": "已实现主路径存在审查发现的两个恢复边界，承接到自动生成的补修 gaps。",
            "fact_refs": [
              "FACT-20260915-001-003"
            ],
            "evidence": [
              "arckit/cases/evidence/CASE-20260915-001/completion-review-1.md",
              "arckit/cases/evidence/CASE-20260915-001/verification.md"
            ],
            "gap_refs": [
              "CASE-20260915-001:review-finding:FINDING-20260915-001-001",
              "CASE-20260915-001:review-finding:FINDING-20260915-001-002"
            ]
          },
          {
            "invariant_ref": "material-risks-have-credible-evidence",
            "disposition": "upheld",
            "reason": "并发/账号/幂等/工具桥/旧页面回归有自动证据；线上远端调用与发布明确不声称验证。",
            "fact_refs": [
              "FACT-20260915-001-003"
            ],
            "evidence": [
              "arckit/cases/evidence/CASE-20260915-001/completion-review-1.md",
              "arckit/cases/evidence/CASE-20260915-001/verification.md"
            ],
            "gap_refs": []
          }
        ]
      },
      "evidence": [
        "arckit/cases/evidence/CASE-20260915-001/completion-review-1.md"
      ],
      "runtime_result_ref": "",
      "occurred_at": "2026-09-15T19:24:19.427Z"
    },
    {
      "round": 4,
      "transition_schema_version": "arckit-case-transition/v8",
      "goal": "Resolve review finding: 退出远端账号必须清除新增单事情 Auto 请求，避免后续登录继承旧授权。",
      "outcome": "completed",
      "gap_selection": {
        "mode": "candidate",
        "basis": "Resolve review finding: 退出远端账号必须清除新增单事情 Auto 请求，避免后续登录继承旧授权。",
        "snapshot_token": "63a8163f446ccddd4e5e0ec2f54a3e306946e9ff36b897b81891c333584f863e",
        "selected_ref": "case-gap:CASE-20260915-001:CASE-20260915-001:review-finding:FINDING-20260915-001-001",
        "comparison_summary": "优先关闭本事项当前审查发现；其他独立事项延期。",
        "fresh_discovery_summary": "本轮只修复当前审查发现并验证。",
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
            "reason": "保留独立事项及其他审查发现。"
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
            "reason": "保留独立事项及其他审查发现。"
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
            "reason": "保留独立事项及其他审查发现。"
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
            "reason": "保留独立事项及其他审查发现。"
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
            "reason": "保留独立事项及其他审查发现。"
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
            "reason": "保留独立事项及其他审查发现。"
          },
          {
            "ref": "case-gap:CASE-20260915-001:CASE-20260915-001:review-finding:FINDING-20260915-001-001",
            "source": "persisted",
            "eligibility": "ready",
            "disposition": "selected",
            "priority_basis": {
              "blocking": "high",
              "uncertainty": "",
              "risk": "high",
              "user_impact": ""
            },
            "reason": "当前补修验收。"
          },
          {
            "ref": "case-gap:CASE-20260915-001:CASE-20260915-001:review-finding:FINDING-20260915-001-002",
            "source": "persisted",
            "eligibility": "ready",
            "disposition": "deferred",
            "priority_basis": {
              "blocking": "high",
              "uncertainty": "",
              "risk": "high",
              "user_impact": ""
            },
            "reason": "保留独立事项及其他审查发现。"
          },
          {
            "ref": "case-gap:CASE-20260915-002:GAP-20260915-002-002",
            "source": "persisted",
            "eligibility": "ready",
            "disposition": "deferred",
            "priority_basis": {
              "blocking": "",
              "uncertainty": "",
              "risk": "关闭后不得遗留全权限",
              "user_impact": "各入口一致生效"
            },
            "reason": "保留独立事项及其他审查发现。"
          }
        ]
      },
      "selected_gap": {
        "id": "CASE-20260915-001:review-finding:FINDING-20260915-001-001",
        "responsibility": "agent",
        "goal": "Resolve review finding: 退出远端账号必须清除新增单事情 Auto 请求，避免后续登录继承旧授权。",
        "reason": "error found by completion review",
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
          "runtime/arcorbit/src/automation-coordinator.mjs",
          "arckit/cases/evidence/CASE-20260915-001/completion-review-1.md"
        ]
      },
      "planned_transition": {
        "goal": "Resolve review finding: 退出远端账号必须清除新增单事情 Auto 请求，避免后续登录继承旧授权。",
        "expected_state_change": "两级 Automation clearRemoteSession 均清除 requested_tasks；退出不保留旧账号的显式单事情执行授权。"
      },
      "accepted_state_delta": {
        "resolved_gap": {
          "id": "CASE-20260915-001:review-finding:FINDING-20260915-001-001",
          "status": "resolved",
          "outcome": "两级 Automation clearRemoteSession 均清除 requested_tasks；退出不保留旧账号的显式单事情执行授权。",
          "reason": "生产修复与针对边界的验证完成。",
          "evidence": [
            "arckit/cases/evidence/CASE-20260915-001/review-fix-1.md"
          ]
        },
        "facts_added": [
          {
            "id": "FACT-20260915-001-004",
            "revision": 1,
            "status": "accepted",
            "statement": "两级 Automation clearRemoteSession 均清除 requested_tasks；退出不保留旧账号的显式单事情执行授权。",
            "basis": "完成审查 finding 的实现与验证。",
            "evidence": [
              "arckit/cases/evidence/CASE-20260915-001/review-fix-1.md"
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
          "FINDING-20260915-001-001"
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
        "project_revision": 386,
        "judgments": [
          {
            "invariant_ref": "product-expectations-remain-recoverable",
            "disposition": "upheld",
            "reason": "本次补修保留既有规格和页面边界，验证记录支持当前补修结论。",
            "fact_refs": [
              "FACT-20260915-001-004"
            ],
            "evidence": [
              "arckit/cases/evidence/CASE-20260915-001/review-fix-1.md",
              "arckit/cases/evidence/CASE-20260915-001/verification.md"
            ],
            "gap_refs": []
          },
          {
            "invariant_ref": "interaction-expectations-remain-recoverable",
            "disposition": "upheld",
            "reason": "本次补修保留既有规格和页面边界，验证记录支持当前补修结论。",
            "fact_refs": [
              "FACT-20260915-001-004"
            ],
            "evidence": [
              "arckit/cases/evidence/CASE-20260915-001/review-fix-1.md",
              "arckit/cases/evidence/CASE-20260915-001/verification.md"
            ],
            "gap_refs": []
          },
          {
            "invariant_ref": "visual-language-remains-consistent",
            "disposition": "upheld",
            "reason": "本次补修保留既有规格和页面边界，验证记录支持当前补修结论。",
            "fact_refs": [
              "FACT-20260915-001-004"
            ],
            "evidence": [
              "arckit/cases/evidence/CASE-20260915-001/review-fix-1.md",
              "arckit/cases/evidence/CASE-20260915-001/verification.md"
            ],
            "gap_refs": []
          },
          {
            "invariant_ref": "technical-decisions-remain-explainable",
            "disposition": "upheld",
            "reason": "本次补修保留既有规格和页面边界，验证记录支持当前补修结论。",
            "fact_refs": [
              "FACT-20260915-001-004"
            ],
            "evidence": [
              "arckit/cases/evidence/CASE-20260915-001/review-fix-1.md",
              "arckit/cases/evidence/CASE-20260915-001/verification.md"
            ],
            "gap_refs": []
          },
          {
            "invariant_ref": "accepted-facts-are-realized",
            "disposition": "threatened",
            "reason": "退出授权边界已修复；旧线程场景工具仍需独立补修。",
            "fact_refs": [
              "FACT-20260915-001-004"
            ],
            "evidence": [
              "arckit/cases/evidence/CASE-20260915-001/review-fix-1.md",
              "arckit/cases/evidence/CASE-20260915-001/verification.md"
            ],
            "gap_refs": [
              "CASE-20260915-001:review-finding:FINDING-20260915-001-002"
            ]
          },
          {
            "invariant_ref": "material-risks-have-credible-evidence",
            "disposition": "upheld",
            "reason": "本次补修保留既有规格和页面边界，验证记录支持当前补修结论。",
            "fact_refs": [
              "FACT-20260915-001-004"
            ],
            "evidence": [
              "arckit/cases/evidence/CASE-20260915-001/review-fix-1.md",
              "arckit/cases/evidence/CASE-20260915-001/verification.md"
            ],
            "gap_refs": []
          }
        ]
      },
      "evidence": [
        "arckit/cases/evidence/CASE-20260915-001/review-fix-1.md"
      ],
      "runtime_result_ref": "",
      "occurred_at": "2026-09-15T19:26:00.052Z"
    },
    {
      "round": 5,
      "transition_schema_version": "arckit-case-transition/v8",
      "goal": "Resolve review finding: 为已有事情主线程提供恢复后可用的场景工具，不能只依赖 thread/start 的动态工具注册。",
      "outcome": "completed",
      "gap_selection": {
        "mode": "candidate",
        "basis": "Resolve review finding: 为已有事情主线程提供恢复后可用的场景工具，不能只依赖 thread/start 的动态工具注册。",
        "snapshot_token": "9cd6f20aaa7e946dfd5d7d80ae7d2804b8d505449d1e38732da518d1c2097654",
        "selected_ref": "case-gap:CASE-20260915-001:CASE-20260915-001:review-finding:FINDING-20260915-001-002",
        "comparison_summary": "优先关闭本事项当前审查发现；其他独立事项延期。",
        "fresh_discovery_summary": "本轮只修复当前审查发现并验证。",
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
            "reason": "保留独立事项及其他审查发现。"
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
            "reason": "保留独立事项及其他审查发现。"
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
            "reason": "保留独立事项及其他审查发现。"
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
            "reason": "保留独立事项及其他审查发现。"
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
            "reason": "保留独立事项及其他审查发现。"
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
            "reason": "保留独立事项及其他审查发现。"
          },
          {
            "ref": "case-gap:CASE-20260915-001:CASE-20260915-001:review-finding:FINDING-20260915-001-002",
            "source": "persisted",
            "eligibility": "ready",
            "disposition": "selected",
            "priority_basis": {
              "blocking": "high",
              "uncertainty": "",
              "risk": "high",
              "user_impact": ""
            },
            "reason": "当前补修验收。"
          }
        ]
      },
      "selected_gap": {
        "id": "CASE-20260915-001:review-finding:FINDING-20260915-001-002",
        "responsibility": "agent",
        "goal": "Resolve review finding: 为已有事情主线程提供恢复后可用的场景工具，不能只依赖 thread/start 的动态工具注册。",
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
          "runtime/arcorbit/src/workbench/agent-bridge.mjs",
          "runtime/arcorbit/adapters/codex-app-server-adapter.mjs",
          "arckit/cases/evidence/CASE-20260915-001/completion-review-1.md"
        ]
      },
      "planned_transition": {
        "goal": "Resolve review finding: 为已有事情主线程提供恢复后可用的场景工具，不能只依赖 thread/start 的动态工具注册。",
        "expected_state_change": "同一事情工具桥新增 MCP 接口，Chat turn 与 Auto Run 都注入按账号/事情/工作区授权的 MCP 配置及环境变量；恢复已有 thread 可以发现与调用同一场景服务，无需创建替代线程。"
      },
      "accepted_state_delta": {
        "resolved_gap": {
          "id": "CASE-20260915-001:review-finding:FINDING-20260915-001-002",
          "status": "resolved",
          "outcome": "同一事情工具桥新增 MCP 接口，Chat turn 与 Auto Run 都注入按账号/事情/工作区授权的 MCP 配置及环境变量；恢复已有 thread 可以发现与调用同一场景服务，无需创建替代线程。",
          "reason": "生产修复与针对边界的验证完成。",
          "evidence": [
            "arckit/cases/evidence/CASE-20260915-001/review-fix-2.md"
          ]
        },
        "facts_added": [
          {
            "id": "FACT-20260915-001-005",
            "revision": 1,
            "status": "accepted",
            "statement": "同一事情工具桥新增 MCP 接口，Chat turn 与 Auto Run 都注入按账号/事情/工作区授权的 MCP 配置及环境变量；恢复已有 thread 可以发现与调用同一场景服务，无需创建替代线程。",
            "basis": "完成审查 finding 的实现与验证。",
            "evidence": [
              "arckit/cases/evidence/CASE-20260915-001/review-fix-2.md"
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
          "FINDING-20260915-001-002"
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
        "project_revision": 387,
        "judgments": [
          {
            "invariant_ref": "product-expectations-remain-recoverable",
            "disposition": "upheld",
            "reason": "本次补修保留既有规格和页面边界，验证记录支持当前补修结论。",
            "fact_refs": [
              "FACT-20260915-001-005"
            ],
            "evidence": [
              "arckit/cases/evidence/CASE-20260915-001/review-fix-2.md",
              "arckit/cases/evidence/CASE-20260915-001/verification.md"
            ],
            "gap_refs": []
          },
          {
            "invariant_ref": "interaction-expectations-remain-recoverable",
            "disposition": "upheld",
            "reason": "本次补修保留既有规格和页面边界，验证记录支持当前补修结论。",
            "fact_refs": [
              "FACT-20260915-001-005"
            ],
            "evidence": [
              "arckit/cases/evidence/CASE-20260915-001/review-fix-2.md",
              "arckit/cases/evidence/CASE-20260915-001/verification.md"
            ],
            "gap_refs": []
          },
          {
            "invariant_ref": "visual-language-remains-consistent",
            "disposition": "upheld",
            "reason": "本次补修保留既有规格和页面边界，验证记录支持当前补修结论。",
            "fact_refs": [
              "FACT-20260915-001-005"
            ],
            "evidence": [
              "arckit/cases/evidence/CASE-20260915-001/review-fix-2.md",
              "arckit/cases/evidence/CASE-20260915-001/verification.md"
            ],
            "gap_refs": []
          },
          {
            "invariant_ref": "technical-decisions-remain-explainable",
            "disposition": "upheld",
            "reason": "本次补修保留既有规格和页面边界，验证记录支持当前补修结论。",
            "fact_refs": [
              "FACT-20260915-001-005"
            ],
            "evidence": [
              "arckit/cases/evidence/CASE-20260915-001/review-fix-2.md",
              "arckit/cases/evidence/CASE-20260915-001/verification.md"
            ],
            "gap_refs": []
          },
          {
            "invariant_ref": "accepted-facts-are-realized",
            "disposition": "upheld",
            "reason": "本次补修保留既有规格和页面边界，验证记录支持当前补修结论。",
            "fact_refs": [
              "FACT-20260915-001-005"
            ],
            "evidence": [
              "arckit/cases/evidence/CASE-20260915-001/review-fix-2.md",
              "arckit/cases/evidence/CASE-20260915-001/verification.md"
            ],
            "gap_refs": []
          },
          {
            "invariant_ref": "material-risks-have-credible-evidence",
            "disposition": "upheld",
            "reason": "本次补修保留既有规格和页面边界，验证记录支持当前补修结论。",
            "fact_refs": [
              "FACT-20260915-001-005"
            ],
            "evidence": [
              "arckit/cases/evidence/CASE-20260915-001/review-fix-2.md",
              "arckit/cases/evidence/CASE-20260915-001/verification.md"
            ],
            "gap_refs": []
          }
        ]
      },
      "evidence": [
        "arckit/cases/evidence/CASE-20260915-001/review-fix-2.md"
      ],
      "runtime_result_ref": "",
      "occurred_at": "2026-09-15T19:40:32.671Z"
    },
    {
      "round": 6,
      "transition_schema_version": "arckit-case-transition/v8",
      "goal": "Review the completed implementation for correctness, real problem resolution, verification credibility, regression risk, and minimality.",
      "outcome": "completed",
      "gap_selection": {
        "mode": "candidate",
        "basis": "普通工作和审查 findings 均已接受关闭，当前仅余完成审查。",
        "snapshot_token": "6ad2efd1ae4e7be1fee2bc14b899f8ab8ac63b5c836171fd3f72d8b24d236ca9",
        "selected_ref": "case-gap:CASE-20260915-001:CASE-20260915-001:completion-review:2",
        "comparison_summary": "选择本 Case 完成审查；4 项长期项目验证、2 项历史人工决定保持延期。",
        "fresh_discovery_summary": "五维审查未发现新的范围内问题。",
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
            "reason": "独立义务，不在当前用户事情台事项内。"
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
            "reason": "独立义务，不在当前用户事情台事项内。"
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
            "reason": "独立义务，不在当前用户事情台事项内。"
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
            "reason": "独立义务，不在当前用户事情台事项内。"
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
            "reason": "独立义务，不在当前用户事情台事项内。"
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
            "reason": "独立义务，不在当前用户事情台事项内。"
          },
          {
            "ref": "case-gap:CASE-20260915-001:CASE-20260915-001:completion-review:2",
            "source": "persisted",
            "eligibility": "ready",
            "disposition": "selected",
            "priority_basis": {
              "blocking": "high",
              "uncertainty": "low",
              "risk": "high",
              "user_impact": "high"
            },
            "reason": "当前 Case 完成验收所必需。"
          }
        ]
      },
      "selected_gap": {
        "id": "CASE-20260915-001:completion-review:2",
        "responsibility": "agent",
        "goal": "Review the completed implementation for correctness, real problem resolution, verification credibility, regression risk, and minimality.",
        "reason": "All ordinary Case gaps and state impacts are closed.",
        "derived_from": [
          "case_result",
          "content_revision:4"
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
        "expected_state_change": "五维完成审查均 clean，原型实施及两个补修已验证，可完成当前 Case。"
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
          "reviewed_content_revision": 4,
          "findings": [],
          "dimensions": {
            "implementation_correctness": "clean",
            "problem_resolution": "clean",
            "verification_credibility": "clean",
            "regression_risk": "clean",
            "minimality": "clean"
          },
          "evidence": [
            "arckit/cases/evidence/CASE-20260915-001/completion-review-2.md"
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
      "invariant_assessment": {
        "project_revision": 387,
        "judgments": [
          {
            "invariant_ref": "product-expectations-remain-recoverable",
            "disposition": "upheld",
            "reason": "最终规格/交互/技术事实与实现、803项全量回归、GUI及本机协议验证一致；补修已通过独立回合，验证限制显式保留。",
            "fact_refs": [
              "FACT-20260915-001-003",
              "FACT-20260915-001-004",
              "FACT-20260915-001-005"
            ],
            "evidence": [
              "arckit/cases/evidence/CASE-20260915-001/completion-review-2.md",
              "arckit/cases/evidence/CASE-20260915-001/verification.md"
            ],
            "gap_refs": []
          },
          {
            "invariant_ref": "interaction-expectations-remain-recoverable",
            "disposition": "upheld",
            "reason": "最终规格/交互/技术事实与实现、803项全量回归、GUI及本机协议验证一致；补修已通过独立回合，验证限制显式保留。",
            "fact_refs": [
              "FACT-20260915-001-003",
              "FACT-20260915-001-004",
              "FACT-20260915-001-005"
            ],
            "evidence": [
              "arckit/cases/evidence/CASE-20260915-001/completion-review-2.md",
              "arckit/cases/evidence/CASE-20260915-001/verification.md"
            ],
            "gap_refs": []
          },
          {
            "invariant_ref": "visual-language-remains-consistent",
            "disposition": "upheld",
            "reason": "最终规格/交互/技术事实与实现、803项全量回归、GUI及本机协议验证一致；补修已通过独立回合，验证限制显式保留。",
            "fact_refs": [
              "FACT-20260915-001-003",
              "FACT-20260915-001-004",
              "FACT-20260915-001-005"
            ],
            "evidence": [
              "arckit/cases/evidence/CASE-20260915-001/completion-review-2.md",
              "arckit/cases/evidence/CASE-20260915-001/verification.md"
            ],
            "gap_refs": []
          },
          {
            "invariant_ref": "technical-decisions-remain-explainable",
            "disposition": "upheld",
            "reason": "最终规格/交互/技术事实与实现、803项全量回归、GUI及本机协议验证一致；补修已通过独立回合，验证限制显式保留。",
            "fact_refs": [
              "FACT-20260915-001-003",
              "FACT-20260915-001-004",
              "FACT-20260915-001-005"
            ],
            "evidence": [
              "arckit/cases/evidence/CASE-20260915-001/completion-review-2.md",
              "arckit/cases/evidence/CASE-20260915-001/verification.md"
            ],
            "gap_refs": []
          },
          {
            "invariant_ref": "accepted-facts-are-realized",
            "disposition": "upheld",
            "reason": "最终规格/交互/技术事实与实现、803项全量回归、GUI及本机协议验证一致；补修已通过独立回合，验证限制显式保留。",
            "fact_refs": [
              "FACT-20260915-001-003",
              "FACT-20260915-001-004",
              "FACT-20260915-001-005"
            ],
            "evidence": [
              "arckit/cases/evidence/CASE-20260915-001/completion-review-2.md",
              "arckit/cases/evidence/CASE-20260915-001/verification.md"
            ],
            "gap_refs": []
          },
          {
            "invariant_ref": "material-risks-have-credible-evidence",
            "disposition": "upheld",
            "reason": "最终规格/交互/技术事实与实现、803项全量回归、GUI及本机协议验证一致；补修已通过独立回合，验证限制显式保留。",
            "fact_refs": [
              "FACT-20260915-001-003",
              "FACT-20260915-001-004",
              "FACT-20260915-001-005"
            ],
            "evidence": [
              "arckit/cases/evidence/CASE-20260915-001/completion-review-2.md",
              "arckit/cases/evidence/CASE-20260915-001/verification.md"
            ],
            "gap_refs": []
          }
        ]
      },
      "evidence": [
        "arckit/cases/evidence/CASE-20260915-001/completion-review-2.md"
      ],
      "runtime_result_ref": "",
      "occurred_at": "2026-09-15T19:42:16.227Z"
    }
  ],
  "case_resolution": {
    "status": "resolved",
    "stage": "resolved",
    "satisfied": [
      "GAP-20260915-001-001",
      "GAP-20260915-001-002",
      "CASE-20260915-001:review-finding:FINDING-20260915-001-001",
      "CASE-20260915-001:review-finding:FINDING-20260915-001-002"
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
    "updated_at": "2026-09-15T19:42:16.227Z"
  }
}
```

## Round Notes

- Case history is canonical in Structured Record.rounds; keep prose notes exceptional.
