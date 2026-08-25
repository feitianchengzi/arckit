# 修复 ArcOrbit 重复标题栏和窗口控制

Case: CASE-20260825-009
Status: closed
Artifact Type: code
Selected Gap: none
Updated: 2026-08-25T15:34:08.946Z

## User Intent

移除 ArcOrbit 主窗口的系统标题栏，仅保留应用标题栏，并让应用内最小化、最大化/还原和关闭按钮真实控制当前窗口。

## Structured Record

```json
{
  "schema_version": "development-case-record/v5",
  "id": "CASE-20260825-009",
  "title": "修复 ArcOrbit 重复标题栏和窗口控制",
  "status": "closed",
  "artifact_type": "code",
  "created_at": "2026-08-25T15:03:09.520Z",
  "updated_at": "2026-08-25T15:34:08.946Z",
  "user_intent": "移除 ArcOrbit 主窗口的系统标题栏，仅保留应用标题栏，并让应用内最小化、最大化/还原和关闭按钮真实控制当前窗口。",
  "expected_outcome": "ArcOrbit 主窗口只显示应用自定义标题栏；窗口仍可拖动、缩放，应用内三个控制按钮可可靠执行最小化、最大化/还原和关闭，并有自动化及真实 Electron 证据防止回归。",
  "project_state_ref": "arckit/project/state.record.json",
  "current_round": {
    "goal": "",
    "selected_gap": null
  },
  "facts": [
    {
      "id": "FACT-WINDOW-CHROME-REGRESSION",
      "revision": 1,
      "status": "accepted",
      "statement": "ArcOrbit 主窗口当前使用 Electron BrowserWindow 默认系统框架，同时 Renderer 绘制自定义 titlebar；其中三枚彩色圆点是 aria-hidden 装饰元素，preload 与 main process 没有对应窗口控制接口。用户要求去掉系统标题栏，只保留应用标题栏，并让应用内按钮真实可用。",
      "basis": "当前用户输入与源码逻辑检查完全一致：默认 BrowserWindow frame 产生系统标题栏，Renderer header 产生第二条标题栏，现有彩色圆点没有交互绑定。",
      "evidence": [
        "Current operator input, 2026-08-25",
        "runtime/arcorbit/desktop/main.mjs:268",
        "runtime/arcorbit/desktop/renderer/index.html:75",
        "runtime/arcorbit/desktop/renderer/styles.css:151",
        "runtime/arcorbit/desktop/preload.cjs"
      ]
    }
  ],
  "state_impacts": [
    {
      "id": "IMPACT-WINDOW-VISUAL",
      "fact_id": "FACT-WINDOW-CHROME-REGRESSION",
      "fact_revision": 1,
      "target": {
        "kind": "software_invariant",
        "ref": "visual-language-remains-consistent",
        "revision": null
      },
      "effect": "upheld",
      "reason": "主窗口现在只有一条应用自绘标题栏，窗口控件的尺寸、颜色、交互反馈和最大化状态已纳入持久视觉规则并由真实界面验证。",
      "gap_ids": [],
      "evidence": [
        "arckit/visual/_library/brief.md",
        "arckit/visual/_library/design-tokens.yaml",
        "arckit/visual/_library/component-catalog.yaml",
        "arckit/visual/_library/style-preview.html",
        "runtime/arcorbit/desktop/renderer/styles.css",
        "runtime/arcorbit/test/main-window-controls-electron.test.mjs"
      ]
    },
    {
      "id": "IMPACT-WINDOW-INTERACTION",
      "fact_id": "FACT-WINDOW-CHROME-REGRESSION",
      "fact_revision": 1,
      "target": {
        "kind": "software_invariant",
        "ref": "interaction-expectations-remain-recoverable",
        "revision": null
      },
      "effect": "upheld",
      "reason": "标题栏拖动、双击最大化/还原、三个真实按钮、非拖拽交互区、动态可访问标签和窗口状态同步均已实现并写入持久交互约定。",
      "gap_ids": [],
      "evidence": [
        "arckit/interaction/CONVENTIONS.md",
        "runtime/arcorbit/desktop/renderer/window-controls.mjs",
        "runtime/arcorbit/desktop/renderer/index.html",
        "runtime/arcorbit/test/main-window-controls.test.mjs",
        "runtime/arcorbit/test/main-window-controls-electron.test.mjs"
      ]
    },
    {
      "id": "IMPACT-WINDOW-REALIZATION",
      "fact_id": "FACT-WINDOW-CHROME-REGRESSION",
      "fact_revision": 1,
      "target": {
        "kind": "software_invariant",
        "ref": "accepted-facts-are-realized",
        "revision": null
      },
      "effect": "upheld",
      "reason": "实际 Electron 窗口已证明无系统标题栏、仍可移动和缩放，并可真实完成最小化、最大化、还原和关闭。",
      "gap_ids": [],
      "evidence": [
        "runtime/arcorbit/desktop/main.mjs",
        "runtime/arcorbit/src/main-window-controls.mjs",
        "runtime/arcorbit/test/main-window-controls-electron.test.mjs",
        "Verification: ARCORBIT_ELECTRON_WINDOW_CONTROLS_TEST=1 node --test test/main-window-controls-electron.test.mjs — 1 passed, 0 failed, 2026-08-25"
      ]
    }
  ],
  "gaps": [
    {
      "id": "GAP-WINDOW-CHROME-CONTROLS",
      "status": "resolved",
      "goal": "让 ArcOrbit 主窗口只使用应用自定义标题栏，并实现受限、真实、状态一致的最小化、最大化/还原和关闭控制。",
      "reason": "当前默认系统框架与 Renderer 标题栏重复，应用内控制点没有行为；修复必须同时覆盖 BrowserWindow chrome、受限 IPC、非拖拽交互区、最大化状态同步和回归验证。",
      "derived_from": [
        "case_intent",
        "FACT-WINDOW-CHROME-REGRESSION"
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
        "主 BrowserWindow 不再显示系统标题栏，仍支持窗口拖动和边缘缩放。",
        "应用标题栏按钮通过受限的 preload/main-process 边界执行最小化、最大化/还原和关闭，交互控件不被拖拽区域吞掉。",
        "最大化与还原状态能够正确反映到应用控件，重复操作保持一致。",
        "相关 main/preload/Renderer 自动化测试通过。",
        "真实 Electron 窗口验证只显示一条标题栏且三个控制动作均生效。"
      ],
      "resolution": {
        "id": "GAP-WINDOW-CHROME-CONTROLS",
        "status": "resolved",
        "outcome": "ArcOrbit 主 BrowserWindow 已使用 frame:false；应用标题栏保留拖拽和原生边缘缩放，三个可聚焦按钮通过 sender-bound preload/main IPC 执行最小化、最大化/还原和关闭，并同步最大化、还原、全屏和最小化状态。",
        "reason": "源码实现、静态边界测试、Renderer 状态竞态测试、真实 Electron 控制测试和全量回归共同满足 Gap 的全部 evidence requirements。",
        "evidence": [
          "runtime/arcorbit/desktop/main.mjs",
          "runtime/arcorbit/src/main-window-controls.mjs",
          "runtime/arcorbit/desktop/preload.cjs",
          "runtime/arcorbit/desktop/renderer/window-controls.mjs",
          "runtime/arcorbit/desktop/renderer/index.html",
          "runtime/arcorbit/desktop/renderer/styles.css",
          "runtime/arcorbit/test/main-window-controls.test.mjs",
          "runtime/arcorbit/test/main-window-controls-electron.test.mjs",
          "Verification: ARCORBIT_ELECTRON_WINDOW_CONTROLS_TEST=1 node --test test/main-window-controls-electron.test.mjs — 1 passed, 0 failed, 2026-08-25",
          "Verification: npm run check — 428 tests, 417 passed, 11 environment-gated skips, 0 failed, 2026-08-25",
          "Verification: git diff --check passed, 2026-08-25"
        ],
        "occurred_at": "2026-08-25T15:23:01.003Z"
      }
    },
    {
      "id": "CASE-20260825-009:review-finding:FINDING-20260825-009-001",
      "status": "resolved",
      "goal": "Resolve review finding: 真实 Electron 窗口回归夹具会在写出 JSON 结果后立即调用 app.exit(0)，独立重复运行中出现成功退出但 stdout 为空的情况，导致测试在 JSON.parse 处非确定性失败；该回归目前不能作为稳定、可重复的窗口控制验收门禁。",
      "reason": "error found by completion review",
      "derived_from": [
        "completion_review",
        "content_revision:1"
      ],
      "blocked_by": [],
      "priority_basis": {
        "blocking": "high",
        "risk": "high"
      },
      "responsibility": "agent",
      "evidence_required": [
        "runtime/arcorbit/test/fixtures/window-controls-electron.mjs",
        "runtime/arcorbit/test/main-window-controls-electron.test.mjs",
        "runtime/arcorbit/test/fixtures/window-controls-electron.mjs:70",
        "runtime/arcorbit/test/fixtures/window-controls-electron.mjs:75",
        "runtime/arcorbit/test/main-window-controls-electron.test.mjs:17",
        "Review verification: first independent real Electron rerun failed with Unexpected end of JSON input, 2026-08-25",
        "Review verification: three additional real Electron runs produced 2 passes and 1 identical empty-stdout failure, 2026-08-25"
      ],
      "resolution": {
        "id": "CASE-20260825-009:review-finding:FINDING-20260825-009-001",
        "status": "resolved",
        "outcome": "Electron 夹具现在通过 window-all-closed listener 阻止最后窗口关闭触发默认提前退出，等待 process.stdout.write callback 确保 JSON 已交付，并以 maxRetries/retryDelay 稳定清理仍在释放的 userData；真实回归连续八次均成功。",
        "reason": "直接运行暴露并分别修复了结果写出前退出、stdout 刷新和 Session Storage 清理三条竞态；重复真实 Electron、单元测试、语法检查、差异检查和全量回归均通过。",
        "evidence": [
          "runtime/arcorbit/test/fixtures/window-controls-electron.mjs",
          "Verification: eight consecutive ARCORBIT_ELECTRON_WINDOW_CONTROLS_TEST=1 real Electron runs passed, 8/8, 2026-08-25",
          "Verification: node --test test/main-window-controls.test.mjs — 4 passed, 0 failed, 2026-08-25",
          "Verification: npm run check — 428 tests, 417 passed, 11 environment-gated skips, 0 failed, 2026-08-25",
          "Verification: node --check test/fixtures/window-controls-electron.mjs passed, 2026-08-25",
          "Verification: git diff --check passed, 2026-08-25"
        ],
        "occurred_at": "2026-08-25T15:31:17.310Z"
      }
    }
  ],
  "content_revision": 2,
  "completion_review": {
    "status": "clean",
    "policy": {
      "initial_max_cycles": 10,
      "source": "runtime/arcorbit/config/case-policy.json",
      "snapshotted_at": "2026-08-25T15:03:09.520Z"
    },
    "additional_cycles_authorized": 0,
    "cycle_count": 2,
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
        "outcome": "findings",
        "content_revision": 1,
        "dimensions": {
          "implementation_correctness": "clean",
          "problem_resolution": "clean",
          "verification_credibility": "findings",
          "regression_risk": "findings",
          "minimality": "clean"
        },
        "finding_ids": [
          "FINDING-20260825-009-001"
        ],
        "evidence": [
          "Source review: runtime/arcorbit/src/main-window-controls.mjs, desktop/main.mjs, desktop/preload.cjs, desktop/renderer/window-controls.mjs",
          "Review verification: node --test test/main-window-controls.test.mjs — 4 passed, 0 failed, 2026-08-25",
          "Review verification: four independent real Electron executions produced 2 passes and 2 empty-stdout JSON parse failures, 2026-08-25",
          "Verification: git diff --check passed, 2026-08-25",
          "Prior accepted evidence: npm run check — 428 tests, 417 passed, 11 environment-gated skips, 0 failed, 2026-08-25"
        ],
        "occurred_at": "2026-08-25T15:27:00.501Z"
      },
      {
        "cycle": 2,
        "autonomous_cycle": 2,
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
          "runtime/arcorbit/src/main-window-controls.mjs",
          "runtime/arcorbit/desktop/main.mjs",
          "runtime/arcorbit/desktop/preload.cjs",
          "runtime/arcorbit/desktop/renderer/window-controls.mjs",
          "runtime/arcorbit/test/main-window-controls.test.mjs",
          "runtime/arcorbit/test/main-window-controls-electron.test.mjs",
          "runtime/arcorbit/test/fixtures/window-controls-electron.mjs",
          "Review verification: node --test test/main-window-controls.test.mjs — 4 passed, 0 failed, 2026-08-25",
          "Review verification: four additional consecutive real Electron runs passed, 4/4, 2026-08-25",
          "Accepted repair verification: eight consecutive real Electron runs passed, 8/8, 2026-08-25",
          "Accepted full regression: npm run check — 428 tests, 417 passed, 11 environment-gated skips, 0 failed, 2026-08-25",
          "Review verification: git diff --check passed, 2026-08-25"
        ],
        "occurred_at": "2026-08-25T15:34:08.946Z"
      }
    ],
    "evidence": [
      "Source review: runtime/arcorbit/src/main-window-controls.mjs, desktop/main.mjs, desktop/preload.cjs, desktop/renderer/window-controls.mjs",
      "Review verification: node --test test/main-window-controls.test.mjs — 4 passed, 0 failed, 2026-08-25",
      "Review verification: four independent real Electron executions produced 2 passes and 2 empty-stdout JSON parse failures, 2026-08-25",
      "Verification: git diff --check passed, 2026-08-25",
      "Prior accepted evidence: npm run check — 428 tests, 417 passed, 11 environment-gated skips, 0 failed, 2026-08-25",
      "runtime/arcorbit/src/main-window-controls.mjs",
      "runtime/arcorbit/desktop/main.mjs",
      "runtime/arcorbit/desktop/preload.cjs",
      "runtime/arcorbit/desktop/renderer/window-controls.mjs",
      "runtime/arcorbit/test/main-window-controls.test.mjs",
      "runtime/arcorbit/test/main-window-controls-electron.test.mjs",
      "runtime/arcorbit/test/fixtures/window-controls-electron.mjs",
      "Review verification: four additional consecutive real Electron runs passed, 4/4, 2026-08-25",
      "Accepted repair verification: eight consecutive real Electron runs passed, 8/8, 2026-08-25",
      "Accepted full regression: npm run check — 428 tests, 417 passed, 11 environment-gated skips, 0 failed, 2026-08-25",
      "Review verification: git diff --check passed, 2026-08-25"
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
      "goal": "移除 ArcOrbit 主窗口系统标题栏，并让应用标题栏的最小化、最大化/还原和关闭控件通过受限边界真实工作。",
      "outcome": "completed",
      "gap_selection": {
        "mode": "candidate",
        "basis": "绑定 fresh ledger snapshot 与 CASE-20260825-009 的 Case-scoped selection token；比较全部 persisted obligations 后，选择当前唯一 ready 且直接阻断用户结果的窗口 chrome Gap。",
        "snapshot_token": "7674b892ca65592adf1ea9aae2759121b9a7c9d34900c0daf01f332d6753e48c",
        "selected_ref": "case-gap:CASE-20260825-009:GAP-WINDOW-CHROME-CONTROLS",
        "comparison_summary": "GAP-WINDOW-CHROME-CONTROLS 是当前 Case 唯一 ready candidate，直接解决重复标题栏和不可用窗口控件；四个 Project Gap 均需另行建案，且不应打断当前高用户影响的 Case。",
        "fresh_discovery_summary": "实现和验证未发现需要新增的普通 Case Gap；Gap 提交后仅剩 Ledger 派生的 Completion Review，必须等待 closeout 与 post-commit fresh snapshot 后再选择。",
        "considered": [
          {
            "ref": "project-gap:GAP-agent-scenario-evaluation",
            "source": "persisted",
            "eligibility": "case_required",
            "disposition": "deferred",
            "priority_basis": {
              "blocking": "none",
              "uncertainty": "high",
              "risk": "high",
              "user_impact": "medium"
            },
            "reason": "需要独立真实场景 Case，不能在当前窗口修复 Case 中执行。"
          },
          {
            "ref": "project-gap:GAP-runtime-resilience-and-adapters",
            "source": "persisted",
            "eligibility": "case_required",
            "disposition": "deferred",
            "priority_basis": {
              "blocking": "none",
              "uncertainty": "medium",
              "risk": "high",
              "user_impact": "medium"
            },
            "reason": "属于独立 Runtime resilience 范围，不阻断当前窗口 chrome 修复。"
          },
          {
            "ref": "project-gap:GAP-security-real-project-validation",
            "source": "persisted",
            "eligibility": "case_required",
            "disposition": "deferred",
            "priority_basis": {
              "blocking": "none",
              "uncertainty": "medium",
              "risk": "high",
              "user_impact": "medium"
            },
            "reason": "需要独立 permission-bearing project，不属于当前 Case。"
          },
          {
            "ref": "project-gap:GAP-cross-record-audit",
            "source": "persisted",
            "eligibility": "case_required",
            "disposition": "deferred",
            "priority_basis": {
              "blocking": "none",
              "uncertainty": "medium",
              "risk": "high",
              "user_impact": "high"
            },
            "reason": "需要独立跨记录审计 Case，不应替代当前唯一 ready candidate。"
          },
          {
            "ref": "case-gap:CASE-20260825-009:GAP-WINDOW-CHROME-CONTROLS",
            "source": "persisted",
            "eligibility": "ready",
            "disposition": "selected",
            "priority_basis": {
              "blocking": "high",
              "uncertainty": "low",
              "risk": "medium",
              "user_impact": "high"
            },
            "reason": "直接承接当前用户意图，且已有明确源码根因、实现边界和可执行验收证据。"
          }
        ]
      },
      "selected_gap": {
        "id": "GAP-WINDOW-CHROME-CONTROLS",
        "responsibility": "agent",
        "goal": "让 ArcOrbit 主窗口只使用应用自定义标题栏，并实现受限、真实、状态一致的最小化、最大化/还原和关闭控制。",
        "reason": "当前默认系统框架与 Renderer 标题栏重复，应用内控制点没有行为；修复必须同时覆盖 BrowserWindow chrome、受限 IPC、非拖拽交互区、最大化状态同步和回归验证。",
        "derived_from": [
          "case_intent",
          "FACT-WINDOW-CHROME-REGRESSION"
        ],
        "blocked_by": [],
        "priority_basis": {
          "blocking": "high",
          "uncertainty": "low",
          "risk": "medium",
          "user_impact": "high"
        },
        "evidence_required": [
          "主 BrowserWindow 不再显示系统标题栏，仍支持窗口拖动和边缘缩放。",
          "应用标题栏按钮通过受限的 preload/main-process 边界执行最小化、最大化/还原和关闭，交互控件不被拖拽区域吞掉。",
          "最大化与还原状态能够正确反映到应用控件，重复操作保持一致。",
          "相关 main/preload/Renderer 自动化测试通过。",
          "真实 Electron 窗口验证只显示一条标题栏且三个控制动作均生效。"
        ]
      },
      "planned_transition": {
        "goal": "移除 ArcOrbit 主窗口系统标题栏，并让应用标题栏的最小化、最大化/还原和关闭控件通过受限边界真实工作。",
        "expected_state_change": "GAP-WINDOW-CHROME-CONTROLS 由 open 变为 resolved；三条受威胁 impact 更新为 upheld；窗口交互和视觉 Project decisions 吸收已澄清的持久规则；Case 进入 Completion Review 候选状态。"
      },
      "accepted_state_delta": {
        "resolved_gap": {
          "id": "GAP-WINDOW-CHROME-CONTROLS",
          "status": "resolved",
          "outcome": "ArcOrbit 主 BrowserWindow 已使用 frame:false；应用标题栏保留拖拽和原生边缘缩放，三个可聚焦按钮通过 sender-bound preload/main IPC 执行最小化、最大化/还原和关闭，并同步最大化、还原、全屏和最小化状态。",
          "reason": "源码实现、静态边界测试、Renderer 状态竞态测试、真实 Electron 控制测试和全量回归共同满足 Gap 的全部 evidence requirements。",
          "evidence": [
            "runtime/arcorbit/desktop/main.mjs",
            "runtime/arcorbit/src/main-window-controls.mjs",
            "runtime/arcorbit/desktop/preload.cjs",
            "runtime/arcorbit/desktop/renderer/window-controls.mjs",
            "runtime/arcorbit/desktop/renderer/index.html",
            "runtime/arcorbit/desktop/renderer/styles.css",
            "runtime/arcorbit/test/main-window-controls.test.mjs",
            "runtime/arcorbit/test/main-window-controls-electron.test.mjs",
            "Verification: ARCORBIT_ELECTRON_WINDOW_CONTROLS_TEST=1 node --test test/main-window-controls-electron.test.mjs — 1 passed, 0 failed, 2026-08-25",
            "Verification: npm run check — 428 tests, 417 passed, 11 environment-gated skips, 0 failed, 2026-08-25",
            "Verification: git diff --check passed, 2026-08-25"
          ]
        },
        "facts_added": [],
        "facts_superseded": [],
        "impacts_added": [],
        "impacts_updated": [
          {
            "id": "IMPACT-WINDOW-VISUAL",
            "fact_id": "FACT-WINDOW-CHROME-REGRESSION",
            "fact_revision": 1,
            "target": {
              "kind": "software_invariant",
              "ref": "visual-language-remains-consistent",
              "revision": null
            },
            "effect": "upheld",
            "reason": "主窗口现在只有一条应用自绘标题栏，窗口控件的尺寸、颜色、交互反馈和最大化状态已纳入持久视觉规则并由真实界面验证。",
            "gap_ids": [],
            "evidence": [
              "arckit/visual/_library/brief.md",
              "arckit/visual/_library/design-tokens.yaml",
              "arckit/visual/_library/component-catalog.yaml",
              "arckit/visual/_library/style-preview.html",
              "runtime/arcorbit/desktop/renderer/styles.css",
              "runtime/arcorbit/test/main-window-controls-electron.test.mjs"
            ]
          },
          {
            "id": "IMPACT-WINDOW-INTERACTION",
            "fact_id": "FACT-WINDOW-CHROME-REGRESSION",
            "fact_revision": 1,
            "target": {
              "kind": "software_invariant",
              "ref": "interaction-expectations-remain-recoverable",
              "revision": null
            },
            "effect": "upheld",
            "reason": "标题栏拖动、双击最大化/还原、三个真实按钮、非拖拽交互区、动态可访问标签和窗口状态同步均已实现并写入持久交互约定。",
            "gap_ids": [],
            "evidence": [
              "arckit/interaction/CONVENTIONS.md",
              "runtime/arcorbit/desktop/renderer/window-controls.mjs",
              "runtime/arcorbit/desktop/renderer/index.html",
              "runtime/arcorbit/test/main-window-controls.test.mjs",
              "runtime/arcorbit/test/main-window-controls-electron.test.mjs"
            ]
          },
          {
            "id": "IMPACT-WINDOW-REALIZATION",
            "fact_id": "FACT-WINDOW-CHROME-REGRESSION",
            "fact_revision": 1,
            "target": {
              "kind": "software_invariant",
              "ref": "accepted-facts-are-realized",
              "revision": null
            },
            "effect": "upheld",
            "reason": "实际 Electron 窗口已证明无系统标题栏、仍可移动和缩放，并可真实完成最小化、最大化、还原和关闭。",
            "gap_ids": [],
            "evidence": [
              "runtime/arcorbit/desktop/main.mjs",
              "runtime/arcorbit/src/main-window-controls.mjs",
              "runtime/arcorbit/test/main-window-controls-electron.test.mjs",
              "Verification: ARCORBIT_ELECTRON_WINDOW_CONTROLS_TEST=1 node --test test/main-window-controls-electron.test.mjs — 1 passed, 0 failed, 2026-08-25"
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
            "observed_revision": 45,
            "set_decision": {
              "status": "settled",
              "statement": "ArcOrbit 保持既有 Personal、Product Lifecycle、Organization 导航与 Work、Automation、Feedback、Chat 等交互语义。Work 编辑 Sheet 显示当前产品集内可写产品；切换产品时清空旧产品限定的执行人、父待办和标签选择，并保留正文、状态及优先级草稿。确认界面明确说明将创建新 Task、删除旧 Task、生成新 id，且评论、附件和执行关系不会迁移。提交先创建目标 Task，确认成功后才删除源 Task；创建失败保留源 Task和草稿，删除失败则显示源、目标 Task 及可恢复状态，允许重试删除或明确保留两者。源删除确认后 Automation 安全停止旧 execution；目标 Task 不继承旧 execution。ArcOrbit 主窗口只使用应用自定义标题栏；标题区域支持拖动和双击最大化/还原，原生边缘缩放继续可用，应用内最小化、最大化/还原和关闭按钮必须真实控制当前窗口、保持可聚焦，并同步反映当前窗口状态。",
              "reason": "当前用户要求、持久交互约定和生产实现共同澄清了跨页面主窗口 chrome 的稳定交互规则。",
              "evidence": [
                "Current operator input, 2026-08-25",
                "arckit/interaction/task-browser/interaction.md",
                "arckit/interaction/CONVENTIONS.md",
                "runtime/arcorbit/desktop/renderer/window-controls.mjs",
                "runtime/arcorbit/test/main-window-controls-electron.test.mjs"
              ],
              "confidence": "high",
              "resume_condition": "当确认内容、复制范围、部分成功恢复动作、Automation 外部变化反馈，或主窗口标题栏、拖拽、缩放与窗口控制语义改变时重审。"
            },
            "gap_refs": [],
            "reason": "窗口 chrome 是跨页面且用户可感知的稳定交互契约，应在其被实现和验证的当轮进入 Project State。",
            "evidence": [
              "Current operator input, 2026-08-25",
              "arckit/interaction/CONVENTIONS.md",
              "runtime/arcorbit/test/main-window-controls-electron.test.mjs"
            ]
          },
          {
            "area_ref": "visual_language",
            "observed_revision": 2,
            "set_decision": {
              "status": "settled",
              "statement": "Visual requirements apply to the Desktop workspace and follow its durable visual specification; CLI and ledger surfaces remain text-native. ArcOrbit 主窗口使用单一 40px 应用自绘深色标题栏，提供 32px 命中区的红、黄、绿窗口控件及清晰的 hover、active、focus 和最大化状态反馈，不再叠加系统标题栏。",
              "reason": "持久视觉 brief、tokens、AppShell catalog、preview 与生产样式已经共同定义并实现单一应用标题栏。",
              "evidence": [
                "arckit/visual/_library/brief.md",
                "arckit/visual/_library/design-tokens.yaml",
                "arckit/visual/_library/component-catalog.yaml",
                "arckit/visual/_library/style-preview.html",
                "runtime/arcorbit/desktop/renderer/styles.css",
                "runtime/arcorbit/test/main-window-controls-electron.test.mjs"
              ],
              "confidence": "high",
              "resume_condition": "当平台 chrome 策略、标题栏高度、窗口控件布局或状态反馈改变时重审。"
            },
            "gap_refs": [],
            "reason": "去除系统标题栏并把装饰圆点升级为真实窗口控件，构成已澄清的持久 Desktop 视觉规则。",
            "evidence": [
              "arckit/visual/_library/brief.md",
              "arckit/visual/_library/design-tokens.yaml",
              "runtime/arcorbit/desktop/renderer/styles.css"
            ]
          }
        ],
        "software_invariant_changes": [],
        "project_gap_changes": [],
        "selection_context_change": null,
        "evidence": [
          "arckit/interaction/CONVENTIONS.md",
          "arckit/visual/_library/brief.md",
          "arckit/visual/_library/design-tokens.yaml",
          "arckit/tech/arcorbit/solution.md",
          "runtime/arcorbit/test/main-window-controls-electron.test.mjs"
        ]
      },
      "invariant_assessment": {
        "project_revision": 252,
        "judgments": [
          {
            "invariant_ref": "product-expectations-remain-recoverable",
            "disposition": "upheld",
            "reason": "用户对单一应用标题栏和真实窗口控制的验收含义已由 Case、Project interaction decision 和持久交互约定完整承载。",
            "fact_refs": [
              "FACT-WINDOW-CHROME-REGRESSION"
            ],
            "evidence": [
              "arckit/cases/active/CASE-20260825-009-arcorbit.md",
              "arckit/interaction/CONVENTIONS.md"
            ],
            "gap_refs": []
          },
          {
            "invariant_ref": "interaction-expectations-remain-recoverable",
            "disposition": "upheld",
            "reason": "拖动、缩放、双击、三项窗口动作、可访问标签和状态同步均有持久交互文档与可执行测试。",
            "fact_refs": [
              "FACT-WINDOW-CHROME-REGRESSION"
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
            "reason": "单一 40px 应用标题栏和真实窗口控件已与既有 AppShell 视觉系统对齐，并同步到 brief、tokens、catalog、preview 和生产 CSS。",
            "fact_refs": [
              "FACT-WINDOW-CHROME-REGRESSION"
            ],
            "evidence": [
              "arckit/visual/_library/brief.md",
              "arckit/visual/_library/design-tokens.yaml",
              "arckit/visual/_library/component-catalog.yaml",
              "arckit/visual/_library/style-preview.html",
              "runtime/arcorbit/desktop/renderer/styles.css"
            ],
            "gap_refs": []
          },
          {
            "invariant_ref": "technical-decisions-remain-explainable",
            "disposition": "upheld",
            "reason": "frame:false、显式 allowlisted IPC、sender 验证、preload 边界和事件驱动窗口状态同步已在技术方案和分层源码中清晰落地。",
            "fact_refs": [
              "FACT-WINDOW-CHROME-REGRESSION"
            ],
            "evidence": [
              "arckit/tech/arcorbit/solution.md",
              "runtime/arcorbit/desktop/main.mjs",
              "runtime/arcorbit/src/main-window-controls.mjs",
              "runtime/arcorbit/desktop/preload.cjs"
            ],
            "gap_refs": []
          },
          {
            "invariant_ref": "accepted-facts-are-realized",
            "disposition": "upheld",
            "reason": "生产源码和真实 Electron 运行共同证明重复系统标题栏已移除，三个应用控件均执行真实窗口动作。",
            "fact_refs": [
              "FACT-WINDOW-CHROME-REGRESSION"
            ],
            "evidence": [
              "runtime/arcorbit/desktop/main.mjs",
              "runtime/arcorbit/desktop/renderer/index.html",
              "runtime/arcorbit/test/main-window-controls-electron.test.mjs",
              "Verification: ARCORBIT_ELECTRON_WINDOW_CONTROLS_TEST=1 node --test test/main-window-controls-electron.test.mjs — 1 passed, 0 failed, 2026-08-25"
            ],
            "gap_refs": []
          },
          {
            "invariant_ref": "material-risks-have-credible-evidence",
            "disposition": "upheld",
            "reason": "窗口状态竞态、错误 sender、通用 Electron 暴露、最小化、最大化、还原、关闭、无系统框架及既有桌面回归均由分层自动化和真实 Electron 测试覆盖。",
            "fact_refs": [
              "FACT-WINDOW-CHROME-REGRESSION"
            ],
            "evidence": [
              "runtime/arcorbit/test/main-window-controls.test.mjs",
              "runtime/arcorbit/test/main-window-controls-electron.test.mjs",
              "Verification: npm run check — 428 tests, 417 passed, 11 environment-gated skips, 0 failed, 2026-08-25",
              "Verification: git diff --check passed, 2026-08-25"
            ],
            "gap_refs": []
          }
        ]
      },
      "evidence": [
        "Fresh ledger snapshot d288454fa4e8a44d1bbaa9813983378c374c8339e9d8d01c834ce7537e22c574 confirmed Project revision 252 and CASE-20260825-009 content revision 0; Case-scoped selection token is 7674b892ca65592adf1ea9aae2759121b9a7c9d34900c0daf01f332d6753e48c",
        "runtime/arcorbit/desktop/main.mjs",
        "runtime/arcorbit/src/main-window-controls.mjs",
        "runtime/arcorbit/desktop/preload.cjs",
        "runtime/arcorbit/desktop/renderer/window-controls.mjs",
        "runtime/arcorbit/test/main-window-controls.test.mjs",
        "runtime/arcorbit/test/main-window-controls-electron.test.mjs",
        "Verification: npm run check — 428 tests, 417 passed, 11 environment-gated skips, 0 failed, 2026-08-25"
      ],
      "runtime_result_ref": "arckit-runtime://runs/RUN-20260825-145955918Z-53a28522",
      "occurred_at": "2026-08-25T15:23:01.003Z"
    },
    {
      "round": 2,
      "transition_schema_version": "arckit-case-transition/v8",
      "goal": "独立审查窗口 chrome 实现的正确性、问题解决、验证可信度、回归风险和最小性。",
      "outcome": "completed",
      "gap_selection": {
        "mode": "candidate",
        "basis": "绑定 CASE-20260825-009 的 fresh Case-scoped selection token；全部普通 Gap 和 impacts 已闭合，Completion Review 是当前唯一 ready Case candidate。",
        "snapshot_token": "f450733f8528792f1e8cfacf075f66c3388c77e48a852bb6197941c1ffdfc5e8",
        "selected_ref": "case-gap:CASE-20260825-009:CASE-20260825-009:completion-review:1",
        "comparison_summary": "Completion Review 直接阻断 Case 结束且当前可立即验证，因此 selected；四个 Project Gap 均需独立建案，与本 Case 的完成审查无直接依赖，全部 deferred。",
        "fresh_discovery_summary": "审查过程发现真实 Electron 验证夹具存在非确定性输出丢失；它作为 Completion Review finding 提交并由 Ledger 派生后续普通修复 Gap，不作为本轮 fresh candidate 执行。",
        "considered": [
          {
            "ref": "project-gap:GAP-agent-scenario-evaluation",
            "source": "persisted",
            "eligibility": "case_required",
            "disposition": "deferred",
            "priority_basis": {
              "blocking": "none",
              "uncertainty": "high",
              "risk": "high",
              "user_impact": "medium"
            },
            "reason": "需要独立真实场景 Case，不属于当前 Completion Review。"
          },
          {
            "ref": "project-gap:GAP-runtime-resilience-and-adapters",
            "source": "persisted",
            "eligibility": "case_required",
            "disposition": "deferred",
            "priority_basis": {
              "blocking": "none",
              "uncertainty": "medium",
              "risk": "high",
              "user_impact": "medium"
            },
            "reason": "属于独立 Runtime resilience 范围，不阻断当前 Case 审查。"
          },
          {
            "ref": "project-gap:GAP-security-real-project-validation",
            "source": "persisted",
            "eligibility": "case_required",
            "disposition": "deferred",
            "priority_basis": {
              "blocking": "none",
              "uncertainty": "medium",
              "risk": "high",
              "user_impact": "medium"
            },
            "reason": "需要独立 permission-bearing project，不属于当前 Case。"
          },
          {
            "ref": "project-gap:GAP-cross-record-audit",
            "source": "persisted",
            "eligibility": "case_required",
            "disposition": "deferred",
            "priority_basis": {
              "blocking": "none",
              "uncertainty": "medium",
              "risk": "high",
              "user_impact": "high"
            },
            "reason": "需要独立跨记录审计 Case，不能替代当前 ready Completion Review。"
          },
          {
            "ref": "case-gap:CASE-20260825-009:CASE-20260825-009:completion-review:1",
            "source": "persisted",
            "eligibility": "ready",
            "disposition": "selected",
            "priority_basis": {
              "blocking": "high",
              "uncertainty": "low",
              "risk": "high",
              "user_impact": "high"
            },
            "reason": "全部普通工作已闭合，必须以五维独立审查判断 Case 是否可以结束。"
          }
        ]
      },
      "selected_gap": {
        "id": "CASE-20260825-009:completion-review:1",
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
        "goal": "独立审查窗口 chrome 实现的正确性、问题解决、验证可信度、回归风险和最小性。",
        "expected_state_change": "记录 Completion Review findings 结果；不修改 Case 内容，由 Ledger 从 finding 派生下一轮普通修复 Gap。"
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
            "implementation_correctness": "clean",
            "problem_resolution": "clean",
            "verification_credibility": "findings",
            "regression_risk": "findings",
            "minimality": "clean"
          },
          "findings": [
            {
              "id": "FINDING-20260825-009-001",
              "kind": "error",
              "statement": "真实 Electron 窗口回归夹具会在写出 JSON 结果后立即调用 app.exit(0)，独立重复运行中出现成功退出但 stdout 为空的情况，导致测试在 JSON.parse 处非确定性失败；该回归目前不能作为稳定、可重复的窗口控制验收门禁。",
              "responsibility": "agent",
              "artifact_refs": [
                "runtime/arcorbit/test/fixtures/window-controls-electron.mjs",
                "runtime/arcorbit/test/main-window-controls-electron.test.mjs"
              ],
              "evidence": [
                "runtime/arcorbit/test/fixtures/window-controls-electron.mjs:70",
                "runtime/arcorbit/test/fixtures/window-controls-electron.mjs:75",
                "runtime/arcorbit/test/main-window-controls-electron.test.mjs:17",
                "Review verification: first independent real Electron rerun failed with Unexpected end of JSON input, 2026-08-25",
                "Review verification: three additional real Electron runs produced 2 passes and 1 identical empty-stdout failure, 2026-08-25"
              ]
            }
          ],
          "evidence": [
            "Source review: runtime/arcorbit/src/main-window-controls.mjs, desktop/main.mjs, desktop/preload.cjs, desktop/renderer/window-controls.mjs",
            "Review verification: node --test test/main-window-controls.test.mjs — 4 passed, 0 failed, 2026-08-25",
            "Review verification: four independent real Electron executions produced 2 passes and 2 empty-stdout JSON parse failures, 2026-08-25",
            "Verification: git diff --check passed, 2026-08-25",
            "Prior accepted evidence: npm run check — 428 tests, 417 passed, 11 environment-gated skips, 0 failed, 2026-08-25"
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
        "project_revision": 253,
        "judgments": [
          {
            "invariant_ref": "product-expectations-remain-recoverable",
            "disposition": "upheld",
            "reason": "单一应用标题栏和真实窗口控制的产品验收含义仍由 accepted Project decision、Case 和持久交互约定完整承载。",
            "fact_refs": [
              "FACT-WINDOW-CHROME-REGRESSION"
            ],
            "evidence": [
              "arckit/cases/active/CASE-20260825-009-arcorbit.md",
              "arckit/interaction/CONVENTIONS.md"
            ],
            "gap_refs": []
          },
          {
            "invariant_ref": "interaction-expectations-remain-recoverable",
            "disposition": "upheld",
            "reason": "拖动、缩放、双击、窗口动作和状态反馈的交互语义保持完整且已有持久证据；本轮 finding 仅涉及测试夹具稳定性。",
            "fact_refs": [
              "FACT-WINDOW-CHROME-REGRESSION"
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
            "reason": "单一自绘标题栏及窗口控件视觉规则没有被审查证据否定。",
            "fact_refs": [
              "FACT-WINDOW-CHROME-REGRESSION"
            ],
            "evidence": [
              "arckit/visual/_library/brief.md",
              "arckit/visual/_library/design-tokens.yaml",
              "runtime/arcorbit/desktop/renderer/styles.css"
            ],
            "gap_refs": []
          },
          {
            "invariant_ref": "technical-decisions-remain-explainable",
            "disposition": "upheld",
            "reason": "frameless BrowserWindow、受限 IPC、sender 验证和状态同步边界仍与源码及技术方案一致。",
            "fact_refs": [
              "FACT-WINDOW-CHROME-REGRESSION"
            ],
            "evidence": [
              "arckit/tech/arcorbit/solution.md",
              "runtime/arcorbit/desktop/main.mjs",
              "runtime/arcorbit/src/main-window-controls.mjs",
              "runtime/arcorbit/desktop/preload.cjs"
            ],
            "gap_refs": []
          },
          {
            "invariant_ref": "accepted-facts-are-realized",
            "disposition": "upheld",
            "reason": "源码审查、单元测试和成功的真实 Electron 运行仍直接证明单一标题栏和三个窗口动作已实现；finding 不指向生产行为错误。",
            "fact_refs": [
              "FACT-WINDOW-CHROME-REGRESSION"
            ],
            "evidence": [
              "runtime/arcorbit/desktop/main.mjs",
              "runtime/arcorbit/desktop/renderer/window-controls.mjs",
              "runtime/arcorbit/test/main-window-controls.test.mjs",
              "Review verification: repeated real Electron runs included successful minimize, maximize, restore and close assertions, 2026-08-25"
            ],
            "gap_refs": []
          },
          {
            "invariant_ref": "material-risks-have-credible-evidence",
            "disposition": "upheld",
            "reason": "窗口实现风险仍由分层源码、4/4 单元测试、既有全量回归和成功真实运行支持；新发现的测试输出非确定性已作为显式 Review finding 提交，未被静默视为 clean。",
            "fact_refs": [
              "FACT-WINDOW-CHROME-REGRESSION"
            ],
            "evidence": [
              "runtime/arcorbit/test/main-window-controls.test.mjs",
              "runtime/arcorbit/test/main-window-controls-electron.test.mjs",
              "Prior accepted evidence: npm run check — 428 tests, 417 passed, 11 environment-gated skips, 0 failed, 2026-08-25",
              "Review finding evidence: four real Electron executions produced 2 passes and 2 empty-stdout failures, 2026-08-25"
            ],
            "gap_refs": []
          }
        ]
      },
      "evidence": [
        "Fresh post-commit snapshot 48879919a7aa3701577d7e36f3aaf0b866d374bd690cd363e3c044ac5bead115 confirmed Project revision 253 and Case content revision 1",
        "runtime/arcorbit/src/main-window-controls.mjs",
        "runtime/arcorbit/desktop/main.mjs",
        "runtime/arcorbit/desktop/preload.cjs",
        "runtime/arcorbit/desktop/renderer/window-controls.mjs",
        "runtime/arcorbit/test/main-window-controls.test.mjs",
        "runtime/arcorbit/test/main-window-controls-electron.test.mjs",
        "Review verification: node --test test/main-window-controls.test.mjs — 4 passed, 0 failed, 2026-08-25",
        "Review verification: four independent real Electron executions produced 2 passes and 2 empty-stdout failures, 2026-08-25"
      ],
      "runtime_result_ref": "arckit-runtime://runs/RUN-20260825-145955918Z-53a28522",
      "occurred_at": "2026-08-25T15:27:00.501Z"
    },
    {
      "round": 3,
      "transition_schema_version": "arckit-case-transition/v8",
      "goal": "消除真实 Electron 窗口回归夹具的提前退出、stdout 丢失和临时目录清理竞态。",
      "outcome": "completed",
      "gap_selection": {
        "mode": "candidate",
        "basis": "绑定 CASE-20260825-009 的 fresh Case-scoped selection token；Completion Review 派生的验证竞态 Gap 是当前唯一 ready Case candidate。",
        "snapshot_token": "c071435e16bf601f921ccdec20701c5c5f8b6b4e02b8194b70075fda460e9a36",
        "selected_ref": "case-gap:CASE-20260825-009:CASE-20260825-009:review-finding:FINDING-20260825-009-001",
        "comparison_summary": "验证竞态 finding 直接阻断 Case 的下一次 Completion Review，且责任、范围和验收方式均已明确，因此 selected；四个 Project Gap 均需独立建案，与当前修复无直接依赖，全部 deferred。",
        "fresh_discovery_summary": "修复过程进一步定位到最后窗口默认退出和 Electron userData 清理竞态，均属于 selected finding 的既定验证夹具生命周期范围；未发现需要新增的普通 Gap。",
        "considered": [
          {
            "ref": "project-gap:GAP-agent-scenario-evaluation",
            "source": "persisted",
            "eligibility": "case_required",
            "disposition": "deferred",
            "priority_basis": {
              "blocking": "none",
              "uncertainty": "high",
              "risk": "high",
              "user_impact": "medium"
            },
            "reason": "需要独立真实场景 Case，不属于当前验证夹具修复。"
          },
          {
            "ref": "project-gap:GAP-runtime-resilience-and-adapters",
            "source": "persisted",
            "eligibility": "case_required",
            "disposition": "deferred",
            "priority_basis": {
              "blocking": "none",
              "uncertainty": "medium",
              "risk": "high",
              "user_impact": "medium"
            },
            "reason": "属于独立 Runtime resilience 范围，不阻断当前 Case finding 修复。"
          },
          {
            "ref": "project-gap:GAP-security-real-project-validation",
            "source": "persisted",
            "eligibility": "case_required",
            "disposition": "deferred",
            "priority_basis": {
              "blocking": "none",
              "uncertainty": "medium",
              "risk": "high",
              "user_impact": "medium"
            },
            "reason": "需要独立 permission-bearing project，不属于当前 Case。"
          },
          {
            "ref": "project-gap:GAP-cross-record-audit",
            "source": "persisted",
            "eligibility": "case_required",
            "disposition": "deferred",
            "priority_basis": {
              "blocking": "none",
              "uncertainty": "medium",
              "risk": "high",
              "user_impact": "high"
            },
            "reason": "需要独立跨记录审计 Case，不能替代当前唯一 ready repair Gap。"
          },
          {
            "ref": "case-gap:CASE-20260825-009:CASE-20260825-009:review-finding:FINDING-20260825-009-001",
            "source": "persisted",
            "eligibility": "ready",
            "disposition": "selected",
            "priority_basis": {
              "blocking": "high",
              "uncertainty": "low",
              "risk": "high",
              "user_impact": "medium"
            },
            "reason": "它是当前 Case 唯一未闭合义务，直接影响真实 Electron 验证的可重复性。"
          }
        ]
      },
      "selected_gap": {
        "id": "CASE-20260825-009:review-finding:FINDING-20260825-009-001",
        "responsibility": "agent",
        "goal": "Resolve review finding: 真实 Electron 窗口回归夹具会在写出 JSON 结果后立即调用 app.exit(0)，独立重复运行中出现成功退出但 stdout 为空的情况，导致测试在 JSON.parse 处非确定性失败；该回归目前不能作为稳定、可重复的窗口控制验收门禁。",
        "reason": "error found by completion review",
        "derived_from": [
          "completion_review",
          "content_revision:1"
        ],
        "blocked_by": [],
        "priority_basis": {
          "blocking": "high",
          "uncertainty": "",
          "risk": "high",
          "user_impact": ""
        },
        "evidence_required": [
          "runtime/arcorbit/test/fixtures/window-controls-electron.mjs",
          "runtime/arcorbit/test/main-window-controls-electron.test.mjs",
          "runtime/arcorbit/test/fixtures/window-controls-electron.mjs:70",
          "runtime/arcorbit/test/fixtures/window-controls-electron.mjs:75",
          "runtime/arcorbit/test/main-window-controls-electron.test.mjs:17",
          "Review verification: first independent real Electron rerun failed with Unexpected end of JSON input, 2026-08-25",
          "Review verification: three additional real Electron runs produced 2 passes and 1 identical empty-stdout failure, 2026-08-25"
        ]
      },
      "planned_transition": {
        "goal": "消除真实 Electron 窗口回归夹具的提前退出、stdout 丢失和临时目录清理竞态。",
        "expected_state_change": "review finding 派生 Gap 由 open 变为 resolved；Case 内容 revision 更新并重新进入 Completion Review 候选状态。"
      },
      "accepted_state_delta": {
        "resolved_gap": {
          "id": "CASE-20260825-009:review-finding:FINDING-20260825-009-001",
          "status": "resolved",
          "outcome": "Electron 夹具现在通过 window-all-closed listener 阻止最后窗口关闭触发默认提前退出，等待 process.stdout.write callback 确保 JSON 已交付，并以 maxRetries/retryDelay 稳定清理仍在释放的 userData；真实回归连续八次均成功。",
          "reason": "直接运行暴露并分别修复了结果写出前退出、stdout 刷新和 Session Storage 清理三条竞态；重复真实 Electron、单元测试、语法检查、差异检查和全量回归均通过。",
          "evidence": [
            "runtime/arcorbit/test/fixtures/window-controls-electron.mjs",
            "Verification: eight consecutive ARCORBIT_ELECTRON_WINDOW_CONTROLS_TEST=1 real Electron runs passed, 8/8, 2026-08-25",
            "Verification: node --test test/main-window-controls.test.mjs — 4 passed, 0 failed, 2026-08-25",
            "Verification: npm run check — 428 tests, 417 passed, 11 environment-gated skips, 0 failed, 2026-08-25",
            "Verification: node --check test/fixtures/window-controls-electron.mjs passed, 2026-08-25",
            "Verification: git diff --check passed, 2026-08-25"
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
        "project_revision": 253,
        "judgments": [
          {
            "invariant_ref": "product-expectations-remain-recoverable",
            "disposition": "upheld",
            "reason": "窗口产品验收含义没有变化，仍由 accepted Project decision、Case 和持久交互约定完整承载。",
            "fact_refs": [
              "FACT-WINDOW-CHROME-REGRESSION"
            ],
            "evidence": [
              "arckit/cases/active/CASE-20260825-009-arcorbit.md",
              "arckit/interaction/CONVENTIONS.md"
            ],
            "gap_refs": []
          },
          {
            "invariant_ref": "interaction-expectations-remain-recoverable",
            "disposition": "upheld",
            "reason": "修复仅稳定验证夹具生命周期，不改变已接受的拖动、缩放、窗口动作和状态反馈交互语义。",
            "fact_refs": [
              "FACT-WINDOW-CHROME-REGRESSION"
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
            "reason": "单一自绘标题栏和窗口控件视觉规则未被本轮测试夹具修复改变。",
            "fact_refs": [
              "FACT-WINDOW-CHROME-REGRESSION"
            ],
            "evidence": [
              "arckit/visual/_library/brief.md",
              "arckit/visual/_library/design-tokens.yaml",
              "runtime/arcorbit/desktop/renderer/styles.css"
            ],
            "gap_refs": []
          },
          {
            "invariant_ref": "technical-decisions-remain-explainable",
            "disposition": "upheld",
            "reason": "生产 frameless BrowserWindow、受限 IPC 和状态同步边界保持不变；夹具的显式 Electron 生命周期和有限清理重试与其验证责任一致。",
            "fact_refs": [
              "FACT-WINDOW-CHROME-REGRESSION"
            ],
            "evidence": [
              "arckit/tech/arcorbit/solution.md",
              "runtime/arcorbit/desktop/main.mjs",
              "runtime/arcorbit/test/fixtures/window-controls-electron.mjs"
            ],
            "gap_refs": []
          },
          {
            "invariant_ref": "accepted-facts-are-realized",
            "disposition": "upheld",
            "reason": "生产实现仍由分层源码、4/4 单元测试和连续 8/8 真实 Electron 运行直接证明。",
            "fact_refs": [
              "FACT-WINDOW-CHROME-REGRESSION"
            ],
            "evidence": [
              "runtime/arcorbit/desktop/main.mjs",
              "runtime/arcorbit/desktop/renderer/window-controls.mjs",
              "runtime/arcorbit/test/main-window-controls.test.mjs",
              "Verification: eight consecutive real Electron runs passed, 8/8, 2026-08-25"
            ],
            "gap_refs": []
          },
          {
            "invariant_ref": "material-risks-have-credible-evidence",
            "disposition": "upheld",
            "reason": "先前可复现的输出竞态已通过显式生命周期控制消除，并由连续八次真实 Electron 成功运行、单元测试和全量回归提供可重复且成比例的证据。",
            "fact_refs": [
              "FACT-WINDOW-CHROME-REGRESSION"
            ],
            "evidence": [
              "runtime/arcorbit/test/fixtures/window-controls-electron.mjs",
              "runtime/arcorbit/test/main-window-controls-electron.test.mjs",
              "Verification: eight consecutive real Electron runs passed, 8/8, 2026-08-25",
              "Verification: npm run check — 428 tests, 417 passed, 11 environment-gated skips, 0 failed, 2026-08-25"
            ],
            "gap_refs": []
          }
        ]
      },
      "evidence": [
        "Fresh post-review snapshot 13824d4df38d9a416383880a3e48cd45ba1c1bd4ff466e14305d2308156a4c21 confirmed Project revision 253 and the agent-owned review finding Gap",
        "runtime/arcorbit/test/fixtures/window-controls-electron.mjs",
        "runtime/arcorbit/test/main-window-controls-electron.test.mjs",
        "Verification: eight consecutive real Electron runs passed, 8/8, 2026-08-25",
        "Verification: node --test test/main-window-controls.test.mjs — 4 passed, 0 failed, 2026-08-25",
        "Verification: npm run check — 428 tests, 417 passed, 11 environment-gated skips, 0 failed, 2026-08-25"
      ],
      "runtime_result_ref": "arckit-runtime://runs/RUN-20260825-145955918Z-53a28522",
      "occurred_at": "2026-08-25T15:31:17.310Z"
    },
    {
      "round": 4,
      "transition_schema_version": "arckit-case-transition/v8",
      "goal": "独立审查 content revision 2 的窗口 chrome 实现、问题解决、验证可信度、回归风险和最小性。",
      "outcome": "completed",
      "gap_selection": {
        "mode": "candidate",
        "basis": "绑定 fresh post-commit snapshot 与 CASE-20260825-009 selection token；比较全部 persisted obligations 后，选择当前唯一 ready 且直接阻断 Case 收口的 Completion Review candidate。",
        "snapshot_token": "6741c9aae5ca9dcd2dcb3c2140b3566ab041eb4adf4b3d0f235ecd1a7c4cbc82",
        "selected_ref": "case-gap:CASE-20260825-009:CASE-20260825-009:completion-review:2",
        "comparison_summary": "Completion Review 是当前 Case 唯一 ready candidate，直接决定已修复实现能否收口；四个 Project Gap 均需独立建案，不能替代本 Case 的完成审查。",
        "fresh_discovery_summary": "本轮源码复查、单元测试及连续真实 Electron 复跑未发现新的错误、遗漏或过度实现。",
        "considered": [
          {
            "ref": "project-gap:GAP-agent-scenario-evaluation",
            "source": "persisted",
            "eligibility": "case_required",
            "disposition": "deferred",
            "priority_basis": {
              "blocking": "none",
              "uncertainty": "high",
              "risk": "high",
              "user_impact": "medium"
            },
            "reason": "需要独立真实场景 Case，不属于当前窗口修复的完成审查。"
          },
          {
            "ref": "project-gap:GAP-runtime-resilience-and-adapters",
            "source": "persisted",
            "eligibility": "case_required",
            "disposition": "deferred",
            "priority_basis": {
              "blocking": "none",
              "uncertainty": "medium",
              "risk": "high",
              "user_impact": "medium"
            },
            "reason": "属于独立 Runtime resilience 范围，不阻断当前 Case 收口。"
          },
          {
            "ref": "project-gap:GAP-security-real-project-validation",
            "source": "persisted",
            "eligibility": "case_required",
            "disposition": "deferred",
            "priority_basis": {
              "blocking": "none",
              "uncertainty": "medium",
              "risk": "high",
              "user_impact": "medium"
            },
            "reason": "需要独立 permission-bearing project，不属于当前 Case。"
          },
          {
            "ref": "project-gap:GAP-cross-record-audit",
            "source": "persisted",
            "eligibility": "case_required",
            "disposition": "deferred",
            "priority_basis": {
              "blocking": "none",
              "uncertainty": "medium",
              "risk": "high",
              "user_impact": "high"
            },
            "reason": "需要独立跨记录审计 Case，不能替代当前 ready Completion Review。"
          },
          {
            "ref": "case-gap:CASE-20260825-009:CASE-20260825-009:completion-review:2",
            "source": "persisted",
            "eligibility": "ready",
            "disposition": "selected",
            "priority_basis": {
              "blocking": "high",
              "uncertainty": "low",
              "risk": "high",
              "user_impact": "high"
            },
            "reason": "全部普通 Gap 和 impacts 已闭合，修复后的实现与验证证据已具备独立五维审查条件。"
          }
        ]
      },
      "selected_gap": {
        "id": "CASE-20260825-009:completion-review:2",
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
        "goal": "独立审查 content revision 2 的窗口 chrome 实现、问题解决、验证可信度、回归风险和最小性。",
        "expected_state_change": "Completion Review 记录为 clean，CASE-20260825-009 不再有剩余义务并进入 resolved 状态。"
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
            "runtime/arcorbit/test/main-window-controls.test.mjs",
            "runtime/arcorbit/test/main-window-controls-electron.test.mjs",
            "runtime/arcorbit/test/fixtures/window-controls-electron.mjs",
            "Review verification: node --test test/main-window-controls.test.mjs — 4 passed, 0 failed, 2026-08-25",
            "Review verification: four additional consecutive real Electron runs passed, 4/4, 2026-08-25",
            "Accepted repair verification: eight consecutive real Electron runs passed, 8/8, 2026-08-25",
            "Accepted full regression: npm run check — 428 tests, 417 passed, 11 environment-gated skips, 0 failed, 2026-08-25",
            "Review verification: git diff --check passed, 2026-08-25"
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
        "project_revision": 253,
        "judgments": [
          {
            "invariant_ref": "product-expectations-remain-recoverable",
            "disposition": "upheld",
            "reason": "单一应用标题栏和真实窗口控制的产品验收含义仍由 accepted Project decision、Case 与持久交互约定完整承载。",
            "fact_refs": [
              "FACT-WINDOW-CHROME-REGRESSION"
            ],
            "evidence": [
              "arckit/cases/active/CASE-20260825-009-arcorbit.md",
              "arckit/interaction/CONVENTIONS.md"
            ],
            "gap_refs": []
          },
          {
            "invariant_ref": "interaction-expectations-remain-recoverable",
            "disposition": "upheld",
            "reason": "拖动、缩放、双击、三个窗口动作、可访问标签和状态同步保持完整，并有持久交互文档与可执行测试。",
            "fact_refs": [
              "FACT-WINDOW-CHROME-REGRESSION"
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
            "reason": "单一 40px 自绘标题栏、窗口控件命中区和状态反馈继续与持久视觉规则及生产样式一致。",
            "fact_refs": [
              "FACT-WINDOW-CHROME-REGRESSION"
            ],
            "evidence": [
              "arckit/visual/_library/brief.md",
              "arckit/visual/_library/design-tokens.yaml",
              "arckit/visual/_library/component-catalog.yaml",
              "runtime/arcorbit/desktop/renderer/styles.css"
            ],
            "gap_refs": []
          },
          {
            "invariant_ref": "technical-decisions-remain-explainable",
            "disposition": "upheld",
            "reason": "frameless BrowserWindow、显式 IPC allowlist、sender 验证、preload 边界、状态同步及测试夹具生命周期均与其责任一致且可恢复。",
            "fact_refs": [
              "FACT-WINDOW-CHROME-REGRESSION"
            ],
            "evidence": [
              "arckit/tech/arcorbit/solution.md",
              "runtime/arcorbit/desktop/main.mjs",
              "runtime/arcorbit/src/main-window-controls.mjs",
              "runtime/arcorbit/desktop/preload.cjs",
              "runtime/arcorbit/test/fixtures/window-controls-electron.mjs"
            ],
            "gap_refs": []
          },
          {
            "invariant_ref": "accepted-facts-are-realized",
            "disposition": "upheld",
            "reason": "生产源码、4/4 单元测试及修复前后累计连续十二次成功的真实 Electron 运行直接证明单一标题栏和三个真实窗口动作已实现。",
            "fact_refs": [
              "FACT-WINDOW-CHROME-REGRESSION"
            ],
            "evidence": [
              "runtime/arcorbit/desktop/main.mjs",
              "runtime/arcorbit/desktop/renderer/window-controls.mjs",
              "runtime/arcorbit/test/main-window-controls.test.mjs",
              "runtime/arcorbit/test/main-window-controls-electron.test.mjs",
              "Review verification: four additional consecutive real Electron runs passed, 4/4, 2026-08-25",
              "Accepted repair verification: eight consecutive real Electron runs passed, 8/8, 2026-08-25"
            ],
            "gap_refs": []
          },
          {
            "invariant_ref": "material-risks-have-credible-evidence",
            "disposition": "upheld",
            "reason": "窗口状态、受限边界、真实动作及先前的输出和清理竞态均由分层测试、连续真实运行和全量回归提供可重复且成比例的证据。",
            "fact_refs": [
              "FACT-WINDOW-CHROME-REGRESSION"
            ],
            "evidence": [
              "runtime/arcorbit/test/main-window-controls.test.mjs",
              "runtime/arcorbit/test/main-window-controls-electron.test.mjs",
              "runtime/arcorbit/test/fixtures/window-controls-electron.mjs",
              "Review verification: four additional consecutive real Electron runs passed, 4/4, 2026-08-25",
              "Accepted repair verification: eight consecutive real Electron runs passed, 8/8, 2026-08-25",
              "Accepted full regression: npm run check — 428 tests, 417 passed, 11 environment-gated skips, 0 failed, 2026-08-25"
            ],
            "gap_refs": []
          }
        ]
      },
      "evidence": [
        "Fresh post-commit snapshot f9a3c01d7074097123aec5b7419d96282039d070e69fcf9782c4be191ed44654 confirmed Project revision 253 and CASE-20260825-009 content revision 2; Case-scoped selection token is 6741c9aae5ca9dcd2dcb3c2140b3566ab041eb4adf4b3d0f235ecd1a7c4cbc82",
        "runtime/arcorbit/test/fixtures/window-controls-electron.mjs",
        "runtime/arcorbit/test/main-window-controls.test.mjs",
        "runtime/arcorbit/test/main-window-controls-electron.test.mjs",
        "Review verification: node --test test/main-window-controls.test.mjs — 4 passed, 0 failed, 2026-08-25",
        "Review verification: four additional consecutive real Electron runs passed, 4/4, 2026-08-25",
        "Review verification: git diff --check passed, 2026-08-25"
      ],
      "runtime_result_ref": "arckit-runtime://runs/RUN-20260825-145955918Z-53a28522",
      "occurred_at": "2026-08-25T15:34:08.946Z"
    }
  ],
  "case_resolution": {
    "status": "resolved",
    "stage": "resolved",
    "satisfied": [
      "GAP-WINDOW-CHROME-CONTROLS",
      "CASE-20260825-009:review-finding:FINDING-20260825-009-001"
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
    "updated_at": "2026-08-25T15:34:08.946Z"
  }
}
```

## Round Notes

- Case history is canonical in Structured Record.rounds; keep prose notes exceptional.
