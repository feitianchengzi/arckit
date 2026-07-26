# Extract project state record JSON

Case: CASE-20260705-003
Status: closed
Artifact Type: mixed
Selected Gap: none
Updated: 2026-07-26T18:58:51.615Z

## User Intent

将 arckit/project/STATE.md 内嵌的结构化 JSON 迁移为独立 canonical state.record.json，STATE.md 改为人类/agent 可读投影视图。

## Structured Record

```json
{
  "schema_version": "development-case-record/v3",
  "id": "CASE-20260705-003",
  "title": "Extract project state record JSON",
  "status": "closed",
  "artifact_type": "mixed",
  "created_at": "2026-07-05T15:48:58.178Z",
  "updated_at": "2026-07-26T18:58:51.615Z",
  "user_intent": "将 arckit/project/STATE.md 内嵌的结构化 JSON 迁移为独立 canonical state.record.json，STATE.md 改为人类/agent 可读投影视图。",
  "expected_outcome": "state.record.json 成为项目全局状态的唯一权威结构化记录；STATE.md 变成从该 JSON 渲染的人类/agent 可读投影视图；project-state 脚本支持 migrate/render/validate/summary。",
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
      "reason": "状态文件职责已拆分为 canonical JSON record 和 Markdown projection。",
      "evidence": [
        "arckit/project/state.record.json",
        "arckit/project/STATE.md"
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
      "reason": "STATE.md 现在展示 loop control、active state、state gaps 和维度摘要，避免完整 JSON 噪音。",
      "evidence": [
        "arckit/project/STATE.md"
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
      "reason": "本轮是状态存储和 Markdown 投影结构调整，不涉及视觉界面。",
      "evidence": [
        "case:CASE-20260705-003:visual_expectation:migration-evidence"
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
      "reason": "project-state 脚本已支持 state.record.json、legacy embedded JSON migration、projection render 和从 STATE.md 解析 canonical record。",
      "evidence": [
        "entry/skills/arckit-development-ledger/scripts/project-state.mjs"
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
      "reason": "当前项目状态已迁移到 state.record.json，STATE.md 已由脚本重新渲染。",
      "evidence": [
        "arckit/project/state.record.json",
        "arckit/project/STATE.md",
        "entry/skills/arckit-development-ledger/SKILL.md",
        "entry/skills/using-arckit/SKILL.md",
        "entry/skills/arckit-development-ledger/agents/openai.yaml"
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
      "reason": "canonical JSON、STATE.md projection resolving、project-state script syntax 和 JSON parse 均已验证。",
      "evidence": [
        "node entry/skills/arckit-development-ledger/scripts/project-state.mjs validate arckit/project/state.record.json",
        "node entry/skills/arckit-development-ledger/scripts/project-state.mjs validate arckit/project/STATE.md",
        "node --check entry/skills/arckit-development-ledger/scripts/project-state.mjs",
        "node -e JSON.parse(...) arckit/project/state.record.json"
      ],
      "next_transition": ""
    }
  },
  "open_questions": [
    {
      "id": "question-1",
      "question": "是否后续增加跨记录 audit 检查 canonical record、projection、iteration state 和 case refs 一致性。",
      "status": "resolved",
      "owner": "human",
      "evidence": [
        "arckit/cases/closed/CASE-20260705-003-extract-project-state-record-json.md"
      ]
    }
  ],
  "decisions": [
    "arckit/project/state.record.json 是全局项目状态的唯一权威结构化记录。",
    "arckit/project/STATE.md 是由 state.record.json 渲染的人类/agent 可读投影视图，不内嵌完整 JSON。",
    "project-state 脚本保留 legacy embedded JSON migration 兼容能力。"
  ],
  "pending_handoffs": [
    {
      "id": "handoff-1",
      "target": "external",
      "owner": "external",
      "status": "completed",
      "resume_condition": "如需要分发到已安装 skill，后续走 ArcForge 漂移/应用流程。",
      "evidence": [
        "arckit/cases/closed/CASE-20260705-003-extract-project-state-record-json.md"
      ]
    }
  ],
  "process_notes": [
    "状态驱动 loop 的机器状态应优先使用 canonical JSON，Markdown 只作为投影。"
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
      "occurred_at": "2026-07-05T15:54:24.572Z"
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
          "case:CASE-20260705-003"
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
    "updated_at": "2026-07-26T18:58:51.615Z"
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
      "snapshotted_at": "2026-07-26T17:44:10.341Z"
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
          "migration:CASE-20260705-003:pre-v3-resolved-case"
        ],
        "occurred_at": "2026-07-26T17:44:10.341Z"
      }
    ],
    "evidence": [
      "migration:CASE-20260705-003:pre-v3-resolved-case"
    ],
    "escalation": null,
    "human_authorizations": []
  }
}
```

## Round Notes

- `state.record.json` is now the canonical project state record.
- `STATE.md` is a rendered projection and should not embed the full structured JSON.
