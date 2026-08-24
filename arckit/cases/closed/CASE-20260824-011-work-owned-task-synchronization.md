# Work-owned task synchronization

Case: CASE-20260824-011
Status: closed
Artifact Type: mixed
Selected Gap: none
Updated: 2026-08-24T17:42:50.643Z

## User Intent

Make Work the sole owner of Workshop task synchronization and make Automation depend only on Work-maintained local task state.

## Structured Record

```json
{
  "schema_version": "development-case-record/v5",
  "id": "CASE-20260824-011",
  "title": "Work-owned task synchronization",
  "status": "closed",
  "artifact_type": "mixed",
  "created_at": "2026-08-24T16:39:08.240Z",
  "updated_at": "2026-08-24T17:42:50.643Z",
  "user_intent": "Make Work the sole owner of Workshop task synchronization and make Automation depend only on Work-maintained local task state.",
  "expected_outcome": "Work independently subscribes to visible-project realtime events, reconciles REST and server mutations into a trusted local task projection, while Automation observes and acts only through that local projection without direct Workshop reads or synchronization ownership.",
  "project_state_ref": "arckit/project/state.record.json",
  "current_round": {
    "goal": "",
    "selected_gap": null
  },
  "facts": [
    {
      "id": "FACT-WORK-SYNC-OWNERSHIP",
      "revision": 1,
      "status": "accepted",
      "statement": "Work is the sole owner of Workshop task synchronization and the trusted local task projection. Automation depends only on local task state changes published by Work; it does not query Workshop or independently confirm remote task state. Automation task actions enter Work, which owns server synchronization and updates the local projection.",
      "basis": "Explicit operator correction after tracing the current Work status-switch and Automation-scoped realtime implementation.",
      "evidence": [
        "Current operator input, 2026-08-25",
        "runtime/arcorbit/desktop/renderer/renderer.js",
        "runtime/arcorbit/desktop/main.mjs",
        "runtime/arcorbit/src/automation-coordinator.mjs",
        "runtime/arcorbit/src/workshop-realtime-adapter.mjs",
        "arckit/tech/arcorbit/realtime-synchronization-solution.md"
      ]
    },
    {
      "id": "FACT-WORK-SYNC-TECH-CONTRACT",
      "revision": 1,
      "status": "accepted",
      "statement": "Work Sync 位于 Electron main process，是 Workshop 待办 WebSocket、游标、REST 对账、mutation 与本地 Task Projection 的唯一所有者。Work 页面查询和 Automation 控制都只消费该本地投影；Automation 不读取、订阅或确认服务器状态，所有任务动作提交给 Work，由 Work 完成服务器同步后发布本地状态变化。",
      "basis": "用户明确纠正职责边界，并由更新后的 ArcOrbit 技术方案完整定义订阅范围、投影、mutation、恢复和验证边界。",
      "evidence": [
        "Current operator input, 2026-08-25",
        "arckit/tech/arcorbit/realtime-synchronization-solution.md",
        "arckit/tech/arcorbit/platform-composition-solution.md",
        "arckit/tech/arcorbit/solution.md",
        "arckit/tech/arcorbit/desktop-execution-solution.md"
      ]
    },
    {
      "id": "FACT-WORK-SYNC-PRODUCT-CONTRACT",
      "revision": 1,
      "status": "accepted",
      "statement": "Work 页面切换七状态、搜索、筛选、日期或分页时只查询当前登录代际的本地 Task Projection，不请求 Workshop，也不出现由该点击触发的后台刷新。Work Sync 独立负责 WebSocket、补取、REST 对账、mutation 与同步反馈；Automation 只消费 Work 发布的本地待办状态并向 Work 提交任务动作。",
      "basis": "用户明确确认最终职责边界，产品规格、页面交互源和线框投影已统一表达该行为。",
      "evidence": [
        "Current operator input, 2026-08-25",
        "arckit/spec/agentic-software-development/arcorbit-work-management.md",
        "arckit/spec/agentic-software-development/runtime-automation-workspace.md",
        "arckit/spec/agentic-software-development/arcorbit-platform-capabilities.md",
        "arckit/interaction/task-browser/interaction.md",
        "arckit/interaction/task-browser/daily-work.html",
        "arckit/interaction/automation-workspace/interaction.md",
        "arckit/interaction/automation-workspace/default.html"
      ]
    },
    {
      "id": "FACT-20260824-011-001",
      "revision": 1,
      "status": "accepted",
      "statement": "ArcOrbit production code now gives Work sole ownership of Workshop task synchronization, persistent local Task Projection, realtime invalidation, REST reconciliation and task mutations. Work status/filter/search/date/window queries read that projection only. Automation observes Work-published local task state and submits state actions to Work without direct Workshop task reads, WebSocket, cursor or remote-confirmation ownership.",
      "basis": "Production implementation, migration logic, static dependency checks and focused regression tests.",
      "evidence": [
        "runtime/arcorbit/src/work-sync-coordinator.mjs",
        "runtime/arcorbit/src/desktop/desktop-store.mjs",
        "runtime/arcorbit/src/automation-coordinator.mjs",
        "runtime/arcorbit/src/platform-coordinator.mjs",
        "runtime/arcorbit/desktop/main.mjs",
        "runtime/arcorbit/desktop/preload.cjs",
        "runtime/arcorbit/desktop/renderer/renderer.js",
        "runtime/arcorbit/test/work-sync-coordinator.test.mjs",
        "runtime/arcorbit/test/automation-coordinator.test.mjs",
        "runtime/arcorbit/test/platform-coordinator.test.mjs",
        "runtime/arcorbit/test/desktop-store.test.mjs",
        "runtime/arcorbit/test/desktop-renderer.test.mjs",
        "runtime/arcorbit/test/workshop-realtime-adapter.test.mjs",
        "Verification: 129 focused Work/Automation/Store/Realtime/Renderer tests passed",
        "Verification: full suite reached 389 passed, 9 skipped, with only the sandbox-blocked Electron process aborting before assertions",
        "Verification: git diff --check and static ownership searches passed"
      ]
    }
  ],
  "state_impacts": [
    {
      "id": "IMPACT-WORK-SYNC-TECH",
      "fact_id": "FACT-WORK-SYNC-OWNERSHIP",
      "fact_revision": 1,
      "target": {
        "kind": "software_decision",
        "ref": "technical_foundation",
        "revision": 33
      },
      "effect": "upheld",
      "reason": "technical_foundation 与权威技术文档已统一 Work Sync 所有权和 Automation 本地依赖。",
      "gap_ids": [],
      "evidence": [
        "Current operator input, 2026-08-25",
        "arckit/tech/arcorbit/realtime-synchronization-solution.md",
        "arckit/tech/arcorbit/platform-composition-solution.md",
        "arckit/tech/arcorbit/solution.md",
        "arckit/tech/arcorbit/desktop-execution-solution.md"
      ]
    },
    {
      "id": "IMPACT-WORK-SYNC-INVARIANT",
      "fact_id": "FACT-WORK-SYNC-OWNERSHIP",
      "fact_revision": 1,
      "target": {
        "kind": "software_invariant",
        "ref": "technical-decisions-remain-explainable",
        "revision": null
      },
      "effect": "upheld",
      "reason": "所有权、数据流、订阅、mutation、恢复与验证关系已在技术源中完整可恢复。",
      "gap_ids": [],
      "evidence": [
        "Current operator input, 2026-08-25",
        "arckit/tech/arcorbit/realtime-synchronization-solution.md",
        "arckit/tech/arcorbit/platform-composition-solution.md",
        "arckit/tech/arcorbit/solution.md",
        "arckit/tech/arcorbit/desktop-execution-solution.md"
      ]
    },
    {
      "id": "IMPACT-WORK-SYNC-DATA",
      "fact_id": "FACT-WORK-SYNC-TECH-CONTRACT",
      "fact_revision": 1,
      "target": {
        "kind": "software_decision",
        "ref": "data_and_state",
        "revision": 15
      },
      "effect": "upheld",
      "reason": "Project 数据所有权决定现已明确 Work 投影与 Automation 执行状态的分离。",
      "gap_ids": [],
      "evidence": [
        "Current operator input, 2026-08-25",
        "arckit/tech/arcorbit/realtime-synchronization-solution.md",
        "arckit/tech/arcorbit/platform-composition-solution.md",
        "arckit/tech/arcorbit/solution.md",
        "arckit/tech/arcorbit/desktop-execution-solution.md"
      ]
    },
    {
      "id": "IMPACT-WORK-SYNC-INTEGRATION",
      "fact_id": "FACT-WORK-SYNC-TECH-CONTRACT",
      "fact_revision": 1,
      "target": {
        "kind": "software_decision",
        "ref": "external_integrations",
        "revision": 11
      },
      "effect": "upheld",
      "reason": "Workshop Task/realtime 集成已收敛到 Work Sync。",
      "gap_ids": [],
      "evidence": [
        "Current operator input, 2026-08-25",
        "arckit/tech/arcorbit/realtime-synchronization-solution.md",
        "arckit/tech/arcorbit/platform-composition-solution.md",
        "arckit/tech/arcorbit/solution.md",
        "arckit/tech/arcorbit/desktop-execution-solution.md"
      ]
    },
    {
      "id": "IMPACT-WORK-SYNC-OBSERVABILITY",
      "fact_id": "FACT-WORK-SYNC-TECH-CONTRACT",
      "fact_revision": 1,
      "target": {
        "kind": "software_decision",
        "ref": "observability_and_operation",
        "revision": 8
      },
      "effect": "upheld",
      "reason": "同步健康和恢复所有权已归 Work Sync。",
      "gap_ids": [],
      "evidence": [
        "Current operator input, 2026-08-25",
        "arckit/tech/arcorbit/realtime-synchronization-solution.md",
        "arckit/tech/arcorbit/platform-composition-solution.md",
        "arckit/tech/arcorbit/solution.md",
        "arckit/tech/arcorbit/desktop-execution-solution.md"
      ]
    },
    {
      "id": "IMPACT-WORK-SYNC-QUALITY",
      "fact_id": "FACT-WORK-SYNC-TECH-CONTRACT",
      "fact_revision": 1,
      "target": {
        "kind": "software_decision",
        "ref": "quality_and_validation",
        "revision": 11
      },
      "effect": "upheld",
      "reason": "验证决定已要求证明 Work 本地查询和 Automation 无远端依赖。",
      "gap_ids": [],
      "evidence": [
        "Current operator input, 2026-08-25",
        "arckit/tech/arcorbit/realtime-synchronization-solution.md",
        "arckit/tech/arcorbit/platform-composition-solution.md",
        "arckit/tech/arcorbit/solution.md",
        "arckit/tech/arcorbit/desktop-execution-solution.md"
      ]
    },
    {
      "id": "IMPACT-WORK-SYNC-PRODUCT",
      "fact_id": "FACT-WORK-SYNC-TECH-CONTRACT",
      "fact_revision": 1,
      "target": {
        "kind": "software_decision",
        "ref": "product_capabilities",
        "revision": 26
      },
      "effect": "upheld",
      "reason": "产品能力决定和规格已明确 Work 唯一同步所有权与 Automation 本地依赖。",
      "gap_ids": [],
      "evidence": [
        "Current operator input, 2026-08-25",
        "arckit/spec/agentic-software-development/arcorbit-work-management.md",
        "arckit/spec/agentic-software-development/runtime-automation-workspace.md",
        "arckit/spec/agentic-software-development/arcorbit-platform-capabilities.md",
        "arckit/interaction/task-browser/interaction.md",
        "arckit/interaction/task-browser/daily-work.html",
        "arckit/interaction/automation-workspace/interaction.md",
        "arckit/interaction/automation-workspace/default.html"
      ]
    },
    {
      "id": "IMPACT-WORK-SYNC-EXPERIENCE",
      "fact_id": "FACT-WORK-SYNC-TECH-CONTRACT",
      "fact_revision": 1,
      "target": {
        "kind": "software_decision",
        "ref": "experience_and_interaction",
        "revision": 41
      },
      "effect": "upheld",
      "reason": "交互决定和页面源已明确状态/筛选点击只查询本地投影。",
      "gap_ids": [],
      "evidence": [
        "Current operator input, 2026-08-25",
        "arckit/spec/agentic-software-development/arcorbit-work-management.md",
        "arckit/spec/agentic-software-development/runtime-automation-workspace.md",
        "arckit/spec/agentic-software-development/arcorbit-platform-capabilities.md",
        "arckit/interaction/task-browser/interaction.md",
        "arckit/interaction/task-browser/daily-work.html",
        "arckit/interaction/automation-workspace/interaction.md",
        "arckit/interaction/automation-workspace/default.html"
      ]
    },
    {
      "id": "IMPACT-WORK-SYNC-REALIZATION",
      "fact_id": "FACT-20260824-011-001",
      "fact_revision": 1,
      "target": {
        "kind": "software_invariant",
        "ref": "accepted-facts-are-realized",
        "revision": null
      },
      "effect": "upheld",
      "reason": "The accepted Work-owned synchronization facts are realized in the production main-process ownership, durable store and local-only consumers.",
      "gap_ids": [],
      "evidence": [
        "runtime/arcorbit/src/work-sync-coordinator.mjs",
        "runtime/arcorbit/src/desktop/desktop-store.mjs",
        "runtime/arcorbit/src/automation-coordinator.mjs",
        "runtime/arcorbit/src/platform-coordinator.mjs",
        "runtime/arcorbit/desktop/main.mjs",
        "runtime/arcorbit/desktop/preload.cjs",
        "runtime/arcorbit/desktop/renderer/renderer.js",
        "runtime/arcorbit/test/work-sync-coordinator.test.mjs",
        "runtime/arcorbit/test/automation-coordinator.test.mjs",
        "runtime/arcorbit/test/platform-coordinator.test.mjs",
        "runtime/arcorbit/test/desktop-store.test.mjs",
        "runtime/arcorbit/test/desktop-renderer.test.mjs",
        "runtime/arcorbit/test/workshop-realtime-adapter.test.mjs",
        "Verification: 129 focused Work/Automation/Store/Realtime/Renderer tests passed",
        "Verification: full suite reached 389 passed, 9 skipped, with only the sandbox-blocked Electron process aborting before assertions",
        "Verification: git diff --check and static ownership searches passed"
      ]
    },
    {
      "id": "IMPACT-WORK-SYNC-RISK",
      "fact_id": "FACT-20260824-011-001",
      "fact_revision": 1,
      "target": {
        "kind": "software_invariant",
        "ref": "material-risks-have-credible-evidence",
        "revision": null
      },
      "effect": "upheld",
      "reason": "Migration, identity clearing, late-result suppression, mutation conflicts, degraded recovery, local querying and realtime replay are covered by focused tests and static ownership checks.",
      "gap_ids": [],
      "evidence": [
        "runtime/arcorbit/src/work-sync-coordinator.mjs",
        "runtime/arcorbit/src/desktop/desktop-store.mjs",
        "runtime/arcorbit/src/automation-coordinator.mjs",
        "runtime/arcorbit/src/platform-coordinator.mjs",
        "runtime/arcorbit/desktop/main.mjs",
        "runtime/arcorbit/desktop/preload.cjs",
        "runtime/arcorbit/desktop/renderer/renderer.js",
        "runtime/arcorbit/test/work-sync-coordinator.test.mjs",
        "runtime/arcorbit/test/automation-coordinator.test.mjs",
        "runtime/arcorbit/test/platform-coordinator.test.mjs",
        "runtime/arcorbit/test/desktop-store.test.mjs",
        "runtime/arcorbit/test/desktop-renderer.test.mjs",
        "runtime/arcorbit/test/workshop-realtime-adapter.test.mjs",
        "Verification: 129 focused Work/Automation/Store/Realtime/Renderer tests passed",
        "Verification: full suite reached 389 passed, 9 skipped, with only the sandbox-blocked Electron process aborting before assertions",
        "Verification: git diff --check and static ownership searches passed"
      ]
    }
  ],
  "gaps": [
    {
      "id": "GAP-DEFINE-WORK-SYNC-OWNERSHIP",
      "status": "resolved",
      "goal": "Establish the authoritative technical contract in which Work owns visible-project WebSocket/REST synchronization and the trusted local task projection, while Automation consumes only Work-published local task state and routes task actions through Work.",
      "reason": "Current durable technical decisions and implementation assign realtime refresh and server task access to Automation, so implementation cannot be safely changed until the new ownership, data flow, mutation boundary, recovery, and compatibility semantics are explicit.",
      "derived_from": [
        "case_intent",
        "FACT-WORK-SYNC-OWNERSHIP",
        "IMPACT-WORK-SYNC-TECH",
        "IMPACT-WORK-SYNC-INVARIANT"
      ],
      "blocked_by": [],
      "priority_basis": {
        "blocking": "high",
        "uncertainty": "medium",
        "risk": "high",
        "user_impact": "high"
      },
      "responsibility": "agent",
      "evidence_required": [
        "Authoritative arckit/tech documentation defines Work as the only Workshop task synchronization owner and local task projection owner.",
        "The contract defines Workset subscription scope, WebSocket invalidation, REST reconciliation, local projection publication, Automation consumption, task-action routing, conflict/recovery, and identity-change clearing.",
        "Conflicting technical statements are removed or superseded and relevant tech indexes/relations remain coherent."
      ],
      "resolution": {
        "id": "GAP-DEFINE-WORK-SYNC-OWNERSHIP",
        "status": "resolved",
        "outcome": "Work-owned task synchronization 技术契约已经建立。",
        "reason": "四份 ArcOrbit 技术方案及索引/关系投影统一定义 Work Sync 唯一所有权、Automation 本地依赖、mutation 和恢复边界，并通过一致性检查。",
        "evidence": [
          "Current operator input, 2026-08-25",
          "arckit/tech/arcorbit/realtime-synchronization-solution.md",
          "arckit/tech/arcorbit/platform-composition-solution.md",
          "arckit/tech/arcorbit/solution.md",
          "arckit/tech/arcorbit/desktop-execution-solution.md",
          "arckit/tech/INDEX.md",
          "arckit/tech/_map/RELATIONS.md",
          "arckit/tech/_map/feature-matrix.md",
          "Verification: git diff --check passed",
          "Verification: authoritative tech docs contain no Work status-switch remote query or Automation-owned realtime contract"
        ],
        "occurred_at": "2026-08-24T16:56:49.910Z"
      }
    },
    {
      "id": "GAP-ALIGN-WORK-SYNC-PRODUCT-CONTRACT",
      "status": "resolved",
      "goal": "对齐 Work-owned 同步的产品规格与交互契约，移除“状态切换触发后台远端刷新”和“Automation 拥有同步”的稳定表述。",
      "reason": "技术边界已经接受，但现有产品与交互决定仍把 Work 状态切换描述为后台远端刷新，并声称既有 realtime/Automation 边界不变。",
      "derived_from": [
        "FACT-WORK-SYNC-OWNERSHIP",
        "FACT-WORK-SYNC-TECH-CONTRACT"
      ],
      "blocked_by": [],
      "priority_basis": {
        "blocking": "high",
        "uncertainty": "low",
        "risk": "medium",
        "user_impact": "high"
      },
      "responsibility": "agent",
      "evidence_required": [
        "产品规格明确 Work 页面查询只读取本地投影，远端同步由 Work 独立负责。",
        "交互文档移除状态切换后台刷新提示，改为本地查询与 Work Sync 健康/显式同步反馈。",
        "Project product_capabilities 与 experience_and_interaction 决定和新的所有权边界一致。"
      ],
      "resolution": {
        "id": "GAP-ALIGN-WORK-SYNC-PRODUCT-CONTRACT",
        "status": "resolved",
        "outcome": "Work-owned 同步的产品与交互契约已经对齐。",
        "reason": "三个产品规格、两个页面交互源及相关线框、INDEX 和关系投影共同表达本地查询、Work 独占远端同步与 Automation 本地状态依赖，并通过源—投影校验。",
        "evidence": [
          "Current operator input, 2026-08-25",
          "arckit/spec/agentic-software-development/arcorbit-work-management.md",
          "arckit/spec/agentic-software-development/runtime-automation-workspace.md",
          "arckit/spec/agentic-software-development/arcorbit-platform-capabilities.md",
          "arckit/interaction/task-browser/interaction.md",
          "arckit/interaction/task-browser/daily-work.html",
          "arckit/interaction/automation-workspace/interaction.md",
          "arckit/interaction/automation-workspace/default.html",
          "arckit/spec/INDEX.md",
          "arckit/spec/_map/RELATIONS.md",
          "arckit/spec/_map/feature-matrix.md",
          "arckit/interaction/INDEX.md",
          "arckit/interaction/_map/RELATIONS.md",
          "arckit/interaction/_map/feature-matrix.md",
          "Verification: git diff --check passed",
          "Verification: INDEX line counts and interaction state projection checks passed"
        ],
        "occurred_at": "2026-08-24T17:10:15.501Z"
      }
    },
    {
      "id": "GAP-IMPLEMENT-WORK-SYNC-OWNERSHIP",
      "status": "resolved",
      "goal": "在 ArcOrbit 生产代码中实现 Work-owned Task Projection/Realtime/REST/mutation，并让 Automation 只消费本地待办状态。",
      "reason": "当前生产实现仍由 Automation Coordinator 拥有远端任务快照、realtime 失效刷新和状态写回，尚未兑现已接受技术契约。",
      "derived_from": [
        "FACT-WORK-SYNC-OWNERSHIP",
        "FACT-WORK-SYNC-TECH-CONTRACT"
      ],
      "blocked_by": [
        "GAP-ALIGN-WORK-SYNC-PRODUCT-CONTRACT"
      ],
      "priority_basis": {
        "blocking": "high",
        "uncertainty": "medium",
        "risk": "high",
        "user_impact": "high"
      },
      "responsibility": "agent",
      "evidence_required": [
        "Work Sync 维护持久本地任务投影并独占 Workshop Task Source、Realtime Adapter、REST 对账和 mutation。",
        "Work 状态/筛选切换只查询本地投影，且不调用 Workshop。",
        "Automation Coordinator 无 Workshop/realtime 依赖，只订阅本地状态并向 Work 提交动作。",
        "迁移、身份清理、冲突恢复、周期同步与 Electron 回归测试通过。"
      ],
      "resolution": {
        "id": "GAP-IMPLEMENT-WORK-SYNC-OWNERSHIP",
        "status": "resolved",
        "outcome": "Work-owned task synchronization is implemented in ArcOrbit production code.",
        "reason": "A dedicated Work Sync coordinator now owns Workshop task transport and persistent projection; Work queries are local-only and Automation contains no remote task read, realtime, cursor, or confirmation path.",
        "evidence": [
          "runtime/arcorbit/src/work-sync-coordinator.mjs",
          "runtime/arcorbit/src/desktop/desktop-store.mjs",
          "runtime/arcorbit/src/automation-coordinator.mjs",
          "runtime/arcorbit/src/platform-coordinator.mjs",
          "runtime/arcorbit/desktop/main.mjs",
          "runtime/arcorbit/desktop/preload.cjs",
          "runtime/arcorbit/desktop/renderer/renderer.js",
          "runtime/arcorbit/test/work-sync-coordinator.test.mjs",
          "runtime/arcorbit/test/automation-coordinator.test.mjs",
          "runtime/arcorbit/test/platform-coordinator.test.mjs",
          "runtime/arcorbit/test/desktop-store.test.mjs",
          "runtime/arcorbit/test/desktop-renderer.test.mjs",
          "runtime/arcorbit/test/workshop-realtime-adapter.test.mjs",
          "Verification: 129 focused Work/Automation/Store/Realtime/Renderer tests passed",
          "Verification: full suite reached 389 passed, 9 skipped, with only the sandbox-blocked Electron process aborting before assertions",
          "Verification: git diff --check and static ownership searches passed"
        ],
        "occurred_at": "2026-08-24T17:41:28.965Z"
      }
    }
  ],
  "content_revision": 3,
  "completion_review": {
    "status": "clean",
    "policy": {
      "initial_max_cycles": 3,
      "source": "Current operator authorization via $using-arckit, 2026-08-25",
      "snapshotted_at": "2026-08-24T16:39:08.240Z"
    },
    "additional_cycles_authorized": 0,
    "cycle_count": 1,
    "reviewed_content_revision": 3,
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
        "content_revision": 3,
        "dimensions": {
          "implementation_correctness": "clean",
          "problem_resolution": "clean",
          "verification_credibility": "clean",
          "regression_risk": "clean",
          "minimality": "clean"
        },
        "finding_ids": [],
        "evidence": [
          "Current operator input, 2026-08-25",
          "arckit/spec/agentic-software-development/arcorbit-work-management.md",
          "arckit/spec/agentic-software-development/runtime-automation-workspace.md",
          "arckit/interaction/task-browser/interaction.md",
          "arckit/interaction/automation-workspace/interaction.md",
          "arckit/tech/arcorbit/realtime-synchronization-solution.md",
          "arckit/tech/arcorbit/platform-composition-solution.md",
          "runtime/arcorbit/src/work-sync-coordinator.mjs",
          "runtime/arcorbit/src/desktop/desktop-store.mjs",
          "runtime/arcorbit/src/automation-coordinator.mjs",
          "runtime/arcorbit/src/platform-coordinator.mjs",
          "runtime/arcorbit/desktop/main.mjs",
          "runtime/arcorbit/desktop/renderer/renderer.js",
          "runtime/arcorbit/test/work-sync-coordinator.test.mjs",
          "runtime/arcorbit/test/automation-coordinator.test.mjs",
          "runtime/arcorbit/test/platform-coordinator.test.mjs",
          "runtime/arcorbit/test/desktop-store.test.mjs",
          "runtime/arcorbit/test/desktop-renderer.test.mjs",
          "runtime/arcorbit/test/workshop-realtime-adapter.test.mjs",
          "Verification: 129 focused Work/Automation/Store/Realtime/Renderer tests passed",
          "Verification: full suite reached 389 passed, 9 skipped; the sole failure was Electron SIGABRT before assertions under the restricted GUI sandbox",
          "Verification: git diff --check and ownership searches passed"
        ],
        "occurred_at": "2026-08-24T17:42:50.643Z"
      }
    ],
    "evidence": [
      "Current operator input, 2026-08-25",
      "arckit/spec/agentic-software-development/arcorbit-work-management.md",
      "arckit/spec/agentic-software-development/runtime-automation-workspace.md",
      "arckit/interaction/task-browser/interaction.md",
      "arckit/interaction/automation-workspace/interaction.md",
      "arckit/tech/arcorbit/realtime-synchronization-solution.md",
      "arckit/tech/arcorbit/platform-composition-solution.md",
      "runtime/arcorbit/src/work-sync-coordinator.mjs",
      "runtime/arcorbit/src/desktop/desktop-store.mjs",
      "runtime/arcorbit/src/automation-coordinator.mjs",
      "runtime/arcorbit/src/platform-coordinator.mjs",
      "runtime/arcorbit/desktop/main.mjs",
      "runtime/arcorbit/desktop/renderer/renderer.js",
      "runtime/arcorbit/test/work-sync-coordinator.test.mjs",
      "runtime/arcorbit/test/automation-coordinator.test.mjs",
      "runtime/arcorbit/test/platform-coordinator.test.mjs",
      "runtime/arcorbit/test/desktop-store.test.mjs",
      "runtime/arcorbit/test/desktop-renderer.test.mjs",
      "runtime/arcorbit/test/workshop-realtime-adapter.test.mjs",
      "Verification: 129 focused Work/Automation/Store/Realtime/Renderer tests passed",
      "Verification: full suite reached 389 passed, 9 skipped; the sole failure was Electron SIGABRT before assertions under the restricted GUI sandbox",
      "Verification: git diff --check and ownership searches passed"
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
      "goal": "建立并持久化 Work 独占 Workshop 待办同步、本地 Task Projection 与 Automation 本地状态消费的权威技术契约。",
      "outcome": "completed",
      "gap_selection": {
        "mode": "candidate",
        "basis": "Fresh ledger snapshot 中 CASE-011 的技术所有权 Gap 是唯一 ready Case Gap，且直接承接用户最终纠正。",
        "snapshot_token": "3979fcc74f150b6665f9b92c04eed0d29bc65dcf94e56e0f40a113154a529d71",
        "selected_ref": "case-gap:CASE-20260824-011:GAP-DEFINE-WORK-SYNC-OWNERSHIP",
        "comparison_summary": "已比较当前范围内四个 Project Gap 与 CASE-011 Gap；Project Gap 均需独立 Case，本轮选择 Work 同步技术契约。",
        "fresh_discovery_summary": "发现产品/交互契约和生产实现仍不一致，作为本轮新 Gap 持久化，依 one-round closure 不在本轮直接解决。",
        "considered": [
          {
            "ref": "project-gap:GAP-agent-scenario-evaluation",
            "source": "persisted",
            "eligibility": "case_required",
            "disposition": "deferred",
            "priority_basis": {
              "blocking": "none",
              "risk": "deferred"
            },
            "reason": "不阻塞当前 Work 同步所有权技术契约，需要独立 Case。"
          },
          {
            "ref": "project-gap:GAP-runtime-resilience-and-adapters",
            "source": "persisted",
            "eligibility": "case_required",
            "disposition": "deferred",
            "priority_basis": {
              "blocking": "none",
              "risk": "deferred"
            },
            "reason": "处理通用 Runtime 韧性，不替代当前 Workshop Task 所有权决定。"
          },
          {
            "ref": "project-gap:GAP-security-real-project-validation",
            "source": "persisted",
            "eligibility": "case_required",
            "disposition": "deferred",
            "priority_basis": {
              "blocking": "none",
              "risk": "deferred"
            },
            "reason": "需要真实权限项目证据，不是本轮技术契约前置。"
          },
          {
            "ref": "project-gap:GAP-cross-record-audit",
            "source": "persisted",
            "eligibility": "case_required",
            "disposition": "deferred",
            "priority_basis": {
              "blocking": "none",
              "risk": "deferred"
            },
            "reason": "属于跨记录协议审计，需要独立 Case。"
          },
          {
            "ref": "case-gap:CASE-20260824-011:GAP-DEFINE-WORK-SYNC-OWNERSHIP",
            "source": "persisted",
            "eligibility": "ready",
            "disposition": "selected",
            "priority_basis": {
              "blocking": "high",
              "risk": "high"
            },
            "reason": "当前 Case 唯一 ready Gap，直接阻塞产品对齐和生产实现。"
          }
        ]
      },
      "selected_gap": {
        "id": "GAP-DEFINE-WORK-SYNC-OWNERSHIP",
        "responsibility": "agent",
        "goal": "Establish the authoritative technical contract in which Work owns visible-project WebSocket/REST synchronization and the trusted local task projection, while Automation consumes only Work-published local task state and routes task actions through Work.",
        "reason": "Current durable technical decisions and implementation assign realtime refresh and server task access to Automation, so implementation cannot be safely changed until the new ownership, data flow, mutation boundary, recovery, and compatibility semantics are explicit.",
        "derived_from": [
          "case_intent",
          "FACT-WORK-SYNC-OWNERSHIP",
          "IMPACT-WORK-SYNC-TECH",
          "IMPACT-WORK-SYNC-INVARIANT"
        ],
        "blocked_by": [],
        "priority_basis": {
          "blocking": "high",
          "uncertainty": "medium",
          "risk": "high",
          "user_impact": "high"
        },
        "evidence_required": [
          "Authoritative arckit/tech documentation defines Work as the only Workshop task synchronization owner and local task projection owner.",
          "The contract defines Workset subscription scope, WebSocket invalidation, REST reconciliation, local projection publication, Automation consumption, task-action routing, conflict/recovery, and identity-change clearing.",
          "Conflicting technical statements are removed or superseded and relevant tech indexes/relations remain coherent."
        ]
      },
      "planned_transition": {
        "goal": "建立并持久化 Work 独占 Workshop 待办同步、本地 Task Projection 与 Automation 本地状态消费的权威技术契约。",
        "expected_state_change": "技术文档与 Project 技术决定一致；产品/交互对齐和生产实现保留为独立后续 Gap。"
      },
      "accepted_state_delta": {
        "resolved_gap": {
          "id": "GAP-DEFINE-WORK-SYNC-OWNERSHIP",
          "status": "resolved",
          "outcome": "Work-owned task synchronization 技术契约已经建立。",
          "reason": "四份 ArcOrbit 技术方案及索引/关系投影统一定义 Work Sync 唯一所有权、Automation 本地依赖、mutation 和恢复边界，并通过一致性检查。",
          "evidence": [
            "Current operator input, 2026-08-25",
            "arckit/tech/arcorbit/realtime-synchronization-solution.md",
            "arckit/tech/arcorbit/platform-composition-solution.md",
            "arckit/tech/arcorbit/solution.md",
            "arckit/tech/arcorbit/desktop-execution-solution.md",
            "arckit/tech/INDEX.md",
            "arckit/tech/_map/RELATIONS.md",
            "arckit/tech/_map/feature-matrix.md",
            "Verification: git diff --check passed",
            "Verification: authoritative tech docs contain no Work status-switch remote query or Automation-owned realtime contract"
          ]
        },
        "facts_added": [
          {
            "id": "FACT-WORK-SYNC-TECH-CONTRACT",
            "revision": 1,
            "status": "accepted",
            "statement": "Work Sync 位于 Electron main process，是 Workshop 待办 WebSocket、游标、REST 对账、mutation 与本地 Task Projection 的唯一所有者。Work 页面查询和 Automation 控制都只消费该本地投影；Automation 不读取、订阅或确认服务器状态，所有任务动作提交给 Work，由 Work 完成服务器同步后发布本地状态变化。",
            "basis": "用户明确纠正职责边界，并由更新后的 ArcOrbit 技术方案完整定义订阅范围、投影、mutation、恢复和验证边界。",
            "evidence": [
              "Current operator input, 2026-08-25",
              "arckit/tech/arcorbit/realtime-synchronization-solution.md",
              "arckit/tech/arcorbit/platform-composition-solution.md",
              "arckit/tech/arcorbit/solution.md",
              "arckit/tech/arcorbit/desktop-execution-solution.md"
            ]
          }
        ],
        "facts_superseded": [],
        "impacts_added": [
          {
            "id": "IMPACT-WORK-SYNC-DATA",
            "fact_id": "FACT-WORK-SYNC-TECH-CONTRACT",
            "fact_revision": 1,
            "target": {
              "kind": "software_decision",
              "ref": "data_and_state",
              "revision": 15
            },
            "effect": "upheld",
            "reason": "Project 数据所有权决定现已明确 Work 投影与 Automation 执行状态的分离。",
            "gap_ids": [],
            "evidence": [
              "Current operator input, 2026-08-25",
              "arckit/tech/arcorbit/realtime-synchronization-solution.md",
              "arckit/tech/arcorbit/platform-composition-solution.md",
              "arckit/tech/arcorbit/solution.md",
              "arckit/tech/arcorbit/desktop-execution-solution.md"
            ]
          },
          {
            "id": "IMPACT-WORK-SYNC-INTEGRATION",
            "fact_id": "FACT-WORK-SYNC-TECH-CONTRACT",
            "fact_revision": 1,
            "target": {
              "kind": "software_decision",
              "ref": "external_integrations",
              "revision": 11
            },
            "effect": "upheld",
            "reason": "Workshop Task/realtime 集成已收敛到 Work Sync。",
            "gap_ids": [],
            "evidence": [
              "Current operator input, 2026-08-25",
              "arckit/tech/arcorbit/realtime-synchronization-solution.md",
              "arckit/tech/arcorbit/platform-composition-solution.md",
              "arckit/tech/arcorbit/solution.md",
              "arckit/tech/arcorbit/desktop-execution-solution.md"
            ]
          },
          {
            "id": "IMPACT-WORK-SYNC-OBSERVABILITY",
            "fact_id": "FACT-WORK-SYNC-TECH-CONTRACT",
            "fact_revision": 1,
            "target": {
              "kind": "software_decision",
              "ref": "observability_and_operation",
              "revision": 8
            },
            "effect": "upheld",
            "reason": "同步健康和恢复所有权已归 Work Sync。",
            "gap_ids": [],
            "evidence": [
              "Current operator input, 2026-08-25",
              "arckit/tech/arcorbit/realtime-synchronization-solution.md",
              "arckit/tech/arcorbit/platform-composition-solution.md",
              "arckit/tech/arcorbit/solution.md",
              "arckit/tech/arcorbit/desktop-execution-solution.md"
            ]
          },
          {
            "id": "IMPACT-WORK-SYNC-QUALITY",
            "fact_id": "FACT-WORK-SYNC-TECH-CONTRACT",
            "fact_revision": 1,
            "target": {
              "kind": "software_decision",
              "ref": "quality_and_validation",
              "revision": 11
            },
            "effect": "upheld",
            "reason": "验证决定已要求证明 Work 本地查询和 Automation 无远端依赖。",
            "gap_ids": [],
            "evidence": [
              "Current operator input, 2026-08-25",
              "arckit/tech/arcorbit/realtime-synchronization-solution.md",
              "arckit/tech/arcorbit/platform-composition-solution.md",
              "arckit/tech/arcorbit/solution.md",
              "arckit/tech/arcorbit/desktop-execution-solution.md"
            ]
          },
          {
            "id": "IMPACT-WORK-SYNC-PRODUCT",
            "fact_id": "FACT-WORK-SYNC-TECH-CONTRACT",
            "fact_revision": 1,
            "target": {
              "kind": "software_decision",
              "ref": "product_capabilities",
              "revision": 25
            },
            "effect": "threatened",
            "reason": "产品能力决定仍声称既有 realtime/Automation 边界不变。",
            "gap_ids": [
              "GAP-ALIGN-WORK-SYNC-PRODUCT-CONTRACT"
            ],
            "evidence": [
              "Current operator input, 2026-08-25",
              "arckit/project/state.record.json"
            ]
          },
          {
            "id": "IMPACT-WORK-SYNC-EXPERIENCE",
            "fact_id": "FACT-WORK-SYNC-TECH-CONTRACT",
            "fact_revision": 1,
            "target": {
              "kind": "software_decision",
              "ref": "experience_and_interaction",
              "revision": 40
            },
            "effect": "threatened",
            "reason": "交互决定仍要求 Work 状态切换执行后台远端刷新。",
            "gap_ids": [
              "GAP-ALIGN-WORK-SYNC-PRODUCT-CONTRACT"
            ],
            "evidence": [
              "Current operator input, 2026-08-25",
              "arckit/project/state.record.json",
              "arckit/interaction/task-browser/interaction.md"
            ]
          },
          {
            "id": "IMPACT-WORK-SYNC-REALIZATION",
            "fact_id": "FACT-WORK-SYNC-TECH-CONTRACT",
            "fact_revision": 1,
            "target": {
              "kind": "software_invariant",
              "ref": "accepted-facts-are-realized",
              "revision": null
            },
            "effect": "threatened",
            "reason": "生产代码仍由 Automation 拥有任务同步，尚未实现已接受技术事实。",
            "gap_ids": [
              "GAP-IMPLEMENT-WORK-SYNC-OWNERSHIP"
            ],
            "evidence": [
              "runtime/arcorbit/src/automation-coordinator.mjs",
              "runtime/arcorbit/desktop/main.mjs",
              "Current operator input, 2026-08-25",
              "arckit/tech/arcorbit/realtime-synchronization-solution.md",
              "arckit/tech/arcorbit/platform-composition-solution.md",
              "arckit/tech/arcorbit/solution.md",
              "arckit/tech/arcorbit/desktop-execution-solution.md"
            ]
          },
          {
            "id": "IMPACT-WORK-SYNC-RISK",
            "fact_id": "FACT-WORK-SYNC-TECH-CONTRACT",
            "fact_revision": 1,
            "target": {
              "kind": "software_invariant",
              "ref": "material-risks-have-credible-evidence",
              "revision": null
            },
            "effect": "undetermined",
            "reason": "迁移、身份切换、冲突恢复与大列表本地查询尚无实现验证证据。",
            "gap_ids": [
              "GAP-IMPLEMENT-WORK-SYNC-OWNERSHIP"
            ],
            "evidence": [
              "runtime/arcorbit/test/automation-coordinator.test.mjs",
              "runtime/arcorbit/test/workshop-realtime-adapter.test.mjs",
              "Current operator input, 2026-08-25",
              "arckit/tech/arcorbit/realtime-synchronization-solution.md",
              "arckit/tech/arcorbit/platform-composition-solution.md",
              "arckit/tech/arcorbit/solution.md",
              "arckit/tech/arcorbit/desktop-execution-solution.md"
            ]
          }
        ],
        "impacts_updated": [
          {
            "id": "IMPACT-WORK-SYNC-TECH",
            "fact_id": "FACT-WORK-SYNC-OWNERSHIP",
            "fact_revision": 1,
            "target": {
              "kind": "software_decision",
              "ref": "technical_foundation",
              "revision": 33
            },
            "effect": "upheld",
            "reason": "technical_foundation 与权威技术文档已统一 Work Sync 所有权和 Automation 本地依赖。",
            "gap_ids": [],
            "evidence": [
              "Current operator input, 2026-08-25",
              "arckit/tech/arcorbit/realtime-synchronization-solution.md",
              "arckit/tech/arcorbit/platform-composition-solution.md",
              "arckit/tech/arcorbit/solution.md",
              "arckit/tech/arcorbit/desktop-execution-solution.md"
            ]
          },
          {
            "id": "IMPACT-WORK-SYNC-INVARIANT",
            "fact_id": "FACT-WORK-SYNC-OWNERSHIP",
            "fact_revision": 1,
            "target": {
              "kind": "software_invariant",
              "ref": "technical-decisions-remain-explainable",
              "revision": null
            },
            "effect": "upheld",
            "reason": "所有权、数据流、订阅、mutation、恢复与验证关系已在技术源中完整可恢复。",
            "gap_ids": [],
            "evidence": [
              "Current operator input, 2026-08-25",
              "arckit/tech/arcorbit/realtime-synchronization-solution.md",
              "arckit/tech/arcorbit/platform-composition-solution.md",
              "arckit/tech/arcorbit/solution.md",
              "arckit/tech/arcorbit/desktop-execution-solution.md"
            ]
          }
        ],
        "gaps_added": [
          {
            "id": "GAP-ALIGN-WORK-SYNC-PRODUCT-CONTRACT",
            "status": "open",
            "goal": "对齐 Work-owned 同步的产品规格与交互契约，移除“状态切换触发后台远端刷新”和“Automation 拥有同步”的稳定表述。",
            "reason": "技术边界已经接受，但现有产品与交互决定仍把 Work 状态切换描述为后台远端刷新，并声称既有 realtime/Automation 边界不变。",
            "derived_from": [
              "FACT-WORK-SYNC-OWNERSHIP",
              "FACT-WORK-SYNC-TECH-CONTRACT"
            ],
            "blocked_by": [],
            "priority_basis": {
              "blocking": "high",
              "uncertainty": "low",
              "risk": "medium",
              "user_impact": "high"
            },
            "responsibility": "agent",
            "evidence_required": [
              "产品规格明确 Work 页面查询只读取本地投影，远端同步由 Work 独立负责。",
              "交互文档移除状态切换后台刷新提示，改为本地查询与 Work Sync 健康/显式同步反馈。",
              "Project product_capabilities 与 experience_and_interaction 决定和新的所有权边界一致。"
            ],
            "resolution": null
          },
          {
            "id": "GAP-IMPLEMENT-WORK-SYNC-OWNERSHIP",
            "status": "open",
            "goal": "在 ArcOrbit 生产代码中实现 Work-owned Task Projection/Realtime/REST/mutation，并让 Automation 只消费本地待办状态。",
            "reason": "当前生产实现仍由 Automation Coordinator 拥有远端任务快照、realtime 失效刷新和状态写回，尚未兑现已接受技术契约。",
            "derived_from": [
              "FACT-WORK-SYNC-OWNERSHIP",
              "FACT-WORK-SYNC-TECH-CONTRACT"
            ],
            "blocked_by": [
              "GAP-ALIGN-WORK-SYNC-PRODUCT-CONTRACT"
            ],
            "priority_basis": {
              "blocking": "high",
              "uncertainty": "medium",
              "risk": "high",
              "user_impact": "high"
            },
            "responsibility": "agent",
            "evidence_required": [
              "Work Sync 维护持久本地任务投影并独占 Workshop Task Source、Realtime Adapter、REST 对账和 mutation。",
              "Work 状态/筛选切换只查询本地投影，且不调用 Workshop。",
              "Automation Coordinator 无 Workshop/realtime 依赖，只订阅本地状态并向 Work 提交动作。",
              "迁移、身份清理、冲突恢复、周期同步与 Electron 回归测试通过。"
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
            "area_ref": "technical_foundation",
            "observed_revision": 32,
            "set_decision": {
              "status": "settled",
              "statement": "Arckit 继续使用 repository-owned Markdown/JSON state 与 Node.js ESM ledger CLI；ArcOrbit 继续作为 Electron Desktop/Runtime host，并保留 policy-neutral Runtime Kernel、persistent one-thread-per-todo、Platform Coordinator、restricted Workshop adapters、utilityProcess Runtime、trusted in-process ledger entrypoints、project-only skill provisioning、Feedback SDK WebContents 和现代/旧版 realtime 协议边界。真实 Chat 的 accepted architecture 在 main process 增加独立 ChatCoordinator 和 kind=chat Store ownership，并从现有 Codex adapter 中抽取可复用 Conversation 层：app-server client、persistent thread start/resume、turn start/interrupt、通用事件 projector、token usage 和异步 approval provider。State-driven Runtime 只在该基础层之上保留 using-arckit、Agent Loop schema、fresh ledger snapshot、Gap Loop、Automation lease 和 closeout 语义，Chat 不复用这些语义。每个活动 Chat session 拥有与其固定项目根对应的 adapter owner；不同 Chat session 和 Automation owner 不共享活动 turn 或 lease。typed Chat IPC 只提供 snapshot/create/select/rename/delete/send/interrupt/approvalDecision；select 只持久化经 main process 验证的 Chat session 选择，不改变 draft、thread 或 session updated_at。Renderer 不能提供任意 cwd、thread id、Codex method、文件权限或 shell command。Chat 与 Automation Renderer 共享单一 Conversation Surface 模块和 scroll-follow/event-binding 行为，消费者仅提供规范化消息、Composer policy 与回调；Automation 专属类型由左右面板消费。Run Activity 以结构化 gap_rounds 持久化 round selection/closeout/work summary，任务级执行总览跨 transcript Runs 聚合，不解析被截断的消息文本。ArcOrbit Automation Agent 只输出绑定 fresh snapshot 的 Semantic Case Command；Agent 显式决定事实、Gap、影响、Project decision 与 invariant judgment 的业务语义，trusted Ledger Command Materializer 在 commit lock 内确定性分配身份与 revision、解析 local handle、展开反向关系、编译内部 Transition、完整校验 projected state 并原子提交，Runtime 不复制物化规则。Workshop 继续拥有服务端任务事实；Electron main-process Work Sync 是 Workshop 待办同步的唯一客户端所有者，独占 WebSocket、事件游标、REST 对账、受控 mutation 和按登录代际分区的持久 Task Projection Store。Work 页面全部状态、搜索、筛选、日期和分页从本地投影派生，状态切换不发起远端请求；Renderer 使用分页或虚拟化与事件委托约束大列表同步 DOM 成本。Automation 不拥有 Workshop Task Source、Realtime Adapter、REST 或远端确认，只订阅 Work 发布的本地待办状态变化，并把领取、阻塞、完成、取消和验收动作提交给 Work；Work 只在服务器同步成功后更新本地投影。Workshop Task 的唯一文本事实是完整 `content`；ArcOrbit 在共享归一化边界生成最多 64 个 Unicode extended grapheme clusters 的 `display_title`，超限取前 63 个并追加 `…`。该值只服务 Work/Automation/session/Activity/CLI 展示，可保存历史只读快照但不参与搜索、Agent intent、mutation 或服务端写回。",
              "reason": "将 Workshop 任务同步所有权从 Automation/query cache 收敛到 Work Sync，并明确 Automation 本地状态依赖。",
              "evidence": [
                "runtime/arcorbit/desktop/renderer/renderer.js:653-735,1165-1187",
                "runtime/arcorbit/src/platform-coordinator.mjs:61-174",
                "runtime/arcorbit/src/workshop-platform-adapter.mjs:85-100",
                "Controlled Electron latency and scale measurements, 2026-08-24",
                "arckit/tech/arcorbit/platform-composition-solution.md",
                "arckit/spec/agentic-software-development/arcorbit-work-management.md",
                "Current operator input, 2026-08-25",
                "arckit/tech/arcorbit/realtime-synchronization-solution.md",
                "arckit/tech/arcorbit/solution.md",
                "arckit/tech/arcorbit/desktop-execution-solution.md"
              ],
              "confidence": "high",
              "resume_condition": "当 Work Sync 投影边界、订阅范围、Task Source/mutation 所有权或 Automation 本地状态接口变化时重审。"
            },
            "gap_refs": [],
            "reason": "将 Workshop 任务同步所有权从 Automation/query cache 收敛到 Work Sync，并明确 Automation 本地状态依赖。",
            "evidence": [
              "Current operator input, 2026-08-25",
              "arckit/tech/arcorbit/realtime-synchronization-solution.md",
              "arckit/tech/arcorbit/platform-composition-solution.md",
              "arckit/tech/arcorbit/solution.md",
              "arckit/tech/arcorbit/desktop-execution-solution.md"
            ]
          },
          {
            "area_ref": "data_and_state",
            "observed_revision": 14,
            "set_decision": {
              "status": "settled",
              "statement": "Canonical development state 继续位于 Project/Iteration/Case ledger，Workshop 继续拥有账户、组织、项目、成员、任务、附件和普通反馈真相；ArcOrbit 继续拥有 Product Workspace 绑定、Workset、Work Sync 的登录代际/项目分区 Task Projection、realtime cursor、Runtime execution/session/thread、介入恢复、验收反馈和 bundled-skill control-plane state；Automation 只拥有执行控制状态，不保存独立远端任务快照。ArcOrbit 还拥有本地 Chat session、消息、Composer 草稿、选中状态、Product Workspace/规范化项目根归属、Codex thread binding、turn/item 引用和最近运行/恢复状态。Chat 数据不写入 Workshop 或 ledger，不与 Automation task session 合并。删除会话仅移除 ArcOrbit 本地记录和恢复能力，不声明擦除 Codex 可能保留的底层 thread；活动删除必须先完成 interrupt，任一步失败均不得部分删除。",
              "reason": "明确服务端任务事实、Work 本地投影和 Automation 执行控制状态三者的所有权。",
              "evidence": [
                "arckit/spec/agentic-software-development/arcorbit-planned-workspaces.md",
                "arckit/tech/arcorbit/desktop-execution-solution.md",
                "Current operator input, 2026-08-25",
                "arckit/tech/arcorbit/realtime-synchronization-solution.md",
                "arckit/tech/arcorbit/platform-composition-solution.md",
                "arckit/tech/arcorbit/solution.md"
              ],
              "confidence": "high",
              "resume_condition": "当 Task Projection 跨设备同步、身份代际、持久化模型或 Automation 状态所有权变化时重审。"
            },
            "gap_refs": [],
            "reason": "明确服务端任务事实、Work 本地投影和 Automation 执行控制状态三者的所有权。",
            "evidence": [
              "Current operator input, 2026-08-25",
              "arckit/tech/arcorbit/realtime-synchronization-solution.md",
              "arckit/tech/arcorbit/platform-composition-solution.md",
              "arckit/tech/arcorbit/solution.md",
              "arckit/tech/arcorbit/desktop-execution-solution.md"
            ]
          },
          {
            "area_ref": "external_integrations",
            "observed_revision": 10,
            "set_decision": {
              "status": "settled",
              "statement": "ArcOrbit 继续通过显式 main-process adapters 集成 Codex app-server/CLI、Workshop 和 Feedback，并保持 Renderer 无凭据、无通用请求能力。真实 Chat 使用可复用的 Codex Conversation 基础层处理 app-server initialize、persistent thread start/resume、turn start/interrupt、streamed items、token usage 和 approval request；ChatCoordinator 直接提交用户文本，不设置 Agent Loop output schema，也不调用 state-driven Runtime、trusted ledger 或 Automation Coordinator。Workshop Task Source 与 realtime adapter 只服务 main-process Work Sync；Work Sync 负责订阅范围、REST 对账、mutation 和本地投影发布，Automation 不直接集成 Workshop。Feedback V2 和产品反馈 SDK 的既有契约与恢复行为保持不变。 Workshop Feedback SDK 用户端和 Console 开发者端共同定义双向 V2 消息域；ArcOrbit 对 Workset 项目默认探测开发者能力，列表失败回退 V1，单项失败仅降级对应动作，不用安装包 allowlist 隐藏能力。",
              "reason": "把 Workshop 任务与 realtime 集成收敛为 Work Sync 唯一边界。",
              "evidence": [
                "arckit/tech/arcorbit/desktop-execution-solution.md",
                "runtime/arcorbit/src/codex-app-server-adapter.mjs",
                "[Official Codex app-server integration documentation](https://developers.openai.com/codex/app-server)",
                "arckit/tech/arcorbit/platform-composition-solution.md",
                "/Users/Glare/Library/Developer/ModularProgram/hoewo/Workshop-Feedbacks/webapps/feedback-sdk-web/src/components/sdk/FeedbackConversationPanel.tsx",
                "/Users/Glare/Library/Developer/ModularProgram/hoewo/Workshop-Feedbacks/webapps/feedback-console-web/src/components/features/FeedbackConversationPanel.tsx",
                "/Users/Glare/Library/Developer/ModularProgram/hoewo/Workshop-Feedbacks/webapps/feedback-console-web/src/lib/api/feedbackV2Client.ts",
                "runtime/arcorbit/src/task-source-adapter.mjs",
                "Current operator input, 2026-08-25",
                "arckit/tech/arcorbit/realtime-synchronization-solution.md",
                "arckit/tech/arcorbit/solution.md"
              ],
              "confidence": "high",
              "resume_condition": "当 Workshop Task/realtime API、Work Sync adapter 或 Automation 本地命令边界变化时重审。"
            },
            "gap_refs": [],
            "reason": "把 Workshop 任务与 realtime 集成收敛为 Work Sync 唯一边界。",
            "evidence": [
              "Current operator input, 2026-08-25",
              "arckit/tech/arcorbit/realtime-synchronization-solution.md",
              "arckit/tech/arcorbit/platform-composition-solution.md",
              "arckit/tech/arcorbit/solution.md",
              "arckit/tech/arcorbit/desktop-execution-solution.md"
            ]
          },
          {
            "area_ref": "observability_and_operation",
            "observed_revision": 7,
            "set_decision": {
              "status": "settled",
              "statement": "Runtime persists lifecycle, activity, messages and timing outside the target project, supports restart reconciliation and exposes opaque Run refs. It separately projects ledger candidate catalogs, Agent selection traces, accepted round closeouts and post-commit fresh-read receipts, and also presents ordinary todo state separately from acceptance-feedback queue counts, item status, current Run/Case, progress, evidence and blocking responsibility alongside one active execution. Work Sync exposes per-project realtime health, resumable/legacy mode, modern cursor progress, local projection revision and latest refresh time; it reports reconnecting, degraded, compatible and recovered transitions. Work Sync owns 15-minute reconciliation, lifecycle-triggered current-state recovery and the visible immediate-sync action, has no 60-second disconnected fallback, and records that synchronization never releases a human gate. Automation only references the local task-state and minimal sync-health projections needed for execution recovery.",
              "reason": "同步健康、对账和显式恢复属于 Work Sync；Automation 只投影执行所需摘要。",
              "evidence": [
                "runtime/arckit-runtime/src/state-driven-runner.mjs",
                "runtime/arckit-runtime/src/projection/run-event-projector.mjs",
                "runtime/arckit-runtime/src/desktop/transcript-presentation.mjs",
                "arckit/interaction/automation-workspace/interaction.md",
                "arckit/tech/arckit-runtime/desktop-execution-solution.md",
                "Current operator input, 2026-08-22",
                "arckit/spec/agentic-software-development/runtime-automation-workspace.md",
                "arckit/tech/arcorbit/realtime-synchronization-solution.md",
                "arckit/interaction/automation-workspace/default.html",
                "runtime/arcorbit/src/workshop-realtime-adapter.mjs",
                "runtime/arcorbit/desktop/main.mjs",
                "runtime/arcorbit/desktop/renderer/index.html",
                "runtime/arcorbit/desktop/renderer/renderer.js",
                "runtime/arcorbit/src/automation-coordinator.mjs",
                "runtime/arcorbit/src/desktop/desktop-store.mjs",
                "runtime/arcorbit/test/workshop-realtime-adapter.test.mjs",
                "runtime/arcorbit/test/automation-coordinator.test.mjs",
                "runtime/arcorbit/test/desktop-renderer.test.mjs",
                "Verification: npm run check — 250 tests, 248 passed, 2 environment-gated skips, 0 failed, 2026-08-22",
                "Verification: local macOS x64 installer build and arckit-distribution-smoke/v1 passed, build 20260822083310",
                "Current operator input, 2026-08-25",
                "arckit/tech/arcorbit/platform-composition-solution.md",
                "arckit/tech/arcorbit/solution.md",
                "arckit/tech/arcorbit/desktop-execution-solution.md"
              ],
              "confidence": "high",
              "resume_condition": "当 Work Sync 同步节奏、健康投影、恢复入口或 human Gate 隔离变化时重审。"
            },
            "gap_refs": [],
            "reason": "同步健康、对账和显式恢复属于 Work Sync；Automation 只投影执行所需摘要。",
            "evidence": [
              "Current operator input, 2026-08-25",
              "arckit/tech/arcorbit/realtime-synchronization-solution.md",
              "arckit/tech/arcorbit/platform-composition-solution.md",
              "arckit/tech/arcorbit/solution.md",
              "arckit/tech/arcorbit/desktop-execution-solution.md"
            ]
          },
          {
            "area_ref": "quality_and_validation",
            "observed_revision": 10,
            "set_decision": {
              "status": "settled",
              "statement": "既有协议、Runtime、realtime、Work 和安全验证义务保持不变。真实 Chat 还必须以 adapter、Store、Coordinator、typed main/preload IPC、Renderer 和真实 app-server smoke 的跨层证据证明：首条消息幂等创建 session/thread；连续 turn resume 同一 thread；不同 Chat/Automation owner 隔离；稳定 item streaming、Markdown、reasoning/tool 投影和智能滚动正确；starting/running/waiting approval 均可 interrupt；部分输出和重启恢复不重复请求；活动删除先 interrupt 且无部分删除；审批异步并 fail closed；Renderer 无法覆盖 cwd/thread/method/command；Chat 不触发 using-arckit、ledger、Workshop mutation、Automation lease 或 human Gate。Chat 会话导航还必须证明：会话不受全局项目范围过滤并按 Product Workspace 确定分组；每组默认最多 10 条且仅在超出时出现对应历史入口；展开/收起不改变选择、草稿或后台 turn；新对话持续显示目标工作区，首次发送前切换保留草稿且不创建 session/thread，发送后不能迁移既有 thread/cwd。Automation 介入还必须证明 Chat 与 Automation 使用同一 Conversation Surface 实现和一致的 Markdown、reasoning、tool、approval/error、复制、外链与智能滚动行为；结构化跨 Run 汇总必须覆盖完整墙钟时间、累计 gap 轮数、逐 gap 目标/工作/结果、进行中和旧 Activity 兼容，并回归 Gate、恢复、ledger、Git、证据和执行控制未降级。Work 状态切换还必须用受控延迟和大列表 Electron 场景证明：选中反馈与查询只读取本地 Task Projection，切换状态/筛选不会请求 Workshop；WebSocket 失效、显式刷新、生命周期恢复、周期对账和 mutation 才进入 Work-owned 远端同步；登录代际和项目 revision 阻止陈旧覆盖；1000 行规模不会同步创建或替换全部行节点；任务树、计数、选择、Inspector、筛选和失败恢复不回归。Automation 验证必须证明 Coordinator 没有 Workshop Task Source、Realtime Adapter、REST 或远端确认依赖，只响应 Work 发布的本地状态并把任务动作提交给 Work。待办文本验证还必须跨 adapter、Automation Store/Coordinator、Renderer 与 Electron 证明：连续空白折叠；63/64/65 grapheme 边界；组合字符、代理对和 ZWJ emoji 不被拆分；超限只追加一个 `…`；完整 content 在 Agent intent、搜索和 mutation 中保真；历史标题快照不成为领域事实；Work/Automation 详情不重复；当前运行和 Workbench 顶部保持单行有界。",
              "reason": "验证矩阵必须直接证明 Work 本地查询和 Automation 无远端依赖。",
              "evidence": [
                "runtime/arcorbit/test/work-navigation-electron.test.mjs",
                "Controlled Electron latency and scale measurements, 2026-08-24",
                "runtime/arcorbit/desktop/renderer/renderer.js:1165-1187",
                "arckit/spec/agentic-software-development/arcorbit-work-management.md",
                "arckit/spec/agentic-software-development/runtime-automation-workspace.md",
                "arckit/tech/arcorbit/platform-composition-solution.md",
                "Verification: Intl.Segmenter contract check passed for 63/64/65 grapheme boundaries, ZWJ emoji, and whitespace folding",
                "Current operator input, 2026-08-25",
                "arckit/tech/arcorbit/realtime-synchronization-solution.md",
                "arckit/tech/arcorbit/solution.md",
                "arckit/tech/arcorbit/desktop-execution-solution.md"
              ],
              "confidence": "high",
              "resume_condition": "当 Task Projection 查询、Work Sync 同步机制、Automation 状态输入或列表规模策略变化时重审。"
            },
            "gap_refs": [],
            "reason": "验证矩阵必须直接证明 Work 本地查询和 Automation 无远端依赖。",
            "evidence": [
              "Current operator input, 2026-08-25",
              "arckit/tech/arcorbit/realtime-synchronization-solution.md",
              "arckit/tech/arcorbit/platform-composition-solution.md",
              "arckit/tech/arcorbit/solution.md",
              "arckit/tech/arcorbit/desktop-execution-solution.md"
            ]
          }
        ],
        "software_invariant_changes": [],
        "project_gap_changes": [],
        "selection_context_change": null,
        "evidence": [
          "Current operator input, 2026-08-25",
          "arckit/tech/arcorbit/realtime-synchronization-solution.md",
          "arckit/tech/arcorbit/platform-composition-solution.md",
          "arckit/tech/arcorbit/solution.md",
          "arckit/tech/arcorbit/desktop-execution-solution.md"
        ]
      },
      "invariant_assessment": {
        "project_revision": 227,
        "judgments": [
          {
            "invariant_ref": "product-expectations-remain-recoverable",
            "disposition": "threatened",
            "reason": "产品能力决定仍保留旧 realtime/Automation 边界，需要按已接受事实对齐。",
            "fact_refs": [
              "FACT-WORK-SYNC-TECH-CONTRACT"
            ],
            "evidence": [
              "arckit/project/state.record.json",
              "Current operator input, 2026-08-25",
              "arckit/tech/arcorbit/realtime-synchronization-solution.md",
              "arckit/tech/arcorbit/platform-composition-solution.md",
              "arckit/tech/arcorbit/solution.md",
              "arckit/tech/arcorbit/desktop-execution-solution.md"
            ],
            "gap_refs": [
              "GAP-ALIGN-WORK-SYNC-PRODUCT-CONTRACT"
            ]
          },
          {
            "invariant_ref": "interaction-expectations-remain-recoverable",
            "disposition": "threatened",
            "reason": "Work 状态切换仍被描述为后台远端刷新，与本地查询契约冲突。",
            "fact_refs": [
              "FACT-WORK-SYNC-TECH-CONTRACT"
            ],
            "evidence": [
              "arckit/interaction/task-browser/interaction.md",
              "arckit/project/state.record.json",
              "Current operator input, 2026-08-25",
              "arckit/tech/arcorbit/realtime-synchronization-solution.md",
              "arckit/tech/arcorbit/platform-composition-solution.md",
              "arckit/tech/arcorbit/solution.md",
              "arckit/tech/arcorbit/desktop-execution-solution.md"
            ],
            "gap_refs": [
              "GAP-ALIGN-WORK-SYNC-PRODUCT-CONTRACT"
            ]
          },
          {
            "invariant_ref": "visual-language-remains-consistent",
            "disposition": "not_relevant",
            "reason": "本轮没有改变视觉语言、Design Token 或视觉组件规则。",
            "fact_refs": [],
            "evidence": [],
            "gap_refs": []
          },
          {
            "invariant_ref": "technical-decisions-remain-explainable",
            "disposition": "upheld",
            "reason": "Work Sync、Task Projection、Automation 本地消费及远端 action 边界已在技术源和 Project 决定中统一。",
            "fact_refs": [
              "FACT-WORK-SYNC-OWNERSHIP",
              "FACT-WORK-SYNC-TECH-CONTRACT"
            ],
            "evidence": [
              "Current operator input, 2026-08-25",
              "arckit/tech/arcorbit/realtime-synchronization-solution.md",
              "arckit/tech/arcorbit/platform-composition-solution.md",
              "arckit/tech/arcorbit/solution.md",
              "arckit/tech/arcorbit/desktop-execution-solution.md",
              "arckit/tech/_map/RELATIONS.md"
            ],
            "gap_refs": []
          },
          {
            "invariant_ref": "accepted-facts-are-realized",
            "disposition": "threatened",
            "reason": "权威技术事实已接受，但生产实现仍保留 Automation-owned task synchronization。",
            "fact_refs": [
              "FACT-WORK-SYNC-OWNERSHIP",
              "FACT-WORK-SYNC-TECH-CONTRACT"
            ],
            "evidence": [
              "runtime/arcorbit/src/automation-coordinator.mjs",
              "runtime/arcorbit/desktop/main.mjs",
              "Current operator input, 2026-08-25",
              "arckit/tech/arcorbit/realtime-synchronization-solution.md",
              "arckit/tech/arcorbit/platform-composition-solution.md",
              "arckit/tech/arcorbit/solution.md",
              "arckit/tech/arcorbit/desktop-execution-solution.md"
            ],
            "gap_refs": [
              "GAP-IMPLEMENT-WORK-SYNC-OWNERSHIP"
            ]
          },
          {
            "invariant_ref": "material-risks-have-credible-evidence",
            "disposition": "undetermined",
            "reason": "新边界的迁移、身份清理、并发冲突、恢复和性能风险尚待生产实现测试。",
            "fact_refs": [
              "FACT-WORK-SYNC-TECH-CONTRACT"
            ],
            "evidence": [
              "runtime/arcorbit/test/automation-coordinator.test.mjs",
              "runtime/arcorbit/test/workshop-realtime-adapter.test.mjs",
              "Current operator input, 2026-08-25",
              "arckit/tech/arcorbit/realtime-synchronization-solution.md",
              "arckit/tech/arcorbit/platform-composition-solution.md",
              "arckit/tech/arcorbit/solution.md",
              "arckit/tech/arcorbit/desktop-execution-solution.md"
            ],
            "gap_refs": [
              "GAP-IMPLEMENT-WORK-SYNC-OWNERSHIP"
            ]
          }
        ]
      },
      "evidence": [
        "Current operator input, 2026-08-25",
        "arckit/tech/arcorbit/realtime-synchronization-solution.md",
        "arckit/tech/arcorbit/platform-composition-solution.md",
        "arckit/tech/arcorbit/solution.md",
        "arckit/tech/arcorbit/desktop-execution-solution.md",
        "arckit/tech/INDEX.md",
        "arckit/tech/_map/RELATIONS.md",
        "arckit/tech/_map/feature-matrix.md",
        "Verification: git diff --check passed",
        "Verification: tech document line counts match arckit/tech/INDEX.md"
      ],
      "runtime_result_ref": "",
      "occurred_at": "2026-08-24T16:56:49.910Z"
    },
    {
      "round": 2,
      "transition_schema_version": "arckit-case-transition/v8",
      "goal": "对齐 Work-owned task synchronization 的产品规格、页面交互源、线框投影和 Project 决定。",
      "outcome": "completed",
      "gap_selection": {
        "mode": "candidate",
        "basis": "Post-commit fresh-read 中产品/交互对齐是 CASE-011 唯一 ready Gap，并阻塞生产实现。",
        "snapshot_token": "ae29ec482dfdf7c282bfdc988fa885c7c9520abae3cc807beec3097a1fa8cb2e",
        "selected_ref": "case-gap:CASE-20260824-011:GAP-ALIGN-WORK-SYNC-PRODUCT-CONTRACT",
        "comparison_summary": "已比较四个 Project Gap 和当前 Case Gap；Project Gap 均需独立 Case，本轮选择解除 Work Sync 实现的产品前置冲突。",
        "fresh_discovery_summary": "没有发现新的独立前置 Gap；生产实现仍按上一轮已接受的 GAP-IMPLEMENT-WORK-SYNC-OWNERSHIP 留待 fresh-read 后推进。",
        "considered": [
          {
            "ref": "project-gap:GAP-agent-scenario-evaluation",
            "source": "persisted",
            "eligibility": "case_required",
            "disposition": "deferred",
            "priority_basis": {
              "blocking": "none",
              "risk": "deferred"
            },
            "reason": "需要独立 Case，不阻塞本轮产品/交互对齐。"
          },
          {
            "ref": "project-gap:GAP-runtime-resilience-and-adapters",
            "source": "persisted",
            "eligibility": "case_required",
            "disposition": "deferred",
            "priority_basis": {
              "blocking": "none",
              "risk": "deferred"
            },
            "reason": "处理通用 Runtime 韧性，不替代 Work 页面行为契约。"
          },
          {
            "ref": "project-gap:GAP-security-real-project-validation",
            "source": "persisted",
            "eligibility": "case_required",
            "disposition": "deferred",
            "priority_basis": {
              "blocking": "none",
              "risk": "deferred"
            },
            "reason": "需要真实权限项目证据，不是本轮稳定交互前置。"
          },
          {
            "ref": "project-gap:GAP-cross-record-audit",
            "source": "persisted",
            "eligibility": "case_required",
            "disposition": "deferred",
            "priority_basis": {
              "blocking": "none",
              "risk": "deferred"
            },
            "reason": "属于跨记录审计，需要独立 Case。"
          },
          {
            "ref": "case-gap:CASE-20260824-011:GAP-ALIGN-WORK-SYNC-PRODUCT-CONTRACT",
            "source": "persisted",
            "eligibility": "ready",
            "disposition": "selected",
            "priority_basis": {
              "blocking": "high",
              "risk": "medium"
            },
            "reason": "当前 Case 唯一 ready Gap，直接解除生产实现的前置阻塞。"
          }
        ]
      },
      "selected_gap": {
        "id": "GAP-ALIGN-WORK-SYNC-PRODUCT-CONTRACT",
        "responsibility": "agent",
        "goal": "对齐 Work-owned 同步的产品规格与交互契约，移除“状态切换触发后台远端刷新”和“Automation 拥有同步”的稳定表述。",
        "reason": "技术边界已经接受，但现有产品与交互决定仍把 Work 状态切换描述为后台远端刷新，并声称既有 realtime/Automation 边界不变。",
        "derived_from": [
          "FACT-WORK-SYNC-OWNERSHIP",
          "FACT-WORK-SYNC-TECH-CONTRACT"
        ],
        "blocked_by": [],
        "priority_basis": {
          "blocking": "high",
          "uncertainty": "low",
          "risk": "medium",
          "user_impact": "high"
        },
        "evidence_required": [
          "产品规格明确 Work 页面查询只读取本地投影，远端同步由 Work 独立负责。",
          "交互文档移除状态切换后台刷新提示，改为本地查询与 Work Sync 健康/显式同步反馈。",
          "Project product_capabilities 与 experience_and_interaction 决定和新的所有权边界一致。"
        ]
      },
      "planned_transition": {
        "goal": "对齐 Work-owned task synchronization 的产品规格、页面交互源、线框投影和 Project 决定。",
        "expected_state_change": "产品与交互不再把状态点击描述为远端刷新，也不把同步职责赋给 Automation；生产实现 Gap 解除阻塞。"
      },
      "accepted_state_delta": {
        "resolved_gap": {
          "id": "GAP-ALIGN-WORK-SYNC-PRODUCT-CONTRACT",
          "status": "resolved",
          "outcome": "Work-owned 同步的产品与交互契约已经对齐。",
          "reason": "三个产品规格、两个页面交互源及相关线框、INDEX 和关系投影共同表达本地查询、Work 独占远端同步与 Automation 本地状态依赖，并通过源—投影校验。",
          "evidence": [
            "Current operator input, 2026-08-25",
            "arckit/spec/agentic-software-development/arcorbit-work-management.md",
            "arckit/spec/agentic-software-development/runtime-automation-workspace.md",
            "arckit/spec/agentic-software-development/arcorbit-platform-capabilities.md",
            "arckit/interaction/task-browser/interaction.md",
            "arckit/interaction/task-browser/daily-work.html",
            "arckit/interaction/automation-workspace/interaction.md",
            "arckit/interaction/automation-workspace/default.html",
            "arckit/spec/INDEX.md",
            "arckit/spec/_map/RELATIONS.md",
            "arckit/spec/_map/feature-matrix.md",
            "arckit/interaction/INDEX.md",
            "arckit/interaction/_map/RELATIONS.md",
            "arckit/interaction/_map/feature-matrix.md",
            "Verification: git diff --check passed",
            "Verification: INDEX line counts and interaction state projection checks passed"
          ]
        },
        "facts_added": [
          {
            "id": "FACT-WORK-SYNC-PRODUCT-CONTRACT",
            "revision": 1,
            "status": "accepted",
            "statement": "Work 页面切换七状态、搜索、筛选、日期或分页时只查询当前登录代际的本地 Task Projection，不请求 Workshop，也不出现由该点击触发的后台刷新。Work Sync 独立负责 WebSocket、补取、REST 对账、mutation 与同步反馈；Automation 只消费 Work 发布的本地待办状态并向 Work 提交任务动作。",
            "basis": "用户明确确认最终职责边界，产品规格、页面交互源和线框投影已统一表达该行为。",
            "evidence": [
              "Current operator input, 2026-08-25",
              "arckit/spec/agentic-software-development/arcorbit-work-management.md",
              "arckit/spec/agentic-software-development/runtime-automation-workspace.md",
              "arckit/spec/agentic-software-development/arcorbit-platform-capabilities.md",
              "arckit/interaction/task-browser/interaction.md",
              "arckit/interaction/task-browser/daily-work.html",
              "arckit/interaction/automation-workspace/interaction.md",
              "arckit/interaction/automation-workspace/default.html"
            ]
          }
        ],
        "facts_superseded": [],
        "impacts_added": [],
        "impacts_updated": [
          {
            "id": "IMPACT-WORK-SYNC-PRODUCT",
            "fact_id": "FACT-WORK-SYNC-TECH-CONTRACT",
            "fact_revision": 1,
            "target": {
              "kind": "software_decision",
              "ref": "product_capabilities",
              "revision": 26
            },
            "effect": "upheld",
            "reason": "产品能力决定和规格已明确 Work 唯一同步所有权与 Automation 本地依赖。",
            "gap_ids": [],
            "evidence": [
              "Current operator input, 2026-08-25",
              "arckit/spec/agentic-software-development/arcorbit-work-management.md",
              "arckit/spec/agentic-software-development/runtime-automation-workspace.md",
              "arckit/spec/agentic-software-development/arcorbit-platform-capabilities.md",
              "arckit/interaction/task-browser/interaction.md",
              "arckit/interaction/task-browser/daily-work.html",
              "arckit/interaction/automation-workspace/interaction.md",
              "arckit/interaction/automation-workspace/default.html"
            ]
          },
          {
            "id": "IMPACT-WORK-SYNC-EXPERIENCE",
            "fact_id": "FACT-WORK-SYNC-TECH-CONTRACT",
            "fact_revision": 1,
            "target": {
              "kind": "software_decision",
              "ref": "experience_and_interaction",
              "revision": 41
            },
            "effect": "upheld",
            "reason": "交互决定和页面源已明确状态/筛选点击只查询本地投影。",
            "gap_ids": [],
            "evidence": [
              "Current operator input, 2026-08-25",
              "arckit/spec/agentic-software-development/arcorbit-work-management.md",
              "arckit/spec/agentic-software-development/runtime-automation-workspace.md",
              "arckit/spec/agentic-software-development/arcorbit-platform-capabilities.md",
              "arckit/interaction/task-browser/interaction.md",
              "arckit/interaction/task-browser/daily-work.html",
              "arckit/interaction/automation-workspace/interaction.md",
              "arckit/interaction/automation-workspace/default.html"
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
            "area_ref": "product_capabilities",
            "observed_revision": 25,
            "set_decision": {
              "status": "settled",
              "statement": "ArcOrbit 保留 Setup Readiness、受监督的一待办一 thread Automation、trusted ledger transition、介入/恢复、验收反馈、Workshop 平台组合、Work 日常管理与产品反馈能力。Personal / Chat 升级为绑定本地 Product Workspace 的真实 Codex 自由对话，支持持久会话、固定 thread、流式消息、工具与审批状态、停止、失败/重启恢复、重命名和安全删除；会话列表直接按 Product Workspace 分组，每个项目默认展示最近 10 个会话并提供项目历史入口，新对话在首条消息前显式显示并允许切换目标工作区；Chat 不创建或转换 Idea、Work、Task、Case、ledger 或 Automation Run。Idea、Release、Operations 和 Engineering 继续作为 planning-only 工作空间。Work 是 Workshop 待办同步和本地 Task Projection 的唯一客户端所有者，独立负责 realtime、REST 对账与 mutation；Automation human Gate、Feedback、Organization、Domain Profile 和分发边界保持不变，Automation 只消费 Work 发布的本地待办状态。Work 使用弹出式多维筛选与单行无按钮列表，完整动作归于 Inspector；评论图片随时间线默认加载，点击后进入具备缩放、适配、实际大小、旋转、平移、重置和另存为的独立窗口。Feedback 使用不会随结果数量拉伸的单行列表，详情在独立内部区域滚动；反馈原文与沟通图片默认加载、支持局部失败重试，并与 Work 共用具备缩放、适配、实际大小、旋转、平移、重置和另存为的受控独立图片窗口；Feedback 默认逐项目探测 Workshop 双向会话能力，真实不可用时回退 V1。Automation 人工介入的消息列表直接复用 Chat Conversation Surface；Automation 的 gap/round、ledger、证据、恢复和执行控制能力保持完整并归入左右面板，执行总览提供完整墙钟时间、累计 gap 轮数及逐 gap 的目标、工作和结果。Workshop Task 只保存一个完整 `content`；ArcOrbit 在所有标题场景统一生成最多 64 个 Unicode grapheme clusters、超限以 `…` 结束的单行展示标题，详情只展示一次保留换行的完整正文。 Work 七状态、搜索、筛选、日期和分页只查询本地 Task Projection，点击这些观察条件不会请求服务器或触发后台刷新。",
              "reason": "接受 Work 独占任务同步、Automation 只依赖本地状态的最终产品边界。",
              "evidence": [
                "Current operator input, 2026-08-24",
                "arckit/spec/agentic-software-development/arcorbit-platform-capabilities.md",
                "arckit/spec/agentic-software-development/arcorbit-work-management.md",
                "arckit/spec/agentic-software-development/runtime-automation-workspace.md",
                "runtime/arcorbit/desktop/renderer/renderer.js",
                "runtime/arcorbit/src/work-task-image-viewer.mjs",
                "Current operator input, 2026-08-25",
                "arckit/interaction/task-browser/interaction.md",
                "arckit/interaction/task-browser/daily-work.html",
                "arckit/interaction/automation-workspace/interaction.md",
                "arckit/interaction/automation-workspace/default.html"
              ],
              "confidence": "high",
              "resume_condition": "当 Work/Automation 职责、Task Projection 可见范围、页面查询行为或 Workshop 同步入口变化时重审。"
            },
            "gap_refs": [],
            "reason": "接受 Work 独占任务同步、Automation 只依赖本地状态的最终产品边界。",
            "evidence": [
              "Current operator input, 2026-08-25",
              "arckit/spec/agentic-software-development/arcorbit-work-management.md",
              "arckit/spec/agentic-software-development/runtime-automation-workspace.md",
              "arckit/spec/agentic-software-development/arcorbit-platform-capabilities.md",
              "arckit/interaction/task-browser/interaction.md",
              "arckit/interaction/task-browser/daily-work.html",
              "arckit/interaction/automation-workspace/interaction.md",
              "arckit/interaction/automation-workspace/default.html"
            ]
          },
          {
            "area_ref": "experience_and_interaction",
            "observed_revision": 40,
            "set_decision": {
              "status": "settled",
              "statement": "ArcOrbit 保持 Personal、Product Lifecycle、Organization 三组导航和既有 Work、Automation、Feedback、Organization、Setup、账户及产品反馈语义。Personal / Chat 使用按 Product Workspace 分组的会话列表、独立 transcript 和 Composer：页面无需预先选择项目，每个项目默认显示最近 10 个会话并在超出时从组底部展开完整历史；新对话在首条非空消息前显式显示目标工作区，默认取当前会话或最近成功使用的可用工作区，允许保留草稿快速切换，发送后会话固定绑定该本地 Product Workspace 和 Codex thread。支持选择、重命名、删除、跨页面后台运行和重启恢复。消息以稳定 item 流式更新，支持 Markdown、代码复制、折叠非空 reasoning、单行工具状态、用户审批和智能自动滚动。starting、running、waiting approval 状态均可停止；interrupt 保留部分回答，继续操作会在同一 thread 启动新 turn。删除活动会话先等待 interrupt 终态，失败时不部分删除。没有可用本地工作区时允许保留草稿但禁止发送，并提供配置恢复入口。Chat 不调用 state-driven Runtime，不转换其他对象；Automation task thread、human Gate、Composer 与执行控制保持独立，但人工介入中间消息区直接复用 Chat Conversation Surface。Idea、Release、Operations 和 Engineering 继续呈现计划交互。Chat 返回页面时先用缓存会话和 transcript 立即切换，再后台刷新并显示同步或失败状态；Work 横排筛选使用弹出菜单且列表单行无按钮，评论图片自动加载且在独立窗口完成常用查看操作，单图失败不阻塞时间线；Feedback 列表中的每条记录保持固定单行高度且不因记录较少而拉伸，详情由右栏内部滚动容器承载且滚动不改变列表位置，反馈原文和双向沟通图片默认加载，单图失败不阻塞详情并可就地重试，点击图片后与 Work 共用受控独立窗口。Automation 左栏承载任务、项目、边界、当前选择和介入控制；右栏承载完整执行墙钟时间、累计 gap 轮数、逐 gap 目标/工作/结果，以及 Run、token、Gate、ledger、Git、证据和结构化结果。Automation 专属 loop/round/ledger 事件不进入中间对话流。Work 待办状态切换必须立即确认新的选中状态，并直接显示当前登录代际本地 Task Projection 的匹配结果或 Work Sync 初始化态；状态、搜索、筛选、日期和分页变化不触发 Workshop 请求，也不显示由该点击触发的后台刷新。Work Sync 的连接、补取、对账和错误状态在独立同步反馈中呈现，Automation、认证、组织、成员与 Feedback 状态不得阻塞本地查询交互，大列表不得通过同步整表重建阻塞 Renderer。Work 七状态工具条使用不受右侧项目名、命中数、补全树数量、状态计数和刷新提示变化影响的稳定几何；动态摘要限制在固定单行区域并在超出时省略，常规与响应式布局均不因内容变化改变工具条宽高或状态按钮区宽度。待办列表、队列、当前运行、确认对话和 Intervention Workbench 顶部统一显示折叠空白且最多 64 个 Unicode grapheme clusters 的单行标题；Work 与 Automation 详情只展示一次保留换行的完整正文，Workbench 顶部保持固定高度。Work 与 Feedback 共享页面级主工作区骨架：全局产品集栏下只保留一条固定高度且不换行的页面控制轨，列表与详情双栏取得其余全部可用高度，页面外层不滚动，面板标题保持可见且两侧正文独立滚动。Work 常规宽度在控制轨显示七状态分段、搜索、统一多维筛选入口和创建动作，窄窗口把状态收敛为当前状态菜单并把低频动作收入更多操作；Feedback 常规宽度显示搜索、处理状态、排序和刷新，窄窗口保留搜索与当前状态并把排序、刷新等低频动作收入更多操作。加载、空态、错误、长列表和长详情不改变控制轨与双栏几何，宽度切换不重置筛选、选择或滚动位置。",
              "reason": "移除 Work 状态点击触发后台远端刷新的旧交互，并把同步反馈归入独立 Work Sync 状态。",
              "evidence": [
                "Current operator input, 2026-08-25",
                "arckit/interaction/task-browser/interaction.md",
                "arckit/interaction/task-browser/daily-work.html",
                "arckit/interaction/platform-workspace/interaction.md",
                "arckit/interaction/platform-workspace/default.html",
                "arckit/interaction/_map/RELATIONS.md",
                "arckit/visual/_library/brief.md",
                "arckit/visual/_library/design-tokens.yaml",
                "arckit/spec/agentic-software-development/arcorbit-work-management.md",
                "arckit/spec/agentic-software-development/runtime-automation-workspace.md",
                "arckit/spec/agentic-software-development/arcorbit-platform-capabilities.md",
                "arckit/interaction/automation-workspace/interaction.md",
                "arckit/interaction/automation-workspace/default.html"
              ],
              "confidence": "high",
              "resume_condition": "当 Work 状态/筛选查询、同步反馈位置、初始化/过期状态或 Automation 本地状态入口变化时重审。"
            },
            "gap_refs": [],
            "reason": "移除 Work 状态点击触发后台远端刷新的旧交互，并把同步反馈归入独立 Work Sync 状态。",
            "evidence": [
              "Current operator input, 2026-08-25",
              "arckit/spec/agentic-software-development/arcorbit-work-management.md",
              "arckit/spec/agentic-software-development/runtime-automation-workspace.md",
              "arckit/spec/agentic-software-development/arcorbit-platform-capabilities.md",
              "arckit/interaction/task-browser/interaction.md",
              "arckit/interaction/task-browser/daily-work.html",
              "arckit/interaction/automation-workspace/interaction.md",
              "arckit/interaction/automation-workspace/default.html"
            ]
          }
        ],
        "software_invariant_changes": [],
        "project_gap_changes": [],
        "selection_context_change": null,
        "evidence": [
          "Current operator input, 2026-08-25",
          "arckit/spec/agentic-software-development/arcorbit-work-management.md",
          "arckit/spec/agentic-software-development/runtime-automation-workspace.md",
          "arckit/spec/agentic-software-development/arcorbit-platform-capabilities.md",
          "arckit/interaction/task-browser/interaction.md",
          "arckit/interaction/task-browser/daily-work.html",
          "arckit/interaction/automation-workspace/interaction.md",
          "arckit/interaction/automation-workspace/default.html"
        ]
      },
      "invariant_assessment": {
        "project_revision": 228,
        "judgments": [
          {
            "invariant_ref": "product-expectations-remain-recoverable",
            "disposition": "upheld",
            "reason": "Work-owned 同步和 Automation 本地依赖已在产品规格及 Project 能力决定中完整表达。",
            "fact_refs": [
              "FACT-WORK-SYNC-TECH-CONTRACT",
              "FACT-WORK-SYNC-PRODUCT-CONTRACT"
            ],
            "evidence": [
              "Current operator input, 2026-08-25",
              "arckit/spec/agentic-software-development/arcorbit-work-management.md",
              "arckit/spec/agentic-software-development/runtime-automation-workspace.md",
              "arckit/spec/agentic-software-development/arcorbit-platform-capabilities.md",
              "arckit/interaction/task-browser/interaction.md",
              "arckit/interaction/task-browser/daily-work.html",
              "arckit/interaction/automation-workspace/interaction.md",
              "arckit/interaction/automation-workspace/default.html"
            ],
            "gap_refs": []
          },
          {
            "invariant_ref": "interaction-expectations-remain-recoverable",
            "disposition": "upheld",
            "reason": "状态/筛选点击的本地查询、初始化、同步反馈和恢复行为已同步到交互源与线框。",
            "fact_refs": [
              "FACT-WORK-SYNC-TECH-CONTRACT",
              "FACT-WORK-SYNC-PRODUCT-CONTRACT"
            ],
            "evidence": [
              "Current operator input, 2026-08-25",
              "arckit/spec/agentic-software-development/arcorbit-work-management.md",
              "arckit/spec/agentic-software-development/runtime-automation-workspace.md",
              "arckit/spec/agentic-software-development/arcorbit-platform-capabilities.md",
              "arckit/interaction/task-browser/interaction.md",
              "arckit/interaction/task-browser/daily-work.html",
              "arckit/interaction/automation-workspace/interaction.md",
              "arckit/interaction/automation-workspace/default.html",
              "arckit/interaction/automation-workspace/runtime-recovery.html"
            ],
            "gap_refs": []
          },
          {
            "invariant_ref": "visual-language-remains-consistent",
            "disposition": "not_relevant",
            "reason": "本轮只修改交互语义和线框文案，没有改变视觉语言或 Design Token。",
            "fact_refs": [],
            "evidence": [],
            "gap_refs": []
          },
          {
            "invariant_ref": "technical-decisions-remain-explainable",
            "disposition": "upheld",
            "reason": "产品/交互契约与上一轮已接受的 Work Sync 技术边界一致。",
            "fact_refs": [
              "FACT-WORK-SYNC-TECH-CONTRACT",
              "FACT-WORK-SYNC-PRODUCT-CONTRACT"
            ],
            "evidence": [
              "Current operator input, 2026-08-25",
              "arckit/spec/agentic-software-development/arcorbit-work-management.md",
              "arckit/spec/agentic-software-development/runtime-automation-workspace.md",
              "arckit/spec/agentic-software-development/arcorbit-platform-capabilities.md",
              "arckit/interaction/task-browser/interaction.md",
              "arckit/interaction/task-browser/daily-work.html",
              "arckit/interaction/automation-workspace/interaction.md",
              "arckit/interaction/automation-workspace/default.html",
              "arckit/tech/arcorbit/realtime-synchronization-solution.md"
            ],
            "gap_refs": []
          },
          {
            "invariant_ref": "accepted-facts-are-realized",
            "disposition": "threatened",
            "reason": "契约已经统一，但生产代码尚未实现 Work-owned task synchronization。",
            "fact_refs": [
              "FACT-WORK-SYNC-OWNERSHIP",
              "FACT-WORK-SYNC-TECH-CONTRACT",
              "FACT-WORK-SYNC-PRODUCT-CONTRACT"
            ],
            "evidence": [
              "runtime/arcorbit/src/automation-coordinator.mjs",
              "runtime/arcorbit/desktop/main.mjs",
              "Current operator input, 2026-08-25",
              "arckit/spec/agentic-software-development/arcorbit-work-management.md",
              "arckit/spec/agentic-software-development/runtime-automation-workspace.md",
              "arckit/spec/agentic-software-development/arcorbit-platform-capabilities.md",
              "arckit/interaction/task-browser/interaction.md",
              "arckit/interaction/task-browser/daily-work.html",
              "arckit/interaction/automation-workspace/interaction.md",
              "arckit/interaction/automation-workspace/default.html"
            ],
            "gap_refs": [
              "GAP-IMPLEMENT-WORK-SYNC-OWNERSHIP"
            ]
          },
          {
            "invariant_ref": "material-risks-have-credible-evidence",
            "disposition": "undetermined",
            "reason": "迁移、身份清理、冲突恢复和本地查询性能仍需要生产实现与测试证据。",
            "fact_refs": [
              "FACT-WORK-SYNC-TECH-CONTRACT",
              "FACT-WORK-SYNC-PRODUCT-CONTRACT"
            ],
            "evidence": [
              "runtime/arcorbit/test/automation-coordinator.test.mjs",
              "runtime/arcorbit/test/workshop-realtime-adapter.test.mjs",
              "Current operator input, 2026-08-25",
              "arckit/spec/agentic-software-development/arcorbit-work-management.md",
              "arckit/spec/agentic-software-development/runtime-automation-workspace.md",
              "arckit/spec/agentic-software-development/arcorbit-platform-capabilities.md",
              "arckit/interaction/task-browser/interaction.md",
              "arckit/interaction/task-browser/daily-work.html",
              "arckit/interaction/automation-workspace/interaction.md",
              "arckit/interaction/automation-workspace/default.html"
            ],
            "gap_refs": [
              "GAP-IMPLEMENT-WORK-SYNC-OWNERSHIP"
            ]
          }
        ]
      },
      "evidence": [
        "Current operator input, 2026-08-25",
        "arckit/spec/agentic-software-development/arcorbit-work-management.md",
        "arckit/spec/agentic-software-development/runtime-automation-workspace.md",
        "arckit/spec/agentic-software-development/arcorbit-platform-capabilities.md",
        "arckit/interaction/task-browser/interaction.md",
        "arckit/interaction/task-browser/daily-work.html",
        "arckit/interaction/automation-workspace/interaction.md",
        "arckit/interaction/automation-workspace/default.html",
        "arckit/spec/INDEX.md",
        "arckit/interaction/INDEX.md",
        "Verification: git diff --check passed",
        "Verification: INDEX line counts and interaction state projection checks passed"
      ],
      "runtime_result_ref": "",
      "occurred_at": "2026-08-24T17:10:15.501Z"
    },
    {
      "round": 3,
      "transition_schema_version": "arckit-case-transition/v8",
      "goal": "Realize Work-owned task synchronization in production code and remove Automation remote task synchronization ownership.",
      "outcome": "completed",
      "gap_selection": {
        "mode": "candidate",
        "basis": "The implementation gap is the only ready gap in this Case and directly realizes the operator-confirmed Work/Automation ownership boundary.",
        "snapshot_token": "736fdb5ae617b75358b0f173742d39c94f2b77ba299d4c2488a168c570dcc90d",
        "selected_ref": "case-gap:CASE-20260824-011:GAP-IMPLEMENT-WORK-SYNC-OWNERSHIP",
        "comparison_summary": "Compared the ready Case implementation gap with all four Project gaps; the Project gaps require independent Cases and do not supersede this blocking realization work.",
        "fresh_discovery_summary": "No new ordinary Case gap was found after implementation and focused verification; Completion Review remains the derived next gate.",
        "considered": [
          {
            "ref": "project-gap:GAP-agent-scenario-evaluation",
            "source": "persisted",
            "eligibility": "case_required",
            "disposition": "deferred",
            "priority_basis": {
              "uncertainty": "high",
              "risk": "high",
              "blocking": "none"
            },
            "reason": "This is independent Project work that requires its own Case."
          },
          {
            "ref": "project-gap:GAP-runtime-resilience-and-adapters",
            "source": "persisted",
            "eligibility": "case_required",
            "disposition": "deferred",
            "priority_basis": {
              "risk": "high",
              "urgency": "medium",
              "blocking": "none"
            },
            "reason": "This is independent Project work that requires its own Case."
          },
          {
            "ref": "project-gap:GAP-security-real-project-validation",
            "source": "persisted",
            "eligibility": "case_required",
            "disposition": "deferred",
            "priority_basis": {
              "risk": "high",
              "urgency": "medium",
              "blocking": "none"
            },
            "reason": "This is independent Project work that requires its own Case."
          },
          {
            "ref": "project-gap:GAP-cross-record-audit",
            "source": "persisted",
            "eligibility": "case_required",
            "disposition": "deferred",
            "priority_basis": {
              "risk": "high",
              "urgency": "high",
              "blocking": "none"
            },
            "reason": "This is independent Project work that requires its own Case."
          },
          {
            "ref": "case-gap:CASE-20260824-011:GAP-IMPLEMENT-WORK-SYNC-OWNERSHIP",
            "source": "persisted",
            "eligibility": "ready",
            "disposition": "selected",
            "priority_basis": {
              "blocking": "high",
              "uncertainty": "medium",
              "risk": "high",
              "user_impact": "high"
            },
            "reason": "This is the only ready Case gap and its production realization has now been implemented and verified."
          }
        ]
      },
      "selected_gap": {
        "id": "GAP-IMPLEMENT-WORK-SYNC-OWNERSHIP",
        "responsibility": "agent",
        "goal": "在 ArcOrbit 生产代码中实现 Work-owned Task Projection/Realtime/REST/mutation，并让 Automation 只消费本地待办状态。",
        "reason": "当前生产实现仍由 Automation Coordinator 拥有远端任务快照、realtime 失效刷新和状态写回，尚未兑现已接受技术契约。",
        "derived_from": [
          "FACT-WORK-SYNC-OWNERSHIP",
          "FACT-WORK-SYNC-TECH-CONTRACT"
        ],
        "blocked_by": [
          "GAP-ALIGN-WORK-SYNC-PRODUCT-CONTRACT"
        ],
        "priority_basis": {
          "blocking": "high",
          "uncertainty": "medium",
          "risk": "high",
          "user_impact": "high"
        },
        "evidence_required": [
          "Work Sync 维护持久本地任务投影并独占 Workshop Task Source、Realtime Adapter、REST 对账和 mutation。",
          "Work 状态/筛选切换只查询本地投影，且不调用 Workshop。",
          "Automation Coordinator 无 Workshop/realtime 依赖，只订阅本地状态并向 Work 提交动作。",
          "迁移、身份清理、冲突恢复、周期同步与 Electron 回归测试通过。"
        ]
      },
      "planned_transition": {
        "goal": "Realize Work-owned task synchronization in production code and remove Automation remote task synchronization ownership.",
        "expected_state_change": "Work owns the durable local Task Projection, realtime invalidation, REST reconciliation and task mutation; Work queries and Automation consume only local task state."
      },
      "accepted_state_delta": {
        "resolved_gap": {
          "id": "GAP-IMPLEMENT-WORK-SYNC-OWNERSHIP",
          "status": "resolved",
          "outcome": "Work-owned task synchronization is implemented in ArcOrbit production code.",
          "reason": "A dedicated Work Sync coordinator now owns Workshop task transport and persistent projection; Work queries are local-only and Automation contains no remote task read, realtime, cursor, or confirmation path.",
          "evidence": [
            "runtime/arcorbit/src/work-sync-coordinator.mjs",
            "runtime/arcorbit/src/desktop/desktop-store.mjs",
            "runtime/arcorbit/src/automation-coordinator.mjs",
            "runtime/arcorbit/src/platform-coordinator.mjs",
            "runtime/arcorbit/desktop/main.mjs",
            "runtime/arcorbit/desktop/preload.cjs",
            "runtime/arcorbit/desktop/renderer/renderer.js",
            "runtime/arcorbit/test/work-sync-coordinator.test.mjs",
            "runtime/arcorbit/test/automation-coordinator.test.mjs",
            "runtime/arcorbit/test/platform-coordinator.test.mjs",
            "runtime/arcorbit/test/desktop-store.test.mjs",
            "runtime/arcorbit/test/desktop-renderer.test.mjs",
            "runtime/arcorbit/test/workshop-realtime-adapter.test.mjs",
            "Verification: 129 focused Work/Automation/Store/Realtime/Renderer tests passed",
            "Verification: full suite reached 389 passed, 9 skipped, with only the sandbox-blocked Electron process aborting before assertions",
            "Verification: git diff --check and static ownership searches passed"
          ]
        },
        "facts_added": [
          {
            "id": "FACT-20260824-011-001",
            "revision": 1,
            "status": "accepted",
            "statement": "ArcOrbit production code now gives Work sole ownership of Workshop task synchronization, persistent local Task Projection, realtime invalidation, REST reconciliation and task mutations. Work status/filter/search/date/window queries read that projection only. Automation observes Work-published local task state and submits state actions to Work without direct Workshop task reads, WebSocket, cursor or remote-confirmation ownership.",
            "basis": "Production implementation, migration logic, static dependency checks and focused regression tests.",
            "evidence": [
              "runtime/arcorbit/src/work-sync-coordinator.mjs",
              "runtime/arcorbit/src/desktop/desktop-store.mjs",
              "runtime/arcorbit/src/automation-coordinator.mjs",
              "runtime/arcorbit/src/platform-coordinator.mjs",
              "runtime/arcorbit/desktop/main.mjs",
              "runtime/arcorbit/desktop/preload.cjs",
              "runtime/arcorbit/desktop/renderer/renderer.js",
              "runtime/arcorbit/test/work-sync-coordinator.test.mjs",
              "runtime/arcorbit/test/automation-coordinator.test.mjs",
              "runtime/arcorbit/test/platform-coordinator.test.mjs",
              "runtime/arcorbit/test/desktop-store.test.mjs",
              "runtime/arcorbit/test/desktop-renderer.test.mjs",
              "runtime/arcorbit/test/workshop-realtime-adapter.test.mjs",
              "Verification: 129 focused Work/Automation/Store/Realtime/Renderer tests passed",
              "Verification: full suite reached 389 passed, 9 skipped, with only the sandbox-blocked Electron process aborting before assertions",
              "Verification: git diff --check and static ownership searches passed"
            ]
          }
        ],
        "facts_superseded": [],
        "impacts_added": [],
        "impacts_updated": [
          {
            "id": "IMPACT-WORK-SYNC-REALIZATION",
            "fact_id": "FACT-20260824-011-001",
            "fact_revision": 1,
            "target": {
              "kind": "software_invariant",
              "ref": "accepted-facts-are-realized",
              "revision": null
            },
            "effect": "upheld",
            "reason": "The accepted Work-owned synchronization facts are realized in the production main-process ownership, durable store and local-only consumers.",
            "gap_ids": [],
            "evidence": [
              "runtime/arcorbit/src/work-sync-coordinator.mjs",
              "runtime/arcorbit/src/desktop/desktop-store.mjs",
              "runtime/arcorbit/src/automation-coordinator.mjs",
              "runtime/arcorbit/src/platform-coordinator.mjs",
              "runtime/arcorbit/desktop/main.mjs",
              "runtime/arcorbit/desktop/preload.cjs",
              "runtime/arcorbit/desktop/renderer/renderer.js",
              "runtime/arcorbit/test/work-sync-coordinator.test.mjs",
              "runtime/arcorbit/test/automation-coordinator.test.mjs",
              "runtime/arcorbit/test/platform-coordinator.test.mjs",
              "runtime/arcorbit/test/desktop-store.test.mjs",
              "runtime/arcorbit/test/desktop-renderer.test.mjs",
              "runtime/arcorbit/test/workshop-realtime-adapter.test.mjs",
              "Verification: 129 focused Work/Automation/Store/Realtime/Renderer tests passed",
              "Verification: full suite reached 389 passed, 9 skipped, with only the sandbox-blocked Electron process aborting before assertions",
              "Verification: git diff --check and static ownership searches passed"
            ]
          },
          {
            "id": "IMPACT-WORK-SYNC-RISK",
            "fact_id": "FACT-20260824-011-001",
            "fact_revision": 1,
            "target": {
              "kind": "software_invariant",
              "ref": "material-risks-have-credible-evidence",
              "revision": null
            },
            "effect": "upheld",
            "reason": "Migration, identity clearing, late-result suppression, mutation conflicts, degraded recovery, local querying and realtime replay are covered by focused tests and static ownership checks.",
            "gap_ids": [],
            "evidence": [
              "runtime/arcorbit/src/work-sync-coordinator.mjs",
              "runtime/arcorbit/src/desktop/desktop-store.mjs",
              "runtime/arcorbit/src/automation-coordinator.mjs",
              "runtime/arcorbit/src/platform-coordinator.mjs",
              "runtime/arcorbit/desktop/main.mjs",
              "runtime/arcorbit/desktop/preload.cjs",
              "runtime/arcorbit/desktop/renderer/renderer.js",
              "runtime/arcorbit/test/work-sync-coordinator.test.mjs",
              "runtime/arcorbit/test/automation-coordinator.test.mjs",
              "runtime/arcorbit/test/platform-coordinator.test.mjs",
              "runtime/arcorbit/test/desktop-store.test.mjs",
              "runtime/arcorbit/test/desktop-renderer.test.mjs",
              "runtime/arcorbit/test/workshop-realtime-adapter.test.mjs",
              "Verification: 129 focused Work/Automation/Store/Realtime/Renderer tests passed",
              "Verification: full suite reached 389 passed, 9 skipped, with only the sandbox-blocked Electron process aborting before assertions",
              "Verification: git diff --check and static ownership searches passed"
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
        "project_revision": 229,
        "judgments": [
          {
            "invariant_ref": "product-expectations-remain-recoverable",
            "disposition": "upheld",
            "reason": "The implemented behavior matches the accepted product contract for local Work queries and Work-owned synchronization.",
            "fact_refs": [
              "FACT-WORK-SYNC-OWNERSHIP",
              "FACT-WORK-SYNC-TECH-CONTRACT",
              "FACT-WORK-SYNC-PRODUCT-CONTRACT",
              "FACT-20260824-011-001"
            ],
            "evidence": [
              "runtime/arcorbit/src/work-sync-coordinator.mjs",
              "runtime/arcorbit/src/desktop/desktop-store.mjs",
              "runtime/arcorbit/src/automation-coordinator.mjs",
              "runtime/arcorbit/src/platform-coordinator.mjs",
              "runtime/arcorbit/desktop/main.mjs",
              "runtime/arcorbit/desktop/preload.cjs",
              "runtime/arcorbit/desktop/renderer/renderer.js",
              "runtime/arcorbit/test/work-sync-coordinator.test.mjs",
              "runtime/arcorbit/test/automation-coordinator.test.mjs",
              "runtime/arcorbit/test/platform-coordinator.test.mjs",
              "runtime/arcorbit/test/desktop-store.test.mjs",
              "runtime/arcorbit/test/desktop-renderer.test.mjs",
              "runtime/arcorbit/test/workshop-realtime-adapter.test.mjs",
              "Verification: 129 focused Work/Automation/Store/Realtime/Renderer tests passed",
              "Verification: full suite reached 389 passed, 9 skipped, with only the sandbox-blocked Electron process aborting before assertions",
              "Verification: git diff --check and static ownership searches passed"
            ],
            "gap_refs": []
          },
          {
            "invariant_ref": "interaction-expectations-remain-recoverable",
            "disposition": "upheld",
            "reason": "Renderer behavior and interaction sources consistently show local query progress without click-triggered background refresh.",
            "fact_refs": [
              "FACT-WORK-SYNC-OWNERSHIP",
              "FACT-WORK-SYNC-TECH-CONTRACT",
              "FACT-WORK-SYNC-PRODUCT-CONTRACT",
              "FACT-20260824-011-001"
            ],
            "evidence": [
              "runtime/arcorbit/src/work-sync-coordinator.mjs",
              "runtime/arcorbit/src/desktop/desktop-store.mjs",
              "runtime/arcorbit/src/automation-coordinator.mjs",
              "runtime/arcorbit/src/platform-coordinator.mjs",
              "runtime/arcorbit/desktop/main.mjs",
              "runtime/arcorbit/desktop/preload.cjs",
              "runtime/arcorbit/desktop/renderer/renderer.js",
              "runtime/arcorbit/test/work-sync-coordinator.test.mjs",
              "runtime/arcorbit/test/automation-coordinator.test.mjs",
              "runtime/arcorbit/test/platform-coordinator.test.mjs",
              "runtime/arcorbit/test/desktop-store.test.mjs",
              "runtime/arcorbit/test/desktop-renderer.test.mjs",
              "runtime/arcorbit/test/workshop-realtime-adapter.test.mjs",
              "Verification: 129 focused Work/Automation/Store/Realtime/Renderer tests passed",
              "Verification: full suite reached 389 passed, 9 skipped, with only the sandbox-blocked Electron process aborting before assertions",
              "Verification: git diff --check and static ownership searches passed"
            ],
            "gap_refs": []
          },
          {
            "invariant_ref": "visual-language-remains-consistent",
            "disposition": "not_relevant",
            "reason": "The ownership implementation does not establish or change visual language or design tokens.",
            "fact_refs": [],
            "evidence": [],
            "gap_refs": []
          },
          {
            "invariant_ref": "technical-decisions-remain-explainable",
            "disposition": "upheld",
            "reason": "The code boundary directly matches the documented Work Sync ownership, projection, mutation and recovery architecture.",
            "fact_refs": [
              "FACT-WORK-SYNC-OWNERSHIP",
              "FACT-WORK-SYNC-TECH-CONTRACT",
              "FACT-WORK-SYNC-PRODUCT-CONTRACT",
              "FACT-20260824-011-001"
            ],
            "evidence": [
              "runtime/arcorbit/src/work-sync-coordinator.mjs",
              "runtime/arcorbit/src/desktop/desktop-store.mjs",
              "runtime/arcorbit/src/automation-coordinator.mjs",
              "runtime/arcorbit/src/platform-coordinator.mjs",
              "runtime/arcorbit/desktop/main.mjs",
              "runtime/arcorbit/desktop/preload.cjs",
              "runtime/arcorbit/desktop/renderer/renderer.js",
              "runtime/arcorbit/test/work-sync-coordinator.test.mjs",
              "runtime/arcorbit/test/automation-coordinator.test.mjs",
              "runtime/arcorbit/test/platform-coordinator.test.mjs",
              "runtime/arcorbit/test/desktop-store.test.mjs",
              "runtime/arcorbit/test/desktop-renderer.test.mjs",
              "runtime/arcorbit/test/workshop-realtime-adapter.test.mjs",
              "Verification: 129 focused Work/Automation/Store/Realtime/Renderer tests passed",
              "Verification: full suite reached 389 passed, 9 skipped, with only the sandbox-blocked Electron process aborting before assertions",
              "Verification: git diff --check and static ownership searches passed"
            ],
            "gap_refs": []
          },
          {
            "invariant_ref": "accepted-facts-are-realized",
            "disposition": "upheld",
            "reason": "Work-owned synchronization and Automation local-state dependency are now present in production code.",
            "fact_refs": [
              "FACT-WORK-SYNC-OWNERSHIP",
              "FACT-WORK-SYNC-TECH-CONTRACT",
              "FACT-WORK-SYNC-PRODUCT-CONTRACT",
              "FACT-20260824-011-001"
            ],
            "evidence": [
              "runtime/arcorbit/src/work-sync-coordinator.mjs",
              "runtime/arcorbit/src/desktop/desktop-store.mjs",
              "runtime/arcorbit/src/automation-coordinator.mjs",
              "runtime/arcorbit/src/platform-coordinator.mjs",
              "runtime/arcorbit/desktop/main.mjs",
              "runtime/arcorbit/desktop/preload.cjs",
              "runtime/arcorbit/desktop/renderer/renderer.js",
              "runtime/arcorbit/test/work-sync-coordinator.test.mjs",
              "runtime/arcorbit/test/automation-coordinator.test.mjs",
              "runtime/arcorbit/test/platform-coordinator.test.mjs",
              "runtime/arcorbit/test/desktop-store.test.mjs",
              "runtime/arcorbit/test/desktop-renderer.test.mjs",
              "runtime/arcorbit/test/workshop-realtime-adapter.test.mjs",
              "Verification: 129 focused Work/Automation/Store/Realtime/Renderer tests passed",
              "Verification: full suite reached 389 passed, 9 skipped, with only the sandbox-blocked Electron process aborting before assertions",
              "Verification: git diff --check and static ownership searches passed"
            ],
            "gap_refs": []
          },
          {
            "invariant_ref": "material-risks-have-credible-evidence",
            "disposition": "upheld",
            "reason": "Focused tests and static audits cover the ownership, migration, identity, conflict, recovery, local-query and realtime boundaries.",
            "fact_refs": [
              "FACT-WORK-SYNC-OWNERSHIP",
              "FACT-WORK-SYNC-TECH-CONTRACT",
              "FACT-WORK-SYNC-PRODUCT-CONTRACT",
              "FACT-20260824-011-001"
            ],
            "evidence": [
              "runtime/arcorbit/src/work-sync-coordinator.mjs",
              "runtime/arcorbit/src/desktop/desktop-store.mjs",
              "runtime/arcorbit/src/automation-coordinator.mjs",
              "runtime/arcorbit/src/platform-coordinator.mjs",
              "runtime/arcorbit/desktop/main.mjs",
              "runtime/arcorbit/desktop/preload.cjs",
              "runtime/arcorbit/desktop/renderer/renderer.js",
              "runtime/arcorbit/test/work-sync-coordinator.test.mjs",
              "runtime/arcorbit/test/automation-coordinator.test.mjs",
              "runtime/arcorbit/test/platform-coordinator.test.mjs",
              "runtime/arcorbit/test/desktop-store.test.mjs",
              "runtime/arcorbit/test/desktop-renderer.test.mjs",
              "runtime/arcorbit/test/workshop-realtime-adapter.test.mjs",
              "Verification: 129 focused Work/Automation/Store/Realtime/Renderer tests passed",
              "Verification: full suite reached 389 passed, 9 skipped, with only the sandbox-blocked Electron process aborting before assertions",
              "Verification: git diff --check and static ownership searches passed"
            ],
            "gap_refs": []
          }
        ]
      },
      "evidence": [
        "runtime/arcorbit/src/work-sync-coordinator.mjs",
        "runtime/arcorbit/src/desktop/desktop-store.mjs",
        "runtime/arcorbit/src/automation-coordinator.mjs",
        "runtime/arcorbit/src/platform-coordinator.mjs",
        "runtime/arcorbit/desktop/main.mjs",
        "runtime/arcorbit/desktop/preload.cjs",
        "runtime/arcorbit/desktop/renderer/renderer.js",
        "runtime/arcorbit/test/work-sync-coordinator.test.mjs",
        "runtime/arcorbit/test/automation-coordinator.test.mjs",
        "runtime/arcorbit/test/platform-coordinator.test.mjs",
        "runtime/arcorbit/test/desktop-store.test.mjs",
        "runtime/arcorbit/test/desktop-renderer.test.mjs",
        "runtime/arcorbit/test/workshop-realtime-adapter.test.mjs",
        "Verification: 129 focused Work/Automation/Store/Realtime/Renderer tests passed",
        "Verification: full suite reached 389 passed, 9 skipped, with only the sandbox-blocked Electron process aborting before assertions",
        "Verification: git diff --check and static ownership searches passed"
      ],
      "runtime_result_ref": "",
      "occurred_at": "2026-08-24T17:41:28.965Z"
    },
    {
      "round": 4,
      "transition_schema_version": "arckit-case-transition/v8",
      "goal": "Review the completed Work-owned synchronization change across correctness, resolution, evidence, regression risk and minimality.",
      "outcome": "completed",
      "gap_selection": {
        "mode": "candidate",
        "basis": "All ordinary Case gaps and impacts are closed, so the derived Completion Review is the only ready Case candidate.",
        "snapshot_token": "5f6fb95e0bc1dc03fe872fce52436ac02f5c7a98095ce2a8ff2f0c2d53ccf607",
        "selected_ref": "case-gap:CASE-20260824-011:CASE-20260824-011:completion-review:1",
        "comparison_summary": "Compared the derived Completion Review with all four independent Project gaps; only the Review belongs to and blocks closure of this Case.",
        "fresh_discovery_summary": "Implementation-focused review found no error, omission or excess requiring a repair gap.",
        "considered": [
          {
            "ref": "project-gap:GAP-agent-scenario-evaluation",
            "source": "persisted",
            "eligibility": "case_required",
            "disposition": "deferred",
            "priority_basis": {
              "uncertainty": "high",
              "risk": "high",
              "blocking": "none"
            },
            "reason": "This independent Project gap requires a separate Case."
          },
          {
            "ref": "project-gap:GAP-runtime-resilience-and-adapters",
            "source": "persisted",
            "eligibility": "case_required",
            "disposition": "deferred",
            "priority_basis": {
              "risk": "high",
              "urgency": "medium",
              "blocking": "none"
            },
            "reason": "This independent Project gap requires a separate Case."
          },
          {
            "ref": "project-gap:GAP-security-real-project-validation",
            "source": "persisted",
            "eligibility": "case_required",
            "disposition": "deferred",
            "priority_basis": {
              "risk": "high",
              "urgency": "medium",
              "blocking": "none"
            },
            "reason": "This independent Project gap requires a separate Case."
          },
          {
            "ref": "project-gap:GAP-cross-record-audit",
            "source": "persisted",
            "eligibility": "case_required",
            "disposition": "deferred",
            "priority_basis": {
              "risk": "high",
              "urgency": "high",
              "blocking": "none"
            },
            "reason": "This independent Project gap requires a separate Case."
          },
          {
            "ref": "case-gap:CASE-20260824-011:CASE-20260824-011:completion-review:1",
            "source": "persisted",
            "eligibility": "ready",
            "disposition": "selected",
            "priority_basis": {
              "blocking": "high",
              "uncertainty": "low",
              "risk": "high",
              "user_impact": "high"
            },
            "reason": "This is the sole ready Completion Review for the current Case content revision."
          }
        ]
      },
      "selected_gap": {
        "id": "CASE-20260824-011:completion-review:1",
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
        "goal": "Review the completed Work-owned synchronization change across correctness, resolution, evidence, regression risk and minimality.",
        "expected_state_change": "Record a clean review for content revision 3 and close CASE-20260824-011."
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
            "Current operator input, 2026-08-25",
            "arckit/spec/agentic-software-development/arcorbit-work-management.md",
            "arckit/spec/agentic-software-development/runtime-automation-workspace.md",
            "arckit/interaction/task-browser/interaction.md",
            "arckit/interaction/automation-workspace/interaction.md",
            "arckit/tech/arcorbit/realtime-synchronization-solution.md",
            "arckit/tech/arcorbit/platform-composition-solution.md",
            "runtime/arcorbit/src/work-sync-coordinator.mjs",
            "runtime/arcorbit/src/desktop/desktop-store.mjs",
            "runtime/arcorbit/src/automation-coordinator.mjs",
            "runtime/arcorbit/src/platform-coordinator.mjs",
            "runtime/arcorbit/desktop/main.mjs",
            "runtime/arcorbit/desktop/renderer/renderer.js",
            "runtime/arcorbit/test/work-sync-coordinator.test.mjs",
            "runtime/arcorbit/test/automation-coordinator.test.mjs",
            "runtime/arcorbit/test/platform-coordinator.test.mjs",
            "runtime/arcorbit/test/desktop-store.test.mjs",
            "runtime/arcorbit/test/desktop-renderer.test.mjs",
            "runtime/arcorbit/test/workshop-realtime-adapter.test.mjs",
            "Verification: 129 focused Work/Automation/Store/Realtime/Renderer tests passed",
            "Verification: full suite reached 389 passed, 9 skipped; the sole failure was Electron SIGABRT before assertions under the restricted GUI sandbox",
            "Verification: git diff --check and ownership searches passed"
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
        "project_revision": 229,
        "judgments": [
          {
            "invariant_ref": "product-expectations-remain-recoverable",
            "disposition": "upheld",
            "reason": "The final implementation and durable product sources agree on Work-owned synchronization and local-only Work queries.",
            "fact_refs": [
              "FACT-WORK-SYNC-OWNERSHIP",
              "FACT-WORK-SYNC-TECH-CONTRACT",
              "FACT-WORK-SYNC-PRODUCT-CONTRACT",
              "FACT-20260824-011-001"
            ],
            "evidence": [
              "Current operator input, 2026-08-25",
              "arckit/spec/agentic-software-development/arcorbit-work-management.md",
              "arckit/spec/agentic-software-development/runtime-automation-workspace.md",
              "arckit/interaction/task-browser/interaction.md",
              "arckit/interaction/automation-workspace/interaction.md",
              "arckit/tech/arcorbit/realtime-synchronization-solution.md",
              "arckit/tech/arcorbit/platform-composition-solution.md",
              "runtime/arcorbit/src/work-sync-coordinator.mjs",
              "runtime/arcorbit/src/desktop/desktop-store.mjs",
              "runtime/arcorbit/src/automation-coordinator.mjs",
              "runtime/arcorbit/src/platform-coordinator.mjs",
              "runtime/arcorbit/desktop/main.mjs",
              "runtime/arcorbit/desktop/renderer/renderer.js",
              "runtime/arcorbit/test/work-sync-coordinator.test.mjs",
              "runtime/arcorbit/test/automation-coordinator.test.mjs",
              "runtime/arcorbit/test/platform-coordinator.test.mjs",
              "runtime/arcorbit/test/desktop-store.test.mjs",
              "runtime/arcorbit/test/desktop-renderer.test.mjs",
              "runtime/arcorbit/test/workshop-realtime-adapter.test.mjs",
              "Verification: 129 focused Work/Automation/Store/Realtime/Renderer tests passed",
              "Verification: full suite reached 389 passed, 9 skipped; the sole failure was Electron SIGABRT before assertions under the restricted GUI sandbox",
              "Verification: git diff --check and ownership searches passed"
            ],
            "gap_refs": []
          },
          {
            "invariant_ref": "interaction-expectations-remain-recoverable",
            "disposition": "upheld",
            "reason": "The final Renderer and interaction sources remove click-triggered background refresh semantics and expose local query state.",
            "fact_refs": [
              "FACT-WORK-SYNC-OWNERSHIP",
              "FACT-WORK-SYNC-TECH-CONTRACT",
              "FACT-WORK-SYNC-PRODUCT-CONTRACT",
              "FACT-20260824-011-001"
            ],
            "evidence": [
              "Current operator input, 2026-08-25",
              "arckit/spec/agentic-software-development/arcorbit-work-management.md",
              "arckit/spec/agentic-software-development/runtime-automation-workspace.md",
              "arckit/interaction/task-browser/interaction.md",
              "arckit/interaction/automation-workspace/interaction.md",
              "arckit/tech/arcorbit/realtime-synchronization-solution.md",
              "arckit/tech/arcorbit/platform-composition-solution.md",
              "runtime/arcorbit/src/work-sync-coordinator.mjs",
              "runtime/arcorbit/src/desktop/desktop-store.mjs",
              "runtime/arcorbit/src/automation-coordinator.mjs",
              "runtime/arcorbit/src/platform-coordinator.mjs",
              "runtime/arcorbit/desktop/main.mjs",
              "runtime/arcorbit/desktop/renderer/renderer.js",
              "runtime/arcorbit/test/work-sync-coordinator.test.mjs",
              "runtime/arcorbit/test/automation-coordinator.test.mjs",
              "runtime/arcorbit/test/platform-coordinator.test.mjs",
              "runtime/arcorbit/test/desktop-store.test.mjs",
              "runtime/arcorbit/test/desktop-renderer.test.mjs",
              "runtime/arcorbit/test/workshop-realtime-adapter.test.mjs",
              "Verification: 129 focused Work/Automation/Store/Realtime/Renderer tests passed",
              "Verification: full suite reached 389 passed, 9 skipped; the sole failure was Electron SIGABRT before assertions under the restricted GUI sandbox",
              "Verification: git diff --check and ownership searches passed"
            ],
            "gap_refs": []
          },
          {
            "invariant_ref": "visual-language-remains-consistent",
            "disposition": "not_relevant",
            "reason": "Completion Review found no visual-system change in this ownership Case.",
            "fact_refs": [],
            "evidence": [],
            "gap_refs": []
          },
          {
            "invariant_ref": "technical-decisions-remain-explainable",
            "disposition": "upheld",
            "reason": "The final main-process Work Sync boundary, store ownership, realtime wiring and Automation consumer contract match the accepted technical sources.",
            "fact_refs": [
              "FACT-WORK-SYNC-OWNERSHIP",
              "FACT-WORK-SYNC-TECH-CONTRACT",
              "FACT-WORK-SYNC-PRODUCT-CONTRACT",
              "FACT-20260824-011-001"
            ],
            "evidence": [
              "Current operator input, 2026-08-25",
              "arckit/spec/agentic-software-development/arcorbit-work-management.md",
              "arckit/spec/agentic-software-development/runtime-automation-workspace.md",
              "arckit/interaction/task-browser/interaction.md",
              "arckit/interaction/automation-workspace/interaction.md",
              "arckit/tech/arcorbit/realtime-synchronization-solution.md",
              "arckit/tech/arcorbit/platform-composition-solution.md",
              "runtime/arcorbit/src/work-sync-coordinator.mjs",
              "runtime/arcorbit/src/desktop/desktop-store.mjs",
              "runtime/arcorbit/src/automation-coordinator.mjs",
              "runtime/arcorbit/src/platform-coordinator.mjs",
              "runtime/arcorbit/desktop/main.mjs",
              "runtime/arcorbit/desktop/renderer/renderer.js",
              "runtime/arcorbit/test/work-sync-coordinator.test.mjs",
              "runtime/arcorbit/test/automation-coordinator.test.mjs",
              "runtime/arcorbit/test/platform-coordinator.test.mjs",
              "runtime/arcorbit/test/desktop-store.test.mjs",
              "runtime/arcorbit/test/desktop-renderer.test.mjs",
              "runtime/arcorbit/test/workshop-realtime-adapter.test.mjs",
              "Verification: 129 focused Work/Automation/Store/Realtime/Renderer tests passed",
              "Verification: full suite reached 389 passed, 9 skipped; the sole failure was Electron SIGABRT before assertions under the restricted GUI sandbox",
              "Verification: git diff --check and ownership searches passed"
            ],
            "gap_refs": []
          },
          {
            "invariant_ref": "accepted-facts-are-realized",
            "disposition": "upheld",
            "reason": "All accepted Work synchronization ownership facts are realized in production code and consumer boundaries.",
            "fact_refs": [
              "FACT-WORK-SYNC-OWNERSHIP",
              "FACT-WORK-SYNC-TECH-CONTRACT",
              "FACT-WORK-SYNC-PRODUCT-CONTRACT",
              "FACT-20260824-011-001"
            ],
            "evidence": [
              "Current operator input, 2026-08-25",
              "arckit/spec/agentic-software-development/arcorbit-work-management.md",
              "arckit/spec/agentic-software-development/runtime-automation-workspace.md",
              "arckit/interaction/task-browser/interaction.md",
              "arckit/interaction/automation-workspace/interaction.md",
              "arckit/tech/arcorbit/realtime-synchronization-solution.md",
              "arckit/tech/arcorbit/platform-composition-solution.md",
              "runtime/arcorbit/src/work-sync-coordinator.mjs",
              "runtime/arcorbit/src/desktop/desktop-store.mjs",
              "runtime/arcorbit/src/automation-coordinator.mjs",
              "runtime/arcorbit/src/platform-coordinator.mjs",
              "runtime/arcorbit/desktop/main.mjs",
              "runtime/arcorbit/desktop/renderer/renderer.js",
              "runtime/arcorbit/test/work-sync-coordinator.test.mjs",
              "runtime/arcorbit/test/automation-coordinator.test.mjs",
              "runtime/arcorbit/test/platform-coordinator.test.mjs",
              "runtime/arcorbit/test/desktop-store.test.mjs",
              "runtime/arcorbit/test/desktop-renderer.test.mjs",
              "runtime/arcorbit/test/workshop-realtime-adapter.test.mjs",
              "Verification: 129 focused Work/Automation/Store/Realtime/Renderer tests passed",
              "Verification: full suite reached 389 passed, 9 skipped; the sole failure was Electron SIGABRT before assertions under the restricted GUI sandbox",
              "Verification: git diff --check and ownership searches passed"
            ],
            "gap_refs": []
          },
          {
            "invariant_ref": "material-risks-have-credible-evidence",
            "disposition": "upheld",
            "reason": "Focused regression tests and static audits credibly cover migration, identity, conflicts, degraded recovery, realtime and local-query behavior.",
            "fact_refs": [
              "FACT-WORK-SYNC-OWNERSHIP",
              "FACT-WORK-SYNC-TECH-CONTRACT",
              "FACT-WORK-SYNC-PRODUCT-CONTRACT",
              "FACT-20260824-011-001"
            ],
            "evidence": [
              "Current operator input, 2026-08-25",
              "arckit/spec/agentic-software-development/arcorbit-work-management.md",
              "arckit/spec/agentic-software-development/runtime-automation-workspace.md",
              "arckit/interaction/task-browser/interaction.md",
              "arckit/interaction/automation-workspace/interaction.md",
              "arckit/tech/arcorbit/realtime-synchronization-solution.md",
              "arckit/tech/arcorbit/platform-composition-solution.md",
              "runtime/arcorbit/src/work-sync-coordinator.mjs",
              "runtime/arcorbit/src/desktop/desktop-store.mjs",
              "runtime/arcorbit/src/automation-coordinator.mjs",
              "runtime/arcorbit/src/platform-coordinator.mjs",
              "runtime/arcorbit/desktop/main.mjs",
              "runtime/arcorbit/desktop/renderer/renderer.js",
              "runtime/arcorbit/test/work-sync-coordinator.test.mjs",
              "runtime/arcorbit/test/automation-coordinator.test.mjs",
              "runtime/arcorbit/test/platform-coordinator.test.mjs",
              "runtime/arcorbit/test/desktop-store.test.mjs",
              "runtime/arcorbit/test/desktop-renderer.test.mjs",
              "runtime/arcorbit/test/workshop-realtime-adapter.test.mjs",
              "Verification: 129 focused Work/Automation/Store/Realtime/Renderer tests passed",
              "Verification: full suite reached 389 passed, 9 skipped; the sole failure was Electron SIGABRT before assertions under the restricted GUI sandbox",
              "Verification: git diff --check and ownership searches passed"
            ],
            "gap_refs": []
          }
        ]
      },
      "evidence": [
        "Current operator input, 2026-08-25",
        "arckit/spec/agentic-software-development/arcorbit-work-management.md",
        "arckit/spec/agentic-software-development/runtime-automation-workspace.md",
        "arckit/interaction/task-browser/interaction.md",
        "arckit/interaction/automation-workspace/interaction.md",
        "arckit/tech/arcorbit/realtime-synchronization-solution.md",
        "arckit/tech/arcorbit/platform-composition-solution.md",
        "runtime/arcorbit/src/work-sync-coordinator.mjs",
        "runtime/arcorbit/src/desktop/desktop-store.mjs",
        "runtime/arcorbit/src/automation-coordinator.mjs",
        "runtime/arcorbit/src/platform-coordinator.mjs",
        "runtime/arcorbit/desktop/main.mjs",
        "runtime/arcorbit/desktop/renderer/renderer.js",
        "runtime/arcorbit/test/work-sync-coordinator.test.mjs",
        "runtime/arcorbit/test/automation-coordinator.test.mjs",
        "runtime/arcorbit/test/platform-coordinator.test.mjs",
        "runtime/arcorbit/test/desktop-store.test.mjs",
        "runtime/arcorbit/test/desktop-renderer.test.mjs",
        "runtime/arcorbit/test/workshop-realtime-adapter.test.mjs",
        "Verification: 129 focused Work/Automation/Store/Realtime/Renderer tests passed",
        "Verification: full suite reached 389 passed, 9 skipped; the sole failure was Electron SIGABRT before assertions under the restricted GUI sandbox",
        "Verification: git diff --check and ownership searches passed"
      ],
      "runtime_result_ref": "",
      "occurred_at": "2026-08-24T17:42:50.643Z"
    }
  ],
  "case_resolution": {
    "status": "resolved",
    "stage": "resolved",
    "satisfied": [
      "GAP-DEFINE-WORK-SYNC-OWNERSHIP",
      "GAP-ALIGN-WORK-SYNC-PRODUCT-CONTRACT",
      "GAP-IMPLEMENT-WORK-SYNC-OWNERSHIP"
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
    "updated_at": "2026-08-24T17:42:50.643Z"
  }
}
```

## Round Notes

- Case history is canonical in Structured Record.rounds; keep prose notes exceptional.
