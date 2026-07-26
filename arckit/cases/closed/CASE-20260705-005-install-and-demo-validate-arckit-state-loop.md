# Install and demo validate arckit state loop

Case: CASE-20260705-005
Status: closed
Artifact Type: mixed
Selected Gap: none
Updated: 2026-07-26T18:58:51.796Z

## User Intent

安装 Arckit 到 Codex 用户级应用目录，并用 ../arckit-demo 验证状态账本能力；修复验证发现的 iteration index 自动生成缺口。

## Structured Record

```json
{
  "schema_version": "development-case-record/v3",
  "id": "CASE-20260705-005",
  "title": "Install and demo validate arckit state loop",
  "status": "closed",
  "artifact_type": "mixed",
  "created_at": "2026-07-05T16:31:37.418Z",
  "updated_at": "2026-07-26T18:58:51.796Z",
  "user_intent": "安装 Arckit 到 Codex 用户级应用目录，并用 ../arckit-demo 验证状态账本能力；修复验证发现的 iteration index 自动生成缺口。",
  "expected_outcome": "Arckit 已安装到 Codex 用户级 skills 目录；subagent 在 ../arckit-demo 中验证 project state、iteration state、case 脚本；发现的 iteration index 自动生成缺口已在源 skill 和已安装副本中修复并复测。",
  "project_state_ref": "arckit/project/state.record.json",
  "current_round": {
    "goal": "",
    "selected_gap": null
  },
  "facets": {
    "product_expectation": {
      "applicability": "required",
      "maturity": "confirmed",
      "target_maturity": "confirmed",
      "alignment": "aligned",
      "target_alignment": "aligned",
      "resolution": "resolved",
      "reason": "状态机制的产品行为要求包含可恢复的项目状态、迭代状态、case evidence 和索引入口；本轮补齐了 iteration index 自动维护行为。",
      "evidence": [
        "entry/skills/arckit-development-ledger/SKILL.md",
        "entry/skills/arckit-development-ledger/scripts/project-iteration.mjs"
      ],
      "next_transition": ""
    },
    "interaction_expectation": {
      "applicability": "required",
      "maturity": "confirmed",
      "target_maturity": "confirmed",
      "alignment": "aligned",
      "target_alignment": "aligned",
      "resolution": "resolved",
      "reason": "agent 在 demo 项目中可从 STATE.md、ITERATIONS.md、iteration brief 和 canonical record 恢复状态入口。",
      "evidence": [
        "../arckit-demo/arckit/project/STATE.md",
        "../arckit-demo/arckit/project/ITERATIONS.md"
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
      "reason": "本轮是 skill 安装、脚本行为和账本能力验证，不涉及视觉界面。",
      "evidence": [
        "case:CASE-20260705-005:visual_expectation:migration-evidence"
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
      "reason": "project-iteration 脚本现在在 new/migrate 后刷新 ITERATIONS.md，并在 audit 中检查索引缺失或漂移。",
      "evidence": [
        "entry/skills/arckit-development-ledger/scripts/project-iteration.mjs"
      ],
      "next_transition": ""
    },
    "implementation_state": {
      "applicability": "required",
      "maturity": "confirmed",
      "target_maturity": "confirmed",
      "alignment": "aligned",
      "target_alignment": "aligned",
      "resolution": "resolved",
      "reason": "Arckit 已通过 ArcForge 应用到 /Users/Glare/.codex/skills；demo 项目由已安装脚本生成 project state、iteration state 和 case。",
      "evidence": [
        "/Users/Glare/.codex/skills/arckit-development-ledger/SKILL.md",
        "/Users/Glare/.codex/skills/arckit-development-ledger/scripts/project-iteration.mjs",
        "../arckit-demo/arckit/project/state.record.json",
        "../arckit-demo/arckit/project/iterations/ITER-20260705-002-index-auto-update-smoke.record.json"
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
      "reason": "subagent 和主 agent 均完成验证；修复后 demo 中 project/iteration audit 通过，Markdown 投影无内嵌 JSON。",
      "evidence": [
        "arcforge applied drift --root /Users/Glare/Library/Developer/ModularProgram/feitianchengzi/arckit --id arckit-default-01082ca0",
        "node /Users/Glare/.codex/skills/arckit-development-ledger/scripts/project-iteration.mjs audit",
        "node /Users/Glare/.codex/skills/arckit-development-ledger/scripts/project-state.mjs audit",
        "rg '```json|Structured Record' arckit/project/STATE.md arckit/project/iterations arckit/project/ITERATIONS.md"
      ],
      "next_transition": ""
    }
  },
  "open_questions": [
    {
      "id": "question-1",
      "question": "是否继续用更复杂真实项目验证 state gap -> case -> verification -> state delta 的多轮闭环。",
      "status": "resolved",
      "owner": "human",
      "evidence": [
        "arckit/cases/closed/CASE-20260705-005-install-and-demo-validate-arckit-state-loop.md"
      ]
    }
  ],
  "decisions": [
    "安装目标使用 /Users/Glare/.codex/skills，并通过 ArcForge 保存应用关系 arckit-default-01082ca0。",
    "subagent demo 验证发现的 project-iteration index 缺口应在源 skill 中修复，而不是只要求 agent 记得手动运行 index。",
    "project-iteration new/migrate 自动刷新 ITERATIONS.md；audit 检查 index 缺失或 stale。"
  ],
  "pending_handoffs": [],
  "process_notes": [],
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
      "occurred_at": "2026-07-05T16:33:06.419Z"
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
          "case:CASE-20260705-005"
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
    "updated_at": "2026-07-26T18:58:51.796Z"
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
      "snapshotted_at": "2026-07-26T17:44:10.513Z"
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
          "migration:CASE-20260705-005:pre-v3-resolved-case"
        ],
        "occurred_at": "2026-07-26T17:44:10.513Z"
      }
    ],
    "evidence": [
      "migration:CASE-20260705-005:pre-v3-resolved-case"
    ],
    "escalation": null,
    "human_authorizations": []
  }
}
```

## Round Notes

- Installed Arckit to `/Users/Glare/.codex/skills` with ArcForge relation `arckit-default-01082ca0`.
- Subagent validated project state, iteration state and case creation in `../arckit-demo`.
- Fixed `project-iteration.mjs` so `new` and `migrate` refresh `ITERATIONS.md`, and `audit` checks missing/stale index.
- Reinstalled and verified the demo `project-iteration audit` and `project-state audit` pass.
