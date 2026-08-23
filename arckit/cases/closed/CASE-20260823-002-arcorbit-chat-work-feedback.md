# 优化 ArcOrbit Chat、Work 与 Feedback 日常交互

Case: CASE-20260823-002
Status: closed
Artifact Type: mixed
Selected Gap: none
Updated: 2026-08-23T15:04:50.960Z

## User Intent

解决 Chat 重入等待、Work 筛选与行密度、Feedback 行密度与用户双向对话能力问题。

## Structured Record

```json
{
  "schema_version": "development-case-record/v5",
  "id": "CASE-20260823-002",
  "title": "优化 ArcOrbit Chat、Work 与 Feedback 日常交互",
  "status": "closed",
  "artifact_type": "mixed",
  "created_at": "2026-08-23T14:40:08.161Z",
  "updated_at": "2026-08-23T15:04:50.960Z",
  "user_intent": "解决 Chat 重入等待、Work 筛选与行密度、Feedback 行密度与用户双向对话能力问题。",
  "expected_outcome": "Chat 可及时重入且状态可感知；Work 使用弹出筛选并保持单行待办；Feedback 保持单行反馈并基于重新核实的服务与桌面能力支持和用户持续对话。",
  "project_state_ref": "arckit/project/state.record.json",
  "current_round": {
    "goal": "",
    "selected_gap": null
  },
  "facts": [
    {
      "id": "FACT-USER-CHAT-REENTRY-SLOW",
      "revision": 1,
      "status": "accepted",
      "statement": "用户切换离开 Chat 页面后再次进入时需要等待很长时间，期间不知道发生了什么；预期 Chat 能及时打开并提供可理解状态。",
      "basis": "Current operator report and requested outcome.",
      "evidence": [
        "Current operator input, 2026-08-23"
      ]
    },
    {
      "id": "FACT-USER-WORK-COMPACT-MENU",
      "revision": 1,
      "status": "accepted",
      "statement": "用户要求 Work 创建人等横排筛选器使用弹出菜单，并要求每行待办只占一行、列表不展示操作按钮、完整按钮仅在详情中提供。",
      "basis": "Current operator requirement.",
      "evidence": [
        "Current operator input, 2026-08-23"
      ]
    },
    {
      "id": "FACT-USER-FEEDBACK-CONVERSATION",
      "revision": 1,
      "status": "accepted",
      "statement": "用户要求 Feedback 每条只占一行并支持与用户持续对话，同时指出既有 Feedback 网页能力与 ArcOrbit 应有能力的调研结论有误，需要重新调研。",
      "basis": "Current operator correction and requirement.",
      "evidence": [
        "Current operator input, 2026-08-23"
      ]
    },
    {
      "id": "FACT-CHAT-REENTRY-BLOCKS-RENDER",
      "revision": 1,
      "status": "accepted",
      "statement": "Chat page re-entry changes the selected page but waits for chatSnapshot IPC before rendering, leaving the previous page visible with no refresh state during a slow request.",
      "basis": "Direct control-flow inspection exactly matches trigger, screen, timing, and missing state.",
      "evidence": [
        "runtime/arcorbit/desktop/renderer/renderer.js",
        "runtime/arcorbit/src/chat-state-coordinator.mjs"
      ]
    },
    {
      "id": "FACT-FEEDBACK-WEB-BIDIRECTIONAL-CONTRACT",
      "revision": 1,
      "status": "accepted",
      "statement": "Workshop Feedback SDK Web lets product users read and send feedback messages and attachments, while Feedback Console Web lets developers read that timeline, reply with text or attachments, process notifications, and mark them read.",
      "basis": "Direct source inspection of both checked-out Workshop Feedback web clients.",
      "evidence": [
        "/Users/Glare/Library/Developer/ModularProgram/hoewo/Workshop-Feedbacks/webapps/feedback-sdk-web/src/components/sdk/FeedbackConversationPanel.tsx",
        "/Users/Glare/Library/Developer/ModularProgram/hoewo/Workshop-Feedbacks/webapps/feedback-console-web/src/components/features/FeedbackConversationPanel.tsx",
        "/Users/Glare/Library/Developer/ModularProgram/hoewo/Workshop-Feedbacks/webapps/feedback-console-web/src/lib/api/feedbackV2Client.ts"
      ]
    },
    {
      "id": "FACT-FEEDBACK-V2-GATE-HIDES-CONVERSATION",
      "revision": 1,
      "status": "accepted",
      "statement": "ArcOrbit implements bounded Feedback V2 messages, developer replies, attachments, notifications, read state, ignore, and convert-to-task, but its default empty V2 project matcher sends ordinary projects to V1 and hides the conversation UI.",
      "basis": "Direct inspection of task source defaults, coordinator, adapter, IPC, and Renderer capability branch.",
      "evidence": [
        "runtime/arcorbit/desktop/renderer/renderer.js",
        "runtime/arcorbit/src/chat-state-coordinator.mjs",
        "runtime/arcorbit/src/task-source-adapter.mjs",
        "runtime/arcorbit/src/platform-coordinator.mjs",
        "runtime/arcorbit/src/workshop-platform-adapter.mjs",
        "runtime/arcorbit/desktop/main.mjs",
        "runtime/arcorbit/desktop/preload.cjs"
      ]
    },
    {
      "id": "FACT-AFFECTED-CONTRACTS-ESTABLISHED",
      "revision": 1,
      "status": "accepted",
      "statement": "Durable contracts now require immediate cached Chat re-entry with visible background refresh, popup Work filters and single-line action-free Work rows, single-line Feedback rows, and default per-project probing of bidirectional Feedback conversation capability with V1 fallback.",
      "basis": "Updated specifications, source/projection interaction pairs, and technical solutions agree.",
      "evidence": [
        "arckit/spec/agentic-software-development/arcorbit-planned-workspaces.md",
        "arckit/spec/agentic-software-development/arcorbit-work-management.md",
        "arckit/spec/agentic-software-development/arcorbit-platform-capabilities.md",
        "arckit/interaction/chat-workspace/interaction.md",
        "arckit/interaction/chat-workspace/default.html",
        "arckit/interaction/task-browser/interaction.md",
        "arckit/interaction/task-browser/daily-work.html",
        "arckit/interaction/platform-workspace/interaction.md",
        "arckit/interaction/platform-workspace/default.html",
        "arckit/tech/arcorbit/desktop-execution-solution.md",
        "arckit/tech/arcorbit/platform-composition-solution.md"
      ]
    },
    {
      "id": "FACT-CHAT-IMMEDIATE-REENTRY-REALIZED",
      "revision": 1,
      "status": "accepted",
      "statement": "Chat navigation now switches and renders cached state before starting snapshot refresh, exposes an aria-busy and visible syncing projection, clears it on completion, and prevents an older overlapping refresh from replacing newer content.",
      "basis": "Implemented control flow and automated regression tests.",
      "evidence": [
        "runtime/arcorbit/desktop/renderer/chat-state-coordinator.mjs",
        "runtime/arcorbit/desktop/renderer/renderer.js",
        "runtime/arcorbit/test/desktop-renderer.test.mjs",
        "node --test runtime/arcorbit/test/desktop-renderer.test.mjs: 38 passed, 0 failed"
      ]
    },
    {
      "id": "FACT-FEEDBACK-CONVERSATION-ROWS-REALIZED",
      "revision": 1,
      "status": "accepted",
      "statement": "ArcOrbit now probes Feedback V2 and notifications for every project by default while allowing explicit narrowing; real V2 list failures still fall back to V1, and Feedback list copy and metadata render in one compact nowrap row.",
      "basis": "Implemented defaults and layout with adapter, coordinator, renderer, and task-source regression coverage.",
      "evidence": [
        "runtime/arcorbit/src/task-source-adapter.mjs",
        "runtime/arcorbit/src/workshop-platform-adapter.mjs",
        "runtime/arcorbit/desktop/renderer/styles.css",
        "runtime/arcorbit/test/task-source-adapter.test.mjs",
        "runtime/arcorbit/test/desktop-renderer.test.mjs",
        "node --test task-source-adapter, workshop-platform-adapter, platform-coordinator, desktop-renderer: 82 passed, 0 failed"
      ]
    },
    {
      "id": "FACT-WORK-COMPACT-CONTROLS-ROWS-REALIZED",
      "revision": 1,
      "status": "accepted",
      "statement": "Work creator, executor, tag, priority, and date filters now use popup menus while preserving service filter values; every table todo is a nowrap single-line row with no management column or action buttons, and Inspector retains copy, edit, subtask, reparent, attachment/comment, delete, Automation, and acceptance actions.",
      "basis": "Implemented Renderer structure, behavior, styling, and automated regression assertions.",
      "evidence": [
        "runtime/arcorbit/desktop/renderer/index.html",
        "runtime/arcorbit/desktop/renderer/renderer.js",
        "runtime/arcorbit/desktop/renderer/styles.css",
        "runtime/arcorbit/test/desktop-renderer.test.mjs",
        "node --check runtime/arcorbit/desktop/renderer/renderer.js: passed",
        "node --test runtime/arcorbit/test/desktop-renderer.test.mjs: 39 passed, 0 failed"
      ]
    }
  ],
  "state_impacts": [
    {
      "id": "IMPACT-EXPERIENCE-REPORTED-GAPS",
      "fact_id": "FACT-USER-CHAT-REENTRY-SLOW",
      "fact_revision": 1,
      "target": {
        "kind": "software_decision",
        "ref": "experience_and_interaction",
        "revision": 32
      },
      "effect": "upheld",
      "reason": "Chat immediate re-entry, Work popup/single-line interaction, and Feedback single-line conversation behavior are all realized.",
      "gap_ids": [],
      "evidence": [
        "runtime/arcorbit/desktop/renderer/index.html",
        "runtime/arcorbit/desktop/renderer/renderer.js",
        "runtime/arcorbit/desktop/renderer/styles.css",
        "runtime/arcorbit/test/desktop-renderer.test.mjs",
        "node --check runtime/arcorbit/desktop/renderer/renderer.js: passed",
        "node --test runtime/arcorbit/test/desktop-renderer.test.mjs: 39 passed, 0 failed"
      ]
    },
    {
      "id": "IMPACT-FEEDBACK-CAPABILITY-BOUNDARY",
      "fact_id": "FACT-USER-FEEDBACK-CONVERSATION",
      "fact_revision": 1,
      "target": {
        "kind": "software_decision",
        "ref": "product_capabilities",
        "revision": 20
      },
      "effect": "upheld",
      "reason": "ArcOrbit now exposes the established bidirectional Feedback capability by default with tested failure fallback.",
      "gap_ids": [],
      "evidence": [
        "runtime/arcorbit/src/task-source-adapter.mjs",
        "runtime/arcorbit/src/workshop-platform-adapter.mjs",
        "runtime/arcorbit/desktop/renderer/styles.css",
        "runtime/arcorbit/test/task-source-adapter.test.mjs",
        "runtime/arcorbit/test/desktop-renderer.test.mjs",
        "node --test task-source-adapter, workshop-platform-adapter, platform-coordinator, desktop-renderer: 82 passed, 0 failed"
      ]
    },
    {
      "id": "IMPACT-FEEDBACK-INTEGRATION-BOUNDARY",
      "fact_id": "FACT-USER-FEEDBACK-CONVERSATION",
      "fact_revision": 1,
      "target": {
        "kind": "software_decision",
        "ref": "external_integrations",
        "revision": 10
      },
      "effect": "upheld",
      "reason": "Default per-project V2 probing and bounded V1 fallback now match the corrected integration decision.",
      "gap_ids": [],
      "evidence": [
        "runtime/arcorbit/src/task-source-adapter.mjs",
        "runtime/arcorbit/src/workshop-platform-adapter.mjs",
        "runtime/arcorbit/desktop/renderer/styles.css",
        "runtime/arcorbit/test/task-source-adapter.test.mjs",
        "runtime/arcorbit/test/desktop-renderer.test.mjs",
        "node --test task-source-adapter, workshop-platform-adapter, platform-coordinator, desktop-renderer: 82 passed, 0 failed"
      ]
    },
    {
      "id": "IMPACT-ACCEPTED-FACTS-AWAIT-REALIZATION",
      "fact_id": "FACT-AFFECTED-CONTRACTS-ESTABLISHED",
      "fact_revision": 1,
      "target": {
        "kind": "software_invariant",
        "ref": "accepted-facts-are-realized",
        "revision": null
      },
      "effect": "upheld",
      "reason": "All three accepted executable surface contracts are realized.",
      "gap_ids": [],
      "evidence": [
        "runtime/arcorbit/desktop/renderer/index.html",
        "runtime/arcorbit/desktop/renderer/renderer.js",
        "runtime/arcorbit/desktop/renderer/styles.css",
        "runtime/arcorbit/test/desktop-renderer.test.mjs",
        "node --check runtime/arcorbit/desktop/renderer/renderer.js: passed",
        "node --test runtime/arcorbit/test/desktop-renderer.test.mjs: 39 passed, 0 failed"
      ]
    }
  ],
  "gaps": [
    {
      "id": "GAP-ESTABLISH-AFFECTED-CONTRACTS",
      "status": "resolved",
      "goal": "Establish the current Chat re-entry execution path, Work/Feedback presentation contract, and the authoritative Workshop Feedback versus ArcOrbit bidirectional conversation capability boundary.",
      "reason": "Implementation scope and acceptance depend on facts that the user explicitly reports as slow, visually unsuitable, or incorrectly researched.",
      "derived_from": [
        "FACT-USER-CHAT-REENTRY-SLOW",
        "FACT-USER-WORK-COMPACT-MENU",
        "FACT-USER-FEEDBACK-CONVERSATION"
      ],
      "blocked_by": [],
      "priority_basis": {
        "blocking": "high",
        "uncertainty": "high",
        "risk": "medium",
        "user_impact": "high"
      },
      "responsibility": "agent",
      "evidence_required": [
        "Direct ArcOrbit source-path evidence for Chat re-entry and Work/Feedback rendering.",
        "Direct Workshop Feedback source/API evidence for conversation capabilities.",
        "Durable product, interaction, and technical contract updates where the accepted boundary changes."
      ],
      "resolution": {
        "id": "GAP-ESTABLISH-AFFECTED-CONTRACTS",
        "status": "resolved",
        "outcome": "Chat cause, compact Work/Feedback presentation, and the bidirectional Feedback capability boundary are established.",
        "reason": "Direct local source evidence and synchronized durable artifacts agree.",
        "evidence": [
          "runtime/arcorbit/desktop/renderer/renderer.js",
          "runtime/arcorbit/src/chat-state-coordinator.mjs",
          "runtime/arcorbit/src/task-source-adapter.mjs",
          "runtime/arcorbit/src/platform-coordinator.mjs",
          "runtime/arcorbit/src/workshop-platform-adapter.mjs",
          "runtime/arcorbit/desktop/main.mjs",
          "runtime/arcorbit/desktop/preload.cjs",
          "/Users/Glare/Library/Developer/ModularProgram/hoewo/Workshop-Feedbacks/webapps/feedback-sdk-web/src/components/sdk/FeedbackConversationPanel.tsx",
          "/Users/Glare/Library/Developer/ModularProgram/hoewo/Workshop-Feedbacks/webapps/feedback-console-web/src/components/features/FeedbackConversationPanel.tsx",
          "/Users/Glare/Library/Developer/ModularProgram/hoewo/Workshop-Feedbacks/webapps/feedback-console-web/src/lib/api/feedbackV2Client.ts",
          "arckit/spec/agentic-software-development/arcorbit-planned-workspaces.md",
          "arckit/spec/agentic-software-development/arcorbit-work-management.md",
          "arckit/spec/agentic-software-development/arcorbit-platform-capabilities.md",
          "arckit/interaction/chat-workspace/interaction.md",
          "arckit/interaction/chat-workspace/default.html",
          "arckit/interaction/task-browser/interaction.md",
          "arckit/interaction/task-browser/daily-work.html",
          "arckit/interaction/platform-workspace/interaction.md",
          "arckit/interaction/platform-workspace/default.html",
          "arckit/tech/arcorbit/desktop-execution-solution.md",
          "arckit/tech/arcorbit/platform-composition-solution.md"
        ],
        "occurred_at": "2026-08-23T14:56:00.603Z"
      }
    },
    {
      "id": "GAP-IMPLEMENT-CHAT-IMMEDIATE-REENTRY",
      "status": "resolved",
      "goal": "Make Chat re-entry render immediately from cached state while a visible background snapshot refresh runs.",
      "reason": "Current control flow blocks page rendering on IPC and omits progress feedback.",
      "derived_from": [
        "FACT-USER-CHAT-REENTRY-SLOW",
        "FACT-CHAT-REENTRY-BLOCKS-RENDER",
        "FACT-AFFECTED-CONTRACTS-ESTABLISHED"
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
        "Renderer/coordinator implementation.",
        "Tests for immediate projection and refresh completion."
      ],
      "resolution": {
        "id": "GAP-IMPLEMENT-CHAT-IMMEDIATE-REENTRY",
        "status": "resolved",
        "outcome": "Chat now opens immediately from cached state and refreshes visibly in the background.",
        "reason": "Renderer order, coordinator refresh state, stale-response protection, and targeted tests agree.",
        "evidence": [
          "runtime/arcorbit/desktop/renderer/chat-state-coordinator.mjs",
          "runtime/arcorbit/desktop/renderer/renderer.js",
          "runtime/arcorbit/test/desktop-renderer.test.mjs",
          "node --test runtime/arcorbit/test/desktop-renderer.test.mjs: 38 passed, 0 failed"
        ],
        "occurred_at": "2026-08-23T14:58:02.143Z"
      }
    },
    {
      "id": "GAP-IMPLEMENT-WORK-COMPACT-CONTROLS-ROWS",
      "status": "resolved",
      "goal": "Replace horizontal Work list boxes with popup menus and render each todo as one action-free visual row with complete Inspector actions.",
      "reason": "Current controls and multiline action cells violate the accepted density contract.",
      "derived_from": [
        "FACT-USER-WORK-COMPACT-MENU",
        "FACT-AFFECTED-CONTRACTS-ESTABLISHED"
      ],
      "blocked_by": [],
      "priority_basis": {
        "blocking": "medium",
        "uncertainty": "low",
        "risk": "medium",
        "user_impact": "high"
      },
      "responsibility": "agent",
      "evidence_required": [
        "Renderer HTML/CSS/JS implementation.",
        "Tests for filters, rows, and absent list actions."
      ],
      "resolution": {
        "id": "GAP-IMPLEMENT-WORK-COMPACT-CONTROLS-ROWS",
        "status": "resolved",
        "outcome": "Work now uses popup filter menus and one-line action-free todo rows with complete actions in Inspector.",
        "reason": "HTML semantics, Renderer state flow, compact CSS, syntax validation, and 39 Renderer tests agree.",
        "evidence": [
          "runtime/arcorbit/desktop/renderer/index.html",
          "runtime/arcorbit/desktop/renderer/renderer.js",
          "runtime/arcorbit/desktop/renderer/styles.css",
          "runtime/arcorbit/test/desktop-renderer.test.mjs",
          "node --check runtime/arcorbit/desktop/renderer/renderer.js: passed",
          "node --test runtime/arcorbit/test/desktop-renderer.test.mjs: 39 passed, 0 failed"
        ],
        "occurred_at": "2026-08-23T15:03:12.100Z"
      }
    },
    {
      "id": "GAP-IMPLEMENT-FEEDBACK-CONVERSATION-ROWS",
      "status": "resolved",
      "goal": "Render each Feedback item as one row and probe V2 capability for every active project with truthful V1 fallback.",
      "reason": "The empty-default matcher hides an implemented bidirectional service capability and the list is multiline.",
      "derived_from": [
        "FACT-USER-FEEDBACK-CONVERSATION",
        "FACT-FEEDBACK-WEB-BIDIRECTIONAL-CONTRACT",
        "FACT-FEEDBACK-V2-GATE-HIDES-CONVERSATION",
        "FACT-AFFECTED-CONTRACTS-ESTABLISHED"
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
        "Task-source and Renderer implementation.",
        "Tests for default probing, fallback, single-line rows, and conversation availability."
      ],
      "resolution": {
        "id": "GAP-IMPLEMENT-FEEDBACK-CONVERSATION-ROWS",
        "status": "resolved",
        "outcome": "Feedback is single-line and ArcOrbit exposes existing bidirectional conversations by default with per-project V1 fallback.",
        "reason": "Source defaults, adapter behavior, compact CSS, and 82 targeted tests agree.",
        "evidence": [
          "runtime/arcorbit/src/task-source-adapter.mjs",
          "runtime/arcorbit/src/workshop-platform-adapter.mjs",
          "runtime/arcorbit/desktop/renderer/styles.css",
          "runtime/arcorbit/test/task-source-adapter.test.mjs",
          "runtime/arcorbit/test/desktop-renderer.test.mjs",
          "node --test task-source-adapter, workshop-platform-adapter, platform-coordinator, desktop-renderer: 82 passed, 0 failed"
        ],
        "occurred_at": "2026-08-23T15:00:06.933Z"
      }
    }
  ],
  "content_revision": 4,
  "completion_review": {
    "status": "clean",
    "policy": {
      "initial_max_cycles": 5,
      "source": "Current operator instruction to execute the state-driven loop until complete, 2026-08-23",
      "snapshotted_at": "2026-08-23T14:40:08.161Z"
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
          "git diff --check: passed",
          "npm run check in runtime/arcorbit: 327 tests, 323 passed, 4 skipped, 0 failed",
          "runtime/arcorbit/desktop/renderer/chat-state-coordinator.mjs",
          "runtime/arcorbit/desktop/renderer/index.html",
          "runtime/arcorbit/desktop/renderer/renderer.js",
          "runtime/arcorbit/desktop/renderer/styles.css",
          "runtime/arcorbit/src/task-source-adapter.mjs",
          "runtime/arcorbit/src/workshop-platform-adapter.mjs",
          "runtime/arcorbit/test/desktop-renderer.test.mjs",
          "runtime/arcorbit/test/task-source-adapter.test.mjs",
          "arckit/spec/agentic-software-development/arcorbit-planned-workspaces.md",
          "arckit/spec/agentic-software-development/arcorbit-work-management.md",
          "arckit/spec/agentic-software-development/arcorbit-platform-capabilities.md",
          "arckit/interaction/chat-workspace/interaction.md",
          "arckit/interaction/task-browser/interaction.md",
          "arckit/interaction/platform-workspace/interaction.md",
          "arckit/tech/arcorbit/desktop-execution-solution.md",
          "arckit/tech/arcorbit/platform-composition-solution.md"
        ],
        "occurred_at": "2026-08-23T15:04:50.960Z"
      }
    ],
    "evidence": [
      "git diff --check: passed",
      "npm run check in runtime/arcorbit: 327 tests, 323 passed, 4 skipped, 0 failed",
      "runtime/arcorbit/desktop/renderer/chat-state-coordinator.mjs",
      "runtime/arcorbit/desktop/renderer/index.html",
      "runtime/arcorbit/desktop/renderer/renderer.js",
      "runtime/arcorbit/desktop/renderer/styles.css",
      "runtime/arcorbit/src/task-source-adapter.mjs",
      "runtime/arcorbit/src/workshop-platform-adapter.mjs",
      "runtime/arcorbit/test/desktop-renderer.test.mjs",
      "runtime/arcorbit/test/task-source-adapter.test.mjs",
      "arckit/spec/agentic-software-development/arcorbit-planned-workspaces.md",
      "arckit/spec/agentic-software-development/arcorbit-work-management.md",
      "arckit/spec/agentic-software-development/arcorbit-platform-capabilities.md",
      "arckit/interaction/chat-workspace/interaction.md",
      "arckit/interaction/task-browser/interaction.md",
      "arckit/interaction/platform-workspace/interaction.md",
      "arckit/tech/arcorbit/desktop-execution-solution.md",
      "arckit/tech/arcorbit/platform-composition-solution.md"
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
      "goal": "Establish the current Chat re-entry execution path, Work/Feedback presentation contract, and the authoritative Workshop Feedback versus ArcOrbit bidirectional conversation capability boundary.",
      "outcome": "completed",
      "gap_selection": {
        "mode": "candidate",
        "basis": "The current research gap blocks safe implementation of all three requested surfaces.",
        "snapshot_token": "567b4d7445fcb1f9565e1834f79bdf5807d2f269f4889efd0cbbeb5f3ace6f5f",
        "selected_ref": "case-gap:CASE-20260823-002:GAP-ESTABLISH-AFFECTED-CONTRACTS",
        "comparison_summary": "Compared every persisted Project and Case candidate; the registered Case gap has the highest direct user impact.",
        "fresh_discovery_summary": "Research exposed three downstream implementation gaps, which are recorded for later single-Gap rounds.",
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
            "reason": "Independent scenario evaluation does not address the current ArcOrbit regressions."
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
            "reason": "Broader Runtime resilience is separate from the current page behaviors."
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
            "reason": "Permission validation requires a separate controlled-resource Case."
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
            "reason": "Cross-record auditing remains separate from the explicit product request."
          },
          {
            "ref": "case-gap:CASE-20260823-002:GAP-ESTABLISH-AFFECTED-CONTRACTS",
            "source": "persisted",
            "eligibility": "ready",
            "disposition": "selected",
            "priority_basis": {
              "blocking": "high",
              "uncertainty": "high",
              "risk": "medium",
              "user_impact": "high"
            },
            "reason": "It establishes the exact root cause and corrected capability boundary required before implementation."
          }
        ]
      },
      "selected_gap": {
        "id": "GAP-ESTABLISH-AFFECTED-CONTRACTS",
        "responsibility": "agent",
        "goal": "Establish the current Chat re-entry execution path, Work/Feedback presentation contract, and the authoritative Workshop Feedback versus ArcOrbit bidirectional conversation capability boundary.",
        "reason": "Implementation scope and acceptance depend on facts that the user explicitly reports as slow, visually unsuitable, or incorrectly researched.",
        "derived_from": [
          "FACT-USER-CHAT-REENTRY-SLOW",
          "FACT-USER-WORK-COMPACT-MENU",
          "FACT-USER-FEEDBACK-CONVERSATION"
        ],
        "blocked_by": [],
        "priority_basis": {
          "blocking": "high",
          "uncertainty": "high",
          "risk": "medium",
          "user_impact": "high"
        },
        "evidence_required": [
          "Direct ArcOrbit source-path evidence for Chat re-entry and Work/Feedback rendering.",
          "Direct Workshop Feedback source/API evidence for conversation capabilities.",
          "Durable product, interaction, and technical contract updates where the accepted boundary changes."
        ]
      },
      "planned_transition": {
        "goal": "Establish the current Chat re-entry execution path, Work/Feedback presentation contract, and the authoritative Workshop Feedback versus ArcOrbit bidirectional conversation capability boundary.",
        "expected_state_change": "Accept direct source facts, synchronize stable contracts, and expose three implementation-ready gaps."
      },
      "accepted_state_delta": {
        "resolved_gap": {
          "id": "GAP-ESTABLISH-AFFECTED-CONTRACTS",
          "status": "resolved",
          "outcome": "Chat cause, compact Work/Feedback presentation, and the bidirectional Feedback capability boundary are established.",
          "reason": "Direct local source evidence and synchronized durable artifacts agree.",
          "evidence": [
            "runtime/arcorbit/desktop/renderer/renderer.js",
            "runtime/arcorbit/src/chat-state-coordinator.mjs",
            "runtime/arcorbit/src/task-source-adapter.mjs",
            "runtime/arcorbit/src/platform-coordinator.mjs",
            "runtime/arcorbit/src/workshop-platform-adapter.mjs",
            "runtime/arcorbit/desktop/main.mjs",
            "runtime/arcorbit/desktop/preload.cjs",
            "/Users/Glare/Library/Developer/ModularProgram/hoewo/Workshop-Feedbacks/webapps/feedback-sdk-web/src/components/sdk/FeedbackConversationPanel.tsx",
            "/Users/Glare/Library/Developer/ModularProgram/hoewo/Workshop-Feedbacks/webapps/feedback-console-web/src/components/features/FeedbackConversationPanel.tsx",
            "/Users/Glare/Library/Developer/ModularProgram/hoewo/Workshop-Feedbacks/webapps/feedback-console-web/src/lib/api/feedbackV2Client.ts",
            "arckit/spec/agentic-software-development/arcorbit-planned-workspaces.md",
            "arckit/spec/agentic-software-development/arcorbit-work-management.md",
            "arckit/spec/agentic-software-development/arcorbit-platform-capabilities.md",
            "arckit/interaction/chat-workspace/interaction.md",
            "arckit/interaction/chat-workspace/default.html",
            "arckit/interaction/task-browser/interaction.md",
            "arckit/interaction/task-browser/daily-work.html",
            "arckit/interaction/platform-workspace/interaction.md",
            "arckit/interaction/platform-workspace/default.html",
            "arckit/tech/arcorbit/desktop-execution-solution.md",
            "arckit/tech/arcorbit/platform-composition-solution.md"
          ]
        },
        "facts_added": [
          {
            "id": "FACT-CHAT-REENTRY-BLOCKS-RENDER",
            "revision": 1,
            "status": "accepted",
            "statement": "Chat page re-entry changes the selected page but waits for chatSnapshot IPC before rendering, leaving the previous page visible with no refresh state during a slow request.",
            "basis": "Direct control-flow inspection exactly matches trigger, screen, timing, and missing state.",
            "evidence": [
              "runtime/arcorbit/desktop/renderer/renderer.js",
              "runtime/arcorbit/src/chat-state-coordinator.mjs"
            ]
          },
          {
            "id": "FACT-FEEDBACK-WEB-BIDIRECTIONAL-CONTRACT",
            "revision": 1,
            "status": "accepted",
            "statement": "Workshop Feedback SDK Web lets product users read and send feedback messages and attachments, while Feedback Console Web lets developers read that timeline, reply with text or attachments, process notifications, and mark them read.",
            "basis": "Direct source inspection of both checked-out Workshop Feedback web clients.",
            "evidence": [
              "/Users/Glare/Library/Developer/ModularProgram/hoewo/Workshop-Feedbacks/webapps/feedback-sdk-web/src/components/sdk/FeedbackConversationPanel.tsx",
              "/Users/Glare/Library/Developer/ModularProgram/hoewo/Workshop-Feedbacks/webapps/feedback-console-web/src/components/features/FeedbackConversationPanel.tsx",
              "/Users/Glare/Library/Developer/ModularProgram/hoewo/Workshop-Feedbacks/webapps/feedback-console-web/src/lib/api/feedbackV2Client.ts"
            ]
          },
          {
            "id": "FACT-FEEDBACK-V2-GATE-HIDES-CONVERSATION",
            "revision": 1,
            "status": "accepted",
            "statement": "ArcOrbit implements bounded Feedback V2 messages, developer replies, attachments, notifications, read state, ignore, and convert-to-task, but its default empty V2 project matcher sends ordinary projects to V1 and hides the conversation UI.",
            "basis": "Direct inspection of task source defaults, coordinator, adapter, IPC, and Renderer capability branch.",
            "evidence": [
              "runtime/arcorbit/desktop/renderer/renderer.js",
              "runtime/arcorbit/src/chat-state-coordinator.mjs",
              "runtime/arcorbit/src/task-source-adapter.mjs",
              "runtime/arcorbit/src/platform-coordinator.mjs",
              "runtime/arcorbit/src/workshop-platform-adapter.mjs",
              "runtime/arcorbit/desktop/main.mjs",
              "runtime/arcorbit/desktop/preload.cjs"
            ]
          },
          {
            "id": "FACT-AFFECTED-CONTRACTS-ESTABLISHED",
            "revision": 1,
            "status": "accepted",
            "statement": "Durable contracts now require immediate cached Chat re-entry with visible background refresh, popup Work filters and single-line action-free Work rows, single-line Feedback rows, and default per-project probing of bidirectional Feedback conversation capability with V1 fallback.",
            "basis": "Updated specifications, source/projection interaction pairs, and technical solutions agree.",
            "evidence": [
              "arckit/spec/agentic-software-development/arcorbit-planned-workspaces.md",
              "arckit/spec/agentic-software-development/arcorbit-work-management.md",
              "arckit/spec/agentic-software-development/arcorbit-platform-capabilities.md",
              "arckit/interaction/chat-workspace/interaction.md",
              "arckit/interaction/chat-workspace/default.html",
              "arckit/interaction/task-browser/interaction.md",
              "arckit/interaction/task-browser/daily-work.html",
              "arckit/interaction/platform-workspace/interaction.md",
              "arckit/interaction/platform-workspace/default.html",
              "arckit/tech/arcorbit/desktop-execution-solution.md",
              "arckit/tech/arcorbit/platform-composition-solution.md"
            ]
          }
        ],
        "facts_superseded": [],
        "impacts_added": [
          {
            "id": "IMPACT-ACCEPTED-FACTS-AWAIT-REALIZATION",
            "fact_id": "FACT-AFFECTED-CONTRACTS-ESTABLISHED",
            "fact_revision": 1,
            "target": {
              "kind": "software_invariant",
              "ref": "accepted-facts-are-realized",
              "revision": null
            },
            "effect": "threatened",
            "reason": "The accepted contracts are precise but their executable surfaces still require implementation.",
            "gap_ids": [
              "GAP-IMPLEMENT-CHAT-IMMEDIATE-REENTRY",
              "GAP-IMPLEMENT-WORK-COMPACT-CONTROLS-ROWS",
              "GAP-IMPLEMENT-FEEDBACK-CONVERSATION-ROWS"
            ],
            "evidence": [
              "arckit/spec/agentic-software-development/arcorbit-planned-workspaces.md",
              "arckit/spec/agentic-software-development/arcorbit-work-management.md",
              "arckit/spec/agentic-software-development/arcorbit-platform-capabilities.md",
              "arckit/interaction/chat-workspace/interaction.md",
              "arckit/interaction/chat-workspace/default.html",
              "arckit/interaction/task-browser/interaction.md",
              "arckit/interaction/task-browser/daily-work.html",
              "arckit/interaction/platform-workspace/interaction.md",
              "arckit/interaction/platform-workspace/default.html",
              "arckit/tech/arcorbit/desktop-execution-solution.md",
              "arckit/tech/arcorbit/platform-composition-solution.md"
            ]
          }
        ],
        "impacts_updated": [
          {
            "id": "IMPACT-EXPERIENCE-REPORTED-GAPS",
            "fact_id": "FACT-USER-CHAT-REENTRY-SLOW",
            "fact_revision": 1,
            "target": {
              "kind": "software_decision",
              "ref": "experience_and_interaction",
              "revision": 32
            },
            "effect": "threatened",
            "reason": "The interaction decision captures the desired journeys; implementation remains outstanding.",
            "gap_ids": [
              "GAP-IMPLEMENT-CHAT-IMMEDIATE-REENTRY",
              "GAP-IMPLEMENT-WORK-COMPACT-CONTROLS-ROWS",
              "GAP-IMPLEMENT-FEEDBACK-CONVERSATION-ROWS"
            ],
            "evidence": [
              "arckit/interaction/chat-workspace/interaction.md",
              "arckit/interaction/chat-workspace/default.html",
              "arckit/interaction/task-browser/interaction.md",
              "arckit/interaction/task-browser/daily-work.html",
              "arckit/interaction/platform-workspace/interaction.md",
              "arckit/interaction/platform-workspace/default.html"
            ]
          },
          {
            "id": "IMPACT-FEEDBACK-CAPABILITY-BOUNDARY",
            "fact_id": "FACT-USER-FEEDBACK-CONVERSATION",
            "fact_revision": 1,
            "target": {
              "kind": "software_decision",
              "ref": "product_capabilities",
              "revision": 20
            },
            "effect": "threatened",
            "reason": "The corrected bidirectional capability is settled but ArcOrbit must expose it by default.",
            "gap_ids": [
              "GAP-IMPLEMENT-FEEDBACK-CONVERSATION-ROWS"
            ],
            "evidence": [
              "arckit/spec/agentic-software-development/arcorbit-platform-capabilities.md",
              "/Users/Glare/Library/Developer/ModularProgram/hoewo/Workshop-Feedbacks/webapps/feedback-sdk-web/src/components/sdk/FeedbackConversationPanel.tsx",
              "/Users/Glare/Library/Developer/ModularProgram/hoewo/Workshop-Feedbacks/webapps/feedback-console-web/src/components/features/FeedbackConversationPanel.tsx"
            ]
          },
          {
            "id": "IMPACT-FEEDBACK-INTEGRATION-BOUNDARY",
            "fact_id": "FACT-USER-FEEDBACK-CONVERSATION",
            "fact_revision": 1,
            "target": {
              "kind": "software_decision",
              "ref": "external_integrations",
              "revision": 10
            },
            "effect": "threatened",
            "reason": "The V2 probe and V1 fallback are settled; implementation must remove the empty-default gate.",
            "gap_ids": [
              "GAP-IMPLEMENT-FEEDBACK-CONVERSATION-ROWS"
            ],
            "evidence": [
              "arckit/tech/arcorbit/platform-composition-solution.md",
              "runtime/arcorbit/src/task-source-adapter.mjs"
            ]
          }
        ],
        "gaps_added": [
          {
            "id": "GAP-IMPLEMENT-CHAT-IMMEDIATE-REENTRY",
            "status": "open",
            "goal": "Make Chat re-entry render immediately from cached state while a visible background snapshot refresh runs.",
            "reason": "Current control flow blocks page rendering on IPC and omits progress feedback.",
            "derived_from": [
              "FACT-USER-CHAT-REENTRY-SLOW",
              "FACT-CHAT-REENTRY-BLOCKS-RENDER",
              "FACT-AFFECTED-CONTRACTS-ESTABLISHED"
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
              "Renderer/coordinator implementation.",
              "Tests for immediate projection and refresh completion."
            ],
            "resolution": null
          },
          {
            "id": "GAP-IMPLEMENT-WORK-COMPACT-CONTROLS-ROWS",
            "status": "open",
            "goal": "Replace horizontal Work list boxes with popup menus and render each todo as one action-free visual row with complete Inspector actions.",
            "reason": "Current controls and multiline action cells violate the accepted density contract.",
            "derived_from": [
              "FACT-USER-WORK-COMPACT-MENU",
              "FACT-AFFECTED-CONTRACTS-ESTABLISHED"
            ],
            "blocked_by": [],
            "priority_basis": {
              "blocking": "medium",
              "uncertainty": "low",
              "risk": "medium",
              "user_impact": "high"
            },
            "responsibility": "agent",
            "evidence_required": [
              "Renderer HTML/CSS/JS implementation.",
              "Tests for filters, rows, and absent list actions."
            ],
            "resolution": null
          },
          {
            "id": "GAP-IMPLEMENT-FEEDBACK-CONVERSATION-ROWS",
            "status": "open",
            "goal": "Render each Feedback item as one row and probe V2 capability for every active project with truthful V1 fallback.",
            "reason": "The empty-default matcher hides an implemented bidirectional service capability and the list is multiline.",
            "derived_from": [
              "FACT-USER-FEEDBACK-CONVERSATION",
              "FACT-FEEDBACK-WEB-BIDIRECTIONAL-CONTRACT",
              "FACT-FEEDBACK-V2-GATE-HIDES-CONVERSATION",
              "FACT-AFFECTED-CONTRACTS-ESTABLISHED"
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
              "Task-source and Renderer implementation.",
              "Tests for default probing, fallback, single-line rows, and conversation availability."
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
            "observed_revision": 19,
            "set_decision": {
              "status": "settled",
              "statement": "ArcOrbit 保留 Setup Readiness、受监督的一待办一 thread Automation、trusted ledger transition、介入/恢复、验收反馈、Workshop 平台组合、Work 日常管理与产品反馈能力。Personal / Chat 升级为绑定本地 Product Workspace 的真实 Codex 自由对话，支持持久会话、固定 thread、流式消息、工具与审批状态、停止、失败/重启恢复、重命名和安全删除；Chat 不创建或转换 Idea、Work、Task、Case、ledger 或 Automation Run。Idea、Release、Operations 和 Engineering 继续作为 planning-only 工作空间。既有 Workshop realtime、Work、Feedback、Organization、Domain Profile、Automation human Gate 和分发边界保持不变。 Work 使用弹出式多维筛选与单行无按钮列表，完整动作归于 Inspector。Feedback 使用单行列表，并默认逐项目探测 Workshop 双向会话能力，真实不可用时回退 V1。",
              "reason": "Current operator correction and both Feedback web clients establish the missing daily capability.",
              "evidence": [
                "Current operator input, 2026-08-23",
                "arckit/spec/agentic-software-development/arcorbit-planned-workspaces.md",
                "arckit/spec/agentic-software-development/arcorbit-platform-capabilities.md",
                "arckit/spec/agentic-software-development/arcorbit-work-management.md",
                "/Users/Glare/Library/Developer/ModularProgram/hoewo/Workshop-Feedbacks/webapps/feedback-sdk-web/src/components/sdk/FeedbackConversationPanel.tsx",
                "/Users/Glare/Library/Developer/ModularProgram/hoewo/Workshop-Feedbacks/webapps/feedback-console-web/src/components/features/FeedbackConversationPanel.tsx"
              ],
              "confidence": "high",
              "resume_condition": "Revisit when Work action ownership or Workshop Feedback conversation capabilities materially change."
            },
            "gap_refs": [],
            "reason": "Current operator correction and both Feedback web clients establish the missing daily capability.",
            "evidence": [
              "arckit/spec/agentic-software-development/arcorbit-work-management.md",
              "arckit/spec/agentic-software-development/arcorbit-platform-capabilities.md",
              "/Users/Glare/Library/Developer/ModularProgram/hoewo/Workshop-Feedbacks/webapps/feedback-sdk-web/src/components/sdk/FeedbackConversationPanel.tsx",
              "/Users/Glare/Library/Developer/ModularProgram/hoewo/Workshop-Feedbacks/webapps/feedback-console-web/src/components/features/FeedbackConversationPanel.tsx"
            ]
          },
          {
            "area_ref": "experience_and_interaction",
            "observed_revision": 31,
            "set_decision": {
              "status": "settled",
              "statement": "ArcOrbit 保持 Personal、Product Lifecycle、Organization 三组导航和既有 Work、Automation、Feedback、Organization、Setup、账户及产品反馈语义。Personal / Chat 使用会话列表、独立 transcript 和 Composer：首条非空消息才创建会话；会话固定绑定一个本地 Product Workspace 和 Codex thread；支持选择、重命名、删除、跨页面后台运行和重启恢复。消息以稳定 item 流式更新，支持 Markdown、代码复制、折叠非空 reasoning、单行工具状态、用户审批和智能自动滚动。starting、running、waiting approval 状态均可停止；interrupt 保留部分回答，继续操作会在同一 thread 启动新 turn。删除活动会话先等待 interrupt 终态，失败时不部分删除。没有可用本地工作区时允许保留草稿但禁止发送，并提供配置恢复入口。Chat 不调用 state-driven Runtime，不转换其他对象；Automation task thread、human Gate 和介入工作台保持独立。Idea、Release、Operations 和 Engineering 继续呈现计划交互。 Chat 返回页面时先用缓存会话和 transcript 立即切换，再后台刷新并显示同步或失败状态；Work 横排筛选使用弹出菜单且列表单行无按钮；Feedback 列表单行，详情承载完整会话和动作。",
              "reason": "The explicit operator journey is now captured in synchronized interaction artifacts.",
              "evidence": [
                "Current operator input, 2026-08-23",
                "arckit/interaction/chat-workspace/interaction.md",
                "arckit/interaction/chat-workspace/default.html",
                "arckit/interaction/platform-workspace/interaction.md",
                "arckit/interaction/automation-workspace/interaction.md",
                "arckit/interaction/task-browser/interaction.md",
                "arckit/interaction/task-browser/daily-work.html",
                "arckit/interaction/platform-workspace/default.html"
              ],
              "confidence": "high",
              "resume_condition": "Revisit when Chat navigation caching, Work Inspector ownership, or Feedback conversation interaction changes."
            },
            "gap_refs": [],
            "reason": "The explicit operator journey is now captured in synchronized interaction artifacts.",
            "evidence": [
              "arckit/interaction/chat-workspace/interaction.md",
              "arckit/interaction/chat-workspace/default.html",
              "arckit/interaction/task-browser/interaction.md",
              "arckit/interaction/task-browser/daily-work.html",
              "arckit/interaction/platform-workspace/interaction.md",
              "arckit/interaction/platform-workspace/default.html"
            ]
          },
          {
            "area_ref": "external_integrations",
            "observed_revision": 9,
            "set_decision": {
              "status": "settled",
              "statement": "ArcOrbit 继续通过显式 main-process adapters 集成 Codex app-server/CLI、Workshop 和 Feedback，并保持 Renderer 无凭据、无通用请求能力。真实 Chat 使用可复用的 Codex Conversation 基础层处理 app-server initialize、persistent thread start/resume、turn start/interrupt、streamed items、token usage 和 approval request；ChatCoordinator 直接提交用户文本，不设置 Agent Loop output schema，也不调用 state-driven Runtime、trusted ledger 或 Automation Coordinator。Workshop realtime、Platform Adapter、Automation adapter、Feedback V2 和产品反馈 SDK 的既有契约与恢复行为保持不变。 Workshop Feedback SDK 用户端和 Console 开发者端共同定义双向 V2 消息域；ArcOrbit 对 Workset 项目默认探测开发者能力，列表失败回退 V1，单项失败仅降级对应动作，不用安装包 allowlist 隐藏能力。",
              "reason": "Direct web and ArcOrbit source show that capability gating, not absence of service capability, is the issue.",
              "evidence": [
                "arckit/tech/arcorbit/desktop-execution-solution.md",
                "runtime/arcorbit/src/codex-app-server-adapter.mjs",
                "[Official Codex app-server integration documentation](https://developers.openai.com/codex/app-server)",
                "arckit/tech/arcorbit/platform-composition-solution.md",
                "/Users/Glare/Library/Developer/ModularProgram/hoewo/Workshop-Feedbacks/webapps/feedback-sdk-web/src/components/sdk/FeedbackConversationPanel.tsx",
                "/Users/Glare/Library/Developer/ModularProgram/hoewo/Workshop-Feedbacks/webapps/feedback-console-web/src/components/features/FeedbackConversationPanel.tsx",
                "/Users/Glare/Library/Developer/ModularProgram/hoewo/Workshop-Feedbacks/webapps/feedback-console-web/src/lib/api/feedbackV2Client.ts",
                "runtime/arcorbit/src/task-source-adapter.mjs"
              ],
              "confidence": "high",
              "resume_condition": "Revisit when Workshop Feedback identity, routes, messages, attachments, notifications, or fallback contracts change."
            },
            "gap_refs": [],
            "reason": "Direct web and ArcOrbit source show that capability gating, not absence of service capability, is the issue.",
            "evidence": [
              "arckit/tech/arcorbit/platform-composition-solution.md",
              "/Users/Glare/Library/Developer/ModularProgram/hoewo/Workshop-Feedbacks/webapps/feedback-sdk-web/src/components/sdk/FeedbackConversationPanel.tsx",
              "/Users/Glare/Library/Developer/ModularProgram/hoewo/Workshop-Feedbacks/webapps/feedback-console-web/src/components/features/FeedbackConversationPanel.tsx",
              "/Users/Glare/Library/Developer/ModularProgram/hoewo/Workshop-Feedbacks/webapps/feedback-console-web/src/lib/api/feedbackV2Client.ts",
              "runtime/arcorbit/src/task-source-adapter.mjs"
            ]
          }
        ],
        "software_invariant_changes": [],
        "project_gap_changes": [],
        "selection_context_change": {
          "current_focus": "兑现 Chat 即时重入、Work 紧凑筛选与列表、Feedback 单行与双向对话三个已确认实现 Gap。",
          "project_priorities": [
            "Keep skills generic while Project State owns the concrete software-definition checklist and decisions.",
            "Let one Agent select dynamic gaps from all current facts without facet workflows.",
            "Apply relevant Project State changes atomically in the Gap transition that establishes them."
          ]
        },
        "evidence": [
          "runtime/arcorbit/desktop/renderer/renderer.js",
          "runtime/arcorbit/src/chat-state-coordinator.mjs",
          "runtime/arcorbit/src/task-source-adapter.mjs",
          "runtime/arcorbit/src/platform-coordinator.mjs",
          "runtime/arcorbit/src/workshop-platform-adapter.mjs",
          "runtime/arcorbit/desktop/main.mjs",
          "runtime/arcorbit/desktop/preload.cjs",
          "/Users/Glare/Library/Developer/ModularProgram/hoewo/Workshop-Feedbacks/webapps/feedback-sdk-web/src/components/sdk/FeedbackConversationPanel.tsx",
          "/Users/Glare/Library/Developer/ModularProgram/hoewo/Workshop-Feedbacks/webapps/feedback-console-web/src/components/features/FeedbackConversationPanel.tsx",
          "/Users/Glare/Library/Developer/ModularProgram/hoewo/Workshop-Feedbacks/webapps/feedback-console-web/src/lib/api/feedbackV2Client.ts",
          "arckit/spec/agentic-software-development/arcorbit-planned-workspaces.md",
          "arckit/spec/agentic-software-development/arcorbit-work-management.md",
          "arckit/spec/agentic-software-development/arcorbit-platform-capabilities.md",
          "arckit/interaction/chat-workspace/interaction.md",
          "arckit/interaction/chat-workspace/default.html",
          "arckit/interaction/task-browser/interaction.md",
          "arckit/interaction/task-browser/daily-work.html",
          "arckit/interaction/platform-workspace/interaction.md",
          "arckit/interaction/platform-workspace/default.html",
          "arckit/tech/arcorbit/desktop-execution-solution.md",
          "arckit/tech/arcorbit/platform-composition-solution.md"
        ]
      },
      "invariant_assessment": {
        "project_revision": 185,
        "judgments": [
          {
            "invariant_ref": "product-expectations-remain-recoverable",
            "disposition": "upheld",
            "reason": "Indexed product specifications capture capabilities and non-goals.",
            "fact_refs": [
              "FACT-AFFECTED-CONTRACTS-ESTABLISHED",
              "FACT-FEEDBACK-WEB-BIDIRECTIONAL-CONTRACT"
            ],
            "evidence": [
              "arckit/spec/agentic-software-development/arcorbit-planned-workspaces.md",
              "arckit/spec/agentic-software-development/arcorbit-work-management.md",
              "arckit/spec/agentic-software-development/arcorbit-platform-capabilities.md"
            ],
            "gap_refs": []
          },
          {
            "invariant_ref": "interaction-expectations-remain-recoverable",
            "disposition": "upheld",
            "reason": "Each affected page has synchronized prose and wireframe projection.",
            "fact_refs": [
              "FACT-AFFECTED-CONTRACTS-ESTABLISHED"
            ],
            "evidence": [
              "arckit/interaction/chat-workspace/interaction.md",
              "arckit/interaction/chat-workspace/default.html",
              "arckit/interaction/task-browser/interaction.md",
              "arckit/interaction/task-browser/daily-work.html",
              "arckit/interaction/platform-workspace/interaction.md",
              "arckit/interaction/platform-workspace/default.html"
            ],
            "gap_refs": []
          },
          {
            "invariant_ref": "visual-language-remains-consistent",
            "disposition": "upheld",
            "reason": "Wireframes retain the established grayscale surface while expressing compact controls.",
            "fact_refs": [
              "FACT-AFFECTED-CONTRACTS-ESTABLISHED"
            ],
            "evidence": [
              "arckit/interaction/task-browser/daily-work.html",
              "arckit/interaction/platform-workspace/default.html"
            ],
            "gap_refs": []
          },
          {
            "invariant_ref": "technical-decisions-remain-explainable",
            "disposition": "upheld",
            "reason": "Immediate render and capability probe/fallback responsibilities are explicit.",
            "fact_refs": [
              "FACT-CHAT-REENTRY-BLOCKS-RENDER",
              "FACT-FEEDBACK-V2-GATE-HIDES-CONVERSATION"
            ],
            "evidence": [
              "arckit/tech/arcorbit/desktop-execution-solution.md",
              "arckit/tech/arcorbit/platform-composition-solution.md"
            ],
            "gap_refs": []
          },
          {
            "invariant_ref": "accepted-facts-are-realized",
            "disposition": "threatened",
            "reason": "Contracts are accepted; three subsequent implementation rounds remain.",
            "fact_refs": [
              "FACT-AFFECTED-CONTRACTS-ESTABLISHED"
            ],
            "evidence": [
              "arckit/spec/agentic-software-development/arcorbit-planned-workspaces.md",
              "arckit/spec/agentic-software-development/arcorbit-work-management.md",
              "arckit/spec/agentic-software-development/arcorbit-platform-capabilities.md",
              "arckit/interaction/chat-workspace/interaction.md",
              "arckit/interaction/chat-workspace/default.html",
              "arckit/interaction/task-browser/interaction.md",
              "arckit/interaction/task-browser/daily-work.html",
              "arckit/interaction/platform-workspace/interaction.md",
              "arckit/interaction/platform-workspace/default.html",
              "arckit/tech/arcorbit/desktop-execution-solution.md",
              "arckit/tech/arcorbit/platform-composition-solution.md"
            ],
            "gap_refs": [
              "GAP-IMPLEMENT-CHAT-IMMEDIATE-REENTRY",
              "GAP-IMPLEMENT-WORK-COMPACT-CONTROLS-ROWS",
              "GAP-IMPLEMENT-FEEDBACK-CONVERSATION-ROWS"
            ]
          },
          {
            "invariant_ref": "material-risks-have-credible-evidence",
            "disposition": "upheld",
            "reason": "Both web sides and the ArcOrbit fallback path provide direct risk evidence.",
            "fact_refs": [
              "FACT-FEEDBACK-WEB-BIDIRECTIONAL-CONTRACT",
              "FACT-FEEDBACK-V2-GATE-HIDES-CONVERSATION"
            ],
            "evidence": [
              "/Users/Glare/Library/Developer/ModularProgram/hoewo/Workshop-Feedbacks/webapps/feedback-sdk-web/src/components/sdk/FeedbackConversationPanel.tsx",
              "/Users/Glare/Library/Developer/ModularProgram/hoewo/Workshop-Feedbacks/webapps/feedback-console-web/src/components/features/FeedbackConversationPanel.tsx",
              "/Users/Glare/Library/Developer/ModularProgram/hoewo/Workshop-Feedbacks/webapps/feedback-console-web/src/lib/api/feedbackV2Client.ts",
              "runtime/arcorbit/src/task-source-adapter.mjs"
            ],
            "gap_refs": []
          }
        ]
      },
      "evidence": [
        "runtime/arcorbit/desktop/renderer/renderer.js",
        "runtime/arcorbit/src/chat-state-coordinator.mjs",
        "runtime/arcorbit/src/task-source-adapter.mjs",
        "runtime/arcorbit/src/platform-coordinator.mjs",
        "runtime/arcorbit/src/workshop-platform-adapter.mjs",
        "runtime/arcorbit/desktop/main.mjs",
        "runtime/arcorbit/desktop/preload.cjs",
        "/Users/Glare/Library/Developer/ModularProgram/hoewo/Workshop-Feedbacks/webapps/feedback-sdk-web/src/components/sdk/FeedbackConversationPanel.tsx",
        "/Users/Glare/Library/Developer/ModularProgram/hoewo/Workshop-Feedbacks/webapps/feedback-console-web/src/components/features/FeedbackConversationPanel.tsx",
        "/Users/Glare/Library/Developer/ModularProgram/hoewo/Workshop-Feedbacks/webapps/feedback-console-web/src/lib/api/feedbackV2Client.ts",
        "arckit/spec/agentic-software-development/arcorbit-planned-workspaces.md",
        "arckit/spec/agentic-software-development/arcorbit-work-management.md",
        "arckit/spec/agentic-software-development/arcorbit-platform-capabilities.md",
        "arckit/interaction/chat-workspace/interaction.md",
        "arckit/interaction/chat-workspace/default.html",
        "arckit/interaction/task-browser/interaction.md",
        "arckit/interaction/task-browser/daily-work.html",
        "arckit/interaction/platform-workspace/interaction.md",
        "arckit/interaction/platform-workspace/default.html",
        "arckit/tech/arcorbit/desktop-execution-solution.md",
        "arckit/tech/arcorbit/platform-composition-solution.md"
      ],
      "runtime_result_ref": "",
      "occurred_at": "2026-08-23T14:56:00.603Z"
    },
    {
      "round": 2,
      "transition_schema_version": "arckit-case-transition/v8",
      "goal": "Make Chat re-entry render immediately from cached state while a visible background snapshot refresh runs.",
      "outcome": "completed",
      "gap_selection": {
        "mode": "candidate",
        "basis": "The deterministic Chat render blocker is the smallest high-impact ready candidate.",
        "snapshot_token": "a62fededb8fbe1f918da7e2fd4f158ca297ecbe75c34871f91245ef9f2344c9f",
        "selected_ref": "case-gap:CASE-20260823-002:GAP-IMPLEMENT-CHAT-IMMEDIATE-REENTRY",
        "comparison_summary": "Compared all four Project gaps and three ready Case gaps; Chat has high blocking impact and an independent verified fix.",
        "fresh_discovery_summary": "No additional gap was exposed by implementation or tests.",
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
            "reason": "This Project gap requires a separate Case and does not supersede the current registered user-facing implementation."
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
            "reason": "This Project gap requires a separate Case and does not supersede the current registered user-facing implementation."
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
            "reason": "This Project gap requires a separate Case and does not supersede the current registered user-facing implementation."
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
            "reason": "This Project gap requires a separate Case and does not supersede the current registered user-facing implementation."
          },
          {
            "ref": "case-gap:CASE-20260823-002:GAP-IMPLEMENT-CHAT-IMMEDIATE-REENTRY",
            "source": "persisted",
            "eligibility": "ready",
            "disposition": "selected",
            "priority_basis": {
              "blocking": "high",
              "uncertainty": "low",
              "risk": "medium",
              "user_impact": "high"
            },
            "reason": "Selected because it is a high-impact deterministic blocker with a bounded independent fix."
          },
          {
            "ref": "case-gap:CASE-20260823-002:GAP-IMPLEMENT-WORK-COMPACT-CONTROLS-ROWS",
            "source": "persisted",
            "eligibility": "ready",
            "disposition": "deferred",
            "priority_basis": {
              "blocking": "medium",
              "uncertainty": "low",
              "risk": "medium",
              "user_impact": "high"
            },
            "reason": "Deferred to a subsequent single-Gap round."
          },
          {
            "ref": "case-gap:CASE-20260823-002:GAP-IMPLEMENT-FEEDBACK-CONVERSATION-ROWS",
            "source": "persisted",
            "eligibility": "ready",
            "disposition": "deferred",
            "priority_basis": {
              "blocking": "high",
              "uncertainty": "low",
              "risk": "high",
              "user_impact": "high"
            },
            "reason": "Deferred to a subsequent single-Gap round."
          }
        ]
      },
      "selected_gap": {
        "id": "GAP-IMPLEMENT-CHAT-IMMEDIATE-REENTRY",
        "responsibility": "agent",
        "goal": "Make Chat re-entry render immediately from cached state while a visible background snapshot refresh runs.",
        "reason": "Current control flow blocks page rendering on IPC and omits progress feedback.",
        "derived_from": [
          "FACT-USER-CHAT-REENTRY-SLOW",
          "FACT-CHAT-REENTRY-BLOCKS-RENDER",
          "FACT-AFFECTED-CONTRACTS-ESTABLISHED"
        ],
        "blocked_by": [],
        "priority_basis": {
          "blocking": "high",
          "uncertainty": "low",
          "risk": "medium",
          "user_impact": "high"
        },
        "evidence_required": [
          "Renderer/coordinator implementation.",
          "Tests for immediate projection and refresh completion."
        ]
      },
      "planned_transition": {
        "goal": "Make Chat re-entry render immediately from cached state while a visible background snapshot refresh runs.",
        "expected_state_change": "Render Chat from cached state before background refresh and expose refresh progress without stale response rollback."
      },
      "accepted_state_delta": {
        "resolved_gap": {
          "id": "GAP-IMPLEMENT-CHAT-IMMEDIATE-REENTRY",
          "status": "resolved",
          "outcome": "Chat now opens immediately from cached state and refreshes visibly in the background.",
          "reason": "Renderer order, coordinator refresh state, stale-response protection, and targeted tests agree.",
          "evidence": [
            "runtime/arcorbit/desktop/renderer/chat-state-coordinator.mjs",
            "runtime/arcorbit/desktop/renderer/renderer.js",
            "runtime/arcorbit/test/desktop-renderer.test.mjs",
            "node --test runtime/arcorbit/test/desktop-renderer.test.mjs: 38 passed, 0 failed"
          ]
        },
        "facts_added": [
          {
            "id": "FACT-CHAT-IMMEDIATE-REENTRY-REALIZED",
            "revision": 1,
            "status": "accepted",
            "statement": "Chat navigation now switches and renders cached state before starting snapshot refresh, exposes an aria-busy and visible syncing projection, clears it on completion, and prevents an older overlapping refresh from replacing newer content.",
            "basis": "Implemented control flow and automated regression tests.",
            "evidence": [
              "runtime/arcorbit/desktop/renderer/chat-state-coordinator.mjs",
              "runtime/arcorbit/desktop/renderer/renderer.js",
              "runtime/arcorbit/test/desktop-renderer.test.mjs",
              "node --test runtime/arcorbit/test/desktop-renderer.test.mjs: 38 passed, 0 failed"
            ]
          }
        ],
        "facts_superseded": [],
        "impacts_added": [],
        "impacts_updated": [
          {
            "id": "IMPACT-EXPERIENCE-REPORTED-GAPS",
            "fact_id": "FACT-USER-CHAT-REENTRY-SLOW",
            "fact_revision": 1,
            "target": {
              "kind": "software_decision",
              "ref": "experience_and_interaction",
              "revision": 32
            },
            "effect": "threatened",
            "reason": "Chat re-entry is realized; Work and Feedback density and action placement remain outstanding.",
            "gap_ids": [
              "GAP-IMPLEMENT-WORK-COMPACT-CONTROLS-ROWS",
              "GAP-IMPLEMENT-FEEDBACK-CONVERSATION-ROWS"
            ],
            "evidence": [
              "runtime/arcorbit/desktop/renderer/chat-state-coordinator.mjs",
              "runtime/arcorbit/desktop/renderer/renderer.js",
              "runtime/arcorbit/test/desktop-renderer.test.mjs",
              "node --test runtime/arcorbit/test/desktop-renderer.test.mjs: 38 passed, 0 failed",
              "arckit/interaction/task-browser/interaction.md",
              "arckit/interaction/platform-workspace/interaction.md"
            ]
          },
          {
            "id": "IMPACT-ACCEPTED-FACTS-AWAIT-REALIZATION",
            "fact_id": "FACT-AFFECTED-CONTRACTS-ESTABLISHED",
            "fact_revision": 1,
            "target": {
              "kind": "software_invariant",
              "ref": "accepted-facts-are-realized",
              "revision": null
            },
            "effect": "threatened",
            "reason": "Chat is realized; Work and Feedback executable surfaces still remain.",
            "gap_ids": [
              "GAP-IMPLEMENT-WORK-COMPACT-CONTROLS-ROWS",
              "GAP-IMPLEMENT-FEEDBACK-CONVERSATION-ROWS"
            ],
            "evidence": [
              "runtime/arcorbit/desktop/renderer/chat-state-coordinator.mjs",
              "runtime/arcorbit/desktop/renderer/renderer.js",
              "runtime/arcorbit/test/desktop-renderer.test.mjs",
              "node --test runtime/arcorbit/test/desktop-renderer.test.mjs: 38 passed, 0 failed"
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
        "project_revision": 186,
        "judgments": [
          {
            "invariant_ref": "product-expectations-remain-recoverable",
            "disposition": "upheld",
            "reason": "The bounded Chat change preserves the existing recoverable product, interaction, visual, technical, and risk evidence.",
            "fact_refs": [
              "FACT-CHAT-IMMEDIATE-REENTRY-REALIZED"
            ],
            "evidence": [
              "runtime/arcorbit/desktop/renderer/chat-state-coordinator.mjs",
              "runtime/arcorbit/desktop/renderer/renderer.js",
              "runtime/arcorbit/test/desktop-renderer.test.mjs",
              "node --test runtime/arcorbit/test/desktop-renderer.test.mjs: 38 passed, 0 failed"
            ],
            "gap_refs": []
          },
          {
            "invariant_ref": "interaction-expectations-remain-recoverable",
            "disposition": "upheld",
            "reason": "The bounded Chat change preserves the existing recoverable product, interaction, visual, technical, and risk evidence.",
            "fact_refs": [
              "FACT-CHAT-IMMEDIATE-REENTRY-REALIZED"
            ],
            "evidence": [
              "runtime/arcorbit/desktop/renderer/chat-state-coordinator.mjs",
              "runtime/arcorbit/desktop/renderer/renderer.js",
              "runtime/arcorbit/test/desktop-renderer.test.mjs",
              "node --test runtime/arcorbit/test/desktop-renderer.test.mjs: 38 passed, 0 failed"
            ],
            "gap_refs": []
          },
          {
            "invariant_ref": "visual-language-remains-consistent",
            "disposition": "upheld",
            "reason": "The bounded Chat change preserves the existing recoverable product, interaction, visual, technical, and risk evidence.",
            "fact_refs": [
              "FACT-CHAT-IMMEDIATE-REENTRY-REALIZED"
            ],
            "evidence": [
              "runtime/arcorbit/desktop/renderer/chat-state-coordinator.mjs",
              "runtime/arcorbit/desktop/renderer/renderer.js",
              "runtime/arcorbit/test/desktop-renderer.test.mjs",
              "node --test runtime/arcorbit/test/desktop-renderer.test.mjs: 38 passed, 0 failed"
            ],
            "gap_refs": []
          },
          {
            "invariant_ref": "technical-decisions-remain-explainable",
            "disposition": "upheld",
            "reason": "The bounded Chat change preserves the existing recoverable product, interaction, visual, technical, and risk evidence.",
            "fact_refs": [
              "FACT-CHAT-IMMEDIATE-REENTRY-REALIZED"
            ],
            "evidence": [
              "runtime/arcorbit/desktop/renderer/chat-state-coordinator.mjs",
              "runtime/arcorbit/desktop/renderer/renderer.js",
              "runtime/arcorbit/test/desktop-renderer.test.mjs",
              "node --test runtime/arcorbit/test/desktop-renderer.test.mjs: 38 passed, 0 failed"
            ],
            "gap_refs": []
          },
          {
            "invariant_ref": "accepted-facts-are-realized",
            "disposition": "threatened",
            "reason": "Chat is realized, while the Work and Feedback accepted facts still have ready implementation gaps.",
            "fact_refs": [
              "FACT-CHAT-IMMEDIATE-REENTRY-REALIZED",
              "FACT-AFFECTED-CONTRACTS-ESTABLISHED"
            ],
            "evidence": [
              "runtime/arcorbit/desktop/renderer/chat-state-coordinator.mjs",
              "runtime/arcorbit/desktop/renderer/renderer.js",
              "runtime/arcorbit/test/desktop-renderer.test.mjs",
              "node --test runtime/arcorbit/test/desktop-renderer.test.mjs: 38 passed, 0 failed"
            ],
            "gap_refs": [
              "GAP-IMPLEMENT-WORK-COMPACT-CONTROLS-ROWS",
              "GAP-IMPLEMENT-FEEDBACK-CONVERSATION-ROWS"
            ]
          },
          {
            "invariant_ref": "material-risks-have-credible-evidence",
            "disposition": "upheld",
            "reason": "The bounded Chat change preserves the existing recoverable product, interaction, visual, technical, and risk evidence.",
            "fact_refs": [
              "FACT-CHAT-IMMEDIATE-REENTRY-REALIZED"
            ],
            "evidence": [
              "runtime/arcorbit/desktop/renderer/chat-state-coordinator.mjs",
              "runtime/arcorbit/desktop/renderer/renderer.js",
              "runtime/arcorbit/test/desktop-renderer.test.mjs",
              "node --test runtime/arcorbit/test/desktop-renderer.test.mjs: 38 passed, 0 failed"
            ],
            "gap_refs": []
          }
        ]
      },
      "evidence": [
        "runtime/arcorbit/desktop/renderer/chat-state-coordinator.mjs",
        "runtime/arcorbit/desktop/renderer/renderer.js",
        "runtime/arcorbit/test/desktop-renderer.test.mjs",
        "node --test runtime/arcorbit/test/desktop-renderer.test.mjs: 38 passed, 0 failed"
      ],
      "runtime_result_ref": "",
      "occurred_at": "2026-08-23T14:58:02.143Z"
    },
    {
      "round": 3,
      "transition_schema_version": "arckit-case-transition/v8",
      "goal": "Render each Feedback item as one row and probe V2 capability for every active project with truthful V1 fallback.",
      "outcome": "completed",
      "gap_selection": {
        "mode": "candidate",
        "basis": "Feedback has the highest risk and blocking priority among the two ready Case gaps.",
        "snapshot_token": "c0b4b432a515523b23bb549d311a91c90083a37afb9202d2aa5fd1889244dfe7",
        "selected_ref": "case-gap:CASE-20260823-002:GAP-IMPLEMENT-FEEDBACK-CONVERSATION-ROWS",
        "comparison_summary": "Compared all Project gaps and both Case gaps; correcting hidden bidirectional communication outranks the remaining bounded Work presentation change.",
        "fresh_discovery_summary": "Implementation and targeted tests exposed no additional gap.",
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
            "reason": "This Project gap requires a separate Case and does not supersede the active product correction."
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
            "reason": "This Project gap requires a separate Case and does not supersede the active product correction."
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
            "reason": "This Project gap requires a separate Case and does not supersede the active product correction."
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
            "reason": "This Project gap requires a separate Case and does not supersede the active product correction."
          },
          {
            "ref": "case-gap:CASE-20260823-002:GAP-IMPLEMENT-WORK-COMPACT-CONTROLS-ROWS",
            "source": "persisted",
            "eligibility": "ready",
            "disposition": "deferred",
            "priority_basis": {
              "blocking": "medium",
              "uncertainty": "low",
              "risk": "medium",
              "user_impact": "high"
            },
            "reason": "Deferred to the next single-Gap round."
          },
          {
            "ref": "case-gap:CASE-20260823-002:GAP-IMPLEMENT-FEEDBACK-CONVERSATION-ROWS",
            "source": "persisted",
            "eligibility": "ready",
            "disposition": "selected",
            "priority_basis": {
              "blocking": "high",
              "uncertainty": "low",
              "risk": "high",
              "user_impact": "high"
            },
            "reason": "Selected because it has the highest blocking and integration risk among ready Case gaps."
          }
        ]
      },
      "selected_gap": {
        "id": "GAP-IMPLEMENT-FEEDBACK-CONVERSATION-ROWS",
        "responsibility": "agent",
        "goal": "Render each Feedback item as one row and probe V2 capability for every active project with truthful V1 fallback.",
        "reason": "The empty-default matcher hides an implemented bidirectional service capability and the list is multiline.",
        "derived_from": [
          "FACT-USER-FEEDBACK-CONVERSATION",
          "FACT-FEEDBACK-WEB-BIDIRECTIONAL-CONTRACT",
          "FACT-FEEDBACK-V2-GATE-HIDES-CONVERSATION",
          "FACT-AFFECTED-CONTRACTS-ESTABLISHED"
        ],
        "blocked_by": [],
        "priority_basis": {
          "blocking": "high",
          "uncertainty": "low",
          "risk": "high",
          "user_impact": "high"
        },
        "evidence_required": [
          "Task-source and Renderer implementation.",
          "Tests for default probing, fallback, single-line rows, and conversation availability."
        ]
      },
      "planned_transition": {
        "goal": "Render each Feedback item as one row and probe V2 capability for every active project with truthful V1 fallback.",
        "expected_state_change": "Probe Feedback V2 by default for every project, preserve truthful fallback, and render every feedback item on one visual line."
      },
      "accepted_state_delta": {
        "resolved_gap": {
          "id": "GAP-IMPLEMENT-FEEDBACK-CONVERSATION-ROWS",
          "status": "resolved",
          "outcome": "Feedback is single-line and ArcOrbit exposes existing bidirectional conversations by default with per-project V1 fallback.",
          "reason": "Source defaults, adapter behavior, compact CSS, and 82 targeted tests agree.",
          "evidence": [
            "runtime/arcorbit/src/task-source-adapter.mjs",
            "runtime/arcorbit/src/workshop-platform-adapter.mjs",
            "runtime/arcorbit/desktop/renderer/styles.css",
            "runtime/arcorbit/test/task-source-adapter.test.mjs",
            "runtime/arcorbit/test/desktop-renderer.test.mjs",
            "node --test task-source-adapter, workshop-platform-adapter, platform-coordinator, desktop-renderer: 82 passed, 0 failed"
          ]
        },
        "facts_added": [
          {
            "id": "FACT-FEEDBACK-CONVERSATION-ROWS-REALIZED",
            "revision": 1,
            "status": "accepted",
            "statement": "ArcOrbit now probes Feedback V2 and notifications for every project by default while allowing explicit narrowing; real V2 list failures still fall back to V1, and Feedback list copy and metadata render in one compact nowrap row.",
            "basis": "Implemented defaults and layout with adapter, coordinator, renderer, and task-source regression coverage.",
            "evidence": [
              "runtime/arcorbit/src/task-source-adapter.mjs",
              "runtime/arcorbit/src/workshop-platform-adapter.mjs",
              "runtime/arcorbit/desktop/renderer/styles.css",
              "runtime/arcorbit/test/task-source-adapter.test.mjs",
              "runtime/arcorbit/test/desktop-renderer.test.mjs",
              "node --test task-source-adapter, workshop-platform-adapter, platform-coordinator, desktop-renderer: 82 passed, 0 failed"
            ]
          }
        ],
        "facts_superseded": [],
        "impacts_added": [],
        "impacts_updated": [
          {
            "id": "IMPACT-EXPERIENCE-REPORTED-GAPS",
            "fact_id": "FACT-USER-CHAT-REENTRY-SLOW",
            "fact_revision": 1,
            "target": {
              "kind": "software_decision",
              "ref": "experience_and_interaction",
              "revision": 32
            },
            "effect": "threatened",
            "reason": "Chat and Feedback interaction requirements are realized; only Work compact filters and rows remain.",
            "gap_ids": [
              "GAP-IMPLEMENT-WORK-COMPACT-CONTROLS-ROWS"
            ],
            "evidence": [
              "runtime/arcorbit/src/task-source-adapter.mjs",
              "runtime/arcorbit/src/workshop-platform-adapter.mjs",
              "runtime/arcorbit/desktop/renderer/styles.css",
              "runtime/arcorbit/test/task-source-adapter.test.mjs",
              "runtime/arcorbit/test/desktop-renderer.test.mjs",
              "node --test task-source-adapter, workshop-platform-adapter, platform-coordinator, desktop-renderer: 82 passed, 0 failed"
            ]
          },
          {
            "id": "IMPACT-FEEDBACK-CAPABILITY-BOUNDARY",
            "fact_id": "FACT-USER-FEEDBACK-CONVERSATION",
            "fact_revision": 1,
            "target": {
              "kind": "software_decision",
              "ref": "product_capabilities",
              "revision": 20
            },
            "effect": "upheld",
            "reason": "ArcOrbit now exposes the established bidirectional Feedback capability by default with tested failure fallback.",
            "gap_ids": [],
            "evidence": [
              "runtime/arcorbit/src/task-source-adapter.mjs",
              "runtime/arcorbit/src/workshop-platform-adapter.mjs",
              "runtime/arcorbit/desktop/renderer/styles.css",
              "runtime/arcorbit/test/task-source-adapter.test.mjs",
              "runtime/arcorbit/test/desktop-renderer.test.mjs",
              "node --test task-source-adapter, workshop-platform-adapter, platform-coordinator, desktop-renderer: 82 passed, 0 failed"
            ]
          },
          {
            "id": "IMPACT-FEEDBACK-INTEGRATION-BOUNDARY",
            "fact_id": "FACT-USER-FEEDBACK-CONVERSATION",
            "fact_revision": 1,
            "target": {
              "kind": "software_decision",
              "ref": "external_integrations",
              "revision": 10
            },
            "effect": "upheld",
            "reason": "Default per-project V2 probing and bounded V1 fallback now match the corrected integration decision.",
            "gap_ids": [],
            "evidence": [
              "runtime/arcorbit/src/task-source-adapter.mjs",
              "runtime/arcorbit/src/workshop-platform-adapter.mjs",
              "runtime/arcorbit/desktop/renderer/styles.css",
              "runtime/arcorbit/test/task-source-adapter.test.mjs",
              "runtime/arcorbit/test/desktop-renderer.test.mjs",
              "node --test task-source-adapter, workshop-platform-adapter, platform-coordinator, desktop-renderer: 82 passed, 0 failed"
            ]
          },
          {
            "id": "IMPACT-ACCEPTED-FACTS-AWAIT-REALIZATION",
            "fact_id": "FACT-AFFECTED-CONTRACTS-ESTABLISHED",
            "fact_revision": 1,
            "target": {
              "kind": "software_invariant",
              "ref": "accepted-facts-are-realized",
              "revision": null
            },
            "effect": "threatened",
            "reason": "Chat and Feedback are realized; the Work executable surface remains.",
            "gap_ids": [
              "GAP-IMPLEMENT-WORK-COMPACT-CONTROLS-ROWS"
            ],
            "evidence": [
              "runtime/arcorbit/src/task-source-adapter.mjs",
              "runtime/arcorbit/src/workshop-platform-adapter.mjs",
              "runtime/arcorbit/desktop/renderer/styles.css",
              "runtime/arcorbit/test/task-source-adapter.test.mjs",
              "runtime/arcorbit/test/desktop-renderer.test.mjs",
              "node --test task-source-adapter, workshop-platform-adapter, platform-coordinator, desktop-renderer: 82 passed, 0 failed"
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
        "project_revision": 186,
        "judgments": [
          {
            "invariant_ref": "product-expectations-remain-recoverable",
            "disposition": "upheld",
            "reason": "The Feedback change implements the accepted product, interaction, technical, visual, and failure-degradation contracts with automated evidence.",
            "fact_refs": [
              "FACT-FEEDBACK-CONVERSATION-ROWS-REALIZED"
            ],
            "evidence": [
              "runtime/arcorbit/src/task-source-adapter.mjs",
              "runtime/arcorbit/src/workshop-platform-adapter.mjs",
              "runtime/arcorbit/desktop/renderer/styles.css",
              "runtime/arcorbit/test/task-source-adapter.test.mjs",
              "runtime/arcorbit/test/desktop-renderer.test.mjs",
              "node --test task-source-adapter, workshop-platform-adapter, platform-coordinator, desktop-renderer: 82 passed, 0 failed"
            ],
            "gap_refs": []
          },
          {
            "invariant_ref": "interaction-expectations-remain-recoverable",
            "disposition": "upheld",
            "reason": "The Feedback change implements the accepted product, interaction, technical, visual, and failure-degradation contracts with automated evidence.",
            "fact_refs": [
              "FACT-FEEDBACK-CONVERSATION-ROWS-REALIZED"
            ],
            "evidence": [
              "runtime/arcorbit/src/task-source-adapter.mjs",
              "runtime/arcorbit/src/workshop-platform-adapter.mjs",
              "runtime/arcorbit/desktop/renderer/styles.css",
              "runtime/arcorbit/test/task-source-adapter.test.mjs",
              "runtime/arcorbit/test/desktop-renderer.test.mjs",
              "node --test task-source-adapter, workshop-platform-adapter, platform-coordinator, desktop-renderer: 82 passed, 0 failed"
            ],
            "gap_refs": []
          },
          {
            "invariant_ref": "visual-language-remains-consistent",
            "disposition": "upheld",
            "reason": "The Feedback change implements the accepted product, interaction, technical, visual, and failure-degradation contracts with automated evidence.",
            "fact_refs": [
              "FACT-FEEDBACK-CONVERSATION-ROWS-REALIZED"
            ],
            "evidence": [
              "runtime/arcorbit/src/task-source-adapter.mjs",
              "runtime/arcorbit/src/workshop-platform-adapter.mjs",
              "runtime/arcorbit/desktop/renderer/styles.css",
              "runtime/arcorbit/test/task-source-adapter.test.mjs",
              "runtime/arcorbit/test/desktop-renderer.test.mjs",
              "node --test task-source-adapter, workshop-platform-adapter, platform-coordinator, desktop-renderer: 82 passed, 0 failed"
            ],
            "gap_refs": []
          },
          {
            "invariant_ref": "technical-decisions-remain-explainable",
            "disposition": "upheld",
            "reason": "The Feedback change implements the accepted product, interaction, technical, visual, and failure-degradation contracts with automated evidence.",
            "fact_refs": [
              "FACT-FEEDBACK-CONVERSATION-ROWS-REALIZED"
            ],
            "evidence": [
              "runtime/arcorbit/src/task-source-adapter.mjs",
              "runtime/arcorbit/src/workshop-platform-adapter.mjs",
              "runtime/arcorbit/desktop/renderer/styles.css",
              "runtime/arcorbit/test/task-source-adapter.test.mjs",
              "runtime/arcorbit/test/desktop-renderer.test.mjs",
              "node --test task-source-adapter, workshop-platform-adapter, platform-coordinator, desktop-renderer: 82 passed, 0 failed"
            ],
            "gap_refs": []
          },
          {
            "invariant_ref": "accepted-facts-are-realized",
            "disposition": "threatened",
            "reason": "Chat and Feedback are realized; Work compact controls and rows remain.",
            "fact_refs": [
              "FACT-FEEDBACK-CONVERSATION-ROWS-REALIZED",
              "FACT-AFFECTED-CONTRACTS-ESTABLISHED"
            ],
            "evidence": [
              "runtime/arcorbit/src/task-source-adapter.mjs",
              "runtime/arcorbit/src/workshop-platform-adapter.mjs",
              "runtime/arcorbit/desktop/renderer/styles.css",
              "runtime/arcorbit/test/task-source-adapter.test.mjs",
              "runtime/arcorbit/test/desktop-renderer.test.mjs",
              "node --test task-source-adapter, workshop-platform-adapter, platform-coordinator, desktop-renderer: 82 passed, 0 failed"
            ],
            "gap_refs": [
              "GAP-IMPLEMENT-WORK-COMPACT-CONTROLS-ROWS"
            ]
          },
          {
            "invariant_ref": "material-risks-have-credible-evidence",
            "disposition": "upheld",
            "reason": "The Feedback change implements the accepted product, interaction, technical, visual, and failure-degradation contracts with automated evidence.",
            "fact_refs": [
              "FACT-FEEDBACK-CONVERSATION-ROWS-REALIZED"
            ],
            "evidence": [
              "runtime/arcorbit/src/task-source-adapter.mjs",
              "runtime/arcorbit/src/workshop-platform-adapter.mjs",
              "runtime/arcorbit/desktop/renderer/styles.css",
              "runtime/arcorbit/test/task-source-adapter.test.mjs",
              "runtime/arcorbit/test/desktop-renderer.test.mjs",
              "node --test task-source-adapter, workshop-platform-adapter, platform-coordinator, desktop-renderer: 82 passed, 0 failed"
            ],
            "gap_refs": []
          }
        ]
      },
      "evidence": [
        "runtime/arcorbit/src/task-source-adapter.mjs",
        "runtime/arcorbit/src/workshop-platform-adapter.mjs",
        "runtime/arcorbit/desktop/renderer/styles.css",
        "runtime/arcorbit/test/task-source-adapter.test.mjs",
        "runtime/arcorbit/test/desktop-renderer.test.mjs",
        "node --test task-source-adapter, workshop-platform-adapter, platform-coordinator, desktop-renderer: 82 passed, 0 failed"
      ],
      "runtime_result_ref": "",
      "occurred_at": "2026-08-23T15:00:06.933Z"
    },
    {
      "round": 4,
      "transition_schema_version": "arckit-case-transition/v8",
      "goal": "Replace horizontal Work list boxes with popup menus and render each todo as one action-free visual row with complete Inspector actions.",
      "outcome": "completed",
      "gap_selection": {
        "mode": "candidate",
        "basis": "This is the sole remaining ready Case implementation gap.",
        "snapshot_token": "cbf2e79375d0278df435d5eb2f27a8abe1de28d33d41d2a9216ebbbe3ca3432e",
        "selected_ref": "case-gap:CASE-20260823-002:GAP-IMPLEMENT-WORK-COMPACT-CONTROLS-ROWS",
        "comparison_summary": "Compared all four Project gaps and the remaining Case gap; the current Case implementation must complete before unrelated new Cases.",
        "fresh_discovery_summary": "Implementation and tests exposed no additional gap.",
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
            "reason": "This Project gap requires a separate Case and does not supersede the last active user-facing implementation."
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
            "reason": "This Project gap requires a separate Case and does not supersede the last active user-facing implementation."
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
            "reason": "This Project gap requires a separate Case and does not supersede the last active user-facing implementation."
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
            "reason": "This Project gap requires a separate Case and does not supersede the last active user-facing implementation."
          },
          {
            "ref": "case-gap:CASE-20260823-002:GAP-IMPLEMENT-WORK-COMPACT-CONTROLS-ROWS",
            "source": "persisted",
            "eligibility": "ready",
            "disposition": "selected",
            "priority_basis": {
              "blocking": "medium",
              "uncertainty": "low",
              "risk": "medium",
              "user_impact": "high"
            },
            "reason": "It is the sole remaining ready Case implementation gap."
          }
        ]
      },
      "selected_gap": {
        "id": "GAP-IMPLEMENT-WORK-COMPACT-CONTROLS-ROWS",
        "responsibility": "agent",
        "goal": "Replace horizontal Work list boxes with popup menus and render each todo as one action-free visual row with complete Inspector actions.",
        "reason": "Current controls and multiline action cells violate the accepted density contract.",
        "derived_from": [
          "FACT-USER-WORK-COMPACT-MENU",
          "FACT-AFFECTED-CONTRACTS-ESTABLISHED"
        ],
        "blocked_by": [],
        "priority_basis": {
          "blocking": "medium",
          "uncertainty": "low",
          "risk": "medium",
          "user_impact": "high"
        },
        "evidence_required": [
          "Renderer HTML/CSS/JS implementation.",
          "Tests for filters, rows, and absent list actions."
        ]
      },
      "planned_transition": {
        "goal": "Replace horizontal Work list boxes with popup menus and render each todo as one action-free visual row with complete Inspector actions.",
        "expected_state_change": "Use popup filters, keep server filter semantics, render one-line action-free rows, and retain full actions in Inspector."
      },
      "accepted_state_delta": {
        "resolved_gap": {
          "id": "GAP-IMPLEMENT-WORK-COMPACT-CONTROLS-ROWS",
          "status": "resolved",
          "outcome": "Work now uses popup filter menus and one-line action-free todo rows with complete actions in Inspector.",
          "reason": "HTML semantics, Renderer state flow, compact CSS, syntax validation, and 39 Renderer tests agree.",
          "evidence": [
            "runtime/arcorbit/desktop/renderer/index.html",
            "runtime/arcorbit/desktop/renderer/renderer.js",
            "runtime/arcorbit/desktop/renderer/styles.css",
            "runtime/arcorbit/test/desktop-renderer.test.mjs",
            "node --check runtime/arcorbit/desktop/renderer/renderer.js: passed",
            "node --test runtime/arcorbit/test/desktop-renderer.test.mjs: 39 passed, 0 failed"
          ]
        },
        "facts_added": [
          {
            "id": "FACT-WORK-COMPACT-CONTROLS-ROWS-REALIZED",
            "revision": 1,
            "status": "accepted",
            "statement": "Work creator, executor, tag, priority, and date filters now use popup menus while preserving service filter values; every table todo is a nowrap single-line row with no management column or action buttons, and Inspector retains copy, edit, subtask, reparent, attachment/comment, delete, Automation, and acceptance actions.",
            "basis": "Implemented Renderer structure, behavior, styling, and automated regression assertions.",
            "evidence": [
              "runtime/arcorbit/desktop/renderer/index.html",
              "runtime/arcorbit/desktop/renderer/renderer.js",
              "runtime/arcorbit/desktop/renderer/styles.css",
              "runtime/arcorbit/test/desktop-renderer.test.mjs",
              "node --check runtime/arcorbit/desktop/renderer/renderer.js: passed",
              "node --test runtime/arcorbit/test/desktop-renderer.test.mjs: 39 passed, 0 failed"
            ]
          }
        ],
        "facts_superseded": [],
        "impacts_added": [],
        "impacts_updated": [
          {
            "id": "IMPACT-EXPERIENCE-REPORTED-GAPS",
            "fact_id": "FACT-USER-CHAT-REENTRY-SLOW",
            "fact_revision": 1,
            "target": {
              "kind": "software_decision",
              "ref": "experience_and_interaction",
              "revision": 32
            },
            "effect": "upheld",
            "reason": "Chat immediate re-entry, Work popup/single-line interaction, and Feedback single-line conversation behavior are all realized.",
            "gap_ids": [],
            "evidence": [
              "runtime/arcorbit/desktop/renderer/index.html",
              "runtime/arcorbit/desktop/renderer/renderer.js",
              "runtime/arcorbit/desktop/renderer/styles.css",
              "runtime/arcorbit/test/desktop-renderer.test.mjs",
              "node --check runtime/arcorbit/desktop/renderer/renderer.js: passed",
              "node --test runtime/arcorbit/test/desktop-renderer.test.mjs: 39 passed, 0 failed"
            ]
          },
          {
            "id": "IMPACT-ACCEPTED-FACTS-AWAIT-REALIZATION",
            "fact_id": "FACT-AFFECTED-CONTRACTS-ESTABLISHED",
            "fact_revision": 1,
            "target": {
              "kind": "software_invariant",
              "ref": "accepted-facts-are-realized",
              "revision": null
            },
            "effect": "upheld",
            "reason": "All three accepted executable surface contracts are realized.",
            "gap_ids": [],
            "evidence": [
              "runtime/arcorbit/desktop/renderer/index.html",
              "runtime/arcorbit/desktop/renderer/renderer.js",
              "runtime/arcorbit/desktop/renderer/styles.css",
              "runtime/arcorbit/test/desktop-renderer.test.mjs",
              "node --check runtime/arcorbit/desktop/renderer/renderer.js: passed",
              "node --test runtime/arcorbit/test/desktop-renderer.test.mjs: 39 passed, 0 failed"
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
        "project_revision": 186,
        "judgments": [
          {
            "invariant_ref": "product-expectations-remain-recoverable",
            "disposition": "upheld",
            "reason": "All accepted Chat, Work, and Feedback facts are now realized in bounded source with automated evidence, while durable product, interaction, visual, technical, and risk contracts remain recoverable.",
            "fact_refs": [
              "FACT-WORK-COMPACT-CONTROLS-ROWS-REALIZED",
              "FACT-AFFECTED-CONTRACTS-ESTABLISHED"
            ],
            "evidence": [
              "runtime/arcorbit/desktop/renderer/index.html",
              "runtime/arcorbit/desktop/renderer/renderer.js",
              "runtime/arcorbit/desktop/renderer/styles.css",
              "runtime/arcorbit/test/desktop-renderer.test.mjs",
              "node --check runtime/arcorbit/desktop/renderer/renderer.js: passed",
              "node --test runtime/arcorbit/test/desktop-renderer.test.mjs: 39 passed, 0 failed"
            ],
            "gap_refs": []
          },
          {
            "invariant_ref": "interaction-expectations-remain-recoverable",
            "disposition": "upheld",
            "reason": "All accepted Chat, Work, and Feedback facts are now realized in bounded source with automated evidence, while durable product, interaction, visual, technical, and risk contracts remain recoverable.",
            "fact_refs": [
              "FACT-WORK-COMPACT-CONTROLS-ROWS-REALIZED",
              "FACT-AFFECTED-CONTRACTS-ESTABLISHED"
            ],
            "evidence": [
              "runtime/arcorbit/desktop/renderer/index.html",
              "runtime/arcorbit/desktop/renderer/renderer.js",
              "runtime/arcorbit/desktop/renderer/styles.css",
              "runtime/arcorbit/test/desktop-renderer.test.mjs",
              "node --check runtime/arcorbit/desktop/renderer/renderer.js: passed",
              "node --test runtime/arcorbit/test/desktop-renderer.test.mjs: 39 passed, 0 failed"
            ],
            "gap_refs": []
          },
          {
            "invariant_ref": "visual-language-remains-consistent",
            "disposition": "upheld",
            "reason": "All accepted Chat, Work, and Feedback facts are now realized in bounded source with automated evidence, while durable product, interaction, visual, technical, and risk contracts remain recoverable.",
            "fact_refs": [
              "FACT-WORK-COMPACT-CONTROLS-ROWS-REALIZED",
              "FACT-AFFECTED-CONTRACTS-ESTABLISHED"
            ],
            "evidence": [
              "runtime/arcorbit/desktop/renderer/index.html",
              "runtime/arcorbit/desktop/renderer/renderer.js",
              "runtime/arcorbit/desktop/renderer/styles.css",
              "runtime/arcorbit/test/desktop-renderer.test.mjs",
              "node --check runtime/arcorbit/desktop/renderer/renderer.js: passed",
              "node --test runtime/arcorbit/test/desktop-renderer.test.mjs: 39 passed, 0 failed"
            ],
            "gap_refs": []
          },
          {
            "invariant_ref": "technical-decisions-remain-explainable",
            "disposition": "upheld",
            "reason": "All accepted Chat, Work, and Feedback facts are now realized in bounded source with automated evidence, while durable product, interaction, visual, technical, and risk contracts remain recoverable.",
            "fact_refs": [
              "FACT-WORK-COMPACT-CONTROLS-ROWS-REALIZED",
              "FACT-AFFECTED-CONTRACTS-ESTABLISHED"
            ],
            "evidence": [
              "runtime/arcorbit/desktop/renderer/index.html",
              "runtime/arcorbit/desktop/renderer/renderer.js",
              "runtime/arcorbit/desktop/renderer/styles.css",
              "runtime/arcorbit/test/desktop-renderer.test.mjs",
              "node --check runtime/arcorbit/desktop/renderer/renderer.js: passed",
              "node --test runtime/arcorbit/test/desktop-renderer.test.mjs: 39 passed, 0 failed"
            ],
            "gap_refs": []
          },
          {
            "invariant_ref": "accepted-facts-are-realized",
            "disposition": "upheld",
            "reason": "All accepted Chat, Work, and Feedback facts are now realized in bounded source with automated evidence, while durable product, interaction, visual, technical, and risk contracts remain recoverable.",
            "fact_refs": [
              "FACT-WORK-COMPACT-CONTROLS-ROWS-REALIZED",
              "FACT-AFFECTED-CONTRACTS-ESTABLISHED"
            ],
            "evidence": [
              "runtime/arcorbit/desktop/renderer/index.html",
              "runtime/arcorbit/desktop/renderer/renderer.js",
              "runtime/arcorbit/desktop/renderer/styles.css",
              "runtime/arcorbit/test/desktop-renderer.test.mjs",
              "node --check runtime/arcorbit/desktop/renderer/renderer.js: passed",
              "node --test runtime/arcorbit/test/desktop-renderer.test.mjs: 39 passed, 0 failed"
            ],
            "gap_refs": []
          },
          {
            "invariant_ref": "material-risks-have-credible-evidence",
            "disposition": "upheld",
            "reason": "All accepted Chat, Work, and Feedback facts are now realized in bounded source with automated evidence, while durable product, interaction, visual, technical, and risk contracts remain recoverable.",
            "fact_refs": [
              "FACT-WORK-COMPACT-CONTROLS-ROWS-REALIZED",
              "FACT-AFFECTED-CONTRACTS-ESTABLISHED"
            ],
            "evidence": [
              "runtime/arcorbit/desktop/renderer/index.html",
              "runtime/arcorbit/desktop/renderer/renderer.js",
              "runtime/arcorbit/desktop/renderer/styles.css",
              "runtime/arcorbit/test/desktop-renderer.test.mjs",
              "node --check runtime/arcorbit/desktop/renderer/renderer.js: passed",
              "node --test runtime/arcorbit/test/desktop-renderer.test.mjs: 39 passed, 0 failed"
            ],
            "gap_refs": []
          }
        ]
      },
      "evidence": [
        "runtime/arcorbit/desktop/renderer/index.html",
        "runtime/arcorbit/desktop/renderer/renderer.js",
        "runtime/arcorbit/desktop/renderer/styles.css",
        "runtime/arcorbit/test/desktop-renderer.test.mjs",
        "node --check runtime/arcorbit/desktop/renderer/renderer.js: passed",
        "node --test runtime/arcorbit/test/desktop-renderer.test.mjs: 39 passed, 0 failed"
      ],
      "runtime_result_ref": "",
      "occurred_at": "2026-08-23T15:03:12.100Z"
    },
    {
      "round": 5,
      "transition_schema_version": "arckit-case-transition/v8",
      "goal": "Review the completed implementation for correctness, real problem resolution, verification credibility, regression risk, and minimality.",
      "outcome": "completed",
      "gap_selection": {
        "mode": "candidate",
        "basis": "All normal obligations are closed and the completion review is the only ready Case candidate.",
        "snapshot_token": "274f9bc4704f0e985f1de9c012902597d24f970fb1e51763dd85dc469f3a2a88",
        "selected_ref": "case-gap:CASE-20260823-002:CASE-20260823-002:completion-review:1",
        "comparison_summary": "Compared the four separate Project gaps with the current Case review gate; none is in this Case scope or more important than determining its completed state.",
        "fresh_discovery_summary": "Static review, focused tests, and the full ArcOrbit check exposed no fresh normal gap.",
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
            "reason": "This unrelated Project gap requires its own Case and is outside the completed current Case review."
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
            "reason": "This unrelated Project gap requires its own Case and is outside the completed current Case review."
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
            "reason": "This unrelated Project gap requires its own Case and is outside the completed current Case review."
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
            "reason": "This unrelated Project gap requires its own Case and is outside the completed current Case review."
          },
          {
            "ref": "case-gap:CASE-20260823-002:CASE-20260823-002:completion-review:1",
            "source": "persisted",
            "eligibility": "ready",
            "disposition": "selected",
            "priority_basis": {
              "blocking": "high",
              "uncertainty": "low",
              "risk": "high",
              "user_impact": "high"
            },
            "reason": "All normal Case obligations are closed, so the implementation-focused completion gate is now the only ready Case candidate."
          }
        ]
      },
      "selected_gap": {
        "id": "CASE-20260823-002:completion-review:1",
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
        "goal": "Review the completed implementation for correctness, real problem resolution, verification credibility, regression risk, and minimality.",
        "expected_state_change": "Record a clean five-dimension review for content revision 4 and close the Case."
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
            "git diff --check: passed",
            "npm run check in runtime/arcorbit: 327 tests, 323 passed, 4 skipped, 0 failed",
            "runtime/arcorbit/desktop/renderer/chat-state-coordinator.mjs",
            "runtime/arcorbit/desktop/renderer/index.html",
            "runtime/arcorbit/desktop/renderer/renderer.js",
            "runtime/arcorbit/desktop/renderer/styles.css",
            "runtime/arcorbit/src/task-source-adapter.mjs",
            "runtime/arcorbit/src/workshop-platform-adapter.mjs",
            "runtime/arcorbit/test/desktop-renderer.test.mjs",
            "runtime/arcorbit/test/task-source-adapter.test.mjs",
            "arckit/spec/agentic-software-development/arcorbit-planned-workspaces.md",
            "arckit/spec/agentic-software-development/arcorbit-work-management.md",
            "arckit/spec/agentic-software-development/arcorbit-platform-capabilities.md",
            "arckit/interaction/chat-workspace/interaction.md",
            "arckit/interaction/task-browser/interaction.md",
            "arckit/interaction/platform-workspace/interaction.md",
            "arckit/tech/arcorbit/desktop-execution-solution.md",
            "arckit/tech/arcorbit/platform-composition-solution.md"
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
        "project_revision": 186,
        "judgments": [
          {
            "invariant_ref": "product-expectations-remain-recoverable",
            "disposition": "upheld",
            "reason": "Completion review found the implementation consistent with accepted facts and durable contracts, with full regression evidence and no unresolved Case gap.",
            "fact_refs": [
              "FACT-CHAT-IMMEDIATE-REENTRY-REALIZED",
              "FACT-WORK-COMPACT-CONTROLS-ROWS-REALIZED",
              "FACT-FEEDBACK-CONVERSATION-ROWS-REALIZED"
            ],
            "evidence": [
              "git diff --check: passed",
              "npm run check in runtime/arcorbit: 327 tests, 323 passed, 4 skipped, 0 failed",
              "runtime/arcorbit/desktop/renderer/chat-state-coordinator.mjs",
              "runtime/arcorbit/desktop/renderer/index.html",
              "runtime/arcorbit/desktop/renderer/renderer.js",
              "runtime/arcorbit/desktop/renderer/styles.css",
              "runtime/arcorbit/src/task-source-adapter.mjs",
              "runtime/arcorbit/src/workshop-platform-adapter.mjs",
              "runtime/arcorbit/test/desktop-renderer.test.mjs",
              "runtime/arcorbit/test/task-source-adapter.test.mjs",
              "arckit/spec/agentic-software-development/arcorbit-planned-workspaces.md",
              "arckit/spec/agentic-software-development/arcorbit-work-management.md",
              "arckit/spec/agentic-software-development/arcorbit-platform-capabilities.md",
              "arckit/interaction/chat-workspace/interaction.md",
              "arckit/interaction/task-browser/interaction.md",
              "arckit/interaction/platform-workspace/interaction.md",
              "arckit/tech/arcorbit/desktop-execution-solution.md",
              "arckit/tech/arcorbit/platform-composition-solution.md"
            ],
            "gap_refs": []
          },
          {
            "invariant_ref": "interaction-expectations-remain-recoverable",
            "disposition": "upheld",
            "reason": "Completion review found the implementation consistent with accepted facts and durable contracts, with full regression evidence and no unresolved Case gap.",
            "fact_refs": [
              "FACT-CHAT-IMMEDIATE-REENTRY-REALIZED",
              "FACT-WORK-COMPACT-CONTROLS-ROWS-REALIZED",
              "FACT-FEEDBACK-CONVERSATION-ROWS-REALIZED"
            ],
            "evidence": [
              "git diff --check: passed",
              "npm run check in runtime/arcorbit: 327 tests, 323 passed, 4 skipped, 0 failed",
              "runtime/arcorbit/desktop/renderer/chat-state-coordinator.mjs",
              "runtime/arcorbit/desktop/renderer/index.html",
              "runtime/arcorbit/desktop/renderer/renderer.js",
              "runtime/arcorbit/desktop/renderer/styles.css",
              "runtime/arcorbit/src/task-source-adapter.mjs",
              "runtime/arcorbit/src/workshop-platform-adapter.mjs",
              "runtime/arcorbit/test/desktop-renderer.test.mjs",
              "runtime/arcorbit/test/task-source-adapter.test.mjs",
              "arckit/spec/agentic-software-development/arcorbit-planned-workspaces.md",
              "arckit/spec/agentic-software-development/arcorbit-work-management.md",
              "arckit/spec/agentic-software-development/arcorbit-platform-capabilities.md",
              "arckit/interaction/chat-workspace/interaction.md",
              "arckit/interaction/task-browser/interaction.md",
              "arckit/interaction/platform-workspace/interaction.md",
              "arckit/tech/arcorbit/desktop-execution-solution.md",
              "arckit/tech/arcorbit/platform-composition-solution.md"
            ],
            "gap_refs": []
          },
          {
            "invariant_ref": "visual-language-remains-consistent",
            "disposition": "upheld",
            "reason": "Completion review found the implementation consistent with accepted facts and durable contracts, with full regression evidence and no unresolved Case gap.",
            "fact_refs": [
              "FACT-CHAT-IMMEDIATE-REENTRY-REALIZED",
              "FACT-WORK-COMPACT-CONTROLS-ROWS-REALIZED",
              "FACT-FEEDBACK-CONVERSATION-ROWS-REALIZED"
            ],
            "evidence": [
              "git diff --check: passed",
              "npm run check in runtime/arcorbit: 327 tests, 323 passed, 4 skipped, 0 failed",
              "runtime/arcorbit/desktop/renderer/chat-state-coordinator.mjs",
              "runtime/arcorbit/desktop/renderer/index.html",
              "runtime/arcorbit/desktop/renderer/renderer.js",
              "runtime/arcorbit/desktop/renderer/styles.css",
              "runtime/arcorbit/src/task-source-adapter.mjs",
              "runtime/arcorbit/src/workshop-platform-adapter.mjs",
              "runtime/arcorbit/test/desktop-renderer.test.mjs",
              "runtime/arcorbit/test/task-source-adapter.test.mjs",
              "arckit/spec/agentic-software-development/arcorbit-planned-workspaces.md",
              "arckit/spec/agentic-software-development/arcorbit-work-management.md",
              "arckit/spec/agentic-software-development/arcorbit-platform-capabilities.md",
              "arckit/interaction/chat-workspace/interaction.md",
              "arckit/interaction/task-browser/interaction.md",
              "arckit/interaction/platform-workspace/interaction.md",
              "arckit/tech/arcorbit/desktop-execution-solution.md",
              "arckit/tech/arcorbit/platform-composition-solution.md"
            ],
            "gap_refs": []
          },
          {
            "invariant_ref": "technical-decisions-remain-explainable",
            "disposition": "upheld",
            "reason": "Completion review found the implementation consistent with accepted facts and durable contracts, with full regression evidence and no unresolved Case gap.",
            "fact_refs": [
              "FACT-CHAT-IMMEDIATE-REENTRY-REALIZED",
              "FACT-WORK-COMPACT-CONTROLS-ROWS-REALIZED",
              "FACT-FEEDBACK-CONVERSATION-ROWS-REALIZED"
            ],
            "evidence": [
              "git diff --check: passed",
              "npm run check in runtime/arcorbit: 327 tests, 323 passed, 4 skipped, 0 failed",
              "runtime/arcorbit/desktop/renderer/chat-state-coordinator.mjs",
              "runtime/arcorbit/desktop/renderer/index.html",
              "runtime/arcorbit/desktop/renderer/renderer.js",
              "runtime/arcorbit/desktop/renderer/styles.css",
              "runtime/arcorbit/src/task-source-adapter.mjs",
              "runtime/arcorbit/src/workshop-platform-adapter.mjs",
              "runtime/arcorbit/test/desktop-renderer.test.mjs",
              "runtime/arcorbit/test/task-source-adapter.test.mjs",
              "arckit/spec/agentic-software-development/arcorbit-planned-workspaces.md",
              "arckit/spec/agentic-software-development/arcorbit-work-management.md",
              "arckit/spec/agentic-software-development/arcorbit-platform-capabilities.md",
              "arckit/interaction/chat-workspace/interaction.md",
              "arckit/interaction/task-browser/interaction.md",
              "arckit/interaction/platform-workspace/interaction.md",
              "arckit/tech/arcorbit/desktop-execution-solution.md",
              "arckit/tech/arcorbit/platform-composition-solution.md"
            ],
            "gap_refs": []
          },
          {
            "invariant_ref": "accepted-facts-are-realized",
            "disposition": "upheld",
            "reason": "Completion review found the implementation consistent with accepted facts and durable contracts, with full regression evidence and no unresolved Case gap.",
            "fact_refs": [
              "FACT-CHAT-IMMEDIATE-REENTRY-REALIZED",
              "FACT-WORK-COMPACT-CONTROLS-ROWS-REALIZED",
              "FACT-FEEDBACK-CONVERSATION-ROWS-REALIZED"
            ],
            "evidence": [
              "git diff --check: passed",
              "npm run check in runtime/arcorbit: 327 tests, 323 passed, 4 skipped, 0 failed",
              "runtime/arcorbit/desktop/renderer/chat-state-coordinator.mjs",
              "runtime/arcorbit/desktop/renderer/index.html",
              "runtime/arcorbit/desktop/renderer/renderer.js",
              "runtime/arcorbit/desktop/renderer/styles.css",
              "runtime/arcorbit/src/task-source-adapter.mjs",
              "runtime/arcorbit/src/workshop-platform-adapter.mjs",
              "runtime/arcorbit/test/desktop-renderer.test.mjs",
              "runtime/arcorbit/test/task-source-adapter.test.mjs",
              "arckit/spec/agentic-software-development/arcorbit-planned-workspaces.md",
              "arckit/spec/agentic-software-development/arcorbit-work-management.md",
              "arckit/spec/agentic-software-development/arcorbit-platform-capabilities.md",
              "arckit/interaction/chat-workspace/interaction.md",
              "arckit/interaction/task-browser/interaction.md",
              "arckit/interaction/platform-workspace/interaction.md",
              "arckit/tech/arcorbit/desktop-execution-solution.md",
              "arckit/tech/arcorbit/platform-composition-solution.md"
            ],
            "gap_refs": []
          },
          {
            "invariant_ref": "material-risks-have-credible-evidence",
            "disposition": "upheld",
            "reason": "Completion review found the implementation consistent with accepted facts and durable contracts, with full regression evidence and no unresolved Case gap.",
            "fact_refs": [
              "FACT-CHAT-IMMEDIATE-REENTRY-REALIZED",
              "FACT-WORK-COMPACT-CONTROLS-ROWS-REALIZED",
              "FACT-FEEDBACK-CONVERSATION-ROWS-REALIZED"
            ],
            "evidence": [
              "git diff --check: passed",
              "npm run check in runtime/arcorbit: 327 tests, 323 passed, 4 skipped, 0 failed",
              "runtime/arcorbit/desktop/renderer/chat-state-coordinator.mjs",
              "runtime/arcorbit/desktop/renderer/index.html",
              "runtime/arcorbit/desktop/renderer/renderer.js",
              "runtime/arcorbit/desktop/renderer/styles.css",
              "runtime/arcorbit/src/task-source-adapter.mjs",
              "runtime/arcorbit/src/workshop-platform-adapter.mjs",
              "runtime/arcorbit/test/desktop-renderer.test.mjs",
              "runtime/arcorbit/test/task-source-adapter.test.mjs",
              "arckit/spec/agentic-software-development/arcorbit-planned-workspaces.md",
              "arckit/spec/agentic-software-development/arcorbit-work-management.md",
              "arckit/spec/agentic-software-development/arcorbit-platform-capabilities.md",
              "arckit/interaction/chat-workspace/interaction.md",
              "arckit/interaction/task-browser/interaction.md",
              "arckit/interaction/platform-workspace/interaction.md",
              "arckit/tech/arcorbit/desktop-execution-solution.md",
              "arckit/tech/arcorbit/platform-composition-solution.md"
            ],
            "gap_refs": []
          }
        ]
      },
      "evidence": [
        "git diff --check: passed",
        "npm run check in runtime/arcorbit: 327 tests, 323 passed, 4 skipped, 0 failed",
        "runtime/arcorbit/desktop/renderer/chat-state-coordinator.mjs",
        "runtime/arcorbit/desktop/renderer/index.html",
        "runtime/arcorbit/desktop/renderer/renderer.js",
        "runtime/arcorbit/desktop/renderer/styles.css",
        "runtime/arcorbit/src/task-source-adapter.mjs",
        "runtime/arcorbit/src/workshop-platform-adapter.mjs",
        "runtime/arcorbit/test/desktop-renderer.test.mjs",
        "runtime/arcorbit/test/task-source-adapter.test.mjs",
        "arckit/spec/agentic-software-development/arcorbit-planned-workspaces.md",
        "arckit/spec/agentic-software-development/arcorbit-work-management.md",
        "arckit/spec/agentic-software-development/arcorbit-platform-capabilities.md",
        "arckit/interaction/chat-workspace/interaction.md",
        "arckit/interaction/task-browser/interaction.md",
        "arckit/interaction/platform-workspace/interaction.md",
        "arckit/tech/arcorbit/desktop-execution-solution.md",
        "arckit/tech/arcorbit/platform-composition-solution.md"
      ],
      "runtime_result_ref": "",
      "occurred_at": "2026-08-23T15:04:50.960Z"
    }
  ],
  "case_resolution": {
    "status": "resolved",
    "stage": "resolved",
    "satisfied": [
      "GAP-ESTABLISH-AFFECTED-CONTRACTS",
      "GAP-IMPLEMENT-CHAT-IMMEDIATE-REENTRY",
      "GAP-IMPLEMENT-WORK-COMPACT-CONTROLS-ROWS",
      "GAP-IMPLEMENT-FEEDBACK-CONVERSATION-ROWS"
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
    "updated_at": "2026-08-23T15:04:50.960Z"
  }
}
```

## Round Notes

- Case history is canonical in Structured Record.rounds; keep prose notes exceptional.
