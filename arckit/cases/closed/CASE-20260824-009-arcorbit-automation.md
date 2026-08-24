# 建立 ArcOrbit 有界运行投影并消除 Automation 历史扫描

Case: CASE-20260824-009
Status: closed
Artifact Type: mixed
Selected Gap: none
Updated: 2026-08-24T14:37:52.307Z

## User Intent

把 Automation 流式执行热路径从全量 Run 历史反序列化和全局刷新中解耦，同时完整保留 Kernel Loop、单待办单 thread、Gap、ledger、closeout、恢复与执行控制语义。

## Structured Record

```json
{
  "schema_version": "development-case-record/v5",
  "id": "CASE-20260824-009",
  "title": "建立 ArcOrbit 有界运行投影并消除 Automation 历史扫描",
  "status": "closed",
  "artifact_type": "mixed",
  "created_at": "2026-08-24T13:54:11.190Z",
  "updated_at": "2026-08-24T14:37:52.307Z",
  "user_intent": "把 Automation 流式执行热路径从全量 Run 历史反序列化和全局刷新中解耦，同时完整保留 Kernel Loop、单待办单 thread、Gap、ledger、closeout、恢复与执行控制语义。",
  "expected_outcome": "Automation 控制快照、活动运行投影和历史列表各自使用有界读模型；流式事件成本不随历史 Run 数量或 transcript 体积增长，页面按作用域更新，现有 Kernel Loop 回归证据持续通过。",
  "project_state_ref": "arckit/project/state.record.json",
  "current_round": {
    "goal": "",
    "selected_gap": null
  },
  "facts": [
    {
      "id": "FACT-AUTORUN-CPU-BURST",
      "revision": 1,
      "status": "accepted",
      "statement": "ArcOrbit 自动化流式事件突发时主进程约占 105–110% CPU、Renderer 约占 83–91%，而 Codex app-server 子进程通常明显更低；自动化仍为 running 但无流事件时 CPU 可回落，说明触发因素是事件突发而非 Automation 状态本身。",
      "basis": "同一运行中的进程采样、空闲反例与 Automation 状态对照完全匹配。",
      "evidence": [
        "Runtime process samples, 2026-08-24",
        "Automation running idle counterexample, 2026-08-24"
      ]
    },
    {
      "id": "FACT-FULL-RUN-HYDRATION-HOT-PATH",
      "revision": 1,
      "status": "accepted",
      "statement": "run.activity_changed 会触发 Automation 全局快照；getSnapshot 无条件调用 listRuns，后者读取并解析每个匹配 Run 的 activity.json 与 messages.jsonl。当前 73 个 Run 的一次 listRuns 用时 943ms、返回约 45.43 MiB，并解析 3872 条消息。",
      "basis": "代码调用链、已安装 app.asar 对照、当前持久化数据体积与直接基准完全解释 CPU 的触发条件、位置和时序。",
      "evidence": [
        "runtime/arcorbit/src/desktop-run-manager.mjs",
        "runtime/arcorbit/src/automation-coordinator.mjs",
        "runtime/arcorbit/desktop/renderer/renderer.js",
        "Direct runManager.listRuns benchmark, 2026-08-24"
      ]
    },
    {
      "id": "FACT-KERNEL-LOOP-PROTECTED",
      "revision": 1,
      "status": "accepted",
      "statement": "本次整体优化不得改变 Runtime Kernel 的单待办单持久 thread、单 active execution、Gap Loop、trusted ledger、fresh-read、closeout、恢复、Gate 和 Git closeout 控制语义。",
      "basis": "操作者明确要求与项目既有 Runtime Kernel 架构不变量。",
      "evidence": [
        "Current operator requirement, 2026-08-24",
        "AGENTS.md",
        "arckit/tech/arcorbit/desktop-execution-solution.md"
      ]
    },
    {
      "id": "FACT-BOUNDED-PROJECTION-EXPECTED",
      "revision": 1,
      "status": "accepted",
      "statement": "项目技术事实已要求 raw activity 仅作为证据/审计来源，控制面使用稳定增量投影和有界刷新，隐藏页面不因无关事件重建。",
      "basis": "既有已采用的 ArcOrbit 技术方案。",
      "evidence": [
        "arckit/tech/arcorbit/solution.md",
        "arckit/tech/arcorbit/desktop-execution-solution.md",
        "arckit/tech/arcorbit/platform-composition-solution.md"
      ]
    },
    {
      "id": "FACT-20260824-009-001",
      "revision": 1,
      "status": "accepted",
      "statement": "Automation Snapshot 的生产路径使用 RunSummaryProjection，并只按 active run id 读取一个 detail；新 Run 持久化 summary，旧 Run 在窗口创建前最多回填 20 个 activity summary 且不读取 transcript。",
      "basis": "实现、结构化测试、Kernel 回归与真实 75 Run 数据副本基准一致。",
      "evidence": [
        "runtime/arcorbit/src/desktop-run-manager.mjs",
        "runtime/arcorbit/src/automation-coordinator.mjs",
        "runtime/arcorbit/desktop/main.mjs",
        "arckit/tech/arcorbit/desktop-execution-solution.md",
        "Verification: focused run projection tests 56 passed, 0 failed",
        "Verification: Kernel protection suite 84 passed, 0 failed"
      ]
    },
    {
      "id": "FACT-20260824-009-002",
      "revision": 1,
      "status": "accepted",
      "statement": "Renderer 将 run.activity_changed 视为带 run_id 的局部 invalidation；隐藏页面和非目标 Run 不查询，可见目标只更新 Automation snapshot 并重绘 Command Center 或 Workbench。",
      "basis": "实现分支、负向源码断言和完整 Renderer 测试一致。",
      "evidence": [
        "runtime/arcorbit/desktop/renderer/renderer.js",
        "runtime/arcorbit/test/desktop-renderer.test.mjs",
        "arckit/tech/arcorbit/desktop-execution-solution.md",
        "Verification: desktop renderer tests 48 passed, 0 failed"
      ]
    },
    {
      "id": "FACT-20260824-009-003",
      "revision": 1,
      "status": "accepted",
      "statement": "Automation 恢复、干预、Case binding、CLI handoff 与 same-thread closeout 的生产控制路径通过 getRun(run_id) 获取单个 detail；listRuns 仅保留为旧适配器兼容回退。",
      "basis": "实现调用边界、负向源码断言、Automation Coordinator 与 Kernel 回归一致。",
      "evidence": [
        "runtime/arcorbit/src/automation-coordinator.mjs",
        "runtime/arcorbit/test/automation-coordinator.test.mjs",
        "Verification: automation coordinator tests 44 passed, 0 failed",
        "Verification: Kernel protection suite 84 passed, 0 failed"
      ]
    }
  ],
  "state_impacts": [
    {
      "id": "IMPACT-AUTORUN-TECH-FOUNDATION",
      "fact_id": "FACT-20260824-009-001",
      "fact_revision": 1,
      "target": {
        "kind": "software_decision",
        "ref": "technical_foundation",
        "revision": 32
      },
      "effect": "upheld",
      "reason": "summary/detail 查询边界已实现并写入稳定技术事实，Kernel 的单 thread、Gap、ledger、Gate、恢复和 closeout 测试保持通过。",
      "gap_ids": [],
      "evidence": [
        "arckit/tech/arcorbit/desktop-execution-solution.md",
        "runtime/arcorbit/src/desktop-run-manager.mjs",
        "Verification: Kernel protection suite 84 passed, 0 failed"
      ]
    },
    {
      "id": "IMPACT-AUTORUN-EXPERIENCE",
      "fact_id": "FACT-20260824-009-002",
      "fact_revision": 1,
      "target": {
        "kind": "software_decision",
        "ref": "experience_and_interaction",
        "revision": 39
      },
      "effect": "upheld",
      "reason": "activity 节奏不再重建隐藏页面或触发无关查询。",
      "gap_ids": [],
      "evidence": [
        "runtime/arcorbit/desktop/renderer/renderer.js",
        "runtime/arcorbit/test/desktop-renderer.test.mjs",
        "arckit/tech/arcorbit/desktop-execution-solution.md",
        "Verification: desktop renderer tests 48 passed, 0 failed"
      ]
    },
    {
      "id": "IMPACT-AUTORUN-OPERATION",
      "fact_id": "FACT-20260824-009-003",
      "fact_revision": 1,
      "target": {
        "kind": "software_decision",
        "ref": "observability_and_operation",
        "revision": 7
      },
      "effect": "upheld",
      "reason": "所有生产控制路径均使用目标 Run detail，历史 hydration 不再随控制动作触发。",
      "gap_ids": [],
      "evidence": [
        "runtime/arcorbit/src/automation-coordinator.mjs",
        "runtime/arcorbit/test/automation-coordinator.test.mjs",
        "Verification: automation coordinator tests 44 passed, 0 failed"
      ]
    }
  ],
  "gaps": [
    {
      "id": "GAP-ESTABLISH-BOUNDED-AUTOMATION-READ-MODEL",
      "status": "resolved",
      "goal": "建立 Run summary 与 detail 的查询分层，使 Automation 控制快照不读取历史 activity/messages，并以自动化协调器和 Kernel Loop 回归测试证明语义不变。",
      "reason": "这是已确认 CPU 根因链上的第一个架构切面；切断主进程全历史反序列化后，才能基于 fresh evidence 判断后续是否仍需 scoped IPC 或 Renderer 局部更新。",
      "derived_from": [
        "case_intent",
        "FACT-AUTORUN-CPU-BURST",
        "FACT-FULL-RUN-HYDRATION-HOT-PATH",
        "FACT-KERNEL-LOOP-PROTECTED",
        "FACT-BOUNDED-PROJECTION-EXPECTED"
      ],
      "blocked_by": [],
      "priority_basis": {
        "blocking": "high",
        "uncertainty": "low",
        "risk": "high",
        "user_impact": "high"
      },
      "responsibility": "agent",
      "evidence_required": [
        "Automation getSnapshot 的历史 activity/messages 读取次数为 0 的测试证据",
        "Run summary 与原有控制状态/usage baseline/recent completion 语义等价证据",
        "Kernel Loop、state-driven runner、automation coordinator、ledger/Gate 回归通过",
        "稳定技术方案与实现一致"
      ],
      "resolution": {
        "id": "GAP-ESTABLISH-BOUNDED-AUTOMATION-READ-MODEL",
        "status": "resolved",
        "outcome": "Automation Control Snapshot 已改为读取 RunSummaryProjection，并至多按 ID 水合一个活动 Run；legacy usage baseline 由一次性 20 项 activity-only warmup 保持。",
        "reason": "focused tests、84 项 Kernel 保护测试和 75 Run 真实数据副本基准共同证明历史 activity/messages 已退出快照热路径且控制语义未改变。",
        "evidence": [
          "runtime/arcorbit/src/desktop-run-manager.mjs",
          "runtime/arcorbit/src/automation-coordinator.mjs",
          "runtime/arcorbit/test/automation-coordinator.test.mjs",
          "runtime/arcorbit/test/desktop-run-manager.test.mjs",
          "Verification: Kernel protection suite 84 passed, 0 failed",
          "Benchmark: 75 Run summary 13.63ms/186.19KiB; Automation Snapshot 41.63ms/173.07KiB after bounded warmup"
        ],
        "occurred_at": "2026-08-24T14:08:16.259Z"
      }
    },
    {
      "id": "GAP-20260824-009-001",
      "status": "resolved",
      "goal": "让 run.activity_changed 只刷新活动 Run/Automation 可见投影，并使 Renderer 仅重绘当前受影响区域，不重建隐藏页面。",
      "reason": "主进程读路径已降至有界，但 Renderer 仍可能在每个合并事件上执行全局 snapshot 与全页面 render，是已测得 Renderer CPU 的剩余直接因果链。",
      "derived_from": [
        "FACT-20260824-009-001"
      ],
      "blocked_by": [],
      "priority_basis": {
        "blocking": "high",
        "uncertainty": "low",
        "risk": "high",
        "user_impact": "high"
      },
      "responsibility": "agent",
      "evidence_required": [
        "activity event 不触发 platform/auth 与隐藏页面查询的测试",
        "当前 Automation/Workbench 局部更新行为证据",
        "Renderer 与 Kernel 回归通过"
      ],
      "resolution": {
        "id": "GAP-20260824-009-001",
        "status": "resolved",
        "outcome": "run.activity_changed 只在 Command Center 或同一 Run Workbench 可见时拉取 Automation Snapshot，并只重绘当前 Automation 区域。",
        "reason": "生产分支与 Renderer 契约测试证明隐藏页面不查询、可见分支不调用 Platform/Auth/Chat/Work query 或全局 render。",
        "evidence": [
          "runtime/arcorbit/desktop/renderer/renderer.js",
          "runtime/arcorbit/test/desktop-renderer.test.mjs",
          "arckit/tech/arcorbit/desktop-execution-solution.md",
          "Verification: desktop renderer tests 48 passed, 0 failed"
        ],
        "occurred_at": "2026-08-24T14:17:38.811Z"
      }
    },
    {
      "id": "GAP-20260824-009-002",
      "status": "resolved",
      "goal": "把 Automation 恢复、干预与 closeout 协调中的按项目 listRuns detail 扫描替换为按 run_id detail 或 summary 查询。",
      "reason": "这些低频路径不属于当前 stream 热点，但仍违反控制查询成本只依赖目标实体的架构不变量。",
      "derived_from": [
        "FACT-20260824-009-001"
      ],
      "blocked_by": [],
      "priority_basis": {
        "blocking": "medium",
        "uncertainty": "low",
        "risk": "medium",
        "user_impact": "medium"
      },
      "responsibility": "agent",
      "evidence_required": [
        "控制与恢复路径不调用全项目 hydrated list 的测试",
        "human Gate、recovery、Case binding 与 same-thread closeout 回归通过"
      ],
      "resolution": {
        "id": "GAP-20260824-009-002",
        "status": "resolved",
        "outcome": "Automation 恢复、人工干预、Case binding 与 closeout 协调均按 run_id 读取单个 Run detail；生产控制路径不再执行按项目 hydrated list 扫描。",
        "reason": "源码边界断言、Automation Coordinator 全量测试和 Kernel 保护回归证明查询边界改变而控制语义保持不变。",
        "evidence": [
          "runtime/arcorbit/src/automation-coordinator.mjs",
          "runtime/arcorbit/test/automation-coordinator.test.mjs",
          "Verification: automation coordinator tests 44 passed, 0 failed",
          "Verification: Kernel protection suite 84 passed, 0 failed",
          "Verification: 392 non-GUI tests passed, 0 failed"
        ],
        "occurred_at": "2026-08-24T14:36:25.910Z"
      }
    }
  ],
  "content_revision": 3,
  "completion_review": {
    "status": "clean",
    "policy": {
      "initial_max_cycles": 10,
      "source": "runtime/arcorbit/config/case-policy.json",
      "snapshotted_at": "2026-08-24T13:54:11.190Z"
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
          "Implementation correctness: summary projection persists at create/finish/command-result, active detail remains in memory, and legacy warmup is capped at 20 activity files without transcript reads",
          "Problem resolution: 75 Run list path changed from 943ms/45.43MiB to 13.63ms/186.19KiB summaries and 41.63ms/173.07KiB Automation Snapshot",
          "Verification credibility: focused projection 56/56, Renderer 48/48, Automation Coordinator 44/44, Kernel protection 84/84, and full non-GUI 392/392",
          "Regression risk: task/thread lease, single active execution, Gap Loop, trusted ledger, fresh-read, Gate, recovery and same-thread closeout code paths and tests remain intact",
          "Minimality: changes are limited to Run query projection, Automation event invalidation, target-run lookup, corresponding tests and stable tech documentation",
          "Environment limitation: experience-realization-electron could not launch under the filesystem sandbox and received SIGABRT before assertions; sandbox escalation was not authorized"
        ],
        "occurred_at": "2026-08-24T14:37:52.307Z"
      }
    ],
    "evidence": [
      "Implementation correctness: summary projection persists at create/finish/command-result, active detail remains in memory, and legacy warmup is capped at 20 activity files without transcript reads",
      "Problem resolution: 75 Run list path changed from 943ms/45.43MiB to 13.63ms/186.19KiB summaries and 41.63ms/173.07KiB Automation Snapshot",
      "Verification credibility: focused projection 56/56, Renderer 48/48, Automation Coordinator 44/44, Kernel protection 84/84, and full non-GUI 392/392",
      "Regression risk: task/thread lease, single active execution, Gap Loop, trusted ledger, fresh-read, Gate, recovery and same-thread closeout code paths and tests remain intact",
      "Minimality: changes are limited to Run query projection, Automation event invalidation, target-run lookup, corresponding tests and stable tech documentation",
      "Environment limitation: experience-realization-electron could not launch under the filesystem sandbox and received SIGABRT before assertions; sandbox escalation was not authorized"
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
      "goal": "建立有界 Run summary/detail 查询分层并验证 Automation Snapshot 与 Kernel Loop 语义。",
      "outcome": "completed",
      "gap_selection": {
        "mode": "candidate",
        "basis": "全部持久候选均已比较；当前 Case Gap 直接阻断已复现的 Automation CPU 热点，具有最高即时用户影响且无依赖。",
        "snapshot_token": "d003ea5a1e454063094db0dd0ed937eed9beb1618d567c45d65a274c66fcf2e5",
        "selected_ref": "case-gap:CASE-20260824-009:GAP-ESTABLISH-BOUNDED-AUTOMATION-READ-MODEL",
        "comparison_summary": "四个 Project Gap 均需独立 Case 且范围更宽；本 Case 的有界读模型 Gap 是唯一直接、ready、可验证的当前候选。",
        "fresh_discovery_summary": "开轮时没有更高优先级 fresh candidate；实现证据在本轮结束时暴露 Renderer 全局刷新与剩余控制历史扫描，作为后续 Gap 显式加入。",
        "considered": [
          {
            "ref": "project-gap:GAP-agent-scenario-evaluation",
            "source": "persisted",
            "eligibility": "case_required",
            "disposition": "deferred",
            "priority_basis": {
              "blocking": "low",
              "uncertainty": "high",
              "risk": "high",
              "user_impact": "medium"
            },
            "reason": "真实场景验证需要独立 Case，不直接解除当前 CPU 热点。"
          },
          {
            "ref": "project-gap:GAP-runtime-resilience-and-adapters",
            "source": "persisted",
            "eligibility": "case_required",
            "disposition": "deferred",
            "priority_basis": {
              "blocking": "medium",
              "uncertainty": "medium",
              "risk": "high",
              "user_impact": "medium"
            },
            "reason": "与 Runtime 运行质量相邻但范围包含 timeout、compaction 和 adapter，不能替代当前精确 Case。"
          },
          {
            "ref": "project-gap:GAP-security-real-project-validation",
            "source": "persisted",
            "eligibility": "case_required",
            "disposition": "deferred",
            "priority_basis": {
              "blocking": "low",
              "uncertainty": "medium",
              "risk": "high",
              "user_impact": "medium"
            },
            "reason": "安全实项目验证与本次本地查询性能改造无直接依赖。"
          },
          {
            "ref": "project-gap:GAP-cross-record-audit",
            "source": "persisted",
            "eligibility": "case_required",
            "disposition": "deferred",
            "priority_basis": {
              "blocking": "medium",
              "uncertainty": "medium",
              "risk": "high",
              "user_impact": "medium"
            },
            "reason": "跨记录审计应由独立 Case 推进，不应混入 Desktop 读模型实现。"
          },
          {
            "ref": "case-gap:CASE-20260824-009:GAP-ESTABLISH-BOUNDED-AUTOMATION-READ-MODEL",
            "source": "persisted",
            "eligibility": "ready",
            "disposition": "selected",
            "priority_basis": {
              "blocking": "high",
              "uncertainty": "low",
              "risk": "high",
              "user_impact": "high"
            },
            "reason": "它是唯一直接切断 stream event 到全历史反序列化因果链的 ready Gap。"
          }
        ]
      },
      "selected_gap": {
        "id": "GAP-ESTABLISH-BOUNDED-AUTOMATION-READ-MODEL",
        "responsibility": "agent",
        "goal": "建立 Run summary 与 detail 的查询分层，使 Automation 控制快照不读取历史 activity/messages，并以自动化协调器和 Kernel Loop 回归测试证明语义不变。",
        "reason": "这是已确认 CPU 根因链上的第一个架构切面；切断主进程全历史反序列化后，才能基于 fresh evidence 判断后续是否仍需 scoped IPC 或 Renderer 局部更新。",
        "derived_from": [
          "case_intent",
          "FACT-AUTORUN-CPU-BURST",
          "FACT-FULL-RUN-HYDRATION-HOT-PATH",
          "FACT-KERNEL-LOOP-PROTECTED",
          "FACT-BOUNDED-PROJECTION-EXPECTED"
        ],
        "blocked_by": [],
        "priority_basis": {
          "blocking": "high",
          "uncertainty": "low",
          "risk": "high",
          "user_impact": "high"
        },
        "evidence_required": [
          "Automation getSnapshot 的历史 activity/messages 读取次数为 0 的测试证据",
          "Run summary 与原有控制状态/usage baseline/recent completion 语义等价证据",
          "Kernel Loop、state-driven runner、automation coordinator、ledger/Gate 回归通过",
          "稳定技术方案与实现一致"
        ]
      },
      "planned_transition": {
        "goal": "建立有界 Run summary/detail 查询分层并验证 Automation Snapshot 与 Kernel Loop 语义。",
        "expected_state_change": "关闭当前全历史读取 Gap，接受 summary/detail 架构与性能证据，并显式保留剩余 Renderer/控制查询风险。"
      },
      "accepted_state_delta": {
        "resolved_gap": {
          "id": "GAP-ESTABLISH-BOUNDED-AUTOMATION-READ-MODEL",
          "status": "resolved",
          "outcome": "Automation Control Snapshot 已改为读取 RunSummaryProjection，并至多按 ID 水合一个活动 Run；legacy usage baseline 由一次性 20 项 activity-only warmup 保持。",
          "reason": "focused tests、84 项 Kernel 保护测试和 75 Run 真实数据副本基准共同证明历史 activity/messages 已退出快照热路径且控制语义未改变。",
          "evidence": [
            "runtime/arcorbit/src/desktop-run-manager.mjs",
            "runtime/arcorbit/src/automation-coordinator.mjs",
            "runtime/arcorbit/test/automation-coordinator.test.mjs",
            "runtime/arcorbit/test/desktop-run-manager.test.mjs",
            "Verification: Kernel protection suite 84 passed, 0 failed",
            "Benchmark: 75 Run summary 13.63ms/186.19KiB; Automation Snapshot 41.63ms/173.07KiB after bounded warmup"
          ]
        },
        "facts_added": [
          {
            "id": "FACT-20260824-009-001",
            "revision": 1,
            "status": "accepted",
            "statement": "Automation Snapshot 的生产路径使用 RunSummaryProjection，并只按 active run id 读取一个 detail；新 Run 持久化 summary，旧 Run 在窗口创建前最多回填 20 个 activity summary 且不读取 transcript。",
            "basis": "实现、结构化测试、Kernel 回归与真实 75 Run 数据副本基准一致。",
            "evidence": [
              "runtime/arcorbit/src/desktop-run-manager.mjs",
              "runtime/arcorbit/src/automation-coordinator.mjs",
              "runtime/arcorbit/desktop/main.mjs",
              "arckit/tech/arcorbit/desktop-execution-solution.md",
              "Verification: focused run projection tests 56 passed, 0 failed",
              "Verification: Kernel protection suite 84 passed, 0 failed"
            ]
          }
        ],
        "facts_superseded": [],
        "impacts_added": [],
        "impacts_updated": [
          {
            "id": "IMPACT-AUTORUN-TECH-FOUNDATION",
            "fact_id": "FACT-20260824-009-001",
            "fact_revision": 1,
            "target": {
              "kind": "software_decision",
              "ref": "technical_foundation",
              "revision": 32
            },
            "effect": "upheld",
            "reason": "summary/detail 查询边界已实现并写入稳定技术事实，Kernel 的单 thread、Gap、ledger、Gate、恢复和 closeout 测试保持通过。",
            "gap_ids": [],
            "evidence": [
              "arckit/tech/arcorbit/desktop-execution-solution.md",
              "runtime/arcorbit/src/desktop-run-manager.mjs",
              "Verification: Kernel protection suite 84 passed, 0 failed"
            ]
          },
          {
            "id": "IMPACT-AUTORUN-EXPERIENCE",
            "fact_id": "FACT-20260824-009-001",
            "fact_revision": 1,
            "target": {
              "kind": "software_decision",
              "ref": "experience_and_interaction",
              "revision": 39
            },
            "effect": "threatened",
            "reason": "主进程历史扫描已解除，但 Renderer 仍将 activity invalidation 升级为全局 snapshot 与隐藏页面重建。",
            "gap_ids": [
              "GAP-20260824-009-001"
            ],
            "evidence": [
              "runtime/arcorbit/desktop/renderer/renderer.js"
            ]
          },
          {
            "id": "IMPACT-AUTORUN-OPERATION",
            "fact_id": "FACT-20260824-009-001",
            "fact_revision": 1,
            "target": {
              "kind": "software_decision",
              "ref": "observability_and_operation",
              "revision": 7
            },
            "effect": "threatened",
            "reason": "Automation Snapshot 已有界，但恢复和人工控制中的少数按项目 detail 列表仍可能读取无关 Run evidence。",
            "gap_ids": [
              "GAP-20260824-009-002"
            ],
            "evidence": [
              "runtime/arcorbit/src/automation-coordinator.mjs"
            ]
          }
        ],
        "gaps_added": [
          {
            "id": "GAP-20260824-009-001",
            "status": "open",
            "goal": "让 run.activity_changed 只刷新活动 Run/Automation 可见投影，并使 Renderer 仅重绘当前受影响区域，不重建隐藏页面。",
            "reason": "主进程读路径已降至有界，但 Renderer 仍可能在每个合并事件上执行全局 snapshot 与全页面 render，是已测得 Renderer CPU 的剩余直接因果链。",
            "derived_from": [
              "FACT-20260824-009-001"
            ],
            "blocked_by": [],
            "priority_basis": {
              "blocking": "high",
              "uncertainty": "low",
              "risk": "high",
              "user_impact": "high"
            },
            "responsibility": "agent",
            "evidence_required": [
              "activity event 不触发 platform/auth 与隐藏页面查询的测试",
              "当前 Automation/Workbench 局部更新行为证据",
              "Renderer 与 Kernel 回归通过"
            ],
            "resolution": null
          },
          {
            "id": "GAP-20260824-009-002",
            "status": "open",
            "goal": "把 Automation 恢复、干预与 closeout 协调中的按项目 listRuns detail 扫描替换为按 run_id detail 或 summary 查询。",
            "reason": "这些低频路径不属于当前 stream 热点，但仍违反控制查询成本只依赖目标实体的架构不变量。",
            "derived_from": [
              "FACT-20260824-009-001"
            ],
            "blocked_by": [],
            "priority_basis": {
              "blocking": "medium",
              "uncertainty": "low",
              "risk": "medium",
              "user_impact": "medium"
            },
            "responsibility": "agent",
            "evidence_required": [
              "控制与恢复路径不调用全项目 hydrated list 的测试",
              "human Gate、recovery、Case binding 与 same-thread closeout 回归通过"
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
        "project_revision": 222,
        "judgments": [
          {
            "invariant_ref": "product-expectations-remain-recoverable",
            "disposition": "not_relevant",
            "reason": "本轮不改变 ArcOrbit 产品能力、用户、业务规则或范围边界。",
            "fact_refs": [],
            "evidence": [],
            "gap_refs": []
          },
          {
            "invariant_ref": "interaction-expectations-remain-recoverable",
            "disposition": "threatened",
            "reason": "Renderer 的 scoped invalidation 与 route-local render 尚未完成，交互性能事实仍有一个显式 Gap。",
            "fact_refs": [
              "FACT-20260824-009-001"
            ],
            "evidence": [
              "runtime/arcorbit/desktop/renderer/renderer.js"
            ],
            "gap_refs": [
              "GAP-20260824-009-001"
            ]
          },
          {
            "invariant_ref": "visual-language-remains-consistent",
            "disposition": "not_relevant",
            "reason": "本轮没有修改视觉 token、主题、组件外观或布局规格。",
            "fact_refs": [],
            "evidence": [],
            "gap_refs": []
          },
          {
            "invariant_ref": "technical-decisions-remain-explainable",
            "disposition": "upheld",
            "reason": "Run summary/detail、active projection、legacy warmup 与 Kernel 隔离边界已在稳定技术文档、实现和测试中一致表达。",
            "fact_refs": [
              "FACT-20260824-009-001"
            ],
            "evidence": [
              "arckit/tech/arcorbit/desktop-execution-solution.md",
              "runtime/arcorbit/src/desktop-run-manager.mjs",
              "runtime/arcorbit/src/automation-coordinator.mjs"
            ],
            "gap_refs": []
          },
          {
            "invariant_ref": "accepted-facts-are-realized",
            "disposition": "threatened",
            "reason": "有界 Automation Snapshot 已兑现，但用户授权的整体优化仍有 Renderer 与低频控制扫描两个普通 Gap。",
            "fact_refs": [
              "FACT-20260824-009-001",
              "FACT-KERNEL-LOOP-PROTECTED"
            ],
            "evidence": [
              "Verification: Kernel protection suite 84 passed, 0 failed"
            ],
            "gap_refs": [
              "GAP-20260824-009-001",
              "GAP-20260824-009-002"
            ]
          },
          {
            "invariant_ref": "material-risks-have-credible-evidence",
            "disposition": "threatened",
            "reason": "主进程热点已有真实基准与回归证据；Renderer 局部更新和剩余控制查询仍需各自可重复证据。",
            "fact_refs": [
              "FACT-20260824-009-001"
            ],
            "evidence": [
              "Benchmark: 75 Run summary 13.63ms/186.19KiB; Automation Snapshot 41.63ms/173.07KiB after bounded warmup",
              "Verification: Kernel protection suite 84 passed, 0 failed"
            ],
            "gap_refs": [
              "GAP-20260824-009-001",
              "GAP-20260824-009-002"
            ]
          }
        ]
      },
      "evidence": [
        "runtime/arcorbit/src/desktop-run-manager.mjs",
        "runtime/arcorbit/src/automation-coordinator.mjs",
        "runtime/arcorbit/desktop/main.mjs",
        "runtime/arcorbit/test/desktop-run-manager.test.mjs",
        "runtime/arcorbit/test/automation-coordinator.test.mjs",
        "arckit/tech/arcorbit/desktop-execution-solution.md",
        "Verification: focused run projection tests 56 passed, 0 failed",
        "Verification: Kernel protection suite 84 passed, 0 failed",
        "Benchmark: 75 Run summary 13.63ms/186.19KiB; Automation Snapshot 41.63ms/173.07KiB after bounded warmup",
        "Verification: git diff --check passed; no ARC_DEBUG or temporary console instrumentation remains"
      ],
      "runtime_result_ref": "codex-thread://current",
      "occurred_at": "2026-08-24T14:08:16.259Z"
    },
    {
      "round": 2,
      "transition_schema_version": "arckit-case-transition/v8",
      "goal": "把 activity invalidation 限定到可见目标 Run 的 Automation 局部查询和局部渲染。",
      "outcome": "completed",
      "gap_selection": {
        "mode": "candidate",
        "basis": "全部持久候选均已比较；Renderer activity 热点具有最高 blocking 与用户影响。",
        "snapshot_token": "fd25443581f7c69f4ae30490c68b24e08322358c9cf09393578558b72dc29c37",
        "selected_ref": "case-gap:CASE-20260824-009:GAP-20260824-009-001",
        "comparison_summary": "四个 Project Gap 需独立 Case；control lookup 为低频中风险；scoped rendering 是剩余 stream CPU 因果链。",
        "fresh_discovery_summary": "实现与测试没有发现更高优先级 fresh candidate。",
        "considered": [
          {
            "ref": "project-gap:GAP-agent-scenario-evaluation",
            "source": "persisted",
            "eligibility": "case_required",
            "disposition": "deferred",
            "priority_basis": {
              "blocking": "medium",
              "uncertainty": "medium",
              "risk": "high",
              "user_impact": "medium"
            },
            "reason": "需要独立 Case 或不直接解除当前 Renderer 热点。"
          },
          {
            "ref": "project-gap:GAP-runtime-resilience-and-adapters",
            "source": "persisted",
            "eligibility": "case_required",
            "disposition": "deferred",
            "priority_basis": {
              "blocking": "medium",
              "uncertainty": "medium",
              "risk": "high",
              "user_impact": "medium"
            },
            "reason": "需要独立 Case 或不直接解除当前 Renderer 热点。"
          },
          {
            "ref": "project-gap:GAP-security-real-project-validation",
            "source": "persisted",
            "eligibility": "case_required",
            "disposition": "deferred",
            "priority_basis": {
              "blocking": "medium",
              "uncertainty": "medium",
              "risk": "high",
              "user_impact": "medium"
            },
            "reason": "需要独立 Case 或不直接解除当前 Renderer 热点。"
          },
          {
            "ref": "project-gap:GAP-cross-record-audit",
            "source": "persisted",
            "eligibility": "case_required",
            "disposition": "deferred",
            "priority_basis": {
              "blocking": "medium",
              "uncertainty": "medium",
              "risk": "high",
              "user_impact": "medium"
            },
            "reason": "需要独立 Case 或不直接解除当前 Renderer 热点。"
          },
          {
            "ref": "case-gap:CASE-20260824-009:GAP-20260824-009-001",
            "source": "persisted",
            "eligibility": "ready",
            "disposition": "selected",
            "priority_basis": {
              "blocking": "high",
              "uncertainty": "low",
              "risk": "high",
              "user_impact": "high"
            },
            "reason": "直接切断 activity event 到全局查询与隐藏页面 render 的剩余因果链。"
          },
          {
            "ref": "case-gap:CASE-20260824-009:GAP-20260824-009-002",
            "source": "persisted",
            "eligibility": "ready",
            "disposition": "deferred",
            "priority_basis": {
              "blocking": "medium",
              "uncertainty": "medium",
              "risk": "medium",
              "user_impact": "medium"
            },
            "reason": "低频控制路径在 stream 热点之后推进。"
          }
        ]
      },
      "selected_gap": {
        "id": "GAP-20260824-009-001",
        "responsibility": "agent",
        "goal": "让 run.activity_changed 只刷新活动 Run/Automation 可见投影，并使 Renderer 仅重绘当前受影响区域，不重建隐藏页面。",
        "reason": "主进程读路径已降至有界，但 Renderer 仍可能在每个合并事件上执行全局 snapshot 与全页面 render，是已测得 Renderer CPU 的剩余直接因果链。",
        "derived_from": [
          "FACT-20260824-009-001"
        ],
        "blocked_by": [],
        "priority_basis": {
          "blocking": "high",
          "uncertainty": "low",
          "risk": "high",
          "user_impact": "high"
        },
        "evidence_required": [
          "activity event 不触发 platform/auth 与隐藏页面查询的测试",
          "当前 Automation/Workbench 局部更新行为证据",
          "Renderer 与 Kernel 回归通过"
        ]
      },
      "planned_transition": {
        "goal": "把 activity invalidation 限定到可见目标 Run 的 Automation 局部查询和局部渲染。",
        "expected_state_change": "关闭 Renderer stream 热点 Gap，仅保留低频控制查询 Gap。"
      },
      "accepted_state_delta": {
        "resolved_gap": {
          "id": "GAP-20260824-009-001",
          "status": "resolved",
          "outcome": "run.activity_changed 只在 Command Center 或同一 Run Workbench 可见时拉取 Automation Snapshot，并只重绘当前 Automation 区域。",
          "reason": "生产分支与 Renderer 契约测试证明隐藏页面不查询、可见分支不调用 Platform/Auth/Chat/Work query 或全局 render。",
          "evidence": [
            "runtime/arcorbit/desktop/renderer/renderer.js",
            "runtime/arcorbit/test/desktop-renderer.test.mjs",
            "arckit/tech/arcorbit/desktop-execution-solution.md",
            "Verification: desktop renderer tests 48 passed, 0 failed"
          ]
        },
        "facts_added": [
          {
            "id": "FACT-20260824-009-002",
            "revision": 1,
            "status": "accepted",
            "statement": "Renderer 将 run.activity_changed 视为带 run_id 的局部 invalidation；隐藏页面和非目标 Run 不查询，可见目标只更新 Automation snapshot 并重绘 Command Center 或 Workbench。",
            "basis": "实现分支、负向源码断言和完整 Renderer 测试一致。",
            "evidence": [
              "runtime/arcorbit/desktop/renderer/renderer.js",
              "runtime/arcorbit/test/desktop-renderer.test.mjs",
              "arckit/tech/arcorbit/desktop-execution-solution.md",
              "Verification: desktop renderer tests 48 passed, 0 failed"
            ]
          }
        ],
        "facts_superseded": [],
        "impacts_added": [],
        "impacts_updated": [
          {
            "id": "IMPACT-AUTORUN-EXPERIENCE",
            "fact_id": "FACT-20260824-009-002",
            "fact_revision": 1,
            "target": {
              "kind": "software_decision",
              "ref": "experience_and_interaction",
              "revision": 39
            },
            "effect": "upheld",
            "reason": "activity 节奏不再重建隐藏页面或触发无关查询。",
            "gap_ids": [],
            "evidence": [
              "runtime/arcorbit/desktop/renderer/renderer.js",
              "runtime/arcorbit/test/desktop-renderer.test.mjs",
              "arckit/tech/arcorbit/desktop-execution-solution.md",
              "Verification: desktop renderer tests 48 passed, 0 failed"
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
        "project_revision": 222,
        "judgments": [
          {
            "invariant_ref": "product-expectations-remain-recoverable",
            "disposition": "not_relevant",
            "reason": "本轮不改变产品能力与业务规则。",
            "fact_refs": [],
            "evidence": [],
            "gap_refs": []
          },
          {
            "invariant_ref": "interaction-expectations-remain-recoverable",
            "disposition": "upheld",
            "reason": "可见 Run 局部刷新与隐藏页面静默边界已有实现和测试。",
            "fact_refs": [
              "FACT-20260824-009-002"
            ],
            "evidence": [
              "runtime/arcorbit/desktop/renderer/renderer.js",
              "runtime/arcorbit/test/desktop-renderer.test.mjs",
              "arckit/tech/arcorbit/desktop-execution-solution.md",
              "Verification: desktop renderer tests 48 passed, 0 failed"
            ],
            "gap_refs": []
          },
          {
            "invariant_ref": "visual-language-remains-consistent",
            "disposition": "not_relevant",
            "reason": "没有修改视觉事实。",
            "fact_refs": [],
            "evidence": [],
            "gap_refs": []
          },
          {
            "invariant_ref": "technical-decisions-remain-explainable",
            "disposition": "upheld",
            "reason": "局部 invalidation 职责已写入稳定技术方案并由生产代码实现。",
            "fact_refs": [
              "FACT-20260824-009-002",
              "FACT-20260824-009-001"
            ],
            "evidence": [
              "runtime/arcorbit/desktop/renderer/renderer.js",
              "runtime/arcorbit/test/desktop-renderer.test.mjs",
              "arckit/tech/arcorbit/desktop-execution-solution.md",
              "Verification: desktop renderer tests 48 passed, 0 failed"
            ],
            "gap_refs": []
          },
          {
            "invariant_ref": "accepted-facts-are-realized",
            "disposition": "threatened",
            "reason": "主进程与 Renderer 热点已关闭，整体优化仍有一个低频控制查询 Gap。",
            "fact_refs": [
              "FACT-20260824-009-002",
              "FACT-KERNEL-LOOP-PROTECTED"
            ],
            "evidence": [
              "runtime/arcorbit/desktop/renderer/renderer.js",
              "runtime/arcorbit/test/desktop-renderer.test.mjs",
              "arckit/tech/arcorbit/desktop-execution-solution.md",
              "Verification: desktop renderer tests 48 passed, 0 failed"
            ],
            "gap_refs": [
              "GAP-20260824-009-002"
            ]
          },
          {
            "invariant_ref": "material-risks-have-credible-evidence",
            "disposition": "threatened",
            "reason": "Renderer 风险已有证据；剩余控制查询仍需 recovery/Gate/closeout 回归。",
            "fact_refs": [
              "FACT-20260824-009-002"
            ],
            "evidence": [
              "runtime/arcorbit/desktop/renderer/renderer.js",
              "runtime/arcorbit/test/desktop-renderer.test.mjs",
              "arckit/tech/arcorbit/desktop-execution-solution.md",
              "Verification: desktop renderer tests 48 passed, 0 failed"
            ],
            "gap_refs": [
              "GAP-20260824-009-002"
            ]
          }
        ]
      },
      "evidence": [
        "runtime/arcorbit/desktop/renderer/renderer.js",
        "runtime/arcorbit/test/desktop-renderer.test.mjs",
        "arckit/tech/arcorbit/desktop-execution-solution.md",
        "Verification: desktop renderer tests 48 passed, 0 failed",
        "Verification: git diff --check passed"
      ],
      "runtime_result_ref": "codex-thread://current",
      "occurred_at": "2026-08-24T14:17:38.811Z"
    },
    {
      "round": 3,
      "transition_schema_version": "arckit-case-transition/v8",
      "goal": "将 Automation 恢复、干预和 closeout 的 Run 读取限定为按 run_id 获取单个 detail。",
      "outcome": "completed",
      "gap_selection": {
        "mode": "candidate",
        "basis": "全部持久候选均已比较；本 Case 唯一剩余的 ready Gap 是整体优化的最后一个有界查询义务。",
        "snapshot_token": "a0d4d9728d6ff6ca534fa2ad893f1286dcd3465a5adc1d645d0a6e3a4ed2a344",
        "selected_ref": "case-gap:CASE-20260824-009:GAP-20260824-009-002",
        "comparison_summary": "四个 Project Gap 需要独立 Case；当前 Case Gap 是唯一直接完成 Automation 控制查询架构收口的候选。",
        "fresh_discovery_summary": "实现、源码边界检查和完整非 GUI 测试未发现更高优先级 fresh candidate。",
        "considered": [
          {
            "ref": "project-gap:GAP-agent-scenario-evaluation",
            "source": "persisted",
            "eligibility": "case_required",
            "disposition": "deferred",
            "priority_basis": {
              "blocking": "low",
              "uncertainty": "high",
              "risk": "high",
              "user_impact": "medium"
            },
            "reason": "需要独立 Case，不直接影响本次目标 Run 查询边界。"
          },
          {
            "ref": "project-gap:GAP-runtime-resilience-and-adapters",
            "source": "persisted",
            "eligibility": "case_required",
            "disposition": "deferred",
            "priority_basis": {
              "blocking": "medium",
              "uncertainty": "medium",
              "risk": "high",
              "user_impact": "medium"
            },
            "reason": "范围包含 timeout、compaction 与外部 adapter，应由独立 Case 推进。"
          },
          {
            "ref": "project-gap:GAP-security-real-project-validation",
            "source": "persisted",
            "eligibility": "case_required",
            "disposition": "deferred",
            "priority_basis": {
              "blocking": "low",
              "uncertainty": "medium",
              "risk": "high",
              "user_impact": "medium"
            },
            "reason": "与本地 Run 投影性能优化无直接依赖。"
          },
          {
            "ref": "project-gap:GAP-cross-record-audit",
            "source": "persisted",
            "eligibility": "case_required",
            "disposition": "deferred",
            "priority_basis": {
              "blocking": "medium",
              "uncertainty": "medium",
              "risk": "high",
              "user_impact": "medium"
            },
            "reason": "跨记录审计不应混入 Desktop 查询架构 Case。"
          },
          {
            "ref": "case-gap:CASE-20260824-009:GAP-20260824-009-002",
            "source": "persisted",
            "eligibility": "ready",
            "disposition": "selected",
            "priority_basis": {
              "blocking": "medium",
              "uncertainty": "low",
              "risk": "medium",
              "user_impact": "medium"
            },
            "reason": "这是唯一剩余的 Case Gap，关闭后所有控制查询都只依赖目标实体。"
          }
        ]
      },
      "selected_gap": {
        "id": "GAP-20260824-009-002",
        "responsibility": "agent",
        "goal": "把 Automation 恢复、干预与 closeout 协调中的按项目 listRuns detail 扫描替换为按 run_id detail 或 summary 查询。",
        "reason": "这些低频路径不属于当前 stream 热点，但仍违反控制查询成本只依赖目标实体的架构不变量。",
        "derived_from": [
          "FACT-20260824-009-001"
        ],
        "blocked_by": [],
        "priority_basis": {
          "blocking": "medium",
          "uncertainty": "low",
          "risk": "medium",
          "user_impact": "medium"
        },
        "evidence_required": [
          "控制与恢复路径不调用全项目 hydrated list 的测试",
          "human Gate、recovery、Case binding 与 same-thread closeout 回归通过"
        ]
      },
      "planned_transition": {
        "goal": "将 Automation 恢复、干预和 closeout 的 Run 读取限定为按 run_id 获取单个 detail。",
        "expected_state_change": "关闭最后一个普通 Gap，并进入 implementation-focused Completion Review。"
      },
      "accepted_state_delta": {
        "resolved_gap": {
          "id": "GAP-20260824-009-002",
          "status": "resolved",
          "outcome": "Automation 恢复、人工干预、Case binding 与 closeout 协调均按 run_id 读取单个 Run detail；生产控制路径不再执行按项目 hydrated list 扫描。",
          "reason": "源码边界断言、Automation Coordinator 全量测试和 Kernel 保护回归证明查询边界改变而控制语义保持不变。",
          "evidence": [
            "runtime/arcorbit/src/automation-coordinator.mjs",
            "runtime/arcorbit/test/automation-coordinator.test.mjs",
            "Verification: automation coordinator tests 44 passed, 0 failed",
            "Verification: Kernel protection suite 84 passed, 0 failed",
            "Verification: 392 non-GUI tests passed, 0 failed"
          ]
        },
        "facts_added": [
          {
            "id": "FACT-20260824-009-003",
            "revision": 1,
            "status": "accepted",
            "statement": "Automation 恢复、干预、Case binding、CLI handoff 与 same-thread closeout 的生产控制路径通过 getRun(run_id) 获取单个 detail；listRuns 仅保留为旧适配器兼容回退。",
            "basis": "实现调用边界、负向源码断言、Automation Coordinator 与 Kernel 回归一致。",
            "evidence": [
              "runtime/arcorbit/src/automation-coordinator.mjs",
              "runtime/arcorbit/test/automation-coordinator.test.mjs",
              "Verification: automation coordinator tests 44 passed, 0 failed",
              "Verification: Kernel protection suite 84 passed, 0 failed"
            ]
          }
        ],
        "facts_superseded": [],
        "impacts_added": [],
        "impacts_updated": [
          {
            "id": "IMPACT-AUTORUN-OPERATION",
            "fact_id": "FACT-20260824-009-003",
            "fact_revision": 1,
            "target": {
              "kind": "software_decision",
              "ref": "observability_and_operation",
              "revision": 7
            },
            "effect": "upheld",
            "reason": "所有生产控制路径均使用目标 Run detail，历史 hydration 不再随控制动作触发。",
            "gap_ids": [],
            "evidence": [
              "runtime/arcorbit/src/automation-coordinator.mjs",
              "runtime/arcorbit/test/automation-coordinator.test.mjs",
              "Verification: automation coordinator tests 44 passed, 0 failed"
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
        "project_revision": 222,
        "judgments": [
          {
            "invariant_ref": "product-expectations-remain-recoverable",
            "disposition": "not_relevant",
            "reason": "本轮不改变产品能力、业务规则或范围边界。",
            "fact_refs": [],
            "evidence": [],
            "gap_refs": []
          },
          {
            "invariant_ref": "interaction-expectations-remain-recoverable",
            "disposition": "upheld",
            "reason": "既有 scoped activity invalidation 保持通过，控制查询替换不改变交互状态或反馈。",
            "fact_refs": [
              "FACT-20260824-009-002",
              "FACT-20260824-009-003"
            ],
            "evidence": [
              "runtime/arcorbit/desktop/renderer/renderer.js",
              "runtime/arcorbit/test/desktop-renderer.test.mjs",
              "Verification: desktop renderer tests 48 passed, 0 failed"
            ],
            "gap_refs": []
          },
          {
            "invariant_ref": "visual-language-remains-consistent",
            "disposition": "not_relevant",
            "reason": "没有修改视觉 token、组件外观或布局。",
            "fact_refs": [],
            "evidence": [],
            "gap_refs": []
          },
          {
            "invariant_ref": "technical-decisions-remain-explainable",
            "disposition": "upheld",
            "reason": "summary/detail、局部 invalidation 与目标 Run 控制查询边界已在技术方案、实现和测试中一致表达。",
            "fact_refs": [
              "FACT-20260824-009-001",
              "FACT-20260824-009-002",
              "FACT-20260824-009-003"
            ],
            "evidence": [
              "arckit/tech/arcorbit/desktop-execution-solution.md",
              "runtime/arcorbit/src/desktop-run-manager.mjs",
              "runtime/arcorbit/src/automation-coordinator.mjs"
            ],
            "gap_refs": []
          },
          {
            "invariant_ref": "accepted-facts-are-realized",
            "disposition": "upheld",
            "reason": "三个普通 Gap 均由生产实现和直接测试兑现，Kernel Loop 保护边界未变化。",
            "fact_refs": [
              "FACT-KERNEL-LOOP-PROTECTED",
              "FACT-20260824-009-001",
              "FACT-20260824-009-002",
              "FACT-20260824-009-003"
            ],
            "evidence": [
              "Verification: Kernel protection suite 84 passed, 0 failed",
              "Verification: 392 non-GUI tests passed, 0 failed"
            ],
            "gap_refs": []
          },
          {
            "invariant_ref": "material-risks-have-credible-evidence",
            "disposition": "upheld",
            "reason": "热点因果链由运行采样与真实数据基准闭合，架构改造由 focused、Kernel 和完整非 GUI 回归覆盖；唯一 GUI 启动项因沙箱 SIGABRT 未运行断言且已明确保留。",
            "fact_refs": [
              "FACT-AUTORUN-CPU-BURST",
              "FACT-FULL-RUN-HYDRATION-HOT-PATH",
              "FACT-KERNEL-LOOP-PROTECTED",
              "FACT-20260824-009-003"
            ],
            "evidence": [
              "Benchmark: 75 Run summary 13.63ms/186.19KiB; Automation Snapshot 41.63ms/173.07KiB",
              "Verification: Kernel protection suite 84 passed, 0 failed",
              "Verification: 392 non-GUI tests passed, 0 failed",
              "Environment limitation: experience-realization-electron received SIGABRT before assertions under filesystem sandbox; escalation was not authorized"
            ],
            "gap_refs": []
          }
        ]
      },
      "evidence": [
        "runtime/arcorbit/src/automation-coordinator.mjs",
        "runtime/arcorbit/test/automation-coordinator.test.mjs",
        "arckit/tech/arcorbit/desktop-execution-solution.md",
        "Verification: automation coordinator tests 44 passed, 0 failed",
        "Verification: Kernel protection suite 84 passed, 0 failed",
        "Verification: 392 non-GUI tests passed, 0 failed",
        "Verification: git diff --check passed; no ARC_DEBUG or temporary console instrumentation remains"
      ],
      "runtime_result_ref": "codex-thread://current",
      "occurred_at": "2026-08-24T14:36:25.910Z"
    },
    {
      "round": 4,
      "transition_schema_version": "arckit-case-transition/v8",
      "goal": "独立审查 ArcOrbit 有界 Run 投影整体实现。",
      "outcome": "completed",
      "gap_selection": {
        "mode": "candidate",
        "basis": "全部持久候选均已比较；所有普通 Case Gap 和 impact 已关闭，派生 Completion Review 是唯一可关闭本 Case 的 ready 候选。",
        "snapshot_token": "3952f2a8b24da56c5d2b03f66b32604ef92408d09f9079e6f3089bb191d30ca8",
        "selected_ref": "case-gap:CASE-20260824-009:CASE-20260824-009:completion-review:1",
        "comparison_summary": "四个 Project Gap 需要独立 Case；Completion Review 直接审查本 Case 已完成实现的正确性与风险。",
        "fresh_discovery_summary": "逐文件 diff、调用边界、性能基准、focused/Kernel/完整非 GUI 回归未发现需要重开普通 Gap 的 fresh finding。",
        "considered": [
          {
            "ref": "project-gap:GAP-agent-scenario-evaluation",
            "source": "persisted",
            "eligibility": "case_required",
            "disposition": "deferred",
            "priority_basis": {
              "blocking": "low",
              "uncertainty": "high",
              "risk": "high",
              "user_impact": "medium"
            },
            "reason": "真实场景评估范围跨 Case，不是本实现 review finding。"
          },
          {
            "ref": "project-gap:GAP-runtime-resilience-and-adapters",
            "source": "persisted",
            "eligibility": "case_required",
            "disposition": "deferred",
            "priority_basis": {
              "blocking": "medium",
              "uncertainty": "medium",
              "risk": "high",
              "user_impact": "medium"
            },
            "reason": "Runtime resilience 与 adapter 属于既有 Project Gap，不由本 Case 静默吸收。"
          },
          {
            "ref": "project-gap:GAP-security-real-project-validation",
            "source": "persisted",
            "eligibility": "case_required",
            "disposition": "deferred",
            "priority_basis": {
              "blocking": "low",
              "uncertainty": "medium",
              "risk": "high",
              "user_impact": "medium"
            },
            "reason": "安全实项目验证与本地只读投影改造无直接关系。"
          },
          {
            "ref": "project-gap:GAP-cross-record-audit",
            "source": "persisted",
            "eligibility": "case_required",
            "disposition": "deferred",
            "priority_basis": {
              "blocking": "medium",
              "uncertainty": "medium",
              "risk": "high",
              "user_impact": "medium"
            },
            "reason": "跨记录审计需要独立推进，不构成本实现缺陷。"
          },
          {
            "ref": "case-gap:CASE-20260824-009:CASE-20260824-009:completion-review:1",
            "source": "persisted",
            "eligibility": "ready",
            "disposition": "selected",
            "priority_basis": {
              "blocking": "high",
              "uncertainty": "low",
              "risk": "high",
              "user_impact": "high"
            },
            "reason": "它是所有普通义务关闭后唯一的实现收口门禁。"
          }
        ]
      },
      "selected_gap": {
        "id": "CASE-20260824-009:completion-review:1",
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
        "goal": "独立审查 ArcOrbit 有界 Run 投影整体实现。",
        "expected_state_change": "若五维 review clean，则可信关闭 Case；若有 finding，则由 Ledger 重开普通 Gap。"
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
            "Implementation correctness: summary projection persists at create/finish/command-result, active detail remains in memory, and legacy warmup is capped at 20 activity files without transcript reads",
            "Problem resolution: 75 Run list path changed from 943ms/45.43MiB to 13.63ms/186.19KiB summaries and 41.63ms/173.07KiB Automation Snapshot",
            "Verification credibility: focused projection 56/56, Renderer 48/48, Automation Coordinator 44/44, Kernel protection 84/84, and full non-GUI 392/392",
            "Regression risk: task/thread lease, single active execution, Gap Loop, trusted ledger, fresh-read, Gate, recovery and same-thread closeout code paths and tests remain intact",
            "Minimality: changes are limited to Run query projection, Automation event invalidation, target-run lookup, corresponding tests and stable tech documentation",
            "Environment limitation: experience-realization-electron could not launch under the filesystem sandbox and received SIGABRT before assertions; sandbox escalation was not authorized"
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
        "project_revision": 222,
        "judgments": [
          {
            "invariant_ref": "product-expectations-remain-recoverable",
            "disposition": "not_relevant",
            "reason": "Review 未改变产品能力或业务规则。",
            "fact_refs": [],
            "evidence": [],
            "gap_refs": []
          },
          {
            "invariant_ref": "interaction-expectations-remain-recoverable",
            "disposition": "upheld",
            "reason": "局部 invalidation 仅影响 activity 刷新作用域，事件边界和 Renderer 回归证据一致。",
            "fact_refs": [
              "FACT-20260824-009-002"
            ],
            "evidence": [
              "runtime/arcorbit/desktop/renderer/renderer.js",
              "runtime/arcorbit/test/desktop-renderer.test.mjs",
              "Verification: desktop renderer tests 48 passed, 0 failed"
            ],
            "gap_refs": []
          },
          {
            "invariant_ref": "visual-language-remains-consistent",
            "disposition": "not_relevant",
            "reason": "Review 范围没有视觉变更。",
            "fact_refs": [],
            "evidence": [],
            "gap_refs": []
          },
          {
            "invariant_ref": "technical-decisions-remain-explainable",
            "disposition": "upheld",
            "reason": "技术文档、summary/detail 实现、Renderer invalidation 与目标 Run lookup 边界一致。",
            "fact_refs": [
              "FACT-20260824-009-001",
              "FACT-20260824-009-002",
              "FACT-20260824-009-003"
            ],
            "evidence": [
              "arckit/tech/arcorbit/desktop-execution-solution.md",
              "runtime/arcorbit/src/desktop-run-manager.mjs",
              "runtime/arcorbit/src/automation-coordinator.mjs",
              "runtime/arcorbit/desktop/renderer/renderer.js"
            ],
            "gap_refs": []
          },
          {
            "invariant_ref": "accepted-facts-are-realized",
            "disposition": "upheld",
            "reason": "已接受 CPU 根因、投影边界、局部刷新和 Kernel 保护事实均有生产实现与测试兑现。",
            "fact_refs": [
              "FACT-AUTORUN-CPU-BURST",
              "FACT-FULL-RUN-HYDRATION-HOT-PATH",
              "FACT-KERNEL-LOOP-PROTECTED",
              "FACT-20260824-009-001",
              "FACT-20260824-009-002",
              "FACT-20260824-009-003"
            ],
            "evidence": [
              "Verification: Kernel protection suite 84 passed, 0 failed",
              "Verification: 392 non-GUI tests passed, 0 failed",
              "Benchmark: 75 Run summary 13.63ms/186.19KiB; Automation Snapshot 41.63ms/173.07KiB"
            ],
            "gap_refs": []
          },
          {
            "invariant_ref": "material-risks-have-credible-evidence",
            "disposition": "upheld",
            "reason": "性能、语义保持和回归风险均有分层证据，GUI 环境限制被明确披露且不掩盖为通过。",
            "fact_refs": [
              "FACT-KERNEL-LOOP-PROTECTED",
              "FACT-20260824-009-001",
              "FACT-20260824-009-002",
              "FACT-20260824-009-003"
            ],
            "evidence": [
              "Verification: focused projection 56 passed, Renderer 48 passed, Automation Coordinator 44 passed, Kernel protection 84 passed",
              "Verification: 392 non-GUI tests passed, 0 failed",
              "Environment limitation: Electron GUI fixture received SIGABRT before assertions under sandbox"
            ],
            "gap_refs": []
          }
        ]
      },
      "evidence": [
        "Completion Review: all five dimensions clean",
        "Verification: git diff --check passed",
        "Verification: no ARC_DEBUG, temporary console instrumentation, generated logs, or copied benchmark data remains",
        "Environment limitation: Electron GUI fixture did not execute assertions under sandbox"
      ],
      "runtime_result_ref": "codex-thread://current",
      "occurred_at": "2026-08-24T14:37:52.307Z"
    }
  ],
  "case_resolution": {
    "status": "resolved",
    "stage": "resolved",
    "satisfied": [
      "GAP-ESTABLISH-BOUNDED-AUTOMATION-READ-MODEL",
      "GAP-20260824-009-001",
      "GAP-20260824-009-002"
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
    "updated_at": "2026-08-24T14:37:52.307Z"
  }
}
```

## Round Notes

- Case history is canonical in Structured Record.rounds; keep prose notes exceptional.
