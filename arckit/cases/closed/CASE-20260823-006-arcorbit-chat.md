# 优化 ArcOrbit Chat 的项目分组与新会话归属交互

Case: CASE-20260823-006
Status: closed
Artifact Type: mixed
Selected Gap: none
Updated: 2026-08-23T21:44:44.962Z

## User Intent

让用户无需预先选择项目即可按项目浏览 Chat 会话，并在新建会话时清楚确认和快速切换目标项目。

## Structured Record

```json
{
  "schema_version": "development-case-record/v5",
  "id": "CASE-20260823-006",
  "title": "优化 ArcOrbit Chat 的项目分组与新会话归属交互",
  "status": "closed",
  "artifact_type": "mixed",
  "created_at": "2026-08-23T21:22:44.339Z",
  "updated_at": "2026-08-23T21:44:44.962Z",
  "user_intent": "让用户无需预先选择项目即可按项目浏览 Chat 会话，并在新建会话时清楚确认和快速切换目标项目。",
  "expected_outcome": "Chat 会话列表按项目直接分组；每个项目默认最多展示最近 10 个会话，超出时提供该项目的历史会话入口；新建会话明确展示将要绑定的 Product Workspace，并允许在首次发送前快速切换。",
  "project_state_ref": "arckit/project/state.record.json",
  "current_round": {
    "goal": "",
    "selected_gap": null
  },
  "facts": [
    {
      "id": "FACT-chat-project-grouped-session-navigation",
      "revision": 1,
      "status": "accepted",
      "statement": "ArcOrbit Chat 必须直接按项目分组展示会话，不要求用户先选择项目；每个项目默认最多显示最近 10 个会话，超出部分通过该项目底部的历史会话入口访问；新建会话必须显式显示目标项目，并允许在首次发送前快速切换。",
      "basis": "当前操作者明确提出的 Chat 页面优化要求。",
      "evidence": [
        "Current operator input, 2026-08-24",
        "arckit/interaction/chat-workspace/interaction.md:13-14",
        "arckit/interaction/chat-workspace/interaction.md:30-37",
        "arckit/spec/agentic-software-development/arcorbit-planned-workspaces.md:37-49"
      ]
    },
    {
      "id": "FACT-chat-project-grouped-interaction-definition",
      "revision": 1,
      "status": "accepted",
      "statement": "Chat 左栏不受全局项目范围过滤，按 Product Workspace 分组会话；项目组和组内会话按最近活动时间确定排序，每组默认显示最近 10 个，超出时在组底部展开或收起完整历史且不改变当前会话。新对话始终显式显示目标工作区，默认取当前会话或最近成功使用的可用工作区，首次发送前切换保留草稿且不创建 session/thread，发送后项目归属固定。",
      "basis": "用户要求已经通过现有 Chat 生命周期、安全边界和页面交互体系被具体化为稳定产品及交互规则。",
      "evidence": [
        "arckit/spec/agentic-software-development/arcorbit-planned-workspaces.md:26-70",
        "arckit/spec/agentic-software-development/arcorbit-planned-workspaces.md:180-186",
        "arckit/interaction/chat-workspace/interaction.md:5-46",
        "arckit/interaction/chat-workspace/default.html:6-18"
      ]
    },
    {
      "id": "FACT-chat-current-renderer-not-grouped",
      "revision": 1,
      "status": "superseded",
      "statement": "当前生产 Chat Renderer 在侧栏使用一个全局 `chatProjectSelect`，并将 snapshot sessions 直接映射为单一扁平列表；尚未实现按项目分组、每组 10 条和项目历史展开。",
      "basis": "对当前生产 Renderer、Chat snapshot 和现有 Renderer 测试的直接检查。",
      "evidence": [
        "runtime/arcorbit/desktop/renderer/index.html:105-110",
        "runtime/arcorbit/desktop/renderer/renderer.js:807-838",
        "runtime/arcorbit/src/chat-coordinator.mjs:43-66",
        "runtime/arcorbit/test/desktop-renderer.test.mjs:519-526"
      ]
    },
    {
      "id": "FACT-chat-project-grouped-navigation-realized",
      "revision": 1,
      "status": "accepted",
      "statement": "生产 ArcOrbit Chat 现在从完整 snapshot sessions 直接按 Product Workspace 分组；项目组按最近活动排序、组内会话按更新时间和稳定 ID 排序，每组默认最多显示最近 10 条，仅在超出时提供对应组的完整历史展开/收起，历史中的当前会话保持可见。新对话头部显式显示目标工作区并允许首次发送前切换；既有会话显示固定归属且选择器不可用，缺失工作区的历史仍可读但不能发送。",
      "basis": "对生产 Renderer、纯分组投影、Chat State Coordinator 边界及完整 ArcOrbit 自动化回归的直接实现和验证。",
      "evidence": [
        "runtime/arcorbit/desktop/renderer/chat-session-groups.mjs:1-50",
        "runtime/arcorbit/desktop/renderer/renderer.js:323-332",
        "runtime/arcorbit/desktop/renderer/renderer.js:807-912",
        "runtime/arcorbit/desktop/renderer/index.html:104-119",
        "runtime/arcorbit/test/chat-session-groups.test.mjs:14-58",
        "runtime/arcorbit/test/desktop-renderer.test.mjs:506-549",
        "runtime/arcorbit/test/chat-coordinator.test.mjs:99-173",
        "Verification: npm run check — 345 tests, 340 passed, 5 environment-gated skips, 0 failed"
      ]
    }
  ],
  "state_impacts": [
    {
      "id": "IMPACT-chat-grouping-experience",
      "fact_id": "FACT-chat-project-grouped-session-navigation",
      "fact_revision": 1,
      "target": {
        "kind": "software_decision",
        "ref": "experience_and_interaction",
        "revision": 35
      },
      "effect": "upheld",
      "reason": "交互源、规范投影与灰度线框现已完整覆盖分组、10 条限制、历史展开和新会话项目切换。",
      "gap_ids": [],
      "evidence": [
        "arckit/interaction/chat-workspace/interaction.md",
        "arckit/interaction/chat-workspace/default.html"
      ]
    },
    {
      "id": "IMPACT-chat-grouping-interaction-invariant",
      "fact_id": "FACT-chat-project-grouped-session-navigation",
      "fact_revision": 1,
      "target": {
        "kind": "software_invariant",
        "ref": "interaction-expectations-remain-recoverable",
        "revision": null
      },
      "effect": "upheld",
      "reason": "页面主路径、状态、反馈、恢复和边界已经在持久交互源及线框投影中保持一致。",
      "gap_ids": [],
      "evidence": [
        "arckit/interaction/chat-workspace/interaction.md",
        "arckit/interaction/chat-workspace/default.html",
        "arckit/interaction/INDEX.md",
        "arckit/interaction/_map/feature-matrix.md"
      ]
    },
    {
      "id": "IMPACT-chat-grouping-product-capabilities",
      "fact_id": "FACT-chat-project-grouped-interaction-definition",
      "fact_revision": 1,
      "target": {
        "kind": "software_decision",
        "ref": "product_capabilities",
        "revision": 23
      },
      "effect": "upheld",
      "reason": "稳定产品规格现在明确包含按项目分组、每项目最近 10 条、历史入口和新会话显式项目归属能力。",
      "gap_ids": [],
      "evidence": [
        "arckit/spec/agentic-software-development/arcorbit-planned-workspaces.md"
      ]
    },
    {
      "id": "IMPACT-chat-grouping-realization",
      "fact_id": "FACT-chat-project-grouped-navigation-realized",
      "fact_revision": 1,
      "target": {
        "kind": "software_invariant",
        "ref": "accepted-facts-are-realized",
        "revision": null
      },
      "effect": "upheld",
      "reason": "生产 Renderer 已直接兑现按工作区分组、每组 10 条、项目历史及显式新对话归属的接受事实。",
      "gap_ids": [],
      "evidence": [
        "runtime/arcorbit/desktop/renderer/chat-session-groups.mjs",
        "runtime/arcorbit/desktop/renderer/renderer.js:831-912",
        "runtime/arcorbit/desktop/renderer/index.html:104-119",
        "runtime/arcorbit/test/chat-session-groups.test.mjs"
      ]
    },
    {
      "id": "IMPACT-chat-grouping-risk-control",
      "fact_id": "FACT-chat-project-grouped-navigation-realized",
      "fact_revision": 1,
      "target": {
        "kind": "software_invariant",
        "ref": "material-risks-have-credible-evidence",
        "revision": null
      },
      "effect": "upheld",
      "reason": "历史展开只改变 Renderer 本地集合，工作区切换仍委托 Chat State Coordinator 且仅在新草稿状态可用；既有 session owner 固定，完整测试覆盖并发草稿切换、后台刷新、首发归属和重启恢复。",
      "gap_ids": [],
      "evidence": [
        "runtime/arcorbit/desktop/renderer/renderer.js:323-332",
        "runtime/arcorbit/desktop/renderer/renderer.js:863-879",
        "runtime/arcorbit/desktop/renderer/chat-state-coordinator.mjs",
        "runtime/arcorbit/test/desktop-renderer.test.mjs:200-549",
        "runtime/arcorbit/test/chat-coordinator.test.mjs:99-173",
        "Verification: npm run check — 345 tests, 340 passed, 5 environment-gated skips, 0 failed"
      ]
    }
  ],
  "gaps": [
    {
      "id": "GAP-define-chat-project-grouped-navigation",
      "status": "resolved",
      "goal": "建立并持久化 Chat 按项目分组、每项目最近 10 条与历史入口、新建会话项目确认和首次发送前切换的完整交互及验收语义。",
      "reason": "现有持久规范采用顶部单 Product Workspace 范围和普通会话列表；直接实施会依赖尚未接受的分组排序、历史展开和草稿项目切换语义，因此先建立这一前置决策。",
      "derived_from": [
        "FACT-chat-project-grouped-session-navigation",
        "IMPACT-chat-grouping-experience",
        "IMPACT-chat-grouping-interaction-invariant"
      ],
      "blocked_by": [],
      "priority_basis": {
        "blocking": "阻塞后续 Renderer、Store/IPC 和测试实现边界。",
        "uncertainty": "需要明确项目排序、组内会话排序、历史入口呈现范围及草稿切换时的状态保持。",
        "risk": "若跳过持久交互定义，可能破坏会话固定项目归属、首条消息才创建会话和 Renderer 不控制 cwd 的既有边界。",
        "user_impact": "直接影响 Chat 的主要导航和新建会话流程。"
      },
      "responsibility": "agent",
      "evidence_required": [
        "更新后的 Chat 持久交互规范与灰度线框",
        "与现有 Product Workspace 固定归属、首条消息创建和安全边界一致的验收规则",
        "受影响 Project 决策与不变量的可追踪依据"
      ],
      "resolution": {
        "id": "GAP-define-chat-project-grouped-navigation",
        "status": "resolved",
        "outcome": "Chat 项目分组、历史会话和新会话项目归属的稳定交互及验收语义已持久化，并与固定 workspace/thread 和 Renderer 安全边界保持一致。",
        "reason": "产品规格、交互规范、灰度线框、索引与状态矩阵共同提供了完整且一致的持久证据。",
        "evidence": [
          "arckit/spec/agentic-software-development/arcorbit-planned-workspaces.md",
          "arckit/interaction/chat-workspace/interaction.md",
          "arckit/interaction/chat-workspace/default.html",
          "Validation: wireframe state structure 7/7 balanced; grayscale check passed; git diff --check passed"
        ],
        "occurred_at": "2026-08-23T21:35:19.128Z"
      }
    },
    {
      "id": "GAP-realize-chat-project-grouped-navigation",
      "status": "resolved",
      "goal": "在生产 ArcOrbit Chat 中实现并验证按项目分组、每项目默认 10 条与历史展开，以及新对话显式工作区确认和首次发送前快速切换。",
      "reason": "稳定产品与交互事实已经明确，但当前生产 Renderer 仍使用全局工作区选择器和扁平 session 列表。",
      "derived_from": [
        "FACT-chat-project-grouped-interaction-definition",
        "FACT-chat-current-renderer-not-grouped",
        "IMPACT-chat-grouping-realization",
        "IMPACT-chat-grouping-risk-control"
      ],
      "blocked_by": [],
      "priority_basis": {
        "blocking": "是 Case 达成用户预期的直接 realization 缺口。",
        "uncertainty": "需确认最小 Store/Coordinator/Renderer 状态扩展及历史展开状态的持久范围。",
        "risk": "必须防止草稿切换迁移既有 thread、Renderer 覆盖 cwd 或破坏后台 turn/选择状态。",
        "user_impact": "生产 Chat 目前仍未提供用户要求的分组浏览与显式新建归属。"
      },
      "responsibility": "agent",
      "evidence_required": [
        "生产 Renderer 按 Product Workspace 分组且每组默认最多 10 条",
        "仅在对应项目超过 10 条时显示完整历史展开/收起入口",
        "新对话显式显示目标工作区并支持保留草稿切换",
        "既有 session 项目归属与 thread/cwd 不可迁移",
        "覆盖分组排序、历史展开、草稿切换、后台 turn 和重启恢复的自动化测试",
        "相关 ArcOrbit 检查无回归"
      ],
      "resolution": {
        "id": "GAP-realize-chat-project-grouped-navigation",
        "status": "resolved",
        "outcome": "生产 ArcOrbit Chat 已实现按 Product Workspace 分组、每组最近 10 条与项目内历史展开，并在新对话头部提供可切换工作区；既有会话归属不可切换。",
        "reason": "纯分组投影、Renderer 交互、固定 owner 控制和跨层自动化回归共同提供了直接且可重复的 realization 证据。",
        "evidence": [
          "runtime/arcorbit/desktop/renderer/chat-session-groups.mjs:1-50",
          "runtime/arcorbit/desktop/renderer/renderer.js:807-912",
          "runtime/arcorbit/desktop/renderer/index.html:104-119",
          "runtime/arcorbit/test/chat-session-groups.test.mjs:14-58",
          "runtime/arcorbit/test/desktop-renderer.test.mjs:506-549",
          "Verification: npm run check — 345 tests, 340 passed, 5 environment-gated skips, 0 failed"
        ],
        "occurred_at": "2026-08-23T21:43:11.050Z"
      }
    }
  ],
  "content_revision": 2,
  "completion_review": {
    "status": "clean",
    "policy": {
      "initial_max_cycles": 10,
      "source": "runtime/arcorbit/config/case-policy.json",
      "snapshotted_at": "2026-08-23T21:22:44.339Z"
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
          "Implementation correctness: runtime/arcorbit/desktop/renderer/chat-session-groups.mjs:1-50 and runtime/arcorbit/desktop/renderer/renderer.js:807-912 implement stable project/session ordering, per-project ten-item previews, scoped history expansion and immutable persisted-session ownership.",
          "Problem resolution: arckit/spec/agentic-software-development/arcorbit-planned-workspaces.md, arckit/interaction/chat-workspace/interaction.md, runtime/arcorbit/desktop/renderer/index.html:104-119 and runtime/arcorbit/desktop/renderer/renderer.js:831-912 align the accepted product, interaction and production surfaces.",
          "Verification credibility: runtime/arcorbit/test/chat-session-groups.test.mjs, runtime/arcorbit/test/desktop-renderer.test.mjs and runtime/arcorbit/test/chat-coordinator.test.mjs directly cover grouping, ten-item history, draft switching, owner isolation and restart recovery.",
          "Verification rerun: node --test test/chat-session-groups.test.mjs test/desktop-renderer.test.mjs test/chat-coordinator.test.mjs — 60 passed, 0 failed.",
          "Full regression evidence: npm run check — 345 tests, 340 passed, 5 environment-gated skips, 0 failed.",
          "Regression risk: workspace switching remains delegated to chat-state-coordinator.mjs, history expansion is Renderer-local, and no Store/main/preload IPC or Automation boundary changed.",
          "Minimality: production changes are limited to one pure grouping helper and the existing Chat HTML/Renderer/styles, with focused tests; git diff --check passed."
        ],
        "occurred_at": "2026-08-23T21:44:44.962Z"
      }
    ],
    "evidence": [
      "Implementation correctness: runtime/arcorbit/desktop/renderer/chat-session-groups.mjs:1-50 and runtime/arcorbit/desktop/renderer/renderer.js:807-912 implement stable project/session ordering, per-project ten-item previews, scoped history expansion and immutable persisted-session ownership.",
      "Problem resolution: arckit/spec/agentic-software-development/arcorbit-planned-workspaces.md, arckit/interaction/chat-workspace/interaction.md, runtime/arcorbit/desktop/renderer/index.html:104-119 and runtime/arcorbit/desktop/renderer/renderer.js:831-912 align the accepted product, interaction and production surfaces.",
      "Verification credibility: runtime/arcorbit/test/chat-session-groups.test.mjs, runtime/arcorbit/test/desktop-renderer.test.mjs and runtime/arcorbit/test/chat-coordinator.test.mjs directly cover grouping, ten-item history, draft switching, owner isolation and restart recovery.",
      "Verification rerun: node --test test/chat-session-groups.test.mjs test/desktop-renderer.test.mjs test/chat-coordinator.test.mjs — 60 passed, 0 failed.",
      "Full regression evidence: npm run check — 345 tests, 340 passed, 5 environment-gated skips, 0 failed.",
      "Regression risk: workspace switching remains delegated to chat-state-coordinator.mjs, history expansion is Renderer-local, and no Store/main/preload IPC or Automation boundary changed.",
      "Minimality: production changes are limited to one pure grouping helper and the existing Chat HTML/Renderer/styles, with focused tests; git diff --check passed."
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
      "goal": "把用户确认的 Chat 项目分组与新建归属要求写成一致的稳定产品规格、页面交互源、规范投影和灰度线框。",
      "outcome": "completed",
      "gap_selection": {
        "mode": "candidate",
        "basis": "该 Case gap 是当前唯一 ready 的 Case 级候选，直接建立本次 Chat 优化的交互与验收前置事实，并阻塞后续生产实现；其用户影响和当前相关性均高于四个无直接依赖的 Project gaps。",
        "snapshot_token": "3667d1c4013e3b6b596fb35bcd8331ca845949142d80b0568319af84172e8856",
        "selected_ref": "case-gap:CASE-20260823-006:GAP-define-chat-project-grouped-navigation",
        "comparison_summary": "选择 Chat 项目分组交互定义 gap；Agent 场景验证、Runtime 韧性、安全实项验证和跨记录审计均 deferred，因为它们不承接当前用户事项且不阻塞本 Case。",
        "fresh_discovery_summary": "Fresh repair snapshot 未改变候选身份或工作边界。生产 Renderer 的下游 realization 义务只作为 Case gap 写回，不进入 Project decision gap_refs。",
        "considered": [
          {
            "ref": "project-gap:GAP-agent-scenario-evaluation",
            "source": "persisted",
            "eligibility": "case_required",
            "disposition": "deferred",
            "priority_basis": {
              "blocking": "不阻塞当前 Chat 用户事项。",
              "uncertainty": "高，但属于独立 Agent 场景验证。",
              "risk": "高，但与当前交互定义无直接依赖。",
              "user_impact": "低于当前 Chat 主路径优化。"
            },
            "reason": "需要独立 Case，且不能替代当前 Chat 交互前置决策。"
          },
          {
            "ref": "project-gap:GAP-runtime-resilience-and-adapters",
            "source": "persisted",
            "eligibility": "case_required",
            "disposition": "deferred",
            "priority_basis": {
              "blocking": "不阻塞当前 Chat 项目分组定义。",
              "uncertainty": "当前已有明确目标，不需要先处理 Runtime 韧性。",
              "risk": "高，但属于长期 Runtime 边界。",
              "user_impact": "当前 Chat 导航问题更直接。"
            },
            "reason": "与 Chat 自由会话的信息架构和草稿归属不构成同一验收主张。"
          },
          {
            "ref": "project-gap:GAP-security-real-project-validation",
            "source": "persisted",
            "eligibility": "case_required",
            "disposition": "deferred",
            "priority_basis": {
              "blocking": "不阻塞当前稳定交互定义。",
              "uncertainty": "需要真实权限项目，当前 Case 无该依赖。",
              "risk": "高，但验证对象不同。",
              "user_impact": "当前 Chat 主路径影响更直接。"
            },
            "reason": "真实权限项目验证应由独立 Case 承接。"
          },
          {
            "ref": "project-gap:GAP-cross-record-audit",
            "source": "persisted",
            "eligibility": "case_required",
            "disposition": "deferred",
            "priority_basis": {
              "blocking": "不阻塞本 Case。",
              "uncertainty": "跨记录审计边界与 Chat UI 无关。",
              "risk": "高。",
              "user_impact": "低于当前明确的 Chat 体验需求。"
            },
            "reason": "需要独立 Case，不能替代 Chat 交互与验收定义。"
          },
          {
            "ref": "case-gap:CASE-20260823-006:GAP-define-chat-project-grouped-navigation",
            "source": "persisted",
            "eligibility": "ready",
            "disposition": "selected",
            "priority_basis": {
              "blocking": "直接阻塞 Renderer、Store/IPC 和测试实现边界。",
              "uncertainty": "需要确定分组排序、历史展开和草稿项目切换语义。",
              "risk": "必须保留固定工作区、首条消息落盘和 Renderer 权限边界。",
              "user_impact": "直接影响 Chat 会话浏览与新建主路径。"
            },
            "reason": "当前唯一能在本轮完成、且直接建立后续实现依据的 ready Case gap。"
          }
        ]
      },
      "selected_gap": {
        "id": "GAP-define-chat-project-grouped-navigation",
        "responsibility": "agent",
        "goal": "建立并持久化 Chat 按项目分组、每项目最近 10 条与历史入口、新建会话项目确认和首次发送前切换的完整交互及验收语义。",
        "reason": "现有持久规范采用顶部单 Product Workspace 范围和普通会话列表；直接实施会依赖尚未接受的分组排序、历史展开和草稿项目切换语义，因此先建立这一前置决策。",
        "derived_from": [
          "FACT-chat-project-grouped-session-navigation",
          "IMPACT-chat-grouping-experience",
          "IMPACT-chat-grouping-interaction-invariant"
        ],
        "blocked_by": [],
        "priority_basis": {
          "blocking": "阻塞后续 Renderer、Store/IPC 和测试实现边界。",
          "uncertainty": "需要明确项目排序、组内会话排序、历史入口呈现范围及草稿切换时的状态保持。",
          "risk": "若跳过持久交互定义，可能破坏会话固定项目归属、首条消息才创建会话和 Renderer 不控制 cwd 的既有边界。",
          "user_impact": "直接影响 Chat 的主要导航和新建会话流程。"
        },
        "evidence_required": [
          "更新后的 Chat 持久交互规范与灰度线框",
          "与现有 Product Workspace 固定归属、首条消息创建和安全边界一致的验收规则",
          "受影响 Project 决策与不变量的可追踪依据"
        ]
      },
      "planned_transition": {
        "goal": "把用户确认的 Chat 项目分组与新建归属要求写成一致的稳定产品规格、页面交互源、规范投影和灰度线框。",
        "expected_state_change": "Chat 的分组排序、每项目 10 条限制、完整历史展开、草稿项目默认值/切换、发送后固定归属及安全边界成为可恢复且可验收的长期事实。"
      },
      "accepted_state_delta": {
        "resolved_gap": {
          "id": "GAP-define-chat-project-grouped-navigation",
          "status": "resolved",
          "outcome": "Chat 项目分组、历史会话和新会话项目归属的稳定交互及验收语义已持久化，并与固定 workspace/thread 和 Renderer 安全边界保持一致。",
          "reason": "产品规格、交互规范、灰度线框、索引与状态矩阵共同提供了完整且一致的持久证据。",
          "evidence": [
            "arckit/spec/agentic-software-development/arcorbit-planned-workspaces.md",
            "arckit/interaction/chat-workspace/interaction.md",
            "arckit/interaction/chat-workspace/default.html",
            "Validation: wireframe state structure 7/7 balanced; grayscale check passed; git diff --check passed"
          ]
        },
        "facts_added": [
          {
            "id": "FACT-chat-project-grouped-interaction-definition",
            "revision": 1,
            "status": "accepted",
            "statement": "Chat 左栏不受全局项目范围过滤，按 Product Workspace 分组会话；项目组和组内会话按最近活动时间确定排序，每组默认显示最近 10 个，超出时在组底部展开或收起完整历史且不改变当前会话。新对话始终显式显示目标工作区，默认取当前会话或最近成功使用的可用工作区，首次发送前切换保留草稿且不创建 session/thread，发送后项目归属固定。",
            "basis": "用户要求已经通过现有 Chat 生命周期、安全边界和页面交互体系被具体化为稳定产品及交互规则。",
            "evidence": [
              "arckit/spec/agentic-software-development/arcorbit-planned-workspaces.md:26-70",
              "arckit/spec/agentic-software-development/arcorbit-planned-workspaces.md:180-186",
              "arckit/interaction/chat-workspace/interaction.md:5-46",
              "arckit/interaction/chat-workspace/default.html:6-18"
            ]
          },
          {
            "id": "FACT-chat-current-renderer-not-grouped",
            "revision": 1,
            "status": "accepted",
            "statement": "当前生产 Chat Renderer 在侧栏使用一个全局 `chatProjectSelect`，并将 snapshot sessions 直接映射为单一扁平列表；尚未实现按项目分组、每组 10 条和项目历史展开。",
            "basis": "对当前生产 Renderer、Chat snapshot 和现有 Renderer 测试的直接检查。",
            "evidence": [
              "runtime/arcorbit/desktop/renderer/index.html:105-110",
              "runtime/arcorbit/desktop/renderer/renderer.js:807-838",
              "runtime/arcorbit/src/chat-coordinator.mjs:43-66",
              "runtime/arcorbit/test/desktop-renderer.test.mjs:519-526"
            ]
          }
        ],
        "facts_superseded": [],
        "impacts_added": [
          {
            "id": "IMPACT-chat-grouping-product-capabilities",
            "fact_id": "FACT-chat-project-grouped-interaction-definition",
            "fact_revision": 1,
            "target": {
              "kind": "software_decision",
              "ref": "product_capabilities",
              "revision": 23
            },
            "effect": "upheld",
            "reason": "稳定产品规格现在明确包含按项目分组、每项目最近 10 条、历史入口和新会话显式项目归属能力。",
            "gap_ids": [],
            "evidence": [
              "arckit/spec/agentic-software-development/arcorbit-planned-workspaces.md"
            ]
          },
          {
            "id": "IMPACT-chat-grouping-realization",
            "fact_id": "FACT-chat-current-renderer-not-grouped",
            "fact_revision": 1,
            "target": {
              "kind": "software_invariant",
              "ref": "accepted-facts-are-realized",
              "revision": null
            },
            "effect": "threatened",
            "reason": "生产 Renderer 仍显示全局工作区选择器和扁平会话列表，尚未兑现新接受的交互事实。",
            "gap_ids": [
              "GAP-realize-chat-project-grouped-navigation"
            ],
            "evidence": [
              "runtime/arcorbit/desktop/renderer/index.html:105-110",
              "runtime/arcorbit/desktop/renderer/renderer.js:822-837"
            ]
          },
          {
            "id": "IMPACT-chat-grouping-risk-control",
            "fact_id": "FACT-chat-project-grouped-interaction-definition",
            "fact_revision": 1,
            "target": {
              "kind": "software_invariant",
              "ref": "material-risks-have-credible-evidence",
              "revision": null
            },
            "effect": "threatened",
            "reason": "新交互保持固定 session owner 和 Renderer 权限边界，但生产实现及回归证据尚未证明分组、历史展开和草稿项目切换不会迁移既有 thread 或覆盖 cwd。",
            "gap_ids": [
              "GAP-realize-chat-project-grouped-navigation"
            ],
            "evidence": [
              "arckit/interaction/chat-workspace/interaction.md:35-46",
              "runtime/arcorbit/desktop/renderer/renderer.js:807-838"
            ]
          }
        ],
        "impacts_updated": [
          {
            "id": "IMPACT-chat-grouping-experience",
            "fact_id": "FACT-chat-project-grouped-session-navigation",
            "fact_revision": 1,
            "target": {
              "kind": "software_decision",
              "ref": "experience_and_interaction",
              "revision": 35
            },
            "effect": "upheld",
            "reason": "交互源、规范投影与灰度线框现已完整覆盖分组、10 条限制、历史展开和新会话项目切换。",
            "gap_ids": [],
            "evidence": [
              "arckit/interaction/chat-workspace/interaction.md",
              "arckit/interaction/chat-workspace/default.html"
            ]
          },
          {
            "id": "IMPACT-chat-grouping-interaction-invariant",
            "fact_id": "FACT-chat-project-grouped-session-navigation",
            "fact_revision": 1,
            "target": {
              "kind": "software_invariant",
              "ref": "interaction-expectations-remain-recoverable",
              "revision": null
            },
            "effect": "upheld",
            "reason": "页面主路径、状态、反馈、恢复和边界已经在持久交互源及线框投影中保持一致。",
            "gap_ids": [],
            "evidence": [
              "arckit/interaction/chat-workspace/interaction.md",
              "arckit/interaction/chat-workspace/default.html",
              "arckit/interaction/INDEX.md",
              "arckit/interaction/_map/feature-matrix.md"
            ]
          }
        ],
        "gaps_added": [
          {
            "id": "GAP-realize-chat-project-grouped-navigation",
            "status": "open",
            "goal": "在生产 ArcOrbit Chat 中实现并验证按项目分组、每项目默认 10 条与历史展开，以及新对话显式工作区确认和首次发送前快速切换。",
            "reason": "稳定产品与交互事实已经明确，但当前生产 Renderer 仍使用全局工作区选择器和扁平 session 列表。",
            "derived_from": [
              "FACT-chat-project-grouped-interaction-definition",
              "FACT-chat-current-renderer-not-grouped",
              "IMPACT-chat-grouping-realization",
              "IMPACT-chat-grouping-risk-control"
            ],
            "blocked_by": [],
            "priority_basis": {
              "blocking": "是 Case 达成用户预期的直接 realization 缺口。",
              "uncertainty": "需确认最小 Store/Coordinator/Renderer 状态扩展及历史展开状态的持久范围。",
              "risk": "必须防止草稿切换迁移既有 thread、Renderer 覆盖 cwd 或破坏后台 turn/选择状态。",
              "user_impact": "生产 Chat 目前仍未提供用户要求的分组浏览与显式新建归属。"
            },
            "responsibility": "agent",
            "evidence_required": [
              "生产 Renderer 按 Product Workspace 分组且每组默认最多 10 条",
              "仅在对应项目超过 10 条时显示完整历史展开/收起入口",
              "新对话显式显示目标工作区并支持保留草稿切换",
              "既有 session 项目归属与 thread/cwd 不可迁移",
              "覆盖分组排序、历史展开、草稿切换、后台 turn 和重启恢复的自动化测试",
              "相关 ArcOrbit 检查无回归"
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
            "observed_revision": 22,
            "set_decision": {
              "status": "settled",
              "statement": "ArcOrbit 保留 Setup Readiness、受监督的一待办一 thread Automation、trusted ledger transition、介入/恢复、验收反馈、Workshop 平台组合、Work 日常管理与产品反馈能力。Personal / Chat 升级为绑定本地 Product Workspace 的真实 Codex 自由对话，支持持久会话、固定 thread、流式消息、工具与审批状态、停止、失败/重启恢复、重命名和安全删除；会话列表直接按 Product Workspace 分组，每个项目默认展示最近 10 个会话并提供项目历史入口，新对话在首条消息前显式显示并允许切换目标工作区；Chat 不创建或转换 Idea、Work、Task、Case、ledger 或 Automation Run。Idea、Release、Operations 和 Engineering 继续作为 planning-only 工作空间。既有 Workshop realtime、Work、Feedback、Organization、Domain Profile、Automation human Gate 和分发边界保持不变。Work 使用弹出式多维筛选与单行无按钮列表，完整动作归于 Inspector；评论图片随时间线默认加载，点击后进入具备缩放、适配、实际大小、旋转、平移、重置和另存为的独立窗口。Feedback 使用单行列表，并默认逐项目探测 Workshop 双向会话能力，真实不可用时回退 V1。Automation 人工介入的消息列表直接复用 Chat Conversation Surface；Automation 的 gap/round、ledger、证据、恢复和执行控制能力保持完整并归入左右面板，执行总览提供完整墙钟时间、累计 gap 轮数及逐 gap 的目标、工作和结果。",
              "reason": "操作者明确要求 Chat 无需预先选择项目即可分组浏览，并在新建时清楚确认和快速切换项目；稳定产品规格已经具体化该能力且保留既有 Chat 隔离边界。",
              "evidence": [
                "Current operator input, 2026-08-24",
                "arckit/spec/agentic-software-development/arcorbit-planned-workspaces.md",
                "arckit/interaction/chat-workspace/interaction.md"
              ],
              "confidence": "high",
              "resume_condition": "当 Chat 分组容量、历史浏览模式、新会话默认项目或远端同步能力变化时重审。"
            },
            "gap_refs": [],
            "reason": "本轮建立了新的稳定 Chat 产品能力。",
            "evidence": [
              "arckit/spec/agentic-software-development/arcorbit-planned-workspaces.md"
            ]
          },
          {
            "area_ref": "experience_and_interaction",
            "observed_revision": 34,
            "set_decision": {
              "status": "settled",
              "statement": "ArcOrbit 保持 Personal、Product Lifecycle、Organization 三组导航和既有 Work、Automation、Feedback、Organization、Setup、账户及产品反馈语义。Personal / Chat 使用按 Product Workspace 分组的会话列表、独立 transcript 和 Composer：页面无需预先选择项目，每个项目默认显示最近 10 个会话并在超出时从组底部展开完整历史；新对话在首条非空消息前显式显示目标工作区，默认取当前会话或最近成功使用的可用工作区，允许保留草稿快速切换，发送后会话固定绑定该本地 Product Workspace 和 Codex thread。支持选择、重命名、删除、跨页面后台运行和重启恢复。消息以稳定 item 流式更新，支持 Markdown、代码复制、折叠非空 reasoning、单行工具状态、用户审批和智能自动滚动。starting、running、waiting approval 状态均可停止；interrupt 保留部分回答，继续操作会在同一 thread 启动新 turn。删除活动会话先等待 interrupt 终态，失败时不部分删除。没有可用本地工作区时允许保留草稿但禁止发送，并提供配置恢复入口。Chat 不调用 state-driven Runtime，不转换其他对象；Automation task thread、human Gate、Composer 与执行控制保持独立，但人工介入中间消息区直接复用 Chat Conversation Surface。Idea、Release、Operations 和 Engineering 继续呈现计划交互。Chat 返回页面时先用缓存会话和 transcript 立即切换，再后台刷新并显示同步或失败状态；Work 横排筛选使用弹出菜单且列表单行无按钮，评论图片自动加载且在独立窗口完成常用查看操作，单图失败不阻塞时间线；Feedback 列表单行，详情承载完整会话和动作。Automation 左栏承载任务、项目、边界、当前选择和介入控制；右栏承载完整执行墙钟时间、累计 gap 轮数、逐 gap 目标/工作/结果，以及 Run、token、Gate、ledger、Git、证据和结构化结果。Automation 专属 loop/round/ledger 事件不进入中间对话流。",
              "reason": "稳定交互源和线框现已明确分组、历史列表、新会话归属及恢复语义，同时保留固定 workspace/thread 和安全边界。",
              "evidence": [
                "Current operator input, 2026-08-24",
                "arckit/interaction/chat-workspace/interaction.md",
                "arckit/interaction/chat-workspace/default.html"
              ],
              "confidence": "high",
              "resume_condition": "当 Chat 分组、历史浏览、新会话工作区选择、Conversation Surface 或 Automation 面板信息架构变化时重审。"
            },
            "gap_refs": [],
            "reason": "当前 Gap 直接澄清了 Chat 的主路径、决策点和状态反馈。",
            "evidence": [
              "arckit/interaction/chat-workspace/interaction.md",
              "arckit/interaction/chat-workspace/default.html"
            ]
          },
          {
            "area_ref": "quality_and_validation",
            "observed_revision": 7,
            "set_decision": {
              "status": "settled",
              "statement": "既有协议、Runtime、realtime、Work 和安全验证义务保持不变。真实 Chat 还必须以 adapter、Store、Coordinator、typed main/preload IPC、Renderer 和真实 app-server smoke 的跨层证据证明：首条消息幂等创建 session/thread；连续 turn resume 同一 thread；不同 Chat/Automation owner 隔离；稳定 item streaming、Markdown、reasoning/tool 投影和智能滚动正确；starting/running/waiting approval 均可 interrupt；部分输出和重启恢复不重复请求；活动删除先 interrupt 且无部分删除；审批异步并 fail closed；Renderer 无法覆盖 cwd/thread/method/command；Chat 不触发 using-arckit、ledger、Workshop mutation、Automation lease 或 human Gate。Chat 会话导航还必须证明：会话不受全局项目范围过滤并按 Product Workspace 确定分组；每组默认最多 10 条且仅在超出时出现对应历史入口；展开/收起不改变选择、草稿或后台 turn；新对话持续显示目标工作区，首次发送前切换保留草稿且不创建 session/thread，发送后不能迁移既有 thread/cwd。Automation 介入还必须证明 Chat 与 Automation 使用同一 Conversation Surface 实现和一致的 Markdown、reasoning、tool、approval/error、复制、外链与智能滚动行为；结构化跨 Run 汇总必须覆盖完整墙钟时间、累计 gap 轮数、逐 gap 目标/工作/结果、进行中和旧 Activity 兼容，并回归 Gate、恢复、ledger、Git、证据和执行控制未降级。",
              "reason": "新的项目分组与草稿项目切换改变了 Chat 导航和 owner 边界，需要明确可重复的实现及回归验收证据。",
              "evidence": [
                "arckit/spec/agentic-software-development/arcorbit-planned-workspaces.md",
                "arckit/interaction/chat-workspace/interaction.md",
                "runtime/arcorbit/desktop/renderer/renderer.js"
              ],
              "confidence": "high",
              "resume_condition": "当 Chat 分组容量、历史状态、草稿 owner、Conversation Surface 消息类型或 Automation 执行摘要字段变化时重审。"
            },
            "gap_refs": [],
            "reason": "本轮稳定定义了后续实现必须证明的分组、历史和 owner 安全验收口径；具体未实现义务由 Case gap 承接，不写入 Project gap_refs。",
            "evidence": [
              "arckit/spec/agentic-software-development/arcorbit-planned-workspaces.md:180-186",
              "arckit/interaction/chat-workspace/interaction.md:30-46"
            ]
          }
        ],
        "software_invariant_changes": [],
        "project_gap_changes": [],
        "selection_context_change": null,
        "evidence": [
          "arckit/spec/agentic-software-development/arcorbit-planned-workspaces.md",
          "arckit/interaction/chat-workspace/interaction.md",
          "arckit/interaction/chat-workspace/default.html",
          "arckit/spec/INDEX.md",
          "arckit/interaction/INDEX.md"
        ]
      },
      "invariant_assessment": {
        "project_revision": 196,
        "judgments": [
          {
            "invariant_ref": "product-expectations-remain-recoverable",
            "disposition": "upheld",
            "reason": "稳定产品规格和产品索引已经准确记录项目分组、每组 10 条、历史入口及新会话项目归属。",
            "fact_refs": [
              "FACT-chat-project-grouped-session-navigation",
              "FACT-chat-project-grouped-interaction-definition"
            ],
            "evidence": [
              "arckit/spec/agentic-software-development/arcorbit-planned-workspaces.md",
              "arckit/spec/INDEX.md",
              "arckit/spec/_map/feature-matrix.md"
            ],
            "gap_refs": []
          },
          {
            "invariant_ref": "interaction-expectations-remain-recoverable",
            "disposition": "upheld",
            "reason": "交互策略、主路径、状态规则、可访问性和灰度线框共同覆盖所有受影响决策点与恢复语义。",
            "fact_refs": [
              "FACT-chat-project-grouped-session-navigation",
              "FACT-chat-project-grouped-interaction-definition"
            ],
            "evidence": [
              "arckit/interaction/chat-workspace/interaction.md",
              "arckit/interaction/chat-workspace/default.html",
              "arckit/interaction/INDEX.md",
              "arckit/interaction/_map/feature-matrix.md"
            ],
            "gap_refs": []
          },
          {
            "invariant_ref": "visual-language-remains-consistent",
            "disposition": "not_relevant",
            "reason": "本轮只用既有灰度线框组件投影新的交互结构，没有建立或修改主题、品牌、Design Token 或组件视觉规则。",
            "fact_refs": [],
            "evidence": [],
            "gap_refs": []
          },
          {
            "invariant_ref": "technical-decisions-remain-explainable",
            "disposition": "upheld",
            "reason": "新交互明确保持每个 session 固定单一 Product Workspace/thread、草稿切换不创建 owner、发送后不可迁移和 Renderer 不覆盖 cwd 的既有技术边界。",
            "fact_refs": [
              "FACT-chat-project-grouped-interaction-definition"
            ],
            "evidence": [
              "arckit/tech/arcorbit/desktop-execution-solution.md:23-50",
              "arckit/tech/arcorbit/desktop-execution-solution.md:162-175",
              "arckit/interaction/chat-workspace/interaction.md:35-46"
            ],
            "gap_refs": []
          },
          {
            "invariant_ref": "accepted-facts-are-realized",
            "disposition": "threatened",
            "reason": "生产 Renderer 仍保留全局 `chatProjectSelect` 并直接扁平映射全部 sessions，尚未实现本轮接受的分组和历史行为。",
            "fact_refs": [
              "FACT-chat-project-grouped-interaction-definition",
              "FACT-chat-current-renderer-not-grouped"
            ],
            "evidence": [
              "runtime/arcorbit/desktop/renderer/index.html:105-110",
              "runtime/arcorbit/desktop/renderer/renderer.js:822-837"
            ],
            "gap_refs": [
              "GAP-realize-chat-project-grouped-navigation"
            ]
          },
          {
            "invariant_ref": "material-risks-have-credible-evidence",
            "disposition": "threatened",
            "reason": "文档已限定草稿 owner 与既有 thread/cwd 不可迁移，但新的生产交互尚无实现和回归证据证明该风险受控。",
            "fact_refs": [
              "FACT-chat-project-grouped-interaction-definition"
            ],
            "evidence": [
              "arckit/interaction/chat-workspace/interaction.md:35-46"
            ],
            "gap_refs": [
              "GAP-realize-chat-project-grouped-navigation"
            ]
          }
        ]
      },
      "evidence": [
        "arckit/spec/agentic-software-development/arcorbit-planned-workspaces.md",
        "arckit/interaction/chat-workspace/interaction.md",
        "arckit/interaction/chat-workspace/default.html",
        "arckit/spec/INDEX.md",
        "arckit/spec/_map/feature-matrix.md",
        "arckit/interaction/INDEX.md",
        "arckit/interaction/_map/feature-matrix.md",
        "runtime/arcorbit/desktop/renderer/index.html:105-110",
        "runtime/arcorbit/desktop/renderer/renderer.js:807-838",
        "runtime/arcorbit/src/chat-coordinator.mjs:43-66",
        "Validation: default.html contains 7 balanced details/trigger/canvas/device/component/interaction state projections",
        "Validation: wireframe grayscale check passed",
        "Validation: git diff --check passed",
        "Repair: software decision impacts reference post-transition revisions product_capabilities@23 and experience_and_interaction@35",
        "Repair: Case realization gap is excluded from Project software_definition gap_refs"
      ],
      "runtime_result_ref": "arckit-runtime://runs/RUN-20260823-212114557Z",
      "occurred_at": "2026-08-23T21:35:19.128Z"
    },
    {
      "round": 2,
      "transition_schema_version": "arckit-case-transition/v8",
      "goal": "在生产 Renderer 中兑现按项目分组、每组 10 条历史机制和新对话显式工作区归属，同时保持既有 Chat owner、thread、cwd 与后台 turn 边界。",
      "outcome": "completed",
      "gap_selection": {
        "mode": "candidate",
        "basis": "该 Case realization gap 是 fresh snapshot 中唯一 ready 的 Case 级候选，直接阻塞当前用户预期和两个受威胁软件不变量；四个 Project gaps 均需独立 Case，不能替代当前生产实现。",
        "snapshot_token": "63e45070406c5ececd43f49e194d9f8b38181795a46693dbffd97546dafc9d5c",
        "selected_ref": "case-gap:CASE-20260823-006:GAP-realize-chat-project-grouped-navigation",
        "comparison_summary": "选择生产 Chat 项目分组 realization gap；Agent 场景验证、Runtime 韧性、安全实项验证和跨记录审计均 deferred，因为它们不承接当前 Case 的生产体验闭合。",
        "fresh_discovery_summary": "Fresh 检查未发现优先于当前 realization gap 的新工作；现有 Coordinator、Store 与 typed IPC 已满足固定 owner 和草稿切换边界，因此实现收敛于纯分组投影、Renderer 布局和回归测试。",
        "considered": [
          {
            "ref": "project-gap:GAP-agent-scenario-evaluation",
            "source": "persisted",
            "eligibility": "case_required",
            "disposition": "deferred",
            "priority_basis": {
              "blocking": "不阻塞当前 Chat realization。",
              "uncertainty": "高，但属于独立 Agent 场景验证。",
              "risk": "高，但与当前 Renderer 主路径无直接依赖。",
              "user_impact": "低于当前明确的 Chat 导航缺口。"
            },
            "reason": "需要独立 Case，不能替代当前生产交互实现。"
          },
          {
            "ref": "project-gap:GAP-runtime-resilience-and-adapters",
            "source": "persisted",
            "eligibility": "case_required",
            "disposition": "deferred",
            "priority_basis": {
              "blocking": "不阻塞当前 Chat 分组投影。",
              "uncertainty": "当前 Chat 所需 Store/Coordinator 边界已经明确。",
              "risk": "高，但属于长期 Runtime 韧性范围。",
              "user_impact": "当前 Chat 主路径影响更直接。"
            },
            "reason": "需要独立 Case，且本轮无需扩展 Runtime adapter。"
          },
          {
            "ref": "project-gap:GAP-security-real-project-validation",
            "source": "persisted",
            "eligibility": "case_required",
            "disposition": "deferred",
            "priority_basis": {
              "blocking": "不阻塞当前 Renderer 实现。",
              "uncertainty": "需要真实权限项目，当前工作不具备该外部条件。",
              "risk": "高，但验证对象不同。",
              "user_impact": "低于当前分组和新建归属体验。"
            },
            "reason": "真实权限项目验证应由独立 Case 承接。"
          },
          {
            "ref": "project-gap:GAP-cross-record-audit",
            "source": "persisted",
            "eligibility": "case_required",
            "disposition": "deferred",
            "priority_basis": {
              "blocking": "不阻塞本 Case。",
              "uncertainty": "跨记录审计边界与 Chat UI 无关。",
              "risk": "高。",
              "user_impact": "低于当前明确的用户事项。"
            },
            "reason": "需要独立 Case，不能替代当前生产 realization。"
          },
          {
            "ref": "case-gap:CASE-20260823-006:GAP-realize-chat-project-grouped-navigation",
            "source": "persisted",
            "eligibility": "ready",
            "disposition": "selected",
            "priority_basis": {
              "blocking": "直接阻塞当前 Case 达成用户预期。",
              "uncertainty": "需要落实分组排序、10 条预览、历史展开及草稿 owner 呈现。",
              "risk": "必须保持既有 session/thread/cwd 固定归属和后台 turn 状态。",
              "user_impact": "直接影响 Chat 会话浏览和新建主路径。"
            },
            "reason": "当前唯一能够在本轮完成并闭合生产体验与风险证据的 ready Case gap。"
          }
        ]
      },
      "selected_gap": {
        "id": "GAP-realize-chat-project-grouped-navigation",
        "responsibility": "agent",
        "goal": "在生产 ArcOrbit Chat 中实现并验证按项目分组、每项目默认 10 条与历史展开，以及新对话显式工作区确认和首次发送前快速切换。",
        "reason": "稳定产品与交互事实已经明确，但当前生产 Renderer 仍使用全局工作区选择器和扁平 session 列表。",
        "derived_from": [
          "FACT-chat-project-grouped-interaction-definition",
          "FACT-chat-current-renderer-not-grouped",
          "IMPACT-chat-grouping-realization",
          "IMPACT-chat-grouping-risk-control"
        ],
        "blocked_by": [],
        "priority_basis": {
          "blocking": "是 Case 达成用户预期的直接 realization 缺口。",
          "uncertainty": "需确认最小 Store/Coordinator/Renderer 状态扩展及历史展开状态的持久范围。",
          "risk": "必须防止草稿切换迁移既有 thread、Renderer 覆盖 cwd 或破坏后台 turn/选择状态。",
          "user_impact": "生产 Chat 目前仍未提供用户要求的分组浏览与显式新建归属。"
        },
        "evidence_required": [
          "生产 Renderer 按 Product Workspace 分组且每组默认最多 10 条",
          "仅在对应项目超过 10 条时显示完整历史展开/收起入口",
          "新对话显式显示目标工作区并支持保留草稿切换",
          "既有 session 项目归属与 thread/cwd 不可迁移",
          "覆盖分组排序、历史展开、草稿切换、后台 turn 和重启恢复的自动化测试",
          "相关 ArcOrbit 检查无回归"
        ]
      },
      "planned_transition": {
        "goal": "在生产 Renderer 中兑现按项目分组、每组 10 条历史机制和新对话显式工作区归属，同时保持既有 Chat owner、thread、cwd 与后台 turn 边界。",
        "expected_state_change": "生产 Chat 与稳定产品及交互事实一致，原先的扁平列表事实被 supersede，realization 和风险控制 impacts 转为 upheld；Case 普通工作闭合并等待独立 Completion Review。"
      },
      "accepted_state_delta": {
        "resolved_gap": {
          "id": "GAP-realize-chat-project-grouped-navigation",
          "status": "resolved",
          "outcome": "生产 ArcOrbit Chat 已实现按 Product Workspace 分组、每组最近 10 条与项目内历史展开，并在新对话头部提供可切换工作区；既有会话归属不可切换。",
          "reason": "纯分组投影、Renderer 交互、固定 owner 控制和跨层自动化回归共同提供了直接且可重复的 realization 证据。",
          "evidence": [
            "runtime/arcorbit/desktop/renderer/chat-session-groups.mjs:1-50",
            "runtime/arcorbit/desktop/renderer/renderer.js:807-912",
            "runtime/arcorbit/desktop/renderer/index.html:104-119",
            "runtime/arcorbit/test/chat-session-groups.test.mjs:14-58",
            "runtime/arcorbit/test/desktop-renderer.test.mjs:506-549",
            "Verification: npm run check — 345 tests, 340 passed, 5 environment-gated skips, 0 failed"
          ]
        },
        "facts_added": [
          {
            "id": "FACT-chat-project-grouped-navigation-realized",
            "revision": 1,
            "status": "accepted",
            "statement": "生产 ArcOrbit Chat 现在从完整 snapshot sessions 直接按 Product Workspace 分组；项目组按最近活动排序、组内会话按更新时间和稳定 ID 排序，每组默认最多显示最近 10 条，仅在超出时提供对应组的完整历史展开/收起，历史中的当前会话保持可见。新对话头部显式显示目标工作区并允许首次发送前切换；既有会话显示固定归属且选择器不可用，缺失工作区的历史仍可读但不能发送。",
            "basis": "对生产 Renderer、纯分组投影、Chat State Coordinator 边界及完整 ArcOrbit 自动化回归的直接实现和验证。",
            "evidence": [
              "runtime/arcorbit/desktop/renderer/chat-session-groups.mjs:1-50",
              "runtime/arcorbit/desktop/renderer/renderer.js:323-332",
              "runtime/arcorbit/desktop/renderer/renderer.js:807-912",
              "runtime/arcorbit/desktop/renderer/index.html:104-119",
              "runtime/arcorbit/test/chat-session-groups.test.mjs:14-58",
              "runtime/arcorbit/test/desktop-renderer.test.mjs:506-549",
              "runtime/arcorbit/test/chat-coordinator.test.mjs:99-173",
              "Verification: npm run check — 345 tests, 340 passed, 5 environment-gated skips, 0 failed"
            ]
          }
        ],
        "facts_superseded": [
          {
            "id": "FACT-chat-current-renderer-not-grouped",
            "revision": 1,
            "reason": "生产 Renderer 已不再使用侧栏全局项目筛选和扁平会话列表；项目分组、10 条预览及项目历史入口已经实现。",
            "evidence": [
              "runtime/arcorbit/desktop/renderer/renderer.js:831-879",
              "runtime/arcorbit/desktop/renderer/index.html:104-119",
              "runtime/arcorbit/test/chat-session-groups.test.mjs:14-58"
            ]
          }
        ],
        "impacts_added": [],
        "impacts_updated": [
          {
            "id": "IMPACT-chat-grouping-realization",
            "fact_id": "FACT-chat-project-grouped-navigation-realized",
            "fact_revision": 1,
            "target": {
              "kind": "software_invariant",
              "ref": "accepted-facts-are-realized",
              "revision": null
            },
            "effect": "upheld",
            "reason": "生产 Renderer 已直接兑现按工作区分组、每组 10 条、项目历史及显式新对话归属的接受事实。",
            "gap_ids": [],
            "evidence": [
              "runtime/arcorbit/desktop/renderer/chat-session-groups.mjs",
              "runtime/arcorbit/desktop/renderer/renderer.js:831-912",
              "runtime/arcorbit/desktop/renderer/index.html:104-119",
              "runtime/arcorbit/test/chat-session-groups.test.mjs"
            ]
          },
          {
            "id": "IMPACT-chat-grouping-risk-control",
            "fact_id": "FACT-chat-project-grouped-navigation-realized",
            "fact_revision": 1,
            "target": {
              "kind": "software_invariant",
              "ref": "material-risks-have-credible-evidence",
              "revision": null
            },
            "effect": "upheld",
            "reason": "历史展开只改变 Renderer 本地集合，工作区切换仍委托 Chat State Coordinator 且仅在新草稿状态可用；既有 session owner 固定，完整测试覆盖并发草稿切换、后台刷新、首发归属和重启恢复。",
            "gap_ids": [],
            "evidence": [
              "runtime/arcorbit/desktop/renderer/renderer.js:323-332",
              "runtime/arcorbit/desktop/renderer/renderer.js:863-879",
              "runtime/arcorbit/desktop/renderer/chat-state-coordinator.mjs",
              "runtime/arcorbit/test/desktop-renderer.test.mjs:200-549",
              "runtime/arcorbit/test/chat-coordinator.test.mjs:99-173",
              "Verification: npm run check — 345 tests, 340 passed, 5 environment-gated skips, 0 failed"
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
          "runtime/arcorbit/desktop/renderer/chat-session-groups.mjs",
          "runtime/arcorbit/desktop/renderer/renderer.js",
          "runtime/arcorbit/desktop/renderer/index.html",
          "runtime/arcorbit/desktop/renderer/styles.css",
          "runtime/arcorbit/test/chat-session-groups.test.mjs",
          "runtime/arcorbit/test/desktop-renderer.test.mjs",
          "Verification: npm run check — 345 tests, 340 passed, 5 environment-gated skips, 0 failed"
        ]
      },
      "invariant_assessment": {
        "project_revision": 197,
        "judgments": [
          {
            "invariant_ref": "product-expectations-remain-recoverable",
            "disposition": "upheld",
            "reason": "稳定产品规格继续完整定义项目分组、每组 10 条、历史入口和新对话显式归属，生产实现未改变其产品含义。",
            "fact_refs": [
              "FACT-chat-project-grouped-session-navigation",
              "FACT-chat-project-grouped-interaction-definition",
              "FACT-chat-project-grouped-navigation-realized"
            ],
            "evidence": [
              "arckit/spec/agentic-software-development/arcorbit-planned-workspaces.md",
              "arckit/spec/INDEX.md",
              "arckit/spec/_map/feature-matrix.md"
            ],
            "gap_refs": []
          },
          {
            "invariant_ref": "interaction-expectations-remain-recoverable",
            "disposition": "upheld",
            "reason": "持久交互源、灰度线框和生产 Renderer 对分组、历史展开、草稿切换、固定归属及不可用工作区恢复保持一致。",
            "fact_refs": [
              "FACT-chat-project-grouped-session-navigation",
              "FACT-chat-project-grouped-interaction-definition",
              "FACT-chat-project-grouped-navigation-realized"
            ],
            "evidence": [
              "arckit/interaction/chat-workspace/interaction.md",
              "arckit/interaction/chat-workspace/default.html",
              "runtime/arcorbit/desktop/renderer/index.html:104-119",
              "runtime/arcorbit/desktop/renderer/renderer.js:831-912"
            ],
            "gap_refs": []
          },
          {
            "invariant_ref": "visual-language-remains-consistent",
            "disposition": "upheld",
            "reason": "新增分组标题、历史入口和头部工作区选择器继续使用现有灰度、间距、按钮、边框与响应式布局语言，没有引入新的主题或品牌规则。",
            "fact_refs": [
              "FACT-chat-project-grouped-navigation-realized"
            ],
            "evidence": [
              "arckit/visual/_library/brief.md",
              "arckit/visual/_library/design-tokens.yaml",
              "runtime/arcorbit/desktop/renderer/index.html:104-119",
              "runtime/arcorbit/desktop/renderer/styles.css:469-508"
            ],
            "gap_refs": []
          },
          {
            "invariant_ref": "technical-decisions-remain-explainable",
            "disposition": "upheld",
            "reason": "分组和历史是无 IPC 的纯 Renderer 投影；新对话工作区变化继续通过既有 typed Coordinator 方法，既有 session 选择器被禁用且 thread/cwd ownership 没有扩展。",
            "fact_refs": [
              "FACT-chat-project-grouped-interaction-definition",
              "FACT-chat-project-grouped-navigation-realized"
            ],
            "evidence": [
              "arckit/tech/arcorbit/desktop-execution-solution.md",
              "runtime/arcorbit/desktop/renderer/chat-session-groups.mjs",
              "runtime/arcorbit/desktop/renderer/renderer.js:323-332",
              "runtime/arcorbit/desktop/renderer/renderer.js:807-879",
              "runtime/arcorbit/desktop/renderer/chat-state-coordinator.mjs"
            ],
            "gap_refs": []
          },
          {
            "invariant_ref": "accepted-facts-are-realized",
            "disposition": "upheld",
            "reason": "生产代码与直接单元测试证明全部 snapshot sessions 按项目分组、每组默认 10 条、超出才显示组内历史，且新对话显式展示并允许切换工作区。",
            "fact_refs": [
              "FACT-chat-project-grouped-session-navigation",
              "FACT-chat-project-grouped-interaction-definition",
              "FACT-chat-project-grouped-navigation-realized"
            ],
            "evidence": [
              "runtime/arcorbit/desktop/renderer/chat-session-groups.mjs:1-50",
              "runtime/arcorbit/desktop/renderer/renderer.js:831-912",
              "runtime/arcorbit/test/chat-session-groups.test.mjs:14-58",
              "runtime/arcorbit/test/desktop-renderer.test.mjs:520-549"
            ],
            "gap_refs": []
          },
          {
            "invariant_ref": "material-risks-have-credible-evidence",
            "disposition": "upheld",
            "reason": "可重复测试覆盖分组排序、10 条边界、历史展开、固定 owner、并发草稿切换、后台刷新、首发绑定、选择与草稿重启恢复；完整 ArcOrbit 检查无失败。",
            "fact_refs": [
              "FACT-chat-project-grouped-interaction-definition",
              "FACT-chat-project-grouped-navigation-realized"
            ],
            "evidence": [
              "runtime/arcorbit/test/chat-session-groups.test.mjs",
              "runtime/arcorbit/test/desktop-renderer.test.mjs:200-549",
              "runtime/arcorbit/test/chat-coordinator.test.mjs:99-173",
              "Verification: npm run check — 345 tests, 340 passed, 5 environment-gated skips, 0 failed",
              "Validation: git diff --check passed"
            ],
            "gap_refs": []
          }
        ]
      },
      "evidence": [
        "runtime/arcorbit/desktop/renderer/chat-session-groups.mjs",
        "runtime/arcorbit/desktop/renderer/index.html:104-119",
        "runtime/arcorbit/desktop/renderer/renderer.js:323-332",
        "runtime/arcorbit/desktop/renderer/renderer.js:807-912",
        "runtime/arcorbit/desktop/renderer/styles.css:469-508",
        "runtime/arcorbit/test/chat-session-groups.test.mjs",
        "runtime/arcorbit/test/desktop-renderer.test.mjs:506-549",
        "runtime/arcorbit/test/chat-coordinator.test.mjs:99-173",
        "Verification: npm run check — 345 tests, 340 passed, 5 environment-gated skips, 0 failed",
        "Validation: git diff --check passed"
      ],
      "runtime_result_ref": "arckit-runtime://runs/RUN-20260823-212114557Z",
      "occurred_at": "2026-08-23T21:43:11.050Z"
    },
    {
      "round": 3,
      "transition_schema_version": "arckit-case-transition/v8",
      "goal": "对 content revision 2 执行独立五维 Completion Review，不修改实现或持久内容。",
      "outcome": "completed",
      "gap_selection": {
        "mode": "candidate",
        "basis": "普通 Case gaps、问题、handoff 和受威胁 impacts 均已闭合，content revision 2 的 Completion Review 是当前 Case 唯一 ready 候选和关闭 Case 的最终门禁。",
        "snapshot_token": "5873b004af897f6671bee5e5013ecee0f771a8968bc7d94a76c46a2ff0c0047d",
        "selected_ref": "case-gap:CASE-20260823-006:CASE-20260823-006:completion-review:1",
        "comparison_summary": "选择当前 Case 的 Completion Review；四个 Project gaps 均需要独立 Case，不能替代本 Case 对已完成内容的五维终态审查。",
        "fresh_discovery_summary": "对 content revision 2 的实现、稳定规格、交互源、测试和工作区 diff 重新检查后，未发现需要优先于 Review 的 fresh 普通 gap。",
        "considered": [
          {
            "ref": "project-gap:GAP-agent-scenario-evaluation",
            "source": "persisted",
            "eligibility": "case_required",
            "disposition": "deferred",
            "priority_basis": {
              "blocking": "不阻塞当前 Case 终态审查。",
              "uncertainty": "高，但属于跨场景 Agent 验证。",
              "risk": "高，但不构成本 Case 实现 finding。",
              "user_impact": "低于关闭当前已完成用户事项。"
            },
            "reason": "需要独立 Case，不能作为当前内容的 Completion Review。"
          },
          {
            "ref": "project-gap:GAP-runtime-resilience-and-adapters",
            "source": "persisted",
            "eligibility": "case_required",
            "disposition": "deferred",
            "priority_basis": {
              "blocking": "不阻塞当前 Chat Case。",
              "uncertainty": "属于长期 Runtime 边界。",
              "risk": "高，但本轮未改变 Runtime adapter。",
              "user_impact": "与当前 Chat 分组事项无直接依赖。"
            },
            "reason": "需要独立 Case，当前 Review 未发现该 Project gap 在本实现中形成新问题。"
          },
          {
            "ref": "project-gap:GAP-security-real-project-validation",
            "source": "persisted",
            "eligibility": "case_required",
            "disposition": "deferred",
            "priority_basis": {
              "blocking": "不阻塞当前 Case。",
              "uncertainty": "需要真实权限项目。",
              "risk": "高，但验证对象与本次纯 Renderer 投影不同。",
              "user_impact": "低于当前 Case 的终态闭合。"
            },
            "reason": "真实权限项目验证需要独立 Case。"
          },
          {
            "ref": "project-gap:GAP-cross-record-audit",
            "source": "persisted",
            "eligibility": "case_required",
            "disposition": "deferred",
            "priority_basis": {
              "blocking": "不阻塞当前 Case。",
              "uncertainty": "跨记录审计与 Chat UI 无直接关系。",
              "risk": "高。",
              "user_impact": "低于当前 Case 关闭。"
            },
            "reason": "需要独立 Case，不能替代实现完成审查。"
          },
          {
            "ref": "case-gap:CASE-20260823-006:CASE-20260823-006:completion-review:1",
            "source": "persisted",
            "eligibility": "ready",
            "disposition": "selected",
            "priority_basis": {
              "blocking": "是当前 Case 关闭前的唯一门禁。",
              "uncertainty": "低，普通工作和 impacts 已闭合。",
              "risk": "高，需要确认实现、验证和回归主张可信。",
              "user_impact": "高，决定用户事项是否真实完成。"
            },
            "reason": "当前唯一 ready 候选，且五维审查证据已经具备。"
          }
        ]
      },
      "selected_gap": {
        "id": "CASE-20260823-006:completion-review:1",
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
        "goal": "对 content revision 2 执行独立五维 Completion Review，不修改实现或持久内容。",
        "expected_state_change": "若实现正确性、问题闭合、验证可信度、回归风险和最小性均无 finding，则 Review 标记 clean 并关闭 Case。"
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
          "reviewed_content_revision": 2,
          "dimensions": {
            "implementation_correctness": "clean",
            "problem_resolution": "clean",
            "verification_credibility": "clean",
            "regression_risk": "clean",
            "minimality": "clean"
          },
          "findings": [],
          "evidence": [
            "Implementation correctness: runtime/arcorbit/desktop/renderer/chat-session-groups.mjs:1-50 and runtime/arcorbit/desktop/renderer/renderer.js:807-912 implement stable project/session ordering, per-project ten-item previews, scoped history expansion and immutable persisted-session ownership.",
            "Problem resolution: arckit/spec/agentic-software-development/arcorbit-planned-workspaces.md, arckit/interaction/chat-workspace/interaction.md, runtime/arcorbit/desktop/renderer/index.html:104-119 and runtime/arcorbit/desktop/renderer/renderer.js:831-912 align the accepted product, interaction and production surfaces.",
            "Verification credibility: runtime/arcorbit/test/chat-session-groups.test.mjs, runtime/arcorbit/test/desktop-renderer.test.mjs and runtime/arcorbit/test/chat-coordinator.test.mjs directly cover grouping, ten-item history, draft switching, owner isolation and restart recovery.",
            "Verification rerun: node --test test/chat-session-groups.test.mjs test/desktop-renderer.test.mjs test/chat-coordinator.test.mjs — 60 passed, 0 failed.",
            "Full regression evidence: npm run check — 345 tests, 340 passed, 5 environment-gated skips, 0 failed.",
            "Regression risk: workspace switching remains delegated to chat-state-coordinator.mjs, history expansion is Renderer-local, and no Store/main/preload IPC or Automation boundary changed.",
            "Minimality: production changes are limited to one pure grouping helper and the existing Chat HTML/Renderer/styles, with focused tests; git diff --check passed."
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
        "evidence": [
          "arckit/spec/agentic-software-development/arcorbit-planned-workspaces.md",
          "arckit/interaction/chat-workspace/interaction.md",
          "runtime/arcorbit/desktop/renderer/chat-session-groups.mjs",
          "runtime/arcorbit/desktop/renderer/index.html",
          "runtime/arcorbit/desktop/renderer/renderer.js",
          "runtime/arcorbit/desktop/renderer/styles.css",
          "runtime/arcorbit/test/chat-session-groups.test.mjs",
          "runtime/arcorbit/test/desktop-renderer.test.mjs",
          "runtime/arcorbit/test/chat-coordinator.test.mjs"
        ]
      },
      "invariant_assessment": {
        "project_revision": 197,
        "judgments": [
          {
            "invariant_ref": "product-expectations-remain-recoverable",
            "disposition": "upheld",
            "reason": "Completion Review 确认稳定产品规格准确覆盖项目分组、每项目 10 条、历史入口及新对话显式归属，且没有实现反向改变产品含义。",
            "fact_refs": [
              "FACT-chat-project-grouped-session-navigation",
              "FACT-chat-project-grouped-interaction-definition",
              "FACT-chat-project-grouped-navigation-realized"
            ],
            "evidence": [
              "arckit/spec/agentic-software-development/arcorbit-planned-workspaces.md",
              "arckit/spec/INDEX.md",
              "arckit/spec/_map/feature-matrix.md"
            ],
            "gap_refs": []
          },
          {
            "invariant_ref": "interaction-expectations-remain-recoverable",
            "disposition": "upheld",
            "reason": "交互源、灰度线框与生产页面对分组、历史、草稿切换、固定归属和不可用工作区恢复保持一致。",
            "fact_refs": [
              "FACT-chat-project-grouped-session-navigation",
              "FACT-chat-project-grouped-interaction-definition",
              "FACT-chat-project-grouped-navigation-realized"
            ],
            "evidence": [
              "arckit/interaction/chat-workspace/interaction.md",
              "arckit/interaction/chat-workspace/default.html",
              "runtime/arcorbit/desktop/renderer/index.html:104-119",
              "runtime/arcorbit/desktop/renderer/renderer.js:831-912"
            ],
            "gap_refs": []
          },
          {
            "invariant_ref": "visual-language-remains-consistent",
            "disposition": "upheld",
            "reason": "审查确认新增分组、历史入口和头部选择器复用既有色彩、间距、边框、按钮及响应式布局，没有视觉 excess 或不一致。",
            "fact_refs": [
              "FACT-chat-project-grouped-navigation-realized"
            ],
            "evidence": [
              "arckit/visual/_library/brief.md",
              "arckit/visual/_library/design-tokens.yaml",
              "runtime/arcorbit/desktop/renderer/index.html:104-119",
              "runtime/arcorbit/desktop/renderer/styles.css:469-508"
            ],
            "gap_refs": []
          },
          {
            "invariant_ref": "technical-decisions-remain-explainable",
            "disposition": "upheld",
            "reason": "分组和历史保持为纯 Renderer 投影，新草稿切换继续使用 typed Coordinator，既有 session/thread/cwd ownership 与 IPC 权限面未扩大。",
            "fact_refs": [
              "FACT-chat-project-grouped-interaction-definition",
              "FACT-chat-project-grouped-navigation-realized"
            ],
            "evidence": [
              "arckit/tech/arcorbit/desktop-execution-solution.md",
              "runtime/arcorbit/desktop/renderer/chat-session-groups.mjs",
              "runtime/arcorbit/desktop/renderer/renderer.js:323-332",
              "runtime/arcorbit/desktop/renderer/chat-state-coordinator.mjs"
            ],
            "gap_refs": []
          },
          {
            "invariant_ref": "accepted-facts-are-realized",
            "disposition": "upheld",
            "reason": "代码审查和测试复核共同证明生产页面兑现全部相关接受事实，未发现遗漏或错误实现。",
            "fact_refs": [
              "FACT-chat-project-grouped-session-navigation",
              "FACT-chat-project-grouped-interaction-definition",
              "FACT-chat-project-grouped-navigation-realized"
            ],
            "evidence": [
              "runtime/arcorbit/desktop/renderer/chat-session-groups.mjs:1-50",
              "runtime/arcorbit/desktop/renderer/renderer.js:831-912",
              "runtime/arcorbit/test/chat-session-groups.test.mjs:14-58",
              "runtime/arcorbit/test/desktop-renderer.test.mjs:520-549"
            ],
            "gap_refs": []
          },
          {
            "invariant_ref": "material-risks-have-credible-evidence",
            "disposition": "upheld",
            "reason": "定向复核 60/60 通过，既有完整回归 0 失败；测试覆盖分组和历史边界、并发草稿切换、后台刷新、首发 owner、选择与草稿重启恢复，未发现未处理的物质风险。",
            "fact_refs": [
              "FACT-chat-project-grouped-interaction-definition",
              "FACT-chat-project-grouped-navigation-realized"
            ],
            "evidence": [
              "runtime/arcorbit/test/chat-session-groups.test.mjs",
              "runtime/arcorbit/test/desktop-renderer.test.mjs",
              "runtime/arcorbit/test/chat-coordinator.test.mjs",
              "Verification rerun: 60 passed, 0 failed",
              "Full regression evidence: npm run check — 345 tests, 340 passed, 5 environment-gated skips, 0 failed",
              "Validation: git diff --check passed"
            ],
            "gap_refs": []
          }
        ]
      },
      "evidence": [
        "arckit/spec/agentic-software-development/arcorbit-planned-workspaces.md",
        "arckit/interaction/chat-workspace/interaction.md",
        "arckit/interaction/chat-workspace/default.html",
        "runtime/arcorbit/desktop/renderer/chat-session-groups.mjs",
        "runtime/arcorbit/desktop/renderer/index.html:104-119",
        "runtime/arcorbit/desktop/renderer/renderer.js:807-912",
        "runtime/arcorbit/desktop/renderer/styles.css:469-508",
        "runtime/arcorbit/test/chat-session-groups.test.mjs",
        "runtime/arcorbit/test/desktop-renderer.test.mjs",
        "runtime/arcorbit/test/chat-coordinator.test.mjs",
        "Verification rerun: node --test test/chat-session-groups.test.mjs test/desktop-renderer.test.mjs test/chat-coordinator.test.mjs — 60 passed, 0 failed",
        "Full regression evidence: npm run check — 345 tests, 340 passed, 5 environment-gated skips, 0 failed",
        "Validation: node --check passed for Renderer modules; git diff --check passed"
      ],
      "runtime_result_ref": "arckit-runtime://runs/RUN-20260823-212114557Z",
      "occurred_at": "2026-08-23T21:44:44.962Z"
    }
  ],
  "case_resolution": {
    "status": "resolved",
    "stage": "resolved",
    "satisfied": [
      "GAP-define-chat-project-grouped-navigation",
      "GAP-realize-chat-project-grouped-navigation"
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
    "updated_at": "2026-08-23T21:44:44.962Z"
  }
}
```

## Round Notes

- Case history is canonical in Structured Record.rounds; keep prose notes exceptional.
