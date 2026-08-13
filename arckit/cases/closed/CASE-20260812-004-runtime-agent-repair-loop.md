# 让可修正的 Runtime 校验拒绝进入 Agent repair loop

Case: CASE-20260812-004
Status: closed
Artifact Type: mixed
Selected Gap: none
Updated: 2026-08-12T17:37:16.107Z

## User Intent

优化 arckit-runtime：保留 trusted Ledger 严格 fail-closed，同时把可修正的 Runtime result 或 Case transition 校验错误作为结构化反馈交回同一持久 Agent thread 定向修正，避免盲重试后阻塞用户。

## Structured Record

```json
{
  "schema_version": "development-case-record/v5",
  "id": "CASE-20260812-004",
  "title": "让可修正的 Runtime 校验拒绝进入 Agent repair loop",
  "status": "closed",
  "artifact_type": "mixed",
  "created_at": "2026-08-12T17:22:08.650Z",
  "updated_at": "2026-08-12T17:37:16.107Z",
  "user_intent": "优化 arckit-runtime：保留 trusted Ledger 严格 fail-closed，同时把可修正的 Runtime result 或 Case transition 校验错误作为结构化反馈交回同一持久 Agent thread 定向修正，避免盲重试后阻塞用户。",
  "expected_outcome": "可修正校验拒绝不会写入 canonical state，也不会立即失败；Runtime fresh-read 后向同一 Agent 提供精确 issue、失败 claim 和修正边界，使用独立 repair budget 重试，只有预算耗尽或不可修正错误才进入 Recovery Center。",
  "project_state_ref": "arckit/project/state.record.json",
  "current_round": {
    "goal": "",
    "selected_gap": null
  },
  "facts": [
    {
      "id": "FACT-RUNTIME-REPAIR-LOOP-MISSING",
      "revision": 1,
      "status": "superseded",
      "statement": "当前 Runtime 对 recoverable Ledger rejection 会在同一 thread 继续，但下一轮 current_instruction 仅使用原 handoff.next_prompt，不包含 rejection reason；Runtime result validation 失败则立即以 invalid_result 停止，且协议修正与普通 no-progress 共用计数。",
      "basis": "state-driven runner 的 continuation、nextTask 赋值、invalid_result 分支和 effectiveNoProgressLimit 能完整解释用户看到的盲重试与快速阻塞。",
      "evidence": [
        "runtime/arckit-runtime/src/state-driven-runner.mjs",
        "runtime/arckit-runtime/src/gate-engine.mjs",
        "runtime/arckit-runtime/schemas/agent-loop-result.schema.json",
        "entry/skills/arckit-development-ledger/scripts/case-transition.mjs"
      ]
    },
    {
      "id": "FACT-RUNTIME-AGENT-REPAIR-LOOP-IMPLEMENTED",
      "revision": 1,
      "status": "accepted",
      "statement": "Arckit Runtime keeps trusted validation fail-closed while routing correctable Runtime-result and Ledger-claim rejections back to the same persistent Agent thread with exact structured issues, rejected output, fresh canonical context, and an independent bounded repair budget; exhaustion or nonrecoverable rejection stops without canonical write or Git closeout.",
      "basis": "The state-driven runner, rejection adapters, structured-output schema, Desktop projection, Coordinator recovery priority, product/interaction/technical contracts, and automated regression suite agree on this behavior.",
      "evidence": [
        "runtime/arckit-runtime/src/state-driven-runner.mjs",
        "runtime/arckit-runtime/src/ledger-writer.mjs",
        "entry/skills/arckit-development-ledger/scripts/runtime-writeback.mjs",
        "runtime/arckit-runtime/schemas/agent-loop-result.schema.json",
        "runtime/arckit-runtime/src/projection/run-event-projector.mjs",
        "runtime/arckit-runtime/test/state-driven-runner.test.mjs",
        "runtime/arckit-runtime/test/ledger-writer.test.mjs",
        "runtime/arckit-runtime/test/desktop-run-manager.test.mjs",
        "runtime/arckit-runtime/test/automation-coordinator.test.mjs",
        "runtime/arckit-runtime/test/codex-output-schema.test.mjs",
        "runtime/arckit-runtime/test/token-usage-projector.test.mjs",
        "runtime/arckit-runtime: npm run check (144 tests; 143 passed, 1 skipped, 0 failed)",
        "runtime/arckit-runtime: targeted repair regression suite (54 passed, 0 failed)"
      ]
    }
  ],
  "state_impacts": [],
  "gaps": [
    {
      "id": "GAP-001",
      "status": "resolved",
      "goal": "实现可修正 validation/ledger rejection 的同-thread 定向 Agent repair loop：结构化反馈精确 issues、fresh-state 约束与原 claim，使用独立有限 repair budget；成功修正后正常写回，预算耗尽或不可修正才停止。",
      "reason": "现有 Runtime 只知道 rejection recoverable，却没有把拒绝原因变成下一 Agent turn 的修正指令，也没有把协议修正尝试与业务 no-progress 分离。",
      "derived_from": [
        "FACT-RUNTIME-REPAIR-LOOP-MISSING"
      ],
      "blocked_by": [],
      "priority_basis": {
        "blocking": "直接导致自动化待办因可修正表单错误进入 Recovery Center。",
        "uncertainty": "low",
        "risk": "high",
        "user_impact": "high"
      },
      "responsibility": "agent",
      "evidence_required": [
        "Runtime result validation issue 可进入同-thread repair turn",
        "Ledger rejection reason 被注入 repair instruction",
        "repair 使用独立预算且不重复业务实现",
        "stale/fresh state 与不可修正错误保持 fail-closed",
        "成功修正、预算耗尽和正常成功路径自动化测试"
      ],
      "resolution": {
        "id": "GAP-001",
        "status": "resolved",
        "outcome": "Runtime now preconstrains invariant judgment combinations and routes correctable validation/Ledger rejections into a visible same-thread Agent repair loop with exact issues, rejected output, fresh-state instructions, and an independent default budget of two attempts.",
        "reason": "Implementation, Desktop projection, recovery messaging, durable docs, and automated success/exhaustion/nonrecoverable tests jointly satisfy every evidence requirement.",
        "evidence": [
          "runtime/arckit-runtime/src/state-driven-runner.mjs",
          "runtime/arckit-runtime/src/ledger-writer.mjs",
          "entry/skills/arckit-development-ledger/scripts/runtime-writeback.mjs",
          "runtime/arckit-runtime/schemas/agent-loop-result.schema.json",
          "runtime/arckit-runtime/src/projection/run-event-projector.mjs",
          "runtime/arckit-runtime/test/state-driven-runner.test.mjs",
          "runtime/arckit-runtime/test/ledger-writer.test.mjs",
          "runtime/arckit-runtime/test/desktop-run-manager.test.mjs",
          "runtime/arckit-runtime/test/automation-coordinator.test.mjs",
          "runtime/arckit-runtime/test/codex-output-schema.test.mjs",
          "runtime/arckit-runtime/test/token-usage-projector.test.mjs",
          "runtime/arckit-runtime: npm run check (144 tests; 143 passed, 1 skipped, 0 failed)",
          "runtime/arckit-runtime: targeted repair regression suite (54 passed, 0 failed)"
        ],
        "occurred_at": "2026-08-12T17:36:05.518Z"
      }
    }
  ],
  "content_revision": 1,
  "completion_review": {
    "status": "clean",
    "policy": {
      "initial_max_cycles": 2,
      "source": "Project quality decision and user-authorized Runtime resilience optimization",
      "snapshotted_at": "2026-08-12T17:22:08.650Z"
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
          "runtime/arckit-runtime/src/state-driven-runner.mjs",
          "runtime/arckit-runtime/src/ledger-writer.mjs",
          "entry/skills/arckit-development-ledger/scripts/runtime-writeback.mjs",
          "runtime/arckit-runtime/schemas/agent-loop-result.schema.json",
          "runtime/arckit-runtime/src/desktop-run-manager.mjs",
          "runtime/arckit-runtime/src/automation-coordinator.mjs",
          "runtime/arckit-runtime/src/projection/run-event-projector.mjs",
          "runtime/arckit-runtime/test/state-driven-runner.test.mjs",
          "runtime/arckit-runtime/test/ledger-writer.test.mjs",
          "runtime/arckit-runtime/test/desktop-run-manager.test.mjs",
          "runtime/arckit-runtime/test/automation-coordinator.test.mjs",
          "runtime/arckit-runtime/test/codex-output-schema.test.mjs",
          "runtime/arckit-runtime/test/token-usage-projector.test.mjs",
          "runtime/arckit-runtime: npm run check (144 tests; 143 passed, 1 skipped, 0 failed)",
          "runtime/arckit-runtime: targeted repair regression suite (54 passed, 0 failed)",
          "git diff --check",
          "arckit/spec/agentic-software-development/runtime-automation-workspace.md",
          "arckit/interaction/automation-workspace/interaction.md",
          "arckit/tech/arckit-runtime/desktop-execution-solution.md"
        ],
        "occurred_at": "2026-08-12T17:37:16.107Z"
      }
    ],
    "evidence": [
      "runtime/arckit-runtime/src/state-driven-runner.mjs",
      "runtime/arckit-runtime/src/ledger-writer.mjs",
      "entry/skills/arckit-development-ledger/scripts/runtime-writeback.mjs",
      "runtime/arckit-runtime/schemas/agent-loop-result.schema.json",
      "runtime/arckit-runtime/src/desktop-run-manager.mjs",
      "runtime/arckit-runtime/src/automation-coordinator.mjs",
      "runtime/arckit-runtime/src/projection/run-event-projector.mjs",
      "runtime/arckit-runtime/test/state-driven-runner.test.mjs",
      "runtime/arckit-runtime/test/ledger-writer.test.mjs",
      "runtime/arckit-runtime/test/desktop-run-manager.test.mjs",
      "runtime/arckit-runtime/test/automation-coordinator.test.mjs",
      "runtime/arckit-runtime/test/codex-output-schema.test.mjs",
      "runtime/arckit-runtime/test/token-usage-projector.test.mjs",
      "runtime/arckit-runtime: npm run check (144 tests; 143 passed, 1 skipped, 0 failed)",
      "runtime/arckit-runtime: targeted repair regression suite (54 passed, 0 failed)",
      "git diff --check",
      "arckit/spec/agentic-software-development/runtime-automation-workspace.md",
      "arckit/interaction/automation-workspace/interaction.md",
      "arckit/tech/arckit-runtime/desktop-execution-solution.md"
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
      "goal": "实现可修正 validation/ledger rejection 的同-thread 定向 Agent repair loop：结构化反馈精确 issues、fresh-state 约束与原 claim，使用独立有限 repair budget；成功修正后正常写回，预算耗尽或不可修正才停止。",
      "outcome": "completed",
      "gap_selection": {
        "mode": "candidate",
        "basis": "GAP-001 directly addresses the user-visible blocker: correctable Runtime validation and Ledger claim errors currently stop automation instead of receiving targeted same-thread correction.",
        "snapshot_token": "7348476855a3f0dad37d3e792c5f6a5311fed1d6146fc18ccb700635788c272e",
        "selected_ref": "case-gap:CASE-20260812-004:GAP-001",
        "comparison_summary": "Compared the active Case gap with all five Project gaps. GAP-001 is the only ready Case-scoped obligation and has immediate blocking, risk, and user-impact evidence; broader Project gaps remain deferred to their own Cases.",
        "fresh_discovery_summary": "Implementation and review found no additional independent Case gap; the repair-message identity issue was corrected within the same acceptance claim.",
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
            "reason": "Deferred because it is a broader Project obligation requiring a separate Case and is not necessary to accept this repair-loop result."
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
            "reason": "Deferred because it is a broader Project obligation requiring a separate Case and is not necessary to accept this repair-loop result."
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
            "reason": "Deferred because it is a broader Project obligation requiring a separate Case and is not necessary to accept this repair-loop result."
          },
          {
            "ref": "project-gap:GAP-delivery-governance",
            "source": "persisted",
            "eligibility": "case_required",
            "disposition": "deferred",
            "priority_basis": {
              "risk": "medium",
              "urgency": "medium"
            },
            "reason": "Deferred because it is a broader Project obligation requiring a separate Case and is not necessary to accept this repair-loop result."
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
            "reason": "Deferred because it is a broader Project obligation requiring a separate Case and is not necessary to accept this repair-loop result."
          },
          {
            "ref": "case-gap:CASE-20260812-004:GAP-001",
            "source": "persisted",
            "eligibility": "ready",
            "disposition": "selected",
            "priority_basis": {
              "blocking": "直接导致自动化待办因可修正表单错误进入 Recovery Center。",
              "uncertainty": "low",
              "risk": "high",
              "user_impact": "high"
            },
            "reason": "Selected because it is the active Case obligation and directly removes the current Runtime blocker."
          }
        ]
      },
      "selected_gap": {
        "id": "GAP-001",
        "responsibility": "agent",
        "goal": "实现可修正 validation/ledger rejection 的同-thread 定向 Agent repair loop：结构化反馈精确 issues、fresh-state 约束与原 claim，使用独立有限 repair budget；成功修正后正常写回，预算耗尽或不可修正才停止。",
        "reason": "现有 Runtime 只知道 rejection recoverable，却没有把拒绝原因变成下一 Agent turn 的修正指令，也没有把协议修正尝试与业务 no-progress 分离。",
        "derived_from": [
          "FACT-RUNTIME-REPAIR-LOOP-MISSING"
        ],
        "blocked_by": [],
        "priority_basis": {
          "blocking": "直接导致自动化待办因可修正表单错误进入 Recovery Center。",
          "uncertainty": "low",
          "risk": "high",
          "user_impact": "high"
        },
        "evidence_required": [
          "Runtime result validation issue 可进入同-thread repair turn",
          "Ledger rejection reason 被注入 repair instruction",
          "repair 使用独立预算且不重复业务实现",
          "stale/fresh state 与不可修正错误保持 fail-closed",
          "成功修正、预算耗尽和正常成功路径自动化测试"
        ]
      },
      "planned_transition": {
        "goal": "实现可修正 validation/ledger rejection 的同-thread 定向 Agent repair loop：结构化反馈精确 issues、fresh-state 约束与原 claim，使用独立有限 repair budget；成功修正后正常写回，预算耗尽或不可修正才停止。",
        "expected_state_change": "Correctable validation and trusted Ledger claim rejections receive exact structured feedback in the same persistent Agent thread under an independent bounded repair budget; accepted writes and fail-closed boundaries remain authoritative."
      },
      "accepted_state_delta": {
        "resolved_gap": {
          "id": "GAP-001",
          "status": "resolved",
          "outcome": "Runtime now preconstrains invariant judgment combinations and routes correctable validation/Ledger rejections into a visible same-thread Agent repair loop with exact issues, rejected output, fresh-state instructions, and an independent default budget of two attempts.",
          "reason": "Implementation, Desktop projection, recovery messaging, durable docs, and automated success/exhaustion/nonrecoverable tests jointly satisfy every evidence requirement.",
          "evidence": [
            "runtime/arckit-runtime/src/state-driven-runner.mjs",
            "runtime/arckit-runtime/src/ledger-writer.mjs",
            "entry/skills/arckit-development-ledger/scripts/runtime-writeback.mjs",
            "runtime/arckit-runtime/schemas/agent-loop-result.schema.json",
            "runtime/arckit-runtime/src/projection/run-event-projector.mjs",
            "runtime/arckit-runtime/test/state-driven-runner.test.mjs",
            "runtime/arckit-runtime/test/ledger-writer.test.mjs",
            "runtime/arckit-runtime/test/desktop-run-manager.test.mjs",
            "runtime/arckit-runtime/test/automation-coordinator.test.mjs",
            "runtime/arckit-runtime/test/codex-output-schema.test.mjs",
            "runtime/arckit-runtime/test/token-usage-projector.test.mjs",
            "runtime/arckit-runtime: npm run check (144 tests; 143 passed, 1 skipped, 0 failed)",
            "runtime/arckit-runtime: targeted repair regression suite (54 passed, 0 failed)"
          ]
        },
        "facts_added": [
          {
            "id": "FACT-RUNTIME-AGENT-REPAIR-LOOP-IMPLEMENTED",
            "revision": 1,
            "status": "accepted",
            "statement": "Arckit Runtime keeps trusted validation fail-closed while routing correctable Runtime-result and Ledger-claim rejections back to the same persistent Agent thread with exact structured issues, rejected output, fresh canonical context, and an independent bounded repair budget; exhaustion or nonrecoverable rejection stops without canonical write or Git closeout.",
            "basis": "The state-driven runner, rejection adapters, structured-output schema, Desktop projection, Coordinator recovery priority, product/interaction/technical contracts, and automated regression suite agree on this behavior.",
            "evidence": [
              "runtime/arckit-runtime/src/state-driven-runner.mjs",
              "runtime/arckit-runtime/src/ledger-writer.mjs",
              "entry/skills/arckit-development-ledger/scripts/runtime-writeback.mjs",
              "runtime/arckit-runtime/schemas/agent-loop-result.schema.json",
              "runtime/arckit-runtime/src/projection/run-event-projector.mjs",
              "runtime/arckit-runtime/test/state-driven-runner.test.mjs",
              "runtime/arckit-runtime/test/ledger-writer.test.mjs",
              "runtime/arckit-runtime/test/desktop-run-manager.test.mjs",
              "runtime/arckit-runtime/test/automation-coordinator.test.mjs",
              "runtime/arckit-runtime/test/codex-output-schema.test.mjs",
              "runtime/arckit-runtime/test/token-usage-projector.test.mjs",
              "runtime/arckit-runtime: npm run check (144 tests; 143 passed, 1 skipped, 0 failed)",
              "runtime/arckit-runtime: targeted repair regression suite (54 passed, 0 failed)"
            ]
          }
        ],
        "facts_superseded": [
          {
            "id": "FACT-RUNTIME-REPAIR-LOOP-MISSING",
            "revision": 1,
            "reason": "The missing targeted repair behavior has now been implemented and verified.",
            "evidence": [
              "runtime/arckit-runtime/src/state-driven-runner.mjs",
              "runtime/arckit-runtime/src/ledger-writer.mjs",
              "entry/skills/arckit-development-ledger/scripts/runtime-writeback.mjs",
              "runtime/arckit-runtime/schemas/agent-loop-result.schema.json",
              "runtime/arckit-runtime/src/projection/run-event-projector.mjs",
              "runtime/arckit-runtime/test/state-driven-runner.test.mjs",
              "runtime/arckit-runtime/test/ledger-writer.test.mjs",
              "runtime/arckit-runtime/test/desktop-run-manager.test.mjs",
              "runtime/arckit-runtime/test/automation-coordinator.test.mjs",
              "runtime/arckit-runtime/test/codex-output-schema.test.mjs",
              "runtime/arckit-runtime/test/token-usage-projector.test.mjs",
              "runtime/arckit-runtime: npm run check (144 tests; 143 passed, 1 skipped, 0 failed)",
              "runtime/arckit-runtime: targeted repair regression suite (54 passed, 0 failed)"
            ]
          }
        ],
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
        "project_revision": 37,
        "judgments": [
          {
            "invariant_ref": "product-expectations-remain-recoverable",
            "disposition": "upheld",
            "reason": "The durable Runtime product contract now distinguishes productive turns, bounded claim repair, accepted writeback, and terminal recovery.",
            "fact_refs": [
              "FACT-RUNTIME-AGENT-REPAIR-LOOP-IMPLEMENTED"
            ],
            "evidence": [
              "arckit/spec/agentic-software-development/runtime-automation-workspace.md"
            ],
            "gap_refs": []
          },
          {
            "invariant_ref": "interaction-expectations-remain-recoverable",
            "disposition": "upheld",
            "reason": "The automation interaction contract specifies visible Agent repair progress and exact final recovery reasons.",
            "fact_refs": [
              "FACT-RUNTIME-AGENT-REPAIR-LOOP-IMPLEMENTED"
            ],
            "evidence": [
              "arckit/interaction/automation-workspace/interaction.md",
              "runtime/arckit-runtime/src/projection/run-event-projector.mjs"
            ],
            "gap_refs": []
          },
          {
            "invariant_ref": "visual-language-remains-consistent",
            "disposition": "not_relevant",
            "reason": "This change adds runtime state and message semantics but establishes no durable visual-language, theme, token, or presentation-style rule.",
            "fact_refs": [],
            "evidence": [],
            "gap_refs": []
          },
          {
            "invariant_ref": "technical-decisions-remain-explainable",
            "disposition": "upheld",
            "reason": "The technical contract and implementation explain schema preconstraints, structured rejection transport, same-thread repair, independent budgeting, and fail-closed termination.",
            "fact_refs": [
              "FACT-RUNTIME-AGENT-REPAIR-LOOP-IMPLEMENTED"
            ],
            "evidence": [
              "arckit/tech/arckit-runtime/desktop-execution-solution.md",
              "runtime/arckit-runtime/src/state-driven-runner.mjs",
              "runtime/arckit-runtime/src/ledger-writer.mjs"
            ],
            "gap_refs": []
          },
          {
            "invariant_ref": "accepted-facts-are-realized",
            "disposition": "upheld",
            "reason": "The accepted behavior is directly realized across runner, schema, ledger rejection, Desktop projection, and Coordinator recovery code.",
            "fact_refs": [
              "FACT-RUNTIME-AGENT-REPAIR-LOOP-IMPLEMENTED"
            ],
            "evidence": [
              "runtime/arckit-runtime/src/state-driven-runner.mjs",
              "runtime/arckit-runtime/schemas/agent-loop-result.schema.json",
              "runtime/arckit-runtime/src/desktop-run-manager.mjs",
              "runtime/arckit-runtime/src/automation-coordinator.mjs"
            ],
            "gap_refs": []
          },
          {
            "invariant_ref": "material-risks-have-credible-evidence",
            "disposition": "upheld",
            "reason": "Repeatable tests cover successful validation repair, successful Ledger repair, independent budget semantics, exhaustion without closeout, nonrecoverable fail-closed behavior, Desktop error precedence, Coordinator recovery, and repair projection.",
            "fact_refs": [
              "FACT-RUNTIME-AGENT-REPAIR-LOOP-IMPLEMENTED"
            ],
            "evidence": [
              "runtime/arckit-runtime/test/state-driven-runner.test.mjs",
              "runtime/arckit-runtime/test/ledger-writer.test.mjs",
              "runtime/arckit-runtime/test/desktop-run-manager.test.mjs",
              "runtime/arckit-runtime/test/automation-coordinator.test.mjs",
              "runtime/arckit-runtime/test/codex-output-schema.test.mjs",
              "runtime/arckit-runtime/test/token-usage-projector.test.mjs",
              "runtime/arckit-runtime: npm run check (144 tests; 143 passed, 1 skipped, 0 failed)",
              "runtime/arckit-runtime: targeted repair regression suite (54 passed, 0 failed)"
            ],
            "gap_refs": []
          }
        ]
      },
      "evidence": [
        "runtime/arckit-runtime/src/state-driven-runner.mjs",
        "runtime/arckit-runtime/src/ledger-writer.mjs",
        "entry/skills/arckit-development-ledger/scripts/runtime-writeback.mjs",
        "runtime/arckit-runtime/schemas/agent-loop-result.schema.json",
        "runtime/arckit-runtime/src/projection/run-event-projector.mjs",
        "runtime/arckit-runtime/test/state-driven-runner.test.mjs",
        "runtime/arckit-runtime/test/ledger-writer.test.mjs",
        "runtime/arckit-runtime/test/desktop-run-manager.test.mjs",
        "runtime/arckit-runtime/test/automation-coordinator.test.mjs",
        "runtime/arckit-runtime/test/codex-output-schema.test.mjs",
        "runtime/arckit-runtime/test/token-usage-projector.test.mjs",
        "runtime/arckit-runtime: npm run check (144 tests; 143 passed, 1 skipped, 0 failed)",
        "runtime/arckit-runtime: targeted repair regression suite (54 passed, 0 failed)"
      ],
      "runtime_result_ref": "",
      "occurred_at": "2026-08-12T17:36:05.518Z"
    },
    {
      "round": 2,
      "transition_schema_version": "arckit-case-transition/v8",
      "goal": "Review the completed implementation for correctness, real problem resolution, verification credibility, regression risk, and minimality.",
      "outcome": "completed",
      "gap_selection": {
        "mode": "candidate",
        "basis": "All ordinary Case obligations are closed, so the derived Completion Review is the only ready Case-scoped candidate and is required before resolution.",
        "snapshot_token": "f2689c8e5dfbfce6cc002e1b936b1e2814e6aa325af6230bc69806c1972b7635",
        "selected_ref": "case-gap:CASE-20260812-004:CASE-20260812-004:completion-review:1",
        "comparison_summary": "Compared the derived Completion Review with all five Project gaps. The review is the only ready obligation in this Case; Project gaps remain deferred to separately authorized Cases.",
        "fresh_discovery_summary": "Independent diff review found and corrected one message-identity collision before this review; the final reviewed content has no remaining finding or fresh ordinary gap.",
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
            "reason": "Deferred because this Project-level obligation requires a separate Case and is outside the completed repair-loop review."
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
            "reason": "Deferred because this Project-level obligation requires a separate Case and is outside the completed repair-loop review."
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
            "reason": "Deferred because this Project-level obligation requires a separate Case and is outside the completed repair-loop review."
          },
          {
            "ref": "project-gap:GAP-delivery-governance",
            "source": "persisted",
            "eligibility": "case_required",
            "disposition": "deferred",
            "priority_basis": {
              "risk": "medium",
              "urgency": "medium"
            },
            "reason": "Deferred because this Project-level obligation requires a separate Case and is outside the completed repair-loop review."
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
            "reason": "Deferred because this Project-level obligation requires a separate Case and is outside the completed repair-loop review."
          },
          {
            "ref": "case-gap:CASE-20260812-004:CASE-20260812-004:completion-review:1",
            "source": "persisted",
            "eligibility": "ready",
            "disposition": "selected",
            "priority_basis": {
              "blocking": "high",
              "uncertainty": "low",
              "risk": "high",
              "user_impact": "high"
            },
            "reason": "Selected because completion review is the sole ready Case obligation after all implementation gaps closed."
          }
        ]
      },
      "selected_gap": {
        "id": "CASE-20260812-004:completion-review:1",
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
        "expected_state_change": "Record a clean evidence-backed review across implementation correctness, problem resolution, verification credibility, regression risk, and minimality, then close the Case."
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
            "runtime/arckit-runtime/src/state-driven-runner.mjs",
            "runtime/arckit-runtime/src/ledger-writer.mjs",
            "entry/skills/arckit-development-ledger/scripts/runtime-writeback.mjs",
            "runtime/arckit-runtime/schemas/agent-loop-result.schema.json",
            "runtime/arckit-runtime/src/desktop-run-manager.mjs",
            "runtime/arckit-runtime/src/automation-coordinator.mjs",
            "runtime/arckit-runtime/src/projection/run-event-projector.mjs",
            "runtime/arckit-runtime/test/state-driven-runner.test.mjs",
            "runtime/arckit-runtime/test/ledger-writer.test.mjs",
            "runtime/arckit-runtime/test/desktop-run-manager.test.mjs",
            "runtime/arckit-runtime/test/automation-coordinator.test.mjs",
            "runtime/arckit-runtime/test/codex-output-schema.test.mjs",
            "runtime/arckit-runtime/test/token-usage-projector.test.mjs",
            "runtime/arckit-runtime: npm run check (144 tests; 143 passed, 1 skipped, 0 failed)",
            "runtime/arckit-runtime: targeted repair regression suite (54 passed, 0 failed)",
            "git diff --check",
            "arckit/spec/agentic-software-development/runtime-automation-workspace.md",
            "arckit/interaction/automation-workspace/interaction.md",
            "arckit/tech/arckit-runtime/desktop-execution-solution.md"
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
        "project_revision": 37,
        "judgments": [
          {
            "invariant_ref": "product-expectations-remain-recoverable",
            "disposition": "upheld",
            "reason": "The reviewed product contract durably distinguishes productive execution, bounded repair, accepted completion, and terminal recovery.",
            "fact_refs": [
              "FACT-RUNTIME-AGENT-REPAIR-LOOP-IMPLEMENTED"
            ],
            "evidence": [
              "arckit/spec/agentic-software-development/runtime-automation-workspace.md"
            ],
            "gap_refs": []
          },
          {
            "invariant_ref": "interaction-expectations-remain-recoverable",
            "disposition": "upheld",
            "reason": "The reviewed interaction behavior exposes repair progress without reporting an unaccepted completion.",
            "fact_refs": [
              "FACT-RUNTIME-AGENT-REPAIR-LOOP-IMPLEMENTED"
            ],
            "evidence": [
              "arckit/interaction/automation-workspace/interaction.md",
              "runtime/arckit-runtime/src/projection/run-event-projector.mjs"
            ],
            "gap_refs": []
          },
          {
            "invariant_ref": "visual-language-remains-consistent",
            "disposition": "not_relevant",
            "reason": "The reviewed change does not establish or alter a visual-language rule.",
            "fact_refs": [],
            "evidence": [],
            "gap_refs": []
          },
          {
            "invariant_ref": "technical-decisions-remain-explainable",
            "disposition": "upheld",
            "reason": "The reviewed implementation and technical contract preserve one Agent thread, trusted state authority, bounded recovery, and fail-closed termination.",
            "fact_refs": [
              "FACT-RUNTIME-AGENT-REPAIR-LOOP-IMPLEMENTED"
            ],
            "evidence": [
              "arckit/tech/arckit-runtime/desktop-execution-solution.md",
              "runtime/arckit-runtime/src/state-driven-runner.mjs",
              "runtime/arckit-runtime/src/ledger-writer.mjs"
            ],
            "gap_refs": []
          },
          {
            "invariant_ref": "accepted-facts-are-realized",
            "disposition": "upheld",
            "reason": "The reviewed source realizes the accepted repair-loop fact without weakening canonical-write acceptance or Git closeout gates.",
            "fact_refs": [
              "FACT-RUNTIME-AGENT-REPAIR-LOOP-IMPLEMENTED"
            ],
            "evidence": [
              "runtime/arckit-runtime/src/state-driven-runner.mjs",
              "runtime/arckit-runtime/src/desktop-run-manager.mjs",
              "runtime/arckit-runtime/src/automation-coordinator.mjs"
            ],
            "gap_refs": []
          },
          {
            "invariant_ref": "material-risks-have-credible-evidence",
            "disposition": "upheld",
            "reason": "The final full and targeted suites repeatably cover schema prevention, same-thread recovery, independent budgets, fail-closed exhaustion, closeout suppression, error projection, and recovery messaging.",
            "fact_refs": [
              "FACT-RUNTIME-AGENT-REPAIR-LOOP-IMPLEMENTED"
            ],
            "evidence": [
              "runtime/arckit-runtime/test/state-driven-runner.test.mjs",
              "runtime/arckit-runtime/test/ledger-writer.test.mjs",
              "runtime/arckit-runtime/test/desktop-run-manager.test.mjs",
              "runtime/arckit-runtime/test/automation-coordinator.test.mjs",
              "runtime/arckit-runtime/test/codex-output-schema.test.mjs",
              "runtime/arckit-runtime/test/token-usage-projector.test.mjs",
              "runtime/arckit-runtime: npm run check (144 tests; 143 passed, 1 skipped, 0 failed)",
              "runtime/arckit-runtime: targeted repair regression suite (54 passed, 0 failed)",
              "git diff --check"
            ],
            "gap_refs": []
          }
        ]
      },
      "evidence": [
        "runtime/arckit-runtime/src/state-driven-runner.mjs",
        "runtime/arckit-runtime/src/ledger-writer.mjs",
        "entry/skills/arckit-development-ledger/scripts/runtime-writeback.mjs",
        "runtime/arckit-runtime/schemas/agent-loop-result.schema.json",
        "runtime/arckit-runtime/src/desktop-run-manager.mjs",
        "runtime/arckit-runtime/src/automation-coordinator.mjs",
        "runtime/arckit-runtime/src/projection/run-event-projector.mjs",
        "runtime/arckit-runtime/test/state-driven-runner.test.mjs",
        "runtime/arckit-runtime/test/ledger-writer.test.mjs",
        "runtime/arckit-runtime/test/desktop-run-manager.test.mjs",
        "runtime/arckit-runtime/test/automation-coordinator.test.mjs",
        "runtime/arckit-runtime/test/codex-output-schema.test.mjs",
        "runtime/arckit-runtime/test/token-usage-projector.test.mjs",
        "runtime/arckit-runtime: npm run check (144 tests; 143 passed, 1 skipped, 0 failed)",
        "runtime/arckit-runtime: targeted repair regression suite (54 passed, 0 failed)",
        "git diff --check",
        "arckit/spec/agentic-software-development/runtime-automation-workspace.md",
        "arckit/interaction/automation-workspace/interaction.md",
        "arckit/tech/arckit-runtime/desktop-execution-solution.md"
      ],
      "runtime_result_ref": "",
      "occurred_at": "2026-08-12T17:37:16.107Z"
    }
  ],
  "case_resolution": {
    "status": "resolved",
    "stage": "resolved",
    "satisfied": [
      "GAP-001"
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
    "updated_at": "2026-08-12T17:37:16.107Z"
  }
}
```

## Round Notes

- Case history is canonical in Structured Record.rounds; keep prose notes exceptional.
