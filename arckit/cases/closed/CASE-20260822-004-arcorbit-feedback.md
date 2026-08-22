# 补齐 ArcOrbit Feedback 日常处理能力

Case: CASE-20260822-004
Status: closed
Artifact Type: mixed
Selected Gap: none
Updated: 2026-08-22T21:06:33.115Z

## User Intent

参考 ../../hoewo/Workshop-Feedbacks 的反馈管理前端与实际服务契约，补齐 ArcOrbit Feedback 页面核心工作流，使用户能够在 ArcOrbit 内完成日常反馈处理而无需依赖网页版。

## Structured Record

```json
{
  "schema_version": "development-case-record/v5",
  "id": "CASE-20260822-004",
  "title": "补齐 ArcOrbit Feedback 日常处理能力",
  "status": "closed",
  "artifact_type": "mixed",
  "created_at": "2026-08-22T18:53:22.456Z",
  "updated_at": "2026-08-22T21:06:33.115Z",
  "user_intent": "参考 ../../hoewo/Workshop-Feedbacks 的反馈管理前端与实际服务契约，补齐 ArcOrbit Feedback 页面核心工作流，使用户能够在 ArcOrbit 内完成日常反馈处理而无需依赖网页版。",
  "expected_outcome": "ArcOrbit Feedback 提供与日常反馈处理相匹配的列表发现、详情阅读、处理推进和待办流转能力；已确认的 V1/V2、权限、附件、身份与失败恢复边界被如实呈现并有可信验证。",
  "project_state_ref": "arckit/project/state.record.json",
  "current_round": {
    "goal": "",
    "selected_gap": null
  },
  "facts": [
    {
      "id": "FACT-feedback-daily-work-parity-required",
      "revision": 1,
      "status": "accepted",
      "statement": "ArcOrbit Feedback 当前功能不足以替代 Workshop Feedback 网页端的日常处理；目标是参考 ../../hoewo/Workshop-Feedbacks 前端补齐核心能力，使用户日常处理反馈无需再使用网页版。",
      "basis": "当前 operator 明确报告实际不足并给出参考实现与成功结果；现有 Project State 已确定 ArcOrbit 应覆盖日常 Feedback 工作。",
      "evidence": [
        "Current operator input, 2026-08-23",
        "arckit/spec/agentic-software-development/arcorbit-platform-capabilities.md",
        "runtime/arcorbit/desktop/renderer/index.html",
        "runtime/arcorbit/desktop/renderer/renderer.js",
        "../../hoewo/Workshop-Feedbacks/webapps/feedback-console-web/src/components/features/FeedbackManagementDialog.tsx"
      ]
    },
    {
      "id": "FACT-feedback-v1-workbench-current-coverage",
      "revision": 1,
      "status": "superseded",
      "statement": "ArcOrbit Workset Feedback 已实现 V1 日常工作台主体：按 Workset/产品范围读取完整分页反馈，支持本地搜索、处理状态筛选、时间/优先级排序、稳定选择、详情与原附件打开，并提供优先级、忽略、刷新、权限门禁删除和可恢复的两步转待办。Renderer 不提供创建或编辑用户反馈原文。",
      "basis": "ArcOrbit Renderer、Platform Coordinator、Workshop Platform Adapter 与现有测试直接证明这些能力。",
      "evidence": [
        "runtime/arcorbit/desktop/renderer/index.html:121",
        "runtime/arcorbit/desktop/renderer/renderer.js:855",
        "runtime/arcorbit/desktop/renderer/renderer.js:880",
        "runtime/arcorbit/desktop/renderer/renderer.js:1194",
        "runtime/arcorbit/src/platform-coordinator.mjs:283",
        "runtime/arcorbit/src/workshop-platform-adapter.mjs:73",
        "runtime/arcorbit/test/desktop-renderer.test.mjs:29",
        "Verification: targeted ArcOrbit tests — 23 passed, 0 failed"
      ]
    },
    {
      "id": "FACT-feedback-v1-record-compatibility-gap",
      "revision": 1,
      "status": "accepted",
      "statement": "ArcOrbit 的 V1 归一化只把 data.priority 的精确 P1/P2/P3、data.ignored、data.task_id 和 data.task_state 投影为处理事实；参考控制台还兼容 top-level task_id/task_state/triage_status/status、data.converted_task_id、历史状态别名、数值或 ai_priority/priority_level，并在缺少优先级时使用 P2。当前差异会把部分网页端或历史记录误判为未关联/待处理，允许重复转待办；Renderer 还在已关联待办时保留优先级选择器，与既有交互规格不一致。",
      "basis": "两端归一化与详情动作代码逐项对照，持久规格同时明确兼容历史字段、缺省 P2 和已关联待办后不在反馈中调整优先级。",
      "evidence": [
        "runtime/arcorbit/src/workshop-platform-adapter.mjs:232",
        "runtime/arcorbit/src/workshop-platform-adapter.mjs:250",
        "runtime/arcorbit/desktop/renderer/renderer.js:889",
        "runtime/arcorbit/desktop/renderer/renderer.js:908",
        "../../hoewo/Workshop-Feedbacks/webapps/feedback-console-web/src/components/features/FeedbackManagementDialog.tsx:184",
        "../../hoewo/Workshop-Feedbacks/webapps/feedback-console-web/src/components/features/FeedbackManagementDialog.tsx:211",
        "../../hoewo/Workshop-Feedbacks/webapps/feedback-console-web/src/components/features/FeedbackManagementDialog.tsx:267",
        "arckit/spec/agentic-software-development/arcorbit-platform-capabilities.md:299",
        "arckit/interaction/platform-workspace/interaction.md"
      ]
    },
    {
      "id": "FACT-feedback-v2-management-boundary",
      "revision": 1,
      "status": "superseded",
      "statement": "参考控制台只在显式项目开关启用时使用 Feedback V2，增加开发者消息、回复附件上传/访问、未读通知与已读标记、专用忽略和服务端原子转待办。ArcOrbit 当前没有 Feedback V2 管理 adapter，Project 技术决策将其默认标记为 unavailable；在缺少权威服务端实现、权限和真实环境能力验证时，不能把参考前端客户端请求直接声明为 ArcOrbit 可用契约。当前下一最小可实施范围因此是先补齐 V1 记录兼容与动作状态正确性。",
      "basis": "参考控制台的条件开关及 V2 client 与 ArcOrbit 的持久技术方案、capability 投影和 restricted IPC 边界一致证明该结论。",
      "evidence": [
        "../../hoewo/Workshop-Feedbacks/webapps/feedback-console-web/src/hooks/useFeedbacks.ts",
        "../../hoewo/Workshop-Feedbacks/webapps/feedback-console-web/src/lib/api/feedbackV2Client.ts",
        "../../hoewo/Workshop-Feedbacks/webapps/feedback-console-web/src/components/features/FeedbackConversationPanel.tsx",
        "arckit/tech/arcorbit/platform-composition-solution.md:139",
        "arckit/tech/arcorbit/platform-composition-solution.md:244",
        "arckit/tech/arcorbit/platform-composition-solution.md:346",
        "runtime/arcorbit/src/platform-coordinator.mjs:165"
      ]
    },
    {
      "id": "FACT-feedback-v1-record-compatibility-realized",
      "revision": 1,
      "status": "accepted",
      "statement": "ArcOrbit Feedback V1 现已归一化 top-level task_id/task_state、data.task_id/converted_task_id、triage/status/历史状态别名以及 priority、ai_priority、priority_level 的命名或数值优先级，缺省优先级为 P2；转待办同时写回新旧客户端可识别的关联与状态字段。",
      "basis": "直接实现、定向行为测试和完整 ArcOrbit 检查共同证明。",
      "evidence": [
        "runtime/arcorbit/src/workshop-platform-adapter.mjs:232",
        "runtime/arcorbit/src/platform-coordinator.mjs:297",
        "runtime/arcorbit/test/workshop-platform-adapter.test.mjs:47",
        "runtime/arcorbit/test/platform-coordinator.test.mjs:150",
        "Verification: npm run check — 254 tests, 251 passed, 3 skipped, 0 failed"
      ]
    },
    {
      "id": "FACT-feedback-v1-workbench-current-coverage-corrected",
      "revision": 1,
      "status": "superseded",
      "statement": "ArcOrbit Workset Feedback 已实现 V1 日常工作台主体及两步转待办；如果 Task 创建后 Feedback 关联写回失败，界面会明确保留并显示已创建 task_id，但当前没有只重试关联写回的恢复动作，直接重新转待办存在重复创建风险。",
      "basis": "Platform Coordinator 的 partial_result 与 Renderer 错误呈现直接证明已创建 Task 可见，但现有受限动作集合不存在 association-only retry。",
      "evidence": [
        "runtime/arcorbit/src/platform-coordinator.mjs:314",
        "runtime/arcorbit/desktop/renderer/renderer.js:1209",
        "runtime/arcorbit/desktop/renderer/renderer.js:1241"
      ]
    },
    {
      "id": "FACT-feedback-v1-workbench-current-coverage-corrected",
      "revision": 2,
      "status": "accepted",
      "statement": "ArcOrbit Workset Feedback 在 Task 创建后关联写回失败时保留 task_id，并提供只重试关联且不再次创建 Task 的安全恢复。",
      "basis": "直接实现、交互事实和行为测试共同证明。",
      "evidence": [
        "runtime/arcorbit/src/platform-coordinator.mjs:286",
        "runtime/arcorbit/desktop/renderer/renderer.js:1247",
        "runtime/arcorbit/test/platform-coordinator.test.mjs:178"
      ]
    },
    {
      "id": "FACT-feedback-v2-management-boundary",
      "revision": 2,
      "status": "accepted",
      "statement": "Workshop-Feedbacks 前端开发者控制台的 V2 client、项目开关和会话组件是 ArcOrbit Workset Feedback 开发者管理能力采用的实现契约；实现前不要求真实环境 API 验证。该契约覆盖 triage/customer 状态、用户/开发者/system 消息、回复附件上传与受控读取、通知/已读、专用忽略和服务端原子转待办。它不使用 ArcOrbit 产品反馈中心的 SDK WebView V2、Project 107 或内置 API Key；运行时仍必须保持受限 Platform Adapter、项目开关和逐动作失败关闭。",
      "basis": "operator 明确接受前端代码作为充分依据，相关前端源码完整表达请求、响应、灰度和恢复行为。",
      "evidence": [
        "Current operator input, 2026-08-23",
        "../../hoewo/Workshop-Feedbacks/webapps/feedback-console-web/src/lib/api/feedbackV2Client.ts",
        "../../hoewo/Workshop-Feedbacks/webapps/feedback-console-web/src/hooks/useFeedbacks.ts",
        "../../hoewo/Workshop-Feedbacks/webapps/feedback-console-web/src/components/features/FeedbackConversationPanel.tsx",
        "arckit/spec/agentic-software-development/arcorbit-platform-capabilities.md:300",
        "arckit/interaction/platform-workspace/interaction.md:23",
        "arckit/tech/arcorbit/platform-composition-solution.md:137"
      ]
    },
    {
      "id": "FACT-feedback-v2-management-realized",
      "revision": 1,
      "status": "accepted",
      "statement": "ArcOrbit Workset Feedback 已通过 authenticated /workshop/v2/user 固定路由、项目 allowlist、restricted Workshop Platform Adapter、Platform Coordinator 和专用 typed IPC 实现开发者管理 V2。Renderer 可读取用户/开发者/system 消息、保留失败草稿、发送文本或受控附件、显示未读并标记已读、专用忽略、更新/删除和服务端原子转待办；401 回到登录门禁、404 刷新事实、其他失败只降级对应动作并保留已加载内容。附件上传策略和临时读取凭据只在 main process 使用，Workset Feedback 不调用产品反馈 SDK WebView、Project 107 或 bundled API Key；V2 不可用时保留 V1 事实并明确降级。",
      "basis": "直接实现、固定路由测试、逐功能失败测试、专用 IPC 静态边界测试和完整 ArcOrbit 检查共同证明。",
      "evidence": [
        "runtime/arcorbit/src/task-source-adapter.mjs",
        "runtime/arcorbit/src/workshop-platform-adapter.mjs:103",
        "runtime/arcorbit/src/feedback-v2-attachment-access.mjs",
        "runtime/arcorbit/src/platform-coordinator.mjs:395",
        "runtime/arcorbit/desktop/main.mjs:347",
        "runtime/arcorbit/desktop/preload.cjs:50",
        "runtime/arcorbit/desktop/renderer/renderer.js:929",
        "runtime/arcorbit/test/feedback-v2-attachment-access.test.mjs:5",
        "Verification: npm run check -- --test-reporter=dot — 265 tests, 262 passed, 3 skipped, 0 failed"
      ]
    }
  ],
  "state_impacts": [
    {
      "id": "IMPACT-feedback-product-capability-parity",
      "fact_id": "FACT-feedback-daily-work-parity-required",
      "fact_revision": 1,
      "target": {
        "kind": "software_decision",
        "ref": "product_capabilities",
        "revision": 17
      },
      "effect": "upheld",
      "reason": "V1 兼容/恢复和开发者管理 V2 现均已实现，ArcOrbit 可覆盖已接受的 Feedback 日常处理范围。",
      "gap_ids": [],
      "evidence": [
        "FACT-feedback-v2-management-realized",
        "runtime/arcorbit/desktop/renderer/renderer.js:929",
        "Verification: npm run check -- --test-reporter=dot — 265 tests, 262 passed, 3 skipped, 0 failed"
      ]
    },
    {
      "id": "IMPACT-feedback-realization-gap",
      "fact_id": "FACT-feedback-daily-work-parity-required",
      "fact_revision": 1,
      "target": {
        "kind": "software_invariant",
        "ref": "accepted-facts-are-realized",
        "revision": null
      },
      "effect": "upheld",
      "reason": "直接代码和行为测试兑现了消息、附件、未读、忽略及原子流转契约。",
      "gap_ids": [],
      "evidence": [
        "FACT-feedback-v2-management-realized",
        "runtime/arcorbit/test/platform-coordinator.test.mjs:244",
        "runtime/arcorbit/test/desktop-renderer.test.mjs:221"
      ]
    },
    {
      "id": "IMPACT-feedback-interaction-parity",
      "fact_id": "FACT-feedback-v1-record-compatibility-gap",
      "fact_revision": 1,
      "target": {
        "kind": "software_decision",
        "ref": "experience_and_interaction",
        "revision": 28
      },
      "effect": "upheld",
      "reason": "状态、关联和优先级现在正确呈现；已关联反馈不再提供优先级修改或重复转待办。",
      "gap_ids": [],
      "evidence": [
        "runtime/arcorbit/src/workshop-platform-adapter.mjs:232",
        "runtime/arcorbit/desktop/renderer/renderer.js:886",
        "runtime/arcorbit/test/desktop-renderer.test.mjs:51"
      ]
    },
    {
      "id": "IMPACT-feedback-v2-boundary-upheld",
      "fact_id": "FACT-feedback-v2-management-boundary",
      "fact_revision": 2,
      "target": {
        "kind": "software_decision",
        "ref": "external_integrations",
        "revision": 8
      },
      "effect": "upheld",
      "reason": "Feedback V2 保持显式 rollout、独立 notification capability、专用 typed IPC 和 main-process 附件边界；Renderer 仅在 mark_read 成功后更新本地 read state 并立即重绘列表可见投影。",
      "gap_ids": [],
      "evidence": [
        "runtime/arcorbit/src/platform-coordinator.mjs:27",
        "runtime/arcorbit/src/platform-coordinator.mjs:35",
        "runtime/arcorbit/desktop/renderer/renderer.js:983",
        "runtime/arcorbit/desktop/renderer/renderer.js:1000",
        "runtime/arcorbit/test/desktop-renderer.test.mjs:293",
        "runtime/arcorbit/desktop/feedback-v2-ipc.cjs:1"
      ]
    },
    {
      "id": "IMPACT-feedback-v1-risk-evidence",
      "fact_id": "FACT-feedback-v1-record-compatibility-gap",
      "fact_revision": 1,
      "target": {
        "kind": "software_invariant",
        "ref": "material-risks-have-credible-evidence",
        "revision": null
      },
      "effect": "upheld",
      "reason": "历史字段误分类、关联识别、缺省优先级和已关联动作门禁均有直接行为测试及完整检查证据。",
      "gap_ids": [],
      "evidence": [
        "runtime/arcorbit/test/workshop-platform-adapter.test.mjs:47",
        "runtime/arcorbit/test/platform-coordinator.test.mjs:150",
        "runtime/arcorbit/test/desktop-renderer.test.mjs:51",
        "Verification: npm run check — 254 tests, 251 passed, 3 skipped, 0 failed"
      ]
    },
    {
      "id": "IMPACT-feedback-v1-link-recovery-interaction",
      "fact_id": "FACT-feedback-v1-workbench-current-coverage-corrected",
      "fact_revision": 2,
      "target": {
        "kind": "software_decision",
        "ref": "experience_and_interaction",
        "revision": 28
      },
      "effect": "upheld",
      "reason": "仅重试关联交互已经实现并持久化。",
      "gap_ids": [],
      "evidence": [
        "arckit/interaction/platform-workspace/interaction.md:121",
        "runtime/arcorbit/desktop/renderer/renderer.js:896"
      ]
    },
    {
      "id": "IMPACT-feedback-v1-link-recovery-risk",
      "fact_id": "FACT-feedback-v1-workbench-current-coverage-corrected",
      "fact_revision": 2,
      "target": {
        "kind": "software_invariant",
        "ref": "material-risks-have-credible-evidence",
        "revision": null
      },
      "effect": "upheld",
      "reason": "行为测试证明恢复不重复创建 Task。",
      "gap_ids": [],
      "evidence": [
        "runtime/arcorbit/test/platform-coordinator.test.mjs:178"
      ]
    }
  ],
  "gaps": [
    {
      "id": "GAP-feedback-core-parity-baseline",
      "status": "resolved",
      "goal": "建立 ArcOrbit Feedback 与 Workshop-Feedbacks 前端之间有证据的核心日常处理能力、交互状态和服务契约差距基线，并明确下一项最小可实施验收范围。",
      "reason": "列表、筛选、详情、优先级、忽略、删除、附件、消息/回复、通知、状态推进和转待办等能力分属 V1、可选 V2 与不同权限边界；未经对照确认会改变后续实现对象、风险和验收方式。",
      "derived_from": [
        "FACT-feedback-daily-work-parity-required",
        "IMPACT-feedback-product-capability-parity",
        "IMPACT-feedback-realization-gap"
      ],
      "blocked_by": [],
      "priority_basis": {
        "blocking": "后续实现范围和验收方式依赖该差距基线。",
        "uncertainty": "ArcOrbit 已覆盖能力、参考前端核心流程及可用服务契约尚未形成逐项映射。",
        "risk": "误把 V2、权限或附件能力当作已可用契约会制造不可工作的界面或破坏安全边界。",
        "user_impact": "直接决定用户能否在 ArcOrbit 内完成日常反馈处理。"
      },
      "responsibility": "agent",
      "evidence_required": [
        "ArcOrbit Renderer、Platform Coordinator、Workshop Platform Adapter 与测试中的现有 Feedback 能力清单",
        "Workshop-Feedbacks 核心反馈管理页面、hooks/client 和用户动作清单",
        "V1、可选 V2、权限、附件、通知与转待办契约的支持/缺口映射",
        "按日常使用价值排序且可独立验收的下一实现范围"
      ],
      "resolution": {
        "id": "GAP-feedback-core-parity-baseline",
        "status": "resolved",
        "outcome": "已建立 ArcOrbit V1 现状、参考控制台 V1/V2 能力、服务边界和下一最小实施范围的证据基线。",
        "reason": "源代码、持久产品/交互/技术事实和相关测试共同覆盖了 Gap 的四项证据要求。",
        "evidence": [
          "runtime/arcorbit/desktop/renderer/index.html",
          "runtime/arcorbit/desktop/renderer/renderer.js",
          "runtime/arcorbit/src/platform-coordinator.mjs",
          "runtime/arcorbit/src/workshop-platform-adapter.mjs",
          "../../hoewo/Workshop-Feedbacks/webapps/feedback-console-web/src/components/features/FeedbackManagementDialog.tsx",
          "../../hoewo/Workshop-Feedbacks/webapps/feedback-console-web/src/components/features/FeedbackConversationPanel.tsx",
          "../../hoewo/Workshop-Feedbacks/webapps/feedback-console-web/src/lib/api/feedbackV2Client.ts",
          "Verification: node --test test/workshop-platform-adapter.test.mjs test/platform-coordinator.test.mjs test/desktop-renderer.test.mjs — 23 passed, 0 failed"
        ],
        "occurred_at": "2026-08-22T18:58:21.161Z"
      }
    },
    {
      "id": "GAP-feedback-v1-record-compatibility",
      "status": "resolved",
      "goal": "ArcOrbit 正确归一化并安全处理参考控制台和历史 Workshop Feedback V1 记录，使处理状态、优先级和待办关联一致，已关联反馈不可重复转待办或继续修改反馈优先级，并以行为测试证明。",
      "reason": "当前窄字段投影会误判部分记录，直接影响无需网页版的日常处理正确性；该结果是已接受基线确定的最小可实施范围。",
      "derived_from": [
        "FACT-feedback-v1-record-compatibility-gap",
        "IMPACT-feedback-interaction-parity",
        "IMPACT-feedback-v1-risk-evidence"
      ],
      "blocked_by": [],
      "priority_basis": {
        "blocking": "阻塞 Feedback V1 日常处理正确性。",
        "uncertainty": "低；对象、字段映射和验收边界已由源码对照确定。",
        "risk": "误分类、重复转待办和错误修改优先级。",
        "user_impact": "高；直接影响用户能否信任 ArcOrbit 处理反馈。"
      },
      "responsibility": "agent",
      "evidence_required": [
        "Workshop Platform Adapter 对 top-level 与 data 历史字段、状态别名、优先级和待办关联的行为测试",
        "Renderer 对已关联反馈隐藏或禁用优先级与重复转待办的回归测试",
        "相关 ArcOrbit 检查通过且不扩宽 V2、凭据或通用网络 IPC 边界"
      ],
      "resolution": {
        "id": "GAP-feedback-v1-record-compatibility",
        "status": "resolved",
        "outcome": "ArcOrbit 已兼容参考控制台和历史 Feedback V1 的关联、状态及优先级字段，并阻止已关联反馈重复转待办或继续修改反馈优先级。",
        "reason": "Adapter、Coordinator 与 Renderer 的实现及回归测试覆盖了 Gap 的全部证据要求；完整 ArcOrbit 检查通过。",
        "evidence": [
          "runtime/arcorbit/src/workshop-platform-adapter.mjs:232",
          "runtime/arcorbit/src/platform-coordinator.mjs:297",
          "runtime/arcorbit/desktop/renderer/renderer.js:886",
          "runtime/arcorbit/test/workshop-platform-adapter.test.mjs:47",
          "runtime/arcorbit/test/platform-coordinator.test.mjs:150",
          "runtime/arcorbit/test/desktop-renderer.test.mjs:51",
          "Verification: targeted ArcOrbit tests — 24 passed, 0 failed",
          "Verification: npm run check — 254 tests, 251 passed, 3 skipped, 0 failed",
          "Verification: git diff --check — passed"
        ],
        "occurred_at": "2026-08-22T19:07:15.441Z"
      }
    },
    {
      "id": "GAP-feedback-v2-management-contract",
      "status": "resolved",
      "goal": "取得并验证目标 Workshop 环境中开发者侧 Feedback V2 的服务端路由、认证授权、消息/附件、通知/已读、忽略和原子转待办契约，或由权威方确认这些能力在目标环境不可用。",
      "reason": "参考前端客户端代码展示条件请求形状，但当前仓库没有服务端实现证据；ArcOrbit 不能据此静默启用受信管理 adapter。",
      "derived_from": [
        "FACT-feedback-v2-management-boundary",
        "IMPACT-feedback-product-capability-parity",
        "IMPACT-feedback-realization-gap"
      ],
      "blocked_by": [],
      "priority_basis": {
        "blocking": "阻塞 ArcOrbit 内双向消息、回复附件、未读处理和 V2 原子流转。",
        "uncertainty": "高；缺少服务端实现、权限和目标环境验证。",
        "risk": "错误启用会绕过 restricted adapter 边界或提供不可工作的 UI。",
        "user_impact": "中高；需要持续沟通的反馈仍可能依赖网页端。"
      },
      "responsibility": "external",
      "evidence_required": [
        "权威服务端 API 文档或实现代码",
        "带真实 Workshop 身份与权限的目标环境成功/拒绝/错误行为证据",
        "消息附件的受控上传与访问边界",
        "通知读取与已读副作用、忽略和原子转待办语义"
      ],
      "resolution": {
        "id": "GAP-feedback-v2-management-contract",
        "status": "resolved",
        "outcome": "Workshop-Feedbacks 前端客户端代码被接受为 ArcOrbit Workset Feedback 开发者管理 V2 的实现契约，不再要求真实环境预验证。",
        "reason": "operator 明确设定证据充分性；前端 client、条件开关和会话组件覆盖消息、附件、通知/已读、忽略与原子转待办请求形状。",
        "evidence": [
          "Current operator input, 2026-08-23",
          "../../hoewo/Workshop-Feedbacks/webapps/feedback-console-web/src/lib/api/feedbackV2Client.ts",
          "../../hoewo/Workshop-Feedbacks/webapps/feedback-console-web/src/hooks/useFeedbacks.ts",
          "../../hoewo/Workshop-Feedbacks/webapps/feedback-console-web/src/components/features/FeedbackConversationPanel.tsx",
          "arckit/spec/agentic-software-development/arcorbit-platform-capabilities.md:300",
          "arckit/interaction/platform-workspace/interaction.md:23",
          "arckit/tech/arcorbit/platform-composition-solution.md:137"
        ],
        "occurred_at": "2026-08-22T20:08:45.921Z"
      }
    },
    {
      "id": "GAP-feedback-v1-link-recovery",
      "status": "resolved",
      "goal": "当 feedback.to_task 已创建 Task 但 Feedback 关联写回失败时，ArcOrbit 提供只复用已返回 task_id 重试关联的受限恢复动作，且不会再次创建 Task。",
      "reason": "当前 partial_result 能揭示部分成功，但用户缺少安全完成关联的操作，重新执行可能创建重复待办。",
      "derived_from": [
        "FACT-feedback-v1-workbench-current-coverage-corrected",
        "IMPACT-feedback-v1-link-recovery-interaction",
        "IMPACT-feedback-v1-link-recovery-risk"
      ],
      "blocked_by": [],
      "priority_basis": {
        "blocking": "阻塞部分失败场景的完整自助恢复。",
        "uncertainty": "低；失败边界和所需 association-only 动作清晰。",
        "risk": "错误重试可能重复创建待办或关联错误 Task。",
        "user_impact": "中高；影响用户能否完全脱离网页端并信任失败恢复。"
      },
      "responsibility": "agent",
      "evidence_required": [
        "Platform Coordinator 提供只更新 Feedback 关联且不创建 Task 的受限动作与输入验证",
        "Renderer 在 partial_result 中保留 task_id 并提供明确的仅重试关联操作",
        "关联重试成功、失败、无效 Task/Feedback 及绝不重复创建 Task 的行为测试",
        "完整 ArcOrbit 检查通过且不扩宽 V2、凭据或通用网络 IPC 边界"
      ],
      "resolution": {
        "id": "GAP-feedback-v1-link-recovery",
        "status": "resolved",
        "outcome": "ArcOrbit 保留已创建 task_id，并提供只更新 Feedback 关联且不创建第二个 Task 的恢复动作。",
        "reason": "实现和测试覆盖全部证据要求。",
        "evidence": [
          "runtime/arcorbit/src/platform-coordinator.mjs:286",
          "runtime/arcorbit/desktop/renderer/renderer.js:1247",
          "runtime/arcorbit/test/platform-coordinator.test.mjs:178",
          "Verification: npm run check — 257 tests, 254 passed, 3 skipped, 0 failed"
        ],
        "occurred_at": "2026-08-22T19:54:36.381Z"
      }
    },
    {
      "id": "GAP-feedback-v2-management-implementation",
      "status": "resolved",
      "goal": "在 ArcOrbit 的 restricted Workshop Platform Adapter、Platform Coordinator、typed IPC 和 Feedback Renderer 中实现已接受的开发者管理 V2 契约，使开发者能够处理消息与回复附件、未读/已读、专用忽略和服务端原子转待办，且不使用 ArcOrbit 产品反馈 SDK V2。",
      "reason": "本轮只接受了实现前置契约；实际软件仍只有 V1 管理能力，尚不能替代网页版完成持续沟通和 V2 原子流转。",
      "derived_from": [
        "FACT-feedback-v2-management-boundary",
        "IMPACT-feedback-product-capability-parity",
        "IMPACT-feedback-realization-gap"
      ],
      "blocked_by": [],
      "priority_basis": {
        "blocking": "阻塞无需网页版完成开发者反馈沟通和原子流转。",
        "uncertainty": "中；请求形状已明确，现有 ArcOrbit adapter/IPC/Renderer 需要扩展。",
        "risk": "错误实现可能泄露凭据、扩宽通用网络 IPC、丢失草稿或把产品反馈 SDK 与 Workset 管理混用。",
        "user_impact": "高；直接覆盖网页版最新核心日常处理能力。"
      },
      "responsibility": "agent",
      "evidence_required": [
        "受限 Platform Adapter 和 Coordinator 覆盖消息、附件、通知/已读、忽略与原子转待办，Renderer 不接触 URL、header 或凭据",
        "Feedback Renderer 提供消息时间线、文本/附件回复、未读提示与逐动作错误恢复",
        "V2 项目开关、成功、401/403/404、网络失败、附件失败、已读失败和原子流转行为测试",
        "证明 Workset Feedback 不调用产品反馈 SDK WebView、Project 107 或 bundled API Key",
        "完整 ArcOrbit 检查通过且不回归 V1 管理和关联恢复"
      ],
      "resolution": {
        "id": "GAP-feedback-v2-management-implementation",
        "status": "resolved",
        "outcome": "ArcOrbit Workset Feedback 已实现开发者管理 V2：项目门禁列表、消息时间线、文本/附件回复、未读/已读、专用忽略、更新、删除和服务端原子转待办均通过受限 main-process 能力提供。",
        "reason": "固定 V2 路由、Coordinator 逐功能状态、专用 IPC、Renderer 恢复语义和完整自动化检查覆盖全部证据要求。",
        "evidence": [
          "runtime/arcorbit/src/workshop-platform-adapter.mjs:103",
          "runtime/arcorbit/src/platform-coordinator.mjs:20",
          "runtime/arcorbit/desktop/renderer/renderer.js:929",
          "runtime/arcorbit/test/workshop-platform-adapter.test.mjs:5",
          "runtime/arcorbit/test/platform-coordinator.test.mjs:244",
          "runtime/arcorbit/test/desktop-renderer.test.mjs:221",
          "Verification: npm run check -- --test-reporter=dot — 265 tests, 262 passed, 3 skipped, 0 failed",
          "Verification: git diff --check — passed"
        ],
        "occurred_at": "2026-08-22T20:30:36.835Z"
      }
    },
    {
      "id": "CASE-20260822-004:review-finding:CR-feedback-v2-rollout-default",
      "status": "resolved",
      "goal": "Resolve review finding: Feedback V2 production defaults use '*' when rollout environment variables are absent, while the accepted frontend contract defaults to an empty explicit project allowlist. This silently attempts V2 for V1-only projects and can mark otherwise healthy workspaces degraded.",
      "reason": "excess found by completion review",
      "derived_from": [
        "completion_review",
        "content_revision:5"
      ],
      "blocked_by": [],
      "priority_basis": {
        "blocking": "high",
        "risk": "high"
      },
      "responsibility": "agent",
      "evidence_required": [
        "runtime/arcorbit/src/task-source-adapter.mjs",
        "runtime/arcorbit/src/task-source-adapter.mjs:31",
        "../../hoewo/Workshop-Feedbacks/webapps/feedback-console-web/src/lib/api/feedbackV2Client.ts:23"
      ],
      "resolution": {
        "id": "CASE-20260822-004:review-finding:CR-feedback-v2-rollout-default",
        "status": "resolved",
        "outcome": "Feedback V2 工作流和通知在缺少环境配置时均保持关闭；只有显式项目 allowlist 或显式 '*' 才启用。",
        "reason": "task source 默认值已与参考前端契约对齐，行为测试同时证明默认关闭和显式通配启用，完整 ArcOrbit 检查无回归。",
        "evidence": [
          "runtime/arcorbit/src/task-source-adapter.mjs:38",
          "runtime/arcorbit/test/task-source-adapter.test.mjs:232",
          "../../hoewo/Workshop-Feedbacks/webapps/feedback-console-web/src/lib/api/feedbackV2Client.ts:23",
          "Verification: targeted Feedback tests — 56 passed, 0 failed",
          "Verification: npm run check -- --test-reporter=dot — 267 tests, 264 passed, 3 skipped, 0 failed",
          "Verification: git diff --check — passed"
        ],
        "occurred_at": "2026-08-22T20:46:12.949Z"
      }
    },
    {
      "id": "CASE-20260822-004:review-finding:CR-feedback-v2-ipc-error-contract",
      "status": "resolved",
      "goal": "Resolve review finding: Renderer 的 401 登录回收与 404 事实刷新依赖 ipcRenderer.invoke rejection 上的自定义 status/code 字段，但 main/preload 没有定义 typed success/error envelope，现有测试也只做静态字符串检查，没有执行这些恢复分支。",
      "reason": "omission found by completion review",
      "derived_from": [
        "completion_review",
        "content_revision:5"
      ],
      "blocked_by": [],
      "priority_basis": {
        "blocking": "high",
        "risk": "high"
      },
      "responsibility": "agent",
      "evidence_required": [
        "runtime/arcorbit/desktop/main.mjs",
        "runtime/arcorbit/desktop/preload.cjs",
        "runtime/arcorbit/desktop/renderer/renderer.js",
        "runtime/arcorbit/test/desktop-renderer.test.mjs",
        "runtime/arcorbit/desktop/preload.cjs:50",
        "runtime/arcorbit/desktop/renderer/renderer.js:1393",
        "runtime/arcorbit/test/desktop-renderer.test.mjs:221"
      ],
      "resolution": {
        "id": "CASE-20260822-004:review-finding:CR-feedback-v2-ipc-error-contract",
        "status": "resolved",
        "outcome": "全部专用 Feedback V2 IPC 通过 feedback-v2-ipc-result/v1 envelope 返回，preload 校验 envelope 并重建受控 code/status；Renderer 的 401 登录门禁和 404 事实刷新已有可执行行为测试。",
        "reason": "共享 IPC contract、main handler、preload unwrap 和 Renderer 分支测试共同覆盖 finding 的实现与证据要求，完整 ArcOrbit 检查无回归。",
        "evidence": [
          "runtime/arcorbit/desktop/feedback-v2-ipc.cjs:1",
          "runtime/arcorbit/desktop/main.mjs:350",
          "runtime/arcorbit/desktop/preload.cjs:1",
          "runtime/arcorbit/test/desktop-renderer.test.mjs:258",
          "Verification: targeted Feedback tests — 31 passed, 0 failed",
          "Verification: npm run check -- --test-reporter=dot — 266 tests, 263 passed, 3 skipped, 0 failed",
          "Verification: git diff --check — passed"
        ],
        "occurred_at": "2026-08-22T20:42:30.041Z"
      }
    },
    {
      "id": "CASE-20260822-004:review-finding:CR-feedback-v2-renderer-url-boundary",
      "status": "resolved",
      "goal": "Resolve review finding: Feedback V2 attachment normalization includes a direct HTTPS url field in the message object returned to Renderer, contradicting the accepted boundary that Workset Feedback Renderer must not receive attachment URLs; the structural IPC test does not assert the returned payload shape.",
      "reason": "error found by completion review",
      "derived_from": [
        "completion_review",
        "content_revision:5"
      ],
      "blocked_by": [],
      "priority_basis": {
        "blocking": "high",
        "risk": "high"
      },
      "responsibility": "agent",
      "evidence_required": [
        "runtime/arcorbit/src/workshop-platform-adapter.mjs",
        "runtime/arcorbit/test/workshop-platform-adapter.test.mjs",
        "runtime/arcorbit/test/desktop-renderer.test.mjs",
        "runtime/arcorbit/src/workshop-platform-adapter.mjs:436",
        "runtime/arcorbit/src/workshop-platform-adapter.mjs:443",
        "FACT-feedback-v2-management-boundary"
      ],
      "resolution": {
        "id": "CASE-20260822-004:review-finding:CR-feedback-v2-renderer-url-boundary",
        "status": "resolved",
        "outcome": "Feedback V2 message attachment 只向 Renderer 投影 id、type、object_key 和安全显示元数据，不再投影直接 URL；附件仍通过受限 main-process action 即时取得签名 URL 后打开。",
        "reason": "Adapter payload normalization 已删除 URL，行为测试以包含 HTTPS URL 的服务端响应证明其不会穿过边界，完整 ArcOrbit 检查无回归。",
        "evidence": [
          "runtime/arcorbit/src/workshop-platform-adapter.mjs:436",
          "runtime/arcorbit/test/workshop-platform-adapter.test.mjs:13",
          "runtime/arcorbit/test/workshop-platform-adapter.test.mjs:33",
          "runtime/arcorbit/desktop/renderer/renderer.js:955",
          "runtime/arcorbit/desktop/main.mjs:375",
          "Verification: targeted Feedback tests — 30 passed, 0 failed",
          "Verification: npm run check -- --test-reporter=dot — 265 tests, 262 passed, 3 skipped, 0 failed",
          "Verification: git diff --check — passed"
        ],
        "occurred_at": "2026-08-22T20:38:31.717Z"
      }
    },
    {
      "id": "CASE-20260822-004:review-finding:CR-feedback-v2-notification-read-state",
      "status": "resolved",
      "goal": "Resolve review finding: Feedback V2 notifications rollout 与工作流 rollout 独立，Coordinator 会把 notifications/mark_read 标为 unavailable；但 Renderer 加载任何 V2 会话后仍无条件调用 markFeedbackV2Read，导致合法的 notifications-disabled 项目显示虚假的“已读回写失败”。成功标记已读后 Renderer 也没有清除当前 workspace 的 unread_count/unread_feedback_ids，因此未读数量和圆点会保持陈旧直到后续完整刷新。现有 Renderer 测试只检查方法存在及 401/404 恢复，没有执行这两个 read-state 分支。",
      "reason": "omission found by completion review",
      "derived_from": [
        "completion_review",
        "content_revision:8"
      ],
      "blocked_by": [],
      "priority_basis": {
        "blocking": "high",
        "risk": "high"
      },
      "responsibility": "agent",
      "evidence_required": [
        "runtime/arcorbit/src/platform-coordinator.mjs",
        "runtime/arcorbit/desktop/renderer/renderer.js",
        "runtime/arcorbit/test/desktop-renderer.test.mjs",
        "runtime/arcorbit/src/platform-coordinator.mjs:27",
        "runtime/arcorbit/src/platform-coordinator.mjs:35",
        "runtime/arcorbit/desktop/renderer/renderer.js:965",
        "runtime/arcorbit/desktop/renderer/renderer.js:975",
        "runtime/arcorbit/test/desktop-renderer.test.mjs:225"
      ],
      "resolution": {
        "id": "CASE-20260822-004:review-finding:CR-feedback-v2-notification-read-state",
        "status": "resolved",
        "outcome": "Renderer 现在尊重独立 mark_read capability：notifications-disabled 时跳过已读回写且不显示虚假失败；成功回写时按 marked_count 更新 workspace 未读数量并移除当前 feedback 的未读标识。",
        "reason": "Renderer 实现和可执行行为测试覆盖 capability 禁用及成功 read-state 两个分支，定向与完整 ArcOrbit 检查均无回归。",
        "evidence": [
          "runtime/arcorbit/src/platform-coordinator.mjs:27",
          "runtime/arcorbit/src/platform-coordinator.mjs:35",
          "runtime/arcorbit/desktop/renderer/renderer.js:929",
          "runtime/arcorbit/desktop/renderer/renderer.js:983",
          "runtime/arcorbit/test/desktop-renderer.test.mjs:293",
          "Verification: targeted Feedback tests — 59 passed, 0 failed",
          "Verification: npm run check -- --test-reporter=dot — 268 tests, 265 passed, 3 skipped, 0 failed",
          "Verification: git diff --check — passed"
        ],
        "occurred_at": "2026-08-22T20:55:16.765Z"
      }
    },
    {
      "id": "CASE-20260822-004:review-finding:CR-feedback-v2-read-state-list-rerender",
      "status": "resolved",
      "goal": "Resolve review finding: 成功 mark-read 后 applyFeedbackReadState 已更新 workspace 的 unread_count/unread_feedback_ids，但 loadFeedbackConversation 最终只调用 renderFeedbackInspector。列表汇总与当前反馈的未读圆点只由 renderPlatformFeedback 生成，因此用户当前看到的列表 DOM 仍会保持陈旧，直到另一次列表重绘或完整刷新。新增测试只断言内存 state 和 renderFeedbackInspector 调用次数，没有执行或断言列表汇总与圆点的可见更新。",
      "reason": "omission found by completion review",
      "derived_from": [
        "completion_review",
        "content_revision:9"
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
        "runtime/arcorbit/desktop/renderer/renderer.js:870",
        "runtime/arcorbit/desktop/renderer/renderer.js:875",
        "runtime/arcorbit/desktop/renderer/renderer.js:987",
        "runtime/arcorbit/desktop/renderer/renderer.js:998",
        "runtime/arcorbit/test/desktop-renderer.test.mjs:319",
        "runtime/arcorbit/test/desktop-renderer.test.mjs:338",
        "runtime/arcorbit/test/desktop-renderer.test.mjs:340"
      ],
      "resolution": {
        "id": "CASE-20260822-004:review-finding:CR-feedback-v2-read-state-list-rerender",
        "status": "resolved",
        "outcome": "成功 mark-read 后 Renderer 立即执行完整 Feedback 列表重绘，使未读汇总和当前反馈圆点与更新后的 workspace read state 同步；notifications-disabled 分支仍不触发回写或列表变更。",
        "reason": "实现以成功 read 为唯一列表重绘门禁；可执行测试运行真实 renderPlatformFeedback，直接断言禁用分支保持原 DOM、成功分支更新汇总并移除圆点，定向与完整检查均无回归。",
        "evidence": [
          "runtime/arcorbit/desktop/renderer/renderer.js:978",
          "runtime/arcorbit/desktop/renderer/renderer.js:989",
          "runtime/arcorbit/desktop/renderer/renderer.js:1000",
          "runtime/arcorbit/test/desktop-renderer.test.mjs:293",
          "runtime/arcorbit/test/desktop-renderer.test.mjs:350",
          "runtime/arcorbit/test/desktop-renderer.test.mjs:367",
          "runtime/arcorbit/test/desktop-renderer.test.mjs:368",
          "Verification: targeted Feedback tests — 59 passed, 0 failed",
          "Verification: npm run check -- --test-reporter=dot — 268 tests, 265 passed, 3 skipped, 0 failed",
          "Verification: git diff --check — passed"
        ],
        "occurred_at": "2026-08-22T21:03:11.446Z"
      }
    }
  ],
  "content_revision": 10,
  "completion_review": {
    "status": "clean",
    "policy": {
      "initial_max_cycles": 10,
      "source": "runtime/arcorbit/config/case-policy.json",
      "snapshotted_at": "2026-08-22T18:53:22.456Z"
    },
    "additional_cycles_authorized": 0,
    "cycle_count": 4,
    "reviewed_content_revision": 10,
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
        "content_revision": 5,
        "dimensions": {
          "implementation_correctness": "findings",
          "problem_resolution": "findings",
          "verification_credibility": "findings",
          "regression_risk": "findings",
          "minimality": "findings"
        },
        "finding_ids": [
          "CR-feedback-v2-rollout-default",
          "CR-feedback-v2-ipc-error-contract",
          "CR-feedback-v2-renderer-url-boundary"
        ],
        "evidence": [
          "runtime/arcorbit/src/task-source-adapter.mjs:31",
          "../../hoewo/Workshop-Feedbacks/webapps/feedback-console-web/src/lib/api/feedbackV2Client.ts:23",
          "runtime/arcorbit/desktop/renderer/renderer.js:1393",
          "runtime/arcorbit/src/workshop-platform-adapter.mjs:443",
          "Verification: npm run check -- --test-reporter=dot — 265 tests, 262 passed, 3 skipped, 0 failed",
          "Verification: git diff --check — passed"
        ],
        "occurred_at": "2026-08-22T20:35:06.787Z"
      },
      {
        "cycle": 2,
        "autonomous_cycle": 2,
        "reviewer": "agent",
        "outcome": "findings",
        "content_revision": 8,
        "dimensions": {
          "implementation_correctness": "findings",
          "problem_resolution": "findings",
          "verification_credibility": "findings",
          "regression_risk": "findings",
          "minimality": "clean"
        },
        "finding_ids": [
          "CR-feedback-v2-notification-read-state"
        ],
        "evidence": [
          "runtime/arcorbit/src/platform-coordinator.mjs:27",
          "runtime/arcorbit/src/platform-coordinator.mjs:35",
          "runtime/arcorbit/desktop/renderer/renderer.js:965",
          "runtime/arcorbit/desktop/renderer/renderer.js:975",
          "runtime/arcorbit/test/desktop-renderer.test.mjs:225",
          "Verification: npm run check -- --test-reporter=dot — 267 tests, 264 passed, 3 skipped, 0 failed",
          "Verification: git diff --check — passed"
        ],
        "occurred_at": "2026-08-22T20:50:03.817Z"
      },
      {
        "cycle": 3,
        "autonomous_cycle": 3,
        "reviewer": "agent",
        "outcome": "findings",
        "content_revision": 9,
        "dimensions": {
          "implementation_correctness": "findings",
          "problem_resolution": "findings",
          "verification_credibility": "findings",
          "regression_risk": "findings",
          "minimality": "clean"
        },
        "finding_ids": [
          "CR-feedback-v2-read-state-list-rerender"
        ],
        "evidence": [
          "runtime/arcorbit/desktop/renderer/renderer.js:870",
          "runtime/arcorbit/desktop/renderer/renderer.js:875",
          "runtime/arcorbit/desktop/renderer/renderer.js:987",
          "runtime/arcorbit/desktop/renderer/renderer.js:998",
          "runtime/arcorbit/test/desktop-renderer.test.mjs:319",
          "runtime/arcorbit/test/desktop-renderer.test.mjs:338",
          "runtime/arcorbit/test/desktop-renderer.test.mjs:340",
          "Verification: targeted Feedback tests — 59 passed, 0 failed",
          "Verification: npm run check -- --test-reporter=dot — 268 tests, 265 passed, 3 skipped, 0 failed",
          "Verification: git diff --check — passed"
        ],
        "occurred_at": "2026-08-22T20:58:14.666Z"
      },
      {
        "cycle": 4,
        "autonomous_cycle": 4,
        "reviewer": "agent",
        "outcome": "clean",
        "content_revision": 10,
        "dimensions": {
          "implementation_correctness": "clean",
          "problem_resolution": "clean",
          "verification_credibility": "clean",
          "regression_risk": "clean",
          "minimality": "clean"
        },
        "finding_ids": [],
        "evidence": [
          "runtime/arcorbit/src/workshop-platform-adapter.mjs:103",
          "runtime/arcorbit/src/platform-coordinator.mjs:20",
          "runtime/arcorbit/desktop/feedback-v2-ipc.cjs:1",
          "runtime/arcorbit/desktop/preload.cjs:50",
          "runtime/arcorbit/desktop/renderer/renderer.js:857",
          "runtime/arcorbit/desktop/renderer/renderer.js:929",
          "runtime/arcorbit/desktop/renderer/renderer.js:974",
          "runtime/arcorbit/desktop/renderer/renderer.js:1000",
          "runtime/arcorbit/test/task-source-adapter.test.mjs:232",
          "runtime/arcorbit/test/workshop-platform-adapter.test.mjs:5",
          "runtime/arcorbit/test/platform-coordinator.test.mjs:244",
          "runtime/arcorbit/test/desktop-renderer.test.mjs:225",
          "runtime/arcorbit/test/desktop-renderer.test.mjs:258",
          "runtime/arcorbit/test/desktop-renderer.test.mjs:293",
          "Verification: targeted Feedback tests — 59 passed, 0 failed",
          "Verification: npm run check -- --test-reporter=dot — 268 tests, 265 passed, 3 skipped, 0 failed",
          "Verification: git diff --check — passed"
        ],
        "occurred_at": "2026-08-22T21:06:33.115Z"
      }
    ],
    "evidence": [
      "runtime/arcorbit/src/task-source-adapter.mjs:31",
      "../../hoewo/Workshop-Feedbacks/webapps/feedback-console-web/src/lib/api/feedbackV2Client.ts:23",
      "runtime/arcorbit/desktop/renderer/renderer.js:1393",
      "runtime/arcorbit/src/workshop-platform-adapter.mjs:443",
      "Verification: npm run check -- --test-reporter=dot — 265 tests, 262 passed, 3 skipped, 0 failed",
      "Verification: git diff --check — passed",
      "runtime/arcorbit/src/platform-coordinator.mjs:27",
      "runtime/arcorbit/src/platform-coordinator.mjs:35",
      "runtime/arcorbit/desktop/renderer/renderer.js:965",
      "runtime/arcorbit/desktop/renderer/renderer.js:975",
      "runtime/arcorbit/test/desktop-renderer.test.mjs:225",
      "Verification: npm run check -- --test-reporter=dot — 267 tests, 264 passed, 3 skipped, 0 failed",
      "runtime/arcorbit/desktop/renderer/renderer.js:870",
      "runtime/arcorbit/desktop/renderer/renderer.js:875",
      "runtime/arcorbit/desktop/renderer/renderer.js:987",
      "runtime/arcorbit/desktop/renderer/renderer.js:998",
      "runtime/arcorbit/test/desktop-renderer.test.mjs:319",
      "runtime/arcorbit/test/desktop-renderer.test.mjs:338",
      "runtime/arcorbit/test/desktop-renderer.test.mjs:340",
      "Verification: targeted Feedback tests — 59 passed, 0 failed",
      "Verification: npm run check -- --test-reporter=dot — 268 tests, 265 passed, 3 skipped, 0 failed",
      "runtime/arcorbit/src/workshop-platform-adapter.mjs:103",
      "runtime/arcorbit/src/platform-coordinator.mjs:20",
      "runtime/arcorbit/desktop/feedback-v2-ipc.cjs:1",
      "runtime/arcorbit/desktop/preload.cjs:50",
      "runtime/arcorbit/desktop/renderer/renderer.js:857",
      "runtime/arcorbit/desktop/renderer/renderer.js:929",
      "runtime/arcorbit/desktop/renderer/renderer.js:974",
      "runtime/arcorbit/desktop/renderer/renderer.js:1000",
      "runtime/arcorbit/test/task-source-adapter.test.mjs:232",
      "runtime/arcorbit/test/workshop-platform-adapter.test.mjs:5",
      "runtime/arcorbit/test/platform-coordinator.test.mjs:244",
      "runtime/arcorbit/test/desktop-renderer.test.mjs:258",
      "runtime/arcorbit/test/desktop-renderer.test.mjs:293"
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
      "goal": "对照 ArcOrbit 与 Workshop-Feedbacks 的 Feedback 页面、客户端契约、持久规格和相关测试，建立当前能力、确定缺口与受限能力的可追溯基线。",
      "outcome": "completed",
      "gap_selection": {
        "mode": "candidate",
        "basis": "GAP-feedback-core-parity-baseline 是唯一 ready 的 Case Gap，直接阻塞用户要求的 Feedback 日常工作替代目标；其余 Project Gap 均需另建 Case且与当前目标没有直接依赖。",
        "snapshot_token": "14707bf337f417799ef93424c51e520b87456b9482110518024f1eee2d1e7339",
        "selected_ref": "case-gap:CASE-20260822-004:GAP-feedback-core-parity-baseline",
        "comparison_summary": "选择 Feedback 差距基线；暂缓四个无直接关系且需要新 Case 的 Project Gap。调查中发现的 V1 兼容实现和 V2 契约义务依赖本轮新事实，记录为 blocked fresh work，不能在本轮继续执行。",
        "fresh_discovery_summary": "源码对照发现两个下游结果：ArcOrbit V1 归一化与动作门禁需要补齐；V2 管理能力需要权威服务契约或真实环境验证。二者均等待本 transition 接受后由 fresh snapshot 重新比较。",
        "considered": [
          {
            "ref": "project-gap:GAP-agent-scenario-evaluation",
            "source": "persisted",
            "eligibility": "case_required",
            "disposition": "deferred",
            "priority_basis": {
              "blocking": "不阻塞当前 Feedback 工作。",
              "uncertainty": "场景验证仍有高不确定性。",
              "risk": "属于协议质量风险。",
              "user_impact": "低于当前明确的 Feedback 日常使用缺口。"
            },
            "reason": "需要独立 Case，且不建立当前 Feedback 实现范围。"
          },
          {
            "ref": "project-gap:GAP-runtime-resilience-and-adapters",
            "source": "persisted",
            "eligibility": "case_required",
            "disposition": "deferred",
            "priority_basis": {
              "blocking": "不阻塞当前基线调查。",
              "uncertainty": "存在长期 Runtime 韧性事项。",
              "risk": "高，但与当前 Feedback V1 工作流无直接依赖。",
              "user_impact": "低于当前明确反馈目标。"
            },
            "reason": "需要独立 Case，当前不选择。"
          },
          {
            "ref": "project-gap:GAP-security-real-project-validation",
            "source": "persisted",
            "eligibility": "case_required",
            "disposition": "deferred",
            "priority_basis": {
              "blocking": "不阻塞本轮只读契约对照。",
              "uncertainty": "真实权限项目证据仍缺失。",
              "risk": "高。",
              "user_impact": "当前用户首先需要 Feedback 核心能力范围清晰。"
            },
            "reason": "需要真实权限项目和独立 Case。"
          },
          {
            "ref": "project-gap:GAP-cross-record-audit",
            "source": "persisted",
            "eligibility": "case_required",
            "disposition": "deferred",
            "priority_basis": {
              "blocking": "不阻塞当前 Feedback 差距基线。",
              "uncertainty": "跨记录一致性仍需验证。",
              "risk": "高。",
              "user_impact": "低于当前产品功能缺口。"
            },
            "reason": "需要独立 Case，暂缓。"
          },
          {
            "ref": "case-gap:CASE-20260822-004:GAP-feedback-core-parity-baseline",
            "source": "persisted",
            "eligibility": "ready",
            "disposition": "selected",
            "priority_basis": {
              "blocking": "后续实现对象、契约和验收方式都依赖该基线。",
              "uncertainty": "两端字段、工作流和 V1/V2 边界尚未形成接受事实。",
              "risk": "错误推断 V2 或漏识别已转待办记录会产生错误操作。",
              "user_impact": "直接决定用户能否摆脱 Feedback 网页端。"
            },
            "reason": "唯一直接承接当前用户目标且无依赖的 ready Gap。"
          },
          {
            "ref": "fresh:GAP-feedback-v1-record-compatibility",
            "source": "fresh",
            "eligibility": "blocked",
            "disposition": "deferred",
            "priority_basis": {
              "blocking": "V1 日常处理正确性依赖该结果。",
              "uncertainty": "实施前需要先接受本轮字段对照事实。",
              "risk": "误判状态或重复转待办。",
              "user_impact": "高。"
            },
            "reason": "由本轮新发现事实产生，必须等待 closeout 和 fresh-read。"
          },
          {
            "ref": "fresh:GAP-feedback-v2-management-contract",
            "source": "fresh",
            "eligibility": "blocked",
            "disposition": "deferred",
            "priority_basis": {
              "blocking": "阻塞消息回复、回复附件和通知能力。",
              "uncertainty": "目标环境服务端与权限证据缺失。",
              "risk": "直接照搬前端请求会违反受限 adapter 边界。",
              "user_impact": "影响需要双向沟通的日常反馈。"
            },
            "reason": "依赖本轮才建立的 V2 契约事实，且需要外部权威证据。"
          }
        ]
      },
      "selected_gap": {
        "id": "GAP-feedback-core-parity-baseline",
        "responsibility": "agent",
        "goal": "建立 ArcOrbit Feedback 与 Workshop-Feedbacks 前端之间有证据的核心日常处理能力、交互状态和服务契约差距基线，并明确下一项最小可实施验收范围。",
        "reason": "列表、筛选、详情、优先级、忽略、删除、附件、消息/回复、通知、状态推进和转待办等能力分属 V1、可选 V2 与不同权限边界；未经对照确认会改变后续实现对象、风险和验收方式。",
        "derived_from": [
          "FACT-feedback-daily-work-parity-required",
          "IMPACT-feedback-product-capability-parity",
          "IMPACT-feedback-realization-gap"
        ],
        "blocked_by": [],
        "priority_basis": {
          "blocking": "后续实现范围和验收方式依赖该差距基线。",
          "uncertainty": "ArcOrbit 已覆盖能力、参考前端核心流程及可用服务契约尚未形成逐项映射。",
          "risk": "误把 V2、权限或附件能力当作已可用契约会制造不可工作的界面或破坏安全边界。",
          "user_impact": "直接决定用户能否在 ArcOrbit 内完成日常反馈处理。"
        },
        "evidence_required": [
          "ArcOrbit Renderer、Platform Coordinator、Workshop Platform Adapter 与测试中的现有 Feedback 能力清单",
          "Workshop-Feedbacks 核心反馈管理页面、hooks/client 和用户动作清单",
          "V1、可选 V2、权限、附件、通知与转待办契约的支持/缺口映射",
          "按日常使用价值排序且可独立验收的下一实现范围"
        ]
      },
      "planned_transition": {
        "goal": "对照 ArcOrbit 与 Workshop-Feedbacks 的 Feedback 页面、客户端契约、持久规格和相关测试，建立当前能力、确定缺口与受限能力的可追溯基线。",
        "expected_state_change": "解决差距基线 Gap，接受 V1 当前覆盖、V1 兼容缺口和 V2 契约边界事实，并记录等待 fresh-read 的结果型义务。"
      },
      "accepted_state_delta": {
        "resolved_gap": {
          "id": "GAP-feedback-core-parity-baseline",
          "status": "resolved",
          "outcome": "已建立 ArcOrbit V1 现状、参考控制台 V1/V2 能力、服务边界和下一最小实施范围的证据基线。",
          "reason": "源代码、持久产品/交互/技术事实和相关测试共同覆盖了 Gap 的四项证据要求。",
          "evidence": [
            "runtime/arcorbit/desktop/renderer/index.html",
            "runtime/arcorbit/desktop/renderer/renderer.js",
            "runtime/arcorbit/src/platform-coordinator.mjs",
            "runtime/arcorbit/src/workshop-platform-adapter.mjs",
            "../../hoewo/Workshop-Feedbacks/webapps/feedback-console-web/src/components/features/FeedbackManagementDialog.tsx",
            "../../hoewo/Workshop-Feedbacks/webapps/feedback-console-web/src/components/features/FeedbackConversationPanel.tsx",
            "../../hoewo/Workshop-Feedbacks/webapps/feedback-console-web/src/lib/api/feedbackV2Client.ts",
            "Verification: node --test test/workshop-platform-adapter.test.mjs test/platform-coordinator.test.mjs test/desktop-renderer.test.mjs — 23 passed, 0 failed"
          ]
        },
        "facts_added": [
          {
            "id": "FACT-feedback-v1-workbench-current-coverage",
            "revision": 1,
            "status": "accepted",
            "statement": "ArcOrbit Workset Feedback 已实现 V1 日常工作台主体：按 Workset/产品范围读取完整分页反馈，支持本地搜索、处理状态筛选、时间/优先级排序、稳定选择、详情与原附件打开，并提供优先级、忽略、刷新、权限门禁删除和可恢复的两步转待办。Renderer 不提供创建或编辑用户反馈原文。",
            "basis": "ArcOrbit Renderer、Platform Coordinator、Workshop Platform Adapter 与现有测试直接证明这些能力。",
            "evidence": [
              "runtime/arcorbit/desktop/renderer/index.html:121",
              "runtime/arcorbit/desktop/renderer/renderer.js:855",
              "runtime/arcorbit/desktop/renderer/renderer.js:880",
              "runtime/arcorbit/desktop/renderer/renderer.js:1194",
              "runtime/arcorbit/src/platform-coordinator.mjs:283",
              "runtime/arcorbit/src/workshop-platform-adapter.mjs:73",
              "runtime/arcorbit/test/desktop-renderer.test.mjs:29",
              "Verification: targeted ArcOrbit tests — 23 passed, 0 failed"
            ]
          },
          {
            "id": "FACT-feedback-v1-record-compatibility-gap",
            "revision": 1,
            "status": "accepted",
            "statement": "ArcOrbit 的 V1 归一化只把 data.priority 的精确 P1/P2/P3、data.ignored、data.task_id 和 data.task_state 投影为处理事实；参考控制台还兼容 top-level task_id/task_state/triage_status/status、data.converted_task_id、历史状态别名、数值或 ai_priority/priority_level，并在缺少优先级时使用 P2。当前差异会把部分网页端或历史记录误判为未关联/待处理，允许重复转待办；Renderer 还在已关联待办时保留优先级选择器，与既有交互规格不一致。",
            "basis": "两端归一化与详情动作代码逐项对照，持久规格同时明确兼容历史字段、缺省 P2 和已关联待办后不在反馈中调整优先级。",
            "evidence": [
              "runtime/arcorbit/src/workshop-platform-adapter.mjs:232",
              "runtime/arcorbit/src/workshop-platform-adapter.mjs:250",
              "runtime/arcorbit/desktop/renderer/renderer.js:889",
              "runtime/arcorbit/desktop/renderer/renderer.js:908",
              "../../hoewo/Workshop-Feedbacks/webapps/feedback-console-web/src/components/features/FeedbackManagementDialog.tsx:184",
              "../../hoewo/Workshop-Feedbacks/webapps/feedback-console-web/src/components/features/FeedbackManagementDialog.tsx:211",
              "../../hoewo/Workshop-Feedbacks/webapps/feedback-console-web/src/components/features/FeedbackManagementDialog.tsx:267",
              "arckit/spec/agentic-software-development/arcorbit-platform-capabilities.md:299",
              "arckit/interaction/platform-workspace/interaction.md"
            ]
          },
          {
            "id": "FACT-feedback-v2-management-boundary",
            "revision": 1,
            "status": "accepted",
            "statement": "参考控制台只在显式项目开关启用时使用 Feedback V2，增加开发者消息、回复附件上传/访问、未读通知与已读标记、专用忽略和服务端原子转待办。ArcOrbit 当前没有 Feedback V2 管理 adapter，Project 技术决策将其默认标记为 unavailable；在缺少权威服务端实现、权限和真实环境能力验证时，不能把参考前端客户端请求直接声明为 ArcOrbit 可用契约。当前下一最小可实施范围因此是先补齐 V1 记录兼容与动作状态正确性。",
            "basis": "参考控制台的条件开关及 V2 client 与 ArcOrbit 的持久技术方案、capability 投影和 restricted IPC 边界一致证明该结论。",
            "evidence": [
              "../../hoewo/Workshop-Feedbacks/webapps/feedback-console-web/src/hooks/useFeedbacks.ts",
              "../../hoewo/Workshop-Feedbacks/webapps/feedback-console-web/src/lib/api/feedbackV2Client.ts",
              "../../hoewo/Workshop-Feedbacks/webapps/feedback-console-web/src/components/features/FeedbackConversationPanel.tsx",
              "arckit/tech/arcorbit/platform-composition-solution.md:139",
              "arckit/tech/arcorbit/platform-composition-solution.md:244",
              "arckit/tech/arcorbit/platform-composition-solution.md:346",
              "runtime/arcorbit/src/platform-coordinator.mjs:165"
            ]
          }
        ],
        "facts_superseded": [],
        "impacts_added": [
          {
            "id": "IMPACT-feedback-interaction-parity",
            "fact_id": "FACT-feedback-v1-record-compatibility-gap",
            "fact_revision": 1,
            "target": {
              "kind": "software_decision",
              "ref": "experience_and_interaction",
              "revision": 28
            },
            "effect": "threatened",
            "reason": "当前实现可能错误显示处理状态、重复提供转待办，并在已关联待办后保留优先级修改，尚未完全兑现既有 Feedback 交互事实。",
            "gap_ids": [
              "GAP-feedback-v1-record-compatibility"
            ],
            "evidence": [
              "arckit/interaction/platform-workspace/interaction.md",
              "runtime/arcorbit/desktop/renderer/renderer.js:889",
              "runtime/arcorbit/src/workshop-platform-adapter.mjs:232"
            ]
          },
          {
            "id": "IMPACT-feedback-v2-boundary-upheld",
            "fact_id": "FACT-feedback-v2-management-boundary",
            "fact_revision": 1,
            "target": {
              "kind": "software_decision",
              "ref": "external_integrations",
              "revision": 6
            },
            "effect": "upheld",
            "reason": "调查确认参考前端 V2 是条件能力，ArcOrbit 继续默认禁用未验证的 V2 管理 adapter 是准确且必要的集成边界。",
            "gap_ids": [],
            "evidence": [
              "arckit/tech/arcorbit/platform-composition-solution.md:139",
              "../../hoewo/Workshop-Feedbacks/webapps/feedback-console-web/src/lib/api/feedbackV2Client.ts"
            ]
          },
          {
            "id": "IMPACT-feedback-v1-risk-evidence",
            "fact_id": "FACT-feedback-v1-record-compatibility-gap",
            "fact_revision": 1,
            "target": {
              "kind": "software_invariant",
              "ref": "material-risks-have-credible-evidence",
              "revision": null
            },
            "effect": "threatened",
            "reason": "现有测试证明结构和动作存在，但没有覆盖历史字段归一化、已转待办防重和关联后优先级门禁。",
            "gap_ids": [
              "GAP-feedback-v1-record-compatibility"
            ],
            "evidence": [
              "runtime/arcorbit/test/desktop-renderer.test.mjs",
              "runtime/arcorbit/test/workshop-platform-adapter.test.mjs"
            ]
          }
        ],
        "impacts_updated": [
          {
            "id": "IMPACT-feedback-product-capability-parity",
            "fact_id": "FACT-feedback-daily-work-parity-required",
            "fact_revision": 1,
            "target": {
              "kind": "software_decision",
              "ref": "product_capabilities",
              "revision": 17
            },
            "effect": "threatened",
            "reason": "基线已建立，但 V1 兼容正确性与条件 V2 沟通能力仍未闭合。",
            "gap_ids": [
              "GAP-feedback-v1-record-compatibility",
              "GAP-feedback-v2-management-contract"
            ],
            "evidence": [
              "FACT-feedback-v1-record-compatibility-gap",
              "FACT-feedback-v2-management-boundary",
              "arckit/spec/agentic-software-development/arcorbit-platform-capabilities.md"
            ]
          },
          {
            "id": "IMPACT-feedback-realization-gap",
            "fact_id": "FACT-feedback-daily-work-parity-required",
            "fact_revision": 1,
            "target": {
              "kind": "software_invariant",
              "ref": "accepted-facts-are-realized",
              "revision": null
            },
            "effect": "threatened",
            "reason": "ArcOrbit 已有 V1 主体，但兼容记录可能被误分类，V2 日常沟通能力尚无可信 adapter。",
            "gap_ids": [
              "GAP-feedback-v1-record-compatibility",
              "GAP-feedback-v2-management-contract"
            ],
            "evidence": [
              "FACT-feedback-v1-workbench-current-coverage",
              "FACT-feedback-v1-record-compatibility-gap",
              "FACT-feedback-v2-management-boundary"
            ]
          }
        ],
        "gaps_added": [
          {
            "id": "GAP-feedback-v1-record-compatibility",
            "status": "open",
            "goal": "ArcOrbit 正确归一化并安全处理参考控制台和历史 Workshop Feedback V1 记录，使处理状态、优先级和待办关联一致，已关联反馈不可重复转待办或继续修改反馈优先级，并以行为测试证明。",
            "reason": "当前窄字段投影会误判部分记录，直接影响无需网页版的日常处理正确性；该结果是已接受基线确定的最小可实施范围。",
            "derived_from": [
              "FACT-feedback-v1-record-compatibility-gap",
              "IMPACT-feedback-interaction-parity",
              "IMPACT-feedback-v1-risk-evidence"
            ],
            "blocked_by": [],
            "priority_basis": {
              "blocking": "阻塞 Feedback V1 日常处理正确性。",
              "uncertainty": "低；对象、字段映射和验收边界已由源码对照确定。",
              "risk": "误分类、重复转待办和错误修改优先级。",
              "user_impact": "高；直接影响用户能否信任 ArcOrbit 处理反馈。"
            },
            "responsibility": "agent",
            "evidence_required": [
              "Workshop Platform Adapter 对 top-level 与 data 历史字段、状态别名、优先级和待办关联的行为测试",
              "Renderer 对已关联反馈隐藏或禁用优先级与重复转待办的回归测试",
              "相关 ArcOrbit 检查通过且不扩宽 V2、凭据或通用网络 IPC 边界"
            ],
            "resolution": null
          },
          {
            "id": "GAP-feedback-v2-management-contract",
            "status": "open",
            "goal": "取得并验证目标 Workshop 环境中开发者侧 Feedback V2 的服务端路由、认证授权、消息/附件、通知/已读、忽略和原子转待办契约，或由权威方确认这些能力在目标环境不可用。",
            "reason": "参考前端客户端代码展示条件请求形状，但当前仓库没有服务端实现证据；ArcOrbit 不能据此静默启用受信管理 adapter。",
            "derived_from": [
              "FACT-feedback-v2-management-boundary",
              "IMPACT-feedback-product-capability-parity",
              "IMPACT-feedback-realization-gap"
            ],
            "blocked_by": [],
            "priority_basis": {
              "blocking": "阻塞 ArcOrbit 内双向消息、回复附件、未读处理和 V2 原子流转。",
              "uncertainty": "高；缺少服务端实现、权限和目标环境验证。",
              "risk": "错误启用会绕过 restricted adapter 边界或提供不可工作的 UI。",
              "user_impact": "中高；需要持续沟通的反馈仍可能依赖网页端。"
            },
            "responsibility": "external",
            "evidence_required": [
              "权威服务端 API 文档或实现代码",
              "带真实 Workshop 身份与权限的目标环境成功/拒绝/错误行为证据",
              "消息附件的受控上传与访问边界",
              "通知读取与已读副作用、忽略和原子转待办语义"
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
        "project_revision": 168,
        "judgments": [
          {
            "invariant_ref": "product-expectations-remain-recoverable",
            "disposition": "upheld",
            "reason": "无网页版日常 Feedback 目标、开发者工作台边界和条件能力规则已在产品规格中明确；本轮发现的是实现差距，不是产品期待缺失。",
            "fact_refs": [
              "FACT-feedback-v1-workbench-current-coverage",
              "FACT-feedback-v1-record-compatibility-gap",
              "FACT-feedback-v2-management-boundary"
            ],
            "evidence": [
              "arckit/spec/agentic-software-development/arcorbit-platform-capabilities.md:283",
              "arckit/spec/agentic-software-development/arcorbit-platform-capabilities.md:410"
            ],
            "gap_refs": []
          },
          {
            "invariant_ref": "interaction-expectations-remain-recoverable",
            "disposition": "upheld",
            "reason": "Feedback 双栏、选择、动作门禁、转待办恢复及“仅在契约成立时显示沟通”的长期交互事实已完整持久化。",
            "fact_refs": [
              "FACT-feedback-v1-record-compatibility-gap",
              "FACT-feedback-v2-management-boundary"
            ],
            "evidence": [
              "arckit/interaction/platform-workspace/interaction.md"
            ],
            "gap_refs": []
          },
          {
            "invariant_ref": "visual-language-remains-consistent",
            "disposition": "not_relevant",
            "reason": "本轮事实只建立能力、字段归一化、契约和动作语义，不建立或修改视觉语言。",
            "fact_refs": [],
            "evidence": [],
            "gap_refs": []
          },
          {
            "invariant_ref": "technical-decisions-remain-explainable",
            "disposition": "upheld",
            "reason": "现有技术方案明确区分 V1 restricted adapter、默认 unavailable 的 V2 capability、验证门禁和 Renderer 安全边界，与源码调查一致。",
            "fact_refs": [
              "FACT-feedback-v2-management-boundary"
            ],
            "evidence": [
              "arckit/tech/arcorbit/platform-composition-solution.md:50",
              "arckit/tech/arcorbit/platform-composition-solution.md:139",
              "arckit/tech/arcorbit/platform-composition-solution.md:244"
            ],
            "gap_refs": []
          },
          {
            "invariant_ref": "accepted-facts-are-realized",
            "disposition": "threatened",
            "reason": "ArcOrbit 已实现 V1 主体，但字段兼容和已关联动作门禁尚未兑现，V2 沟通能力仍依赖外部可信契约。",
            "fact_refs": [
              "FACT-feedback-v1-record-compatibility-gap",
              "FACT-feedback-v2-management-boundary"
            ],
            "evidence": [],
            "gap_refs": [
              "GAP-feedback-v1-record-compatibility",
              "GAP-feedback-v2-management-contract"
            ]
          },
          {
            "invariant_ref": "material-risks-have-credible-evidence",
            "disposition": "threatened",
            "reason": "源码对照证明误分类与重复转待办风险存在，但当前测试没有覆盖历史字段兼容和关联后动作门禁。",
            "fact_refs": [
              "FACT-feedback-v1-record-compatibility-gap"
            ],
            "evidence": [],
            "gap_refs": [
              "GAP-feedback-v1-record-compatibility"
            ]
          }
        ]
      },
      "evidence": [
        "arckit/spec/agentic-software-development/arcorbit-platform-capabilities.md",
        "arckit/interaction/platform-workspace/interaction.md",
        "arckit/tech/arcorbit/platform-composition-solution.md",
        "runtime/arcorbit/desktop/renderer/index.html",
        "runtime/arcorbit/desktop/renderer/renderer.js",
        "runtime/arcorbit/src/platform-coordinator.mjs",
        "runtime/arcorbit/src/workshop-platform-adapter.mjs",
        "runtime/arcorbit/test/desktop-renderer.test.mjs",
        "runtime/arcorbit/test/workshop-platform-adapter.test.mjs",
        "runtime/arcorbit/test/platform-coordinator.test.mjs",
        "../../hoewo/Workshop-Feedbacks/webapps/feedback-console-web/src/components/features/FeedbackManagementDialog.tsx",
        "../../hoewo/Workshop-Feedbacks/webapps/feedback-console-web/src/components/features/FeedbackConversationPanel.tsx",
        "../../hoewo/Workshop-Feedbacks/webapps/feedback-console-web/src/hooks/useFeedbacks.ts",
        "../../hoewo/Workshop-Feedbacks/webapps/feedback-console-web/src/lib/api/feedbackV2Client.ts",
        "Verification: node --test test/workshop-platform-adapter.test.mjs test/platform-coordinator.test.mjs test/desktop-renderer.test.mjs — 23 passed, 0 failed"
      ],
      "runtime_result_ref": "arckit-runtime://runs/RUN-20260822-185141949Z",
      "occurred_at": "2026-08-22T18:58:21.161Z"
    },
    {
      "round": 2,
      "transition_schema_version": "arckit-case-transition/v8",
      "goal": "补齐 Feedback V1 记录归一化、跨客户端转待办写回字段和已关联动作门禁，并以定向及完整测试验收。",
      "outcome": "completed",
      "gap_selection": {
        "mode": "candidate",
        "basis": "比较 fresh snapshot 的全部 persisted_candidates，并记录执行中实际发现但必须等待 post-commit fresh read 的新工作；选择当前 Case 内唯一 ready、低不确定性且直接阻塞 Feedback 日常处理正确性的 V1 兼容 Gap。",
        "snapshot_token": "a35f995be79752fa57938a2bb5c2005ce6efd0792c90b52339d789483cb8e794",
        "selected_ref": "case-gap:CASE-20260822-004:GAP-feedback-v1-record-compatibility",
        "comparison_summary": "五个 persisted candidates 中，GAP-feedback-v1-record-compatibility 是唯一 ready 且直接服务当前用户目标的 Case Gap；四个 Project Gap 均需独立 Case，因此延期。",
        "fresh_discovery_summary": "执行中发现 feedback.to_task 在 Task 已创建但 Feedback 关联写回失败时只返回 task_id，当前没有仅重试关联的动作；该工作记录为 fresh GAP-feedback-v1-link-recovery，等待本轮提交后的 fresh read，不在本轮实施。",
        "considered": [
          {
            "ref": "case-gap:CASE-20260822-004:GAP-feedback-v1-record-compatibility",
            "source": "persisted",
            "eligibility": "ready",
            "disposition": "selected",
            "priority_basis": {
              "blocking": "阻塞 Feedback V1 日常处理正确性。",
              "uncertainty": "低；对象、字段映射和验收边界已由源码对照确定。",
              "risk": "误分类、重复转待办和错误修改优先级。",
              "user_impact": "高；直接影响用户能否信任 ArcOrbit 处理反馈。"
            },
            "reason": "唯一可立即实施并直接闭合当前 Case 核心正确性风险的 persisted candidate。"
          },
          {
            "ref": "project-gap:GAP-agent-scenario-evaluation",
            "source": "persisted",
            "eligibility": "case_required",
            "disposition": "deferred",
            "priority_basis": {
              "blocking": "不阻塞当前 Feedback V1 修复。",
              "uncertainty": "高。",
              "risk": "高。",
              "user_impact": "低于当前 Feedback 正确性问题。"
            },
            "reason": "需要独立 Case，且不直接推进当前用户目标。"
          },
          {
            "ref": "project-gap:GAP-runtime-resilience-and-adapters",
            "source": "persisted",
            "eligibility": "case_required",
            "disposition": "deferred",
            "priority_basis": {
              "blocking": "不阻塞当前 Feedback V1 修复。",
              "uncertainty": "中。",
              "risk": "高。",
              "user_impact": "低于当前 Feedback 正确性问题。"
            },
            "reason": "需要独立 Case，当前 Feedback Gap 更直接。"
          },
          {
            "ref": "project-gap:GAP-security-real-project-validation",
            "source": "persisted",
            "eligibility": "case_required",
            "disposition": "deferred",
            "priority_basis": {
              "blocking": "不阻塞当前受限 V1 adapter 修复。",
              "uncertainty": "中。",
              "risk": "高。",
              "user_impact": "低于当前 Feedback 正确性问题。"
            },
            "reason": "需要独立权限项目和 Case。"
          },
          {
            "ref": "project-gap:GAP-cross-record-audit",
            "source": "persisted",
            "eligibility": "case_required",
            "disposition": "deferred",
            "priority_basis": {
              "blocking": "不阻塞当前 Feedback V1 修复。",
              "uncertainty": "中。",
              "risk": "高。",
              "user_impact": "低于当前 Feedback 正确性问题。"
            },
            "reason": "需要独立 Case，不能替代当前实现验收。"
          },
          {
            "ref": "fresh:GAP-feedback-v1-link-recovery",
            "source": "fresh",
            "eligibility": "blocked",
            "disposition": "deferred",
            "priority_basis": {
              "blocking": "部分失败后缺少无重复创建风险的恢复动作。",
              "uncertainty": "低；失败边界已由代码确认。",
              "risk": "再次执行可能重复创建待办。",
              "user_impact": "中高；影响失败恢复可信度。"
            },
            "reason": "本轮执行中才发现，必须等待当前 transition 提交后的 fresh snapshot 再参与选择。"
          }
        ]
      },
      "selected_gap": {
        "id": "GAP-feedback-v1-record-compatibility",
        "responsibility": "agent",
        "goal": "ArcOrbit 正确归一化并安全处理参考控制台和历史 Workshop Feedback V1 记录，使处理状态、优先级和待办关联一致，已关联反馈不可重复转待办或继续修改反馈优先级，并以行为测试证明。",
        "reason": "当前窄字段投影会误判部分记录，直接影响无需网页版的日常处理正确性；该结果是已接受基线确定的最小可实施范围。",
        "derived_from": [
          "FACT-feedback-v1-record-compatibility-gap",
          "IMPACT-feedback-interaction-parity",
          "IMPACT-feedback-v1-risk-evidence"
        ],
        "blocked_by": [],
        "priority_basis": {
          "blocking": "阻塞 Feedback V1 日常处理正确性。",
          "uncertainty": "低；对象、字段映射和验收边界已由源码对照确定。",
          "risk": "误分类、重复转待办和错误修改优先级。",
          "user_impact": "高；直接影响用户能否信任 ArcOrbit 处理反馈。"
        },
        "evidence_required": [
          "Workshop Platform Adapter 对 top-level 与 data 历史字段、状态别名、优先级和待办关联的行为测试",
          "Renderer 对已关联反馈隐藏或禁用优先级与重复转待办的回归测试",
          "相关 ArcOrbit 检查通过且不扩宽 V2、凭据或通用网络 IPC 边界"
        ]
      },
      "planned_transition": {
        "goal": "补齐 Feedback V1 记录归一化、跨客户端转待办写回字段和已关联动作门禁，并以定向及完整测试验收。",
        "expected_state_change": "GAP-feedback-v1-record-compatibility resolved；兼容性与防重复风险获得行为证据，同时不启用 Feedback V2 或扩宽 IPC。"
      },
      "accepted_state_delta": {
        "resolved_gap": {
          "id": "GAP-feedback-v1-record-compatibility",
          "status": "resolved",
          "outcome": "ArcOrbit 已兼容参考控制台和历史 Feedback V1 的关联、状态及优先级字段，并阻止已关联反馈重复转待办或继续修改反馈优先级。",
          "reason": "Adapter、Coordinator 与 Renderer 的实现及回归测试覆盖了 Gap 的全部证据要求；完整 ArcOrbit 检查通过。",
          "evidence": [
            "runtime/arcorbit/src/workshop-platform-adapter.mjs:232",
            "runtime/arcorbit/src/platform-coordinator.mjs:297",
            "runtime/arcorbit/desktop/renderer/renderer.js:886",
            "runtime/arcorbit/test/workshop-platform-adapter.test.mjs:47",
            "runtime/arcorbit/test/platform-coordinator.test.mjs:150",
            "runtime/arcorbit/test/desktop-renderer.test.mjs:51",
            "Verification: targeted ArcOrbit tests — 24 passed, 0 failed",
            "Verification: npm run check — 254 tests, 251 passed, 3 skipped, 0 failed",
            "Verification: git diff --check — passed"
          ]
        },
        "facts_added": [
          {
            "id": "FACT-feedback-v1-record-compatibility-realized",
            "revision": 1,
            "status": "accepted",
            "statement": "ArcOrbit Feedback V1 现已归一化 top-level task_id/task_state、data.task_id/converted_task_id、triage/status/历史状态别名以及 priority、ai_priority、priority_level 的命名或数值优先级，缺省优先级为 P2；转待办同时写回新旧客户端可识别的关联与状态字段。",
            "basis": "直接实现、定向行为测试和完整 ArcOrbit 检查共同证明。",
            "evidence": [
              "runtime/arcorbit/src/workshop-platform-adapter.mjs:232",
              "runtime/arcorbit/src/platform-coordinator.mjs:297",
              "runtime/arcorbit/test/workshop-platform-adapter.test.mjs:47",
              "runtime/arcorbit/test/platform-coordinator.test.mjs:150",
              "Verification: npm run check — 254 tests, 251 passed, 3 skipped, 0 failed"
            ]
          },
          {
            "id": "FACT-feedback-v1-workbench-current-coverage-corrected",
            "revision": 1,
            "status": "accepted",
            "statement": "ArcOrbit Workset Feedback 已实现 V1 日常工作台主体及两步转待办；如果 Task 创建后 Feedback 关联写回失败，界面会明确保留并显示已创建 task_id，但当前没有只重试关联写回的恢复动作，直接重新转待办存在重复创建风险。",
            "basis": "Platform Coordinator 的 partial_result 与 Renderer 错误呈现直接证明已创建 Task 可见，但现有受限动作集合不存在 association-only retry。",
            "evidence": [
              "runtime/arcorbit/src/platform-coordinator.mjs:314",
              "runtime/arcorbit/desktop/renderer/renderer.js:1209",
              "runtime/arcorbit/desktop/renderer/renderer.js:1241"
            ]
          }
        ],
        "facts_superseded": [
          {
            "id": "FACT-feedback-v1-workbench-current-coverage",
            "revision": 1,
            "reason": "原事实将两步转待办描述为可恢复，但关联写回失败后当前仅暴露 task_id，尚无只重试关联的恢复动作。",
            "evidence": [
              "runtime/arcorbit/src/platform-coordinator.mjs:314",
              "runtime/arcorbit/desktop/renderer/renderer.js:1241"
            ]
          }
        ],
        "impacts_added": [
          {
            "id": "IMPACT-feedback-v1-link-recovery-interaction",
            "fact_id": "FACT-feedback-v1-workbench-current-coverage-corrected",
            "fact_revision": 1,
            "target": {
              "kind": "software_decision",
              "ref": "experience_and_interaction",
              "revision": 28
            },
            "effect": "threatened",
            "reason": "交互规格要求失败后使用已创建 Task 重试关联，但 Renderer 当前没有 association-only 恢复动作。",
            "gap_ids": [
              "GAP-feedback-v1-link-recovery"
            ],
            "evidence": [
              "arckit/interaction/platform-workspace/interaction.md",
              "runtime/arcorbit/desktop/renderer/renderer.js:1241"
            ]
          },
          {
            "id": "IMPACT-feedback-v1-link-recovery-risk",
            "fact_id": "FACT-feedback-v1-workbench-current-coverage-corrected",
            "fact_revision": 1,
            "target": {
              "kind": "software_invariant",
              "ref": "material-risks-have-credible-evidence",
              "revision": null
            },
            "effect": "threatened",
            "reason": "partial_result 能防止失败被误报为完全失败，但尚未控制用户重新执行导致重复 Task 的风险。",
            "gap_ids": [
              "GAP-feedback-v1-link-recovery"
            ],
            "evidence": [
              "runtime/arcorbit/src/platform-coordinator.mjs:314",
              "runtime/arcorbit/desktop/renderer/renderer.js:1241"
            ]
          }
        ],
        "impacts_updated": [
          {
            "id": "IMPACT-feedback-product-capability-parity",
            "fact_id": "FACT-feedback-daily-work-parity-required",
            "fact_revision": 1,
            "target": {
              "kind": "software_decision",
              "ref": "product_capabilities",
              "revision": 17
            },
            "effect": "threatened",
            "reason": "V1 记录兼容已兑现，但关联失败恢复和条件 V2 沟通能力仍未闭合。",
            "gap_ids": [
              "GAP-feedback-v1-link-recovery",
              "GAP-feedback-v2-management-contract"
            ],
            "evidence": [
              "FACT-feedback-v1-record-compatibility-realized",
              "FACT-feedback-v1-workbench-current-coverage-corrected",
              "FACT-feedback-v2-management-boundary"
            ]
          },
          {
            "id": "IMPACT-feedback-realization-gap",
            "fact_id": "FACT-feedback-daily-work-parity-required",
            "fact_revision": 1,
            "target": {
              "kind": "software_invariant",
              "ref": "accepted-facts-are-realized",
              "revision": null
            },
            "effect": "threatened",
            "reason": "V1 日常处理正确性已显著补齐，但关联失败恢复及需要持续沟通的 V2 能力仍未实现。",
            "gap_ids": [
              "GAP-feedback-v1-link-recovery",
              "GAP-feedback-v2-management-contract"
            ],
            "evidence": [
              "FACT-feedback-v1-record-compatibility-realized",
              "FACT-feedback-v1-workbench-current-coverage-corrected",
              "FACT-feedback-v2-management-boundary"
            ]
          },
          {
            "id": "IMPACT-feedback-interaction-parity",
            "fact_id": "FACT-feedback-v1-record-compatibility-gap",
            "fact_revision": 1,
            "target": {
              "kind": "software_decision",
              "ref": "experience_and_interaction",
              "revision": 28
            },
            "effect": "upheld",
            "reason": "状态、关联和优先级现在正确呈现；已关联反馈不再提供优先级修改或重复转待办。",
            "gap_ids": [],
            "evidence": [
              "runtime/arcorbit/src/workshop-platform-adapter.mjs:232",
              "runtime/arcorbit/desktop/renderer/renderer.js:886",
              "runtime/arcorbit/test/desktop-renderer.test.mjs:51"
            ]
          },
          {
            "id": "IMPACT-feedback-v1-risk-evidence",
            "fact_id": "FACT-feedback-v1-record-compatibility-gap",
            "fact_revision": 1,
            "target": {
              "kind": "software_invariant",
              "ref": "material-risks-have-credible-evidence",
              "revision": null
            },
            "effect": "upheld",
            "reason": "历史字段误分类、关联识别、缺省优先级和已关联动作门禁均有直接行为测试及完整检查证据。",
            "gap_ids": [],
            "evidence": [
              "runtime/arcorbit/test/workshop-platform-adapter.test.mjs:47",
              "runtime/arcorbit/test/platform-coordinator.test.mjs:150",
              "runtime/arcorbit/test/desktop-renderer.test.mjs:51",
              "Verification: npm run check — 254 tests, 251 passed, 3 skipped, 0 failed"
            ]
          }
        ],
        "gaps_added": [
          {
            "id": "GAP-feedback-v1-link-recovery",
            "status": "open",
            "goal": "当 feedback.to_task 已创建 Task 但 Feedback 关联写回失败时，ArcOrbit 提供只复用已返回 task_id 重试关联的受限恢复动作，且不会再次创建 Task。",
            "reason": "当前 partial_result 能揭示部分成功，但用户缺少安全完成关联的操作，重新执行可能创建重复待办。",
            "derived_from": [
              "FACT-feedback-v1-workbench-current-coverage-corrected",
              "IMPACT-feedback-v1-link-recovery-interaction",
              "IMPACT-feedback-v1-link-recovery-risk"
            ],
            "blocked_by": [],
            "priority_basis": {
              "blocking": "阻塞部分失败场景的完整自助恢复。",
              "uncertainty": "低；失败边界和所需 association-only 动作清晰。",
              "risk": "错误重试可能重复创建待办或关联错误 Task。",
              "user_impact": "中高；影响用户能否完全脱离网页端并信任失败恢复。"
            },
            "responsibility": "agent",
            "evidence_required": [
              "Platform Coordinator 提供只更新 Feedback 关联且不创建 Task 的受限动作与输入验证",
              "Renderer 在 partial_result 中保留 task_id 并提供明确的仅重试关联操作",
              "关联重试成功、失败、无效 Task/Feedback 及绝不重复创建 Task 的行为测试",
              "完整 ArcOrbit 检查通过且不扩宽 V2、凭据或通用网络 IPC 边界"
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
        "evidence": [
          "现有产品规格、平台交互与技术方案已准确描述 V1 兼容、已关联动作门禁及 V2 默认不可用边界，本轮无需修改 Project State。"
        ]
      },
      "invariant_assessment": {
        "project_revision": 168,
        "judgments": [
          {
            "invariant_ref": "product-expectations-remain-recoverable",
            "disposition": "upheld",
            "reason": "无网页版日常 Feedback 目标和 V1/V2 能力边界仍由持久产品规格完整表达。",
            "fact_refs": [
              "FACT-feedback-v1-record-compatibility-realized",
              "FACT-feedback-v1-workbench-current-coverage-corrected",
              "FACT-feedback-v2-management-boundary"
            ],
            "evidence": [
              "arckit/spec/agentic-software-development/arcorbit-platform-capabilities.md:283",
              "arckit/spec/agentic-software-development/arcorbit-platform-capabilities.md:410"
            ],
            "gap_refs": []
          },
          {
            "invariant_ref": "interaction-expectations-remain-recoverable",
            "disposition": "upheld",
            "reason": "历史字段、已关联动作门禁及部分失败后的预期恢复语义均可从持久交互文档恢复。",
            "fact_refs": [
              "FACT-feedback-v1-record-compatibility-realized",
              "FACT-feedback-v1-workbench-current-coverage-corrected"
            ],
            "evidence": [
              "arckit/interaction/platform-workspace/interaction.md"
            ],
            "gap_refs": []
          },
          {
            "invariant_ref": "visual-language-remains-consistent",
            "disposition": "not_relevant",
            "reason": "本轮只实现既定动作门禁并复用现有 Desktop token 与组件风格，没有建立或修改持久视觉语言规则。",
            "fact_refs": [],
            "evidence": [],
            "gap_refs": []
          },
          {
            "invariant_ref": "technical-decisions-remain-explainable",
            "disposition": "upheld",
            "reason": "改动保持在 restricted Workshop Platform Adapter、Coordinator 和 typed Renderer 动作边界内，未启用 Feedback V2、暴露凭据或增加通用网络 IPC。",
            "fact_refs": [
              "FACT-feedback-v1-record-compatibility-realized",
              "FACT-feedback-v2-management-boundary"
            ],
            "evidence": [
              "arckit/tech/arcorbit/platform-composition-solution.md:139",
              "arckit/tech/arcorbit/platform-composition-solution.md:244",
              "runtime/arcorbit/src/workshop-platform-adapter.mjs:232",
              "runtime/arcorbit/src/platform-coordinator.mjs:297"
            ],
            "gap_refs": []
          },
          {
            "invariant_ref": "accepted-facts-are-realized",
            "disposition": "threatened",
            "reason": "V1 兼容与动作正确性已经实现，但关联部分失败缺少安全重试，且 V2 沟通契约仍待外部验证。",
            "fact_refs": [
              "FACT-feedback-daily-work-parity-required",
              "FACT-feedback-v1-workbench-current-coverage-corrected",
              "FACT-feedback-v2-management-boundary"
            ],
            "evidence": [],
            "gap_refs": [
              "GAP-feedback-v1-link-recovery",
              "GAP-feedback-v2-management-contract"
            ]
          },
          {
            "invariant_ref": "material-risks-have-credible-evidence",
            "disposition": "threatened",
            "reason": "本轮兼容风险已有完整测试证据，但关联写回部分失败后的重复创建风险仍未被恢复动作控制。",
            "fact_refs": [
              "FACT-feedback-v1-workbench-current-coverage-corrected"
            ],
            "evidence": [],
            "gap_refs": [
              "GAP-feedback-v1-link-recovery"
            ]
          }
        ]
      },
      "evidence": [
        "runtime/arcorbit/src/workshop-platform-adapter.mjs",
        "runtime/arcorbit/src/platform-coordinator.mjs",
        "runtime/arcorbit/desktop/renderer/renderer.js",
        "runtime/arcorbit/desktop/renderer/styles.css",
        "runtime/arcorbit/test/workshop-platform-adapter.test.mjs",
        "runtime/arcorbit/test/platform-coordinator.test.mjs",
        "runtime/arcorbit/test/desktop-renderer.test.mjs",
        "Verification: targeted ArcOrbit tests — 24 passed, 0 failed",
        "Verification: npm run check — 254 tests, 251 passed, 3 skipped, 0 failed",
        "Verification: git diff --check — passed"
      ],
      "runtime_result_ref": "arckit-runtime://runs/RUN-20260822-185141949Z",
      "occurred_at": "2026-08-22T19:07:15.441Z"
    },
    {
      "round": 3,
      "transition_schema_version": "arckit-case-transition/v8",
      "goal": "实现并验证 association-only 恢复路径。",
      "outcome": "completed",
      "gap_selection": {
        "mode": "candidate",
        "basis": "GAP-feedback-v1-link-recovery 是当前 Case 唯一 ready、agent 负责且可在本轮验收的候选。",
        "snapshot_token": "4a473ff6c96b6cdbba13effb10d7354389dca673c6226ceb1a6519290d5ce252",
        "selected_ref": "case-gap:CASE-20260822-004:GAP-feedback-v1-link-recovery",
        "comparison_summary": "四个 Project Gap 均需独立 Case；当前关联恢复直接阻塞 Feedback 日常处理的安全失败恢复。",
        "fresh_discovery_summary": "当前输入重申以 Workshop-Feedbacks 网页端为对照的日常处理目标；该目标已被现有 Case facts 覆盖，本轮未发现新的独立 fresh candidate。",
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
            "reason": "需要独立 Case。"
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
            "reason": "需要独立 Case。"
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
            "reason": "需要真实权限资源的独立 Case。"
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
            "reason": "需要独立 Case。"
          },
          {
            "ref": "case-gap:CASE-20260822-004:GAP-feedback-v1-link-recovery",
            "source": "persisted",
            "eligibility": "ready",
            "disposition": "selected",
            "priority_basis": {
              "blocking": "阻塞部分失败场景的完整自助恢复。",
              "uncertainty": "低。",
              "risk": "重复创建 Task。",
              "user_impact": "中高。"
            },
            "reason": "唯一 ready 的当前 Case 候选。"
          }
        ]
      },
      "selected_gap": {
        "id": "GAP-feedback-v1-link-recovery",
        "responsibility": "agent",
        "goal": "当 feedback.to_task 已创建 Task 但 Feedback 关联写回失败时，ArcOrbit 提供只复用已返回 task_id 重试关联的受限恢复动作，且不会再次创建 Task。",
        "reason": "当前 partial_result 能揭示部分成功，但用户缺少安全完成关联的操作，重新执行可能创建重复待办。",
        "derived_from": [
          "FACT-feedback-v1-workbench-current-coverage-corrected",
          "IMPACT-feedback-v1-link-recovery-interaction",
          "IMPACT-feedback-v1-link-recovery-risk"
        ],
        "blocked_by": [],
        "priority_basis": {
          "blocking": "阻塞部分失败场景的完整自助恢复。",
          "uncertainty": "低；失败边界和所需 association-only 动作清晰。",
          "risk": "错误重试可能重复创建待办或关联错误 Task。",
          "user_impact": "中高；影响用户能否完全脱离网页端并信任失败恢复。"
        },
        "evidence_required": [
          "Platform Coordinator 提供只更新 Feedback 关联且不创建 Task 的受限动作与输入验证",
          "Renderer 在 partial_result 中保留 task_id 并提供明确的仅重试关联操作",
          "关联重试成功、失败、无效 Task/Feedback 及绝不重复创建 Task 的行为测试",
          "完整 ArcOrbit 检查通过且不扩宽 V2、凭据或通用网络 IPC 边界"
        ]
      },
      "planned_transition": {
        "goal": "实现并验证 association-only 恢复路径。",
        "expected_state_change": "关联恢复 Gap resolved，相关交互与风险 impacts upheld。"
      },
      "accepted_state_delta": {
        "resolved_gap": {
          "id": "GAP-feedback-v1-link-recovery",
          "status": "resolved",
          "outcome": "ArcOrbit 保留已创建 task_id，并提供只更新 Feedback 关联且不创建第二个 Task 的恢复动作。",
          "reason": "实现和测试覆盖全部证据要求。",
          "evidence": [
            "runtime/arcorbit/src/platform-coordinator.mjs:286",
            "runtime/arcorbit/desktop/renderer/renderer.js:1247",
            "runtime/arcorbit/test/platform-coordinator.test.mjs:178",
            "Verification: npm run check — 257 tests, 254 passed, 3 skipped, 0 failed"
          ]
        },
        "facts_added": [
          {
            "id": "FACT-feedback-v1-workbench-current-coverage-corrected",
            "revision": 2,
            "status": "accepted",
            "statement": "ArcOrbit Workset Feedback 在 Task 创建后关联写回失败时保留 task_id，并提供只重试关联且不再次创建 Task 的安全恢复。",
            "basis": "直接实现、交互事实和行为测试共同证明。",
            "evidence": [
              "runtime/arcorbit/src/platform-coordinator.mjs:286",
              "runtime/arcorbit/desktop/renderer/renderer.js:1247",
              "runtime/arcorbit/test/platform-coordinator.test.mjs:178"
            ]
          }
        ],
        "facts_superseded": [
          {
            "id": "FACT-feedback-v1-workbench-current-coverage-corrected",
            "revision": 1,
            "reason": "原事实中的关联恢复缺口已经实现。",
            "evidence": [
              "runtime/arcorbit/src/platform-coordinator.mjs:286"
            ]
          }
        ],
        "impacts_added": [],
        "impacts_updated": [
          {
            "id": "IMPACT-feedback-product-capability-parity",
            "fact_id": "FACT-feedback-daily-work-parity-required",
            "fact_revision": 1,
            "target": {
              "kind": "software_decision",
              "ref": "product_capabilities",
              "revision": 17
            },
            "effect": "threatened",
            "reason": "关联恢复已闭合，开发者侧 V2 管理契约仍未验证。",
            "gap_ids": [
              "GAP-feedback-v2-management-contract"
            ],
            "evidence": [
              "FACT-feedback-v1-workbench-current-coverage-corrected",
              "FACT-feedback-v2-management-boundary"
            ]
          },
          {
            "id": "IMPACT-feedback-realization-gap",
            "fact_id": "FACT-feedback-daily-work-parity-required",
            "fact_revision": 1,
            "target": {
              "kind": "software_invariant",
              "ref": "accepted-facts-are-realized",
              "revision": null
            },
            "effect": "threatened",
            "reason": "关联恢复已闭合，开发者侧 V2 管理契约仍未验证。",
            "gap_ids": [
              "GAP-feedback-v2-management-contract"
            ],
            "evidence": [
              "FACT-feedback-v1-workbench-current-coverage-corrected",
              "FACT-feedback-v2-management-boundary"
            ]
          },
          {
            "id": "IMPACT-feedback-v1-link-recovery-interaction",
            "fact_id": "FACT-feedback-v1-workbench-current-coverage-corrected",
            "fact_revision": 2,
            "target": {
              "kind": "software_decision",
              "ref": "experience_and_interaction",
              "revision": 28
            },
            "effect": "upheld",
            "reason": "仅重试关联交互已经实现并持久化。",
            "gap_ids": [],
            "evidence": [
              "arckit/interaction/platform-workspace/interaction.md:121",
              "runtime/arcorbit/desktop/renderer/renderer.js:896"
            ]
          },
          {
            "id": "IMPACT-feedback-v1-link-recovery-risk",
            "fact_id": "FACT-feedback-v1-workbench-current-coverage-corrected",
            "fact_revision": 2,
            "target": {
              "kind": "software_invariant",
              "ref": "material-risks-have-credible-evidence",
              "revision": null
            },
            "effect": "upheld",
            "reason": "行为测试证明恢复不重复创建 Task。",
            "gap_ids": [],
            "evidence": [
              "runtime/arcorbit/test/platform-coordinator.test.mjs:178"
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
        "project_revision": 168,
        "judgments": [
          {
            "invariant_ref": "product-expectations-remain-recoverable",
            "disposition": "upheld",
            "reason": "无网页版日常 Feedback 目标仍由持久产品规格表达。",
            "fact_refs": [
              "FACT-feedback-daily-work-parity-required",
              "FACT-feedback-v1-workbench-current-coverage-corrected",
              "FACT-feedback-v2-management-boundary"
            ],
            "evidence": [
              "arckit/spec/agentic-software-development/arcorbit-platform-capabilities.md:283",
              "arckit/spec/agentic-software-development/arcorbit-platform-capabilities.md:410"
            ],
            "gap_refs": []
          },
          {
            "invariant_ref": "interaction-expectations-remain-recoverable",
            "disposition": "upheld",
            "reason": "关联恢复语义已持久化。",
            "fact_refs": [
              "FACT-feedback-v1-workbench-current-coverage-corrected"
            ],
            "evidence": [
              "arckit/interaction/platform-workspace/interaction.md:121",
              "arckit/interaction/platform-workspace/default.html:94"
            ],
            "gap_refs": []
          },
          {
            "invariant_ref": "visual-language-remains-consistent",
            "disposition": "not_relevant",
            "reason": "复用既有样式，没有修改持久视觉语言规则。",
            "fact_refs": [],
            "evidence": [],
            "gap_refs": []
          },
          {
            "invariant_ref": "technical-decisions-remain-explainable",
            "disposition": "upheld",
            "reason": "恢复保持在 restricted adapter、Coordinator 和 typed Renderer 边界内。",
            "fact_refs": [
              "FACT-feedback-v1-workbench-current-coverage-corrected",
              "FACT-feedback-v2-management-boundary"
            ],
            "evidence": [
              "arckit/tech/arcorbit/platform-composition-solution.md:139",
              "runtime/arcorbit/src/platform-coordinator.mjs:286"
            ],
            "gap_refs": []
          },
          {
            "invariant_ref": "accepted-facts-are-realized",
            "disposition": "threatened",
            "reason": "V1 恢复已实现，但开发者侧 V2 管理契约仍待验证。",
            "fact_refs": [
              "FACT-feedback-daily-work-parity-required",
              "FACT-feedback-v1-workbench-current-coverage-corrected",
              "FACT-feedback-v2-management-boundary"
            ],
            "evidence": [],
            "gap_refs": [
              "GAP-feedback-v2-management-contract"
            ]
          },
          {
            "invariant_ref": "material-risks-have-credible-evidence",
            "disposition": "upheld",
            "reason": "重复创建和错误关联风险已有行为测试。",
            "fact_refs": [
              "FACT-feedback-v1-workbench-current-coverage-corrected"
            ],
            "evidence": [
              "runtime/arcorbit/test/platform-coordinator.test.mjs:178",
              "Verification: npm run check — 257 tests, 254 passed, 3 skipped, 0 failed"
            ],
            "gap_refs": []
          }
        ]
      },
      "evidence": [
        "runtime/arcorbit/src/platform-coordinator.mjs",
        "runtime/arcorbit/desktop/renderer/renderer.js",
        "runtime/arcorbit/test/platform-coordinator.test.mjs",
        "Verification: arckit-case-transition/v8 validation — passed",
        "Verification: targeted ArcOrbit tests — 25 passed, 0 failed",
        "Verification: npm run check — 257 tests, 254 passed, 3 skipped, 0 failed",
        "Verification: git diff --check — passed"
      ],
      "runtime_result_ref": "arckit-runtime://runs/RUN-20260822-195115686Z",
      "occurred_at": "2026-08-22T19:54:36.381Z"
    },
    {
      "round": 4,
      "transition_schema_version": "arckit-case-transition/v8",
      "goal": "以 Workshop-Feedbacks 前端代码和 operator 授权接受开发者管理 V2 契约，并同步持久产品、交互和技术边界。",
      "outcome": "completed",
      "gap_selection": {
        "mode": "candidate",
        "basis": "当前 Case 仅剩 GAP-feedback-v2-management-contract；operator 明确接受 Workshop-Feedbacks 前端代码作为契约依据，使该原 external Gap 可在本轮完成契约接受。",
        "snapshot_token": "83167ce11979e0c3358b7a17b722127e69b848afafe2aca31b10c0ecfb2cd2ac",
        "selected_ref": "case-gap:CASE-20260822-004:GAP-feedback-v2-management-contract",
        "comparison_summary": "四个 Project Gap 均需独立 Case，不能在当前 Feedback Case 中选择；当前 Case 的 V2 管理契约 Gap 是唯一 ready candidate，且直接阻塞用户要求的网页版核心能力对齐。",
        "fresh_discovery_summary": "当前 operator 输入改变了既有契约 Gap 的证据充分性，没有发现应替代它的 fresh candidate；契约接受后暴露的实现工作作为后续 open Gap 写回，不能在本轮继续消费。",
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
            "reason": "需要独立 Case，且与当前 Feedback 开发者工作台的契约阻塞无直接关系。"
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
            "reason": "需要独立 Case；当前用户事项优先处理 Feedback 管理能力。"
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
            "reason": "需要独立 Case，且本轮没有获得真实权限资源范围。"
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
            "reason": "需要独立 Case；不应吞并当前 Feedback 契约的单一验收主张。"
          },
          {
            "ref": "case-gap:CASE-20260822-004:GAP-feedback-v2-management-contract",
            "source": "persisted",
            "eligibility": "ready",
            "disposition": "selected",
            "priority_basis": {
              "blocking": "阻塞开发者消息、回复附件、未读处理和原子流转的实现边界。",
              "uncertainty": "operator 已明确接受前端客户端代码作为充分契约，契约层不再需要外部验证。",
              "risk": "必须避免把开发者管理 V2 与 ArcOrbit 产品反馈 SDK V2 混同，且保持受限 adapter 和失败关闭。",
              "user_impact": "高；直接决定 ArcOrbit 能否继续补齐网页版的日常 Feedback 核心能力。"
            },
            "reason": "这是当前 Case 唯一 ready Gap，用户输入直接解决其证据门禁。"
          }
        ]
      },
      "selected_gap": {
        "id": "GAP-feedback-v2-management-contract",
        "responsibility": "external",
        "goal": "取得并验证目标 Workshop 环境中开发者侧 Feedback V2 的服务端路由、认证授权、消息/附件、通知/已读、忽略和原子转待办契约，或由权威方确认这些能力在目标环境不可用。",
        "reason": "参考前端客户端代码展示条件请求形状，但当前仓库没有服务端实现证据；ArcOrbit 不能据此静默启用受信管理 adapter。",
        "derived_from": [
          "FACT-feedback-v2-management-boundary",
          "IMPACT-feedback-product-capability-parity",
          "IMPACT-feedback-realization-gap"
        ],
        "blocked_by": [],
        "priority_basis": {
          "blocking": "阻塞 ArcOrbit 内双向消息、回复附件、未读处理和 V2 原子流转。",
          "uncertainty": "高；缺少服务端实现、权限和目标环境验证。",
          "risk": "错误启用会绕过 restricted adapter 边界或提供不可工作的 UI。",
          "user_impact": "中高；需要持续沟通的反馈仍可能依赖网页端。"
        },
        "evidence_required": [
          "权威服务端 API 文档或实现代码",
          "带真实 Workshop 身份与权限的目标环境成功/拒绝/错误行为证据",
          "消息附件的受控上传与访问边界",
          "通知读取与已读副作用、忽略和原子转待办语义"
        ]
      },
      "planned_transition": {
        "goal": "以 Workshop-Feedbacks 前端代码和 operator 授权接受开发者管理 V2 契约，并同步持久产品、交互和技术边界。",
        "expected_state_change": "解决外部契约 Gap；将真实环境预验证从实现门禁中移除，并新增尚未执行的 agent-owned V2 管理实现 Gap。"
      },
      "accepted_state_delta": {
        "resolved_gap": {
          "id": "GAP-feedback-v2-management-contract",
          "status": "resolved",
          "outcome": "Workshop-Feedbacks 前端客户端代码被接受为 ArcOrbit Workset Feedback 开发者管理 V2 的实现契约，不再要求真实环境预验证。",
          "reason": "operator 明确设定证据充分性；前端 client、条件开关和会话组件覆盖消息、附件、通知/已读、忽略与原子转待办请求形状。",
          "evidence": [
            "Current operator input, 2026-08-23",
            "../../hoewo/Workshop-Feedbacks/webapps/feedback-console-web/src/lib/api/feedbackV2Client.ts",
            "../../hoewo/Workshop-Feedbacks/webapps/feedback-console-web/src/hooks/useFeedbacks.ts",
            "../../hoewo/Workshop-Feedbacks/webapps/feedback-console-web/src/components/features/FeedbackConversationPanel.tsx",
            "arckit/spec/agentic-software-development/arcorbit-platform-capabilities.md:300",
            "arckit/interaction/platform-workspace/interaction.md:23",
            "arckit/tech/arcorbit/platform-composition-solution.md:137"
          ]
        },
        "facts_added": [
          {
            "id": "FACT-feedback-v2-management-boundary",
            "revision": 2,
            "status": "accepted",
            "statement": "Workshop-Feedbacks 前端开发者控制台的 V2 client、项目开关和会话组件是 ArcOrbit Workset Feedback 开发者管理能力采用的实现契约；实现前不要求真实环境 API 验证。该契约覆盖 triage/customer 状态、用户/开发者/system 消息、回复附件上传与受控读取、通知/已读、专用忽略和服务端原子转待办。它不使用 ArcOrbit 产品反馈中心的 SDK WebView V2、Project 107 或内置 API Key；运行时仍必须保持受限 Platform Adapter、项目开关和逐动作失败关闭。",
            "basis": "operator 明确接受前端代码作为充分依据，相关前端源码完整表达请求、响应、灰度和恢复行为。",
            "evidence": [
              "Current operator input, 2026-08-23",
              "../../hoewo/Workshop-Feedbacks/webapps/feedback-console-web/src/lib/api/feedbackV2Client.ts",
              "../../hoewo/Workshop-Feedbacks/webapps/feedback-console-web/src/hooks/useFeedbacks.ts",
              "../../hoewo/Workshop-Feedbacks/webapps/feedback-console-web/src/components/features/FeedbackConversationPanel.tsx",
              "arckit/spec/agentic-software-development/arcorbit-platform-capabilities.md:300",
              "arckit/interaction/platform-workspace/interaction.md:23",
              "arckit/tech/arcorbit/platform-composition-solution.md:137"
            ]
          }
        ],
        "facts_superseded": [
          {
            "id": "FACT-feedback-v2-management-boundary",
            "revision": 1,
            "reason": "operator 已明确撤销真实环境验证作为前端契约接受的前置条件。",
            "evidence": [
              "Current operator input, 2026-08-23"
            ]
          }
        ],
        "impacts_added": [],
        "impacts_updated": [
          {
            "id": "IMPACT-feedback-product-capability-parity",
            "fact_id": "FACT-feedback-daily-work-parity-required",
            "fact_revision": 1,
            "target": {
              "kind": "software_decision",
              "ref": "product_capabilities",
              "revision": 17
            },
            "effect": "threatened",
            "reason": "开发者管理 V2 契约已接受，但消息、回复附件、未读处理、专用忽略和原子转待办尚未在 ArcOrbit 实现。",
            "gap_ids": [
              "GAP-feedback-v2-management-implementation"
            ],
            "evidence": [
              "FACT-feedback-v2-management-boundary",
              "runtime/arcorbit/src/platform-coordinator.mjs",
              "runtime/arcorbit/src/workshop-platform-adapter.mjs"
            ]
          },
          {
            "id": "IMPACT-feedback-realization-gap",
            "fact_id": "FACT-feedback-daily-work-parity-required",
            "fact_revision": 1,
            "target": {
              "kind": "software_invariant",
              "ref": "accepted-facts-are-realized",
              "revision": null
            },
            "effect": "threatened",
            "reason": "契约边界已闭合，实际软件仍未兑现开发者消息、附件、未读与原子流转。",
            "gap_ids": [
              "GAP-feedback-v2-management-implementation"
            ],
            "evidence": [
              "FACT-feedback-v2-management-boundary",
              "runtime/arcorbit/src/platform-coordinator.mjs",
              "runtime/arcorbit/src/workshop-platform-adapter.mjs"
            ]
          },
          {
            "id": "IMPACT-feedback-v2-boundary-upheld",
            "fact_id": "FACT-feedback-v2-management-boundary",
            "fact_revision": 2,
            "target": {
              "kind": "software_decision",
              "ref": "external_integrations",
              "revision": 7
            },
            "effect": "upheld",
            "reason": "Project 集成决策现已接受前端开发者管理契约，同时保留受限 adapter、失败关闭及与产品反馈 SDK 的隔离。",
            "gap_ids": [],
            "evidence": [
              "arckit/tech/arcorbit/platform-composition-solution.md:137",
              "arckit/spec/agentic-software-development/arcorbit-platform-capabilities.md:300"
            ]
          }
        ],
        "gaps_added": [
          {
            "id": "GAP-feedback-v2-management-implementation",
            "status": "open",
            "goal": "在 ArcOrbit 的 restricted Workshop Platform Adapter、Platform Coordinator、typed IPC 和 Feedback Renderer 中实现已接受的开发者管理 V2 契约，使开发者能够处理消息与回复附件、未读/已读、专用忽略和服务端原子转待办，且不使用 ArcOrbit 产品反馈 SDK V2。",
            "reason": "本轮只接受了实现前置契约；实际软件仍只有 V1 管理能力，尚不能替代网页版完成持续沟通和 V2 原子流转。",
            "derived_from": [
              "FACT-feedback-v2-management-boundary",
              "IMPACT-feedback-product-capability-parity",
              "IMPACT-feedback-realization-gap"
            ],
            "blocked_by": [],
            "priority_basis": {
              "blocking": "阻塞无需网页版完成开发者反馈沟通和原子流转。",
              "uncertainty": "中；请求形状已明确，现有 ArcOrbit adapter/IPC/Renderer 需要扩展。",
              "risk": "错误实现可能泄露凭据、扩宽通用网络 IPC、丢失草稿或把产品反馈 SDK 与 Workset 管理混用。",
              "user_impact": "高；直接覆盖网页版最新核心日常处理能力。"
            },
            "responsibility": "agent",
            "evidence_required": [
              "受限 Platform Adapter 和 Coordinator 覆盖消息、附件、通知/已读、忽略与原子转待办，Renderer 不接触 URL、header 或凭据",
              "Feedback Renderer 提供消息时间线、文本/附件回复、未读提示与逐动作错误恢复",
              "V2 项目开关、成功、401/403/404、网络失败、附件失败、已读失败和原子流转行为测试",
              "证明 Workset Feedback 不调用产品反馈 SDK WebView、Project 107 或 bundled API Key",
              "完整 ArcOrbit 检查通过且不回归 V1 管理和关联恢复"
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
            "area_ref": "external_integrations",
            "observed_revision": 6,
            "set_decision": {
              "status": "settled",
              "statement": "ArcOrbit integrates with Codex app-server/CLI and Workshop through explicit main-process adapters; trusted ledger entrypoints remain repository-owned. Workshop authentication preserves server-rotated credentials and the rolling seven-day inactivity contract. The Automation adapter remains executor-scoped, while the separate Platform Adapter reads organization, project, membership, full project task and Feedback domains. The developer-side Feedback V2 management contract is accepted from the Workshop-Feedbacks frontend client and may be implemented through a separately restricted Platform Adapter without real-environment prevalidation; project flags and runtime errors determine available or degraded behavior. ArcOrbit 自身产品反馈独立使用 Feedback SDK WebView V2 的 API Key 直连契约；它不启用或替代 Workset Feedback V2 管理 adapter，也不推断未确认的宿主 Session endpoint。 The Workshop integration accepts both the versioned project WebSocket plus authorized cursor replay API and the previous no-ID WebSocket notification contract. Modern connections catch up and deduplicate by event ID and handle cursor expiry by full refresh; legacy connections treat notifications as invalidations and refresh current state on connect. ArcOrbit uses 15-minute reconciliation and explicit immediate sync instead of disconnected minute polling.",
              "reason": "operator 明确接受 Workshop-Feedbacks 前端代码作为开发者管理契约，并要求以网页版最新核心能力为对齐目标；受限 adapter 和产品反馈 SDK 隔离仍保持不变。",
              "evidence": [
                "Current operator input, 2026-08-23",
                "../../hoewo/Workshop-Feedbacks/webapps/feedback-console-web/src/lib/api/feedbackV2Client.ts",
                "../../hoewo/Workshop-Feedbacks/webapps/feedback-console-web/src/hooks/useFeedbacks.ts",
                "../../hoewo/Workshop-Feedbacks/webapps/feedback-console-web/src/components/features/FeedbackConversationPanel.tsx",
                "arckit/tech/arcorbit/platform-composition-solution.md"
              ],
              "confidence": "high",
              "resume_condition": "Revisit when the Workshop-Feedbacks frontend contract, project rollout flags, Workshop authentication boundary, or developer-management failure semantics change."
            },
            "gap_refs": [],
            "reason": "真实环境预验证不再是开发者管理 V2 的契约门禁；实际实现由当前 Case 的后续 Gap 承接，不建立 Project Gap 引用。",
            "evidence": [
              "Current operator input, 2026-08-23",
              "arckit/tech/arcorbit/platform-composition-solution.md:137"
            ]
          }
        ],
        "software_invariant_changes": [],
        "project_gap_changes": [],
        "selection_context_change": null,
        "evidence": [
          "Current operator input, 2026-08-23",
          "arckit/spec/agentic-software-development/arcorbit-platform-capabilities.md",
          "arckit/interaction/platform-workspace/interaction.md",
          "arckit/tech/arcorbit/platform-composition-solution.md"
        ]
      },
      "invariant_assessment": {
        "project_revision": 168,
        "judgments": [
          {
            "invariant_ref": "product-expectations-remain-recoverable",
            "disposition": "upheld",
            "reason": "Feedback 开发者管理 V2 的采用契约、能力范围、失败关闭和与产品反馈 SDK 的独立边界已持久化。",
            "fact_refs": [
              "FACT-feedback-v2-management-boundary"
            ],
            "evidence": [
              "arckit/spec/agentic-software-development/arcorbit-platform-capabilities.md:300"
            ],
            "gap_refs": []
          },
          {
            "invariant_ref": "interaction-expectations-remain-recoverable",
            "disposition": "upheld",
            "reason": "消息、回复附件、未读/已读、专用忽略、原子流转和逐动作恢复均由交互源与线框投影表达。",
            "fact_refs": [
              "FACT-feedback-v2-management-boundary"
            ],
            "evidence": [
              "arckit/interaction/platform-workspace/interaction.md:23",
              "arckit/interaction/platform-workspace/default.html:76"
            ],
            "gap_refs": []
          },
          {
            "invariant_ref": "visual-language-remains-consistent",
            "disposition": "not_relevant",
            "reason": "本轮只新增使用现有灰度类和组件的交互状态，没有建立、修改或冲突任何持久视觉语言规则。",
            "fact_refs": [],
            "evidence": [],
            "gap_refs": []
          },
          {
            "invariant_ref": "technical-decisions-remain-explainable",
            "disposition": "upheld",
            "reason": "前端契约采纳、受限 adapter、项目开关、运行时降级和产品反馈 SDK 隔离已在技术方案及 Project 集成决策中明确。",
            "fact_refs": [
              "FACT-feedback-v2-management-boundary"
            ],
            "evidence": [
              "arckit/tech/arcorbit/platform-composition-solution.md:137"
            ],
            "gap_refs": []
          },
          {
            "invariant_ref": "accepted-facts-are-realized",
            "disposition": "threatened",
            "reason": "契约已接受，但 ArcOrbit 尚未实现开发者消息、回复附件、未读/已读、专用忽略和原子转待办。",
            "fact_refs": [
              "FACT-feedback-daily-work-parity-required",
              "FACT-feedback-v2-management-boundary"
            ],
            "evidence": [],
            "gap_refs": [
              "GAP-feedback-v2-management-implementation"
            ]
          },
          {
            "invariant_ref": "material-risks-have-credible-evidence",
            "disposition": "threatened",
            "reason": "持久边界已经定义凭据隔离和逐动作失败关闭，但这些控制尚未在 V2 管理实现及行为测试中得到证明。",
            "fact_refs": [
              "FACT-feedback-v2-management-boundary"
            ],
            "evidence": [],
            "gap_refs": [
              "GAP-feedback-v2-management-implementation"
            ]
          }
        ]
      },
      "evidence": [
        "Current operator input, 2026-08-23",
        "../../hoewo/Workshop-Feedbacks/webapps/feedback-console-web/src/lib/api/feedbackV2Client.ts",
        "../../hoewo/Workshop-Feedbacks/webapps/feedback-console-web/src/hooks/useFeedbacks.ts",
        "../../hoewo/Workshop-Feedbacks/webapps/feedback-console-web/src/components/features/FeedbackConversationPanel.tsx",
        "arckit/spec/agentic-software-development/arcorbit-platform-capabilities.md",
        "arckit/interaction/platform-workspace/interaction.md",
        "arckit/interaction/platform-workspace/default.html",
        "arckit/tech/arcorbit/platform-composition-solution.md",
        "Verification: HTML tag balance — passed",
        "Verification: npm run check -- --test-reporter=dot — 257 tests, 254 passed, 3 skipped, 0 failed",
        "Verification: git diff --check — passed",
        "Verification: arckit-case-transition/v8 validation — passed"
      ],
      "runtime_result_ref": "arckit-runtime://runs/RUN-20260822-195742396Z",
      "occurred_at": "2026-08-22T20:08:45.921Z"
    },
    {
      "round": 5,
      "transition_schema_version": "arckit-case-transition/v8",
      "goal": "实现受限的 Workset Feedback 开发者管理 V2，并用行为测试证明项目门禁、失败隔离、附件边界和 V1 回退。",
      "outcome": "completed",
      "gap_selection": {
        "mode": "candidate",
        "basis": "当前 Case 的开发者管理 V2 实现 Gap 是唯一 ready candidate；四个 Project Gap 均需独立 Case，不能替代当前直接阻塞 Feedback 日常处理的实现工作。",
        "snapshot_token": "66bc61409720580ad17bcd21fbbd8323b08575149f25b257d7e9142c015aaa82",
        "selected_ref": "case-gap:CASE-20260822-004:GAP-feedback-v2-management-implementation",
        "comparison_summary": "选择当前 Case 唯一 ready 且高用户影响的 V2 管理实现；其余四项 persisted Project Gap 均为 case_required 并保持 deferred。",
        "fresh_discovery_summary": "实现与回归检查没有发现应抢占所选 Gap 的 fresh candidate；本轮只消费该实现 Gap，Case completion review 等待 post-commit fresh read。",
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
            "reason": "需要独立 Case，且不直接兑现当前 Feedback 开发者工作台能力。"
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
            "reason": "需要独立 Case；当前实现保持既有 Runtime 边界但不吞并其通用韧性事项。"
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
            "reason": "需要独立 Case；operator 已明确本事项不要求真实环境预验证。"
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
            "reason": "需要独立 Case，不能替代本 Case 的产品能力实现。"
          },
          {
            "ref": "case-gap:CASE-20260822-004:GAP-feedback-v2-management-implementation",
            "source": "persisted",
            "eligibility": "ready",
            "disposition": "selected",
            "priority_basis": {
              "blocking": "阻塞无需网页版完成开发者反馈沟通和原子流转。",
              "uncertainty": "中；请求形状已接受，需扩展现有 adapter、IPC 与 Renderer。",
              "risk": "必须隔离凭据与产品反馈 SDK，并逐动作失败关闭。",
              "user_impact": "高；覆盖网页版最新核心日常处理能力。"
            },
            "reason": "这是当前 Case 唯一 ready Gap，且直接闭合仍受威胁的产品能力与实现不变量。"
          }
        ]
      },
      "selected_gap": {
        "id": "GAP-feedback-v2-management-implementation",
        "responsibility": "agent",
        "goal": "在 ArcOrbit 的 restricted Workshop Platform Adapter、Platform Coordinator、typed IPC 和 Feedback Renderer 中实现已接受的开发者管理 V2 契约，使开发者能够处理消息与回复附件、未读/已读、专用忽略和服务端原子转待办，且不使用 ArcOrbit 产品反馈 SDK V2。",
        "reason": "本轮只接受了实现前置契约；实际软件仍只有 V1 管理能力，尚不能替代网页版完成持续沟通和 V2 原子流转。",
        "derived_from": [
          "FACT-feedback-v2-management-boundary",
          "IMPACT-feedback-product-capability-parity",
          "IMPACT-feedback-realization-gap"
        ],
        "blocked_by": [],
        "priority_basis": {
          "blocking": "阻塞无需网页版完成开发者反馈沟通和原子流转。",
          "uncertainty": "中；请求形状已明确，现有 ArcOrbit adapter/IPC/Renderer 需要扩展。",
          "risk": "错误实现可能泄露凭据、扩宽通用网络 IPC、丢失草稿或把产品反馈 SDK 与 Workset 管理混用。",
          "user_impact": "高；直接覆盖网页版最新核心日常处理能力。"
        },
        "evidence_required": [
          "受限 Platform Adapter 和 Coordinator 覆盖消息、附件、通知/已读、忽略与原子转待办，Renderer 不接触 URL、header 或凭据",
          "Feedback Renderer 提供消息时间线、文本/附件回复、未读提示与逐动作错误恢复",
          "V2 项目开关、成功、401/403/404、网络失败、附件失败、已读失败和原子流转行为测试",
          "证明 Workset Feedback 不调用产品反馈 SDK WebView、Project 107 或 bundled API Key",
          "完整 ArcOrbit 检查通过且不回归 V1 管理和关联恢复"
        ]
      },
      "planned_transition": {
        "goal": "实现受限的 Workset Feedback 开发者管理 V2，并用行为测试证明项目门禁、失败隔离、附件边界和 V1 回退。",
        "expected_state_change": "解决 V2 管理实现 Gap，使产品能力和实际软件重新一致；Case 随后进入 completion review。"
      },
      "accepted_state_delta": {
        "resolved_gap": {
          "id": "GAP-feedback-v2-management-implementation",
          "status": "resolved",
          "outcome": "ArcOrbit Workset Feedback 已实现开发者管理 V2：项目门禁列表、消息时间线、文本/附件回复、未读/已读、专用忽略、更新、删除和服务端原子转待办均通过受限 main-process 能力提供。",
          "reason": "固定 V2 路由、Coordinator 逐功能状态、专用 IPC、Renderer 恢复语义和完整自动化检查覆盖全部证据要求。",
          "evidence": [
            "runtime/arcorbit/src/workshop-platform-adapter.mjs:103",
            "runtime/arcorbit/src/platform-coordinator.mjs:20",
            "runtime/arcorbit/desktop/renderer/renderer.js:929",
            "runtime/arcorbit/test/workshop-platform-adapter.test.mjs:5",
            "runtime/arcorbit/test/platform-coordinator.test.mjs:244",
            "runtime/arcorbit/test/desktop-renderer.test.mjs:221",
            "Verification: npm run check -- --test-reporter=dot — 265 tests, 262 passed, 3 skipped, 0 failed",
            "Verification: git diff --check — passed"
          ]
        },
        "facts_added": [
          {
            "id": "FACT-feedback-v2-management-realized",
            "revision": 1,
            "status": "accepted",
            "statement": "ArcOrbit Workset Feedback 已通过 authenticated /workshop/v2/user 固定路由、项目 allowlist、restricted Workshop Platform Adapter、Platform Coordinator 和专用 typed IPC 实现开发者管理 V2。Renderer 可读取用户/开发者/system 消息、保留失败草稿、发送文本或受控附件、显示未读并标记已读、专用忽略、更新/删除和服务端原子转待办；401 回到登录门禁、404 刷新事实、其他失败只降级对应动作并保留已加载内容。附件上传策略和临时读取凭据只在 main process 使用，Workset Feedback 不调用产品反馈 SDK WebView、Project 107 或 bundled API Key；V2 不可用时保留 V1 事实并明确降级。",
            "basis": "直接实现、固定路由测试、逐功能失败测试、专用 IPC 静态边界测试和完整 ArcOrbit 检查共同证明。",
            "evidence": [
              "runtime/arcorbit/src/task-source-adapter.mjs",
              "runtime/arcorbit/src/workshop-platform-adapter.mjs:103",
              "runtime/arcorbit/src/feedback-v2-attachment-access.mjs",
              "runtime/arcorbit/src/platform-coordinator.mjs:395",
              "runtime/arcorbit/desktop/main.mjs:347",
              "runtime/arcorbit/desktop/preload.cjs:50",
              "runtime/arcorbit/desktop/renderer/renderer.js:929",
              "runtime/arcorbit/test/feedback-v2-attachment-access.test.mjs:5",
              "Verification: npm run check -- --test-reporter=dot — 265 tests, 262 passed, 3 skipped, 0 failed"
            ]
          }
        ],
        "facts_superseded": [],
        "impacts_added": [],
        "impacts_updated": [
          {
            "id": "IMPACT-feedback-product-capability-parity",
            "fact_id": "FACT-feedback-daily-work-parity-required",
            "fact_revision": 1,
            "target": {
              "kind": "software_decision",
              "ref": "product_capabilities",
              "revision": 17
            },
            "effect": "upheld",
            "reason": "V1 兼容/恢复和开发者管理 V2 现均已实现，ArcOrbit 可覆盖已接受的 Feedback 日常处理范围。",
            "gap_ids": [],
            "evidence": [
              "FACT-feedback-v2-management-realized",
              "runtime/arcorbit/desktop/renderer/renderer.js:929",
              "Verification: npm run check -- --test-reporter=dot — 265 tests, 262 passed, 3 skipped, 0 failed"
            ]
          },
          {
            "id": "IMPACT-feedback-realization-gap",
            "fact_id": "FACT-feedback-daily-work-parity-required",
            "fact_revision": 1,
            "target": {
              "kind": "software_invariant",
              "ref": "accepted-facts-are-realized",
              "revision": null
            },
            "effect": "upheld",
            "reason": "直接代码和行为测试兑现了消息、附件、未读、忽略及原子流转契约。",
            "gap_ids": [],
            "evidence": [
              "FACT-feedback-v2-management-realized",
              "runtime/arcorbit/test/platform-coordinator.test.mjs:244",
              "runtime/arcorbit/test/desktop-renderer.test.mjs:221"
            ]
          },
          {
            "id": "IMPACT-feedback-v2-boundary-upheld",
            "fact_id": "FACT-feedback-v2-management-boundary",
            "fact_revision": 2,
            "target": {
              "kind": "software_decision",
              "ref": "external_integrations",
              "revision": 8
            },
            "effect": "upheld",
            "reason": "实现保持受限 adapter、项目门禁、逐动作失败关闭和产品反馈 SDK 隔离。",
            "gap_ids": [],
            "evidence": [
              "runtime/arcorbit/src/workshop-platform-adapter.mjs:103",
              "runtime/arcorbit/desktop/preload.cjs:50",
              "runtime/arcorbit/test/desktop-renderer.test.mjs:221"
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
            "area_ref": "external_integrations",
            "observed_revision": 7,
            "set_decision": {
              "status": "settled",
              "statement": "ArcOrbit integrates with Codex app-server/CLI and Workshop through explicit main-process adapters; trusted ledger entrypoints remain repository-owned. Workshop authentication preserves server-rotated credentials and the rolling seven-day inactivity contract. The Automation adapter remains executor-scoped, while the separate Platform Adapter reads organization, project, membership, full project task and Feedback domains. The developer-side Feedback V2 management contract is implemented through a separately restricted Platform Adapter with authenticated fixed V2 routes, project flags, per-action fail-closed degradation, controlled message attachments, notifications/read state, dedicated ignore and atomic task conversion; it requires no real-environment prevalidation. ArcOrbit 自身产品反馈独立使用 Feedback SDK WebView V2 的 API Key 直连契约；它不启用或替代 Workset Feedback V2 管理 adapter，也不推断未确认的宿主 Session endpoint。 The Workshop integration accepts both the versioned project WebSocket plus authorized cursor replay API and the previous no-ID WebSocket notification contract. Modern connections catch up and deduplicate by event ID and handle cursor expiry by full refresh; legacy connections treat notifications as invalidations and refresh current state on connect. ArcOrbit uses 15-minute reconciliation and explicit immediate sync instead of disconnected minute polling.",
              "reason": "已接受的前端 V2 管理契约现已在受限 Platform Adapter、Coordinator、typed IPC 和 Renderer 中实现并通过完整检查。",
              "evidence": [
                "FACT-feedback-v2-management-realized",
                "runtime/arcorbit/src/workshop-platform-adapter.mjs",
                "runtime/arcorbit/src/platform-coordinator.mjs",
                "runtime/arcorbit/desktop/preload.cjs",
                "runtime/arcorbit/desktop/renderer/renderer.js",
                "arckit/tech/arcorbit/platform-composition-solution.md"
              ],
              "confidence": "high",
              "resume_condition": "Revisit when the Workshop-Feedbacks frontend contract, project rollout flags, Workshop authentication boundary, attachment credential model, or developer-management failure semantics change."
            },
            "gap_refs": [],
            "reason": "Project 集成决策从可实施契约同步为已实现事实。",
            "evidence": [
              "FACT-feedback-v2-management-realized",
              "Verification: npm run check -- --test-reporter=dot — 265 tests, 262 passed, 3 skipped, 0 failed"
            ]
          }
        ],
        "software_invariant_changes": [],
        "project_gap_changes": [],
        "selection_context_change": null,
        "evidence": [
          "FACT-feedback-v2-management-realized",
          "runtime/arcorbit/src/workshop-platform-adapter.mjs",
          "runtime/arcorbit/src/platform-coordinator.mjs",
          "runtime/arcorbit/desktop/renderer/renderer.js"
        ]
      },
      "invariant_assessment": {
        "project_revision": 169,
        "judgments": [
          {
            "invariant_ref": "product-expectations-remain-recoverable",
            "disposition": "upheld",
            "reason": "开发者管理 V2 的范围、门禁、失败行为和 SDK 隔离仍由持久规格表达，实际实现与其一致。",
            "fact_refs": [
              "FACT-feedback-v2-management-realized"
            ],
            "evidence": [
              "arckit/spec/agentic-software-development/arcorbit-platform-capabilities.md:300",
              "runtime/arcorbit/desktop/renderer/renderer.js:929"
            ],
            "gap_refs": []
          },
          {
            "invariant_ref": "interaction-expectations-remain-recoverable",
            "disposition": "upheld",
            "reason": "消息、回复附件、未读/已读、原子流转和逐动作恢复均与持久交互事实一致。",
            "fact_refs": [
              "FACT-feedback-v2-management-realized"
            ],
            "evidence": [
              "arckit/interaction/platform-workspace/interaction.md:23",
              "runtime/arcorbit/desktop/renderer/renderer.js:929"
            ],
            "gap_refs": []
          },
          {
            "invariant_ref": "visual-language-remains-consistent",
            "disposition": "not_relevant",
            "reason": "本轮复用既有 Desktop token 和组件样式实现会话状态，没有建立或修改持久视觉语言规则。",
            "fact_refs": [],
            "evidence": [],
            "gap_refs": []
          },
          {
            "invariant_ref": "technical-decisions-remain-explainable",
            "disposition": "upheld",
            "reason": "固定 V2 路由、受限 adapter、Coordinator、专用 IPC、项目门禁和产品反馈 SDK 隔离均有持久方案与直接代码证据。",
            "fact_refs": [
              "FACT-feedback-v2-management-boundary",
              "FACT-feedback-v2-management-realized"
            ],
            "evidence": [
              "arckit/tech/arcorbit/platform-composition-solution.md:137",
              "runtime/arcorbit/src/platform-coordinator.mjs:395",
              "runtime/arcorbit/desktop/preload.cjs:50"
            ],
            "gap_refs": []
          },
          {
            "invariant_ref": "accepted-facts-are-realized",
            "disposition": "upheld",
            "reason": "代码与行为测试直接兑现已接受的开发者管理 V2 契约，并保留 V1 管理与关联恢复。",
            "fact_refs": [
              "FACT-feedback-daily-work-parity-required",
              "FACT-feedback-v2-management-boundary",
              "FACT-feedback-v2-management-realized"
            ],
            "evidence": [
              "runtime/arcorbit/test/workshop-platform-adapter.test.mjs:5",
              "runtime/arcorbit/test/platform-coordinator.test.mjs:244",
              "runtime/arcorbit/test/desktop-renderer.test.mjs:221",
              "Verification: npm run check -- --test-reporter=dot — 265 tests, 262 passed, 3 skipped, 0 failed"
            ],
            "gap_refs": []
          },
          {
            "invariant_ref": "material-risks-have-credible-evidence",
            "disposition": "upheld",
            "reason": "项目门禁、固定路由、附件 HTTPS/大小限制、逐功能失败隔离、专用 IPC、401/404 恢复和 SDK 隔离均有重复执行的自动化证据。",
            "fact_refs": [
              "FACT-feedback-v2-management-boundary",
              "FACT-feedback-v2-management-realized"
            ],
            "evidence": [
              "runtime/arcorbit/test/feedback-v2-attachment-access.test.mjs:5",
              "runtime/arcorbit/test/platform-coordinator.test.mjs:292",
              "runtime/arcorbit/test/desktop-renderer.test.mjs:221",
              "Verification: npm run check -- --test-reporter=dot — 265 tests, 262 passed, 3 skipped, 0 failed"
            ],
            "gap_refs": []
          }
        ]
      },
      "evidence": [
        "runtime/arcorbit/src/task-source-adapter.mjs",
        "runtime/arcorbit/src/workshop-platform-adapter.mjs",
        "runtime/arcorbit/src/feedback-v2-attachment-access.mjs",
        "runtime/arcorbit/src/platform-coordinator.mjs",
        "runtime/arcorbit/desktop/main.mjs",
        "runtime/arcorbit/desktop/preload.cjs",
        "runtime/arcorbit/desktop/renderer/renderer.js",
        "runtime/arcorbit/test/feedback-v2-attachment-access.test.mjs",
        "runtime/arcorbit/test/workshop-platform-adapter.test.mjs",
        "runtime/arcorbit/test/platform-coordinator.test.mjs",
        "runtime/arcorbit/test/task-source-adapter.test.mjs",
        "runtime/arcorbit/test/desktop-renderer.test.mjs",
        "Verification: npm run check -- --test-reporter=dot — 265 tests, 262 passed, 3 skipped, 0 failed",
        "Verification: git diff --check — passed",
        "Verification: arckit-case-transition/v8 validation and dry-run — passed"
      ],
      "runtime_result_ref": "arckit-runtime://runs/RUN-20260822-195742396Z",
      "occurred_at": "2026-08-22T20:30:36.835Z"
    },
    {
      "round": 6,
      "transition_schema_version": "arckit-case-transition/v8",
      "goal": "审查 content revision 5 的实现正确性、问题闭合、验证可信度、回归风险与最小性。",
      "outcome": "completed",
      "gap_selection": {
        "mode": "candidate",
        "basis": "全部普通 Case Gap 和 impacts 已闭合，completion review 是唯一 ready Case candidate；四个 Project Gap 均需独立 Case。",
        "snapshot_token": "d88bde114fe406217bb924e92829a73daf2e55bbab56e2b2a5ad639f58c83d0f",
        "selected_ref": "case-gap:CASE-20260822-004:CASE-20260822-004:completion-review:1",
        "comparison_summary": "选择阻塞当前 Case 关闭的 completion review；四个 Project Gap 全部因 case_required 而 deferred。",
        "fresh_discovery_summary": "审查 content revision 5 后发现三个实现/证据 finding；它们由本轮 review 生成后续 repair gaps，本轮不继续修复。",
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
            "reason": "需要独立 Case，不能替代当前 Case completion review。"
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
            "reason": "需要独立 Case，不能替代当前 Case completion review。"
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
            "reason": "需要独立 Case；operator 对本事项的真实环境验证豁免仍有效。"
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
            "reason": "需要独立 Case，不能替代实现聚焦的 completion review。"
          },
          {
            "ref": "case-gap:CASE-20260822-004:CASE-20260822-004:completion-review:1",
            "source": "persisted",
            "eligibility": "ready",
            "disposition": "selected",
            "priority_basis": {
              "blocking": "high",
              "uncertainty": "low",
              "risk": "high",
              "user_impact": "high"
            },
            "reason": "全部普通义务已闭合，这是当前 Case 唯一 ready candidate。"
          }
        ]
      },
      "selected_gap": {
        "id": "CASE-20260822-004:completion-review:1",
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
        "goal": "审查 content revision 5 的实现正确性、问题闭合、验证可信度、回归风险与最小性。",
        "expected_state_change": "记录 completion review findings，并派生 agent-owned repair gaps；不在 review 轮修改实现。"
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
          "reviewed_content_revision": 5,
          "dimensions": {
            "implementation_correctness": "findings",
            "problem_resolution": "findings",
            "verification_credibility": "findings",
            "regression_risk": "findings",
            "minimality": "findings"
          },
          "findings": [
            {
              "id": "CR-feedback-v2-rollout-default",
              "kind": "excess",
              "statement": "Feedback V2 production defaults use '*' when rollout environment variables are absent, while the accepted frontend contract defaults to an empty explicit project allowlist. This silently attempts V2 for V1-only projects and can mark otherwise healthy workspaces degraded.",
              "responsibility": "agent",
              "artifact_refs": [
                "runtime/arcorbit/src/task-source-adapter.mjs"
              ],
              "evidence": [
                "runtime/arcorbit/src/task-source-adapter.mjs:31",
                "../../hoewo/Workshop-Feedbacks/webapps/feedback-console-web/src/lib/api/feedbackV2Client.ts:23"
              ]
            },
            {
              "id": "CR-feedback-v2-ipc-error-contract",
              "kind": "omission",
              "statement": "Renderer 的 401 登录回收与 404 事实刷新依赖 ipcRenderer.invoke rejection 上的自定义 status/code 字段，但 main/preload 没有定义 typed success/error envelope，现有测试也只做静态字符串检查，没有执行这些恢复分支。",
              "responsibility": "agent",
              "artifact_refs": [
                "runtime/arcorbit/desktop/main.mjs",
                "runtime/arcorbit/desktop/preload.cjs",
                "runtime/arcorbit/desktop/renderer/renderer.js",
                "runtime/arcorbit/test/desktop-renderer.test.mjs"
              ],
              "evidence": [
                "runtime/arcorbit/desktop/preload.cjs:50",
                "runtime/arcorbit/desktop/renderer/renderer.js:1393",
                "runtime/arcorbit/test/desktop-renderer.test.mjs:221"
              ]
            },
            {
              "id": "CR-feedback-v2-renderer-url-boundary",
              "kind": "error",
              "statement": "Feedback V2 attachment normalization includes a direct HTTPS url field in the message object returned to Renderer, contradicting the accepted boundary that Workset Feedback Renderer must not receive attachment URLs; the structural IPC test does not assert the returned payload shape.",
              "responsibility": "agent",
              "artifact_refs": [
                "runtime/arcorbit/src/workshop-platform-adapter.mjs",
                "runtime/arcorbit/test/workshop-platform-adapter.test.mjs",
                "runtime/arcorbit/test/desktop-renderer.test.mjs"
              ],
              "evidence": [
                "runtime/arcorbit/src/workshop-platform-adapter.mjs:436",
                "runtime/arcorbit/src/workshop-platform-adapter.mjs:443",
                "FACT-feedback-v2-management-boundary"
              ]
            }
          ],
          "evidence": [
            "runtime/arcorbit/src/task-source-adapter.mjs:31",
            "../../hoewo/Workshop-Feedbacks/webapps/feedback-console-web/src/lib/api/feedbackV2Client.ts:23",
            "runtime/arcorbit/desktop/renderer/renderer.js:1393",
            "runtime/arcorbit/src/workshop-platform-adapter.mjs:443",
            "Verification: npm run check -- --test-reporter=dot — 265 tests, 262 passed, 3 skipped, 0 failed",
            "Verification: git diff --check — passed"
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
        "project_revision": 170,
        "judgments": [
          {
            "invariant_ref": "product-expectations-remain-recoverable",
            "disposition": "threatened",
            "reason": "持久产品边界要求项目门禁，当前默认全项目启用与参考前端显式 allowlist 不一致。",
            "fact_refs": [
              "FACT-feedback-v2-management-boundary",
              "FACT-feedback-v2-management-realized"
            ],
            "evidence": [
              "runtime/arcorbit/src/task-source-adapter.mjs:31",
              "../../hoewo/Workshop-Feedbacks/webapps/feedback-console-web/src/lib/api/feedbackV2Client.ts:23"
            ],
            "gap_refs": [
              "CASE-20260822-004:review-finding:CR-feedback-v2-rollout-default"
            ]
          },
          {
            "invariant_ref": "interaction-expectations-remain-recoverable",
            "disposition": "threatened",
            "reason": "401/404 恢复语义已写入交互事实，但缺少稳定 typed IPC error contract 和可执行行为证据。",
            "fact_refs": [
              "FACT-feedback-v2-management-realized"
            ],
            "evidence": [
              "runtime/arcorbit/desktop/renderer/renderer.js:1393"
            ],
            "gap_refs": [
              "CASE-20260822-004:review-finding:CR-feedback-v2-ipc-error-contract"
            ]
          },
          {
            "invariant_ref": "visual-language-remains-consistent",
            "disposition": "not_relevant",
            "reason": "Review findings 涉及 rollout、IPC 错误和附件数据边界，不建立或修改视觉语言规则。",
            "fact_refs": [],
            "evidence": [],
            "gap_refs": []
          },
          {
            "invariant_ref": "technical-decisions-remain-explainable",
            "disposition": "threatened",
            "reason": "实际默认 rollout 和 Renderer payload 与已接受的项目门禁及 URL 隔离边界不一致。",
            "fact_refs": [
              "FACT-feedback-v2-management-boundary",
              "FACT-feedback-v2-management-realized"
            ],
            "evidence": [
              "runtime/arcorbit/src/task-source-adapter.mjs:31",
              "runtime/arcorbit/src/workshop-platform-adapter.mjs:443"
            ],
            "gap_refs": [
              "CASE-20260822-004:review-finding:CR-feedback-v2-rollout-default",
              "CASE-20260822-004:review-finding:CR-feedback-v2-renderer-url-boundary"
            ]
          },
          {
            "invariant_ref": "accepted-facts-are-realized",
            "disposition": "threatened",
            "reason": "核心能力已实现，但显式项目门禁、Renderer 无 URL 和确定性 401/404 恢复三项已接受主张尚未完整兑现。",
            "fact_refs": [
              "FACT-feedback-v2-management-boundary",
              "FACT-feedback-v2-management-realized"
            ],
            "evidence": [
              "runtime/arcorbit/src/task-source-adapter.mjs:31",
              "runtime/arcorbit/desktop/renderer/renderer.js:1393",
              "runtime/arcorbit/src/workshop-platform-adapter.mjs:443"
            ],
            "gap_refs": [
              "CASE-20260822-004:review-finding:CR-feedback-v2-rollout-default",
              "CASE-20260822-004:review-finding:CR-feedback-v2-ipc-error-contract",
              "CASE-20260822-004:review-finding:CR-feedback-v2-renderer-url-boundary"
            ]
          },
          {
            "invariant_ref": "material-risks-have-credible-evidence",
            "disposition": "threatened",
            "reason": "完整测试通过，但没有执行 401/404 Renderer 恢复且没有断言 Renderer payload 排除 URL，风险证据不足。",
            "fact_refs": [
              "FACT-feedback-v2-management-boundary",
              "FACT-feedback-v2-management-realized"
            ],
            "evidence": [
              "runtime/arcorbit/test/desktop-renderer.test.mjs:221",
              "Verification: npm run check -- --test-reporter=dot — 265 tests, 262 passed, 3 skipped, 0 failed"
            ],
            "gap_refs": [
              "CASE-20260822-004:review-finding:CR-feedback-v2-ipc-error-contract",
              "CASE-20260822-004:review-finding:CR-feedback-v2-renderer-url-boundary"
            ]
          }
        ]
      },
      "evidence": [
        "runtime/arcorbit/src/task-source-adapter.mjs:31",
        "../../hoewo/Workshop-Feedbacks/webapps/feedback-console-web/src/lib/api/feedbackV2Client.ts:23",
        "runtime/arcorbit/desktop/renderer/renderer.js:1393",
        "runtime/arcorbit/src/workshop-platform-adapter.mjs:443",
        "runtime/arcorbit/test/desktop-renderer.test.mjs:221",
        "Verification: npm run check -- --test-reporter=dot — 265 tests, 262 passed, 3 skipped, 0 failed",
        "Verification: git diff --check — passed",
        "Verification: arckit-case-transition/v8 validation — passed",
        "Verification: ledger apply dry-run — passed; three deterministic repair gaps projected"
      ],
      "runtime_result_ref": "arckit-runtime://runs/RUN-20260822-195742396Z",
      "occurred_at": "2026-08-22T20:35:06.787Z"
    },
    {
      "round": 7,
      "transition_schema_version": "arckit-case-transition/v8",
      "goal": "从 Feedback V2 message attachment 投影中移除直接 URL，并用行为测试证明上游 URL 不会进入 Renderer payload，同时保留 main-process 即时签名打开路径。",
      "outcome": "completed",
      "gap_selection": {
        "mode": "candidate",
        "basis": "三个 ready review findings 均阻塞 Case 闭合；Renderer URL 边界直接违反已接受的 main-process 隔离，安全风险最高且可独立修复验证。",
        "snapshot_token": "6b8130875c66919d9c32c63673805f91ad5b0607c27ea17c8d2da4baf08a40d6",
        "selected_ref": "case-gap:CASE-20260822-004:CASE-20260822-004:review-finding:CR-feedback-v2-renderer-url-boundary",
        "comparison_summary": "选择直接泄露受限附件 URL 的 error finding；rollout 默认值和 IPC error contract 仍为独立 ready findings，四个 Project gaps 均需独立 Case。",
        "fresh_discovery_summary": "检查现有 Renderer 与 main-process 附件打开路径后确认不需要新的前置事实；未发现改变本轮修复对象或验收边界的 fresh candidate。",
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
            "reason": "需要独立 Case，不能替代当前 Feedback review finding。"
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
            "reason": "需要独立 Case，且不直接修复当前附件数据边界。"
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
            "reason": "需要独立 Case；本轮用确定性 payload 测试修复已知 Renderer 边界。"
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
            "reason": "需要独立 Case，不能替代当前实现修复。"
          },
          {
            "ref": "case-gap:CASE-20260822-004:CASE-20260822-004:review-finding:CR-feedback-v2-rollout-default",
            "source": "persisted",
            "eligibility": "ready",
            "disposition": "deferred",
            "priority_basis": {
              "blocking": "high",
              "uncertainty": "",
              "risk": "high",
              "user_impact": ""
            },
            "reason": "重要但不涉及直接跨越 Renderer trust boundary；留待 fresh round。"
          },
          {
            "ref": "case-gap:CASE-20260822-004:CASE-20260822-004:review-finding:CR-feedback-v2-ipc-error-contract",
            "source": "persisted",
            "eligibility": "ready",
            "disposition": "deferred",
            "priority_basis": {
              "blocking": "high",
              "uncertainty": "",
              "risk": "high",
              "user_impact": ""
            },
            "reason": "需要 typed error envelope 与行为测试，独立于本轮附件 payload 修复。"
          },
          {
            "ref": "case-gap:CASE-20260822-004:CASE-20260822-004:review-finding:CR-feedback-v2-renderer-url-boundary",
            "source": "persisted",
            "eligibility": "ready",
            "disposition": "selected",
            "priority_basis": {
              "blocking": "high",
              "uncertainty": "",
              "risk": "high",
              "user_impact": ""
            },
            "reason": "直接违反已接受的受限 main-process 数据边界，安全风险最高且修复范围明确。"
          }
        ]
      },
      "selected_gap": {
        "id": "CASE-20260822-004:review-finding:CR-feedback-v2-renderer-url-boundary",
        "responsibility": "agent",
        "goal": "Resolve review finding: Feedback V2 attachment normalization includes a direct HTTPS url field in the message object returned to Renderer, contradicting the accepted boundary that Workset Feedback Renderer must not receive attachment URLs; the structural IPC test does not assert the returned payload shape.",
        "reason": "error found by completion review",
        "derived_from": [
          "completion_review",
          "content_revision:5"
        ],
        "blocked_by": [],
        "priority_basis": {
          "blocking": "high",
          "uncertainty": "",
          "risk": "high",
          "user_impact": ""
        },
        "evidence_required": [
          "runtime/arcorbit/src/workshop-platform-adapter.mjs",
          "runtime/arcorbit/test/workshop-platform-adapter.test.mjs",
          "runtime/arcorbit/test/desktop-renderer.test.mjs",
          "runtime/arcorbit/src/workshop-platform-adapter.mjs:436",
          "runtime/arcorbit/src/workshop-platform-adapter.mjs:443",
          "FACT-feedback-v2-management-boundary"
        ]
      },
      "planned_transition": {
        "goal": "从 Feedback V2 message attachment 投影中移除直接 URL，并用行为测试证明上游 URL 不会进入 Renderer payload，同时保留 main-process 即时签名打开路径。",
        "expected_state_change": "解决 Renderer URL boundary review finding；其余两个 review findings 保持 open。"
      },
      "accepted_state_delta": {
        "resolved_gap": {
          "id": "CASE-20260822-004:review-finding:CR-feedback-v2-renderer-url-boundary",
          "status": "resolved",
          "outcome": "Feedback V2 message attachment 只向 Renderer 投影 id、type、object_key 和安全显示元数据，不再投影直接 URL；附件仍通过受限 main-process action 即时取得签名 URL 后打开。",
          "reason": "Adapter payload normalization 已删除 URL，行为测试以包含 HTTPS URL 的服务端响应证明其不会穿过边界，完整 ArcOrbit 检查无回归。",
          "evidence": [
            "runtime/arcorbit/src/workshop-platform-adapter.mjs:436",
            "runtime/arcorbit/test/workshop-platform-adapter.test.mjs:13",
            "runtime/arcorbit/test/workshop-platform-adapter.test.mjs:33",
            "runtime/arcorbit/desktop/renderer/renderer.js:955",
            "runtime/arcorbit/desktop/main.mjs:375",
            "Verification: targeted Feedback tests — 30 passed, 0 failed",
            "Verification: npm run check -- --test-reporter=dot — 265 tests, 262 passed, 3 skipped, 0 failed",
            "Verification: git diff --check — passed"
          ]
        },
        "facts_added": [],
        "facts_superseded": [],
        "impacts_added": [],
        "impacts_updated": [
          {
            "id": "IMPACT-feedback-v2-boundary-upheld",
            "fact_id": "FACT-feedback-v2-management-boundary",
            "fact_revision": 2,
            "target": {
              "kind": "software_decision",
              "ref": "external_integrations",
              "revision": 8
            },
            "effect": "upheld",
            "reason": "V2 message payload 现只携带附件标识与显示元数据，直接 URL 和临时凭据均停留在 main process 的受限即时打开路径。",
            "gap_ids": [],
            "evidence": [
              "runtime/arcorbit/src/workshop-platform-adapter.mjs:436",
              "runtime/arcorbit/test/workshop-platform-adapter.test.mjs:33",
              "runtime/arcorbit/desktop/main.mjs:375"
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
        "project_revision": 170,
        "judgments": [
          {
            "invariant_ref": "product-expectations-remain-recoverable",
            "disposition": "threatened",
            "reason": "附件 URL 边界已修复，但 V2 默认全项目启用仍与持久显式 allowlist 预期不一致。",
            "fact_refs": [
              "FACT-feedback-v2-management-boundary",
              "FACT-feedback-v2-management-realized"
            ],
            "evidence": [
              "runtime/arcorbit/src/workshop-platform-adapter.mjs:436"
            ],
            "gap_refs": [
              "CASE-20260822-004:review-finding:CR-feedback-v2-rollout-default"
            ]
          },
          {
            "invariant_ref": "interaction-expectations-remain-recoverable",
            "disposition": "threatened",
            "reason": "附件打开交互保持可恢复，但 401/404 恢复仍缺少稳定 typed IPC error contract 和行为证据。",
            "fact_refs": [
              "FACT-feedback-v2-management-realized"
            ],
            "evidence": [
              "runtime/arcorbit/desktop/renderer/renderer.js:955",
              "runtime/arcorbit/desktop/main.mjs:375"
            ],
            "gap_refs": [
              "CASE-20260822-004:review-finding:CR-feedback-v2-ipc-error-contract"
            ]
          },
          {
            "invariant_ref": "visual-language-remains-consistent",
            "disposition": "not_relevant",
            "reason": "本轮只收紧附件数据投影并补充测试，不建立或修改视觉语言规则。",
            "fact_refs": [],
            "evidence": [],
            "gap_refs": []
          },
          {
            "invariant_ref": "technical-decisions-remain-explainable",
            "disposition": "threatened",
            "reason": "附件 URL 隔离已由代码与测试兑现，但项目 rollout 默认值仍偏离已接受的显式门禁。",
            "fact_refs": [
              "FACT-feedback-v2-management-boundary",
              "FACT-feedback-v2-management-realized"
            ],
            "evidence": [
              "runtime/arcorbit/src/workshop-platform-adapter.mjs:436",
              "runtime/arcorbit/test/workshop-platform-adapter.test.mjs:33"
            ],
            "gap_refs": [
              "CASE-20260822-004:review-finding:CR-feedback-v2-rollout-default"
            ]
          },
          {
            "invariant_ref": "accepted-facts-are-realized",
            "disposition": "threatened",
            "reason": "Renderer 无附件 URL 的主张现已兑现；显式项目门禁和确定性 401/404 恢复仍未完整兑现。",
            "fact_refs": [
              "FACT-feedback-v2-management-boundary",
              "FACT-feedback-v2-management-realized"
            ],
            "evidence": [
              "runtime/arcorbit/test/workshop-platform-adapter.test.mjs:33"
            ],
            "gap_refs": [
              "CASE-20260822-004:review-finding:CR-feedback-v2-rollout-default",
              "CASE-20260822-004:review-finding:CR-feedback-v2-ipc-error-contract"
            ]
          },
          {
            "invariant_ref": "material-risks-have-credible-evidence",
            "disposition": "threatened",
            "reason": "URL 不进入 Renderer payload 已有行为测试，但 401/404 Renderer 恢复风险仍缺少可执行证据。",
            "fact_refs": [
              "FACT-feedback-v2-management-boundary",
              "FACT-feedback-v2-management-realized"
            ],
            "evidence": [
              "runtime/arcorbit/test/workshop-platform-adapter.test.mjs:13",
              "runtime/arcorbit/test/workshop-platform-adapter.test.mjs:33",
              "Verification: npm run check -- --test-reporter=dot — 265 tests, 262 passed, 3 skipped, 0 failed"
            ],
            "gap_refs": [
              "CASE-20260822-004:review-finding:CR-feedback-v2-ipc-error-contract"
            ]
          }
        ]
      },
      "evidence": [
        "runtime/arcorbit/src/workshop-platform-adapter.mjs:436",
        "runtime/arcorbit/test/workshop-platform-adapter.test.mjs:13",
        "runtime/arcorbit/test/workshop-platform-adapter.test.mjs:33",
        "runtime/arcorbit/desktop/renderer/renderer.js:955",
        "runtime/arcorbit/desktop/main.mjs:375",
        "Verification: targeted Feedback tests — 30 passed, 0 failed",
        "Verification: npm run check -- --test-reporter=dot — 265 tests, 262 passed, 3 skipped, 0 failed",
        "Verification: git diff --check — passed",
        "Verification: arckit-case-transition/v8 validation — passed",
        "Verification: ledger apply dry-run — passed; two repair gaps remain"
      ],
      "runtime_result_ref": "arckit-runtime://runs/RUN-20260822-195742396Z",
      "occurred_at": "2026-08-22T20:38:31.717Z"
    },
    {
      "round": 8,
      "transition_schema_version": "arckit-case-transition/v8",
      "goal": "为专用 Feedback V2 IPC 引入版本化 success/error envelope，在 preload 受控重建 code/status，并以行为测试执行 Renderer 的 401 与 404 恢复。",
      "outcome": "completed",
      "gap_selection": {
        "mode": "candidate",
        "basis": "两个 ready findings 均阻塞 Case 闭合；IPC error contract 同时影响 401 登录回收、404 事实刷新和风险证据，范围更广且恢复失败后果更高。",
        "snapshot_token": "d382210899e36b984856e17f602c0f3c0e383fae1f51fc330f600297ec9b10f0",
        "selected_ref": "case-gap:CASE-20260822-004:CASE-20260822-004:review-finding:CR-feedback-v2-ipc-error-contract",
        "comparison_summary": "选择缺少 typed envelope 和行为验证的 IPC finding；rollout 默认值仍为独立 ready finding，四个 Project gaps 均需独立 Case。",
        "fresh_discovery_summary": "现有 main/preload/Renderer 结构允许以共享版本化 envelope 修复，无需建立新的前置事实；未发现改变本轮对象或验收边界的 fresh candidate。",
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
            "reason": "需要独立 Case，不能替代当前 Feedback review finding。"
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
            "reason": "需要独立 Case；当前专用 Feedback IPC finding 已有明确范围。"
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
            "reason": "需要独立 Case；本轮以确定性 envelope 与 Renderer 行为测试验收。"
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
            "reason": "需要独立 Case，不能替代当前实现修复。"
          },
          {
            "ref": "case-gap:CASE-20260822-004:CASE-20260822-004:review-finding:CR-feedback-v2-rollout-default",
            "source": "persisted",
            "eligibility": "ready",
            "disposition": "deferred",
            "priority_basis": {
              "blocking": "high",
              "uncertainty": "",
              "risk": "high",
              "user_impact": ""
            },
            "reason": "范围较窄且不影响失败恢复信息传递，留待 fresh round。"
          },
          {
            "ref": "case-gap:CASE-20260822-004:CASE-20260822-004:review-finding:CR-feedback-v2-ipc-error-contract",
            "source": "persisted",
            "eligibility": "ready",
            "disposition": "selected",
            "priority_basis": {
              "blocking": "high",
              "uncertainty": "",
              "risk": "high",
              "user_impact": ""
            },
            "reason": "同时阻塞登录回收、事实刷新和可信行为证据，优先级最高。"
          }
        ]
      },
      "selected_gap": {
        "id": "CASE-20260822-004:review-finding:CR-feedback-v2-ipc-error-contract",
        "responsibility": "agent",
        "goal": "Resolve review finding: Renderer 的 401 登录回收与 404 事实刷新依赖 ipcRenderer.invoke rejection 上的自定义 status/code 字段，但 main/preload 没有定义 typed success/error envelope，现有测试也只做静态字符串检查，没有执行这些恢复分支。",
        "reason": "omission found by completion review",
        "derived_from": [
          "completion_review",
          "content_revision:5"
        ],
        "blocked_by": [],
        "priority_basis": {
          "blocking": "high",
          "uncertainty": "",
          "risk": "high",
          "user_impact": ""
        },
        "evidence_required": [
          "runtime/arcorbit/desktop/main.mjs",
          "runtime/arcorbit/desktop/preload.cjs",
          "runtime/arcorbit/desktop/renderer/renderer.js",
          "runtime/arcorbit/test/desktop-renderer.test.mjs",
          "runtime/arcorbit/desktop/preload.cjs:50",
          "runtime/arcorbit/desktop/renderer/renderer.js:1393",
          "runtime/arcorbit/test/desktop-renderer.test.mjs:221"
        ]
      },
      "planned_transition": {
        "goal": "为专用 Feedback V2 IPC 引入版本化 success/error envelope，在 preload 受控重建 code/status，并以行为测试执行 Renderer 的 401 与 404 恢复。",
        "expected_state_change": "解决 IPC error contract review finding；rollout 默认值 finding 保持 open。"
      },
      "accepted_state_delta": {
        "resolved_gap": {
          "id": "CASE-20260822-004:review-finding:CR-feedback-v2-ipc-error-contract",
          "status": "resolved",
          "outcome": "全部专用 Feedback V2 IPC 通过 feedback-v2-ipc-result/v1 envelope 返回，preload 校验 envelope 并重建受控 code/status；Renderer 的 401 登录门禁和 404 事实刷新已有可执行行为测试。",
          "reason": "共享 IPC contract、main handler、preload unwrap 和 Renderer 分支测试共同覆盖 finding 的实现与证据要求，完整 ArcOrbit 检查无回归。",
          "evidence": [
            "runtime/arcorbit/desktop/feedback-v2-ipc.cjs:1",
            "runtime/arcorbit/desktop/main.mjs:350",
            "runtime/arcorbit/desktop/preload.cjs:1",
            "runtime/arcorbit/test/desktop-renderer.test.mjs:258",
            "Verification: targeted Feedback tests — 31 passed, 0 failed",
            "Verification: npm run check -- --test-reporter=dot — 266 tests, 263 passed, 3 skipped, 0 failed",
            "Verification: git diff --check — passed"
          ]
        },
        "facts_added": [],
        "facts_superseded": [],
        "impacts_added": [],
        "impacts_updated": [
          {
            "id": "IMPACT-feedback-v2-boundary-upheld",
            "fact_id": "FACT-feedback-v2-management-boundary",
            "fact_revision": 2,
            "target": {
              "kind": "software_decision",
              "ref": "external_integrations",
              "revision": 8
            },
            "effect": "upheld",
            "reason": "Feedback V2 保持专用 typed IPC：main/preload 共享版本化结果契约，错误仅投影受控 code/status/message；附件 URL 和临时凭据仍停留在 main process。",
            "gap_ids": [],
            "evidence": [
              "runtime/arcorbit/desktop/feedback-v2-ipc.cjs:1",
              "runtime/arcorbit/desktop/main.mjs:350",
              "runtime/arcorbit/desktop/preload.cjs:1",
              "runtime/arcorbit/src/workshop-platform-adapter.mjs:436"
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
        "project_revision": 170,
        "judgments": [
          {
            "invariant_ref": "product-expectations-remain-recoverable",
            "disposition": "threatened",
            "reason": "IPC 恢复和附件边界已修复，但 V2 默认全项目启用仍与持久显式 allowlist 预期不一致。",
            "fact_refs": [
              "FACT-feedback-v2-management-boundary",
              "FACT-feedback-v2-management-realized"
            ],
            "evidence": [
              "runtime/arcorbit/test/desktop-renderer.test.mjs:258"
            ],
            "gap_refs": [
              "CASE-20260822-004:review-finding:CR-feedback-v2-rollout-default"
            ]
          },
          {
            "invariant_ref": "interaction-expectations-remain-recoverable",
            "disposition": "upheld",
            "reason": "版本化 IPC contract 现稳定传递错误语义，行为测试直接证明 401 打开登录门禁、404 静默刷新事实。",
            "fact_refs": [
              "FACT-feedback-v2-management-realized"
            ],
            "evidence": [
              "arckit/interaction/platform-workspace/interaction.md:23",
              "runtime/arcorbit/desktop/feedback-v2-ipc.cjs:1",
              "runtime/arcorbit/test/desktop-renderer.test.mjs:258"
            ],
            "gap_refs": []
          },
          {
            "invariant_ref": "visual-language-remains-consistent",
            "disposition": "not_relevant",
            "reason": "本轮只维护 IPC 错误契约和恢复测试，不建立或修改视觉语言规则。",
            "fact_refs": [],
            "evidence": [],
            "gap_refs": []
          },
          {
            "invariant_ref": "technical-decisions-remain-explainable",
            "disposition": "threatened",
            "reason": "专用 typed IPC 与 main-process 边界现已兑现，但项目 rollout 默认值仍偏离已接受的显式门禁。",
            "fact_refs": [
              "FACT-feedback-v2-management-boundary",
              "FACT-feedback-v2-management-realized"
            ],
            "evidence": [
              "runtime/arcorbit/desktop/feedback-v2-ipc.cjs:1",
              "runtime/arcorbit/desktop/main.mjs:350",
              "runtime/arcorbit/desktop/preload.cjs:1"
            ],
            "gap_refs": [
              "CASE-20260822-004:review-finding:CR-feedback-v2-rollout-default"
            ]
          },
          {
            "invariant_ref": "accepted-facts-are-realized",
            "disposition": "threatened",
            "reason": "Renderer 附件边界及确定性 401/404 恢复现已兑现；显式项目 rollout 门禁仍未完整兑现。",
            "fact_refs": [
              "FACT-feedback-v2-management-boundary",
              "FACT-feedback-v2-management-realized"
            ],
            "evidence": [
              "runtime/arcorbit/test/desktop-renderer.test.mjs:258",
              "runtime/arcorbit/test/workshop-platform-adapter.test.mjs:33"
            ],
            "gap_refs": [
              "CASE-20260822-004:review-finding:CR-feedback-v2-rollout-default"
            ]
          },
          {
            "invariant_ref": "material-risks-have-credible-evidence",
            "disposition": "threatened",
            "reason": "401/404 恢复与 URL 隔离已有行为证据，但默认全项目 rollout 仍可能使 V1-only workspace 无故降级。",
            "fact_refs": [
              "FACT-feedback-v2-management-boundary",
              "FACT-feedback-v2-management-realized"
            ],
            "evidence": [
              "runtime/arcorbit/test/desktop-renderer.test.mjs:258",
              "runtime/arcorbit/test/workshop-platform-adapter.test.mjs:33",
              "Verification: npm run check -- --test-reporter=dot — 266 tests, 263 passed, 3 skipped, 0 failed"
            ],
            "gap_refs": [
              "CASE-20260822-004:review-finding:CR-feedback-v2-rollout-default"
            ]
          }
        ]
      },
      "evidence": [
        "runtime/arcorbit/desktop/feedback-v2-ipc.cjs:1",
        "runtime/arcorbit/desktop/main.mjs:350",
        "runtime/arcorbit/desktop/preload.cjs:1",
        "runtime/arcorbit/desktop/renderer/renderer.js:1393",
        "runtime/arcorbit/test/desktop-renderer.test.mjs:258",
        "Verification: targeted Feedback tests — 31 passed, 0 failed",
        "Verification: npm run check -- --test-reporter=dot — 266 tests, 263 passed, 3 skipped, 0 failed",
        "Verification: git diff --check — passed",
        "Verification: arckit-case-transition/v8 validation — passed",
        "Verification: ledger apply dry-run — passed; rollout finding remains"
      ],
      "runtime_result_ref": "arckit-runtime://runs/RUN-20260822-195742396Z",
      "occurred_at": "2026-08-22T20:42:30.041Z"
    },
    {
      "round": 9,
      "transition_schema_version": "arckit-case-transition/v8",
      "goal": "将 Feedback V2 工作流与通知的生产默认值收紧为空 allowlist，并用行为测试证明默认关闭、显式通配才启用。",
      "outcome": "completed",
      "gap_selection": {
        "mode": "candidate",
        "basis": "唯一 ready Case gap 直接威胁显式项目门禁、实际能力兑现和 V1-only workspace 稳定性；四个 Project gaps 均需独立 Case。",
        "snapshot_token": "d5f806b508977f36ba3cc666eaeca3f15704bd02e22adc7abcb14af02d6ee0b4",
        "selected_ref": "case-gap:CASE-20260822-004:CASE-20260822-004:review-finding:CR-feedback-v2-rollout-default",
        "comparison_summary": "选择唯一 ready 的 rollout default finding；四个 Project gaps 均因 case_required 暂缓。",
        "fresh_discovery_summary": "源码与参考前端共同确认缺失配置应解析为空 allowlist，且现有 matcher 已支持显式项目列表和显式通配；未发现改变本轮对象或验收边界的 fresh candidate。",
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
            "reason": "需要独立 Case，不能替代当前 Feedback review finding。"
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
            "reason": "需要独立 Case；当前 rollout finding 已有明确实现和验收边界。"
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
            "reason": "需要独立 Case；本轮只收紧既有项目门禁，不扩展真实资源验证。"
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
            "reason": "需要独立 Case，不能替代当前实现修复。"
          },
          {
            "ref": "case-gap:CASE-20260822-004:CASE-20260822-004:review-finding:CR-feedback-v2-rollout-default",
            "source": "persisted",
            "eligibility": "ready",
            "disposition": "selected",
            "priority_basis": {
              "blocking": "high",
              "uncertainty": "",
              "risk": "high",
              "user_impact": ""
            },
            "reason": "唯一 ready Case gap，且默认全项目启用会使 V1-only workspace 无故尝试 V2 并降级。"
          }
        ]
      },
      "selected_gap": {
        "id": "CASE-20260822-004:review-finding:CR-feedback-v2-rollout-default",
        "responsibility": "agent",
        "goal": "Resolve review finding: Feedback V2 production defaults use '*' when rollout environment variables are absent, while the accepted frontend contract defaults to an empty explicit project allowlist. This silently attempts V2 for V1-only projects and can mark otherwise healthy workspaces degraded.",
        "reason": "excess found by completion review",
        "derived_from": [
          "completion_review",
          "content_revision:5"
        ],
        "blocked_by": [],
        "priority_basis": {
          "blocking": "high",
          "uncertainty": "",
          "risk": "high",
          "user_impact": ""
        },
        "evidence_required": [
          "runtime/arcorbit/src/task-source-adapter.mjs",
          "runtime/arcorbit/src/task-source-adapter.mjs:31",
          "../../hoewo/Workshop-Feedbacks/webapps/feedback-console-web/src/lib/api/feedbackV2Client.ts:23"
        ]
      },
      "planned_transition": {
        "goal": "将 Feedback V2 工作流与通知的生产默认值收紧为空 allowlist，并用行为测试证明默认关闭、显式通配才启用。",
        "expected_state_change": "解决 rollout default review finding；普通实现 Gap 全部闭合，Case 等待对最新 content revision 执行 completion review。"
      },
      "accepted_state_delta": {
        "resolved_gap": {
          "id": "CASE-20260822-004:review-finding:CR-feedback-v2-rollout-default",
          "status": "resolved",
          "outcome": "Feedback V2 工作流和通知在缺少环境配置时均保持关闭；只有显式项目 allowlist 或显式 '*' 才启用。",
          "reason": "task source 默认值已与参考前端契约对齐，行为测试同时证明默认关闭和显式通配启用，完整 ArcOrbit 检查无回归。",
          "evidence": [
            "runtime/arcorbit/src/task-source-adapter.mjs:38",
            "runtime/arcorbit/test/task-source-adapter.test.mjs:232",
            "../../hoewo/Workshop-Feedbacks/webapps/feedback-console-web/src/lib/api/feedbackV2Client.ts:23",
            "Verification: targeted Feedback tests — 56 passed, 0 failed",
            "Verification: npm run check -- --test-reporter=dot — 267 tests, 264 passed, 3 skipped, 0 failed",
            "Verification: git diff --check — passed"
          ]
        },
        "facts_added": [],
        "facts_superseded": [],
        "impacts_added": [],
        "impacts_updated": [
          {
            "id": "IMPACT-feedback-v2-boundary-upheld",
            "fact_id": "FACT-feedback-v2-management-boundary",
            "fact_revision": 2,
            "target": {
              "kind": "software_decision",
              "ref": "external_integrations",
              "revision": 8
            },
            "effect": "upheld",
            "reason": "Feedback V2 现在同时保持显式项目 rollout、专用 typed IPC 和 main-process 附件边界；缺失配置不会对 V1-only 项目发起 V2 请求。",
            "gap_ids": [],
            "evidence": [
              "runtime/arcorbit/src/task-source-adapter.mjs:38",
              "runtime/arcorbit/test/task-source-adapter.test.mjs:232",
              "runtime/arcorbit/desktop/feedback-v2-ipc.cjs:1",
              "runtime/arcorbit/src/workshop-platform-adapter.mjs:436"
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
        "project_revision": 170,
        "judgments": [
          {
            "invariant_ref": "product-expectations-remain-recoverable",
            "disposition": "upheld",
            "reason": "持久规格要求的项目门禁已由默认空 allowlist 和显式启用行为兑现，Feedback 日常处理范围仍准确可恢复。",
            "fact_refs": [
              "FACT-feedback-v2-management-boundary",
              "FACT-feedback-v2-management-realized"
            ],
            "evidence": [
              "arckit/spec/agentic-software-development/arcorbit-platform-capabilities.md:300",
              "runtime/arcorbit/src/task-source-adapter.mjs:38",
              "runtime/arcorbit/test/task-source-adapter.test.mjs:232"
            ],
            "gap_refs": []
          },
          {
            "invariant_ref": "interaction-expectations-remain-recoverable",
            "disposition": "upheld",
            "reason": "项目门禁、V1 降级以及 401/404 恢复语义保持一致，已有持久交互事实和可执行恢复测试。",
            "fact_refs": [
              "FACT-feedback-v2-management-realized"
            ],
            "evidence": [
              "arckit/interaction/platform-workspace/interaction.md:23",
              "runtime/arcorbit/test/task-source-adapter.test.mjs:232",
              "runtime/arcorbit/test/desktop-renderer.test.mjs:258"
            ],
            "gap_refs": []
          },
          {
            "invariant_ref": "visual-language-remains-consistent",
            "disposition": "not_relevant",
            "reason": "本轮只收紧 rollout 配置默认值并补充行为测试，不建立或修改视觉语言规则。",
            "fact_refs": [],
            "evidence": [],
            "gap_refs": []
          },
          {
            "invariant_ref": "technical-decisions-remain-explainable",
            "disposition": "upheld",
            "reason": "显式 rollout、固定受限 adapter、typed IPC 和 Renderer 无 URL 边界现在均由持久技术方案、代码与测试一致表达。",
            "fact_refs": [
              "FACT-feedback-v2-management-boundary",
              "FACT-feedback-v2-management-realized"
            ],
            "evidence": [
              "arckit/tech/arcorbit/platform-composition-solution.md:137",
              "runtime/arcorbit/src/task-source-adapter.mjs:38",
              "runtime/arcorbit/desktop/feedback-v2-ipc.cjs:1",
              "runtime/arcorbit/test/workshop-platform-adapter.test.mjs:33"
            ],
            "gap_refs": []
          },
          {
            "invariant_ref": "accepted-facts-are-realized",
            "disposition": "upheld",
            "reason": "显式项目门禁、确定性 401/404 恢复和 Renderer 附件 URL 隔离三项已接受主张均有直接实现与行为测试。",
            "fact_refs": [
              "FACT-feedback-v2-management-boundary",
              "FACT-feedback-v2-management-realized"
            ],
            "evidence": [
              "runtime/arcorbit/test/task-source-adapter.test.mjs:232",
              "runtime/arcorbit/test/desktop-renderer.test.mjs:258",
              "runtime/arcorbit/test/workshop-platform-adapter.test.mjs:33"
            ],
            "gap_refs": []
          },
          {
            "invariant_ref": "material-risks-have-credible-evidence",
            "disposition": "upheld",
            "reason": "默认关闭与显式启用、IPC 401/404 恢复、附件 URL 隔离均有重复执行的行为测试，完整检查覆盖回归风险。",
            "fact_refs": [
              "FACT-feedback-v2-management-boundary",
              "FACT-feedback-v2-management-realized"
            ],
            "evidence": [
              "runtime/arcorbit/test/task-source-adapter.test.mjs:232",
              "runtime/arcorbit/test/desktop-renderer.test.mjs:258",
              "runtime/arcorbit/test/workshop-platform-adapter.test.mjs:33",
              "Verification: npm run check -- --test-reporter=dot — 267 tests, 264 passed, 3 skipped, 0 failed"
            ],
            "gap_refs": []
          }
        ]
      },
      "evidence": [
        "runtime/arcorbit/src/task-source-adapter.mjs:38",
        "runtime/arcorbit/test/task-source-adapter.test.mjs:232",
        "../../hoewo/Workshop-Feedbacks/webapps/feedback-console-web/src/lib/api/feedbackV2Client.ts:23",
        "Verification: targeted Feedback tests — 56 passed, 0 failed",
        "Verification: npm run check -- --test-reporter=dot — 267 tests, 264 passed, 3 skipped, 0 failed",
        "Verification: git diff --check — passed",
        "Verification: arckit-case-transition/v8 validation — passed",
        "Verification: ledger apply dry-run — passed; completion review is next"
      ],
      "runtime_result_ref": "arckit-runtime://runs/RUN-20260822-195742396Z",
      "occurred_at": "2026-08-22T20:46:12.949Z"
    },
    {
      "round": 10,
      "transition_schema_version": "arckit-case-transition/v8",
      "goal": "审查 content revision 8 的实现正确性、问题闭合、验证可信度、回归风险与最小性。",
      "outcome": "completed",
      "gap_selection": {
        "mode": "candidate",
        "basis": "全部普通 Case gaps 和 impacts 已闭合，completion review 是唯一 ready Case candidate；四个 Project gaps 均需独立 Case。",
        "snapshot_token": "5cb0a897542a27e9905f174eb587a46579553ad361c6846159970b99505be655",
        "selected_ref": "case-gap:CASE-20260822-004:CASE-20260822-004:completion-review:2",
        "comparison_summary": "选择阻塞当前 Case 关闭的 content revision 8 completion review；四个 Project gaps 全部因 case_required 而 deferred。",
        "fresh_discovery_summary": "审查发现 Renderer 未遵守独立 notification rollout，且已读成功后不更新本地未读投影；该 finding 由本轮 review 生成 repair gap，本轮不继续修复。",
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
            "reason": "需要独立 Case，不能替代当前 Case completion review。"
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
            "reason": "需要独立 Case，不能替代当前 Case completion review。"
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
            "reason": "需要独立 Case；operator 对本事项的真实环境预验证豁免仍有效。"
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
            "reason": "需要独立 Case，不能替代实现聚焦的 completion review。"
          },
          {
            "ref": "case-gap:CASE-20260822-004:CASE-20260822-004:completion-review:2",
            "source": "persisted",
            "eligibility": "ready",
            "disposition": "selected",
            "priority_basis": {
              "blocking": "high",
              "uncertainty": "low",
              "risk": "high",
              "user_impact": "high"
            },
            "reason": "全部普通义务已闭合，这是当前 Case 唯一 ready candidate。"
          }
        ]
      },
      "selected_gap": {
        "id": "CASE-20260822-004:completion-review:2",
        "responsibility": "agent",
        "goal": "Review the completed implementation for correctness, real problem resolution, verification credibility, regression risk, and minimality.",
        "reason": "All ordinary Case gaps and state impacts are closed.",
        "derived_from": [
          "case_result",
          "content_revision:8"
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
        "goal": "审查 content revision 8 的实现正确性、问题闭合、验证可信度、回归风险与最小性。",
        "expected_state_change": "记录 completion review finding，并派生 agent-owned repair gap；不在 review 轮修改实现。"
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
          "reviewed_content_revision": 8,
          "dimensions": {
            "implementation_correctness": "findings",
            "problem_resolution": "findings",
            "verification_credibility": "findings",
            "regression_risk": "findings",
            "minimality": "clean"
          },
          "findings": [
            {
              "id": "CR-feedback-v2-notification-read-state",
              "kind": "omission",
              "statement": "Feedback V2 notifications rollout 与工作流 rollout 独立，Coordinator 会把 notifications/mark_read 标为 unavailable；但 Renderer 加载任何 V2 会话后仍无条件调用 markFeedbackV2Read，导致合法的 notifications-disabled 项目显示虚假的“已读回写失败”。成功标记已读后 Renderer 也没有清除当前 workspace 的 unread_count/unread_feedback_ids，因此未读数量和圆点会保持陈旧直到后续完整刷新。现有 Renderer 测试只检查方法存在及 401/404 恢复，没有执行这两个 read-state 分支。",
              "responsibility": "agent",
              "artifact_refs": [
                "runtime/arcorbit/src/platform-coordinator.mjs",
                "runtime/arcorbit/desktop/renderer/renderer.js",
                "runtime/arcorbit/test/desktop-renderer.test.mjs"
              ],
              "evidence": [
                "runtime/arcorbit/src/platform-coordinator.mjs:27",
                "runtime/arcorbit/src/platform-coordinator.mjs:35",
                "runtime/arcorbit/desktop/renderer/renderer.js:965",
                "runtime/arcorbit/desktop/renderer/renderer.js:975",
                "runtime/arcorbit/test/desktop-renderer.test.mjs:225"
              ]
            }
          ],
          "evidence": [
            "runtime/arcorbit/src/platform-coordinator.mjs:27",
            "runtime/arcorbit/src/platform-coordinator.mjs:35",
            "runtime/arcorbit/desktop/renderer/renderer.js:965",
            "runtime/arcorbit/desktop/renderer/renderer.js:975",
            "runtime/arcorbit/test/desktop-renderer.test.mjs:225",
            "Verification: npm run check -- --test-reporter=dot — 267 tests, 264 passed, 3 skipped, 0 failed",
            "Verification: git diff --check — passed"
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
        "project_revision": 170,
        "judgments": [
          {
            "invariant_ref": "product-expectations-remain-recoverable",
            "disposition": "threatened",
            "reason": "日常 Feedback 处理要求未读状态如实呈现；notifications-disabled 项目当前会显示虚假失败，成功已读后又保留陈旧未读标记。",
            "fact_refs": [
              "FACT-feedback-daily-work-parity-required",
              "FACT-feedback-v2-management-realized"
            ],
            "evidence": [
              "runtime/arcorbit/src/platform-coordinator.mjs:35",
              "runtime/arcorbit/desktop/renderer/renderer.js:975"
            ],
            "gap_refs": [
              "CASE-20260822-004:review-finding:CR-feedback-v2-notification-read-state"
            ]
          },
          {
            "invariant_ref": "interaction-expectations-remain-recoverable",
            "disposition": "threatened",
            "reason": "持久交互要求逐动作失败关闭和准确未读反馈，但 Renderer 未按 mark_read capability 分支且不在成功后更新可见未读状态。",
            "fact_refs": [
              "FACT-feedback-v2-management-realized"
            ],
            "evidence": [
              "arckit/interaction/platform-workspace/interaction.md:23",
              "runtime/arcorbit/desktop/renderer/renderer.js:965",
              "runtime/arcorbit/desktop/renderer/renderer.js:975"
            ],
            "gap_refs": [
              "CASE-20260822-004:review-finding:CR-feedback-v2-notification-read-state"
            ]
          },
          {
            "invariant_ref": "visual-language-remains-consistent",
            "disposition": "not_relevant",
            "reason": "Finding 涉及 notification capability 和 read-state 行为，不建立或修改视觉语言规则。",
            "fact_refs": [],
            "evidence": [],
            "gap_refs": []
          },
          {
            "invariant_ref": "technical-decisions-remain-explainable",
            "disposition": "threatened",
            "reason": "Coordinator 正确表达独立 notification rollout，但 Renderer 无条件调用 mark-read，跨层行为与已接受的逐功能门禁不一致。",
            "fact_refs": [
              "FACT-feedback-v2-management-boundary",
              "FACT-feedback-v2-management-realized"
            ],
            "evidence": [
              "arckit/tech/arcorbit/platform-composition-solution.md:137",
              "runtime/arcorbit/src/platform-coordinator.mjs:27",
              "runtime/arcorbit/src/platform-coordinator.mjs:35",
              "runtime/arcorbit/desktop/renderer/renderer.js:975"
            ],
            "gap_refs": [
              "CASE-20260822-004:review-finding:CR-feedback-v2-notification-read-state"
            ]
          },
          {
            "invariant_ref": "accepted-facts-are-realized",
            "disposition": "threatened",
            "reason": "V2 消息本身可读取，但 notification-disabled 分支产生虚假失败且成功 read 不更新 UI，尚未完整兑现未读/已读和逐动作降级主张。",
            "fact_refs": [
              "FACT-feedback-v2-management-boundary",
              "FACT-feedback-v2-management-realized"
            ],
            "evidence": [
              "runtime/arcorbit/src/platform-coordinator.mjs:35",
              "runtime/arcorbit/desktop/renderer/renderer.js:975"
            ],
            "gap_refs": [
              "CASE-20260822-004:review-finding:CR-feedback-v2-notification-read-state"
            ]
          },
          {
            "invariant_ref": "material-risks-have-credible-evidence",
            "disposition": "threatened",
            "reason": "完整检查通过，但 Renderer 测试只静态确认 mark-read 方法并执行 401/404；没有覆盖 notifications-disabled 不调用或成功后清除本地 unread 投影。",
            "fact_refs": [
              "FACT-feedback-v2-management-boundary",
              "FACT-feedback-v2-management-realized"
            ],
            "evidence": [
              "runtime/arcorbit/test/desktop-renderer.test.mjs:225",
              "runtime/arcorbit/test/desktop-renderer.test.mjs:258",
              "Verification: npm run check -- --test-reporter=dot — 267 tests, 264 passed, 3 skipped, 0 failed"
            ],
            "gap_refs": [
              "CASE-20260822-004:review-finding:CR-feedback-v2-notification-read-state"
            ]
          }
        ]
      },
      "evidence": [
        "runtime/arcorbit/src/platform-coordinator.mjs:27",
        "runtime/arcorbit/src/platform-coordinator.mjs:35",
        "runtime/arcorbit/desktop/renderer/renderer.js:965",
        "runtime/arcorbit/desktop/renderer/renderer.js:975",
        "runtime/arcorbit/test/desktop-renderer.test.mjs:225",
        "runtime/arcorbit/test/desktop-renderer.test.mjs:258",
        "Verification: npm run check -- --test-reporter=dot — 267 tests, 264 passed, 3 skipped, 0 failed",
        "Verification: git diff --check — passed",
        "Verification: arckit-case-transition/v8 validation — passed",
        "Verification: ledger apply dry-run — passed; one deterministic repair gap projected"
      ],
      "runtime_result_ref": "arckit-runtime://runs/RUN-20260822-195742396Z",
      "occurred_at": "2026-08-22T20:50:03.817Z"
    },
    {
      "round": 11,
      "transition_schema_version": "arckit-case-transition/v8",
      "goal": "让 Renderer 仅在 mark_read capability 可用时回写已读，并在成功后同步扣减 unread_count 与清除当前 feedback 的未读标识，以行为测试覆盖禁用和成功分支。",
      "outcome": "completed",
      "gap_selection": {
        "mode": "candidate",
        "basis": "唯一 ready Case gap 直接威胁独立 notification rollout、可见未读状态准确性和逐动作失败关闭；四个 Project gaps 均需独立 Case。",
        "snapshot_token": "487f3021aaeb746d67fe2a852e7ae64f1d034cfff22385e4ac52eff5540024a8",
        "selected_ref": "case-gap:CASE-20260822-004:CASE-20260822-004:review-finding:CR-feedback-v2-notification-read-state",
        "comparison_summary": "选择唯一 ready 的 notification read-state finding；四个 Project gaps 均因 case_required 暂缓。",
        "fresh_discovery_summary": "实现检查确认 Coordinator 已正确提供独立 mark_read capability，修复对象限定为 Renderer capability 分支及成功后的本地 unread 投影；未发现改变本轮对象或验收边界的 fresh candidate。",
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
            "reason": "需要独立 Case，不能替代当前 Feedback completion-review repair。"
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
            "reason": "需要独立 Case；当前 read-state finding 已有明确实现和验收边界。"
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
            "reason": "需要独立 Case；本轮不扩展真实权限资源验证。"
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
            "reason": "需要独立 Case，不能替代当前实现修复。"
          },
          {
            "ref": "case-gap:CASE-20260822-004:CASE-20260822-004:review-finding:CR-feedback-v2-notification-read-state",
            "source": "persisted",
            "eligibility": "ready",
            "disposition": "selected",
            "priority_basis": {
              "blocking": "high",
              "uncertainty": "",
              "risk": "high",
              "user_impact": ""
            },
            "reason": "唯一 ready Case gap；未修复会在 notifications-disabled 项目制造虚假失败，并在成功 read 后保留陈旧未读数量与圆点。"
          }
        ]
      },
      "selected_gap": {
        "id": "CASE-20260822-004:review-finding:CR-feedback-v2-notification-read-state",
        "responsibility": "agent",
        "goal": "Resolve review finding: Feedback V2 notifications rollout 与工作流 rollout 独立，Coordinator 会把 notifications/mark_read 标为 unavailable；但 Renderer 加载任何 V2 会话后仍无条件调用 markFeedbackV2Read，导致合法的 notifications-disabled 项目显示虚假的“已读回写失败”。成功标记已读后 Renderer 也没有清除当前 workspace 的 unread_count/unread_feedback_ids，因此未读数量和圆点会保持陈旧直到后续完整刷新。现有 Renderer 测试只检查方法存在及 401/404 恢复，没有执行这两个 read-state 分支。",
        "reason": "omission found by completion review",
        "derived_from": [
          "completion_review",
          "content_revision:8"
        ],
        "blocked_by": [],
        "priority_basis": {
          "blocking": "high",
          "uncertainty": "",
          "risk": "high",
          "user_impact": ""
        },
        "evidence_required": [
          "runtime/arcorbit/src/platform-coordinator.mjs",
          "runtime/arcorbit/desktop/renderer/renderer.js",
          "runtime/arcorbit/test/desktop-renderer.test.mjs",
          "runtime/arcorbit/src/platform-coordinator.mjs:27",
          "runtime/arcorbit/src/platform-coordinator.mjs:35",
          "runtime/arcorbit/desktop/renderer/renderer.js:965",
          "runtime/arcorbit/desktop/renderer/renderer.js:975",
          "runtime/arcorbit/test/desktop-renderer.test.mjs:225"
        ]
      },
      "planned_transition": {
        "goal": "让 Renderer 仅在 mark_read capability 可用时回写已读，并在成功后同步扣减 unread_count 与清除当前 feedback 的未读标识，以行为测试覆盖禁用和成功分支。",
        "expected_state_change": "解决 notification read-state review finding；普通实现 Gap 再次全部闭合，Case 等待对最新 content revision 执行 completion review。"
      },
      "accepted_state_delta": {
        "resolved_gap": {
          "id": "CASE-20260822-004:review-finding:CR-feedback-v2-notification-read-state",
          "status": "resolved",
          "outcome": "Renderer 现在尊重独立 mark_read capability：notifications-disabled 时跳过已读回写且不显示虚假失败；成功回写时按 marked_count 更新 workspace 未读数量并移除当前 feedback 的未读标识。",
          "reason": "Renderer 实现和可执行行为测试覆盖 capability 禁用及成功 read-state 两个分支，定向与完整 ArcOrbit 检查均无回归。",
          "evidence": [
            "runtime/arcorbit/src/platform-coordinator.mjs:27",
            "runtime/arcorbit/src/platform-coordinator.mjs:35",
            "runtime/arcorbit/desktop/renderer/renderer.js:929",
            "runtime/arcorbit/desktop/renderer/renderer.js:983",
            "runtime/arcorbit/test/desktop-renderer.test.mjs:293",
            "Verification: targeted Feedback tests — 59 passed, 0 failed",
            "Verification: npm run check -- --test-reporter=dot — 268 tests, 265 passed, 3 skipped, 0 failed",
            "Verification: git diff --check — passed"
          ]
        },
        "facts_added": [],
        "facts_superseded": [],
        "impacts_added": [],
        "impacts_updated": [
          {
            "id": "IMPACT-feedback-v2-boundary-upheld",
            "fact_id": "FACT-feedback-v2-management-boundary",
            "fact_revision": 2,
            "target": {
              "kind": "software_decision",
              "ref": "external_integrations",
              "revision": 8
            },
            "effect": "upheld",
            "reason": "Feedback V2 保持显式项目 rollout、独立 notification capability、专用 typed IPC 和 main-process 附件边界；Renderer 只在 mark_read 可用时回写，并在成功后准确更新本地未读投影。",
            "gap_ids": [],
            "evidence": [
              "runtime/arcorbit/src/platform-coordinator.mjs:27",
              "runtime/arcorbit/src/platform-coordinator.mjs:35",
              "runtime/arcorbit/desktop/renderer/renderer.js:983",
              "runtime/arcorbit/test/desktop-renderer.test.mjs:293",
              "runtime/arcorbit/desktop/feedback-v2-ipc.cjs:1"
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
        "project_revision": 170,
        "judgments": [
          {
            "invariant_ref": "product-expectations-remain-recoverable",
            "disposition": "upheld",
            "reason": "日常 Feedback 处理中的独立通知门禁与可见未读状态现在由持久规格、Coordinator capability 和 Renderer 行为一致兑现。",
            "fact_refs": [
              "FACT-feedback-daily-work-parity-required",
              "FACT-feedback-v2-management-realized"
            ],
            "evidence": [
              "arckit/spec/agentic-software-development/arcorbit-platform-capabilities.md:300",
              "runtime/arcorbit/src/platform-coordinator.mjs:35",
              "runtime/arcorbit/test/desktop-renderer.test.mjs:293"
            ],
            "gap_refs": []
          },
          {
            "invariant_ref": "interaction-expectations-remain-recoverable",
            "disposition": "upheld",
            "reason": "逐动作失败关闭和未读反馈语义已恢复：禁用能力不产生错误，成功 read 会立即移除当前项未读标识并更新数量。",
            "fact_refs": [
              "FACT-feedback-v2-management-realized"
            ],
            "evidence": [
              "arckit/interaction/platform-workspace/interaction.md:23",
              "runtime/arcorbit/desktop/renderer/renderer.js:983",
              "runtime/arcorbit/test/desktop-renderer.test.mjs:293"
            ],
            "gap_refs": []
          },
          {
            "invariant_ref": "visual-language-remains-consistent",
            "disposition": "not_relevant",
            "reason": "本轮只修正 notification capability 和 read-state 行为，不建立或修改视觉语言规则。",
            "fact_refs": [],
            "evidence": [],
            "gap_refs": []
          },
          {
            "invariant_ref": "technical-decisions-remain-explainable",
            "disposition": "upheld",
            "reason": "Coordinator 的独立 notification rollout 与 Renderer 的 mark_read capability 分支现在跨层一致，仍保持受限 adapter 和 typed IPC 边界。",
            "fact_refs": [
              "FACT-feedback-v2-management-boundary",
              "FACT-feedback-v2-management-realized"
            ],
            "evidence": [
              "arckit/tech/arcorbit/platform-composition-solution.md:137",
              "runtime/arcorbit/src/platform-coordinator.mjs:27",
              "runtime/arcorbit/src/platform-coordinator.mjs:35",
              "runtime/arcorbit/desktop/renderer/renderer.js:983",
              "runtime/arcorbit/desktop/feedback-v2-ipc.cjs:1"
            ],
            "gap_refs": []
          },
          {
            "invariant_ref": "accepted-facts-are-realized",
            "disposition": "upheld",
            "reason": "开发者管理 V2 的未读/已读和逐动作降级主张现由 capability-aware Renderer 实现及禁用/成功分支行为测试直接证明。",
            "fact_refs": [
              "FACT-feedback-v2-management-boundary",
              "FACT-feedback-v2-management-realized"
            ],
            "evidence": [
              "runtime/arcorbit/desktop/renderer/renderer.js:929",
              "runtime/arcorbit/desktop/renderer/renderer.js:983",
              "runtime/arcorbit/test/desktop-renderer.test.mjs:293"
            ],
            "gap_refs": []
          },
          {
            "invariant_ref": "material-risks-have-credible-evidence",
            "disposition": "upheld",
            "reason": "行为测试执行了 notifications-disabled 不调用及成功回写后清除本地 unread 投影，定向和完整检查覆盖相关回归风险。",
            "fact_refs": [
              "FACT-feedback-v2-management-boundary",
              "FACT-feedback-v2-management-realized"
            ],
            "evidence": [
              "runtime/arcorbit/test/desktop-renderer.test.mjs:293",
              "Verification: targeted Feedback tests — 59 passed, 0 failed",
              "Verification: npm run check -- --test-reporter=dot — 268 tests, 265 passed, 3 skipped, 0 failed"
            ],
            "gap_refs": []
          }
        ]
      },
      "evidence": [
        "runtime/arcorbit/src/platform-coordinator.mjs:27",
        "runtime/arcorbit/src/platform-coordinator.mjs:35",
        "runtime/arcorbit/desktop/renderer/renderer.js:929",
        "runtime/arcorbit/desktop/renderer/renderer.js:983",
        "runtime/arcorbit/test/desktop-renderer.test.mjs:293",
        "Verification: targeted Feedback tests — 59 passed, 0 failed",
        "Verification: npm run check -- --test-reporter=dot — 268 tests, 265 passed, 3 skipped, 0 failed",
        "Verification: git diff --check — passed",
        "Verification: arckit-case-transition/v8 validation — passed",
        "Verification: ledger apply dry-run — passed; completion review is next"
      ],
      "runtime_result_ref": "arckit-runtime://runs/RUN-20260822-195742396Z",
      "occurred_at": "2026-08-22T20:55:16.765Z"
    },
    {
      "round": 12,
      "transition_schema_version": "arckit-case-transition/v8",
      "goal": "审查 content revision 9 的实现正确性、问题闭合、验证可信度、回归风险与最小性。",
      "outcome": "completed",
      "gap_selection": {
        "mode": "candidate",
        "basis": "全部普通 Case gaps 和 impacts 已闭合，completion review 是唯一 ready Case candidate；四个 Project gaps 均需独立 Case。",
        "snapshot_token": "ffc2652de7cb6671c645a52848b4fbb69c958c77bfe5649fd5329059a413658b",
        "selected_ref": "case-gap:CASE-20260822-004:CASE-20260822-004:completion-review:3",
        "comparison_summary": "选择阻塞当前 Case 关闭的 content revision 9 completion review；四个 Project gaps 全部因 case_required 而 deferred。",
        "fresh_discovery_summary": "审查发现成功 mark-read 只更新内存状态和详情面板，列表汇总与未读圆点没有重绘；该 finding 由本轮 review 生成 repair gap，本轮不继续修复。",
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
            "reason": "需要独立 Case，不能替代当前 Case completion review。"
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
            "reason": "需要独立 Case，不能替代当前 Case completion review。"
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
            "reason": "需要独立 Case；operator 对本事项的真实环境预验证豁免仍有效。"
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
            "reason": "需要独立 Case，不能替代实现聚焦的 completion review。"
          },
          {
            "ref": "case-gap:CASE-20260822-004:CASE-20260822-004:completion-review:3",
            "source": "persisted",
            "eligibility": "ready",
            "disposition": "selected",
            "priority_basis": {
              "blocking": "high",
              "uncertainty": "low",
              "risk": "high",
              "user_impact": "high"
            },
            "reason": "全部普通义务已闭合，这是当前 Case 唯一 ready candidate。"
          }
        ]
      },
      "selected_gap": {
        "id": "CASE-20260822-004:completion-review:3",
        "responsibility": "agent",
        "goal": "Review the completed implementation for correctness, real problem resolution, verification credibility, regression risk, and minimality.",
        "reason": "All ordinary Case gaps and state impacts are closed.",
        "derived_from": [
          "case_result",
          "content_revision:9"
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
        "goal": "审查 content revision 9 的实现正确性、问题闭合、验证可信度、回归风险与最小性。",
        "expected_state_change": "记录 completion review finding，并派生 agent-owned repair gap；不在 review 轮修改实现。"
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
          "reviewed_content_revision": 9,
          "dimensions": {
            "implementation_correctness": "findings",
            "problem_resolution": "findings",
            "verification_credibility": "findings",
            "regression_risk": "findings",
            "minimality": "clean"
          },
          "findings": [
            {
              "id": "CR-feedback-v2-read-state-list-rerender",
              "kind": "omission",
              "statement": "成功 mark-read 后 applyFeedbackReadState 已更新 workspace 的 unread_count/unread_feedback_ids，但 loadFeedbackConversation 最终只调用 renderFeedbackInspector。列表汇总与当前反馈的未读圆点只由 renderPlatformFeedback 生成，因此用户当前看到的列表 DOM 仍会保持陈旧，直到另一次列表重绘或完整刷新。新增测试只断言内存 state 和 renderFeedbackInspector 调用次数，没有执行或断言列表汇总与圆点的可见更新。",
              "responsibility": "agent",
              "artifact_refs": [
                "runtime/arcorbit/desktop/renderer/renderer.js",
                "runtime/arcorbit/test/desktop-renderer.test.mjs"
              ],
              "evidence": [
                "runtime/arcorbit/desktop/renderer/renderer.js:870",
                "runtime/arcorbit/desktop/renderer/renderer.js:875",
                "runtime/arcorbit/desktop/renderer/renderer.js:987",
                "runtime/arcorbit/desktop/renderer/renderer.js:998",
                "runtime/arcorbit/test/desktop-renderer.test.mjs:319",
                "runtime/arcorbit/test/desktop-renderer.test.mjs:338",
                "runtime/arcorbit/test/desktop-renderer.test.mjs:340"
              ]
            }
          ],
          "evidence": [
            "runtime/arcorbit/desktop/renderer/renderer.js:870",
            "runtime/arcorbit/desktop/renderer/renderer.js:875",
            "runtime/arcorbit/desktop/renderer/renderer.js:987",
            "runtime/arcorbit/desktop/renderer/renderer.js:998",
            "runtime/arcorbit/test/desktop-renderer.test.mjs:319",
            "runtime/arcorbit/test/desktop-renderer.test.mjs:338",
            "runtime/arcorbit/test/desktop-renderer.test.mjs:340",
            "Verification: targeted Feedback tests — 59 passed, 0 failed",
            "Verification: npm run check -- --test-reporter=dot — 268 tests, 265 passed, 3 skipped, 0 failed",
            "Verification: git diff --check — passed"
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
        "project_revision": 170,
        "judgments": [
          {
            "invariant_ref": "product-expectations-remain-recoverable",
            "disposition": "threatened",
            "reason": "日常 Feedback 处理要求未读状态如实呈现；成功 read 虽更新内存事实，但当前列表汇总与圆点仍向用户显示陈旧状态。",
            "fact_refs": [
              "FACT-feedback-daily-work-parity-required",
              "FACT-feedback-v2-management-realized"
            ],
            "evidence": [
              "runtime/arcorbit/desktop/renderer/renderer.js:870",
              "runtime/arcorbit/desktop/renderer/renderer.js:875",
              "runtime/arcorbit/desktop/renderer/renderer.js:998"
            ],
            "gap_refs": [
              "CASE-20260822-004:review-finding:CR-feedback-v2-read-state-list-rerender"
            ]
          },
          {
            "invariant_ref": "interaction-expectations-remain-recoverable",
            "disposition": "threatened",
            "reason": "已读动作完成后可见列表反馈没有同步更新，用户无法立即确认未读数量和圆点已经清除。",
            "fact_refs": [
              "FACT-feedback-v2-management-realized"
            ],
            "evidence": [
              "arckit/interaction/platform-workspace/interaction.md:23",
              "runtime/arcorbit/desktop/renderer/renderer.js:987",
              "runtime/arcorbit/desktop/renderer/renderer.js:998"
            ],
            "gap_refs": [
              "CASE-20260822-004:review-finding:CR-feedback-v2-read-state-list-rerender"
            ]
          },
          {
            "invariant_ref": "visual-language-remains-consistent",
            "disposition": "not_relevant",
            "reason": "Finding 涉及状态变化后的重绘时机，不建立或修改视觉语言、token 或组件呈现规则。",
            "fact_refs": [],
            "evidence": [],
            "gap_refs": []
          },
          {
            "invariant_ref": "technical-decisions-remain-explainable",
            "disposition": "threatened",
            "reason": "Renderer 内存状态与 DOM 投影的更新生命周期不完整：read-state helper 修改列表依赖的数据，但成功路径仅调用详情渲染函数。",
            "fact_refs": [
              "FACT-feedback-v2-management-boundary",
              "FACT-feedback-v2-management-realized"
            ],
            "evidence": [
              "runtime/arcorbit/desktop/renderer/renderer.js:857",
              "runtime/arcorbit/desktop/renderer/renderer.js:929",
              "runtime/arcorbit/desktop/renderer/renderer.js:998"
            ],
            "gap_refs": [
              "CASE-20260822-004:review-finding:CR-feedback-v2-read-state-list-rerender"
            ]
          },
          {
            "invariant_ref": "accepted-facts-are-realized",
            "disposition": "threatened",
            "reason": "mark-read 服务动作和本地状态更新已实现，但用户可见列表仍不立即兑现准确的未读/已读主张。",
            "fact_refs": [
              "FACT-feedback-v2-management-boundary",
              "FACT-feedback-v2-management-realized"
            ],
            "evidence": [
              "runtime/arcorbit/desktop/renderer/renderer.js:870",
              "runtime/arcorbit/desktop/renderer/renderer.js:875",
              "runtime/arcorbit/desktop/renderer/renderer.js:987",
              "runtime/arcorbit/desktop/renderer/renderer.js:998"
            ],
            "gap_refs": [
              "CASE-20260822-004:review-finding:CR-feedback-v2-read-state-list-rerender"
            ]
          },
          {
            "invariant_ref": "material-risks-have-credible-evidence",
            "disposition": "threatened",
            "reason": "现有测试证明 capability 分支和 state mutation，但只 stub renderFeedbackInspector，未执行 renderPlatformFeedback 或断言列表未读汇总与圆点更新，无法控制可见状态回归风险。",
            "fact_refs": [
              "FACT-feedback-v2-management-boundary",
              "FACT-feedback-v2-management-realized"
            ],
            "evidence": [
              "runtime/arcorbit/test/desktop-renderer.test.mjs:319",
              "runtime/arcorbit/test/desktop-renderer.test.mjs:338",
              "runtime/arcorbit/test/desktop-renderer.test.mjs:340",
              "Verification: npm run check -- --test-reporter=dot — 268 tests, 265 passed, 3 skipped, 0 failed"
            ],
            "gap_refs": [
              "CASE-20260822-004:review-finding:CR-feedback-v2-read-state-list-rerender"
            ]
          }
        ]
      },
      "evidence": [
        "runtime/arcorbit/desktop/renderer/renderer.js:870",
        "runtime/arcorbit/desktop/renderer/renderer.js:875",
        "runtime/arcorbit/desktop/renderer/renderer.js:987",
        "runtime/arcorbit/desktop/renderer/renderer.js:998",
        "runtime/arcorbit/test/desktop-renderer.test.mjs:319",
        "runtime/arcorbit/test/desktop-renderer.test.mjs:338",
        "runtime/arcorbit/test/desktop-renderer.test.mjs:340",
        "Verification: targeted Feedback tests — 59 passed, 0 failed",
        "Verification: npm run check -- --test-reporter=dot — 268 tests, 265 passed, 3 skipped, 0 failed",
        "Verification: git diff --check — passed",
        "Verification: arckit-case-transition/v8 validation — passed",
        "Verification: ledger apply dry-run — passed; one deterministic repair gap projected"
      ],
      "runtime_result_ref": "arckit-runtime://runs/RUN-20260822-195742396Z",
      "occurred_at": "2026-08-22T20:58:14.666Z"
    },
    {
      "round": 13,
      "transition_schema_version": "arckit-case-transition/v8",
      "goal": "成功 mark-read 后触发完整 Feedback 列表重绘，并以可执行 Renderer 测试证明未读汇总与当前反馈圆点立即更新。",
      "outcome": "completed",
      "gap_selection": {
        "mode": "candidate",
        "basis": "当前 Case 的 completion review finding 是唯一 ready candidate，直接阻塞用户可见未读状态正确性与 Case 闭合；四个 Project gaps 均需独立 Case。",
        "snapshot_token": "3b3d374908e1ed27690e133a50a3b6b8fcbcd04a81161d5a983a3dae5b4abe51",
        "selected_ref": "case-gap:CASE-20260822-004:CASE-20260822-004:review-finding:CR-feedback-v2-read-state-list-rerender",
        "comparison_summary": "选择阻塞当前 Case 且风险高的 read-state 列表重绘 repair gap；四个 Project gaps 全部因 case_required 而 deferred。",
        "fresh_discovery_summary": "本轮实际检查未发现会改变当前修复对象、范围或验收方式的 fresh candidate。",
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
            "reason": "需要独立 Case，不能替代当前 Case 的阻塞性可见状态修复。"
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
            "reason": "需要独立 Case，且不属于当前 Feedback Renderer read-state 生命周期。"
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
            "reason": "需要独立 Case；当前 repair 不改变认证、凭据或真实环境验证边界。"
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
            "reason": "需要独立 Case，不能替代当前 Case 的实现修复。"
          },
          {
            "ref": "case-gap:CASE-20260822-004:CASE-20260822-004:review-finding:CR-feedback-v2-read-state-list-rerender",
            "source": "persisted",
            "eligibility": "ready",
            "disposition": "selected",
            "priority_basis": {
              "blocking": "high",
              "uncertainty": "",
              "risk": "high",
              "user_impact": ""
            },
            "reason": "唯一 ready Case gap；直接阻塞准确的可见未读状态和后续 completion review。"
          }
        ]
      },
      "selected_gap": {
        "id": "CASE-20260822-004:review-finding:CR-feedback-v2-read-state-list-rerender",
        "responsibility": "agent",
        "goal": "Resolve review finding: 成功 mark-read 后 applyFeedbackReadState 已更新 workspace 的 unread_count/unread_feedback_ids，但 loadFeedbackConversation 最终只调用 renderFeedbackInspector。列表汇总与当前反馈的未读圆点只由 renderPlatformFeedback 生成，因此用户当前看到的列表 DOM 仍会保持陈旧，直到另一次列表重绘或完整刷新。新增测试只断言内存 state 和 renderFeedbackInspector 调用次数，没有执行或断言列表汇总与圆点的可见更新。",
        "reason": "omission found by completion review",
        "derived_from": [
          "completion_review",
          "content_revision:9"
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
          "runtime/arcorbit/desktop/renderer/renderer.js:870",
          "runtime/arcorbit/desktop/renderer/renderer.js:875",
          "runtime/arcorbit/desktop/renderer/renderer.js:987",
          "runtime/arcorbit/desktop/renderer/renderer.js:998",
          "runtime/arcorbit/test/desktop-renderer.test.mjs:319",
          "runtime/arcorbit/test/desktop-renderer.test.mjs:338",
          "runtime/arcorbit/test/desktop-renderer.test.mjs:340"
        ]
      },
      "planned_transition": {
        "goal": "成功 mark-read 后触发完整 Feedback 列表重绘，并以可执行 Renderer 测试证明未读汇总与当前反馈圆点立即更新。",
        "expected_state_change": "关闭 read-state list rerender finding；保留 notification-disabled 不回写语义，并让成功 read 的内存状态与当前可见列表 DOM 同步。"
      },
      "accepted_state_delta": {
        "resolved_gap": {
          "id": "CASE-20260822-004:review-finding:CR-feedback-v2-read-state-list-rerender",
          "status": "resolved",
          "outcome": "成功 mark-read 后 Renderer 立即执行完整 Feedback 列表重绘，使未读汇总和当前反馈圆点与更新后的 workspace read state 同步；notifications-disabled 分支仍不触发回写或列表变更。",
          "reason": "实现以成功 read 为唯一列表重绘门禁；可执行测试运行真实 renderPlatformFeedback，直接断言禁用分支保持原 DOM、成功分支更新汇总并移除圆点，定向与完整检查均无回归。",
          "evidence": [
            "runtime/arcorbit/desktop/renderer/renderer.js:978",
            "runtime/arcorbit/desktop/renderer/renderer.js:989",
            "runtime/arcorbit/desktop/renderer/renderer.js:1000",
            "runtime/arcorbit/test/desktop-renderer.test.mjs:293",
            "runtime/arcorbit/test/desktop-renderer.test.mjs:350",
            "runtime/arcorbit/test/desktop-renderer.test.mjs:367",
            "runtime/arcorbit/test/desktop-renderer.test.mjs:368",
            "Verification: targeted Feedback tests — 59 passed, 0 failed",
            "Verification: npm run check -- --test-reporter=dot — 268 tests, 265 passed, 3 skipped, 0 failed",
            "Verification: git diff --check — passed"
          ]
        },
        "facts_added": [],
        "facts_superseded": [],
        "impacts_added": [],
        "impacts_updated": [
          {
            "id": "IMPACT-feedback-v2-boundary-upheld",
            "fact_id": "FACT-feedback-v2-management-boundary",
            "fact_revision": 2,
            "target": {
              "kind": "software_decision",
              "ref": "external_integrations",
              "revision": 8
            },
            "effect": "upheld",
            "reason": "Feedback V2 保持显式 rollout、独立 notification capability、专用 typed IPC 和 main-process 附件边界；Renderer 仅在 mark_read 成功后更新本地 read state 并立即重绘列表可见投影。",
            "gap_ids": [],
            "evidence": [
              "runtime/arcorbit/src/platform-coordinator.mjs:27",
              "runtime/arcorbit/src/platform-coordinator.mjs:35",
              "runtime/arcorbit/desktop/renderer/renderer.js:983",
              "runtime/arcorbit/desktop/renderer/renderer.js:1000",
              "runtime/arcorbit/test/desktop-renderer.test.mjs:293",
              "runtime/arcorbit/desktop/feedback-v2-ipc.cjs:1"
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
        "project_revision": 170,
        "judgments": [
          {
            "invariant_ref": "product-expectations-remain-recoverable",
            "disposition": "upheld",
            "reason": "日常 Feedback 处理中的独立通知门禁、成功已读和用户可见未读状态现在由持久规格、Coordinator capability、Renderer 列表重绘与行为测试一致兑现。",
            "fact_refs": [
              "FACT-feedback-daily-work-parity-required",
              "FACT-feedback-v2-management-realized"
            ],
            "evidence": [
              "arckit/spec/agentic-software-development/arcorbit-platform-capabilities.md:300",
              "runtime/arcorbit/desktop/renderer/renderer.js:1000",
              "runtime/arcorbit/test/desktop-renderer.test.mjs:367"
            ],
            "gap_refs": []
          },
          {
            "invariant_ref": "interaction-expectations-remain-recoverable",
            "disposition": "upheld",
            "reason": "逐动作失败关闭与可见反馈语义完整：禁用能力不产生回写或 DOM 变化，成功 read 会立即刷新列表汇总并清除当前反馈圆点。",
            "fact_refs": [
              "FACT-feedback-v2-management-realized"
            ],
            "evidence": [
              "arckit/interaction/platform-workspace/interaction.md:23",
              "runtime/arcorbit/desktop/renderer/renderer.js:1000",
              "runtime/arcorbit/test/desktop-renderer.test.mjs:350",
              "runtime/arcorbit/test/desktop-renderer.test.mjs:367",
              "runtime/arcorbit/test/desktop-renderer.test.mjs:368"
            ],
            "gap_refs": []
          },
          {
            "invariant_ref": "visual-language-remains-consistent",
            "disposition": "not_relevant",
            "reason": "本轮只补全既有未读汇总与圆点在状态变化后的重绘生命周期，不建立或修改视觉语言、token 或组件呈现规则。",
            "fact_refs": [],
            "evidence": [],
            "gap_refs": []
          },
          {
            "invariant_ref": "technical-decisions-remain-explainable",
            "disposition": "upheld",
            "reason": "Renderer 的 read-state 生命周期现在从受限 mark_read 成功、内存投影更新到完整列表重绘闭合，且未扩宽 adapter 或 typed IPC 边界。",
            "fact_refs": [
              "FACT-feedback-v2-management-boundary",
              "FACT-feedback-v2-management-realized"
            ],
            "evidence": [
              "arckit/tech/arcorbit/platform-composition-solution.md:137",
              "runtime/arcorbit/desktop/renderer/renderer.js:978",
              "runtime/arcorbit/desktop/renderer/renderer.js:989",
              "runtime/arcorbit/desktop/renderer/renderer.js:1000",
              "runtime/arcorbit/desktop/feedback-v2-ipc.cjs:1"
            ],
            "gap_refs": []
          },
          {
            "invariant_ref": "accepted-facts-are-realized",
            "disposition": "upheld",
            "reason": "开发者管理 V2 的未读/已读与逐动作降级主张现由 capability-aware 回写、本地状态更新、可见列表重绘及执行测试直接证明。",
            "fact_refs": [
              "FACT-feedback-v2-management-boundary",
              "FACT-feedback-v2-management-realized"
            ],
            "evidence": [
              "runtime/arcorbit/desktop/renderer/renderer.js:983",
              "runtime/arcorbit/desktop/renderer/renderer.js:1000",
              "runtime/arcorbit/test/desktop-renderer.test.mjs:293",
              "runtime/arcorbit/test/desktop-renderer.test.mjs:367",
              "runtime/arcorbit/test/desktop-renderer.test.mjs:368"
            ],
            "gap_refs": []
          },
          {
            "invariant_ref": "material-risks-have-credible-evidence",
            "disposition": "upheld",
            "reason": "行为测试执行真实列表渲染并分别证明 notifications-disabled 保持原 DOM、成功 read 更新汇总并移除圆点；定向与完整检查覆盖相关回归风险。",
            "fact_refs": [
              "FACT-feedback-v2-management-boundary",
              "FACT-feedback-v2-management-realized"
            ],
            "evidence": [
              "runtime/arcorbit/test/desktop-renderer.test.mjs:293",
              "runtime/arcorbit/test/desktop-renderer.test.mjs:350",
              "runtime/arcorbit/test/desktop-renderer.test.mjs:367",
              "runtime/arcorbit/test/desktop-renderer.test.mjs:368",
              "Verification: targeted Feedback tests — 59 passed, 0 failed",
              "Verification: npm run check -- --test-reporter=dot — 268 tests, 265 passed, 3 skipped, 0 failed"
            ],
            "gap_refs": []
          }
        ]
      },
      "evidence": [
        "runtime/arcorbit/desktop/renderer/renderer.js:978",
        "runtime/arcorbit/desktop/renderer/renderer.js:989",
        "runtime/arcorbit/desktop/renderer/renderer.js:1000",
        "runtime/arcorbit/test/desktop-renderer.test.mjs:293",
        "runtime/arcorbit/test/desktop-renderer.test.mjs:350",
        "runtime/arcorbit/test/desktop-renderer.test.mjs:367",
        "runtime/arcorbit/test/desktop-renderer.test.mjs:368",
        "Verification: targeted Feedback tests — 59 passed, 0 failed",
        "Verification: npm run check -- --test-reporter=dot — 268 tests, 265 passed, 3 skipped, 0 failed",
        "Verification: git diff --check — passed",
        "Verification: arckit-case-transition/v8 validation — passed",
        "Verification: ledger apply dry-run — passed; completion review remains"
      ],
      "runtime_result_ref": "arckit-runtime://runs/RUN-20260822-195742396Z",
      "occurred_at": "2026-08-22T21:03:11.446Z"
    },
    {
      "round": 14,
      "transition_schema_version": "arckit-case-transition/v8",
      "goal": "审查 content revision 10 的实现正确性、问题闭合、验证可信度、回归风险与最小性。",
      "outcome": "completed",
      "gap_selection": {
        "mode": "candidate",
        "basis": "全部普通 Case gaps、review findings、问题、handoff 和 threatened impacts 已闭合，content revision 10 completion review 是唯一 ready Case candidate；四个 Project gaps 均需独立 Case。",
        "snapshot_token": "faa23a2a49131dd5dc952de526f391cb46330249951fa1dd8b349b0285c87a93",
        "selected_ref": "case-gap:CASE-20260822-004:CASE-20260822-004:completion-review:4",
        "comparison_summary": "选择阻塞当前 Case 最终关闭的 content revision 10 completion review；四个 Project gaps 全部因 case_required 而 deferred。",
        "fresh_discovery_summary": "本轮对实现正确性、问题闭合、验证可信度、回归风险和最小性的检查未发现新的普通 Gap。",
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
            "reason": "需要独立 Case，不能替代当前 Case 的终态 completion review。"
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
            "reason": "需要独立 Case，不能替代当前 Feedback 事项的终态审查。"
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
            "reason": "需要独立 Case；operator 对本事项真实环境预验证的证据边界仍有效。"
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
            "reason": "需要独立 Case，不能替代 implementation-focused completion review。"
          },
          {
            "ref": "case-gap:CASE-20260822-004:CASE-20260822-004:completion-review:4",
            "source": "persisted",
            "eligibility": "ready",
            "disposition": "selected",
            "priority_basis": {
              "blocking": "high",
              "uncertainty": "low",
              "risk": "high",
              "user_impact": "high"
            },
            "reason": "全部普通义务已闭合，这是当前 Case 唯一 ready candidate。"
          }
        ]
      },
      "selected_gap": {
        "id": "CASE-20260822-004:completion-review:4",
        "responsibility": "agent",
        "goal": "Review the completed implementation for correctness, real problem resolution, verification credibility, regression risk, and minimality.",
        "reason": "All ordinary Case gaps and state impacts are closed.",
        "derived_from": [
          "case_result",
          "content_revision:10"
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
        "goal": "审查 content revision 10 的实现正确性、问题闭合、验证可信度、回归风险与最小性。",
        "expected_state_change": "记录 clean completion review 并关闭 Case；若发现 finding 则只派生 repair gap，不在 review 轮修改实现。"
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
          "reviewed_content_revision": 10,
          "dimensions": {
            "implementation_correctness": "clean",
            "problem_resolution": "clean",
            "verification_credibility": "clean",
            "regression_risk": "clean",
            "minimality": "clean"
          },
          "findings": [],
          "evidence": [
            "runtime/arcorbit/src/workshop-platform-adapter.mjs:103",
            "runtime/arcorbit/src/platform-coordinator.mjs:20",
            "runtime/arcorbit/desktop/feedback-v2-ipc.cjs:1",
            "runtime/arcorbit/desktop/preload.cjs:50",
            "runtime/arcorbit/desktop/renderer/renderer.js:857",
            "runtime/arcorbit/desktop/renderer/renderer.js:929",
            "runtime/arcorbit/desktop/renderer/renderer.js:974",
            "runtime/arcorbit/desktop/renderer/renderer.js:1000",
            "runtime/arcorbit/test/task-source-adapter.test.mjs:232",
            "runtime/arcorbit/test/workshop-platform-adapter.test.mjs:5",
            "runtime/arcorbit/test/platform-coordinator.test.mjs:244",
            "runtime/arcorbit/test/desktop-renderer.test.mjs:225",
            "runtime/arcorbit/test/desktop-renderer.test.mjs:258",
            "runtime/arcorbit/test/desktop-renderer.test.mjs:293",
            "Verification: targeted Feedback tests — 59 passed, 0 failed",
            "Verification: npm run check -- --test-reporter=dot — 268 tests, 265 passed, 3 skipped, 0 failed",
            "Verification: git diff --check — passed"
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
        "project_revision": 170,
        "judgments": [
          {
            "invariant_ref": "product-expectations-remain-recoverable",
            "disposition": "upheld",
            "reason": "Completion review 确认 V1 兼容与安全关联恢复、项目门禁的开发者管理 V2、消息/附件/未读/忽略和原子流转共同兑现无需网页版的日常 Feedback 处理目标。",
            "fact_refs": [
              "FACT-feedback-daily-work-parity-required",
              "FACT-feedback-v1-record-compatibility-realized",
              "FACT-feedback-v1-workbench-current-coverage-corrected",
              "FACT-feedback-v2-management-realized"
            ],
            "evidence": [
              "arckit/spec/agentic-software-development/arcorbit-platform-capabilities.md:299",
              "arckit/spec/agentic-software-development/arcorbit-platform-capabilities.md:300",
              "runtime/arcorbit/desktop/renderer/renderer.js:857",
              "runtime/arcorbit/test/desktop-renderer.test.mjs:293"
            ],
            "gap_refs": []
          },
          {
            "invariant_ref": "interaction-expectations-remain-recoverable",
            "disposition": "upheld",
            "reason": "列表、详情、已关联动作门禁、仅重试关联、V2 草稿保留、逐动作错误恢复和准确未读反馈均由持久交互事实与可执行 Renderer 行为一致表达。",
            "fact_refs": [
              "FACT-feedback-v1-record-compatibility-realized",
              "FACT-feedback-v1-workbench-current-coverage-corrected",
              "FACT-feedback-v2-management-realized"
            ],
            "evidence": [
              "arckit/interaction/platform-workspace/interaction.md:23",
              "arckit/interaction/platform-workspace/interaction.md:121",
              "runtime/arcorbit/desktop/renderer/renderer.js:901",
              "runtime/arcorbit/desktop/renderer/renderer.js:974",
              "runtime/arcorbit/test/desktop-renderer.test.mjs:293"
            ],
            "gap_refs": []
          },
          {
            "invariant_ref": "visual-language-remains-consistent",
            "disposition": "not_relevant",
            "reason": "Completion review 未发现新的视觉语言、token 或组件呈现规则；新增 Feedback 状态和会话元素沿用既有 Desktop 组件与样式体系。",
            "fact_refs": [],
            "evidence": [],
            "gap_refs": []
          },
          {
            "invariant_ref": "technical-decisions-remain-explainable",
            "disposition": "upheld",
            "reason": "固定 authenticated V2 路由、显式项目与通知 rollout、受限 Platform Adapter、逐功能 Coordinator、版本化 typed IPC、main-process 附件凭据和 Renderer 无通用网络能力形成一致且可恢复的技术边界。",
            "fact_refs": [
              "FACT-feedback-v2-management-boundary",
              "FACT-feedback-v2-management-realized"
            ],
            "evidence": [
              "arckit/tech/arcorbit/platform-composition-solution.md:137",
              "runtime/arcorbit/src/workshop-platform-adapter.mjs:103",
              "runtime/arcorbit/src/platform-coordinator.mjs:20",
              "runtime/arcorbit/desktop/feedback-v2-ipc.cjs:1",
              "runtime/arcorbit/test/desktop-renderer.test.mjs:225"
            ],
            "gap_refs": []
          },
          {
            "invariant_ref": "accepted-facts-are-realized",
            "disposition": "upheld",
            "reason": "Completion review 未发现 accepted V1/V2、恢复或边界事实与实际软件状态的偏差；实现、IPC、Renderer 与行为测试形成直接可追踪证据。",
            "fact_refs": [
              "FACT-feedback-v1-record-compatibility-realized",
              "FACT-feedback-v1-workbench-current-coverage-corrected",
              "FACT-feedback-v2-management-boundary",
              "FACT-feedback-v2-management-realized"
            ],
            "evidence": [
              "runtime/arcorbit/src/workshop-platform-adapter.mjs:232",
              "runtime/arcorbit/src/platform-coordinator.mjs:286",
              "runtime/arcorbit/src/platform-coordinator.mjs:395",
              "runtime/arcorbit/desktop/renderer/renderer.js:929",
              "runtime/arcorbit/desktop/renderer/renderer.js:1000",
              "runtime/arcorbit/test/platform-coordinator.test.mjs:178",
              "runtime/arcorbit/test/desktop-renderer.test.mjs:293"
            ],
            "gap_refs": []
          },
          {
            "invariant_ref": "material-risks-have-credible-evidence",
            "disposition": "upheld",
            "reason": "固定路由、默认关闭与显式 rollout、逐功能降级、附件隔离、401/404 恢复、V1 重复创建防护及已读可见状态均有可重复测试，定向和完整检查无失败。",
            "fact_refs": [
              "FACT-feedback-v1-record-compatibility-realized",
              "FACT-feedback-v1-workbench-current-coverage-corrected",
              "FACT-feedback-v2-management-boundary",
              "FACT-feedback-v2-management-realized"
            ],
            "evidence": [
              "runtime/arcorbit/test/task-source-adapter.test.mjs:232",
              "runtime/arcorbit/test/workshop-platform-adapter.test.mjs:5",
              "runtime/arcorbit/test/platform-coordinator.test.mjs:178",
              "runtime/arcorbit/test/platform-coordinator.test.mjs:244",
              "runtime/arcorbit/test/desktop-renderer.test.mjs:258",
              "runtime/arcorbit/test/desktop-renderer.test.mjs:293",
              "Verification: targeted Feedback tests — 59 passed, 0 failed",
              "Verification: npm run check -- --test-reporter=dot — 268 tests, 265 passed, 3 skipped, 0 failed"
            ],
            "gap_refs": []
          }
        ]
      },
      "evidence": [
        "runtime/arcorbit/src/workshop-platform-adapter.mjs:103",
        "runtime/arcorbit/src/platform-coordinator.mjs:20",
        "runtime/arcorbit/desktop/feedback-v2-ipc.cjs:1",
        "runtime/arcorbit/desktop/renderer/renderer.js:857",
        "runtime/arcorbit/desktop/renderer/renderer.js:974",
        "runtime/arcorbit/desktop/renderer/renderer.js:1000",
        "runtime/arcorbit/test/task-source-adapter.test.mjs:232",
        "runtime/arcorbit/test/platform-coordinator.test.mjs:244",
        "runtime/arcorbit/test/desktop-renderer.test.mjs:258",
        "runtime/arcorbit/test/desktop-renderer.test.mjs:293",
        "Verification: targeted Feedback tests — 59 passed, 0 failed",
        "Verification: npm run check -- --test-reporter=dot — 268 tests, 265 passed, 3 skipped, 0 failed",
        "Verification: git diff --check — passed",
        "Verification: arckit-case-transition/v8 validation — passed",
        "Verification: ledger apply dry-run — passed; Case resolves cleanly"
      ],
      "runtime_result_ref": "arckit-runtime://runs/RUN-20260822-195742396Z",
      "occurred_at": "2026-08-22T21:06:33.115Z"
    }
  ],
  "case_resolution": {
    "status": "resolved",
    "stage": "resolved",
    "satisfied": [
      "GAP-feedback-core-parity-baseline",
      "GAP-feedback-v1-record-compatibility",
      "GAP-feedback-v2-management-contract",
      "GAP-feedback-v1-link-recovery",
      "GAP-feedback-v2-management-implementation",
      "CASE-20260822-004:review-finding:CR-feedback-v2-rollout-default",
      "CASE-20260822-004:review-finding:CR-feedback-v2-ipc-error-contract",
      "CASE-20260822-004:review-finding:CR-feedback-v2-renderer-url-boundary",
      "CASE-20260822-004:review-finding:CR-feedback-v2-notification-read-state",
      "CASE-20260822-004:review-finding:CR-feedback-v2-read-state-list-rerender"
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
    "updated_at": "2026-08-22T21:06:33.115Z"
  }
}
```

## Round Notes

- Case history is canonical in Structured Record.rounds; keep prose notes exceptional.
