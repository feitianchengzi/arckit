# 统一 Arcorbit 待办标题与内容语义

Case: CASE-20260824-005
Status: closed
Artifact Type: mixed
Selected Gap: none
Updated: 2026-08-24T12:51:59.665Z

## User Intent

让服务端待办只保存一个完整文本字段；所有标题场景均由该文本生成单行、限长并带省略号的展示文本，内容场景继续展示完整文本及换行。

## Structured Record

```json
{
  "schema_version": "development-case-record/v5",
  "id": "CASE-20260824-005",
  "title": "统一 Arcorbit 待办标题与内容语义",
  "status": "closed",
  "artifact_type": "mixed",
  "created_at": "2026-08-24T10:55:02.984Z",
  "updated_at": "2026-08-24T12:51:59.665Z",
  "user_intent": "让服务端待办只保存一个完整文本字段；所有标题场景均由该文本生成单行、限长并带省略号的展示文本，内容场景继续展示完整文本及换行。",
  "expected_outcome": "待办详情不再重复显示标题与内容；完整内容保留换行；列表、人工介入页顶部等标题区域稳定显示单行截断标题，不被长待办内容撑高。",
  "project_state_ref": "arckit/project/state.record.json",
  "current_round": {
    "goal": "",
    "selected_gap": null
  },
  "facts": [
    {
      "id": "FACT-TODO-UNIFIED-TEXT-REQUIREMENT",
      "revision": 1,
      "status": "accepted",
      "statement": "Arcorbit 待办的标题和内容在服务端应为同一个完整文本字段；内容展示保留原始换行，标题展示将换行折叠为空格并限制为单行，超过展示上限时追加省略号。待办详情不得重复展示标题与内容，人工介入页顶部等标题区域不得被长内容撑高。",
      "basis": "当前操作者明确给出的产品、数据与交互要求。",
      "evidence": [
        "Current operator input, 2026-08-24"
      ]
    },
    {
      "id": "FACT-20260824-005-001",
      "revision": 1,
      "status": "accepted",
      "statement": "Workshop Todo 服务端任务的持久模型、创建/更新请求、创建/更新响应和公开 API 契约均只有一个正文 `content` 字段，不存在任务 `title` 字段；ArcOrbit 创建和更新待办也只向服务端提交 `content`。因此服务端单字段要求已经实现，无需服务端字段合并或数据迁移。",
      "basis": "服务端模型、handler、API 文档和 ArcOrbit platform adapter 写入路径一致。",
      "evidence": [
        "/Users/Glare/Library/Developer/ModularProgram/hoewo/workshop-todo/models/task.go:10",
        "/Users/Glare/Library/Developer/ModularProgram/hoewo/workshop-todo/handler/task.go:20",
        "/Users/Glare/Library/Developer/ModularProgram/hoewo/workshop-todo/handler/task.go:259",
        "/Users/Glare/Library/Developer/ModularProgram/hoewo/workshop-todo/api/task.md:69",
        "runtime/arcorbit/src/workshop-platform-adapter.mjs:543",
        "Verification: go test ./models ./handler passed"
      ]
    },
    {
      "id": "FACT-20260824-005-002",
      "revision": 1,
      "status": "superseded",
      "statement": "ArcOrbit 的 `normalizeTask` 当前把服务端同一正文同时投影成完整 `content` 和 `title`，仅做 `trim`，没有折叠内部换行、字符上限或省略号。派生 `title` 随后写入 Automation active task、验收反馈标题和 session/CLI 标签，并由 Work 列表、Automation 队列、当前运行卡片和 Intervention Workbench 顶部消费；表格单元格只有 CSS 视觉 ellipsis，而当前运行及 Workbench 标题没有单行限高或截断规则。",
      "basis": "ArcOrbit adapter、Automation coordinator、Renderer 和 CSS 的确定性数据流与三个报告现象完全匹配。",
      "evidence": [
        "runtime/arcorbit/src/task-source-adapter.mjs:485",
        "runtime/arcorbit/src/automation-coordinator.mjs:600",
        "runtime/arcorbit/src/automation-coordinator.mjs:1055",
        "runtime/arcorbit/src/automation-coordinator.mjs:1852",
        "runtime/arcorbit/src/automation-coordinator.mjs:2438",
        "runtime/arcorbit/desktop/renderer/renderer.js:1295",
        "runtime/arcorbit/desktop/renderer/renderer.js:2685",
        "runtime/arcorbit/desktop/renderer/renderer.js:2928",
        "runtime/arcorbit/desktop/renderer/styles.css:416",
        "runtime/arcorbit/desktop/renderer/styles.css:800"
      ]
    },
    {
      "id": "FACT-20260824-005-003",
      "revision": 1,
      "status": "superseded",
      "statement": "Work Inspector 与 Automation Task Inspector 当前先展示派生 `title`，再展示同源完整 `content`，因此服务端仅返回 `content` 时仍会重复正文。现有测试证明服务端单字段写入、`content` 优先作为 Agent intent 以及 `content` 被直接派生为 `title`，但没有覆盖换行折叠、明确字符上限、省略号、详情不重复或 Automation 顶部单行高度。",
      "basis": "Renderer 模板与现有 adapter/coordinator/renderer 测试的直接检查及聚焦测试执行。",
      "evidence": [
        "runtime/arcorbit/desktop/renderer/renderer.js:1364",
        "runtime/arcorbit/desktop/renderer/renderer.js:2825",
        "runtime/arcorbit/test/task-source-adapter.test.mjs:5",
        "runtime/arcorbit/test/automation-coordinator.test.mjs:14",
        "runtime/arcorbit/test/workshop-platform-adapter.test.mjs:71",
        "runtime/arcorbit/test/fixtures/organization-center-electron.mjs:89",
        "Verification: 123 selected ArcOrbit tests passed, 0 failed"
      ]
    },
    {
      "id": "FACT-20260824-005-004",
      "revision": 1,
      "status": "accepted",
      "statement": "ArcOrbit 待办的唯一业务文本是 Workshop `content`。展示标题是只读派生值：去除首尾空白，将连续 Unicode 空白折叠为一个半角空格，再按 Unicode extended grapheme cluster 分段；归一化结果不超过 64 个 grapheme clusters 时原样展示，超限时保留前 63 个并追加单字符 `…`，最终最多 64 个 grapheme clusters且不得拆分组合字符、emoji sequence 或代理对。列表、父任务候选、Automation 队列、当前运行、人工介入顶部、确认对话、验收问题来源标签和 session/Activity/CLI 标签统一使用该值；历史标签可保存生成时快照但不得成为搜索、正文或服务端写回事实。Work 与 Automation 详情只展示一次保留换行的完整正文，标题区使用任务 ID、项目和状态识别对象。",
      "basis": "操作者的单字段与展示差异要求、已接受的端到端现状事实、ArcOrbit 既有 64 字符会话摘要尺度，以及本轮同步维护的产品、交互、技术和视觉结果规格。",
      "evidence": [
        "Current operator input, 2026-08-24",
        "case:fact:FACT-TODO-UNIFIED-TEXT-REQUIREMENT",
        "case:fact:FACT-20260824-005-001",
        "case:fact:FACT-20260824-005-002",
        "case:fact:FACT-20260824-005-003",
        "runtime/arcorbit/src/chat-coordinator.mjs:634",
        "arckit/spec/agentic-software-development/arcorbit-work-management.md",
        "arckit/spec/agentic-software-development/runtime-automation-workspace.md",
        "arckit/interaction/task-browser/interaction.md",
        "arckit/interaction/automation-workspace/interaction.md",
        "arckit/tech/arcorbit/platform-composition-solution.md",
        "arckit/visual/_library/brief.md",
        "Verification: Intl.Segmenter contract check passed for 63/64/65 grapheme boundaries, ZWJ emoji, and whitespace folding"
      ]
    },
    {
      "id": "FACT-20260824-005-005",
      "revision": 1,
      "status": "accepted",
      "statement": "ArcOrbit 生产实现现在以 Workshop `content` 作为唯一完整待办文本，并通过共享 `taskDisplayTitle` 投影生成展示标题：首尾空白被移除，连续 Unicode 空白折叠为一个半角空格；不超过 64 个 extended grapheme clusters 时原样展示，超限时保留前 63 个并追加 `…`。Adapter、Automation active task、历史 session/Activity、验收来源和 CLI 标签消费该投影，完整 content 继续用于 Agent intent、搜索、编辑和服务端 mutation。Work 与 Automation 详情只展示一次保留换行的完整正文，当前运行和 Intervention Workbench 顶部标题保持单行有界。",
      "basis": "共享生产 helper、adapter/coordinator/store/renderer/CLI 数据流，以及 Unicode 边界、历史快照、静态 Renderer 和 Electron 体验回归测试一致。",
      "evidence": [
        "runtime/arcorbit/src/task-display-title.mjs:5",
        "runtime/arcorbit/src/task-source-adapter.mjs:486",
        "runtime/arcorbit/src/automation-coordinator.mjs:2571",
        "runtime/arcorbit/src/desktop/desktop-store.mjs",
        "runtime/arcorbit/src/interactive-cli-launcher.mjs",
        "runtime/arcorbit/desktop/renderer/renderer.js:84",
        "runtime/arcorbit/desktop/renderer/styles.css",
        "runtime/arcorbit/test/task-display-title.test.mjs",
        "runtime/arcorbit/test/task-source-adapter.test.mjs",
        "runtime/arcorbit/test/automation-coordinator.test.mjs",
        "runtime/arcorbit/test/desktop-store.test.mjs",
        "runtime/arcorbit/test/desktop-renderer.test.mjs",
        "runtime/arcorbit/test/experience-realization-electron.test.mjs",
        "Verification: npm run check — 384 tests, 377 passed, 7 environment-gated skips, 0 failed"
      ]
    }
  ],
  "state_impacts": [
    {
      "id": "IMPACT-20260824-005-001",
      "fact_id": "FACT-20260824-005-001",
      "fact_revision": 1,
      "target": {
        "kind": "software_decision",
        "ref": "data_and_state",
        "revision": 14
      },
      "effect": "upheld",
      "reason": "Workshop 仍是任务真相源且只持久化单一 `content`；ArcOrbit 的 `title` 是客户端派生投影，不是第二个服务端事实。",
      "gap_ids": [],
      "evidence": [
        "/Users/Glare/Library/Developer/ModularProgram/hoewo/workshop-todo/models/task.go:10",
        "runtime/arcorbit/src/workshop-platform-adapter.mjs:543"
      ]
    },
    {
      "id": "IMPACT-20260824-005-002",
      "fact_id": "FACT-20260824-005-005",
      "fact_revision": 1,
      "target": {
        "kind": "software_decision",
        "ref": "product_capabilities",
        "revision": 25
      },
      "effect": "upheld",
      "reason": "ArcOrbit 已在所有关键标题场景实现统一的 64-grapheme 展示投影，并在详情中只保留一次完整正文。",
      "gap_ids": [],
      "evidence": [
        "runtime/arcorbit/src/task-display-title.mjs",
        "runtime/arcorbit/src/task-source-adapter.mjs",
        "runtime/arcorbit/desktop/renderer/renderer.js",
        "Verification: npm run check — 384 tests, 377 passed, 7 environment-gated skips, 0 failed"
      ]
    },
    {
      "id": "IMPACT-20260824-005-003",
      "fact_id": "FACT-20260824-005-005",
      "fact_revision": 1,
      "target": {
        "kind": "software_decision",
        "ref": "experience_and_interaction",
        "revision": 38
      },
      "effect": "upheld",
      "reason": "Work 与 Automation 详情正文已经去重，标题换行被折叠，当前运行与 Workbench 顶部保持单行有界。",
      "gap_ids": [],
      "evidence": [
        "runtime/arcorbit/desktop/renderer/renderer.js",
        "runtime/arcorbit/desktop/renderer/styles.css",
        "runtime/arcorbit/test/experience-realization-electron.test.mjs"
      ]
    },
    {
      "id": "IMPACT-20260824-005-004",
      "fact_id": "FACT-20260824-005-005",
      "fact_revision": 1,
      "target": {
        "kind": "software_decision",
        "ref": "technical_foundation",
        "revision": 32
      },
      "effect": "upheld",
      "reason": "共享 `taskDisplayTitle` 已成为 adapter、Automation、Store、Renderer 与 CLI 的权威展示投影边界；完整 content 没有被展示快照替代。",
      "gap_ids": [],
      "evidence": [
        "runtime/arcorbit/src/task-display-title.mjs",
        "runtime/arcorbit/src/task-source-adapter.mjs",
        "runtime/arcorbit/src/automation-coordinator.mjs",
        "runtime/arcorbit/src/desktop/desktop-store.mjs",
        "runtime/arcorbit/src/interactive-cli-launcher.mjs"
      ]
    },
    {
      "id": "IMPACT-20260824-005-005",
      "fact_id": "FACT-20260824-005-005",
      "fact_revision": 1,
      "target": {
        "kind": "software_decision",
        "ref": "quality_and_validation",
        "revision": 10
      },
      "effect": "upheld",
      "reason": "验证已覆盖 Unicode 空白、63/64/65 grapheme 边界、组合字符、代理对、ZWJ emoji、内容保真、历史快照、详情去重和 Electron 单行高度。",
      "gap_ids": [],
      "evidence": [
        "runtime/arcorbit/test/task-display-title.test.mjs",
        "runtime/arcorbit/test/task-source-adapter.test.mjs",
        "runtime/arcorbit/test/automation-coordinator.test.mjs",
        "runtime/arcorbit/test/desktop-store.test.mjs",
        "runtime/arcorbit/test/desktop-renderer.test.mjs",
        "runtime/arcorbit/test/experience-realization-electron.test.mjs",
        "Verification: 135 focused ArcOrbit tests passed, 0 failed",
        "Verification: npm run check — 384 tests, 377 passed, 7 environment-gated skips, 0 failed"
      ]
    },
    {
      "id": "IMPACT-20260824-005-006",
      "fact_id": "FACT-20260824-005-004",
      "fact_revision": 1,
      "target": {
        "kind": "software_decision",
        "ref": "data_and_state",
        "revision": 14
      },
      "effect": "upheld",
      "reason": "Workshop `content` 仍是唯一任务文本真相；ArcOrbit 展示标题及历史标签快照是可重建或只读的展示投影，不成为第二个服务端或搜索事实。",
      "gap_ids": [],
      "evidence": [
        "arckit/spec/agentic-software-development/arcorbit-work-management.md",
        "arckit/tech/arcorbit/platform-composition-solution.md"
      ]
    },
    {
      "id": "IMPACT-20260824-005-007",
      "fact_id": "FACT-20260824-005-005",
      "fact_revision": 1,
      "target": {
        "kind": "software_decision",
        "ref": "visual_language",
        "revision": 2
      },
      "effect": "upheld",
      "reason": "生产 Renderer 与 CSS 已统一紧凑标题的单行、溢出隐藏和省略呈现，完整正文仅在正文区域保留换行展示。",
      "gap_ids": [],
      "evidence": [
        "runtime/arcorbit/desktop/renderer/renderer.js",
        "runtime/arcorbit/desktop/renderer/styles.css",
        "runtime/arcorbit/test/experience-realization-electron.test.mjs"
      ]
    }
  ],
  "gaps": [
    {
      "id": "GAP-ESTABLISH-TODO-TEXT-CONTRACT-IMPACT",
      "status": "resolved",
      "goal": "建立 Arcorbit 待办从服务端字段、适配器、本地投影到详情页及人工介入页标题消费点的当前端到端事实，并明确与统一文本要求之间的差异和准确影响范围。",
      "reason": "实施对象、兼容边界、迁移需求及验收范围取决于当前服务端契约和各展示面的真实实现；这些前置事实尚未被 Case 接受，不能在本轮直接据此修改下游实现。",
      "derived_from": [
        "FACT-TODO-UNIFIED-TEXT-REQUIREMENT"
      ],
      "blocked_by": [],
      "priority_basis": {
        "blocking": "high：准确实现范围依赖该前置事实。",
        "uncertainty": "high：尚不清楚服务端是否已统一字段，以及客户端是否自行保存或派生标题。",
        "risk": "medium：错误合并可能破坏 API 兼容、历史待办或 Automation 人工介入展示。",
        "user_impact": "high：当前长内容会造成详情重复和标题区域过高。"
      },
      "responsibility": "agent",
      "evidence_required": [
        "服务端待办数据模型与 API 契约证据。",
        "ArcOrbit 主进程适配、存储与 Renderer 投影证据。",
        "待办详情、列表及 Automation 人工介入顶部的标题/内容消费点清单。",
        "覆盖换行折叠、单行截断、省略号和完整内容展示的现有测试证据或明确测试缺口。"
      ],
      "resolution": {
        "id": "GAP-ESTABLISH-TODO-TEXT-CONTRACT-IMPACT",
        "status": "resolved",
        "outcome": "已建立待办单字段服务契约、ArcOrbit 双投影差异、全部关键展示消费点及测试缺口。",
        "reason": "Workshop 模型、请求和响应均只有 `content`；ArcOrbit 的确定性代码路径完整解释了详情重复、换行标题及人工介入顶部过高三个现象，相关测试同时证明当前适配边界但未覆盖目标展示规则。",
        "evidence": [
          "/Users/Glare/Library/Developer/ModularProgram/hoewo/workshop-todo/models/task.go:10",
          "/Users/Glare/Library/Developer/ModularProgram/hoewo/workshop-todo/handler/task.go:20",
          "/Users/Glare/Library/Developer/ModularProgram/hoewo/workshop-todo/handler/task.go:259",
          "/Users/Glare/Library/Developer/ModularProgram/hoewo/workshop-todo/api/task.md:69",
          "runtime/arcorbit/src/task-source-adapter.mjs:485",
          "runtime/arcorbit/src/workshop-platform-adapter.mjs:543",
          "runtime/arcorbit/src/automation-coordinator.mjs:1055",
          "runtime/arcorbit/src/automation-coordinator.mjs:1852",
          "runtime/arcorbit/desktop/renderer/renderer.js:1295",
          "runtime/arcorbit/desktop/renderer/renderer.js:1364",
          "runtime/arcorbit/desktop/renderer/renderer.js:2685",
          "runtime/arcorbit/desktop/renderer/renderer.js:2825",
          "runtime/arcorbit/desktop/renderer/renderer.js:2928",
          "runtime/arcorbit/desktop/renderer/styles.css:416",
          "runtime/arcorbit/desktop/renderer/styles.css:800",
          "Verification: 123 selected ArcOrbit tests passed, 0 failed",
          "Verification: go test ./models ./handler passed"
        ],
        "occurred_at": "2026-08-24T11:03:19.920Z"
      }
    },
    {
      "id": "GAP-20260824-005-001",
      "status": "resolved",
      "goal": "明确并持久化 ArcOrbit 待办展示标题的唯一派生契约，包括正文归一化方式、精确长度上限与省略号语义、派生/持久化边界、详情去重规则、Work 与 Automation 消费面及回归验收口径。",
      "reason": "用户已明确单行、换行折叠和超限省略，但尚未给出精确长度上限；当前代码还存在多个直接复制和消费点。在精确契约被接受前，实施范围虽已定位，但实现与验收仍可能产生不一致。",
      "derived_from": [
        "FACT-TODO-UNIFIED-TEXT-REQUIREMENT",
        "FACT-20260824-005-001",
        "FACT-20260824-005-002",
        "FACT-20260824-005-003"
      ],
      "blocked_by": [],
      "priority_basis": {
        "blocking": "high：实现和验收依赖一个精确、统一的展示标题契约。",
        "uncertainty": "medium：单行与省略行为明确，但精确长度和派生所有权尚未接受。",
        "risk": "medium：分散实现会让 Work、Automation、session 和 CLI 标签继续漂移。",
        "user_impact": "high：直接决定长待办在详情与人工介入中的体验。"
      },
      "responsibility": "agent",
      "evidence_required": [
        "明确的正文到标题归一化、长度计算及省略号规则。",
        "产品规格、交互规则和技术投影边界的持久证据。",
        "Work、Automation、session/CLI 标签各消费面的验收映射。",
        "后续实现所需的换行、边界长度、Unicode、详情去重和顶部高度测试口径。"
      ],
      "resolution": {
        "id": "GAP-20260824-005-001",
        "status": "resolved",
        "outcome": "已明确并持久化 ArcOrbit 待办展示标题的唯一派生契约、消费面、持久化边界、详情去重规则和回归验收口径。",
        "reason": "产品、交互、技术和视觉载体一致规定：Workshop 只保存完整 `content`；展示标题折叠 Unicode 空白，最多 64 个 grapheme clusters，超限取前 63 个并追加 `…`；详情只展示一次完整正文，紧凑标题场景统一消费派生值。索引、线框与 Unicode 边界检查均通过。",
        "evidence": [
          "arckit/spec/agentic-software-development/arcorbit-work-management.md",
          "arckit/spec/agentic-software-development/runtime-automation-workspace.md",
          "arckit/interaction/task-browser/interaction.md",
          "arckit/interaction/task-browser/daily-work.html",
          "arckit/interaction/automation-workspace/interaction.md",
          "arckit/interaction/automation-workspace/default.html",
          "arckit/interaction/automation-workspace/intervention-workbench.html",
          "arckit/tech/arcorbit/platform-composition-solution.md",
          "arckit/visual/_library/brief.md",
          "runtime/arcorbit/src/chat-coordinator.mjs:634",
          "Verification: git diff --check passed",
          "Verification: all updated INDEX line counts match their artifacts",
          "Verification: Intl.Segmenter contract check passed for 63/64/65 grapheme boundaries, ZWJ emoji, and whitespace folding"
        ],
        "occurred_at": "2026-08-24T11:15:45.614Z"
      }
    },
    {
      "id": "GAP-20260824-005-002",
      "status": "resolved",
      "goal": "在 ArcOrbit 生产 adapter、Automation 投影/持久化和 Renderer 中实现已接受的统一待办展示标题契约，移除 Work 与 Automation 详情的同源正文重复，并用跨层测试证明全部消费面一致。",
      "reason": "本轮已经接受精确契约和验收边界，但现有代码仍直接复制完整正文为 title；实际用户体验和 accepted facts 尚未兑现。实现依赖本轮新接受的 64-grapheme、快照和消费面规则，因此必须等待 post-commit fresh-read 后独立执行。",
      "derived_from": [
        "FACT-TODO-UNIFIED-TEXT-REQUIREMENT",
        "FACT-20260824-005-002",
        "FACT-20260824-005-003",
        "FACT-20260824-005-004"
      ],
      "blocked_by": [],
      "priority_basis": {
        "blocking": "high：Case 的实际问题解决和 completion review 均依赖生产实现。",
        "uncertainty": "low：契约、消费面和验收边界已精确接受。",
        "risk": "medium：需处理历史 session/Activity 标签兼容并避免改变 Agent operator input。",
        "user_impact": "high：直接修复详情重复和人工介入标题过高。"
      },
      "responsibility": "agent",
      "evidence_required": [
        "共享标题投影实现，证明 Unicode 空白折叠、63/64/65 grapheme 边界、组合字符与 emoji 不被拆分。",
        "Adapter、Automation active task、session/Activity、验收问题来源和 CLI 标签统一消费展示标题，完整 content 继续作为 Agent intent、搜索和 mutation 输入。",
        "Work Inspector 与 Automation Task Inspector 不重复展示同源标题和正文，Workbench 与当前运行顶部保持单行有界。",
        "相关 Node 单元测试、Renderer/Electron 交互测试和既有 ArcOrbit 回归测试通过。"
      ],
      "resolution": {
        "id": "GAP-20260824-005-002",
        "status": "resolved",
        "outcome": "已在 ArcOrbit 生产 adapter、Automation/Store、Renderer 与 CLI 中实现统一待办展示标题契约，并以单元、静态跨层和 Electron 体验测试证明全部关键消费面一致。",
        "reason": "共享投影函数折叠 Unicode 空白并按 extended grapheme clusters 安全截断；完整 `content` 保持原样用于 Agent intent、搜索和 mutation。Work 与 Automation 详情仅渲染一次正文，当前运行和 Workbench 标题具备单行有界样式；全量回归无失败。",
        "evidence": [
          "runtime/arcorbit/src/task-display-title.mjs:5",
          "runtime/arcorbit/src/task-source-adapter.mjs:486",
          "runtime/arcorbit/src/automation-coordinator.mjs:2571",
          "runtime/arcorbit/src/desktop/desktop-store.mjs",
          "runtime/arcorbit/src/interactive-cli-launcher.mjs",
          "runtime/arcorbit/desktop/renderer/renderer.js:84",
          "runtime/arcorbit/desktop/renderer/styles.css",
          "runtime/arcorbit/test/task-display-title.test.mjs",
          "runtime/arcorbit/test/experience-realization-electron.test.mjs",
          "Verification: 135 focused ArcOrbit tests passed, 0 failed",
          "Verification: npm run check — 384 tests, 377 passed, 7 environment-gated skips, 0 failed",
          "Verification: git diff --check passed"
        ],
        "occurred_at": "2026-08-24T12:47:03.162Z"
      }
    }
  ],
  "content_revision": 3,
  "completion_review": {
    "status": "clean",
    "policy": {
      "initial_max_cycles": 10,
      "source": "runtime/arcorbit/config/case-policy.json",
      "snapshotted_at": "2026-08-24T10:55:02.984Z"
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
          "arckit/spec/agentic-software-development/arcorbit-work-management.md",
          "arckit/spec/agentic-software-development/runtime-automation-workspace.md",
          "arckit/interaction/task-browser/interaction.md",
          "arckit/interaction/automation-workspace/interaction.md",
          "arckit/tech/arcorbit/platform-composition-solution.md",
          "arckit/visual/_library/brief.md",
          "runtime/arcorbit/src/task-display-title.mjs",
          "runtime/arcorbit/src/task-source-adapter.mjs",
          "runtime/arcorbit/src/automation-coordinator.mjs",
          "runtime/arcorbit/src/desktop/desktop-store.mjs",
          "runtime/arcorbit/src/interactive-cli-launcher.mjs",
          "runtime/arcorbit/desktop/renderer/renderer.js",
          "runtime/arcorbit/desktop/renderer/styles.css",
          "runtime/arcorbit/test/task-display-title.test.mjs",
          "runtime/arcorbit/test/task-source-adapter.test.mjs",
          "runtime/arcorbit/test/automation-coordinator.test.mjs",
          "runtime/arcorbit/test/desktop-store.test.mjs",
          "runtime/arcorbit/test/desktop-renderer.test.mjs",
          "runtime/arcorbit/test/experience-realization-electron.test.mjs",
          "Review verification: 135 focused ArcOrbit tests passed, 0 failed",
          "Accepted implementation verification: npm run check — 384 tests, 377 passed, 7 environment-gated skips, 0 failed",
          "Verification: git diff --check passed"
        ],
        "occurred_at": "2026-08-24T12:51:59.665Z"
      }
    ],
    "evidence": [
      "arckit/spec/agentic-software-development/arcorbit-work-management.md",
      "arckit/spec/agentic-software-development/runtime-automation-workspace.md",
      "arckit/interaction/task-browser/interaction.md",
      "arckit/interaction/automation-workspace/interaction.md",
      "arckit/tech/arcorbit/platform-composition-solution.md",
      "arckit/visual/_library/brief.md",
      "runtime/arcorbit/src/task-display-title.mjs",
      "runtime/arcorbit/src/task-source-adapter.mjs",
      "runtime/arcorbit/src/automation-coordinator.mjs",
      "runtime/arcorbit/src/desktop/desktop-store.mjs",
      "runtime/arcorbit/src/interactive-cli-launcher.mjs",
      "runtime/arcorbit/desktop/renderer/renderer.js",
      "runtime/arcorbit/desktop/renderer/styles.css",
      "runtime/arcorbit/test/task-display-title.test.mjs",
      "runtime/arcorbit/test/task-source-adapter.test.mjs",
      "runtime/arcorbit/test/automation-coordinator.test.mjs",
      "runtime/arcorbit/test/desktop-store.test.mjs",
      "runtime/arcorbit/test/desktop-renderer.test.mjs",
      "runtime/arcorbit/test/experience-realization-electron.test.mjs",
      "Review verification: 135 focused ArcOrbit tests passed, 0 failed",
      "Accepted implementation verification: npm run check — 384 tests, 377 passed, 7 environment-gated skips, 0 failed",
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
      "goal": "核对 Workshop 服务端模型/API、ArcOrbit adapters/Store/Renderer/Automation 消费链和现有测试，建立统一文本要求的准确差异与影响范围。",
      "outcome": "completed",
      "gap_selection": {
        "mode": "candidate",
        "basis": "Fresh snapshot 显示原 claim 未写入，当前 Case 的调查 Gap 仍为 ready；它直接阻塞当前需求的准确实现范围。",
        "snapshot_token": "aab255b5433668813095aefaa8e79868c8c210a5c6e4ff47a60f5dd880b8f48f",
        "selected_ref": "case-gap:CASE-20260824-005:GAP-ESTABLISH-TODO-TEXT-CONTRACT-IMPACT",
        "comparison_summary": "继续选择当前 Case 的端到端契约调查 Gap；四个无直接依赖且需要另建 Case 的 Project gaps 延期。",
        "fresh_discovery_summary": "调查未发现需抢占所选 Gap 的 fresh candidate；形成一个后续前置 Gap，用于明确可复用展示标题的精确边界并沉淀长期预期。",
        "considered": [
          {
            "ref": "project-gap:GAP-agent-scenario-evaluation",
            "source": "persisted",
            "eligibility": "case_required",
            "disposition": "deferred",
            "priority_basis": {
              "blocking": "不阻塞当前待办语义需求。",
              "uncertainty": "high",
              "risk": "high",
              "user_impact": "低于当前直接体验问题。"
            },
            "reason": "需要独立 Case，且与本轮端到端字段调查没有依赖关系。"
          },
          {
            "ref": "project-gap:GAP-runtime-resilience-and-adapters",
            "source": "persisted",
            "eligibility": "case_required",
            "disposition": "deferred",
            "priority_basis": {
              "blocking": "不阻塞当前字段与展示语义调查。",
              "uncertainty": "medium",
              "risk": "high",
              "user_impact": "当前需求更直接。"
            },
            "reason": "Runtime resilience 是独立事项，不能替代当前待办数据流证据。"
          },
          {
            "ref": "project-gap:GAP-security-real-project-validation",
            "source": "persisted",
            "eligibility": "case_required",
            "disposition": "deferred",
            "priority_basis": {
              "blocking": "不阻塞当前需求。",
              "uncertainty": "medium",
              "risk": "high",
              "user_impact": "当前需求更直接。"
            },
            "reason": "需要真实权限项目的独立 Case，与标题投影无直接依赖。"
          },
          {
            "ref": "project-gap:GAP-cross-record-audit",
            "source": "persisted",
            "eligibility": "case_required",
            "disposition": "deferred",
            "priority_basis": {
              "blocking": "不阻塞当前需求。",
              "uncertainty": "medium",
              "risk": "high",
              "user_impact": "当前体验问题更直接。"
            },
            "reason": "跨记录审计需要独立 Case，本轮没有 ledger 一致性前置依赖。"
          },
          {
            "ref": "case-gap:CASE-20260824-005:GAP-ESTABLISH-TODO-TEXT-CONTRACT-IMPACT",
            "source": "persisted",
            "eligibility": "ready",
            "disposition": "selected",
            "priority_basis": {
              "blocking": "high：准确实现范围依赖该事实。",
              "uncertainty": "high：调查前不清楚双字段源头。",
              "risk": "medium：误改服务端会扩大兼容风险。",
              "user_impact": "high：详情重复及人工介入标题过高。"
            },
            "reason": "该 Gap 是当前 Case 唯一 ready 候选，并直接建立实施所需的 source-of-truth、投影与消费面事实。"
          }
        ]
      },
      "selected_gap": {
        "id": "GAP-ESTABLISH-TODO-TEXT-CONTRACT-IMPACT",
        "responsibility": "agent",
        "goal": "建立 Arcorbit 待办从服务端字段、适配器、本地投影到详情页及人工介入页标题消费点的当前端到端事实，并明确与统一文本要求之间的差异和准确影响范围。",
        "reason": "实施对象、兼容边界、迁移需求及验收范围取决于当前服务端契约和各展示面的真实实现；这些前置事实尚未被 Case 接受，不能在本轮直接据此修改下游实现。",
        "derived_from": [
          "FACT-TODO-UNIFIED-TEXT-REQUIREMENT"
        ],
        "blocked_by": [],
        "priority_basis": {
          "blocking": "high：准确实现范围依赖该前置事实。",
          "uncertainty": "high：尚不清楚服务端是否已统一字段，以及客户端是否自行保存或派生标题。",
          "risk": "medium：错误合并可能破坏 API 兼容、历史待办或 Automation 人工介入展示。",
          "user_impact": "high：当前长内容会造成详情重复和标题区域过高。"
        },
        "evidence_required": [
          "服务端待办数据模型与 API 契约证据。",
          "ArcOrbit 主进程适配、存储与 Renderer 投影证据。",
          "待办详情、列表及 Automation 人工介入顶部的标题/内容消费点清单。",
          "覆盖换行折叠、单行截断、省略号和完整内容展示的现有测试证据或明确测试缺口。"
        ]
      },
      "planned_transition": {
        "goal": "核对 Workshop 服务端模型/API、ArcOrbit adapters/Store/Renderer/Automation 消费链和现有测试，建立统一文本要求的准确差异与影响范围。",
        "expected_state_change": "所选调查 Gap 被解析为可信端到端事实；受影响的 Project targets 与尚未确定的精确展示标题契约成为显式状态。"
      },
      "accepted_state_delta": {
        "resolved_gap": {
          "id": "GAP-ESTABLISH-TODO-TEXT-CONTRACT-IMPACT",
          "status": "resolved",
          "outcome": "已建立待办单字段服务契约、ArcOrbit 双投影差异、全部关键展示消费点及测试缺口。",
          "reason": "Workshop 模型、请求和响应均只有 `content`；ArcOrbit 的确定性代码路径完整解释了详情重复、换行标题及人工介入顶部过高三个现象，相关测试同时证明当前适配边界但未覆盖目标展示规则。",
          "evidence": [
            "/Users/Glare/Library/Developer/ModularProgram/hoewo/workshop-todo/models/task.go:10",
            "/Users/Glare/Library/Developer/ModularProgram/hoewo/workshop-todo/handler/task.go:20",
            "/Users/Glare/Library/Developer/ModularProgram/hoewo/workshop-todo/handler/task.go:259",
            "/Users/Glare/Library/Developer/ModularProgram/hoewo/workshop-todo/api/task.md:69",
            "runtime/arcorbit/src/task-source-adapter.mjs:485",
            "runtime/arcorbit/src/workshop-platform-adapter.mjs:543",
            "runtime/arcorbit/src/automation-coordinator.mjs:1055",
            "runtime/arcorbit/src/automation-coordinator.mjs:1852",
            "runtime/arcorbit/desktop/renderer/renderer.js:1295",
            "runtime/arcorbit/desktop/renderer/renderer.js:1364",
            "runtime/arcorbit/desktop/renderer/renderer.js:2685",
            "runtime/arcorbit/desktop/renderer/renderer.js:2825",
            "runtime/arcorbit/desktop/renderer/renderer.js:2928",
            "runtime/arcorbit/desktop/renderer/styles.css:416",
            "runtime/arcorbit/desktop/renderer/styles.css:800",
            "Verification: 123 selected ArcOrbit tests passed, 0 failed",
            "Verification: go test ./models ./handler passed"
          ]
        },
        "facts_added": [
          {
            "id": "FACT-20260824-005-001",
            "revision": 1,
            "status": "accepted",
            "statement": "Workshop Todo 服务端任务的持久模型、创建/更新请求、创建/更新响应和公开 API 契约均只有一个正文 `content` 字段，不存在任务 `title` 字段；ArcOrbit 创建和更新待办也只向服务端提交 `content`。因此服务端单字段要求已经实现，无需服务端字段合并或数据迁移。",
            "basis": "服务端模型、handler、API 文档和 ArcOrbit platform adapter 写入路径一致。",
            "evidence": [
              "/Users/Glare/Library/Developer/ModularProgram/hoewo/workshop-todo/models/task.go:10",
              "/Users/Glare/Library/Developer/ModularProgram/hoewo/workshop-todo/handler/task.go:20",
              "/Users/Glare/Library/Developer/ModularProgram/hoewo/workshop-todo/handler/task.go:259",
              "/Users/Glare/Library/Developer/ModularProgram/hoewo/workshop-todo/api/task.md:69",
              "runtime/arcorbit/src/workshop-platform-adapter.mjs:543",
              "Verification: go test ./models ./handler passed"
            ]
          },
          {
            "id": "FACT-20260824-005-002",
            "revision": 1,
            "status": "accepted",
            "statement": "ArcOrbit 的 `normalizeTask` 当前把服务端同一正文同时投影成完整 `content` 和 `title`，仅做 `trim`，没有折叠内部换行、字符上限或省略号。派生 `title` 随后写入 Automation active task、验收反馈标题和 session/CLI 标签，并由 Work 列表、Automation 队列、当前运行卡片和 Intervention Workbench 顶部消费；表格单元格只有 CSS 视觉 ellipsis，而当前运行及 Workbench 标题没有单行限高或截断规则。",
            "basis": "ArcOrbit adapter、Automation coordinator、Renderer 和 CSS 的确定性数据流与三个报告现象完全匹配。",
            "evidence": [
              "runtime/arcorbit/src/task-source-adapter.mjs:485",
              "runtime/arcorbit/src/automation-coordinator.mjs:600",
              "runtime/arcorbit/src/automation-coordinator.mjs:1055",
              "runtime/arcorbit/src/automation-coordinator.mjs:1852",
              "runtime/arcorbit/src/automation-coordinator.mjs:2438",
              "runtime/arcorbit/desktop/renderer/renderer.js:1295",
              "runtime/arcorbit/desktop/renderer/renderer.js:2685",
              "runtime/arcorbit/desktop/renderer/renderer.js:2928",
              "runtime/arcorbit/desktop/renderer/styles.css:416",
              "runtime/arcorbit/desktop/renderer/styles.css:800"
            ]
          },
          {
            "id": "FACT-20260824-005-003",
            "revision": 1,
            "status": "accepted",
            "statement": "Work Inspector 与 Automation Task Inspector 当前先展示派生 `title`，再展示同源完整 `content`，因此服务端仅返回 `content` 时仍会重复正文。现有测试证明服务端单字段写入、`content` 优先作为 Agent intent 以及 `content` 被直接派生为 `title`，但没有覆盖换行折叠、明确字符上限、省略号、详情不重复或 Automation 顶部单行高度。",
            "basis": "Renderer 模板与现有 adapter/coordinator/renderer 测试的直接检查及聚焦测试执行。",
            "evidence": [
              "runtime/arcorbit/desktop/renderer/renderer.js:1364",
              "runtime/arcorbit/desktop/renderer/renderer.js:2825",
              "runtime/arcorbit/test/task-source-adapter.test.mjs:5",
              "runtime/arcorbit/test/automation-coordinator.test.mjs:14",
              "runtime/arcorbit/test/workshop-platform-adapter.test.mjs:71",
              "runtime/arcorbit/test/fixtures/organization-center-electron.mjs:89",
              "Verification: 123 selected ArcOrbit tests passed, 0 failed"
            ]
          }
        ],
        "facts_superseded": [],
        "impacts_added": [
          {
            "id": "IMPACT-20260824-005-001",
            "fact_id": "FACT-20260824-005-001",
            "fact_revision": 1,
            "target": {
              "kind": "software_decision",
              "ref": "data_and_state",
              "revision": 14
            },
            "effect": "upheld",
            "reason": "Workshop 仍是任务真相源且只持久化单一 `content`；ArcOrbit 的 `title` 是客户端派生投影，不是第二个服务端事实。",
            "gap_ids": [],
            "evidence": [
              "/Users/Glare/Library/Developer/ModularProgram/hoewo/workshop-todo/models/task.go:10",
              "runtime/arcorbit/src/workshop-platform-adapter.mjs:543"
            ]
          },
          {
            "id": "IMPACT-20260824-005-002",
            "fact_id": "FACT-20260824-005-002",
            "fact_revision": 1,
            "target": {
              "kind": "software_decision",
              "ref": "product_capabilities",
              "revision": 24
            },
            "effect": "threatened",
            "reason": "现有产品能力决定没有恢复待办正文与展示标题的区别，实际客户端也未实现用户接受的有界标题行为。",
            "gap_ids": [
              "GAP-20260824-005-001"
            ],
            "evidence": [
              "runtime/arcorbit/src/task-source-adapter.mjs:485",
              "runtime/arcorbit/desktop/renderer/renderer.js:2928"
            ]
          },
          {
            "id": "IMPACT-20260824-005-003",
            "fact_id": "FACT-20260824-005-003",
            "fact_revision": 1,
            "target": {
              "kind": "software_decision",
              "ref": "experience_and_interaction",
              "revision": 37
            },
            "effect": "threatened",
            "reason": "当前详情重复展示同源文本，人工介入顶部也缺少单行有界标题规则；精确交互契约尚未持久化。",
            "gap_ids": [
              "GAP-20260824-005-001"
            ],
            "evidence": [
              "runtime/arcorbit/desktop/renderer/renderer.js:1364",
              "runtime/arcorbit/desktop/renderer/renderer.js:2825",
              "runtime/arcorbit/desktop/renderer/renderer.js:2928"
            ]
          },
          {
            "id": "IMPACT-20260824-005-004",
            "fact_id": "FACT-20260824-005-002",
            "fact_revision": 1,
            "target": {
              "kind": "software_decision",
              "ref": "technical_foundation",
              "revision": 31
            },
            "effect": "threatened",
            "reason": "当前没有一个权威、可复用的待办展示标题投影边界；原始正文被多个层级直接复制并持久化为未限长标签。",
            "gap_ids": [
              "GAP-20260824-005-001"
            ],
            "evidence": [
              "runtime/arcorbit/src/task-source-adapter.mjs:485",
              "runtime/arcorbit/src/automation-coordinator.mjs:1055",
              "runtime/arcorbit/src/automation-coordinator.mjs:1852"
            ]
          },
          {
            "id": "IMPACT-20260824-005-005",
            "fact_id": "FACT-20260824-005-003",
            "fact_revision": 1,
            "target": {
              "kind": "software_decision",
              "ref": "quality_and_validation",
              "revision": 9
            },
            "effect": "threatened",
            "reason": "现有验证没有覆盖统一正文派生标题的换行、上限、省略号、详情去重及人工介入高度回归。",
            "gap_ids": [
              "GAP-20260824-005-001"
            ],
            "evidence": [
              "runtime/arcorbit/test/task-source-adapter.test.mjs:5",
              "runtime/arcorbit/test/automation-coordinator.test.mjs:14",
              "runtime/arcorbit/test/fixtures/organization-center-electron.mjs:89"
            ]
          }
        ],
        "impacts_updated": [],
        "gaps_added": [
          {
            "id": "GAP-20260824-005-001",
            "status": "open",
            "goal": "明确并持久化 ArcOrbit 待办展示标题的唯一派生契约，包括正文归一化方式、精确长度上限与省略号语义、派生/持久化边界、详情去重规则、Work 与 Automation 消费面及回归验收口径。",
            "reason": "用户已明确单行、换行折叠和超限省略，但尚未给出精确长度上限；当前代码还存在多个直接复制和消费点。在精确契约被接受前，实施范围虽已定位，但实现与验收仍可能产生不一致。",
            "derived_from": [
              "FACT-TODO-UNIFIED-TEXT-REQUIREMENT",
              "FACT-20260824-005-001",
              "FACT-20260824-005-002",
              "FACT-20260824-005-003"
            ],
            "blocked_by": [],
            "priority_basis": {
              "blocking": "high：实现和验收依赖一个精确、统一的展示标题契约。",
              "uncertainty": "medium：单行与省略行为明确，但精确长度和派生所有权尚未接受。",
              "risk": "medium：分散实现会让 Work、Automation、session 和 CLI 标签继续漂移。",
              "user_impact": "high：直接决定长待办在详情与人工介入中的体验。"
            },
            "responsibility": "agent",
            "evidence_required": [
              "明确的正文到标题归一化、长度计算及省略号规则。",
              "产品规格、交互规则和技术投影边界的持久证据。",
              "Work、Automation、session/CLI 标签各消费面的验收映射。",
              "后续实现所需的换行、边界长度、Unicode、详情去重和顶部高度测试口径。"
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
        "project_revision": 212,
        "judgments": [
          {
            "invariant_ref": "product-expectations-remain-recoverable",
            "disposition": "threatened",
            "reason": "新的待办标题/正文产品规则已接受，但精确标题上限、派生边界和长期规格尚未持久化。",
            "fact_refs": [
              "FACT-TODO-UNIFIED-TEXT-REQUIREMENT",
              "FACT-20260824-005-002"
            ],
            "evidence": [
              "runtime/arcorbit/src/task-source-adapter.mjs:485"
            ],
            "gap_refs": [
              "GAP-20260824-005-001"
            ]
          },
          {
            "invariant_ref": "interaction-expectations-remain-recoverable",
            "disposition": "threatened",
            "reason": "详情去重和人工介入顶部单行标题是实际相关的新交互要求，现有交互证据尚未恢复精确规则。",
            "fact_refs": [
              "FACT-TODO-UNIFIED-TEXT-REQUIREMENT",
              "FACT-20260824-005-003"
            ],
            "evidence": [
              "runtime/arcorbit/desktop/renderer/renderer.js:1364",
              "runtime/arcorbit/desktop/renderer/renderer.js:2928"
            ],
            "gap_refs": [
              "GAP-20260824-005-001"
            ]
          },
          {
            "invariant_ref": "visual-language-remains-consistent",
            "disposition": "threatened",
            "reason": "表格目前依赖 CSS ellipsis，而当前运行和 Workbench 标题没有同等约束；跨表面的单行标题视觉规则不一致。",
            "fact_refs": [
              "FACT-20260824-005-002"
            ],
            "evidence": [
              "runtime/arcorbit/desktop/renderer/styles.css:416",
              "runtime/arcorbit/desktop/renderer/styles.css:426",
              "runtime/arcorbit/desktop/renderer/styles.css:800"
            ],
            "gap_refs": [
              "GAP-20260824-005-001"
            ]
          },
          {
            "invariant_ref": "technical-decisions-remain-explainable",
            "disposition": "threatened",
            "reason": "服务端单字段边界明确，但 ArcOrbit 尚无权威的正文到展示标题投影与派生持久化规则。",
            "fact_refs": [
              "FACT-20260824-005-001",
              "FACT-20260824-005-002"
            ],
            "evidence": [
              "/Users/Glare/Library/Developer/ModularProgram/hoewo/workshop-todo/models/task.go:10",
              "runtime/arcorbit/src/task-source-adapter.mjs:485"
            ],
            "gap_refs": [
              "GAP-20260824-005-001"
            ]
          },
          {
            "invariant_ref": "accepted-facts-are-realized",
            "disposition": "threatened",
            "reason": "服务端已实现单字段，但 ArcOrbit 详情与 Automation 标题区尚未实现已接受的去重、换行折叠和有界省略行为。",
            "fact_refs": [
              "FACT-TODO-UNIFIED-TEXT-REQUIREMENT",
              "FACT-20260824-005-003"
            ],
            "evidence": [
              "runtime/arcorbit/desktop/renderer/renderer.js:1364",
              "runtime/arcorbit/desktop/renderer/renderer.js:2685",
              "runtime/arcorbit/desktop/renderer/renderer.js:2928"
            ],
            "gap_refs": [
              "GAP-20260824-005-001"
            ]
          },
          {
            "invariant_ref": "material-risks-have-credible-evidence",
            "disposition": "upheld",
            "reason": "服务端误改风险、客户端重复投影范围和缺失测试均由可重复的源代码检查及聚焦测试结果支撑；本轮未声称风险已被修复。",
            "fact_refs": [
              "FACT-20260824-005-001",
              "FACT-20260824-005-002",
              "FACT-20260824-005-003"
            ],
            "evidence": [
              "/Users/Glare/Library/Developer/ModularProgram/hoewo/workshop-todo/models/task.go:10",
              "runtime/arcorbit/src/task-source-adapter.mjs:485",
              "runtime/arcorbit/desktop/renderer/renderer.js:1364",
              "Verification: 123 selected ArcOrbit tests passed, 0 failed",
              "Verification: go test ./models ./handler passed"
            ],
            "gap_refs": []
          }
        ]
      },
      "evidence": [
        "Current operator input, 2026-08-24",
        "/Users/Glare/Library/Developer/ModularProgram/hoewo/workshop-todo/models/task.go:10",
        "/Users/Glare/Library/Developer/ModularProgram/hoewo/workshop-todo/handler/task.go:20",
        "/Users/Glare/Library/Developer/ModularProgram/hoewo/workshop-todo/api/task.md:69",
        "runtime/arcorbit/src/task-source-adapter.mjs:485",
        "runtime/arcorbit/src/workshop-platform-adapter.mjs:543",
        "runtime/arcorbit/src/automation-coordinator.mjs:1055",
        "runtime/arcorbit/src/automation-coordinator.mjs:1852",
        "runtime/arcorbit/desktop/renderer/renderer.js:1364",
        "runtime/arcorbit/desktop/renderer/renderer.js:2685",
        "runtime/arcorbit/desktop/renderer/renderer.js:2825",
        "runtime/arcorbit/desktop/renderer/renderer.js:2928",
        "Verification: 123 selected ArcOrbit tests passed, 0 failed",
        "Verification: go test ./models ./handler passed"
      ],
      "runtime_result_ref": "arckit-runtime://runs/RUN-20260824-105225201Z",
      "occurred_at": "2026-08-24T11:03:19.920Z"
    },
    {
      "round": 2,
      "transition_schema_version": "arckit-case-transition/v8",
      "goal": "确定统一待办展示标题的归一化、Unicode 长度、省略号、派生持久化、详情去重和消费面规则，并同步维护产品规格、交互源与线框、技术方案和视觉策略。",
      "outcome": "completed",
      "gap_selection": {
        "mode": "candidate",
        "basis": "Fresh post-commit snapshot 显示 GAP-20260824-005-001 是当前 Case 唯一 ready candidate；它直接阻塞实现范围和验收口径，且用户影响高于四个需要独立 Case 的 Project gaps。",
        "snapshot_token": "41627546bed0c878c8fe4ca9b7ad8d2ad725f4769db4825daa46ca353d881c4a",
        "selected_ref": "case-gap:CASE-20260824-005:GAP-20260824-005-001",
        "comparison_summary": "选择当前 Case 的精确展示标题契约 Gap；延期四个与待办文本投影没有直接依赖、且需要另建 Case 的 Project gaps。",
        "fresh_discovery_summary": "未发现需要抢占所选 Gap 的 fresh candidate。契约明确后暴露一个依赖该契约的后续实现与验证 Gap，本轮仅记录并等待 post-commit fresh-read。",
        "considered": [
          {
            "ref": "project-gap:GAP-agent-scenario-evaluation",
            "source": "persisted",
            "eligibility": "case_required",
            "disposition": "deferred",
            "priority_basis": {
              "blocking": "不阻塞当前待办标题契约。",
              "uncertainty": "high",
              "risk": "high",
              "user_impact": "低于当前直接体验问题。"
            },
            "reason": "需要独立 Case，不能替代当前标题归一化、持久化和验收边界的确定。"
          },
          {
            "ref": "project-gap:GAP-runtime-resilience-and-adapters",
            "source": "persisted",
            "eligibility": "case_required",
            "disposition": "deferred",
            "priority_basis": {
              "blocking": "不阻塞当前文本投影契约。",
              "uncertainty": "medium",
              "risk": "high",
              "user_impact": "当前待办体验更直接。"
            },
            "reason": "Runtime resilience 是独立事项，与本轮标题长度和消费面决策没有前置依赖。"
          },
          {
            "ref": "project-gap:GAP-security-real-project-validation",
            "source": "persisted",
            "eligibility": "case_required",
            "disposition": "deferred",
            "priority_basis": {
              "blocking": "不阻塞当前契约。",
              "uncertainty": "medium",
              "risk": "high",
              "user_impact": "当前待办体验更直接。"
            },
            "reason": "需要真实权限项目的独立验证，与标题投影无直接依赖。"
          },
          {
            "ref": "project-gap:GAP-cross-record-audit",
            "source": "persisted",
            "eligibility": "case_required",
            "disposition": "deferred",
            "priority_basis": {
              "blocking": "不阻塞当前契约。",
              "uncertainty": "medium",
              "risk": "high",
              "user_impact": "当前体验问题更直接。"
            },
            "reason": "跨记录审计需要独立 Case，本轮没有 ledger 一致性前置依赖。"
          },
          {
            "ref": "case-gap:CASE-20260824-005:GAP-20260824-005-001",
            "source": "persisted",
            "eligibility": "ready",
            "disposition": "selected",
            "priority_basis": {
              "blocking": "high：实现和验收依赖精确统一的展示标题契约。",
              "uncertainty": "medium：精确长度、Unicode 计数和派生持久化边界尚未接受。",
              "risk": "medium：分散规则会使 Work、Automation、session 和 CLI 标签漂移。",
              "user_impact": "high：直接决定长待办在详情和人工介入中的体验。"
            },
            "reason": "该 Gap 是当前 Case 唯一 ready candidate，能够在不实施下游代码的前提下明确产品、交互、技术、视觉和验证契约。"
          }
        ]
      },
      "selected_gap": {
        "id": "GAP-20260824-005-001",
        "responsibility": "agent",
        "goal": "明确并持久化 ArcOrbit 待办展示标题的唯一派生契约，包括正文归一化方式、精确长度上限与省略号语义、派生/持久化边界、详情去重规则、Work 与 Automation 消费面及回归验收口径。",
        "reason": "用户已明确单行、换行折叠和超限省略，但尚未给出精确长度上限；当前代码还存在多个直接复制和消费点。在精确契约被接受前，实施范围虽已定位，但实现与验收仍可能产生不一致。",
        "derived_from": [
          "FACT-TODO-UNIFIED-TEXT-REQUIREMENT",
          "FACT-20260824-005-001",
          "FACT-20260824-005-002",
          "FACT-20260824-005-003"
        ],
        "blocked_by": [],
        "priority_basis": {
          "blocking": "high：实现和验收依赖一个精确、统一的展示标题契约。",
          "uncertainty": "medium：单行与省略行为明确，但精确长度和派生所有权尚未接受。",
          "risk": "medium：分散实现会让 Work、Automation、session 和 CLI 标签继续漂移。",
          "user_impact": "high：直接决定长待办在详情与人工介入中的体验。"
        },
        "evidence_required": [
          "明确的正文到标题归一化、长度计算及省略号规则。",
          "产品规格、交互规则和技术投影边界的持久证据。",
          "Work、Automation、session/CLI 标签各消费面的验收映射。",
          "后续实现所需的换行、边界长度、Unicode、详情去重和顶部高度测试口径。"
        ]
      },
      "planned_transition": {
        "goal": "确定统一待办展示标题的归一化、Unicode 长度、省略号、派生持久化、详情去重和消费面规则，并同步维护产品规格、交互源与线框、技术方案和视觉策略。",
        "expected_state_change": "所选契约 Gap 被解析；相关 Project decisions 获得可恢复的精确规则；现有实现差异绑定到新的实现与验证 Gap。"
      },
      "accepted_state_delta": {
        "resolved_gap": {
          "id": "GAP-20260824-005-001",
          "status": "resolved",
          "outcome": "已明确并持久化 ArcOrbit 待办展示标题的唯一派生契约、消费面、持久化边界、详情去重规则和回归验收口径。",
          "reason": "产品、交互、技术和视觉载体一致规定：Workshop 只保存完整 `content`；展示标题折叠 Unicode 空白，最多 64 个 grapheme clusters，超限取前 63 个并追加 `…`；详情只展示一次完整正文，紧凑标题场景统一消费派生值。索引、线框与 Unicode 边界检查均通过。",
          "evidence": [
            "arckit/spec/agentic-software-development/arcorbit-work-management.md",
            "arckit/spec/agentic-software-development/runtime-automation-workspace.md",
            "arckit/interaction/task-browser/interaction.md",
            "arckit/interaction/task-browser/daily-work.html",
            "arckit/interaction/automation-workspace/interaction.md",
            "arckit/interaction/automation-workspace/default.html",
            "arckit/interaction/automation-workspace/intervention-workbench.html",
            "arckit/tech/arcorbit/platform-composition-solution.md",
            "arckit/visual/_library/brief.md",
            "runtime/arcorbit/src/chat-coordinator.mjs:634",
            "Verification: git diff --check passed",
            "Verification: all updated INDEX line counts match their artifacts",
            "Verification: Intl.Segmenter contract check passed for 63/64/65 grapheme boundaries, ZWJ emoji, and whitespace folding"
          ]
        },
        "facts_added": [
          {
            "id": "FACT-20260824-005-004",
            "revision": 1,
            "status": "accepted",
            "statement": "ArcOrbit 待办的唯一业务文本是 Workshop `content`。展示标题是只读派生值：去除首尾空白，将连续 Unicode 空白折叠为一个半角空格，再按 Unicode extended grapheme cluster 分段；归一化结果不超过 64 个 grapheme clusters 时原样展示，超限时保留前 63 个并追加单字符 `…`，最终最多 64 个 grapheme clusters且不得拆分组合字符、emoji sequence 或代理对。列表、父任务候选、Automation 队列、当前运行、人工介入顶部、确认对话、验收问题来源标签和 session/Activity/CLI 标签统一使用该值；历史标签可保存生成时快照但不得成为搜索、正文或服务端写回事实。Work 与 Automation 详情只展示一次保留换行的完整正文，标题区使用任务 ID、项目和状态识别对象。",
            "basis": "操作者的单字段与展示差异要求、已接受的端到端现状事实、ArcOrbit 既有 64 字符会话摘要尺度，以及本轮同步维护的产品、交互、技术和视觉结果规格。",
            "evidence": [
              "Current operator input, 2026-08-24",
              "case:fact:FACT-TODO-UNIFIED-TEXT-REQUIREMENT",
              "case:fact:FACT-20260824-005-001",
              "case:fact:FACT-20260824-005-002",
              "case:fact:FACT-20260824-005-003",
              "runtime/arcorbit/src/chat-coordinator.mjs:634",
              "arckit/spec/agentic-software-development/arcorbit-work-management.md",
              "arckit/spec/agentic-software-development/runtime-automation-workspace.md",
              "arckit/interaction/task-browser/interaction.md",
              "arckit/interaction/automation-workspace/interaction.md",
              "arckit/tech/arcorbit/platform-composition-solution.md",
              "arckit/visual/_library/brief.md",
              "Verification: Intl.Segmenter contract check passed for 63/64/65 grapheme boundaries, ZWJ emoji, and whitespace folding"
            ]
          }
        ],
        "facts_superseded": [],
        "impacts_added": [
          {
            "id": "IMPACT-20260824-005-006",
            "fact_id": "FACT-20260824-005-004",
            "fact_revision": 1,
            "target": {
              "kind": "software_decision",
              "ref": "data_and_state",
              "revision": 14
            },
            "effect": "upheld",
            "reason": "Workshop `content` 仍是唯一任务文本真相；ArcOrbit 展示标题及历史标签快照是可重建或只读的展示投影，不成为第二个服务端或搜索事实。",
            "gap_ids": [],
            "evidence": [
              "arckit/spec/agentic-software-development/arcorbit-work-management.md",
              "arckit/tech/arcorbit/platform-composition-solution.md"
            ]
          },
          {
            "id": "IMPACT-20260824-005-007",
            "fact_id": "FACT-20260824-005-004",
            "fact_revision": 1,
            "target": {
              "kind": "software_decision",
              "ref": "visual_language",
              "revision": 2
            },
            "effect": "threatened",
            "reason": "视觉策略已恢复统一单行有界标题规则，但生产 Renderer 的当前运行与 Workbench 标题尚未实现该约束。",
            "gap_ids": [
              "GAP-20260824-005-002"
            ],
            "evidence": [
              "arckit/visual/_library/brief.md",
              "runtime/arcorbit/desktop/renderer/styles.css:416",
              "runtime/arcorbit/desktop/renderer/styles.css:800"
            ]
          }
        ],
        "impacts_updated": [
          {
            "id": "IMPACT-20260824-005-002",
            "fact_id": "FACT-20260824-005-002",
            "fact_revision": 1,
            "target": {
              "kind": "software_decision",
              "ref": "product_capabilities",
              "revision": 25
            },
            "effect": "threatened",
            "reason": "统一展示标题的产品契约已经持久化，但客户端仍把完整正文直接复制为未限长 title，相关能力尚未实现。",
            "gap_ids": [
              "GAP-20260824-005-002"
            ],
            "evidence": [
              "arckit/spec/agentic-software-development/arcorbit-work-management.md",
              "arckit/spec/agentic-software-development/runtime-automation-workspace.md",
              "runtime/arcorbit/src/task-source-adapter.mjs:485"
            ]
          },
          {
            "id": "IMPACT-20260824-005-003",
            "fact_id": "FACT-20260824-005-003",
            "fact_revision": 1,
            "target": {
              "kind": "software_decision",
              "ref": "experience_and_interaction",
              "revision": 38
            },
            "effect": "threatened",
            "reason": "详情去重和人工介入顶部单行标题规则已经持久化并投影到线框，但生产 Renderer 仍重复详情正文并使用未限长标题。",
            "gap_ids": [
              "GAP-20260824-005-002"
            ],
            "evidence": [
              "arckit/interaction/task-browser/interaction.md",
              "arckit/interaction/task-browser/daily-work.html",
              "arckit/interaction/automation-workspace/interaction.md",
              "arckit/interaction/automation-workspace/intervention-workbench.html",
              "runtime/arcorbit/desktop/renderer/renderer.js:1364",
              "runtime/arcorbit/desktop/renderer/renderer.js:2928"
            ]
          },
          {
            "id": "IMPACT-20260824-005-004",
            "fact_id": "FACT-20260824-005-002",
            "fact_revision": 1,
            "target": {
              "kind": "software_decision",
              "ref": "technical_foundation",
              "revision": 32
            },
            "effect": "threatened",
            "reason": "共享 `display_title` 投影与持久化边界已经明确，但当前 adapter、Automation active task、session 和 CLI 标签尚未统一消费该边界。",
            "gap_ids": [
              "GAP-20260824-005-002"
            ],
            "evidence": [
              "arckit/tech/arcorbit/platform-composition-solution.md",
              "runtime/arcorbit/src/task-source-adapter.mjs:485",
              "runtime/arcorbit/src/automation-coordinator.mjs:1055",
              "runtime/arcorbit/src/automation-coordinator.mjs:1852"
            ]
          },
          {
            "id": "IMPACT-20260824-005-005",
            "fact_id": "FACT-20260824-005-003",
            "fact_revision": 1,
            "target": {
              "kind": "software_decision",
              "ref": "quality_and_validation",
              "revision": 10
            },
            "effect": "threatened",
            "reason": "验证口径已明确覆盖 Unicode、63/64/65 边界、详情去重和全部 Automation 消费面，但生产自动化测试尚未实现这些断言。",
            "gap_ids": [
              "GAP-20260824-005-002"
            ],
            "evidence": [
              "arckit/spec/agentic-software-development/arcorbit-work-management.md",
              "arckit/spec/agentic-software-development/runtime-automation-workspace.md",
              "arckit/tech/arcorbit/platform-composition-solution.md",
              "runtime/arcorbit/test/task-source-adapter.test.mjs:5",
              "runtime/arcorbit/test/automation-coordinator.test.mjs:14"
            ]
          }
        ],
        "gaps_added": [
          {
            "id": "GAP-20260824-005-002",
            "status": "open",
            "goal": "在 ArcOrbit 生产 adapter、Automation 投影/持久化和 Renderer 中实现已接受的统一待办展示标题契约，移除 Work 与 Automation 详情的同源正文重复，并用跨层测试证明全部消费面一致。",
            "reason": "本轮已经接受精确契约和验收边界，但现有代码仍直接复制完整正文为 title；实际用户体验和 accepted facts 尚未兑现。实现依赖本轮新接受的 64-grapheme、快照和消费面规则，因此必须等待 post-commit fresh-read 后独立执行。",
            "derived_from": [
              "FACT-TODO-UNIFIED-TEXT-REQUIREMENT",
              "FACT-20260824-005-002",
              "FACT-20260824-005-003",
              "FACT-20260824-005-004"
            ],
            "blocked_by": [],
            "priority_basis": {
              "blocking": "high：Case 的实际问题解决和 completion review 均依赖生产实现。",
              "uncertainty": "low：契约、消费面和验收边界已精确接受。",
              "risk": "medium：需处理历史 session/Activity 标签兼容并避免改变 Agent operator input。",
              "user_impact": "high：直接修复详情重复和人工介入标题过高。"
            },
            "responsibility": "agent",
            "evidence_required": [
              "共享标题投影实现，证明 Unicode 空白折叠、63/64/65 grapheme 边界、组合字符与 emoji 不被拆分。",
              "Adapter、Automation active task、session/Activity、验收问题来源和 CLI 标签统一消费展示标题，完整 content 继续作为 Agent intent、搜索和 mutation 输入。",
              "Work Inspector 与 Automation Task Inspector 不重复展示同源标题和正文，Workbench 与当前运行顶部保持单行有界。",
              "相关 Node 单元测试、Renderer/Electron 交互测试和既有 ArcOrbit 回归测试通过。"
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
            "observed_revision": 24,
            "set_decision": {
              "status": "settled",
              "statement": "ArcOrbit 保留 Setup Readiness、受监督的一待办一 thread Automation、trusted ledger transition、介入/恢复、验收反馈、Workshop 平台组合、Work 日常管理与产品反馈能力。Personal / Chat 升级为绑定本地 Product Workspace 的真实 Codex 自由对话，支持持久会话、固定 thread、流式消息、工具与审批状态、停止、失败/重启恢复、重命名和安全删除；会话列表直接按 Product Workspace 分组，每个项目默认展示最近 10 个会话并提供项目历史入口，新对话在首条消息前显式显示并允许切换目标工作区；Chat 不创建或转换 Idea、Work、Task、Case、ledger 或 Automation Run。Idea、Release、Operations 和 Engineering 继续作为 planning-only 工作空间。既有 Workshop realtime、Work、Feedback、Organization、Domain Profile、Automation human Gate 和分发边界保持不变。Work 使用弹出式多维筛选与单行无按钮列表，完整动作归于 Inspector；评论图片随时间线默认加载，点击后进入具备缩放、适配、实际大小、旋转、平移、重置和另存为的独立窗口。Feedback 使用不会随结果数量拉伸的单行列表，详情在独立内部区域滚动；反馈原文与沟通图片默认加载、支持局部失败重试，并与 Work 共用具备缩放、适配、实际大小、旋转、平移、重置和另存为的受控独立图片窗口；Feedback 默认逐项目探测 Workshop 双向会话能力，真实不可用时回退 V1。Automation 人工介入的消息列表直接复用 Chat Conversation Surface；Automation 的 gap/round、ledger、证据、恢复和执行控制能力保持完整并归入左右面板，执行总览提供完整墙钟时间、累计 gap 轮数及逐 gap 的目标、工作和结果。Workshop Task 只保存一个完整 `content`；ArcOrbit 在所有标题场景统一生成最多 64 个 Unicode grapheme clusters、超限以 `…` 结束的单行展示标题，详情只展示一次保留换行的完整正文。",
              "reason": "保留既有能力决定，并接受本轮已持久化的待办单字段、统一展示标题和详情去重产品契约。",
              "evidence": [
                "Current operator input, 2026-08-24",
                "arckit/spec/agentic-software-development/arcorbit-platform-capabilities.md",
                "arckit/spec/agentic-software-development/arcorbit-work-management.md",
                "arckit/spec/agentic-software-development/runtime-automation-workspace.md",
                "runtime/arcorbit/desktop/renderer/renderer.js",
                "runtime/arcorbit/src/work-task-image-viewer.mjs"
              ],
              "confidence": "high",
              "resume_condition": "当待办服务端文本模型、展示标题长度/Unicode 规则、详情内容所有权、Feedback 体验或 Automation 标题消费面变化时重审。"
            },
            "gap_refs": [
              "GAP-agent-scenario-evaluation"
            ],
            "reason": "所选 Gap 已明确产品级单字段正文与展示标题能力边界。",
            "evidence": [
              "arckit/spec/agentic-software-development/arcorbit-work-management.md",
              "arckit/spec/agentic-software-development/runtime-automation-workspace.md"
            ]
          },
          {
            "area_ref": "experience_and_interaction",
            "observed_revision": 37,
            "set_decision": {
              "status": "settled",
              "statement": "ArcOrbit 保持 Personal、Product Lifecycle、Organization 三组导航和既有 Work、Automation、Feedback、Organization、Setup、账户及产品反馈语义。Personal / Chat 使用按 Product Workspace 分组的会话列表、独立 transcript 和 Composer：页面无需预先选择项目，每个项目默认显示最近 10 个会话并在超出时从组底部展开完整历史；新对话在首条非空消息前显式显示目标工作区，默认取当前会话或最近成功使用的可用工作区，允许保留草稿快速切换，发送后会话固定绑定该本地 Product Workspace 和 Codex thread。支持选择、重命名、删除、跨页面后台运行和重启恢复。消息以稳定 item 流式更新，支持 Markdown、代码复制、折叠非空 reasoning、单行工具状态、用户审批和智能自动滚动。starting、running、waiting approval 状态均可停止；interrupt 保留部分回答，继续操作会在同一 thread 启动新 turn。删除活动会话先等待 interrupt 终态，失败时不部分删除。没有可用本地工作区时允许保留草稿但禁止发送，并提供配置恢复入口。Chat 不调用 state-driven Runtime，不转换其他对象；Automation task thread、human Gate、Composer 与执行控制保持独立，但人工介入中间消息区直接复用 Chat Conversation Surface。Idea、Release、Operations 和 Engineering 继续呈现计划交互。Chat 返回页面时先用缓存会话和 transcript 立即切换，再后台刷新并显示同步或失败状态；Work 横排筛选使用弹出菜单且列表单行无按钮，评论图片自动加载且在独立窗口完成常用查看操作，单图失败不阻塞时间线；Feedback 列表中的每条记录保持固定单行高度且不因记录较少而拉伸，详情由右栏内部滚动容器承载且滚动不改变列表位置，反馈原文和双向沟通图片默认加载，单图失败不阻塞详情并可就地重试，点击图片后与 Work 共用受控独立窗口。Automation 左栏承载任务、项目、边界、当前选择和介入控制；右栏承载完整执行墙钟时间、累计 gap 轮数、逐 gap 目标/工作/结果，以及 Run、token、Gate、ledger、Git、证据和结构化结果。Automation 专属 loop/round/ledger 事件不进入中间对话流。Work 待办状态切换必须立即确认新的选中状态，并显示与完整查询键匹配的缓存结果或明确加载态；远端刷新在后台执行，旧请求不得覆盖较新的选择，Automation、认证、组织、成员与 Feedback 刷新不得阻塞该交互，大列表不得通过同步整表重建阻塞 Renderer。待办列表、队列、当前运行、确认对话和 Intervention Workbench 顶部统一显示折叠空白且最多 64 个 Unicode grapheme clusters 的单行标题；Work 与 Automation 详情只展示一次保留换行的完整正文，Workbench 顶部保持固定高度。",
              "reason": "保留既有交互决定，并接受本轮 Task Browser 与 Automation Workbench 的统一标题、正文去重及单行高度规则。",
              "evidence": [
                "Current operator input, 2026-08-24",
                "arckit/interaction/platform-workspace/interaction.md",
                "arckit/interaction/platform-workspace/default.html",
                "arckit/interaction/task-browser/interaction.md",
                "arckit/interaction/task-browser/daily-work.html",
                "arckit/interaction/automation-workspace/interaction.md",
                "arckit/interaction/automation-workspace/default.html",
                "arckit/interaction/automation-workspace/intervention-workbench.html",
                "runtime/arcorbit/desktop/renderer/styles.css",
                "runtime/arcorbit/desktop/renderer/renderer.js"
              ],
              "confidence": "high",
              "resume_condition": "当待办标题归一化、详情正文所有权、Automation 顶部布局、Feedback 列表/图片或 Work 查询交互变化时重审。"
            },
            "gap_refs": [],
            "reason": "所选 Gap 已明确跨 Work 与 Automation 的标题和正文交互所有权。",
            "evidence": [
              "arckit/interaction/task-browser/interaction.md",
              "arckit/interaction/task-browser/daily-work.html",
              "arckit/interaction/automation-workspace/interaction.md",
              "arckit/interaction/automation-workspace/default.html",
              "arckit/interaction/automation-workspace/intervention-workbench.html"
            ]
          },
          {
            "area_ref": "technical_foundation",
            "observed_revision": 31,
            "set_decision": {
              "status": "settled",
              "statement": "Arckit 继续使用 repository-owned Markdown/JSON state 与 Node.js ESM ledger CLI；ArcOrbit 继续作为 Electron Desktop/Runtime host，并保留 policy-neutral Runtime Kernel、persistent one-thread-per-todo、Platform Coordinator、restricted Workshop adapters、utilityProcess Runtime、trusted in-process ledger entrypoints、project-only skill provisioning、Feedback SDK WebContents 和现代/旧版 realtime 协议边界。真实 Chat 的 accepted architecture 在 main process 增加独立 ChatCoordinator 和 kind=chat Store ownership，并从现有 Codex adapter 中抽取可复用 Conversation 层：app-server client、persistent thread start/resume、turn start/interrupt、通用事件 projector、token usage 和异步 approval provider。State-driven Runtime 只在该基础层之上保留 using-arckit、Agent Loop schema、fresh ledger snapshot、Gap Loop、Automation lease 和 closeout 语义，Chat 不复用这些语义。每个活动 Chat session 拥有与其固定项目根对应的 adapter owner；不同 Chat session 和 Automation owner 不共享活动 turn 或 lease。typed Chat IPC 只提供 snapshot/create/select/rename/delete/send/interrupt/approvalDecision；select 只持久化经 main process 验证的 Chat session 选择，不改变 draft、thread 或 session updated_at。Renderer 不能提供任意 cwd、thread id、Codex method、文件权限或 shell command。Chat 与 Automation Renderer 共享单一 Conversation Surface 模块和 scroll-follow/event-binding 行为，消费者仅提供规范化消息、Composer policy 与回调；Automation 专属类型由左右面板消费。Run Activity 以结构化 gap_rounds 持久化 round selection/closeout/work summary，任务级执行总览跨 transcript Runs 聚合，不解析被截断的消息文本。ArcOrbit Automation Agent 只输出绑定 fresh snapshot 的 Semantic Case Command；Agent 显式决定事实、Gap、影响、Project decision 与 invariant judgment 的业务语义，trusted Ledger Command Materializer 在 commit lock 内确定性分配身份与 revision、解析 local handle、展开反向关系、编译内部 Transition、完整校验 projected state 并原子提交，Runtime 不复制物化规则。Work 任务浏览采用独立的 query-owned 读投影：Renderer 以 Workset、项目范围、状态、搜索、多维筛选与日期组成稳定查询键，保存有界 stale-while-revalidate 缓存和请求代际；main-process Platform Coordinator 只提供该查询所需的分页或窗口化任务树、状态计数与标签元数据，不通过通用全量 snapshot 把 Automation、认证、组织、成员或 Feedback 串入状态切换。Renderer 使用分页或虚拟化与事件委托约束大列表同步 DOM 成本；Workshop 始终是任务真相源，查询缓存不成为第二真相源。Workshop Task 的唯一文本事实是完整 `content`；ArcOrbit 在共享归一化边界生成最多 64 个 Unicode extended grapheme clusters 的 `display_title`，超限取前 63 个并追加 `…`。该值只服务 Work/Automation/session/Activity/CLI 展示，可保存历史只读快照但不参与搜索、Agent intent、mutation 或服务端写回。",
              "reason": "保留既有技术基础，并接受本轮明确的共享 Task 文本投影、Unicode 计数和派生持久化边界。",
              "evidence": [
                "runtime/arcorbit/desktop/renderer/renderer.js:653-735,1165-1187",
                "runtime/arcorbit/src/platform-coordinator.mjs:61-174",
                "runtime/arcorbit/src/workshop-platform-adapter.mjs:85-100",
                "Controlled Electron latency and scale measurements, 2026-08-24",
                "arckit/tech/arcorbit/platform-composition-solution.md",
                "arckit/spec/agentic-software-development/arcorbit-work-management.md"
              ],
              "confidence": "high",
              "resume_condition": "当 Work 查询边界、Task 文本 source-of-truth、标题 Unicode/长度规则、派生快照所有权、Platform IPC 或 Semantic Case Command/Materializer 责任变化时重审。"
            },
            "gap_refs": [
              "GAP-runtime-resilience-and-adapters"
            ],
            "reason": "所选 Gap 已明确 adapter、投影、Store 标签和 Renderer 的统一技术边界。",
            "evidence": [
              "arckit/tech/arcorbit/platform-composition-solution.md"
            ]
          },
          {
            "area_ref": "quality_and_validation",
            "observed_revision": 9,
            "set_decision": {
              "status": "settled",
              "statement": "既有协议、Runtime、realtime、Work 和安全验证义务保持不变。真实 Chat 还必须以 adapter、Store、Coordinator、typed main/preload IPC、Renderer 和真实 app-server smoke 的跨层证据证明：首条消息幂等创建 session/thread；连续 turn resume 同一 thread；不同 Chat/Automation owner 隔离；稳定 item streaming、Markdown、reasoning/tool 投影和智能滚动正确；starting/running/waiting approval 均可 interrupt；部分输出和重启恢复不重复请求；活动删除先 interrupt 且无部分删除；审批异步并 fail closed；Renderer 无法覆盖 cwd/thread/method/command；Chat 不触发 using-arckit、ledger、Workshop mutation、Automation lease 或 human Gate。Chat 会话导航还必须证明：会话不受全局项目范围过滤并按 Product Workspace 确定分组；每组默认最多 10 条且仅在超出时出现对应历史入口；展开/收起不改变选择、草稿或后台 turn；新对话持续显示目标工作区，首次发送前切换保留草稿且不创建 session/thread，发送后不能迁移既有 thread/cwd。Automation 介入还必须证明 Chat 与 Automation 使用同一 Conversation Surface 实现和一致的 Markdown、reasoning、tool、approval/error、复制、外链与智能滚动行为；结构化跨 Run 汇总必须覆盖完整墙钟时间、累计 gap 轮数、逐 gap 目标/工作/结果、进行中和旧 Activity 兼容，并回归 Gate、恢复、ledger、Git、证据和执行控制未降级。Work 状态切换还必须用受控延迟和大列表 Electron 场景证明：选中反馈不等待远端；查询只触发 Work 所需数据；缓存键和请求代际阻止陈旧覆盖；1000 行规模不会同步创建或替换全部行节点；任务树、计数、选择、Inspector、筛选和失败恢复不回归。待办文本验证还必须跨 adapter、Automation Store/Coordinator、Renderer 与 Electron 证明：连续空白折叠；63/64/65 grapheme 边界；组合字符、代理对和 ZWJ emoji 不被拆分；超限只追加一个 `…`；完整 content 在 Agent intent、搜索和 mutation 中保真；历史标题快照不成为领域事实；Work/Automation 详情不重复；当前运行和 Workbench 顶部保持单行有界。",
              "reason": "保留既有验证义务，并接受本轮形成的统一待办文本投影跨层验收矩阵。",
              "evidence": [
                "runtime/arcorbit/test/work-navigation-electron.test.mjs",
                "Controlled Electron latency and scale measurements, 2026-08-24",
                "runtime/arcorbit/desktop/renderer/renderer.js:1165-1187",
                "arckit/spec/agentic-software-development/arcorbit-work-management.md",
                "arckit/spec/agentic-software-development/runtime-automation-workspace.md",
                "arckit/tech/arcorbit/platform-composition-solution.md",
                "Verification: Intl.Segmenter contract check passed for 63/64/65 grapheme boundaries, ZWJ emoji, and whitespace folding"
              ],
              "confidence": "high",
              "resume_condition": "当 Work 查询协议、标题归一化算法、Unicode 分段能力、展示消费面、缓存新鲜度或列表渲染策略变化时重审。"
            },
            "gap_refs": [
              "GAP-agent-scenario-evaluation",
              "GAP-cross-record-audit"
            ],
            "reason": "所选 Gap 已明确后续实现必须证明的标题、正文和跨层回归口径。",
            "evidence": [
              "arckit/spec/agentic-software-development/arcorbit-work-management.md",
              "arckit/spec/agentic-software-development/runtime-automation-workspace.md",
              "arckit/tech/arcorbit/platform-composition-solution.md"
            ]
          }
        ],
        "software_invariant_changes": [],
        "project_gap_changes": [],
        "selection_context_change": null,
        "evidence": [
          "Current operator input, 2026-08-24",
          "arckit/spec/agentic-software-development/arcorbit-work-management.md",
          "arckit/spec/agentic-software-development/runtime-automation-workspace.md",
          "arckit/interaction/task-browser/interaction.md",
          "arckit/interaction/automation-workspace/interaction.md",
          "arckit/tech/arcorbit/platform-composition-solution.md",
          "arckit/visual/_library/brief.md"
        ]
      },
      "invariant_assessment": {
        "project_revision": 212,
        "judgments": [
          {
            "invariant_ref": "product-expectations-remain-recoverable",
            "disposition": "upheld",
            "reason": "待办单字段正文、统一展示标题、精确长度、省略号、消费面和详情去重产品规则已写入稳定产品规格并同步进入 Project capability decision。",
            "fact_refs": [
              "FACT-TODO-UNIFIED-TEXT-REQUIREMENT",
              "FACT-20260824-005-004"
            ],
            "evidence": [
              "arckit/spec/agentic-software-development/arcorbit-work-management.md",
              "arckit/spec/agentic-software-development/runtime-automation-workspace.md"
            ],
            "gap_refs": []
          },
          {
            "invariant_ref": "interaction-expectations-remain-recoverable",
            "disposition": "upheld",
            "reason": "Task Browser 与 Automation Workbench 的标题、正文、单行高度、异常回退和页面消费规则已在交互源及线框投影中一致恢复。",
            "fact_refs": [
              "FACT-TODO-UNIFIED-TEXT-REQUIREMENT",
              "FACT-20260824-005-004"
            ],
            "evidence": [
              "arckit/interaction/task-browser/interaction.md",
              "arckit/interaction/task-browser/daily-work.html",
              "arckit/interaction/automation-workspace/interaction.md",
              "arckit/interaction/automation-workspace/default.html",
              "arckit/interaction/automation-workspace/intervention-workbench.html"
            ],
            "gap_refs": []
          },
          {
            "invariant_ref": "visual-language-remains-consistent",
            "disposition": "upheld",
            "reason": "视觉策略现在统一规定所有待办识别区域使用同一个单行有界标题，完整正文只在详情或上下文正文区出现一次；Work 与 Automation 线框使用相同层级。",
            "fact_refs": [
              "FACT-20260824-005-004"
            ],
            "evidence": [
              "arckit/visual/_library/brief.md",
              "arckit/interaction/task-browser/daily-work.html",
              "arckit/interaction/automation-workspace/default.html",
              "arckit/interaction/automation-workspace/intervention-workbench.html"
            ],
            "gap_refs": []
          },
          {
            "invariant_ref": "technical-decisions-remain-explainable",
            "disposition": "upheld",
            "reason": "Workshop `content` source-of-truth、共享 `display_title` 算法、Unicode 分段、历史快照和非领域持久化边界已在技术方案与 Project technical decision 中明确。",
            "fact_refs": [
              "FACT-20260824-005-001",
              "FACT-20260824-005-004"
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
            "reason": "服务端单字段已实现且长期契约已明确，但 ArcOrbit 当前仍直接复制完整正文为未限长 title，详情和 Automation 顶部尚未兑现 accepted contract。",
            "fact_refs": [
              "FACT-TODO-UNIFIED-TEXT-REQUIREMENT",
              "FACT-20260824-005-002",
              "FACT-20260824-005-003",
              "FACT-20260824-005-004"
            ],
            "evidence": [
              "runtime/arcorbit/src/task-source-adapter.mjs:485",
              "runtime/arcorbit/desktop/renderer/renderer.js:1364",
              "runtime/arcorbit/desktop/renderer/renderer.js:2685",
              "runtime/arcorbit/desktop/renderer/renderer.js:2825",
              "runtime/arcorbit/desktop/renderer/renderer.js:2928"
            ],
            "gap_refs": [
              "GAP-20260824-005-002"
            ]
          },
          {
            "invariant_ref": "material-risks-have-credible-evidence",
            "disposition": "upheld",
            "reason": "服务端误改、Unicode 截断、历史标签漂移、详情重复和跨消费面不一致风险均有源代码、稳定契约和可重复边界检查支撑；本轮没有声称生产实现已经完成。",
            "fact_refs": [
              "FACT-20260824-005-001",
              "FACT-20260824-005-002",
              "FACT-20260824-005-003",
              "FACT-20260824-005-004"
            ],
            "evidence": [
              "/Users/Glare/Library/Developer/ModularProgram/hoewo/workshop-todo/models/task.go:10",
              "runtime/arcorbit/src/task-source-adapter.mjs:485",
              "runtime/arcorbit/desktop/renderer/renderer.js:1364",
              "arckit/tech/arcorbit/platform-composition-solution.md",
              "Verification: 123 selected ArcOrbit tests passed, 0 failed",
              "Verification: go test ./models ./handler passed",
              "Verification: git diff --check passed",
              "Verification: Intl.Segmenter contract check passed for 63/64/65 grapheme boundaries, ZWJ emoji, and whitespace folding"
            ],
            "gap_refs": []
          }
        ]
      },
      "evidence": [
        "Current operator input, 2026-08-24",
        "arckit/spec/agentic-software-development/arcorbit-work-management.md",
        "arckit/spec/agentic-software-development/runtime-automation-workspace.md",
        "arckit/interaction/task-browser/interaction.md",
        "arckit/interaction/task-browser/daily-work.html",
        "arckit/interaction/automation-workspace/interaction.md",
        "arckit/interaction/automation-workspace/default.html",
        "arckit/interaction/automation-workspace/intervention-workbench.html",
        "arckit/tech/arcorbit/platform-composition-solution.md",
        "arckit/visual/_library/brief.md",
        "runtime/arcorbit/src/chat-coordinator.mjs:634",
        "Verification: git diff --check passed",
        "Verification: all updated INDEX line counts match their artifacts",
        "Verification: Intl.Segmenter contract check passed for 63/64/65 grapheme boundaries, ZWJ emoji, and whitespace folding"
      ],
      "runtime_result_ref": "arckit-runtime://runs/RUN-20260824-105225201Z",
      "occurred_at": "2026-08-24T11:15:45.614Z"
    },
    {
      "round": 3,
      "transition_schema_version": "arckit-case-transition/v8",
      "goal": "在共享标题投影、任务 adapter、Automation/Store、Renderer、CLI 和跨层测试中兑现已接受的统一待办文本契约。",
      "outcome": "completed",
      "gap_selection": {
        "mode": "candidate",
        "basis": "当前 Case 的生产实现 Gap 是唯一 ready candidate；它直接阻塞用户问题解决和 Completion Review，契约与验收边界已经由 fresh canonical facts 明确，实施不依赖本轮新发现的下游事实。",
        "snapshot_token": "f8ddd80a2eac8f065cdc8df98b34f45bf75389e47e335210395a5e6a73367e67",
        "selected_ref": "case-gap:CASE-20260824-005:GAP-20260824-005-002",
        "comparison_summary": "选择当前 Case 的统一待办标题生产实现 Gap；延期四个需要独立 Case、且与本次实现无前置依赖的 Project gaps。",
        "fresh_discovery_summary": "未发现需要抢占所选 Gap 的 fresh candidate；实现和验证没有暴露新的实质工作义务。",
        "considered": [
          {
            "ref": "project-gap:GAP-agent-scenario-evaluation",
            "source": "persisted",
            "eligibility": "case_required",
            "disposition": "deferred",
            "priority_basis": {
              "blocking": "不阻塞当前待办标题/正文实现。",
              "uncertainty": "high",
              "risk": "high",
              "user_impact": "低于当前直接体验问题。"
            },
            "reason": "需要独立 Case 验证通用动态 Gap 场景，与当前已确定的生产实现没有依赖关系。"
          },
          {
            "ref": "project-gap:GAP-runtime-resilience-and-adapters",
            "source": "persisted",
            "eligibility": "case_required",
            "disposition": "deferred",
            "priority_basis": {
              "blocking": "不阻塞当前实现。",
              "uncertainty": "medium",
              "risk": "high",
              "user_impact": "当前待办体验问题更直接。"
            },
            "reason": "Runtime resilience 与 adapter acceptance 是独立事项，不能替代本次展示标题实现。"
          },
          {
            "ref": "project-gap:GAP-security-real-project-validation",
            "source": "persisted",
            "eligibility": "case_required",
            "disposition": "deferred",
            "priority_basis": {
              "blocking": "不阻塞当前实现。",
              "uncertainty": "medium",
              "risk": "high",
              "user_impact": "当前体验问题更直接。"
            },
            "reason": "真实权限项目验证需要独立 Case，本次变更不扩大凭据或权限边界。"
          },
          {
            "ref": "project-gap:GAP-cross-record-audit",
            "source": "persisted",
            "eligibility": "case_required",
            "disposition": "deferred",
            "priority_basis": {
              "blocking": "不阻塞当前实现。",
              "uncertainty": "medium",
              "risk": "high",
              "user_impact": "当前待办体验问题更直接。"
            },
            "reason": "跨记录审计需要独立 Case，与标题投影实现没有 ledger 一致性前置依赖。"
          },
          {
            "ref": "case-gap:CASE-20260824-005:GAP-20260824-005-002",
            "source": "persisted",
            "eligibility": "ready",
            "disposition": "selected",
            "priority_basis": {
              "blocking": "high：Case 问题解决和 Completion Review 依赖生产实现。",
              "uncertainty": "low：算法、消费面和验收边界均已接受。",
              "risk": "medium：需要兼容历史标签且不得改变 Agent intent。",
              "user_impact": "high：直接修复详情重复和人工介入标题过高。"
            },
            "reason": "它是当前 Case 唯一 ready candidate，且可依据既有 accepted contract 在本轮完整实现和验证。"
          }
        ]
      },
      "selected_gap": {
        "id": "GAP-20260824-005-002",
        "responsibility": "agent",
        "goal": "在 ArcOrbit 生产 adapter、Automation 投影/持久化和 Renderer 中实现已接受的统一待办展示标题契约，移除 Work 与 Automation 详情的同源正文重复，并用跨层测试证明全部消费面一致。",
        "reason": "本轮已经接受精确契约和验收边界，但现有代码仍直接复制完整正文为 title；实际用户体验和 accepted facts 尚未兑现。实现依赖本轮新接受的 64-grapheme、快照和消费面规则，因此必须等待 post-commit fresh-read 后独立执行。",
        "derived_from": [
          "FACT-TODO-UNIFIED-TEXT-REQUIREMENT",
          "FACT-20260824-005-002",
          "FACT-20260824-005-003",
          "FACT-20260824-005-004"
        ],
        "blocked_by": [],
        "priority_basis": {
          "blocking": "high：Case 的实际问题解决和 completion review 均依赖生产实现。",
          "uncertainty": "low：契约、消费面和验收边界已精确接受。",
          "risk": "medium：需处理历史 session/Activity 标签兼容并避免改变 Agent operator input。",
          "user_impact": "high：直接修复详情重复和人工介入标题过高。"
        },
        "evidence_required": [
          "共享标题投影实现，证明 Unicode 空白折叠、63/64/65 grapheme 边界、组合字符与 emoji 不被拆分。",
          "Adapter、Automation active task、session/Activity、验收问题来源和 CLI 标签统一消费展示标题，完整 content 继续作为 Agent intent、搜索和 mutation 输入。",
          "Work Inspector 与 Automation Task Inspector 不重复展示同源标题和正文，Workbench 与当前运行顶部保持单行有界。",
          "相关 Node 单元测试、Renderer/Electron 交互测试和既有 ArcOrbit 回归测试通过。"
        ]
      },
      "planned_transition": {
        "goal": "在共享标题投影、任务 adapter、Automation/Store、Renderer、CLI 和跨层测试中兑现已接受的统一待办文本契约。",
        "expected_state_change": "ArcOrbit 生产状态从复制完整正文为未限长标题，转为统一的 64-grapheme 单行展示投影；详情正文去重、顶部高度和历史标签兼容得到实现证据，所选 Gap 可被解析。"
      },
      "accepted_state_delta": {
        "resolved_gap": {
          "id": "GAP-20260824-005-002",
          "status": "resolved",
          "outcome": "已在 ArcOrbit 生产 adapter、Automation/Store、Renderer 与 CLI 中实现统一待办展示标题契约，并以单元、静态跨层和 Electron 体验测试证明全部关键消费面一致。",
          "reason": "共享投影函数折叠 Unicode 空白并按 extended grapheme clusters 安全截断；完整 `content` 保持原样用于 Agent intent、搜索和 mutation。Work 与 Automation 详情仅渲染一次正文，当前运行和 Workbench 标题具备单行有界样式；全量回归无失败。",
          "evidence": [
            "runtime/arcorbit/src/task-display-title.mjs:5",
            "runtime/arcorbit/src/task-source-adapter.mjs:486",
            "runtime/arcorbit/src/automation-coordinator.mjs:2571",
            "runtime/arcorbit/src/desktop/desktop-store.mjs",
            "runtime/arcorbit/src/interactive-cli-launcher.mjs",
            "runtime/arcorbit/desktop/renderer/renderer.js:84",
            "runtime/arcorbit/desktop/renderer/styles.css",
            "runtime/arcorbit/test/task-display-title.test.mjs",
            "runtime/arcorbit/test/experience-realization-electron.test.mjs",
            "Verification: 135 focused ArcOrbit tests passed, 0 failed",
            "Verification: npm run check — 384 tests, 377 passed, 7 environment-gated skips, 0 failed",
            "Verification: git diff --check passed"
          ]
        },
        "facts_added": [
          {
            "id": "FACT-20260824-005-005",
            "revision": 1,
            "status": "accepted",
            "statement": "ArcOrbit 生产实现现在以 Workshop `content` 作为唯一完整待办文本，并通过共享 `taskDisplayTitle` 投影生成展示标题：首尾空白被移除，连续 Unicode 空白折叠为一个半角空格；不超过 64 个 extended grapheme clusters 时原样展示，超限时保留前 63 个并追加 `…`。Adapter、Automation active task、历史 session/Activity、验收来源和 CLI 标签消费该投影，完整 content 继续用于 Agent intent、搜索、编辑和服务端 mutation。Work 与 Automation 详情只展示一次保留换行的完整正文，当前运行和 Intervention Workbench 顶部标题保持单行有界。",
            "basis": "共享生产 helper、adapter/coordinator/store/renderer/CLI 数据流，以及 Unicode 边界、历史快照、静态 Renderer 和 Electron 体验回归测试一致。",
            "evidence": [
              "runtime/arcorbit/src/task-display-title.mjs:5",
              "runtime/arcorbit/src/task-source-adapter.mjs:486",
              "runtime/arcorbit/src/automation-coordinator.mjs:2571",
              "runtime/arcorbit/src/desktop/desktop-store.mjs",
              "runtime/arcorbit/src/interactive-cli-launcher.mjs",
              "runtime/arcorbit/desktop/renderer/renderer.js:84",
              "runtime/arcorbit/desktop/renderer/styles.css",
              "runtime/arcorbit/test/task-display-title.test.mjs",
              "runtime/arcorbit/test/task-source-adapter.test.mjs",
              "runtime/arcorbit/test/automation-coordinator.test.mjs",
              "runtime/arcorbit/test/desktop-store.test.mjs",
              "runtime/arcorbit/test/desktop-renderer.test.mjs",
              "runtime/arcorbit/test/experience-realization-electron.test.mjs",
              "Verification: npm run check — 384 tests, 377 passed, 7 environment-gated skips, 0 failed"
            ]
          }
        ],
        "facts_superseded": [
          {
            "id": "FACT-20260824-005-002",
            "revision": 1,
            "reason": "该事实描述的未限长 `title` 复制和无界消费已经被本轮生产实现替换。",
            "evidence": [
              "runtime/arcorbit/src/task-display-title.mjs:5",
              "runtime/arcorbit/src/task-source-adapter.mjs:486",
              "runtime/arcorbit/src/automation-coordinator.mjs:2571",
              "runtime/arcorbit/desktop/renderer/renderer.js:84"
            ]
          },
          {
            "id": "FACT-20260824-005-003",
            "revision": 1,
            "reason": "该事实描述的详情重复和目标规则测试缺口已经由本轮 Renderer 去重及跨层测试覆盖消除。",
            "evidence": [
              "runtime/arcorbit/desktop/renderer/renderer.js",
              "runtime/arcorbit/test/desktop-renderer.test.mjs",
              "runtime/arcorbit/test/experience-realization-electron.test.mjs",
              "Verification: npm run check — 384 tests, 377 passed, 7 environment-gated skips, 0 failed"
            ]
          }
        ],
        "impacts_added": [],
        "impacts_updated": [
          {
            "id": "IMPACT-20260824-005-002",
            "fact_id": "FACT-20260824-005-005",
            "fact_revision": 1,
            "target": {
              "kind": "software_decision",
              "ref": "product_capabilities",
              "revision": 25
            },
            "effect": "upheld",
            "reason": "ArcOrbit 已在所有关键标题场景实现统一的 64-grapheme 展示投影，并在详情中只保留一次完整正文。",
            "gap_ids": [],
            "evidence": [
              "runtime/arcorbit/src/task-display-title.mjs",
              "runtime/arcorbit/src/task-source-adapter.mjs",
              "runtime/arcorbit/desktop/renderer/renderer.js",
              "Verification: npm run check — 384 tests, 377 passed, 7 environment-gated skips, 0 failed"
            ]
          },
          {
            "id": "IMPACT-20260824-005-003",
            "fact_id": "FACT-20260824-005-005",
            "fact_revision": 1,
            "target": {
              "kind": "software_decision",
              "ref": "experience_and_interaction",
              "revision": 38
            },
            "effect": "upheld",
            "reason": "Work 与 Automation 详情正文已经去重，标题换行被折叠，当前运行与 Workbench 顶部保持单行有界。",
            "gap_ids": [],
            "evidence": [
              "runtime/arcorbit/desktop/renderer/renderer.js",
              "runtime/arcorbit/desktop/renderer/styles.css",
              "runtime/arcorbit/test/experience-realization-electron.test.mjs"
            ]
          },
          {
            "id": "IMPACT-20260824-005-004",
            "fact_id": "FACT-20260824-005-005",
            "fact_revision": 1,
            "target": {
              "kind": "software_decision",
              "ref": "technical_foundation",
              "revision": 32
            },
            "effect": "upheld",
            "reason": "共享 `taskDisplayTitle` 已成为 adapter、Automation、Store、Renderer 与 CLI 的权威展示投影边界；完整 content 没有被展示快照替代。",
            "gap_ids": [],
            "evidence": [
              "runtime/arcorbit/src/task-display-title.mjs",
              "runtime/arcorbit/src/task-source-adapter.mjs",
              "runtime/arcorbit/src/automation-coordinator.mjs",
              "runtime/arcorbit/src/desktop/desktop-store.mjs",
              "runtime/arcorbit/src/interactive-cli-launcher.mjs"
            ]
          },
          {
            "id": "IMPACT-20260824-005-005",
            "fact_id": "FACT-20260824-005-005",
            "fact_revision": 1,
            "target": {
              "kind": "software_decision",
              "ref": "quality_and_validation",
              "revision": 10
            },
            "effect": "upheld",
            "reason": "验证已覆盖 Unicode 空白、63/64/65 grapheme 边界、组合字符、代理对、ZWJ emoji、内容保真、历史快照、详情去重和 Electron 单行高度。",
            "gap_ids": [],
            "evidence": [
              "runtime/arcorbit/test/task-display-title.test.mjs",
              "runtime/arcorbit/test/task-source-adapter.test.mjs",
              "runtime/arcorbit/test/automation-coordinator.test.mjs",
              "runtime/arcorbit/test/desktop-store.test.mjs",
              "runtime/arcorbit/test/desktop-renderer.test.mjs",
              "runtime/arcorbit/test/experience-realization-electron.test.mjs",
              "Verification: 135 focused ArcOrbit tests passed, 0 failed",
              "Verification: npm run check — 384 tests, 377 passed, 7 environment-gated skips, 0 failed"
            ]
          },
          {
            "id": "IMPACT-20260824-005-007",
            "fact_id": "FACT-20260824-005-005",
            "fact_revision": 1,
            "target": {
              "kind": "software_decision",
              "ref": "visual_language",
              "revision": 2
            },
            "effect": "upheld",
            "reason": "生产 Renderer 与 CSS 已统一紧凑标题的单行、溢出隐藏和省略呈现，完整正文仅在正文区域保留换行展示。",
            "gap_ids": [],
            "evidence": [
              "runtime/arcorbit/desktop/renderer/renderer.js",
              "runtime/arcorbit/desktop/renderer/styles.css",
              "runtime/arcorbit/test/experience-realization-electron.test.mjs"
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
        "project_revision": 213,
        "judgments": [
          {
            "invariant_ref": "product-expectations-remain-recoverable",
            "disposition": "upheld",
            "reason": "稳定产品规格中的单字段正文、64-grapheme 展示标题和详情去重规则，已经由共享生产实现与全量回归兑现。",
            "fact_refs": [
              "FACT-TODO-UNIFIED-TEXT-REQUIREMENT",
              "FACT-20260824-005-004",
              "FACT-20260824-005-005"
            ],
            "evidence": [
              "arckit/spec/agentic-software-development/arcorbit-work-management.md",
              "arckit/spec/agentic-software-development/runtime-automation-workspace.md",
              "runtime/arcorbit/src/task-display-title.mjs",
              "runtime/arcorbit/desktop/renderer/renderer.js"
            ],
            "gap_refs": []
          },
          {
            "invariant_ref": "interaction-expectations-remain-recoverable",
            "disposition": "upheld",
            "reason": "Task Browser 和 Automation 的详情、标题、单行高度与内容保真交互，均由持久交互文档、生产 Renderer 和 Electron 测试一致证明。",
            "fact_refs": [
              "FACT-TODO-UNIFIED-TEXT-REQUIREMENT",
              "FACT-20260824-005-004",
              "FACT-20260824-005-005"
            ],
            "evidence": [
              "arckit/interaction/task-browser/interaction.md",
              "arckit/interaction/automation-workspace/interaction.md",
              "runtime/arcorbit/desktop/renderer/renderer.js",
              "runtime/arcorbit/test/experience-realization-electron.test.mjs"
            ],
            "gap_refs": []
          },
          {
            "invariant_ref": "visual-language-remains-consistent",
            "disposition": "upheld",
            "reason": "统一单行有界标题与正文唯一展示的视觉层级已在生产 CSS/Renderer 中实现，并由 Electron 行高断言验证。",
            "fact_refs": [
              "FACT-20260824-005-004",
              "FACT-20260824-005-005"
            ],
            "evidence": [
              "arckit/visual/_library/brief.md",
              "runtime/arcorbit/desktop/renderer/styles.css",
              "runtime/arcorbit/test/experience-realization-electron.test.mjs"
            ],
            "gap_refs": []
          },
          {
            "invariant_ref": "technical-decisions-remain-explainable",
            "disposition": "upheld",
            "reason": "Workshop `content` source-of-truth、共享 Unicode 投影、历史标签兼容和非领域持久化边界均有稳定技术说明与直接生产实现。",
            "fact_refs": [
              "FACT-20260824-005-001",
              "FACT-20260824-005-004",
              "FACT-20260824-005-005"
            ],
            "evidence": [
              "arckit/tech/arcorbit/platform-composition-solution.md",
              "runtime/arcorbit/src/task-display-title.mjs",
              "runtime/arcorbit/src/task-source-adapter.mjs",
              "runtime/arcorbit/src/automation-coordinator.mjs",
              "runtime/arcorbit/src/desktop/desktop-store.mjs"
            ],
            "gap_refs": []
          },
          {
            "invariant_ref": "accepted-facts-are-realized",
            "disposition": "upheld",
            "reason": "服务端单字段事实保持不变，ArcOrbit 已实现 accepted contract 的换行折叠、有界省略、内容保真、详情去重和人工介入顶部单行标题。",
            "fact_refs": [
              "FACT-TODO-UNIFIED-TEXT-REQUIREMENT",
              "FACT-20260824-005-001",
              "FACT-20260824-005-004",
              "FACT-20260824-005-005"
            ],
            "evidence": [
              "runtime/arcorbit/src/task-display-title.mjs",
              "runtime/arcorbit/src/task-source-adapter.mjs",
              "runtime/arcorbit/desktop/renderer/renderer.js",
              "runtime/arcorbit/desktop/renderer/styles.css",
              "Verification: npm run check — 384 tests, 377 passed, 7 environment-gated skips, 0 failed"
            ],
            "gap_refs": []
          },
          {
            "invariant_ref": "material-risks-have-credible-evidence",
            "disposition": "upheld",
            "reason": "Unicode 截断、历史标签漂移、Agent intent 失真、详情重复和顶部撑高风险均由直接生产边界、针对性单元测试、Electron 体验测试和全量回归控制；未修改已正确的服务端契约，也未加入临时诊断日志。",
            "fact_refs": [
              "FACT-20260824-005-001",
              "FACT-20260824-005-004",
              "FACT-20260824-005-005"
            ],
            "evidence": [
              "runtime/arcorbit/test/task-display-title.test.mjs",
              "runtime/arcorbit/test/task-source-adapter.test.mjs",
              "runtime/arcorbit/test/desktop-store.test.mjs",
              "runtime/arcorbit/test/experience-realization-electron.test.mjs",
              "Verification: 135 focused ArcOrbit tests passed, 0 failed",
              "Verification: npm run check — 384 tests, 377 passed, 7 environment-gated skips, 0 failed",
              "Verification: git diff --check passed"
            ],
            "gap_refs": []
          }
        ]
      },
      "evidence": [
        "Current operator input, 2026-08-24",
        "runtime/arcorbit/src/task-display-title.mjs",
        "runtime/arcorbit/src/task-source-adapter.mjs",
        "runtime/arcorbit/src/automation-coordinator.mjs",
        "runtime/arcorbit/src/desktop/desktop-store.mjs",
        "runtime/arcorbit/src/interactive-cli-launcher.mjs",
        "runtime/arcorbit/desktop/renderer/renderer.js",
        "runtime/arcorbit/desktop/renderer/styles.css",
        "runtime/arcorbit/test/task-display-title.test.mjs",
        "runtime/arcorbit/test/experience-realization-electron.test.mjs",
        "Verification: 135 focused ArcOrbit tests passed, 0 failed",
        "Verification: npm run check — 384 tests, 377 passed, 7 environment-gated skips, 0 failed",
        "Verification: git diff --check passed"
      ],
      "runtime_result_ref": "arckit-runtime://runs/RUN-20260824-124347226Z",
      "occurred_at": "2026-08-24T12:47:03.162Z"
    },
    {
      "round": 4,
      "transition_schema_version": "arckit-case-transition/v8",
      "goal": "独立审查 content revision 3 的实现正确性、问题解决程度、验证可信度、回归风险和最小性。",
      "outcome": "completed",
      "gap_selection": {
        "mode": "candidate",
        "basis": "所有普通 Case gaps 和 state impacts 已闭合；Completion Review 是当前 Case 唯一 ready candidate，直接决定 content revision 3 是否可以完成。",
        "snapshot_token": "9bba703ed6d01467f94189465ffc13b2e5f82096ca646136f4d7ef0387ed87f9",
        "selected_ref": "case-gap:CASE-20260824-005:CASE-20260824-005:completion-review:1",
        "comparison_summary": "选择当前 Case 的 Completion Review；延期四个需要独立 Case、与本次完成审查无依赖关系的 Project gaps。",
        "fresh_discovery_summary": "审查未发现需要形成 review finding 的 fresh error、omission 或 excess，也未发现其他需抢占的 fresh candidate。",
        "considered": [
          {
            "ref": "project-gap:GAP-agent-scenario-evaluation",
            "source": "persisted",
            "eligibility": "case_required",
            "disposition": "deferred",
            "priority_basis": {
              "blocking": "不阻塞当前 Case 完成审查。",
              "uncertainty": "high",
              "risk": "high",
              "user_impact": "低于当前 Case 的闭合需要。"
            },
            "reason": "通用动态 Gap 场景验证需要独立 Case，不属于本次实现正确性审查。"
          },
          {
            "ref": "project-gap:GAP-runtime-resilience-and-adapters",
            "source": "persisted",
            "eligibility": "case_required",
            "disposition": "deferred",
            "priority_basis": {
              "blocking": "不阻塞当前 Case 完成审查。",
              "uncertainty": "medium",
              "risk": "high",
              "user_impact": "当前 Case 闭合更直接。"
            },
            "reason": "Runtime resilience 与 adapter acceptance 是独立事项，本次改动未扩大其边界。"
          },
          {
            "ref": "project-gap:GAP-security-real-project-validation",
            "source": "persisted",
            "eligibility": "case_required",
            "disposition": "deferred",
            "priority_basis": {
              "blocking": "不阻塞当前 Case 完成审查。",
              "uncertainty": "medium",
              "risk": "high",
              "user_impact": "当前 Case 闭合更直接。"
            },
            "reason": "真实权限项目验证需要独立 Case；本次实现不涉及新的凭据或权限能力。"
          },
          {
            "ref": "project-gap:GAP-cross-record-audit",
            "source": "persisted",
            "eligibility": "case_required",
            "disposition": "deferred",
            "priority_basis": {
              "blocking": "不阻塞当前 Case 完成审查。",
              "uncertainty": "medium",
              "risk": "high",
              "user_impact": "当前 Case 闭合更直接。"
            },
            "reason": "跨记录审计需要独立 Case，与待办展示标题实现没有前置依赖。"
          },
          {
            "ref": "case-gap:CASE-20260824-005:CASE-20260824-005:completion-review:1",
            "source": "persisted",
            "eligibility": "ready",
            "disposition": "selected",
            "priority_basis": {
              "blocking": "high：Case 完成必须通过独立语义自查。",
              "uncertainty": "low：实现、契约和验证证据均已接受。",
              "risk": "high：需独立检查实现正确性与回归风险。",
              "user_impact": "high：决定用户报告的问题是否真正闭合。"
            },
            "reason": "它是当前 Case 唯一 ready candidate，且所有普通工作已完成，符合 Completion Review 的进入条件。"
          }
        ]
      },
      "selected_gap": {
        "id": "CASE-20260824-005:completion-review:1",
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
        "goal": "独立审查 content revision 3 的实现正确性、问题解决程度、验证可信度、回归风险和最小性。",
        "expected_state_change": "若五个维度均无 finding，则接受 clean Completion Review，使 Case 具备最终 resolved 条件；本轮不产生任何 Case 内容变更。"
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
            "arckit/spec/agentic-software-development/arcorbit-work-management.md",
            "arckit/spec/agentic-software-development/runtime-automation-workspace.md",
            "arckit/interaction/task-browser/interaction.md",
            "arckit/interaction/automation-workspace/interaction.md",
            "arckit/tech/arcorbit/platform-composition-solution.md",
            "arckit/visual/_library/brief.md",
            "runtime/arcorbit/src/task-display-title.mjs",
            "runtime/arcorbit/src/task-source-adapter.mjs",
            "runtime/arcorbit/src/automation-coordinator.mjs",
            "runtime/arcorbit/src/desktop/desktop-store.mjs",
            "runtime/arcorbit/src/interactive-cli-launcher.mjs",
            "runtime/arcorbit/desktop/renderer/renderer.js",
            "runtime/arcorbit/desktop/renderer/styles.css",
            "runtime/arcorbit/test/task-display-title.test.mjs",
            "runtime/arcorbit/test/task-source-adapter.test.mjs",
            "runtime/arcorbit/test/automation-coordinator.test.mjs",
            "runtime/arcorbit/test/desktop-store.test.mjs",
            "runtime/arcorbit/test/desktop-renderer.test.mjs",
            "runtime/arcorbit/test/experience-realization-electron.test.mjs",
            "Review verification: 135 focused ArcOrbit tests passed, 0 failed",
            "Accepted implementation verification: npm run check — 384 tests, 377 passed, 7 environment-gated skips, 0 failed",
            "Verification: git diff --check passed"
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
        "project_revision": 213,
        "judgments": [
          {
            "invariant_ref": "product-expectations-remain-recoverable",
            "disposition": "upheld",
            "reason": "独立审查确认单字段正文、64-grapheme 展示标题和详情去重规则在稳定规格与生产实现间一致，没有产品语义遗漏。",
            "fact_refs": [
              "FACT-TODO-UNIFIED-TEXT-REQUIREMENT",
              "FACT-20260824-005-004",
              "FACT-20260824-005-005"
            ],
            "evidence": [
              "arckit/spec/agentic-software-development/arcorbit-work-management.md",
              "arckit/spec/agentic-software-development/runtime-automation-workspace.md",
              "runtime/arcorbit/src/task-display-title.mjs",
              "runtime/arcorbit/desktop/renderer/renderer.js"
            ],
            "gap_refs": []
          },
          {
            "invariant_ref": "interaction-expectations-remain-recoverable",
            "disposition": "upheld",
            "reason": "Work、Automation、当前运行和 Intervention Workbench 的标题、正文及高度规则与持久交互预期一致。",
            "fact_refs": [
              "FACT-TODO-UNIFIED-TEXT-REQUIREMENT",
              "FACT-20260824-005-004",
              "FACT-20260824-005-005"
            ],
            "evidence": [
              "arckit/interaction/task-browser/interaction.md",
              "arckit/interaction/automation-workspace/interaction.md",
              "runtime/arcorbit/desktop/renderer/renderer.js",
              "runtime/arcorbit/test/experience-realization-electron.test.mjs"
            ],
            "gap_refs": []
          },
          {
            "invariant_ref": "visual-language-remains-consistent",
            "disposition": "upheld",
            "reason": "审查确认紧凑标题场景统一使用单行有界样式，完整正文只在详情或上下文区域出现一次。",
            "fact_refs": [
              "FACT-20260824-005-004",
              "FACT-20260824-005-005"
            ],
            "evidence": [
              "arckit/visual/_library/brief.md",
              "runtime/arcorbit/desktop/renderer/styles.css",
              "runtime/arcorbit/test/desktop-renderer.test.mjs",
              "runtime/arcorbit/test/experience-realization-electron.test.mjs"
            ],
            "gap_refs": []
          },
          {
            "invariant_ref": "technical-decisions-remain-explainable",
            "disposition": "upheld",
            "reason": "Workshop content source-of-truth、共享 Unicode 投影、历史标签兼容以及展示快照非领域事实边界均可从技术说明和直接实现恢复。",
            "fact_refs": [
              "FACT-20260824-005-001",
              "FACT-20260824-005-004",
              "FACT-20260824-005-005"
            ],
            "evidence": [
              "arckit/tech/arcorbit/platform-composition-solution.md",
              "runtime/arcorbit/src/task-display-title.mjs",
              "runtime/arcorbit/src/task-source-adapter.mjs",
              "runtime/arcorbit/src/automation-coordinator.mjs",
              "runtime/arcorbit/src/desktop/desktop-store.mjs"
            ],
            "gap_refs": []
          },
          {
            "invariant_ref": "accepted-facts-are-realized",
            "disposition": "upheld",
            "reason": "独立检查确认生产代码兑现换行折叠、安全省略、内容保真、详情去重和人工介入顶部单行标题，未发现 accepted fact 与实际状态偏差。",
            "fact_refs": [
              "FACT-TODO-UNIFIED-TEXT-REQUIREMENT",
              "FACT-20260824-005-001",
              "FACT-20260824-005-004",
              "FACT-20260824-005-005"
            ],
            "evidence": [
              "runtime/arcorbit/src/task-display-title.mjs",
              "runtime/arcorbit/src/task-source-adapter.mjs",
              "runtime/arcorbit/desktop/renderer/renderer.js",
              "runtime/arcorbit/desktop/renderer/styles.css",
              "Review verification: 135 focused ArcOrbit tests passed, 0 failed",
              "Accepted implementation verification: npm run check — 384 tests, 377 passed, 7 environment-gated skips, 0 failed"
            ],
            "gap_refs": []
          },
          {
            "invariant_ref": "material-risks-have-credible-evidence",
            "disposition": "upheld",
            "reason": "Unicode 截断、Agent intent 失真、历史标签漂移、详情重复和顶部撑高风险均有直接实现、边界测试、Electron 体验测试和全量回归证据；审查未发现证据夸大或未控制风险。",
            "fact_refs": [
              "FACT-20260824-005-001",
              "FACT-20260824-005-004",
              "FACT-20260824-005-005"
            ],
            "evidence": [
              "runtime/arcorbit/test/task-display-title.test.mjs",
              "runtime/arcorbit/test/task-source-adapter.test.mjs",
              "runtime/arcorbit/test/desktop-store.test.mjs",
              "runtime/arcorbit/test/desktop-renderer.test.mjs",
              "runtime/arcorbit/test/experience-realization-electron.test.mjs",
              "Review verification: 135 focused ArcOrbit tests passed, 0 failed",
              "Accepted implementation verification: npm run check — 384 tests, 377 passed, 7 environment-gated skips, 0 failed",
              "Verification: git diff --check passed"
            ],
            "gap_refs": []
          }
        ]
      },
      "evidence": [
        "Current trusted Case snapshot, content revision 3",
        "runtime/arcorbit/src/task-display-title.mjs",
        "runtime/arcorbit/src/task-source-adapter.mjs",
        "runtime/arcorbit/src/automation-coordinator.mjs",
        "runtime/arcorbit/src/desktop/desktop-store.mjs",
        "runtime/arcorbit/src/interactive-cli-launcher.mjs",
        "runtime/arcorbit/desktop/renderer/renderer.js",
        "runtime/arcorbit/desktop/renderer/styles.css",
        "runtime/arcorbit/test/task-display-title.test.mjs",
        "runtime/arcorbit/test/experience-realization-electron.test.mjs",
        "Review verification: 135 focused ArcOrbit tests passed, 0 failed",
        "Accepted implementation verification: npm run check — 384 tests, 377 passed, 7 environment-gated skips, 0 failed",
        "Verification: git diff --check passed"
      ],
      "runtime_result_ref": "arckit-runtime://runs/RUN-20260824-124347226Z",
      "occurred_at": "2026-08-24T12:51:59.665Z"
    }
  ],
  "case_resolution": {
    "status": "resolved",
    "stage": "resolved",
    "satisfied": [
      "GAP-ESTABLISH-TODO-TEXT-CONTRACT-IMPACT",
      "GAP-20260824-005-001",
      "GAP-20260824-005-002"
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
    "updated_at": "2026-08-24T12:51:59.665Z"
  }
}
```

## Round Notes

- Case history is canonical in Structured Record.rounds; keep prose notes exceptional.
