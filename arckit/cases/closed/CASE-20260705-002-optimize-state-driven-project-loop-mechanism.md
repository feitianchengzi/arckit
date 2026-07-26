# Optimize state-driven project loop mechanism

Case: CASE-20260705-002
Status: closed
Artifact Type: mixed
Selected Gap: none
Updated: 2026-07-26T18:58:51.521Z

## User Intent

按照状态驱动 loop 工程重新设计 Arckit 项目状态机制：全局完整性状态、项目内迭代状态、case 作为状态变化证据。

## Structured Record

```json
{
  "schema_version": "development-case-record/v3",
  "id": "CASE-20260705-002",
  "title": "Optimize state-driven project loop mechanism",
  "status": "closed",
  "artifact_type": "mixed",
  "created_at": "2026-07-05T15:24:27.208Z",
  "updated_at": "2026-07-26T18:58:51.521Z",
  "user_intent": "按照状态驱动 loop 工程重新设计 Arckit 项目状态机制：全局完整性状态、项目内迭代状态、case 作为状态变化证据。",
  "expected_outcome": "把 development-ledger 从记录型账本升级为状态驱动 loop 控制机制：STATE.md 表达全局项目完整性状态，project/iterations 表达迭代状态，case 保存状态变化证据。",
  "project_state_ref": "arckit/project/STATE.md",
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
      "reason": "状态机制产品行为已定义为全局完整性状态、迭代状态和 case 证据的分层 loop 控制机制。",
      "evidence": [
        "entry/skills/arckit-development-ledger/SKILL.md",
        "arckit/project/STATE.md"
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
      "reason": "agent 交互入口已通过 using-arckit 的 ledger_paths、iteration state 和 visible_iteration_closeout 描述同步。",
      "evidence": [
        "entry/skills/using-arckit/SKILL.md"
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
      "reason": "本轮优化的是 Markdown/JSON 状态协议和脚本，不涉及视觉界面。",
      "evidence": [
        "case:CASE-20260705-002:visual_expectation:migration-evidence"
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
      "reason": "project-state schema/script 已升级为 v2，新增 iteration-state schema 和 project-iteration 脚本。",
      "evidence": [
        "entry/skills/arckit-development-ledger/schema/project-state-record.schema.json",
        "entry/skills/arckit-development-ledger/schema/iteration-state-record.schema.json",
        "entry/skills/arckit-development-ledger/scripts/project-state.mjs",
        "entry/skills/arckit-development-ledger/scripts/project-iteration.mjs"
      ],
      "next_transition": ""
    },
    "implementation_state": {
      "applicability": "required",
      "maturity": "formalized",
      "target_maturity": "formalized",
      "alignment": "aligned",
      "target_alignment": "aligned",
      "resolution": "resolved",
      "reason": "协议、schema、脚本、当前 project state、iteration index 和当前 iteration record 均已落地。",
      "evidence": [
        "entry/skills/arckit-development-ledger/SKILL.md",
        "entry/skills/arckit-development-ledger/agents/openai.yaml",
        "entry/skills/using-arckit/SKILL.md",
        "arckit/project/STATE.md",
        "arckit/project/ITERATIONS.md",
        "arckit/project/iterations/ITER-20260705-001-state-driven-loop-foundation.md"
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
      "reason": "已计划并执行结构校验；真实复杂项目 loop 验证作为迭代剩余 gap，而非本 case 的关闭阻塞。",
      "evidence": [
        "node entry/skills/arckit-development-ledger/scripts/project-state.mjs validate arckit/project/STATE.md",
        "node entry/skills/arckit-development-ledger/scripts/project-iteration.mjs validate",
        "node --check entry/skills/arckit-development-ledger/scripts/project-state.mjs",
        "node --check entry/skills/arckit-development-ledger/scripts/project-iteration.mjs"
      ],
      "next_transition": ""
    }
  },
  "open_questions": [
    {
      "id": "question-1",
      "question": "是否用一个真实复杂项目执行 state gap -> case -> verification -> state delta 的完整 loop 验证。",
      "status": "resolved",
      "owner": "human",
      "evidence": [
        "arckit/cases/closed/CASE-20260705-002-optimize-state-driven-project-loop-mechanism.md"
      ]
    },
    {
      "id": "question-2",
      "question": "是否增加跨 project/iteration/case 的一致性 audit 命令。",
      "status": "resolved",
      "owner": "human",
      "evidence": [
        "arckit/cases/closed/CASE-20260705-002-optimize-state-driven-project-loop-mechanism.md"
      ]
    }
  ],
  "decisions": [
    "STATE.md 是全局项目完整性状态控制面，不是持续增长的记录文档。",
    "迭代状态管理归入 arckit/project/。",
    "skill、code、document、CLI、Web、App、API 和服务端都只是实现产物形态；完整性模型必须保持通用软件项目维度。",
    "case 保存状态变化证据和过程，不替代 project state 或 iteration state。"
  ],
  "pending_handoffs": [
    {
      "id": "handoff-1",
      "target": "external",
      "owner": "external",
      "status": "completed",
      "resume_condition": "真实复杂项目 loop 验证留在 ITER-20260705-001 的 remaining gap 中继续推进。",
      "evidence": [
        "arckit/cases/closed/CASE-20260705-002-optimize-state-driven-project-loop-mechanism.md"
      ]
    },
    {
      "id": "handoff-2",
      "target": "external",
      "owner": "external",
      "status": "completed",
      "resume_condition": "安装副本同步或 ArcForge 漂移治理按需要后续处理。",
      "evidence": [
        "arckit/cases/closed/CASE-20260705-002-optimize-state-driven-project-loop-mechanism.md"
      ]
    }
  ],
  "process_notes": [
    "软件项目协作应围绕 project state 的 state_gaps 和 loop_control 做下一轮行动选择。"
  ],
  "rounds": [
    {
      "round": 1,
      "goal": "Historical round 1",
      "outcome": "completed",
      "planned_transition": "",
      "accepted_state_delta": {
        "facets": [],
        "resolved_open_questions": [],
        "completed_handoffs": [],
        "completion_review_result": null,
        "resolved_review_findings": [],
        "review_budget_extension": null
      },
      "evidence": [],
      "runtime_result_ref": "",
      "occurred_at": "2026-07-05T15:33:56.140Z"
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
          "arckit/project/STATE.md",
          "case:CASE-20260705-002"
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
    "updated_at": "2026-07-26T18:58:51.521Z"
  },
  "project_impact_candidate": {
    "status": "none",
    "changes": [],
    "evidence": []
  },
  "content_revision": 1,
  "completion_review": {
    "status": "clean",
    "policy": {
      "initial_max_cycles": 3,
      "source": "repository-migration:runtime/arckit-runtime/config/case-policy.json",
      "snapshotted_at": "2026-07-26T17:44:10.256Z"
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
          "migration:CASE-20260705-002:pre-v3-resolved-case"
        ],
        "occurred_at": "2026-07-26T17:44:10.256Z"
      }
    ],
    "evidence": [
      "migration:CASE-20260705-002:pre-v3-resolved-case"
    ],
    "escalation": null,
    "human_authorizations": []
  }
}
```

## Round Notes

- 状态机制已从记录型账本升级为状态驱动 loop 的控制面。
- 真实复杂项目 loop 验证保留在当前 active iteration 中，不作为本 case 关闭阻塞。
