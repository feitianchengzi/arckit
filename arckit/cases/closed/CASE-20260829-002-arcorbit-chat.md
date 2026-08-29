# 隔离 ArcOrbit Chat 跨会话滚动所有权

Case: CASE-20260829-002
Status: closed
Artifact Type: code
Selected Gap: none
Updated: 2026-08-29T15:50:07.539Z

## User Intent

修复 A 会话持续输出时切换到 B 会话后，A 的待执行自动滚动与共享跟随状态影响 B 消息列表定位的问题。

## Structured Record

```json
{
  "schema_version": "development-case-record/v5",
  "id": "CASE-20260829-002",
  "title": "隔离 ArcOrbit Chat 跨会话滚动所有权",
  "status": "closed",
  "artifact_type": "code",
  "created_at": "2026-08-29T15:02:52.585Z",
  "updated_at": "2026-08-29T15:50:07.539Z",
  "user_intent": "修复 A 会话持续输出时切换到 B 会话后，A 的待执行自动滚动与共享跟随状态影响 B 消息列表定位的问题。",
  "expected_outcome": "Conversation Surface 的滚动所有权按 session 隔离；切换会话使旧会话待执行滚动失效，目标会话恢复自己的阅读状态，后台会话持续输出不改变当前会话的位置。",
  "project_state_ref": "arckit/project/state.record.json",
  "current_round": {
    "goal": "",
    "selected_gap": null
  },
  "facts": [
    {
      "id": "FACT-20260829-002-001",
      "revision": 1,
      "status": "accepted",
      "statement": "ArcOrbit Chat 使用单个页面级 Conversation Surface 保存 followingLatest 与 pending render scroll；切换会话时旧 rAF 不失效且 Renderer 无条件调用 followLatest，因此 A 持续输出时切到 B 会话可改变 B 的滚动和定位。",
      "basis": "当前操作者的真实路径报告与 Conversation Surface、Renderer、现有 Electron 回归的完整静态时序 100% 匹配。",
      "evidence": [
        "Current operator input, 2026-08-29",
        "runtime/arcorbit/desktop/renderer/conversation-surface.mjs:20-61,140-145",
        "runtime/arcorbit/desktop/renderer/renderer.js:1457-1460",
        "runtime/arcorbit/test/chat-stream-performance-electron.test.mjs:23-31"
      ]
    },
    {
      "id": "FACT-20260829-002-002",
      "revision": 1,
      "status": "accepted",
      "statement": "Chat Conversation Surface maintains follow state and detached scroll position per session context, invalidates queued auto-follow frames when context changes, restores the target session state, and Renderer no longer forces follow-latest after selection.",
      "basis": "Implemented source, stable interaction/technical contracts, and deterministic cross-context regression evidence.",
      "evidence": [
        "runtime/arcorbit/desktop/renderer/conversation-surface.mjs",
        "runtime/arcorbit/desktop/renderer/renderer.js",
        "runtime/arcorbit/test/desktop-renderer.test.mjs",
        "arckit/interaction/chat-workspace/interaction.md",
        "arckit/tech/arcorbit/desktop-execution-solution.md",
        "Verification: focused Node tests 77/77 passed, 2026-08-29"
      ]
    },
    {
      "id": "FACT-20260829-002-003",
      "revision": 1,
      "status": "accepted",
      "statement": "The expanded Electron regression covers B-session position restoration during continued A-session deltas and an A terminal structural refresh, but the authorized GUI launch request was rejected and sandbox execution fails before assertions.",
      "basis": "Current execution authority response and focused sandbox test output.",
      "evidence": [
        "Current GUI escalation response: rejected, 2026-08-29",
        "runtime/arcorbit/test/chat-stream-performance-electron.test.mjs",
        "runtime/arcorbit/test/fixtures/chat-stream-performance-electron.mjs",
        "Verification: sandbox Electron launch failed before assertions, 2026-08-29"
      ]
    },
    {
      "id": "FACT-20260829-002-004",
      "revision": 1,
      "status": "accepted",
      "statement": "In an authorized real Electron run, switching from continuously streaming session A to detached-reading session B preserved B's scroll position and target message node through later A deltas and A's structural terminal refresh, with zero stream snapshots and responsive switching.",
      "basis": "Focused Electron integration regression passed all cross-session isolation and responsiveness assertions.",
      "evidence": [
        "Verification: authorized Electron cross-session Chat regression passed 1/1 in 2838 ms, 2026-08-29",
        "runtime/arcorbit/test/chat-stream-performance-electron.test.mjs",
        "runtime/arcorbit/test/fixtures/chat-stream-performance-electron.mjs"
      ]
    }
  ],
  "state_impacts": [
    {
      "id": "IMPACT-20260829-002-001",
      "fact_id": "FACT-20260829-002-001",
      "fact_revision": 1,
      "target": {
        "kind": "software_decision",
        "ref": "experience_and_interaction",
        "revision": 62
      },
      "effect": "upheld",
      "reason": "The interaction contract is now backed by deterministic unit evidence and an authorized real Electron cross-session regression proving session-isolated reading position and scroll ownership.",
      "gap_ids": [],
      "evidence": [
        "arckit/interaction/chat-workspace/interaction.md",
        "runtime/arcorbit/test/desktop-renderer.test.mjs",
        "runtime/arcorbit/test/chat-stream-performance-electron.test.mjs",
        "Verification: authorized Electron cross-session Chat regression passed 1/1, 2026-08-29"
      ]
    },
    {
      "id": "IMPACT-20260829-002-002",
      "fact_id": "FACT-20260829-002-001",
      "fact_revision": 1,
      "target": {
        "kind": "software_decision",
        "ref": "technical_foundation",
        "revision": 44
      },
      "effect": "upheld",
      "reason": "The implementation and technical contract now make asynchronous scroll state and frame ownership session-scoped.",
      "gap_ids": [],
      "evidence": [
        "arckit/tech/arcorbit/desktop-execution-solution.md",
        "runtime/arcorbit/desktop/renderer/conversation-surface.mjs",
        "Verification: focused Node tests 77/77 passed, 2026-08-29"
      ]
    }
  ],
  "gaps": [
    {
      "id": "GAP-20260829-002-001",
      "status": "resolved",
      "goal": "使 Chat Conversation Surface 的跟随状态、阅读位置和待执行自动滚动严格归属于 session，并以跨会话持续流式场景证明 A 的输出不会改变 B 的定位。",
      "reason": "现有 session id 数据过滤不能取消已排队的 DOM 滚动副作用，也不能恢复目标会话自己的阅读状态。",
      "derived_from": [
        "FACT-20260829-002-001"
      ],
      "blocked_by": [],
      "priority_basis": {
        "blocking": "high",
        "risk": "high",
        "user_impact": "high",
        "verifiability": "high"
      },
      "responsibility": "agent",
      "evidence_required": [
        "会话切换使旧 session 的待执行 rAF 自动滚动失效。",
        "following/detached 与阅读位置按 session 保存并恢复，首次打开采用明确的默认策略。",
        "A 持续输出期间切到 B 后，B 的 scrollTop 在 A 后续 delta 和结构终态刷新下保持稳定。",
        "Conversation Surface 单元测试和授权 Electron 跨会话回归通过。"
      ],
      "resolution": {
        "id": "GAP-20260829-002-001",
        "status": "resolved",
        "outcome": "Conversation Surface now keys follow/detached position by session context, invalidates stale frame tokens on context switches, restores target reading state, and no longer forces every selected Chat session to follow latest.",
        "reason": "Source, durable contracts, and 77 passing focused Node tests establish the architecture repair; real Electron execution remains a separate authorization-bound verification obligation.",
        "evidence": [
          "runtime/arcorbit/desktop/renderer/conversation-surface.mjs",
          "runtime/arcorbit/desktop/renderer/renderer.js",
          "runtime/arcorbit/test/desktop-renderer.test.mjs",
          "arckit/interaction/chat-workspace/interaction.md",
          "arckit/tech/arcorbit/desktop-execution-solution.md",
          "Verification: focused Node tests 77/77 passed, 2026-08-29"
        ],
        "occurred_at": "2026-08-29T15:16:19.155Z"
      }
    },
    {
      "id": "GAP-20260829-002-002",
      "status": "resolved",
      "goal": "Authorize and run the focused Electron cross-session Chat regression, then report whether B retains its detached reading position while A continues deltas and emits a structural terminal refresh.",
      "reason": "The test scenario is implemented, but sandbox Electron aborts before assertions and the GUI escalation request was rejected.",
      "derived_from": [
        "FACT-20260829-002-002",
        "FACT-20260829-002-003"
      ],
      "blocked_by": [],
      "priority_basis": {
        "blocking": "high",
        "risk": "medium",
        "user_impact": "high",
        "verifiability": "high"
      },
      "responsibility": "human",
      "evidence_required": [
        "Run ARCORBIT_ELECTRON_CHAT_STREAM_PERFORMANCE_TEST=1 node --test runtime/arcorbit/test/chat-stream-performance-electron.test.mjs in an authorized GUI environment.",
        "The test passes position restoration, background delta isolation, structural refresh isolation, stable target node, zero stream snapshot, and responsive switch assertions."
      ],
      "resolution": {
        "id": "GAP-20260829-002-002",
        "status": "resolved",
        "outcome": "The authorized Electron regression passed: B retained its detached reading position while A continued streaming and emitted a structural terminal refresh.",
        "reason": "The real GUI test passed position restoration, background delta isolation, structural refresh isolation, stable target node, zero stream snapshots, and responsive session switching.",
        "evidence": [
          "Verification: ARCORBIT_ELECTRON_CHAT_STREAM_PERFORMANCE_TEST=1 node --test runtime/arcorbit/test/chat-stream-performance-electron.test.mjs passed 1/1, 2026-08-29",
          "runtime/arcorbit/test/chat-stream-performance-electron.test.mjs",
          "runtime/arcorbit/test/fixtures/chat-stream-performance-electron.mjs"
        ],
        "occurred_at": "2026-08-29T15:48:43.134Z"
      }
    }
  ],
  "content_revision": 2,
  "completion_review": {
    "status": "clean",
    "policy": {
      "initial_max_cycles": 10,
      "source": "runtime/arcorbit/config/case-policy.json",
      "snapshotted_at": "2026-08-29T15:02:52.585Z"
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
          "Review: session-scoped follow state, detached scroll restoration, and stale frame-token invalidation align with the reported A-to-B failure sequence.",
          "Verification: focused Node Chat and Renderer tests passed 79/79, 2026-08-29",
          "Verification: authorized Electron cross-session Chat regression passed 1/1, 2026-08-29",
          "Verification: conversation-surface.mjs, renderer.js, and Electron fixture syntax checks passed, 2026-08-29",
          "Verification: git diff --check passed, 2026-08-29"
        ],
        "occurred_at": "2026-08-29T15:50:07.539Z"
      }
    ],
    "evidence": [
      "Review: session-scoped follow state, detached scroll restoration, and stale frame-token invalidation align with the reported A-to-B failure sequence.",
      "Verification: focused Node Chat and Renderer tests passed 79/79, 2026-08-29",
      "Verification: authorized Electron cross-session Chat regression passed 1/1, 2026-08-29",
      "Verification: conversation-surface.mjs, renderer.js, and Electron fixture syntax checks passed, 2026-08-29",
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
      "goal": "Implement session-scoped scroll state and stale-frame invalidation, align durable interaction and technical contracts, and verify the architecture with deterministic regressions.",
      "outcome": "needs_human",
      "gap_selection": {
        "mode": "candidate",
        "basis": "The cross-session scroll ownership gap is the only Case-scoped ready candidate and directly blocks the reported Chat reading path.",
        "snapshot_token": "315abc237f12f533ae93e0d39dde8eeebcafc16f1d53a401000cc142069199ae",
        "selected_ref": "case-gap:CASE-20260829-002:GAP-20260829-002-001",
        "comparison_summary": "Compared the Chat scroll ownership gap with all four broader Project gaps; the Project gaps require separate Cases and do not precede this user-visible defect.",
        "fresh_discovery_summary": "Implementation and deterministic regression evidence now establish the session-scoped architecture; the rejected GUI authorization and sandbox Electron launch failure expose a separate human-owned real-GUI verification gate.",
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
            "reason": "General isolated Agent scenario evaluation is outside this bounded Chat interaction defect."
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
            "reason": "Broader Runtime resilience and adapter work is independent of renderer scroll ownership."
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
            "reason": "Permission-bearing security validation requires a separate project and does not block this local UI repair."
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
            "reason": "Cross-record ledger auditing is a separate Project obligation."
          },
          {
            "ref": "case-gap:CASE-20260829-002:GAP-20260829-002-001",
            "source": "persisted",
            "eligibility": "ready",
            "disposition": "selected",
            "priority_basis": {
              "blocking": "high",
              "risk": "high",
              "user_impact": "high",
              "verifiability": "high"
            },
            "reason": "It is the only ready gap that directly fixes the reported A-to-B scroll interference."
          }
        ]
      },
      "selected_gap": {
        "id": "GAP-20260829-002-001",
        "responsibility": "agent",
        "goal": "使 Chat Conversation Surface 的跟随状态、阅读位置和待执行自动滚动严格归属于 session，并以跨会话持续流式场景证明 A 的输出不会改变 B 的定位。",
        "reason": "现有 session id 数据过滤不能取消已排队的 DOM 滚动副作用，也不能恢复目标会话自己的阅读状态。",
        "derived_from": [
          "FACT-20260829-002-001"
        ],
        "blocked_by": [],
        "priority_basis": {
          "blocking": "high",
          "uncertainty": "",
          "risk": "high",
          "user_impact": "high",
          "verifiability": "high"
        },
        "evidence_required": [
          "会话切换使旧 session 的待执行 rAF 自动滚动失效。",
          "following/detached 与阅读位置按 session 保存并恢复，首次打开采用明确的默认策略。",
          "A 持续输出期间切到 B 后，B 的 scrollTop 在 A 后续 delta 和结构终态刷新下保持稳定。",
          "Conversation Surface 单元测试和授权 Electron 跨会话回归通过。"
        ]
      },
      "planned_transition": {
        "goal": "Implement session-scoped scroll state and stale-frame invalidation, align durable interaction and technical contracts, and verify the architecture with deterministic regressions.",
        "expected_state_change": "Accept the implementation result while isolating the unavailable authorized Electron execution as an explicit human-owned verification gap."
      },
      "accepted_state_delta": {
        "resolved_gap": {
          "id": "GAP-20260829-002-001",
          "status": "resolved",
          "outcome": "Conversation Surface now keys follow/detached position by session context, invalidates stale frame tokens on context switches, restores target reading state, and no longer forces every selected Chat session to follow latest.",
          "reason": "Source, durable contracts, and 77 passing focused Node tests establish the architecture repair; real Electron execution remains a separate authorization-bound verification obligation.",
          "evidence": [
            "runtime/arcorbit/desktop/renderer/conversation-surface.mjs",
            "runtime/arcorbit/desktop/renderer/renderer.js",
            "runtime/arcorbit/test/desktop-renderer.test.mjs",
            "arckit/interaction/chat-workspace/interaction.md",
            "arckit/tech/arcorbit/desktop-execution-solution.md",
            "Verification: focused Node tests 77/77 passed, 2026-08-29"
          ]
        },
        "facts_added": [
          {
            "id": "FACT-20260829-002-002",
            "revision": 1,
            "status": "accepted",
            "statement": "Chat Conversation Surface maintains follow state and detached scroll position per session context, invalidates queued auto-follow frames when context changes, restores the target session state, and Renderer no longer forces follow-latest after selection.",
            "basis": "Implemented source, stable interaction/technical contracts, and deterministic cross-context regression evidence.",
            "evidence": [
              "runtime/arcorbit/desktop/renderer/conversation-surface.mjs",
              "runtime/arcorbit/desktop/renderer/renderer.js",
              "runtime/arcorbit/test/desktop-renderer.test.mjs",
              "arckit/interaction/chat-workspace/interaction.md",
              "arckit/tech/arcorbit/desktop-execution-solution.md",
              "Verification: focused Node tests 77/77 passed, 2026-08-29"
            ]
          },
          {
            "id": "FACT-20260829-002-003",
            "revision": 1,
            "status": "accepted",
            "statement": "The expanded Electron regression covers B-session position restoration during continued A-session deltas and an A terminal structural refresh, but the authorized GUI launch request was rejected and sandbox execution fails before assertions.",
            "basis": "Current execution authority response and focused sandbox test output.",
            "evidence": [
              "Current GUI escalation response: rejected, 2026-08-29",
              "runtime/arcorbit/test/chat-stream-performance-electron.test.mjs",
              "runtime/arcorbit/test/fixtures/chat-stream-performance-electron.mjs",
              "Verification: sandbox Electron launch failed before assertions, 2026-08-29"
            ]
          }
        ],
        "facts_superseded": [],
        "impacts_added": [],
        "impacts_updated": [
          {
            "id": "IMPACT-20260829-002-001",
            "fact_id": "FACT-20260829-002-001",
            "fact_revision": 1,
            "target": {
              "kind": "software_decision",
              "ref": "experience_and_interaction",
              "revision": 62
            },
            "effect": "undetermined",
            "reason": "The interaction contract and deterministic tests support session-isolated reading, but final real Electron interaction acceptance awaits authorized execution.",
            "gap_ids": [
              "GAP-20260829-002-002"
            ],
            "evidence": [
              "arckit/interaction/chat-workspace/interaction.md",
              "runtime/arcorbit/test/desktop-renderer.test.mjs"
            ]
          },
          {
            "id": "IMPACT-20260829-002-002",
            "fact_id": "FACT-20260829-002-001",
            "fact_revision": 1,
            "target": {
              "kind": "software_decision",
              "ref": "technical_foundation",
              "revision": 44
            },
            "effect": "upheld",
            "reason": "The implementation and technical contract now make asynchronous scroll state and frame ownership session-scoped.",
            "gap_ids": [],
            "evidence": [
              "arckit/tech/arcorbit/desktop-execution-solution.md",
              "runtime/arcorbit/desktop/renderer/conversation-surface.mjs",
              "Verification: focused Node tests 77/77 passed, 2026-08-29"
            ]
          }
        ],
        "gaps_added": [
          {
            "id": "GAP-20260829-002-002",
            "status": "open",
            "goal": "Authorize and run the focused Electron cross-session Chat regression, then report whether B retains its detached reading position while A continues deltas and emits a structural terminal refresh.",
            "reason": "The test scenario is implemented, but sandbox Electron aborts before assertions and the GUI escalation request was rejected.",
            "derived_from": [
              "FACT-20260829-002-002",
              "FACT-20260829-002-003"
            ],
            "blocked_by": [],
            "priority_basis": {
              "blocking": "high",
              "risk": "medium",
              "user_impact": "high",
              "verifiability": "high"
            },
            "responsibility": "human",
            "evidence_required": [
              "Run ARCORBIT_ELECTRON_CHAT_STREAM_PERFORMANCE_TEST=1 node --test runtime/arcorbit/test/chat-stream-performance-electron.test.mjs in an authorized GUI environment.",
              "The test passes position restoration, background delta isolation, structural refresh isolation, stable target node, zero stream snapshot, and responsive switch assertions."
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
        "project_revision": 319,
        "judgments": [
          {
            "invariant_ref": "product-expectations-remain-recoverable",
            "disposition": "upheld",
            "reason": "The Chat product outcome remains explicit while session-specific reading behavior is durably documented.",
            "fact_refs": [
              "FACT-20260829-002-001",
              "FACT-20260829-002-002"
            ],
            "evidence": [
              "arckit/interaction/chat-workspace/interaction.md",
              "arckit/interaction/chat-workspace/default.html"
            ],
            "gap_refs": []
          },
          {
            "invariant_ref": "interaction-expectations-remain-recoverable",
            "disposition": "undetermined",
            "reason": "The session-specific interaction rule is recoverable and deterministically tested, but real Electron acceptance remains authorization-bound.",
            "fact_refs": [
              "FACT-20260829-002-002",
              "FACT-20260829-002-003"
            ],
            "evidence": [
              "arckit/interaction/chat-workspace/interaction.md",
              "runtime/arcorbit/test/chat-stream-performance-electron.test.mjs"
            ],
            "gap_refs": [
              "GAP-20260829-002-002"
            ]
          },
          {
            "invariant_ref": "visual-language-remains-consistent",
            "disposition": "not_relevant",
            "reason": "The change does not alter the accepted visual language or component styling.",
            "fact_refs": [],
            "evidence": [],
            "gap_refs": []
          },
          {
            "invariant_ref": "technical-decisions-remain-explainable",
            "disposition": "upheld",
            "reason": "Session context, frame token invalidation, restore semantics, and first-entry follow defaults are aligned across source and technical contract.",
            "fact_refs": [
              "FACT-20260829-002-002"
            ],
            "evidence": [
              "arckit/tech/arcorbit/desktop-execution-solution.md",
              "runtime/arcorbit/desktop/renderer/conversation-surface.mjs",
              "runtime/arcorbit/desktop/renderer/renderer.js"
            ],
            "gap_refs": []
          },
          {
            "invariant_ref": "accepted-facts-are-realized",
            "disposition": "undetermined",
            "reason": "Deterministic evidence realizes the implementation fact, while GUI realization remains unconfirmed because authorized Electron execution did not occur.",
            "fact_refs": [
              "FACT-20260829-002-002",
              "FACT-20260829-002-003"
            ],
            "evidence": [
              "runtime/arcorbit/test/desktop-renderer.test.mjs",
              "runtime/arcorbit/test/chat-stream-performance-electron.test.mjs"
            ],
            "gap_refs": [
              "GAP-20260829-002-002"
            ]
          },
          {
            "invariant_ref": "material-risks-have-credible-evidence",
            "disposition": "undetermined",
            "reason": "Unit evidence covers stale frame and session state isolation, but the material real-DOM cross-session risk still requires the prepared Electron regression.",
            "fact_refs": [
              "FACT-20260829-002-002",
              "FACT-20260829-002-003"
            ],
            "evidence": [
              "Verification: focused Node tests 77/77 passed, 2026-08-29",
              "runtime/arcorbit/test/chat-stream-performance-electron.test.mjs"
            ],
            "gap_refs": [
              "GAP-20260829-002-002"
            ]
          }
        ]
      },
      "evidence": [
        "runtime/arcorbit/desktop/renderer/conversation-surface.mjs",
        "runtime/arcorbit/desktop/renderer/renderer.js",
        "runtime/arcorbit/test/desktop-renderer.test.mjs",
        "runtime/arcorbit/test/chat-stream-performance-electron.test.mjs",
        "runtime/arcorbit/test/fixtures/chat-stream-performance-electron.mjs",
        "arckit/interaction/chat-workspace/interaction.md",
        "arckit/tech/arcorbit/desktop-execution-solution.md",
        "Verification: focused Node tests 77/77 passed; syntax and git diff checks passed, 2026-08-29",
        "Verification: GUI escalation rejected and sandbox Electron failed before assertions, 2026-08-29"
      ],
      "runtime_result_ref": "",
      "occurred_at": "2026-08-29T15:16:19.155Z"
    },
    {
      "round": 2,
      "transition_schema_version": "arckit-case-transition/v8",
      "goal": "Run the authorized real Electron cross-session regression and reconcile the pending interaction impact.",
      "outcome": "completed",
      "gap_selection": {
        "mode": "candidate",
        "basis": "The user has now authorized GUI execution, making the sole ready Case verification gap the highest-priority and directly verifiable current action.",
        "snapshot_token": "f177a57233d2bfa15eccffa60517601e33d4cd73d5068104dca47435099c1b1d",
        "selected_ref": "case-gap:CASE-20260829-002:GAP-20260829-002-002",
        "comparison_summary": "Compared all four Project gaps and the active Case gap. The Project gaps require separate Cases; the authorized cross-session Electron verification directly closes the only remaining acceptance uncertainty in the current Case.",
        "fresh_discovery_summary": "The current authorization removed the human gate; no additional fresh gap was discovered.",
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
            "reason": "Requires a separate Case and is outside the active Chat regression acceptance boundary."
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
            "reason": "Requires a separate Case and does not block the current authorized Chat verification."
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
            "reason": "Requires a separate permission-bearing project Case and is unrelated to this Chat interaction verification."
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
            "reason": "Requires a separate Case; the current active Case has a ready, user-impacting acceptance gap."
          },
          {
            "ref": "case-gap:CASE-20260829-002:GAP-20260829-002-002",
            "source": "persisted",
            "eligibility": "ready",
            "disposition": "selected",
            "priority_basis": {
              "blocking": "high",
              "risk": "medium",
              "user_impact": "high",
              "verifiability": "high"
            },
            "reason": "The user explicitly authorized the prepared GUI regression, and this is the final material acceptance uncertainty for the current Chat fix."
          }
        ]
      },
      "selected_gap": {
        "id": "GAP-20260829-002-002",
        "responsibility": "human",
        "goal": "Authorize and run the focused Electron cross-session Chat regression, then report whether B retains its detached reading position while A continues deltas and emits a structural terminal refresh.",
        "reason": "The test scenario is implemented, but sandbox Electron aborts before assertions and the GUI escalation request was rejected.",
        "derived_from": [
          "FACT-20260829-002-002",
          "FACT-20260829-002-003"
        ],
        "blocked_by": [],
        "priority_basis": {
          "blocking": "high",
          "uncertainty": "",
          "risk": "medium",
          "user_impact": "high",
          "verifiability": "high"
        },
        "evidence_required": [
          "Run ARCORBIT_ELECTRON_CHAT_STREAM_PERFORMANCE_TEST=1 node --test runtime/arcorbit/test/chat-stream-performance-electron.test.mjs in an authorized GUI environment.",
          "The test passes position restoration, background delta isolation, structural refresh isolation, stable target node, zero stream snapshot, and responsive switch assertions."
        ]
      },
      "planned_transition": {
        "goal": "Run the authorized real Electron cross-session regression and reconcile the pending interaction impact.",
        "expected_state_change": "The GUI verification gap becomes resolved, the interaction impact becomes upheld, and the Case advances to completion review."
      },
      "accepted_state_delta": {
        "resolved_gap": {
          "id": "GAP-20260829-002-002",
          "status": "resolved",
          "outcome": "The authorized Electron regression passed: B retained its detached reading position while A continued streaming and emitted a structural terminal refresh.",
          "reason": "The real GUI test passed position restoration, background delta isolation, structural refresh isolation, stable target node, zero stream snapshots, and responsive session switching.",
          "evidence": [
            "Verification: ARCORBIT_ELECTRON_CHAT_STREAM_PERFORMANCE_TEST=1 node --test runtime/arcorbit/test/chat-stream-performance-electron.test.mjs passed 1/1, 2026-08-29",
            "runtime/arcorbit/test/chat-stream-performance-electron.test.mjs",
            "runtime/arcorbit/test/fixtures/chat-stream-performance-electron.mjs"
          ]
        },
        "facts_added": [
          {
            "id": "FACT-20260829-002-004",
            "revision": 1,
            "status": "accepted",
            "statement": "In an authorized real Electron run, switching from continuously streaming session A to detached-reading session B preserved B's scroll position and target message node through later A deltas and A's structural terminal refresh, with zero stream snapshots and responsive switching.",
            "basis": "Focused Electron integration regression passed all cross-session isolation and responsiveness assertions.",
            "evidence": [
              "Verification: authorized Electron cross-session Chat regression passed 1/1 in 2838 ms, 2026-08-29",
              "runtime/arcorbit/test/chat-stream-performance-electron.test.mjs",
              "runtime/arcorbit/test/fixtures/chat-stream-performance-electron.mjs"
            ]
          }
        ],
        "facts_superseded": [],
        "impacts_added": [],
        "impacts_updated": [
          {
            "id": "IMPACT-20260829-002-001",
            "fact_id": "FACT-20260829-002-001",
            "fact_revision": 1,
            "target": {
              "kind": "software_decision",
              "ref": "experience_and_interaction",
              "revision": 62
            },
            "effect": "upheld",
            "reason": "The interaction contract is now backed by deterministic unit evidence and an authorized real Electron cross-session regression proving session-isolated reading position and scroll ownership.",
            "gap_ids": [],
            "evidence": [
              "arckit/interaction/chat-workspace/interaction.md",
              "runtime/arcorbit/test/desktop-renderer.test.mjs",
              "runtime/arcorbit/test/chat-stream-performance-electron.test.mjs",
              "Verification: authorized Electron cross-session Chat regression passed 1/1, 2026-08-29"
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
        "project_revision": 319,
        "judgments": [
          {
            "invariant_ref": "product-expectations-remain-recoverable",
            "disposition": "upheld",
            "reason": "The accepted Chat outcome and session-isolated behavior remain durably recoverable from the interaction contract and Case evidence.",
            "fact_refs": [
              "FACT-20260829-002-001",
              "FACT-20260829-002-002",
              "FACT-20260829-002-004"
            ],
            "evidence": [
              "arckit/interaction/chat-workspace/interaction.md",
              "arckit/cases/active/CASE-20260829-002-arcorbit-chat.md"
            ],
            "gap_refs": []
          },
          {
            "invariant_ref": "interaction-expectations-remain-recoverable",
            "disposition": "upheld",
            "reason": "The session-specific reading rule is documented and now verified in the authorized real Electron interaction scenario.",
            "fact_refs": [
              "FACT-20260829-002-002",
              "FACT-20260829-002-004"
            ],
            "evidence": [
              "arckit/interaction/chat-workspace/interaction.md",
              "runtime/arcorbit/test/chat-stream-performance-electron.test.mjs"
            ],
            "gap_refs": []
          },
          {
            "invariant_ref": "visual-language-remains-consistent",
            "disposition": "not_relevant",
            "reason": "This verification and underlying repair do not alter accepted visual styling or component language.",
            "fact_refs": [],
            "evidence": [],
            "gap_refs": []
          },
          {
            "invariant_ref": "technical-decisions-remain-explainable",
            "disposition": "upheld",
            "reason": "Session context ownership, stale-frame invalidation, restoration semantics, and their regression coverage remain aligned across source and technical contract.",
            "fact_refs": [
              "FACT-20260829-002-002",
              "FACT-20260829-002-004"
            ],
            "evidence": [
              "arckit/tech/arcorbit/desktop-execution-solution.md",
              "runtime/arcorbit/desktop/renderer/conversation-surface.mjs",
              "runtime/arcorbit/desktop/renderer/renderer.js"
            ],
            "gap_refs": []
          },
          {
            "invariant_ref": "accepted-facts-are-realized",
            "disposition": "upheld",
            "reason": "The accepted implementation fact is realized by source plus passing deterministic and real Electron regressions.",
            "fact_refs": [
              "FACT-20260829-002-002",
              "FACT-20260829-002-004"
            ],
            "evidence": [
              "runtime/arcorbit/test/desktop-renderer.test.mjs",
              "runtime/arcorbit/test/chat-stream-performance-electron.test.mjs"
            ],
            "gap_refs": []
          },
          {
            "invariant_ref": "material-risks-have-credible-evidence",
            "disposition": "upheld",
            "reason": "The material cross-session DOM scroll risk is covered by focused unit tests and the authorized real Electron regression.",
            "fact_refs": [
              "FACT-20260829-002-002",
              "FACT-20260829-002-004"
            ],
            "evidence": [
              "Verification: focused Node tests 77/77 passed, 2026-08-29",
              "Verification: authorized Electron cross-session Chat regression passed 1/1, 2026-08-29"
            ],
            "gap_refs": []
          }
        ]
      },
      "evidence": [
        "Verification: ARCORBIT_ELECTRON_CHAT_STREAM_PERFORMANCE_TEST=1 node --test runtime/arcorbit/test/chat-stream-performance-electron.test.mjs passed 1/1, 2026-08-29",
        "runtime/arcorbit/test/chat-stream-performance-electron.test.mjs",
        "runtime/arcorbit/test/fixtures/chat-stream-performance-electron.mjs"
      ],
      "runtime_result_ref": "",
      "occurred_at": "2026-08-29T15:48:43.134Z"
    },
    {
      "round": 3,
      "transition_schema_version": "arckit-case-transition/v8",
      "goal": "Perform the implementation-focused completion review for content revision 2.",
      "outcome": "completed",
      "gap_selection": {
        "mode": "candidate",
        "basis": "All ordinary Chat gaps and state impacts are closed, so the deterministic completion review is the sole ready active-Case obligation.",
        "snapshot_token": "c491f91e9ac0b8014b9ed6c28ffa98f740c9ded2a834710acc198f34fb570ec1",
        "selected_ref": "case-gap:CASE-20260829-002:CASE-20260829-002:completion-review:1",
        "comparison_summary": "Compared all four Project gaps and the derived completion-review gap. Each Project gap requires a separate Case; the completion review is ready and is required to close the implemented Chat repair.",
        "fresh_discovery_summary": "Source review and rerun verification found no new defect or material fresh gap.",
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
            "reason": "Requires a separate Case and does not supersede the current Case closeout review."
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
            "reason": "Requires a separate Case and is outside this Chat repair review."
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
            "reason": "Requires a separate permission-bearing Case and is unrelated to the reviewed change."
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
            "reason": "Requires a separate Case; the current Case has a ready mandatory completion review."
          },
          {
            "ref": "case-gap:CASE-20260829-002:CASE-20260829-002:completion-review:1",
            "source": "persisted",
            "eligibility": "ready",
            "disposition": "selected",
            "priority_basis": {
              "blocking": "high",
              "uncertainty": "low",
              "risk": "high",
              "user_impact": "high"
            },
            "reason": "This is the only remaining obligation for the completed Chat architecture repair and its authorized acceptance evidence."
          }
        ]
      },
      "selected_gap": {
        "id": "CASE-20260829-002:completion-review:1",
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
        "goal": "Perform the implementation-focused completion review for content revision 2.",
        "expected_state_change": "A clean five-dimension review closes the Case with no additional repair gap."
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
            "Review: session-scoped follow state, detached scroll restoration, and stale frame-token invalidation align with the reported A-to-B failure sequence.",
            "Verification: focused Node Chat and Renderer tests passed 79/79, 2026-08-29",
            "Verification: authorized Electron cross-session Chat regression passed 1/1, 2026-08-29",
            "Verification: conversation-surface.mjs, renderer.js, and Electron fixture syntax checks passed, 2026-08-29",
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
        "project_revision": 319,
        "judgments": [
          {
            "invariant_ref": "product-expectations-remain-recoverable",
            "disposition": "upheld",
            "reason": "The reviewed change preserves the documented Chat outcome and session-specific reading behavior.",
            "fact_refs": [
              "FACT-20260829-002-001",
              "FACT-20260829-002-002",
              "FACT-20260829-002-004"
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
            "reason": "The interaction rule is documented and corroborated by deterministic and real Electron cross-session evidence.",
            "fact_refs": [
              "FACT-20260829-002-002",
              "FACT-20260829-002-004"
            ],
            "evidence": [
              "arckit/interaction/chat-workspace/interaction.md",
              "runtime/arcorbit/test/chat-stream-performance-electron.test.mjs"
            ],
            "gap_refs": []
          },
          {
            "invariant_ref": "visual-language-remains-consistent",
            "disposition": "not_relevant",
            "reason": "The reviewed implementation does not modify accepted visual styling or component language.",
            "fact_refs": [],
            "evidence": [],
            "gap_refs": []
          },
          {
            "invariant_ref": "technical-decisions-remain-explainable",
            "disposition": "upheld",
            "reason": "The final source has explicit session ownership and bounded asynchronous scroll semantics aligned with the technical contract.",
            "fact_refs": [
              "FACT-20260829-002-002",
              "FACT-20260829-002-004"
            ],
            "evidence": [
              "arckit/tech/arcorbit/desktop-execution-solution.md",
              "runtime/arcorbit/desktop/renderer/conversation-surface.mjs",
              "runtime/arcorbit/desktop/renderer/renderer.js"
            ],
            "gap_refs": []
          },
          {
            "invariant_ref": "accepted-facts-are-realized",
            "disposition": "upheld",
            "reason": "The completion review found the accepted repair facts realized in source and verified behavior.",
            "fact_refs": [
              "FACT-20260829-002-002",
              "FACT-20260829-002-004"
            ],
            "evidence": [
              "runtime/arcorbit/test/desktop-renderer.test.mjs",
              "runtime/arcorbit/test/chat-stream-performance-electron.test.mjs"
            ],
            "gap_refs": []
          },
          {
            "invariant_ref": "material-risks-have-credible-evidence",
            "disposition": "upheld",
            "reason": "The reported cross-session scroll contamination risk is covered by 79 focused Node tests and the passing real Electron scenario.",
            "fact_refs": [
              "FACT-20260829-002-002",
              "FACT-20260829-002-004"
            ],
            "evidence": [
              "Verification: focused Node tests passed 79/79, 2026-08-29",
              "Verification: authorized Electron regression passed 1/1, 2026-08-29",
              "Verification: syntax and diff checks passed, 2026-08-29"
            ],
            "gap_refs": []
          }
        ]
      },
      "evidence": [
        "runtime/arcorbit/desktop/renderer/conversation-surface.mjs",
        "runtime/arcorbit/desktop/renderer/renderer.js",
        "runtime/arcorbit/test/desktop-renderer.test.mjs",
        "runtime/arcorbit/test/chat-stream-performance-electron.test.mjs",
        "Verification: focused Node tests passed 79/79; Electron passed 1/1; syntax and git diff checks passed, 2026-08-29"
      ],
      "runtime_result_ref": "",
      "occurred_at": "2026-08-29T15:50:07.539Z"
    }
  ],
  "case_resolution": {
    "status": "resolved",
    "stage": "resolved",
    "satisfied": [
      "GAP-20260829-002-001",
      "GAP-20260829-002-002"
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
    "updated_at": "2026-08-29T15:50:07.539Z"
  }
}
```

## Round Notes

- Case history is canonical in Structured Record.rounds; keep prose notes exceptional.
