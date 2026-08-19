# 修复 ArcOrbit Feedback 转待办面板的内容与执行人选择

Case: CASE-20260819-006
Status: closed
Artifact Type: code
Selected Gap: none
Updated: 2026-08-19T19:28:08.295Z

## User Intent

修复 Feedback 页面转待办面板，使待办默认采用完整反馈内容，并让用户按项目成员名称选择执行人。

## Structured Record

```json
{
  "schema_version": "development-case-record/v5",
  "id": "CASE-20260819-006",
  "title": "修复 ArcOrbit Feedback 转待办面板的内容与执行人选择",
  "status": "closed",
  "artifact_type": "code",
  "created_at": "2026-08-19T19:18:05.740Z",
  "updated_at": "2026-08-19T19:28:08.295Z",
  "user_intent": "修复 Feedback 页面转待办面板，使待办默认采用完整反馈内容，并让用户按项目成员名称选择执行人。",
  "expected_outcome": "反馈转待办时，待办内容默认完整填入 feedback.content；执行人控件展示当前反馈所属项目的成员名称，提交对应 user_id，并有可信回归证据覆盖预填、项目范围和提交载荷。",
  "project_state_ref": "arckit/project/state.record.json",
  "current_round": {
    "goal": "",
    "selected_gap": null
  },
  "facts": [
    {
      "id": "FACT-20260820-FEEDBACK-TODO-EXPECTATION",
      "revision": 1,
      "status": "accepted",
      "statement": "用户要求反馈转待办时使用完整反馈内容，并通过可识别的项目成员名称选择执行人，而不是显示不完整标题或要求填写 ID。",
      "basis": "当前操作员明确提出的 ArcOrbit Feedback 页面修复要求。",
      "evidence": [
        "original_user_input: ArcOrbit Feedback 页面反馈转待办面板的两项问题"
      ]
    },
    {
      "id": "FACT-20260820-FEEDBACK-TODO-CONTENT",
      "revision": 1,
      "status": "superseded",
      "statement": "当前反馈转待办面板以 feedback.title 优先于 feedback.content 预填 task_content，因此只要标题存在就不会默认带入完整反馈正文。",
      "basis": "生产 Renderer 的直接源码证据；Feedback V1 规范化对象同时保留 title 和完整 content。",
      "evidence": [
        "runtime/arcorbit/desktop/renderer/renderer.js:1055",
        "runtime/arcorbit/src/workshop-platform-adapter.mjs:232"
      ]
    },
    {
      "id": "FACT-20260820-FEEDBACK-TODO-EXECUTOR",
      "revision": 1,
      "status": "superseded",
      "statement": "当前反馈转待办面板把 executor_id 渲染为“执行人 ID”自由输入，而同一 Renderer 已具备按项目成员名称展示、以 user_id 为值的成员选择器。",
      "basis": "生产 Renderer 与平台成员快照的直接源码证据。",
      "evidence": [
        "runtime/arcorbit/desktop/renderer/renderer.js:1057",
        "runtime/arcorbit/desktop/renderer/renderer.js:1187",
        "runtime/arcorbit/src/platform-coordinator.mjs:144"
      ]
    },
    {
      "id": "FACT-20260820-FEEDBACK-TODO-CONTENT",
      "revision": 2,
      "status": "accepted",
      "statement": "ArcOrbit Feedback 转待办面板现在直接以 feedback.content 预填 task_content，完整反馈正文保留为可编辑的待办内容。",
      "basis": "生产 Renderer、稳定交互文档、静态断言和真实 Electron 表单观测一致；该事实取代修复前的标题优先行为。",
      "evidence": [
        "runtime/arcorbit/desktop/renderer/renderer.js",
        "arckit/interaction/platform-workspace/interaction.md",
        "runtime/arcorbit/test/desktop-renderer.test.mjs",
        "Real Electron regression: task_content equals the full feedback content"
      ]
    },
    {
      "id": "FACT-20260820-FEEDBACK-TODO-EXECUTOR",
      "revision": 2,
      "status": "accepted",
      "statement": "ArcOrbit Feedback 转待办面板现在按 feedback.project_id 过滤项目成员，向用户显示成员名称与“未分配”，选择成员时把对应 user_id 作为 executor_id 提交。",
      "basis": "生产 Renderer 复用项目成员选择器；真实 Electron 回归只显示 ArcOrbit 项目的 Glare、Lin 和未分配，并观测到选择 Lin 后提交 executor_id 8。",
      "evidence": [
        "runtime/arcorbit/desktop/renderer/renderer.js",
        "runtime/arcorbit/src/platform-coordinator.mjs",
        "arckit/interaction/platform-workspace/interaction.md",
        "runtime/arcorbit/test/organization-center-electron.test.mjs",
        "Real Electron regression: project-scoped member labels and executor_id payload verified"
      ]
    }
  ],
  "state_impacts": [
    {
      "id": "IMPACT-20260820-FEEDBACK-TODO-INTERACTION",
      "fact_id": "FACT-20260820-FEEDBACK-TODO-CONTENT",
      "fact_revision": 2,
      "target": {
        "kind": "software_decision",
        "ref": "experience_and_interaction",
        "revision": 21
      },
      "effect": "upheld",
      "reason": "更新后的稳定交互决定、线框和生产面板均要求并实现完整反馈正文预填。",
      "gap_ids": [],
      "evidence": [
        "arckit/interaction/platform-workspace/interaction.md",
        "arckit/interaction/platform-workspace/default.html",
        "runtime/arcorbit/desktop/renderer/renderer.js",
        "Real Electron regression: full content prefill verified"
      ]
    },
    {
      "id": "IMPACT-20260820-FEEDBACK-TODO-REALIZATION",
      "fact_id": "FACT-20260820-FEEDBACK-TODO-EXECUTOR",
      "fact_revision": 2,
      "target": {
        "kind": "software_invariant",
        "ref": "accepted-facts-are-realized",
        "revision": null
      },
      "effect": "upheld",
      "reason": "用户现在通过项目成员名称选择执行人，生产载荷仍使用既有 user_id/executor_id 契约。",
      "gap_ids": [],
      "evidence": [
        "runtime/arcorbit/desktop/renderer/renderer.js",
        "runtime/arcorbit/test/organization-center-electron.test.mjs",
        "runtime/arcorbit/test/platform-coordinator.test.mjs",
        "Real Electron regression: member labels and executor_id 8 payload verified"
      ]
    }
  ],
  "gaps": [
    {
      "id": "GAP-20260820-FIX-FEEDBACK-TO-TASK-PANEL",
      "status": "resolved",
      "goal": "使 Feedback 转待办面板默认使用完整反馈正文，并提供按当前反馈项目过滤、显示成员名称且提交 user_id 的执行人选择器，同时补齐对应回归验证和必要的稳定交互事实。",
      "reason": "两个已确认缺陷属于同一转待办面板契约，修复边界已由当前用户要求和现有数据能力共同确定。",
      "derived_from": [
        "FACT-20260820-FEEDBACK-TODO-EXPECTATION",
        "FACT-20260820-FEEDBACK-TODO-CONTENT",
        "FACT-20260820-FEEDBACK-TODO-EXECUTOR"
      ],
      "blocked_by": [],
      "priority_basis": {
        "blocking": "直接阻碍用户可靠地把反馈流转为可执行待办。",
        "uncertainty": "低；错误映射、成员数据源和既有选择器均已定位。",
        "risk": "中；需防止跨项目成员混选、空执行人语义变化及提交载荷回归。",
        "user_impact": "高；当前用户无法辨识执行人，且默认待办内容不完整。"
      },
      "responsibility": "agent",
      "evidence_required": [
        "生产 Renderer 直接使用 feedback.content 预填待办内容的源码证据。",
        "执行人选择器只列出 feedback.project_id 对应成员、显示名称并提交 user_id 的源码证据。",
        "覆盖完整正文预填、项目成员过滤、未分配语义和 feedback.to_task 提交载荷的自动化测试结果。",
        "与稳定产品交互预期一致的持久证据。"
      ],
      "resolution": {
        "id": "GAP-20260820-FIX-FEEDBACK-TO-TASK-PANEL",
        "status": "resolved",
        "outcome": "Feedback 转待办面板现在以完整 feedback.content 预填待办内容，并把执行人渲染为仅包含反馈所属项目成员名称的选择器；选择成员提交其 user_id，未分配保持空值。稳定交互文档与线框同步，静态、协调器、真实 Electron 和全量测试均通过。",
        "reason": "代码逻辑、持久交互事实和真实 Electron 观测一致证明两个用户问题已在根因路径消除，且没有改变既有两步关联或服务字段契约。",
        "evidence": [
          "runtime/arcorbit/desktop/renderer/renderer.js",
          "arckit/interaction/platform-workspace/interaction.md",
          "arckit/interaction/platform-workspace/default.html",
          "runtime/arcorbit/test/desktop-renderer.test.mjs",
          "runtime/arcorbit/test/platform-coordinator.test.mjs",
          "runtime/arcorbit/test/organization-center-electron.test.mjs",
          "Focused Node tests: 16 passed, 0 failed",
          "Real Electron regression: 1 passed, 0 failed",
          "npm --prefix runtime/arcorbit run check: 224 tests, 222 passed, 2 environment-gated skipped, 0 failed",
          "git diff --check: clean"
        ],
        "occurred_at": "2026-08-19T19:25:23.472Z"
      }
    }
  ],
  "content_revision": 1,
  "completion_review": {
    "status": "clean",
    "policy": {
      "initial_max_cycles": 10,
      "source": "runtime/arcorbit/config/case-policy.json",
      "snapshotted_at": "2026-08-19T19:18:05.740Z"
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
          "Reviewed content revision 1 implementation and documentation diff: renderer change is limited to feedback.content prefill and the existing project-scoped member select.",
          "runtime/arcorbit/desktop/renderer/renderer.js",
          "runtime/arcorbit/test/desktop-renderer.test.mjs",
          "runtime/arcorbit/test/platform-coordinator.test.mjs",
          "runtime/arcorbit/test/fixtures/organization-center-electron.mjs",
          "runtime/arcorbit/test/organization-center-electron.test.mjs",
          "arckit/interaction/platform-workspace/interaction.md",
          "arckit/interaction/platform-workspace/default.html",
          "Focused Node review run: 16 passed, 0 failed.",
          "Real Electron review run: 1 passed, 0 failed.",
          "npm --prefix runtime/arcorbit run check: 224 tests, 222 passed, 2 environment-gated skipped, 0 failed.",
          "git diff --check: clean.",
          "Debug-marker inspection found no ARC_DEBUG or newly introduced console logging in the reviewed path."
        ],
        "occurred_at": "2026-08-19T19:28:08.295Z"
      }
    ],
    "evidence": [
      "Reviewed content revision 1 implementation and documentation diff: renderer change is limited to feedback.content prefill and the existing project-scoped member select.",
      "runtime/arcorbit/desktop/renderer/renderer.js",
      "runtime/arcorbit/test/desktop-renderer.test.mjs",
      "runtime/arcorbit/test/platform-coordinator.test.mjs",
      "runtime/arcorbit/test/fixtures/organization-center-electron.mjs",
      "runtime/arcorbit/test/organization-center-electron.test.mjs",
      "arckit/interaction/platform-workspace/interaction.md",
      "arckit/interaction/platform-workspace/default.html",
      "Focused Node review run: 16 passed, 0 failed.",
      "Real Electron review run: 1 passed, 0 failed.",
      "npm --prefix runtime/arcorbit run check: 224 tests, 222 passed, 2 environment-gated skipped, 0 failed.",
      "git diff --check: clean.",
      "Debug-marker inspection found no ARC_DEBUG or newly introduced console logging in the reviewed path."
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
      "goal": "更新 Feedback 转待办的稳定交互事实和生产 Renderer，使内容取完整反馈正文、执行人使用项目成员名称选择器，并以静态、协调器和真实 Electron 回归证明项目过滤、未分配和 user_id 载荷。",
      "outcome": "completed",
      "gap_selection": {
        "mode": "candidate",
        "basis": "当前 Case Gap 已 ready、无依赖，直接阻塞用户可靠地把反馈转换成待办，且实现边界、数据源和验收方法都已由 accepted facts 确定；它比四个需要另建 Case 的长期 Project gaps 更直接、更可验证。",
        "snapshot_token": "fb1c976452c449d82c7874a642dd4477733a4838901a2d17309786bf75a330be",
        "selected_ref": "case-gap:CASE-20260819-006:GAP-20260820-FIX-FEEDBACK-TO-TASK-PANEL",
        "comparison_summary": "比较了 snapshot 中全部五个 persisted candidates。四个 Project gaps 均需独立 Case，且不解决当前用户明确报告的生产缺陷；唯一活动 Case Gap ready、用户影响高且无依赖，因此选中。",
        "fresh_discovery_summary": "源码、稳定交互事实和测试边界调查没有暴露需要先行接受的额外实质结果；两个症状均由同一 Feedback 转待办面板的数据映射完整解释，所需改动共同服务当前单一验收主张。",
        "considered": [
          {
            "ref": "project-gap:GAP-agent-scenario-evaluation",
            "source": "persisted",
            "eligibility": "case_required",
            "disposition": "deferred",
            "priority_basis": {
              "blocking": "不阻塞当前 Feedback 转待办修复。",
              "uncertainty": "高，需要独立真实场景验证。",
              "risk": "高，但属于长期 Agent 场景评估。",
              "user_impact": "低于当前明确的生产交互缺陷。"
            },
            "reason": "需要独立 Case，且不会修复当前面板。"
          },
          {
            "ref": "project-gap:GAP-runtime-resilience-and-adapters",
            "source": "persisted",
            "eligibility": "case_required",
            "disposition": "deferred",
            "priority_basis": {
              "blocking": "不阻塞当前 Renderer 修复。",
              "uncertainty": "中，已有明确的长期 Runtime 范围。",
              "risk": "高，但与本面板内容和成员选择无因果关系。",
              "user_impact": "当前缺陷对用户操作更直接。"
            },
            "reason": "需要独立 Case，当前工作不改变 Runtime timeout、compaction 或 adapter 边界。"
          },
          {
            "ref": "project-gap:GAP-security-real-project-validation",
            "source": "persisted",
            "eligibility": "case_required",
            "disposition": "deferred",
            "priority_basis": {
              "blocking": "不阻塞当前已授权本地修复。",
              "uncertainty": "高，需要真实权限资源。",
              "risk": "高，但当前改动沿用既有成员快照和受限 action 契约。",
              "user_impact": "当前 Feedback 操作缺陷更直接。"
            },
            "reason": "需要真实权限项目和独立 Case；本轮不扩大凭据或权限边界。"
          },
          {
            "ref": "project-gap:GAP-cross-record-audit",
            "source": "persisted",
            "eligibility": "case_required",
            "disposition": "deferred",
            "priority_basis": {
              "blocking": "不阻塞当前产品缺陷修复。",
              "uncertainty": "中，审计目标明确。",
              "risk": "高且紧迫，但属于跨记录长期验收。",
              "user_impact": "不直接恢复当前 Feedback 转待办可用性。"
            },
            "reason": "需要独立 Case；不能替代当前生产面板修复。"
          },
          {
            "ref": "case-gap:CASE-20260819-006:GAP-20260820-FIX-FEEDBACK-TO-TASK-PANEL",
            "source": "persisted",
            "eligibility": "ready",
            "disposition": "selected",
            "priority_basis": {
              "blocking": "直接阻碍可靠创建待办。",
              "uncertainty": "低，根因、数据源和验收边界已确定。",
              "risk": "中，重点控制跨项目成员混选和错误载荷。",
              "user_impact": "高，当前用户无法看到完整内容或辨认执行人。"
            },
            "reason": "唯一 ready 的活动 Case Gap，直接兑现当前用户要求且可在本轮完整验证。"
          }
        ]
      },
      "selected_gap": {
        "id": "GAP-20260820-FIX-FEEDBACK-TO-TASK-PANEL",
        "responsibility": "agent",
        "goal": "使 Feedback 转待办面板默认使用完整反馈正文，并提供按当前反馈项目过滤、显示成员名称且提交 user_id 的执行人选择器，同时补齐对应回归验证和必要的稳定交互事实。",
        "reason": "两个已确认缺陷属于同一转待办面板契约，修复边界已由当前用户要求和现有数据能力共同确定。",
        "derived_from": [
          "FACT-20260820-FEEDBACK-TODO-EXPECTATION",
          "FACT-20260820-FEEDBACK-TODO-CONTENT",
          "FACT-20260820-FEEDBACK-TODO-EXECUTOR"
        ],
        "blocked_by": [],
        "priority_basis": {
          "blocking": "直接阻碍用户可靠地把反馈流转为可执行待办。",
          "uncertainty": "低；错误映射、成员数据源和既有选择器均已定位。",
          "risk": "中；需防止跨项目成员混选、空执行人语义变化及提交载荷回归。",
          "user_impact": "高；当前用户无法辨识执行人，且默认待办内容不完整。"
        },
        "evidence_required": [
          "生产 Renderer 直接使用 feedback.content 预填待办内容的源码证据。",
          "执行人选择器只列出 feedback.project_id 对应成员、显示名称并提交 user_id 的源码证据。",
          "覆盖完整正文预填、项目成员过滤、未分配语义和 feedback.to_task 提交载荷的自动化测试结果。",
          "与稳定产品交互预期一致的持久证据。"
        ]
      },
      "planned_transition": {
        "goal": "更新 Feedback 转待办的稳定交互事实和生产 Renderer，使内容取完整反馈正文、执行人使用项目成员名称选择器，并以静态、协调器和真实 Electron 回归证明项目过滤、未分配和 user_id 载荷。",
        "expected_state_change": "Feedback 转待办面板不再用标题替代正文或要求手填执行人 ID；稳定交互事实、实现和回归证据一致。"
      },
      "accepted_state_delta": {
        "resolved_gap": {
          "id": "GAP-20260820-FIX-FEEDBACK-TO-TASK-PANEL",
          "status": "resolved",
          "outcome": "Feedback 转待办面板现在以完整 feedback.content 预填待办内容，并把执行人渲染为仅包含反馈所属项目成员名称的选择器；选择成员提交其 user_id，未分配保持空值。稳定交互文档与线框同步，静态、协调器、真实 Electron 和全量测试均通过。",
          "reason": "代码逻辑、持久交互事实和真实 Electron 观测一致证明两个用户问题已在根因路径消除，且没有改变既有两步关联或服务字段契约。",
          "evidence": [
            "runtime/arcorbit/desktop/renderer/renderer.js",
            "arckit/interaction/platform-workspace/interaction.md",
            "arckit/interaction/platform-workspace/default.html",
            "runtime/arcorbit/test/desktop-renderer.test.mjs",
            "runtime/arcorbit/test/platform-coordinator.test.mjs",
            "runtime/arcorbit/test/organization-center-electron.test.mjs",
            "Focused Node tests: 16 passed, 0 failed",
            "Real Electron regression: 1 passed, 0 failed",
            "npm --prefix runtime/arcorbit run check: 224 tests, 222 passed, 2 environment-gated skipped, 0 failed",
            "git diff --check: clean"
          ]
        },
        "facts_added": [
          {
            "id": "FACT-20260820-FEEDBACK-TODO-CONTENT",
            "revision": 2,
            "status": "accepted",
            "statement": "ArcOrbit Feedback 转待办面板现在直接以 feedback.content 预填 task_content，完整反馈正文保留为可编辑的待办内容。",
            "basis": "生产 Renderer、稳定交互文档、静态断言和真实 Electron 表单观测一致；该事实取代修复前的标题优先行为。",
            "evidence": [
              "runtime/arcorbit/desktop/renderer/renderer.js",
              "arckit/interaction/platform-workspace/interaction.md",
              "runtime/arcorbit/test/desktop-renderer.test.mjs",
              "Real Electron regression: task_content equals the full feedback content"
            ]
          },
          {
            "id": "FACT-20260820-FEEDBACK-TODO-EXECUTOR",
            "revision": 2,
            "status": "accepted",
            "statement": "ArcOrbit Feedback 转待办面板现在按 feedback.project_id 过滤项目成员，向用户显示成员名称与“未分配”，选择成员时把对应 user_id 作为 executor_id 提交。",
            "basis": "生产 Renderer 复用项目成员选择器；真实 Electron 回归只显示 ArcOrbit 项目的 Glare、Lin 和未分配，并观测到选择 Lin 后提交 executor_id 8。",
            "evidence": [
              "runtime/arcorbit/desktop/renderer/renderer.js",
              "runtime/arcorbit/src/platform-coordinator.mjs",
              "arckit/interaction/platform-workspace/interaction.md",
              "runtime/arcorbit/test/organization-center-electron.test.mjs",
              "Real Electron regression: project-scoped member labels and executor_id payload verified"
            ]
          }
        ],
        "facts_superseded": [
          {
            "id": "FACT-20260820-FEEDBACK-TODO-CONTENT",
            "revision": 1,
            "reason": "生产 Renderer 已不再以 feedback.title 优先预填 task_content。",
            "evidence": [
              "runtime/arcorbit/desktop/renderer/renderer.js",
              "runtime/arcorbit/test/desktop-renderer.test.mjs"
            ]
          },
          {
            "id": "FACT-20260820-FEEDBACK-TODO-EXECUTOR",
            "revision": 1,
            "reason": "生产面板已不再提供“执行人 ID”自由输入，改为项目成员名称选择器。",
            "evidence": [
              "runtime/arcorbit/desktop/renderer/renderer.js",
              "runtime/arcorbit/test/organization-center-electron.test.mjs"
            ]
          }
        ],
        "impacts_added": [],
        "impacts_updated": [
          {
            "id": "IMPACT-20260820-FEEDBACK-TODO-INTERACTION",
            "fact_id": "FACT-20260820-FEEDBACK-TODO-CONTENT",
            "fact_revision": 2,
            "target": {
              "kind": "software_decision",
              "ref": "experience_and_interaction",
              "revision": 21
            },
            "effect": "upheld",
            "reason": "更新后的稳定交互决定、线框和生产面板均要求并实现完整反馈正文预填。",
            "gap_ids": [],
            "evidence": [
              "arckit/interaction/platform-workspace/interaction.md",
              "arckit/interaction/platform-workspace/default.html",
              "runtime/arcorbit/desktop/renderer/renderer.js",
              "Real Electron regression: full content prefill verified"
            ]
          },
          {
            "id": "IMPACT-20260820-FEEDBACK-TODO-REALIZATION",
            "fact_id": "FACT-20260820-FEEDBACK-TODO-EXECUTOR",
            "fact_revision": 2,
            "target": {
              "kind": "software_invariant",
              "ref": "accepted-facts-are-realized",
              "revision": null
            },
            "effect": "upheld",
            "reason": "用户现在通过项目成员名称选择执行人，生产载荷仍使用既有 user_id/executor_id 契约。",
            "gap_ids": [],
            "evidence": [
              "runtime/arcorbit/desktop/renderer/renderer.js",
              "runtime/arcorbit/test/organization-center-electron.test.mjs",
              "runtime/arcorbit/test/platform-coordinator.test.mjs",
              "Real Electron regression: member labels and executor_id 8 payload verified"
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
            "observed_revision": 20,
            "set_decision": {
              "status": "settled",
              "statement": "ArcOrbit realizes simultaneous multi-product Today, Work, Automation and Feedback through a persistent Workset and a shared top product-set observation scope. Every ADVANCE page can switch between the complete product set and one member product and can open product-set management; this scope never changes execution eligibility. Work owns the seven todo-status filters, Automation owns the acceptance-feedback-only filter, and primary navigation has no TASK STATUS group. Platform governance remains in a Workset-independent Organization center. Users choose an organization or Personal Projects scope, then use Overview, Members and Projects; the overview exposes the visible member-by-project relationship, ordinary members see participating projects, owner/admin see the organization-wide project scope, member details do not imply targeted invitations, and project owner/admin create explicitly one-shot project-bound invitations. Project binding can add a local project in place and continue binding. The global sidebar footer exposes only a user-avatar account entry, with no standalone add-project, local Runtime or task-source entries; the preserved account page uses the Workshop current-user platform display name. Workshop Feedback V1 转待办面板以完整 feedback.content 预填待办内容，并只展示反馈所属项目的成员名称；选择成员时提交其 user_id，且允许保持未分配。顶部命令栏提供唯一的“产品反馈”入口，登录用户无需配置即可向内置 Project 107 提交反馈并在同一窗口查看自己的反馈；入口按 1-99、99+ 显示未读，零未读隐藏，退出账户清零；未登录或 SDK 失败时提供脱敏恢复。产品反馈中心在 submit/status 路由和后台未读刷新期间复用同一健康 SDK 文档；后台刷新不重载页面、不打断输入或清空进行中正文，身份切换、关闭或显式重试结束旧草稿上下文。",
              "reason": "用户明确要求 Feedback 转待办保留完整正文并以成员名称选择执行人；稳定交互源、生产实现和真实 Electron 回归现已一致兑现。",
              "evidence": [
                "arckit/interaction/platform-workspace/interaction.md",
                "arckit/interaction/platform-workspace/default.html",
                "runtime/arcorbit/desktop/renderer/renderer.js",
                "runtime/arcorbit/test/organization-center-electron.test.mjs",
                "Real Electron regression 2026-08-20"
              ],
              "confidence": "high",
              "resume_condition": "当 Feedback V1 转待办的内容映射、成员选择范围、未分配语义、user_id 载荷或两步关联契约变化时重审。"
            },
            "gap_refs": [],
            "reason": "本轮明确并实现了 Feedback V1 转待办的稳定输入与执行人选择语义。",
            "evidence": [
              "arckit/interaction/platform-workspace/interaction.md",
              "arckit/interaction/platform-workspace/default.html",
              "runtime/arcorbit/desktop/renderer/renderer.js",
              "Real Electron regression: full content, project-scoped member names, and executor_id verified"
            ]
          }
        ],
        "software_invariant_changes": [],
        "project_gap_changes": [],
        "selection_context_change": {
          "current_focus": "ArcOrbit Feedback 转待办面板的完整正文与项目成员选择已完成实现和验证，等待 implementation-focused completion review。",
          "project_priorities": [
            "Keep skills generic while Project State owns the concrete software-definition checklist and decisions.",
            "Let one Agent select dynamic gaps from all current facts without facet workflows.",
            "Apply relevant Project State changes atomically in the Gap transition that establishes them."
          ]
        },
        "evidence": [
          "arckit/interaction/platform-workspace/interaction.md",
          "runtime/arcorbit/desktop/renderer/renderer.js",
          "Focused Node tests: 16 passed, 0 failed",
          "Real Electron regression: 1 passed, 0 failed",
          "npm --prefix runtime/arcorbit run check: 224 tests, 222 passed, 2 environment-gated skipped, 0 failed"
        ]
      },
      "invariant_assessment": {
        "project_revision": 130,
        "judgments": [
          {
            "invariant_ref": "product-expectations-remain-recoverable",
            "disposition": "not_relevant",
            "reason": "本轮没有改变 ArcOrbit 的产品受众、能力集合、业务结果或范围边界；它只澄清并实现既有 Feedback 转待办能力中的页面输入表达。",
            "fact_refs": [],
            "evidence": [],
            "gap_refs": []
          },
          {
            "invariant_ref": "interaction-expectations-remain-recoverable",
            "disposition": "upheld",
            "reason": "完整正文预填、项目成员名称选择、user_id 提交和未分配语义已写入页面级交互源并投影到灰度线框。",
            "fact_refs": [
              "FACT-20260820-FEEDBACK-TODO-CONTENT",
              "FACT-20260820-FEEDBACK-TODO-EXECUTOR"
            ],
            "evidence": [
              "arckit/interaction/platform-workspace/interaction.md",
              "arckit/interaction/platform-workspace/default.html",
              "arckit/interaction/INDEX.md",
              "arckit/interaction/_map/feature-matrix.md"
            ],
            "gap_refs": []
          },
          {
            "invariant_ref": "visual-language-remains-consistent",
            "disposition": "not_relevant",
            "reason": "本轮复用现有 textarea、select、Sheet 和灰度线框组件，没有建立或改变颜色、主题、布局 token 或组件视觉规则。",
            "fact_refs": [],
            "evidence": [],
            "gap_refs": []
          },
          {
            "invariant_ref": "technical-decisions-remain-explainable",
            "disposition": "upheld",
            "reason": "修复继续使用既有 Feedback V1 完整 content、项目成员快照、user_id/executor_id 和非事务两步关联契约，没有扩大 Renderer 权限或新增服务边界。",
            "fact_refs": [
              "FACT-20260820-FEEDBACK-TODO-CONTENT",
              "FACT-20260820-FEEDBACK-TODO-EXECUTOR"
            ],
            "evidence": [
              "runtime/arcorbit/desktop/renderer/renderer.js",
              "runtime/arcorbit/src/platform-coordinator.mjs",
              "runtime/arcorbit/src/workshop-platform-adapter.mjs",
              "arckit/tech/arcorbit/platform-composition-solution.md"
            ],
            "gap_refs": []
          },
          {
            "invariant_ref": "accepted-facts-are-realized",
            "disposition": "upheld",
            "reason": "生产 Renderer、协调器载荷测试和真实 Electron 路径共同证明完整正文与可识别项目成员选择已经实际兑现。",
            "fact_refs": [
              "FACT-20260820-FEEDBACK-TODO-EXPECTATION",
              "FACT-20260820-FEEDBACK-TODO-CONTENT",
              "FACT-20260820-FEEDBACK-TODO-EXECUTOR"
            ],
            "evidence": [
              "runtime/arcorbit/desktop/renderer/renderer.js",
              "runtime/arcorbit/test/desktop-renderer.test.mjs",
              "runtime/arcorbit/test/platform-coordinator.test.mjs",
              "runtime/arcorbit/test/organization-center-electron.test.mjs",
              "Real Electron regression: 1 passed, 0 failed"
            ],
            "gap_refs": []
          },
          {
            "invariant_ref": "material-risks-have-credible-evidence",
            "disposition": "upheld",
            "reason": "项目成员过滤、未分配、完整正文和最终 executor_id 载荷由针对性静态/协调器测试、真实 Electron Renderer 回归和全量 ArcOrbit check 交叉验证。",
            "fact_refs": [
              "FACT-20260820-FEEDBACK-TODO-CONTENT",
              "FACT-20260820-FEEDBACK-TODO-EXECUTOR"
            ],
            "evidence": [
              "Focused Node tests: 16 passed, 0 failed",
              "Real Electron regression: 1 passed, 0 failed",
              "npm --prefix runtime/arcorbit run check: 224 tests, 222 passed, 2 environment-gated skipped, 0 failed",
              "git diff --check: clean"
            ],
            "gap_refs": []
          }
        ]
      },
      "evidence": [
        "runtime/arcorbit/desktop/renderer/renderer.js",
        "arckit/interaction/platform-workspace/interaction.md",
        "arckit/interaction/platform-workspace/default.html",
        "runtime/arcorbit/test/desktop-renderer.test.mjs",
        "runtime/arcorbit/test/platform-coordinator.test.mjs",
        "runtime/arcorbit/test/fixtures/organization-center-electron.mjs",
        "runtime/arcorbit/test/organization-center-electron.test.mjs",
        "Focused Node tests: 16 passed, 0 failed",
        "Real Electron regression: 1 passed, 0 failed",
        "npm --prefix runtime/arcorbit run check: 224 tests, 222 passed, 2 environment-gated skipped, 0 failed",
        "git diff --check: clean",
        "Debug cleanup check: no ARC_DEBUG marker or temporary diagnostic logging added"
      ],
      "runtime_result_ref": "arckit-runtime://runs/RUN-20260819-191607649Z",
      "occurred_at": "2026-08-19T19:25:23.472Z"
    },
    {
      "round": 2,
      "transition_schema_version": "arckit-case-transition/v8",
      "goal": "对 content revision 1 执行 implementation-focused completion review，并仅在五个维度均 clean 时声明 Case resolved。",
      "outcome": "completed",
      "gap_selection": {
        "mode": "candidate",
        "basis": "基于 post-commit fresh snapshot 比较全部持久候选；四个 Project Gap 均需独立 Case，当前 Case 唯一 ready 候选是协议派生的 completion review。",
        "snapshot_token": "50ae326f7f58c4288c078d14ddf099122acffae3f45f0972ff51be11d5a094b0",
        "selected_ref": "case-gap:CASE-20260819-006:CASE-20260819-006:completion-review:1",
        "comparison_summary": "Completion review 直接阻塞当前 Case 解析，且实现风险和用户影响均高；其他候选均为不属于当前 Case 的项目级事项。",
        "fresh_discovery_summary": "重新审查实现差异、稳定交互证据和测试结果后，未发现新的实现 Gap、审查 finding 或人工决策需求。",
        "considered": [
          {
            "ref": "project-gap:GAP-agent-scenario-evaluation",
            "source": "persisted",
            "eligibility": "case_required",
            "disposition": "deferred",
            "priority_basis": {
              "blocking": "不阻塞当前 Case completion review。",
              "uncertainty": "高。",
              "risk": "高。",
              "user_impact": "与当前 Feedback 修复无直接关系。"
            },
            "reason": "需要独立 Case 验证动态 Gap 选择场景。"
          },
          {
            "ref": "project-gap:GAP-runtime-resilience-and-adapters",
            "source": "persisted",
            "eligibility": "case_required",
            "disposition": "deferred",
            "priority_basis": {
              "blocking": "不阻塞当前 Case completion review。",
              "uncertainty": "中。",
              "risk": "高。",
              "user_impact": "与当前 Feedback 面板修复无直接关系。"
            },
            "reason": "属于 Runtime 韧性和 adapter 边界的独立项目事项。"
          },
          {
            "ref": "project-gap:GAP-security-real-project-validation",
            "source": "persisted",
            "eligibility": "case_required",
            "disposition": "deferred",
            "priority_basis": {
              "blocking": "不阻塞当前 Case completion review。",
              "uncertainty": "中。",
              "risk": "高。",
              "user_impact": "与当前 Feedback 面板修复无直接关系。"
            },
            "reason": "需要在真实权限项目中建立独立验证 Case。"
          },
          {
            "ref": "project-gap:GAP-cross-record-audit",
            "source": "persisted",
            "eligibility": "case_required",
            "disposition": "deferred",
            "priority_basis": {
              "blocking": "不阻塞当前 Case completion review。",
              "uncertainty": "中。",
              "risk": "高。",
              "user_impact": "属于跨记录一致性治理。"
            },
            "reason": "需要独立 Case 执行 Project、Iteration 和 Case 跨记录审计。"
          },
          {
            "ref": "case-gap:CASE-20260819-006:CASE-20260819-006:completion-review:1",
            "source": "persisted",
            "eligibility": "ready",
            "disposition": "selected",
            "priority_basis": {
              "blocking": "高；完成审查是当前 Case 解析的唯一剩余条件。",
              "uncertainty": "低；实现、持久预期和验证证据完整。",
              "risk": "高；需要确认内容映射、成员过滤和提交载荷没有回归。",
              "user_impact": "高；直接决定用户报告的两个问题能否可信关闭。"
            },
            "reason": "当前 Case 唯一 ready 候选，且所有普通 Gap 和 state impact 已关闭。"
          }
        ]
      },
      "selected_gap": {
        "id": "CASE-20260819-006:completion-review:1",
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
        "goal": "对 content revision 1 执行 implementation-focused completion review，并仅在五个维度均 clean 时声明 Case resolved。",
        "expected_state_change": "记录 clean completion review，保持实现内容不变，并将当前 Case 从 review_ready 推进为 resolved。"
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
          "reviewed_content_revision": 1,
          "dimensions": {
            "implementation_correctness": "clean",
            "problem_resolution": "clean",
            "verification_credibility": "clean",
            "regression_risk": "clean",
            "minimality": "clean"
          },
          "findings": [],
          "evidence": [
            "Reviewed content revision 1 implementation and documentation diff: renderer change is limited to feedback.content prefill and the existing project-scoped member select.",
            "runtime/arcorbit/desktop/renderer/renderer.js",
            "runtime/arcorbit/test/desktop-renderer.test.mjs",
            "runtime/arcorbit/test/platform-coordinator.test.mjs",
            "runtime/arcorbit/test/fixtures/organization-center-electron.mjs",
            "runtime/arcorbit/test/organization-center-electron.test.mjs",
            "arckit/interaction/platform-workspace/interaction.md",
            "arckit/interaction/platform-workspace/default.html",
            "Focused Node review run: 16 passed, 0 failed.",
            "Real Electron review run: 1 passed, 0 failed.",
            "npm --prefix runtime/arcorbit run check: 224 tests, 222 passed, 2 environment-gated skipped, 0 failed.",
            "git diff --check: clean.",
            "Debug-marker inspection found no ARC_DEBUG or newly introduced console logging in the reviewed path."
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
        "project_revision": 131,
        "judgments": [
          {
            "invariant_ref": "product-expectations-remain-recoverable",
            "disposition": "not_relevant",
            "reason": "Completion review 没有建立或改变产品受众、能力集合、业务范围或验收含义，仅复核 content revision 1 的实现质量。",
            "fact_refs": [],
            "evidence": [],
            "gap_refs": []
          },
          {
            "invariant_ref": "interaction-expectations-remain-recoverable",
            "disposition": "upheld",
            "reason": "完整正文预填、项目成员名称选择、未分配和 user_id 提交语义在稳定交互源、线框与生产实现中保持一致。",
            "fact_refs": [
              "FACT-20260820-FEEDBACK-TODO-EXPECTATION",
              "FACT-20260820-FEEDBACK-TODO-CONTENT",
              "FACT-20260820-FEEDBACK-TODO-EXECUTOR"
            ],
            "evidence": [
              "arckit/interaction/platform-workspace/interaction.md",
              "arckit/interaction/platform-workspace/default.html",
              "arckit/interaction/INDEX.md",
              "arckit/interaction/_map/feature-matrix.md"
            ],
            "gap_refs": []
          },
          {
            "invariant_ref": "visual-language-remains-consistent",
            "disposition": "not_relevant",
            "reason": "审查内容继续复用现有 textarea、select 和 Sheet，没有改变视觉语言、主题、token 或组件外观规则。",
            "fact_refs": [],
            "evidence": [],
            "gap_refs": []
          },
          {
            "invariant_ref": "technical-decisions-remain-explainable",
            "disposition": "upheld",
            "reason": "实现继续使用既有 Feedback V1 content、项目成员快照以及 user_id/executor_id 契约，没有引入新的权限、服务边界或状态模型。",
            "fact_refs": [
              "FACT-20260820-FEEDBACK-TODO-CONTENT",
              "FACT-20260820-FEEDBACK-TODO-EXECUTOR"
            ],
            "evidence": [
              "runtime/arcorbit/desktop/renderer/renderer.js",
              "runtime/arcorbit/src/platform-coordinator.mjs",
              "runtime/arcorbit/src/workshop-platform-adapter.mjs",
              "arckit/tech/arcorbit/platform-composition-solution.md"
            ],
            "gap_refs": []
          },
          {
            "invariant_ref": "accepted-facts-are-realized",
            "disposition": "upheld",
            "reason": "生产 Renderer、协调器载荷测试和真实 Electron 回归共同证明完整 feedback.content 与项目成员名称选择已经兑现。",
            "fact_refs": [
              "FACT-20260820-FEEDBACK-TODO-EXPECTATION",
              "FACT-20260820-FEEDBACK-TODO-CONTENT",
              "FACT-20260820-FEEDBACK-TODO-EXECUTOR"
            ],
            "evidence": [
              "runtime/arcorbit/desktop/renderer/renderer.js",
              "runtime/arcorbit/test/desktop-renderer.test.mjs",
              "runtime/arcorbit/test/platform-coordinator.test.mjs",
              "runtime/arcorbit/test/organization-center-electron.test.mjs",
              "Real Electron review run: 1 passed, 0 failed."
            ],
            "gap_refs": []
          },
          {
            "invariant_ref": "material-risks-have-credible-evidence",
            "disposition": "upheld",
            "reason": "完整正文、项目成员过滤、未分配语义和 executor_id 载荷均由针对性测试、真实 Electron 路径和全量检查交叉覆盖。",
            "fact_refs": [
              "FACT-20260820-FEEDBACK-TODO-CONTENT",
              "FACT-20260820-FEEDBACK-TODO-EXECUTOR"
            ],
            "evidence": [
              "runtime/arcorbit/test/desktop-renderer.test.mjs",
              "runtime/arcorbit/test/platform-coordinator.test.mjs",
              "runtime/arcorbit/test/organization-center-electron.test.mjs",
              "Focused Node review run: 16 passed, 0 failed.",
              "Real Electron review run: 1 passed, 0 failed.",
              "npm --prefix runtime/arcorbit run check: 224 tests, 222 passed, 2 environment-gated skipped, 0 failed.",
              "git diff --check: clean."
            ],
            "gap_refs": []
          }
        ]
      },
      "evidence": [
        "Content revision 1 diff reviewed for correctness and minimality.",
        "Focused Node review run: 16 passed, 0 failed.",
        "Real Electron review run: 1 passed, 0 failed.",
        "npm --prefix runtime/arcorbit run check: 224 tests, 222 passed, 2 environment-gated skipped, 0 failed.",
        "git diff --check: clean."
      ],
      "runtime_result_ref": "arckit-runtime://runs/RUN-20260819-191607649Z",
      "occurred_at": "2026-08-19T19:28:08.295Z"
    }
  ],
  "case_resolution": {
    "status": "resolved",
    "stage": "resolved",
    "satisfied": [
      "GAP-20260820-FIX-FEEDBACK-TO-TASK-PANEL"
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
    "updated_at": "2026-08-19T19:28:08.295Z"
  }
}
```

## Round Notes

- Case history is canonical in Structured Record.rounds; keep prose notes exceptional.
