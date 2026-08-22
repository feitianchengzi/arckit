# 补齐 ArcOrbit Work 待办平台核心功能

Case: CASE-20260822-006
Status: closed
Artifact Type: mixed
Selected Gap: none
Updated: 2026-08-22T23:23:27.164Z

## User Intent

参考 ../../workshop-todo-website 的前端实现，识别并补齐 ArcOrbit Work 页面缺失的日常待办核心能力，使用户可在 ArcOrbit 内完成通常依赖网页版的工作处理。

## Structured Record

```json
{
  "schema_version": "development-case-record/v5",
  "id": "CASE-20260822-006",
  "title": "补齐 ArcOrbit Work 待办平台核心功能",
  "status": "closed",
  "artifact_type": "mixed",
  "created_at": "2026-08-22T21:20:42.162Z",
  "updated_at": "2026-08-22T23:23:27.164Z",
  "user_intent": "参考 ../../workshop-todo-website 的前端实现，识别并补齐 ArcOrbit Work 页面缺失的日常待办核心能力，使用户可在 ArcOrbit 内完成通常依赖网页版的工作处理。",
  "expected_outcome": "ArcOrbit Work 覆盖网页版日常待办处理的核心旅程，并在不破坏现有 Work、Automation、Feedback、Runtime 和人类 Gate 边界的前提下，通过可信验证证明主要操作无需返回网页版。",
  "project_state_ref": "arckit/project/state.record.json",
  "current_round": {
    "goal": "",
    "selected_gap": null
  },
  "facts": [
    {
      "id": "FACT-work-core-parity-requested",
      "revision": 1,
      "status": "accepted",
      "statement": "当前操作人要求以 ../../workshop-todo-website 前端代码为参考，尽量补齐 ArcOrbit Work 页面的待办核心功能，目标是让用户的日常工作处理不再依赖待办网页版。",
      "basis": "当前操作人的明确产品目标与范围指示。",
      "evidence": [
        "Current operator input, 2026-08-23"
      ]
    },
    {
      "id": "FACT-work-core-parity-boundary-established",
      "revision": 1,
      "status": "accepted",
      "statement": "替代 Workshop Todo 网页端日常处理所需的 Work 核心范围，是在现有七状态、任务 CRUD、执行人、父任务字段、语义优先级、标签、原始附件管理和 Automation/验收集成基础上，补齐服务端多维筛选、可解释的父子任务树与子任务操作、完整详情以及评论附件时间线；Markdown 导出、未成立的 Task history 和 Organization 治理不属于本轮核心门禁。",
      "basis": "对 Workshop Todo ProjectDetailPage、TaskDetailContent、CreateTaskDialog、tasks/comments 客户端契约、Workshop task handler/router 与 ArcOrbit Platform Adapter、Coordinator、Renderer 的逐项源码审计，并已沉淀为稳定规格、交互和技术文档。",
      "evidence": [
        "arckit/spec/agentic-software-development/arcorbit-work-management.md",
        "arckit/interaction/task-browser/interaction.md",
        "arckit/interaction/task-browser/daily-work.html",
        "arckit/tech/arcorbit/platform-composition-solution.md",
        "/Users/Glare/Library/Developer/ModularProgram/hoewo/workshop-todo-website/frontend/src/pages/ProjectDetailPage.tsx",
        "/Users/Glare/Library/Developer/ModularProgram/hoewo/workshop-todo-website/frontend/src/components/features/TaskDetailContent.tsx",
        "/Users/Glare/Library/Developer/ModularProgram/hoewo/workshop-todo-website/frontend/src/lib/api/endpoints/tasks.ts",
        "/Users/Glare/Library/Developer/ModularProgram/hoewo/workshop-todo-website/frontend/src/lib/api/endpoints/comments.ts",
        "/Users/Glare/Library/Developer/ModularProgram/hoewo/workshop-todo/handler/task.go"
      ]
    },
    {
      "id": "FACT-work-core-parity-implementation-gap",
      "revision": 1,
      "status": "superseded",
      "statement": "当前生产 ArcOrbit Work 尚未实现上述完整核心范围：任务读取仍缺少标签、优先级、创建日期等多值服务端筛选和 `/tasks/tree` 层级契约，Renderer 仍以平面列表和局部搜索为主，详情未形成与网页端等价的完整内容及评论附件协作旅程。",
      "basis": "ArcOrbit 当前 Workshop Platform Adapter、Platform Coordinator、typed preload IPC、Renderer 与现有测试和参考站点能力的直接对照。",
      "evidence": [
        "runtime/arcorbit/src/workshop-platform-adapter.mjs",
        "runtime/arcorbit/src/platform-coordinator.mjs",
        "runtime/arcorbit/desktop/preload.cjs",
        "runtime/arcorbit/desktop/renderer/renderer.js",
        "runtime/arcorbit/test/desktop-renderer.test.mjs",
        "/Users/Glare/Library/Developer/ModularProgram/hoewo/workshop-todo-website/frontend/src/pages/ProjectDetailPage.tsx"
      ]
    },
    {
      "id": "FACT-work-core-parity-realized",
      "revision": 1,
      "status": "accepted",
      "statement": "生产 ArcOrbit Work 现已通过受限 Workshop Platform Adapter 和 Platform Coordinator 提供服务端状态、创建人、执行人、标签、优先级、创建日期及内容筛选，100 天边界内的父子任务树与层级补全，子待办创建和同产品无循环重挂，完整任务正文及 TaskAttachment 评论附件时间线；Automation 管理中的任务不能通过通用 task.update 改变状态，Workshop 继续承担最终权限判定。",
      "basis": "直接实现并检查 Adapter、Coordinator、Renderer 与样式，同时增加筛选序列化、日期闭区间、树投影、跨产品隔离、循环拒绝、TaskAttachment 权限/恢复和 Automation 状态 Gate 回归测试；完整 ArcOrbit 检查通过。",
      "evidence": [
        "runtime/arcorbit/src/workshop-platform-adapter.mjs",
        "runtime/arcorbit/src/platform-coordinator.mjs",
        "runtime/arcorbit/desktop/renderer/index.html",
        "runtime/arcorbit/desktop/renderer/renderer.js",
        "runtime/arcorbit/desktop/renderer/styles.css",
        "runtime/arcorbit/test/workshop-platform-adapter.test.mjs",
        "runtime/arcorbit/test/platform-coordinator.test.mjs",
        "runtime/arcorbit/test/desktop-renderer.test.mjs",
        "Verification: npm run check — 271 tests, 268 passed, 3 environment-gated skips, 0 failed"
      ]
    },
    {
      "id": "FACT-work-status-filter-server-contract-realized",
      "revision": 1,
      "status": "accepted",
      "statement": "ArcOrbit Work 当前选择的唯一状态现已进入每个产品的 Workshop task-tree 服务端查询；同一组创建人、执行人、标签、优先级、日期和内容条件另行取得全部七状态的服务端计数，当前命中数与补全树总数来自所选状态的 tree 响应，Renderer 不再二次裁掉服务端返回的父链或下游子树。",
      "basis": "Renderer 请求与树投影、Platform Coordinator 的双查询组合，以及对状态参数、七状态计数和树汇总的定向回归共同证明。",
      "evidence": [
        "runtime/arcorbit/desktop/renderer/renderer.js",
        "runtime/arcorbit/src/platform-coordinator.mjs",
        "runtime/arcorbit/test/desktop-renderer.test.mjs",
        "runtime/arcorbit/test/platform-coordinator.test.mjs",
        "Verification: targeted platform-coordinator and desktop-renderer tests — 28 passed, 0 failed",
        "Verification: npm run check — 271 tests, 268 passed, 3 environment-gated skips, 0 failed"
      ]
    },
    {
      "id": "FACT-work-complete-task-detail-realized",
      "revision": 1,
      "status": "accepted",
      "statement": "ArcOrbit Work Inspector 现在使用受限 Markdown 呈现完整任务内容，服务端 creator/executor、标签、创建/更新/completion_at 时间字段进入详情投影，并提供编码项目 ID 和任务 ID 的 arcorbit-work 引用；原始 HTML、脚本和不安全链接协议不能成为可执行 Renderer 标记。",
      "basis": "Workshop Task 模型核对、Task 归一化和 Inspector 生产实现，以及对安全 Markdown、完整元数据和引用编码的可执行自动化验证。",
      "evidence": [
        "/Users/Glare/Library/Developer/ModularProgram/hoewo/workshop-todo/models/task.go",
        "runtime/arcorbit/src/task-source-adapter.mjs",
        "runtime/arcorbit/desktop/renderer/renderer.js",
        "runtime/arcorbit/desktop/renderer/restricted-markdown.mjs",
        "runtime/arcorbit/test/task-source-adapter.test.mjs",
        "runtime/arcorbit/test/restricted-markdown.test.mjs",
        "runtime/arcorbit/test/desktop-renderer.test.mjs",
        "Verification: npm run check — 275 tests, 272 passed, 3 environment-gated skips, 0 failed"
      ]
    },
    {
      "id": "FACT-work-task-reference-recovery-realized",
      "revision": 1,
      "status": "accepted",
      "statement": "ArcOrbit Work 现在可在应用内打开规范的 arcorbit-work 任务引用；它先确认引用产品属于当前 Workset、目标任务对当前账户可见且状态有效，再恢复 Work 页面、产品范围、任务状态/日期查询和任务选择；无效、跨 Workset、不可见或刷新后丢失的目标会失败关闭且不保留部分切换上下文。",
      "basis": "受限引用解析/可见性解析、纯上下文投影、Renderer 打开入口与回滚实现，以及规范编码、跨 Workset、缺失任务、无效状态和上下文恢复的可执行自动化验证。",
      "evidence": [
        "runtime/arcorbit/desktop/renderer/restricted-markdown.mjs",
        "runtime/arcorbit/desktop/renderer/index.html",
        "runtime/arcorbit/desktop/renderer/renderer.js",
        "runtime/arcorbit/test/restricted-markdown.test.mjs",
        "runtime/arcorbit/test/desktop-renderer.test.mjs",
        "Verification: targeted restricted-markdown and desktop-renderer tests — 24 passed, 0 failed",
        "Verification: npm run check — 276 tests, 273 passed, 3 environment-gated skips, 0 failed"
      ]
    },
    {
      "id": "FACT-work-markdown-external-links-realized",
      "revision": 1,
      "status": "accepted",
      "statement": "ArcOrbit Work 的受限 Markdown 现在把合法 http、https 和 mailto 链接呈现为无 href 的显式按钮；只有用户点击后才经 Work 专用 preload IPC 交由主进程打开，主进程重新校验调用窗口、协议、凭据、主机或邮件目标及长度；javascript、data、file、含凭据、空目标、无效或超长地址保持不可执行。",
      "basis": "共享纯 URL 策略、受限 Markdown 呈现、Renderer 显式事件、typed preload/main IPC 与 shell.openExternal 边界，以及允许/拒绝协议和跨层接线的自动化验证。",
      "evidence": [
        "runtime/arcorbit/src/work-external-link.mjs",
        "runtime/arcorbit/desktop/main.mjs",
        "runtime/arcorbit/desktop/preload.cjs",
        "runtime/arcorbit/desktop/renderer/restricted-markdown.mjs",
        "runtime/arcorbit/desktop/renderer/renderer.js",
        "runtime/arcorbit/test/work-external-link.test.mjs",
        "runtime/arcorbit/test/restricted-markdown.test.mjs",
        "runtime/arcorbit/test/desktop-renderer.test.mjs",
        "Verification: targeted work-external-link, restricted-markdown and desktop-renderer tests — 26 passed, 0 failed",
        "Verification: npm run check — 278 tests, 275 passed, 3 environment-gated skips, 0 failed"
      ]
    },
    {
      "id": "FACT-work-task-attachment-collaboration-realized",
      "revision": 1,
      "status": "accepted",
      "statement": "ArcOrbit Work 的 TaskAttachment 时间线现在按 text、url、file 保留类型：文本兼容 JSON 与 [image]/[file] 标记并安全呈现提及和外链，URL 通过显式 Work 外链动作打开，图片可在应用内预览，文件可经受限签名下载；评论编辑器可上传图片/文件并保存对象 key，编辑文本时保留已有资源。所有 STS 凭据、OSS 上传、签名 URL、任务可见性和资源归属校验均留在受限 Adapter、Coordinator 与主进程边界。",
      "basis": "对参考 Workshop CommentItem、CommentEditor、评论 API 与 OSS 路径的直接契约核对，以及 ArcOrbit 内容解析、受限资源能力、跨层生产接线和可执行自动化验证。",
      "evidence": [
        "/Users/Glare/Library/Developer/ModularProgram/hoewo/workshop-todo-website/frontend/src/components/features/CommentItem.tsx",
        "/Users/Glare/Library/Developer/ModularProgram/hoewo/workshop-todo-website/frontend/src/components/features/CommentEditor.tsx",
        "runtime/arcorbit/src/work-task-attachment-content.mjs",
        "runtime/arcorbit/src/work-task-attachment-resource.mjs",
        "runtime/arcorbit/src/workshop-platform-adapter.mjs",
        "runtime/arcorbit/src/platform-coordinator.mjs",
        "runtime/arcorbit/desktop/main.mjs",
        "runtime/arcorbit/desktop/preload.cjs",
        "runtime/arcorbit/desktop/renderer/renderer.js",
        "runtime/arcorbit/test/work-task-attachment-content.test.mjs",
        "runtime/arcorbit/test/work-task-attachment-resource.test.mjs",
        "runtime/arcorbit/test/workshop-platform-adapter.test.mjs",
        "runtime/arcorbit/test/platform-coordinator.test.mjs",
        "runtime/arcorbit/test/desktop-renderer.test.mjs",
        "Verification: targeted TaskAttachment content, resource, adapter, coordinator and desktop-renderer tests — 43 passed, 0 failed",
        "Verification: npm run check — 285 tests, 282 passed, 3 environment-gated skips, 0 failed"
      ]
    },
    {
      "id": "FACT-work-task-attachment-cache-lifecycle-realized",
      "revision": 1,
      "status": "accepted",
      "statement": "ArcOrbit Work 的 TaskAttachment 缓存现在绑定 Workshop 身份和受信快照生命周期：成功快照刷新会使服务端记录与图片预览失效并按需重新读取 REST 真值，同时保留同一身份的待提交评论资源；身份变化或退出会清空远端 Platform 状态、任务选择、评论草稿、记录和预览。异步 list、preview、upload 与评论提交只有 generation token 仍有效时才可回写 Renderer 状态。",
      "basis": "对 Renderer 快照、退出、附件读取、图片预览、资源选择和评论提交时序的直接根因分析，以及集中缓存生命周期实现、可执行 generation/身份测试、Renderer 接线检查和完整 ArcOrbit 回归。",
      "evidence": [
        "arckit/spec/agentic-software-development/arcorbit-work-management.md",
        "runtime/arcorbit/src/work-task-attachment-cache.mjs",
        "runtime/arcorbit/desktop/renderer/renderer.js",
        "runtime/arcorbit/test/work-task-attachment-cache.test.mjs",
        "runtime/arcorbit/test/desktop-renderer.test.mjs",
        "Verification: targeted TaskAttachment cache and desktop-renderer tests — 25 passed, 0 failed",
        "Verification: npm run check — 288 tests, 285 passed, 3 environment-gated skips, 0 failed"
      ]
    }
  ],
  "state_impacts": [
    {
      "id": "IMPACT-work-boundary-product-capabilities",
      "fact_id": "FACT-work-core-parity-boundary-established",
      "fact_revision": 1,
      "target": {
        "kind": "software_decision",
        "ref": "product_capabilities",
        "revision": 18
      },
      "effect": "upheld",
      "reason": "产品规格现在明确 Work 替代网页版日常待办处理所需的核心能力与非目标。",
      "gap_ids": [],
      "evidence": [
        "arckit/spec/agentic-software-development/arcorbit-work-management.md"
      ]
    },
    {
      "id": "IMPACT-work-boundary-interaction",
      "fact_id": "FACT-work-core-parity-boundary-established",
      "fact_revision": 1,
      "target": {
        "kind": "software_decision",
        "ref": "experience_and_interaction",
        "revision": 30
      },
      "effect": "upheld",
      "reason": "任务筛选、树、详情、评论附件、错误恢复及受控状态操作均已形成可恢复交互语义。",
      "gap_ids": [],
      "evidence": [
        "arckit/interaction/task-browser/interaction.md",
        "arckit/interaction/task-browser/daily-work.html"
      ]
    },
    {
      "id": "IMPACT-work-boundary-quality",
      "fact_id": "FACT-work-core-parity-boundary-established",
      "fact_revision": 1,
      "target": {
        "kind": "software_decision",
        "ref": "quality_and_validation",
        "revision": 5
      },
      "effect": "upheld",
      "reason": "稳定验收口径已覆盖筛选序列化、任务树、循环防护、评论权限、跨产品隔离、状态边界和失败恢复。",
      "gap_ids": [],
      "evidence": [
        "arckit/spec/agentic-software-development/arcorbit-work-management.md",
        "arckit/tech/arcorbit/platform-composition-solution.md"
      ]
    },
    {
      "id": "IMPACT-work-core-realization",
      "fact_id": "FACT-work-task-attachment-cache-lifecycle-realized",
      "fact_revision": 1,
      "target": {
        "kind": "software_invariant",
        "ref": "accepted-facts-are-realized",
        "revision": null
      },
      "effect": "upheld",
      "reason": "Work TaskAttachment collaboration now preserves both the type-specific journeys and their required identity isolation/current REST truth; the Completion Review cache-lifecycle finding is resolved with executable evidence.",
      "gap_ids": [],
      "evidence": [
        "runtime/arcorbit/src/work-task-attachment-cache.mjs",
        "runtime/arcorbit/desktop/renderer/renderer.js",
        "runtime/arcorbit/test/work-task-attachment-cache.test.mjs",
        "runtime/arcorbit/test/desktop-renderer.test.mjs",
        "Verification: npm run check — 288 tests, 285 passed, 3 environment-gated skips, 0 failed"
      ]
    }
  ],
  "gaps": [
    {
      "id": "GAP-establish-work-core-parity-boundary",
      "status": "resolved",
      "goal": "建立 Workshop Todo 网页端与 ArcOrbit Work 当前实现之间的核心日常待办能力对照、缺失项、复用边界和可验证验收范围。",
      "reason": "尚未接受的双端实现事实将决定后续需要修改的功能对象、交互范围、集成风险与验收方式；必须先形成可信差距结论，不能在同一轮依据新发现直接实施下游结果。",
      "derived_from": [
        "FACT-work-core-parity-requested"
      ],
      "blocked_by": [],
      "priority_basis": {
        "blocking": "后续实现范围和顺序依赖该差距边界。",
        "uncertainty": "尚未核对参考网站与 ArcOrbit Work 的实际代码和能力差异。",
        "risk": "盲目追求页面表象对齐可能破坏 Workshop 权威数据边界、共享 Task Browser、Automation 或 Feedback 复用。",
        "user_impact": "直接决定用户能否在 ArcOrbit 完成日常待办工作。"
      },
      "responsibility": "agent",
      "evidence_required": [
        "Workshop Todo 网页端核心日常待办功能及对应源码证据",
        "ArcOrbit Work 当前功能及对应源码证据",
        "明确的已具备、缺失、部分具备和有意不纳入项对照",
        "保护现有 Work、Automation、Feedback、Runtime 与人类 Gate 语义的边界说明",
        "可用于后续实现和验证的稳定验收口径"
      ],
      "resolution": {
        "id": "GAP-establish-work-core-parity-boundary",
        "status": "resolved",
        "outcome": "已依据 Workshop Todo 网页端、服务端和 ArcOrbit 当前代码，建立已具备、部分具备、缺失与有意排除的核心能力边界，并形成稳定产品规格、交互策略/线框和技术契约。",
        "reason": "源码审计和持久文档共同覆盖筛选、任务树、子任务、完整详情、评论附件、权限、Automation/Feedback/Runtime/Gate 边界及可验证验收范围。",
        "evidence": [
          "arckit/spec/agentic-software-development/arcorbit-work-management.md",
          "arckit/interaction/task-browser/interaction.md",
          "arckit/interaction/task-browser/daily-work.html",
          "arckit/tech/arcorbit/platform-composition-solution.md",
          "/Users/Glare/Library/Developer/ModularProgram/hoewo/workshop-todo-website/frontend/src/pages/ProjectDetailPage.tsx",
          "/Users/Glare/Library/Developer/ModularProgram/hoewo/workshop-todo/handler/task.go",
          "runtime/arcorbit/src/workshop-platform-adapter.mjs",
          "runtime/arcorbit/desktop/renderer/renderer.js"
        ],
        "occurred_at": "2026-08-22T21:40:44.073Z"
      }
    },
    {
      "id": "GAP-realize-work-core-parity",
      "status": "resolved",
      "goal": "在生产 ArcOrbit 中实现并验证 Work 的多维服务端筛选、任务树与子任务、完整详情及评论附件核心旅程，同时保持 Automation、Feedback、Runtime、权限和人工 Gate 边界。",
      "reason": "稳定边界已建立，但当前 Adapter、Coordinator、typed IPC 和 Renderer 尚未覆盖这些替代网页版日常处理所必需的核心能力。",
      "derived_from": [
        "FACT-work-core-parity-requested",
        "FACT-work-core-parity-boundary-established",
        "FACT-work-core-parity-implementation-gap"
      ],
      "blocked_by": [
        "GAP-establish-work-core-parity-boundary"
      ],
      "priority_basis": {
        "blocking": "这是实现用户目标并进入 Completion Review 前的主要剩余工作。",
        "uncertainty": "服务端契约已核实，但跨层生产实现和既有共享行为仍需逐项验证。",
        "risk": "通用任务编辑可能绕过 Automation 状态动作、权限或 awaiting_human Gate。",
        "user_impact": "未完成前用户仍需回到网页版执行筛选、层级管理和评论协作。"
      },
      "responsibility": "agent",
      "evidence_required": [
        "Platform Adapter 对多值筛选、任务树和 TaskAttachment 语义的受限实现",
        "Coordinator 与 typed IPC 的固定业务动作和参数校验",
        "Work Renderer 对筛选、任务树、子任务、完整详情和评论附件的生产交互",
        "Automation、Feedback、Runtime、权限和 awaiting_human Gate 回归证据",
        "筛选序列化、日期边界、循环防护、评论权限、跨产品隔离和失败恢复自动化测试"
      ],
      "resolution": {
        "id": "GAP-realize-work-core-parity",
        "status": "resolved",
        "outcome": "生产 ArcOrbit Work 已实现服务端多值筛选、日期闭区间与 100 天任务树、父级补全、子待办创建和安全重挂、完整正文、TaskAttachment 评论附件时间线及失败重试；Automation 管理中的状态变更继续通过受控动作完成。",
        "reason": "Adapter、Coordinator、Renderer 和自动化测试共同覆盖既定核心旅程、固定业务动作、跨产品父级校验、循环拒绝、附件权限投影与人工 Gate 保护；完整 ArcOrbit 检查无失败。",
        "evidence": [
          "runtime/arcorbit/src/workshop-platform-adapter.mjs",
          "runtime/arcorbit/src/platform-coordinator.mjs",
          "runtime/arcorbit/desktop/renderer/index.html",
          "runtime/arcorbit/desktop/renderer/renderer.js",
          "runtime/arcorbit/desktop/renderer/styles.css",
          "runtime/arcorbit/test/workshop-platform-adapter.test.mjs",
          "runtime/arcorbit/test/platform-coordinator.test.mjs",
          "runtime/arcorbit/test/desktop-renderer.test.mjs",
          "Verification: npm run check — 271 tests, 268 passed, 3 environment-gated skips, 0 failed"
        ],
        "occurred_at": "2026-08-22T21:56:08.401Z"
      }
    },
    {
      "id": "CASE-20260822-006:review-finding:status-filter-server-contract",
      "status": "resolved",
      "goal": "Resolve review finding: Work 的七状态选择必须进入服务端 task-tree 查询并让命中/补全计数对应当前组合条件；当前 platformTaskFilters 始终发送全部七状态，随后只在 Renderer 本地筛选，因此状态轴和汇总计数不满足已接受的服务端筛选语义。",
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
        "platformTaskFilters() hard-codes states: TASK_STATES while openWorkState() only changes state.selectedState",
        "renderPlatformWork() derives the selected-state rows locally but displays matched_total and total from the all-state tree query",
        "desktop-renderer.test.mjs asserts only that task_filters and tree wiring exist; it does not prove selected status serialization or count semantics",
        "arckit/spec/agentic-software-development/arcorbit-work-management.md requires combined seven-state server filtering and counts from the same query fact"
      ],
      "resolution": {
        "id": "CASE-20260822-006:review-finding:status-filter-server-contract",
        "status": "resolved",
        "outcome": "Work 状态按钮现在把唯一当前状态发送给服务端 task-tree 查询；Coordinator 使用同一组非状态条件独立取得七状态完整计数；Renderer 的命中/补全汇总来自当前树查询并保留服务端返回的完整父链和子树。",
        "reason": "根因路径已最小修复，状态请求、跨产品计数、当前树汇总和下游子树投影均有定向测试及完整 ArcOrbit 回归证据。",
        "evidence": [
          "runtime/arcorbit/desktop/renderer/renderer.js",
          "runtime/arcorbit/src/platform-coordinator.mjs",
          "runtime/arcorbit/test/desktop-renderer.test.mjs",
          "runtime/arcorbit/test/platform-coordinator.test.mjs",
          "Verification: targeted platform-coordinator and desktop-renderer tests — 28 passed, 0 failed",
          "Verification: npm run check — 271 tests, 268 passed, 3 environment-gated skips, 0 failed",
          "git diff --check: passed",
          "Debug cleanup: no ARC_DEBUG:status-filter-server-contract marker or temporary log remains"
        ],
        "occurred_at": "2026-08-22T22:09:26.040Z"
      }
    },
    {
      "id": "CASE-20260822-006:review-finding:complete-task-detail",
      "status": "resolved",
      "goal": "Resolve review finding: Work Inspector 必须兑现稳定规格中的完整详情：受限 Markdown、创建人、标签、创建/更新/完成时间和可恢复任务引用；当前仅以转义 pre 显示正文，元数据缺项且没有复制引用，因而仍不能声称完整详情旅程已完成。",
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
        "runtime/arcorbit/desktop/renderer/renderer.js",
        "runtime/arcorbit/src/task-source-adapter.mjs",
        "runtime/arcorbit/test/desktop-renderer.test.mjs",
        "renderPlatformWorkInspector() renders task.content inside escaped <pre> and its factRows omit creator, tags and task timestamps",
        "normalizeTask() does not project a completion timestamp needed by the accepted Inspector contract",
        "Renderer contains no Work task-reference copy action",
        "desktop-renderer.test.mjs labels the journey complete but checks only structural regexes and a CSS class, not Markdown, required metadata or reference recovery",
        "arckit/spec/agentic-software-development/arcorbit-work-management.md and arckit/interaction/task-browser/interaction.md require these complete-detail behaviors"
      ],
      "resolution": {
        "id": "CASE-20260822-006:review-finding:complete-task-detail",
        "status": "resolved",
        "outcome": "Work Inspector 现以不可执行原始 HTML 的受限 Markdown 展示任务内容，完整呈现创建人、执行人、父待办、状态、优先级、标签、创建/更新/完成时间，并可复制包含项目与任务身份的编码引用。",
        "reason": "Task 归一化、Renderer 呈现和独立可执行测试共同覆盖 completion_at、人员字段、标签/时间、Markdown 安全和引用恢复；完整 ArcOrbit 检查无失败。",
        "evidence": [
          "runtime/arcorbit/src/task-source-adapter.mjs",
          "runtime/arcorbit/desktop/renderer/renderer.js",
          "runtime/arcorbit/desktop/renderer/restricted-markdown.mjs",
          "runtime/arcorbit/desktop/renderer/styles.css",
          "runtime/arcorbit/test/task-source-adapter.test.mjs",
          "runtime/arcorbit/test/restricted-markdown.test.mjs",
          "runtime/arcorbit/test/desktop-renderer.test.mjs",
          "Verification: targeted task-source, restricted-markdown and desktop-renderer tests — 49 passed, 0 failed",
          "Verification: npm run check — 275 tests, 272 passed, 3 environment-gated skips, 0 failed",
          "git diff --check: passed"
        ],
        "occurred_at": "2026-08-22T22:18:02.444Z"
      }
    },
    {
      "id": "CASE-20260822-006:review-finding:task-reference-recovery",
      "status": "resolved",
      "goal": "Resolve review finding: 复制任务引用目前只生成并写入 arcorbit-work URI，同时显示“可恢复”成功提示，但 ArcOrbit 没有解析该 URI、接收粘贴/打开或恢复顶部产品范围与任务选择的入口；因此引用可编码却不可恢复，与稳定详情契约和已接受 realization 事实冲突。",
      "reason": "error found by completion review",
      "derived_from": [
        "completion_review",
        "content_revision:4"
      ],
      "blocked_by": [],
      "priority_basis": {
        "blocking": "high",
        "risk": "high"
      },
      "responsibility": "agent",
      "evidence_required": [
        "runtime/arcorbit/desktop/renderer/restricted-markdown.mjs",
        "runtime/arcorbit/desktop/renderer/renderer.js",
        "runtime/arcorbit/test/restricted-markdown.test.mjs",
        "runtime/arcorbit/test/desktop-renderer.test.mjs",
        "workTaskReference() only serializes arcorbit-work://project/<project>/task/<task>",
        "copyWorkTaskReference() only calls navigator.clipboard.writeText() and then claims the context is recoverable",
        "Repository search finds no arcorbit-work parser, protocol handler, paste/open action, or navigation restoration path outside the serializer and source-regex tests",
        "restricted-markdown.test.mjs proves exact encoding only; desktop-renderer.test.mjs proves clipboard wiring only",
        "arckit/spec/agentic-software-development/arcorbit-work-management.md and arckit/interaction/task-browser/interaction.md require opening the reference inside ArcOrbit to restore product scope and task selection"
      ],
      "resolution": {
        "id": "CASE-20260822-006:review-finding:task-reference-recovery",
        "status": "resolved",
        "outcome": "ArcOrbit Work now accepts a pasted canonical arcorbit-work reference, verifies the referenced project belongs to the active Workset and the task is visible to the current account, then restores the Work page, product scope, task state/date query, and task selection.",
        "reason": "A canonical parser/resolver, pure selection projection, visible Work action, fail-closed lookup and rollback path are implemented and covered by executable targeted tests plus the complete ArcOrbit regression suite.",
        "evidence": [
          "runtime/arcorbit/desktop/renderer/restricted-markdown.mjs",
          "runtime/arcorbit/desktop/renderer/index.html",
          "runtime/arcorbit/desktop/renderer/renderer.js",
          "runtime/arcorbit/test/restricted-markdown.test.mjs",
          "runtime/arcorbit/test/desktop-renderer.test.mjs",
          "Verification: targeted restricted-markdown and desktop-renderer tests — 24 passed, 0 failed",
          "Verification: npm run check — 276 tests, 273 passed, 3 environment-gated skips, 0 failed",
          "git diff --check: passed",
          "Debug cleanup: no ARC_DEBUG:task-reference-recovery marker or temporary console logging remains"
        ],
        "occurred_at": "2026-08-22T22:37:01.124Z"
      }
    },
    {
      "id": "CASE-20260822-006:review-finding:task-markdown-external-links",
      "status": "resolved",
      "goal": "Resolve review finding: 受限 Markdown 将允许的 http、https 和 mailto 链接渲染为没有 href、data URL 或事件处理器的 span，Renderer 和 preload 也没有 Work 专用的受控打开动作；安全协议虽不可执行，但用户同样无法通过明确动作打开合法外部链接，完整 Markdown 详情旅程尚未兑现。",
      "reason": "omission found by completion review",
      "derived_from": [
        "completion_review",
        "content_revision:4"
      ],
      "blocked_by": [],
      "priority_basis": {
        "blocking": "high",
        "risk": "high"
      },
      "responsibility": "agent",
      "evidence_required": [
        "runtime/arcorbit/desktop/renderer/restricted-markdown.mjs",
        "runtime/arcorbit/desktop/renderer/renderer.js",
        "runtime/arcorbit/desktop/preload.cjs",
        "runtime/arcorbit/desktop/main.mjs",
        "runtime/arcorbit/test/restricted-markdown.test.mjs",
        "renderLink() returns a task-markdown-link span for safe protocols and deliberately emits no href",
        "Renderer has no task-markdown-link click listener and preload/main expose no bounded Work external-link capability",
        "Existing shell.openExternal handlers are limited to Feedback attachment capabilities and do not serve Work Markdown",
        "restricted-markdown.test.mjs asserts that href is absent but never proves an explicit safe-link action",
        "Stable Work spec and interaction document require external links to open only through an explicit user action, not to become permanently inert"
      ],
      "resolution": {
        "id": "CASE-20260822-006:review-finding:task-markdown-external-links",
        "status": "resolved",
        "outcome": "Allowed http, https and mailto Markdown links now render as explicit buttons without href and open only after a user click through Work-specific preload IPC; the main process verifies the invoking window and revalidates the protocol, credentials, host/mail target and size before calling shell.openExternal.",
        "reason": "Renderer presentation, typed preload exposure, main-process enforcement and a shared pure URL policy are implemented; executable tests cover accepted protocols and reject javascript, data, file, credential-bearing, empty, malformed and oversized values, with complete regression passing.",
        "evidence": [
          "runtime/arcorbit/src/work-external-link.mjs",
          "runtime/arcorbit/desktop/main.mjs",
          "runtime/arcorbit/desktop/preload.cjs",
          "runtime/arcorbit/desktop/renderer/restricted-markdown.mjs",
          "runtime/arcorbit/desktop/renderer/renderer.js",
          "runtime/arcorbit/desktop/renderer/styles.css",
          "runtime/arcorbit/test/work-external-link.test.mjs",
          "runtime/arcorbit/test/restricted-markdown.test.mjs",
          "runtime/arcorbit/test/desktop-renderer.test.mjs",
          "Verification: targeted work-external-link, restricted-markdown and desktop-renderer tests — 26 passed, 0 failed",
          "Verification: npm run check — 278 tests, 275 passed, 3 environment-gated skips, 0 failed",
          "git diff --check: passed",
          "Debug cleanup: no ARC_DEBUG:task-markdown-external-links marker remains"
        ],
        "occurred_at": "2026-08-22T22:42:53.816Z"
      }
    },
    {
      "id": "CASE-20260822-006:review-finding:task-attachment-collaboration",
      "status": "resolved",
      "goal": "Resolve review finding: TaskAttachment 时间线仍把 text、url 和 file 的 content 全部转义为普通段落，并通过通用 type/content 表单新增或修改原始值；它不会解析文本评论中的链接、图片和文件引用，不会打开 URL，也不会取得或下载文件，因此不能替代 Workshop Todo 的评论附件协作旅程。",
      "reason": "omission found by completion review",
      "derived_from": [
        "completion_review",
        "content_revision:4"
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
        "/Users/Glare/Library/Developer/ModularProgram/hoewo/workshop-todo-website/frontend/src/components/features/CommentItem.tsx",
        "/Users/Glare/Library/Developer/ModularProgram/hoewo/workshop-todo-website/frontend/src/components/features/CommentEditor.tsx",
        "taskAttachmentPanel() renders every item as escapeHtml(item.content) inside a paragraph regardless of type",
        "manageTaskAttachments() exposes a generic text/file/url selector plus raw content textarea rather than a comment composer with usable link/file/image behavior",
        "There is no Work URL-open, signed-file retrieval/download, image preview, or embedded comment attachment parsing path",
        "desktop-renderer.test.mjs checks only function names, create-text wiring, permissions and retry markers; it does not execute any type-specific content journey",
        "Reference Workshop CommentItem and CommentEditor parse text imageKeys/fileKeys, open URL records, obtain file access and upload comment media",
        "Stable Work spec and interaction document require type-preserving TaskAttachment collaboration and compatibility with links, images and file references rather than a raw field manager"
      ],
      "resolution": {
        "id": "CASE-20260822-006:review-finding:task-attachment-collaboration",
        "status": "resolved",
        "outcome": "ArcOrbit Work now preserves TaskAttachment text, URL and file types; safely parses comment text, mentions, links and image/file references; explicitly opens URL records; previews images; downloads files; and composes comments with uploaded image/file object keys while preserving existing resources during text edits.",
        "reason": "The Renderer now provides type-specific collaboration journeys, while authenticated Adapter, Coordinator and main-process capabilities enforce task visibility, persisted attachment ownership, STS root boundaries, file constraints and signed-resource handling without exposing credentials or signed file URLs to Renderer. Targeted and full regressions pass.",
        "evidence": [
          "runtime/arcorbit/src/work-task-attachment-content.mjs",
          "runtime/arcorbit/src/work-task-attachment-resource.mjs",
          "runtime/arcorbit/src/workshop-platform-adapter.mjs",
          "runtime/arcorbit/src/platform-coordinator.mjs",
          "runtime/arcorbit/desktop/main.mjs",
          "runtime/arcorbit/desktop/preload.cjs",
          "runtime/arcorbit/desktop/renderer/renderer.js",
          "runtime/arcorbit/desktop/renderer/styles.css",
          "runtime/arcorbit/test/work-task-attachment-content.test.mjs",
          "runtime/arcorbit/test/work-task-attachment-resource.test.mjs",
          "runtime/arcorbit/test/workshop-platform-adapter.test.mjs",
          "runtime/arcorbit/test/platform-coordinator.test.mjs",
          "runtime/arcorbit/test/desktop-renderer.test.mjs",
          "Verification: targeted TaskAttachment content, resource, adapter, coordinator and desktop-renderer tests — 43 passed, 0 failed",
          "Verification: npm run check — 285 tests, 282 passed, 3 environment-gated skips, 0 failed",
          "git diff --check: passed",
          "Debug cleanup: no ARC_DEBUG:task-attachment-collaboration marker or temporary TaskAttachment logging remains"
        ],
        "occurred_at": "2026-08-22T23:03:55.624Z"
      }
    },
    {
      "id": "CASE-20260822-006:review-finding:task-attachment-cache-lifecycle",
      "status": "resolved",
      "goal": "Resolve review finding: TaskAttachment 的记录缓存、图片 data URL 预览和待提交资源只按 task id 保存在 Renderer 内存中；logout 仅清空 automation snapshot，refreshSnapshot、身份切换和 task_attachment 实时失效均不会清空这些缓存。旧账户的评论或图片可能在新账户遇到相同 task id 时继续显示，其他客户端新增或修改评论后当前 Inspector 也会持续复用旧时间线，与稳定规格要求的身份变化清空远端评论缓存及 WebSocket→REST 定向刷新语义冲突。",
      "reason": "omission found by completion review",
      "derived_from": [
        "completion_review",
        "content_revision:7"
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
        "arckit/spec/agentic-software-development/arcorbit-work-management.md",
        "renderer state stores platformTaskAttachments, pendingTaskCommentResources and platformTaskAttachmentPreviews independently from state.platform and state.snapshot",
        "refreshSnapshot() replaces state.platform but does not invalidate any TaskAttachment cache",
        "logout() assigns only state.snapshot = emptySnapshot() and leaves state.platform plus all three TaskAttachment caches intact",
        "renderPlatformWorkInspector() calls loadTaskAttachments() only when the task-id cache entry is absent, so a same-id task can reuse stale prior-account data",
        "main-process realtime task_attachment events trigger snapshot refresh, but the Renderer snapshot path does not invalidate or reload the cached attachment timeline",
        "desktop-renderer.test.mjs verifies type-specific rendering and IPC by source regex but has no logout, identity-switch or realtime cache-invalidation journey",
        "arckit/spec/agentic-software-development/arcorbit-work-management.md requires login identity changes to clear remote task/comment caches and WebSocket invalidations to recover current REST truth"
      ],
      "resolution": {
        "id": "CASE-20260822-006:review-finding:task-attachment-cache-lifecycle",
        "status": "resolved",
        "outcome": "ArcOrbit Work now invalidates TaskAttachment records and image previews on every accepted snapshot refresh, preserves same-identity pending comment resources, clears platform state plus every attachment cache on identity change or logout, and rejects stale list, preview, upload and comment async completions through generation tokens.",
        "reason": "A centralized cache-lifecycle module now separates remote-cache freshness from identity-owned drafts, Renderer refresh and logout paths apply the correct invalidation strength, and executable tests cover routine refresh, identity reset and stale async writes. Targeted and full ArcOrbit regressions pass.",
        "evidence": [
          "runtime/arcorbit/src/work-task-attachment-cache.mjs",
          "runtime/arcorbit/desktop/renderer/renderer.js",
          "runtime/arcorbit/test/work-task-attachment-cache.test.mjs",
          "runtime/arcorbit/test/desktop-renderer.test.mjs",
          "Verification: targeted TaskAttachment cache and desktop-renderer tests — 25 passed, 0 failed",
          "Verification: npm run check — 288 tests, 285 passed, 3 environment-gated skips, 0 failed",
          "git diff --check: passed",
          "Debug diagnosis: source logic fully matched the persisted cache identity and async timing finding; no temporary logging was required",
          "Debug cleanup: no ARC_DEBUG:task-attachment-cache-lifecycle marker or temporary logging remains"
        ],
        "occurred_at": "2026-08-22T23:18:20.786Z"
      }
    }
  ],
  "content_revision": 8,
  "completion_review": {
    "status": "clean",
    "policy": {
      "initial_max_cycles": 10,
      "source": "runtime/arcorbit/config/case-policy.json",
      "snapshotted_at": "2026-08-22T21:20:42.162Z"
    },
    "additional_cycles_authorized": 0,
    "cycle_count": 4,
    "reviewed_content_revision": 8,
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
          "problem_resolution": "findings",
          "verification_credibility": "findings",
          "regression_risk": "findings",
          "minimality": "clean"
        },
        "finding_ids": [
          "status-filter-server-contract",
          "complete-task-detail"
        ],
        "evidence": [
          "arckit/spec/agentic-software-development/arcorbit-work-management.md",
          "arckit/interaction/task-browser/interaction.md",
          "arckit/tech/arcorbit/platform-composition-solution.md",
          "runtime/arcorbit/desktop/renderer/renderer.js",
          "runtime/arcorbit/src/task-source-adapter.mjs",
          "runtime/arcorbit/test/desktop-renderer.test.mjs",
          "/Users/Glare/Library/Developer/ModularProgram/hoewo/workshop-todo-website/frontend/src/pages/ProjectDetailPage.tsx",
          "Verification: npm run check — 271 tests, 268 passed, 3 environment-gated skips, 0 failed",
          "git diff --check: passed",
          "Completion Review source inspection, 2026-08-23"
        ],
        "occurred_at": "2026-08-22T22:02:53.184Z"
      },
      {
        "cycle": 2,
        "autonomous_cycle": 2,
        "reviewer": "agent",
        "outcome": "findings",
        "content_revision": 4,
        "dimensions": {
          "implementation_correctness": "findings",
          "problem_resolution": "findings",
          "verification_credibility": "findings",
          "regression_risk": "findings",
          "minimality": "clean"
        },
        "finding_ids": [
          "task-reference-recovery",
          "task-markdown-external-links",
          "task-attachment-collaboration"
        ],
        "evidence": [
          "arckit/spec/agentic-software-development/arcorbit-work-management.md",
          "arckit/interaction/task-browser/interaction.md",
          "arckit/tech/arcorbit/platform-composition-solution.md",
          "runtime/arcorbit/desktop/renderer/restricted-markdown.mjs",
          "runtime/arcorbit/desktop/renderer/renderer.js",
          "runtime/arcorbit/desktop/preload.cjs",
          "runtime/arcorbit/desktop/main.mjs",
          "runtime/arcorbit/test/restricted-markdown.test.mjs",
          "runtime/arcorbit/test/desktop-renderer.test.mjs",
          "/Users/Glare/Library/Developer/ModularProgram/hoewo/workshop-todo-website/frontend/src/components/features/CommentItem.tsx",
          "/Users/Glare/Library/Developer/ModularProgram/hoewo/workshop-todo-website/frontend/src/components/features/CommentEditor.tsx",
          "Verification: npm run check — 275 tests, 272 passed, 3 environment-gated skips, 0 failed, 2026-08-23",
          "git diff --check: passed",
          "Completion Review source inspection, 2026-08-23"
        ],
        "occurred_at": "2026-08-22T22:26:48.524Z"
      },
      {
        "cycle": 3,
        "autonomous_cycle": 3,
        "reviewer": "agent",
        "outcome": "findings",
        "content_revision": 7,
        "dimensions": {
          "implementation_correctness": "findings",
          "problem_resolution": "findings",
          "verification_credibility": "findings",
          "regression_risk": "findings",
          "minimality": "clean"
        },
        "finding_ids": [
          "task-attachment-cache-lifecycle"
        ],
        "evidence": [
          "arckit/spec/agentic-software-development/arcorbit-work-management.md",
          "arckit/interaction/task-browser/interaction.md",
          "arckit/tech/arcorbit/platform-composition-solution.md",
          "runtime/arcorbit/desktop/renderer/renderer.js",
          "runtime/arcorbit/desktop/main.mjs",
          "runtime/arcorbit/src/work-task-attachment-content.mjs",
          "runtime/arcorbit/src/work-task-attachment-resource.mjs",
          "runtime/arcorbit/src/platform-coordinator.mjs",
          "runtime/arcorbit/test/work-task-attachment-content.test.mjs",
          "runtime/arcorbit/test/work-task-attachment-resource.test.mjs",
          "runtime/arcorbit/test/platform-coordinator.test.mjs",
          "runtime/arcorbit/test/desktop-renderer.test.mjs",
          "Verification: npm run check — 285 tests, 282 passed, 3 environment-gated skips, 0 failed, 2026-08-23",
          "Completion Review source inspection of content revision 7, 2026-08-23"
        ],
        "occurred_at": "2026-08-22T23:10:05.362Z"
      },
      {
        "cycle": 4,
        "autonomous_cycle": 4,
        "reviewer": "agent",
        "outcome": "clean",
        "content_revision": 8,
        "dimensions": {
          "implementation_correctness": "clean",
          "problem_resolution": "clean",
          "verification_credibility": "clean",
          "regression_risk": "clean",
          "minimality": "clean"
        },
        "finding_ids": [],
        "evidence": [
          "arckit/spec/agentic-software-development/arcorbit-work-management.md",
          "arckit/interaction/task-browser/interaction.md",
          "arckit/tech/arcorbit/platform-composition-solution.md",
          "runtime/arcorbit/src/workshop-platform-adapter.mjs",
          "runtime/arcorbit/src/platform-coordinator.mjs",
          "runtime/arcorbit/src/work-task-attachment-cache.mjs",
          "runtime/arcorbit/desktop/main.mjs",
          "runtime/arcorbit/desktop/preload.cjs",
          "runtime/arcorbit/desktop/renderer/renderer.js",
          "runtime/arcorbit/test/work-task-attachment-cache.test.mjs",
          "runtime/arcorbit/test/work-task-attachment-content.test.mjs",
          "runtime/arcorbit/test/work-task-attachment-resource.test.mjs",
          "runtime/arcorbit/test/workshop-platform-adapter.test.mjs",
          "runtime/arcorbit/test/platform-coordinator.test.mjs",
          "runtime/arcorbit/test/desktop-renderer.test.mjs",
          "Verification: targeted TaskAttachment cache and desktop-renderer tests — 25 passed, 0 failed, 2026-08-23",
          "Verification: npm run check — 288 tests, 285 passed, 3 environment-gated skips, 0 failed, 2026-08-23",
          "git diff --check: passed",
          "Completion Review source inspection of content revision 8, 2026-08-23"
        ],
        "occurred_at": "2026-08-22T23:23:27.164Z"
      }
    ],
    "evidence": [
      "arckit/spec/agentic-software-development/arcorbit-work-management.md",
      "arckit/interaction/task-browser/interaction.md",
      "arckit/tech/arcorbit/platform-composition-solution.md",
      "runtime/arcorbit/desktop/renderer/renderer.js",
      "runtime/arcorbit/src/task-source-adapter.mjs",
      "runtime/arcorbit/test/desktop-renderer.test.mjs",
      "/Users/Glare/Library/Developer/ModularProgram/hoewo/workshop-todo-website/frontend/src/pages/ProjectDetailPage.tsx",
      "Verification: npm run check — 271 tests, 268 passed, 3 environment-gated skips, 0 failed",
      "git diff --check: passed",
      "Completion Review source inspection, 2026-08-23",
      "runtime/arcorbit/desktop/renderer/restricted-markdown.mjs",
      "runtime/arcorbit/desktop/preload.cjs",
      "runtime/arcorbit/desktop/main.mjs",
      "runtime/arcorbit/test/restricted-markdown.test.mjs",
      "/Users/Glare/Library/Developer/ModularProgram/hoewo/workshop-todo-website/frontend/src/components/features/CommentItem.tsx",
      "/Users/Glare/Library/Developer/ModularProgram/hoewo/workshop-todo-website/frontend/src/components/features/CommentEditor.tsx",
      "Verification: npm run check — 275 tests, 272 passed, 3 environment-gated skips, 0 failed, 2026-08-23",
      "runtime/arcorbit/src/work-task-attachment-content.mjs",
      "runtime/arcorbit/src/work-task-attachment-resource.mjs",
      "runtime/arcorbit/src/platform-coordinator.mjs",
      "runtime/arcorbit/test/work-task-attachment-content.test.mjs",
      "runtime/arcorbit/test/work-task-attachment-resource.test.mjs",
      "runtime/arcorbit/test/platform-coordinator.test.mjs",
      "Verification: npm run check — 285 tests, 282 passed, 3 environment-gated skips, 0 failed, 2026-08-23",
      "Completion Review source inspection of content revision 7, 2026-08-23",
      "runtime/arcorbit/src/workshop-platform-adapter.mjs",
      "runtime/arcorbit/src/work-task-attachment-cache.mjs",
      "runtime/arcorbit/test/work-task-attachment-cache.test.mjs",
      "runtime/arcorbit/test/workshop-platform-adapter.test.mjs",
      "Verification: targeted TaskAttachment cache and desktop-renderer tests — 25 passed, 0 failed, 2026-08-23",
      "Verification: npm run check — 288 tests, 285 passed, 3 environment-gated skips, 0 failed, 2026-08-23",
      "Completion Review source inspection of content revision 8, 2026-08-23"
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
      "goal": "以 Workshop Todo 前端、服务端和 ArcOrbit 当前实现的源码证据建立 Work 日常待办核心能力边界，并将产品、交互、技术与验证口径写入稳定文档。",
      "outcome": "completed",
      "gap_selection": {
        "mode": "candidate",
        "basis": "该 Case Gap 是当前唯一 ready 候选，且在实施前必须先以源码证据确定网页版与 ArcOrbit Work 的真实能力差距、复用边界和验收口径。",
        "snapshot_token": "6ac204632650e5f7942b0292bb78f0cc858210fda8dd0cd230925e122775fbb7",
        "selected_ref": "case-gap:CASE-20260822-006:GAP-establish-work-core-parity-boundary",
        "comparison_summary": "选择直接阻塞当前用户目标的 Work 核心能力边界 Gap；四个 Project Gap 均需独立 Case，虽有高风险或高紧迫性，但不提供本轮双端能力审计所需的直接前置结论。",
        "fresh_discovery_summary": "选择时未发现可取代该 persisted candidate 的 fresh Gap；执行审计后确认生产实现仍缺少核心旅程，并将其作为新的下游结果 Gap 持久化，未在本轮继续实施。",
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
            "reason": "需要独立 Case 验证 Agent 场景选择，不阻塞当前 Work 双端功能边界审计。"
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
            "reason": "Runtime 韧性与 adapter 接受工作需独立 Case；它不替代本轮对 Work 产品、交互与现有 adapter 能力的范围核对。"
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
            "reason": "真实权限项目的安全验证需要独立受控资源，本轮仅建立可验证边界，不声称已控制真实环境风险。"
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
            "reason": "跨记录审计虽紧迫但必须在独立 Case 中推进，且不解决当前用户要求的 Work 日常功能差距。"
          },
          {
            "ref": "case-gap:CASE-20260822-006:GAP-establish-work-core-parity-boundary",
            "source": "persisted",
            "eligibility": "ready",
            "disposition": "selected",
            "priority_basis": {
              "blocking": "后续实现范围和顺序依赖该差距边界。",
              "uncertainty": "尚未核对参考网站与 ArcOrbit Work 的实际代码和能力差异。",
              "risk": "盲目追求页面表象对齐可能破坏 Workshop 权威数据边界、共享 Task Browser、Automation 或 Feedback 复用。",
              "user_impact": "直接决定用户能否在 ArcOrbit 完成日常待办工作。"
            },
            "reason": "它是唯一 ready 候选，直接建立后续实现所需的双端证据、核心缺失项、保护边界与稳定验收范围。"
          }
        ]
      },
      "selected_gap": {
        "id": "GAP-establish-work-core-parity-boundary",
        "responsibility": "agent",
        "goal": "建立 Workshop Todo 网页端与 ArcOrbit Work 当前实现之间的核心日常待办能力对照、缺失项、复用边界和可验证验收范围。",
        "reason": "尚未接受的双端实现事实将决定后续需要修改的功能对象、交互范围、集成风险与验收方式；必须先形成可信差距结论，不能在同一轮依据新发现直接实施下游结果。",
        "derived_from": [
          "FACT-work-core-parity-requested"
        ],
        "blocked_by": [],
        "priority_basis": {
          "blocking": "后续实现范围和顺序依赖该差距边界。",
          "uncertainty": "尚未核对参考网站与 ArcOrbit Work 的实际代码和能力差异。",
          "risk": "盲目追求页面表象对齐可能破坏 Workshop 权威数据边界、共享 Task Browser、Automation 或 Feedback 复用。",
          "user_impact": "直接决定用户能否在 ArcOrbit 完成日常待办工作。"
        },
        "evidence_required": [
          "Workshop Todo 网页端核心日常待办功能及对应源码证据",
          "ArcOrbit Work 当前功能及对应源码证据",
          "明确的已具备、缺失、部分具备和有意不纳入项对照",
          "保护现有 Work、Automation、Feedback、Runtime 与人类 Gate 语义的边界说明",
          "可用于后续实现和验证的稳定验收口径"
        ]
      },
      "planned_transition": {
        "goal": "以 Workshop Todo 前端、服务端和 ArcOrbit 当前实现的源码证据建立 Work 日常待办核心能力边界，并将产品、交互、技术与验证口径写入稳定文档。",
        "expected_state_change": "双端能力对照、核心缺失项、复用边界与验收口径成为可恢复事实；生产实现差距作为下一轮独立 Gap 保持开放。"
      },
      "accepted_state_delta": {
        "resolved_gap": {
          "id": "GAP-establish-work-core-parity-boundary",
          "status": "resolved",
          "outcome": "已依据 Workshop Todo 网页端、服务端和 ArcOrbit 当前代码，建立已具备、部分具备、缺失与有意排除的核心能力边界，并形成稳定产品规格、交互策略/线框和技术契约。",
          "reason": "源码审计和持久文档共同覆盖筛选、任务树、子任务、完整详情、评论附件、权限、Automation/Feedback/Runtime/Gate 边界及可验证验收范围。",
          "evidence": [
            "arckit/spec/agentic-software-development/arcorbit-work-management.md",
            "arckit/interaction/task-browser/interaction.md",
            "arckit/interaction/task-browser/daily-work.html",
            "arckit/tech/arcorbit/platform-composition-solution.md",
            "/Users/Glare/Library/Developer/ModularProgram/hoewo/workshop-todo-website/frontend/src/pages/ProjectDetailPage.tsx",
            "/Users/Glare/Library/Developer/ModularProgram/hoewo/workshop-todo/handler/task.go",
            "runtime/arcorbit/src/workshop-platform-adapter.mjs",
            "runtime/arcorbit/desktop/renderer/renderer.js"
          ]
        },
        "facts_added": [
          {
            "id": "FACT-work-core-parity-boundary-established",
            "revision": 1,
            "status": "accepted",
            "statement": "替代 Workshop Todo 网页端日常处理所需的 Work 核心范围，是在现有七状态、任务 CRUD、执行人、父任务字段、语义优先级、标签、原始附件管理和 Automation/验收集成基础上，补齐服务端多维筛选、可解释的父子任务树与子任务操作、完整详情以及评论附件时间线；Markdown 导出、未成立的 Task history 和 Organization 治理不属于本轮核心门禁。",
            "basis": "对 Workshop Todo ProjectDetailPage、TaskDetailContent、CreateTaskDialog、tasks/comments 客户端契约、Workshop task handler/router 与 ArcOrbit Platform Adapter、Coordinator、Renderer 的逐项源码审计，并已沉淀为稳定规格、交互和技术文档。",
            "evidence": [
              "arckit/spec/agentic-software-development/arcorbit-work-management.md",
              "arckit/interaction/task-browser/interaction.md",
              "arckit/interaction/task-browser/daily-work.html",
              "arckit/tech/arcorbit/platform-composition-solution.md",
              "/Users/Glare/Library/Developer/ModularProgram/hoewo/workshop-todo-website/frontend/src/pages/ProjectDetailPage.tsx",
              "/Users/Glare/Library/Developer/ModularProgram/hoewo/workshop-todo-website/frontend/src/components/features/TaskDetailContent.tsx",
              "/Users/Glare/Library/Developer/ModularProgram/hoewo/workshop-todo-website/frontend/src/lib/api/endpoints/tasks.ts",
              "/Users/Glare/Library/Developer/ModularProgram/hoewo/workshop-todo-website/frontend/src/lib/api/endpoints/comments.ts",
              "/Users/Glare/Library/Developer/ModularProgram/hoewo/workshop-todo/handler/task.go"
            ]
          },
          {
            "id": "FACT-work-core-parity-implementation-gap",
            "revision": 1,
            "status": "accepted",
            "statement": "当前生产 ArcOrbit Work 尚未实现上述完整核心范围：任务读取仍缺少标签、优先级、创建日期等多值服务端筛选和 `/tasks/tree` 层级契约，Renderer 仍以平面列表和局部搜索为主，详情未形成与网页端等价的完整内容及评论附件协作旅程。",
            "basis": "ArcOrbit 当前 Workshop Platform Adapter、Platform Coordinator、typed preload IPC、Renderer 与现有测试和参考站点能力的直接对照。",
            "evidence": [
              "runtime/arcorbit/src/workshop-platform-adapter.mjs",
              "runtime/arcorbit/src/platform-coordinator.mjs",
              "runtime/arcorbit/desktop/preload.cjs",
              "runtime/arcorbit/desktop/renderer/renderer.js",
              "runtime/arcorbit/test/desktop-renderer.test.mjs",
              "/Users/Glare/Library/Developer/ModularProgram/hoewo/workshop-todo-website/frontend/src/pages/ProjectDetailPage.tsx"
            ]
          }
        ],
        "facts_superseded": [],
        "impacts_added": [
          {
            "id": "IMPACT-work-boundary-product-capabilities",
            "fact_id": "FACT-work-core-parity-boundary-established",
            "fact_revision": 1,
            "target": {
              "kind": "software_decision",
              "ref": "product_capabilities",
              "revision": 18
            },
            "effect": "upheld",
            "reason": "产品规格现在明确 Work 替代网页版日常待办处理所需的核心能力与非目标。",
            "gap_ids": [],
            "evidence": [
              "arckit/spec/agentic-software-development/arcorbit-work-management.md"
            ]
          },
          {
            "id": "IMPACT-work-boundary-interaction",
            "fact_id": "FACT-work-core-parity-boundary-established",
            "fact_revision": 1,
            "target": {
              "kind": "software_decision",
              "ref": "experience_and_interaction",
              "revision": 30
            },
            "effect": "upheld",
            "reason": "任务筛选、树、详情、评论附件、错误恢复及受控状态操作均已形成可恢复交互语义。",
            "gap_ids": [],
            "evidence": [
              "arckit/interaction/task-browser/interaction.md",
              "arckit/interaction/task-browser/daily-work.html"
            ]
          },
          {
            "id": "IMPACT-work-boundary-quality",
            "fact_id": "FACT-work-core-parity-boundary-established",
            "fact_revision": 1,
            "target": {
              "kind": "software_decision",
              "ref": "quality_and_validation",
              "revision": 5
            },
            "effect": "upheld",
            "reason": "稳定验收口径已覆盖筛选序列化、任务树、循环防护、评论权限、跨产品隔离、状态边界和失败恢复。",
            "gap_ids": [],
            "evidence": [
              "arckit/spec/agentic-software-development/arcorbit-work-management.md",
              "arckit/tech/arcorbit/platform-composition-solution.md"
            ]
          },
          {
            "id": "IMPACT-work-core-realization",
            "fact_id": "FACT-work-core-parity-implementation-gap",
            "fact_revision": 1,
            "target": {
              "kind": "software_invariant",
              "ref": "accepted-facts-are-realized",
              "revision": null
            },
            "effect": "threatened",
            "reason": "目标边界已稳定，但生产 Adapter、Coordinator、IPC 和 Renderer 尚未实现并验证核心差距。",
            "gap_ids": [
              "GAP-realize-work-core-parity"
            ],
            "evidence": [
              "runtime/arcorbit/src/workshop-platform-adapter.mjs",
              "runtime/arcorbit/desktop/renderer/renderer.js"
            ]
          }
        ],
        "impacts_updated": [],
        "gaps_added": [
          {
            "id": "GAP-realize-work-core-parity",
            "status": "open",
            "goal": "在生产 ArcOrbit 中实现并验证 Work 的多维服务端筛选、任务树与子任务、完整详情及评论附件核心旅程，同时保持 Automation、Feedback、Runtime、权限和人工 Gate 边界。",
            "reason": "稳定边界已建立，但当前 Adapter、Coordinator、typed IPC 和 Renderer 尚未覆盖这些替代网页版日常处理所必需的核心能力。",
            "derived_from": [
              "FACT-work-core-parity-requested",
              "FACT-work-core-parity-boundary-established",
              "FACT-work-core-parity-implementation-gap"
            ],
            "blocked_by": [
              "GAP-establish-work-core-parity-boundary"
            ],
            "priority_basis": {
              "blocking": "这是实现用户目标并进入 Completion Review 前的主要剩余工作。",
              "uncertainty": "服务端契约已核实，但跨层生产实现和既有共享行为仍需逐项验证。",
              "risk": "通用任务编辑可能绕过 Automation 状态动作、权限或 awaiting_human Gate。",
              "user_impact": "未完成前用户仍需回到网页版执行筛选、层级管理和评论协作。"
            },
            "responsibility": "agent",
            "evidence_required": [
              "Platform Adapter 对多值筛选、任务树和 TaskAttachment 语义的受限实现",
              "Coordinator 与 typed IPC 的固定业务动作和参数校验",
              "Work Renderer 对筛选、任务树、子任务、完整详情和评论附件的生产交互",
              "Automation、Feedback、Runtime、权限和 awaiting_human Gate 回归证据",
              "筛选序列化、日期边界、循环防护、评论权限、跨产品隔离和失败恢复自动化测试"
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
            "observed_revision": 17,
            "set_decision": {
              "status": "settled",
              "statement": "ArcOrbit preserves Setup Readiness, supervised one-thread-per-todo automation, trusted ledger transitions, intervention/recovery and acceptance feedback while providing Desktop composition of Workshop organizations, organization and project membership, personal and organization projects, seven-state todos, ordinary user feedback, local Product Workspaces and a persistent multi-product Workset. Workset Feedback remains the developer processing workspace and ArcOrbit retains its independent Product 107 feedback center. ArcOrbit also presents planning-only Chat, Idea, Release, Operations and Engineering workspaces. Engineering demonstrates management of versioned Domain Profiles: a profile combines Project/Case domain State definitions, expected/actual/diagnosis capability mappings and lifecycle-stage interpretations; users can browse templates, create or duplicate drafts, edit mappings, compare changes and review an apply plan so different teams or industries can reuse the same Loop Kernel and product lifecycle. Entry skills remain part of the shared Loop Kernel and are excluded from profiles. No new backend, persistence, skill installation, profile application, Runtime, monitoring, market-platform or registry integration is claimed. Automation discovers Workshop task changes through project WebSocket notifications and confirms them through REST. Modern services use event IDs, cursor replay and cursor-expiry recovery; legacy services use no-ID notifications while online and refresh current state on every reconnect without reading, writing or replaying a cursor. ArcOrbit performs startup, system-resume and network-recovery synchronization, a 15-minute global reconciliation and user-triggered immediate synchronization, but no minute-level fallback polling. Every task is re-read before conditional claim, and no transport or synchronization activity is approval to leave awaiting_human. Work replaces Workshop Todo web for daily task handling by adding server-backed multi-dimensional filtering, an explainable parent/child task tree and subtask operations, complete task detail, and TaskAttachment comment/attachment collaboration to its existing seven-state CRUD, assignment, priority, tag, attachment, Automation and acceptance capabilities. Markdown export, an unimplemented server Task-history route, and Organization governance are not core Work parity gates.",
              "reason": "对 Workshop Todo 网页端、服务端和 ArcOrbit 当前实现的源码审计建立了日常替代网页版所需的核心能力边界，并已形成稳定规格。",
              "evidence": [
                "Current operator input, 2026-08-23",
                "arckit/spec/agentic-software-development/arcorbit-work-management.md",
                "/Users/Glare/Library/Developer/ModularProgram/hoewo/workshop-todo-website/frontend/src/pages/ProjectDetailPage.tsx",
                "/Users/Glare/Library/Developer/ModularProgram/hoewo/workshop-todo/handler/task.go",
                "runtime/arcorbit/src/workshop-platform-adapter.mjs",
                "runtime/arcorbit/desktop/renderer/renderer.js"
              ],
              "confidence": "high",
              "resume_condition": "Revisit when Workshop Task or TaskAttachment contracts, Work daily parity scope, or protected Automation and human-Gate responsibilities change."
            },
            "gap_refs": [],
            "reason": "现有决定只声明七状态待办和平台组合，未完整恢复替代 Todo 网页端所需的筛选、层级、详情与评论协作能力。",
            "evidence": [
              "arckit/spec/agentic-software-development/arcorbit-work-management.md",
              "arckit/spec/agentic-software-development/arcorbit-platform-capabilities.md"
            ]
          },
          {
            "area_ref": "experience_and_interaction",
            "observed_revision": 29,
            "set_decision": {
              "status": "settled",
              "statement": "ArcOrbit uses three primary navigation groups: Personal contains Today and Chat; Product Lifecycle contains Idea, Work, Automation, Release, Operations and Feedback; Organization contains Organization and Engineering. English UI consistently uses Release and Operations, while Chinese descriptions use 发布 and 运营. Existing Workset, Work, Automation, Feedback, Organization, account, product-feedback and execution semantics remain authoritative. The five new pages are independent planning presentations built from current project facts. Engineering is a Domain Profile management preview with a Profile Library, draft metadata, State Model editor, Capability Mapping, Lifecycle Mapping, cross-industry change preview and Review & Apply confirmation. Profile changes replace domain State semantics and skills together while the shared Loop Kernel and Idea-to-Feedback lifecycle remain stable; all controls are non-persistent demonstrations. Setup Readiness separates global resource readiness from per-Product Workspace project readiness: binding or task start opens a project-scoped plan, all Codex-discoverable bundled skills and loaders target that project, legacy managed user targets receive visible backup/migration dispositions, and no user-level Codex target is offered. Automation shows realtime, reconnecting, degraded and legacy-compatible states plus a visible immediate-sync action. Modern reconnect performs cursor recovery before current-state refresh; legacy reconnect directly refreshes current state and never presents a stale cursor as continuity. Connection errors retain the last snapshot and do not start minute polling, while an awaiting-human item remains paused until the user explicitly resumes it. The top command bar does not provide global task, project or Run search and does not bind ⌘/Ctrl+K to Task Browser; shared task browsing remains available through Work state, Automation queue and Feedback-linked task context. Within Work, users combine the top product scope with server-side status, creator, executor, tag, priority, creation-date and content filters; results appear as a parent/child tree with explicit matched versus lineage-completion counts. The same view supports subtask creation and safe reparenting, complete Markdown task detail, TaskAttachment comments and attachments, and recoverable errors. Generic task editing never releases awaiting_human or replaces controlled Automation, Runtime, acceptance-feedback or Feedback journeys.",
              "reason": "稳定交互文档和灰度线框现在完整表达 Work 的筛选、层级、详情、协作、恢复和保护边界。",
              "evidence": [
                "Current operator input, 2026-08-23",
                "arckit/interaction/task-browser/interaction.md",
                "arckit/interaction/task-browser/daily-work.html",
                "arckit/interaction/task-browser/default.html"
              ],
              "confidence": "high",
              "resume_condition": "Revisit if Work daily task journeys, contextual Task Browser entry, TaskAttachment presentation, or Automation and human-Gate boundaries change."
            },
            "gap_refs": [],
            "reason": "现有决定保护上下文 Task Browser，但未完整恢复日常待办筛选、任务树、评论附件和失败恢复旅程。",
            "evidence": [
              "arckit/interaction/task-browser/interaction.md",
              "arckit/interaction/task-browser/daily-work.html"
            ]
          },
          {
            "area_ref": "quality_and_validation",
            "observed_revision": 4,
            "set_decision": {
              "status": "settled",
              "statement": "Protocol changes require schema/script validation, cross-record audits, Runtime automated tests, projection checks, direct-Codex no-Case recovery evidence, stale-token checks, read/write/read ordering checks, and risk-proportionate real execution evidence. Reliable synchronization requires transaction/event atomicity, ordering/replay, cross-instance wakeup, authorization revocation, slow-consumer, reconnect/deduplication, cursor-expiry, targeted refresh, legacy no-ID notification and reconnect-current-state tests, proof that no minute fallback timer exists, pre-claim remote confirmation, awaiting_human regressions and a real-link smoke check when available. Work core parity additionally requires adapter, coordinator, typed IPC and Renderer coverage for multi-value filter serialization, complete result counts, the 100-day task-tree date boundary, parent-lineage and subtree completion, subtask creation and circular-parent rejection, TaskAttachment parsing and permissions, cross-product isolation, controlled state actions, conflict recovery and the awaiting_human Gate.",
              "reason": "新增日常 Work 能力跨越远端查询、层级数据、权限 mutation 和受控执行边界，必须以与风险相称的跨层回归证据验收。",
              "evidence": [
                "arckit/spec/agentic-software-development/arcorbit-work-management.md",
                "arckit/tech/arcorbit/platform-composition-solution.md",
                "/Users/Glare/Library/Developer/ModularProgram/hoewo/workshop-todo/handler/task.go"
              ],
              "confidence": "high",
              "resume_condition": "Revisit when Workshop task query, tree, attachment permissions, ArcOrbit state-action boundaries or Work acceptance risks change."
            },
            "gap_refs": [],
            "reason": "当前验证决定覆盖同步与 Runtime 风险，但尚未表达 Work 核心对齐新增的查询、层级、权限和 Gate 回归要求。",
            "evidence": [
              "arckit/spec/agentic-software-development/arcorbit-work-management.md",
              "arckit/tech/arcorbit/platform-composition-solution.md"
            ]
          }
        ],
        "software_invariant_changes": [],
        "project_gap_changes": [],
        "selection_context_change": {
          "current_focus": "在生产 ArcOrbit 中实现并验证 Work 的多维服务端筛选、任务树与子任务、完整详情和评论附件，同时保护 Automation、Feedback、Runtime、权限与人工 Gate。",
          "project_priorities": [
            "Keep skills generic while Project State owns the concrete software-definition checklist and decisions.",
            "Let one Agent select dynamic gaps from all current facts without facet workflows.",
            "Apply relevant Project State changes atomically in the Gap transition that establishes them."
          ]
        },
        "evidence": [
          "Current operator input, 2026-08-23",
          "arckit/spec/agentic-software-development/arcorbit-work-management.md",
          "arckit/interaction/task-browser/interaction.md",
          "arckit/interaction/task-browser/daily-work.html",
          "arckit/tech/arcorbit/platform-composition-solution.md",
          "/Users/Glare/Library/Developer/ModularProgram/hoewo/workshop-todo-website/frontend/src/pages/ProjectDetailPage.tsx",
          "/Users/Glare/Library/Developer/ModularProgram/hoewo/workshop-todo/handler/task.go",
          "runtime/arcorbit/src/workshop-platform-adapter.mjs",
          "runtime/arcorbit/desktop/renderer/renderer.js"
        ]
      },
      "invariant_assessment": {
        "project_revision": 175,
        "judgments": [
          {
            "invariant_ref": "product-expectations-remain-recoverable",
            "disposition": "upheld",
            "reason": "独立 Work 产品规格和平台能力索引准确恢复核心能力、数据边界、明确非目标与七条验收口径。",
            "fact_refs": [
              "FACT-work-core-parity-boundary-established"
            ],
            "evidence": [
              "arckit/spec/agentic-software-development/arcorbit-work-management.md",
              "arckit/spec/agentic-software-development/arcorbit-platform-capabilities.md"
            ],
            "gap_refs": []
          },
          {
            "invariant_ref": "interaction-expectations-remain-recoverable",
            "disposition": "upheld",
            "reason": "任务筛选、树、详情、评论、权限、错误与恢复状态由交互策略和灰度线框共同持久表达。",
            "fact_refs": [
              "FACT-work-core-parity-boundary-established"
            ],
            "evidence": [
              "arckit/interaction/task-browser/interaction.md",
              "arckit/interaction/task-browser/daily-work.html"
            ],
            "gap_refs": []
          },
          {
            "invariant_ref": "visual-language-remains-consistent",
            "disposition": "not_relevant",
            "reason": "本轮只用既有灰度线框样式投影新增交互，没有建立、修改或声称新的稳定视觉语言规则。",
            "fact_refs": [],
            "evidence": [],
            "gap_refs": []
          },
          {
            "invariant_ref": "technical-decisions-remain-explainable",
            "disposition": "upheld",
            "reason": "技术方案明确 Workshop REST 权威边界、受限 adapter/IPC、树与附件契约、缓存刷新和不存在的 Task-history 排除项。",
            "fact_refs": [
              "FACT-work-core-parity-boundary-established"
            ],
            "evidence": [
              "arckit/tech/arcorbit/platform-composition-solution.md",
              "/Users/Glare/Library/Developer/ModularProgram/hoewo/workshop-todo/handler/task.go"
            ],
            "gap_refs": []
          },
          {
            "invariant_ref": "accepted-facts-are-realized",
            "disposition": "threatened",
            "reason": "稳定目标已建立，但当前生产 Adapter、Coordinator、IPC 和 Renderer 尚未实现并验证筛选、任务树及评论详情的完整核心旅程。",
            "fact_refs": [
              "FACT-work-core-parity-boundary-established",
              "FACT-work-core-parity-implementation-gap"
            ],
            "evidence": [],
            "gap_refs": [
              "GAP-realize-work-core-parity"
            ]
          },
          {
            "invariant_ref": "material-risks-have-credible-evidence",
            "disposition": "upheld",
            "reason": "本轮只接受边界审计结论；结论由参考前端、服务端 handler/router 与 ArcOrbit 当前实现的可重复源码对照及文档结构检查支持，未声称生产风险已被控制。",
            "fact_refs": [
              "FACT-work-core-parity-boundary-established",
              "FACT-work-core-parity-implementation-gap"
            ],
            "evidence": [
              "/Users/Glare/Library/Developer/ModularProgram/hoewo/workshop-todo-website/frontend/src/pages/ProjectDetailPage.tsx",
              "/Users/Glare/Library/Developer/ModularProgram/hoewo/workshop-todo-website/frontend/src/components/features/TaskDetailContent.tsx",
              "/Users/Glare/Library/Developer/ModularProgram/hoewo/workshop-todo/handler/task.go",
              "/Users/Glare/Library/Developer/ModularProgram/hoewo/workshop-todo/router/router.go",
              "runtime/arcorbit/src/workshop-platform-adapter.mjs",
              "runtime/arcorbit/desktop/renderer/renderer.js",
              "git diff --check: passed",
              "Wireframe structure: balanced tags and two device frames for two canvases"
            ],
            "gap_refs": []
          }
        ]
      },
      "evidence": [
        "Current operator input, 2026-08-23",
        "arckit/spec/agentic-software-development/arcorbit-work-management.md",
        "arckit/spec/agentic-software-development/arcorbit-platform-capabilities.md",
        "arckit/interaction/task-browser/interaction.md",
        "arckit/interaction/task-browser/daily-work.html",
        "arckit/tech/arcorbit/platform-composition-solution.md",
        "/Users/Glare/Library/Developer/ModularProgram/hoewo/workshop-todo-website/frontend/src/pages/ProjectDetailPage.tsx",
        "/Users/Glare/Library/Developer/ModularProgram/hoewo/workshop-todo-website/frontend/src/components/features/TaskDetailContent.tsx",
        "/Users/Glare/Library/Developer/ModularProgram/hoewo/workshop-todo-website/frontend/src/lib/api/endpoints/tasks.ts",
        "/Users/Glare/Library/Developer/ModularProgram/hoewo/workshop-todo-website/frontend/src/lib/api/endpoints/comments.ts",
        "/Users/Glare/Library/Developer/ModularProgram/hoewo/workshop-todo/router/router.go",
        "/Users/Glare/Library/Developer/ModularProgram/hoewo/workshop-todo/handler/task.go",
        "runtime/arcorbit/src/workshop-platform-adapter.mjs",
        "runtime/arcorbit/src/platform-coordinator.mjs",
        "runtime/arcorbit/desktop/preload.cjs",
        "runtime/arcorbit/desktop/renderer/renderer.js",
        "git diff --check: passed",
        "Wireframe structure: balanced tags and two device frames for two canvases",
        "Repair validation: case-transition validate passed; full snapshot-bound dry-run passed"
      ],
      "runtime_result_ref": "arckit-runtime://runs/RUN-20260822-211944859Z",
      "occurred_at": "2026-08-22T21:40:44.073Z"
    },
    {
      "round": 2,
      "transition_schema_version": "arckit-case-transition/v8",
      "goal": "在既有 Workshop 权威数据和受限 main-process 边界内完成 Work 多维筛选、任务树、子待办、完整详情与 TaskAttachment 协作，并以跨层自动化回归证明权限、产品隔离和 Automation/Gate 语义未被绕过。",
      "outcome": "completed",
      "gap_selection": {
        "mode": "candidate",
        "basis": "GAP-realize-work-core-parity 是当前唯一 ready Case Gap，直接阻塞用户在 ArcOrbit 内完成日常待办处理和 Case 进入 Completion Review；其产品、交互、技术与验收边界已由上一轮接受事实确定。",
        "snapshot_token": "313d2cd7dc4413bb911778e0104ac256020224c7dad2fd6d094e55c46d7c2dbf",
        "selected_ref": "case-gap:CASE-20260822-006:GAP-realize-work-core-parity",
        "comparison_summary": "选择唯一 ready 且直接兑现当前 Case 用户结果的生产实现 Gap。四个 Project Gap 均需独立 Case，虽然具有高风险或紧迫性，但不替代本轮 Work 跨层实现及回归验证。",
        "fresh_discovery_summary": "执行中未发现会改变既定实现对象、范围或验收方式的 fresh Gap；发现的代码问题均属于已接受的筛选、树、评论附件和 Gate 边界，并已在本 Gap 内修正验证。",
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
            "reason": "需要独立 Case 验证动态 Gap 选择场景，不直接实现当前 Work 日常待办能力。"
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
            "reason": "Runtime 韧性与通用 adapter 接受工作需要独立 Case；本轮只修改已确定的 Work Platform Adapter、Coordinator 与 Renderer 边界。"
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
            "reason": "真实权限项目验证需要独立受控资源；本轮保持 Workshop 服务端最终权限判定并验证受限客户端动作。"
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
            "reason": "跨记录审计需要独立 Case，不能替代当前生产 Work 能力实现。"
          },
          {
            "ref": "case-gap:CASE-20260822-006:GAP-realize-work-core-parity",
            "source": "persisted",
            "eligibility": "ready",
            "disposition": "selected",
            "priority_basis": {
              "blocking": "这是实现用户目标并进入 Completion Review 前的主要剩余工作。",
              "uncertainty": "服务端契约已核实，但跨层生产实现和既有共享行为仍需逐项验证。",
              "risk": "通用任务编辑可能绕过 Automation 状态动作、权限或 awaiting_human Gate。",
              "user_impact": "未完成前用户仍需回到网页版执行筛选、层级管理和评论协作。"
            },
            "reason": "该 Gap 是唯一 ready 候选，且其边界已由已接受事实稳定，可在本轮直接完成跨层实现和可信验证。"
          }
        ]
      },
      "selected_gap": {
        "id": "GAP-realize-work-core-parity",
        "responsibility": "agent",
        "goal": "在生产 ArcOrbit 中实现并验证 Work 的多维服务端筛选、任务树与子任务、完整详情及评论附件核心旅程，同时保持 Automation、Feedback、Runtime、权限和人工 Gate 边界。",
        "reason": "稳定边界已建立，但当前 Adapter、Coordinator、typed IPC 和 Renderer 尚未覆盖这些替代网页版日常处理所必需的核心能力。",
        "derived_from": [
          "FACT-work-core-parity-requested",
          "FACT-work-core-parity-boundary-established",
          "FACT-work-core-parity-implementation-gap"
        ],
        "blocked_by": [
          "GAP-establish-work-core-parity-boundary"
        ],
        "priority_basis": {
          "blocking": "这是实现用户目标并进入 Completion Review 前的主要剩余工作。",
          "uncertainty": "服务端契约已核实，但跨层生产实现和既有共享行为仍需逐项验证。",
          "risk": "通用任务编辑可能绕过 Automation 状态动作、权限或 awaiting_human Gate。",
          "user_impact": "未完成前用户仍需回到网页版执行筛选、层级管理和评论协作。"
        },
        "evidence_required": [
          "Platform Adapter 对多值筛选、任务树和 TaskAttachment 语义的受限实现",
          "Coordinator 与 typed IPC 的固定业务动作和参数校验",
          "Work Renderer 对筛选、任务树、子任务、完整详情和评论附件的生产交互",
          "Automation、Feedback、Runtime、权限和 awaiting_human Gate 回归证据",
          "筛选序列化、日期边界、循环防护、评论权限、跨产品隔离和失败恢复自动化测试"
        ]
      },
      "planned_transition": {
        "goal": "在既有 Workshop 权威数据和受限 main-process 边界内完成 Work 多维筛选、任务树、子待办、完整详情与 TaskAttachment 协作，并以跨层自动化回归证明权限、产品隔离和 Automation/Gate 语义未被绕过。",
        "expected_state_change": "生产 Adapter、Coordinator 和 Renderer 兑现已接受的 Work 核心能力边界，原实现缺失事实被新实现事实取代，accepted-facts-are-realized impact 恢复为 upheld。"
      },
      "accepted_state_delta": {
        "resolved_gap": {
          "id": "GAP-realize-work-core-parity",
          "status": "resolved",
          "outcome": "生产 ArcOrbit Work 已实现服务端多值筛选、日期闭区间与 100 天任务树、父级补全、子待办创建和安全重挂、完整正文、TaskAttachment 评论附件时间线及失败重试；Automation 管理中的状态变更继续通过受控动作完成。",
          "reason": "Adapter、Coordinator、Renderer 和自动化测试共同覆盖既定核心旅程、固定业务动作、跨产品父级校验、循环拒绝、附件权限投影与人工 Gate 保护；完整 ArcOrbit 检查无失败。",
          "evidence": [
            "runtime/arcorbit/src/workshop-platform-adapter.mjs",
            "runtime/arcorbit/src/platform-coordinator.mjs",
            "runtime/arcorbit/desktop/renderer/index.html",
            "runtime/arcorbit/desktop/renderer/renderer.js",
            "runtime/arcorbit/desktop/renderer/styles.css",
            "runtime/arcorbit/test/workshop-platform-adapter.test.mjs",
            "runtime/arcorbit/test/platform-coordinator.test.mjs",
            "runtime/arcorbit/test/desktop-renderer.test.mjs",
            "Verification: npm run check — 271 tests, 268 passed, 3 environment-gated skips, 0 failed"
          ]
        },
        "facts_added": [
          {
            "id": "FACT-work-core-parity-realized",
            "revision": 1,
            "status": "accepted",
            "statement": "生产 ArcOrbit Work 现已通过受限 Workshop Platform Adapter 和 Platform Coordinator 提供服务端状态、创建人、执行人、标签、优先级、创建日期及内容筛选，100 天边界内的父子任务树与层级补全，子待办创建和同产品无循环重挂，完整任务正文及 TaskAttachment 评论附件时间线；Automation 管理中的任务不能通过通用 task.update 改变状态，Workshop 继续承担最终权限判定。",
            "basis": "直接实现并检查 Adapter、Coordinator、Renderer 与样式，同时增加筛选序列化、日期闭区间、树投影、跨产品隔离、循环拒绝、TaskAttachment 权限/恢复和 Automation 状态 Gate 回归测试；完整 ArcOrbit 检查通过。",
            "evidence": [
              "runtime/arcorbit/src/workshop-platform-adapter.mjs",
              "runtime/arcorbit/src/platform-coordinator.mjs",
              "runtime/arcorbit/desktop/renderer/index.html",
              "runtime/arcorbit/desktop/renderer/renderer.js",
              "runtime/arcorbit/desktop/renderer/styles.css",
              "runtime/arcorbit/test/workshop-platform-adapter.test.mjs",
              "runtime/arcorbit/test/platform-coordinator.test.mjs",
              "runtime/arcorbit/test/desktop-renderer.test.mjs",
              "Verification: npm run check — 271 tests, 268 passed, 3 environment-gated skips, 0 failed"
            ]
          }
        ],
        "facts_superseded": [
          {
            "id": "FACT-work-core-parity-implementation-gap",
            "revision": 1,
            "reason": "该事实描述的生产缺失已由本轮 Adapter、Coordinator、Renderer 实现和完整自动化验证消除。",
            "evidence": [
              "runtime/arcorbit/src/workshop-platform-adapter.mjs",
              "runtime/arcorbit/src/platform-coordinator.mjs",
              "runtime/arcorbit/desktop/renderer/renderer.js",
              "Verification: npm run check — 271 tests, 268 passed, 3 environment-gated skips, 0 failed"
            ]
          }
        ],
        "impacts_added": [],
        "impacts_updated": [
          {
            "id": "IMPACT-work-core-realization",
            "fact_id": "FACT-work-core-parity-realized",
            "fact_revision": 1,
            "target": {
              "kind": "software_invariant",
              "ref": "accepted-facts-are-realized",
              "revision": null
            },
            "effect": "upheld",
            "reason": "已接受的 Work 核心边界现已在生产 Adapter、Coordinator 和 Renderer 中实现，并通过覆盖筛选、树、子待办、评论附件、产品隔离和 Automation Gate 的完整检查。",
            "gap_ids": [],
            "evidence": [
              "runtime/arcorbit/src/workshop-platform-adapter.mjs",
              "runtime/arcorbit/src/platform-coordinator.mjs",
              "runtime/arcorbit/desktop/renderer/index.html",
              "runtime/arcorbit/desktop/renderer/renderer.js",
              "runtime/arcorbit/test/workshop-platform-adapter.test.mjs",
              "runtime/arcorbit/test/platform-coordinator.test.mjs",
              "runtime/arcorbit/test/desktop-renderer.test.mjs",
              "Verification: npm run check — 271 tests, 268 passed, 3 environment-gated skips, 0 failed"
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
        "selection_context_change": {
          "current_focus": "ArcOrbit Work 核心日常待办能力已进入生产实现并通过自动化回归；Case 等待基于 fresh state 的后续推进。",
          "project_priorities": [
            "Keep skills generic while Project State owns the concrete software-definition checklist and decisions.",
            "Let one Agent select dynamic gaps from all current facts without facet workflows.",
            "Apply relevant Project State changes atomically in the Gap transition that establishes them."
          ]
        },
        "evidence": [
          "runtime/arcorbit/src/workshop-platform-adapter.mjs",
          "runtime/arcorbit/src/platform-coordinator.mjs",
          "runtime/arcorbit/desktop/renderer/renderer.js",
          "Verification: npm run check — 271 tests, 268 passed, 3 environment-gated skips, 0 failed"
        ]
      },
      "invariant_assessment": {
        "project_revision": 176,
        "judgments": [
          {
            "invariant_ref": "product-expectations-remain-recoverable",
            "disposition": "upheld",
            "reason": "既有 Work 产品规格定义的核心替代范围未被扩张或削弱，生产实现现在直接兑现筛选、层级、详情和评论附件能力及明确非目标。",
            "fact_refs": [
              "FACT-work-core-parity-boundary-established",
              "FACT-work-core-parity-realized"
            ],
            "evidence": [
              "arckit/spec/agentic-software-development/arcorbit-work-management.md",
              "runtime/arcorbit/src/workshop-platform-adapter.mjs",
              "runtime/arcorbit/desktop/renderer/renderer.js"
            ],
            "gap_refs": []
          },
          {
            "invariant_ref": "interaction-expectations-remain-recoverable",
            "disposition": "upheld",
            "reason": "Work 生产页面现已实现持久交互文档中的服务端组合筛选、父子树、子待办、完整详情、评论附件时间线和失败重试，同时保留受控 Automation 动作。",
            "fact_refs": [
              "FACT-work-core-parity-realized"
            ],
            "evidence": [
              "arckit/interaction/task-browser/interaction.md",
              "runtime/arcorbit/desktop/renderer/index.html",
              "runtime/arcorbit/desktop/renderer/renderer.js",
              "runtime/arcorbit/test/desktop-renderer.test.mjs"
            ],
            "gap_refs": []
          },
          {
            "invariant_ref": "visual-language-remains-consistent",
            "disposition": "upheld",
            "reason": "新增筛选面板、树缩进、详情正文和评论时间线沿用现有 Desktop token、panel、button、status 和 inspector 视觉语言，且 Renderer 结构回归通过。",
            "fact_refs": [
              "FACT-work-core-parity-realized"
            ],
            "evidence": [
              "arckit/visual/_library/brief.md",
              "runtime/arcorbit/desktop/renderer/styles.css",
              "runtime/arcorbit/test/desktop-renderer.test.mjs"
            ],
            "gap_refs": []
          },
          {
            "invariant_ref": "technical-decisions-remain-explainable",
            "disposition": "upheld",
            "reason": "Workshop REST 仍是权威数据与最终权限边界；新增查询、树和 TaskAttachment 通过受限 Adapter、固定 Coordinator 动作和既有 typed platform IPC 暴露，Renderer 未获得凭据或通用请求能力。",
            "fact_refs": [
              "FACT-work-core-parity-realized"
            ],
            "evidence": [
              "arckit/tech/arcorbit/platform-composition-solution.md",
              "runtime/arcorbit/src/workshop-platform-adapter.mjs",
              "runtime/arcorbit/src/platform-coordinator.mjs",
              "runtime/arcorbit/desktop/preload.cjs",
              "runtime/arcorbit/test/platform-coordinator.test.mjs"
            ],
            "gap_refs": []
          },
          {
            "invariant_ref": "accepted-facts-are-realized",
            "disposition": "upheld",
            "reason": "已接受的 Work 核心能力边界已在生产跨层实现中兑现；原实现差距事实被 supersede，承接 impact 已更新为 upheld。",
            "fact_refs": [
              "FACT-work-core-parity-boundary-established",
              "FACT-work-core-parity-realized"
            ],
            "evidence": [
              "runtime/arcorbit/src/workshop-platform-adapter.mjs",
              "runtime/arcorbit/src/platform-coordinator.mjs",
              "runtime/arcorbit/desktop/renderer/index.html",
              "runtime/arcorbit/desktop/renderer/renderer.js",
              "Verification: npm run check — 271 tests, 268 passed, 3 environment-gated skips, 0 failed"
            ],
            "gap_refs": []
          },
          {
            "invariant_ref": "material-risks-have-credible-evidence",
            "disposition": "upheld",
            "reason": "筛选序列化、日期闭区间和 100 天限制、树补全计数、同产品父级校验、循环拒绝、TaskAttachment 权限投影/失败重试及 Automation 状态 Gate 均有可重复自动化证据；本轮未声称独立 Project Gap 所要求的真实权限环境验证已完成。",
            "fact_refs": [
              "FACT-work-core-parity-realized"
            ],
            "evidence": [
              "runtime/arcorbit/test/workshop-platform-adapter.test.mjs",
              "runtime/arcorbit/test/platform-coordinator.test.mjs",
              "runtime/arcorbit/test/desktop-renderer.test.mjs",
              "runtime/arcorbit/test/automation-coordinator.test.mjs",
              "Verification: npm run check — 271 tests, 268 passed, 3 environment-gated skips, 0 failed",
              "git diff --check: passed"
            ],
            "gap_refs": []
          }
        ]
      },
      "evidence": [
        "arckit/spec/agentic-software-development/arcorbit-work-management.md",
        "arckit/interaction/task-browser/interaction.md",
        "arckit/tech/arcorbit/platform-composition-solution.md",
        "runtime/arcorbit/src/workshop-platform-adapter.mjs",
        "runtime/arcorbit/src/platform-coordinator.mjs",
        "runtime/arcorbit/desktop/preload.cjs",
        "runtime/arcorbit/desktop/renderer/index.html",
        "runtime/arcorbit/desktop/renderer/renderer.js",
        "runtime/arcorbit/desktop/renderer/styles.css",
        "runtime/arcorbit/test/workshop-platform-adapter.test.mjs",
        "runtime/arcorbit/test/platform-coordinator.test.mjs",
        "runtime/arcorbit/test/desktop-renderer.test.mjs",
        "runtime/arcorbit/test/automation-coordinator.test.mjs",
        "Verification: npm run check — 271 tests, 268 passed, 3 environment-gated skips, 0 failed",
        "Verification: targeted Work adapter/coordinator/renderer suite — 35 passed, 0 failed",
        "git diff --check: passed"
      ],
      "runtime_result_ref": "arckit-runtime://runs/RUN-20260822-211944859Z",
      "occurred_at": "2026-08-22T21:56:08.401Z"
    },
    {
      "round": 3,
      "transition_schema_version": "arckit-case-transition/v8",
      "goal": "对 content revision 2 的 Work 生产实现执行五维 Completion Review，并把确认的实现、问题解决和验证缺口记录为普通 Review findings。",
      "outcome": "completed",
      "gap_selection": {
        "mode": "candidate",
        "basis": "全部普通 Case Gap 与 state impact 已闭合，Completion Review 是当前唯一 ready 且直接阻塞 Case 解决的候选；四个 Project Gap 均需独立 Case。",
        "snapshot_token": "8a70a65954cbbee8d6dcddfe69cb0c9533c01abaedcf2b3fad720693bbdf04b2",
        "selected_ref": "case-gap:CASE-20260822-006:CASE-20260822-006:completion-review:1",
        "comparison_summary": "选择唯一 ready 的 Case Completion Review；其余四个 Project Gap 虽有高风险或高紧迫性，但均为 case_required，不能替代对当前 Work 实现的五维完成审查。",
        "fresh_discovery_summary": "选择时未发现可取代 persisted Completion Review 的 fresh Gap；审查执行中发现两项实现与验证缺口，由 Review finding 自动形成下一轮普通 Gap。",
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
            "reason": "需要独立 Case 验证跨场景动态 Gap 选择，不替代当前实现的 Completion Review。"
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
              "user_impact": "中等紧迫性"
            },
            "reason": "Runtime 韧性与 adapter 接受工作需要独立 Case，且不是本 Case 完成审查的替代项。"
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
              "user_impact": "中等紧迫性"
            },
            "reason": "真实权限环境验证需要独立受控资源和 Case；本轮只审查当前 Work 实现已声称的范围。"
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
              "user_impact": "高紧迫性"
            },
            "reason": "跨记录审计虽紧迫但必须独立建 Case，不取代当前 Case 的实现审查门禁。"
          },
          {
            "ref": "case-gap:CASE-20260822-006:CASE-20260822-006:completion-review:1",
            "source": "persisted",
            "eligibility": "ready",
            "disposition": "selected",
            "priority_basis": {
              "blocking": "high",
              "uncertainty": "low",
              "risk": "high",
              "user_impact": "high"
            },
            "reason": "它是唯一 ready 候选，并直接决定当前生产实现能否可信地解决用户目标和关闭 Case。"
          }
        ]
      },
      "selected_gap": {
        "id": "CASE-20260822-006:completion-review:1",
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
        "goal": "对 content revision 2 的 Work 生产实现执行五维 Completion Review，并把确认的实现、问题解决和验证缺口记录为普通 Review findings。",
        "expected_state_change": "Completion Review 形成可恢复的 findings 结论；每项 finding 自动成为下一轮普通 Gap，当前 Case 保持未解决。"
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
            "problem_resolution": "findings",
            "verification_credibility": "findings",
            "regression_risk": "findings",
            "minimality": "clean"
          },
          "findings": [
            {
              "id": "status-filter-server-contract",
              "kind": "error",
              "statement": "Work 的七状态选择必须进入服务端 task-tree 查询并让命中/补全计数对应当前组合条件；当前 platformTaskFilters 始终发送全部七状态，随后只在 Renderer 本地筛选，因此状态轴和汇总计数不满足已接受的服务端筛选语义。",
              "responsibility": "agent",
              "artifact_refs": [
                "runtime/arcorbit/desktop/renderer/renderer.js",
                "runtime/arcorbit/test/desktop-renderer.test.mjs"
              ],
              "evidence": [
                "platformTaskFilters() hard-codes states: TASK_STATES while openWorkState() only changes state.selectedState",
                "renderPlatformWork() derives the selected-state rows locally but displays matched_total and total from the all-state tree query",
                "desktop-renderer.test.mjs asserts only that task_filters and tree wiring exist; it does not prove selected status serialization or count semantics",
                "arckit/spec/agentic-software-development/arcorbit-work-management.md requires combined seven-state server filtering and counts from the same query fact"
              ]
            },
            {
              "id": "complete-task-detail",
              "kind": "omission",
              "statement": "Work Inspector 必须兑现稳定规格中的完整详情：受限 Markdown、创建人、标签、创建/更新/完成时间和可恢复任务引用；当前仅以转义 pre 显示正文，元数据缺项且没有复制引用，因而仍不能声称完整详情旅程已完成。",
              "responsibility": "agent",
              "artifact_refs": [
                "runtime/arcorbit/desktop/renderer/renderer.js",
                "runtime/arcorbit/src/task-source-adapter.mjs",
                "runtime/arcorbit/test/desktop-renderer.test.mjs"
              ],
              "evidence": [
                "renderPlatformWorkInspector() renders task.content inside escaped <pre> and its factRows omit creator, tags and task timestamps",
                "normalizeTask() does not project a completion timestamp needed by the accepted Inspector contract",
                "Renderer contains no Work task-reference copy action",
                "desktop-renderer.test.mjs labels the journey complete but checks only structural regexes and a CSS class, not Markdown, required metadata or reference recovery",
                "arckit/spec/agentic-software-development/arcorbit-work-management.md and arckit/interaction/task-browser/interaction.md require these complete-detail behaviors"
              ]
            }
          ],
          "evidence": [
            "arckit/spec/agentic-software-development/arcorbit-work-management.md",
            "arckit/interaction/task-browser/interaction.md",
            "arckit/tech/arcorbit/platform-composition-solution.md",
            "runtime/arcorbit/desktop/renderer/renderer.js",
            "runtime/arcorbit/src/task-source-adapter.mjs",
            "runtime/arcorbit/test/desktop-renderer.test.mjs",
            "/Users/Glare/Library/Developer/ModularProgram/hoewo/workshop-todo-website/frontend/src/pages/ProjectDetailPage.tsx",
            "Verification: npm run check — 271 tests, 268 passed, 3 environment-gated skips, 0 failed",
            "git diff --check: passed",
            "Completion Review source inspection, 2026-08-23"
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
        "project_revision": 177,
        "judgments": [
          {
            "invariant_ref": "product-expectations-remain-recoverable",
            "disposition": "upheld",
            "reason": "稳定 Work 产品规格仍准确、无歧义地表达服务端组合筛选、同查询计数和完整详情目标，并直接提供两项 finding 的修复口径。",
            "fact_refs": [
              "FACT-work-core-parity-boundary-established",
              "FACT-work-core-parity-realized"
            ],
            "evidence": [
              "arckit/spec/agentic-software-development/arcorbit-work-management.md"
            ],
            "gap_refs": []
          },
          {
            "invariant_ref": "interaction-expectations-remain-recoverable",
            "disposition": "upheld",
            "reason": "交互文档完整保留状态与项目正交筛选、服务端组合条件、同查询计数、受限 Markdown、详情元数据和可恢复任务引用语义。",
            "fact_refs": [
              "FACT-work-core-parity-boundary-established",
              "FACT-work-core-parity-realized"
            ],
            "evidence": [
              "arckit/interaction/task-browser/interaction.md"
            ],
            "gap_refs": []
          },
          {
            "invariant_ref": "visual-language-remains-consistent",
            "disposition": "not_relevant",
            "reason": "本轮 findings 针对查询语义、详情内容完整性和验证覆盖，不建立或改变稳定视觉语言规则。",
            "fact_refs": [],
            "evidence": [],
            "gap_refs": []
          },
          {
            "invariant_ref": "technical-decisions-remain-explainable",
            "disposition": "upheld",
            "reason": "受限 Adapter/Coordinator、Workshop REST 权威边界、服务端任务树和安全详情呈现的技术决定仍清晰可恢复；findings 是生产实现未完整兑现这些决定，而非决定本身缺失。",
            "fact_refs": [
              "FACT-work-core-parity-boundary-established",
              "FACT-work-core-parity-realized"
            ],
            "evidence": [
              "arckit/tech/arcorbit/platform-composition-solution.md"
            ],
            "gap_refs": []
          },
          {
            "invariant_ref": "accepted-facts-are-realized",
            "disposition": "threatened",
            "reason": "当前生产实现仍把状态轴留在 Renderer 本地，并缺少已接受完整详情旅程的必要呈现，因此 FACT-work-core-parity-realized 的完整兑现主张尚不成立。",
            "fact_refs": [
              "FACT-work-core-parity-boundary-established",
              "FACT-work-core-parity-realized"
            ],
            "evidence": [
              "runtime/arcorbit/desktop/renderer/renderer.js",
              "runtime/arcorbit/src/task-source-adapter.mjs"
            ],
            "gap_refs": [
              "CASE-20260822-006:review-finding:status-filter-server-contract",
              "CASE-20260822-006:review-finding:complete-task-detail"
            ]
          },
          {
            "invariant_ref": "material-risks-have-credible-evidence",
            "disposition": "threatened",
            "reason": "完整测试通过证明既有断言未回归，但 Renderer 测试没有执行状态参数/计数语义，也没有验证 Markdown、详情元数据或任务引用，不能支撑这些具体风险已被控制。",
            "fact_refs": [
              "FACT-work-core-parity-realized"
            ],
            "evidence": [
              "runtime/arcorbit/test/desktop-renderer.test.mjs",
              "Verification: npm run check — 271 tests, 268 passed, 3 environment-gated skips, 0 failed"
            ],
            "gap_refs": [
              "CASE-20260822-006:review-finding:status-filter-server-contract",
              "CASE-20260822-006:review-finding:complete-task-detail"
            ]
          }
        ]
      },
      "evidence": [
        "arckit/spec/agentic-software-development/arcorbit-work-management.md",
        "arckit/interaction/task-browser/interaction.md",
        "runtime/arcorbit/desktop/renderer/renderer.js",
        "runtime/arcorbit/src/task-source-adapter.mjs",
        "runtime/arcorbit/test/desktop-renderer.test.mjs",
        "/Users/Glare/Library/Developer/ModularProgram/hoewo/workshop-todo-website/frontend/src/pages/ProjectDetailPage.tsx",
        "Verification: npm run check — 271 tests, 268 passed, 3 environment-gated skips, 0 failed",
        "git diff --check: passed",
        "Completion Review source inspection, 2026-08-23"
      ],
      "runtime_result_ref": "arckit-runtime://runs/RUN-20260822-211944859Z",
      "occurred_at": "2026-08-22T22:02:53.184Z"
    },
    {
      "round": 4,
      "transition_schema_version": "arckit-case-transition/v8",
      "goal": "让当前状态进入 Workshop task-tree 服务端查询，以相同非状态筛选条件取得七状态服务端计数，并由 Renderer 直接呈现服务端补全树和对应命中/补全汇总。",
      "outcome": "completed",
      "gap_selection": {
        "mode": "candidate",
        "basis": "两个 ready Review finding 都阻塞 Case；状态筛选项是明确的 correctness error，直接使服务端筛选和命中计数失真，且其修复与详情呈现无依赖，可在本轮独立实现和验证。",
        "snapshot_token": "9ccb1339f92cbdee687b1eb8821493f11d4d969bb189cf4fc37fee9dd1c5d40e",
        "selected_ref": "case-gap:CASE-20260822-006:CASE-20260822-006:review-finding:status-filter-server-contract",
        "comparison_summary": "优先修复直接影响所有状态浏览结果和计数的 status-filter-server-contract；complete-task-detail 同样 ready，但属于独立详情旅程，留待 fresh 下一轮。四个 Project Gap 均需独立 Case。",
        "fresh_discovery_summary": "本轮未发现可取代两个 persisted Review finding 的 fresh candidate；实现与验证没有显露需要先接受的新前置事实。",
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
            "reason": "需要独立 Case 验证动态 Gap 选择，不解决当前 Work 状态筛选错误。"
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
              "user_impact": "中等紧迫性"
            },
            "reason": "Runtime 韧性工作需要独立 Case，与当前服务端任务筛选错误无直接依赖。"
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
              "user_impact": "中等紧迫性"
            },
            "reason": "真实权限项目验证需要独立受控资源和 Case，不是当前筛选语义修复。"
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
              "user_impact": "高紧迫性"
            },
            "reason": "跨记录审计虽紧迫但必须独立建 Case，不能替代当前实现修复。"
          },
          {
            "ref": "case-gap:CASE-20260822-006:CASE-20260822-006:review-finding:status-filter-server-contract",
            "source": "persisted",
            "eligibility": "ready",
            "disposition": "selected",
            "priority_basis": {
              "blocking": "high",
              "uncertainty": "",
              "risk": "high",
              "user_impact": ""
            },
            "reason": "这是直接影响七状态主导航、服务端结果和汇总计数的明确错误，修复边界最小且可独立验证。"
          },
          {
            "ref": "case-gap:CASE-20260822-006:CASE-20260822-006:review-finding:complete-task-detail",
            "source": "persisted",
            "eligibility": "ready",
            "disposition": "deferred",
            "priority_basis": {
              "blocking": "high",
              "uncertainty": "",
              "risk": "high",
              "user_impact": ""
            },
            "reason": "完整详情同样阻塞 Case，但与筛选错误没有因果依赖，应在本轮 closeout 后从 fresh state 单独推进。"
          }
        ]
      },
      "selected_gap": {
        "id": "CASE-20260822-006:review-finding:status-filter-server-contract",
        "responsibility": "agent",
        "goal": "Resolve review finding: Work 的七状态选择必须进入服务端 task-tree 查询并让命中/补全计数对应当前组合条件；当前 platformTaskFilters 始终发送全部七状态，随后只在 Renderer 本地筛选，因此状态轴和汇总计数不满足已接受的服务端筛选语义。",
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
          "platformTaskFilters() hard-codes states: TASK_STATES while openWorkState() only changes state.selectedState",
          "renderPlatformWork() derives the selected-state rows locally but displays matched_total and total from the all-state tree query",
          "desktop-renderer.test.mjs asserts only that task_filters and tree wiring exist; it does not prove selected status serialization or count semantics",
          "arckit/spec/agentic-software-development/arcorbit-work-management.md requires combined seven-state server filtering and counts from the same query fact"
        ]
      },
      "planned_transition": {
        "goal": "让当前状态进入 Workshop task-tree 服务端查询，以相同非状态筛选条件取得七状态服务端计数，并由 Renderer 直接呈现服务端补全树和对应命中/补全汇总。",
        "expected_state_change": "状态筛选与计数 Review finding 被解决并获得跨 Coordinator/Renderer 的回归证据；完整详情 finding 继续保持开放。"
      },
      "accepted_state_delta": {
        "resolved_gap": {
          "id": "CASE-20260822-006:review-finding:status-filter-server-contract",
          "status": "resolved",
          "outcome": "Work 状态按钮现在把唯一当前状态发送给服务端 task-tree 查询；Coordinator 使用同一组非状态条件独立取得七状态完整计数；Renderer 的命中/补全汇总来自当前树查询并保留服务端返回的完整父链和子树。",
          "reason": "根因路径已最小修复，状态请求、跨产品计数、当前树汇总和下游子树投影均有定向测试及完整 ArcOrbit 回归证据。",
          "evidence": [
            "runtime/arcorbit/desktop/renderer/renderer.js",
            "runtime/arcorbit/src/platform-coordinator.mjs",
            "runtime/arcorbit/test/desktop-renderer.test.mjs",
            "runtime/arcorbit/test/platform-coordinator.test.mjs",
            "Verification: targeted platform-coordinator and desktop-renderer tests — 28 passed, 0 failed",
            "Verification: npm run check — 271 tests, 268 passed, 3 environment-gated skips, 0 failed",
            "git diff --check: passed",
            "Debug cleanup: no ARC_DEBUG:status-filter-server-contract marker or temporary log remains"
          ]
        },
        "facts_added": [
          {
            "id": "FACT-work-status-filter-server-contract-realized",
            "revision": 1,
            "status": "accepted",
            "statement": "ArcOrbit Work 当前选择的唯一状态现已进入每个产品的 Workshop task-tree 服务端查询；同一组创建人、执行人、标签、优先级、日期和内容条件另行取得全部七状态的服务端计数，当前命中数与补全树总数来自所选状态的 tree 响应，Renderer 不再二次裁掉服务端返回的父链或下游子树。",
            "basis": "Renderer 请求与树投影、Platform Coordinator 的双查询组合，以及对状态参数、七状态计数和树汇总的定向回归共同证明。",
            "evidence": [
              "runtime/arcorbit/desktop/renderer/renderer.js",
              "runtime/arcorbit/src/platform-coordinator.mjs",
              "runtime/arcorbit/test/desktop-renderer.test.mjs",
              "runtime/arcorbit/test/platform-coordinator.test.mjs",
              "Verification: targeted platform-coordinator and desktop-renderer tests — 28 passed, 0 failed",
              "Verification: npm run check — 271 tests, 268 passed, 3 environment-gated skips, 0 failed"
            ]
          }
        ],
        "facts_superseded": [],
        "impacts_added": [],
        "impacts_updated": [
          {
            "id": "IMPACT-work-core-realization",
            "fact_id": "FACT-work-core-parity-realized",
            "fact_revision": 1,
            "target": {
              "kind": "software_invariant",
              "ref": "accepted-facts-are-realized",
              "revision": null
            },
            "effect": "threatened",
            "reason": "服务端状态筛选与计数语义已经修复，但完整详情 Review finding 仍未解决，Work 核心边界尚不能整体判定为已兑现。",
            "gap_ids": [
              "CASE-20260822-006:review-finding:complete-task-detail"
            ],
            "evidence": [
              "runtime/arcorbit/desktop/renderer/renderer.js",
              "runtime/arcorbit/src/platform-coordinator.mjs",
              "runtime/arcorbit/test/desktop-renderer.test.mjs",
              "runtime/arcorbit/test/platform-coordinator.test.mjs"
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
        "project_revision": 177,
        "judgments": [
          {
            "invariant_ref": "product-expectations-remain-recoverable",
            "disposition": "upheld",
            "reason": "稳定 Work 规格继续准确恢复服务端组合筛选、七状态计数、树补全和完整详情目标；本轮实现没有改变产品边界。",
            "fact_refs": [
              "FACT-work-core-parity-boundary-established",
              "FACT-work-status-filter-server-contract-realized"
            ],
            "evidence": [
              "arckit/spec/agentic-software-development/arcorbit-work-management.md"
            ],
            "gap_refs": []
          },
          {
            "invariant_ref": "interaction-expectations-remain-recoverable",
            "disposition": "upheld",
            "reason": "项目与状态正交筛选、服务端组合条件、命中/补全计数和树结果语义仍由稳定交互文档完整表达，并由本轮生产实现兑现状态轴部分。",
            "fact_refs": [
              "FACT-work-status-filter-server-contract-realized"
            ],
            "evidence": [
              "arckit/interaction/task-browser/interaction.md",
              "runtime/arcorbit/desktop/renderer/renderer.js"
            ],
            "gap_refs": []
          },
          {
            "invariant_ref": "visual-language-remains-consistent",
            "disposition": "not_relevant",
            "reason": "本轮只修复查询参数、计数来源和树数据投影，没有改变稳定视觉语言或样式规则。",
            "fact_refs": [],
            "evidence": [],
            "gap_refs": []
          },
          {
            "invariant_ref": "technical-decisions-remain-explainable",
            "disposition": "upheld",
            "reason": "修复保持 Workshop REST 权威边界和受限 Coordinator/Renderer 数据流；所选状态 tree 与同条件全状态计数的职责和失败降级均在实现中可直接恢复。",
            "fact_refs": [
              "FACT-work-status-filter-server-contract-realized"
            ],
            "evidence": [
              "arckit/tech/arcorbit/platform-composition-solution.md",
              "runtime/arcorbit/src/platform-coordinator.mjs",
              "runtime/arcorbit/desktop/renderer/renderer.js"
            ],
            "gap_refs": []
          },
          {
            "invariant_ref": "accepted-facts-are-realized",
            "disposition": "threatened",
            "reason": "状态筛选和计数已经兑现，但稳定边界还要求完整详情；该独立 Review finding 仍开放，因此整体 realization 仍受威胁。",
            "fact_refs": [
              "FACT-work-core-parity-boundary-established",
              "FACT-work-core-parity-realized",
              "FACT-work-status-filter-server-contract-realized"
            ],
            "evidence": [
              "runtime/arcorbit/desktop/renderer/renderer.js",
              "runtime/arcorbit/src/platform-coordinator.mjs"
            ],
            "gap_refs": [
              "CASE-20260822-006:review-finding:complete-task-detail"
            ]
          },
          {
            "invariant_ref": "material-risks-have-credible-evidence",
            "disposition": "threatened",
            "reason": "状态参数、七状态服务端计数、当前 tree 汇总和父子树保留已有可重复自动化证据；但完整详情的 Markdown、元数据和任务引用风险仍缺少实现与验证。",
            "fact_refs": [
              "FACT-work-core-parity-realized",
              "FACT-work-status-filter-server-contract-realized"
            ],
            "evidence": [
              "runtime/arcorbit/test/platform-coordinator.test.mjs",
              "runtime/arcorbit/test/desktop-renderer.test.mjs",
              "Verification: targeted platform-coordinator and desktop-renderer tests — 28 passed, 0 failed",
              "Verification: npm run check — 271 tests, 268 passed, 3 environment-gated skips, 0 failed"
            ],
            "gap_refs": [
              "CASE-20260822-006:review-finding:complete-task-detail"
            ]
          }
        ]
      },
      "evidence": [
        "runtime/arcorbit/desktop/renderer/renderer.js",
        "runtime/arcorbit/src/platform-coordinator.mjs",
        "runtime/arcorbit/test/desktop-renderer.test.mjs",
        "runtime/arcorbit/test/platform-coordinator.test.mjs",
        "arckit/spec/agentic-software-development/arcorbit-work-management.md",
        "arckit/interaction/task-browser/interaction.md",
        "Verification: targeted platform-coordinator and desktop-renderer tests — 28 passed, 0 failed",
        "Verification: npm run check — 271 tests, 268 passed, 3 environment-gated skips, 0 failed",
        "git diff --check: passed",
        "Debug diagnosis: code-path logic matched the reported behavior completely; no temporary logging was required",
        "Debug cleanup: no ARC_DEBUG:status-filter-server-contract marker or temporary log remains"
      ],
      "runtime_result_ref": "arckit-runtime://runs/RUN-20260822-211944859Z",
      "occurred_at": "2026-08-22T22:09:26.040Z"
    },
    {
      "round": 5,
      "transition_schema_version": "arckit-case-transition/v8",
      "goal": "在既有 Workshop 权威数据和 Renderer 边界内补齐安全 Markdown、详情元数据、完成时间投影与复制引用，并以定向和全量自动化证明 finding 已解决。",
      "outcome": "completed",
      "gap_selection": {
        "mode": "candidate",
        "basis": "当前 Case 唯一 ready gap 是完整详情缺失；它阻塞 realization impact 和下一次 Completion Review。四个 Project gap 均需独立 Case。",
        "snapshot_token": "f99258b9f3ebbe86c19a24b2b2cfba8d5bd6378674aa5220859961bdf6ae1046",
        "selected_ref": "case-gap:CASE-20260822-006:CASE-20260822-006:review-finding:complete-task-detail",
        "comparison_summary": "完整详情 finding 是唯一 ready 且直接阻塞当前 Case 的候选；四项 Project gaps 均为 case_required，予以延后。",
        "fresh_discovery_summary": "未发现会改变本轮范围的新前置事实；Workshop 完成时间字段确认为 completion_at，现有归一化和 Inspector 缺失与 finding 完全匹配。",
        "considered": [
          {
            "ref": "project-gap:GAP-agent-scenario-evaluation",
            "source": "persisted",
            "eligibility": "case_required",
            "disposition": "deferred",
            "priority_basis": {
              "blocking": "不阻塞当前 Work Case。",
              "uncertainty": "high",
              "risk": "high",
              "user_impact": "需独立真实场景 Case 验收。"
            },
            "reason": "Project 级隔离场景验证义务，需要另建 Case。"
          },
          {
            "ref": "project-gap:GAP-runtime-resilience-and-adapters",
            "source": "persisted",
            "eligibility": "case_required",
            "disposition": "deferred",
            "priority_basis": {
              "blocking": "不阻塞当前 Work Case。",
              "uncertainty": "medium",
              "risk": "high",
              "user_impact": "影响 Runtime 长时运行韧性。"
            },
            "reason": "独立 Runtime 范围，需要另建 Case。"
          },
          {
            "ref": "project-gap:GAP-security-real-project-validation",
            "source": "persisted",
            "eligibility": "case_required",
            "disposition": "deferred",
            "priority_basis": {
              "blocking": "不阻塞当前 Work Case 的自动化证据结论。",
              "uncertainty": "medium",
              "risk": "high",
              "user_impact": "需要真实权限资源验证。"
            },
            "reason": "独立真实权限环境验证，需要另建 Case；本轮不声称完成它。"
          },
          {
            "ref": "project-gap:GAP-cross-record-audit",
            "source": "persisted",
            "eligibility": "case_required",
            "disposition": "deferred",
            "priority_basis": {
              "blocking": "不阻塞当前实现 finding 的修复。",
              "uncertainty": "medium",
              "risk": "high",
              "user_impact": "影响跨记录长期一致性。"
            },
            "reason": "独立跨记录审计事项，需要另建 Case。"
          },
          {
            "ref": "case-gap:CASE-20260822-006:CASE-20260822-006:review-finding:complete-task-detail",
            "source": "persisted",
            "eligibility": "ready",
            "disposition": "selected",
            "priority_basis": {
              "blocking": "high",
              "uncertainty": "low",
              "risk": "high",
              "user_impact": "用户无法从 Work Inspector 恢复完整任务事实和引用。"
            },
            "reason": "当前 Case 唯一 ready gap，并直接承接受威胁的 realization impact。"
          }
        ]
      },
      "selected_gap": {
        "id": "CASE-20260822-006:review-finding:complete-task-detail",
        "responsibility": "agent",
        "goal": "Resolve review finding: Work Inspector 必须兑现稳定规格中的完整详情：受限 Markdown、创建人、标签、创建/更新/完成时间和可恢复任务引用；当前仅以转义 pre 显示正文，元数据缺项且没有复制引用，因而仍不能声称完整详情旅程已完成。",
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
          "runtime/arcorbit/desktop/renderer/renderer.js",
          "runtime/arcorbit/src/task-source-adapter.mjs",
          "runtime/arcorbit/test/desktop-renderer.test.mjs",
          "renderPlatformWorkInspector() renders task.content inside escaped <pre> and its factRows omit creator, tags and task timestamps",
          "normalizeTask() does not project a completion timestamp needed by the accepted Inspector contract",
          "Renderer contains no Work task-reference copy action",
          "desktop-renderer.test.mjs labels the journey complete but checks only structural regexes and a CSS class, not Markdown, required metadata or reference recovery",
          "arckit/spec/agentic-software-development/arcorbit-work-management.md and arckit/interaction/task-browser/interaction.md require these complete-detail behaviors"
        ]
      },
      "planned_transition": {
        "goal": "在既有 Workshop 权威数据和 Renderer 边界内补齐安全 Markdown、详情元数据、完成时间投影与复制引用，并以定向和全量自动化证明 finding 已解决。",
        "expected_state_change": "完整详情 finding resolved；新增 realization fact；IMPACT-work-core-realization 恢复 upheld；Case 进入新 content revision 的 Completion Review。"
      },
      "accepted_state_delta": {
        "resolved_gap": {
          "id": "CASE-20260822-006:review-finding:complete-task-detail",
          "status": "resolved",
          "outcome": "Work Inspector 现以不可执行原始 HTML 的受限 Markdown 展示任务内容，完整呈现创建人、执行人、父待办、状态、优先级、标签、创建/更新/完成时间，并可复制包含项目与任务身份的编码引用。",
          "reason": "Task 归一化、Renderer 呈现和独立可执行测试共同覆盖 completion_at、人员字段、标签/时间、Markdown 安全和引用恢复；完整 ArcOrbit 检查无失败。",
          "evidence": [
            "runtime/arcorbit/src/task-source-adapter.mjs",
            "runtime/arcorbit/desktop/renderer/renderer.js",
            "runtime/arcorbit/desktop/renderer/restricted-markdown.mjs",
            "runtime/arcorbit/desktop/renderer/styles.css",
            "runtime/arcorbit/test/task-source-adapter.test.mjs",
            "runtime/arcorbit/test/restricted-markdown.test.mjs",
            "runtime/arcorbit/test/desktop-renderer.test.mjs",
            "Verification: targeted task-source, restricted-markdown and desktop-renderer tests — 49 passed, 0 failed",
            "Verification: npm run check — 275 tests, 272 passed, 3 environment-gated skips, 0 failed",
            "git diff --check: passed"
          ]
        },
        "facts_added": [
          {
            "id": "FACT-work-complete-task-detail-realized",
            "revision": 1,
            "status": "accepted",
            "statement": "ArcOrbit Work Inspector 现在使用受限 Markdown 呈现完整任务内容，服务端 creator/executor、标签、创建/更新/completion_at 时间字段进入详情投影，并提供编码项目 ID 和任务 ID 的 arcorbit-work 引用；原始 HTML、脚本和不安全链接协议不能成为可执行 Renderer 标记。",
            "basis": "Workshop Task 模型核对、Task 归一化和 Inspector 生产实现，以及对安全 Markdown、完整元数据和引用编码的可执行自动化验证。",
            "evidence": [
              "/Users/Glare/Library/Developer/ModularProgram/hoewo/workshop-todo/models/task.go",
              "runtime/arcorbit/src/task-source-adapter.mjs",
              "runtime/arcorbit/desktop/renderer/renderer.js",
              "runtime/arcorbit/desktop/renderer/restricted-markdown.mjs",
              "runtime/arcorbit/test/task-source-adapter.test.mjs",
              "runtime/arcorbit/test/restricted-markdown.test.mjs",
              "runtime/arcorbit/test/desktop-renderer.test.mjs",
              "Verification: npm run check — 275 tests, 272 passed, 3 environment-gated skips, 0 failed"
            ]
          }
        ],
        "facts_superseded": [],
        "impacts_added": [],
        "impacts_updated": [
          {
            "id": "IMPACT-work-core-realization",
            "fact_id": "FACT-work-complete-task-detail-realized",
            "fact_revision": 1,
            "target": {
              "kind": "software_invariant",
              "ref": "accepted-facts-are-realized",
              "revision": null
            },
            "effect": "upheld",
            "reason": "状态筛选/计数 finding 与完整详情 finding 均已修复；Work 核心边界现由生产跨层实现和风险相称的自动化证据完整兑现。",
            "gap_ids": [],
            "evidence": [
              "FACT-work-status-filter-server-contract-realized",
              "FACT-work-complete-task-detail-realized",
              "runtime/arcorbit/src/platform-coordinator.mjs",
              "runtime/arcorbit/src/task-source-adapter.mjs",
              "runtime/arcorbit/desktop/renderer/renderer.js",
              "runtime/arcorbit/desktop/renderer/restricted-markdown.mjs",
              "runtime/arcorbit/test/platform-coordinator.test.mjs",
              "runtime/arcorbit/test/task-source-adapter.test.mjs",
              "runtime/arcorbit/test/restricted-markdown.test.mjs",
              "runtime/arcorbit/test/desktop-renderer.test.mjs",
              "Verification: npm run check — 275 tests, 272 passed, 3 environment-gated skips, 0 failed"
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
        "project_revision": 177,
        "judgments": [
          {
            "invariant_ref": "product-expectations-remain-recoverable",
            "disposition": "upheld",
            "reason": "稳定 Work 规格继续准确表达完整 Markdown 详情、时间事实和任务引用目标；本轮实现兑现该边界，没有改变产品范围。",
            "fact_refs": [
              "FACT-work-core-parity-boundary-established",
              "FACT-work-complete-task-detail-realized"
            ],
            "evidence": [
              "arckit/spec/agentic-software-development/arcorbit-work-management.md",
              "runtime/arcorbit/desktop/renderer/renderer.js"
            ],
            "gap_refs": []
          },
          {
            "invariant_ref": "interaction-expectations-remain-recoverable",
            "disposition": "upheld",
            "reason": "Inspector 的 Markdown、人员、父任务、状态、优先级、标签、三类时间和复制引用语义与稳定交互文档一致，并已在生产 Renderer 中实现。",
            "fact_refs": [
              "FACT-work-complete-task-detail-realized"
            ],
            "evidence": [
              "arckit/interaction/task-browser/interaction.md",
              "runtime/arcorbit/desktop/renderer/renderer.js",
              "runtime/arcorbit/test/desktop-renderer.test.mjs"
            ],
            "gap_refs": []
          },
          {
            "invariant_ref": "visual-language-remains-consistent",
            "disposition": "upheld",
            "reason": "Markdown 标题、列表、引用、代码与链接提示沿用现有 Desktop 颜色、边框、间距和字体 token。",
            "fact_refs": [
              "FACT-work-complete-task-detail-realized"
            ],
            "evidence": [
              "arckit/visual/_library/brief.md",
              "runtime/arcorbit/desktop/renderer/styles.css",
              "runtime/arcorbit/test/desktop-renderer.test.mjs"
            ],
            "gap_refs": []
          },
          {
            "invariant_ref": "technical-decisions-remain-explainable",
            "disposition": "upheld",
            "reason": "Workshop 仍是任务事实权威源；Task 归一化显式投影 completion_at 和人员对象，Renderer 使用独立纯函数限制 Markdown，未引入通用网络或凭据能力。",
            "fact_refs": [
              "FACT-work-complete-task-detail-realized"
            ],
            "evidence": [
              "arckit/tech/arcorbit/platform-composition-solution.md",
              "/Users/Glare/Library/Developer/ModularProgram/hoewo/workshop-todo/models/task.go",
              "runtime/arcorbit/src/task-source-adapter.mjs",
              "runtime/arcorbit/desktop/renderer/restricted-markdown.mjs"
            ],
            "gap_refs": []
          },
          {
            "invariant_ref": "accepted-facts-are-realized",
            "disposition": "upheld",
            "reason": "两个 Completion Review findings 均已通过生产实现和自动化证据解决，Work 核心筛选、树、详情和协作边界现在完整兑现。",
            "fact_refs": [
              "FACT-work-core-parity-boundary-established",
              "FACT-work-core-parity-realized",
              "FACT-work-status-filter-server-contract-realized",
              "FACT-work-complete-task-detail-realized"
            ],
            "evidence": [
              "runtime/arcorbit/src/platform-coordinator.mjs",
              "runtime/arcorbit/src/task-source-adapter.mjs",
              "runtime/arcorbit/desktop/renderer/renderer.js",
              "runtime/arcorbit/desktop/renderer/restricted-markdown.mjs",
              "Verification: npm run check — 275 tests, 272 passed, 3 environment-gated skips, 0 failed"
            ],
            "gap_refs": []
          },
          {
            "invariant_ref": "material-risks-have-credible-evidence",
            "disposition": "upheld",
            "reason": "可执行测试证明原始 HTML、脚本和不安全协议不可执行；归一化测试覆盖 completion_at 与人员字段；Renderer 测试覆盖完整详情字段和编码引用，完整回归无失败。",
            "fact_refs": [
              "FACT-work-complete-task-detail-realized"
            ],
            "evidence": [
              "runtime/arcorbit/test/restricted-markdown.test.mjs",
              "runtime/arcorbit/test/task-source-adapter.test.mjs",
              "runtime/arcorbit/test/desktop-renderer.test.mjs",
              "Verification: targeted task-source, restricted-markdown and desktop-renderer tests — 49 passed, 0 failed",
              "Verification: npm run check — 275 tests, 272 passed, 3 environment-gated skips, 0 failed",
              "git diff --check: passed"
            ],
            "gap_refs": []
          }
        ]
      },
      "evidence": [
        "arckit/spec/agentic-software-development/arcorbit-work-management.md",
        "arckit/interaction/task-browser/interaction.md",
        "arckit/tech/arcorbit/platform-composition-solution.md",
        "/Users/Glare/Library/Developer/ModularProgram/hoewo/workshop-todo/models/task.go",
        "runtime/arcorbit/src/task-source-adapter.mjs",
        "runtime/arcorbit/desktop/renderer/renderer.js",
        "runtime/arcorbit/desktop/renderer/restricted-markdown.mjs",
        "runtime/arcorbit/desktop/renderer/styles.css",
        "runtime/arcorbit/test/task-source-adapter.test.mjs",
        "runtime/arcorbit/test/restricted-markdown.test.mjs",
        "runtime/arcorbit/test/desktop-renderer.test.mjs",
        "Verification: targeted task-source, restricted-markdown and desktop-renderer tests — 49 passed, 0 failed",
        "Verification: npm run check — 275 tests, 272 passed, 3 environment-gated skips, 0 failed",
        "git diff --check: passed",
        "Debug diagnosis: code-path logic matched the reported omission completely; no temporary logging was required",
        "Debug cleanup: no ARC_DEBUG:complete-task-detail marker or temporary log remains",
        "Transition validation: passed",
        "Snapshot-bound transition dry-run: passed; projected content_revision 4 Completion Review"
      ],
      "runtime_result_ref": "arckit-runtime://runs/RUN-20260822-211944859Z",
      "occurred_at": "2026-08-22T22:18:02.444Z"
    },
    {
      "round": 6,
      "transition_schema_version": "arckit-case-transition/v8",
      "goal": "对 content revision 4 的 Work 生产实现执行五维 Completion Review，并把确认的上下文恢复、链接动作和 TaskAttachment 协作缺口记录为普通 Review findings。",
      "outcome": "completed",
      "gap_selection": {
        "mode": "candidate",
        "basis": "全部普通 Case Gap 与 state impact 已闭合，Completion Review 2 是当前唯一 ready 且直接阻塞 Case 解决的候选；四个 Project Gap 均需独立 Case。",
        "snapshot_token": "1dc98367d3f6d90ab08490f2272a05be3fb20958b21020fadb71d231c28b50db",
        "selected_ref": "case-gap:CASE-20260822-006:CASE-20260822-006:completion-review:2",
        "comparison_summary": "选择唯一 ready 的 Case Completion Review；其余四个 Project Gap 虽具有高风险或高紧迫性，但均为 case_required，不能替代对 content revision 4 的五维完成审查。",
        "fresh_discovery_summary": "审查确认状态筛选与元数据修复成立，同时发现任务引用不可恢复、任务正文安全链接不可操作、TaskAttachment 评论/附件仍是原始字段管理且缺少类型化协作动作；这些 findings 必须等待本轮提交后成为普通 Gap。",
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
            "reason": "跨场景动态 Gap 选择验证需要独立 Case，不替代当前实现的 Completion Review。"
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
              "user_impact": "中等紧迫性"
            },
            "reason": "Runtime 韧性与 adapter 接受工作需要独立 Case，且不是本 Case 完成审查的替代项。"
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
              "user_impact": "中等紧迫性"
            },
            "reason": "真实权限环境验证需要独立受控资源和 Case；本轮只审查当前 Work 实现已声称的范围。"
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
              "user_impact": "高紧迫性"
            },
            "reason": "跨记录审计必须独立建 Case，不能取代当前 Case 的实现审查门禁。"
          },
          {
            "ref": "case-gap:CASE-20260822-006:CASE-20260822-006:completion-review:2",
            "source": "persisted",
            "eligibility": "ready",
            "disposition": "selected",
            "priority_basis": {
              "blocking": "high",
              "uncertainty": "low",
              "risk": "high",
              "user_impact": "high"
            },
            "reason": "它是唯一 ready 候选，并直接决定修复后的生产实现能否可信解决用户目标并关闭 Case。"
          }
        ]
      },
      "selected_gap": {
        "id": "CASE-20260822-006:completion-review:2",
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
        "goal": "对 content revision 4 的 Work 生产实现执行五维 Completion Review，并把确认的上下文恢复、链接动作和 TaskAttachment 协作缺口记录为普通 Review findings。",
        "expected_state_change": "Completion Review 形成 findings 结论；三项 finding 自动成为下一轮普通 Gap，当前 Case 保持未解决。"
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
          "reviewed_content_revision": 4,
          "dimensions": {
            "implementation_correctness": "findings",
            "problem_resolution": "findings",
            "verification_credibility": "findings",
            "regression_risk": "findings",
            "minimality": "clean"
          },
          "findings": [
            {
              "id": "task-reference-recovery",
              "kind": "error",
              "statement": "复制任务引用目前只生成并写入 arcorbit-work URI，同时显示“可恢复”成功提示，但 ArcOrbit 没有解析该 URI、接收粘贴/打开或恢复顶部产品范围与任务选择的入口；因此引用可编码却不可恢复，与稳定详情契约和已接受 realization 事实冲突。",
              "responsibility": "agent",
              "artifact_refs": [
                "runtime/arcorbit/desktop/renderer/restricted-markdown.mjs",
                "runtime/arcorbit/desktop/renderer/renderer.js",
                "runtime/arcorbit/test/restricted-markdown.test.mjs",
                "runtime/arcorbit/test/desktop-renderer.test.mjs"
              ],
              "evidence": [
                "workTaskReference() only serializes arcorbit-work://project/<project>/task/<task>",
                "copyWorkTaskReference() only calls navigator.clipboard.writeText() and then claims the context is recoverable",
                "Repository search finds no arcorbit-work parser, protocol handler, paste/open action, or navigation restoration path outside the serializer and source-regex tests",
                "restricted-markdown.test.mjs proves exact encoding only; desktop-renderer.test.mjs proves clipboard wiring only",
                "arckit/spec/agentic-software-development/arcorbit-work-management.md and arckit/interaction/task-browser/interaction.md require opening the reference inside ArcOrbit to restore product scope and task selection"
              ]
            },
            {
              "id": "task-markdown-external-links",
              "kind": "omission",
              "statement": "受限 Markdown 将允许的 http、https 和 mailto 链接渲染为没有 href、data URL 或事件处理器的 span，Renderer 和 preload 也没有 Work 专用的受控打开动作；安全协议虽不可执行，但用户同样无法通过明确动作打开合法外部链接，完整 Markdown 详情旅程尚未兑现。",
              "responsibility": "agent",
              "artifact_refs": [
                "runtime/arcorbit/desktop/renderer/restricted-markdown.mjs",
                "runtime/arcorbit/desktop/renderer/renderer.js",
                "runtime/arcorbit/desktop/preload.cjs",
                "runtime/arcorbit/desktop/main.mjs",
                "runtime/arcorbit/test/restricted-markdown.test.mjs"
              ],
              "evidence": [
                "renderLink() returns a task-markdown-link span for safe protocols and deliberately emits no href",
                "Renderer has no task-markdown-link click listener and preload/main expose no bounded Work external-link capability",
                "Existing shell.openExternal handlers are limited to Feedback attachment capabilities and do not serve Work Markdown",
                "restricted-markdown.test.mjs asserts that href is absent but never proves an explicit safe-link action",
                "Stable Work spec and interaction document require external links to open only through an explicit user action, not to become permanently inert"
              ]
            },
            {
              "id": "task-attachment-collaboration",
              "kind": "omission",
              "statement": "TaskAttachment 时间线仍把 text、url 和 file 的 content 全部转义为普通段落，并通过通用 type/content 表单新增或修改原始值；它不会解析文本评论中的链接、图片和文件引用，不会打开 URL，也不会取得或下载文件，因此不能替代 Workshop Todo 的评论附件协作旅程。",
              "responsibility": "agent",
              "artifact_refs": [
                "runtime/arcorbit/desktop/renderer/renderer.js",
                "runtime/arcorbit/test/desktop-renderer.test.mjs",
                "/Users/Glare/Library/Developer/ModularProgram/hoewo/workshop-todo-website/frontend/src/components/features/CommentItem.tsx",
                "/Users/Glare/Library/Developer/ModularProgram/hoewo/workshop-todo-website/frontend/src/components/features/CommentEditor.tsx"
              ],
              "evidence": [
                "taskAttachmentPanel() renders every item as escapeHtml(item.content) inside a paragraph regardless of type",
                "manageTaskAttachments() exposes a generic text/file/url selector plus raw content textarea rather than a comment composer with usable link/file/image behavior",
                "There is no Work URL-open, signed-file retrieval/download, image preview, or embedded comment attachment parsing path",
                "desktop-renderer.test.mjs checks only function names, create-text wiring, permissions and retry markers; it does not execute any type-specific content journey",
                "Reference Workshop CommentItem and CommentEditor parse text imageKeys/fileKeys, open URL records, obtain file access and upload comment media",
                "Stable Work spec and interaction document require type-preserving TaskAttachment collaboration and compatibility with links, images and file references rather than a raw field manager"
              ]
            }
          ],
          "evidence": [
            "arckit/spec/agentic-software-development/arcorbit-work-management.md",
            "arckit/interaction/task-browser/interaction.md",
            "arckit/tech/arcorbit/platform-composition-solution.md",
            "runtime/arcorbit/desktop/renderer/restricted-markdown.mjs",
            "runtime/arcorbit/desktop/renderer/renderer.js",
            "runtime/arcorbit/desktop/preload.cjs",
            "runtime/arcorbit/desktop/main.mjs",
            "runtime/arcorbit/test/restricted-markdown.test.mjs",
            "runtime/arcorbit/test/desktop-renderer.test.mjs",
            "/Users/Glare/Library/Developer/ModularProgram/hoewo/workshop-todo-website/frontend/src/components/features/CommentItem.tsx",
            "/Users/Glare/Library/Developer/ModularProgram/hoewo/workshop-todo-website/frontend/src/components/features/CommentEditor.tsx",
            "Verification: npm run check — 275 tests, 272 passed, 3 environment-gated skips, 0 failed, 2026-08-23",
            "git diff --check: passed",
            "Completion Review source inspection, 2026-08-23"
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
        "project_revision": 177,
        "judgments": [
          {
            "invariant_ref": "product-expectations-remain-recoverable",
            "disposition": "upheld",
            "reason": "稳定 Work 产品规格仍准确、无歧义地表达可恢复任务引用、显式外链动作和类型化评论附件协作目标，并直接提供三项 finding 的修复口径。",
            "fact_refs": [
              "FACT-work-core-parity-boundary-established",
              "FACT-work-core-parity-realized",
              "FACT-work-complete-task-detail-realized"
            ],
            "evidence": [
              "arckit/spec/agentic-software-development/arcorbit-work-management.md"
            ],
            "gap_refs": []
          },
          {
            "invariant_ref": "interaction-expectations-remain-recoverable",
            "disposition": "upheld",
            "reason": "稳定交互文档完整保留任务引用恢复、明确外链动作、TaskAttachment 类型语义和文本评论资源兼容要求；缺口位于生产实现而非交互事实。",
            "fact_refs": [
              "FACT-work-core-parity-boundary-established",
              "FACT-work-complete-task-detail-realized"
            ],
            "evidence": [
              "arckit/interaction/task-browser/interaction.md"
            ],
            "gap_refs": []
          },
          {
            "invariant_ref": "visual-language-remains-consistent",
            "disposition": "not_relevant",
            "reason": "本轮 findings 针对上下文恢复、链接行为、附件内容语义和验证覆盖，不建立或改变稳定视觉语言规则。",
            "fact_refs": [],
            "evidence": [],
            "gap_refs": []
          },
          {
            "invariant_ref": "technical-decisions-remain-explainable",
            "disposition": "upheld",
            "reason": "Workshop 权威数据、受限 main-process 能力和 Renderer 无通用网络/凭据的技术边界仍清晰可恢复；findings 要求在该边界内补齐受控动作，而非扩大 Renderer 权限。",
            "fact_refs": [
              "FACT-work-core-parity-boundary-established",
              "FACT-work-core-parity-realized"
            ],
            "evidence": [
              "arckit/tech/arcorbit/platform-composition-solution.md"
            ],
            "gap_refs": []
          },
          {
            "invariant_ref": "accepted-facts-are-realized",
            "disposition": "threatened",
            "reason": "状态筛选、详情元数据和安全文本呈现已经实现，但已接受 facts 同时声称可恢复任务引用和完整评论附件协作；三个实际旅程仍缺失，整体 realization 尚不成立。",
            "fact_refs": [
              "FACT-work-core-parity-realized",
              "FACT-work-complete-task-detail-realized"
            ],
            "evidence": [
              "runtime/arcorbit/desktop/renderer/restricted-markdown.mjs",
              "runtime/arcorbit/desktop/renderer/renderer.js",
              "runtime/arcorbit/desktop/preload.cjs",
              "runtime/arcorbit/desktop/main.mjs"
            ],
            "gap_refs": [
              "CASE-20260822-006:review-finding:task-reference-recovery",
              "CASE-20260822-006:review-finding:task-markdown-external-links",
              "CASE-20260822-006:review-finding:task-attachment-collaboration"
            ]
          },
          {
            "invariant_ref": "material-risks-have-credible-evidence",
            "disposition": "threatened",
            "reason": "全量检查证明既有断言无回归且不安全标记不可执行，但现有测试只验证编码、结构正则和无 href；它们没有执行引用恢复、显式安全外链、URL/file 附件或评论内资源旅程，无法支撑这些风险已受控。",
            "fact_refs": [
              "FACT-work-core-parity-realized",
              "FACT-work-complete-task-detail-realized"
            ],
            "evidence": [
              "runtime/arcorbit/test/restricted-markdown.test.mjs",
              "runtime/arcorbit/test/desktop-renderer.test.mjs",
              "Verification: npm run check — 275 tests, 272 passed, 3 environment-gated skips, 0 failed, 2026-08-23"
            ],
            "gap_refs": [
              "CASE-20260822-006:review-finding:task-reference-recovery",
              "CASE-20260822-006:review-finding:task-markdown-external-links",
              "CASE-20260822-006:review-finding:task-attachment-collaboration"
            ]
          }
        ]
      },
      "evidence": [
        "arckit/spec/agentic-software-development/arcorbit-work-management.md",
        "arckit/interaction/task-browser/interaction.md",
        "arckit/tech/arcorbit/platform-composition-solution.md",
        "runtime/arcorbit/desktop/renderer/restricted-markdown.mjs",
        "runtime/arcorbit/desktop/renderer/renderer.js",
        "runtime/arcorbit/desktop/preload.cjs",
        "runtime/arcorbit/desktop/main.mjs",
        "runtime/arcorbit/test/restricted-markdown.test.mjs",
        "runtime/arcorbit/test/desktop-renderer.test.mjs",
        "/Users/Glare/Library/Developer/ModularProgram/hoewo/workshop-todo-website/frontend/src/components/features/CommentItem.tsx",
        "/Users/Glare/Library/Developer/ModularProgram/hoewo/workshop-todo-website/frontend/src/components/features/CommentEditor.tsx",
        "Verification: npm run check — 275 tests, 272 passed, 3 environment-gated skips, 0 failed, 2026-08-23",
        "git diff --check: passed",
        "Completion Review source inspection, 2026-08-23"
      ],
      "runtime_result_ref": "arckit-runtime://runs/RUN-20260822-211944859Z",
      "occurred_at": "2026-08-22T22:26:48.524Z"
    },
    {
      "round": 7,
      "transition_schema_version": "arckit-case-transition/v8",
      "goal": "Add a bounded in-app task-reference opening path that parses canonical references, validates active-Workset task visibility, restores Work product/state/task context, and fails without retaining partial context.",
      "outcome": "completed",
      "gap_selection": {
        "mode": "candidate",
        "basis": "Fresh snapshot comparison of every persisted candidate in scope; the selected Case finding is ready, agent-owned, blocking, and the only error that currently presents a false recoverability success claim.",
        "snapshot_token": "2afed1f6540a22538e80a5e9b471b8cfa987945fab2018b7e44dd97ba17ad94e",
        "selected_ref": "case-gap:CASE-20260822-006:CASE-20260822-006:review-finding:task-reference-recovery",
        "comparison_summary": "The three ready Case findings are all blocking/high-risk. Task-reference recovery was selected because it is the sole error, directly misleads users with a recoverability claim, and can be repaired and verified independently. External Markdown links and TaskAttachment collaboration remain separate omissions. The four Project gaps require their own Cases and cannot advance this active Case transition.",
        "fresh_discovery_summary": "Fresh source inspection confirmed the persisted task-reference finding and found no independent fresh gap that should outrank it; newly discovered downstream work was not preplanned.",
        "considered": [
          {
            "ref": "project-gap:GAP-agent-scenario-evaluation",
            "source": "persisted",
            "eligibility": "case_required",
            "disposition": "deferred",
            "priority_basis": {
              "blocking": "not blocking this Case",
              "uncertainty": "high",
              "risk": "high",
              "user_impact": "project-wide validation"
            },
            "reason": "Requires a separate Case and does not resolve an open Work review finding."
          },
          {
            "ref": "project-gap:GAP-runtime-resilience-and-adapters",
            "source": "persisted",
            "eligibility": "case_required",
            "disposition": "deferred",
            "priority_basis": {
              "blocking": "not blocking this Case",
              "uncertainty": "medium",
              "risk": "high",
              "user_impact": "long-running runtime reliability"
            },
            "reason": "Requires a separate Case and is outside the current Work task-detail scope."
          },
          {
            "ref": "project-gap:GAP-security-real-project-validation",
            "source": "persisted",
            "eligibility": "case_required",
            "disposition": "deferred",
            "priority_basis": {
              "blocking": "not blocking this Case",
              "uncertainty": "medium",
              "risk": "high",
              "user_impact": "permission-bearing deployments"
            },
            "reason": "Requires a separate real-project validation Case."
          },
          {
            "ref": "project-gap:GAP-cross-record-audit",
            "source": "persisted",
            "eligibility": "case_required",
            "disposition": "deferred",
            "priority_basis": {
              "blocking": "not blocking this Case",
              "uncertainty": "medium",
              "risk": "high",
              "user_impact": "ledger consistency"
            },
            "reason": "Despite high urgency, it requires a separate Case and cannot replace the ready finding in the active Case."
          },
          {
            "ref": "case-gap:CASE-20260822-006:CASE-20260822-006:review-finding:task-reference-recovery",
            "source": "persisted",
            "eligibility": "ready",
            "disposition": "selected",
            "priority_basis": {
              "blocking": "high",
              "uncertainty": "low",
              "risk": "high",
              "user_impact": "users cannot recover copied task context"
            },
            "reason": "The current UI asserts recoverability without any opening path; this is a user-visible correctness error and the smallest independently verifiable ready repair."
          },
          {
            "ref": "case-gap:CASE-20260822-006:CASE-20260822-006:review-finding:task-markdown-external-links",
            "source": "persisted",
            "eligibility": "ready",
            "disposition": "deferred",
            "priority_basis": {
              "blocking": "high",
              "uncertainty": "low",
              "risk": "high",
              "user_impact": "safe links remain inert"
            },
            "reason": "A separate omission with its own bounded main-process action and security evidence; one-gap contract defers it."
          },
          {
            "ref": "case-gap:CASE-20260822-006:CASE-20260822-006:review-finding:task-attachment-collaboration",
            "source": "persisted",
            "eligibility": "ready",
            "disposition": "deferred",
            "priority_basis": {
              "blocking": "high",
              "uncertainty": "medium",
              "risk": "high",
              "user_impact": "comment attachment journeys remain incomplete"
            },
            "reason": "A broader independent omission spanning typed content, file access, and media behavior; one-gap contract defers it."
          }
        ]
      },
      "selected_gap": {
        "id": "CASE-20260822-006:review-finding:task-reference-recovery",
        "responsibility": "agent",
        "goal": "Resolve review finding: 复制任务引用目前只生成并写入 arcorbit-work URI，同时显示“可恢复”成功提示，但 ArcOrbit 没有解析该 URI、接收粘贴/打开或恢复顶部产品范围与任务选择的入口；因此引用可编码却不可恢复，与稳定详情契约和已接受 realization 事实冲突。",
        "reason": "error found by completion review",
        "derived_from": [
          "completion_review",
          "content_revision:4"
        ],
        "blocked_by": [],
        "priority_basis": {
          "blocking": "high",
          "uncertainty": "",
          "risk": "high",
          "user_impact": ""
        },
        "evidence_required": [
          "runtime/arcorbit/desktop/renderer/restricted-markdown.mjs",
          "runtime/arcorbit/desktop/renderer/renderer.js",
          "runtime/arcorbit/test/restricted-markdown.test.mjs",
          "runtime/arcorbit/test/desktop-renderer.test.mjs",
          "workTaskReference() only serializes arcorbit-work://project/<project>/task/<task>",
          "copyWorkTaskReference() only calls navigator.clipboard.writeText() and then claims the context is recoverable",
          "Repository search finds no arcorbit-work parser, protocol handler, paste/open action, or navigation restoration path outside the serializer and source-regex tests",
          "restricted-markdown.test.mjs proves exact encoding only; desktop-renderer.test.mjs proves clipboard wiring only",
          "arckit/spec/agentic-software-development/arcorbit-work-management.md and arckit/interaction/task-browser/interaction.md require opening the reference inside ArcOrbit to restore product scope and task selection"
        ]
      },
      "planned_transition": {
        "goal": "Add a bounded in-app task-reference opening path that parses canonical references, validates active-Workset task visibility, restores Work product/state/task context, and fails without retaining partial context.",
        "expected_state_change": "Resolve only the task-reference-recovery review finding with production implementation and executable evidence; leave external-link and TaskAttachment findings open."
      },
      "accepted_state_delta": {
        "resolved_gap": {
          "id": "CASE-20260822-006:review-finding:task-reference-recovery",
          "status": "resolved",
          "outcome": "ArcOrbit Work now accepts a pasted canonical arcorbit-work reference, verifies the referenced project belongs to the active Workset and the task is visible to the current account, then restores the Work page, product scope, task state/date query, and task selection.",
          "reason": "A canonical parser/resolver, pure selection projection, visible Work action, fail-closed lookup and rollback path are implemented and covered by executable targeted tests plus the complete ArcOrbit regression suite.",
          "evidence": [
            "runtime/arcorbit/desktop/renderer/restricted-markdown.mjs",
            "runtime/arcorbit/desktop/renderer/index.html",
            "runtime/arcorbit/desktop/renderer/renderer.js",
            "runtime/arcorbit/test/restricted-markdown.test.mjs",
            "runtime/arcorbit/test/desktop-renderer.test.mjs",
            "Verification: targeted restricted-markdown and desktop-renderer tests — 24 passed, 0 failed",
            "Verification: npm run check — 276 tests, 273 passed, 3 environment-gated skips, 0 failed",
            "git diff --check: passed",
            "Debug cleanup: no ARC_DEBUG:task-reference-recovery marker or temporary console logging remains"
          ]
        },
        "facts_added": [
          {
            "id": "FACT-work-task-reference-recovery-realized",
            "revision": 1,
            "status": "accepted",
            "statement": "ArcOrbit Work 现在可在应用内打开规范的 arcorbit-work 任务引用；它先确认引用产品属于当前 Workset、目标任务对当前账户可见且状态有效，再恢复 Work 页面、产品范围、任务状态/日期查询和任务选择；无效、跨 Workset、不可见或刷新后丢失的目标会失败关闭且不保留部分切换上下文。",
            "basis": "受限引用解析/可见性解析、纯上下文投影、Renderer 打开入口与回滚实现，以及规范编码、跨 Workset、缺失任务、无效状态和上下文恢复的可执行自动化验证。",
            "evidence": [
              "runtime/arcorbit/desktop/renderer/restricted-markdown.mjs",
              "runtime/arcorbit/desktop/renderer/index.html",
              "runtime/arcorbit/desktop/renderer/renderer.js",
              "runtime/arcorbit/test/restricted-markdown.test.mjs",
              "runtime/arcorbit/test/desktop-renderer.test.mjs",
              "Verification: targeted restricted-markdown and desktop-renderer tests — 24 passed, 0 failed",
              "Verification: npm run check — 276 tests, 273 passed, 3 environment-gated skips, 0 failed"
            ]
          }
        ],
        "facts_superseded": [],
        "impacts_added": [],
        "impacts_updated": [
          {
            "id": "IMPACT-work-core-realization",
            "fact_id": "FACT-work-task-reference-recovery-realized",
            "fact_revision": 1,
            "target": {
              "kind": "software_invariant",
              "ref": "accepted-facts-are-realized",
              "revision": null
            },
            "effect": "threatened",
            "reason": "任务引用恢复现已兑现，但合法 Markdown 外链和类型化 TaskAttachment 协作仍有独立开放 findings，因此尚不能恢复 Work 核心范围已完整实现的整体主张。",
            "gap_ids": [
              "CASE-20260822-006:review-finding:task-markdown-external-links",
              "CASE-20260822-006:review-finding:task-attachment-collaboration"
            ],
            "evidence": [
              "runtime/arcorbit/desktop/renderer/restricted-markdown.mjs",
              "runtime/arcorbit/desktop/renderer/renderer.js",
              "runtime/arcorbit/test/restricted-markdown.test.mjs",
              "runtime/arcorbit/test/desktop-renderer.test.mjs",
              "Verification: npm run check — 276 tests, 273 passed, 3 environment-gated skips, 0 failed"
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
        "project_revision": 177,
        "judgments": [
          {
            "invariant_ref": "product-expectations-remain-recoverable",
            "disposition": "upheld",
            "reason": "稳定 Work 规格仍准确表达引用在 ArcOrbit 内恢复同一产品和任务上下文的产品目标；本轮实现兑现该目标且未改变范围。",
            "fact_refs": [
              "FACT-work-core-parity-boundary-established",
              "FACT-work-task-reference-recovery-realized"
            ],
            "evidence": [
              "arckit/spec/agentic-software-development/arcorbit-work-management.md",
              "runtime/arcorbit/desktop/renderer/renderer.js"
            ],
            "gap_refs": []
          },
          {
            "invariant_ref": "interaction-expectations-remain-recoverable",
            "disposition": "upheld",
            "reason": "Work 页面新增明确的打开引用动作，并以可见性校验、产品/状态/任务恢复和失败回滚实现稳定交互语义。",
            "fact_refs": [
              "FACT-work-task-reference-recovery-realized"
            ],
            "evidence": [
              "arckit/interaction/task-browser/interaction.md",
              "runtime/arcorbit/desktop/renderer/index.html",
              "runtime/arcorbit/desktop/renderer/renderer.js",
              "runtime/arcorbit/test/desktop-renderer.test.mjs"
            ],
            "gap_refs": []
          },
          {
            "invariant_ref": "visual-language-remains-consistent",
            "disposition": "upheld",
            "reason": "打开任务引用复用现有 Work heading-actions 和 secondary-button 视觉构件，没有建立新的视觉 token 或样式例外。",
            "fact_refs": [
              "FACT-work-task-reference-recovery-realized"
            ],
            "evidence": [
              "arckit/visual/_library/brief.md",
              "runtime/arcorbit/desktop/renderer/index.html",
              "runtime/arcorbit/desktop/renderer/styles.css"
            ],
            "gap_refs": []
          },
          {
            "invariant_ref": "technical-decisions-remain-explainable",
            "disposition": "upheld",
            "reason": "引用解析和状态投影是 Renderer 侧纯函数，任务身份与可见性通过既有受限 platformSnapshot 能力确认；未增加 OS 协议注册、通用网络、凭据或 Renderer 权限。",
            "fact_refs": [
              "FACT-work-task-reference-recovery-realized"
            ],
            "evidence": [
              "arckit/tech/arcorbit/platform-composition-solution.md",
              "runtime/arcorbit/desktop/renderer/restricted-markdown.mjs",
              "runtime/arcorbit/desktop/renderer/renderer.js"
            ],
            "gap_refs": []
          },
          {
            "invariant_ref": "accepted-facts-are-realized",
            "disposition": "threatened",
            "reason": "任务引用恢复已经由生产实现兑现，但合法 Markdown 外链仍不可打开，TaskAttachment 类型化协作仍不完整，因此整体 Work 核心 realization 仍受威胁。",
            "fact_refs": [
              "FACT-work-core-parity-realized",
              "FACT-work-complete-task-detail-realized",
              "FACT-work-task-reference-recovery-realized"
            ],
            "evidence": [
              "runtime/arcorbit/desktop/renderer/restricted-markdown.mjs",
              "runtime/arcorbit/desktop/renderer/renderer.js"
            ],
            "gap_refs": [
              "CASE-20260822-006:review-finding:task-markdown-external-links",
              "CASE-20260822-006:review-finding:task-attachment-collaboration"
            ]
          },
          {
            "invariant_ref": "material-risks-have-credible-evidence",
            "disposition": "threatened",
            "reason": "规范引用、可见性限制、上下文投影和全量回归已有可重复证据；合法外链动作和 URL/file/评论内资源旅程仍缺少实现与验证。",
            "fact_refs": [
              "FACT-work-core-parity-realized",
              "FACT-work-complete-task-detail-realized",
              "FACT-work-task-reference-recovery-realized"
            ],
            "evidence": [
              "runtime/arcorbit/test/restricted-markdown.test.mjs",
              "runtime/arcorbit/test/desktop-renderer.test.mjs",
              "Verification: targeted restricted-markdown and desktop-renderer tests — 24 passed, 0 failed",
              "Verification: npm run check — 276 tests, 273 passed, 3 environment-gated skips, 0 failed",
              "git diff --check: passed"
            ],
            "gap_refs": [
              "CASE-20260822-006:review-finding:task-markdown-external-links",
              "CASE-20260822-006:review-finding:task-attachment-collaboration"
            ]
          }
        ]
      },
      "evidence": [
        "arckit/spec/agentic-software-development/arcorbit-work-management.md",
        "arckit/interaction/task-browser/interaction.md",
        "runtime/arcorbit/desktop/renderer/restricted-markdown.mjs",
        "runtime/arcorbit/desktop/renderer/index.html",
        "runtime/arcorbit/desktop/renderer/renderer.js",
        "runtime/arcorbit/test/restricted-markdown.test.mjs",
        "runtime/arcorbit/test/desktop-renderer.test.mjs",
        "Verification: targeted restricted-markdown and desktop-renderer tests — 24 passed, 0 failed",
        "Verification: npm run check — 276 tests, 273 passed, 3 environment-gated skips, 0 failed",
        "git diff --check: passed",
        "Debug diagnosis: the code path matched the persisted finding; no temporary logging was required",
        "Debug cleanup: no ARC_DEBUG:task-reference-recovery marker or temporary console logging remains",
        "Transition validation: passed",
        "Snapshot-bound transition dry-run: passed; projected content_revision 5 with task-reference recovery resolved"
      ],
      "runtime_result_ref": "arckit-runtime://runs/RUN-20260822-211944859Z",
      "occurred_at": "2026-08-22T22:37:01.124Z"
    },
    {
      "round": 8,
      "transition_schema_version": "arckit-case-transition/v8",
      "goal": "Render allowed Work Markdown links as explicit inert-by-default buttons and open them only through a Work-specific, main-window-bound, protocol-validating main-process capability.",
      "outcome": "completed",
      "gap_selection": {
        "mode": "candidate",
        "basis": "Fresh snapshot comparison of all persisted candidates selected the bounded Markdown external-link omission: it is ready, agent-owned, blocking/high-risk, lower uncertainty, and independently verifiable without consuming TaskAttachment collaboration work.",
        "snapshot_token": "0556df27d42be5acb9d795f751ce5158a1e51601a2b40cc7319202b160617b03",
        "selected_ref": "case-gap:CASE-20260822-006:CASE-20260822-006:review-finding:task-markdown-external-links",
        "comparison_summary": "Both Case findings are ready and blocking/high-risk. Markdown external links were selected because their required result is narrower and already bounded by the accepted explicit-user-action/main-process architecture; TaskAttachment collaboration spans typed records, remote file access and comment resources and remains deferred. All four Project gaps require separate Cases.",
        "fresh_discovery_summary": "Fresh inspection confirmed the persisted external-link omission and the existing bounded shell.openExternal architecture; no independent fresh candidate was discovered that outranked the persisted ready finding.",
        "considered": [
          {
            "ref": "project-gap:GAP-agent-scenario-evaluation",
            "source": "persisted",
            "eligibility": "case_required",
            "disposition": "deferred",
            "priority_basis": {
              "blocking": "not blocking this Case",
              "uncertainty": "high",
              "risk": "high",
              "user_impact": "project-wide validation"
            },
            "reason": "Requires a separate Case and does not resolve the active Work findings."
          },
          {
            "ref": "project-gap:GAP-runtime-resilience-and-adapters",
            "source": "persisted",
            "eligibility": "case_required",
            "disposition": "deferred",
            "priority_basis": {
              "blocking": "not blocking this Case",
              "uncertainty": "medium",
              "risk": "high",
              "user_impact": "long-running runtime reliability"
            },
            "reason": "Requires a separate Case and is outside the current Work Markdown boundary."
          },
          {
            "ref": "project-gap:GAP-security-real-project-validation",
            "source": "persisted",
            "eligibility": "case_required",
            "disposition": "deferred",
            "priority_basis": {
              "blocking": "not blocking this Case",
              "uncertainty": "medium",
              "risk": "high",
              "user_impact": "permission-bearing deployments"
            },
            "reason": "Requires its own real-project validation Case."
          },
          {
            "ref": "project-gap:GAP-cross-record-audit",
            "source": "persisted",
            "eligibility": "case_required",
            "disposition": "deferred",
            "priority_basis": {
              "blocking": "not blocking this Case",
              "uncertainty": "medium",
              "risk": "high",
              "user_impact": "ledger consistency"
            },
            "reason": "High urgency does not make this separate-Case obligation eligible inside the active Work Case."
          },
          {
            "ref": "case-gap:CASE-20260822-006:CASE-20260822-006:review-finding:task-markdown-external-links",
            "source": "persisted",
            "eligibility": "ready",
            "disposition": "selected",
            "priority_basis": {
              "blocking": "high",
              "uncertainty": "low",
              "risk": "high",
              "user_impact": "legitimate task links are unusable"
            },
            "reason": "The accepted interaction is explicit and the bounded IPC architecture already exists; this is the smallest independently testable remaining Work omission."
          },
          {
            "ref": "case-gap:CASE-20260822-006:CASE-20260822-006:review-finding:task-attachment-collaboration",
            "source": "persisted",
            "eligibility": "ready",
            "disposition": "deferred",
            "priority_basis": {
              "blocking": "high",
              "uncertainty": "medium",
              "risk": "high",
              "user_impact": "comment and attachment journeys remain incomplete"
            },
            "reason": "This broader typed-content and remote-resource omission remains independent under the one-gap contract."
          }
        ]
      },
      "selected_gap": {
        "id": "CASE-20260822-006:review-finding:task-markdown-external-links",
        "responsibility": "agent",
        "goal": "Resolve review finding: 受限 Markdown 将允许的 http、https 和 mailto 链接渲染为没有 href、data URL 或事件处理器的 span，Renderer 和 preload 也没有 Work 专用的受控打开动作；安全协议虽不可执行，但用户同样无法通过明确动作打开合法外部链接，完整 Markdown 详情旅程尚未兑现。",
        "reason": "omission found by completion review",
        "derived_from": [
          "completion_review",
          "content_revision:4"
        ],
        "blocked_by": [],
        "priority_basis": {
          "blocking": "high",
          "uncertainty": "",
          "risk": "high",
          "user_impact": ""
        },
        "evidence_required": [
          "runtime/arcorbit/desktop/renderer/restricted-markdown.mjs",
          "runtime/arcorbit/desktop/renderer/renderer.js",
          "runtime/arcorbit/desktop/preload.cjs",
          "runtime/arcorbit/desktop/main.mjs",
          "runtime/arcorbit/test/restricted-markdown.test.mjs",
          "renderLink() returns a task-markdown-link span for safe protocols and deliberately emits no href",
          "Renderer has no task-markdown-link click listener and preload/main expose no bounded Work external-link capability",
          "Existing shell.openExternal handlers are limited to Feedback attachment capabilities and do not serve Work Markdown",
          "restricted-markdown.test.mjs asserts that href is absent but never proves an explicit safe-link action",
          "Stable Work spec and interaction document require external links to open only through an explicit user action, not to become permanently inert"
        ]
      },
      "planned_transition": {
        "goal": "Render allowed Work Markdown links as explicit inert-by-default buttons and open them only through a Work-specific, main-window-bound, protocol-validating main-process capability.",
        "expected_state_change": "Resolve only the Markdown external-link finding with executable allowlist and regression evidence; keep TaskAttachment collaboration open."
      },
      "accepted_state_delta": {
        "resolved_gap": {
          "id": "CASE-20260822-006:review-finding:task-markdown-external-links",
          "status": "resolved",
          "outcome": "Allowed http, https and mailto Markdown links now render as explicit buttons without href and open only after a user click through Work-specific preload IPC; the main process verifies the invoking window and revalidates the protocol, credentials, host/mail target and size before calling shell.openExternal.",
          "reason": "Renderer presentation, typed preload exposure, main-process enforcement and a shared pure URL policy are implemented; executable tests cover accepted protocols and reject javascript, data, file, credential-bearing, empty, malformed and oversized values, with complete regression passing.",
          "evidence": [
            "runtime/arcorbit/src/work-external-link.mjs",
            "runtime/arcorbit/desktop/main.mjs",
            "runtime/arcorbit/desktop/preload.cjs",
            "runtime/arcorbit/desktop/renderer/restricted-markdown.mjs",
            "runtime/arcorbit/desktop/renderer/renderer.js",
            "runtime/arcorbit/desktop/renderer/styles.css",
            "runtime/arcorbit/test/work-external-link.test.mjs",
            "runtime/arcorbit/test/restricted-markdown.test.mjs",
            "runtime/arcorbit/test/desktop-renderer.test.mjs",
            "Verification: targeted work-external-link, restricted-markdown and desktop-renderer tests — 26 passed, 0 failed",
            "Verification: npm run check — 278 tests, 275 passed, 3 environment-gated skips, 0 failed",
            "git diff --check: passed",
            "Debug cleanup: no ARC_DEBUG:task-markdown-external-links marker remains"
          ]
        },
        "facts_added": [
          {
            "id": "FACT-work-markdown-external-links-realized",
            "revision": 1,
            "status": "accepted",
            "statement": "ArcOrbit Work 的受限 Markdown 现在把合法 http、https 和 mailto 链接呈现为无 href 的显式按钮；只有用户点击后才经 Work 专用 preload IPC 交由主进程打开，主进程重新校验调用窗口、协议、凭据、主机或邮件目标及长度；javascript、data、file、含凭据、空目标、无效或超长地址保持不可执行。",
            "basis": "共享纯 URL 策略、受限 Markdown 呈现、Renderer 显式事件、typed preload/main IPC 与 shell.openExternal 边界，以及允许/拒绝协议和跨层接线的自动化验证。",
            "evidence": [
              "runtime/arcorbit/src/work-external-link.mjs",
              "runtime/arcorbit/desktop/main.mjs",
              "runtime/arcorbit/desktop/preload.cjs",
              "runtime/arcorbit/desktop/renderer/restricted-markdown.mjs",
              "runtime/arcorbit/desktop/renderer/renderer.js",
              "runtime/arcorbit/test/work-external-link.test.mjs",
              "runtime/arcorbit/test/restricted-markdown.test.mjs",
              "runtime/arcorbit/test/desktop-renderer.test.mjs",
              "Verification: targeted work-external-link, restricted-markdown and desktop-renderer tests — 26 passed, 0 failed",
              "Verification: npm run check — 278 tests, 275 passed, 3 environment-gated skips, 0 failed"
            ]
          }
        ],
        "facts_superseded": [],
        "impacts_added": [],
        "impacts_updated": [
          {
            "id": "IMPACT-work-core-realization",
            "fact_id": "FACT-work-markdown-external-links-realized",
            "fact_revision": 1,
            "target": {
              "kind": "software_invariant",
              "ref": "accepted-facts-are-realized",
              "revision": null
            },
            "effect": "threatened",
            "reason": "任务引用恢复与合法 Markdown 外链现已兑现，但类型化 TaskAttachment 评论附件协作仍有一个独立开放 finding，因此 Work 核心整体 realization 尚未完全恢复。",
            "gap_ids": [
              "CASE-20260822-006:review-finding:task-attachment-collaboration"
            ],
            "evidence": [
              "runtime/arcorbit/src/work-external-link.mjs",
              "runtime/arcorbit/desktop/main.mjs",
              "runtime/arcorbit/desktop/renderer/restricted-markdown.mjs",
              "runtime/arcorbit/desktop/renderer/renderer.js",
              "runtime/arcorbit/test/work-external-link.test.mjs",
              "runtime/arcorbit/test/restricted-markdown.test.mjs",
              "runtime/arcorbit/test/desktop-renderer.test.mjs",
              "Verification: npm run check — 278 tests, 275 passed, 3 environment-gated skips, 0 failed"
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
        "project_revision": 177,
        "judgments": [
          {
            "invariant_ref": "product-expectations-remain-recoverable",
            "disposition": "upheld",
            "reason": "稳定 Work 规格继续明确合法外部链接只能由用户显式动作打开；本轮实现兑现该目标而未扩大产品范围。",
            "fact_refs": [
              "FACT-work-core-parity-boundary-established",
              "FACT-work-markdown-external-links-realized"
            ],
            "evidence": [
              "arckit/spec/agentic-software-development/arcorbit-work-management.md",
              "runtime/arcorbit/desktop/renderer/restricted-markdown.mjs"
            ],
            "gap_refs": []
          },
          {
            "invariant_ref": "interaction-expectations-remain-recoverable",
            "disposition": "upheld",
            "reason": "合法链接以明确可点击按钮呈现，点击才触发系统打开；无效或不安全链接继续作为惰性文本显示，符合稳定交互语义。",
            "fact_refs": [
              "FACT-work-markdown-external-links-realized"
            ],
            "evidence": [
              "arckit/interaction/task-browser/interaction.md",
              "runtime/arcorbit/desktop/renderer/restricted-markdown.mjs",
              "runtime/arcorbit/desktop/renderer/renderer.js",
              "runtime/arcorbit/test/restricted-markdown.test.mjs"
            ],
            "gap_refs": []
          },
          {
            "invariant_ref": "visual-language-remains-consistent",
            "disposition": "upheld",
            "reason": "外链按钮复用既有 violet 链接色、字体和下划线语言，并只增加透明按钮重置与指针反馈。",
            "fact_refs": [
              "FACT-work-markdown-external-links-realized"
            ],
            "evidence": [
              "arckit/visual/_library/brief.md",
              "runtime/arcorbit/desktop/renderer/styles.css",
              "runtime/arcorbit/test/desktop-renderer.test.mjs"
            ],
            "gap_refs": []
          },
          {
            "invariant_ref": "technical-decisions-remain-explainable",
            "disposition": "upheld",
            "reason": "Renderer 无 href、无通用网络能力；Work 专用 IPC 在主进程绑定主窗口并以共享 allowlist 重新验证后才调用 shell.openExternal，保持受限 Desktop 边界。",
            "fact_refs": [
              "FACT-work-markdown-external-links-realized"
            ],
            "evidence": [
              "arckit/tech/arcorbit/platform-composition-solution.md",
              "runtime/arcorbit/src/work-external-link.mjs",
              "runtime/arcorbit/desktop/main.mjs",
              "runtime/arcorbit/desktop/preload.cjs"
            ],
            "gap_refs": []
          },
          {
            "invariant_ref": "accepted-facts-are-realized",
            "disposition": "threatened",
            "reason": "任务引用恢复和合法 Markdown 外链已经兑现，但已接受的 Work 核心范围仍要求完整 TaskAttachment 评论附件协作，该唯一剩余 finding 尚未解决。",
            "fact_refs": [
              "FACT-work-core-parity-realized",
              "FACT-work-complete-task-detail-realized",
              "FACT-work-task-reference-recovery-realized",
              "FACT-work-markdown-external-links-realized"
            ],
            "evidence": [
              "runtime/arcorbit/desktop/renderer/restricted-markdown.mjs",
              "runtime/arcorbit/desktop/renderer/renderer.js",
              "runtime/arcorbit/desktop/main.mjs"
            ],
            "gap_refs": [
              "CASE-20260822-006:review-finding:task-attachment-collaboration"
            ]
          },
          {
            "invariant_ref": "material-risks-have-credible-evidence",
            "disposition": "threatened",
            "reason": "允许协议、拒绝协议、主进程边界、显式动作和全量回归均有可重复证据；URL/file/图片及评论内资源的 TaskAttachment 旅程仍缺少实现和验证。",
            "fact_refs": [
              "FACT-work-core-parity-realized",
              "FACT-work-complete-task-detail-realized",
              "FACT-work-markdown-external-links-realized"
            ],
            "evidence": [
              "runtime/arcorbit/test/work-external-link.test.mjs",
              "runtime/arcorbit/test/restricted-markdown.test.mjs",
              "runtime/arcorbit/test/desktop-renderer.test.mjs",
              "Verification: targeted work-external-link, restricted-markdown and desktop-renderer tests — 26 passed, 0 failed",
              "Verification: npm run check — 278 tests, 275 passed, 3 environment-gated skips, 0 failed",
              "git diff --check: passed"
            ],
            "gap_refs": [
              "CASE-20260822-006:review-finding:task-attachment-collaboration"
            ]
          }
        ]
      },
      "evidence": [
        "arckit/spec/agentic-software-development/arcorbit-work-management.md",
        "arckit/interaction/task-browser/interaction.md",
        "arckit/tech/arcorbit/platform-composition-solution.md",
        "runtime/arcorbit/src/work-external-link.mjs",
        "runtime/arcorbit/desktop/main.mjs",
        "runtime/arcorbit/desktop/preload.cjs",
        "runtime/arcorbit/desktop/renderer/restricted-markdown.mjs",
        "runtime/arcorbit/desktop/renderer/renderer.js",
        "runtime/arcorbit/desktop/renderer/styles.css",
        "runtime/arcorbit/test/work-external-link.test.mjs",
        "runtime/arcorbit/test/restricted-markdown.test.mjs",
        "runtime/arcorbit/test/desktop-renderer.test.mjs",
        "Verification: targeted work-external-link, restricted-markdown and desktop-renderer tests — 26 passed, 0 failed",
        "Verification: npm run check — 278 tests, 275 passed, 3 environment-gated skips, 0 failed",
        "git diff --check: passed",
        "Debug diagnosis: the persisted source path matched the finding; no temporary logging was required",
        "Debug cleanup: no ARC_DEBUG:task-markdown-external-links marker remains"
      ],
      "runtime_result_ref": "arckit-runtime://runs/RUN-20260822-211944859Z",
      "occurred_at": "2026-08-22T22:42:53.816Z"
    },
    {
      "round": 9,
      "transition_schema_version": "arckit-case-transition/v8",
      "goal": "Implement and verify type-preserving TaskAttachment collaboration for text, URL, image and file journeys through bounded Adapter, Coordinator, main-process IPC and Renderer capabilities.",
      "outcome": "completed",
      "gap_selection": {
        "mode": "candidate",
        "basis": "Fresh snapshot comparison selected the only ready Case gap: TaskAttachment collaboration is agent-owned, blocking/high-risk, directly prevents restoration of the Work core-realization impact, and can be resolved with bounded cross-layer implementation and executable evidence. All Project gaps require separate Cases.",
        "snapshot_token": "05f4f313e55e8ddb3360fb0201343487987e98b17742c56d1e322a035c1d1e33",
        "selected_ref": "case-gap:CASE-20260822-006:CASE-20260822-006:review-finding:task-attachment-collaboration",
        "comparison_summary": "TaskAttachment collaboration is the sole ready dynamic gap and the last ordinary implementation finding in this Case. The four Project gaps remain case-required and cannot advance this active Work Case, so the ready Case gap outranks them on blocking effect and immediate user impact.",
        "fresh_discovery_summary": "Fresh source inspection confirmed the persisted type-erasure, raw-field composer and missing resource journeys, then identified no independent fresh gap that should displace the persisted final Work finding.",
        "considered": [
          {
            "ref": "project-gap:GAP-agent-scenario-evaluation",
            "source": "persisted",
            "eligibility": "case_required",
            "disposition": "deferred",
            "priority_basis": {
              "blocking": "not blocking this Case",
              "uncertainty": "high",
              "risk": "high",
              "user_impact": "project-wide validation"
            },
            "reason": "It requires a separate Case and does not resolve the active Work realization finding."
          },
          {
            "ref": "project-gap:GAP-runtime-resilience-and-adapters",
            "source": "persisted",
            "eligibility": "case_required",
            "disposition": "deferred",
            "priority_basis": {
              "blocking": "not blocking this Case",
              "uncertainty": "medium",
              "risk": "high",
              "user_impact": "long-running runtime reliability"
            },
            "reason": "It requires a separate Case and is outside the selected Work collaboration boundary."
          },
          {
            "ref": "project-gap:GAP-security-real-project-validation",
            "source": "persisted",
            "eligibility": "case_required",
            "disposition": "deferred",
            "priority_basis": {
              "blocking": "not blocking this Case",
              "uncertainty": "medium",
              "risk": "high",
              "user_impact": "permission-bearing deployments"
            },
            "reason": "It requires its own real-project validation Case."
          },
          {
            "ref": "project-gap:GAP-cross-record-audit",
            "source": "persisted",
            "eligibility": "case_required",
            "disposition": "deferred",
            "priority_basis": {
              "blocking": "not blocking this Case",
              "uncertainty": "medium",
              "risk": "high",
              "user_impact": "ledger consistency"
            },
            "reason": "Its high urgency does not make this separate-Case obligation eligible inside the active Work Case."
          },
          {
            "ref": "case-gap:CASE-20260822-006:CASE-20260822-006:review-finding:task-attachment-collaboration",
            "source": "persisted",
            "eligibility": "ready",
            "disposition": "selected",
            "priority_basis": {
              "blocking": "high",
              "uncertainty": "medium",
              "risk": "high",
              "user_impact": "comment, link, image and file journeys remain incomplete"
            },
            "reason": "It is the only ready Case gap, the last implementation finding, and directly blocks the accepted Work core-realization impact."
          }
        ]
      },
      "selected_gap": {
        "id": "CASE-20260822-006:review-finding:task-attachment-collaboration",
        "responsibility": "agent",
        "goal": "Resolve review finding: TaskAttachment 时间线仍把 text、url 和 file 的 content 全部转义为普通段落，并通过通用 type/content 表单新增或修改原始值；它不会解析文本评论中的链接、图片和文件引用，不会打开 URL，也不会取得或下载文件，因此不能替代 Workshop Todo 的评论附件协作旅程。",
        "reason": "omission found by completion review",
        "derived_from": [
          "completion_review",
          "content_revision:4"
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
          "/Users/Glare/Library/Developer/ModularProgram/hoewo/workshop-todo-website/frontend/src/components/features/CommentItem.tsx",
          "/Users/Glare/Library/Developer/ModularProgram/hoewo/workshop-todo-website/frontend/src/components/features/CommentEditor.tsx",
          "taskAttachmentPanel() renders every item as escapeHtml(item.content) inside a paragraph regardless of type",
          "manageTaskAttachments() exposes a generic text/file/url selector plus raw content textarea rather than a comment composer with usable link/file/image behavior",
          "There is no Work URL-open, signed-file retrieval/download, image preview, or embedded comment attachment parsing path",
          "desktop-renderer.test.mjs checks only function names, create-text wiring, permissions and retry markers; it does not execute any type-specific content journey",
          "Reference Workshop CommentItem and CommentEditor parse text imageKeys/fileKeys, open URL records, obtain file access and upload comment media",
          "Stable Work spec and interaction document require type-preserving TaskAttachment collaboration and compatibility with links, images and file references rather than a raw field manager"
        ]
      },
      "planned_transition": {
        "goal": "Implement and verify type-preserving TaskAttachment collaboration for text, URL, image and file journeys through bounded Adapter, Coordinator, main-process IPC and Renderer capabilities.",
        "expected_state_change": "Resolve only the TaskAttachment collaboration finding, add a realization fact, restore the Work core-realization impact to upheld, and leave Completion Review for a fresh post-commit round."
      },
      "accepted_state_delta": {
        "resolved_gap": {
          "id": "CASE-20260822-006:review-finding:task-attachment-collaboration",
          "status": "resolved",
          "outcome": "ArcOrbit Work now preserves TaskAttachment text, URL and file types; safely parses comment text, mentions, links and image/file references; explicitly opens URL records; previews images; downloads files; and composes comments with uploaded image/file object keys while preserving existing resources during text edits.",
          "reason": "The Renderer now provides type-specific collaboration journeys, while authenticated Adapter, Coordinator and main-process capabilities enforce task visibility, persisted attachment ownership, STS root boundaries, file constraints and signed-resource handling without exposing credentials or signed file URLs to Renderer. Targeted and full regressions pass.",
          "evidence": [
            "runtime/arcorbit/src/work-task-attachment-content.mjs",
            "runtime/arcorbit/src/work-task-attachment-resource.mjs",
            "runtime/arcorbit/src/workshop-platform-adapter.mjs",
            "runtime/arcorbit/src/platform-coordinator.mjs",
            "runtime/arcorbit/desktop/main.mjs",
            "runtime/arcorbit/desktop/preload.cjs",
            "runtime/arcorbit/desktop/renderer/renderer.js",
            "runtime/arcorbit/desktop/renderer/styles.css",
            "runtime/arcorbit/test/work-task-attachment-content.test.mjs",
            "runtime/arcorbit/test/work-task-attachment-resource.test.mjs",
            "runtime/arcorbit/test/workshop-platform-adapter.test.mjs",
            "runtime/arcorbit/test/platform-coordinator.test.mjs",
            "runtime/arcorbit/test/desktop-renderer.test.mjs",
            "Verification: targeted TaskAttachment content, resource, adapter, coordinator and desktop-renderer tests — 43 passed, 0 failed",
            "Verification: npm run check — 285 tests, 282 passed, 3 environment-gated skips, 0 failed",
            "git diff --check: passed",
            "Debug cleanup: no ARC_DEBUG:task-attachment-collaboration marker or temporary TaskAttachment logging remains"
          ]
        },
        "facts_added": [
          {
            "id": "FACT-work-task-attachment-collaboration-realized",
            "revision": 1,
            "status": "accepted",
            "statement": "ArcOrbit Work 的 TaskAttachment 时间线现在按 text、url、file 保留类型：文本兼容 JSON 与 [image]/[file] 标记并安全呈现提及和外链，URL 通过显式 Work 外链动作打开，图片可在应用内预览，文件可经受限签名下载；评论编辑器可上传图片/文件并保存对象 key，编辑文本时保留已有资源。所有 STS 凭据、OSS 上传、签名 URL、任务可见性和资源归属校验均留在受限 Adapter、Coordinator 与主进程边界。",
            "basis": "对参考 Workshop CommentItem、CommentEditor、评论 API 与 OSS 路径的直接契约核对，以及 ArcOrbit 内容解析、受限资源能力、跨层生产接线和可执行自动化验证。",
            "evidence": [
              "/Users/Glare/Library/Developer/ModularProgram/hoewo/workshop-todo-website/frontend/src/components/features/CommentItem.tsx",
              "/Users/Glare/Library/Developer/ModularProgram/hoewo/workshop-todo-website/frontend/src/components/features/CommentEditor.tsx",
              "runtime/arcorbit/src/work-task-attachment-content.mjs",
              "runtime/arcorbit/src/work-task-attachment-resource.mjs",
              "runtime/arcorbit/src/workshop-platform-adapter.mjs",
              "runtime/arcorbit/src/platform-coordinator.mjs",
              "runtime/arcorbit/desktop/main.mjs",
              "runtime/arcorbit/desktop/preload.cjs",
              "runtime/arcorbit/desktop/renderer/renderer.js",
              "runtime/arcorbit/test/work-task-attachment-content.test.mjs",
              "runtime/arcorbit/test/work-task-attachment-resource.test.mjs",
              "runtime/arcorbit/test/workshop-platform-adapter.test.mjs",
              "runtime/arcorbit/test/platform-coordinator.test.mjs",
              "runtime/arcorbit/test/desktop-renderer.test.mjs",
              "Verification: targeted TaskAttachment content, resource, adapter, coordinator and desktop-renderer tests — 43 passed, 0 failed",
              "Verification: npm run check — 285 tests, 282 passed, 3 environment-gated skips, 0 failed"
            ]
          }
        ],
        "facts_superseded": [],
        "impacts_added": [],
        "impacts_updated": [
          {
            "id": "IMPACT-work-core-realization",
            "fact_id": "FACT-work-task-attachment-collaboration-realized",
            "fact_revision": 1,
            "target": {
              "kind": "software_invariant",
              "ref": "accepted-facts-are-realized",
              "revision": null
            },
            "effect": "upheld",
            "reason": "任务引用恢复、完整详情、显式 Markdown 外链和类型化 TaskAttachment 协作现在均由生产实现兑现；本轮解决了最后一个普通 Work realization finding。",
            "gap_ids": [],
            "evidence": [
              "runtime/arcorbit/src/work-task-attachment-content.mjs",
              "runtime/arcorbit/src/work-task-attachment-resource.mjs",
              "runtime/arcorbit/src/platform-coordinator.mjs",
              "runtime/arcorbit/desktop/main.mjs",
              "runtime/arcorbit/desktop/renderer/renderer.js",
              "runtime/arcorbit/test/work-task-attachment-content.test.mjs",
              "runtime/arcorbit/test/work-task-attachment-resource.test.mjs",
              "runtime/arcorbit/test/platform-coordinator.test.mjs",
              "runtime/arcorbit/test/desktop-renderer.test.mjs",
              "Verification: npm run check — 285 tests, 282 passed, 3 environment-gated skips, 0 failed"
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
        "project_revision": 177,
        "judgments": [
          {
            "invariant_ref": "product-expectations-remain-recoverable",
            "disposition": "upheld",
            "reason": "稳定 Work 规格继续准确表达类型化 TaskAttachment 评论附件协作及不依赖 Todo 网页端的产品目标；本轮实现兑现该既有范围而未扩张产品边界。",
            "fact_refs": [
              "FACT-work-core-parity-boundary-established",
              "FACT-work-task-attachment-collaboration-realized"
            ],
            "evidence": [
              "arckit/spec/agentic-software-development/arcorbit-work-management.md",
              "runtime/arcorbit/desktop/renderer/renderer.js"
            ],
            "gap_refs": []
          },
          {
            "invariant_ref": "interaction-expectations-remain-recoverable",
            "disposition": "upheld",
            "reason": "稳定交互文档要求的文本、URL、图片和文件类型保留、显式链接动作、图片预览、文件取得及失败恢复现在均有对应生产交互和自动化证据。",
            "fact_refs": [
              "FACT-work-task-attachment-collaboration-realized"
            ],
            "evidence": [
              "arckit/interaction/task-browser/interaction.md",
              "runtime/arcorbit/desktop/renderer/renderer.js",
              "runtime/arcorbit/test/work-task-attachment-content.test.mjs",
              "runtime/arcorbit/test/desktop-renderer.test.mjs"
            ],
            "gap_refs": []
          },
          {
            "invariant_ref": "visual-language-remains-consistent",
            "disposition": "upheld",
            "reason": "附件资源按钮、待上传资源 chip 和图片预览复用既有 Work 卡片、按钮、颜色、边框、间距和字体 token，没有建立新的视觉体系或例外。",
            "fact_refs": [
              "FACT-work-task-attachment-collaboration-realized"
            ],
            "evidence": [
              "arckit/visual/_library/brief.md",
              "runtime/arcorbit/desktop/renderer/styles.css",
              "runtime/arcorbit/test/desktop-renderer.test.mjs"
            ],
            "gap_refs": []
          },
          {
            "invariant_ref": "technical-decisions-remain-explainable",
            "disposition": "upheld",
            "reason": "TaskAttachment 资源仍经受认证 Platform Adapter、任务/记录绑定的 Coordinator 和主窗口受限 IPC 处理；STS 凭据、上传和签名 URL 不进入 Renderer，更新后的技术方案可恢复这些边界及理由。",
            "fact_refs": [
              "FACT-work-task-attachment-collaboration-realized"
            ],
            "evidence": [
              "arckit/tech/arcorbit/platform-composition-solution.md",
              "runtime/arcorbit/src/work-task-attachment-resource.mjs",
              "runtime/arcorbit/src/platform-coordinator.mjs",
              "runtime/arcorbit/desktop/main.mjs",
              "runtime/arcorbit/desktop/preload.cjs"
            ],
            "gap_refs": []
          },
          {
            "invariant_ref": "accepted-facts-are-realized",
            "disposition": "upheld",
            "reason": "已接受的 Work 核心筛选、任务树、完整详情、引用恢复、显式外链和评论附件协作均已有生产实现；本轮解决了唯一剩余普通 realization finding。",
            "fact_refs": [
              "FACT-work-core-parity-realized",
              "FACT-work-complete-task-detail-realized",
              "FACT-work-task-reference-recovery-realized",
              "FACT-work-markdown-external-links-realized",
              "FACT-work-task-attachment-collaboration-realized"
            ],
            "evidence": [
              "runtime/arcorbit/src/work-task-attachment-content.mjs",
              "runtime/arcorbit/src/work-task-attachment-resource.mjs",
              "runtime/arcorbit/src/platform-coordinator.mjs",
              "runtime/arcorbit/desktop/main.mjs",
              "runtime/arcorbit/desktop/renderer/renderer.js",
              "runtime/arcorbit/test/work-task-attachment-content.test.mjs",
              "runtime/arcorbit/test/work-task-attachment-resource.test.mjs",
              "runtime/arcorbit/test/platform-coordinator.test.mjs",
              "runtime/arcorbit/test/desktop-renderer.test.mjs",
              "Verification: npm run check — 285 tests, 282 passed, 3 environment-gated skips, 0 failed"
            ],
            "gap_refs": []
          },
          {
            "invariant_ref": "material-risks-have-credible-evidence",
            "disposition": "upheld",
            "reason": "可执行测试覆盖类型解析、URL 和 object key 拒绝、STS 根目录、上传限制、任务可见性、持久记录归属、图片类型/大小、主窗口 IPC、Renderer 接线与全量回归，足以支持本轮风险控制主张。",
            "fact_refs": [
              "FACT-work-core-parity-realized",
              "FACT-work-task-attachment-collaboration-realized"
            ],
            "evidence": [
              "runtime/arcorbit/test/work-task-attachment-content.test.mjs",
              "runtime/arcorbit/test/work-task-attachment-resource.test.mjs",
              "runtime/arcorbit/test/workshop-platform-adapter.test.mjs",
              "runtime/arcorbit/test/platform-coordinator.test.mjs",
              "runtime/arcorbit/test/desktop-renderer.test.mjs",
              "Verification: targeted TaskAttachment content, resource, adapter, coordinator and desktop-renderer tests — 43 passed, 0 failed",
              "Verification: npm run check — 285 tests, 282 passed, 3 environment-gated skips, 0 failed",
              "git diff --check: passed"
            ],
            "gap_refs": []
          }
        ]
      },
      "evidence": [
        "arckit/spec/agentic-software-development/arcorbit-work-management.md",
        "arckit/interaction/task-browser/interaction.md",
        "arckit/tech/arcorbit/platform-composition-solution.md",
        "arckit/tech/INDEX.md",
        "/Users/Glare/Library/Developer/ModularProgram/hoewo/workshop-todo-website/frontend/src/components/features/CommentItem.tsx",
        "/Users/Glare/Library/Developer/ModularProgram/hoewo/workshop-todo-website/frontend/src/components/features/CommentEditor.tsx",
        "runtime/arcorbit/src/work-task-attachment-content.mjs",
        "runtime/arcorbit/src/work-task-attachment-resource.mjs",
        "runtime/arcorbit/src/workshop-platform-adapter.mjs",
        "runtime/arcorbit/src/platform-coordinator.mjs",
        "runtime/arcorbit/src/task-source-adapter.mjs",
        "runtime/arcorbit/desktop/main.mjs",
        "runtime/arcorbit/desktop/preload.cjs",
        "runtime/arcorbit/desktop/renderer/renderer.js",
        "runtime/arcorbit/desktop/renderer/styles.css",
        "runtime/arcorbit/test/work-task-attachment-content.test.mjs",
        "runtime/arcorbit/test/work-task-attachment-resource.test.mjs",
        "runtime/arcorbit/test/workshop-platform-adapter.test.mjs",
        "runtime/arcorbit/test/platform-coordinator.test.mjs",
        "runtime/arcorbit/test/desktop-renderer.test.mjs",
        "Verification: targeted TaskAttachment content, resource, adapter, coordinator and desktop-renderer tests — 43 passed, 0 failed",
        "Verification: npm run check — 285 tests, 282 passed, 3 environment-gated skips, 0 failed",
        "git diff --check: passed",
        "Debug diagnosis: persisted source paths matched the finding; no temporary logging was required",
        "Debug cleanup: no ARC_DEBUG:task-attachment-collaboration marker or temporary TaskAttachment logging remains",
        "Transition validation: passed",
        "Snapshot-bound transition dry-run: passed; projected content_revision 7 with all ordinary gaps and state impacts closed, completion review ready"
      ],
      "runtime_result_ref": "arckit-runtime://runs/RUN-20260822-211944859Z",
      "occurred_at": "2026-08-22T23:03:55.624Z"
    },
    {
      "round": 10,
      "transition_schema_version": "arckit-case-transition/v8",
      "goal": "Perform the five-dimensional Completion Review of content revision 7 against stable Work expectations, production code paths and repeatable verification evidence.",
      "outcome": "completed",
      "gap_selection": {
        "mode": "candidate",
        "basis": "Fresh snapshot comparison selected the only ready Case candidate, Completion Review for content revision 7. All ordinary Case gaps and state impacts are closed, so the required five-dimensional semantic review is the sole eligible path toward Case resolution; all Project gaps require separate Cases.",
        "snapshot_token": "72ec765923765ff8fc11d2505268e35c0199657787f1ada3de5dd9ae2de40d42",
        "selected_ref": "case-gap:CASE-20260822-006:CASE-20260822-006:completion-review:3",
        "comparison_summary": "Completion Review is ready, agent-owned, blocking/high-risk and directly gates this Case. The four Project candidates remain case-required and cannot be consumed by the active Work Case, so each is deferred despite its project-level risk or urgency.",
        "fresh_discovery_summary": "Pre-review source triage found no independent fresh candidate that should displace the required Completion Review. The review itself identified one cache-lifecycle omission, recorded only as a review finding for a future fresh-read round.",
        "considered": [
          {
            "ref": "project-gap:GAP-agent-scenario-evaluation",
            "source": "persisted",
            "eligibility": "case_required",
            "disposition": "deferred",
            "priority_basis": {
              "blocking": "not blocking this Case",
              "uncertainty": "high",
              "risk": "high",
              "user_impact": "project-wide validation"
            },
            "reason": "It requires a separate Case and does not replace the mandatory review of the completed Work implementation."
          },
          {
            "ref": "project-gap:GAP-runtime-resilience-and-adapters",
            "source": "persisted",
            "eligibility": "case_required",
            "disposition": "deferred",
            "priority_basis": {
              "blocking": "not blocking this Case",
              "uncertainty": "medium",
              "risk": "high",
              "user_impact": "long-running runtime reliability"
            },
            "reason": "It requires a separate Case and is outside the Work completion-review boundary."
          },
          {
            "ref": "project-gap:GAP-security-real-project-validation",
            "source": "persisted",
            "eligibility": "case_required",
            "disposition": "deferred",
            "priority_basis": {
              "blocking": "not blocking this Case",
              "uncertainty": "medium",
              "risk": "high",
              "user_impact": "permission-bearing deployments"
            },
            "reason": "It requires its own real-project validation Case."
          },
          {
            "ref": "project-gap:GAP-cross-record-audit",
            "source": "persisted",
            "eligibility": "case_required",
            "disposition": "deferred",
            "priority_basis": {
              "blocking": "not blocking this Case",
              "uncertainty": "medium",
              "risk": "high",
              "user_impact": "ledger consistency"
            },
            "reason": "Its project urgency does not make it eligible inside this active Work Case."
          },
          {
            "ref": "case-gap:CASE-20260822-006:CASE-20260822-006:completion-review:3",
            "source": "persisted",
            "eligibility": "ready",
            "disposition": "selected",
            "priority_basis": {
              "blocking": "high",
              "uncertainty": "low",
              "risk": "high",
              "user_impact": "high"
            },
            "reason": "All ordinary gaps and impacts are closed, making the five-dimensional review the only ready Case obligation."
          }
        ]
      },
      "selected_gap": {
        "id": "CASE-20260822-006:completion-review:3",
        "responsibility": "agent",
        "goal": "Review the completed implementation for correctness, real problem resolution, verification credibility, regression risk, and minimality.",
        "reason": "All ordinary Case gaps and state impacts are closed.",
        "derived_from": [
          "case_result",
          "content_revision:7"
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
        "goal": "Perform the five-dimensional Completion Review of content revision 7 against stable Work expectations, production code paths and repeatable verification evidence.",
        "expected_state_change": "Record the confirmed TaskAttachment cache-lifecycle omission as one ordinary review-finding gap without modifying implementation or consuming the newly discovered finding in this round."
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
          "reviewed_content_revision": 7,
          "dimensions": {
            "implementation_correctness": "findings",
            "problem_resolution": "findings",
            "verification_credibility": "findings",
            "regression_risk": "findings",
            "minimality": "clean"
          },
          "findings": [
            {
              "id": "task-attachment-cache-lifecycle",
              "kind": "omission",
              "statement": "TaskAttachment 的记录缓存、图片 data URL 预览和待提交资源只按 task id 保存在 Renderer 内存中；logout 仅清空 automation snapshot，refreshSnapshot、身份切换和 task_attachment 实时失效均不会清空这些缓存。旧账户的评论或图片可能在新账户遇到相同 task id 时继续显示，其他客户端新增或修改评论后当前 Inspector 也会持续复用旧时间线，与稳定规格要求的身份变化清空远端评论缓存及 WebSocket→REST 定向刷新语义冲突。",
              "responsibility": "agent",
              "artifact_refs": [
                "runtime/arcorbit/desktop/renderer/renderer.js",
                "runtime/arcorbit/test/desktop-renderer.test.mjs",
                "arckit/spec/agentic-software-development/arcorbit-work-management.md"
              ],
              "evidence": [
                "renderer state stores platformTaskAttachments, pendingTaskCommentResources and platformTaskAttachmentPreviews independently from state.platform and state.snapshot",
                "refreshSnapshot() replaces state.platform but does not invalidate any TaskAttachment cache",
                "logout() assigns only state.snapshot = emptySnapshot() and leaves state.platform plus all three TaskAttachment caches intact",
                "renderPlatformWorkInspector() calls loadTaskAttachments() only when the task-id cache entry is absent, so a same-id task can reuse stale prior-account data",
                "main-process realtime task_attachment events trigger snapshot refresh, but the Renderer snapshot path does not invalidate or reload the cached attachment timeline",
                "desktop-renderer.test.mjs verifies type-specific rendering and IPC by source regex but has no logout, identity-switch or realtime cache-invalidation journey",
                "arckit/spec/agentic-software-development/arcorbit-work-management.md requires login identity changes to clear remote task/comment caches and WebSocket invalidations to recover current REST truth"
              ]
            }
          ],
          "evidence": [
            "arckit/spec/agentic-software-development/arcorbit-work-management.md",
            "arckit/interaction/task-browser/interaction.md",
            "arckit/tech/arcorbit/platform-composition-solution.md",
            "runtime/arcorbit/desktop/renderer/renderer.js",
            "runtime/arcorbit/desktop/main.mjs",
            "runtime/arcorbit/src/work-task-attachment-content.mjs",
            "runtime/arcorbit/src/work-task-attachment-resource.mjs",
            "runtime/arcorbit/src/platform-coordinator.mjs",
            "runtime/arcorbit/test/work-task-attachment-content.test.mjs",
            "runtime/arcorbit/test/work-task-attachment-resource.test.mjs",
            "runtime/arcorbit/test/platform-coordinator.test.mjs",
            "runtime/arcorbit/test/desktop-renderer.test.mjs",
            "Verification: npm run check — 285 tests, 282 passed, 3 environment-gated skips, 0 failed, 2026-08-23",
            "Completion Review source inspection of content revision 7, 2026-08-23"
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
        "project_revision": 177,
        "judgments": [
          {
            "invariant_ref": "product-expectations-remain-recoverable",
            "disposition": "upheld",
            "reason": "稳定 Work 规格仍准确、无歧义地定义身份变化清除远端评论缓存、实时失效恢复 REST 真值及完整评论附件协作；本轮 finding 的修复口径可以从该规格直接恢复。",
            "fact_refs": [
              "FACT-work-core-parity-boundary-established",
              "FACT-work-task-attachment-collaboration-realized"
            ],
            "evidence": [
              "arckit/spec/agentic-software-development/arcorbit-work-management.md"
            ],
            "gap_refs": []
          },
          {
            "invariant_ref": "interaction-expectations-remain-recoverable",
            "disposition": "upheld",
            "reason": "稳定交互文档继续完整表达 TaskAttachment 时间线、加载恢复、服务器确认和身份隔离语义；缺口位于生产缓存生命周期而非交互预期本身。",
            "fact_refs": [
              "FACT-work-core-parity-boundary-established",
              "FACT-work-task-attachment-collaboration-realized"
            ],
            "evidence": [
              "arckit/interaction/task-browser/interaction.md"
            ],
            "gap_refs": []
          },
          {
            "invariant_ref": "visual-language-remains-consistent",
            "disposition": "not_relevant",
            "reason": "本轮 finding 针对 Renderer 缓存的身份隔离、实时失效和验证覆盖，不建立或改变任何视觉语言规则。",
            "fact_refs": [],
            "evidence": [],
            "gap_refs": []
          },
          {
            "invariant_ref": "technical-decisions-remain-explainable",
            "disposition": "upheld",
            "reason": "Workshop REST 权威、WebSocket 只作失效通知、Renderer 不持有凭据且身份变化关闭旧远端上下文的技术边界仍清晰可恢复；finding 要求补齐该既有边界的缓存实现。",
            "fact_refs": [
              "FACT-work-core-parity-boundary-established",
              "FACT-work-task-attachment-collaboration-realized"
            ],
            "evidence": [
              "arckit/tech/arcorbit/platform-composition-solution.md",
              "arckit/spec/agentic-software-development/arcorbit-work-management.md"
            ],
            "gap_refs": []
          },
          {
            "invariant_ref": "accepted-facts-are-realized",
            "disposition": "threatened",
            "reason": "筛选、任务树、详情、引用、外链和类型化资源动作已经实现，但已接受的完整 Work 协作主张还要求身份安全和远端更新后的当前评论事实；未失效的 TaskAttachment 缓存使整体 realization 仍不完整。",
            "fact_refs": [
              "FACT-work-core-parity-realized",
              "FACT-work-task-attachment-collaboration-realized"
            ],
            "evidence": [
              "runtime/arcorbit/desktop/renderer/renderer.js"
            ],
            "gap_refs": [
              "CASE-20260822-006:review-finding:task-attachment-cache-lifecycle"
            ]
          },
          {
            "invariant_ref": "material-risks-have-credible-evidence",
            "disposition": "threatened",
            "reason": "全量检查证明现有断言无回归，但 Renderer 测试没有执行 logout、身份切换或 task_attachment 实时失效后的缓存清理，因此不能证明跨账户隔离和评论新鲜度风险已受控。",
            "fact_refs": [
              "FACT-work-core-parity-realized",
              "FACT-work-task-attachment-collaboration-realized"
            ],
            "evidence": [
              "runtime/arcorbit/desktop/renderer/renderer.js",
              "runtime/arcorbit/test/desktop-renderer.test.mjs",
              "Verification: npm run check — 285 tests, 282 passed, 3 environment-gated skips, 0 failed, 2026-08-23"
            ],
            "gap_refs": [
              "CASE-20260822-006:review-finding:task-attachment-cache-lifecycle"
            ]
          }
        ]
      },
      "evidence": [
        "arckit/spec/agentic-software-development/arcorbit-work-management.md",
        "arckit/interaction/task-browser/interaction.md",
        "arckit/tech/arcorbit/platform-composition-solution.md",
        "runtime/arcorbit/desktop/renderer/renderer.js",
        "runtime/arcorbit/desktop/main.mjs",
        "runtime/arcorbit/src/work-task-attachment-content.mjs",
        "runtime/arcorbit/src/work-task-attachment-resource.mjs",
        "runtime/arcorbit/src/platform-coordinator.mjs",
        "runtime/arcorbit/test/work-task-attachment-content.test.mjs",
        "runtime/arcorbit/test/work-task-attachment-resource.test.mjs",
        "runtime/arcorbit/test/platform-coordinator.test.mjs",
        "runtime/arcorbit/test/desktop-renderer.test.mjs",
        "Verification: npm run check — 285 tests, 282 passed, 3 environment-gated skips, 0 failed, 2026-08-23",
        "git diff --check: passed",
        "Completion Review source inspection of content revision 7, 2026-08-23",
        "Transition validation: passed",
        "Snapshot-bound transition dry-run: passed; projected one ready agent-owned cache-lifecycle finding"
      ],
      "runtime_result_ref": "arckit-runtime://runs/RUN-20260822-211944859Z",
      "occurred_at": "2026-08-22T23:10:05.362Z"
    },
    {
      "round": 11,
      "transition_schema_version": "arckit-case-transition/v8",
      "goal": "Implement and verify identity-bound TaskAttachment cache invalidation and stale async-write rejection across snapshot refresh, identity change and logout.",
      "outcome": "completed",
      "gap_selection": {
        "mode": "candidate",
        "basis": "Fresh snapshot comparison selected the only ready Case gap: the TaskAttachment cache lifecycle finding is agent-owned, blocking/high-risk, directly threatens accepted Work realization, and is bounded by existing identity, REST-authority and realtime-refresh expectations. All Project gaps require separate Cases.",
        "snapshot_token": "a70aced033f4d56d63478ad7d1b09939a750dcec96ddebc28881e27c79cb3fc9",
        "selected_ref": "case-gap:CASE-20260822-006:CASE-20260822-006:review-finding:task-attachment-cache-lifecycle",
        "comparison_summary": "The cache-lifecycle finding is the sole ready dynamic gap and the only ordinary blocker in this Case. The four Project gaps remain case-required and cannot advance this active Work Case, so the ready Case gap outranks them on immediate identity-isolation, freshness and user-impact risk.",
        "fresh_discovery_summary": "Source and async-path inspection fully confirmed the persisted cache identity, refresh and stale-write mechanism. No independent fresh candidate was discovered that should displace or follow within this single-gap round.",
        "considered": [
          {
            "ref": "project-gap:GAP-agent-scenario-evaluation",
            "source": "persisted",
            "eligibility": "case_required",
            "disposition": "deferred",
            "priority_basis": {
              "blocking": "not blocking this Case",
              "uncertainty": "high",
              "risk": "high",
              "user_impact": "project-wide validation"
            },
            "reason": "It requires a separate Case and does not restore the active Work cache-lifecycle realization."
          },
          {
            "ref": "project-gap:GAP-runtime-resilience-and-adapters",
            "source": "persisted",
            "eligibility": "case_required",
            "disposition": "deferred",
            "priority_basis": {
              "blocking": "not blocking this Case",
              "uncertainty": "medium",
              "risk": "high",
              "user_impact": "long-running runtime reliability"
            },
            "reason": "It requires a separate Case and is outside the selected Renderer cache-lifecycle boundary."
          },
          {
            "ref": "project-gap:GAP-security-real-project-validation",
            "source": "persisted",
            "eligibility": "case_required",
            "disposition": "deferred",
            "priority_basis": {
              "blocking": "not blocking this Case",
              "uncertainty": "medium",
              "risk": "high",
              "user_impact": "permission-bearing deployments"
            },
            "reason": "It requires its own real-project validation Case and cannot replace this concrete identity-isolation repair."
          },
          {
            "ref": "project-gap:GAP-cross-record-audit",
            "source": "persisted",
            "eligibility": "case_required",
            "disposition": "deferred",
            "priority_basis": {
              "blocking": "not blocking this Case",
              "uncertainty": "medium",
              "risk": "high",
              "user_impact": "ledger consistency"
            },
            "reason": "Its high urgency remains a separate-Case obligation and does not resolve the active Work finding."
          },
          {
            "ref": "case-gap:CASE-20260822-006:CASE-20260822-006:review-finding:task-attachment-cache-lifecycle",
            "source": "persisted",
            "eligibility": "ready",
            "disposition": "selected",
            "priority_basis": {
              "blocking": "high",
              "uncertainty": "low",
              "risk": "high",
              "user_impact": "cross-account isolation and current comment truth"
            },
            "reason": "It is the only ready Case gap and directly blocks credible realization of TaskAttachment collaboration."
          }
        ]
      },
      "selected_gap": {
        "id": "CASE-20260822-006:review-finding:task-attachment-cache-lifecycle",
        "responsibility": "agent",
        "goal": "Resolve review finding: TaskAttachment 的记录缓存、图片 data URL 预览和待提交资源只按 task id 保存在 Renderer 内存中；logout 仅清空 automation snapshot，refreshSnapshot、身份切换和 task_attachment 实时失效均不会清空这些缓存。旧账户的评论或图片可能在新账户遇到相同 task id 时继续显示，其他客户端新增或修改评论后当前 Inspector 也会持续复用旧时间线，与稳定规格要求的身份变化清空远端评论缓存及 WebSocket→REST 定向刷新语义冲突。",
        "reason": "omission found by completion review",
        "derived_from": [
          "completion_review",
          "content_revision:7"
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
          "arckit/spec/agentic-software-development/arcorbit-work-management.md",
          "renderer state stores platformTaskAttachments, pendingTaskCommentResources and platformTaskAttachmentPreviews independently from state.platform and state.snapshot",
          "refreshSnapshot() replaces state.platform but does not invalidate any TaskAttachment cache",
          "logout() assigns only state.snapshot = emptySnapshot() and leaves state.platform plus all three TaskAttachment caches intact",
          "renderPlatformWorkInspector() calls loadTaskAttachments() only when the task-id cache entry is absent, so a same-id task can reuse stale prior-account data",
          "main-process realtime task_attachment events trigger snapshot refresh, but the Renderer snapshot path does not invalidate or reload the cached attachment timeline",
          "desktop-renderer.test.mjs verifies type-specific rendering and IPC by source regex but has no logout, identity-switch or realtime cache-invalidation journey",
          "arckit/spec/agentic-software-development/arcorbit-work-management.md requires login identity changes to clear remote task/comment caches and WebSocket invalidations to recover current REST truth"
        ]
      },
      "planned_transition": {
        "goal": "Implement and verify identity-bound TaskAttachment cache invalidation and stale async-write rejection across snapshot refresh, identity change and logout.",
        "expected_state_change": "Resolve only the TaskAttachment cache-lifecycle finding, add one realization fact, restore the Work core-realization impact to upheld, and leave Completion Review for a fresh post-commit round."
      },
      "accepted_state_delta": {
        "resolved_gap": {
          "id": "CASE-20260822-006:review-finding:task-attachment-cache-lifecycle",
          "status": "resolved",
          "outcome": "ArcOrbit Work now invalidates TaskAttachment records and image previews on every accepted snapshot refresh, preserves same-identity pending comment resources, clears platform state plus every attachment cache on identity change or logout, and rejects stale list, preview, upload and comment async completions through generation tokens.",
          "reason": "A centralized cache-lifecycle module now separates remote-cache freshness from identity-owned drafts, Renderer refresh and logout paths apply the correct invalidation strength, and executable tests cover routine refresh, identity reset and stale async writes. Targeted and full ArcOrbit regressions pass.",
          "evidence": [
            "runtime/arcorbit/src/work-task-attachment-cache.mjs",
            "runtime/arcorbit/desktop/renderer/renderer.js",
            "runtime/arcorbit/test/work-task-attachment-cache.test.mjs",
            "runtime/arcorbit/test/desktop-renderer.test.mjs",
            "Verification: targeted TaskAttachment cache and desktop-renderer tests — 25 passed, 0 failed",
            "Verification: npm run check — 288 tests, 285 passed, 3 environment-gated skips, 0 failed",
            "git diff --check: passed",
            "Debug diagnosis: source logic fully matched the persisted cache identity and async timing finding; no temporary logging was required",
            "Debug cleanup: no ARC_DEBUG:task-attachment-cache-lifecycle marker or temporary logging remains"
          ]
        },
        "facts_added": [
          {
            "id": "FACT-work-task-attachment-cache-lifecycle-realized",
            "revision": 1,
            "status": "accepted",
            "statement": "ArcOrbit Work 的 TaskAttachment 缓存现在绑定 Workshop 身份和受信快照生命周期：成功快照刷新会使服务端记录与图片预览失效并按需重新读取 REST 真值，同时保留同一身份的待提交评论资源；身份变化或退出会清空远端 Platform 状态、任务选择、评论草稿、记录和预览。异步 list、preview、upload 与评论提交只有 generation token 仍有效时才可回写 Renderer 状态。",
            "basis": "对 Renderer 快照、退出、附件读取、图片预览、资源选择和评论提交时序的直接根因分析，以及集中缓存生命周期实现、可执行 generation/身份测试、Renderer 接线检查和完整 ArcOrbit 回归。",
            "evidence": [
              "arckit/spec/agentic-software-development/arcorbit-work-management.md",
              "runtime/arcorbit/src/work-task-attachment-cache.mjs",
              "runtime/arcorbit/desktop/renderer/renderer.js",
              "runtime/arcorbit/test/work-task-attachment-cache.test.mjs",
              "runtime/arcorbit/test/desktop-renderer.test.mjs",
              "Verification: targeted TaskAttachment cache and desktop-renderer tests — 25 passed, 0 failed",
              "Verification: npm run check — 288 tests, 285 passed, 3 environment-gated skips, 0 failed"
            ]
          }
        ],
        "facts_superseded": [],
        "impacts_added": [],
        "impacts_updated": [
          {
            "id": "IMPACT-work-core-realization",
            "fact_id": "FACT-work-task-attachment-cache-lifecycle-realized",
            "fact_revision": 1,
            "target": {
              "kind": "software_invariant",
              "ref": "accepted-facts-are-realized",
              "revision": null
            },
            "effect": "upheld",
            "reason": "Work TaskAttachment collaboration now preserves both the type-specific journeys and their required identity isolation/current REST truth; the Completion Review cache-lifecycle finding is resolved with executable evidence.",
            "gap_ids": [],
            "evidence": [
              "runtime/arcorbit/src/work-task-attachment-cache.mjs",
              "runtime/arcorbit/desktop/renderer/renderer.js",
              "runtime/arcorbit/test/work-task-attachment-cache.test.mjs",
              "runtime/arcorbit/test/desktop-renderer.test.mjs",
              "Verification: npm run check — 288 tests, 285 passed, 3 environment-gated skips, 0 failed"
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
        "project_revision": 177,
        "judgments": [
          {
            "invariant_ref": "product-expectations-remain-recoverable",
            "disposition": "upheld",
            "reason": "稳定 Work 规格继续准确表达身份变化清除远端评论缓存、实时失效恢复 REST 真值和完整评论附件协作；本轮实现兑现这些既有产品期望而未改变范围。",
            "fact_refs": [
              "FACT-work-core-parity-boundary-established",
              "FACT-work-task-attachment-cache-lifecycle-realized"
            ],
            "evidence": [
              "arckit/spec/agentic-software-development/arcorbit-work-management.md",
              "runtime/arcorbit/desktop/renderer/renderer.js"
            ],
            "gap_refs": []
          },
          {
            "invariant_ref": "interaction-expectations-remain-recoverable",
            "disposition": "upheld",
            "reason": "稳定交互文档中的 TaskAttachment 当前时间线、恢复和身份隔离语义现已由快照失效、按需重读、登出清理及同身份草稿保留共同兑现。",
            "fact_refs": [
              "FACT-work-task-attachment-collaboration-realized",
              "FACT-work-task-attachment-cache-lifecycle-realized"
            ],
            "evidence": [
              "arckit/interaction/task-browser/interaction.md",
              "runtime/arcorbit/desktop/renderer/renderer.js",
              "runtime/arcorbit/test/work-task-attachment-cache.test.mjs",
              "runtime/arcorbit/test/desktop-renderer.test.mjs"
            ],
            "gap_refs": []
          },
          {
            "invariant_ref": "visual-language-remains-consistent",
            "disposition": "not_relevant",
            "reason": "本轮只改变 Renderer 内部缓存生命周期、身份清理和异步回写门禁，不改变可见结构、样式、token 或视觉规则。",
            "fact_refs": [],
            "evidence": [],
            "gap_refs": []
          },
          {
            "invariant_ref": "technical-decisions-remain-explainable",
            "disposition": "upheld",
            "reason": "Workshop REST 权威、WebSocket/快照失效、Renderer 派生缓存和身份关闭旧上下文的边界仍清晰；集中 helper 将远端 cache epoch 与身份 epoch 分离，使同身份草稿保留和跨身份 fail-closed 行为可解释、可恢复。",
            "fact_refs": [
              "FACT-work-task-attachment-cache-lifecycle-realized"
            ],
            "evidence": [
              "arckit/tech/arcorbit/platform-composition-solution.md",
              "runtime/arcorbit/src/work-task-attachment-cache.mjs",
              "runtime/arcorbit/desktop/renderer/renderer.js"
            ],
            "gap_refs": []
          },
          {
            "invariant_ref": "accepted-facts-are-realized",
            "disposition": "upheld",
            "reason": "已接受的 Work 核心筛选、任务树、详情、引用、外链和类型化 TaskAttachment 协作现在同时具备身份隔离与当前 REST 真值；唯一普通 cache-lifecycle finding 已解决。",
            "fact_refs": [
              "FACT-work-core-parity-realized",
              "FACT-work-task-attachment-collaboration-realized",
              "FACT-work-task-attachment-cache-lifecycle-realized"
            ],
            "evidence": [
              "runtime/arcorbit/src/work-task-attachment-cache.mjs",
              "runtime/arcorbit/desktop/renderer/renderer.js",
              "runtime/arcorbit/test/work-task-attachment-cache.test.mjs",
              "runtime/arcorbit/test/desktop-renderer.test.mjs",
              "Verification: npm run check — 288 tests, 285 passed, 3 environment-gated skips, 0 failed"
            ],
            "gap_refs": []
          },
          {
            "invariant_ref": "material-risks-have-credible-evidence",
            "disposition": "upheld",
            "reason": "可执行测试证明普通快照失效清除记录/预览但保留同身份草稿，身份失效清除全部资源并拒绝旧 generation；Renderer 接线检查覆盖刷新、登出、list、preview 和 upload，完整回归无失败。",
            "fact_refs": [
              "FACT-work-core-parity-realized",
              "FACT-work-task-attachment-cache-lifecycle-realized"
            ],
            "evidence": [
              "runtime/arcorbit/test/work-task-attachment-cache.test.mjs",
              "runtime/arcorbit/test/desktop-renderer.test.mjs",
              "Verification: targeted TaskAttachment cache and desktop-renderer tests — 25 passed, 0 failed",
              "Verification: npm run check — 288 tests, 285 passed, 3 environment-gated skips, 0 failed",
              "git diff --check: passed"
            ],
            "gap_refs": []
          }
        ]
      },
      "evidence": [
        "arckit/spec/agentic-software-development/arcorbit-work-management.md",
        "arckit/interaction/task-browser/interaction.md",
        "arckit/tech/arcorbit/platform-composition-solution.md",
        "runtime/arcorbit/src/work-task-attachment-cache.mjs",
        "runtime/arcorbit/desktop/renderer/renderer.js",
        "runtime/arcorbit/test/work-task-attachment-cache.test.mjs",
        "runtime/arcorbit/test/desktop-renderer.test.mjs",
        "Verification: targeted TaskAttachment cache and desktop-renderer tests — 25 passed, 0 failed",
        "Verification: npm run check — 288 tests, 285 passed, 3 environment-gated skips, 0 failed",
        "git diff --check: passed",
        "Debug diagnosis: source logic fully matched the persisted cache identity and async timing finding; no temporary logging was required",
        "Debug cleanup: no ARC_DEBUG:task-attachment-cache-lifecycle marker or temporary logging remains"
      ],
      "runtime_result_ref": "arckit-runtime://runs/RUN-20260822-211944859Z",
      "occurred_at": "2026-08-22T23:18:20.786Z"
    },
    {
      "round": 12,
      "transition_schema_version": "arckit-case-transition/v8",
      "goal": "Perform the five-dimensional Completion Review of content revision 8 after the TaskAttachment cache-lifecycle repair.",
      "outcome": "completed",
      "gap_selection": {
        "mode": "candidate",
        "basis": "Fresh canonical snapshot comparison found one ready current-Case obligation. The four project gaps each require a separate Case and cannot displace the current Case's blocking Completion Review.",
        "snapshot_token": "611e91af7e900113d59f5d6f5e42843d84c248e7b5bbd1c3b89c9cdda2a3cd66",
        "selected_ref": "case-gap:CASE-20260822-006:CASE-20260822-006:completion-review:4",
        "comparison_summary": "Selected the sole ready, agent-owned Completion Review for content revision 8; deferred all four project-level candidates because their eligibility is case_required and they are outside the current Case.",
        "fresh_discovery_summary": "Five-dimensional source and evidence review found no new error, omission, excess, open question, handoff, or project-state impact.",
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
            "reason": "Requires a separate Case and does not block resolution of the current Work Case."
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
            "reason": "Requires a separate Case and does not block resolution of the current Work Case."
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
            "reason": "Requires a separate Case and does not block resolution of the current Work Case."
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
            "reason": "Requires a separate Case and does not block resolution of the current Work Case."
          },
          {
            "ref": "case-gap:CASE-20260822-006:CASE-20260822-006:completion-review:4",
            "source": "persisted",
            "eligibility": "ready",
            "disposition": "selected",
            "priority_basis": {
              "blocking": "high",
              "uncertainty": "low",
              "risk": "high",
              "user_impact": "high"
            },
            "reason": "It is the sole ready obligation remaining in the current Case and gates Case resolution."
          }
        ]
      },
      "selected_gap": {
        "id": "CASE-20260822-006:completion-review:4",
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
        "goal": "Perform the five-dimensional Completion Review of content revision 8 after the TaskAttachment cache-lifecycle repair.",
        "expected_state_change": "All five review dimensions become clean, the Case resolves, and no current-Case obligation remains."
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
          "reviewed_content_revision": 8,
          "dimensions": {
            "implementation_correctness": "clean",
            "problem_resolution": "clean",
            "verification_credibility": "clean",
            "regression_risk": "clean",
            "minimality": "clean"
          },
          "findings": [],
          "evidence": [
            "arckit/spec/agentic-software-development/arcorbit-work-management.md",
            "arckit/interaction/task-browser/interaction.md",
            "arckit/tech/arcorbit/platform-composition-solution.md",
            "runtime/arcorbit/src/workshop-platform-adapter.mjs",
            "runtime/arcorbit/src/platform-coordinator.mjs",
            "runtime/arcorbit/src/work-task-attachment-cache.mjs",
            "runtime/arcorbit/desktop/main.mjs",
            "runtime/arcorbit/desktop/preload.cjs",
            "runtime/arcorbit/desktop/renderer/renderer.js",
            "runtime/arcorbit/test/work-task-attachment-cache.test.mjs",
            "runtime/arcorbit/test/work-task-attachment-content.test.mjs",
            "runtime/arcorbit/test/work-task-attachment-resource.test.mjs",
            "runtime/arcorbit/test/workshop-platform-adapter.test.mjs",
            "runtime/arcorbit/test/platform-coordinator.test.mjs",
            "runtime/arcorbit/test/desktop-renderer.test.mjs",
            "Verification: targeted TaskAttachment cache and desktop-renderer tests — 25 passed, 0 failed, 2026-08-23",
            "Verification: npm run check — 288 tests, 285 passed, 3 environment-gated skips, 0 failed, 2026-08-23",
            "git diff --check: passed",
            "Completion Review source inspection of content revision 8, 2026-08-23"
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
        "project_revision": 177,
        "judgments": [
          {
            "invariant_ref": "product-expectations-remain-recoverable",
            "disposition": "upheld",
            "reason": "稳定 Work 规格仍准确覆盖服务端筛选、任务层级、完整详情、可恢复引用、显式外链、类型化 TaskAttachment 协作、身份隔离和 REST 真值恢复。",
            "fact_refs": [
              "FACT-work-core-parity-boundary-established",
              "FACT-work-core-parity-realized",
              "FACT-work-task-attachment-cache-lifecycle-realized"
            ],
            "evidence": [
              "arckit/spec/agentic-software-development/arcorbit-work-management.md"
            ],
            "gap_refs": []
          },
          {
            "invariant_ref": "interaction-expectations-remain-recoverable",
            "disposition": "upheld",
            "reason": "稳定交互契约和生产 Renderer 连贯覆盖 Work 核心旅程、加载与失败恢复、受控动作、当前附件时间线及身份安全的上下文清理。",
            "fact_refs": [
              "FACT-work-core-parity-realized",
              "FACT-work-complete-task-detail-realized",
              "FACT-work-task-reference-recovery-realized",
              "FACT-work-task-attachment-collaboration-realized",
              "FACT-work-task-attachment-cache-lifecycle-realized"
            ],
            "evidence": [
              "arckit/interaction/task-browser/interaction.md",
              "runtime/arcorbit/desktop/renderer/renderer.js",
              "runtime/arcorbit/test/desktop-renderer.test.mjs"
            ],
            "gap_refs": []
          },
          {
            "invariant_ref": "visual-language-remains-consistent",
            "disposition": "upheld",
            "reason": "Work 层级、详情、资源动作、编辑器和预览均复用既有 Desktop token 与组件语言；缓存修复没有引入可见例外或新视觉规则。",
            "fact_refs": [
              "FACT-work-core-parity-realized",
              "FACT-work-task-attachment-collaboration-realized"
            ],
            "evidence": [
              "arckit/visual/_library/brief.md",
              "runtime/arcorbit/desktop/renderer/styles.css",
              "runtime/arcorbit/test/desktop-renderer.test.mjs"
            ],
            "gap_refs": []
          },
          {
            "invariant_ref": "technical-decisions-remain-explainable",
            "disposition": "upheld",
            "reason": "Workshop 继续在受限 Adapter、Coordinator 和 typed main-process IPC 后保持权威；Renderer 只持有身份绑定的派生缓存，快照失效和 generation 门禁在不暴露凭据或通用请求能力的前提下恢复 REST 真值。",
            "fact_refs": [
              "FACT-work-core-parity-realized",
              "FACT-work-markdown-external-links-realized",
              "FACT-work-task-attachment-collaboration-realized",
              "FACT-work-task-attachment-cache-lifecycle-realized"
            ],
            "evidence": [
              "arckit/tech/arcorbit/platform-composition-solution.md",
              "runtime/arcorbit/src/workshop-platform-adapter.mjs",
              "runtime/arcorbit/src/platform-coordinator.mjs",
              "runtime/arcorbit/src/work-task-attachment-cache.mjs",
              "runtime/arcorbit/desktop/main.mjs",
              "runtime/arcorbit/desktop/preload.cjs"
            ],
            "gap_refs": []
          },
          {
            "invariant_ref": "accepted-facts-are-realized",
            "disposition": "upheld",
            "reason": "生产代码兑现全部相关 Work facts：组合服务端筛选、层级与子待办、安全完整详情、引用恢复、受限外链、类型化评论资源以及身份安全的当前 TaskAttachment 状态。",
            "fact_refs": [
              "FACT-work-core-parity-realized",
              "FACT-work-status-filter-server-contract-realized",
              "FACT-work-complete-task-detail-realized",
              "FACT-work-task-reference-recovery-realized",
              "FACT-work-markdown-external-links-realized",
              "FACT-work-task-attachment-collaboration-realized",
              "FACT-work-task-attachment-cache-lifecycle-realized"
            ],
            "evidence": [
              "runtime/arcorbit/src/platform-coordinator.mjs",
              "runtime/arcorbit/src/work-task-attachment-cache.mjs",
              "runtime/arcorbit/desktop/main.mjs",
              "runtime/arcorbit/desktop/preload.cjs",
              "runtime/arcorbit/desktop/renderer/restricted-markdown.mjs",
              "runtime/arcorbit/desktop/renderer/renderer.js",
              "runtime/arcorbit/test/platform-coordinator.test.mjs",
              "runtime/arcorbit/test/desktop-renderer.test.mjs"
            ],
            "gap_refs": []
          },
          {
            "invariant_ref": "material-risks-have-credible-evidence",
            "disposition": "upheld",
            "reason": "定向可执行测试覆盖身份重置、快照失效、过期异步回写、内容与资源约束、Adapter/Coordinator 边界和 Renderer 接线；全量检查与 diff 检查均无失败。",
            "fact_refs": [
              "FACT-work-core-parity-realized",
              "FACT-work-task-attachment-collaboration-realized",
              "FACT-work-task-attachment-cache-lifecycle-realized"
            ],
            "evidence": [
              "runtime/arcorbit/test/work-task-attachment-cache.test.mjs",
              "runtime/arcorbit/test/work-task-attachment-content.test.mjs",
              "runtime/arcorbit/test/work-task-attachment-resource.test.mjs",
              "runtime/arcorbit/test/workshop-platform-adapter.test.mjs",
              "runtime/arcorbit/test/platform-coordinator.test.mjs",
              "runtime/arcorbit/test/desktop-renderer.test.mjs",
              "Verification: targeted TaskAttachment cache and desktop-renderer tests — 25 passed, 0 failed, 2026-08-23",
              "Verification: npm run check — 288 tests, 285 passed, 3 environment-gated skips, 0 failed, 2026-08-23",
              "git diff --check: passed"
            ],
            "gap_refs": []
          }
        ]
      },
      "evidence": [
        "arckit/spec/agentic-software-development/arcorbit-work-management.md",
        "arckit/interaction/task-browser/interaction.md",
        "arckit/tech/arcorbit/platform-composition-solution.md",
        "runtime/arcorbit/src/work-task-attachment-cache.mjs",
        "runtime/arcorbit/desktop/renderer/renderer.js",
        "runtime/arcorbit/test/work-task-attachment-cache.test.mjs",
        "runtime/arcorbit/test/desktop-renderer.test.mjs",
        "Verification: targeted TaskAttachment cache and desktop-renderer tests — 25 passed, 0 failed, 2026-08-23",
        "Verification: npm run check — 288 tests, 285 passed, 3 environment-gated skips, 0 failed, 2026-08-23",
        "git diff --check: passed",
        "Completion Review source inspection of content revision 8, 2026-08-23",
        "Transition validation: passed",
        "Snapshot-bound transition dry-run: passed; projected Case status resolved with no remaining obligations"
      ],
      "runtime_result_ref": "arckit-runtime://runs/RUN-20260822-211944859Z",
      "occurred_at": "2026-08-22T23:23:27.164Z"
    }
  ],
  "case_resolution": {
    "status": "resolved",
    "stage": "resolved",
    "satisfied": [
      "GAP-establish-work-core-parity-boundary",
      "GAP-realize-work-core-parity",
      "CASE-20260822-006:review-finding:status-filter-server-contract",
      "CASE-20260822-006:review-finding:complete-task-detail",
      "CASE-20260822-006:review-finding:task-reference-recovery",
      "CASE-20260822-006:review-finding:task-markdown-external-links",
      "CASE-20260822-006:review-finding:task-attachment-collaboration",
      "CASE-20260822-006:review-finding:task-attachment-cache-lifecycle"
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
    "updated_at": "2026-08-22T23:23:27.164Z"
  }
}
```

## Round Notes

- Case history is canonical in Structured Record.rounds; keep prose notes exceptional.
