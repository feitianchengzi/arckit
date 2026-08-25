# 修复 Automation Codex output schema oneOf 回归

Case: CASE-20260825-012
Status: closed
Artifact Type: code
Selected Gap: none
Updated: 2026-08-25T16:44:16.483Z

## User Intent

恢复所有 Automation 待办的 Codex Agent 首轮执行，并阻止 app-server 不支持的 oneOf 再次进入打包产物。

## Structured Record

```json
{
  "schema_version": "development-case-record/v5",
  "id": "CASE-20260825-012",
  "title": "修复 Automation Codex output schema oneOf 回归",
  "status": "closed",
  "artifact_type": "code",
  "created_at": "2026-08-25T16:38:59.174Z",
  "updated_at": "2026-08-25T16:44:16.483Z",
  "user_intent": "恢复所有 Automation 待办的 Codex Agent 首轮执行，并阻止 app-server 不支持的 oneOf 再次进入打包产物。",
  "expected_outcome": "Agent Loop schema 使用 app-server 支持且语义等价的分支表达，本地 preflight 会拒绝 oneOf，聚焦测试和打包产物检查通过。",
  "project_state_ref": "arckit/project/state.record.json",
  "current_round": {
    "goal": "",
    "selected_gap": null
  },
  "facts": [
    {
      "id": "FACT-AUTOMATION-ONEOF-REJECTION",
      "revision": 1,
      "status": "accepted",
      "statement": "The packaged agent-loop-result response schema contains oneOf for case_control, while Codex app-server rejects that schema before Agent output with invalid_json_schema and oneOf is not permitted; local schema preflight currently traverses oneOf but does not reject it.",
      "basis": "Two affected Automation lanes fail before Agent output, the lifecycle trace records the exact app-server 400, and the packaged/source schema digests are identical.",
      "evidence": [
        "runtime/arcorbit/schemas/agent-loop-result.schema.json",
        "runtime/arcorbit/src/codex-output-schema.mjs",
        "runtime/arcorbit/test/codex-output-schema.test.mjs",
        "Operator reproduction and ArcOrbit lifecycle traces, 2026-08-26"
      ]
    },
    {
      "id": "FACT-20260825-012-001",
      "revision": 1,
      "status": "accepted",
      "statement": "ArcOrbit replaced the unsupported case_control oneOf with mutually exclusive anyOf branches and its Codex output-schema preflight now rejects any future oneOf occurrence.",
      "basis": "Implemented source, regression tests, and extracted packaged app.asar verification.",
      "evidence": [
        "runtime/arcorbit/schemas/agent-loop-result.schema.json",
        "runtime/arcorbit/src/codex-output-schema.mjs",
        "runtime/arcorbit/test/codex-output-schema.test.mjs",
        "Verification: 90/90 focused Runtime tests passed, 2026-08-26",
        "Verification: packaged app.asar schema SHA-256 matched source, contained no oneOf, retained create_case and bind_closed_case branches, and passed Codex output-schema preflight, 2026-08-26",
        "Full Runtime audit: 439 passed, 11 skipped, 2 unrelated Electron SIGABRT failures, 2026-08-26"
      ]
    }
  ],
  "state_impacts": [],
  "gaps": [
    {
      "id": "GAP-RESTORE-STRICT-SCHEMA-COMPATIBILITY",
      "status": "resolved",
      "goal": "Replace the unsupported oneOf with an app-server-compatible equivalent, make preflight reject future oneOf usage, and verify source plus packaged schema behavior.",
      "reason": "This single schema keyword prevents every Automation Codex turn from starting, and the missing preflight rule allowed the regression through tests and packaging.",
      "derived_from": [
        "FACT-AUTOMATION-ONEOF-REJECTION"
      ],
      "blocked_by": [],
      "priority_basis": {
        "blocking": "high",
        "urgency": "high",
        "risk": "high",
        "user_impact": "high"
      },
      "responsibility": "agent",
      "evidence_required": [
        "A regression test that fails when any Codex output schema contains oneOf.",
        "Strict schema and Runtime focused tests passing with the compatible branch representation.",
        "Packaged schema verification showing no oneOf while both case-control branches remain present."
      ],
      "resolution": {
        "id": "GAP-RESTORE-STRICT-SCHEMA-COMPATIBILITY",
        "status": "resolved",
        "outcome": "Automation response schemas now use supported anyOf branches, and local preflight rejects future oneOf usage before packaging.",
        "reason": "The source and extracted packaged schema are identical, contain no oneOf, preserve both mutually exclusive Case control actions, and pass focused validation.",
        "evidence": [
          "runtime/arcorbit/schemas/agent-loop-result.schema.json",
          "runtime/arcorbit/src/codex-output-schema.mjs",
          "runtime/arcorbit/test/codex-output-schema.test.mjs",
          "Verification: 90/90 focused Runtime tests passed, 2026-08-26",
          "Verification: packaged app.asar schema SHA-256 matched source, contained no oneOf, retained create_case and bind_closed_case branches, and passed Codex output-schema preflight, 2026-08-26",
          "Full Runtime audit: 439 passed, 11 skipped, 2 unrelated Electron SIGABRT failures, 2026-08-26"
        ],
        "occurred_at": "2026-08-25T16:42:48.240Z"
      }
    }
  ],
  "content_revision": 1,
  "completion_review": {
    "status": "clean",
    "policy": {
      "initial_max_cycles": 10,
      "source": "runtime/arcorbit/config/case-policy.json",
      "snapshotted_at": "2026-08-25T16:38:59.174Z"
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
          "runtime/arcorbit/schemas/agent-loop-result.schema.json",
          "runtime/arcorbit/src/codex-output-schema.mjs",
          "runtime/arcorbit/test/codex-output-schema.test.mjs",
          "Verification: 90/90 focused Runtime tests passed, 2026-08-26",
          "Verification: packaged app.asar schema SHA-256 matched source, contained no oneOf, retained both Case control branches, and passed preflight, 2026-08-26",
          "Verification: git diff --check passed and no ARC_DEBUG:schema-oneof marker remains, 2026-08-26",
          "Full Runtime audit: 439 passed, 11 skipped, 2 unrelated Electron SIGABRT failures, 2026-08-26"
        ],
        "occurred_at": "2026-08-25T16:44:16.483Z"
      }
    ],
    "evidence": [
      "runtime/arcorbit/schemas/agent-loop-result.schema.json",
      "runtime/arcorbit/src/codex-output-schema.mjs",
      "runtime/arcorbit/test/codex-output-schema.test.mjs",
      "Verification: 90/90 focused Runtime tests passed, 2026-08-26",
      "Verification: packaged app.asar schema SHA-256 matched source, contained no oneOf, retained both Case control branches, and passed preflight, 2026-08-26",
      "Verification: git diff --check passed and no ARC_DEBUG:schema-oneof marker remains, 2026-08-26",
      "Full Runtime audit: 439 passed, 11 skipped, 2 unrelated Electron SIGABRT failures, 2026-08-26"
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
      "goal": "Accept the app-server-compatible Case control schema and preventive preflight regression guard.",
      "outcome": "completed",
      "gap_selection": {
        "mode": "candidate",
        "basis": "The confirmed schema regression blocks every Automation Agent turn and is the only ready gap in this Case.",
        "snapshot_token": "e6b838a654ee1f3c07a171a04c2b7a0244c377ce054c7352acb5a55a388824ae",
        "selected_ref": "case-gap:CASE-20260825-012:GAP-RESTORE-STRICT-SCHEMA-COMPATIBILITY",
        "comparison_summary": "Compared all Project candidates and the current Case gap; unrelated Project work remains deferred.",
        "fresh_discovery_summary": "No additional in-scope defect appeared after source, focused Runtime, full-suite, and packaged-app verification.",
        "considered": [
          {
            "ref": "project-gap:GAP-agent-scenario-evaluation",
            "source": "persisted",
            "eligibility": "case_required",
            "disposition": "deferred",
            "priority_basis": {
              "blocking": "",
              "uncertainty": "high",
              "risk": "high",
              "user_impact": ""
            },
            "reason": "This broader Project candidate remains outside the bounded regression Case."
          },
          {
            "ref": "project-gap:GAP-runtime-resilience-and-adapters",
            "source": "persisted",
            "eligibility": "case_required",
            "disposition": "deferred",
            "priority_basis": {
              "blocking": "",
              "uncertainty": "",
              "risk": "high",
              "user_impact": "",
              "urgency": "medium"
            },
            "reason": "This broader Project candidate remains outside the bounded regression Case."
          },
          {
            "ref": "project-gap:GAP-security-real-project-validation",
            "source": "persisted",
            "eligibility": "case_required",
            "disposition": "deferred",
            "priority_basis": {
              "blocking": "",
              "uncertainty": "",
              "risk": "high",
              "user_impact": "",
              "urgency": "medium"
            },
            "reason": "This broader Project candidate remains outside the bounded regression Case."
          },
          {
            "ref": "project-gap:GAP-cross-record-audit",
            "source": "persisted",
            "eligibility": "case_required",
            "disposition": "deferred",
            "priority_basis": {
              "blocking": "",
              "uncertainty": "",
              "risk": "high",
              "user_impact": "",
              "urgency": "high"
            },
            "reason": "This broader Project candidate remains outside the bounded regression Case."
          },
          {
            "ref": "case-gap:CASE-20260825-012:GAP-RESTORE-STRICT-SCHEMA-COMPATIBILITY",
            "source": "persisted",
            "eligibility": "ready",
            "disposition": "selected",
            "priority_basis": {
              "blocking": "high",
              "uncertainty": "",
              "risk": "high",
              "user_impact": "high",
              "urgency": "high"
            },
            "reason": "This is the user-blocking regression with a confirmed root cause and complete repair evidence."
          }
        ]
      },
      "selected_gap": {
        "id": "GAP-RESTORE-STRICT-SCHEMA-COMPATIBILITY",
        "responsibility": "agent",
        "goal": "Replace the unsupported oneOf with an app-server-compatible equivalent, make preflight reject future oneOf usage, and verify source plus packaged schema behavior.",
        "reason": "This single schema keyword prevents every Automation Codex turn from starting, and the missing preflight rule allowed the regression through tests and packaging.",
        "derived_from": [
          "FACT-AUTOMATION-ONEOF-REJECTION"
        ],
        "blocked_by": [],
        "priority_basis": {
          "blocking": "high",
          "uncertainty": "",
          "risk": "high",
          "user_impact": "high",
          "urgency": "high"
        },
        "evidence_required": [
          "A regression test that fails when any Codex output schema contains oneOf.",
          "Strict schema and Runtime focused tests passing with the compatible branch representation.",
          "Packaged schema verification showing no oneOf while both case-control branches remain present."
        ]
      },
      "planned_transition": {
        "goal": "Accept the app-server-compatible Case control schema and preventive preflight regression guard.",
        "expected_state_change": "Resolve the blocking schema compatibility gap and enter Completion Review."
      },
      "accepted_state_delta": {
        "resolved_gap": {
          "id": "GAP-RESTORE-STRICT-SCHEMA-COMPATIBILITY",
          "status": "resolved",
          "outcome": "Automation response schemas now use supported anyOf branches, and local preflight rejects future oneOf usage before packaging.",
          "reason": "The source and extracted packaged schema are identical, contain no oneOf, preserve both mutually exclusive Case control actions, and pass focused validation.",
          "evidence": [
            "runtime/arcorbit/schemas/agent-loop-result.schema.json",
            "runtime/arcorbit/src/codex-output-schema.mjs",
            "runtime/arcorbit/test/codex-output-schema.test.mjs",
            "Verification: 90/90 focused Runtime tests passed, 2026-08-26",
            "Verification: packaged app.asar schema SHA-256 matched source, contained no oneOf, retained create_case and bind_closed_case branches, and passed Codex output-schema preflight, 2026-08-26",
            "Full Runtime audit: 439 passed, 11 skipped, 2 unrelated Electron SIGABRT failures, 2026-08-26"
          ]
        },
        "facts_added": [
          {
            "id": "FACT-20260825-012-001",
            "revision": 1,
            "status": "accepted",
            "statement": "ArcOrbit replaced the unsupported case_control oneOf with mutually exclusive anyOf branches and its Codex output-schema preflight now rejects any future oneOf occurrence.",
            "basis": "Implemented source, regression tests, and extracted packaged app.asar verification.",
            "evidence": [
              "runtime/arcorbit/schemas/agent-loop-result.schema.json",
              "runtime/arcorbit/src/codex-output-schema.mjs",
              "runtime/arcorbit/test/codex-output-schema.test.mjs",
              "Verification: 90/90 focused Runtime tests passed, 2026-08-26",
              "Verification: packaged app.asar schema SHA-256 matched source, contained no oneOf, retained create_case and bind_closed_case branches, and passed Codex output-schema preflight, 2026-08-26",
              "Full Runtime audit: 439 passed, 11 skipped, 2 unrelated Electron SIGABRT failures, 2026-08-26"
            ]
          }
        ],
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
        "project_revision": 260,
        "judgments": [
          {
            "invariant_ref": "product-expectations-remain-recoverable",
            "disposition": "upheld",
            "reason": "The compatible schema, fail-fast preflight, focused regression tests, and extracted packaged artifact provide direct repeatable evidence for this invariant.",
            "fact_refs": [
              "FACT-20260825-012-001"
            ],
            "evidence": [
              "runtime/arcorbit/schemas/agent-loop-result.schema.json",
              "runtime/arcorbit/src/codex-output-schema.mjs",
              "runtime/arcorbit/test/codex-output-schema.test.mjs",
              "Verification: 90/90 focused Runtime tests passed, 2026-08-26",
              "Verification: packaged app.asar schema SHA-256 matched source, contained no oneOf, retained create_case and bind_closed_case branches, and passed Codex output-schema preflight, 2026-08-26",
              "Full Runtime audit: 439 passed, 11 skipped, 2 unrelated Electron SIGABRT failures, 2026-08-26"
            ],
            "gap_refs": []
          },
          {
            "invariant_ref": "interaction-expectations-remain-recoverable",
            "disposition": "not_relevant",
            "reason": "The regression and repair only change the machine-readable Codex response schema and its build-time validation; no interaction or visual expectation changes.",
            "fact_refs": [],
            "evidence": [],
            "gap_refs": []
          },
          {
            "invariant_ref": "visual-language-remains-consistent",
            "disposition": "not_relevant",
            "reason": "The regression and repair only change the machine-readable Codex response schema and its build-time validation; no interaction or visual expectation changes.",
            "fact_refs": [],
            "evidence": [],
            "gap_refs": []
          },
          {
            "invariant_ref": "technical-decisions-remain-explainable",
            "disposition": "upheld",
            "reason": "The compatible schema, fail-fast preflight, focused regression tests, and extracted packaged artifact provide direct repeatable evidence for this invariant.",
            "fact_refs": [
              "FACT-20260825-012-001"
            ],
            "evidence": [
              "runtime/arcorbit/schemas/agent-loop-result.schema.json",
              "runtime/arcorbit/src/codex-output-schema.mjs",
              "runtime/arcorbit/test/codex-output-schema.test.mjs",
              "Verification: 90/90 focused Runtime tests passed, 2026-08-26",
              "Verification: packaged app.asar schema SHA-256 matched source, contained no oneOf, retained create_case and bind_closed_case branches, and passed Codex output-schema preflight, 2026-08-26",
              "Full Runtime audit: 439 passed, 11 skipped, 2 unrelated Electron SIGABRT failures, 2026-08-26"
            ],
            "gap_refs": []
          },
          {
            "invariant_ref": "accepted-facts-are-realized",
            "disposition": "upheld",
            "reason": "The compatible schema, fail-fast preflight, focused regression tests, and extracted packaged artifact provide direct repeatable evidence for this invariant.",
            "fact_refs": [
              "FACT-20260825-012-001"
            ],
            "evidence": [
              "runtime/arcorbit/schemas/agent-loop-result.schema.json",
              "runtime/arcorbit/src/codex-output-schema.mjs",
              "runtime/arcorbit/test/codex-output-schema.test.mjs",
              "Verification: 90/90 focused Runtime tests passed, 2026-08-26",
              "Verification: packaged app.asar schema SHA-256 matched source, contained no oneOf, retained create_case and bind_closed_case branches, and passed Codex output-schema preflight, 2026-08-26",
              "Full Runtime audit: 439 passed, 11 skipped, 2 unrelated Electron SIGABRT failures, 2026-08-26"
            ],
            "gap_refs": []
          },
          {
            "invariant_ref": "material-risks-have-credible-evidence",
            "disposition": "upheld",
            "reason": "The compatible schema, fail-fast preflight, focused regression tests, and extracted packaged artifact provide direct repeatable evidence for this invariant.",
            "fact_refs": [
              "FACT-20260825-012-001"
            ],
            "evidence": [
              "runtime/arcorbit/schemas/agent-loop-result.schema.json",
              "runtime/arcorbit/src/codex-output-schema.mjs",
              "runtime/arcorbit/test/codex-output-schema.test.mjs",
              "Verification: 90/90 focused Runtime tests passed, 2026-08-26",
              "Verification: packaged app.asar schema SHA-256 matched source, contained no oneOf, retained create_case and bind_closed_case branches, and passed Codex output-schema preflight, 2026-08-26",
              "Full Runtime audit: 439 passed, 11 skipped, 2 unrelated Electron SIGABRT failures, 2026-08-26"
            ],
            "gap_refs": []
          }
        ]
      },
      "evidence": [
        "runtime/arcorbit/schemas/agent-loop-result.schema.json",
        "runtime/arcorbit/src/codex-output-schema.mjs",
        "runtime/arcorbit/test/codex-output-schema.test.mjs",
        "Verification: 90/90 focused Runtime tests passed, 2026-08-26",
        "Verification: packaged app.asar schema SHA-256 matched source, contained no oneOf, retained create_case and bind_closed_case branches, and passed Codex output-schema preflight, 2026-08-26",
        "Full Runtime audit: 439 passed, 11 skipped, 2 unrelated Electron SIGABRT failures, 2026-08-26"
      ],
      "runtime_result_ref": "codex://schema-oneof-regression/resolve",
      "occurred_at": "2026-08-25T16:42:48.240Z"
    },
    {
      "round": 2,
      "transition_schema_version": "arckit-case-transition/v8",
      "goal": "Review the strict output-schema compatibility repair across all five completion dimensions.",
      "outcome": "completed",
      "gap_selection": {
        "mode": "candidate",
        "basis": "All ordinary regression obligations are closed, leaving the derived Completion Review as the sole ready candidate in this Case.",
        "snapshot_token": "372464675688924cffe1f4bcd63583405c4629f0cabf39b2044e1288c0aa780e",
        "selected_ref": "case-gap:CASE-20260825-012:CASE-20260825-012:completion-review:1",
        "comparison_summary": "Compared the review candidate with every in-scope Project candidate; unrelated Project work remains deferred.",
        "fresh_discovery_summary": "No additional in-scope issue was found in the final diff, test, or packaged-artifact review.",
        "considered": [
          {
            "ref": "project-gap:GAP-agent-scenario-evaluation",
            "source": "persisted",
            "eligibility": "case_required",
            "disposition": "deferred",
            "priority_basis": {
              "blocking": "",
              "uncertainty": "high",
              "risk": "high",
              "user_impact": ""
            },
            "reason": "This broader Project candidate is outside the bounded regression Case."
          },
          {
            "ref": "project-gap:GAP-runtime-resilience-and-adapters",
            "source": "persisted",
            "eligibility": "case_required",
            "disposition": "deferred",
            "priority_basis": {
              "blocking": "",
              "uncertainty": "",
              "risk": "high",
              "user_impact": "",
              "urgency": "medium"
            },
            "reason": "This broader Project candidate is outside the bounded regression Case."
          },
          {
            "ref": "project-gap:GAP-security-real-project-validation",
            "source": "persisted",
            "eligibility": "case_required",
            "disposition": "deferred",
            "priority_basis": {
              "blocking": "",
              "uncertainty": "",
              "risk": "high",
              "user_impact": "",
              "urgency": "medium"
            },
            "reason": "This broader Project candidate is outside the bounded regression Case."
          },
          {
            "ref": "project-gap:GAP-cross-record-audit",
            "source": "persisted",
            "eligibility": "case_required",
            "disposition": "deferred",
            "priority_basis": {
              "blocking": "",
              "uncertainty": "",
              "risk": "high",
              "user_impact": "",
              "urgency": "high"
            },
            "reason": "This broader Project candidate is outside the bounded regression Case."
          },
          {
            "ref": "case-gap:CASE-20260825-012:CASE-20260825-012:completion-review:1",
            "source": "persisted",
            "eligibility": "ready",
            "disposition": "selected",
            "priority_basis": {
              "blocking": "high",
              "uncertainty": "low",
              "risk": "high",
              "user_impact": "high"
            },
            "reason": "The repaired implementation is ready for its required five-dimension Completion Review."
          }
        ]
      },
      "selected_gap": {
        "id": "CASE-20260825-012:completion-review:1",
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
        "goal": "Review the strict output-schema compatibility repair across all five completion dimensions.",
        "expected_state_change": "Record a clean Completion Review and close the regression Case."
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
          "dimensions": {
            "implementation_correctness": "clean",
            "problem_resolution": "clean",
            "verification_credibility": "clean",
            "regression_risk": "clean",
            "minimality": "clean"
          },
          "findings": [],
          "evidence": [
            "runtime/arcorbit/schemas/agent-loop-result.schema.json",
            "runtime/arcorbit/src/codex-output-schema.mjs",
            "runtime/arcorbit/test/codex-output-schema.test.mjs",
            "Verification: 90/90 focused Runtime tests passed, 2026-08-26",
            "Verification: packaged app.asar schema SHA-256 matched source, contained no oneOf, retained both Case control branches, and passed preflight, 2026-08-26",
            "Verification: git diff --check passed and no ARC_DEBUG:schema-oneof marker remains, 2026-08-26",
            "Full Runtime audit: 439 passed, 11 skipped, 2 unrelated Electron SIGABRT failures, 2026-08-26"
          ],
          "reviewed_content_revision": 1
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
        "project_revision": 260,
        "judgments": [
          {
            "invariant_ref": "product-expectations-remain-recoverable",
            "disposition": "upheld",
            "reason": "The clean review confirms the compatible schema, preventive preflight, focused tests, and packaged artifact preserve this invariant.",
            "fact_refs": [],
            "evidence": [
              "runtime/arcorbit/schemas/agent-loop-result.schema.json",
              "runtime/arcorbit/src/codex-output-schema.mjs",
              "runtime/arcorbit/test/codex-output-schema.test.mjs",
              "Verification: 90/90 focused Runtime tests passed, 2026-08-26",
              "Verification: packaged app.asar schema SHA-256 matched source, contained no oneOf, retained both Case control branches, and passed preflight, 2026-08-26",
              "Verification: git diff --check passed and no ARC_DEBUG:schema-oneof marker remains, 2026-08-26",
              "Full Runtime audit: 439 passed, 11 skipped, 2 unrelated Electron SIGABRT failures, 2026-08-26"
            ],
            "gap_refs": []
          },
          {
            "invariant_ref": "interaction-expectations-remain-recoverable",
            "disposition": "not_relevant",
            "reason": "The reviewed repair changes only machine-readable response-schema compatibility and validation, not interaction or visual expectations.",
            "fact_refs": [],
            "evidence": [],
            "gap_refs": []
          },
          {
            "invariant_ref": "visual-language-remains-consistent",
            "disposition": "not_relevant",
            "reason": "The reviewed repair changes only machine-readable response-schema compatibility and validation, not interaction or visual expectations.",
            "fact_refs": [],
            "evidence": [],
            "gap_refs": []
          },
          {
            "invariant_ref": "technical-decisions-remain-explainable",
            "disposition": "upheld",
            "reason": "The clean review confirms the compatible schema, preventive preflight, focused tests, and packaged artifact preserve this invariant.",
            "fact_refs": [],
            "evidence": [
              "runtime/arcorbit/schemas/agent-loop-result.schema.json",
              "runtime/arcorbit/src/codex-output-schema.mjs",
              "runtime/arcorbit/test/codex-output-schema.test.mjs",
              "Verification: 90/90 focused Runtime tests passed, 2026-08-26",
              "Verification: packaged app.asar schema SHA-256 matched source, contained no oneOf, retained both Case control branches, and passed preflight, 2026-08-26",
              "Verification: git diff --check passed and no ARC_DEBUG:schema-oneof marker remains, 2026-08-26",
              "Full Runtime audit: 439 passed, 11 skipped, 2 unrelated Electron SIGABRT failures, 2026-08-26"
            ],
            "gap_refs": []
          },
          {
            "invariant_ref": "accepted-facts-are-realized",
            "disposition": "upheld",
            "reason": "The clean review confirms the compatible schema, preventive preflight, focused tests, and packaged artifact preserve this invariant.",
            "fact_refs": [],
            "evidence": [
              "runtime/arcorbit/schemas/agent-loop-result.schema.json",
              "runtime/arcorbit/src/codex-output-schema.mjs",
              "runtime/arcorbit/test/codex-output-schema.test.mjs",
              "Verification: 90/90 focused Runtime tests passed, 2026-08-26",
              "Verification: packaged app.asar schema SHA-256 matched source, contained no oneOf, retained both Case control branches, and passed preflight, 2026-08-26",
              "Verification: git diff --check passed and no ARC_DEBUG:schema-oneof marker remains, 2026-08-26",
              "Full Runtime audit: 439 passed, 11 skipped, 2 unrelated Electron SIGABRT failures, 2026-08-26"
            ],
            "gap_refs": []
          },
          {
            "invariant_ref": "material-risks-have-credible-evidence",
            "disposition": "upheld",
            "reason": "The clean review confirms the compatible schema, preventive preflight, focused tests, and packaged artifact preserve this invariant.",
            "fact_refs": [],
            "evidence": [
              "runtime/arcorbit/schemas/agent-loop-result.schema.json",
              "runtime/arcorbit/src/codex-output-schema.mjs",
              "runtime/arcorbit/test/codex-output-schema.test.mjs",
              "Verification: 90/90 focused Runtime tests passed, 2026-08-26",
              "Verification: packaged app.asar schema SHA-256 matched source, contained no oneOf, retained both Case control branches, and passed preflight, 2026-08-26",
              "Verification: git diff --check passed and no ARC_DEBUG:schema-oneof marker remains, 2026-08-26",
              "Full Runtime audit: 439 passed, 11 skipped, 2 unrelated Electron SIGABRT failures, 2026-08-26"
            ],
            "gap_refs": []
          }
        ]
      },
      "evidence": [
        "runtime/arcorbit/schemas/agent-loop-result.schema.json",
        "runtime/arcorbit/src/codex-output-schema.mjs",
        "runtime/arcorbit/test/codex-output-schema.test.mjs",
        "Verification: 90/90 focused Runtime tests passed, 2026-08-26",
        "Verification: packaged app.asar schema SHA-256 matched source, contained no oneOf, retained both Case control branches, and passed preflight, 2026-08-26",
        "Verification: git diff --check passed and no ARC_DEBUG:schema-oneof marker remains, 2026-08-26",
        "Full Runtime audit: 439 passed, 11 skipped, 2 unrelated Electron SIGABRT failures, 2026-08-26"
      ],
      "runtime_result_ref": "codex://schema-oneof-regression/completion-review",
      "occurred_at": "2026-08-25T16:44:16.483Z"
    }
  ],
  "case_resolution": {
    "status": "resolved",
    "stage": "resolved",
    "satisfied": [
      "GAP-RESTORE-STRICT-SCHEMA-COMPATIBILITY"
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
    "updated_at": "2026-08-25T16:44:16.483Z"
  }
}
```

## Round Notes

- Case history is canonical in Structured Record.rounds; keep prose notes exceptional.
