# Stabilize ArcOrbit Today detail rendering across background refreshes

Case: CASE-20260904-002
Status: closed
Artifact Type: code
Selected Gap: none
Updated: 2026-09-04T07:27:46.431Z

## User Intent

修复 ArcOrbit Today 页面第三栏详情在后台状态刷新时反复重绘并滚动到顶部的问题，确保修复落在正确的渲染生命周期和界面状态所有权边界。

## Structured Record

```json
{
  "schema_version": "development-case-record/v5",
  "id": "CASE-20260904-002",
  "title": "Stabilize ArcOrbit Today detail rendering across background refreshes",
  "status": "closed",
  "artifact_type": "code",
  "created_at": "2026-09-04T07:05:26.432Z",
  "updated_at": "2026-09-04T07:27:46.431Z",
  "user_intent": "修复 ArcOrbit Today 页面第三栏详情在后台状态刷新时反复重绘并滚动到顶部的问题，确保修复落在正确的渲染生命周期和界面状态所有权边界。",
  "expected_outcome": "Today 后台快照、Work Sync、Automation 或 Chat 更新不会重置未变更责任项的详情滚动位置及临时交互上下文；切换到不同责任项时仍正确呈现新详情，并由回归测试覆盖。",
  "project_state_ref": "arckit/project/state.record.json",
  "current_round": {
    "goal": "",
    "selected_gap": null
  },
  "facts": [
    {
      "id": "FACT-20260904-002-001",
      "revision": 1,
      "status": "superseded",
      "statement": "ArcOrbit Today 页面第三栏详情会反复重新刷新并重新定位到顶部，用户要求从架构边界上正确修复。",
      "basis": "当前操作者直接报告定义了实际症状、受影响表面和修复质量要求。",
      "evidence": [
        "Current operator input, 2026-09-04"
      ]
    },
    {
      "id": "FACT-20260904-002-002",
      "revision": 1,
      "status": "superseded",
      "statement": "Today 的定时及事件驱动后台刷新会进入 refreshSnapshot/render；renderToday 随后无条件重写 todayOperator.innerHTML，销毁并重建持有滚动状态的 .today-operator-scroll 节点。该确定性路径完整解释了详情视觉刷新和 scrollTop 回到顶部。",
      "basis": "源码中的 30 秒刷新、Work Sync/Automation/Chat 刷新入口、render 调用链、无条件 innerHTML 替换和滚动容器 CSS 共同形成完整因果链；Feedback Inspector 的身份感知 scrollTop 恢复实现提供了同仓对照。",
      "evidence": [
        "runtime/arcorbit/desktop/renderer/renderer.js",
        "runtime/arcorbit/desktop/renderer/styles.css",
        "runtime/arcorbit/desktop/renderer/index.html",
        "runtime/arcorbit/test/desktop-renderer.test.mjs"
      ]
    },
    {
      "id": "FACT-20260904-002-003",
      "revision": 1,
      "status": "accepted",
      "statement": "ArcOrbit Today 操作台现在以 mode 和责任项 identity 作为详情上下文；未变化后台投影保持现有 DOM，同一上下文的内容更新保持滚动、焦点和文本选区，切换上下文从新详情顶部开始，草稿和最新动作绑定不依赖详情 DOM 重建。",
      "basis": "Keyed Detail Surface 实现、Today Renderer 接入、稳定交互事实源以及行为级和完整 ArcOrbit 回归共同证明当前状态。",
      "evidence": [
        "runtime/arcorbit/desktop/renderer/keyed-detail-surface.mjs",
        "runtime/arcorbit/desktop/renderer/renderer.js",
        "runtime/arcorbit/test/keyed-detail-surface.test.mjs",
        "runtime/arcorbit/test/desktop-renderer.test.mjs",
        "arckit/interaction/today-workspace/interaction.md",
        "focused regression: 77 passed",
        "full executable regression: 571 passed"
      ]
    }
  ],
  "state_impacts": [
    {
      "id": "IMPACT-20260904-002-001",
      "fact_id": "FACT-20260904-002-003",
      "fact_revision": 1,
      "target": {
        "kind": "software_decision",
        "ref": "experience_and_interaction",
        "revision": 65
      },
      "effect": "upheld",
      "reason": "Today 的后台读取与实时更新现在保持仍有效责任项的阅读、输入和选择连续性，真实责任切换则明确建立新的详情上下文。",
      "gap_ids": [],
      "evidence": [
        "arckit/interaction/today-workspace/interaction.md",
        "runtime/arcorbit/desktop/renderer/keyed-detail-surface.mjs",
        "runtime/arcorbit/desktop/renderer/renderer.js",
        "runtime/arcorbit/test/keyed-detail-surface.test.mjs"
      ]
    }
  ],
  "gaps": [
    {
      "id": "GAP-20260904-002-001",
      "status": "resolved",
      "goal": "建立身份感知的 Today 第三栏渲染边界，使同一责任项的后台数据刷新不会重置滚动和临时交互上下文，同时保证责任项身份变化时正确更新详情。",
      "reason": "根因已经由确定性源码路径确认；需要在详情表面生命周期和 UI 状态所有权边界修复，而不是仅用延迟、禁止刷新或无条件 scrollTop 回写掩盖重建问题。",
      "derived_from": [
        "FACT-20260904-002-001",
        "FACT-20260904-002-002"
      ],
      "blocked_by": [],
      "priority_basis": {
        "blocking": "blocks reliable use of long Today responsibility details",
        "uncertainty": "low; root cause is deterministically established",
        "risk": "medium; renderer changes can affect selection, drafts, focus and action wiring",
        "user_impact": "high; repeated background refresh interrupts reading and returns users to the top"
      },
      "responsibility": "agent",
      "evidence_required": [
        "Regression proving a background Today refresh preserves the selected detail scroll position",
        "Regression proving a genuine responsibility-item change renders the new detail with correct initial context",
        "Verification that Today drafts, action wiring and current selection behavior remain intact",
        "Focused ArcOrbit renderer and Today workspace tests pass",
        "No temporary debug marker or diagnostic log remains"
      ],
      "resolution": {
        "id": "GAP-20260904-002-001",
        "status": "resolved",
        "outcome": "Today 第三栏已采用身份感知详情生命周期：相同责任且投影未变化时不替换 DOM，相同责任内容更新时恢复滚动、焦点和文本选区，责任身份变化时从新详情顶部开始；草稿值独立于 HTML 投影，动作处理器持续绑定最新责任事实。",
        "reason": "修复落在详情表面身份和瞬时 UI 状态所有权边界，消除了后台 refreshSnapshot/render 的无条件 remount 根因，同时保留真实数据更新和责任切换语义。",
        "evidence": [
          "runtime/arcorbit/desktop/renderer/keyed-detail-surface.mjs",
          "runtime/arcorbit/desktop/renderer/renderer.js",
          "runtime/arcorbit/test/keyed-detail-surface.test.mjs",
          "runtime/arcorbit/test/desktop-renderer.test.mjs",
          "arckit/interaction/today-workspace/interaction.md",
          "node --test runtime/arcorbit/test/keyed-detail-surface.test.mjs runtime/arcorbit/test/today-workspace.test.mjs runtime/arcorbit/test/desktop-renderer.test.mjs: 77 passed, 0 failed",
          "npm test --workspace @arckit/arcorbit plus sandbox-external Electron rerun: 571 executed tests passed, 24 explicitly skipped",
          "node --check renderer modules: passed",
          "git diff --check: passed",
          "temporary debug marker search: no matches"
        ],
        "occurred_at": "2026-09-04T07:16:35.021Z"
      }
    },
    {
      "id": "CASE-20260904-002:review-finding:FINDING-20260904-002-001",
      "status": "resolved",
      "goal": "Resolve review finding: 同一 Today 责任项的 HTML 投影变化时，Keyed Detail Surface 会先在值为空的新 textarea 上恢复焦点和选区；随后 wireTodayOperatorDraft 因该节点已是 document.activeElement 而跳过从 state.todayDrafts 回填，导致草稿在界面中变空、选区归零，并可能被下一次输入覆盖。现有测试桩没有模拟 textarea 值长度和浏览器 selection clamp，因此未捕获该路径。",
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
        "runtime/arcorbit/desktop/renderer/keyed-detail-surface.mjs",
        "runtime/arcorbit/desktop/renderer/renderer.js",
        "runtime/arcorbit/test/keyed-detail-surface.test.mjs",
        "runtime/arcorbit/desktop/renderer/keyed-detail-surface.mjs:22-29 restores focus and selection immediately after replacing host.innerHTML",
        "runtime/arcorbit/desktop/renderer/renderer.js:1851 creates the replacement textarea without its persisted draft value",
        "runtime/arcorbit/desktop/renderer/renderer.js:1933-1941 skips draft assignment when the replacement textarea is already document.activeElement",
        "runtime/arcorbit/test/keyed-detail-surface.test.mjs:33-45 models neither textarea value nor selection clamping",
        "read-only behavior probe reproduces {\"value\":\"\",\"selectionStart\":0,\"selectionEnd\":0,\"isActive\":true} after a same-context HTML change"
      ],
      "resolution": {
        "id": "CASE-20260904-002:review-finding:FINDING-20260904-002-001",
        "status": "resolved",
        "outcome": "同一 Today 责任项的 HTML 投影变化时，Keyed Detail Surface 现在捕获聚焦控件的字符串值，并在新控件上先恢复该值、再恢复焦点和文本选区；测试桩同时模拟 innerHTML 焦点丢失及浏览器选区钳制。",
        "reason": "状态恢复顺序现在符合草稿所有权边界，避免 wireTodayOperatorDraft 因新控件已聚焦而跳过回填后留下空值；真实责任身份变化仍不转移旧上下文状态。",
        "evidence": [
          "runtime/arcorbit/desktop/renderer/keyed-detail-surface.mjs",
          "runtime/arcorbit/test/keyed-detail-surface.test.mjs",
          "node --test --test-reporter=dot runtime/arcorbit/test/keyed-detail-surface.test.mjs runtime/arcorbit/test/today-workspace.test.mjs runtime/arcorbit/test/desktop-renderer.test.mjs: 77 passed, 0 failed",
          "behavior probe: {\"value\":\"draft text\",\"selectionStart\":3,\"selectionEnd\":7,\"selectionDirection\":\"backward\",\"isActive\":true,\"scrollTop\":0}",
          "node --check runtime/arcorbit/desktop/renderer/keyed-detail-surface.mjs: passed",
          "git diff --check: passed",
          "debug marker search: no matches"
        ],
        "occurred_at": "2026-09-04T07:25:18.196Z"
      }
    }
  ],
  "content_revision": 2,
  "completion_review": {
    "status": "clean",
    "policy": {
      "initial_max_cycles": 10,
      "source": "runtime/arcorbit/config/case-policy.json",
      "snapshotted_at": "2026-09-04T07:05:26.432Z"
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
          "implementation_correctness": "findings",
          "problem_resolution": "findings",
          "verification_credibility": "findings",
          "regression_risk": "findings",
          "minimality": "clean"
        },
        "finding_ids": [
          "FINDING-20260904-002-001"
        ],
        "evidence": [
          "runtime/arcorbit/desktop/renderer/keyed-detail-surface.mjs",
          "runtime/arcorbit/desktop/renderer/renderer.js",
          "runtime/arcorbit/test/keyed-detail-surface.test.mjs",
          "runtime/arcorbit/test/desktop-renderer.test.mjs",
          "arckit/interaction/today-workspace/interaction.md",
          "focused review rerun: 77 passed, 0 failed",
          "read-only realistic textarea probe: value empty, selection 0..0, replacement textarea active",
          "git diff --check: passed",
          "previous full executable regression: 571 passed, 24 explicitly skipped"
        ],
        "occurred_at": "2026-09-04T07:20:03.255Z"
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
          "runtime/arcorbit/desktop/renderer/keyed-detail-surface.mjs",
          "runtime/arcorbit/desktop/renderer/renderer.js",
          "runtime/arcorbit/src/desktop/today-workspace.mjs",
          "runtime/arcorbit/test/keyed-detail-surface.test.mjs",
          "runtime/arcorbit/test/desktop-renderer.test.mjs",
          "arckit/interaction/today-workspace/interaction.md",
          "focused Today/Renderer regression: 77 passed, 0 failed",
          "full ArcOrbit suite: 595 total; 569 passed in sandbox, 24 explicitly skipped, 2 Electron SIGABRT cases isolated",
          "sandbox-external Electron rerun: 2 passed, 0 failed",
          "behavior probe preserved draft text, active focus and selection 3..7/backward",
          "node --check renderer module: passed",
          "git diff --check: passed",
          "temporary debug marker search: no matches"
        ],
        "occurred_at": "2026-09-04T07:27:46.431Z"
      }
    ],
    "evidence": [
      "runtime/arcorbit/desktop/renderer/keyed-detail-surface.mjs",
      "runtime/arcorbit/desktop/renderer/renderer.js",
      "runtime/arcorbit/test/keyed-detail-surface.test.mjs",
      "runtime/arcorbit/test/desktop-renderer.test.mjs",
      "arckit/interaction/today-workspace/interaction.md",
      "focused review rerun: 77 passed, 0 failed",
      "read-only realistic textarea probe: value empty, selection 0..0, replacement textarea active",
      "git diff --check: passed",
      "previous full executable regression: 571 passed, 24 explicitly skipped",
      "runtime/arcorbit/src/desktop/today-workspace.mjs",
      "focused Today/Renderer regression: 77 passed, 0 failed",
      "full ArcOrbit suite: 595 total; 569 passed in sandbox, 24 explicitly skipped, 2 Electron SIGABRT cases isolated",
      "sandbox-external Electron rerun: 2 passed, 0 failed",
      "behavior probe preserved draft text, active focus and selection 3..7/backward",
      "node --check renderer module: passed",
      "temporary debug marker search: no matches"
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
      "goal": "建立身份感知的 Today 第三栏渲染边界，使后台刷新保持当前责任项的阅读与输入上下文，并在责任身份变化时正确建立新上下文。",
      "outcome": "completed",
      "gap_selection": {
        "mode": "candidate",
        "basis": "基于 2026-09-04T07:15:22.410Z 观察到的 fresh trusted snapshot 比较全部 persisted candidates，并使用 CASE-20260904-002 的 Case-scoped selection token 717f5eb5a0b3b9eb50cf4e3c408f4379dbe5cbcdbf34a4248437944c7538e4b9 绑定选择。前次写入未被接受，Case content_revision 仍为 0；Today 详情稳定性 Gap 继续直接对应当前事项，根因已接受、用户影响高且可在当前工作区验证。",
        "snapshot_token": "717f5eb5a0b3b9eb50cf4e3c408f4379dbe5cbcdbf34a4248437944c7538e4b9",
        "selected_ref": "case-gap:CASE-20260904-002:GAP-20260904-002-001",
        "comparison_summary": "四个 Project Gap 均为无关长期治理事项；旧 Case 的发布授权 Gap 为无关 human responsibility；Today 详情稳定性 Gap 是唯一直接阻塞当前用户路径的 agent-ready candidate。",
        "fresh_discovery_summary": "fresh canonical state 未发现优先于 selected Gap 的新候选；前次 claim 被拒绝后 Case 内容、候选集和实现证据均未变化。",
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
            "reason": "需要独立 Case，且不直接解决 Today 第三栏回归。"
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
            "reason": "属于 Runtime resilience 长期工作，不覆盖 Renderer 详情生命周期。"
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
            "reason": "属于真实权限项目安全验证，与当前 UI 回归无关。"
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
            "reason": "属于跨记录审计验收，不覆盖 Today 详情刷新。"
          },
          {
            "ref": "case-gap:CASE-20260901-001:GAP-20260901-001-005",
            "source": "persisted",
            "eligibility": "ready",
            "disposition": "excluded",
            "priority_basis": {
              "blocking": "",
              "uncertainty": "",
              "risk": "high",
              "user_impact": ""
            },
            "reason": "该 Gap 需要人类确认凭据、许可和发布授权，且与本次问题无关。"
          },
          {
            "ref": "case-gap:CASE-20260904-002:GAP-20260904-002-001",
            "source": "persisted",
            "eligibility": "ready",
            "disposition": "selected",
            "priority_basis": {
              "blocking": "blocks reliable use of long Today responsibility details",
              "uncertainty": "low; root cause is deterministically established",
              "risk": "medium; renderer changes can affect selection, drafts, focus and action wiring",
              "user_impact": "high; repeated background refresh interrupts reading and returns users to the top"
            },
            "reason": "直接覆盖当前用户问题，根因已接受且修复边界、测试要求均已确定。"
          }
        ]
      },
      "selected_gap": {
        "id": "GAP-20260904-002-001",
        "responsibility": "agent",
        "goal": "建立身份感知的 Today 第三栏渲染边界，使同一责任项的后台数据刷新不会重置滚动和临时交互上下文，同时保证责任项身份变化时正确更新详情。",
        "reason": "根因已经由确定性源码路径确认；需要在详情表面生命周期和 UI 状态所有权边界修复，而不是仅用延迟、禁止刷新或无条件 scrollTop 回写掩盖重建问题。",
        "derived_from": [
          "FACT-20260904-002-001",
          "FACT-20260904-002-002"
        ],
        "blocked_by": [],
        "priority_basis": {
          "blocking": "blocks reliable use of long Today responsibility details",
          "uncertainty": "low; root cause is deterministically established",
          "risk": "medium; renderer changes can affect selection, drafts, focus and action wiring",
          "user_impact": "high; repeated background refresh interrupts reading and returns users to the top"
        },
        "evidence_required": [
          "Regression proving a background Today refresh preserves the selected detail scroll position",
          "Regression proving a genuine responsibility-item change renders the new detail with correct initial context",
          "Verification that Today drafts, action wiring and current selection behavior remain intact",
          "Focused ArcOrbit renderer and Today workspace tests pass",
          "No temporary debug marker or diagnostic log remains"
        ]
      },
      "planned_transition": {
        "goal": "建立身份感知的 Today 第三栏渲染边界，使后台刷新保持当前责任项的阅读与输入上下文，并在责任身份变化时正确建立新上下文。",
        "expected_state_change": "Today 使用 keyed detail surface 去重未变化投影；同身份内容更新恢复滚动、焦点和选区；跨身份更新从顶部开始；交互事实源和回归测试同步兑现该语义。"
      },
      "accepted_state_delta": {
        "resolved_gap": {
          "id": "GAP-20260904-002-001",
          "status": "resolved",
          "outcome": "Today 第三栏已采用身份感知详情生命周期：相同责任且投影未变化时不替换 DOM，相同责任内容更新时恢复滚动、焦点和文本选区，责任身份变化时从新详情顶部开始；草稿值独立于 HTML 投影，动作处理器持续绑定最新责任事实。",
          "reason": "修复落在详情表面身份和瞬时 UI 状态所有权边界，消除了后台 refreshSnapshot/render 的无条件 remount 根因，同时保留真实数据更新和责任切换语义。",
          "evidence": [
            "runtime/arcorbit/desktop/renderer/keyed-detail-surface.mjs",
            "runtime/arcorbit/desktop/renderer/renderer.js",
            "runtime/arcorbit/test/keyed-detail-surface.test.mjs",
            "runtime/arcorbit/test/desktop-renderer.test.mjs",
            "arckit/interaction/today-workspace/interaction.md",
            "node --test runtime/arcorbit/test/keyed-detail-surface.test.mjs runtime/arcorbit/test/today-workspace.test.mjs runtime/arcorbit/test/desktop-renderer.test.mjs: 77 passed, 0 failed",
            "npm test --workspace @arckit/arcorbit plus sandbox-external Electron rerun: 571 executed tests passed, 24 explicitly skipped",
            "node --check renderer modules: passed",
            "git diff --check: passed",
            "temporary debug marker search: no matches"
          ]
        },
        "facts_added": [
          {
            "id": "FACT-20260904-002-003",
            "revision": 1,
            "status": "accepted",
            "statement": "ArcOrbit Today 操作台现在以 mode 和责任项 identity 作为详情上下文；未变化后台投影保持现有 DOM，同一上下文的内容更新保持滚动、焦点和文本选区，切换上下文从新详情顶部开始，草稿和最新动作绑定不依赖详情 DOM 重建。",
            "basis": "Keyed Detail Surface 实现、Today Renderer 接入、稳定交互事实源以及行为级和完整 ArcOrbit 回归共同证明当前状态。",
            "evidence": [
              "runtime/arcorbit/desktop/renderer/keyed-detail-surface.mjs",
              "runtime/arcorbit/desktop/renderer/renderer.js",
              "runtime/arcorbit/test/keyed-detail-surface.test.mjs",
              "runtime/arcorbit/test/desktop-renderer.test.mjs",
              "arckit/interaction/today-workspace/interaction.md",
              "focused regression: 77 passed",
              "full executable regression: 571 passed"
            ]
          }
        ],
        "facts_superseded": [
          {
            "id": "FACT-20260904-002-001",
            "revision": 1,
            "reason": "该事实记录的是修复前的现象；当前实现和回归证明重复刷新与滚动复位已被消除。",
            "evidence": [
              "runtime/arcorbit/desktop/renderer/keyed-detail-surface.mjs",
              "focused regression: 77 passed",
              "full executable regression: 571 passed"
            ]
          },
          {
            "id": "FACT-20260904-002-002",
            "revision": 1,
            "reason": "renderToday 不再直接无条件重写 todayOperator.innerHTML，而是通过身份感知表面跳过未变化投影并恢复同上下文瞬时状态。",
            "evidence": [
              "runtime/arcorbit/desktop/renderer/renderer.js",
              "runtime/arcorbit/test/desktop-renderer.test.mjs"
            ]
          }
        ],
        "impacts_added": [],
        "impacts_updated": [
          {
            "id": "IMPACT-20260904-002-001",
            "fact_id": "FACT-20260904-002-003",
            "fact_revision": 1,
            "target": {
              "kind": "software_decision",
              "ref": "experience_and_interaction",
              "revision": 65
            },
            "effect": "upheld",
            "reason": "Today 的后台读取与实时更新现在保持仍有效责任项的阅读、输入和选择连续性，真实责任切换则明确建立新的详情上下文。",
            "gap_ids": [],
            "evidence": [
              "arckit/interaction/today-workspace/interaction.md",
              "runtime/arcorbit/desktop/renderer/keyed-detail-surface.mjs",
              "runtime/arcorbit/desktop/renderer/renderer.js",
              "runtime/arcorbit/test/keyed-detail-surface.test.mjs"
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
          "arckit/interaction/today-workspace/interaction.md",
          "arckit/interaction/INDEX.md"
        ]
      },
      "invariant_assessment": {
        "project_revision": 340,
        "judgments": [
          {
            "invariant_ref": "product-expectations-remain-recoverable",
            "disposition": "not_relevant",
            "reason": "本轮修复既有 Today 交互连续性，不改变产品能力范围、业务规则或验收含义。",
            "fact_refs": [],
            "evidence": [],
            "gap_refs": []
          },
          {
            "invariant_ref": "interaction-expectations-remain-recoverable",
            "disposition": "upheld",
            "reason": "后台更新保持同一责任项上下文、身份变化建立新上下文的规则已写入 Today 页面交互事实源。",
            "fact_refs": [
              "FACT-20260904-002-003"
            ],
            "evidence": [
              "arckit/interaction/today-workspace/interaction.md",
              "arckit/interaction/INDEX.md"
            ],
            "gap_refs": []
          },
          {
            "invariant_ref": "visual-language-remains-consistent",
            "disposition": "not_relevant",
            "reason": "本轮未改变 Today 的布局、组件外观、视觉 token 或响应式表达。",
            "fact_refs": [],
            "evidence": [],
            "gap_refs": []
          },
          {
            "invariant_ref": "technical-decisions-remain-explainable",
            "disposition": "upheld",
            "reason": "Keyed Detail Surface 明确拥有详情 identity、投影去重和瞬时状态恢复，Renderer 只提供当前上下文与 HTML 投影，职责边界可从独立模块和接入点恢复。",
            "fact_refs": [
              "FACT-20260904-002-003"
            ],
            "evidence": [
              "runtime/arcorbit/desktop/renderer/keyed-detail-surface.mjs",
              "runtime/arcorbit/desktop/renderer/renderer.js",
              "runtime/arcorbit/test/keyed-detail-surface.test.mjs"
            ],
            "gap_refs": []
          },
          {
            "invariant_ref": "accepted-facts-are-realized",
            "disposition": "upheld",
            "reason": "实现与测试直接兑现 Today 后台刷新不中断当前详情阅读上下文、真实身份切换正确重置的 accepted outcome。",
            "fact_refs": [
              "FACT-20260904-002-003"
            ],
            "evidence": [
              "runtime/arcorbit/desktop/renderer/renderer.js",
              "runtime/arcorbit/test/keyed-detail-surface.test.mjs",
              "runtime/arcorbit/test/desktop-renderer.test.mjs",
              "focused regression: 77 passed",
              "full executable regression: 571 passed"
            ],
            "gap_refs": []
          },
          {
            "invariant_ref": "material-risks-have-credible-evidence",
            "disposition": "upheld",
            "reason": "DOM identity、同上下文内容变化、跨上下文重置、草稿/action wiring 和全套回归风险均有可重复测试；沙箱内两项 Electron SIGABRT 已通过沙箱外同用例复验排除功能回归。",
            "fact_refs": [
              "FACT-20260904-002-003"
            ],
            "evidence": [
              "runtime/arcorbit/test/keyed-detail-surface.test.mjs",
              "runtime/arcorbit/test/desktop-renderer.test.mjs",
              "node --test focused suite: 77 passed",
              "npm full suite and Electron rerun: 571 executable tests passed, 24 explicitly skipped",
              "git diff --check: passed"
            ],
            "gap_refs": []
          }
        ]
      },
      "evidence": [
        "runtime/arcorbit/desktop/renderer/keyed-detail-surface.mjs",
        "runtime/arcorbit/desktop/renderer/renderer.js",
        "runtime/arcorbit/test/keyed-detail-surface.test.mjs",
        "runtime/arcorbit/test/desktop-renderer.test.mjs",
        "arckit/interaction/today-workspace/interaction.md",
        "arckit/interaction/INDEX.md",
        "focused regression: 77 passed, 0 failed",
        "full executable regression: 571 passed, 24 explicitly skipped",
        "syntax and diff checks passed",
        "no temporary debug instrumentation retained"
      ],
      "runtime_result_ref": "arckit-runtime://runs/RUN-20260904-070306107Z-65cf00a9",
      "occurred_at": "2026-09-04T07:16:35.021Z"
    },
    {
      "round": 2,
      "transition_schema_version": "arckit-case-transition/v8",
      "goal": "独立审查 Today 身份感知详情修复的实现正确性、真实问题解决、验证可信度、回归风险和最小性。",
      "outcome": "completed",
      "gap_selection": {
        "mode": "candidate",
        "basis": "基于 observed_after_commit=true 的 fresh trusted snapshot 1079884dfe7912daf0f7b3d52d882099620789afa8ad49cd1959838b7526141f 比较全部 persisted candidates，并使用 CASE-20260904-002 的 Case-scoped selection token bda91cb9cec6d9f6c7dc998d51c6b8a6a2e5eb3a16034179efec8c148e953250。该 Case 的普通 Gap 和 impact 已闭合，Completion Review 是其唯一 ready candidate，也是确认实现能否真正结束 Case 的当前阻塞项。",
        "snapshot_token": "bda91cb9cec6d9f6c7dc998d51c6b8a6a2e5eb3a16034179efec8c148e953250",
        "selected_ref": "case-gap:CASE-20260904-002:CASE-20260904-002:completion-review:1",
        "comparison_summary": "四个 Project Gap 需要独立 Case；CASE-20260901-001 的发布授权 Gap 属于无关的人类责任；CASE-20260904-002 Completion Review 直接阻塞当前 Case 完成，且五维审查可由当前实现、测试和行为探针完成。",
        "fresh_discovery_summary": "审查过程中发现同一责任项内容更新后的草稿回填顺序缺陷；该发现作为 Completion Review finding 提交，等待 Ledger 派生下一轮普通修复 Gap。",
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
            "reason": "需要独立 Case，不属于当前 Today 修复的完成审查。"
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
            "reason": "属于 Runtime resilience 长期事项，需要独立 Case。"
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
            "reason": "属于真实权限项目安全验证，需要独立 Case。"
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
            "reason": "属于跨记录审计验收，需要独立 Case。"
          },
          {
            "ref": "case-gap:CASE-20260901-001:GAP-20260901-001-005",
            "source": "persisted",
            "eligibility": "ready",
            "disposition": "excluded",
            "priority_basis": {
              "blocking": "",
              "uncertainty": "",
              "risk": "high",
              "user_impact": ""
            },
            "reason": "该 Gap 需要人类确认凭据、许可和发布授权，与 CASE-20260904-002 无关。"
          },
          {
            "ref": "case-gap:CASE-20260904-002:CASE-20260904-002:completion-review:1",
            "source": "persisted",
            "eligibility": "ready",
            "disposition": "selected",
            "priority_basis": {
              "blocking": "high",
              "uncertainty": "low",
              "risk": "high",
              "user_impact": "high"
            },
            "reason": "普通工作和 impact 均已闭合；该审查是当前 Case 的唯一完成门禁。"
          }
        ]
      },
      "selected_gap": {
        "id": "CASE-20260904-002:completion-review:1",
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
        "goal": "独立审查 Today 身份感知详情修复的实现正确性、真实问题解决、验证可信度、回归风险和最小性。",
        "expected_state_change": "记录五维 Completion Review 结果；任何发现只形成 review finding，由 Ledger 派生后续普通修复 Gap，本轮不合并修复或 Case 内容变化。"
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
              "id": "FINDING-20260904-002-001",
              "kind": "error",
              "statement": "同一 Today 责任项的 HTML 投影变化时，Keyed Detail Surface 会先在值为空的新 textarea 上恢复焦点和选区；随后 wireTodayOperatorDraft 因该节点已是 document.activeElement 而跳过从 state.todayDrafts 回填，导致草稿在界面中变空、选区归零，并可能被下一次输入覆盖。现有测试桩没有模拟 textarea 值长度和浏览器 selection clamp，因此未捕获该路径。",
              "responsibility": "agent",
              "artifact_refs": [
                "runtime/arcorbit/desktop/renderer/keyed-detail-surface.mjs",
                "runtime/arcorbit/desktop/renderer/renderer.js",
                "runtime/arcorbit/test/keyed-detail-surface.test.mjs"
              ],
              "evidence": [
                "runtime/arcorbit/desktop/renderer/keyed-detail-surface.mjs:22-29 restores focus and selection immediately after replacing host.innerHTML",
                "runtime/arcorbit/desktop/renderer/renderer.js:1851 creates the replacement textarea without its persisted draft value",
                "runtime/arcorbit/desktop/renderer/renderer.js:1933-1941 skips draft assignment when the replacement textarea is already document.activeElement",
                "runtime/arcorbit/test/keyed-detail-surface.test.mjs:33-45 models neither textarea value nor selection clamping",
                "read-only behavior probe reproduces {\"value\":\"\",\"selectionStart\":0,\"selectionEnd\":0,\"isActive\":true} after a same-context HTML change"
              ]
            }
          ],
          "evidence": [
            "runtime/arcorbit/desktop/renderer/keyed-detail-surface.mjs",
            "runtime/arcorbit/desktop/renderer/renderer.js",
            "runtime/arcorbit/test/keyed-detail-surface.test.mjs",
            "runtime/arcorbit/test/desktop-renderer.test.mjs",
            "arckit/interaction/today-workspace/interaction.md",
            "focused review rerun: 77 passed, 0 failed",
            "read-only realistic textarea probe: value empty, selection 0..0, replacement textarea active",
            "git diff --check: passed",
            "previous full executable regression: 571 passed, 24 explicitly skipped"
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
        "project_revision": 340,
        "judgments": [
          {
            "invariant_ref": "product-expectations-remain-recoverable",
            "disposition": "not_relevant",
            "reason": "Completion Review 未改变 Today 的产品能力范围、业务规则或验收含义。",
            "fact_refs": [],
            "evidence": [],
            "gap_refs": []
          },
          {
            "invariant_ref": "interaction-expectations-remain-recoverable",
            "disposition": "upheld",
            "reason": "审查发现的是实现偏差，不是长期交互预期缺失；同一责任项刷新必须保留草稿、焦点和选区的规则仍由 Today 交互事实源明确恢复。",
            "fact_refs": [],
            "evidence": [
              "arckit/interaction/today-workspace/interaction.md",
              "arckit/interaction/INDEX.md"
            ],
            "gap_refs": []
          },
          {
            "invariant_ref": "visual-language-remains-consistent",
            "disposition": "not_relevant",
            "reason": "审查及 finding 均不涉及布局、组件外观、视觉 token 或响应式表达。",
            "fact_refs": [],
            "evidence": [],
            "gap_refs": []
          },
          {
            "invariant_ref": "technical-decisions-remain-explainable",
            "disposition": "upheld",
            "reason": "详情 identity、DOM 替换、焦点恢复和草稿回填的职责及错误顺序可从独立 surface 与 Renderer 接入点直接恢复；finding 精确界定了需要修复的所有权顺序。",
            "fact_refs": [],
            "evidence": [
              "runtime/arcorbit/desktop/renderer/keyed-detail-surface.mjs",
              "runtime/arcorbit/desktop/renderer/renderer.js",
              "runtime/arcorbit/test/keyed-detail-surface.test.mjs"
            ],
            "gap_refs": []
          },
          {
            "invariant_ref": "accepted-facts-are-realized",
            "disposition": "not_relevant",
            "reason": "本轮不接受或修改软件实现事实，只提交 Completion Review finding；Ledger 派生普通修复 Gap并 fresh-read 后，下一轮再对实现事实与 open gap 建立显式 realization 判断。",
            "fact_refs": [],
            "evidence": [],
            "gap_refs": []
          },
          {
            "invariant_ref": "material-risks-have-credible-evidence",
            "disposition": "upheld",
            "reason": "草稿丢失风险由确定性源码顺序、测试桩缺口和模拟真实 textarea 行为的只读探针共同证明，范围明确且可重复。",
            "fact_refs": [],
            "evidence": [
              "runtime/arcorbit/desktop/renderer/keyed-detail-surface.mjs",
              "runtime/arcorbit/desktop/renderer/renderer.js",
              "runtime/arcorbit/test/keyed-detail-surface.test.mjs",
              "read-only behavior probe reproduces empty value and clamped 0..0 selection"
            ],
            "gap_refs": []
          }
        ]
      },
      "evidence": [
        "fresh trusted snapshot: CASE-20260904-002 content_revision 1 and review_ready",
        "runtime/arcorbit/desktop/renderer/keyed-detail-surface.mjs",
        "runtime/arcorbit/desktop/renderer/renderer.js",
        "runtime/arcorbit/test/keyed-detail-surface.test.mjs",
        "runtime/arcorbit/test/desktop-renderer.test.mjs",
        "arckit/interaction/today-workspace/interaction.md",
        "node --test focused suite: 77 passed, 0 failed",
        "read-only behavior probe: {\"value\":\"\",\"selectionStart\":0,\"selectionEnd\":0,\"isActive\":true}",
        "git diff --check: passed"
      ],
      "runtime_result_ref": "arckit-runtime://runs/RUN-20260904-070306107Z-65cf00a9",
      "occurred_at": "2026-09-04T07:20:03.255Z"
    },
    {
      "round": 3,
      "transition_schema_version": "arckit-case-transition/v8",
      "goal": "修复同一 Today 详情上下文更新时的草稿恢复顺序，并以真实 selection clamp 行为的回归测试关闭 review finding。",
      "outcome": "completed",
      "gap_selection": {
        "mode": "candidate",
        "basis": "当前 Case 的 review finding 直接阻断完成，且同时具有高风险与高阻断性；其他 Project Gap 均需新建 Case，另一 ready Case Gap 属于不同 Case 的 human 责任。",
        "snapshot_token": "2f4a73a2f857a8e2dcd05583fe043c47dd26fc1430f55682a8dfbaa031e8387a",
        "selected_ref": "case-gap:CASE-20260904-002:CASE-20260904-002:review-finding:FINDING-20260904-002-001",
        "comparison_summary": "选择 CASE-20260904-002 的 agent-owned review finding，因为它是当前 Case 唯一未解决且阻断完成的普通 Gap；排除不同 Case 的 human 责任，延后所有需要独立 Case 的 Project Gap。",
        "fresh_discovery_summary": "未发现优先于已持久化 review finding 的新 Gap；现有 finding 已精确覆盖草稿值、焦点及选区恢复顺序问题。",
        "considered": [
          {
            "ref": "project-gap:GAP-agent-scenario-evaluation",
            "source": "persisted",
            "eligibility": "case_required",
            "disposition": "deferred",
            "priority_basis": {
              "blocking": "不阻断当前 Case",
              "uncertainty": "high",
              "risk": "high",
              "user_impact": "需要独立真实场景验证 Case"
            },
            "reason": "需要新的有界 Case，不能在当前 Today 修复 Case 中处理。"
          },
          {
            "ref": "project-gap:GAP-runtime-resilience-and-adapters",
            "source": "persisted",
            "eligibility": "case_required",
            "disposition": "deferred",
            "priority_basis": {
              "blocking": "medium urgency",
              "uncertainty": "",
              "risk": "high",
              "user_impact": "长期 Runtime 韧性"
            },
            "reason": "属于独立 Runtime 能力范围，不是当前 review finding 的修复边界。"
          },
          {
            "ref": "project-gap:GAP-security-real-project-validation",
            "source": "persisted",
            "eligibility": "case_required",
            "disposition": "deferred",
            "priority_basis": {
              "blocking": "medium urgency",
              "uncertainty": "",
              "risk": "high",
              "user_impact": "需要真实权限项目"
            },
            "reason": "需要独立受控资源和新 Case，与当前 Renderer 修复无直接关系。"
          },
          {
            "ref": "project-gap:GAP-cross-record-audit",
            "source": "persisted",
            "eligibility": "case_required",
            "disposition": "deferred",
            "priority_basis": {
              "blocking": "high urgency",
              "uncertainty": "",
              "risk": "high",
              "user_impact": "跨记录一致性验收"
            },
            "reason": "虽具有高风险与紧迫性，但需要独立 Case，不能取代当前 Case 的阻断 finding。"
          },
          {
            "ref": "case-gap:CASE-20260901-001:GAP-20260901-001-005",
            "source": "persisted",
            "eligibility": "ready",
            "disposition": "excluded",
            "priority_basis": {
              "blocking": "blocks public push and archival",
              "uncertainty": "",
              "risk": "high",
              "user_impact": "需要所有者确认"
            },
            "reason": "属于 CASE-20260901-001 且责任为 human，当前 Agent 无法建立 provider、法律或发布授权事实。"
          },
          {
            "ref": "case-gap:CASE-20260904-002:CASE-20260904-002:review-finding:FINDING-20260904-002-001",
            "source": "persisted",
            "eligibility": "ready",
            "disposition": "selected",
            "priority_basis": {
              "blocking": "high",
              "uncertainty": "low；因果顺序已确定",
              "risk": "high",
              "user_impact": "后台更新可能清空正在编辑的草稿并破坏选区"
            },
            "reason": "当前 Case 唯一未解决的 agent-owned 阻断 Gap，且已有确定性源码、探针和回归边界。"
          }
        ]
      },
      "selected_gap": {
        "id": "CASE-20260904-002:review-finding:FINDING-20260904-002-001",
        "responsibility": "agent",
        "goal": "Resolve review finding: 同一 Today 责任项的 HTML 投影变化时，Keyed Detail Surface 会先在值为空的新 textarea 上恢复焦点和选区；随后 wireTodayOperatorDraft 因该节点已是 document.activeElement 而跳过从 state.todayDrafts 回填，导致草稿在界面中变空、选区归零，并可能被下一次输入覆盖。现有测试桩没有模拟 textarea 值长度和浏览器 selection clamp，因此未捕获该路径。",
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
          "runtime/arcorbit/desktop/renderer/keyed-detail-surface.mjs",
          "runtime/arcorbit/desktop/renderer/renderer.js",
          "runtime/arcorbit/test/keyed-detail-surface.test.mjs",
          "runtime/arcorbit/desktop/renderer/keyed-detail-surface.mjs:22-29 restores focus and selection immediately after replacing host.innerHTML",
          "runtime/arcorbit/desktop/renderer/renderer.js:1851 creates the replacement textarea without its persisted draft value",
          "runtime/arcorbit/desktop/renderer/renderer.js:1933-1941 skips draft assignment when the replacement textarea is already document.activeElement",
          "runtime/arcorbit/test/keyed-detail-surface.test.mjs:33-45 models neither textarea value nor selection clamping",
          "read-only behavior probe reproduces {\"value\":\"\",\"selectionStart\":0,\"selectionEnd\":0,\"isActive\":true} after a same-context HTML change"
        ]
      },
      "planned_transition": {
        "goal": "修复同一 Today 详情上下文更新时的草稿恢复顺序，并以真实 selection clamp 行为的回归测试关闭 review finding。",
        "expected_state_change": "选定 review-finding Gap 被解决；同一上下文重建会在聚焦和恢复选区之前恢复控件值，Completion Review finding 标记为已处理。"
      },
      "accepted_state_delta": {
        "resolved_gap": {
          "id": "CASE-20260904-002:review-finding:FINDING-20260904-002-001",
          "status": "resolved",
          "outcome": "同一 Today 责任项的 HTML 投影变化时，Keyed Detail Surface 现在捕获聚焦控件的字符串值，并在新控件上先恢复该值、再恢复焦点和文本选区；测试桩同时模拟 innerHTML 焦点丢失及浏览器选区钳制。",
          "reason": "状态恢复顺序现在符合草稿所有权边界，避免 wireTodayOperatorDraft 因新控件已聚焦而跳过回填后留下空值；真实责任身份变化仍不转移旧上下文状态。",
          "evidence": [
            "runtime/arcorbit/desktop/renderer/keyed-detail-surface.mjs",
            "runtime/arcorbit/test/keyed-detail-surface.test.mjs",
            "node --test --test-reporter=dot runtime/arcorbit/test/keyed-detail-surface.test.mjs runtime/arcorbit/test/today-workspace.test.mjs runtime/arcorbit/test/desktop-renderer.test.mjs: 77 passed, 0 failed",
            "behavior probe: {\"value\":\"draft text\",\"selectionStart\":3,\"selectionEnd\":7,\"selectionDirection\":\"backward\",\"isActive\":true,\"scrollTop\":0}",
            "node --check runtime/arcorbit/desktop/renderer/keyed-detail-surface.mjs: passed",
            "git diff --check: passed",
            "debug marker search: no matches"
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
          "FINDING-20260904-002-001"
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
        "project_revision": 340,
        "judgments": [
          {
            "invariant_ref": "product-expectations-remain-recoverable",
            "disposition": "not_relevant",
            "reason": "本轮仅纠正既有 Today 交互实现的状态恢复顺序，不改变产品能力、业务规则或验收含义。",
            "fact_refs": [],
            "evidence": [],
            "gap_refs": []
          },
          {
            "invariant_ref": "interaction-expectations-remain-recoverable",
            "disposition": "upheld",
            "reason": "同一责任项后台更新保持草稿、焦点和选区，身份变化建立新上下文的规则仍由稳定交互事实源明确表达，并由修复后的实现兑现。",
            "fact_refs": [
              "FACT-20260904-002-003"
            ],
            "evidence": [
              "arckit/interaction/today-workspace/interaction.md",
              "runtime/arcorbit/desktop/renderer/keyed-detail-surface.mjs",
              "runtime/arcorbit/test/keyed-detail-surface.test.mjs"
            ],
            "gap_refs": []
          },
          {
            "invariant_ref": "visual-language-remains-consistent",
            "disposition": "not_relevant",
            "reason": "本轮不改变 Today 的布局、组件外观、视觉 token 或响应式呈现。",
            "fact_refs": [],
            "evidence": [],
            "gap_refs": []
          },
          {
            "invariant_ref": "technical-decisions-remain-explainable",
            "disposition": "upheld",
            "reason": "Keyed Detail Surface 继续统一拥有详情 identity 与瞬时 DOM 状态恢复，并明确按值、焦点、选区的安全顺序恢复；Renderer 的草稿状态所有权无需扩张。",
            "fact_refs": [
              "FACT-20260904-002-003"
            ],
            "evidence": [
              "runtime/arcorbit/desktop/renderer/keyed-detail-surface.mjs",
              "runtime/arcorbit/desktop/renderer/renderer.js",
              "runtime/arcorbit/test/keyed-detail-surface.test.mjs"
            ],
            "gap_refs": []
          },
          {
            "invariant_ref": "accepted-facts-are-realized",
            "disposition": "upheld",
            "reason": "修复后的实现重新完整兑现 FACT-20260904-002-003 关于同一上下文草稿、焦点和选区连续性的声明，同时保持跨上下文重置行为。",
            "fact_refs": [
              "FACT-20260904-002-003"
            ],
            "evidence": [
              "runtime/arcorbit/desktop/renderer/keyed-detail-surface.mjs",
              "runtime/arcorbit/test/keyed-detail-surface.test.mjs",
              "node --test --test-reporter=dot focused suite: 77 passed, 0 failed",
              "behavior probe preserves draft text and selection 3..7/backward"
            ],
            "gap_refs": []
          },
          {
            "invariant_ref": "material-risks-have-credible-evidence",
            "disposition": "upheld",
            "reason": "原草稿清空风险由恢复顺序修复，并由模拟真实 value 长度与 selection clamp 的行为级回归、独立探针、语法和 diff 检查共同控制。",
            "fact_refs": [
              "FACT-20260904-002-003"
            ],
            "evidence": [
              "runtime/arcorbit/test/keyed-detail-surface.test.mjs",
              "node --test --test-reporter=dot focused suite: 77 passed, 0 failed",
              "behavior probe: draft text, selection 3..7/backward, active element retained",
              "node --check runtime/arcorbit/desktop/renderer/keyed-detail-surface.mjs: passed",
              "git diff --check: passed"
            ],
            "gap_refs": []
          }
        ]
      },
      "evidence": [
        "runtime/arcorbit/desktop/renderer/keyed-detail-surface.mjs",
        "runtime/arcorbit/test/keyed-detail-surface.test.mjs",
        "runtime/arcorbit/desktop/renderer/renderer.js",
        "arckit/interaction/today-workspace/interaction.md",
        "focused regression: 77 passed, 0 failed",
        "independent behavior probe preserved value, focus and selection",
        "syntax and diff checks passed",
        "no temporary debug instrumentation retained"
      ],
      "runtime_result_ref": "arckit-runtime://runs/RUN-20260904-070306107Z-65cf00a9",
      "occurred_at": "2026-09-04T07:25:18.196Z"
    },
    {
      "round": 4,
      "transition_schema_version": "arckit-case-transition/v8",
      "goal": "独立审查 Today 身份感知详情修复及 finding 修复后的实现正确性、真实问题解决、验证可信度、回归风险和最小性。",
      "outcome": "completed",
      "gap_selection": {
        "mode": "candidate",
        "basis": "Completion Review 是当前 Case 唯一 agent-owned 且直接阻断关闭的 ready candidate；其余 Project Gap 均需要独立 Case，另一 ready Gap 属于不同 Case 的 human 责任。",
        "snapshot_token": "ac3cea8c1598c824ddf2d814612894a5a0c47cd00f5d730420f657f850ea6232",
        "selected_ref": "case-gap:CASE-20260904-002:CASE-20260904-002:completion-review:2",
        "comparison_summary": "选择 CASE-20260904-002 content revision 2 的 Completion Review；延后四项需要新 Case 的 Project Gap，并排除 CASE-20260901-001 的 human-owned 发布与授权 Gap。",
        "fresh_discovery_summary": "审查实现、身份生成、交互事实源和完整回归后未发现新的 error、omission 或 excess。",
        "considered": [
          {
            "ref": "project-gap:GAP-agent-scenario-evaluation",
            "source": "persisted",
            "eligibility": "case_required",
            "disposition": "deferred",
            "priority_basis": {
              "blocking": "不阻断当前 Case",
              "uncertainty": "high",
              "risk": "high",
              "user_impact": "需要独立真实场景验证"
            },
            "reason": "需要新建有界 Case，不能替代当前 Case 的完成审查。"
          },
          {
            "ref": "project-gap:GAP-runtime-resilience-and-adapters",
            "source": "persisted",
            "eligibility": "case_required",
            "disposition": "deferred",
            "priority_basis": {
              "blocking": "medium urgency",
              "uncertainty": "",
              "risk": "high",
              "user_impact": "长期 Runtime 韧性"
            },
            "reason": "属于独立 Runtime 能力范围，需要单独 Case。"
          },
          {
            "ref": "project-gap:GAP-security-real-project-validation",
            "source": "persisted",
            "eligibility": "case_required",
            "disposition": "deferred",
            "priority_basis": {
              "blocking": "medium urgency",
              "uncertainty": "",
              "risk": "high",
              "user_impact": "需要真实权限项目"
            },
            "reason": "需要独立受控资源和新 Case。"
          },
          {
            "ref": "project-gap:GAP-cross-record-audit",
            "source": "persisted",
            "eligibility": "case_required",
            "disposition": "deferred",
            "priority_basis": {
              "blocking": "high urgency",
              "uncertainty": "",
              "risk": "high",
              "user_impact": "跨记录一致性验收"
            },
            "reason": "优先级较高但仍需独立 Case，不能跳过当前完成审查。"
          },
          {
            "ref": "case-gap:CASE-20260901-001:GAP-20260901-001-005",
            "source": "persisted",
            "eligibility": "ready",
            "disposition": "excluded",
            "priority_basis": {
              "blocking": "blocks public push and archival",
              "uncertainty": "",
              "risk": "high",
              "user_impact": "需要所有者确认"
            },
            "reason": "属于另一 Case 且责任为 human，当前 Agent 无法建立 provider、法律或发布授权事实。"
          },
          {
            "ref": "case-gap:CASE-20260904-002:CASE-20260904-002:completion-review:2",
            "source": "persisted",
            "eligibility": "ready",
            "disposition": "selected",
            "priority_basis": {
              "blocking": "high",
              "uncertainty": "low",
              "risk": "high",
              "user_impact": "high"
            },
            "reason": "当前 Case 所有普通 Gap 已关闭，只有该审查能验证修复后的 content revision 2 并决定是否关闭 Case。"
          }
        ]
      },
      "selected_gap": {
        "id": "CASE-20260904-002:completion-review:2",
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
        "goal": "独立审查 Today 身份感知详情修复及 finding 修复后的实现正确性、真实问题解决、验证可信度、回归风险和最小性。",
        "expected_state_change": "Completion Review 对 content revision 2 记录 clean 结果且无 findings，使 Ledger 可按确定性审计关闭 CASE-20260904-002。"
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
            "runtime/arcorbit/desktop/renderer/keyed-detail-surface.mjs",
            "runtime/arcorbit/desktop/renderer/renderer.js",
            "runtime/arcorbit/src/desktop/today-workspace.mjs",
            "runtime/arcorbit/test/keyed-detail-surface.test.mjs",
            "runtime/arcorbit/test/desktop-renderer.test.mjs",
            "arckit/interaction/today-workspace/interaction.md",
            "focused Today/Renderer regression: 77 passed, 0 failed",
            "full ArcOrbit suite: 595 total; 569 passed in sandbox, 24 explicitly skipped, 2 Electron SIGABRT cases isolated",
            "sandbox-external Electron rerun: 2 passed, 0 failed",
            "behavior probe preserved draft text, active focus and selection 3..7/backward",
            "node --check renderer module: passed",
            "git diff --check: passed",
            "temporary debug marker search: no matches"
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
        "project_revision": 340,
        "judgments": [
          {
            "invariant_ref": "product-expectations-remain-recoverable",
            "disposition": "not_relevant",
            "reason": "Completion Review 不建立或修改 Today 的产品能力、业务规则或验收含义。",
            "fact_refs": [],
            "evidence": [],
            "gap_refs": []
          },
          {
            "invariant_ref": "interaction-expectations-remain-recoverable",
            "disposition": "upheld",
            "reason": "稳定交互事实源明确规定同一责任项更新保持阅读与输入状态、身份变化建立新上下文；最终实现与该规则一致。",
            "fact_refs": [
              "FACT-20260904-002-003"
            ],
            "evidence": [
              "arckit/interaction/today-workspace/interaction.md",
              "arckit/interaction/INDEX.md",
              "runtime/arcorbit/desktop/renderer/renderer.js"
            ],
            "gap_refs": []
          },
          {
            "invariant_ref": "visual-language-remains-consistent",
            "disposition": "not_relevant",
            "reason": "审查范围未改变布局、组件外观、视觉 token 或响应式表达。",
            "fact_refs": [],
            "evidence": [],
            "gap_refs": []
          },
          {
            "invariant_ref": "technical-decisions-remain-explainable",
            "disposition": "upheld",
            "reason": "详情 identity、投影去重、瞬时状态恢复和最新动作绑定的职责边界可从独立 surface、Renderer 接入点及身份生成规则直接恢复。",
            "fact_refs": [
              "FACT-20260904-002-003"
            ],
            "evidence": [
              "runtime/arcorbit/desktop/renderer/keyed-detail-surface.mjs",
              "runtime/arcorbit/desktop/renderer/renderer.js",
              "runtime/arcorbit/src/desktop/today-workspace.mjs",
              "runtime/arcorbit/test/keyed-detail-surface.test.mjs"
            ],
            "gap_refs": []
          },
          {
            "invariant_ref": "accepted-facts-are-realized",
            "disposition": "upheld",
            "reason": "未变化投影保留 DOM；同上下文更新保持草稿、焦点、选区和滚动；mode 或责任 identity 变化从新详情顶部开始，完整兑现 accepted fact。",
            "fact_refs": [
              "FACT-20260904-002-003"
            ],
            "evidence": [
              "runtime/arcorbit/desktop/renderer/keyed-detail-surface.mjs",
              "runtime/arcorbit/desktop/renderer/renderer.js",
              "runtime/arcorbit/test/keyed-detail-surface.test.mjs",
              "focused Today/Renderer regression: 77 passed, 0 failed",
              "behavior probe preserved value, focus and selection"
            ],
            "gap_refs": []
          },
          {
            "invariant_ref": "material-risks-have-credible-evidence",
            "disposition": "upheld",
            "reason": "DOM identity、草稿丢失、selection clamp、跨上下文状态泄漏、重复 handler 和外围回归均有比例适当的源码检查、行为测试与全套回归证据。",
            "fact_refs": [
              "FACT-20260904-002-003"
            ],
            "evidence": [
              "runtime/arcorbit/test/keyed-detail-surface.test.mjs",
              "runtime/arcorbit/test/desktop-renderer.test.mjs",
              "focused Today/Renderer regression: 77 passed, 0 failed",
              "full ArcOrbit suite plus sandbox-external Electron rerun: 571 executable tests passed, 24 explicitly skipped",
              "git diff --check: passed",
              "temporary debug marker search: no matches"
            ],
            "gap_refs": []
          }
        ]
      },
      "evidence": [
        "runtime/arcorbit/desktop/renderer/keyed-detail-surface.mjs",
        "runtime/arcorbit/desktop/renderer/renderer.js",
        "runtime/arcorbit/src/desktop/today-workspace.mjs",
        "runtime/arcorbit/test/keyed-detail-surface.test.mjs",
        "runtime/arcorbit/test/desktop-renderer.test.mjs",
        "arckit/interaction/today-workspace/interaction.md",
        "focused regression: 77 passed, 0 failed",
        "full executable regression: 571 passed, 24 explicitly skipped",
        "syntax, behavior probe and diff checks passed",
        "no temporary debug instrumentation retained"
      ],
      "runtime_result_ref": "arckit-runtime://runs/RUN-20260904-070306107Z-65cf00a9",
      "occurred_at": "2026-09-04T07:27:46.431Z"
    }
  ],
  "case_resolution": {
    "status": "resolved",
    "stage": "resolved",
    "satisfied": [
      "GAP-20260904-002-001",
      "CASE-20260904-002:review-finding:FINDING-20260904-002-001"
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
    "updated_at": "2026-09-04T07:27:46.431Z"
  }
}
```

## Round Notes

- Case history is canonical in Structured Record.rounds; keep prose notes exceptional.
