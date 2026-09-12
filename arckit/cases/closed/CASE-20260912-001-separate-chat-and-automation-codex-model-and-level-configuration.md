# Separate Chat and Automation Codex model and level configuration

Case: CASE-20260912-001
Status: closed
Artifact Type: mixed
Selected Gap: none
Updated: 2026-09-12T04:21:28.956Z

## User Intent

将 Codex Model 与 Level 配置按 Chat 和 Automation 场景拆分，并在 Chat 输入框附近提供可直接调整当前对话后续消息所用 Model 与 Level 的快捷入口。

## Structured Record

```json
{
  "schema_version": "development-case-record/v5",
  "id": "CASE-20260912-001",
  "title": "Separate Chat and Automation Codex model and level configuration",
  "status": "closed",
  "artifact_type": "mixed",
  "created_at": "2026-09-12T03:33:06.897Z",
  "updated_at": "2026-09-12T04:21:28.956Z",
  "user_intent": "将 Codex Model 与 Level 配置按 Chat 和 Automation 场景拆分，并在 Chat 输入框附近提供可直接调整当前对话后续消息所用 Model 与 Level 的快捷入口。",
  "expected_outcome": "ArcOrbit 分别持久化并消费 Chat 与 Automation 的 Model/Level 默认值；Chat Composer 可查看和调整后续 Chat turn 使用的值，保持原 thread 连续性且不改变 Automation 默认值；已启动的 Chat turn 和 Automation Run 配置保持固定；既有共享配置得到兼容迁移，并具备稳定产品、交互、技术契约和回归证据。",
  "project_state_ref": "arckit/project/state.record.json",
  "current_round": {
    "goal": "",
    "selected_gap": null
  },
  "facts": [
    {
      "id": "FACT-20260912-001-001",
      "revision": 1,
      "status": "accepted",
      "statement": "用户要求 Codex 的 Model 与 Level 配置区分 Chat 和 Automation 场景，同时 Chat 输入框支持快速直接调整当前对话使用的 Model 与 Level。",
      "basis": "当前操作者输入直接定义本次产品改动目标。",
      "evidence": [
        "Current operator input, 2026-09-12"
      ]
    },
    {
      "id": "FACT-20260912-001-002",
      "revision": 1,
      "status": "superseded",
      "statement": "当前 ArcOrbit 仅持久化一组 settings.codex.model/reasoning_effort：ChatCoordinator 在每个 Chat turn 启动时读取该值，DesktopRunManager 在每个 Automation Run 启动时读取并固定同一值；Chat Composer 当前仅提供技能、停止和发送操作，没有 Model/Level 快捷控件。",
      "basis": "当前源码直接表明持久化、消费和 Composer 结构仍是共享配置模型。",
      "evidence": [
        "runtime/arcorbit/src/codex-model-settings.mjs",
        "runtime/arcorbit/src/desktop/desktop-store.mjs",
        "runtime/arcorbit/src/chat-coordinator.mjs",
        "runtime/arcorbit/src/desktop-run-manager.mjs",
        "runtime/arcorbit/desktop/renderer/index.html",
        "runtime/arcorbit/desktop/renderer/codex-settings-form.mjs"
      ]
    },
    {
      "id": "FACT-20260912-001-003",
      "revision": 1,
      "status": "accepted",
      "statement": "ArcOrbit 当前实现把 Codex 配置归一化为独立的 Chat 与 Automation Model/Level 默认值；有效旧平铺值迁移到两组。新 Chat 草稿和 session 持有自己的配置，Composer 调整随会话持久化，消息接受时固定该 turn 参数并保持 thread；Automation Run 只读取并固定 Automation 默认值。",
      "basis": "当前源码、稳定规格、交互与技术契约，以及定向、Electron 和完整回归证据一致。",
      "evidence": [
        "runtime/arcorbit/src/codex-model-settings.mjs",
        "runtime/arcorbit/src/desktop/desktop-store.mjs",
        "runtime/arcorbit/src/chat-coordinator.mjs",
        "runtime/arcorbit/src/desktop-run-manager.mjs",
        "runtime/arcorbit/desktop/renderer/codex-settings-form.mjs",
        "runtime/arcorbit/desktop/renderer/chat-state-coordinator.mjs",
        "runtime/arcorbit/desktop/renderer/renderer.js",
        "arckit/cases/evidence/CASE-20260912-001/verification.md"
      ]
    }
  ],
  "state_impacts": [
    {
      "id": "IMPACT-20260912-001-001",
      "fact_id": "FACT-20260912-001-003",
      "fact_revision": 1,
      "target": {
        "kind": "software_decision",
        "ref": "product_capabilities",
        "revision": 46
      },
      "effect": "upheld",
      "reason": "产品能力现在提供两组默认配置与 Chat 会话级快捷调整，并保持活动执行固定。",
      "gap_ids": [],
      "evidence": [
        "arckit/spec/arcorbit-distribution.md",
        "runtime/arcorbit/desktop/renderer/index.html",
        "arckit/cases/evidence/CASE-20260912-001/verification.md"
      ]
    },
    {
      "id": "IMPACT-20260912-001-002",
      "fact_id": "FACT-20260912-001-003",
      "fact_revision": 1,
      "target": {
        "kind": "software_decision",
        "ref": "experience_and_interaction",
        "revision": 69
      },
      "effect": "upheld",
      "reason": "账号设置提供两组输入，Chat Composer 直接提供当前会话 Model/Level，并具备候选、人工输入、持久化和失败恢复。",
      "gap_ids": [],
      "evidence": [
        "arckit/interaction/chat-workspace/interaction.md",
        "arckit/interaction/chat-workspace/default.html",
        "arckit/interaction/automation-workspace/interaction.md",
        "arckit/interaction/automation-workspace/authentication.html",
        "runtime/arcorbit/test/codex-settings-electron.test.mjs"
      ]
    },
    {
      "id": "IMPACT-20260912-001-003",
      "fact_id": "FACT-20260912-001-003",
      "fact_revision": 1,
      "target": {
        "kind": "software_decision",
        "ref": "data_and_state",
        "revision": 25
      },
      "effect": "upheld",
      "reason": "Desktop Store 独占两组场景默认值并兼容迁移旧值；Chat session/draft 与 Automation Run 分别持有自己的固定配置。",
      "gap_ids": [],
      "evidence": [
        "runtime/arcorbit/src/codex-model-settings.mjs",
        "runtime/arcorbit/src/desktop/desktop-store.mjs",
        "runtime/arcorbit/src/chat-coordinator.mjs",
        "runtime/arcorbit/src/desktop-run-manager.mjs",
        "runtime/arcorbit/test/codex-model-settings.test.mjs"
      ]
    },
    {
      "id": "IMPACT-20260912-001-004",
      "fact_id": "FACT-20260912-001-003",
      "fact_revision": 1,
      "target": {
        "kind": "software_decision",
        "ref": "external_integrations",
        "revision": 18
      },
      "effect": "upheld",
      "reason": "Chat app-server turn 与 Automation CLI/adapter 分别取得对应配置；turn 和 Run 在各自启动边界固定且保持原 thread。",
      "gap_ids": [],
      "evidence": [
        "runtime/arcorbit/src/chat-coordinator.mjs",
        "runtime/arcorbit/src/desktop-run-manager.mjs",
        "runtime/arcorbit/adapters/codex-app-server-adapter.mjs",
        "runtime/arcorbit/test/chat-coordinator.test.mjs",
        "runtime/arcorbit/test/desktop-run-manager.test.mjs"
      ]
    }
  ],
  "gaps": [
    {
      "id": "GAP-20260912-001-001",
      "status": "resolved",
      "goal": "建立并实现独立的 Chat 与 Automation Codex Model/Level 配置，提供 Chat Composer 快速调整能力，并以兼容迁移、执行参数贯通和回归测试证明行为。",
      "reason": "当前单组持久配置同时驱动两个场景且 Composer 无调整入口，无法兑现用户要求；实现还必须保持已有用户值、Chat thread 连续性和已启动执行的配置固定语义。",
      "derived_from": [
        "FACT-20260912-001-001",
        "FACT-20260912-001-002"
      ],
      "blocked_by": [],
      "priority_basis": {
        "blocking": "用户请求的功能尚未实现",
        "uncertainty": "需要结合当前设置页与 Chat 会话状态确定最小一致的数据迁移和快捷调整语义",
        "risk": "配置迁移或路由错误可能使 Chat 设置污染 Automation，或改变活动执行",
        "user_impact": "用户无法为两个场景选择不同模型，也无法在 Chat 输入处快速切换"
      },
      "responsibility": "agent",
      "evidence_required": [
        "更新后的产品、Chat 交互和技术持久化/执行契约",
        "既有单组 settings.codex 值的兼容迁移证据",
        "Chat 与 Automation 分别读取对应 Model/Level 的实现证据",
        "Chat Composer 调整后续 turn 且保持 thread 连续性的行为证据",
        "已启动 Automation Run 配置固定且不受 Chat 调整影响的回归证据",
        "相关 Desktop Store、Chat、Automation、Renderer 测试通过"
      ],
      "resolution": {
        "id": "GAP-20260912-001-001",
        "status": "resolved",
        "outcome": "ArcOrbit 已分别持久化 Chat 与 Automation Model/Level 默认值；旧平铺配置迁移为两组初始值；Chat Composer 可保存当前会话选择，消息接受时固定 turn 配置并保持原 thread；Automation Run 只读取并固定 Automation 默认值。",
        "reason": "产品、交互和技术契约已更新，主进程、Desktop Store、Renderer 和执行路由均已实现；定向、真实 Electron 和完整 ArcOrbit 回归共同证明迁移、隔离、持久化及执行固定行为。",
        "evidence": [
          "arckit/cases/evidence/CASE-20260912-001/verification.md",
          "arckit/spec/arcorbit-distribution.md",
          "arckit/interaction/chat-workspace/interaction.md",
          "arckit/interaction/automation-workspace/interaction.md",
          "arckit/tech/arcorbit/desktop-execution-solution.md",
          "runtime/arcorbit/src/codex-model-settings.mjs",
          "runtime/arcorbit/src/chat-coordinator.mjs",
          "runtime/arcorbit/src/desktop-run-manager.mjs",
          "runtime/arcorbit/desktop/renderer/chat-state-coordinator.mjs",
          "runtime/arcorbit/desktop/renderer/renderer.js",
          "focused tests: 62 passed, 0 failed",
          "real Electron settings and Composer test: 1 passed, 0 failed",
          "full ArcOrbit test inventory with --test-concurrency=1: 706 passed, 31 skipped, 0 failed",
          "git diff --check: passed"
        ],
        "occurred_at": "2026-09-12T04:18:04.723Z"
      }
    }
  ],
  "content_revision": 1,
  "completion_review": {
    "status": "clean",
    "policy": {
      "initial_max_cycles": 10,
      "source": "runtime/arcorbit/config/case-policy.json",
      "snapshotted_at": "2026-09-12T03:33:06.897Z"
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
          "arckit/cases/evidence/CASE-20260912-001/verification.md",
          "arckit/spec/arcorbit-distribution.md",
          "arckit/interaction/chat-workspace/interaction.md",
          "arckit/interaction/automation-workspace/interaction.md",
          "arckit/tech/arcorbit/desktop-execution-solution.md",
          "runtime/arcorbit/src/codex-model-settings.mjs",
          "runtime/arcorbit/src/chat-coordinator.mjs",
          "runtime/arcorbit/src/desktop-run-manager.mjs",
          "runtime/arcorbit/desktop/renderer/chat-state-coordinator.mjs",
          "runtime/arcorbit/desktop/renderer/renderer.js",
          "review rerun: 43 passed, 1 environment-gated Electron test skipped, 0 failed",
          "accepted real Electron settings and Composer receipt: 1 passed, 0 failed",
          "accepted full ArcOrbit inventory with --test-concurrency=1: 706 passed, 31 skipped, 0 failed",
          "git diff --check: passed"
        ],
        "occurred_at": "2026-09-12T04:21:28.956Z"
      }
    ],
    "evidence": [
      "arckit/cases/evidence/CASE-20260912-001/verification.md",
      "arckit/spec/arcorbit-distribution.md",
      "arckit/interaction/chat-workspace/interaction.md",
      "arckit/interaction/automation-workspace/interaction.md",
      "arckit/tech/arcorbit/desktop-execution-solution.md",
      "runtime/arcorbit/src/codex-model-settings.mjs",
      "runtime/arcorbit/src/chat-coordinator.mjs",
      "runtime/arcorbit/src/desktop-run-manager.mjs",
      "runtime/arcorbit/desktop/renderer/chat-state-coordinator.mjs",
      "runtime/arcorbit/desktop/renderer/renderer.js",
      "review rerun: 43 passed, 1 environment-gated Electron test skipped, 0 failed",
      "accepted real Electron settings and Composer receipt: 1 passed, 0 failed",
      "accepted full ArcOrbit inventory with --test-concurrency=1: 706 passed, 31 skipped, 0 failed",
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
      "goal": "建立并实现独立的 Chat 与 Automation Codex Model/Level 配置、Chat Composer 快速调整、兼容迁移和执行参数固定语义。",
      "outcome": "completed",
      "gap_selection": {
        "mode": "candidate",
        "basis": "fresh state 确认当前实现 Gap 仍是唯一直接对应用户需求、由 Agent 负责且无阻塞依赖的候选。",
        "snapshot_token": "00e44a937a39bd2eef6416fbde942c1b561a185c137d5a99faac2d464847f1d5",
        "selected_ref": "case-gap:CASE-20260912-001:GAP-20260912-001-001",
        "comparison_summary": "选择当前 Case 的实现 Gap。四个 Project Gap 均需独立建 Case；另外两个 Case Gap 属于人工责任且缺少本轮所需授权或事实。",
        "fresh_discovery_summary": "fresh state 未产生更高优先级候选；已完成实现及其证据仍与当前 Gap 完整对应。",
        "considered": [
          {
            "ref": "project-gap:GAP-agent-scenario-evaluation",
            "source": "persisted",
            "eligibility": "case_required",
            "disposition": "deferred",
            "priority_basis": {
              "blocking": "需要独立 Case",
              "uncertainty": "high",
              "risk": "high",
              "user_impact": ""
            },
            "reason": "属于跨场景 Agent 评估义务，不覆盖当前明确的 ArcOrbit 配置功能。"
          },
          {
            "ref": "project-gap:GAP-runtime-resilience-and-adapters",
            "source": "persisted",
            "eligibility": "case_required",
            "disposition": "deferred",
            "priority_basis": {
              "blocking": "需要独立 Case",
              "uncertainty": "",
              "risk": "high",
              "user_impact": ""
            },
            "reason": "属于 Runtime 韧性与 adapter 接受工作，不是当前场景配置实现。"
          },
          {
            "ref": "project-gap:GAP-security-real-project-validation",
            "source": "persisted",
            "eligibility": "case_required",
            "disposition": "deferred",
            "priority_basis": {
              "blocking": "需要独立 Case",
              "uncertainty": "",
              "risk": "high",
              "user_impact": ""
            },
            "reason": "需要真实权限项目的安全验证，与本轮本地配置拆分无直接依赖。"
          },
          {
            "ref": "project-gap:GAP-cross-record-audit",
            "source": "persisted",
            "eligibility": "case_required",
            "disposition": "deferred",
            "priority_basis": {
              "blocking": "需要独立 Case",
              "uncertainty": "",
              "risk": "high",
              "user_impact": ""
            },
            "reason": "跨记录审计属于独立 Project 义务，不应取代当前显式功能请求。"
          },
          {
            "ref": "case-gap:CASE-20260901-001:GAP-20260901-001-005",
            "source": "persisted",
            "eligibility": "ready",
            "disposition": "deferred",
            "priority_basis": {
              "blocking": "等待所有者事实与发布决定",
              "uncertainty": "",
              "risk": "high",
              "user_impact": "阻止公开发布与旧仓库归档"
            },
            "reason": "责任属于 human，本轮没有凭据状态、重许可或发布授权证据。"
          },
          {
            "ref": "case-gap:CASE-20260909-002:GAP-20260909-002-004",
            "source": "persisted",
            "eligibility": "ready",
            "disposition": "deferred",
            "priority_basis": {
              "blocking": "declined repackage request",
              "uncertainty": "",
              "risk": "",
              "user_impact": "final packaged acceptance"
            },
            "reason": "责任属于 human，且与当前新 Case 的配置功能无关。"
          },
          {
            "ref": "case-gap:CASE-20260912-001:GAP-20260912-001-001",
            "source": "persisted",
            "eligibility": "ready",
            "disposition": "selected",
            "priority_basis": {
              "blocking": "用户请求的功能尚未实现",
              "uncertainty": "需要确定一致的迁移、逐会话选择和执行固定语义",
              "risk": "路由错误可能造成场景配置污染或改变活动执行",
              "user_impact": "用户无法独立选型或从 Composer 快速切换"
            },
            "reason": "直接兑现当前用户目标，责任属于 Agent、无阻塞依赖，且对当前产品焦点具有最高直接影响。"
          }
        ]
      },
      "selected_gap": {
        "id": "GAP-20260912-001-001",
        "responsibility": "agent",
        "goal": "建立并实现独立的 Chat 与 Automation Codex Model/Level 配置，提供 Chat Composer 快速调整能力，并以兼容迁移、执行参数贯通和回归测试证明行为。",
        "reason": "当前单组持久配置同时驱动两个场景且 Composer 无调整入口，无法兑现用户要求；实现还必须保持已有用户值、Chat thread 连续性和已启动执行的配置固定语义。",
        "derived_from": [
          "FACT-20260912-001-001",
          "FACT-20260912-001-002"
        ],
        "blocked_by": [],
        "priority_basis": {
          "blocking": "用户请求的功能尚未实现",
          "uncertainty": "需要结合当前设置页与 Chat 会话状态确定最小一致的数据迁移和快捷调整语义",
          "risk": "配置迁移或路由错误可能使 Chat 设置污染 Automation，或改变活动执行",
          "user_impact": "用户无法为两个场景选择不同模型，也无法在 Chat 输入处快速切换"
        },
        "evidence_required": [
          "更新后的产品、Chat 交互和技术持久化/执行契约",
          "既有单组 settings.codex 值的兼容迁移证据",
          "Chat 与 Automation 分别读取对应 Model/Level 的实现证据",
          "Chat Composer 调整后续 turn 且保持 thread 连续性的行为证据",
          "已启动 Automation Run 配置固定且不受 Chat 调整影响的回归证据",
          "相关 Desktop Store、Chat、Automation、Renderer 测试通过"
        ]
      },
      "planned_transition": {
        "goal": "建立并实现独立的 Chat 与 Automation Codex Model/Level 配置、Chat Composer 快速调整、兼容迁移和执行参数固定语义。",
        "expected_state_change": "解决 GAP-20260912-001-001，接受实现事实，恢复四个受威胁 Project 决策，并使 Case 进入 Completion Review 候选阶段。"
      },
      "accepted_state_delta": {
        "resolved_gap": {
          "id": "GAP-20260912-001-001",
          "status": "resolved",
          "outcome": "ArcOrbit 已分别持久化 Chat 与 Automation Model/Level 默认值；旧平铺配置迁移为两组初始值；Chat Composer 可保存当前会话选择，消息接受时固定 turn 配置并保持原 thread；Automation Run 只读取并固定 Automation 默认值。",
          "reason": "产品、交互和技术契约已更新，主进程、Desktop Store、Renderer 和执行路由均已实现；定向、真实 Electron 和完整 ArcOrbit 回归共同证明迁移、隔离、持久化及执行固定行为。",
          "evidence": [
            "arckit/cases/evidence/CASE-20260912-001/verification.md",
            "arckit/spec/arcorbit-distribution.md",
            "arckit/interaction/chat-workspace/interaction.md",
            "arckit/interaction/automation-workspace/interaction.md",
            "arckit/tech/arcorbit/desktop-execution-solution.md",
            "runtime/arcorbit/src/codex-model-settings.mjs",
            "runtime/arcorbit/src/chat-coordinator.mjs",
            "runtime/arcorbit/src/desktop-run-manager.mjs",
            "runtime/arcorbit/desktop/renderer/chat-state-coordinator.mjs",
            "runtime/arcorbit/desktop/renderer/renderer.js",
            "focused tests: 62 passed, 0 failed",
            "real Electron settings and Composer test: 1 passed, 0 failed",
            "full ArcOrbit test inventory with --test-concurrency=1: 706 passed, 31 skipped, 0 failed",
            "git diff --check: passed"
          ]
        },
        "facts_added": [
          {
            "id": "FACT-20260912-001-003",
            "revision": 1,
            "status": "accepted",
            "statement": "ArcOrbit 当前实现把 Codex 配置归一化为独立的 Chat 与 Automation Model/Level 默认值；有效旧平铺值迁移到两组。新 Chat 草稿和 session 持有自己的配置，Composer 调整随会话持久化，消息接受时固定该 turn 参数并保持 thread；Automation Run 只读取并固定 Automation 默认值。",
            "basis": "当前源码、稳定规格、交互与技术契约，以及定向、Electron 和完整回归证据一致。",
            "evidence": [
              "runtime/arcorbit/src/codex-model-settings.mjs",
              "runtime/arcorbit/src/desktop/desktop-store.mjs",
              "runtime/arcorbit/src/chat-coordinator.mjs",
              "runtime/arcorbit/src/desktop-run-manager.mjs",
              "runtime/arcorbit/desktop/renderer/codex-settings-form.mjs",
              "runtime/arcorbit/desktop/renderer/chat-state-coordinator.mjs",
              "runtime/arcorbit/desktop/renderer/renderer.js",
              "arckit/cases/evidence/CASE-20260912-001/verification.md"
            ]
          }
        ],
        "facts_superseded": [
          {
            "id": "FACT-20260912-001-002",
            "revision": 1,
            "reason": "该事实准确描述了改动前的共享配置状态，但当前实现已由场景化默认值和逐会话 Chat 配置取代。",
            "evidence": [
              "runtime/arcorbit/src/codex-model-settings.mjs",
              "runtime/arcorbit/src/chat-coordinator.mjs",
              "runtime/arcorbit/src/desktop-run-manager.mjs",
              "runtime/arcorbit/desktop/renderer/index.html"
            ]
          }
        ],
        "impacts_added": [],
        "impacts_updated": [
          {
            "id": "IMPACT-20260912-001-001",
            "fact_id": "FACT-20260912-001-003",
            "fact_revision": 1,
            "target": {
              "kind": "software_decision",
              "ref": "product_capabilities",
              "revision": 46
            },
            "effect": "upheld",
            "reason": "产品能力现在提供两组默认配置与 Chat 会话级快捷调整，并保持活动执行固定。",
            "gap_ids": [],
            "evidence": [
              "arckit/spec/arcorbit-distribution.md",
              "runtime/arcorbit/desktop/renderer/index.html",
              "arckit/cases/evidence/CASE-20260912-001/verification.md"
            ]
          },
          {
            "id": "IMPACT-20260912-001-002",
            "fact_id": "FACT-20260912-001-003",
            "fact_revision": 1,
            "target": {
              "kind": "software_decision",
              "ref": "experience_and_interaction",
              "revision": 69
            },
            "effect": "upheld",
            "reason": "账号设置提供两组输入，Chat Composer 直接提供当前会话 Model/Level，并具备候选、人工输入、持久化和失败恢复。",
            "gap_ids": [],
            "evidence": [
              "arckit/interaction/chat-workspace/interaction.md",
              "arckit/interaction/chat-workspace/default.html",
              "arckit/interaction/automation-workspace/interaction.md",
              "arckit/interaction/automation-workspace/authentication.html",
              "runtime/arcorbit/test/codex-settings-electron.test.mjs"
            ]
          },
          {
            "id": "IMPACT-20260912-001-003",
            "fact_id": "FACT-20260912-001-003",
            "fact_revision": 1,
            "target": {
              "kind": "software_decision",
              "ref": "data_and_state",
              "revision": 25
            },
            "effect": "upheld",
            "reason": "Desktop Store 独占两组场景默认值并兼容迁移旧值；Chat session/draft 与 Automation Run 分别持有自己的固定配置。",
            "gap_ids": [],
            "evidence": [
              "runtime/arcorbit/src/codex-model-settings.mjs",
              "runtime/arcorbit/src/desktop/desktop-store.mjs",
              "runtime/arcorbit/src/chat-coordinator.mjs",
              "runtime/arcorbit/src/desktop-run-manager.mjs",
              "runtime/arcorbit/test/codex-model-settings.test.mjs"
            ]
          },
          {
            "id": "IMPACT-20260912-001-004",
            "fact_id": "FACT-20260912-001-003",
            "fact_revision": 1,
            "target": {
              "kind": "software_decision",
              "ref": "external_integrations",
              "revision": 18
            },
            "effect": "upheld",
            "reason": "Chat app-server turn 与 Automation CLI/adapter 分别取得对应配置；turn 和 Run 在各自启动边界固定且保持原 thread。",
            "gap_ids": [],
            "evidence": [
              "runtime/arcorbit/src/chat-coordinator.mjs",
              "runtime/arcorbit/src/desktop-run-manager.mjs",
              "runtime/arcorbit/adapters/codex-app-server-adapter.mjs",
              "runtime/arcorbit/test/chat-coordinator.test.mjs",
              "runtime/arcorbit/test/desktop-run-manager.test.mjs"
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
            "area_ref": "product_capabilities",
            "observed_revision": 45,
            "set_decision": {
              "status": "settled",
              "statement": "ArcOrbit 保留既有 Desktop、Runtime、Chat、Automation、Feedback、Work、Setup、Today、Product/Idea 与 Release 能力及既有边界。ArcOrbit 账号与 Runtime 设置分别维护当前设备 Chat 与 Automation 的 Codex Model/Level 默认值：动态候选来自当前 Codex，四个字段始终可人工输入；查询失败或未知当前值不阻止保存。两组缺省均为 gpt-6-astra / high，旧单组有效值迁移为两组初始值，随后独立保存。新 Chat 会话继承 Chat 默认值并可在 Composer 快速调整当前会话后续消息；Automation Run 只读取 Automation 默认值。已接受 Chat turn 与已启动 Run 固定配置，Chat 保持原 thread，任一场景调整不污染另一场景。其他既有 Work、Setup Readiness、Feedback、Project Catalog、本地工作区绑定、Automation participation、Codex Setup、Today、Product/Idea 与 Release 契约保持不变。",
              "reason": "用户要求区分 Chat 与 Automation 的 Model/Level，并提供 Chat Composer 快捷调整；当前实现与验证已兑现该边界。",
              "evidence": [
                "arckit/spec/arcorbit-distribution.md",
                "arckit/interaction/chat-workspace/interaction.md",
                "runtime/arcorbit/desktop/renderer/index.html",
                "runtime/arcorbit/src/chat-coordinator.mjs",
                "runtime/arcorbit/src/desktop-run-manager.mjs",
                "arckit/cases/evidence/CASE-20260912-001/verification.md"
              ],
              "confidence": "high",
              "resume_condition": "当 Codex 配置来源、场景所有权、Composer 调整范围或保存与执行生效边界改变时重审。"
            },
            "gap_refs": [
              "GAP-agent-scenario-evaluation"
            ],
            "reason": "以完成的场景化配置实现替换原单组配置能力描述，同时保留其他既有能力边界。",
            "evidence": [
              "FACT-20260912-001-001",
              "arckit/spec/arcorbit-distribution.md",
              "arckit/cases/evidence/CASE-20260912-001/verification.md"
            ]
          },
          {
            "area_ref": "experience_and_interaction",
            "observed_revision": 68,
            "set_decision": {
              "status": "settled",
              "statement": "ArcOrbit 保持既有 Personal、Product Lifecycle、Organization、Today、Work、Automation、Feedback、Chat、Product/Idea 与 Release 导航、交互及恢复语义。账号设置覆盖层为 Chat 与 Automation 分别提供可编辑 Model 和 Level 候选输入，Level 候选随各自模型更新但不自动覆盖值。打开时查询，失败可重试，异步刷新保留两组草稿；保存 Codex 配置持久保存四个场景字段并原位反馈。保存失败保留输入，关闭重开恢复已保存值。Chat Composer 在输入框附近显示当前会话 Model/Level，新会话继承 Chat 默认值，既有会话恢复自身选择；调整只作用于当前会话的后续消息，发送接受时固定当前 turn，保持同一 thread 且不改变 Automation 默认值。新增控件支持候选选择和人工输入，并沿用现有响应式布局、键盘操作和可见焦点。其他既有 Work Inspector、验收、Setup、Feedback、Today、项目绑定、Product/Idea 与 Release 交互契约保持不变。",
              "reason": "用户要求从 Chat 输入框快速调整当前会话 Model/Level；真实 Renderer、线框和交互状态已实现并验证。",
              "evidence": [
                "arckit/interaction/chat-workspace/interaction.md",
                "arckit/interaction/chat-workspace/default.html",
                "arckit/interaction/automation-workspace/interaction.md",
                "arckit/interaction/automation-workspace/authentication.html",
                "runtime/arcorbit/desktop/renderer/index.html",
                "runtime/arcorbit/test/codex-settings-electron.test.mjs"
              ],
              "confidence": "high",
              "resume_condition": "当 Codex 设置入口、Chat Composer 生效语义、候选加载、失败恢复或会话恢复行为改变时重审。"
            },
            "gap_refs": [],
            "reason": "恢复账号设置与 Chat Composer 的交互预期，使其匹配场景化配置实现，同时保留其他既有交互边界。",
            "evidence": [
              "arckit/interaction/chat-workspace/interaction.md",
              "runtime/arcorbit/test/codex-settings-electron.test.mjs",
              "arckit/cases/evidence/CASE-20260912-001/verification.md"
            ]
          },
          {
            "area_ref": "data_and_state",
            "observed_revision": 24,
            "set_decision": {
              "status": "settled",
              "statement": "Canonical development state、Workshop 远端真相、ArcOrbit Task Projection、Automation execution、Chat session/thread、Case 绑定收据及其他既有 Desktop 控制事实继续保持原所有权边界。Desktop Store 独占当前设备 `settings.codex.chat.{model,reasoning_effort}` 与 `settings.codex.automation.{model,reasoning_effort}`；旧平铺 `settings.codex.model/reasoning_effort` 的有效值迁移为两组初始值。缺失或非法字段分别归一化为 gpt-6-astra / high，保存 patch 去除首尾空白、拒绝空值、控制字符及超过 200 字符的值，并允许未知模型和级别。Chat session 与未发送草稿持有自身 model/reasoning_effort，新会话从 Chat 默认值继承；更新一个场景、无关设置及重启保留其他有效用户值，不改写用户全局 Codex 配置。Automation Run 保存启动时的 Automation model/effort；已接受 Chat turn 使用发送边界捕获的会话配置。模型清单不是持久事实源，Renderer 只投影和提交这些 Desktop 控制事实。其他既有 Inspector 偏好、Setup recovery、Project Catalog、Workspace Control、Task Readiness、Idea 与 Release 数据边界保持不变。",
              "reason": "场景拆分要求明确两组默认值、旧值迁移、Chat session/draft 与 Automation Run 的数据所有权。",
              "evidence": [
                "arckit/tech/arcorbit/desktop-execution-solution.md",
                "runtime/arcorbit/src/codex-model-settings.mjs",
                "runtime/arcorbit/src/desktop/desktop-store.mjs",
                "runtime/arcorbit/src/chat-coordinator.mjs",
                "runtime/arcorbit/src/desktop-run-manager.mjs",
                "runtime/arcorbit/test/codex-model-settings.test.mjs",
                "arckit/cases/evidence/CASE-20260912-001/verification.md"
              ],
              "confidence": "high",
              "resume_condition": "当 Desktop Store schema、Chat session/draft 所有权、Automation Run 固定参数或模型清单所有权改变时重审。"
            },
            "gap_refs": [
              "GAP-cross-record-audit"
            ],
            "reason": "以场景化 schema、兼容迁移和逐执行对象持久事实替换旧单组设置模型。",
            "evidence": [
              "arckit/tech/arcorbit/desktop-execution-solution.md",
              "runtime/arcorbit/src/codex-model-settings.mjs",
              "arckit/cases/evidence/CASE-20260912-001/verification.md"
            ]
          },
          {
            "area_ref": "external_integrations",
            "observed_revision": 17,
            "set_decision": {
              "status": "settled",
              "statement": "ArcOrbit 继续通过显式 main-process adapters 集成 Codex app-server/CLI、Workshop、Feedback、Codex Setup、Product/Idea、GitHub 与 Release 能力，并保持 Renderer 无凭据、无通用请求能力。真实 Chat 继续使用可复用的 Codex Conversation 基础层处理 app-server initialize、persistent thread start/resume、turn start/interrupt、streamed items、token usage 和 approval request；ChatCoordinator 直接提交用户文本，不调用 state-driven Runtime、trusted ledger 或 Automation Coordinator。Codex 模型清单继续由固定无参数 IPC 在主进程查询当前 active executable，失败不发布部分清单或原始错误。Chat turn 从对应 session 读取并在消息接受时固定 model/effort；Automation Run 从 `settings.codex.automation` 读取并在启动时固定。共享 adapter 的 `turn/start.model/effort` 与 CLI `--model`/`--reasoning-effort` 分别生效并保持原 thread。Composer、Chat 默认值和 Automation 默认值相互隔离；清单可见不代表执行授权。其他 Workshop、Feedback、Setup installer、Product/Idea、GitHub 与 Release adapter 契约保持不变。",
              "reason": "Chat app-server 与 Automation CLI/adapter 现在从不同配置来源取得参数，并保持活动执行固定与 thread 连续。",
              "evidence": [
                "arckit/tech/arcorbit/desktop-execution-solution.md",
                "runtime/arcorbit/src/chat-coordinator.mjs",
                "runtime/arcorbit/src/desktop-run-manager.mjs",
                "runtime/arcorbit/adapters/codex-app-server-adapter.mjs",
                "runtime/arcorbit/test/chat-coordinator.test.mjs",
                "runtime/arcorbit/test/desktop-run-manager.test.mjs"
              ],
              "confidence": "high",
              "resume_condition": "当 app-server turn 参数、CLI 参数、模型清单边界或场景配置路由改变时重审。"
            },
            "gap_refs": [
              "GAP-runtime-resilience-and-adapters"
            ],
            "reason": "恢复 Chat 与 Automation adapter 的独立配置来源和固定执行语义。",
            "evidence": [
              "arckit/tech/arcorbit/desktop-execution-solution.md",
              "runtime/arcorbit/src/chat-coordinator.mjs",
              "arckit/cases/evidence/CASE-20260912-001/verification.md"
            ]
          }
        ],
        "software_invariant_changes": [],
        "project_gap_changes": [],
        "selection_context_change": null,
        "evidence": [
          "FACT-20260912-001-001",
          "arckit/spec/arcorbit-distribution.md",
          "arckit/interaction/chat-workspace/interaction.md",
          "arckit/tech/arcorbit/desktop-execution-solution.md",
          "arckit/cases/evidence/CASE-20260912-001/verification.md"
        ]
      },
      "invariant_assessment": {
        "project_revision": 377,
        "judgments": [
          {
            "invariant_ref": "product-expectations-remain-recoverable",
            "disposition": "upheld",
            "reason": "场景化默认值、旧值迁移、Chat 会话快捷选择和活动执行固定语义已在正式规格中明确。",
            "fact_refs": [
              "FACT-20260912-001-003"
            ],
            "evidence": [
              "arckit/spec/arcorbit-distribution.md",
              "arckit/spec/INDEX.md",
              "arckit/spec/_map/RELATIONS.md"
            ],
            "gap_refs": []
          },
          {
            "invariant_ref": "interaction-expectations-remain-recoverable",
            "disposition": "upheld",
            "reason": "账号设置与 Chat Composer 的输入、候选、保存、恢复和 turn 生效边界已由交互文档、线框与真实 Renderer 一致表达。",
            "fact_refs": [
              "FACT-20260912-001-003"
            ],
            "evidence": [
              "arckit/interaction/chat-workspace/interaction.md",
              "arckit/interaction/chat-workspace/default.html",
              "arckit/interaction/automation-workspace/interaction.md",
              "arckit/interaction/automation-workspace/authentication.html",
              "runtime/arcorbit/test/codex-settings-electron.test.mjs"
            ],
            "gap_refs": []
          },
          {
            "invariant_ref": "visual-language-remains-consistent",
            "disposition": "upheld",
            "reason": "新增控件复用现有输入、fieldset、Composer、间距、响应式换行和可见焦点语言，没有引入新的主题或品牌规则。",
            "fact_refs": [
              "FACT-20260912-001-003"
            ],
            "evidence": [
              "runtime/arcorbit/desktop/renderer/index.html",
              "runtime/arcorbit/desktop/renderer/styles.css",
              "arckit/interaction/chat-workspace/default.html"
            ],
            "gap_refs": []
          },
          {
            "invariant_ref": "technical-decisions-remain-explainable",
            "disposition": "upheld",
            "reason": "Desktop Store schema、旧值迁移、Chat session/draft 所有权、typed IPC 和 turn/Run 固定边界均可从技术契约与源码恢复。",
            "fact_refs": [
              "FACT-20260912-001-003"
            ],
            "evidence": [
              "arckit/tech/arcorbit/desktop-execution-solution.md",
              "runtime/arcorbit/src/codex-model-settings.mjs",
              "runtime/arcorbit/src/chat-coordinator.mjs",
              "runtime/arcorbit/src/desktop-run-manager.mjs"
            ],
            "gap_refs": []
          },
          {
            "invariant_ref": "accepted-facts-are-realized",
            "disposition": "upheld",
            "reason": "用户要求的场景隔离与 Composer 快捷调整已经在真实 Desktop 代码中实现，并通过定向、Electron 和全套回归。",
            "fact_refs": [
              "FACT-20260912-001-001",
              "FACT-20260912-001-003"
            ],
            "evidence": [
              "runtime/arcorbit/desktop/renderer/index.html",
              "runtime/arcorbit/desktop/renderer/renderer.js",
              "arckit/cases/evidence/CASE-20260912-001/verification.md",
              "full ArcOrbit test inventory: 0 failed"
            ],
            "gap_refs": []
          },
          {
            "invariant_ref": "material-risks-have-credible-evidence",
            "disposition": "upheld",
            "reason": "配置污染、旧值丢失、Chat thread 替换、活动 turn 竞态和活动 Run 被改写等风险均有直接回归覆盖；并行 Electron 资源干扰已用单独和单并发重跑排除。",
            "fact_refs": [
              "FACT-20260912-001-003"
            ],
            "evidence": [
              "runtime/arcorbit/test/codex-model-settings.test.mjs",
              "runtime/arcorbit/test/chat-state-coordinator.test.mjs",
              "runtime/arcorbit/test/chat-coordinator.test.mjs",
              "runtime/arcorbit/test/desktop-run-manager.test.mjs",
              "runtime/arcorbit/test/codex-settings-electron.test.mjs",
              "arckit/cases/evidence/CASE-20260912-001/verification.md"
            ],
            "gap_refs": []
          }
        ]
      },
      "evidence": [
        "arckit/cases/evidence/CASE-20260912-001/verification.md",
        "focused tests: 62 passed, 0 failed",
        "real Electron settings and Composer test: 1 passed, 0 failed",
        "two isolated pre-existing Electron suites: 2 passed, 0 failed",
        "full ArcOrbit tests with --test-concurrency=1: 706 passed, 31 skipped, 0 failed",
        "git diff --check: passed"
      ],
      "runtime_result_ref": "arckit-runtime://runs/RUN-20260912-033128821Z-5a3a1e02",
      "occurred_at": "2026-09-12T04:18:04.723Z"
    },
    {
      "round": 2,
      "transition_schema_version": "arckit-case-transition/v8",
      "goal": "对 CASE-20260912-001 内容修订 1 执行实现正确性、问题闭合、验证可信度、回归风险和最小性审查。",
      "outcome": "completed",
      "gap_selection": {
        "mode": "candidate",
        "basis": "上一轮实现已由可信 Ledger 接受，当前 Case 的普通 Gap、影响、问题和 handoff 均已闭合；Completion Review 是唯一直接对应当前任务、由 Agent 负责且可立即执行的候选。",
        "snapshot_token": "2997668a28dbd3a86efbdc665174e6b502eb521807cc419024588d4fc1bf515f",
        "selected_ref": "case-gap:CASE-20260912-001:CASE-20260912-001:completion-review:1",
        "comparison_summary": "选择 CASE-20260912-001 的 Completion Review。四个 Project Gap 需要独立 Case；另外两个 Case Gap 属于人工责任且与当前任务无关。",
        "fresh_discovery_summary": "对内容修订 1 的实现 diff、契约、关键执行边界和验证证据进行独立复核，未发现优先于审查的新普通工作，也未发现 error、omission 或 excess。",
        "considered": [
          {
            "ref": "project-gap:GAP-agent-scenario-evaluation",
            "source": "persisted",
            "eligibility": "case_required",
            "disposition": "deferred",
            "priority_basis": {
              "blocking": "需要独立 Case",
              "uncertainty": "high",
              "risk": "high",
              "user_impact": ""
            },
            "reason": "跨场景 Agent 评估不属于当前配置功能 Case。"
          },
          {
            "ref": "project-gap:GAP-runtime-resilience-and-adapters",
            "source": "persisted",
            "eligibility": "case_required",
            "disposition": "deferred",
            "priority_basis": {
              "blocking": "需要独立 Case",
              "uncertainty": "",
              "risk": "high",
              "user_impact": ""
            },
            "reason": "Runtime 韧性与 adapter 接受工作不影响当前 Case 的完成审查。"
          },
          {
            "ref": "project-gap:GAP-security-real-project-validation",
            "source": "persisted",
            "eligibility": "case_required",
            "disposition": "deferred",
            "priority_basis": {
              "blocking": "需要独立 Case",
              "uncertainty": "",
              "risk": "high",
              "user_impact": ""
            },
            "reason": "真实权限项目安全验证是独立 Project 义务。"
          },
          {
            "ref": "project-gap:GAP-cross-record-audit",
            "source": "persisted",
            "eligibility": "case_required",
            "disposition": "deferred",
            "priority_basis": {
              "blocking": "需要独立 Case",
              "uncertainty": "",
              "risk": "high",
              "user_impact": ""
            },
            "reason": "跨记录审计需要独立 Case，不替代当前内容审查。"
          },
          {
            "ref": "case-gap:CASE-20260901-001:GAP-20260901-001-005",
            "source": "persisted",
            "eligibility": "ready",
            "disposition": "deferred",
            "priority_basis": {
              "blocking": "等待所有者事实与发布决定",
              "uncertainty": "",
              "risk": "high",
              "user_impact": "阻止公开发布与旧仓库归档"
            },
            "reason": "责任属于 human，且与当前配置功能无关。"
          },
          {
            "ref": "case-gap:CASE-20260909-002:GAP-20260909-002-004",
            "source": "persisted",
            "eligibility": "ready",
            "disposition": "deferred",
            "priority_basis": {
              "blocking": "declined repackage request",
              "uncertainty": "",
              "risk": "",
              "user_impact": "final packaged acceptance"
            },
            "reason": "责任属于 human，且属于另一个 Release Case。"
          },
          {
            "ref": "case-gap:CASE-20260912-001:CASE-20260912-001:completion-review:1",
            "source": "persisted",
            "eligibility": "ready",
            "disposition": "selected",
            "priority_basis": {
              "blocking": "high",
              "uncertainty": "low",
              "risk": "high",
              "user_impact": "high"
            },
            "reason": "当前 Case 所有普通义务已闭合，完成审查是确认本次用户目标是否可可信结束的唯一剩余门禁。"
          }
        ]
      },
      "selected_gap": {
        "id": "CASE-20260912-001:completion-review:1",
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
        "goal": "对 CASE-20260912-001 内容修订 1 执行实现正确性、问题闭合、验证可信度、回归风险和最小性审查。",
        "expected_state_change": "可信 Ledger 接受 clean Completion Review 后，将 CASE-20260912-001 标记为完成。"
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
            "arckit/cases/evidence/CASE-20260912-001/verification.md",
            "arckit/spec/arcorbit-distribution.md",
            "arckit/interaction/chat-workspace/interaction.md",
            "arckit/interaction/automation-workspace/interaction.md",
            "arckit/tech/arcorbit/desktop-execution-solution.md",
            "runtime/arcorbit/src/codex-model-settings.mjs",
            "runtime/arcorbit/src/chat-coordinator.mjs",
            "runtime/arcorbit/src/desktop-run-manager.mjs",
            "runtime/arcorbit/desktop/renderer/chat-state-coordinator.mjs",
            "runtime/arcorbit/desktop/renderer/renderer.js",
            "review rerun: 43 passed, 1 environment-gated Electron test skipped, 0 failed",
            "accepted real Electron settings and Composer receipt: 1 passed, 0 failed",
            "accepted full ArcOrbit inventory with --test-concurrency=1: 706 passed, 31 skipped, 0 failed",
            "git diff --check: passed"
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
        "evidence": [
          "case:fact:FACT-20260912-001-003",
          "arckit/cases/evidence/CASE-20260912-001/verification.md",
          "review rerun: 43 passed, 1 skipped, 0 failed"
        ]
      },
      "invariant_assessment": {
        "project_revision": 378,
        "judgments": [
          {
            "invariant_ref": "product-expectations-remain-recoverable",
            "disposition": "upheld",
            "reason": "完成审查确认独立默认值、旧值迁移、会话级选择和执行固定语义在正式产品规格中准确且可恢复。",
            "fact_refs": [
              "FACT-20260912-001-003"
            ],
            "evidence": [
              "arckit/spec/arcorbit-distribution.md",
              "arckit/cases/evidence/CASE-20260912-001/verification.md"
            ],
            "gap_refs": []
          },
          {
            "invariant_ref": "interaction-expectations-remain-recoverable",
            "disposition": "upheld",
            "reason": "设置页与 Chat Composer 的输入、候选、保存、恢复和生效边界在交互文档、线框与真实 Renderer 中一致。",
            "fact_refs": [
              "FACT-20260912-001-003"
            ],
            "evidence": [
              "arckit/interaction/chat-workspace/interaction.md",
              "arckit/interaction/chat-workspace/default.html",
              "arckit/interaction/automation-workspace/interaction.md",
              "runtime/arcorbit/test/codex-settings-electron.test.mjs"
            ],
            "gap_refs": []
          },
          {
            "invariant_ref": "visual-language-remains-consistent",
            "disposition": "upheld",
            "reason": "新增设置分组和 Composer 控件复用既有字段、间距、响应式布局与焦点语言，未引入独立视觉体系。",
            "fact_refs": [
              "FACT-20260912-001-003"
            ],
            "evidence": [
              "runtime/arcorbit/desktop/renderer/index.html",
              "runtime/arcorbit/desktop/renderer/styles.css",
              "arckit/interaction/chat-workspace/default.html"
            ],
            "gap_refs": []
          },
          {
            "invariant_ref": "technical-decisions-remain-explainable",
            "disposition": "upheld",
            "reason": "场景化 Store schema、旧值迁移、Chat session/draft 所有权、typed IPC 和 turn/Run 固定边界均由技术契约、源码与测试直接解释。",
            "fact_refs": [
              "FACT-20260912-001-003"
            ],
            "evidence": [
              "arckit/tech/arcorbit/desktop-execution-solution.md",
              "runtime/arcorbit/src/codex-model-settings.mjs",
              "runtime/arcorbit/src/chat-coordinator.mjs",
              "runtime/arcorbit/src/desktop-run-manager.mjs"
            ],
            "gap_refs": []
          },
          {
            "invariant_ref": "accepted-facts-are-realized",
            "disposition": "upheld",
            "reason": "独立复核确认 Chat 与 Automation 配置隔离、Composer 会话级调整、thread 连续性及执行参数固定均由生产代码实现。",
            "fact_refs": [
              "FACT-20260912-001-001",
              "FACT-20260912-001-003"
            ],
            "evidence": [
              "runtime/arcorbit/desktop/renderer/renderer.js",
              "runtime/arcorbit/src/chat-coordinator.mjs",
              "runtime/arcorbit/src/desktop-run-manager.mjs",
              "review rerun: 43 passed, 1 skipped, 0 failed"
            ],
            "gap_refs": []
          },
          {
            "invariant_ref": "material-risks-have-credible-evidence",
            "disposition": "upheld",
            "reason": "迁移丢值、跨场景污染、会话恢复、thread 替换、活动 turn 竞态和活动 Run 被改写等主要风险均有直接、可重复且与边界相称的测试证据。",
            "fact_refs": [
              "FACT-20260912-001-003"
            ],
            "evidence": [
              "runtime/arcorbit/test/codex-model-settings.test.mjs",
              "runtime/arcorbit/test/chat-state-coordinator.test.mjs",
              "runtime/arcorbit/test/chat-coordinator.test.mjs",
              "runtime/arcorbit/test/desktop-run-manager.test.mjs",
              "runtime/arcorbit/test/codex-settings-electron.test.mjs",
              "arckit/cases/evidence/CASE-20260912-001/verification.md"
            ],
            "gap_refs": []
          }
        ]
      },
      "evidence": [
        "arckit/cases/evidence/CASE-20260912-001/verification.md",
        "review rerun: 43 passed, 1 environment-gated Electron test skipped, 0 failed",
        "accepted real Electron settings and Composer receipt: 1 passed, 0 failed",
        "accepted full ArcOrbit tests with --test-concurrency=1: 706 passed, 31 skipped, 0 failed",
        "git diff --check: passed"
      ],
      "runtime_result_ref": "arckit-runtime://runs/RUN-20260912-033128821Z-5a3a1e02",
      "occurred_at": "2026-09-12T04:21:28.956Z"
    }
  ],
  "case_resolution": {
    "status": "resolved",
    "stage": "resolved",
    "satisfied": [
      "GAP-20260912-001-001"
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
    "updated_at": "2026-09-12T04:21:28.956Z"
  }
}
```

## Round Notes

- Case history is canonical in Structured Record.rounds; keep prose notes exceptional.
