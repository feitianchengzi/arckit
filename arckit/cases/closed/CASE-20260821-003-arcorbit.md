# ArcOrbit 待办创建与编辑能力对齐

Case: CASE-20260821-003
Status: closed
Artifact Type: code
Selected Gap: none
Updated: 2026-08-21T18:12:29.064Z

## User Intent

使 ArcOrbit 创建和编辑待办页面在执行人、优先级与标签管理方面对齐 Workshop Todo Website：执行人仅显示所选产品成员且不带产品名前缀；优先级使用有意义的固定选项；标签按所选产品提供选择、创建、编辑和删除能力。

## Structured Record

```json
{
  "schema_version": "development-case-record/v5",
  "id": "CASE-20260821-003",
  "title": "ArcOrbit 待办创建与编辑能力对齐",
  "status": "closed",
  "artifact_type": "code",
  "created_at": "2026-08-21T17:41:07.799Z",
  "updated_at": "2026-08-21T18:12:29.064Z",
  "user_intent": "使 ArcOrbit 创建和编辑待办页面在执行人、优先级与标签管理方面对齐 Workshop Todo Website：执行人仅显示所选产品成员且不带产品名前缀；优先级使用有意义的固定选项；标签按所选产品提供选择、创建、编辑和删除能力。",
  "expected_outcome": "ArcOrbit 创建和编辑待办时，成员、父待办和标签均随当前产品正确限定；优先级使用“最高、高、中、低、无”语义并提交 Workshop 原生值；标签使用项目标签 ID 多选并支持标签生命周期管理；相关自动化测试证明创建、编辑和产品切换行为。",
  "project_state_ref": "arckit/project/state.record.json",
  "current_round": {
    "goal": "",
    "selected_gap": null
  },
  "facts": [
    {
      "id": "FACT-001",
      "revision": 1,
      "status": "accepted",
      "statement": "操作者要求 ArcOrbit 创建和编辑待办页面只展示所选产品的成员且成员名不带产品前缀，将“服务优先级”改为有意义的“优先级”选项列表，并使标签管理能力对齐 Workshop Todo Website。",
      "basis": "当前操作者输入是本轮最高权威增量。",
      "evidence": [
        "Current operator input, 2026-08-22"
      ]
    },
    {
      "id": "FACT-002",
      "revision": 1,
      "status": "accepted",
      "statement": "ArcOrbit 当前创建待办时 memberSelectOptions 未传产品 ID，因此列出产品集全部成员；成员选项固定使用“产品名 · 用户名”；创建和编辑页的“服务优先级”均为自由数字输入；标签均为自由文本输入。",
      "basis": "ArcOrbit 当前 Renderer 的直接代码证据。",
      "evidence": [
        "runtime/arcorbit/desktop/renderer/renderer.js:1032",
        "runtime/arcorbit/desktop/renderer/renderer.js:1043",
        "runtime/arcorbit/desktop/renderer/renderer.js:1045",
        "runtime/arcorbit/desktop/renderer/renderer.js:1046",
        "runtime/arcorbit/desktop/renderer/renderer.js:1062",
        "runtime/arcorbit/desktop/renderer/renderer.js:1064",
        "runtime/arcorbit/desktop/renderer/renderer.js:1065",
        "runtime/arcorbit/desktop/renderer/renderer.js:1263"
      ]
    },
    {
      "id": "FACT-003",
      "revision": 1,
      "status": "accepted",
      "statement": "Workshop Todo Website 的创建待办表单只消费当前 projectId 的项目成员；优先级使用 0=最高、1=高、2=中、3=低、空=无的固定选项；标签按项目加载，以逗号分隔的标签 ID 作为待办字段，支持多选以及创建、编辑和删除项目标签。",
      "basis": "Workshop Todo Website 当前创建表单、优先级选择器、标签选择器和标签编码工具的直接代码证据。",
      "evidence": [
        "/Users/Glare/Library/Developer/ModularProgram/hoewo/workshop-todo-website/frontend/src/components/features/CreateTaskDialog.tsx",
        "/Users/Glare/Library/Developer/ModularProgram/hoewo/workshop-todo-website/frontend/src/components/features/PrioritySelector.tsx",
        "/Users/Glare/Library/Developer/ModularProgram/hoewo/workshop-todo-website/frontend/src/components/features/TagSelector.tsx",
        "/Users/Glare/Library/Developer/ModularProgram/hoewo/workshop-todo-website/frontend/src/lib/utils/tagUtils.ts"
      ]
    },
    {
      "id": "FACT-004",
      "revision": 1,
      "status": "accepted",
      "statement": "ArcOrbit 创建与编辑待办表单现在按所选或所属产品生成成员、父待办和标签候选，成员选项仅显示用户名；优先级使用空、0、1、2、3 对应无、最高、高、中、低；标签以项目标签 ID 多选并提交逗号分隔字符串，同时可在表单内创建、编辑名称和颜色或确认删除。",
      "basis": "生产 Renderer 实现、稳定交互文档、静态结构测试和真实 Electron 表单交互验证一致。",
      "evidence": [
        "runtime/arcorbit/desktop/renderer/renderer.js:1031",
        "runtime/arcorbit/desktop/renderer/renderer.js:1053",
        "runtime/arcorbit/desktop/renderer/renderer.js:1220",
        "runtime/arcorbit/desktop/renderer/renderer.js:1246",
        "runtime/arcorbit/desktop/renderer/renderer.js:1254",
        "runtime/arcorbit/desktop/renderer/renderer.js:1380",
        "runtime/arcorbit/desktop/renderer/renderer.js:1388",
        "runtime/arcorbit/test/desktop-renderer.test.mjs",
        "runtime/arcorbit/test/organization-center-electron.test.mjs",
        "arckit/interaction/task-browser/interaction.md",
        "arckit/interaction/task-browser/task-form.html"
      ]
    },
    {
      "id": "FACT-005",
      "revision": 1,
      "status": "accepted",
      "statement": "ArcOrbit 编辑待办选择“无优先级”时会将 priority 序列化为显式 null，Workshop Platform Adapter 保留该值，Workshop 更新请求区分字段省略与显式 null 并将后者写为数据库空值；创建待办的空优先级仍保持省略语义。",
      "basis": "Renderer、受限 Adapter、Workshop 请求解码和更新映射形成确定性链路，并由隔离、真实 Electron 与全量回归共同验证。",
      "evidence": [
        "runtime/arcorbit/desktop/renderer/renderer.js",
        "runtime/arcorbit/src/workshop-platform-adapter.mjs",
        "/Users/Glare/Library/Developer/ModularProgram/hoewo/workshop-todo/handler/task.go",
        "runtime/arcorbit/test/workshop-platform-adapter.test.mjs",
        "runtime/arcorbit/test/organization-center-electron.test.mjs",
        "/Users/Glare/Library/Developer/ModularProgram/hoewo/workshop-todo/handler/task_request_test.go"
      ]
    }
  ],
  "state_impacts": [
    {
      "id": "IMPACT-001",
      "fact_id": "FACT-002",
      "fact_revision": 1,
      "target": {
        "kind": "software_decision",
        "ref": "experience_and_interaction",
        "revision": 27
      },
      "effect": "upheld",
      "reason": "创建继续以省略表达未设置，编辑则以显式 null 清除已有优先级；“无优先级”的用户动作现在具有真实且可恢复的业务语义。",
      "gap_ids": [],
      "evidence": [
        "FACT-005",
        "runtime/arcorbit/desktop/renderer/renderer.js",
        "arckit/interaction/task-browser/interaction.md",
        "/Users/Glare/Library/Developer/ModularProgram/hoewo/workshop-todo/api/task.md"
      ]
    },
    {
      "id": "IMPACT-002",
      "fact_id": "FACT-002",
      "fact_revision": 1,
      "target": {
        "kind": "software_invariant",
        "ref": "accepted-facts-are-realized",
        "revision": null
      },
      "effect": "upheld",
      "reason": "成员范围、语义优先级、优先级清除和标签生命周期能力均由生产链路与自动化回归兑现。",
      "gap_ids": [],
      "evidence": [
        "FACT-005",
        "runtime/arcorbit/test/desktop-renderer.test.mjs",
        "runtime/arcorbit/test/workshop-platform-adapter.test.mjs",
        "runtime/arcorbit/test/organization-center-electron.test.mjs",
        "/Users/Glare/Library/Developer/ModularProgram/hoewo/workshop-todo/handler/task_request_test.go",
        "npm --prefix runtime/arcorbit run check: 249 tests, 247 passed, 2 skipped, 0 failed",
        "go test ./...: all Workshop packages passed"
      ]
    }
  ],
  "gaps": [
    {
      "id": "GAP-align-task-form-capabilities",
      "status": "resolved",
      "goal": "实现并验证 ArcOrbit 创建与编辑待办表单的产品级成员过滤、无产品名前缀成员显示、语义化优先级选项和项目标签选择及生命周期管理能力。",
      "reason": "用户期望、当前缺口和参考行为均已明确；这些字段共同构成同一待办表单能力，且实现不依赖尚未接受的产品或技术决定。",
      "derived_from": [
        "FACT-001",
        "FACT-002",
        "FACT-003"
      ],
      "blocked_by": [],
      "priority_basis": {
        "blocking": "当前创建和编辑页面直接呈现错误范围或低语义输入，阻塞日常待办维护体验。",
        "uncertainty": "目标语义已由操作者和参考实现明确，主要不确定性仅在 Renderer 动态表单接线与测试覆盖。",
        "risk": "产品切换后若成员、父待办或标签未同步刷新，可能提交跨产品 ID；标签还需保持 Workshop 的 ID 字符串契约。",
        "user_impact": "直接影响每次创建和编辑待办时的分配准确性、优先级可理解性和标签维护效率。"
      },
      "responsibility": "agent",
      "evidence_required": [
        "创建表单切换产品后，执行人、父待办和标签选项仅来自所选产品且成员标签不带产品前缀",
        "创建与编辑表单均显示“优先级”，提供最高、高、中、低、无选项并提交 0、1、2、3 或空值语义",
        "创建与编辑表单按项目标签 ID 多选，并提供项目内标签创建、编辑、删除及颜色名称显示能力",
        "Renderer 静态测试与 Electron 交互测试覆盖创建、编辑、产品切换、序列化和标签管理",
        "相关 ArcOrbit 测试与静态检查通过"
      ],
      "resolution": {
        "id": "GAP-align-task-form-capabilities",
        "status": "resolved",
        "outcome": "ArcOrbit 创建与编辑待办表单已按产品限定成员、父待办和标签，使用语义优先级，并支持项目标签选择及创建、编辑、删除。",
        "reason": "生产 Renderer、稳定交互文档、静态测试、真实 Electron 交互回归和 ArcOrbit 全量检查共同覆盖了 Gap 的全部验收要求。",
        "evidence": [
          "runtime/arcorbit/desktop/renderer/renderer.js",
          "runtime/arcorbit/desktop/renderer/styles.css",
          "runtime/arcorbit/test/desktop-renderer.test.mjs",
          "runtime/arcorbit/test/organization-center-electron.test.mjs",
          "arckit/interaction/task-browser/interaction.md",
          "arckit/interaction/task-browser/task-form.html",
          "npm --prefix runtime/arcorbit run check: 249 tests, 247 passed, 2 skipped, 0 failed"
        ],
        "occurred_at": "2026-08-21T17:57:25.441Z"
      }
    },
    {
      "id": "CASE-20260821-003:review-finding:PRIORITY-UNSET-NOOP",
      "status": "resolved",
      "goal": "Resolve review finding: 使编辑待办的“无优先级”成为真实的清除操作：当前 normalizeTaskFormValues 删除空 priority，Workshop Platform Adapter 也将空值转为 undefined，PUT 请求最终不包含 priority，已有服务端优先级会保持不变；同时补充有值到无值的端到端回归。",
      "reason": "omission found by completion review",
      "derived_from": [
        "completion_review",
        "content_revision:1"
      ],
      "blocked_by": [],
      "priority_basis": {
        "blocking": "high",
        "risk": "high"
      },
      "responsibility": "agent",
      "evidence_required": [
        "runtime/arcorbit/desktop/renderer/renderer.js",
        "runtime/arcorbit/src/workshop-platform-adapter.mjs",
        "runtime/arcorbit/test/organization-center-electron.test.mjs",
        "/Users/Glare/Library/Developer/ModularProgram/hoewo/workshop-todo/handler/task.go",
        "runtime/arcorbit/desktop/renderer/renderer.js:1246-1251 删除空 priority",
        "runtime/arcorbit/src/workshop-platform-adapter.mjs:346-349 将空 priority 转为 undefined",
        "隔离 Adapter 诊断：updateTask('1', {priority:''}) 产生 PUT body {}",
        "Workshop handler/task.go 仅在 req.Priority != nil 时更新 priority",
        "runtime/arcorbit/test/organization-center-electron.test.mjs 只验证现有 priority 1 更新为 3，未覆盖清除"
      ],
      "resolution": {
        "id": "CASE-20260821-003:review-finding:PRIORITY-UNSET-NOOP",
        "status": "resolved",
        "outcome": "编辑待办选择“无优先级”现在提交 priority:null，Workshop 会将持久优先级清空；创建表单仍省略空优先级。",
        "reason": "Renderer 按创建/编辑区分空值语义，Adapter 保留显式 null，Workshop 请求模型跟踪字段存在性并将 null 写入更新映射；静态、Adapter、Electron 与 Go 回归均通过。",
        "evidence": [
          "runtime/arcorbit/desktop/renderer/renderer.js",
          "runtime/arcorbit/src/workshop-platform-adapter.mjs",
          "runtime/arcorbit/test/desktop-renderer.test.mjs",
          "runtime/arcorbit/test/workshop-platform-adapter.test.mjs",
          "runtime/arcorbit/test/organization-center-electron.test.mjs",
          "/Users/Glare/Library/Developer/ModularProgram/hoewo/workshop-todo/handler/task.go",
          "/Users/Glare/Library/Developer/ModularProgram/hoewo/workshop-todo/handler/task_request_test.go",
          "/Users/Glare/Library/Developer/ModularProgram/hoewo/workshop-todo/api/task.md",
          "Electron interaction test: 1 passed, 0 failed",
          "npm --prefix runtime/arcorbit run check: 249 tests, 247 passed, 2 skipped, 0 failed",
          "go test ./...: all Workshop packages passed"
        ],
        "occurred_at": "2026-08-21T18:10:17.155Z"
      }
    }
  ],
  "content_revision": 2,
  "completion_review": {
    "status": "clean",
    "policy": {
      "initial_max_cycles": 10,
      "source": "runtime/arcorbit/config/case-policy.json",
      "snapshotted_at": "2026-08-21T17:41:07.799Z"
    },
    "additional_cycles_authorized": 0,
    "cycle_count": 2,
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
        "outcome": "findings",
        "content_revision": 1,
        "dimensions": {
          "implementation_correctness": "findings",
          "problem_resolution": "findings",
          "verification_credibility": "findings",
          "regression_risk": "findings",
          "minimality": "clean"
        },
        "finding_ids": [
          "PRIORITY-UNSET-NOOP"
        ],
        "evidence": [
          "runtime/arcorbit/desktop/renderer/renderer.js",
          "runtime/arcorbit/src/workshop-platform-adapter.mjs",
          "runtime/arcorbit/test/desktop-renderer.test.mjs",
          "runtime/arcorbit/test/organization-center-electron.test.mjs",
          "runtime/arcorbit/test/fixtures/organization-center-electron.mjs",
          "runtime/arcorbit/test/fixtures/organization-center-preload.cjs",
          "/Users/Glare/Library/Developer/ModularProgram/hoewo/workshop-todo/handler/task.go",
          "隔离 Adapter 诊断：空 priority 的 PUT body 为 {}",
          "npm --prefix runtime/arcorbit run check: 249 tests, 247 passed, 2 skipped, 0 failed",
          "git diff --check"
        ],
        "occurred_at": "2026-08-21T18:00:58.213Z"
      },
      {
        "cycle": 2,
        "autonomous_cycle": 2,
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
          "runtime/arcorbit/desktop/renderer/renderer.js: create omits empty priority while edit emits explicit null",
          "runtime/arcorbit/src/platform-coordinator.mjs: task.update preserves bounded input to Platform Adapter",
          "runtime/arcorbit/src/workshop-platform-adapter.mjs: taskBody preserves priority:null in PUT body",
          "/Users/Glare/Library/Developer/ModularProgram/hoewo/workshop-todo/handler/task.go: explicit priority presence maps null to database NULL",
          "runtime/arcorbit/test/desktop-renderer.test.mjs",
          "runtime/arcorbit/test/workshop-platform-adapter.test.mjs",
          "runtime/arcorbit/test/organization-center-electron.test.mjs",
          "/Users/Glare/Library/Developer/ModularProgram/hoewo/workshop-todo/handler/task_request_test.go",
          "Focused Renderer and Adapter regression: 19 passed, 0 failed",
          "Electron interaction regression: 1 passed, 0 failed",
          "npm --prefix runtime/arcorbit run check: 249 tests, 247 passed, 2 skipped, 0 failed",
          "go test ./...: all Workshop packages passed",
          "git diff --check: ArcOrbit and Workshop clean"
        ],
        "occurred_at": "2026-08-21T18:12:29.064Z"
      }
    ],
    "evidence": [
      "runtime/arcorbit/desktop/renderer/renderer.js",
      "runtime/arcorbit/src/workshop-platform-adapter.mjs",
      "runtime/arcorbit/test/desktop-renderer.test.mjs",
      "runtime/arcorbit/test/organization-center-electron.test.mjs",
      "runtime/arcorbit/test/fixtures/organization-center-electron.mjs",
      "runtime/arcorbit/test/fixtures/organization-center-preload.cjs",
      "/Users/Glare/Library/Developer/ModularProgram/hoewo/workshop-todo/handler/task.go",
      "隔离 Adapter 诊断：空 priority 的 PUT body 为 {}",
      "npm --prefix runtime/arcorbit run check: 249 tests, 247 passed, 2 skipped, 0 failed",
      "git diff --check",
      "runtime/arcorbit/desktop/renderer/renderer.js: create omits empty priority while edit emits explicit null",
      "runtime/arcorbit/src/platform-coordinator.mjs: task.update preserves bounded input to Platform Adapter",
      "runtime/arcorbit/src/workshop-platform-adapter.mjs: taskBody preserves priority:null in PUT body",
      "/Users/Glare/Library/Developer/ModularProgram/hoewo/workshop-todo/handler/task.go: explicit priority presence maps null to database NULL",
      "runtime/arcorbit/test/workshop-platform-adapter.test.mjs",
      "/Users/Glare/Library/Developer/ModularProgram/hoewo/workshop-todo/handler/task_request_test.go",
      "Focused Renderer and Adapter regression: 19 passed, 0 failed",
      "Electron interaction regression: 1 passed, 0 failed",
      "go test ./...: all Workshop packages passed",
      "git diff --check: ArcOrbit and Workshop clean"
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
      "goal": "完成 ArcOrbit 创建与编辑待办表单的产品范围联动、语义优先级和项目标签生命周期能力，并建立自动化与稳定交互证据。",
      "outcome": "completed",
      "gap_selection": {
        "mode": "candidate",
        "basis": "依据 post-create_case fresh snapshot 比较全部持久候选；当前表单 Gap 直接对应操作者最新目标、无依赖且可在当前工作区完成并验证。",
        "snapshot_token": "2e2b965059b7c4fff396bcff48af158f446971afaba8d5516ebce9afb2c0646f",
        "selected_ref": "case-gap:CASE-20260821-003:GAP-align-task-form-capabilities",
        "comparison_summary": "四个 Project Gap 均需先建立独立 Case；可靠实时实现 Gap 虽然 ready，但表单能力 Gap 与当前项目焦点和操作者最新输入完全一致、实现边界已明确且直接影响日常待办维护，因此本轮优先处理。",
        "fresh_discovery_summary": "代码、参考 Website 和交互事实复核未发现比已持久化表单能力 Gap 更高优先级的新 Gap；实现中发现的字段联动、标签编码和表单保持要求均属于该 Gap 的既定验收范围。",
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
            "reason": "需要独立 Case 承载跨场景评估，不属于当前 ArcOrbit 表单实现边界。"
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
              "user_impact": ""
            },
            "reason": "需要独立 Case，且与当前待办表单字段能力没有实现依赖。"
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
              "user_impact": ""
            },
            "reason": "需要具备真实受控资源的独立 Case，不阻塞当前产品内表单修复。"
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
              "user_impact": ""
            },
            "reason": "虽然风险和紧迫度较高，但必须先创建独立 Case，不能在当前表单 Case 中消费。"
          },
          {
            "ref": "case-gap:CASE-20260821-002:GAP-reliable-realtime-implementation",
            "source": "persisted",
            "eligibility": "ready",
            "disposition": "deferred",
            "priority_basis": {
              "blocking": "用户要求直接完成优化，当前实现尚未兑现契约。",
              "uncertainty": "契约已收敛，剩余不确定性集中在实现接线与兼容性。",
              "risk": "涉及事务一致性、跨实例通知、断线恢复、权限撤销和重复调度。",
              "user_impact": "决定任务变化能否及时、可靠地触达且不会越过人工确认。"
            },
            "reason": "该 Gap 仍重要且 ready，但属于另一个活跃 Case；当前 fresh 项目焦点和操作者最新目标是待办表单能力对齐。"
          },
          {
            "ref": "case-gap:CASE-20260821-003:GAP-align-task-form-capabilities",
            "source": "persisted",
            "eligibility": "ready",
            "disposition": "selected",
            "priority_basis": {
              "blocking": "当前创建和编辑页面直接呈现错误范围或低语义输入，阻塞日常待办维护体验。",
              "uncertainty": "目标语义已由操作者和参考实现明确，主要不确定性仅在 Renderer 动态表单接线与测试覆盖。",
              "risk": "产品切换后若成员、父待办或标签未同步刷新，可能提交跨产品 ID；标签还需保持 Workshop 的 ID 字符串契约。",
              "user_impact": "直接影响每次创建和编辑待办时的分配准确性、优先级可理解性和标签维护效率。"
            },
            "reason": "与当前操作者目标、项目焦点和 Case facts 完全一致，无阻塞且可形成完整实现与验证闭环。"
          }
        ]
      },
      "selected_gap": {
        "id": "GAP-align-task-form-capabilities",
        "responsibility": "agent",
        "goal": "实现并验证 ArcOrbit 创建与编辑待办表单的产品级成员过滤、无产品名前缀成员显示、语义化优先级选项和项目标签选择及生命周期管理能力。",
        "reason": "用户期望、当前缺口和参考行为均已明确；这些字段共同构成同一待办表单能力，且实现不依赖尚未接受的产品或技术决定。",
        "derived_from": [
          "FACT-001",
          "FACT-002",
          "FACT-003"
        ],
        "blocked_by": [],
        "priority_basis": {
          "blocking": "当前创建和编辑页面直接呈现错误范围或低语义输入，阻塞日常待办维护体验。",
          "uncertainty": "目标语义已由操作者和参考实现明确，主要不确定性仅在 Renderer 动态表单接线与测试覆盖。",
          "risk": "产品切换后若成员、父待办或标签未同步刷新，可能提交跨产品 ID；标签还需保持 Workshop 的 ID 字符串契约。",
          "user_impact": "直接影响每次创建和编辑待办时的分配准确性、优先级可理解性和标签维护效率。"
        },
        "evidence_required": [
          "创建表单切换产品后，执行人、父待办和标签选项仅来自所选产品且成员标签不带产品前缀",
          "创建与编辑表单均显示“优先级”，提供最高、高、中、低、无选项并提交 0、1、2、3 或空值语义",
          "创建与编辑表单按项目标签 ID 多选，并提供项目内标签创建、编辑、删除及颜色名称显示能力",
          "Renderer 静态测试与 Electron 交互测试覆盖创建、编辑、产品切换、序列化和标签管理",
          "相关 ArcOrbit 测试与静态检查通过"
        ]
      },
      "planned_transition": {
        "goal": "完成 ArcOrbit 创建与编辑待办表单的产品范围联动、语义优先级和项目标签生命周期能力，并建立自动化与稳定交互证据。",
        "expected_state_change": "关闭表单能力实现 Gap，将两个受威胁影响更新为 upheld；Case 普通 Gap 清空并进入 fresh-read 后的 Completion Review。"
      },
      "accepted_state_delta": {
        "resolved_gap": {
          "id": "GAP-align-task-form-capabilities",
          "status": "resolved",
          "outcome": "ArcOrbit 创建与编辑待办表单已按产品限定成员、父待办和标签，使用语义优先级，并支持项目标签选择及创建、编辑、删除。",
          "reason": "生产 Renderer、稳定交互文档、静态测试、真实 Electron 交互回归和 ArcOrbit 全量检查共同覆盖了 Gap 的全部验收要求。",
          "evidence": [
            "runtime/arcorbit/desktop/renderer/renderer.js",
            "runtime/arcorbit/desktop/renderer/styles.css",
            "runtime/arcorbit/test/desktop-renderer.test.mjs",
            "runtime/arcorbit/test/organization-center-electron.test.mjs",
            "arckit/interaction/task-browser/interaction.md",
            "arckit/interaction/task-browser/task-form.html",
            "npm --prefix runtime/arcorbit run check: 249 tests, 247 passed, 2 skipped, 0 failed"
          ]
        },
        "facts_added": [
          {
            "id": "FACT-004",
            "revision": 1,
            "status": "accepted",
            "statement": "ArcOrbit 创建与编辑待办表单现在按所选或所属产品生成成员、父待办和标签候选，成员选项仅显示用户名；优先级使用空、0、1、2、3 对应无、最高、高、中、低；标签以项目标签 ID 多选并提交逗号分隔字符串，同时可在表单内创建、编辑名称和颜色或确认删除。",
            "basis": "生产 Renderer 实现、稳定交互文档、静态结构测试和真实 Electron 表单交互验证一致。",
            "evidence": [
              "runtime/arcorbit/desktop/renderer/renderer.js:1031",
              "runtime/arcorbit/desktop/renderer/renderer.js:1053",
              "runtime/arcorbit/desktop/renderer/renderer.js:1220",
              "runtime/arcorbit/desktop/renderer/renderer.js:1246",
              "runtime/arcorbit/desktop/renderer/renderer.js:1254",
              "runtime/arcorbit/desktop/renderer/renderer.js:1380",
              "runtime/arcorbit/desktop/renderer/renderer.js:1388",
              "runtime/arcorbit/test/desktop-renderer.test.mjs",
              "runtime/arcorbit/test/organization-center-electron.test.mjs",
              "arckit/interaction/task-browser/interaction.md",
              "arckit/interaction/task-browser/task-form.html"
            ]
          }
        ],
        "facts_superseded": [],
        "impacts_added": [],
        "impacts_updated": [
          {
            "id": "IMPACT-001",
            "fact_id": "FACT-002",
            "fact_revision": 1,
            "target": {
              "kind": "software_decision",
              "ref": "experience_and_interaction",
              "revision": 27
            },
            "effect": "upheld",
            "reason": "创建和编辑表单已按当前产品限制成员、父待办和标签，并以业务语义呈现优先级与标签管理。",
            "gap_ids": [],
            "evidence": [
              "FACT-004",
              "runtime/arcorbit/desktop/renderer/renderer.js",
              "arckit/interaction/task-browser/interaction.md",
              "arckit/interaction/task-browser/task-form.html"
            ]
          },
          {
            "id": "IMPACT-002",
            "fact_id": "FACT-002",
            "fact_revision": 1,
            "target": {
              "kind": "software_invariant",
              "ref": "accepted-facts-are-realized",
              "revision": null
            },
            "effect": "upheld",
            "reason": "操作者接受的成员范围、无产品名前缀、语义优先级和标签生命周期事实均已由生产实现及自动化回归兑现。",
            "gap_ids": [],
            "evidence": [
              "FACT-004",
              "runtime/arcorbit/test/desktop-renderer.test.mjs",
              "runtime/arcorbit/test/organization-center-electron.test.mjs",
              "npm --prefix runtime/arcorbit run check: 249 tests, 247 passed, 2 skipped, 0 failed"
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
          "arckit/interaction/task-browser/interaction.md",
          "arckit/interaction/task-browser/task-form.html"
        ]
      },
      "invariant_assessment": {
        "project_revision": 157,
        "judgments": [
          {
            "invariant_ref": "product-expectations-remain-recoverable",
            "disposition": "upheld",
            "reason": "待办表单的成员范围、优先级语义和标签能力已经由稳定产品与交互事实明确记录。",
            "fact_refs": [
              "FACT-001",
              "FACT-003",
              "FACT-004"
            ],
            "evidence": [
              "arckit/spec/agentic-software-development/arcorbit-platform-capabilities.md",
              "arckit/interaction/task-browser/interaction.md"
            ],
            "gap_refs": []
          },
          {
            "invariant_ref": "interaction-expectations-remain-recoverable",
            "disposition": "upheld",
            "reason": "创建、编辑、产品切换、标签生命周期、失败保持和字段序列化语义均已进入页面级交互文档与线框子视图。",
            "fact_refs": [
              "FACT-001",
              "FACT-003",
              "FACT-004"
            ],
            "evidence": [
              "arckit/interaction/task-browser/interaction.md",
              "arckit/interaction/task-browser/task-form.html",
              "arckit/interaction/INDEX.md"
            ],
            "gap_refs": []
          },
          {
            "invariant_ref": "visual-language-remains-consistent",
            "disposition": "not_relevant",
            "reason": "本轮接受事实是字段范围和交互语义，没有建立或修改新的视觉语言规则；实现复用现有 Desktop 表单、灰度线框和视觉变量。",
            "fact_refs": [
              "FACT-004"
            ],
            "evidence": [],
            "gap_refs": []
          },
          {
            "invariant_ref": "technical-decisions-remain-explainable",
            "disposition": "upheld",
            "reason": "Renderer 继续通过受限 Platform Action 调用 Workshop，并保持原生优先级值和逗号分隔标签 ID 契约；项目标签的名称与颜色编码边界可从实现恢复。",
            "fact_refs": [
              "FACT-003",
              "FACT-004"
            ],
            "evidence": [
              "runtime/arcorbit/desktop/renderer/renderer.js",
              "runtime/arcorbit/src/workshop-platform-adapter.mjs",
              "arckit/spec/agentic-software-development/arcorbit-platform-capabilities.md"
            ],
            "gap_refs": []
          },
          {
            "invariant_ref": "accepted-facts-are-realized",
            "disposition": "upheld",
            "reason": "创建和编辑表单的生产实现覆盖了全部已接受字段能力，静态与 Electron 回归验证了产品切换、成员显示、优先级、标签序列化和标签管理。",
            "fact_refs": [
              "FACT-001",
              "FACT-002",
              "FACT-003",
              "FACT-004"
            ],
            "evidence": [
              "runtime/arcorbit/desktop/renderer/renderer.js",
              "runtime/arcorbit/test/desktop-renderer.test.mjs",
              "runtime/arcorbit/test/organization-center-electron.test.mjs"
            ],
            "gap_refs": []
          },
          {
            "invariant_ref": "material-risks-have-credible-evidence",
            "disposition": "upheld",
            "reason": "跨产品 ID、标签编码、标签 CRUD 和表单序列化风险已由真实 Electron 交互测试覆盖，ArcOrbit 全量检查没有回归。",
            "fact_refs": [
              "FACT-002",
              "FACT-003",
              "FACT-004"
            ],
            "evidence": [
              "runtime/arcorbit/test/organization-center-electron.test.mjs",
              "runtime/arcorbit/test/fixtures/organization-center-electron.mjs",
              "runtime/arcorbit/test/fixtures/organization-center-preload.cjs",
              "npm --prefix runtime/arcorbit run check: 249 tests, 247 passed, 2 skipped, 0 failed"
            ],
            "gap_refs": []
          }
        ]
      },
      "evidence": [
        "runtime/arcorbit/desktop/renderer/renderer.js",
        "runtime/arcorbit/desktop/renderer/styles.css",
        "runtime/arcorbit/test/desktop-renderer.test.mjs",
        "runtime/arcorbit/test/organization-center-electron.test.mjs",
        "runtime/arcorbit/test/fixtures/organization-center-electron.mjs",
        "runtime/arcorbit/test/fixtures/organization-center-preload.cjs",
        "arckit/interaction/task-browser/interaction.md",
        "arckit/interaction/task-browser/task-form.html",
        "arckit/interaction/INDEX.md",
        "arckit/interaction/_map/feature-matrix.md",
        "arckit/interaction/_map/RELATIONS.md",
        "arckit/interaction/wireframe-style.css",
        "node --test test/desktop-renderer.test.mjs: 16 passed, 0 failed",
        "ARCORBIT_ELECTRON_ORGANIZATION_TEST=1 Electron interaction test: 1 passed, 0 failed",
        "npm --prefix runtime/arcorbit run check: 249 tests, 247 passed, 2 skipped, 0 failed",
        "task-form structural check: 2 wireframe canvases, 2 direct device frames, 2 states",
        "git diff --check"
      ],
      "runtime_result_ref": "arckit-runtime://runs/RUN-20260821-173813595Z",
      "occurred_at": "2026-08-21T17:57:25.441Z"
    },
    {
      "round": 2,
      "transition_schema_version": "arckit-case-transition/v8",
      "goal": "对 content revision 1 执行唯一语义 Completion Review，并记录发现而不在同一 Round 修复。",
      "outcome": "completed",
      "gap_selection": {
        "mode": "candidate",
        "basis": "CASE-20260821-003 的普通 Gap 和 impacts 已关闭，Completion Review 是该 Case 唯一 ready 义务，也是判断能否关闭 Case 的必要步骤。",
        "snapshot_token": "f203586b11b6216333306cc54527a585d433f1eb970bb275acfb1174ac2cd400",
        "selected_ref": "case-gap:CASE-20260821-003:CASE-20260821-003:completion-review:1",
        "comparison_summary": "四个 Project Gap 均需独立 Case；可靠实时实现属于 CASE-20260821-002。当前 Case 的 Completion Review 是唯一能直接推进 CASE-20260821-003 的 ready candidate，因此优先选择。",
        "fresh_discovery_summary": "五维审查发现一个有界遗漏：编辑已有优先级的待办时选择“无优先级”不会清除服务端原值，现有 Electron 测试也未覆盖该转换。未发现其他需要记录的 fresh finding。",
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
            "reason": "需要单独创建真实场景评估 Case，不属于当前表单 Case 的 Completion Review。"
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
              "user_impact": ""
            },
            "reason": "需要独立 Runtime 韧性 Case，与当前表单实现审查没有依赖。"
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
              "user_impact": ""
            },
            "reason": "需要独立的真实权限项目和 Case，当前审查不能消费。"
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
              "user_impact": ""
            },
            "reason": "虽然风险和紧迫度较高，但必须由独立 Case 承载。"
          },
          {
            "ref": "case-gap:CASE-20260821-002:GAP-reliable-realtime-implementation",
            "source": "persisted",
            "eligibility": "ready",
            "disposition": "deferred",
            "priority_basis": {
              "blocking": "用户要求直接完成优化，当前实现尚未兑现契约。",
              "uncertainty": "契约已收敛，剩余不确定性集中在实现接线与兼容性。",
              "risk": "涉及事务一致性、跨实例通知、断线恢复、权限撤销和重复调度。",
              "user_impact": "决定任务变化能否及时、可靠地触达且不会越过人工确认。"
            },
            "reason": "属于另一个活跃 Case；本轮必须先完成 CASE-20260821-003 已派生的 Completion Review。"
          },
          {
            "ref": "case-gap:CASE-20260821-003:CASE-20260821-003:completion-review:1",
            "source": "persisted",
            "eligibility": "ready",
            "disposition": "selected",
            "priority_basis": {
              "blocking": "high",
              "uncertainty": "low",
              "risk": "high",
              "user_impact": "high"
            },
            "reason": "这是当前 Case 唯一剩余义务，直接审查 content revision 1 并决定 Case 是否可以关闭。"
          }
        ]
      },
      "selected_gap": {
        "id": "CASE-20260821-003:completion-review:1",
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
        "goal": "对 content revision 1 执行唯一语义 Completion Review，并记录发现而不在同一 Round 修复。",
        "expected_state_change": "Review 记录一个 omission finding，并派生 Agent-owned 修复 Gap；CASE-20260821-003 保持 unresolved。"
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
          "reviewed_content_revision": 1,
          "dimensions": {
            "implementation_correctness": "findings",
            "problem_resolution": "findings",
            "verification_credibility": "findings",
            "regression_risk": "findings",
            "minimality": "clean"
          },
          "findings": [
            {
              "id": "PRIORITY-UNSET-NOOP",
              "kind": "omission",
              "statement": "使编辑待办的“无优先级”成为真实的清除操作：当前 normalizeTaskFormValues 删除空 priority，Workshop Platform Adapter 也将空值转为 undefined，PUT 请求最终不包含 priority，已有服务端优先级会保持不变；同时补充有值到无值的端到端回归。",
              "responsibility": "agent",
              "artifact_refs": [
                "runtime/arcorbit/desktop/renderer/renderer.js",
                "runtime/arcorbit/src/workshop-platform-adapter.mjs",
                "runtime/arcorbit/test/organization-center-electron.test.mjs",
                "/Users/Glare/Library/Developer/ModularProgram/hoewo/workshop-todo/handler/task.go"
              ],
              "evidence": [
                "runtime/arcorbit/desktop/renderer/renderer.js:1246-1251 删除空 priority",
                "runtime/arcorbit/src/workshop-platform-adapter.mjs:346-349 将空 priority 转为 undefined",
                "隔离 Adapter 诊断：updateTask('1', {priority:''}) 产生 PUT body {}",
                "Workshop handler/task.go 仅在 req.Priority != nil 时更新 priority",
                "runtime/arcorbit/test/organization-center-electron.test.mjs 只验证现有 priority 1 更新为 3，未覆盖清除"
              ]
            }
          ],
          "evidence": [
            "runtime/arcorbit/desktop/renderer/renderer.js",
            "runtime/arcorbit/src/workshop-platform-adapter.mjs",
            "runtime/arcorbit/test/desktop-renderer.test.mjs",
            "runtime/arcorbit/test/organization-center-electron.test.mjs",
            "runtime/arcorbit/test/fixtures/organization-center-electron.mjs",
            "runtime/arcorbit/test/fixtures/organization-center-preload.cjs",
            "/Users/Glare/Library/Developer/ModularProgram/hoewo/workshop-todo/handler/task.go",
            "隔离 Adapter 诊断：空 priority 的 PUT body 为 {}",
            "npm --prefix runtime/arcorbit run check: 249 tests, 247 passed, 2 skipped, 0 failed",
            "git diff --check"
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
        "project_revision": 157,
        "judgments": [
          {
            "invariant_ref": "product-expectations-remain-recoverable",
            "disposition": "upheld",
            "reason": "成员范围、语义优先级和标签能力的目标仍由稳定规格与交互文档准确记录；finding 是实现遗漏，不是产品预期缺失。",
            "fact_refs": [
              "FACT-001",
              "FACT-003",
              "FACT-004"
            ],
            "evidence": [
              "arckit/spec/agentic-software-development/arcorbit-platform-capabilities.md",
              "arckit/interaction/task-browser/interaction.md"
            ],
            "gap_refs": []
          },
          {
            "invariant_ref": "interaction-expectations-remain-recoverable",
            "disposition": "upheld",
            "reason": "创建、编辑、产品切换、无优先级和标签生命周期的目标交互仍可从页面级文档恢复；finding 明确标识了实际实现偏差。",
            "fact_refs": [
              "FACT-001",
              "FACT-003",
              "FACT-004"
            ],
            "evidence": [
              "arckit/interaction/task-browser/interaction.md",
              "arckit/interaction/task-browser/task-form.html"
            ],
            "gap_refs": []
          },
          {
            "invariant_ref": "visual-language-remains-consistent",
            "disposition": "not_relevant",
            "reason": "Review finding 涉及优先级清除的请求语义和测试覆盖，不涉及新的视觉语言事实。",
            "fact_refs": [],
            "evidence": [],
            "gap_refs": []
          },
          {
            "invariant_ref": "technical-decisions-remain-explainable",
            "disposition": "upheld",
            "reason": "Renderer、受限 Platform Adapter 和 Workshop 更新端点之间的值转换边界可以从代码恢复；finding 是该边界上的实现缺失，而非不可解释的技术决策。",
            "fact_refs": [
              "FACT-003",
              "FACT-004"
            ],
            "evidence": [
              "runtime/arcorbit/src/workshop-platform-adapter.mjs",
              "/Users/Glare/Library/Developer/ModularProgram/hoewo/workshop-todo/handler/task.go"
            ],
            "gap_refs": []
          },
          {
            "invariant_ref": "accepted-facts-are-realized",
            "disposition": "threatened",
            "reason": "主要表单能力已经实现，但已有优先级不能通过“无优先级”清除，因此 FACT-004 和用户要求尚未完全兑现。",
            "fact_refs": [
              "FACT-001",
              "FACT-004"
            ],
            "evidence": [],
            "gap_refs": [
              "CASE-20260821-003:review-finding:PRIORITY-UNSET-NOOP"
            ]
          },
          {
            "invariant_ref": "material-risks-have-credible-evidence",
            "disposition": "threatened",
            "reason": "现有静态和 Electron 测试覆盖优先级命名与 1→3 更新，却未覆盖有值→无值；全量测试通过不能证明该遗漏路径。",
            "fact_refs": [
              "FACT-002",
              "FACT-003",
              "FACT-004"
            ],
            "evidence": [],
            "gap_refs": [
              "CASE-20260821-003:review-finding:PRIORITY-UNSET-NOOP"
            ]
          }
        ]
      },
      "evidence": [
        "runtime/arcorbit/desktop/renderer/renderer.js:1246-1251",
        "runtime/arcorbit/src/workshop-platform-adapter.mjs:346-349",
        "runtime/arcorbit/test/organization-center-electron.test.mjs:49",
        "runtime/arcorbit/test/organization-center-electron.test.mjs:85-88",
        "/Users/Glare/Library/Developer/ModularProgram/hoewo/workshop-todo/handler/task.go:265-303",
        "/Users/Glare/Library/Developer/ModularProgram/hoewo/workshop-todo/handler/task.go:469-475",
        "隔离 Adapter 诊断：updateTask('1', {priority:''}) 产生 PUT body {}",
        "npm --prefix runtime/arcorbit run check: 249 tests, 247 passed, 2 skipped, 0 failed",
        "git diff --check"
      ],
      "runtime_result_ref": "arckit-runtime://runs/RUN-20260821-173813595Z",
      "occurred_at": "2026-08-21T18:00:58.213Z"
    },
    {
      "round": 3,
      "transition_schema_version": "arckit-case-transition/v8",
      "goal": "使 ArcOrbit 编辑表单的“无优先级”通过显式 null 跨 Renderer、Adapter 和 Workshop 更新端点真正清空已有值，并建立端到端回归证据。",
      "outcome": "completed",
      "gap_selection": {
        "mode": "candidate",
        "basis": "repair_rejected_claim 要求保留仍然成立的验收主张并从 fresh state 重规划；Case 003 的 review finding 仍是该 Case 唯一阻塞项。",
        "snapshot_token": "17516e0a684daeaf948609ecb2f5c83ce44609bc672b62e5416424359a041f15",
        "selected_ref": "case-gap:CASE-20260821-003:CASE-20260821-003:review-finding:PRIORITY-UNSET-NOOP",
        "comparison_summary": "当前两个 ready 候选分别是 Case 002 的 Completion Review 与 Case 003 的优先级清除 finding。修复指令要求替换被拒绝的 Case 003 主张，且该 finding 仍直接阻塞当前 Case；四个 Project Gap 均需独立 Case。",
        "fresh_discovery_summary": "fresh state 未改变所选 finding 的身份、范围或既有实现证据；没有发现需要在本轮新增的独立 Gap。",
        "considered": [
          {
            "ref": "project-gap:GAP-agent-scenario-evaluation",
            "source": "persisted",
            "eligibility": "case_required",
            "disposition": "deferred",
            "priority_basis": {
              "blocking": "不阻塞当前 Case 003 修复。",
              "uncertainty": "high",
              "risk": "high",
              "user_impact": "需要独立 Case 承载场景验证。"
            },
            "reason": "需创建独立 Case，不能替代当前被拒绝主张的 fresh 重提。"
          },
          {
            "ref": "project-gap:GAP-runtime-resilience-and-adapters",
            "source": "persisted",
            "eligibility": "case_required",
            "disposition": "deferred",
            "priority_basis": {
              "blocking": "不阻塞当前 Case 003 修复。",
              "uncertainty": "存在 Runtime 韧性与适配边界工作。",
              "risk": "high",
              "user_impact": "影响长时间受监督执行，但非当前表单缺陷。"
            },
            "reason": "需创建独立 Case；本轮受 repair_rejected_claim 约束。"
          },
          {
            "ref": "project-gap:GAP-security-real-project-validation",
            "source": "persisted",
            "eligibility": "case_required",
            "disposition": "deferred",
            "priority_basis": {
              "blocking": "不阻塞当前 Case 003 修复。",
              "uncertainty": "需真实权限项目证据。",
              "risk": "high",
              "user_impact": "影响安全边界可信度，但非当前表单路径。"
            },
            "reason": "需独立权限项目 Case 和受控资源。"
          },
          {
            "ref": "project-gap:GAP-cross-record-audit",
            "source": "persisted",
            "eligibility": "case_required",
            "disposition": "deferred",
            "priority_basis": {
              "blocking": "不阻塞当前 Case 003 修复。",
              "uncertainty": "需真实跨记录验收。",
              "risk": "high",
              "user_impact": "影响 Ledger 一致性，但与本轮表单修复无直接依赖。"
            },
            "reason": "虽具高风险和高紧迫度，仍需独立 Case。"
          },
          {
            "ref": "case-gap:CASE-20260821-002:CASE-20260821-002:completion-review:1",
            "source": "persisted",
            "eligibility": "ready",
            "disposition": "deferred",
            "priority_basis": {
              "blocking": "阻塞 Case 002 最终完成，但不阻塞 Case 003。",
              "uncertainty": "low",
              "risk": "high",
              "user_impact": "high"
            },
            "reason": "这是并发推进后出现的另一 Case Completion Review；不得覆盖当前 repair 指令要求重提的 Case 003 transition。"
          },
          {
            "ref": "case-gap:CASE-20260821-003:CASE-20260821-003:review-finding:PRIORITY-UNSET-NOOP",
            "source": "persisted",
            "eligibility": "ready",
            "disposition": "selected",
            "priority_basis": {
              "blocking": "high",
              "uncertainty": "",
              "risk": "high",
              "user_impact": ""
            },
            "reason": "它仍是 Case 003 的唯一剩余 Gap，既有实现和验证证据未因并发 Project 更新失效。"
          }
        ]
      },
      "selected_gap": {
        "id": "CASE-20260821-003:review-finding:PRIORITY-UNSET-NOOP",
        "responsibility": "agent",
        "goal": "Resolve review finding: 使编辑待办的“无优先级”成为真实的清除操作：当前 normalizeTaskFormValues 删除空 priority，Workshop Platform Adapter 也将空值转为 undefined，PUT 请求最终不包含 priority，已有服务端优先级会保持不变；同时补充有值到无值的端到端回归。",
        "reason": "omission found by completion review",
        "derived_from": [
          "completion_review",
          "content_revision:1"
        ],
        "blocked_by": [],
        "priority_basis": {
          "blocking": "high",
          "uncertainty": "",
          "risk": "high",
          "user_impact": ""
        },
        "evidence_required": [
          "runtime/arcorbit/desktop/renderer/renderer.js",
          "runtime/arcorbit/src/workshop-platform-adapter.mjs",
          "runtime/arcorbit/test/organization-center-electron.test.mjs",
          "/Users/Glare/Library/Developer/ModularProgram/hoewo/workshop-todo/handler/task.go",
          "runtime/arcorbit/desktop/renderer/renderer.js:1246-1251 删除空 priority",
          "runtime/arcorbit/src/workshop-platform-adapter.mjs:346-349 将空 priority 转为 undefined",
          "隔离 Adapter 诊断：updateTask('1', {priority:''}) 产生 PUT body {}",
          "Workshop handler/task.go 仅在 req.Priority != nil 时更新 priority",
          "runtime/arcorbit/test/organization-center-electron.test.mjs 只验证现有 priority 1 更新为 3，未覆盖清除"
        ]
      },
      "planned_transition": {
        "goal": "使 ArcOrbit 编辑表单的“无优先级”通过显式 null 跨 Renderer、Adapter 和 Workshop 更新端点真正清空已有值，并建立端到端回归证据。",
        "expected_state_change": "review finding 被解决，新增实际实现事实，相关影响和全部项目不变量恢复为 upheld；Case 内容修订递增并重新进入 Completion Review。"
      },
      "accepted_state_delta": {
        "resolved_gap": {
          "id": "CASE-20260821-003:review-finding:PRIORITY-UNSET-NOOP",
          "status": "resolved",
          "outcome": "编辑待办选择“无优先级”现在提交 priority:null，Workshop 会将持久优先级清空；创建表单仍省略空优先级。",
          "reason": "Renderer 按创建/编辑区分空值语义，Adapter 保留显式 null，Workshop 请求模型跟踪字段存在性并将 null 写入更新映射；静态、Adapter、Electron 与 Go 回归均通过。",
          "evidence": [
            "runtime/arcorbit/desktop/renderer/renderer.js",
            "runtime/arcorbit/src/workshop-platform-adapter.mjs",
            "runtime/arcorbit/test/desktop-renderer.test.mjs",
            "runtime/arcorbit/test/workshop-platform-adapter.test.mjs",
            "runtime/arcorbit/test/organization-center-electron.test.mjs",
            "/Users/Glare/Library/Developer/ModularProgram/hoewo/workshop-todo/handler/task.go",
            "/Users/Glare/Library/Developer/ModularProgram/hoewo/workshop-todo/handler/task_request_test.go",
            "/Users/Glare/Library/Developer/ModularProgram/hoewo/workshop-todo/api/task.md",
            "Electron interaction test: 1 passed, 0 failed",
            "npm --prefix runtime/arcorbit run check: 249 tests, 247 passed, 2 skipped, 0 failed",
            "go test ./...: all Workshop packages passed"
          ]
        },
        "facts_added": [
          {
            "id": "FACT-005",
            "revision": 1,
            "status": "accepted",
            "statement": "ArcOrbit 编辑待办选择“无优先级”时会将 priority 序列化为显式 null，Workshop Platform Adapter 保留该值，Workshop 更新请求区分字段省略与显式 null 并将后者写为数据库空值；创建待办的空优先级仍保持省略语义。",
            "basis": "Renderer、受限 Adapter、Workshop 请求解码和更新映射形成确定性链路，并由隔离、真实 Electron 与全量回归共同验证。",
            "evidence": [
              "runtime/arcorbit/desktop/renderer/renderer.js",
              "runtime/arcorbit/src/workshop-platform-adapter.mjs",
              "/Users/Glare/Library/Developer/ModularProgram/hoewo/workshop-todo/handler/task.go",
              "runtime/arcorbit/test/workshop-platform-adapter.test.mjs",
              "runtime/arcorbit/test/organization-center-electron.test.mjs",
              "/Users/Glare/Library/Developer/ModularProgram/hoewo/workshop-todo/handler/task_request_test.go"
            ]
          }
        ],
        "facts_superseded": [],
        "impacts_added": [],
        "impacts_updated": [
          {
            "id": "IMPACT-001",
            "fact_id": "FACT-002",
            "fact_revision": 1,
            "target": {
              "kind": "software_decision",
              "ref": "experience_and_interaction",
              "revision": 27
            },
            "effect": "upheld",
            "reason": "创建继续以省略表达未设置，编辑则以显式 null 清除已有优先级；“无优先级”的用户动作现在具有真实且可恢复的业务语义。",
            "gap_ids": [],
            "evidence": [
              "FACT-005",
              "runtime/arcorbit/desktop/renderer/renderer.js",
              "arckit/interaction/task-browser/interaction.md",
              "/Users/Glare/Library/Developer/ModularProgram/hoewo/workshop-todo/api/task.md"
            ]
          },
          {
            "id": "IMPACT-002",
            "fact_id": "FACT-002",
            "fact_revision": 1,
            "target": {
              "kind": "software_invariant",
              "ref": "accepted-facts-are-realized",
              "revision": null
            },
            "effect": "upheld",
            "reason": "成员范围、语义优先级、优先级清除和标签生命周期能力均由生产链路与自动化回归兑现。",
            "gap_ids": [],
            "evidence": [
              "FACT-005",
              "runtime/arcorbit/test/desktop-renderer.test.mjs",
              "runtime/arcorbit/test/workshop-platform-adapter.test.mjs",
              "runtime/arcorbit/test/organization-center-electron.test.mjs",
              "/Users/Glare/Library/Developer/ModularProgram/hoewo/workshop-todo/handler/task_request_test.go",
              "npm --prefix runtime/arcorbit run check: 249 tests, 247 passed, 2 skipped, 0 failed",
              "go test ./...: all Workshop packages passed"
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
        "evidence": []
      },
      "invariant_assessment": {
        "project_revision": 158,
        "judgments": [
          {
            "invariant_ref": "product-expectations-remain-recoverable",
            "disposition": "upheld",
            "reason": "成员范围、固定优先级语义、无优先级和项目标签能力仍由稳定规格及交互事实完整记录。",
            "fact_refs": [
              "FACT-001",
              "FACT-003",
              "FACT-004",
              "FACT-005"
            ],
            "evidence": [
              "arckit/spec/agentic-software-development/arcorbit-platform-capabilities.md",
              "arckit/interaction/task-browser/interaction.md"
            ],
            "gap_refs": []
          },
          {
            "invariant_ref": "interaction-expectations-remain-recoverable",
            "disposition": "upheld",
            "reason": "创建省略空优先级、编辑显式清除已有优先级以及标签生命周期交互均可从稳定交互文档和服务契约恢复。",
            "fact_refs": [
              "FACT-001",
              "FACT-003",
              "FACT-004",
              "FACT-005"
            ],
            "evidence": [
              "arckit/interaction/task-browser/interaction.md",
              "arckit/interaction/task-browser/task-form.html",
              "/Users/Glare/Library/Developer/ModularProgram/hoewo/workshop-todo/api/task.md"
            ],
            "gap_refs": []
          },
          {
            "invariant_ref": "visual-language-remains-consistent",
            "disposition": "not_relevant",
            "reason": "本轮仅修复优先级空值的请求语义和回归覆盖，没有建立或改变视觉语言规则。",
            "fact_refs": [],
            "evidence": [],
            "gap_refs": []
          },
          {
            "invariant_ref": "technical-decisions-remain-explainable",
            "disposition": "upheld",
            "reason": "Renderer 负责区分创建与编辑意图，受限 Adapter 保留显式 null，Workshop 以字段存在性区分不更新和清空；并发完成的可靠实时变更没有改变此表单更新边界。",
            "fact_refs": [
              "FACT-003",
              "FACT-004",
              "FACT-005"
            ],
            "evidence": [
              "runtime/arcorbit/desktop/renderer/renderer.js",
              "runtime/arcorbit/src/workshop-platform-adapter.mjs",
              "/Users/Glare/Library/Developer/ModularProgram/hoewo/workshop-todo/handler/task.go",
              "/Users/Glare/Library/Developer/ModularProgram/hoewo/workshop-todo/api/task.md"
            ],
            "gap_refs": []
          },
          {
            "invariant_ref": "accepted-facts-are-realized",
            "disposition": "upheld",
            "reason": "生产链路完整实现从已有优先级到“无优先级”的清除，同时保留本 Case 已接受的成员、优先级和标签能力。",
            "fact_refs": [
              "FACT-001",
              "FACT-002",
              "FACT-003",
              "FACT-004",
              "FACT-005"
            ],
            "evidence": [
              "runtime/arcorbit/desktop/renderer/renderer.js",
              "runtime/arcorbit/src/workshop-platform-adapter.mjs",
              "/Users/Glare/Library/Developer/ModularProgram/hoewo/workshop-todo/handler/task.go",
              "runtime/arcorbit/test/organization-center-electron.test.mjs"
            ],
            "gap_refs": []
          },
          {
            "invariant_ref": "material-risks-have-credible-evidence",
            "disposition": "upheld",
            "reason": "创建与编辑空值差异、Adapter null 保留、服务端省略/null 解码及真实 Electron 提交均有重复可执行回归；两侧全量检查无失败。",
            "fact_refs": [
              "FACT-002",
              "FACT-003",
              "FACT-004",
              "FACT-005"
            ],
            "evidence": [
              "runtime/arcorbit/test/desktop-renderer.test.mjs",
              "runtime/arcorbit/test/workshop-platform-adapter.test.mjs",
              "runtime/arcorbit/test/organization-center-electron.test.mjs",
              "/Users/Glare/Library/Developer/ModularProgram/hoewo/workshop-todo/handler/task_request_test.go",
              "Electron interaction test: 1 passed, 0 failed",
              "npm --prefix runtime/arcorbit run check: 249 tests, 247 passed, 2 skipped, 0 failed",
              "go test ./...: all Workshop packages passed",
              "git diff --check: ArcOrbit and Workshop clean"
            ],
            "gap_refs": []
          }
        ]
      },
      "evidence": [
        "诊断逻辑匹配：Renderer 空值删除 → Adapter undefined 压缩 → Workshop 仅非 nil 更新，100% 解释既有优先级保持不变",
        "node --test test/desktop-renderer.test.mjs test/workshop-platform-adapter.test.mjs: 19 passed, 0 failed",
        "ARCORBIT_ELECTRON_ORGANIZATION_TEST=1 Electron interaction test: 1 passed, 0 failed",
        "npm --prefix runtime/arcorbit run check: 249 tests, 247 passed, 2 skipped, 0 failed",
        "go test ./handler: passed",
        "go test ./...: all Workshop packages passed",
        "git diff --check: ArcOrbit and Workshop clean"
      ],
      "runtime_result_ref": "arckit-runtime://runs/RUN-20260821-173813595Z",
      "occurred_at": "2026-08-21T18:10:17.155Z"
    },
    {
      "round": 4,
      "transition_schema_version": "arckit-case-transition/v8",
      "goal": "对 CASE-20260821-003 content revision 2 执行唯一五维 Completion Review。",
      "outcome": "completed",
      "gap_selection": {
        "mode": "candidate",
        "basis": "当前指令明确继续 CASE-20260821-003；其普通 Gap 和 impacts 已全部闭合，Completion Review 是该 Case 唯一 ready 候选和最终阻塞项。",
        "snapshot_token": "1f247d9c14d2290fd43144ab26ca3d74d462bcc359d5ed9a81b96b45309c7315",
        "selected_ref": "case-gap:CASE-20260821-003:CASE-20260821-003:completion-review:2",
        "comparison_summary": "两个 ready 候选中，Case 003 Completion Review 直接完成当前指令指定 Case；Case 002 的 Website cursor finding 属于另一 Case。四个 Project Gap 均需创建独立 Case。",
        "fresh_discovery_summary": "审查当前实现、请求链和验证证据后未发现新的 fresh Gap。",
        "considered": [
          {
            "ref": "project-gap:GAP-agent-scenario-evaluation",
            "source": "persisted",
            "eligibility": "case_required",
            "disposition": "deferred",
            "priority_basis": {
              "blocking": "不阻塞当前 Case 003 完成。",
              "uncertainty": "high",
              "risk": "high",
              "user_impact": "需要独立场景验证 Case。"
            },
            "reason": "需创建独立 Case，不能替代当前 Completion Review。"
          },
          {
            "ref": "project-gap:GAP-runtime-resilience-and-adapters",
            "source": "persisted",
            "eligibility": "case_required",
            "disposition": "deferred",
            "priority_basis": {
              "blocking": "不阻塞当前 Case 003 完成。",
              "uncertainty": "存在 Runtime 韧性与适配边界工作。",
              "risk": "high",
              "user_impact": "影响长时间受监督执行。"
            },
            "reason": "需独立 Case，延后至 fresh post-commit 选择。"
          },
          {
            "ref": "project-gap:GAP-security-real-project-validation",
            "source": "persisted",
            "eligibility": "case_required",
            "disposition": "deferred",
            "priority_basis": {
              "blocking": "不阻塞当前 Case 003 完成。",
              "uncertainty": "需真实权限项目证据。",
              "risk": "high",
              "user_impact": "影响安全边界可信度。"
            },
            "reason": "需独立权限项目 Case 和受控资源。"
          },
          {
            "ref": "project-gap:GAP-cross-record-audit",
            "source": "persisted",
            "eligibility": "case_required",
            "disposition": "deferred",
            "priority_basis": {
              "blocking": "不阻塞当前 Case 003 完成。",
              "uncertainty": "需真实跨记录验收。",
              "risk": "high",
              "user_impact": "影响 Ledger 一致性。"
            },
            "reason": "高风险但需独立 Case，不应打断当前 Case 的最终审查。"
          },
          {
            "ref": "case-gap:CASE-20260821-002:CASE-20260821-002:review-finding:WEBSITE-CURSOR-FAIL-CLOSED",
            "source": "persisted",
            "eligibility": "ready",
            "disposition": "deferred",
            "priority_basis": {
              "blocking": "阻塞 Case 002，但不阻塞 Case 003。",
              "uncertainty": "",
              "risk": "high",
              "user_impact": ""
            },
            "reason": "属于另一活动 Case；当前指令明确继续 Case 003。"
          },
          {
            "ref": "case-gap:CASE-20260821-003:CASE-20260821-003:completion-review:2",
            "source": "persisted",
            "eligibility": "ready",
            "disposition": "selected",
            "priority_basis": {
              "blocking": "high",
              "uncertainty": "low",
              "risk": "high",
              "user_impact": "high"
            },
            "reason": "它是当前 Case 唯一剩余义务，并可基于 revision 2 的完整实现和验证证据在本轮完成。"
          }
        ]
      },
      "selected_gap": {
        "id": "CASE-20260821-003:completion-review:2",
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
        "goal": "对 CASE-20260821-003 content revision 2 执行唯一五维 Completion Review。",
        "expected_state_change": "若五维审查无 finding，则记录 clean review 并关闭 Case；若发现问题，则只记录 finding，不在同轮修复。"
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
            "runtime/arcorbit/desktop/renderer/renderer.js: create omits empty priority while edit emits explicit null",
            "runtime/arcorbit/src/platform-coordinator.mjs: task.update preserves bounded input to Platform Adapter",
            "runtime/arcorbit/src/workshop-platform-adapter.mjs: taskBody preserves priority:null in PUT body",
            "/Users/Glare/Library/Developer/ModularProgram/hoewo/workshop-todo/handler/task.go: explicit priority presence maps null to database NULL",
            "runtime/arcorbit/test/desktop-renderer.test.mjs",
            "runtime/arcorbit/test/workshop-platform-adapter.test.mjs",
            "runtime/arcorbit/test/organization-center-electron.test.mjs",
            "/Users/Glare/Library/Developer/ModularProgram/hoewo/workshop-todo/handler/task_request_test.go",
            "Focused Renderer and Adapter regression: 19 passed, 0 failed",
            "Electron interaction regression: 1 passed, 0 failed",
            "npm --prefix runtime/arcorbit run check: 249 tests, 247 passed, 2 skipped, 0 failed",
            "go test ./...: all Workshop packages passed",
            "git diff --check: ArcOrbit and Workshop clean"
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
        "project_revision": 158,
        "judgments": [
          {
            "invariant_ref": "product-expectations-remain-recoverable",
            "disposition": "upheld",
            "reason": "成员范围、固定优先级语义、无优先级和项目标签能力继续由稳定规格及交互文档完整记录。",
            "fact_refs": [
              "FACT-001",
              "FACT-003",
              "FACT-004",
              "FACT-005"
            ],
            "evidence": [
              "arckit/spec/agentic-software-development/arcorbit-platform-capabilities.md",
              "arckit/interaction/task-browser/interaction.md"
            ],
            "gap_refs": []
          },
          {
            "invariant_ref": "interaction-expectations-remain-recoverable",
            "disposition": "upheld",
            "reason": "创建、编辑、产品切换、优先级清除和标签生命周期交互均有稳定页面文档及服务契约。",
            "fact_refs": [
              "FACT-001",
              "FACT-003",
              "FACT-004",
              "FACT-005"
            ],
            "evidence": [
              "arckit/interaction/task-browser/interaction.md",
              "arckit/interaction/task-browser/task-form.html",
              "/Users/Glare/Library/Developer/ModularProgram/hoewo/workshop-todo/api/task.md"
            ],
            "gap_refs": []
          },
          {
            "invariant_ref": "visual-language-remains-consistent",
            "disposition": "not_relevant",
            "reason": "Completion Review 未发现或建立视觉语言变更；实现继续复用既有 Desktop 表单组件和样式。",
            "fact_refs": [],
            "evidence": [],
            "gap_refs": []
          },
          {
            "invariant_ref": "technical-decisions-remain-explainable",
            "disposition": "upheld",
            "reason": "Renderer 的创建/编辑意图区分、Coordinator 边界、Adapter null 保留和 Workshop 字段存在性更新契约均可从代码与 API 文档恢复。",
            "fact_refs": [
              "FACT-003",
              "FACT-004",
              "FACT-005"
            ],
            "evidence": [
              "runtime/arcorbit/desktop/renderer/renderer.js",
              "runtime/arcorbit/src/platform-coordinator.mjs",
              "runtime/arcorbit/src/workshop-platform-adapter.mjs",
              "/Users/Glare/Library/Developer/ModularProgram/hoewo/workshop-todo/handler/task.go",
              "/Users/Glare/Library/Developer/ModularProgram/hoewo/workshop-todo/api/task.md"
            ],
            "gap_refs": []
          },
          {
            "invariant_ref": "accepted-facts-are-realized",
            "disposition": "upheld",
            "reason": "生产实现完整覆盖产品级成员和关联对象过滤、语义优先级、已有优先级清除、标签 ID 序列化及标签生命周期管理。",
            "fact_refs": [
              "FACT-001",
              "FACT-002",
              "FACT-003",
              "FACT-004",
              "FACT-005"
            ],
            "evidence": [
              "runtime/arcorbit/desktop/renderer/renderer.js",
              "runtime/arcorbit/src/workshop-platform-adapter.mjs",
              "/Users/Glare/Library/Developer/ModularProgram/hoewo/workshop-todo/handler/task.go",
              "runtime/arcorbit/test/organization-center-electron.test.mjs"
            ],
            "gap_refs": []
          },
          {
            "invariant_ref": "material-risks-have-credible-evidence",
            "disposition": "upheld",
            "reason": "跨产品 ID、标签编码、创建/编辑空值差异、Adapter null 保留、服务端省略/null 解码和真实 Electron 提交均有相称且可重复的回归证据。",
            "fact_refs": [
              "FACT-002",
              "FACT-003",
              "FACT-004",
              "FACT-005"
            ],
            "evidence": [
              "runtime/arcorbit/test/desktop-renderer.test.mjs",
              "runtime/arcorbit/test/workshop-platform-adapter.test.mjs",
              "runtime/arcorbit/test/organization-center-electron.test.mjs",
              "/Users/Glare/Library/Developer/ModularProgram/hoewo/workshop-todo/handler/task_request_test.go",
              "Focused Renderer and Adapter regression: 19 passed, 0 failed",
              "Electron interaction regression: 1 passed, 0 failed",
              "npm --prefix runtime/arcorbit run check: 249 tests, 247 passed, 2 skipped, 0 failed",
              "go test ./...: all Workshop packages passed",
              "git diff --check: ArcOrbit and Workshop clean"
            ],
            "gap_refs": []
          }
        ]
      },
      "evidence": [
        "五维 Completion Review：implementation correctness、problem resolution、verification credibility、regression risk、minimality 均 clean",
        "Focused Renderer and Adapter regression: 19 passed, 0 failed",
        "go test ./handler: passed",
        "Electron interaction regression: 1 passed, 0 failed",
        "npm --prefix runtime/arcorbit run check: 249 tests, 247 passed, 2 skipped, 0 failed",
        "go test ./...: all Workshop packages passed",
        "git diff --check: ArcOrbit and Workshop clean"
      ],
      "runtime_result_ref": "arckit-runtime://runs/RUN-20260821-173813595Z",
      "occurred_at": "2026-08-21T18:12:29.064Z"
    }
  ],
  "case_resolution": {
    "status": "resolved",
    "stage": "resolved",
    "satisfied": [
      "GAP-align-task-form-capabilities",
      "CASE-20260821-003:review-finding:PRIORITY-UNSET-NOOP"
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
    "updated_at": "2026-08-21T18:12:29.064Z"
  }
}
```

## Round Notes

- Case history is canonical in Structured Record.rounds; keep prose notes exceptional.
