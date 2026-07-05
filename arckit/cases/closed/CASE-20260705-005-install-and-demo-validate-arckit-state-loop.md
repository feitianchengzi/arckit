# Install and demo validate arckit state loop

Case: CASE-20260705-005
Status: closed
Artifact Type: mixed
Current Gap: none
Updated: 2026-07-05T16:33:06.419Z

## User Intent

安装 Arckit 到 Codex 用户级应用目录，并用 ../arckit-demo 验证状态账本能力；修复验证发现的 iteration index 自动生成缺口。

## Structured Record

```json
{
  "schema_version": "development-case-record/v1",
  "id": "CASE-20260705-005",
  "title": "Install and demo validate arckit state loop",
  "status": "closed",
  "artifact_type": "mixed",
  "created_at": "2026-07-05T16:31:37.418Z",
  "updated_at": "2026-07-05T16:33:06.419Z",
  "user_intent": "安装 Arckit 到 Codex 用户级应用目录，并用 ../arckit-demo 验证状态账本能力；修复验证发现的 iteration index 自动生成缺口。",
  "expected_outcome": "Arckit 已安装到 Codex 用户级 skills 目录；subagent 在 ../arckit-demo 中验证 project state、iteration state、case 脚本；发现的 iteration index 自动生成缺口已在源 skill 和已安装副本中修复并复测。",
  "current_round_goal": "安装当前 arckit skill 源到 /Users/Glare/.codex/skills，并用 demo 项目验证状态驱动账本能力。",
  "current_round_gap": "none",
  "project_state_ref": "arckit/project/state.record.json",
  "project_state_delta": {
    "changed": [
      "runtime_surfaces",
      "iteration_governance",
      "quality_validation"
    ],
    "unchanged_unknown": [],
    "deferred": [],
    "blocked": [],
    "next_project_question": "是否继续用更复杂的真实项目验证状态驱动 loop 在多轮开发中的稳定性。",
    "updated_at": "2026-07-05T16:33:20.000Z",
    "state_transitions": [
      "installed Codex skill target synchronized with current Arckit source",
      "project-iteration new now refreshes ITERATIONS.md automatically",
      "project-iteration audit now detects missing or stale ITERATIONS.md"
    ],
    "iteration_ref": "arckit/project/iterations/ITER-20260705-001-state-driven-loop-foundation.record.json"
  },
  "round_strategy_decision": {
    "selected_route": "install-then-demo-subagent-validation",
    "reason": "用户要求先安装到应用目录，再用 subagent 在 demo 项目中验证能力；发现脚本行为与文档不一致时，应修复源 skill、重新安装并复测。",
    "considered_routes": [
      {
        "route": "report-only-after-subagent",
        "decision": "not_applicable",
        "reason": "subagent 发现的是真实能力缺口，只报告不修复会留下可重复失败。"
      },
      {
        "route": "fix-source-reinstall-retest",
        "decision": "selected",
        "reason": "保持源仓库、已安装副本和 demo 验证结果一致。"
      }
    ],
    "next_route_triggers": [
      "如果后续 demo 或真实项目发现跨 project/iteration/case 引用审计不足，继续增强 audit。"
    ],
    "user_visible_summary": "已安装、subagent 验证、修复 ITERATIONS.md 自动生成缺口、重新安装并复测通过。"
  },
  "structures": {
    "product_expectation": {
      "status": "satisfied",
      "reason": "状态机制的产品行为要求包含可恢复的项目状态、迭代状态、case evidence 和索引入口；本轮补齐了 iteration index 自动维护行为。",
      "evidence": [
        "memory/skills/arckit-development-ledger/SKILL.md",
        "memory/skills/arckit-development-ledger/scripts/project-iteration.mjs"
      ],
      "evidence_maturity": "confirmed",
      "next": ""
    },
    "interaction_expectation": {
      "status": "satisfied",
      "reason": "agent 在 demo 项目中可从 STATE.md、ITERATIONS.md、iteration brief 和 canonical record 恢复状态入口。",
      "evidence": [
        "../arckit-demo/arckit/project/STATE.md",
        "../arckit-demo/arckit/project/ITERATIONS.md"
      ],
      "evidence_maturity": "confirmed",
      "next": ""
    },
    "visual_expectation": {
      "status": "not_applicable",
      "reason": "本轮是 skill 安装、脚本行为和账本能力验证，不涉及视觉界面。",
      "evidence": [],
      "evidence_maturity": "none",
      "next": ""
    },
    "technical_expectation": {
      "status": "satisfied",
      "reason": "project-iteration 脚本现在在 new/migrate 后刷新 ITERATIONS.md，并在 audit 中检查索引缺失或漂移。",
      "evidence": [
        "memory/skills/arckit-development-ledger/scripts/project-iteration.mjs"
      ],
      "evidence_maturity": "formalized",
      "next": ""
    },
    "implementation_state": {
      "status": "satisfied",
      "reason": "Arckit 已通过 ArcForge 应用到 /Users/Glare/.codex/skills；demo 项目由已安装脚本生成 project state、iteration state 和 case。",
      "evidence": [
        "/Users/Glare/.codex/skills/arckit-development-ledger/SKILL.md",
        "/Users/Glare/.codex/skills/arckit-development-ledger/scripts/project-iteration.mjs",
        "../arckit-demo/arckit/project/state.record.json",
        "../arckit-demo/arckit/project/iterations/ITER-20260705-002-index-auto-update-smoke.record.json"
      ],
      "evidence_maturity": "confirmed",
      "next": ""
    },
    "verification_state": {
      "status": "satisfied",
      "reason": "subagent 和主 agent 均完成验证；修复后 demo 中 project/iteration audit 通过，Markdown 投影无内嵌 JSON。",
      "evidence": [
        "arcforge applied drift --root /Users/Glare/Library/Developer/ModularProgram/feitianchengzi/arckit --id arckit-default-01082ca0",
        "node /Users/Glare/.codex/skills/arckit-development-ledger/scripts/project-iteration.mjs audit",
        "node /Users/Glare/.codex/skills/arckit-development-ledger/scripts/project-state.mjs audit",
        "rg '```json|Structured Record' arckit/project/STATE.md arckit/project/iterations arckit/project/ITERATIONS.md"
      ],
      "evidence_maturity": "confirmed",
      "next": ""
    },
    "open_questions": {
      "status": "satisfied",
      "reason": "本轮没有阻塞问题；剩余方向仍是更复杂真实项目的 loop 验证。",
      "evidence": [
        "subagent Dirac validation result"
      ],
      "evidence_maturity": "confirmed",
      "next": ""
    },
    "pending_handoffs": {
      "status": "satisfied",
      "reason": "没有外部 handoff；已安装副本和 demo 产物可作为后续验证入口。",
      "evidence": [],
      "evidence_maturity": "none",
      "next": ""
    },
    "workflow_memory_signals": {
      "status": "satisfied",
      "reason": "真实 subagent 验证证明状态机制能初始化和审计 demo 项目，同时暴露并修复了索引维护缺口。",
      "evidence": [
        "subagent Dirac validation result",
        "../arckit-demo/arckit/project/ITERATIONS.md"
      ],
      "evidence_maturity": "confirmed",
      "next": ""
    }
  },
  "open_questions": [
    "是否继续用更复杂真实项目验证 state gap -> case -> verification -> state delta 的多轮闭环。"
  ],
  "decisions": [
    "安装目标使用 /Users/Glare/.codex/skills，并通过 ArcForge 保存应用关系 arckit-default-01082ca0。",
    "subagent demo 验证发现的 project-iteration index 缺口应在源 skill 中修复，而不是只要求 agent 记得手动运行 index。",
    "project-iteration new/migrate 自动刷新 ITERATIONS.md；audit 检查 index 缺失或 stale。"
  ],
  "pending_handoffs": [],
  "workflow_memory_signals": [],
  "rounds": [
    {
      "round": 1,
      "summary": "安装 Arckit 到 Codex 用户级 skills；subagent 在 arckit-demo 中验证状态账本能力；修复 iteration index 自动生成缺口；重新安装并复测通过。",
      "source_facts_changed": [
        "project-iteration index 是迭代状态入口的一部分，应由脚本自动维护并由 audit 检查。"
      ],
      "projection_artifacts_changed": [
        "memory/skills/arckit-development-ledger/scripts/project-iteration.mjs",
        "/Users/Glare/.codex/skills/arckit-development-ledger/scripts/project-iteration.mjs",
        "../arckit-demo/arckit/project/ITERATIONS.md"
      ],
      "deferred_projections": [
        "更复杂真实项目的多轮 loop 验证"
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
    "updated_at": "2026-07-05T16:33:06.419Z"
  }
}
```

## Round Notes

- Installed Arckit to `/Users/Glare/.codex/skills` with ArcForge relation `arckit-default-01082ca0`.
- Subagent validated project state, iteration state and case creation in `../arckit-demo`.
- Fixed `project-iteration.mjs` so `new` and `migrate` refresh `ITERATIONS.md`, and `audit` checks missing/stale index.
- Reinstalled and verified the demo `project-iteration audit` and `project-state audit` pass.
