# Refine generated state decision briefs

Case: CASE-20260705-004
Status: closed
Artifact Type: mixed
Selected Gap: none
Updated: 2026-07-26T18:58:51.707Z

## User Intent

将 project 和 iteration Markdown 从状态摘要改为有损的 loop decision brief；canonical JSON 继续作为唯一结构化状态源，并补 projection audit。

## Structured Record

```json
{
  "schema_version": "development-case-record/v3",
  "id": "CASE-20260705-004",
  "title": "Refine generated state decision briefs",
  "status": "closed",
  "artifact_type": "mixed",
  "created_at": "2026-07-05T16:12:23.000Z",
  "updated_at": "2026-07-26T18:58:51.707Z",
  "user_intent": "将 project 和 iteration Markdown 从状态摘要改为有损的 loop decision brief；canonical JSON 继续作为唯一结构化状态源，并补 projection audit。",
  "expected_outcome": "STATE.md 和 iteration Markdown 不再重复完整状态内容，而是生成下一轮 loop 需要的 decision brief；project/iteration audit 能检查 projection 是否由 canonical record 渲染且未漂移。",
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
      "reason": "project 和 iteration Markdown 的产品语义从状态副本改为 loop decision brief。",
      "evidence": [
        "arckit/project/STATE.md",
        "arckit/project/iterations/ITER-20260705-001-state-driven-loop-foundation.md"
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
      "reason": "agent 先读 Markdown 时获得 loop focus、next transition、风险、禁止误判和 precision refs，而不是完整状态表。",
      "evidence": [
        "arckit/project/STATE.md",
        "arckit/project/iterations/ITER-20260705-001-state-driven-loop-foundation.md"
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
      "reason": "本轮是状态记录和 Markdown 投影结构优化，不涉及视觉界面。",
      "evidence": [
        "case:CASE-20260705-004:visual_expectation:migration-evidence"
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
      "reason": "project-state 和 project-iteration 脚本已支持 generated decision brief、canonical record render 和 audit。",
      "evidence": [
        "entry/skills/arckit-development-ledger/scripts/project-state.mjs",
        "entry/skills/arckit-development-ledger/scripts/project-iteration.mjs"
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
      "reason": "当前 project state 和 active iteration 已迁移并重新渲染；默认 case/iteration project_state_ref 改为 state.record.json。",
      "evidence": [
        "arckit/project/state.record.json",
        "arckit/project/STATE.md",
        "arckit/project/iterations/ITER-20260705-001-state-driven-loop-foundation.record.json",
        "arckit/project/iterations/ITER-20260705-001-state-driven-loop-foundation.md",
        "entry/skills/arckit-development-ledger/scripts/development-case.mjs"
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
      "reason": "脚本语法、project/iteration render、validate 和 audit 均在本轮验证。",
      "evidence": [
        "node entry/skills/arckit-development-ledger/scripts/project-state.mjs audit",
        "node entry/skills/arckit-development-ledger/scripts/project-iteration.mjs audit",
        "node entry/skills/arckit-development-ledger/scripts/development-case.mjs validate",
        "node --check entry/skills/arckit-development-ledger/scripts/project-state.mjs",
        "node --check entry/skills/arckit-development-ledger/scripts/project-iteration.mjs"
      ],
      "next_transition": ""
    }
  },
  "open_questions": [
    {
      "id": "question-1",
      "question": "是否用真实复杂项目验证 decision brief + canonical record 是否足以驱动 agent loop。",
      "status": "resolved",
      "owner": "human",
      "evidence": [
        "arckit/cases/closed/CASE-20260705-004-refine-generated-state-decision-briefs.md"
      ]
    }
  ],
  "decisions": [
    "STATE.md 是 generated loop decision brief，不是完整状态摘要。",
    "Iteration Markdown 是 generated iteration decision brief，不再维护内嵌完整 JSON。",
    "Project 和 iteration 的 canonical state 均由 *.record.json 承载。",
    "Audit 必须检查 projection 是否由 canonical record 渲染且未漂移。"
  ],
  "pending_handoffs": [
    {
      "id": "handoff-1",
      "target": "external",
      "owner": "external",
      "status": "completed",
      "resume_condition": "已安装 skill 同步和漂移治理后续处理。",
      "evidence": [
        "arckit/cases/closed/CASE-20260705-004-refine-generated-state-decision-briefs.md"
      ]
    }
  ],
  "process_notes": [
    "agent-driven platform 也应读写 canonical JSON；Markdown brief 只用于快速语义定位。"
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
      "occurred_at": "2026-07-05T16:13:39.580Z"
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
          "case:CASE-20260705-004"
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
    "updated_at": "2026-07-26T18:58:51.707Z"
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
      "snapshotted_at": "2026-07-26T17:44:10.426Z"
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
          "migration:CASE-20260705-004:pre-v3-resolved-case"
        ],
        "occurred_at": "2026-07-26T17:44:10.426Z"
      }
    ],
    "evidence": [
      "migration:CASE-20260705-004:pre-v3-resolved-case"
    ],
    "escalation": null,
    "human_authorizations": []
  }
}
```

## Round Notes

- Project and iteration Markdown projections are now decision briefs.
- Canonical state remains in JSON records.
