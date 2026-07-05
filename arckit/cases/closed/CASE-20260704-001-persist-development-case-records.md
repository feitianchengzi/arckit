# Persist development case records

Case: CASE-20260704-001
Status: closed
Artifact Type: skill
Current Gap: none
Updated: 2026-07-04T18:01:45.213Z

## User Intent

用户建议将 development_case_record 等结构化数据存到 arckit 下的合适目录，并新增脚本，让结构化数据维护更稳定。

## Structured Record

```json
{
  "schema_version": "development-case-record/v1",
  "id": "CASE-20260704-001",
  "title": "Persist development case records",
  "status": "closed",
  "artifact_type": "skill",
  "created_at": "2026-07-04T17:56:53.983Z",
  "updated_at": "2026-07-04T18:01:45.213Z",
  "user_intent": "用户建议将 development_case_record 等结构化数据存到 arckit 下的合适目录，并新增脚本，让结构化数据维护更稳定。",
  "expected_outcome": "将 using-arckit 的 development_case_record 从对话内结构升级为项目级可落盘、可校验、可审计、可索引的研发事项记录机制。",
  "current_round_goal": "新增 arckit/cases 承载、schema 和 arckit-case 脚本，并让 using-arckit 优先维护落盘 case record。",
  "current_round_gap": "none",
  "structures": {
    "product_expectation": {
      "status": "satisfied",
      "reason": "已确认本机制服务于研发事项整体状态，而不是普通任务清单。",
      "evidence": [
        "arckit/cases/INDEX.md",
        "entry/skills/using-arckit/SKILL.md"
      ],
      "next": ""
    },
    "interaction_expectation": {
      "status": "not_applicable",
      "reason": "本轮不涉及用户界面、页面状态或交互流程。",
      "evidence": [],
      "next": ""
    },
    "visual_expectation": {
      "status": "not_applicable",
      "reason": "本轮不涉及视觉策略、组件表现或设计 token。",
      "evidence": [],
      "next": ""
    },
    "technical_expectation": {
      "status": "satisfied",
      "reason": "采用 Markdown record + Structured Record JSON block + Node.js maintenance script 的轻量承载。",
      "evidence": [
        "arckit/cases/schema/development-case-record.schema.json",
        "tools/arckit-case/arckit-case.mjs"
      ],
      "next": ""
    },
    "implementation_state": {
      "status": "satisfied",
      "reason": "已新增 cases 目录、schema、INDEX 和 arckit-case 脚本，并更新 using-arckit 接入落盘 record。",
      "evidence": [
        "arckit/cases/INDEX.md",
        "arckit/cases/schema/development-case-record.schema.json",
        "tools/arckit-case/arckit-case.mjs",
        "entry/skills/using-arckit/SKILL.md"
      ],
      "next": ""
    },
    "verification_state": {
      "status": "satisfied",
      "reason": "脚本语法、case validate、audit --write、index 和全量 validate 均已通过。",
      "evidence": [
        "node --check tools/arckit-case/arckit-case.mjs",
        "node tools/arckit-case/arckit-case.mjs validate arckit/cases/active/CASE-20260704-001-persist-development-case-records.md",
        "node tools/arckit-case/arckit-case.mjs audit arckit/cases/active/CASE-20260704-001-persist-development-case-records.md --write",
        "node tools/arckit-case/arckit-case.mjs index",
        "node tools/arckit-case/arckit-case.mjs validate"
      ],
      "next": ""
    },
    "open_questions": {
      "status": "satisfied",
      "reason": "暂未发现需要用户补充的问题。",
      "evidence": [],
      "next": ""
    },
    "pending_handoffs": {
      "status": "not_applicable",
      "reason": "本轮不需要交给外部工具或后续任务承接才能完成最小落地。",
      "evidence": [],
      "next": ""
    },
    "workflow_memory_signals": {
      "status": "deferred",
      "reason": "本轮已完成结构和脚本落地；是否形成可复用 workflow signal 需要后续真实任务试跑后判断。",
      "evidence": [],
      "next": "Use a later real task run to decide workflow memory closeout."
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
  "workflow_memory_signals": [],
  "rounds": [
    {
      "id": "round-001",
      "updated_at": "2026-07-04T17:59:43Z",
      "goal": "Create project-level case record storage and maintenance script.",
      "gap": "implementation_state",
      "capabilities": [
        "using-arckit",
        "arcforge-skill-creator"
      ],
      "summary": "Added arckit/cases, schema, arckit-case script, updated using-arckit to prefer persisted case records, and verified script syntax, validation, audit, and index generation."
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
    "updated_at": "2026-07-04T18:01:45.213Z"
  }
}
```

## Round Notes

- TBD
