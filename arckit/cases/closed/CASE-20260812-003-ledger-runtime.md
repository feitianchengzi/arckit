# 阻止 Ledger 拒写被误判为 Runtime 完成

Case: CASE-20260812-003
Status: closed
Artifact Type: code
Selected Gap: none
Updated: 2026-08-12T17:03:56.569Z

## User Intent

修复 Runtime 在 Case transition 被 trusted ledger Gate 拒绝时仍进入 completed、执行 Git closeout，并在 Desktop recovery 中显示成功 handoff 文案的问题。

## Structured Record

```json
{
  "schema_version": "development-case-record/v5",
  "id": "CASE-20260812-003",
  "title": "阻止 Ledger 拒写被误判为 Runtime 完成",
  "status": "closed",
  "artifact_type": "code",
  "created_at": "2026-08-12T16:53:06.954Z",
  "updated_at": "2026-08-12T17:03:56.569Z",
  "user_intent": "修复 Runtime 在 Case transition 被 trusted ledger Gate 拒绝时仍进入 completed、执行 Git closeout，并在 Desktop recovery 中显示成功 handoff 文案的问题。",
  "expected_outcome": "任何 writeback_required 的 Round 只有 ledger written=true 才能进入 completed 与 Git closeout；Gate 拒绝会在同一 Agent thread 上进入可恢复续跑，并向 Desktop recovery 展示具体拒绝原因；成功写回路径保持不变。",
  "project_state_ref": "arckit/project/state.record.json",
  "current_round": {
    "goal": "",
    "selected_gap": null
  },
  "facts": [
    {
      "id": "FACT-LEDGER-BLOCK-MISCLASSIFIED",
      "revision": 1,
      "status": "accepted",
      "statement": "RUN-20260812-153642036Z 的 Case transition 被 Gate 拒绝且 ledger written=false，但 state-driven runner 仍返回 completed 并执行 task closeout，Desktop 最终将待办 1070 置为 runtime_incomplete。",
      "basis": "持久 Run activity、纯函数复现与完成边界源码能够完整解释触发条件、时序和最终持久状态。",
      "evidence": [
        "arckit-runtime://runs/RUN-20260812-153642036Z",
        "runtime/arckit-runtime/src/state-driven-runner.mjs",
        "runtime/arckit-runtime/src/automation-coordinator.mjs",
        "runtime/arckit-runtime/src/ledger-writer.mjs"
      ]
    },
    {
      "id": "FACT-LEDGER-REJECTION-RECOVERY-IMPLEMENTED",
      "revision": 1,
      "status": "accepted",
      "statement": "当 Round 要求 Ledger writeback 而 trusted Gate 拒绝或 written=false 时，Runtime 不再进入 completed 或执行 Git closeout，并优先把结构化 rejection/Gate 原因暴露给 Desktop recovery。",
      "basis": "Runtime 源码完成边界、持久产品/交互/技术契约与自动化回归测试共同实现该行为。",
      "evidence": [
        "runtime/arckit-runtime/src/ledger-writer.mjs",
        "runtime/arckit-runtime/src/state-driven-runner.mjs",
        "runtime/arckit-runtime/src/automation-coordinator.mjs",
        "runtime/arckit-runtime/test/ledger-writer.test.mjs",
        "runtime/arckit-runtime/test/state-driven-runner.test.mjs",
        "runtime/arckit-runtime/test/automation-coordinator.test.mjs",
        "arckit/spec/agentic-software-development/runtime-automation-workspace.md",
        "arckit/interaction/automation-workspace/interaction.md",
        "arckit/tech/arckit-runtime/desktop-execution-solution.md"
      ]
    }
  ],
  "state_impacts": [],
  "gaps": [
    {
      "id": "GAP-001",
      "status": "resolved",
      "goal": "使 writeback_required 的被拒 Ledger 写回保持为可恢复未完成状态、禁止 Git closeout，并把具体 Gate rejection 原因传递到 Desktop recovery，同时以自动化测试保护成功写回路径。",
      "reason": "当前 ledger-writer 的 Gate block 结果缺少 runner 可识别的 rejection，continuation 因 done/none 错判 completed，最终 recovery 又退化为成功 handoff 文案。",
      "derived_from": [
        "FACT-LEDGER-BLOCK-MISCLASSIFIED"
      ],
      "blocked_by": [],
      "priority_basis": {
        "blocking": "阻塞真实待办 1070 的可信完成与远端回写。",
        "uncertainty": "根因路径已通过持久运行证据和纯函数复现闭合。",
        "risk": "可能在 canonical Case 未写入时提前提交任务代码并误导操作者。",
        "user_impact": "用户看到成功文案但待办无法继续或完成。"
      },
      "responsibility": "agent",
      "evidence_required": [
        "Gate block 产生结构化可恢复 rejection",
        "writeback_required 且 written=false 时不返回 completed、不执行 closeout",
        "Desktop recovery 显示 Gate rejection 原因",
        "成功写回与正常 closeout 回归测试"
      ],
      "resolution": {
        "id": "GAP-001",
        "status": "resolved",
        "outcome": "Runtime 现在把 required Ledger 拒写保持为可恢复未完成状态，阻止 Git closeout，并将 Gate rejection 原因传递到 Desktop recovery。",
        "reason": "writer、runner 与 coordinator 的完成边界已统一，并由拒写、重试上限、detached reconciliation、幂等恢复和成功路径回归测试覆盖。",
        "evidence": [
          "runtime/arckit-runtime/src/ledger-writer.mjs",
          "runtime/arckit-runtime/src/state-driven-runner.mjs",
          "runtime/arckit-runtime/src/automation-coordinator.mjs",
          "runtime/arckit-runtime/test/ledger-writer.test.mjs",
          "runtime/arckit-runtime/test/state-driven-runner.test.mjs",
          "runtime/arckit-runtime/test/automation-coordinator.test.mjs"
        ],
        "occurred_at": "2026-08-12T17:00:41.319Z"
      }
    },
    {
      "id": "GAP-LIVE-LEDGER-REJECTION-PRECEDENCE",
      "responsibility": "agent",
      "goal": "使 live run.finished 在 required Ledger 未写入时优先进入 runtime_incomplete，不允许未经接受的 human/external handoff 覆盖 Ledger 失败。",
      "reason": "独立 Completion Review 前的 live-path 审查发现 coordinator 在检查 Ledger failure 之前处理 human handoff，与 detached reconciliation 的优先级不一致。",
      "derived_from": [
        "FACT-LEDGER-BLOCK-MISCLASSIFIED",
        "FACT-LEDGER-REJECTION-RECOVERY-IMPLEMENTED"
      ],
      "blocked_by": [],
      "priority_basis": {
        "blocking": "阻止被拒 handoff 绕过可信完成边界。",
        "uncertainty": "low",
        "risk": "high",
        "user_impact": "high"
      },
      "evidence_required": [
        "live run.finished 对 required writeback failure 的优先级测试",
        "human handoff 不覆盖 ledger rejection"
      ],
      "status": "resolved",
      "resolution": {
        "id": "GAP-LIVE-LEDGER-REJECTION-PRECEDENCE",
        "status": "resolved",
        "outcome": "live run.finished 现在与 detached reconciliation 一致，required Ledger 拒写优先于 human handoff 并进入 runtime_incomplete。",
        "reason": "coordinator 分支顺序已修正，并新增 live event 回归测试证明 rejection 原因保留且不会进入 awaiting_human。",
        "evidence": [
          "runtime/arckit-runtime/src/automation-coordinator.mjs",
          "runtime/arckit-runtime/test/automation-coordinator.test.mjs"
        ],
        "occurred_at": "2026-08-12T17:02:44.405Z"
      }
    }
  ],
  "content_revision": 2,
  "completion_review": {
    "status": "clean",
    "policy": {
      "initial_max_cycles": 2,
      "source": "Project quality decision and user-authorized Runtime bug fix",
      "snapshotted_at": "2026-08-12T16:53:06.954Z"
    },
    "additional_cycles_authorized": 0,
    "cycle_count": 1,
    "reviewed_content_revision": 2,
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
        "content_revision": 2,
        "dimensions": {
          "implementation_correctness": "clean",
          "problem_resolution": "clean",
          "verification_credibility": "clean",
          "regression_risk": "clean",
          "minimality": "clean"
        },
        "finding_ids": [],
        "evidence": [
          "runtime/arckit-runtime/src/ledger-writer.mjs",
          "runtime/arckit-runtime/src/state-driven-runner.mjs",
          "runtime/arckit-runtime/src/automation-coordinator.mjs",
          "runtime/arckit-runtime/test/ledger-writer.test.mjs",
          "runtime/arckit-runtime/test/state-driven-runner.test.mjs",
          "runtime/arckit-runtime/test/automation-coordinator.test.mjs",
          "runtime/arckit-runtime/package.json#npm-run-check",
          "arckit/spec/agentic-software-development/runtime-automation-workspace.md",
          "arckit/interaction/automation-workspace/interaction.md",
          "arckit/tech/arckit-runtime/desktop-execution-solution.md"
        ],
        "occurred_at": "2026-08-12T17:03:56.569Z"
      }
    ],
    "evidence": [
      "runtime/arckit-runtime/src/ledger-writer.mjs",
      "runtime/arckit-runtime/src/state-driven-runner.mjs",
      "runtime/arckit-runtime/src/automation-coordinator.mjs",
      "runtime/arckit-runtime/test/ledger-writer.test.mjs",
      "runtime/arckit-runtime/test/state-driven-runner.test.mjs",
      "runtime/arckit-runtime/test/automation-coordinator.test.mjs",
      "runtime/arckit-runtime/package.json#npm-run-check",
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
      "goal": "使 writeback_required 的被拒 Ledger 写回保持为可恢复未完成状态、禁止 Git closeout，并把具体 Gate rejection 原因传递到 Desktop recovery，同时以自动化测试保护成功写回路径。",
      "outcome": "completed",
      "gap_selection": {
        "mode": "candidate",
        "basis": "用户要求修复，且该 gap 是当前 Case 内唯一 ready、直接阻塞可信完成边界的事项。",
        "snapshot_token": "061749ffa2c47752442217a6657daddbaaa322ee180292ce85a801adec4deedb",
        "selected_ref": "case-gap:CASE-20260812-003:GAP-001",
        "comparison_summary": "已比较当前 Project gaps 与 Case gap；Project gaps 需要另建 Case，GAP-001 与当前用户问题和既有证据直接对应。",
        "fresh_discovery_summary": "检查实现、测试和文档后未发现比 GAP-001 更重要的新鲜 Case gap。",
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
            "reason": "该 Project gap 需要独立 Case，不属于本轮已绑定的 Runtime 拒写修复范围。"
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
            "reason": "该 Project gap 需要独立 Case，不属于本轮已绑定的 Runtime 拒写修复范围。"
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
            "reason": "该 Project gap 需要独立 Case，不属于本轮已绑定的 Runtime 拒写修复范围。"
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
            "reason": "该 Project gap 需要独立 Case，不属于本轮已绑定的 Runtime 拒写修复范围。"
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
            "reason": "该 Project gap 需要独立 Case，不属于本轮已绑定的 Runtime 拒写修复范围。"
          },
          {
            "ref": "case-gap:CASE-20260812-003:GAP-001",
            "source": "persisted",
            "eligibility": "ready",
            "disposition": "selected",
            "priority_basis": {
              "blocking": "阻塞真实待办 1070 的可信完成与远端回写。",
              "uncertainty": "根因路径已通过持久运行证据和纯函数复现闭合。",
              "risk": "可能在 canonical Case 未写入时提前提交任务代码并误导操作者。",
              "user_impact": "用户看到成功文案但待办无法继续或完成。"
            },
            "reason": "该 Case gap 直接阻塞用户报告的运行中待办，且根因、实现和验证证据均已闭合。"
          }
        ]
      },
      "selected_gap": {
        "id": "GAP-001",
        "responsibility": "agent",
        "goal": "使 writeback_required 的被拒 Ledger 写回保持为可恢复未完成状态、禁止 Git closeout，并把具体 Gate rejection 原因传递到 Desktop recovery，同时以自动化测试保护成功写回路径。",
        "reason": "当前 ledger-writer 的 Gate block 结果缺少 runner 可识别的 rejection，continuation 因 done/none 错判 completed，最终 recovery 又退化为成功 handoff 文案。",
        "derived_from": [
          "FACT-LEDGER-BLOCK-MISCLASSIFIED"
        ],
        "blocked_by": [],
        "priority_basis": {
          "blocking": "阻塞真实待办 1070 的可信完成与远端回写。",
          "uncertainty": "根因路径已通过持久运行证据和纯函数复现闭合。",
          "risk": "可能在 canonical Case 未写入时提前提交任务代码并误导操作者。",
          "user_impact": "用户看到成功文案但待办无法继续或完成。"
        },
        "evidence_required": [
          "Gate block 产生结构化可恢复 rejection",
          "writeback_required 且 written=false 时不返回 completed、不执行 closeout",
          "Desktop recovery 显示 Gate rejection 原因",
          "成功写回与正常 closeout 回归测试"
        ]
      },
      "planned_transition": {
        "goal": "使 writeback_required 的被拒 Ledger 写回保持为可恢复未完成状态、禁止 Git closeout，并把具体 Gate rejection 原因传递到 Desktop recovery，同时以自动化测试保护成功写回路径。",
        "expected_state_change": "Gate block 返回结构化可恢复 rejection；writeback_required 且未写入时不能 completed 或 Git closeout；Desktop 显示实际拒绝原因并保持恢复项幂等。"
      },
      "accepted_state_delta": {
        "resolved_gap": {
          "id": "GAP-001",
          "status": "resolved",
          "outcome": "Runtime 现在把 required Ledger 拒写保持为可恢复未完成状态，阻止 Git closeout，并将 Gate rejection 原因传递到 Desktop recovery。",
          "reason": "writer、runner 与 coordinator 的完成边界已统一，并由拒写、重试上限、detached reconciliation、幂等恢复和成功路径回归测试覆盖。",
          "evidence": [
            "runtime/arckit-runtime/src/ledger-writer.mjs",
            "runtime/arckit-runtime/src/state-driven-runner.mjs",
            "runtime/arckit-runtime/src/automation-coordinator.mjs",
            "runtime/arckit-runtime/test/ledger-writer.test.mjs",
            "runtime/arckit-runtime/test/state-driven-runner.test.mjs",
            "runtime/arckit-runtime/test/automation-coordinator.test.mjs"
          ]
        },
        "facts_added": [
          {
            "id": "FACT-LEDGER-REJECTION-RECOVERY-IMPLEMENTED",
            "revision": 1,
            "status": "accepted",
            "statement": "当 Round 要求 Ledger writeback 而 trusted Gate 拒绝或 written=false 时，Runtime 不再进入 completed 或执行 Git closeout，并优先把结构化 rejection/Gate 原因暴露给 Desktop recovery。",
            "basis": "Runtime 源码完成边界、持久产品/交互/技术契约与自动化回归测试共同实现该行为。",
            "evidence": [
              "runtime/arckit-runtime/src/ledger-writer.mjs",
              "runtime/arckit-runtime/src/state-driven-runner.mjs",
              "runtime/arckit-runtime/src/automation-coordinator.mjs",
              "runtime/arckit-runtime/test/ledger-writer.test.mjs",
              "runtime/arckit-runtime/test/state-driven-runner.test.mjs",
              "runtime/arckit-runtime/test/automation-coordinator.test.mjs",
              "arckit/spec/agentic-software-development/runtime-automation-workspace.md",
              "arckit/interaction/automation-workspace/interaction.md",
              "arckit/tech/arckit-runtime/desktop-execution-solution.md"
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
        "project_revision": 35,
        "judgments": [
          {
            "invariant_ref": "product-expectations-remain-recoverable",
            "disposition": "upheld",
            "reason": "writeback_required 的完成语义和拒写恢复边界已写入稳定产品规格。",
            "fact_refs": [
              "FACT-LEDGER-BLOCK-MISCLASSIFIED"
            ],
            "evidence": [
              "arckit/spec/agentic-software-development/runtime-automation-workspace.md"
            ],
            "gap_refs": []
          },
          {
            "invariant_ref": "interaction-expectations-remain-recoverable",
            "disposition": "upheld",
            "reason": "Desktop recovery 的错误原因优先级和不可完成状态已写入交互文档。",
            "fact_refs": [
              "FACT-LEDGER-BLOCK-MISCLASSIFIED"
            ],
            "evidence": [
              "arckit/interaction/automation-workspace/interaction.md"
            ],
            "gap_refs": []
          },
          {
            "invariant_ref": "visual-language-remains-consistent",
            "disposition": "not_relevant",
            "reason": "本轮未修改 renderer、样式、布局、组件或任何视觉语言规则。",
            "fact_refs": [],
            "evidence": [],
            "gap_refs": []
          },
          {
            "invariant_ref": "technical-decisions-remain-explainable",
            "disposition": "upheld",
            "reason": "writer rejection、runner continuation 与 coordinator reconciliation 的完成边界已由技术文档和源码共同说明。",
            "fact_refs": [
              "FACT-LEDGER-BLOCK-MISCLASSIFIED"
            ],
            "evidence": [
              "arckit/tech/arckit-runtime/desktop-execution-solution.md",
              "runtime/arckit-runtime/src/ledger-writer.mjs",
              "runtime/arckit-runtime/src/state-driven-runner.mjs",
              "runtime/arckit-runtime/src/automation-coordinator.mjs"
            ],
            "gap_refs": []
          },
          {
            "invariant_ref": "accepted-facts-are-realized",
            "disposition": "upheld",
            "reason": "源码实现了已接受的根因修复，并由各层单元与集成测试直接验证。",
            "fact_refs": [
              "FACT-LEDGER-BLOCK-MISCLASSIFIED"
            ],
            "evidence": [
              "runtime/arckit-runtime/src/ledger-writer.mjs",
              "runtime/arckit-runtime/src/state-driven-runner.mjs",
              "runtime/arckit-runtime/src/automation-coordinator.mjs",
              "runtime/arckit-runtime/test/ledger-writer.test.mjs",
              "runtime/arckit-runtime/test/state-driven-runner.test.mjs",
              "runtime/arckit-runtime/test/automation-coordinator.test.mjs"
            ],
            "gap_refs": []
          },
          {
            "invariant_ref": "material-risks-have-credible-evidence",
            "disposition": "upheld",
            "reason": "拒写误完成、错误 closeout、错误恢复提示、detached 重建重复项及正常成功路径均有可重复自动化证据。",
            "fact_refs": [
              "FACT-LEDGER-BLOCK-MISCLASSIFIED"
            ],
            "evidence": [
              "runtime/arckit-runtime/test/ledger-writer.test.mjs",
              "runtime/arckit-runtime/test/state-driven-runner.test.mjs",
              "runtime/arckit-runtime/test/automation-coordinator.test.mjs"
            ],
            "gap_refs": []
          }
        ]
      },
      "evidence": [
        "runtime/arckit-runtime/src/ledger-writer.mjs",
        "runtime/arckit-runtime/src/state-driven-runner.mjs",
        "runtime/arckit-runtime/src/automation-coordinator.mjs",
        "runtime/arckit-runtime/test/ledger-writer.test.mjs",
        "runtime/arckit-runtime/test/state-driven-runner.test.mjs",
        "runtime/arckit-runtime/test/automation-coordinator.test.mjs",
        "arckit/spec/agentic-software-development/runtime-automation-workspace.md",
        "arckit/interaction/automation-workspace/interaction.md",
        "arckit/tech/arckit-runtime/desktop-execution-solution.md",
        "runtime/arckit-runtime/package.json#npm-run-check"
      ],
      "runtime_result_ref": "",
      "occurred_at": "2026-08-12T17:00:41.319Z"
    },
    {
      "round": 2,
      "transition_schema_version": "arckit-case-transition/v8",
      "goal": "使 live run.finished 在 required Ledger 未写入时优先进入 runtime_incomplete，不允许未经接受的 human/external handoff 覆盖 Ledger 失败。",
      "outcome": "completed",
      "gap_selection": {
        "mode": "fresh",
        "basis": "Completion Review 前的证据审查发现 live completion path 与 detached path 的 Ledger failure 优先级不一致。",
        "snapshot_token": "eff626c80af1a5cf6f7e7aa6bf96a56e561e0a1046a7e05c05ac64dd70399208",
        "selected_ref": "fresh-gap:CASE-20260812-003:GAP-LIVE-LEDGER-REJECTION-PRECEDENCE",
        "comparison_summary": "fresh live-path 缺口直接威胁可信完成边界，优先于基于旧 content revision 的 Completion Review；其余 Project gaps 需要独立 Case。",
        "fresh_discovery_summary": "发现并立即验证一个 live run.finished 的 Ledger failure 优先级缺口。",
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
            "reason": "该 Project gap 需要独立 Case。"
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
            "reason": "该 Project gap 需要独立 Case。"
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
            "reason": "该 Project gap 需要独立 Case。"
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
            "reason": "该 Project gap 需要独立 Case。"
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
            "reason": "该 Project gap 需要独立 Case。"
          },
          {
            "ref": "case-gap:CASE-20260812-003:CASE-20260812-003:completion-review:1",
            "source": "persisted",
            "eligibility": "ready",
            "disposition": "deferred",
            "priority_basis": {
              "blocking": "high",
              "uncertainty": "low",
              "risk": "high",
              "user_impact": "high"
            },
            "reason": "Completion Review 必须在新发现的 live completion-boundary 缺口修复后针对最新 content revision 执行。"
          },
          {
            "ref": "fresh-gap:CASE-20260812-003:GAP-LIVE-LEDGER-REJECTION-PRECEDENCE",
            "source": "fresh",
            "eligibility": "ready",
            "disposition": "selected",
            "priority_basis": {
              "blocking": "阻止被拒 handoff 绕过可信完成边界。",
              "uncertainty": "low",
              "risk": "high",
              "user_impact": "high"
            },
            "reason": "该 fresh gap 是审查中发现的高风险完成边界遗漏，必须先于 Completion Review 闭合。"
          }
        ]
      },
      "selected_gap": {
        "id": "GAP-LIVE-LEDGER-REJECTION-PRECEDENCE",
        "responsibility": "agent",
        "goal": "使 live run.finished 在 required Ledger 未写入时优先进入 runtime_incomplete，不允许未经接受的 human/external handoff 覆盖 Ledger 失败。",
        "reason": "独立 Completion Review 前的 live-path 审查发现 coordinator 在检查 Ledger failure 之前处理 human handoff，与 detached reconciliation 的优先级不一致。",
        "derived_from": [
          "FACT-LEDGER-BLOCK-MISCLASSIFIED",
          "FACT-LEDGER-REJECTION-RECOVERY-IMPLEMENTED"
        ],
        "blocked_by": [],
        "priority_basis": {
          "blocking": "阻止被拒 handoff 绕过可信完成边界。",
          "uncertainty": "low",
          "risk": "high",
          "user_impact": "high"
        },
        "evidence_required": [
          "live run.finished 对 required writeback failure 的优先级测试",
          "human handoff 不覆盖 ledger rejection"
        ]
      },
      "planned_transition": {
        "goal": "使 live run.finished 在 required Ledger 未写入时优先进入 runtime_incomplete，不允许未经接受的 human/external handoff 覆盖 Ledger 失败。",
        "expected_state_change": "live run.finished 在 handoff 分支前处理 writeback_required && !written，并以 Gate rejection 创建 runtime_incomplete。"
      },
      "accepted_state_delta": {
        "resolved_gap": {
          "id": "GAP-LIVE-LEDGER-REJECTION-PRECEDENCE",
          "status": "resolved",
          "outcome": "live run.finished 现在与 detached reconciliation 一致，required Ledger 拒写优先于 human handoff 并进入 runtime_incomplete。",
          "reason": "coordinator 分支顺序已修正，并新增 live event 回归测试证明 rejection 原因保留且不会进入 awaiting_human。",
          "evidence": [
            "runtime/arckit-runtime/src/automation-coordinator.mjs",
            "runtime/arckit-runtime/test/automation-coordinator.test.mjs"
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
        "project_revision": 35,
        "judgments": [
          {
            "invariant_ref": "product-expectations-remain-recoverable",
            "disposition": "upheld",
            "reason": "既有产品规格明确 required writeback 未接受不得完成，fresh 修复实现该规则。",
            "fact_refs": [
              "FACT-LEDGER-REJECTION-RECOVERY-IMPLEMENTED"
            ],
            "evidence": [
              "arckit/spec/agentic-software-development/runtime-automation-workspace.md"
            ],
            "gap_refs": []
          },
          {
            "invariant_ref": "interaction-expectations-remain-recoverable",
            "disposition": "upheld",
            "reason": "live recovery 现在按交互契约显示 Ledger rejection 而非未经接受的 handoff。",
            "fact_refs": [
              "FACT-LEDGER-REJECTION-RECOVERY-IMPLEMENTED"
            ],
            "evidence": [
              "arckit/interaction/automation-workspace/interaction.md",
              "runtime/arckit-runtime/src/automation-coordinator.mjs"
            ],
            "gap_refs": []
          },
          {
            "invariant_ref": "visual-language-remains-consistent",
            "disposition": "not_relevant",
            "reason": "fresh 修复只调整 coordinator 控制流和测试，未改变视觉规则或 renderer。",
            "fact_refs": [],
            "evidence": [],
            "gap_refs": []
          },
          {
            "invariant_ref": "technical-decisions-remain-explainable",
            "disposition": "upheld",
            "reason": "live 与 detached 两条协调路径现在共享相同的 Ledger failure 优先边界。",
            "fact_refs": [
              "FACT-LEDGER-BLOCK-MISCLASSIFIED",
              "FACT-LEDGER-REJECTION-RECOVERY-IMPLEMENTED"
            ],
            "evidence": [
              "arckit/tech/arckit-runtime/desktop-execution-solution.md",
              "runtime/arckit-runtime/src/automation-coordinator.mjs"
            ],
            "gap_refs": []
          },
          {
            "invariant_ref": "accepted-facts-are-realized",
            "disposition": "upheld",
            "reason": "live event 测试直接证明未经接受的 human handoff 不覆盖 required Ledger rejection。",
            "fact_refs": [
              "FACT-LEDGER-REJECTION-RECOVERY-IMPLEMENTED"
            ],
            "evidence": [
              "runtime/arckit-runtime/src/automation-coordinator.mjs",
              "runtime/arckit-runtime/test/automation-coordinator.test.mjs"
            ],
            "gap_refs": []
          },
          {
            "invariant_ref": "material-risks-have-credible-evidence",
            "disposition": "upheld",
            "reason": "高风险 live-path 分支由可重复的 run.finished 场景测试覆盖。",
            "fact_refs": [
              "FACT-LEDGER-BLOCK-MISCLASSIFIED"
            ],
            "evidence": [
              "runtime/arckit-runtime/test/automation-coordinator.test.mjs"
            ],
            "gap_refs": []
          }
        ]
      },
      "evidence": [
        "runtime/arckit-runtime/src/automation-coordinator.mjs",
        "runtime/arckit-runtime/test/automation-coordinator.test.mjs",
        "runtime/arckit-runtime/package.json#npm-run-check"
      ],
      "runtime_result_ref": "",
      "occurred_at": "2026-08-12T17:02:44.405Z"
    },
    {
      "round": 3,
      "transition_schema_version": "arckit-case-transition/v8",
      "goal": "Review the completed implementation for correctness, real problem resolution, verification credibility, regression risk, and minimality.",
      "outcome": "completed",
      "gap_selection": {
        "mode": "candidate",
        "basis": "所有 ordinary gaps 与 impacts 均已闭合，且全量 Runtime check 通过，当前 revision 已具备独立 Completion Review 条件。",
        "snapshot_token": "2d6bf2409e8dd10974156c739a9cd3f61c60e52f476ee9caba3b47676706b987",
        "selected_ref": "case-gap:CASE-20260812-003:CASE-20260812-003:completion-review:1",
        "comparison_summary": "Completion Review 是当前 Case 唯一 ready candidate；Project gaps 需要独立 Case。",
        "fresh_discovery_summary": "针对 live、detached、runner、writer 与 closeout 边界复查后，没有发现新的更高优先级普通 gap。",
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
            "reason": "该 Project gap 需要独立 Case，不属于当前修复的 completion review 范围。"
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
            "reason": "该 Project gap 需要独立 Case，不属于当前修复的 completion review 范围。"
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
            "reason": "该 Project gap 需要独立 Case，不属于当前修复的 completion review 范围。"
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
            "reason": "该 Project gap 需要独立 Case，不属于当前修复的 completion review 范围。"
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
            "reason": "该 Project gap 需要独立 Case，不属于当前修复的 completion review 范围。"
          },
          {
            "ref": "case-gap:CASE-20260812-003:CASE-20260812-003:completion-review:1",
            "source": "persisted",
            "eligibility": "ready",
            "disposition": "selected",
            "priority_basis": {
              "blocking": "high",
              "uncertainty": "low",
              "risk": "high",
              "user_impact": "high"
            },
            "reason": "所有 ordinary Case gaps 已闭合，当前 content revision 2 的 Completion Review 是唯一剩余 Case obligation。"
          }
        ]
      },
      "selected_gap": {
        "id": "CASE-20260812-003:completion-review:1",
        "responsibility": "agent",
        "goal": "Review the completed implementation for correctness, real problem resolution, verification credibility, regression risk, and minimality.",
        "reason": "All ordinary Case gaps and state impacts are closed.",
        "derived_from": [
          "case_result",
          "content_revision:2"
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
        "expected_state_change": "记录 content revision 2 的 clean implementation-focused completion review 并关闭 Case。"
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
          "reviewed_content_revision": 2,
          "dimensions": {
            "implementation_correctness": "clean",
            "problem_resolution": "clean",
            "verification_credibility": "clean",
            "regression_risk": "clean",
            "minimality": "clean"
          },
          "findings": [],
          "evidence": [
            "runtime/arckit-runtime/src/ledger-writer.mjs",
            "runtime/arckit-runtime/src/state-driven-runner.mjs",
            "runtime/arckit-runtime/src/automation-coordinator.mjs",
            "runtime/arckit-runtime/test/ledger-writer.test.mjs",
            "runtime/arckit-runtime/test/state-driven-runner.test.mjs",
            "runtime/arckit-runtime/test/automation-coordinator.test.mjs",
            "runtime/arckit-runtime/package.json#npm-run-check",
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
        "project_revision": 35,
        "judgments": [
          {
            "invariant_ref": "product-expectations-remain-recoverable",
            "disposition": "upheld",
            "reason": "required writeback 的完成与恢复语义已在产品规格中稳定表达并由实现满足。",
            "fact_refs": [
              "FACT-LEDGER-REJECTION-RECOVERY-IMPLEMENTED"
            ],
            "evidence": [
              "arckit/spec/agentic-software-development/runtime-automation-workspace.md"
            ],
            "gap_refs": []
          },
          {
            "invariant_ref": "interaction-expectations-remain-recoverable",
            "disposition": "upheld",
            "reason": "live 与 detached recovery 都优先呈现 Ledger rejection，交互契约和实现一致。",
            "fact_refs": [
              "FACT-LEDGER-REJECTION-RECOVERY-IMPLEMENTED"
            ],
            "evidence": [
              "arckit/interaction/automation-workspace/interaction.md",
              "runtime/arckit-runtime/src/automation-coordinator.mjs"
            ],
            "gap_refs": []
          },
          {
            "invariant_ref": "visual-language-remains-consistent",
            "disposition": "not_relevant",
            "reason": "本 Case 未改变视觉语言、布局、样式、组件或 renderer 表现。",
            "fact_refs": [],
            "evidence": [],
            "gap_refs": []
          },
          {
            "invariant_ref": "technical-decisions-remain-explainable",
            "disposition": "upheld",
            "reason": "Gate rejection、same-thread replan、completion boundary 与 coordinator reconciliation 关系由技术文档和源码完整说明。",
            "fact_refs": [
              "FACT-LEDGER-BLOCK-MISCLASSIFIED",
              "FACT-LEDGER-REJECTION-RECOVERY-IMPLEMENTED"
            ],
            "evidence": [
              "arckit/tech/arckit-runtime/desktop-execution-solution.md",
              "runtime/arckit-runtime/src/ledger-writer.mjs",
              "runtime/arckit-runtime/src/state-driven-runner.mjs",
              "runtime/arckit-runtime/src/automation-coordinator.mjs"
            ],
            "gap_refs": []
          },
          {
            "invariant_ref": "accepted-facts-are-realized",
            "disposition": "upheld",
            "reason": "writer、runner 与 coordinator 实现共同兑现 accepted fact，分层测试覆盖拒写和正常成功路径。",
            "fact_refs": [
              "FACT-LEDGER-REJECTION-RECOVERY-IMPLEMENTED"
            ],
            "evidence": [
              "runtime/arckit-runtime/src/ledger-writer.mjs",
              "runtime/arckit-runtime/src/state-driven-runner.mjs",
              "runtime/arckit-runtime/src/automation-coordinator.mjs",
              "runtime/arckit-runtime/test/ledger-writer.test.mjs",
              "runtime/arckit-runtime/test/state-driven-runner.test.mjs",
              "runtime/arckit-runtime/test/automation-coordinator.test.mjs"
            ],
            "gap_refs": []
          },
          {
            "invariant_ref": "material-risks-have-credible-evidence",
            "disposition": "upheld",
            "reason": "误完成、错误 closeout、错误提示、human handoff 覆盖、detached 幂等和成功回归均有可重复自动化验证，完整 check 0 失败。",
            "fact_refs": [
              "FACT-LEDGER-BLOCK-MISCLASSIFIED",
              "FACT-LEDGER-REJECTION-RECOVERY-IMPLEMENTED"
            ],
            "evidence": [
              "runtime/arckit-runtime/test/ledger-writer.test.mjs",
              "runtime/arckit-runtime/test/state-driven-runner.test.mjs",
              "runtime/arckit-runtime/test/automation-coordinator.test.mjs",
              "runtime/arckit-runtime/package.json#npm-run-check"
            ],
            "gap_refs": []
          }
        ]
      },
      "evidence": [
        "runtime/arckit-runtime/src/ledger-writer.mjs",
        "runtime/arckit-runtime/src/state-driven-runner.mjs",
        "runtime/arckit-runtime/src/automation-coordinator.mjs",
        "runtime/arckit-runtime/test/ledger-writer.test.mjs",
        "runtime/arckit-runtime/test/state-driven-runner.test.mjs",
        "runtime/arckit-runtime/test/automation-coordinator.test.mjs",
        "runtime/arckit-runtime/package.json#npm-run-check",
        "arckit/spec/agentic-software-development/runtime-automation-workspace.md",
        "arckit/interaction/automation-workspace/interaction.md",
        "arckit/tech/arckit-runtime/desktop-execution-solution.md"
      ],
      "runtime_result_ref": "",
      "occurred_at": "2026-08-12T17:03:56.569Z"
    }
  ],
  "case_resolution": {
    "status": "resolved",
    "stage": "resolved",
    "satisfied": [
      "GAP-001",
      "GAP-LIVE-LEDGER-REJECTION-PRECEDENCE"
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
    "updated_at": "2026-08-12T17:03:56.569Z"
  }
}
```

## Round Notes

- Case history is canonical in Structured Record.rounds; keep prose notes exceptional.
