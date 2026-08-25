# 修复 ArcOrbit Case 创建身份物化边界

Case: CASE-20260825-013
Status: closed
Artifact Type: code
Selected Gap: none
Updated: 2026-08-25T18:11:13.392Z

## User Intent

让 create_case 只接收 Agent 的 semantic local handles，并由 trusted Ledger 分配 Fact、Gap、Impact 的 canonical ID、revision 与引用，避免空 ID 导致自动化未收束。

## Structured Record

```json
{
  "schema_version": "development-case-record/v5",
  "id": "CASE-20260825-013",
  "title": "修复 ArcOrbit Case 创建身份物化边界",
  "status": "closed",
  "artifact_type": "code",
  "created_at": "2026-08-25T17:57:44.851Z",
  "updated_at": "2026-08-25T18:11:13.392Z",
  "user_intent": "让 create_case 只接收 Agent 的 semantic local handles，并由 trusted Ledger 分配 Fact、Gap、Impact 的 canonical ID、revision 与引用，避免空 ID 导致自动化未收束。",
  "expected_outcome": "Agent 不再生成 canonical bookkeeping；Ledger 原子物化完整 Case 身份和引用；无效 semantic claim 在写入前进入同线程 Agent repair，基础设施故障仍单独恢复。",
  "project_state_ref": "arckit/project/state.record.json",
  "current_round": {
    "goal": "",
    "selected_gap": null
  },
  "facts": [
    {
      "id": "local:fact:create-case-identity-contract-defect",
      "revision": 1,
      "status": "accepted",
      "statement": "ArcOrbit create_case 提示要求 Ledger 拥有 canonical IDs，但输出 Schema 与 writeback 仍要求并原样保存 Agent 提供的 Fact、Gap、Impact IDs；空 ID 可通过前置校验并在 canonical record 校验时失败。",
      "basis": "真实失败 run、结构化 Agent 输出、Schema、Runtime handoff 与 trusted Ledger 校验代码形成完整证据链。",
      "evidence": [
        "arckit-runtime://runs/RUN-20260825-172059783Z-54300b0c",
        "runtime/arcorbit/schemas/agent-loop-result.schema.json",
        "runtime/arcorbit/src/agent-orchestrator.mjs",
        "runtime/arcorbit/src/kernel/runtime-result-builder.mjs",
        "entry/skills/arckit-development-ledger/scripts/runtime-case-control.mjs",
        "entry/skills/arckit-development-ledger/scripts/development-case.mjs"
      ]
    }
  ],
  "state_impacts": [],
  "gaps": [
    {
      "id": "local:gap:materialize-create-case-identities",
      "status": "resolved",
      "goal": "实现并验证 create_case semantic handles 到 canonical Fact、Gap、Impact 身份及引用的 trusted Ledger 物化，同时让无效 Agent claim 在写入前可自动修复。",
      "reason": "当前身份所有权矛盾直接阻断真实 Automation Case 创建；修复边界和验收方式已经由失败证据确定。",
      "derived_from": [
        "local:fact:create-case-identity-contract-defect"
      ],
      "blocked_by": [],
      "priority_basis": {
        "blocking": "阻断没有现有 Case 的 Automation 待办进入执行循环。",
        "uncertainty": "真实 payload 和代码链已经确认根因，主要设计边界已明确。",
        "risk": "身份和跨引用物化错误可能污染 canonical Case，必须原子校验并覆盖空值、重复 handle、未知引用和回滚。",
        "user_impact": "当前待办直接停在 Runtime 尚未收束，无法继续自动开发。"
      },
      "responsibility": "agent",
      "evidence_required": [
        "create_case Agent schema 使用 local refs/handles 而非 canonical bookkeeping",
        "trusted Ledger 确定性分配 Case 子对象 ID 与 revisions 并重写所有内部引用",
        "空/重复 handle 和未知引用在 canonical write 前被拒绝为可修复 claim",
        "真实失败形状、成功创建、引用闭合和回归测试通过",
        "Runtime 将 semantic create_case 拒绝送入同一 Agent repair，而非 infrastructure recovery"
      ],
      "resolution": {
        "id": "local:gap:materialize-create-case-identities",
        "status": "resolved",
        "outcome": "create_case now accepts semantic local handles, validates and atomically materializes canonical Fact/Gap/Impact identities and relations, and returns invalid claims to the same Agent for repair.",
        "reason": "Schema, trusted boundary, writeback behavior, failure classification, rollback, and regression coverage now agree on Ledger-owned canonical bookkeeping.",
        "evidence": [
          "entry/skills/arckit-development-ledger/scripts/semantic-case-control.mjs",
          "entry/skills/arckit-development-ledger/scripts/runtime-case-control.mjs",
          "runtime/arcorbit/schemas/agent-loop-result.schema.json",
          "runtime/arcorbit/src/validator.mjs",
          "runtime/arcorbit/test/runtime-case-control.test.mjs",
          "runtime/arcorbit/test/state-driven-runner.test.mjs",
          "test:43 targeted tests passed",
          "test:full suite 455 passed; 2 Electron launch tests unavailable in sandbox"
        ],
        "occurred_at": "2026-08-25T18:10:13.115Z"
      }
    }
  ],
  "content_revision": 1,
  "completion_review": {
    "status": "clean",
    "policy": {
      "initial_max_cycles": 3,
      "source": "runtime/arcorbit/config/case-policy.json",
      "snapshotted_at": "2026-08-25T17:57:44.851Z"
    },
    "additional_cycles_authorized": 0,
    "cycle_count": 1,
    "reviewed_content_revision": 1,
    "dimensions": {
      "implementation_correctness": "clean",
      "problem_resolution": "clean",
      "verification_credibility": "clean",
      "regression_risk": "clean",
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
          "implementation_correctness": "clean",
          "problem_resolution": "clean",
          "verification_credibility": "clean",
          "regression_risk": "clean",
          "minimality": "clean"
        },
        "finding_ids": [],
        "evidence": [
          "entry/skills/arckit-development-ledger/scripts/semantic-case-control.mjs",
          "entry/skills/arckit-development-ledger/scripts/runtime-case-control.mjs",
          "runtime/arcorbit/schemas/agent-loop-result.schema.json",
          "runtime/arcorbit/schemas/runtime-result.schema.json",
          "runtime/arcorbit/src/validator.mjs",
          "runtime/arcorbit/src/agent-orchestrator.mjs",
          "runtime/arcorbit/test/runtime-case-control.test.mjs",
          "runtime/arcorbit/test/state-driven-runner.test.mjs",
          "test:43 targeted tests passed",
          "test:full suite 455 passed; only 2 unrelated Electron launch tests SIGABRT in sandbox",
          "check:git diff --check passed"
        ],
        "occurred_at": "2026-08-25T18:11:13.392Z"
      }
    ],
    "evidence": [
      "entry/skills/arckit-development-ledger/scripts/semantic-case-control.mjs",
      "entry/skills/arckit-development-ledger/scripts/runtime-case-control.mjs",
      "runtime/arcorbit/schemas/agent-loop-result.schema.json",
      "runtime/arcorbit/schemas/runtime-result.schema.json",
      "runtime/arcorbit/src/validator.mjs",
      "runtime/arcorbit/src/agent-orchestrator.mjs",
      "runtime/arcorbit/test/runtime-case-control.test.mjs",
      "runtime/arcorbit/test/state-driven-runner.test.mjs",
      "test:43 targeted tests passed",
      "test:full suite 455 passed; only 2 unrelated Electron launch tests SIGABRT in sandbox",
      "check:git diff --check passed"
    ],
    "escalation": null,
    "human_authorizations": []
  },
  "open_questions": [],
  "decisions": [],
  "pending_handoffs": [],
  "process_notes": [],
  "rounds": [
    {
      "round": 1,
      "transition_schema_version": "arckit-case-transition/v8",
      "goal": "实现并验证 create_case semantic handles 到 canonical Fact、Gap、Impact 身份及引用的 trusted Ledger 物化，同时让无效 Agent claim 在写入前可自动修复。",
      "outcome": "completed",
      "gap_selection": {
        "mode": "candidate",
        "basis": "This blocking Automation failure is fully diagnosed and the implementation plus regression evidence are now complete.",
        "snapshot_token": "a3c2a5f9a72bacc715688870768f14bec19e56e8176f1247bef7759d702e51b1",
        "selected_ref": "case-gap:CASE-20260825-013:local:gap:materialize-create-case-identities",
        "comparison_summary": "Compared the four project-level obligations with the current Case gap; the current gap directly blocks the user-reported Automation flow and is ready for evidence-backed closeout.",
        "fresh_discovery_summary": "No more important fresh gap was discovered during implementation or verification.",
        "considered": [
          {
            "ref": "project-gap:GAP-agent-scenario-evaluation",
            "source": "persisted",
            "eligibility": "case_required",
            "disposition": "deferred",
            "priority_basis": {
              "uncertainty": "high",
              "risk": "high"
            },
            "reason": "Deferred because it is outside this bounded repair Case."
          },
          {
            "ref": "project-gap:GAP-runtime-resilience-and-adapters",
            "source": "persisted",
            "eligibility": "case_required",
            "disposition": "deferred",
            "priority_basis": {
              "risk": "high",
              "urgency": "medium"
            },
            "reason": "Deferred because it is outside this bounded repair Case."
          },
          {
            "ref": "project-gap:GAP-security-real-project-validation",
            "source": "persisted",
            "eligibility": "case_required",
            "disposition": "deferred",
            "priority_basis": {
              "risk": "high",
              "urgency": "medium"
            },
            "reason": "Deferred because it is outside this bounded repair Case."
          },
          {
            "ref": "project-gap:GAP-cross-record-audit",
            "source": "persisted",
            "eligibility": "case_required",
            "disposition": "deferred",
            "priority_basis": {
              "risk": "high",
              "urgency": "high"
            },
            "reason": "Deferred because it is outside this bounded repair Case."
          },
          {
            "ref": "case-gap:CASE-20260825-013:local:gap:materialize-create-case-identities",
            "source": "persisted",
            "eligibility": "ready",
            "disposition": "selected",
            "priority_basis": {
              "blocking": "阻断没有现有 Case 的 Automation 待办进入执行循环。",
              "uncertainty": "真实 payload 和代码链已经确认根因，主要设计边界已明确。",
              "risk": "身份和跨引用物化错误可能污染 canonical Case，必须原子校验并覆盖空值、重复 handle、未知引用和回滚。",
              "user_impact": "当前待办直接停在 Runtime 尚未收束，无法继续自动开发。"
            },
            "reason": "Selected because it directly resolves the current blocking defect."
          }
        ]
      },
      "selected_gap": {
        "id": "local:gap:materialize-create-case-identities",
        "responsibility": "agent",
        "goal": "实现并验证 create_case semantic handles 到 canonical Fact、Gap、Impact 身份及引用的 trusted Ledger 物化，同时让无效 Agent claim 在写入前可自动修复。",
        "reason": "当前身份所有权矛盾直接阻断真实 Automation Case 创建；修复边界和验收方式已经由失败证据确定。",
        "derived_from": [
          "local:fact:create-case-identity-contract-defect"
        ],
        "blocked_by": [],
        "priority_basis": {
          "blocking": "阻断没有现有 Case 的 Automation 待办进入执行循环。",
          "uncertainty": "真实 payload 和代码链已经确认根因，主要设计边界已明确。",
          "risk": "身份和跨引用物化错误可能污染 canonical Case，必须原子校验并覆盖空值、重复 handle、未知引用和回滚。",
          "user_impact": "当前待办直接停在 Runtime 尚未收束，无法继续自动开发。"
        },
        "evidence_required": [
          "create_case Agent schema 使用 local refs/handles 而非 canonical bookkeeping",
          "trusted Ledger 确定性分配 Case 子对象 ID 与 revisions 并重写所有内部引用",
          "空/重复 handle 和未知引用在 canonical write 前被拒绝为可修复 claim",
          "真实失败形状、成功创建、引用闭合和回归测试通过",
          "Runtime 将 semantic create_case 拒绝送入同一 Agent repair，而非 infrastructure recovery"
        ]
      },
      "planned_transition": {
        "goal": "实现并验证 create_case semantic handles 到 canonical Fact、Gap、Impact 身份及引用的 trusted Ledger 物化，同时让无效 Agent claim 在写入前可自动修复。",
        "expected_state_change": "Resolve the create_case identity-boundary gap and advance the Case to completion review."
      },
      "accepted_state_delta": {
        "resolved_gap": {
          "id": "local:gap:materialize-create-case-identities",
          "status": "resolved",
          "outcome": "create_case now accepts semantic local handles, validates and atomically materializes canonical Fact/Gap/Impact identities and relations, and returns invalid claims to the same Agent for repair.",
          "reason": "Schema, trusted boundary, writeback behavior, failure classification, rollback, and regression coverage now agree on Ledger-owned canonical bookkeeping.",
          "evidence": [
            "entry/skills/arckit-development-ledger/scripts/semantic-case-control.mjs",
            "entry/skills/arckit-development-ledger/scripts/runtime-case-control.mjs",
            "runtime/arcorbit/schemas/agent-loop-result.schema.json",
            "runtime/arcorbit/src/validator.mjs",
            "runtime/arcorbit/test/runtime-case-control.test.mjs",
            "runtime/arcorbit/test/state-driven-runner.test.mjs",
            "test:43 targeted tests passed",
            "test:full suite 455 passed; 2 Electron launch tests unavailable in sandbox"
          ]
        },
        "facts_added": [],
        "facts_superseded": [],
        "impacts_added": [],
        "impacts_updated": [],
        "gaps_added": [],
        "gaps_cancelled": [],
        "resolved_open_questions": [],
        "completed_handoffs": [],
        "completion_review_result": null,
        "resolved_review_findings": [],
        "review_budget_extension": null
      },
      "project_state_delta": {
        "software_definition_changes": [],
        "software_invariant_changes": [],
        "project_gap_changes": [],
        "selection_context_change": null,
        "evidence": []
      },
      "invariant_assessment": {
        "project_revision": 262,
        "judgments": [
          {
            "invariant_ref": "product-expectations-remain-recoverable",
            "disposition": "not_relevant",
            "reason": "This bounded Runtime/Ledger repair does not change this expectation domain.",
            "fact_refs": [],
            "evidence": [],
            "gap_refs": []
          },
          {
            "invariant_ref": "interaction-expectations-remain-recoverable",
            "disposition": "not_relevant",
            "reason": "This bounded Runtime/Ledger repair does not change this expectation domain.",
            "fact_refs": [],
            "evidence": [],
            "gap_refs": []
          },
          {
            "invariant_ref": "visual-language-remains-consistent",
            "disposition": "not_relevant",
            "reason": "This bounded Runtime/Ledger repair does not change this expectation domain.",
            "fact_refs": [],
            "evidence": [],
            "gap_refs": []
          },
          {
            "invariant_ref": "technical-decisions-remain-explainable",
            "disposition": "upheld",
            "reason": "The implementation now makes canonical identity ownership explicit at the Agent, Runtime, and trusted Ledger boundaries.",
            "fact_refs": [
              "local:fact:create-case-identity-contract-defect"
            ],
            "evidence": [
              "entry/skills/arckit-development-ledger/scripts/semantic-case-control.mjs",
              "entry/skills/arckit-development-ledger/scripts/runtime-case-control.mjs",
              "runtime/arcorbit/schemas/agent-loop-result.schema.json",
              "runtime/arcorbit/src/validator.mjs",
              "runtime/arcorbit/test/runtime-case-control.test.mjs",
              "runtime/arcorbit/test/state-driven-runner.test.mjs",
              "test:43 targeted tests passed",
              "test:full suite 455 passed; 2 Electron launch tests unavailable in sandbox"
            ],
            "gap_refs": []
          },
          {
            "invariant_ref": "accepted-facts-are-realized",
            "disposition": "upheld",
            "reason": "The reported create_case identity defect is realized as a validated materialization path and same-thread repair path.",
            "fact_refs": [
              "local:fact:create-case-identity-contract-defect"
            ],
            "evidence": [
              "entry/skills/arckit-development-ledger/scripts/semantic-case-control.mjs",
              "entry/skills/arckit-development-ledger/scripts/runtime-case-control.mjs",
              "runtime/arcorbit/schemas/agent-loop-result.schema.json",
              "runtime/arcorbit/src/validator.mjs",
              "runtime/arcorbit/test/runtime-case-control.test.mjs",
              "runtime/arcorbit/test/state-driven-runner.test.mjs",
              "test:43 targeted tests passed",
              "test:full suite 455 passed; 2 Electron launch tests unavailable in sandbox"
            ],
            "gap_refs": []
          },
          {
            "invariant_ref": "material-risks-have-credible-evidence",
            "disposition": "upheld",
            "reason": "The corrupt-write risks are covered by deterministic mapping, fail-closed relation validation, rollback behavior, and regression tests.",
            "fact_refs": [
              "local:fact:create-case-identity-contract-defect"
            ],
            "evidence": [
              "entry/skills/arckit-development-ledger/scripts/semantic-case-control.mjs",
              "entry/skills/arckit-development-ledger/scripts/runtime-case-control.mjs",
              "runtime/arcorbit/schemas/agent-loop-result.schema.json",
              "runtime/arcorbit/src/validator.mjs",
              "runtime/arcorbit/test/runtime-case-control.test.mjs",
              "runtime/arcorbit/test/state-driven-runner.test.mjs",
              "test:43 targeted tests passed",
              "test:full suite 455 passed; 2 Electron launch tests unavailable in sandbox"
            ],
            "gap_refs": []
          }
        ]
      },
      "evidence": [
        "entry/skills/arckit-development-ledger/scripts/semantic-case-control.mjs",
        "entry/skills/arckit-development-ledger/scripts/runtime-case-control.mjs",
        "runtime/arcorbit/schemas/agent-loop-result.schema.json",
        "runtime/arcorbit/src/validator.mjs",
        "runtime/arcorbit/test/runtime-case-control.test.mjs",
        "runtime/arcorbit/test/state-driven-runner.test.mjs",
        "test:43 targeted tests passed",
        "test:full suite 455 passed; 2 Electron launch tests unavailable in sandbox"
      ],
      "runtime_result_ref": "codex://repair-arcorbit-create-case-identities",
      "occurred_at": "2026-08-25T18:10:13.115Z"
    },
    {
      "round": 2,
      "transition_schema_version": "arckit-case-transition/v8",
      "goal": "Review the completed implementation for correctness, real problem resolution, verification credibility, regression risk, and minimality.",
      "outcome": "completed",
      "gap_selection": {
        "mode": "candidate",
        "basis": "The deterministic completion-review candidate is the only remaining obligation in this Case.",
        "snapshot_token": "5d440d8ddf6befd0a9a6f42459d5fd44cfdfd77297b2c5625d58766fb3855e21",
        "selected_ref": "case-gap:CASE-20260825-013:CASE-20260825-013:completion-review:1",
        "comparison_summary": "Compared the completion review with all project-level obligations; review is the only in-scope ready step needed to close this bounded repair.",
        "fresh_discovery_summary": "Code, schemas, error routing, atomicity, and tests were rechecked; no new implementation gap was found.",
        "considered": [
          {
            "ref": "project-gap:GAP-agent-scenario-evaluation",
            "source": "persisted",
            "eligibility": "case_required",
            "disposition": "deferred",
            "priority_basis": {
              "uncertainty": "high",
              "risk": "high"
            },
            "reason": "Deferred because it belongs to a separate project-level Case."
          },
          {
            "ref": "project-gap:GAP-runtime-resilience-and-adapters",
            "source": "persisted",
            "eligibility": "case_required",
            "disposition": "deferred",
            "priority_basis": {
              "risk": "high",
              "urgency": "medium"
            },
            "reason": "Deferred because it belongs to a separate project-level Case."
          },
          {
            "ref": "project-gap:GAP-security-real-project-validation",
            "source": "persisted",
            "eligibility": "case_required",
            "disposition": "deferred",
            "priority_basis": {
              "risk": "high",
              "urgency": "medium"
            },
            "reason": "Deferred because it belongs to a separate project-level Case."
          },
          {
            "ref": "project-gap:GAP-cross-record-audit",
            "source": "persisted",
            "eligibility": "case_required",
            "disposition": "deferred",
            "priority_basis": {
              "risk": "high",
              "urgency": "high"
            },
            "reason": "Deferred because it belongs to a separate project-level Case."
          },
          {
            "ref": "case-gap:CASE-20260825-013:CASE-20260825-013:completion-review:1",
            "source": "persisted",
            "eligibility": "ready",
            "disposition": "selected",
            "priority_basis": {
              "blocking": "high",
              "uncertainty": "low",
              "risk": "high",
              "user_impact": "high"
            },
            "reason": "Selected as the Case closeout review."
          }
        ]
      },
      "selected_gap": {
        "id": "CASE-20260825-013:completion-review:1",
        "responsibility": "agent",
        "goal": "Review the completed implementation for correctness, real problem resolution, verification credibility, regression risk, and minimality.",
        "reason": "All ordinary Case gaps and state impacts are closed.",
        "derived_from": [
          "case_result",
          "content_revision:1"
        ],
        "blocked_by": [],
        "priority_basis": {
          "blocking": "high",
          "uncertainty": "low",
          "risk": "high",
          "user_impact": "high"
        },
        "evidence_required": [
          "review evidence for all five completion dimensions"
        ]
      },
      "planned_transition": {
        "goal": "Review the completed implementation for correctness, real problem resolution, verification credibility, regression risk, and minimality.",
        "expected_state_change": "Record a clean five-dimension completion review and close the resolved Case."
      },
      "accepted_state_delta": {
        "resolved_gap": null,
        "facts_added": [],
        "facts_superseded": [],
        "impacts_added": [],
        "impacts_updated": [],
        "gaps_added": [],
        "gaps_cancelled": [],
        "resolved_open_questions": [],
        "completed_handoffs": [],
        "completion_review_result": {
          "outcome": "clean",
          "reviewer": "agent",
          "reviewed_content_revision": 1,
          "dimensions": {
            "implementation_correctness": "clean",
            "problem_resolution": "clean",
            "verification_credibility": "clean",
            "regression_risk": "clean",
            "minimality": "clean"
          },
          "findings": [],
          "evidence": [
            "entry/skills/arckit-development-ledger/scripts/semantic-case-control.mjs",
            "entry/skills/arckit-development-ledger/scripts/runtime-case-control.mjs",
            "runtime/arcorbit/schemas/agent-loop-result.schema.json",
            "runtime/arcorbit/schemas/runtime-result.schema.json",
            "runtime/arcorbit/src/validator.mjs",
            "runtime/arcorbit/src/agent-orchestrator.mjs",
            "runtime/arcorbit/test/runtime-case-control.test.mjs",
            "runtime/arcorbit/test/state-driven-runner.test.mjs",
            "test:43 targeted tests passed",
            "test:full suite 455 passed; only 2 unrelated Electron launch tests SIGABRT in sandbox",
            "check:git diff --check passed"
          ]
        },
        "resolved_review_findings": [],
        "review_budget_extension": null
      },
      "project_state_delta": {
        "software_definition_changes": [],
        "software_invariant_changes": [],
        "project_gap_changes": [],
        "selection_context_change": null,
        "evidence": []
      },
      "invariant_assessment": {
        "project_revision": 262,
        "judgments": [
          {
            "invariant_ref": "product-expectations-remain-recoverable",
            "disposition": "not_relevant",
            "reason": "The reviewed Runtime/Ledger implementation does not materially change this expectation domain.",
            "fact_refs": [],
            "evidence": [],
            "gap_refs": []
          },
          {
            "invariant_ref": "interaction-expectations-remain-recoverable",
            "disposition": "not_relevant",
            "reason": "The reviewed Runtime/Ledger implementation does not materially change this expectation domain.",
            "fact_refs": [],
            "evidence": [],
            "gap_refs": []
          },
          {
            "invariant_ref": "visual-language-remains-consistent",
            "disposition": "not_relevant",
            "reason": "The reviewed Runtime/Ledger implementation does not materially change this expectation domain.",
            "fact_refs": [],
            "evidence": [],
            "gap_refs": []
          },
          {
            "invariant_ref": "technical-decisions-remain-explainable",
            "disposition": "upheld",
            "reason": "Review confirms one coherent ownership chain: Agent semantic handles, Runtime boundary validation, trusted Ledger canonical materialization.",
            "fact_refs": [
              "local:fact:create-case-identity-contract-defect"
            ],
            "evidence": [
              "entry/skills/arckit-development-ledger/scripts/semantic-case-control.mjs",
              "entry/skills/arckit-development-ledger/scripts/runtime-case-control.mjs",
              "runtime/arcorbit/schemas/agent-loop-result.schema.json",
              "runtime/arcorbit/schemas/runtime-result.schema.json",
              "runtime/arcorbit/src/validator.mjs",
              "runtime/arcorbit/src/agent-orchestrator.mjs",
              "runtime/arcorbit/test/runtime-case-control.test.mjs",
              "runtime/arcorbit/test/state-driven-runner.test.mjs",
              "test:43 targeted tests passed",
              "test:full suite 455 passed; only 2 unrelated Electron launch tests SIGABRT in sandbox",
              "check:git diff --check passed"
            ],
            "gap_refs": []
          },
          {
            "invariant_ref": "accepted-facts-are-realized",
            "disposition": "upheld",
            "reason": "Review confirms the exact empty-id and duplicate-revision failure shape is rejected before mutation and successful claims persist canonical closed references.",
            "fact_refs": [
              "local:fact:create-case-identity-contract-defect"
            ],
            "evidence": [
              "entry/skills/arckit-development-ledger/scripts/semantic-case-control.mjs",
              "entry/skills/arckit-development-ledger/scripts/runtime-case-control.mjs",
              "runtime/arcorbit/schemas/agent-loop-result.schema.json",
              "runtime/arcorbit/schemas/runtime-result.schema.json",
              "runtime/arcorbit/src/validator.mjs",
              "runtime/arcorbit/src/agent-orchestrator.mjs",
              "runtime/arcorbit/test/runtime-case-control.test.mjs",
              "runtime/arcorbit/test/state-driven-runner.test.mjs",
              "test:43 targeted tests passed",
              "test:full suite 455 passed; only 2 unrelated Electron launch tests SIGABRT in sandbox",
              "check:git diff --check passed"
            ],
            "gap_refs": []
          },
          {
            "invariant_ref": "material-risks-have-credible-evidence",
            "disposition": "upheld",
            "reason": "Review confirms deterministic mapping, reference closure, collision protection, rollback, and same-thread repair have proportionate automated coverage.",
            "fact_refs": [
              "local:fact:create-case-identity-contract-defect"
            ],
            "evidence": [
              "entry/skills/arckit-development-ledger/scripts/semantic-case-control.mjs",
              "entry/skills/arckit-development-ledger/scripts/runtime-case-control.mjs",
              "runtime/arcorbit/schemas/agent-loop-result.schema.json",
              "runtime/arcorbit/schemas/runtime-result.schema.json",
              "runtime/arcorbit/src/validator.mjs",
              "runtime/arcorbit/src/agent-orchestrator.mjs",
              "runtime/arcorbit/test/runtime-case-control.test.mjs",
              "runtime/arcorbit/test/state-driven-runner.test.mjs",
              "test:43 targeted tests passed",
              "test:full suite 455 passed; only 2 unrelated Electron launch tests SIGABRT in sandbox",
              "check:git diff --check passed"
            ],
            "gap_refs": []
          }
        ]
      },
      "evidence": [
        "entry/skills/arckit-development-ledger/scripts/semantic-case-control.mjs",
        "entry/skills/arckit-development-ledger/scripts/runtime-case-control.mjs",
        "runtime/arcorbit/schemas/agent-loop-result.schema.json",
        "runtime/arcorbit/schemas/runtime-result.schema.json",
        "runtime/arcorbit/src/validator.mjs",
        "runtime/arcorbit/src/agent-orchestrator.mjs",
        "runtime/arcorbit/test/runtime-case-control.test.mjs",
        "runtime/arcorbit/test/state-driven-runner.test.mjs",
        "test:43 targeted tests passed",
        "test:full suite 455 passed; only 2 unrelated Electron launch tests SIGABRT in sandbox",
        "check:git diff --check passed"
      ],
      "runtime_result_ref": "codex://repair-arcorbit-create-case-identities-review",
      "occurred_at": "2026-08-25T18:11:13.392Z"
    }
  ],
  "case_resolution": {
    "status": "resolved",
    "stage": "resolved",
    "satisfied": [
      "local:gap:materialize-create-case-identities"
    ],
    "remaining": [],
    "blocked": [],
    "reason": "All dynamic gaps and state impacts are closed and the current implementation passed completion review.",
    "candidate_gaps": [],
    "loop_handoff": {
      "version": "loop-handoff/v2",
      "status": "done",
      "next_responsibility": "none",
      "agent_continuation_available": false,
      "human_decision_required": false,
      "trigger_mode": "none",
      "responsibility_reason": "The current Case revision passed completion review.",
      "next_prompt": "",
      "human_gate": {
        "required": false,
        "reason": "",
        "decision_needed": ""
      }
    },
    "updated_at": "2026-08-25T18:11:13.392Z"
  }
}
```

## Round Notes

- Case history is canonical in Structured Record.rounds; keep prose notes exceptional.
