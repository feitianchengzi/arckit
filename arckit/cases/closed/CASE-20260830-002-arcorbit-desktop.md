# 建立 ArcOrbit 版本化 Desktop 状态内核与增量投影架构

Case: CASE-20260830-002
Status: closed
Artifact Type: mixed
Selected Gap: none
Updated: 2026-08-30T09:57:45.516Z

## User Intent

消除 ArcOrbit 活跃运行期间由单体 Desktop Store 全量重读、lane 投影重复派生和重叠 Snapshot 引起的主进程高 CPU，并建立可扩展的状态所有权、持久化、查询和增量 IPC 架构。

## Structured Record

```json
{
  "schema_version": "development-case-record/v5",
  "id": "CASE-20260830-002",
  "title": "建立 ArcOrbit 版本化 Desktop 状态内核与增量投影架构",
  "status": "closed",
  "artifact_type": "mixed",
  "created_at": "2026-08-30T09:24:31.735Z",
  "updated_at": "2026-08-30T09:57:45.516Z",
  "user_intent": "消除 ArcOrbit 活跃运行期间由单体 Desktop Store 全量重读、lane 投影重复派生和重叠 Snapshot 引起的主进程高 CPU，并建立可扩展的状态所有权、持久化、查询和增量 IPC 架构。",
  "expected_outcome": "ArcOrbit 使用单写者版本化状态内核、一次 state view 的 Automation 投影、真正 single-flight 的局部活动同步和分层持久化，并以性能、恢复、并发和文档一致性测试证明实现符合已采用技术事实。",
  "project_state_ref": "arckit/project/state.record.json",
  "current_round": {
    "goal": "",
    "selected_gap": null
  },
  "facts": [
    {
      "id": "FACT-20260830-002-001",
      "revision": 1,
      "status": "accepted",
      "statement": "ArcOrbit 当前在活跃 Run 的局部 activity invalidation 路径中反复读取并规范化完整 desktop-store.json，Automation 顶层与 overview/workspace lanes 又各自重复构造全局 Snapshot，导致 Electron main CPU 随 Store 体积、lane 数和事件频率放大。",
      "basis": "实时进程采样、4.46 MB Store 基准和现有调用链共同证明高 CPU 与活跃 Run 生命周期同步，并由重复全量状态读取而非 Codex、Renderer 或 GPU 子进程主导。",
      "evidence": [
        "Current operator input, 2026-08-30",
        "runtime/arcorbit/src/desktop/desktop-store.mjs",
        "runtime/arcorbit/src/automation-coordinator.mjs",
        "runtime/arcorbit/src/desktop-run-manager.mjs",
        "runtime/arcorbit/desktop/renderer/renderer.js",
        "arckit/tech/arcorbit/desktop-execution-solution.md"
      ]
    },
    {
      "id": "FACT-20260830-002-002",
      "revision": 1,
      "status": "accepted",
      "statement": "ArcOrbit Desktop 本地状态采用 Electron main 单写者版本化 State Kernel；一次 query 只捕获一个 immutable state view，lane 使用纯 selector，共享 projection index，运行 activity 通过 revisioned patch 增量同步，控制事实、可重建投影、session/Run evidence 按所有权分层持久化。",
      "basis": "采用中的技术方案已明确该架构及其性能、迁移、崩溃恢复和 revision gap 验收不变量。",
      "evidence": [
        "arckit/tech/arcorbit/solution.md",
        "arckit/tech/arcorbit/desktop-execution-solution.md",
        "arckit/tech/INDEX.md"
      ]
    },
    {
      "id": "FACT-20260830-002-003",
      "revision": 1,
      "status": "accepted",
      "statement": "ArcOrbit Desktop Store 已实现 main-process 单写者内存 State Kernel：durable state 仅首次加载，写事务串行且持久化成功后发布单调 revision；Automation 每次 snapshot 捕获一个 state view，并让 overview 与全部 workspace lanes 共享 local project 和 Run summary index，通过无全局 structuredClone 的 lane selector 派生。",
      "basis": "代码实现、I/O 计数测试和三 lane 集成测试共同证明目标 query/mutation 边界已兑现。",
      "evidence": [
        "runtime/arcorbit/src/desktop/desktop-store.mjs",
        "runtime/arcorbit/src/desktop-run-manager.mjs",
        "runtime/arcorbit/src/automation-coordinator.mjs",
        "runtime/arcorbit/test/desktop-store.test.mjs",
        "runtime/arcorbit/test/automation-coordinator.test.mjs"
      ]
    },
    {
      "id": "FACT-20260830-002-004",
      "revision": 1,
      "status": "accepted",
      "statement": "ArcOrbit 的 run.activity_changed 已携带 owner 与单调 revision 的 run.activity.patch/v1；Renderer 只对当前可见 owner 排队，在一个严格 single-flight 队列中顺序应用连续 patch，revision gap 仅请求目标 Run 的 run.activity.snapshot/v1，正常流式路径不再构造 Automation Snapshot。",
      "basis": "typed patch 生成/应用测试、owner 测试、100 invalidation single-flight 测试和 Renderer 静态 IPC 边界测试通过。",
      "evidence": [
        "runtime/arcorbit/src/projection/run-activity-patch.mjs",
        "runtime/arcorbit/src/desktop-run-manager.mjs",
        "runtime/arcorbit/desktop/renderer/run-activity-sync.mjs",
        "runtime/arcorbit/desktop/renderer/renderer.js",
        "runtime/arcorbit/test/run-activity-sync.test.mjs",
        "runtime/arcorbit/test/desktop-renderer.test.mjs"
      ]
    },
    {
      "id": "FACT-20260830-002-005",
      "revision": 1,
      "status": "accepted",
      "statement": "ArcOrbit Desktop Store v17 以 desktop-state-partitions/v1 manifest 管理 compact control snapshot、lazy session message partition 和独立 Task Projection partition；Run activity/messages/result 继续位于目标 Run evidence 目录。分区先写、manifest 最后提交，失败会删除未提交分区并保留旧 control；生产 control query/update 不加载历史 messages。",
      "basis": "分区实现、legacy migration、manifest commit rollback、Chat persistence、Work projection 和 Run recovery 测试共同证明所有权与恢复边界。",
      "evidence": [
        "runtime/arcorbit/src/desktop/desktop-store.mjs",
        "runtime/arcorbit/src/desktop-run-manager.mjs",
        "runtime/arcorbit/src/chat-coordinator.mjs",
        "runtime/arcorbit/test/desktop-store.test.mjs",
        "runtime/arcorbit/test/chat-coordinator.test.mjs",
        "runtime/arcorbit/test/desktop-run-manager.test.mjs"
      ]
    },
    {
      "id": "FACT-20260830-002-006",
      "revision": 1,
      "status": "accepted",
      "statement": "ArcOrbit Desktop State Kernel 架构验收通过：50 MiB 历史消息不进入 warm control snapshot，三个 lane 的 30 分钟等价 11,250 事件回放折算单核 CPU 0.01%、event-loop p99 12.70 ms、heap 增量 183,400 bytes；100 invalidation 保持严格 single-flight，v17 migration 和 manifest commit 故障恢复通过，技术文档与实现 schema/边界一致。",
      "basis": "可重复 benchmark、opt-in 性能测试、专项回归、全量测试和逐项文档实现审计共同支持该结论。",
      "evidence": [
        "arckit/tech/arcorbit/state-kernel-acceptance.md",
        "runtime/arcorbit/scripts/benchmark-state-kernel.mjs",
        "runtime/arcorbit/test/state-kernel-performance.test.mjs",
        "runtime/arcorbit/test/run-activity-sync.test.mjs",
        "runtime/arcorbit/test/desktop-store.test.mjs",
        "arckit/tech/arcorbit/desktop-execution-solution.md"
      ]
    }
  ],
  "state_impacts": [
    {
      "id": "IMPACT-20260830-002-001",
      "fact_id": "FACT-20260830-002-001",
      "fact_revision": 1,
      "target": {
        "kind": "software_decision",
        "ref": "technical_foundation",
        "revision": 46
      },
      "effect": "upheld",
      "reason": "State Kernel、共享 lane query 和 revisioned activity patch 已共同兑现采用中的 Desktop query/change contract。",
      "gap_ids": [],
      "evidence": [
        "runtime/arcorbit/src/desktop/desktop-store.mjs",
        "runtime/arcorbit/src/automation-coordinator.mjs",
        "runtime/arcorbit/src/projection/run-activity-patch.mjs",
        "runtime/arcorbit/desktop/renderer/run-activity-sync.mjs"
      ]
    },
    {
      "id": "IMPACT-20260830-002-002",
      "fact_id": "FACT-20260830-002-001",
      "fact_revision": 1,
      "target": {
        "kind": "software_decision",
        "ref": "data_and_state",
        "revision": 21
      },
      "effect": "upheld",
      "reason": "control、messages、Task Projection 与 Run evidence 已按所有权分区，并具备 manifest 原子迁移/恢复。",
      "gap_ids": [],
      "evidence": [
        "runtime/arcorbit/src/desktop/desktop-store.mjs",
        "runtime/arcorbit/src/desktop-run-manager.mjs",
        "runtime/arcorbit/src/chat-coordinator.mjs",
        "runtime/arcorbit/test/desktop-store.test.mjs"
      ]
    },
    {
      "id": "IMPACT-20260830-002-003",
      "fact_id": "FACT-20260830-002-006",
      "fact_revision": 1,
      "target": {
        "kind": "software_decision",
        "ref": "quality_and_validation",
        "revision": 23
      },
      "effect": "upheld",
      "reason": "定义的性能、single-flight、迁移、崩溃恢复和文档一致性标准均已有直接可重复证据。",
      "gap_ids": [],
      "evidence": [
        "arckit/tech/arcorbit/state-kernel-acceptance.md",
        "runtime/arcorbit/test/state-kernel-performance.test.mjs",
        "runtime/arcorbit/test/run-activity-sync.test.mjs",
        "runtime/arcorbit/test/desktop-store.test.mjs",
        "npm run check: 578 tests, 555 passed, 23 skipped, 0 failed"
      ]
    }
  ],
  "gaps": [
    {
      "id": "GAP-20260830-002-001",
      "status": "resolved",
      "goal": "接受 ArcOrbit Desktop State Kernel、状态分层、单 state view 投影、revision/change-set、增量活动协议和性能恢复验收的完整技术契约。",
      "reason": "实现重构的对象、状态所有权、兼容边界和验收方式必须先成为稳定技术事实，避免仅以局部缓存或节流替代架构目标。",
      "derived_from": [
        "FACT-20260830-002-001"
      ],
      "blocked_by": [],
      "priority_basis": {
        "risk": "high",
        "urgency": "high",
        "dependency": "blocks implementation architecture"
      },
      "responsibility": "agent",
      "evidence_required": [
        "arckit/tech/arcorbit/desktop-execution-solution.md 明确单写者状态内核、单 state view、revision/change-set、局部 patch 和恢复语义",
        "arckit/tech/arcorbit/solution.md 明确持久控制事实、可重建投影和 Run evidence 的所有权边界",
        "验收标准包含读取次数、并发、CPU/event-loop、恢复和迁移门槛"
      ],
      "resolution": {
        "id": "GAP-20260830-002-001",
        "status": "resolved",
        "outcome": "ArcOrbit Desktop State Kernel 与版本化增量投影架构已成为采用中的技术事实，并具备量化性能、恢复和迁移验收标准。",
        "reason": "两份采用中的 ArcOrbit 技术方案明确了所有权、query/mutation/change contract、持久化分区、revision gap、single-flight 和验收门槛。",
        "evidence": [
          "arckit/tech/arcorbit/solution.md",
          "arckit/tech/arcorbit/desktop-execution-solution.md",
          "arckit/tech/INDEX.md"
        ],
        "occurred_at": "2026-08-30T09:28:43.695Z"
      }
    },
    {
      "id": "GAP-20260830-002-002",
      "status": "resolved",
      "goal": "实现单写者版本化 Desktop State Kernel，并让 Automation overview 与所有 workspace lanes 从同一内存 state view 和 Run summary index 派生。",
      "reason": "当前 readStore 每次重读完整文件，lane proxy 与多层 getSnapshot 重复读取和复制全局状态。",
      "derived_from": [
        "FACT-20260830-002-001",
        "FACT-20260830-002-002"
      ],
      "blocked_by": [],
      "priority_basis": {
        "blocking": "high",
        "risk": "high",
        "urgency": "high"
      },
      "responsibility": "agent",
      "evidence_required": [
        "状态查询 warm path 零磁盘全量读取",
        "Automation Snapshot 每次只捕获一个 state view",
        "lane 数不增加 Store 读取次数或完整全局 clone",
        "相关单元与集成测试通过"
      ],
      "resolution": {
        "id": "GAP-20260830-002-002",
        "status": "resolved",
        "outcome": "Desktop Store 已成为单加载、串行写入、单调 revision 的内存状态内核；Automation 多 lane snapshot 从同一 view 和共享索引派生。",
        "reason": "写入只在原子持久化成功后替换 current state；兼容读取返回隔离副本，query capture 共享稳定 state；定向测试证明 warm path 与三 lane 读取次数不随 lane 数增长。",
        "evidence": [
          "runtime/arcorbit/src/desktop/desktop-store.mjs",
          "runtime/arcorbit/src/desktop-run-manager.mjs",
          "runtime/arcorbit/src/automation-coordinator.mjs",
          "runtime/arcorbit/test/desktop-store.test.mjs",
          "runtime/arcorbit/test/automation-coordinator.test.mjs",
          "node --test test/desktop-store.test.mjs test/desktop-run-manager.test.mjs test/automation-coordinator.test.mjs (91 passed)"
        ],
        "occurred_at": "2026-08-30T09:35:17.422Z"
      }
    },
    {
      "id": "GAP-20260830-002-003",
      "status": "resolved",
      "goal": "实现带 revision 的 run.activity patch、Renderer owner 校验和真正 single-flight 的局部同步，正常流式路径不再拉取完整 Automation Snapshot。",
      "reason": "现有 activityRefreshQueued 在异步请求完成前释放，允许重叠全量 Snapshot，并缺少 revision gap 恢复。",
      "derived_from": [
        "FACT-20260830-002-002"
      ],
      "blocked_by": [
        "GAP-20260830-002-002"
      ],
      "priority_basis": {
        "blocking": "medium",
        "risk": "high",
        "user_impact": "high"
      },
      "responsibility": "agent",
      "evidence_required": [
        "连续 invalidation 最多一个 in-flight 同步",
        "连续 revision 只应用 patch",
        "revision gap 回退一次 detail/full snapshot",
        "隐藏页面和旧 owner 不查询不采用"
      ],
      "resolution": {
        "id": "GAP-20260830-002-003",
        "status": "resolved",
        "outcome": "Run Manager 生成 run.activity.patch/v1；Renderer owner-check 后按 revision 严格单飞应用，revision gap 仅回退 run.activity.snapshot/v1。",
        "reason": "IPC、projector 与 Renderer 已形成 typed 增量链路，正常 activity invalidation 不再调用 Automation Snapshot。",
        "evidence": [
          "runtime/arcorbit/src/projection/run-activity-patch.mjs",
          "runtime/arcorbit/src/desktop-run-manager.mjs",
          "runtime/arcorbit/desktop/main.mjs",
          "runtime/arcorbit/desktop/preload.cjs",
          "runtime/arcorbit/desktop/renderer/run-activity-sync.mjs",
          "runtime/arcorbit/desktop/renderer/renderer.js",
          "runtime/arcorbit/test/run-activity-sync.test.mjs",
          "runtime/arcorbit/test/desktop-renderer.test.mjs",
          "node --test test/run-activity-sync.test.mjs test/token-usage-projector.test.mjs test/desktop-run-manager.test.mjs test/automation-coordinator.test.mjs test/desktop-renderer.test.mjs (157 passed)"
        ],
        "occurred_at": "2026-08-30T09:41:25.690Z"
      }
    },
    {
      "id": "GAP-20260830-002-004",
      "status": "resolved",
      "goal": "把 Desktop control snapshot、session messages、project Task Projection 和 Run evidence 分离为各自所有权分区，并提供原子迁移与恢复。",
      "reason": "当前 desktop-store.json 同时承载控制事实、消息历史和可重建投影，历史增长直接扩大所有控制查询和写入成本。",
      "derived_from": [
        "FACT-20260830-002-002"
      ],
      "blocked_by": [
        "GAP-20260830-002-002"
      ],
      "priority_basis": {
        "risk": "high",
        "scalability": "high"
      },
      "responsibility": "agent",
      "evidence_required": [
        "control snapshot 不内嵌历史消息、完整 Run activity 或 Task 列表",
        "旧 Store 一次迁移保持身份与控制事实",
        "迁移失败原子回滚且无长期双写",
        "显式 detail 查询只加载目标分区"
      ],
      "resolution": {
        "id": "GAP-20260830-002-004",
        "status": "resolved",
        "outcome": "Desktop Store v17 已用 manifest 事务分离 control、session messages 和 Task Projection；Run evidence 继续按 Run 目录独立持久化。",
        "reason": "新分区先写、control manifest 最后提交并清理旧分区；迁移失败保留 legacy control 且清理未提交文件；生产 control query 不加载 messages。",
        "evidence": [
          "runtime/arcorbit/src/desktop/desktop-store.mjs",
          "runtime/arcorbit/src/desktop-run-manager.mjs",
          "runtime/arcorbit/src/chat-coordinator.mjs",
          "runtime/arcorbit/test/desktop-store.test.mjs",
          "runtime/arcorbit/test/chat-coordinator.test.mjs",
          "runtime/arcorbit/test/desktop-run-manager.test.mjs",
          "runtime/arcorbit/test/work-sync-coordinator.test.mjs",
          "122 related tests passed"
        ],
        "occurred_at": "2026-08-30T09:47:41.953Z"
      }
    },
    {
      "id": "GAP-20260830-002-005",
      "status": "resolved",
      "goal": "完成大 Store、多 lane、持续流式、崩溃恢复和文档实现一致性的架构验收。",
      "reason": "CPU 问题必须用读取次数、并发、event-loop、内存和恢复证据证明消失，而不能只依赖功能测试。",
      "derived_from": [
        "FACT-20260830-002-001",
        "FACT-20260830-002-002"
      ],
      "blocked_by": [
        "GAP-20260830-002-002",
        "GAP-20260830-002-003",
        "GAP-20260830-002-004"
      ],
      "priority_basis": {
        "blocking": "high",
        "risk": "high"
      },
      "responsibility": "agent",
      "evidence_required": [
        "50 MB evidence fixture 的 warm snapshot 成本不随历史增长",
        "三 lane 30 分钟 CPU/event-loop/内存报告",
        "100 invalidation single-flight 回归",
        "crash/restart 与 migration fixture",
        "tech 文档和实现边界审计"
      ],
      "resolution": {
        "id": "GAP-20260830-002-005",
        "status": "resolved",
        "outcome": "Desktop State Kernel 架构验收通过。",
        "reason": "50 MiB warm snapshot、三 lane 30 分钟等价事件回放、100 invalidation single-flight、迁移故障注入、专项与全量测试以及文档实现审计均已完成。",
        "evidence": [
          "arckit/tech/arcorbit/state-kernel-acceptance.md",
          "runtime/arcorbit/scripts/benchmark-state-kernel.mjs",
          "runtime/arcorbit/test/state-kernel-performance.test.mjs",
          "runtime/arcorbit/test/run-activity-sync.test.mjs",
          "runtime/arcorbit/test/desktop-store.test.mjs",
          "npm run check: 578 tests, 555 passed, 23 skipped, 0 failed"
        ],
        "occurred_at": "2026-08-30T09:56:40.711Z"
      }
    }
  ],
  "content_revision": 5,
  "completion_review": {
    "status": "clean",
    "policy": {
      "initial_max_cycles": 4,
      "source": "User-authorized complete architecture implementation, 2026-08-30",
      "snapshotted_at": "2026-08-30T09:24:31.735Z"
    },
    "additional_cycles_authorized": 0,
    "cycle_count": 1,
    "reviewed_content_revision": 5,
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
        "content_revision": 5,
        "dimensions": {
          "implementation_correctness": "clean",
          "problem_resolution": "clean",
          "verification_credibility": "clean",
          "regression_risk": "clean",
          "minimality": "clean"
        },
        "finding_ids": [],
        "evidence": [
          "runtime/arcorbit/src/desktop/desktop-store.mjs",
          "runtime/arcorbit/src/automation-coordinator.mjs",
          "runtime/arcorbit/src/desktop-run-manager.mjs",
          "runtime/arcorbit/src/projection/run-activity-patch.mjs",
          "runtime/arcorbit/desktop/renderer/run-activity-sync.mjs",
          "runtime/arcorbit/test/desktop-store.test.mjs",
          "runtime/arcorbit/test/automation-coordinator.test.mjs",
          "runtime/arcorbit/test/run-activity-sync.test.mjs",
          "runtime/arcorbit/test/desktop-renderer.test.mjs",
          "runtime/arcorbit/test/state-kernel-performance.test.mjs",
          "arckit/tech/arcorbit/state-kernel-acceptance.md",
          "npm run check: 578 tests, 555 passed, 23 skipped, 0 failed"
        ],
        "occurred_at": "2026-08-30T09:57:45.516Z"
      }
    ],
    "evidence": [
      "runtime/arcorbit/src/desktop/desktop-store.mjs",
      "runtime/arcorbit/src/automation-coordinator.mjs",
      "runtime/arcorbit/src/desktop-run-manager.mjs",
      "runtime/arcorbit/src/projection/run-activity-patch.mjs",
      "runtime/arcorbit/desktop/renderer/run-activity-sync.mjs",
      "runtime/arcorbit/test/desktop-store.test.mjs",
      "runtime/arcorbit/test/automation-coordinator.test.mjs",
      "runtime/arcorbit/test/run-activity-sync.test.mjs",
      "runtime/arcorbit/test/desktop-renderer.test.mjs",
      "runtime/arcorbit/test/state-kernel-performance.test.mjs",
      "arckit/tech/arcorbit/state-kernel-acceptance.md",
      "npm run check: 578 tests, 555 passed, 23 skipped, 0 failed"
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
      "goal": "接受 ArcOrbit Desktop State Kernel、状态分层、单 state view 投影、revision/change-set、增量活动协议和性能恢复验收的完整技术契约。",
      "outcome": "completed",
      "gap_selection": {
        "mode": "candidate",
        "basis": "架构契约 Gap 是当前 Case 唯一 ready candidate，并阻塞全部实现工作。",
        "snapshot_token": "8c88257eccf11a2b35e471db6ef8543765d5fd6554c3a3607342e010a84c719e",
        "selected_ref": "case-gap:CASE-20260830-002:GAP-20260830-002-001",
        "comparison_summary": "比较了当前 Case Gap 与四个无关 Project gaps；选择本 Case 架构契约，其他候选延后。",
        "fresh_discovery_summary": "实现分析确认了状态内核、增量 activity、持久化分层和性能恢复四类下游义务，但它们依赖本轮架构事实，作为后续 gaps 写回而不在本轮执行。",
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
            "reason": "该 Project gap 与当前 Case 架构契约无直接依赖，保留给后续独立 Case。"
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
            "reason": "该 Project gap 与当前 Case 架构契约无直接依赖，保留给后续独立 Case。"
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
            "reason": "该 Project gap 与当前 Case 架构契约无直接依赖，保留给后续独立 Case。"
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
            "reason": "该 Project gap 与当前 Case 架构契约无直接依赖，保留给后续独立 Case。"
          },
          {
            "ref": "case-gap:CASE-20260830-002:GAP-20260830-002-001",
            "source": "persisted",
            "eligibility": "ready",
            "disposition": "selected",
            "priority_basis": {
              "blocking": "",
              "uncertainty": "",
              "risk": "high",
              "user_impact": "",
              "urgency": "high",
              "dependency": "blocks implementation architecture"
            },
            "reason": "该 Gap 已完成架构契约与量化验收定义，并阻塞全部后续实现。"
          }
        ]
      },
      "selected_gap": {
        "id": "GAP-20260830-002-001",
        "responsibility": "agent",
        "goal": "接受 ArcOrbit Desktop State Kernel、状态分层、单 state view 投影、revision/change-set、增量活动协议和性能恢复验收的完整技术契约。",
        "reason": "实现重构的对象、状态所有权、兼容边界和验收方式必须先成为稳定技术事实，避免仅以局部缓存或节流替代架构目标。",
        "derived_from": [
          "FACT-20260830-002-001"
        ],
        "blocked_by": [],
        "priority_basis": {
          "blocking": "",
          "uncertainty": "",
          "risk": "high",
          "user_impact": "",
          "urgency": "high",
          "dependency": "blocks implementation architecture"
        },
        "evidence_required": [
          "arckit/tech/arcorbit/desktop-execution-solution.md 明确单写者状态内核、单 state view、revision/change-set、局部 patch 和恢复语义",
          "arckit/tech/arcorbit/solution.md 明确持久控制事实、可重建投影和 Run evidence 的所有权边界",
          "验收标准包含读取次数、并发、CPU/event-loop、恢复和迁移门槛"
        ]
      },
      "planned_transition": {
        "goal": "接受 ArcOrbit Desktop State Kernel、状态分层、单 state view 投影、revision/change-set、增量活动协议和性能恢复验收的完整技术契约。",
        "expected_state_change": "将 State Kernel、状态分层、单 state view、revision/change-set、activity patch 和量化验收写入采用中的 ArcOrbit 技术方案，并建立后续实现义务。"
      },
      "accepted_state_delta": {
        "resolved_gap": {
          "id": "GAP-20260830-002-001",
          "status": "resolved",
          "outcome": "ArcOrbit Desktop State Kernel 与版本化增量投影架构已成为采用中的技术事实，并具备量化性能、恢复和迁移验收标准。",
          "reason": "两份采用中的 ArcOrbit 技术方案明确了所有权、query/mutation/change contract、持久化分区、revision gap、single-flight 和验收门槛。",
          "evidence": [
            "arckit/tech/arcorbit/solution.md",
            "arckit/tech/arcorbit/desktop-execution-solution.md",
            "arckit/tech/INDEX.md"
          ]
        },
        "facts_added": [
          {
            "id": "FACT-20260830-002-002",
            "revision": 1,
            "status": "accepted",
            "statement": "ArcOrbit Desktop 本地状态采用 Electron main 单写者版本化 State Kernel；一次 query 只捕获一个 immutable state view，lane 使用纯 selector，共享 projection index，运行 activity 通过 revisioned patch 增量同步，控制事实、可重建投影、session/Run evidence 按所有权分层持久化。",
            "basis": "采用中的技术方案已明确该架构及其性能、迁移、崩溃恢复和 revision gap 验收不变量。",
            "evidence": [
              "arckit/tech/arcorbit/solution.md",
              "arckit/tech/arcorbit/desktop-execution-solution.md",
              "arckit/tech/INDEX.md"
            ]
          }
        ],
        "facts_superseded": [],
        "impacts_added": [
          {
            "id": "IMPACT-20260830-002-003",
            "fact_id": "FACT-20260830-002-002",
            "fact_revision": 1,
            "target": {
              "kind": "software_decision",
              "ref": "quality_and_validation",
              "revision": 23
            },
            "effect": "threatened",
            "reason": "架构验收标准已定义，但大 Store、多 lane、持续流式和崩溃恢复证据尚未由最终实现满足。",
            "gap_ids": [
              "GAP-20260830-002-005"
            ],
            "evidence": [
              "arckit/tech/arcorbit/desktop-execution-solution.md"
            ]
          }
        ],
        "impacts_updated": [
          {
            "id": "IMPACT-20260830-002-001",
            "fact_id": "FACT-20260830-002-001",
            "fact_revision": 1,
            "target": {
              "kind": "software_decision",
              "ref": "technical_foundation",
              "revision": 46
            },
            "effect": "threatened",
            "reason": "目标 State Kernel 架构已接受，但现有 Store、Coordinator 和 Renderer 尚未实现该边界。",
            "gap_ids": [
              "GAP-20260830-002-002",
              "GAP-20260830-002-003"
            ],
            "evidence": [
              "arckit/tech/arcorbit/solution.md",
              "arckit/tech/arcorbit/desktop-execution-solution.md"
            ]
          },
          {
            "id": "IMPACT-20260830-002-002",
            "fact_id": "FACT-20260830-002-001",
            "fact_revision": 1,
            "target": {
              "kind": "software_decision",
              "ref": "data_and_state",
              "revision": 21
            },
            "effect": "threatened",
            "reason": "状态所有权与分区契约已接受，但单体 Desktop Store 仍需迁移到目标分层。",
            "gap_ids": [
              "GAP-20260830-002-002",
              "GAP-20260830-002-004"
            ],
            "evidence": [
              "arckit/tech/arcorbit/solution.md",
              "arckit/tech/arcorbit/desktop-execution-solution.md"
            ]
          }
        ],
        "gaps_added": [
          {
            "id": "GAP-20260830-002-002",
            "status": "open",
            "goal": "实现单写者版本化 Desktop State Kernel，并让 Automation overview 与所有 workspace lanes 从同一内存 state view 和 Run summary index 派生。",
            "reason": "当前 readStore 每次重读完整文件，lane proxy 与多层 getSnapshot 重复读取和复制全局状态。",
            "derived_from": [
              "FACT-20260830-002-001",
              "FACT-20260830-002-002"
            ],
            "blocked_by": [],
            "priority_basis": {
              "blocking": "high",
              "risk": "high",
              "urgency": "high"
            },
            "responsibility": "agent",
            "evidence_required": [
              "状态查询 warm path 零磁盘全量读取",
              "Automation Snapshot 每次只捕获一个 state view",
              "lane 数不增加 Store 读取次数或完整全局 clone",
              "相关单元与集成测试通过"
            ],
            "resolution": null
          },
          {
            "id": "GAP-20260830-002-003",
            "status": "open",
            "goal": "实现带 revision 的 run.activity patch、Renderer owner 校验和真正 single-flight 的局部同步，正常流式路径不再拉取完整 Automation Snapshot。",
            "reason": "现有 activityRefreshQueued 在异步请求完成前释放，允许重叠全量 Snapshot，并缺少 revision gap 恢复。",
            "derived_from": [
              "FACT-20260830-002-002"
            ],
            "blocked_by": [
              "GAP-20260830-002-002"
            ],
            "priority_basis": {
              "blocking": "medium",
              "risk": "high",
              "user_impact": "high"
            },
            "responsibility": "agent",
            "evidence_required": [
              "连续 invalidation 最多一个 in-flight 同步",
              "连续 revision 只应用 patch",
              "revision gap 回退一次 detail/full snapshot",
              "隐藏页面和旧 owner 不查询不采用"
            ],
            "resolution": null
          },
          {
            "id": "GAP-20260830-002-004",
            "status": "open",
            "goal": "把 Desktop control snapshot、session messages、project Task Projection 和 Run evidence 分离为各自所有权分区，并提供原子迁移与恢复。",
            "reason": "当前 desktop-store.json 同时承载控制事实、消息历史和可重建投影，历史增长直接扩大所有控制查询和写入成本。",
            "derived_from": [
              "FACT-20260830-002-002"
            ],
            "blocked_by": [
              "GAP-20260830-002-002"
            ],
            "priority_basis": {
              "risk": "high",
              "scalability": "high"
            },
            "responsibility": "agent",
            "evidence_required": [
              "control snapshot 不内嵌历史消息、完整 Run activity 或 Task 列表",
              "旧 Store 一次迁移保持身份与控制事实",
              "迁移失败原子回滚且无长期双写",
              "显式 detail 查询只加载目标分区"
            ],
            "resolution": null
          },
          {
            "id": "GAP-20260830-002-005",
            "status": "open",
            "goal": "完成大 Store、多 lane、持续流式、崩溃恢复和文档实现一致性的架构验收。",
            "reason": "CPU 问题必须用读取次数、并发、event-loop、内存和恢复证据证明消失，而不能只依赖功能测试。",
            "derived_from": [
              "FACT-20260830-002-001",
              "FACT-20260830-002-002"
            ],
            "blocked_by": [
              "GAP-20260830-002-002",
              "GAP-20260830-002-003",
              "GAP-20260830-002-004"
            ],
            "priority_basis": {
              "blocking": "high",
              "risk": "high"
            },
            "responsibility": "agent",
            "evidence_required": [
              "50 MB evidence fixture 的 warm snapshot 成本不随历史增长",
              "三 lane 30 分钟 CPU/event-loop/内存报告",
              "100 invalidation single-flight 回归",
              "crash/restart 与 migration fixture",
              "tech 文档和实现边界审计"
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
            "observed_revision": 45,
            "set_decision": {
              "status": "settled",
              "statement": "Arckit 与 ArcOrbit 的既有 ledger、Electron、Runtime、Platform Coordinator、Work Sync、Chat、Setup Readiness 和 trusted case-control 技术边界保持不变。Work Inspector 偏好继续由 Desktop Store、typed preload action 和 Renderer 持有。应用冷启动的 coordinated Setup Readiness 由 main process fresh-read Desktop Store 中全部本地 Product Workspace roots；新增或改变本地关联及用户主动 retry 使用相同 aggregate check，显式空 roots 清除既有 project plan 并执行 global-only。Renderer 项目/Workset 筛选不触发检查，解除关联跳过检查。SkillProvisioningManager.assertReady(projectRoot) 只读取内存 snapshot，要求 ready 且 project root 位于最近成功检查的 plan.project_roots；Chat/Automation task start 不调用 provider 或扫描 skills。SkillProvisioningManager 的 plan、drift、同名冲突诊断和 backup-and-overwrite-selected 事务边界保持不变。Feedback V1 恢复通过受控 update 同时写入 ignored=false、feedback_state=pending 和 status=analyzing；V2 恢复由 Platform Adapter、Coordinator、main IPC、preload 和 Renderer 的 restoreFeedbackV2 typed action 链调用固定 provider route，并只在服务端确认后刷新投影。新版启动必须执行有代际的 rehydration：规范化旧 Store、刷新可访问 Catalog、按需求集合协调对账并在 dispatch 前只开放健康项目。任务与标签独立确认；重建期间新增需求必须触发后续一轮，不能被进行中的 reconcile 吞掉。Case/Loop 继续保留 external_wait 作为内部停止原因；Automation Coordinator 将其确定性投影为 awaiting_human + external_dependency，Store 迁移旧 external_wait 并补建 attention，typed confirm-external-dependency IPC 校验 execution 后复用原 session/thread。Workset Feedback V2 notification snapshot 与 `/feedbacks/{id}/messages` 是两个独立新鲜度域；Renderer 以当前 feedback id、未读投影和有身份的会话加载状态协调刷新，不把 refreshSnapshot 视为消息已刷新。消息请求必须去重或隔离过期响应，并在成功投影消息后才调用 typed mark-read；失败不清除缓存消息或草稿。 Codex setup 将完整 InstallationInventory、active binding、InstallAdvisor、UpdateChecker、owner adapter 与 SetupNetworkContext 分层；路径分类仅作 hint，mutation 需要 owner proof，并以完整 inventory refresh 和 exact version/binding postcondition 判定成功。 ArcOrbit Desktop 本地状态由 Electron main 单写者版本化 State Kernel 持有；query 捕获单一 immutable state view，overview 与 workspace lanes 共享 projection index，运行状态通过 revisioned typed changes 增量投影。",
              "reason": "既有边界保持不变；ArcOrbit Desktop 本地状态由 Electron main 单写者版本化 State Kernel 持有；query 捕获单一 immutable state view，overview 与 workspace lanes 共享 projection index，运行状态通过 revisioned typed changes 增量投影。",
              "evidence": [
                "runtime/arcorbit/desktop/renderer/renderer.js:2324",
                "runtime/arcorbit/desktop/renderer/renderer.js:2380",
                "runtime/arcorbit/desktop/renderer/renderer.js:2514",
                "runtime/arcorbit/src/platform-coordinator.mjs:23",
                "runtime/arcorbit/src/workshop-platform-adapter.mjs:124",
                "arckit/tech/arcorbit/installer-supply-chain.md",
                "arckit/tech/arcorbit/solution.md",
                "arckit/tech/arcorbit/desktop-execution-solution.md"
              ],
              "confidence": "high",
              "resume_condition": "当 executable identity、package owner proof、update channel 或 mutation postcondition 改变时重审。",
              "revision": 45
            },
            "gap_refs": [
              "GAP-runtime-resilience-and-adapters"
            ],
            "reason": "高频运行投影需要稳定的状态所有权和查询成本边界。",
            "evidence": [
              "arckit/tech/arcorbit/solution.md",
              "arckit/tech/arcorbit/desktop-execution-solution.md"
            ]
          },
          {
            "area_ref": "data_and_state",
            "observed_revision": 20,
            "set_decision": {
              "status": "settled",
              "statement": "Canonical development state、Workshop 远端真相、ArcOrbit Task Projection、Automation execution、Chat session/thread 和 Case 绑定收据继续保持既有所有权边界。ArcOrbit Desktop Store 额外拥有全局 `platform.ui_preferences.work_inspector_width_px`，用于保存 360–640px 的 Work Inspector 用户选择宽度；它不属于 Workshop Task、按项目 workspace preference、Work Sync 投影或 Automation。缺失或非法值使用 440，窗口临时约束产生的有效宽度不写回保存值，任务、项目、Workset、登录身份切换和应用重启均不重置该偏好。 同名 skill 兜底覆盖的旧内容由 ArcOrbit userData 下仅当前用户可访问的 recovery area 和原子 recovery manifest 持有；全部已选项完成备份后才开始替换，失败时目标、catalog、loader 与 relation 回滚，未选内容不变。 ArcOrbit 项目状态分为 Project Catalog、Workspace Control 与 Task Readiness 三层；前两层的用户事实在覆盖安装时保留，任务、标签、游标、同步健康和 freshness 是可派生状态，必须由新版确定性重建。 Desktop control facts、可重建 projections、按 session/project/run 分区的 messages、Task Projection 与 evidence 保持独立所有权；普通 warm query 不读取磁盘，持久实现不得形成长期双写事实源。",
              "reason": "既有边界保持不变；Desktop control facts、可重建 projections、按 session/project/run 分区的 messages、Task Projection 与 evidence 保持独立所有权；普通 warm query 不读取磁盘，持久实现不得形成长期双写事实源。",
              "evidence": [
                "arckit/tech/arcorbit/platform-composition-solution.md",
                "runtime/arcorbit/src/desktop/desktop-store.mjs",
                "arckit/spec/arcorbit-distribution.md",
                "arckit/interaction/setup-readiness/interaction.md",
                "arckit/interaction/setup-readiness/default.html",
                "arckit/tech/arcorbit/installer-supply-chain.md",
                "arckit/spec/agentic-software-development/arcorbit-work-management.md",
                "arckit/interaction/automation-workspace/interaction.md",
                "arckit/tech/arcorbit/realtime-synchronization-solution.md",
                "arckit/tech/arcorbit/solution.md",
                "arckit/tech/arcorbit/desktop-execution-solution.md"
              ],
              "confidence": "high",
              "resume_condition": "当 Desktop Store schema、持久控制事实或派生状态重建边界改变时重审。",
              "revision": 20
            },
            "gap_refs": [
              "GAP-cross-record-audit"
            ],
            "reason": "单体 Store 混合不同生命周期数据会把历史规模传播到控制路径。",
            "evidence": [
              "arckit/tech/arcorbit/solution.md",
              "arckit/tech/arcorbit/desktop-execution-solution.md"
            ]
          },
          {
            "area_ref": "quality_and_validation",
            "observed_revision": 22,
            "set_decision": {
              "status": "settled",
              "statement": "既有协议、Runtime、realtime、Work、Chat、Automation、安全、Setup、同名冲突恢复和跨平台窗口验证义务保持不变。Setup Readiness 还必须证明：冷启动检查全部关联本地 roots；新增或改绑后再次检查全部 roots；项目集、具体项目和 Workset 纯查看切换不调用 Setup；解除关联不产生检查；用户主动 retry 保持 fresh-check；task-start skill preflight 不读取文件或调用 provider，只接受 ready 且覆盖当前规范化 root 的缓存状态；未验证 root fail closed。Feedback 忽略恢复还必须覆盖 V1 metadata 一致写入、V2 专用 route 与 typed IPC、ignored → pending 服务端确认、权限/对象/冲突/网络失败，以及失败时状态、筛选、选择和滚动位置不被乐观改写。完整 ArcOrbit 套件与需要 GUI 权限的 Electron 回归必须分别记录可重复结果。覆盖安装自愈必须以历史 Store fixtures、Catalog 成功而项目详情失败、标签独立失败和 reconcile 期间 Workset 变化的行为级回归证明，并验证用户控制事实保留、项目持续可见和仅受影响 lane 失败关闭。Feedback V2 消息新鲜度还必须证明：选中反馈出现未读时自动重拉；页面级、详情级和沟通记录手动刷新均重拉当前会话；加载失败不清除旧消息或未读，成功投影后才标记已读；并发或过期响应不覆盖较新结果；刷新不丢失草稿、附件和滚动位置。 State Kernel 验收必须覆盖零 warm 磁盘读取、单 state view、lane-count-independent query、single-flight revision patch、50 MB history isolation、三 lane soak 的 CPU/event-loop/内存门槛及 crash/migration 恢复。",
              "reason": "既有边界保持不变；State Kernel 验收必须覆盖零 warm 磁盘读取、单 state view、lane-count-independent query、single-flight revision patch、50 MB history isolation、三 lane soak 的 CPU/event-loop/内存门槛及 crash/migration 恢复。",
              "evidence": [
                "Verification: 78 targeted tests passed, 2026-08-29",
                "runtime/arcorbit/test/desktop-renderer.test.mjs",
                "local:fact:conversation-cache-root-cause",
                "local:fact:refresh-safety-boundary",
                "arckit/tech/arcorbit/solution.md",
                "arckit/tech/arcorbit/desktop-execution-solution.md"
              ],
              "confidence": "high",
              "resume_condition": "当 Feedback 消息加载模型、通知语义或 Renderer 状态所有权改变时重审。",
              "revision": 22
            },
            "gap_refs": [
              "GAP-agent-scenario-evaluation",
              "GAP-cross-record-audit"
            ],
            "reason": "架构性能问题需要量化行为证据而非仅功能测试。",
            "evidence": [
              "arckit/tech/arcorbit/desktop-execution-solution.md"
            ]
          }
        ],
        "software_invariant_changes": [],
        "project_gap_changes": [],
        "selection_context_change": {
          "current_focus": "实现并验收 ArcOrbit 单写者版本化 Desktop State Kernel、共享 Automation 投影、增量 activity patch 与分层持久化。"
        },
        "evidence": [
          "arckit/tech/arcorbit/solution.md",
          "arckit/tech/arcorbit/desktop-execution-solution.md",
          "arckit/tech/INDEX.md"
        ]
      },
      "invariant_assessment": {
        "project_revision": 327,
        "judgments": [
          {
            "invariant_ref": "product-expectations-remain-recoverable",
            "disposition": "not_relevant",
            "reason": "本轮不改变产品能力或用户结果。",
            "fact_refs": [],
            "evidence": [],
            "gap_refs": []
          },
          {
            "invariant_ref": "interaction-expectations-remain-recoverable",
            "disposition": "not_relevant",
            "reason": "本轮只定义底层状态同步契约，不改变已采用交互流程。",
            "fact_refs": [],
            "evidence": [],
            "gap_refs": []
          },
          {
            "invariant_ref": "visual-language-remains-consistent",
            "disposition": "not_relevant",
            "reason": "本轮不改变视觉语言。",
            "fact_refs": [],
            "evidence": [],
            "gap_refs": []
          },
          {
            "invariant_ref": "technical-decisions-remain-explainable",
            "disposition": "upheld",
            "reason": "State Kernel 的所有权、数据层、query/mutation/change contract 和验收边界已写入采用中的技术方案。",
            "fact_refs": [
              "FACT-20260830-002-002"
            ],
            "evidence": [
              "arckit/tech/arcorbit/solution.md",
              "arckit/tech/arcorbit/desktop-execution-solution.md"
            ],
            "gap_refs": []
          },
          {
            "invariant_ref": "accepted-facts-are-realized",
            "disposition": "threatened",
            "reason": "新接受的 State Kernel 架构尚未由当前实现兑现。",
            "fact_refs": [
              "FACT-20260830-002-002"
            ],
            "evidence": [],
            "gap_refs": [
              "GAP-20260830-002-002",
              "GAP-20260830-002-003",
              "GAP-20260830-002-004"
            ]
          },
          {
            "invariant_ref": "material-risks-have-credible-evidence",
            "disposition": "threatened",
            "reason": "根因已有运行证据，但最终 CPU、event-loop、内存、迁移和恢复风险需要完成量化验收。",
            "fact_refs": [
              "FACT-20260830-002-001",
              "FACT-20260830-002-002"
            ],
            "evidence": [],
            "gap_refs": [
              "GAP-20260830-002-005"
            ]
          }
        ]
      },
      "evidence": [
        "arckit/tech/arcorbit/solution.md",
        "arckit/tech/arcorbit/desktop-execution-solution.md",
        "arckit/tech/INDEX.md"
      ],
      "runtime_result_ref": "",
      "occurred_at": "2026-08-30T09:28:43.695Z"
    },
    {
      "round": 2,
      "transition_schema_version": "arckit-case-transition/v8",
      "goal": "实现单写者版本化 Desktop State Kernel 和共享 Automation snapshot query。",
      "outcome": "completed",
      "gap_selection": {
        "mode": "candidate",
        "basis": "版本化 State Kernel 是 activity patch、分层持久化和最终性能验收的共同前置条件。",
        "snapshot_token": "33b2076153db55b9c9670e381c4cbb3639a23f0bebae9a7a8f7f8bc79888de34",
        "selected_ref": "case-gap:CASE-20260830-002:GAP-20260830-002-002",
        "comparison_summary": "已比较当前 Case 唯一 ready gap 与全部 Project-level candidates；本轮优先关闭阻塞后续架构实现的 State Kernel gap。",
        "fresh_discovery_summary": "实现未发现需要抢占当前 gap 的新问题。",
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
            "reason": "该 Project gap 不属于当前 ArcOrbit CPU Case 的本轮边界。"
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
            "reason": "该 Project gap 不属于当前 ArcOrbit CPU Case 的本轮边界。"
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
            "reason": "该 Project gap 不属于当前 ArcOrbit CPU Case 的本轮边界。"
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
            "reason": "该 Project gap 不属于当前 ArcOrbit CPU Case 的本轮边界。"
          },
          {
            "ref": "case-gap:CASE-20260830-002:GAP-20260830-002-002",
            "source": "persisted",
            "eligibility": "ready",
            "disposition": "selected",
            "priority_basis": {
              "blocking": "high",
              "uncertainty": "",
              "risk": "high",
              "user_impact": "",
              "urgency": "high"
            },
            "reason": "该 gap 直接消除重复磁盘读取和多 lane 重复全局投影。"
          }
        ]
      },
      "selected_gap": {
        "id": "GAP-20260830-002-002",
        "responsibility": "agent",
        "goal": "实现单写者版本化 Desktop State Kernel，并让 Automation overview 与所有 workspace lanes 从同一内存 state view 和 Run summary index 派生。",
        "reason": "当前 readStore 每次重读完整文件，lane proxy 与多层 getSnapshot 重复读取和复制全局状态。",
        "derived_from": [
          "FACT-20260830-002-001",
          "FACT-20260830-002-002"
        ],
        "blocked_by": [],
        "priority_basis": {
          "blocking": "high",
          "uncertainty": "",
          "risk": "high",
          "user_impact": "",
          "urgency": "high"
        },
        "evidence_required": [
          "状态查询 warm path 零磁盘全量读取",
          "Automation Snapshot 每次只捕获一个 state view",
          "lane 数不增加 Store 读取次数或完整全局 clone",
          "相关单元与集成测试通过"
        ]
      },
      "planned_transition": {
        "goal": "实现单写者版本化 Desktop State Kernel 和共享 Automation snapshot query。",
        "expected_state_change": "warm query 不再读取磁盘，Automation overview 与多 lane 共享一个 state view、local project index 和 Run summary index。"
      },
      "accepted_state_delta": {
        "resolved_gap": {
          "id": "GAP-20260830-002-002",
          "status": "resolved",
          "outcome": "Desktop Store 已成为单加载、串行写入、单调 revision 的内存状态内核；Automation 多 lane snapshot 从同一 view 和共享索引派生。",
          "reason": "写入只在原子持久化成功后替换 current state；兼容读取返回隔离副本，query capture 共享稳定 state；定向测试证明 warm path 与三 lane 读取次数不随 lane 数增长。",
          "evidence": [
            "runtime/arcorbit/src/desktop/desktop-store.mjs",
            "runtime/arcorbit/src/desktop-run-manager.mjs",
            "runtime/arcorbit/src/automation-coordinator.mjs",
            "runtime/arcorbit/test/desktop-store.test.mjs",
            "runtime/arcorbit/test/automation-coordinator.test.mjs",
            "node --test test/desktop-store.test.mjs test/desktop-run-manager.test.mjs test/automation-coordinator.test.mjs (91 passed)"
          ]
        },
        "facts_added": [
          {
            "id": "FACT-20260830-002-003",
            "revision": 1,
            "status": "accepted",
            "statement": "ArcOrbit Desktop Store 已实现 main-process 单写者内存 State Kernel：durable state 仅首次加载，写事务串行且持久化成功后发布单调 revision；Automation 每次 snapshot 捕获一个 state view，并让 overview 与全部 workspace lanes 共享 local project 和 Run summary index，通过无全局 structuredClone 的 lane selector 派生。",
            "basis": "代码实现、I/O 计数测试和三 lane 集成测试共同证明目标 query/mutation 边界已兑现。",
            "evidence": [
              "runtime/arcorbit/src/desktop/desktop-store.mjs",
              "runtime/arcorbit/src/desktop-run-manager.mjs",
              "runtime/arcorbit/src/automation-coordinator.mjs",
              "runtime/arcorbit/test/desktop-store.test.mjs",
              "runtime/arcorbit/test/automation-coordinator.test.mjs"
            ]
          }
        ],
        "facts_superseded": [],
        "impacts_added": [],
        "impacts_updated": [
          {
            "id": "IMPACT-20260830-002-001",
            "fact_id": "FACT-20260830-002-001",
            "fact_revision": 1,
            "target": {
              "kind": "software_decision",
              "ref": "technical_foundation",
              "revision": 46
            },
            "effect": "threatened",
            "reason": "State Kernel 与共享 lane 投影已兑现，但 revisioned activity patch 和 Renderer single-flight 尚未完成。",
            "gap_ids": [
              "GAP-20260830-002-003"
            ],
            "evidence": [
              "runtime/arcorbit/src/desktop/desktop-store.mjs",
              "runtime/arcorbit/src/automation-coordinator.mjs"
            ]
          },
          {
            "id": "IMPACT-20260830-002-002",
            "fact_id": "FACT-20260830-002-001",
            "fact_revision": 1,
            "target": {
              "kind": "software_decision",
              "ref": "data_and_state",
              "revision": 21
            },
            "effect": "threatened",
            "reason": "内存状态所有权已建立，但 durable control、messages、Task Projection 和 Run evidence 仍需物理分区迁移。",
            "gap_ids": [
              "GAP-20260830-002-004"
            ],
            "evidence": [
              "runtime/arcorbit/src/desktop/desktop-store.mjs"
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
        "project_revision": 328,
        "judgments": [
          {
            "invariant_ref": "product-expectations-remain-recoverable",
            "disposition": "not_relevant",
            "reason": "本轮不改变产品能力或用户结果。",
            "fact_refs": [],
            "evidence": [],
            "gap_refs": []
          },
          {
            "invariant_ref": "interaction-expectations-remain-recoverable",
            "disposition": "not_relevant",
            "reason": "本轮未改变 Renderer 交互协议。",
            "fact_refs": [],
            "evidence": [],
            "gap_refs": []
          },
          {
            "invariant_ref": "visual-language-remains-consistent",
            "disposition": "not_relevant",
            "reason": "本轮不改变视觉语言。",
            "fact_refs": [],
            "evidence": [],
            "gap_refs": []
          },
          {
            "invariant_ref": "technical-decisions-remain-explainable",
            "disposition": "upheld",
            "reason": "State Kernel 与共享 query 实现直接对应采用中的技术契约。",
            "fact_refs": [
              "FACT-20260830-002-003"
            ],
            "evidence": [
              "arckit/tech/arcorbit/solution.md",
              "arckit/tech/arcorbit/desktop-execution-solution.md",
              "runtime/arcorbit/src/desktop/desktop-store.mjs",
              "runtime/arcorbit/src/automation-coordinator.mjs"
            ],
            "gap_refs": []
          },
          {
            "invariant_ref": "accepted-facts-are-realized",
            "disposition": "threatened",
            "reason": "State Kernel 已实现，但 activity patch 与持久化分区仍未兑现完整架构事实。",
            "fact_refs": [
              "FACT-20260830-002-002",
              "FACT-20260830-002-003"
            ],
            "evidence": [],
            "gap_refs": [
              "GAP-20260830-002-003",
              "GAP-20260830-002-004"
            ]
          },
          {
            "invariant_ref": "material-risks-have-credible-evidence",
            "disposition": "threatened",
            "reason": "定向功能和读取次数证据已建立，最终大历史、持续流式、event-loop、内存与恢复验收仍待完成。",
            "fact_refs": [
              "FACT-20260830-002-001",
              "FACT-20260830-002-003"
            ],
            "evidence": [],
            "gap_refs": [
              "GAP-20260830-002-005"
            ]
          }
        ]
      },
      "evidence": [
        "runtime/arcorbit/src/desktop/desktop-store.mjs",
        "runtime/arcorbit/src/desktop-run-manager.mjs",
        "runtime/arcorbit/src/automation-coordinator.mjs",
        "runtime/arcorbit/test/desktop-store.test.mjs",
        "runtime/arcorbit/test/automation-coordinator.test.mjs",
        "node --test test/desktop-store.test.mjs test/desktop-run-manager.test.mjs test/automation-coordinator.test.mjs (91 passed)"
      ],
      "runtime_result_ref": "",
      "occurred_at": "2026-08-30T09:35:17.422Z"
    },
    {
      "round": 3,
      "transition_schema_version": "arckit-case-transition/v8",
      "goal": "实现 revisioned run activity patch 和 Renderer strict single-flight。",
      "outcome": "completed",
      "gap_selection": {
        "mode": "candidate",
        "basis": "activity invalidation 是用户观察到高 CPU 的直接触发链路，优先于同时 ready 的持久化分区。",
        "snapshot_token": "af25bf01e758b5da725a76d58e417383a201f12d2e5e70ef1dac6a46be4a1c34",
        "selected_ref": "case-gap:CASE-20260830-002:GAP-20260830-002-003",
        "comparison_summary": "已比较 activity patch、持久化分区和全部 Project candidates；activity 路径直接影响运行中 CPU 与可见交互。",
        "fresh_discovery_summary": "未发现需要新增或抢占本轮的 fresh gap。",
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
            "reason": "该 Project gap 不属于当前 Case 本轮。"
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
            "reason": "该 Project gap 不属于当前 Case 本轮。"
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
            "reason": "该 Project gap 不属于当前 Case 本轮。"
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
            "reason": "该 Project gap 不属于当前 Case 本轮。"
          },
          {
            "ref": "case-gap:CASE-20260830-002:GAP-20260830-002-003",
            "source": "persisted",
            "eligibility": "ready",
            "disposition": "selected",
            "priority_basis": {
              "blocking": "medium",
              "uncertainty": "",
              "risk": "high",
              "user_impact": "high"
            },
            "reason": "这是当前运行中 CPU 放大的直接高频路径。"
          },
          {
            "ref": "case-gap:CASE-20260830-002:GAP-20260830-002-004",
            "source": "persisted",
            "eligibility": "ready",
            "disposition": "deferred",
            "priority_basis": {
              "blocking": "",
              "uncertainty": "",
              "risk": "high",
              "user_impact": "",
              "scalability": "high"
            },
            "reason": "持久化分区在下一独立 round 完成。"
          }
        ]
      },
      "selected_gap": {
        "id": "GAP-20260830-002-003",
        "responsibility": "agent",
        "goal": "实现带 revision 的 run.activity patch、Renderer owner 校验和真正 single-flight 的局部同步，正常流式路径不再拉取完整 Automation Snapshot。",
        "reason": "现有 activityRefreshQueued 在异步请求完成前释放，允许重叠全量 Snapshot，并缺少 revision gap 恢复。",
        "derived_from": [
          "FACT-20260830-002-002"
        ],
        "blocked_by": [
          "GAP-20260830-002-002"
        ],
        "priority_basis": {
          "blocking": "medium",
          "uncertainty": "",
          "risk": "high",
          "user_impact": "high"
        },
        "evidence_required": [
          "连续 invalidation 最多一个 in-flight 同步",
          "连续 revision 只应用 patch",
          "revision gap 回退一次 detail/full snapshot",
          "隐藏页面和旧 owner 不查询不采用"
        ]
      },
      "planned_transition": {
        "goal": "实现 revisioned run activity patch 和 Renderer strict single-flight。",
        "expected_state_change": "连续 patch 本地应用；gap 只读取单 Run detail；隐藏或旧 owner 不采用；正常流式不请求 Automation Snapshot。"
      },
      "accepted_state_delta": {
        "resolved_gap": {
          "id": "GAP-20260830-002-003",
          "status": "resolved",
          "outcome": "Run Manager 生成 run.activity.patch/v1；Renderer owner-check 后按 revision 严格单飞应用，revision gap 仅回退 run.activity.snapshot/v1。",
          "reason": "IPC、projector 与 Renderer 已形成 typed 增量链路，正常 activity invalidation 不再调用 Automation Snapshot。",
          "evidence": [
            "runtime/arcorbit/src/projection/run-activity-patch.mjs",
            "runtime/arcorbit/src/desktop-run-manager.mjs",
            "runtime/arcorbit/desktop/main.mjs",
            "runtime/arcorbit/desktop/preload.cjs",
            "runtime/arcorbit/desktop/renderer/run-activity-sync.mjs",
            "runtime/arcorbit/desktop/renderer/renderer.js",
            "runtime/arcorbit/test/run-activity-sync.test.mjs",
            "runtime/arcorbit/test/desktop-renderer.test.mjs",
            "node --test test/run-activity-sync.test.mjs test/token-usage-projector.test.mjs test/desktop-run-manager.test.mjs test/automation-coordinator.test.mjs test/desktop-renderer.test.mjs (157 passed)"
          ]
        },
        "facts_added": [
          {
            "id": "FACT-20260830-002-004",
            "revision": 1,
            "status": "accepted",
            "statement": "ArcOrbit 的 run.activity_changed 已携带 owner 与单调 revision 的 run.activity.patch/v1；Renderer 只对当前可见 owner 排队，在一个严格 single-flight 队列中顺序应用连续 patch，revision gap 仅请求目标 Run 的 run.activity.snapshot/v1，正常流式路径不再构造 Automation Snapshot。",
            "basis": "typed patch 生成/应用测试、owner 测试、100 invalidation single-flight 测试和 Renderer 静态 IPC 边界测试通过。",
            "evidence": [
              "runtime/arcorbit/src/projection/run-activity-patch.mjs",
              "runtime/arcorbit/src/desktop-run-manager.mjs",
              "runtime/arcorbit/desktop/renderer/run-activity-sync.mjs",
              "runtime/arcorbit/desktop/renderer/renderer.js",
              "runtime/arcorbit/test/run-activity-sync.test.mjs",
              "runtime/arcorbit/test/desktop-renderer.test.mjs"
            ]
          }
        ],
        "facts_superseded": [],
        "impacts_added": [],
        "impacts_updated": [
          {
            "id": "IMPACT-20260830-002-001",
            "fact_id": "FACT-20260830-002-001",
            "fact_revision": 1,
            "target": {
              "kind": "software_decision",
              "ref": "technical_foundation",
              "revision": 46
            },
            "effect": "upheld",
            "reason": "State Kernel、共享 lane query 和 revisioned activity patch 已共同兑现采用中的 Desktop query/change contract。",
            "gap_ids": [],
            "evidence": [
              "runtime/arcorbit/src/desktop/desktop-store.mjs",
              "runtime/arcorbit/src/automation-coordinator.mjs",
              "runtime/arcorbit/src/projection/run-activity-patch.mjs",
              "runtime/arcorbit/desktop/renderer/run-activity-sync.mjs"
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
        "project_revision": 328,
        "judgments": [
          {
            "invariant_ref": "product-expectations-remain-recoverable",
            "disposition": "not_relevant",
            "reason": "本轮不改变产品能力。",
            "fact_refs": [],
            "evidence": [],
            "gap_refs": []
          },
          {
            "invariant_ref": "interaction-expectations-remain-recoverable",
            "disposition": "upheld",
            "reason": "可见 Run、owner 切换、Workbench 与 Command Center 的采用行为由 patch/owner 测试保持。",
            "fact_refs": [
              "FACT-20260830-002-004"
            ],
            "evidence": [
              "runtime/arcorbit/desktop/renderer/renderer.js",
              "runtime/arcorbit/test/run-activity-sync.test.mjs",
              "runtime/arcorbit/test/desktop-renderer.test.mjs"
            ],
            "gap_refs": []
          },
          {
            "invariant_ref": "visual-language-remains-consistent",
            "disposition": "not_relevant",
            "reason": "本轮不改变视觉语言。",
            "fact_refs": [],
            "evidence": [],
            "gap_refs": []
          },
          {
            "invariant_ref": "technical-decisions-remain-explainable",
            "disposition": "upheld",
            "reason": "typed patch、revision、owner 与 gap fallback 直接对应技术契约。",
            "fact_refs": [
              "FACT-20260830-002-004"
            ],
            "evidence": [
              "arckit/tech/arcorbit/desktop-execution-solution.md",
              "runtime/arcorbit/src/projection/run-activity-patch.mjs",
              "runtime/arcorbit/desktop/renderer/run-activity-sync.mjs"
            ],
            "gap_refs": []
          },
          {
            "invariant_ref": "accepted-facts-are-realized",
            "disposition": "threatened",
            "reason": "State Kernel 与 activity patch 已实现，但 durable ownership 分区仍未完成。",
            "fact_refs": [
              "FACT-20260830-002-002",
              "FACT-20260830-002-004"
            ],
            "evidence": [],
            "gap_refs": [
              "GAP-20260830-002-004"
            ]
          },
          {
            "invariant_ref": "material-risks-have-credible-evidence",
            "disposition": "threatened",
            "reason": "100-event single-flight 证据已建立，最终 50 MB、长时间 event-loop/内存和崩溃迁移验收仍待完成。",
            "fact_refs": [
              "FACT-20260830-002-001",
              "FACT-20260830-002-004"
            ],
            "evidence": [],
            "gap_refs": [
              "GAP-20260830-002-005"
            ]
          }
        ]
      },
      "evidence": [
        "runtime/arcorbit/src/projection/run-activity-patch.mjs",
        "runtime/arcorbit/src/desktop-run-manager.mjs",
        "runtime/arcorbit/desktop/main.mjs",
        "runtime/arcorbit/desktop/preload.cjs",
        "runtime/arcorbit/desktop/renderer/run-activity-sync.mjs",
        "runtime/arcorbit/desktop/renderer/renderer.js",
        "runtime/arcorbit/test/run-activity-sync.test.mjs",
        "runtime/arcorbit/test/desktop-renderer.test.mjs",
        "157 targeted tests passed"
      ],
      "runtime_result_ref": "",
      "occurred_at": "2026-08-30T09:41:25.690Z"
    },
    {
      "round": 4,
      "transition_schema_version": "arckit-case-transition/v8",
      "goal": "迁移 Desktop control、session messages、Task Projection 与 Run evidence 的所有权分区。",
      "outcome": "completed",
      "gap_selection": {
        "mode": "candidate",
        "basis": "持久化分区是最终 50 MB 历史隔离与崩溃恢复验收的前置条件。",
        "snapshot_token": "24161da8d68043c3d2b57f7b5ff1d3e4b08acf34f6aae510108eb410091e6723",
        "selected_ref": "case-gap:CASE-20260830-002:GAP-20260830-002-004",
        "comparison_summary": "当前 Case 仅剩持久化实现为 ready gap，Project candidates 均不应抢占本轮。",
        "fresh_discovery_summary": "未发现新 gap。",
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
            "reason": "该 Project gap 不属于当前 Case。"
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
            "reason": "该 Project gap 不属于当前 Case。"
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
            "reason": "该 Project gap 不属于当前 Case。"
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
            "reason": "该 Project gap 不属于当前 Case。"
          },
          {
            "ref": "case-gap:CASE-20260830-002:GAP-20260830-002-004",
            "source": "persisted",
            "eligibility": "ready",
            "disposition": "selected",
            "priority_basis": {
              "blocking": "",
              "uncertainty": "",
              "risk": "high",
              "user_impact": "",
              "scalability": "high"
            },
            "reason": "该 gap 关闭历史数据放大控制路径的剩余结构风险。"
          }
        ]
      },
      "selected_gap": {
        "id": "GAP-20260830-002-004",
        "responsibility": "agent",
        "goal": "把 Desktop control snapshot、session messages、project Task Projection 和 Run evidence 分离为各自所有权分区，并提供原子迁移与恢复。",
        "reason": "当前 desktop-store.json 同时承载控制事实、消息历史和可重建投影，历史增长直接扩大所有控制查询和写入成本。",
        "derived_from": [
          "FACT-20260830-002-002"
        ],
        "blocked_by": [
          "GAP-20260830-002-002"
        ],
        "priority_basis": {
          "blocking": "",
          "uncertainty": "",
          "risk": "high",
          "user_impact": "",
          "scalability": "high"
        },
        "evidence_required": [
          "control snapshot 不内嵌历史消息、完整 Run activity 或 Task 列表",
          "旧 Store 一次迁移保持身份与控制事实",
          "迁移失败原子回滚且无长期双写",
          "显式 detail 查询只加载目标分区"
        ]
      },
      "planned_transition": {
        "goal": "迁移 Desktop control、session messages、Task Projection 与 Run evidence 的所有权分区。",
        "expected_state_change": "control manifest 最后原子提交，messages lazy load，Task Projection 独立索引，Run detail 只读目标 evidence。"
      },
      "accepted_state_delta": {
        "resolved_gap": {
          "id": "GAP-20260830-002-004",
          "status": "resolved",
          "outcome": "Desktop Store v17 已用 manifest 事务分离 control、session messages 和 Task Projection；Run evidence 继续按 Run 目录独立持久化。",
          "reason": "新分区先写、control manifest 最后提交并清理旧分区；迁移失败保留 legacy control 且清理未提交文件；生产 control query 不加载 messages。",
          "evidence": [
            "runtime/arcorbit/src/desktop/desktop-store.mjs",
            "runtime/arcorbit/src/desktop-run-manager.mjs",
            "runtime/arcorbit/src/chat-coordinator.mjs",
            "runtime/arcorbit/test/desktop-store.test.mjs",
            "runtime/arcorbit/test/chat-coordinator.test.mjs",
            "runtime/arcorbit/test/desktop-run-manager.test.mjs",
            "runtime/arcorbit/test/work-sync-coordinator.test.mjs",
            "122 related tests passed"
          ]
        },
        "facts_added": [
          {
            "id": "FACT-20260830-002-005",
            "revision": 1,
            "status": "accepted",
            "statement": "ArcOrbit Desktop Store v17 以 desktop-state-partitions/v1 manifest 管理 compact control snapshot、lazy session message partition 和独立 Task Projection partition；Run activity/messages/result 继续位于目标 Run evidence 目录。分区先写、manifest 最后提交，失败会删除未提交分区并保留旧 control；生产 control query/update 不加载历史 messages。",
            "basis": "分区实现、legacy migration、manifest commit rollback、Chat persistence、Work projection 和 Run recovery 测试共同证明所有权与恢复边界。",
            "evidence": [
              "runtime/arcorbit/src/desktop/desktop-store.mjs",
              "runtime/arcorbit/src/desktop-run-manager.mjs",
              "runtime/arcorbit/src/chat-coordinator.mjs",
              "runtime/arcorbit/test/desktop-store.test.mjs",
              "runtime/arcorbit/test/chat-coordinator.test.mjs",
              "runtime/arcorbit/test/desktop-run-manager.test.mjs"
            ]
          }
        ],
        "facts_superseded": [],
        "impacts_added": [],
        "impacts_updated": [
          {
            "id": "IMPACT-20260830-002-002",
            "fact_id": "FACT-20260830-002-001",
            "fact_revision": 1,
            "target": {
              "kind": "software_decision",
              "ref": "data_and_state",
              "revision": 21
            },
            "effect": "upheld",
            "reason": "control、messages、Task Projection 与 Run evidence 已按所有权分区，并具备 manifest 原子迁移/恢复。",
            "gap_ids": [],
            "evidence": [
              "runtime/arcorbit/src/desktop/desktop-store.mjs",
              "runtime/arcorbit/src/desktop-run-manager.mjs",
              "runtime/arcorbit/src/chat-coordinator.mjs",
              "runtime/arcorbit/test/desktop-store.test.mjs"
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
        "project_revision": 328,
        "judgments": [
          {
            "invariant_ref": "product-expectations-remain-recoverable",
            "disposition": "not_relevant",
            "reason": "本轮不改变产品能力。",
            "fact_refs": [],
            "evidence": [],
            "gap_refs": []
          },
          {
            "invariant_ref": "interaction-expectations-remain-recoverable",
            "disposition": "upheld",
            "reason": "Chat、Work 与 Automation 的既有可见状态和恢复行为由相关测试保持。",
            "fact_refs": [
              "FACT-20260830-002-005"
            ],
            "evidence": [
              "runtime/arcorbit/test/chat-coordinator.test.mjs",
              "runtime/arcorbit/test/work-sync-coordinator.test.mjs",
              "runtime/arcorbit/test/automation-coordinator.test.mjs"
            ],
            "gap_refs": []
          },
          {
            "invariant_ref": "visual-language-remains-consistent",
            "disposition": "not_relevant",
            "reason": "本轮不改变视觉语言。",
            "fact_refs": [],
            "evidence": [],
            "gap_refs": []
          },
          {
            "invariant_ref": "technical-decisions-remain-explainable",
            "disposition": "upheld",
            "reason": "manifest commit、lazy messages、Task Projection 与 Run evidence 边界直接对应采用中的技术方案。",
            "fact_refs": [
              "FACT-20260830-002-005"
            ],
            "evidence": [
              "arckit/tech/arcorbit/solution.md",
              "arckit/tech/arcorbit/desktop-execution-solution.md",
              "runtime/arcorbit/src/desktop/desktop-store.mjs"
            ],
            "gap_refs": []
          },
          {
            "invariant_ref": "accepted-facts-are-realized",
            "disposition": "upheld",
            "reason": "State Kernel、共享投影、activity patch 和所有权分区均已由实现与测试兑现。",
            "fact_refs": [
              "FACT-20260830-002-002",
              "FACT-20260830-002-003",
              "FACT-20260830-002-004",
              "FACT-20260830-002-005"
            ],
            "evidence": [
              "runtime/arcorbit/src/desktop/desktop-store.mjs",
              "runtime/arcorbit/src/automation-coordinator.mjs",
              "runtime/arcorbit/src/projection/run-activity-patch.mjs",
              "runtime/arcorbit/desktop/renderer/run-activity-sync.mjs"
            ],
            "gap_refs": []
          },
          {
            "invariant_ref": "material-risks-have-credible-evidence",
            "disposition": "threatened",
            "reason": "迁移与恢复测试已通过，但最终 50 MB、持续负载、event-loop、内存和文档一致性验收尚未执行。",
            "fact_refs": [
              "FACT-20260830-002-001",
              "FACT-20260830-002-005"
            ],
            "evidence": [],
            "gap_refs": [
              "GAP-20260830-002-005"
            ]
          }
        ]
      },
      "evidence": [
        "runtime/arcorbit/src/desktop/desktop-store.mjs",
        "runtime/arcorbit/src/desktop-run-manager.mjs",
        "runtime/arcorbit/src/chat-coordinator.mjs",
        "runtime/arcorbit/test/desktop-store.test.mjs",
        "runtime/arcorbit/test/chat-coordinator.test.mjs",
        "runtime/arcorbit/test/work-sync-coordinator.test.mjs",
        "122 related tests passed"
      ],
      "runtime_result_ref": "",
      "occurred_at": "2026-08-30T09:47:41.953Z"
    },
    {
      "round": 5,
      "transition_schema_version": "arckit-case-transition/v8",
      "goal": "接受大 Store、多 lane、持续流式、崩溃恢复和文档实现一致性的架构验收。",
      "outcome": "completed",
      "gap_selection": {
        "mode": "candidate",
        "basis": "Case 内唯一 ready Gap 是最终架构验收；全部实现前置 Gap 已关闭，性能、恢复和文档证据现已齐备。",
        "snapshot_token": "e9d98864d65e9c232c6c5aea18d0b9efb64881b313aaae0239627c9551d2ea72",
        "selected_ref": "case-gap:CASE-20260830-002:GAP-20260830-002-005",
        "comparison_summary": "比较了四个需要独立 Case 的 Project Gap 与当前 Case 的验收 Gap；Project Gap 均不属于本 Case，当前 Gap 是完成 CPU 架构优化闭环的唯一 ready obligation。",
        "fresh_discovery_summary": "最终审计没有发现新的实现、恢复或文档一致性缺口。",
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
            "reason": "需要独立真实场景 Case，不属于 ArcOrbit CPU 优化验收。"
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
            "reason": "是项目级后续 Runtime 韧性事项，需要独立 Case。"
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
            "reason": "是权限项目安全验收，需要独立 Case。"
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
            "reason": "是跨记录审计项目 Gap，需要独立 Case。"
          },
          {
            "ref": "case-gap:CASE-20260830-002:GAP-20260830-002-005",
            "source": "persisted",
            "eligibility": "ready",
            "disposition": "selected",
            "priority_basis": {
              "blocking": "high",
              "uncertainty": "low",
              "risk": "high",
              "user_impact": "high"
            },
            "reason": "实现前置已闭合，且本轮已有完整性能、恢复、回归和文档审计证据。"
          }
        ]
      },
      "selected_gap": {
        "id": "GAP-20260830-002-005",
        "responsibility": "agent",
        "goal": "完成大 Store、多 lane、持续流式、崩溃恢复和文档实现一致性的架构验收。",
        "reason": "CPU 问题必须用读取次数、并发、event-loop、内存和恢复证据证明消失，而不能只依赖功能测试。",
        "derived_from": [
          "FACT-20260830-002-001",
          "FACT-20260830-002-002"
        ],
        "blocked_by": [
          "GAP-20260830-002-002",
          "GAP-20260830-002-003",
          "GAP-20260830-002-004"
        ],
        "priority_basis": {
          "blocking": "high",
          "uncertainty": "",
          "risk": "high",
          "user_impact": ""
        },
        "evidence_required": [
          "50 MB evidence fixture 的 warm snapshot 成本不随历史增长",
          "三 lane 30 分钟 CPU/event-loop/内存报告",
          "100 invalidation single-flight 回归",
          "crash/restart 与 migration fixture",
          "tech 文档和实现边界审计"
        ]
      },
      "planned_transition": {
        "goal": "接受大 Store、多 lane、持续流式、崩溃恢复和文档实现一致性的架构验收。",
        "expected_state_change": "关闭 GAP-005，将 quality_and_validation impact 从 threatened 更新为 upheld，并进入 Completion Review。"
      },
      "accepted_state_delta": {
        "resolved_gap": {
          "id": "GAP-20260830-002-005",
          "status": "resolved",
          "outcome": "Desktop State Kernel 架构验收通过。",
          "reason": "50 MiB warm snapshot、三 lane 30 分钟等价事件回放、100 invalidation single-flight、迁移故障注入、专项与全量测试以及文档实现审计均已完成。",
          "evidence": [
            "arckit/tech/arcorbit/state-kernel-acceptance.md",
            "runtime/arcorbit/scripts/benchmark-state-kernel.mjs",
            "runtime/arcorbit/test/state-kernel-performance.test.mjs",
            "runtime/arcorbit/test/run-activity-sync.test.mjs",
            "runtime/arcorbit/test/desktop-store.test.mjs",
            "npm run check: 578 tests, 555 passed, 23 skipped, 0 failed"
          ]
        },
        "facts_added": [
          {
            "id": "FACT-20260830-002-006",
            "revision": 1,
            "status": "accepted",
            "statement": "ArcOrbit Desktop State Kernel 架构验收通过：50 MiB 历史消息不进入 warm control snapshot，三个 lane 的 30 分钟等价 11,250 事件回放折算单核 CPU 0.01%、event-loop p99 12.70 ms、heap 增量 183,400 bytes；100 invalidation 保持严格 single-flight，v17 migration 和 manifest commit 故障恢复通过，技术文档与实现 schema/边界一致。",
            "basis": "可重复 benchmark、opt-in 性能测试、专项回归、全量测试和逐项文档实现审计共同支持该结论。",
            "evidence": [
              "arckit/tech/arcorbit/state-kernel-acceptance.md",
              "runtime/arcorbit/scripts/benchmark-state-kernel.mjs",
              "runtime/arcorbit/test/state-kernel-performance.test.mjs",
              "runtime/arcorbit/test/run-activity-sync.test.mjs",
              "runtime/arcorbit/test/desktop-store.test.mjs",
              "arckit/tech/arcorbit/desktop-execution-solution.md"
            ]
          }
        ],
        "facts_superseded": [],
        "impacts_added": [],
        "impacts_updated": [
          {
            "id": "IMPACT-20260830-002-003",
            "fact_id": "FACT-20260830-002-006",
            "fact_revision": 1,
            "target": {
              "kind": "software_decision",
              "ref": "quality_and_validation",
              "revision": 23
            },
            "effect": "upheld",
            "reason": "定义的性能、single-flight、迁移、崩溃恢复和文档一致性标准均已有直接可重复证据。",
            "gap_ids": [],
            "evidence": [
              "arckit/tech/arcorbit/state-kernel-acceptance.md",
              "runtime/arcorbit/test/state-kernel-performance.test.mjs",
              "runtime/arcorbit/test/run-activity-sync.test.mjs",
              "runtime/arcorbit/test/desktop-store.test.mjs",
              "npm run check: 578 tests, 555 passed, 23 skipped, 0 failed"
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
        "project_revision": 328,
        "judgments": [
          {
            "invariant_ref": "product-expectations-remain-recoverable",
            "disposition": "not_relevant",
            "reason": "本轮只接受既有产品范围内的技术架构验收，不改变产品能力或验收含义。",
            "fact_refs": [],
            "evidence": [],
            "gap_refs": []
          },
          {
            "invariant_ref": "interaction-expectations-remain-recoverable",
            "disposition": "upheld",
            "reason": "可见 Run owner、连续 patch、revision gap fallback 与结构变化刷新边界均由 Renderer 和同步测试覆盖。",
            "fact_refs": [
              "FACT-20260830-002-006"
            ],
            "evidence": [
              "runtime/arcorbit/test/run-activity-sync.test.mjs",
              "runtime/arcorbit/test/desktop-renderer.test.mjs"
            ],
            "gap_refs": []
          },
          {
            "invariant_ref": "visual-language-remains-consistent",
            "disposition": "not_relevant",
            "reason": "本轮没有改变视觉语言或组件呈现规则。",
            "fact_refs": [],
            "evidence": [],
            "gap_refs": []
          },
          {
            "invariant_ref": "technical-decisions-remain-explainable",
            "disposition": "upheld",
            "reason": "State Kernel、共享 query、activity patch 与 v17 分区协议均在采用中的技术方案和验收报告中具有与代码一致的 schema、边界和理由。",
            "fact_refs": [
              "FACT-20260830-002-002",
              "FACT-20260830-002-006"
            ],
            "evidence": [
              "arckit/tech/arcorbit/solution.md",
              "arckit/tech/arcorbit/desktop-execution-solution.md",
              "arckit/tech/arcorbit/state-kernel-acceptance.md"
            ],
            "gap_refs": []
          },
          {
            "invariant_ref": "accepted-facts-are-realized",
            "disposition": "upheld",
            "reason": "诊断对应的重复全量读取、全局 Snapshot 和流式刷新放大路径已由单写者内存 view、共享索引、局部 patch 与所有权分区替代。",
            "fact_refs": [
              "FACT-20260830-002-001",
              "FACT-20260830-002-002",
              "FACT-20260830-002-003",
              "FACT-20260830-002-004",
              "FACT-20260830-002-005",
              "FACT-20260830-002-006"
            ],
            "evidence": [
              "runtime/arcorbit/src/desktop/desktop-store.mjs",
              "runtime/arcorbit/src/automation-coordinator.mjs",
              "runtime/arcorbit/src/projection/run-activity-patch.mjs",
              "runtime/arcorbit/desktop/renderer/run-activity-sync.mjs",
              "arckit/tech/arcorbit/state-kernel-acceptance.md"
            ],
            "gap_refs": []
          },
          {
            "invariant_ref": "material-risks-have-credible-evidence",
            "disposition": "upheld",
            "reason": "大历史、三 lane 流负载、event-loop、内存、single-flight、migration 和 manifest crash 边界均有可重复测试与记录；报告明确区分等价回放和目标 Electron 墙钟 soak。",
            "fact_refs": [
              "FACT-20260830-002-001",
              "FACT-20260830-002-006"
            ],
            "evidence": [
              "arckit/tech/arcorbit/state-kernel-acceptance.md",
              "runtime/arcorbit/scripts/benchmark-state-kernel.mjs",
              "runtime/arcorbit/test/state-kernel-performance.test.mjs",
              "runtime/arcorbit/test/run-activity-sync.test.mjs",
              "runtime/arcorbit/test/desktop-store.test.mjs"
            ],
            "gap_refs": []
          }
        ]
      },
      "evidence": [
        "arckit/tech/arcorbit/state-kernel-acceptance.md",
        "runtime/arcorbit/scripts/benchmark-state-kernel.mjs",
        "runtime/arcorbit/test/state-kernel-performance.test.mjs",
        "runtime/arcorbit/test/run-activity-sync.test.mjs",
        "runtime/arcorbit/test/desktop-store.test.mjs",
        "runtime/arcorbit/test/desktop-renderer.test.mjs",
        "npm run check: 578 tests, 555 passed, 23 skipped, 0 failed"
      ],
      "runtime_result_ref": "",
      "occurred_at": "2026-08-30T09:56:40.711Z"
    },
    {
      "round": 6,
      "transition_schema_version": "arckit-case-transition/v8",
      "goal": "审查完整实现的正确性、真实问题解决、验证可信度、回归风险和最小性。",
      "outcome": "completed",
      "gap_selection": {
        "mode": "candidate",
        "basis": "全部普通 Gap、影响、问题和 handoff 已闭合，Completion Review 是当前 Case 唯一 ready obligation。",
        "snapshot_token": "0c920daaa48bee9f0c7fa58545d3f3be183584a1478e891b5ca314fa29d1652c",
        "selected_ref": "case-gap:CASE-20260830-002:CASE-20260830-002:completion-review:1",
        "comparison_summary": "比较了四个独立 Project Gap 和当前 Case 的派生 Completion Review；仅 Review 属于本 Case 且可立即完成。",
        "fresh_discovery_summary": "五维审查未发现需要派生修复 Gap 的问题。",
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
            "reason": "需要独立 Case，不属于本次完成审查。"
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
            "reason": "需要独立 Case，不属于本次完成审查。"
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
            "reason": "需要独立 Case，不属于本次完成审查。"
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
            "reason": "需要独立 Case，不属于本次完成审查。"
          },
          {
            "ref": "case-gap:CASE-20260830-002:CASE-20260830-002:completion-review:1",
            "source": "persisted",
            "eligibility": "ready",
            "disposition": "selected",
            "priority_basis": {
              "blocking": "high",
              "uncertainty": "low",
              "risk": "high",
              "user_impact": "high"
            },
            "reason": "所有普通 Case 义务已闭合，现有实现与验证证据足以完成五维审查。"
          }
        ]
      },
      "selected_gap": {
        "id": "CASE-20260830-002:completion-review:1",
        "responsibility": "agent",
        "goal": "Review the completed implementation for correctness, real problem resolution, verification credibility, regression risk, and minimality.",
        "reason": "All ordinary Case gaps and state impacts are closed.",
        "derived_from": [
          "case_result",
          "content_revision:5"
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
        "goal": "审查完整实现的正确性、真实问题解决、验证可信度、回归风险和最小性。",
        "expected_state_change": "记录 clean Completion Review 并将 Case 解析为 resolved。"
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
            "runtime/arcorbit/src/desktop/desktop-store.mjs",
            "runtime/arcorbit/src/automation-coordinator.mjs",
            "runtime/arcorbit/src/desktop-run-manager.mjs",
            "runtime/arcorbit/src/projection/run-activity-patch.mjs",
            "runtime/arcorbit/desktop/renderer/run-activity-sync.mjs",
            "runtime/arcorbit/test/desktop-store.test.mjs",
            "runtime/arcorbit/test/automation-coordinator.test.mjs",
            "runtime/arcorbit/test/run-activity-sync.test.mjs",
            "runtime/arcorbit/test/desktop-renderer.test.mjs",
            "runtime/arcorbit/test/state-kernel-performance.test.mjs",
            "arckit/tech/arcorbit/state-kernel-acceptance.md",
            "npm run check: 578 tests, 555 passed, 23 skipped, 0 failed"
          ],
          "reviewed_content_revision": 5
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
        "project_revision": 328,
        "judgments": [
          {
            "invariant_ref": "product-expectations-remain-recoverable",
            "disposition": "not_relevant",
            "reason": "Review 不改变产品预期。",
            "fact_refs": [],
            "evidence": [],
            "gap_refs": []
          },
          {
            "invariant_ref": "interaction-expectations-remain-recoverable",
            "disposition": "upheld",
            "reason": "Review 确认 activity owner、patch 与 fallback 交互边界有直接回归证据。",
            "fact_refs": [
              "FACT-20260830-002-006"
            ],
            "evidence": [
              "runtime/arcorbit/test/run-activity-sync.test.mjs",
              "runtime/arcorbit/test/desktop-renderer.test.mjs"
            ],
            "gap_refs": []
          },
          {
            "invariant_ref": "visual-language-remains-consistent",
            "disposition": "not_relevant",
            "reason": "Review 不改变视觉语言。",
            "fact_refs": [],
            "evidence": [],
            "gap_refs": []
          },
          {
            "invariant_ref": "technical-decisions-remain-explainable",
            "disposition": "upheld",
            "reason": "Review 未发现技术文档、schema 和实现边界不一致。",
            "fact_refs": [
              "FACT-20260830-002-002",
              "FACT-20260830-002-006"
            ],
            "evidence": [
              "arckit/tech/arcorbit/desktop-execution-solution.md",
              "arckit/tech/arcorbit/state-kernel-acceptance.md"
            ],
            "gap_refs": []
          },
          {
            "invariant_ref": "accepted-facts-are-realized",
            "disposition": "upheld",
            "reason": "Review 逐项确认单写者 State Kernel、共享 query、局部 patch 与分区持久化均存在于生产代码并由测试覆盖。",
            "fact_refs": [
              "FACT-20260830-002-003",
              "FACT-20260830-002-004",
              "FACT-20260830-002-005",
              "FACT-20260830-002-006"
            ],
            "evidence": [
              "runtime/arcorbit/src/desktop/desktop-store.mjs",
              "runtime/arcorbit/src/automation-coordinator.mjs",
              "runtime/arcorbit/src/desktop-run-manager.mjs",
              "runtime/arcorbit/desktop/renderer/run-activity-sync.mjs"
            ],
            "gap_refs": []
          },
          {
            "invariant_ref": "material-risks-have-credible-evidence",
            "disposition": "upheld",
            "reason": "Review 确认性能数据可由仓库 benchmark 和 opt-in test 重复，恢复与回归由专项及 578 项全量测试支持，并明确保留目标 Electron 墙钟 soak 的发布观测边界。",
            "fact_refs": [
              "FACT-20260830-002-006"
            ],
            "evidence": [
              "arckit/tech/arcorbit/state-kernel-acceptance.md",
              "runtime/arcorbit/scripts/benchmark-state-kernel.mjs",
              "runtime/arcorbit/test/state-kernel-performance.test.mjs",
              "runtime/arcorbit/test/desktop-store.test.mjs",
              "npm run check: 578 tests, 555 passed, 23 skipped, 0 failed"
            ],
            "gap_refs": []
          }
        ]
      },
      "evidence": [
        "arckit/tech/arcorbit/state-kernel-acceptance.md",
        "runtime/arcorbit/test/state-kernel-performance.test.mjs",
        "runtime/arcorbit/test/run-activity-sync.test.mjs",
        "runtime/arcorbit/test/desktop-store.test.mjs",
        "runtime/arcorbit/test/automation-coordinator.test.mjs",
        "runtime/arcorbit/test/desktop-renderer.test.mjs",
        "npm run check: 578 tests, 555 passed, 23 skipped, 0 failed"
      ],
      "runtime_result_ref": "",
      "occurred_at": "2026-08-30T09:57:45.516Z"
    }
  ],
  "case_resolution": {
    "status": "resolved",
    "stage": "resolved",
    "satisfied": [
      "GAP-20260830-002-001",
      "GAP-20260830-002-002",
      "GAP-20260830-002-003",
      "GAP-20260830-002-004",
      "GAP-20260830-002-005"
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
    "updated_at": "2026-08-30T09:57:45.516Z"
  }
}
```

## Round Notes

- Case history is canonical in Structured Record.rounds; keep prose notes exceptional.
