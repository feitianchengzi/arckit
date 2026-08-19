# Integrate product feedback SDK into ArcOrbit

Case: CASE-20260819-003
Status: closed
Artifact Type: mixed
Selected Gap: none
Updated: 2026-08-19T08:13:29.732Z

## User Intent

给 ArcOrbit 接入反馈 SDK，让用户可以直接在 ArcOrbit 内向 ArcOrbit 产品提交反馈并查看自己的反馈。

## Structured Record

```json
{
  "schema_version": "development-case-record/v5",
  "id": "CASE-20260819-003",
  "title": "Integrate product feedback SDK into ArcOrbit",
  "status": "closed",
  "artifact_type": "mixed",
  "created_at": "2026-08-19T06:32:19.838Z",
  "updated_at": "2026-08-19T08:13:29.732Z",
  "user_intent": "给 ArcOrbit 接入反馈 SDK，让用户可以直接在 ArcOrbit 内向 ArcOrbit 产品提交反馈并查看自己的反馈。",
  "expected_outcome": "ArcOrbit 提供安全、可恢复的单一反馈中心入口，支持提交反馈与我的反馈，稳定绑定当前用户身份，不泄露平台凭据，并有自动化验证证据。",
  "project_state_ref": "arckit/project/state.record.json",
  "current_round": {
    "goal": "",
    "selected_gap": null
  },
  "facts": [
    {
      "id": "FACT-arcorbit-product-feedback-request",
      "revision": 1,
      "status": "accepted",
      "statement": "ArcOrbit 需要提供产品内反馈入口，让用户直接向 ArcOrbit 产品提交反馈并查看自己的反馈。",
      "basis": "当前操作者明确提出的产品目标。",
      "evidence": [
        "User request received 2026-08-19"
      ]
    },
    {
      "id": "FACT-arcorbit-feedback-integration-contract",
      "revision": 1,
      "status": "superseded",
      "statement": "ArcOrbit 自身产品反馈使用 Feedback SDK WebView V2 的 API Key 直连模式，由受信设置 UI 采集正整数 Project ID 和项目专用 Key，以 Electron safeStorage 保存 Key；独立受限 WebContents 固定加载 SDK 页面，使用 Workshop current-user 不可变 ID，在单一反馈中心切换提交反馈与我的反馈，通知关闭，所有缺失依赖均失败关闭。",
      "basis": "ArcForge exact-resolved 反馈接入 skill 的版本化契约、ArcOrbit fresh Electron/登录边界与新增稳定产品、交互和技术来源一致。",
      "evidence": [
        "arckit/spec/agentic-software-development/arcorbit-platform-capabilities.md",
        "arckit/interaction/product-feedback-center/interaction.md",
        "arckit/interaction/product-feedback-center/default.html",
        "arckit/tech/arcorbit/product-feedback-integration.md",
        "runtime/arcorbit/desktop/main.mjs",
        "runtime/arcorbit/src/task-source-adapter.mjs"
      ]
    },
    {
      "id": "FACT-arcorbit-product-feedback-implementation",
      "revision": 1,
      "status": "superseded",
      "statement": "生产 ArcOrbit 已按接受契约实现产品反馈：唯一全局入口在 Workshop 登录和有效配置后打开固定 Feedback SDK V2 HTTPS 文档；Project ID 和项目专用 API Key 经受信 UI 写入，Key 只以 safeStorage 密文持久化且不进入 Renderer snapshot；Workshop current-user ID 作为 customUserId；隔离 WebContents 禁用 Node、拒绝新窗口和非允许 origin，并在同一健康页面切换提交反馈与我的反馈，通知关闭。",
      "basis": "生产代码、稳定 spec/interaction/tech、专项服务与 WebContents 行为测试、全量 ArcOrbit 回归和真实 Electron 布局回归一致。",
      "evidence": [
        "arckit/spec/agentic-software-development/arcorbit-platform-capabilities.md",
        "arckit/interaction/product-feedback-center/interaction.md",
        "arckit/tech/arcorbit/product-feedback-integration.md",
        "runtime/arcorbit/src/product-feedback-service.mjs",
        "runtime/arcorbit/src/product-feedback-window.mjs",
        "runtime/arcorbit/desktop/main.mjs",
        "runtime/arcorbit/desktop/renderer/renderer.js",
        "runtime/arcorbit/test/product-feedback-service.test.mjs",
        "runtime/arcorbit/test/product-feedback-window.test.mjs",
        "npm run check: 219 tests, 217 passed, 2 environment-gated skips, 0 failed",
        "npm run test:layout: 1 passed, 0 failed"
      ]
    },
    {
      "id": "FACT-arcorbit-feedback-integration-contract",
      "revision": 2,
      "status": "superseded",
      "statement": "ArcOrbit 自身产品反馈固定使用 Feedback Project ID 107 和 Feedback SDK WebView V2 API Key 直连模式；Project ID 是产品常量，不由用户编辑或持久化，受信设置 UI 只采集轮换后的项目专用 Key并交给 Electron safeStorage。SDK 通知开启，顶部唯一产品反馈入口显示当前用户未读数；受限 WebContents、Workshop current-user 身份、提交/我的反馈同页切换与失败关闭边界保持不变。任何经对话、日志或仓库传递的 Key 均视为已暴露，不得使用，必须先轮换。",
      "basis": "用户明确指定 Project ID 107 并要求开启未读角标；稳定 spec/interaction/tech 和生产代码已同步，且敏感凭据未进入实现、命令、证据或账本。",
      "evidence": [
        "User supplied Project ID 107 and requested unread badge on 2026-08-19; credential content intentionally excluded",
        "arckit/spec/agentic-software-development/arcorbit-platform-capabilities.md",
        "arckit/interaction/product-feedback-center/interaction.md",
        "arckit/tech/arcorbit/product-feedback-integration.md"
      ]
    },
    {
      "id": "FACT-arcorbit-product-feedback-implementation",
      "revision": 2,
      "status": "superseded",
      "statement": "生产 ArcOrbit 已固定以 Project ID 107 配置 Feedback SDK，设置界面只接收 API Key；notifications enabled，独立 SDK WebContents 在严格校验 origin、window source 和消息类型后接受未读变化信号，再由 main process 调用 getUnreadCount 获取权威数量。Renderer 仅收到边界化 unread_count，入口按 1-99、99+ 或隐藏渲染，后台定时刷新，打开反馈、保存配置和重新登录后刷新，登出清零。Key 仍只由 safeStorage 加密持久化且不进入 Renderer snapshot、URL、日志、仓库或账本。",
      "basis": "生产代码、稳定文档、20 项专项回归、完整 ArcOrbit 检查和真实 Electron 布局回归一致。",
      "evidence": [
        "runtime/arcorbit/src/product-feedback-service.mjs",
        "runtime/arcorbit/src/product-feedback-window.mjs",
        "runtime/arcorbit/desktop/main.mjs",
        "runtime/arcorbit/desktop/preload.cjs",
        "runtime/arcorbit/desktop/renderer/index.html",
        "runtime/arcorbit/desktop/renderer/renderer.js",
        "runtime/arcorbit/desktop/renderer/styles.css",
        "runtime/arcorbit/test/product-feedback-service.test.mjs",
        "runtime/arcorbit/test/product-feedback-window.test.mjs",
        "runtime/arcorbit/test/desktop-layout-static.test.mjs",
        "Focused product feedback tests: 20 passed, 0 failed",
        "npm run check: 220 tests, 218 passed, 2 environment-gated skips, 0 failed",
        "npm run test:layout: 1 passed, 0 failed"
      ]
    },
    {
      "id": "FACT-arcorbit-feedback-integration-contract",
      "revision": 3,
      "status": "accepted",
      "statement": "ArcOrbit 产品反馈固定使用 Project ID 107、Feedback SDK WebView V2 API Key 直连和未读通知。项目专用 Key 作为 bundled-static 产品代码常量进入源码与安装包，普通用户没有反馈配置页、Key 状态或轮换操作；轮换需修改代码并重新构建发布。Key 不进入 URL、Renderer snapshot、IPC、日志或报告，但源码、安装包和客户端运行时均可提取，因此只使用项目专用、最小权限、可轮换的 Key。",
      "basis": "用户明确要求把当前 Key 写死在代码中并移除配置页；稳定规格、交互、技术方案与生产实现已同步。",
      "evidence": [
        "User explicitly requested bundled code credential and no configuration UI on 2026-08-19; credential content intentionally omitted from ledger",
        "arckit/spec/agentic-software-development/arcorbit-platform-capabilities.md",
        "arckit/interaction/product-feedback-center/interaction.md",
        "arckit/tech/arcorbit/product-feedback-integration.md"
      ]
    },
    {
      "id": "FACT-arcorbit-product-feedback-implementation",
      "revision": 3,
      "status": "accepted",
      "statement": "生产 ArcOrbit 的 product-feedback-service 内置固定 Project 107 和项目专用 Key，状态恒为 bundled-static/configured；运行时只门禁 Workshop 登录和稳定 current-user ID。Desktop 不再引入 safeStorage，不再创建产品反馈 userData 记录，也不暴露保存、清除或打开反馈控制台的配置 IPC；设置页完全没有产品反馈参数。受限 SDK WebContents、提交/我的反馈同页切换、严格未读信号、60 秒刷新和登出清零保持成立。",
      "basis": "生产代码、稳定文档、专项测试、全量检查与布局回归一致。",
      "evidence": [
        "runtime/arcorbit/src/product-feedback-service.mjs",
        "runtime/arcorbit/desktop/main.mjs",
        "runtime/arcorbit/desktop/preload.cjs",
        "runtime/arcorbit/desktop/renderer/index.html",
        "runtime/arcorbit/desktop/renderer/renderer.js",
        "runtime/arcorbit/test/product-feedback-service.test.mjs",
        "runtime/arcorbit/test/product-feedback-window.test.mjs",
        "runtime/arcorbit/test/desktop-renderer.test.mjs",
        "npm run check: 220 tests, 218 passed, 2 environment-gated skips, 0 failed",
        "npm run test:layout: 1 passed, 0 failed"
      ]
    }
  ],
  "state_impacts": [
    {
      "id": "IMPACT-product-feedback-support-decision",
      "fact_id": "FACT-arcorbit-feedback-integration-contract",
      "fact_revision": 3,
      "target": {
        "kind": "software_decision",
        "ref": "feedback_and_support",
        "revision": 6
      },
      "effect": "upheld",
      "reason": "固定 Project 107、无配置入口、提交/我的反馈和未读角标保持既定支持边界。",
      "gap_ids": [],
      "evidence": [
        "arckit/spec/agentic-software-development/arcorbit-platform-capabilities.md",
        "arckit/interaction/product-feedback-center/interaction.md"
      ]
    },
    {
      "id": "IMPACT-product-feedback-interaction-invariant",
      "fact_id": "FACT-arcorbit-feedback-integration-contract",
      "fact_revision": 3,
      "target": {
        "kind": "software_invariant",
        "ref": "interaction-expectations-remain-recoverable",
        "revision": null
      },
      "effect": "upheld",
      "reason": "交互来源已移除配置页和未配置状态，明确登录后直接使用和 SDK 失败恢复。",
      "gap_ids": [],
      "evidence": [
        "arckit/interaction/product-feedback-center/interaction.md",
        "arckit/interaction/product-feedback-center/default.html"
      ]
    },
    {
      "id": "IMPACT-product-feedback-technical-invariant",
      "fact_id": "FACT-arcorbit-feedback-integration-contract",
      "fact_revision": 3,
      "target": {
        "kind": "software_invariant",
        "ref": "technical-decisions-remain-explainable",
        "revision": null
      },
      "effect": "upheld",
      "reason": "bundled-static Key、无配置 IPC、受限 WebContents、current-user 和未读生命周期均有明确技术说明。",
      "gap_ids": [],
      "evidence": [
        "arckit/tech/arcorbit/product-feedback-integration.md"
      ]
    },
    {
      "id": "IMPACT-product-feedback-realization-invariant",
      "fact_id": "FACT-arcorbit-product-feedback-implementation",
      "fact_revision": 3,
      "target": {
        "kind": "software_invariant",
        "ref": "accepted-facts-are-realized",
        "revision": null
      },
      "effect": "upheld",
      "reason": "无配置内置反馈、固定 Project 107、当前用户身份、提交/我的反馈和未读角标已由生产代码与自动化验证实现。",
      "gap_ids": [],
      "evidence": [
        "runtime/arcorbit/src/product-feedback-service.mjs",
        "runtime/arcorbit/desktop/main.mjs",
        "runtime/arcorbit/desktop/renderer/renderer.js",
        "npm run check: 220 tests, 218 passed, 2 environment-gated skips, 0 failed"
      ]
    },
    {
      "id": "IMPACT-product-feedback-risk-invariant",
      "fact_id": "FACT-arcorbit-product-feedback-implementation",
      "fact_revision": 3,
      "target": {
        "kind": "software_invariant",
        "ref": "material-risks-have-credible-evidence",
        "revision": null
      },
      "effect": "upheld",
      "reason": "静态 Key 可从源码、安装包和运行时提取的风险已被明确接受并写入技术边界；自动化证明凭据不会通过 UI、IPC、URL 或日志进一步传播，轮换责任是改代码并重新发布。",
      "gap_ids": [],
      "evidence": [
        "arckit/tech/arcorbit/product-feedback-integration.md",
        "runtime/arcorbit/test/product-feedback-service.test.mjs",
        "runtime/arcorbit/test/product-feedback-window.test.mjs",
        "runtime/arcorbit/test/desktop-renderer.test.mjs"
      ]
    },
    {
      "id": "IMPACT-product-feedback-capability-decision",
      "fact_id": "FACT-arcorbit-feedback-integration-contract",
      "fact_revision": 3,
      "target": {
        "kind": "software_decision",
        "ref": "product_capabilities",
        "revision": 11
      },
      "effect": "upheld",
      "reason": "无配置内置凭据不改变固定 Project 107 反馈中心和未读角标能力。",
      "gap_ids": [],
      "evidence": [
        "arckit/spec/agentic-software-development/arcorbit-platform-capabilities.md"
      ]
    },
    {
      "id": "IMPACT-product-feedback-experience-decision",
      "fact_id": "FACT-arcorbit-feedback-integration-contract",
      "fact_revision": 3,
      "target": {
        "kind": "software_decision",
        "ref": "experience_and_interaction",
        "revision": 19
      },
      "effect": "upheld",
      "reason": "登录后直接打开、无配置页和未读角标生命周期已成为当前交互决定。",
      "gap_ids": [],
      "evidence": [
        "arckit/interaction/product-feedback-center/interaction.md",
        "runtime/arcorbit/desktop/renderer/renderer.js"
      ]
    },
    {
      "id": "IMPACT-product-feedback-data-decision",
      "fact_id": "FACT-arcorbit-feedback-integration-contract",
      "fact_revision": 3,
      "target": {
        "kind": "software_decision",
        "ref": "data_and_state",
        "revision": 10
      },
      "effect": "upheld",
      "reason": "Project ID 与 Key 都由产品代码拥有，userData 不保存产品反馈凭据，未读仍为运行期状态。",
      "gap_ids": [],
      "evidence": [
        "arckit/tech/arcorbit/product-feedback-integration.md",
        "runtime/arcorbit/src/product-feedback-service.mjs"
      ]
    },
    {
      "id": "IMPACT-product-feedback-security-decision",
      "fact_id": "FACT-arcorbit-feedback-integration-contract",
      "fact_revision": 3,
      "target": {
        "kind": "software_decision",
        "ref": "security_privacy_compliance",
        "revision": 3
      },
      "effect": "upheld",
      "reason": "安全决定如实记录 Project 107 Key 的静态分发、可提取风险、最小权限要求和代码重建轮换边界。",
      "gap_ids": [],
      "evidence": [
        "arckit/tech/arcorbit/product-feedback-integration.md",
        "runtime/arcorbit/src/product-feedback-service.mjs"
      ]
    }
  ],
  "gaps": [
    {
      "id": "GAP-establish-arcorbit-feedback-integration-contract",
      "status": "resolved",
      "goal": "确立 ArcOrbit 产品反馈的真实接入契约：integrationMode、SDK 认证模式、Electron 承载、单一入口、稳定用户身份、凭据生命周期与安全参数门禁均明确且可恢复。",
      "reason": "具体实现依赖接入方式和凭据边界；这些前置事实尚未被 canonical Case 接受，不能直接推测或把 Workshop 业务反馈 API 当成产品反馈 SDK。",
      "derived_from": [
        "FACT-arcorbit-product-feedback-request"
      ],
      "blocked_by": [],
      "priority_basis": {
        "blocking": "所有实现与验证均依赖该前置契约。",
        "uncertainty": "高；SDK 与原生 API、session 与 apiKey、file:// 与 WebView 承载具有不同安全边界。",
        "risk": "高；错误选择会泄露凭据或形成不可运行的跨域接入。",
        "user_impact": "高；这是当前明确请求的产品能力。"
      },
      "responsibility": "agent",
      "evidence_required": [
        "目标 skill 的版本化接入契约",
        "ArcOrbit 现有 Electron、登录、设置与导航边界的直接代码证据",
        "参数采集与凭据生命周期不泄密的明确策略"
      ],
      "resolution": {
        "id": "GAP-establish-arcorbit-feedback-integration-contract",
        "status": "resolved",
        "outcome": "ArcOrbit 产品反馈已形成一致的 sdk-webview/apiKey/secret-store 契约、单一反馈中心交互、Workshop 稳定身份和受限 Electron WebContents 安全边界。",
        "reason": "版本化 skill reference、fresh 代码边界与稳定 spec/interaction/tech 工件一致，且映射与格式检查通过。",
        "evidence": [
          "User request received 2026-08-19",
          "arckit/spec/agentic-software-development/arcorbit-platform-capabilities.md",
          "arckit/interaction/product-feedback-center/interaction.md",
          "arckit/interaction/product-feedback-center/default.html",
          "arckit/tech/arcorbit/product-feedback-integration.md",
          "runtime/arcorbit/desktop/main.mjs",
          "runtime/arcorbit/src/task-source-adapter.mjs",
          "git diff --check: passed"
        ],
        "occurred_at": "2026-08-19T06:39:54.463Z"
      }
    },
    {
      "id": "GAP-implement-arcorbit-product-feedback-sdk",
      "status": "resolved",
      "goal": "在生产 ArcOrbit 中实现已接受的产品反馈中心：受信设置 UI、安全本地凭据、稳定 Workshop 用户身份、受限 Feedback SDK WebContents、提交/我的反馈切换及自动化回归均成立。",
      "reason": "产品、交互和技术契约已经明确，但生产 Desktop 尚未实现入口、配置、SDK 承载和验证。",
      "derived_from": [
        "FACT-arcorbit-product-feedback-request",
        "FACT-arcorbit-feedback-integration-contract"
      ],
      "blocked_by": [
        "GAP-establish-arcorbit-feedback-integration-contract"
      ],
      "priority_basis": {
        "blocking": "这是用户可实际使用反馈能力的唯一剩余 Agent 前置。",
        "uncertainty": "中；契约已明确，具体 Electron 生命周期与测试仍需实现验证。",
        "risk": "高；涉及远端内容、客户端 API Key、主进程身份和安全存储。",
        "user_impact": "高；未实现前用户无法在 ArcOrbit 内提交产品反馈。"
      },
      "responsibility": "agent",
      "evidence_required": [
        "生产入口、设置 UI、main/preload/feedback-center shell 与受限 SDK WebContents 实现",
        "API Key 不进入仓库、普通设置、Renderer snapshot、URL 或日志的自动化证据",
        "未登录、未配置、安全存储不可用、SDK 未 ready 与账户切换的失败关闭测试",
        "提交反馈与我的反馈复用同一 SDK 页面且配置字段互斥的测试",
        "ArcOrbit 相关与全量回归通过"
      ],
      "resolution": {
        "id": "GAP-implement-arcorbit-product-feedback-sdk",
        "status": "resolved",
        "outcome": "ArcOrbit 已实现唯一产品反馈入口、write-only 配置 UI、safeStorage 凭据记录、Workshop current-user 身份、隔离 SDK WebContents，以及同窗提交/我的反馈与脱敏恢复。",
        "reason": "生产 main/preload/Renderer/反馈窗口、专项安全和生命周期测试、完整 ArcOrbit 回归及真实 Electron 布局回归共同证明代码侧契约成立。",
        "evidence": [
          "runtime/arcorbit/desktop/main.mjs",
          "runtime/arcorbit/desktop/preload.cjs",
          "runtime/arcorbit/desktop/renderer/index.html",
          "runtime/arcorbit/desktop/renderer/renderer.js",
          "runtime/arcorbit/desktop/product-feedback/",
          "runtime/arcorbit/src/product-feedback-service.mjs",
          "runtime/arcorbit/src/product-feedback-window.mjs",
          "runtime/arcorbit/test/product-feedback-service.test.mjs",
          "runtime/arcorbit/test/product-feedback-window.test.mjs",
          "npm run check: 219 tests, 217 passed, 2 environment-gated skips, 0 failed",
          "npm run test:layout: 1 passed, 0 failed",
          "git diff --check: passed"
        ],
        "occurred_at": "2026-08-19T06:53:00.056Z"
      }
    },
    {
      "id": "GAP-configure-and-validate-live-arcorbit-feedback-project",
      "status": "cancelled",
      "goal": "在 Feedback 平台创建或选择 ArcOrbit 专用项目，由操作者在 ArcOrbit 设置内录入真实 Project ID 和项目专用 API Key，并验证当前 Workshop 用户可以提交反馈且在我的反馈中看到归属正确的记录。",
      "reason": "真实平台项目和凭据属于人工持有的外部敏感资源，Agent 不得伪造、写入仓库或要求在对话中传递；没有它们无法证明远端认证、网络和反馈归属。",
      "derived_from": [
        "FACT-arcorbit-product-feedback-request",
        "FACT-arcorbit-feedback-integration-contract",
        "FACT-arcorbit-product-feedback-implementation"
      ],
      "blocked_by": [
        "GAP-implement-arcorbit-product-feedback-sdk"
      ],
      "priority_basis": {
        "blocking": "阻塞 Case 的真实可用性验收和 Completion Review。",
        "uncertainty": "中；代码已验证，但目标项目配置和服务端认证未实测。",
        "risk": "高；真实 API Key 必须只在 ArcOrbit 受信设置 UI 内处理。",
        "user_impact": "高；未配置前入口保持可恢复但无法提交真实反馈。"
      },
      "responsibility": "human",
      "evidence_required": [
        "Feedback 平台存在 ArcOrbit 专用项目的非敏感证据，不包含 API Key",
        "ArcOrbit 设置显示产品反馈已配置，不回显 Key",
        "当前 Workshop 用户完成一次测试反馈提交并可在我的反馈中查看",
        "反馈内容和身份归属正确且无凭据泄露"
      ],
      "resolution": {
        "status": "cancelled",
        "outcome": "由固定 Project 107 的安全凭据轮换与线上验收 Gap 替代",
        "reason": "用户已经指定 Project ID 107，旧 Gap 的创建/选择项目和录入 Project ID 要求已过时；对话中暴露的 Key 也要求把后续责任明确改为先撤销轮换，再仅通过受信 UI 录入。",
        "evidence": [
          "User supplied Project ID 107 and requested unread badge on 2026-08-19; credential content intentionally excluded",
          "arckit/tech/arcorbit/product-feedback-integration.md"
        ],
        "occurred_at": "2026-08-19T08:01:48.136Z"
      }
    },
    {
      "id": "GAP-bind-project-107-and-enable-feedback-unread-badge",
      "responsibility": "agent",
      "goal": "将 ArcOrbit 产品反馈固定绑定到 Project ID 107，开启 SDK 未读通知，并在全局产品反馈入口显示安全、可刷新的未读角标。",
      "reason": "用户明确提供了目标 Project ID 并要求开启未读角标，旧契约仍将 Project ID 作为可编辑配置且关闭通知。",
      "derived_from": [
        "FACT-arcorbit-product-feedback-request",
        "FACT-arcorbit-feedback-integration-contract",
        "FACT-arcorbit-product-feedback-implementation"
      ],
      "blocked_by": [],
      "priority_basis": {
        "blocking": "直接兑现本轮用户参数。",
        "uncertainty": "低。",
        "risk": "中；涉及 SDK 跨上下文未读信号。",
        "user_impact": "高。"
      },
      "evidence_required": [
        "生产服务固定使用 Project ID 107 且不再持久化或接受可编辑 Project ID",
        "SDK notifications 开启并通过受限消息桥和 getUnreadCount 刷新未读数",
        "入口显示 1-99、99+ 且 0 隐藏，登出清零",
        "专项测试、全量 ArcOrbit 回归、真实 Electron 布局回归和差异检查通过"
      ],
      "status": "resolved",
      "resolution": {
        "id": "GAP-bind-project-107-and-enable-feedback-unread-badge",
        "status": "resolved",
        "outcome": "ArcOrbit 产品反馈已固定绑定 Project ID 107、启用 SDK 通知，并在唯一全局入口显示经过边界校验和主动刷新的未读角标。",
        "reason": "生产 main/preload/Renderer/SDK WebContents、稳定产品文档、专项测试、全量回归和布局回归共同证明参数与行为成立。",
        "evidence": [
          "runtime/arcorbit/src/product-feedback-service.mjs",
          "runtime/arcorbit/src/product-feedback-window.mjs",
          "runtime/arcorbit/desktop/main.mjs",
          "runtime/arcorbit/desktop/preload.cjs",
          "runtime/arcorbit/desktop/renderer/index.html",
          "runtime/arcorbit/desktop/renderer/renderer.js",
          "runtime/arcorbit/desktop/renderer/styles.css",
          "runtime/arcorbit/test/product-feedback-service.test.mjs",
          "runtime/arcorbit/test/product-feedback-window.test.mjs",
          "runtime/arcorbit/test/desktop-layout-static.test.mjs",
          "npm run check: 220 tests, 218 passed, 2 environment-gated skips, 0 failed",
          "npm run test:layout: 1 passed, 0 failed",
          "git diff --check: passed"
        ],
        "occurred_at": "2026-08-19T08:01:48.136Z"
      }
    },
    {
      "id": "GAP-rotate-configure-and-live-validate-arcorbit-feedback",
      "status": "cancelled",
      "goal": "撤销经对话暴露的旧 Key，在 Feedback 平台为 Project 107 生成新的项目专用 Key，仅通过 ArcOrbit 受信设置录入，并验证当前 Workshop 用户可提交反馈、在我的反馈中看到正确归属，且未读角标随服务端未读状态更新并在查看后清零。",
      "reason": "Project ID 和通知选择已经确定，但对话中出现过的凭据不能安全使用；Agent 不得保存、复用或自行操作真实平台凭据，也无法替代当前用户完成线上认证和反馈归属验收。",
      "derived_from": [
        "FACT-arcorbit-product-feedback-request",
        "FACT-arcorbit-feedback-integration-contract",
        "FACT-arcorbit-product-feedback-implementation"
      ],
      "blocked_by": [
        "GAP-bind-project-107-and-enable-feedback-unread-badge"
      ],
      "priority_basis": {
        "blocking": "阻塞 Case 的真实可用性验收和 Completion Review。",
        "uncertainty": "中；代码已验证，真实服务行为未实测。",
        "risk": "高；旧凭据必须撤销，新凭据只能进入受信设置 UI。",
        "user_impact": "高；未安全配置前无法提交真实反馈或验证未读角标。"
      },
      "responsibility": "human",
      "evidence_required": [
        "旧 Key 已在 Feedback 平台撤销或轮换的非敏感确认，不包含任何 Key 内容",
        "ArcOrbit 设置显示 Project ID 107 和产品反馈已配置，但不回显 Key",
        "当前 Workshop 用户完成一次测试反馈提交并可在我的反馈中查看正确归属",
        "另一条反馈消息或状态产生未读后，入口角标更新；打开我的反馈后角标清零",
        "反馈内容、身份和未读状态正确且无凭据泄露"
      ],
      "resolution": {
        "status": "cancelled",
        "outcome": "由用户明确接受的 bundled-static 无配置实现取代",
        "reason": "该 Gap 的撤销旧 Key、生成新 Key和设置页录入要求与用户最新明确决定冲突；静态 Key 的源码/安装包可提取和后续重新构建轮换风险已转为接受事实。",
        "evidence": [
          "User explicitly requested bundled code credential and no configuration UI on 2026-08-19; credential content intentionally omitted from ledger",
          "arckit/tech/arcorbit/product-feedback-integration.md"
        ],
        "occurred_at": "2026-08-19T08:12:00.493Z"
      }
    },
    {
      "id": "GAP-bundle-feedback-key-and-remove-user-configuration",
      "responsibility": "agent",
      "goal": "将 Project 107 的产品反馈 Key 作为 ArcOrbit 内置代码常量，删除用户配置页和凭据保存/清除 IPC，使登录用户直接使用反馈与未读角标。",
      "reason": "用户明确要求在代码层写死且用户无需关注配置。",
      "derived_from": [
        "FACT-arcorbit-product-feedback-request",
        "FACT-arcorbit-feedback-integration-contract",
        "FACT-arcorbit-product-feedback-implementation"
      ],
      "blocked_by": [],
      "priority_basis": {
        "blocking": "直接兑现用户最新要求。",
        "uncertainty": "低。",
        "risk": "高；静态凭据可从客户端提取。",
        "user_impact": "高。"
      },
      "evidence_required": [
        "生产服务内置固定 Project 107 和非空 Key",
        "设置页及保存/清除凭据 IPC 被删除",
        "登录后直接打开和后台刷新未读",
        "稳定文档明确源码和安装包可提取风险及重新构建轮换方式",
        "专项、全量和布局回归通过"
      ],
      "status": "resolved",
      "resolution": {
        "id": "GAP-bundle-feedback-key-and-remove-user-configuration",
        "status": "resolved",
        "outcome": "ArcOrbit 已将 Project 107 的项目专用 Key 内置在产品代码，删除反馈配置页和凭据写入/清除 IPC；登录用户可直接提交反馈、查看自己的反馈和接收未读角标。",
        "reason": "生产服务、main/preload/Renderer、稳定文档、20 项专项测试、220 项全量检查和真实 Electron 布局回归一致。",
        "evidence": [
          "runtime/arcorbit/src/product-feedback-service.mjs",
          "runtime/arcorbit/desktop/main.mjs",
          "runtime/arcorbit/desktop/preload.cjs",
          "runtime/arcorbit/desktop/renderer/index.html",
          "runtime/arcorbit/desktop/renderer/renderer.js",
          "runtime/arcorbit/test/product-feedback-service.test.mjs",
          "runtime/arcorbit/test/product-feedback-window.test.mjs",
          "runtime/arcorbit/test/desktop-renderer.test.mjs",
          "Focused product feedback tests: 20 passed, 0 failed",
          "npm run check: 220 tests, 218 passed, 2 environment-gated skips, 0 failed",
          "npm run test:layout: 1 passed, 0 failed",
          "git diff --check: passed"
        ],
        "occurred_at": "2026-08-19T08:12:00.493Z"
      }
    }
  ],
  "content_revision": 4,
  "completion_review": {
    "status": "clean",
    "policy": {
      "initial_max_cycles": 10,
      "source": "runtime/arcorbit/config/case-policy.json",
      "snapshotted_at": "2026-08-19T06:32:19.838Z"
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
          "runtime/arcorbit/src/product-feedback-service.mjs",
          "runtime/arcorbit/src/product-feedback-window.mjs",
          "runtime/arcorbit/desktop/main.mjs",
          "runtime/arcorbit/desktop/preload.cjs",
          "runtime/arcorbit/desktop/renderer/index.html",
          "runtime/arcorbit/desktop/renderer/renderer.js",
          "runtime/arcorbit/test/product-feedback-service.test.mjs",
          "runtime/arcorbit/test/product-feedback-window.test.mjs",
          "runtime/arcorbit/test/desktop-renderer.test.mjs",
          "arckit/spec/agentic-software-development/arcorbit-platform-capabilities.md",
          "arckit/interaction/product-feedback-center/interaction.md",
          "arckit/tech/arcorbit/product-feedback-integration.md",
          "Focused product feedback tests: 20 passed, 0 failed",
          "npm run check: 220 tests, 218 passed, 2 environment-gated skips, 0 failed",
          "npm run test:layout: 1 passed, 0 failed",
          "git diff --check: passed"
        ],
        "occurred_at": "2026-08-19T08:13:29.732Z"
      }
    ],
    "evidence": [
      "runtime/arcorbit/src/product-feedback-service.mjs",
      "runtime/arcorbit/src/product-feedback-window.mjs",
      "runtime/arcorbit/desktop/main.mjs",
      "runtime/arcorbit/desktop/preload.cjs",
      "runtime/arcorbit/desktop/renderer/index.html",
      "runtime/arcorbit/desktop/renderer/renderer.js",
      "runtime/arcorbit/test/product-feedback-service.test.mjs",
      "runtime/arcorbit/test/product-feedback-window.test.mjs",
      "runtime/arcorbit/test/desktop-renderer.test.mjs",
      "arckit/spec/agentic-software-development/arcorbit-platform-capabilities.md",
      "arckit/interaction/product-feedback-center/interaction.md",
      "arckit/tech/arcorbit/product-feedback-integration.md",
      "Focused product feedback tests: 20 passed, 0 failed",
      "npm run check: 220 tests, 218 passed, 2 environment-gated skips, 0 failed",
      "npm run test:layout: 1 passed, 0 failed",
      "git diff --check: passed"
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
      "goal": "固化 ArcOrbit 自身产品反馈 SDK 的产品、交互与技术契约，并明确后续生产实现的安全验收边界。",
      "outcome": "completed",
      "gap_selection": {
        "mode": "candidate",
        "basis": "产品反馈接入契约是唯一 ready Case Gap，直接阻塞实现并控制客户端 API Key 与 Electron 远端内容风险。",
        "snapshot_token": "0729189c0a8a44a4b6eb2b646f35c9bea9d3dadfca8855e1deb725b1a3e7ceaa",
        "selected_ref": "case-gap:CASE-20260819-003:GAP-establish-arcorbit-feedback-integration-contract",
        "comparison_summary": "选择当前 Case 契约 Gap；四个无直接依赖的 Project gaps 均需独立 Case，延后处理。",
        "fresh_discovery_summary": "未发现竞争的 fresh Gap；生产实现依赖本轮新接受的契约，因此只登记为下一 Gap。",
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
            "reason": "需要独立 Case，且不阻塞当前产品反馈契约。"
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
            "reason": "Runtime 韧性与当前反馈 SDK 接入边界独立。"
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
            "reason": "仓库级真实权限项目验证需要独立 Case；本轮只建立当前产品反馈契约。"
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
            "reason": "跨记录审计需要独立 Case，不替代当前用户请求。"
          },
          {
            "ref": "case-gap:CASE-20260819-003:GAP-establish-arcorbit-feedback-integration-contract",
            "source": "persisted",
            "eligibility": "ready",
            "disposition": "selected",
            "priority_basis": {
              "blocking": "所有实现与验证均依赖该前置契约。",
              "uncertainty": "高；SDK 与原生 API、session 与 apiKey、file:// 与 WebView 承载具有不同安全边界。",
              "risk": "高；错误选择会泄露凭据或形成不可运行的跨域接入。",
              "user_impact": "高；这是当前明确请求的产品能力。"
            },
            "reason": "它是当前用户能力的唯一 ready Case 前置，并控制凭据与承载风险。"
          }
        ]
      },
      "selected_gap": {
        "id": "GAP-establish-arcorbit-feedback-integration-contract",
        "responsibility": "agent",
        "goal": "确立 ArcOrbit 产品反馈的真实接入契约：integrationMode、SDK 认证模式、Electron 承载、单一入口、稳定用户身份、凭据生命周期与安全参数门禁均明确且可恢复。",
        "reason": "具体实现依赖接入方式和凭据边界；这些前置事实尚未被 canonical Case 接受，不能直接推测或把 Workshop 业务反馈 API 当成产品反馈 SDK。",
        "derived_from": [
          "FACT-arcorbit-product-feedback-request"
        ],
        "blocked_by": [],
        "priority_basis": {
          "blocking": "所有实现与验证均依赖该前置契约。",
          "uncertainty": "高；SDK 与原生 API、session 与 apiKey、file:// 与 WebView 承载具有不同安全边界。",
          "risk": "高；错误选择会泄露凭据或形成不可运行的跨域接入。",
          "user_impact": "高；这是当前明确请求的产品能力。"
        },
        "evidence_required": [
          "目标 skill 的版本化接入契约",
          "ArcOrbit 现有 Electron、登录、设置与导航边界的直接代码证据",
          "参数采集与凭据生命周期不泄密的明确策略"
        ]
      },
      "planned_transition": {
        "goal": "固化 ArcOrbit 自身产品反馈 SDK 的产品、交互与技术契约，并明确后续生产实现的安全验收边界。",
        "expected_state_change": "接入方式、承载、身份、凭据和参数门禁成为可恢复事实；生产实现作为独立下一 Gap 保持 open。"
      },
      "accepted_state_delta": {
        "resolved_gap": {
          "id": "GAP-establish-arcorbit-feedback-integration-contract",
          "status": "resolved",
          "outcome": "ArcOrbit 产品反馈已形成一致的 sdk-webview/apiKey/secret-store 契约、单一反馈中心交互、Workshop 稳定身份和受限 Electron WebContents 安全边界。",
          "reason": "版本化 skill reference、fresh 代码边界与稳定 spec/interaction/tech 工件一致，且映射与格式检查通过。",
          "evidence": [
            "User request received 2026-08-19",
            "arckit/spec/agentic-software-development/arcorbit-platform-capabilities.md",
            "arckit/interaction/product-feedback-center/interaction.md",
            "arckit/interaction/product-feedback-center/default.html",
            "arckit/tech/arcorbit/product-feedback-integration.md",
            "runtime/arcorbit/desktop/main.mjs",
            "runtime/arcorbit/src/task-source-adapter.mjs",
            "git diff --check: passed"
          ]
        },
        "facts_added": [
          {
            "id": "FACT-arcorbit-feedback-integration-contract",
            "revision": 1,
            "status": "accepted",
            "statement": "ArcOrbit 自身产品反馈使用 Feedback SDK WebView V2 的 API Key 直连模式，由受信设置 UI 采集正整数 Project ID 和项目专用 Key，以 Electron safeStorage 保存 Key；独立受限 WebContents 固定加载 SDK 页面，使用 Workshop current-user 不可变 ID，在单一反馈中心切换提交反馈与我的反馈，通知关闭，所有缺失依赖均失败关闭。",
            "basis": "ArcForge exact-resolved 反馈接入 skill 的版本化契约、ArcOrbit fresh Electron/登录边界与新增稳定产品、交互和技术来源一致。",
            "evidence": [
              "arckit/spec/agentic-software-development/arcorbit-platform-capabilities.md",
              "arckit/interaction/product-feedback-center/interaction.md",
              "arckit/interaction/product-feedback-center/default.html",
              "arckit/tech/arcorbit/product-feedback-integration.md",
              "runtime/arcorbit/desktop/main.mjs",
              "runtime/arcorbit/src/task-source-adapter.mjs"
            ]
          }
        ],
        "facts_superseded": [],
        "impacts_added": [
          {
            "id": "IMPACT-product-feedback-interaction-invariant",
            "fact_id": "FACT-arcorbit-feedback-integration-contract",
            "fact_revision": 1,
            "target": {
              "kind": "software_invariant",
              "ref": "interaction-expectations-remain-recoverable",
              "revision": null
            },
            "effect": "upheld",
            "reason": "唯一入口、模式切换、配置/账户门禁和恢复状态均有权威交互源与线框投影。",
            "gap_ids": [],
            "evidence": [
              "arckit/interaction/product-feedback-center/interaction.md",
              "arckit/interaction/product-feedback-center/default.html"
            ]
          },
          {
            "id": "IMPACT-product-feedback-technical-invariant",
            "fact_id": "FACT-arcorbit-feedback-integration-contract",
            "fact_revision": 1,
            "target": {
              "kind": "software_invariant",
              "ref": "technical-decisions-remain-explainable",
              "revision": null
            },
            "effect": "upheld",
            "reason": "SDK 模式、Electron 承载、IPC、存储、身份与失败关闭均有可恢复技术理由。",
            "gap_ids": [],
            "evidence": [
              "arckit/tech/arcorbit/product-feedback-integration.md"
            ]
          },
          {
            "id": "IMPACT-product-feedback-realization-invariant",
            "fact_id": "FACT-arcorbit-feedback-integration-contract",
            "fact_revision": 1,
            "target": {
              "kind": "software_invariant",
              "ref": "accepted-facts-are-realized",
              "revision": null
            },
            "effect": "threatened",
            "reason": "稳定契约已建立，但生产 ArcOrbit 尚未实现入口、配置、SDK WebContents 和测试。",
            "gap_ids": [
              "GAP-implement-arcorbit-product-feedback-sdk"
            ],
            "evidence": [
              "runtime/arcorbit/desktop/main.mjs",
              "runtime/arcorbit/desktop/renderer/index.html"
            ]
          },
          {
            "id": "IMPACT-product-feedback-risk-invariant",
            "fact_id": "FACT-arcorbit-feedback-integration-contract",
            "fact_revision": 1,
            "target": {
              "kind": "software_invariant",
              "ref": "material-risks-have-credible-evidence",
              "revision": null
            },
            "effect": "threatened",
            "reason": "风险边界已定义，但 API Key 不泄露、safeStorage 失败关闭和远端 WebContents 隔离仍需生产实现与自动化证据。",
            "gap_ids": [
              "GAP-implement-arcorbit-product-feedback-sdk"
            ],
            "evidence": [
              "arckit/tech/arcorbit/product-feedback-integration.md"
            ]
          }
        ],
        "impacts_updated": [
          {
            "id": "IMPACT-product-feedback-support-decision",
            "fact_id": "FACT-arcorbit-feedback-integration-contract",
            "fact_revision": 1,
            "target": {
              "kind": "software_decision",
              "ref": "feedback_and_support",
              "revision": 5
            },
            "effect": "upheld",
            "reason": "反馈与支持决定已纳入 ArcOrbit 自身单一产品反馈中心并保留现有操作反馈与验收问题边界。",
            "gap_ids": [],
            "evidence": [
              "arckit/spec/agentic-software-development/arcorbit-platform-capabilities.md",
              "arckit/interaction/product-feedback-center/interaction.md"
            ]
          }
        ],
        "gaps_added": [
          {
            "id": "GAP-implement-arcorbit-product-feedback-sdk",
            "status": "open",
            "goal": "在生产 ArcOrbit 中实现已接受的产品反馈中心：受信设置 UI、安全本地凭据、稳定 Workshop 用户身份、受限 Feedback SDK WebContents、提交/我的反馈切换及自动化回归均成立。",
            "reason": "产品、交互和技术契约已经明确，但生产 Desktop 尚未实现入口、配置、SDK 承载和验证。",
            "derived_from": [
              "FACT-arcorbit-product-feedback-request",
              "FACT-arcorbit-feedback-integration-contract"
            ],
            "blocked_by": [
              "GAP-establish-arcorbit-feedback-integration-contract"
            ],
            "priority_basis": {
              "blocking": "这是用户可实际使用反馈能力的唯一剩余 Agent 前置。",
              "uncertainty": "中；契约已明确，具体 Electron 生命周期与测试仍需实现验证。",
              "risk": "高；涉及远端内容、客户端 API Key、主进程身份和安全存储。",
              "user_impact": "高；未实现前用户无法在 ArcOrbit 内提交产品反馈。"
            },
            "responsibility": "agent",
            "evidence_required": [
              "生产入口、设置 UI、main/preload/feedback-center shell 与受限 SDK WebContents 实现",
              "API Key 不进入仓库、普通设置、Renderer snapshot、URL 或日志的自动化证据",
              "未登录、未配置、安全存储不可用、SDK 未 ready 与账户切换的失败关闭测试",
              "提交反馈与我的反馈复用同一 SDK 页面且配置字段互斥的测试",
              "ArcOrbit 相关与全量回归通过"
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
            "observed_revision": 9,
            "set_decision": {
              "status": "settled",
              "statement": "ArcOrbit preserves Setup Readiness, supervised one-thread-per-todo automation, trusted ledger transitions, intervention/recovery and acceptance feedback while providing Desktop composition of Workshop organizations, organization and project membership, personal and organization projects, seven-state todos, ordinary user feedback, local Product Workspaces and a persistent multi-product Workset. Organization governance is complete for the current service boundary through overview, member/project management, truthful role visibility, join-by-code and project-bound one-shot invitations. ArcOrbit 还提供与 Workset Feedback 和验收问题独立的自身产品反馈中心，支持提交反馈与查看当前用户反馈。",
              "reason": "当前用户明确要求在 ArcOrbit 内向 ArcOrbit 产品提反馈，稳定规格已经界定该独立能力。",
              "evidence": [
                "User request received 2026-08-19",
                "arckit/spec/agentic-software-development/arcorbit-platform-capabilities.md",
                "arckit/interaction/product-feedback-center/interaction.md",
                "arckit/tech/arcorbit/product-feedback-integration.md"
              ],
              "confidence": "high",
              "resume_condition": "当产品反馈范围、通知能力或与 Workshop Feedback 的边界变化时重审。"
            },
            "gap_refs": [],
            "reason": "当前用户明确要求在 ArcOrbit 内向 ArcOrbit 产品提反馈，稳定规格已经界定该独立能力。",
            "evidence": [
              "User request received 2026-08-19",
              "arckit/spec/agentic-software-development/arcorbit-platform-capabilities.md",
              "arckit/tech/arcorbit/product-feedback-integration.md"
            ]
          },
          {
            "area_ref": "experience_and_interaction",
            "observed_revision": 16,
            "set_decision": {
              "status": "settled",
              "statement": "ArcOrbit realizes simultaneous multi-product Today, Work, Automation and Feedback through a persistent Workset and a shared top product-set observation scope. Every ADVANCE page can switch between the complete product set and one member product and can open product-set management; this scope never changes execution eligibility. Work owns the seven todo-status filters, Automation owns the acceptance-feedback-only filter, and primary navigation has no TASK STATUS group. Platform governance remains in a Workset-independent Organization center. Users choose an organization or Personal Projects scope, then use Overview, Members and Projects; the overview exposes the visible member-by-project relationship, ordinary members see participating projects, owner/admin see the organization-wide project scope, member details do not imply targeted invitations, and project owner/admin create explicitly one-shot project-bound invitations. Project binding can add a local project in place and continue binding. The global sidebar footer exposes only a user-avatar account entry, with no standalone add-project, local Runtime or task-source entries; the preserved account page uses the Workshop current-user platform display name. 顶部命令栏提供唯一的“产品反馈”入口，打开独立反馈中心并在同一窗口切换提交反馈与我的反馈；未登录、未配置或 SDK 失败时提供脱敏恢复。",
              "reason": "产品反馈中心交互源与灰度投影明确了不改变现有侧栏信息架构的全局入口和状态流。",
              "evidence": [
                "User request received 2026-08-19",
                "arckit/spec/agentic-software-development/arcorbit-platform-capabilities.md",
                "arckit/interaction/product-feedback-center/interaction.md",
                "arckit/tech/arcorbit/product-feedback-integration.md"
              ],
              "confidence": "high",
              "resume_condition": "当入口位置、模式切换或恢复责任变化时重审。"
            },
            "gap_refs": [],
            "reason": "产品反馈中心交互源与灰度投影明确了不改变现有侧栏信息架构的全局入口和状态流。",
            "evidence": [
              "User request received 2026-08-19",
              "arckit/spec/agentic-software-development/arcorbit-platform-capabilities.md",
              "arckit/tech/arcorbit/product-feedback-integration.md"
            ]
          },
          {
            "area_ref": "identity_and_access",
            "observed_revision": 2,
            "set_decision": {
              "status": "settled",
              "statement": "Authentication is required only for configured execution/task sources; authorization remains bounded by user approval, workspace scope, sandbox and trusted entrypoints. Runtime sessions use a server-backed rolling seven-day inactivity window: successful verification login, successful startup session restoration/refresh, or successful token refresh renews the window through rotated server credentials; only more than seven days without such activity, missing or expired credentials, explicit logout, or explicit server rejection/revocation requires login again. ArcOrbit 产品反馈要求有效 Workshop 登录，并以服务端 current-user 的不可变业务 ID 作为反馈身份；退出或切换账户会关闭旧反馈上下文。",
              "reason": "反馈归属必须稳定且不能使用邮箱、手机号、昵称或 Renderer 可编辑身份。",
              "evidence": [
                "User request received 2026-08-19",
                "arckit/spec/agentic-software-development/arcorbit-platform-capabilities.md",
                "arckit/interaction/product-feedback-center/interaction.md",
                "arckit/tech/arcorbit/product-feedback-integration.md"
              ],
              "confidence": "high",
              "resume_condition": "当支持游客反馈或反馈身份迁移时重审。"
            },
            "gap_refs": [],
            "reason": "反馈归属必须稳定且不能使用邮箱、手机号、昵称或 Renderer 可编辑身份。",
            "evidence": [
              "User request received 2026-08-19",
              "arckit/spec/agentic-software-development/arcorbit-platform-capabilities.md",
              "arckit/tech/arcorbit/product-feedback-integration.md"
            ]
          },
          {
            "area_ref": "data_and_state",
            "observed_revision": 7,
            "set_decision": {
              "status": "settled",
              "statement": "Canonical development state remains in Project/Iteration/Case ledgers and Workshop remains source of truth for account, organization, project, membership, task, attachment, and ordinary-feedback records. ArcOrbit owns Product Workspace bindings from a Workshop Project to a local repository, persistent multi-product workset preferences, Runtime execution/session/thread state, intervention/recovery state, and first-class acceptance-feedback records outside the target repository. ArcOrbit userData 还保存产品反馈 Project ID、脱敏配置状态和 safeStorage 加密的项目专用 API Key；反馈正文、消息和状态仍由 Feedback 平台拥有。",
              "reason": "本地只拥有受信配置，不能复制反馈记录为第二个真相源。",
              "evidence": [
                "User request received 2026-08-19",
                "arckit/spec/agentic-software-development/arcorbit-platform-capabilities.md",
                "arckit/interaction/product-feedback-center/interaction.md",
                "arckit/tech/arcorbit/product-feedback-integration.md"
              ],
              "confidence": "high",
              "resume_condition": "当凭据迁移、备份或服务端 Session 模式可用时重审。"
            },
            "gap_refs": [],
            "reason": "本地只拥有受信配置，不能复制反馈记录为第二个真相源。",
            "evidence": [
              "User request received 2026-08-19",
              "arckit/spec/agentic-software-development/arcorbit-platform-capabilities.md",
              "arckit/tech/arcorbit/product-feedback-integration.md"
            ]
          },
          {
            "area_ref": "external_integrations",
            "observed_revision": 3,
            "set_decision": {
              "status": "settled",
              "statement": "ArcOrbit integrates with Codex app-server/CLI and Workshop through explicit main-process adapters; trusted ledger entrypoints remain repository-owned. Workshop authentication preserves server-rotated credentials and the rolling seven-day inactivity contract. The Automation adapter remains executor-scoped, while the separate Platform Adapter reads organization, project, membership, full project task and Feedback V1 domains. Feedback V2 remains disabled until a separately trusted adapter proves capability; missing conditional update, member authorization and task-history service contracts are surfaced as weak consistency or unavailable actions rather than invented behavior. ArcOrbit 自身产品反馈独立使用 Feedback SDK WebView V2 的 API Key 直连契约；它不启用 Platform Feedback V2 管理 adapter，也不推断未确认的宿主 Session endpoint。",
              "reason": "目标 skill 的版本化 SDK 契约与现有 Workshop Platform Adapter 边界要求两类 V2 能力保持独立。",
              "evidence": [
                "User request received 2026-08-19",
                "arckit/spec/agentic-software-development/arcorbit-platform-capabilities.md",
                "arckit/interaction/product-feedback-center/interaction.md",
                "arckit/tech/arcorbit/product-feedback-integration.md"
              ],
              "confidence": "high",
              "resume_condition": "当宿主 Session endpoint 或原生 API 获得完整平台契约时重审。"
            },
            "gap_refs": [],
            "reason": "目标 skill 的版本化 SDK 契约与现有 Workshop Platform Adapter 边界要求两类 V2 能力保持独立。",
            "evidence": [
              "User request received 2026-08-19",
              "arckit/spec/agentic-software-development/arcorbit-platform-capabilities.md",
              "arckit/tech/arcorbit/product-feedback-integration.md"
            ]
          },
          {
            "area_ref": "feedback_and_support",
            "observed_revision": 4,
            "set_decision": {
              "status": "settled",
              "statement": "Operational feedback uses the persistent Agent conversation, Runtime activity/events, diagnostics and task-source synchronization. Recovery feedback continues an interrupted active execution on its task session/thread; acceptance feedback from completed or accepted review creates an independent persisted work item, keeps the source todo terminal, reuses its session/thread and exposes issue progress and solution evidence. No separate public support portal is currently required. ArcOrbit 同时提供自身产品反馈中心：一个入口内提交反馈并查看当前用户反馈；它使用 Feedback SDK V2，与 Runtime 恢复反馈、验收问题和 Workset 普通用户反馈相互独立。",
              "reason": "当前用户明确要求独立产品内反馈能力，稳定规格和交互已明确支持边界。",
              "evidence": [
                "User request received 2026-08-19",
                "arckit/spec/agentic-software-development/arcorbit-platform-capabilities.md",
                "arckit/interaction/product-feedback-center/interaction.md",
                "arckit/tech/arcorbit/product-feedback-integration.md"
              ],
              "confidence": "high",
              "resume_condition": "当反馈处理责任、公开支持入口、未读通知或身份模式变化时重审。"
            },
            "gap_refs": [],
            "reason": "当前用户明确要求独立产品内反馈能力，稳定规格和交互已明确支持边界。",
            "evidence": [
              "User request received 2026-08-19",
              "arckit/spec/agentic-software-development/arcorbit-platform-capabilities.md",
              "arckit/tech/arcorbit/product-feedback-integration.md"
            ]
          },
          {
            "area_ref": "technical_foundation",
            "observed_revision": 20,
            "set_decision": {
              "status": "settled",
              "statement": "Arckit uses repository-owned Markdown/JSON state and Node.js ESM ledger CLIs; ArcOrbit is its Electron Desktop/Runtime host. The policy-neutral Runtime Kernel, persistent one-thread-per-todo model and trusted capabilities remain unchanged. Platform composition uses Desktop Store v10, a main-process Platform Coordinator, restricted Workshop Platform Adapter and typed preload IPC. ArcOrbit consumes existing Workshop services without requiring backend changes: organization-scoped request context supplies known project organization identity, current-member is_external marks external participation, remote Workshop records remain authoritative, and Renderer receives neither credentials nor generic request access. Packaged ArcOrbit no longer reinterprets its Electron executable as Node: Electron main launches the Runtime with utilityProcess, typed parent-port controls preserve steer/interrupt semantics, trusted ledger orchestration calls manifest-resolved module APIs in process, standalone Codex remains an external executable, and packaging disables the RunAsNode/Node-options/CLI-inspect fuses while enforcing ASAR integrity. The current BrowserWindow Renderer loads from a file:// entry inside app.asar, so its File Protocol privilege fuse remains enabled and is verified independently from the disabled Node-mode fuses. 产品反馈由 Electron main process 管理受限子 BrowserWindow 与独立 SDK WebContents；主 file:// Renderer 不直接嵌入生产跨域 iframe，也不获得 SDK 凭据或通用远端访问。",
              "reason": "该承载保持现有 loadFile Renderer 和主进程认证边界，同时满足 SDK WebView V2 readiness 与跨域限制。",
              "evidence": [
                "User request received 2026-08-19",
                "arckit/spec/agentic-software-development/arcorbit-platform-capabilities.md",
                "arckit/interaction/product-feedback-center/interaction.md",
                "arckit/tech/arcorbit/product-feedback-integration.md"
              ],
              "confidence": "high",
              "resume_condition": "当 Renderer origin、Electron WebContents API 或 Feedback SDK loader 契约变化时重审。"
            },
            "gap_refs": [],
            "reason": "该承载保持现有 loadFile Renderer 和主进程认证边界，同时满足 SDK WebView V2 readiness 与跨域限制。",
            "evidence": [
              "User request received 2026-08-19",
              "arckit/spec/agentic-software-development/arcorbit-platform-capabilities.md",
              "arckit/tech/arcorbit/product-feedback-integration.md"
            ]
          },
          {
            "area_ref": "security_privacy_compliance",
            "observed_revision": 1,
            "set_decision": {
              "status": "settled",
              "statement": "Secrets stay outside canonical project state; Runtime enforces login/configured-source boundaries, workspace authorization, sandbox/approval rules and trusted deterministic writes. 产品反馈 API Key 仅通过受信设置 UI 采集并由 Electron safeStorage 保存；不进入仓库、普通设置、Renderer snapshot、URL、日志或报告，安全存储不可用时失败关闭，同时明确客户端运行期 Key 可提取风险。",
              "reason": "产品反馈接入引入新的客户端凭据和远端内容边界，必须显式治理。",
              "evidence": [
                "User request received 2026-08-19",
                "arckit/spec/agentic-software-development/arcorbit-platform-capabilities.md",
                "arckit/interaction/product-feedback-center/interaction.md",
                "arckit/tech/arcorbit/product-feedback-integration.md"
              ],
              "confidence": "high",
              "resume_condition": "当认证改为宿主 Session、secret-store backend 或平台权限模型变化时重审。"
            },
            "gap_refs": [],
            "reason": "产品反馈接入引入新的客户端凭据和远端内容边界，必须显式治理。",
            "evidence": [
              "User request received 2026-08-19",
              "arckit/spec/agentic-software-development/arcorbit-platform-capabilities.md",
              "arckit/tech/arcorbit/product-feedback-integration.md"
            ]
          }
        ],
        "software_invariant_changes": [],
        "project_gap_changes": [],
        "selection_context_change": {
          "current_focus": "在生产 ArcOrbit 中实现并验证已接受的产品反馈 SDK、受信配置、稳定身份与失败关闭契约。"
        },
        "evidence": [
          "User request received 2026-08-19",
          "arckit/spec/agentic-software-development/arcorbit-platform-capabilities.md",
          "arckit/interaction/product-feedback-center/interaction.md",
          "arckit/interaction/product-feedback-center/default.html",
          "arckit/tech/arcorbit/product-feedback-integration.md",
          "runtime/arcorbit/desktop/main.mjs",
          "runtime/arcorbit/src/task-source-adapter.mjs",
          "git diff --check: passed"
        ]
      },
      "invariant_assessment": {
        "project_revision": 118,
        "judgments": [
          {
            "invariant_ref": "product-expectations-remain-recoverable",
            "disposition": "upheld",
            "reason": "产品规格明确 ArcOrbit 自身反馈中心的能力、边界和验收含义。",
            "fact_refs": [
              "FACT-arcorbit-feedback-integration-contract"
            ],
            "evidence": [
              "arckit/spec/agentic-software-development/arcorbit-platform-capabilities.md"
            ],
            "gap_refs": []
          },
          {
            "invariant_ref": "interaction-expectations-remain-recoverable",
            "disposition": "upheld",
            "reason": "交互策略与灰度投影覆盖唯一入口、模式、门禁、错误和恢复。",
            "fact_refs": [
              "FACT-arcorbit-feedback-integration-contract"
            ],
            "evidence": [
              "arckit/interaction/product-feedback-center/interaction.md",
              "arckit/interaction/product-feedback-center/default.html"
            ],
            "gap_refs": []
          },
          {
            "invariant_ref": "visual-language-remains-consistent",
            "disposition": "not_relevant",
            "reason": "本轮只使用既有灰度线框语言表达状态，没有建立或改变持久视觉规则。",
            "fact_refs": [],
            "evidence": [],
            "gap_refs": []
          },
          {
            "invariant_ref": "technical-decisions-remain-explainable",
            "disposition": "upheld",
            "reason": "技术方案可恢复 SDK 模式、Electron 承载、身份、存储、IPC 与安全理由。",
            "fact_refs": [
              "FACT-arcorbit-feedback-integration-contract"
            ],
            "evidence": [
              "arckit/tech/arcorbit/product-feedback-integration.md"
            ],
            "gap_refs": []
          },
          {
            "invariant_ref": "accepted-facts-are-realized",
            "disposition": "threatened",
            "reason": "契约已接受，但生产实现和回归证据仍缺失。",
            "fact_refs": [
              "FACT-arcorbit-feedback-integration-contract"
            ],
            "evidence": [],
            "gap_refs": [
              "GAP-implement-arcorbit-product-feedback-sdk"
            ]
          },
          {
            "invariant_ref": "material-risks-have-credible-evidence",
            "disposition": "threatened",
            "reason": "凭据和远端内容风险边界已定义，但控制措施尚未由生产实现和自动化测试证明。",
            "fact_refs": [
              "FACT-arcorbit-feedback-integration-contract"
            ],
            "evidence": [],
            "gap_refs": [
              "GAP-implement-arcorbit-product-feedback-sdk"
            ]
          }
        ]
      },
      "evidence": [
        "User request received 2026-08-19",
        "arckit/spec/agentic-software-development/arcorbit-platform-capabilities.md",
        "arckit/interaction/product-feedback-center/interaction.md",
        "arckit/interaction/product-feedback-center/default.html",
        "arckit/tech/arcorbit/product-feedback-integration.md",
        "runtime/arcorbit/desktop/main.mjs",
        "runtime/arcorbit/src/task-source-adapter.mjs",
        "git diff --check: passed"
      ],
      "runtime_result_ref": "",
      "occurred_at": "2026-08-19T06:39:54.463Z"
    },
    {
      "round": 2,
      "transition_schema_version": "arckit-case-transition/v8",
      "goal": "实现并验证 ArcOrbit 产品内反馈入口、安全参数生命周期、当前用户身份、受限 SDK 窗口和恢复行为。",
      "outcome": "needs_human",
      "gap_selection": {
        "mode": "candidate",
        "basis": "产品反馈接入契约已被接受，当前唯一 ready Case Gap 是把入口、安全配置、Workshop 身份与受限 SDK WebContents 实现在生产 ArcOrbit 并形成回归证据。",
        "snapshot_token": "af708bafe0a1344d0cf9ad3c662af2b9424ae3555014c4009df9b7da3f1e13cd",
        "selected_ref": "case-gap:CASE-20260819-003:GAP-implement-arcorbit-product-feedback-sdk",
        "comparison_summary": "选择唯一 ready 的当前 Case 实现 Gap；四个 Project gaps 均需要独立 Case，且不阻塞本次产品反馈实现，因此延后。",
        "fresh_discovery_summary": "实现与自动化验证证明代码侧契约已兑现；真实 Feedback 平台 Project ID/API Key 未由用户提供且不得伪造，因此发现一个仅能由人工配置并执行线上验收的新 Gap。",
        "considered": [
          {
            "ref": "project-gap:GAP-agent-scenario-evaluation",
            "source": "persisted",
            "eligibility": "case_required",
            "disposition": "deferred",
            "priority_basis": {
              "blocking": "不阻塞当前 Case。",
              "uncertainty": "高。",
              "risk": "高但边界独立。",
              "user_impact": "低于当前明确请求。"
            },
            "reason": "Agent 场景评测需要独立 Case，不替代产品反馈生产实现。"
          },
          {
            "ref": "project-gap:GAP-runtime-resilience-and-adapters",
            "source": "persisted",
            "eligibility": "case_required",
            "disposition": "deferred",
            "priority_basis": {
              "blocking": "不阻塞当前 Case。",
              "uncertainty": "中。",
              "risk": "高但边界独立。",
              "user_impact": "当前反馈能力更直接。"
            },
            "reason": "Runtime 韧性与 Feedback SDK Desktop 接入相互独立。"
          },
          {
            "ref": "project-gap:GAP-security-real-project-validation",
            "source": "persisted",
            "eligibility": "case_required",
            "disposition": "deferred",
            "priority_basis": {
              "blocking": "不阻塞本次受限反馈接入。",
              "uncertainty": "中。",
              "risk": "高。",
              "user_impact": "属于仓库级更广验证。"
            },
            "reason": "该 Project Gap 要求独立权限项目的广义安全验证；本 Case 已对自身凭据和远端内容边界做专项实现与测试。"
          },
          {
            "ref": "project-gap:GAP-cross-record-audit",
            "source": "persisted",
            "eligibility": "case_required",
            "disposition": "deferred",
            "priority_basis": {
              "blocking": "不阻塞当前 Case。",
              "uncertainty": "中。",
              "risk": "高但范围独立。",
              "user_impact": "低于当前产品入口。"
            },
            "reason": "跨记录审计需要独立 Case，不替代当前实现和产品验收。"
          },
          {
            "ref": "case-gap:CASE-20260819-003:GAP-implement-arcorbit-product-feedback-sdk",
            "source": "persisted",
            "eligibility": "ready",
            "disposition": "selected",
            "priority_basis": {
              "blocking": "直接阻塞用户请求的产品内反馈能力。",
              "uncertainty": "中，契约明确但 Electron 生命周期需验证。",
              "risk": "高，涉及客户端 Key 和远端内容。",
              "user_impact": "高。"
            },
            "reason": "这是唯一 ready Case Gap，且生产实现、失败关闭与回归均已在本轮完成。"
          }
        ]
      },
      "selected_gap": {
        "id": "GAP-implement-arcorbit-product-feedback-sdk",
        "responsibility": "agent",
        "goal": "在生产 ArcOrbit 中实现已接受的产品反馈中心：受信设置 UI、安全本地凭据、稳定 Workshop 用户身份、受限 Feedback SDK WebContents、提交/我的反馈切换及自动化回归均成立。",
        "reason": "产品、交互和技术契约已经明确，但生产 Desktop 尚未实现入口、配置、SDK 承载和验证。",
        "derived_from": [
          "FACT-arcorbit-product-feedback-request",
          "FACT-arcorbit-feedback-integration-contract"
        ],
        "blocked_by": [
          "GAP-establish-arcorbit-feedback-integration-contract"
        ],
        "priority_basis": {
          "blocking": "这是用户可实际使用反馈能力的唯一剩余 Agent 前置。",
          "uncertainty": "中；契约已明确，具体 Electron 生命周期与测试仍需实现验证。",
          "risk": "高；涉及远端内容、客户端 API Key、主进程身份和安全存储。",
          "user_impact": "高；未实现前用户无法在 ArcOrbit 内提交产品反馈。"
        },
        "evidence_required": [
          "生产入口、设置 UI、main/preload/feedback-center shell 与受限 SDK WebContents 实现",
          "API Key 不进入仓库、普通设置、Renderer snapshot、URL 或日志的自动化证据",
          "未登录、未配置、安全存储不可用、SDK 未 ready 与账户切换的失败关闭测试",
          "提交反馈与我的反馈复用同一 SDK 页面且配置字段互斥的测试",
          "ArcOrbit 相关与全量回归通过"
        ]
      },
      "planned_transition": {
        "goal": "实现并验证 ArcOrbit 产品内反馈入口、安全参数生命周期、当前用户身份、受限 SDK 窗口和恢复行为。",
        "expected_state_change": "生产实现 Gap resolved；代码侧实现和风险控制获得自动化证据；Case 转入真实平台项目配置与线上验收的人工门禁。"
      },
      "accepted_state_delta": {
        "resolved_gap": {
          "id": "GAP-implement-arcorbit-product-feedback-sdk",
          "status": "resolved",
          "outcome": "ArcOrbit 已实现唯一产品反馈入口、write-only 配置 UI、safeStorage 凭据记录、Workshop current-user 身份、隔离 SDK WebContents，以及同窗提交/我的反馈与脱敏恢复。",
          "reason": "生产 main/preload/Renderer/反馈窗口、专项安全和生命周期测试、完整 ArcOrbit 回归及真实 Electron 布局回归共同证明代码侧契约成立。",
          "evidence": [
            "runtime/arcorbit/desktop/main.mjs",
            "runtime/arcorbit/desktop/preload.cjs",
            "runtime/arcorbit/desktop/renderer/index.html",
            "runtime/arcorbit/desktop/renderer/renderer.js",
            "runtime/arcorbit/desktop/product-feedback/",
            "runtime/arcorbit/src/product-feedback-service.mjs",
            "runtime/arcorbit/src/product-feedback-window.mjs",
            "runtime/arcorbit/test/product-feedback-service.test.mjs",
            "runtime/arcorbit/test/product-feedback-window.test.mjs",
            "npm run check: 219 tests, 217 passed, 2 environment-gated skips, 0 failed",
            "npm run test:layout: 1 passed, 0 failed",
            "git diff --check: passed"
          ]
        },
        "facts_added": [
          {
            "id": "FACT-arcorbit-product-feedback-implementation",
            "revision": 1,
            "status": "accepted",
            "statement": "生产 ArcOrbit 已按接受契约实现产品反馈：唯一全局入口在 Workshop 登录和有效配置后打开固定 Feedback SDK V2 HTTPS 文档；Project ID 和项目专用 API Key 经受信 UI 写入，Key 只以 safeStorage 密文持久化且不进入 Renderer snapshot；Workshop current-user ID 作为 customUserId；隔离 WebContents 禁用 Node、拒绝新窗口和非允许 origin，并在同一健康页面切换提交反馈与我的反馈，通知关闭。",
            "basis": "生产代码、稳定 spec/interaction/tech、专项服务与 WebContents 行为测试、全量 ArcOrbit 回归和真实 Electron 布局回归一致。",
            "evidence": [
              "arckit/spec/agentic-software-development/arcorbit-platform-capabilities.md",
              "arckit/interaction/product-feedback-center/interaction.md",
              "arckit/tech/arcorbit/product-feedback-integration.md",
              "runtime/arcorbit/src/product-feedback-service.mjs",
              "runtime/arcorbit/src/product-feedback-window.mjs",
              "runtime/arcorbit/desktop/main.mjs",
              "runtime/arcorbit/desktop/renderer/renderer.js",
              "runtime/arcorbit/test/product-feedback-service.test.mjs",
              "runtime/arcorbit/test/product-feedback-window.test.mjs",
              "npm run check: 219 tests, 217 passed, 2 environment-gated skips, 0 failed",
              "npm run test:layout: 1 passed, 0 failed"
            ]
          }
        ],
        "facts_superseded": [],
        "impacts_added": [],
        "impacts_updated": [
          {
            "id": "IMPACT-product-feedback-realization-invariant",
            "fact_id": "FACT-arcorbit-product-feedback-implementation",
            "fact_revision": 1,
            "target": {
              "kind": "software_invariant",
              "ref": "accepted-facts-are-realized",
              "revision": null
            },
            "effect": "threatened",
            "reason": "生产实现和自动化证据已成立，但真实反馈平台 Project ID/API Key 尚未由操作者在应用内配置，尚无真实提交与我的反馈证据。",
            "gap_ids": [
              "GAP-configure-and-validate-live-arcorbit-feedback-project"
            ],
            "evidence": [
              "runtime/arcorbit/src/product-feedback-service.mjs",
              "runtime/arcorbit/src/product-feedback-window.mjs",
              "runtime/arcorbit/test/product-feedback-service.test.mjs",
              "runtime/arcorbit/test/product-feedback-window.test.mjs"
            ]
          },
          {
            "id": "IMPACT-product-feedback-risk-invariant",
            "fact_id": "FACT-arcorbit-product-feedback-implementation",
            "fact_revision": 1,
            "target": {
              "kind": "software_invariant",
              "ref": "material-risks-have-credible-evidence",
              "revision": null
            },
            "effect": "threatened",
            "reason": "Key 静态泄露、无安全存储、身份缺失、重复配置与远端导航风险已有自动化证据；真实项目认证、网络和端到端反馈归属仍需人工线上验证。",
            "gap_ids": [
              "GAP-configure-and-validate-live-arcorbit-feedback-project"
            ],
            "evidence": [
              "runtime/arcorbit/test/product-feedback-service.test.mjs",
              "runtime/arcorbit/test/product-feedback-window.test.mjs",
              "npm run check: 219 tests, 217 passed, 2 environment-gated skips, 0 failed"
            ]
          }
        ],
        "gaps_added": [
          {
            "id": "GAP-configure-and-validate-live-arcorbit-feedback-project",
            "status": "open",
            "goal": "在 Feedback 平台创建或选择 ArcOrbit 专用项目，由操作者在 ArcOrbit 设置内录入真实 Project ID 和项目专用 API Key，并验证当前 Workshop 用户可以提交反馈且在我的反馈中看到归属正确的记录。",
            "reason": "真实平台项目和凭据属于人工持有的外部敏感资源，Agent 不得伪造、写入仓库或要求在对话中传递；没有它们无法证明远端认证、网络和反馈归属。",
            "derived_from": [
              "FACT-arcorbit-product-feedback-request",
              "FACT-arcorbit-feedback-integration-contract",
              "FACT-arcorbit-product-feedback-implementation"
            ],
            "blocked_by": [
              "GAP-implement-arcorbit-product-feedback-sdk"
            ],
            "priority_basis": {
              "blocking": "阻塞 Case 的真实可用性验收和 Completion Review。",
              "uncertainty": "中；代码已验证，但目标项目配置和服务端认证未实测。",
              "risk": "高；真实 API Key 必须只在 ArcOrbit 受信设置 UI 内处理。",
              "user_impact": "高；未配置前入口保持可恢复但无法提交真实反馈。"
            },
            "responsibility": "human",
            "evidence_required": [
              "Feedback 平台存在 ArcOrbit 专用项目的非敏感证据，不包含 API Key",
              "ArcOrbit 设置显示产品反馈已配置，不回显 Key",
              "当前 Workshop 用户完成一次测试反馈提交并可在我的反馈中查看",
              "反馈内容和身份归属正确且无凭据泄露"
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
        "project_revision": 119,
        "judgments": [
          {
            "invariant_ref": "product-expectations-remain-recoverable",
            "disposition": "upheld",
            "reason": "稳定产品规格明确 ArcOrbit 自身反馈中心的目标、范围、身份、通知选择和未配置恢复边界。",
            "fact_refs": [
              "FACT-arcorbit-feedback-integration-contract",
              "FACT-arcorbit-product-feedback-implementation"
            ],
            "evidence": [
              "arckit/spec/agentic-software-development/arcorbit-platform-capabilities.md"
            ],
            "gap_refs": []
          },
          {
            "invariant_ref": "interaction-expectations-remain-recoverable",
            "disposition": "upheld",
            "reason": "唯一入口、同窗模式、账户/配置门禁、SDK 状态和脱敏恢复均有稳定交互源及生产映射。",
            "fact_refs": [
              "FACT-arcorbit-feedback-integration-contract",
              "FACT-arcorbit-product-feedback-implementation"
            ],
            "evidence": [
              "arckit/interaction/product-feedback-center/interaction.md",
              "arckit/interaction/product-feedback-center/default.html",
              "runtime/arcorbit/desktop/renderer/renderer.js",
              "runtime/arcorbit/desktop/product-feedback/renderer.js"
            ],
            "gap_refs": []
          },
          {
            "invariant_ref": "visual-language-remains-consistent",
            "disposition": "upheld",
            "reason": "新增入口、设置区和窗口壳复用既有 Desktop tokens、按钮、状态 pill 与灰度交互语言，真实 Electron 布局回归未破坏确认几何。",
            "fact_refs": [
              "FACT-arcorbit-product-feedback-implementation"
            ],
            "evidence": [
              "arckit/visual/_library/design-tokens.yaml",
              "runtime/arcorbit/desktop/renderer/styles.css",
              "runtime/arcorbit/desktop/product-feedback/styles.css",
              "npm run test:layout: 1 passed, 0 failed"
            ],
            "gap_refs": []
          },
          {
            "invariant_ref": "technical-decisions-remain-explainable",
            "disposition": "upheld",
            "reason": "技术来源和生产代码共同说明 apiKey 直连、secret-store、current-user、受限 WebContents、readiness、IPC 与失败关闭。",
            "fact_refs": [
              "FACT-arcorbit-feedback-integration-contract",
              "FACT-arcorbit-product-feedback-implementation"
            ],
            "evidence": [
              "arckit/tech/arcorbit/product-feedback-integration.md",
              "runtime/arcorbit/src/product-feedback-service.mjs",
              "runtime/arcorbit/src/product-feedback-window.mjs",
              "runtime/arcorbit/desktop/main.mjs"
            ],
            "gap_refs": []
          },
          {
            "invariant_ref": "accepted-facts-are-realized",
            "disposition": "threatened",
            "reason": "生产实现与自动化行为已成立，但真实项目配置、一次真实提交和我的反馈归属仍需操作者完成。",
            "fact_refs": [
              "FACT-arcorbit-product-feedback-request",
              "FACT-arcorbit-feedback-integration-contract",
              "FACT-arcorbit-product-feedback-implementation"
            ],
            "evidence": [
              "runtime/arcorbit/src/product-feedback-service.mjs",
              "runtime/arcorbit/src/product-feedback-window.mjs",
              "runtime/arcorbit/test/product-feedback-service.test.mjs",
              "runtime/arcorbit/test/product-feedback-window.test.mjs"
            ],
            "gap_refs": [
              "GAP-configure-and-validate-live-arcorbit-feedback-project"
            ]
          },
          {
            "invariant_ref": "material-risks-have-credible-evidence",
            "disposition": "threatened",
            "reason": "自动化已覆盖敏感配置、secret store、登录/身份、导航隔离与同页模式生命周期，但真实服务认证、网络和用户归属尚无端到端证据。",
            "fact_refs": [
              "FACT-arcorbit-feedback-integration-contract",
              "FACT-arcorbit-product-feedback-implementation"
            ],
            "evidence": [
              "runtime/arcorbit/test/product-feedback-service.test.mjs",
              "runtime/arcorbit/test/product-feedback-window.test.mjs",
              "npm run check: 219 tests, 217 passed, 2 environment-gated skips, 0 failed"
            ],
            "gap_refs": [
              "GAP-configure-and-validate-live-arcorbit-feedback-project"
            ]
          }
        ]
      },
      "evidence": [
        "arckit/spec/agentic-software-development/arcorbit-platform-capabilities.md",
        "arckit/interaction/product-feedback-center/interaction.md",
        "arckit/tech/arcorbit/product-feedback-integration.md",
        "runtime/arcorbit/desktop/main.mjs",
        "runtime/arcorbit/desktop/renderer/renderer.js",
        "runtime/arcorbit/desktop/product-feedback/",
        "runtime/arcorbit/src/product-feedback-service.mjs",
        "runtime/arcorbit/src/product-feedback-window.mjs",
        "runtime/arcorbit/test/product-feedback-service.test.mjs",
        "runtime/arcorbit/test/product-feedback-window.test.mjs",
        "npm run check: 219 tests, 217 passed, 2 environment-gated skips, 0 failed",
        "npm run test:layout: 1 passed, 0 failed",
        "git diff --check: passed"
      ],
      "runtime_result_ref": "",
      "occurred_at": "2026-08-19T06:53:00.056Z"
    },
    {
      "round": 3,
      "transition_schema_version": "arckit-case-transition/v8",
      "goal": "固定 ArcOrbit Feedback Project 107，开启并实现未读角标，同时保持凭据和远端内容安全边界。",
      "outcome": "needs_human",
      "gap_selection": {
        "mode": "fresh",
        "basis": "用户补充了 ArcOrbit 产品反馈的确定参数：Project ID 为 107，并明确要求开启未读角标；现有生产实现和稳定文档需立即按该契约收敛，且本轮实现与自动化验证已经完成。",
        "snapshot_token": "64d7b7d4edc4cf73557355647e363e9a1634cdcc77f0fbe9fff7b6f6bcba2ca4",
        "selected_ref": "fresh-gap:CASE-20260819-003:GAP-bind-project-107-and-enable-feedback-unread-badge",
        "comparison_summary": "选择已在本轮完成的 fresh Agent Gap，以兑现用户新给出的产品参数；四个 Project gaps 仍需独立 Case，原人工 Gap 的项目选择与凭据要求已被新事实部分替代并将在同一 transition 中重写。",
        "fresh_discovery_summary": "Project ID 107 和未读角标开启改变了已接受的通知、配置与状态契约；对话中传递的凭据不能作为安全配置证据，必须轮换后仅通过 ArcOrbit 受信设置录入。",
        "considered": [
          {
            "ref": "project-gap:GAP-agent-scenario-evaluation",
            "source": "persisted",
            "eligibility": "case_required",
            "disposition": "deferred",
            "priority_basis": {
              "blocking": "不阻塞当前 Case。",
              "uncertainty": "高。",
              "risk": "高但范围独立。",
              "user_impact": "低于当前明确参数变更。"
            },
            "reason": "Agent 场景评测需要独立 Case，不替代产品反馈参数兑现。"
          },
          {
            "ref": "project-gap:GAP-runtime-resilience-and-adapters",
            "source": "persisted",
            "eligibility": "case_required",
            "disposition": "deferred",
            "priority_basis": {
              "blocking": "不阻塞当前 Case。",
              "uncertainty": "中。",
              "risk": "高但范围独立。",
              "user_impact": "当前反馈能力更直接。"
            },
            "reason": "Runtime 韧性与 Feedback SDK 未读角标接入相互独立。"
          },
          {
            "ref": "project-gap:GAP-security-real-project-validation",
            "source": "persisted",
            "eligibility": "case_required",
            "disposition": "deferred",
            "priority_basis": {
              "blocking": "不阻塞本轮代码收敛。",
              "uncertainty": "中。",
              "risk": "高。",
              "user_impact": "属于仓库级更广验证。"
            },
            "reason": "该 Project Gap 要求独立权限项目的广义安全验证；本 Case 保留自身凭据轮换和线上验收门禁。"
          },
          {
            "ref": "project-gap:GAP-cross-record-audit",
            "source": "persisted",
            "eligibility": "case_required",
            "disposition": "deferred",
            "priority_basis": {
              "blocking": "不阻塞当前 Case。",
              "uncertainty": "中。",
              "risk": "高但范围独立。",
              "user_impact": "低于当前产品参数。"
            },
            "reason": "跨记录审计需要独立 Case，不替代当前参数和未读角标实现。"
          },
          {
            "ref": "case-gap:CASE-20260819-003:GAP-configure-and-validate-live-arcorbit-feedback-project",
            "source": "persisted",
            "eligibility": "ready",
            "disposition": "excluded",
            "priority_basis": {
              "blocking": "其真实验收责任仍阻塞 Case。",
              "uncertainty": "目标项目已确定，凭据和线上行为未验证。",
              "risk": "对话凭据已暴露，不能继续使用。",
              "user_impact": "需要以新的安全门禁继续。"
            },
            "reason": "该 Gap 仍要求选择项目和录入 Project ID，已被固定 Project ID 107 的新事实部分取代；它将取消并由只要求轮换 Key、受信录入和线上验收的新人工 Gap 承接。"
          },
          {
            "ref": "fresh-gap:CASE-20260819-003:GAP-bind-project-107-and-enable-feedback-unread-badge",
            "source": "fresh",
            "eligibility": "ready",
            "disposition": "selected",
            "priority_basis": {
              "blocking": "直接兑现用户刚确认的接入参数。",
              "uncertainty": "低；SDK 提供未读计数接口，安全跨上下文桥接需要验证。",
              "risk": "中；必须保持 origin/source 校验并避免 Key 外泄。",
              "user_impact": "高；决定反馈入口是否指向正确产品并显示待处理反馈。"
            },
            "reason": "生产代码、交互、技术方案和自动化回归均已在本轮完成 Project ID 107 固定绑定与未读角标接入。"
          }
        ]
      },
      "selected_gap": {
        "id": "GAP-bind-project-107-and-enable-feedback-unread-badge",
        "responsibility": "agent",
        "goal": "将 ArcOrbit 产品反馈固定绑定到 Project ID 107，开启 SDK 未读通知，并在全局产品反馈入口显示安全、可刷新的未读角标。",
        "reason": "用户明确提供了目标 Project ID 并要求开启未读角标，旧契约仍将 Project ID 作为可编辑配置且关闭通知。",
        "derived_from": [
          "FACT-arcorbit-product-feedback-request",
          "FACT-arcorbit-feedback-integration-contract",
          "FACT-arcorbit-product-feedback-implementation"
        ],
        "blocked_by": [],
        "priority_basis": {
          "blocking": "直接兑现本轮用户参数。",
          "uncertainty": "低。",
          "risk": "中；涉及 SDK 跨上下文未读信号。",
          "user_impact": "高。"
        },
        "evidence_required": [
          "生产服务固定使用 Project ID 107 且不再持久化或接受可编辑 Project ID",
          "SDK notifications 开启并通过受限消息桥和 getUnreadCount 刷新未读数",
          "入口显示 1-99、99+ 且 0 隐藏，登出清零",
          "专项测试、全量 ArcOrbit 回归、真实 Electron 布局回归和差异检查通过"
        ]
      },
      "planned_transition": {
        "goal": "固定 ArcOrbit Feedback Project 107，开启并实现未读角标，同时保持凭据和远端内容安全边界。",
        "expected_state_change": "新参数实现 Gap resolved；旧通知/配置事实被新 revision 取代；原人工配置 Gap 被更精确的凭据轮换与线上验收 Gap 替代。"
      },
      "accepted_state_delta": {
        "resolved_gap": {
          "id": "GAP-bind-project-107-and-enable-feedback-unread-badge",
          "status": "resolved",
          "outcome": "ArcOrbit 产品反馈已固定绑定 Project ID 107、启用 SDK 通知，并在唯一全局入口显示经过边界校验和主动刷新的未读角标。",
          "reason": "生产 main/preload/Renderer/SDK WebContents、稳定产品文档、专项测试、全量回归和布局回归共同证明参数与行为成立。",
          "evidence": [
            "runtime/arcorbit/src/product-feedback-service.mjs",
            "runtime/arcorbit/src/product-feedback-window.mjs",
            "runtime/arcorbit/desktop/main.mjs",
            "runtime/arcorbit/desktop/preload.cjs",
            "runtime/arcorbit/desktop/renderer/index.html",
            "runtime/arcorbit/desktop/renderer/renderer.js",
            "runtime/arcorbit/desktop/renderer/styles.css",
            "runtime/arcorbit/test/product-feedback-service.test.mjs",
            "runtime/arcorbit/test/product-feedback-window.test.mjs",
            "runtime/arcorbit/test/desktop-layout-static.test.mjs",
            "npm run check: 220 tests, 218 passed, 2 environment-gated skips, 0 failed",
            "npm run test:layout: 1 passed, 0 failed",
            "git diff --check: passed"
          ]
        },
        "facts_added": [
          {
            "id": "FACT-arcorbit-feedback-integration-contract",
            "revision": 2,
            "status": "accepted",
            "statement": "ArcOrbit 自身产品反馈固定使用 Feedback Project ID 107 和 Feedback SDK WebView V2 API Key 直连模式；Project ID 是产品常量，不由用户编辑或持久化，受信设置 UI 只采集轮换后的项目专用 Key并交给 Electron safeStorage。SDK 通知开启，顶部唯一产品反馈入口显示当前用户未读数；受限 WebContents、Workshop current-user 身份、提交/我的反馈同页切换与失败关闭边界保持不变。任何经对话、日志或仓库传递的 Key 均视为已暴露，不得使用，必须先轮换。",
            "basis": "用户明确指定 Project ID 107 并要求开启未读角标；稳定 spec/interaction/tech 和生产代码已同步，且敏感凭据未进入实现、命令、证据或账本。",
            "evidence": [
              "User supplied Project ID 107 and requested unread badge on 2026-08-19; credential content intentionally excluded",
              "arckit/spec/agentic-software-development/arcorbit-platform-capabilities.md",
              "arckit/interaction/product-feedback-center/interaction.md",
              "arckit/tech/arcorbit/product-feedback-integration.md"
            ]
          },
          {
            "id": "FACT-arcorbit-product-feedback-implementation",
            "revision": 2,
            "status": "accepted",
            "statement": "生产 ArcOrbit 已固定以 Project ID 107 配置 Feedback SDK，设置界面只接收 API Key；notifications enabled，独立 SDK WebContents 在严格校验 origin、window source 和消息类型后接受未读变化信号，再由 main process 调用 getUnreadCount 获取权威数量。Renderer 仅收到边界化 unread_count，入口按 1-99、99+ 或隐藏渲染，后台定时刷新，打开反馈、保存配置和重新登录后刷新，登出清零。Key 仍只由 safeStorage 加密持久化且不进入 Renderer snapshot、URL、日志、仓库或账本。",
            "basis": "生产代码、稳定文档、20 项专项回归、完整 ArcOrbit 检查和真实 Electron 布局回归一致。",
            "evidence": [
              "runtime/arcorbit/src/product-feedback-service.mjs",
              "runtime/arcorbit/src/product-feedback-window.mjs",
              "runtime/arcorbit/desktop/main.mjs",
              "runtime/arcorbit/desktop/preload.cjs",
              "runtime/arcorbit/desktop/renderer/index.html",
              "runtime/arcorbit/desktop/renderer/renderer.js",
              "runtime/arcorbit/desktop/renderer/styles.css",
              "runtime/arcorbit/test/product-feedback-service.test.mjs",
              "runtime/arcorbit/test/product-feedback-window.test.mjs",
              "runtime/arcorbit/test/desktop-layout-static.test.mjs",
              "Focused product feedback tests: 20 passed, 0 failed",
              "npm run check: 220 tests, 218 passed, 2 environment-gated skips, 0 failed",
              "npm run test:layout: 1 passed, 0 failed"
            ]
          }
        ],
        "facts_superseded": [
          {
            "id": "FACT-arcorbit-feedback-integration-contract",
            "revision": 1,
            "reason": "用户已确定 Project ID 107 并开启未读通知，旧事实的可编辑 Project ID 和通知关闭契约不再成立。",
            "evidence": [
              "User supplied Project ID 107 and requested unread badge on 2026-08-19; credential content intentionally excluded"
            ]
          },
          {
            "id": "FACT-arcorbit-product-feedback-implementation",
            "revision": 1,
            "reason": "生产实现已从可编辑 Project ID 和通知关闭升级为固定 Project 107 与未读角标。",
            "evidence": [
              "runtime/arcorbit/src/product-feedback-service.mjs",
              "runtime/arcorbit/src/product-feedback-window.mjs",
              "runtime/arcorbit/desktop/renderer/renderer.js"
            ]
          }
        ],
        "impacts_added": [
          {
            "id": "IMPACT-product-feedback-capability-decision",
            "fact_id": "FACT-arcorbit-feedback-integration-contract",
            "fact_revision": 2,
            "target": {
              "kind": "software_decision",
              "ref": "product_capabilities",
              "revision": 11
            },
            "effect": "upheld",
            "reason": "产品能力现在明确包含 Project 107 专用反馈中心和未读角标。",
            "gap_ids": [],
            "evidence": [
              "arckit/spec/agentic-software-development/arcorbit-platform-capabilities.md"
            ]
          },
          {
            "id": "IMPACT-product-feedback-experience-decision",
            "fact_id": "FACT-arcorbit-feedback-integration-contract",
            "fact_revision": 2,
            "target": {
              "kind": "software_decision",
              "ref": "experience_and_interaction",
              "revision": 18
            },
            "effect": "upheld",
            "reason": "唯一入口的未读角标、刷新、清零和配置恢复交互已有稳定来源与生产映射。",
            "gap_ids": [],
            "evidence": [
              "arckit/interaction/product-feedback-center/interaction.md",
              "runtime/arcorbit/desktop/renderer/renderer.js"
            ]
          },
          {
            "id": "IMPACT-product-feedback-data-decision",
            "fact_id": "FACT-arcorbit-feedback-integration-contract",
            "fact_revision": 2,
            "target": {
              "kind": "software_decision",
              "ref": "data_and_state",
              "revision": 9
            },
            "effect": "upheld",
            "reason": "Project ID 107 是代码内产品常量，API Key 仍为本地安全状态，未读数只作瞬时 UI 状态。",
            "gap_ids": [],
            "evidence": [
              "arckit/tech/arcorbit/product-feedback-integration.md",
              "runtime/arcorbit/src/product-feedback-service.mjs"
            ]
          }
        ],
        "impacts_updated": [
          {
            "id": "IMPACT-product-feedback-support-decision",
            "fact_id": "FACT-arcorbit-feedback-integration-contract",
            "fact_revision": 2,
            "target": {
              "kind": "software_decision",
              "ref": "feedback_and_support",
              "revision": 6
            },
            "effect": "upheld",
            "reason": "反馈与支持决定已纳入 Project 107 专用产品反馈中心和未读角标，同时保持与操作反馈、验收问题的边界。",
            "gap_ids": [],
            "evidence": [
              "arckit/spec/agentic-software-development/arcorbit-platform-capabilities.md",
              "arckit/interaction/product-feedback-center/interaction.md"
            ]
          },
          {
            "id": "IMPACT-product-feedback-interaction-invariant",
            "fact_id": "FACT-arcorbit-feedback-integration-contract",
            "fact_revision": 2,
            "target": {
              "kind": "software_invariant",
              "ref": "interaction-expectations-remain-recoverable",
              "revision": null
            },
            "effect": "upheld",
            "reason": "唯一入口、未读数量、模式切换、配置/账户门禁和恢复状态均有权威交互源与线框投影。",
            "gap_ids": [],
            "evidence": [
              "arckit/interaction/product-feedback-center/interaction.md",
              "arckit/interaction/product-feedback-center/default.html"
            ]
          },
          {
            "id": "IMPACT-product-feedback-technical-invariant",
            "fact_id": "FACT-arcorbit-feedback-integration-contract",
            "fact_revision": 2,
            "target": {
              "kind": "software_invariant",
              "ref": "technical-decisions-remain-explainable",
              "revision": null
            },
            "effect": "upheld",
            "reason": "固定项目、SDK 通知、权威 unread 查询、Electron IPC、存储、身份与失败关闭均有可恢复技术理由。",
            "gap_ids": [],
            "evidence": [
              "arckit/tech/arcorbit/product-feedback-integration.md"
            ]
          },
          {
            "id": "IMPACT-product-feedback-realization-invariant",
            "fact_id": "FACT-arcorbit-product-feedback-implementation",
            "fact_revision": 2,
            "target": {
              "kind": "software_invariant",
              "ref": "accepted-facts-are-realized",
              "revision": null
            },
            "effect": "threatened",
            "reason": "Project 107 和未读角标的生产实现与自动化证据已成立，但轮换后的真实 Key 尚未由操作者在应用内配置，且尚无真实提交、归属和未读变化证据。",
            "gap_ids": [
              "GAP-rotate-configure-and-live-validate-arcorbit-feedback"
            ],
            "evidence": [
              "runtime/arcorbit/src/product-feedback-service.mjs",
              "runtime/arcorbit/src/product-feedback-window.mjs",
              "runtime/arcorbit/test/product-feedback-service.test.mjs",
              "runtime/arcorbit/test/product-feedback-window.test.mjs"
            ]
          },
          {
            "id": "IMPACT-product-feedback-risk-invariant",
            "fact_id": "FACT-arcorbit-product-feedback-implementation",
            "fact_revision": 2,
            "target": {
              "kind": "software_invariant",
              "ref": "material-risks-have-credible-evidence",
              "revision": null
            },
            "effect": "threatened",
            "reason": "安全存储、身份、导航隔离、消息来源校验、未读边界和登出清理已有自动化证据；已暴露凭据仍须撤销，真实服务认证、网络、归属和未读变化仍需人工线上验证。",
            "gap_ids": [
              "GAP-rotate-configure-and-live-validate-arcorbit-feedback"
            ],
            "evidence": [
              "runtime/arcorbit/test/product-feedback-service.test.mjs",
              "runtime/arcorbit/test/product-feedback-window.test.mjs",
              "npm run check: 220 tests, 218 passed, 2 environment-gated skips, 0 failed"
            ]
          }
        ],
        "gaps_added": [
          {
            "id": "GAP-rotate-configure-and-live-validate-arcorbit-feedback",
            "status": "open",
            "goal": "撤销经对话暴露的旧 Key，在 Feedback 平台为 Project 107 生成新的项目专用 Key，仅通过 ArcOrbit 受信设置录入，并验证当前 Workshop 用户可提交反馈、在我的反馈中看到正确归属，且未读角标随服务端未读状态更新并在查看后清零。",
            "reason": "Project ID 和通知选择已经确定，但对话中出现过的凭据不能安全使用；Agent 不得保存、复用或自行操作真实平台凭据，也无法替代当前用户完成线上认证和反馈归属验收。",
            "derived_from": [
              "FACT-arcorbit-product-feedback-request",
              "FACT-arcorbit-feedback-integration-contract",
              "FACT-arcorbit-product-feedback-implementation"
            ],
            "blocked_by": [
              "GAP-bind-project-107-and-enable-feedback-unread-badge"
            ],
            "priority_basis": {
              "blocking": "阻塞 Case 的真实可用性验收和 Completion Review。",
              "uncertainty": "中；代码已验证，真实服务行为未实测。",
              "risk": "高；旧凭据必须撤销，新凭据只能进入受信设置 UI。",
              "user_impact": "高；未安全配置前无法提交真实反馈或验证未读角标。"
            },
            "responsibility": "human",
            "evidence_required": [
              "旧 Key 已在 Feedback 平台撤销或轮换的非敏感确认，不包含任何 Key 内容",
              "ArcOrbit 设置显示 Project ID 107 和产品反馈已配置，但不回显 Key",
              "当前 Workshop 用户完成一次测试反馈提交并可在我的反馈中查看正确归属",
              "另一条反馈消息或状态产生未读后，入口角标更新；打开我的反馈后角标清零",
              "反馈内容、身份和未读状态正确且无凭据泄露"
            ],
            "resolution": null
          }
        ],
        "gaps_cancelled": [
          {
            "id": "GAP-configure-and-validate-live-arcorbit-feedback-project",
            "outcome": "由固定 Project 107 的安全凭据轮换与线上验收 Gap 替代",
            "reason": "用户已经指定 Project ID 107，旧 Gap 的创建/选择项目和录入 Project ID 要求已过时；对话中暴露的 Key 也要求把后续责任明确改为先撤销轮换，再仅通过受信 UI 录入。",
            "evidence": [
              "User supplied Project ID 107 and requested unread badge on 2026-08-19; credential content intentionally excluded",
              "arckit/tech/arcorbit/product-feedback-integration.md"
            ]
          }
        ],
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
            "observed_revision": 10,
            "set_decision": {
              "status": "settled",
              "statement": "ArcOrbit preserves Setup Readiness, supervised one-thread-per-todo automation, trusted ledger transitions, intervention/recovery and acceptance feedback while providing Desktop composition of Workshop organizations, organization and project membership, personal and organization projects, seven-state todos, ordinary user feedback, local Product Workspaces and a persistent multi-product Workset. Organization governance is complete for the current service boundary through overview, member/project management, truthful role visibility, join-by-code and project-bound one-shot invitations. ArcOrbit 还提供与 Workset Feedback 和验收问题独立的自身产品反馈中心，固定服务于 Feedback Project 107，支持提交反馈、查看当前用户反馈，并在唯一入口显示 SDK 未读数量角标。",
              "reason": "用户明确指定 Project ID 107 并要求开启未读角标，稳定规格和生产实现已经兑现。",
              "evidence": [
                "User supplied Project ID 107 and requested unread badge on 2026-08-19; credential content intentionally excluded",
                "arckit/spec/agentic-software-development/arcorbit-platform-capabilities.md",
                "arckit/interaction/product-feedback-center/interaction.md",
                "arckit/tech/arcorbit/product-feedback-integration.md"
              ],
              "confidence": "high",
              "resume_condition": "当产品反馈范围、目标项目、通知能力或与 Workshop Feedback 的边界变化时重审。"
            },
            "gap_refs": [],
            "reason": "将用户确认的固定项目和未读通知提升为可恢复产品能力决定。",
            "evidence": [
              "arckit/spec/agentic-software-development/arcorbit-platform-capabilities.md",
              "runtime/arcorbit/src/product-feedback-service.mjs",
              "runtime/arcorbit/desktop/renderer/renderer.js"
            ]
          },
          {
            "area_ref": "experience_and_interaction",
            "observed_revision": 17,
            "set_decision": {
              "status": "settled",
              "statement": "ArcOrbit realizes simultaneous multi-product Today, Work, Automation and Feedback through a persistent Workset and a shared top product-set observation scope. Every ADVANCE page can switch between the complete product set and one member product and can open product-set management; this scope never changes execution eligibility. Work owns the seven todo-status filters, Automation owns the acceptance-feedback-only filter, and primary navigation has no TASK STATUS group. Platform governance remains in a Workset-independent Organization center. Users choose an organization or Personal Projects scope, then use Overview, Members and Projects; the overview exposes the visible member-by-project relationship, ordinary members see participating projects, owner/admin see the organization-wide project scope, member details do not imply targeted invitations, and project owner/admin create explicitly one-shot project-bound invitations. Project binding can add a local project in place and continue binding. The global sidebar footer exposes only a user-avatar account entry, with no standalone add-project, local Runtime or task-source entries; the preserved account page uses the Workshop current-user platform display name. 顶部命令栏提供唯一的“产品反馈”入口，入口在 Project 107 存在未读时显示 1-99 或 99+，零未读隐藏；打开独立反馈中心并在同一窗口切换提交反馈与我的反馈，打开后刷新未读，退出账户清零；未登录、未配置或 SDK 失败时提供脱敏恢复。",
              "reason": "稳定交互源和生产实现明确了未读角标、刷新、清零和原有恢复状态。",
              "evidence": [
                "User supplied Project ID 107 and requested unread badge on 2026-08-19; credential content intentionally excluded",
                "arckit/interaction/product-feedback-center/interaction.md",
                "arckit/interaction/product-feedback-center/default.html",
                "runtime/arcorbit/desktop/renderer/renderer.js"
              ],
              "confidence": "high",
              "resume_condition": "当入口位置、角标语义、模式切换或恢复责任变化时重审。"
            },
            "gap_refs": [],
            "reason": "未读角标改变唯一入口的稳定可见状态和账户生命周期行为。",
            "evidence": [
              "arckit/interaction/product-feedback-center/interaction.md",
              "arckit/interaction/product-feedback-center/default.html",
              "runtime/arcorbit/desktop/renderer/renderer.js"
            ]
          },
          {
            "area_ref": "data_and_state",
            "observed_revision": 8,
            "set_decision": {
              "status": "settled",
              "statement": "Canonical development state remains in Project/Iteration/Case ledgers and Workshop remains source of truth for account, organization, project, membership, task, attachment, and ordinary-feedback records. ArcOrbit owns Product Workspace bindings from a Workshop Project to a local repository, persistent multi-product workset preferences, Runtime execution/session/thread state, intervention/recovery state, and first-class acceptance-feedback records outside the target repository. ArcOrbit 将产品反馈 Project ID 107 作为代码内产品常量，不在 userData 持久化或接受用户修改；userData 只保存脱敏配置状态和 safeStorage 加密的项目专用 API Key，未读数量是运行期瞬时 UI 状态，反馈正文、消息和状态仍由 Feedback 平台拥有。",
              "reason": "固定产品项目减少错误配置，本地仍只拥有受信凭据状态而不复制远端反馈记录。",
              "evidence": [
                "arckit/spec/agentic-software-development/arcorbit-platform-capabilities.md",
                "arckit/tech/arcorbit/product-feedback-integration.md",
                "runtime/arcorbit/src/product-feedback-service.mjs"
              ],
              "confidence": "high",
              "resume_condition": "当目标 Project、凭据迁移、未读持久化、备份或服务端 Session 模式可用时重审。"
            },
            "gap_refs": [],
            "reason": "Project ID 从用户配置变成产品常量，未读数成为运行期状态，旧数据决定需要纠正。",
            "evidence": [
              "arckit/tech/arcorbit/product-feedback-integration.md",
              "runtime/arcorbit/src/product-feedback-service.mjs"
            ]
          },
          {
            "area_ref": "feedback_and_support",
            "observed_revision": 5,
            "set_decision": {
              "status": "settled",
              "statement": "Operational feedback uses the persistent Agent conversation, Runtime activity/events, diagnostics and task-source synchronization. Recovery feedback continues an interrupted active execution on its task session/thread; acceptance feedback from completed or accepted review creates an independent persisted work item, keeps the source todo terminal, reuses its session/thread and exposes issue progress and solution evidence. No separate public support portal is currently required. ArcOrbit 同时提供自身产品反馈中心：一个入口内向固定 Feedback Project 107 提交反馈、查看当前用户反馈并显示 SDK 未读数量角标；它使用 Feedback SDK V2，与 Runtime 恢复反馈、验收问题和 Workset 普通用户反馈相互独立。",
              "reason": "用户明确要求独立产品内反馈和未读角标，稳定规格、交互与生产实现已经兑现。",
              "evidence": [
                "User supplied Project ID 107 and requested unread badge on 2026-08-19; credential content intentionally excluded",
                "arckit/spec/agentic-software-development/arcorbit-platform-capabilities.md",
                "arckit/interaction/product-feedback-center/interaction.md",
                "arckit/tech/arcorbit/product-feedback-integration.md"
              ],
              "confidence": "high",
              "resume_condition": "当反馈处理责任、公开支持入口、目标项目、未读通知或身份模式变化时重审。"
            },
            "gap_refs": [],
            "reason": "固定 Project 107 和未读角标扩展了已接受的反馈支持契约。",
            "evidence": [
              "arckit/spec/agentic-software-development/arcorbit-platform-capabilities.md",
              "arckit/interaction/product-feedback-center/interaction.md"
            ]
          }
        ],
        "software_invariant_changes": [],
        "project_gap_changes": [],
        "selection_context_change": {
          "current_focus": "由操作者撤销对话中暴露的旧凭据，为固定 Feedback Project 107 生成新 Key，仅在 ArcOrbit 受信设置内录入，并完成提交、归属和未读角标的真实验收。"
        },
        "evidence": [
          "User supplied Project ID 107 and requested unread badge on 2026-08-19; credential content intentionally excluded",
          "arckit/spec/agentic-software-development/arcorbit-platform-capabilities.md",
          "arckit/interaction/product-feedback-center/interaction.md",
          "arckit/tech/arcorbit/product-feedback-integration.md",
          "runtime/arcorbit/src/product-feedback-service.mjs",
          "runtime/arcorbit/src/product-feedback-window.mjs",
          "runtime/arcorbit/desktop/renderer/renderer.js"
        ]
      },
      "invariant_assessment": {
        "project_revision": 119,
        "judgments": [
          {
            "invariant_ref": "product-expectations-remain-recoverable",
            "disposition": "upheld",
            "reason": "稳定产品规格和更新后的 Project 决定明确固定 Project 107、未读角标、身份、配置和恢复边界。",
            "fact_refs": [
              "FACT-arcorbit-feedback-integration-contract",
              "FACT-arcorbit-product-feedback-implementation"
            ],
            "evidence": [
              "arckit/spec/agentic-software-development/arcorbit-platform-capabilities.md"
            ],
            "gap_refs": []
          },
          {
            "invariant_ref": "interaction-expectations-remain-recoverable",
            "disposition": "upheld",
            "reason": "唯一入口、未读角标、同窗模式、账户/配置门禁、SDK 状态和脱敏恢复均有稳定交互源与生产映射。",
            "fact_refs": [
              "FACT-arcorbit-feedback-integration-contract",
              "FACT-arcorbit-product-feedback-implementation"
            ],
            "evidence": [
              "arckit/interaction/product-feedback-center/interaction.md",
              "arckit/interaction/product-feedback-center/default.html",
              "runtime/arcorbit/desktop/renderer/renderer.js"
            ],
            "gap_refs": []
          },
          {
            "invariant_ref": "visual-language-remains-consistent",
            "disposition": "upheld",
            "reason": "未读角标复用既有 Desktop 色彩、圆角与排版 tokens，真实 Electron 布局回归未破坏确认几何。",
            "fact_refs": [
              "FACT-arcorbit-product-feedback-implementation"
            ],
            "evidence": [
              "arckit/visual/_library/design-tokens.yaml",
              "runtime/arcorbit/desktop/renderer/styles.css",
              "npm run test:layout: 1 passed, 0 failed"
            ],
            "gap_refs": []
          },
          {
            "invariant_ref": "technical-decisions-remain-explainable",
            "disposition": "upheld",
            "reason": "技术来源和生产代码共同说明固定 Project 107、通知开启、权威 unread 查询、严格消息信号、secret-store、current-user、IPC 与失败关闭。",
            "fact_refs": [
              "FACT-arcorbit-feedback-integration-contract",
              "FACT-arcorbit-product-feedback-implementation"
            ],
            "evidence": [
              "arckit/tech/arcorbit/product-feedback-integration.md",
              "runtime/arcorbit/src/product-feedback-service.mjs",
              "runtime/arcorbit/src/product-feedback-window.mjs",
              "runtime/arcorbit/desktop/main.mjs"
            ],
            "gap_refs": []
          },
          {
            "invariant_ref": "accepted-facts-are-realized",
            "disposition": "threatened",
            "reason": "固定 Project 107 与未读角标的生产实现和自动化行为已成立，但轮换后的真实 Key 配置、一次真实提交、我的反馈归属和真实未读变化仍需操作者完成。",
            "fact_refs": [
              "FACT-arcorbit-product-feedback-request",
              "FACT-arcorbit-feedback-integration-contract",
              "FACT-arcorbit-product-feedback-implementation"
            ],
            "evidence": [
              "runtime/arcorbit/src/product-feedback-service.mjs",
              "runtime/arcorbit/src/product-feedback-window.mjs",
              "runtime/arcorbit/test/product-feedback-service.test.mjs",
              "runtime/arcorbit/test/product-feedback-window.test.mjs"
            ],
            "gap_refs": [
              "GAP-rotate-configure-and-live-validate-arcorbit-feedback"
            ]
          },
          {
            "invariant_ref": "material-risks-have-credible-evidence",
            "disposition": "threatened",
            "reason": "自动化已覆盖安全配置、固定项目、secret store、身份、导航隔离、严格未读信号、边界化 IPC 和登出清理；已暴露 Key 的撤销以及真实认证、网络、用户归属和未读变化尚无端到端证据。",
            "fact_refs": [
              "FACT-arcorbit-feedback-integration-contract",
              "FACT-arcorbit-product-feedback-implementation"
            ],
            "evidence": [
              "runtime/arcorbit/test/product-feedback-service.test.mjs",
              "runtime/arcorbit/test/product-feedback-window.test.mjs",
              "npm run check: 220 tests, 218 passed, 2 environment-gated skips, 0 failed"
            ],
            "gap_refs": [
              "GAP-rotate-configure-and-live-validate-arcorbit-feedback"
            ]
          }
        ]
      },
      "evidence": [
        "User supplied Project ID 107 and requested unread badge on 2026-08-19; credential content intentionally excluded",
        "arckit/spec/agentic-software-development/arcorbit-platform-capabilities.md",
        "arckit/interaction/product-feedback-center/interaction.md",
        "arckit/interaction/product-feedback-center/default.html",
        "arckit/tech/arcorbit/product-feedback-integration.md",
        "runtime/arcorbit/src/product-feedback-service.mjs",
        "runtime/arcorbit/src/product-feedback-window.mjs",
        "runtime/arcorbit/desktop/main.mjs",
        "runtime/arcorbit/desktop/preload.cjs",
        "runtime/arcorbit/desktop/renderer/index.html",
        "runtime/arcorbit/desktop/renderer/renderer.js",
        "runtime/arcorbit/desktop/renderer/styles.css",
        "runtime/arcorbit/test/product-feedback-service.test.mjs",
        "runtime/arcorbit/test/product-feedback-window.test.mjs",
        "runtime/arcorbit/test/desktop-layout-static.test.mjs",
        "Focused product feedback tests: 20 passed, 0 failed",
        "npm run check: 220 tests, 218 passed, 2 environment-gated skips, 0 failed",
        "npm run test:layout: 1 passed, 0 failed",
        "git diff --check: passed"
      ],
      "runtime_result_ref": "",
      "occurred_at": "2026-08-19T08:01:48.136Z"
    },
    {
      "round": 4,
      "transition_schema_version": "arckit-case-transition/v8",
      "goal": "实现无配置的 ArcOrbit 内置产品反馈，并使安全、交互和状态事实与静态凭据决定一致。",
      "outcome": "completed",
      "gap_selection": {
        "mode": "fresh",
        "basis": "用户明确取消产品反馈配置页，并授权将当前项目专用 Key 直接写入代码，让普通用户登录后无配置使用；生产实现、稳定文档和回归已按该决定完成。",
        "snapshot_token": "56dbe64bcf1b35f514103449db85efbf15d5a18d4d8142d20ba8554ccb68ae5b",
        "selected_ref": "fresh-gap:CASE-20260819-003:GAP-bundle-feedback-key-and-remove-user-configuration",
        "comparison_summary": "选择已经完成的 fresh Agent Gap，以兑现用户最新明确决策；原人工轮换和设置页配置 Gap 已被静态内置凭据决定取代，四个 Project gaps 仍需独立 Case。",
        "fresh_discovery_summary": "静态内置 Key 使 secret-store、配置页和未配置恢复契约全部过时，同时将源码与安装包可提取风险变为明确接受的产品边界。",
        "considered": [
          {
            "ref": "project-gap:GAP-agent-scenario-evaluation",
            "source": "persisted",
            "eligibility": "case_required",
            "disposition": "deferred",
            "priority_basis": {
              "blocking": "不阻塞当前 Case。",
              "uncertainty": "高。",
              "risk": "高但范围独立。",
              "user_impact": "低于当前明确实现变更。"
            },
            "reason": "需要独立 Case。"
          },
          {
            "ref": "project-gap:GAP-runtime-resilience-and-adapters",
            "source": "persisted",
            "eligibility": "case_required",
            "disposition": "deferred",
            "priority_basis": {
              "blocking": "不阻塞当前 Case。",
              "uncertainty": "中。",
              "risk": "高但范围独立。",
              "user_impact": "当前反馈入口更直接。"
            },
            "reason": "与反馈静态配置无直接依赖。"
          },
          {
            "ref": "project-gap:GAP-security-real-project-validation",
            "source": "persisted",
            "eligibility": "case_required",
            "disposition": "deferred",
            "priority_basis": {
              "blocking": "不阻塞本轮实现。",
              "uncertainty": "中。",
              "risk": "高。",
              "user_impact": "属于更广权限验证。"
            },
            "reason": "本轮如实记录静态 Key 风险，但不替代仓库级真实权限项目验证。"
          },
          {
            "ref": "project-gap:GAP-cross-record-audit",
            "source": "persisted",
            "eligibility": "case_required",
            "disposition": "deferred",
            "priority_basis": {
              "blocking": "不阻塞当前 Case。",
              "uncertainty": "中。",
              "risk": "高但范围独立。",
              "user_impact": "低于当前产品行为。"
            },
            "reason": "需要独立 Case。"
          },
          {
            "ref": "case-gap:CASE-20260819-003:GAP-rotate-configure-and-live-validate-arcorbit-feedback",
            "source": "persisted",
            "eligibility": "ready",
            "disposition": "excluded",
            "priority_basis": {
              "blocking": "不再阻塞用户要求的内置模式。",
              "uncertainty": "线上服务仍可在后续运行中观察。",
              "risk": "用户明确接受静态分发和后续自行轮换。",
              "user_impact": "设置页会违背最新要求。"
            },
            "reason": "该 Gap 要求撤销当前 Key 并通过设置页录入新 Key，与用户最新明确决定直接冲突，将被取消。"
          },
          {
            "ref": "fresh-gap:CASE-20260819-003:GAP-bundle-feedback-key-and-remove-user-configuration",
            "source": "fresh",
            "eligibility": "ready",
            "disposition": "selected",
            "priority_basis": {
              "blocking": "直接决定产品是否无需配置即可反馈。",
              "uncertainty": "低；实现范围明确。",
              "risk": "高；Key 会进入源码和安装包。",
              "user_impact": "高；移除普通用户配置负担。"
            },
            "reason": "代码、UI、IPC、文档和自动化回归均已完成并如实表达静态凭据风险。"
          }
        ]
      },
      "selected_gap": {
        "id": "GAP-bundle-feedback-key-and-remove-user-configuration",
        "responsibility": "agent",
        "goal": "将 Project 107 的产品反馈 Key 作为 ArcOrbit 内置代码常量，删除用户配置页和凭据保存/清除 IPC，使登录用户直接使用反馈与未读角标。",
        "reason": "用户明确要求在代码层写死且用户无需关注配置。",
        "derived_from": [
          "FACT-arcorbit-product-feedback-request",
          "FACT-arcorbit-feedback-integration-contract",
          "FACT-arcorbit-product-feedback-implementation"
        ],
        "blocked_by": [],
        "priority_basis": {
          "blocking": "直接兑现用户最新要求。",
          "uncertainty": "低。",
          "risk": "高；静态凭据可从客户端提取。",
          "user_impact": "高。"
        },
        "evidence_required": [
          "生产服务内置固定 Project 107 和非空 Key",
          "设置页及保存/清除凭据 IPC 被删除",
          "登录后直接打开和后台刷新未读",
          "稳定文档明确源码和安装包可提取风险及重新构建轮换方式",
          "专项、全量和布局回归通过"
        ]
      },
      "planned_transition": {
        "goal": "实现无配置的 ArcOrbit 内置产品反馈，并使安全、交互和状态事实与静态凭据决定一致。",
        "expected_state_change": "静态内置实现 Gap resolved；secret-store 与设置页事实被 supersede；原人工配置 Gap cancelled；Case 只剩 completion review。"
      },
      "accepted_state_delta": {
        "resolved_gap": {
          "id": "GAP-bundle-feedback-key-and-remove-user-configuration",
          "status": "resolved",
          "outcome": "ArcOrbit 已将 Project 107 的项目专用 Key 内置在产品代码，删除反馈配置页和凭据写入/清除 IPC；登录用户可直接提交反馈、查看自己的反馈和接收未读角标。",
          "reason": "生产服务、main/preload/Renderer、稳定文档、20 项专项测试、220 项全量检查和真实 Electron 布局回归一致。",
          "evidence": [
            "runtime/arcorbit/src/product-feedback-service.mjs",
            "runtime/arcorbit/desktop/main.mjs",
            "runtime/arcorbit/desktop/preload.cjs",
            "runtime/arcorbit/desktop/renderer/index.html",
            "runtime/arcorbit/desktop/renderer/renderer.js",
            "runtime/arcorbit/test/product-feedback-service.test.mjs",
            "runtime/arcorbit/test/product-feedback-window.test.mjs",
            "runtime/arcorbit/test/desktop-renderer.test.mjs",
            "Focused product feedback tests: 20 passed, 0 failed",
            "npm run check: 220 tests, 218 passed, 2 environment-gated skips, 0 failed",
            "npm run test:layout: 1 passed, 0 failed",
            "git diff --check: passed"
          ]
        },
        "facts_added": [
          {
            "id": "FACT-arcorbit-feedback-integration-contract",
            "revision": 3,
            "status": "accepted",
            "statement": "ArcOrbit 产品反馈固定使用 Project ID 107、Feedback SDK WebView V2 API Key 直连和未读通知。项目专用 Key 作为 bundled-static 产品代码常量进入源码与安装包，普通用户没有反馈配置页、Key 状态或轮换操作；轮换需修改代码并重新构建发布。Key 不进入 URL、Renderer snapshot、IPC、日志或报告，但源码、安装包和客户端运行时均可提取，因此只使用项目专用、最小权限、可轮换的 Key。",
            "basis": "用户明确要求把当前 Key 写死在代码中并移除配置页；稳定规格、交互、技术方案与生产实现已同步。",
            "evidence": [
              "User explicitly requested bundled code credential and no configuration UI on 2026-08-19; credential content intentionally omitted from ledger",
              "arckit/spec/agentic-software-development/arcorbit-platform-capabilities.md",
              "arckit/interaction/product-feedback-center/interaction.md",
              "arckit/tech/arcorbit/product-feedback-integration.md"
            ]
          },
          {
            "id": "FACT-arcorbit-product-feedback-implementation",
            "revision": 3,
            "status": "accepted",
            "statement": "生产 ArcOrbit 的 product-feedback-service 内置固定 Project 107 和项目专用 Key，状态恒为 bundled-static/configured；运行时只门禁 Workshop 登录和稳定 current-user ID。Desktop 不再引入 safeStorage，不再创建产品反馈 userData 记录，也不暴露保存、清除或打开反馈控制台的配置 IPC；设置页完全没有产品反馈参数。受限 SDK WebContents、提交/我的反馈同页切换、严格未读信号、60 秒刷新和登出清零保持成立。",
            "basis": "生产代码、稳定文档、专项测试、全量检查与布局回归一致。",
            "evidence": [
              "runtime/arcorbit/src/product-feedback-service.mjs",
              "runtime/arcorbit/desktop/main.mjs",
              "runtime/arcorbit/desktop/preload.cjs",
              "runtime/arcorbit/desktop/renderer/index.html",
              "runtime/arcorbit/desktop/renderer/renderer.js",
              "runtime/arcorbit/test/product-feedback-service.test.mjs",
              "runtime/arcorbit/test/product-feedback-window.test.mjs",
              "runtime/arcorbit/test/desktop-renderer.test.mjs",
              "npm run check: 220 tests, 218 passed, 2 environment-gated skips, 0 failed",
              "npm run test:layout: 1 passed, 0 failed"
            ]
          }
        ],
        "facts_superseded": [
          {
            "id": "FACT-arcorbit-feedback-integration-contract",
            "revision": 2,
            "reason": "用户明确以 bundled-static 取代受信设置和 safeStorage 契约。",
            "evidence": [
              "User explicitly requested bundled code credential and no configuration UI on 2026-08-19; credential content intentionally omitted from ledger"
            ]
          },
          {
            "id": "FACT-arcorbit-product-feedback-implementation",
            "revision": 2,
            "reason": "生产实现已删除配置页、safeStorage 和凭据配置 IPC，改为内置静态 Key。",
            "evidence": [
              "runtime/arcorbit/src/product-feedback-service.mjs",
              "runtime/arcorbit/desktop/main.mjs",
              "runtime/arcorbit/desktop/renderer/index.html"
            ]
          }
        ],
        "impacts_added": [
          {
            "id": "IMPACT-product-feedback-security-decision",
            "fact_id": "FACT-arcorbit-feedback-integration-contract",
            "fact_revision": 3,
            "target": {
              "kind": "software_decision",
              "ref": "security_privacy_compliance",
              "revision": 3
            },
            "effect": "upheld",
            "reason": "安全决定如实记录 Project 107 Key 的静态分发、可提取风险、最小权限要求和代码重建轮换边界。",
            "gap_ids": [],
            "evidence": [
              "arckit/tech/arcorbit/product-feedback-integration.md",
              "runtime/arcorbit/src/product-feedback-service.mjs"
            ]
          }
        ],
        "impacts_updated": [
          {
            "id": "IMPACT-product-feedback-support-decision",
            "fact_id": "FACT-arcorbit-feedback-integration-contract",
            "fact_revision": 3,
            "target": {
              "kind": "software_decision",
              "ref": "feedback_and_support",
              "revision": 6
            },
            "effect": "upheld",
            "reason": "固定 Project 107、无配置入口、提交/我的反馈和未读角标保持既定支持边界。",
            "gap_ids": [],
            "evidence": [
              "arckit/spec/agentic-software-development/arcorbit-platform-capabilities.md",
              "arckit/interaction/product-feedback-center/interaction.md"
            ]
          },
          {
            "id": "IMPACT-product-feedback-interaction-invariant",
            "fact_id": "FACT-arcorbit-feedback-integration-contract",
            "fact_revision": 3,
            "target": {
              "kind": "software_invariant",
              "ref": "interaction-expectations-remain-recoverable",
              "revision": null
            },
            "effect": "upheld",
            "reason": "交互来源已移除配置页和未配置状态，明确登录后直接使用和 SDK 失败恢复。",
            "gap_ids": [],
            "evidence": [
              "arckit/interaction/product-feedback-center/interaction.md",
              "arckit/interaction/product-feedback-center/default.html"
            ]
          },
          {
            "id": "IMPACT-product-feedback-technical-invariant",
            "fact_id": "FACT-arcorbit-feedback-integration-contract",
            "fact_revision": 3,
            "target": {
              "kind": "software_invariant",
              "ref": "technical-decisions-remain-explainable",
              "revision": null
            },
            "effect": "upheld",
            "reason": "bundled-static Key、无配置 IPC、受限 WebContents、current-user 和未读生命周期均有明确技术说明。",
            "gap_ids": [],
            "evidence": [
              "arckit/tech/arcorbit/product-feedback-integration.md"
            ]
          },
          {
            "id": "IMPACT-product-feedback-realization-invariant",
            "fact_id": "FACT-arcorbit-product-feedback-implementation",
            "fact_revision": 3,
            "target": {
              "kind": "software_invariant",
              "ref": "accepted-facts-are-realized",
              "revision": null
            },
            "effect": "upheld",
            "reason": "无配置内置反馈、固定 Project 107、当前用户身份、提交/我的反馈和未读角标已由生产代码与自动化验证实现。",
            "gap_ids": [],
            "evidence": [
              "runtime/arcorbit/src/product-feedback-service.mjs",
              "runtime/arcorbit/desktop/main.mjs",
              "runtime/arcorbit/desktop/renderer/renderer.js",
              "npm run check: 220 tests, 218 passed, 2 environment-gated skips, 0 failed"
            ]
          },
          {
            "id": "IMPACT-product-feedback-risk-invariant",
            "fact_id": "FACT-arcorbit-product-feedback-implementation",
            "fact_revision": 3,
            "target": {
              "kind": "software_invariant",
              "ref": "material-risks-have-credible-evidence",
              "revision": null
            },
            "effect": "upheld",
            "reason": "静态 Key 可从源码、安装包和运行时提取的风险已被明确接受并写入技术边界；自动化证明凭据不会通过 UI、IPC、URL 或日志进一步传播，轮换责任是改代码并重新发布。",
            "gap_ids": [],
            "evidence": [
              "arckit/tech/arcorbit/product-feedback-integration.md",
              "runtime/arcorbit/test/product-feedback-service.test.mjs",
              "runtime/arcorbit/test/product-feedback-window.test.mjs",
              "runtime/arcorbit/test/desktop-renderer.test.mjs"
            ]
          },
          {
            "id": "IMPACT-product-feedback-capability-decision",
            "fact_id": "FACT-arcorbit-feedback-integration-contract",
            "fact_revision": 3,
            "target": {
              "kind": "software_decision",
              "ref": "product_capabilities",
              "revision": 11
            },
            "effect": "upheld",
            "reason": "无配置内置凭据不改变固定 Project 107 反馈中心和未读角标能力。",
            "gap_ids": [],
            "evidence": [
              "arckit/spec/agentic-software-development/arcorbit-platform-capabilities.md"
            ]
          },
          {
            "id": "IMPACT-product-feedback-experience-decision",
            "fact_id": "FACT-arcorbit-feedback-integration-contract",
            "fact_revision": 3,
            "target": {
              "kind": "software_decision",
              "ref": "experience_and_interaction",
              "revision": 19
            },
            "effect": "upheld",
            "reason": "登录后直接打开、无配置页和未读角标生命周期已成为当前交互决定。",
            "gap_ids": [],
            "evidence": [
              "arckit/interaction/product-feedback-center/interaction.md",
              "runtime/arcorbit/desktop/renderer/renderer.js"
            ]
          },
          {
            "id": "IMPACT-product-feedback-data-decision",
            "fact_id": "FACT-arcorbit-feedback-integration-contract",
            "fact_revision": 3,
            "target": {
              "kind": "software_decision",
              "ref": "data_and_state",
              "revision": 10
            },
            "effect": "upheld",
            "reason": "Project ID 与 Key 都由产品代码拥有，userData 不保存产品反馈凭据，未读仍为运行期状态。",
            "gap_ids": [],
            "evidence": [
              "arckit/tech/arcorbit/product-feedback-integration.md",
              "runtime/arcorbit/src/product-feedback-service.mjs"
            ]
          }
        ],
        "gaps_added": [],
        "gaps_cancelled": [
          {
            "id": "GAP-rotate-configure-and-live-validate-arcorbit-feedback",
            "outcome": "由用户明确接受的 bundled-static 无配置实现取代",
            "reason": "该 Gap 的撤销旧 Key、生成新 Key和设置页录入要求与用户最新明确决定冲突；静态 Key 的源码/安装包可提取和后续重新构建轮换风险已转为接受事实。",
            "evidence": [
              "User explicitly requested bundled code credential and no configuration UI on 2026-08-19; credential content intentionally omitted from ledger",
              "arckit/tech/arcorbit/product-feedback-integration.md"
            ]
          }
        ],
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
            "observed_revision": 18,
            "set_decision": {
              "status": "settled",
              "statement": "ArcOrbit realizes simultaneous multi-product Today, Work, Automation and Feedback through a persistent Workset and a shared top product-set observation scope. Every ADVANCE page can switch between the complete product set and one member product and can open product-set management; this scope never changes execution eligibility. Work owns the seven todo-status filters, Automation owns the acceptance-feedback-only filter, and primary navigation has no TASK STATUS group. Platform governance remains in a Workset-independent Organization center. Users choose an organization or Personal Projects scope, then use Overview, Members and Projects; the overview exposes the visible member-by-project relationship, ordinary members see participating projects, owner/admin see the organization-wide project scope, member details do not imply targeted invitations, and project owner/admin create explicitly one-shot project-bound invitations. Project binding can add a local project in place and continue binding. The global sidebar footer exposes only a user-avatar account entry, with no standalone add-project, local Runtime or task-source entries; the preserved account page uses the Workshop current-user platform display name. 顶部命令栏提供唯一的“产品反馈”入口，登录用户无需配置即可向内置 Project 107 提交反馈并在同一窗口查看自己的反馈；入口按 1-99、99+ 显示未读，零未读隐藏，退出账户清零；未登录或 SDK 失败时提供脱敏恢复。",
              "reason": "用户明确删除反馈配置页，生产交互与稳定来源已改为登录后直接使用。",
              "evidence": [
                "User explicitly requested bundled code credential and no configuration UI on 2026-08-19; credential content intentionally omitted from ledger",
                "arckit/interaction/product-feedback-center/interaction.md",
                "arckit/interaction/product-feedback-center/default.html",
                "runtime/arcorbit/desktop/renderer/index.html",
                "runtime/arcorbit/desktop/renderer/renderer.js"
              ],
              "confidence": "high",
              "resume_condition": "当入口位置、配置责任、角标语义、模式切换或恢复责任变化时重审。"
            },
            "gap_refs": [],
            "reason": "移除普通用户反馈配置页和未配置恢复。",
            "evidence": [
              "arckit/interaction/product-feedback-center/interaction.md",
              "runtime/arcorbit/desktop/renderer/index.html"
            ]
          },
          {
            "area_ref": "data_and_state",
            "observed_revision": 9,
            "set_decision": {
              "status": "settled",
              "statement": "Canonical development state remains in Project/Iteration/Case ledgers and Workshop remains source of truth for account, organization, project, membership, task, attachment, and ordinary-feedback records. ArcOrbit owns Product Workspace bindings from a Workshop Project to a local repository, persistent multi-product workset preferences, Runtime execution/session/thread state, intervention/recovery state, and first-class acceptance-feedback records outside the target repository. 产品反馈 Project ID 107 和项目专用 API Key 都是 ArcOrbit 产品代码常量并进入打包产物，不写入 userData；未读数量是运行期瞬时 UI 状态，反馈正文、消息和状态仍由 Feedback 平台拥有。",
              "reason": "用户选择 bundled-static 凭据并移除 safeStorage 状态。",
              "evidence": [
                "arckit/spec/agentic-software-development/arcorbit-platform-capabilities.md",
                "arckit/tech/arcorbit/product-feedback-integration.md",
                "runtime/arcorbit/src/product-feedback-service.mjs"
              ],
              "confidence": "high",
              "resume_condition": "当目标 Project、凭据分发、未读持久化或服务端 Session 模式变化时重审。"
            },
            "gap_refs": [],
            "reason": "纠正旧 userData/safeStorage 所有权描述。",
            "evidence": [
              "arckit/tech/arcorbit/product-feedback-integration.md",
              "runtime/arcorbit/src/product-feedback-service.mjs"
            ]
          },
          {
            "area_ref": "security_privacy_compliance",
            "observed_revision": 2,
            "set_decision": {
              "status": "settled",
              "statement": "Runtime 和 Workshop 服务凭据保持在受控存储与边界内；ArcOrbit 产品反馈是用户明确接受的例外：Project 107 的项目专用 API Key 作为 bundled-static 常量进入源码与安装包，客户端持有者可提取，因此必须保持最小权限、项目专用和可轮换。该 Key 不进入 URL、Renderer snapshot、IPC、日志或报告；轮换需要修改代码、重新构建发布并按升级节奏撤销旧 Key。",
              "reason": "用户明确选择无配置静态 Key 分发，安全决定必须如实表达而不能继续宣称 secret-store。",
              "evidence": [
                "User explicitly requested bundled code credential and no configuration UI on 2026-08-19; credential content intentionally omitted from ledger",
                "arckit/spec/agentic-software-development/arcorbit-platform-capabilities.md",
                "arckit/tech/arcorbit/product-feedback-integration.md",
                "runtime/arcorbit/src/product-feedback-service.mjs"
              ],
              "confidence": "high",
              "resume_condition": "当反馈认证改为宿主 Session、Key 权限/分发或客户端发布策略变化时重审。"
            },
            "gap_refs": [],
            "reason": "静态 Key 是安全边界的材料变化。",
            "evidence": [
              "arckit/tech/arcorbit/product-feedback-integration.md",
              "runtime/arcorbit/src/product-feedback-service.mjs"
            ]
          }
        ],
        "software_invariant_changes": [],
        "project_gap_changes": [],
        "selection_context_change": {
          "current_focus": "对内置 Project 107 产品反馈实现执行 completion review，并在无发现时关闭当前 Case。"
        },
        "evidence": [
          "User explicitly requested bundled code credential and no configuration UI on 2026-08-19; credential content intentionally omitted from ledger",
          "arckit/spec/agentic-software-development/arcorbit-platform-capabilities.md",
          "arckit/interaction/product-feedback-center/interaction.md",
          "arckit/tech/arcorbit/product-feedback-integration.md",
          "runtime/arcorbit/src/product-feedback-service.mjs",
          "runtime/arcorbit/desktop/main.mjs",
          "runtime/arcorbit/desktop/renderer/index.html"
        ]
      },
      "invariant_assessment": {
        "project_revision": 120,
        "judgments": [
          {
            "invariant_ref": "product-expectations-remain-recoverable",
            "disposition": "upheld",
            "reason": "规格和 Project 决定明确固定 Project 107、无用户配置、静态凭据、提交/我的反馈和未读角标。",
            "fact_refs": [
              "FACT-arcorbit-feedback-integration-contract",
              "FACT-arcorbit-product-feedback-implementation"
            ],
            "evidence": [
              "arckit/spec/agentic-software-development/arcorbit-platform-capabilities.md"
            ],
            "gap_refs": []
          },
          {
            "invariant_ref": "interaction-expectations-remain-recoverable",
            "disposition": "upheld",
            "reason": "配置页已从交互和生产 UI 移除，登录、直接打开、同窗模式、未读和 SDK 错误恢复均可恢复。",
            "fact_refs": [
              "FACT-arcorbit-feedback-integration-contract",
              "FACT-arcorbit-product-feedback-implementation"
            ],
            "evidence": [
              "arckit/interaction/product-feedback-center/interaction.md",
              "arckit/interaction/product-feedback-center/default.html",
              "runtime/arcorbit/desktop/renderer/index.html",
              "runtime/arcorbit/desktop/renderer/renderer.js"
            ],
            "gap_refs": []
          },
          {
            "invariant_ref": "visual-language-remains-consistent",
            "disposition": "upheld",
            "reason": "删除设置区减少了额外界面，保留入口、角标和反馈窗口继续复用 Desktop tokens，布局回归通过。",
            "fact_refs": [
              "FACT-arcorbit-product-feedback-implementation"
            ],
            "evidence": [
              "runtime/arcorbit/desktop/renderer/styles.css",
              "npm run test:layout: 1 passed, 0 failed"
            ],
            "gap_refs": []
          },
          {
            "invariant_ref": "technical-decisions-remain-explainable",
            "disposition": "upheld",
            "reason": "bundled-static Key、无配置 IPC、受限 WebContents、身份和未读生命周期均由技术来源与代码解释。",
            "fact_refs": [
              "FACT-arcorbit-feedback-integration-contract",
              "FACT-arcorbit-product-feedback-implementation"
            ],
            "evidence": [
              "arckit/tech/arcorbit/product-feedback-integration.md",
              "runtime/arcorbit/src/product-feedback-service.mjs",
              "runtime/arcorbit/src/product-feedback-window.mjs",
              "runtime/arcorbit/desktop/main.mjs"
            ],
            "gap_refs": []
          },
          {
            "invariant_ref": "accepted-facts-are-realized",
            "disposition": "upheld",
            "reason": "无配置内置反馈的接受事实已由生产代码、UI/IPC 删除和完整自动化回归兑现。",
            "fact_refs": [
              "FACT-arcorbit-product-feedback-request",
              "FACT-arcorbit-feedback-integration-contract",
              "FACT-arcorbit-product-feedback-implementation"
            ],
            "evidence": [
              "runtime/arcorbit/src/product-feedback-service.mjs",
              "runtime/arcorbit/desktop/main.mjs",
              "runtime/arcorbit/desktop/preload.cjs",
              "runtime/arcorbit/desktop/renderer/index.html",
              "npm run check: 220 tests, 218 passed, 2 environment-gated skips, 0 failed"
            ],
            "gap_refs": []
          },
          {
            "invariant_ref": "material-risks-have-credible-evidence",
            "disposition": "upheld",
            "reason": "静态凭据可提取风险、最小权限和重新构建轮换责任已明确；测试证明主 Renderer、配置 UI、IPC、URL 和日志不扩大 Key 暴露面。",
            "fact_refs": [
              "FACT-arcorbit-feedback-integration-contract",
              "FACT-arcorbit-product-feedback-implementation"
            ],
            "evidence": [
              "arckit/tech/arcorbit/product-feedback-integration.md",
              "runtime/arcorbit/test/product-feedback-service.test.mjs",
              "runtime/arcorbit/test/product-feedback-window.test.mjs",
              "runtime/arcorbit/test/desktop-renderer.test.mjs"
            ],
            "gap_refs": []
          }
        ]
      },
      "evidence": [
        "User explicitly requested bundled code credential and no configuration UI on 2026-08-19; credential content intentionally omitted from ledger",
        "arckit/spec/agentic-software-development/arcorbit-platform-capabilities.md",
        "arckit/interaction/product-feedback-center/interaction.md",
        "arckit/interaction/product-feedback-center/default.html",
        "arckit/tech/arcorbit/product-feedback-integration.md",
        "runtime/arcorbit/src/product-feedback-service.mjs",
        "runtime/arcorbit/src/product-feedback-window.mjs",
        "runtime/arcorbit/desktop/main.mjs",
        "runtime/arcorbit/desktop/preload.cjs",
        "runtime/arcorbit/desktop/renderer/index.html",
        "runtime/arcorbit/desktop/renderer/renderer.js",
        "runtime/arcorbit/test/product-feedback-service.test.mjs",
        "runtime/arcorbit/test/product-feedback-window.test.mjs",
        "runtime/arcorbit/test/desktop-renderer.test.mjs",
        "Focused product feedback tests: 20 passed, 0 failed",
        "npm run check: 220 tests, 218 passed, 2 environment-gated skips, 0 failed",
        "npm run test:layout: 1 passed, 0 failed",
        "git diff --check: passed"
      ],
      "runtime_result_ref": "",
      "occurred_at": "2026-08-19T08:12:00.493Z"
    },
    {
      "round": 5,
      "transition_schema_version": "arckit-case-transition/v8",
      "goal": "对 ArcOrbit 内置 Project 107 产品反馈实现执行五维 completion review。",
      "outcome": "completed",
      "gap_selection": {
        "mode": "candidate",
        "basis": "所有普通 Case Gap、问题、handoff 和 threatened impacts 已闭合，当前唯一 Case candidate 是 content revision 4 的 completion review。",
        "snapshot_token": "1558d7ddb905be250fd54c77940ad6f7e0f1a1f0621f4cdfd60f9de025f3e12e",
        "selected_ref": "case-gap:CASE-20260819-003:CASE-20260819-003:completion-review:1",
        "comparison_summary": "选择唯一 ready Case completion review；四个 Project gaps 需要独立 Case且不影响本实现收口。",
        "fresh_discovery_summary": "独立复核未发现比 completion review 更优先的新普通 Gap。",
        "considered": [
          {
            "ref": "project-gap:GAP-agent-scenario-evaluation",
            "source": "persisted",
            "eligibility": "case_required",
            "disposition": "deferred",
            "priority_basis": {
              "blocking": "不阻塞当前 Case。",
              "uncertainty": "高。",
              "risk": "高但范围独立。",
              "user_impact": "低于当前收口。"
            },
            "reason": "需要独立 Case。"
          },
          {
            "ref": "project-gap:GAP-runtime-resilience-and-adapters",
            "source": "persisted",
            "eligibility": "case_required",
            "disposition": "deferred",
            "priority_basis": {
              "blocking": "不阻塞当前 Case。",
              "uncertainty": "中。",
              "risk": "高但范围独立。",
              "user_impact": "当前反馈实现已独立验证。"
            },
            "reason": "需要独立 Case。"
          },
          {
            "ref": "project-gap:GAP-security-real-project-validation",
            "source": "persisted",
            "eligibility": "case_required",
            "disposition": "deferred",
            "priority_basis": {
              "blocking": "不阻塞当前 Case。",
              "uncertainty": "中。",
              "risk": "高。",
              "user_impact": "属于更广权限验证。"
            },
            "reason": "当前 Case 已如实接受 bundled-static 风险，广义真实项目验证仍为独立 Project Gap。"
          },
          {
            "ref": "project-gap:GAP-cross-record-audit",
            "source": "persisted",
            "eligibility": "case_required",
            "disposition": "deferred",
            "priority_basis": {
              "blocking": "不阻塞当前 Case。",
              "uncertainty": "中。",
              "risk": "高但范围独立。",
              "user_impact": "低于当前收口。"
            },
            "reason": "需要独立 Case。"
          },
          {
            "ref": "case-gap:CASE-20260819-003:CASE-20260819-003:completion-review:1",
            "source": "persisted",
            "eligibility": "ready",
            "disposition": "selected",
            "priority_basis": {
              "blocking": "是 Case 关闭的唯一剩余门禁。",
              "uncertainty": "低。",
              "risk": "高；需复核静态凭据、安全边界和回归可信度。",
              "user_impact": "高。"
            },
            "reason": "五维复核已完成且没有 finding。"
          }
        ]
      },
      "selected_gap": {
        "id": "CASE-20260819-003:completion-review:1",
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
        "goal": "对 ArcOrbit 内置 Project 107 产品反馈实现执行五维 completion review。",
        "expected_state_change": "content revision 4 review clean，Case resolved 并关闭。"
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
            "runtime/arcorbit/src/product-feedback-service.mjs",
            "runtime/arcorbit/src/product-feedback-window.mjs",
            "runtime/arcorbit/desktop/main.mjs",
            "runtime/arcorbit/desktop/preload.cjs",
            "runtime/arcorbit/desktop/renderer/index.html",
            "runtime/arcorbit/desktop/renderer/renderer.js",
            "runtime/arcorbit/test/product-feedback-service.test.mjs",
            "runtime/arcorbit/test/product-feedback-window.test.mjs",
            "runtime/arcorbit/test/desktop-renderer.test.mjs",
            "arckit/spec/agentic-software-development/arcorbit-platform-capabilities.md",
            "arckit/interaction/product-feedback-center/interaction.md",
            "arckit/tech/arcorbit/product-feedback-integration.md",
            "Focused product feedback tests: 20 passed, 0 failed",
            "npm run check: 220 tests, 218 passed, 2 environment-gated skips, 0 failed",
            "npm run test:layout: 1 passed, 0 failed",
            "git diff --check: passed"
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
        "project_revision": 121,
        "judgments": [
          {
            "invariant_ref": "product-expectations-remain-recoverable",
            "disposition": "upheld",
            "reason": "产品规格完整表达固定 Project 107、无配置内置反馈、当前用户归属和未读角标。",
            "fact_refs": [
              "FACT-arcorbit-feedback-integration-contract",
              "FACT-arcorbit-product-feedback-implementation"
            ],
            "evidence": [
              "arckit/spec/agentic-software-development/arcorbit-platform-capabilities.md"
            ],
            "gap_refs": []
          },
          {
            "invariant_ref": "interaction-expectations-remain-recoverable",
            "disposition": "upheld",
            "reason": "唯一入口、登录门禁、同窗切换、未读与 SDK 失败恢复均有稳定交互来源和生产映射。",
            "fact_refs": [
              "FACT-arcorbit-feedback-integration-contract",
              "FACT-arcorbit-product-feedback-implementation"
            ],
            "evidence": [
              "arckit/interaction/product-feedback-center/interaction.md",
              "arckit/interaction/product-feedback-center/default.html",
              "runtime/arcorbit/desktop/renderer/renderer.js"
            ],
            "gap_refs": []
          },
          {
            "invariant_ref": "visual-language-remains-consistent",
            "disposition": "upheld",
            "reason": "入口、角标与反馈窗口使用既有视觉语言，移除设置区后真实布局回归通过。",
            "fact_refs": [
              "FACT-arcorbit-product-feedback-implementation"
            ],
            "evidence": [
              "runtime/arcorbit/desktop/renderer/styles.css",
              "npm run test:layout: 1 passed, 0 failed"
            ],
            "gap_refs": []
          },
          {
            "invariant_ref": "technical-decisions-remain-explainable",
            "disposition": "upheld",
            "reason": "bundled-static Key、无配置 IPC、受限 WebContents、身份和未读生命周期均可由技术来源与生产代码恢复。",
            "fact_refs": [
              "FACT-arcorbit-feedback-integration-contract",
              "FACT-arcorbit-product-feedback-implementation"
            ],
            "evidence": [
              "arckit/tech/arcorbit/product-feedback-integration.md",
              "runtime/arcorbit/src/product-feedback-service.mjs",
              "runtime/arcorbit/src/product-feedback-window.mjs",
              "runtime/arcorbit/desktop/main.mjs"
            ],
            "gap_refs": []
          },
          {
            "invariant_ref": "accepted-facts-are-realized",
            "disposition": "upheld",
            "reason": "生产实现、UI/IPC 边界和完整回归证明用户无需配置即可使用产品反馈与未读角标。",
            "fact_refs": [
              "FACT-arcorbit-product-feedback-request",
              "FACT-arcorbit-feedback-integration-contract",
              "FACT-arcorbit-product-feedback-implementation"
            ],
            "evidence": [
              "runtime/arcorbit/src/product-feedback-service.mjs",
              "runtime/arcorbit/desktop/main.mjs",
              "runtime/arcorbit/desktop/renderer/index.html",
              "npm run check: 220 tests, 218 passed, 2 environment-gated skips, 0 failed"
            ],
            "gap_refs": []
          },
          {
            "invariant_ref": "material-risks-have-credible-evidence",
            "disposition": "upheld",
            "reason": "静态 Key 可提取风险和轮换责任已准确记录；测试覆盖无配置 UI/IPC、远端导航、身份、未读信号与登出清理。",
            "fact_refs": [
              "FACT-arcorbit-feedback-integration-contract",
              "FACT-arcorbit-product-feedback-implementation"
            ],
            "evidence": [
              "arckit/tech/arcorbit/product-feedback-integration.md",
              "runtime/arcorbit/test/product-feedback-service.test.mjs",
              "runtime/arcorbit/test/product-feedback-window.test.mjs",
              "runtime/arcorbit/test/desktop-renderer.test.mjs"
            ],
            "gap_refs": []
          }
        ]
      },
      "evidence": [
        "runtime/arcorbit/src/product-feedback-service.mjs",
        "runtime/arcorbit/src/product-feedback-window.mjs",
        "runtime/arcorbit/desktop/main.mjs",
        "runtime/arcorbit/desktop/preload.cjs",
        "runtime/arcorbit/desktop/renderer/index.html",
        "runtime/arcorbit/desktop/renderer/renderer.js",
        "runtime/arcorbit/test/product-feedback-service.test.mjs",
        "runtime/arcorbit/test/product-feedback-window.test.mjs",
        "runtime/arcorbit/test/desktop-renderer.test.mjs",
        "arckit/spec/agentic-software-development/arcorbit-platform-capabilities.md",
        "arckit/interaction/product-feedback-center/interaction.md",
        "arckit/tech/arcorbit/product-feedback-integration.md",
        "Focused product feedback tests: 20 passed, 0 failed",
        "npm run check: 220 tests, 218 passed, 2 environment-gated skips, 0 failed",
        "npm run test:layout: 1 passed, 0 failed",
        "git diff --check: passed"
      ],
      "runtime_result_ref": "",
      "occurred_at": "2026-08-19T08:13:29.732Z"
    }
  ],
  "case_resolution": {
    "status": "resolved",
    "stage": "resolved",
    "satisfied": [
      "GAP-establish-arcorbit-feedback-integration-contract",
      "GAP-implement-arcorbit-product-feedback-sdk",
      "GAP-configure-and-validate-live-arcorbit-feedback-project",
      "GAP-bind-project-107-and-enable-feedback-unread-badge",
      "GAP-rotate-configure-and-live-validate-arcorbit-feedback",
      "GAP-bundle-feedback-key-and-remove-user-configuration"
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
    "updated_at": "2026-08-19T08:13:29.732Z"
  }
}
```

## Round Notes

- Case history is canonical in Structured Record.rounds; keep prose notes exceptional.
