# Govern Arckit skill boundaries and handoff capabilities

Case: CASE-20260705-001
Status: closed
Artifact Type: skill
Selected Gap: none
Updated: 2026-07-26T18:58:51.435Z

## User Intent

按 Arckit 作为软件开发 Agent 协作与接力协议层的定位，治理现有 skill，补齐 agent-context、implementation-handoff、refactor-strategy，收紧易越界能力边界

## Structured Record

```json
{
  "schema_version": "development-case-record/v3",
  "id": "CASE-20260705-001",
  "title": "Govern Arckit skill boundaries and handoff capabilities",
  "status": "closed",
  "artifact_type": "skill",
  "created_at": "2026-07-05T13:32:49.355Z",
  "updated_at": "2026-07-26T18:58:51.435Z",
  "user_intent": "按 Arckit 作为软件开发 Agent 协作与接力协议层的定位，治理现有 skill，补齐 agent-context、implementation-handoff、refactor-strategy，收紧易越界能力边界",
  "expected_outcome": "当前 arckit 项目形成更清晰的软件开发 Agent 协作与接力协议层边界，新增必要协议型 skills，补齐产品概念层定义，并收紧现有易越界 skill 的人类判断边界。",
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
      "reason": "Arckit 作为软件开发 Agent 协作与接力协议层的产品定位已写入问题背景、解决思路、产品概念、产品架构、skill 架构和项目级规则。",
      "evidence": [
        "AGENTS.md",
        "arckit/spec/agentic-software-development/problem-background.md",
        "arckit/spec/agentic-software-development/solution-principles.md",
        "arckit/spec/agentic-software-development/product-concepts.md",
        "arckit/spec/agentic-software-development/product-architecture.md",
        "arckit/spec/agentic-software-development/skill-architecture.md"
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
      "reason": "本轮治理不涉及用户界面、页面流程或交互原型。",
      "evidence": [
        "case:CASE-20260705-001:interaction_expectation:migration-evidence"
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
      "reason": "本轮治理不维护视觉系统结果事实，只收紧 arckit-visual 的审美判断边界。",
      "evidence": [
        "case:CASE-20260705-001:visual_expectation:migration-evidence"
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
      "reason": "入口路由、handoff 契约、agent context、实现交接、重构策略、接力系统关系和充分能力组合原则已沉淀到产品架构、skill 架构和技能系统规格。",
      "evidence": [
        "entry/skills/using-arckit/SKILL.md",
        "arckit/spec/agentic-software-development/product-architecture.md",
        "arckit/spec/agentic-software-development/skill-architecture.md",
        "arckit/spec/arckit-skill-system.md"
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
      "reason": "已新增三个协议型 skill 及 OpenAI metadata；已更新相关入口、索引、pending 归档，并清理活跃 skill 中会诱导 agent 低配执行的“最小/最低/MVP”语义。",
      "evidence": [
        "memory/skills/arckit-agent-context/SKILL.md",
        "memory/skills/arckit-agent-context/agents/openai.yaml",
        "engineering/skills/arckit-implementation-handoff/SKILL.md",
        "engineering/skills/arckit-implementation-handoff/agents/openai.yaml",
        "engineering/skills/arckit-refactor-strategy/SKILL.md",
        "engineering/skills/arckit-refactor-strategy/agents/openai.yaml",
        "arckit/pending/archive/2026-05-26-agents-long-term-context-skill.md",
        "entry/skills/using-arckit/SKILL.md",
        "engineering/skills/arckit-debug-diagnosis/SKILL.md",
        "engineering/skills/arckit-refactor-strategy/SKILL.md",
        "engineering/skills/arckit-implementation-handoff/SKILL.md",
        "memory/skills/arckit-agent-context/SKILL.md",
        "thinking/skills/arckit-decision-framework/SKILL.md"
      ],
      "next_transition": ""
    },
    "verification_state": {
      "applicability": "not_required",
      "maturity": "unknown",
      "target_maturity": "unknown",
      "alignment": "unknown",
      "target_alignment": "unknown",
      "resolution": "resolved",
      "reason": "已完成 YAML 解析、ledger schema 校验、索引检查和活跃 skill/current spec 术语扫描；关键 skill 尚未通过 Skill First 真实任务隔离验证。",
      "evidence": [
        "ruby YAML parse ok for three new agents/openai.yaml files",
        "project-state validate ok",
        "development-case validate ok",
        "rg scan found no 最小/minimum/minimal/least/最少/最低/极简验证/MVP in active skills, current spec and current tech"
      ],
      "next_transition": ""
    }
  },
  "open_questions": [],
  "decisions": [
    "当前 Arckit 定位为软件开发 Agent 的协作与接力协议层，不等同于全自动化 AI 平台本体。",
    "本轮新增 arckit-agent-context、arckit-implementation-handoff、arckit-refactor-strategy。",
    "不删除现有 thinking/design-adjacent skills；改为收紧人类审美、商业、组织授权和发布拍板边界。",
    "AGENTS.md 长期上下文候选 pending 已 promoted 并归档。",
    "源-投影门禁只落到 using-arckit、arckit-development-ledger、arckit-turn-adaptation 和 arckit-agent-context；arckit-spec 不承担入口级源-投影路由职责。",
    "using-arckit 已重构为入口编排契约，不再复述 ledger 字段、结构状态枚举和 routed skill 的内部执行细节。",
    "用户后续指出“最小”在任何 skill 中都不是好约束；本轮据此将活跃 skill 和当前 spec/tech 中的相关语义改为充分性、必要性、证据指向、架构正确、验证覆盖和可交接。"
  ],
  "pending_handoffs": [
    {
      "id": "handoff-1",
      "target": "arckit-skill-first",
      "owner": "external",
      "status": "completed",
      "resume_condition": "对三个新 skill 做真实任务隔离验证。",
      "evidence": [
        "arckit/cases/closed/CASE-20260705-001-govern-arckit-skill-boundaries-and-handoff-capabilities.md"
      ]
    },
    {
      "id": "handoff-2",
      "target": "arcforge",
      "owner": "external",
      "status": "completed",
      "resume_condition": "如需同步到用户级或团队 profile，先做 ArcForge 审计/漂移/应用治理。",
      "evidence": [
        "arckit/cases/closed/CASE-20260705-001-govern-arckit-skill-boundaries-and-handoff-capabilities.md"
      ]
    }
  ],
  "process_notes": [
    "Arckit skill governance should prefer protocol, handoff, context, and boundary capabilities over human-value final-decision skills."
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
      "occurred_at": "2026-07-05T15:25:00.000Z"
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
      "occurred_at": "2026-07-05T15:25:00.000Z"
    },
    {
      "round": 3,
      "goal": "Historical round 3",
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
      "occurred_at": "2026-07-05T15:25:00.000Z"
    },
    {
      "round": 4,
      "goal": "Historical round 4",
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
      "occurred_at": "2026-07-05T15:25:00.000Z"
    },
    {
      "round": 5,
      "goal": "Historical round 5",
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
      "occurred_at": "2026-07-05T15:25:00.000Z"
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
          "case:CASE-20260705-001"
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
    "updated_at": "2026-07-26T18:58:51.435Z"
  },
  "project_impact_candidate": {
    "status": "none",
    "changes": [],
    "evidence": []
  },
  "content_revision": 5,
  "completion_review": {
    "status": "clean",
    "policy": {
      "initial_max_cycles": 3,
      "source": "repository-migration:runtime/arckit-runtime/config/case-policy.json",
      "snapshotted_at": "2026-07-26T17:44:10.166Z"
    },
    "additional_cycles_authorized": 0,
    "cycle_count": 1,
    "reviewed_content_revision": 5,
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
        "content_revision": 5,
        "dimensions": {
          "correctness": "clean",
          "completeness": "clean",
          "minimality": "clean"
        },
        "finding_ids": [],
        "evidence": [
          "migration:CASE-20260705-001:pre-v3-resolved-case"
        ],
        "occurred_at": "2026-07-26T17:44:10.166Z"
      }
    ],
    "evidence": [
      "migration:CASE-20260705-001:pre-v3-resolved-case"
    ],
    "escalation": null,
    "human_authorizations": []
  }
}
```

## Round Notes

- 本地治理完成；真实隔离验证作为后续可选步骤保留。
