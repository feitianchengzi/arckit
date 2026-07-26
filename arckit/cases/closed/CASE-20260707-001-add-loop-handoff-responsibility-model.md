# Add loop handoff responsibility model

Case: CASE-20260707-001
Status: closed
Artifact Type: mixed
Selected Gap: none
Updated: 2026-07-26T18:58:51.885Z

## User Intent

把人工桥纠正为 agent continuation 缺失时的触发方式，并区分下一步职责归属：agent、human、external 或 none。

## Structured Record

```json
{
  "schema_version": "development-case-record/v3",
  "id": "CASE-20260707-001",
  "title": "Add loop handoff responsibility model",
  "status": "closed",
  "artifact_type": "mixed",
  "created_at": "2026-07-07T10:47:35.679Z",
  "updated_at": "2026-07-26T18:58:51.885Z",
  "user_intent": "把人工桥纠正为 agent continuation 缺失时的触发方式，并区分下一步职责归属：agent、human、external 或 none。",
  "expected_outcome": "把 Arckit 每轮 closeout 从人工桥/自动桥表达，改成先判断下一步职责归属，再表达当前触发方式；manual_bridge 只表示 agent 本可继续但缺少自动续轮机制。",
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
      "reason": "loop closeout 的产品语义已正式写入 spec：先判断下一步职责归属，再判断触发方式。",
      "evidence": [
        "entry/skills/using-arckit/SKILL.md",
        "entry/skills/arckit-development-ledger/SKILL.md",
        "arckit/spec/agentic-software-development/product-concepts.md",
        "arckit/spec/agentic-software-development/product-architecture.md",
        "arckit/spec/workflow-orchestration-memory.md"
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
      "reason": "final closeout 必须输出 loop_handoff，说明人类是在补 agent 续轮触发，还是需要真实决策、授权、外部等待或事项已完成。",
      "evidence": [
        "entry/skills/using-arckit/SKILL.md",
        "arckit/spec/agentic-software-development/product-architecture.md",
        "arckit/spec/agentic-software-development/skill-architecture.md"
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
      "reason": "本轮修改的是 agent workflow 和账本协议，不涉及视觉界面。",
      "evidence": [
        "case:CASE-20260707-001:visual_expectation:migration-evidence"
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
      "reason": "case schema、project state schema 和技术方案已描述 loop_handoff/loop_control 职责字段、Loop Handoff Gate 和自动桥消费条件。",
      "evidence": [
        "entry/skills/arckit-development-ledger/schema/development-case-record.schema.json",
        "entry/skills/arckit-development-ledger/schema/project-state-record.schema.json",
        "entry/skills/arckit-development-ledger/scripts/development-case.mjs",
        "entry/skills/arckit-development-ledger/scripts/project-state.mjs",
        "arckit/tech/workflow-orchestration-memory/solution.md"
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
      "reason": "入口协议、账本说明、schema、脚本默认值、agent metadata、spec、tech 和 project state 均已更新。",
      "evidence": [
        "entry/skills/using-arckit/SKILL.md",
        "entry/skills/arckit-development-ledger/SKILL.md",
        "entry/skills/arckit-development-ledger/agents/openai.yaml",
        "entry/skills/arckit-development-ledger/schema/development-case-record.schema.json",
        "entry/skills/arckit-development-ledger/schema/project-state-record.schema.json",
        "entry/skills/arckit-development-ledger/scripts/development-case.mjs",
        "entry/skills/arckit-development-ledger/scripts/project-state.mjs",
        "arckit/spec/agentic-software-development/product-concepts.md",
        "arckit/spec/agentic-software-development/product-architecture.md",
        "arckit/spec/agentic-software-development/skill-architecture.md",
        "arckit/spec/workflow-orchestration-memory.md",
        "arckit/tech/workflow-orchestration-memory/solution.md",
        "arckit/project/state.record.json",
        "arckit/project/STATE.md"
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
      "reason": "已完成脚本语法检查、schema JSON 解析、现有 case 验证、项目状态验证、临时沙盒新建记录验证，并在源事实补齐后再次校验账本。",
      "evidence": [
        "node --check entry/skills/arckit-development-ledger/scripts/development-case.mjs",
        "node --check entry/skills/arckit-development-ledger/scripts/project-state.mjs",
        "node -e JSON.parse(...)",
        "node entry/skills/arckit-development-ledger/scripts/development-case.mjs validate",
        "node entry/skills/arckit-development-ledger/scripts/project-state.mjs validate arckit/project/state.record.json",
        "/private/tmp/arckit-ledger-loop-test"
      ],
      "next_transition": ""
    }
  },
  "open_questions": [
    {
      "id": "question-1",
      "question": "是否继续实现自动桥 controller。",
      "status": "resolved",
      "owner": "human",
      "evidence": [
        "arckit/cases/closed/CASE-20260707-001-add-loop-handoff-responsibility-model.md"
      ]
    }
  ],
  "decisions": [
    "每轮 closeout 先判断 next_responsibility，再判断 trigger_mode。",
    "manual_bridge 只表示当前缺少自动续轮机制，由人手动触发本应由 agent 继续的下一轮。",
    "human_decision_required 只用于真实人类判断、授权、取舍、审美或发布责任。",
    "completion_audit.loop_handoff 是 case 级续轮 envelope；project loop_control 提供项目级续轮摘要。",
    "Loop Handoff 是 arckit/spec 中的稳定产品概念，不只是 skill 投影。",
    "自动桥 controller 的技术消费条件写入 arckit/tech：next_responsibility=agent && agent_continuation_available=true && human_decision_required=false。"
  ],
  "pending_handoffs": [
    {
      "id": "handoff-1",
      "target": "external",
      "owner": "external",
      "status": "completed",
      "resume_condition": "自动桥 controller 实现留作后续。",
      "evidence": [
        "arckit/cases/closed/CASE-20260707-001-add-loop-handoff-responsibility-model.md"
      ]
    }
  ],
  "process_notes": [
    "ArcKit loop closeout 应区分责任归属和触发机制，避免把 agent continuation 的人工触发缺口误写成人类决策。"
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
      "occurred_at": "2026-07-07T11:20:00.000Z"
    },
    {
      "round": 2,
      "goal": "Historical round 2",
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
      "occurred_at": "2026-07-07T11:20:00.000Z"
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
          "case:CASE-20260707-001"
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
    "updated_at": "2026-07-26T18:58:51.885Z"
  },
  "project_impact_candidate": {
    "status": "none",
    "changes": [],
    "evidence": []
  },
  "content_revision": 2,
  "completion_review": {
    "status": "clean",
    "policy": {
      "initial_max_cycles": 3,
      "source": "repository-migration:runtime/arckit-runtime/config/case-policy.json",
      "snapshotted_at": "2026-07-26T17:44:10.597Z"
    },
    "additional_cycles_authorized": 0,
    "cycle_count": 1,
    "reviewed_content_revision": 2,
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
        "content_revision": 2,
        "dimensions": {
          "correctness": "clean",
          "completeness": "clean",
          "minimality": "clean"
        },
        "finding_ids": [],
        "evidence": [
          "migration:CASE-20260707-001:pre-v3-resolved-case"
        ],
        "occurred_at": "2026-07-26T17:44:10.597Z"
      }
    ],
    "evidence": [
      "migration:CASE-20260707-001:pre-v3-resolved-case"
    ],
    "escalation": null,
    "human_authorizations": []
  }
}
```

## Round Notes

- Closed after local validation passed.
