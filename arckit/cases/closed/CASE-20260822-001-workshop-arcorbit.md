# 兼容旧 Workshop 服务的 ArcOrbit 实时同步

Case: CASE-20260822-001
Status: closed
Artifact Type: mixed
Selected Gap: none
Updated: 2026-08-22T08:41:26.667Z

## User Intent

允许 ArcOrbit 客户端先于 Workshop 新服务升级：旧服务无事件 ID 通知仍能驱动刷新，不保留每 60 秒轮询；应用启动、WebSocket 重连、网络恢复、系统唤醒和用户主动操作可收敛当前事实，保留 15 分钟全量对账，并在执行前确认远端任务状态且绝不越过 awaiting_human。

## Structured Record

```json
{
  "schema_version": "development-case-record/v5",
  "id": "CASE-20260822-001",
  "title": "兼容旧 Workshop 服务的 ArcOrbit 实时同步",
  "status": "closed",
  "artifact_type": "mixed",
  "created_at": "2026-08-22T08:19:42.842Z",
  "updated_at": "2026-08-22T08:41:26.667Z",
  "user_intent": "允许 ArcOrbit 客户端先于 Workshop 新服务升级：旧服务无事件 ID 通知仍能驱动刷新，不保留每 60 秒轮询；应用启动、WebSocket 重连、网络恢复、系统唤醒和用户主动操作可收敛当前事实，保留 15 分钟全量对账，并在执行前确认远端任务状态且绝不越过 awaiting_human。",
  "expected_outcome": "ArcOrbit 可自动识别旧服务兼容模式，消费无 ID 通知，提供可观察的主动同步入口和最后同步状态，在关键生命周期与执行前安全对账；连接新服务时继续使用游标和 replay，客户端先升级不造成静默任务执行或人工 Gate 回归。",
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
      "statement": "操作者确认 ArcOrbit 旧服务过渡策略：兼容无 ID WebSocket 通知；取消每 60 秒兜底轮询；保留应用启动、重连、网络恢复、系统唤醒、15 分钟对账、用户主动同步和执行前远端状态确认；新服务上线后继续使用 ID、游标与 replay；任何同步不得越过 awaiting_human。",
      "basis": "当前操作者输入是本轮最高权威增量。",
      "evidence": [
        "Current operator input, 2026-08-22"
      ]
    },
    {
      "id": "FACT-002",
      "revision": 1,
      "status": "accepted",
      "statement": "现有新 ArcOrbit 在旧服务 system.connected 缦少 latest_event_id 时仍标记 connected，但 queueInvalidation 会丢弃所有无 ID 领域事件，且 60 秒 fallback 只在 isDegraded 为真时运行；因此旧服务健康连接会静默等待 15 分钟对账。",
      "basis": "已完成的代码路径审计和旧消息格式模拟复现。",
      "evidence": [
        "runtime/arcorbit/src/workshop-realtime-adapter.mjs:119",
        "runtime/arcorbit/src/workshop-realtime-adapter.mjs:173",
        "runtime/arcorbit/src/workshop-realtime-adapter.mjs:270",
        "runtime/arcorbit/desktop/main.mjs:364",
        "Verification: old-service frame simulation, 2026-08-22"
      ]
    },
    {
      "id": "FACT-003",
      "revision": 1,
      "status": "accepted",
      "statement": "ArcOrbit 已实现双模式 Workshop 实时适配：新服务使用 ID/游标/replay，旧服务对每次连接执行当前态刷新并接受无 ID 通知且不读写游标；60 秒兜底已移除，保留 15 分钟与生命周期同步和显式立即同步；领取前重新确认远端任务；自动同步不解除 awaiting_human。",
      "basis": "生产代码、自动化回归、静态检查和本地发行构建共同证明实际软件状态。",
      "evidence": [
        "arckit/spec/agentic-software-development/runtime-automation-workspace.md",
        "arckit/interaction/automation-workspace/interaction.md",
        "arckit/interaction/automation-workspace/default.html",
        "arckit/tech/arcorbit/realtime-synchronization-solution.md",
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
        "Verification: local macOS x64 installer build and arckit-distribution-smoke/v1 passed, build 20260822083310"
      ]
    }
  ],
  "state_impacts": [
    {
      "id": "IMPACT-003-1",
      "fact_id": "FACT-003",
      "fact_revision": 1,
      "target": {
        "kind": "software_decision",
        "ref": "product_capabilities",
        "revision": 17
      },
      "effect": "upheld",
      "reason": "The implemented compatibility boundary realizes the updated product_capabilities decision.",
      "gap_ids": [],
      "evidence": [
        "arckit/spec/agentic-software-development/runtime-automation-workspace.md",
        "arckit/interaction/automation-workspace/interaction.md",
        "arckit/interaction/automation-workspace/default.html",
        "arckit/tech/arcorbit/realtime-synchronization-solution.md",
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
        "Verification: local macOS x64 installer build and arckit-distribution-smoke/v1 passed, build 20260822083310"
      ]
    },
    {
      "id": "IMPACT-003-2",
      "fact_id": "FACT-003",
      "fact_revision": 1,
      "target": {
        "kind": "software_decision",
        "ref": "experience_and_interaction",
        "revision": 28
      },
      "effect": "upheld",
      "reason": "The implemented compatibility boundary realizes the updated experience_and_interaction decision.",
      "gap_ids": [],
      "evidence": [
        "arckit/spec/agentic-software-development/runtime-automation-workspace.md",
        "arckit/interaction/automation-workspace/interaction.md",
        "arckit/interaction/automation-workspace/default.html",
        "arckit/tech/arcorbit/realtime-synchronization-solution.md",
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
        "Verification: local macOS x64 installer build and arckit-distribution-smoke/v1 passed, build 20260822083310"
      ]
    },
    {
      "id": "IMPACT-003-3",
      "fact_id": "FACT-003",
      "fact_revision": 1,
      "target": {
        "kind": "software_decision",
        "ref": "data_and_state",
        "revision": 13
      },
      "effect": "upheld",
      "reason": "The implemented compatibility boundary realizes the updated data_and_state decision.",
      "gap_ids": [],
      "evidence": [
        "arckit/spec/agentic-software-development/runtime-automation-workspace.md",
        "arckit/interaction/automation-workspace/interaction.md",
        "arckit/interaction/automation-workspace/default.html",
        "arckit/tech/arcorbit/realtime-synchronization-solution.md",
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
        "Verification: local macOS x64 installer build and arckit-distribution-smoke/v1 passed, build 20260822083310"
      ]
    },
    {
      "id": "IMPACT-003-4",
      "fact_id": "FACT-003",
      "fact_revision": 1,
      "target": {
        "kind": "software_decision",
        "ref": "external_integrations",
        "revision": 6
      },
      "effect": "upheld",
      "reason": "The implemented compatibility boundary realizes the updated external_integrations decision.",
      "gap_ids": [],
      "evidence": [
        "arckit/spec/agentic-software-development/runtime-automation-workspace.md",
        "arckit/interaction/automation-workspace/interaction.md",
        "arckit/interaction/automation-workspace/default.html",
        "arckit/tech/arcorbit/realtime-synchronization-solution.md",
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
        "Verification: local macOS x64 installer build and arckit-distribution-smoke/v1 passed, build 20260822083310"
      ]
    },
    {
      "id": "IMPACT-003-5",
      "fact_id": "FACT-003",
      "fact_revision": 1,
      "target": {
        "kind": "software_decision",
        "ref": "technical_foundation",
        "revision": 26
      },
      "effect": "upheld",
      "reason": "The implemented compatibility boundary realizes the updated technical_foundation decision.",
      "gap_ids": [],
      "evidence": [
        "arckit/spec/agentic-software-development/runtime-automation-workspace.md",
        "arckit/interaction/automation-workspace/interaction.md",
        "arckit/interaction/automation-workspace/default.html",
        "arckit/tech/arcorbit/realtime-synchronization-solution.md",
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
        "Verification: local macOS x64 installer build and arckit-distribution-smoke/v1 passed, build 20260822083310"
      ]
    },
    {
      "id": "IMPACT-003-6",
      "fact_id": "FACT-003",
      "fact_revision": 1,
      "target": {
        "kind": "software_decision",
        "ref": "quality_and_validation",
        "revision": 4
      },
      "effect": "upheld",
      "reason": "The implemented compatibility boundary realizes the updated quality_and_validation decision.",
      "gap_ids": [],
      "evidence": [
        "arckit/spec/agentic-software-development/runtime-automation-workspace.md",
        "arckit/interaction/automation-workspace/interaction.md",
        "arckit/interaction/automation-workspace/default.html",
        "arckit/tech/arcorbit/realtime-synchronization-solution.md",
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
        "Verification: local macOS x64 installer build and arckit-distribution-smoke/v1 passed, build 20260822083310"
      ]
    },
    {
      "id": "IMPACT-003-7",
      "fact_id": "FACT-003",
      "fact_revision": 1,
      "target": {
        "kind": "software_decision",
        "ref": "observability_and_operation",
        "revision": 7
      },
      "effect": "upheld",
      "reason": "The implemented compatibility boundary realizes the updated observability_and_operation decision.",
      "gap_ids": [],
      "evidence": [
        "arckit/spec/agentic-software-development/runtime-automation-workspace.md",
        "arckit/interaction/automation-workspace/interaction.md",
        "arckit/interaction/automation-workspace/default.html",
        "arckit/tech/arcorbit/realtime-synchronization-solution.md",
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
        "Verification: local macOS x64 installer build and arckit-distribution-smoke/v1 passed, build 20260822083310"
      ]
    }
  ],
  "gaps": [
    {
      "id": "GAP-legacy-realtime-compatibility",
      "status": "resolved",
      "goal": "完整实现并验证 ArcOrbit 对旧 Workshop 服务的无 ID 实时兼容、无 60 秒轮询的生命周期收敛、主动同步、执行前远端确认、可观察连接状态和 awaiting_human 保护，同时保持新服务游标/replay 路径。",
      "reason": "客户端先升级会遇到旧服务无 ID 事件；当前实现静默丢弃这些通知并错误报告健康，且用户已明确取消 60 秒兜底、改用关键生命周期与主动同步收敛。",
      "derived_from": [
        "FACT-001",
        "FACT-002"
      ],
      "blocked_by": [],
      "priority_basis": {
        "blocking": "直接决定客户端能否先于服务端安全升级。",
        "uncertainty": "范围与策略已经由用户确认，剩余不确定性是实现接线与回归行为。",
        "risk": "错误处理可能漏任务变化、误报实时健康、执行陈旧任务或越过人工确认。",
        "user_impact": "决定旧服务过渡期的实时体验、主动恢复能力和自动执行安全。"
      },
      "responsibility": "agent",
      "evidence_required": [
        "旧 system.connected 与无 ID 领域事件触发兼容状态和 REST 刷新，不读写持久游标",
        "移除 60 秒周期兜底并保留 15 分钟全量对账、启动/重连/网络恢复/系统唤醒收敛",
        "Desktop 提供主动同步入口、同步反馈、最后同步时间和兼容/可恢复连接状态",
        "执行任务前确认远端最新状态且 awaiting_human 在所有自动同步路径保持关闭式保护",
        "自动化测试、静态检查和发行构建覆盖新旧服务路径"
      ],
      "resolution": {
        "id": "GAP-legacy-realtime-compatibility",
        "status": "resolved",
        "outcome": "ArcOrbit now supports legacy no-ID notifications and reconnect-current-state recovery, preserves modern cursor replay, removes the 60-second fallback, exposes immediate sync and protocol mode, re-confirms tasks before claim, and preserves awaiting_human.",
        "reason": "Code, regression tests, static checks and packaged distribution smoke all satisfy the Gap evidence requirements.",
        "evidence": [
          "arckit/spec/agentic-software-development/runtime-automation-workspace.md",
          "arckit/interaction/automation-workspace/interaction.md",
          "arckit/interaction/automation-workspace/default.html",
          "arckit/tech/arcorbit/realtime-synchronization-solution.md",
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
          "Verification: local macOS x64 installer build and arckit-distribution-smoke/v1 passed, build 20260822083310"
        ],
        "occurred_at": "2026-08-22T08:39:49.085Z"
      }
    }
  ],
  "content_revision": 1,
  "completion_review": {
    "status": "clean",
    "policy": {
      "initial_max_cycles": 3,
      "source": "User authorized automatic state-driven execution until completion on 2026-08-22.",
      "snapshotted_at": "2026-08-22T08:19:42.842Z"
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
          "runtime/arcorbit/src/workshop-realtime-adapter.mjs",
          "runtime/arcorbit/desktop/main.mjs",
          "runtime/arcorbit/desktop/renderer/index.html",
          "runtime/arcorbit/desktop/renderer/renderer.js",
          "runtime/arcorbit/src/automation-coordinator.mjs",
          "runtime/arcorbit/src/desktop/desktop-store.mjs",
          "runtime/arcorbit/test/workshop-realtime-adapter.test.mjs",
          "runtime/arcorbit/test/automation-coordinator.test.mjs",
          "runtime/arcorbit/test/desktop-renderer.test.mjs",
          "arckit/spec/agentic-software-development/runtime-automation-workspace.md",
          "arckit/interaction/automation-workspace/interaction.md",
          "arckit/interaction/automation-workspace/default.html",
          "arckit/tech/arcorbit/realtime-synchronization-solution.md",
          "Verification: npm run check — syntax checks plus 250 tests, 248 passed, 2 environment-gated skips, 0 failed, 2026-08-22",
          "Verification: legacy handshake, id-less notification and legacy reconnect test passes without cursor read/write",
          "Verification: static Desktop test proves 15-minute reconciliation, visible immediate sync and absence of fallbackSyncTimer",
          "Verification: awaiting_human preservation tests pass for periodic and realtime refresh",
          "Verification: pre-claim stale-candidate refresh test passes",
          "Verification: local macOS x64 installer build and arckit-distribution-smoke/v1 passed, build 20260822083310",
          "Verification: Project/Case audit and validation plus 16 ledger governance tests passed after Round 1",
          "Verification: git diff --check passed"
        ],
        "occurred_at": "2026-08-22T08:41:26.667Z"
      }
    ],
    "evidence": [
      "runtime/arcorbit/src/workshop-realtime-adapter.mjs",
      "runtime/arcorbit/desktop/main.mjs",
      "runtime/arcorbit/desktop/renderer/index.html",
      "runtime/arcorbit/desktop/renderer/renderer.js",
      "runtime/arcorbit/src/automation-coordinator.mjs",
      "runtime/arcorbit/src/desktop/desktop-store.mjs",
      "runtime/arcorbit/test/workshop-realtime-adapter.test.mjs",
      "runtime/arcorbit/test/automation-coordinator.test.mjs",
      "runtime/arcorbit/test/desktop-renderer.test.mjs",
      "arckit/spec/agentic-software-development/runtime-automation-workspace.md",
      "arckit/interaction/automation-workspace/interaction.md",
      "arckit/interaction/automation-workspace/default.html",
      "arckit/tech/arcorbit/realtime-synchronization-solution.md",
      "Verification: npm run check — syntax checks plus 250 tests, 248 passed, 2 environment-gated skips, 0 failed, 2026-08-22",
      "Verification: legacy handshake, id-less notification and legacy reconnect test passes without cursor read/write",
      "Verification: static Desktop test proves 15-minute reconciliation, visible immediate sync and absence of fallbackSyncTimer",
      "Verification: awaiting_human preservation tests pass for periodic and realtime refresh",
      "Verification: pre-claim stale-candidate refresh test passes",
      "Verification: local macOS x64 installer build and arckit-distribution-smoke/v1 passed, build 20260822083310",
      "Verification: Project/Case audit and validation plus 16 ledger governance tests passed after Round 1",
      "Verification: git diff --check passed"
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
      "goal": "完整实现并验证 ArcOrbit 对旧 Workshop 服务的无 ID 实时兼容、无 60 秒轮询的生命周期收敛、主动同步、执行前远端确认、可观察连接状态和 awaiting_human 保护，同时保持新服务游标/replay 路径。",
      "outcome": "completed",
      "gap_selection": {
        "mode": "candidate",
        "basis": "The registered compatibility gap is the only ready obligation inside the active Case and directly blocks the approved client-first rollout.",
        "snapshot_token": "05e21ea8362c52d6e0f9dc5a222cc1d3d4a6541a101334836e7904558d4833d5",
        "selected_ref": "case-gap:CASE-20260822-001:GAP-legacy-realtime-compatibility",
        "comparison_summary": "Compared the active Case gap with all four unbound project obligations; the latter require separate Cases and do not supersede this current rollout blocker.",
        "fresh_discovery_summary": "Implementation and verification exposed no independent fresh gap; all findings fit the accepted compatibility outcome.",
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
            "reason": "This obligation belongs to a separate product-wide Case and is outside the current compatibility Case."
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
            "reason": "This obligation belongs to a separate product-wide Case and is outside the current compatibility Case."
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
            "reason": "This obligation belongs to a separate product-wide Case and is outside the current compatibility Case."
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
            "reason": "This obligation belongs to a separate product-wide Case and is outside the current compatibility Case."
          },
          {
            "ref": "case-gap:CASE-20260822-001:GAP-legacy-realtime-compatibility",
            "source": "persisted",
            "eligibility": "ready",
            "disposition": "selected",
            "priority_basis": {
              "blocking": "直接决定客户端能否先于服务端安全升级。",
              "uncertainty": "范围与策略已经由用户确认，剩余不确定性是实现接线与回归行为。",
              "risk": "错误处理可能漏任务变化、误报实时健康、执行陈旧任务或越过人工确认。",
              "user_impact": "决定旧服务过渡期的实时体验、主动恢复能力和自动执行安全。"
            },
            "reason": "This registered Case gap is the user's current rollout blocker and now has complete implementation evidence."
          }
        ]
      },
      "selected_gap": {
        "id": "GAP-legacy-realtime-compatibility",
        "responsibility": "agent",
        "goal": "完整实现并验证 ArcOrbit 对旧 Workshop 服务的无 ID 实时兼容、无 60 秒轮询的生命周期收敛、主动同步、执行前远端确认、可观察连接状态和 awaiting_human 保护，同时保持新服务游标/replay 路径。",
        "reason": "客户端先升级会遇到旧服务无 ID 事件；当前实现静默丢弃这些通知并错误报告健康，且用户已明确取消 60 秒兜底、改用关键生命周期与主动同步收敛。",
        "derived_from": [
          "FACT-001",
          "FACT-002"
        ],
        "blocked_by": [],
        "priority_basis": {
          "blocking": "直接决定客户端能否先于服务端安全升级。",
          "uncertainty": "范围与策略已经由用户确认，剩余不确定性是实现接线与回归行为。",
          "risk": "错误处理可能漏任务变化、误报实时健康、执行陈旧任务或越过人工确认。",
          "user_impact": "决定旧服务过渡期的实时体验、主动恢复能力和自动执行安全。"
        },
        "evidence_required": [
          "旧 system.connected 与无 ID 领域事件触发兼容状态和 REST 刷新，不读写持久游标",
          "移除 60 秒周期兜底并保留 15 分钟全量对账、启动/重连/网络恢复/系统唤醒收敛",
          "Desktop 提供主动同步入口、同步反馈、最后同步时间和兼容/可恢复连接状态",
          "执行任务前确认远端最新状态且 awaiting_human 在所有自动同步路径保持关闭式保护",
          "自动化测试、静态检查和发行构建覆盖新旧服务路径"
        ]
      },
      "planned_transition": {
        "goal": "完整实现并验证 ArcOrbit 对旧 Workshop 服务的无 ID 实时兼容、无 60 秒轮询的生命周期收敛、主动同步、执行前远端确认、可观察连接状态和 awaiting_human 保护，同时保持新服务游标/replay 路径。",
        "expected_state_change": "Resolve the compatibility Gap with implementation, canonical product/interaction/technical facts and proportionate release evidence, then enter independent completion review."
      },
      "accepted_state_delta": {
        "resolved_gap": {
          "id": "GAP-legacy-realtime-compatibility",
          "status": "resolved",
          "outcome": "ArcOrbit now supports legacy no-ID notifications and reconnect-current-state recovery, preserves modern cursor replay, removes the 60-second fallback, exposes immediate sync and protocol mode, re-confirms tasks before claim, and preserves awaiting_human.",
          "reason": "Code, regression tests, static checks and packaged distribution smoke all satisfy the Gap evidence requirements.",
          "evidence": [
            "arckit/spec/agentic-software-development/runtime-automation-workspace.md",
            "arckit/interaction/automation-workspace/interaction.md",
            "arckit/interaction/automation-workspace/default.html",
            "arckit/tech/arcorbit/realtime-synchronization-solution.md",
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
            "Verification: local macOS x64 installer build and arckit-distribution-smoke/v1 passed, build 20260822083310"
          ]
        },
        "facts_added": [
          {
            "id": "FACT-003",
            "revision": 1,
            "status": "accepted",
            "statement": "ArcOrbit 已实现双模式 Workshop 实时适配：新服务使用 ID/游标/replay，旧服务对每次连接执行当前态刷新并接受无 ID 通知且不读写游标；60 秒兜底已移除，保留 15 分钟与生命周期同步和显式立即同步；领取前重新确认远端任务；自动同步不解除 awaiting_human。",
            "basis": "生产代码、自动化回归、静态检查和本地发行构建共同证明实际软件状态。",
            "evidence": [
              "arckit/spec/agentic-software-development/runtime-automation-workspace.md",
              "arckit/interaction/automation-workspace/interaction.md",
              "arckit/interaction/automation-workspace/default.html",
              "arckit/tech/arcorbit/realtime-synchronization-solution.md",
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
              "Verification: local macOS x64 installer build and arckit-distribution-smoke/v1 passed, build 20260822083310"
            ]
          }
        ],
        "facts_superseded": [],
        "impacts_added": [
          {
            "id": "IMPACT-003-1",
            "fact_id": "FACT-003",
            "fact_revision": 1,
            "target": {
              "kind": "software_decision",
              "ref": "product_capabilities",
              "revision": 17
            },
            "effect": "upheld",
            "reason": "The implemented compatibility boundary realizes the updated product_capabilities decision.",
            "gap_ids": [],
            "evidence": [
              "arckit/spec/agentic-software-development/runtime-automation-workspace.md",
              "arckit/interaction/automation-workspace/interaction.md",
              "arckit/interaction/automation-workspace/default.html",
              "arckit/tech/arcorbit/realtime-synchronization-solution.md",
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
              "Verification: local macOS x64 installer build and arckit-distribution-smoke/v1 passed, build 20260822083310"
            ]
          },
          {
            "id": "IMPACT-003-2",
            "fact_id": "FACT-003",
            "fact_revision": 1,
            "target": {
              "kind": "software_decision",
              "ref": "experience_and_interaction",
              "revision": 28
            },
            "effect": "upheld",
            "reason": "The implemented compatibility boundary realizes the updated experience_and_interaction decision.",
            "gap_ids": [],
            "evidence": [
              "arckit/spec/agentic-software-development/runtime-automation-workspace.md",
              "arckit/interaction/automation-workspace/interaction.md",
              "arckit/interaction/automation-workspace/default.html",
              "arckit/tech/arcorbit/realtime-synchronization-solution.md",
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
              "Verification: local macOS x64 installer build and arckit-distribution-smoke/v1 passed, build 20260822083310"
            ]
          },
          {
            "id": "IMPACT-003-3",
            "fact_id": "FACT-003",
            "fact_revision": 1,
            "target": {
              "kind": "software_decision",
              "ref": "data_and_state",
              "revision": 13
            },
            "effect": "upheld",
            "reason": "The implemented compatibility boundary realizes the updated data_and_state decision.",
            "gap_ids": [],
            "evidence": [
              "arckit/spec/agentic-software-development/runtime-automation-workspace.md",
              "arckit/interaction/automation-workspace/interaction.md",
              "arckit/interaction/automation-workspace/default.html",
              "arckit/tech/arcorbit/realtime-synchronization-solution.md",
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
              "Verification: local macOS x64 installer build and arckit-distribution-smoke/v1 passed, build 20260822083310"
            ]
          },
          {
            "id": "IMPACT-003-4",
            "fact_id": "FACT-003",
            "fact_revision": 1,
            "target": {
              "kind": "software_decision",
              "ref": "external_integrations",
              "revision": 6
            },
            "effect": "upheld",
            "reason": "The implemented compatibility boundary realizes the updated external_integrations decision.",
            "gap_ids": [],
            "evidence": [
              "arckit/spec/agentic-software-development/runtime-automation-workspace.md",
              "arckit/interaction/automation-workspace/interaction.md",
              "arckit/interaction/automation-workspace/default.html",
              "arckit/tech/arcorbit/realtime-synchronization-solution.md",
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
              "Verification: local macOS x64 installer build and arckit-distribution-smoke/v1 passed, build 20260822083310"
            ]
          },
          {
            "id": "IMPACT-003-5",
            "fact_id": "FACT-003",
            "fact_revision": 1,
            "target": {
              "kind": "software_decision",
              "ref": "technical_foundation",
              "revision": 26
            },
            "effect": "upheld",
            "reason": "The implemented compatibility boundary realizes the updated technical_foundation decision.",
            "gap_ids": [],
            "evidence": [
              "arckit/spec/agentic-software-development/runtime-automation-workspace.md",
              "arckit/interaction/automation-workspace/interaction.md",
              "arckit/interaction/automation-workspace/default.html",
              "arckit/tech/arcorbit/realtime-synchronization-solution.md",
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
              "Verification: local macOS x64 installer build and arckit-distribution-smoke/v1 passed, build 20260822083310"
            ]
          },
          {
            "id": "IMPACT-003-6",
            "fact_id": "FACT-003",
            "fact_revision": 1,
            "target": {
              "kind": "software_decision",
              "ref": "quality_and_validation",
              "revision": 4
            },
            "effect": "upheld",
            "reason": "The implemented compatibility boundary realizes the updated quality_and_validation decision.",
            "gap_ids": [],
            "evidence": [
              "arckit/spec/agentic-software-development/runtime-automation-workspace.md",
              "arckit/interaction/automation-workspace/interaction.md",
              "arckit/interaction/automation-workspace/default.html",
              "arckit/tech/arcorbit/realtime-synchronization-solution.md",
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
              "Verification: local macOS x64 installer build and arckit-distribution-smoke/v1 passed, build 20260822083310"
            ]
          },
          {
            "id": "IMPACT-003-7",
            "fact_id": "FACT-003",
            "fact_revision": 1,
            "target": {
              "kind": "software_decision",
              "ref": "observability_and_operation",
              "revision": 7
            },
            "effect": "upheld",
            "reason": "The implemented compatibility boundary realizes the updated observability_and_operation decision.",
            "gap_ids": [],
            "evidence": [
              "arckit/spec/agentic-software-development/runtime-automation-workspace.md",
              "arckit/interaction/automation-workspace/interaction.md",
              "arckit/interaction/automation-workspace/default.html",
              "arckit/tech/arcorbit/realtime-synchronization-solution.md",
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
              "Verification: local macOS x64 installer build and arckit-distribution-smoke/v1 passed, build 20260822083310"
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
        "software_definition_changes": [
          {
            "area_ref": "product_capabilities",
            "observed_revision": 16,
            "set_decision": {
              "status": "settled",
              "statement": "ArcOrbit preserves Setup Readiness, supervised one-thread-per-todo automation, trusted ledger transitions, intervention/recovery and acceptance feedback while providing Desktop composition of Workshop organizations, organization and project membership, personal and organization projects, seven-state todos, ordinary user feedback, local Product Workspaces and a persistent multi-product Workset. Workset Feedback remains the developer processing workspace and ArcOrbit retains its independent Product 107 feedback center. ArcOrbit also presents planning-only Chat, Idea, Release, Operations and Engineering workspaces. Engineering demonstrates management of versioned Domain Profiles: a profile combines Project/Case domain State definitions, expected/actual/diagnosis capability mappings and lifecycle-stage interpretations; users can browse templates, create or duplicate drafts, edit mappings, compare changes and review an apply plan so different teams or industries can reuse the same Loop Kernel and product lifecycle. Entry skills remain part of the shared Loop Kernel and are excluded from profiles. No new backend, persistence, skill installation, profile application, Runtime, monitoring, market-platform or registry integration is claimed. Automation discovers Workshop task changes through project WebSocket notifications and confirms them through REST. Modern services use event IDs, cursor replay and cursor-expiry recovery; legacy services use no-ID notifications while online and refresh current state on every reconnect without reading, writing or replaying a cursor. ArcOrbit performs startup, system-resume and network-recovery synchronization, a 15-minute global reconciliation and user-triggered immediate synchronization, but no minute-level fallback polling. Every task is re-read before conditional claim, and no transport or synchronization activity is approval to leave awaiting_human.",
              "reason": "The accepted compatibility strategy is now implemented without weakening modern replay or the human Gate.",
              "evidence": [
                "Current operator input, 2026-08-20",
                "arckit/spec/agentic-software-development/arcorbit-planned-workspaces.md",
                "Current operator input, 2026-08-22",
                "arckit/spec/agentic-software-development/runtime-automation-workspace.md",
                "arckit/interaction/automation-workspace/interaction.md",
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
                "Verification: local macOS x64 installer build and arckit-distribution-smoke/v1 passed, build 20260822083310"
              ],
              "confidence": "high",
              "resume_condition": "Revisit when the Workshop realtime contract, synchronization cadence, source-of-truth boundary, or human Gate semantics change."
            },
            "gap_refs": [],
            "reason": "The accepted compatibility strategy is now implemented without weakening modern replay or the human Gate.",
            "evidence": [
              "arckit/spec/agentic-software-development/runtime-automation-workspace.md",
              "arckit/interaction/automation-workspace/interaction.md",
              "arckit/interaction/automation-workspace/default.html",
              "arckit/tech/arcorbit/realtime-synchronization-solution.md",
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
              "Verification: local macOS x64 installer build and arckit-distribution-smoke/v1 passed, build 20260822083310"
            ]
          },
          {
            "area_ref": "experience_and_interaction",
            "observed_revision": 27,
            "set_decision": {
              "status": "settled",
              "statement": "ArcOrbit uses three primary navigation groups: Personal contains Today and Chat; Product Lifecycle contains Idea, Work, Automation, Release, Operations and Feedback; Organization contains Organization and Engineering. English UI consistently uses Release and Operations, while Chinese descriptions use 发布 and 运营. Existing Workset, Work, Automation, Feedback, Organization, account, product-feedback and execution semantics remain authoritative. The five new pages are independent planning presentations built from current project facts. Engineering is a Domain Profile management preview with a Profile Library, draft metadata, State Model editor, Capability Mapping, Lifecycle Mapping, cross-industry change preview and Review & Apply confirmation. Profile changes replace domain State semantics and skills together while the shared Loop Kernel and Idea-to-Feedback lifecycle remain stable; all controls are non-persistent demonstrations. Setup Readiness separates global resource readiness from per-Product Workspace project readiness: binding or task start opens a project-scoped plan, all Codex-discoverable bundled skills and loaders target that project, legacy managed user targets receive visible backup/migration dispositions, and no user-level Codex target is offered. Automation shows realtime, reconnecting, degraded and legacy-compatible states plus a visible immediate-sync action. Modern reconnect performs cursor recovery before current-state refresh; legacy reconnect directly refreshes current state and never presents a stale cursor as continuity. Connection errors retain the last snapshot and do not start minute polling, while an awaiting-human item remains paused until the user explicitly resumes it.",
              "reason": "The Desktop now exposes compatibility and immediate recovery without promising minute-level background polling.",
              "evidence": [
                "Current operator input, 2026-08-21",
                "arckit/interaction/setup-readiness/interaction.md",
                "arckit/interaction/setup-readiness/default.html",
                "Current operator input, 2026-08-22",
                "arckit/spec/agentic-software-development/runtime-automation-workspace.md",
                "arckit/interaction/automation-workspace/interaction.md",
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
                "Verification: local macOS x64 installer build and arckit-distribution-smoke/v1 passed, build 20260822083310"
              ],
              "confidence": "high",
              "resume_condition": "Revisit when the Workshop realtime contract, synchronization cadence, source-of-truth boundary, or human Gate semantics change."
            },
            "gap_refs": [],
            "reason": "The Desktop now exposes compatibility and immediate recovery without promising minute-level background polling.",
            "evidence": [
              "arckit/spec/agentic-software-development/runtime-automation-workspace.md",
              "arckit/interaction/automation-workspace/interaction.md",
              "arckit/interaction/automation-workspace/default.html",
              "arckit/tech/arcorbit/realtime-synchronization-solution.md",
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
              "Verification: local macOS x64 installer build and arckit-distribution-smoke/v1 passed, build 20260822083310"
            ]
          },
          {
            "area_ref": "data_and_state",
            "observed_revision": 12,
            "set_decision": {
              "status": "settled",
              "statement": "Canonical development state remains in Project/Iteration/Case ledgers and Workshop remains source of truth for account, organization, project, membership, task, attachment, and ordinary-feedback records. ArcOrbit owns Product Workspace bindings from a Workshop Project to a local repository, persistent multi-product workset preferences, Runtime execution/session/thread state, intervention/recovery state, and first-class acceptance-feedback records outside the target repository. 产品反馈 Project ID 107 和项目专用 API Key 都是 ArcOrbit 产品代码常量并进入打包产物，不写入 userData；未读数量是运行期瞬时 UI 状态，反馈正文、消息和状态仍由 Feedback 平台拥有。ArcOrbit also owns the locked bundled-skill source store and consumer identity; ArcForge relation state records one effective project target set per normalized local project root, while the user catalog remains a non-Codex-discovery control-plane store rather than an Agent installation target. Workshop owns durable project event rows and global cursors in PostgreSQL; delivery is an invalidation channel while REST remains canonical. ArcOrbit owns per-project connection mode and health, and owns consumed cursors only for resumable modern subscriptions. Legacy subscriptions neither read nor write cursors and re-establish truth through current-state REST refresh.",
              "reason": "Cursor ownership must distinguish modern resumable subscriptions from legacy no-ID notification subscriptions.",
              "evidence": [
                "arckit/spec/arcorbit-distribution.md",
                "arckit/tech/arcorbit/installer-supply-chain.md",
                "Current operator input, 2026-08-22",
                "arckit/spec/agentic-software-development/runtime-automation-workspace.md",
                "arckit/interaction/automation-workspace/interaction.md",
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
                "Verification: local macOS x64 installer build and arckit-distribution-smoke/v1 passed, build 20260822083310"
              ],
              "confidence": "high",
              "resume_condition": "Revisit when the Workshop realtime contract, synchronization cadence, source-of-truth boundary, or human Gate semantics change."
            },
            "gap_refs": [],
            "reason": "Cursor ownership must distinguish modern resumable subscriptions from legacy no-ID notification subscriptions.",
            "evidence": [
              "arckit/spec/agentic-software-development/runtime-automation-workspace.md",
              "arckit/interaction/automation-workspace/interaction.md",
              "arckit/interaction/automation-workspace/default.html",
              "arckit/tech/arcorbit/realtime-synchronization-solution.md",
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
              "Verification: local macOS x64 installer build and arckit-distribution-smoke/v1 passed, build 20260822083310"
            ]
          },
          {
            "area_ref": "external_integrations",
            "observed_revision": 5,
            "set_decision": {
              "status": "settled",
              "statement": "ArcOrbit integrates with Codex app-server/CLI and Workshop through explicit main-process adapters; trusted ledger entrypoints remain repository-owned. Workshop authentication preserves server-rotated credentials and the rolling seven-day inactivity contract. The Automation adapter remains executor-scoped, while the separate Platform Adapter reads organization, project, membership, full project task and Feedback V1 domains. Feedback V2 remains disabled until a separately trusted adapter proves capability; missing conditional update, member authorization and task-history service contracts are surfaced as weak consistency or unavailable actions rather than invented behavior. ArcOrbit 自身产品反馈独立使用 Feedback SDK WebView V2 的 API Key 直连契约；它不启用 Platform Feedback V2 管理 adapter，也不推断未确认的宿主 Session endpoint。 The Workshop integration accepts both the versioned project WebSocket plus authorized cursor replay API and the previous no-ID WebSocket notification contract. Modern connections catch up and deduplicate by event ID and handle cursor expiry by full refresh; legacy connections treat notifications as invalidations and refresh current state on connect. ArcOrbit uses 15-minute reconciliation and explicit immediate sync instead of disconnected minute polling.",
              "reason": "The client-first rollout requires one bounded adapter contract for both deployed Workshop generations.",
              "evidence": [
                "User request received 2026-08-19",
                "arckit/spec/agentic-software-development/arcorbit-platform-capabilities.md",
                "arckit/interaction/product-feedback-center/interaction.md",
                "arckit/tech/arcorbit/product-feedback-integration.md",
                "Current operator input, 2026-08-22",
                "arckit/spec/agentic-software-development/runtime-automation-workspace.md",
                "arckit/interaction/automation-workspace/interaction.md",
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
                "Verification: local macOS x64 installer build and arckit-distribution-smoke/v1 passed, build 20260822083310"
              ],
              "confidence": "high",
              "resume_condition": "Revisit when the Workshop realtime contract, synchronization cadence, source-of-truth boundary, or human Gate semantics change."
            },
            "gap_refs": [],
            "reason": "The client-first rollout requires one bounded adapter contract for both deployed Workshop generations.",
            "evidence": [
              "arckit/spec/agentic-software-development/runtime-automation-workspace.md",
              "arckit/interaction/automation-workspace/interaction.md",
              "arckit/interaction/automation-workspace/default.html",
              "arckit/tech/arcorbit/realtime-synchronization-solution.md",
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
              "Verification: local macOS x64 installer build and arckit-distribution-smoke/v1 passed, build 20260822083310"
            ]
          },
          {
            "area_ref": "technical_foundation",
            "observed_revision": 25,
            "set_decision": {
              "status": "settled",
              "statement": "Arckit uses repository-owned Markdown/JSON state and Node.js ESM ledger CLIs; ArcOrbit is its Electron Desktop/Runtime host. The policy-neutral Runtime Kernel, persistent one-thread-per-todo model and trusted capabilities remain unchanged. Platform composition uses Desktop Store v11, a main-process Platform Coordinator, restricted Workshop Platform Adapter and typed preload IPC. ArcOrbit consumes Workshop through explicit service contracts and may evolve the backend when an accepted integration contract requires it: organization-scoped request context supplies known project organization identity, current-member is_external marks external participation, remote Workshop records remain authoritative, and Renderer receives neither credentials nor generic request access. Packaged ArcOrbit no longer reinterprets its Electron executable as Node: Electron main launches the Runtime with utilityProcess, typed parent-port controls preserve steer/interrupt semantics, trusted ledger orchestration calls manifest-resolved module APIs in process, standalone Codex remains an external executable, and packaging disables the RunAsNode/Node-options/CLI-inspect fuses while enforcing ASAR integrity. The current BrowserWindow Renderer loads from a file:// entry inside app.asar, so its File Protocol privilege fuse remains enabled and is verified independently from the disabled Node-mode fuses. 产品反馈由 Electron main process 管理受限子 BrowserWindow 与独立 SDK WebContents；主 file:// Renderer 不直接嵌入生产跨域 iframe，也不获得 SDK 凭据或通用远端访问。产品反馈 SDK 文档身份由固定 HTTPS origin、/sdk-v2 路径空间和 embed=web 共同确定；已配置文档在 submit/status 路由和未读刷新期间不执行 loadURL 或重复 configure，配置/身份变化、无效文档与显式 retry 才重新加载固定入口。Skill provisioning separates a global bundle/provider/Codex check from per-Product Workspace readiness. The main-process manager passes non-empty projectTargetDirs, project assessments and an ArcOrbit project-only availability override to the embedded provider; bundled skills, shared assets and the on-demand loader target only the normalized project root, while the ArcForge catalog and relation state remain control-plane data. Legacy managed user targets migrate transactionally with ownership evidence, explicit dispositions and rollback; Runtime preflight remains policy-neutral and only consumes the resulting per-project readiness. Workshop persists modern project events in PostgreSQL in the same transaction as domain mutations, serializes event IDs through commit, and uses LISTEN/NOTIFY only for post-commit cross-instance wakeup; each instance catches up by cursor and isolates slow consumers. Website and modern ArcOrbit subscriptions recover by project cursor and invalidate REST-backed state. ArcOrbit's main-process Realtime Adapter explicitly negotiates resumable or legacy mode; legacy mode refreshes on connect and accepts no-ID invalidations without cursor access. Synchronization remains separate from execution arbitration, has no degraded minute-polling timer, and cannot resume a human gate.",
              "reason": "The main-process adapter now negotiates protocol mode and removes the obsolete degraded polling timer.",
              "evidence": [
                "arckit/tech/arcorbit/realtime-synchronization-solution.md",
                "arckit/tech/arcorbit/platform-composition-solution.md",
                "runtime/arcorbit/src/desktop/desktop-store.mjs",
                "runtime/arcorbit/src/workshop-realtime-adapter.mjs",
                "/Users/Glare/Library/Developer/ModularProgram/hoewo/workshop-todo/realtime/store.go",
                "Current operator input, 2026-08-22",
                "arckit/spec/agentic-software-development/runtime-automation-workspace.md",
                "arckit/interaction/automation-workspace/interaction.md",
                "arckit/interaction/automation-workspace/default.html",
                "runtime/arcorbit/desktop/main.mjs",
                "runtime/arcorbit/desktop/renderer/index.html",
                "runtime/arcorbit/desktop/renderer/renderer.js",
                "runtime/arcorbit/src/automation-coordinator.mjs",
                "runtime/arcorbit/test/workshop-realtime-adapter.test.mjs",
                "runtime/arcorbit/test/automation-coordinator.test.mjs",
                "runtime/arcorbit/test/desktop-renderer.test.mjs",
                "Verification: npm run check — 250 tests, 248 passed, 2 environment-gated skips, 0 failed, 2026-08-22",
                "Verification: local macOS x64 installer build and arckit-distribution-smoke/v1 passed, build 20260822083310"
              ],
              "confidence": "high",
              "resume_condition": "Revisit when the Workshop realtime contract, synchronization cadence, source-of-truth boundary, or human Gate semantics change."
            },
            "gap_refs": [],
            "reason": "The main-process adapter now negotiates protocol mode and removes the obsolete degraded polling timer.",
            "evidence": [
              "arckit/spec/agentic-software-development/runtime-automation-workspace.md",
              "arckit/interaction/automation-workspace/interaction.md",
              "arckit/interaction/automation-workspace/default.html",
              "arckit/tech/arcorbit/realtime-synchronization-solution.md",
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
              "Verification: local macOS x64 installer build and arckit-distribution-smoke/v1 passed, build 20260822083310"
            ]
          },
          {
            "area_ref": "quality_and_validation",
            "observed_revision": 3,
            "set_decision": {
              "status": "settled",
              "statement": "Protocol changes require schema/script validation, cross-record audits, Runtime automated tests, projection checks, direct-Codex no-Case recovery evidence, stale-token checks, read/write/read ordering checks, and risk-proportionate real execution evidence. Reliable synchronization requires transaction/event atomicity, ordering/replay, cross-instance wakeup, authorization revocation, slow-consumer, reconnect/deduplication, cursor-expiry, targeted refresh, legacy no-ID notification and reconnect-current-state tests, proof that no minute fallback timer exists, pre-claim remote confirmation, awaiting_human regressions and a real-link smoke check when available.",
              "reason": "The risk boundary changed from polling recovery to lifecycle recovery, explicit synchronization and legacy protocol regression coverage.",
              "evidence": [
                "runtime/arckit-runtime/test/protocol-compatibility.test.mjs",
                "runtime/arckit-runtime/test/state-condition-case.test.mjs",
                "runtime/arckit-runtime/test/state-driven-runner.test.mjs",
                "runtime/arckit-runtime/test/parallel-case.test.mjs",
                "npm --prefix runtime/arckit-runtime run check: 113 tests, 112 passed, 1 environment-gated skip",
                "Current operator input, 2026-08-22",
                "arckit/spec/agentic-software-development/runtime-automation-workspace.md",
                "arckit/interaction/automation-workspace/interaction.md",
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
                "Verification: local macOS x64 installer build and arckit-distribution-smoke/v1 passed, build 20260822083310"
              ],
              "confidence": "high",
              "resume_condition": "Revisit when the Workshop realtime contract, synchronization cadence, source-of-truth boundary, or human Gate semantics change."
            },
            "gap_refs": [
              "GAP-agent-scenario-evaluation",
              "GAP-cross-record-audit"
            ],
            "reason": "The risk boundary changed from polling recovery to lifecycle recovery, explicit synchronization and legacy protocol regression coverage.",
            "evidence": [
              "arckit/spec/agentic-software-development/runtime-automation-workspace.md",
              "arckit/interaction/automation-workspace/interaction.md",
              "arckit/interaction/automation-workspace/default.html",
              "arckit/tech/arcorbit/realtime-synchronization-solution.md",
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
              "Verification: local macOS x64 installer build and arckit-distribution-smoke/v1 passed, build 20260822083310"
            ]
          },
          {
            "area_ref": "observability_and_operation",
            "observed_revision": 6,
            "set_decision": {
              "status": "settled",
              "statement": "Runtime persists lifecycle, activity, messages and timing outside the target project, supports restart reconciliation and exposes opaque Run refs. It separately projects ledger candidate catalogs, Agent selection traces, accepted round closeouts and post-commit fresh-read receipts, and also presents ordinary todo state separately from acceptance-feedback queue counts, item status, current Run/Case, progress, evidence and blocking responsibility alongside one active execution. Automation exposes per-project realtime health, resumable/legacy mode, modern cursor progress and latest refresh time; it reports reconnecting, degraded, compatible and recovered transitions. It uses 15-minute reconciliation, lifecycle-triggered current-state recovery and a visible immediate-sync action, has no 60-second disconnected fallback, and records that synchronization never releases a human gate.",
              "reason": "Operational state now exposes protocol mode and manual recovery while accurately reporting the absence of a 60-second fallback.",
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
                "Verification: local macOS x64 installer build and arckit-distribution-smoke/v1 passed, build 20260822083310"
              ],
              "confidence": "high",
              "resume_condition": "Revisit when the Workshop realtime contract, synchronization cadence, source-of-truth boundary, or human Gate semantics change."
            },
            "gap_refs": [
              "GAP-runtime-resilience-and-adapters"
            ],
            "reason": "Operational state now exposes protocol mode and manual recovery while accurately reporting the absence of a 60-second fallback.",
            "evidence": [
              "arckit/spec/agentic-software-development/runtime-automation-workspace.md",
              "arckit/interaction/automation-workspace/interaction.md",
              "arckit/interaction/automation-workspace/default.html",
              "arckit/tech/arcorbit/realtime-synchronization-solution.md",
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
              "Verification: local macOS x64 installer build and arckit-distribution-smoke/v1 passed, build 20260822083310"
            ]
          }
        ],
        "software_invariant_changes": [],
        "project_gap_changes": [],
        "selection_context_change": null,
        "evidence": [
          "arckit/spec/agentic-software-development/runtime-automation-workspace.md",
          "arckit/interaction/automation-workspace/interaction.md",
          "arckit/interaction/automation-workspace/default.html",
          "arckit/tech/arcorbit/realtime-synchronization-solution.md",
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
          "Verification: local macOS x64 installer build and arckit-distribution-smoke/v1 passed, build 20260822083310"
        ]
      },
      "invariant_assessment": {
        "project_revision": 161,
        "judgments": [
          {
            "invariant_ref": "product-expectations-remain-recoverable",
            "disposition": "upheld",
            "reason": "The final modern/legacy synchronization behavior and acceptance boundary are explicit in canonical product specification.",
            "fact_refs": [
              "FACT-001",
              "FACT-003"
            ],
            "evidence": [
              "arckit/spec/agentic-software-development/runtime-automation-workspace.md",
              "arckit/interaction/automation-workspace/interaction.md",
              "arckit/interaction/automation-workspace/default.html",
              "arckit/tech/arcorbit/realtime-synchronization-solution.md"
            ],
            "gap_refs": []
          },
          {
            "invariant_ref": "interaction-expectations-remain-recoverable",
            "disposition": "upheld",
            "reason": "Connection modes, immediate sync, error recovery and persistent human waiting are represented in interaction rules and wireframes.",
            "fact_refs": [
              "FACT-001",
              "FACT-003"
            ],
            "evidence": [
              "arckit/interaction/automation-workspace/interaction.md",
              "arckit/interaction/automation-workspace/default.html",
              "runtime/arcorbit/desktop/renderer/index.html",
              "runtime/arcorbit/desktop/renderer/renderer.js"
            ],
            "gap_refs": []
          },
          {
            "invariant_ref": "visual-language-remains-consistent",
            "disposition": "not_relevant",
            "reason": "The selected Gap adds an existing secondary-button action and status copy without changing durable visual-language rules.",
            "fact_refs": [
              "FACT-003"
            ],
            "evidence": [],
            "gap_refs": []
          },
          {
            "invariant_ref": "technical-decisions-remain-explainable",
            "disposition": "upheld",
            "reason": "Protocol negotiation, cursor ownership, lifecycle synchronization and arbitration boundaries are explicit and traceable to main-process code.",
            "fact_refs": [
              "FACT-001",
              "FACT-002",
              "FACT-003"
            ],
            "evidence": [
              "arckit/tech/arcorbit/realtime-synchronization-solution.md",
              "runtime/arcorbit/src/workshop-realtime-adapter.mjs",
              "runtime/arcorbit/desktop/main.mjs"
            ],
            "gap_refs": []
          },
          {
            "invariant_ref": "accepted-facts-are-realized",
            "disposition": "upheld",
            "reason": "The implementation realizes the accepted no-ID compatibility, no 60-second polling, immediate sync, pre-claim confirmation and awaiting_human constraints.",
            "fact_refs": [
              "FACT-001",
              "FACT-002",
              "FACT-003"
            ],
            "evidence": [
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
              "Verification: local macOS x64 installer build and arckit-distribution-smoke/v1 passed, build 20260822083310"
            ],
            "gap_refs": []
          },
          {
            "invariant_ref": "material-risks-have-credible-evidence",
            "disposition": "upheld",
            "reason": "Modern replay, legacy reconnect/no-cursor behavior, human Gate preservation, static timer constraints, full checks and a packaged distribution smoke are repeatable evidence for the material rollout risks.",
            "fact_refs": [
              "FACT-001",
              "FACT-002",
              "FACT-003"
            ],
            "evidence": [
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
              "Verification: local macOS x64 installer build and arckit-distribution-smoke/v1 passed, build 20260822083310"
            ],
            "gap_refs": []
          }
        ]
      },
      "evidence": [
        "arckit/spec/agentic-software-development/runtime-automation-workspace.md",
        "arckit/interaction/automation-workspace/interaction.md",
        "arckit/interaction/automation-workspace/default.html",
        "arckit/tech/arcorbit/realtime-synchronization-solution.md",
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
        "Verification: local macOS x64 installer build and arckit-distribution-smoke/v1 passed, build 20260822083310"
      ],
      "runtime_result_ref": "",
      "occurred_at": "2026-08-22T08:39:49.085Z"
    },
    {
      "round": 2,
      "transition_schema_version": "arckit-case-transition/v8",
      "goal": "Review the completed implementation for correctness, real problem resolution, verification credibility, regression risk, and minimality.",
      "outcome": "completed",
      "gap_selection": {
        "mode": "candidate",
        "basis": "The active Case has no open implementation Gap; its fresh content revision must pass completion review before closure.",
        "snapshot_token": "1f36b6a86a2a573ca37b0afade5537134e7663af04757e7efbb27271b119cf2b",
        "selected_ref": "case-gap:CASE-20260822-001:CASE-20260822-001:completion-review:1",
        "comparison_summary": "Compared the ready Case completion review with all unbound project obligations; only the review can close the current Case and none of the other obligations is part of this rollout outcome.",
        "fresh_discovery_summary": "Independent code, documentation, test and packaged-build review found no error, omission or excess requiring a repair Gap.",
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
            "reason": "This unbound project obligation requires a separate Case and is outside the current implementation review."
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
            "reason": "This unbound project obligation requires a separate Case and is outside the current implementation review."
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
            "reason": "This unbound project obligation requires a separate Case and is outside the current implementation review."
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
            "reason": "This unbound project obligation requires a separate Case and is outside the current implementation review."
          },
          {
            "ref": "case-gap:CASE-20260822-001:CASE-20260822-001:completion-review:1",
            "source": "persisted",
            "eligibility": "ready",
            "disposition": "selected",
            "priority_basis": {
              "blocking": "high",
              "uncertainty": "low",
              "risk": "high",
              "user_impact": "high"
            },
            "reason": "The current content revision is implementation-complete and requires its independent five-dimension review before Case resolution."
          }
        ]
      },
      "selected_gap": {
        "id": "CASE-20260822-001:completion-review:1",
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
        "goal": "Review the completed implementation for correctness, real problem resolution, verification credibility, regression risk, and minimality.",
        "expected_state_change": "Record a clean five-dimension review of content revision 1 and resolve the Case without mutating implementation facts."
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
            "runtime/arcorbit/src/workshop-realtime-adapter.mjs",
            "runtime/arcorbit/desktop/main.mjs",
            "runtime/arcorbit/desktop/renderer/index.html",
            "runtime/arcorbit/desktop/renderer/renderer.js",
            "runtime/arcorbit/src/automation-coordinator.mjs",
            "runtime/arcorbit/src/desktop/desktop-store.mjs",
            "runtime/arcorbit/test/workshop-realtime-adapter.test.mjs",
            "runtime/arcorbit/test/automation-coordinator.test.mjs",
            "runtime/arcorbit/test/desktop-renderer.test.mjs",
            "arckit/spec/agentic-software-development/runtime-automation-workspace.md",
            "arckit/interaction/automation-workspace/interaction.md",
            "arckit/interaction/automation-workspace/default.html",
            "arckit/tech/arcorbit/realtime-synchronization-solution.md",
            "Verification: npm run check — syntax checks plus 250 tests, 248 passed, 2 environment-gated skips, 0 failed, 2026-08-22",
            "Verification: legacy handshake, id-less notification and legacy reconnect test passes without cursor read/write",
            "Verification: static Desktop test proves 15-minute reconciliation, visible immediate sync and absence of fallbackSyncTimer",
            "Verification: awaiting_human preservation tests pass for periodic and realtime refresh",
            "Verification: pre-claim stale-candidate refresh test passes",
            "Verification: local macOS x64 installer build and arckit-distribution-smoke/v1 passed, build 20260822083310",
            "Verification: Project/Case audit and validation plus 16 ledger governance tests passed after Round 1",
            "Verification: git diff --check passed"
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
        "project_revision": 162,
        "judgments": [
          {
            "invariant_ref": "product-expectations-remain-recoverable",
            "disposition": "upheld",
            "reason": "Review confirms canonical product expectations match the implemented modern and legacy synchronization behavior.",
            "fact_refs": [
              "FACT-001",
              "FACT-003"
            ],
            "evidence": [
              "arckit/spec/agentic-software-development/runtime-automation-workspace.md",
              "runtime/arcorbit/src/workshop-realtime-adapter.mjs",
              "runtime/arcorbit/desktop/main.mjs"
            ],
            "gap_refs": []
          },
          {
            "invariant_ref": "interaction-expectations-remain-recoverable",
            "disposition": "upheld",
            "reason": "Review confirms visible compatibility, immediate-sync, error and human-waiting states are coherent with Renderer behavior.",
            "fact_refs": [
              "FACT-001",
              "FACT-003"
            ],
            "evidence": [
              "arckit/interaction/automation-workspace/interaction.md",
              "arckit/interaction/automation-workspace/default.html",
              "runtime/arcorbit/desktop/renderer/index.html",
              "runtime/arcorbit/desktop/renderer/renderer.js"
            ],
            "gap_refs": []
          },
          {
            "invariant_ref": "visual-language-remains-consistent",
            "disposition": "not_relevant",
            "reason": "Review found no durable visual-language change; the new action reuses the established secondary-button pattern.",
            "fact_refs": [
              "FACT-003"
            ],
            "evidence": [],
            "gap_refs": []
          },
          {
            "invariant_ref": "technical-decisions-remain-explainable",
            "disposition": "upheld",
            "reason": "Review traced negotiation, legacy invalidation, modern cursor replay, timer cadence and arbitration boundaries from technical decision to code.",
            "fact_refs": [
              "FACT-001",
              "FACT-002",
              "FACT-003"
            ],
            "evidence": [
              "arckit/tech/arcorbit/realtime-synchronization-solution.md",
              "runtime/arcorbit/src/workshop-realtime-adapter.mjs",
              "runtime/arcorbit/desktop/main.mjs",
              "runtime/arcorbit/src/automation-coordinator.mjs"
            ],
            "gap_refs": []
          },
          {
            "invariant_ref": "accepted-facts-are-realized",
            "disposition": "upheld",
            "reason": "Review found every accepted rollout constraint realized without a contradictory code path.",
            "fact_refs": [
              "FACT-001",
              "FACT-002",
              "FACT-003"
            ],
            "evidence": [
              "runtime/arcorbit/src/workshop-realtime-adapter.mjs",
              "runtime/arcorbit/desktop/main.mjs",
              "runtime/arcorbit/desktop/renderer/index.html",
              "runtime/arcorbit/desktop/renderer/renderer.js",
              "runtime/arcorbit/src/automation-coordinator.mjs",
              "runtime/arcorbit/src/desktop/desktop-store.mjs",
              "runtime/arcorbit/test/workshop-realtime-adapter.test.mjs",
              "runtime/arcorbit/test/automation-coordinator.test.mjs",
              "runtime/arcorbit/test/desktop-renderer.test.mjs",
              "arckit/spec/agentic-software-development/runtime-automation-workspace.md",
              "arckit/interaction/automation-workspace/interaction.md",
              "arckit/interaction/automation-workspace/default.html",
              "arckit/tech/arcorbit/realtime-synchronization-solution.md",
              "Verification: npm run check — syntax checks plus 250 tests, 248 passed, 2 environment-gated skips, 0 failed, 2026-08-22",
              "Verification: legacy handshake, id-less notification and legacy reconnect test passes without cursor read/write",
              "Verification: static Desktop test proves 15-minute reconciliation, visible immediate sync and absence of fallbackSyncTimer",
              "Verification: awaiting_human preservation tests pass for periodic and realtime refresh",
              "Verification: pre-claim stale-candidate refresh test passes",
              "Verification: local macOS x64 installer build and arckit-distribution-smoke/v1 passed, build 20260822083310",
              "Verification: Project/Case audit and validation plus 16 ledger governance tests passed after Round 1",
              "Verification: git diff --check passed"
            ],
            "gap_refs": []
          },
          {
            "invariant_ref": "material-risks-have-credible-evidence",
            "disposition": "upheld",
            "reason": "Review found repeatable coverage for legacy compatibility, modern replay, stale claims, human gates, cadence constraints and packaged execution.",
            "fact_refs": [
              "FACT-001",
              "FACT-002",
              "FACT-003"
            ],
            "evidence": [
              "runtime/arcorbit/src/workshop-realtime-adapter.mjs",
              "runtime/arcorbit/desktop/main.mjs",
              "runtime/arcorbit/desktop/renderer/index.html",
              "runtime/arcorbit/desktop/renderer/renderer.js",
              "runtime/arcorbit/src/automation-coordinator.mjs",
              "runtime/arcorbit/src/desktop/desktop-store.mjs",
              "runtime/arcorbit/test/workshop-realtime-adapter.test.mjs",
              "runtime/arcorbit/test/automation-coordinator.test.mjs",
              "runtime/arcorbit/test/desktop-renderer.test.mjs",
              "arckit/spec/agentic-software-development/runtime-automation-workspace.md",
              "arckit/interaction/automation-workspace/interaction.md",
              "arckit/interaction/automation-workspace/default.html",
              "arckit/tech/arcorbit/realtime-synchronization-solution.md",
              "Verification: npm run check — syntax checks plus 250 tests, 248 passed, 2 environment-gated skips, 0 failed, 2026-08-22",
              "Verification: legacy handshake, id-less notification and legacy reconnect test passes without cursor read/write",
              "Verification: static Desktop test proves 15-minute reconciliation, visible immediate sync and absence of fallbackSyncTimer",
              "Verification: awaiting_human preservation tests pass for periodic and realtime refresh",
              "Verification: pre-claim stale-candidate refresh test passes",
              "Verification: local macOS x64 installer build and arckit-distribution-smoke/v1 passed, build 20260822083310",
              "Verification: Project/Case audit and validation plus 16 ledger governance tests passed after Round 1",
              "Verification: git diff --check passed"
            ],
            "gap_refs": []
          }
        ]
      },
      "evidence": [
        "runtime/arcorbit/src/workshop-realtime-adapter.mjs",
        "runtime/arcorbit/desktop/main.mjs",
        "runtime/arcorbit/desktop/renderer/index.html",
        "runtime/arcorbit/desktop/renderer/renderer.js",
        "runtime/arcorbit/src/automation-coordinator.mjs",
        "runtime/arcorbit/src/desktop/desktop-store.mjs",
        "runtime/arcorbit/test/workshop-realtime-adapter.test.mjs",
        "runtime/arcorbit/test/automation-coordinator.test.mjs",
        "runtime/arcorbit/test/desktop-renderer.test.mjs",
        "arckit/spec/agentic-software-development/runtime-automation-workspace.md",
        "arckit/interaction/automation-workspace/interaction.md",
        "arckit/interaction/automation-workspace/default.html",
        "arckit/tech/arcorbit/realtime-synchronization-solution.md",
        "Verification: npm run check — syntax checks plus 250 tests, 248 passed, 2 environment-gated skips, 0 failed, 2026-08-22",
        "Verification: legacy handshake, id-less notification and legacy reconnect test passes without cursor read/write",
        "Verification: static Desktop test proves 15-minute reconciliation, visible immediate sync and absence of fallbackSyncTimer",
        "Verification: awaiting_human preservation tests pass for periodic and realtime refresh",
        "Verification: pre-claim stale-candidate refresh test passes",
        "Verification: local macOS x64 installer build and arckit-distribution-smoke/v1 passed, build 20260822083310",
        "Verification: Project/Case audit and validation plus 16 ledger governance tests passed after Round 1",
        "Verification: git diff --check passed"
      ],
      "runtime_result_ref": "",
      "occurred_at": "2026-08-22T08:41:26.667Z"
    }
  ],
  "case_resolution": {
    "status": "resolved",
    "stage": "resolved",
    "satisfied": [
      "GAP-legacy-realtime-compatibility"
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
    "updated_at": "2026-08-22T08:41:26.667Z"
  }
}
```

## Round Notes

- Case history is canonical in Structured Record.rounds; keep prose notes exceptional.
