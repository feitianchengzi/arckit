# 恢复已忽略的反馈为待处理

Case: CASE-20260826-013
Status: closed
Artifact Type: mixed
Selected Gap: none
Updated: 2026-08-27T07:56:45.199Z

## User Intent

为 ArcOrbit Feedback 页面补充已忽略反馈的恢复能力，使用户能够纠正误操作状态。

## Structured Record

```json
{
  "schema_version": "development-case-record/v5",
  "id": "CASE-20260826-013",
  "title": "恢复已忽略的反馈为待处理",
  "status": "closed",
  "artifact_type": "mixed",
  "created_at": "2026-08-26T16:19:28.156Z",
  "updated_at": "2026-08-27T07:56:45.199Z",
  "user_intent": "为 ArcOrbit Feedback 页面补充已忽略反馈的恢复能力，使用户能够纠正误操作状态。",
  "expected_outcome": "已忽略的反馈问题具有清晰、可验证的恢复入口，可恢复为待处理，并正确反馈服务端确认后的状态。",
  "project_state_ref": "arckit/project/state.record.json",
  "current_round": {
    "goal": "",
    "selected_gap": null
  },
  "facts": [
    {
      "id": "FACT-20260826-013-001",
      "revision": 1,
      "status": "accepted",
      "statement": "ArcOrbit Feedback 页面中处于“已忽略”状态的反馈问题应当能够恢复为“待处理”，以纠正可能的状态误操作。",
      "basis": "当前 operator 明确提出的产品与交互预期。",
      "evidence": [
        "Current operator input, 2026-08-27"
      ]
    },
    {
      "id": "FACT-20260826-013-002",
      "revision": 1,
      "status": "accepted",
      "statement": "当前 operator 报告 ArcOrbit Feedback 页面没有提供将已忽略反馈恢复为待处理的入口。",
      "basis": "当前 operator 对现有产品行为的直接报告；实际实现边界仍需源码与契约证据确认。",
      "evidence": [
        "Current operator input, 2026-08-27"
      ]
    },
    {
      "id": "FACT-20260826-013-003",
      "revision": 1,
      "status": "accepted",
      "statement": "Feedback 中已忽略且未关联待办的反馈显示“恢复为待处理”；动作无需二次确认，只有服务端确认 pending 后才更新状态，失败时保持 ignored、筛选、选择和阅读位置。",
      "basis": "当前 operator 的明确恢复预期已经通过页面交互源、线框投影和产品验收规则收敛为一致契约。",
      "evidence": [
        "Current operator input, 2026-08-27",
        "arckit/interaction/platform-workspace/interaction.md",
        "arckit/interaction/platform-workspace/default.html",
        "arckit/spec/agentic-software-development/arcorbit-platform-capabilities.md"
      ]
    },
    {
      "id": "FACT-20260826-013-004",
      "revision": 1,
      "status": "accepted",
      "statement": "Feedback V1 的恢复可沿用既有受控 update，但必须保留无关 metadata 并同时写入 ignored=false、feedback_state=pending 和 status=analyzing，避免旧字段继续投影为已忽略。",
      "basis": "ArcOrbit V1 通过 data JSON 归一化 processing state；现有 ArcOrbit ignore 和 Workshop Console V1 状态写入使用不同字段组合。",
      "evidence": [
        "runtime/arcorbit/src/workshop-platform-adapter.mjs",
        "runtime/arcorbit/desktop/renderer/renderer.js",
        "/Users/Glare/Library/Developer/ModularProgram/hoewo/Workshop-Feedbacks/webapps/feedback-console-web/src/components/features/FeedbackManagementDialog.tsx",
        "arckit/tech/arcorbit/platform-composition-solution.md"
      ]
    },
    {
      "id": "FACT-20260826-013-005",
      "revision": 1,
      "status": "accepted",
      "statement": "Feedback V2 恢复采用与专用 ignore 对称的 POST /feedbacks/{id}/restore 领域合约，只允许服务端把当前 triage_status=ignored 原子恢复为 pending 并返回更新后的 Feedback；ArcOrbit 通过 Platform Adapter、Coordinator、main IPC 和 preload 的 restoreFeedbackV2 typed action 调用。",
      "basis": "V2 triage status 属于服务端事实，Renderer 无权本地改写；固定领域 route 延续现有 ignore 和 convert-to-task 的受限集成边界。",
      "evidence": [
        "arckit/tech/arcorbit/platform-composition-solution.md",
        "runtime/arcorbit/src/workshop-platform-adapter.mjs",
        "runtime/arcorbit/src/platform-coordinator.mjs",
        "runtime/arcorbit/desktop/main.mjs",
        "runtime/arcorbit/desktop/preload.cjs"
      ]
    },
    {
      "id": "FACT-20260826-013-006",
      "revision": 1,
      "status": "superseded",
      "statement": "当前 ArcOrbit Renderer 对 ignored 反馈不渲染恢复动作，V2 Adapter/main/preload 只暴露 ignore 和通用 update；Workshop Feedback Console client 同样只有 POST /feedbacks/{id}/ignore，通用 update 不接受 triage_status，因此当前软件尚未兑现完整 ignored → pending 恢复能力。",
      "basis": "生产源码与既有 V2 Console client 的直接检查。",
      "evidence": [
        "runtime/arcorbit/desktop/renderer/renderer.js",
        "runtime/arcorbit/src/workshop-platform-adapter.mjs",
        "runtime/arcorbit/src/platform-coordinator.mjs",
        "runtime/arcorbit/desktop/main.mjs",
        "runtime/arcorbit/desktop/preload.cjs",
        "/Users/Glare/Library/Developer/ModularProgram/hoewo/Workshop-Feedbacks/webapps/feedback-console-web/src/lib/api/feedbackV2Client.ts",
        "/Users/Glare/Library/Developer/ModularProgram/hoewo/Workshop-Feedbacks/webapps/feedback-console-web/src/lib/api/endpoints/feedbacks.ts",
        "runtime/arcorbit/test/organization-center-electron.test.mjs"
      ]
    },
    {
      "id": "FACT-20260826-013-007",
      "revision": 1,
      "status": "superseded",
      "statement": "ArcOrbit 生产客户端现已兑现已忽略反馈恢复：Renderer 仅为 ignored 且未关联待办的反馈显示恢复入口；V1 使用完整兼容 metadata；V2 使用固定 restore typed action 链；成功后刷新，失败时不乐观改写状态。Workshop Feedback V2 provider route 仍未在当前授权 workspace 中实现。",
      "basis": "生产代码实现、行为级自动化与完整 ArcOrbit 回归共同证明客户端边界已经兑现，同时既有外部 provider 缺口仍由独立 Gap 承载。",
      "evidence": [
        "runtime/arcorbit/desktop/renderer/renderer.js",
        "runtime/arcorbit/src/workshop-platform-adapter.mjs",
        "runtime/arcorbit/src/platform-coordinator.mjs",
        "runtime/arcorbit/desktop/main.mjs",
        "runtime/arcorbit/desktop/preload.cjs",
        "runtime/arcorbit/test/desktop-renderer.test.mjs",
        "runtime/arcorbit/test/platform-coordinator.test.mjs",
        "runtime/arcorbit/test/workshop-platform-adapter.test.mjs",
        "Verification: 78 focused tests passed, 0 failed",
        "Verification: authorized Electron rerun 2 passed"
      ]
    },
    {
      "id": "FACT-20260826-013-008",
      "revision": 1,
      "status": "accepted",
      "statement": "Workshop Todo Feedback V2 已实现同记录 ignored → pending 恢复。POST /workshop/v2/user/feedbacks/{id}/restore 只允许项目成员操作当前 ignored 且未关联主待办的反馈；事务锁定反馈行后原子更新 triage_status=pending、status=pending、data.feedback_state=pending 和 data.status=analyzing，保留反馈 ID、消息、附件与无关 metadata，并发布状态消息、通知和 realtime 更新。",
      "basis": "直接服务端实现、路由/API 文档、Go 测试及 ArcOrbit typed client 回归。",
      "evidence": [
        "../../hoewo/workshop-todo/handler/feedback_workflow.go",
        "../../hoewo/workshop-todo/router/router.go",
        "../../hoewo/workshop-todo/api/feedback.md",
        "../../hoewo/workshop-todo/handler/feedback_workflow_test.go",
        "../../hoewo/workshop-todo/router/router_test.go",
        "runtime/arcorbit/src/workshop-platform-adapter.mjs",
        "runtime/arcorbit/src/platform-coordinator.mjs",
        "Verification: workshop-todo go test ./... passed",
        "Verification: ArcOrbit 78 focused tests passed"
      ]
    }
  ],
  "state_impacts": [
    {
      "id": "IMPACT-20260826-013-001",
      "fact_id": "FACT-20260826-013-001",
      "fact_revision": 1,
      "target": {
        "kind": "software_decision",
        "ref": "experience_and_interaction",
        "revision": 61
      },
      "effect": "upheld",
      "reason": "页面级恢复条件、动作、服务端确认、失败保持和选择语义已经写入权威 interaction、线框和产品规格。",
      "gap_ids": [],
      "evidence": [
        "arckit/interaction/platform-workspace/interaction.md",
        "arckit/interaction/platform-workspace/default.html",
        "arckit/spec/agentic-software-development/arcorbit-platform-capabilities.md"
      ]
    },
    {
      "id": "IMPACT-20260826-013-002",
      "fact_id": "FACT-20260826-013-008",
      "fact_revision": 1,
      "target": {
        "kind": "software_decision",
        "ref": "product_capabilities",
        "revision": 39
      },
      "effect": "upheld",
      "reason": "ArcOrbit 的 V1/V2 已忽略恢复能力现在都有真实服务端路径，V2 保持同一反馈身份与历史。",
      "gap_ids": [],
      "evidence": [
        "arckit/spec/agentic-software-development/arcorbit-platform-capabilities.md",
        "../../hoewo/workshop-todo/handler/feedback_workflow.go",
        "runtime/arcorbit/desktop/renderer/renderer.js"
      ]
    },
    {
      "id": "IMPACT-20260826-013-003",
      "fact_id": "FACT-20260826-013-008",
      "fact_revision": 1,
      "target": {
        "kind": "software_decision",
        "ref": "external_integrations",
        "revision": 13
      },
      "effect": "upheld",
      "reason": "Workshop Todo 已提供 ArcOrbit 固定 adapter 所调用的同记录 restore 领域合约，无需通用 update 或 Renderer 状态伪装。",
      "gap_ids": [],
      "evidence": [
        "../../hoewo/workshop-todo/router/router.go",
        "../../hoewo/workshop-todo/handler/feedback_workflow.go",
        "runtime/arcorbit/src/workshop-platform-adapter.mjs",
        "arckit/tech/arcorbit/platform-composition-solution.md"
      ]
    },
    {
      "id": "IMPACT-20260826-013-004",
      "fact_id": "FACT-20260826-013-008",
      "fact_revision": 1,
      "target": {
        "kind": "software_decision",
        "ref": "technical_foundation",
        "revision": 43
      },
      "effect": "upheld",
      "reason": "Provider route、事务行锁、状态/待办前置校验与现有 Adapter、Coordinator、IPC、preload、Renderer typed action chain 已形成完整调用链。",
      "gap_ids": [],
      "evidence": [
        "../../hoewo/workshop-todo/handler/feedback_workflow.go",
        "runtime/arcorbit/src/workshop-platform-adapter.mjs",
        "runtime/arcorbit/src/platform-coordinator.mjs",
        "runtime/arcorbit/desktop/main.mjs",
        "runtime/arcorbit/desktop/preload.cjs",
        "runtime/arcorbit/desktop/renderer/renderer.js"
      ]
    },
    {
      "id": "IMPACT-20260826-013-005",
      "fact_id": "FACT-20260826-013-008",
      "fact_revision": 1,
      "target": {
        "kind": "software_decision",
        "ref": "quality_and_validation",
        "revision": 21
      },
      "effect": "upheld",
      "reason": "Provider 数据库行为现已在真实 PostgreSQL 中覆盖：同记录恢复成功并保留 ID、历史及 metadata；非 ignored、已关联待办和不存在对象失败关闭；双 restore 串行且仅一次成功；ignore/convert 在统一行锁下仅一方提交。ArcOrbit 客户端的 typed route、成功与失败关闭仍由既有 78 项聚焦回归覆盖。",
      "gap_ids": [],
      "evidence": [
        "../../hoewo/workshop-todo/handler/feedback_workflow_postgres_test.go",
        "../../hoewo/workshop-todo/handler/feedback_workflow.go",
        "runtime/arcorbit/test/desktop-renderer.test.mjs",
        "runtime/arcorbit/test/platform-coordinator.test.mjs",
        "runtime/arcorbit/test/workshop-platform-adapter.test.mjs",
        "Verification: WORKSHOP_TEST_POSTGRES_DSN-backed go test ./... -count=3 passed",
        "Verification: PostgreSQL transaction suite passed 10 consecutive runs"
      ]
    },
    {
      "id": "IMPACT-20260826-013-006",
      "fact_id": "FACT-20260826-013-008",
      "fact_revision": 1,
      "target": {
        "kind": "software_invariant",
        "ref": "accepted-facts-are-realized",
        "revision": null
      },
      "effect": "upheld",
      "reason": "接受的同记录恢复事实已由 ArcOrbit 客户端与 Workshop Todo provider 两端共同兑现。",
      "gap_ids": [],
      "evidence": [
        "../../hoewo/workshop-todo/handler/feedback_workflow.go",
        "runtime/arcorbit/src/workshop-platform-adapter.mjs",
        "runtime/arcorbit/desktop/renderer/renderer.js",
        "Verification: workshop-todo go test ./... passed",
        "Verification: ArcOrbit 78 focused tests passed"
      ]
    }
  ],
  "gaps": [
    {
      "id": "GAP-20260826-013-001",
      "status": "resolved",
      "goal": "建立已忽略反馈恢复为待处理的权威交互契约，并查明该状态转换在 Renderer、Feedback 适配层与服务端契约中的实际实现边界。",
      "reason": "恢复入口的最小实现范围取决于现有 ignored → pending 状态转换能力；该前置事实尚未被 Case 接受，必须先确定后才能安全实施下游修改。",
      "derived_from": [
        "FACT-20260826-013-001",
        "FACT-20260826-013-002"
      ],
      "blocked_by": [],
      "priority_basis": {
        "blocking": "当前缺少恢复入口，用户无法纠正误操作状态。",
        "uncertainty": "尚不确定服务端与现有适配层是否已经支持该逆向状态转换。",
        "risk": "若直接只补 UI，可能产生不可用动作或破坏 Feedback V2 状态同步边界。",
        "user_impact": "已忽略反馈可能永久停留在错误状态。"
      },
      "responsibility": "agent",
      "evidence_required": [
        "持久产品或交互证据，明确恢复动作的可见条件、目标状态、确认反馈和失败恢复语义。",
        "源码与 API/适配层证据，确定 ignored → pending 的状态所有权和最小实现范围。"
      ],
      "resolution": {
        "id": "GAP-20260826-013-001",
        "status": "resolved",
        "outcome": "established",
        "reason": "已建立“已忽略且未关联待办的反馈可恢复为待处理”的权威交互与产品契约，并以源码和 Console client 证据确认 V1 可使用受控 metadata update、V2 当前缺少 restore route 且必须经过专用 provider 合约与 typed IPC。",
        "evidence": [
          "arckit/interaction/platform-workspace/interaction.md",
          "arckit/interaction/platform-workspace/default.html",
          "arckit/spec/agentic-software-development/arcorbit-platform-capabilities.md",
          "arckit/tech/arcorbit/platform-composition-solution.md",
          "runtime/arcorbit/desktop/renderer/renderer.js",
          "runtime/arcorbit/src/workshop-platform-adapter.mjs",
          "runtime/arcorbit/src/platform-coordinator.mjs",
          "runtime/arcorbit/desktop/main.mjs",
          "runtime/arcorbit/desktop/preload.cjs",
          "/Users/Glare/Library/Developer/ModularProgram/hoewo/Workshop-Feedbacks/webapps/feedback-console-web/src/lib/api/feedbackV2Client.ts",
          "/Users/Glare/Library/Developer/ModularProgram/hoewo/Workshop-Feedbacks/webapps/feedback-console-web/src/components/features/FeedbackManagementDialog.tsx",
          "Verification: wireframe projection contains 8 complete states including ignored recovery",
          "Verification: 62 focused Renderer and Platform Adapter tests passed",
          "Verification: git diff --check passed"
        ],
        "occurred_at": "2026-08-26T16:34:16.474Z"
      }
    },
    {
      "id": "GAP-20260826-013-002",
      "status": "resolved",
      "goal": "在 ArcOrbit 实现已忽略反馈恢复入口、V1 metadata 映射、V2 restore typed action 链及成功/失败上下文保持回归。",
      "reason": "交互和技术契约已经明确，但生产 Renderer、Adapter、Coordinator、main IPC 与 preload 尚未兑现。",
      "derived_from": [
        "FACT-20260826-013-001",
        "FACT-20260826-013-004",
        "FACT-20260826-013-005",
        "FACT-20260826-013-006"
      ],
      "blocked_by": [],
      "priority_basis": {
        "blocking": "直接阻塞用户在 ArcOrbit 中纠正误忽略。",
        "uncertainty": "实现边界已明确，主要剩余风险是跨 V1/V2 一致性。",
        "risk": "错误的乐观状态或不完整 metadata 会造成状态再次漂移。",
        "user_impact": "没有入口时已忽略反馈无法在 ArcOrbit 恢复。"
      },
      "responsibility": "agent",
      "evidence_required": [
        "Renderer 仅对 ignored 且未关联反馈展示恢复动作，并在服务端确认后刷新状态。",
        "V1 update 同时写入 ignored=false、feedback_state=pending、status=analyzing 且保留无关 metadata。",
        "V2 Adapter、Coordinator、main IPC、preload 使用固定 restore typed action，不开放通用网络或 triage 注入。",
        "自动化覆盖 V1/V2 成功、403/404/冲突/网络失败、状态不乐观改写和筛选/选择/滚动保持。"
      ],
      "resolution": {
        "id": "GAP-20260826-013-002",
        "status": "resolved",
        "outcome": "implemented",
        "reason": "ArcOrbit 已只对 ignored 且未关联待办的反馈显示恢复入口；V1 保留无关 metadata 并写入 ignored=false、feedback_state=pending、status=analyzing；V2 通过固定 restore route 的 Adapter、Coordinator、main IPC、preload 和 Renderer 链调用，且只在服务端成功后刷新。失败路径不乐观改写状态并恢复按钮可用性。",
        "evidence": [
          "runtime/arcorbit/desktop/renderer/renderer.js",
          "runtime/arcorbit/src/workshop-platform-adapter.mjs",
          "runtime/arcorbit/src/platform-coordinator.mjs",
          "runtime/arcorbit/desktop/main.mjs",
          "runtime/arcorbit/desktop/preload.cjs",
          "runtime/arcorbit/test/desktop-renderer.test.mjs",
          "runtime/arcorbit/test/platform-coordinator.test.mjs",
          "runtime/arcorbit/test/workshop-platform-adapter.test.mjs",
          "Verification: 78 focused tests passed, 0 failed",
          "Verification: ArcOrbit suite 527 tests; 506 passed, 19 skipped, 2 Electron sandbox-only failures; authorized Electron rerun 2 passed",
          "Verification: syntax check and git diff --check passed"
        ],
        "occurred_at": "2026-08-26T16:43:15.964Z"
      }
    },
    {
      "id": "GAP-20260826-013-003",
      "status": "resolved",
      "goal": "在 Workshop Feedback provider 提供并验证 POST /feedbacks/{id}/restore，将 ignored 原子恢复为 pending 并返回更新后的 Feedback。",
      "reason": "当前 V2 Console 与 ArcOrbit client 只有专用 ignore，通用 update 也不接受 triage_status；外部服务契约缺失会使 V2 恢复无法真实工作。",
      "derived_from": [
        "FACT-20260826-013-005",
        "FACT-20260826-013-006"
      ],
      "blocked_by": [],
      "priority_basis": {
        "blocking": "阻塞 V2 反馈恢复在真实环境可用。",
        "uncertainty": "服务端实现仓库不在当前授权 workspace。",
        "risk": "若没有状态前置校验和权限验证，可能覆盖并发更新或扩大 mutation 权限。",
        "user_impact": "V2 项目的误忽略仍无法恢复。"
      },
      "responsibility": "external",
      "evidence_required": [
        "provider route 与权限实现证据。",
        "ignored → pending 成功、非 ignored 冲突、403、404 和并发状态检查测试。",
        "Workshop Feedback Console/SDK client 合约与返回对象类型同步证据。"
      ],
      "resolution": {
        "id": "GAP-20260826-013-003",
        "status": "resolved",
        "outcome": "implemented",
        "reason": "workshop-todo Feedback V2 现已提供 POST /feedbacks/:id/restore。服务端在事务内锁定并重读反馈，要求当前为 ignored 且无主待办关系，再原子恢复同一记录的 triage_status/status/兼容 metadata；API Key、非 ignored、已关联待办和不存在对象均失败关闭。ignore、restore 与 convert-to-task 统一锁定同一反馈行，避免并发状态漂移。",
        "evidence": [
          "../../hoewo/workshop-todo/router/router.go",
          "../../hoewo/workshop-todo/handler/feedback_workflow.go",
          "../../hoewo/workshop-todo/handler/feedback_workflow_test.go",
          "../../hoewo/workshop-todo/router/router_test.go",
          "../../hoewo/workshop-todo/api/feedback.md",
          "Verification: workshop-todo go test ./... passed",
          "Verification: ArcOrbit 78 focused tests passed",
          "Verification: both workspaces git diff --check passed"
        ],
        "occurred_at": "2026-08-27T07:39:23.651Z"
      }
    },
    {
      "id": "CASE-20260826-013:review-finding:FINDING-20260826-013-001",
      "status": "resolved",
      "goal": "Resolve review finding: Workshop Todo 新增测试没有实际执行 RestoreFeedback 的数据库事务；当前只验证路由、metadata helper 和 API Key 提前拒绝，未覆盖同记录恢复成功、非 ignored 409、已关联待办 409、对象不存在 404、双请求并发串行化，以及新增行锁对 ignore/convert-to-task 的回归行为。",
      "reason": "omission found by completion review",
      "derived_from": [
        "completion_review",
        "content_revision:3"
      ],
      "blocked_by": [],
      "priority_basis": {
        "blocking": "high",
        "risk": "high"
      },
      "responsibility": "agent",
      "evidence_required": [
        "../../hoewo/workshop-todo/handler/feedback_workflow.go",
        "../../hoewo/workshop-todo/handler/feedback_workflow_test.go",
        "../../hoewo/workshop-todo/router/router_test.go",
        "CASE-20260826-013 GAP-003 evidence requirement explicitly requires success, non-ignored conflict, 403, 404 and concurrent-state tests",
        "Source inspection: handler/feedback_workflow_test.go only adds TestRestoredFeedbackProjectsPendingState and TestRestoreFeedbackRejectsAPIKeyBeforeDatabaseAccess",
        "Source inspection: router/router_test.go only asserts V2 route presence and V1 absence",
        "Verification: workshop-todo go test ./... passed but no test entered the RestoreFeedback success transaction",
        "Verification: ArcOrbit 78 focused tests passed and cover client behavior, not provider database semantics"
      ],
      "resolution": {
        "id": "CASE-20260826-013:review-finding:FINDING-20260826-013-001",
        "status": "resolved",
        "outcome": "verified",
        "reason": "新增 opt-in PostgreSQL 集成测试，直接执行 RestoreFeedback、IgnoreFeedback 和 ConvertFeedbackToTask。测试使用独立 schema，并以外部行锁阻塞器确认并发请求均进入同一 feedback 行锁等待；验证 restore 只能一次成功，ignore/convert 只能一方提交，最终状态、消息、Task 与主链接保持一致。",
        "evidence": [
          "../../hoewo/workshop-todo/handler/feedback_workflow_postgres_test.go",
          "../../hoewo/workshop-todo/handler/feedback_workflow.go",
          "Verification: PostgreSQL transaction subtests passed 6/6",
          "Verification: PostgreSQL transaction suite passed 10 consecutive runs",
          "Verification: WORKSHOP_TEST_POSTGRES_DSN-backed go test ./... -count=3 passed",
          "Verification: default go test ./... passed with integration test safely skipped",
          "Verification: go vet ./handler passed",
          "Verification: both workspaces git diff --check passed"
        ],
        "occurred_at": "2026-08-27T07:54:01.101Z"
      }
    }
  ],
  "content_revision": 4,
  "completion_review": {
    "status": "clean",
    "policy": {
      "initial_max_cycles": 10,
      "source": "runtime/arcorbit/config/case-policy.json",
      "snapshotted_at": "2026-08-26T16:19:28.156Z"
    },
    "additional_cycles_authorized": 0,
    "cycle_count": 2,
    "reviewed_content_revision": 4,
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
        "outcome": "findings",
        "content_revision": 3,
        "dimensions": {
          "implementation_correctness": "clean",
          "problem_resolution": "clean",
          "verification_credibility": "findings",
          "regression_risk": "findings",
          "minimality": "clean"
        },
        "finding_ids": [
          "FINDING-20260826-013-001"
        ],
        "evidence": [
          "../../hoewo/workshop-todo/handler/feedback_workflow.go",
          "../../hoewo/workshop-todo/handler/feedback_workflow_test.go",
          "../../hoewo/workshop-todo/router/router_test.go",
          "runtime/arcorbit/desktop/renderer/renderer.js",
          "runtime/arcorbit/src/workshop-platform-adapter.mjs",
          "runtime/arcorbit/test/desktop-renderer.test.mjs",
          "runtime/arcorbit/test/platform-coordinator.test.mjs",
          "runtime/arcorbit/test/workshop-platform-adapter.test.mjs",
          "Verification: workshop-todo go test ./... passed",
          "Verification: ArcOrbit focused suite passed 78/78",
          "Verification: both workspaces git diff --check passed"
        ],
        "occurred_at": "2026-08-27T07:42:36.981Z"
      },
      {
        "cycle": 2,
        "autonomous_cycle": 2,
        "reviewer": "agent",
        "outcome": "clean",
        "content_revision": 4,
        "dimensions": {
          "implementation_correctness": "clean",
          "problem_resolution": "clean",
          "verification_credibility": "clean",
          "regression_risk": "clean",
          "minimality": "clean"
        },
        "finding_ids": [],
        "evidence": [
          "arckit/spec/agentic-software-development/arcorbit-platform-capabilities.md",
          "arckit/interaction/platform-workspace/interaction.md",
          "arckit/interaction/platform-workspace/default.html",
          "arckit/tech/arcorbit/platform-composition-solution.md",
          "runtime/arcorbit/desktop/renderer/renderer.js",
          "runtime/arcorbit/src/workshop-platform-adapter.mjs",
          "runtime/arcorbit/src/platform-coordinator.mjs",
          "runtime/arcorbit/desktop/main.mjs",
          "runtime/arcorbit/desktop/preload.cjs",
          "../../hoewo/workshop-todo/handler/feedback_workflow.go",
          "../../hoewo/workshop-todo/router/router.go",
          "../../hoewo/workshop-todo/api/feedback.md",
          "../../hoewo/workshop-todo/handler/feedback_workflow_postgres_test.go",
          "Verification: ArcOrbit focused suite passed 78/78 during Completion Review",
          "Verification: workshop-todo go test ./... passed during Completion Review",
          "Verification: go vet ./handler passed during Completion Review",
          "Verification: accepted PostgreSQL transaction suite passed 10 consecutive runs",
          "Verification: accepted PostgreSQL-backed go test ./... -count=3 passed",
          "Verification: both workspaces git diff --check passed"
        ],
        "occurred_at": "2026-08-27T07:56:45.199Z"
      }
    ],
    "evidence": [
      "../../hoewo/workshop-todo/handler/feedback_workflow.go",
      "../../hoewo/workshop-todo/handler/feedback_workflow_test.go",
      "../../hoewo/workshop-todo/router/router_test.go",
      "runtime/arcorbit/desktop/renderer/renderer.js",
      "runtime/arcorbit/src/workshop-platform-adapter.mjs",
      "runtime/arcorbit/test/desktop-renderer.test.mjs",
      "runtime/arcorbit/test/platform-coordinator.test.mjs",
      "runtime/arcorbit/test/workshop-platform-adapter.test.mjs",
      "Verification: workshop-todo go test ./... passed",
      "Verification: ArcOrbit focused suite passed 78/78",
      "Verification: both workspaces git diff --check passed",
      "arckit/spec/agentic-software-development/arcorbit-platform-capabilities.md",
      "arckit/interaction/platform-workspace/interaction.md",
      "arckit/interaction/platform-workspace/default.html",
      "arckit/tech/arcorbit/platform-composition-solution.md",
      "runtime/arcorbit/src/platform-coordinator.mjs",
      "runtime/arcorbit/desktop/main.mjs",
      "runtime/arcorbit/desktop/preload.cjs",
      "../../hoewo/workshop-todo/router/router.go",
      "../../hoewo/workshop-todo/api/feedback.md",
      "../../hoewo/workshop-todo/handler/feedback_workflow_postgres_test.go",
      "Verification: ArcOrbit focused suite passed 78/78 during Completion Review",
      "Verification: workshop-todo go test ./... passed during Completion Review",
      "Verification: go vet ./handler passed during Completion Review",
      "Verification: accepted PostgreSQL transaction suite passed 10 consecutive runs",
      "Verification: accepted PostgreSQL-backed go test ./... -count=3 passed"
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
      "goal": "查明 ignored → pending 在 V1、V2、Renderer、main-process adapter 与外部 provider 中的真实边界，并把已确认的产品、交互、技术和验收规则写入持久事实源。",
      "outcome": "completed",
      "gap_selection": {
        "mode": "candidate",
        "basis": "基于 fresh global snapshot ce12cbe62caaecefc65c9abb28a507e5bdf6f6b36a502ae60146b6980f8f53cb、CASE-20260826-013 scoped selection token、当前 Case facts、用户影响和依赖边界重新比较全部 persisted candidates。",
        "snapshot_token": "170b345df1bf4704b876c9d917ed33718cc4d86fab48a4283d34a33de874d1d0",
        "selected_ref": "case-gap:CASE-20260826-013:GAP-20260826-013-001",
        "comparison_summary": "CASE-20260826-013 的 Feedback 契约与技术边界 Gap 直接阻塞当前用户诉求且 ready；四个 Project Gap 需要独立 Case，并不覆盖当前页面状态恢复，因此 deferred。",
        "fresh_discovery_summary": "没有发现需要抢占 persisted Case Gap 的 fresh candidate；已发现的 ArcOrbit 实现缺口和 V2 provider 合约缺口作为新事实与后续 Gap 写回，不在本轮继续消费。",
        "considered": [
          {
            "ref": "project-gap:GAP-agent-scenario-evaluation",
            "source": "persisted",
            "eligibility": "case_required",
            "disposition": "deferred",
            "priority_basis": {
              "blocking": "不直接阻塞当前 Feedback 恢复诉求。",
              "uncertainty": "high",
              "risk": "high",
              "user_impact": "属于跨场景 Agent 验证，不解决当前页面缺口。"
            },
            "reason": "需要独立 Case；本轮当前用户影响更直接。"
          },
          {
            "ref": "project-gap:GAP-runtime-resilience-and-adapters",
            "source": "persisted",
            "eligibility": "case_required",
            "disposition": "deferred",
            "priority_basis": {
              "blocking": "不直接阻塞当前 Feedback 状态契约。",
              "uncertainty": "medium",
              "risk": "high",
              "user_impact": "影响 Runtime 长时执行，不是当前页面恢复入口。"
            },
            "reason": "需要独立 Case；与当前 Feedback provider 状态 mutation 不是同一验收主张。"
          },
          {
            "ref": "project-gap:GAP-security-real-project-validation",
            "source": "persisted",
            "eligibility": "case_required",
            "disposition": "deferred",
            "priority_basis": {
              "blocking": "不直接阻塞当前契约建立。",
              "uncertainty": "medium",
              "risk": "high",
              "user_impact": "面向真实权限项目的安全验证。"
            },
            "reason": "需要独立 Case；当前 Gap 只使用既有受控 adapter 安全边界。"
          },
          {
            "ref": "project-gap:GAP-cross-record-audit",
            "source": "persisted",
            "eligibility": "case_required",
            "disposition": "deferred",
            "priority_basis": {
              "blocking": "不直接阻塞当前 Feedback 恢复诉求。",
              "uncertainty": "medium",
              "risk": "high",
              "user_impact": "面向 canonical records 一致性。"
            },
            "reason": "虽风险与紧迫性高，但需要独立 Case，不能吞并当前页面级恢复事项。"
          },
          {
            "ref": "case-gap:CASE-20260826-013:GAP-20260826-013-001",
            "source": "persisted",
            "eligibility": "ready",
            "disposition": "selected",
            "priority_basis": {
              "blocking": "当前缺少恢复入口，用户不能纠正误操作。",
              "uncertainty": "V1 与 V2 的状态 mutation 边界此前未被接受。",
              "risk": "错误地只补 UI 会导致 V2 假成功或状态不同步。",
              "user_impact": "已忽略反馈可能长期停留在错误状态。"
            },
            "reason": "直接覆盖当前 Case 的必要前置结果，且可由源码、既有 provider source refs 和持久文档验证。"
          }
        ]
      },
      "selected_gap": {
        "id": "GAP-20260826-013-001",
        "responsibility": "agent",
        "goal": "建立已忽略反馈恢复为待处理的权威交互契约，并查明该状态转换在 Renderer、Feedback 适配层与服务端契约中的实际实现边界。",
        "reason": "恢复入口的最小实现范围取决于现有 ignored → pending 状态转换能力；该前置事实尚未被 Case 接受，必须先确定后才能安全实施下游修改。",
        "derived_from": [
          "FACT-20260826-013-001",
          "FACT-20260826-013-002"
        ],
        "blocked_by": [],
        "priority_basis": {
          "blocking": "当前缺少恢复入口，用户无法纠正误操作状态。",
          "uncertainty": "尚不确定服务端与现有适配层是否已经支持该逆向状态转换。",
          "risk": "若直接只补 UI，可能产生不可用动作或破坏 Feedback V2 状态同步边界。",
          "user_impact": "已忽略反馈可能永久停留在错误状态。"
        },
        "evidence_required": [
          "持久产品或交互证据，明确恢复动作的可见条件、目标状态、确认反馈和失败恢复语义。",
          "源码与 API/适配层证据，确定 ignored → pending 的状态所有权和最小实现范围。"
        ]
      },
      "planned_transition": {
        "goal": "查明 ignored → pending 在 V1、V2、Renderer、main-process adapter 与外部 provider 中的真实边界，并把已确认的产品、交互、技术和验收规则写入持久事实源。",
        "expected_state_change": "选中 Gap 被解决；experience_and_interaction 的既有威胁转为 upheld，同时将尚未实现的 ArcOrbit 客户端和外部 V2 provider 义务记录为后续 open gaps。"
      },
      "accepted_state_delta": {
        "resolved_gap": {
          "id": "GAP-20260826-013-001",
          "status": "resolved",
          "outcome": "established",
          "reason": "已建立“已忽略且未关联待办的反馈可恢复为待处理”的权威交互与产品契约，并以源码和 Console client 证据确认 V1 可使用受控 metadata update、V2 当前缺少 restore route 且必须经过专用 provider 合约与 typed IPC。",
          "evidence": [
            "arckit/interaction/platform-workspace/interaction.md",
            "arckit/interaction/platform-workspace/default.html",
            "arckit/spec/agentic-software-development/arcorbit-platform-capabilities.md",
            "arckit/tech/arcorbit/platform-composition-solution.md",
            "runtime/arcorbit/desktop/renderer/renderer.js",
            "runtime/arcorbit/src/workshop-platform-adapter.mjs",
            "runtime/arcorbit/src/platform-coordinator.mjs",
            "runtime/arcorbit/desktop/main.mjs",
            "runtime/arcorbit/desktop/preload.cjs",
            "/Users/Glare/Library/Developer/ModularProgram/hoewo/Workshop-Feedbacks/webapps/feedback-console-web/src/lib/api/feedbackV2Client.ts",
            "/Users/Glare/Library/Developer/ModularProgram/hoewo/Workshop-Feedbacks/webapps/feedback-console-web/src/components/features/FeedbackManagementDialog.tsx",
            "Verification: wireframe projection contains 8 complete states including ignored recovery",
            "Verification: 62 focused Renderer and Platform Adapter tests passed",
            "Verification: git diff --check passed"
          ]
        },
        "facts_added": [
          {
            "id": "FACT-20260826-013-003",
            "revision": 1,
            "status": "accepted",
            "statement": "Feedback 中已忽略且未关联待办的反馈显示“恢复为待处理”；动作无需二次确认，只有服务端确认 pending 后才更新状态，失败时保持 ignored、筛选、选择和阅读位置。",
            "basis": "当前 operator 的明确恢复预期已经通过页面交互源、线框投影和产品验收规则收敛为一致契约。",
            "evidence": [
              "Current operator input, 2026-08-27",
              "arckit/interaction/platform-workspace/interaction.md",
              "arckit/interaction/platform-workspace/default.html",
              "arckit/spec/agentic-software-development/arcorbit-platform-capabilities.md"
            ]
          },
          {
            "id": "FACT-20260826-013-004",
            "revision": 1,
            "status": "accepted",
            "statement": "Feedback V1 的恢复可沿用既有受控 update，但必须保留无关 metadata 并同时写入 ignored=false、feedback_state=pending 和 status=analyzing，避免旧字段继续投影为已忽略。",
            "basis": "ArcOrbit V1 通过 data JSON 归一化 processing state；现有 ArcOrbit ignore 和 Workshop Console V1 状态写入使用不同字段组合。",
            "evidence": [
              "runtime/arcorbit/src/workshop-platform-adapter.mjs",
              "runtime/arcorbit/desktop/renderer/renderer.js",
              "/Users/Glare/Library/Developer/ModularProgram/hoewo/Workshop-Feedbacks/webapps/feedback-console-web/src/components/features/FeedbackManagementDialog.tsx",
              "arckit/tech/arcorbit/platform-composition-solution.md"
            ]
          },
          {
            "id": "FACT-20260826-013-005",
            "revision": 1,
            "status": "accepted",
            "statement": "Feedback V2 恢复采用与专用 ignore 对称的 POST /feedbacks/{id}/restore 领域合约，只允许服务端把当前 triage_status=ignored 原子恢复为 pending 并返回更新后的 Feedback；ArcOrbit 通过 Platform Adapter、Coordinator、main IPC 和 preload 的 restoreFeedbackV2 typed action 调用。",
            "basis": "V2 triage status 属于服务端事实，Renderer 无权本地改写；固定领域 route 延续现有 ignore 和 convert-to-task 的受限集成边界。",
            "evidence": [
              "arckit/tech/arcorbit/platform-composition-solution.md",
              "runtime/arcorbit/src/workshop-platform-adapter.mjs",
              "runtime/arcorbit/src/platform-coordinator.mjs",
              "runtime/arcorbit/desktop/main.mjs",
              "runtime/arcorbit/desktop/preload.cjs"
            ]
          },
          {
            "id": "FACT-20260826-013-006",
            "revision": 1,
            "status": "accepted",
            "statement": "当前 ArcOrbit Renderer 对 ignored 反馈不渲染恢复动作，V2 Adapter/main/preload 只暴露 ignore 和通用 update；Workshop Feedback Console client 同样只有 POST /feedbacks/{id}/ignore，通用 update 不接受 triage_status，因此当前软件尚未兑现完整 ignored → pending 恢复能力。",
            "basis": "生产源码与既有 V2 Console client 的直接检查。",
            "evidence": [
              "runtime/arcorbit/desktop/renderer/renderer.js",
              "runtime/arcorbit/src/workshop-platform-adapter.mjs",
              "runtime/arcorbit/src/platform-coordinator.mjs",
              "runtime/arcorbit/desktop/main.mjs",
              "runtime/arcorbit/desktop/preload.cjs",
              "/Users/Glare/Library/Developer/ModularProgram/hoewo/Workshop-Feedbacks/webapps/feedback-console-web/src/lib/api/feedbackV2Client.ts",
              "/Users/Glare/Library/Developer/ModularProgram/hoewo/Workshop-Feedbacks/webapps/feedback-console-web/src/lib/api/endpoints/feedbacks.ts",
              "runtime/arcorbit/test/organization-center-electron.test.mjs"
            ]
          }
        ],
        "facts_superseded": [],
        "impacts_added": [
          {
            "id": "IMPACT-20260826-013-002",
            "fact_id": "FACT-20260826-013-006",
            "fact_revision": 1,
            "target": {
              "kind": "software_decision",
              "ref": "product_capabilities",
              "revision": 38
            },
            "effect": "threatened",
            "reason": "恢复能力已经成为明确产品能力，但生产代码尚未提供入口和完整 mutation 链。",
            "gap_ids": [
              "GAP-20260826-013-002",
              "GAP-20260826-013-003"
            ],
            "evidence": [
              "runtime/arcorbit/desktop/renderer/renderer.js",
              "runtime/arcorbit/src/workshop-platform-adapter.mjs"
            ]
          },
          {
            "id": "IMPACT-20260826-013-003",
            "fact_id": "FACT-20260826-013-006",
            "fact_revision": 1,
            "target": {
              "kind": "software_decision",
              "ref": "external_integrations",
              "revision": 13
            },
            "effect": "threatened",
            "reason": "Workshop Feedback V2 的当前 provider/client 合约只有 ignore，没有与之成对的 restore。",
            "gap_ids": [
              "GAP-20260826-013-003"
            ],
            "evidence": [
              "/Users/Glare/Library/Developer/ModularProgram/hoewo/Workshop-Feedbacks/webapps/feedback-console-web/src/lib/api/feedbackV2Client.ts",
              "/Users/Glare/Library/Developer/ModularProgram/hoewo/Workshop-Feedbacks/webapps/feedback-console-web/src/lib/api/endpoints/feedbacks.ts"
            ]
          },
          {
            "id": "IMPACT-20260826-013-004",
            "fact_id": "FACT-20260826-013-006",
            "fact_revision": 1,
            "target": {
              "kind": "software_decision",
              "ref": "technical_foundation",
              "revision": 41
            },
            "effect": "threatened",
            "reason": "已接受的 typed restore 链尚未在 Adapter、Coordinator、main IPC、preload 与 Renderer 中实现。",
            "gap_ids": [
              "GAP-20260826-013-002",
              "GAP-20260826-013-003"
            ],
            "evidence": [
              "runtime/arcorbit/src/workshop-platform-adapter.mjs",
              "runtime/arcorbit/src/platform-coordinator.mjs",
              "runtime/arcorbit/desktop/main.mjs",
              "runtime/arcorbit/desktop/preload.cjs",
              "runtime/arcorbit/desktop/renderer/renderer.js"
            ]
          },
          {
            "id": "IMPACT-20260826-013-005",
            "fact_id": "FACT-20260826-013-006",
            "fact_revision": 1,
            "target": {
              "kind": "software_decision",
              "ref": "quality_and_validation",
              "revision": 20
            },
            "effect": "threatened",
            "reason": "当前测试只覆盖 ignore 和既有动作，还没有 V1/V2 恢复成功、失败关闭与上下文保持回归。",
            "gap_ids": [
              "GAP-20260826-013-002",
              "GAP-20260826-013-003"
            ],
            "evidence": [
              "runtime/arcorbit/test/workshop-platform-adapter.test.mjs",
              "runtime/arcorbit/test/desktop-renderer.test.mjs",
              "runtime/arcorbit/test/organization-center-electron.test.mjs"
            ]
          },
          {
            "id": "IMPACT-20260826-013-006",
            "fact_id": "FACT-20260826-013-006",
            "fact_revision": 1,
            "target": {
              "kind": "software_invariant",
              "ref": "accepted-facts-are-realized",
              "revision": null
            },
            "effect": "threatened",
            "reason": "持久产品与交互预期已经建立，但真实软件和外部 V2 provider 尚未完整兑现。",
            "gap_ids": [
              "GAP-20260826-013-002",
              "GAP-20260826-013-003"
            ],
            "evidence": [
              "arckit/spec/agentic-software-development/arcorbit-platform-capabilities.md",
              "runtime/arcorbit/desktop/renderer/renderer.js",
              "/Users/Glare/Library/Developer/ModularProgram/hoewo/Workshop-Feedbacks/webapps/feedback-console-web/src/lib/api/feedbackV2Client.ts"
            ]
          }
        ],
        "impacts_updated": [
          {
            "id": "IMPACT-20260826-013-001",
            "fact_id": "FACT-20260826-013-001",
            "fact_revision": 1,
            "target": {
              "kind": "software_decision",
              "ref": "experience_and_interaction",
              "revision": 59
            },
            "effect": "upheld",
            "reason": "页面级恢复条件、动作、服务端确认、失败保持和选择语义已经写入权威 interaction、线框和产品规格。",
            "gap_ids": [],
            "evidence": [
              "arckit/interaction/platform-workspace/interaction.md",
              "arckit/interaction/platform-workspace/default.html",
              "arckit/spec/agentic-software-development/arcorbit-platform-capabilities.md"
            ]
          }
        ],
        "gaps_added": [
          {
            "id": "GAP-20260826-013-002",
            "status": "open",
            "goal": "在 ArcOrbit 实现已忽略反馈恢复入口、V1 metadata 映射、V2 restore typed action 链及成功/失败上下文保持回归。",
            "reason": "交互和技术契约已经明确，但生产 Renderer、Adapter、Coordinator、main IPC 与 preload 尚未兑现。",
            "derived_from": [
              "FACT-20260826-013-001",
              "FACT-20260826-013-004",
              "FACT-20260826-013-005",
              "FACT-20260826-013-006"
            ],
            "blocked_by": [],
            "priority_basis": {
              "blocking": "直接阻塞用户在 ArcOrbit 中纠正误忽略。",
              "uncertainty": "实现边界已明确，主要剩余风险是跨 V1/V2 一致性。",
              "risk": "错误的乐观状态或不完整 metadata 会造成状态再次漂移。",
              "user_impact": "没有入口时已忽略反馈无法在 ArcOrbit 恢复。"
            },
            "responsibility": "agent",
            "evidence_required": [
              "Renderer 仅对 ignored 且未关联反馈展示恢复动作，并在服务端确认后刷新状态。",
              "V1 update 同时写入 ignored=false、feedback_state=pending、status=analyzing 且保留无关 metadata。",
              "V2 Adapter、Coordinator、main IPC、preload 使用固定 restore typed action，不开放通用网络或 triage 注入。",
              "自动化覆盖 V1/V2 成功、403/404/冲突/网络失败、状态不乐观改写和筛选/选择/滚动保持。"
            ],
            "resolution": null
          },
          {
            "id": "GAP-20260826-013-003",
            "status": "open",
            "goal": "在 Workshop Feedback provider 提供并验证 POST /feedbacks/{id}/restore，将 ignored 原子恢复为 pending 并返回更新后的 Feedback。",
            "reason": "当前 V2 Console 与 ArcOrbit client 只有专用 ignore，通用 update 也不接受 triage_status；外部服务契约缺失会使 V2 恢复无法真实工作。",
            "derived_from": [
              "FACT-20260826-013-005",
              "FACT-20260826-013-006"
            ],
            "blocked_by": [],
            "priority_basis": {
              "blocking": "阻塞 V2 反馈恢复在真实环境可用。",
              "uncertainty": "服务端实现仓库不在当前授权 workspace。",
              "risk": "若没有状态前置校验和权限验证，可能覆盖并发更新或扩大 mutation 权限。",
              "user_impact": "V2 项目的误忽略仍无法恢复。"
            },
            "responsibility": "external",
            "evidence_required": [
              "provider route 与权限实现证据。",
              "ignored → pending 成功、非 ignored 冲突、403、404 和并发状态检查测试。",
              "Workshop Feedback Console/SDK client 合约与返回对象类型同步证据。"
            ],
            "resolution": null
          }
        ],
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
            "area_ref": "product_capabilities",
            "observed_revision": 37,
            "set_decision": {
              "status": "settled",
              "statement": "ArcOrbit 保留既有 Desktop、Runtime、Chat、Automation、Feedback 与 Work 能力和边界。Work 是 Workshop 待办同步与本地 Task Projection 的唯一客户端所有者；新建和编辑 Sheet 提供完整七状态，编辑 Sheet 是异常纠偏兜底，Inspector 按当前状态提供有限下一步动作。Work Inspector 默认更宽，支持可访问拖拽调宽与跨应用重启恢复，并使用内容、紧凑属性、协作和验收语义分区。Work 编辑待办允许把内容复制到当前产品集内另一个可写产品，并在目标创建获 Workshop 确认后删除源 Task。目标 Task 获得新身份，仅复制正文、状态、优先级及目标产品内重新选择的关联字段，不继承评论、附件、Run、session、thread、Gate 或验收问题。Work 负责两阶段 mutation 和部分成功恢复；Automation 只消费服务器确认后的本地状态。Setup Readiness 在应用冷启动时 fresh-check Desktop Store 中全部已关联本地项目相对于内置 payload 的 skill drift；新增或改变本地项目关联及用户主动重试会再次检查。项目集、具体项目、Workset 等纯查看切换、解除关联和 task start 不重新扫描 skills，task start 只消费已验证缓存并 fail closed。trusted Case binding 的既有能力和边界保持不变。Setup Readiness 对同名项目 skill、loader、共享资源和用户按需 catalog 冲突保留 typed diagnostic；当 provider 证明安全目标与唯一内置来源时，用户可逐项选择“备份并使用当前应用包覆盖所选同名 skill”，未选和无关内容保持不变。Feedback 中已忽略且未关联待办的反馈可恢复为待处理，恢复只在服务端确认 pending 后生效。",
              "reason": "当前 Case 明确了 Feedback 误忽略恢复是核心处理能力，同时保持远端事实所有权和既有受控集成边界。",
              "evidence": [
                "Current operator input, 2026-08-27",
                "arckit/spec/agentic-software-development/arcorbit-platform-capabilities.md",
                "arckit/interaction/platform-workspace/interaction.md"
              ],
              "confidence": "high",
              "resume_condition": "当 Feedback ignored/pending 状态模型、关联待办约束或恢复责任改变时重审。"
            },
            "gap_refs": [
              "GAP-agent-scenario-evaluation"
            ],
            "reason": "把当前用户明确要求的误操作恢复沉淀为可恢复产品能力。",
            "evidence": [
              "Current operator input, 2026-08-27",
              "arckit/spec/agentic-software-development/arcorbit-platform-capabilities.md"
            ]
          },
          {
            "area_ref": "experience_and_interaction",
            "observed_revision": 58,
            "set_decision": {
              "status": "settled",
              "statement": "ArcOrbit 保持既有 Personal、Product Lifecycle、Organization 导航与 Work、Automation、Feedback、Chat 等交互语义。Work 新建和编辑 Sheet 保留完整七状态，编辑 Sheet 承担异常纠偏；右侧 Inspector 按当前状态显示有限下一步动作。Work Inspector 首次使用 440px，用户可通过 12px 可访问分隔条在 360–640px 保存范围内拖拽、键盘调整或双击复位，偏好跨任务、项目、Workset 和应用重启恢复。布局为任务树保留至少 420px，窗口临时收窄只改变有效宽度且不覆盖保存值。Inspector 以单一内部滚动区组织身份动作、内容、紧凑属性、协作和按状态出现的验收分区，宽度变化不丢失选择、滚动、草稿或附件状态。验收问题条目的问题原文与进展文本在 Inspector 当前可用宽度内完整折行且不横向越界，状态徽标保持清晰可见。Work 已完成列表按新完成在上、历史完成在下排列；标记首项为已验收后选择下一条较旧待办，标记其他位置后选择相邻较新待办，树补全项不参与目标计算，且选择只在服务器确认成功后切换。验收请求期间允许浏览其他任务；若用户在服务器确认前产生较新的选择，成功回调保留该选择而不执行旧任务的自动相邻切换。Work 新建待办 Sheet 在执行人控件下根据执行人与状态原位解释 Automation 资格。跨产品替换、主窗口和 Case 绑定恢复的既有交互保持不变。应用冷启动检查全部关联本地项目；新增或改变本地关联及用户主动重试再次检查。项目集全部、具体项目、Workset 或其它纯查看切换只改变业务投影，不进入 Setup；解除关联和 task start 不重新扫描 skills。task start 缓存断言失败时返回 Setup，等待用户主动重新检查。Setup 冲突页逐项显示稳定 code、skill、目标类型与路径及双方 digest；兜底覆盖默认全不选，支持逐项或全选可恢复项，独立确认 recovery root 与 fresh assessment digest，并反馈备份、替换、回滚和残留状态。Feedback 已忽略且未关联待办的详情显示“恢复为待处理”；动作无需二次确认，提交期间锁定自身，只有服务端确认 pending 后更新状态，失败时保持 ignored、筛选、选择和滚动位置。",
              "reason": "当前 Case 建立了 Feedback 误忽略恢复的完整页面状态、成功反馈与失败保持语义。",
              "evidence": [
                "Current operator input, 2026-08-27",
                "arckit/interaction/platform-workspace/interaction.md",
                "arckit/interaction/platform-workspace/default.html"
              ],
              "confidence": "high",
              "resume_condition": "当 Feedback 恢复入口、目标状态、关联待办限制、确认方式或失败上下文保持语义改变时重审。"
            },
            "gap_refs": [],
            "reason": "用权威页面交互事实消除已忽略状态没有恢复路径的歧义。",
            "evidence": [
              "arckit/interaction/platform-workspace/interaction.md",
              "arckit/interaction/platform-workspace/default.html"
            ]
          },
          {
            "area_ref": "external_integrations",
            "observed_revision": 12,
            "set_decision": {
              "status": "settled",
              "statement": "ArcOrbit 继续通过显式 main-process adapters 集成 Codex app-server/CLI、Workshop 和 Feedback，并保持 Renderer 无凭据、无通用请求能力。真实 Chat 使用可复用的 Codex Conversation 基础层处理 app-server initialize、persistent thread start/resume、turn start/interrupt、streamed items、token usage 和 approval request；ChatCoordinator 直接提交用户文本，不设置 Agent Loop output schema，也不调用 state-driven Runtime、trusted ledger 或 Automation Coordinator。Workshop Task Source 与 realtime adapter 只服务 main-process Work Sync；Work Sync 负责订阅范围、REST 对账、mutation 和本地投影发布，Automation 不直接集成 Workshop。Feedback V2 和产品反馈 SDK 的既有契约与恢复行为保持不变。Workshop Feedback SDK 用户端和 Console 开发者端共同定义双向 V2 消息域；ArcOrbit 对 Workset 项目默认探测开发者能力，列表失败回退 V1，单项失败仅降级对应动作，不用安装包 allowlist 隐藏能力。Feedback V2 的忽略恢复采用固定 POST /feedbacks/{id}/restore 领域合约，仅允许 ignored 原子进入 pending；缺少 provider 合约时失败关闭，不通过通用 update 或 Renderer 本地状态伪装成功。Codex Setup 额外通过固定 main-process allowlist 集成 OpenAI 官方 macOS/Linux/Windows standalone installer 和 codex login、login status、logout 接口；网络、权限、process、capability 与 status 失败分别恢复，Renderer 不能提供 URL、argv、environment 或 shell。",
              "reason": "当前源码证据证明 V2 restore 是新增的外部 provider 合约，必须保持与专用 ignore 相同的受控 adapter 边界。",
              "evidence": [
                "arckit/tech/arcorbit/platform-composition-solution.md",
                "runtime/arcorbit/src/workshop-platform-adapter.mjs",
                "/Users/Glare/Library/Developer/ModularProgram/hoewo/Workshop-Feedbacks/webapps/feedback-console-web/src/lib/api/feedbackV2Client.ts"
              ],
              "confidence": "high",
              "resume_condition": "当 V2 restore route、状态前置条件、返回对象、权限或 provider capability detection 改变时重审。"
            },
            "gap_refs": [
              "GAP-runtime-resilience-and-adapters"
            ],
            "reason": "明确 V2 恢复不能由 Renderer 或现有通用 update 推断。",
            "evidence": [
              "arckit/tech/arcorbit/platform-composition-solution.md",
              "runtime/arcorbit/src/workshop-platform-adapter.mjs"
            ]
          },
          {
            "area_ref": "technical_foundation",
            "observed_revision": 40,
            "set_decision": {
              "status": "settled",
              "statement": "Arckit 与 ArcOrbit 的既有 ledger、Electron、Runtime、Platform Coordinator、Work Sync、Chat、Setup Readiness 和 trusted case-control 技术边界保持不变。Work Inspector 偏好继续由 Desktop Store、typed preload action 和 Renderer 持有。应用冷启动的 coordinated Setup Readiness 由 main process fresh-read Desktop Store 中全部本地 Product Workspace roots；新增或改变本地关联及用户主动 retry 使用相同 aggregate check，显式空 roots 清除既有 project plan 并执行 global-only。Renderer 项目/Workset 筛选不触发检查，解除关联跳过检查。SkillProvisioningManager.assertReady(projectRoot) 只读取内存 snapshot，要求 ready 且 project root 位于最近成功检查的 plan.project_roots；Chat/Automation task start 不调用 provider 或扫描 skills。SkillProvisioningManager 的 plan、drift、同名冲突诊断和 backup-and-overwrite-selected 事务边界保持不变。Feedback V1 恢复通过受控 update 同时写入 ignored=false、feedback_state=pending 和 status=analyzing；V2 恢复由 Platform Adapter、Coordinator、main IPC、preload 和 Renderer 的 restoreFeedbackV2 typed action 链调用固定 provider route，并只在服务端确认后刷新投影。",
              "reason": "当前 Gap 查明了 V1 metadata 兼容要求和 V2 不可由通用 update 替代的技术边界。",
              "evidence": [
                "arckit/tech/arcorbit/platform-composition-solution.md",
                "runtime/arcorbit/desktop/renderer/renderer.js",
                "runtime/arcorbit/src/workshop-platform-adapter.mjs",
                "runtime/arcorbit/src/platform-coordinator.mjs",
                "runtime/arcorbit/desktop/main.mjs",
                "runtime/arcorbit/desktop/preload.cjs"
              ],
              "confidence": "high",
              "resume_condition": "当 Feedback 状态字段、V2 provider route、typed IPC 链或服务端确认投影改变时重审。"
            },
            "gap_refs": [
              "GAP-runtime-resilience-and-adapters"
            ],
            "reason": "使忽略恢复在现有 main-process adapter 安全架构内可解释且可实现。",
            "evidence": [
              "arckit/tech/arcorbit/platform-composition-solution.md"
            ]
          },
          {
            "area_ref": "quality_and_validation",
            "observed_revision": 19,
            "set_decision": {
              "status": "settled",
              "statement": "既有协议、Runtime、realtime、Work、Chat、Automation、安全、Setup、同名冲突恢复和跨平台窗口验证义务保持不变。Setup Readiness 还必须证明：冷启动检查全部关联本地 roots；新增或改绑后再次检查全部 roots；项目集、具体项目和 Workset 纯查看切换不调用 Setup；解除关联不产生检查；用户主动 retry 保持 fresh-check；task-start skill preflight 不读取文件或调用 provider，只接受 ready 且覆盖当前规范化 root 的缓存状态；未验证 root fail closed。Feedback 忽略恢复还必须覆盖 V1 metadata 一致写入、V2 专用 route 与 typed IPC、ignored → pending 服务端确认、权限/对象/冲突/网络失败，以及失败时状态、筛选、选择和滚动位置不被乐观改写。完整 ArcOrbit 套件与需要 GUI 权限的 Electron 回归必须分别记录可重复结果。",
              "reason": "状态恢复横跨 V1/V2 和外部 provider，必须以成功与失败关闭证据控制误操作和状态漂移风险。",
              "evidence": [
                "arckit/tech/arcorbit/platform-composition-solution.md",
                "arckit/spec/agentic-software-development/arcorbit-platform-capabilities.md",
                "Verification: 62 focused baseline tests passed"
              ],
              "confidence": "high",
              "resume_condition": "当 Feedback restore 状态字段、route、错误映射或选择保持语义改变时重审。"
            },
            "gap_refs": [
              "GAP-agent-scenario-evaluation",
              "GAP-cross-record-audit"
            ],
            "reason": "把本轮识别的跨版本状态恢复风险转为明确验证责任。",
            "evidence": [
              "arckit/tech/arcorbit/platform-composition-solution.md",
              "arckit/spec/agentic-software-development/arcorbit-platform-capabilities.md"
            ]
          }
        ],
        "software_invariant_changes": [],
        "project_gap_changes": [],
        "selection_context_change": null,
        "evidence": [
          "arckit/interaction/platform-workspace/interaction.md",
          "arckit/interaction/platform-workspace/default.html",
          "arckit/spec/agentic-software-development/arcorbit-platform-capabilities.md",
          "arckit/tech/arcorbit/platform-composition-solution.md"
        ]
      },
      "invariant_assessment": {
        "project_revision": 299,
        "judgments": [
          {
            "invariant_ref": "product-expectations-remain-recoverable",
            "disposition": "upheld",
            "reason": "ignored → pending 的能力、对象限制、服务端确认和失败语义已经写入权威产品规格。",
            "fact_refs": [
              "FACT-20260826-013-003"
            ],
            "evidence": [
              "arckit/spec/agentic-software-development/arcorbit-platform-capabilities.md",
              "arckit/spec/INDEX.md"
            ],
            "gap_refs": []
          },
          {
            "invariant_ref": "interaction-expectations-remain-recoverable",
            "disposition": "upheld",
            "reason": "页面级入口、提交中状态、选择保持与失败恢复已由交互源和独立线框状态共同表达。",
            "fact_refs": [
              "FACT-20260826-013-003"
            ],
            "evidence": [
              "arckit/interaction/platform-workspace/interaction.md",
              "arckit/interaction/platform-workspace/default.html",
              "arckit/interaction/INDEX.md"
            ],
            "gap_refs": []
          },
          {
            "invariant_ref": "visual-language-remains-consistent",
            "disposition": "not_relevant",
            "reason": "本轮只新增既有按钮、状态徽标、双栏和灰度线框组件的状态投影，没有建立或改变视觉语言规则。",
            "fact_refs": [],
            "evidence": [],
            "gap_refs": []
          },
          {
            "invariant_ref": "technical-decisions-remain-explainable",
            "disposition": "upheld",
            "reason": "V1 字段组合、V2 专用 route、typed IPC 所有权、服务端确认和失败关闭均有可恢复技术说明及源码依据。",
            "fact_refs": [
              "FACT-20260826-013-004",
              "FACT-20260826-013-005",
              "FACT-20260826-013-006"
            ],
            "evidence": [
              "arckit/tech/arcorbit/platform-composition-solution.md",
              "runtime/arcorbit/src/workshop-platform-adapter.mjs",
              "runtime/arcorbit/src/platform-coordinator.mjs",
              "runtime/arcorbit/desktop/main.mjs",
              "runtime/arcorbit/desktop/preload.cjs"
            ],
            "gap_refs": []
          },
          {
            "invariant_ref": "accepted-facts-are-realized",
            "disposition": "threatened",
            "reason": "稳定产品与交互预期已经接受，但 ArcOrbit 生产代码没有恢复入口或 typed chain，外部 V2 provider 也没有 restore 合约。",
            "fact_refs": [
              "FACT-20260826-013-001",
              "FACT-20260826-013-006"
            ],
            "evidence": [
              "runtime/arcorbit/desktop/renderer/renderer.js",
              "runtime/arcorbit/src/workshop-platform-adapter.mjs",
              "/Users/Glare/Library/Developer/ModularProgram/hoewo/Workshop-Feedbacks/webapps/feedback-console-web/src/lib/api/feedbackV2Client.ts"
            ],
            "gap_refs": [
              "GAP-20260826-013-002",
              "GAP-20260826-013-003"
            ]
          },
          {
            "invariant_ref": "material-risks-have-credible-evidence",
            "disposition": "upheld",
            "reason": "“只补 UI 会造成 V2 假成功或状态漂移”的风险由生产 Renderer、Adapter、Console client 和 update 类型共同证明，并通过独立 agent/external gaps 保留未控制义务。",
            "fact_refs": [
              "FACT-20260826-013-006",
              "FACT-20260826-013-004",
              "FACT-20260826-013-005"
            ],
            "evidence": [
              "runtime/arcorbit/desktop/renderer/renderer.js",
              "runtime/arcorbit/src/workshop-platform-adapter.mjs",
              "/Users/Glare/Library/Developer/ModularProgram/hoewo/Workshop-Feedbacks/webapps/feedback-console-web/src/lib/api/feedbackV2Client.ts",
              "/Users/Glare/Library/Developer/ModularProgram/hoewo/Workshop-Feedbacks/webapps/feedback-console-web/src/lib/api/endpoints/feedbacks.ts",
              "Verification: 62 focused tests passed"
            ],
            "gap_refs": []
          }
        ]
      },
      "evidence": [
        "Current operator input, 2026-08-27",
        "arckit/interaction/platform-workspace/interaction.md",
        "arckit/interaction/platform-workspace/default.html",
        "arckit/spec/agentic-software-development/arcorbit-platform-capabilities.md",
        "arckit/tech/arcorbit/platform-composition-solution.md",
        "runtime/arcorbit/desktop/renderer/renderer.js",
        "runtime/arcorbit/src/workshop-platform-adapter.mjs",
        "runtime/arcorbit/src/platform-coordinator.mjs",
        "runtime/arcorbit/desktop/main.mjs",
        "runtime/arcorbit/desktop/preload.cjs",
        "/Users/Glare/Library/Developer/ModularProgram/hoewo/Workshop-Feedbacks/webapps/feedback-console-web/src/lib/api/feedbackV2Client.ts",
        "Verification: wireframe projection contains 8 complete states",
        "Verification: 62 focused tests passed, 0 failed",
        "Verification: git diff --check passed"
      ],
      "runtime_result_ref": "arckit-runtime://runs/RUN-20260826-161752559Z-ed7334d9",
      "occurred_at": "2026-08-26T16:34:16.474Z"
    },
    {
      "round": 2,
      "transition_schema_version": "arckit-case-transition/v8",
      "goal": "在 ArcOrbit 生产代码中实现 ignored 且未关联反馈的恢复入口、完整 V1 metadata 映射、固定 V2 restore typed action 链和成功/失败回归。",
      "outcome": "completed",
      "gap_selection": {
        "mode": "candidate",
        "basis": "基于 fresh snapshot ada6328f62bde9f1802e769a36bcc37510cf0d5ac4bb8a44a8087a583f2fe70d、Case-scoped selection token、当前用户阻塞和候选责任边界比较 candidate catalog 中的全部 persisted candidates。",
        "snapshot_token": "8207ed8b1bc2df79ac9827a3d86abb414bfb72293391e99870d9254788dc02a1",
        "selected_ref": "case-gap:CASE-20260826-013:GAP-20260826-013-002",
        "comparison_summary": "GAP-20260826-013-002 是 catalog 中唯一 ready 且直接解除当前 ArcOrbit 客户端阻塞的 Case Gap；四个 Project Gap 均需独立 Case且不直接完成当前恢复入口。GAP-003 是有效的 blocked external obligation，但不属于本次 persisted candidate catalog。",
        "fresh_discovery_summary": "执行前及实现过程中未发现需要抢占 GAP-002 的 fresh candidate；外部 provider 缺口已由 open GAP-003 承载，但未作为本次 candidate 参与 selection trace。",
        "considered": [
          {
            "ref": "project-gap:GAP-agent-scenario-evaluation",
            "source": "persisted",
            "eligibility": "case_required",
            "disposition": "deferred",
            "priority_basis": {
              "blocking": "不直接阻塞当前 Feedback 恢复入口。",
              "uncertainty": "high",
              "risk": "high",
              "user_impact": "面向跨场景 Agent 验证，不解除当前误忽略问题。"
            },
            "reason": "需要独立 Case，当前用户阻塞更直接。"
          },
          {
            "ref": "project-gap:GAP-runtime-resilience-and-adapters",
            "source": "persisted",
            "eligibility": "case_required",
            "disposition": "deferred",
            "priority_basis": {
              "blocking": "不直接阻塞当前 Feedback 页面恢复。",
              "uncertainty": "medium",
              "risk": "high",
              "user_impact": "影响 Runtime 长时执行而非本次状态恢复。"
            },
            "reason": "需要独立 Case，不能并入当前客户端实现主张。"
          },
          {
            "ref": "project-gap:GAP-security-real-project-validation",
            "source": "persisted",
            "eligibility": "case_required",
            "disposition": "deferred",
            "priority_basis": {
              "blocking": "不直接阻塞当前受控 restore 调用链。",
              "uncertainty": "medium",
              "risk": "high",
              "user_impact": "面向真实权限项目的独立安全验证。"
            },
            "reason": "需要独立 Case；本轮沿用已有 typed IPC 与 main-process 安全边界。"
          },
          {
            "ref": "project-gap:GAP-cross-record-audit",
            "source": "persisted",
            "eligibility": "case_required",
            "disposition": "deferred",
            "priority_basis": {
              "blocking": "不直接阻塞当前页面能力。",
              "uncertainty": "medium",
              "risk": "high",
              "user_impact": "面向 canonical records 一致性。"
            },
            "reason": "虽具有高风险与紧迫性，但需要独立 Case。"
          },
          {
            "ref": "case-gap:CASE-20260826-013:GAP-20260826-013-002",
            "source": "persisted",
            "eligibility": "ready",
            "disposition": "selected",
            "priority_basis": {
              "blocking": "直接阻塞用户在 ArcOrbit 中纠正误忽略。",
              "uncertainty": "实现边界已由上一轮接受，主要风险是跨 V1/V2 一致性。",
              "risk": "不完整 metadata 或乐观改写会造成状态漂移。",
              "user_impact": "没有恢复入口时反馈会停留在错误状态。"
            },
            "reason": "当前唯一 agent-ready 的直接用户价值候选，且实现和验收边界已由 accepted facts 确定。"
          }
        ]
      },
      "selected_gap": {
        "id": "GAP-20260826-013-002",
        "responsibility": "agent",
        "goal": "在 ArcOrbit 实现已忽略反馈恢复入口、V1 metadata 映射、V2 restore typed action 链及成功/失败上下文保持回归。",
        "reason": "交互和技术契约已经明确，但生产 Renderer、Adapter、Coordinator、main IPC 与 preload 尚未兑现。",
        "derived_from": [
          "FACT-20260826-013-001",
          "FACT-20260826-013-004",
          "FACT-20260826-013-005",
          "FACT-20260826-013-006"
        ],
        "blocked_by": [],
        "priority_basis": {
          "blocking": "直接阻塞用户在 ArcOrbit 中纠正误忽略。",
          "uncertainty": "实现边界已明确，主要剩余风险是跨 V1/V2 一致性。",
          "risk": "错误的乐观状态或不完整 metadata 会造成状态再次漂移。",
          "user_impact": "没有入口时已忽略反馈无法在 ArcOrbit 恢复。"
        },
        "evidence_required": [
          "Renderer 仅对 ignored 且未关联反馈展示恢复动作，并在服务端确认后刷新状态。",
          "V1 update 同时写入 ignored=false、feedback_state=pending、status=analyzing 且保留无关 metadata。",
          "V2 Adapter、Coordinator、main IPC、preload 使用固定 restore typed action，不开放通用网络或 triage 注入。",
          "自动化覆盖 V1/V2 成功、403/404/冲突/网络失败、状态不乐观改写和筛选/选择/滚动保持。"
        ]
      },
      "planned_transition": {
        "goal": "在 ArcOrbit 生产代码中实现 ignored 且未关联反馈的恢复入口、完整 V1 metadata 映射、固定 V2 restore typed action 链和成功/失败回归。",
        "expected_state_change": "GAP-20260826-013-002 被解决；ArcOrbit 客户端技术实现得到兑现，外部 provider 的影响和 GAP-003 保持 open。"
      },
      "accepted_state_delta": {
        "resolved_gap": {
          "id": "GAP-20260826-013-002",
          "status": "resolved",
          "outcome": "implemented",
          "reason": "ArcOrbit 已只对 ignored 且未关联待办的反馈显示恢复入口；V1 保留无关 metadata 并写入 ignored=false、feedback_state=pending、status=analyzing；V2 通过固定 restore route 的 Adapter、Coordinator、main IPC、preload 和 Renderer 链调用，且只在服务端成功后刷新。失败路径不乐观改写状态并恢复按钮可用性。",
          "evidence": [
            "runtime/arcorbit/desktop/renderer/renderer.js",
            "runtime/arcorbit/src/workshop-platform-adapter.mjs",
            "runtime/arcorbit/src/platform-coordinator.mjs",
            "runtime/arcorbit/desktop/main.mjs",
            "runtime/arcorbit/desktop/preload.cjs",
            "runtime/arcorbit/test/desktop-renderer.test.mjs",
            "runtime/arcorbit/test/platform-coordinator.test.mjs",
            "runtime/arcorbit/test/workshop-platform-adapter.test.mjs",
            "Verification: 78 focused tests passed, 0 failed",
            "Verification: ArcOrbit suite 527 tests; 506 passed, 19 skipped, 2 Electron sandbox-only failures; authorized Electron rerun 2 passed",
            "Verification: syntax check and git diff --check passed"
          ]
        },
        "facts_added": [
          {
            "id": "FACT-20260826-013-007",
            "revision": 1,
            "status": "accepted",
            "statement": "ArcOrbit 生产客户端现已兑现已忽略反馈恢复：Renderer 仅为 ignored 且未关联待办的反馈显示恢复入口；V1 使用完整兼容 metadata；V2 使用固定 restore typed action 链；成功后刷新，失败时不乐观改写状态。Workshop Feedback V2 provider route 仍未在当前授权 workspace 中实现。",
            "basis": "生产代码实现、行为级自动化与完整 ArcOrbit 回归共同证明客户端边界已经兑现，同时既有外部 provider 缺口仍由独立 Gap 承载。",
            "evidence": [
              "runtime/arcorbit/desktop/renderer/renderer.js",
              "runtime/arcorbit/src/workshop-platform-adapter.mjs",
              "runtime/arcorbit/src/platform-coordinator.mjs",
              "runtime/arcorbit/desktop/main.mjs",
              "runtime/arcorbit/desktop/preload.cjs",
              "runtime/arcorbit/test/desktop-renderer.test.mjs",
              "runtime/arcorbit/test/platform-coordinator.test.mjs",
              "runtime/arcorbit/test/workshop-platform-adapter.test.mjs",
              "Verification: 78 focused tests passed, 0 failed",
              "Verification: authorized Electron rerun 2 passed"
            ]
          }
        ],
        "facts_superseded": [
          {
            "id": "FACT-20260826-013-006",
            "revision": 1,
            "reason": "该事实关于外部 V2 provider 缺少 restore 合约的部分仍成立，但 ArcOrbit Renderer 与 typed action chain 缺失的陈述已被本轮生产实现改变，由新的客户端实现事实取代。",
            "evidence": [
              "runtime/arcorbit/desktop/renderer/renderer.js",
              "runtime/arcorbit/src/workshop-platform-adapter.mjs",
              "runtime/arcorbit/src/platform-coordinator.mjs",
              "runtime/arcorbit/desktop/main.mjs",
              "runtime/arcorbit/desktop/preload.cjs"
            ]
          }
        ],
        "impacts_added": [],
        "impacts_updated": [
          {
            "id": "IMPACT-20260826-013-002",
            "fact_id": "FACT-20260826-013-007",
            "fact_revision": 1,
            "target": {
              "kind": "software_decision",
              "ref": "product_capabilities",
              "revision": 38
            },
            "effect": "threatened",
            "reason": "ArcOrbit 客户端能力已经实现，但 V2 provider route 尚未实现，完整产品能力仍受外部 GAP-003 威胁。",
            "gap_ids": [
              "GAP-20260826-013-003"
            ],
            "evidence": [
              "runtime/arcorbit/desktop/renderer/renderer.js",
              "runtime/arcorbit/src/workshop-platform-adapter.mjs",
              "arckit/spec/agentic-software-development/arcorbit-platform-capabilities.md"
            ]
          },
          {
            "id": "IMPACT-20260826-013-003",
            "fact_id": "FACT-20260826-013-007",
            "fact_revision": 1,
            "target": {
              "kind": "software_decision",
              "ref": "external_integrations",
              "revision": 13
            },
            "effect": "threatened",
            "reason": "ArcOrbit 已调用固定 restore 领域 route，但 Workshop Feedback V2 provider 尚未提供该外部合约。",
            "gap_ids": [
              "GAP-20260826-013-003"
            ],
            "evidence": [
              "runtime/arcorbit/src/workshop-platform-adapter.mjs",
              "runtime/arcorbit/test/workshop-platform-adapter.test.mjs",
              "arckit/tech/arcorbit/platform-composition-solution.md"
            ]
          },
          {
            "id": "IMPACT-20260826-013-004",
            "fact_id": "FACT-20260826-013-007",
            "fact_revision": 1,
            "target": {
              "kind": "software_decision",
              "ref": "technical_foundation",
              "revision": 41
            },
            "effect": "upheld",
            "reason": "V1 metadata 映射和 V2 Adapter、Coordinator、main IPC、preload、Renderer typed action chain 均已按接受的技术边界实现。",
            "gap_ids": [],
            "evidence": [
              "runtime/arcorbit/src/workshop-platform-adapter.mjs",
              "runtime/arcorbit/src/platform-coordinator.mjs",
              "runtime/arcorbit/desktop/main.mjs",
              "runtime/arcorbit/desktop/preload.cjs",
              "runtime/arcorbit/desktop/renderer/renderer.js"
            ]
          },
          {
            "id": "IMPACT-20260826-013-005",
            "fact_id": "FACT-20260826-013-007",
            "fact_revision": 1,
            "target": {
              "kind": "software_decision",
              "ref": "quality_and_validation",
              "revision": 20
            },
            "effect": "threatened",
            "reason": "ArcOrbit 客户端的 V1/V2 成功、失败关闭和上下文保持回归已经完成；provider 端权限、并发和状态前置校验仍需 GAP-003 证据。",
            "gap_ids": [
              "GAP-20260826-013-003"
            ],
            "evidence": [
              "runtime/arcorbit/test/desktop-renderer.test.mjs",
              "runtime/arcorbit/test/platform-coordinator.test.mjs",
              "runtime/arcorbit/test/workshop-platform-adapter.test.mjs",
              "Verification: ArcOrbit suite 527 tests; authorized Electron rerun 2 passed"
            ]
          },
          {
            "id": "IMPACT-20260826-013-006",
            "fact_id": "FACT-20260826-013-007",
            "fact_revision": 1,
            "target": {
              "kind": "software_invariant",
              "ref": "accepted-facts-are-realized",
              "revision": null
            },
            "effect": "threatened",
            "reason": "ArcOrbit 客户端已兑现 accepted facts，但外部 V2 provider 尚未实现 restore 合约，因此完整真实环境能力仍未全部实现。",
            "gap_ids": [
              "GAP-20260826-013-003"
            ],
            "evidence": [
              "runtime/arcorbit/desktop/renderer/renderer.js",
              "runtime/arcorbit/src/workshop-platform-adapter.mjs",
              "arckit/tech/arcorbit/platform-composition-solution.md"
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
          "runtime/arcorbit/desktop/renderer/renderer.js",
          "runtime/arcorbit/src/workshop-platform-adapter.mjs",
          "runtime/arcorbit/src/platform-coordinator.mjs",
          "runtime/arcorbit/desktop/main.mjs",
          "runtime/arcorbit/desktop/preload.cjs",
          "runtime/arcorbit/test/desktop-renderer.test.mjs",
          "runtime/arcorbit/test/platform-coordinator.test.mjs",
          "runtime/arcorbit/test/workshop-platform-adapter.test.mjs"
        ]
      },
      "invariant_assessment": {
        "project_revision": 300,
        "judgments": [
          {
            "invariant_ref": "product-expectations-remain-recoverable",
            "disposition": "upheld",
            "reason": "恢复对象、目标状态、服务端确认与外部依赖仍由权威产品规格明确表达，客户端实现未改变其语义。",
            "fact_refs": [
              "FACT-20260826-013-003",
              "FACT-20260826-013-007"
            ],
            "evidence": [
              "arckit/spec/agentic-software-development/arcorbit-platform-capabilities.md",
              "arckit/spec/INDEX.md"
            ],
            "gap_refs": []
          },
          {
            "invariant_ref": "interaction-expectations-remain-recoverable",
            "disposition": "upheld",
            "reason": "入口条件、无二次确认、提交中锁定、成功刷新和失败上下文保持已由交互文档与生产 Renderer 共同兑现。",
            "fact_refs": [
              "FACT-20260826-013-003",
              "FACT-20260826-013-007"
            ],
            "evidence": [
              "arckit/interaction/platform-workspace/interaction.md",
              "arckit/interaction/platform-workspace/default.html",
              "runtime/arcorbit/desktop/renderer/renderer.js",
              "runtime/arcorbit/test/desktop-renderer.test.mjs"
            ],
            "gap_refs": []
          },
          {
            "invariant_ref": "visual-language-remains-consistent",
            "disposition": "not_relevant",
            "reason": "本轮复用现有 secondary button、状态徽标与 Feedback action row，没有建立或改变视觉语言、token 或布局规则。",
            "fact_refs": [],
            "evidence": [],
            "gap_refs": []
          },
          {
            "invariant_ref": "technical-decisions-remain-explainable",
            "disposition": "upheld",
            "reason": "V1 字段组合与 V2 固定 route、typed IPC、服务端确认和失败关闭均在生产调用链中直接可追踪。",
            "fact_refs": [
              "FACT-20260826-013-004",
              "FACT-20260826-013-005",
              "FACT-20260826-013-007"
            ],
            "evidence": [
              "arckit/tech/arcorbit/platform-composition-solution.md",
              "runtime/arcorbit/src/workshop-platform-adapter.mjs",
              "runtime/arcorbit/src/platform-coordinator.mjs",
              "runtime/arcorbit/desktop/main.mjs",
              "runtime/arcorbit/desktop/preload.cjs",
              "runtime/arcorbit/desktop/renderer/renderer.js"
            ],
            "gap_refs": []
          },
          {
            "invariant_ref": "accepted-facts-are-realized",
            "disposition": "threatened",
            "reason": "ArcOrbit 客户端已经实现 accepted restore 事实，但外部 V2 provider route 仍缺失，完整真实环境能力尚未全部兑现。",
            "fact_refs": [
              "FACT-20260826-013-005",
              "FACT-20260826-013-007"
            ],
            "evidence": [
              "runtime/arcorbit/desktop/renderer/renderer.js",
              "runtime/arcorbit/src/workshop-platform-adapter.mjs",
              "arckit/tech/arcorbit/platform-composition-solution.md"
            ],
            "gap_refs": [
              "GAP-20260826-013-003"
            ]
          },
          {
            "invariant_ref": "material-risks-have-credible-evidence",
            "disposition": "upheld",
            "reason": "V1 metadata 漂移、V2 乐观更新和错误降级风险由行为级测试覆盖；外部 provider 风险继续以独立 blocked Gap 保留，没有被误报为已控制。",
            "fact_refs": [
              "FACT-20260826-013-004",
              "FACT-20260826-013-005",
              "FACT-20260826-013-007"
            ],
            "evidence": [
              "runtime/arcorbit/test/desktop-renderer.test.mjs",
              "runtime/arcorbit/test/platform-coordinator.test.mjs",
              "runtime/arcorbit/test/workshop-platform-adapter.test.mjs",
              "Verification: 78 focused tests passed, 0 failed",
              "Verification: ArcOrbit suite 527 tests; 506 passed, 19 skipped, authorized Electron rerun 2 passed"
            ],
            "gap_refs": []
          }
        ]
      },
      "evidence": [
        "runtime/arcorbit/desktop/renderer/renderer.js",
        "runtime/arcorbit/src/workshop-platform-adapter.mjs",
        "runtime/arcorbit/src/platform-coordinator.mjs",
        "runtime/arcorbit/desktop/main.mjs",
        "runtime/arcorbit/desktop/preload.cjs",
        "runtime/arcorbit/test/desktop-renderer.test.mjs",
        "runtime/arcorbit/test/platform-coordinator.test.mjs",
        "runtime/arcorbit/test/workshop-platform-adapter.test.mjs",
        "Verification: 78 focused tests passed, 0 failed",
        "Verification: ArcOrbit suite 527 tests; 506 passed, 19 skipped, 2 Electron sandbox-only failures; authorized Electron rerun 2 passed",
        "Verification: syntax check and git diff --check passed"
      ],
      "runtime_result_ref": "arckit-runtime://runs/RUN-20260826-161752559Z-ed7334d9",
      "occurred_at": "2026-08-26T16:43:15.964Z"
    },
    {
      "round": 3,
      "transition_schema_version": "arckit-case-transition/v8",
      "goal": "在 workshop-todo 实现并验证 Feedback V2 同记录恢复，保持反馈身份、消息、附件和 metadata，并使 ArcOrbit 现有 typed restore 链真实可用。",
      "outcome": "completed",
      "gap_selection": {
        "mode": "candidate",
        "basis": "基于 trusted snapshot 91cedf31ab36141461c123bca1d9fabd01ff42bc59de3a83e398efcedfd00549、Case selection token，以及 operator 授权联动修改 ../../hoewo/workshop-todo 的最新增量，重新比较全部 persisted candidates。",
        "snapshot_token": "d16a04ed2435440ea41e49da76f9684cd99bbd376a275a945c306b37220fe6c0",
        "selected_ref": "case-gap:CASE-20260826-013:GAP-20260826-013-003",
        "comparison_summary": "四个 Project Gap 均需独立 Case，不能直接恢复误忽略反馈。GAP-003 是当前 Case 唯一 ready candidate；新授权使原先的外部仓库阻塞消失，且其用户影响最直接，因此继续选择并在 workshop-todo 服务端完成。",
        "fresh_discovery_summary": "检查 workshop-todo 后确认 main 的 V1 通用 data update 不能维护 V2 triage_status；远端 Feedback V2 分支已经具备消息、通知、ignore 与 convert-to-task 基础，可直接补充同记录 restore route。未发现优先级更高的 fresh candidate。",
        "considered": [
          {
            "ref": "project-gap:GAP-agent-scenario-evaluation",
            "source": "persisted",
            "eligibility": "case_required",
            "disposition": "deferred",
            "priority_basis": {
              "blocking": "不直接阻塞 Feedback 恢复。",
              "uncertainty": "high",
              "risk": "high",
              "user_impact": "影响跨场景 Agent 选择验证。"
            },
            "reason": "需要独立 Case。"
          },
          {
            "ref": "project-gap:GAP-runtime-resilience-and-adapters",
            "source": "persisted",
            "eligibility": "case_required",
            "disposition": "deferred",
            "priority_basis": {
              "blocking": "不直接决定 Feedback V2 状态恢复。",
              "uncertainty": "medium",
              "risk": "high",
              "user_impact": "影响 Runtime 长时执行与通用 adapter 韧性。"
            },
            "reason": "需要独立 Case，当前 Feedback 问题具有更直接的用户阻塞。"
          },
          {
            "ref": "project-gap:GAP-security-real-project-validation",
            "source": "persisted",
            "eligibility": "case_required",
            "disposition": "deferred",
            "priority_basis": {
              "blocking": "不直接阻塞固定 restore route。",
              "uncertainty": "medium",
              "risk": "high",
              "user_impact": "影响真实权限项目的安全验证。"
            },
            "reason": "需要独立 Case；本轮继续保持 Renderer 无凭据和通用网络能力。"
          },
          {
            "ref": "project-gap:GAP-cross-record-audit",
            "source": "persisted",
            "eligibility": "case_required",
            "disposition": "deferred",
            "priority_basis": {
              "blocking": "不直接阻塞当前 Feedback 工作流。",
              "uncertainty": "medium",
              "risk": "high",
              "user_impact": "影响 canonical records 一致性。"
            },
            "reason": "需要独立 Case。"
          },
          {
            "ref": "case-gap:CASE-20260826-013:GAP-20260826-013-003",
            "source": "persisted",
            "eligibility": "ready",
            "disposition": "selected",
            "priority_basis": {
              "blocking": "缺少 provider route 会使 ArcOrbit V2 恢复稳定失败。",
              "uncertainty": "重新读取服务端源码后，实现位置与既有 V2 基础已经明确。",
              "risk": "缺少事务锁或状态前置校验可能覆盖并发流转。",
              "user_impact": "直接决定 V2 误忽略反馈能否恢复。"
            },
            "reason": "operator 已授权联动服务端；该 Gap 可在当前轮直接实现并验证。"
          }
        ]
      },
      "selected_gap": {
        "id": "GAP-20260826-013-003",
        "responsibility": "external",
        "goal": "在 Workshop Feedback provider 提供并验证 POST /feedbacks/{id}/restore，将 ignored 原子恢复为 pending 并返回更新后的 Feedback。",
        "reason": "当前 V2 Console 与 ArcOrbit client 只有专用 ignore，通用 update 也不接受 triage_status；外部服务契约缺失会使 V2 恢复无法真实工作。",
        "derived_from": [
          "FACT-20260826-013-005",
          "FACT-20260826-013-006"
        ],
        "blocked_by": [],
        "priority_basis": {
          "blocking": "阻塞 V2 反馈恢复在真实环境可用。",
          "uncertainty": "服务端实现仓库不在当前授权 workspace。",
          "risk": "若没有状态前置校验和权限验证，可能覆盖并发更新或扩大 mutation 权限。",
          "user_impact": "V2 项目的误忽略仍无法恢复。"
        },
        "evidence_required": [
          "provider route 与权限实现证据。",
          "ignored → pending 成功、非 ignored 冲突、403、404 和并发状态检查测试。",
          "Workshop Feedback Console/SDK client 合约与返回对象类型同步证据。"
        ]
      },
      "planned_transition": {
        "goal": "在 workshop-todo 实现并验证 Feedback V2 同记录恢复，保持反馈身份、消息、附件和 metadata，并使 ArcOrbit 现有 typed restore 链真实可用。",
        "expected_state_change": "GAP-003 以 provider route 已实现而解决；旧的“provider route 尚未实现”事实被 supersede；相关产品、集成、技术、质量与实现不变量影响改为 upheld。"
      },
      "accepted_state_delta": {
        "resolved_gap": {
          "id": "GAP-20260826-013-003",
          "status": "resolved",
          "outcome": "implemented",
          "reason": "workshop-todo Feedback V2 现已提供 POST /feedbacks/:id/restore。服务端在事务内锁定并重读反馈，要求当前为 ignored 且无主待办关系，再原子恢复同一记录的 triage_status/status/兼容 metadata；API Key、非 ignored、已关联待办和不存在对象均失败关闭。ignore、restore 与 convert-to-task 统一锁定同一反馈行，避免并发状态漂移。",
          "evidence": [
            "../../hoewo/workshop-todo/router/router.go",
            "../../hoewo/workshop-todo/handler/feedback_workflow.go",
            "../../hoewo/workshop-todo/handler/feedback_workflow_test.go",
            "../../hoewo/workshop-todo/router/router_test.go",
            "../../hoewo/workshop-todo/api/feedback.md",
            "Verification: workshop-todo go test ./... passed",
            "Verification: ArcOrbit 78 focused tests passed",
            "Verification: both workspaces git diff --check passed"
          ]
        },
        "facts_added": [
          {
            "id": "FACT-20260826-013-008",
            "revision": 1,
            "status": "accepted",
            "statement": "Workshop Todo Feedback V2 已实现同记录 ignored → pending 恢复。POST /workshop/v2/user/feedbacks/{id}/restore 只允许项目成员操作当前 ignored 且未关联主待办的反馈；事务锁定反馈行后原子更新 triage_status=pending、status=pending、data.feedback_state=pending 和 data.status=analyzing，保留反馈 ID、消息、附件与无关 metadata，并发布状态消息、通知和 realtime 更新。",
            "basis": "直接服务端实现、路由/API 文档、Go 测试及 ArcOrbit typed client 回归。",
            "evidence": [
              "../../hoewo/workshop-todo/handler/feedback_workflow.go",
              "../../hoewo/workshop-todo/router/router.go",
              "../../hoewo/workshop-todo/api/feedback.md",
              "../../hoewo/workshop-todo/handler/feedback_workflow_test.go",
              "../../hoewo/workshop-todo/router/router_test.go",
              "runtime/arcorbit/src/workshop-platform-adapter.mjs",
              "runtime/arcorbit/src/platform-coordinator.mjs",
              "Verification: workshop-todo go test ./... passed",
              "Verification: ArcOrbit 78 focused tests passed"
            ]
          }
        ],
        "facts_superseded": [
          {
            "id": "FACT-20260826-013-007",
            "revision": 1,
            "reason": "该事实关于 ArcOrbit 客户端实现的部分仍然成立，但“Workshop Feedback V2 provider route 尚未实现”已经被本轮 workshop-todo 服务端实现取代。",
            "evidence": [
              "../../hoewo/workshop-todo/handler/feedback_workflow.go",
              "../../hoewo/workshop-todo/router/router.go",
              "Verification: workshop-todo go test ./... passed"
            ]
          }
        ],
        "impacts_added": [],
        "impacts_updated": [
          {
            "id": "IMPACT-20260826-013-002",
            "fact_id": "FACT-20260826-013-008",
            "fact_revision": 1,
            "target": {
              "kind": "software_decision",
              "ref": "product_capabilities",
              "revision": 39
            },
            "effect": "upheld",
            "reason": "ArcOrbit 的 V1/V2 已忽略恢复能力现在都有真实服务端路径，V2 保持同一反馈身份与历史。",
            "gap_ids": [],
            "evidence": [
              "arckit/spec/agentic-software-development/arcorbit-platform-capabilities.md",
              "../../hoewo/workshop-todo/handler/feedback_workflow.go",
              "runtime/arcorbit/desktop/renderer/renderer.js"
            ]
          },
          {
            "id": "IMPACT-20260826-013-003",
            "fact_id": "FACT-20260826-013-008",
            "fact_revision": 1,
            "target": {
              "kind": "software_decision",
              "ref": "external_integrations",
              "revision": 13
            },
            "effect": "upheld",
            "reason": "Workshop Todo 已提供 ArcOrbit 固定 adapter 所调用的同记录 restore 领域合约，无需通用 update 或 Renderer 状态伪装。",
            "gap_ids": [],
            "evidence": [
              "../../hoewo/workshop-todo/router/router.go",
              "../../hoewo/workshop-todo/handler/feedback_workflow.go",
              "runtime/arcorbit/src/workshop-platform-adapter.mjs",
              "arckit/tech/arcorbit/platform-composition-solution.md"
            ]
          },
          {
            "id": "IMPACT-20260826-013-004",
            "fact_id": "FACT-20260826-013-008",
            "fact_revision": 1,
            "target": {
              "kind": "software_decision",
              "ref": "technical_foundation",
              "revision": 43
            },
            "effect": "upheld",
            "reason": "Provider route、事务行锁、状态/待办前置校验与现有 Adapter、Coordinator、IPC、preload、Renderer typed action chain 已形成完整调用链。",
            "gap_ids": [],
            "evidence": [
              "../../hoewo/workshop-todo/handler/feedback_workflow.go",
              "runtime/arcorbit/src/workshop-platform-adapter.mjs",
              "runtime/arcorbit/src/platform-coordinator.mjs",
              "runtime/arcorbit/desktop/main.mjs",
              "runtime/arcorbit/desktop/preload.cjs",
              "runtime/arcorbit/desktop/renderer/renderer.js"
            ]
          },
          {
            "id": "IMPACT-20260826-013-005",
            "fact_id": "FACT-20260826-013-008",
            "fact_revision": 1,
            "target": {
              "kind": "software_decision",
              "ref": "quality_and_validation",
              "revision": 21
            },
            "effect": "upheld",
            "reason": "服务端路由、状态兼容投影、API Key 拒绝和全量 Go 回归通过；ArcOrbit 侧固定 route、typed IPC、成功、失败关闭与无乐观改写由 78 项聚焦回归覆盖。真实 PostgreSQL 并发仍明确保留为部署环境验收边界，未被误报为自动化已覆盖。",
            "gap_ids": [],
            "evidence": [
              "../../hoewo/workshop-todo/handler/feedback_workflow_test.go",
              "../../hoewo/workshop-todo/router/router_test.go",
              "runtime/arcorbit/test/desktop-renderer.test.mjs",
              "runtime/arcorbit/test/platform-coordinator.test.mjs",
              "runtime/arcorbit/test/workshop-platform-adapter.test.mjs",
              "Verification: workshop-todo go test ./... passed",
              "Verification: ArcOrbit 78 focused tests passed"
            ]
          },
          {
            "id": "IMPACT-20260826-013-006",
            "fact_id": "FACT-20260826-013-008",
            "fact_revision": 1,
            "target": {
              "kind": "software_invariant",
              "ref": "accepted-facts-are-realized",
              "revision": null
            },
            "effect": "upheld",
            "reason": "接受的同记录恢复事实已由 ArcOrbit 客户端与 Workshop Todo provider 两端共同兑现。",
            "gap_ids": [],
            "evidence": [
              "../../hoewo/workshop-todo/handler/feedback_workflow.go",
              "runtime/arcorbit/src/workshop-platform-adapter.mjs",
              "runtime/arcorbit/desktop/renderer/renderer.js",
              "Verification: workshop-todo go test ./... passed",
              "Verification: ArcOrbit 78 focused tests passed"
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
          "arckit/spec/agentic-software-development/arcorbit-platform-capabilities.md",
          "arckit/interaction/platform-workspace/interaction.md",
          "arckit/interaction/platform-workspace/default.html",
          "arckit/tech/arcorbit/platform-composition-solution.md",
          "../../hoewo/workshop-todo/handler/feedback_workflow.go",
          "../../hoewo/workshop-todo/api/feedback.md"
        ]
      },
      "invariant_assessment": {
        "project_revision": 310,
        "judgments": [
          {
            "invariant_ref": "product-expectations-remain-recoverable",
            "disposition": "upheld",
            "reason": "V1 原地恢复、V2 同记录原子恢复、身份与历史保持及服务端确认条件均由权威产品规格和实际 provider 实现共同支持。",
            "fact_refs": [
              "FACT-20260826-013-001",
              "FACT-20260826-013-003",
              "FACT-20260826-013-008"
            ],
            "evidence": [
              "arckit/spec/agentic-software-development/arcorbit-platform-capabilities.md",
              "arckit/spec/INDEX.md",
              "../../hoewo/workshop-todo/handler/feedback_workflow.go"
            ],
            "gap_refs": []
          },
          {
            "invariant_ref": "interaction-expectations-remain-recoverable",
            "disposition": "upheld",
            "reason": "入口条件、提交锁定、同一反馈状态替换、成功上下文保持及失败恢复由交互文档、线框和 Renderer 一致表达。",
            "fact_refs": [
              "FACT-20260826-013-003",
              "FACT-20260826-013-008"
            ],
            "evidence": [
              "arckit/interaction/platform-workspace/interaction.md",
              "arckit/interaction/platform-workspace/default.html",
              "arckit/interaction/INDEX.md",
              "runtime/arcorbit/desktop/renderer/renderer.js"
            ],
            "gap_refs": []
          },
          {
            "invariant_ref": "visual-language-remains-consistent",
            "disposition": "not_relevant",
            "reason": "本轮只修正既有 Feedback 动作和状态卡片的业务语义，没有改变视觉语言、token、主题或布局规则。",
            "fact_refs": [],
            "evidence": [],
            "gap_refs": []
          },
          {
            "invariant_ref": "technical-decisions-remain-explainable",
            "disposition": "upheld",
            "reason": "V1 与 V2 状态所有权、固定 route、事务锁、待办关联冲突、typed IPC 和失败关闭均可从技术说明及两端源码恢复。",
            "fact_refs": [
              "FACT-20260826-013-004",
              "FACT-20260826-013-005",
              "FACT-20260826-013-008"
            ],
            "evidence": [
              "arckit/tech/arcorbit/platform-composition-solution.md",
              "../../hoewo/workshop-todo/handler/feedback_workflow.go",
              "../../hoewo/workshop-todo/router/router.go",
              "runtime/arcorbit/src/workshop-platform-adapter.mjs"
            ],
            "gap_refs": []
          },
          {
            "invariant_ref": "accepted-facts-are-realized",
            "disposition": "upheld",
            "reason": "ArcOrbit 客户端与 Workshop Todo provider 已共同实现 accepted restore 合约，且恢复成功由服务端同记录 pending 响应确认。",
            "fact_refs": [
              "FACT-20260826-013-003",
              "FACT-20260826-013-004",
              "FACT-20260826-013-005",
              "FACT-20260826-013-008"
            ],
            "evidence": [
              "../../hoewo/workshop-todo/handler/feedback_workflow.go",
              "runtime/arcorbit/src/workshop-platform-adapter.mjs",
              "runtime/arcorbit/src/platform-coordinator.mjs",
              "runtime/arcorbit/desktop/renderer/renderer.js",
              "Verification: workshop-todo go test ./... passed",
              "Verification: ArcOrbit 78 focused tests passed"
            ],
            "gap_refs": []
          },
          {
            "invariant_ref": "material-risks-have-credible-evidence",
            "disposition": "upheld",
            "reason": "同一记录状态伪装、历史丢失、恢复与流转竞态、API Key 越权和失败时乐观改写均由固定 provider route、统一行锁、权限拒绝及两端回归控制；未执行的真实 PostgreSQL 验证被明确保留为部署验收限制。",
            "fact_refs": [
              "FACT-20260826-013-004",
              "FACT-20260826-013-005",
              "FACT-20260826-013-008"
            ],
            "evidence": [
              "../../hoewo/workshop-todo/handler/feedback_workflow.go",
              "../../hoewo/workshop-todo/handler/feedback_workflow_test.go",
              "runtime/arcorbit/test/desktop-renderer.test.mjs",
              "runtime/arcorbit/test/workshop-platform-adapter.test.mjs",
              "arckit/tech/arcorbit/platform-composition-solution.md"
            ],
            "gap_refs": []
          }
        ]
      },
      "evidence": [
        "Current operator input, 2026-08-27",
        "../../hoewo/workshop-todo/handler/feedback_workflow.go",
        "../../hoewo/workshop-todo/router/router.go",
        "../../hoewo/workshop-todo/handler/feedback_workflow_test.go",
        "../../hoewo/workshop-todo/router/router_test.go",
        "../../hoewo/workshop-todo/api/feedback.md",
        "runtime/arcorbit/src/workshop-platform-adapter.mjs",
        "runtime/arcorbit/desktop/renderer/renderer.js",
        "arckit/spec/agentic-software-development/arcorbit-platform-capabilities.md",
        "arckit/interaction/platform-workspace/interaction.md",
        "arckit/interaction/platform-workspace/default.html",
        "arckit/tech/arcorbit/platform-composition-solution.md",
        "Verification: workshop-todo go test ./... passed",
        "Verification: ArcOrbit 78 focused tests passed",
        "Verification: both workspaces git diff --check passed"
      ],
      "runtime_result_ref": "arckit-runtime://runs/RUN-20260827-070657024Z-958b2963",
      "occurred_at": "2026-08-27T07:39:23.651Z"
    },
    {
      "round": 4,
      "transition_schema_version": "arckit-case-transition/v8",
      "goal": "独立审查已完成实现的正确性、真实问题解决、验证可信度、回归风险和最小性。",
      "outcome": "completed",
      "gap_selection": {
        "mode": "candidate",
        "basis": "基于 post-commit snapshot 4e07a139fd78a331a2dcaf942d12891a601626cc25c57e67e691f54f2c9f8111、Case selection token、全部 ordinary gaps/impacts 已关闭以及 Completion Review 对 Case 关闭的直接阻塞性，比较全部 persisted candidates。",
        "snapshot_token": "2ac67ebb4d513a2c405ac94c0a5a15e823779c684ac15fbbada591477203fd03",
        "selected_ref": "case-gap:CASE-20260826-013:CASE-20260826-013:completion-review:1",
        "comparison_summary": "四个 Project Gap 均需创建独立 Case，不能替代当前 Case 的完成审查。Completion Review 是当前 Case 唯一 ready candidate，直接阻塞关闭且具有高风险、高用户影响，因此优先选择。",
        "fresh_discovery_summary": "未发现新的可独立选择 fresh candidate；审查过程中识别出的 provider 数据库事务测试遗漏作为 Completion Review finding 提交，由 Ledger 派生下一轮普通修复 Gap。",
        "considered": [
          {
            "ref": "project-gap:GAP-agent-scenario-evaluation",
            "source": "persisted",
            "eligibility": "case_required",
            "disposition": "deferred",
            "priority_basis": {
              "blocking": "不阻塞当前 Case 的实现审查。",
              "uncertainty": "high",
              "risk": "high",
              "user_impact": "影响跨场景 Agent 选择验证。"
            },
            "reason": "需要独立 Case，不能代替当前 Completion Review。"
          },
          {
            "ref": "project-gap:GAP-runtime-resilience-and-adapters",
            "source": "persisted",
            "eligibility": "case_required",
            "disposition": "deferred",
            "priority_basis": {
              "blocking": "不阻塞当前 Feedback Case 的关闭审查。",
              "uncertainty": "medium",
              "risk": "high",
              "user_impact": "影响 Runtime 长时执行与 adapter 韧性。"
            },
            "reason": "需要独立 Case。"
          },
          {
            "ref": "project-gap:GAP-security-real-project-validation",
            "source": "persisted",
            "eligibility": "case_required",
            "disposition": "deferred",
            "priority_basis": {
              "blocking": "不阻塞当前实现的语义自查。",
              "uncertainty": "medium",
              "risk": "high",
              "user_impact": "影响真实权限项目的安全证据。"
            },
            "reason": "需要独立 Case。"
          },
          {
            "ref": "project-gap:GAP-cross-record-audit",
            "source": "persisted",
            "eligibility": "case_required",
            "disposition": "deferred",
            "priority_basis": {
              "blocking": "不替代当前 Case 的 Completion Review。",
              "uncertainty": "medium",
              "risk": "high",
              "user_impact": "影响 canonical records 一致性。"
            },
            "reason": "需要独立 Case。"
          },
          {
            "ref": "case-gap:CASE-20260826-013:CASE-20260826-013:completion-review:1",
            "source": "persisted",
            "eligibility": "ready",
            "disposition": "selected",
            "priority_basis": {
              "blocking": "直接阻塞 CASE-20260826-013 关闭。",
              "uncertainty": "low",
              "risk": "high",
              "user_impact": "high"
            },
            "reason": "全部 ordinary gaps 和 impacts 已关闭，必须独立审查五个完成维度。"
          }
        ]
      },
      "selected_gap": {
        "id": "CASE-20260826-013:completion-review:1",
        "responsibility": "agent",
        "goal": "Review the completed implementation for correctness, real problem resolution, verification credibility, regression risk, and minimality.",
        "reason": "All ordinary Case gaps and state impacts are closed.",
        "derived_from": [
          "case_result",
          "content_revision:3"
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
        "goal": "独立审查已完成实现的正确性、真实问题解决、验证可信度、回归风险和最小性。",
        "expected_state_change": "记录 Completion Review findings；不修改 Case facts、impacts、ordinary gaps 或 Project State，由 Ledger 从 finding 派生下一轮修复 Gap。"
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
          "outcome": "findings",
          "reviewer": "agent",
          "dimensions": {
            "implementation_correctness": "clean",
            "problem_resolution": "clean",
            "verification_credibility": "findings",
            "regression_risk": "findings",
            "minimality": "clean"
          },
          "findings": [
            {
              "id": "FINDING-20260826-013-001",
              "kind": "omission",
              "statement": "Workshop Todo 新增测试没有实际执行 RestoreFeedback 的数据库事务；当前只验证路由、metadata helper 和 API Key 提前拒绝，未覆盖同记录恢复成功、非 ignored 409、已关联待办 409、对象不存在 404、双请求并发串行化，以及新增行锁对 ignore/convert-to-task 的回归行为。",
              "responsibility": "agent",
              "artifact_refs": [
                "../../hoewo/workshop-todo/handler/feedback_workflow.go",
                "../../hoewo/workshop-todo/handler/feedback_workflow_test.go",
                "../../hoewo/workshop-todo/router/router_test.go"
              ],
              "evidence": [
                "CASE-20260826-013 GAP-003 evidence requirement explicitly requires success, non-ignored conflict, 403, 404 and concurrent-state tests",
                "Source inspection: handler/feedback_workflow_test.go only adds TestRestoredFeedbackProjectsPendingState and TestRestoreFeedbackRejectsAPIKeyBeforeDatabaseAccess",
                "Source inspection: router/router_test.go only asserts V2 route presence and V1 absence",
                "Verification: workshop-todo go test ./... passed but no test entered the RestoreFeedback success transaction",
                "Verification: ArcOrbit 78 focused tests passed and cover client behavior, not provider database semantics"
              ]
            }
          ],
          "evidence": [
            "../../hoewo/workshop-todo/handler/feedback_workflow.go",
            "../../hoewo/workshop-todo/handler/feedback_workflow_test.go",
            "../../hoewo/workshop-todo/router/router_test.go",
            "runtime/arcorbit/desktop/renderer/renderer.js",
            "runtime/arcorbit/src/workshop-platform-adapter.mjs",
            "runtime/arcorbit/test/desktop-renderer.test.mjs",
            "runtime/arcorbit/test/platform-coordinator.test.mjs",
            "runtime/arcorbit/test/workshop-platform-adapter.test.mjs",
            "Verification: workshop-todo go test ./... passed",
            "Verification: ArcOrbit focused suite passed 78/78",
            "Verification: both workspaces git diff --check passed"
          ],
          "reviewed_content_revision": 3
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
        "project_revision": 310,
        "judgments": [
          {
            "invariant_ref": "product-expectations-remain-recoverable",
            "disposition": "upheld",
            "reason": "产品规格仍清晰定义已忽略且未关联反馈的 V1/V2 恢复对象、目标状态和服务端确认条件；本轮 finding 不改变产品语义。",
            "fact_refs": [
              "FACT-20260826-013-001",
              "FACT-20260826-013-003",
              "FACT-20260826-013-008"
            ],
            "evidence": [
              "arckit/spec/agentic-software-development/arcorbit-platform-capabilities.md",
              "arckit/spec/INDEX.md"
            ],
            "gap_refs": []
          },
          {
            "invariant_ref": "interaction-expectations-remain-recoverable",
            "disposition": "upheld",
            "reason": "入口条件、提交锁定、成功刷新和失败上下文保持仍由交互文档、线框及 Renderer 一致表达。",
            "fact_refs": [
              "FACT-20260826-013-003",
              "FACT-20260826-013-008"
            ],
            "evidence": [
              "arckit/interaction/platform-workspace/interaction.md",
              "arckit/interaction/platform-workspace/default.html",
              "runtime/arcorbit/desktop/renderer/renderer.js"
            ],
            "gap_refs": []
          },
          {
            "invariant_ref": "visual-language-remains-consistent",
            "disposition": "not_relevant",
            "reason": "Completion Review 没有建立或改变视觉语言、token、主题、组件外观或布局事实。",
            "fact_refs": [],
            "evidence": [],
            "gap_refs": []
          },
          {
            "invariant_ref": "technical-decisions-remain-explainable",
            "disposition": "upheld",
            "reason": "固定 restore route、typed IPC、同记录状态所有权、事务行锁和失败关闭仍可从两端源码与技术方案恢复；finding 针对验证覆盖而非技术边界歧义。",
            "fact_refs": [
              "FACT-20260826-013-004",
              "FACT-20260826-013-005",
              "FACT-20260826-013-008"
            ],
            "evidence": [
              "arckit/tech/arcorbit/platform-composition-solution.md",
              "../../hoewo/workshop-todo/handler/feedback_workflow.go",
              "runtime/arcorbit/src/workshop-platform-adapter.mjs"
            ],
            "gap_refs": []
          },
          {
            "invariant_ref": "accepted-facts-are-realized",
            "disposition": "upheld",
            "reason": "静态实现审查与客户端回归未发现 accepted restore 合约的实现偏差；Completion Review 未宣称缺失的数据库分支已经得到行为级验证。",
            "fact_refs": [
              "FACT-20260826-013-003",
              "FACT-20260826-013-004",
              "FACT-20260826-013-005",
              "FACT-20260826-013-008"
            ],
            "evidence": [
              "../../hoewo/workshop-todo/handler/feedback_workflow.go",
              "runtime/arcorbit/src/workshop-platform-adapter.mjs",
              "runtime/arcorbit/src/platform-coordinator.mjs",
              "runtime/arcorbit/desktop/renderer/renderer.js",
              "Verification: workshop-todo go test ./... passed",
              "Verification: ArcOrbit focused suite passed 78/78"
            ],
            "gap_refs": []
          },
          {
            "invariant_ref": "material-risks-have-credible-evidence",
            "disposition": "upheld",
            "reason": "审查明确区分了已通过的客户端/静态证据与尚未覆盖的 provider 数据库事务行为，并以 finding 阻止 clean 关闭，没有把不足证据误报为风险已完全控制。",
            "fact_refs": [
              "FACT-20260826-013-004",
              "FACT-20260826-013-005",
              "FACT-20260826-013-008"
            ],
            "evidence": [
              "../../hoewo/workshop-todo/handler/feedback_workflow_test.go",
              "../../hoewo/workshop-todo/router/router_test.go",
              "runtime/arcorbit/test/desktop-renderer.test.mjs",
              "arckit/tech/arcorbit/platform-composition-solution.md"
            ],
            "gap_refs": []
          }
        ]
      },
      "evidence": [
        "Post-commit trusted snapshot 4e07a139fd78a331a2dcaf942d12891a601626cc25c57e67e691f54f2c9f8111",
        "../../hoewo/workshop-todo/handler/feedback_workflow.go",
        "../../hoewo/workshop-todo/handler/feedback_workflow_test.go",
        "../../hoewo/workshop-todo/router/router_test.go",
        "runtime/arcorbit/desktop/renderer/renderer.js",
        "runtime/arcorbit/src/workshop-platform-adapter.mjs",
        "runtime/arcorbit/test/desktop-renderer.test.mjs",
        "runtime/arcorbit/test/platform-coordinator.test.mjs",
        "runtime/arcorbit/test/workshop-platform-adapter.test.mjs",
        "Verification: workshop-todo go test ./... passed",
        "Verification: ArcOrbit focused suite passed 78/78",
        "Verification: both workspaces git diff --check passed"
      ],
      "runtime_result_ref": "arckit-runtime://runs/RUN-20260827-070657024Z-958b2963",
      "occurred_at": "2026-08-27T07:42:36.981Z"
    },
    {
      "round": 5,
      "transition_schema_version": "arckit-case-transition/v8",
      "goal": "补齐 Workshop Todo RestoreFeedback 的真实 PostgreSQL 事务、失败分支和并发串行化证据，并关闭 Review Finding。",
      "outcome": "completed",
      "gap_selection": {
        "mode": "candidate",
        "basis": "基于 fresh snapshot dddf09ffb3c3b0f6bdda1c86d3054a170288a23d3f768c83d231363fa11139ca、Case selection token，以及全部 persisted candidates 的可执行性、阻塞度和风险比较。",
        "snapshot_token": "6e96a8991f68e6b35bf8e3549821879bb1007bacd2121564d2f7a9e905bb397f",
        "selected_ref": "case-gap:CASE-20260826-013:CASE-20260826-013:review-finding:FINDING-20260826-013-001",
        "comparison_summary": "四个 Project Gap 均需独立 Case，不能推进当前 Case 关闭；Review Finding 是唯一 ready candidate，且直接阻塞 Completion Review，因此优先解决。",
        "fresh_discovery_summary": "实现和验证未发现新的独立 Case Gap；数据库测试通过环境变量显式启用，并已在本轮隔离 PostgreSQL 中执行。",
        "considered": [
          {
            "ref": "project-gap:GAP-agent-scenario-evaluation",
            "source": "persisted",
            "eligibility": "case_required",
            "disposition": "deferred",
            "priority_basis": {
              "blocking": "不直接阻塞当前 Feedback Case。",
              "uncertainty": "high",
              "risk": "high",
              "user_impact": "影响跨场景 Agent 选择可信度。"
            },
            "reason": "需要独立 Case，不能替代当前 Review Finding。"
          },
          {
            "ref": "project-gap:GAP-runtime-resilience-and-adapters",
            "source": "persisted",
            "eligibility": "case_required",
            "disposition": "deferred",
            "priority_basis": {
              "blocking": "不直接阻塞当前 Feedback provider 验证。",
              "uncertainty": "medium",
              "risk": "high",
              "user_impact": "影响 Runtime 长时执行韧性。"
            },
            "reason": "需要独立 Case；当前 finding 对本 Case 关闭更直接。"
          },
          {
            "ref": "project-gap:GAP-security-real-project-validation",
            "source": "persisted",
            "eligibility": "case_required",
            "disposition": "deferred",
            "priority_basis": {
              "blocking": "不直接阻塞当前数据库事务测试。",
              "uncertainty": "medium",
              "risk": "high",
              "user_impact": "影响真实权限项目安全验证。"
            },
            "reason": "需要独立 Case；当前测试继续保持既有权限边界。"
          },
          {
            "ref": "project-gap:GAP-cross-record-audit",
            "source": "persisted",
            "eligibility": "case_required",
            "disposition": "deferred",
            "priority_basis": {
              "blocking": "不直接阻塞当前 Feedback Case。",
              "uncertainty": "medium",
              "risk": "high",
              "user_impact": "影响 canonical records 一致性。"
            },
            "reason": "虽具高紧迫性，但需要独立 Case。"
          },
          {
            "ref": "case-gap:CASE-20260826-013:CASE-20260826-013:review-finding:FINDING-20260826-013-001",
            "source": "persisted",
            "eligibility": "ready",
            "disposition": "selected",
            "priority_basis": {
              "blocking": "直接阻塞当前 Case 的 clean Completion Review。",
              "uncertainty": "缺失行为级数据库证据，现可由本机真实 PostgreSQL 验证。",
              "risk": "高；未验证行锁可能掩盖重复恢复或 ignore/convert 双提交。",
              "user_impact": "决定恢复能力在并发和异常状态下是否可信。"
            },
            "reason": "当前 Case 唯一 ready candidate，且责任属于 agent，可在本轮直接完成。"
          }
        ]
      },
      "selected_gap": {
        "id": "CASE-20260826-013:review-finding:FINDING-20260826-013-001",
        "responsibility": "agent",
        "goal": "Resolve review finding: Workshop Todo 新增测试没有实际执行 RestoreFeedback 的数据库事务；当前只验证路由、metadata helper 和 API Key 提前拒绝，未覆盖同记录恢复成功、非 ignored 409、已关联待办 409、对象不存在 404、双请求并发串行化，以及新增行锁对 ignore/convert-to-task 的回归行为。",
        "reason": "omission found by completion review",
        "derived_from": [
          "completion_review",
          "content_revision:3"
        ],
        "blocked_by": [],
        "priority_basis": {
          "blocking": "high",
          "uncertainty": "",
          "risk": "high",
          "user_impact": ""
        },
        "evidence_required": [
          "../../hoewo/workshop-todo/handler/feedback_workflow.go",
          "../../hoewo/workshop-todo/handler/feedback_workflow_test.go",
          "../../hoewo/workshop-todo/router/router_test.go",
          "CASE-20260826-013 GAP-003 evidence requirement explicitly requires success, non-ignored conflict, 403, 404 and concurrent-state tests",
          "Source inspection: handler/feedback_workflow_test.go only adds TestRestoredFeedbackProjectsPendingState and TestRestoreFeedbackRejectsAPIKeyBeforeDatabaseAccess",
          "Source inspection: router/router_test.go only asserts V2 route presence and V1 absence",
          "Verification: workshop-todo go test ./... passed but no test entered the RestoreFeedback success transaction",
          "Verification: ArcOrbit 78 focused tests passed and cover client behavior, not provider database semantics"
        ]
      },
      "planned_transition": {
        "goal": "补齐 Workshop Todo RestoreFeedback 的真实 PostgreSQL 事务、失败分支和并发串行化证据，并关闭 Review Finding。",
        "expected_state_change": "Finding-derived Gap 被解决；quality_and_validation impact 更新为真实 PostgreSQL 行为已得到可重复验证；Case 返回 Completion Review 候选状态。"
      },
      "accepted_state_delta": {
        "resolved_gap": {
          "id": "CASE-20260826-013:review-finding:FINDING-20260826-013-001",
          "status": "resolved",
          "outcome": "verified",
          "reason": "新增 opt-in PostgreSQL 集成测试，直接执行 RestoreFeedback、IgnoreFeedback 和 ConvertFeedbackToTask。测试使用独立 schema，并以外部行锁阻塞器确认并发请求均进入同一 feedback 行锁等待；验证 restore 只能一次成功，ignore/convert 只能一方提交，最终状态、消息、Task 与主链接保持一致。",
          "evidence": [
            "../../hoewo/workshop-todo/handler/feedback_workflow_postgres_test.go",
            "../../hoewo/workshop-todo/handler/feedback_workflow.go",
            "Verification: PostgreSQL transaction subtests passed 6/6",
            "Verification: PostgreSQL transaction suite passed 10 consecutive runs",
            "Verification: WORKSHOP_TEST_POSTGRES_DSN-backed go test ./... -count=3 passed",
            "Verification: default go test ./... passed with integration test safely skipped",
            "Verification: go vet ./handler passed",
            "Verification: both workspaces git diff --check passed"
          ]
        },
        "facts_added": [],
        "facts_superseded": [],
        "impacts_added": [],
        "impacts_updated": [
          {
            "id": "IMPACT-20260826-013-005",
            "fact_id": "FACT-20260826-013-008",
            "fact_revision": 1,
            "target": {
              "kind": "software_decision",
              "ref": "quality_and_validation",
              "revision": 21
            },
            "effect": "upheld",
            "reason": "Provider 数据库行为现已在真实 PostgreSQL 中覆盖：同记录恢复成功并保留 ID、历史及 metadata；非 ignored、已关联待办和不存在对象失败关闭；双 restore 串行且仅一次成功；ignore/convert 在统一行锁下仅一方提交。ArcOrbit 客户端的 typed route、成功与失败关闭仍由既有 78 项聚焦回归覆盖。",
            "gap_ids": [],
            "evidence": [
              "../../hoewo/workshop-todo/handler/feedback_workflow_postgres_test.go",
              "../../hoewo/workshop-todo/handler/feedback_workflow.go",
              "runtime/arcorbit/test/desktop-renderer.test.mjs",
              "runtime/arcorbit/test/platform-coordinator.test.mjs",
              "runtime/arcorbit/test/workshop-platform-adapter.test.mjs",
              "Verification: WORKSHOP_TEST_POSTGRES_DSN-backed go test ./... -count=3 passed",
              "Verification: PostgreSQL transaction suite passed 10 consecutive runs"
            ]
          }
        ],
        "gaps_added": [],
        "gaps_cancelled": [],
        "resolved_open_questions": [],
        "completed_handoffs": [],
        "completion_review_result": null,
        "resolved_review_findings": [
          "FINDING-20260826-013-001"
        ],
        "review_budget_extension": null
      },
      "project_state_delta": {
        "software_definition_changes": [],
        "software_invariant_changes": [],
        "project_gap_changes": [],
        "selection_context_change": null,
        "evidence": [
          "../../hoewo/workshop-todo/handler/feedback_workflow_postgres_test.go",
          "Verification: PostgreSQL-backed go test ./... -count=3 passed"
        ]
      },
      "invariant_assessment": {
        "project_revision": 310,
        "judgments": [
          {
            "invariant_ref": "product-expectations-remain-recoverable",
            "disposition": "upheld",
            "reason": "本轮只补齐验证证据；已忽略且未关联反馈恢复为待处理的产品语义保持不变并可从权威规格恢复。",
            "fact_refs": [
              "FACT-20260826-013-001",
              "FACT-20260826-013-003",
              "FACT-20260826-013-008"
            ],
            "evidence": [
              "arckit/spec/agentic-software-development/arcorbit-platform-capabilities.md",
              "arckit/spec/INDEX.md"
            ],
            "gap_refs": []
          },
          {
            "invariant_ref": "interaction-expectations-remain-recoverable",
            "disposition": "upheld",
            "reason": "入口条件、提交锁定、成功刷新和失败上下文保持未改变，并继续由交互文档、线框和 Renderer 表达。",
            "fact_refs": [
              "FACT-20260826-013-003",
              "FACT-20260826-013-008"
            ],
            "evidence": [
              "arckit/interaction/platform-workspace/interaction.md",
              "arckit/interaction/platform-workspace/default.html",
              "runtime/arcorbit/desktop/renderer/renderer.js"
            ],
            "gap_refs": []
          },
          {
            "invariant_ref": "visual-language-remains-consistent",
            "disposition": "not_relevant",
            "reason": "本轮只新增服务端数据库测试，没有建立或改变视觉语言、主题、token、组件外观或布局规则。",
            "fact_refs": [],
            "evidence": [],
            "gap_refs": []
          },
          {
            "invariant_ref": "technical-decisions-remain-explainable",
            "disposition": "upheld",
            "reason": "固定 restore route、同记录状态所有权及 Restore/Ignore/Convert 共用行锁的技术边界，现在同时具有源码和真实 PostgreSQL 行为证据。",
            "fact_refs": [
              "FACT-20260826-013-004",
              "FACT-20260826-013-005",
              "FACT-20260826-013-008"
            ],
            "evidence": [
              "arckit/tech/arcorbit/platform-composition-solution.md",
              "../../hoewo/workshop-todo/handler/feedback_workflow.go",
              "../../hoewo/workshop-todo/handler/feedback_workflow_postgres_test.go",
              "runtime/arcorbit/src/workshop-platform-adapter.mjs"
            ],
            "gap_refs": []
          },
          {
            "invariant_ref": "accepted-facts-are-realized",
            "disposition": "upheld",
            "reason": "真实 PostgreSQL 测试直接证明服务端同记录恢复、兼容 metadata、历史保留、冲突关闭和并发串行化；既有 ArcOrbit 回归继续证明客户端 typed 调用链。",
            "fact_refs": [
              "FACT-20260826-013-003",
              "FACT-20260826-013-004",
              "FACT-20260826-013-005",
              "FACT-20260826-013-008"
            ],
            "evidence": [
              "../../hoewo/workshop-todo/handler/feedback_workflow.go",
              "../../hoewo/workshop-todo/handler/feedback_workflow_postgres_test.go",
              "runtime/arcorbit/src/workshop-platform-adapter.mjs",
              "runtime/arcorbit/src/platform-coordinator.mjs",
              "runtime/arcorbit/desktop/renderer/renderer.js",
              "Verification: WORKSHOP_TEST_POSTGRES_DSN-backed go test ./... -count=3 passed"
            ],
            "gap_refs": []
          },
          {
            "invariant_ref": "material-risks-have-credible-evidence",
            "disposition": "upheld",
            "reason": "重复恢复、状态冲突、已关联待办恢复及 ignore/convert 双提交风险均由真实 PostgreSQL 行锁测试控制；测试连续执行及全量回归证明结果可重复。",
            "fact_refs": [
              "FACT-20260826-013-004",
              "FACT-20260826-013-005",
              "FACT-20260826-013-008"
            ],
            "evidence": [
              "../../hoewo/workshop-todo/handler/feedback_workflow_postgres_test.go",
              "../../hoewo/workshop-todo/handler/feedback_workflow.go",
              "Verification: PostgreSQL transaction suite passed 10 consecutive runs",
              "Verification: PostgreSQL-backed go test ./... -count=3 passed",
              "Verification: go vet ./handler passed"
            ],
            "gap_refs": []
          }
        ]
      },
      "evidence": [
        "../../hoewo/workshop-todo/handler/feedback_workflow_postgres_test.go",
        "../../hoewo/workshop-todo/handler/feedback_workflow.go",
        "Verification: PostgreSQL transaction subtests passed 6/6",
        "Verification: PostgreSQL transaction suite passed 10 consecutive runs",
        "Verification: PostgreSQL-backed go test ./... -count=3 passed",
        "Verification: default go test ./... passed",
        "Verification: go vet ./handler passed",
        "Verification: both workspaces git diff --check passed"
      ],
      "runtime_result_ref": "arckit-runtime://runs/RUN-20260827-070657024Z-958b2963",
      "occurred_at": "2026-08-27T07:54:01.101Z"
    },
    {
      "round": 6,
      "transition_schema_version": "arckit-case-transition/v8",
      "goal": "独立审查 content_revision 4 的实现正确性、真实问题解决、验证可信度、回归风险和最小性。",
      "outcome": "completed",
      "gap_selection": {
        "mode": "candidate",
        "basis": "基于 fresh snapshot 9fda8204752be2b37cedc5f4bb6352a497069647bc229e898662a7592aabf1eb、Case selection token，以及全部 persisted candidates 的阻塞度、责任和 Case 关闭关系比较。",
        "snapshot_token": "c991f4167962c5cebecce53f349f97567ec61a9c76b60f2b460a59ce760c5a95",
        "selected_ref": "case-gap:CASE-20260826-013:CASE-20260826-013:completion-review:2",
        "comparison_summary": "四个 Project Gap 均需独立 Case且不影响当前 Feedback Case 的完成判断；Completion Review 2 是唯一 ready candidate，并直接决定 content_revision 4 能否关闭。",
        "fresh_discovery_summary": "独立复核两端源码、文档、测试和当前差异后，没有发现需要新建普通修复 Gap 的 fresh finding。",
        "considered": [
          {
            "ref": "project-gap:GAP-agent-scenario-evaluation",
            "source": "persisted",
            "eligibility": "case_required",
            "disposition": "deferred",
            "priority_basis": {
              "blocking": "不阻塞当前 Feedback Case 的完成审查。",
              "uncertainty": "high",
              "risk": "high",
              "user_impact": "影响跨场景 Agent 选择可信度。"
            },
            "reason": "需独立 Case，不能替代当前 Completion Review。"
          },
          {
            "ref": "project-gap:GAP-runtime-resilience-and-adapters",
            "source": "persisted",
            "eligibility": "case_required",
            "disposition": "deferred",
            "priority_basis": {
              "blocking": "不阻塞当前 Feedback 恢复闭环。",
              "uncertainty": "medium",
              "risk": "high",
              "user_impact": "影响 Runtime 长时执行与通用 adapter 韧性。"
            },
            "reason": "需独立 Case；本轮只审查当前 Case 内容。"
          },
          {
            "ref": "project-gap:GAP-security-real-project-validation",
            "source": "persisted",
            "eligibility": "case_required",
            "disposition": "deferred",
            "priority_basis": {
              "blocking": "不阻塞当前受限 Feedback route 的完成审查。",
              "uncertainty": "medium",
              "risk": "high",
              "user_impact": "影响真实权限项目安全验证。"
            },
            "reason": "需独立 Case；当前实现未扩大 Renderer 或 API Key 权限。"
          },
          {
            "ref": "project-gap:GAP-cross-record-audit",
            "source": "persisted",
            "eligibility": "case_required",
            "disposition": "deferred",
            "priority_basis": {
              "blocking": "不阻塞当前 Feedback Case。",
              "uncertainty": "medium",
              "risk": "high",
              "user_impact": "影响 canonical records 一致性。"
            },
            "reason": "虽具高紧迫性，但需独立 Case。"
          },
          {
            "ref": "case-gap:CASE-20260826-013:CASE-20260826-013:completion-review:2",
            "source": "persisted",
            "eligibility": "ready",
            "disposition": "selected",
            "priority_basis": {
              "blocking": "直接决定当前 Case 能否关闭。",
              "uncertainty": "low；前序 finding 已由真实 PostgreSQL 证据解决。",
              "risk": "high；必须独立检查实现正确性和验证可信度。",
              "user_impact": "直接决定误忽略恢复能力是否完整可信。"
            },
            "reason": "唯一 ready candidate；全部普通 Gap 与 state impact 已闭合。"
          }
        ]
      },
      "selected_gap": {
        "id": "CASE-20260826-013:completion-review:2",
        "responsibility": "agent",
        "goal": "Review the completed implementation for correctness, real problem resolution, verification credibility, regression risk, and minimality.",
        "reason": "All ordinary Case gaps and state impacts are closed.",
        "derived_from": [
          "case_result",
          "content_revision:4"
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
        "goal": "独立审查 content_revision 4 的实现正确性、真实问题解决、验证可信度、回归风险和最小性。",
        "expected_state_change": "若五个维度均无 finding，则以 clean Completion Review 完成当前 Case。"
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
            "arckit/spec/agentic-software-development/arcorbit-platform-capabilities.md",
            "arckit/interaction/platform-workspace/interaction.md",
            "arckit/interaction/platform-workspace/default.html",
            "arckit/tech/arcorbit/platform-composition-solution.md",
            "runtime/arcorbit/desktop/renderer/renderer.js",
            "runtime/arcorbit/src/workshop-platform-adapter.mjs",
            "runtime/arcorbit/src/platform-coordinator.mjs",
            "runtime/arcorbit/desktop/main.mjs",
            "runtime/arcorbit/desktop/preload.cjs",
            "../../hoewo/workshop-todo/handler/feedback_workflow.go",
            "../../hoewo/workshop-todo/router/router.go",
            "../../hoewo/workshop-todo/api/feedback.md",
            "../../hoewo/workshop-todo/handler/feedback_workflow_postgres_test.go",
            "Verification: ArcOrbit focused suite passed 78/78 during Completion Review",
            "Verification: workshop-todo go test ./... passed during Completion Review",
            "Verification: go vet ./handler passed during Completion Review",
            "Verification: accepted PostgreSQL transaction suite passed 10 consecutive runs",
            "Verification: accepted PostgreSQL-backed go test ./... -count=3 passed",
            "Verification: both workspaces git diff --check passed"
          ],
          "reviewed_content_revision": 4
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
        "project_revision": 310,
        "judgments": [
          {
            "invariant_ref": "product-expectations-remain-recoverable",
            "disposition": "upheld",
            "reason": "已忽略且未关联反馈恢复为待处理、只在服务端确认后生效的产品预期准确且可从权威规格恢复。",
            "fact_refs": [
              "FACT-20260826-013-001",
              "FACT-20260826-013-003",
              "FACT-20260826-013-008"
            ],
            "evidence": [
              "arckit/spec/agentic-software-development/arcorbit-platform-capabilities.md",
              "arckit/spec/INDEX.md"
            ],
            "gap_refs": []
          },
          {
            "invariant_ref": "interaction-expectations-remain-recoverable",
            "disposition": "upheld",
            "reason": "入口条件、提交锁定、成功刷新及失败时状态和上下文保持由交互文档、线框与 Renderer 一致兑现。",
            "fact_refs": [
              "FACT-20260826-013-003",
              "FACT-20260826-013-008"
            ],
            "evidence": [
              "arckit/interaction/platform-workspace/interaction.md",
              "arckit/interaction/platform-workspace/default.html",
              "runtime/arcorbit/desktop/renderer/renderer.js",
              "runtime/arcorbit/test/desktop-renderer.test.mjs"
            ],
            "gap_refs": []
          },
          {
            "invariant_ref": "visual-language-remains-consistent",
            "disposition": "not_relevant",
            "reason": "Case 复用既有 secondary button、状态徽标和 Feedback action row，没有建立或改变视觉语言、主题、token 或布局规则。",
            "fact_refs": [],
            "evidence": [],
            "gap_refs": []
          },
          {
            "invariant_ref": "technical-decisions-remain-explainable",
            "disposition": "upheld",
            "reason": "V1 metadata 映射、V2 固定 route、typed IPC、同记录状态所有权、事务行锁和失败关闭均可从两端源码及技术方案恢复。",
            "fact_refs": [
              "FACT-20260826-013-004",
              "FACT-20260826-013-005",
              "FACT-20260826-013-008"
            ],
            "evidence": [
              "arckit/tech/arcorbit/platform-composition-solution.md",
              "runtime/arcorbit/src/workshop-platform-adapter.mjs",
              "runtime/arcorbit/src/platform-coordinator.mjs",
              "../../hoewo/workshop-todo/handler/feedback_workflow.go",
              "../../hoewo/workshop-todo/router/router.go"
            ],
            "gap_refs": []
          },
          {
            "invariant_ref": "accepted-facts-are-realized",
            "disposition": "upheld",
            "reason": "ArcOrbit 客户端和 Workshop Todo provider 共同兑现同记录恢复；服务端 pending 响应而非 Renderer 乐观状态决定成功。",
            "fact_refs": [
              "FACT-20260826-013-003",
              "FACT-20260826-013-004",
              "FACT-20260826-013-005",
              "FACT-20260826-013-008"
            ],
            "evidence": [
              "runtime/arcorbit/desktop/renderer/renderer.js",
              "runtime/arcorbit/src/workshop-platform-adapter.mjs",
              "runtime/arcorbit/src/platform-coordinator.mjs",
              "../../hoewo/workshop-todo/handler/feedback_workflow.go",
              "../../hoewo/workshop-todo/handler/feedback_workflow_postgres_test.go",
              "Verification: ArcOrbit focused suite passed 78/78",
              "Verification: workshop-todo go test ./... passed"
            ],
            "gap_refs": []
          },
          {
            "invariant_ref": "material-risks-have-credible-evidence",
            "disposition": "upheld",
            "reason": "权限越界、错误状态伪装、metadata 漂移、重复恢复及 ignore/convert 并发双提交风险分别由受限 route、失败关闭测试和真实 PostgreSQL 行锁回归控制，证据范围清晰且可重复。",
            "fact_refs": [
              "FACT-20260826-013-004",
              "FACT-20260826-013-005",
              "FACT-20260826-013-008"
            ],
            "evidence": [
              "runtime/arcorbit/test/desktop-renderer.test.mjs",
              "runtime/arcorbit/test/workshop-platform-adapter.test.mjs",
              "../../hoewo/workshop-todo/handler/feedback_workflow_test.go",
              "../../hoewo/workshop-todo/handler/feedback_workflow_postgres_test.go",
              "Verification: PostgreSQL transaction suite passed 10 consecutive runs",
              "Verification: PostgreSQL-backed go test ./... -count=3 passed",
              "Verification: go vet ./handler passed"
            ],
            "gap_refs": []
          }
        ]
      },
      "evidence": [
        "runtime/arcorbit/desktop/renderer/renderer.js",
        "runtime/arcorbit/src/workshop-platform-adapter.mjs",
        "runtime/arcorbit/src/platform-coordinator.mjs",
        "../../hoewo/workshop-todo/handler/feedback_workflow.go",
        "../../hoewo/workshop-todo/handler/feedback_workflow_postgres_test.go",
        "Verification: ArcOrbit focused suite passed 78/78 during Completion Review",
        "Verification: workshop-todo go test ./... passed during Completion Review",
        "Verification: go vet ./handler passed during Completion Review",
        "Verification: both workspaces git diff --check passed"
      ],
      "runtime_result_ref": "arckit-runtime://runs/RUN-20260827-070657024Z-958b2963",
      "occurred_at": "2026-08-27T07:56:45.199Z"
    }
  ],
  "case_resolution": {
    "status": "resolved",
    "stage": "resolved",
    "satisfied": [
      "GAP-20260826-013-001",
      "GAP-20260826-013-002",
      "GAP-20260826-013-003",
      "CASE-20260826-013:review-finding:FINDING-20260826-013-001"
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
    "updated_at": "2026-08-27T07:56:45.199Z"
  }
}
```

## Round Notes

- Case history is canonical in Structured Record.rounds; keep prose notes exceptional.
