# Extract project state record JSON

Case: CASE-20260705-003
Status: closed
Artifact Type: mixed
Current Gap: none
Updated: 2026-07-05T15:54:24.572Z

## User Intent

将 arckit/project/STATE.md 内嵌的结构化 JSON 迁移为独立 canonical state.record.json，STATE.md 改为人类/agent 可读投影视图。

## Structured Record

```json
{
  "schema_version": "development-case-record/v1",
  "id": "CASE-20260705-003",
  "title": "Extract project state record JSON",
  "status": "closed",
  "artifact_type": "mixed",
  "created_at": "2026-07-05T15:48:58.178Z",
  "updated_at": "2026-07-05T15:54:24.572Z",
  "user_intent": "将 arckit/project/STATE.md 内嵌的结构化 JSON 迁移为独立 canonical state.record.json，STATE.md 改为人类/agent 可读投影视图。",
  "expected_outcome": "state.record.json 成为项目全局状态的唯一权威结构化记录；STATE.md 变成从该 JSON 渲染的人类/agent 可读投影视图；project-state 脚本支持 migrate/render/validate/summary。",
  "current_round_goal": "完成当前 STATE.md 内嵌 JSON 的迁移、脚本支持、协议文档同步和校验。",
  "current_round_gap": "none",
  "project_state_ref": "arckit/project/state.record.json",
  "project_state_delta": {
    "changed": [
      "data_state",
      "runtime_surfaces",
      "implementation_coverage",
      "maintainability_handoff"
    ],
    "unchanged_unknown": [],
    "deferred": [
      "跨 project/iteration/case 一致性 audit 命令"
    ],
    "blocked": [],
    "next_project_question": "是否在后续增加跨记录 audit，用于检查 state.record.json、STATE.md projection、iteration state 和 case refs 的一致性。",
    "updated_at": "2026-07-05T15:50:39.000Z",
    "state_transitions": [
      "STATE.md embedded JSON -> arckit/project/state.record.json canonical record",
      "STATE.md full structured record -> generated projection",
      "project-state.mjs adds migrate/render and defaults validate/summary to state.record.json"
    ],
    "iteration_ref": "arckit/project/iterations/ITER-20260705-001-state-driven-loop-foundation.md"
  },
  "round_strategy_decision": {
    "selected_route": "canonical-json-plus-markdown-projection",
    "reason": "状态驱动 loop 的机器可消费状态需要独立 JSON 权威源；STATE.md 更适合作为阅读投影，避免 Markdown 与 JSON 双源漂移。",
    "considered_routes": [
      {
        "route": "keep-embedded-json",
        "decision": "deferred",
        "reason": "内嵌 JSON 对过渡期简单，但长期不适合脚本、平台和多 agent 稳定读写。"
      },
      {
        "route": "canonical-json-plus-markdown-projection",
        "decision": "selected",
        "reason": "满足机器读写和人类阅读两种需求，并明确只有 state.record.json 是权威状态。"
      }
    ],
    "next_route_triggers": [
      "如果 projection 与 canonical record 频繁漂移，补跨记录 audit 或强制 render 检查。"
    ],
    "user_visible_summary": "已把 STATE.md 的内嵌 JSON 迁移到 state.record.json，STATE.md 变为投影视图。"
  },
  "structures": {
    "product_expectation": {
      "status": "satisfied",
      "reason": "状态文件职责已拆分为 canonical JSON record 和 Markdown projection。",
      "evidence": [
        "arckit/project/state.record.json",
        "arckit/project/STATE.md"
      ],
      "evidence_maturity": "formalized",
      "next": ""
    },
    "interaction_expectation": {
      "status": "satisfied",
      "reason": "STATE.md 现在展示 loop control、active state、state gaps 和维度摘要，避免完整 JSON 噪音。",
      "evidence": [
        "arckit/project/STATE.md"
      ],
      "evidence_maturity": "confirmed",
      "next": ""
    },
    "visual_expectation": {
      "status": "not_applicable",
      "reason": "本轮是状态存储和 Markdown 投影结构调整，不涉及视觉界面。",
      "evidence": [],
      "evidence_maturity": "none",
      "next": ""
    },
    "technical_expectation": {
      "status": "satisfied",
      "reason": "project-state 脚本已支持 state.record.json、legacy embedded JSON migration、projection render 和从 STATE.md 解析 canonical record。",
      "evidence": [
        "memory/skills/arckit-development-ledger/scripts/project-state.mjs"
      ],
      "evidence_maturity": "formalized",
      "next": "如需要更强一致性，后续增加跨记录 audit。"
    },
    "implementation_state": {
      "status": "satisfied",
      "reason": "当前项目状态已迁移到 state.record.json，STATE.md 已由脚本重新渲染。",
      "evidence": [
        "arckit/project/state.record.json",
        "arckit/project/STATE.md",
        "memory/skills/arckit-development-ledger/SKILL.md",
        "entry/skills/using-arckit/SKILL.md",
        "memory/skills/arckit-development-ledger/agents/openai.yaml"
      ],
      "evidence_maturity": "formalized",
      "next": ""
    },
    "verification_state": {
      "status": "satisfied",
      "reason": "canonical JSON、STATE.md projection resolving、project-state script syntax 和 JSON parse 均已验证。",
      "evidence": [
        "node memory/skills/arckit-development-ledger/scripts/project-state.mjs validate arckit/project/state.record.json",
        "node memory/skills/arckit-development-ledger/scripts/project-state.mjs validate arckit/project/STATE.md",
        "node --check memory/skills/arckit-development-ledger/scripts/project-state.mjs",
        "node -e JSON.parse(...) arckit/project/state.record.json"
      ],
      "evidence_maturity": "confirmed",
      "next": "关闭 case 前再运行完整 ledger validation。"
    },
    "open_questions": {
      "status": "satisfied",
      "reason": "剩余问题已进入 project state 的 state gap：是否补跨记录 audit。",
      "evidence": [
        "arckit/project/state.record.json"
      ],
      "evidence_maturity": "confirmed",
      "next": ""
    },
    "pending_handoffs": {
      "status": "deferred",
      "reason": "安装副本同步或 ArcForge 漂移治理不属于本轮迁移。",
      "evidence": [],
      "evidence_maturity": "none",
      "next": "需要发布或同步时再处理。"
    },
    "workflow_memory_signals": {
      "status": "satisfied",
      "reason": "本轮强化了状态驱动 loop 的存储规则：机器状态与阅读投影分离。",
      "evidence": [
        "memory/skills/arckit-development-ledger/SKILL.md"
      ],
      "evidence_maturity": "confirmed",
      "next": ""
    }
  },
  "open_questions": [
    "是否后续增加跨记录 audit 检查 canonical record、projection、iteration state 和 case refs 一致性。"
  ],
  "decisions": [
    "arckit/project/state.record.json 是全局项目状态的唯一权威结构化记录。",
    "arckit/project/STATE.md 是由 state.record.json 渲染的人类/agent 可读投影视图，不内嵌完整 JSON。",
    "project-state 脚本保留 legacy embedded JSON migration 兼容能力。"
  ],
  "pending_handoffs": [
    "如需要分发到已安装 skill，后续走 ArcForge 漂移/应用流程。"
  ],
  "workflow_memory_signals": [
    "状态驱动 loop 的机器状态应优先使用 canonical JSON，Markdown 只作为投影。"
  ],
  "rounds": [
    {
      "round": 1,
      "summary": "把 STATE.md 内嵌 JSON 迁移到 state.record.json，改造 STATE.md 为投影，并同步 project-state 脚本和协议文档。",
      "source_facts_changed": [
        "project state 的 canonical machine-readable source 是 state.record.json。",
        "STATE.md 不再是结构化状态承载，而是 projection。"
      ],
      "projection_artifacts_changed": [
        "arckit/project/state.record.json",
        "arckit/project/STATE.md",
        "memory/skills/arckit-development-ledger/scripts/project-state.mjs",
        "memory/skills/arckit-development-ledger/SKILL.md",
        "memory/skills/arckit-development-ledger/agents/openai.yaml",
        "entry/skills/using-arckit/SKILL.md"
      ],
      "deferred_projections": [
        "跨记录 audit 命令"
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
    "updated_at": "2026-07-05T15:54:24.572Z"
  }
}
```

## Round Notes

- `state.record.json` is now the canonical project state record.
- `STATE.md` is a rendered projection and should not embed the full structured JSON.
