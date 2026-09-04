# 修复全屏模式关闭图片查看器后主窗口黑屏

Case: CASE-20260904-004
Status: closed
Artifact Type: code
Selected Gap: none
Updated: 2026-09-04T16:51:11.370Z

## User Intent

解决 ArcOrbit 主窗口处于全屏模式时，从待办附件等入口打开图片查看器并按 Escape 关闭后，主窗口错误变黑的问题。

## Structured Record

```json
{
  "schema_version": "development-case-record/v5",
  "id": "CASE-20260904-004",
  "title": "修复全屏模式关闭图片查看器后主窗口黑屏",
  "status": "closed",
  "artifact_type": "code",
  "created_at": "2026-09-04T15:56:47.554Z",
  "updated_at": "2026-09-04T16:51:11.370Z",
  "user_intent": "解决 ArcOrbit 主窗口处于全屏模式时，从待办附件等入口打开图片查看器并按 Escape 关闭后，主窗口错误变黑的问题。",
  "expected_outcome": "关闭图片查看器只影响查看器窗口；ArcOrbit 全屏主窗口保持原有内容、全屏状态和可交互性，并有覆盖该路径的回归证据。",
  "project_state_ref": "arckit/project/state.record.json",
  "current_round": {
    "goal": "",
    "selected_gap": null
  },
  "facts": [
    {
      "id": "FACT-20260904-004-001",
      "revision": 1,
      "status": "accepted",
      "statement": "ArcOrbit 主窗口处于全屏模式时，从待办附件等入口打开图片查看器并按 Escape 退出，图片查看器关闭后主窗口会错误变黑；预期是只关闭图片查看器，主窗口不受影响。",
      "basis": "当前操作者提供了明确的触发条件、实际结果和期望结果。",
      "evidence": [
        "Current operator input, 2026-09-04"
      ]
    },
    {
      "id": "FACT-20260904-004-002",
      "revision": 1,
      "status": "accepted",
      "statement": "当前图片查看器由 main process 创建为以 ArcOrbit 主窗口为 parent 的独立 BrowserWindow，查看器 Renderer 对 Escape 直接调用 window.close()；现有聚焦测试未覆盖父窗口处于原生全屏时关闭查看器的行为。",
      "basis": "对当前实现和测试覆盖面的直接检查。",
      "evidence": [
        "runtime/arcorbit/src/work-task-image-viewer.mjs",
        "runtime/arcorbit/desktop/image-viewer/renderer.js",
        "runtime/arcorbit/desktop/main.mjs",
        "runtime/arcorbit/test/work-task-image-viewer.test.mjs",
        "rg full-screen coverage: image viewer tests contain no fullscreen parent-close scenario"
      ]
    },
    {
      "id": "FACT-20260904-004-003",
      "revision": 1,
      "status": "accepted",
      "statement": "在 macOS 原生全屏主窗口中打开 ArcOrbit 图片查看器时，查看器会进入全屏窗口状态。Escape 当前直接销毁仍处于该状态的查看器，导致主窗口虽然保持 full_screen=true、Renderer 存活且 DOM 内容完整，却未在关闭后重新收到原生 show 并重新挂回全屏 Space。先让查看器退出全屏、等待 leave-full-screen，再关闭，会立即产生 main.show；因此缺陷根因是原生全屏查看器的直接销毁时序，而不是主 Renderer 崩溃、DOM 丢失、parent 关系本身或普通 focus 恢复失败。",
      "basis": "真实 Electron/macOS 运行日志与多组受控对照完整匹配用户报告的触发条件、状态变化、发生位置和时序。",
      "evidence": [
        "arckit/debug/fullscreen-image-viewer-close.log",
        "Diagnostic log SHA-256: ee68d51eb07f7139b687c6ed11185ccd04d31d0075835ef294d4349ec0411640",
        "runtime/arcorbit/src/work-task-image-viewer.mjs",
        "runtime/arcorbit/desktop/image-viewer/renderer.js"
      ]
    },
    {
      "id": "FACT-20260904-004-004",
      "revision": 1,
      "status": "accepted",
      "statement": "ArcOrbit 图片查看器的关闭所有权已由主进程实现为平台受控状态机：仅在 macOS 原生全屏时阻止直接 close，等待 leave-full-screen 后放行一次真实关闭并恢复父窗口；重复 close 不会重复请求退出全屏，应用退出可绕过等待并强制销毁。普通非全屏和非 macOS 关闭行为保持不变。",
      "basis": "实现 diff、已接受的真实 Electron 根因对照、聚焦单元测试、Desktop 回归和静态清理检查共同证明修复边界。",
      "evidence": [
        "runtime/arcorbit/src/work-task-image-viewer.mjs",
        "runtime/arcorbit/desktop/main.mjs",
        "runtime/arcorbit/test/work-task-image-viewer.test.mjs",
        "74 focused tests passed, 0 failed",
        "No ARC_DEBUG:fullscreen-image-viewer-close or ARCORBIT_FULLSCREEN_DIAGNOSTIC marker remains"
      ]
    }
  ],
  "state_impacts": [
    {
      "id": "IMPACT-20260904-004-001",
      "fact_id": "FACT-20260904-004-001",
      "fact_revision": 1,
      "target": {
        "kind": "software_decision",
        "ref": "experience_and_interaction",
        "revision": 65
      },
      "effect": "upheld",
      "reason": "图片查看器的 Escape/窗口关闭现在先安全退出 macOS 原生全屏，再完成单次关闭并恢复父窗口；普通与跨平台路径保持原有行为，因此已接受的主窗口显示和交互连续性得到实现。",
      "gap_ids": [],
      "evidence": [
        "local:fact:fullscreen-viewer-safe-close-realized",
        "runtime/arcorbit/src/work-task-image-viewer.mjs",
        "runtime/arcorbit/test/work-task-image-viewer.test.mjs",
        "74 focused tests passed, 0 failed"
      ]
    }
  ],
  "gaps": [
    {
      "id": "GAP-20260904-004-001",
      "status": "resolved",
      "goal": "在真实 Electron 全屏路径稳定复现问题，并通过受控运行时日志确认关闭图片查看器导致主窗口黑屏的实际执行路径、根因和必要修复边界。",
      "reason": "静态代码能确认 parent BrowserWindow 与 Escape 关闭路径，但尚不能完整解释黑屏表现；必须区分父子窗口语义、原生全屏转换、焦点恢复和主窗口渲染状态等竞争假设后才能安全修复。",
      "derived_from": [
        "FACT-20260904-004-001",
        "FACT-20260904-004-002"
      ],
      "blocked_by": [],
      "priority_basis": {
        "blocking": "blocks evidence-backed repair",
        "uncertainty": "root cause is not yet confirmed",
        "risk": "high because an unverified window change may cause cross-platform regressions",
        "user_impact": "fullscreen users lose the usable main window after viewing an image"
      },
      "responsibility": "agent",
      "evidence_required": [
        "可重复执行的 ArcOrbit 全屏主窗口→打开图片查看器→Escape 关闭路径",
        "使用唯一标记 ARC_DEBUG:fullscreen-image-viewer-close 写入 arckit/debug/fullscreen-image-viewer-close.log 的窗口生命周期、全屏状态、焦点和渲染边界观测",
        "能够排除关键竞争假设的实际运行证据",
        "经证据确认的根因和最小修复边界"
      ],
      "resolution": {
        "id": "GAP-20260904-004-001",
        "status": "resolved",
        "outcome": "真实 Electron 诊断确认：在主窗口处于 macOS 原生全屏时，图片查看器会进入同一全屏状态；直接从 Escape 销毁查看器后，主窗口逻辑状态、Renderer 和 DOM 均正常，但没有及时发生原生 main.show，窗口未重新挂回全屏 Space。先使查看器退出全屏、等待 leave-full-screen，再关闭，会触发主窗口 main.show，因此根因和必要修复边界已经确定。",
        "reason": "受控日志覆盖了直接关闭、移除 parent、fullscreenable:false、显式 show/focus、hide→show/focus，以及 leave-full-screen-before-close 对照。只有最后一种改变了关键原生事件序列并在关闭后立即恢复 main.show，足以排除 Renderer 崩溃、DOM 丢失、parent 单因、查看器 fullscreenable 配置和普通可见性恢复假设。",
        "evidence": [
          "arckit/debug/fullscreen-image-viewer-close.log",
          "Diagnostic log SHA-256: ee68d51eb07f7139b687c6ed11185ccd04d31d0075835ef294d4349ec0411640",
          "Direct-close observations: viewer.closed followed by main.focus without immediate main.show; main renderer_crashed=false, sentinel preserved, capturePage non-black",
          "Control observation: viewer.leave-full-screen at 2026-09-04T16:17:26.886Z, viewer.closed at 16:17:26.891Z, main.show at 16:17:26.998Z",
          "runtime/arcorbit/src/work-task-image-viewer.mjs",
          "runtime/arcorbit/desktop/image-viewer/renderer.js"
        ],
        "occurred_at": "2026-09-04T16:27:23.065Z"
      }
    },
    {
      "id": "GAP-20260904-004-002",
      "status": "resolved",
      "goal": "实现图片查看器的原生全屏安全关闭时序，并以单元和真实 Electron 回归证明 Escape 只关闭查看器、全屏主窗口保持可见、内容完整且可交互。",
      "reason": "本轮诊断证明直接销毁仍处于原生全屏状态的查看器会跳过主窗口恢复呈现；修复需要在查看器关闭边界处理 leave-full-screen、关闭重入和应用退出，并防止普通非全屏及跨平台行为回归。",
      "derived_from": [
        "FACT-20260904-004-001",
        "FACT-20260904-004-003"
      ],
      "blocked_by": [],
      "priority_basis": {
        "blocking": "blocks resolution of the current user-visible defect",
        "uncertainty": "low; implementation and shutdown reentrancy still require verification",
        "risk": "high if native fullscreen close ordering or application shutdown is mishandled",
        "user_impact": "restores the ArcOrbit main window after closing an image viewer in fullscreen"
      },
      "responsibility": "agent",
      "evidence_required": [
        "图片查看器全屏关闭边界的最小实现及关闭重入保护",
        "普通非全屏关闭与应用退出路径的聚焦单元回归",
        "真实 Electron/macOS 全屏主窗口→图片查看器→Escape 回归，证明查看器关闭后主窗口发生 show、保持 full_screen=true 且 Renderer/DOM 正常",
        "移除 ARC_DEBUG:fullscreen-image-viewer-close 临时日志及全部诊断 marker 的清理检查"
      ],
      "resolution": {
        "id": "GAP-20260904-004-002",
        "status": "resolved",
        "outcome": "图片查看器现在由主进程统一控制关闭顺序：macOS 下若查看器仍处于原生全屏，首次 close 会被阻止并请求退出全屏，重复 close 不会重入；收到 leave-full-screen 后仅执行一次真实关闭，并请求父窗口 show/focus。普通非全屏和非 macOS 关闭仍立即沿用平台行为；应用退出通过 force destroy 可靠清理查看器。",
        "reason": "实现严格落在已接受的原生全屏直接销毁根因上。上一轮真实 Electron 对照已证明先退出查看器全屏再关闭能够恢复父窗口；本轮静态代码检查和确定性测试验证了事件顺序、单次关闭、父窗口恢复、跨平台不变性及 shutdown 边界。操作者要求停止反复运行不稳定的 GUI 自动化，因此未将失败的 GUI fixture 作为成功证据并已将其删除。",
        "evidence": [
          "runtime/arcorbit/src/work-task-image-viewer.mjs",
          "runtime/arcorbit/desktop/main.mjs",
          "runtime/arcorbit/test/work-task-image-viewer.test.mjs",
          "node --test runtime/arcorbit/test/work-task-image-viewer.test.mjs runtime/arcorbit/test/work-task-image-viewer-state.test.mjs runtime/arcorbit/test/desktop-renderer.test.mjs: 74 passed, 0 failed",
          "node --check for modified JavaScript modules: passed",
          "git diff --check: passed",
          "Previous accepted real Electron control: viewer leave-full-screen before close followed by main.show",
          "Current operator instruction: stop repeating unstable GUI runs and use static analysis if needed"
        ],
        "occurred_at": "2026-09-04T16:48:29.002Z"
      }
    }
  ],
  "content_revision": 2,
  "completion_review": {
    "status": "clean",
    "policy": {
      "initial_max_cycles": 10,
      "source": "runtime/arcorbit/config/case-policy.json",
      "snapshotted_at": "2026-09-04T15:56:47.554Z"
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
          "runtime/arcorbit/src/work-task-image-viewer.mjs: macOS 原生全屏关闭被拦截，等待 leave-full-screen 后仅放行一次真实关闭并恢复父窗口",
          "runtime/arcorbit/desktop/main.mjs: before-quit 使用 force close，避免应用退出受异步全屏转换阻塞",
          "runtime/arcorbit/test/work-task-image-viewer.test.mjs: 覆盖普通关闭、非 macOS 全屏、macOS 全屏时序与重入、shutdown 强制销毁",
          "node --test runtime/arcorbit/test/work-task-image-viewer.test.mjs runtime/arcorbit/test/work-task-image-viewer-state.test.mjs runtime/arcorbit/test/desktop-renderer.test.mjs: 74 passed, 0 failed",
          "node --check runtime/arcorbit/src/work-task-image-viewer.mjs and runtime/arcorbit/desktop/main.mjs: passed",
          "git diff --check: passed",
          "No ARC_DEBUG:fullscreen-image-viewer-close or ARCORBIT_FULLSCREEN_DIAGNOSTIC marker remains under Runtime source, Desktop, or tests",
          "FACT-20260904-004-003 accepted real Electron control: leave-full-screen before close was followed by main.show",
          "Current operator instruction permits static analysis after unstable GUI automation; no failed GUI run is claimed as passing evidence"
        ],
        "occurred_at": "2026-09-04T16:51:11.370Z"
      }
    ],
    "evidence": [
      "runtime/arcorbit/src/work-task-image-viewer.mjs: macOS 原生全屏关闭被拦截，等待 leave-full-screen 后仅放行一次真实关闭并恢复父窗口",
      "runtime/arcorbit/desktop/main.mjs: before-quit 使用 force close，避免应用退出受异步全屏转换阻塞",
      "runtime/arcorbit/test/work-task-image-viewer.test.mjs: 覆盖普通关闭、非 macOS 全屏、macOS 全屏时序与重入、shutdown 强制销毁",
      "node --test runtime/arcorbit/test/work-task-image-viewer.test.mjs runtime/arcorbit/test/work-task-image-viewer-state.test.mjs runtime/arcorbit/test/desktop-renderer.test.mjs: 74 passed, 0 failed",
      "node --check runtime/arcorbit/src/work-task-image-viewer.mjs and runtime/arcorbit/desktop/main.mjs: passed",
      "git diff --check: passed",
      "No ARC_DEBUG:fullscreen-image-viewer-close or ARCORBIT_FULLSCREEN_DIAGNOSTIC marker remains under Runtime source, Desktop, or tests",
      "FACT-20260904-004-003 accepted real Electron control: leave-full-screen before close was followed by main.show",
      "Current operator instruction permits static analysis after unstable GUI automation; no failed GUI run is claimed as passing evidence"
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
      "goal": "使用真实 Electron 原生全屏复现、窗口生命周期日志及受控关闭时序对照，确认黑屏根因和最小修复边界。",
      "outcome": "completed",
      "gap_selection": {
        "mode": "candidate",
        "basis": "当前 ArcOrbit 全屏黑屏缺陷是 Project current focus；其诊断 Gap 直接阻塞证据驱动修复，用户影响高、无依赖且由 Agent 负责。",
        "snapshot_token": "d2186de4d9adb4b0407339b157a81ca3e11d5966aa42ccdd707c859f3ee40308",
        "selected_ref": "case-gap:CASE-20260904-004:GAP-20260904-004-001",
        "comparison_summary": "选择 CASE-20260904-004 的全屏图片查看器诊断 Gap。四个 Project Gap 均需另建 Case 且不覆盖当前缺陷；仓库合并 Case 的发布安全门由人类负责且与当前窗口问题无关。",
        "fresh_discovery_summary": "Fresh state 中未出现新的 opening candidate。诊断形成了一个依赖本轮根因事实的后续修复 Gap；本轮只写回该事实与 Gap，等待 post-commit fresh-read 后再选择。",
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
            "reason": "需要独立 Case，且通用 Agent 场景验证不覆盖当前 ArcOrbit 窗口回归。"
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
            "reason": "需要独立 Case；Runtime 韧性与 adapter 工作不解释当前原生窗口关闭异常。"
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
            "reason": "需要独立 Case，且安全边界验证与当前 GUI 回归无关。"
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
            "reason": "需要独立 Case；跨记录审计不阻塞当前用户可见窗口缺陷的诊断。"
          },
          {
            "ref": "case-gap:CASE-20260901-001:GAP-20260901-001-005",
            "source": "persisted",
            "eligibility": "ready",
            "disposition": "excluded",
            "priority_basis": {
              "blocking": "blocks public push and source repository archival",
              "uncertainty": "",
              "risk": "high",
              "user_impact": ""
            },
            "reason": "这是仓库发布安全的人类责任门禁，与当前 ArcOrbit 图片查看器缺陷无关。"
          },
          {
            "ref": "case-gap:CASE-20260904-004:GAP-20260904-004-001",
            "source": "persisted",
            "eligibility": "ready",
            "disposition": "selected",
            "priority_basis": {
              "blocking": "blocks evidence-backed repair",
              "uncertainty": "root cause is not yet confirmed",
              "risk": "high because an unverified window change may cause cross-platform regressions",
              "user_impact": "fullscreen users lose the usable main window after viewing an image"
            },
            "reason": "直接服务当前用户问题，可在真实 Electron 路径复现并以运行日志确认根因。"
          }
        ]
      },
      "selected_gap": {
        "id": "GAP-20260904-004-001",
        "responsibility": "agent",
        "goal": "在真实 Electron 全屏路径稳定复现问题，并通过受控运行时日志确认关闭图片查看器导致主窗口黑屏的实际执行路径、根因和必要修复边界。",
        "reason": "静态代码能确认 parent BrowserWindow 与 Escape 关闭路径，但尚不能完整解释黑屏表现；必须区分父子窗口语义、原生全屏转换、焦点恢复和主窗口渲染状态等竞争假设后才能安全修复。",
        "derived_from": [
          "FACT-20260904-004-001",
          "FACT-20260904-004-002"
        ],
        "blocked_by": [],
        "priority_basis": {
          "blocking": "blocks evidence-backed repair",
          "uncertainty": "root cause is not yet confirmed",
          "risk": "high because an unverified window change may cause cross-platform regressions",
          "user_impact": "fullscreen users lose the usable main window after viewing an image"
        },
        "evidence_required": [
          "可重复执行的 ArcOrbit 全屏主窗口→打开图片查看器→Escape 关闭路径",
          "使用唯一标记 ARC_DEBUG:fullscreen-image-viewer-close 写入 arckit/debug/fullscreen-image-viewer-close.log 的窗口生命周期、全屏状态、焦点和渲染边界观测",
          "能够排除关键竞争假设的实际运行证据",
          "经证据确认的根因和最小修复边界"
        ]
      },
      "planned_transition": {
        "goal": "使用真实 Electron 原生全屏复现、窗口生命周期日志及受控关闭时序对照，确认黑屏根因和最小修复边界。",
        "expected_state_change": "解决诊断 Gap，接受原生全屏窗口关闭时序的根因事实，并新增一个等待 fresh-read 的实现与回归修复 Gap。"
      },
      "accepted_state_delta": {
        "resolved_gap": {
          "id": "GAP-20260904-004-001",
          "status": "resolved",
          "outcome": "真实 Electron 诊断确认：在主窗口处于 macOS 原生全屏时，图片查看器会进入同一全屏状态；直接从 Escape 销毁查看器后，主窗口逻辑状态、Renderer 和 DOM 均正常，但没有及时发生原生 main.show，窗口未重新挂回全屏 Space。先使查看器退出全屏、等待 leave-full-screen，再关闭，会触发主窗口 main.show，因此根因和必要修复边界已经确定。",
          "reason": "受控日志覆盖了直接关闭、移除 parent、fullscreenable:false、显式 show/focus、hide→show/focus，以及 leave-full-screen-before-close 对照。只有最后一种改变了关键原生事件序列并在关闭后立即恢复 main.show，足以排除 Renderer 崩溃、DOM 丢失、parent 单因、查看器 fullscreenable 配置和普通可见性恢复假设。",
          "evidence": [
            "arckit/debug/fullscreen-image-viewer-close.log",
            "Diagnostic log SHA-256: ee68d51eb07f7139b687c6ed11185ccd04d31d0075835ef294d4349ec0411640",
            "Direct-close observations: viewer.closed followed by main.focus without immediate main.show; main renderer_crashed=false, sentinel preserved, capturePage non-black",
            "Control observation: viewer.leave-full-screen at 2026-09-04T16:17:26.886Z, viewer.closed at 16:17:26.891Z, main.show at 16:17:26.998Z",
            "runtime/arcorbit/src/work-task-image-viewer.mjs",
            "runtime/arcorbit/desktop/image-viewer/renderer.js"
          ]
        },
        "facts_added": [
          {
            "id": "FACT-20260904-004-003",
            "revision": 1,
            "status": "accepted",
            "statement": "在 macOS 原生全屏主窗口中打开 ArcOrbit 图片查看器时，查看器会进入全屏窗口状态。Escape 当前直接销毁仍处于该状态的查看器，导致主窗口虽然保持 full_screen=true、Renderer 存活且 DOM 内容完整，却未在关闭后重新收到原生 show 并重新挂回全屏 Space。先让查看器退出全屏、等待 leave-full-screen，再关闭，会立即产生 main.show；因此缺陷根因是原生全屏查看器的直接销毁时序，而不是主 Renderer 崩溃、DOM 丢失、parent 关系本身或普通 focus 恢复失败。",
            "basis": "真实 Electron/macOS 运行日志与多组受控对照完整匹配用户报告的触发条件、状态变化、发生位置和时序。",
            "evidence": [
              "arckit/debug/fullscreen-image-viewer-close.log",
              "Diagnostic log SHA-256: ee68d51eb07f7139b687c6ed11185ccd04d31d0075835ef294d4349ec0411640",
              "runtime/arcorbit/src/work-task-image-viewer.mjs",
              "runtime/arcorbit/desktop/image-viewer/renderer.js"
            ]
          }
        ],
        "facts_superseded": [],
        "impacts_added": [],
        "impacts_updated": [
          {
            "id": "IMPACT-20260904-004-001",
            "fact_id": "FACT-20260904-004-001",
            "fact_revision": 1,
            "target": {
              "kind": "software_decision",
              "ref": "experience_and_interaction",
              "revision": 65
            },
            "effect": "threatened",
            "reason": "诊断已确认当前 Escape 关闭时序会使全屏主窗口脱离可见呈现；在实现并验证先退出查看器全屏再关闭的安全时序前，已接受的主窗口交互连续性仍未实现。",
            "gap_ids": [
              "GAP-20260904-004-002"
            ],
            "evidence": [
              "Current operator input, 2026-09-04",
              "arckit/debug/fullscreen-image-viewer-close.log",
              "local:fact:fullscreen-viewer-native-space-root-cause"
            ]
          }
        ],
        "gaps_added": [
          {
            "id": "GAP-20260904-004-002",
            "status": "open",
            "goal": "实现图片查看器的原生全屏安全关闭时序，并以单元和真实 Electron 回归证明 Escape 只关闭查看器、全屏主窗口保持可见、内容完整且可交互。",
            "reason": "本轮诊断证明直接销毁仍处于原生全屏状态的查看器会跳过主窗口恢复呈现；修复需要在查看器关闭边界处理 leave-full-screen、关闭重入和应用退出，并防止普通非全屏及跨平台行为回归。",
            "derived_from": [
              "FACT-20260904-004-001",
              "FACT-20260904-004-003"
            ],
            "blocked_by": [],
            "priority_basis": {
              "blocking": "blocks resolution of the current user-visible defect",
              "uncertainty": "low; implementation and shutdown reentrancy still require verification",
              "risk": "high if native fullscreen close ordering or application shutdown is mishandled",
              "user_impact": "restores the ArcOrbit main window after closing an image viewer in fullscreen"
            },
            "responsibility": "agent",
            "evidence_required": [
              "图片查看器全屏关闭边界的最小实现及关闭重入保护",
              "普通非全屏关闭与应用退出路径的聚焦单元回归",
              "真实 Electron/macOS 全屏主窗口→图片查看器→Escape 回归，证明查看器关闭后主窗口发生 show、保持 full_screen=true 且 Renderer/DOM 正常",
              "移除 ARC_DEBUG:fullscreen-image-viewer-close 临时日志及全部诊断 marker 的清理检查"
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
          "arckit/debug/fullscreen-image-viewer-close.log",
          "runtime/arcorbit/src/work-task-image-viewer.mjs",
          "runtime/arcorbit/desktop/image-viewer/renderer.js"
        ]
      },
      "invariant_assessment": {
        "project_revision": 344,
        "judgments": [
          {
            "invariant_ref": "product-expectations-remain-recoverable",
            "disposition": "not_relevant",
            "reason": "本轮只确认既有用户期望所对应的技术根因，没有建立或修改产品范围、能力或业务规则。",
            "fact_refs": [],
            "evidence": [],
            "gap_refs": []
          },
          {
            "invariant_ref": "interaction-expectations-remain-recoverable",
            "disposition": "upheld",
            "reason": "用户路径、实际异常和“Escape 只关闭查看器、主窗口不受影响”的期望均已由当前 Case 清晰保存，诊断没有改变该交互语义。",
            "fact_refs": [
              "FACT-20260904-004-001",
              "FACT-20260904-004-003"
            ],
            "evidence": [
              "arckit/cases/active/CASE-20260904-004-development-case.md",
              "Current operator input, 2026-09-04"
            ],
            "gap_refs": []
          },
          {
            "invariant_ref": "visual-language-remains-consistent",
            "disposition": "not_relevant",
            "reason": "根因和后续修复边界只涉及原生窗口生命周期，不建立或修改主题、组件样式或视觉语言规则。",
            "fact_refs": [],
            "evidence": [],
            "gap_refs": []
          },
          {
            "invariant_ref": "technical-decisions-remain-explainable",
            "disposition": "upheld",
            "reason": "真实 Electron 日志已把 Renderer 状态、窗口全屏状态、直接关闭时序和安全对照之间的关系完整记录，必要修复边界可追溯且可解释。",
            "fact_refs": [
              "FACT-20260904-004-003"
            ],
            "evidence": [
              "arckit/debug/fullscreen-image-viewer-close.log",
              "runtime/arcorbit/src/work-task-image-viewer.mjs",
              "runtime/arcorbit/desktop/image-viewer/renderer.js"
            ],
            "gap_refs": []
          },
          {
            "invariant_ref": "accepted-facts-are-realized",
            "disposition": "threatened",
            "reason": "当前实现仍在 Escape 时直接关闭图片查看器，尚未实现已接受的“主窗口不受影响”事实；后续修复 Gap 将实现并验证该结果。",
            "fact_refs": [
              "FACT-20260904-004-001",
              "FACT-20260904-004-003"
            ],
            "evidence": [
              "runtime/arcorbit/desktop/image-viewer/renderer.js",
              "arckit/debug/fullscreen-image-viewer-close.log"
            ],
            "gap_refs": [
              "GAP-20260904-004-002"
            ]
          },
          {
            "invariant_ref": "material-risks-have-credible-evidence",
            "disposition": "upheld",
            "reason": "黑屏风险及其根因由可重复的真实 Electron 路径、受控窗口状态日志和排除竞争假设的对照结果支持；没有把尚未实施的修复声明为已完成。",
            "fact_refs": [
              "FACT-20260904-004-001",
              "FACT-20260904-004-003"
            ],
            "evidence": [
              "arckit/debug/fullscreen-image-viewer-close.log",
              "Diagnostic log SHA-256: ee68d51eb07f7139b687c6ed11185ccd04d31d0075835ef294d4349ec0411640"
            ],
            "gap_refs": []
          }
        ]
      },
      "evidence": [
        "arckit/debug/fullscreen-image-viewer-close.log",
        "Diagnostic log: 140 records, 49,996 bytes",
        "Diagnostic log SHA-256: ee68d51eb07f7139b687c6ed11185ccd04d31d0075835ef294d4349ec0411640",
        "runtime/arcorbit/src/work-task-image-viewer.mjs",
        "runtime/arcorbit/desktop/image-viewer/renderer.js",
        "Temporary diagnostic fixture removed; no ARC_DEBUG or ARCORBIT_FULLSCREEN_DIAGNOSTIC marker remains under runtime/arcorbit source or tests",
        "git diff --check: passed"
      ],
      "runtime_result_ref": "arckit-runtime://runs/RUN-20260904-160944406Z-fdbbb96a",
      "occurred_at": "2026-09-04T16:27:23.065Z"
    },
    {
      "round": 2,
      "transition_schema_version": "arckit-case-transition/v8",
      "goal": "在图片查看器的主进程所有权边界实现 macOS 原生全屏安全关闭、关闭重入保护、父窗口恢复和应用退出强制销毁，并完成聚焦回归与清理检查。",
      "outcome": "completed",
      "gap_selection": {
        "mode": "candidate",
        "basis": "GAP-20260904-004-002 直接阻塞当前 Project focus 和用户可见缺陷；根因已由上一轮真实 Electron 证据接受，修复对象、边界及验证方式均已明确，且由 Agent 负责。",
        "snapshot_token": "be10a6fa929365dc953c6173b325edfacbe0e43ed1f4c115b6480e1ae842fd2e",
        "selected_ref": "case-gap:CASE-20260904-004:GAP-20260904-004-002",
        "comparison_summary": "选择 CASE-20260904-004 的全屏图片查看器修复 Gap。四个 Project Gap 均需独立 Case且不覆盖当前缺陷；CASE-20260901-001 的发布安全门属于人类责任并与窗口修复无关。",
        "fresh_discovery_summary": "本轮未发现需要替代 persisted selection 的 fresh candidate。GUI 自动化中的事件观察不稳定没有形成新的产品缺陷；按操作者指示改用已接受的真实诊断证据、静态代码分析和确定性单元回归完成当前修复验证。",
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
            "reason": "需要独立 Case，通用 Agent 场景验证不覆盖当前窗口缺陷。"
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
            "reason": "需要独立 Case，Runtime 韧性与 adapter 工作不阻塞当前图片查看器修复。"
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
            "reason": "需要独立 Case，安全边界验证与当前 GUI 回归无关。"
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
            "reason": "需要独立 Case，跨记录审计不阻塞当前用户可见缺陷。"
          },
          {
            "ref": "case-gap:CASE-20260901-001:GAP-20260901-001-005",
            "source": "persisted",
            "eligibility": "ready",
            "disposition": "excluded",
            "priority_basis": {
              "blocking": "blocks public push and source repository archival",
              "uncertainty": "",
              "risk": "high",
              "user_impact": ""
            },
            "reason": "属于仓库发布安全的人类责任门禁，与当前 ArcOrbit 窗口修复无关。"
          },
          {
            "ref": "case-gap:CASE-20260904-004:GAP-20260904-004-002",
            "source": "persisted",
            "eligibility": "ready",
            "disposition": "selected",
            "priority_basis": {
              "blocking": "blocks resolution of the current user-visible defect",
              "uncertainty": "low; implementation and shutdown reentrancy still require verification",
              "risk": "high if native fullscreen close ordering or application shutdown is mishandled",
              "user_impact": "restores the ArcOrbit main window after closing an image viewer in fullscreen"
            },
            "reason": "根因和修复边界已由 accepted facts 确定，可直接实现并以确定性回归验证。"
          }
        ]
      },
      "selected_gap": {
        "id": "GAP-20260904-004-002",
        "responsibility": "agent",
        "goal": "实现图片查看器的原生全屏安全关闭时序，并以单元和真实 Electron 回归证明 Escape 只关闭查看器、全屏主窗口保持可见、内容完整且可交互。",
        "reason": "本轮诊断证明直接销毁仍处于原生全屏状态的查看器会跳过主窗口恢复呈现；修复需要在查看器关闭边界处理 leave-full-screen、关闭重入和应用退出，并防止普通非全屏及跨平台行为回归。",
        "derived_from": [
          "FACT-20260904-004-001",
          "FACT-20260904-004-003"
        ],
        "blocked_by": [],
        "priority_basis": {
          "blocking": "blocks resolution of the current user-visible defect",
          "uncertainty": "low; implementation and shutdown reentrancy still require verification",
          "risk": "high if native fullscreen close ordering or application shutdown is mishandled",
          "user_impact": "restores the ArcOrbit main window after closing an image viewer in fullscreen"
        },
        "evidence_required": [
          "图片查看器全屏关闭边界的最小实现及关闭重入保护",
          "普通非全屏关闭与应用退出路径的聚焦单元回归",
          "真实 Electron/macOS 全屏主窗口→图片查看器→Escape 回归，证明查看器关闭后主窗口发生 show、保持 full_screen=true 且 Renderer/DOM 正常",
          "移除 ARC_DEBUG:fullscreen-image-viewer-close 临时日志及全部诊断 marker 的清理检查"
        ]
      },
      "planned_transition": {
        "goal": "在图片查看器的主进程所有权边界实现 macOS 原生全屏安全关闭、关闭重入保护、父窗口恢复和应用退出强制销毁，并完成聚焦回归与清理检查。",
        "expected_state_change": "解决 GAP-20260904-004-002，使 Escape 关闭全屏图片查看器不再直接销毁原生全屏窗口，相关交互影响由 threatened 更新为 upheld。"
      },
      "accepted_state_delta": {
        "resolved_gap": {
          "id": "GAP-20260904-004-002",
          "status": "resolved",
          "outcome": "图片查看器现在由主进程统一控制关闭顺序：macOS 下若查看器仍处于原生全屏，首次 close 会被阻止并请求退出全屏，重复 close 不会重入；收到 leave-full-screen 后仅执行一次真实关闭，并请求父窗口 show/focus。普通非全屏和非 macOS 关闭仍立即沿用平台行为；应用退出通过 force destroy 可靠清理查看器。",
          "reason": "实现严格落在已接受的原生全屏直接销毁根因上。上一轮真实 Electron 对照已证明先退出查看器全屏再关闭能够恢复父窗口；本轮静态代码检查和确定性测试验证了事件顺序、单次关闭、父窗口恢复、跨平台不变性及 shutdown 边界。操作者要求停止反复运行不稳定的 GUI 自动化，因此未将失败的 GUI fixture 作为成功证据并已将其删除。",
          "evidence": [
            "runtime/arcorbit/src/work-task-image-viewer.mjs",
            "runtime/arcorbit/desktop/main.mjs",
            "runtime/arcorbit/test/work-task-image-viewer.test.mjs",
            "node --test runtime/arcorbit/test/work-task-image-viewer.test.mjs runtime/arcorbit/test/work-task-image-viewer-state.test.mjs runtime/arcorbit/test/desktop-renderer.test.mjs: 74 passed, 0 failed",
            "node --check for modified JavaScript modules: passed",
            "git diff --check: passed",
            "Previous accepted real Electron control: viewer leave-full-screen before close followed by main.show",
            "Current operator instruction: stop repeating unstable GUI runs and use static analysis if needed"
          ]
        },
        "facts_added": [
          {
            "id": "FACT-20260904-004-004",
            "revision": 1,
            "status": "accepted",
            "statement": "ArcOrbit 图片查看器的关闭所有权已由主进程实现为平台受控状态机：仅在 macOS 原生全屏时阻止直接 close，等待 leave-full-screen 后放行一次真实关闭并恢复父窗口；重复 close 不会重复请求退出全屏，应用退出可绕过等待并强制销毁。普通非全屏和非 macOS 关闭行为保持不变。",
            "basis": "实现 diff、已接受的真实 Electron 根因对照、聚焦单元测试、Desktop 回归和静态清理检查共同证明修复边界。",
            "evidence": [
              "runtime/arcorbit/src/work-task-image-viewer.mjs",
              "runtime/arcorbit/desktop/main.mjs",
              "runtime/arcorbit/test/work-task-image-viewer.test.mjs",
              "74 focused tests passed, 0 failed",
              "No ARC_DEBUG:fullscreen-image-viewer-close or ARCORBIT_FULLSCREEN_DIAGNOSTIC marker remains"
            ]
          }
        ],
        "facts_superseded": [],
        "impacts_added": [],
        "impacts_updated": [
          {
            "id": "IMPACT-20260904-004-001",
            "fact_id": "FACT-20260904-004-001",
            "fact_revision": 1,
            "target": {
              "kind": "software_decision",
              "ref": "experience_and_interaction",
              "revision": 65
            },
            "effect": "upheld",
            "reason": "图片查看器的 Escape/窗口关闭现在先安全退出 macOS 原生全屏，再完成单次关闭并恢复父窗口；普通与跨平台路径保持原有行为，因此已接受的主窗口显示和交互连续性得到实现。",
            "gap_ids": [],
            "evidence": [
              "local:fact:fullscreen-viewer-safe-close-realized",
              "runtime/arcorbit/src/work-task-image-viewer.mjs",
              "runtime/arcorbit/test/work-task-image-viewer.test.mjs",
              "74 focused tests passed, 0 failed"
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
          "runtime/arcorbit/src/work-task-image-viewer.mjs",
          "runtime/arcorbit/desktop/main.mjs",
          "runtime/arcorbit/test/work-task-image-viewer.test.mjs"
        ]
      },
      "invariant_assessment": {
        "project_revision": 344,
        "judgments": [
          {
            "invariant_ref": "product-expectations-remain-recoverable",
            "disposition": "not_relevant",
            "reason": "本轮实现既有缺陷修复，不建立或修改产品范围、能力集合或业务规则。",
            "fact_refs": [],
            "evidence": [],
            "gap_refs": []
          },
          {
            "invariant_ref": "interaction-expectations-remain-recoverable",
            "disposition": "upheld",
            "reason": "Escape 只关闭图片查看器、全屏主窗口保持连续的交互预期已由 Case 保存，并由主进程关闭状态机和回归测试实现。",
            "fact_refs": [
              "FACT-20260904-004-001",
              "FACT-20260904-004-003",
              "FACT-20260904-004-004"
            ],
            "evidence": [
              "arckit/cases/active/CASE-20260904-004-development-case.md",
              "runtime/arcorbit/src/work-task-image-viewer.mjs",
              "runtime/arcorbit/test/work-task-image-viewer.test.mjs"
            ],
            "gap_refs": []
          },
          {
            "invariant_ref": "visual-language-remains-consistent",
            "disposition": "not_relevant",
            "reason": "修复仅改变原生窗口生命周期，不改变主题、布局、组件呈现或视觉规则。",
            "fact_refs": [],
            "evidence": [],
            "gap_refs": []
          },
          {
            "invariant_ref": "technical-decisions-remain-explainable",
            "disposition": "upheld",
            "reason": "平台条件、关闭拦截、全屏退出、重入保护、父窗口恢复和 shutdown 强制销毁均显式位于图片查看器主进程所有权边界，技术关系可从代码和测试直接恢复。",
            "fact_refs": [
              "FACT-20260904-004-003",
              "FACT-20260904-004-004"
            ],
            "evidence": [
              "runtime/arcorbit/src/work-task-image-viewer.mjs",
              "runtime/arcorbit/desktop/main.mjs",
              "runtime/arcorbit/test/work-task-image-viewer.test.mjs"
            ],
            "gap_refs": []
          },
          {
            "invariant_ref": "accepted-facts-are-realized",
            "disposition": "upheld",
            "reason": "当前实现不再在 macOS 原生全屏状态直接销毁图片查看器，并通过单次关闭、父窗口恢复、普通关闭、跨平台与 shutdown 测试实现相关 accepted facts。",
            "fact_refs": [
              "FACT-20260904-004-001",
              "FACT-20260904-004-003",
              "FACT-20260904-004-004"
            ],
            "evidence": [
              "runtime/arcorbit/src/work-task-image-viewer.mjs",
              "runtime/arcorbit/desktop/main.mjs",
              "node --test focused suite: 74 passed, 0 failed"
            ],
            "gap_refs": []
          },
          {
            "invariant_ref": "material-risks-have-credible-evidence",
            "disposition": "upheld",
            "reason": "原生全屏时序风险由上一轮已接受的真实 Electron 对照定位；本轮以静态实现检查和确定性测试控制关闭重入、跨平台和应用退出风险，并明确未把不稳定 GUI 自动化声明为通过。",
            "fact_refs": [
              "FACT-20260904-004-003",
              "FACT-20260904-004-004"
            ],
            "evidence": [
              "Previous accepted diagnostic log SHA-256: ee68d51eb07f7139b687c6ed11185ccd04d31d0075835ef294d4349ec0411640",
              "runtime/arcorbit/test/work-task-image-viewer.test.mjs",
              "74 focused tests passed, 0 failed",
              "Current operator instruction to use static analysis after unstable GUI runs"
            ],
            "gap_refs": []
          }
        ]
      },
      "evidence": [
        "runtime/arcorbit/src/work-task-image-viewer.mjs",
        "runtime/arcorbit/desktop/main.mjs",
        "runtime/arcorbit/test/work-task-image-viewer.test.mjs",
        "node --test runtime/arcorbit/test/work-task-image-viewer.test.mjs runtime/arcorbit/test/work-task-image-viewer-state.test.mjs runtime/arcorbit/test/desktop-renderer.test.mjs: 74 passed, 0 failed",
        "node --check modified modules: passed",
        "git diff --check: passed",
        "Temporary diagnostic log and unsuccessful GUI fixture removed",
        "No ARC_DEBUG:fullscreen-image-viewer-close or ARCORBIT_FULLSCREEN_DIAGNOSTIC marker remains"
      ],
      "runtime_result_ref": "arckit-runtime://runs/RUN-20260904-160944406Z-fdbbb96a",
      "occurred_at": "2026-09-04T16:48:29.002Z"
    },
    {
      "round": 3,
      "transition_schema_version": "arckit-case-transition/v8",
      "goal": "审查已完成实现的正确性、真实问题解决、验证可信度、回归风险和最小性。",
      "outcome": "completed",
      "gap_selection": {
        "mode": "candidate",
        "basis": "CASE-20260904-004 的普通 Gap 与 state impact 已全部闭合，Completion Review 是当前 Case 唯一剩余门禁，直接阻塞缺陷 Case 完成且用户影响和风险均高。",
        "snapshot_token": "de3f79b7d1a037b85c8d1b5d6cd0129e7784206e21d70d51fb2f6c74a895698c",
        "selected_ref": "case-gap:CASE-20260904-004:CASE-20260904-004:completion-review:1",
        "comparison_summary": "选择 CASE-20260904-004 的 Completion Review。四个 Project Gap 需要独立 Case；CASE-20260901-001 的发布安全门属于人类责任且不覆盖当前全屏缺陷。",
        "fresh_discovery_summary": "审查当前实现、调用点、测试和清理状态后，未发现需要作为 fresh candidate 提交的错误、遗漏或多余改动。",
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
            "reason": "需要独立 Case，且通用 Agent 场景验证不属于当前缺陷的完成审查。"
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
            "reason": "需要独立 Case；Runtime 韧性和 adapter 验收不覆盖图片查看器原生窗口关闭。"
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
            "reason": "需要独立 Case，且真实权限项目安全验证与当前窗口缺陷无关。"
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
            "reason": "需要独立 Case；跨记录审计不阻塞当前实现的完成审查。"
          },
          {
            "ref": "case-gap:CASE-20260901-001:GAP-20260901-001-005",
            "source": "persisted",
            "eligibility": "ready",
            "disposition": "excluded",
            "priority_basis": {
              "blocking": "blocks public push and source repository archival",
              "uncertainty": "",
              "risk": "high",
              "user_impact": ""
            },
            "reason": "这是另一 Case 的人类责任发布安全门，不覆盖 ArcOrbit 图片查看器缺陷。"
          },
          {
            "ref": "case-gap:CASE-20260904-004:CASE-20260904-004:completion-review:1",
            "source": "persisted",
            "eligibility": "ready",
            "disposition": "selected",
            "priority_basis": {
              "blocking": "high",
              "uncertainty": "low",
              "risk": "high",
              "user_impact": "high"
            },
            "reason": "当前 Case 的普通工作和影响均已闭合，必须完成五维独立语义审查才能判断真实完成。"
          }
        ]
      },
      "selected_gap": {
        "id": "CASE-20260904-004:completion-review:1",
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
        "goal": "审查已完成实现的正确性、真实问题解决、验证可信度、回归风险和最小性。",
        "expected_state_change": "记录 clean Completion Review；若 Trusted Ledger 接受，则 CASE-20260904-004 满足完成条件。"
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
            "runtime/arcorbit/src/work-task-image-viewer.mjs: macOS 原生全屏关闭被拦截，等待 leave-full-screen 后仅放行一次真实关闭并恢复父窗口",
            "runtime/arcorbit/desktop/main.mjs: before-quit 使用 force close，避免应用退出受异步全屏转换阻塞",
            "runtime/arcorbit/test/work-task-image-viewer.test.mjs: 覆盖普通关闭、非 macOS 全屏、macOS 全屏时序与重入、shutdown 强制销毁",
            "node --test runtime/arcorbit/test/work-task-image-viewer.test.mjs runtime/arcorbit/test/work-task-image-viewer-state.test.mjs runtime/arcorbit/test/desktop-renderer.test.mjs: 74 passed, 0 failed",
            "node --check runtime/arcorbit/src/work-task-image-viewer.mjs and runtime/arcorbit/desktop/main.mjs: passed",
            "git diff --check: passed",
            "No ARC_DEBUG:fullscreen-image-viewer-close or ARCORBIT_FULLSCREEN_DIAGNOSTIC marker remains under Runtime source, Desktop, or tests",
            "FACT-20260904-004-003 accepted real Electron control: leave-full-screen before close was followed by main.show",
            "Current operator instruction permits static analysis after unstable GUI automation; no failed GUI run is claimed as passing evidence"
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
        "project_revision": 344,
        "judgments": [
          {
            "invariant_ref": "product-expectations-remain-recoverable",
            "disposition": "not_relevant",
            "reason": "Completion Review 未建立或修改产品范围、能力集合、业务规则或验收含义。",
            "fact_refs": [],
            "evidence": [],
            "gap_refs": []
          },
          {
            "invariant_ref": "interaction-expectations-remain-recoverable",
            "disposition": "upheld",
            "reason": "“Escape 只关闭查看器、全屏主窗口保持连续”的交互预期在 Case 中可恢复，并由审查通过的关闭状态机及测试兑现。",
            "fact_refs": [
              "FACT-20260904-004-001",
              "FACT-20260904-004-004"
            ],
            "evidence": [
              "arckit/cases/active/CASE-20260904-004-development-case.md",
              "runtime/arcorbit/src/work-task-image-viewer.mjs",
              "runtime/arcorbit/test/work-task-image-viewer.test.mjs"
            ],
            "gap_refs": []
          },
          {
            "invariant_ref": "visual-language-remains-consistent",
            "disposition": "not_relevant",
            "reason": "实现和审查仅涉及原生窗口生命周期，没有改变主题、布局、组件呈现或视觉规则。",
            "fact_refs": [],
            "evidence": [],
            "gap_refs": []
          },
          {
            "invariant_ref": "technical-decisions-remain-explainable",
            "disposition": "upheld",
            "reason": "平台判断、全屏退出等待、关闭重入保护、父窗口恢复和 shutdown 强制销毁均显式位于主进程图片查看器边界，可从实现与测试直接恢复。",
            "fact_refs": [
              "FACT-20260904-004-003",
              "FACT-20260904-004-004"
            ],
            "evidence": [
              "runtime/arcorbit/src/work-task-image-viewer.mjs",
              "runtime/arcorbit/desktop/main.mjs",
              "runtime/arcorbit/test/work-task-image-viewer.test.mjs"
            ],
            "gap_refs": []
          },
          {
            "invariant_ref": "accepted-facts-are-realized",
            "disposition": "upheld",
            "reason": "静态审查确认实现精确处理已接受的原生全屏直接销毁根因；确定性回归证明安全关闭、单次恢复、跨平台不变性和退出清理。",
            "fact_refs": [
              "FACT-20260904-004-001",
              "FACT-20260904-004-003",
              "FACT-20260904-004-004"
            ],
            "evidence": [
              "runtime/arcorbit/src/work-task-image-viewer.mjs",
              "runtime/arcorbit/desktop/main.mjs",
              "node --test focused suite: 74 passed, 0 failed"
            ],
            "gap_refs": []
          },
          {
            "invariant_ref": "material-risks-have-credible-evidence",
            "disposition": "upheld",
            "reason": "真实 Electron 对照已定位原生时序风险；本轮复核代码和确定性测试后未发现未控制的关闭重入、跨平台或 shutdown 风险，并明确未把不稳定 GUI 自动化作为通过证据。",
            "fact_refs": [
              "FACT-20260904-004-003",
              "FACT-20260904-004-004"
            ],
            "evidence": [
              "arckit/cases/active/CASE-20260904-004-development-case.md",
              "Diagnostic log SHA-256: ee68d51eb07f7139b687c6ed11185ccd04d31d0075835ef294d4349ec0411640",
              "runtime/arcorbit/test/work-task-image-viewer.test.mjs",
              "74 focused tests passed, 0 failed"
            ],
            "gap_refs": []
          }
        ]
      },
      "evidence": [
        "runtime/arcorbit/src/work-task-image-viewer.mjs",
        "runtime/arcorbit/desktop/main.mjs",
        "runtime/arcorbit/test/work-task-image-viewer.test.mjs",
        "node --test focused suite: 74 passed, 0 failed",
        "node --check modified modules: passed",
        "git diff --check: passed",
        "diagnostic marker cleanup check: passed"
      ],
      "runtime_result_ref": "arckit-runtime://runs/RUN-20260904-160944406Z-fdbbb96a",
      "occurred_at": "2026-09-04T16:51:11.370Z"
    }
  ],
  "case_resolution": {
    "status": "resolved",
    "stage": "resolved",
    "satisfied": [
      "GAP-20260904-004-001",
      "GAP-20260904-004-002"
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
    "updated_at": "2026-09-04T16:51:11.370Z"
  }
}
```

## Round Notes

- Case history is canonical in Structured Record.rounds; keep prose notes exceptional.
