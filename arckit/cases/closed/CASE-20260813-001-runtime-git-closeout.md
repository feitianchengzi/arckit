# 改善 Runtime Git closeout 的任务范围引导

Case: CASE-20260813-001
Status: closed
Artifact Type: code
Selected Gap: none
Updated: 2026-08-13T07:22:14.910Z

## User Intent

修复 arckit-runtime 的 Git closeout prompt：向同一 Agent 正向说明本待办产生的实现、测试、文档和 canonical ledger 产物均属于提交范围，同时保留真正无关的既有工作区改动；不引入确定性 commit 内容验证。

## Structured Record

```json
{
  "schema_version": "development-case-record/v5",
  "id": "CASE-20260813-001",
  "title": "改善 Runtime Git closeout 的任务范围引导",
  "status": "closed",
  "artifact_type": "code",
  "created_at": "2026-08-13T07:15:25.503Z",
  "updated_at": "2026-08-13T07:22:14.910Z",
  "user_intent": "修复 arckit-runtime 的 Git closeout prompt：向同一 Agent 正向说明本待办产生的实现、测试、文档和 canonical ledger 产物均属于提交范围，同时保留真正无关的既有工作区改动；不引入确定性 commit 内容验证。",
  "expected_outcome": "Git closeout Agent 能从清晰且容错的上下文理解完整任务范围，尤其不会把当前待办 trusted ledger 生成的 Case、Project、Iteration、索引或投影文件误判为无关改动；Runtime 仍依赖同一 Agent 的语义判断完成提交。",
  "project_state_ref": "arckit/project/state.record.json",
  "current_round": {
    "goal": "",
    "selected_gap": null
  },
  "facts": [
    {
      "id": "FACT-CLOSEOUT-PROMPT-CONTEXT-GAP",
      "revision": 1,
      "status": "superseded",
      "statement": "Runtime 的 Git-only closeout prompt 只提供原始待办和抽象 task-scoped changes 指令，没有正向说明本待办 trusted ledger 写入的 Case、Project、Iteration、索引与投影文件属于任务提交范围；JuSong 多个历史 run 因而把刚生成的 canonical Case 文件当作其他 Arckit 文件排除。",
      "basis": "state-driven-runner 的 prompt 内容与 JuSong RUN-20260812-152331246Z、RUN-20260812-173026199Z、RUN-20260812-181135438Z、RUN-20260812-185545001Z closeout 记录完整解释未提交文件的来源和时序。",
      "evidence": [
        "runtime/arckit-runtime/src/state-driven-runner.mjs",
        "arckit-runtime://runs/RUN-20260812-152331246Z",
        "arckit-runtime://runs/RUN-20260812-173026199Z",
        "arckit-runtime://runs/RUN-20260812-181135438Z",
        "arckit-runtime://runs/RUN-20260812-185545001Z"
      ]
    },
    {
      "id": "FACT-CLOSEOUT-PROMPT-GUIDANCE",
      "revision": 1,
      "status": "accepted",
      "statement": "Runtime Git-only closeout prompt 会结合 authoritative Case id、trusted ledger changed-files、同线程历史、git status/diff 和近期 commits 识别当前待办完整范围；canonical ledger 产物被正向纳入但路径不构成排他 allowlist，Agent 仍保留容错的语义判断。",
      "basis": "state-driven runner 实现及 prompt 回归断言已通过完整 Runtime check。",
      "evidence": [
        "runtime/arckit-runtime/src/state-driven-runner.mjs",
        "runtime/arckit-runtime/test/state-driven-runner.test.mjs",
        "command:npm --prefix runtime/arckit-runtime run check (148 tests: 147 passed, 1 skipped)"
      ]
    }
  ],
  "state_impacts": [],
  "gaps": [
    {
      "id": "GAP-001",
      "status": "resolved",
      "goal": "增强同线程 Git closeout prompt 的正向、容错任务范围引导：明确当前待办的业务改动与 trusted ledger 产物共同构成提交候选，利用可用 Case/ledger 上下文帮助 Agent 区分关联与无关文件，并保持语义判断而不增加确定性 commit 验证。",
      "reason": "现有抽象 task-scoped 表述不足以让 Agent 稳定识别 canonical ledger 产物归属，已造成待办远端完成但 Case 文件未提交。",
      "derived_from": [
        "FACT-CLOSEOUT-PROMPT-CONTEXT-GAP"
      ],
      "blocked_by": [],
      "priority_basis": {
        "blocking": "直接影响自动待办 Git 收尾完整性。",
        "uncertainty": "low",
        "risk": "medium",
        "user_impact": "high"
      },
      "responsibility": "agent",
      "evidence_required": [
        "closeout prompt 正向覆盖实现、测试、文档和当前待办 trusted ledger 产物",
        "prompt 提供可用的 authoritative Case 与本次 session ledger changed-files 上下文",
        "prompt 明确保留真正无关的既有脏工作区修改，并允许混合文件按任务相关部分判断",
        "自动化测试验证 prompt 引导且未增加 commit 内容确定性校验"
      ],
      "resolution": {
        "id": "GAP-001",
        "status": "resolved",
        "outcome": "Runtime 现在把 authoritative Case id 与本 session trusted ledger changed-files 传入 Git-only closeout，并明确实现、测试、稳定文档及 canonical ledger 产物通常共同属于本待办提交范围；相关路径是强上下文而非排他白名单，混合文件可按相关 hunks 判断。",
        "reason": "代码和回归测试落实了用户要求的正向、容错引导，且未新增 schema、提交内容门禁或提交后核验。",
        "evidence": [
          "runtime/arckit-runtime/src/state-driven-runner.mjs",
          "runtime/arckit-runtime/test/state-driven-runner.test.mjs",
          "command:npm --prefix runtime/arckit-runtime run check (148 tests: 147 passed, 1 skipped)"
        ],
        "occurred_at": "2026-08-13T07:21:18.295Z"
      }
    }
  ],
  "content_revision": 1,
  "completion_review": {
    "status": "clean",
    "policy": {
      "initial_max_cycles": 2,
      "source": "Project quality decision and user-authorized prompt-only Runtime closeout fix",
      "snapshotted_at": "2026-08-13T07:15:25.503Z"
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
          "runtime/arckit-runtime/test/state-driven-runner.test.mjs",
          "command:git diff --check",
          "command:npm --prefix runtime/arckit-runtime run check (148 tests: 147 passed, 1 skipped)"
        ],
        "occurred_at": "2026-08-13T07:22:14.910Z"
      }
    ],
    "evidence": [
      "runtime/arckit-runtime/src/state-driven-runner.mjs",
      "runtime/arckit-runtime/test/state-driven-runner.test.mjs",
      "command:git diff --check",
      "command:npm --prefix runtime/arckit-runtime run check (148 tests: 147 passed, 1 skipped)"
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
      "goal": "以正向、容错 prompt 和可信 Case/ledger 上下文改善同线程 Git closeout。",
      "outcome": "completed",
      "gap_selection": {
        "mode": "candidate",
        "basis": "当前 Case 唯一 ready Gap 直接对应用户要求，其他五个候选均为独立 Project Gap。",
        "snapshot_token": "42aae797cc006644fdcfa0c0bfcb7d167722a0c2edd4922b257b7b9fbbcd0917",
        "selected_ref": "case-gap:CASE-20260813-001:GAP-001",
        "comparison_summary": "比较了五个 Project Gap 与当前 Case GAP-001；GAP-001 是唯一可在本轮完成且直接解决用户问题的候选。",
        "fresh_discovery_summary": "实现与验证未暴露新的未解决结果 Gap。",
        "considered": [
          {
            "ref": "project-gap:GAP-agent-scenario-evaluation",
            "source": "persisted",
            "eligibility": "case_required",
            "disposition": "deferred",
            "priority_basis": {
              "blocking": "不阻塞当前已建立的 Runtime closeout 修复 Case。",
              "uncertainty": "依各 Project Gap 保持原有边界。",
              "risk": "本轮不扩大到其他 Project Gap。",
              "user_impact": "低于当前用户明确要求的 closeout 修复。"
            },
            "reason": "这是独立 Project Gap，需要另建或推进相应 Case，本轮保持 deferred。"
          },
          {
            "ref": "project-gap:GAP-runtime-resilience-and-adapters",
            "source": "persisted",
            "eligibility": "case_required",
            "disposition": "deferred",
            "priority_basis": {
              "blocking": "不阻塞当前已建立的 Runtime closeout 修复 Case。",
              "uncertainty": "依各 Project Gap 保持原有边界。",
              "risk": "本轮不扩大到其他 Project Gap。",
              "user_impact": "低于当前用户明确要求的 closeout 修复。"
            },
            "reason": "这是独立 Project Gap，需要另建或推进相应 Case，本轮保持 deferred。"
          },
          {
            "ref": "project-gap:GAP-security-real-project-validation",
            "source": "persisted",
            "eligibility": "case_required",
            "disposition": "deferred",
            "priority_basis": {
              "blocking": "不阻塞当前已建立的 Runtime closeout 修复 Case。",
              "uncertainty": "依各 Project Gap 保持原有边界。",
              "risk": "本轮不扩大到其他 Project Gap。",
              "user_impact": "低于当前用户明确要求的 closeout 修复。"
            },
            "reason": "这是独立 Project Gap，需要另建或推进相应 Case，本轮保持 deferred。"
          },
          {
            "ref": "project-gap:GAP-delivery-governance",
            "source": "persisted",
            "eligibility": "case_required",
            "disposition": "deferred",
            "priority_basis": {
              "blocking": "不阻塞当前已建立的 Runtime closeout 修复 Case。",
              "uncertainty": "依各 Project Gap 保持原有边界。",
              "risk": "本轮不扩大到其他 Project Gap。",
              "user_impact": "低于当前用户明确要求的 closeout 修复。"
            },
            "reason": "这是独立 Project Gap，需要另建或推进相应 Case，本轮保持 deferred。"
          },
          {
            "ref": "project-gap:GAP-cross-record-audit",
            "source": "persisted",
            "eligibility": "case_required",
            "disposition": "deferred",
            "priority_basis": {
              "blocking": "不阻塞当前已建立的 Runtime closeout 修复 Case。",
              "uncertainty": "依各 Project Gap 保持原有边界。",
              "risk": "本轮不扩大到其他 Project Gap。",
              "user_impact": "低于当前用户明确要求的 closeout 修复。"
            },
            "reason": "这是独立 Project Gap，需要另建或推进相应 Case，本轮保持 deferred。"
          },
          {
            "ref": "case-gap:CASE-20260813-001:GAP-001",
            "source": "persisted",
            "eligibility": "ready",
            "disposition": "selected",
            "priority_basis": {
              "blocking": "直接影响当前自动待办 Git 收尾完整性。",
              "uncertainty": "low",
              "risk": "medium",
              "user_impact": "high"
            },
            "reason": "这是当前 Case 唯一 ready Gap，且与用户明确要求完全一致。"
          }
        ]
      },
      "selected_gap": {
        "id": "GAP-001",
        "responsibility": "agent",
        "goal": "增强同线程 Git closeout prompt 的正向、容错任务范围引导：明确当前待办的业务改动与 trusted ledger 产物共同构成提交候选，利用可用 Case/ledger 上下文帮助 Agent 区分关联与无关文件，并保持语义判断而不增加确定性 commit 验证。",
        "reason": "现有抽象 task-scoped 表述不足以让 Agent 稳定识别 canonical ledger 产物归属，已造成待办远端完成但 Case 文件未提交。",
        "derived_from": [
          "FACT-CLOSEOUT-PROMPT-CONTEXT-GAP"
        ],
        "blocked_by": [],
        "priority_basis": {
          "blocking": "直接影响自动待办 Git 收尾完整性。",
          "uncertainty": "low",
          "risk": "medium",
          "user_impact": "high"
        },
        "evidence_required": [
          "closeout prompt 正向覆盖实现、测试、文档和当前待办 trusted ledger 产物",
          "prompt 提供可用的 authoritative Case 与本次 session ledger changed-files 上下文",
          "prompt 明确保留真正无关的既有脏工作区修改，并允许混合文件按任务相关部分判断",
          "自动化测试验证 prompt 引导且未增加 commit 内容确定性校验"
        ]
      },
      "planned_transition": {
        "goal": "以正向、容错 prompt 和可信 Case/ledger 上下文改善同线程 Git closeout。",
        "expected_state_change": "Runtime closeout Agent 获得完整任务范围引导，同时继续依赖语义判断且不增加确定性 commit 验证。"
      },
      "accepted_state_delta": {
        "resolved_gap": {
          "id": "GAP-001",
          "status": "resolved",
          "outcome": "Runtime 现在把 authoritative Case id 与本 session trusted ledger changed-files 传入 Git-only closeout，并明确实现、测试、稳定文档及 canonical ledger 产物通常共同属于本待办提交范围；相关路径是强上下文而非排他白名单，混合文件可按相关 hunks 判断。",
          "reason": "代码和回归测试落实了用户要求的正向、容错引导，且未新增 schema、提交内容门禁或提交后核验。",
          "evidence": [
            "runtime/arckit-runtime/src/state-driven-runner.mjs",
            "runtime/arckit-runtime/test/state-driven-runner.test.mjs",
            "command:npm --prefix runtime/arckit-runtime run check (148 tests: 147 passed, 1 skipped)"
          ]
        },
        "facts_added": [
          {
            "id": "FACT-CLOSEOUT-PROMPT-GUIDANCE",
            "revision": 1,
            "status": "accepted",
            "statement": "Runtime Git-only closeout prompt 会结合 authoritative Case id、trusted ledger changed-files、同线程历史、git status/diff 和近期 commits 识别当前待办完整范围；canonical ledger 产物被正向纳入但路径不构成排他 allowlist，Agent 仍保留容错的语义判断。",
            "basis": "state-driven runner 实现及 prompt 回归断言已通过完整 Runtime check。",
            "evidence": [
              "runtime/arckit-runtime/src/state-driven-runner.mjs",
              "runtime/arckit-runtime/test/state-driven-runner.test.mjs",
              "command:npm --prefix runtime/arckit-runtime run check (148 tests: 147 passed, 1 skipped)"
            ]
          }
        ],
        "facts_superseded": [
          {
            "id": "FACT-CLOSEOUT-PROMPT-CONTEXT-GAP",
            "revision": 1,
            "reason": "缺失的 closeout 范围上下文已由新的 prompt 与 task_context 实现修复。",
            "evidence": [
              "runtime/arckit-runtime/src/state-driven-runner.mjs",
              "runtime/arckit-runtime/test/state-driven-runner.test.mjs",
              "command:npm --prefix runtime/arckit-runtime run check (148 tests: 147 passed, 1 skipped)"
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
        "project_revision": 39,
        "judgments": [
          {
            "invariant_ref": "product-expectations-remain-recoverable",
            "disposition": "not_relevant",
            "reason": "本轮实现既有 Git-only closeout 目标，不建立或改变产品能力、业务规则或验收含义。",
            "fact_refs": [
              "FACT-CLOSEOUT-PROMPT-GUIDANCE"
            ],
            "evidence": [],
            "gap_refs": []
          },
          {
            "invariant_ref": "interaction-expectations-remain-recoverable",
            "disposition": "not_relevant",
            "reason": "本轮不改变面向人的动作、状态、反馈、导航或恢复交互。",
            "fact_refs": [
              "FACT-CLOSEOUT-PROMPT-GUIDANCE"
            ],
            "evidence": [],
            "gap_refs": []
          },
          {
            "invariant_ref": "visual-language-remains-consistent",
            "disposition": "not_relevant",
            "reason": "本轮没有视觉语言或呈现规则变化。",
            "fact_refs": [
              "FACT-CLOSEOUT-PROMPT-GUIDANCE"
            ],
            "evidence": [],
            "gap_refs": []
          },
          {
            "invariant_ref": "technical-decisions-remain-explainable",
            "disposition": "upheld",
            "reason": "改动保持同线程 Agent 语义 closeout 与 Runtime 薄控制边界，只补充 Case/ledger 上下文和正向 scope 指令。",
            "fact_refs": [
              "FACT-CLOSEOUT-PROMPT-GUIDANCE"
            ],
            "evidence": [
              "runtime/arckit-runtime/src/state-driven-runner.mjs",
              "arckit/tech/arckit-runtime/solution.md"
            ],
            "gap_refs": []
          },
          {
            "invariant_ref": "accepted-facts-are-realized",
            "disposition": "upheld",
            "reason": "实现与回归断言直接证明新 closeout 引导和上下文已进入实际 prompt。",
            "fact_refs": [
              "FACT-CLOSEOUT-PROMPT-GUIDANCE"
            ],
            "evidence": [
              "runtime/arckit-runtime/src/state-driven-runner.mjs",
              "runtime/arckit-runtime/test/state-driven-runner.test.mjs"
            ],
            "gap_refs": []
          },
          {
            "invariant_ref": "material-risks-have-credible-evidence",
            "disposition": "upheld",
            "reason": "完整 Runtime check 覆盖 closeout prompt 回归及现有 session、ledger、Desktop 行为，证据与轻量 prompt 改动风险相称。",
            "fact_refs": [
              "FACT-CLOSEOUT-PROMPT-GUIDANCE"
            ],
            "evidence": [
              "command:npm --prefix runtime/arckit-runtime run check (148 tests: 147 passed, 1 skipped)"
            ],
            "gap_refs": []
          }
        ]
      },
      "evidence": [
        "runtime/arckit-runtime/src/state-driven-runner.mjs",
        "runtime/arckit-runtime/test/state-driven-runner.test.mjs",
        "command:npm --prefix runtime/arckit-runtime run check (148 tests: 147 passed, 1 skipped)"
      ],
      "runtime_result_ref": "",
      "occurred_at": "2026-08-13T07:21:18.295Z"
    },
    {
      "round": 2,
      "transition_schema_version": "arckit-case-transition/v8",
      "goal": "对 content revision 1 做一次轻量、实现导向的完成复审。",
      "outcome": "completed",
      "gap_selection": {
        "mode": "candidate",
        "basis": "普通 Case Gap 已闭合，Completion Review 是当前 Case 唯一 ready 义务。",
        "snapshot_token": "217187b10153e558053787dd20b8da906d816df0df6d3d561f7acdd5b0c993c0",
        "selected_ref": "case-gap:CASE-20260813-001:CASE-20260813-001:completion-review:1",
        "comparison_summary": "比较了五个独立 Project Gap 与当前 Completion Review；只有后者属于本 Case 且阻塞收口。",
        "fresh_discovery_summary": "复审未发现新的 error、omission 或 excess。",
        "considered": [
          {
            "ref": "project-gap:GAP-agent-scenario-evaluation",
            "source": "persisted",
            "eligibility": "case_required",
            "disposition": "deferred",
            "priority_basis": {
              "blocking": "不阻塞当前 Case 的 Completion Review。",
              "uncertainty": "依各 Project Gap 保持原有边界。",
              "risk": "本轮不扩大到独立 Project Gap。",
              "user_impact": "低于完成当前用户修复。"
            },
            "reason": "独立 Project Gap 不属于当前 Case 的完成复审。"
          },
          {
            "ref": "project-gap:GAP-runtime-resilience-and-adapters",
            "source": "persisted",
            "eligibility": "case_required",
            "disposition": "deferred",
            "priority_basis": {
              "blocking": "不阻塞当前 Case 的 Completion Review。",
              "uncertainty": "依各 Project Gap 保持原有边界。",
              "risk": "本轮不扩大到独立 Project Gap。",
              "user_impact": "低于完成当前用户修复。"
            },
            "reason": "独立 Project Gap 不属于当前 Case 的完成复审。"
          },
          {
            "ref": "project-gap:GAP-security-real-project-validation",
            "source": "persisted",
            "eligibility": "case_required",
            "disposition": "deferred",
            "priority_basis": {
              "blocking": "不阻塞当前 Case 的 Completion Review。",
              "uncertainty": "依各 Project Gap 保持原有边界。",
              "risk": "本轮不扩大到独立 Project Gap。",
              "user_impact": "低于完成当前用户修复。"
            },
            "reason": "独立 Project Gap 不属于当前 Case 的完成复审。"
          },
          {
            "ref": "project-gap:GAP-delivery-governance",
            "source": "persisted",
            "eligibility": "case_required",
            "disposition": "deferred",
            "priority_basis": {
              "blocking": "不阻塞当前 Case 的 Completion Review。",
              "uncertainty": "依各 Project Gap 保持原有边界。",
              "risk": "本轮不扩大到独立 Project Gap。",
              "user_impact": "低于完成当前用户修复。"
            },
            "reason": "独立 Project Gap 不属于当前 Case 的完成复审。"
          },
          {
            "ref": "project-gap:GAP-cross-record-audit",
            "source": "persisted",
            "eligibility": "case_required",
            "disposition": "deferred",
            "priority_basis": {
              "blocking": "不阻塞当前 Case 的 Completion Review。",
              "uncertainty": "依各 Project Gap 保持原有边界。",
              "risk": "本轮不扩大到独立 Project Gap。",
              "user_impact": "低于完成当前用户修复。"
            },
            "reason": "独立 Project Gap 不属于当前 Case 的完成复审。"
          },
          {
            "ref": "case-gap:CASE-20260813-001:CASE-20260813-001:completion-review:1",
            "source": "persisted",
            "eligibility": "ready",
            "disposition": "selected",
            "priority_basis": {
              "blocking": "Case 收口前的唯一剩余义务。",
              "uncertainty": "low",
              "risk": "medium",
              "user_impact": "high"
            },
            "reason": "普通 Gap 已全部闭合，必须审查当前 content revision 1。"
          }
        ]
      },
      "selected_gap": {
        "id": "CASE-20260813-001:completion-review:1",
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
        "goal": "对 content revision 1 做一次轻量、实现导向的完成复审。",
        "expected_state_change": "若五个维度均 clean，则关闭 Case，不新增实现或验证机制。"
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
            "runtime/arckit-runtime/test/state-driven-runner.test.mjs",
            "command:git diff --check",
            "command:npm --prefix runtime/arckit-runtime run check (148 tests: 147 passed, 1 skipped)"
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
        "project_revision": 39,
        "judgments": [
          {
            "invariant_ref": "product-expectations-remain-recoverable",
            "disposition": "not_relevant",
            "reason": "复审确认该实现不改变产品能力、业务规则或验收含义。",
            "fact_refs": [
              "FACT-CLOSEOUT-PROMPT-GUIDANCE"
            ],
            "evidence": [],
            "gap_refs": []
          },
          {
            "invariant_ref": "interaction-expectations-remain-recoverable",
            "disposition": "not_relevant",
            "reason": "复审确认没有面向人的交互状态或反馈变化。",
            "fact_refs": [
              "FACT-CLOSEOUT-PROMPT-GUIDANCE"
            ],
            "evidence": [],
            "gap_refs": []
          },
          {
            "invariant_ref": "visual-language-remains-consistent",
            "disposition": "not_relevant",
            "reason": "复审确认没有视觉语言变化。",
            "fact_refs": [
              "FACT-CLOSEOUT-PROMPT-GUIDANCE"
            ],
            "evidence": [],
            "gap_refs": []
          },
          {
            "invariant_ref": "technical-decisions-remain-explainable",
            "disposition": "upheld",
            "reason": "复审确认改动只为同线程 Git closeout 补充语义上下文，维持 Agent 判断与 Runtime 薄控制边界。",
            "fact_refs": [
              "FACT-CLOSEOUT-PROMPT-GUIDANCE"
            ],
            "evidence": [
              "runtime/arckit-runtime/src/state-driven-runner.mjs",
              "arckit/tech/arckit-runtime/solution.md"
            ],
            "gap_refs": []
          },
          {
            "invariant_ref": "accepted-facts-are-realized",
            "disposition": "upheld",
            "reason": "实现和回归断言覆盖 authoritative Case、ledger changed-files、非排他路径与混合 hunk 引导。",
            "fact_refs": [
              "FACT-CLOSEOUT-PROMPT-GUIDANCE"
            ],
            "evidence": [
              "runtime/arckit-runtime/src/state-driven-runner.mjs",
              "runtime/arckit-runtime/test/state-driven-runner.test.mjs"
            ],
            "gap_refs": []
          },
          {
            "invariant_ref": "material-risks-have-credible-evidence",
            "disposition": "upheld",
            "reason": "完整 Runtime check 与 diff 检查对本次 prompt-only 改动提供了相称的回归证据。",
            "fact_refs": [
              "FACT-CLOSEOUT-PROMPT-GUIDANCE"
            ],
            "evidence": [
              "command:git diff --check",
              "command:npm --prefix runtime/arckit-runtime run check (148 tests: 147 passed, 1 skipped)"
            ],
            "gap_refs": []
          }
        ]
      },
      "evidence": [
        "runtime/arckit-runtime/src/state-driven-runner.mjs",
        "runtime/arckit-runtime/test/state-driven-runner.test.mjs",
        "command:git diff --check",
        "command:npm --prefix runtime/arckit-runtime run check (148 tests: 147 passed, 1 skipped)"
      ],
      "runtime_result_ref": "",
      "occurred_at": "2026-08-13T07:22:14.910Z"
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
    "updated_at": "2026-08-13T07:22:14.910Z"
  }
}
```

## Round Notes

- Case history is canonical in Structured Record.rounds; keep prose notes exceptional.
