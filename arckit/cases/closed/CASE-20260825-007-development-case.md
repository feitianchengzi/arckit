# 支持编辑待办时切换产品

Case: CASE-20260825-007
Status: closed
Artifact Type: mixed
Selected Gap: none
Updated: 2026-08-25T13:13:49.731Z

## User Intent

让 ArcOrbit Work 的编辑待办页面允许用户纠正待办所属产品，降低多项目并行时创建到错误位置后无法自助修正的风险。

## Structured Record

```json
{
  "schema_version": "development-case-record/v5",
  "id": "CASE-20260825-007",
  "title": "支持编辑待办时切换产品",
  "status": "closed",
  "artifact_type": "mixed",
  "created_at": "2026-08-25T11:55:57.673Z",
  "updated_at": "2026-08-25T13:13:49.731Z",
  "user_intent": "让 ArcOrbit Work 的编辑待办页面允许用户纠正待办所属产品，降低多项目并行时创建到错误位置后无法自助修正的风险。",
  "expected_outcome": "编辑待办能够安全、明确地切换目标产品；保存后 Workshop 真相、本地 Task Projection、Work 展示和相关 Automation 状态保持一致，并具备可验证的失败与恢复行为。",
  "project_state_ref": "arckit/project/state.record.json",
  "current_round": {
    "goal": "",
    "selected_gap": null
  },
  "facts": [
    {
      "id": "FACT-WORK-EDIT-PRODUCT-REASSIGNMENT",
      "revision": 1,
      "status": "accepted",
      "statement": "ArcOrbit 的本地使用以多项目推进为主，用户容易把待办创建到错误产品；Work 编辑待办页面必须支持切换所属产品，以便用户纠正归属。",
      "basis": "当前操作者明确提出的产品需求及其多项目使用场景。",
      "evidence": [
        "Current operator input, 2026-08-25"
      ]
    },
    {
      "id": "FACT-20260825-007-001",
      "revision": 1,
      "status": "accepted",
      "statement": "当前 ArcOrbit 编辑待办链路不能修改产品归属：Renderer 编辑表单没有产品字段，Platform Adapter 的 updateTask body 不包含 project_id，Workshop UpdateTaskRequest 也不接受或更新 project_id。",
      "basis": "ArcOrbit 与 Workshop Todo 当前源码的直接检查。",
      "evidence": [
        "runtime/arcorbit/desktop/renderer/renderer.js:2170-2191",
        "runtime/arcorbit/src/workshop-platform-adapter.mjs:303-305,543-553",
        "/Users/Glare/Library/Developer/ModularProgram/hoewo/workshop-todo/handler/task.go:259-535"
      ]
    },
    {
      "id": "FACT-20260825-007-002",
      "revision": 1,
      "status": "superseded",
      "statement": "编辑待办支持在当前产品集的可写产品之间切换；切换清空旧产品的执行人、父待办和标签，保留同一 Task 身份、正文、状态、优先级、评论附件及 Run/thread 关联，并通过 Workshop 单次原子 mutation、源/目标项目事件和 Work Sync 双分区提交完成。活动 execution 不阻止切换，确认后由 Automation 安全停止旧 lane 并进入外部变化恢复。",
      "basis": "当前操作者需求、既有 Work/Automation 所有权边界以及已维护的稳定产品、交互和技术规格。",
      "evidence": [
        "Current operator input, 2026-08-25",
        "arckit/spec/agentic-software-development/arcorbit-work-management.md",
        "arckit/interaction/task-browser/interaction.md",
        "arckit/interaction/task-browser/task-form.html",
        "arckit/tech/arcorbit/platform-composition-solution.md",
        "arckit/tech/arcorbit/realtime-synchronization-solution.md"
      ]
    },
    {
      "id": "FACT-20260825-007-003",
      "revision": 1,
      "status": "accepted",
      "statement": "编辑待办切换产品采用受控替换：先在目标产品创建新 Task，服务端确认创建成功后再删除源 Task。新 Task 复制正文、状态和优先级，并使用目标产品内重新选择的执行人、父待办和标签；它获得新的 Task id 和创建元数据，不继承源评论、附件、Run、session、thread、Gate、验收问题或旧详情链接。目标创建失败时源 Task 不变；目标创建成功而源删除失败时保留两个 Task 和恢复状态，允许重试删除源 Task或明确保留两者。",
      "basis": "当前操作者明确接受删除旧待办并复制新待办，以及基于现有 Work/Automation 边界维护的稳定规格。",
      "evidence": [
        "Current operator input, 2026-08-25",
        "arckit/spec/agentic-software-development/arcorbit-work-management.md",
        "arckit/interaction/task-browser/interaction.md",
        "arckit/interaction/task-browser/task-form.html",
        "arckit/tech/arcorbit/platform-composition-solution.md",
        "arckit/tech/arcorbit/realtime-synchronization-solution.md"
      ]
    },
    {
      "id": "FACT-20260825-007-004",
      "revision": 1,
      "status": "accepted",
      "statement": "当前 ArcOrbit Workshop Adapter 与 Work Sync 已分别具备创建和删除待办的方法，可作为受控替换的两个服务端确认阶段；它们尚未被编排成编辑待办切换产品的生产流程。",
      "basis": "当前 ArcOrbit 源码的直接检查。",
      "evidence": [
        "runtime/arcorbit/src/workshop-platform-adapter.mjs:300-308",
        "runtime/arcorbit/src/work-sync-coordinator.mjs:194-200,244-250",
        "runtime/arcorbit/src/platform-coordinator.mjs:442,477,518"
      ]
    },
    {
      "id": "FACT-20260825-007-005",
      "revision": 1,
      "status": "accepted",
      "statement": "ArcOrbit Work 已实现编辑待办的受控跨产品替换：Renderer 允许选择当前产品集中的目标产品并明确提示新身份和非迁移数据；Platform Coordinator 只接受受限 typed actions；Work Sync 在目标创建获得 Workshop 确认后才删除源 Task，并持久保存删除失败状态，支持跨重启重试且不重复创建目标 Task，或由用户明确保留两者。源删除投影会使 Automation 安全停止旧 execution，目标 Task 不继承旧执行身份。",
      "basis": "生产源码、跨层测试、完整测试套件和真实 Electron 夹具的直接验证。",
      "evidence": [
        "runtime/arcorbit/desktop/renderer/renderer.js:2181-2227",
        "runtime/arcorbit/src/platform-coordinator.mjs:442-447,524-559",
        "runtime/arcorbit/src/work-sync-coordinator.mjs:208-303",
        "runtime/arcorbit/src/desktop/desktop-store.mjs:229-323",
        "runtime/arcorbit/test/work-sync-coordinator.test.mjs",
        "runtime/arcorbit/test/platform-coordinator.test.mjs",
        "runtime/arcorbit/test/automation-coordinator.test.mjs",
        "Validation: targeted affected suite — 140 passed, 0 failed; full node test suite — 421 tests, exit code 0."
      ]
    },
    {
      "id": "FACT-20260825-007-006",
      "revision": 1,
      "status": "accepted",
      "statement": "ArcOrbit Work 编辑待办的跨产品替换现在由受管 Sheet 生命周期执行：目标创建失败保留目标产品及全部表单草稿；源删除失败保持 Sheet 并显示源/目标 Task 与恢复动作；幂等重试不会再次创建目标 Task，成功后关闭 Sheet并切换到目标产品。",
      "basis": "生产 Renderer 实现、真实 Electron 失败场景与完整回归套件的直接验证。",
      "evidence": [
        "runtime/arcorbit/desktop/renderer/renderer.js:2189-2239,2517-2625",
        "runtime/arcorbit/desktop/renderer/index.html:284-289",
        "runtime/arcorbit/test/task-replacement-sheet-electron.test.mjs:11-37",
        "Validation: affected cross-layer suite — 141 passed, 0 failed; full suite — 422 passed, exit code 0."
      ]
    }
  ],
  "state_impacts": [
    {
      "id": "IMPACT-WORK-EDIT-PRODUCT-CAPABILITY",
      "fact_id": "FACT-WORK-EDIT-PRODUCT-REASSIGNMENT",
      "fact_revision": 1,
      "target": {
        "kind": "software_decision",
        "ref": "product_capabilities",
        "revision": 30
      },
      "effect": "upheld",
      "reason": "生产 Work 已实现受控创建目标待办、确认后删除源待办以及部分成功恢复，兑现既定产品能力。",
      "gap_ids": [],
      "evidence": [
        "arckit/spec/agentic-software-development/arcorbit-work-management.md",
        "runtime/arcorbit/desktop/renderer/renderer.js",
        "runtime/arcorbit/src/work-sync-coordinator.mjs",
        "runtime/arcorbit/test/work-sync-coordinator.test.mjs"
      ]
    },
    {
      "id": "IMPACT-WORK-EDIT-PRODUCT-INTERACTION",
      "fact_id": "FACT-WORK-EDIT-PRODUCT-REASSIGNMENT",
      "fact_revision": 1,
      "target": {
        "kind": "software_decision",
        "ref": "experience_and_interaction",
        "revision": 45
      },
      "effect": "upheld",
      "reason": "生产 Sheet 现已兑现创建失败保留草稿、删除失败保持 Sheet、显示分步状态及提供恢复动作的稳定交互要求。",
      "gap_ids": [],
      "evidence": [
        "arckit/interaction/task-browser/interaction.md:120-121,216-217,255-257",
        "runtime/arcorbit/desktop/renderer/renderer.js:2189-2239,2517-2625",
        "runtime/arcorbit/test/task-replacement-sheet-electron.test.mjs:11-37"
      ]
    },
    {
      "id": "IMPACT-20260825-007-001",
      "fact_id": "FACT-20260825-007-001",
      "fact_revision": 1,
      "target": {
        "kind": "software_decision",
        "ref": "technical_foundation",
        "revision": 34
      },
      "effect": "upheld",
      "reason": "Work Sync 已在既有独立 create/delete 服务契约之上实现创建优先的两阶段编排、持久恢复状态和幂等删除重试，无需 Workshop updateTask 修改 project_id。",
      "gap_ids": [],
      "evidence": [
        "arckit/tech/arcorbit/platform-composition-solution.md",
        "runtime/arcorbit/src/desktop/desktop-store.mjs",
        "runtime/arcorbit/src/platform-coordinator.mjs",
        "runtime/arcorbit/src/work-sync-coordinator.mjs",
        "runtime/arcorbit/test/work-sync-coordinator.test.mjs"
      ]
    },
    {
      "id": "IMPACT-20260825-007-002",
      "fact_id": "FACT-20260825-007-001",
      "fact_revision": 1,
      "target": {
        "kind": "software_decision",
        "ref": "external_integrations",
        "revision": 11
      },
      "effect": "upheld",
      "reason": "选择的产品行为只要求 Workshop 已有的独立创建与删除契约；不再要求 updateTask 支持 project_id、双产品原子事务或转移事件。",
      "gap_ids": [],
      "evidence": [
        "arckit/tech/arcorbit/platform-composition-solution.md",
        "arckit/tech/arcorbit/realtime-synchronization-solution.md",
        "runtime/arcorbit/src/workshop-platform-adapter.mjs:300-308"
      ]
    },
    {
      "id": "IMPACT-20260825-007-003",
      "fact_id": "FACT-WORK-EDIT-PRODUCT-REASSIGNMENT",
      "fact_revision": 1,
      "target": {
        "kind": "software_invariant",
        "ref": "accepted-facts-are-realized",
        "revision": null
      },
      "effect": "upheld",
      "reason": "受控复制/删除能力及其失败恢复现已在 Renderer、Work Sync 和持久恢复链路中完整实现，并由真实 Electron 与跨层测试验证。",
      "gap_ids": [],
      "evidence": [
        "runtime/arcorbit/desktop/renderer/renderer.js:2189-2239,2485-2625",
        "runtime/arcorbit/src/work-sync-coordinator.mjs:208-303",
        "runtime/arcorbit/test/task-replacement-sheet-electron.test.mjs:11-37",
        "runtime/arcorbit/test/work-sync-coordinator.test.mjs:174-322",
        "Validation: full ArcOrbit Node/Electron suite — 422 passed, exit code 0."
      ]
    }
  ],
  "gaps": [
    {
      "id": "GAP-ESTABLISH-WORK-PRODUCT-REASSIGNMENT-BOUNDARY",
      "status": "resolved",
      "goal": "查明并建立 Work 编辑待办跨产品重归属的端到端产品语义、技术边界和可验证验收口径。",
      "reason": "直接实现 UI 前必须确认 Workshop mutation 是否允许修改任务所属产品，以及迁移如何影响登录代际分区的 Task Projection、当前选择和活动 Automation execution；这些结论会改变实现范围和验收方式。",
      "derived_from": [
        "FACT-WORK-EDIT-PRODUCT-REASSIGNMENT"
      ],
      "blocked_by": [],
      "priority_basis": {
        "blocking": "阻塞正确实现，避免只增加选择控件却无法可靠迁移归属。",
        "uncertainty": "Workshop mutation、投影迁移和活动 execution 的现有边界尚未核实。",
        "risk": "半实现可能造成远端真相、本地投影与 Automation lane 不一致。",
        "user_impact": "多项目用户无法纠正高频误归属，可能继续在错误产品推进待办。"
      },
      "responsibility": "agent",
      "evidence_required": [
        "现有 Work 编辑表单、main-process mutation、Workshop adapter、Task Projection 与 Automation 消费边界的可追溯代码证据。",
        "明确产品切换提交、成功刷新、失败回滚以及活动 execution 处理方式的持久产品、交互和技术预期。",
        "能够指导后续实现与验证的端到端验收口径。"
      ],
      "resolution": {
        "id": "GAP-ESTABLISH-WORK-PRODUCT-REASSIGNMENT-BOUNDARY",
        "status": "resolved",
        "outcome": "established",
        "reason": "产品、交互、线框、技术架构及验收口径已更新；当前 ArcOrbit 与 Workshop 服务契约限制已有直接源码证据。",
        "evidence": [
          "arckit/spec/agentic-software-development/arcorbit-work-management.md",
          "arckit/interaction/task-browser/interaction.md",
          "arckit/interaction/task-browser/task-form.html",
          "arckit/tech/arcorbit/platform-composition-solution.md",
          "arckit/tech/arcorbit/realtime-synchronization-solution.md",
          "runtime/arcorbit/src/workshop-platform-adapter.mjs:303-305,543-553",
          "runtime/arcorbit/src/work-sync-coordinator.mjs:208-241",
          "runtime/arcorbit/desktop/renderer/renderer.js:2170-2191",
          "/Users/Glare/Library/Developer/ModularProgram/hoewo/workshop-todo/handler/task.go:259-535"
        ],
        "occurred_at": "2026-08-25T12:18:10.220Z"
      }
    },
    {
      "id": "GAP-20260825-007-001",
      "status": "cancelled",
      "goal": "扩展并验证 Workshop Task update 的原子产品转移契约，使同一 Task 能在源、目标产品之间安全迁移。",
      "reason": "当前服务和 ArcOrbit Adapter 都不支持在 update 时修改 project_id；没有服务端原子转移、双权限校验和源/目标事件，ArcOrbit 无法可信实现编辑待办切换产品。",
      "derived_from": [
        "FACT-WORK-EDIT-PRODUCT-REASSIGNMENT",
        "FACT-20260825-007-001",
        "FACT-20260825-007-002"
      ],
      "blocked_by": [],
      "priority_basis": {
        "blocking": "完全阻塞生产功能实现与端到端验收。",
        "uncertainty": "外部 Workshop 服务尚未实现已接受契约。",
        "risk": "客户端 copy/delete 会破坏任务身份、评论附件和执行关联。",
        "user_impact": "用户仍无法纠正错误产品归属。"
      },
      "responsibility": "external",
      "evidence_required": [
        "Workshop UpdateTask 接受目标 project_id 与 expected_project_id，并在同一事务校验源修改权和目标写入权。",
        "产品切换时 executor_id、father_id、tags 只能引用目标产品，旧产品关联不会残留。",
        "成功转移保留 Task id、正文、状态、优先级、创建者、时间字段和 TaskAttachment，并同事务写入源项目 transferred-out 与目标项目 transferred-in 事件。",
        "服务端测试覆盖成功、源/目标权限拒绝、预期源产品冲突、关联字段非法和事件写入失败整体回滚。"
      ],
      "resolution": {
        "status": "cancelled",
        "outcome": "superseded_by_controlled_replacement",
        "reason": "操作者已接受新建目标 Task 并删除源 Task，不再要求 Workshop 原子修改 project_id 或保留同一 Task 身份；该外部契约不再阻塞当前产品能力。",
        "evidence": [
          "Current operator input, 2026-08-25",
          "arckit/spec/agentic-software-development/arcorbit-work-management.md",
          "arckit/tech/arcorbit/platform-composition-solution.md"
        ],
        "occurred_at": "2026-08-25T12:36:32.854Z"
      }
    },
    {
      "id": "GAP-20260825-007-003",
      "status": "resolved",
      "goal": "建立编辑待办跨产品重归属的受控复制/删除产品、交互和技术契约。",
      "reason": "操作者接受删除旧待办并复制新待办，推翻了必须保持同一 Task 身份的既有前提；必须在实现前明确安全顺序、复制范围和失败恢复。",
      "derived_from": [
        "FACT-WORK-EDIT-PRODUCT-REASSIGNMENT",
        "current-operator-input-2026-08-25"
      ],
      "blocked_by": [],
      "priority_basis": {
        "blocking": "阻塞替代方案的可信实现。",
        "uncertainty": "两次独立 mutation 的边界和恢复语义需要重新建立。",
        "risk": "先删后建或掩盖部分成功会造成数据丢失或重复待办。",
        "user_impact": "直接影响用户纠正错误产品归属。"
      },
      "responsibility": "agent",
      "evidence_required": [
        "稳定产品规格明确新 Task 身份、复制字段和不迁移数据。",
        "交互规格明确确认、提交顺序、失败保留与部分成功恢复。",
        "技术方案明确 Work-owned create/delete 编排、持久恢复状态和 Automation 外部变化处理。",
        "当前 ArcOrbit createTask/deleteTask 能力的直接代码证据。"
      ],
      "resolution": {
        "id": "GAP-20260825-007-003",
        "status": "resolved",
        "outcome": "established",
        "reason": "产品、交互、线框和技术方案已统一采用先创建目标待办、服务端确认后再删除源待办的受控替换语义，并明确新身份、非迁移数据及部分成功恢复。",
        "evidence": [
          "arckit/spec/agentic-software-development/arcorbit-work-management.md",
          "arckit/interaction/task-browser/interaction.md",
          "arckit/interaction/task-browser/task-form.html",
          "arckit/tech/arcorbit/platform-composition-solution.md",
          "arckit/tech/arcorbit/realtime-synchronization-solution.md",
          "runtime/arcorbit/src/workshop-platform-adapter.mjs:300-308",
          "runtime/arcorbit/src/work-sync-coordinator.mjs:194-200,244-250"
        ],
        "occurred_at": "2026-08-25T12:36:32.854Z"
      }
    },
    {
      "id": "GAP-20260825-007-002",
      "status": "resolved",
      "goal": "实现并验证 ArcOrbit Work 编辑待办的受控复制/删除产品重归属流程。",
      "reason": "稳定契约和现有独立 create/delete 能力已经成立，但 Renderer、IPC、Platform Coordinator、Work Sync、投影恢复和 Automation 外部变化处理尚未组成生产能力。",
      "derived_from": [
        "FACT-WORK-EDIT-PRODUCT-REASSIGNMENT",
        "FACT-20260825-007-003",
        "FACT-20260825-007-004"
      ],
      "blocked_by": [],
      "priority_basis": {
        "blocking": "完全阻塞用户在生产 Work 中切换待办产品。",
        "uncertainty": "跨层编排、重启恢复和 Automation 停止时序尚未实现。",
        "risk": "错误顺序可能丢失源 Task；部分成功处理错误可能产生无法恢复的重复或错误删除。",
        "user_impact": "用户当前仍无法在编辑页面完成产品纠错。"
      },
      "responsibility": "agent",
      "evidence_required": [
        "Renderer、typed IPC、Platform Coordinator 与 Work Sync 实现产品选择及 create-then-delete 编排。",
        "测试证明目标创建确认前绝不删除源 Task。",
        "测试覆盖目标创建失败、源删除失败、重启恢复、重试删除和明确保留两者。",
        "验证复制字段和不迁移数据符合稳定规格，并证明源删除确认后 Automation 安全停止旧 execution，目标 Task 不继承旧执行关系。"
      ],
      "resolution": {
        "id": "GAP-20260825-007-002",
        "status": "resolved",
        "outcome": "implemented_and_verified",
        "reason": "产品选择、显式确认、受限跨层命令、目标创建优先、源删除后置、持久部分成功状态、重试删除、保留两者和 Automation 外部变化恢复均已实现并通过定向及全量测试。",
        "evidence": [
          "runtime/arcorbit/desktop/renderer/renderer.js",
          "runtime/arcorbit/desktop/renderer/styles.css",
          "runtime/arcorbit/src/desktop/desktop-store.mjs",
          "runtime/arcorbit/src/platform-coordinator.mjs",
          "runtime/arcorbit/src/work-sync-coordinator.mjs",
          "runtime/arcorbit/test/work-sync-coordinator.test.mjs",
          "runtime/arcorbit/test/platform-coordinator.test.mjs",
          "runtime/arcorbit/test/desktop-store.test.mjs",
          "runtime/arcorbit/test/desktop-renderer.test.mjs",
          "runtime/arcorbit/test/automation-coordinator.test.mjs",
          "Validation: targeted affected suite — 140 passed, 0 failed.",
          "Validation: full node test suite — 421 tests completed with exit code 0.",
          "Validation: production JavaScript syntax checks, real Electron experience fixture, and git diff --check passed."
        ],
        "occurred_at": "2026-08-25T12:51:04.418Z"
      }
    },
    {
      "id": "CASE-20260825-007:review-finding:FINDING-20260825-007-001",
      "status": "resolved",
      "goal": "Resolve review finding: 编辑待办提交时，Renderer 在远端 mutation 开始前立即关闭 Sheet；目标 Task 创建失败后仅显示 Toast，没有保存或重开目标产品及全部表单草稿。源删除失败时恢复动作改在 Inspector 展示，也未保持 Sheet 和分步状态。这违反稳定交互中“创建失败保留草稿”和“删除失败时 Sheet 保持打开”的要求；现有 Renderer 测试只检查源码字符串，没有执行这两个失败生命周期。",
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
        "arckit/interaction/task-browser/interaction.md",
        "runtime/arcorbit/desktop/renderer/renderer.js",
        "runtime/arcorbit/test/desktop-renderer.test.mjs",
        "arckit/interaction/task-browser/interaction.md:120-121,216-217,255-257",
        "runtime/arcorbit/desktop/renderer/renderer.js:532-535",
        "runtime/arcorbit/desktop/renderer/renderer.js:2182-2217",
        "runtime/arcorbit/desktop/renderer/renderer.js:2487-2503",
        "runtime/arcorbit/desktop/renderer/renderer.js:3840-3851",
        "runtime/arcorbit/test/desktop-renderer.test.mjs:743-771"
      ],
      "resolution": {
        "id": "CASE-20260825-007:review-finding:FINDING-20260825-007-001",
        "status": "resolved",
        "outcome": "implemented_and_verified",
        "reason": "Renderer 为编辑待办引入受管异步 Sheet 提交：mutation 期间锁定控件；目标创建失败后 Sheet 保持打开且所有字段恢复可编辑；源删除失败后同一 Sheet 显示源、目标 Task ID，并提供幂等重试删除或保留两者；成功后关闭 Sheet并切换到目标产品。真实 Electron 失败生命周期、受影响跨层套件和完整测试均通过。",
        "evidence": [
          "arckit/interaction/task-browser/interaction.md:120-121,216-217,255-257",
          "runtime/arcorbit/desktop/renderer/renderer.js:535-542,2189-2239,2485-2625",
          "runtime/arcorbit/desktop/renderer/index.html:284-289",
          "runtime/arcorbit/desktop/renderer/styles.css",
          "runtime/arcorbit/test/desktop-renderer.test.mjs:743-778",
          "runtime/arcorbit/test/task-replacement-sheet-electron.test.mjs:11-37",
          "runtime/arcorbit/test/fixtures/task-replacement-sheet-electron.mjs:30-95",
          "Validation: affected cross-layer suite — 141 passed, 0 failed.",
          "Validation: full ArcOrbit Node/Electron suite — 422 passed, exit code 0.",
          "Validation: production JavaScript syntax checks and git diff --check passed."
        ],
        "occurred_at": "2026-08-25T13:10:16.179Z"
      }
    }
  ],
  "content_revision": 4,
  "completion_review": {
    "status": "clean",
    "policy": {
      "initial_max_cycles": 10,
      "source": "runtime/arcorbit/config/case-policy.json",
      "snapshotted_at": "2026-08-25T11:55:57.673Z"
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
          "implementation_correctness": "findings",
          "problem_resolution": "findings",
          "verification_credibility": "findings",
          "regression_risk": "findings",
          "minimality": "clean"
        },
        "finding_ids": [
          "FINDING-20260825-007-001"
        ],
        "evidence": [
          "arckit/spec/agentic-software-development/arcorbit-work-management.md:53-73,94-103",
          "arckit/interaction/task-browser/interaction.md:114-123,211-219,251-259",
          "arckit/tech/arcorbit/platform-composition-solution.md:281-285,368-383",
          "runtime/arcorbit/desktop/renderer/renderer.js:532-535,2182-2227,2487-2512,3840-3851",
          "runtime/arcorbit/src/work-sync-coordinator.mjs:208-303",
          "runtime/arcorbit/src/platform-coordinator.mjs:442-447,524-559",
          "runtime/arcorbit/test/work-sync-coordinator.test.mjs:174-322",
          "runtime/arcorbit/test/platform-coordinator.test.mjs:355-409",
          "runtime/arcorbit/test/desktop-renderer.test.mjs:743-771",
          "runtime/arcorbit/test/automation-coordinator.test.mjs:210-239",
          "Validation: focused affected suite completed successfully; git diff --check passed."
        ],
        "occurred_at": "2026-08-25T12:55:40.147Z"
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
          "arckit/spec/agentic-software-development/arcorbit-work-management.md",
          "arckit/interaction/task-browser/interaction.md:120-121,216-217,255-257",
          "runtime/arcorbit/desktop/renderer/renderer.js:2189-2239,2485-2625",
          "runtime/arcorbit/src/platform-coordinator.mjs:438-447,527-557",
          "runtime/arcorbit/src/work-sync-coordinator.mjs:208-303",
          "runtime/arcorbit/test/task-replacement-sheet-electron.test.mjs:11-37",
          "runtime/arcorbit/test/work-sync-coordinator.test.mjs:174-322",
          "Review rerun: 140 non-Electron affected cross-layer tests passed, 0 failed.",
          "Review rerun: isolated real Electron failure-lifecycle test passed, 1 passed, 0 failed.",
          "Validation: full ArcOrbit Node/Electron suite previously accepted at content revision 4 — 422 passed, exit code 0.",
          "Review validation: production JavaScript syntax checks and git diff --check passed."
        ],
        "occurred_at": "2026-08-25T13:13:49.731Z"
      }
    ],
    "evidence": [
      "arckit/spec/agentic-software-development/arcorbit-work-management.md:53-73,94-103",
      "arckit/interaction/task-browser/interaction.md:114-123,211-219,251-259",
      "arckit/tech/arcorbit/platform-composition-solution.md:281-285,368-383",
      "runtime/arcorbit/desktop/renderer/renderer.js:532-535,2182-2227,2487-2512,3840-3851",
      "runtime/arcorbit/src/work-sync-coordinator.mjs:208-303",
      "runtime/arcorbit/src/platform-coordinator.mjs:442-447,524-559",
      "runtime/arcorbit/test/work-sync-coordinator.test.mjs:174-322",
      "runtime/arcorbit/test/platform-coordinator.test.mjs:355-409",
      "runtime/arcorbit/test/desktop-renderer.test.mjs:743-771",
      "runtime/arcorbit/test/automation-coordinator.test.mjs:210-239",
      "Validation: focused affected suite completed successfully; git diff --check passed.",
      "arckit/spec/agentic-software-development/arcorbit-work-management.md",
      "arckit/interaction/task-browser/interaction.md:120-121,216-217,255-257",
      "runtime/arcorbit/desktop/renderer/renderer.js:2189-2239,2485-2625",
      "runtime/arcorbit/src/platform-coordinator.mjs:438-447,527-557",
      "runtime/arcorbit/test/task-replacement-sheet-electron.test.mjs:11-37",
      "Review rerun: 140 non-Electron affected cross-layer tests passed, 0 failed.",
      "Review rerun: isolated real Electron failure-lifecycle test passed, 1 passed, 0 failed.",
      "Validation: full ArcOrbit Node/Electron suite previously accepted at content revision 4 — 422 passed, exit code 0.",
      "Review validation: production JavaScript syntax checks and git diff --check passed."
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
      "goal": "核实现有端到端 mutation 边界，并把编辑待办跨产品转移的稳定产品、交互、技术和验收语义写入权威文档。",
      "outcome": "completed",
      "gap_selection": {
        "mode": "candidate",
        "basis": "Fresh canonical state 显示当前 Case 的边界建立 Gap 仍是唯一 ready Case Gap；选择绑定 CASE-20260825-007 的 fresh selection token。",
        "snapshot_token": "b4049c8157663b936504a665d28bcc4462530a1678c7023cf5032566854026c2",
        "selected_ref": "case-gap:CASE-20260825-007:GAP-ESTABLISH-WORK-PRODUCT-REASSIGNMENT-BOUNDARY",
        "comparison_summary": "选择当前 Case 的产品重归属边界 Gap；四个 Project Gap 均需另建 Case，且不直接解决当前高频误归属问题。",
        "fresh_discovery_summary": "实现与外部服务源码确认：ArcOrbit updateTask 丢弃 project_id，Workshop UpdateTaskRequest 也不接受 project_id；该事实暴露一个必须后续解决的外部契约 Gap。",
        "considered": [
          {
            "ref": "project-gap:GAP-agent-scenario-evaluation",
            "source": "persisted",
            "eligibility": "case_required",
            "disposition": "deferred",
            "priority_basis": {
              "blocking": "不阻塞当前编辑待办产品纠错事项。",
              "uncertainty": "high",
              "risk": "high",
              "user_impact": "间接。"
            },
            "reason": "属于通用 Agent 场景验证，需要独立 Case。"
          },
          {
            "ref": "project-gap:GAP-runtime-resilience-and-adapters",
            "source": "persisted",
            "eligibility": "case_required",
            "disposition": "deferred",
            "priority_basis": {
              "blocking": "不直接阻塞本轮产品重归属边界定义。",
              "uncertainty": "medium",
              "risk": "high",
              "user_impact": "间接。"
            },
            "reason": "属于 Runtime 韧性与 adapter 总体事项，需要独立 Case。"
          },
          {
            "ref": "project-gap:GAP-security-real-project-validation",
            "source": "persisted",
            "eligibility": "case_required",
            "disposition": "deferred",
            "priority_basis": {
              "blocking": "不直接阻塞当前边界定义。",
              "uncertainty": "medium",
              "risk": "high",
              "user_impact": "间接。"
            },
            "reason": "属于真实权限项目安全验证，需要独立 Case。"
          },
          {
            "ref": "project-gap:GAP-cross-record-audit",
            "source": "persisted",
            "eligibility": "case_required",
            "disposition": "deferred",
            "priority_basis": {
              "blocking": "不直接建立编辑待办产品转移语义。",
              "uncertainty": "medium",
              "risk": "high",
              "user_impact": "间接。"
            },
            "reason": "属于跨记录审计，需要独立 Case。"
          },
          {
            "ref": "case-gap:CASE-20260825-007:GAP-ESTABLISH-WORK-PRODUCT-REASSIGNMENT-BOUNDARY",
            "source": "persisted",
            "eligibility": "ready",
            "disposition": "selected",
            "priority_basis": {
              "blocking": "阻塞正确实现。",
              "uncertainty": "现有服务 mutation 能力与投影迁移边界需要核实。",
              "risk": "半实现会造成远端真相、本地投影与 Automation lane 不一致。",
              "user_impact": "直接影响多项目用户纠正错误归属。"
            },
            "reason": "唯一 ready Case Gap，直接服务当前用户意图，并能通过源码证据与稳定文档完成。"
          }
        ]
      },
      "selected_gap": {
        "id": "GAP-ESTABLISH-WORK-PRODUCT-REASSIGNMENT-BOUNDARY",
        "responsibility": "agent",
        "goal": "查明并建立 Work 编辑待办跨产品重归属的端到端产品语义、技术边界和可验证验收口径。",
        "reason": "直接实现 UI 前必须确认 Workshop mutation 是否允许修改任务所属产品，以及迁移如何影响登录代际分区的 Task Projection、当前选择和活动 Automation execution；这些结论会改变实现范围和验收方式。",
        "derived_from": [
          "FACT-WORK-EDIT-PRODUCT-REASSIGNMENT"
        ],
        "blocked_by": [],
        "priority_basis": {
          "blocking": "阻塞正确实现，避免只增加选择控件却无法可靠迁移归属。",
          "uncertainty": "Workshop mutation、投影迁移和活动 execution 的现有边界尚未核实。",
          "risk": "半实现可能造成远端真相、本地投影与 Automation lane 不一致。",
          "user_impact": "多项目用户无法纠正高频误归属，可能继续在错误产品推进待办。"
        },
        "evidence_required": [
          "现有 Work 编辑表单、main-process mutation、Workshop adapter、Task Projection 与 Automation 消费边界的可追溯代码证据。",
          "明确产品切换提交、成功刷新、失败回滚以及活动 execution 处理方式的持久产品、交互和技术预期。",
          "能够指导后续实现与验证的端到端验收口径。"
        ]
      },
      "planned_transition": {
        "goal": "核实现有端到端 mutation 边界，并把编辑待办跨产品转移的稳定产品、交互、技术和验收语义写入权威文档。",
        "expected_state_change": "产品转移语义与技术边界变得明确可恢复；当前外部契约缺口成为新的显式 Gap。"
      },
      "accepted_state_delta": {
        "resolved_gap": {
          "id": "GAP-ESTABLISH-WORK-PRODUCT-REASSIGNMENT-BOUNDARY",
          "status": "resolved",
          "outcome": "established",
          "reason": "产品、交互、线框、技术架构及验收口径已更新；当前 ArcOrbit 与 Workshop 服务契约限制已有直接源码证据。",
          "evidence": [
            "arckit/spec/agentic-software-development/arcorbit-work-management.md",
            "arckit/interaction/task-browser/interaction.md",
            "arckit/interaction/task-browser/task-form.html",
            "arckit/tech/arcorbit/platform-composition-solution.md",
            "arckit/tech/arcorbit/realtime-synchronization-solution.md",
            "runtime/arcorbit/src/workshop-platform-adapter.mjs:303-305,543-553",
            "runtime/arcorbit/src/work-sync-coordinator.mjs:208-241",
            "runtime/arcorbit/desktop/renderer/renderer.js:2170-2191",
            "/Users/Glare/Library/Developer/ModularProgram/hoewo/workshop-todo/handler/task.go:259-535"
          ]
        },
        "facts_added": [
          {
            "id": "FACT-20260825-007-001",
            "revision": 1,
            "status": "accepted",
            "statement": "当前 ArcOrbit 编辑待办链路不能修改产品归属：Renderer 编辑表单没有产品字段，Platform Adapter 的 updateTask body 不包含 project_id，Workshop UpdateTaskRequest 也不接受或更新 project_id。",
            "basis": "ArcOrbit 与 Workshop Todo 当前源码的直接检查。",
            "evidence": [
              "runtime/arcorbit/desktop/renderer/renderer.js:2170-2191",
              "runtime/arcorbit/src/workshop-platform-adapter.mjs:303-305,543-553",
              "/Users/Glare/Library/Developer/ModularProgram/hoewo/workshop-todo/handler/task.go:259-535"
            ]
          },
          {
            "id": "FACT-20260825-007-002",
            "revision": 1,
            "status": "accepted",
            "statement": "编辑待办支持在当前产品集的可写产品之间切换；切换清空旧产品的执行人、父待办和标签，保留同一 Task 身份、正文、状态、优先级、评论附件及 Run/thread 关联，并通过 Workshop 单次原子 mutation、源/目标项目事件和 Work Sync 双分区提交完成。活动 execution 不阻止切换，确认后由 Automation 安全停止旧 lane 并进入外部变化恢复。",
            "basis": "当前操作者需求、既有 Work/Automation 所有权边界以及已维护的稳定产品、交互和技术规格。",
            "evidence": [
              "Current operator input, 2026-08-25",
              "arckit/spec/agentic-software-development/arcorbit-work-management.md",
              "arckit/interaction/task-browser/interaction.md",
              "arckit/interaction/task-browser/task-form.html",
              "arckit/tech/arcorbit/platform-composition-solution.md",
              "arckit/tech/arcorbit/realtime-synchronization-solution.md"
            ]
          }
        ],
        "facts_superseded": [],
        "impacts_added": [
          {
            "id": "IMPACT-20260825-007-001",
            "fact_id": "FACT-20260825-007-001",
            "fact_revision": 1,
            "target": {
              "kind": "software_decision",
              "ref": "technical_foundation",
              "revision": 34
            },
            "effect": "threatened",
            "reason": "已接受架构要求 Workshop 原子转移和 Work Sync 双分区提交，但当前服务与 Adapter 尚未实现。",
            "gap_ids": [
              "GAP-20260825-007-001"
            ],
            "evidence": [
              "arckit/tech/arcorbit/platform-composition-solution.md",
              "runtime/arcorbit/src/workshop-platform-adapter.mjs:543-553",
              "/Users/Glare/Library/Developer/ModularProgram/hoewo/workshop-todo/handler/task.go:259-535"
            ]
          },
          {
            "id": "IMPACT-20260825-007-002",
            "fact_id": "FACT-20260825-007-001",
            "fact_revision": 1,
            "target": {
              "kind": "software_decision",
              "ref": "external_integrations",
              "revision": 11
            },
            "effect": "threatened",
            "reason": "Workshop Task update 外部契约缺少 project_id、源/目标权限校验和双项目转移事件。",
            "gap_ids": [
              "GAP-20260825-007-001"
            ],
            "evidence": [
              "arckit/tech/arcorbit/realtime-synchronization-solution.md",
              "/Users/Glare/Library/Developer/ModularProgram/hoewo/workshop-todo/handler/task.go:259-535"
            ]
          },
          {
            "id": "IMPACT-20260825-007-003",
            "fact_id": "FACT-WORK-EDIT-PRODUCT-REASSIGNMENT",
            "fact_revision": 1,
            "target": {
              "kind": "software_invariant",
              "ref": "accepted-facts-are-realized",
              "revision": null
            },
            "effect": "threatened",
            "reason": "产品与交互预期已经明确，但实际软件尚不能修改 task.project_id。",
            "gap_ids": [
              "GAP-20260825-007-001"
            ],
            "evidence": [
              "runtime/arcorbit/desktop/renderer/renderer.js:2170-2191",
              "runtime/arcorbit/src/workshop-platform-adapter.mjs:543-553"
            ]
          }
        ],
        "impacts_updated": [
          {
            "id": "IMPACT-WORK-EDIT-PRODUCT-CAPABILITY",
            "fact_id": "FACT-WORK-EDIT-PRODUCT-REASSIGNMENT",
            "fact_revision": 1,
            "target": {
              "kind": "software_decision",
              "ref": "product_capabilities",
              "revision": 29
            },
            "effect": "threatened",
            "reason": "产品能力预期已明确并可恢复，但外部 Workshop 原子转移契约尚未成立，能力未实现。",
            "gap_ids": [
              "GAP-20260825-007-001"
            ],
            "evidence": [
              "arckit/spec/agentic-software-development/arcorbit-work-management.md",
              "runtime/arcorbit/src/workshop-platform-adapter.mjs:543-553"
            ]
          },
          {
            "id": "IMPACT-WORK-EDIT-PRODUCT-INTERACTION",
            "fact_id": "FACT-WORK-EDIT-PRODUCT-REASSIGNMENT",
            "fact_revision": 1,
            "target": {
              "kind": "software_decision",
              "ref": "experience_and_interaction",
              "revision": 44
            },
            "effect": "threatened",
            "reason": "编辑 Sheet 的产品切换、草稿、失败与恢复语义已定义并投影到线框，但生产 Renderer 尚未实现。",
            "gap_ids": [
              "GAP-20260825-007-001"
            ],
            "evidence": [
              "arckit/interaction/task-browser/interaction.md",
              "arckit/interaction/task-browser/task-form.html",
              "runtime/arcorbit/desktop/renderer/renderer.js:2170-2191"
            ]
          }
        ],
        "gaps_added": [
          {
            "id": "GAP-20260825-007-001",
            "status": "open",
            "goal": "扩展并验证 Workshop Task update 的原子产品转移契约，使同一 Task 能在源、目标产品之间安全迁移。",
            "reason": "当前服务和 ArcOrbit Adapter 都不支持在 update 时修改 project_id；没有服务端原子转移、双权限校验和源/目标事件，ArcOrbit 无法可信实现编辑待办切换产品。",
            "derived_from": [
              "FACT-WORK-EDIT-PRODUCT-REASSIGNMENT",
              "FACT-20260825-007-001",
              "FACT-20260825-007-002"
            ],
            "blocked_by": [],
            "priority_basis": {
              "blocking": "完全阻塞生产功能实现与端到端验收。",
              "uncertainty": "外部 Workshop 服务尚未实现已接受契约。",
              "risk": "客户端 copy/delete 会破坏任务身份、评论附件和执行关联。",
              "user_impact": "用户仍无法纠正错误产品归属。"
            },
            "responsibility": "external",
            "evidence_required": [
              "Workshop UpdateTask 接受目标 project_id 与 expected_project_id，并在同一事务校验源修改权和目标写入权。",
              "产品切换时 executor_id、father_id、tags 只能引用目标产品，旧产品关联不会残留。",
              "成功转移保留 Task id、正文、状态、优先级、创建者、时间字段和 TaskAttachment，并同事务写入源项目 transferred-out 与目标项目 transferred-in 事件。",
              "服务端测试覆盖成功、源/目标权限拒绝、预期源产品冲突、关联字段非法和事件写入失败整体回滚。"
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
            "observed_revision": 28,
            "set_decision": {
              "status": "settled",
              "statement": "ArcOrbit 保留既有 Desktop、Runtime、Chat、Automation、Feedback 与 Work 能力和边界。Work 是 Workshop 待办同步与本地 Task Projection 的唯一客户端所有者，并允许在新建、编辑和 Inspector 中修改完整七状态。Work 编辑待办还允许把同一 Task 转移到当前产品集中另一个可写产品；切换清空旧产品限定的执行人、父待办和标签，但保留任务身份、正文、状态、优先级、评论附件及 Run/thread 关联。转移只通过 Work-owned、Workshop 确认的原子 mutation 完成，Automation 仅消费确认后的本地状态。",
              "reason": "接受多项目日常使用中纠正待办错误产品归属的核心能力，同时保持 Work-owned mutation 与 Automation 消费边界。",
              "evidence": [
                "Current operator input, 2026-08-25",
                "arckit/spec/agentic-software-development/arcorbit-work-management.md",
                "arckit/interaction/task-browser/interaction.md"
              ],
              "confidence": "high",
              "resume_condition": "当产品转移的目标范围、Task 身份保留、Workshop mutation 所有权或 Automation 外部变化消费语义改变时重审。"
            },
            "gap_refs": [
              "GAP-agent-scenario-evaluation"
            ],
            "reason": "当前操作者明确要求编辑待办支持切换产品，稳定规格已建立完整边界。",
            "evidence": [
              "Current operator input, 2026-08-25",
              "arckit/spec/agentic-software-development/arcorbit-work-management.md"
            ]
          },
          {
            "area_ref": "experience_and_interaction",
            "observed_revision": 43,
            "set_decision": {
              "status": "settled",
              "statement": "ArcOrbit 保持既有 Personal、Product Lifecycle、Organization 导航与 Work、Automation、Feedback、Chat 等交互语义。Work 编辑 Sheet 显示当前产品集内可写产品；切换产品时清空旧产品限定的执行人、父待办和标签选择，并保留正文、状态及优先级草稿。提交期间锁定当前动作；失败时保留草稿和原 Task 归属，成功后保持同一 Task 身份并刷新源、目标本地投影。活动 Runtime 不隐藏或禁用产品输入；Workshop 确认转移后，Automation 单独安全停止旧 lane 并呈现外部变化恢复。",
              "reason": "接受编辑待办产品纠错的明确输入、反馈、冲突和 Automation 恢复交互。",
              "evidence": [
                "Current operator input, 2026-08-25",
                "arckit/interaction/task-browser/interaction.md",
                "arckit/interaction/task-browser/task-form.html"
              ],
              "confidence": "high",
              "resume_condition": "当编辑产品选择范围、字段清空、提交反馈、活动 execution 恢复或产品转移失败语义改变时重审。"
            },
            "gap_refs": [],
            "reason": "交互源和线框投影已共同建立编辑待办产品切换的主路径与恢复语义。",
            "evidence": [
              "arckit/interaction/task-browser/interaction.md",
              "arckit/interaction/task-browser/task-form.html"
            ]
          }
        ],
        "software_invariant_changes": [],
        "project_gap_changes": [],
        "selection_context_change": null,
        "evidence": [
          "arckit/spec/agentic-software-development/arcorbit-work-management.md",
          "arckit/interaction/task-browser/interaction.md",
          "arckit/interaction/task-browser/task-form.html",
          "arckit/tech/arcorbit/platform-composition-solution.md",
          "arckit/tech/arcorbit/realtime-synchronization-solution.md"
        ]
      },
      "invariant_assessment": {
        "project_revision": 246,
        "judgments": [
          {
            "invariant_ref": "product-expectations-remain-recoverable",
            "disposition": "upheld",
            "reason": "编辑待办跨产品转移的能力、边界、失败行为和验收口径已写入产品事实源。",
            "fact_refs": [
              "FACT-WORK-EDIT-PRODUCT-REASSIGNMENT",
              "FACT-20260825-007-002"
            ],
            "evidence": [
              "arckit/spec/agentic-software-development/arcorbit-work-management.md"
            ],
            "gap_refs": []
          },
          {
            "invariant_ref": "interaction-expectations-remain-recoverable",
            "disposition": "upheld",
            "reason": "产品选择、字段清空、草稿保持、提交反馈、冲突与 Automation 恢复均已写入交互源并同步线框投影。",
            "fact_refs": [
              "FACT-WORK-EDIT-PRODUCT-REASSIGNMENT",
              "FACT-20260825-007-002"
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
            "reason": "本轮复用既有 Sheet、Picker、表单和灰度线框语言，没有建立或修改视觉语言规则。",
            "fact_refs": [],
            "evidence": [],
            "gap_refs": []
          },
          {
            "invariant_ref": "technical-decisions-remain-explainable",
            "disposition": "upheld",
            "reason": "服务端原子转移、双项目事件、Work Sync 双分区提交、迟到响应和 Automation lane 恢复边界均已形成可追溯技术决策，并明确记录当前外部缺口。",
            "fact_refs": [
              "FACT-20260825-007-001",
              "FACT-20260825-007-002"
            ],
            "evidence": [
              "arckit/tech/arcorbit/platform-composition-solution.md",
              "arckit/tech/arcorbit/realtime-synchronization-solution.md",
              "runtime/arcorbit/src/workshop-platform-adapter.mjs:543-553",
              "/Users/Glare/Library/Developer/ModularProgram/hoewo/workshop-todo/handler/task.go:259-535"
            ],
            "gap_refs": []
          },
          {
            "invariant_ref": "accepted-facts-are-realized",
            "disposition": "threatened",
            "reason": "实际 Renderer、Adapter 和 Workshop 服务仍不能修改 task.project_id，尚未兑现已接受产品事实。",
            "fact_refs": [
              "FACT-WORK-EDIT-PRODUCT-REASSIGNMENT",
              "FACT-20260825-007-001"
            ],
            "evidence": [
              "runtime/arcorbit/desktop/renderer/renderer.js:2170-2191",
              "runtime/arcorbit/src/workshop-platform-adapter.mjs:543-553",
              "/Users/Glare/Library/Developer/ModularProgram/hoewo/workshop-todo/handler/task.go:259-535"
            ],
            "gap_refs": [
              "GAP-20260825-007-001"
            ]
          },
          {
            "invariant_ref": "material-risks-have-credible-evidence",
            "disposition": "upheld",
            "reason": "copy/delete 身份破坏、旧产品关联泄漏、双分区不一致和活动 lane 冲突风险均有直接代码证据、明确控制边界与可重复验收要求。",
            "fact_refs": [
              "FACT-20260825-007-001",
              "FACT-20260825-007-002"
            ],
            "evidence": [
              "arckit/tech/arcorbit/platform-composition-solution.md",
              "arckit/tech/arcorbit/realtime-synchronization-solution.md",
              "runtime/arcorbit/src/work-sync-coordinator.mjs:208-241"
            ],
            "gap_refs": []
          }
        ]
      },
      "evidence": [
        "Current operator input, 2026-08-25",
        "arckit/spec/agentic-software-development/arcorbit-work-management.md",
        "arckit/interaction/task-browser/interaction.md",
        "arckit/interaction/task-browser/task-form.html",
        "arckit/tech/arcorbit/platform-composition-solution.md",
        "arckit/tech/arcorbit/realtime-synchronization-solution.md",
        "Validation: task-form structural checks passed; document/index line counts matched; git diff --check passed.",
        "runtime/arcorbit/src/workshop-platform-adapter.mjs:543-553",
        "/Users/Glare/Library/Developer/ModularProgram/hoewo/workshop-todo/handler/task.go:259-535"
      ],
      "runtime_result_ref": "arckit-runtime://runs/RUN-20260825-115413808Z-9ab70041",
      "occurred_at": "2026-08-25T12:18:10.220Z"
    },
    {
      "round": 2,
      "transition_schema_version": "arckit-case-transition/v8",
      "goal": "用受控的创建新待办、确认成功后删除旧待办替换原子产品转移方案，并明确复制范围、身份变化、部分失败恢复和 Automation 行为。",
      "outcome": "completed",
      "gap_selection": {
        "mode": "fresh",
        "basis": "Fresh canonical state 显示原子 Workshop 转移 Gap 是唯一 ready Case Gap；当前操作者明确接受复制后删除的新方案，使原 Gap 的前提失效，并形成一个可在本轮通过稳定规格和技术边界解决的 fresh Gap。",
        "snapshot_token": "7231f769516822b170c3b972c7fa297a3445fec9caf1ae24eedb3dbb1aa2af9d",
        "selected_ref": "fresh-gap:CASE-20260825-007:GAP-20260825-007-003",
        "comparison_summary": "选择 fresh Gap 建立受控复制/删除契约。现有原子转移 Gap 因产品决策改变而排除；四个 Project Gap 均需独立 Case，且不直接解决当前待办产品纠错事项。",
        "fresh_discovery_summary": "当前 Workshop 与 ArcOrbit 已分别具备创建和删除待办的方法，因此无需等待服务端原子 project_id 转移；但两步操作不具备事务原子性，必须明确顺序、部分成功恢复、身份变化和不可迁移数据。",
        "considered": [
          {
            "ref": "project-gap:GAP-agent-scenario-evaluation",
            "source": "persisted",
            "eligibility": "case_required",
            "disposition": "deferred",
            "priority_basis": {
              "blocking": "不阻塞当前产品重归属方案调整。",
              "uncertainty": "high",
              "risk": "high",
              "user_impact": "间接。"
            },
            "reason": "属于通用 Agent 场景验证，需要独立 Case。"
          },
          {
            "ref": "project-gap:GAP-runtime-resilience-and-adapters",
            "source": "persisted",
            "eligibility": "case_required",
            "disposition": "deferred",
            "priority_basis": {
              "blocking": "不阻塞本轮复制/删除契约定义。",
              "uncertainty": "medium",
              "risk": "high",
              "user_impact": "间接。"
            },
            "reason": "属于 Runtime 韧性与 adapter 总体事项，需要独立 Case。"
          },
          {
            "ref": "project-gap:GAP-security-real-project-validation",
            "source": "persisted",
            "eligibility": "case_required",
            "disposition": "deferred",
            "priority_basis": {
              "blocking": "不直接阻塞当前产品纠错路径。",
              "uncertainty": "medium",
              "risk": "high",
              "user_impact": "间接。"
            },
            "reason": "属于真实权限项目安全验证，需要独立 Case。"
          },
          {
            "ref": "project-gap:GAP-cross-record-audit",
            "source": "persisted",
            "eligibility": "case_required",
            "disposition": "deferred",
            "priority_basis": {
              "blocking": "不直接建立复制/删除语义。",
              "uncertainty": "medium",
              "risk": "high",
              "user_impact": "间接。"
            },
            "reason": "属于跨记录审计，需要独立 Case。"
          },
          {
            "ref": "case-gap:CASE-20260825-007:GAP-20260825-007-001",
            "source": "persisted",
            "eligibility": "ineligible",
            "disposition": "excluded",
            "priority_basis": {
              "blocking": "原本阻塞同一 Task 的原子产品转移。",
              "uncertainty": "外部 Workshop 契约尚未实现。",
              "risk": "继续等待会阻塞已获授权的替代方案。",
              "user_impact": "用户仍无法纠正错误归属。"
            },
            "reason": "当前操作者已接受创建新待办并删除旧待办，不再要求保留同一 Task 身份；原 Gap 的目标不再是当前产品行为的必要条件。"
          },
          {
            "ref": "fresh-gap:CASE-20260825-007:GAP-20260825-007-003",
            "source": "fresh",
            "eligibility": "ready",
            "disposition": "selected",
            "priority_basis": {
              "blocking": "必须先明确两步操作的顺序、身份变化和部分失败恢复，才能安全实现。",
              "uncertainty": "复制字段范围、删除失败和 Automation 关系处理需要重新定界。",
              "risk": "无边界实现可能先删源待办、丢失数据，或在部分成功时产生不可解释状态。",
              "user_impact": "直接决定用户能否尽快纠正待办产品归属。"
            },
            "reason": "用户的新决定直接改变已接受产品事实；本轮可通过现有 create/delete 能力证据和权威文档建立完整可恢复边界。"
          }
        ]
      },
      "selected_gap": {
        "id": "GAP-20260825-007-003",
        "status": "open",
        "goal": "建立编辑待办跨产品重归属的受控复制/删除产品、交互和技术契约。",
        "reason": "操作者接受删除旧待办并复制新待办，推翻了必须保持同一 Task 身份的既有前提；必须在实现前明确安全顺序、复制范围和失败恢复。",
        "derived_from": [
          "FACT-WORK-EDIT-PRODUCT-REASSIGNMENT",
          "current-operator-input-2026-08-25"
        ],
        "blocked_by": [],
        "priority_basis": {
          "blocking": "阻塞替代方案的可信实现。",
          "uncertainty": "两次独立 mutation 的边界和恢复语义需要重新建立。",
          "risk": "先删后建或掩盖部分成功会造成数据丢失或重复待办。",
          "user_impact": "直接影响用户纠正错误产品归属。"
        },
        "responsibility": "agent",
        "evidence_required": [
          "稳定产品规格明确新 Task 身份、复制字段和不迁移数据。",
          "交互规格明确确认、提交顺序、失败保留与部分成功恢复。",
          "技术方案明确 Work-owned create/delete 编排、持久恢复状态和 Automation 外部变化处理。",
          "当前 ArcOrbit createTask/deleteTask 能力的直接代码证据。"
        ],
        "resolution": null
      },
      "planned_transition": {
        "goal": "用受控的创建新待办、确认成功后删除旧待办替换原子产品转移方案，并明确复制范围、身份变化、部分失败恢复和 Automation 行为。",
        "expected_state_change": "原子 Workshop 转移不再是产品阻塞项；复制/删除契约成为新的接受事实，后续工作收敛为 ArcOrbit 客户端实现与跨层验证。"
      },
      "accepted_state_delta": {
        "resolved_gap": {
          "id": "GAP-20260825-007-003",
          "status": "resolved",
          "outcome": "established",
          "reason": "产品、交互、线框和技术方案已统一采用先创建目标待办、服务端确认后再删除源待办的受控替换语义，并明确新身份、非迁移数据及部分成功恢复。",
          "evidence": [
            "arckit/spec/agentic-software-development/arcorbit-work-management.md",
            "arckit/interaction/task-browser/interaction.md",
            "arckit/interaction/task-browser/task-form.html",
            "arckit/tech/arcorbit/platform-composition-solution.md",
            "arckit/tech/arcorbit/realtime-synchronization-solution.md",
            "runtime/arcorbit/src/workshop-platform-adapter.mjs:300-308",
            "runtime/arcorbit/src/work-sync-coordinator.mjs:194-200,244-250"
          ]
        },
        "facts_added": [
          {
            "id": "FACT-20260825-007-003",
            "revision": 1,
            "status": "accepted",
            "statement": "编辑待办切换产品采用受控替换：先在目标产品创建新 Task，服务端确认创建成功后再删除源 Task。新 Task 复制正文、状态和优先级，并使用目标产品内重新选择的执行人、父待办和标签；它获得新的 Task id 和创建元数据，不继承源评论、附件、Run、session、thread、Gate、验收问题或旧详情链接。目标创建失败时源 Task 不变；目标创建成功而源删除失败时保留两个 Task 和恢复状态，允许重试删除源 Task或明确保留两者。",
            "basis": "当前操作者明确接受删除旧待办并复制新待办，以及基于现有 Work/Automation 边界维护的稳定规格。",
            "evidence": [
              "Current operator input, 2026-08-25",
              "arckit/spec/agentic-software-development/arcorbit-work-management.md",
              "arckit/interaction/task-browser/interaction.md",
              "arckit/interaction/task-browser/task-form.html",
              "arckit/tech/arcorbit/platform-composition-solution.md",
              "arckit/tech/arcorbit/realtime-synchronization-solution.md"
            ]
          },
          {
            "id": "FACT-20260825-007-004",
            "revision": 1,
            "status": "accepted",
            "statement": "当前 ArcOrbit Workshop Adapter 与 Work Sync 已分别具备创建和删除待办的方法，可作为受控替换的两个服务端确认阶段；它们尚未被编排成编辑待办切换产品的生产流程。",
            "basis": "当前 ArcOrbit 源码的直接检查。",
            "evidence": [
              "runtime/arcorbit/src/workshop-platform-adapter.mjs:300-308",
              "runtime/arcorbit/src/work-sync-coordinator.mjs:194-200,244-250",
              "runtime/arcorbit/src/platform-coordinator.mjs:442,477,518"
            ]
          }
        ],
        "facts_superseded": [
          {
            "id": "FACT-20260825-007-002",
            "revision": 1,
            "reason": "该事实要求通过 Workshop 原子 mutation 保留同一 Task 身份；当前操作者已明确接受删除源 Task并复制新 Task，因此身份保留和原子转移不再是接受的产品契约。",
            "evidence": [
              "Current operator input, 2026-08-25",
              "arckit/spec/agentic-software-development/arcorbit-work-management.md",
              "arckit/tech/arcorbit/platform-composition-solution.md"
            ]
          }
        ],
        "impacts_added": [],
        "impacts_updated": [
          {
            "id": "IMPACT-WORK-EDIT-PRODUCT-CAPABILITY",
            "fact_id": "FACT-WORK-EDIT-PRODUCT-REASSIGNMENT",
            "fact_revision": 1,
            "target": {
              "kind": "software_decision",
              "ref": "product_capabilities",
              "revision": 30
            },
            "effect": "threatened",
            "reason": "产品能力已改为受控复制/删除，但生产 Work 尚未编排目标创建、源删除和部分成功恢复。",
            "gap_ids": [
              "GAP-20260825-007-002"
            ],
            "evidence": [
              "arckit/spec/agentic-software-development/arcorbit-work-management.md",
              "runtime/arcorbit/src/work-sync-coordinator.mjs:194-200,244-250"
            ]
          },
          {
            "id": "IMPACT-WORK-EDIT-PRODUCT-INTERACTION",
            "fact_id": "FACT-WORK-EDIT-PRODUCT-REASSIGNMENT",
            "fact_revision": 1,
            "target": {
              "kind": "software_decision",
              "ref": "experience_and_interaction",
              "revision": 45
            },
            "effect": "threatened",
            "reason": "确认、新 Task 身份提示、两阶段反馈和部分成功恢复已定义并投影到线框，但生产 Renderer 尚未实现。",
            "gap_ids": [
              "GAP-20260825-007-002"
            ],
            "evidence": [
              "arckit/interaction/task-browser/interaction.md",
              "arckit/interaction/task-browser/task-form.html",
              "runtime/arcorbit/desktop/renderer/renderer.js:2170-2191"
            ]
          },
          {
            "id": "IMPACT-20260825-007-001",
            "fact_id": "FACT-20260825-007-001",
            "fact_revision": 1,
            "target": {
              "kind": "software_decision",
              "ref": "technical_foundation",
              "revision": 34
            },
            "effect": "threatened",
            "reason": "技术基础不再依赖 Workshop 原子 project_id 转移，但 Work Sync 尚未实现受控 create/delete 编排、持久部分成功状态和恢复命令。",
            "gap_ids": [
              "GAP-20260825-007-002"
            ],
            "evidence": [
              "arckit/tech/arcorbit/platform-composition-solution.md",
              "runtime/arcorbit/src/work-sync-coordinator.mjs:194-200,244-250"
            ]
          },
          {
            "id": "IMPACT-20260825-007-002",
            "fact_id": "FACT-20260825-007-001",
            "fact_revision": 1,
            "target": {
              "kind": "software_decision",
              "ref": "external_integrations",
              "revision": 11
            },
            "effect": "upheld",
            "reason": "选择的产品行为只要求 Workshop 已有的独立创建与删除契约；不再要求 updateTask 支持 project_id、双产品原子事务或转移事件。",
            "gap_ids": [],
            "evidence": [
              "arckit/tech/arcorbit/platform-composition-solution.md",
              "arckit/tech/arcorbit/realtime-synchronization-solution.md",
              "runtime/arcorbit/src/workshop-platform-adapter.mjs:300-308"
            ]
          },
          {
            "id": "IMPACT-20260825-007-003",
            "fact_id": "FACT-WORK-EDIT-PRODUCT-REASSIGNMENT",
            "fact_revision": 1,
            "target": {
              "kind": "software_invariant",
              "ref": "accepted-facts-are-realized",
              "revision": null
            },
            "effect": "threatened",
            "reason": "接受的复制/删除产品纠错行为尚未在 Renderer、Work Sync 和 Automation 恢复链路中实现。",
            "gap_ids": [
              "GAP-20260825-007-002"
            ],
            "evidence": [
              "runtime/arcorbit/desktop/renderer/renderer.js:2170-2191",
              "runtime/arcorbit/src/work-sync-coordinator.mjs:194-200,244-250"
            ]
          }
        ],
        "gaps_added": [
          {
            "id": "GAP-20260825-007-002",
            "status": "open",
            "goal": "实现并验证 ArcOrbit Work 编辑待办的受控复制/删除产品重归属流程。",
            "reason": "稳定契约和现有独立 create/delete 能力已经成立，但 Renderer、IPC、Platform Coordinator、Work Sync、投影恢复和 Automation 外部变化处理尚未组成生产能力。",
            "derived_from": [
              "FACT-WORK-EDIT-PRODUCT-REASSIGNMENT",
              "FACT-20260825-007-003",
              "FACT-20260825-007-004"
            ],
            "blocked_by": [],
            "priority_basis": {
              "blocking": "完全阻塞用户在生产 Work 中切换待办产品。",
              "uncertainty": "跨层编排、重启恢复和 Automation 停止时序尚未实现。",
              "risk": "错误顺序可能丢失源 Task；部分成功处理错误可能产生无法恢复的重复或错误删除。",
              "user_impact": "用户当前仍无法在编辑页面完成产品纠错。"
            },
            "responsibility": "agent",
            "evidence_required": [
              "Renderer、typed IPC、Platform Coordinator 与 Work Sync 实现产品选择及 create-then-delete 编排。",
              "测试证明目标创建确认前绝不删除源 Task。",
              "测试覆盖目标创建失败、源删除失败、重启恢复、重试删除和明确保留两者。",
              "验证复制字段和不迁移数据符合稳定规格，并证明源删除确认后 Automation 安全停止旧 execution，目标 Task 不继承旧执行关系。"
            ],
            "resolution": null
          }
        ],
        "gaps_cancelled": [
          {
            "id": "GAP-20260825-007-001",
            "status": "cancelled",
            "outcome": "superseded_by_controlled_replacement",
            "reason": "操作者已接受新建目标 Task 并删除源 Task，不再要求 Workshop 原子修改 project_id 或保留同一 Task 身份；该外部契约不再阻塞当前产品能力。",
            "evidence": [
              "Current operator input, 2026-08-25",
              "arckit/spec/agentic-software-development/arcorbit-work-management.md",
              "arckit/tech/arcorbit/platform-composition-solution.md"
            ]
          }
        ],
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
            "observed_revision": 29,
            "set_decision": {
              "status": "settled",
              "statement": "ArcOrbit 保留既有 Desktop、Runtime、Chat、Automation、Feedback 与 Work 能力和边界。Work 是 Workshop 待办同步与本地 Task Projection 的唯一客户端所有者，并允许在新建、编辑和 Inspector 中修改完整七状态。Work 编辑待办允许把内容复制到当前产品集内另一个可写产品，并在目标创建获 Workshop 确认后删除源 Task。目标 Task 获得新身份，仅复制正文、状态、优先级及目标产品内重新选择的关联字段，不继承评论、附件、Run、session、thread、Gate 或验收问题。Work 负责两阶段 mutation 和部分成功恢复；Automation 只消费服务器确认后的本地状态。",
              "reason": "接受用户授权的低成本产品纠错方案，同时用创建优先、删除后置和显式恢复控制数据丢失风险。",
              "evidence": [
                "Current operator input, 2026-08-25",
                "arckit/spec/agentic-software-development/arcorbit-work-management.md",
                "arckit/interaction/task-browser/interaction.md"
              ],
              "confidence": "high",
              "resume_condition": "当复制字段范围、Task 身份策略、评论附件迁移、两阶段失败恢复或 Workshop mutation 所有权改变时重审。"
            },
            "gap_refs": [
              "GAP-agent-scenario-evaluation"
            ],
            "reason": "用户明确接受删除旧待办并复制新待办，取代此前必须保持同一 Task 身份的原子转移方案。",
            "evidence": [
              "Current operator input, 2026-08-25",
              "arckit/spec/agentic-software-development/arcorbit-work-management.md"
            ]
          },
          {
            "area_ref": "experience_and_interaction",
            "observed_revision": 44,
            "set_decision": {
              "status": "settled",
              "statement": "ArcOrbit 保持既有 Personal、Product Lifecycle、Organization 导航与 Work、Automation、Feedback、Chat 等交互语义。Work 编辑 Sheet 显示当前产品集内可写产品；切换产品时清空旧产品限定的执行人、父待办和标签选择，并保留正文、状态及优先级草稿。确认界面明确说明将创建新 Task、删除旧 Task、生成新 id，且评论、附件和执行关系不会迁移。提交先创建目标 Task，确认成功后才删除源 Task；创建失败保留源 Task 和草稿，删除失败则显示源、目标 Task及可恢复状态，允许重试删除或明确保留两者。源删除确认后 Automation 安全停止旧 execution；目标 Task 不继承旧 execution。",
              "reason": "让用户清楚理解替换行为和数据边界，并能从两次独立 mutation 的部分成功中恢复。",
              "evidence": [
                "Current operator input, 2026-08-25",
                "arckit/interaction/task-browser/interaction.md",
                "arckit/interaction/task-browser/task-form.html"
              ],
              "confidence": "high",
              "resume_condition": "当确认内容、复制范围、部分成功恢复动作或 Automation 外部变化反馈改变时重审。"
            },
            "gap_refs": [],
            "reason": "交互源和线框已共同建立创建优先、删除后置及部分成功恢复路径。",
            "evidence": [
              "arckit/interaction/task-browser/interaction.md",
              "arckit/interaction/task-browser/task-form.html"
            ]
          }
        ],
        "software_invariant_changes": [],
        "project_gap_changes": [],
        "selection_context_change": null,
        "evidence": [
          "arckit/spec/agentic-software-development/arcorbit-work-management.md",
          "arckit/interaction/task-browser/interaction.md",
          "arckit/interaction/task-browser/task-form.html",
          "arckit/tech/arcorbit/platform-composition-solution.md",
          "arckit/tech/arcorbit/realtime-synchronization-solution.md"
        ]
      },
      "invariant_assessment": {
        "project_revision": 247,
        "judgments": [
          {
            "invariant_ref": "product-expectations-remain-recoverable",
            "disposition": "upheld",
            "reason": "受控复制/删除的能力、复制范围、身份变化、失败行为和验收口径已写入产品事实源。",
            "fact_refs": [
              "FACT-WORK-EDIT-PRODUCT-REASSIGNMENT",
              "FACT-20260825-007-003"
            ],
            "evidence": [
              "arckit/spec/agentic-software-development/arcorbit-work-management.md"
            ],
            "gap_refs": []
          },
          {
            "invariant_ref": "interaction-expectations-remain-recoverable",
            "disposition": "upheld",
            "reason": "确认提示、创建优先、删除后置、草稿保留和部分成功恢复已写入交互源并同步线框。",
            "fact_refs": [
              "FACT-20260825-007-003"
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
            "reason": "本轮只调整既有 Sheet 和确认内容，没有建立或修改视觉语言规则。",
            "fact_refs": [],
            "evidence": [],
            "gap_refs": []
          },
          {
            "invariant_ref": "technical-decisions-remain-explainable",
            "disposition": "upheld",
            "reason": "Work-owned 两阶段编排、持久部分成功状态、投影对账及 Automation 外部变化边界均已形成可追溯技术决策，并由现有 create/delete 方法支撑。",
            "fact_refs": [
              "FACT-20260825-007-003",
              "FACT-20260825-007-004"
            ],
            "evidence": [
              "arckit/tech/arcorbit/platform-composition-solution.md",
              "arckit/tech/arcorbit/realtime-synchronization-solution.md",
              "runtime/arcorbit/src/workshop-platform-adapter.mjs:300-308",
              "runtime/arcorbit/src/work-sync-coordinator.mjs:194-200,244-250"
            ],
            "gap_refs": []
          },
          {
            "invariant_ref": "accepted-facts-are-realized",
            "disposition": "threatened",
            "reason": "受控复制/删除契约已接受，但生产 Renderer、Work Sync 和 Automation 恢复链路尚未实现该能力。",
            "fact_refs": [
              "FACT-WORK-EDIT-PRODUCT-REASSIGNMENT",
              "FACT-20260825-007-003"
            ],
            "evidence": [
              "runtime/arcorbit/desktop/renderer/renderer.js:2170-2191",
              "runtime/arcorbit/src/work-sync-coordinator.mjs:194-200,244-250"
            ],
            "gap_refs": [
              "GAP-20260825-007-002"
            ]
          },
          {
            "invariant_ref": "material-risks-have-credible-evidence",
            "disposition": "upheld",
            "reason": "数据丢失、重复 Task、错误回滚、不可迁移关系和旧 Automation execution 风险均有明确控制顺序、恢复状态与可重复测试要求。",
            "fact_refs": [
              "FACT-20260825-007-003",
              "FACT-20260825-007-004"
            ],
            "evidence": [
              "arckit/spec/agentic-software-development/arcorbit-work-management.md",
              "arckit/tech/arcorbit/platform-composition-solution.md",
              "arckit/tech/arcorbit/realtime-synchronization-solution.md",
              "runtime/arcorbit/src/work-sync-coordinator.mjs:194-200,244-250"
            ],
            "gap_refs": []
          }
        ]
      },
      "evidence": [
        "Current operator input, 2026-08-25",
        "arckit/spec/agentic-software-development/arcorbit-work-management.md",
        "arckit/interaction/task-browser/interaction.md",
        "arckit/interaction/task-browser/task-form.html",
        "arckit/tech/arcorbit/platform-composition-solution.md",
        "arckit/tech/arcorbit/realtime-synchronization-solution.md",
        "runtime/arcorbit/src/workshop-platform-adapter.mjs:300-308",
        "runtime/arcorbit/src/work-sync-coordinator.mjs:194-200,244-250",
        "Validation: affected document index line counts matched; task-form structural checks passed; contradiction search and git diff --check passed."
      ],
      "runtime_result_ref": "arckit-runtime://runs/RUN-20260825-122632377Z-e8286ec4",
      "occurred_at": "2026-08-25T12:36:32.854Z"
    },
    {
      "round": 3,
      "transition_schema_version": "arckit-case-transition/v8",
      "goal": "实现 Renderer、Platform Coordinator、Work Sync、持久化投影和 Automation 恢复组成的受控 create-then-delete 产品重归属流程。",
      "outcome": "completed",
      "gap_selection": {
        "mode": "candidate",
        "basis": "Fresh post-commit snapshot 显示 GAP-20260825-007-002 是当前 Case 唯一 ready Gap，直接阻塞用户在生产 Work 中纠正待办产品归属。",
        "snapshot_token": "13823dd94fca9959942d54d353dfa9b336e40f2cc6e46989fbf1492a953cad51",
        "selected_ref": "case-gap:CASE-20260825-007:GAP-20260825-007-002",
        "comparison_summary": "选择当前 Case 的生产实现 Gap；四个 Project Gap 均需另建 Case，不能直接兑现本次产品重归属能力。",
        "fresh_discovery_summary": "实现检查确认既有 Work 变更事件会触发 Automation 投影恢复：源待办删除后旧 execution 安全停止，新身份的目标待办不会继承旧 execution。未发现需要抢占本轮的新 Gap。",
        "considered": [
          {
            "ref": "project-gap:GAP-agent-scenario-evaluation",
            "source": "persisted",
            "eligibility": "case_required",
            "disposition": "deferred",
            "priority_basis": {
              "blocking": "不阻塞当前产品重归属实现。",
              "uncertainty": "high",
              "risk": "high",
              "user_impact": "间接。"
            },
            "reason": "属于通用 Agent 场景验证，需要独立 Case。"
          },
          {
            "ref": "project-gap:GAP-runtime-resilience-and-adapters",
            "source": "persisted",
            "eligibility": "case_required",
            "disposition": "deferred",
            "priority_basis": {
              "blocking": "不直接阻塞当前 Work 功能。",
              "uncertainty": "medium",
              "risk": "high",
              "user_impact": "间接。"
            },
            "reason": "属于 Runtime 韧性与 adapter 总体事项，需要独立 Case。"
          },
          {
            "ref": "project-gap:GAP-security-real-project-validation",
            "source": "persisted",
            "eligibility": "case_required",
            "disposition": "deferred",
            "priority_basis": {
              "blocking": "不直接阻塞当前受控替换实现。",
              "uncertainty": "medium",
              "risk": "high",
              "user_impact": "间接。"
            },
            "reason": "属于真实权限项目安全验证，需要独立 Case。"
          },
          {
            "ref": "project-gap:GAP-cross-record-audit",
            "source": "persisted",
            "eligibility": "case_required",
            "disposition": "deferred",
            "priority_basis": {
              "blocking": "不直接兑现编辑待办产品纠错能力。",
              "uncertainty": "medium",
              "risk": "high",
              "user_impact": "间接。"
            },
            "reason": "属于跨记录审计，需要独立 Case。"
          },
          {
            "ref": "case-gap:CASE-20260825-007:GAP-20260825-007-002",
            "source": "persisted",
            "eligibility": "ready",
            "disposition": "selected",
            "priority_basis": {
              "blocking": "完全阻塞用户在生产 Work 中切换待办产品。",
              "uncertainty": "跨层编排、重启恢复和 Automation 停止时序需要实现验证。",
              "risk": "错误顺序可能丢失源 Task，错误重试可能重复创建目标 Task。",
              "user_impact": "直接解决多项目用户无法纠正待办归属的问题。"
            },
            "reason": "唯一 ready Case Gap；稳定契约和底层 create/delete 能力已具备，可在当前工作区完整实现并验证。"
          }
        ]
      },
      "selected_gap": {
        "id": "GAP-20260825-007-002",
        "responsibility": "agent",
        "goal": "实现并验证 ArcOrbit Work 编辑待办的受控复制/删除产品重归属流程。",
        "reason": "稳定契约和现有独立 create/delete 能力已经成立，但 Renderer、IPC、Platform Coordinator、Work Sync、投影恢复和 Automation 外部变化处理尚未组成生产能力。",
        "derived_from": [
          "FACT-WORK-EDIT-PRODUCT-REASSIGNMENT",
          "FACT-20260825-007-003",
          "FACT-20260825-007-004"
        ],
        "blocked_by": [],
        "priority_basis": {
          "blocking": "完全阻塞用户在生产 Work 中切换待办产品。",
          "uncertainty": "跨层编排、重启恢复和 Automation 停止时序尚未实现。",
          "risk": "错误顺序可能丢失源 Task；部分成功处理错误可能产生无法恢复的重复或错误删除。",
          "user_impact": "用户当前仍无法在编辑页面完成产品纠错。"
        },
        "evidence_required": [
          "Renderer、typed IPC、Platform Coordinator 与 Work Sync 实现产品选择及 create-then-delete 编排。",
          "测试证明目标创建确认前绝不删除源 Task。",
          "测试覆盖目标创建失败、源删除失败、重启恢复、重试删除和明确保留两者。",
          "验证复制字段和不迁移数据符合稳定规格，并证明源删除确认后 Automation 安全停止旧 execution，目标 Task 不继承旧执行关系。"
        ]
      },
      "planned_transition": {
        "goal": "实现 Renderer、Platform Coordinator、Work Sync、持久化投影和 Automation 恢复组成的受控 create-then-delete 产品重归属流程。",
        "expected_state_change": "用户可在编辑待办时选择目标产品；目标创建、源删除、部分成功恢复和旧 execution 停止均由生产代码与测试兑现，当前实现 Gap 得以解决。"
      },
      "accepted_state_delta": {
        "resolved_gap": {
          "id": "GAP-20260825-007-002",
          "status": "resolved",
          "outcome": "implemented_and_verified",
          "reason": "产品选择、显式确认、受限跨层命令、目标创建优先、源删除后置、持久部分成功状态、重试删除、保留两者和 Automation 外部变化恢复均已实现并通过定向及全量测试。",
          "evidence": [
            "runtime/arcorbit/desktop/renderer/renderer.js",
            "runtime/arcorbit/desktop/renderer/styles.css",
            "runtime/arcorbit/src/desktop/desktop-store.mjs",
            "runtime/arcorbit/src/platform-coordinator.mjs",
            "runtime/arcorbit/src/work-sync-coordinator.mjs",
            "runtime/arcorbit/test/work-sync-coordinator.test.mjs",
            "runtime/arcorbit/test/platform-coordinator.test.mjs",
            "runtime/arcorbit/test/desktop-store.test.mjs",
            "runtime/arcorbit/test/desktop-renderer.test.mjs",
            "runtime/arcorbit/test/automation-coordinator.test.mjs",
            "Validation: targeted affected suite — 140 passed, 0 failed.",
            "Validation: full node test suite — 421 tests completed with exit code 0.",
            "Validation: production JavaScript syntax checks, real Electron experience fixture, and git diff --check passed."
          ]
        },
        "facts_added": [
          {
            "id": "FACT-20260825-007-005",
            "revision": 1,
            "status": "accepted",
            "statement": "ArcOrbit Work 已实现编辑待办的受控跨产品替换：Renderer 允许选择当前产品集中的目标产品并明确提示新身份和非迁移数据；Platform Coordinator 只接受受限 typed actions；Work Sync 在目标创建获得 Workshop 确认后才删除源 Task，并持久保存删除失败状态，支持跨重启重试且不重复创建目标 Task，或由用户明确保留两者。源删除投影会使 Automation 安全停止旧 execution，目标 Task 不继承旧执行身份。",
            "basis": "生产源码、跨层测试、完整测试套件和真实 Electron 夹具的直接验证。",
            "evidence": [
              "runtime/arcorbit/desktop/renderer/renderer.js:2181-2227",
              "runtime/arcorbit/src/platform-coordinator.mjs:442-447,524-559",
              "runtime/arcorbit/src/work-sync-coordinator.mjs:208-303",
              "runtime/arcorbit/src/desktop/desktop-store.mjs:229-323",
              "runtime/arcorbit/test/work-sync-coordinator.test.mjs",
              "runtime/arcorbit/test/platform-coordinator.test.mjs",
              "runtime/arcorbit/test/automation-coordinator.test.mjs",
              "Validation: targeted affected suite — 140 passed, 0 failed; full node test suite — 421 tests, exit code 0."
            ]
          }
        ],
        "facts_superseded": [],
        "impacts_added": [],
        "impacts_updated": [
          {
            "id": "IMPACT-WORK-EDIT-PRODUCT-CAPABILITY",
            "fact_id": "FACT-WORK-EDIT-PRODUCT-REASSIGNMENT",
            "fact_revision": 1,
            "target": {
              "kind": "software_decision",
              "ref": "product_capabilities",
              "revision": 30
            },
            "effect": "upheld",
            "reason": "生产 Work 已实现受控创建目标待办、确认后删除源待办以及部分成功恢复，兑现既定产品能力。",
            "gap_ids": [],
            "evidence": [
              "arckit/spec/agentic-software-development/arcorbit-work-management.md",
              "runtime/arcorbit/desktop/renderer/renderer.js",
              "runtime/arcorbit/src/work-sync-coordinator.mjs",
              "runtime/arcorbit/test/work-sync-coordinator.test.mjs"
            ]
          },
          {
            "id": "IMPACT-WORK-EDIT-PRODUCT-INTERACTION",
            "fact_id": "FACT-WORK-EDIT-PRODUCT-REASSIGNMENT",
            "fact_revision": 1,
            "target": {
              "kind": "software_decision",
              "ref": "experience_and_interaction",
              "revision": 45
            },
            "effect": "upheld",
            "reason": "编辑 Sheet 已提供产品选择、新身份与非迁移数据确认、提交反馈，以及删除失败后的重试或保留两者恢复动作。",
            "gap_ids": [],
            "evidence": [
              "arckit/interaction/task-browser/interaction.md",
              "runtime/arcorbit/desktop/renderer/renderer.js",
              "runtime/arcorbit/desktop/renderer/styles.css",
              "runtime/arcorbit/test/desktop-renderer.test.mjs"
            ]
          },
          {
            "id": "IMPACT-20260825-007-001",
            "fact_id": "FACT-20260825-007-001",
            "fact_revision": 1,
            "target": {
              "kind": "software_decision",
              "ref": "technical_foundation",
              "revision": 34
            },
            "effect": "upheld",
            "reason": "Work Sync 已在既有独立 create/delete 服务契约之上实现创建优先的两阶段编排、持久恢复状态和幂等删除重试，无需 Workshop updateTask 修改 project_id。",
            "gap_ids": [],
            "evidence": [
              "arckit/tech/arcorbit/platform-composition-solution.md",
              "runtime/arcorbit/src/desktop/desktop-store.mjs",
              "runtime/arcorbit/src/platform-coordinator.mjs",
              "runtime/arcorbit/src/work-sync-coordinator.mjs",
              "runtime/arcorbit/test/work-sync-coordinator.test.mjs"
            ]
          },
          {
            "id": "IMPACT-20260825-007-003",
            "fact_id": "FACT-WORK-EDIT-PRODUCT-REASSIGNMENT",
            "fact_revision": 1,
            "target": {
              "kind": "software_invariant",
              "ref": "accepted-facts-are-realized",
              "revision": null
            },
            "effect": "upheld",
            "reason": "接受的复制/删除产品纠错行为已在 Renderer、Work Sync、持久化恢复和 Automation 外部变化处理链路中实现并验证。",
            "gap_ids": [],
            "evidence": [
              "runtime/arcorbit/desktop/renderer/renderer.js",
              "runtime/arcorbit/src/work-sync-coordinator.mjs",
              "runtime/arcorbit/test/work-sync-coordinator.test.mjs",
              "runtime/arcorbit/test/automation-coordinator.test.mjs",
              "Validation: full node test suite — 421 tests, exit code 0."
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
          "arckit/spec/agentic-software-development/arcorbit-work-management.md",
          "arckit/interaction/task-browser/interaction.md",
          "arckit/tech/arcorbit/platform-composition-solution.md",
          "arckit/tech/arcorbit/realtime-synchronization-solution.md",
          "runtime/arcorbit/desktop/renderer/renderer.js",
          "runtime/arcorbit/src/work-sync-coordinator.mjs",
          "Validation: targeted affected suite — 140 passed, 0 failed; full node test suite — 421 tests, exit code 0."
        ]
      },
      "invariant_assessment": {
        "project_revision": 248,
        "judgments": [
          {
            "invariant_ref": "product-expectations-remain-recoverable",
            "disposition": "upheld",
            "reason": "受控替换能力、复制范围、新身份、非迁移数据和失败恢复仍由产品规格完整定义，生产实现与其一致。",
            "fact_refs": [
              "FACT-WORK-EDIT-PRODUCT-REASSIGNMENT",
              "FACT-20260825-007-003",
              "FACT-20260825-007-005"
            ],
            "evidence": [
              "arckit/spec/agentic-software-development/arcorbit-work-management.md",
              "runtime/arcorbit/test/work-sync-coordinator.test.mjs"
            ],
            "gap_refs": []
          },
          {
            "invariant_ref": "interaction-expectations-remain-recoverable",
            "disposition": "upheld",
            "reason": "产品选择、显式确认、提交顺序和部分成功恢复均由交互规格与生产 Renderer 共同兑现。",
            "fact_refs": [
              "FACT-20260825-007-003",
              "FACT-20260825-007-005"
            ],
            "evidence": [
              "arckit/interaction/task-browser/interaction.md",
              "arckit/interaction/task-browser/task-form.html",
              "runtime/arcorbit/desktop/renderer/renderer.js",
              "runtime/arcorbit/test/desktop-renderer.test.mjs"
            ],
            "gap_refs": []
          },
          {
            "invariant_ref": "visual-language-remains-consistent",
            "disposition": "not_relevant",
            "reason": "本轮复用既有 Sheet、确认、恢复提示和按钮视觉语言，没有建立或改变持久视觉规则。",
            "fact_refs": [],
            "evidence": [],
            "gap_refs": []
          },
          {
            "invariant_ref": "technical-decisions-remain-explainable",
            "disposition": "upheld",
            "reason": "typed action 边界、创建优先的两阶段编排、持久恢复状态、幂等重试和 Automation 外部变化处理均有直接源码与测试证据。",
            "fact_refs": [
              "FACT-20260825-007-003",
              "FACT-20260825-007-004",
              "FACT-20260825-007-005"
            ],
            "evidence": [
              "arckit/tech/arcorbit/platform-composition-solution.md",
              "arckit/tech/arcorbit/realtime-synchronization-solution.md",
              "runtime/arcorbit/src/desktop/desktop-store.mjs",
              "runtime/arcorbit/src/platform-coordinator.mjs",
              "runtime/arcorbit/src/work-sync-coordinator.mjs",
              "runtime/arcorbit/test/platform-coordinator.test.mjs"
            ],
            "gap_refs": []
          },
          {
            "invariant_ref": "accepted-facts-are-realized",
            "disposition": "upheld",
            "reason": "接受的产品纠错事实已由生产 Renderer、Work Sync、Store、Coordinator 和 Automation 恢复行为实现，定向与全量测试均通过。",
            "fact_refs": [
              "FACT-WORK-EDIT-PRODUCT-REASSIGNMENT",
              "FACT-20260825-007-003",
              "FACT-20260825-007-005"
            ],
            "evidence": [
              "runtime/arcorbit/desktop/renderer/renderer.js",
              "runtime/arcorbit/src/work-sync-coordinator.mjs",
              "runtime/arcorbit/src/desktop/desktop-store.mjs",
              "runtime/arcorbit/test/work-sync-coordinator.test.mjs",
              "runtime/arcorbit/test/automation-coordinator.test.mjs",
              "Validation: full node test suite — 421 tests, exit code 0."
            ],
            "gap_refs": []
          },
          {
            "invariant_ref": "material-risks-have-credible-evidence",
            "disposition": "upheld",
            "reason": "数据丢失、重复创建、删除失败、重启恢复、错误目标关联和旧 execution 继承风险均由受控顺序、输入限制、持久状态和可重复测试覆盖。",
            "fact_refs": [
              "FACT-20260825-007-003",
              "FACT-20260825-007-004",
              "FACT-20260825-007-005"
            ],
            "evidence": [
              "runtime/arcorbit/test/work-sync-coordinator.test.mjs",
              "runtime/arcorbit/test/platform-coordinator.test.mjs",
              "runtime/arcorbit/test/desktop-store.test.mjs",
              "runtime/arcorbit/test/automation-coordinator.test.mjs",
              "Validation: targeted affected suite — 140 passed, 0 failed."
            ],
            "gap_refs": []
          }
        ]
      },
      "evidence": [
        "runtime/arcorbit/desktop/renderer/renderer.js",
        "runtime/arcorbit/desktop/renderer/styles.css",
        "runtime/arcorbit/src/desktop/desktop-store.mjs",
        "runtime/arcorbit/src/platform-coordinator.mjs",
        "runtime/arcorbit/src/work-sync-coordinator.mjs",
        "runtime/arcorbit/test/work-sync-coordinator.test.mjs",
        "runtime/arcorbit/test/platform-coordinator.test.mjs",
        "runtime/arcorbit/test/desktop-store.test.mjs",
        "runtime/arcorbit/test/desktop-renderer.test.mjs",
        "runtime/arcorbit/test/automation-coordinator.test.mjs",
        "Validation: targeted affected suite — 140 passed, 0 failed.",
        "Validation: full node test suite — 421 tests completed with exit code 0.",
        "Validation: real Electron experience fixture and git diff --check passed."
      ],
      "runtime_result_ref": "arckit-runtime://runs/RUN-20260825-122632377Z-e8286ec4",
      "occurred_at": "2026-08-25T12:51:04.418Z"
    },
    {
      "round": 4,
      "transition_schema_version": "arckit-case-transition/v8",
      "goal": "独立审查 content revision 3 的实现正确性、问题解决度、验证可信度、回归风险和最小性。",
      "outcome": "completed",
      "gap_selection": {
        "mode": "candidate",
        "basis": "Fresh post-commit snapshot 显示所有普通 Case Gap 和 impacts 已闭合，content revision 3 的 Completion Review 是当前 Case 唯一 ready candidate。",
        "snapshot_token": "b592e05d2feb0df72508ad8dac5b843011f503ddab7091aea40336a23893c8e9",
        "selected_ref": "case-gap:CASE-20260825-007:CASE-20260825-007:completion-review:1",
        "comparison_summary": "选择当前 Case 的独立完成审查；四个 Project Gap 均需独立 Case，不能替代对当前实现正确性和验证可信度的门禁检查。",
        "fresh_discovery_summary": "审查发现失败交互生命周期遗漏：表单提交立即关闭，目标创建失败只显示 Toast，未保留或重开草稿；源删除失败恢复位于 Inspector 而非保持编辑 Sheet。",
        "considered": [
          {
            "ref": "project-gap:GAP-agent-scenario-evaluation",
            "source": "persisted",
            "eligibility": "case_required",
            "disposition": "deferred",
            "priority_basis": {
              "blocking": "不阻塞当前 Case 完成审查。",
              "uncertainty": "high",
              "risk": "high",
              "user_impact": "间接。"
            },
            "reason": "属于通用 Agent 场景验证，需要独立 Case。"
          },
          {
            "ref": "project-gap:GAP-runtime-resilience-and-adapters",
            "source": "persisted",
            "eligibility": "case_required",
            "disposition": "deferred",
            "priority_basis": {
              "blocking": "不直接替代当前实现完成审查。",
              "uncertainty": "medium",
              "risk": "high",
              "user_impact": "间接。"
            },
            "reason": "属于 Runtime 韧性与 adapter 总体事项，需要独立 Case。"
          },
          {
            "ref": "project-gap:GAP-security-real-project-validation",
            "source": "persisted",
            "eligibility": "case_required",
            "disposition": "deferred",
            "priority_basis": {
              "blocking": "不直接阻塞当前完成审查。",
              "uncertainty": "medium",
              "risk": "high",
              "user_impact": "间接。"
            },
            "reason": "属于真实权限项目安全验证，需要独立 Case。"
          },
          {
            "ref": "project-gap:GAP-cross-record-audit",
            "source": "persisted",
            "eligibility": "case_required",
            "disposition": "deferred",
            "priority_basis": {
              "blocking": "不替代当前实现的五维完成审查。",
              "uncertainty": "medium",
              "risk": "high",
              "user_impact": "间接。"
            },
            "reason": "属于跨记录审计，需要独立 Case。"
          },
          {
            "ref": "case-gap:CASE-20260825-007:CASE-20260825-007:completion-review:1",
            "source": "persisted",
            "eligibility": "ready",
            "disposition": "selected",
            "priority_basis": {
              "blocking": "完成审查是关闭当前 Case 的唯一剩余门禁。",
              "uncertainty": "low",
              "risk": "high",
              "user_impact": "high"
            },
            "reason": "唯一 ready Case candidate；必须独立检查实现正确性、问题解决度、验证可信度、回归风险与最小性。"
          }
        ]
      },
      "selected_gap": {
        "id": "CASE-20260825-007:completion-review:1",
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
        "goal": "独立审查 content revision 3 的实现正确性、问题解决度、验证可信度、回归风险和最小性。",
        "expected_state_change": "记录失败交互生命周期的 Completion Review finding，并由 trusted ledger 在下一 fresh snapshot 派生普通修复 Gap。"
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
            "implementation_correctness": "findings",
            "problem_resolution": "findings",
            "verification_credibility": "findings",
            "regression_risk": "findings",
            "minimality": "clean"
          },
          "findings": [
            {
              "id": "FINDING-20260825-007-001",
              "kind": "omission",
              "statement": "编辑待办提交时，Renderer 在远端 mutation 开始前立即关闭 Sheet；目标 Task 创建失败后仅显示 Toast，没有保存或重开目标产品及全部表单草稿。源删除失败时恢复动作改在 Inspector 展示，也未保持 Sheet 和分步状态。这违反稳定交互中“创建失败保留草稿”和“删除失败时 Sheet 保持打开”的要求；现有 Renderer 测试只检查源码字符串，没有执行这两个失败生命周期。",
              "responsibility": "agent",
              "artifact_refs": [
                "arckit/interaction/task-browser/interaction.md",
                "runtime/arcorbit/desktop/renderer/renderer.js",
                "runtime/arcorbit/test/desktop-renderer.test.mjs"
              ],
              "evidence": [
                "arckit/interaction/task-browser/interaction.md:120-121,216-217,255-257",
                "runtime/arcorbit/desktop/renderer/renderer.js:532-535",
                "runtime/arcorbit/desktop/renderer/renderer.js:2182-2217",
                "runtime/arcorbit/desktop/renderer/renderer.js:2487-2503",
                "runtime/arcorbit/desktop/renderer/renderer.js:3840-3851",
                "runtime/arcorbit/test/desktop-renderer.test.mjs:743-771"
              ]
            }
          ],
          "evidence": [
            "arckit/spec/agentic-software-development/arcorbit-work-management.md:53-73,94-103",
            "arckit/interaction/task-browser/interaction.md:114-123,211-219,251-259",
            "arckit/tech/arcorbit/platform-composition-solution.md:281-285,368-383",
            "runtime/arcorbit/desktop/renderer/renderer.js:532-535,2182-2227,2487-2512,3840-3851",
            "runtime/arcorbit/src/work-sync-coordinator.mjs:208-303",
            "runtime/arcorbit/src/platform-coordinator.mjs:442-447,524-559",
            "runtime/arcorbit/test/work-sync-coordinator.test.mjs:174-322",
            "runtime/arcorbit/test/platform-coordinator.test.mjs:355-409",
            "runtime/arcorbit/test/desktop-renderer.test.mjs:743-771",
            "runtime/arcorbit/test/automation-coordinator.test.mjs:210-239",
            "Validation: focused affected suite completed successfully; git diff --check passed."
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
        "evidence": [
          "arckit/interaction/task-browser/interaction.md",
          "runtime/arcorbit/desktop/renderer/renderer.js",
          "runtime/arcorbit/test/desktop-renderer.test.mjs"
        ]
      },
      "invariant_assessment": {
        "project_revision": 248,
        "judgments": [
          {
            "invariant_ref": "product-expectations-remain-recoverable",
            "disposition": "upheld",
            "reason": "受控替换的产品能力、复制范围、新身份和非迁移数据仍由权威产品规格准确恢复；审查 finding 针对交互实现遗漏，不改变产品规则。",
            "fact_refs": [
              "FACT-WORK-EDIT-PRODUCT-REASSIGNMENT",
              "FACT-20260825-007-003",
              "FACT-20260825-007-005"
            ],
            "evidence": [
              "arckit/spec/agentic-software-development/arcorbit-work-management.md"
            ],
            "gap_refs": []
          },
          {
            "invariant_ref": "interaction-expectations-remain-recoverable",
            "disposition": "upheld",
            "reason": "权威交互文档清楚规定创建失败保留草稿及删除失败保持 Sheet，正因预期可恢复才识别出生产实现偏差。",
            "fact_refs": [
              "FACT-20260825-007-003",
              "FACT-20260825-007-005"
            ],
            "evidence": [
              "arckit/interaction/task-browser/interaction.md:120-121,216-217,255-257"
            ],
            "gap_refs": []
          },
          {
            "invariant_ref": "visual-language-remains-consistent",
            "disposition": "not_relevant",
            "reason": "审查 finding 涉及 Sheet 生命周期和草稿恢复行为，不建立或改变视觉语言规则。",
            "fact_refs": [],
            "evidence": [],
            "gap_refs": []
          },
          {
            "invariant_ref": "technical-decisions-remain-explainable",
            "disposition": "upheld",
            "reason": "Work-owned 两阶段编排、持久恢复、typed action 和 Automation 隔离边界仍有清晰持久技术依据；finding 位于 Renderer 交互状态管理。",
            "fact_refs": [
              "FACT-20260825-007-003",
              "FACT-20260825-007-004",
              "FACT-20260825-007-005"
            ],
            "evidence": [
              "arckit/tech/arcorbit/platform-composition-solution.md",
              "runtime/arcorbit/src/work-sync-coordinator.mjs",
              "runtime/arcorbit/src/platform-coordinator.mjs"
            ],
            "gap_refs": []
          },
          {
            "invariant_ref": "accepted-facts-are-realized",
            "disposition": "upheld",
            "reason": "本轮 Completion Review 不携带 Case 内容变更；沿用 content revision 3 的 accepted realization assessment，同时由 review finding 阻止 Case 关闭并等待下一 fresh-read 派生修复 Gap。",
            "fact_refs": [
              "FACT-WORK-EDIT-PRODUCT-REASSIGNMENT",
              "FACT-20260825-007-003",
              "FACT-20260825-007-005"
            ],
            "evidence": [
              "runtime/arcorbit/src/work-sync-coordinator.mjs",
              "runtime/arcorbit/src/platform-coordinator.mjs",
              "runtime/arcorbit/test/work-sync-coordinator.test.mjs",
              "runtime/arcorbit/test/automation-coordinator.test.mjs"
            ],
            "gap_refs": []
          },
          {
            "invariant_ref": "material-risks-have-credible-evidence",
            "disposition": "upheld",
            "reason": "数据丢失、重复创建和执行身份继承风险仍由服务层测试可信控制；Completion Review 进一步以直接事件时序证据暴露了未被 Renderer 测试覆盖的草稿丢失风险。",
            "fact_refs": [
              "FACT-20260825-007-003",
              "FACT-20260825-007-004",
              "FACT-20260825-007-005"
            ],
            "evidence": [
              "runtime/arcorbit/test/work-sync-coordinator.test.mjs",
              "runtime/arcorbit/test/platform-coordinator.test.mjs",
              "runtime/arcorbit/test/automation-coordinator.test.mjs",
              "runtime/arcorbit/desktop/renderer/renderer.js:532-535,2487-2503,3840-3851"
            ],
            "gap_refs": []
          }
        ]
      },
      "evidence": [
        "arckit/interaction/task-browser/interaction.md:120-121,216-217,255-257",
        "runtime/arcorbit/desktop/renderer/renderer.js:532-535,2182-2227,2487-2503,3840-3851",
        "runtime/arcorbit/src/work-sync-coordinator.mjs:208-303",
        "runtime/arcorbit/test/desktop-renderer.test.mjs:743-771",
        "runtime/arcorbit/test/work-sync-coordinator.test.mjs:174-322",
        "Validation: focused affected suite completed successfully; git diff --check passed."
      ],
      "runtime_result_ref": "arckit-runtime://runs/RUN-20260825-122632377Z-e8286ec4",
      "occurred_at": "2026-08-25T12:55:40.147Z"
    },
    {
      "round": 5,
      "transition_schema_version": "arckit-case-transition/v8",
      "goal": "使编辑待办跨产品替换在远端 mutation 期间保持 Sheet，并以可执行测试证明创建失败草稿保留和删除失败恢复。",
      "outcome": "completed",
      "gap_selection": {
        "mode": "candidate",
        "basis": "当前 Case 的 Completion Review finding 直接阻塞关闭，且已由稳定交互规格和生产 Renderer 证据明确界定；四个 Project Gap 均需另建 Case，不应打断当前审查修复。",
        "snapshot_token": "b1f45e9084f416aead0fce10ef0ecd86382f79bdec6292aa2a5f21bddcf3eac4",
        "selected_ref": "case-gap:CASE-20260825-007:CASE-20260825-007:review-finding:FINDING-20260825-007-001",
        "comparison_summary": "唯一 ready Case Gap 是本 Case 的高阻塞、高风险审查 finding；其余四项均为 case_required Project Gap，暂缓。",
        "fresh_discovery_summary": "工作区检查未发现会改变本轮修复对象、范围或验收方式的新候选。",
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
            "reason": "需要独立 Case 验证通用动态 Gap 选择，不属于当前 Renderer 审查修复。"
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
            "reason": "Runtime resilience 与 adapter 验收需要独立 Case，未阻塞当前 finding。"
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
            "reason": "真实权限项目安全验证需要独立 Case，与本轮 Sheet 生命周期无直接依赖。"
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
            "reason": "跨记录审计虽然高风险高紧迫，但需独立 Case，不能替代当前 Case 的审查修复门禁。"
          },
          {
            "ref": "case-gap:CASE-20260825-007:CASE-20260825-007:review-finding:FINDING-20260825-007-001",
            "source": "persisted",
            "eligibility": "ready",
            "disposition": "selected",
            "priority_basis": {
              "blocking": "high",
              "uncertainty": "",
              "risk": "high",
              "user_impact": "直接影响用户在失败后恢复编辑草稿和安全处理重复 Task。"
            },
            "reason": "该 finding 是当前 Case 唯一 ready Gap，直接阻止 Completion Review 通过。"
          }
        ]
      },
      "selected_gap": {
        "id": "CASE-20260825-007:review-finding:FINDING-20260825-007-001",
        "responsibility": "agent",
        "goal": "Resolve review finding: 编辑待办提交时，Renderer 在远端 mutation 开始前立即关闭 Sheet；目标 Task 创建失败后仅显示 Toast，没有保存或重开目标产品及全部表单草稿。源删除失败时恢复动作改在 Inspector 展示，也未保持 Sheet 和分步状态。这违反稳定交互中“创建失败保留草稿”和“删除失败时 Sheet 保持打开”的要求；现有 Renderer 测试只检查源码字符串，没有执行这两个失败生命周期。",
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
          "arckit/interaction/task-browser/interaction.md",
          "runtime/arcorbit/desktop/renderer/renderer.js",
          "runtime/arcorbit/test/desktop-renderer.test.mjs",
          "arckit/interaction/task-browser/interaction.md:120-121,216-217,255-257",
          "runtime/arcorbit/desktop/renderer/renderer.js:532-535",
          "runtime/arcorbit/desktop/renderer/renderer.js:2182-2217",
          "runtime/arcorbit/desktop/renderer/renderer.js:2487-2503",
          "runtime/arcorbit/desktop/renderer/renderer.js:3840-3851",
          "runtime/arcorbit/test/desktop-renderer.test.mjs:743-771"
        ]
      },
      "planned_transition": {
        "goal": "使编辑待办跨产品替换在远端 mutation 期间保持 Sheet，并以可执行测试证明创建失败草稿保留和删除失败恢复。",
        "expected_state_change": "审查 finding 被修复并关闭；生产 Renderer 与稳定交互一致，Case 返回 review-ready 状态。"
      },
      "accepted_state_delta": {
        "resolved_gap": {
          "id": "CASE-20260825-007:review-finding:FINDING-20260825-007-001",
          "status": "resolved",
          "outcome": "implemented_and_verified",
          "reason": "Renderer 为编辑待办引入受管异步 Sheet 提交：mutation 期间锁定控件；目标创建失败后 Sheet 保持打开且所有字段恢复可编辑；源删除失败后同一 Sheet 显示源、目标 Task ID，并提供幂等重试删除或保留两者；成功后关闭 Sheet并切换到目标产品。真实 Electron 失败生命周期、受影响跨层套件和完整测试均通过。",
          "evidence": [
            "arckit/interaction/task-browser/interaction.md:120-121,216-217,255-257",
            "runtime/arcorbit/desktop/renderer/renderer.js:535-542,2189-2239,2485-2625",
            "runtime/arcorbit/desktop/renderer/index.html:284-289",
            "runtime/arcorbit/desktop/renderer/styles.css",
            "runtime/arcorbit/test/desktop-renderer.test.mjs:743-778",
            "runtime/arcorbit/test/task-replacement-sheet-electron.test.mjs:11-37",
            "runtime/arcorbit/test/fixtures/task-replacement-sheet-electron.mjs:30-95",
            "Validation: affected cross-layer suite — 141 passed, 0 failed.",
            "Validation: full ArcOrbit Node/Electron suite — 422 passed, exit code 0.",
            "Validation: production JavaScript syntax checks and git diff --check passed."
          ]
        },
        "facts_added": [
          {
            "id": "FACT-20260825-007-006",
            "revision": 1,
            "status": "accepted",
            "statement": "ArcOrbit Work 编辑待办的跨产品替换现在由受管 Sheet 生命周期执行：目标创建失败保留目标产品及全部表单草稿；源删除失败保持 Sheet 并显示源/目标 Task 与恢复动作；幂等重试不会再次创建目标 Task，成功后关闭 Sheet并切换到目标产品。",
            "basis": "生产 Renderer 实现、真实 Electron 失败场景与完整回归套件的直接验证。",
            "evidence": [
              "runtime/arcorbit/desktop/renderer/renderer.js:2189-2239,2517-2625",
              "runtime/arcorbit/desktop/renderer/index.html:284-289",
              "runtime/arcorbit/test/task-replacement-sheet-electron.test.mjs:11-37",
              "Validation: affected cross-layer suite — 141 passed, 0 failed; full suite — 422 passed, exit code 0."
            ]
          }
        ],
        "facts_superseded": [],
        "impacts_added": [],
        "impacts_updated": [
          {
            "id": "IMPACT-WORK-EDIT-PRODUCT-INTERACTION",
            "fact_id": "FACT-WORK-EDIT-PRODUCT-REASSIGNMENT",
            "fact_revision": 1,
            "target": {
              "kind": "software_decision",
              "ref": "experience_and_interaction",
              "revision": 45
            },
            "effect": "upheld",
            "reason": "生产 Sheet 现已兑现创建失败保留草稿、删除失败保持 Sheet、显示分步状态及提供恢复动作的稳定交互要求。",
            "gap_ids": [],
            "evidence": [
              "arckit/interaction/task-browser/interaction.md:120-121,216-217,255-257",
              "runtime/arcorbit/desktop/renderer/renderer.js:2189-2239,2517-2625",
              "runtime/arcorbit/test/task-replacement-sheet-electron.test.mjs:11-37"
            ]
          },
          {
            "id": "IMPACT-20260825-007-003",
            "fact_id": "FACT-WORK-EDIT-PRODUCT-REASSIGNMENT",
            "fact_revision": 1,
            "target": {
              "kind": "software_invariant",
              "ref": "accepted-facts-are-realized",
              "revision": null
            },
            "effect": "upheld",
            "reason": "受控复制/删除能力及其失败恢复现已在 Renderer、Work Sync 和持久恢复链路中完整实现，并由真实 Electron 与跨层测试验证。",
            "gap_ids": [],
            "evidence": [
              "runtime/arcorbit/desktop/renderer/renderer.js:2189-2239,2485-2625",
              "runtime/arcorbit/src/work-sync-coordinator.mjs:208-303",
              "runtime/arcorbit/test/task-replacement-sheet-electron.test.mjs:11-37",
              "runtime/arcorbit/test/work-sync-coordinator.test.mjs:174-322",
              "Validation: full ArcOrbit Node/Electron suite — 422 passed, exit code 0."
            ]
          }
        ],
        "gaps_added": [],
        "gaps_cancelled": [],
        "resolved_open_questions": [],
        "completed_handoffs": [],
        "completion_review_result": null,
        "resolved_review_findings": [
          "FINDING-20260825-007-001"
        ],
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
        "project_revision": 248,
        "judgments": [
          {
            "invariant_ref": "product-expectations-remain-recoverable",
            "disposition": "upheld",
            "reason": "受控替换的能力、新身份、复制范围和非迁移数据未改变，仍由权威产品规格完整恢复；本轮实现与之保持一致。",
            "fact_refs": [
              "FACT-WORK-EDIT-PRODUCT-REASSIGNMENT",
              "FACT-20260825-007-003",
              "FACT-20260825-007-006"
            ],
            "evidence": [
              "arckit/spec/agentic-software-development/arcorbit-work-management.md"
            ],
            "gap_refs": []
          },
          {
            "invariant_ref": "interaction-expectations-remain-recoverable",
            "disposition": "upheld",
            "reason": "创建失败保留草稿、删除失败保持 Sheet、分步状态与恢复动作均由权威交互文档和生产实现共同兑现。",
            "fact_refs": [
              "FACT-20260825-007-003",
              "FACT-20260825-007-005",
              "FACT-20260825-007-006"
            ],
            "evidence": [
              "arckit/interaction/task-browser/interaction.md:120-121,216-217,255-257",
              "runtime/arcorbit/desktop/renderer/renderer.js:2189-2239,2517-2625",
              "runtime/arcorbit/test/task-replacement-sheet-electron.test.mjs:11-37"
            ],
            "gap_refs": []
          },
          {
            "invariant_ref": "visual-language-remains-consistent",
            "disposition": "not_relevant",
            "reason": "本轮复用既有 Sheet、状态提示和按钮视觉语言，没有建立或修改持久视觉规则。",
            "fact_refs": [],
            "evidence": [],
            "gap_refs": []
          },
          {
            "invariant_ref": "technical-decisions-remain-explainable",
            "disposition": "upheld",
            "reason": "Renderer 仅增加受管提交生命周期，继续通过 typed Platform action 调用 Work-owned 两阶段编排；持久恢复和 Automation 隔离边界未改变。",
            "fact_refs": [
              "FACT-20260825-007-003",
              "FACT-20260825-007-004",
              "FACT-20260825-007-005",
              "FACT-20260825-007-006"
            ],
            "evidence": [
              "arckit/tech/arcorbit/platform-composition-solution.md",
              "arckit/tech/arcorbit/realtime-synchronization-solution.md",
              "runtime/arcorbit/desktop/renderer/renderer.js:2189-2239,2485-2625",
              "runtime/arcorbit/src/platform-coordinator.mjs:438-447,527-557",
              "runtime/arcorbit/src/work-sync-coordinator.mjs:208-303"
            ],
            "gap_refs": []
          },
          {
            "invariant_ref": "accepted-facts-are-realized",
            "disposition": "upheld",
            "reason": "接受的产品纠错及失败恢复行为现已由生产 Sheet、Work Sync、持久恢复和 Automation 外部变化链路完整实现。",
            "fact_refs": [
              "FACT-WORK-EDIT-PRODUCT-REASSIGNMENT",
              "FACT-20260825-007-003",
              "FACT-20260825-007-005",
              "FACT-20260825-007-006"
            ],
            "evidence": [
              "runtime/arcorbit/desktop/renderer/renderer.js:2189-2239,2517-2625",
              "runtime/arcorbit/src/work-sync-coordinator.mjs:208-303",
              "runtime/arcorbit/test/task-replacement-sheet-electron.test.mjs:11-37",
              "runtime/arcorbit/test/work-sync-coordinator.test.mjs:174-322",
              "Validation: full ArcOrbit Node/Electron suite — 422 passed, exit code 0."
            ],
            "gap_refs": []
          },
          {
            "invariant_ref": "material-risks-have-credible-evidence",
            "disposition": "upheld",
            "reason": "数据丢失、草稿丢失、重复目标 Task、源删除失败和旧 execution 继承风险均有受控顺序、持久状态及可重复的真实 Renderer/跨层测试证据。",
            "fact_refs": [
              "FACT-20260825-007-003",
              "FACT-20260825-007-004",
              "FACT-20260825-007-005",
              "FACT-20260825-007-006"
            ],
            "evidence": [
              "runtime/arcorbit/test/task-replacement-sheet-electron.test.mjs:11-37",
              "runtime/arcorbit/test/work-sync-coordinator.test.mjs:174-322",
              "runtime/arcorbit/test/platform-coordinator.test.mjs",
              "runtime/arcorbit/test/automation-coordinator.test.mjs",
              "Validation: affected cross-layer suite — 141 passed, 0 failed.",
              "Validation: full ArcOrbit Node/Electron suite — 422 passed, exit code 0."
            ],
            "gap_refs": []
          }
        ]
      },
      "evidence": [
        "arckit/interaction/task-browser/interaction.md:120-121,216-217,255-257",
        "runtime/arcorbit/desktop/renderer/renderer.js:535-542,2189-2239,2485-2625",
        "runtime/arcorbit/desktop/renderer/index.html:284-289",
        "runtime/arcorbit/desktop/renderer/styles.css",
        "runtime/arcorbit/test/desktop-renderer.test.mjs:743-778",
        "runtime/arcorbit/test/task-replacement-sheet-electron.test.mjs:11-37",
        "runtime/arcorbit/test/fixtures/task-replacement-sheet-electron.mjs:30-95",
        "Validation: affected cross-layer suite — 141 passed, 0 failed.",
        "Validation: full ArcOrbit Node/Electron suite — 422 passed, exit code 0.",
        "Validation: syntax checks and git diff --check passed."
      ],
      "runtime_result_ref": "arckit-runtime://runs/RUN-20260825-122632377Z-e8286ec4",
      "occurred_at": "2026-08-25T13:10:16.179Z"
    },
    {
      "round": 6,
      "transition_schema_version": "arckit-case-transition/v8",
      "goal": "独立审查 content revision 4 的实现正确性、问题解决度、验证可信度、回归风险和最小性。",
      "outcome": "completed",
      "gap_selection": {
        "mode": "candidate",
        "basis": "Completion Review 2 是当前 Case 唯一 ready 候选，并直接阻止 Case 完成；四个 Project Gap 均需独立 Case，不能替代当前实现的最终审查。",
        "snapshot_token": "4fd85cfd457adf4ffd7dc333669ff22424118a2a724218954f42d28c42830b8e",
        "selected_ref": "case-gap:CASE-20260825-007:CASE-20260825-007:completion-review:2",
        "comparison_summary": "唯一 ready Case 候选是 content revision 4 的 Completion Review；其余四项均为 case_required Project Gap，暂缓至独立 Case。",
        "fresh_discovery_summary": "对生产实现、稳定规格、测试覆盖和变更范围的独立检查未发现新的 fresh candidate 或审查 finding。",
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
            "reason": "通用动态 Gap 场景验证需要独立 Case，不影响当前实现的 Completion Review。"
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
            "reason": "Runtime resilience 和 adapter 验收需要独立 Case，与当前 Work Sheet 审查没有依赖。"
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
            "reason": "真实权限项目安全验证需要独立 Case，不阻止当前 Case 完成。"
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
            "reason": "跨记录审计虽具有高风险和高紧迫性，但需要独立 Case，不能替代当前 Completion Review。"
          },
          {
            "ref": "case-gap:CASE-20260825-007:CASE-20260825-007:completion-review:2",
            "source": "persisted",
            "eligibility": "ready",
            "disposition": "selected",
            "priority_basis": {
              "blocking": "high",
              "uncertainty": "low",
              "risk": "high",
              "user_impact": "high"
            },
            "reason": "所有普通 Case Gap 与影响均已闭合；该审查是当前 Case 完成前唯一剩余门禁。"
          }
        ]
      },
      "selected_gap": {
        "id": "CASE-20260825-007:completion-review:2",
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
        "goal": "独立审查 content revision 4 的实现正确性、问题解决度、验证可信度、回归风险和最小性。",
        "expected_state_change": "Completion Review 记录 clean 结果，当前 Case 不再有剩余工作并可由 Ledger 完成关闭。"
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
            "arckit/spec/agentic-software-development/arcorbit-work-management.md",
            "arckit/interaction/task-browser/interaction.md:120-121,216-217,255-257",
            "runtime/arcorbit/desktop/renderer/renderer.js:2189-2239,2485-2625",
            "runtime/arcorbit/src/platform-coordinator.mjs:438-447,527-557",
            "runtime/arcorbit/src/work-sync-coordinator.mjs:208-303",
            "runtime/arcorbit/test/task-replacement-sheet-electron.test.mjs:11-37",
            "runtime/arcorbit/test/work-sync-coordinator.test.mjs:174-322",
            "Review rerun: 140 non-Electron affected cross-layer tests passed, 0 failed.",
            "Review rerun: isolated real Electron failure-lifecycle test passed, 1 passed, 0 failed.",
            "Validation: full ArcOrbit Node/Electron suite previously accepted at content revision 4 — 422 passed, exit code 0.",
            "Review validation: production JavaScript syntax checks and git diff --check passed."
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
        "project_revision": 248,
        "judgments": [
          {
            "invariant_ref": "product-expectations-remain-recoverable",
            "disposition": "upheld",
            "reason": "受控替换能力、新 Task 身份、复制范围、非迁移数据与恢复规则保持准确且可由权威产品规格恢复；审查未发现实现改变这些产品语义。",
            "fact_refs": [
              "FACT-WORK-EDIT-PRODUCT-REASSIGNMENT",
              "FACT-20260825-007-003",
              "FACT-20260825-007-006"
            ],
            "evidence": [
              "arckit/spec/agentic-software-development/arcorbit-work-management.md"
            ],
            "gap_refs": []
          },
          {
            "invariant_ref": "interaction-expectations-remain-recoverable",
            "disposition": "upheld",
            "reason": "创建失败保留全部草稿、删除失败保持 Sheet、显示源/目标 Task 和提供两种恢复动作均与稳定交互规格一致，并由真实 Electron 生命周期测试证明。",
            "fact_refs": [
              "FACT-20260825-007-003",
              "FACT-20260825-007-005",
              "FACT-20260825-007-006"
            ],
            "evidence": [
              "arckit/interaction/task-browser/interaction.md:120-121,216-217,255-257",
              "runtime/arcorbit/desktop/renderer/renderer.js:2189-2239,2517-2625",
              "runtime/arcorbit/test/task-replacement-sheet-electron.test.mjs:11-37"
            ],
            "gap_refs": []
          },
          {
            "invariant_ref": "visual-language-remains-consistent",
            "disposition": "not_relevant",
            "reason": "content revision 4 复用既有 Sheet、状态提示、按钮和设计 token，没有建立、修改或冲突于持久视觉语言规则。",
            "fact_refs": [],
            "evidence": [],
            "gap_refs": []
          },
          {
            "invariant_ref": "technical-decisions-remain-explainable",
            "disposition": "upheld",
            "reason": "Renderer 继续只调用受限 typed action；目标创建优先、源删除后置、持久部分成功状态、幂等恢复和 Automation 身份隔离边界均清晰且可追溯。",
            "fact_refs": [
              "FACT-20260825-007-003",
              "FACT-20260825-007-004",
              "FACT-20260825-007-005",
              "FACT-20260825-007-006"
            ],
            "evidence": [
              "arckit/tech/arcorbit/platform-composition-solution.md",
              "arckit/tech/arcorbit/realtime-synchronization-solution.md",
              "runtime/arcorbit/desktop/renderer/renderer.js:2189-2239,2485-2625",
              "runtime/arcorbit/src/platform-coordinator.mjs:438-447,527-557",
              "runtime/arcorbit/src/work-sync-coordinator.mjs:208-303"
            ],
            "gap_refs": []
          },
          {
            "invariant_ref": "accepted-facts-are-realized",
            "disposition": "upheld",
            "reason": "生产 Renderer、Work Sync、Store、Platform Coordinator 与 Automation 链路共同兑现产品纠错和完整失败恢复事实；当前审查未发现实现偏差。",
            "fact_refs": [
              "FACT-WORK-EDIT-PRODUCT-REASSIGNMENT",
              "FACT-20260825-007-003",
              "FACT-20260825-007-005",
              "FACT-20260825-007-006"
            ],
            "evidence": [
              "runtime/arcorbit/desktop/renderer/renderer.js:2189-2239,2517-2625",
              "runtime/arcorbit/src/work-sync-coordinator.mjs:208-303",
              "runtime/arcorbit/test/task-replacement-sheet-electron.test.mjs:11-37",
              "runtime/arcorbit/test/work-sync-coordinator.test.mjs:174-322",
              "Review rerun: 140 non-Electron affected tests and the isolated real Electron lifecycle test passed."
            ],
            "gap_refs": []
          },
          {
            "invariant_ref": "material-risks-have-credible-evidence",
            "disposition": "upheld",
            "reason": "数据丢失、草稿丢失、重复创建、源删除失败、重启恢复和旧 execution 继承风险均由受控顺序、持久状态以及可重复的单元、跨层和真实 Electron 测试覆盖。",
            "fact_refs": [
              "FACT-20260825-007-003",
              "FACT-20260825-007-004",
              "FACT-20260825-007-005",
              "FACT-20260825-007-006"
            ],
            "evidence": [
              "runtime/arcorbit/test/task-replacement-sheet-electron.test.mjs:11-37",
              "runtime/arcorbit/test/work-sync-coordinator.test.mjs:174-322",
              "runtime/arcorbit/test/platform-coordinator.test.mjs",
              "runtime/arcorbit/test/desktop-store.test.mjs",
              "runtime/arcorbit/test/automation-coordinator.test.mjs",
              "Review rerun: affected cross-layer and isolated real Electron tests passed; syntax and diff checks passed.",
              "Validation: full ArcOrbit Node/Electron suite previously accepted at content revision 4 — 422 passed, exit code 0."
            ],
            "gap_refs": []
          }
        ]
      },
      "evidence": [
        "arckit/spec/agentic-software-development/arcorbit-work-management.md",
        "arckit/interaction/task-browser/interaction.md:120-121,216-217,255-257",
        "runtime/arcorbit/desktop/renderer/renderer.js:2189-2239,2485-2625",
        "runtime/arcorbit/src/platform-coordinator.mjs:438-447,527-557",
        "runtime/arcorbit/src/work-sync-coordinator.mjs:208-303",
        "runtime/arcorbit/test/task-replacement-sheet-electron.test.mjs:11-37",
        "runtime/arcorbit/test/work-sync-coordinator.test.mjs:174-322",
        "Review rerun: 140 non-Electron affected tests passed, isolated real Electron test passed.",
        "Validation: full ArcOrbit Node/Electron suite previously accepted — 422 passed, exit code 0.",
        "Review validation: production JavaScript syntax checks and git diff --check passed."
      ],
      "runtime_result_ref": "arckit-runtime://runs/RUN-20260825-122632377Z-e8286ec4",
      "occurred_at": "2026-08-25T13:13:49.731Z"
    }
  ],
  "case_resolution": {
    "status": "resolved",
    "stage": "resolved",
    "satisfied": [
      "GAP-ESTABLISH-WORK-PRODUCT-REASSIGNMENT-BOUNDARY",
      "GAP-20260825-007-001",
      "GAP-20260825-007-003",
      "GAP-20260825-007-002",
      "CASE-20260825-007:review-finding:FINDING-20260825-007-001"
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
    "updated_at": "2026-08-25T13:13:49.731Z"
  }
}
```

## Round Notes

- Case history is canonical in Structured Record.rounds; keep prose notes exceptional.
