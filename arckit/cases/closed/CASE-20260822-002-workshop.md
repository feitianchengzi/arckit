# 收口 Workshop 实时升级与部署安全

Case: CASE-20260822-002
Status: closed
Artifact Type: mixed
Selected Gap: none
Updated: 2026-08-22T10:11:06.636Z

## User Intent

修复已确认的服务端实时初始化、游标恢复、数据库迁移和前后端部署时序风险，使 Workshop 服务、Website 与 ArcOrbit 的新旧版本组合能够安全升级和回滚。

## Structured Record

```json
{
  "schema_version": "development-case-record/v5",
  "id": "CASE-20260822-002",
  "title": "收口 Workshop 实时升级与部署安全",
  "status": "closed",
  "artifact_type": "mixed",
  "created_at": "2026-08-22T09:32:27.714Z",
  "updated_at": "2026-08-22T10:11:06.636Z",
  "user_intent": "修复已确认的服务端实时初始化、游标恢复、数据库迁移和前后端部署时序风险，使 Workshop 服务、Website 与 ArcOrbit 的新旧版本组合能够安全升级和回滚。",
  "expected_outcome": "服务端在实时 Broker 与事件存储真正就绪后才接流量，失效或超前游标可靠回到当前态；Website 明确兼容旧协议；数据库迁移、健康检查、服务回滚和 OSS 静态资源切换具备可验证且不破坏已有能力的部署路径。",
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
      "statement": "操作者接受同时优化代码与部署脚本，以消除 Workshop 实时升级的服务端初始化、游标恢复、数据库迁移和发布时序风险。",
      "basis": "当前操作者输入是本轮最高权威增量。",
      "evidence": [
        "Current operator input, 2026-08-22"
      ]
    },
    {
      "id": "FACT-002",
      "revision": 1,
      "status": "accepted",
      "statement": "当前服务异步启动 Broker 后立即开放 HTTP；Broker 首次运行再读取 latest ID，因此 WebSocket 已连接但 Broker 尚未建立监听基线时提交的事件存在被基线跳过的窗口。",
      "basis": "启动和 Broker 代码路径能够完整推出该时序窗口。",
      "evidence": [
        "../../hoewo/workshop-todo/main.go:15",
        "../../hoewo/workshop-todo/realtime/broker.go:30"
      ]
    },
    {
      "id": "FACT-003",
      "revision": 1,
      "status": "accepted",
      "statement": "project_events 是新服务所有受影响业务写事务的必要依赖，但生产迁移仅由可关闭的 AutoMigrate 隐式承担；超前游标也不会被 replay 接口判定失效。",
      "basis": "数据库初始化、事件写入和 replay 边界的代码审计以及真实 PostgreSQL 14 验证。",
      "evidence": [
        "../../hoewo/workshop-todo/database/db.go:114",
        "../../hoewo/workshop-todo/realtime/store.go:32",
        "../../hoewo/workshop-todo/realtime/store.go:104",
        "Verification: PostgreSQL 14 UTF-8 migration and realtime integration tests, 2026-08-22"
      ]
    },
    {
      "id": "FACT-004",
      "revision": 1,
      "status": "accepted",
      "statement": "Workshop 服务端已将 project_events 作为启动必需 schema 关闭式验证，提供独立幂等 migrate 命令，并在 LISTEN 与初始全局事件基线建立成功后才开放 HTTP；replay 同时拒绝低于保留水位和高于全局最新 ID 的游标。",
      "basis": "Implementation inspection plus full real PostgreSQL and built-binary startup verification demonstrate the complete server lifecycle rather than only mocked behavior.",
      "evidence": [
        "../../hoewo/workshop-todo/database/db.go",
        "../../hoewo/workshop-todo/main.go",
        "../../hoewo/workshop-todo/realtime/broker.go",
        "../../hoewo/workshop-todo/realtime/store.go",
        "../../hoewo/workshop-todo/database/migration_integration_test.go",
        "../../hoewo/workshop-todo/realtime/store_integration_test.go",
        "../../hoewo/workshop-todo/realtime_e2e_test.go",
        "arckit/tech/arcorbit/realtime-synchronization-solution.md"
      ]
    },
    {
      "id": "FACT-005",
      "revision": 1,
      "status": "accepted",
      "statement": "Website 与 ArcOrbit 现在都在协议分类后才访问现代 cursor：旧服务无 ID 模式不读写 cursor 并在每次连接刷新当前态；现代本地 cursor 超过服务端连接基线时全量刷新并下调 checkpoint；未知或歧义握手关闭式失败。",
      "basis": "The shared recovery rules are directly realized in both clients and covered by focused and full automated verification.",
      "evidence": [
        "../../hoewo/workshop-todo-website/frontend/src/hooks/useProjectWebSocket.ts",
        "../../hoewo/workshop-todo-website/frontend/src/lib/realtime/projectEventStream.ts",
        "../../hoewo/workshop-todo-website/frontend/src/lib/realtime/projectEventStream.test.ts",
        "runtime/arcorbit/src/workshop-realtime-adapter.mjs",
        "runtime/arcorbit/test/workshop-realtime-adapter.test.mjs",
        "arckit/tech/arcorbit/realtime-synchronization-solution.md"
      ]
    },
    {
      "id": "FACT-006",
      "revision": 1,
      "status": "accepted",
      "statement": "Workshop 生产发布现在先对候选镜像执行 additive 幂等迁移，再切换容器并以 HTTP readiness 判定成功，失败自动恢复旧 image ID；Website OSS 发布保留旧资源、严格最后替换 index.html，并且构建日志不再输出环境变量值。",
      "basis": "The deployed script structure and automated success/failure simulations establish the transition ordering and rollback behavior, while OSS tests establish publication atomicity.",
      "evidence": [
        "../../hoewo/workshop-todo/deploy/Dockerfile",
        "../../hoewo/workshop-todo/deploy/prod/deploy.sh",
        "../../hoewo/workshop-todo/deploy/prod/remote-deploy.sh",
        "../../hoewo/workshop-todo/deploy/prod/remote-deploy_test.sh",
        "../../hoewo/workshop-todo-website/frontend/script/build-vite.sh",
        "../../hoewo/workshop-todo-website/frontend/script/deploy-oss.py",
        "../../hoewo/workshop-todo-website/frontend/script/test_deploy_oss.py",
        "arckit/tech/arcorbit/realtime-synchronization-solution.md"
      ]
    },
    {
      "id": "FACT-007",
      "revision": 1,
      "status": "accepted",
      "statement": "Workshop 的公开 health endpoint 已绑定当前 Broker readiness：监听就绪时返回 200，监听断开并进入重连时返回 503，因此容器健康状态持续反映实时链路而不只反映进程存活。",
      "basis": "Production binding and a deterministic handler test directly establish both readiness states.",
      "evidence": [
        "../../hoewo/workshop-todo/main.go",
        "../../hoewo/workshop-todo/handler/health.go",
        "../../hoewo/workshop-todo/handler/health_test.go",
        "../../hoewo/workshop-todo/realtime/broker.go"
      ]
    }
  ],
  "state_impacts": [
    {
      "id": "IMPACT-SERVER-REALTIME-FOUNDATION",
      "fact_id": "FACT-004",
      "fact_revision": 1,
      "target": {
        "kind": "software_decision",
        "ref": "technical_foundation",
        "revision": 26
      },
      "effect": "upheld",
      "reason": "The implementation now realizes the existing durable PostgreSQL event, LISTEN/NOTIFY, cursor recovery and REST-source-of-truth architecture with an explicit startup and schema-readiness boundary.",
      "gap_ids": [],
      "evidence": [
        "arckit/tech/arcorbit/realtime-synchronization-solution.md",
        "../../hoewo/workshop-todo/database/db.go",
        "../../hoewo/workshop-todo/realtime/broker.go",
        "../../hoewo/workshop-todo/realtime/store.go"
      ]
    },
    {
      "id": "IMPACT-SERVER-REALTIME-VALIDATION",
      "fact_id": "FACT-004",
      "fact_revision": 1,
      "target": {
        "kind": "software_decision",
        "ref": "quality_and_validation",
        "revision": 4
      },
      "effect": "upheld",
      "reason": "Real PostgreSQL migration, cross-instance replay, future-cursor and process startup evidence controls the material server risks identified by the Case.",
      "gap_ids": [],
      "evidence": [
        "../../hoewo/workshop-todo/database/migration_integration_test.go",
        "../../hoewo/workshop-todo/realtime/store_integration_test.go",
        "../../hoewo/workshop-todo/realtime_e2e_test.go"
      ]
    },
    {
      "id": "IMPACT-CLIENT-REALTIME-CAPABILITY",
      "fact_id": "FACT-005",
      "fact_revision": 1,
      "target": {
        "kind": "software_decision",
        "ref": "product_capabilities",
        "revision": 17
      },
      "effect": "upheld",
      "reason": "Both clients now realize the accepted modern replay and legacy no-cursor current-state compatibility capability at the remaining cursor boundary.",
      "gap_ids": [],
      "evidence": [
        "../../hoewo/workshop-todo-website/frontend/src/hooks/useProjectWebSocket.ts",
        "runtime/arcorbit/src/workshop-realtime-adapter.mjs",
        "arckit/tech/arcorbit/realtime-synchronization-solution.md"
      ]
    },
    {
      "id": "IMPACT-CLIENT-REALTIME-FOUNDATION",
      "fact_id": "FACT-005",
      "fact_revision": 1,
      "target": {
        "kind": "software_decision",
        "ref": "technical_foundation",
        "revision": 26
      },
      "effect": "upheld",
      "reason": "Explicit mode negotiation now fails closed for ambiguity and retains checkpoint ownership only in resumable mode.",
      "gap_ids": [],
      "evidence": [
        "../../hoewo/workshop-todo-website/frontend/src/lib/realtime/projectEventStream.ts",
        "runtime/arcorbit/src/workshop-realtime-adapter.mjs",
        "arckit/tech/arcorbit/realtime-synchronization-solution.md"
      ]
    },
    {
      "id": "IMPACT-DEPLOYMENT-TECHNICAL-FOUNDATION",
      "fact_id": "FACT-006",
      "fact_revision": 1,
      "target": {
        "kind": "software_decision",
        "ref": "technical_foundation",
        "revision": 26
      },
      "effect": "upheld",
      "reason": "The service and clients can now be rolled out in the order required by the accepted realtime and source-of-truth architecture without creating an avoidable partial-upgrade window.",
      "gap_ids": [],
      "evidence": [
        "arckit/tech/arcorbit/realtime-synchronization-solution.md",
        "../../hoewo/workshop-todo/deploy/prod/remote-deploy.sh",
        "../../hoewo/workshop-todo-website/frontend/script/deploy-oss.py"
      ]
    },
    {
      "id": "IMPACT-DEPLOYMENT-VALIDATION",
      "fact_id": "FACT-006",
      "fact_revision": 1,
      "target": {
        "kind": "software_decision",
        "ref": "quality_and_validation",
        "revision": 4
      },
      "effect": "upheld",
      "reason": "Material deployment failure paths are repeatably simulated and the affected server, Website and ArcOrbit suites remain green.",
      "gap_ids": [],
      "evidence": [
        "../../hoewo/workshop-todo/deploy/prod/remote-deploy_test.sh",
        "../../hoewo/workshop-todo-website/frontend/script/test_deploy_oss.py",
        "Verification: remote deployment success/migration-failure/health-rollback tests passed; OSS publication 3/3 tests passed; server Go suite, Website Vitest and production build passed, 2026-08-22"
      ]
    },
    {
      "id": "IMPACT-HEALTH-READINESS-CONTINUITY",
      "fact_id": "FACT-007",
      "fact_revision": 1,
      "target": {
        "kind": "software_decision",
        "ref": "technical_foundation",
        "revision": 26
      },
      "effect": "upheld",
      "reason": "The deployment readiness signal now continuously represents the accepted Broker lifecycle instead of only the initial process start.",
      "gap_ids": [],
      "evidence": [
        "../../hoewo/workshop-todo/main.go",
        "../../hoewo/workshop-todo/handler/health.go",
        "../../hoewo/workshop-todo/realtime/broker.go",
        "arckit/tech/arcorbit/realtime-synchronization-solution.md"
      ]
    }
  ],
  "gaps": [
    {
      "id": "GAP-server-realtime-readiness",
      "status": "resolved",
      "goal": "实现并验证服务端实时 Broker readiness、超前游标失效和明确的事件表迁移契约，使服务只在可靠事件链路可用时接收业务流量。",
      "reason": "这是新旧客户端兼容和部署脚本健康判定的共同前置条件；当前启动竞态和隐式迁移会让写入或实时刷新在部署窗口失效。",
      "derived_from": [
        "FACT-001",
        "FACT-002",
        "FACT-003"
      ],
      "blocked_by": [],
      "priority_basis": {
        "blocking": "服务端契约不稳定时，客户端和部署脚本无法可靠判断升级成功。",
        "uncertainty": "根因和目标边界已由代码及 PostgreSQL 验证收敛。",
        "risk": "可能丢失在线通知，或在事件表缺失时回滚所有业务写入。",
        "user_impact": "直接影响任务、项目和标签写入以及实时刷新可靠性。"
      },
      "responsibility": "agent",
      "evidence_required": [
        "服务端在 Broker LISTEN 与基线建立成功前不开放 HTTP",
        "超前或过期游标返回稳定的 EVENT_CURSOR_EXPIRED 并可恢复当前态",
        "事件表迁移契约幂等、可显式执行和验证，且不修改既有业务数据",
        "真实 PostgreSQL、跨实例和 HTTP/WebSocket 回归覆盖启动与恢复边界"
      ],
      "resolution": {
        "id": "GAP-server-realtime-readiness",
        "status": "resolved",
        "outcome": "Workshop now validates the required event schema, supports an explicit idempotent migration command, establishes LISTEN and its initial event baseline before opening HTTP, catches up after listener reconnect, and rejects both retained-low-watermark and future cursors without misclassifying valid cross-project global positions.",
        "reason": "The implementation is covered by unit, HTTP/WebSocket, cross-instance and real PostgreSQL migration tests, plus a built-binary startup smoke that exercises migration-disabled fail-closed and post-migration startup paths.",
        "evidence": [
          "../../hoewo/workshop-todo/database/db.go",
          "../../hoewo/workshop-todo/database/migration_integration_test.go",
          "../../hoewo/workshop-todo/main.go",
          "../../hoewo/workshop-todo/models/project_event.go",
          "../../hoewo/workshop-todo/realtime/broker.go",
          "../../hoewo/workshop-todo/realtime/store.go",
          "../../hoewo/workshop-todo/realtime/store_integration_test.go",
          "../../hoewo/workshop-todo/realtime_e2e_test.go",
          "arckit/tech/arcorbit/realtime-synchronization-solution.md",
          "Verification: full Go suite passed against PostgreSQL 14 UTF-8 and built-binary migration/readiness smoke passed, 2026-08-22"
        ],
        "occurred_at": "2026-08-22T09:46:52.987Z"
      }
    },
    {
      "id": "GAP-client-realtime-recovery",
      "status": "resolved",
      "goal": "使 Website 和 ArcOrbit 在旧服务无 ID 握手、现代服务未来游标和协议异常边界上确定性回到当前态，且旧模式不读写游标。",
      "reason": "服务端契约已稳定，但 Website 当前仍会在旧握手读取本地游标，并且现代客户端在本地游标高于握手 latest 时可能跳过 replay 而保留未来 checkpoint。",
      "derived_from": [
        "FACT-001",
        "FACT-004"
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
        "Website 明确区分 resumable、legacy 和不支持的显式协议，legacy 全程不读写 cursor",
        "Website 与 ArcOrbit 对 cursor 高于握手 latest 执行全量当前态恢复并重置 checkpoint",
        "新旧服务组合和断线重连的自动化回归测试通过"
      ],
      "resolution": {
        "id": "GAP-client-realtime-recovery",
        "status": "resolved",
        "outcome": "Website now classifies legacy before cursor access, never reads or writes a cursor for that connection mode, performs a current-state invalidation on connect, resets future modern cursors to the handshake baseline, and closes unsupported or ambiguous handshakes; ArcOrbit implements the same future-cursor and ambiguity boundaries while preserving its existing no-ID behavior.",
        "reason": "Pure recovery planning tests prove legacy short-circuiting and future-cursor classification, ArcOrbit adapter tests exercise persistent state effects, Website production build succeeds, and the full ArcOrbit check passes.",
        "evidence": [
          "../../hoewo/workshop-todo-website/frontend/src/hooks/useProjectWebSocket.ts",
          "../../hoewo/workshop-todo-website/frontend/src/lib/realtime/projectEventStream.ts",
          "../../hoewo/workshop-todo-website/frontend/src/lib/realtime/projectEventStream.test.ts",
          "runtime/arcorbit/src/workshop-realtime-adapter.mjs",
          "runtime/arcorbit/test/workshop-realtime-adapter.test.mjs",
          "arckit/tech/arcorbit/realtime-synchronization-solution.md",
          "Verification: Website Vitest 7/7 passed and Vite production build succeeded; ArcOrbit check 252 tests, 250 passed, 2 environment-gated skips, 0 failed, 2026-08-22"
        ],
        "occurred_at": "2026-08-22T09:53:07.557Z"
      }
    },
    {
      "id": "GAP-deployment-atomicity",
      "status": "resolved",
      "goal": "实现并验证数据库迁移先行、服务健康切换与可回滚部署，以及 Website 静态资源 index-last 原子发布和安全日志输出。",
      "reason": "代码兼容不等于部署安全；当前服务脚本缺少显式迁移与健康回滚，Website 清空 OSS 后重传会制造不可用窗口并可能破坏旧 index 引用。",
      "derived_from": [
        "FACT-001",
        "FACT-004"
      ],
      "blocked_by": [],
      "priority_basis": {
        "blocking": "medium",
        "uncertainty": "low",
        "risk": "high",
        "user_impact": "high"
      },
      "responsibility": "agent",
      "evidence_required": [
        "服务部署在停止旧实例前执行幂等迁移，并以 ready HTTP 健康检查决定成功或镜像回滚",
        "Website 先发布不可变资源、最后切换 index.html，失败时旧版本仍可访问",
        "构建和部署日志不输出环境变量值，相关脚本具备静态或自动化验证"
      ],
      "resolution": {
        "id": "GAP-deployment-atomicity",
        "status": "resolved",
        "outcome": "Production service deployment now saves the running image, loads the candidate, executes its idempotent migration before stopping the old container, starts the candidate and requires container readiness, restoring the old image on post-cutover failure. Website OSS deployment no longer clears the prefix, uploads immutable assets and other files before index.html, preserves old hashed assets and hides environment values in build logs.",
        "reason": "Shell regression tests prove success, pre-cutover migration failure and post-cutover health rollback order; Python tests prove index-last and no-entry-switch on asset failure; Compose renders and all affected application suites pass. Docker image construction is not claimed because the local daemon is unavailable.",
        "evidence": [
          "../../hoewo/workshop-todo/deploy/Dockerfile",
          "../../hoewo/workshop-todo/deploy/prod/docker-compose.prod.yml",
          "../../hoewo/workshop-todo/deploy/prod/deploy.sh",
          "../../hoewo/workshop-todo/deploy/prod/remote-deploy.sh",
          "../../hoewo/workshop-todo/deploy/prod/remote-deploy_test.sh",
          "../../hoewo/workshop-todo/deploy/prod/test/fake-docker.sh",
          "../../hoewo/workshop-todo-website/frontend/script/build-vite.sh",
          "../../hoewo/workshop-todo-website/frontend/script/deploy-oss.py",
          "../../hoewo/workshop-todo-website/frontend/script/test_deploy_oss.py",
          "arckit/tech/arcorbit/realtime-synchronization-solution.md",
          "Verification: remote deployment success/migration-failure/health-rollback tests passed; OSS publication 3/3 tests passed; server Go suite, Website Vitest and production build passed, 2026-08-22"
        ],
        "occurred_at": "2026-08-22T10:02:48.049Z"
      }
    },
    {
      "id": "GAP-health-readiness-continuity",
      "responsibility": "agent",
      "goal": "Make the public service health response continuously reflect Broker readiness so deployment health cannot accept a realtime-degraded instance.",
      "reason": "Startup ordering guarantees initial readiness, but the Broker explicitly becomes unready on listener loss while the existing health handler remained an unconditional 200.",
      "derived_from": [
        "FACT-004",
        "FACT-006"
      ],
      "blocked_by": [],
      "priority_basis": {
        "blocking": "high",
        "uncertainty": "low",
        "risk": "high",
        "user_impact": "high"
      },
      "evidence_required": [
        "Production main binds Broker.Ready into the health handler before HTTP starts",
        "Health returns 200 while ready and 503 after readiness becomes false",
        "Server and deployment regression suites remain green"
      ],
      "status": "resolved",
      "resolution": {
        "id": "GAP-health-readiness-continuity",
        "status": "resolved",
        "outcome": "Production main now binds Broker.Ready into HealthCheck before router startup; the endpoint returns 200 while the listener is ready and 503 whenever Broker readiness becomes false.",
        "reason": "A focused handler regression toggles the bound readiness function and the complete Go plus deployment suites pass after the change.",
        "evidence": [
          "../../hoewo/workshop-todo/main.go",
          "../../hoewo/workshop-todo/handler/health.go",
          "../../hoewo/workshop-todo/handler/health_test.go",
          "../../hoewo/workshop-todo/realtime/broker.go",
          "Verification: Go suite and remote deployment ordering/rollback tests passed after continuous health binding, 2026-08-22"
        ],
        "occurred_at": "2026-08-22T10:06:00.772Z"
      }
    }
  ],
  "content_revision": 4,
  "completion_review": {
    "status": "clean",
    "policy": {
      "initial_max_cycles": 10,
      "source": "using-arckit default autonomous completion review policy",
      "snapshotted_at": "2026-08-22T09:32:27.714Z"
    },
    "additional_cycles_authorized": 0,
    "cycle_count": 1,
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
          "Review: server startup, migration, replay bounds, reconnect readiness, and public health projection were inspected as one lifecycle; no stale success path remains.",
          "Review: Website and ArcOrbit classify legacy, modern, and ambiguous handshakes before cursor access and preserve explicit human-gate semantics.",
          "Verification: PostgreSQL 14 UTF-8 full Go integration suite and built-binary migration/startup smoke passed, 2026-08-22.",
          "Verification: final go vet, full Go suite, deterministic remote deployment success/migration-failure/rollback tests, Website realtime tests, OSS publication tests, production Vite build, ArcOrbit full check, ledger validation/audit, and diff checks passed, 2026-08-22.",
          "arckit/tech/arcorbit/realtime-synchronization-solution.md"
        ],
        "occurred_at": "2026-08-22T10:11:06.636Z"
      }
    ],
    "evidence": [
      "Review: server startup, migration, replay bounds, reconnect readiness, and public health projection were inspected as one lifecycle; no stale success path remains.",
      "Review: Website and ArcOrbit classify legacy, modern, and ambiguous handshakes before cursor access and preserve explicit human-gate semantics.",
      "Verification: PostgreSQL 14 UTF-8 full Go integration suite and built-binary migration/startup smoke passed, 2026-08-22.",
      "Verification: final go vet, full Go suite, deterministic remote deployment success/migration-failure/rollback tests, Website realtime tests, OSS publication tests, production Vite build, ArcOrbit full check, ledger validation/audit, and diff checks passed, 2026-08-22.",
      "arckit/tech/arcorbit/realtime-synchronization-solution.md"
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
      "goal": "Close the server-side startup, migration and cursor-boundary risks with production code, durable technical facts and proportionate PostgreSQL evidence.",
      "outcome": "completed",
      "gap_selection": {
        "mode": "candidate",
        "basis": "The server readiness gap is the shared prerequisite for reliable client recovery and deployment health decisions; the unrelated Project gaps require separate Cases.",
        "snapshot_token": "f089eadd0c2160f43ac79c76294fe2c89479f5e271d23d8ce7d500dda58e3d66",
        "selected_ref": "case-gap:CASE-20260822-002:GAP-server-realtime-readiness",
        "comparison_summary": "Selected the ready server contract gap over the four case-required Project gaps because it blocks both remaining upgrade-safety concerns and carries direct write-loss risk.",
        "fresh_discovery_summary": "Implementation and real PostgreSQL verification established two downstream obligations: explicit client recovery at protocol boundaries and deployment ordering that applies migration before traffic cutover.",
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
            "reason": "Generic isolated Agent scenario evaluation does not resolve the current Workshop upgrade path."
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
            "reason": "The generic Runtime resilience backlog is independent of Workshop server readiness and needs its own Case."
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
            "reason": "Real permission-bearing security validation is outside this bounded compatibility Case."
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
            "reason": "The general cross-record audit remains separate from the Workshop service implementation."
          },
          {
            "ref": "case-gap:CASE-20260822-002:GAP-server-realtime-readiness",
            "source": "persisted",
            "eligibility": "ready",
            "disposition": "selected",
            "priority_basis": {
              "blocking": "high",
              "uncertainty": "low",
              "risk": "high",
              "user_impact": "high"
            },
            "reason": "It removes the server startup race and migration ambiguity that otherwise make client and deployment validation unreliable."
          }
        ]
      },
      "selected_gap": {
        "id": "GAP-server-realtime-readiness",
        "responsibility": "agent",
        "goal": "实现并验证服务端实时 Broker readiness、超前游标失效和明确的事件表迁移契约，使服务只在可靠事件链路可用时接收业务流量。",
        "reason": "这是新旧客户端兼容和部署脚本健康判定的共同前置条件；当前启动竞态和隐式迁移会让写入或实时刷新在部署窗口失效。",
        "derived_from": [
          "FACT-001",
          "FACT-002",
          "FACT-003"
        ],
        "blocked_by": [],
        "priority_basis": {
          "blocking": "服务端契约不稳定时，客户端和部署脚本无法可靠判断升级成功。",
          "uncertainty": "根因和目标边界已由代码及 PostgreSQL 验证收敛。",
          "risk": "可能丢失在线通知，或在事件表缺失时回滚所有业务写入。",
          "user_impact": "直接影响任务、项目和标签写入以及实时刷新可靠性。"
        },
        "evidence_required": [
          "服务端在 Broker LISTEN 与基线建立成功前不开放 HTTP",
          "超前或过期游标返回稳定的 EVENT_CURSOR_EXPIRED 并可恢复当前态",
          "事件表迁移契约幂等、可显式执行和验证，且不修改既有业务数据",
          "真实 PostgreSQL、跨实例和 HTTP/WebSocket 回归覆盖启动与恢复边界"
        ]
      },
      "planned_transition": {
        "goal": "Close the server-side startup, migration and cursor-boundary risks with production code, durable technical facts and proportionate PostgreSQL evidence.",
        "expected_state_change": "The server Gap resolves; client recovery and atomic deployment become explicit ready Case gaps grounded in the now-stable server contract."
      },
      "accepted_state_delta": {
        "resolved_gap": {
          "id": "GAP-server-realtime-readiness",
          "status": "resolved",
          "outcome": "Workshop now validates the required event schema, supports an explicit idempotent migration command, establishes LISTEN and its initial event baseline before opening HTTP, catches up after listener reconnect, and rejects both retained-low-watermark and future cursors without misclassifying valid cross-project global positions.",
          "reason": "The implementation is covered by unit, HTTP/WebSocket, cross-instance and real PostgreSQL migration tests, plus a built-binary startup smoke that exercises migration-disabled fail-closed and post-migration startup paths.",
          "evidence": [
            "../../hoewo/workshop-todo/database/db.go",
            "../../hoewo/workshop-todo/database/migration_integration_test.go",
            "../../hoewo/workshop-todo/main.go",
            "../../hoewo/workshop-todo/models/project_event.go",
            "../../hoewo/workshop-todo/realtime/broker.go",
            "../../hoewo/workshop-todo/realtime/store.go",
            "../../hoewo/workshop-todo/realtime/store_integration_test.go",
            "../../hoewo/workshop-todo/realtime_e2e_test.go",
            "arckit/tech/arcorbit/realtime-synchronization-solution.md",
            "Verification: full Go suite passed against PostgreSQL 14 UTF-8 and built-binary migration/readiness smoke passed, 2026-08-22"
          ]
        },
        "facts_added": [
          {
            "id": "FACT-004",
            "revision": 1,
            "status": "accepted",
            "statement": "Workshop 服务端已将 project_events 作为启动必需 schema 关闭式验证，提供独立幂等 migrate 命令，并在 LISTEN 与初始全局事件基线建立成功后才开放 HTTP；replay 同时拒绝低于保留水位和高于全局最新 ID 的游标。",
            "basis": "Implementation inspection plus full real PostgreSQL and built-binary startup verification demonstrate the complete server lifecycle rather than only mocked behavior.",
            "evidence": [
              "../../hoewo/workshop-todo/database/db.go",
              "../../hoewo/workshop-todo/main.go",
              "../../hoewo/workshop-todo/realtime/broker.go",
              "../../hoewo/workshop-todo/realtime/store.go",
              "../../hoewo/workshop-todo/database/migration_integration_test.go",
              "../../hoewo/workshop-todo/realtime/store_integration_test.go",
              "../../hoewo/workshop-todo/realtime_e2e_test.go",
              "arckit/tech/arcorbit/realtime-synchronization-solution.md"
            ]
          }
        ],
        "facts_superseded": [],
        "impacts_added": [
          {
            "id": "IMPACT-SERVER-REALTIME-FOUNDATION",
            "fact_id": "FACT-004",
            "fact_revision": 1,
            "target": {
              "kind": "software_decision",
              "ref": "technical_foundation",
              "revision": 26
            },
            "effect": "upheld",
            "reason": "The implementation now realizes the existing durable PostgreSQL event, LISTEN/NOTIFY, cursor recovery and REST-source-of-truth architecture with an explicit startup and schema-readiness boundary.",
            "gap_ids": [],
            "evidence": [
              "arckit/tech/arcorbit/realtime-synchronization-solution.md",
              "../../hoewo/workshop-todo/database/db.go",
              "../../hoewo/workshop-todo/realtime/broker.go",
              "../../hoewo/workshop-todo/realtime/store.go"
            ]
          },
          {
            "id": "IMPACT-SERVER-REALTIME-VALIDATION",
            "fact_id": "FACT-004",
            "fact_revision": 1,
            "target": {
              "kind": "software_decision",
              "ref": "quality_and_validation",
              "revision": 4
            },
            "effect": "upheld",
            "reason": "Real PostgreSQL migration, cross-instance replay, future-cursor and process startup evidence controls the material server risks identified by the Case.",
            "gap_ids": [],
            "evidence": [
              "../../hoewo/workshop-todo/database/migration_integration_test.go",
              "../../hoewo/workshop-todo/realtime/store_integration_test.go",
              "../../hoewo/workshop-todo/realtime_e2e_test.go"
            ]
          }
        ],
        "impacts_updated": [],
        "gaps_added": [
          {
            "id": "GAP-client-realtime-recovery",
            "status": "open",
            "goal": "使 Website 和 ArcOrbit 在旧服务无 ID 握手、现代服务未来游标和协议异常边界上确定性回到当前态，且旧模式不读写游标。",
            "reason": "服务端契约已稳定，但 Website 当前仍会在旧握手读取本地游标，并且现代客户端在本地游标高于握手 latest 时可能跳过 replay 而保留未来 checkpoint。",
            "derived_from": [
              "FACT-001",
              "FACT-004"
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
              "Website 明确区分 resumable、legacy 和不支持的显式协议，legacy 全程不读写 cursor",
              "Website 与 ArcOrbit 对 cursor 高于握手 latest 执行全量当前态恢复并重置 checkpoint",
              "新旧服务组合和断线重连的自动化回归测试通过"
            ],
            "resolution": null
          },
          {
            "id": "GAP-deployment-atomicity",
            "status": "open",
            "goal": "实现并验证数据库迁移先行、服务健康切换与可回滚部署，以及 Website 静态资源 index-last 原子发布和安全日志输出。",
            "reason": "代码兼容不等于部署安全；当前服务脚本缺少显式迁移与健康回滚，Website 清空 OSS 后重传会制造不可用窗口并可能破坏旧 index 引用。",
            "derived_from": [
              "FACT-001",
              "FACT-004"
            ],
            "blocked_by": [],
            "priority_basis": {
              "blocking": "medium",
              "uncertainty": "low",
              "risk": "high",
              "user_impact": "high"
            },
            "responsibility": "agent",
            "evidence_required": [
              "服务部署在停止旧实例前执行幂等迁移，并以 ready HTTP 健康检查决定成功或镜像回滚",
              "Website 先发布不可变资源、最后切换 index.html，失败时旧版本仍可访问",
              "构建和部署日志不输出环境变量值，相关脚本具备静态或自动化验证"
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
        "software_definition_changes": [],
        "software_invariant_changes": [],
        "project_gap_changes": [],
        "selection_context_change": null,
        "evidence": []
      },
      "invariant_assessment": {
        "project_revision": 164,
        "judgments": [
          {
            "invariant_ref": "product-expectations-remain-recoverable",
            "disposition": "not_relevant",
            "reason": "This round realizes an already accepted realtime capability and does not add or revise a product outcome.",
            "fact_refs": [],
            "evidence": [],
            "gap_refs": []
          },
          {
            "invariant_ref": "interaction-expectations-remain-recoverable",
            "disposition": "not_relevant",
            "reason": "The server readiness implementation does not alter a user interaction journey; client recovery behavior remains the next Gap.",
            "fact_refs": [],
            "evidence": [],
            "gap_refs": []
          },
          {
            "invariant_ref": "visual-language-remains-consistent",
            "disposition": "not_relevant",
            "reason": "No visual-language or presentation rule is affected by the server implementation.",
            "fact_refs": [],
            "evidence": [],
            "gap_refs": []
          },
          {
            "invariant_ref": "technical-decisions-remain-explainable",
            "disposition": "upheld",
            "reason": "The migration, readiness ordering, global cursor bounds and reconnect catch-up contracts are durably documented and traceable to code.",
            "fact_refs": [
              "FACT-004"
            ],
            "evidence": [
              "arckit/tech/arcorbit/realtime-synchronization-solution.md",
              "../../hoewo/workshop-todo/database/db.go",
              "../../hoewo/workshop-todo/realtime/broker.go",
              "../../hoewo/workshop-todo/realtime/store.go"
            ],
            "gap_refs": []
          },
          {
            "invariant_ref": "accepted-facts-are-realized",
            "disposition": "upheld",
            "reason": "The source implements every server-side claim accepted in FACT-004, including failure behavior and readiness ordering.",
            "fact_refs": [
              "FACT-004"
            ],
            "evidence": [
              "../../hoewo/workshop-todo/main.go",
              "../../hoewo/workshop-todo/database/db.go",
              "../../hoewo/workshop-todo/realtime/broker.go",
              "../../hoewo/workshop-todo/realtime/store.go"
            ],
            "gap_refs": []
          },
          {
            "invariant_ref": "material-risks-have-credible-evidence",
            "disposition": "upheld",
            "reason": "Repeatable real PostgreSQL tests and a built-process smoke cover schema preservation, index shape, cursor bounds, cross-instance delivery and startup gating.",
            "fact_refs": [
              "FACT-004"
            ],
            "evidence": [
              "../../hoewo/workshop-todo/database/migration_integration_test.go",
              "../../hoewo/workshop-todo/realtime/store_integration_test.go",
              "../../hoewo/workshop-todo/realtime_e2e_test.go",
              "Verification: full Go suite passed against PostgreSQL 14 UTF-8 and built-binary migration/readiness smoke passed, 2026-08-22"
            ],
            "gap_refs": []
          }
        ]
      },
      "evidence": [
        "../../hoewo/workshop-todo/database/db.go",
        "../../hoewo/workshop-todo/database/migration_integration_test.go",
        "../../hoewo/workshop-todo/main.go",
        "../../hoewo/workshop-todo/models/project_event.go",
        "../../hoewo/workshop-todo/realtime/broker.go",
        "../../hoewo/workshop-todo/realtime/store.go",
        "../../hoewo/workshop-todo/realtime/store_integration_test.go",
        "../../hoewo/workshop-todo/realtime_e2e_test.go",
        "arckit/tech/arcorbit/realtime-synchronization-solution.md",
        "Verification: full Go suite passed against PostgreSQL 14 UTF-8 and built-binary migration/readiness smoke passed, 2026-08-22"
      ],
      "runtime_result_ref": "",
      "occurred_at": "2026-08-22T09:46:52.987Z"
    },
    {
      "round": 2,
      "transition_schema_version": "arckit-case-transition/v8",
      "goal": "Implement the explicit old-handshake, modern future-cursor and ambiguous-protocol recovery contract in both Website and ArcOrbit and validate it through full client suites.",
      "outcome": "completed",
      "gap_selection": {
        "mode": "candidate",
        "basis": "Client recovery is the higher-blocking ready Case gap because deploying the stable server without deterministic old-handshake and future-cursor handling could leave existing users stale; deployment atomicity remains ready afterward.",
        "snapshot_token": "69561935fb7d7bbb7b5ad8ab51a3063a042ebd0cd61a4e5795a08f9518c9eeaa",
        "selected_ref": "case-gap:CASE-20260822-002:GAP-client-realtime-recovery",
        "comparison_summary": "Selected client recovery over deployment atomicity because it completes the cross-version data correctness contract before packaging that contract into rollout automation.",
        "fresh_discovery_summary": "No higher-priority fresh gap emerged; repository baseline TypeScript and ESLint failures are unrelated and remain outside this Case, while focused tests and production builds validate the changed path.",
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
            "reason": "Generic Agent evaluation needs a separate Case and does not affect client protocol recovery."
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
            "reason": "The general Runtime backlog is separate from this specific Workshop adapter correction."
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
            "reason": "Permission-bearing security validation remains out of scope for this client compatibility Case."
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
            "reason": "The generic ledger cross-record audit does not block the client recovery code."
          },
          {
            "ref": "case-gap:CASE-20260822-002:GAP-client-realtime-recovery",
            "source": "persisted",
            "eligibility": "ready",
            "disposition": "selected",
            "priority_basis": {
              "blocking": "high",
              "uncertainty": "medium",
              "risk": "high",
              "user_impact": "high"
            },
            "reason": "It is the remaining data-correctness prerequisite for cross-version rollout."
          },
          {
            "ref": "case-gap:CASE-20260822-002:GAP-deployment-atomicity",
            "source": "persisted",
            "eligibility": "ready",
            "disposition": "deferred",
            "priority_basis": {
              "blocking": "medium",
              "uncertainty": "low",
              "risk": "high",
              "user_impact": "high"
            },
            "reason": "Deployment hardening remains ready and becomes the sole implementation Gap after client compatibility is accepted."
          }
        ]
      },
      "selected_gap": {
        "id": "GAP-client-realtime-recovery",
        "responsibility": "agent",
        "goal": "使 Website 和 ArcOrbit 在旧服务无 ID 握手、现代服务未来游标和协议异常边界上确定性回到当前态，且旧模式不读写游标。",
        "reason": "服务端契约已稳定，但 Website 当前仍会在旧握手读取本地游标，并且现代客户端在本地游标高于握手 latest 时可能跳过 replay 而保留未来 checkpoint。",
        "derived_from": [
          "FACT-001",
          "FACT-004"
        ],
        "blocked_by": [],
        "priority_basis": {
          "blocking": "high",
          "uncertainty": "medium",
          "risk": "high",
          "user_impact": "high"
        },
        "evidence_required": [
          "Website 明确区分 resumable、legacy 和不支持的显式协议，legacy 全程不读写 cursor",
          "Website 与 ArcOrbit 对 cursor 高于握手 latest 执行全量当前态恢复并重置 checkpoint",
          "新旧服务组合和断线重连的自动化回归测试通过"
        ]
      },
      "planned_transition": {
        "goal": "Implement the explicit old-handshake, modern future-cursor and ambiguous-protocol recovery contract in both Website and ArcOrbit and validate it through full client suites.",
        "expected_state_change": "The client recovery Gap resolves without weakening old-service compatibility, leaving deployment atomicity as the sole implementation obligation."
      },
      "accepted_state_delta": {
        "resolved_gap": {
          "id": "GAP-client-realtime-recovery",
          "status": "resolved",
          "outcome": "Website now classifies legacy before cursor access, never reads or writes a cursor for that connection mode, performs a current-state invalidation on connect, resets future modern cursors to the handshake baseline, and closes unsupported or ambiguous handshakes; ArcOrbit implements the same future-cursor and ambiguity boundaries while preserving its existing no-ID behavior.",
          "reason": "Pure recovery planning tests prove legacy short-circuiting and future-cursor classification, ArcOrbit adapter tests exercise persistent state effects, Website production build succeeds, and the full ArcOrbit check passes.",
          "evidence": [
            "../../hoewo/workshop-todo-website/frontend/src/hooks/useProjectWebSocket.ts",
            "../../hoewo/workshop-todo-website/frontend/src/lib/realtime/projectEventStream.ts",
            "../../hoewo/workshop-todo-website/frontend/src/lib/realtime/projectEventStream.test.ts",
            "runtime/arcorbit/src/workshop-realtime-adapter.mjs",
            "runtime/arcorbit/test/workshop-realtime-adapter.test.mjs",
            "arckit/tech/arcorbit/realtime-synchronization-solution.md",
            "Verification: Website Vitest 7/7 passed and Vite production build succeeded; ArcOrbit check 252 tests, 250 passed, 2 environment-gated skips, 0 failed, 2026-08-22"
          ]
        },
        "facts_added": [
          {
            "id": "FACT-005",
            "revision": 1,
            "status": "accepted",
            "statement": "Website 与 ArcOrbit 现在都在协议分类后才访问现代 cursor：旧服务无 ID 模式不读写 cursor 并在每次连接刷新当前态；现代本地 cursor 超过服务端连接基线时全量刷新并下调 checkpoint；未知或歧义握手关闭式失败。",
            "basis": "The shared recovery rules are directly realized in both clients and covered by focused and full automated verification.",
            "evidence": [
              "../../hoewo/workshop-todo-website/frontend/src/hooks/useProjectWebSocket.ts",
              "../../hoewo/workshop-todo-website/frontend/src/lib/realtime/projectEventStream.ts",
              "../../hoewo/workshop-todo-website/frontend/src/lib/realtime/projectEventStream.test.ts",
              "runtime/arcorbit/src/workshop-realtime-adapter.mjs",
              "runtime/arcorbit/test/workshop-realtime-adapter.test.mjs",
              "arckit/tech/arcorbit/realtime-synchronization-solution.md"
            ]
          }
        ],
        "facts_superseded": [],
        "impacts_added": [
          {
            "id": "IMPACT-CLIENT-REALTIME-CAPABILITY",
            "fact_id": "FACT-005",
            "fact_revision": 1,
            "target": {
              "kind": "software_decision",
              "ref": "product_capabilities",
              "revision": 17
            },
            "effect": "upheld",
            "reason": "Both clients now realize the accepted modern replay and legacy no-cursor current-state compatibility capability at the remaining cursor boundary.",
            "gap_ids": [],
            "evidence": [
              "../../hoewo/workshop-todo-website/frontend/src/hooks/useProjectWebSocket.ts",
              "runtime/arcorbit/src/workshop-realtime-adapter.mjs",
              "arckit/tech/arcorbit/realtime-synchronization-solution.md"
            ]
          },
          {
            "id": "IMPACT-CLIENT-REALTIME-FOUNDATION",
            "fact_id": "FACT-005",
            "fact_revision": 1,
            "target": {
              "kind": "software_decision",
              "ref": "technical_foundation",
              "revision": 26
            },
            "effect": "upheld",
            "reason": "Explicit mode negotiation now fails closed for ambiguity and retains checkpoint ownership only in resumable mode.",
            "gap_ids": [],
            "evidence": [
              "../../hoewo/workshop-todo-website/frontend/src/lib/realtime/projectEventStream.ts",
              "runtime/arcorbit/src/workshop-realtime-adapter.mjs",
              "arckit/tech/arcorbit/realtime-synchronization-solution.md"
            ]
          }
        ],
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
        "project_revision": 164,
        "judgments": [
          {
            "invariant_ref": "product-expectations-remain-recoverable",
            "disposition": "upheld",
            "reason": "The existing product decision already defines modern replay, legacy no-cursor refresh and no minute polling, and both clients now realize the unambiguous recovery boundary.",
            "fact_refs": [
              "FACT-005"
            ],
            "evidence": [
              "arckit/tech/arcorbit/realtime-synchronization-solution.md",
              "../../hoewo/workshop-todo-website/frontend/src/hooks/useProjectWebSocket.ts",
              "runtime/arcorbit/src/workshop-realtime-adapter.mjs"
            ],
            "gap_refs": []
          },
          {
            "invariant_ref": "interaction-expectations-remain-recoverable",
            "disposition": "upheld",
            "reason": "Reconnect remains a current-state recovery in legacy mode and a cursor recovery in modern mode, with no new user action or hidden approval semantics.",
            "fact_refs": [
              "FACT-005"
            ],
            "evidence": [
              "arckit/tech/arcorbit/realtime-synchronization-solution.md",
              "../../hoewo/workshop-todo-website/frontend/src/hooks/useProjectWebSocket.ts",
              "runtime/arcorbit/src/workshop-realtime-adapter.mjs"
            ],
            "gap_refs": []
          },
          {
            "invariant_ref": "visual-language-remains-consistent",
            "disposition": "not_relevant",
            "reason": "No visual rule or presentation surface changes in this recovery implementation.",
            "fact_refs": [],
            "evidence": [],
            "gap_refs": []
          },
          {
            "invariant_ref": "technical-decisions-remain-explainable",
            "disposition": "upheld",
            "reason": "Mode classification, cursor ownership, future-cursor reset and fail-closed ambiguity handling are documented and shared across both clients.",
            "fact_refs": [
              "FACT-005"
            ],
            "evidence": [
              "arckit/tech/arcorbit/realtime-synchronization-solution.md",
              "../../hoewo/workshop-todo-website/frontend/src/lib/realtime/projectEventStream.ts",
              "runtime/arcorbit/src/workshop-realtime-adapter.mjs"
            ],
            "gap_refs": []
          },
          {
            "invariant_ref": "accepted-facts-are-realized",
            "disposition": "upheld",
            "reason": "Production client code implements every compatibility and checkpoint claim in FACT-005.",
            "fact_refs": [
              "FACT-005"
            ],
            "evidence": [
              "../../hoewo/workshop-todo-website/frontend/src/hooks/useProjectWebSocket.ts",
              "runtime/arcorbit/src/workshop-realtime-adapter.mjs"
            ],
            "gap_refs": []
          },
          {
            "invariant_ref": "material-risks-have-credible-evidence",
            "disposition": "upheld",
            "reason": "Focused recovery tests, the full Website test/build path and the complete ArcOrbit suite cover the changed compatibility behavior without relying on timing sleeps.",
            "fact_refs": [
              "FACT-005"
            ],
            "evidence": [
              "../../hoewo/workshop-todo-website/frontend/src/lib/realtime/projectEventStream.test.ts",
              "runtime/arcorbit/test/workshop-realtime-adapter.test.mjs",
              "Verification: Website Vitest 7/7 passed and Vite production build succeeded; ArcOrbit check 252 tests, 250 passed, 2 environment-gated skips, 0 failed, 2026-08-22"
            ],
            "gap_refs": []
          }
        ]
      },
      "evidence": [
        "../../hoewo/workshop-todo-website/frontend/src/hooks/useProjectWebSocket.ts",
        "../../hoewo/workshop-todo-website/frontend/src/lib/realtime/projectEventStream.ts",
        "../../hoewo/workshop-todo-website/frontend/src/lib/realtime/projectEventStream.test.ts",
        "runtime/arcorbit/src/workshop-realtime-adapter.mjs",
        "runtime/arcorbit/test/workshop-realtime-adapter.test.mjs",
        "arckit/tech/arcorbit/realtime-synchronization-solution.md",
        "Verification: Website Vitest 7/7 passed and Vite production build succeeded; ArcOrbit check 252 tests, 250 passed, 2 environment-gated skips, 0 failed, 2026-08-22"
      ],
      "runtime_result_ref": "",
      "occurred_at": "2026-08-22T09:53:07.557Z"
    },
    {
      "round": 3,
      "transition_schema_version": "arckit-case-transition/v8",
      "goal": "Implement migration-first service cutover with readiness rollback and index-last OSS publication with secret-safe build output, then validate all material failure paths.",
      "outcome": "completed",
      "gap_selection": {
        "mode": "candidate",
        "basis": "Deployment atomicity is the sole ready Case obligation after server and client compatibility were accepted; unrelated Project gaps remain case-required.",
        "snapshot_token": "e599e510b7caa098ebcb9440b7f66004a1a6bb07460711beb091b3dd6c32f683",
        "selected_ref": "case-gap:CASE-20260822-002:GAP-deployment-atomicity",
        "comparison_summary": "Selected the only ready Case gap and deferred all four unrelated Project gaps to their own future Cases.",
        "fresh_discovery_summary": "No new implementation gap emerged; the local Docker daemon is unavailable, so actual image construction is explicitly not claimed, while deployment ordering, rollback, Compose rendering, application suites and OSS publication behavior have direct automated evidence.",
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
            "reason": "Generic Agent scenario evaluation is unrelated to this release-safety implementation."
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
            "reason": "The generic Runtime backlog requires a separate Case and is not a dependency of Workshop deployment."
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
            "reason": "This Case does not authorize a separate permission-bearing real-project security exercise."
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
            "reason": "The Project-wide ledger audit remains separate from release script behavior."
          },
          {
            "ref": "case-gap:CASE-20260822-002:GAP-deployment-atomicity",
            "source": "persisted",
            "eligibility": "ready",
            "disposition": "selected",
            "priority_basis": {
              "blocking": "medium",
              "uncertainty": "low",
              "risk": "high",
              "user_impact": "high"
            },
            "reason": "It is the final implementation obligation required for safe direct rollout and rollback."
          }
        ]
      },
      "selected_gap": {
        "id": "GAP-deployment-atomicity",
        "responsibility": "agent",
        "goal": "实现并验证数据库迁移先行、服务健康切换与可回滚部署，以及 Website 静态资源 index-last 原子发布和安全日志输出。",
        "reason": "代码兼容不等于部署安全；当前服务脚本缺少显式迁移与健康回滚，Website 清空 OSS 后重传会制造不可用窗口并可能破坏旧 index 引用。",
        "derived_from": [
          "FACT-001",
          "FACT-004"
        ],
        "blocked_by": [],
        "priority_basis": {
          "blocking": "medium",
          "uncertainty": "low",
          "risk": "high",
          "user_impact": "high"
        },
        "evidence_required": [
          "服务部署在停止旧实例前执行幂等迁移，并以 ready HTTP 健康检查决定成功或镜像回滚",
          "Website 先发布不可变资源、最后切换 index.html，失败时旧版本仍可访问",
          "构建和部署日志不输出环境变量值，相关脚本具备静态或自动化验证"
        ]
      },
      "planned_transition": {
        "goal": "Implement migration-first service cutover with readiness rollback and index-last OSS publication with secret-safe build output, then validate all material failure paths.",
        "expected_state_change": "The final implementation Gap resolves and the Case advances to its independent Completion Review."
      },
      "accepted_state_delta": {
        "resolved_gap": {
          "id": "GAP-deployment-atomicity",
          "status": "resolved",
          "outcome": "Production service deployment now saves the running image, loads the candidate, executes its idempotent migration before stopping the old container, starts the candidate and requires container readiness, restoring the old image on post-cutover failure. Website OSS deployment no longer clears the prefix, uploads immutable assets and other files before index.html, preserves old hashed assets and hides environment values in build logs.",
          "reason": "Shell regression tests prove success, pre-cutover migration failure and post-cutover health rollback order; Python tests prove index-last and no-entry-switch on asset failure; Compose renders and all affected application suites pass. Docker image construction is not claimed because the local daemon is unavailable.",
          "evidence": [
            "../../hoewo/workshop-todo/deploy/Dockerfile",
            "../../hoewo/workshop-todo/deploy/prod/docker-compose.prod.yml",
            "../../hoewo/workshop-todo/deploy/prod/deploy.sh",
            "../../hoewo/workshop-todo/deploy/prod/remote-deploy.sh",
            "../../hoewo/workshop-todo/deploy/prod/remote-deploy_test.sh",
            "../../hoewo/workshop-todo/deploy/prod/test/fake-docker.sh",
            "../../hoewo/workshop-todo-website/frontend/script/build-vite.sh",
            "../../hoewo/workshop-todo-website/frontend/script/deploy-oss.py",
            "../../hoewo/workshop-todo-website/frontend/script/test_deploy_oss.py",
            "arckit/tech/arcorbit/realtime-synchronization-solution.md",
            "Verification: remote deployment success/migration-failure/health-rollback tests passed; OSS publication 3/3 tests passed; server Go suite, Website Vitest and production build passed, 2026-08-22"
          ]
        },
        "facts_added": [
          {
            "id": "FACT-006",
            "revision": 1,
            "status": "accepted",
            "statement": "Workshop 生产发布现在先对候选镜像执行 additive 幂等迁移，再切换容器并以 HTTP readiness 判定成功，失败自动恢复旧 image ID；Website OSS 发布保留旧资源、严格最后替换 index.html，并且构建日志不再输出环境变量值。",
            "basis": "The deployed script structure and automated success/failure simulations establish the transition ordering and rollback behavior, while OSS tests establish publication atomicity.",
            "evidence": [
              "../../hoewo/workshop-todo/deploy/Dockerfile",
              "../../hoewo/workshop-todo/deploy/prod/deploy.sh",
              "../../hoewo/workshop-todo/deploy/prod/remote-deploy.sh",
              "../../hoewo/workshop-todo/deploy/prod/remote-deploy_test.sh",
              "../../hoewo/workshop-todo-website/frontend/script/build-vite.sh",
              "../../hoewo/workshop-todo-website/frontend/script/deploy-oss.py",
              "../../hoewo/workshop-todo-website/frontend/script/test_deploy_oss.py",
              "arckit/tech/arcorbit/realtime-synchronization-solution.md"
            ]
          }
        ],
        "facts_superseded": [],
        "impacts_added": [
          {
            "id": "IMPACT-DEPLOYMENT-TECHNICAL-FOUNDATION",
            "fact_id": "FACT-006",
            "fact_revision": 1,
            "target": {
              "kind": "software_decision",
              "ref": "technical_foundation",
              "revision": 26
            },
            "effect": "upheld",
            "reason": "The service and clients can now be rolled out in the order required by the accepted realtime and source-of-truth architecture without creating an avoidable partial-upgrade window.",
            "gap_ids": [],
            "evidence": [
              "arckit/tech/arcorbit/realtime-synchronization-solution.md",
              "../../hoewo/workshop-todo/deploy/prod/remote-deploy.sh",
              "../../hoewo/workshop-todo-website/frontend/script/deploy-oss.py"
            ]
          },
          {
            "id": "IMPACT-DEPLOYMENT-VALIDATION",
            "fact_id": "FACT-006",
            "fact_revision": 1,
            "target": {
              "kind": "software_decision",
              "ref": "quality_and_validation",
              "revision": 4
            },
            "effect": "upheld",
            "reason": "Material deployment failure paths are repeatably simulated and the affected server, Website and ArcOrbit suites remain green.",
            "gap_ids": [],
            "evidence": [
              "../../hoewo/workshop-todo/deploy/prod/remote-deploy_test.sh",
              "../../hoewo/workshop-todo-website/frontend/script/test_deploy_oss.py",
              "Verification: remote deployment success/migration-failure/health-rollback tests passed; OSS publication 3/3 tests passed; server Go suite, Website Vitest and production build passed, 2026-08-22"
            ]
          }
        ],
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
        "project_revision": 164,
        "judgments": [
          {
            "invariant_ref": "product-expectations-remain-recoverable",
            "disposition": "not_relevant",
            "reason": "This round changes rollout mechanics without adding or revising a product capability or acceptance meaning.",
            "fact_refs": [],
            "evidence": [],
            "gap_refs": []
          },
          {
            "invariant_ref": "interaction-expectations-remain-recoverable",
            "disposition": "not_relevant",
            "reason": "No user journey or application recovery interaction changes in the deployment-script round.",
            "fact_refs": [],
            "evidence": [],
            "gap_refs": []
          },
          {
            "invariant_ref": "visual-language-remains-consistent",
            "disposition": "not_relevant",
            "reason": "No visual-language decision is affected by release ordering.",
            "fact_refs": [],
            "evidence": [],
            "gap_refs": []
          },
          {
            "invariant_ref": "technical-decisions-remain-explainable",
            "disposition": "upheld",
            "reason": "Migration ordering, readiness meaning, image rollback and index-last OSS semantics are documented with explicit compatibility boundaries.",
            "fact_refs": [
              "FACT-006"
            ],
            "evidence": [
              "arckit/tech/arcorbit/realtime-synchronization-solution.md",
              "../../hoewo/workshop-todo/deploy/prod/remote-deploy.sh",
              "../../hoewo/workshop-todo-website/frontend/script/deploy-oss.py"
            ],
            "gap_refs": []
          },
          {
            "invariant_ref": "accepted-facts-are-realized",
            "disposition": "upheld",
            "reason": "The production deployment entrypoints implement every ordering, rollback, retention and log-redaction claim in FACT-006.",
            "fact_refs": [
              "FACT-006"
            ],
            "evidence": [
              "../../hoewo/workshop-todo/deploy/prod/deploy.sh",
              "../../hoewo/workshop-todo/deploy/prod/remote-deploy.sh",
              "../../hoewo/workshop-todo-website/frontend/script/build-vite.sh",
              "../../hoewo/workshop-todo-website/frontend/script/deploy-oss.py"
            ],
            "gap_refs": []
          },
          {
            "invariant_ref": "material-risks-have-credible-evidence",
            "disposition": "upheld",
            "reason": "Automated tests exercise both pre-cutover and post-cutover failures plus OSS entry preservation, while full affected application suites control regression risk.",
            "fact_refs": [
              "FACT-006"
            ],
            "evidence": [
              "../../hoewo/workshop-todo/deploy/prod/remote-deploy_test.sh",
              "../../hoewo/workshop-todo-website/frontend/script/test_deploy_oss.py",
              "Verification: remote deployment success/migration-failure/health-rollback tests passed; OSS publication 3/3 tests passed; server Go suite, Website Vitest and production build passed, 2026-08-22"
            ],
            "gap_refs": []
          }
        ]
      },
      "evidence": [
        "../../hoewo/workshop-todo/deploy/Dockerfile",
        "../../hoewo/workshop-todo/deploy/prod/docker-compose.prod.yml",
        "../../hoewo/workshop-todo/deploy/prod/deploy.sh",
        "../../hoewo/workshop-todo/deploy/prod/remote-deploy.sh",
        "../../hoewo/workshop-todo/deploy/prod/remote-deploy_test.sh",
        "../../hoewo/workshop-todo-website/frontend/script/build-vite.sh",
        "../../hoewo/workshop-todo-website/frontend/script/deploy-oss.py",
        "../../hoewo/workshop-todo-website/frontend/script/test_deploy_oss.py",
        "arckit/tech/arcorbit/realtime-synchronization-solution.md",
        "Verification: remote deployment success/migration-failure/health-rollback tests passed; OSS publication 3/3 tests passed; server Go suite, Website Vitest and production build passed, 2026-08-22"
      ],
      "runtime_result_ref": "",
      "occurred_at": "2026-08-22T10:02:48.049Z"
    },
    {
      "round": 4,
      "transition_schema_version": "arckit-case-transition/v8",
      "goal": "Bind Broker readiness into the public health handler and verify both healthy and degraded responses before repeating Completion Review.",
      "outcome": "completed",
      "gap_selection": {
        "mode": "fresh",
        "basis": "Fresh completion inspection found that the public health endpoint did not reflect the Broker readiness flag after startup, which was more important than performing a knowingly stale clean review.",
        "snapshot_token": "7df4a5f8f7357d43874bfb48d561b5c56cd9f0d2e14a4480eeef31b74293e314",
        "selected_ref": "fresh-gap:CASE-20260822-002:GAP-health-readiness-continuity",
        "comparison_summary": "Selected the fresh health-readiness correctness gap ahead of Completion Review; all unrelated Project gaps remain case-required.",
        "fresh_discovery_summary": "Broker.Ready already changed to false on listener disconnect, but HealthCheck always returned 200, so rollout health did not continuously represent the accepted realtime readiness contract.",
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
            "reason": "The generic Agent evaluation remains a separate Case."
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
            "reason": "The general Runtime resilience backlog is unrelated to service health projection."
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
            "reason": "This fresh finding is not a permission-bearing project validation."
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
            "reason": "The general cross-record audit remains separate."
          },
          {
            "ref": "case-gap:CASE-20260822-002:CASE-20260822-002:completion-review:1",
            "source": "persisted",
            "eligibility": "ready",
            "disposition": "deferred",
            "priority_basis": {
              "blocking": "high",
              "uncertainty": "low",
              "risk": "high",
              "user_impact": "high"
            },
            "reason": "The review must bind the corrected content revision rather than approve the stale readiness implementation."
          },
          {
            "ref": "fresh-gap:CASE-20260822-002:GAP-health-readiness-continuity",
            "source": "fresh",
            "eligibility": "ready",
            "disposition": "selected",
            "priority_basis": {
              "blocking": "high",
              "uncertainty": "low",
              "risk": "high",
              "user_impact": "high"
            },
            "reason": "A false-positive health check could accept a candidate whose realtime listener had already disconnected."
          }
        ]
      },
      "selected_gap": {
        "id": "GAP-health-readiness-continuity",
        "responsibility": "agent",
        "goal": "Make the public service health response continuously reflect Broker readiness so deployment health cannot accept a realtime-degraded instance.",
        "reason": "Startup ordering guarantees initial readiness, but the Broker explicitly becomes unready on listener loss while the existing health handler remained an unconditional 200.",
        "derived_from": [
          "FACT-004",
          "FACT-006"
        ],
        "blocked_by": [],
        "priority_basis": {
          "blocking": "high",
          "uncertainty": "low",
          "risk": "high",
          "user_impact": "high"
        },
        "evidence_required": [
          "Production main binds Broker.Ready into the health handler before HTTP starts",
          "Health returns 200 while ready and 503 after readiness becomes false",
          "Server and deployment regression suites remain green"
        ]
      },
      "planned_transition": {
        "goal": "Bind Broker readiness into the public health handler and verify both healthy and degraded responses before repeating Completion Review.",
        "expected_state_change": "The fresh readiness gap resolves, content revision advances, and a new review candidate replaces the stale one."
      },
      "accepted_state_delta": {
        "resolved_gap": {
          "id": "GAP-health-readiness-continuity",
          "status": "resolved",
          "outcome": "Production main now binds Broker.Ready into HealthCheck before router startup; the endpoint returns 200 while the listener is ready and 503 whenever Broker readiness becomes false.",
          "reason": "A focused handler regression toggles the bound readiness function and the complete Go plus deployment suites pass after the change.",
          "evidence": [
            "../../hoewo/workshop-todo/main.go",
            "../../hoewo/workshop-todo/handler/health.go",
            "../../hoewo/workshop-todo/handler/health_test.go",
            "../../hoewo/workshop-todo/realtime/broker.go",
            "Verification: Go suite and remote deployment ordering/rollback tests passed after continuous health binding, 2026-08-22"
          ]
        },
        "facts_added": [
          {
            "id": "FACT-007",
            "revision": 1,
            "status": "accepted",
            "statement": "Workshop 的公开 health endpoint 已绑定当前 Broker readiness：监听就绪时返回 200，监听断开并进入重连时返回 503，因此容器健康状态持续反映实时链路而不只反映进程存活。",
            "basis": "Production binding and a deterministic handler test directly establish both readiness states.",
            "evidence": [
              "../../hoewo/workshop-todo/main.go",
              "../../hoewo/workshop-todo/handler/health.go",
              "../../hoewo/workshop-todo/handler/health_test.go",
              "../../hoewo/workshop-todo/realtime/broker.go"
            ]
          }
        ],
        "facts_superseded": [],
        "impacts_added": [
          {
            "id": "IMPACT-HEALTH-READINESS-CONTINUITY",
            "fact_id": "FACT-007",
            "fact_revision": 1,
            "target": {
              "kind": "software_decision",
              "ref": "technical_foundation",
              "revision": 26
            },
            "effect": "upheld",
            "reason": "The deployment readiness signal now continuously represents the accepted Broker lifecycle instead of only the initial process start.",
            "gap_ids": [],
            "evidence": [
              "../../hoewo/workshop-todo/main.go",
              "../../hoewo/workshop-todo/handler/health.go",
              "../../hoewo/workshop-todo/realtime/broker.go",
              "arckit/tech/arcorbit/realtime-synchronization-solution.md"
            ]
          }
        ],
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
        "project_revision": 164,
        "judgments": [
          {
            "invariant_ref": "product-expectations-remain-recoverable",
            "disposition": "not_relevant",
            "reason": "The correction changes an operational readiness projection, not a product outcome.",
            "fact_refs": [],
            "evidence": [],
            "gap_refs": []
          },
          {
            "invariant_ref": "interaction-expectations-remain-recoverable",
            "disposition": "not_relevant",
            "reason": "No user interaction changes in this service health correction.",
            "fact_refs": [],
            "evidence": [],
            "gap_refs": []
          },
          {
            "invariant_ref": "visual-language-remains-consistent",
            "disposition": "not_relevant",
            "reason": "No visual rule is affected.",
            "fact_refs": [],
            "evidence": [],
            "gap_refs": []
          },
          {
            "invariant_ref": "technical-decisions-remain-explainable",
            "disposition": "upheld",
            "reason": "The health signal now matches the documented continuous Broker readiness lifecycle.",
            "fact_refs": [
              "FACT-007"
            ],
            "evidence": [
              "arckit/tech/arcorbit/realtime-synchronization-solution.md",
              "../../hoewo/workshop-todo/handler/health.go",
              "../../hoewo/workshop-todo/realtime/broker.go"
            ],
            "gap_refs": []
          },
          {
            "invariant_ref": "accepted-facts-are-realized",
            "disposition": "upheld",
            "reason": "Production main and HealthCheck directly realize FACT-007.",
            "fact_refs": [
              "FACT-007"
            ],
            "evidence": [
              "../../hoewo/workshop-todo/main.go",
              "../../hoewo/workshop-todo/handler/health.go"
            ],
            "gap_refs": []
          },
          {
            "invariant_ref": "material-risks-have-credible-evidence",
            "disposition": "upheld",
            "reason": "Deterministic 200/503 handler coverage and complete service/deployment regression suites control the false-positive readiness risk.",
            "fact_refs": [
              "FACT-007"
            ],
            "evidence": [
              "../../hoewo/workshop-todo/handler/health_test.go",
              "Verification: Go suite and remote deployment ordering/rollback tests passed after continuous health binding, 2026-08-22"
            ],
            "gap_refs": []
          }
        ]
      },
      "evidence": [
        "../../hoewo/workshop-todo/main.go",
        "../../hoewo/workshop-todo/handler/health.go",
        "../../hoewo/workshop-todo/handler/health_test.go",
        "../../hoewo/workshop-todo/realtime/broker.go",
        "arckit/tech/arcorbit/realtime-synchronization-solution.md",
        "Verification: Go suite and remote deployment ordering/rollback tests passed after continuous health binding, 2026-08-22"
      ],
      "runtime_result_ref": "",
      "occurred_at": "2026-08-22T10:06:00.772Z"
    },
    {
      "round": 5,
      "transition_schema_version": "arckit-case-transition/v8",
      "goal": "Perform the five-dimension Completion Review against content revision 4 and close the Case only if the implementation is clean.",
      "outcome": "completed",
      "gap_selection": {
        "mode": "candidate",
        "basis": "Fresh inspection after the health-readiness correction found no higher-priority ordinary Case gap; all accepted implementation and deployment risks are closed, so the current content revision is ready for semantic completion review.",
        "snapshot_token": "72e68cd621cb956c26fe3a42555863da80350593de773cc00a2f0f66c118d7a6",
        "selected_ref": "case-gap:CASE-20260822-002:CASE-20260822-002:completion-review:1",
        "comparison_summary": "Selected the only ready Case candidate; the four persisted Project gaps require separate Cases and do not block this Workshop compatibility closeout.",
        "fresh_discovery_summary": "Fresh source, test, deployment-script, ledger, and documentation inspection found no additional ordinary gap after continuous Broker readiness was bound to the public health endpoint.",
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
            "reason": "The generic Agent scenario evaluation is a separate Project concern and is not caused by the Workshop compatibility implementation."
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
            "reason": "The generic Runtime resilience backlog is broader than the completed Workshop realtime adapter and deployment scope."
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
            "reason": "Security validation against another real project requires its own authority and Case."
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
            "reason": "The repository-wide cross-record audit remains an independent Project gap."
          },
          {
            "ref": "case-gap:CASE-20260822-002:CASE-20260822-002:completion-review:1",
            "source": "persisted",
            "eligibility": "ready",
            "disposition": "selected",
            "priority_basis": {
              "blocking": "high",
              "uncertainty": "low",
              "risk": "high",
              "user_impact": "high"
            },
            "reason": "All ordinary gaps and state impacts are closed, and the review binds the latest content revision after the readiness correction."
          }
        ]
      },
      "selected_gap": {
        "id": "CASE-20260822-002:completion-review:1",
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
        "goal": "Perform the five-dimension Completion Review against content revision 4 and close the Case only if the implementation is clean.",
        "expected_state_change": "A clean review records its evidence and moves the Case from active to closed without adding new content facts or findings."
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
            "Review: server startup, migration, replay bounds, reconnect readiness, and public health projection were inspected as one lifecycle; no stale success path remains.",
            "Review: Website and ArcOrbit classify legacy, modern, and ambiguous handshakes before cursor access and preserve explicit human-gate semantics.",
            "Verification: PostgreSQL 14 UTF-8 full Go integration suite and built-binary migration/startup smoke passed, 2026-08-22.",
            "Verification: final go vet, full Go suite, deterministic remote deployment success/migration-failure/rollback tests, Website realtime tests, OSS publication tests, production Vite build, ArcOrbit full check, ledger validation/audit, and diff checks passed, 2026-08-22.",
            "arckit/tech/arcorbit/realtime-synchronization-solution.md"
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
        "project_revision": 164,
        "judgments": [
          {
            "invariant_ref": "product-expectations-remain-recoverable",
            "disposition": "upheld",
            "reason": "The completed server, clients, and release paths realize the accepted compatibility outcome for old and new service combinations without minute-level fallback polling.",
            "fact_refs": [
              "FACT-004",
              "FACT-005",
              "FACT-006",
              "FACT-007"
            ],
            "evidence": [
              "arckit/tech/arcorbit/realtime-synchronization-solution.md",
              "../../hoewo/workshop-todo/main.go",
              "../../hoewo/workshop-todo-website/frontend/src/hooks/useProjectWebSocket.ts",
              "runtime/arcorbit/src/workshop-realtime-adapter.mjs"
            ],
            "gap_refs": []
          },
          {
            "invariant_ref": "interaction-expectations-remain-recoverable",
            "disposition": "upheld",
            "reason": "Reconnect recovery and explicit user intervention remain distinct: transport synchronization refreshes state but does not resume an awaiting-human task.",
            "fact_refs": [
              "FACT-005"
            ],
            "evidence": [
              "arckit/tech/arcorbit/realtime-synchronization-solution.md",
              "runtime/arcorbit/src/workshop-realtime-adapter.mjs",
              "../../hoewo/workshop-todo-website/frontend/src/hooks/useProjectWebSocket.ts"
            ],
            "gap_refs": []
          },
          {
            "invariant_ref": "visual-language-remains-consistent",
            "disposition": "not_relevant",
            "reason": "The Case changes transport, service, deployment, and documentation behavior without changing a visual-language rule.",
            "fact_refs": [],
            "evidence": [],
            "gap_refs": []
          },
          {
            "invariant_ref": "technical-decisions-remain-explainable",
            "disposition": "upheld",
            "reason": "The durable technical solution now explains protocol classification, cursor bounds, readiness lifecycle, additive migration, service rollback, and index-last OSS publication.",
            "fact_refs": [
              "FACT-004",
              "FACT-005",
              "FACT-006",
              "FACT-007"
            ],
            "evidence": [
              "arckit/tech/arcorbit/realtime-synchronization-solution.md",
              "../../hoewo/workshop-todo/database/db.go",
              "../../hoewo/workshop-todo/realtime/broker.go",
              "../../hoewo/workshop-todo/deploy/prod/remote-deploy.sh"
            ],
            "gap_refs": []
          },
          {
            "invariant_ref": "accepted-facts-are-realized",
            "disposition": "upheld",
            "reason": "Direct source inspection maps each accepted implementation fact to its production path and focused regression evidence.",
            "fact_refs": [
              "FACT-004",
              "FACT-005",
              "FACT-006",
              "FACT-007"
            ],
            "evidence": [
              "../../hoewo/workshop-todo/main.go",
              "../../hoewo/workshop-todo/handler/health_test.go",
              "../../hoewo/workshop-todo-website/frontend/src/lib/realtime/projectEventStream.test.ts",
              "runtime/arcorbit/test/workshop-realtime-adapter.test.mjs",
              "../../hoewo/workshop-todo-website/frontend/script/test_deploy_oss.py"
            ],
            "gap_refs": []
          },
          {
            "invariant_ref": "material-risks-have-credible-evidence",
            "disposition": "upheld",
            "reason": "Real PostgreSQL coverage, built-binary startup smoke, complete service/client suites, and deterministic deployment failure simulations proportionately cover the migration, event-loss, compatibility, and rollback risks.",
            "fact_refs": [
              "FACT-004",
              "FACT-005",
              "FACT-006",
              "FACT-007"
            ],
            "evidence": [
              "Verification: PostgreSQL 14 UTF-8 full Go integration suite and built-binary migration/startup smoke passed, 2026-08-22",
              "../../hoewo/workshop-todo/deploy/prod/remote-deploy_test.sh",
              "Verification: final cross-repository regression suites and ledger audits passed, 2026-08-22"
            ],
            "gap_refs": []
          }
        ]
      },
      "evidence": [
        "arckit/tech/arcorbit/realtime-synchronization-solution.md",
        "../../hoewo/workshop-todo/main.go",
        "../../hoewo/workshop-todo/database/db.go",
        "../../hoewo/workshop-todo/realtime/broker.go",
        "../../hoewo/workshop-todo/handler/health.go",
        "../../hoewo/workshop-todo/deploy/prod/remote-deploy.sh",
        "../../hoewo/workshop-todo-website/frontend/src/hooks/useProjectWebSocket.ts",
        "../../hoewo/workshop-todo-website/frontend/script/deploy-oss.py",
        "runtime/arcorbit/src/workshop-realtime-adapter.mjs",
        "Verification: final cross-repository regression suites, deployment failure simulations, ledger audits, and diff checks passed, 2026-08-22"
      ],
      "runtime_result_ref": "",
      "occurred_at": "2026-08-22T10:11:06.636Z"
    }
  ],
  "case_resolution": {
    "status": "resolved",
    "stage": "resolved",
    "satisfied": [
      "GAP-server-realtime-readiness",
      "GAP-client-realtime-recovery",
      "GAP-deployment-atomicity",
      "GAP-health-readiness-continuity"
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
    "updated_at": "2026-08-22T10:11:06.636Z"
  }
}
```

## Round Notes

- Case history is canonical in Structured Record.rounds; keep prose notes exceptional.
