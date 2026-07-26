# Persist development case records

Case: CASE-20260704-001
Status: closed
Artifact Type: skill
Selected Gap: none
Updated: 2026-07-26T18:58:51.348Z

## User Intent

用户建议将 development_case_record 等结构化数据存到 arckit 下的合适目录，并新增脚本，让结构化数据维护更稳定。

## Structured Record

```json
{
  "schema_version": "development-case-record/v3",
  "id": "CASE-20260704-001",
  "title": "Persist development case records",
  "status": "closed",
  "artifact_type": "skill",
  "created_at": "2026-07-04T17:56:53.983Z",
  "updated_at": "2026-07-26T18:58:51.348Z",
  "user_intent": "用户建议将 development_case_record 等结构化数据存到 arckit 下的合适目录，并新增脚本，让结构化数据维护更稳定。",
  "expected_outcome": "将 using-arckit 的 development_case_record 从对话内结构升级为项目级可落盘、可校验、可审计、可索引的研发事项记录机制。",
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
      "reason": "已确认本机制服务于研发事项整体状态，而不是普通任务清单。",
      "evidence": [
        "arckit/cases/INDEX.md",
        "entry/skills/using-arckit/SKILL.md"
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
      "reason": "本轮不涉及用户界面、页面状态或交互流程。",
      "evidence": [
        "case:CASE-20260704-001:interaction_expectation:migration-evidence"
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
      "reason": "本轮不涉及视觉策略、组件表现或设计 token。",
      "evidence": [
        "case:CASE-20260704-001:visual_expectation:migration-evidence"
      ],
      "next_transition": ""
    },
    "technical_expectation": {
      "applicability": "required",
      "maturity": "confirmed",
      "target_maturity": "confirmed",
      "alignment": "aligned",
      "target_alignment": "aligned",
      "resolution": "resolved",
      "reason": "采用 Markdown record + Structured Record JSON block + Node.js maintenance script 的轻量承载。",
      "evidence": [
        "arckit/cases/schema/development-case-record.schema.json",
        "tools/arckit-case/arckit-case.mjs"
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
      "reason": "已新增 cases 目录、schema、INDEX 和 arckit-case 脚本，并更新 using-arckit 接入落盘 record。",
      "evidence": [
        "arckit/cases/INDEX.md",
        "arckit/cases/schema/development-case-record.schema.json",
        "tools/arckit-case/arckit-case.mjs",
        "entry/skills/using-arckit/SKILL.md"
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
      "reason": "脚本语法、case validate、audit --write、index 和全量 validate 均已通过。",
      "evidence": [
        "node --check tools/arckit-case/arckit-case.mjs",
        "node tools/arckit-case/arckit-case.mjs validate arckit/cases/active/CASE-20260704-001-persist-development-case-records.md",
        "node tools/arckit-case/arckit-case.mjs audit arckit/cases/active/CASE-20260704-001-persist-development-case-records.md --write",
        "node tools/arckit-case/arckit-case.mjs index",
        "node tools/arckit-case/arckit-case.mjs validate"
      ],
      "next_transition": ""
    }
  },
  "open_questions": [],
  "decisions": [
    {
      "text": "使用 arckit/cases 作为 development_case_record 的项目级承载，而不是 arckit/tasks。",
      "reason": "case record 追踪一个研发事项的结构满足度，语义上比任务清单更准确。"
    },
    {
      "text": "使用 Markdown record 内嵌 JSON block，并用 Node.js 脚本维护。",
      "reason": "兼顾人类可读和脚本稳定解析，避免引入数据库或外部依赖。"
    }
  ],
  "pending_handoffs": [],
  "process_notes": [],
  "rounds": [
    {
      "round": 1,
      "goal": "Create project-level case record storage and maintenance script.",
      "outcome": "completed",
      "planned_transition": "Create project-level case record storage and maintenance script.",
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
      "occurred_at": "2026-07-04T18:01:45.213Z"
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
          "case:CASE-20260704-001"
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
    "updated_at": "2026-07-26T18:58:51.348Z"
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
      "snapshotted_at": "2026-07-26T17:44:10.078Z"
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
          "migration:CASE-20260704-001:pre-v3-resolved-case"
        ],
        "occurred_at": "2026-07-26T17:44:10.078Z"
      }
    ],
    "evidence": [
      "migration:CASE-20260704-001:pre-v3-resolved-case"
    ],
    "escalation": null,
    "human_authorizations": []
  }
}
```

## Round Notes

- TBD
