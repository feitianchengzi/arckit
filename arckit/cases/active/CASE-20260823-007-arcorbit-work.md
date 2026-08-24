# 优化 ArcOrbit Work 状态列表切换性能

Case: CASE-20260823-007
Status: active
Artifact Type: code
Selected Gap: none
Updated: 2026-08-24T05:45:19.979Z

## User Intent

定位 ArcOrbit Work 页面通过待办状态切换列表时明显卡顿的真实瓶颈，并在已验证的架构边界内完成可持续的性能优化。

## Structured Record

```json
{
  "schema_version": "development-case-record/v5",
  "id": "CASE-20260823-007",
  "title": "优化 ArcOrbit Work 状态列表切换性能",
  "status": "active",
  "artifact_type": "code",
  "created_at": "2026-08-23T21:46:41.163Z",
  "updated_at": "2026-08-24T05:45:19.979Z",
  "user_intent": "定位 ArcOrbit Work 页面通过待办状态切换列表时明显卡顿的真实瓶颈，并在已验证的架构边界内完成可持续的性能优化。",
  "expected_outcome": "状态列表切换达到可信的交互性能，修复基于可复现测量和明确的数据、状态与渲染责任边界，不引入临时旁路、重复状态源或破坏现有 Work 行为。",
  "project_state_ref": "arckit/project/state.record.json",
  "current_round": {
    "goal": "",
    "selected_gap": null
  },
  "facts": [
    {
      "id": "FACT-WORK-STATUS-SWITCH-LAG-REPORT",
      "revision": 1,
      "status": "accepted",
      "statement": "操作者报告 ArcOrbit Work 页面通过待办状态切换列表时特别卡，并要求采用正确、可持续的架构方案进行性能优化。",
      "basis": "当前操作者输入是本 Case 的直接问题报告和约束来源；它证明用户可感知问题存在，但不预判瓶颈位置或修复方案。",
      "evidence": [
        "Current operator input, 2026-08-24"
      ]
    },
    {
      "id": "FACT-20260823-007-001",
      "revision": 1,
      "status": "accepted",
      "statement": "Work 状态按钮的 openWorkState 只更新内存选择，不立即渲染；它随后调用默认 surface 的 refreshSnapshot，等待 Automation snapshot、认证状态以及包含 overview、organizations、members、tasks、feedback 的 Platform snapshot，完成后才统一呈现新的选中状态和列表。",
      "basis": "状态处理器、refreshSnapshot 分支和 Work 页面入口的 tasks-only 对照路径形成完整静态调用链。",
      "evidence": [
        "runtime/arcorbit/desktop/renderer/renderer.js:653-707",
        "runtime/arcorbit/desktop/renderer/renderer.js:2917-2940",
        "git blame: openWorkState full refresh at 3044a879; Work page tasks-only path at a71f2dc7"
      ]
    },
    {
      "id": "FACT-20260823-007-002",
      "revision": 1,
      "status": "accepted",
      "statement": "PlatformCoordinator 即使只请求 tasks 也固定读取 Desktop Store、Automation snapshot、组织和项目；树查询还会按每个 Workset 项目并行获取筛选后的任务树、全状态全部任务记录用于计数以及标签。当前状态切换因使用默认全区段进一步加载组织成员、项目成员和反馈。",
      "basis": "PlatformCoordinator 的 getSnapshot、sections 和 treeRequested 分支以及 Workshop adapter 的分页任务实现直接证明请求扇出。",
      "evidence": [
        "runtime/arcorbit/src/platform-coordinator.mjs:61-174",
        "runtime/arcorbit/src/platform-coordinator.mjs:715-718",
        "runtime/arcorbit/src/workshop-platform-adapter.mjs:85-100"
      ]
    },
    {
      "id": "FACT-20260823-007-003",
      "revision": 1,
      "status": "accepted",
      "statement": "受控隐藏 Electron 场景中，状态点击后的 DOM 仍保持旧 pending 选中和旧列表，直到刷新结束；240ms Platform 延迟下可见切换为 259.4ms，零延迟为 14.5ms。零延迟大列表场景中，整表传输和重绘 1000 行为 338.8ms、5000 行为 1393.1ms，证明网络与协调等待和全量 DOM 重建是两个独立线性瓶颈。",
      "basis": "使用现有 organization-center-preload 受控延迟和任务数据接口运行隐藏 Electron；临时诊断夹具采集后已删除。",
      "evidence": [
        "Controlled Electron reproduction, 2026-08-24: immediate pending_pressed=true, completed_pressed=false",
        "Controlled Electron reproduction: 240ms delay -> 259.4ms; 0ms delay -> 14.5ms",
        "Controlled Electron scale reproduction: 1000 rows -> 338.8ms; 5000 rows -> 1393.1ms",
        "runtime/arcorbit/desktop/renderer/renderer.js:1165-1187"
      ]
    },
    {
      "id": "FACT-20260823-007-004",
      "revision": 1,
      "status": "accepted",
      "statement": "正确优化边界是把 Work 列表建模为独立、受限、query-owned 的读投影：Renderer 用 Workset、项目范围、状态、搜索、多维筛选和日期构成稳定查询键，立即确认选择并以 stale-while-revalidate 缓存或明确加载态响应；请求使用代际或取消机制拒绝过期结果。Main process 只协调该查询所需的分页或窗口化任务树、计数和标签元数据，不把 Automation、认证、组织、成员或 Feedback 串入状态切换；Renderer 对大列表使用分页或虚拟化及事件委托，不整表重建。Workshop 仍是任务真相源，缓存不是第二真相源。",
      "basis": "该边界同时消除已测得的远端等待耦合和线性 DOM 成本，并保持既有 main-process source-of-truth 与受限 IPC 架构。",
      "evidence": [
        "runtime/arcorbit/desktop/renderer/renderer.js:653-735,1165-1187",
        "runtime/arcorbit/src/platform-coordinator.mjs:61-174",
        "Controlled Electron latency and scale measurements, 2026-08-24"
      ]
    },
    {
      "id": "FACT-20260823-007-005",
      "revision": 1,
      "status": "accepted",
      "statement": "ArcOrbit Work 状态列表现使用独立的 arcorbit-work-query/v1 typed IPC 和 query-owned 读投影。Renderer 的查询键覆盖 Workset、项目、状态、搜索、创建人、执行人、标签、优先级、起止日期与窗口；有界 SWR 缓存和请求代际只允许当前匹配响应投影。PlatformCoordinator 只读取 Desktop Store、项目、筛选任务树和标签，不读取 Automation、认证、组织、成员或 Feedback；输出窗口保留匹配任务所需的树祖先。Renderer 以事件委托和80条窗口约束同步 DOM，Workshop 仍是真相源。",
      "basis": "生产代码中的 typed IPC、查询状态模块、专用 Coordinator 路径和树感知窗口投影共同实现已接受的技术边界。",
      "evidence": [
        "runtime/arcorbit/desktop/main.mjs:409",
        "runtime/arcorbit/desktop/preload.cjs:78",
        "runtime/arcorbit/src/platform-coordinator.mjs:243-328",
        "runtime/arcorbit/desktop/renderer/work-query-state.mjs:1-66",
        "runtime/arcorbit/desktop/renderer/renderer.js:422-441,736-882,1257-1293",
        "runtime/arcorbit/desktop/renderer/styles.css:315-317"
      ]
    },
    {
      "id": "FACT-20260823-007-006",
      "revision": 1,
      "status": "accepted",
      "statement": "最终受控 Electron 场景中，240ms 数据延迟下 completed 状态选中反馈为1.8ms且未保留错误旧列表；accepted 后5ms切换 pending 时旧 accepted 响应未覆盖新选择；1000条 pending_review 数据的首个可交互窗口为6.3ms，DOM只渲染80行。既有 Work 导航 Electron 回归通过，全量 npm run check 共362项、356通过、6项环境门控跳过、0失败。",
      "basis": "新性能回归直接运行真实 Electron Renderer，并与查询状态、Coordinator、静态 IPC和全量回归测试形成跨层证据。",
      "evidence": [
        "runtime/arcorbit/test/work-status-switch-performance-electron.test.mjs:11-31",
        "runtime/arcorbit/test/fixtures/work-status-switch-performance-electron.mjs",
        "runtime/arcorbit/test/work-query-state.test.mjs",
        "runtime/arcorbit/test/platform-coordinator.test.mjs:119-174",
        "Verification: ARCORBIT_ELECTRON_WORK_STATUS_PERFORMANCE_TEST=1 node --test test/work-status-switch-performance-electron.test.mjs — 1 passed, 0 failed",
        "Verification: ARCORBIT_ELECTRON_WORK_NAVIGATION_TEST=1 node --test test/work-navigation-electron.test.mjs — 1 passed, 0 failed",
        "Verification: npm run check — 362 tests, 356 passed, 6 skipped, 0 failed",
        "Controlled Electron final measurement, 2026-08-24: immediate=1.8ms; first_interactive_1000=6.3ms; rendered_rows=80"
      ]
    },
    {
      "id": "FACT-20260823-007-007",
      "revision": 1,
      "status": "accepted",
      "statement": "Work query-state 现为每个查询键记录最后一次成功写入缓存的 generation。结构匹配但 generation 更旧的同键响应不会改写较新 SWR 缓存；不同查询键且没有同键较新缓存的后台响应仍可进入有界缓存。缓存清空和 LRU 淘汰会同步移除 generation 元数据。单元及真实 Electron 回访场景证明 newer-first、older-last 后重新进入同一状态立即显示 newer 缓存。",
      "basis": "生产实现的 per-key cachedGenerations 防护与修复前后隔离复现、单元测试和真实 Renderer 竞态回归形成直接证据。",
      "evidence": [
        "runtime/arcorbit/desktop/renderer/work-query-state.mjs:26-81",
        "runtime/arcorbit/test/work-query-state.test.mjs:18-42",
        "runtime/arcorbit/test/fixtures/work-status-switch-performance-electron.mjs:54-77",
        "runtime/arcorbit/test/work-status-switch-performance-electron.test.mjs:27-31",
        "Pre-fix isolated reproduction: cached_version=old",
        "Post-fix isolated reproduction: cached_version=new",
        "Verification: npm run check — 363 tests, 357 passed, 6 skipped, 0 failed"
      ]
    }
  ],
  "state_impacts": [
    {
      "id": "IMPACT-20260823-007-001",
      "fact_id": "FACT-20260823-007-005",
      "fact_revision": 1,
      "target": {
        "kind": "software_decision",
        "ref": "experience_and_interaction",
        "revision": 36
      },
      "effect": "upheld",
      "reason": "状态点击现在立即确认新选择，并立即显示完整查询键对应的缓存或明确加载态；后台结果受代际控制，符合已接受的 Work 交互语义。",
      "gap_ids": [],
      "evidence": [
        "runtime/arcorbit/desktop/renderer/renderer.js:736-767,1257-1282,3026-3032",
        "Controlled Electron: 240ms source delay -> 1.8ms immediate selection feedback"
      ]
    },
    {
      "id": "IMPACT-20260823-007-002",
      "fact_id": "FACT-20260823-007-005",
      "fact_revision": 1,
      "target": {
        "kind": "software_decision",
        "ref": "technical_foundation",
        "revision": 31
      },
      "effect": "upheld",
      "reason": "实现兑现了独立 query-owned 投影、完整查询键、有界 SWR、请求代际、专用 main-process 协调和树感知窗口化边界，未引入第二真相源。",
      "gap_ids": [],
      "evidence": [
        "runtime/arcorbit/desktop/renderer/work-query-state.mjs:1-66",
        "runtime/arcorbit/src/platform-coordinator.mjs:243-328",
        "runtime/arcorbit/desktop/main.mjs:409",
        "runtime/arcorbit/desktop/preload.cjs:78"
      ]
    },
    {
      "id": "IMPACT-20260823-007-003",
      "fact_id": "FACT-20260823-007-006",
      "fact_revision": 1,
      "target": {
        "kind": "software_decision",
        "ref": "quality_and_validation",
        "revision": 9
      },
      "effect": "upheld",
      "reason": "新增测试覆盖完整查询键、SWR缓存、错误和竞态隔离、无关数据源排除、树祖先保留、240ms延迟、1000行窗口化及既有Work导航回归。",
      "gap_ids": [],
      "evidence": [
        "runtime/arcorbit/test/work-query-state.test.mjs",
        "runtime/arcorbit/test/platform-coordinator.test.mjs:119-174",
        "runtime/arcorbit/test/work-status-switch-performance-electron.test.mjs:11-31",
        "Verification: npm run check — 362 tests, 356 passed, 6 skipped, 0 failed"
      ]
    },
    {
      "id": "IMPACT-20260823-007-004",
      "fact_id": "FACT-20260823-007-006",
      "fact_revision": 1,
      "target": {
        "kind": "software_invariant",
        "ref": "accepted-facts-are-realized",
        "revision": null
      },
      "effect": "upheld",
      "reason": "生产实现和直接 Electron 测量现已兑现 Case 对可信状态切换性能、无陈旧覆盖和大列表有界渲染的期望。",
      "gap_ids": [],
      "evidence": [
        "Controlled Electron final measurement: immediate=1.8ms, first_interactive_1000=6.3ms, rendered_rows=80",
        "runtime/arcorbit/desktop/renderer/renderer.js:736-767,1257-1293",
        "runtime/arcorbit/src/platform-coordinator.mjs:243-328"
      ]
    },
    {
      "id": "IMPACT-20260823-007-005",
      "fact_id": "FACT-20260823-007-007",
      "fact_revision": 1,
      "target": {
        "kind": "software_decision",
        "ref": "experience_and_interaction",
        "revision": 36
      },
      "effect": "upheld",
      "reason": "旧同键响应不再污染后续返回状态时展示的匹配缓存，兑现旧请求不得覆盖较新选择和数据的新鲜度语义。",
      "gap_ids": [],
      "evidence": [
        "runtime/arcorbit/desktop/renderer/work-query-state.mjs:42-53",
        "Electron same-key cache assertion: new_visible=true, old_visible=false, loading_visible=true"
      ]
    },
    {
      "id": "IMPACT-20260823-007-006",
      "fact_id": "FACT-20260823-007-007",
      "fact_revision": 1,
      "target": {
        "kind": "software_decision",
        "ref": "technical_foundation",
        "revision": 31
      },
      "effect": "upheld",
      "reason": "修复保持 query-owned、有界 SWR 和 request-generation 架构，并在缓存所有权层增加最小的 per-key freshness guard。",
      "gap_ids": [],
      "evidence": [
        "runtime/arcorbit/desktop/renderer/work-query-state.mjs:26-81"
      ]
    },
    {
      "id": "IMPACT-20260823-007-007",
      "fact_id": "FACT-20260823-007-007",
      "fact_revision": 1,
      "target": {
        "kind": "software_decision",
        "ref": "quality_and_validation",
        "revision": 9
      },
      "effect": "upheld",
      "reason": "新增测试直接覆盖此前遗漏的同键 newer-first、older-last 顺序，并保持不同键竞态、Electron 性能、Work 导航和全量回归通过。",
      "gap_ids": [],
      "evidence": [
        "runtime/arcorbit/test/work-query-state.test.mjs:33-42",
        "runtime/arcorbit/test/work-status-switch-performance-electron.test.mjs:27-31",
        "Verification: npm run check — 363 tests, 357 passed, 6 skipped, 0 failed"
      ]
    },
    {
      "id": "IMPACT-20260823-007-008",
      "fact_id": "FACT-20260823-007-007",
      "fact_revision": 1,
      "target": {
        "kind": "software_invariant",
        "ref": "accepted-facts-are-realized",
        "revision": null
      },
      "effect": "upheld",
      "reason": "review finding 所揭示的陈旧缓存覆盖已在生产 query-state 路径修复，并由直接回访场景证明。",
      "gap_ids": [],
      "evidence": [
        "Post-fix isolated reproduction: cached_version=new",
        "Electron same-key cache assertion passed"
      ]
    }
  ],
  "gaps": [
    {
      "id": "GAP-WORK-STATUS-SWITCH-PERFORMANCE-DIAGNOSIS",
      "status": "resolved",
      "goal": "建立 ArcOrbit Work 状态列表切换卡顿的可复现性能证据、主导瓶颈和正确架构责任边界。",
      "reason": "实现优化会因瓶颈位于数据获取、主进程协调、状态投影、筛选计算、DOM 渲染或事件绑定而显著不同；在根因被接受前直接修改会形成临时补丁风险。",
      "derived_from": [
        "FACT-WORK-STATUS-SWITCH-LAG-REPORT"
      ],
      "blocked_by": [],
      "priority_basis": {
        "blocking": "根因和责任边界未建立，阻塞可信实现。",
        "uncertainty": "高；当前只有用户可感知症状，没有调用链或测量证据。",
        "risk": "高；盲目缓存、去抖或局部跳过更新可能造成陈旧列表、双重状态源或行为回归。",
        "user_impact": "高；状态切换是 Work 页面高频核心操作。"
      },
      "responsibility": "agent",
      "evidence_required": [
        "稳定复现状态切换卡顿的场景与基线测量",
        "覆盖状态切换触发、数据/投影处理和 Renderer 更新的调用链证据",
        "能够区分主要瓶颈与次要开销的性能证据",
        "说明优化应归属的数据、状态、协调或渲染层架构结论"
      ],
      "resolution": {
        "id": "GAP-WORK-STATUS-SWITCH-PERFORMANCE-DIAGNOSIS",
        "status": "resolved",
        "outcome": "已确认卡顿来自状态交互与通用远端 snapshot、全量任务计数获取和整表 DOM 重建的同步耦合，并确定独立查询投影、缓存与请求代际控制、分页或虚拟化的正确边界。",
        "reason": "静态调用链与受控 Electron 运行结果完整匹配触发条件、可见等待、远端延迟斜率和大列表规模斜率。",
        "evidence": [
          "runtime/arcorbit/desktop/renderer/renderer.js:653-707,1165-1187,2917-2940",
          "runtime/arcorbit/src/platform-coordinator.mjs:61-174",
          "runtime/arcorbit/src/workshop-platform-adapter.mjs:85-100",
          "Controlled Electron: 240ms source delay => 259.4ms visible switch; zero delay => 14.5ms",
          "Controlled Electron scale: 1000 rows => 338.8ms; 5000 rows => 1393.1ms"
        ],
        "occurred_at": "2026-08-24T03:59:24.809Z"
      }
    },
    {
      "id": "GAP-20260823-007-001",
      "status": "resolved",
      "goal": "实现 Work 状态列表的独立查询投影、即时 cache-first 状态切换、过期请求隔离和分页或虚拟化渲染，并证明不再受无关全量 snapshot 或整表 DOM 成本阻塞。",
      "reason": "诊断已确认网络与协调等待和全量 DOM 重建是两个独立线性瓶颈；简单去抖、仅改 surface 参数或无边界缓存都不能完整解决。",
      "derived_from": [
        "FACT-20260823-007-001",
        "FACT-20260823-007-002",
        "FACT-20260823-007-003",
        "FACT-20260823-007-004"
      ],
      "blocked_by": [],
      "priority_basis": {
        "blocking": "直接阻塞 Case 期望结果。",
        "uncertainty": "低；根因和实现责任边界已有受控证据。",
        "risk": "高；需保护树层级、计数、新鲜度、选择与 Inspector 一致性。",
        "user_impact": "高；状态切换是高频核心操作。"
      },
      "responsibility": "agent",
      "evidence_required": [
        "240ms 受控数据源延迟下，状态选择视觉反馈低于 80ms 且不保留错误旧列表",
        "1000 行查询结果下首个可交互帧低于 80ms，并避免创建 1000 个同步 DOM 行节点",
        "Platform/IPC 证据证明状态切换不刷新 Automation、认证、组织、成员或 Feedback",
        "查询键覆盖 Workset、项目、状态、搜索、多维筛选和日期，旧响应不能覆盖新选择",
        "缓存未命中、命中、刷新失败、快速连续切换及返回原状态均保持正确新鲜度语义",
        "任务树层级、状态计数、行选择、Inspector、标签与现有 Work 动作回归通过",
        "新增 Electron 状态切换性能回归，并保持现有 work-navigation-electron 测试通过"
      ],
      "resolution": {
        "id": "GAP-20260823-007-001",
        "status": "resolved",
        "outcome": "Work 状态切换现由独立 typed query 驱动，选择即时呈现；完整查询键缓存、请求代际、明确加载或匹配缓存、树祖先保留和80条窗口化渲染已实现并通过受控 Electron 性能回归。",
        "reason": "静态边界、单元测试、全量回归和真实 Electron 测量共同证明远端刷新不再阻塞选择反馈，旧请求不能覆盖新选择，大列表不再同步创建全部行节点。",
        "evidence": [
          "runtime/arcorbit/desktop/renderer/work-query-state.mjs:1-66",
          "runtime/arcorbit/desktop/renderer/renderer.js:736-882,1257-1293,3026-3032",
          "runtime/arcorbit/src/platform-coordinator.mjs:243-328",
          "runtime/arcorbit/desktop/main.mjs:409",
          "runtime/arcorbit/desktop/preload.cjs:78",
          "Controlled Electron, 2026-08-24: 240ms source delay -> 1.8ms immediate selection feedback",
          "Controlled Electron, 2026-08-24: 1000 rows -> 6.3ms first interactive window, 80 rendered rows",
          "Verification: npm run check — 362 tests, 356 passed, 6 environment-gated skips, 0 failed"
        ],
        "occurred_at": "2026-08-24T04:17:47.133Z"
      }
    },
    {
      "id": "CASE-20260823-007:review-finding:FINDING-20260823-007-001",
      "status": "resolved",
      "goal": "Resolve review finding: Work query state 在校验请求是否仍为当前 generation 之前无条件写入缓存；当同一查询键的较新请求先完成、旧请求后完成时，旧响应会覆盖较新 SWR 缓存，下一次访问该查询会先显示陈旧数据。现有单元和 Electron 竞态测试仅覆盖不同状态键，未覆盖同键乱序完成。",
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
        "runtime/arcorbit/desktop/renderer/work-query-state.mjs",
        "runtime/arcorbit/test/work-query-state.test.mjs",
        "runtime/arcorbit/test/work-status-switch-performance-electron.test.mjs",
        "runtime/arcorbit/desktop/renderer/work-query-state.mjs:35-44 — accept 在 current generation 检查前执行 touch(request.key, value)",
        "Isolated reproduction, 2026-08-24: newer same-key response accepted first, older response accepted second => {\"first_current\":false,\"second_current\":true,\"cached_version\":\"old\"}",
        "runtime/arcorbit/test/work-query-state.test.mjs:20-34 — stale-response coverage uses pending and completed two different keys",
        "runtime/arcorbit/test/fixtures/work-status-switch-performance-electron.mjs — rapid-switch coverage uses accepted and pending two different keys"
      ],
      "resolution": {
        "id": "CASE-20260823-007:review-finding:FINDING-20260823-007-001",
        "status": "resolved",
        "outcome": "Work query SWR 缓存现按查询键保留最新成功缓存 generation；较旧同键响应不再覆盖较新投影，并已补充同键乱序单元和 Electron 回归。",
        "reason": "修复直接约束 review finding 指向的无条件 cache touch，同时保留不同查询键响应的后台缓存语义；修复前后隔离复现分别得到 cached_version=old 与 cached_version=new。",
        "evidence": [
          "runtime/arcorbit/desktop/renderer/work-query-state.mjs:26-81",
          "runtime/arcorbit/test/work-query-state.test.mjs:33-42",
          "runtime/arcorbit/test/fixtures/work-status-switch-performance-electron.mjs:54-77",
          "runtime/arcorbit/test/work-status-switch-performance-electron.test.mjs:27-31",
          "Post-fix isolated reproduction: {\"first_current\":false,\"second_current\":true,\"cached_version\":\"new\"}",
          "Verification: ARCORBIT_ELECTRON_WORK_STATUS_PERFORMANCE_TEST=1 node --test test/work-status-switch-performance-electron.test.mjs — 1 passed, 0 failed",
          "Verification: ARCORBIT_ELECTRON_WORK_NAVIGATION_TEST=1 node --test test/work-navigation-electron.test.mjs — 1 passed, 0 failed",
          "Verification: npm run check — 363 tests, 357 passed, 6 environment-gated skips, 0 failed"
        ],
        "occurred_at": "2026-08-24T04:26:45.198Z"
      }
    },
    {
      "id": "CASE-20260823-007:review-finding:FINDING-20260823-007-002",
      "status": "open",
      "goal": "Resolve review finding: Work query-state 的 clear() 会提升全局 generation 并清空 cache 与 cachedGenerations，但 accept() 只比较被清空后的 per-key cached generation。清理前发出的请求若在 clear 后完成，仍会重新写入缓存；再次使用相同查询键时会得到清理前数据。Renderer 在 Workset 切换、登录和退出时调用 clear，因此该竞态可破坏身份或上下文切换后的缓存失效。现有测试未覆盖 clear 与在途响应的顺序。",
      "reason": "error found by completion review",
      "derived_from": [
        "completion_review",
        "content_revision:3"
      ],
      "blocked_by": [],
      "priority_basis": {
        "blocking": "high",
        "risk": "high"
      },
      "responsibility": "agent",
      "evidence_required": [
        "runtime/arcorbit/desktop/renderer/work-query-state.mjs",
        "runtime/arcorbit/desktop/renderer/renderer.js",
        "runtime/arcorbit/test/work-query-state.test.mjs",
        "runtime/arcorbit/test/work-status-switch-performance-electron.test.mjs",
        "runtime/arcorbit/desktop/renderer/work-query-state.mjs:42-49,64-68 — clear 清空 cachedGenerations 后，旧 request generation 大于默认 0，accept 重新执行 touch",
        "runtime/arcorbit/desktop/renderer/renderer.js:456-461,3179-3185,3208-3214 — Workset 切换、登录和退出调用 workQueryState.clear()",
        "Isolated reproduction, 2026-08-24: begin -> clear -> accept(pre-clear response) -> begin same key produced {\"accepted\":true,\"current\":false,\"cached_version\":\"pre-clear\"}",
        "runtime/arcorbit/test/work-query-state.test.mjs:18-42 — 覆盖有界缓存、不同键竞态与同键乱序，但未覆盖 clear 后的在途响应",
        "Focused verification: 59 passed, 0 failed, confirming the current suite does not detect this lifecycle race"
      ],
      "resolution": null
    }
  ],
  "content_revision": 3,
  "completion_review": {
    "status": "findings_open",
    "policy": {
      "initial_max_cycles": 10,
      "source": "runtime/arcorbit/config/case-policy.json",
      "snapshotted_at": "2026-08-23T21:46:41.163Z"
    },
    "additional_cycles_authorized": 0,
    "cycle_count": 2,
    "reviewed_content_revision": 3,
    "dimensions": {
      "implementation_correctness": "findings",
      "problem_resolution": "findings",
      "verification_credibility": "findings",
      "regression_risk": "findings",
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
          "FINDING-20260823-007-001"
        ],
        "evidence": [
          "Reviewed content revision 2 production query state, Renderer integration, PlatformCoordinator projection and regression tests",
          "Focused verification: node --test test/work-query-state.test.mjs test/platform-coordinator.test.mjs test/desktop-renderer.test.mjs — 58 passed, 0 failed",
          "Accepted verification baseline: npm run check — 362 tests, 356 passed, 6 environment-gated skips, 0 failed",
          "Isolated same-key out-of-order reproduction returned cached_version=old"
        ],
        "occurred_at": "2026-08-24T04:22:21.256Z"
      },
      {
        "cycle": 2,
        "autonomous_cycle": 2,
        "reviewer": "agent",
        "outcome": "findings",
        "content_revision": 3,
        "dimensions": {
          "implementation_correctness": "findings",
          "problem_resolution": "findings",
          "verification_credibility": "findings",
          "regression_risk": "findings",
          "minimality": "clean"
        },
        "finding_ids": [
          "FINDING-20260823-007-002"
        ],
        "evidence": [
          "Reviewed Case content revision 3 production query-state lifecycle, Renderer clear call sites and regression tests",
          "Isolated clear/in-flight response sequence reproduced deterministically",
          "Focused verification: node --test test/work-query-state.test.mjs test/platform-coordinator.test.mjs test/desktop-renderer.test.mjs — 59 passed, 0 failed",
          "Accepted baseline: npm run check — 363 tests, 357 passed, 6 environment-gated skips, 0 failed",
          "git diff --check passed; no implementation files changed during this review"
        ],
        "occurred_at": "2026-08-24T05:45:19.979Z"
      }
    ],
    "evidence": [
      "Reviewed content revision 2 production query state, Renderer integration, PlatformCoordinator projection and regression tests",
      "Focused verification: node --test test/work-query-state.test.mjs test/platform-coordinator.test.mjs test/desktop-renderer.test.mjs — 58 passed, 0 failed",
      "Accepted verification baseline: npm run check — 362 tests, 356 passed, 6 environment-gated skips, 0 failed",
      "Isolated same-key out-of-order reproduction returned cached_version=old",
      "Reviewed Case content revision 3 production query-state lifecycle, Renderer clear call sites and regression tests",
      "Isolated clear/in-flight response sequence reproduced deterministically",
      "Focused verification: node --test test/work-query-state.test.mjs test/platform-coordinator.test.mjs test/desktop-renderer.test.mjs — 59 passed, 0 failed",
      "Accepted baseline: npm run check — 363 tests, 357 passed, 6 environment-gated skips, 0 failed",
      "git diff --check passed; no implementation files changed during this review"
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
      "goal": "沿状态点击、snapshot 协调、Workshop 查询和 Renderer 重绘链完成受控测量，建立根因及长期架构边界。",
      "outcome": "completed",
      "gap_selection": {
        "mode": "candidate",
        "basis": "该 Gap 是唯一 ready 的 Case candidate，直接阻塞当前高影响 Work 性能事项；四个 Project gaps 均需另建 Case，且与本次根因无直接依赖。",
        "snapshot_token": "f84aac34ac38611c6d99e34552ff1d363be3f48d374a7b093ac2ec0827cb0df0",
        "selected_ref": "case-gap:CASE-20260823-007:GAP-WORK-STATUS-SWITCH-PERFORMANCE-DIAGNOSIS",
        "comparison_summary": "选择 Work 状态切换性能诊断；GAP-agent-scenario-evaluation、GAP-runtime-resilience-and-adapters、GAP-security-real-project-validation、GAP-cross-record-audit 均 deferred。",
        "fresh_discovery_summary": "Round opening 未发现优先级更高的 fresh candidate；诊断形成的实现义务仅作为新 Gap 声明，等待提交后的 fresh snapshot 再选择。",
        "considered": [
          {
            "ref": "project-gap:GAP-agent-scenario-evaluation",
            "source": "persisted",
            "eligibility": "case_required",
            "disposition": "deferred",
            "priority_basis": {
              "blocking": "不阻塞当前 Work 性能事项。",
              "uncertainty": "高。",
              "risk": "高。",
              "user_impact": "低于当前直接报告的高频卡顿。"
            },
            "reason": "需独立 Case，且不能建立当前性能根因。"
          },
          {
            "ref": "project-gap:GAP-runtime-resilience-and-adapters",
            "source": "persisted",
            "eligibility": "case_required",
            "disposition": "deferred",
            "priority_basis": {
              "blocking": "不阻塞当前 Work 页面诊断。",
              "uncertainty": "中。",
              "risk": "高。",
              "user_impact": "当前优先级低于直接可感知卡顿。"
            },
            "reason": "Runtime resilience 与 Work 列表切换调用链无直接依赖。"
          },
          {
            "ref": "project-gap:GAP-security-real-project-validation",
            "source": "persisted",
            "eligibility": "case_required",
            "disposition": "deferred",
            "priority_basis": {
              "blocking": "不阻塞当前诊断。",
              "uncertainty": "中。",
              "risk": "高。",
              "user_impact": "不直接改善当前交互。"
            },
            "reason": "权限项目验证与本次 Renderer/Platform 查询性能无直接关系。"
          },
          {
            "ref": "project-gap:GAP-cross-record-audit",
            "source": "persisted",
            "eligibility": "case_required",
            "disposition": "deferred",
            "priority_basis": {
              "blocking": "不阻塞当前诊断。",
              "uncertainty": "中。",
              "risk": "高。",
              "user_impact": "当前直接用户影响较低。"
            },
            "reason": "跨记录审计需独立 Case。"
          },
          {
            "ref": "case-gap:CASE-20260823-007:GAP-WORK-STATUS-SWITCH-PERFORMANCE-DIAGNOSIS",
            "source": "persisted",
            "eligibility": "ready",
            "disposition": "selected",
            "priority_basis": {
              "blocking": "根因与责任边界未建立，阻塞可信优化。",
              "uncertainty": "高；开始时只有症状报告。",
              "risk": "盲目缓存或去抖会造成陈旧数据和双重状态源。",
              "user_impact": "高频 Work 状态切换明显卡顿。"
            },
            "reason": "唯一直接解决当前用户事项且可在本轮建立完整证据的 ready Gap。"
          }
        ]
      },
      "selected_gap": {
        "id": "GAP-WORK-STATUS-SWITCH-PERFORMANCE-DIAGNOSIS",
        "responsibility": "agent",
        "goal": "建立 ArcOrbit Work 状态列表切换卡顿的可复现性能证据、主导瓶颈和正确架构责任边界。",
        "reason": "实现优化会因瓶颈位于数据获取、主进程协调、状态投影、筛选计算、DOM 渲染或事件绑定而显著不同；在根因被接受前直接修改会形成临时补丁风险。",
        "derived_from": [
          "FACT-WORK-STATUS-SWITCH-LAG-REPORT"
        ],
        "blocked_by": [],
        "priority_basis": {
          "blocking": "根因和责任边界未建立，阻塞可信实现。",
          "uncertainty": "高；当前只有用户可感知症状，没有调用链或测量证据。",
          "risk": "高；盲目缓存、去抖或局部跳过更新可能造成陈旧列表、双重状态源或行为回归。",
          "user_impact": "高；状态切换是 Work 页面高频核心操作。"
        },
        "evidence_required": [
          "稳定复现状态切换卡顿的场景与基线测量",
          "覆盖状态切换触发、数据/投影处理和 Renderer 更新的调用链证据",
          "能够区分主要瓶颈与次要开销的性能证据",
          "说明优化应归属的数据、状态、协调或渲染层架构结论"
        ]
      },
      "planned_transition": {
        "goal": "沿状态点击、snapshot 协调、Workshop 查询和 Renderer 重绘链完成受控测量，建立根因及长期架构边界。",
        "expected_state_change": "解决诊断 Gap，接受可复现根因、性能量级与架构结论，并声明尚未实施的单一优化 Gap。"
      },
      "accepted_state_delta": {
        "resolved_gap": {
          "id": "GAP-WORK-STATUS-SWITCH-PERFORMANCE-DIAGNOSIS",
          "status": "resolved",
          "outcome": "已确认卡顿来自状态交互与通用远端 snapshot、全量任务计数获取和整表 DOM 重建的同步耦合，并确定独立查询投影、缓存与请求代际控制、分页或虚拟化的正确边界。",
          "reason": "静态调用链与受控 Electron 运行结果完整匹配触发条件、可见等待、远端延迟斜率和大列表规模斜率。",
          "evidence": [
            "runtime/arcorbit/desktop/renderer/renderer.js:653-707,1165-1187,2917-2940",
            "runtime/arcorbit/src/platform-coordinator.mjs:61-174",
            "runtime/arcorbit/src/workshop-platform-adapter.mjs:85-100",
            "Controlled Electron: 240ms source delay => 259.4ms visible switch; zero delay => 14.5ms",
            "Controlled Electron scale: 1000 rows => 338.8ms; 5000 rows => 1393.1ms"
          ]
        },
        "facts_added": [
          {
            "id": "FACT-20260823-007-001",
            "revision": 1,
            "status": "accepted",
            "statement": "Work 状态按钮的 openWorkState 只更新内存选择，不立即渲染；它随后调用默认 surface 的 refreshSnapshot，等待 Automation snapshot、认证状态以及包含 overview、organizations、members、tasks、feedback 的 Platform snapshot，完成后才统一呈现新的选中状态和列表。",
            "basis": "状态处理器、refreshSnapshot 分支和 Work 页面入口的 tasks-only 对照路径形成完整静态调用链。",
            "evidence": [
              "runtime/arcorbit/desktop/renderer/renderer.js:653-707",
              "runtime/arcorbit/desktop/renderer/renderer.js:2917-2940",
              "git blame: openWorkState full refresh at 3044a879; Work page tasks-only path at a71f2dc7"
            ]
          },
          {
            "id": "FACT-20260823-007-002",
            "revision": 1,
            "status": "accepted",
            "statement": "PlatformCoordinator 即使只请求 tasks 也固定读取 Desktop Store、Automation snapshot、组织和项目；树查询还会按每个 Workset 项目并行获取筛选后的任务树、全状态全部任务记录用于计数以及标签。当前状态切换因使用默认全区段进一步加载组织成员、项目成员和反馈。",
            "basis": "PlatformCoordinator 的 getSnapshot、sections 和 treeRequested 分支以及 Workshop adapter 的分页任务实现直接证明请求扇出。",
            "evidence": [
              "runtime/arcorbit/src/platform-coordinator.mjs:61-174",
              "runtime/arcorbit/src/platform-coordinator.mjs:715-718",
              "runtime/arcorbit/src/workshop-platform-adapter.mjs:85-100"
            ]
          },
          {
            "id": "FACT-20260823-007-003",
            "revision": 1,
            "status": "accepted",
            "statement": "受控隐藏 Electron 场景中，状态点击后的 DOM 仍保持旧 pending 选中和旧列表，直到刷新结束；240ms Platform 延迟下可见切换为 259.4ms，零延迟为 14.5ms。零延迟大列表场景中，整表传输和重绘 1000 行为 338.8ms、5000 行为 1393.1ms，证明网络与协调等待和全量 DOM 重建是两个独立线性瓶颈。",
            "basis": "使用现有 organization-center-preload 受控延迟和任务数据接口运行隐藏 Electron；临时诊断夹具采集后已删除。",
            "evidence": [
              "Controlled Electron reproduction, 2026-08-24: immediate pending_pressed=true, completed_pressed=false",
              "Controlled Electron reproduction: 240ms delay -> 259.4ms; 0ms delay -> 14.5ms",
              "Controlled Electron scale reproduction: 1000 rows -> 338.8ms; 5000 rows -> 1393.1ms",
              "runtime/arcorbit/desktop/renderer/renderer.js:1165-1187"
            ]
          },
          {
            "id": "FACT-20260823-007-004",
            "revision": 1,
            "status": "accepted",
            "statement": "正确优化边界是把 Work 列表建模为独立、受限、query-owned 的读投影：Renderer 用 Workset、项目范围、状态、搜索、多维筛选和日期构成稳定查询键，立即确认选择并以 stale-while-revalidate 缓存或明确加载态响应；请求使用代际或取消机制拒绝过期结果。Main process 只协调该查询所需的分页或窗口化任务树、计数和标签元数据，不把 Automation、认证、组织、成员或 Feedback 串入状态切换；Renderer 对大列表使用分页或虚拟化及事件委托，不整表重建。Workshop 仍是任务真相源，缓存不是第二真相源。",
            "basis": "该边界同时消除已测得的远端等待耦合和线性 DOM 成本，并保持既有 main-process source-of-truth 与受限 IPC 架构。",
            "evidence": [
              "runtime/arcorbit/desktop/renderer/renderer.js:653-735,1165-1187",
              "runtime/arcorbit/src/platform-coordinator.mjs:61-174",
              "Controlled Electron latency and scale measurements, 2026-08-24"
            ]
          }
        ],
        "facts_superseded": [],
        "impacts_added": [
          {
            "id": "IMPACT-20260823-007-001",
            "fact_id": "FACT-20260823-007-001",
            "fact_revision": 1,
            "target": {
              "kind": "software_decision",
              "ref": "experience_and_interaction",
              "revision": 36
            },
            "effect": "threatened",
            "reason": "现有状态点击在远端完成前不反馈新选择，与即时可控的 Work 交互预期冲突。",
            "gap_ids": [
              "GAP-20260823-007-001"
            ],
            "evidence": [
              "runtime/arcorbit/desktop/renderer/renderer.js:2917-2922",
              "Controlled Electron visible-switch measurement"
            ]
          },
          {
            "id": "IMPACT-20260823-007-002",
            "fact_id": "FACT-20260823-007-004",
            "fact_revision": 1,
            "target": {
              "kind": "software_decision",
              "ref": "technical_foundation",
              "revision": 31
            },
            "effect": "upheld",
            "reason": "诊断澄清了 Work 查询投影、缓存所有权、请求代际和虚拟化应处于既有 Renderer/main-process 边界内。",
            "gap_ids": [],
            "evidence": [
              "runtime/arcorbit/desktop/renderer/renderer.js:653-735",
              "runtime/arcorbit/src/platform-coordinator.mjs:61-174"
            ]
          },
          {
            "id": "IMPACT-20260823-007-003",
            "fact_id": "FACT-20260823-007-003",
            "fact_revision": 1,
            "target": {
              "kind": "software_decision",
              "ref": "quality_and_validation",
              "revision": 9
            },
            "effect": "threatened",
            "reason": "现有验证只覆盖 Work 页面 cache-first 导航，没有覆盖状态切换的远端等待隔离和大列表规模风险。",
            "gap_ids": [
              "GAP-20260823-007-001"
            ],
            "evidence": [
              "runtime/arcorbit/test/work-navigation-electron.test.mjs",
              "Controlled Electron status and scale measurements"
            ]
          },
          {
            "id": "IMPACT-20260823-007-004",
            "fact_id": "FACT-20260823-007-003",
            "fact_revision": 1,
            "target": {
              "kind": "software_invariant",
              "ref": "accepted-facts-are-realized",
              "revision": null
            },
            "effect": "threatened",
            "reason": "当前实现尚未兑现 Case 期望的可信状态切换性能。",
            "gap_ids": [
              "GAP-20260823-007-001"
            ],
            "evidence": [
              "Controlled Electron status and scale measurements"
            ]
          }
        ],
        "impacts_updated": [],
        "gaps_added": [
          {
            "id": "GAP-20260823-007-001",
            "status": "open",
            "goal": "实现 Work 状态列表的独立查询投影、即时 cache-first 状态切换、过期请求隔离和分页或虚拟化渲染，并证明不再受无关全量 snapshot 或整表 DOM 成本阻塞。",
            "reason": "诊断已确认网络与协调等待和全量 DOM 重建是两个独立线性瓶颈；简单去抖、仅改 surface 参数或无边界缓存都不能完整解决。",
            "derived_from": [
              "FACT-20260823-007-001",
              "FACT-20260823-007-002",
              "FACT-20260823-007-003",
              "FACT-20260823-007-004"
            ],
            "blocked_by": [],
            "priority_basis": {
              "blocking": "直接阻塞 Case 期望结果。",
              "uncertainty": "低；根因和实现责任边界已有受控证据。",
              "risk": "高；需保护树层级、计数、新鲜度、选择与 Inspector 一致性。",
              "user_impact": "高；状态切换是高频核心操作。"
            },
            "responsibility": "agent",
            "evidence_required": [
              "240ms 受控数据源延迟下，状态选择视觉反馈低于 80ms 且不保留错误旧列表",
              "1000 行查询结果下首个可交互帧低于 80ms，并避免创建 1000 个同步 DOM 行节点",
              "Platform/IPC 证据证明状态切换不刷新 Automation、认证、组织、成员或 Feedback",
              "查询键覆盖 Workset、项目、状态、搜索、多维筛选和日期，旧响应不能覆盖新选择",
              "缓存未命中、命中、刷新失败、快速连续切换及返回原状态均保持正确新鲜度语义",
              "任务树层级、状态计数、行选择、Inspector、标签与现有 Work 动作回归通过",
              "新增 Electron 状态切换性能回归，并保持现有 work-navigation-electron 测试通过"
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
            "observed_revision": 35,
            "set_decision": {
              "status": "settled",
              "statement": "ArcOrbit 保持 Personal、Product Lifecycle、Organization 三组导航和既有 Work、Automation、Feedback、Organization、Setup、账户及产品反馈语义。Personal / Chat 使用按 Product Workspace 分组的会话列表、独立 transcript 和 Composer：页面无需预先选择项目，每个项目默认显示最近 10 个会话并在超出时从组底部展开完整历史；新对话在首条非空消息前显式显示目标工作区，默认取当前会话或最近成功使用的可用工作区，允许保留草稿快速切换，发送后会话固定绑定该本地 Product Workspace 和 Codex thread。支持选择、重命名、删除、跨页面后台运行和重启恢复。消息以稳定 item 流式更新，支持 Markdown、代码复制、折叠非空 reasoning、单行工具状态、用户审批和智能自动滚动。starting、running、waiting approval 状态均可停止；interrupt 保留部分回答，继续操作会在同一 thread 启动新 turn。删除活动会话先等待 interrupt 终态，失败时不部分删除。没有可用本地工作区时允许保留草稿但禁止发送，并提供配置恢复入口。Chat 不调用 state-driven Runtime，不转换其他对象；Automation task thread、human Gate、Composer 与执行控制保持独立，但人工介入中间消息区直接复用 Chat Conversation Surface。Idea、Release、Operations 和 Engineering 继续呈现计划交互。Chat 返回页面时先用缓存会话和 transcript 立即切换，再后台刷新并显示同步或失败状态；Work 横排筛选使用弹出菜单且列表单行无按钮，评论图片自动加载且在独立窗口完成常用查看操作，单图失败不阻塞时间线；Feedback 列表单行，详情承载完整会话和动作。Automation 左栏承载任务、项目、边界、当前选择和介入控制；右栏承载完整执行墙钟时间、累计 gap 轮数、逐 gap 目标/工作/结果，以及 Run、token、Gate、ledger、Git、证据和结构化结果。Automation 专属 loop/round/ledger 事件不进入中间对话流。Work 待办状态切换必须立即确认新的选中状态，并显示与完整查询键匹配的缓存结果或明确加载态；远端刷新在后台执行，旧请求不得覆盖较新的选择，Automation、认证、组织、成员与 Feedback 刷新不得阻塞该交互，大列表不得通过同步整表重建阻塞 Renderer。",
              "reason": "本轮诊断证明当前状态切换被远端全量刷新和整表重绘同步阻塞，需把即时反馈、新鲜度和大列表响应语义明确为稳定交互要求。",
              "evidence": [
                "Current operator input, 2026-08-24",
                "runtime/arcorbit/desktop/renderer/renderer.js:653-735,1165-1187,2917-2940",
                "Controlled Electron latency and scale measurements, 2026-08-24"
              ],
              "confidence": "high",
              "resume_condition": "当 Work 查询缓存、新鲜度、分页或虚拟化、状态切换反馈语义变化时重审。"
            },
            "gap_refs": [],
            "reason": "建立可恢复的 Work 性能交互语义。",
            "evidence": [
              "local:fact:measurements",
              "local:fact:architecture_boundary"
            ]
          },
          {
            "area_ref": "technical_foundation",
            "observed_revision": 30,
            "set_decision": {
              "status": "settled",
              "statement": "Arckit 继续使用 repository-owned Markdown/JSON state 与 Node.js ESM ledger CLI；ArcOrbit 继续作为 Electron Desktop/Runtime host，并保留 policy-neutral Runtime Kernel、persistent one-thread-per-todo、Platform Coordinator、restricted Workshop adapters、utilityProcess Runtime、trusted in-process ledger entrypoints、project-only skill provisioning、Feedback SDK WebContents 和现代/旧版 realtime 协议边界。真实 Chat 的 accepted architecture 在 main process 增加独立 ChatCoordinator 和 kind=chat Store ownership，并从现有 Codex adapter 中抽取可复用 Conversation 层：app-server client、persistent thread start/resume、turn start/interrupt、通用事件 projector、token usage 和异步 approval provider。State-driven Runtime 只在该基础层之上保留 using-arckit、Agent Loop schema、fresh ledger snapshot、Gap Loop、Automation lease 和 closeout 语义，Chat 不复用这些语义。每个活动 Chat session 拥有与其固定项目根对应的 adapter owner；不同 Chat session 和 Automation owner 不共享活动 turn 或 lease。typed Chat IPC 只提供 snapshot/create/select/rename/delete/send/interrupt/approvalDecision；select 只持久化经 main process 验证的 Chat session 选择，不改变 draft、thread 或 session updated_at。Renderer 不能提供任意 cwd、thread id、Codex method、文件权限或 shell command。Chat 与 Automation Renderer 共享单一 Conversation Surface 模块和 scroll-follow/event-binding 行为，消费者仅提供规范化消息、Composer policy 与回调；Automation 专属类型由左右面板消费。Run Activity 以结构化 gap_rounds 持久化 round selection/closeout/work summary，任务级执行总览跨 transcript Runs 聚合，不解析被截断的消息文本。ArcOrbit Automation Agent 只输出绑定 fresh snapshot 的 Semantic Case Command；Agent 显式决定事实、Gap、影响、Project decision 与 invariant judgment 的业务语义，trusted Ledger Command Materializer 在 commit lock 内确定性分配身份与 revision、解析 local handle、展开反向关系、编译内部 Transition、完整校验 projected state 并原子提交，Runtime 不复制物化规则。Work 任务浏览采用独立的 query-owned 读投影：Renderer 以 Workset、项目范围、状态、搜索、多维筛选与日期组成稳定查询键，保存有界 stale-while-revalidate 缓存和请求代际；main-process Platform Coordinator 只提供该查询所需的分页或窗口化任务树、状态计数与标签元数据，不通过通用全量 snapshot 把 Automation、认证、组织、成员或 Feedback 串入状态切换。Renderer 使用分页或虚拟化与事件委托约束大列表同步 DOM 成本；Workshop 始终是任务真相源，查询缓存不成为第二真相源。",
              "reason": "诊断同时证明协调层请求扇出和 Renderer 整表重建，需要在既有主进程信任边界内建立专用 Work 查询架构，同时保留 Semantic Case Command 与 Ledger Materializer 的现行责任分层。",
              "evidence": [
                "runtime/arcorbit/desktop/renderer/renderer.js:653-735,1165-1187",
                "runtime/arcorbit/src/platform-coordinator.mjs:61-174",
                "runtime/arcorbit/src/workshop-platform-adapter.mjs:85-100",
                "Controlled Electron latency and scale measurements, 2026-08-24"
              ],
              "confidence": "high",
              "resume_condition": "当 Work 查询 source-of-truth、查询键、缓存所有权、分页或虚拟化、Platform IPC 边界，或 Semantic Case Command/Materializer 责任发生变化时重审。"
            },
            "gap_refs": [
              "GAP-runtime-resilience-and-adapters"
            ],
            "reason": "记录已澄清的 Work 查询架构责任边界，同时保持当前 Semantic Case Command 架构决策完整。",
            "evidence": [
              "local:fact:coordinator_fanout",
              "local:fact:architecture_boundary"
            ]
          },
          {
            "area_ref": "quality_and_validation",
            "observed_revision": 8,
            "set_decision": {
              "status": "settled",
              "statement": "既有协议、Runtime、realtime、Work 和安全验证义务保持不变。真实 Chat 还必须以 adapter、Store、Coordinator、typed main/preload IPC、Renderer 和真实 app-server smoke 的跨层证据证明：首条消息幂等创建 session/thread；连续 turn resume 同一 thread；不同 Chat/Automation owner 隔离；稳定 item streaming、Markdown、reasoning/tool 投影和智能滚动正确；starting/running/waiting approval 均可 interrupt；部分输出和重启恢复不重复请求；活动删除先 interrupt 且无部分删除；审批异步并 fail closed；Renderer 无法覆盖 cwd/thread/method/command；Chat 不触发 using-arckit、ledger、Workshop mutation、Automation lease 或 human Gate。Chat 会话导航还必须证明：会话不受全局项目范围过滤并按 Product Workspace 确定分组；每组默认最多 10 条且仅在超出时出现对应历史入口；展开/收起不改变选择、草稿或后台 turn；新对话持续显示目标工作区，首次发送前切换保留草稿且不创建 session/thread，发送后不能迁移既有 thread/cwd。Automation 介入还必须证明 Chat 与 Automation 使用同一 Conversation Surface 实现和一致的 Markdown、reasoning、tool、approval/error、复制、外链与智能滚动行为；结构化跨 Run 汇总必须覆盖完整墙钟时间、累计 gap 轮数、逐 gap 目标/工作/结果、进行中和旧 Activity 兼容，并回归 Gate、恢复、ledger、Git、证据和执行控制未降级。Work 状态切换还必须用受控延迟和大列表 Electron 场景证明：选中反馈不等待远端；查询只触发 Work 所需数据；缓存键和请求代际阻止陈旧覆盖；1000 行规模不会同步创建或替换全部行节点；任务树、计数、选择、Inspector、筛选和失败恢复不回归。",
              "reason": "现有 Work 导航测试未覆盖状态切换的远端等待与大列表线性重绘风险。",
              "evidence": [
                "runtime/arcorbit/test/work-navigation-electron.test.mjs",
                "Controlled Electron latency and scale measurements, 2026-08-24",
                "runtime/arcorbit/desktop/renderer/renderer.js:1165-1187"
              ],
              "confidence": "high",
              "resume_condition": "当 Work 查询协议、缓存新鲜度或列表渲染策略变化时重审。"
            },
            "gap_refs": [
              "GAP-agent-scenario-evaluation",
              "GAP-cross-record-audit"
            ],
            "reason": "把已识别的两类性能风险转成可重复验收边界。",
            "evidence": [
              "local:fact:measurements",
              "local:fact:architecture_boundary"
            ]
          }
        ],
        "software_invariant_changes": [],
        "project_gap_changes": [],
        "selection_context_change": null,
        "evidence": [
          "Current operator input, 2026-08-24",
          "runtime/arcorbit/desktop/renderer/renderer.js",
          "runtime/arcorbit/src/platform-coordinator.mjs",
          "runtime/arcorbit/src/workshop-platform-adapter.mjs",
          "Controlled Electron diagnostic measurements, 2026-08-24"
        ]
      },
      "invariant_assessment": {
        "project_revision": 202,
        "judgments": [
          {
            "invariant_ref": "product-expectations-remain-recoverable",
            "disposition": "not_relevant",
            "reason": "本轮澄清性能根因与实现边界，没有改变 Work 的能力范围或业务规则。",
            "fact_refs": [],
            "evidence": [],
            "gap_refs": []
          },
          {
            "invariant_ref": "interaction-expectations-remain-recoverable",
            "disposition": "upheld",
            "reason": "状态切换的即时反馈、加载或缓存、新鲜度和大列表响应语义已进入 Project experience_and_interaction 决策。",
            "fact_refs": [
              "FACT-20260823-007-003",
              "FACT-20260823-007-004"
            ],
            "evidence": [
              "Project decision change: experience_and_interaction",
              "Current operator input, 2026-08-24"
            ],
            "gap_refs": []
          },
          {
            "invariant_ref": "visual-language-remains-consistent",
            "disposition": "not_relevant",
            "reason": "诊断未建立或改变视觉语言、Design Token 或组件外观规则。",
            "fact_refs": [],
            "evidence": [],
            "gap_refs": []
          },
          {
            "invariant_ref": "technical-decisions-remain-explainable",
            "disposition": "upheld",
            "reason": "查询投影、source-of-truth、缓存所有权、请求代际及分页或虚拟化责任已由调用链和测量证明并写入 technical_foundation。",
            "fact_refs": [
              "FACT-20260823-007-001",
              "FACT-20260823-007-002",
              "FACT-20260823-007-004"
            ],
            "evidence": [
              "runtime/arcorbit/desktop/renderer/renderer.js:653-735,1165-1187,2917-2940",
              "runtime/arcorbit/src/platform-coordinator.mjs:61-174",
              "Project decision change: technical_foundation"
            ],
            "gap_refs": []
          },
          {
            "invariant_ref": "accepted-facts-are-realized",
            "disposition": "threatened",
            "reason": "诊断证明当前软件仍同步等待全量刷新并重建整表，尚未兑现 Case 期望的状态切换性能。",
            "fact_refs": [
              "FACT-20260823-007-003"
            ],
            "evidence": [
              "Controlled Electron latency and scale measurements, 2026-08-24"
            ],
            "gap_refs": [
              "GAP-20260823-007-001"
            ]
          },
          {
            "invariant_ref": "material-risks-have-credible-evidence",
            "disposition": "upheld",
            "reason": "远端等待和大列表成本分别由静态调用链、受控延迟斜率、零延迟规模斜率及现有 Electron 导航回归对照支持；结论范围未外推到未测量的真实服务绝对延迟。",
            "fact_refs": [
              "FACT-20260823-007-003"
            ],
            "evidence": [
              "Controlled Electron: 240ms -> 259.4ms vs 0ms -> 14.5ms",
              "Controlled Electron: 1000 rows -> 338.8ms; 5000 rows -> 1393.1ms",
              "Verification: ARCORBIT_ELECTRON_WORK_NAVIGATION_TEST=1 node --test test/work-navigation-electron.test.mjs — 1 passed, 0 failed"
            ],
            "gap_refs": []
          }
        ]
      },
      "evidence": [
        "Static trigger-to-render trace completed",
        "Controlled Electron latency reproduction completed",
        "Controlled Electron 1000/5000-row scale reproduction completed",
        "Existing Work cache-first navigation regression passed",
        "Temporary diagnostic fixtures removed; no ARC_DEBUG markers remain"
      ],
      "runtime_result_ref": "arckit-runtime://runs/RUN-20260824-035326029Z",
      "occurred_at": "2026-08-24T03:59:24.809Z"
    },
    {
      "round": 2,
      "transition_schema_version": "arckit-case-transition/v8",
      "goal": "在既有 Renderer/main-process 信任边界内实现独立 Work 查询投影、即时 SWR 状态切换、请求代际隔离和树感知窗口化渲染，并完成受控性能及回归验证。",
      "outcome": "completed",
      "gap_selection": {
        "mode": "candidate",
        "basis": "该 Gap 是唯一 ready 的 Case candidate，直接阻塞当前 Case 期望结果；四个 Project gaps 均需独立 Case，且不参与本次 Work 性能实现。",
        "snapshot_token": "7f0efd18af1768c8c9a5813f606ecd7fcee08844de696b2e25fefac8eb957c95",
        "selected_ref": "case-gap:CASE-20260823-007:GAP-20260823-007-001",
        "comparison_summary": "选择 Work 状态列表架构优化；GAP-agent-scenario-evaluation、GAP-runtime-resilience-and-adapters、GAP-security-real-project-validation、GAP-cross-record-audit 均 deferred。",
        "fresh_discovery_summary": "Round opening 未发现比持久化实现 Gap 更优先的 fresh candidate；实现和验证未产生新的未解决工作。",
        "considered": [
          {
            "ref": "project-gap:GAP-agent-scenario-evaluation",
            "source": "persisted",
            "eligibility": "case_required",
            "disposition": "deferred",
            "priority_basis": {
              "blocking": "不阻塞当前 Work 性能 Case。",
              "uncertainty": "高。",
              "risk": "高。",
              "user_impact": "低于当前直接报告的高频卡顿。"
            },
            "reason": "需要独立 Case，不能兑现当前 Work 性能期望。"
          },
          {
            "ref": "project-gap:GAP-runtime-resilience-and-adapters",
            "source": "persisted",
            "eligibility": "case_required",
            "disposition": "deferred",
            "priority_basis": {
              "blocking": "不阻塞 Work 查询投影实现。",
              "uncertainty": "中。",
              "risk": "高。",
              "user_impact": "当前优先级低于直接可感知卡顿。"
            },
            "reason": "Runtime resilience 与 Work 列表查询链无直接依赖。"
          },
          {
            "ref": "project-gap:GAP-security-real-project-validation",
            "source": "persisted",
            "eligibility": "case_required",
            "disposition": "deferred",
            "priority_basis": {
              "blocking": "不阻塞当前实现。",
              "uncertainty": "中。",
              "risk": "高。",
              "user_impact": "不直接改善 Work 状态切换。"
            },
            "reason": "真实权限项目验证需要独立 Case。"
          },
          {
            "ref": "project-gap:GAP-cross-record-audit",
            "source": "persisted",
            "eligibility": "case_required",
            "disposition": "deferred",
            "priority_basis": {
              "blocking": "不阻塞当前实现。",
              "uncertainty": "中。",
              "risk": "高。",
              "user_impact": "当前直接用户影响较低。"
            },
            "reason": "跨记录审计需要独立 Case。"
          },
          {
            "ref": "case-gap:CASE-20260823-007:GAP-20260823-007-001",
            "source": "persisted",
            "eligibility": "ready",
            "disposition": "selected",
            "priority_basis": {
              "blocking": "直接阻塞 Case 期望结果。",
              "uncertainty": "低；根因和架构责任边界已在上一轮接受。",
              "risk": "高；必须保护树层级、计数、新鲜度、选择和 Inspector 一致性。",
              "user_impact": "高；状态切换是高频核心操作。"
            },
            "reason": "唯一可在当前 Case 内直接实现并验证用户目标的 ready Gap。"
          }
        ]
      },
      "selected_gap": {
        "id": "GAP-20260823-007-001",
        "responsibility": "agent",
        "goal": "实现 Work 状态列表的独立查询投影、即时 cache-first 状态切换、过期请求隔离和分页或虚拟化渲染，并证明不再受无关全量 snapshot 或整表 DOM 成本阻塞。",
        "reason": "诊断已确认网络与协调等待和全量 DOM 重建是两个独立线性瓶颈；简单去抖、仅改 surface 参数或无边界缓存都不能完整解决。",
        "derived_from": [
          "FACT-20260823-007-001",
          "FACT-20260823-007-002",
          "FACT-20260823-007-003",
          "FACT-20260823-007-004"
        ],
        "blocked_by": [],
        "priority_basis": {
          "blocking": "直接阻塞 Case 期望结果。",
          "uncertainty": "低；根因和实现责任边界已有受控证据。",
          "risk": "高；需保护树层级、计数、新鲜度、选择与 Inspector 一致性。",
          "user_impact": "高；状态切换是高频核心操作。"
        },
        "evidence_required": [
          "240ms 受控数据源延迟下，状态选择视觉反馈低于 80ms 且不保留错误旧列表",
          "1000 行查询结果下首个可交互帧低于 80ms，并避免创建 1000 个同步 DOM 行节点",
          "Platform/IPC 证据证明状态切换不刷新 Automation、认证、组织、成员或 Feedback",
          "查询键覆盖 Workset、项目、状态、搜索、多维筛选和日期，旧响应不能覆盖新选择",
          "缓存未命中、命中、刷新失败、快速连续切换及返回原状态均保持正确新鲜度语义",
          "任务树层级、状态计数、行选择、Inspector、标签与现有 Work 动作回归通过",
          "新增 Electron 状态切换性能回归，并保持现有 work-navigation-electron 测试通过"
        ]
      },
      "planned_transition": {
        "goal": "在既有 Renderer/main-process 信任边界内实现独立 Work 查询投影、即时 SWR 状态切换、请求代际隔离和树感知窗口化渲染，并完成受控性能及回归验证。",
        "expected_state_change": "解决 GAP-20260823-007-001，接受实现与性能事实，将关联的交互、技术、质量和 realized-state impacts 更新为 upheld；既有 Project 决策保持不变。"
      },
      "accepted_state_delta": {
        "resolved_gap": {
          "id": "GAP-20260823-007-001",
          "status": "resolved",
          "outcome": "Work 状态切换现由独立 typed query 驱动，选择即时呈现；完整查询键缓存、请求代际、明确加载或匹配缓存、树祖先保留和80条窗口化渲染已实现并通过受控 Electron 性能回归。",
          "reason": "静态边界、单元测试、全量回归和真实 Electron 测量共同证明远端刷新不再阻塞选择反馈，旧请求不能覆盖新选择，大列表不再同步创建全部行节点。",
          "evidence": [
            "runtime/arcorbit/desktop/renderer/work-query-state.mjs:1-66",
            "runtime/arcorbit/desktop/renderer/renderer.js:736-882,1257-1293,3026-3032",
            "runtime/arcorbit/src/platform-coordinator.mjs:243-328",
            "runtime/arcorbit/desktop/main.mjs:409",
            "runtime/arcorbit/desktop/preload.cjs:78",
            "Controlled Electron, 2026-08-24: 240ms source delay -> 1.8ms immediate selection feedback",
            "Controlled Electron, 2026-08-24: 1000 rows -> 6.3ms first interactive window, 80 rendered rows",
            "Verification: npm run check — 362 tests, 356 passed, 6 environment-gated skips, 0 failed"
          ]
        },
        "facts_added": [
          {
            "id": "FACT-20260823-007-005",
            "revision": 1,
            "status": "accepted",
            "statement": "ArcOrbit Work 状态列表现使用独立的 arcorbit-work-query/v1 typed IPC 和 query-owned 读投影。Renderer 的查询键覆盖 Workset、项目、状态、搜索、创建人、执行人、标签、优先级、起止日期与窗口；有界 SWR 缓存和请求代际只允许当前匹配响应投影。PlatformCoordinator 只读取 Desktop Store、项目、筛选任务树和标签，不读取 Automation、认证、组织、成员或 Feedback；输出窗口保留匹配任务所需的树祖先。Renderer 以事件委托和80条窗口约束同步 DOM，Workshop 仍是真相源。",
            "basis": "生产代码中的 typed IPC、查询状态模块、专用 Coordinator 路径和树感知窗口投影共同实现已接受的技术边界。",
            "evidence": [
              "runtime/arcorbit/desktop/main.mjs:409",
              "runtime/arcorbit/desktop/preload.cjs:78",
              "runtime/arcorbit/src/platform-coordinator.mjs:243-328",
              "runtime/arcorbit/desktop/renderer/work-query-state.mjs:1-66",
              "runtime/arcorbit/desktop/renderer/renderer.js:422-441,736-882,1257-1293",
              "runtime/arcorbit/desktop/renderer/styles.css:315-317"
            ]
          },
          {
            "id": "FACT-20260823-007-006",
            "revision": 1,
            "status": "accepted",
            "statement": "最终受控 Electron 场景中，240ms 数据延迟下 completed 状态选中反馈为1.8ms且未保留错误旧列表；accepted 后5ms切换 pending 时旧 accepted 响应未覆盖新选择；1000条 pending_review 数据的首个可交互窗口为6.3ms，DOM只渲染80行。既有 Work 导航 Electron 回归通过，全量 npm run check 共362项、356通过、6项环境门控跳过、0失败。",
            "basis": "新性能回归直接运行真实 Electron Renderer，并与查询状态、Coordinator、静态 IPC和全量回归测试形成跨层证据。",
            "evidence": [
              "runtime/arcorbit/test/work-status-switch-performance-electron.test.mjs:11-31",
              "runtime/arcorbit/test/fixtures/work-status-switch-performance-electron.mjs",
              "runtime/arcorbit/test/work-query-state.test.mjs",
              "runtime/arcorbit/test/platform-coordinator.test.mjs:119-174",
              "Verification: ARCORBIT_ELECTRON_WORK_STATUS_PERFORMANCE_TEST=1 node --test test/work-status-switch-performance-electron.test.mjs — 1 passed, 0 failed",
              "Verification: ARCORBIT_ELECTRON_WORK_NAVIGATION_TEST=1 node --test test/work-navigation-electron.test.mjs — 1 passed, 0 failed",
              "Verification: npm run check — 362 tests, 356 passed, 6 skipped, 0 failed",
              "Controlled Electron final measurement, 2026-08-24: immediate=1.8ms; first_interactive_1000=6.3ms; rendered_rows=80"
            ]
          }
        ],
        "facts_superseded": [],
        "impacts_added": [],
        "impacts_updated": [
          {
            "id": "IMPACT-20260823-007-001",
            "fact_id": "FACT-20260823-007-005",
            "fact_revision": 1,
            "target": {
              "kind": "software_decision",
              "ref": "experience_and_interaction",
              "revision": 36
            },
            "effect": "upheld",
            "reason": "状态点击现在立即确认新选择，并立即显示完整查询键对应的缓存或明确加载态；后台结果受代际控制，符合已接受的 Work 交互语义。",
            "gap_ids": [],
            "evidence": [
              "runtime/arcorbit/desktop/renderer/renderer.js:736-767,1257-1282,3026-3032",
              "Controlled Electron: 240ms source delay -> 1.8ms immediate selection feedback"
            ]
          },
          {
            "id": "IMPACT-20260823-007-002",
            "fact_id": "FACT-20260823-007-005",
            "fact_revision": 1,
            "target": {
              "kind": "software_decision",
              "ref": "technical_foundation",
              "revision": 31
            },
            "effect": "upheld",
            "reason": "实现兑现了独立 query-owned 投影、完整查询键、有界 SWR、请求代际、专用 main-process 协调和树感知窗口化边界，未引入第二真相源。",
            "gap_ids": [],
            "evidence": [
              "runtime/arcorbit/desktop/renderer/work-query-state.mjs:1-66",
              "runtime/arcorbit/src/platform-coordinator.mjs:243-328",
              "runtime/arcorbit/desktop/main.mjs:409",
              "runtime/arcorbit/desktop/preload.cjs:78"
            ]
          },
          {
            "id": "IMPACT-20260823-007-003",
            "fact_id": "FACT-20260823-007-006",
            "fact_revision": 1,
            "target": {
              "kind": "software_decision",
              "ref": "quality_and_validation",
              "revision": 9
            },
            "effect": "upheld",
            "reason": "新增测试覆盖完整查询键、SWR缓存、错误和竞态隔离、无关数据源排除、树祖先保留、240ms延迟、1000行窗口化及既有Work导航回归。",
            "gap_ids": [],
            "evidence": [
              "runtime/arcorbit/test/work-query-state.test.mjs",
              "runtime/arcorbit/test/platform-coordinator.test.mjs:119-174",
              "runtime/arcorbit/test/work-status-switch-performance-electron.test.mjs:11-31",
              "Verification: npm run check — 362 tests, 356 passed, 6 skipped, 0 failed"
            ]
          },
          {
            "id": "IMPACT-20260823-007-004",
            "fact_id": "FACT-20260823-007-006",
            "fact_revision": 1,
            "target": {
              "kind": "software_invariant",
              "ref": "accepted-facts-are-realized",
              "revision": null
            },
            "effect": "upheld",
            "reason": "生产实现和直接 Electron 测量现已兑现 Case 对可信状态切换性能、无陈旧覆盖和大列表有界渲染的期望。",
            "gap_ids": [],
            "evidence": [
              "Controlled Electron final measurement: immediate=1.8ms, first_interactive_1000=6.3ms, rendered_rows=80",
              "runtime/arcorbit/desktop/renderer/renderer.js:736-767,1257-1293",
              "runtime/arcorbit/src/platform-coordinator.mjs:243-328"
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
        "evidence": [
          "Project experience_and_interaction@36、technical_foundation@31 与 quality_and_validation@9 已完整规定本轮实现边界；实现未改变这些决策。"
        ]
      },
      "invariant_assessment": {
        "project_revision": 203,
        "judgments": [
          {
            "invariant_ref": "product-expectations-remain-recoverable",
            "disposition": "not_relevant",
            "reason": "本轮实现已接受的 Work 性能架构，没有改变能力范围、业务规则或产品成功口径。",
            "fact_refs": [],
            "evidence": [],
            "gap_refs": []
          },
          {
            "invariant_ref": "interaction-expectations-remain-recoverable",
            "disposition": "upheld",
            "reason": "即时选择、匹配缓存或明确加载态、后台刷新、失败保留匹配缓存及旧响应隔离均由生产实现和 Electron 回归证明。",
            "fact_refs": [
              "FACT-20260823-007-005",
              "FACT-20260823-007-006"
            ],
            "evidence": [
              "runtime/arcorbit/desktop/renderer/renderer.js:736-767,1257-1293,3026-3032",
              "runtime/arcorbit/test/work-status-switch-performance-electron.test.mjs:11-31",
              "Controlled Electron: 240ms source delay -> 1.8ms selection feedback"
            ],
            "gap_refs": []
          },
          {
            "invariant_ref": "visual-language-remains-consistent",
            "disposition": "not_relevant",
            "reason": "新增分页控件复用现有按钮、颜色与面板样式，没有建立或改变视觉语言、Design Token或组件外观规则。",
            "fact_refs": [],
            "evidence": [],
            "gap_refs": []
          },
          {
            "invariant_ref": "technical-decisions-remain-explainable",
            "disposition": "upheld",
            "reason": "专用 typed IPC、query-owned 状态、完整键、有界缓存、代际控制、Main-process数据边界和树感知窗口职责均清晰落在既有架构层。",
            "fact_refs": [
              "FACT-20260823-007-005"
            ],
            "evidence": [
              "runtime/arcorbit/desktop/main.mjs:409",
              "runtime/arcorbit/desktop/preload.cjs:78",
              "runtime/arcorbit/src/platform-coordinator.mjs:243-328",
              "runtime/arcorbit/desktop/renderer/work-query-state.mjs:1-66"
            ],
            "gap_refs": []
          },
          {
            "invariant_ref": "accepted-facts-are-realized",
            "disposition": "upheld",
            "reason": "诊断阶段接受的同步全量刷新和整表DOM瓶颈已分别由专用后台查询与窗口化渲染消除，直接测量达到既定门槛。",
            "fact_refs": [
              "FACT-20260823-007-005",
              "FACT-20260823-007-006"
            ],
            "evidence": [
              "runtime/arcorbit/desktop/renderer/renderer.js:736-767,1257-1293",
              "Controlled Electron final measurement: immediate=1.8ms; first_interactive_1000=6.3ms; rendered_rows=80",
              "Verification: ARCORBIT_ELECTRON_WORK_STATUS_PERFORMANCE_TEST=1 node --test test/work-status-switch-performance-electron.test.mjs — passed"
            ],
            "gap_refs": []
          },
          {
            "invariant_ref": "material-risks-have-credible-evidence",
            "disposition": "upheld",
            "reason": "陈旧覆盖、缓存错误、无关数据扇出、树层级截断、大列表DOM成本和既有Work行为均有可重复的单元、跨层及Electron证据；绝对性能结论限定于受控场景。",
            "fact_refs": [
              "FACT-20260823-007-006"
            ],
            "evidence": [
              "runtime/arcorbit/test/work-query-state.test.mjs",
              "runtime/arcorbit/test/platform-coordinator.test.mjs:119-174",
              "runtime/arcorbit/test/work-navigation-electron.test.mjs",
              "runtime/arcorbit/test/work-status-switch-performance-electron.test.mjs",
              "Verification: npm run check — 362 tests, 356 passed, 6 environment-gated skips, 0 failed"
            ],
            "gap_refs": []
          }
        ]
      },
      "evidence": [
        "Dedicated Work query and typed IPC implemented",
        "Complete query-key SWR cache and request-generation isolation implemented",
        "Tree-aware 80-item window projection and delegated row events implemented",
        "Controlled Electron latency, rapid-switch and 1000-row regression passed",
        "Existing Work navigation Electron regression passed",
        "Full ArcOrbit check passed with 0 failures",
        "git diff --check passed; no ARC_DEBUG, console.time or debugger markers found"
      ],
      "runtime_result_ref": "arckit-runtime://runs/RUN-20260824-035326029Z",
      "occurred_at": "2026-08-24T04:17:47.133Z"
    },
    {
      "round": 3,
      "transition_schema_version": "arckit-case-transition/v8",
      "goal": "对已完成的 Work 查询优化执行 implementation correctness、problem resolution、verification credibility、regression risk 与 minimality 五维审查。",
      "outcome": "completed",
      "gap_selection": {
        "mode": "candidate",
        "basis": "所有普通 Case gaps 和 state impacts 已闭合；Completion Review 是唯一 ready 的当前 Case candidate，并直接阻塞 Case 关闭。四个 Project gaps 均需独立 Case，不能替代当前终态审查。",
        "snapshot_token": "22d28498fda39820dca3b99a6d08bc94803e0882a2cea023a24b91f31ba9dca4",
        "selected_ref": "case-gap:CASE-20260823-007:CASE-20260823-007:completion-review:1",
        "comparison_summary": "选择 CASE-20260823-007 的 Completion Review；GAP-agent-scenario-evaluation、GAP-runtime-resilience-and-adapters、GAP-security-real-project-validation 和 GAP-cross-record-audit 均因需要独立 Case 而 deferred。",
        "fresh_discovery_summary": "只读代码审查与隔离复现发现同键乱序响应可污染 SWR 缓存；该发现作为 Completion Review finding 提交，不在审查当轮修复。",
        "considered": [
          {
            "ref": "project-gap:GAP-agent-scenario-evaluation",
            "source": "persisted",
            "eligibility": "case_required",
            "disposition": "deferred",
            "priority_basis": {
              "blocking": "不阻塞当前 Case 的终态审查。",
              "uncertainty": "高。",
              "risk": "高。",
              "user_impact": "低于当前 Case 关闭门禁。"
            },
            "reason": "需要独立 Case，且与 Work 性能实现审查无直接依赖。"
          },
          {
            "ref": "project-gap:GAP-runtime-resilience-and-adapters",
            "source": "persisted",
            "eligibility": "case_required",
            "disposition": "deferred",
            "priority_basis": {
              "blocking": "不阻塞当前 Completion Review。",
              "uncertainty": "中。",
              "risk": "高。",
              "user_impact": "当前直接影响低于 Work Case 审查。"
            },
            "reason": "Runtime resilience 与当前 Work 查询实现审查边界不同。"
          },
          {
            "ref": "project-gap:GAP-security-real-project-validation",
            "source": "persisted",
            "eligibility": "case_required",
            "disposition": "deferred",
            "priority_basis": {
              "blocking": "不阻塞当前审查。",
              "uncertainty": "中。",
              "risk": "高。",
              "user_impact": "不直接决定 Work 状态切换实现是否可关闭。"
            },
            "reason": "真实权限项目验证需独立 Case。"
          },
          {
            "ref": "project-gap:GAP-cross-record-audit",
            "source": "persisted",
            "eligibility": "case_required",
            "disposition": "deferred",
            "priority_basis": {
              "blocking": "不阻塞当前 Case Completion Review。",
              "uncertainty": "中。",
              "risk": "高。",
              "user_impact": "低于当前关闭门禁。"
            },
            "reason": "跨记录审计需独立 Case。"
          },
          {
            "ref": "case-gap:CASE-20260823-007:CASE-20260823-007:completion-review:1",
            "source": "persisted",
            "eligibility": "ready",
            "disposition": "selected",
            "priority_basis": {
              "blocking": "直接阻塞 CASE-20260823-007 关闭。",
              "uncertainty": "低；实现与验证证据已完整可读。",
              "risk": "高；需独立检查正确性、新鲜度竞态与回归证据。",
              "user_impact": "高；决定性能优化能否可信交付。"
            },
            "reason": "唯一 ready 的当前 Case candidate，且是普通工作闭合后的强制终态门禁。"
          }
        ]
      },
      "selected_gap": {
        "id": "CASE-20260823-007:completion-review:1",
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
        "goal": "对已完成的 Work 查询优化执行 implementation correctness、problem resolution、verification credibility、regression risk 与 minimality 五维审查。",
        "expected_state_change": "记录同键旧响应污染 SWR 缓存的 review finding，使 Ledger 派生后续 Agent 修复 Gap；Case 保持未关闭。"
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
            "problem_resolution": "findings",
            "verification_credibility": "findings",
            "regression_risk": "findings",
            "minimality": "clean"
          },
          "findings": [
            {
              "id": "FINDING-20260823-007-001",
              "kind": "error",
              "statement": "Work query state 在校验请求是否仍为当前 generation 之前无条件写入缓存；当同一查询键的较新请求先完成、旧请求后完成时，旧响应会覆盖较新 SWR 缓存，下一次访问该查询会先显示陈旧数据。现有单元和 Electron 竞态测试仅覆盖不同状态键，未覆盖同键乱序完成。",
              "responsibility": "agent",
              "artifact_refs": [
                "runtime/arcorbit/desktop/renderer/work-query-state.mjs",
                "runtime/arcorbit/test/work-query-state.test.mjs",
                "runtime/arcorbit/test/work-status-switch-performance-electron.test.mjs"
              ],
              "evidence": [
                "runtime/arcorbit/desktop/renderer/work-query-state.mjs:35-44 — accept 在 current generation 检查前执行 touch(request.key, value)",
                "Isolated reproduction, 2026-08-24: newer same-key response accepted first, older response accepted second => {\"first_current\":false,\"second_current\":true,\"cached_version\":\"old\"}",
                "runtime/arcorbit/test/work-query-state.test.mjs:20-34 — stale-response coverage uses pending and completed two different keys",
                "runtime/arcorbit/test/fixtures/work-status-switch-performance-electron.mjs — rapid-switch coverage uses accepted and pending two different keys"
              ]
            }
          ],
          "evidence": [
            "Reviewed content revision 2 production query state, Renderer integration, PlatformCoordinator projection and regression tests",
            "Focused verification: node --test test/work-query-state.test.mjs test/platform-coordinator.test.mjs test/desktop-renderer.test.mjs — 58 passed, 0 failed",
            "Accepted verification baseline: npm run check — 362 tests, 356 passed, 6 environment-gated skips, 0 failed",
            "Isolated same-key out-of-order reproduction returned cached_version=old"
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
        "project_revision": 203,
        "judgments": [
          {
            "invariant_ref": "product-expectations-remain-recoverable",
            "disposition": "not_relevant",
            "reason": "Completion Review 未建立或改变产品能力、业务规则或成功口径。",
            "fact_refs": [],
            "evidence": [],
            "gap_refs": []
          },
          {
            "invariant_ref": "interaction-expectations-remain-recoverable",
            "disposition": "upheld",
            "reason": "Work 的即时选择、匹配缓存或加载态及后台刷新语义仍由 Project decision 和现有实现证据持久表达；新发现作为 review finding 阻止 Case 关闭。",
            "fact_refs": [
              "FACT-20260823-007-005",
              "FACT-20260823-007-006"
            ],
            "evidence": [
              "Project decision: experience_and_interaction@36",
              "runtime/arcorbit/desktop/renderer/renderer.js:736-767,1257-1293,3026-3032"
            ],
            "gap_refs": []
          },
          {
            "invariant_ref": "visual-language-remains-consistent",
            "disposition": "not_relevant",
            "reason": "审查未发现或改变视觉语言、Design Token 或组件外观规则。",
            "fact_refs": [],
            "evidence": [],
            "gap_refs": []
          },
          {
            "invariant_ref": "technical-decisions-remain-explainable",
            "disposition": "upheld",
            "reason": "专用 typed IPC、query-owned 投影、缓存、请求代际和窗口化的责任边界仍清晰可恢复；finding 指向该边界内的具体实现错误。",
            "fact_refs": [
              "FACT-20260823-007-005"
            ],
            "evidence": [
              "Project decision: technical_foundation@31",
              "runtime/arcorbit/desktop/renderer/work-query-state.mjs:1-66",
              "runtime/arcorbit/src/platform-coordinator.mjs:243-328"
            ],
            "gap_refs": []
          },
          {
            "invariant_ref": "accepted-facts-are-realized",
            "disposition": "upheld",
            "reason": "当前 canonical accepted facts 仍有生产实现和受控 Electron 测量支撑；Completion Review 新发现尚未提升为软件事实，并通过 finding 阻止 clean closeout，等待后续普通 Gap 调查和修复。",
            "fact_refs": [
              "FACT-20260823-007-005",
              "FACT-20260823-007-006"
            ],
            "evidence": [
              "runtime/arcorbit/desktop/renderer/renderer.js:736-767,1257-1293",
              "Controlled Electron accepted measurement: immediate=1.8ms; first_interactive_1000=6.3ms; rendered_rows=80",
              "Completion Review finding local:review-finding:same-key-cache-overwrite"
            ],
            "gap_refs": []
          },
          {
            "invariant_ref": "material-risks-have-credible-evidence",
            "disposition": "upheld",
            "reason": "性能、不同键竞态和窗口化风险已有可重复证据；本轮以独立同键乱序复现揭示现有覆盖遗漏，并未把该风险错误声明为已控制。",
            "fact_refs": [
              "FACT-20260823-007-006"
            ],
            "evidence": [
              "Focused verification: 58 passed, 0 failed",
              "Isolated same-key reproduction: cached_version=old",
              "runtime/arcorbit/test/work-query-state.test.mjs",
              "runtime/arcorbit/test/work-status-switch-performance-electron.test.mjs"
            ],
            "gap_refs": []
          }
        ]
      },
      "evidence": [
        "Completion Review executed against Case content revision 2",
        "Production query-state acceptance order inspected",
        "Same-key out-of-order completion reproduced deterministically",
        "Focused unit and cross-layer test suite passed while confirming the coverage omission",
        "No implementation files changed during the review round"
      ],
      "runtime_result_ref": "arckit-runtime://runs/RUN-20260824-035326029Z",
      "occurred_at": "2026-08-24T04:22:21.256Z"
    },
    {
      "round": 4,
      "transition_schema_version": "arckit-case-transition/v8",
      "goal": "在 Work query-state 边界阻止较旧的同键响应覆盖较新缓存，并以单元、真实 Electron 和全量回归证明既有查询及性能行为未退化。",
      "outcome": "completed",
      "gap_selection": {
        "mode": "candidate",
        "basis": "该 review-finding Gap 是唯一 ready 的当前 Case candidate，直接阻塞修复后的 Completion Review 和 Case 关闭；四个 Project gaps 均需独立 Case。",
        "snapshot_token": "f38ec7ca35f8036856b3697dbeb14815a5123c120dcc048b667ff17af0dba68a",
        "selected_ref": "case-gap:CASE-20260823-007:CASE-20260823-007:review-finding:FINDING-20260823-007-001",
        "comparison_summary": "选择同一查询键旧响应污染 SWR 缓存的 review-finding Gap；GAP-agent-scenario-evaluation、GAP-runtime-resilience-and-adapters、GAP-security-real-project-validation 和 GAP-cross-record-audit 均 deferred。",
        "fresh_discovery_summary": "修复与验证过程中未发现会改变本轮对象、范围或验收方式的更高优先级 fresh candidate。",
        "considered": [
          {
            "ref": "project-gap:GAP-agent-scenario-evaluation",
            "source": "persisted",
            "eligibility": "case_required",
            "disposition": "deferred",
            "priority_basis": {
              "blocking": "不阻塞当前 Work Case 修复。",
              "uncertainty": "高。",
              "risk": "高。",
              "user_impact": "低于当前陈旧数据风险。"
            },
            "reason": "需要独立 Case，与当前缓存竞态无直接依赖。"
          },
          {
            "ref": "project-gap:GAP-runtime-resilience-and-adapters",
            "source": "persisted",
            "eligibility": "case_required",
            "disposition": "deferred",
            "priority_basis": {
              "blocking": "不阻塞当前修复。",
              "uncertainty": "中。",
              "risk": "高。",
              "user_impact": "当前直接影响较低。"
            },
            "reason": "Runtime resilience 与 Renderer 查询缓存代际无直接依赖。"
          },
          {
            "ref": "project-gap:GAP-security-real-project-validation",
            "source": "persisted",
            "eligibility": "case_required",
            "disposition": "deferred",
            "priority_basis": {
              "blocking": "不阻塞当前修复。",
              "uncertainty": "中。",
              "risk": "高。",
              "user_impact": "不直接改善 Work 查询新鲜度。"
            },
            "reason": "真实权限项目验证需独立 Case。"
          },
          {
            "ref": "project-gap:GAP-cross-record-audit",
            "source": "persisted",
            "eligibility": "case_required",
            "disposition": "deferred",
            "priority_basis": {
              "blocking": "不阻塞当前修复。",
              "uncertainty": "中。",
              "risk": "高。",
              "user_impact": "低于当前 Case 关闭门禁。"
            },
            "reason": "跨记录审计需独立 Case。"
          },
          {
            "ref": "case-gap:CASE-20260823-007:CASE-20260823-007:review-finding:FINDING-20260823-007-001",
            "source": "persisted",
            "eligibility": "ready",
            "disposition": "selected",
            "priority_basis": {
              "blocking": "直接阻塞 Completion Review 和 Case 关闭。",
              "uncertainty": "低；根因已有确定性复现。",
              "risk": "高；陈旧响应可污染 SWR 缓存。",
              "user_impact": "高；返回相同状态时可能显示旧任务数据。"
            },
            "reason": "唯一 ready 的当前 Case Gap，且修复边界与验收场景已由 review finding 明确。"
          }
        ]
      },
      "selected_gap": {
        "id": "CASE-20260823-007:review-finding:FINDING-20260823-007-001",
        "responsibility": "agent",
        "goal": "Resolve review finding: Work query state 在校验请求是否仍为当前 generation 之前无条件写入缓存；当同一查询键的较新请求先完成、旧请求后完成时，旧响应会覆盖较新 SWR 缓存，下一次访问该查询会先显示陈旧数据。现有单元和 Electron 竞态测试仅覆盖不同状态键，未覆盖同键乱序完成。",
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
          "runtime/arcorbit/desktop/renderer/work-query-state.mjs",
          "runtime/arcorbit/test/work-query-state.test.mjs",
          "runtime/arcorbit/test/work-status-switch-performance-electron.test.mjs",
          "runtime/arcorbit/desktop/renderer/work-query-state.mjs:35-44 — accept 在 current generation 检查前执行 touch(request.key, value)",
          "Isolated reproduction, 2026-08-24: newer same-key response accepted first, older response accepted second => {\"first_current\":false,\"second_current\":true,\"cached_version\":\"old\"}",
          "runtime/arcorbit/test/work-query-state.test.mjs:20-34 — stale-response coverage uses pending and completed two different keys",
          "runtime/arcorbit/test/fixtures/work-status-switch-performance-electron.mjs — rapid-switch coverage uses accepted and pending two different keys"
        ]
      },
      "planned_transition": {
        "goal": "在 Work query-state 边界阻止较旧的同键响应覆盖较新缓存，并以单元、真实 Electron 和全量回归证明既有查询及性能行为未退化。",
        "expected_state_change": "解决 review-finding Gap，接受按键缓存 generation 防护和同键乱序回归证据，使 Case 返回 Completion Review ready 状态。"
      },
      "accepted_state_delta": {
        "resolved_gap": {
          "id": "CASE-20260823-007:review-finding:FINDING-20260823-007-001",
          "status": "resolved",
          "outcome": "Work query SWR 缓存现按查询键保留最新成功缓存 generation；较旧同键响应不再覆盖较新投影，并已补充同键乱序单元和 Electron 回归。",
          "reason": "修复直接约束 review finding 指向的无条件 cache touch，同时保留不同查询键响应的后台缓存语义；修复前后隔离复现分别得到 cached_version=old 与 cached_version=new。",
          "evidence": [
            "runtime/arcorbit/desktop/renderer/work-query-state.mjs:26-81",
            "runtime/arcorbit/test/work-query-state.test.mjs:33-42",
            "runtime/arcorbit/test/fixtures/work-status-switch-performance-electron.mjs:54-77",
            "runtime/arcorbit/test/work-status-switch-performance-electron.test.mjs:27-31",
            "Post-fix isolated reproduction: {\"first_current\":false,\"second_current\":true,\"cached_version\":\"new\"}",
            "Verification: ARCORBIT_ELECTRON_WORK_STATUS_PERFORMANCE_TEST=1 node --test test/work-status-switch-performance-electron.test.mjs — 1 passed, 0 failed",
            "Verification: ARCORBIT_ELECTRON_WORK_NAVIGATION_TEST=1 node --test test/work-navigation-electron.test.mjs — 1 passed, 0 failed",
            "Verification: npm run check — 363 tests, 357 passed, 6 environment-gated skips, 0 failed"
          ]
        },
        "facts_added": [
          {
            "id": "FACT-20260823-007-007",
            "revision": 1,
            "status": "accepted",
            "statement": "Work query-state 现为每个查询键记录最后一次成功写入缓存的 generation。结构匹配但 generation 更旧的同键响应不会改写较新 SWR 缓存；不同查询键且没有同键较新缓存的后台响应仍可进入有界缓存。缓存清空和 LRU 淘汰会同步移除 generation 元数据。单元及真实 Electron 回访场景证明 newer-first、older-last 后重新进入同一状态立即显示 newer 缓存。",
            "basis": "生产实现的 per-key cachedGenerations 防护与修复前后隔离复现、单元测试和真实 Renderer 竞态回归形成直接证据。",
            "evidence": [
              "runtime/arcorbit/desktop/renderer/work-query-state.mjs:26-81",
              "runtime/arcorbit/test/work-query-state.test.mjs:18-42",
              "runtime/arcorbit/test/fixtures/work-status-switch-performance-electron.mjs:54-77",
              "runtime/arcorbit/test/work-status-switch-performance-electron.test.mjs:27-31",
              "Pre-fix isolated reproduction: cached_version=old",
              "Post-fix isolated reproduction: cached_version=new",
              "Verification: npm run check — 363 tests, 357 passed, 6 skipped, 0 failed"
            ]
          }
        ],
        "facts_superseded": [],
        "impacts_added": [
          {
            "id": "IMPACT-20260823-007-005",
            "fact_id": "FACT-20260823-007-007",
            "fact_revision": 1,
            "target": {
              "kind": "software_decision",
              "ref": "experience_and_interaction",
              "revision": 36
            },
            "effect": "upheld",
            "reason": "旧同键响应不再污染后续返回状态时展示的匹配缓存，兑现旧请求不得覆盖较新选择和数据的新鲜度语义。",
            "gap_ids": [],
            "evidence": [
              "runtime/arcorbit/desktop/renderer/work-query-state.mjs:42-53",
              "Electron same-key cache assertion: new_visible=true, old_visible=false, loading_visible=true"
            ]
          },
          {
            "id": "IMPACT-20260823-007-006",
            "fact_id": "FACT-20260823-007-007",
            "fact_revision": 1,
            "target": {
              "kind": "software_decision",
              "ref": "technical_foundation",
              "revision": 31
            },
            "effect": "upheld",
            "reason": "修复保持 query-owned、有界 SWR 和 request-generation 架构，并在缓存所有权层增加最小的 per-key freshness guard。",
            "gap_ids": [],
            "evidence": [
              "runtime/arcorbit/desktop/renderer/work-query-state.mjs:26-81"
            ]
          },
          {
            "id": "IMPACT-20260823-007-007",
            "fact_id": "FACT-20260823-007-007",
            "fact_revision": 1,
            "target": {
              "kind": "software_decision",
              "ref": "quality_and_validation",
              "revision": 9
            },
            "effect": "upheld",
            "reason": "新增测试直接覆盖此前遗漏的同键 newer-first、older-last 顺序，并保持不同键竞态、Electron 性能、Work 导航和全量回归通过。",
            "gap_ids": [],
            "evidence": [
              "runtime/arcorbit/test/work-query-state.test.mjs:33-42",
              "runtime/arcorbit/test/work-status-switch-performance-electron.test.mjs:27-31",
              "Verification: npm run check — 363 tests, 357 passed, 6 skipped, 0 failed"
            ]
          },
          {
            "id": "IMPACT-20260823-007-008",
            "fact_id": "FACT-20260823-007-007",
            "fact_revision": 1,
            "target": {
              "kind": "software_invariant",
              "ref": "accepted-facts-are-realized",
              "revision": null
            },
            "effect": "upheld",
            "reason": "review finding 所揭示的陈旧缓存覆盖已在生产 query-state 路径修复，并由直接回访场景证明。",
            "gap_ids": [],
            "evidence": [
              "Post-fix isolated reproduction: cached_version=new",
              "Electron same-key cache assertion passed"
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
        "software_definition_changes": [],
        "software_invariant_changes": [],
        "project_gap_changes": [],
        "selection_context_change": null,
        "evidence": []
      },
      "invariant_assessment": {
        "project_revision": 203,
        "judgments": [
          {
            "invariant_ref": "product-expectations-remain-recoverable",
            "disposition": "not_relevant",
            "reason": "本轮修复查询缓存竞态，没有改变产品能力、业务规则或成功口径。",
            "fact_refs": [],
            "evidence": [],
            "gap_refs": []
          },
          {
            "invariant_ref": "interaction-expectations-remain-recoverable",
            "disposition": "upheld",
            "reason": "同键旧响应不能再污染较新缓存；即时选择、匹配缓存和后台刷新语义均由生产实现及 Electron 回访证据支持。",
            "fact_refs": [
              "FACT-20260823-007-007"
            ],
            "evidence": [
              "Project decision: experience_and_interaction@36",
              "runtime/arcorbit/desktop/renderer/work-query-state.mjs:42-53",
              "Electron same-key cache assertion passed"
            ],
            "gap_refs": []
          },
          {
            "invariant_ref": "visual-language-remains-consistent",
            "disposition": "not_relevant",
            "reason": "修复未改变任何视觉语言、Design Token、布局或组件外观。",
            "fact_refs": [],
            "evidence": [],
            "gap_refs": []
          },
          {
            "invariant_ref": "technical-decisions-remain-explainable",
            "disposition": "upheld",
            "reason": "缓存新鲜度由 query-state 内显式的 per-key cached generation 负责，未改变 Renderer/main-process、typed IPC 或 Workshop source-of-truth 边界。",
            "fact_refs": [
              "FACT-20260823-007-007"
            ],
            "evidence": [
              "Project decision: technical_foundation@31",
              "runtime/arcorbit/desktop/renderer/work-query-state.mjs:26-81"
            ],
            "gap_refs": []
          },
          {
            "invariant_ref": "accepted-facts-are-realized",
            "disposition": "upheld",
            "reason": "已接受的请求代际与 SWR 新鲜度语义现在覆盖同键乱序完成，修复前的陈旧缓存复现已变为 newer 缓存保持。",
            "fact_refs": [
              "FACT-20260823-007-007",
              "FACT-20260823-007-005",
              "FACT-20260823-007-006"
            ],
            "evidence": [
              "Post-fix isolated reproduction: cached_version=new",
              "Verification: Electron Work status performance regression passed",
              "Verification: Electron Work navigation regression passed"
            ],
            "gap_refs": []
          },
          {
            "invariant_ref": "material-risks-have-credible-evidence",
            "disposition": "upheld",
            "reason": "同键竞态由修复前后确定性复现、纯状态单元测试、真实 Electron 缓存回访及全量回归共同覆盖；结论限定于该已识别顺序风险。",
            "fact_refs": [
              "FACT-20260823-007-007"
            ],
            "evidence": [
              "runtime/arcorbit/test/work-query-state.test.mjs:33-42",
              "runtime/arcorbit/test/fixtures/work-status-switch-performance-electron.mjs:54-77",
              "Verification: npm run check — 363 tests, 357 passed, 6 environment-gated skips, 0 failed",
              "git diff --check passed; no ARC_DEBUG, console.time, console.timeEnd or debugger markers remain"
            ],
            "gap_refs": []
          }
        ]
      },
      "evidence": [
        "Root-cause logic matched the deterministic same-key response ordering; no temporary log instrumentation was required",
        "Per-key cached generation guard implemented without changing different-key SWR behavior",
        "Pre-fix isolated reproduction: cached_version=old",
        "Post-fix isolated reproduction: cached_version=new",
        "Focused unit and cross-layer suite: 59 passed, 0 failed",
        "Electron Work status performance and same-key cache regression: 1 passed, 0 failed",
        "Electron Work navigation regression: 1 passed, 0 failed",
        "Full ArcOrbit check: 363 tests, 357 passed, 6 environment-gated skips, 0 failed",
        "git diff --check passed and temporary-debug marker search was clean"
      ],
      "runtime_result_ref": "arckit-runtime://runs/RUN-20260824-035326029Z",
      "occurred_at": "2026-08-24T04:26:45.198Z"
    },
    {
      "round": 5,
      "transition_schema_version": "arckit-case-transition/v8",
      "goal": "对 content revision 3 执行 implementation correctness、problem resolution、verification credibility、regression risk 和 minimality 五维审查。",
      "outcome": "completed",
      "gap_selection": {
        "mode": "candidate",
        "basis": "所有普通 Case gaps 和 state impacts 已闭合；content revision 3 的 Completion Review 是唯一 ready Case candidate，直接阻塞 Case 关闭。四个 Project gaps 均需独立 Case。",
        "snapshot_token": "6cda24de66bdf040fcbf98dfef4a0ad9dbf3d7566473f133d66002a64bb91a65",
        "selected_ref": "case-gap:CASE-20260823-007:CASE-20260823-007:completion-review:2",
        "comparison_summary": "选择 CASE-20260823-007 的第二轮 Completion Review；GAP-agent-scenario-evaluation、GAP-runtime-resilience-and-adapters、GAP-security-real-project-validation 和 GAP-cross-record-audit 均 deferred。",
        "fresh_discovery_summary": "只读审查发现 clear 与清理前在途请求的竞态；该问题作为 Completion Review finding 提交，不在审查当轮修复。",
        "considered": [
          {
            "ref": "project-gap:GAP-agent-scenario-evaluation",
            "source": "persisted",
            "eligibility": "case_required",
            "disposition": "deferred",
            "priority_basis": {
              "blocking": "不阻塞当前 Case 终态审查。",
              "uncertainty": "高。",
              "risk": "高。",
              "user_impact": "低于当前关闭门禁。"
            },
            "reason": "需要独立 Case，与 Work 查询缓存审查无直接依赖。"
          },
          {
            "ref": "project-gap:GAP-runtime-resilience-and-adapters",
            "source": "persisted",
            "eligibility": "case_required",
            "disposition": "deferred",
            "priority_basis": {
              "blocking": "不阻塞当前 Completion Review。",
              "uncertainty": "中。",
              "risk": "高。",
              "user_impact": "当前直接影响较低。"
            },
            "reason": "Runtime resilience 与 Renderer Work 查询缓存边界不同。"
          },
          {
            "ref": "project-gap:GAP-security-real-project-validation",
            "source": "persisted",
            "eligibility": "case_required",
            "disposition": "deferred",
            "priority_basis": {
              "blocking": "不阻塞当前审查。",
              "uncertainty": "中。",
              "risk": "高。",
              "user_impact": "不直接决定当前 Work Case 是否可关闭。"
            },
            "reason": "真实权限项目验证需独立 Case。"
          },
          {
            "ref": "project-gap:GAP-cross-record-audit",
            "source": "persisted",
            "eligibility": "case_required",
            "disposition": "deferred",
            "priority_basis": {
              "blocking": "不阻塞当前审查。",
              "uncertainty": "中。",
              "risk": "高。",
              "user_impact": "低于当前 Case 关闭门禁。"
            },
            "reason": "跨记录审计需独立 Case。"
          },
          {
            "ref": "case-gap:CASE-20260823-007:CASE-20260823-007:completion-review:2",
            "source": "persisted",
            "eligibility": "ready",
            "disposition": "selected",
            "priority_basis": {
              "blocking": "直接阻塞 CASE-20260823-007 关闭。",
              "uncertainty": "低；当前实现和证据可直接审查。",
              "risk": "高；需检查修复后的新鲜度生命周期与回归边界。",
              "user_impact": "高；决定优化能否可信交付。"
            },
            "reason": "唯一 ready 的当前 Case candidate，也是普通工作闭合后的强制终态门禁。"
          }
        ]
      },
      "selected_gap": {
        "id": "CASE-20260823-007:completion-review:2",
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
        "goal": "对 content revision 3 执行 implementation correctness、problem resolution、verification credibility、regression risk 和 minimality 五维审查。",
        "expected_state_change": "记录 clear 后在途旧响应重新填充缓存的 review finding，由 Ledger 派生后续 Agent 修复 Gap；Case 保持未关闭。"
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
            "problem_resolution": "findings",
            "verification_credibility": "findings",
            "regression_risk": "findings",
            "minimality": "clean"
          },
          "findings": [
            {
              "id": "FINDING-20260823-007-002",
              "kind": "error",
              "statement": "Work query-state 的 clear() 会提升全局 generation 并清空 cache 与 cachedGenerations，但 accept() 只比较被清空后的 per-key cached generation。清理前发出的请求若在 clear 后完成，仍会重新写入缓存；再次使用相同查询键时会得到清理前数据。Renderer 在 Workset 切换、登录和退出时调用 clear，因此该竞态可破坏身份或上下文切换后的缓存失效。现有测试未覆盖 clear 与在途响应的顺序。",
              "responsibility": "agent",
              "artifact_refs": [
                "runtime/arcorbit/desktop/renderer/work-query-state.mjs",
                "runtime/arcorbit/desktop/renderer/renderer.js",
                "runtime/arcorbit/test/work-query-state.test.mjs",
                "runtime/arcorbit/test/work-status-switch-performance-electron.test.mjs"
              ],
              "evidence": [
                "runtime/arcorbit/desktop/renderer/work-query-state.mjs:42-49,64-68 — clear 清空 cachedGenerations 后，旧 request generation 大于默认 0，accept 重新执行 touch",
                "runtime/arcorbit/desktop/renderer/renderer.js:456-461,3179-3185,3208-3214 — Workset 切换、登录和退出调用 workQueryState.clear()",
                "Isolated reproduction, 2026-08-24: begin -> clear -> accept(pre-clear response) -> begin same key produced {\"accepted\":true,\"current\":false,\"cached_version\":\"pre-clear\"}",
                "runtime/arcorbit/test/work-query-state.test.mjs:18-42 — 覆盖有界缓存、不同键竞态与同键乱序，但未覆盖 clear 后的在途响应",
                "Focused verification: 59 passed, 0 failed, confirming the current suite does not detect this lifecycle race"
              ]
            }
          ],
          "evidence": [
            "Reviewed Case content revision 3 production query-state lifecycle, Renderer clear call sites and regression tests",
            "Isolated clear/in-flight response sequence reproduced deterministically",
            "Focused verification: node --test test/work-query-state.test.mjs test/platform-coordinator.test.mjs test/desktop-renderer.test.mjs — 59 passed, 0 failed",
            "Accepted baseline: npm run check — 363 tests, 357 passed, 6 environment-gated skips, 0 failed",
            "git diff --check passed; no implementation files changed during this review"
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
        "project_revision": 203,
        "judgments": [
          {
            "invariant_ref": "product-expectations-remain-recoverable",
            "disposition": "not_relevant",
            "reason": "Completion Review 未建立或改变产品能力、业务规则或成功口径。",
            "fact_refs": [],
            "evidence": [],
            "gap_refs": []
          },
          {
            "invariant_ref": "interaction-expectations-remain-recoverable",
            "disposition": "upheld",
            "reason": "Work 的即时选择、匹配缓存、后台刷新和清理语义仍由 Project decision 与 accepted facts 持久表达；新发现作为 review finding 阻止 Case 关闭。",
            "fact_refs": [
              "FACT-20260823-007-005",
              "FACT-20260823-007-006",
              "FACT-20260823-007-007"
            ],
            "evidence": [
              "Project decision: experience_and_interaction@36",
              "runtime/arcorbit/desktop/renderer/renderer.js:736-767,1257-1293,3026-3032",
              "Completion Review finding local:review-finding:pre-clear-response-repopulates-cache"
            ],
            "gap_refs": []
          },
          {
            "invariant_ref": "visual-language-remains-consistent",
            "disposition": "not_relevant",
            "reason": "审查未建立或改变视觉语言、Design Token、布局或组件外观规则。",
            "fact_refs": [],
            "evidence": [],
            "gap_refs": []
          },
          {
            "invariant_ref": "technical-decisions-remain-explainable",
            "disposition": "upheld",
            "reason": "query-owned 缓存、请求代际、typed IPC 与 source-of-truth 边界仍清晰可恢复；finding 指向该边界内 clear epoch 处理的具体实现错误。",
            "fact_refs": [
              "FACT-20260823-007-005",
              "FACT-20260823-007-007"
            ],
            "evidence": [
              "Project decision: technical_foundation@31",
              "runtime/arcorbit/desktop/renderer/work-query-state.mjs:26-81",
              "runtime/arcorbit/src/platform-coordinator.mjs:243-328"
            ],
            "gap_refs": []
          },
          {
            "invariant_ref": "accepted-facts-are-realized",
            "disposition": "upheld",
            "reason": "当前 canonical accepted facts 仍由生产实现及受控性能、同键乱序和回访证据支撑；新发现尚未提升为软件事实，并通过 review finding 阻止 clean closeout。",
            "fact_refs": [
              "FACT-20260823-007-005",
              "FACT-20260823-007-006",
              "FACT-20260823-007-007"
            ],
            "evidence": [
              "Controlled Electron accepted measurement: immediate=1.8ms; first_interactive_1000=6.3ms; rendered_rows=80",
              "Post-fix same-key reproduction: cached_version=new",
              "Completion Review finding local:review-finding:pre-clear-response-repopulates-cache"
            ],
            "gap_refs": []
          },
          {
            "invariant_ref": "material-risks-have-credible-evidence",
            "disposition": "upheld",
            "reason": "既有性能和同键竞态主张有重复证据；本轮以确定性 clear/in-flight 复现揭示新的生命周期风险，并未把该风险错误声明为已控制。",
            "fact_refs": [
              "FACT-20260823-007-006",
              "FACT-20260823-007-007"
            ],
            "evidence": [
              "Isolated clear/in-flight reproduction: cached_version=pre-clear",
              "Focused verification: 59 passed, 0 failed",
              "runtime/arcorbit/test/work-query-state.test.mjs",
              "Accepted full verification: 363 tests, 357 passed, 6 skipped, 0 failed"
            ],
            "gap_refs": []
          }
        ]
      },
      "evidence": [
        "Completion Review executed against Case content revision 3",
        "Production cache clear and accept ordering inspected",
        "Pre-clear in-flight response repopulation reproduced deterministically",
        "Existing tests passed while confirming the lifecycle coverage omission",
        "No implementation files changed during the review round"
      ],
      "runtime_result_ref": "arckit-runtime://runs/RUN-20260824-054408709Z",
      "occurred_at": "2026-08-24T05:45:19.979Z"
    }
  ],
  "case_resolution": {
    "status": "unresolved",
    "stage": "working",
    "satisfied": [
      "GAP-WORK-STATUS-SWITCH-PERFORMANCE-DIAGNOSIS",
      "GAP-20260823-007-001",
      "CASE-20260823-007:review-finding:FINDING-20260823-007-001"
    ],
    "remaining": [
      "CASE-20260823-007:review-finding:FINDING-20260823-007-002"
    ],
    "blocked": [],
    "reason": "1 Case obligation(s) remain.",
    "candidate_gaps": [
      {
        "id": "CASE-20260823-007:review-finding:FINDING-20260823-007-002",
        "responsibility": "agent",
        "goal": "Resolve review finding: Work query-state 的 clear() 会提升全局 generation 并清空 cache 与 cachedGenerations，但 accept() 只比较被清空后的 per-key cached generation。清理前发出的请求若在 clear 后完成，仍会重新写入缓存；再次使用相同查询键时会得到清理前数据。Renderer 在 Workset 切换、登录和退出时调用 clear，因此该竞态可破坏身份或上下文切换后的缓存失效。现有测试未覆盖 clear 与在途响应的顺序。",
        "reason": "error found by completion review",
        "derived_from": [
          "completion_review",
          "content_revision:3"
        ],
        "blocked_by": [],
        "priority_basis": {
          "blocking": "high",
          "uncertainty": "",
          "risk": "high",
          "user_impact": ""
        },
        "evidence_required": [
          "runtime/arcorbit/desktop/renderer/work-query-state.mjs",
          "runtime/arcorbit/desktop/renderer/renderer.js",
          "runtime/arcorbit/test/work-query-state.test.mjs",
          "runtime/arcorbit/test/work-status-switch-performance-electron.test.mjs",
          "runtime/arcorbit/desktop/renderer/work-query-state.mjs:42-49,64-68 — clear 清空 cachedGenerations 后，旧 request generation 大于默认 0，accept 重新执行 touch",
          "runtime/arcorbit/desktop/renderer/renderer.js:456-461,3179-3185,3208-3214 — Workset 切换、登录和退出调用 workQueryState.clear()",
          "Isolated reproduction, 2026-08-24: begin -> clear -> accept(pre-clear response) -> begin same key produced {\"accepted\":true,\"current\":false,\"cached_version\":\"pre-clear\"}",
          "runtime/arcorbit/test/work-query-state.test.mjs:18-42 — 覆盖有界缓存、不同键竞态与同键乱序，但未覆盖 clear 后的在途响应",
          "Focused verification: 59 passed, 0 failed, confirming the current suite does not detect this lifecycle race"
        ]
      }
    ],
    "loop_handoff": {
      "version": "loop-handoff/v2",
      "status": "continue",
      "next_responsibility": "agent",
      "agent_continuation_available": true,
      "human_decision_required": false,
      "trigger_mode": "automatic",
      "responsibility_reason": "error found by completion review",
      "next_prompt": "Continue CASE-20260823-007: compare the ready dynamic gaps and advance one evidence-backed transition.",
      "human_gate": {
        "required": false,
        "reason": "",
        "decision_needed": ""
      }
    },
    "updated_at": "2026-08-24T05:45:19.979Z"
  }
}
```

## Round Notes

- Case history is canonical in Structured Record.rounds; keep prose notes exceptional.
