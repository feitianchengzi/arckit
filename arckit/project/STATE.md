# Arckit Skill Repository Project State

Status: active
Updated: 2026-07-05T15:25:00.000Z

## Purpose

Arckit 是软件开发 Agent 的协作与接力协议层，支撑人类、Codex 类单 agent 和多 agent 自动化平台围绕同一套项目事实、case 状态、handoff、pending、workflow memory 和 agent context 持续协作。

## Structured Record

```json
{
  "schema_version": "project-state-record/v1",
  "project": {
    "name": "Arckit Skill Repository",
    "status": "active",
    "created_at": "2026-07-05T13:32:43.579Z",
    "updated_at": "2026-07-05T15:25:00.000Z",
    "original_intent": "治理 Arckit skill 体系，使其同时支撑 Codex 类人机协作和多 Agent 自动化平台的软件开发接力协议"
  },
  "active_iteration_ref": "",
  "active_case_refs": [],
  "dimensions": {
    "project_goal": {
      "status": "satisfied",
      "reason": "项目目标已明确为软件开发 Agent 的协作与接力协议层，而不是全自动化 AI 平台本体或单一 agent skill 集。",
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
    "target_users": {
      "status": "satisfied",
      "reason": "目标使用者包含人类开发者、Codex 类单 agent、多 agent 自动化平台和接手任务的人类。",
      "evidence": [
        "arckit/spec/agentic-software-development/product-concepts.md",
        "arckit/spec/agentic-software-development/product-architecture.md",
        "arckit/spec/agentic-software-development/skill-architecture.md"
      ],
      "evidence_maturity": "formalized",
      "next": ""
    },
    "core_scenarios": {
      "status": "satisfied",
      "reason": "核心场景覆盖项目状态恢复、case 管理、事实源治理、durable agent context、实现交接、重构策略、诊断和外部 adapter handoff。",
      "evidence": [
        "arckit/spec/agentic-software-development/product-concepts.md",
        "arckit/spec/agentic-software-development/product-architecture.md",
        "entry/skills/using-arckit/SKILL.md",
        "memory/skills/arckit-agent-context/SKILL.md",
        "engineering/skills/arckit-implementation-handoff/SKILL.md",
        "engineering/skills/arckit-refactor-strategy/SKILL.md"
      ],
      "evidence_maturity": "formalized",
      "next": ""
    },
    "platform_targets": {
      "status": "deferred",
      "reason": "Arckit 支撑 Codex 类 agent 和多 agent 平台，但平台调度、loop、权限、队列、通知和人类接手机制不在当前仓库内实现。",
      "evidence": [
        "arckit/spec/agentic-software-development/skill-architecture.md"
      ],
      "evidence_maturity": "confirmed",
      "next": "若进入全自动化 AI 平台实现，应在独立平台项目中定义。"
    },
    "client_surface": {
      "status": "not_applicable",
      "reason": "当前仓库维护 agent skill 和 Arckit 文档，不直接提供客户端 UI。",
      "evidence": [],
      "evidence_maturity": "none",
      "next": ""
    },
    "server_need": {
      "status": "not_applicable",
      "reason": "当前治理不需要服务端；多 agent 平台服务能力属于外部平台层。",
      "evidence": [],
      "evidence_maturity": "none",
      "next": ""
    },
    "account_identity": {
      "status": "not_applicable",
      "reason": "当前 skill 仓库不定义账号体系。",
      "evidence": [],
      "evidence_maturity": "none",
      "next": ""
    },
    "data_persistence": {
      "status": "satisfied",
      "reason": "项目状态、case、pending、spec、tech、workflow memory 和 agent context 分别有明确持久化 surface。",
      "evidence": [
        "arckit/project/STATE.md",
        "arckit/cases/",
        "arckit/pending/",
        "arckit/spec/",
        "AGENTS.md"
      ],
      "evidence_maturity": "formalized",
      "next": ""
    },
    "sync_collaboration": {
      "status": "satisfied",
      "reason": "Arckit 通过 project state、case record、handoff、pending 和 AGENTS.md 支撑多轮、多 agent 和人类接手协作。",
      "evidence": [
        "arckit/spec/agentic-software-development/skill-architecture.md",
        "memory/skills/arckit-agent-context/SKILL.md",
        "engineering/skills/arckit-implementation-handoff/SKILL.md"
      ],
      "evidence_maturity": "formalized",
      "next": ""
    },
    "deployment_distribution": {
      "status": "deferred",
      "reason": "当前仓库是 skill 维护源；正式同步、profile、apply 或团队治理应由 ArcForge 类治理能力处理。",
      "evidence": [
        "AGENTS.md"
      ],
      "evidence_maturity": "confirmed",
      "next": "需要分发或同步时交给 ArcForge 做审计、漂移和应用治理。"
    },
    "quality_bar": {
      "status": "deferred",
      "reason": "本轮完成结构校验、ledger 校验、YAML 解析和活跃 skill/current spec 术语扫描；真实场景隔离验证仍建议交给 Skill First。",
      "evidence": [
        "arckit/cases/closed/CASE-20260705-001-govern-arckit-skill-boundaries-and-handoff-capabilities.md"
      ],
      "evidence_maturity": "confirmed",
      "next": "对 using-arckit、debug diagnosis、agent context、implementation handoff 和 refactor strategy 等关键 skill 进行 Skill First 隔离验证。"
    },
    "technical_foundation": {
      "status": "satisfied",
      "reason": "当前技术基础为 Markdown skill 契约、agents/openai.yaml metadata、Arckit ledger 脚本和文档事实源。",
      "evidence": [
        "memory/skills/arckit-agent-context/",
        "engineering/skills/arckit-implementation-handoff/",
        "engineering/skills/arckit-refactor-strategy/",
        "memory/skills/arckit-development-ledger/"
      ],
      "evidence_maturity": "formalized",
      "next": ""
    },
    "iteration_strategy": {
      "status": "satisfied",
      "reason": "能力演进策略是优先补接力、上下文治理、执行边界和恢复能力；对人类审美、商业、组织授权和发布拍板类能力保持 handoff/pending 边界。",
      "evidence": [
        "AGENTS.md",
        "arckit/spec/agentic-software-development/skill-architecture.md"
      ],
      "evidence_maturity": "formalized",
      "next": ""
    }
  },
  "decisions": [
    "Arckit 定位为软件开发 Agent 的协作与接力协议层。",
    "全自动化 AI 平台的多 agent 调度、loop、权限、队列、环境和人类接手机制属于平台层，不要求全部来自 Arckit。",
    "当前仓库优先沉淀 agent 可靠协作、上下文恢复、事实治理、handoff、实现边界、诊断和安全接力能力。",
    "需要人类审美、商业优先级、组织授权或发布承担的事项可被 Arckit 整理为分析、证据、pending 或 external adapter handoff，但不应成为静默最终裁决 skill。",
    "源-投影门禁由 using-arckit、arckit-development-ledger、arckit-turn-adaptation 和 arckit-agent-context 承担；arckit-spec 不承担入口级源-投影路由职责。",
    "using-arckit 是入口编排契约，不复述 development-ledger 的字段语义、状态 schema 或 routed skill 的内部维护细节。",
    "Arckit skills 不以“最小、最少、最低成本或 MVP”作为 agent 行为目标；入口和各 skill 应强调事实充分、架构正确、验证覆盖、交接清楚和真实项目可接手。"
  ],
  "open_questions": [
    "是否对 arckit-agent-context、arckit-implementation-handoff 和 arckit-refactor-strategy 做 Skill First 隔离验证。",
    "多 agent 自动化平台自身是否作为独立项目维护。"
  ],
  "project_memory": [
    "2026-07-05 完成 Arckit skill 体系治理：新增 agent context、implementation handoff 和 refactor strategy，收紧人类判断边界。",
    "2026-07-05 补齐产品概念升级：Arckit 正式定义为支撑人类、Codex 类单 agent 和多 agent 自动化平台的软件开发 Agent 协作与接力协议层。",
    "2026-07-05 按用户确认只优化 using-arckit、development-ledger、turn-adaptation 和 agent-context 的源-投影门禁，不改 arckit-spec。",
    "2026-07-05 重构 using-arckit/SKILL.md：从字段说明型长文收敛为入口编排契约，保留职责边界、门禁、路由和收口。",
    "2026-07-05 根据用户后续全局纠偏，完成活跃 skill 和当前 spec/tech 中“最小/最低/MVP”语义清理：不再把少做、低配或低成本作为 agent 的默认正确性目标。"
  ],
  "artifacts": [
    "memory/skills/arckit-agent-context/SKILL.md",
    "engineering/skills/arckit-implementation-handoff/SKILL.md",
    "engineering/skills/arckit-refactor-strategy/SKILL.md",
    "arckit/spec/agentic-software-development/problem-background.md",
    "arckit/spec/agentic-software-development/solution-principles.md",
    "arckit/spec/agentic-software-development/product-concepts.md",
    "arckit/spec/agentic-software-development/product-architecture.md",
    "entry/skills/using-arckit/SKILL.md",
    "engineering/skills/arckit-debug-diagnosis/SKILL.md",
    "thinking/skills/arckit-decision-framework/SKILL.md",
    "definition/skills/arckit-interaction/SKILL.md",
    "definition/skills/arckit-visual/SKILL.md",
    "memory/skills/arckit-development-ledger/SKILL.md",
    "entry/skills/arckit-turn-adaptation/SKILL.md",
    "arckit/cases/closed/CASE-20260705-001-govern-arckit-skill-boundaries-and-handoff-capabilities.md"
  ],
  "last_project_state_delta": {
    "changed": [
      "project_goal",
      "target_users",
      "core_scenarios",
      "data_persistence",
      "sync_collaboration",
      "technical_foundation",
      "iteration_strategy"
      ,
      "quality_bar"
    ],
    "unchanged_unknown": [],
    "deferred": [
      "platform_targets",
      "deployment_distribution",
      "quality_bar"
    ],
    "blocked": [],
    "next_project_question": "是否进入 Skill First 隔离验证，并是否把多 agent 自动化平台作为独立项目推进。",
    "updated_at": "2026-07-05T15:25:00.000Z"
  }
}
```

## Notes

- Project state tracks the continuous software project context across cases, iterations, and restarted agent conversations.
