# 适配 ArcOrbit 跨平台窗口控制体验

Case: CASE-20260826-002
Status: closed
Artifact Type: mixed
Selected Gap: none
Updated: 2026-08-26T02:26:42.244Z

## User Intent

让 ArcOrbit 的应用标题栏按运行平台采用符合系统习惯的窗口控制：macOS 使用原生 traffic lights，绿色按钮单击进入全屏并由系统在悬停或支持的按住手势下提供布局面板；Windows 与 Linux 保持应用标题栏，并提供符合对应平台习惯的最小化、最大化/还原和关闭控制。

## Structured Record

```json
{
  "schema_version": "development-case-record/v5",
  "id": "CASE-20260826-002",
  "title": "适配 ArcOrbit 跨平台窗口控制体验",
  "status": "closed",
  "artifact_type": "mixed",
  "created_at": "2026-08-26T02:06:13.986Z",
  "updated_at": "2026-08-26T02:26:42.244Z",
  "user_intent": "让 ArcOrbit 的应用标题栏按运行平台采用符合系统习惯的窗口控制：macOS 使用原生 traffic lights，绿色按钮单击进入全屏并由系统在悬停或支持的按住手势下提供布局面板；Windows 与 Linux 保持应用标题栏，并提供符合对应平台习惯的最小化、最大化/还原和关闭控制。",
  "expected_outcome": "ArcOrbit 在所有平台都只呈现一条应用标题栏；macOS 左侧原生红黄绿按钮具备系统全屏、退出全屏和原生布局面板能力，Windows/Linux 的应用内窗口按钮按平台惯例布局并真实控制窗口；Renderer 仍不获得通用 Electron 或系统命令能力，平台分支具有自动化和可运行环境证据。",
  "project_state_ref": "arckit/project/state.record.json",
  "current_round": {
    "goal": "",
    "selected_gap": null
  },
  "facts": [
    {
      "id": "FACT-20260826-002-001",
      "revision": 1,
      "status": "accepted",
      "statement": "ArcOrbit 当前在 macOS、Windows 和 Linux 上统一使用 Renderer 自绘的左侧红黄绿按钮；绿色按钮在所有平台调用 toggle-maximize，主进程执行 maximize/unmaximize，并仅把已有 full-screen 状态折算为 maximized。该实现没有使用 macOS 原生 traffic lights，因此绿色按钮单击不会按 macOS 习惯直接进入系统全屏，也不会获得系统提供的悬停布局面板。用户要求窗口控制按平台适配，尤其要求 macOS 绿色按钮单击全屏并可通过悬停或按住访问精细布局。",
      "basis": "当前用户输入、生产源码与官方 Electron/Apple 平台文档共同建立了现状和目标差异。",
      "evidence": [
        "Current operator input, 2026-08-26",
        "runtime/arcorbit/src/main-window-controls.mjs",
        "runtime/arcorbit/desktop/main.mjs",
        "runtime/arcorbit/desktop/renderer/window-controls.mjs",
        "runtime/arcorbit/desktop/renderer/index.html",
        "arckit/interaction/CONVENTIONS.md",
        "arckit/tech/arcorbit/solution.md",
        "[Electron BaseWindow titleBarStyle documentation](https://www.electronjs.org/docs/latest/api/base-window)",
        "[Electron custom title bar documentation](https://www.electronjs.org/docs/latest/tutorial/custom-title-bar)",
        "[Apple: Use apps in full screen on Mac](https://support.apple.com/guide/mac-help/use-apps-in-full-screen-mchl9c21d2be/mac)",
        "[Apple: Tile windows on Mac](https://support.apple.com/guide/mac-help/tile-app-windows-mchlef287e5d/mac)"
      ]
    }
  ],
  "state_impacts": [
    {
      "id": "IMPACT-20260826-002-001",
      "fact_id": "FACT-20260826-002-001",
      "fact_revision": 1,
      "target": {
        "kind": "software_invariant",
        "ref": "interaction-expectations-remain-recoverable",
        "revision": null
      },
      "effect": "upheld",
      "reason": "持久交互约定现在明确区分 macOS 原生全屏/布局面板与 Windows/Linux 应用控件，生产 Renderer 严格遵循该分支。",
      "gap_ids": [],
      "evidence": [
        "arckit/interaction/CONVENTIONS.md",
        "runtime/arcorbit/desktop/renderer/window-controls.mjs",
        "runtime/arcorbit/test/main-window-controls.test.mjs"
      ]
    },
    {
      "id": "IMPACT-20260826-002-002",
      "fact_id": "FACT-20260826-002-001",
      "fact_revision": 1,
      "target": {
        "kind": "software_invariant",
        "ref": "visual-language-remains-consistent",
        "revision": null
      },
      "effect": "upheld",
      "reason": "视觉 brief、tokens、组件目录、preview 与生产 CSS 已统一表达 macOS 原生 traffic lights 和 Windows/Linux 右侧矢量控件。",
      "gap_ids": [],
      "evidence": [
        "arckit/visual/_library/brief.md",
        "arckit/visual/_library/design-tokens.yaml",
        "arckit/visual/_library/component-catalog.yaml",
        "arckit/visual/_library/style-preview.html",
        "runtime/arcorbit/desktop/renderer/styles.css"
      ]
    },
    {
      "id": "IMPACT-20260826-002-003",
      "fact_id": "FACT-20260826-002-001",
      "fact_revision": 1,
      "target": {
        "kind": "software_invariant",
        "ref": "technical-decisions-remain-explainable",
        "revision": null
      },
      "effect": "upheld",
      "reason": "技术方案和分层源码明确记录 macOS titleBarStyle:hidden、Windows/Linux frame:false、只读 control mode 与 sender-bound IPC 边界。",
      "gap_ids": [],
      "evidence": [
        "arckit/tech/arcorbit/solution.md",
        "runtime/arcorbit/src/main-window-controls.mjs",
        "runtime/arcorbit/desktop/main.mjs",
        "runtime/arcorbit/desktop/preload.cjs"
      ]
    },
    {
      "id": "IMPACT-20260826-002-004",
      "fact_id": "FACT-20260826-002-001",
      "fact_revision": 1,
      "target": {
        "kind": "software_invariant",
        "ref": "accepted-facts-are-realized",
        "revision": null
      },
      "effect": "upheld",
      "reason": "真实 macOS Electron 窗口证明原生按钮存在、自绘控件禁用且系统全屏可进入和退出；确定性平台测试证明 Windows/Linux 使用右侧真实窗口动作。",
      "gap_ids": [],
      "evidence": [
        "runtime/arcorbit/test/fixtures/window-controls-electron.mjs",
        "runtime/arcorbit/test/main-window-controls-electron.test.mjs",
        "Verification: real macOS Electron window regression passed, 2026-08-26",
        "Verification: main window platform branch tests passed 6/6, 2026-08-26"
      ]
    }
  ],
  "gaps": [
    {
      "id": "GAP-20260826-002-001",
      "status": "resolved",
      "goal": "实现并持久化 ArcOrbit 的跨平台窗口 chrome：macOS 在应用标题栏中使用原生 traffic lights 与系统全屏/布局面板，Windows/Linux 使用符合平台惯例的应用内最小化、最大化/还原和关闭控件，同时维持受限主进程边界和状态一致性。",
      "reason": "当前统一自绘控制不能满足 macOS 原生绿色按钮语义，也没有明确 Windows/Linux 的平台布局；Electron 已提供可保留原生 macOS traffic lights 的隐藏标题栏能力，目标和实现边界已足以进入单一适配 Gap。",
      "derived_from": [
        "case_intent",
        "FACT-20260826-002-001"
      ],
      "blocked_by": [],
      "priority_basis": {
        "blocking": "high",
        "uncertainty": "medium",
        "risk": "high",
        "user_impact": "high"
      },
      "responsibility": "agent",
      "evidence_required": [
        "macOS 主窗口只显示应用标题栏并保留系统原生 traffic lights，不出现重复系统标题栏。",
        "macOS 绿色按钮单击进入或退出系统全屏，悬停或系统支持的按住手势显示原生移动、缩放、排列和全屏布局面板。",
        "Windows 与 Linux 的应用内按钮按对应平台惯例布局，并真实执行最小化、最大化/还原和关闭。",
        "平台分支只暴露受限的窗口产品动作与状态；Renderer 不获得 BrowserWindow、任意 Electron API、shell 或系统窗口命令。",
        "交互约定、视觉策略/组件规格和技术方案准确记录平台差异。",
        "main/preload/Renderer 单元测试覆盖平台分支、状态同步和错误边界；真实 Electron 验证在当前可运行平台通过，其他平台使用明确的环境门禁与可重复测试入口。"
      ],
      "resolution": {
        "id": "GAP-20260826-002-001",
        "status": "resolved",
        "outcome": "ArcOrbit 已按平台选择窗口 chrome：macOS 使用隐藏系统标题文字但保留原生 traffic lights 的 BrowserWindow，绿色按钮由系统执行全屏/退出全屏并提供悬停或按住后的布局面板；Windows/Linux 继续使用 frameless 窗口和右侧最小化、最大化/还原、关闭控件。",
        "reason": "生产 main/preload/Renderer 分支、持久交互/视觉/技术事实、6/6 聚焦单元测试、真实 macOS Electron 回归和零失败全量门禁共同满足全部 evidence requirements。",
        "evidence": [
          "runtime/arcorbit/src/main-window-controls.mjs",
          "runtime/arcorbit/desktop/main.mjs",
          "runtime/arcorbit/desktop/preload.cjs",
          "runtime/arcorbit/desktop/renderer/window-controls.mjs",
          "runtime/arcorbit/desktop/renderer/index.html",
          "runtime/arcorbit/desktop/renderer/styles.css",
          "runtime/arcorbit/test/main-window-controls.test.mjs",
          "runtime/arcorbit/test/main-window-controls-electron.test.mjs",
          "Verification: node --test test/main-window-controls.test.mjs — 6 passed, 0 failed, 2026-08-26",
          "Verification: ARCORBIT_ELECTRON_WINDOW_CONTROLS_TEST=1 node --test test/main-window-controls-electron.test.mjs — 1 passed, 0 failed on macOS, 2026-08-26",
          "Verification: npm run check — 498 tests, 486 passed, 12 environment-gated skips, 0 failed, 2026-08-26",
          "[Electron BaseWindow titleBarStyle documentation](https://www.electronjs.org/docs/latest/api/base-window)",
          "[Apple: Use apps in full screen on Mac](https://support.apple.com/guide/mac-help/use-apps-in-full-screen-mchl9c21d2be/mac)",
          "[Apple: Tile windows on Mac](https://support.apple.com/guide/mac-help/tile-app-windows-mchlef287e5d/mac)"
        ],
        "occurred_at": "2026-08-26T02:21:07.455Z"
      }
    }
  ],
  "content_revision": 1,
  "completion_review": {
    "status": "clean",
    "policy": {
      "initial_max_cycles": 10,
      "source": "runtime/arcorbit/config/case-policy.json",
      "snapshotted_at": "2026-08-26T02:06:13.986Z"
    },
    "additional_cycles_authorized": 0,
    "cycle_count": 1,
    "reviewed_content_revision": 1,
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
        "content_revision": 1,
        "dimensions": {
          "implementation_correctness": "clean",
          "problem_resolution": "clean",
          "verification_credibility": "clean",
          "regression_risk": "clean",
          "minimality": "clean"
        },
        "finding_ids": [],
        "evidence": [
          "runtime/arcorbit/src/main-window-controls.mjs",
          "runtime/arcorbit/desktop/main.mjs",
          "runtime/arcorbit/desktop/preload.cjs",
          "runtime/arcorbit/desktop/renderer/window-controls.mjs",
          "runtime/arcorbit/desktop/renderer/index.html",
          "runtime/arcorbit/desktop/renderer/styles.css",
          "runtime/arcorbit/test/main-window-controls.test.mjs",
          "runtime/arcorbit/test/main-window-controls-electron.test.mjs",
          "arckit/interaction/CONVENTIONS.md",
          "arckit/visual/_library/brief.md",
          "arckit/visual/_library/component-catalog.yaml",
          "arckit/visual/_library/style-preview.html",
          "arckit/tech/arcorbit/solution.md",
          "Review verification: node --test test/main-window-controls.test.mjs — 6 passed, 0 failed, 2026-08-26",
          "Review verification: three consecutive real macOS Electron window regressions passed, 3/3, 2026-08-26",
          "Accepted verification: npm run check — 498 tests, 486 passed, 12 environment-gated skips, 0 failed, 2026-08-26",
          "Review verification: git diff --check passed, 2026-08-26"
        ],
        "occurred_at": "2026-08-26T02:26:42.244Z"
      }
    ],
    "evidence": [
      "runtime/arcorbit/src/main-window-controls.mjs",
      "runtime/arcorbit/desktop/main.mjs",
      "runtime/arcorbit/desktop/preload.cjs",
      "runtime/arcorbit/desktop/renderer/window-controls.mjs",
      "runtime/arcorbit/desktop/renderer/index.html",
      "runtime/arcorbit/desktop/renderer/styles.css",
      "runtime/arcorbit/test/main-window-controls.test.mjs",
      "runtime/arcorbit/test/main-window-controls-electron.test.mjs",
      "arckit/interaction/CONVENTIONS.md",
      "arckit/visual/_library/brief.md",
      "arckit/visual/_library/component-catalog.yaml",
      "arckit/visual/_library/style-preview.html",
      "arckit/tech/arcorbit/solution.md",
      "Review verification: node --test test/main-window-controls.test.mjs — 6 passed, 0 failed, 2026-08-26",
      "Review verification: three consecutive real macOS Electron window regressions passed, 3/3, 2026-08-26",
      "Accepted verification: npm run check — 498 tests, 486 passed, 12 environment-gated skips, 0 failed, 2026-08-26",
      "Review verification: git diff --check passed, 2026-08-26"
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
      "goal": "实现并持久化符合 macOS、Windows 和 Linux 平台习惯的 ArcOrbit 窗口 chrome，并以分层测试和真实 Electron 证明行为与安全边界。",
      "outcome": "completed",
      "gap_selection": {
        "mode": "candidate",
        "basis": "post-create fresh snapshot 证明当前 Case 只有一个 ready Gap；四个 Project Gap 均需独立 Case，不能替代当前高阻塞、高用户影响的窗口适配工作。",
        "snapshot_token": "4d265f79903213690f40387543dd590af82364c12386117d0a401ff081e708ea",
        "selected_ref": "case-gap:CASE-20260826-002:GAP-20260826-002-001",
        "comparison_summary": "GAP-20260826-002-001 是唯一可在当前 Case 直接推进的 ready 候选，并阻塞四项 threatened impacts；其余候选均为跨项目义务，需要另建 Case。",
        "fresh_discovery_summary": "源码、官方平台契约、持久文档和测试检查未发现优先级更高的新 Gap；实现与验证过程也未产生新的未解决工作。",
        "considered": [
          {
            "ref": "case-gap:CASE-20260826-002:GAP-20260826-002-001",
            "source": "persisted",
            "eligibility": "ready",
            "disposition": "selected",
            "priority_basis": {
              "blocking": "high",
              "uncertainty": "medium",
              "risk": "high",
              "user_impact": "high"
            },
            "reason": "当前 Case 唯一 ready Gap，直接恢复 interaction、visual、technical 与 realization 四项 threatened impacts。"
          },
          {
            "ref": "project-gap:GAP-agent-scenario-evaluation",
            "source": "persisted",
            "eligibility": "case_required",
            "disposition": "deferred",
            "priority_basis": {
              "blocking": "需要独立 Case",
              "uncertainty": "high",
              "risk": "high",
              "user_impact": "medium"
            },
            "reason": "动态 Gap 场景评估是跨项目验证义务，不属于当前窗口 chrome Case。"
          },
          {
            "ref": "project-gap:GAP-runtime-resilience-and-adapters",
            "source": "persisted",
            "eligibility": "case_required",
            "disposition": "deferred",
            "priority_basis": {
              "blocking": "需要独立 Case",
              "uncertainty": "medium",
              "risk": "high",
              "user_impact": "medium"
            },
            "reason": "Runtime 韧性和 adapter 验收不影响当前窗口平台分支的直接实现。"
          },
          {
            "ref": "project-gap:GAP-security-real-project-validation",
            "source": "persisted",
            "eligibility": "case_required",
            "disposition": "deferred",
            "priority_basis": {
              "blocking": "需要独立 Case",
              "uncertainty": "medium",
              "risk": "high",
              "user_impact": "medium"
            },
            "reason": "真实权限项目的安全验证需要独立受控资源与 Case。"
          },
          {
            "ref": "project-gap:GAP-cross-record-audit",
            "source": "persisted",
            "eligibility": "case_required",
            "disposition": "deferred",
            "priority_basis": {
              "blocking": "需要独立 Case",
              "uncertainty": "medium",
              "risk": "high",
              "user_impact": "high"
            },
            "reason": "跨记录审计是独立 Project obligation，不能并入窗口体验适配。"
          }
        ]
      },
      "selected_gap": {
        "id": "GAP-20260826-002-001",
        "responsibility": "agent",
        "goal": "实现并持久化 ArcOrbit 的跨平台窗口 chrome：macOS 在应用标题栏中使用原生 traffic lights 与系统全屏/布局面板，Windows/Linux 使用符合平台惯例的应用内最小化、最大化/还原和关闭控件，同时维持受限主进程边界和状态一致性。",
        "reason": "当前统一自绘控制不能满足 macOS 原生绿色按钮语义，也没有明确 Windows/Linux 的平台布局；Electron 已提供可保留原生 macOS traffic lights 的隐藏标题栏能力，目标和实现边界已足以进入单一适配 Gap。",
        "derived_from": [
          "case_intent",
          "FACT-20260826-002-001"
        ],
        "blocked_by": [],
        "priority_basis": {
          "blocking": "high",
          "uncertainty": "medium",
          "risk": "high",
          "user_impact": "high"
        },
        "evidence_required": [
          "macOS 主窗口只显示应用标题栏并保留系统原生 traffic lights，不出现重复系统标题栏。",
          "macOS 绿色按钮单击进入或退出系统全屏，悬停或系统支持的按住手势显示原生移动、缩放、排列和全屏布局面板。",
          "Windows 与 Linux 的应用内按钮按对应平台惯例布局，并真实执行最小化、最大化/还原和关闭。",
          "平台分支只暴露受限的窗口产品动作与状态；Renderer 不获得 BrowserWindow、任意 Electron API、shell 或系统窗口命令。",
          "交互约定、视觉策略/组件规格和技术方案准确记录平台差异。",
          "main/preload/Renderer 单元测试覆盖平台分支、状态同步和错误边界；真实 Electron 验证在当前可运行平台通过，其他平台使用明确的环境门禁与可重复测试入口。"
        ]
      },
      "planned_transition": {
        "goal": "实现并持久化符合 macOS、Windows 和 Linux 平台习惯的 ArcOrbit 窗口 chrome，并以分层测试和真实 Electron 证明行为与安全边界。",
        "expected_state_change": "解析 GAP-20260826-002-001，将四项 threatened impacts 更新为 upheld，并同步 experience、visual 和 validation Project decisions。"
      },
      "accepted_state_delta": {
        "resolved_gap": {
          "id": "GAP-20260826-002-001",
          "status": "resolved",
          "outcome": "ArcOrbit 已按平台选择窗口 chrome：macOS 使用隐藏系统标题文字但保留原生 traffic lights 的 BrowserWindow，绿色按钮由系统执行全屏/退出全屏并提供悬停或按住后的布局面板；Windows/Linux 继续使用 frameless 窗口和右侧最小化、最大化/还原、关闭控件。",
          "reason": "生产 main/preload/Renderer 分支、持久交互/视觉/技术事实、6/6 聚焦单元测试、真实 macOS Electron 回归和零失败全量门禁共同满足全部 evidence requirements。",
          "evidence": [
            "runtime/arcorbit/src/main-window-controls.mjs",
            "runtime/arcorbit/desktop/main.mjs",
            "runtime/arcorbit/desktop/preload.cjs",
            "runtime/arcorbit/desktop/renderer/window-controls.mjs",
            "runtime/arcorbit/desktop/renderer/index.html",
            "runtime/arcorbit/desktop/renderer/styles.css",
            "runtime/arcorbit/test/main-window-controls.test.mjs",
            "runtime/arcorbit/test/main-window-controls-electron.test.mjs",
            "Verification: node --test test/main-window-controls.test.mjs — 6 passed, 0 failed, 2026-08-26",
            "Verification: ARCORBIT_ELECTRON_WINDOW_CONTROLS_TEST=1 node --test test/main-window-controls-electron.test.mjs — 1 passed, 0 failed on macOS, 2026-08-26",
            "Verification: npm run check — 498 tests, 486 passed, 12 environment-gated skips, 0 failed, 2026-08-26",
            "[Electron BaseWindow titleBarStyle documentation](https://www.electronjs.org/docs/latest/api/base-window)",
            "[Apple: Use apps in full screen on Mac](https://support.apple.com/guide/mac-help/use-apps-in-full-screen-mchl9c21d2be/mac)",
            "[Apple: Tile windows on Mac](https://support.apple.com/guide/mac-help/tile-app-windows-mchlef287e5d/mac)"
          ]
        },
        "facts_added": [],
        "facts_superseded": [],
        "impacts_added": [],
        "impacts_updated": [
          {
            "id": "IMPACT-20260826-002-001",
            "fact_id": "FACT-20260826-002-001",
            "fact_revision": 1,
            "target": {
              "kind": "software_invariant",
              "ref": "interaction-expectations-remain-recoverable",
              "revision": null
            },
            "effect": "upheld",
            "reason": "持久交互约定现在明确区分 macOS 原生全屏/布局面板与 Windows/Linux 应用控件，生产 Renderer 严格遵循该分支。",
            "gap_ids": [],
            "evidence": [
              "arckit/interaction/CONVENTIONS.md",
              "runtime/arcorbit/desktop/renderer/window-controls.mjs",
              "runtime/arcorbit/test/main-window-controls.test.mjs"
            ]
          },
          {
            "id": "IMPACT-20260826-002-002",
            "fact_id": "FACT-20260826-002-001",
            "fact_revision": 1,
            "target": {
              "kind": "software_invariant",
              "ref": "visual-language-remains-consistent",
              "revision": null
            },
            "effect": "upheld",
            "reason": "视觉 brief、tokens、组件目录、preview 与生产 CSS 已统一表达 macOS 原生 traffic lights 和 Windows/Linux 右侧矢量控件。",
            "gap_ids": [],
            "evidence": [
              "arckit/visual/_library/brief.md",
              "arckit/visual/_library/design-tokens.yaml",
              "arckit/visual/_library/component-catalog.yaml",
              "arckit/visual/_library/style-preview.html",
              "runtime/arcorbit/desktop/renderer/styles.css"
            ]
          },
          {
            "id": "IMPACT-20260826-002-003",
            "fact_id": "FACT-20260826-002-001",
            "fact_revision": 1,
            "target": {
              "kind": "software_invariant",
              "ref": "technical-decisions-remain-explainable",
              "revision": null
            },
            "effect": "upheld",
            "reason": "技术方案和分层源码明确记录 macOS titleBarStyle:hidden、Windows/Linux frame:false、只读 control mode 与 sender-bound IPC 边界。",
            "gap_ids": [],
            "evidence": [
              "arckit/tech/arcorbit/solution.md",
              "runtime/arcorbit/src/main-window-controls.mjs",
              "runtime/arcorbit/desktop/main.mjs",
              "runtime/arcorbit/desktop/preload.cjs"
            ]
          },
          {
            "id": "IMPACT-20260826-002-004",
            "fact_id": "FACT-20260826-002-001",
            "fact_revision": 1,
            "target": {
              "kind": "software_invariant",
              "ref": "accepted-facts-are-realized",
              "revision": null
            },
            "effect": "upheld",
            "reason": "真实 macOS Electron 窗口证明原生按钮存在、自绘控件禁用且系统全屏可进入和退出；确定性平台测试证明 Windows/Linux 使用右侧真实窗口动作。",
            "gap_ids": [],
            "evidence": [
              "runtime/arcorbit/test/fixtures/window-controls-electron.mjs",
              "runtime/arcorbit/test/main-window-controls-electron.test.mjs",
              "Verification: real macOS Electron window regression passed, 2026-08-26",
              "Verification: main window platform branch tests passed 6/6, 2026-08-26"
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
            "area_ref": "experience_and_interaction",
            "observed_revision": 48,
            "set_decision": {
              "status": "settled",
              "statement": "ArcOrbit 保持既有 Personal、Product Lifecycle、Organization 导航与 Work、Automation、Feedback、Chat 等交互语义。Work 编辑 Sheet 显示当前产品集内可写产品；切换产品时清空旧产品限定的执行人、父待办和标签选择，并保留正文、状态及优先级草稿。确认界面明确说明将创建新 Task、删除旧 Task、生成新 id，且评论、附件和执行关系不会迁移。提交先创建目标 Task，确认成功后才删除源 Task；创建失败保留源 Task和草稿，删除失败则显示源、目标 Task 及可恢复状态，允许重试删除或明确保留两者。源删除确认后 Automation 安全停止旧 execution；目标 Task 不继承旧 execution。ArcOrbit 主窗口在所有平台只呈现一条应用标题栏并保留原生边缘缩放和空白区域拖动；macOS 使用原生 traffic lights，绿色按钮单击进入或退出系统全屏，悬停或系统支持的按住手势显示原生移动、缩放、排列和全屏面板；Windows/Linux 使用应用标题栏右侧可聚焦的最小化、最大化/还原和关闭按钮，双击标题区域切换最大化/还原并同步反映窗口状态。Setup Readiness 在 Codex 缺失、损坏、更新或未认证时原位提供恢复：安装/更新展示下载、执行、发现与复核进度；登录先选择无默认值的凭证类型，ChatGPT 再选择无默认值的浏览器或设备码流程，选择完成前继续按钮禁用。成功、取消、超时和失败都重新验证状态并提供明确反馈与重试；活动 Codex owner 阻止更新，外部安装显示所有权而不被静默替换。Case 绑定缺失恢复明确区分复用已有 Case、作为新事项继续、补充说明和标记阻塞，并保持原 task session 与 Agent thread。",
              "reason": "用户明确要求窗口体验符合运行平台习惯，尤其要求 macOS 绿色按钮使用系统全屏和原生布局面板；生产实现和持久交互契约已兑现该要求。",
              "evidence": [
                "Current operator input, 2026-08-26",
                "arckit/interaction/CONVENTIONS.md",
                "runtime/arcorbit/desktop/renderer/window-controls.mjs",
                "runtime/arcorbit/test/main-window-controls-electron.test.mjs"
              ],
              "confidence": "high",
              "resume_condition": "当认证、Case 绑定恢复、跨产品替换，或任一平台的标题栏、原生按钮、拖动、缩放、全屏与窗口控制语义改变时重审。"
            },
            "gap_refs": [],
            "reason": "用已实现并验证的平台差异替换此前统一自绘最大化语义。",
            "evidence": [
              "Current operator input, 2026-08-26",
              "arckit/interaction/CONVENTIONS.md",
              "runtime/arcorbit/test/main-window-controls-electron.test.mjs"
            ]
          },
          {
            "area_ref": "visual_language",
            "observed_revision": 3,
            "set_decision": {
              "status": "settled",
              "statement": "Visual requirements apply to the Desktop workspace and follow its durable visual specification; CLI and ledger surfaces remain text-native. ArcOrbit 主窗口使用单一 40px 深色应用标题栏：macOS 左侧保留系统原生 traffic lights 并为其预留稳定空间；Windows/Linux 右侧使用 46×40px 的最小化、最大化/还原和关闭轮廓矢量控件，提供清晰的 hover、active、focus、关闭破坏反馈和最大化/还原状态，不叠加可见系统标题栏。",
              "reason": "平台原生性是窗口 chrome 视觉语言的一部分；持久视觉资产和生产样式已共同落实 macOS 与 Windows/Linux 的差异。",
              "evidence": [
                "arckit/visual/_library/brief.md",
                "arckit/visual/_library/design-tokens.yaml",
                "arckit/visual/_library/component-catalog.yaml",
                "arckit/visual/_library/style-preview.html",
                "runtime/arcorbit/desktop/renderer/styles.css"
              ],
              "confidence": "high",
              "resume_condition": "当平台 chrome 策略、标题栏高度、traffic lights 位置、Windows/Linux 控件布局或状态反馈改变时重审。"
            },
            "gap_refs": [],
            "reason": "将统一左侧红黄绿自绘规则修订为符合各操作系统惯例的双平台视觉策略。",
            "evidence": [
              "arckit/visual/_library/brief.md",
              "arckit/visual/_library/component-catalog.yaml",
              "runtime/arcorbit/desktop/renderer/styles.css"
            ]
          },
          {
            "area_ref": "quality_and_validation",
            "observed_revision": 12,
            "set_decision": {
              "status": "settled",
              "statement": "既有协议、Runtime、realtime、Work、Chat、Automation 和安全验证义务保持不变。Codex Setup 还必须以 resolver/manager 单元测试、typed main/preload/renderer 测试和 Electron 集成证据证明：macOS/Linux/Windows 固定官方 standalone installer；安装后无需重启即可 discovery/version 复核；standalone update 成功复核且活动 Codex owner 阻断；外部 npm/Homebrew/configured installation 不被静默替换；安装与认证状态、取消、超时、失败和重试正确；所有凭证/流程默认未选且未完成选择时不能继续；每个可见方式只物化固定 argv；API Key/Access Token 仅进入 stdin且不泄漏到 argv/environment/log/error/store/shared Renderer state；ArcOrbit 对 Codex credential file 零访问；login/logout 只由 `codex login status` 退出码复核；Codex/Workshop auth 独立；Setup、Chat 与 Automation 原有流程保持通过。跨平台窗口 chrome 还必须以 main/preload/Renderer 单元测试证明平台配置、状态同步和错误边界，以当前平台真实 Electron 证明原生窗口行为，并为其他平台保留显式、可重复的环境门禁入口。",
              "reason": "平台窗口语义涉及原生 OS 行为与安全边界，必须同时具备确定性分支测试和可运行环境证据。",
              "evidence": [
                "runtime/arcorbit/test/main-window-controls.test.mjs",
                "runtime/arcorbit/test/main-window-controls-electron.test.mjs",
                "Verification: npm run check — 498 tests, 486 passed, 12 environment-gated skips, 0 failed, 2026-08-26"
              ],
              "confidence": "high",
              "resume_condition": "当支持平台、installer/auth CLI、secret transport、Runtime consumers，或窗口 chrome、全屏、布局面板、IPC 与真实环境门禁变化时重审。"
            },
            "gap_refs": [
              "GAP-agent-scenario-evaluation",
              "GAP-cross-record-audit"
            ],
            "reason": "补充跨平台窗口 chrome 的成比例验证责任。",
            "evidence": [
              "runtime/arcorbit/test/main-window-controls.test.mjs",
              "runtime/arcorbit/test/main-window-controls-electron.test.mjs",
              "Verification: real macOS Electron and full regression passed, 2026-08-26"
            ]
          }
        ],
        "software_invariant_changes": [],
        "project_gap_changes": [],
        "selection_context_change": null,
        "evidence": [
          "Current operator input, 2026-08-26",
          "arckit/interaction/CONVENTIONS.md",
          "arckit/visual/_library/brief.md",
          "arckit/tech/arcorbit/solution.md",
          "runtime/arcorbit/test/main-window-controls.test.mjs",
          "runtime/arcorbit/test/main-window-controls-electron.test.mjs"
        ]
      },
      "invariant_assessment": {
        "project_revision": 267,
        "judgments": [
          {
            "invariant_ref": "product-expectations-remain-recoverable",
            "disposition": "upheld",
            "reason": "用户要求的跨平台窗口结果已由当前 Case、Project experience decision 和持久交互约定准确承载。",
            "fact_refs": [
              "FACT-20260826-002-001"
            ],
            "evidence": [
              "arckit/cases/active/CASE-20260826-002-arcorbit.md",
              "arckit/interaction/CONVENTIONS.md"
            ],
            "gap_refs": []
          },
          {
            "invariant_ref": "interaction-expectations-remain-recoverable",
            "disposition": "upheld",
            "reason": "macOS 单击全屏、系统布局面板和 Windows/Linux 窗口动作、拖动及状态同步语义均已持久化并与实现一致。",
            "fact_refs": [
              "FACT-20260826-002-001"
            ],
            "evidence": [
              "arckit/interaction/CONVENTIONS.md",
              "runtime/arcorbit/desktop/renderer/window-controls.mjs",
              "runtime/arcorbit/test/main-window-controls.test.mjs"
            ],
            "gap_refs": []
          },
          {
            "invariant_ref": "visual-language-remains-consistent",
            "disposition": "upheld",
            "reason": "视觉系统明确采用 macOS 原生 traffic lights 与 Windows/Linux 右侧矢量控件，生产样式、组件规格和 preview 一致。",
            "fact_refs": [
              "FACT-20260826-002-001"
            ],
            "evidence": [
              "arckit/visual/_library/brief.md",
              "arckit/visual/_library/component-catalog.yaml",
              "arckit/visual/_library/style-preview.html",
              "runtime/arcorbit/desktop/renderer/styles.css"
            ],
            "gap_refs": []
          },
          {
            "invariant_ref": "technical-decisions-remain-explainable",
            "disposition": "upheld",
            "reason": "BrowserWindow 平台选项、原生/自绘控制所有权、只读 control mode、sender 验证和有界 IPC 均由技术方案与分层源码解释。",
            "fact_refs": [
              "FACT-20260826-002-001"
            ],
            "evidence": [
              "arckit/tech/arcorbit/solution.md",
              "runtime/arcorbit/src/main-window-controls.mjs",
              "runtime/arcorbit/desktop/main.mjs",
              "runtime/arcorbit/desktop/preload.cjs"
            ],
            "gap_refs": []
          },
          {
            "invariant_ref": "accepted-facts-are-realized",
            "disposition": "upheld",
            "reason": "生产源码和真实 macOS Electron 窗口共同证明原生 traffic lights、单一标题栏、系统全屏进入/退出和禁用重复自绘按钮已实现；确定性测试覆盖 Windows/Linux 分支。",
            "fact_refs": [
              "FACT-20260826-002-001"
            ],
            "evidence": [
              "runtime/arcorbit/desktop/main.mjs",
              "runtime/arcorbit/desktop/renderer/index.html",
              "runtime/arcorbit/test/main-window-controls-electron.test.mjs",
              "Verification: real macOS Electron window regression passed, 2026-08-26"
            ],
            "gap_refs": []
          },
          {
            "invariant_ref": "material-risks-have-credible-evidence",
            "disposition": "upheld",
            "reason": "平台分支错误、重复窗口控件、Renderer 越权、状态竞态和真实全屏行为均有分层且可重复的证据；非当前平台由明确门禁入口保留验证责任。",
            "fact_refs": [
              "FACT-20260826-002-001"
            ],
            "evidence": [
              "runtime/arcorbit/test/main-window-controls.test.mjs",
              "runtime/arcorbit/test/main-window-controls-electron.test.mjs",
              "Verification: focused window tests passed 6/6 and real Electron passed 1/1, 2026-08-26",
              "Verification: npm run check — 498 tests, 486 passed, 12 environment-gated skips, 0 failed, 2026-08-26"
            ],
            "gap_refs": []
          }
        ]
      },
      "evidence": [
        "Trusted create_case closeout receipt: CASE-20260826-002 created at Project revision 267, 2026-08-26",
        "Post-create fresh snapshot 5149b4d79919b82194689003d8280ea6b6c9ae7075f901986c3b590824b43ca5 confirmed CASE-20260826-002 content revision 0 and selection token 4d265f79903213690f40387543dd590af82364c12386117d0a401ff081e708ea",
        "runtime/arcorbit/src/main-window-controls.mjs",
        "runtime/arcorbit/desktop/main.mjs",
        "runtime/arcorbit/desktop/preload.cjs",
        "runtime/arcorbit/desktop/renderer/window-controls.mjs",
        "runtime/arcorbit/desktop/renderer/index.html",
        "runtime/arcorbit/desktop/renderer/styles.css",
        "arckit/interaction/CONVENTIONS.md",
        "arckit/visual/_library/brief.md",
        "arckit/tech/arcorbit/solution.md",
        "Verification: node --test test/main-window-controls.test.mjs — 6 passed, 0 failed, 2026-08-26",
        "Verification: real macOS Electron window regression — 1 passed, 0 failed, 2026-08-26",
        "Verification: npm run check — 498 tests, 486 passed, 12 environment-gated skips, 0 failed, 2026-08-26",
        "Verification: git diff --check passed, 2026-08-26"
      ],
      "runtime_result_ref": "arckit-runtime://runs/RUN-20260826-020307114Z-d93b545d",
      "occurred_at": "2026-08-26T02:21:07.455Z"
    },
    {
      "round": 2,
      "transition_schema_version": "arckit-case-transition/v8",
      "goal": "独立审查跨平台窗口 chrome 的实现正确性、真实问题解决、验证可信度、回归风险和最小性。",
      "outcome": "completed",
      "gap_selection": {
        "mode": "candidate",
        "basis": "基于 Case 作用域 fresh snapshot 比较全部持久候选；Completion Review 是当前 Case 唯一 ready 且直接阻塞结案的候选，其余四项均为需要独立 Case 的 Project Gap。",
        "snapshot_token": "adfca348297fcd92ca19120e0a8b46c913a4bb79dfecc554184ecddce63d6bdf",
        "selected_ref": "case-gap:CASE-20260826-002:CASE-20260826-002:completion-review:1",
        "comparison_summary": "选择 Completion Review，因为普通 Case Gap 和状态影响均已关闭，审查是当前唯一 ready、blocking/user-impact 均为 high 的 Case 义务。四个 Project Gap 虽有高风险，但均为 case_required，不应越过当前 Case 的完成门禁。",
        "fresh_discovery_summary": "对实现、持久交互/视觉/技术证据、测试和当前差异进行独立检查，未发现优先于 Completion Review 的 fresh Gap。",
        "considered": [
          {
            "ref": "case-gap:CASE-20260826-002:CASE-20260826-002:completion-review:1",
            "source": "persisted",
            "eligibility": "ready",
            "disposition": "selected",
            "priority_basis": {
              "blocking": "high",
              "uncertainty": "low",
              "risk": "high",
              "user_impact": "high"
            },
            "reason": "所有普通 Case Gap 已解决；该审查直接决定跨平台窗口 chrome 能否完成结案。"
          },
          {
            "ref": "project-gap:GAP-cross-record-audit",
            "source": "persisted",
            "eligibility": "case_required",
            "disposition": "deferred",
            "priority_basis": {
              "blocking": "low",
              "uncertainty": "medium",
              "risk": "high",
              "user_impact": "high"
            },
            "reason": "跨记录审计是独立 Project 事项，需要自己的 Case，不能取代当前 Completion Review。"
          },
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
            "reason": "动态 Gap 场景验证需要独立 Case，且不阻塞本 Case 已实现内容的审查。"
          },
          {
            "ref": "project-gap:GAP-runtime-resilience-and-adapters",
            "source": "persisted",
            "eligibility": "case_required",
            "disposition": "deferred",
            "priority_basis": {
              "blocking": "low",
              "uncertainty": "medium",
              "risk": "high",
              "user_impact": "high"
            },
            "reason": "Runtime 韧性与 adapter 验收属于独立边界，需要另建 Case。"
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
              "user_impact": "high"
            },
            "reason": "真实权限项目的安全验证需要受控资源和独立 Case，与本轮窗口 chrome 审查无直接阻塞关系。"
          }
        ]
      },
      "selected_gap": {
        "id": "CASE-20260826-002:completion-review:1",
        "responsibility": "agent",
        "goal": "Review the completed implementation for correctness, real problem resolution, verification credibility, regression risk, and minimality.",
        "reason": "All ordinary Case gaps and state impacts are closed.",
        "derived_from": [
          "case_result",
          "content_revision:1"
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
        "goal": "独立审查跨平台窗口 chrome 的实现正确性、真实问题解决、验证可信度、回归风险和最小性。",
        "expected_state_change": "提交五个维度均为 clean、无 finding 的 Completion Review 结果，使 CASE-20260826-002 不再保留完成审查义务。"
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
            "runtime/arcorbit/src/main-window-controls.mjs",
            "runtime/arcorbit/desktop/main.mjs",
            "runtime/arcorbit/desktop/preload.cjs",
            "runtime/arcorbit/desktop/renderer/window-controls.mjs",
            "runtime/arcorbit/desktop/renderer/index.html",
            "runtime/arcorbit/desktop/renderer/styles.css",
            "runtime/arcorbit/test/main-window-controls.test.mjs",
            "runtime/arcorbit/test/main-window-controls-electron.test.mjs",
            "arckit/interaction/CONVENTIONS.md",
            "arckit/visual/_library/brief.md",
            "arckit/visual/_library/component-catalog.yaml",
            "arckit/visual/_library/style-preview.html",
            "arckit/tech/arcorbit/solution.md",
            "Review verification: node --test test/main-window-controls.test.mjs — 6 passed, 0 failed, 2026-08-26",
            "Review verification: three consecutive real macOS Electron window regressions passed, 3/3, 2026-08-26",
            "Accepted verification: npm run check — 498 tests, 486 passed, 12 environment-gated skips, 0 failed, 2026-08-26",
            "Review verification: git diff --check passed, 2026-08-26"
          ],
          "reviewed_content_revision": 1
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
        "project_revision": 268,
        "judgments": [
          {
            "invariant_ref": "product-expectations-remain-recoverable",
            "disposition": "upheld",
            "reason": "跨平台窗口验收含义仍由当前 Case、Project experience decision 和持久交互约定完整承载，审查未发现语义缺失或冲突。",
            "fact_refs": [
              "FACT-20260826-002-001"
            ],
            "evidence": [
              "arckit/cases/active/CASE-20260826-002-arcorbit.md",
              "arckit/interaction/CONVENTIONS.md",
              "arckit/project/state.record.json"
            ],
            "gap_refs": []
          },
          {
            "invariant_ref": "interaction-expectations-remain-recoverable",
            "disposition": "upheld",
            "reason": "macOS 原生全屏与布局面板、Windows/Linux 窗口动作、拖动和状态反馈语义均可恢复，并与生产 Renderer 行为一致。",
            "fact_refs": [
              "FACT-20260826-002-001"
            ],
            "evidence": [
              "arckit/interaction/CONVENTIONS.md",
              "runtime/arcorbit/desktop/renderer/window-controls.mjs",
              "runtime/arcorbit/test/main-window-controls.test.mjs"
            ],
            "gap_refs": []
          },
          {
            "invariant_ref": "visual-language-remains-consistent",
            "disposition": "upheld",
            "reason": "macOS 原生 traffic lights 与 Windows/Linux 右侧矢量控件的差异是明确的平台视觉规则；brief、组件规格、preview 和生产 CSS 一致。",
            "fact_refs": [
              "FACT-20260826-002-001"
            ],
            "evidence": [
              "arckit/visual/_library/brief.md",
              "arckit/visual/_library/component-catalog.yaml",
              "arckit/visual/_library/style-preview.html",
              "runtime/arcorbit/desktop/renderer/styles.css"
            ],
            "gap_refs": []
          },
          {
            "invariant_ref": "technical-decisions-remain-explainable",
            "disposition": "upheld",
            "reason": "平台 BrowserWindow 选项、原生与自绘控制所有权、只读 control mode、sender 验证和有界 IPC 均有清晰且最小的技术边界。",
            "fact_refs": [
              "FACT-20260826-002-001"
            ],
            "evidence": [
              "arckit/tech/arcorbit/solution.md",
              "runtime/arcorbit/src/main-window-controls.mjs",
              "runtime/arcorbit/desktop/main.mjs",
              "runtime/arcorbit/desktop/preload.cjs"
            ],
            "gap_refs": []
          },
          {
            "invariant_ref": "accepted-facts-are-realized",
            "disposition": "upheld",
            "reason": "源码与重复真实 macOS Electron 验证证明原生 traffic lights、单一标题栏、系统全屏进入/退出及禁用重复自绘控件已实现；确定性测试覆盖 Windows/Linux 分支。",
            "fact_refs": [
              "FACT-20260826-002-001"
            ],
            "evidence": [
              "runtime/arcorbit/desktop/main.mjs",
              "runtime/arcorbit/desktop/renderer/index.html",
              "runtime/arcorbit/test/main-window-controls-electron.test.mjs",
              "Review verification: three consecutive real macOS Electron window regressions passed, 3/3, 2026-08-26"
            ],
            "gap_refs": []
          },
          {
            "invariant_ref": "material-risks-have-credible-evidence",
            "disposition": "upheld",
            "reason": "平台分支、重复控件、Renderer 越权、状态同步和真实全屏行为均有分层、重复且成比例的证据；非当前平台保留显式环境门禁。",
            "fact_refs": [
              "FACT-20260826-002-001"
            ],
            "evidence": [
              "runtime/arcorbit/test/main-window-controls.test.mjs",
              "runtime/arcorbit/test/main-window-controls-electron.test.mjs",
              "Review verification: node --test test/main-window-controls.test.mjs — 6 passed, 0 failed, 2026-08-26",
              "Review verification: three consecutive real macOS Electron window regressions passed, 3/3, 2026-08-26",
              "Accepted verification: npm run check — 498 tests, 486 passed, 12 environment-gated skips, 0 failed, 2026-08-26"
            ],
            "gap_refs": []
          }
        ]
      },
      "evidence": [
        "Fresh Case-scoped selection token adfca348297fcd92ca19120e0a8b46c913a4bb79dfecc554184ecddce63d6bdf at Project revision 268 and Case content revision 1",
        "Independent source, documentation and diff inspection found no error, omission or excess, 2026-08-26",
        "Review verification: node --test test/main-window-controls.test.mjs — 6 passed, 0 failed, 2026-08-26",
        "Review verification: three consecutive real macOS Electron window regressions passed, 3/3, 2026-08-26",
        "Accepted verification: npm run check — 498 tests, 486 passed, 12 environment-gated skips, 0 failed, 2026-08-26",
        "Review verification: git diff --check passed, 2026-08-26"
      ],
      "runtime_result_ref": "arckit-runtime://runs/RUN-20260826-020307114Z-d93b545d",
      "occurred_at": "2026-08-26T02:26:42.244Z"
    }
  ],
  "case_resolution": {
    "status": "resolved",
    "stage": "resolved",
    "satisfied": [
      "GAP-20260826-002-001"
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
    "updated_at": "2026-08-26T02:26:42.244Z"
  }
}
```

## Round Notes

- Case history is canonical in Structured Record.rounds; keep prose notes exceptional.
