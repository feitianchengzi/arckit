# Optimize state-driven project loop mechanism

Case: CASE-20260705-002
Status: closed
Artifact Type: mixed
Current Gap: none
Updated: 2026-07-05T15:33:56.140Z

## User Intent

按照状态驱动 loop 工程重新设计 Arckit 项目状态机制：全局完整性状态、项目内迭代状态、case 作为状态变化证据。

## Structured Record

```json
{
  "schema_version": "development-case-record/v1",
  "id": "CASE-20260705-002",
  "title": "Optimize state-driven project loop mechanism",
  "status": "closed",
  "artifact_type": "mixed",
  "created_at": "2026-07-05T15:24:27.208Z",
  "updated_at": "2026-07-05T15:33:56.140Z",
  "user_intent": "按照状态驱动 loop 工程重新设计 Arckit 项目状态机制：全局完整性状态、项目内迭代状态、case 作为状态变化证据。",
  "expected_outcome": "把 development-ledger 从记录型账本升级为状态驱动 loop 控制机制：STATE.md 表达全局项目完整性状态，project/iterations 表达迭代状态，case 保存状态变化证据。",
  "current_round_goal": "完成状态机制 v2 的协议、schema、脚本、当前项目状态和迭代状态落地，并通过结构校验。",
  "current_round_gap": "none",
  "project_state_ref": "arckit/project/STATE.md",
  "project_state_delta": {
    "changed": [
      "product_behavior",
      "runtime_surfaces",
      "data_state",
      "architecture_foundation",
      "implementation_coverage",
      "quality_validation",
      "maintainability_handoff",
      "iteration_governance"
    ],
    "unchanged_unknown": [],
    "deferred": [
      "真实复杂项目 loop 验证",
      "跨 project/iteration/case 一致性 audit 命令"
    ],
    "blocked": [],
    "next_project_question": "是否用一个真实复杂项目执行 state gap -> case -> verification -> state delta 的完整 loop 验证。",
    "updated_at": "2026-07-05T15:29:41.000Z",
    "state_transitions": [
      "project_state_record/v1 -> project_state_record/v2",
      "iteration state moved under arckit/project/iterations",
      "STATE.md changed from record-like summary to global completeness control surface"
    ],
    "iteration_ref": "arckit/project/iterations/ITER-20260705-001-state-driven-loop-foundation.md"
  },
  "round_strategy_decision": {
    "selected_route": "update-development-ledger-state-mechanism",
    "reason": "用户纠偏表明需求不是优化当前 Arckit skill 仓库的特例状态，而是为任意软件项目建立可驱动 loop 的状态模型。",
    "considered_routes": [
      {
        "route": "only-explain-concept",
        "decision": "deferred",
        "reason": "用户要求对状态机制进行优化，需要落到协议、schema、脚本和当前项目状态。"
      },
      {
        "route": "specialize-for-skill-project",
        "decision": "not_applicable",
        "reason": "skill 和 code 都只是实现产物，不能用 skill 类型先验裁剪完整性模型。"
      },
      {
        "route": "update-development-ledger-state-mechanism",
        "decision": "selected",
        "reason": "development-ledger 是 project state、iteration state 和 case record 的 schema/脚本承载。"
      }
    ],
    "next_route_triggers": [
      "如果真实复杂项目 loop 验证失败，继续修订 state gaps、iteration state 或 cross-record audit。",
      "如果需要同步安装副本，转 ArcForge 做漂移检查和 apply。"
    ],
    "user_visible_summary": "本轮将项目状态机制改成状态驱动 loop 的控制面，并把迭代状态纳入 arckit/project。"
  },
  "structures": {
    "product_expectation": {
      "status": "satisfied",
      "reason": "状态机制产品行为已定义为全局完整性状态、迭代状态和 case 证据的分层 loop 控制机制。",
      "evidence": [
        "memory/skills/arckit-development-ledger/SKILL.md",
        "arckit/project/STATE.md"
      ],
      "evidence_maturity": "formalized",
      "next": "用真实复杂项目验证该行为是否足以驱动 loop。"
    },
    "interaction_expectation": {
      "status": "satisfied",
      "reason": "agent 交互入口已通过 using-arckit 的 ledger_paths、iteration state 和 visible_iteration_closeout 描述同步。",
      "evidence": [
        "entry/skills/using-arckit/SKILL.md"
      ],
      "evidence_maturity": "formalized",
      "next": "下一轮观察 agent 是否按 state gap 而不是任务列表推进。"
    },
    "visual_expectation": {
      "status": "not_applicable",
      "reason": "本轮优化的是 Markdown/JSON 状态协议和脚本，不涉及视觉界面。",
      "evidence": [],
      "evidence_maturity": "none",
      "next": ""
    },
    "technical_expectation": {
      "status": "satisfied",
      "reason": "project-state schema/script 已升级为 v2，新增 iteration-state schema 和 project-iteration 脚本。",
      "evidence": [
        "memory/skills/arckit-development-ledger/schema/project-state-record.schema.json",
        "memory/skills/arckit-development-ledger/schema/iteration-state-record.schema.json",
        "memory/skills/arckit-development-ledger/scripts/project-state.mjs",
        "memory/skills/arckit-development-ledger/scripts/project-iteration.mjs"
      ],
      "evidence_maturity": "formalized",
      "next": "根据真实 loop 使用反馈决定是否补跨记录 audit 命令。"
    },
    "implementation_state": {
      "status": "satisfied",
      "reason": "协议、schema、脚本、当前 project state、iteration index 和当前 iteration record 均已落地。",
      "evidence": [
        "memory/skills/arckit-development-ledger/SKILL.md",
        "memory/skills/arckit-development-ledger/agents/openai.yaml",
        "entry/skills/using-arckit/SKILL.md",
        "arckit/project/STATE.md",
        "arckit/project/ITERATIONS.md",
        "arckit/project/iterations/ITER-20260705-001-state-driven-loop-foundation.md"
      ],
      "evidence_maturity": "formalized",
      "next": ""
    },
    "verification_state": {
      "status": "satisfied",
      "reason": "已计划并执行结构校验；真实复杂项目 loop 验证作为迭代剩余 gap，而非本 case 的关闭阻塞。",
      "evidence": [
        "node memory/skills/arckit-development-ledger/scripts/project-state.mjs validate arckit/project/STATE.md",
        "node memory/skills/arckit-development-ledger/scripts/project-iteration.mjs validate",
        "node --check memory/skills/arckit-development-ledger/scripts/project-state.mjs",
        "node --check memory/skills/arckit-development-ledger/scripts/project-iteration.mjs"
      ],
      "evidence_maturity": "confirmed",
      "next": "关闭 case 前再运行完整 validation，包括 case validation。"
    },
    "open_questions": {
      "status": "satisfied",
      "reason": "未完成的问题已移入 project state gaps 和 active iteration 的 remaining gaps，不阻塞本 case 关闭。",
      "evidence": [
        "arckit/project/STATE.md",
        "arckit/project/iterations/ITER-20260705-001-state-driven-loop-foundation.md"
      ],
      "evidence_maturity": "confirmed",
      "next": "下一轮决定是否执行真实复杂项目 loop 验证。"
    },
    "pending_handoffs": {
      "status": "deferred",
      "reason": "同步安装副本或 ArcForge 漂移治理不属于本轮状态机制落地，按需要后续处理。",
      "evidence": [
        "arckit/project/STATE.md"
      ],
      "evidence_maturity": "confirmed",
      "next": "需要发布或同步时运行 ArcForge 漂移/应用流程。"
    },
    "workflow_memory_signals": {
      "status": "satisfied",
      "reason": "本轮产生明确工作方式信号：后续软件项目协作应以 state gap 和 next transition 驱动 loop。",
      "evidence": [
        "memory/skills/arckit-development-ledger/SKILL.md"
      ],
      "evidence_maturity": "confirmed",
      "next": "如维护 workflow memory，可记录状态驱动 loop 的工作方式。"
    }
  },
  "open_questions": [
    "是否用一个真实复杂项目执行 state gap -> case -> verification -> state delta 的完整 loop 验证。",
    "是否增加跨 project/iteration/case 的一致性 audit 命令。"
  ],
  "decisions": [
    "STATE.md 是全局项目完整性状态控制面，不是持续增长的记录文档。",
    "迭代状态管理归入 arckit/project/。",
    "skill、code、document、CLI、Web、App、API 和服务端都只是实现产物形态；完整性模型必须保持通用软件项目维度。",
    "case 保存状态变化证据和过程，不替代 project state 或 iteration state。"
  ],
  "pending_handoffs": [
    "真实复杂项目 loop 验证留在 ITER-20260705-001 的 remaining gap 中继续推进。",
    "安装副本同步或 ArcForge 漂移治理按需要后续处理。"
  ],
  "workflow_memory_signals": [
    "软件项目协作应围绕 project state 的 state_gaps 和 loop_control 做下一轮行动选择。"
  ],
  "rounds": [
    {
      "round": 1,
      "summary": "基于用户关于状态驱动 loop 工程的纠偏，升级 development-ledger 的项目状态模型、迭代状态模型、脚本和当前项目状态记录。",
      "source_facts_changed": [
        "项目状态机制定位为状态驱动 loop 控制面。",
        "迭代状态属于 arckit/project。",
        "标准软件项目完整性模型不能因实现产物是 skill 或 code 而特化裁剪。"
      ],
      "projection_artifacts_changed": [
        "memory/skills/arckit-development-ledger/SKILL.md",
        "memory/skills/arckit-development-ledger/schema/project-state-record.schema.json",
        "memory/skills/arckit-development-ledger/schema/iteration-state-record.schema.json",
        "memory/skills/arckit-development-ledger/scripts/project-state.mjs",
        "memory/skills/arckit-development-ledger/scripts/project-iteration.mjs",
        "memory/skills/arckit-development-ledger/agents/openai.yaml",
        "entry/skills/using-arckit/SKILL.md",
        "arckit/project/STATE.md",
        "arckit/project/ITERATIONS.md",
        "arckit/project/iterations/ITER-20260705-001-state-driven-loop-foundation.md"
      ],
      "deferred_projections": [
        "真实复杂项目 loop 验证。",
        "跨记录 audit 命令。"
      ]
    }
  ],
  "completion_audit": {
    "status": "complete",
    "satisfied": [
      "product_expectation",
      "interaction_expectation",
      "visual_expectation",
      "technical_expectation",
      "implementation_state",
      "verification_state",
      "open_questions",
      "pending_handoffs",
      "workflow_memory_signals"
    ],
    "remaining": [],
    "blocked": [],
    "next_round_goal": "",
    "updated_at": "2026-07-05T15:33:56.140Z"
  }
}
```

## Round Notes

- 状态机制已从记录型账本升级为状态驱动 loop 的控制面。
- 真实复杂项目 loop 验证保留在当前 active iteration 中，不作为本 case 关闭阻塞。
