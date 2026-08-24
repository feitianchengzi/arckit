# 统一待办执行人姓名显示

Case: CASE-20260824-008
Status: closed
Artifact Type: code
Selected Gap: none
Updated: 2026-08-24T13:56:33.832Z

## User Intent

修复 ArcOrbit 所有用户可见待办界面将内部 executor_id 当作执行人名称展示的问题，统一使用项目成员人名，同时保留 ID 仅用于查询、选择和提交。

## Structured Record

```json
{
  "schema_version": "development-case-record/v5",
  "id": "CASE-20260824-008",
  "title": "统一待办执行人姓名显示",
  "status": "closed",
  "artifact_type": "code",
  "created_at": "2026-08-24T13:39:39.475Z",
  "updated_at": "2026-08-24T13:56:33.832Z",
  "user_intent": "修复 ArcOrbit 所有用户可见待办界面将内部 executor_id 当作执行人名称展示的问题，统一使用项目成员人名，同时保留 ID 仅用于查询、选择和提交。",
  "expected_outcome": "Work、Automation 及其他待办列表、详情、紧凑摘要和表单中的执行人均显示项目成员人名；未分配显示明确的未分配状态，无法解析的非空执行人显示不含内部 ID 的明确异常状态，并有跨表面回归验证。",
  "project_state_ref": "arckit/project/state.record.json",
  "current_round": {
    "goal": "",
    "selected_gap": null
  },
  "facts": [
    {
      "id": "FACT-todo-executor-must-display-person-name",
      "revision": 1,
      "status": "accepted",
      "statement": "所有用户可见待办执行人字段应统一显示项目成员人名而不是内部 ID；ID 只用于内部关联、筛选和提交。",
      "basis": "当前操作者明确要求，且既有 Work 交互规范已规定执行人和成员选项显示名称。",
      "evidence": [
        "Current operator input, 2026-08-24",
        "arckit/interaction/task-browser/interaction.md:41",
        "arckit/interaction/task-browser/interaction.md:63",
        "arckit/interaction/task-browser/interaction.md:203"
      ]
    },
    {
      "id": "FACT-renderer-falls-back-to-executor-id",
      "revision": 1,
      "status": "superseded",
      "statement": "ArcOrbit 生产 Renderer 的 Work 列表、Inspector 和紧凑待办行在任务未携带可用 assignee 名称时直接回退显示 executor_id；成员选项缺少名称时也生成包含 user_id 的标签。",
      "basis": "直接检查当前生产 Renderer 的待办展示与成员选项代码。",
      "evidence": [
        "runtime/arcorbit/desktop/renderer/renderer.js:1301",
        "runtime/arcorbit/desktop/renderer/renderer.js:1326",
        "runtime/arcorbit/desktop/renderer/renderer.js:1374",
        "runtime/arcorbit/desktop/renderer/renderer.js:2562",
        "runtime/arcorbit/desktop/renderer/renderer.js:3466"
      ]
    },
    {
      "id": "FACT-20260824-008-001",
      "revision": 1,
      "status": "accepted",
      "statement": "ArcOrbit 现在通过共享 Renderer 投影统一待办执行人显示：优先采用任务携带的人名，否则按 project_id 与 executor_id 从项目成员中解析；空执行人显示“未分配”，非空但姓名不可解析时显示“执行人姓名不可用”。Work 表格、Inspector、Today 紧凑行和执行人选择标签均不再回退显示内部 ID；筛选和 mutation 仍保留原始 ID 值。",
      "basis": "生产实现、适配器规范化、静态 Renderer 断言、真实 Electron 跨表面回归和 ArcOrbit 全量检查一致。",
      "evidence": [
        "runtime/arcorbit/desktop/renderer/renderer.js:1301",
        "runtime/arcorbit/desktop/renderer/renderer.js:1326",
        "runtime/arcorbit/desktop/renderer/renderer.js:1374",
        "runtime/arcorbit/desktop/renderer/renderer.js:2562",
        "runtime/arcorbit/desktop/renderer/renderer.js:3465-3487",
        "runtime/arcorbit/src/workshop-platform-adapter.mjs:367",
        "runtime/arcorbit/test/workshop-platform-adapter.test.mjs:5",
        "runtime/arcorbit/test/desktop-renderer.test.mjs:637-644",
        "runtime/arcorbit/test/organization-center-electron.test.mjs:11-37",
        "Verification: focused Electron executor-name regression passed",
        "Verification: npm run check — 388 tests, 379 passed, 9 skipped, 0 failed"
      ]
    }
  ],
  "state_impacts": [
    {
      "id": "IMPACT-todo-executor-id-threatens-interaction",
      "fact_id": "FACT-20260824-008-001",
      "fact_revision": 1,
      "target": {
        "kind": "software_decision",
        "ref": "experience_and_interaction",
        "revision": 39
      },
      "effect": "upheld",
      "reason": "Work 与相关待办表面现在兑现了成员名称展示语义；内部 ID 只承担关联和提交职责，缺失数据使用明确且不泄露 ID 的状态。",
      "gap_ids": [],
      "evidence": [
        "arckit/interaction/task-browser/interaction.md:41",
        "arckit/interaction/task-browser/interaction.md:63",
        "arckit/interaction/task-browser/interaction.md:203",
        "runtime/arcorbit/desktop/renderer/renderer.js:3465-3487",
        "runtime/arcorbit/test/organization-center-electron.test.mjs:11-37",
        "Verification: focused Electron executor-name regression passed"
      ]
    }
  ],
  "gaps": [
    {
      "id": "GAP-unify-todo-executor-name-projection",
      "status": "resolved",
      "goal": "建立统一的待办执行人姓名投影并应用到所有用户可见待办表面：优先使用任务携带的人名，缺失时按项目与 executor_id 从成员数据解析；未分配或无法解析时使用不暴露内部 ID 的明确状态，并补充回归验证。",
      "reason": "当前多个展示路径各自回退到 executor_id，导致执行人显示不一致并违反已接受的姓名展示规则。",
      "derived_from": [
        "FACT-todo-executor-must-display-person-name",
        "FACT-renderer-falls-back-to-executor-id"
      ],
      "blocked_by": [],
      "priority_basis": {
        "blocking": "直接阻碍当前用户要求的统一执行人展示结果。",
        "uncertainty": "低；规范与生产代码冲突已被直接定位。",
        "risk": "中；需覆盖任务嵌套 assignee 缺失、跨项目同 ID、未分配和成员无法解析等数据形状。",
        "user_impact": "高；内部 ID 会出现在高频待办列表和详情中。"
      },
      "responsibility": "agent",
      "evidence_required": [
        "列举并覆盖所有用户可见待办执行人展示路径",
        "证明姓名缺失时按 project_id 与 executor_id 正确解析项目成员",
        "证明未分配与无法解析状态不会显示原始内部 ID",
        "相关 Renderer 单元测试和 Electron 跨表面回归测试通过"
      ],
      "resolution": {
        "id": "GAP-unify-todo-executor-name-projection",
        "status": "resolved",
        "outcome": "待办执行人姓名投影已统一，所有已识别用户可见待办表面不再回退显示 executor_id。",
        "reason": "生产 Renderer 已集中使用 taskExecutorName/memberName；平台成员规范化不再制造 ID 形伪姓名，并由缺失嵌套 assignee、无姓名成员、未知成员、未分配及表单场景的真实 Electron 证据验证。",
        "evidence": [
          "runtime/arcorbit/desktop/renderer/renderer.js:1301",
          "runtime/arcorbit/desktop/renderer/renderer.js:1326",
          "runtime/arcorbit/desktop/renderer/renderer.js:1374",
          "runtime/arcorbit/desktop/renderer/renderer.js:2562",
          "runtime/arcorbit/desktop/renderer/renderer.js:3465-3487",
          "runtime/arcorbit/src/workshop-platform-adapter.mjs:367",
          "runtime/arcorbit/test/organization-center-electron.test.mjs:11",
          "Verification: ARCORBIT_ELECTRON_TODO_EXECUTOR_NAME_TEST=1 — 1 passed, 1 environment-gated skip, 0 failed",
          "Verification: npm run check — 388 tests, 379 passed, 9 environment-gated skips, 0 failed"
        ],
        "occurred_at": "2026-08-24T13:51:17.038Z"
      }
    }
  ],
  "content_revision": 1,
  "completion_review": {
    "status": "clean",
    "policy": {
      "initial_max_cycles": 10,
      "source": "runtime/arcorbit/config/case-policy.json",
      "snapshotted_at": "2026-08-24T13:39:39.475Z"
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
          "runtime/arcorbit/desktop/renderer/renderer.js:1301",
          "runtime/arcorbit/desktop/renderer/renderer.js:1374",
          "runtime/arcorbit/desktop/renderer/renderer.js:2562",
          "runtime/arcorbit/desktop/renderer/renderer.js:3465-3487",
          "runtime/arcorbit/src/workshop-platform-adapter.mjs:357-374",
          "runtime/arcorbit/test/desktop-renderer.test.mjs:637-644",
          "runtime/arcorbit/test/workshop-platform-adapter.test.mjs:5-8",
          "runtime/arcorbit/test/organization-center-electron.test.mjs:9-37",
          "Verification: git diff --check passed",
          "Verification: node --check renderer.js passed",
          "Verification: targeted Renderer and adapter suite — 56 passed, 0 failed",
          "Verification: focused Electron executor-name regression — 1 passed, 1 environment-gated skip, 0 failed",
          "Verification: npm run check — 388 tests, 379 passed, 9 environment-gated skips, 0 failed"
        ],
        "occurred_at": "2026-08-24T13:56:33.832Z"
      }
    ],
    "evidence": [
      "runtime/arcorbit/desktop/renderer/renderer.js:1301",
      "runtime/arcorbit/desktop/renderer/renderer.js:1374",
      "runtime/arcorbit/desktop/renderer/renderer.js:2562",
      "runtime/arcorbit/desktop/renderer/renderer.js:3465-3487",
      "runtime/arcorbit/src/workshop-platform-adapter.mjs:357-374",
      "runtime/arcorbit/test/desktop-renderer.test.mjs:637-644",
      "runtime/arcorbit/test/workshop-platform-adapter.test.mjs:5-8",
      "runtime/arcorbit/test/organization-center-electron.test.mjs:9-37",
      "Verification: git diff --check passed",
      "Verification: node --check renderer.js passed",
      "Verification: targeted Renderer and adapter suite — 56 passed, 0 failed",
      "Verification: focused Electron executor-name regression — 1 passed, 1 environment-gated skip, 0 failed",
      "Verification: npm run check — 388 tests, 379 passed, 9 environment-gated skips, 0 failed"
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
      "goal": "以统一的项目作用域姓名解析替换所有待办执行人 ID 回退，并验证各用户可见表面和边界数据形状。",
      "outcome": "completed",
      "gap_selection": {
        "mode": "candidate",
        "basis": "基于 post-create Case fresh snapshot fc59d5f747a5118b4ea528c960577f0c9110959b6c961b88ec4f55a16dce6177 比较全部五个持久候选；当前 Case Gap 直接阻塞操作者目标、无依赖且可在本地完成可信验证。",
        "snapshot_token": "af6a7f5481c03b88cedaecf46583f6adb3c34725b06a956268750292bfb22a0d",
        "selected_ref": "case-gap:CASE-20260824-008:GAP-unify-todo-executor-name-projection",
        "comparison_summary": "选择执行人姓名统一 Case Gap；四个 Project Gap 均与当前显示缺陷独立并需要各自 Case 或环境，因此延后。",
        "fresh_discovery_summary": "本轮未发现优先于已持久化 Case Gap 的 fresh candidate。",
        "considered": [
          {
            "ref": "project-gap:GAP-agent-scenario-evaluation",
            "source": "persisted",
            "eligibility": "case_required",
            "disposition": "deferred",
            "priority_basis": {
              "blocking": "不阻塞当前执行人姓名修复。",
              "uncertainty": "高。",
              "risk": "高。",
              "user_impact": "与当前直接显示缺陷相比间接。"
            },
            "reason": "该候选验证通用 Agent 场景，需要独立 Case，不能解决当前待办执行人显示问题。"
          },
          {
            "ref": "project-gap:GAP-runtime-resilience-and-adapters",
            "source": "persisted",
            "eligibility": "case_required",
            "disposition": "deferred",
            "priority_basis": {
              "blocking": "不阻塞当前 Renderer 姓名投影。",
              "uncertainty": "中。",
              "risk": "高。",
              "user_impact": "当前显示问题可在不扩展 Runtime 韧性工作的情况下修复。"
            },
            "reason": "该候选关注 timeout、compaction 和 adapter acceptance，需要独立 Case。"
          },
          {
            "ref": "project-gap:GAP-security-real-project-validation",
            "source": "persisted",
            "eligibility": "case_required",
            "disposition": "deferred",
            "priority_basis": {
              "blocking": "不阻塞当前本地显示修复。",
              "uncertainty": "中。",
              "risk": "高。",
              "user_impact": "需要真实权限项目，不能直接改善当前姓名显示。"
            },
            "reason": "该候选依赖真实受控资源项目，与本轮 Renderer 缺陷独立。"
          },
          {
            "ref": "project-gap:GAP-cross-record-audit",
            "source": "persisted",
            "eligibility": "case_required",
            "disposition": "deferred",
            "priority_basis": {
              "blocking": "不阻塞当前姓名投影实现。",
              "uncertainty": "中。",
              "risk": "高。",
              "user_impact": "审计风险高，但不直接解决用户当前看到的内部 ID。"
            },
            "reason": "该候选虽高风险、高紧迫度，但需要独立 Case，不能替代当前用户可见缺陷修复。"
          },
          {
            "ref": "case-gap:CASE-20260824-008:GAP-unify-todo-executor-name-projection",
            "source": "persisted",
            "eligibility": "ready",
            "disposition": "selected",
            "priority_basis": {
              "blocking": "直接阻碍操作者要求的统一执行人展示。",
              "uncertainty": "低；确定性代码回退已完整解释现象。",
              "risk": "中；需覆盖姓名缺失、未知成员、未分配和表单 value/label 分离。",
              "user_impact": "高；影响高频待办列表、详情和 Today 摘要。"
            },
            "reason": "该 Gap 无依赖、由已接受事实直接支持，并可在本轮实现和验证。"
          }
        ]
      },
      "selected_gap": {
        "id": "GAP-unify-todo-executor-name-projection",
        "responsibility": "agent",
        "goal": "建立统一的待办执行人姓名投影并应用到所有用户可见待办表面：优先使用任务携带的人名，缺失时按项目与 executor_id 从成员数据解析；未分配或无法解析时使用不暴露内部 ID 的明确状态，并补充回归验证。",
        "reason": "当前多个展示路径各自回退到 executor_id，导致执行人显示不一致并违反已接受的姓名展示规则。",
        "derived_from": [
          "FACT-todo-executor-must-display-person-name",
          "FACT-renderer-falls-back-to-executor-id"
        ],
        "blocked_by": [],
        "priority_basis": {
          "blocking": "直接阻碍当前用户要求的统一执行人展示结果。",
          "uncertainty": "低；规范与生产代码冲突已被直接定位。",
          "risk": "中；需覆盖任务嵌套 assignee 缺失、跨项目同 ID、未分配和成员无法解析等数据形状。",
          "user_impact": "高；内部 ID 会出现在高频待办列表和详情中。"
        },
        "evidence_required": [
          "列举并覆盖所有用户可见待办执行人展示路径",
          "证明姓名缺失时按 project_id 与 executor_id 正确解析项目成员",
          "证明未分配与无法解析状态不会显示原始内部 ID",
          "相关 Renderer 单元测试和 Electron 跨表面回归测试通过"
        ]
      },
      "planned_transition": {
        "goal": "以统一的项目作用域姓名解析替换所有待办执行人 ID 回退，并验证各用户可见表面和边界数据形状。",
        "expected_state_change": "生产 Renderer 只显示执行人人名或明确的未分配/姓名不可用状态，内部 ID 仅保留为关联、筛选和 mutation 值；相关单元与 Electron 回归通过。"
      },
      "accepted_state_delta": {
        "resolved_gap": {
          "id": "GAP-unify-todo-executor-name-projection",
          "status": "resolved",
          "outcome": "待办执行人姓名投影已统一，所有已识别用户可见待办表面不再回退显示 executor_id。",
          "reason": "生产 Renderer 已集中使用 taskExecutorName/memberName；平台成员规范化不再制造 ID 形伪姓名，并由缺失嵌套 assignee、无姓名成员、未知成员、未分配及表单场景的真实 Electron 证据验证。",
          "evidence": [
            "runtime/arcorbit/desktop/renderer/renderer.js:1301",
            "runtime/arcorbit/desktop/renderer/renderer.js:1326",
            "runtime/arcorbit/desktop/renderer/renderer.js:1374",
            "runtime/arcorbit/desktop/renderer/renderer.js:2562",
            "runtime/arcorbit/desktop/renderer/renderer.js:3465-3487",
            "runtime/arcorbit/src/workshop-platform-adapter.mjs:367",
            "runtime/arcorbit/test/organization-center-electron.test.mjs:11",
            "Verification: ARCORBIT_ELECTRON_TODO_EXECUTOR_NAME_TEST=1 — 1 passed, 1 environment-gated skip, 0 failed",
            "Verification: npm run check — 388 tests, 379 passed, 9 environment-gated skips, 0 failed"
          ]
        },
        "facts_added": [
          {
            "id": "FACT-20260824-008-001",
            "revision": 1,
            "status": "accepted",
            "statement": "ArcOrbit 现在通过共享 Renderer 投影统一待办执行人显示：优先采用任务携带的人名，否则按 project_id 与 executor_id 从项目成员中解析；空执行人显示“未分配”，非空但姓名不可解析时显示“执行人姓名不可用”。Work 表格、Inspector、Today 紧凑行和执行人选择标签均不再回退显示内部 ID；筛选和 mutation 仍保留原始 ID 值。",
            "basis": "生产实现、适配器规范化、静态 Renderer 断言、真实 Electron 跨表面回归和 ArcOrbit 全量检查一致。",
            "evidence": [
              "runtime/arcorbit/desktop/renderer/renderer.js:1301",
              "runtime/arcorbit/desktop/renderer/renderer.js:1326",
              "runtime/arcorbit/desktop/renderer/renderer.js:1374",
              "runtime/arcorbit/desktop/renderer/renderer.js:2562",
              "runtime/arcorbit/desktop/renderer/renderer.js:3465-3487",
              "runtime/arcorbit/src/workshop-platform-adapter.mjs:367",
              "runtime/arcorbit/test/workshop-platform-adapter.test.mjs:5",
              "runtime/arcorbit/test/desktop-renderer.test.mjs:637-644",
              "runtime/arcorbit/test/organization-center-electron.test.mjs:11-37",
              "Verification: focused Electron executor-name regression passed",
              "Verification: npm run check — 388 tests, 379 passed, 9 skipped, 0 failed"
            ]
          }
        ],
        "facts_superseded": [
          {
            "id": "FACT-renderer-falls-back-to-executor-id",
            "revision": 1,
            "reason": "生产 Renderer 已移除三个任务展示面的 executor_id 回退以及两个成员选项的 ID 标签回退，原事实不再描述当前软件状态。",
            "evidence": [
              "runtime/arcorbit/desktop/renderer/renderer.js:1301",
              "runtime/arcorbit/desktop/renderer/renderer.js:1326",
              "runtime/arcorbit/desktop/renderer/renderer.js:1374",
              "runtime/arcorbit/desktop/renderer/renderer.js:2562",
              "runtime/arcorbit/desktop/renderer/renderer.js:3465-3487",
              "runtime/arcorbit/src/workshop-platform-adapter.mjs:367"
            ]
          }
        ],
        "impacts_added": [],
        "impacts_updated": [
          {
            "id": "IMPACT-todo-executor-id-threatens-interaction",
            "fact_id": "FACT-20260824-008-001",
            "fact_revision": 1,
            "target": {
              "kind": "software_decision",
              "ref": "experience_and_interaction",
              "revision": 39
            },
            "effect": "upheld",
            "reason": "Work 与相关待办表面现在兑现了成员名称展示语义；内部 ID 只承担关联和提交职责，缺失数据使用明确且不泄露 ID 的状态。",
            "gap_ids": [],
            "evidence": [
              "arckit/interaction/task-browser/interaction.md:41",
              "arckit/interaction/task-browser/interaction.md:63",
              "arckit/interaction/task-browser/interaction.md:203",
              "runtime/arcorbit/desktop/renderer/renderer.js:3465-3487",
              "runtime/arcorbit/test/organization-center-electron.test.mjs:11-37",
              "Verification: focused Electron executor-name regression passed"
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
        "project_revision": 220,
        "judgments": [
          {
            "invariant_ref": "product-expectations-remain-recoverable",
            "disposition": "not_relevant",
            "reason": "本轮兑现既有执行人交互规则，没有建立或改变产品能力、业务规则或范围边界。",
            "fact_refs": [],
            "evidence": [],
            "gap_refs": []
          },
          {
            "invariant_ref": "interaction-expectations-remain-recoverable",
            "disposition": "upheld",
            "reason": "持久交互规范与生产姓名投影、缺失数据反馈和真实 Electron 行为一致，执行人展示及异常状态可恢复且无歧义。",
            "fact_refs": [
              "FACT-20260824-008-001"
            ],
            "evidence": [
              "arckit/interaction/task-browser/interaction.md:41",
              "arckit/interaction/task-browser/interaction.md:63",
              "arckit/interaction/task-browser/interaction.md:203",
              "runtime/arcorbit/desktop/renderer/renderer.js:3465-3487",
              "runtime/arcorbit/test/organization-center-electron.test.mjs:11-37"
            ],
            "gap_refs": []
          },
          {
            "invariant_ref": "visual-language-remains-consistent",
            "disposition": "not_relevant",
            "reason": "本轮仅改变数据标签解析和回退文案，没有改变视觉 token、组件样式、主题或布局规则。",
            "fact_refs": [],
            "evidence": [],
            "gap_refs": []
          },
          {
            "invariant_ref": "technical-decisions-remain-explainable",
            "disposition": "upheld",
            "reason": "Workshop ID 继续作为内部关联事实，Renderer 在项目作用域内生成用户可见姓名投影；适配器不再把内部 ID 伪装为 username，数据与展示职责保持清晰。",
            "fact_refs": [
              "FACT-20260824-008-001"
            ],
            "evidence": [
              "runtime/arcorbit/src/workshop-platform-adapter.mjs:357-374",
              "runtime/arcorbit/desktop/renderer/renderer.js:3469-3487",
              "runtime/arcorbit/test/workshop-platform-adapter.test.mjs:5-8"
            ],
            "gap_refs": []
          },
          {
            "invariant_ref": "accepted-facts-are-realized",
            "disposition": "upheld",
            "reason": "生产代码已实现所有用户可见待办执行人只显示人名或明确状态的已接受事实，并由静态、单元和真实 Electron 证据直接证明。",
            "fact_refs": [
              "FACT-todo-executor-must-display-person-name",
              "FACT-20260824-008-001"
            ],
            "evidence": [
              "runtime/arcorbit/desktop/renderer/renderer.js:1301",
              "runtime/arcorbit/desktop/renderer/renderer.js:1374",
              "runtime/arcorbit/desktop/renderer/renderer.js:3465-3487",
              "runtime/arcorbit/test/organization-center-electron.test.mjs:11-37",
              "Verification: npm run check — 388 tests, 379 passed, 9 skipped, 0 failed"
            ],
            "gap_refs": []
          },
          {
            "invariant_ref": "material-risks-have-credible-evidence",
            "disposition": "upheld",
            "reason": "项目作用域解析、任务内嵌姓名缺失、成员姓名缺失、成员不存在、未分配以及表单 value/label 分离均有可重复的测试证据；全量检查控制了相邻回归风险。",
            "fact_refs": [
              "FACT-20260824-008-001"
            ],
            "evidence": [
              "runtime/arcorbit/test/fixtures/organization-center-preload.cjs:79-83",
              "runtime/arcorbit/test/fixtures/organization-center-electron.mjs:91-92",
              "runtime/arcorbit/test/organization-center-electron.test.mjs:11-37",
              "runtime/arcorbit/test/desktop-renderer.test.mjs:637-644",
              "Verification: focused Electron executor-name regression passed",
              "Verification: npm run check — 388 tests, 379 passed, 9 skipped, 0 failed"
            ],
            "gap_refs": []
          }
        ]
      },
      "evidence": [
        "Current operator requirement accepted in CASE-20260824-008",
        "runtime/arcorbit/desktop/renderer/renderer.js",
        "runtime/arcorbit/src/workshop-platform-adapter.mjs",
        "runtime/arcorbit/test/desktop-renderer.test.mjs",
        "runtime/arcorbit/test/workshop-platform-adapter.test.mjs",
        "runtime/arcorbit/test/organization-center-electron.test.mjs",
        "Verification: ARCORBIT_ELECTRON_TODO_EXECUTOR_NAME_TEST=1 — passed",
        "Verification: npm run check — 388 tests, 379 passed, 9 skipped, 0 failed",
        "Verification: git diff --check passed; no ARC_DEBUG or temporary console instrumentation remains"
      ],
      "runtime_result_ref": "arckit-runtime://runs/RUN-20260824-133638313Z",
      "occurred_at": "2026-08-24T13:51:17.038Z"
    },
    {
      "round": 2,
      "transition_schema_version": "arckit-case-transition/v8",
      "goal": "独立审查执行人姓名统一实现的正确性、问题解决程度、验证可信度、回归风险与最小性。",
      "outcome": "completed",
      "gap_selection": {
        "mode": "candidate",
        "basis": "CASE-20260824-008 的实现已完成，Completion Review 是当前持久线程唯一结案门禁。新出现的 CASE-20260824-009 Gap 虽然高风险且 ready，但属于另一 active Case 和另一用户事项，应由其所属线程独立推进。",
        "snapshot_token": "5bde7840e26ac55fa65aeb3135199cc3abb2466288d34e20dc6a8ac09f7a2c55",
        "selected_ref": "case-gap:CASE-20260824-008:CASE-20260824-008:completion-review:1",
        "comparison_summary": "比较了 fresh snapshot 中全部六个 persisted candidates：选择 CASE-20260824-008 Completion Review；延后 CASE-20260824-009 的并发 ready Gap及四个 case-required Project Gap。",
        "fresh_discovery_summary": "未发现候选目录之外的新 fresh candidate。",
        "considered": [
          {
            "ref": "project-gap:GAP-agent-scenario-evaluation",
            "source": "persisted",
            "eligibility": "case_required",
            "disposition": "deferred",
            "priority_basis": {
              "blocking": "不阻塞当前 Case 结案。",
              "uncertainty": "high",
              "risk": "high",
              "user_impact": "与当前执行人显示问题无直接关系。"
            },
            "reason": "需要独立 Case 验证通用动态 Gap 场景。"
          },
          {
            "ref": "project-gap:GAP-runtime-resilience-and-adapters",
            "source": "persisted",
            "eligibility": "case_required",
            "disposition": "deferred",
            "priority_basis": {
              "blocking": "不阻塞当前 Case 结案。",
              "uncertainty": "medium",
              "risk": "high",
              "user_impact": "与当前执行人显示问题无直接关系。"
            },
            "reason": "Runtime 韧性与适配器验收应由独立 Case 推进。"
          },
          {
            "ref": "project-gap:GAP-security-real-project-validation",
            "source": "persisted",
            "eligibility": "case_required",
            "disposition": "deferred",
            "priority_basis": {
              "blocking": "不阻塞当前 Case 结案。",
              "uncertainty": "medium",
              "risk": "high",
              "user_impact": "与当前执行人显示问题无直接关系。"
            },
            "reason": "真实权限项目安全验证需要独立 Case 和受控资源。"
          },
          {
            "ref": "project-gap:GAP-cross-record-audit",
            "source": "persisted",
            "eligibility": "case_required",
            "disposition": "deferred",
            "priority_basis": {
              "blocking": "不阻塞当前 Case 结案。",
              "uncertainty": "medium",
              "risk": "high",
              "user_impact": "与当前执行人显示问题无直接关系。"
            },
            "reason": "跨记录审计属于独立项目级验收事项。"
          },
          {
            "ref": "case-gap:CASE-20260824-008:CASE-20260824-008:completion-review:1",
            "source": "persisted",
            "eligibility": "ready",
            "disposition": "selected",
            "priority_basis": {
              "blocking": "high",
              "uncertainty": "low",
              "risk": "high",
              "user_impact": "high"
            },
            "reason": "当前线程的普通 Gap 与 impact 已闭合，完成五维审查即可原子结案。"
          },
          {
            "ref": "case-gap:CASE-20260824-009:GAP-ESTABLISH-BOUNDED-AUTOMATION-READ-MODEL",
            "source": "persisted",
            "eligibility": "ready",
            "disposition": "deferred",
            "priority_basis": {
              "blocking": "high",
              "uncertainty": "low",
              "risk": "high",
              "user_impact": "high"
            },
            "reason": "该 Gap 属于并发新增的 CASE-20260824-009；其 Automation 性能实现不依赖本 Case，也不应中断当前持久线程的 Completion Review。"
          }
        ]
      },
      "selected_gap": {
        "id": "CASE-20260824-008:completion-review:1",
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
        "goal": "独立审查执行人姓名统一实现的正确性、问题解决程度、验证可信度、回归风险与最小性。",
        "expected_state_change": "提交 clean Completion Review 结果，使 CASE-20260824-008 满足结案门禁，不修改任何 Case 内容。"
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
            "runtime/arcorbit/desktop/renderer/renderer.js:1301",
            "runtime/arcorbit/desktop/renderer/renderer.js:1374",
            "runtime/arcorbit/desktop/renderer/renderer.js:2562",
            "runtime/arcorbit/desktop/renderer/renderer.js:3465-3487",
            "runtime/arcorbit/src/workshop-platform-adapter.mjs:357-374",
            "runtime/arcorbit/test/desktop-renderer.test.mjs:637-644",
            "runtime/arcorbit/test/workshop-platform-adapter.test.mjs:5-8",
            "runtime/arcorbit/test/organization-center-electron.test.mjs:9-37",
            "Verification: git diff --check passed",
            "Verification: node --check renderer.js passed",
            "Verification: targeted Renderer and adapter suite — 56 passed, 0 failed",
            "Verification: focused Electron executor-name regression — 1 passed, 1 environment-gated skip, 0 failed",
            "Verification: npm run check — 388 tests, 379 passed, 9 environment-gated skips, 0 failed"
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
        "project_revision": 221,
        "judgments": [
          {
            "invariant_ref": "product-expectations-remain-recoverable",
            "disposition": "not_relevant",
            "reason": "完成审查没有建立或改变产品能力、业务规则或范围边界；既有执行人姓名要求保持不变。",
            "fact_refs": [],
            "evidence": [],
            "gap_refs": []
          },
          {
            "invariant_ref": "interaction-expectations-remain-recoverable",
            "disposition": "upheld",
            "reason": "持久交互规则与 Work 表格、Inspector、Today 紧凑行及表单的生产行为一致。",
            "fact_refs": [
              "FACT-todo-executor-must-display-person-name",
              "FACT-20260824-008-001"
            ],
            "evidence": [
              "arckit/interaction/task-browser/interaction.md:41",
              "arckit/interaction/task-browser/interaction.md:63",
              "arckit/interaction/task-browser/interaction.md:203",
              "runtime/arcorbit/desktop/renderer/renderer.js:1301",
              "runtime/arcorbit/desktop/renderer/renderer.js:1374",
              "runtime/arcorbit/test/organization-center-electron.test.mjs:9-37"
            ],
            "gap_refs": []
          },
          {
            "invariant_ref": "visual-language-remains-consistent",
            "disposition": "not_relevant",
            "reason": "姓名解析和缺失状态文案未改变视觉 token、样式、主题或布局规则。",
            "fact_refs": [],
            "evidence": [],
            "gap_refs": []
          },
          {
            "invariant_ref": "technical-decisions-remain-explainable",
            "disposition": "upheld",
            "reason": "任务和成员 ID 继续承担项目作用域关联、筛选与提交职责，Renderer 单独生成用户可见姓名投影，适配器不再制造 ID 形伪姓名。",
            "fact_refs": [
              "FACT-20260824-008-001"
            ],
            "evidence": [
              "runtime/arcorbit/src/workshop-platform-adapter.mjs:357-374",
              "runtime/arcorbit/desktop/renderer/renderer.js:3465-3487",
              "runtime/arcorbit/test/workshop-platform-adapter.test.mjs:5-8"
            ],
            "gap_refs": []
          },
          {
            "invariant_ref": "accepted-facts-are-realized",
            "disposition": "upheld",
            "reason": "独立代码审查和真实 Electron 复跑证明执行人只显示项目成员姓名或明确状态，不再暴露内部 executor_id。",
            "fact_refs": [
              "FACT-todo-executor-must-display-person-name",
              "FACT-20260824-008-001"
            ],
            "evidence": [
              "runtime/arcorbit/desktop/renderer/renderer.js:1301",
              "runtime/arcorbit/desktop/renderer/renderer.js:1374",
              "runtime/arcorbit/desktop/renderer/renderer.js:3465-3487",
              "Verification: focused Electron executor-name regression — 1 passed, 1 environment-gated skip, 0 failed"
            ],
            "gap_refs": []
          },
          {
            "invariant_ref": "material-risks-have-credible-evidence",
            "disposition": "upheld",
            "reason": "项目作用域解析、嵌套姓名缺失、无姓名成员、未知成员、未分配和 value/label 分离均有自动化证据，并由定向、Electron 与全量检查共同控制回归风险。",
            "fact_refs": [
              "FACT-20260824-008-001"
            ],
            "evidence": [
              "runtime/arcorbit/test/fixtures/organization-center-preload.cjs:79-83",
              "runtime/arcorbit/test/organization-center-electron.test.mjs:9-37",
              "runtime/arcorbit/test/desktop-renderer.test.mjs:637-644",
              "Verification: targeted Renderer and adapter suite — 56 passed, 0 failed",
              "Verification: focused Electron executor-name regression — 1 passed, 1 environment-gated skip, 0 failed",
              "Verification: npm run check — 388 tests, 379 passed, 9 environment-gated skips, 0 failed"
            ],
            "gap_refs": []
          }
        ]
      },
      "evidence": [
        "Fresh trusted snapshot observed at Project revision 221 with CASE-20260824-008 content revision 1.",
        "CASE-20260824-009 was added concurrently and explicitly compared without changing the current Case review claim.",
        "Reviewed the complete production and test diff for the executor-name change.",
        "Searched production Renderer and ArcOrbit source for remaining executor display paths.",
        "Verification: git diff --check and Renderer syntax check passed.",
        "Verification: 56 targeted tests passed.",
        "Verification: focused Electron executor-name regression passed.",
        "Prior full ArcOrbit check: 388 tests, 379 passed, 9 environment-gated skips, 0 failed."
      ],
      "runtime_result_ref": "arckit-runtime://runs/RUN-20260824-133638313Z",
      "occurred_at": "2026-08-24T13:56:33.832Z"
    }
  ],
  "case_resolution": {
    "status": "resolved",
    "stage": "resolved",
    "satisfied": [
      "GAP-unify-todo-executor-name-projection"
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
    "updated_at": "2026-08-24T13:56:33.832Z"
  }
}
```

## Round Notes

- Case history is canonical in Structured Record.rounds; keep prose notes exceptional.
