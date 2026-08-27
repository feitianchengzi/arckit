# Unify non-automatable work as human intervention

Case: CASE-20260827-004
Status: closed
Artifact Type: mixed
Selected Gap: none
Updated: 2026-08-27T06:34:45.808Z

## User Intent

Correct Automation responsibility modeling so every unresolved condition it cannot advance itself becomes an actionable human-intervention state.

## Structured Record

```json
{
  "schema_version": "development-case-record/v5",
  "id": "CASE-20260827-004",
  "title": "Unify non-automatable work as human intervention",
  "status": "closed",
  "artifact_type": "mixed",
  "created_at": "2026-08-27T06:15:45.130Z",
  "updated_at": "2026-08-27T06:34:45.808Z",
  "user_intent": "Correct Automation responsibility modeling so every unresolved condition it cannot advance itself becomes an actionable human-intervention state.",
  "expected_outcome": "External dependencies remain typed internal causes while Automation exposes one human-intervention boundary with reason, resume condition, and same-thread recheck.",
  "project_state_ref": "arckit/project/state.record.json",
  "current_round": {
    "goal": "",
    "selected_gap": null
  },
  "facts": [
    {
      "id": "FACT-20260827-004-001",
      "revision": 1,
      "status": "accepted",
      "statement": "Automation must distinguish only work it can continue autonomously from unresolved work that requires human intervention; an external dependency may describe the cause but must not create an unowned top-level waiting state.",
      "basis": "Current operator clarification after reviewing the independent external_wait implementation.",
      "evidence": [
        "Current operator input, 2026-08-27",
        "runtime/arcorbit/src/automation-coordinator.mjs",
        "runtime/arcorbit/desktop/renderer/renderer.js"
      ]
    },
    {
      "id": "FACT-20260827-004-002",
      "revision": 1,
      "status": "accepted",
      "statement": "ArcOrbit Automation now exposes one Human responsibility boundary for every unresolved next step requiring operator action, while retaining external_dependency, recovery, configuration, and CLI as typed causes or handling contexts; external confirmation resumes the same task session and thread.",
      "basis": "Production coordinator/store/IPC/Renderer implementation and passing behavioral tests.",
      "evidence": [
        "runtime/arcorbit/src/automation-coordinator.mjs",
        "runtime/arcorbit/src/desktop/desktop-store.mjs",
        "runtime/arcorbit/desktop/renderer/renderer.js",
        "runtime/arcorbit/desktop/main.mjs",
        "runtime/arcorbit/desktop/preload.cjs",
        "runtime/arcorbit/test/automation-coordinator.test.mjs",
        "runtime/arcorbit/test/desktop-store.test.mjs",
        "runtime/arcorbit/test/desktop-renderer.test.mjs",
        "arckit/interaction/automation-workspace/interaction.md",
        "arckit/tech/arcorbit/desktop-execution-solution.md",
        "Verification: focused Automation/Store/Renderer suite 129 passed, 0 failed",
        "Verification: non-GUI ArcOrbit suite 538 tests; 517 passed, 21 skipped, 0 failed",
        "Verification: full default suite only two pre-assertion Electron SIGABRT failures",
        "Verification: syntax checks and git diff --check passed"
      ]
    }
  ],
  "state_impacts": [
    {
      "id": "IMPACT-20260827-004-001",
      "fact_id": "FACT-20260827-004-001",
      "fact_revision": 1,
      "target": {
        "kind": "software_decision",
        "ref": "experience_and_interaction",
        "revision": 61
      },
      "effect": "upheld",
      "reason": "The Command Center now creates attention, identifies Human as owner, shows the typed cause and recovery condition, and offers an explicit bounded action.",
      "gap_ids": [],
      "evidence": [
        "runtime/arcorbit/src/automation-coordinator.mjs",
        "runtime/arcorbit/src/desktop/desktop-store.mjs",
        "runtime/arcorbit/desktop/renderer/renderer.js",
        "runtime/arcorbit/desktop/main.mjs",
        "runtime/arcorbit/desktop/preload.cjs",
        "runtime/arcorbit/test/automation-coordinator.test.mjs",
        "runtime/arcorbit/test/desktop-store.test.mjs",
        "runtime/arcorbit/test/desktop-renderer.test.mjs",
        "arckit/interaction/automation-workspace/interaction.md",
        "arckit/tech/arcorbit/desktop-execution-solution.md",
        "Verification: focused Automation/Store/Renderer suite 129 passed, 0 failed",
        "Verification: non-GUI ArcOrbit suite 538 tests; 517 passed, 21 skipped, 0 failed",
        "Verification: full default suite only two pre-assertion Electron SIGABRT failures",
        "Verification: syntax checks and git diff --check passed"
      ]
    },
    {
      "id": "IMPACT-20260827-004-002",
      "fact_id": "FACT-20260827-004-001",
      "fact_revision": 1,
      "target": {
        "kind": "software_invariant",
        "ref": "accepted-facts-are-realized",
        "revision": null
      },
      "effect": "upheld",
      "reason": "The clarified binary responsibility fact is realized in production state projection, migration, UI, tests, and durable contracts.",
      "gap_ids": [],
      "evidence": [
        "runtime/arcorbit/src/automation-coordinator.mjs",
        "runtime/arcorbit/src/desktop/desktop-store.mjs",
        "runtime/arcorbit/desktop/renderer/renderer.js",
        "runtime/arcorbit/desktop/main.mjs",
        "runtime/arcorbit/desktop/preload.cjs",
        "runtime/arcorbit/test/automation-coordinator.test.mjs",
        "runtime/arcorbit/test/desktop-store.test.mjs",
        "runtime/arcorbit/test/desktop-renderer.test.mjs",
        "arckit/interaction/automation-workspace/interaction.md",
        "arckit/tech/arcorbit/desktop-execution-solution.md",
        "Verification: focused Automation/Store/Renderer suite 129 passed, 0 failed",
        "Verification: non-GUI ArcOrbit suite 538 tests; 517 passed, 21 skipped, 0 failed",
        "Verification: full default suite only two pre-assertion Electron SIGABRT failures",
        "Verification: syntax checks and git diff --check passed"
      ]
    }
  ],
  "gaps": [
    {
      "id": "GAP-20260827-004-001",
      "status": "resolved",
      "goal": "Map every non-automatable unresolved handoff, including external dependencies, into Automation human intervention while preserving typed cause, actionable resume condition, and same-thread continuation.",
      "reason": "The independent external_wait phase removes the task from human attention and leaves the external actor unspecified.",
      "derived_from": [
        "FACT-20260827-004-001"
      ],
      "blocked_by": [],
      "priority_basis": {
        "blocking": "The current state can strand active automated todos.",
        "urgency": "high",
        "user_impact": "Users cannot tell who must act or how execution resumes."
      },
      "responsibility": "agent",
      "evidence_required": [
        "Runtime state transition tests",
        "Desktop renderer interaction tests",
        "Updated interaction and technical contracts"
      ],
      "resolution": {
        "id": "GAP-20260827-004-001",
        "status": "resolved",
        "outcome": "Automation now projects all operator-triggered blockers as human intervention; external remains an internal dependency cause with an actionable confirmation path and same-thread resume.",
        "reason": "Live, detached, canonical, migration, IPC, Renderer, recovery responsibility, documentation, and regression evidence all agree on the binary boundary.",
        "evidence": [
          "runtime/arcorbit/src/automation-coordinator.mjs",
          "runtime/arcorbit/src/desktop/desktop-store.mjs",
          "runtime/arcorbit/desktop/renderer/renderer.js",
          "runtime/arcorbit/desktop/main.mjs",
          "runtime/arcorbit/desktop/preload.cjs",
          "runtime/arcorbit/test/automation-coordinator.test.mjs",
          "runtime/arcorbit/test/desktop-store.test.mjs",
          "runtime/arcorbit/test/desktop-renderer.test.mjs",
          "arckit/interaction/automation-workspace/interaction.md",
          "arckit/tech/arcorbit/desktop-execution-solution.md",
          "Verification: focused Automation/Store/Renderer suite 129 passed, 0 failed",
          "Verification: non-GUI ArcOrbit suite 538 tests; 517 passed, 21 skipped, 0 failed",
          "Verification: full default suite only two pre-assertion Electron SIGABRT failures",
          "Verification: syntax checks and git diff --check passed"
        ],
        "occurred_at": "2026-08-27T06:32:18.228Z"
      }
    }
  ],
  "content_revision": 1,
  "completion_review": {
    "status": "clean",
    "policy": {
      "initial_max_cycles": 3,
      "source": "Current operator instruction and using-arckit completion review",
      "snapshotted_at": "2026-08-27T06:15:45.130Z"
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
          "runtime/arcorbit/src/automation-coordinator.mjs",
          "runtime/arcorbit/src/desktop/desktop-store.mjs",
          "runtime/arcorbit/desktop/renderer/renderer.js",
          "runtime/arcorbit/desktop/main.mjs",
          "runtime/arcorbit/desktop/preload.cjs",
          "runtime/arcorbit/test/automation-coordinator.test.mjs",
          "runtime/arcorbit/test/desktop-store.test.mjs",
          "runtime/arcorbit/test/desktop-renderer.test.mjs",
          "arckit/interaction/automation-workspace/interaction.md",
          "arckit/interaction/automation-workspace/default.html",
          "arckit/tech/arcorbit/desktop-execution-solution.md",
          "Verification: focused Automation/Store/Renderer suite 129 passed, 0 failed",
          "Verification: non-GUI ArcOrbit suite 538 tests; 517 passed, 21 skipped, 0 failed",
          "Verification: full default suite only two pre-assertion Electron SIGABRT failures",
          "Verification: syntax checks and git diff --check passed"
        ],
        "occurred_at": "2026-08-27T06:34:45.808Z"
      }
    ],
    "evidence": [
      "runtime/arcorbit/src/automation-coordinator.mjs",
      "runtime/arcorbit/src/desktop/desktop-store.mjs",
      "runtime/arcorbit/desktop/renderer/renderer.js",
      "runtime/arcorbit/desktop/main.mjs",
      "runtime/arcorbit/desktop/preload.cjs",
      "runtime/arcorbit/test/automation-coordinator.test.mjs",
      "runtime/arcorbit/test/desktop-store.test.mjs",
      "runtime/arcorbit/test/desktop-renderer.test.mjs",
      "arckit/interaction/automation-workspace/interaction.md",
      "arckit/interaction/automation-workspace/default.html",
      "arckit/tech/arcorbit/desktop-execution-solution.md",
      "Verification: focused Automation/Store/Renderer suite 129 passed, 0 failed",
      "Verification: non-GUI ArcOrbit suite 538 tests; 517 passed, 21 skipped, 0 failed",
      "Verification: full default suite only two pre-assertion Electron SIGABRT failures",
      "Verification: syntax checks and git diff --check passed"
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
      "goal": "Unify Automation user-facing responsibility without erasing internal blocker causes.",
      "outcome": "completed",
      "gap_selection": {
        "mode": "candidate",
        "basis": "The fresh operator correction is the only ready Agent gap that directly prevents Automation from stranding unowned work.",
        "snapshot_token": "8a2117d7043ad149946cb67d22de3d86d788fdb406b076752c523775a1be4771",
        "selected_ref": "case-gap:CASE-20260827-004:GAP-20260827-004-001",
        "comparison_summary": "Compared all six persisted candidates: four project gaps remain separate future Cases, the Feedback provider gap remains external work in its existing Case, and the current responsibility-projection defect is selected.",
        "fresh_discovery_summary": "Implementation and validation found no additional gap after extending the same responsibility rule to recovery, configuration, and CLI projections.",
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
            "reason": "This durable Project gap requires its own bounded Case and is unrelated to the current correction."
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
            "reason": "This durable Project gap requires its own bounded Case and is unrelated to the current correction."
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
            "reason": "This durable Project gap requires its own bounded Case and is unrelated to the current correction."
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
            "reason": "This durable Project gap requires its own bounded Case and is unrelated to the current correction."
          },
          {
            "ref": "case-gap:CASE-20260826-013:GAP-20260826-013-003",
            "source": "persisted",
            "eligibility": "ready",
            "disposition": "excluded",
            "priority_basis": {
              "blocking": "阻塞 V2 反馈恢复在真实环境可用。",
              "uncertainty": "服务端实现仓库不在当前授权 workspace。",
              "risk": "若没有状态前置校验和权限验证，可能覆盖并发更新或扩大 mutation 权限。",
              "user_impact": "V2 项目的误忽略仍无法恢复。"
            },
            "reason": "This is an external provider obligation in another Case; it supplies a trigger example but is not modified here."
          },
          {
            "ref": "case-gap:CASE-20260827-004:GAP-20260827-004-001",
            "source": "persisted",
            "eligibility": "ready",
            "disposition": "selected",
            "priority_basis": {
              "blocking": "The current state can strand active automated todos.",
              "uncertainty": "",
              "risk": "",
              "user_impact": "Users cannot tell who must act or how execution resumes.",
              "urgency": "high"
            },
            "reason": "This gap directly covers the clarified Automation responsibility boundary."
          }
        ]
      },
      "selected_gap": {
        "id": "GAP-20260827-004-001",
        "responsibility": "agent",
        "goal": "Map every non-automatable unresolved handoff, including external dependencies, into Automation human intervention while preserving typed cause, actionable resume condition, and same-thread continuation.",
        "reason": "The independent external_wait phase removes the task from human attention and leaves the external actor unspecified.",
        "derived_from": [
          "FACT-20260827-004-001"
        ],
        "blocked_by": [],
        "priority_basis": {
          "blocking": "The current state can strand active automated todos.",
          "uncertainty": "",
          "risk": "",
          "user_impact": "Users cannot tell who must act or how execution resumes.",
          "urgency": "high"
        },
        "evidence_required": [
          "Runtime state transition tests",
          "Desktop renderer interaction tests",
          "Updated interaction and technical contracts"
        ]
      },
      "planned_transition": {
        "goal": "Unify Automation user-facing responsibility without erasing internal blocker causes.",
        "expected_state_change": "Resolve the projection defect, uphold its threatened impacts, and leave only Completion Review."
      },
      "accepted_state_delta": {
        "resolved_gap": {
          "id": "GAP-20260827-004-001",
          "status": "resolved",
          "outcome": "Automation now projects all operator-triggered blockers as human intervention; external remains an internal dependency cause with an actionable confirmation path and same-thread resume.",
          "reason": "Live, detached, canonical, migration, IPC, Renderer, recovery responsibility, documentation, and regression evidence all agree on the binary boundary.",
          "evidence": [
            "runtime/arcorbit/src/automation-coordinator.mjs",
            "runtime/arcorbit/src/desktop/desktop-store.mjs",
            "runtime/arcorbit/desktop/renderer/renderer.js",
            "runtime/arcorbit/desktop/main.mjs",
            "runtime/arcorbit/desktop/preload.cjs",
            "runtime/arcorbit/test/automation-coordinator.test.mjs",
            "runtime/arcorbit/test/desktop-store.test.mjs",
            "runtime/arcorbit/test/desktop-renderer.test.mjs",
            "arckit/interaction/automation-workspace/interaction.md",
            "arckit/tech/arcorbit/desktop-execution-solution.md",
            "Verification: focused Automation/Store/Renderer suite 129 passed, 0 failed",
            "Verification: non-GUI ArcOrbit suite 538 tests; 517 passed, 21 skipped, 0 failed",
            "Verification: full default suite only two pre-assertion Electron SIGABRT failures",
            "Verification: syntax checks and git diff --check passed"
          ]
        },
        "facts_added": [
          {
            "id": "FACT-20260827-004-002",
            "revision": 1,
            "status": "accepted",
            "statement": "ArcOrbit Automation now exposes one Human responsibility boundary for every unresolved next step requiring operator action, while retaining external_dependency, recovery, configuration, and CLI as typed causes or handling contexts; external confirmation resumes the same task session and thread.",
            "basis": "Production coordinator/store/IPC/Renderer implementation and passing behavioral tests.",
            "evidence": [
              "runtime/arcorbit/src/automation-coordinator.mjs",
              "runtime/arcorbit/src/desktop/desktop-store.mjs",
              "runtime/arcorbit/desktop/renderer/renderer.js",
              "runtime/arcorbit/desktop/main.mjs",
              "runtime/arcorbit/desktop/preload.cjs",
              "runtime/arcorbit/test/automation-coordinator.test.mjs",
              "runtime/arcorbit/test/desktop-store.test.mjs",
              "runtime/arcorbit/test/desktop-renderer.test.mjs",
              "arckit/interaction/automation-workspace/interaction.md",
              "arckit/tech/arcorbit/desktop-execution-solution.md",
              "Verification: focused Automation/Store/Renderer suite 129 passed, 0 failed",
              "Verification: non-GUI ArcOrbit suite 538 tests; 517 passed, 21 skipped, 0 failed",
              "Verification: full default suite only two pre-assertion Electron SIGABRT failures",
              "Verification: syntax checks and git diff --check passed"
            ]
          }
        ],
        "facts_superseded": [],
        "impacts_added": [],
        "impacts_updated": [
          {
            "id": "IMPACT-20260827-004-001",
            "fact_id": "FACT-20260827-004-001",
            "fact_revision": 1,
            "target": {
              "kind": "software_decision",
              "ref": "experience_and_interaction",
              "revision": 61
            },
            "effect": "upheld",
            "reason": "The Command Center now creates attention, identifies Human as owner, shows the typed cause and recovery condition, and offers an explicit bounded action.",
            "gap_ids": [],
            "evidence": [
              "runtime/arcorbit/src/automation-coordinator.mjs",
              "runtime/arcorbit/src/desktop/desktop-store.mjs",
              "runtime/arcorbit/desktop/renderer/renderer.js",
              "runtime/arcorbit/desktop/main.mjs",
              "runtime/arcorbit/desktop/preload.cjs",
              "runtime/arcorbit/test/automation-coordinator.test.mjs",
              "runtime/arcorbit/test/desktop-store.test.mjs",
              "runtime/arcorbit/test/desktop-renderer.test.mjs",
              "arckit/interaction/automation-workspace/interaction.md",
              "arckit/tech/arcorbit/desktop-execution-solution.md",
              "Verification: focused Automation/Store/Renderer suite 129 passed, 0 failed",
              "Verification: non-GUI ArcOrbit suite 538 tests; 517 passed, 21 skipped, 0 failed",
              "Verification: full default suite only two pre-assertion Electron SIGABRT failures",
              "Verification: syntax checks and git diff --check passed"
            ]
          },
          {
            "id": "IMPACT-20260827-004-002",
            "fact_id": "FACT-20260827-004-001",
            "fact_revision": 1,
            "target": {
              "kind": "software_invariant",
              "ref": "accepted-facts-are-realized",
              "revision": null
            },
            "effect": "upheld",
            "reason": "The clarified binary responsibility fact is realized in production state projection, migration, UI, tests, and durable contracts.",
            "gap_ids": [],
            "evidence": [
              "runtime/arcorbit/src/automation-coordinator.mjs",
              "runtime/arcorbit/src/desktop/desktop-store.mjs",
              "runtime/arcorbit/desktop/renderer/renderer.js",
              "runtime/arcorbit/desktop/main.mjs",
              "runtime/arcorbit/desktop/preload.cjs",
              "runtime/arcorbit/test/automation-coordinator.test.mjs",
              "runtime/arcorbit/test/desktop-store.test.mjs",
              "runtime/arcorbit/test/desktop-renderer.test.mjs",
              "arckit/interaction/automation-workspace/interaction.md",
              "arckit/tech/arcorbit/desktop-execution-solution.md",
              "Verification: focused Automation/Store/Renderer suite 129 passed, 0 failed",
              "Verification: non-GUI ArcOrbit suite 538 tests; 517 passed, 21 skipped, 0 failed",
              "Verification: full default suite only two pre-assertion Electron SIGABRT failures",
              "Verification: syntax checks and git diff --check passed"
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
        "software_definition_changes": [
          {
            "area_ref": "experience_and_interaction",
            "observed_revision": 60,
            "set_decision": {
              "status": "settled",
              "statement": "ArcOrbit 保持既有 Personal、Product Lifecycle、Organization 导航与 Work、Automation、Feedback、Chat 等交互语义。Work 新建和编辑 Sheet 保留完整七状态，编辑 Sheet 承担异常纠偏；右侧 Inspector 按当前状态显示有限下一步动作。Work Inspector 首次使用 440px，用户可通过 12px 可访问分隔条在 360–640px 保存范围内拖拽、键盘调整或双击复位，偏好跨任务、项目、Workset 和应用重启恢复。布局为任务树保留至少 420px，窗口临时收窄只改变有效宽度且不覆盖保存值。Inspector 以单一内部滚动区组织身份动作、内容、紧凑属性、协作和按状态出现的验收分区，宽度变化不丢失选择、滚动、草稿或附件状态。验收问题条目的问题原文与进展文本在 Inspector 当前可用宽度内完整折行且不横向越界，状态徽标保持清晰可见。Work 已完成列表按新完成在上、历史完成在下排列；标记首项为已验收后选择下一条较旧待办，标记其他位置后选择相邻较新待办，树补全项不参与目标计算，且选择只在服务器确认成功后切换。验收请求期间允许浏览其他任务；若用户在服务器确认前产生较新的选择，成功回调保留该选择而不执行旧任务的自动相邻切换。Work 新建待办 Sheet 在执行人控件下根据执行人与状态原位解释 Automation 资格。跨产品替换、主窗口和 Case 绑定恢复的既有交互保持不变。应用冷启动检查全部关联本地项目；新增或改变本地关联及用户主动重试再次检查。项目集全部、具体项目、Workset 或其它纯查看切换只改变业务投影，不进入 Setup；解除关联和 task start 不重新扫描 skills。task start 缓存断言失败时返回 Setup，等待用户主动重新检查。Setup 冲突页逐项显示稳定 code、skill、目标类型与路径及双方 digest；兜底覆盖默认全不选，支持逐项或全选可恢复项，独立确认 recovery root 与 fresh assessment digest，并反馈备份、替换、回滚和残留状态。Feedback 已忽略且未关联待办的详情显示“恢复为待处理”；动作无需二次确认，提交期间锁定自身，只有服务端确认 pending 后更新状态，失败时保持 ignored、筛选、选择和滚动位置。 受支持旧版本覆盖安装后，Automation 先恢复 Catalog 项目行并保留 Workset、绑定和项目授权，再逐项目显示正在恢复、同步异常或可执行；用户无需退出登录、清缓存或重新添加项目。 Automation 顶层责任只区分可自行继续与需要人工介入；external、recovery、configuration 与 CLI 保留为原因或处理场所，任何必须由操作者动作触发的下一步都显示 Human。external dependency 创建 attention，并通过“已处理，重新检查”恢复同一 task session/thread。",
              "reason": "当前 Case 收束了 Automation 的用户责任模型并消除了无主 external wait。",
              "evidence": [
                "Current operator input, 2026-08-27",
                "arckit/interaction/automation-workspace/interaction.md",
                "arckit/interaction/automation-workspace/default.html",
                "runtime/arcorbit/desktop/renderer/renderer.js"
              ],
              "confidence": "high",
              "resume_condition": "当 Automation 顶层责任分类、介入原因类型或恢复动作边界改变时重审。"
            },
            "gap_refs": [],
            "reason": "Record the clarified binary user-facing responsibility model.",
            "evidence": [
              "Current operator input, 2026-08-27",
              "arckit/interaction/automation-workspace/interaction.md",
              "runtime/arcorbit/desktop/renderer/renderer.js"
            ]
          },
          {
            "area_ref": "technical_foundation",
            "observed_revision": 42,
            "set_decision": {
              "status": "settled",
              "statement": "Arckit 与 ArcOrbit 的既有 ledger、Electron、Runtime、Platform Coordinator、Work Sync、Chat、Setup Readiness 和 trusted case-control 技术边界保持不变。Work Inspector 偏好继续由 Desktop Store、typed preload action 和 Renderer 持有。应用冷启动的 coordinated Setup Readiness 由 main process fresh-read Desktop Store 中全部本地 Product Workspace roots；新增或改变本地关联及用户主动 retry 使用相同 aggregate check，显式空 roots 清除既有 project plan 并执行 global-only。Renderer 项目/Workset 筛选不触发检查，解除关联跳过检查。SkillProvisioningManager.assertReady(projectRoot) 只读取内存 snapshot，要求 ready 且 project root 位于最近成功检查的 plan.project_roots；Chat/Automation task start 不调用 provider 或扫描 skills。SkillProvisioningManager 的 plan、drift、同名冲突诊断和 backup-and-overwrite-selected 事务边界保持不变。Feedback V1 恢复通过受控 update 同时写入 ignored=false、feedback_state=pending 和 status=analyzing；V2 恢复由 Platform Adapter、Coordinator、main IPC、preload 和 Renderer 的 restoreFeedbackV2 typed action 链调用固定 provider route，并只在服务端确认后刷新投影。 新版启动必须执行有代际的 rehydration：规范化旧 Store、刷新可访问 Catalog、按需求集合协调对账并在 dispatch 前只开放健康项目。任务与标签独立确认；重建期间新增需求必须触发后续一轮，不能被进行中的 reconcile 吞掉。 Case/Loop 继续保留 external_wait 作为内部停止原因；Automation Coordinator 将其确定性投影为 awaiting_human + external_dependency，Store 迁移旧 external_wait 并补建 attention，typed confirm-external-dependency IPC 校验 execution 后复用原 session/thread。",
              "reason": "当前 Case 明确区分了协议内部原因和 Desktop 用户责任投影。",
              "evidence": [
                "arckit/tech/arcorbit/desktop-execution-solution.md",
                "runtime/arcorbit/src/automation-coordinator.mjs",
                "runtime/arcorbit/src/desktop/desktop-store.mjs",
                "runtime/arcorbit/desktop/main.mjs",
                "runtime/arcorbit/desktop/preload.cjs"
              ],
              "confidence": "high",
              "resume_condition": "当 Loop handoff 协议、Desktop intervention store schema 或同线程恢复边界改变时重审。"
            },
            "gap_refs": [
              "GAP-runtime-resilience-and-adapters"
            ],
            "reason": "Persist the internal-protocol versus user-responsibility projection boundary.",
            "evidence": [
              "arckit/tech/arcorbit/desktop-execution-solution.md",
              "runtime/arcorbit/src/automation-coordinator.mjs",
              "runtime/arcorbit/src/desktop/desktop-store.mjs"
            ]
          }
        ],
        "software_invariant_changes": [],
        "project_gap_changes": [],
        "selection_context_change": null,
        "evidence": [
          "runtime/arcorbit/src/automation-coordinator.mjs",
          "runtime/arcorbit/src/desktop/desktop-store.mjs",
          "runtime/arcorbit/desktop/renderer/renderer.js",
          "runtime/arcorbit/desktop/main.mjs",
          "runtime/arcorbit/desktop/preload.cjs",
          "runtime/arcorbit/test/automation-coordinator.test.mjs",
          "runtime/arcorbit/test/desktop-store.test.mjs",
          "runtime/arcorbit/test/desktop-renderer.test.mjs",
          "arckit/interaction/automation-workspace/interaction.md",
          "arckit/tech/arcorbit/desktop-execution-solution.md",
          "Verification: focused Automation/Store/Renderer suite 129 passed, 0 failed",
          "Verification: non-GUI ArcOrbit suite 538 tests; 517 passed, 21 skipped, 0 failed",
          "Verification: full default suite only two pre-assertion Electron SIGABRT failures",
          "Verification: syntax checks and git diff --check passed"
        ]
      },
      "invariant_assessment": {
        "project_revision": 308,
        "judgments": [
          {
            "invariant_ref": "product-expectations-remain-recoverable",
            "disposition": "not_relevant",
            "reason": "This correction changes responsibility projection, not product scope or capability requirements.",
            "fact_refs": [],
            "evidence": [],
            "gap_refs": []
          },
          {
            "invariant_ref": "interaction-expectations-remain-recoverable",
            "disposition": "upheld",
            "reason": "Stable interaction documentation and Renderer behavior express the same Human boundary, cause, recovery condition, and action.",
            "fact_refs": [
              "FACT-20260827-004-002"
            ],
            "evidence": [
              "arckit/interaction/automation-workspace/interaction.md",
              "arckit/interaction/automation-workspace/default.html",
              "runtime/arcorbit/desktop/renderer/renderer.js"
            ],
            "gap_refs": []
          },
          {
            "invariant_ref": "visual-language-remains-consistent",
            "disposition": "not_relevant",
            "reason": "The change reuses existing attention, status, button, and workbench components without altering visual tokens.",
            "fact_refs": [],
            "evidence": [],
            "gap_refs": []
          },
          {
            "invariant_ref": "technical-decisions-remain-explainable",
            "disposition": "upheld",
            "reason": "The internal external handoff, Desktop intervention projection, legacy migration, typed IPC, and same-thread resume are directly traceable.",
            "fact_refs": [
              "FACT-20260827-004-002"
            ],
            "evidence": [
              "arckit/tech/arcorbit/desktop-execution-solution.md",
              "runtime/arcorbit/src/automation-coordinator.mjs",
              "runtime/arcorbit/src/desktop/desktop-store.mjs",
              "runtime/arcorbit/desktop/main.mjs"
            ],
            "gap_refs": []
          },
          {
            "invariant_ref": "accepted-facts-are-realized",
            "disposition": "upheld",
            "reason": "Production behavior now realizes the accepted binary Automation responsibility fact.",
            "fact_refs": [
              "FACT-20260827-004-001",
              "FACT-20260827-004-002"
            ],
            "evidence": [
              "runtime/arcorbit/src/automation-coordinator.mjs",
              "runtime/arcorbit/src/desktop/desktop-store.mjs",
              "runtime/arcorbit/desktop/renderer/renderer.js",
              "runtime/arcorbit/desktop/main.mjs",
              "runtime/arcorbit/desktop/preload.cjs",
              "runtime/arcorbit/test/automation-coordinator.test.mjs",
              "runtime/arcorbit/test/desktop-store.test.mjs",
              "runtime/arcorbit/test/desktop-renderer.test.mjs",
              "arckit/interaction/automation-workspace/interaction.md",
              "arckit/tech/arcorbit/desktop-execution-solution.md",
              "Verification: focused Automation/Store/Renderer suite 129 passed, 0 failed",
              "Verification: non-GUI ArcOrbit suite 538 tests; 517 passed, 21 skipped, 0 failed",
              "Verification: full default suite only two pre-assertion Electron SIGABRT failures",
              "Verification: syntax checks and git diff --check passed"
            ],
            "gap_refs": []
          },
          {
            "invariant_ref": "material-risks-have-credible-evidence",
            "disposition": "upheld",
            "reason": "Live, detached, restart migration, confirmation, IPC, Renderer, and broad non-GUI regression paths are covered; Electron launch-only failures are isolated before assertions.",
            "fact_refs": [
              "FACT-20260827-004-002"
            ],
            "evidence": [
              "runtime/arcorbit/src/automation-coordinator.mjs",
              "runtime/arcorbit/src/desktop/desktop-store.mjs",
              "runtime/arcorbit/desktop/renderer/renderer.js",
              "runtime/arcorbit/desktop/main.mjs",
              "runtime/arcorbit/desktop/preload.cjs",
              "runtime/arcorbit/test/automation-coordinator.test.mjs",
              "runtime/arcorbit/test/desktop-store.test.mjs",
              "runtime/arcorbit/test/desktop-renderer.test.mjs",
              "arckit/interaction/automation-workspace/interaction.md",
              "arckit/tech/arcorbit/desktop-execution-solution.md",
              "Verification: focused Automation/Store/Renderer suite 129 passed, 0 failed",
              "Verification: non-GUI ArcOrbit suite 538 tests; 517 passed, 21 skipped, 0 failed",
              "Verification: full default suite only two pre-assertion Electron SIGABRT failures",
              "Verification: syntax checks and git diff --check passed"
            ],
            "gap_refs": []
          }
        ]
      },
      "evidence": [
        "runtime/arcorbit/src/automation-coordinator.mjs",
        "runtime/arcorbit/src/desktop/desktop-store.mjs",
        "runtime/arcorbit/desktop/renderer/renderer.js",
        "runtime/arcorbit/desktop/main.mjs",
        "runtime/arcorbit/desktop/preload.cjs",
        "runtime/arcorbit/test/automation-coordinator.test.mjs",
        "runtime/arcorbit/test/desktop-store.test.mjs",
        "runtime/arcorbit/test/desktop-renderer.test.mjs",
        "arckit/interaction/automation-workspace/interaction.md",
        "arckit/tech/arcorbit/desktop-execution-solution.md",
        "Verification: focused Automation/Store/Renderer suite 129 passed, 0 failed",
        "Verification: non-GUI ArcOrbit suite 538 tests; 517 passed, 21 skipped, 0 failed",
        "Verification: full default suite only two pre-assertion Electron SIGABRT failures",
        "Verification: syntax checks and git diff --check passed"
      ],
      "runtime_result_ref": "",
      "occurred_at": "2026-08-27T06:32:18.228Z"
    },
    {
      "round": 2,
      "transition_schema_version": "arckit-case-transition/v8",
      "goal": "Perform the implementation-focused Completion Review.",
      "outcome": "completed",
      "gap_selection": {
        "mode": "candidate",
        "basis": "All ordinary obligations are closed, so the generated Completion Review is the only ready Agent candidate for this Case.",
        "snapshot_token": "f90a7f6a9516ab09ab7436a372ba83a2494fc5c22babe7639a7802e9d4a681f2",
        "selected_ref": "case-gap:CASE-20260827-004:CASE-20260827-004:completion-review:1",
        "comparison_summary": "Compared the four separate Project gaps, the unrelated Feedback provider Case gap, and this Case Completion Review; only the review can close the current bounded correction.",
        "fresh_discovery_summary": "No fresh defect or missing obligation was found during implementation-focused review.",
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
            "reason": "This Project gap remains separate from the completed correction."
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
            "reason": "This Project gap remains separate from the completed correction."
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
            "reason": "This Project gap remains separate from the completed correction."
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
            "reason": "This Project gap remains separate from the completed correction."
          },
          {
            "ref": "case-gap:CASE-20260826-013:GAP-20260826-013-003",
            "source": "persisted",
            "eligibility": "ready",
            "disposition": "excluded",
            "priority_basis": {
              "blocking": "阻塞 V2 反馈恢复在真实环境可用。",
              "uncertainty": "服务端实现仓库不在当前授权 workspace。",
              "risk": "若没有状态前置校验和权限验证，可能覆盖并发更新或扩大 mutation 权限。",
              "user_impact": "V2 项目的误忽略仍无法恢复。"
            },
            "reason": "This provider obligation belongs to another active Case."
          },
          {
            "ref": "case-gap:CASE-20260827-004:CASE-20260827-004:completion-review:1",
            "source": "persisted",
            "eligibility": "ready",
            "disposition": "selected",
            "priority_basis": {
              "blocking": "high",
              "uncertainty": "low",
              "risk": "high",
              "user_impact": "high"
            },
            "reason": "This is the required implementation-focused Completion Review."
          }
        ]
      },
      "selected_gap": {
        "id": "CASE-20260827-004:completion-review:1",
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
        "goal": "Perform the implementation-focused Completion Review.",
        "expected_state_change": "Record a clean review and resolve the Case."
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
            "runtime/arcorbit/src/automation-coordinator.mjs",
            "runtime/arcorbit/src/desktop/desktop-store.mjs",
            "runtime/arcorbit/desktop/renderer/renderer.js",
            "runtime/arcorbit/desktop/main.mjs",
            "runtime/arcorbit/desktop/preload.cjs",
            "runtime/arcorbit/test/automation-coordinator.test.mjs",
            "runtime/arcorbit/test/desktop-store.test.mjs",
            "runtime/arcorbit/test/desktop-renderer.test.mjs",
            "arckit/interaction/automation-workspace/interaction.md",
            "arckit/interaction/automation-workspace/default.html",
            "arckit/tech/arcorbit/desktop-execution-solution.md",
            "Verification: focused Automation/Store/Renderer suite 129 passed, 0 failed",
            "Verification: non-GUI ArcOrbit suite 538 tests; 517 passed, 21 skipped, 0 failed",
            "Verification: full default suite only two pre-assertion Electron SIGABRT failures",
            "Verification: syntax checks and git diff --check passed"
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
        "project_revision": 309,
        "judgments": [
          {
            "invariant_ref": "product-expectations-remain-recoverable",
            "disposition": "not_relevant",
            "reason": "Completion Review confirms no product scope change.",
            "fact_refs": [],
            "evidence": [],
            "gap_refs": []
          },
          {
            "invariant_ref": "interaction-expectations-remain-recoverable",
            "disposition": "upheld",
            "reason": "The documented and implemented responsibility behavior remains aligned after review.",
            "fact_refs": [
              "FACT-20260827-004-002"
            ],
            "evidence": [
              "arckit/interaction/automation-workspace/interaction.md",
              "runtime/arcorbit/desktop/renderer/renderer.js",
              "runtime/arcorbit/test/desktop-renderer.test.mjs"
            ],
            "gap_refs": []
          },
          {
            "invariant_ref": "visual-language-remains-consistent",
            "disposition": "not_relevant",
            "reason": "Review confirms no new visual language or tokens were introduced.",
            "fact_refs": [],
            "evidence": [],
            "gap_refs": []
          },
          {
            "invariant_ref": "technical-decisions-remain-explainable",
            "disposition": "upheld",
            "reason": "Review found the internal protocol and Desktop responsibility projection explicit and traceable.",
            "fact_refs": [
              "FACT-20260827-004-002"
            ],
            "evidence": [
              "arckit/tech/arcorbit/desktop-execution-solution.md",
              "runtime/arcorbit/src/automation-coordinator.mjs",
              "runtime/arcorbit/src/desktop/desktop-store.mjs"
            ],
            "gap_refs": []
          },
          {
            "invariant_ref": "accepted-facts-are-realized",
            "disposition": "upheld",
            "reason": "Review confirms every accepted responsibility fact is realized with no remaining Case gap.",
            "fact_refs": [
              "FACT-20260827-004-001",
              "FACT-20260827-004-002"
            ],
            "evidence": [
              "runtime/arcorbit/src/automation-coordinator.mjs",
              "runtime/arcorbit/src/desktop/desktop-store.mjs",
              "runtime/arcorbit/desktop/renderer/renderer.js",
              "runtime/arcorbit/desktop/main.mjs",
              "runtime/arcorbit/desktop/preload.cjs",
              "runtime/arcorbit/test/automation-coordinator.test.mjs",
              "runtime/arcorbit/test/desktop-store.test.mjs",
              "runtime/arcorbit/test/desktop-renderer.test.mjs",
              "arckit/interaction/automation-workspace/interaction.md",
              "arckit/interaction/automation-workspace/default.html",
              "arckit/tech/arcorbit/desktop-execution-solution.md",
              "Verification: focused Automation/Store/Renderer suite 129 passed, 0 failed",
              "Verification: non-GUI ArcOrbit suite 538 tests; 517 passed, 21 skipped, 0 failed",
              "Verification: full default suite only two pre-assertion Electron SIGABRT failures",
              "Verification: syntax checks and git diff --check passed"
            ],
            "gap_refs": []
          },
          {
            "invariant_ref": "material-risks-have-credible-evidence",
            "disposition": "upheld",
            "reason": "Review confirms focused and broad regressions cover the material state, migration, and resume risks.",
            "fact_refs": [
              "FACT-20260827-004-002"
            ],
            "evidence": [
              "runtime/arcorbit/src/automation-coordinator.mjs",
              "runtime/arcorbit/src/desktop/desktop-store.mjs",
              "runtime/arcorbit/desktop/renderer/renderer.js",
              "runtime/arcorbit/desktop/main.mjs",
              "runtime/arcorbit/desktop/preload.cjs",
              "runtime/arcorbit/test/automation-coordinator.test.mjs",
              "runtime/arcorbit/test/desktop-store.test.mjs",
              "runtime/arcorbit/test/desktop-renderer.test.mjs",
              "arckit/interaction/automation-workspace/interaction.md",
              "arckit/interaction/automation-workspace/default.html",
              "arckit/tech/arcorbit/desktop-execution-solution.md",
              "Verification: focused Automation/Store/Renderer suite 129 passed, 0 failed",
              "Verification: non-GUI ArcOrbit suite 538 tests; 517 passed, 21 skipped, 0 failed",
              "Verification: full default suite only two pre-assertion Electron SIGABRT failures",
              "Verification: syntax checks and git diff --check passed"
            ],
            "gap_refs": []
          }
        ]
      },
      "evidence": [
        "runtime/arcorbit/src/automation-coordinator.mjs",
        "runtime/arcorbit/src/desktop/desktop-store.mjs",
        "runtime/arcorbit/desktop/renderer/renderer.js",
        "runtime/arcorbit/desktop/main.mjs",
        "runtime/arcorbit/desktop/preload.cjs",
        "runtime/arcorbit/test/automation-coordinator.test.mjs",
        "runtime/arcorbit/test/desktop-store.test.mjs",
        "runtime/arcorbit/test/desktop-renderer.test.mjs",
        "arckit/interaction/automation-workspace/interaction.md",
        "arckit/interaction/automation-workspace/default.html",
        "arckit/tech/arcorbit/desktop-execution-solution.md",
        "Verification: focused Automation/Store/Renderer suite 129 passed, 0 failed",
        "Verification: non-GUI ArcOrbit suite 538 tests; 517 passed, 21 skipped, 0 failed",
        "Verification: full default suite only two pre-assertion Electron SIGABRT failures",
        "Verification: syntax checks and git diff --check passed"
      ],
      "runtime_result_ref": "",
      "occurred_at": "2026-08-27T06:34:45.808Z"
    }
  ],
  "case_resolution": {
    "status": "resolved",
    "stage": "resolved",
    "satisfied": [
      "GAP-20260827-004-001"
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
    "updated_at": "2026-08-27T06:34:45.808Z"
  }
}
```

## Round Notes

- Case history is canonical in Structured Record.rounds; keep prose notes exceptional.
