# 修复 ArcOrbit Chat 流式消息架构放大与交互失活

Case: CASE-20260829-001
Status: closed
Artifact Type: code
Selected Gap: none
Updated: 2026-08-29T14:28:33.252Z

## User Intent

按照既定轻量流式架构，消除 Chat 消息上屏期间的刷新饥饿、会话切换迟滞、滚动卡顿与底部定位争抢。

## Structured Record

```json
{
  "schema_version": "development-case-record/v5",
  "id": "CASE-20260829-001",
  "title": "修复 ArcOrbit Chat 流式消息架构放大与交互失活",
  "status": "closed",
  "artifact_type": "code",
  "created_at": "2026-08-29T13:38:25.517Z",
  "updated_at": "2026-08-29T14:28:33.252Z",
  "user_intent": "按照既定轻量流式架构，消除 Chat 消息上屏期间的刷新饥饿、会话切换迟滞、滚动卡顿与底部定位争抢。",
  "expected_outcome": "Chat 流式 delta 以内存投影和有界通知推进，只在语义边界持久化；Renderer 局部、合帧更新稳定消息节点，用户可随时切换会话和脱离底部阅读，并由真实高频 Electron 场景验证。",
  "project_state_ref": "arckit/project/state.record.json",
  "current_round": {
    "goal": "",
    "selected_gap": null
  },
  "facts": [
    {
      "id": "FACT-20260829-001-001",
      "revision": 1,
      "status": "accepted",
      "statement": "ArcOrbit Chat 在消息上屏过程中经常停止显示新消息且无法切换会话；此时滚动明显卡顿并快速抖动，表现为持续争抢底部位置。",
      "basis": "当前操作者在真实 Chat 使用路径中的直接报告。",
      "evidence": [
        "Current operator input, 2026-08-29"
      ]
    },
    {
      "id": "FACT-20260829-001-002",
      "revision": 1,
      "status": "accepted",
      "statement": "当前实现对每个 Agent 或 reasoning delta 串行重写全局 Desktop Store、发送独立 Chat 失效事件、并发拉取完整 snapshot，并在请求前后全量重建会话列表与 transcript；latest-only refresh 在持续事件下可产生投影饥饿，Conversation Surface 的待执行滚底不会被用户滚动意图同步取消。",
      "basis": "Chat Coordinator、Desktop Store、Renderer、Conversation Surface 与既定技术方案的完整静态时序能够同时解释停止上屏、切换迟滞和滚动争抢。",
      "evidence": [
        "runtime/arcorbit/src/chat-coordinator.mjs:369-379,476-503",
        "runtime/arcorbit/src/desktop/desktop-store.mjs:11-53",
        "runtime/arcorbit/desktop/renderer/renderer.js:300-303,1338-1452",
        "runtime/arcorbit/desktop/renderer/chat-state-coordinator.mjs:238-258",
        "runtime/arcorbit/desktop/renderer/conversation-surface.mjs:18-102",
        "arckit/tech/arcorbit/desktop-execution-solution.md:25-30,66-75,118-124"
      ]
    },
    {
      "id": "FACT-20260829-001-003",
      "revision": 1,
      "status": "accepted",
      "statement": "ArcOrbit Chat keeps raw Agent/reasoning deltas in a session-scoped memory projection, emits bounded public message patches, persists semantic boundaries, coalesces structural snapshots, updates stable message nodes, and stops writing scroll position after user scroll intent.",
      "basis": "Implemented main-process, Renderer, Conversation Surface, technical contract, and deterministic high-frequency regression evidence.",
      "evidence": [
        "runtime/arcorbit/src/chat-coordinator.mjs",
        "runtime/arcorbit/desktop/renderer/chat-state-coordinator.mjs",
        "runtime/arcorbit/desktop/renderer/conversation-surface.mjs",
        "runtime/arcorbit/desktop/renderer/renderer.js",
        "arckit/tech/arcorbit/desktop-execution-solution.md",
        "Verification: 76/76 focused tests passed, 2026-08-29"
      ]
    },
    {
      "id": "FACT-20260829-001-004",
      "revision": 1,
      "status": "accepted",
      "statement": "The GUI-capable Electron Chat regression passed while continuously streaming deltas, confirming stable reading position and message/session node identity, zero stream-triggered snapshot reads, and session switching within the 80ms bound.",
      "basis": "Explicit user authorization followed by a successful focused Electron test run.",
      "evidence": [
        "Current user authorization, 2026-08-29",
        "runtime/arcorbit/test/chat-stream-performance-electron.test.mjs",
        "Verification: Electron Chat stream regression 1/1 passed in 1884.892ms, 2026-08-29"
      ]
    }
  ],
  "state_impacts": [
    {
      "id": "IMPACT-20260829-001-001",
      "fact_id": "FACT-20260829-001-003",
      "fact_revision": 1,
      "target": {
        "kind": "software_decision",
        "ref": "technical_foundation",
        "revision": 44
      },
      "effect": "upheld",
      "reason": "Implementation and tech contract realize bounded projection, semantic persistence, and coalesced snapshots.",
      "gap_ids": [],
      "evidence": [
        "arckit/tech/arcorbit/desktop-execution-solution.md",
        "runtime/arcorbit/src/chat-coordinator.mjs",
        "Verification: 76/76 focused tests passed, 2026-08-29"
      ]
    },
    {
      "id": "IMPACT-20260829-001-002",
      "fact_id": "FACT-20260829-001-004",
      "fact_revision": 1,
      "target": {
        "kind": "software_decision",
        "ref": "experience_and_interaction",
        "revision": 62
      },
      "effect": "upheld",
      "reason": "The authorized Electron scenario confirms the expected streaming, scrolling, stable-node, and session-switch behavior under load.",
      "gap_ids": [],
      "evidence": [
        "runtime/arcorbit/test/chat-stream-performance-electron.test.mjs",
        "Verification: Electron Chat stream regression 1/1 passed, 2026-08-29"
      ]
    },
    {
      "id": "IMPACT-20260829-001-003",
      "fact_id": "FACT-20260829-001-004",
      "fact_revision": 1,
      "target": {
        "kind": "software_invariant",
        "ref": "accepted-facts-are-realized",
        "revision": null
      },
      "effect": "upheld",
      "reason": "Deterministic and real Electron evidence jointly establish realization of the accepted Chat architecture and interaction expectations.",
      "gap_ids": [],
      "evidence": [
        "runtime/arcorbit/test/chat-coordinator.test.mjs",
        "runtime/arcorbit/test/desktop-renderer.test.mjs",
        "runtime/arcorbit/test/chat-stream-performance-electron.test.mjs"
      ]
    }
  ],
  "gaps": [
    {
      "id": "GAP-20260829-001-001",
      "status": "resolved",
      "goal": "实现符合既定技术契约的有界 Chat 流式通路，使高频 delta 不再触发逐次全库持久化、无界 snapshot 刷新和全量 transcript 重建，并保证会话切换与用户滚动意图在流式负载下保持响应。",
      "reason": "当前单一路径同时放大磁盘、IPC、渲染和滚动工作，直接威胁 Chat 技术契约、交互体验和现实兑现。",
      "derived_from": [
        "FACT-20260829-001-001",
        "FACT-20260829-001-002"
      ],
      "blocked_by": [],
      "priority_basis": {
        "blocking": "阻塞核心 Chat 的消息可见性和会话控制。",
        "risk": "高；跨 main process、持久化、IPC、Renderer 和滚动状态。",
        "user_impact": "高；真实使用中频繁发生。",
        "verifiability": "可通过高频 delta、会话切换和滚动并发场景验证。"
      },
      "responsibility": "agent",
      "evidence_required": [
        "流式 delta 只更新有界内存投影，持久化发生在明确语义边界或有界检查点。",
        "Renderer 对 Chat 失效采用 single-flight 合并或直接有界增量，不出现持续 supersession 饥饿。",
        "Conversation Surface 保持稳定消息身份并在用户滚动意图出现时取消待执行的自动跟随。",
        "高频流式事件下新消息持续上屏、会话切换及时生效、用户上滚后不被拉回。",
        "相关 Node 与 Electron 回归测试通过，且不破坏 thread、审批、中断、恢复和 Automation 共用 Conversation Surface 的边界。"
      ],
      "resolution": {
        "id": "GAP-20260829-001-001",
        "status": "resolved",
        "outcome": "Chat deltas use a bounded memory projection; semantic boundaries own persistence; Renderer separates stream patches from snapshots; detached readers own scroll position.",
        "reason": "Source and deterministic high-frequency regressions verify the architecture repair; GUI execution is isolated as a separate human-owned verification gap.",
        "evidence": [
          "runtime/arcorbit/src/chat-coordinator.mjs",
          "runtime/arcorbit/desktop/renderer/chat-state-coordinator.mjs",
          "runtime/arcorbit/desktop/renderer/conversation-surface.mjs",
          "runtime/arcorbit/desktop/renderer/renderer.js",
          "runtime/arcorbit/test/chat-coordinator.test.mjs",
          "runtime/arcorbit/test/desktop-renderer.test.mjs",
          "Verification: 76/76 focused tests passed, 2026-08-29"
        ],
        "occurred_at": "2026-08-29T14:11:20.122Z"
      }
    },
    {
      "id": "GAP-20260829-001-002",
      "status": "resolved",
      "goal": "Authorize and run the focused Electron Chat stream regression in a GUI-capable environment, then provide its result.",
      "reason": "The sandbox aborts Electron and escalated GUI execution was declined, so final interaction evidence requires human authorization or execution.",
      "derived_from": [
        "FACT-20260829-001-001",
        "FACT-20260829-001-003"
      ],
      "blocked_by": [],
      "priority_basis": {
        "blocking": "Blocks final interaction acceptance and Completion Review.",
        "risk": "medium",
        "user_impact": "high"
      },
      "responsibility": "human",
      "evidence_required": [
        "Run ARCORBIT_ELECTRON_CHAT_STREAM_PERFORMANCE_TEST=1 node --test runtime/arcorbit/test/chat-stream-performance-electron.test.mjs in an authorized GUI environment.",
        "The test confirms stable scroll and nodes, zero stream-triggered snapshots, and session switch below 80ms."
      ],
      "resolution": {
        "id": "GAP-20260829-001-002",
        "status": "resolved",
        "outcome": "The focused Electron Chat stream regression passes under continuous deltas with stable reading position and nodes, no stream-triggered snapshot, and responsive session switching.",
        "reason": "The user explicitly authorized GUI execution and the dedicated Electron test passed all assertions without skips or failures.",
        "evidence": [
          "Current user authorization, 2026-08-29",
          "runtime/arcorbit/test/chat-stream-performance-electron.test.mjs",
          "runtime/arcorbit/test/fixtures/chat-stream-performance-electron.mjs",
          "Verification: Electron Chat stream regression 1/1 passed in 1884.892ms, 2026-08-29"
        ],
        "occurred_at": "2026-08-29T14:25:15.164Z"
      }
    }
  ],
  "content_revision": 2,
  "completion_review": {
    "status": "clean",
    "policy": {
      "initial_max_cycles": 10,
      "source": "runtime/arcorbit/config/case-policy.json",
      "snapshotted_at": "2026-08-29T13:38:25.517Z"
    },
    "additional_cycles_authorized": 0,
    "cycle_count": 1,
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
          "runtime/arcorbit/src/chat-coordinator.mjs",
          "runtime/arcorbit/desktop/renderer/chat-state-coordinator.mjs",
          "runtime/arcorbit/desktop/renderer/conversation-surface.mjs",
          "runtime/arcorbit/desktop/renderer/renderer.js",
          "arckit/tech/arcorbit/desktop-execution-solution.md",
          "runtime/arcorbit/test/chat-coordinator.test.mjs",
          "runtime/arcorbit/test/desktop-renderer.test.mjs",
          "runtime/arcorbit/test/chat-stream-performance-electron.test.mjs",
          "Verification: focused Node tests 76/76 passed, 2026-08-29",
          "Verification: authorized Electron Chat stream regression 1/1 passed, 2026-08-29",
          "Verification: full Runtime audit 535 passed and 22 skipped; two unrelated pre-existing Electron GUI tests aborted in the sandbox before assertions, 2026-08-29",
          "Verification: git diff --check passed, 2026-08-29"
        ],
        "occurred_at": "2026-08-29T14:28:33.252Z"
      }
    ],
    "evidence": [
      "runtime/arcorbit/src/chat-coordinator.mjs",
      "runtime/arcorbit/desktop/renderer/chat-state-coordinator.mjs",
      "runtime/arcorbit/desktop/renderer/conversation-surface.mjs",
      "runtime/arcorbit/desktop/renderer/renderer.js",
      "arckit/tech/arcorbit/desktop-execution-solution.md",
      "runtime/arcorbit/test/chat-coordinator.test.mjs",
      "runtime/arcorbit/test/desktop-renderer.test.mjs",
      "runtime/arcorbit/test/chat-stream-performance-electron.test.mjs",
      "Verification: focused Node tests 76/76 passed, 2026-08-29",
      "Verification: authorized Electron Chat stream regression 1/1 passed, 2026-08-29",
      "Verification: full Runtime audit 535 passed and 22 skipped; two unrelated pre-existing Electron GUI tests aborted in the sandbox before assertions, 2026-08-29",
      "Verification: git diff --check passed, 2026-08-29"
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
      "goal": "Accept the bounded Chat streaming implementation and isolate GUI Electron verification as an explicit human-owned gate.",
      "outcome": "needs_human",
      "gap_selection": {
        "mode": "candidate",
        "basis": "The confirmed architecture amplification is the only ready gap in this bounded Chat Case and blocks a core user journey.",
        "snapshot_token": "08f94992ff31115a2bd9ee4a6061194c39d8f42a023b46cce4a607aa117c749e",
        "selected_ref": "case-gap:CASE-20260829-001:GAP-20260829-001-001",
        "comparison_summary": "Compared the user-blocking Chat gap with all four broader Project candidates; Project candidates remain out of scope.",
        "fresh_discovery_summary": "Implementation and deterministic tests close the architecture defect; the GUI Electron scenario remains unexecuted because authorization was declined.",
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
            "reason": "Broader Project validation remains outside this Case."
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
            "reason": "Broader Runtime resilience remains outside this Case."
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
            "reason": "Permission-bearing project validation remains outside this Case."
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
            "reason": "Cross-record auditing remains outside this Case."
          },
          {
            "ref": "case-gap:CASE-20260829-001:GAP-20260829-001-001",
            "source": "persisted",
            "eligibility": "ready",
            "disposition": "selected",
            "priority_basis": {
              "blocking": "high",
              "risk": "high",
              "user_impact": "high"
            },
            "reason": "It directly explains and repairs the reported freeze, switch latency, jank, and scroll contention."
          }
        ]
      },
      "selected_gap": {
        "id": "GAP-20260829-001-001",
        "responsibility": "agent",
        "goal": "实现符合既定技术契约的有界 Chat 流式通路，使高频 delta 不再触发逐次全库持久化、无界 snapshot 刷新和全量 transcript 重建，并保证会话切换与用户滚动意图在流式负载下保持响应。",
        "reason": "当前单一路径同时放大磁盘、IPC、渲染和滚动工作，直接威胁 Chat 技术契约、交互体验和现实兑现。",
        "derived_from": [
          "FACT-20260829-001-001",
          "FACT-20260829-001-002"
        ],
        "blocked_by": [],
        "priority_basis": {
          "blocking": "阻塞核心 Chat 的消息可见性和会话控制。",
          "uncertainty": "",
          "risk": "高；跨 main process、持久化、IPC、Renderer 和滚动状态。",
          "user_impact": "高；真实使用中频繁发生。",
          "verifiability": "可通过高频 delta、会话切换和滚动并发场景验证。"
        },
        "evidence_required": [
          "流式 delta 只更新有界内存投影，持久化发生在明确语义边界或有界检查点。",
          "Renderer 对 Chat 失效采用 single-flight 合并或直接有界增量，不出现持续 supersession 饥饿。",
          "Conversation Surface 保持稳定消息身份并在用户滚动意图出现时取消待执行的自动跟随。",
          "高频流式事件下新消息持续上屏、会话切换及时生效、用户上滚后不被拉回。",
          "相关 Node 与 Electron 回归测试通过，且不破坏 thread、审批、中断、恢复和 Automation 共用 Conversation Surface 的边界。"
        ]
      },
      "planned_transition": {
        "goal": "Accept the bounded Chat streaming implementation and isolate GUI Electron verification as an explicit human-owned gate.",
        "expected_state_change": "Resolve the implementation gap, uphold the technical decision, and retain an interaction realization check until Electron can run."
      },
      "accepted_state_delta": {
        "resolved_gap": {
          "id": "GAP-20260829-001-001",
          "status": "resolved",
          "outcome": "Chat deltas use a bounded memory projection; semantic boundaries own persistence; Renderer separates stream patches from snapshots; detached readers own scroll position.",
          "reason": "Source and deterministic high-frequency regressions verify the architecture repair; GUI execution is isolated as a separate human-owned verification gap.",
          "evidence": [
            "runtime/arcorbit/src/chat-coordinator.mjs",
            "runtime/arcorbit/desktop/renderer/chat-state-coordinator.mjs",
            "runtime/arcorbit/desktop/renderer/conversation-surface.mjs",
            "runtime/arcorbit/desktop/renderer/renderer.js",
            "runtime/arcorbit/test/chat-coordinator.test.mjs",
            "runtime/arcorbit/test/desktop-renderer.test.mjs",
            "Verification: 76/76 focused tests passed, 2026-08-29"
          ]
        },
        "facts_added": [
          {
            "id": "FACT-20260829-001-003",
            "revision": 1,
            "status": "accepted",
            "statement": "ArcOrbit Chat keeps raw Agent/reasoning deltas in a session-scoped memory projection, emits bounded public message patches, persists semantic boundaries, coalesces structural snapshots, updates stable message nodes, and stops writing scroll position after user scroll intent.",
            "basis": "Implemented main-process, Renderer, Conversation Surface, technical contract, and deterministic high-frequency regression evidence.",
            "evidence": [
              "runtime/arcorbit/src/chat-coordinator.mjs",
              "runtime/arcorbit/desktop/renderer/chat-state-coordinator.mjs",
              "runtime/arcorbit/desktop/renderer/conversation-surface.mjs",
              "runtime/arcorbit/desktop/renderer/renderer.js",
              "arckit/tech/arcorbit/desktop-execution-solution.md",
              "Verification: 76/76 focused tests passed, 2026-08-29"
            ]
          }
        ],
        "facts_superseded": [],
        "impacts_added": [],
        "impacts_updated": [
          {
            "id": "IMPACT-20260829-001-001",
            "fact_id": "FACT-20260829-001-003",
            "fact_revision": 1,
            "target": {
              "kind": "software_decision",
              "ref": "technical_foundation",
              "revision": 44
            },
            "effect": "upheld",
            "reason": "Implementation and tech contract realize bounded projection, semantic persistence, and coalesced snapshots.",
            "gap_ids": [],
            "evidence": [
              "arckit/tech/arcorbit/desktop-execution-solution.md",
              "runtime/arcorbit/src/chat-coordinator.mjs",
              "Verification: 76/76 focused tests passed, 2026-08-29"
            ]
          },
          {
            "id": "IMPACT-20260829-001-002",
            "fact_id": "FACT-20260829-001-003",
            "fact_revision": 1,
            "target": {
              "kind": "software_decision",
              "ref": "experience_and_interaction",
              "revision": 62
            },
            "effect": "undetermined",
            "reason": "Deterministic tests uphold scroll ownership and refresh isolation, but authorized GUI Electron evidence is unavailable.",
            "gap_ids": [
              "GAP-20260829-001-002"
            ],
            "evidence": [
              "runtime/arcorbit/test/desktop-renderer.test.mjs",
              "runtime/arcorbit/test/chat-stream-performance-electron.test.mjs",
              "Electron sandbox SIGABRT and declined escalation, 2026-08-29"
            ]
          },
          {
            "id": "IMPACT-20260829-001-003",
            "fact_id": "FACT-20260829-001-003",
            "fact_revision": 1,
            "target": {
              "kind": "software_invariant",
              "ref": "accepted-facts-are-realized",
              "revision": null
            },
            "effect": "undetermined",
            "reason": "Implementation is aligned; final real Electron interaction evidence still requires authorization.",
            "gap_ids": [
              "GAP-20260829-001-002"
            ],
            "evidence": [
              "runtime/arcorbit/test/chat-coordinator.test.mjs",
              "runtime/arcorbit/test/desktop-renderer.test.mjs",
              "runtime/arcorbit/test/chat-stream-performance-electron.test.mjs"
            ]
          }
        ],
        "gaps_added": [
          {
            "id": "GAP-20260829-001-002",
            "status": "open",
            "goal": "Authorize and run the focused Electron Chat stream regression in a GUI-capable environment, then provide its result.",
            "reason": "The sandbox aborts Electron and escalated GUI execution was declined, so final interaction evidence requires human authorization or execution.",
            "derived_from": [
              "FACT-20260829-001-001",
              "FACT-20260829-001-003"
            ],
            "blocked_by": [],
            "priority_basis": {
              "blocking": "Blocks final interaction acceptance and Completion Review.",
              "risk": "medium",
              "user_impact": "high"
            },
            "responsibility": "human",
            "evidence_required": [
              "Run ARCORBIT_ELECTRON_CHAT_STREAM_PERFORMANCE_TEST=1 node --test runtime/arcorbit/test/chat-stream-performance-electron.test.mjs in an authorized GUI environment.",
              "The test confirms stable scroll and nodes, zero stream-triggered snapshots, and session switch below 80ms."
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
        "project_revision": 317,
        "judgments": [
          {
            "invariant_ref": "product-expectations-remain-recoverable",
            "disposition": "upheld",
            "reason": "Chat expectations and the refreshed data-flow contract remain explicit and recoverable.",
            "fact_refs": [
              "FACT-20260829-001-003"
            ],
            "evidence": [
              "arckit/interaction/chat-workspace/interaction.md",
              "arckit/tech/arcorbit/desktop-execution-solution.md"
            ],
            "gap_refs": []
          },
          {
            "invariant_ref": "interaction-expectations-remain-recoverable",
            "disposition": "undetermined",
            "reason": "Expected behavior is recoverable but final GUI realization evidence needs authorized Electron execution.",
            "fact_refs": [
              "FACT-20260829-001-001",
              "FACT-20260829-001-003"
            ],
            "evidence": [
              "arckit/interaction/chat-workspace/interaction.md",
              "runtime/arcorbit/test/desktop-renderer.test.mjs"
            ],
            "gap_refs": [
              "GAP-20260829-001-002"
            ]
          },
          {
            "invariant_ref": "visual-language-remains-consistent",
            "disposition": "not_relevant",
            "reason": "No visual token, layout, or component appearance changes.",
            "fact_refs": [],
            "evidence": [],
            "gap_refs": []
          },
          {
            "invariant_ref": "technical-decisions-remain-explainable",
            "disposition": "upheld",
            "reason": "Source and tech solution separate delta, stream patch, persistence, snapshot, and scroll ownership.",
            "fact_refs": [
              "FACT-20260829-001-003"
            ],
            "evidence": [
              "arckit/tech/arcorbit/desktop-execution-solution.md",
              "runtime/arcorbit/src/chat-coordinator.mjs",
              "runtime/arcorbit/desktop/renderer/chat-state-coordinator.mjs"
            ],
            "gap_refs": []
          },
          {
            "invariant_ref": "accepted-facts-are-realized",
            "disposition": "undetermined",
            "reason": "Source and deterministic tests align, but the reported real interaction path lacks authorized Electron evidence.",
            "fact_refs": [
              "FACT-20260829-001-001",
              "FACT-20260829-001-003"
            ],
            "evidence": [
              "runtime/arcorbit/test/chat-coordinator.test.mjs",
              "runtime/arcorbit/test/desktop-renderer.test.mjs"
            ],
            "gap_refs": [
              "GAP-20260829-001-002"
            ]
          },
          {
            "invariant_ref": "material-risks-have-credible-evidence",
            "disposition": "undetermined",
            "reason": "Core risks have deterministic evidence; the GUI integration risk is bounded by the Electron verification gap.",
            "fact_refs": [
              "FACT-20260829-001-003"
            ],
            "evidence": [
              "Verification: 76/76 focused tests passed, 2026-08-29",
              "Full audit: 535 passed, 22 skipped, 2 sandbox Electron SIGABRT failures, 2026-08-29",
              "runtime/arcorbit/test/chat-stream-performance-electron.test.mjs"
            ],
            "gap_refs": [
              "GAP-20260829-001-002"
            ]
          }
        ]
      },
      "evidence": [
        "runtime/arcorbit/src/chat-coordinator.mjs",
        "runtime/arcorbit/desktop/renderer/chat-state-coordinator.mjs",
        "runtime/arcorbit/desktop/renderer/conversation-surface.mjs",
        "runtime/arcorbit/desktop/renderer/renderer.js",
        "runtime/arcorbit/test/chat-coordinator.test.mjs",
        "runtime/arcorbit/test/desktop-renderer.test.mjs",
        "runtime/arcorbit/test/chat-stream-performance-electron.test.mjs",
        "arckit/tech/arcorbit/desktop-execution-solution.md",
        "Verification: 76/76 focused tests passed, 2026-08-29",
        "Full audit: 535 passed, 22 skipped, 2 sandbox Electron SIGABRT failures, 2026-08-29"
      ],
      "runtime_result_ref": "",
      "occurred_at": "2026-08-29T14:11:20.122Z"
    },
    {
      "round": 2,
      "transition_schema_version": "arckit-case-transition/v8",
      "goal": "Execute and accept the authorized focused Electron Chat stream regression.",
      "outcome": "completed",
      "gap_selection": {
        "mode": "candidate",
        "basis": "The user supplied the required GUI execution authorization, making the sole ready Chat verification gap directly executable.",
        "snapshot_token": "664d879ba0b104e8c34454af3f49ccea9b0a102189036417ac2aa72b2a983f9a",
        "selected_ref": "case-gap:CASE-20260829-001:GAP-20260829-001-002",
        "comparison_summary": "Compared the authorized Chat verification with all broader Project candidates; unrelated Project work remains deferred.",
        "fresh_discovery_summary": "No additional fresh gap appeared; the focused Electron regression passed all bounded interaction assertions.",
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
            "reason": "Broader Project validation remains outside this Case."
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
            "reason": "Broader Runtime resilience remains outside this Case."
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
            "reason": "Permission-bearing project validation remains outside this Case."
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
            "reason": "Cross-record auditing remains outside this Case."
          },
          {
            "ref": "case-gap:CASE-20260829-001:GAP-20260829-001-002",
            "source": "persisted",
            "eligibility": "ready",
            "disposition": "selected",
            "priority_basis": {
              "blocking": "high",
              "risk": "medium",
              "user_impact": "high"
            },
            "reason": "The user authorized the only missing real interaction verification and it blocks Completion Review."
          }
        ]
      },
      "selected_gap": {
        "id": "GAP-20260829-001-002",
        "responsibility": "human",
        "goal": "Authorize and run the focused Electron Chat stream regression in a GUI-capable environment, then provide its result.",
        "reason": "The sandbox aborts Electron and escalated GUI execution was declined, so final interaction evidence requires human authorization or execution.",
        "derived_from": [
          "FACT-20260829-001-001",
          "FACT-20260829-001-003"
        ],
        "blocked_by": [],
        "priority_basis": {
          "blocking": "Blocks final interaction acceptance and Completion Review.",
          "uncertainty": "",
          "risk": "medium",
          "user_impact": "high"
        },
        "evidence_required": [
          "Run ARCORBIT_ELECTRON_CHAT_STREAM_PERFORMANCE_TEST=1 node --test runtime/arcorbit/test/chat-stream-performance-electron.test.mjs in an authorized GUI environment.",
          "The test confirms stable scroll and nodes, zero stream-triggered snapshots, and session switch below 80ms."
        ]
      },
      "planned_transition": {
        "goal": "Execute and accept the authorized focused Electron Chat stream regression.",
        "expected_state_change": "Resolve the GUI verification gap and uphold the remaining interaction and realization impacts."
      },
      "accepted_state_delta": {
        "resolved_gap": {
          "id": "GAP-20260829-001-002",
          "status": "resolved",
          "outcome": "The focused Electron Chat stream regression passes under continuous deltas with stable reading position and nodes, no stream-triggered snapshot, and responsive session switching.",
          "reason": "The user explicitly authorized GUI execution and the dedicated Electron test passed all assertions without skips or failures.",
          "evidence": [
            "Current user authorization, 2026-08-29",
            "runtime/arcorbit/test/chat-stream-performance-electron.test.mjs",
            "runtime/arcorbit/test/fixtures/chat-stream-performance-electron.mjs",
            "Verification: Electron Chat stream regression 1/1 passed in 1884.892ms, 2026-08-29"
          ]
        },
        "facts_added": [
          {
            "id": "FACT-20260829-001-004",
            "revision": 1,
            "status": "accepted",
            "statement": "The GUI-capable Electron Chat regression passed while continuously streaming deltas, confirming stable reading position and message/session node identity, zero stream-triggered snapshot reads, and session switching within the 80ms bound.",
            "basis": "Explicit user authorization followed by a successful focused Electron test run.",
            "evidence": [
              "Current user authorization, 2026-08-29",
              "runtime/arcorbit/test/chat-stream-performance-electron.test.mjs",
              "Verification: Electron Chat stream regression 1/1 passed in 1884.892ms, 2026-08-29"
            ]
          }
        ],
        "facts_superseded": [],
        "impacts_added": [],
        "impacts_updated": [
          {
            "id": "IMPACT-20260829-001-002",
            "fact_id": "FACT-20260829-001-004",
            "fact_revision": 1,
            "target": {
              "kind": "software_decision",
              "ref": "experience_and_interaction",
              "revision": 62
            },
            "effect": "upheld",
            "reason": "The authorized Electron scenario confirms the expected streaming, scrolling, stable-node, and session-switch behavior under load.",
            "gap_ids": [],
            "evidence": [
              "runtime/arcorbit/test/chat-stream-performance-electron.test.mjs",
              "Verification: Electron Chat stream regression 1/1 passed, 2026-08-29"
            ]
          },
          {
            "id": "IMPACT-20260829-001-003",
            "fact_id": "FACT-20260829-001-004",
            "fact_revision": 1,
            "target": {
              "kind": "software_invariant",
              "ref": "accepted-facts-are-realized",
              "revision": null
            },
            "effect": "upheld",
            "reason": "Deterministic and real Electron evidence jointly establish realization of the accepted Chat architecture and interaction expectations.",
            "gap_ids": [],
            "evidence": [
              "runtime/arcorbit/test/chat-coordinator.test.mjs",
              "runtime/arcorbit/test/desktop-renderer.test.mjs",
              "runtime/arcorbit/test/chat-stream-performance-electron.test.mjs"
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
        "project_revision": 317,
        "judgments": [
          {
            "invariant_ref": "product-expectations-remain-recoverable",
            "disposition": "upheld",
            "reason": "Chat expectations and the bounded streaming contract remain explicit and recoverable.",
            "fact_refs": [
              "FACT-20260829-001-003",
              "FACT-20260829-001-004"
            ],
            "evidence": [
              "arckit/interaction/chat-workspace/interaction.md",
              "arckit/tech/arcorbit/desktop-execution-solution.md"
            ],
            "gap_refs": []
          },
          {
            "invariant_ref": "interaction-expectations-remain-recoverable",
            "disposition": "upheld",
            "reason": "The interaction contract is recoverable and the authorized Electron regression directly verifies it under continuous streaming.",
            "fact_refs": [
              "FACT-20260829-001-004"
            ],
            "evidence": [
              "arckit/interaction/chat-workspace/interaction.md",
              "runtime/arcorbit/test/chat-stream-performance-electron.test.mjs",
              "Verification: Electron regression 1/1 passed, 2026-08-29"
            ],
            "gap_refs": []
          },
          {
            "invariant_ref": "visual-language-remains-consistent",
            "disposition": "not_relevant",
            "reason": "No visual language change is introduced or assessed by this verification.",
            "fact_refs": [],
            "evidence": [],
            "gap_refs": []
          },
          {
            "invariant_ref": "technical-decisions-remain-explainable",
            "disposition": "upheld",
            "reason": "The documented and implemented delta, patch, snapshot, persistence, and scroll boundaries remain aligned.",
            "fact_refs": [
              "FACT-20260829-001-003",
              "FACT-20260829-001-004"
            ],
            "evidence": [
              "arckit/tech/arcorbit/desktop-execution-solution.md",
              "runtime/arcorbit/src/chat-coordinator.mjs",
              "runtime/arcorbit/desktop/renderer/chat-state-coordinator.mjs"
            ],
            "gap_refs": []
          },
          {
            "invariant_ref": "accepted-facts-are-realized",
            "disposition": "upheld",
            "reason": "Focused Node and authorized Electron evidence confirm the accepted architecture and interaction facts are realized.",
            "fact_refs": [
              "FACT-20260829-001-003",
              "FACT-20260829-001-004"
            ],
            "evidence": [
              "Verification: 76/76 focused Node tests passed, 2026-08-29",
              "Verification: Electron regression 1/1 passed, 2026-08-29"
            ],
            "gap_refs": []
          },
          {
            "invariant_ref": "material-risks-have-credible-evidence",
            "disposition": "upheld",
            "reason": "Persistence amplification, refresh starvation, snapshot races, DOM identity, scroll contention, and switch responsiveness all have direct regression evidence.",
            "fact_refs": [
              "FACT-20260829-001-003",
              "FACT-20260829-001-004"
            ],
            "evidence": [
              "runtime/arcorbit/test/chat-coordinator.test.mjs",
              "runtime/arcorbit/test/desktop-renderer.test.mjs",
              "runtime/arcorbit/test/chat-stream-performance-electron.test.mjs",
              "Verification: Electron regression 1/1 passed, 2026-08-29"
            ],
            "gap_refs": []
          }
        ]
      },
      "evidence": [
        "Current user authorization, 2026-08-29",
        "runtime/arcorbit/test/chat-stream-performance-electron.test.mjs",
        "runtime/arcorbit/test/fixtures/chat-stream-performance-electron.mjs",
        "Verification: Electron Chat stream regression 1/1 passed in 1884.892ms, 2026-08-29"
      ],
      "runtime_result_ref": "",
      "occurred_at": "2026-08-29T14:25:15.164Z"
    },
    {
      "round": 3,
      "transition_schema_version": "arckit-case-transition/v8",
      "goal": "Review implementation correctness, real problem resolution, verification credibility, regression risk, and minimality for Chat content revision 2.",
      "outcome": "completed",
      "gap_selection": {
        "mode": "candidate",
        "basis": "All ordinary Chat gaps and their state impacts are closed, so the canonical Completion Review is the only ready candidate that can finish this bounded Case.",
        "snapshot_token": "0a69e0cf52744872d498be6782dd344006b4fa69692b278fb072793744455190",
        "selected_ref": "case-gap:CASE-20260829-001:CASE-20260829-001:completion-review:1",
        "comparison_summary": "Compared the ready Case Completion Review with all four broader Project gaps; those Project gaps require separate Cases and do not block review of this completed Chat repair.",
        "fresh_discovery_summary": "Focused source review, deterministic Node regressions, the authorized Electron stream scenario, and diff validation found no new gap or review finding.",
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
            "reason": "This broader scenario-evaluation obligation requires a separate Case and is outside the bounded Chat repair review."
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
            "reason": "This broader Runtime resilience obligation requires a separate Case and is not a finding in the Chat stream implementation."
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
            "reason": "This real-project security validation requires its own permission-bearing Case and is unrelated to the local Chat rendering path."
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
            "reason": "This cross-record audit obligation remains a separate Project gap and is not needed to judge this Case content revision."
          },
          {
            "ref": "case-gap:CASE-20260829-001:CASE-20260829-001:completion-review:1",
            "source": "persisted",
            "eligibility": "ready",
            "disposition": "selected",
            "priority_basis": {
              "blocking": "high",
              "uncertainty": "low",
              "risk": "high",
              "user_impact": "high"
            },
            "reason": "It is the canonical final gate after both ordinary Chat gaps and all state impacts were closed."
          }
        ]
      },
      "selected_gap": {
        "id": "CASE-20260829-001:completion-review:1",
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
        "goal": "Review implementation correctness, real problem resolution, verification credibility, regression risk, and minimality for Chat content revision 2.",
        "expected_state_change": "Accept a clean five-dimension Completion Review and resolve the Case without changing Case content or Project State."
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
            "runtime/arcorbit/src/chat-coordinator.mjs",
            "runtime/arcorbit/desktop/renderer/chat-state-coordinator.mjs",
            "runtime/arcorbit/desktop/renderer/conversation-surface.mjs",
            "runtime/arcorbit/desktop/renderer/renderer.js",
            "arckit/tech/arcorbit/desktop-execution-solution.md",
            "runtime/arcorbit/test/chat-coordinator.test.mjs",
            "runtime/arcorbit/test/desktop-renderer.test.mjs",
            "runtime/arcorbit/test/chat-stream-performance-electron.test.mjs",
            "Verification: focused Node tests 76/76 passed, 2026-08-29",
            "Verification: authorized Electron Chat stream regression 1/1 passed, 2026-08-29",
            "Verification: full Runtime audit 535 passed and 22 skipped; two unrelated pre-existing Electron GUI tests aborted in the sandbox before assertions, 2026-08-29",
            "Verification: git diff --check passed, 2026-08-29"
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
        "project_revision": 317,
        "judgments": [
          {
            "invariant_ref": "product-expectations-remain-recoverable",
            "disposition": "upheld",
            "reason": "Completion Review confirms the Chat behavior and bounded-streaming contract remain explicit and recoverable.",
            "fact_refs": [
              "FACT-20260829-001-003",
              "FACT-20260829-001-004"
            ],
            "evidence": [
              "arckit/interaction/chat-workspace/interaction.md",
              "arckit/tech/arcorbit/desktop-execution-solution.md"
            ],
            "gap_refs": []
          },
          {
            "invariant_ref": "interaction-expectations-remain-recoverable",
            "disposition": "upheld",
            "reason": "The authorized Electron scenario verifies continuous streaming, detached reading, stable nodes, and responsive session switching.",
            "fact_refs": [
              "FACT-20260829-001-004"
            ],
            "evidence": [
              "arckit/interaction/chat-workspace/interaction.md",
              "runtime/arcorbit/test/chat-stream-performance-electron.test.mjs",
              "Verification: Electron regression 1/1 passed, 2026-08-29"
            ],
            "gap_refs": []
          },
          {
            "invariant_ref": "visual-language-remains-consistent",
            "disposition": "not_relevant",
            "reason": "The Case changes rendering mechanics and state ownership without changing the accepted visual language.",
            "fact_refs": [],
            "evidence": [],
            "gap_refs": []
          },
          {
            "invariant_ref": "technical-decisions-remain-explainable",
            "disposition": "upheld",
            "reason": "Source and technical contract align on in-memory deltas, bounded patches, semantic persistence, coalesced structural snapshots, and explicit scroll ownership.",
            "fact_refs": [
              "FACT-20260829-001-003",
              "FACT-20260829-001-004"
            ],
            "evidence": [
              "arckit/tech/arcorbit/desktop-execution-solution.md",
              "runtime/arcorbit/src/chat-coordinator.mjs",
              "runtime/arcorbit/desktop/renderer/chat-state-coordinator.mjs",
              "runtime/arcorbit/desktop/renderer/conversation-surface.mjs"
            ],
            "gap_refs": []
          },
          {
            "invariant_ref": "accepted-facts-are-realized",
            "disposition": "upheld",
            "reason": "Focused Node and authorized Electron evidence jointly realize the accepted Chat architecture and interaction facts.",
            "fact_refs": [
              "FACT-20260829-001-003",
              "FACT-20260829-001-004"
            ],
            "evidence": [
              "Verification: focused Node tests 76/76 passed, 2026-08-29",
              "Verification: Electron regression 1/1 passed, 2026-08-29"
            ],
            "gap_refs": []
          },
          {
            "invariant_ref": "material-risks-have-credible-evidence",
            "disposition": "upheld",
            "reason": "Direct regressions cover persistence amplification, refresh starvation, snapshot races, DOM identity, scroll contention, session switching, thread continuity, approval, interrupt, and recovery boundaries.",
            "fact_refs": [
              "FACT-20260829-001-003",
              "FACT-20260829-001-004"
            ],
            "evidence": [
              "runtime/arcorbit/test/chat-coordinator.test.mjs",
              "runtime/arcorbit/test/desktop-renderer.test.mjs",
              "runtime/arcorbit/test/chat-stream-performance-electron.test.mjs",
              "Verification: focused Node tests 76/76 and Electron regression 1/1 passed, 2026-08-29"
            ],
            "gap_refs": []
          }
        ]
      },
      "evidence": [
        "runtime/arcorbit/src/chat-coordinator.mjs",
        "runtime/arcorbit/desktop/renderer/chat-state-coordinator.mjs",
        "runtime/arcorbit/desktop/renderer/conversation-surface.mjs",
        "runtime/arcorbit/desktop/renderer/renderer.js",
        "arckit/tech/arcorbit/desktop-execution-solution.md",
        "runtime/arcorbit/test/chat-coordinator.test.mjs",
        "runtime/arcorbit/test/desktop-renderer.test.mjs",
        "runtime/arcorbit/test/chat-stream-performance-electron.test.mjs",
        "Verification: focused Node tests 76/76 passed and authorized Electron regression 1/1 passed, 2026-08-29",
        "Verification: git diff --check passed, 2026-08-29"
      ],
      "runtime_result_ref": "",
      "occurred_at": "2026-08-29T14:28:33.252Z"
    }
  ],
  "case_resolution": {
    "status": "resolved",
    "stage": "resolved",
    "satisfied": [
      "GAP-20260829-001-001",
      "GAP-20260829-001-002"
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
    "updated_at": "2026-08-29T14:28:33.252Z"
  }
}
```

## Round Notes

- Case history is canonical in Structured Record.rounds; keep prose notes exceptional.
