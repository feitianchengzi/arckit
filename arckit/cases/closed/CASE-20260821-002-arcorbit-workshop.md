# ArcOrbit 与 Workshop 可靠实时同步

Case: CASE-20260821-002
Status: closed
Artifact Type: mixed
Selected Gap: none
Updated: 2026-08-21T18:15:41.174Z

## User Intent

以 Workshop 可靠事件流替代 ArcOrbit 每分钟全量轮询作为主要发现机制，完整实现跨后端、Desktop 和恢复链路的实时任务同步，同时保持 Workshop 为事实源并保证 awaiting_human 只能由显式用户介入解除。

## Structured Record

```json
{
  "schema_version": "development-case-record/v5",
  "id": "CASE-20260821-002",
  "title": "ArcOrbit 与 Workshop 可靠实时同步",
  "status": "closed",
  "artifact_type": "mixed",
  "created_at": "2026-08-21T17:00:45.409Z",
  "updated_at": "2026-08-21T18:15:41.174Z",
  "user_intent": "以 Workshop 可靠事件流替代 ArcOrbit 每分钟全量轮询作为主要发现机制，完整实现跨后端、Desktop 和恢复链路的实时任务同步，同时保持 Workshop 为事实源并保证 awaiting_human 只能由显式用户介入解除。",
  "expected_outcome": "Workshop 提供可跨实例、可恢复、可授权撤销的事件流契约；ArcOrbit 通过事件驱动的项目增量同步及时发现任务变化，重连和低频对账补偿漏失，数据刷新与自动调度解耦，人工等待在启动、重连和任何同步中保持关闭式保护，并由自动化和真实链路证据完成验收。",
  "project_state_ref": "arckit/project/state.record.json",
  "current_round": {
    "goal": "",
    "selected_gap": null
  },
  "facts": [
    {
      "id": "FACT-001",
      "revision": 1,
      "status": "superseded",
      "statement": "ArcOrbit Desktop 当前启动后每 60 秒调用 automationCoordinator.sync；该 sync 获取当前用户和全部 Workshop 项目、并发查询每个项目分配给当前用户的任务、重建快照、执行 Runtime/Case 对账，且默认尝试 maybeStartNext 自动派发。",
      "basis": "ArcOrbit 当前实现的直接代码证据。",
      "evidence": [
        "runtime/arcorbit/desktop/main.mjs:318",
        "runtime/arcorbit/src/automation-coordinator.mjs:146",
        "runtime/arcorbit/src/automation-coordinator.mjs:196",
        "runtime/arcorbit/src/automation-coordinator.mjs:252",
        "runtime/arcorbit/src/task-source-adapter.mjs:288"
      ]
    },
    {
      "id": "FACT-002",
      "revision": 1,
      "status": "accepted",
      "statement": "Workshop 已提供项目级 WebSocket、JWT 子协议鉴权、项目成员握手校验、Ping/Pong 和 task/project/member 等变更事件；Website 已用指数退避重连和 300ms 去抖后的 REST cache invalidation 消费这些事件。",
      "basis": "Workshop 后端接口、实现与 Website 消费代码的交叉证据。",
      "evidence": [
        "/Users/Glare/Library/Developer/ModularProgram/hoewo/workshop-todo/api/project.md:19",
        "/Users/Glare/Library/Developer/ModularProgram/hoewo/workshop-todo/handler/realtime.go:55",
        "/Users/Glare/Library/Developer/ModularProgram/hoewo/workshop-todo-website/frontend/src/hooks/useProjectWebSocket.ts:73",
        "/Users/Glare/Library/Developer/ModularProgram/hoewo/workshop-todo-website/frontend/src/pages/ProjectDetailPage.tsx:321"
      ]
    },
    {
      "id": "FACT-003",
      "revision": 1,
      "status": "superseded",
      "statement": "Workshop 当前 WebSocket Hub 是单进程内存单例，事件 envelope 没有 event_id、project revision 或 replay cursor；Website 在重连收到 system.connected 时直接忽略，现有链路不能证明跨实例投递或断线期间事件补偿。",
      "basis": "Workshop realtime Hub、事件结构和 Website 事件处理的直接代码证据。",
      "evidence": [
        "/Users/Glare/Library/Developer/ModularProgram/hoewo/workshop-todo/realtime/notify.go:3",
        "/Users/Glare/Library/Developer/ModularProgram/hoewo/workshop-todo/realtime/hub.go:7",
        "/Users/Glare/Library/Developer/ModularProgram/hoewo/workshop-todo/realtime/event.go:5",
        "/Users/Glare/Library/Developer/ModularProgram/hoewo/workshop-todo-website/frontend/src/pages/ProjectDetailPage.tsx:390"
      ]
    },
    {
      "id": "FACT-004",
      "revision": 1,
      "status": "accepted",
      "statement": "操作者要求不采用临时分阶段折中，而是直接完成可靠实时同步优化，并要求自动执行 state-driven Loop 直到完成；只有真正需要人工责任时暂停。",
      "basis": "当前操作者输入是本轮最高权威增量。",
      "evidence": [
        "Current operator input, 2026-08-22"
      ]
    },
    {
      "id": "FACT-005",
      "revision": 1,
      "status": "accepted",
      "statement": "Workshop 的可靠实时基础采用 PostgreSQL project_events 全局单调游标和 30 天保留；业务变更与事件同事务提交，pg_notify 仅作提交后跨实例唤醒，各实例按游标读取并广播；项目 WebSocket 暴露最新/最早游标，REST replay 提供有序补取并以 EVENT_CURSOR_EXPIRED 表达保留窗外游标。",
      "basis": "现有 Workshop 使用共享 PostgreSQL，方案无需第二套基础设施且覆盖持久性、跨实例和断线恢复。",
      "evidence": [
        "arckit/tech/arcorbit/realtime-synchronization-solution.md",
        "/Users/Glare/Library/Developer/ModularProgram/hoewo/workshop-todo/config/database.go",
        "/Users/Glare/Library/Developer/ModularProgram/hoewo/workshop-todo/go.mod"
      ]
    },
    {
      "id": "FACT-006",
      "revision": 1,
      "status": "accepted",
      "statement": "Workshop 事件只作为失效提示，REST 继续是事实源；Website 和 ArcOrbit 按项目维护游标、重连先补取并去重，ArcOrbit 对事件做 300ms 项目级刷新、健康时每 15 分钟全量对账、断线时每 60 秒兜底，刷新与执行仲裁分离，任何实时、补取或对账路径都不得解除 awaiting_human，只有显式用户操作携带 allowAgentResume 才能解除。",
      "basis": "该策略同时控制延迟、负载、漏事件和误自动继续风险。",
      "evidence": [
        "arckit/spec/agentic-software-development/runtime-automation-workspace.md",
        "arckit/interaction/automation-workspace/interaction.md",
        "arckit/tech/arcorbit/realtime-synchronization-solution.md"
      ]
    },
    {
      "id": "FACT-007",
      "revision": 1,
      "status": "accepted",
      "statement": "Workshop now persists project mutation events transactionally in PostgreSQL, serializes event ID allocation through commit, wakes every service instance with LISTEN/NOTIFY, replays authorized project events with a 30-day retention contract, isolates slow clients, sends system.connected before queued domain events, and closes revoked project/member connections after their final event.",
      "basis": "Implemented backend code and PostgreSQL-backed integration evidence.",
      "evidence": [
        "/Users/Glare/Library/Developer/ModularProgram/hoewo/workshop-todo/models/project_event.go",
        "/Users/Glare/Library/Developer/ModularProgram/hoewo/workshop-todo/realtime/store.go",
        "/Users/Glare/Library/Developer/ModularProgram/hoewo/workshop-todo/realtime/broker.go",
        "/Users/Glare/Library/Developer/ModularProgram/hoewo/workshop-todo/handler/realtime.go",
        "/Users/Glare/Library/Developer/ModularProgram/hoewo/workshop-todo/realtime/store_integration_test.go",
        "/Users/Glare/Library/Developer/ModularProgram/hoewo/workshop-todo/realtime_e2e_test.go"
      ]
    },
    {
      "id": "FACT-008",
      "revision": 1,
      "status": "superseded",
      "statement": "Website and ArcOrbit now treat events as invalidations, replay and deduplicate project cursors, advance cursors only after successful REST refresh, proactively reconnect credentials, expose realtime health, refresh affected ArcOrbit projects in a 300ms window, reconcile globally every 15 minutes, use 60-second polling only while realtime is degraded, and preserve awaiting_human until explicit intervention.",
      "basis": "Implemented client/runtime code plus full automated, production-build, distribution, and real PostgreSQL validation.",
      "evidence": [
        "/Users/Glare/Library/Developer/ModularProgram/hoewo/workshop-todo-website/frontend/src/hooks/useProjectWebSocket.ts",
        "/Users/Glare/Library/Developer/ModularProgram/hoewo/workshop-todo-website/frontend/src/lib/realtime/projectEventStream.test.ts",
        "runtime/arcorbit/src/workshop-realtime-adapter.mjs",
        "runtime/arcorbit/desktop/main.mjs",
        "runtime/arcorbit/src/automation-coordinator.mjs",
        "runtime/arcorbit/test/workshop-realtime-adapter.test.mjs",
        "runtime/arcorbit/test/automation-coordinator.test.mjs",
        "Verification: Workshop go test ./... with temporary PostgreSQL, Website vitest plus Vite production build, ArcOrbit npm run check plus smoke:distribution, 2026-08-22"
      ]
    },
    {
      "id": "FACT-008",
      "revision": 2,
      "status": "accepted",
      "statement": "Website and ArcOrbit treat events as invalidations, replay and deduplicate project cursors, advance cursors only after successful REST refresh, fail closed on unknown durable Website events, proactively reconnect credentials, expose realtime health, refresh affected ArcOrbit projects in a 300ms window, reconcile globally every 15 minutes, use 60-second polling only while realtime is degraded, and preserve awaiting_human until explicit intervention.",
      "basis": "Corrected client/runtime implementation plus ordered-acknowledgement, unknown-schema, build, full Runtime, and real PostgreSQL validation.",
      "evidence": [
        "/Users/Glare/Library/Developer/ModularProgram/hoewo/workshop-todo-website/frontend/src/hooks/useProjectWebSocket.ts",
        "/Users/Glare/Library/Developer/ModularProgram/hoewo/workshop-todo-website/frontend/src/pages/ProjectDetailPage.tsx",
        "/Users/Glare/Library/Developer/ModularProgram/hoewo/workshop-todo-website/frontend/src/lib/realtime/projectEventStream.test.ts",
        "runtime/arcorbit/src/workshop-realtime-adapter.mjs",
        "runtime/arcorbit/test/automation-coordinator.test.mjs"
      ]
    }
  ],
  "state_impacts": [
    {
      "id": "IMPACT-001",
      "fact_id": "FACT-005",
      "fact_revision": 1,
      "target": {
        "kind": "software_invariant",
        "ref": "accepted-facts-are-realized",
        "revision": null
      },
      "effect": "upheld",
      "reason": "The accepted durable event, replay, cross-instance, and transaction contract is now realized in production code.",
      "gap_ids": [],
      "evidence": [
        "/Users/Glare/Library/Developer/ModularProgram/hoewo/workshop-todo/realtime/store.go",
        "/Users/Glare/Library/Developer/ModularProgram/hoewo/workshop-todo/realtime/broker.go",
        "/Users/Glare/Library/Developer/ModularProgram/hoewo/workshop-todo/realtime/store_integration_test.go",
        "/Users/Glare/Library/Developer/ModularProgram/hoewo/workshop-todo/realtime_e2e_test.go"
      ]
    },
    {
      "id": "IMPACT-002",
      "fact_id": "FACT-006",
      "fact_revision": 1,
      "target": {
        "kind": "software_invariant",
        "ref": "material-risks-have-credible-evidence",
        "revision": null
      },
      "effect": "upheld",
      "reason": "Replay, cursor expiry, commit ordering, cross-instance delivery, slow/revoked clients, reconnect, logout races, degraded fallback, and awaiting_human preservation have direct regression evidence.",
      "gap_ids": [],
      "evidence": [
        "/Users/Glare/Library/Developer/ModularProgram/hoewo/workshop-todo/realtime/store_integration_test.go",
        "/Users/Glare/Library/Developer/ModularProgram/hoewo/workshop-todo/realtime/hub_test.go",
        "/Users/Glare/Library/Developer/ModularProgram/hoewo/workshop-todo-website/frontend/src/lib/realtime/projectEventStream.test.ts",
        "runtime/arcorbit/test/workshop-realtime-adapter.test.mjs",
        "runtime/arcorbit/test/automation-coordinator.test.mjs"
      ]
    }
  ],
  "gaps": [
    {
      "id": "GAP-reliable-realtime-contract",
      "status": "resolved",
      "goal": "建立 ArcOrbit 与 Workshop 完整可靠实时同步契约，明确事件持久性与顺序、跨实例传递、订阅与授权生命周期、断线补偿、REST 事实源、目标刷新范围、自动调度边界、低频对账和 awaiting_human 不变量。",
      "reason": "后续后端数据模型、事件 transport、ArcOrbit adapter、同步拆分和验收方式都会随这些边界变化；当前项目决策仍声称 ArcOrbit 消费 Workshop 无需后端修改，而现有 WebSocket 又没有可靠恢复语义，因此必须先接受完整契约。",
      "derived_from": [
        "FACT-001",
        "FACT-002",
        "FACT-003",
        "FACT-004"
      ],
      "blocked_by": [],
      "priority_basis": {
        "blocking": "决定跨三个代码库的实现对象与可验收一致性边界。",
        "uncertainty": "必须选择持久事件游标、跨实例广播、订阅粒度与恢复策略的权威归属。",
        "risk": "错误设计可能漏任务、重复调度、在权限撤销后继续接收事件，或再次越过人工 gate。",
        "user_impact": "当前轮询延迟、负载和恢复行为直接影响自动执行可信度。"
      },
      "responsibility": "agent",
      "evidence_required": [
        "稳定技术事实明确 Workshop 事件持久化、游标、跨实例和授权撤销契约",
        "稳定产品/交互事实明确实时、重连、降级、人工 gate 和用户可见状态语义",
        "跨仓库实现边界、数据流、失败恢复与验收矩阵可恢复",
        "现有无后端修改决策与新完整实现范围的冲突被显式更新"
      ],
      "resolution": {
        "id": "GAP-reliable-realtime-contract",
        "status": "resolved",
        "outcome": "可靠实时同步契约已在产品、交互和技术事实中完整建立。",
        "reason": "已明确持久事件、跨实例、游标恢复、授权、目标刷新、对账与人工 Gate。",
        "evidence": [
          "arckit/spec/agentic-software-development/runtime-automation-workspace.md",
          "arckit/interaction/automation-workspace/interaction.md",
          "arckit/tech/arcorbit/realtime-synchronization-solution.md"
        ],
        "occurred_at": "2026-08-21T17:13:48.333Z"
      }
    },
    {
      "id": "GAP-reliable-realtime-implementation",
      "status": "resolved",
      "goal": "在 Workshop 后端、Workshop Website 与 ArcOrbit Desktop 中完整实现可靠项目事件流、游标补取、跨实例分发、目标刷新、降级对账、可观测状态和人工 Gate 隔离，并用自动化与真实链路证据验收。",
      "reason": "可靠实时同步契约已经稳定，但实际软件仍是无游标单进程 WebSocket、Website 无补取、ArcOrbit 每分钟全量发现；需要一次跨仓库实现闭环兑现接受的事实。",
      "derived_from": [
        "FACT-005",
        "FACT-006",
        "IMPACT-001",
        "IMPACT-002"
      ],
      "blocked_by": [],
      "priority_basis": {
        "blocking": "用户要求直接完成优化，当前实现尚未兑现契约。",
        "uncertainty": "契约已收敛，剩余不确定性集中在实现接线与兼容性。",
        "risk": "涉及事务一致性、跨实例通知、断线恢复、权限撤销和重复调度。",
        "user_impact": "决定任务变化能否及时、可靠地触达且不会越过人工确认。"
      },
      "responsibility": "agent",
      "evidence_required": [
        "Workshop 持久事件、事务写入、replay、LISTEN/NOTIFY、授权撤销与慢消费者测试",
        "Website cursor replay、去重、失效补偿和降级测试",
        "ArcOrbit Realtime Adapter、项目级刷新、启动/重连/低频对账、awaiting_human Gate 测试",
        "跨仓库静态检查、自动化测试与可用环境中的真实链路验收"
      ],
      "resolution": {
        "id": "GAP-reliable-realtime-implementation",
        "status": "resolved",
        "outcome": "Reliable project event discovery, replay, targeted refresh, degraded fallback, observability, and human-gate isolation are implemented across all three repositories.",
        "reason": "The durable event log, commit-ordered IDs, transaction-bound notifications, cross-instance Broker, replay API, reconnecting clients, ArcOrbit targeted refresh, low-frequency reconciliation, and explicit resume boundary are implemented and verified.",
        "evidence": [
          "/Users/Glare/Library/Developer/ModularProgram/hoewo/workshop-todo/realtime/store.go",
          "/Users/Glare/Library/Developer/ModularProgram/hoewo/workshop-todo/realtime/broker.go",
          "/Users/Glare/Library/Developer/ModularProgram/hoewo/workshop-todo/realtime_e2e_test.go",
          "/Users/Glare/Library/Developer/ModularProgram/hoewo/workshop-todo-website/frontend/src/hooks/useProjectWebSocket.ts",
          "runtime/arcorbit/src/workshop-realtime-adapter.mjs",
          "runtime/arcorbit/src/automation-coordinator.mjs",
          "runtime/arcorbit/test/workshop-realtime-adapter.test.mjs",
          "runtime/arcorbit/test/automation-coordinator.test.mjs"
        ],
        "occurred_at": "2026-08-21T18:06:13.374Z"
      }
    },
    {
      "id": "CASE-20260821-002:review-finding:WEBSITE-CURSOR-FAIL-CLOSED",
      "status": "resolved",
      "goal": "Resolve review finding: Make Website cursor acknowledgement fail closed: an unrecognized durable event must trigger full project invalidation instead of advancing silently, invalidation failures must reject, and component cleanup must not resolve an unfinished refresh as success; add regression evidence for ordered acknowledgement and unknown-event routing.",
      "reason": "omission found by completion review",
      "derived_from": [
        "completion_review",
        "content_revision:2"
      ],
      "blocked_by": [],
      "priority_basis": {
        "blocking": "high",
        "risk": "high"
      },
      "responsibility": "agent",
      "evidence_required": [
        "/Users/Glare/Library/Developer/ModularProgram/hoewo/workshop-todo-website/frontend/src/hooks/useProjectWebSocket.ts",
        "/Users/Glare/Library/Developer/ModularProgram/hoewo/workshop-todo-website/frontend/src/pages/ProjectDetailPage.tsx",
        "/Users/Glare/Library/Developer/ModularProgram/hoewo/workshop-todo-website/frontend/src/lib/realtime/projectEventStream.test.ts",
        "ProjectDetailPage handleSocketEvent returns success with no invalidation target for an unknown durable event.",
        "ProjectDetailPage cleanup resolves pending realtime waiters, allowing the hook to treat an unfinished refresh as acknowledged.",
        "React Query invalidation calls do not request throwOnError, so failed refetch acknowledgement is not fail-closed."
      ],
      "resolution": {
        "id": "CASE-20260821-002:review-finding:WEBSITE-CURSOR-FAIL-CLOSED",
        "status": "resolved",
        "outcome": "Website now rejects failed or cancelled refresh acknowledgement and fully invalidates on unknown durable events or unsupported schemas.",
        "reason": "The page uses throwOnError, rejects cleanup waiters, routes unknown durable events to all project resources, and verifies ordered acknowledgement and routing behavior.",
        "evidence": [
          "/Users/Glare/Library/Developer/ModularProgram/hoewo/workshop-todo-website/frontend/src/pages/ProjectDetailPage.tsx",
          "/Users/Glare/Library/Developer/ModularProgram/hoewo/workshop-todo-website/frontend/src/lib/realtime/projectEventStream.ts",
          "/Users/Glare/Library/Developer/ModularProgram/hoewo/workshop-todo-website/frontend/src/lib/realtime/projectEventStream.test.ts",
          "Verification: Website vitest 4 tests and Vite production build passed, 2026-08-22"
        ],
        "occurred_at": "2026-08-21T18:12:01.656Z"
      }
    },
    {
      "id": "GAP-realtime-e2e-determinism",
      "responsibility": "agent",
      "goal": "Make the Workshop HTTP-to-WebSocket-to-replay E2E test distinguish deterministic live delivery from the valid upgrade/replay race.",
      "reason": "A mutation concurrent with WebSocket upgrade may validly land in system.connected.latest_event_id and be recovered by replay rather than arrive as a subsequent live frame; the test should establish connected first before asserting live delivery.",
      "derived_from": [
        "FACT-007",
        "FACT-008",
        "final_verification"
      ],
      "blocked_by": [],
      "priority_basis": {
        "blocking": "Test credibility before final review",
        "risk": "medium"
      },
      "evidence_required": [
        "/Users/Glare/Library/Developer/ModularProgram/hoewo/workshop-todo/realtime_e2e_test.go",
        "Real PostgreSQL go test ./..."
      ],
      "status": "resolved",
      "resolution": {
        "id": "GAP-realtime-e2e-determinism",
        "status": "resolved",
        "outcome": "The test first asserts system.connected, then performs the mutation and verifies its live event and replay record.",
        "reason": "This preserves handshake, mutation, WebSocket delivery, and replay coverage while removing an incorrect expectation about mutations racing the upgrade boundary.",
        "evidence": [
          "/Users/Glare/Library/Developer/ModularProgram/hoewo/workshop-todo/realtime_e2e_test.go",
          "Verification: temporary PostgreSQL go test ./... passed, 2026-08-22"
        ],
        "occurred_at": "2026-08-21T18:14:23.381Z"
      }
    }
  ],
  "content_revision": 4,
  "completion_review": {
    "status": "clean",
    "policy": {
      "initial_max_cycles": 3,
      "source": "User authorized automatic state-driven execution until completion on 2026-08-22.",
      "snapshotted_at": "2026-08-21T17:00:45.409Z"
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
        "content_revision": 2,
        "dimensions": {
          "implementation_correctness": "findings",
          "problem_resolution": "clean",
          "verification_credibility": "clean",
          "regression_risk": "findings",
          "minimality": "clean"
        },
        "finding_ids": [
          "WEBSITE-CURSOR-FAIL-CLOSED"
        ],
        "evidence": [
          "/Users/Glare/Library/Developer/ModularProgram/hoewo/workshop-todo-website/frontend/src/hooks/useProjectWebSocket.ts",
          "/Users/Glare/Library/Developer/ModularProgram/hoewo/workshop-todo-website/frontend/src/pages/ProjectDetailPage.tsx",
          "/Users/Glare/Library/Developer/ModularProgram/hoewo/workshop-todo-website/frontend/src/lib/realtime/projectEventStream.test.ts",
          "/Users/Glare/Library/Developer/ModularProgram/hoewo/workshop-todo/realtime/store_integration_test.go",
          "runtime/arcorbit/test/automation-coordinator.test.mjs"
        ],
        "occurred_at": "2026-08-21T18:09:13.462Z"
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
          "arckit/tech/arcorbit/realtime-synchronization-solution.md",
          "/Users/Glare/Library/Developer/ModularProgram/hoewo/workshop-todo/realtime/store.go",
          "/Users/Glare/Library/Developer/ModularProgram/hoewo/workshop-todo/realtime/broker.go",
          "/Users/Glare/Library/Developer/ModularProgram/hoewo/workshop-todo/realtime/store_integration_test.go",
          "/Users/Glare/Library/Developer/ModularProgram/hoewo/workshop-todo/realtime_e2e_test.go",
          "/Users/Glare/Library/Developer/ModularProgram/hoewo/workshop-todo-website/frontend/src/lib/realtime/projectEventStream.test.ts",
          "runtime/arcorbit/src/workshop-realtime-adapter.mjs",
          "runtime/arcorbit/test/workshop-realtime-adapter.test.mjs",
          "runtime/arcorbit/test/automation-coordinator.test.mjs",
          "Verification: Workshop real PostgreSQL go test ./..., Website 4 Vitest tests plus Vite production build, ArcOrbit 249 tests plus distribution smoke, 2026-08-22"
        ],
        "occurred_at": "2026-08-21T18:15:41.174Z"
      }
    ],
    "evidence": [
      "/Users/Glare/Library/Developer/ModularProgram/hoewo/workshop-todo-website/frontend/src/hooks/useProjectWebSocket.ts",
      "/Users/Glare/Library/Developer/ModularProgram/hoewo/workshop-todo-website/frontend/src/pages/ProjectDetailPage.tsx",
      "/Users/Glare/Library/Developer/ModularProgram/hoewo/workshop-todo-website/frontend/src/lib/realtime/projectEventStream.test.ts",
      "/Users/Glare/Library/Developer/ModularProgram/hoewo/workshop-todo/realtime/store_integration_test.go",
      "runtime/arcorbit/test/automation-coordinator.test.mjs",
      "arckit/tech/arcorbit/realtime-synchronization-solution.md",
      "/Users/Glare/Library/Developer/ModularProgram/hoewo/workshop-todo/realtime/store.go",
      "/Users/Glare/Library/Developer/ModularProgram/hoewo/workshop-todo/realtime/broker.go",
      "/Users/Glare/Library/Developer/ModularProgram/hoewo/workshop-todo/realtime_e2e_test.go",
      "runtime/arcorbit/src/workshop-realtime-adapter.mjs",
      "runtime/arcorbit/test/workshop-realtime-adapter.test.mjs",
      "Verification: Workshop real PostgreSQL go test ./..., Website 4 Vitest tests plus Vite production build, ArcOrbit 249 tests plus distribution smoke, 2026-08-22"
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
      "goal": "固化可靠实时同步的权威边界并建立实现 Gap。",
      "outcome": "completed",
      "gap_selection": {
        "mode": "candidate",
        "basis": "当前 Case 唯一 ready Gap 先收束跨仓库可靠实时同步契约。",
        "snapshot_token": "b54f16e217683e08059a8aba6e0cef6c3b4c38adc0663bade9c1e44ad7106064",
        "selected_ref": "case-gap:CASE-20260821-002:GAP-reliable-realtime-contract",
        "considered": [
          {
            "ref": "project-gap:GAP-agent-scenario-evaluation",
            "source": "persisted",
            "eligibility": "case_required",
            "disposition": "deferred",
            "reason": "独立项目级评估，不能替代当前 Case。",
            "priority_basis": {
              "risk": "high"
            }
          },
          {
            "ref": "project-gap:GAP-runtime-resilience-and-adapters",
            "source": "persisted",
            "eligibility": "case_required",
            "disposition": "deferred",
            "reason": "范围更广，当前同步链路直接阻塞用户目标。",
            "priority_basis": {
              "risk": "high"
            }
          },
          {
            "ref": "project-gap:GAP-security-real-project-validation",
            "source": "persisted",
            "eligibility": "case_required",
            "disposition": "deferred",
            "reason": "需要另建真实权限 Case。",
            "priority_basis": {
              "risk": "high"
            }
          },
          {
            "ref": "project-gap:GAP-cross-record-audit",
            "source": "persisted",
            "eligibility": "case_required",
            "disposition": "deferred",
            "reason": "独立治理 Gap，不抢占当前目标。",
            "priority_basis": {
              "risk": "high"
            }
          },
          {
            "ref": "case-gap:CASE-20260821-002:GAP-reliable-realtime-contract",
            "source": "persisted",
            "eligibility": "ready",
            "disposition": "selected",
            "reason": "当前 Case 唯一 ready Gap，完整实现依赖其边界。",
            "priority_basis": {
              "blocking": "highest"
            }
          }
        ],
        "comparison_summary": "可靠实时契约对当前用户目标具有唯一直接阻塞性，其余项目级候选保持原状态。",
        "fresh_discovery_summary": "未发现需抢占本轮的新鲜 Gap；实现义务记录为下游 Gap。"
      },
      "selected_gap": {
        "id": "GAP-reliable-realtime-contract",
        "responsibility": "agent",
        "goal": "建立 ArcOrbit 与 Workshop 完整可靠实时同步契约，明确事件持久性与顺序、跨实例传递、订阅与授权生命周期、断线补偿、REST 事实源、目标刷新范围、自动调度边界、低频对账和 awaiting_human 不变量。",
        "reason": "后续后端数据模型、事件 transport、ArcOrbit adapter、同步拆分和验收方式都会随这些边界变化；当前项目决策仍声称 ArcOrbit 消费 Workshop 无需后端修改，而现有 WebSocket 又没有可靠恢复语义，因此必须先接受完整契约。",
        "derived_from": [
          "FACT-001",
          "FACT-002",
          "FACT-003",
          "FACT-004"
        ],
        "blocked_by": [],
        "priority_basis": {
          "blocking": "决定跨三个代码库的实现对象与可验收一致性边界。",
          "uncertainty": "必须选择持久事件游标、跨实例广播、订阅粒度与恢复策略的权威归属。",
          "risk": "错误设计可能漏任务、重复调度、在权限撤销后继续接收事件，或再次越过人工 gate。",
          "user_impact": "当前轮询延迟、负载和恢复行为直接影响自动执行可信度。"
        },
        "evidence_required": [
          "稳定技术事实明确 Workshop 事件持久化、游标、跨实例和授权撤销契约",
          "稳定产品/交互事实明确实时、重连、降级、人工 gate 和用户可见状态语义",
          "跨仓库实现边界、数据流、失败恢复与验收矩阵可恢复",
          "现有无后端修改决策与新完整实现范围的冲突被显式更新"
        ]
      },
      "planned_transition": {
        "goal": "固化可靠实时同步的权威边界并建立实现 Gap。",
        "expected_state_change": "契约 Gap resolved，冲突 Project 决策更新，Case 进入完整实现。"
      },
      "accepted_state_delta": {
        "resolved_gap": {
          "id": "GAP-reliable-realtime-contract",
          "status": "resolved",
          "outcome": "可靠实时同步契约已在产品、交互和技术事实中完整建立。",
          "reason": "已明确持久事件、跨实例、游标恢复、授权、目标刷新、对账与人工 Gate。",
          "evidence": [
            "arckit/spec/agentic-software-development/runtime-automation-workspace.md",
            "arckit/interaction/automation-workspace/interaction.md",
            "arckit/tech/arcorbit/realtime-synchronization-solution.md"
          ]
        },
        "facts_added": [
          {
            "id": "FACT-005",
            "revision": 1,
            "status": "accepted",
            "statement": "Workshop 的可靠实时基础采用 PostgreSQL project_events 全局单调游标和 30 天保留；业务变更与事件同事务提交，pg_notify 仅作提交后跨实例唤醒，各实例按游标读取并广播；项目 WebSocket 暴露最新/最早游标，REST replay 提供有序补取并以 EVENT_CURSOR_EXPIRED 表达保留窗外游标。",
            "basis": "现有 Workshop 使用共享 PostgreSQL，方案无需第二套基础设施且覆盖持久性、跨实例和断线恢复。",
            "evidence": [
              "arckit/tech/arcorbit/realtime-synchronization-solution.md",
              "/Users/Glare/Library/Developer/ModularProgram/hoewo/workshop-todo/config/database.go",
              "/Users/Glare/Library/Developer/ModularProgram/hoewo/workshop-todo/go.mod"
            ]
          },
          {
            "id": "FACT-006",
            "revision": 1,
            "status": "accepted",
            "statement": "Workshop 事件只作为失效提示，REST 继续是事实源；Website 和 ArcOrbit 按项目维护游标、重连先补取并去重，ArcOrbit 对事件做 300ms 项目级刷新、健康时每 15 分钟全量对账、断线时每 60 秒兜底，刷新与执行仲裁分离，任何实时、补取或对账路径都不得解除 awaiting_human，只有显式用户操作携带 allowAgentResume 才能解除。",
            "basis": "该策略同时控制延迟、负载、漏事件和误自动继续风险。",
            "evidence": [
              "arckit/spec/agentic-software-development/runtime-automation-workspace.md",
              "arckit/interaction/automation-workspace/interaction.md",
              "arckit/tech/arcorbit/realtime-synchronization-solution.md"
            ]
          }
        ],
        "facts_superseded": [],
        "impacts_added": [
          {
            "id": "IMPACT-001",
            "fact_id": "FACT-005",
            "fact_revision": 1,
            "target": {
              "kind": "software_invariant",
              "ref": "accepted-facts-are-realized",
              "revision": null
            },
            "effect": "threatened",
            "reason": "可靠事件契约已接受但代码尚未兑现。",
            "gap_ids": [
              "GAP-reliable-realtime-implementation"
            ],
            "evidence": [
              "arckit/tech/arcorbit/realtime-synchronization-solution.md"
            ]
          },
          {
            "id": "IMPACT-002",
            "fact_id": "FACT-006",
            "fact_revision": 1,
            "target": {
              "kind": "software_invariant",
              "ref": "material-risks-have-credible-evidence",
              "revision": null
            },
            "effect": "threatened",
            "reason": "人工 Gate、重连和降级行为仍需跨仓库证据。",
            "gap_ids": [
              "GAP-reliable-realtime-implementation"
            ],
            "evidence": [
              "arckit/spec/agentic-software-development/runtime-automation-workspace.md",
              "arckit/interaction/automation-workspace/interaction.md",
              "arckit/tech/arcorbit/realtime-synchronization-solution.md"
            ]
          }
        ],
        "impacts_updated": [],
        "gaps_added": [
          {
            "id": "GAP-reliable-realtime-implementation",
            "status": "open",
            "goal": "在 Workshop 后端、Workshop Website 与 ArcOrbit Desktop 中完整实现可靠项目事件流、游标补取、跨实例分发、目标刷新、降级对账、可观测状态和人工 Gate 隔离，并用自动化与真实链路证据验收。",
            "reason": "可靠实时同步契约已经稳定，但实际软件仍是无游标单进程 WebSocket、Website 无补取、ArcOrbit 每分钟全量发现；需要一次跨仓库实现闭环兑现接受的事实。",
            "derived_from": [
              "FACT-005",
              "FACT-006",
              "IMPACT-001",
              "IMPACT-002"
            ],
            "blocked_by": [],
            "priority_basis": {
              "blocking": "用户要求直接完成优化，当前实现尚未兑现契约。",
              "uncertainty": "契约已收敛，剩余不确定性集中在实现接线与兼容性。",
              "risk": "涉及事务一致性、跨实例通知、断线恢复、权限撤销和重复调度。",
              "user_impact": "决定任务变化能否及时、可靠地触达且不会越过人工确认。"
            },
            "responsibility": "agent",
            "evidence_required": [
              "Workshop 持久事件、事务写入、replay、LISTEN/NOTIFY、授权撤销与慢消费者测试",
              "Website cursor replay、去重、失效补偿和降级测试",
              "ArcOrbit Realtime Adapter、项目级刷新、启动/重连/低频对账、awaiting_human Gate 测试",
              "跨仓库静态检查、自动化测试与可用环境中的真实链路验收"
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
            "observed_revision": 15,
            "set_decision": {
              "status": "settled",
              "statement": "ArcOrbit preserves Setup Readiness, supervised one-thread-per-todo automation, trusted ledger transitions, intervention/recovery and acceptance feedback while providing Desktop composition of Workshop organizations, organization and project membership, personal and organization projects, seven-state todos, ordinary user feedback, local Product Workspaces and a persistent multi-product Workset. Workset Feedback remains the developer processing workspace and ArcOrbit retains its independent Product 107 feedback center. ArcOrbit also presents planning-only Chat, Idea, Release, Operations and Engineering workspaces. Engineering demonstrates management of versioned Domain Profiles: a profile combines Project/Case domain State definitions, expected/actual/diagnosis capability mappings and lifecycle-stage interpretations; users can browse templates, create or duplicate drafts, edit mappings, compare changes and review an apply plan so different teams or industries can reuse the same Loop Kernel and product lifecycle. Entry skills remain part of the shared Loop Kernel and are excluded from profiles. No new backend, persistence, skill installation, profile application, Runtime, monitoring, market-platform or registry integration is claimed. Automation additionally discovers Workshop task changes through a reliable project event stream, refreshes only affected projects, reconciles globally at a low cadence, and never treats transport activity as approval to leave awaiting_human.",
              "reason": "Reliable realtime discovery and human-gated execution are now accepted product capabilities.",
              "evidence": [
                "Current operator input, 2026-08-20",
                "arckit/spec/agentic-software-development/arcorbit-planned-workspaces.md",
                "Current operator input, 2026-08-22",
                "arckit/spec/agentic-software-development/runtime-automation-workspace.md",
                "arckit/interaction/automation-workspace/interaction.md",
                "arckit/tech/arcorbit/realtime-synchronization-solution.md"
              ],
              "confidence": "high",
              "resume_condition": "Revisit when the reliable event contract, reconciliation cadence, source-of-truth boundary, or human Gate semantics change."
            },
            "gap_refs": [],
            "reason": "Reliable realtime discovery and human-gated execution are now accepted product capabilities.",
            "evidence": [
              "Current operator input, 2026-08-22",
              "arckit/spec/agentic-software-development/runtime-automation-workspace.md",
              "arckit/interaction/automation-workspace/interaction.md",
              "arckit/tech/arcorbit/realtime-synchronization-solution.md"
            ]
          },
          {
            "area_ref": "experience_and_interaction",
            "observed_revision": 26,
            "set_decision": {
              "status": "settled",
              "statement": "ArcOrbit uses three primary navigation groups: Personal contains Today and Chat; Product Lifecycle contains Idea, Work, Automation, Release, Operations and Feedback; Organization contains Organization and Engineering. English UI consistently uses Release and Operations, while Chinese descriptions use 发布 and 运营. Existing Workset, Work, Automation, Feedback, Organization, account, product-feedback and execution semantics remain authoritative. The five new pages are independent planning presentations built from current project facts. Engineering is a Domain Profile management preview with a Profile Library, draft metadata, State Model editor, Capability Mapping, Lifecycle Mapping, cross-industry change preview and Review & Apply confirmation. Profile changes replace domain State semantics and skills together while the shared Loop Kernel and Idea-to-Feedback lifecycle remain stable; all controls are non-persistent demonstrations. Setup Readiness separates global resource readiness from per-Product Workspace project readiness: binding or task start opens a project-scoped plan, all Codex-discoverable bundled skills and loaders target that project, legacy managed user targets receive visible backup/migration dispositions, and no user-level Codex target is offered. Automation shows realtime, reconnecting and degraded states; reconnect performs cursor recovery before current-state refresh, while an awaiting-human item remains paused until the user explicitly resumes it.",
              "reason": "Realtime recovery and persistent human-intervention journeys are now specified.",
              "evidence": [
                "Current operator input, 2026-08-21",
                "arckit/interaction/setup-readiness/interaction.md",
                "arckit/interaction/setup-readiness/default.html",
                "Current operator input, 2026-08-22",
                "arckit/spec/agentic-software-development/runtime-automation-workspace.md",
                "arckit/interaction/automation-workspace/interaction.md",
                "arckit/tech/arcorbit/realtime-synchronization-solution.md"
              ],
              "confidence": "high",
              "resume_condition": "Revisit when the reliable event contract, reconciliation cadence, source-of-truth boundary, or human Gate semantics change."
            },
            "gap_refs": [],
            "reason": "Realtime recovery and persistent human-intervention journeys are now specified.",
            "evidence": [
              "Current operator input, 2026-08-22",
              "arckit/spec/agentic-software-development/runtime-automation-workspace.md",
              "arckit/interaction/automation-workspace/interaction.md",
              "arckit/tech/arcorbit/realtime-synchronization-solution.md"
            ]
          },
          {
            "area_ref": "data_and_state",
            "observed_revision": 11,
            "set_decision": {
              "status": "settled",
              "statement": "Canonical development state remains in Project/Iteration/Case ledgers and Workshop remains source of truth for account, organization, project, membership, task, attachment, and ordinary-feedback records. ArcOrbit owns Product Workspace bindings from a Workshop Project to a local repository, persistent multi-product workset preferences, Runtime execution/session/thread state, intervention/recovery state, and first-class acceptance-feedback records outside the target repository. 产品反馈 Project ID 107 和项目专用 API Key 都是 ArcOrbit 产品代码常量并进入打包产物，不写入 userData；未读数量是运行期瞬时 UI 状态，反馈正文、消息和状态仍由 Feedback 平台拥有。ArcOrbit also owns the locked bundled-skill source store and consumer identity; ArcForge relation state records one effective project target set per normalized local project root, while the user catalog remains a non-Codex-discovery control-plane store rather than an Agent installation target. Workshop owns durable project event rows and global cursors in PostgreSQL; delivery is a recoverable invalidation channel while REST remains canonical. ArcOrbit owns per-project consumed cursors and connection health.",
              "reason": "The event and cursor ownership model extends the Workshop source-of-truth boundary.",
              "evidence": [
                "arckit/spec/arcorbit-distribution.md",
                "arckit/tech/arcorbit/installer-supply-chain.md",
                "Current operator input, 2026-08-22",
                "arckit/spec/agentic-software-development/runtime-automation-workspace.md",
                "arckit/interaction/automation-workspace/interaction.md",
                "arckit/tech/arcorbit/realtime-synchronization-solution.md"
              ],
              "confidence": "high",
              "resume_condition": "Revisit when the reliable event contract, reconciliation cadence, source-of-truth boundary, or human Gate semantics change."
            },
            "gap_refs": [],
            "reason": "The event and cursor ownership model extends the Workshop source-of-truth boundary.",
            "evidence": [
              "Current operator input, 2026-08-22",
              "arckit/spec/agentic-software-development/runtime-automation-workspace.md",
              "arckit/interaction/automation-workspace/interaction.md",
              "arckit/tech/arcorbit/realtime-synchronization-solution.md"
            ]
          },
          {
            "area_ref": "external_integrations",
            "observed_revision": 4,
            "set_decision": {
              "status": "settled",
              "statement": "ArcOrbit integrates with Codex app-server/CLI and Workshop through explicit main-process adapters; trusted ledger entrypoints remain repository-owned. Workshop authentication preserves server-rotated credentials and the rolling seven-day inactivity contract. The Automation adapter remains executor-scoped, while the separate Platform Adapter reads organization, project, membership, full project task and Feedback V1 domains. Feedback V2 remains disabled until a separately trusted adapter proves capability; missing conditional update, member authorization and task-history service contracts are surfaced as weak consistency or unavailable actions rather than invented behavior. ArcOrbit 自身产品反馈独立使用 Feedback SDK WebView V2 的 API Key 直连契约；它不启用 Platform Feedback V2 管理 adapter，也不推断未确认的宿主 Session endpoint。 The Workshop integration includes a versioned project WebSocket plus authorized cursor replay API. Clients reconnect with cursor catch-up, deduplicate by event id, handle cursor expiry by full refresh, and fall back to bounded reconciliation.",
              "reason": "The adapter now has an explicit reliable realtime and recovery contract.",
              "evidence": [
                "User request received 2026-08-19",
                "arckit/spec/agentic-software-development/arcorbit-platform-capabilities.md",
                "arckit/interaction/product-feedback-center/interaction.md",
                "arckit/tech/arcorbit/product-feedback-integration.md",
                "Current operator input, 2026-08-22",
                "arckit/spec/agentic-software-development/runtime-automation-workspace.md",
                "arckit/interaction/automation-workspace/interaction.md",
                "arckit/tech/arcorbit/realtime-synchronization-solution.md"
              ],
              "confidence": "high",
              "resume_condition": "Revisit when the reliable event contract, reconciliation cadence, source-of-truth boundary, or human Gate semantics change."
            },
            "gap_refs": [],
            "reason": "The adapter now has an explicit reliable realtime and recovery contract.",
            "evidence": [
              "Current operator input, 2026-08-22",
              "arckit/spec/agentic-software-development/runtime-automation-workspace.md",
              "arckit/interaction/automation-workspace/interaction.md",
              "arckit/tech/arcorbit/realtime-synchronization-solution.md"
            ]
          },
          {
            "area_ref": "technical_foundation",
            "observed_revision": 23,
            "set_decision": {
              "status": "settled",
              "statement": "Arckit uses repository-owned Markdown/JSON state and Node.js ESM ledger CLIs; ArcOrbit is its Electron Desktop/Runtime host. The policy-neutral Runtime Kernel, persistent one-thread-per-todo model and trusted capabilities remain unchanged. Platform composition uses Desktop Store v10, a main-process Platform Coordinator, restricted Workshop Platform Adapter and typed preload IPC. ArcOrbit consumes Workshop through explicit service contracts and may evolve the backend when an accepted integration contract requires it: organization-scoped request context supplies known project organization identity, current-member is_external marks external participation, remote Workshop records remain authoritative, and Renderer receives neither credentials nor generic request access. Packaged ArcOrbit no longer reinterprets its Electron executable as Node: Electron main launches the Runtime with utilityProcess, typed parent-port controls preserve steer/interrupt semantics, trusted ledger orchestration calls manifest-resolved module APIs in process, standalone Codex remains an external executable, and packaging disables the RunAsNode/Node-options/CLI-inspect fuses while enforcing ASAR integrity. The current BrowserWindow Renderer loads from a file:// entry inside app.asar, so its File Protocol privilege fuse remains enabled and is verified independently from the disabled Node-mode fuses. 产品反馈由 Electron main process 管理受限子 BrowserWindow 与独立 SDK WebContents；主 file:// Renderer 不直接嵌入生产跨域 iframe，也不获得 SDK 凭据或通用远端访问。产品反馈 SDK 文档身份由固定 HTTPS origin、/sdk-v2 路径空间和 embed=web 共同确定；已配置文档在 submit/status 路由和未读刷新期间不执行 loadURL 或重复 configure，配置/身份变化、无效文档与显式 retry 才重新加载固定入口。Skill provisioning separates a global bundle/provider/Codex check from per-Product Workspace readiness. The main-process manager passes non-empty projectTargetDirs, project assessments and an ArcOrbit project-only availability override to the embedded provider; bundled skills, shared assets and the on-demand loader target only the normalized project root, while the ArcForge catalog and relation state remain control-plane data. Legacy managed user targets migrate transactionally with ownership evidence, explicit dispositions and rollback; Runtime preflight remains policy-neutral and only consumes the resulting per-project readiness. Workshop persists project events in PostgreSQL with domain mutations and uses LISTEN/NOTIFY only for post-commit cross-instance wakeup; each instance catches up by cursor and disconnects slow consumers. ArcOrbit adds a main-process Realtime Adapter and separates synchronization from execution arbitration.",
              "reason": "The complete solution requires coordinated Workshop backend and ArcOrbit changes.",
              "evidence": [
                "Current operator input, 2026-08-21",
                "arckit/tech/arcorbit/installer-supply-chain.md",
                "arckit/spec/arcorbit-distribution.md",
                "Current operator input, 2026-08-22",
                "arckit/spec/agentic-software-development/runtime-automation-workspace.md",
                "arckit/interaction/automation-workspace/interaction.md",
                "arckit/tech/arcorbit/realtime-synchronization-solution.md"
              ],
              "confidence": "high",
              "resume_condition": "Revisit when the reliable event contract, reconciliation cadence, source-of-truth boundary, or human Gate semantics change."
            },
            "gap_refs": [],
            "reason": "The complete solution requires coordinated Workshop backend and ArcOrbit changes.",
            "evidence": [
              "Current operator input, 2026-08-22",
              "arckit/spec/agentic-software-development/runtime-automation-workspace.md",
              "arckit/interaction/automation-workspace/interaction.md",
              "arckit/tech/arcorbit/realtime-synchronization-solution.md"
            ]
          },
          {
            "area_ref": "quality_and_validation",
            "observed_revision": 2,
            "set_decision": {
              "status": "settled",
              "statement": "Protocol changes require schema/script validation, cross-record audits, Runtime automated tests, projection checks, direct-Codex no-Case recovery evidence, stale-token checks, read/write/read ordering checks, and risk-proportionate real execution evidence. Reliable synchronization requires transaction/event atomicity, ordering/replay, cross-instance wakeup, authorization revocation, slow-consumer, reconnect/deduplication, cursor-expiry, targeted refresh, degraded fallback and awaiting_human regression tests plus a real-link smoke check when available.",
              "reason": "New failure modes require a cross-repository verification matrix.",
              "evidence": [
                "runtime/arckit-runtime/test/protocol-compatibility.test.mjs",
                "runtime/arckit-runtime/test/state-condition-case.test.mjs",
                "runtime/arckit-runtime/test/state-driven-runner.test.mjs",
                "runtime/arckit-runtime/test/parallel-case.test.mjs",
                "npm --prefix runtime/arckit-runtime run check: 113 tests, 112 passed, 1 environment-gated skip",
                "Current operator input, 2026-08-22",
                "arckit/spec/agentic-software-development/runtime-automation-workspace.md",
                "arckit/interaction/automation-workspace/interaction.md",
                "arckit/tech/arcorbit/realtime-synchronization-solution.md"
              ],
              "confidence": "high",
              "resume_condition": "Revisit when the reliable event contract, reconciliation cadence, source-of-truth boundary, or human Gate semantics change."
            },
            "gap_refs": [
              "GAP-agent-scenario-evaluation",
              "GAP-cross-record-audit"
            ],
            "reason": "New failure modes require a cross-repository verification matrix.",
            "evidence": [
              "Current operator input, 2026-08-22",
              "arckit/spec/agentic-software-development/runtime-automation-workspace.md",
              "arckit/interaction/automation-workspace/interaction.md",
              "arckit/tech/arcorbit/realtime-synchronization-solution.md"
            ]
          },
          {
            "area_ref": "observability_and_operation",
            "observed_revision": 5,
            "set_decision": {
              "status": "settled",
              "statement": "Runtime persists lifecycle, activity, messages and timing outside the target project, supports restart reconciliation and exposes opaque Run refs. It separately projects ledger candidate catalogs, Agent selection traces, accepted round closeouts and post-commit fresh-read receipts, and also presents ordinary todo state separately from acceptance-feedback queue counts, item status, current Run/Case, progress, evidence and blocking responsibility alongside one active execution. Automation exposes per-project realtime health and cursor progress, reports reconnecting/degraded/recovered transitions, uses 15-minute healthy reconciliation and 60-second disconnected fallback, and records that synchronization never releases a human gate.",
              "reason": "Reliable realtime operation needs visible recovery state without dispatch coupling.",
              "evidence": [
                "runtime/arckit-runtime/src/state-driven-runner.mjs",
                "runtime/arckit-runtime/src/projection/run-event-projector.mjs",
                "runtime/arckit-runtime/src/desktop/transcript-presentation.mjs",
                "arckit/interaction/automation-workspace/interaction.md",
                "arckit/tech/arckit-runtime/desktop-execution-solution.md",
                "Current operator input, 2026-08-22",
                "arckit/spec/agentic-software-development/runtime-automation-workspace.md",
                "arckit/tech/arcorbit/realtime-synchronization-solution.md"
              ],
              "confidence": "high",
              "resume_condition": "Revisit when the reliable event contract, reconciliation cadence, source-of-truth boundary, or human Gate semantics change."
            },
            "gap_refs": [
              "GAP-runtime-resilience-and-adapters"
            ],
            "reason": "Reliable realtime operation needs visible recovery state without dispatch coupling.",
            "evidence": [
              "Current operator input, 2026-08-22",
              "arckit/spec/agentic-software-development/runtime-automation-workspace.md",
              "arckit/interaction/automation-workspace/interaction.md",
              "arckit/tech/arcorbit/realtime-synchronization-solution.md"
            ]
          }
        ],
        "software_invariant_changes": [],
        "project_gap_changes": [],
        "selection_context_change": {
          "current_focus": "完整实现并验证 Workshop 持久项目事件、Website/ArcOrbit 游标恢复、目标刷新、降级对账与 awaiting_human Gate 隔离。"
        },
        "evidence": [
          "Current operator input, 2026-08-22",
          "arckit/spec/agentic-software-development/runtime-automation-workspace.md",
          "arckit/interaction/automation-workspace/interaction.md",
          "arckit/tech/arcorbit/realtime-synchronization-solution.md"
        ]
      },
      "invariant_assessment": {
        "project_revision": 154,
        "judgments": [
          {
            "invariant_ref": "product-expectations-remain-recoverable",
            "disposition": "upheld",
            "reason": "实时发现、低频对账和人工 Gate 已进入规格。",
            "fact_refs": [
              "FACT-004",
              "FACT-006"
            ],
            "evidence": [
              "arckit/spec/agentic-software-development/runtime-automation-workspace.md"
            ],
            "gap_refs": []
          },
          {
            "invariant_ref": "interaction-expectations-remain-recoverable",
            "disposition": "upheld",
            "reason": "连接、重连、降级和持续等待人工的状态可恢复。",
            "fact_refs": [
              "FACT-004",
              "FACT-006"
            ],
            "evidence": [
              "arckit/interaction/automation-workspace/interaction.md",
              "arckit/interaction/automation-workspace/default.html"
            ],
            "gap_refs": []
          },
          {
            "invariant_ref": "visual-language-remains-consistent",
            "disposition": "not_relevant",
            "reason": "仅复用既有灰度组件，无视觉语言变化。",
            "fact_refs": [],
            "evidence": [],
            "gap_refs": []
          },
          {
            "invariant_ref": "technical-decisions-remain-explainable",
            "disposition": "upheld",
            "reason": "事件存储、事务、跨实例、replay 和客户端分层均有技术依据。",
            "fact_refs": [
              "FACT-002",
              "FACT-003",
              "FACT-005",
              "FACT-006"
            ],
            "evidence": [
              "arckit/tech/arcorbit/realtime-synchronization-solution.md"
            ],
            "gap_refs": []
          },
          {
            "invariant_ref": "accepted-facts-are-realized",
            "disposition": "threatened",
            "reason": "契约已接受，三端实现待完成。",
            "fact_refs": [
              "FACT-005",
              "FACT-006"
            ],
            "evidence": [
              "arckit/tech/arcorbit/realtime-synchronization-solution.md"
            ],
            "gap_refs": [
              "GAP-reliable-realtime-implementation"
            ]
          },
          {
            "invariant_ref": "material-risks-have-credible-evidence",
            "disposition": "threatened",
            "reason": "一致性、重连、撤权和 Gate 仍需实现证据。",
            "fact_refs": [
              "FACT-003",
              "FACT-005",
              "FACT-006"
            ],
            "evidence": [
              "arckit/tech/arcorbit/realtime-synchronization-solution.md"
            ],
            "gap_refs": [
              "GAP-reliable-realtime-implementation"
            ]
          }
        ]
      },
      "evidence": [
        "arckit/spec/agentic-software-development/runtime-automation-workspace.md",
        "arckit/interaction/automation-workspace/interaction.md",
        "arckit/tech/arcorbit/realtime-synchronization-solution.md",
        "git diff --check",
        "automation-workspace HTML structural check"
      ],
      "runtime_result_ref": "",
      "occurred_at": "2026-08-21T17:13:48.333Z"
    },
    {
      "round": 2,
      "transition_schema_version": "arckit-case-transition/v8",
      "goal": "Realize the accepted reliable realtime contract across Workshop backend, Website, and ArcOrbit without weakening human intervention gates.",
      "outcome": "completed",
      "gap_selection": {
        "mode": "candidate",
        "basis": "The reliable realtime implementation gap is the only ready obligation scoped to this Case and directly realizes the operator-approved contract; unrelated Project gaps require separate Cases.",
        "snapshot_token": "fe8efd88860cebe68446324159c836ecc737b7aa74ce0735d2b25faf047c745a",
        "selected_ref": "case-gap:CASE-20260821-002:GAP-reliable-realtime-implementation",
        "comparison_summary": "Selected the ready cross-repository implementation gap because it blocks accepted realtime and human-gate facts. Four repository-level gaps remain deferred because they are not owned by this Case.",
        "fresh_discovery_summary": "Implementation and adversarial race review found necessary corrections within the selected gap, not a distinct unresolved obligation.",
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
            "reason": "Requires a separate Case and does not block this accepted integration contract."
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
            "reason": "Broader Runtime resilience work requires a separate Case; this round is bounded to Workshop realtime synchronization."
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
            "reason": "Real permission-bearing project validation is a separate Project obligation."
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
            "reason": "Cross-record protocol auditing is not part of the current product integration Case."
          },
          {
            "ref": "case-gap:CASE-20260821-002:GAP-reliable-realtime-implementation",
            "source": "persisted",
            "eligibility": "ready",
            "disposition": "selected",
            "priority_basis": {
              "blocking": "用户要求直接完成优化，当前实现尚未兑现契约。",
              "uncertainty": "契约已收敛，剩余不确定性集中在实现接线与兼容性。",
              "risk": "涉及事务一致性、跨实例通知、断线恢复、权限撤销和重复调度。",
              "user_impact": "决定任务变化能否及时、可靠地触达且不会越过人工确认。"
            },
            "reason": "This is the ready Case obligation and its implementation evidence is complete."
          }
        ]
      },
      "selected_gap": {
        "id": "GAP-reliable-realtime-implementation",
        "responsibility": "agent",
        "goal": "在 Workshop 后端、Workshop Website 与 ArcOrbit Desktop 中完整实现可靠项目事件流、游标补取、跨实例分发、目标刷新、降级对账、可观测状态和人工 Gate 隔离，并用自动化与真实链路证据验收。",
        "reason": "可靠实时同步契约已经稳定，但实际软件仍是无游标单进程 WebSocket、Website 无补取、ArcOrbit 每分钟全量发现；需要一次跨仓库实现闭环兑现接受的事实。",
        "derived_from": [
          "FACT-005",
          "FACT-006",
          "IMPACT-001",
          "IMPACT-002"
        ],
        "blocked_by": [],
        "priority_basis": {
          "blocking": "用户要求直接完成优化，当前实现尚未兑现契约。",
          "uncertainty": "契约已收敛，剩余不确定性集中在实现接线与兼容性。",
          "risk": "涉及事务一致性、跨实例通知、断线恢复、权限撤销和重复调度。",
          "user_impact": "决定任务变化能否及时、可靠地触达且不会越过人工确认。"
        },
        "evidence_required": [
          "Workshop 持久事件、事务写入、replay、LISTEN/NOTIFY、授权撤销与慢消费者测试",
          "Website cursor replay、去重、失效补偿和降级测试",
          "ArcOrbit Realtime Adapter、项目级刷新、启动/重连/低频对账、awaiting_human Gate 测试",
          "跨仓库静态检查、自动化测试与可用环境中的真实链路验收"
        ]
      },
      "planned_transition": {
        "goal": "Realize the accepted reliable realtime contract across Workshop backend, Website, and ArcOrbit without weakening human intervention gates.",
        "expected_state_change": "The implementation gap resolves, stale pre-implementation facts are superseded, implementation and verification facts are accepted, threatened impacts become upheld, and the Case advances to independent completion review."
      },
      "accepted_state_delta": {
        "resolved_gap": {
          "id": "GAP-reliable-realtime-implementation",
          "status": "resolved",
          "outcome": "Reliable project event discovery, replay, targeted refresh, degraded fallback, observability, and human-gate isolation are implemented across all three repositories.",
          "reason": "The durable event log, commit-ordered IDs, transaction-bound notifications, cross-instance Broker, replay API, reconnecting clients, ArcOrbit targeted refresh, low-frequency reconciliation, and explicit resume boundary are implemented and verified.",
          "evidence": [
            "/Users/Glare/Library/Developer/ModularProgram/hoewo/workshop-todo/realtime/store.go",
            "/Users/Glare/Library/Developer/ModularProgram/hoewo/workshop-todo/realtime/broker.go",
            "/Users/Glare/Library/Developer/ModularProgram/hoewo/workshop-todo/realtime_e2e_test.go",
            "/Users/Glare/Library/Developer/ModularProgram/hoewo/workshop-todo-website/frontend/src/hooks/useProjectWebSocket.ts",
            "runtime/arcorbit/src/workshop-realtime-adapter.mjs",
            "runtime/arcorbit/src/automation-coordinator.mjs",
            "runtime/arcorbit/test/workshop-realtime-adapter.test.mjs",
            "runtime/arcorbit/test/automation-coordinator.test.mjs"
          ]
        },
        "facts_added": [
          {
            "id": "FACT-007",
            "revision": 1,
            "status": "accepted",
            "statement": "Workshop now persists project mutation events transactionally in PostgreSQL, serializes event ID allocation through commit, wakes every service instance with LISTEN/NOTIFY, replays authorized project events with a 30-day retention contract, isolates slow clients, sends system.connected before queued domain events, and closes revoked project/member connections after their final event.",
            "basis": "Implemented backend code and PostgreSQL-backed integration evidence.",
            "evidence": [
              "/Users/Glare/Library/Developer/ModularProgram/hoewo/workshop-todo/models/project_event.go",
              "/Users/Glare/Library/Developer/ModularProgram/hoewo/workshop-todo/realtime/store.go",
              "/Users/Glare/Library/Developer/ModularProgram/hoewo/workshop-todo/realtime/broker.go",
              "/Users/Glare/Library/Developer/ModularProgram/hoewo/workshop-todo/handler/realtime.go",
              "/Users/Glare/Library/Developer/ModularProgram/hoewo/workshop-todo/realtime/store_integration_test.go",
              "/Users/Glare/Library/Developer/ModularProgram/hoewo/workshop-todo/realtime_e2e_test.go"
            ]
          },
          {
            "id": "FACT-008",
            "revision": 1,
            "status": "accepted",
            "statement": "Website and ArcOrbit now treat events as invalidations, replay and deduplicate project cursors, advance cursors only after successful REST refresh, proactively reconnect credentials, expose realtime health, refresh affected ArcOrbit projects in a 300ms window, reconcile globally every 15 minutes, use 60-second polling only while realtime is degraded, and preserve awaiting_human until explicit intervention.",
            "basis": "Implemented client/runtime code plus full automated, production-build, distribution, and real PostgreSQL validation.",
            "evidence": [
              "/Users/Glare/Library/Developer/ModularProgram/hoewo/workshop-todo-website/frontend/src/hooks/useProjectWebSocket.ts",
              "/Users/Glare/Library/Developer/ModularProgram/hoewo/workshop-todo-website/frontend/src/lib/realtime/projectEventStream.test.ts",
              "runtime/arcorbit/src/workshop-realtime-adapter.mjs",
              "runtime/arcorbit/desktop/main.mjs",
              "runtime/arcorbit/src/automation-coordinator.mjs",
              "runtime/arcorbit/test/workshop-realtime-adapter.test.mjs",
              "runtime/arcorbit/test/automation-coordinator.test.mjs",
              "Verification: Workshop go test ./... with temporary PostgreSQL, Website vitest plus Vite production build, ArcOrbit npm run check plus smoke:distribution, 2026-08-22"
            ]
          }
        ],
        "facts_superseded": [
          {
            "id": "FACT-001",
            "revision": 1,
            "reason": "ArcOrbit no longer uses healthy one-minute global task discovery; realtime project invalidation is primary with 15-minute reconciliation and a degraded-only 60-second fallback.",
            "evidence": [
              "runtime/arcorbit/desktop/main.mjs",
              "runtime/arcorbit/src/workshop-realtime-adapter.mjs"
            ]
          },
          {
            "id": "FACT-003",
            "revision": 1,
            "reason": "Workshop now has durable event IDs, PostgreSQL cross-instance delivery, and authorized cursor replay, so the pre-implementation limitation is no longer current.",
            "evidence": [
              "/Users/Glare/Library/Developer/ModularProgram/hoewo/workshop-todo/realtime/store.go",
              "/Users/Glare/Library/Developer/ModularProgram/hoewo/workshop-todo/realtime/broker.go",
              "/Users/Glare/Library/Developer/ModularProgram/hoewo/workshop-todo/handler/realtime.go"
            ]
          }
        ],
        "impacts_added": [],
        "impacts_updated": [
          {
            "id": "IMPACT-001",
            "fact_id": "FACT-005",
            "fact_revision": 1,
            "target": {
              "kind": "software_invariant",
              "ref": "accepted-facts-are-realized",
              "revision": null
            },
            "effect": "upheld",
            "reason": "The accepted durable event, replay, cross-instance, and transaction contract is now realized in production code.",
            "gap_ids": [],
            "evidence": [
              "/Users/Glare/Library/Developer/ModularProgram/hoewo/workshop-todo/realtime/store.go",
              "/Users/Glare/Library/Developer/ModularProgram/hoewo/workshop-todo/realtime/broker.go",
              "/Users/Glare/Library/Developer/ModularProgram/hoewo/workshop-todo/realtime/store_integration_test.go",
              "/Users/Glare/Library/Developer/ModularProgram/hoewo/workshop-todo/realtime_e2e_test.go"
            ]
          },
          {
            "id": "IMPACT-002",
            "fact_id": "FACT-006",
            "fact_revision": 1,
            "target": {
              "kind": "software_invariant",
              "ref": "material-risks-have-credible-evidence",
              "revision": null
            },
            "effect": "upheld",
            "reason": "Replay, cursor expiry, commit ordering, cross-instance delivery, slow/revoked clients, reconnect, logout races, degraded fallback, and awaiting_human preservation have direct regression evidence.",
            "gap_ids": [],
            "evidence": [
              "/Users/Glare/Library/Developer/ModularProgram/hoewo/workshop-todo/realtime/store_integration_test.go",
              "/Users/Glare/Library/Developer/ModularProgram/hoewo/workshop-todo/realtime/hub_test.go",
              "/Users/Glare/Library/Developer/ModularProgram/hoewo/workshop-todo-website/frontend/src/lib/realtime/projectEventStream.test.ts",
              "runtime/arcorbit/test/workshop-realtime-adapter.test.mjs",
              "runtime/arcorbit/test/automation-coordinator.test.mjs"
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
            "area_ref": "technical_foundation",
            "observed_revision": 24,
            "set_decision": {
              "status": "settled",
              "statement": "Arckit uses repository-owned Markdown/JSON state and Node.js ESM ledger CLIs; ArcOrbit is its Electron Desktop/Runtime host. The policy-neutral Runtime Kernel, persistent one-thread-per-todo model and trusted capabilities remain unchanged. Platform composition uses Desktop Store v11, a main-process Platform Coordinator, restricted Workshop Platform Adapter and typed preload IPC. ArcOrbit consumes Workshop through explicit service contracts and may evolve the backend when an accepted integration contract requires it: organization-scoped request context supplies known project organization identity, current-member is_external marks external participation, remote Workshop records remain authoritative, and Renderer receives neither credentials nor generic request access. Packaged ArcOrbit no longer reinterprets its Electron executable as Node: Electron main launches the Runtime with utilityProcess, typed parent-port controls preserve steer/interrupt semantics, trusted ledger orchestration calls manifest-resolved module APIs in process, standalone Codex remains an external executable, and packaging disables the RunAsNode/Node-options/CLI-inspect fuses while enforcing ASAR integrity. The current BrowserWindow Renderer loads from a file:// entry inside app.asar, so its File Protocol privilege fuse remains enabled and is verified independently from the disabled Node-mode fuses. 产品反馈由 Electron main process 管理受限子 BrowserWindow 与独立 SDK WebContents；主 file:// Renderer 不直接嵌入生产跨域 iframe，也不获得 SDK 凭据或通用远端访问。产品反馈 SDK 文档身份由固定 HTTPS origin、/sdk-v2 路径空间和 embed=web 共同确定；已配置文档在 submit/status 路由和未读刷新期间不执行 loadURL 或重复 configure，配置/身份变化、无效文档与显式 retry 才重新加载固定入口。Skill provisioning separates a global bundle/provider/Codex check from per-Product Workspace readiness. The main-process manager passes non-empty projectTargetDirs, project assessments and an ArcOrbit project-only availability override to the embedded provider; bundled skills, shared assets and the on-demand loader target only the normalized project root, while the ArcForge catalog and relation state remain control-plane data. Legacy managed user targets migrate transactionally with ownership evidence, explicit dispositions and rollback; Runtime preflight remains policy-neutral and only consumes the resulting per-project readiness. Workshop persists project events in PostgreSQL in the same transaction as domain mutations, serializes event IDs through commit, and uses LISTEN/NOTIFY only for post-commit cross-instance wakeup; each instance catches up by cursor and isolates slow consumers. Website and ArcOrbit recover by project cursor and invalidate REST-backed state. ArcOrbit adds a main-process Realtime Adapter, keeps synchronization separate from execution arbitration, and uses degraded-only fallback polling without allowing transport events to resume a human gate.",
              "reason": "The reliable realtime implementation is complete and Desktop Store v11 now persists per-project connection diagnostics and cursors.",
              "evidence": [
                "arckit/tech/arcorbit/realtime-synchronization-solution.md",
                "arckit/tech/arcorbit/platform-composition-solution.md",
                "runtime/arcorbit/src/desktop/desktop-store.mjs",
                "runtime/arcorbit/src/workshop-realtime-adapter.mjs",
                "/Users/Glare/Library/Developer/ModularProgram/hoewo/workshop-todo/realtime/store.go"
              ],
              "confidence": "high",
              "resume_condition": "Revisit when the event contract, retention, reconciliation cadence, source-of-truth boundary, or human Gate semantics change."
            },
            "gap_refs": [],
            "reason": "Update the technical foundation from the accepted contract to the implemented Store v11 and commit-ordered event architecture.",
            "evidence": [
              "arckit/tech/arcorbit/realtime-synchronization-solution.md",
              "runtime/arcorbit/src/desktop/desktop-store.mjs",
              "/Users/Glare/Library/Developer/ModularProgram/hoewo/workshop-todo/realtime/store.go"
            ]
          }
        ],
        "software_invariant_changes": [],
        "project_gap_changes": [],
        "selection_context_change": null,
        "evidence": [
          "arckit/tech/arcorbit/realtime-synchronization-solution.md",
          "runtime/arcorbit/src/desktop/desktop-store.mjs",
          "/Users/Glare/Library/Developer/ModularProgram/hoewo/workshop-todo/realtime/store.go"
        ]
      },
      "invariant_assessment": {
        "project_revision": 157,
        "judgments": [
          {
            "invariant_ref": "product-expectations-remain-recoverable",
            "disposition": "upheld",
            "reason": "The realtime discovery, degraded reconciliation, and human-gate outcomes are durable in product specification and implemented behavior.",
            "fact_refs": [
              "FACT-004",
              "FACT-006",
              "FACT-008"
            ],
            "evidence": [
              "arckit/spec/agentic-software-development/runtime-automation-workspace.md",
              "runtime/arcorbit/desktop/main.mjs"
            ],
            "gap_refs": []
          },
          {
            "invariant_ref": "interaction-expectations-remain-recoverable",
            "disposition": "upheld",
            "reason": "Connection, recovery, degraded state, reconciliation time, and persistent human waiting remain explicit and observable.",
            "fact_refs": [
              "FACT-006",
              "FACT-008"
            ],
            "evidence": [
              "arckit/interaction/automation-workspace/interaction.md",
              "runtime/arcorbit/desktop/renderer/renderer.js"
            ],
            "gap_refs": []
          },
          {
            "invariant_ref": "visual-language-remains-consistent",
            "disposition": "not_relevant",
            "reason": "The implementation reuses existing status and grayscale presentation patterns without changing the visual language.",
            "fact_refs": [],
            "evidence": [],
            "gap_refs": []
          },
          {
            "invariant_ref": "technical-decisions-remain-explainable",
            "disposition": "upheld",
            "reason": "Persistence, commit order, wakeup, replay, client cursor, refresh arbitration, and fallback boundaries are documented and directly reflected in code.",
            "fact_refs": [
              "FACT-005",
              "FACT-006",
              "FACT-007",
              "FACT-008"
            ],
            "evidence": [
              "arckit/tech/arcorbit/realtime-synchronization-solution.md",
              "/Users/Glare/Library/Developer/ModularProgram/hoewo/workshop-todo/realtime/store.go",
              "runtime/arcorbit/src/workshop-realtime-adapter.mjs"
            ],
            "gap_refs": []
          },
          {
            "invariant_ref": "accepted-facts-are-realized",
            "disposition": "upheld",
            "reason": "The accepted realtime contract and operator requirement are realized across backend, Website, and ArcOrbit.",
            "fact_refs": [
              "FACT-004",
              "FACT-005",
              "FACT-006",
              "FACT-007",
              "FACT-008"
            ],
            "evidence": [
              "/Users/Glare/Library/Developer/ModularProgram/hoewo/workshop-todo/realtime_e2e_test.go",
              "/Users/Glare/Library/Developer/ModularProgram/hoewo/workshop-todo-website/frontend/src/hooks/useProjectWebSocket.ts",
              "runtime/arcorbit/src/workshop-realtime-adapter.mjs"
            ],
            "gap_refs": []
          },
          {
            "invariant_ref": "material-risks-have-credible-evidence",
            "disposition": "upheld",
            "reason": "The material commit-order, cross-instance, retention, replay, slow-client, auth-reconnect, logout-race, degraded-fallback, and human-gate risks have automated or real PostgreSQL evidence.",
            "fact_refs": [
              "FACT-006",
              "FACT-007",
              "FACT-008"
            ],
            "evidence": [
              "/Users/Glare/Library/Developer/ModularProgram/hoewo/workshop-todo/realtime/store_integration_test.go",
              "/Users/Glare/Library/Developer/ModularProgram/hoewo/workshop-todo/realtime/hub_test.go",
              "/Users/Glare/Library/Developer/ModularProgram/hoewo/workshop-todo-website/frontend/src/lib/realtime/projectEventStream.test.ts",
              "runtime/arcorbit/test/automation-coordinator.test.mjs",
              "runtime/arcorbit/test/workshop-realtime-adapter.test.mjs"
            ],
            "gap_refs": []
          }
        ]
      },
      "evidence": [
        "arckit/tech/arcorbit/realtime-synchronization-solution.md",
        "/Users/Glare/Library/Developer/ModularProgram/hoewo/workshop-todo/realtime_e2e_test.go",
        "/Users/Glare/Library/Developer/ModularProgram/hoewo/workshop-todo/realtime/store_integration_test.go",
        "/Users/Glare/Library/Developer/ModularProgram/hoewo/workshop-todo-website/frontend/src/lib/realtime/projectEventStream.test.ts",
        "runtime/arcorbit/test/workshop-realtime-adapter.test.mjs",
        "runtime/arcorbit/test/automation-coordinator.test.mjs"
      ],
      "runtime_result_ref": "",
      "occurred_at": "2026-08-21T18:06:13.374Z"
    },
    {
      "round": 3,
      "transition_schema_version": "arckit-case-transition/v8",
      "goal": "Perform the independent completion review for content revision 2.",
      "outcome": "completed",
      "gap_selection": {
        "mode": "candidate",
        "basis": "All ordinary Case obligations are closed, so the deterministic completion-review candidate is the only ready Case-scoped obligation.",
        "snapshot_token": "18d7188b66f38b4df5380d57eb17de64db741e33aa6a9f878acbe7bf55cbffd3",
        "selected_ref": "case-gap:CASE-20260821-002:CASE-20260821-002:completion-review:1",
        "comparison_summary": "Selected the current content revision review; four Project gaps remain deferred to separate Cases.",
        "fresh_discovery_summary": "Adversarial review found one Website fail-closed cursor omission requiring an Agent repair gap.",
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
            "reason": "Separate Project Case required."
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
            "reason": "Separate Project Case required."
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
            "reason": "Separate Project Case required."
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
            "reason": "Separate Project Case required."
          },
          {
            "ref": "case-gap:CASE-20260821-002:CASE-20260821-002:completion-review:1",
            "source": "persisted",
            "eligibility": "ready",
            "disposition": "selected",
            "priority_basis": {
              "blocking": "high",
              "uncertainty": "low",
              "risk": "high",
              "user_impact": "high"
            },
            "reason": "Current implementation content requires the independent semantic completion gate."
          }
        ]
      },
      "selected_gap": {
        "id": "CASE-20260821-002:completion-review:1",
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
        "goal": "Perform the independent completion review for content revision 2.",
        "expected_state_change": "Record the fail-closed Website cursor omission as an Agent repair gap and keep the Case active."
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
          "reviewed_content_revision": 2,
          "dimensions": {
            "implementation_correctness": "findings",
            "problem_resolution": "clean",
            "verification_credibility": "clean",
            "regression_risk": "findings",
            "minimality": "clean"
          },
          "findings": [
            {
              "id": "WEBSITE-CURSOR-FAIL-CLOSED",
              "kind": "omission",
              "statement": "Make Website cursor acknowledgement fail closed: an unrecognized durable event must trigger full project invalidation instead of advancing silently, invalidation failures must reject, and component cleanup must not resolve an unfinished refresh as success; add regression evidence for ordered acknowledgement and unknown-event routing.",
              "responsibility": "agent",
              "artifact_refs": [
                "/Users/Glare/Library/Developer/ModularProgram/hoewo/workshop-todo-website/frontend/src/hooks/useProjectWebSocket.ts",
                "/Users/Glare/Library/Developer/ModularProgram/hoewo/workshop-todo-website/frontend/src/pages/ProjectDetailPage.tsx",
                "/Users/Glare/Library/Developer/ModularProgram/hoewo/workshop-todo-website/frontend/src/lib/realtime/projectEventStream.test.ts"
              ],
              "evidence": [
                "ProjectDetailPage handleSocketEvent returns success with no invalidation target for an unknown durable event.",
                "ProjectDetailPage cleanup resolves pending realtime waiters, allowing the hook to treat an unfinished refresh as acknowledged.",
                "React Query invalidation calls do not request throwOnError, so failed refetch acknowledgement is not fail-closed."
              ]
            }
          ],
          "evidence": [
            "/Users/Glare/Library/Developer/ModularProgram/hoewo/workshop-todo-website/frontend/src/hooks/useProjectWebSocket.ts",
            "/Users/Glare/Library/Developer/ModularProgram/hoewo/workshop-todo-website/frontend/src/pages/ProjectDetailPage.tsx",
            "/Users/Glare/Library/Developer/ModularProgram/hoewo/workshop-todo-website/frontend/src/lib/realtime/projectEventStream.test.ts",
            "/Users/Glare/Library/Developer/ModularProgram/hoewo/workshop-todo/realtime/store_integration_test.go",
            "runtime/arcorbit/test/automation-coordinator.test.mjs"
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
            "reason": "The intended realtime and human-gate outcome remains durable and the finding is bounded to a client acknowledgement edge.",
            "fact_refs": [
              "FACT-004",
              "FACT-006",
              "FACT-008"
            ],
            "evidence": [
              "arckit/spec/agentic-software-development/runtime-automation-workspace.md"
            ],
            "gap_refs": []
          },
          {
            "invariant_ref": "interaction-expectations-remain-recoverable",
            "disposition": "upheld",
            "reason": "Connection and recovery interaction expectations remain explicit despite the implementation omission.",
            "fact_refs": [
              "FACT-006",
              "FACT-008"
            ],
            "evidence": [
              "arckit/interaction/automation-workspace/interaction.md"
            ],
            "gap_refs": []
          },
          {
            "invariant_ref": "visual-language-remains-consistent",
            "disposition": "not_relevant",
            "reason": "The finding does not affect visual language.",
            "fact_refs": [],
            "evidence": [],
            "gap_refs": []
          },
          {
            "invariant_ref": "technical-decisions-remain-explainable",
            "disposition": "upheld",
            "reason": "The accepted fail-closed cursor rule is explainable and exposes a precise implementation omission.",
            "fact_refs": [
              "FACT-005",
              "FACT-006",
              "FACT-007",
              "FACT-008"
            ],
            "evidence": [
              "arckit/tech/arcorbit/realtime-synchronization-solution.md"
            ],
            "gap_refs": []
          },
          {
            "invariant_ref": "accepted-facts-are-realized",
            "disposition": "threatened",
            "reason": "Website cannot yet prove that every confirmed cursor follows a successful relevant invalidation.",
            "fact_refs": [
              "FACT-006",
              "FACT-008"
            ],
            "evidence": [],
            "gap_refs": [
              "CASE-20260821-002:review-finding:WEBSITE-CURSOR-FAIL-CLOSED"
            ]
          },
          {
            "invariant_ref": "material-risks-have-credible-evidence",
            "disposition": "threatened",
            "reason": "Unknown durable events and unmount cancellation lack fail-closed regression evidence.",
            "fact_refs": [
              "FACT-006",
              "FACT-008"
            ],
            "evidence": [],
            "gap_refs": [
              "CASE-20260821-002:review-finding:WEBSITE-CURSOR-FAIL-CLOSED"
            ]
          }
        ]
      },
      "evidence": [
        "/Users/Glare/Library/Developer/ModularProgram/hoewo/workshop-todo-website/frontend/src/hooks/useProjectWebSocket.ts",
        "/Users/Glare/Library/Developer/ModularProgram/hoewo/workshop-todo-website/frontend/src/pages/ProjectDetailPage.tsx",
        "/Users/Glare/Library/Developer/ModularProgram/hoewo/workshop-todo-website/frontend/src/lib/realtime/projectEventStream.test.ts"
      ],
      "runtime_result_ref": "",
      "occurred_at": "2026-08-21T18:09:13.462Z"
    },
    {
      "round": 4,
      "transition_schema_version": "arckit-case-transition/v8",
      "goal": "Make Website cursor confirmation fail closed and cover unknown durable events.",
      "outcome": "completed",
      "gap_selection": {
        "mode": "candidate",
        "basis": "The completion-review finding is the only ready Case-scoped obligation and directly threatens confirmed-cursor correctness.",
        "snapshot_token": "09f016d48acaab559713d4700cc66bb9b80dd93e96c78909d86bff32de0b2a09",
        "selected_ref": "case-gap:CASE-20260821-002:CASE-20260821-002:review-finding:WEBSITE-CURSOR-FAIL-CLOSED",
        "comparison_summary": "Selected the Agent-owned Website cursor repair; four Project gaps remain deferred to separate Cases.",
        "fresh_discovery_summary": "The bounded repair and regression tests found no additional ordinary gap.",
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
            "reason": "Separate Project Case required."
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
            "reason": "Separate Project Case required."
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
            "reason": "Separate Project Case required."
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
            "reason": "Separate Project Case required."
          },
          {
            "ref": "case-gap:CASE-20260821-002:CASE-20260821-002:review-finding:WEBSITE-CURSOR-FAIL-CLOSED",
            "source": "persisted",
            "eligibility": "ready",
            "disposition": "selected",
            "priority_basis": {
              "blocking": "high",
              "uncertainty": "",
              "risk": "high",
              "user_impact": ""
            },
            "reason": "This ready finding is now implemented and verified."
          }
        ]
      },
      "selected_gap": {
        "id": "CASE-20260821-002:review-finding:WEBSITE-CURSOR-FAIL-CLOSED",
        "responsibility": "agent",
        "goal": "Resolve review finding: Make Website cursor acknowledgement fail closed: an unrecognized durable event must trigger full project invalidation instead of advancing silently, invalidation failures must reject, and component cleanup must not resolve an unfinished refresh as success; add regression evidence for ordered acknowledgement and unknown-event routing.",
        "reason": "omission found by completion review",
        "derived_from": [
          "completion_review",
          "content_revision:2"
        ],
        "blocked_by": [],
        "priority_basis": {
          "blocking": "high",
          "uncertainty": "",
          "risk": "high",
          "user_impact": ""
        },
        "evidence_required": [
          "/Users/Glare/Library/Developer/ModularProgram/hoewo/workshop-todo-website/frontend/src/hooks/useProjectWebSocket.ts",
          "/Users/Glare/Library/Developer/ModularProgram/hoewo/workshop-todo-website/frontend/src/pages/ProjectDetailPage.tsx",
          "/Users/Glare/Library/Developer/ModularProgram/hoewo/workshop-todo-website/frontend/src/lib/realtime/projectEventStream.test.ts",
          "ProjectDetailPage handleSocketEvent returns success with no invalidation target for an unknown durable event.",
          "ProjectDetailPage cleanup resolves pending realtime waiters, allowing the hook to treat an unfinished refresh as acknowledged.",
          "React Query invalidation calls do not request throwOnError, so failed refetch acknowledgement is not fail-closed."
        ]
      },
      "planned_transition": {
        "goal": "Make Website cursor confirmation fail closed and cover unknown durable events.",
        "expected_state_change": "Resolve the review finding, replace the overbroad Website implementation fact with verified revision 2, and return the Case to completion review."
      },
      "accepted_state_delta": {
        "resolved_gap": {
          "id": "CASE-20260821-002:review-finding:WEBSITE-CURSOR-FAIL-CLOSED",
          "status": "resolved",
          "outcome": "Website now rejects failed or cancelled refresh acknowledgement and fully invalidates on unknown durable events or unsupported schemas.",
          "reason": "The page uses throwOnError, rejects cleanup waiters, routes unknown durable events to all project resources, and verifies ordered acknowledgement and routing behavior.",
          "evidence": [
            "/Users/Glare/Library/Developer/ModularProgram/hoewo/workshop-todo-website/frontend/src/pages/ProjectDetailPage.tsx",
            "/Users/Glare/Library/Developer/ModularProgram/hoewo/workshop-todo-website/frontend/src/lib/realtime/projectEventStream.ts",
            "/Users/Glare/Library/Developer/ModularProgram/hoewo/workshop-todo-website/frontend/src/lib/realtime/projectEventStream.test.ts",
            "Verification: Website vitest 4 tests and Vite production build passed, 2026-08-22"
          ]
        },
        "facts_added": [
          {
            "id": "FACT-008",
            "revision": 2,
            "status": "accepted",
            "statement": "Website and ArcOrbit treat events as invalidations, replay and deduplicate project cursors, advance cursors only after successful REST refresh, fail closed on unknown durable Website events, proactively reconnect credentials, expose realtime health, refresh affected ArcOrbit projects in a 300ms window, reconcile globally every 15 minutes, use 60-second polling only while realtime is degraded, and preserve awaiting_human until explicit intervention.",
            "basis": "Corrected client/runtime implementation plus ordered-acknowledgement, unknown-schema, build, full Runtime, and real PostgreSQL validation.",
            "evidence": [
              "/Users/Glare/Library/Developer/ModularProgram/hoewo/workshop-todo-website/frontend/src/hooks/useProjectWebSocket.ts",
              "/Users/Glare/Library/Developer/ModularProgram/hoewo/workshop-todo-website/frontend/src/pages/ProjectDetailPage.tsx",
              "/Users/Glare/Library/Developer/ModularProgram/hoewo/workshop-todo-website/frontend/src/lib/realtime/projectEventStream.test.ts",
              "runtime/arcorbit/src/workshop-realtime-adapter.mjs",
              "runtime/arcorbit/test/automation-coordinator.test.mjs"
            ]
          }
        ],
        "facts_superseded": [
          {
            "id": "FACT-008",
            "revision": 1,
            "reason": "Completion review found that revision 1 overstated fail-closed Website acknowledgement before unknown-event and cancellation repair.",
            "evidence": [
              "CASE-20260821-002:review-finding:WEBSITE-CURSOR-FAIL-CLOSED",
              "/Users/Glare/Library/Developer/ModularProgram/hoewo/workshop-todo-website/frontend/src/pages/ProjectDetailPage.tsx"
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
        "project_revision": 158,
        "judgments": [
          {
            "invariant_ref": "product-expectations-remain-recoverable",
            "disposition": "upheld",
            "reason": "Reliable realtime and human-gate outcomes remain durable and are now implemented fail closed on the Website edge.",
            "fact_refs": [
              "FACT-004",
              "FACT-006",
              "FACT-008"
            ],
            "evidence": [
              "arckit/spec/agentic-software-development/runtime-automation-workspace.md",
              "/Users/Glare/Library/Developer/ModularProgram/hoewo/workshop-todo-website/frontend/src/pages/ProjectDetailPage.tsx"
            ],
            "gap_refs": []
          },
          {
            "invariant_ref": "interaction-expectations-remain-recoverable",
            "disposition": "upheld",
            "reason": "Recovery and failure behavior remains explicit and a failed refresh now reconnects without confirming its cursor.",
            "fact_refs": [
              "FACT-006",
              "FACT-008"
            ],
            "evidence": [
              "arckit/interaction/automation-workspace/interaction.md",
              "/Users/Glare/Library/Developer/ModularProgram/hoewo/workshop-todo-website/frontend/src/hooks/useProjectWebSocket.ts"
            ],
            "gap_refs": []
          },
          {
            "invariant_ref": "visual-language-remains-consistent",
            "disposition": "not_relevant",
            "reason": "The repair has no visual-language effect.",
            "fact_refs": [],
            "evidence": [],
            "gap_refs": []
          },
          {
            "invariant_ref": "technical-decisions-remain-explainable",
            "disposition": "upheld",
            "reason": "Fail-closed acknowledgement and unknown schema fallback now match the documented cursor architecture.",
            "fact_refs": [
              "FACT-005",
              "FACT-006",
              "FACT-007",
              "FACT-008"
            ],
            "evidence": [
              "arckit/tech/arcorbit/realtime-synchronization-solution.md",
              "/Users/Glare/Library/Developer/ModularProgram/hoewo/workshop-todo-website/frontend/src/lib/realtime/projectEventStream.ts"
            ],
            "gap_refs": []
          },
          {
            "invariant_ref": "accepted-facts-are-realized",
            "disposition": "upheld",
            "reason": "The corrected client acknowledgement fact is realized in code.",
            "fact_refs": [
              "FACT-004",
              "FACT-005",
              "FACT-006",
              "FACT-007",
              "FACT-008"
            ],
            "evidence": [
              "/Users/Glare/Library/Developer/ModularProgram/hoewo/workshop-todo-website/frontend/src/pages/ProjectDetailPage.tsx",
              "runtime/arcorbit/src/workshop-realtime-adapter.mjs"
            ],
            "gap_refs": []
          },
          {
            "invariant_ref": "material-risks-have-credible-evidence",
            "disposition": "upheld",
            "reason": "Ordered acknowledgement and unknown durable-event fallback now have direct regression tests in addition to the existing cross-repository evidence.",
            "fact_refs": [
              "FACT-006",
              "FACT-007",
              "FACT-008"
            ],
            "evidence": [
              "/Users/Glare/Library/Developer/ModularProgram/hoewo/workshop-todo-website/frontend/src/lib/realtime/projectEventStream.test.ts",
              "/Users/Glare/Library/Developer/ModularProgram/hoewo/workshop-todo/realtime/store_integration_test.go",
              "runtime/arcorbit/test/automation-coordinator.test.mjs"
            ],
            "gap_refs": []
          }
        ]
      },
      "evidence": [
        "/Users/Glare/Library/Developer/ModularProgram/hoewo/workshop-todo-website/frontend/src/pages/ProjectDetailPage.tsx",
        "/Users/Glare/Library/Developer/ModularProgram/hoewo/workshop-todo-website/frontend/src/lib/realtime/projectEventStream.ts",
        "/Users/Glare/Library/Developer/ModularProgram/hoewo/workshop-todo-website/frontend/src/lib/realtime/projectEventStream.test.ts",
        "Verification: Website vitest 4 tests and Vite production build passed, 2026-08-22"
      ],
      "runtime_result_ref": "",
      "occurred_at": "2026-08-21T18:12:01.656Z"
    },
    {
      "round": 5,
      "transition_schema_version": "arckit-case-transition/v8",
      "goal": "Stabilize the real PostgreSQL end-to-end assertion without weakening coverage.",
      "outcome": "completed",
      "gap_selection": {
        "mode": "fresh",
        "basis": "Final verification exposed a bounded test-credibility issue more important than reviewing a test with race-dependent expectations.",
        "snapshot_token": "968653cc3a6fbffa39db05e13bdda5773c67aa84aa33308ec4719c0c82d88b67",
        "selected_ref": "fresh-gap:CASE-20260821-002:GAP-realtime-e2e-determinism",
        "comparison_summary": "Selected the fresh deterministic E2E verification correction before completion review; four Project gaps remain separate and the current review is deferred until the verified content revision is stable.",
        "fresh_discovery_summary": "The HTTP mutation must occur after the first system.connected assertion when the test specifically expects direct WebSocket delivery; a mutation concurrent with upgrade may be correctly covered by the connected replay watermark and should not be required to produce a later live frame.",
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
            "reason": "Separate Project Case required."
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
            "reason": "Separate Project Case required."
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
            "reason": "Separate Project Case required."
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
            "reason": "Separate Project Case required."
          },
          {
            "ref": "case-gap:CASE-20260821-002:CASE-20260821-002:completion-review:2",
            "source": "persisted",
            "eligibility": "ready",
            "disposition": "deferred",
            "priority_basis": {
              "blocking": "high",
              "uncertainty": "low",
              "risk": "high",
              "user_impact": "high"
            },
            "reason": "Review must bind the stable post-correction content revision."
          },
          {
            "ref": "fresh-gap:CASE-20260821-002:GAP-realtime-e2e-determinism",
            "source": "fresh",
            "eligibility": "ready",
            "disposition": "selected",
            "priority_basis": {
              "blocking": "Test credibility before final review",
              "risk": "medium"
            },
            "reason": "The deterministic ordering correction is implemented and the real PostgreSQL suite passes."
          }
        ]
      },
      "selected_gap": {
        "id": "GAP-realtime-e2e-determinism",
        "responsibility": "agent",
        "goal": "Make the Workshop HTTP-to-WebSocket-to-replay E2E test distinguish deterministic live delivery from the valid upgrade/replay race.",
        "reason": "A mutation concurrent with WebSocket upgrade may validly land in system.connected.latest_event_id and be recovered by replay rather than arrive as a subsequent live frame; the test should establish connected first before asserting live delivery.",
        "derived_from": [
          "FACT-007",
          "FACT-008",
          "final_verification"
        ],
        "blocked_by": [],
        "priority_basis": {
          "blocking": "Test credibility before final review",
          "risk": "medium"
        },
        "evidence_required": [
          "/Users/Glare/Library/Developer/ModularProgram/hoewo/workshop-todo/realtime_e2e_test.go",
          "Real PostgreSQL go test ./..."
        ]
      },
      "planned_transition": {
        "goal": "Stabilize the real PostgreSQL end-to-end assertion without weakening coverage.",
        "expected_state_change": "Resolve the fresh verification gap and invalidate the old completion-review candidate for content revision 4."
      },
      "accepted_state_delta": {
        "resolved_gap": {
          "id": "GAP-realtime-e2e-determinism",
          "status": "resolved",
          "outcome": "The test first asserts system.connected, then performs the mutation and verifies its live event and replay record.",
          "reason": "This preserves handshake, mutation, WebSocket delivery, and replay coverage while removing an incorrect expectation about mutations racing the upgrade boundary.",
          "evidence": [
            "/Users/Glare/Library/Developer/ModularProgram/hoewo/workshop-todo/realtime_e2e_test.go",
            "Verification: temporary PostgreSQL go test ./... passed, 2026-08-22"
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
        "project_revision": 159,
        "judgments": [
          {
            "invariant_ref": "product-expectations-remain-recoverable",
            "disposition": "upheld",
            "reason": "The verification correction does not alter product behavior and keeps the accepted outcome recoverable.",
            "fact_refs": [
              "FACT-004",
              "FACT-006",
              "FACT-008"
            ],
            "evidence": [
              "arckit/spec/agentic-software-development/runtime-automation-workspace.md"
            ],
            "gap_refs": []
          },
          {
            "invariant_ref": "interaction-expectations-remain-recoverable",
            "disposition": "upheld",
            "reason": "Handshake and replay interaction boundaries are more precisely reflected by the deterministic E2E sequence.",
            "fact_refs": [
              "FACT-006",
              "FACT-007",
              "FACT-008"
            ],
            "evidence": [
              "/Users/Glare/Library/Developer/ModularProgram/hoewo/workshop-todo/realtime_e2e_test.go"
            ],
            "gap_refs": []
          },
          {
            "invariant_ref": "visual-language-remains-consistent",
            "disposition": "not_relevant",
            "reason": "Test sequencing has no visual-language effect.",
            "fact_refs": [],
            "evidence": [],
            "gap_refs": []
          },
          {
            "invariant_ref": "technical-decisions-remain-explainable",
            "disposition": "upheld",
            "reason": "The test now matches the documented connected-watermark and replay boundary.",
            "fact_refs": [
              "FACT-005",
              "FACT-006",
              "FACT-007",
              "FACT-008"
            ],
            "evidence": [
              "arckit/tech/arcorbit/realtime-synchronization-solution.md",
              "/Users/Glare/Library/Developer/ModularProgram/hoewo/workshop-todo/realtime_e2e_test.go"
            ],
            "gap_refs": []
          },
          {
            "invariant_ref": "accepted-facts-are-realized",
            "disposition": "upheld",
            "reason": "No accepted implementation fact changed; the E2E evidence now makes its delivery assertion deterministic.",
            "fact_refs": [
              "FACT-004",
              "FACT-005",
              "FACT-006",
              "FACT-007",
              "FACT-008"
            ],
            "evidence": [
              "/Users/Glare/Library/Developer/ModularProgram/hoewo/workshop-todo/realtime_e2e_test.go"
            ],
            "gap_refs": []
          },
          {
            "invariant_ref": "material-risks-have-credible-evidence",
            "disposition": "upheld",
            "reason": "Real PostgreSQL verification covers transaction, cross-instance, handshake, live event, and replay paths without a race-dependent false failure.",
            "fact_refs": [
              "FACT-006",
              "FACT-007",
              "FACT-008"
            ],
            "evidence": [
              "/Users/Glare/Library/Developer/ModularProgram/hoewo/workshop-todo/realtime/store_integration_test.go",
              "/Users/Glare/Library/Developer/ModularProgram/hoewo/workshop-todo/realtime_e2e_test.go"
            ],
            "gap_refs": []
          }
        ]
      },
      "evidence": [
        "/Users/Glare/Library/Developer/ModularProgram/hoewo/workshop-todo/realtime_e2e_test.go",
        "Verification: temporary PostgreSQL go test ./... passed, 2026-08-22"
      ],
      "runtime_result_ref": "",
      "occurred_at": "2026-08-21T18:14:23.381Z"
    },
    {
      "round": 6,
      "transition_schema_version": "arckit-case-transition/v8",
      "goal": "Perform the independent completion review for content revision 4.",
      "outcome": "completed",
      "gap_selection": {
        "mode": "candidate",
        "basis": "All ordinary Case gaps and threatened impacts are closed; the current content revision has one ready completion-review candidate.",
        "snapshot_token": "1f2b0d3fc4daec3459f0694922cd973352b1b85c058f17c776ad67451ec80a20",
        "selected_ref": "case-gap:CASE-20260821-002:CASE-20260821-002:completion-review:2",
        "comparison_summary": "Selected the current revision completion review; four Project-level obligations remain out of scope and require separate Cases.",
        "fresh_discovery_summary": "Fresh diff, invariant, and verification review found no remaining implementation error, omission, excess, or human responsibility.",
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
            "reason": "Separate Project Case required."
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
            "reason": "Separate Project Case required."
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
            "reason": "Separate Project Case required."
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
            "reason": "Separate Project Case required."
          },
          {
            "ref": "case-gap:CASE-20260821-002:CASE-20260821-002:completion-review:2",
            "source": "persisted",
            "eligibility": "ready",
            "disposition": "selected",
            "priority_basis": {
              "blocking": "high",
              "uncertainty": "low",
              "risk": "high",
              "user_impact": "high"
            },
            "reason": "Current content revision 4 has complete implementation and verification evidence."
          }
        ]
      },
      "selected_gap": {
        "id": "CASE-20260821-002:completion-review:2",
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
        "goal": "Perform the independent completion review for content revision 4.",
        "expected_state_change": "Record a clean five-dimensional review and close the resolved Case."
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
          "reviewed_content_revision": 4,
          "dimensions": {
            "implementation_correctness": "clean",
            "problem_resolution": "clean",
            "verification_credibility": "clean",
            "regression_risk": "clean",
            "minimality": "clean"
          },
          "findings": [],
          "evidence": [
            "arckit/tech/arcorbit/realtime-synchronization-solution.md",
            "/Users/Glare/Library/Developer/ModularProgram/hoewo/workshop-todo/realtime/store.go",
            "/Users/Glare/Library/Developer/ModularProgram/hoewo/workshop-todo/realtime/broker.go",
            "/Users/Glare/Library/Developer/ModularProgram/hoewo/workshop-todo/realtime/store_integration_test.go",
            "/Users/Glare/Library/Developer/ModularProgram/hoewo/workshop-todo/realtime_e2e_test.go",
            "/Users/Glare/Library/Developer/ModularProgram/hoewo/workshop-todo-website/frontend/src/lib/realtime/projectEventStream.test.ts",
            "runtime/arcorbit/src/workshop-realtime-adapter.mjs",
            "runtime/arcorbit/test/workshop-realtime-adapter.test.mjs",
            "runtime/arcorbit/test/automation-coordinator.test.mjs",
            "Verification: Workshop real PostgreSQL go test ./..., Website 4 Vitest tests plus Vite production build, ArcOrbit 249 tests plus distribution smoke, 2026-08-22"
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
        "project_revision": 159,
        "judgments": [
          {
            "invariant_ref": "product-expectations-remain-recoverable",
            "disposition": "upheld",
            "reason": "The delivered realtime discovery, degraded reconciliation, observability, and persistent human gate match durable product expectations.",
            "fact_refs": [
              "FACT-004",
              "FACT-006",
              "FACT-008"
            ],
            "evidence": [
              "arckit/spec/agentic-software-development/runtime-automation-workspace.md",
              "runtime/arcorbit/desktop/main.mjs"
            ],
            "gap_refs": []
          },
          {
            "invariant_ref": "interaction-expectations-remain-recoverable",
            "disposition": "upheld",
            "reason": "Connecting, recovering, connected, degraded, reconciliation, and awaiting-human interaction behavior is durable and implemented.",
            "fact_refs": [
              "FACT-006",
              "FACT-007",
              "FACT-008"
            ],
            "evidence": [
              "arckit/interaction/automation-workspace/interaction.md",
              "runtime/arcorbit/desktop/renderer/renderer.js",
              "/Users/Glare/Library/Developer/ModularProgram/hoewo/workshop-todo-website/frontend/src/hooks/useProjectWebSocket.ts"
            ],
            "gap_refs": []
          },
          {
            "invariant_ref": "visual-language-remains-consistent",
            "disposition": "not_relevant",
            "reason": "The change reuses existing status presentation and does not establish a new visual language.",
            "fact_refs": [],
            "evidence": [],
            "gap_refs": []
          },
          {
            "invariant_ref": "technical-decisions-remain-explainable",
            "disposition": "upheld",
            "reason": "Transaction-bound events, commit ordering, cross-instance wakeup, replay, client cursors, targeted refresh, fallback, and gate isolation align with the settled technical foundation.",
            "fact_refs": [
              "FACT-005",
              "FACT-006",
              "FACT-007",
              "FACT-008"
            ],
            "evidence": [
              "arckit/tech/arcorbit/realtime-synchronization-solution.md",
              "/Users/Glare/Library/Developer/ModularProgram/hoewo/workshop-todo/realtime/store.go",
              "runtime/arcorbit/src/workshop-realtime-adapter.mjs"
            ],
            "gap_refs": []
          },
          {
            "invariant_ref": "accepted-facts-are-realized",
            "disposition": "upheld",
            "reason": "All accepted realtime and human-gate facts are represented by the current backend, Website, and ArcOrbit implementation.",
            "fact_refs": [
              "FACT-004",
              "FACT-005",
              "FACT-006",
              "FACT-007",
              "FACT-008"
            ],
            "evidence": [
              "/Users/Glare/Library/Developer/ModularProgram/hoewo/workshop-todo/realtime_e2e_test.go",
              "/Users/Glare/Library/Developer/ModularProgram/hoewo/workshop-todo-website/frontend/src/pages/ProjectDetailPage.tsx",
              "runtime/arcorbit/src/automation-coordinator.mjs"
            ],
            "gap_refs": []
          },
          {
            "invariant_ref": "material-risks-have-credible-evidence",
            "disposition": "upheld",
            "reason": "Commit order, rollback, cross-instance delivery, retention expiry, handshake order, slow/revoked clients, cursor acknowledgement, auth/logout races, degraded fallback, and awaiting-human preservation all have repeatable evidence.",
            "fact_refs": [
              "FACT-006",
              "FACT-007",
              "FACT-008"
            ],
            "evidence": [
              "/Users/Glare/Library/Developer/ModularProgram/hoewo/workshop-todo/realtime/store_integration_test.go",
              "/Users/Glare/Library/Developer/ModularProgram/hoewo/workshop-todo/realtime_e2e_test.go",
              "/Users/Glare/Library/Developer/ModularProgram/hoewo/workshop-todo-website/frontend/src/lib/realtime/projectEventStream.test.ts",
              "runtime/arcorbit/test/workshop-realtime-adapter.test.mjs",
              "runtime/arcorbit/test/automation-coordinator.test.mjs"
            ],
            "gap_refs": []
          }
        ]
      },
      "evidence": [
        "arckit/tech/arcorbit/realtime-synchronization-solution.md",
        "/Users/Glare/Library/Developer/ModularProgram/hoewo/workshop-todo/realtime_e2e_test.go",
        "/Users/Glare/Library/Developer/ModularProgram/hoewo/workshop-todo-website/frontend/src/lib/realtime/projectEventStream.test.ts",
        "runtime/arcorbit/test/workshop-realtime-adapter.test.mjs",
        "runtime/arcorbit/test/automation-coordinator.test.mjs"
      ],
      "runtime_result_ref": "",
      "occurred_at": "2026-08-21T18:15:41.174Z"
    }
  ],
  "case_resolution": {
    "status": "resolved",
    "stage": "resolved",
    "satisfied": [
      "GAP-reliable-realtime-contract",
      "GAP-reliable-realtime-implementation",
      "CASE-20260821-002:review-finding:WEBSITE-CURSOR-FAIL-CLOSED",
      "GAP-realtime-e2e-determinism"
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
    "updated_at": "2026-08-21T18:15:41.174Z"
  }
}
```

## Round Notes

- Case history is canonical in Structured Record.rounds; keep prose notes exceptional.
