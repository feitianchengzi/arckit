# Govern Arckit skill boundaries and handoff capabilities

Case: CASE-20260705-001
Status: closed
Artifact Type: skill
Current Gap: none
Updated: 2026-07-05T15:25:00.000Z

## User Intent

按 Arckit 作为软件开发 Agent 协作与接力协议层的定位，治理现有 skill，补齐 agent-context、implementation-handoff、refactor-strategy，收紧易越界能力边界

## Structured Record

```json
{
  "schema_version": "development-case-record/v1",
  "id": "CASE-20260705-001",
  "title": "Govern Arckit skill boundaries and handoff capabilities",
  "status": "closed",
  "artifact_type": "skill",
  "created_at": "2026-07-05T13:32:49.355Z",
  "updated_at": "2026-07-05T15:25:00.000Z",
  "user_intent": "按 Arckit 作为软件开发 Agent 协作与接力协议层的定位，治理现有 skill，补齐 agent-context、implementation-handoff、refactor-strategy，收紧易越界能力边界",
  "expected_outcome": "当前 arckit 项目形成更清晰的软件开发 Agent 协作与接力协议层边界，新增必要协议型 skills，补齐产品概念层定义，并收紧现有易越界 skill 的人类判断边界。",
  "current_round_goal": "完成本地治理落地：新增三个协议型 skill，更新产品概念、产品架构、入口路由和 skill 架构，归档已实现 pending，补项目级 scope 原则，重构 using-arckit，并完成全局去最小化偏置治理。",
  "current_round_gap": "none",
  "project_state_ref": "arckit/project/STATE.md",
  "project_state_delta": {
    "changed": [
      "project_goal",
      "core_scenarios",
      "technical_foundation",
      "iteration_strategy"
    ],
    "unchanged_unknown": [
      "platform_targets",
      "client_surface",
      "server_need",
      "account_identity",
      "data_persistence",
      "sync_collaboration",
      "deployment_distribution"
    ],
    "deferred": [
      "quality_bar"
    ],
    "blocked": [],
    "next_project_question": "是否要用 Skill First 对 arckit-agent-context、arckit-implementation-handoff 和 arckit-refactor-strategy 做真实任务隔离验证。",
    "updated_at": "2026-07-05T15:25:00.000Z"
  },
  "round_strategy_decision": {
    "selected_route": "selected",
    "reason": "用户要求完整治理当前 Arckit skill 体系；本轮最有效路线是本地 skill 维护和边界收紧，而不是继续抽象讨论或引入平台层实现。",
    "considered_routes": [
      {
        "route": "继续定位讨论",
        "decision": "deferred",
        "reason": "用户已经要求执行治理，定位判断足够支撑本轮改动。"
      },
      {
        "route": "新增协议型 skills",
        "decision": "selected",
        "reason": "agent-context、implementation-handoff、refactor-strategy 都直接支撑人机协作和多 agent 接力。"
      },
      {
        "route": "删除现有 thinking/design skills",
        "decision": "deferred",
        "reason": "现有 skill 大体仍符合 Arckit，只需收紧边界，未发现必须删除的越界能力。"
      },
      {
        "route": "引入全自动平台能力",
        "decision": "deferred",
        "reason": "平台调度、loop、权限、队列和人类接手机制属于外部平台层，不在本轮 Arckit 仓库内实现。"
      }
    ],
    "next_route_triggers": [
      "用户要求真实隔离验证时交给 arckit-skill-first",
      "用户要求同步到已安装 agent 目录或做治理审计时交给 arcforge",
      "后续真实任务暴露 skill 执行问题时回到对应 skill 维护"
    ],
    "user_visible_summary": "本轮按协议层定位治理：补接力基础设施，收紧人类判断边界，不把 Arckit 扩成全自动平台本体。"
  },
  "structures": {
    "product_expectation": {
      "status": "satisfied",
      "reason": "Arckit 作为软件开发 Agent 协作与接力协议层的产品定位已写入问题背景、解决思路、产品概念、产品架构、skill 架构和项目级规则。",
      "evidence": [
        "AGENTS.md",
        "arckit/spec/agentic-software-development/problem-background.md",
        "arckit/spec/agentic-software-development/solution-principles.md",
        "arckit/spec/agentic-software-development/product-concepts.md",
        "arckit/spec/agentic-software-development/product-architecture.md",
        "arckit/spec/agentic-software-development/skill-architecture.md"
      ],
      "evidence_maturity": "formalized",
      "next": ""
    },
    "interaction_expectation": {
      "status": "not_applicable",
      "reason": "本轮治理不涉及用户界面、页面流程或交互原型。",
      "evidence": [],
      "evidence_maturity": "none",
      "next": ""
    },
    "visual_expectation": {
      "status": "not_applicable",
      "reason": "本轮治理不维护视觉系统结果事实，只收紧 arckit-visual 的审美判断边界。",
      "evidence": [],
      "evidence_maturity": "none",
      "next": ""
    },
    "technical_expectation": {
      "status": "satisfied",
      "reason": "入口路由、handoff 契约、agent context、实现交接、重构策略、接力系统关系和充分能力组合原则已沉淀到产品架构、skill 架构和技能系统规格。",
      "evidence": [
        "entry/skills/using-arckit/SKILL.md",
        "arckit/spec/agentic-software-development/product-architecture.md",
        "arckit/spec/agentic-software-development/skill-architecture.md",
        "arckit/spec/arckit-skill-system.md"
      ],
      "evidence_maturity": "formalized",
      "next": ""
    },
    "implementation_state": {
      "status": "satisfied",
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
      "evidence_maturity": "formalized",
      "next": ""
    },
    "verification_state": {
      "status": "deferred",
      "reason": "已完成 YAML 解析、ledger schema 校验、索引检查和活跃 skill/current spec 术语扫描；关键 skill 尚未通过 Skill First 真实任务隔离验证。",
      "evidence": [
        "ruby YAML parse ok for three new agents/openai.yaml files",
        "project-state validate ok",
        "development-case validate ok",
        "rg scan found no 最小/minimum/minimal/least/最少/最低/极简验证/MVP in active skills, current spec and current tech"
      ],
      "evidence_maturity": "confirmed",
      "next": "可用 arckit-skill-first 分别模拟 durable context 捕获、implementation handoff 生成、refactor strategy 生成、debug diagnosis 和 using-arckit 入口编排。"
    },
    "open_questions": {
      "status": "satisfied",
      "reason": "本轮未发现需要阻塞治理的开放问题；是否做隔离验证作为后续可选步骤。",
      "evidence": [
        "当前未删除任何现有 skill；只归档已实现 pending"
      ],
      "evidence_maturity": "confirmed",
      "next": ""
    },
    "pending_handoffs": {
      "status": "satisfied",
      "reason": "AGENTS.md 长期上下文候选项已从 active pending 提升并归档；后续验证和治理交接点明确。",
      "evidence": [
        "arckit/pending/INDEX.md",
        "arckit/pending/archive/2026-05-26-agents-long-term-context-skill.md"
      ],
      "evidence_maturity": "formalized",
      "next": ""
    },
    "workflow_memory_signals": {
      "status": "deferred",
      "reason": "本轮形成了可复用治理信号，但 workflow memory 写入目标在用户级 ~/.arckit，不在当前仓库治理范围内。",
      "evidence": [
        "AGENTS.md Arckit Scope",
        "arckit/spec/agentic-software-development/skill-architecture.md"
      ],
      "evidence_maturity": "confirmed",
      "next": "若后续需要，可把“Arckit 治理优先补协议型接力能力”的协作方式沉淀到 workflow memory。"
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
      "target": "arckit-skill-first",
      "summary": "对三个新 skill 做真实任务隔离验证。",
      "confirmation": "需要用户确认是否进入 Skill First 验证。"
    },
    {
      "target": "arcforge",
      "summary": "如需同步到用户级或团队 profile，先做 ArcForge 审计/漂移/应用治理。",
      "confirmation": "需要用户确认目标目录和治理动作。"
    }
  ],
  "workflow_memory_signals": [
    "Arckit skill governance should prefer protocol, handoff, context, and boundary capabilities over human-value final-decision skills."
  ],
  "rounds": [
    {
      "at": "2026-07-05T13:52:00.000Z",
      "summary": "新增三个协议型 skill；更新 AGENTS scope、using-arckit 路由、产品概念、产品架构、解决思路、问题背景、skill architecture 和 skill system；收紧 decision/explore/visual 边界；归档已实现 AGENTS.md long-term context pending；完成本地结构校验。"
    },
    {
      "at": "2026-07-05T14:10:00.000Z",
      "summary": "根据用户反馈补齐产品概念升级的正式事实源：不再只更新 skill 架构，而是同步 problem-background、solution-principles、product-concepts、product-architecture、arckit-skill-system 和 spec index。"
    },
    {
      "at": "2026-07-05T14:25:00.000Z",
      "summary": "按用户限定范围优化 using-arckit、arckit-development-ledger、arckit-turn-adaptation 和 arckit-agent-context：加入源-投影门禁、账本记录要求、source_projection_correction 和 AGENTS 路由边界；未修改 arckit-spec。"
    },
    {
      "at": "2026-07-05T14:40:00.000Z",
      "summary": "重构 using-arckit/SKILL.md：删除 ledger 字段清单和状态枚举，保留入口职责边界、硬约束、主流程、能力路由和输出要求。"
    },
    {
      "at": "2026-07-05T15:25:00.000Z",
      "summary": "根据用户纠偏完整检查活跃 skills：移除“最小/最低/MVP”作为 agent 行为目标的表述，并同步当前 product spec/tech 中的入口编排、handoff、debug、decision 和验证语义。"
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
    "updated_at": "2026-07-05T15:25:00.000Z"
  }
}
```

## Round Notes

- 本地治理完成；真实隔离验证作为后续可选步骤保留。
