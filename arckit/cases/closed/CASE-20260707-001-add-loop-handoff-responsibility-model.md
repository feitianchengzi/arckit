# Add loop handoff responsibility model

Case: CASE-20260707-001
Status: closed
Artifact Type: mixed
Current Gap: none
Updated: 2026-07-07T11:20:00.000Z

## User Intent

把人工桥纠正为 agent continuation 缺失时的触发方式，并区分下一步职责归属：agent、human、external 或 none。

## Structured Record

```json
{
  "schema_version": "development-case-record/v1",
  "id": "CASE-20260707-001",
  "title": "Add loop handoff responsibility model",
  "status": "closed",
  "artifact_type": "mixed",
  "created_at": "2026-07-07T10:47:35.679Z",
  "updated_at": "2026-07-07T11:20:00.000Z",
  "user_intent": "把人工桥纠正为 agent continuation 缺失时的触发方式，并区分下一步职责归属：agent、human、external 或 none。",
  "expected_outcome": "把 Arckit 每轮 closeout 从人工桥/自动桥表达，改成先判断下一步职责归属，再表达当前触发方式；manual_bridge 只表示 agent 本可继续但缺少自动续轮机制。",
  "current_round_goal": "补齐 Loop Handoff responsibility model 的 arckit/spec、arckit/tech 和 project state 源事实，并保持 skill 实现投影一致。",
  "current_round_gap": "none",
  "project_state_ref": "arckit/project/state.record.json",
  "project_state_delta": {
    "changed": [
      "product_behavior",
      "user_experience",
      "quality_validation",
      "maintainability_handoff"
    ],
    "unchanged_unknown": [],
    "deferred": [
      "真实自动桥 controller 实现",
      "跨 round no-progress 自动停止执行器"
    ],
    "blocked": [],
    "next_project_question": "是否继续实现读取 loop_handoff 并自动触发下一轮的外层 controller。",
    "updated_at": "2026-07-07T11:20:00.000Z"
  },
  "round_strategy_decision": {
    "selected_route": "encode-loop-responsibility-before-trigger",
    "reason": "用户纠偏表明人工桥不是人类职责，而是 agent 自动续轮机制缺失时的临时触发方式；协议必须先区分 responsibility，再区分 trigger_mode。",
    "considered_routes": [
      {
        "route": "human-ready-vs-auto-ready",
        "decision": "deferred",
        "reason": "该表达容易把人类触发下一轮和人类真实决策混在一起。"
      },
      {
        "route": "responsibility-before-trigger",
        "decision": "selected",
        "reason": "该路线能同时服务人工桥和未来自动桥，并保留真正需要人类判断或外部等待的边界。"
      }
    ],
    "next_route_triggers": [
      "如果要接入自动桥，读取 completion_audit.loop_handoff 作为 controller 输入。",
      "如果真实使用发现 handoff 仍过粗，继续细化 agent_instruction 和 progress_guard。"
    ],
    "user_visible_summary": "本轮把人工桥建模为 trigger_mode=manual_bridge，而不是 human responsibility。"
  },
  "structures": {
    "product_expectation": {
      "status": "satisfied",
      "reason": "loop closeout 的产品语义已正式写入 spec：先判断下一步职责归属，再判断触发方式。",
      "evidence": [
        "entry/skills/using-arckit/SKILL.md",
        "memory/skills/arckit-development-ledger/SKILL.md",
        "arckit/spec/agentic-software-development/product-concepts.md",
        "arckit/spec/agentic-software-development/product-architecture.md",
        "arckit/spec/workflow-orchestration-memory.md"
      ],
      "evidence_maturity": "formalized",
      "next": "如需真正自动续轮，继续实现外层 controller。"
    },
    "interaction_expectation": {
      "status": "satisfied",
      "reason": "final closeout 必须输出 loop_handoff，说明人类是在补 agent 续轮触发，还是需要真实决策、授权、外部等待或事项已完成。",
      "evidence": [
        "entry/skills/using-arckit/SKILL.md",
        "arckit/spec/agentic-software-development/product-architecture.md",
        "arckit/spec/agentic-software-development/skill-architecture.md"
      ],
      "evidence_maturity": "formalized",
      "next": ""
    },
    "visual_expectation": {
      "status": "not_applicable",
      "reason": "本轮修改的是 agent workflow 和账本协议，不涉及视觉界面。",
      "evidence": [],
      "evidence_maturity": "none",
      "next": ""
    },
    "technical_expectation": {
      "status": "satisfied",
      "reason": "case schema、project state schema 和技术方案已描述 loop_handoff/loop_control 职责字段、Loop Handoff Gate 和自动桥消费条件。",
      "evidence": [
        "memory/skills/arckit-development-ledger/schema/development-case-record.schema.json",
        "memory/skills/arckit-development-ledger/schema/project-state-record.schema.json",
        "memory/skills/arckit-development-ledger/scripts/development-case.mjs",
        "memory/skills/arckit-development-ledger/scripts/project-state.mjs",
        "arckit/tech/workflow-orchestration-memory/solution.md"
      ],
      "evidence_maturity": "formalized",
      "next": ""
    },
    "implementation_state": {
      "status": "satisfied",
      "reason": "入口协议、账本说明、schema、脚本默认值、agent metadata、spec、tech 和 project state 均已更新。",
      "evidence": [
        "entry/skills/using-arckit/SKILL.md",
        "memory/skills/arckit-development-ledger/SKILL.md",
        "memory/skills/arckit-development-ledger/agents/openai.yaml",
        "memory/skills/arckit-development-ledger/schema/development-case-record.schema.json",
        "memory/skills/arckit-development-ledger/schema/project-state-record.schema.json",
        "memory/skills/arckit-development-ledger/scripts/development-case.mjs",
        "memory/skills/arckit-development-ledger/scripts/project-state.mjs",
        "arckit/spec/agentic-software-development/product-concepts.md",
        "arckit/spec/agentic-software-development/product-architecture.md",
        "arckit/spec/agentic-software-development/skill-architecture.md",
        "arckit/spec/workflow-orchestration-memory.md",
        "arckit/tech/workflow-orchestration-memory/solution.md",
        "arckit/project/state.record.json",
        "arckit/project/STATE.md"
      ],
      "evidence_maturity": "formalized",
      "next": ""
    },
    "verification_state": {
      "status": "satisfied",
      "reason": "已完成脚本语法检查、schema JSON 解析、现有 case 验证、项目状态验证、临时沙盒新建记录验证，并在源事实补齐后再次校验账本。",
      "evidence": [
        "node --check memory/skills/arckit-development-ledger/scripts/development-case.mjs",
        "node --check memory/skills/arckit-development-ledger/scripts/project-state.mjs",
        "node -e JSON.parse(...)",
        "node memory/skills/arckit-development-ledger/scripts/development-case.mjs validate",
        "node memory/skills/arckit-development-ledger/scripts/project-state.mjs validate arckit/project/state.record.json",
        "/private/tmp/arckit-ledger-loop-test"
      ],
      "evidence_maturity": "confirmed",
      "next": ""
    },
    "open_questions": {
      "status": "satisfied",
      "reason": "本轮不需要用户进一步确认；真正自动桥实现作为后续产品缺口。",
      "evidence": [
        "用户确认：可以，按照这个优化"
      ],
      "evidence_maturity": "confirmed",
      "next": ""
    },
    "pending_handoffs": {
      "status": "deferred",
      "reason": "自动桥 controller 不在本轮落地；本轮只把人工触发和未来自动触发共用的 handoff envelope 固化。",
      "evidence": [
        "completion_audit.loop_handoff schema",
        "project loop_control fields"
      ],
      "evidence_maturity": "confirmed",
      "next": "如继续自动桥实现，读取 loop_handoff 并按 next_responsibility/agent_continuation_available/human_decision_required 调度。"
    },
    "workflow_memory_signals": {
      "status": "satisfied",
      "reason": "用户纠偏已固化为 workflow framing 规则：manual_bridge 是 agent continuation 的触发缺口，不是 human decision。",
      "evidence": [
        "entry/skills/using-arckit/SKILL.md",
        "memory/skills/arckit-development-ledger/agents/openai.yaml"
      ],
      "evidence_maturity": "confirmed",
      "next": ""
    }
  },
  "open_questions": [
    "是否继续实现自动桥 controller。"
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
    "自动桥 controller 实现留作后续。"
  ],
  "workflow_memory_signals": [
    "ArcKit loop closeout 应区分责任归属和触发机制，避免把 agent continuation 的人工触发缺口误写成人类决策。"
  ],
  "rounds": [
    {
      "round": 1,
      "summary": "根据用户对人工桥语义的纠偏，更新 using-arckit closeout gate、development-ledger 协议、schema、脚本默认输出和校验。",
      "source_facts_changed": [
        "人工桥是 trigger_mode=manual_bridge，不是 human responsibility。",
        "自动桥未来只应消费 agent-continuable 的 loop_handoff。"
      ],
      "projection_artifacts_changed": [
        "entry/skills/using-arckit/SKILL.md",
        "memory/skills/arckit-development-ledger/SKILL.md",
        "memory/skills/arckit-development-ledger/agents/openai.yaml",
        "memory/skills/arckit-development-ledger/schema/development-case-record.schema.json",
        "memory/skills/arckit-development-ledger/schema/project-state-record.schema.json",
        "memory/skills/arckit-development-ledger/scripts/development-case.mjs",
        "memory/skills/arckit-development-ledger/scripts/project-state.mjs"
      ],
      "deferred_projections": [
        "自动桥 controller。"
      ]
    },
    {
      "round": 2,
      "summary": "根据用户指出的源-投影缺口，补齐 arckit/spec、arckit/tech、project state 和索引，使 Loop Handoff responsibility model 不只停留在 skills 投影。",
      "source_facts_changed": [
        "Loop Handoff 是正式产品概念和接力状态。",
        "自动桥只消费 agent-continuable 且不需要 human decision 的 handoff。",
        "manual_bridge 是触发方式，不是人类职责。"
      ],
      "projection_artifacts_changed": [
        "arckit/spec/agentic-software-development/product-concepts.md",
        "arckit/spec/agentic-software-development/product-architecture.md",
        "arckit/spec/agentic-software-development/skill-architecture.md",
        "arckit/spec/workflow-orchestration-memory.md",
        "arckit/spec/INDEX.md",
        "arckit/tech/workflow-orchestration-memory/solution.md",
        "arckit/tech/INDEX.md",
        "arckit/project/state.record.json",
        "arckit/project/STATE.md"
      ],
      "deferred_projections": [
        "自动桥 controller。"
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
    "loop_handoff": {
      "version": "loop-handoff/v1",
      "status": "done",
      "next_responsibility": "none",
      "agent_continuation_available": false,
      "human_decision_required": false,
      "trigger_mode": "none",
      "responsibility_reason": "本轮协议、schema、脚本、spec、tech、project state 和校验已完成；自动桥 controller 是后续新事项。",
      "next_prompt": "",
      "agent_instruction": {
        "goal": "",
        "required_context_refs": [
          "arckit/project/state.record.json",
          "arckit/cases/closed/CASE-20260707-001-add-loop-handoff-responsibility-model.md"
        ],
        "required_actions": [],
        "required_checks": [],
        "stop_condition": "No continuation is required for this case."
      },
      "human_gate": {
        "required": false,
        "reason": "",
        "decision_needed": ""
      },
      "progress_guard": {
        "expected_state_change": "loop handoff responsibility model implemented",
        "actual_state_change": "using-arckit, development-ledger, schemas, scripts, metadata, spec, tech, project state, and case evidence updated",
        "no_progress_limit": 2,
        "max_auto_rounds": 3
      },
      "blocked_reason": ""
    },
    "updated_at": "2026-07-07T11:20:00.000Z"
  }
}
```

## Round Notes

- Closed after local validation passed.
