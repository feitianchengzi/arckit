# Refine generated state decision briefs

Case: CASE-20260705-004
Status: closed
Artifact Type: mixed
Current Gap: none
Updated: 2026-07-05T16:13:39.580Z

## User Intent

将 project 和 iteration Markdown 从状态摘要改为有损的 loop decision brief；canonical JSON 继续作为唯一结构化状态源，并补 projection audit。

## Structured Record

```json
{
  "schema_version": "development-case-record/v1",
  "id": "CASE-20260705-004",
  "title": "Refine generated state decision briefs",
  "status": "closed",
  "artifact_type": "mixed",
  "created_at": "2026-07-05T16:12:23.000Z",
  "updated_at": "2026-07-05T16:13:39.580Z",
  "user_intent": "将 project 和 iteration Markdown 从状态摘要改为有损的 loop decision brief；canonical JSON 继续作为唯一结构化状态源，并补 projection audit。",
  "expected_outcome": "STATE.md 和 iteration Markdown 不再重复完整状态内容，而是生成下一轮 loop 需要的 decision brief；project/iteration audit 能检查 projection 是否由 canonical record 渲染且未漂移。",
  "current_round_goal": "优化 project-state 和 project-iteration 脚本、协议文档和当前 project/iteration projection。",
  "current_round_gap": "none",
  "project_state_ref": "arckit/project/state.record.json",
  "project_state_delta": {
    "changed": [
      "runtime_surfaces",
      "data_state",
      "maintainability_handoff",
      "iteration_governance"
    ],
    "unchanged_unknown": [],
    "deferred": [
      "真实复杂项目 loop 验证",
      "更完整的跨 project/iteration/case 引用一致性审计"
    ],
    "blocked": [],
    "next_project_question": "是否用真实复杂项目验证 decision brief + canonical record 的 loop 效果。",
    "updated_at": "2026-07-05T16:12:23.000Z",
    "state_transitions": [
      "STATE.md projection -> loop decision brief",
      "iteration Markdown embedded JSON -> iteration decision brief plus *.record.json",
      "project-state/project-iteration scripts add audit for projection drift"
    ],
    "iteration_ref": "arckit/project/iterations/ITER-20260705-001-state-driven-loop-foundation.record.json"
  },
  "round_strategy_decision": {
    "selected_route": "generated-lossy-decision-briefs",
    "reason": "如果 Markdown 与 JSON 信息完全等价，agent 读 Markdown 没有价值；Markdown 应该是有损的行动决策视图，JSON 才是完整状态源。",
    "considered_routes": [
      {
        "route": "full-state-markdown-summary",
        "decision": "not_applicable",
        "reason": "会重复 canonical JSON 并制造维护负担。"
      },
      {
        "route": "generated-lossy-decision-briefs",
        "decision": "selected",
        "reason": "保留 agent 快速恢复 loop 的语义入口，同时避免双源状态。"
      }
    ],
    "next_route_triggers": [
      "真实复杂项目验证发现 brief 不足以驱动行动时，调整渲染内容而不是恢复完整 JSON。"
    ],
    "user_visible_summary": "已把 project/iteration Markdown 改成有损 decision brief，并增加 audit 检查 projection 漂移。"
  },
  "structures": {
    "product_expectation": {
      "status": "satisfied",
      "reason": "project 和 iteration Markdown 的产品语义从状态副本改为 loop decision brief。",
      "evidence": [
        "arckit/project/STATE.md",
        "arckit/project/iterations/ITER-20260705-001-state-driven-loop-foundation.md"
      ],
      "evidence_maturity": "confirmed",
      "next": ""
    },
    "interaction_expectation": {
      "status": "satisfied",
      "reason": "agent 先读 Markdown 时获得 loop focus、next transition、风险、禁止误判和 precision refs，而不是完整状态表。",
      "evidence": [
        "arckit/project/STATE.md",
        "arckit/project/iterations/ITER-20260705-001-state-driven-loop-foundation.md"
      ],
      "evidence_maturity": "confirmed",
      "next": ""
    },
    "visual_expectation": {
      "status": "not_applicable",
      "reason": "本轮是状态记录和 Markdown 投影结构优化，不涉及视觉界面。",
      "evidence": [],
      "evidence_maturity": "none",
      "next": ""
    },
    "technical_expectation": {
      "status": "satisfied",
      "reason": "project-state 和 project-iteration 脚本已支持 generated decision brief、canonical record render 和 audit。",
      "evidence": [
        "memory/skills/arckit-development-ledger/scripts/project-state.mjs",
        "memory/skills/arckit-development-ledger/scripts/project-iteration.mjs"
      ],
      "evidence_maturity": "formalized",
      "next": ""
    },
    "implementation_state": {
      "status": "satisfied",
      "reason": "当前 project state 和 active iteration 已迁移并重新渲染；默认 case/iteration project_state_ref 改为 state.record.json。",
      "evidence": [
        "arckit/project/state.record.json",
        "arckit/project/STATE.md",
        "arckit/project/iterations/ITER-20260705-001-state-driven-loop-foundation.record.json",
        "arckit/project/iterations/ITER-20260705-001-state-driven-loop-foundation.md",
        "memory/skills/arckit-development-ledger/scripts/development-case.mjs"
      ],
      "evidence_maturity": "formalized",
      "next": ""
    },
    "verification_state": {
      "status": "satisfied",
      "reason": "脚本语法、project/iteration render、validate 和 audit 均在本轮验证。",
      "evidence": [
        "node memory/skills/arckit-development-ledger/scripts/project-state.mjs audit",
        "node memory/skills/arckit-development-ledger/scripts/project-iteration.mjs audit",
        "node memory/skills/arckit-development-ledger/scripts/development-case.mjs validate",
        "node --check memory/skills/arckit-development-ledger/scripts/project-state.mjs",
        "node --check memory/skills/arckit-development-ledger/scripts/project-iteration.mjs"
      ],
      "evidence_maturity": "confirmed",
      "next": ""
    },
    "open_questions": {
      "status": "satisfied",
      "reason": "剩余问题仍是当前 active iteration 的真实复杂项目 loop 验证。",
      "evidence": [
        "arckit/project/state.record.json"
      ],
      "evidence_maturity": "confirmed",
      "next": ""
    },
    "pending_handoffs": {
      "status": "deferred",
      "reason": "已安装 skill 同步/漂移治理后续由 ArcForge 处理。",
      "evidence": [],
      "evidence_maturity": "none",
      "next": "需要同步安装副本时走 ArcForge。"
    },
    "workflow_memory_signals": {
      "status": "satisfied",
      "reason": "强化流程规则：Markdown projection 应是有损 decision brief，不是 canonical state 的可读副本。",
      "evidence": [
        "memory/skills/arckit-development-ledger/SKILL.md"
      ],
      "evidence_maturity": "confirmed",
      "next": ""
    }
  },
  "open_questions": [
    "是否用真实复杂项目验证 decision brief + canonical record 是否足以驱动 agent loop。"
  ],
  "decisions": [
    "STATE.md 是 generated loop decision brief，不是完整状态摘要。",
    "Iteration Markdown 是 generated iteration decision brief，不再维护内嵌完整 JSON。",
    "Project 和 iteration 的 canonical state 均由 *.record.json 承载。",
    "Audit 必须检查 projection 是否由 canonical record 渲染且未漂移。"
  ],
  "pending_handoffs": [
    "已安装 skill 同步和漂移治理后续处理。"
  ],
  "workflow_memory_signals": [
    "agent-driven platform 也应读写 canonical JSON；Markdown brief 只用于快速语义定位。"
  ],
  "rounds": [
    {
      "round": 1,
      "summary": "将 project/iteration Markdown 优化为有损 decision brief，补 project-state/project-iteration audit，并修正默认 project_state_ref。",
      "source_facts_changed": [
        "Markdown projection 的职责是 loop decision brief，而不是完整状态摘要。",
        "Iteration state 也采用 canonical record + generated brief 的模式。"
      ],
      "projection_artifacts_changed": [
        "memory/skills/arckit-development-ledger/scripts/project-state.mjs",
        "memory/skills/arckit-development-ledger/scripts/project-iteration.mjs",
        "memory/skills/arckit-development-ledger/scripts/development-case.mjs",
        "memory/skills/arckit-development-ledger/SKILL.md",
        "memory/skills/arckit-development-ledger/agents/openai.yaml",
        "entry/skills/using-arckit/SKILL.md",
        "arckit/project/STATE.md",
        "arckit/project/state.record.json",
        "arckit/project/iterations/ITER-20260705-001-state-driven-loop-foundation.record.json",
        "arckit/project/iterations/ITER-20260705-001-state-driven-loop-foundation.md"
      ],
      "deferred_projections": [
        "真实复杂项目 loop 验证",
        "已安装 skill 同步"
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
    "updated_at": "2026-07-05T16:13:39.580Z"
  }
}
```

## Round Notes

- Project and iteration Markdown projections are now decision briefs.
- Canonical state remains in JSON records.
