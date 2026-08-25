# 改善 Local Capability Setup 新人安装引导

Case: CASE-20260825-006
Status: closed
Artifact Type: mixed
Selected Gap: none
Updated: 2026-08-25T11:51:46.039Z

## User Intent

消除安装计划展开、确认勾选与“安装并继续”按钮之间的隐式依赖，让首次使用者明确知道下一步、未满足条件和操作结果。

## Structured Record

```json
{
  "schema_version": "development-case-record/v5",
  "id": "CASE-20260825-006",
  "title": "改善 Local Capability Setup 新人安装引导",
  "status": "closed",
  "artifact_type": "mixed",
  "created_at": "2026-08-25T11:28:05.754Z",
  "updated_at": "2026-08-25T11:51:46.039Z",
  "user_intent": "消除安装计划展开、确认勾选与“安装并继续”按钮之间的隐式依赖，让首次使用者明确知道下一步、未满足条件和操作结果。",
  "expected_outcome": "Setup 页面以显式、一致且可访问的方式引导用户查看必要的写入摘要并完成确认；任何操作都会产生可理解反馈，主按钮的可用状态及原因清晰可见。",
  "project_state_ref": "arckit/project/state.record.json",
  "current_round": {
    "goal": "",
    "selected_gap": null
  },
  "facts": [
    {
      "id": "FACT-SETUP-CONFIRMATION-GATING",
      "revision": 1,
      "status": "accepted",
      "statement": "Local Capability Setup 的“安装并继续”仅在安装计划至少展开过一次且“我已查看写入目标与变更摘要”已勾选时启用；复选框本身只重新计算按钮状态，不会展开计划或解释仍缺少的条件，因此用户可以完成一个可见确认动作却看不到任何有效反馈。",
      "basis": "当前用户报告与 Renderer 的直接状态条件一致；既有交互文档也明确规定必须先打开写入目标摘要。",
      "evidence": [
        "Current operator input, 2026-08-25",
        "runtime/arcorbit/desktop/renderer/renderer.js:315-319",
        "runtime/arcorbit/desktop/renderer/renderer.js:668-670",
        "runtime/arcorbit/desktop/renderer/index.html:48-63",
        "arckit/interaction/setup-readiness/interaction.md:110"
      ]
    },
    {
      "id": "FACT-20260825-006-001",
      "revision": 1,
      "status": "accepted",
      "statement": "Setup 安装计划的项目绝对目标、Codex 用户级写入边界和变更分类数量默认可见；完整安装明细是可选信息，不参与启用判断。当前 plan 的确认框是“安装并继续”的唯一用户确认门槛，未确认原因在同一动作区域显示，勾选或取消会即时更新提示和按钮，plan 变化会清除旧确认并要求重新确认。",
      "basis": "该方案同时消除隐式依赖、保留写入知情确认，并已同步到权威交互策略及其线框投影。",
      "evidence": [
        "arckit/interaction/setup-readiness/interaction.md",
        "arckit/interaction/setup-readiness/default.html",
        "arckit/interaction/_map/feature-matrix.md"
      ]
    },
    {
      "id": "FACT-20260825-006-002",
      "revision": 1,
      "status": "accepted",
      "statement": "ArcOrbit 生产 Setup Renderer 默认显示当前 plan 的项目绝对目标、Codex 用户级写入边界和新增、已一致、changed、managed-stale、uncertain 分类数量；完整安装明细的展开状态不参与确认。当前 plan 的确认框是“安装并继续”的唯一用户确认门槛，提示与按钮即时同步，plan digest 变化会清除旧确认、提示重新确认并聚焦更新后的摘要。",
      "basis": "生产 HTML、Renderer 状态逻辑与样式已实现该行为，静态契约、真实 Electron 页面和完整 ArcOrbit 测试共同验证。",
      "evidence": [
        "runtime/arcorbit/desktop/renderer/index.html",
        "runtime/arcorbit/desktop/renderer/renderer.js",
        "runtime/arcorbit/desktop/renderer/styles.css",
        "runtime/arcorbit/test/setup-readiness-electron.test.mjs",
        "Verification: ARCORBIT_ELECTRON_SETUP_TEST=1 node --test test/setup-readiness-electron.test.mjs — 1 passed, 0 failed",
        "Verification: npm run check — 414 tests, 404 passed, 10 environment-gated skips, 0 failed"
      ]
    }
  ],
  "state_impacts": [
    {
      "id": "IMPACT-SETUP-EXPERIENCE",
      "fact_id": "FACT-SETUP-CONFIRMATION-GATING",
      "fact_revision": 1,
      "target": {
        "kind": "software_decision",
        "ref": "experience_and_interaction",
        "revision": 43
      },
      "effect": "upheld",
      "reason": "该缺陷事实保留为历史观测；其暴露的隐式展开门槛现已被移除，默认摘要、单一确认条件、就地提示、即时反馈和失效恢复均已在生产页面实现。",
      "gap_ids": [],
      "evidence": [
        "arckit/interaction/setup-readiness/interaction.md",
        "runtime/arcorbit/desktop/renderer/index.html",
        "runtime/arcorbit/desktop/renderer/renderer.js",
        "runtime/arcorbit/test/setup-readiness-electron.test.mjs",
        "Verification: ARCORBIT_ELECTRON_SETUP_TEST=1 node --test test/setup-readiness-electron.test.mjs — 1 passed, 0 failed"
      ]
    },
    {
      "id": "IMPACT-SETUP-INTERACTION-INVARIANT",
      "fact_id": "FACT-SETUP-CONFIRMATION-GATING",
      "fact_revision": 1,
      "target": {
        "kind": "software_invariant",
        "ref": "interaction-expectations-remain-recoverable",
        "revision": null
      },
      "effect": "upheld",
      "reason": "Setup confirmation 的主路径、信息揭示、状态、反馈、失效恢复和可访问性现在均可从权威交互源恢复。",
      "gap_ids": [],
      "evidence": [
        "arckit/interaction/setup-readiness/interaction.md",
        "arckit/interaction/setup-readiness/default.html",
        "arckit/interaction/INDEX.md",
        "arckit/interaction/_map/feature-matrix.md"
      ]
    },
    {
      "id": "IMPACT-20260825-006-001",
      "fact_id": "FACT-20260825-006-001",
      "fact_revision": 1,
      "target": {
        "kind": "software_invariant",
        "ref": "accepted-facts-are-realized",
        "revision": null
      },
      "effect": "upheld",
      "reason": "生产 Renderer 现已直接兑现已接受的 Setup confirmation policy，且完整明细展开、确认切换和 plan 失效均有重复可运行的行为证据。",
      "gap_ids": [],
      "evidence": [
        "runtime/arcorbit/desktop/renderer/index.html",
        "runtime/arcorbit/desktop/renderer/renderer.js",
        "runtime/arcorbit/desktop/renderer/styles.css",
        "runtime/arcorbit/test/desktop-renderer.test.mjs",
        "runtime/arcorbit/test/setup-readiness-electron.test.mjs",
        "Verification: npm run check — 414 tests, 404 passed, 10 environment-gated skips, 0 failed"
      ]
    }
  ],
  "gaps": [
    {
      "id": "GAP-SETUP-CONFIRMATION-UX",
      "status": "resolved",
      "goal": "为安装计划查看、写入确认和主按钮状态建立显式、一致且可验收的 Setup 交互方案，并同步其权威交互策略与线框投影。",
      "reason": "后续 Renderer 实现依赖先明确确认是否仍需独立展开、页面如何引导未满足条件、复选框与主按钮如何反馈；这些稳定交互决策目前尚未成立。",
      "derived_from": [
        "case_intent",
        "FACT-SETUP-CONFIRMATION-GATING"
      ],
      "blocked_by": [],
      "priority_basis": {
        "blocking": "high：首次安装主路径可能停滞，用户无法进入 ArcOrbit。",
        "uncertainty": "medium：缺陷机制已确定，但最终确认与渐进揭示方式尚需形成稳定决策。",
        "risk": "medium：需保留写入目标知情确认，不能用降低安全确认强度换取易用性。",
        "user_impact": "high：直接影响所有首次安装或能力修复用户，尤其是新人。"
      },
      "responsibility": "agent",
      "evidence_required": [
        "更新后的 arckit/interaction/setup-readiness/interaction.md，明确主路径、状态、反馈和可访问性规则。",
        "同步的 setup-readiness 灰度线框投影，直接展示按钮禁用原因与下一步引导。",
        "覆盖计划未查看、已查看、未确认、已确认及状态失效的验收口径。"
      ],
      "resolution": {
        "id": "GAP-SETUP-CONFIRMATION-UX",
        "status": "resolved",
        "outcome": "Setup confirmation 交互方案已建立并完成源—投影一致性验证。",
        "reason": "关键写入边界默认可见，完整明细明确为可选；确认框成为唯一启用条件，未满足提示、即时状态变化、plan 失效重置和键盘反馈均已形成持久规则。",
        "evidence": [
          "arckit/interaction/setup-readiness/interaction.md",
          "arckit/interaction/setup-readiness/default.html",
          "arckit/interaction/INDEX.md",
          "arckit/interaction/_map/feature-matrix.md",
          "Verification: HTML structure OK — 8 complete states with balanced tags",
          "Verification: INDEX counts OK — default.html 115 lines, interaction.md 183 lines",
          "Verification: git diff --check passed"
        ],
        "occurred_at": "2026-08-25T11:36:26.975Z"
      }
    },
    {
      "id": "GAP-20260825-006-001",
      "status": "resolved",
      "goal": "在 ArcOrbit 生产 Renderer 中实现已接受的 Setup confirmation policy，并以行为测试证明展开完整明细不再影响主按钮。",
      "reason": "当前代码仍要求 setupPlanOpened 与确认框同时成立，实际软件尚未兑现本轮建立的稳定交互事实。",
      "derived_from": [
        "FACT-20260825-006-001",
        "FACT-SETUP-CONFIRMATION-GATING"
      ],
      "blocked_by": [],
      "priority_basis": {
        "blocking": "high：生产首次安装仍可能停滞。",
        "uncertainty": "low：目标状态和现有缺陷代码均已明确。",
        "risk": "medium：需保留 plan digest 与确认失效语义。",
        "user_impact": "high：直接影响新人安装路径。"
      },
      "responsibility": "agent",
      "evidence_required": [
        "Renderer 不再以 setupPlanOpened 作为安装按钮启用条件。",
        "页面默认呈现项目目标、Codex 用户级写入边界和变更摘要。",
        "确认框勾选、取消及 plan 失效时的按钮和说明状态测试。",
        "Electron 或等价真实页面验证，证明完整明细展开与否不影响确认结果。"
      ],
      "resolution": {
        "id": "GAP-20260825-006-001",
        "status": "resolved",
        "outcome": "生产 Renderer 已实现 Setup confirmation policy，并通过静态契约、真实 Electron 页面和完整 ArcOrbit 回归验证。",
        "reason": "`setupPlanOpened` 状态及其按钮合取条件已删除；项目绝对目标、Codex 用户级写入边界和完整变更分类默认可见，确认提示即时响应，plan digest 更新会清除旧确认并聚焦摘要。",
        "evidence": [
          "runtime/arcorbit/desktop/renderer/index.html",
          "runtime/arcorbit/desktop/renderer/renderer.js",
          "runtime/arcorbit/desktop/renderer/styles.css",
          "runtime/arcorbit/test/desktop-renderer.test.mjs",
          "runtime/arcorbit/test/setup-readiness-electron.test.mjs",
          "Verification: ARCORBIT_ELECTRON_SETUP_TEST=1 node --test test/setup-readiness-electron.test.mjs — 1 passed, 0 failed",
          "Verification: node --test test/desktop-renderer.test.mjs — 51 passed, 0 failed",
          "Verification: npm run check — 414 tests, 404 passed, 10 environment-gated skips, 0 failed",
          "Verification: git diff --check passed"
        ],
        "occurred_at": "2026-08-25T11:49:02.268Z"
      }
    }
  ],
  "content_revision": 2,
  "completion_review": {
    "status": "clean",
    "policy": {
      "initial_max_cycles": 10,
      "source": "runtime/arcorbit/config/case-policy.json",
      "snapshotted_at": "2026-08-25T11:28:05.754Z"
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
          "arckit/interaction/setup-readiness/interaction.md",
          "arckit/interaction/setup-readiness/default.html",
          "runtime/arcorbit/desktop/renderer/index.html",
          "runtime/arcorbit/desktop/renderer/renderer.js",
          "runtime/arcorbit/desktop/renderer/styles.css",
          "runtime/arcorbit/test/desktop-renderer.test.mjs",
          "runtime/arcorbit/test/setup-readiness-electron.test.mjs",
          "runtime/arcorbit/test/fixtures/setup-readiness-electron.mjs",
          "runtime/arcorbit/test/fixtures/setup-readiness-preload.cjs",
          "Review inspection: setupPlanOpened is absent; the apply button depends only on applying state and setupReviewed",
          "Review inspection: project targets and generated summary text are escaped before HTML projection",
          "Verification: node --test test/desktop-renderer.test.mjs — 51 passed, 0 failed",
          "Verification: ARCORBIT_ELECTRON_SETUP_TEST=1 node --test test/setup-readiness-electron.test.mjs — 1 passed, 0 failed outside the Electron-restricted sandbox",
          "Verification: npm run check — 414 tests, 404 passed, 10 environment-gated skips, 0 failed",
          "Verification: git diff --check passed"
        ],
        "occurred_at": "2026-08-25T11:51:46.039Z"
      }
    ],
    "evidence": [
      "arckit/interaction/setup-readiness/interaction.md",
      "arckit/interaction/setup-readiness/default.html",
      "runtime/arcorbit/desktop/renderer/index.html",
      "runtime/arcorbit/desktop/renderer/renderer.js",
      "runtime/arcorbit/desktop/renderer/styles.css",
      "runtime/arcorbit/test/desktop-renderer.test.mjs",
      "runtime/arcorbit/test/setup-readiness-electron.test.mjs",
      "runtime/arcorbit/test/fixtures/setup-readiness-electron.mjs",
      "runtime/arcorbit/test/fixtures/setup-readiness-preload.cjs",
      "Review inspection: setupPlanOpened is absent; the apply button depends only on applying state and setupReviewed",
      "Review inspection: project targets and generated summary text are escaped before HTML projection",
      "Verification: node --test test/desktop-renderer.test.mjs — 51 passed, 0 failed",
      "Verification: ARCORBIT_ELECTRON_SETUP_TEST=1 node --test test/setup-readiness-electron.test.mjs — 1 passed, 0 failed outside the Electron-restricted sandbox",
      "Verification: npm run check — 414 tests, 404 passed, 10 environment-gated skips, 0 failed",
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
      "goal": "建立 Setup 写入摘要、确认框、完整明细和安装主动作之间的稳定交互规则。",
      "outcome": "completed",
      "gap_selection": {
        "mode": "candidate",
        "basis": "当前 Case Gap 直接阻塞首次安装，用户影响高，且其事实、范围与交互证据已足以在本轮建立稳定方案；其余 Project Gap 与本页面确认路径无直接依赖。",
        "snapshot_token": "727969566b5d7970f4c2bc68058bb554ba115d5502f914ef06f4d8dde1ece945",
        "selected_ref": "case-gap:CASE-20260825-006:GAP-SETUP-CONFIRMATION-UX",
        "comparison_summary": "比较了 snapshot 中全部五个 persisted candidates；选择唯一 ready 且直接对应当前用户事项的 Setup confirmation Gap，四个 case-required Project Gap 延期。",
        "fresh_discovery_summary": "选择前未发现优先于当前 Setup Gap 的 fresh candidate；执行中发现的 Renderer 实现义务仅登记为后续 Gap。",
        "considered": [
          {
            "ref": "project-gap:GAP-agent-scenario-evaluation",
            "source": "persisted",
            "eligibility": "case_required",
            "disposition": "deferred",
            "priority_basis": {
              "blocking": "low：不阻塞当前 Setup 新人路径。",
              "uncertainty": "high",
              "risk": "high",
              "user_impact": "medium"
            },
            "reason": "需要独立 Case，且与当前确认交互没有直接依赖。"
          },
          {
            "ref": "project-gap:GAP-runtime-resilience-and-adapters",
            "source": "persisted",
            "eligibility": "case_required",
            "disposition": "deferred",
            "priority_basis": {
              "blocking": "medium",
              "uncertainty": "medium",
              "risk": "high",
              "user_impact": "medium"
            },
            "reason": "Runtime 韧性工作重要，但不解决当前首次安装按钮的隐式门槛。"
          },
          {
            "ref": "project-gap:GAP-security-real-project-validation",
            "source": "persisted",
            "eligibility": "case_required",
            "disposition": "deferred",
            "priority_basis": {
              "blocking": "medium",
              "uncertainty": "medium",
              "risk": "high",
              "user_impact": "medium"
            },
            "reason": "需要真实权限项目验证，与当前页面交互方案无直接依赖。"
          },
          {
            "ref": "project-gap:GAP-cross-record-audit",
            "source": "persisted",
            "eligibility": "case_required",
            "disposition": "deferred",
            "priority_basis": {
              "blocking": "medium",
              "uncertainty": "medium",
              "risk": "high",
              "user_impact": "medium"
            },
            "reason": "跨记录审计不阻塞当前 Setup 页面稳定交互事实的建立。"
          },
          {
            "ref": "case-gap:CASE-20260825-006:GAP-SETUP-CONFIRMATION-UX",
            "source": "persisted",
            "eligibility": "ready",
            "disposition": "selected",
            "priority_basis": {
              "blocking": "high：首次安装主路径可能停滞。",
              "uncertainty": "medium：缺陷机制已确定，需固化交互决策。",
              "risk": "medium：必须保留知情确认。",
              "user_impact": "high：直接影响首次安装和能力修复用户。"
            },
            "reason": "唯一直接覆盖当前用户问题且可在本轮形成完整、持久、可验证结论的候选。"
          }
        ]
      },
      "selected_gap": {
        "id": "GAP-SETUP-CONFIRMATION-UX",
        "responsibility": "agent",
        "goal": "为安装计划查看、写入确认和主按钮状态建立显式、一致且可验收的 Setup 交互方案，并同步其权威交互策略与线框投影。",
        "reason": "后续 Renderer 实现依赖先明确确认是否仍需独立展开、页面如何引导未满足条件、复选框与主按钮如何反馈；这些稳定交互决策目前尚未成立。",
        "derived_from": [
          "case_intent",
          "FACT-SETUP-CONFIRMATION-GATING"
        ],
        "blocked_by": [],
        "priority_basis": {
          "blocking": "high：首次安装主路径可能停滞，用户无法进入 ArcOrbit。",
          "uncertainty": "medium：缺陷机制已确定，但最终确认与渐进揭示方式尚需形成稳定决策。",
          "risk": "medium：需保留写入目标知情确认，不能用降低安全确认强度换取易用性。",
          "user_impact": "high：直接影响所有首次安装或能力修复用户，尤其是新人。"
        },
        "evidence_required": [
          "更新后的 arckit/interaction/setup-readiness/interaction.md，明确主路径、状态、反馈和可访问性规则。",
          "同步的 setup-readiness 灰度线框投影，直接展示按钮禁用原因与下一步引导。",
          "覆盖计划未查看、已查看、未确认、已确认及状态失效的验收口径。"
        ]
      },
      "planned_transition": {
        "goal": "建立 Setup 写入摘要、确认框、完整明细和安装主动作之间的稳定交互规则。",
        "expected_state_change": "setup-readiness 的权威交互策略、灰度线框、索引和状态矩阵共同表达无隐式展开门槛的确认路径。"
      },
      "accepted_state_delta": {
        "resolved_gap": {
          "id": "GAP-SETUP-CONFIRMATION-UX",
          "status": "resolved",
          "outcome": "Setup confirmation 交互方案已建立并完成源—投影一致性验证。",
          "reason": "关键写入边界默认可见，完整明细明确为可选；确认框成为唯一启用条件，未满足提示、即时状态变化、plan 失效重置和键盘反馈均已形成持久规则。",
          "evidence": [
            "arckit/interaction/setup-readiness/interaction.md",
            "arckit/interaction/setup-readiness/default.html",
            "arckit/interaction/INDEX.md",
            "arckit/interaction/_map/feature-matrix.md",
            "Verification: HTML structure OK — 8 complete states with balanced tags",
            "Verification: INDEX counts OK — default.html 115 lines, interaction.md 183 lines",
            "Verification: git diff --check passed"
          ]
        },
        "facts_added": [
          {
            "id": "FACT-20260825-006-001",
            "revision": 1,
            "status": "accepted",
            "statement": "Setup 安装计划的项目绝对目标、Codex 用户级写入边界和变更分类数量默认可见；完整安装明细是可选信息，不参与启用判断。当前 plan 的确认框是“安装并继续”的唯一用户确认门槛，未确认原因在同一动作区域显示，勾选或取消会即时更新提示和按钮，plan 变化会清除旧确认并要求重新确认。",
            "basis": "该方案同时消除隐式依赖、保留写入知情确认，并已同步到权威交互策略及其线框投影。",
            "evidence": [
              "arckit/interaction/setup-readiness/interaction.md",
              "arckit/interaction/setup-readiness/default.html",
              "arckit/interaction/_map/feature-matrix.md"
            ]
          }
        ],
        "facts_superseded": [],
        "impacts_added": [
          {
            "id": "IMPACT-20260825-006-001",
            "fact_id": "FACT-20260825-006-001",
            "fact_revision": 1,
            "target": {
              "kind": "software_invariant",
              "ref": "accepted-facts-are-realized",
              "revision": null
            },
            "effect": "threatened",
            "reason": "稳定交互事实已经成立，但生产 Renderer 仍以 setupPlanOpened 和确认框的合取条件控制主按钮。",
            "gap_ids": [
              "GAP-20260825-006-001"
            ],
            "evidence": [
              "runtime/arcorbit/desktop/renderer/renderer.js:315-319",
              "runtime/arcorbit/desktop/renderer/renderer.js:668-670",
              "runtime/arcorbit/desktop/renderer/index.html:48-63"
            ]
          }
        ],
        "impacts_updated": [
          {
            "id": "IMPACT-SETUP-EXPERIENCE",
            "fact_id": "FACT-SETUP-CONFIRMATION-GATING",
            "fact_revision": 1,
            "target": {
              "kind": "software_decision",
              "ref": "experience_and_interaction",
              "revision": 43
            },
            "effect": "threatened",
            "reason": "交互预期已经明确，但实际页面仍需实现默认可见摘要、单一确认条件和就地状态说明。",
            "gap_ids": [
              "GAP-20260825-006-001"
            ],
            "evidence": [
              "arckit/interaction/setup-readiness/interaction.md",
              "runtime/arcorbit/desktop/renderer/renderer.js:668-670"
            ]
          },
          {
            "id": "IMPACT-SETUP-INTERACTION-INVARIANT",
            "fact_id": "FACT-SETUP-CONFIRMATION-GATING",
            "fact_revision": 1,
            "target": {
              "kind": "software_invariant",
              "ref": "interaction-expectations-remain-recoverable",
              "revision": null
            },
            "effect": "upheld",
            "reason": "Setup confirmation 的主路径、信息揭示、状态、反馈、失效恢复和可访问性现在均可从权威交互源恢复。",
            "gap_ids": [],
            "evidence": [
              "arckit/interaction/setup-readiness/interaction.md",
              "arckit/interaction/setup-readiness/default.html",
              "arckit/interaction/INDEX.md",
              "arckit/interaction/_map/feature-matrix.md"
            ]
          }
        ],
        "gaps_added": [
          {
            "id": "GAP-20260825-006-001",
            "status": "open",
            "goal": "在 ArcOrbit 生产 Renderer 中实现已接受的 Setup confirmation policy，并以行为测试证明展开完整明细不再影响主按钮。",
            "reason": "当前代码仍要求 setupPlanOpened 与确认框同时成立，实际软件尚未兑现本轮建立的稳定交互事实。",
            "derived_from": [
              "FACT-20260825-006-001",
              "FACT-SETUP-CONFIRMATION-GATING"
            ],
            "blocked_by": [],
            "priority_basis": {
              "blocking": "high：生产首次安装仍可能停滞。",
              "uncertainty": "low：目标状态和现有缺陷代码均已明确。",
              "risk": "medium：需保留 plan digest 与确认失效语义。",
              "user_impact": "high：直接影响新人安装路径。"
            },
            "responsibility": "agent",
            "evidence_required": [
              "Renderer 不再以 setupPlanOpened 作为安装按钮启用条件。",
              "页面默认呈现项目目标、Codex 用户级写入边界和变更摘要。",
              "确认框勾选、取消及 plan 失效时的按钮和说明状态测试。",
              "Electron 或等价真实页面验证，证明完整明细展开与否不影响确认结果。"
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
        "project_revision": 244,
        "judgments": [
          {
            "invariant_ref": "product-expectations-remain-recoverable",
            "disposition": "not_relevant",
            "reason": "本轮只澄清既有 Setup 能力内的页面推进与反馈，没有建立或改变产品能力、范围或业务结果。",
            "fact_refs": [],
            "evidence": [],
            "gap_refs": []
          },
          {
            "invariant_ref": "interaction-expectations-remain-recoverable",
            "disposition": "upheld",
            "reason": "确认主路径、信息揭示、按钮门槛、即时反馈、plan 失效恢复和键盘状态均已写入权威交互事实并同步线框。",
            "fact_refs": [
              "FACT-20260825-006-001"
            ],
            "evidence": [
              "arckit/interaction/setup-readiness/interaction.md",
              "arckit/interaction/setup-readiness/default.html",
              "arckit/interaction/INDEX.md",
              "arckit/interaction/_map/feature-matrix.md"
            ],
            "gap_refs": []
          },
          {
            "invariant_ref": "visual-language-remains-consistent",
            "disposition": "not_relevant",
            "reason": "本轮线框只调整灰度信息层级和交互状态，没有建立或改变主题、Token、品牌或组件视觉语言。",
            "fact_refs": [],
            "evidence": [],
            "gap_refs": []
          },
          {
            "invariant_ref": "technical-decisions-remain-explainable",
            "disposition": "not_relevant",
            "reason": "本轮未改变架构、数据、接口、权限或 Runtime 技术边界。",
            "fact_refs": [],
            "evidence": [],
            "gap_refs": []
          },
          {
            "invariant_ref": "accepted-facts-are-realized",
            "disposition": "threatened",
            "reason": "权威交互事实已经成立，但生产 Renderer 仍保留 setupPlanOpened 隐式条件，实际页面尚未兑现。",
            "fact_refs": [
              "FACT-20260825-006-001",
              "FACT-SETUP-CONFIRMATION-GATING"
            ],
            "evidence": [
              "runtime/arcorbit/desktop/renderer/renderer.js:315-319",
              "runtime/arcorbit/desktop/renderer/renderer.js:668-670"
            ],
            "gap_refs": [
              "GAP-20260825-006-001"
            ]
          },
          {
            "invariant_ref": "material-risks-have-credible-evidence",
            "disposition": "upheld",
            "reason": "新人阻塞风险由用户报告和实际按钮条件共同证明；知情确认未被削弱，交互方案持续要求当前 plan 的显式确认并定义失效重置。",
            "fact_refs": [
              "FACT-SETUP-CONFIRMATION-GATING",
              "FACT-20260825-006-001"
            ],
            "evidence": [
              "Current operator input, 2026-08-25",
              "runtime/arcorbit/desktop/renderer/renderer.js:668-670",
              "arckit/interaction/setup-readiness/interaction.md"
            ],
            "gap_refs": []
          }
        ]
      },
      "evidence": [
        "arckit/interaction/setup-readiness/interaction.md",
        "arckit/interaction/setup-readiness/default.html",
        "arckit/interaction/INDEX.md",
        "arckit/interaction/_map/feature-matrix.md",
        "Verification: HTML structure OK — 8 complete states with balanced tags",
        "Verification: INDEX counts OK — default.html 115 lines, interaction.md 183 lines",
        "Verification: git diff --check passed"
      ],
      "runtime_result_ref": "arckit-runtime://runs/RUN-20260825-112551856Z-853043cb",
      "occurred_at": "2026-08-25T11:36:26.975Z"
    },
    {
      "round": 2,
      "transition_schema_version": "arckit-case-transition/v8",
      "goal": "在生产 Renderer 中实现已接受的 Setup confirmation policy，并证明完整明细展开状态不再参与主按钮启用判断。",
      "outcome": "completed",
      "gap_selection": {
        "mode": "candidate",
        "basis": "当前 Case Gap 是 snapshot 中唯一 ready 候选，直接阻塞首次安装主路径且目标状态、根因和验收口径均已成立；四个 Project Gap 均需独立 Case。",
        "snapshot_token": "2982d903efa781d73c232881c209b8d5e75bfe1e34756fda97e524b491ac8f74",
        "selected_ref": "case-gap:CASE-20260825-006:GAP-20260825-006-001",
        "comparison_summary": "比较了全部五个 persisted candidates；选择唯一 ready、直接兑现当前 Setup 交互事实的生产实现 Gap，四个 case-required Project Gap 延期。",
        "fresh_discovery_summary": "执行前及实现验证中均未发现优先于当前 Gap 的 fresh candidate；未产生新的普通实现义务。",
        "considered": [
          {
            "ref": "project-gap:GAP-agent-scenario-evaluation",
            "source": "persisted",
            "eligibility": "case_required",
            "disposition": "deferred",
            "priority_basis": {
              "blocking": "low：不阻塞当前 Setup 首次安装路径。",
              "uncertainty": "high",
              "risk": "high",
              "user_impact": "medium"
            },
            "reason": "需要独立 Case 验证多类真实软件场景，与当前 Renderer 确认门槛无直接依赖。"
          },
          {
            "ref": "project-gap:GAP-runtime-resilience-and-adapters",
            "source": "persisted",
            "eligibility": "case_required",
            "disposition": "deferred",
            "priority_basis": {
              "blocking": "medium",
              "uncertainty": "medium",
              "risk": "high",
              "user_impact": "medium"
            },
            "reason": "Runtime 韧性工作重要，但不能兑现当前 Setup confirmation policy。"
          },
          {
            "ref": "project-gap:GAP-security-real-project-validation",
            "source": "persisted",
            "eligibility": "case_required",
            "disposition": "deferred",
            "priority_basis": {
              "blocking": "medium",
              "uncertainty": "medium",
              "risk": "high",
              "user_impact": "medium"
            },
            "reason": "需要真实权限项目和独立 Case，不影响当前项目级写入确认实现。"
          },
          {
            "ref": "project-gap:GAP-cross-record-audit",
            "source": "persisted",
            "eligibility": "case_required",
            "disposition": "deferred",
            "priority_basis": {
              "blocking": "medium",
              "uncertainty": "medium",
              "risk": "high",
              "user_impact": "medium"
            },
            "reason": "跨记录审计不阻塞当前生产页面对既有交互事实的兑现。"
          },
          {
            "ref": "case-gap:CASE-20260825-006:GAP-20260825-006-001",
            "source": "persisted",
            "eligibility": "ready",
            "disposition": "selected",
            "priority_basis": {
              "blocking": "high：生产首次安装仍可能停滞。",
              "uncertainty": "low：目标状态和缺陷代码均已明确。",
              "risk": "medium：必须保留 plan digest 与确认失效语义。",
              "user_impact": "high：直接影响新人安装路径。"
            },
            "reason": "唯一可在本轮直接关闭当前事实—实现差距并提供真实页面证据的候选。"
          }
        ]
      },
      "selected_gap": {
        "id": "GAP-20260825-006-001",
        "responsibility": "agent",
        "goal": "在 ArcOrbit 生产 Renderer 中实现已接受的 Setup confirmation policy，并以行为测试证明展开完整明细不再影响主按钮。",
        "reason": "当前代码仍要求 setupPlanOpened 与确认框同时成立，实际软件尚未兑现本轮建立的稳定交互事实。",
        "derived_from": [
          "FACT-20260825-006-001",
          "FACT-SETUP-CONFIRMATION-GATING"
        ],
        "blocked_by": [],
        "priority_basis": {
          "blocking": "high：生产首次安装仍可能停滞。",
          "uncertainty": "low：目标状态和现有缺陷代码均已明确。",
          "risk": "medium：需保留 plan digest 与确认失效语义。",
          "user_impact": "high：直接影响新人安装路径。"
        },
        "evidence_required": [
          "Renderer 不再以 setupPlanOpened 作为安装按钮启用条件。",
          "页面默认呈现项目目标、Codex 用户级写入边界和变更摘要。",
          "确认框勾选、取消及 plan 失效时的按钮和说明状态测试。",
          "Electron 或等价真实页面验证，证明完整明细展开与否不影响确认结果。"
        ]
      },
      "planned_transition": {
        "goal": "在生产 Renderer 中实现已接受的 Setup confirmation policy，并证明完整明细展开状态不再参与主按钮启用判断。",
        "expected_state_change": "生产页面默认呈现必要写入摘要，以当前 plan 的确认框作为唯一门槛，并在 digest 变化时清除旧确认；对应受威胁影响转为 upheld。"
      },
      "accepted_state_delta": {
        "resolved_gap": {
          "id": "GAP-20260825-006-001",
          "status": "resolved",
          "outcome": "生产 Renderer 已实现 Setup confirmation policy，并通过静态契约、真实 Electron 页面和完整 ArcOrbit 回归验证。",
          "reason": "`setupPlanOpened` 状态及其按钮合取条件已删除；项目绝对目标、Codex 用户级写入边界和完整变更分类默认可见，确认提示即时响应，plan digest 更新会清除旧确认并聚焦摘要。",
          "evidence": [
            "runtime/arcorbit/desktop/renderer/index.html",
            "runtime/arcorbit/desktop/renderer/renderer.js",
            "runtime/arcorbit/desktop/renderer/styles.css",
            "runtime/arcorbit/test/desktop-renderer.test.mjs",
            "runtime/arcorbit/test/setup-readiness-electron.test.mjs",
            "Verification: ARCORBIT_ELECTRON_SETUP_TEST=1 node --test test/setup-readiness-electron.test.mjs — 1 passed, 0 failed",
            "Verification: node --test test/desktop-renderer.test.mjs — 51 passed, 0 failed",
            "Verification: npm run check — 414 tests, 404 passed, 10 environment-gated skips, 0 failed",
            "Verification: git diff --check passed"
          ]
        },
        "facts_added": [
          {
            "id": "FACT-20260825-006-002",
            "revision": 1,
            "status": "accepted",
            "statement": "ArcOrbit 生产 Setup Renderer 默认显示当前 plan 的项目绝对目标、Codex 用户级写入边界和新增、已一致、changed、managed-stale、uncertain 分类数量；完整安装明细的展开状态不参与确认。当前 plan 的确认框是“安装并继续”的唯一用户确认门槛，提示与按钮即时同步，plan digest 变化会清除旧确认、提示重新确认并聚焦更新后的摘要。",
            "basis": "生产 HTML、Renderer 状态逻辑与样式已实现该行为，静态契约、真实 Electron 页面和完整 ArcOrbit 测试共同验证。",
            "evidence": [
              "runtime/arcorbit/desktop/renderer/index.html",
              "runtime/arcorbit/desktop/renderer/renderer.js",
              "runtime/arcorbit/desktop/renderer/styles.css",
              "runtime/arcorbit/test/setup-readiness-electron.test.mjs",
              "Verification: ARCORBIT_ELECTRON_SETUP_TEST=1 node --test test/setup-readiness-electron.test.mjs — 1 passed, 0 failed",
              "Verification: npm run check — 414 tests, 404 passed, 10 environment-gated skips, 0 failed"
            ]
          }
        ],
        "facts_superseded": [],
        "impacts_added": [],
        "impacts_updated": [
          {
            "id": "IMPACT-SETUP-EXPERIENCE",
            "fact_id": "FACT-SETUP-CONFIRMATION-GATING",
            "fact_revision": 1,
            "target": {
              "kind": "software_decision",
              "ref": "experience_and_interaction",
              "revision": 43
            },
            "effect": "upheld",
            "reason": "该缺陷事实保留为历史观测；其暴露的隐式展开门槛现已被移除，默认摘要、单一确认条件、就地提示、即时反馈和失效恢复均已在生产页面实现。",
            "gap_ids": [],
            "evidence": [
              "arckit/interaction/setup-readiness/interaction.md",
              "runtime/arcorbit/desktop/renderer/index.html",
              "runtime/arcorbit/desktop/renderer/renderer.js",
              "runtime/arcorbit/test/setup-readiness-electron.test.mjs",
              "Verification: ARCORBIT_ELECTRON_SETUP_TEST=1 node --test test/setup-readiness-electron.test.mjs — 1 passed, 0 failed"
            ]
          },
          {
            "id": "IMPACT-20260825-006-001",
            "fact_id": "FACT-20260825-006-001",
            "fact_revision": 1,
            "target": {
              "kind": "software_invariant",
              "ref": "accepted-facts-are-realized",
              "revision": null
            },
            "effect": "upheld",
            "reason": "生产 Renderer 现已直接兑现已接受的 Setup confirmation policy，且完整明细展开、确认切换和 plan 失效均有重复可运行的行为证据。",
            "gap_ids": [],
            "evidence": [
              "runtime/arcorbit/desktop/renderer/index.html",
              "runtime/arcorbit/desktop/renderer/renderer.js",
              "runtime/arcorbit/desktop/renderer/styles.css",
              "runtime/arcorbit/test/desktop-renderer.test.mjs",
              "runtime/arcorbit/test/setup-readiness-electron.test.mjs",
              "Verification: npm run check — 414 tests, 404 passed, 10 environment-gated skips, 0 failed"
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
        "project_revision": 244,
        "judgments": [
          {
            "invariant_ref": "product-expectations-remain-recoverable",
            "disposition": "not_relevant",
            "reason": "本轮只兑现既有 Setup 交互事实，没有建立或改变产品能力、范围、业务规则或成功结果。",
            "fact_refs": [],
            "evidence": [],
            "gap_refs": []
          },
          {
            "invariant_ref": "interaction-expectations-remain-recoverable",
            "disposition": "upheld",
            "reason": "权威交互源与生产页面现共同表达默认摘要、单一确认门槛、即时反馈、可选明细和 plan 失效恢复。",
            "fact_refs": [
              "FACT-20260825-006-001",
              "FACT-20260825-006-002"
            ],
            "evidence": [
              "arckit/interaction/setup-readiness/interaction.md",
              "arckit/interaction/setup-readiness/default.html",
              "runtime/arcorbit/desktop/renderer/index.html",
              "runtime/arcorbit/desktop/renderer/renderer.js",
              "runtime/arcorbit/test/setup-readiness-electron.test.mjs"
            ],
            "gap_refs": []
          },
          {
            "invariant_ref": "visual-language-remains-consistent",
            "disposition": "upheld",
            "reason": "新增默认摘要和确认提示沿用既有 ArcOrbit 色彩 Token、间距、边框、字体和响应式 Setup 骨架，没有建立平行视觉语言。",
            "fact_refs": [
              "FACT-20260825-006-001",
              "FACT-20260825-006-002"
            ],
            "evidence": [
              "arckit/visual/_library/brief.md",
              "arckit/visual/_library/design-tokens.yaml",
              "runtime/arcorbit/desktop/renderer/index.html",
              "runtime/arcorbit/desktop/renderer/styles.css"
            ],
            "gap_refs": []
          },
          {
            "invariant_ref": "technical-decisions-remain-explainable",
            "disposition": "not_relevant",
            "reason": "本轮未改变 Renderer/main-process 权限边界、IPC、持久化模型、安装事务或 Runtime 架构。",
            "fact_refs": [],
            "evidence": [],
            "gap_refs": []
          },
          {
            "invariant_ref": "accepted-facts-are-realized",
            "disposition": "upheld",
            "reason": "生产 Renderer 已实现接受的确认策略；静态测试和真实 Electron 页面均证明完整明细不再参与启用判断，digest 变化仍会使确认失效。",
            "fact_refs": [
              "FACT-20260825-006-001",
              "FACT-20260825-006-002"
            ],
            "evidence": [
              "runtime/arcorbit/desktop/renderer/index.html",
              "runtime/arcorbit/desktop/renderer/renderer.js",
              "runtime/arcorbit/desktop/renderer/styles.css",
              "runtime/arcorbit/test/desktop-renderer.test.mjs",
              "runtime/arcorbit/test/setup-readiness-electron.test.mjs",
              "Verification: ARCORBIT_ELECTRON_SETUP_TEST=1 node --test test/setup-readiness-electron.test.mjs — 1 passed, 0 failed"
            ],
            "gap_refs": []
          },
          {
            "invariant_ref": "material-risks-have-credible-evidence",
            "disposition": "upheld",
            "reason": "新人停滞风险已由必要修复消除，同时当前 plan 的知情确认和 digest 失效语义被保留；专项 Electron 测试和完整回归提供重复、成比例的证据。",
            "fact_refs": [
              "FACT-20260825-006-001",
              "FACT-20260825-006-002"
            ],
            "evidence": [
              "runtime/arcorbit/test/desktop-renderer.test.mjs",
              "runtime/arcorbit/test/setup-readiness-electron.test.mjs",
              "Verification: ARCORBIT_ELECTRON_SETUP_TEST=1 node --test test/setup-readiness-electron.test.mjs — 1 passed, 0 failed",
              "Verification: npm run check — 414 tests, 404 passed, 10 environment-gated skips, 0 failed",
              "Verification: no ARC_DEBUG markers or temporary console logging remain in touched Setup files"
            ],
            "gap_refs": []
          }
        ]
      },
      "evidence": [
        "runtime/arcorbit/desktop/renderer/index.html",
        "runtime/arcorbit/desktop/renderer/renderer.js",
        "runtime/arcorbit/desktop/renderer/styles.css",
        "runtime/arcorbit/test/desktop-renderer.test.mjs",
        "runtime/arcorbit/test/fixtures/setup-readiness-electron.mjs",
        "runtime/arcorbit/test/fixtures/setup-readiness-preload.cjs",
        "runtime/arcorbit/test/setup-readiness-electron.test.mjs",
        "Verification: node --test test/desktop-renderer.test.mjs — 51 passed, 0 failed",
        "Verification: ARCORBIT_ELECTRON_SETUP_TEST=1 node --test test/setup-readiness-electron.test.mjs — 1 passed, 0 failed",
        "Verification: npm run check — 414 tests, 404 passed, 10 environment-gated skips, 0 failed",
        "Verification: git diff --check passed"
      ],
      "runtime_result_ref": "arckit-runtime://runs/RUN-20260825-112551856Z-853043cb",
      "occurred_at": "2026-08-25T11:49:02.268Z"
    },
    {
      "round": 3,
      "transition_schema_version": "arckit-case-transition/v8",
      "goal": "独立复核 Setup confirmation 实现的正确性、真实问题解决、验证可信度、回归风险与最小性。",
      "outcome": "completed",
      "gap_selection": {
        "mode": "candidate",
        "basis": "当前 Case 的全部普通 Gap 与 state impact 已关闭；Completion Review 是 snapshot 中唯一 ready 且直接阻塞 Case 收口的候选，四个 Project Gap 均需独立 Case。",
        "snapshot_token": "4629c236a414ebb46f7ae9234df2655dd6c96b32d89b9d3430df8100b7d6a12f",
        "selected_ref": "case-gap:CASE-20260825-006:CASE-20260825-006:completion-review:1",
        "comparison_summary": "比较了全部五个 persisted candidates；选择唯一 ready 的 CASE-20260825-006 Completion Review，四个 case-required Project Gap 延期。",
        "fresh_discovery_summary": "审查实现差异、专项测试与真实 Electron 行为时未发现 fresh candidate 或 review finding。",
        "considered": [
          {
            "ref": "project-gap:GAP-agent-scenario-evaluation",
            "source": "persisted",
            "eligibility": "case_required",
            "disposition": "deferred",
            "priority_basis": {
              "blocking": "low：不阻塞当前 Setup Case 的完成审查。",
              "uncertainty": "high",
              "risk": "high",
              "user_impact": "medium"
            },
            "reason": "需要独立 Case 验证动态 Gap 选择场景，与当前 Setup 实现审查没有直接依赖。"
          },
          {
            "ref": "project-gap:GAP-runtime-resilience-and-adapters",
            "source": "persisted",
            "eligibility": "case_required",
            "disposition": "deferred",
            "priority_basis": {
              "blocking": "medium",
              "uncertainty": "medium",
              "risk": "high",
              "user_impact": "medium"
            },
            "reason": "Runtime 韧性与 adapter 工作需要独立 Case，不影响当前 Setup 实现的五维审查。"
          },
          {
            "ref": "project-gap:GAP-security-real-project-validation",
            "source": "persisted",
            "eligibility": "case_required",
            "disposition": "deferred",
            "priority_basis": {
              "blocking": "medium",
              "uncertainty": "medium",
              "risk": "high",
              "user_impact": "medium"
            },
            "reason": "需要真实权限项目及独立 Case；当前 Setup 变更未扩展权限或凭据边界。"
          },
          {
            "ref": "project-gap:GAP-cross-record-audit",
            "source": "persisted",
            "eligibility": "case_required",
            "disposition": "deferred",
            "priority_basis": {
              "blocking": "medium",
              "uncertainty": "medium",
              "risk": "high",
              "user_impact": "medium"
            },
            "reason": "跨记录审计不阻塞当前已闭合 Case 的 implementation-focused review。"
          },
          {
            "ref": "case-gap:CASE-20260825-006:CASE-20260825-006:completion-review:1",
            "source": "persisted",
            "eligibility": "ready",
            "disposition": "selected",
            "priority_basis": {
              "blocking": "high：这是 Case resolved 前的唯一剩余门禁。",
              "uncertainty": "low：实现范围与验收事实均已确定。",
              "risk": "high：必须独立检查真实问题解决和回归证据。",
              "user_impact": "high：直接决定新人安装路径能否可信收口。"
            },
            "reason": "唯一可在本轮完成且直接推进当前 Case 收口的候选。"
          }
        ]
      },
      "selected_gap": {
        "id": "CASE-20260825-006:completion-review:1",
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
        "goal": "独立复核 Setup confirmation 实现的正确性、真实问题解决、验证可信度、回归风险与最小性。",
        "expected_state_change": "Completion Review 从 pending 转为 clean；不产生 Case 内容变更或后续修复 Gap。"
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
            "arckit/interaction/setup-readiness/interaction.md",
            "arckit/interaction/setup-readiness/default.html",
            "runtime/arcorbit/desktop/renderer/index.html",
            "runtime/arcorbit/desktop/renderer/renderer.js",
            "runtime/arcorbit/desktop/renderer/styles.css",
            "runtime/arcorbit/test/desktop-renderer.test.mjs",
            "runtime/arcorbit/test/setup-readiness-electron.test.mjs",
            "runtime/arcorbit/test/fixtures/setup-readiness-electron.mjs",
            "runtime/arcorbit/test/fixtures/setup-readiness-preload.cjs",
            "Review inspection: setupPlanOpened is absent; the apply button depends only on applying state and setupReviewed",
            "Review inspection: project targets and generated summary text are escaped before HTML projection",
            "Verification: node --test test/desktop-renderer.test.mjs — 51 passed, 0 failed",
            "Verification: ARCORBIT_ELECTRON_SETUP_TEST=1 node --test test/setup-readiness-electron.test.mjs — 1 passed, 0 failed outside the Electron-restricted sandbox",
            "Verification: npm run check — 414 tests, 404 passed, 10 environment-gated skips, 0 failed",
            "Verification: git diff --check passed"
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
        "project_revision": 244,
        "judgments": [
          {
            "invariant_ref": "product-expectations-remain-recoverable",
            "disposition": "not_relevant",
            "reason": "Completion Review 仅检查既有 Setup 能力的实现质量，没有建立或改变产品范围、能力、业务规则或成功结果。",
            "fact_refs": [],
            "evidence": [],
            "gap_refs": []
          },
          {
            "invariant_ref": "interaction-expectations-remain-recoverable",
            "disposition": "upheld",
            "reason": "权威交互源与生产页面一致表达默认摘要、单一确认门槛、可选明细、即时反馈和 plan 失效恢复，专项真实页面验证覆盖关键状态。",
            "fact_refs": [
              "FACT-20260825-006-001",
              "FACT-20260825-006-002"
            ],
            "evidence": [
              "arckit/interaction/setup-readiness/interaction.md",
              "arckit/interaction/setup-readiness/default.html",
              "runtime/arcorbit/desktop/renderer/index.html",
              "runtime/arcorbit/desktop/renderer/renderer.js",
              "runtime/arcorbit/test/setup-readiness-electron.test.mjs"
            ],
            "gap_refs": []
          },
          {
            "invariant_ref": "visual-language-remains-consistent",
            "disposition": "upheld",
            "reason": "默认摘要和确认反馈继续使用既有 ArcOrbit Token、排版、间距、边框与 Setup 响应式骨架，审查未发现平行视觉规则或不必要的视觉扩张。",
            "fact_refs": [
              "FACT-20260825-006-001",
              "FACT-20260825-006-002"
            ],
            "evidence": [
              "arckit/visual/_library/brief.md",
              "arckit/visual/_library/design-tokens.yaml",
              "runtime/arcorbit/desktop/renderer/index.html",
              "runtime/arcorbit/desktop/renderer/styles.css"
            ],
            "gap_refs": []
          },
          {
            "invariant_ref": "technical-decisions-remain-explainable",
            "disposition": "not_relevant",
            "reason": "实现与审查均未改变 Renderer/main-process 权限边界、IPC、持久化模型、安装事务、Runtime 架构或外部集成。",
            "fact_refs": [],
            "evidence": [],
            "gap_refs": []
          },
          {
            "invariant_ref": "accepted-facts-are-realized",
            "disposition": "upheld",
            "reason": "生产 Renderer 直接兑现已接受的 Setup confirmation policy；代码检查与真实 Electron 行为共同证明完整明细展开状态不参与启用判断，digest 更新会清除旧确认并给出恢复反馈。",
            "fact_refs": [
              "FACT-20260825-006-001",
              "FACT-20260825-006-002"
            ],
            "evidence": [
              "runtime/arcorbit/desktop/renderer/index.html",
              "runtime/arcorbit/desktop/renderer/renderer.js",
              "runtime/arcorbit/desktop/renderer/styles.css",
              "runtime/arcorbit/test/desktop-renderer.test.mjs",
              "runtime/arcorbit/test/setup-readiness-electron.test.mjs",
              "Verification: node --test test/desktop-renderer.test.mjs — 51 passed, 0 failed",
              "Verification: ARCORBIT_ELECTRON_SETUP_TEST=1 node --test test/setup-readiness-electron.test.mjs — 1 passed, 0 failed"
            ],
            "gap_refs": []
          },
          {
            "invariant_ref": "material-risks-have-credible-evidence",
            "disposition": "upheld",
            "reason": "新人停滞风险已消除，同时当前 plan 的知情确认与 digest 失效语义得到保留；静态契约、真实 Renderer 场景和完整回归构成重复且成比例的证据。",
            "fact_refs": [
              "FACT-20260825-006-001",
              "FACT-20260825-006-002"
            ],
            "evidence": [
              "runtime/arcorbit/test/desktop-renderer.test.mjs",
              "runtime/arcorbit/test/setup-readiness-electron.test.mjs",
              "Verification: node --test test/desktop-renderer.test.mjs — 51 passed, 0 failed",
              "Verification: ARCORBIT_ELECTRON_SETUP_TEST=1 node --test test/setup-readiness-electron.test.mjs — 1 passed, 0 failed",
              "Verification: npm run check — 414 tests, 404 passed, 10 environment-gated skips, 0 failed",
              "Verification: git diff --check passed"
            ],
            "gap_refs": []
          }
        ]
      },
      "evidence": [
        "arckit/interaction/setup-readiness/interaction.md",
        "runtime/arcorbit/desktop/renderer/index.html",
        "runtime/arcorbit/desktop/renderer/renderer.js",
        "runtime/arcorbit/desktop/renderer/styles.css",
        "runtime/arcorbit/test/desktop-renderer.test.mjs",
        "runtime/arcorbit/test/setup-readiness-electron.test.mjs",
        "Verification: node --test test/desktop-renderer.test.mjs — 51 passed, 0 failed",
        "Verification: ARCORBIT_ELECTRON_SETUP_TEST=1 node --test test/setup-readiness-electron.test.mjs — 1 passed, 0 failed",
        "Verification: npm run check — 414 tests, 404 passed, 10 environment-gated skips, 0 failed",
        "Verification: git diff --check passed"
      ],
      "runtime_result_ref": "arckit-runtime://runs/RUN-20260825-112551856Z-853043cb",
      "occurred_at": "2026-08-25T11:51:46.039Z"
    }
  ],
  "case_resolution": {
    "status": "resolved",
    "stage": "resolved",
    "satisfied": [
      "GAP-SETUP-CONFIRMATION-UX",
      "GAP-20260825-006-001"
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
    "updated_at": "2026-08-25T11:51:46.039Z"
  }
}
```

## Round Notes

- Case history is canonical in Structured Record.rounds; keep prose notes exceptional.
