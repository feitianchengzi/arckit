# Enable task editing in the Today detail pane

Case: CASE-20260904-003
Status: closed
Artifact Type: mixed
Selected Gap: none
Updated: 2026-09-04T15:50:03.397Z

## User Intent

ArcOrbit Today 页面第三栏的待办详情需要提供编辑能力，使用户能够直接修正有问题的待办内容。

## Structured Record

```json
{
  "schema_version": "development-case-record/v5",
  "id": "CASE-20260904-003",
  "title": "Enable task editing in the Today detail pane",
  "status": "closed",
  "artifact_type": "mixed",
  "created_at": "2026-09-04T15:26:14.138Z",
  "updated_at": "2026-09-04T15:50:03.397Z",
  "user_intent": "ArcOrbit Today 页面第三栏的待办详情需要提供编辑能力，使用户能够直接修正有问题的待办内容。",
  "expected_outcome": "Today 第三栏对当前用户可管理的 Work 待办显示编辑入口，复用既有编辑 Sheet 和服务端确认的 task.update 路径；保存成功后刷新可信详情，失败时保留编辑内容和当前 Today 上下文，非 Work 责任或不可管理待办不暴露该入口。",
  "project_state_ref": "arckit/project/state.record.json",
  "current_round": {
    "goal": "",
    "selected_gap": null
  },
  "facts": [
    {
      "id": "FACT-20260904-003-001",
      "revision": 1,
      "status": "accepted",
      "statement": "ArcOrbit Today 页面第三栏的 Work 待办详情需要增加编辑能力，以便当前用户直接修正问题待办的内容。",
      "basis": "当前操作者明确提出的产品需求。",
      "evidence": [
        "Current operator input, 2026-09-04"
      ]
    },
    {
      "id": "FACT-20260904-003-002",
      "revision": 1,
      "status": "accepted",
      "statement": "Today 的 Work 责任详情当前展示完整待办上下文和状态动作但没有编辑入口；Work Inspector 已存在受任务管理权限约束的编辑入口、完整编辑 Sheet，以及通过 task.update 等待服务器确认的 mutation 路径。",
      "basis": "当前 Renderer 与 Platform Coordinator 实现直接表明缺失点和可复用边界。",
      "evidence": [
        "runtime/arcorbit/desktop/renderer/renderer.js: renderTodayOperator/renderTodaySourceContext",
        "runtime/arcorbit/desktop/renderer/renderer.js: renderPlatformWorkInspector/editTask/submitTaskEdit",
        "runtime/arcorbit/src/platform-coordinator.mjs: task.update"
      ]
    },
    {
      "id": "FACT-20260904-003-003",
      "revision": 1,
      "status": "accepted",
      "statement": "ArcOrbit Today 的第三栏已为可管理的 Work 责任待办实现内容专用编辑入口：它复用共享 Sheet 和 Work-owned task.update 服务器确认路径，不依赖当前 Workset 的成员、标签或父任务目录；成功保持责任 identity 并刷新可信内容，失败保留编辑内容、选择和阅读上下文。",
      "basis": "稳定交互源、生产 Renderer 实现、Work/Today 投影边界和真实 Electron 成功及冲突路径验证一致。",
      "evidence": [
        "arckit/interaction/today-workspace/interaction.md:14",
        "arckit/interaction/today-workspace/interaction.md:168",
        "arckit/interaction/today-workspace/action-details.html:17",
        "arckit/interaction/today-workspace/action-details.html:19",
        "runtime/arcorbit/desktop/renderer/renderer.js:1801",
        "runtime/arcorbit/desktop/renderer/renderer.js:1855",
        "runtime/arcorbit/desktop/renderer/renderer.js:3367",
        "runtime/arcorbit/desktop/renderer/renderer.js:4069",
        "runtime/arcorbit/test/today-task-edit-electron.test.mjs:12",
        "ARCORBIT_ELECTRON_TODAY_TASK_EDIT_TEST=1 node --test runtime/arcorbit/test/today-task-edit-electron.test.mjs: 1 passed, 0 failed"
      ]
    }
  ],
  "state_impacts": [
    {
      "id": "IMPACT-20260904-003-001",
      "fact_id": "FACT-20260904-003-001",
      "fact_revision": 1,
      "target": {
        "kind": "software_decision",
        "ref": "product_capabilities",
        "revision": 42
      },
      "effect": "upheld",
      "reason": "Today 已能让当前用户直接修正明确交给自己的 Work 待办内容，同时保持 Work 对 mutation 和可信投影的所有权。",
      "gap_ids": [],
      "evidence": [
        "runtime/arcorbit/desktop/renderer/renderer.js",
        "runtime/arcorbit/test/today-task-edit-electron.test.mjs",
        "npm run check --workspace @arckit/arcorbit: 596 tests, 571 passed, 25 skipped, 0 failed"
      ]
    },
    {
      "id": "IMPACT-20260904-003-002",
      "fact_id": "FACT-20260904-003-001",
      "fact_revision": 1,
      "target": {
        "kind": "software_decision",
        "ref": "experience_and_interaction",
        "revision": 65
      },
      "effect": "upheld",
      "reason": "Today 稳定交互源已完整定义入口、内容专用 Sheet、权限边界、服务器确认、成功原位刷新和失败上下文保留，并由生产实现兑现。",
      "gap_ids": [],
      "evidence": [
        "arckit/interaction/today-workspace/interaction.md",
        "arckit/interaction/today-workspace/action-details.html",
        "arckit/interaction/_map/feature-matrix.md",
        "runtime/arcorbit/desktop/renderer/renderer.js",
        "runtime/arcorbit/test/today-task-edit-electron.test.mjs"
      ]
    }
  ],
  "gaps": [
    {
      "id": "GAP-20260904-003-001",
      "status": "resolved",
      "goal": "为 Today 第三栏中当前用户可管理的 Work 待办建立并实现内容编辑交互，复用既有编辑 Sheet 和服务器确认 mutation，并验证权限、成功刷新及失败保留上下文。",
      "reason": "用户需求和当前实现已经明确缺失能力及可复用路径；需要同步稳定交互事实、Renderer 入口和回归证据，才能可信兑现内容修正能力。",
      "derived_from": [
        "FACT-20260904-003-001",
        "FACT-20260904-003-002"
      ],
      "blocked_by": [],
      "priority_basis": {
        "blocking": "阻止用户在 Today 直接修正问题待办",
        "uncertainty": "低；既有 Work 编辑能力可复用，但必须保持权限与 Today 上下文语义",
        "risk": "中；错误接线可能绕过权限或在刷新/失败时丢失选择与草稿",
        "user_impact": "高；直接解决当前提出的内容纠错需求"
      },
      "responsibility": "agent",
      "evidence_required": [
        "更新 arckit/interaction/today-workspace/ 下的稳定交互源及对应线框投影",
        "Today 仅为可管理的 Work 责任待办显示编辑入口",
        "编辑复用既有 Sheet 与 task.update 服务端确认路径",
        "成功后 Today 详情反映可信内容，失败时保留编辑内容、当前选择和阅读上下文",
        "相关 Renderer、Today workspace 和必要 Electron 回归测试通过"
      ],
      "resolution": {
        "id": "GAP-20260904-003-001",
        "status": "resolved",
        "outcome": "Today 第三栏现在只为可管理的 Work 责任项显示“编辑待办”；内容专用共享 Sheet 预填当前内容，以 Task identity 和 expected_state 调用 Work-owned task.update。服务器确认后同一责任项原位刷新；失败时 Sheet、编辑内容、选择和阅读上下文均保留。",
        "reason": "稳定交互源、Renderer 实现、权限短路边界、共享 Sheet 提交行为、完整 ArcOrbit 校验和真实 Electron 成功及冲突回归共同满足全部证据要求。",
        "evidence": [
          "arckit/interaction/today-workspace/interaction.md",
          "arckit/interaction/today-workspace/action-details.html",
          "arckit/interaction/INDEX.md",
          "arckit/interaction/_map/feature-matrix.md",
          "arckit/interaction/_map/RELATIONS.md",
          "runtime/arcorbit/desktop/renderer/renderer.js",
          "runtime/arcorbit/test/desktop-renderer.test.mjs",
          "runtime/arcorbit/test/today-workspace.test.mjs",
          "runtime/arcorbit/test/platform-coordinator.test.mjs",
          "runtime/arcorbit/test/today-task-edit-electron.test.mjs",
          "npm run check --workspace @arckit/arcorbit: 596 tests, 571 passed, 25 skipped, 0 failed",
          "ARCORBIT_ELECTRON_TODAY_TASK_EDIT_TEST=1 node --test runtime/arcorbit/test/today-task-edit-electron.test.mjs: 1 passed, 0 failed",
          "git diff --check: passed",
          "action-details structural check: 11 states, one canvas/frame each"
        ],
        "occurred_at": "2026-09-04T15:48:02.303Z"
      }
    }
  ],
  "content_revision": 1,
  "completion_review": {
    "status": "clean",
    "policy": {
      "initial_max_cycles": 10,
      "source": "runtime/arcorbit/config/case-policy.json",
      "snapshotted_at": "2026-09-04T15:26:14.138Z"
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
          "Reviewed content revision 1 and the complete scoped implementation diff",
          "runtime/arcorbit/desktop/renderer/renderer.js: Today entry, content-only Sheet, task.update and permission short-circuit",
          "arckit/interaction/today-workspace/interaction.md",
          "arckit/interaction/today-workspace/action-details.html",
          "runtime/arcorbit/test/desktop-renderer.test.mjs",
          "runtime/arcorbit/test/fixtures/today-task-edit-electron.mjs",
          "runtime/arcorbit/test/today-task-edit-electron.test.mjs",
          "node --test runtime/arcorbit/test/desktop-renderer.test.mjs runtime/arcorbit/test/today-workspace.test.mjs runtime/arcorbit/test/platform-coordinator.test.mjs: 88 passed, 0 failed",
          "ARCORBIT_ELECTRON_TODAY_TASK_EDIT_TEST=1 node --test runtime/arcorbit/test/today-task-edit-electron.test.mjs outside sandbox: 1 passed, 0 failed",
          "npm run check --workspace @arckit/arcorbit: 596 tests, 571 passed, 25 skipped, 0 failed",
          "git diff --check: passed"
        ],
        "occurred_at": "2026-09-04T15:50:03.397Z"
      }
    ],
    "evidence": [
      "Reviewed content revision 1 and the complete scoped implementation diff",
      "runtime/arcorbit/desktop/renderer/renderer.js: Today entry, content-only Sheet, task.update and permission short-circuit",
      "arckit/interaction/today-workspace/interaction.md",
      "arckit/interaction/today-workspace/action-details.html",
      "runtime/arcorbit/test/desktop-renderer.test.mjs",
      "runtime/arcorbit/test/fixtures/today-task-edit-electron.mjs",
      "runtime/arcorbit/test/today-task-edit-electron.test.mjs",
      "node --test runtime/arcorbit/test/desktop-renderer.test.mjs runtime/arcorbit/test/today-workspace.test.mjs runtime/arcorbit/test/platform-coordinator.test.mjs: 88 passed, 0 failed",
      "ARCORBIT_ELECTRON_TODAY_TASK_EDIT_TEST=1 node --test runtime/arcorbit/test/today-task-edit-electron.test.mjs outside sandbox: 1 passed, 0 failed",
      "npm run check --workspace @arckit/arcorbit: 596 tests, 571 passed, 25 skipped, 0 failed",
      "git diff --check: passed"
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
      "goal": "接受已经实现并验证的 Today Work 待办内容编辑能力，以稳定交互事实、服务器确认和失败恢复证据解决选定 Gap。",
      "outcome": "completed",
      "gap_selection": {
        "mode": "candidate",
        "basis": "基于 2026-09-04T15:46:35.293Z fresh trusted snapshot 的完整候选目录、当前 Project focus 与用户原始需求重新比较；当前 Case 的候选身份、readiness 和事实均未变化，Today 编辑 Gap 仍是唯一直接兑现当前高影响需求且由 Agent 可完成的 Case Gap。",
        "snapshot_token": "8b26cef9bb5580d65b9dac24bf8369ad51e8ea751be16c42627c64d82b59fefb",
        "selected_ref": "case-gap:CASE-20260904-003:GAP-20260904-003-001",
        "comparison_summary": "重新选择 Today 待办编辑 Gap。四个 Project Gap 均需独立 Case；旧 monorepo Case Gap 由 human 负责发布授权。它们均不应抢占当前明确的 Today 高用户影响事项。",
        "fresh_discovery_summary": "fresh canonical state 未增加或改变候选；既有实现证据仍支持本 Gap，未发现需要优先处理的 fresh Gap。",
        "considered": [
          {
            "ref": "project-gap:GAP-agent-scenario-evaluation",
            "source": "persisted",
            "eligibility": "case_required",
            "disposition": "deferred",
            "priority_basis": {
              "blocking": "不阻塞当前 Today 内容纠偏",
              "uncertainty": "高",
              "risk": "高",
              "user_impact": "间接"
            },
            "reason": "需要独立真实场景 Case，不能并入当前 Today 功能 Case。"
          },
          {
            "ref": "project-gap:GAP-runtime-resilience-and-adapters",
            "source": "persisted",
            "eligibility": "case_required",
            "disposition": "deferred",
            "priority_basis": {
              "blocking": "不阻塞当前 Today 内容纠偏",
              "uncertainty": "中",
              "risk": "高",
              "user_impact": "间接"
            },
            "reason": "Runtime 韧性与 adapter 验收需要独立 Case。"
          },
          {
            "ref": "project-gap:GAP-security-real-project-validation",
            "source": "persisted",
            "eligibility": "case_required",
            "disposition": "deferred",
            "priority_basis": {
              "blocking": "不阻塞当前 Today 内容纠偏",
              "uncertainty": "中",
              "risk": "高",
              "user_impact": "间接"
            },
            "reason": "真实权限项目验证需要独立受控 Case。"
          },
          {
            "ref": "project-gap:GAP-cross-record-audit",
            "source": "persisted",
            "eligibility": "case_required",
            "disposition": "deferred",
            "priority_basis": {
              "blocking": "不阻塞当前 Today 内容纠偏",
              "uncertainty": "中",
              "risk": "高",
              "user_impact": "间接"
            },
            "reason": "跨记录审计虽紧急，但需要独立 Case；当前用户请求具有更直接的产品影响。"
          },
          {
            "ref": "case-gap:CASE-20260901-001:GAP-20260901-001-005",
            "source": "persisted",
            "eligibility": "ready",
            "disposition": "excluded",
            "priority_basis": {
              "blocking": "阻塞公开发布，不阻塞 Today 实现",
              "uncertainty": "取决于 owner/provider",
              "risk": "高",
              "user_impact": "与当前请求无直接关系"
            },
            "reason": "该 Gap 的责任方是 human，Agent 无法通过本地实现完成凭据、许可和发布授权。"
          },
          {
            "ref": "case-gap:CASE-20260904-003:GAP-20260904-003-001",
            "source": "persisted",
            "eligibility": "ready",
            "disposition": "selected",
            "priority_basis": {
              "blocking": "阻止用户在 Today 直接修正问题待办",
              "uncertainty": "低；既有 Sheet 与 task.update 可复用",
              "risk": "中；需保护权限和上下文连续性",
              "user_impact": "高；直接兑现当前需求"
            },
            "reason": "fresh state 中唯一与 Project focus 和原始需求完全一致、无阻塞且由 Agent 负责的 ready Gap。"
          }
        ]
      },
      "selected_gap": {
        "id": "GAP-20260904-003-001",
        "responsibility": "agent",
        "goal": "为 Today 第三栏中当前用户可管理的 Work 待办建立并实现内容编辑交互，复用既有编辑 Sheet 和服务器确认 mutation，并验证权限、成功刷新及失败保留上下文。",
        "reason": "用户需求和当前实现已经明确缺失能力及可复用路径；需要同步稳定交互事实、Renderer 入口和回归证据，才能可信兑现内容修正能力。",
        "derived_from": [
          "FACT-20260904-003-001",
          "FACT-20260904-003-002"
        ],
        "blocked_by": [],
        "priority_basis": {
          "blocking": "阻止用户在 Today 直接修正问题待办",
          "uncertainty": "低；既有 Work 编辑能力可复用，但必须保持权限与 Today 上下文语义",
          "risk": "中；错误接线可能绕过权限或在刷新/失败时丢失选择与草稿",
          "user_impact": "高；直接解决当前提出的内容纠错需求"
        },
        "evidence_required": [
          "更新 arckit/interaction/today-workspace/ 下的稳定交互源及对应线框投影",
          "Today 仅为可管理的 Work 责任待办显示编辑入口",
          "编辑复用既有 Sheet 与 task.update 服务端确认路径",
          "成功后 Today 详情反映可信内容，失败时保留编辑内容、当前选择和阅读上下文",
          "相关 Renderer、Today workspace 和必要 Electron 回归测试通过"
        ]
      },
      "planned_transition": {
        "goal": "接受已经实现并验证的 Today Work 待办内容编辑能力，以稳定交互事实、服务器确认和失败恢复证据解决选定 Gap。",
        "expected_state_change": "Today 的 product/interaction impacts 从 threatened 更新为 upheld，选定 Gap resolved；写回后由独立 post-commit fresh read 决定下一候选。"
      },
      "accepted_state_delta": {
        "resolved_gap": {
          "id": "GAP-20260904-003-001",
          "status": "resolved",
          "outcome": "Today 第三栏现在只为可管理的 Work 责任项显示“编辑待办”；内容专用共享 Sheet 预填当前内容，以 Task identity 和 expected_state 调用 Work-owned task.update。服务器确认后同一责任项原位刷新；失败时 Sheet、编辑内容、选择和阅读上下文均保留。",
          "reason": "稳定交互源、Renderer 实现、权限短路边界、共享 Sheet 提交行为、完整 ArcOrbit 校验和真实 Electron 成功及冲突回归共同满足全部证据要求。",
          "evidence": [
            "arckit/interaction/today-workspace/interaction.md",
            "arckit/interaction/today-workspace/action-details.html",
            "arckit/interaction/INDEX.md",
            "arckit/interaction/_map/feature-matrix.md",
            "arckit/interaction/_map/RELATIONS.md",
            "runtime/arcorbit/desktop/renderer/renderer.js",
            "runtime/arcorbit/test/desktop-renderer.test.mjs",
            "runtime/arcorbit/test/today-workspace.test.mjs",
            "runtime/arcorbit/test/platform-coordinator.test.mjs",
            "runtime/arcorbit/test/today-task-edit-electron.test.mjs",
            "npm run check --workspace @arckit/arcorbit: 596 tests, 571 passed, 25 skipped, 0 failed",
            "ARCORBIT_ELECTRON_TODAY_TASK_EDIT_TEST=1 node --test runtime/arcorbit/test/today-task-edit-electron.test.mjs: 1 passed, 0 failed",
            "git diff --check: passed",
            "action-details structural check: 11 states, one canvas/frame each"
          ]
        },
        "facts_added": [
          {
            "id": "FACT-20260904-003-003",
            "revision": 1,
            "status": "accepted",
            "statement": "ArcOrbit Today 的第三栏已为可管理的 Work 责任待办实现内容专用编辑入口：它复用共享 Sheet 和 Work-owned task.update 服务器确认路径，不依赖当前 Workset 的成员、标签或父任务目录；成功保持责任 identity 并刷新可信内容，失败保留编辑内容、选择和阅读上下文。",
            "basis": "稳定交互源、生产 Renderer 实现、Work/Today 投影边界和真实 Electron 成功及冲突路径验证一致。",
            "evidence": [
              "arckit/interaction/today-workspace/interaction.md:14",
              "arckit/interaction/today-workspace/interaction.md:168",
              "arckit/interaction/today-workspace/action-details.html:17",
              "arckit/interaction/today-workspace/action-details.html:19",
              "runtime/arcorbit/desktop/renderer/renderer.js:1801",
              "runtime/arcorbit/desktop/renderer/renderer.js:1855",
              "runtime/arcorbit/desktop/renderer/renderer.js:3367",
              "runtime/arcorbit/desktop/renderer/renderer.js:4069",
              "runtime/arcorbit/test/today-task-edit-electron.test.mjs:12",
              "ARCORBIT_ELECTRON_TODAY_TASK_EDIT_TEST=1 node --test runtime/arcorbit/test/today-task-edit-electron.test.mjs: 1 passed, 0 failed"
            ]
          }
        ],
        "facts_superseded": [],
        "impacts_added": [],
        "impacts_updated": [
          {
            "id": "IMPACT-20260904-003-001",
            "fact_id": "FACT-20260904-003-001",
            "fact_revision": 1,
            "target": {
              "kind": "software_decision",
              "ref": "product_capabilities",
              "revision": 42
            },
            "effect": "upheld",
            "reason": "Today 已能让当前用户直接修正明确交给自己的 Work 待办内容，同时保持 Work 对 mutation 和可信投影的所有权。",
            "gap_ids": [],
            "evidence": [
              "runtime/arcorbit/desktop/renderer/renderer.js",
              "runtime/arcorbit/test/today-task-edit-electron.test.mjs",
              "npm run check --workspace @arckit/arcorbit: 596 tests, 571 passed, 25 skipped, 0 failed"
            ]
          },
          {
            "id": "IMPACT-20260904-003-002",
            "fact_id": "FACT-20260904-003-001",
            "fact_revision": 1,
            "target": {
              "kind": "software_decision",
              "ref": "experience_and_interaction",
              "revision": 65
            },
            "effect": "upheld",
            "reason": "Today 稳定交互源已完整定义入口、内容专用 Sheet、权限边界、服务器确认、成功原位刷新和失败上下文保留，并由生产实现兑现。",
            "gap_ids": [],
            "evidence": [
              "arckit/interaction/today-workspace/interaction.md",
              "arckit/interaction/today-workspace/action-details.html",
              "arckit/interaction/_map/feature-matrix.md",
              "runtime/arcorbit/desktop/renderer/renderer.js",
              "runtime/arcorbit/test/today-task-edit-electron.test.mjs"
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
          "arckit/interaction/today-workspace/interaction.md",
          "runtime/arcorbit/desktop/renderer/renderer.js",
          "runtime/arcorbit/test/today-task-edit-electron.test.mjs",
          "npm run check --workspace @arckit/arcorbit: 596 tests, 571 passed, 25 skipped, 0 failed"
        ]
      },
      "invariant_assessment": {
        "project_revision": 342,
        "judgments": [
          {
            "invariant_ref": "product-expectations-remain-recoverable",
            "disposition": "upheld",
            "reason": "Today 的内容纠偏能力、范围和非目标已在稳定交互源中明确记录，并与当前用户需求一致。",
            "fact_refs": [
              "FACT-20260904-003-003"
            ],
            "evidence": [
              "arckit/interaction/today-workspace/interaction.md",
              "arckit/interaction/_map/feature-matrix.md"
            ],
            "gap_refs": []
          },
          {
            "invariant_ref": "interaction-expectations-remain-recoverable",
            "disposition": "upheld",
            "reason": "入口、Sheet 字段、提交锁定、服务器确认、成功刷新、冲突恢复和上下文连续性均有可恢复文档及线框投影。",
            "fact_refs": [
              "FACT-20260904-003-003"
            ],
            "evidence": [
              "arckit/interaction/today-workspace/interaction.md",
              "arckit/interaction/today-workspace/action-details.html"
            ],
            "gap_refs": []
          },
          {
            "invariant_ref": "visual-language-remains-consistent",
            "disposition": "not_relevant",
            "reason": "实现复用既有 Today 固定操作栏、secondary button 和共享 Sheet，没有建立或修改视觉语言规则。",
            "fact_refs": [],
            "evidence": [],
            "gap_refs": []
          },
          {
            "invariant_ref": "technical-decisions-remain-explainable",
            "disposition": "upheld",
            "reason": "Today 只提供内容专用变体，从而避免依赖 Workset 内辅助目录；实际写入继续由现有 Work-owned task.update 和刷新路径负责。",
            "fact_refs": [
              "FACT-20260904-003-003"
            ],
            "evidence": [
              "runtime/arcorbit/desktop/renderer/renderer.js",
              "runtime/arcorbit/src/platform-coordinator.mjs",
              "arckit/interaction/_map/RELATIONS.md"
            ],
            "gap_refs": []
          },
          {
            "invariant_ref": "accepted-facts-are-realized",
            "disposition": "upheld",
            "reason": "用户要求和已接受的缺失能力事实已由生产 Renderer、稳定交互源及真实 Electron 行为直接兑现。",
            "fact_refs": [
              "FACT-20260904-003-001",
              "FACT-20260904-003-002",
              "FACT-20260904-003-003"
            ],
            "evidence": [
              "runtime/arcorbit/desktop/renderer/renderer.js",
              "runtime/arcorbit/test/desktop-renderer.test.mjs",
              "runtime/arcorbit/test/today-task-edit-electron.test.mjs"
            ],
            "gap_refs": []
          },
          {
            "invariant_ref": "material-risks-have-credible-evidence",
            "disposition": "upheld",
            "reason": "非 Work 隔离、Workset 外责任兼容、expected_state、非乐观失败、草稿与选择保留、成功可信刷新均有聚焦静态及真实 Electron 回归，完整 ArcOrbit 套件无失败。",
            "fact_refs": [
              "FACT-20260904-003-003"
            ],
            "evidence": [
              "runtime/arcorbit/test/desktop-renderer.test.mjs",
              "runtime/arcorbit/test/today-workspace.test.mjs",
              "runtime/arcorbit/test/platform-coordinator.test.mjs",
              "runtime/arcorbit/test/today-task-edit-electron.test.mjs",
              "npm run check --workspace @arckit/arcorbit: 596 tests, 571 passed, 25 skipped, 0 failed",
              "ARCORBIT_ELECTRON_TODAY_TASK_EDIT_TEST=1 node --test runtime/arcorbit/test/today-task-edit-electron.test.mjs: 1 passed, 0 failed"
            ],
            "gap_refs": []
          }
        ]
      },
      "evidence": [
        "fresh trusted snapshot observed_at 2026-09-04T15:46:35.293Z",
        "case-scoped selection token for CASE-20260904-003: 8b26cef9bb5580d65b9dac24bf8369ad51e8ea751be16c42627c64d82b59fefb",
        "arckit/interaction/today-workspace/interaction.md",
        "arckit/interaction/today-workspace/action-details.html",
        "runtime/arcorbit/desktop/renderer/renderer.js",
        "runtime/arcorbit/test/desktop-renderer.test.mjs",
        "runtime/arcorbit/test/today-task-edit-electron.test.mjs",
        "npm run check --workspace @arckit/arcorbit: 596 tests, 571 passed, 25 skipped, 0 failed",
        "ARCORBIT_ELECTRON_TODAY_TASK_EDIT_TEST=1 node --test runtime/arcorbit/test/today-task-edit-electron.test.mjs: 1 passed, 0 failed",
        "git diff --check: passed"
      ],
      "runtime_result_ref": "arckit-runtime://runs/RUN-20260904-152819365Z-3b9a74bc",
      "occurred_at": "2026-09-04T15:48:02.303Z"
    },
    {
      "round": 2,
      "transition_schema_version": "arckit-case-transition/v8",
      "goal": "独立审查 content revision 1 的实现正确性、问题解决、验证可信度、回归风险和最小性。",
      "outcome": "completed",
      "gap_selection": {
        "mode": "candidate",
        "basis": "基于 post-commit fresh snapshot 重新比较全部 persisted candidates。CASE-20260904-003 的普通 Gap 和 impacts 已闭合，Completion Review 是该 Case 唯一 ready 的 Agent 责任项，并直接阻塞 Case 完成。",
        "snapshot_token": "f8e48ff02987cdf07f003ed254c5a11db782576a273141afc906d1099078faef",
        "selected_ref": "case-gap:CASE-20260904-003:CASE-20260904-003:completion-review:1",
        "comparison_summary": "选择 CASE-20260904-003 Completion Review。四个 Project Gap 都需要独立 Case；旧 monorepo Case 的剩余 Gap 由 human 负责，不能由本轮审查代替。",
        "fresh_discovery_summary": "审查实现 diff、稳定交互文档、共享 Sheet 错误路径和新增 Electron 场景后，未发现需要优先于 Completion Review 的 fresh Gap，也未发现应形成 finding 的缺陷。",
        "considered": [
          {
            "ref": "project-gap:GAP-agent-scenario-evaluation",
            "source": "persisted",
            "eligibility": "case_required",
            "disposition": "deferred",
            "priority_basis": {
              "blocking": "不阻塞当前 Case 的完成审查",
              "uncertainty": "高",
              "risk": "高",
              "user_impact": "间接"
            },
            "reason": "需要独立真实场景 Case，不能并入本次 Completion Review。"
          },
          {
            "ref": "project-gap:GAP-runtime-resilience-and-adapters",
            "source": "persisted",
            "eligibility": "case_required",
            "disposition": "deferred",
            "priority_basis": {
              "blocking": "不阻塞当前 Case 的完成审查",
              "uncertainty": "中",
              "risk": "高",
              "user_impact": "间接"
            },
            "reason": "Runtime 韧性和 adapter 验收需要独立 Case。"
          },
          {
            "ref": "project-gap:GAP-security-real-project-validation",
            "source": "persisted",
            "eligibility": "case_required",
            "disposition": "deferred",
            "priority_basis": {
              "blocking": "不阻塞当前 Case 的完成审查",
              "uncertainty": "中",
              "risk": "高",
              "user_impact": "间接"
            },
            "reason": "真实权限项目验证需要独立受控 Case。"
          },
          {
            "ref": "project-gap:GAP-cross-record-audit",
            "source": "persisted",
            "eligibility": "case_required",
            "disposition": "deferred",
            "priority_basis": {
              "blocking": "不阻塞当前 Case 的完成审查",
              "uncertainty": "中",
              "risk": "高",
              "user_impact": "间接"
            },
            "reason": "跨记录审计需要独立 Case，不能替代当前实现的完成审查。"
          },
          {
            "ref": "case-gap:CASE-20260901-001:GAP-20260901-001-005",
            "source": "persisted",
            "eligibility": "ready",
            "disposition": "excluded",
            "priority_basis": {
              "blocking": "阻塞公开发布，不阻塞当前 Case",
              "uncertainty": "取决于 owner/provider",
              "risk": "高",
              "user_impact": "与当前 Today 请求无直接关系"
            },
            "reason": "该 Gap 由 human 负责凭据、许可和发布授权。"
          },
          {
            "ref": "case-gap:CASE-20260904-003:CASE-20260904-003:completion-review:1",
            "source": "persisted",
            "eligibility": "ready",
            "disposition": "selected",
            "priority_basis": {
              "blocking": "阻塞 CASE-20260904-003 完成",
              "uncertainty": "低",
              "risk": "高",
              "user_impact": "高"
            },
            "reason": "所有普通 Gap 与 impacts 已闭合；这是当前 Case 唯一 ready 的 Agent 责任项。"
          }
        ]
      },
      "selected_gap": {
        "id": "CASE-20260904-003:completion-review:1",
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
        "goal": "独立审查 content revision 1 的实现正确性、问题解决、验证可信度、回归风险和最小性。",
        "expected_state_change": "若五个维度均 clean 且无 finding，则接受 Completion Review；Case 的最终状态由 trusted Ledger 依据投影闭包物化。"
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
            "Reviewed content revision 1 and the complete scoped implementation diff",
            "runtime/arcorbit/desktop/renderer/renderer.js: Today entry, content-only Sheet, task.update and permission short-circuit",
            "arckit/interaction/today-workspace/interaction.md",
            "arckit/interaction/today-workspace/action-details.html",
            "runtime/arcorbit/test/desktop-renderer.test.mjs",
            "runtime/arcorbit/test/fixtures/today-task-edit-electron.mjs",
            "runtime/arcorbit/test/today-task-edit-electron.test.mjs",
            "node --test runtime/arcorbit/test/desktop-renderer.test.mjs runtime/arcorbit/test/today-workspace.test.mjs runtime/arcorbit/test/platform-coordinator.test.mjs: 88 passed, 0 failed",
            "ARCORBIT_ELECTRON_TODAY_TASK_EDIT_TEST=1 node --test runtime/arcorbit/test/today-task-edit-electron.test.mjs outside sandbox: 1 passed, 0 failed",
            "npm run check --workspace @arckit/arcorbit: 596 tests, 571 passed, 25 skipped, 0 failed",
            "git diff --check: passed"
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
        "project_revision": 342,
        "judgments": [
          {
            "invariant_ref": "product-expectations-remain-recoverable",
            "disposition": "upheld",
            "reason": "完成审查确认 Today 内容纠偏的能力范围、权限边界与非目标在稳定交互源中准确且可恢复。",
            "fact_refs": [
              "FACT-20260904-003-003"
            ],
            "evidence": [
              "arckit/interaction/today-workspace/interaction.md",
              "arckit/interaction/_map/feature-matrix.md"
            ],
            "gap_refs": []
          },
          {
            "invariant_ref": "interaction-expectations-remain-recoverable",
            "disposition": "upheld",
            "reason": "审查确认入口、预填、提交锁定、服务器确认、成功原位刷新和失败上下文保留均由文档、线框和行为测试一致表达。",
            "fact_refs": [
              "FACT-20260904-003-003"
            ],
            "evidence": [
              "arckit/interaction/today-workspace/interaction.md",
              "arckit/interaction/today-workspace/action-details.html",
              "runtime/arcorbit/test/today-task-edit-electron.test.mjs"
            ],
            "gap_refs": []
          },
          {
            "invariant_ref": "visual-language-remains-consistent",
            "disposition": "not_relevant",
            "reason": "Completion Review 未建立或修改视觉语言规则；实现继续复用既有 secondary button、固定操作栏和共享 Sheet。",
            "fact_refs": [],
            "evidence": [],
            "gap_refs": []
          },
          {
            "invariant_ref": "technical-decisions-remain-explainable",
            "disposition": "upheld",
            "reason": "审查确认 Today 只提供内容专用入口，实际写入继续由 Work-owned task.update 和服务器确认刷新路径负责，没有建立第二套状态所有权。",
            "fact_refs": [
              "FACT-20260904-003-003"
            ],
            "evidence": [
              "runtime/arcorbit/desktop/renderer/renderer.js",
              "runtime/arcorbit/src/platform-coordinator.mjs",
              "arckit/interaction/_map/RELATIONS.md"
            ],
            "gap_refs": []
          },
          {
            "invariant_ref": "accepted-facts-are-realized",
            "disposition": "upheld",
            "reason": "生产实现与行为级回归共同证明三项 accepted facts 已实际兑现，包括可管理 Work 责任入口、内容专用 mutation、成功刷新和失败保留。",
            "fact_refs": [
              "FACT-20260904-003-001",
              "FACT-20260904-003-002",
              "FACT-20260904-003-003"
            ],
            "evidence": [
              "runtime/arcorbit/desktop/renderer/renderer.js",
              "runtime/arcorbit/test/desktop-renderer.test.mjs",
              "runtime/arcorbit/test/today-task-edit-electron.test.mjs",
              "ARCORBIT_ELECTRON_TODAY_TASK_EDIT_TEST=1 node --test runtime/arcorbit/test/today-task-edit-electron.test.mjs outside sandbox: 1 passed, 0 failed"
            ],
            "gap_refs": []
          },
          {
            "invariant_ref": "material-risks-have-credible-evidence",
            "disposition": "upheld",
            "reason": "权限隔离、Workset 外责任、expected_state、非乐观失败、草稿与选择保留及成功刷新均有静态和真实 Electron 证据；沙箱内 Electron 启动失败已通过具备 GUI 权限的同命令复验确认为环境差异。",
            "fact_refs": [
              "FACT-20260904-003-003"
            ],
            "evidence": [
              "node --test runtime/arcorbit/test/desktop-renderer.test.mjs runtime/arcorbit/test/today-workspace.test.mjs runtime/arcorbit/test/platform-coordinator.test.mjs: 88 passed, 0 failed",
              "runtime/arcorbit/test/today-task-edit-electron.test.mjs",
              "ARCORBIT_ELECTRON_TODAY_TASK_EDIT_TEST=1 node --test runtime/arcorbit/test/today-task-edit-electron.test.mjs outside sandbox: 1 passed, 0 failed",
              "npm run check --workspace @arckit/arcorbit: 596 tests, 571 passed, 25 skipped, 0 failed"
            ],
            "gap_refs": []
          }
        ]
      },
      "evidence": [
        "trusted post-commit snapshot observed_at 2026-09-04T15:48:02.655Z",
        "CASE-20260904-003 content revision 1",
        "scoped implementation and interaction diff inspection",
        "node --test runtime/arcorbit/test/desktop-renderer.test.mjs runtime/arcorbit/test/today-workspace.test.mjs runtime/arcorbit/test/platform-coordinator.test.mjs: 88 passed, 0 failed",
        "ARCORBIT_ELECTRON_TODAY_TASK_EDIT_TEST=1 node --test runtime/arcorbit/test/today-task-edit-electron.test.mjs outside sandbox: 1 passed, 0 failed",
        "npm run check --workspace @arckit/arcorbit: 596 tests, 571 passed, 25 skipped, 0 failed",
        "git diff --check: passed"
      ],
      "runtime_result_ref": "arckit-runtime://runs/RUN-20260904-152819365Z-3b9a74bc",
      "occurred_at": "2026-09-04T15:50:03.397Z"
    }
  ],
  "case_resolution": {
    "status": "resolved",
    "stage": "resolved",
    "satisfied": [
      "GAP-20260904-003-001"
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
    "updated_at": "2026-09-04T15:50:03.397Z"
  }
}
```

## Round Notes

- Case history is canonical in Structured Record.rounds; keep prose notes exceptional.
