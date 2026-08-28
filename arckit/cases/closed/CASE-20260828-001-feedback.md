# Feedback 未读消息加载与刷新策略

Case: CASE-20260828-001
Status: closed
Artifact Type: mixed
Selected Gap: none
Updated: 2026-08-28T20:12:10.108Z

## User Intent

分析并修复 ArcOrbit Feedback 沟通记录中未读计数更新但新消息不可见、且用户无法主动刷新的问题。

## Structured Record

```json
{
  "schema_version": "development-case-record/v5",
  "id": "CASE-20260828-001",
  "title": "Feedback 未读消息加载与刷新策略",
  "status": "closed",
  "artifact_type": "mixed",
  "created_at": "2026-08-28T19:33:22.683Z",
  "updated_at": "2026-08-28T20:12:10.108Z",
  "user_intent": "分析并修复 ArcOrbit Feedback 沟通记录中未读计数更新但新消息不可见、且用户无法主动刷新的问题。",
  "expected_outcome": "形成有实现证据和交互依据的加载策略，使用户能够及时看到新回复，并在自动同步失败时具备明确恢复方式；随后完成相应实现与验证。",
  "project_state_ref": "arckit/project/state.record.json",
  "current_round": {
    "goal": "",
    "selected_gap": null
  },
  "facts": [
    {
      "id": "FACT-20260828-001-001",
      "revision": 1,
      "status": "accepted",
      "statement": "ArcOrbit Feedback 沟通记录在用户回复后能够显示“1 条未读”，但对应未读消息没有加载到消息列表，界面也没有可触发重新加载的刷新入口。",
      "basis": "当前操作者对真实产品行为的直接报告。",
      "evidence": [
        "Current operator input, 2026-08-29"
      ]
    },
    {
      "id": "FACT-20260828-001-002",
      "revision": 1,
      "status": "accepted",
      "statement": "当前 Project State 已接受 ArcOrbit 产品反馈中心使用 Feedback SDK V2，并显示 SDK 未读数量角标。",
      "basis": "Fresh canonical Project State 的 feedback_and_support 决策。",
      "evidence": [
        "project:decision:feedback_and_support",
        "arckit/spec/agentic-software-development/arcorbit-platform-capabilities.md",
        "arckit/interaction/product-feedback-center/interaction.md",
        "arckit/tech/arcorbit/product-feedback-integration.md"
      ]
    },
    {
      "id": "FACT-20260828-001-003",
      "revision": 1,
      "status": "accepted",
      "statement": "用户报告对应 ArcOrbit 主窗口 Feedback 页的 Workset 开发者管理 V2 会话，而不是固定 Project 107 的独立产品反馈 SDK WebView；两者必须保持独立集成语义。",
      "basis": "主窗口 Feedback Renderer 的沟通记录和 feedback_management 未读投影与报告完全匹配。",
      "evidence": [
        "runtime/arcorbit/desktop/renderer/index.html:194",
        "runtime/arcorbit/desktop/renderer/renderer.js:2310",
        "arckit/tech/arcorbit/product-feedback-integration.md"
      ]
    },
    {
      "id": "FACT-20260828-001-004",
      "revision": 1,
      "status": "accepted",
      "statement": "ArcOrbit 每 30 秒和用户刷新时会重新取得 Feedback V2 通知并更新 unread_count/unread_feedback_ids，但 feedbackConversations 按 feedback id 独立缓存；只在缓存不存在时自动加载消息，页面级和详情级刷新均不调用消息接口，因此已打开会话可持续显示旧消息。",
      "basis": "Renderer、Platform Coordinator 和 Workshop Platform Adapter 数据流与未读数更新、消息不更新和刷新无效三个表现完全匹配。",
      "evidence": [
        "runtime/arcorbit/desktop/renderer/renderer.js:314",
        "runtime/arcorbit/desktop/renderer/renderer.js:2324",
        "runtime/arcorbit/desktop/renderer/renderer.js:2373",
        "runtime/arcorbit/desktop/renderer/renderer.js:2380",
        "runtime/arcorbit/desktop/renderer/renderer.js:2514",
        "runtime/arcorbit/src/platform-coordinator.mjs:23",
        "runtime/arcorbit/src/workshop-platform-adapter.mjs:124"
      ]
    },
    {
      "id": "FACT-20260828-001-005",
      "revision": 1,
      "status": "accepted",
      "statement": "Workset Feedback V2 沟通记录必须同时具备自动加载和手动刷新兜底：首次打开或 fresh notification snapshot 标记当前反馈有未读回复时自动重拉消息；页面级、详情级或沟通记录刷新时同时刷新 feedback/notification snapshot 与当前会话。只有消息成功加载后才标记已读，失败时保留旧消息和重试。",
      "basis": "自动加载是未读提示后的正常主路径；手动刷新为事件延迟、网络恢复和缓存异常提供恢复。参考 Console 和用户 SDK 采用相同边界。",
      "evidence": [
        "/Users/Glare/Library/Developer/ModularProgram/hoewo/Workshop-Feedbacks/webapps/feedback-console-web/src/components/features/FeedbackManagementDialog.tsx:482",
        "/Users/Glare/Library/Developer/ModularProgram/hoewo/Workshop-Feedbacks/webapps/feedback-console-web/src/components/features/FeedbackManagementDialog.tsx:490",
        "/Users/Glare/Library/Developer/ModularProgram/hoewo/Workshop-Feedbacks/webapps/feedback-console-web/src/components/features/FeedbackManagementDialog.tsx:680",
        "/Users/Glare/Library/Developer/ModularProgram/hoewo/Workshop-Feedbacks/webapps/feedback-sdk-web/src/components/sdk/FeedbackConversationPanel.tsx:40"
      ]
    },
    {
      "id": "FACT-20260828-001-006",
      "revision": 1,
      "status": "accepted",
      "statement": "自动或手动重载当前会话时必须保留回复草稿、已选附件和 Inspector 滚动上下文，去重同一会话并发加载，并阻止过期响应覆盖更新结果。",
      "basis": "当前 Renderer 已保存 draft、file 和 scrollTop；新增加载触发会扩大并发与状态覆盖风险。",
      "evidence": [
        "runtime/arcorbit/desktop/renderer/renderer.js:2340",
        "runtime/arcorbit/desktop/renderer/renderer.js:2449",
        "runtime/arcorbit/desktop/renderer/renderer.js:2514",
        "/Users/Glare/Library/Developer/ModularProgram/hoewo/Workshop-Feedbacks/webapps/feedback-sdk-web/src/components/sdk/FeedbackConversationPanel.tsx:33"
      ]
    },
    {
      "id": "FACT-20260828-001-007",
      "revision": 1,
      "status": "accepted",
      "statement": "ArcOrbit Workset Feedback V2 已实现会话新鲜度闭环：首次选择或 fresh 未读触发当前会话重载；页面级、详情级和沟通记录刷新均组合读取 snapshot 与当前会话；消息成功后才标记已读；同一会话请求去重，身份或序号过期的响应被丢弃；失败保留旧消息、未读、草稿、附件和详情滚动位置。",
      "basis": "Renderer 实现、稳定产品工件、聚焦行为测试和完整 ArcOrbit 回归相互一致。",
      "evidence": [
        "runtime/arcorbit/desktop/renderer/renderer.js",
        "runtime/arcorbit/test/desktop-renderer.test.mjs",
        "arckit/spec/agentic-software-development/arcorbit-platform-capabilities.md",
        "arckit/interaction/platform-workspace/interaction.md",
        "arckit/interaction/platform-workspace/default.html",
        "arckit/tech/arcorbit/platform-composition-solution.md",
        "Verification: 81/81 related tests passed",
        "Verification: npm run check passed with 0 failures"
      ]
    }
  ],
  "state_impacts": [
    {
      "id": "IMPACT-20260828-001-001",
      "fact_id": "FACT-20260828-001-001",
      "fact_revision": 1,
      "target": {
        "kind": "software_decision",
        "ref": "feedback_and_support",
        "revision": 6
      },
      "effect": "upheld",
      "reason": "报告属于 Workset Feedback 开发者管理；固定 Project 107 产品反馈中心的独立 SDK WebView 边界未被否定。",
      "gap_ids": [],
      "evidence": [
        "local:fact:reported-surface-is-workset-feedback",
        "arckit/tech/arcorbit/product-feedback-integration.md"
      ]
    },
    {
      "id": "IMPACT-20260828-001-002",
      "fact_id": "FACT-20260828-001-001",
      "fact_revision": 1,
      "target": {
        "kind": "software_decision",
        "ref": "experience_and_interaction",
        "revision": 62
      },
      "effect": "upheld",
      "reason": "自动加载、三个手动刷新入口、成功后已读、失败恢复和本地状态保持均已在交互工件与 Renderer 中兑现。",
      "gap_ids": [],
      "evidence": [
        "arckit/interaction/platform-workspace/interaction.md:29",
        "arckit/interaction/platform-workspace/default.html:83",
        "runtime/arcorbit/desktop/renderer/renderer.js:2376",
        "runtime/arcorbit/desktop/renderer/renderer.js:2479",
        "runtime/arcorbit/test/desktop-renderer.test.mjs:1187"
      ]
    },
    {
      "id": "IMPACT-20260828-001-003",
      "fact_id": "FACT-20260828-001-001",
      "fact_revision": 1,
      "target": {
        "kind": "software_invariant",
        "ref": "interaction-expectations-remain-recoverable",
        "revision": null
      },
      "effect": "upheld",
      "reason": "本轮把自动加载、手动恢复、已读时机和状态保持写入 Project 交互决策；实际实现由独立 Gap 跟踪。",
      "gap_ids": [],
      "evidence": [
        "project:decision:experience_and_interaction",
        "local:fact:auto-and-manual-refresh-decision",
        "local:fact:refresh-safety-boundary"
      ]
    },
    {
      "id": "IMPACT-20260828-001-004",
      "fact_id": "FACT-20260828-001-001",
      "fact_revision": 1,
      "target": {
        "kind": "software_invariant",
        "ref": "accepted-facts-are-realized",
        "revision": null
      },
      "effect": "upheld",
      "reason": "实际软件会在 fresh 未读或用户刷新时重新取得当前消息，不再只更新未读数并保留旧会话。",
      "gap_ids": [],
      "evidence": [
        "runtime/arcorbit/desktop/renderer/renderer.js:2383",
        "runtime/arcorbit/desktop/renderer/renderer.js:2454",
        "runtime/arcorbit/test/desktop-renderer.test.mjs:1187",
        "Verification: 81/81 related tests passed"
      ]
    },
    {
      "id": "IMPACT-20260828-001-005",
      "fact_id": "FACT-20260828-001-004",
      "fact_revision": 1,
      "target": {
        "kind": "software_decision",
        "ref": "external_integrations",
        "revision": 13
      },
      "effect": "upheld",
      "reason": "Renderer 保持受控 Platform Adapter 边界，并显式协调独立的 notification snapshot 与消息请求。",
      "gap_ids": [],
      "evidence": [
        "runtime/arcorbit/desktop/renderer/renderer.js:2454",
        "runtime/arcorbit/desktop/renderer/renderer.js:2553",
        "arckit/tech/arcorbit/platform-composition-solution.md:182",
        "Verification: 81/81 Feedback Renderer/Coordinator/Adapter tests passed"
      ]
    },
    {
      "id": "IMPACT-20260828-001-006",
      "fact_id": "FACT-20260828-001-005",
      "fact_revision": 1,
      "target": {
        "kind": "software_decision",
        "ref": "technical_foundation",
        "revision": 44
      },
      "effect": "upheld",
      "reason": "Renderer 已实现 unread freshness、组合刷新、project/feedback 请求身份、单调序号和过期响应隔离，并保留失败前状态。",
      "gap_ids": [],
      "evidence": [
        "runtime/arcorbit/desktop/renderer/renderer.js:2440",
        "runtime/arcorbit/desktop/renderer/renderer.js:2447",
        "runtime/arcorbit/desktop/renderer/renderer.js:2553",
        "arckit/tech/arcorbit/platform-composition-solution.md:182",
        "arckit/tech/arcorbit/platform-composition-solution.md:317"
      ]
    },
    {
      "id": "IMPACT-20260828-001-007",
      "fact_id": "FACT-20260828-001-006",
      "fact_revision": 1,
      "target": {
        "kind": "software_decision",
        "ref": "quality_and_validation",
        "revision": 22
      },
      "effect": "upheld",
      "reason": "行为测试覆盖自动与三个手动触发、成功后已读、同会话去重、跨项目同 ID 旧响应隔离、失败状态保持和详情滚动保持；相关套件及完整 check 均通过。",
      "gap_ids": [],
      "evidence": [
        "runtime/arcorbit/test/desktop-renderer.test.mjs:1187",
        "runtime/arcorbit/test/desktop-renderer.test.mjs:1249",
        "runtime/arcorbit/test/desktop-renderer.test.mjs:1343",
        "Verification: 81/81 related tests passed",
        "Verification: npm run check passed with 524 passed, 21 conditional skips, 0 failed"
      ]
    }
  ],
  "gaps": [
    {
      "id": "GAP-20260828-001-001",
      "status": "resolved",
      "goal": "检查 Feedback SDK V2 契约、ArcOrbit 未读计数与消息列表加载实现以及持久交互证据，确定未读回复应如何自动加载，以及是否必须同时提供可见的手动刷新恢复入口。",
      "reason": "“只加刷新”与“自动加载并提供刷新兜底”会形成不同的产品语义、技术范围和验收方式；必须先建立这一前置诊断与决策，才能界定后续实现。",
      "derived_from": [
        "FACT-20260828-001-001",
        "FACT-20260828-001-002"
      ],
      "blocked_by": [],
      "priority_basis": {
        "blocking": "阻塞 Feedback 新回复的可靠读取与后续修复范围界定。",
        "uncertainty": "未确认未读计数和消息列表的数据源、事件机制、缓存及加载触发。",
        "risk": "只增加人工刷新可能掩盖同步缺陷；只做自动刷新又可能缺少失败恢复入口。",
        "user_impact": "用户已被告知存在新回复，却无法查看内容。"
      },
      "responsibility": "agent",
      "evidence_required": [
        "Feedback SDK V2 消息与未读相关接口或事件契约",
        "ArcOrbit Feedback 消息列表、未读计数及页面生命周期加载路径",
        "现有产品规格、交互和技术方案中的消息更新与恢复语义",
        "支持最终策略的可重复行为证据"
      ],
      "resolution": {
        "id": "GAP-20260828-001-001",
        "status": "resolved",
        "outcome": "resolved",
        "reason": "代码路径完整解释现象：Platform snapshot 独立拉取通知并更新未读数；Renderer 按 feedback id 缓存会话且仅在无缓存时加载；现有刷新只调用 refreshSnapshot。参考 Console 将实时、定时和手动刷新联动到当前会话，用户 SDK 也提供消息刷新。",
        "evidence": [
          "runtime/arcorbit/desktop/renderer/renderer.js:314",
          "runtime/arcorbit/desktop/renderer/renderer.js:2324",
          "runtime/arcorbit/desktop/renderer/renderer.js:2373",
          "runtime/arcorbit/desktop/renderer/renderer.js:2380",
          "runtime/arcorbit/desktop/renderer/renderer.js:2514",
          "runtime/arcorbit/src/platform-coordinator.mjs:23",
          "runtime/arcorbit/src/workshop-platform-adapter.mjs:124",
          "/Users/Glare/Library/Developer/ModularProgram/hoewo/Workshop-Feedbacks/webapps/feedback-console-web/src/components/features/FeedbackManagementDialog.tsx:490",
          "/Users/Glare/Library/Developer/ModularProgram/hoewo/Workshop-Feedbacks/webapps/feedback-sdk-web/src/components/sdk/FeedbackConversationPanel.tsx:40",
          "Verification: 78 targeted tests passed"
        ],
        "occurred_at": "2026-08-28T19:45:40.110Z"
      }
    },
    {
      "id": "GAP-20260828-001-002",
      "status": "resolved",
      "goal": "实现并持久化 Workset Feedback V2 会话新鲜度规则：未读触发选中会话自动重载，页面级、详情级和沟通记录手动刷新同时重载 snapshot 与当前会话，并以回归测试证明状态、并发和已读边界。",
      "reason": "诊断已确定正确策略，但当前代码和持久产品工件尚未兑现。",
      "derived_from": [
        "FACT-20260828-001-004",
        "FACT-20260828-001-005",
        "FACT-20260828-001-006"
      ],
      "blocked_by": [],
      "priority_basis": {
        "blocking": "直接阻塞新回复读取和 Case 解决。",
        "uncertainty": "需实现最小的缓存失效与请求身份机制。",
        "risk": "可能产生重复请求、旧响应覆盖、草稿丢失或提前清除未读。",
        "user_impact": "当前缺陷仍存在。"
      },
      "responsibility": "agent",
      "evidence_required": [
        "选中未读反馈自动重载消息的行为测试",
        "页面级、详情级和沟通记录刷新均重载当前会话的行为测试",
        "加载成功后才标记已读、失败保留旧消息和恢复入口的测试",
        "并发或旧响应隔离及草稿、附件、滚动保持测试",
        "相关 spec、interaction、tech 与实现一致"
      ],
      "resolution": {
        "id": "GAP-20260828-001-002",
        "status": "resolved",
        "outcome": "resolved",
        "reason": "Renderer 现以 notification snapshot epoch、project/feedback 身份和单调请求序号协调会话：fresh 未读自动重拉，页面级、详情级和沟通记录刷新均组合刷新 snapshot 与当前会话，消息成功后才标记已读；失败保留缓存消息和本地编辑状态，重复及过期响应不能覆盖当前结果。稳定 spec、interaction、tech、线框及索引已经同步，相关与完整回归均通过。",
        "evidence": [
          "runtime/arcorbit/desktop/renderer/renderer.js:160",
          "runtime/arcorbit/desktop/renderer/renderer.js:661",
          "runtime/arcorbit/desktop/renderer/renderer.js:2376",
          "runtime/arcorbit/desktop/renderer/renderer.js:2383",
          "runtime/arcorbit/desktop/renderer/renderer.js:2447",
          "runtime/arcorbit/desktop/renderer/renderer.js:2454",
          "runtime/arcorbit/desktop/renderer/renderer.js:2479",
          "runtime/arcorbit/desktop/renderer/renderer.js:2553",
          "runtime/arcorbit/test/desktop-renderer.test.mjs:1187",
          "runtime/arcorbit/test/desktop-renderer.test.mjs:1249",
          "runtime/arcorbit/test/desktop-renderer.test.mjs:1343",
          "arckit/spec/agentic-software-development/arcorbit-platform-capabilities.md:473",
          "arckit/interaction/platform-workspace/interaction.md:29",
          "arckit/interaction/platform-workspace/default.html:83",
          "arckit/tech/arcorbit/platform-composition-solution.md:182",
          "arckit/tech/arcorbit/platform-composition-solution.md:317",
          "Verification: 81/81 Feedback Renderer/Coordinator/Adapter tests passed",
          "Verification: npm run check passed with 524 passed, 21 conditional skips, 0 failed"
        ],
        "occurred_at": "2026-08-28T20:00:14.798Z"
      }
    },
    {
      "id": "CASE-20260828-001:review-finding:FINDING-20260828-001-001",
      "status": "resolved",
      "goal": "Resolve review finding: Feedback V2 已读回写失败分支在写入 readError 前未校验当前 request identity；旧或过期的 mark-read rejection 可污染较新会话状态。需要在失败分支加入与成功分支相同的 identity guard，并补充 mark-read 等待期间启动较新请求的竞态回归测试。",
      "reason": "error found by completion review",
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
        "runtime/arcorbit/desktop/renderer/renderer.js",
        "runtime/arcorbit/test/desktop-renderer.test.mjs",
        "runtime/arcorbit/desktop/renderer/renderer.js:2584",
        "runtime/arcorbit/desktop/renderer/renderer.js:2585",
        "runtime/arcorbit/desktop/renderer/renderer.js:2589",
        "runtime/arcorbit/desktop/renderer/renderer.js:2590",
        "runtime/arcorbit/test/desktop-renderer.test.mjs:1249",
        "runtime/arcorbit/test/desktop-renderer.test.mjs:1304",
        "runtime/arcorbit/test/desktop-renderer.test.mjs:1332"
      ],
      "resolution": {
        "id": "CASE-20260828-001:review-finding:FINDING-20260828-001-001",
        "status": "resolved",
        "outcome": "resolved",
        "reason": "markFeedbackV2Read 的 catch 分支现在先验证 feedback id、project/feedback request key 和单调 request id；过期 rejection 直接返回，不会写入当前会话 readError。回归测试显式让旧项目 mark-read 等待、启动并完成较新同 ID 会话，再拒绝旧请求，证明当前消息、身份和错误状态保持不变。",
        "evidence": [
          "runtime/arcorbit/desktop/renderer/renderer.js:2584",
          "runtime/arcorbit/desktop/renderer/renderer.js:2589",
          "runtime/arcorbit/desktop/renderer/renderer.js:2590",
          "runtime/arcorbit/test/desktop-renderer.test.mjs:1249",
          "runtime/arcorbit/test/desktop-renderer.test.mjs:1306",
          "runtime/arcorbit/test/desktop-renderer.test.mjs:1349",
          "runtime/arcorbit/test/desktop-renderer.test.mjs:1365",
          "Verification: regression test failed before the guard with readError='stale mark-read failure'",
          "Verification: targeted stale-response regression passed after the guard",
          "Verification: 81/81 Feedback Renderer/Coordinator/Adapter tests passed",
          "Verification: npm run check passed with 524 passed, 21 conditional skips, 0 failed",
          "Verification: renderer syntax check and git diff --check passed"
        ],
        "occurred_at": "2026-08-28T20:10:05.694Z"
      }
    }
  ],
  "content_revision": 3,
  "completion_review": {
    "status": "clean",
    "policy": {
      "initial_max_cycles": 10,
      "source": "runtime/arcorbit/config/case-policy.json",
      "snapshotted_at": "2026-08-28T19:33:22.683Z"
    },
    "additional_cycles_authorized": 0,
    "cycle_count": 2,
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
        "outcome": "findings",
        "content_revision": 2,
        "dimensions": {
          "implementation_correctness": "findings",
          "problem_resolution": "clean",
          "verification_credibility": "findings",
          "regression_risk": "findings",
          "minimality": "clean"
        },
        "finding_ids": [
          "FINDING-20260828-001-001"
        ],
        "evidence": [
          "runtime/arcorbit/desktop/renderer/renderer.js:2577",
          "runtime/arcorbit/desktop/renderer/renderer.js:2601",
          "runtime/arcorbit/test/desktop-renderer.test.mjs:1187",
          "runtime/arcorbit/test/desktop-renderer.test.mjs:1249",
          "runtime/arcorbit/test/desktop-renderer.test.mjs:1343",
          "Verification: 81/81 Feedback Renderer/Coordinator/Adapter tests passed during Completion Review",
          "Verification: git diff --check passed",
          "Verification: node --check runtime/arcorbit/desktop/renderer/renderer.js passed",
          "Prior verification: npm run check passed with 524 passed, 21 conditional skips, 0 failed"
        ],
        "occurred_at": "2026-08-28T20:04:34.395Z"
      },
      {
        "cycle": 2,
        "autonomous_cycle": 2,
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
          "runtime/arcorbit/desktop/renderer/renderer.js:2578",
          "runtime/arcorbit/desktop/renderer/renderer.js:2585",
          "runtime/arcorbit/desktop/renderer/renderer.js:2590",
          "runtime/arcorbit/desktop/renderer/renderer.js:2597",
          "runtime/arcorbit/test/desktop-renderer.test.mjs:1249",
          "runtime/arcorbit/test/desktop-renderer.test.mjs:1349",
          "runtime/arcorbit/test/desktop-renderer.test.mjs:1365",
          "arckit/spec/agentic-software-development/arcorbit-platform-capabilities.md:473",
          "arckit/interaction/platform-workspace/interaction.md:29",
          "arckit/tech/arcorbit/platform-composition-solution.md:182",
          "Verification during Completion Review: targeted stale mark-read regression passed 1/1",
          "Verification during Completion Review: 81/81 Feedback Renderer/Coordinator/Adapter tests passed",
          "Verification during Completion Review: renderer syntax check and git diff --check passed",
          "Content revision 3 verification: npm run check passed with 524 passed, 21 conditional skips, 0 failed"
        ],
        "occurred_at": "2026-08-28T20:12:10.108Z"
      }
    ],
    "evidence": [
      "runtime/arcorbit/desktop/renderer/renderer.js:2577",
      "runtime/arcorbit/desktop/renderer/renderer.js:2601",
      "runtime/arcorbit/test/desktop-renderer.test.mjs:1187",
      "runtime/arcorbit/test/desktop-renderer.test.mjs:1249",
      "runtime/arcorbit/test/desktop-renderer.test.mjs:1343",
      "Verification: 81/81 Feedback Renderer/Coordinator/Adapter tests passed during Completion Review",
      "Verification: git diff --check passed",
      "Verification: node --check runtime/arcorbit/desktop/renderer/renderer.js passed",
      "Prior verification: npm run check passed with 524 passed, 21 conditional skips, 0 failed",
      "runtime/arcorbit/desktop/renderer/renderer.js:2578",
      "runtime/arcorbit/desktop/renderer/renderer.js:2585",
      "runtime/arcorbit/desktop/renderer/renderer.js:2590",
      "runtime/arcorbit/desktop/renderer/renderer.js:2597",
      "runtime/arcorbit/test/desktop-renderer.test.mjs:1349",
      "runtime/arcorbit/test/desktop-renderer.test.mjs:1365",
      "arckit/spec/agentic-software-development/arcorbit-platform-capabilities.md:473",
      "arckit/interaction/platform-workspace/interaction.md:29",
      "arckit/tech/arcorbit/platform-composition-solution.md:182",
      "Verification during Completion Review: targeted stale mark-read regression passed 1/1",
      "Verification during Completion Review: 81/81 Feedback Renderer/Coordinator/Adapter tests passed",
      "Verification during Completion Review: renderer syntax check and git diff --check passed",
      "Content revision 3 verification: npm run check passed with 524 passed, 21 conditional skips, 0 failed"
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
      "goal": "接受 Feedback V2 未读通知、消息缓存和刷新触发的根因事实，并确定自动加载与手动恢复边界。",
      "outcome": "completed",
      "gap_selection": {
        "mode": "candidate",
        "basis": "Fresh trusted state 新增了一个并发 Automation Case；它不覆盖当前 Feedback 用户事项。当前 Feedback 诊断已经完成取证，仍是本线程最直接、可验证且阻塞后续修复边界的 ready Gap。",
        "snapshot_token": "d84baa2bc2432a95c417b84f6b2f0845e9391b7064c0de5d2e04928201c7f5c2",
        "selected_ref": "case-gap:CASE-20260828-001:GAP-20260828-001-001",
        "comparison_summary": "选择 Feedback 未读消息加载诊断；延后四个 Project Gap和并发 Automation 修复 Gap。Automation Gap 虽然同样有直接用户影响，但属于 CASE-20260828-002 的独立事项，不应打断当前持久线程。",
        "fresh_discovery_summary": "Fresh replan 未发现新的当前线程候选；catalog 新增的 Automation Gap 是另一 active Case 的 persisted candidate。",
        "considered": [
          {
            "ref": "project-gap:GAP-agent-scenario-evaluation",
            "source": "persisted",
            "eligibility": "case_required",
            "disposition": "deferred",
            "priority_basis": {
              "blocking": "不阻塞当前 Feedback 诊断。",
              "uncertainty": "仍需隔离场景验证。",
              "risk": "高，但属于通用状态驱动模型验证。",
              "user_impact": "低于当前消息不可见问题。"
            },
            "reason": "需要独立 Case，当前 Feedback 缺陷与本线程用户意图更直接。"
          },
          {
            "ref": "project-gap:GAP-runtime-resilience-and-adapters",
            "source": "persisted",
            "eligibility": "case_required",
            "disposition": "deferred",
            "priority_basis": {
              "blocking": "不直接阻塞当前 Feedback Renderer 诊断。",
              "uncertainty": "仍有 Runtime 韧性与 adapter 验收工作。",
              "risk": "高。",
              "user_impact": "间接，低于当前消息不可见。"
            },
            "reason": "范围是 Runtime timeout、compaction 和 adapter 边界，不是当前会话缓存新鲜度。"
          },
          {
            "ref": "project-gap:GAP-security-real-project-validation",
            "source": "persisted",
            "eligibility": "case_required",
            "disposition": "deferred",
            "priority_basis": {
              "blocking": "不阻塞当前只读诊断。",
              "uncertainty": "需要真实权限项目证据。",
              "risk": "高。",
              "user_impact": "当前缺陷未暴露权限异常。"
            },
            "reason": "需要独立真实权限场景。"
          },
          {
            "ref": "project-gap:GAP-cross-record-audit",
            "source": "persisted",
            "eligibility": "case_required",
            "disposition": "deferred",
            "priority_basis": {
              "blocking": "不阻塞当前 Feedback 决策。",
              "uncertainty": "跨记录一致性仍需真实验收。",
              "risk": "高。",
              "user_impact": "低于当前回复不可见。"
            },
            "reason": "当前工作不涉及 Project、Iteration 与 Case 跨记录审计。"
          },
          {
            "ref": "case-gap:CASE-20260828-001:GAP-20260828-001-001",
            "source": "persisted",
            "eligibility": "ready",
            "disposition": "selected",
            "priority_basis": {
              "blocking": "直接阻塞 Feedback 修复范围与新回复读取。",
              "uncertainty": "需确认通知、消息缓存和刷新触发关系。",
              "risk": "只做手动刷新会掩盖同步缺陷，只做自动刷新又缺少恢复路径。",
              "user_impact": "用户看到未读提示却无法查看消息。"
            },
            "reason": "匹配当前持久线程，诊断证据已经形成，可完成单一验收主张。"
          },
          {
            "ref": "case-gap:CASE-20260828-002:GAP-20260828-002-001",
            "source": "persisted",
            "eligibility": "ready",
            "disposition": "deferred",
            "priority_basis": {
              "blocking": "阻塞另一事项中新项目建立 Automation 本地绑定。",
              "uncertainty": "根因已由现场数据和代码路径确认。",
              "risk": "顶层与 lane 快照边界可能影响多项目可见性。",
              "user_impact": "悦芽英语与 iForest 客户端无法进入 Automation 绑定流程。"
            },
            "reason": "这是并发 CASE-20260828-002 的独立用户事项；切换会无故悬置当前 Feedback 线程，交由其所属持久线程继续推进。"
          }
        ]
      },
      "selected_gap": {
        "id": "GAP-20260828-001-001",
        "responsibility": "agent",
        "goal": "检查 Feedback SDK V2 契约、ArcOrbit 未读计数与消息列表加载实现以及持久交互证据，确定未读回复应如何自动加载，以及是否必须同时提供可见的手动刷新恢复入口。",
        "reason": "“只加刷新”与“自动加载并提供刷新兜底”会形成不同的产品语义、技术范围和验收方式；必须先建立这一前置诊断与决策，才能界定后续实现。",
        "derived_from": [
          "FACT-20260828-001-001",
          "FACT-20260828-001-002"
        ],
        "blocked_by": [],
        "priority_basis": {
          "blocking": "阻塞 Feedback 新回复的可靠读取与后续修复范围界定。",
          "uncertainty": "未确认未读计数和消息列表的数据源、事件机制、缓存及加载触发。",
          "risk": "只增加人工刷新可能掩盖同步缺陷；只做自动刷新又可能缺少失败恢复入口。",
          "user_impact": "用户已被告知存在新回复，却无法查看内容。"
        },
        "evidence_required": [
          "Feedback SDK V2 消息与未读相关接口或事件契约",
          "ArcOrbit Feedback 消息列表、未读计数及页面生命周期加载路径",
          "现有产品规格、交互和技术方案中的消息更新与恢复语义",
          "支持最终策略的可重复行为证据"
        ]
      },
      "planned_transition": {
        "goal": "接受 Feedback V2 未读通知、消息缓存和刷新触发的根因事实，并确定自动加载与手动恢复边界。",
        "expected_state_change": "解决当前诊断 Gap，接受“自动加载 + 手动刷新兜底”的策略，更新相关 Project 决策并新增 fresh-read 后可选择的实现 Gap。"
      },
      "accepted_state_delta": {
        "resolved_gap": {
          "id": "GAP-20260828-001-001",
          "status": "resolved",
          "outcome": "resolved",
          "reason": "代码路径完整解释现象：Platform snapshot 独立拉取通知并更新未读数；Renderer 按 feedback id 缓存会话且仅在无缓存时加载；现有刷新只调用 refreshSnapshot。参考 Console 将实时、定时和手动刷新联动到当前会话，用户 SDK 也提供消息刷新。",
          "evidence": [
            "runtime/arcorbit/desktop/renderer/renderer.js:314",
            "runtime/arcorbit/desktop/renderer/renderer.js:2324",
            "runtime/arcorbit/desktop/renderer/renderer.js:2373",
            "runtime/arcorbit/desktop/renderer/renderer.js:2380",
            "runtime/arcorbit/desktop/renderer/renderer.js:2514",
            "runtime/arcorbit/src/platform-coordinator.mjs:23",
            "runtime/arcorbit/src/workshop-platform-adapter.mjs:124",
            "/Users/Glare/Library/Developer/ModularProgram/hoewo/Workshop-Feedbacks/webapps/feedback-console-web/src/components/features/FeedbackManagementDialog.tsx:490",
            "/Users/Glare/Library/Developer/ModularProgram/hoewo/Workshop-Feedbacks/webapps/feedback-sdk-web/src/components/sdk/FeedbackConversationPanel.tsx:40",
            "Verification: 78 targeted tests passed"
          ]
        },
        "facts_added": [
          {
            "id": "FACT-20260828-001-003",
            "revision": 1,
            "status": "accepted",
            "statement": "用户报告对应 ArcOrbit 主窗口 Feedback 页的 Workset 开发者管理 V2 会话，而不是固定 Project 107 的独立产品反馈 SDK WebView；两者必须保持独立集成语义。",
            "basis": "主窗口 Feedback Renderer 的沟通记录和 feedback_management 未读投影与报告完全匹配。",
            "evidence": [
              "runtime/arcorbit/desktop/renderer/index.html:194",
              "runtime/arcorbit/desktop/renderer/renderer.js:2310",
              "arckit/tech/arcorbit/product-feedback-integration.md"
            ]
          },
          {
            "id": "FACT-20260828-001-004",
            "revision": 1,
            "status": "accepted",
            "statement": "ArcOrbit 每 30 秒和用户刷新时会重新取得 Feedback V2 通知并更新 unread_count/unread_feedback_ids，但 feedbackConversations 按 feedback id 独立缓存；只在缓存不存在时自动加载消息，页面级和详情级刷新均不调用消息接口，因此已打开会话可持续显示旧消息。",
            "basis": "Renderer、Platform Coordinator 和 Workshop Platform Adapter 数据流与未读数更新、消息不更新和刷新无效三个表现完全匹配。",
            "evidence": [
              "runtime/arcorbit/desktop/renderer/renderer.js:314",
              "runtime/arcorbit/desktop/renderer/renderer.js:2324",
              "runtime/arcorbit/desktop/renderer/renderer.js:2373",
              "runtime/arcorbit/desktop/renderer/renderer.js:2380",
              "runtime/arcorbit/desktop/renderer/renderer.js:2514",
              "runtime/arcorbit/src/platform-coordinator.mjs:23",
              "runtime/arcorbit/src/workshop-platform-adapter.mjs:124"
            ]
          },
          {
            "id": "FACT-20260828-001-005",
            "revision": 1,
            "status": "accepted",
            "statement": "Workset Feedback V2 沟通记录必须同时具备自动加载和手动刷新兜底：首次打开或 fresh notification snapshot 标记当前反馈有未读回复时自动重拉消息；页面级、详情级或沟通记录刷新时同时刷新 feedback/notification snapshot 与当前会话。只有消息成功加载后才标记已读，失败时保留旧消息和重试。",
            "basis": "自动加载是未读提示后的正常主路径；手动刷新为事件延迟、网络恢复和缓存异常提供恢复。参考 Console 和用户 SDK 采用相同边界。",
            "evidence": [
              "/Users/Glare/Library/Developer/ModularProgram/hoewo/Workshop-Feedbacks/webapps/feedback-console-web/src/components/features/FeedbackManagementDialog.tsx:482",
              "/Users/Glare/Library/Developer/ModularProgram/hoewo/Workshop-Feedbacks/webapps/feedback-console-web/src/components/features/FeedbackManagementDialog.tsx:490",
              "/Users/Glare/Library/Developer/ModularProgram/hoewo/Workshop-Feedbacks/webapps/feedback-console-web/src/components/features/FeedbackManagementDialog.tsx:680",
              "/Users/Glare/Library/Developer/ModularProgram/hoewo/Workshop-Feedbacks/webapps/feedback-sdk-web/src/components/sdk/FeedbackConversationPanel.tsx:40"
            ]
          },
          {
            "id": "FACT-20260828-001-006",
            "revision": 1,
            "status": "accepted",
            "statement": "自动或手动重载当前会话时必须保留回复草稿、已选附件和 Inspector 滚动上下文，去重同一会话并发加载，并阻止过期响应覆盖更新结果。",
            "basis": "当前 Renderer 已保存 draft、file 和 scrollTop；新增加载触发会扩大并发与状态覆盖风险。",
            "evidence": [
              "runtime/arcorbit/desktop/renderer/renderer.js:2340",
              "runtime/arcorbit/desktop/renderer/renderer.js:2449",
              "runtime/arcorbit/desktop/renderer/renderer.js:2514",
              "/Users/Glare/Library/Developer/ModularProgram/hoewo/Workshop-Feedbacks/webapps/feedback-sdk-web/src/components/sdk/FeedbackConversationPanel.tsx:33"
            ]
          }
        ],
        "facts_superseded": [],
        "impacts_added": [
          {
            "id": "IMPACT-20260828-001-005",
            "fact_id": "FACT-20260828-001-004",
            "fact_revision": 1,
            "target": {
              "kind": "software_decision",
              "ref": "external_integrations",
              "revision": 13
            },
            "effect": "threatened",
            "reason": "通知和消息是独立 provider 请求，但当前 Renderer 只消费通知新鲜度，没有重读选中会话。",
            "gap_ids": [
              "GAP-20260828-001-002"
            ],
            "evidence": [
              "runtime/arcorbit/src/platform-coordinator.mjs:23",
              "runtime/arcorbit/src/workshop-platform-adapter.mjs:124",
              "runtime/arcorbit/desktop/renderer/renderer.js:2380"
            ]
          },
          {
            "id": "IMPACT-20260828-001-006",
            "fact_id": "FACT-20260828-001-005",
            "fact_revision": 1,
            "target": {
              "kind": "software_decision",
              "ref": "technical_foundation",
              "revision": 44
            },
            "effect": "threatened",
            "reason": "技术边界已经明确，但 Renderer 尚未实现 unread freshness、消息缓存失效和组合刷新。",
            "gap_ids": [
              "GAP-20260828-001-002"
            ],
            "evidence": [
              "runtime/arcorbit/desktop/renderer/renderer.js:2324",
              "runtime/arcorbit/desktop/renderer/renderer.js:2373",
              "runtime/arcorbit/desktop/renderer/renderer.js:2514"
            ]
          },
          {
            "id": "IMPACT-20260828-001-007",
            "fact_id": "FACT-20260828-001-006",
            "fact_revision": 1,
            "target": {
              "kind": "software_decision",
              "ref": "quality_and_validation",
              "revision": 22
            },
            "effect": "threatened",
            "reason": "现有测试未覆盖未读自动重载、组合手动刷新、并发隔离及草稿、附件和滚动保持。",
            "gap_ids": [
              "GAP-20260828-001-002"
            ],
            "evidence": [
              "runtime/arcorbit/test/desktop-renderer.test.mjs:1110",
              "Verification: 78 targeted baseline tests passed"
            ]
          }
        ],
        "impacts_updated": [
          {
            "id": "IMPACT-20260828-001-001",
            "fact_id": "FACT-20260828-001-001",
            "fact_revision": 1,
            "target": {
              "kind": "software_decision",
              "ref": "feedback_and_support",
              "revision": 6
            },
            "effect": "upheld",
            "reason": "报告属于 Workset Feedback 开发者管理；固定 Project 107 产品反馈中心的独立 SDK WebView 边界未被否定。",
            "gap_ids": [],
            "evidence": [
              "local:fact:reported-surface-is-workset-feedback",
              "arckit/tech/arcorbit/product-feedback-integration.md"
            ]
          },
          {
            "id": "IMPACT-20260828-001-002",
            "fact_id": "FACT-20260828-001-001",
            "fact_revision": 1,
            "target": {
              "kind": "software_decision",
              "ref": "experience_and_interaction",
              "revision": 62
            },
            "effect": "threatened",
            "reason": "正确交互已确定，但当前 Feedback 页面尚未实现自动加载与手动刷新兜底。",
            "gap_ids": [
              "GAP-20260828-001-002"
            ],
            "evidence": [
              "local:fact:auto-and-manual-refresh-decision",
              "runtime/arcorbit/desktop/renderer/renderer.js:2373",
              "runtime/arcorbit/desktop/renderer/renderer.js:2380"
            ]
          },
          {
            "id": "IMPACT-20260828-001-003",
            "fact_id": "FACT-20260828-001-001",
            "fact_revision": 1,
            "target": {
              "kind": "software_invariant",
              "ref": "interaction-expectations-remain-recoverable",
              "revision": null
            },
            "effect": "upheld",
            "reason": "本轮把自动加载、手动恢复、已读时机和状态保持写入 Project 交互决策；实际实现由独立 Gap 跟踪。",
            "gap_ids": [],
            "evidence": [
              "project:decision:experience_and_interaction",
              "local:fact:auto-and-manual-refresh-decision",
              "local:fact:refresh-safety-boundary"
            ]
          },
          {
            "id": "IMPACT-20260828-001-004",
            "fact_id": "FACT-20260828-001-001",
            "fact_revision": 1,
            "target": {
              "kind": "software_invariant",
              "ref": "accepted-facts-are-realized",
              "revision": null
            },
            "effect": "threatened",
            "reason": "实际软件仍未实现自动加载和组合手动刷新。",
            "gap_ids": [
              "GAP-20260828-001-002"
            ],
            "evidence": [
              "local:fact:conversation-cache-root-cause",
              "local:fact:auto-and-manual-refresh-decision",
              "runtime/arcorbit/desktop/renderer/renderer.js:2373",
              "runtime/arcorbit/desktop/renderer/renderer.js:2380"
            ]
          }
        ],
        "gaps_added": [
          {
            "id": "GAP-20260828-001-002",
            "status": "open",
            "goal": "实现并持久化 Workset Feedback V2 会话新鲜度规则：未读触发选中会话自动重载，页面级、详情级和沟通记录手动刷新同时重载 snapshot 与当前会话，并以回归测试证明状态、并发和已读边界。",
            "reason": "诊断已确定正确策略，但当前代码和持久产品工件尚未兑现。",
            "derived_from": [
              "FACT-20260828-001-004",
              "FACT-20260828-001-005",
              "FACT-20260828-001-006"
            ],
            "blocked_by": [],
            "priority_basis": {
              "blocking": "直接阻塞新回复读取和 Case 解决。",
              "uncertainty": "需实现最小的缓存失效与请求身份机制。",
              "risk": "可能产生重复请求、旧响应覆盖、草稿丢失或提前清除未读。",
              "user_impact": "当前缺陷仍存在。"
            },
            "responsibility": "agent",
            "evidence_required": [
              "选中未读反馈自动重载消息的行为测试",
              "页面级、详情级和沟通记录刷新均重载当前会话的行为测试",
              "加载成功后才标记已读、失败保留旧消息和恢复入口的测试",
              "并发或旧响应隔离及草稿、附件、滚动保持测试",
              "相关 spec、interaction、tech 与实现一致"
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
            "area_ref": "experience_and_interaction",
            "observed_revision": 61,
            "set_decision": {
              "status": "settled",
              "statement": "ArcOrbit 保持既有 Personal、Product Lifecycle、Organization 导航与 Work、Automation、Feedback、Chat 等交互语义。Work 新建和编辑 Sheet 保留完整七状态，编辑 Sheet 承担异常纠偏；右侧 Inspector 按当前状态显示有限下一步动作。Work Inspector 首次使用 440px，用户可通过 12px 可访问分隔条在 360–640px 保存范围内拖拽、键盘调整或双击复位，偏好跨任务、项目、Workset 和应用重启恢复。布局为任务树保留至少 420px，窗口临时收窄只改变有效宽度且不覆盖保存值。Inspector 以单一内部滚动区组织身份动作、内容、紧凑属性、协作和按状态出现的验收分区，宽度变化不丢失选择、滚动、草稿或附件状态。验收问题条目的问题原文与进展文本在 Inspector 当前可用宽度内完整折行且不横向越界，状态徽标保持清晰可见。Work 已完成列表按新完成在上、历史完成在下排列；标记首项为已验收后选择下一条较旧待办，标记其他位置后选择相邻较新待办，树补全项不参与目标计算，且选择只在服务器确认成功后切换。验收请求期间允许浏览其他任务；若用户在服务器确认前产生较新的选择，成功回调保留该选择而不执行旧任务的自动相邻切换。Work 新建待办 Sheet 在执行人控件下根据执行人与状态原位解释 Automation 资格。跨产品替换、主窗口和 Case 绑定恢复的既有交互保持不变。应用冷启动检查全部关联本地项目；新增或改变本地关联及用户主动重试再次检查。项目集全部、具体项目、Workset 或其它纯查看切换只改变业务投影，不进入 Setup；解除关联和 task start 不重新扫描 skills。task start 缓存断言失败时返回 Setup，等待用户主动重新检查。Setup 冲突页逐项显示稳定 code、skill、目标类型与路径及双方 digest；兜底覆盖默认全不选，支持逐项或全选可恢复项，独立确认 recovery root 与 fresh assessment digest，并反馈备份、替换、回滚和残留状态。Feedback 已忽略且未关联待办的详情显示“恢复为待处理”；动作无需二次确认，提交期间锁定自身，只有服务端确认 pending 后更新状态，失败时保持 ignored、筛选、选择和滚动位置。受支持旧版本覆盖安装后，Automation 先恢复 Catalog 项目行并保留 Workset、绑定和项目授权，再逐项目显示正在恢复、同步异常或可执行；用户无需退出登录、清缓存或重新添加项目。Automation 顶层责任只区分可自行继续与需要人工介入；external、recovery、configuration 与 CLI 保留为原因或处理场所，任何必须由操作者动作触发的下一步都显示 Human。external dependency 创建 attention，并通过“已处理，重新检查”恢复同一 task session/thread。Workset Feedback V2 沟通记录在首次选择和 fresh notification snapshot 标记当前反馈有未读回复时自动重新拉取消息；页面级、详情级和沟通记录的手动刷新均同时刷新反馈事实、通知与当前会话。消息成功加载后才标记已读；失败时保留旧消息和重试入口；刷新不得丢失回复草稿、附件选择或 Inspector 滚动上下文。",
              "reason": "通知与消息会话具有独立新鲜度；自动加载是主路径，手动刷新是必要恢复路径。",
              "evidence": [
                "Current operator input, 2026-08-29",
                "runtime/arcorbit/desktop/renderer/renderer.js",
                "runtime/arcorbit/src/platform-coordinator.mjs",
                "/Users/Glare/Library/Developer/ModularProgram/hoewo/Workshop-Feedbacks/webapps/feedback-console-web/src/components/features/FeedbackManagementDialog.tsx",
                "/Users/Glare/Library/Developer/ModularProgram/hoewo/Workshop-Feedbacks/webapps/feedback-sdk-web/src/components/sdk/FeedbackConversationPanel.tsx"
              ],
              "confidence": "high",
              "resume_condition": "当 Feedback V2 通知事件、消息增量契约、缓存所有权或刷新边界改变时重审。"
            },
            "gap_refs": [],
            "reason": "接受 Feedback 自动加载与手动恢复的交互边界。",
            "evidence": [
              "local:fact:auto-and-manual-refresh-decision",
              "local:fact:refresh-safety-boundary"
            ]
          },
          {
            "area_ref": "technical_foundation",
            "observed_revision": 43,
            "set_decision": {
              "status": "settled",
              "statement": "Arckit 与 ArcOrbit 的既有 ledger、Electron、Runtime、Platform Coordinator、Work Sync、Chat、Setup Readiness 和 trusted case-control 技术边界保持不变。Work Inspector 偏好继续由 Desktop Store、typed preload action 和 Renderer 持有。应用冷启动的 coordinated Setup Readiness 由 main process fresh-read Desktop Store 中全部本地 Product Workspace roots；新增或改变本地关联及用户主动 retry 使用相同 aggregate check，显式空 roots 清除既有 project plan 并执行 global-only。Renderer 项目/Workset 筛选不触发检查，解除关联跳过检查。SkillProvisioningManager.assertReady(projectRoot) 只读取内存 snapshot，要求 ready 且 project root 位于最近成功检查的 plan.project_roots；Chat/Automation task start 不调用 provider 或扫描 skills。SkillProvisioningManager 的 plan、drift、同名冲突诊断和 backup-and-overwrite-selected 事务边界保持不变。Feedback V1 恢复通过受控 update 同时写入 ignored=false、feedback_state=pending 和 status=analyzing；V2 恢复由 Platform Adapter、Coordinator、main IPC、preload 和 Renderer 的 restoreFeedbackV2 typed action 链调用固定 provider route，并只在服务端确认后刷新投影。新版启动必须执行有代际的 rehydration：规范化旧 Store、刷新可访问 Catalog、按需求集合协调对账并在 dispatch 前只开放健康项目。任务与标签独立确认；重建期间新增需求必须触发后续一轮，不能被进行中的 reconcile 吞掉。Case/Loop 继续保留 external_wait 作为内部停止原因；Automation Coordinator 将其确定性投影为 awaiting_human + external_dependency，Store 迁移旧 external_wait 并补建 attention，typed confirm-external-dependency IPC 校验 execution 后复用原 session/thread。Workset Feedback V2 notification snapshot 与 `/feedbacks/{id}/messages` 是两个独立新鲜度域；Renderer 以当前 feedback id、未读投影和有身份的会话加载状态协调刷新，不把 refreshSnapshot 视为消息已刷新。消息请求必须去重或隔离过期响应，并在成功投影消息后才调用 typed mark-read；失败不清除缓存消息或草稿。",
              "reason": "根因是 notification snapshot 与会话缓存缺少显式失效和组合刷新关系。",
              "evidence": [
                "runtime/arcorbit/desktop/renderer/renderer.js:2324",
                "runtime/arcorbit/desktop/renderer/renderer.js:2380",
                "runtime/arcorbit/desktop/renderer/renderer.js:2514",
                "runtime/arcorbit/src/platform-coordinator.mjs:23",
                "runtime/arcorbit/src/workshop-platform-adapter.mjs:124"
              ],
              "confidence": "high",
              "resume_condition": "当消息支持增量游标、push payload、跨反馈并发或缓存迁出 Renderer 时重审。"
            },
            "gap_refs": [
              "GAP-runtime-resilience-and-adapters"
            ],
            "reason": "明确通知与消息新鲜度及协调责任。",
            "evidence": [
              "local:fact:conversation-cache-root-cause",
              "local:fact:refresh-safety-boundary"
            ]
          },
          {
            "area_ref": "quality_and_validation",
            "observed_revision": 21,
            "set_decision": {
              "status": "settled",
              "statement": "既有协议、Runtime、realtime、Work、Chat、Automation、安全、Setup、同名冲突恢复和跨平台窗口验证义务保持不变。Setup Readiness 还必须证明：冷启动检查全部关联本地 roots；新增或改绑后再次检查全部 roots；项目集、具体项目和 Workset 纯查看切换不调用 Setup；解除关联不产生检查；用户主动 retry 保持 fresh-check；task-start skill preflight 不读取文件或调用 provider，只接受 ready 且覆盖当前规范化 root 的缓存状态；未验证 root fail closed。Feedback 忽略恢复还必须覆盖 V1 metadata 一致写入、V2 专用 route 与 typed IPC、ignored → pending 服务端确认、权限/对象/冲突/网络失败，以及失败时状态、筛选、选择和滚动位置不被乐观改写。完整 ArcOrbit 套件与需要 GUI 权限的 Electron 回归必须分别记录可重复结果。覆盖安装自愈必须以历史 Store fixtures、Catalog 成功而项目详情失败、标签独立失败和 reconcile 期间 Workset 变化的行为级回归证明，并验证用户控制事实保留、项目持续可见和仅受影响 lane 失败关闭。Feedback V2 消息新鲜度还必须证明：选中反馈出现未读时自动重拉；页面级、详情级和沟通记录手动刷新均重拉当前会话；加载失败不清除旧消息或未读，成功投影后才标记已读；并发或过期响应不覆盖较新结果；刷新不丢失草稿、附件和滚动位置。",
              "reason": "现有 78 个相关基线测试没有覆盖导致本次缺陷的通知与会话新鲜度分离。",
              "evidence": [
                "Verification: 78 targeted tests passed, 2026-08-29",
                "runtime/arcorbit/test/desktop-renderer.test.mjs",
                "local:fact:conversation-cache-root-cause",
                "local:fact:refresh-safety-boundary"
              ],
              "confidence": "high",
              "resume_condition": "当 Feedback 消息加载模型、通知语义或 Renderer 状态所有权改变时重审。"
            },
            "gap_refs": [
              "GAP-agent-scenario-evaluation",
              "GAP-cross-record-audit"
            ],
            "reason": "加入本次根因暴露的行为级回归责任。",
            "evidence": [
              "local:fact:conversation-cache-root-cause",
              "local:fact:refresh-safety-boundary"
            ]
          }
        ],
        "software_invariant_changes": [],
        "project_gap_changes": [],
        "selection_context_change": null,
        "evidence": [
          "Current operator input, 2026-08-29",
          "runtime/arcorbit/desktop/renderer/renderer.js",
          "runtime/arcorbit/src/platform-coordinator.mjs",
          "runtime/arcorbit/src/workshop-platform-adapter.mjs",
          "/Users/Glare/Library/Developer/ModularProgram/hoewo/Workshop-Feedbacks/webapps/feedback-console-web/src/components/features/FeedbackManagementDialog.tsx",
          "Verification: 78 targeted tests passed"
        ]
      },
      "invariant_assessment": {
        "project_revision": 313,
        "judgments": [
          {
            "invariant_ref": "product-expectations-remain-recoverable",
            "disposition": "upheld",
            "reason": "自动加载与手动恢复已经以 Case facts 和 Project 交互决策保存。",
            "fact_refs": [
              "FACT-20260828-001-005"
            ],
            "evidence": [
              "project:decision:experience_and_interaction",
              "local:fact:auto-and-manual-refresh-decision"
            ],
            "gap_refs": []
          },
          {
            "invariant_ref": "interaction-expectations-remain-recoverable",
            "disposition": "upheld",
            "reason": "首次加载、未读触发、三个刷新入口、已读时机、失败恢复和状态保持均已明确。",
            "fact_refs": [
              "FACT-20260828-001-005",
              "FACT-20260828-001-006"
            ],
            "evidence": [
              "project:decision:experience_and_interaction",
              "/Users/Glare/Library/Developer/ModularProgram/hoewo/Workshop-Feedbacks/webapps/feedback-sdk-web/src/components/sdk/FeedbackConversationPanel.tsx"
            ],
            "gap_refs": []
          },
          {
            "invariant_ref": "visual-language-remains-consistent",
            "disposition": "not_relevant",
            "reason": "本轮没有建立或改变视觉语言规则。",
            "fact_refs": [],
            "evidence": [],
            "gap_refs": []
          },
          {
            "invariant_ref": "technical-decisions-remain-explainable",
            "disposition": "upheld",
            "reason": "通知、消息、缓存失效、组合刷新、请求身份和已读顺序已写入 Project 技术决策。",
            "fact_refs": [
              "FACT-20260828-001-004",
              "FACT-20260828-001-005",
              "FACT-20260828-001-006"
            ],
            "evidence": [
              "project:decision:technical_foundation",
              "runtime/arcorbit/desktop/renderer/renderer.js",
              "runtime/arcorbit/src/platform-coordinator.mjs"
            ],
            "gap_refs": []
          },
          {
            "invariant_ref": "accepted-facts-are-realized",
            "disposition": "threatened",
            "reason": "当前 Renderer 仍只在无缓存时加载消息，现有刷新也不刷新会话。",
            "fact_refs": [
              "FACT-20260828-001-004",
              "FACT-20260828-001-005"
            ],
            "evidence": [
              "runtime/arcorbit/desktop/renderer/renderer.js:2373",
              "runtime/arcorbit/desktop/renderer/renderer.js:2380"
            ],
            "gap_refs": [
              "GAP-20260828-001-002"
            ]
          },
          {
            "invariant_ref": "material-risks-have-credible-evidence",
            "disposition": "threatened",
            "reason": "根因和策略有直接证据，但并发、过期响应、状态保持和已读顺序尚无实现级回归证据。",
            "fact_refs": [
              "FACT-20260828-001-004",
              "FACT-20260828-001-006"
            ],
            "evidence": [
              "Verification: 78 targeted baseline tests passed but freshness scenarios are absent",
              "runtime/arcorbit/test/desktop-renderer.test.mjs"
            ],
            "gap_refs": [
              "GAP-20260828-001-002"
            ]
          }
        ]
      },
      "evidence": [
        "Current operator input, 2026-08-29",
        "runtime/arcorbit/desktop/renderer/renderer.js:314",
        "runtime/arcorbit/desktop/renderer/renderer.js:2324",
        "runtime/arcorbit/desktop/renderer/renderer.js:2373",
        "runtime/arcorbit/desktop/renderer/renderer.js:2380",
        "runtime/arcorbit/desktop/renderer/renderer.js:2514",
        "runtime/arcorbit/src/platform-coordinator.mjs:23",
        "runtime/arcorbit/src/workshop-platform-adapter.mjs:124",
        "Verification: 78 targeted tests passed"
      ],
      "runtime_result_ref": "arckit-runtime://runs/RUN-20260828-193127049Z-eda2106f",
      "occurred_at": "2026-08-28T19:45:40.110Z"
    },
    {
      "round": 2,
      "transition_schema_version": "arckit-case-transition/v8",
      "goal": "接受已完成的 Feedback V2 会话新鲜度、组合刷新、已读顺序和状态保护实现及验证证据。",
      "outcome": "completed",
      "gap_selection": {
        "mode": "candidate",
        "basis": "Fresh snapshot 中 GAP-20260828-001-002 是唯一 ready Case Gap，直接阻塞新回复读取和已接受产品语义的兑现；四个 Project Gap 均需独立 Case。此前并行的 Automation Case 已退出候选集，不再参与比较。",
        "snapshot_token": "6ddb65e827def96100569db6ce2ff6253b8360d7b79ff7e0c0e470b0225aea98",
        "selected_ref": "case-gap:CASE-20260828-001:GAP-20260828-001-002",
        "comparison_summary": "选择 Feedback 会话新鲜度实现；延后四个需要独立 Case 的 Project Gap。",
        "fresh_discovery_summary": "Fresh replan 没有发现额外候选；此前完成的实现与验证仍完整覆盖当前 Gap，无需重复执行。",
        "considered": [
          {
            "ref": "project-gap:GAP-agent-scenario-evaluation",
            "source": "persisted",
            "eligibility": "case_required",
            "disposition": "deferred",
            "priority_basis": {
              "blocking": "不阻塞当前 Feedback 新回复读取。",
              "uncertainty": "仍需隔离真实场景验证。",
              "risk": "高，但属于通用 Agent 选择模型。",
              "user_impact": "低于当前消息不可见缺陷。"
            },
            "reason": "需要独立 Case，不直接兑现当前 Feedback Case。"
          },
          {
            "ref": "project-gap:GAP-runtime-resilience-and-adapters",
            "source": "persisted",
            "eligibility": "case_required",
            "disposition": "deferred",
            "priority_basis": {
              "blocking": "不直接阻塞当前 Renderer 会话刷新。",
              "uncertainty": "仍有 Runtime 韧性与 adapter 验收工作。",
              "risk": "高。",
              "user_impact": "间接，低于当前 Feedback 缺陷。"
            },
            "reason": "范围是 Runtime timeout、compaction 与通用 adapter 边界，需要独立 Case。"
          },
          {
            "ref": "project-gap:GAP-security-real-project-validation",
            "source": "persisted",
            "eligibility": "case_required",
            "disposition": "deferred",
            "priority_basis": {
              "blocking": "不阻塞当前受控 typed Feedback 请求实现。",
              "uncertainty": "需要真实权限项目证据。",
              "risk": "高。",
              "user_impact": "当前缺陷未暴露凭据或权限异常。"
            },
            "reason": "需要独立真实权限场景。"
          },
          {
            "ref": "project-gap:GAP-cross-record-audit",
            "source": "persisted",
            "eligibility": "case_required",
            "disposition": "deferred",
            "priority_basis": {
              "blocking": "不阻塞当前 Feedback Case。",
              "uncertainty": "跨记录一致性仍需真实验收。",
              "risk": "高。",
              "user_impact": "低于当前回复不可见问题。"
            },
            "reason": "当前工作不涉及 Project、Iteration 与 Case 跨记录审计。"
          },
          {
            "ref": "case-gap:CASE-20260828-001:GAP-20260828-001-002",
            "source": "persisted",
            "eligibility": "ready",
            "disposition": "selected",
            "priority_basis": {
              "blocking": "直接阻塞新回复读取和当前 Case 解决。",
              "uncertainty": "需要以最小请求身份和缓存失效机制兑现既定策略。",
              "risk": "重复请求、旧响应覆盖、提前清除未读或本地状态丢失。",
              "user_impact": "用户已看到未读提示却无法取得新消息。"
            },
            "reason": "当前唯一 ready Case Gap，且实现、持久工件与行为验证已经完成。"
          }
        ]
      },
      "selected_gap": {
        "id": "GAP-20260828-001-002",
        "responsibility": "agent",
        "goal": "实现并持久化 Workset Feedback V2 会话新鲜度规则：未读触发选中会话自动重载，页面级、详情级和沟通记录手动刷新同时重载 snapshot 与当前会话，并以回归测试证明状态、并发和已读边界。",
        "reason": "诊断已确定正确策略，但当前代码和持久产品工件尚未兑现。",
        "derived_from": [
          "FACT-20260828-001-004",
          "FACT-20260828-001-005",
          "FACT-20260828-001-006"
        ],
        "blocked_by": [],
        "priority_basis": {
          "blocking": "直接阻塞新回复读取和 Case 解决。",
          "uncertainty": "需实现最小的缓存失效与请求身份机制。",
          "risk": "可能产生重复请求、旧响应覆盖、草稿丢失或提前清除未读。",
          "user_impact": "当前缺陷仍存在。"
        },
        "evidence_required": [
          "选中未读反馈自动重载消息的行为测试",
          "页面级、详情级和沟通记录刷新均重载当前会话的行为测试",
          "加载成功后才标记已读、失败保留旧消息和恢复入口的测试",
          "并发或旧响应隔离及草稿、附件、滚动保持测试",
          "相关 spec、interaction、tech 与实现一致"
        ]
      },
      "planned_transition": {
        "goal": "接受已完成的 Feedback V2 会话新鲜度、组合刷新、已读顺序和状态保护实现及验证证据。",
        "expected_state_change": "解决 GAP-20260828-001-002，将实现事实写入 Case，并把五个相关 threatened impacts 更新为 upheld。"
      },
      "accepted_state_delta": {
        "resolved_gap": {
          "id": "GAP-20260828-001-002",
          "status": "resolved",
          "outcome": "resolved",
          "reason": "Renderer 现以 notification snapshot epoch、project/feedback 身份和单调请求序号协调会话：fresh 未读自动重拉，页面级、详情级和沟通记录刷新均组合刷新 snapshot 与当前会话，消息成功后才标记已读；失败保留缓存消息和本地编辑状态，重复及过期响应不能覆盖当前结果。稳定 spec、interaction、tech、线框及索引已经同步，相关与完整回归均通过。",
          "evidence": [
            "runtime/arcorbit/desktop/renderer/renderer.js:160",
            "runtime/arcorbit/desktop/renderer/renderer.js:661",
            "runtime/arcorbit/desktop/renderer/renderer.js:2376",
            "runtime/arcorbit/desktop/renderer/renderer.js:2383",
            "runtime/arcorbit/desktop/renderer/renderer.js:2447",
            "runtime/arcorbit/desktop/renderer/renderer.js:2454",
            "runtime/arcorbit/desktop/renderer/renderer.js:2479",
            "runtime/arcorbit/desktop/renderer/renderer.js:2553",
            "runtime/arcorbit/test/desktop-renderer.test.mjs:1187",
            "runtime/arcorbit/test/desktop-renderer.test.mjs:1249",
            "runtime/arcorbit/test/desktop-renderer.test.mjs:1343",
            "arckit/spec/agentic-software-development/arcorbit-platform-capabilities.md:473",
            "arckit/interaction/platform-workspace/interaction.md:29",
            "arckit/interaction/platform-workspace/default.html:83",
            "arckit/tech/arcorbit/platform-composition-solution.md:182",
            "arckit/tech/arcorbit/platform-composition-solution.md:317",
            "Verification: 81/81 Feedback Renderer/Coordinator/Adapter tests passed",
            "Verification: npm run check passed with 524 passed, 21 conditional skips, 0 failed"
          ]
        },
        "facts_added": [
          {
            "id": "FACT-20260828-001-007",
            "revision": 1,
            "status": "accepted",
            "statement": "ArcOrbit Workset Feedback V2 已实现会话新鲜度闭环：首次选择或 fresh 未读触发当前会话重载；页面级、详情级和沟通记录刷新均组合读取 snapshot 与当前会话；消息成功后才标记已读；同一会话请求去重，身份或序号过期的响应被丢弃；失败保留旧消息、未读、草稿、附件和详情滚动位置。",
            "basis": "Renderer 实现、稳定产品工件、聚焦行为测试和完整 ArcOrbit 回归相互一致。",
            "evidence": [
              "runtime/arcorbit/desktop/renderer/renderer.js",
              "runtime/arcorbit/test/desktop-renderer.test.mjs",
              "arckit/spec/agentic-software-development/arcorbit-platform-capabilities.md",
              "arckit/interaction/platform-workspace/interaction.md",
              "arckit/interaction/platform-workspace/default.html",
              "arckit/tech/arcorbit/platform-composition-solution.md",
              "Verification: 81/81 related tests passed",
              "Verification: npm run check passed with 0 failures"
            ]
          }
        ],
        "facts_superseded": [],
        "impacts_added": [],
        "impacts_updated": [
          {
            "id": "IMPACT-20260828-001-002",
            "fact_id": "FACT-20260828-001-001",
            "fact_revision": 1,
            "target": {
              "kind": "software_decision",
              "ref": "experience_and_interaction",
              "revision": 62
            },
            "effect": "upheld",
            "reason": "自动加载、三个手动刷新入口、成功后已读、失败恢复和本地状态保持均已在交互工件与 Renderer 中兑现。",
            "gap_ids": [],
            "evidence": [
              "arckit/interaction/platform-workspace/interaction.md:29",
              "arckit/interaction/platform-workspace/default.html:83",
              "runtime/arcorbit/desktop/renderer/renderer.js:2376",
              "runtime/arcorbit/desktop/renderer/renderer.js:2479",
              "runtime/arcorbit/test/desktop-renderer.test.mjs:1187"
            ]
          },
          {
            "id": "IMPACT-20260828-001-004",
            "fact_id": "FACT-20260828-001-001",
            "fact_revision": 1,
            "target": {
              "kind": "software_invariant",
              "ref": "accepted-facts-are-realized",
              "revision": null
            },
            "effect": "upheld",
            "reason": "实际软件会在 fresh 未读或用户刷新时重新取得当前消息，不再只更新未读数并保留旧会话。",
            "gap_ids": [],
            "evidence": [
              "runtime/arcorbit/desktop/renderer/renderer.js:2383",
              "runtime/arcorbit/desktop/renderer/renderer.js:2454",
              "runtime/arcorbit/test/desktop-renderer.test.mjs:1187",
              "Verification: 81/81 related tests passed"
            ]
          },
          {
            "id": "IMPACT-20260828-001-005",
            "fact_id": "FACT-20260828-001-004",
            "fact_revision": 1,
            "target": {
              "kind": "software_decision",
              "ref": "external_integrations",
              "revision": 13
            },
            "effect": "upheld",
            "reason": "Renderer 保持受控 Platform Adapter 边界，并显式协调独立的 notification snapshot 与消息请求。",
            "gap_ids": [],
            "evidence": [
              "runtime/arcorbit/desktop/renderer/renderer.js:2454",
              "runtime/arcorbit/desktop/renderer/renderer.js:2553",
              "arckit/tech/arcorbit/platform-composition-solution.md:182",
              "Verification: 81/81 Feedback Renderer/Coordinator/Adapter tests passed"
            ]
          },
          {
            "id": "IMPACT-20260828-001-006",
            "fact_id": "FACT-20260828-001-005",
            "fact_revision": 1,
            "target": {
              "kind": "software_decision",
              "ref": "technical_foundation",
              "revision": 44
            },
            "effect": "upheld",
            "reason": "Renderer 已实现 unread freshness、组合刷新、project/feedback 请求身份、单调序号和过期响应隔离，并保留失败前状态。",
            "gap_ids": [],
            "evidence": [
              "runtime/arcorbit/desktop/renderer/renderer.js:2440",
              "runtime/arcorbit/desktop/renderer/renderer.js:2447",
              "runtime/arcorbit/desktop/renderer/renderer.js:2553",
              "arckit/tech/arcorbit/platform-composition-solution.md:182",
              "arckit/tech/arcorbit/platform-composition-solution.md:317"
            ]
          },
          {
            "id": "IMPACT-20260828-001-007",
            "fact_id": "FACT-20260828-001-006",
            "fact_revision": 1,
            "target": {
              "kind": "software_decision",
              "ref": "quality_and_validation",
              "revision": 22
            },
            "effect": "upheld",
            "reason": "行为测试覆盖自动与三个手动触发、成功后已读、同会话去重、跨项目同 ID 旧响应隔离、失败状态保持和详情滚动保持；相关套件及完整 check 均通过。",
            "gap_ids": [],
            "evidence": [
              "runtime/arcorbit/test/desktop-renderer.test.mjs:1187",
              "runtime/arcorbit/test/desktop-renderer.test.mjs:1249",
              "runtime/arcorbit/test/desktop-renderer.test.mjs:1343",
              "Verification: 81/81 related tests passed",
              "Verification: npm run check passed with 524 passed, 21 conditional skips, 0 failed"
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
        "project_revision": 315,
        "judgments": [
          {
            "invariant_ref": "product-expectations-remain-recoverable",
            "disposition": "upheld",
            "reason": "会话新鲜度、刷新入口、已读时机和失败保持已写入稳定产品规格，并由实现与测试兑现。",
            "fact_refs": [
              "FACT-20260828-001-005",
              "FACT-20260828-001-007"
            ],
            "evidence": [
              "arckit/spec/agentic-software-development/arcorbit-platform-capabilities.md:473",
              "runtime/arcorbit/desktop/renderer/renderer.js",
              "Verification: npm run check passed with 0 failures"
            ],
            "gap_refs": []
          },
          {
            "invariant_ref": "interaction-expectations-remain-recoverable",
            "disposition": "upheld",
            "reason": "自动触发、页面/详情/沟通刷新、成功后已读、失败重试与草稿、附件、滚动保持均有持久交互证据和实现。",
            "fact_refs": [
              "FACT-20260828-001-005",
              "FACT-20260828-001-006",
              "FACT-20260828-001-007"
            ],
            "evidence": [
              "arckit/interaction/platform-workspace/interaction.md:29",
              "arckit/interaction/platform-workspace/interaction.md:134",
              "arckit/interaction/platform-workspace/default.html:83",
              "runtime/arcorbit/test/desktop-renderer.test.mjs:1187"
            ],
            "gap_refs": []
          },
          {
            "invariant_ref": "visual-language-remains-consistent",
            "disposition": "not_relevant",
            "reason": "新增刷新入口复用既有 secondary-button、section-title-row 与工作台视觉语言，没有建立或改变视觉规则。",
            "fact_refs": [],
            "evidence": [],
            "gap_refs": []
          },
          {
            "invariant_ref": "technical-decisions-remain-explainable",
            "disposition": "upheld",
            "reason": "通知与消息的新鲜度域、组合刷新、请求身份、过期隔离、失败状态和已读顺序均在技术方案与代码中保持一致。",
            "fact_refs": [
              "FACT-20260828-001-004",
              "FACT-20260828-001-005",
              "FACT-20260828-001-006",
              "FACT-20260828-001-007"
            ],
            "evidence": [
              "arckit/tech/arcorbit/platform-composition-solution.md:182",
              "arckit/tech/arcorbit/platform-composition-solution.md:317",
              "runtime/arcorbit/desktop/renderer/renderer.js:2440",
              "runtime/arcorbit/desktop/renderer/renderer.js:2553"
            ],
            "gap_refs": []
          },
          {
            "invariant_ref": "accepted-facts-are-realized",
            "disposition": "upheld",
            "reason": "Renderer 已不再把 notification snapshot 刷新等同于消息刷新，并在未读与手动恢复路径重拉当前会话。",
            "fact_refs": [
              "FACT-20260828-001-004",
              "FACT-20260828-001-005",
              "FACT-20260828-001-007"
            ],
            "evidence": [
              "runtime/arcorbit/desktop/renderer/renderer.js:2383",
              "runtime/arcorbit/desktop/renderer/renderer.js:2454",
              "runtime/arcorbit/test/desktop-renderer.test.mjs:1187",
              "Verification: 81/81 related tests passed"
            ],
            "gap_refs": []
          },
          {
            "invariant_ref": "material-risks-have-credible-evidence",
            "disposition": "upheld",
            "reason": "重复请求、过期响应、跨项目同 ID、提前已读以及消息、未读、草稿、附件和滚动丢失风险均有直接行为或实现级回归证据，完整套件无失败。",
            "fact_refs": [
              "FACT-20260828-001-006",
              "FACT-20260828-001-007"
            ],
            "evidence": [
              "runtime/arcorbit/test/desktop-renderer.test.mjs:1187",
              "runtime/arcorbit/test/desktop-renderer.test.mjs:1249",
              "runtime/arcorbit/test/desktop-renderer.test.mjs:1343",
              "Verification: 81/81 related tests passed",
              "Verification: npm run check passed with 524 passed, 21 conditional skips, 0 failed"
            ],
            "gap_refs": []
          }
        ]
      },
      "evidence": [
        "runtime/arcorbit/desktop/renderer/renderer.js",
        "runtime/arcorbit/test/desktop-renderer.test.mjs",
        "arckit/spec/agentic-software-development/arcorbit-platform-capabilities.md",
        "arckit/interaction/platform-workspace/interaction.md",
        "arckit/interaction/platform-workspace/default.html",
        "arckit/tech/arcorbit/platform-composition-solution.md",
        "Verification: 81/81 related tests passed",
        "Verification: npm run check passed with 524 passed, 21 conditional skips, 0 failed"
      ],
      "runtime_result_ref": "arckit-runtime://runs/RUN-20260828-193127049Z-eda2106f",
      "occurred_at": "2026-08-28T20:00:14.798Z"
    },
    {
      "round": 3,
      "transition_schema_version": "arckit-case-transition/v8",
      "goal": "独立审查 content revision 2 的实现正确性、问题解决、验证可信度、回归风险和最小性。",
      "outcome": "completed",
      "gap_selection": {
        "mode": "candidate",
        "basis": "当前 Case 的两个普通 Gap 和全部 impacts 已闭合；Completion Review 是唯一 ready Case candidate，并直接阻塞 Case 终态。四个 Project Gap 均需独立 Case，不能取代当前实现审查。",
        "snapshot_token": "87a21797afa1ce1b83a32f48d2f1b71f2f1470fafbf9c117723fc7698eb41a40",
        "selected_ref": "case-gap:CASE-20260828-001:CASE-20260828-001:completion-review:1",
        "comparison_summary": "选择 CASE-20260828-001 Completion Review；延后四个需要独立 Case 的 Project Gap。",
        "fresh_discovery_summary": "选择前未发现优先于 Completion Review 的 fresh candidate；审查过程中发现一项 mark-read 失败响应身份隔离缺陷，将作为 review finding 由 Ledger 派生后续普通修复 Gap。",
        "considered": [
          {
            "ref": "project-gap:GAP-agent-scenario-evaluation",
            "source": "persisted",
            "eligibility": "case_required",
            "disposition": "deferred",
            "priority_basis": {
              "blocking": "不阻塞当前 Feedback Case 的终态审查。",
              "uncertainty": "仍需隔离真实软件场景验证。",
              "risk": "高，但属于通用 Agent 动态选择模型。",
              "user_impact": "低于当前 Case 的完成门禁。"
            },
            "reason": "需要独立 Case，且不属于当前 Feedback 实现审查。"
          },
          {
            "ref": "project-gap:GAP-runtime-resilience-and-adapters",
            "source": "persisted",
            "eligibility": "case_required",
            "disposition": "deferred",
            "priority_basis": {
              "blocking": "不阻塞当前 Feedback Completion Review。",
              "uncertainty": "仍有 Runtime timeout、compaction 与 adapter 验收工作。",
              "risk": "高。",
              "user_impact": "对当前 Feedback 缺陷仅为间接影响。"
            },
            "reason": "范围属于通用 Runtime 韧性，需要独立 Case。"
          },
          {
            "ref": "project-gap:GAP-security-real-project-validation",
            "source": "persisted",
            "eligibility": "case_required",
            "disposition": "deferred",
            "priority_basis": {
              "blocking": "不阻塞当前受控 Feedback 请求审查。",
              "uncertainty": "需要真实权限项目证据。",
              "risk": "高。",
              "user_impact": "当前 Case 未暴露凭据或权限异常。"
            },
            "reason": "需要独立真实权限场景。"
          },
          {
            "ref": "project-gap:GAP-cross-record-audit",
            "source": "persisted",
            "eligibility": "case_required",
            "disposition": "deferred",
            "priority_basis": {
              "blocking": "不阻塞当前 Case 的实现审查。",
              "uncertainty": "跨记录一致性仍需真实验收。",
              "risk": "高。",
              "user_impact": "低于当前 Case 完成门禁。"
            },
            "reason": "当前审查不承担 Project、Iteration 与 Case 的通用跨记录验收。"
          },
          {
            "ref": "case-gap:CASE-20260828-001:CASE-20260828-001:completion-review:1",
            "source": "persisted",
            "eligibility": "ready",
            "disposition": "selected",
            "priority_basis": {
              "blocking": "Completion Review 是当前 Case 关闭前的唯一剩余门禁。",
              "uncertainty": "普通工作已闭合，但仍需独立检查五个完成维度。",
              "risk": "高；会话并发与过期响应边界直接影响已接受实现主张。",
              "user_impact": "决定用户能否可靠读取新回复并恢复失败状态。"
            },
            "reason": "唯一 ready Case candidate，且代码、测试和持久工件均可独立审查。"
          }
        ]
      },
      "selected_gap": {
        "id": "CASE-20260828-001:completion-review:1",
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
        "goal": "独立审查 content revision 2 的实现正确性、问题解决、验证可信度、回归风险和最小性。",
        "expected_state_change": "记录 Completion Review findings，并由 trusted Ledger 派生一个 Agent-owned 普通修复 Gap；本轮不修改 Case 内容或实现工件。"
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
            "problem_resolution": "clean",
            "verification_credibility": "findings",
            "regression_risk": "findings",
            "minimality": "clean"
          },
          "findings": [
            {
              "id": "FINDING-20260828-001-001",
              "kind": "error",
              "statement": "Feedback V2 已读回写失败分支在写入 readError 前未校验当前 request identity；旧或过期的 mark-read rejection 可污染较新会话状态。需要在失败分支加入与成功分支相同的 identity guard，并补充 mark-read 等待期间启动较新请求的竞态回归测试。",
              "responsibility": "agent",
              "artifact_refs": [
                "runtime/arcorbit/desktop/renderer/renderer.js",
                "runtime/arcorbit/test/desktop-renderer.test.mjs"
              ],
              "evidence": [
                "runtime/arcorbit/desktop/renderer/renderer.js:2584",
                "runtime/arcorbit/desktop/renderer/renderer.js:2585",
                "runtime/arcorbit/desktop/renderer/renderer.js:2589",
                "runtime/arcorbit/desktop/renderer/renderer.js:2590",
                "runtime/arcorbit/test/desktop-renderer.test.mjs:1249",
                "runtime/arcorbit/test/desktop-renderer.test.mjs:1304",
                "runtime/arcorbit/test/desktop-renderer.test.mjs:1332"
              ]
            }
          ],
          "evidence": [
            "runtime/arcorbit/desktop/renderer/renderer.js:2577",
            "runtime/arcorbit/desktop/renderer/renderer.js:2601",
            "runtime/arcorbit/test/desktop-renderer.test.mjs:1187",
            "runtime/arcorbit/test/desktop-renderer.test.mjs:1249",
            "runtime/arcorbit/test/desktop-renderer.test.mjs:1343",
            "Verification: 81/81 Feedback Renderer/Coordinator/Adapter tests passed during Completion Review",
            "Verification: git diff --check passed",
            "Verification: node --check runtime/arcorbit/desktop/renderer/renderer.js passed",
            "Prior verification: npm run check passed with 524 passed, 21 conditional skips, 0 failed"
          ],
          "reviewed_content_revision": 2
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
        "project_revision": 315,
        "judgments": [
          {
            "invariant_ref": "product-expectations-remain-recoverable",
            "disposition": "upheld",
            "reason": "自动加载、三个手动恢复入口、成功后已读和失败状态保持仍由稳定产品规格完整表达；Review finding 不改变产品预期本身。",
            "fact_refs": [
              "FACT-20260828-001-005",
              "FACT-20260828-001-007"
            ],
            "evidence": [
              "arckit/spec/agentic-software-development/arcorbit-platform-capabilities.md:473",
              "project:decision:experience_and_interaction"
            ],
            "gap_refs": []
          },
          {
            "invariant_ref": "interaction-expectations-remain-recoverable",
            "disposition": "upheld",
            "reason": "会话刷新与恢复交互语义完整、无歧义且已持久化；finding 属于实现竞态错误，不是交互定义缺失。",
            "fact_refs": [
              "FACT-20260828-001-005",
              "FACT-20260828-001-006"
            ],
            "evidence": [
              "arckit/interaction/platform-workspace/interaction.md:29",
              "arckit/interaction/platform-workspace/interaction.md:134",
              "arckit/interaction/platform-workspace/default.html:83"
            ],
            "gap_refs": []
          },
          {
            "invariant_ref": "visual-language-remains-consistent",
            "disposition": "not_relevant",
            "reason": "Completion Review 没有建立或改变视觉规则；既有刷新入口继续复用工作台组件语言。",
            "fact_refs": [],
            "evidence": [],
            "gap_refs": []
          },
          {
            "invariant_ref": "technical-decisions-remain-explainable",
            "disposition": "upheld",
            "reason": "通知与消息独立新鲜度、请求身份和过期隔离的技术决策仍然明确可恢复；finding 证明实现尚有一条失败分支未完全兑现该决策。",
            "fact_refs": [
              "FACT-20260828-001-004",
              "FACT-20260828-001-006"
            ],
            "evidence": [
              "arckit/tech/arcorbit/platform-composition-solution.md:182",
              "arckit/tech/arcorbit/platform-composition-solution.md:317",
              "project:decision:technical_foundation"
            ],
            "gap_refs": []
          },
          {
            "invariant_ref": "accepted-facts-are-realized",
            "disposition": "upheld",
            "reason": "Fresh canonical state 在本轮前已接受消息重载、组合刷新、成功后已读和消息响应隔离的主体实现；本轮不接受新事实或内容变化，发现的 mark-read 失败竞态通过 Completion Review finding 独立进入后续修复闭环。",
            "fact_refs": [
              "FACT-20260828-001-004",
              "FACT-20260828-001-005",
              "FACT-20260828-001-007"
            ],
            "evidence": [
              "runtime/arcorbit/desktop/renderer/renderer.js:2376",
              "runtime/arcorbit/desktop/renderer/renderer.js:2454",
              "runtime/arcorbit/test/desktop-renderer.test.mjs:1187",
              "Verification: 81/81 related tests passed"
            ],
            "gap_refs": []
          },
          {
            "invariant_ref": "material-risks-have-credible-evidence",
            "disposition": "upheld",
            "reason": "Completion Review 以具体失败分支和测试覆盖缺口识别了剩余竞态风险，主体自动/手动刷新、消息失败保持和消息响应隔离证据仍可重复；风险没有被静默判 clean。",
            "fact_refs": [
              "FACT-20260828-001-006",
              "FACT-20260828-001-007"
            ],
            "evidence": [
              "runtime/arcorbit/desktop/renderer/renderer.js:2584",
              "runtime/arcorbit/desktop/renderer/renderer.js:2589",
              "runtime/arcorbit/test/desktop-renderer.test.mjs:1249",
              "Verification: 81/81 related tests passed during Completion Review"
            ],
            "gap_refs": []
          }
        ]
      },
      "evidence": [
        "runtime/arcorbit/desktop/renderer/renderer.js:2584",
        "runtime/arcorbit/desktop/renderer/renderer.js:2589",
        "runtime/arcorbit/test/desktop-renderer.test.mjs:1249",
        "runtime/arcorbit/test/desktop-renderer.test.mjs:1343",
        "arckit/spec/agentic-software-development/arcorbit-platform-capabilities.md:473",
        "arckit/interaction/platform-workspace/interaction.md:29",
        "arckit/tech/arcorbit/platform-composition-solution.md:182",
        "Verification: 81/81 Feedback Renderer/Coordinator/Adapter tests passed during Completion Review",
        "Verification: git diff --check and renderer syntax check passed",
        "Prior verification: npm run check passed with 524 passed, 21 conditional skips, 0 failed"
      ],
      "runtime_result_ref": "arckit-runtime://runs/RUN-20260828-193127049Z-eda2106f",
      "occurred_at": "2026-08-28T20:04:34.395Z"
    },
    {
      "round": 4,
      "transition_schema_version": "arckit-case-transition/v8",
      "goal": "为 Feedback V2 mark-read 失败分支增加当前请求身份校验，并以较新请求启动后旧 rejection 到达的回归场景证明隔离。",
      "outcome": "completed",
      "gap_selection": {
        "mode": "candidate",
        "basis": "当前 Case 的 Completion Review finding 是唯一 ready Case Gap，直接阻塞 CASE-20260828-001 再次进入完成审查；四个 Project Gap 均需独立 Case，不能替代当前竞态修复。",
        "snapshot_token": "c4affed0431b5db658f31bc8432b76977365f727277efa778b707767529bdc33",
        "selected_ref": "case-gap:CASE-20260828-001:CASE-20260828-001:review-finding:FINDING-20260828-001-001",
        "comparison_summary": "选择当前 Case 的高阻塞、高风险 Review finding；延后四个需要独立 Case 的 Project Gap。",
        "fresh_discovery_summary": "没有发现优先于持久 Review finding 的 fresh candidate；复现、修复和验证未产生新的未解决工作。",
        "considered": [
          {
            "ref": "project-gap:GAP-agent-scenario-evaluation",
            "source": "persisted",
            "eligibility": "case_required",
            "disposition": "deferred",
            "priority_basis": {
              "blocking": "不阻塞当前 Feedback Case 的修复审查闭环。",
              "uncertainty": "仍需隔离真实场景证据。",
              "risk": "高，但属于通用动态选择验证。",
              "user_impact": "低于当前可能污染会话错误状态的竞态。"
            },
            "reason": "需要独立 Case，且不覆盖当前 Review finding。"
          },
          {
            "ref": "project-gap:GAP-runtime-resilience-and-adapters",
            "source": "persisted",
            "eligibility": "case_required",
            "disposition": "deferred",
            "priority_basis": {
              "blocking": "不直接阻塞当前 Feedback Case。",
              "uncertainty": "仍有 Runtime 韧性和 adapter 验收工作。",
              "risk": "高。",
              "user_impact": "间接，低于当前会话状态污染风险。"
            },
            "reason": "范围涉及通用 Runtime 和 adapter 边界，需要独立 Case。"
          },
          {
            "ref": "project-gap:GAP-security-real-project-validation",
            "source": "persisted",
            "eligibility": "case_required",
            "disposition": "deferred",
            "priority_basis": {
              "blocking": "不阻塞当前 Renderer 竞态修复。",
              "uncertainty": "需要真实权限项目证据。",
              "risk": "高。",
              "user_impact": "当前 finding 不涉及凭据或权限边界。"
            },
            "reason": "需要独立真实权限场景。"
          },
          {
            "ref": "project-gap:GAP-cross-record-audit",
            "source": "persisted",
            "eligibility": "case_required",
            "disposition": "deferred",
            "priority_basis": {
              "blocking": "不阻塞当前 Case 的再次完成审查。",
              "uncertainty": "跨记录一致性仍需真实验收。",
              "risk": "高。",
              "user_impact": "低于当前具体 Feedback 回归。"
            },
            "reason": "当前工作不涉及 Project、Iteration 与 Case 跨记录审计。"
          },
          {
            "ref": "case-gap:CASE-20260828-001:CASE-20260828-001:review-finding:FINDING-20260828-001-001",
            "source": "persisted",
            "eligibility": "ready",
            "disposition": "selected",
            "priority_basis": {
              "blocking": "是当前 Case 唯一剩余工作，直接阻塞再次 Completion Review。",
              "uncertainty": "根因和缺失 guard 已由 Review 精确定位。",
              "risk": "旧 mark-read rejection 可把错误写入较新项目的同 ID 会话。",
              "user_impact": "可能向用户展示与当前会话无关的已读回写错误。"
            },
            "reason": "唯一 ready Case Gap，且可用最小代码修复和直接竞态测试在本轮闭环。"
          }
        ]
      },
      "selected_gap": {
        "id": "CASE-20260828-001:review-finding:FINDING-20260828-001-001",
        "responsibility": "agent",
        "goal": "Resolve review finding: Feedback V2 已读回写失败分支在写入 readError 前未校验当前 request identity；旧或过期的 mark-read rejection 可污染较新会话状态。需要在失败分支加入与成功分支相同的 identity guard，并补充 mark-read 等待期间启动较新请求的竞态回归测试。",
        "reason": "error found by completion review",
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
          "runtime/arcorbit/desktop/renderer/renderer.js",
          "runtime/arcorbit/test/desktop-renderer.test.mjs",
          "runtime/arcorbit/desktop/renderer/renderer.js:2584",
          "runtime/arcorbit/desktop/renderer/renderer.js:2585",
          "runtime/arcorbit/desktop/renderer/renderer.js:2589",
          "runtime/arcorbit/desktop/renderer/renderer.js:2590",
          "runtime/arcorbit/test/desktop-renderer.test.mjs:1249",
          "runtime/arcorbit/test/desktop-renderer.test.mjs:1304",
          "runtime/arcorbit/test/desktop-renderer.test.mjs:1332"
        ]
      },
      "planned_transition": {
        "goal": "为 Feedback V2 mark-read 失败分支增加当前请求身份校验，并以较新请求启动后旧 rejection 到达的回归场景证明隔离。",
        "expected_state_change": "解决派生 Review finding Gap，关闭 FINDING-20260828-001-001，并使 Case 回到 fresh Completion Review 就绪状态。"
      },
      "accepted_state_delta": {
        "resolved_gap": {
          "id": "CASE-20260828-001:review-finding:FINDING-20260828-001-001",
          "status": "resolved",
          "outcome": "resolved",
          "reason": "markFeedbackV2Read 的 catch 分支现在先验证 feedback id、project/feedback request key 和单调 request id；过期 rejection 直接返回，不会写入当前会话 readError。回归测试显式让旧项目 mark-read 等待、启动并完成较新同 ID 会话，再拒绝旧请求，证明当前消息、身份和错误状态保持不变。",
          "evidence": [
            "runtime/arcorbit/desktop/renderer/renderer.js:2584",
            "runtime/arcorbit/desktop/renderer/renderer.js:2589",
            "runtime/arcorbit/desktop/renderer/renderer.js:2590",
            "runtime/arcorbit/test/desktop-renderer.test.mjs:1249",
            "runtime/arcorbit/test/desktop-renderer.test.mjs:1306",
            "runtime/arcorbit/test/desktop-renderer.test.mjs:1349",
            "runtime/arcorbit/test/desktop-renderer.test.mjs:1365",
            "Verification: regression test failed before the guard with readError='stale mark-read failure'",
            "Verification: targeted stale-response regression passed after the guard",
            "Verification: 81/81 Feedback Renderer/Coordinator/Adapter tests passed",
            "Verification: npm run check passed with 524 passed, 21 conditional skips, 0 failed",
            "Verification: renderer syntax check and git diff --check passed"
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
        "resolved_review_findings": [
          "FINDING-20260828-001-001"
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
        "project_revision": 315,
        "judgments": [
          {
            "invariant_ref": "product-expectations-remain-recoverable",
            "disposition": "upheld",
            "reason": "修复没有改变已接受的自动加载、手动恢复、成功后已读或失败保持语义；稳定产品规格继续完整表达预期。",
            "fact_refs": [
              "FACT-20260828-001-005",
              "FACT-20260828-001-007"
            ],
            "evidence": [
              "arckit/spec/agentic-software-development/arcorbit-platform-capabilities.md:473",
              "runtime/arcorbit/desktop/renderer/renderer.js:2590"
            ],
            "gap_refs": []
          },
          {
            "invariant_ref": "interaction-expectations-remain-recoverable",
            "disposition": "upheld",
            "reason": "会话刷新和错误恢复交互保持不变；过期已读错误现在不会污染用户正在查看的较新会话。",
            "fact_refs": [
              "FACT-20260828-001-005",
              "FACT-20260828-001-006"
            ],
            "evidence": [
              "arckit/interaction/platform-workspace/interaction.md:29",
              "arckit/interaction/platform-workspace/interaction.md:134",
              "runtime/arcorbit/test/desktop-renderer.test.mjs:1349"
            ],
            "gap_refs": []
          },
          {
            "invariant_ref": "visual-language-remains-consistent",
            "disposition": "not_relevant",
            "reason": "本轮仅修复异步状态隔离并扩充测试，没有建立或改变视觉语言规则。",
            "fact_refs": [],
            "evidence": [],
            "gap_refs": []
          },
          {
            "invariant_ref": "technical-decisions-remain-explainable",
            "disposition": "upheld",
            "reason": "mark-read 成功、失败和消息加载分支现在统一遵守已有 request identity 与过期响应隔离决策。",
            "fact_refs": [
              "FACT-20260828-001-004",
              "FACT-20260828-001-006",
              "FACT-20260828-001-007"
            ],
            "evidence": [
              "arckit/tech/arcorbit/platform-composition-solution.md:182",
              "arckit/tech/arcorbit/platform-composition-solution.md:317",
              "runtime/arcorbit/desktop/renderer/renderer.js:2584",
              "runtime/arcorbit/desktop/renderer/renderer.js:2590"
            ],
            "gap_refs": []
          },
          {
            "invariant_ref": "accepted-facts-are-realized",
            "disposition": "upheld",
            "reason": "当前实现完整兑现身份或序号过期的响应不得覆盖当前结果这一已接受事实，包括此前遗漏的 mark-read rejection 分支。",
            "fact_refs": [
              "FACT-20260828-001-006",
              "FACT-20260828-001-007"
            ],
            "evidence": [
              "runtime/arcorbit/desktop/renderer/renderer.js:2590",
              "runtime/arcorbit/test/desktop-renderer.test.mjs:1349",
              "Verification: targeted stale-response regression passed"
            ],
            "gap_refs": []
          },
          {
            "invariant_ref": "material-risks-have-credible-evidence",
            "disposition": "upheld",
            "reason": "竞态由修复前失败测试直接复现，并由修复后相同测试、81 项聚焦回归和完整 545 项检查证明受控。",
            "fact_refs": [
              "FACT-20260828-001-006",
              "FACT-20260828-001-007"
            ],
            "evidence": [
              "runtime/arcorbit/test/desktop-renderer.test.mjs:1249",
              "runtime/arcorbit/test/desktop-renderer.test.mjs:1349",
              "Verification: regression failed before fix and passed after fix",
              "Verification: 81/81 focused tests passed",
              "Verification: npm run check passed with 524 passed, 21 conditional skips, 0 failed"
            ],
            "gap_refs": []
          }
        ]
      },
      "evidence": [
        "runtime/arcorbit/desktop/renderer/renderer.js:2590",
        "runtime/arcorbit/test/desktop-renderer.test.mjs:1249",
        "runtime/arcorbit/test/desktop-renderer.test.mjs:1349",
        "Verification: regression failed before fix and passed after fix",
        "Verification: 81/81 Feedback Renderer/Coordinator/Adapter tests passed",
        "Verification: npm run check passed with 524 passed, 21 conditional skips, 0 failed",
        "Verification: renderer syntax check and git diff --check passed"
      ],
      "runtime_result_ref": "arckit-runtime://runs/RUN-20260828-193127049Z-eda2106f",
      "occurred_at": "2026-08-28T20:10:05.694Z"
    },
    {
      "round": 5,
      "transition_schema_version": "arckit-case-transition/v8",
      "goal": "独立审查 content revision 3 的实现正确性、真实问题解决、验证可信度、回归风险和最小性。",
      "outcome": "completed",
      "gap_selection": {
        "mode": "candidate",
        "basis": "当前 Case 的第二次 Completion Review 是唯一 ready Case Gap，直接决定 CASE-20260828-001 能否解决；四个 Project Gap 均需独立 Case。",
        "snapshot_token": "dbc61651c23a5c802773c9125d401b1693bd626da62aa0962368eb73de36195b",
        "selected_ref": "case-gap:CASE-20260828-001:CASE-20260828-001:completion-review:2",
        "comparison_summary": "选择 content revision 3 的 Completion Review；延后四个需要独立 Case 的 Project Gap。",
        "fresh_discovery_summary": "审查实现、测试和验证结果后未发现新的 error、omission 或 excess candidate。",
        "considered": [
          {
            "ref": "project-gap:GAP-agent-scenario-evaluation",
            "source": "persisted",
            "eligibility": "case_required",
            "disposition": "deferred",
            "priority_basis": {
              "blocking": "不阻塞当前 Feedback Case 的完成审查。",
              "uncertainty": "仍需隔离真实场景证据。",
              "risk": "高，但属于通用动态选择验证。",
              "user_impact": "低于完成当前已实现修复的独立审查。"
            },
            "reason": "需要独立 Case，不能替代当前 Completion Review。"
          },
          {
            "ref": "project-gap:GAP-runtime-resilience-and-adapters",
            "source": "persisted",
            "eligibility": "case_required",
            "disposition": "deferred",
            "priority_basis": {
              "blocking": "不直接阻塞当前 Feedback Case。",
              "uncertainty": "仍有 Runtime 韧性和 adapter 验收工作。",
              "risk": "高。",
              "user_impact": "与当前 Feedback 修复的完成判断无直接关系。"
            },
            "reason": "范围涉及通用 Runtime 和 adapter 边界，需要独立 Case。"
          },
          {
            "ref": "project-gap:GAP-security-real-project-validation",
            "source": "persisted",
            "eligibility": "case_required",
            "disposition": "deferred",
            "priority_basis": {
              "blocking": "不阻塞当前 Completion Review。",
              "uncertainty": "需要真实权限项目证据。",
              "risk": "高。",
              "user_impact": "当前修复不改变凭据或权限边界。"
            },
            "reason": "需要独立真实权限场景。"
          },
          {
            "ref": "project-gap:GAP-cross-record-audit",
            "source": "persisted",
            "eligibility": "case_required",
            "disposition": "deferred",
            "priority_basis": {
              "blocking": "不阻塞当前 Case 的完成审查。",
              "uncertainty": "跨记录一致性仍需真实验收。",
              "risk": "高。",
              "user_impact": "低于当前 Case 的关闭判断。"
            },
            "reason": "当前审查不涉及 Project、Iteration 与 Case 跨记录验收。"
          },
          {
            "ref": "case-gap:CASE-20260828-001:CASE-20260828-001:completion-review:2",
            "source": "persisted",
            "eligibility": "ready",
            "disposition": "selected",
            "priority_basis": {
              "blocking": "是当前 Case 唯一剩余义务。",
              "uncertainty": "低；普通 Gap、state impacts 和首轮 finding 均已关闭。",
              "risk": "高；必须独立验证修复正确性与回归控制。",
              "user_impact": "直接决定用户报告的问题能否可信关闭。"
            },
            "reason": "唯一 ready Case Gap，且 content revision 3 已具备五维审查所需的实现与验证证据。"
          }
        ]
      },
      "selected_gap": {
        "id": "CASE-20260828-001:completion-review:2",
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
        "goal": "独立审查 content revision 3 的实现正确性、真实问题解决、验证可信度、回归风险和最小性。",
        "expected_state_change": "接受 clean Completion Review，使 CASE-20260828-001 达到 resolved。"
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
            "runtime/arcorbit/desktop/renderer/renderer.js:2578",
            "runtime/arcorbit/desktop/renderer/renderer.js:2585",
            "runtime/arcorbit/desktop/renderer/renderer.js:2590",
            "runtime/arcorbit/desktop/renderer/renderer.js:2597",
            "runtime/arcorbit/test/desktop-renderer.test.mjs:1249",
            "runtime/arcorbit/test/desktop-renderer.test.mjs:1349",
            "runtime/arcorbit/test/desktop-renderer.test.mjs:1365",
            "arckit/spec/agentic-software-development/arcorbit-platform-capabilities.md:473",
            "arckit/interaction/platform-workspace/interaction.md:29",
            "arckit/tech/arcorbit/platform-composition-solution.md:182",
            "Verification during Completion Review: targeted stale mark-read regression passed 1/1",
            "Verification during Completion Review: 81/81 Feedback Renderer/Coordinator/Adapter tests passed",
            "Verification during Completion Review: renderer syntax check and git diff --check passed",
            "Content revision 3 verification: npm run check passed with 524 passed, 21 conditional skips, 0 failed"
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
        "project_revision": 315,
        "judgments": [
          {
            "invariant_ref": "product-expectations-remain-recoverable",
            "disposition": "upheld",
            "reason": "自动加载、三个手动刷新入口、成功后已读和失败保持均由稳定产品规格表达，并由审查后的实现兑现。",
            "fact_refs": [
              "FACT-20260828-001-005",
              "FACT-20260828-001-007"
            ],
            "evidence": [
              "arckit/spec/agentic-software-development/arcorbit-platform-capabilities.md:473",
              "runtime/arcorbit/desktop/renderer/renderer.js:2578"
            ],
            "gap_refs": []
          },
          {
            "invariant_ref": "interaction-expectations-remain-recoverable",
            "disposition": "upheld",
            "reason": "自动刷新、手动恢复、状态保持和错误隔离交互完整且与实际行为一致。",
            "fact_refs": [
              "FACT-20260828-001-005",
              "FACT-20260828-001-006",
              "FACT-20260828-001-007"
            ],
            "evidence": [
              "arckit/interaction/platform-workspace/interaction.md:29",
              "arckit/interaction/platform-workspace/interaction.md:134",
              "runtime/arcorbit/test/desktop-renderer.test.mjs:1249"
            ],
            "gap_refs": []
          },
          {
            "invariant_ref": "visual-language-remains-consistent",
            "disposition": "not_relevant",
            "reason": "Completion Review 未发现或建立视觉规则变化；刷新入口继续复用既有工作台组件语言。",
            "fact_refs": [],
            "evidence": [],
            "gap_refs": []
          },
          {
            "invariant_ref": "technical-decisions-remain-explainable",
            "disposition": "upheld",
            "reason": "通知与消息独立新鲜度、组合刷新、请求身份、成功及失败响应隔离在技术方案和实现中保持一致。",
            "fact_refs": [
              "FACT-20260828-001-004",
              "FACT-20260828-001-006",
              "FACT-20260828-001-007"
            ],
            "evidence": [
              "arckit/tech/arcorbit/platform-composition-solution.md:182",
              "arckit/tech/arcorbit/platform-composition-solution.md:317",
              "runtime/arcorbit/desktop/renderer/renderer.js:2585",
              "runtime/arcorbit/desktop/renderer/renderer.js:2590"
            ],
            "gap_refs": []
          },
          {
            "invariant_ref": "accepted-facts-are-realized",
            "disposition": "upheld",
            "reason": "Renderer 会重载 fresh 未读会话、组合处理手动刷新、成功后标记已读，并隔离消息及 mark-read 的过期成功或失败响应。",
            "fact_refs": [
              "FACT-20260828-001-004",
              "FACT-20260828-001-005",
              "FACT-20260828-001-006",
              "FACT-20260828-001-007"
            ],
            "evidence": [
              "runtime/arcorbit/desktop/renderer/renderer.js:2578",
              "runtime/arcorbit/desktop/renderer/renderer.js:2590",
              "runtime/arcorbit/test/desktop-renderer.test.mjs:1349",
              "Verification during Completion Review: targeted stale mark-read regression passed"
            ],
            "gap_refs": []
          },
          {
            "invariant_ref": "material-risks-have-credible-evidence",
            "disposition": "upheld",
            "reason": "重复请求、消息及已读响应竞态、失败状态保持和本地编辑状态风险均有直接行为测试；相关套件和完整检查无失败。",
            "fact_refs": [
              "FACT-20260828-001-006",
              "FACT-20260828-001-007"
            ],
            "evidence": [
              "runtime/arcorbit/test/desktop-renderer.test.mjs:1249",
              "runtime/arcorbit/test/desktop-renderer.test.mjs:1349",
              "runtime/arcorbit/test/desktop-renderer.test.mjs:1365",
              "Verification during Completion Review: 81/81 focused tests passed",
              "Content revision 3 verification: npm run check passed with 524 passed, 21 conditional skips, 0 failed"
            ],
            "gap_refs": []
          }
        ]
      },
      "evidence": [
        "runtime/arcorbit/desktop/renderer/renderer.js:2590",
        "runtime/arcorbit/test/desktop-renderer.test.mjs:1249",
        "runtime/arcorbit/test/desktop-renderer.test.mjs:1349",
        "Verification during Completion Review: targeted regression passed 1/1",
        "Verification during Completion Review: 81/81 focused tests passed",
        "Verification during Completion Review: renderer syntax check and git diff --check passed",
        "Content revision 3 verification: npm run check passed with 524 passed, 21 conditional skips, 0 failed"
      ],
      "runtime_result_ref": "arckit-runtime://runs/RUN-20260828-193127049Z-eda2106f",
      "occurred_at": "2026-08-28T20:12:10.108Z"
    }
  ],
  "case_resolution": {
    "status": "resolved",
    "stage": "resolved",
    "satisfied": [
      "GAP-20260828-001-001",
      "GAP-20260828-001-002",
      "CASE-20260828-001:review-finding:FINDING-20260828-001-001"
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
    "updated_at": "2026-08-28T20:12:10.108Z"
  }
}
```

## Round Notes

- Case history is canonical in Structured Record.rounds; keep prose notes exceptional.
