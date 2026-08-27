# Preserve external wait in Automation

Case: CASE-20260827-001
Status: closed
Artifact Type: code
Selected Gap: none
Updated: 2026-08-27T03:56:07.634Z

## User Intent

修复 ArcOrbit Automation 把正常 external_wait 错误归类为 Runtime 尚未收束的问题。

## Structured Record

```json
{
  "schema_version": "development-case-record/v5",
  "id": "CASE-20260827-001",
  "title": "Preserve external wait in Automation",
  "status": "closed",
  "artifact_type": "code",
  "created_at": "2026-08-27T03:37:45.427Z",
  "updated_at": "2026-08-27T03:56:07.634Z",
  "user_intent": "修复 ArcOrbit Automation 把正常 external_wait 错误归类为 Runtime 尚未收束的问题。",
  "expected_outcome": "Automation 将 external responsibility 持久化并展示为独立等待态，在 live completion 与重启恢复中均不创建 runtime_incomplete recovery，也不伪装成人工决策。",
  "project_state_ref": "arckit/project/state.record.json",
  "current_round": {
    "goal": "",
    "selected_gap": null
  },
  "facts": [
    {
      "id": "FACT-20260827-001-001",
      "revision": 1,
      "status": "accepted",
      "statement": "State-driven Runtime 和 trusted Ledger 已将外部责任表达为 external_wait，但 Automation Coordinator 未处理 external handoff，导致已完成 Run 落入 runtime_incomplete recovery 并显示 Runtime 尚未收束。",
      "basis": "用户可见报错与 source path 的确定性逐层推演 100% 匹配。",
      "evidence": [
        "runtime/arcorbit/src/state-driven-runner.mjs",
        "runtime/arcorbit/src/automation-coordinator.mjs",
        "runtime/arcorbit/desktop/renderer/renderer.js",
        "arckit/cases/active/CASE-20260826-013-development-case.md"
      ]
    },
    {
      "id": "FACT-20260827-001-002",
      "revision": 1,
      "status": "accepted",
      "statement": "ArcOrbit Automation 将 accepted external handoff 持久化为 external_wait：live、detached、canonical 与启动对账均不创建 Runtime 错误或自动重试，Desktop 显示等待原因与恢复条件，并通过显式动作复用同一 execution、task session 和持久 thread 继续 fresh Runtime。",
      "basis": "Production coordinator, Store, typed IPC, Renderer, ledger handoff projection and behavior regressions agree on the same control semantics.",
      "evidence": [
        "runtime/arcorbit/src/automation-coordinator.mjs",
        "runtime/arcorbit/src/desktop/desktop-store.mjs",
        "runtime/arcorbit/desktop/main.mjs",
        "runtime/arcorbit/desktop/preload.cjs",
        "runtime/arcorbit/desktop/renderer/renderer.js",
        "runtime/arcorbit/src/agent-orchestrator.mjs",
        "entry/skills/arckit-development-ledger/scripts/development-case.mjs",
        "arckit/interaction/automation-workspace/interaction.md",
        "arckit/tech/arcorbit/desktop-execution-solution.md",
        "runtime/arcorbit/test/automation-coordinator.test.mjs",
        "runtime/arcorbit/test/desktop-renderer.test.mjs",
        "runtime/arcorbit/test/case-transition.test.mjs"
      ]
    }
  ],
  "state_impacts": [
    {
      "id": "IMPACT-20260827-001-001",
      "fact_id": "FACT-20260827-001-001",
      "fact_revision": 1,
      "target": {
        "kind": "software_invariant",
        "ref": "accepted-facts-are-realized",
        "revision": null
      },
      "effect": "upheld",
      "reason": "The accepted external_wait meaning is now realized throughout the Runtime-to-Desktop path.",
      "gap_ids": [],
      "evidence": [
        "runtime/arcorbit/src/automation-coordinator.mjs",
        "runtime/arcorbit/desktop/renderer/renderer.js",
        "arckit/interaction/automation-workspace/interaction.md",
        "arckit/tech/arcorbit/desktop-execution-solution.md",
        "runtime/arcorbit/test/automation-coordinator.test.mjs"
      ]
    }
  ],
  "gaps": [
    {
      "id": "GAP-20260827-001-001",
      "status": "resolved",
      "goal": "让 Automation 在 live completion、detached reconciliation 和启动恢复中将 external_wait 保持为独立非错误控制态，并提供明确、可恢复的用户投影。",
      "reason": "当前 Coordinator 只处理 human 与 complete，external handoff 落入 runtime_incomplete fallback。",
      "derived_from": [
        "FACT-20260827-001-001"
      ],
      "blocked_by": [],
      "priority_basis": {
        "blocking": "直接阻断当前 Automation 正确等待外部 provider。",
        "uncertainty": "根因已由 source path 完整确认。",
        "risk": "错误重试可能重复启动同一任务，mark blocked 也会扭曲真实责任。",
        "user_impact": "用户看到错误告警且无法辨认是否需要人工介入。"
      },
      "responsibility": "agent",
      "evidence_required": [
        "Automation live completion external_wait test",
        "Detached/startup external_wait recovery test",
        "Desktop external wait presentation test",
        "Focused and full ArcOrbit regression"
      ],
      "resolution": {
        "id": "GAP-20260827-001-001",
        "status": "resolved",
        "outcome": "implemented",
        "reason": "Automation now persists accepted external handoffs as external_wait across live, detached, canonical and startup paths, presents the resume condition, and explicitly resumes the same task session/thread.",
        "evidence": [
          "runtime/arcorbit/src/automation-coordinator.mjs",
          "runtime/arcorbit/desktop/renderer/renderer.js",
          "runtime/arcorbit/test/automation-coordinator.test.mjs",
          "runtime/arcorbit/test/desktop-renderer.test.mjs",
          "Verification: 156 focused tests passed, 0 failed",
          "Verification: non-GUI ArcOrbit suite 527 tests; 508 passed, 19 skipped, 0 failed"
        ],
        "occurred_at": "2026-08-27T03:54:26.478Z"
      }
    }
  ],
  "content_revision": 1,
  "completion_review": {
    "status": "clean",
    "policy": {
      "initial_max_cycles": 10,
      "source": "runtime/arcorbit/config/case-policy.json",
      "snapshotted_at": "2026-08-27T03:37:45.427Z"
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
          "Review: live completion checks accepted ledger write before external wait projection.",
          "Review: detached and canonical startup reconciliation converge on external_wait and presence recovery excludes it.",
          "Review: explicit resume validates phase/execution routing and reuses the persisted task session/thread.",
          "Review: Renderer exposes only a bounded execution_id action and distinguishes External from Human and recovery.",
          "runtime/arcorbit/src/automation-coordinator.mjs",
          "runtime/arcorbit/src/desktop/desktop-store.mjs",
          "runtime/arcorbit/desktop/main.mjs",
          "runtime/arcorbit/desktop/preload.cjs",
          "runtime/arcorbit/desktop/renderer/renderer.js",
          "runtime/arcorbit/test/automation-coordinator.test.mjs",
          "runtime/arcorbit/test/desktop-renderer.test.mjs",
          "runtime/arcorbit/test/case-transition.test.mjs",
          "Verification: 156 focused tests passed, 0 failed",
          "Verification: non-GUI ArcOrbit suite 527 tests; 508 passed, 19 skipped, 0 failed",
          "Verification limitation: two unrelated Electron fixture launches aborted with SIGABRT inside the restricted sandbox before assertions; external execution approval was unavailable."
        ],
        "occurred_at": "2026-08-27T03:56:07.634Z"
      }
    ],
    "evidence": [
      "Review: live completion checks accepted ledger write before external wait projection.",
      "Review: detached and canonical startup reconciliation converge on external_wait and presence recovery excludes it.",
      "Review: explicit resume validates phase/execution routing and reuses the persisted task session/thread.",
      "Review: Renderer exposes only a bounded execution_id action and distinguishes External from Human and recovery.",
      "runtime/arcorbit/src/automation-coordinator.mjs",
      "runtime/arcorbit/src/desktop/desktop-store.mjs",
      "runtime/arcorbit/desktop/main.mjs",
      "runtime/arcorbit/desktop/preload.cjs",
      "runtime/arcorbit/desktop/renderer/renderer.js",
      "runtime/arcorbit/test/automation-coordinator.test.mjs",
      "runtime/arcorbit/test/desktop-renderer.test.mjs",
      "runtime/arcorbit/test/case-transition.test.mjs",
      "Verification: 156 focused tests passed, 0 failed",
      "Verification: non-GUI ArcOrbit suite 527 tests; 508 passed, 19 skipped, 0 failed",
      "Verification limitation: two unrelated Electron fixture launches aborted with SIGABRT inside the restricted sandbox before assertions; external execution approval was unavailable."
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
      "goal": "Implement and document durable external_wait handling across completion, restart, Desktop projection and explicit same-thread resume.",
      "outcome": "completed",
      "gap_selection": {
        "mode": "candidate",
        "basis": "The current Case gap directly represents the diagnosed Automation external-wait misclassification.",
        "snapshot_token": "32b820a3f6721a7ea68e5a27360542a1ef0ce50f2eacbbb93cc5ad63ac888da0",
        "selected_ref": "case-gap:CASE-20260827-001:GAP-20260827-001-001",
        "comparison_summary": "The current Case gap is the only in-scope implementation obligation; four Project gaps require separate Cases.",
        "fresh_discovery_summary": "No additional Case-local gap was found; the provider obligation remains in CASE-20260826-013.",
        "considered": [
          {
            "ref": "project-gap:GAP-agent-scenario-evaluation",
            "source": "persisted",
            "eligibility": "case_required",
            "disposition": "deferred",
            "priority_basis": {
              "risk": "high",
              "uncertainty": "high"
            },
            "reason": "Requires isolated evaluation in a separate Case."
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
            "reason": "The broad gap also covers timeout, compaction and other adapter work and must not be falsely resolved."
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
            "reason": "Needs a real permission-bearing project and is unrelated to this control-state repair."
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
            "reason": "Requires a separate cross-record audit Case."
          },
          {
            "ref": "case-gap:CASE-20260827-001:GAP-20260827-001-001",
            "source": "persisted",
            "eligibility": "ready",
            "disposition": "selected",
            "priority_basis": {
              "blocking": "Fixes the reported false Runtime error.",
              "uncertainty": "All affected paths are identified.",
              "risk": "Prevents duplicate retries and incorrect recovery.",
              "user_impact": "Restores an accurate wait state."
            },
            "reason": "The concrete Agent-owned obligation now has implementation, design and regression evidence."
          }
        ]
      },
      "selected_gap": {
        "id": "GAP-20260827-001-001",
        "responsibility": "agent",
        "goal": "让 Automation 在 live completion、detached reconciliation 和启动恢复中将 external_wait 保持为独立非错误控制态，并提供明确、可恢复的用户投影。",
        "reason": "当前 Coordinator 只处理 human 与 complete，external handoff 落入 runtime_incomplete fallback。",
        "derived_from": [
          "FACT-20260827-001-001"
        ],
        "blocked_by": [],
        "priority_basis": {
          "blocking": "直接阻断当前 Automation 正确等待外部 provider。",
          "uncertainty": "根因已由 source path 完整确认。",
          "risk": "错误重试可能重复启动同一任务，mark blocked 也会扭曲真实责任。",
          "user_impact": "用户看到错误告警且无法辨认是否需要人工介入。"
        },
        "evidence_required": [
          "Automation live completion external_wait test",
          "Detached/startup external_wait recovery test",
          "Desktop external wait presentation test",
          "Focused and full ArcOrbit regression"
        ]
      },
      "planned_transition": {
        "goal": "Implement and document durable external_wait handling across completion, restart, Desktop projection and explicit same-thread resume.",
        "expected_state_change": "Resolve the implementation gap and advance the Case to Completion Review without changing the external provider obligation."
      },
      "accepted_state_delta": {
        "resolved_gap": {
          "id": "GAP-20260827-001-001",
          "status": "resolved",
          "outcome": "implemented",
          "reason": "Automation now persists accepted external handoffs as external_wait across live, detached, canonical and startup paths, presents the resume condition, and explicitly resumes the same task session/thread.",
          "evidence": [
            "runtime/arcorbit/src/automation-coordinator.mjs",
            "runtime/arcorbit/desktop/renderer/renderer.js",
            "runtime/arcorbit/test/automation-coordinator.test.mjs",
            "runtime/arcorbit/test/desktop-renderer.test.mjs",
            "Verification: 156 focused tests passed, 0 failed",
            "Verification: non-GUI ArcOrbit suite 527 tests; 508 passed, 19 skipped, 0 failed"
          ]
        },
        "facts_added": [
          {
            "id": "FACT-20260827-001-002",
            "revision": 1,
            "status": "accepted",
            "statement": "ArcOrbit Automation 将 accepted external handoff 持久化为 external_wait：live、detached、canonical 与启动对账均不创建 Runtime 错误或自动重试，Desktop 显示等待原因与恢复条件，并通过显式动作复用同一 execution、task session 和持久 thread 继续 fresh Runtime。",
            "basis": "Production coordinator, Store, typed IPC, Renderer, ledger handoff projection and behavior regressions agree on the same control semantics.",
            "evidence": [
              "runtime/arcorbit/src/automation-coordinator.mjs",
              "runtime/arcorbit/src/desktop/desktop-store.mjs",
              "runtime/arcorbit/desktop/main.mjs",
              "runtime/arcorbit/desktop/preload.cjs",
              "runtime/arcorbit/desktop/renderer/renderer.js",
              "runtime/arcorbit/src/agent-orchestrator.mjs",
              "entry/skills/arckit-development-ledger/scripts/development-case.mjs",
              "arckit/interaction/automation-workspace/interaction.md",
              "arckit/tech/arcorbit/desktop-execution-solution.md",
              "runtime/arcorbit/test/automation-coordinator.test.mjs",
              "runtime/arcorbit/test/desktop-renderer.test.mjs",
              "runtime/arcorbit/test/case-transition.test.mjs"
            ]
          }
        ],
        "facts_superseded": [],
        "impacts_added": [],
        "impacts_updated": [
          {
            "id": "IMPACT-20260827-001-001",
            "fact_id": "FACT-20260827-001-001",
            "fact_revision": 1,
            "target": {
              "kind": "software_invariant",
              "ref": "accepted-facts-are-realized",
              "revision": null
            },
            "effect": "upheld",
            "reason": "The accepted external_wait meaning is now realized throughout the Runtime-to-Desktop path.",
            "gap_ids": [],
            "evidence": [
              "runtime/arcorbit/src/automation-coordinator.mjs",
              "runtime/arcorbit/desktop/renderer/renderer.js",
              "arckit/interaction/automation-workspace/interaction.md",
              "arckit/tech/arcorbit/desktop-execution-solution.md",
              "runtime/arcorbit/test/automation-coordinator.test.mjs"
            ]
          }
        ],
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
        "evidence": [
          "arckit/interaction/automation-workspace/interaction.md",
          "arckit/tech/arcorbit/desktop-execution-solution.md"
        ]
      },
      "invariant_assessment": {
        "project_revision": 301,
        "judgments": [
          {
            "invariant_ref": "product-expectations-remain-recoverable",
            "disposition": "upheld",
            "reason": "The external responsibility wait and continuation outcome are recoverable from durable Automation interaction sources.",
            "fact_refs": [
              "FACT-20260827-001-002"
            ],
            "evidence": [
              "arckit/interaction/automation-workspace/interaction.md",
              "arckit/interaction/automation-workspace/default.html"
            ],
            "gap_refs": []
          },
          {
            "invariant_ref": "interaction-expectations-remain-recoverable",
            "disposition": "upheld",
            "reason": "Reason, resume condition, no-feedback continuation and lane behavior are explicitly projected.",
            "fact_refs": [
              "FACT-20260827-001-002"
            ],
            "evidence": [
              "arckit/interaction/automation-workspace/interaction.md",
              "arckit/interaction/automation-workspace/default.html"
            ],
            "gap_refs": []
          },
          {
            "invariant_ref": "visual-language-remains-consistent",
            "disposition": "not_relevant",
            "reason": "The repair reuses existing cards, status text and buttons without changing visual rules.",
            "fact_refs": [],
            "evidence": [],
            "gap_refs": []
          },
          {
            "invariant_ref": "technical-decisions-remain-explainable",
            "disposition": "upheld",
            "reason": "Accepted handoff, persisted phase, reconciliation exclusions, typed IPC and same-thread resume are documented and traceable.",
            "fact_refs": [
              "FACT-20260827-001-002"
            ],
            "evidence": [
              "arckit/tech/arcorbit/desktop-execution-solution.md",
              "runtime/arcorbit/src/automation-coordinator.mjs",
              "runtime/arcorbit/desktop/main.mjs",
              "runtime/arcorbit/desktop/preload.cjs"
            ],
            "gap_refs": []
          },
          {
            "invariant_ref": "accepted-facts-are-realized",
            "disposition": "upheld",
            "reason": "The missing Desktop projection is implemented across completion and restart paths.",
            "fact_refs": [
              "FACT-20260827-001-001",
              "FACT-20260827-001-002"
            ],
            "evidence": [
              "runtime/arcorbit/src/automation-coordinator.mjs",
              "runtime/arcorbit/desktop/renderer/renderer.js",
              "runtime/arcorbit/test/automation-coordinator.test.mjs",
              "runtime/arcorbit/test/desktop-renderer.test.mjs"
            ],
            "gap_refs": []
          },
          {
            "invariant_ref": "material-risks-have-credible-evidence",
            "disposition": "upheld",
            "reason": "Retry, restart, lane identity, same-thread and Renderer risks have focused and broad regression coverage.",
            "fact_refs": [
              "FACT-20260827-001-002"
            ],
            "evidence": [
              "runtime/arcorbit/test/automation-coordinator.test.mjs",
              "runtime/arcorbit/test/desktop-renderer.test.mjs",
              "runtime/arcorbit/test/case-transition.test.mjs",
              "Verification: 156 focused tests passed, 0 failed",
              "Verification: non-GUI ArcOrbit suite 527 tests; 508 passed, 19 skipped, 0 failed"
            ],
            "gap_refs": []
          }
        ]
      },
      "evidence": [
        "runtime/arcorbit/src/automation-coordinator.mjs",
        "runtime/arcorbit/src/desktop/desktop-store.mjs",
        "runtime/arcorbit/desktop/main.mjs",
        "runtime/arcorbit/desktop/preload.cjs",
        "runtime/arcorbit/desktop/renderer/renderer.js",
        "runtime/arcorbit/src/agent-orchestrator.mjs",
        "entry/skills/arckit-development-ledger/scripts/development-case.mjs",
        "arckit/interaction/automation-workspace/interaction.md",
        "arckit/interaction/automation-workspace/default.html",
        "arckit/tech/arcorbit/desktop-execution-solution.md",
        "runtime/arcorbit/test/automation-coordinator.test.mjs",
        "runtime/arcorbit/test/desktop-renderer.test.mjs",
        "runtime/arcorbit/test/case-transition.test.mjs",
        "Verification: 156 focused tests passed, 0 failed",
        "Verification: non-GUI ArcOrbit suite 527 tests; 508 passed, 19 skipped, 0 failed"
      ],
      "runtime_result_ref": "",
      "occurred_at": "2026-08-27T03:54:26.478Z"
    },
    {
      "round": 2,
      "transition_schema_version": "arckit-case-transition/v8",
      "goal": "Independently review the external_wait implementation and its verification across all five Completion Review dimensions.",
      "outcome": "completed",
      "gap_selection": {
        "mode": "candidate",
        "basis": "All ordinary gaps and state impacts are closed, making the derived autonomous Completion Review the only in-scope Case obligation.",
        "snapshot_token": "8c09c55363cc04689c6eca6ffd9c7b6687fe417967bb027287527f30aecb5b98",
        "selected_ref": "case-gap:CASE-20260827-001:CASE-20260827-001:completion-review:1",
        "comparison_summary": "The Completion Review is selected; four Project gaps require separate Cases and are deferred.",
        "fresh_discovery_summary": "Independent review of code paths, identity boundaries, durable projections, diffs and regressions found no new implementation gap.",
        "considered": [
          {
            "ref": "project-gap:GAP-agent-scenario-evaluation",
            "source": "persisted",
            "eligibility": "case_required",
            "disposition": "deferred",
            "priority_basis": {
              "risk": "high",
              "uncertainty": "high"
            },
            "reason": "Requires separate isolated evaluation."
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
            "reason": "Broad timeout, compaction and adapter work remains outside this completed Case."
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
            "reason": "Requires a separate real permission-bearing project."
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
            "reason": "Requires a separate cross-record audit Case."
          },
          {
            "ref": "case-gap:CASE-20260827-001:CASE-20260827-001:completion-review:1",
            "source": "persisted",
            "eligibility": "ready",
            "disposition": "selected",
            "priority_basis": {
              "blocking": "Required before Case close.",
              "uncertainty": "low",
              "risk": "high",
              "user_impact": "high"
            },
            "reason": "The implementation is complete and must be independently reviewed before deterministic close."
          }
        ]
      },
      "selected_gap": {
        "id": "CASE-20260827-001:completion-review:1",
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
        "goal": "Independently review the external_wait implementation and its verification across all five Completion Review dimensions.",
        "expected_state_change": "Record a clean review for content revision 1 and close the Case without creating repair gaps."
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
            "Review: live completion checks accepted ledger write before external wait projection.",
            "Review: detached and canonical startup reconciliation converge on external_wait and presence recovery excludes it.",
            "Review: explicit resume validates phase/execution routing and reuses the persisted task session/thread.",
            "Review: Renderer exposes only a bounded execution_id action and distinguishes External from Human and recovery.",
            "runtime/arcorbit/src/automation-coordinator.mjs",
            "runtime/arcorbit/src/desktop/desktop-store.mjs",
            "runtime/arcorbit/desktop/main.mjs",
            "runtime/arcorbit/desktop/preload.cjs",
            "runtime/arcorbit/desktop/renderer/renderer.js",
            "runtime/arcorbit/test/automation-coordinator.test.mjs",
            "runtime/arcorbit/test/desktop-renderer.test.mjs",
            "runtime/arcorbit/test/case-transition.test.mjs",
            "Verification: 156 focused tests passed, 0 failed",
            "Verification: non-GUI ArcOrbit suite 527 tests; 508 passed, 19 skipped, 0 failed",
            "Verification limitation: two unrelated Electron fixture launches aborted with SIGABRT inside the restricted sandbox before assertions; external execution approval was unavailable."
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
        "evidence": [
          "arckit/interaction/automation-workspace/interaction.md",
          "arckit/tech/arcorbit/desktop-execution-solution.md"
        ]
      },
      "invariant_assessment": {
        "project_revision": 301,
        "judgments": [
          {
            "invariant_ref": "product-expectations-remain-recoverable",
            "disposition": "upheld",
            "reason": "Durable interaction sources preserve the external wait and continuation outcome.",
            "fact_refs": [
              "FACT-20260827-001-002"
            ],
            "evidence": [
              "arckit/interaction/automation-workspace/interaction.md",
              "arckit/interaction/automation-workspace/default.html"
            ],
            "gap_refs": []
          },
          {
            "invariant_ref": "interaction-expectations-remain-recoverable",
            "disposition": "upheld",
            "reason": "The final projection distinguishes external wait, recovery and human responsibility and provides the bounded resume action.",
            "fact_refs": [
              "FACT-20260827-001-002"
            ],
            "evidence": [
              "arckit/interaction/automation-workspace/interaction.md",
              "runtime/arcorbit/desktop/renderer/renderer.js"
            ],
            "gap_refs": []
          },
          {
            "invariant_ref": "visual-language-remains-consistent",
            "disposition": "not_relevant",
            "reason": "Existing visual primitives are reused without changing visual rules.",
            "fact_refs": [],
            "evidence": [],
            "gap_refs": []
          },
          {
            "invariant_ref": "technical-decisions-remain-explainable",
            "disposition": "upheld",
            "reason": "Persisted state, reconciliation, process ownership and typed resume boundaries remain explicit and traceable.",
            "fact_refs": [
              "FACT-20260827-001-002"
            ],
            "evidence": [
              "arckit/tech/arcorbit/desktop-execution-solution.md",
              "runtime/arcorbit/src/automation-coordinator.mjs"
            ],
            "gap_refs": []
          },
          {
            "invariant_ref": "accepted-facts-are-realized",
            "disposition": "upheld",
            "reason": "Production code and tests realize external_wait in every required execution path.",
            "fact_refs": [
              "FACT-20260827-001-001",
              "FACT-20260827-001-002"
            ],
            "evidence": [
              "runtime/arcorbit/src/automation-coordinator.mjs",
              "runtime/arcorbit/desktop/renderer/renderer.js",
              "runtime/arcorbit/test/automation-coordinator.test.mjs"
            ],
            "gap_refs": []
          },
          {
            "invariant_ref": "material-risks-have-credible-evidence",
            "disposition": "upheld",
            "reason": "Relevant behavior tests and the broad non-GUI suite cover the material state, identity and regression risks.",
            "fact_refs": [
              "FACT-20260827-001-002"
            ],
            "evidence": [
              "runtime/arcorbit/test/automation-coordinator.test.mjs",
              "runtime/arcorbit/test/desktop-renderer.test.mjs",
              "runtime/arcorbit/test/case-transition.test.mjs",
              "Verification: 156 focused tests passed, 0 failed",
              "Verification: non-GUI ArcOrbit suite 527 tests; 508 passed, 19 skipped, 0 failed"
            ],
            "gap_refs": []
          }
        ]
      },
      "evidence": [
        "runtime/arcorbit/src/automation-coordinator.mjs",
        "runtime/arcorbit/src/desktop/desktop-store.mjs",
        "runtime/arcorbit/desktop/main.mjs",
        "runtime/arcorbit/desktop/preload.cjs",
        "runtime/arcorbit/desktop/renderer/renderer.js",
        "runtime/arcorbit/src/agent-orchestrator.mjs",
        "entry/skills/arckit-development-ledger/scripts/development-case.mjs",
        "arckit/interaction/automation-workspace/interaction.md",
        "arckit/tech/arcorbit/desktop-execution-solution.md",
        "runtime/arcorbit/test/automation-coordinator.test.mjs",
        "runtime/arcorbit/test/desktop-renderer.test.mjs",
        "runtime/arcorbit/test/case-transition.test.mjs",
        "Verification: 156 focused tests passed, 0 failed",
        "Verification: non-GUI ArcOrbit suite 527 tests; 508 passed, 19 skipped, 0 failed"
      ],
      "runtime_result_ref": "",
      "occurred_at": "2026-08-27T03:56:07.634Z"
    }
  ],
  "case_resolution": {
    "status": "resolved",
    "stage": "resolved",
    "satisfied": [
      "GAP-20260827-001-001"
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
    "updated_at": "2026-08-27T03:56:07.634Z"
  }
}
```

## Round Notes

- Case history is canonical in Structured Record.rounds; keep prose notes exceptional.
