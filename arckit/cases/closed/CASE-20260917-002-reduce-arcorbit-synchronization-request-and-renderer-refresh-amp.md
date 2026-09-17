# Reduce ArcOrbit synchronization request and renderer refresh amplification

Case: CASE-20260917-002
Status: closed
Artifact Type: code
Selected Gap: none
Updated: 2026-09-17T11:30:23.391Z

## User Intent

按已验证的同步重复拉取及页面刷新放大分析优化 ArcOrbit。

## Structured Record

```json
{
  "schema_version": "development-case-record/v5",
  "id": "CASE-20260917-002",
  "title": "Reduce ArcOrbit synchronization request and renderer refresh amplification",
  "status": "closed",
  "artifact_type": "code",
  "created_at": "2026-09-17T11:09:59.237Z",
  "updated_at": "2026-09-17T11:30:23.391Z",
  "user_intent": "按已验证的同步重复拉取及页面刷新放大分析优化 ArcOrbit。",
  "expected_outcome": "同步不重复拉取同一项目，连接状态不触发完整任务详情读取，保留数据新鲜度、账号隔离、失败恢复与页面行为。",
  "project_state_ref": "arckit/project/state.record.json",
  "current_round": {
    "goal": "",
    "selected_gap": null
  },
  "facts": [
    {
      "id": "FACT-20260917-002-001",
      "revision": 1,
      "status": "accepted",
      "statement": "Thing sync 先 reconcile 再刷新全部目录项目，已加载项目重复请求；Thing 对所有 work sync 通知完整刷新，隔离运行证实连接通知和刷新中通知会追加 snapshot/detail 读取。真机耗时占比尚未证实。",
      "basis": "前轮源码检查与实际页面模块隔离日志；用户明确授权按分析优化。",
      "evidence": [
        "runtime/arcorbit/src/workbench/coordinator.mjs",
        "runtime/arcorbit/desktop/renderer/project-workbench-surface.mjs"
      ]
    },
    {
      "id": "FACT-20260917-002-002",
      "revision": 1,
      "status": "accepted",
      "statement": "Thing 同步已合并为一次目录范围 Work Sync 对账，去重可访问项目并保留并发代际范围及部分失败；33 项针对性测试通过。",
      "basis": "真实协调器调用计数、错误和账号退出回归测试。",
      "evidence": [
        "arckit/cases/evidence/CASE-20260917-002/verification.md",
        "runtime/arcorbit/test/work-sync-coordinator.test.mjs",
        "runtime/arcorbit/test/project-workbench.test.mjs",
        "arckit/tech/arcorbit/project-workbench-solution.md"
      ]
    },
    {
      "id": "FACT-20260917-002-003",
      "revision": 1,
      "status": "accepted",
      "statement": "同步健康通知已与内容刷新分离；Thing 无关项目及未变化 Automation 通知复用当前详情，内容失效合并且不丢失，任务切换/账号/错误重试受保护；旧页面只渲染可见内容。209 项相关测试通过，未测真机帧耗时。",
      "basis": "实际页面模块、真实协调器及生产订阅/渲染函数的隔离执行证据。",
      "evidence": [
        "arckit/cases/evidence/CASE-20260917-002/verification.md",
        "runtime/arcorbit/test/workbench-refresh.test.mjs",
        "runtime/arcorbit/test/workbench-activity-sync.test.mjs",
        "arckit/tech/arcorbit/project-workbench-solution.md",
        "arckit/tech/arcorbit/realtime-synchronization-solution.md"
      ]
    },
    {
      "id": "FACT-20260917-002-004",
      "revision": 1,
      "status": "accepted",
      "statement": "活动详情复用已纳入筛选状态；事情、执行、全部切换通过实际事件测试，snapshot/detail 仍为1/1。完整针对性测试210项通过。",
      "basis": "失败回归测试修复后通过；只增加本地渲染依赖。",
      "evidence": [
        "arckit/cases/evidence/CASE-20260917-002/verification.md",
        "arckit/cases/evidence/CASE-20260917-002/review.md",
        "runtime/arcorbit/test/workbench-refresh.test.mjs"
      ]
    }
  ],
  "state_impacts": [],
  "gaps": [
    {
      "id": "GAP-20260917-002-001",
      "status": "resolved",
      "goal": "Thing 一次同步中每个可访问项目至多加载一次，保留全目录覆盖与失败可见性。",
      "reason": "现有串联对账和逐项目刷新重复 REST 请求并放大通知。",
      "derived_from": [
        "FACT-20260917-002-001"
      ],
      "blocked_by": [],
      "priority_basis": {
        "user_impact": "直接减少进入 Thing 和手动同步负担"
      },
      "responsibility": "agent",
      "evidence_required": [
        "真实协调器请求计数、部分失败和账号变更测试"
      ],
      "resolution": {
        "id": "GAP-20260917-002-001",
        "status": "resolved",
        "outcome": "Thing 同步已合并为一次目录范围 Work Sync 对账，去重可访问项目并保留并发代际范围及部分失败；33 项针对性测试通过。",
        "reason": "调用计数、错误传播、并发范围与既有账号测试通过。",
        "evidence": [
          "arckit/cases/evidence/CASE-20260917-002/verification.md",
          "runtime/arcorbit/test/work-sync-coordinator.test.mjs",
          "runtime/arcorbit/test/project-workbench.test.mjs",
          "arckit/tech/arcorbit/project-workbench-solution.md"
        ],
        "occurred_at": "2026-09-17T11:13:46.011Z"
      }
    },
    {
      "id": "GAP-20260917-002-002",
      "status": "resolved",
      "goal": "同步状态通知不触发完整页面数据读取，内容变化按需要刷新并保持最新结果。",
      "reason": "隔离运行已证实状态通知也读取列表和详情。",
      "derived_from": [
        "FACT-20260917-002-001"
      ],
      "blocked_by": [],
      "priority_basis": {
        "user_impact": "减少同步期间主线程和附件请求负担"
      },
      "responsibility": "agent",
      "evidence_required": [
        "实际页面模块通知分类、合并、选择切换和错误恢复测试"
      ],
      "resolution": {
        "id": "GAP-20260917-002-002",
        "status": "resolved",
        "outcome": "同步健康通知已与内容刷新分离；Thing 无关项目及未变化 Automation 通知复用当前详情，内容失效合并且不丢失，任务切换/账号/错误重试受保护；旧页面只渲染可见内容。209 项相关测试通过，未测真机帧耗时。",
        "reason": "实际页面模块、真实协调器及生产订阅/渲染函数的隔离执行证据。",
        "evidence": [
          "arckit/cases/evidence/CASE-20260917-002/verification.md",
          "runtime/arcorbit/test/workbench-refresh.test.mjs",
          "runtime/arcorbit/test/workbench-activity-sync.test.mjs",
          "arckit/tech/arcorbit/project-workbench-solution.md",
          "arckit/tech/arcorbit/realtime-synchronization-solution.md"
        ],
        "occurred_at": "2026-09-17T11:26:08.365Z"
      }
    },
    {
      "id": "CASE-20260917-002:review-finding:activity-filter-reuse",
      "status": "resolved",
      "goal": "Resolve review finding: 详情复用遗漏活动筛选条件，切换事情/执行筛选不重绘列表；需恢复本地筛选且不增加读取。",
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
        "runtime/arcorbit/desktop/renderer/project-workbench-surface.mjs",
        "arckit/cases/evidence/CASE-20260917-002/review.md",
        "runtime/arcorbit/test/workbench-refresh.test.mjs"
      ],
      "resolution": {
        "id": "CASE-20260917-002:review-finding:activity-filter-reuse",
        "status": "resolved",
        "outcome": "活动详情复用已纳入筛选状态；事情、执行、全部切换通过实际事件测试，snapshot/detail 仍为1/1。完整针对性测试210项通过。",
        "reason": "失败回归测试修复后通过；只增加本地渲染依赖。",
        "evidence": [
          "arckit/cases/evidence/CASE-20260917-002/verification.md",
          "arckit/cases/evidence/CASE-20260917-002/review.md",
          "runtime/arcorbit/test/workbench-refresh.test.mjs"
        ],
        "occurred_at": "2026-09-17T11:29:13.974Z"
      }
    }
  ],
  "content_revision": 3,
  "completion_review": {
    "status": "clean",
    "policy": {
      "initial_max_cycles": 3,
      "source": "using-arckit completion review",
      "snapshotted_at": "2026-09-17T11:09:59.237Z"
    },
    "additional_cycles_authorized": 0,
    "cycle_count": 2,
    "reviewed_content_revision": 3,
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
        "content_revision": 2,
        "dimensions": {
          "implementation_correctness": "findings",
          "problem_resolution": "findings",
          "verification_credibility": "findings",
          "regression_risk": "findings",
          "minimality": "clean"
        },
        "finding_ids": [
          "activity-filter-reuse"
        ],
        "evidence": [
          "arckit/cases/evidence/CASE-20260917-002/review.md",
          "runtime/arcorbit/test/workbench-refresh.test.mjs"
        ],
        "occurred_at": "2026-09-17T11:27:39.591Z"
      },
      {
        "cycle": 2,
        "autonomous_cycle": 2,
        "reviewer": "agent",
        "outcome": "clean",
        "content_revision": 3,
        "dimensions": {
          "implementation_correctness": "clean",
          "problem_resolution": "clean",
          "verification_credibility": "clean",
          "regression_risk": "clean",
          "minimality": "clean"
        },
        "finding_ids": [],
        "evidence": [
          "arckit/cases/evidence/CASE-20260917-002/review.md",
          "arckit/cases/evidence/CASE-20260917-002/verification.md",
          "runtime/arcorbit/test/workbench-refresh.test.mjs"
        ],
        "occurred_at": "2026-09-17T11:30:23.391Z"
      }
    ],
    "evidence": [
      "arckit/cases/evidence/CASE-20260917-002/review.md",
      "runtime/arcorbit/test/workbench-refresh.test.mjs",
      "arckit/cases/evidence/CASE-20260917-002/verification.md"
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
      "goal": "Thing 一次同步中每个可访问项目至多加载一次，保留全目录覆盖与失败可见性。",
      "outcome": "completed",
      "gap_selection": {
        "mode": "candidate",
        "basis": "现有串联对账和逐项目刷新重复 REST 请求并放大通知。",
        "snapshot_token": "513030b9983f7e6459aefbf7c3b8dd79ed9fcdaef99ac197aee4746968ada51a",
        "selected_ref": "case-gap:CASE-20260917-002:GAP-20260917-002-001",
        "comparison_summary": "先解决重复远端读取，后处理事件驱动页面读取；其余六项无关候选延期。",
        "fresh_discovery_summary": "没有新增必要独立缺口；虚拟化无真机必要性证据，不纳入。",
        "considered": [
          {
            "ref": "project-gap:GAP-agent-scenario-evaluation",
            "source": "persisted",
            "eligibility": "case_required",
            "disposition": "deferred",
            "priority_basis": {
              "uncertainty": "high",
              "risk": "high"
            },
            "reason": "不属于本次用户授权的同步优化"
          },
          {
            "ref": "project-gap:GAP-runtime-resilience-and-adapters",
            "source": "persisted",
            "eligibility": "case_required",
            "disposition": "deferred",
            "priority_basis": {
              "risk": "high",
              "urgency": "medium"
            },
            "reason": "不属于本次用户授权的同步优化"
          },
          {
            "ref": "project-gap:GAP-security-real-project-validation",
            "source": "persisted",
            "eligibility": "case_required",
            "disposition": "deferred",
            "priority_basis": {
              "risk": "high",
              "urgency": "medium"
            },
            "reason": "不属于本次用户授权的同步优化"
          },
          {
            "ref": "project-gap:GAP-cross-record-audit",
            "source": "persisted",
            "eligibility": "case_required",
            "disposition": "deferred",
            "priority_basis": {
              "risk": "high",
              "urgency": "high"
            },
            "reason": "不属于本次用户授权的同步优化"
          },
          {
            "ref": "case-gap:CASE-20260901-001:GAP-20260901-001-005",
            "source": "persisted",
            "eligibility": "ready",
            "disposition": "deferred",
            "priority_basis": {
              "blocking": "",
              "uncertainty": "",
              "risk": "high",
              "user_impact": "",
              "dependency": "blocks public push and source repository archival"
            },
            "reason": "不属于本次用户授权的同步优化"
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
            "reason": "不属于本次用户授权的同步优化"
          },
          {
            "ref": "case-gap:CASE-20260917-002:GAP-20260917-002-001",
            "source": "persisted",
            "eligibility": "ready",
            "disposition": "selected",
            "priority_basis": {
              "blocking": "",
              "uncertainty": "",
              "risk": "",
              "user_impact": "直接减少进入 Thing 和手动同步负担"
            },
            "reason": "直接减少进入 Thing 的重复请求"
          },
          {
            "ref": "case-gap:CASE-20260917-002:GAP-20260917-002-002",
            "source": "persisted",
            "eligibility": "ready",
            "disposition": "deferred",
            "priority_basis": {
              "blocking": "",
              "uncertainty": "",
              "risk": "",
              "user_impact": "减少同步期间主线程和附件请求负担"
            },
            "reason": "保留页面刷新缺口，完成当前独立结论后重新选择"
          }
        ]
      },
      "selected_gap": {
        "id": "GAP-20260917-002-001",
        "responsibility": "agent",
        "goal": "Thing 一次同步中每个可访问项目至多加载一次，保留全目录覆盖与失败可见性。",
        "reason": "现有串联对账和逐项目刷新重复 REST 请求并放大通知。",
        "derived_from": [
          "FACT-20260917-002-001"
        ],
        "blocked_by": [],
        "priority_basis": {
          "blocking": "",
          "uncertainty": "",
          "risk": "",
          "user_impact": "直接减少进入 Thing 和手动同步负担"
        },
        "evidence_required": [
          "真实协调器请求计数、部分失败和账号变更测试"
        ]
      },
      "planned_transition": {
        "goal": "Thing 一次同步中每个可访问项目至多加载一次，保留全目录覆盖与失败可见性。",
        "expected_state_change": "一次 Thing 同步中每个可访问项目只读取一次任务及标签。"
      },
      "accepted_state_delta": {
        "resolved_gap": {
          "id": "GAP-20260917-002-001",
          "status": "resolved",
          "outcome": "Thing 同步已合并为一次目录范围 Work Sync 对账，去重可访问项目并保留并发代际范围及部分失败；33 项针对性测试通过。",
          "reason": "调用计数、错误传播、并发范围与既有账号测试通过。",
          "evidence": [
            "arckit/cases/evidence/CASE-20260917-002/verification.md",
            "runtime/arcorbit/test/work-sync-coordinator.test.mjs",
            "runtime/arcorbit/test/project-workbench.test.mjs",
            "arckit/tech/arcorbit/project-workbench-solution.md"
          ]
        },
        "facts_added": [
          {
            "id": "FACT-20260917-002-002",
            "revision": 1,
            "status": "accepted",
            "statement": "Thing 同步已合并为一次目录范围 Work Sync 对账，去重可访问项目并保留并发代际范围及部分失败；33 项针对性测试通过。",
            "basis": "真实协调器调用计数、错误和账号退出回归测试。",
            "evidence": [
              "arckit/cases/evidence/CASE-20260917-002/verification.md",
              "runtime/arcorbit/test/work-sync-coordinator.test.mjs",
              "runtime/arcorbit/test/project-workbench.test.mjs",
              "arckit/tech/arcorbit/project-workbench-solution.md"
            ]
          }
        ],
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
        "software_definition_changes": [
          {
            "area_ref": "technical_foundation",
            "set_decision": {
              "status": "settled",
              "statement": "Arckit and ArcOrbit retain their existing ledger, skill, Electron, Runtime, Platform Coordinator, Work Sync, Chat, Setup Readiness, trusted case-control, and repository-relative path boundaries. The public Arckit monorepo additionally owns Todo Web under apps, Feedback Console under apps, the Feedback Web SDK under packages, the shared Workshop API under services, and integration examples under examples. JavaScript surfaces use one root workspace with independent build and release entries; the Workshop API remains an independently testable Go module. Public builds and tests never require the sibling private arckit-ops workspace. Product Coordinator 属于应用层，产品资料使用版本化协议与 revision 校验，正式记录单文件原子维护。同步通过独立 Git index 和资料分支，处理并发拒绝与远端核对，不改变开发 checkout。场景会话使用应用私有固定 cwd，材料范围与正式目录分别保存；运行内核不增加技能路由或工作角色。 Release 提供真实本地终端、原生 Git、源码编辑、构建运行及复用 Chat/Idea 的场景 Agent，消费既有工作区绑定；以 arcorbit-release-workspace.md 与 release-workspace-solution.md 为准，外部渠道和监控仍依实际 adapter。 ProjectWorkbench 为独立业务协调与呈现层，复用 WorkSync、ChatCoordinator、Automation 和 Run Manager；不复制旧业务页面或 Runtime/skill 工作流。场景组件从结构化状态投影，消息从真实 turn/run 投影；Agent 只调用受约束命令，不直接操纵 DOM。 Thing 同步通过 Work Sync 单次目录范围对账完成，项目去重且不改变后台需求与订阅范围。",
              "reason": "用户授权同步优化，协调器调用计数和失败/代际测试确立边界。",
              "evidence": [
                "arckit/tech/repository-governance/monorepo-solution.md",
                "arckit/tech/arcorbit/solution.md",
                "arckit/tech/arcorbit/platform-composition-solution.md",
                "arckit/cases/evidence/CASE-20260909-001/verification.md",
                "arckit/spec/agentic-software-development/arcorbit-product-management.md",
                "arckit/tech/arcorbit/product-management-solution.md",
                "runtime/arcorbit/src/product-coordinator.mjs",
                "runtime/arcorbit/src/product-git.mjs",
                "runtime/arcorbit/desktop/renderer/product-surface.mjs",
                "runtime/arcorbit/test/product-management.test.mjs",
                "runtime/arcorbit/test/product-surface.test.mjs",
                "definition/skills/arckit-product-assets/SKILL.md",
                "arckit/spec/agentic-software-development/arcorbit-release-workspace.md",
                "arckit/tech/arcorbit/release-workspace-solution.md",
                "arckit/interaction/release-workspace/interaction.md",
                "arckit/interaction/release-workspace/default.html",
                "arckit/cases/evidence/CASE-20260915-001/verification.md",
                "arckit/cases/evidence/CASE-20260915-001/acceptance-matrix.md",
                "arckit/spec/agentic-software-development/arcorbit-project-workbench.md",
                "arckit/interaction/project-workbench/interaction.md",
                "arckit/tech/arcorbit/project-workbench-solution.md",
                "arckit/cases/evidence/CASE-20260917-002/verification.md",
                "runtime/arcorbit/test/work-sync-coordinator.test.mjs",
                "runtime/arcorbit/test/project-workbench.test.mjs"
              ],
              "confidence": "high",
              "resume_condition": "Revisit when workspace tooling, repository-relative capability paths, or source ownership boundaries change. 事情身份、主会话、场景所有权或新旧导航边界变化时重审。",
              "revision": 50
            },
            "evidence": [
              "arckit/cases/evidence/CASE-20260917-002/verification.md",
              "runtime/arcorbit/test/work-sync-coordinator.test.mjs",
              "runtime/arcorbit/test/project-workbench.test.mjs",
              "arckit/tech/arcorbit/project-workbench-solution.md"
            ],
            "observed_revision": 50,
            "gap_refs": [],
            "reason": "用户授权同步优化，协调器调用计数和失败/代际测试确立边界。"
          }
        ],
        "software_invariant_changes": [],
        "project_gap_changes": [],
        "selection_context_change": null,
        "evidence": [
          "arckit/cases/evidence/CASE-20260917-002/verification.md",
          "runtime/arcorbit/test/work-sync-coordinator.test.mjs",
          "runtime/arcorbit/test/project-workbench.test.mjs",
          "arckit/tech/arcorbit/project-workbench-solution.md"
        ]
      },
      "invariant_assessment": {
        "project_revision": 394,
        "judgments": [
          {
            "invariant_ref": "product-expectations-remain-recoverable",
            "disposition": "upheld",
            "reason": "用户授权消除重复工作；全可访问项目覆盖、远端事实与自动化授权范围保留。",
            "fact_refs": [
              "FACT-20260917-002-001",
              "FACT-20260917-002-002"
            ],
            "evidence": [
              "arckit/cases/evidence/CASE-20260917-002/verification.md",
              "runtime/arcorbit/test/work-sync-coordinator.test.mjs",
              "runtime/arcorbit/test/project-workbench.test.mjs",
              "arckit/tech/arcorbit/project-workbench-solution.md"
            ],
            "gap_refs": []
          },
          {
            "invariant_ref": "interaction-expectations-remain-recoverable",
            "disposition": "upheld",
            "reason": "进入和手动同步动作、错误提示与数据恢复语义不变；已明确重复读取是实现问题。",
            "fact_refs": [
              "FACT-20260917-002-001",
              "FACT-20260917-002-002"
            ],
            "evidence": [
              "arckit/cases/evidence/CASE-20260917-002/verification.md",
              "runtime/arcorbit/test/work-sync-coordinator.test.mjs",
              "runtime/arcorbit/test/project-workbench.test.mjs",
              "arckit/tech/arcorbit/project-workbench-solution.md"
            ],
            "gap_refs": []
          },
          {
            "invariant_ref": "visual-language-remains-consistent",
            "disposition": "not_relevant",
            "reason": "不涉及主题、布局、组件视觉或审美决定。",
            "fact_refs": [],
            "evidence": [],
            "gap_refs": []
          },
          {
            "invariant_ref": "technical-decisions-remain-explainable",
            "disposition": "upheld",
            "reason": "Work Sync 独占去重与对账责任，Thing 传递一次性读取范围；技术方案已维护。",
            "fact_refs": [
              "FACT-20260917-002-001",
              "FACT-20260917-002-002"
            ],
            "evidence": [
              "arckit/cases/evidence/CASE-20260917-002/verification.md",
              "runtime/arcorbit/test/work-sync-coordinator.test.mjs",
              "runtime/arcorbit/test/project-workbench.test.mjs",
              "arckit/tech/arcorbit/project-workbench-solution.md"
            ],
            "gap_refs": []
          },
          {
            "invariant_ref": "accepted-facts-are-realized",
            "disposition": "threatened",
            "reason": "本轮证明同步去重；已知状态通知引发页面读取仍待第二缺口处理。",
            "fact_refs": [
              "FACT-20260917-002-001",
              "FACT-20260917-002-002"
            ],
            "evidence": [
              "arckit/cases/evidence/CASE-20260917-002/verification.md",
              "runtime/arcorbit/test/work-sync-coordinator.test.mjs",
              "runtime/arcorbit/test/project-workbench.test.mjs",
              "arckit/tech/arcorbit/project-workbench-solution.md"
            ],
            "gap_refs": [
              "GAP-20260917-002-002"
            ]
          },
          {
            "invariant_ref": "debug-causes-remain-grounded",
            "disposition": "upheld",
            "reason": "源码重复调用与实测计数解释负担；不宣称真机所有卡顿已被定位。",
            "fact_refs": [
              "FACT-20260917-002-001",
              "FACT-20260917-002-002"
            ],
            "evidence": [
              "arckit/cases/evidence/CASE-20260917-002/verification.md",
              "runtime/arcorbit/test/work-sync-coordinator.test.mjs",
              "runtime/arcorbit/test/project-workbench.test.mjs",
              "arckit/tech/arcorbit/project-workbench-solution.md"
            ],
            "gap_refs": []
          },
          {
            "invariant_ref": "material-risks-have-credible-evidence",
            "disposition": "undetermined",
            "reason": "同步范围、失败和账号测试已通过，页面刷新新鲜度及竞态仍由第二缺口承接。",
            "fact_refs": [
              "FACT-20260917-002-001",
              "FACT-20260917-002-002"
            ],
            "evidence": [
              "arckit/cases/evidence/CASE-20260917-002/verification.md",
              "runtime/arcorbit/test/work-sync-coordinator.test.mjs",
              "runtime/arcorbit/test/project-workbench.test.mjs",
              "arckit/tech/arcorbit/project-workbench-solution.md"
            ],
            "gap_refs": [
              "GAP-20260917-002-002"
            ]
          }
        ]
      },
      "evidence": [
        "arckit/cases/evidence/CASE-20260917-002/verification.md",
        "runtime/arcorbit/test/work-sync-coordinator.test.mjs",
        "runtime/arcorbit/test/project-workbench.test.mjs",
        "arckit/tech/arcorbit/project-workbench-solution.md"
      ],
      "runtime_result_ref": "",
      "occurred_at": "2026-09-17T11:13:46.011Z"
    },
    {
      "round": 2,
      "transition_schema_version": "arckit-case-transition/v8",
      "goal": "同步状态通知不触发完整页面数据读取，内容变化按需要刷新并保持最新结果。",
      "outcome": "completed",
      "gap_selection": {
        "mode": "candidate",
        "basis": "隔离运行已证实状态通知也读取列表和详情。",
        "snapshot_token": "9674b2efd9874ae2a5945f004812dcae69f45c578ef6842c098587644d014645",
        "selected_ref": "case-gap:CASE-20260917-002:GAP-20260917-002-002",
        "comparison_summary": "最新状态只有本 Case 页面刷新缺口；当前用户范围内唯一普通优化义务。",
        "fresh_discovery_summary": "并发账本变更后重新读取，代码与验证仍适用于该缺口；无新独立候选。",
        "considered": [
          {
            "ref": "case-gap:CASE-20260917-002:GAP-20260917-002-002",
            "source": "persisted",
            "eligibility": "ready",
            "disposition": "selected",
            "priority_basis": {
              "blocking": "",
              "uncertainty": "",
              "risk": "",
              "user_impact": "减少同步期间主线程和附件请求负担"
            },
            "reason": "已确认的状态通知读取放大，当前唯一普通优化义务"
          }
        ]
      },
      "selected_gap": {
        "id": "GAP-20260917-002-002",
        "responsibility": "agent",
        "goal": "同步状态通知不触发完整页面数据读取，内容变化按需要刷新并保持最新结果。",
        "reason": "隔离运行已证实状态通知也读取列表和详情。",
        "derived_from": [
          "FACT-20260917-002-001"
        ],
        "blocked_by": [],
        "priority_basis": {
          "blocking": "",
          "uncertainty": "",
          "risk": "",
          "user_impact": "减少同步期间主线程和附件请求负担"
        },
        "evidence_required": [
          "实际页面模块通知分类、合并、选择切换和错误恢复测试"
        ]
      },
      "planned_transition": {
        "goal": "同步状态通知不触发完整页面数据读取，内容变化按需要刷新并保持最新结果。",
        "expected_state_change": "健康零数据读取，内容按依赖刷新，保留新鲜度与状态恢复。"
      },
      "accepted_state_delta": {
        "resolved_gap": {
          "id": "GAP-20260917-002-002",
          "status": "resolved",
          "outcome": "同步健康通知已与内容刷新分离；Thing 无关项目及未变化 Automation 通知复用当前详情，内容失效合并且不丢失，任务切换/账号/错误重试受保护；旧页面只渲染可见内容。209 项相关测试通过，未测真机帧耗时。",
          "reason": "实际页面模块、真实协调器及生产订阅/渲染函数的隔离执行证据。",
          "evidence": [
            "arckit/cases/evidence/CASE-20260917-002/verification.md",
            "runtime/arcorbit/test/workbench-refresh.test.mjs",
            "runtime/arcorbit/test/workbench-activity-sync.test.mjs",
            "arckit/tech/arcorbit/project-workbench-solution.md",
            "arckit/tech/arcorbit/realtime-synchronization-solution.md"
          ]
        },
        "facts_added": [
          {
            "id": "FACT-20260917-002-003",
            "revision": 1,
            "status": "accepted",
            "statement": "同步健康通知已与内容刷新分离；Thing 无关项目及未变化 Automation 通知复用当前详情，内容失效合并且不丢失，任务切换/账号/错误重试受保护；旧页面只渲染可见内容。209 项相关测试通过，未测真机帧耗时。",
            "basis": "实际页面模块、真实协调器及生产订阅/渲染函数的隔离执行证据。",
            "evidence": [
              "arckit/cases/evidence/CASE-20260917-002/verification.md",
              "runtime/arcorbit/test/workbench-refresh.test.mjs",
              "runtime/arcorbit/test/workbench-activity-sync.test.mjs",
              "arckit/tech/arcorbit/project-workbench-solution.md",
              "arckit/tech/arcorbit/realtime-synchronization-solution.md"
            ]
          }
        ],
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
        "software_definition_changes": [
          {
            "area_ref": "technical_foundation",
            "observed_revision": 51,
            "set_decision": {
              "status": "settled",
              "statement": "Arckit and ArcOrbit retain their existing ledger, skill, Electron, Runtime, Platform Coordinator, Work Sync, Chat, Setup Readiness, trusted case-control, and repository-relative path boundaries. The public Arckit monorepo additionally owns Todo Web under apps, Feedback Console under apps, the Feedback Web SDK under packages, the shared Workshop API under services, and integration examples under examples. JavaScript surfaces use one root workspace with independent build and release entries; the Workshop API remains an independently testable Go module. Public builds and tests never require the sibling private arckit-ops workspace. Product Coordinator 属于应用层，产品资料使用版本化协议与 revision 校验，正式记录单文件原子维护。同步通过独立 Git index 和资料分支，处理并发拒绝与远端核对，不改变开发 checkout。场景会话使用应用私有固定 cwd，材料范围与正式目录分别保存；运行内核不增加技能路由或工作角色。 Release 提供真实本地终端、原生 Git、源码编辑、构建运行及复用 Chat/Idea 的场景 Agent，消费既有工作区绑定；以 arcorbit-release-workspace.md 与 release-workspace-solution.md 为准，外部渠道和监控仍依实际 adapter。 ProjectWorkbench 为独立业务协调与呈现层，复用 WorkSync、ChatCoordinator、Automation 和 Run Manager；不复制旧业务页面或 Runtime/skill 工作流。场景组件从结构化状态投影，消息从真实 turn/run 投影；Agent 只调用受约束命令，不直接操纵 DOM。 Thing 同步通过 Work Sync 单次目录范围对账完成，项目去重且不改变后台需求与订阅范围。 同步健康通知只更新本地显示；Thing 按选中事情依赖和项目内容事件刷新详情，保留在途失效及失败重试；旧页面仅渲染可见内容。",
              "reason": "状态事件零读取与内容新鲜度测试验证同步刷新边界。",
              "evidence": [
                "arckit/tech/repository-governance/monorepo-solution.md",
                "arckit/tech/arcorbit/solution.md",
                "arckit/tech/arcorbit/platform-composition-solution.md",
                "arckit/cases/evidence/CASE-20260909-001/verification.md",
                "arckit/spec/agentic-software-development/arcorbit-product-management.md",
                "arckit/tech/arcorbit/product-management-solution.md",
                "runtime/arcorbit/src/product-coordinator.mjs",
                "runtime/arcorbit/src/product-git.mjs",
                "runtime/arcorbit/desktop/renderer/product-surface.mjs",
                "runtime/arcorbit/test/product-management.test.mjs",
                "runtime/arcorbit/test/product-surface.test.mjs",
                "definition/skills/arckit-product-assets/SKILL.md",
                "arckit/spec/agentic-software-development/arcorbit-release-workspace.md",
                "arckit/tech/arcorbit/release-workspace-solution.md",
                "arckit/interaction/release-workspace/interaction.md",
                "arckit/interaction/release-workspace/default.html",
                "arckit/cases/evidence/CASE-20260915-001/verification.md",
                "arckit/cases/evidence/CASE-20260915-001/acceptance-matrix.md",
                "arckit/spec/agentic-software-development/arcorbit-project-workbench.md",
                "arckit/interaction/project-workbench/interaction.md",
                "arckit/tech/arcorbit/project-workbench-solution.md",
                "arckit/cases/evidence/CASE-20260917-002/verification.md",
                "runtime/arcorbit/test/work-sync-coordinator.test.mjs",
                "runtime/arcorbit/test/project-workbench.test.mjs",
                "runtime/arcorbit/test/workbench-refresh.test.mjs",
                "runtime/arcorbit/test/workbench-activity-sync.test.mjs",
                "arckit/tech/arcorbit/realtime-synchronization-solution.md"
              ],
              "confidence": "high",
              "resume_condition": "Revisit when workspace tooling, repository-relative capability paths, or source ownership boundaries change. 事情身份、主会话、场景所有权或新旧导航边界变化时重审。",
              "revision": 51
            },
            "gap_refs": [],
            "reason": "用户授权优化已确认的刷新放大路径。",
            "evidence": [
              "arckit/cases/evidence/CASE-20260917-002/verification.md",
              "runtime/arcorbit/test/workbench-refresh.test.mjs",
              "runtime/arcorbit/test/workbench-activity-sync.test.mjs",
              "arckit/tech/arcorbit/project-workbench-solution.md",
              "arckit/tech/arcorbit/realtime-synchronization-solution.md"
            ]
          }
        ],
        "software_invariant_changes": [],
        "project_gap_changes": [],
        "selection_context_change": null,
        "evidence": [
          "arckit/cases/evidence/CASE-20260917-002/verification.md",
          "runtime/arcorbit/test/workbench-refresh.test.mjs",
          "runtime/arcorbit/test/workbench-activity-sync.test.mjs",
          "arckit/tech/arcorbit/project-workbench-solution.md",
          "arckit/tech/arcorbit/realtime-synchronization-solution.md"
        ]
      },
      "invariant_assessment": {
        "project_revision": 396,
        "judgments": [
          {
            "invariant_ref": "product-expectations-remain-recoverable",
            "disposition": "upheld",
            "reason": "优化保持已接受事情范围、服务器确认、人工门禁和周期校验；用户原要求与明确性能限制记录在证据中。",
            "fact_refs": [
              "FACT-20260917-002-003"
            ],
            "evidence": [
              "arckit/cases/evidence/CASE-20260917-002/verification.md",
              "runtime/arcorbit/test/workbench-refresh.test.mjs",
              "runtime/arcorbit/test/workbench-activity-sync.test.mjs",
              "arckit/tech/arcorbit/project-workbench-solution.md",
              "arckit/tech/arcorbit/realtime-synchronization-solution.md"
            ],
            "gap_refs": []
          },
          {
            "invariant_ref": "interaction-expectations-remain-recoverable",
            "disposition": "upheld",
            "reason": "切换选择、草稿、移除事情、错误重试和健康显示具有行为测试；无新导航/交互决定。",
            "fact_refs": [
              "FACT-20260917-002-003"
            ],
            "evidence": [
              "arckit/cases/evidence/CASE-20260917-002/verification.md",
              "runtime/arcorbit/test/workbench-refresh.test.mjs",
              "runtime/arcorbit/test/workbench-activity-sync.test.mjs",
              "arckit/tech/arcorbit/project-workbench-solution.md",
              "arckit/tech/arcorbit/realtime-synchronization-solution.md"
            ],
            "gap_refs": []
          },
          {
            "invariant_ref": "visual-language-remains-consistent",
            "disposition": "not_relevant",
            "reason": "不修改主题、样式、布局或视觉决定；可见页渲染是内部工作调度。",
            "fact_refs": [],
            "evidence": [],
            "gap_refs": []
          },
          {
            "invariant_ref": "technical-decisions-remain-explainable",
            "disposition": "upheld",
            "reason": "健康纯投影、内容失效与详情依赖的责任已写入现有方案，并以实际模块测试证明。",
            "fact_refs": [
              "FACT-20260917-002-003"
            ],
            "evidence": [
              "arckit/cases/evidence/CASE-20260917-002/verification.md",
              "runtime/arcorbit/test/workbench-refresh.test.mjs",
              "runtime/arcorbit/test/workbench-activity-sync.test.mjs",
              "arckit/tech/arcorbit/project-workbench-solution.md",
              "arckit/tech/arcorbit/realtime-synchronization-solution.md"
            ],
            "gap_refs": []
          },
          {
            "invariant_ref": "accepted-facts-are-realized",
            "disposition": "upheld",
            "reason": "两个授权的重复工作缺口均有计数和回归证据；不宣称真实 Chromium 帧率或打包验收。",
            "fact_refs": [
              "FACT-20260917-002-003"
            ],
            "evidence": [
              "arckit/cases/evidence/CASE-20260917-002/verification.md",
              "runtime/arcorbit/test/workbench-refresh.test.mjs",
              "runtime/arcorbit/test/workbench-activity-sync.test.mjs",
              "arckit/tech/arcorbit/project-workbench-solution.md",
              "arckit/tech/arcorbit/realtime-synchronization-solution.md"
            ],
            "gap_refs": []
          },
          {
            "invariant_ref": "debug-causes-remain-grounded",
            "disposition": "upheld",
            "reason": "原始重复调用链和页面计数与修复后对照一致；真机耗时占比仍未知，明确不纳入完成主张。",
            "fact_refs": [
              "FACT-20260917-002-003"
            ],
            "evidence": [
              "arckit/cases/evidence/CASE-20260917-002/verification.md",
              "runtime/arcorbit/test/workbench-refresh.test.mjs",
              "runtime/arcorbit/test/workbench-activity-sync.test.mjs",
              "arckit/tech/arcorbit/project-workbench-solution.md",
              "arckit/tech/arcorbit/realtime-synchronization-solution.md"
            ],
            "gap_refs": []
          },
          {
            "invariant_ref": "material-risks-have-credible-evidence",
            "disposition": "upheld",
            "reason": "209 项测试覆盖认证代际、部分失败、请求合并、选中身份、延迟响应和错误重试；Electron 缺失和未测帧率已说明。",
            "fact_refs": [
              "FACT-20260917-002-003"
            ],
            "evidence": [
              "arckit/cases/evidence/CASE-20260917-002/verification.md",
              "runtime/arcorbit/test/workbench-refresh.test.mjs",
              "runtime/arcorbit/test/workbench-activity-sync.test.mjs",
              "arckit/tech/arcorbit/project-workbench-solution.md",
              "arckit/tech/arcorbit/realtime-synchronization-solution.md"
            ],
            "gap_refs": []
          }
        ]
      },
      "evidence": [
        "arckit/cases/evidence/CASE-20260917-002/verification.md",
        "runtime/arcorbit/test/workbench-refresh.test.mjs",
        "runtime/arcorbit/test/workbench-activity-sync.test.mjs",
        "arckit/tech/arcorbit/project-workbench-solution.md",
        "arckit/tech/arcorbit/realtime-synchronization-solution.md"
      ],
      "runtime_result_ref": "",
      "occurred_at": "2026-09-17T11:26:08.365Z"
    },
    {
      "round": 3,
      "transition_schema_version": "arckit-case-transition/v8",
      "goal": "Review the completed implementation for correctness, real problem resolution, verification credibility, regression risk, and minimality.",
      "outcome": "completed",
      "gap_selection": {
        "mode": "candidate",
        "basis": "普通工作闭合，独立审查发现活动筛选回归。",
        "snapshot_token": "d67865c18e65e477c5e6fa62dc30b8bddeffd3957fb8dfa345248288c6d172f0",
        "selected_ref": "case-gap:CASE-20260917-002:CASE-20260917-002:completion-review:1",
        "comparison_summary": "当前唯一候选为完成审查，无其他 fresh 候选；finding 交由后续普通缺口。",
        "fresh_discovery_summary": "发现详情重绘复用漏掉活动筛选状态。",
        "considered": [
          {
            "ref": "case-gap:CASE-20260917-002:CASE-20260917-002:completion-review:1",
            "source": "persisted",
            "eligibility": "ready",
            "disposition": "selected",
            "priority_basis": {
              "blocking": "high",
              "uncertainty": "low",
              "risk": "high",
              "user_impact": "high"
            },
            "reason": "普通缺口闭合后的必要审查"
          }
        ]
      },
      "selected_gap": {
        "id": "CASE-20260917-002:completion-review:1",
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
        "goal": "Review the completed implementation for correctness, real problem resolution, verification credibility, regression risk, and minimality.",
        "expected_state_change": "审查五项完成维度并如实保留发现。"
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
          "reviewed_content_revision": 2,
          "dimensions": {
            "implementation_correctness": "findings",
            "problem_resolution": "findings",
            "verification_credibility": "findings",
            "regression_risk": "findings",
            "minimality": "clean"
          },
          "findings": [
            {
              "id": "activity-filter-reuse",
              "kind": "error",
              "statement": "详情复用遗漏活动筛选条件，切换事情/执行筛选不重绘列表；需恢复本地筛选且不增加读取。",
              "responsibility": "agent",
              "artifact_refs": [
                "runtime/arcorbit/desktop/renderer/project-workbench-surface.mjs"
              ],
              "evidence": [
                "arckit/cases/evidence/CASE-20260917-002/review.md",
                "runtime/arcorbit/test/workbench-refresh.test.mjs"
              ]
            }
          ],
          "evidence": [
            "arckit/cases/evidence/CASE-20260917-002/review.md",
            "runtime/arcorbit/test/workbench-refresh.test.mjs"
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
        "project_revision": 397,
        "judgments": [
          {
            "invariant_ref": "product-expectations-remain-recoverable",
            "disposition": "upheld",
            "reason": "优化保持已接受事情范围、服务器确认、人工门禁和周期校验；用户原要求与明确性能限制记录在证据中。",
            "fact_refs": [
              "FACT-20260917-002-003"
            ],
            "evidence": [
              "arckit/cases/evidence/CASE-20260917-002/verification.md",
              "runtime/arcorbit/test/workbench-refresh.test.mjs",
              "runtime/arcorbit/test/workbench-activity-sync.test.mjs",
              "arckit/tech/arcorbit/project-workbench-solution.md",
              "arckit/tech/arcorbit/realtime-synchronization-solution.md",
              "arckit/cases/evidence/CASE-20260917-002/review.md",
              "runtime/arcorbit/test/workbench-refresh.test.mjs"
            ],
            "gap_refs": []
          },
          {
            "invariant_ref": "interaction-expectations-remain-recoverable",
            "disposition": "upheld",
            "reason": "切换选择、草稿、移除事情、错误重试和健康显示具有行为测试；无新导航/交互决定。",
            "fact_refs": [
              "FACT-20260917-002-003"
            ],
            "evidence": [
              "arckit/cases/evidence/CASE-20260917-002/verification.md",
              "runtime/arcorbit/test/workbench-refresh.test.mjs",
              "runtime/arcorbit/test/workbench-activity-sync.test.mjs",
              "arckit/tech/arcorbit/project-workbench-solution.md",
              "arckit/tech/arcorbit/realtime-synchronization-solution.md",
              "arckit/cases/evidence/CASE-20260917-002/review.md",
              "runtime/arcorbit/test/workbench-refresh.test.mjs"
            ],
            "gap_refs": []
          },
          {
            "invariant_ref": "visual-language-remains-consistent",
            "disposition": "not_relevant",
            "reason": "不修改主题、样式、布局或视觉决定；可见页渲染是内部工作调度。",
            "fact_refs": [],
            "evidence": [],
            "gap_refs": []
          },
          {
            "invariant_ref": "technical-decisions-remain-explainable",
            "disposition": "upheld",
            "reason": "健康纯投影、内容失效与详情依赖的责任已写入现有方案，并以实际模块测试证明。",
            "fact_refs": [
              "FACT-20260917-002-003"
            ],
            "evidence": [
              "arckit/cases/evidence/CASE-20260917-002/verification.md",
              "runtime/arcorbit/test/workbench-refresh.test.mjs",
              "runtime/arcorbit/test/workbench-activity-sync.test.mjs",
              "arckit/tech/arcorbit/project-workbench-solution.md",
              "arckit/tech/arcorbit/realtime-synchronization-solution.md",
              "arckit/cases/evidence/CASE-20260917-002/review.md",
              "runtime/arcorbit/test/workbench-refresh.test.mjs"
            ],
            "gap_refs": []
          },
          {
            "invariant_ref": "accepted-facts-are-realized",
            "disposition": "threatened",
            "reason": "新测试复现本次详情渲染复用导致活动筛选不生效，完成主张需修复该回归。",
            "fact_refs": [
              "FACT-20260917-002-003"
            ],
            "evidence": [
              "arckit/cases/evidence/CASE-20260917-002/verification.md",
              "runtime/arcorbit/test/workbench-refresh.test.mjs",
              "runtime/arcorbit/test/workbench-activity-sync.test.mjs",
              "arckit/tech/arcorbit/project-workbench-solution.md",
              "arckit/tech/arcorbit/realtime-synchronization-solution.md",
              "arckit/cases/evidence/CASE-20260917-002/review.md",
              "runtime/arcorbit/test/workbench-refresh.test.mjs"
            ],
            "gap_refs": [
              "CASE-20260917-002:review-finding:activity-filter-reuse"
            ]
          },
          {
            "invariant_ref": "debug-causes-remain-grounded",
            "disposition": "upheld",
            "reason": "原始重复调用链和页面计数与修复后对照一致；真机耗时占比仍未知，明确不纳入完成主张。",
            "fact_refs": [
              "FACT-20260917-002-003"
            ],
            "evidence": [
              "arckit/cases/evidence/CASE-20260917-002/verification.md",
              "runtime/arcorbit/test/workbench-refresh.test.mjs",
              "runtime/arcorbit/test/workbench-activity-sync.test.mjs",
              "arckit/tech/arcorbit/project-workbench-solution.md",
              "arckit/tech/arcorbit/realtime-synchronization-solution.md",
              "arckit/cases/evidence/CASE-20260917-002/review.md",
              "runtime/arcorbit/test/workbench-refresh.test.mjs"
            ],
            "gap_refs": []
          },
          {
            "invariant_ref": "material-risks-have-credible-evidence",
            "disposition": "threatened",
            "reason": "新测试复现本次详情渲染复用导致活动筛选不生效，完成主张需修复该回归。",
            "fact_refs": [
              "FACT-20260917-002-003"
            ],
            "evidence": [
              "arckit/cases/evidence/CASE-20260917-002/verification.md",
              "runtime/arcorbit/test/workbench-refresh.test.mjs",
              "runtime/arcorbit/test/workbench-activity-sync.test.mjs",
              "arckit/tech/arcorbit/project-workbench-solution.md",
              "arckit/tech/arcorbit/realtime-synchronization-solution.md",
              "arckit/cases/evidence/CASE-20260917-002/review.md",
              "runtime/arcorbit/test/workbench-refresh.test.mjs"
            ],
            "gap_refs": [
              "CASE-20260917-002:review-finding:activity-filter-reuse"
            ]
          }
        ]
      },
      "evidence": [
        "arckit/cases/evidence/CASE-20260917-002/review.md",
        "runtime/arcorbit/test/workbench-refresh.test.mjs"
      ],
      "runtime_result_ref": "",
      "occurred_at": "2026-09-17T11:27:39.591Z"
    },
    {
      "round": 4,
      "transition_schema_version": "arckit-case-transition/v8",
      "goal": "Resolve review finding: 详情复用遗漏活动筛选条件，切换事情/执行筛选不重绘列表；需恢复本地筛选且不增加读取。",
      "outcome": "completed",
      "gap_selection": {
        "mode": "candidate",
        "basis": "修复本次变更引入且稳定复现的活动筛选回归。",
        "snapshot_token": "268b6b5515c17d13f08bac992310cd1eaa71da4903283cfa6820e2770109e107",
        "selected_ref": "case-gap:CASE-20260917-002:CASE-20260917-002:review-finding:activity-filter-reuse",
        "comparison_summary": "唯一候选为审查发现，直接阻塞原优化验收。",
        "fresh_discovery_summary": "无新增独立缺口。",
        "considered": [
          {
            "ref": "case-gap:CASE-20260917-002:CASE-20260917-002:review-finding:activity-filter-reuse",
            "source": "persisted",
            "eligibility": "ready",
            "disposition": "selected",
            "priority_basis": {
              "blocking": "high",
              "uncertainty": "",
              "risk": "high",
              "user_impact": ""
            },
            "reason": "本次回归，必须消除"
          }
        ]
      },
      "selected_gap": {
        "id": "CASE-20260917-002:review-finding:activity-filter-reuse",
        "responsibility": "agent",
        "goal": "Resolve review finding: 详情复用遗漏活动筛选条件，切换事情/执行筛选不重绘列表；需恢复本地筛选且不增加读取。",
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
          "runtime/arcorbit/desktop/renderer/project-workbench-surface.mjs",
          "arckit/cases/evidence/CASE-20260917-002/review.md",
          "runtime/arcorbit/test/workbench-refresh.test.mjs"
        ]
      },
      "planned_transition": {
        "goal": "Resolve review finding: 详情复用遗漏活动筛选条件，切换事情/执行筛选不重绘列表；需恢复本地筛选且不增加读取。",
        "expected_state_change": "本地活动筛选立即重绘，同时数据读取计数不增加。"
      },
      "accepted_state_delta": {
        "resolved_gap": {
          "id": "CASE-20260917-002:review-finding:activity-filter-reuse",
          "status": "resolved",
          "outcome": "活动详情复用已纳入筛选状态；事情、执行、全部切换通过实际事件测试，snapshot/detail 仍为1/1。完整针对性测试210项通过。",
          "reason": "失败回归测试修复后通过；只增加本地渲染依赖。",
          "evidence": [
            "arckit/cases/evidence/CASE-20260917-002/verification.md",
            "arckit/cases/evidence/CASE-20260917-002/review.md",
            "runtime/arcorbit/test/workbench-refresh.test.mjs"
          ]
        },
        "facts_added": [
          {
            "id": "FACT-20260917-002-004",
            "revision": 1,
            "status": "accepted",
            "statement": "活动详情复用已纳入筛选状态；事情、执行、全部切换通过实际事件测试，snapshot/detail 仍为1/1。完整针对性测试210项通过。",
            "basis": "失败回归测试修复后通过；只增加本地渲染依赖。",
            "evidence": [
              "arckit/cases/evidence/CASE-20260917-002/verification.md",
              "arckit/cases/evidence/CASE-20260917-002/review.md",
              "runtime/arcorbit/test/workbench-refresh.test.mjs"
            ]
          }
        ],
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
        "project_revision": 397,
        "judgments": [
          {
            "invariant_ref": "product-expectations-remain-recoverable",
            "disposition": "upheld",
            "reason": "优化保持已接受事情范围、服务器确认、人工门禁和周期校验；用户原要求与明确性能限制记录在证据中。",
            "fact_refs": [
              "FACT-20260917-002-004"
            ],
            "evidence": [
              "arckit/cases/evidence/CASE-20260917-002/verification.md",
              "runtime/arcorbit/test/workbench-refresh.test.mjs",
              "runtime/arcorbit/test/workbench-activity-sync.test.mjs",
              "arckit/tech/arcorbit/project-workbench-solution.md",
              "arckit/tech/arcorbit/realtime-synchronization-solution.md",
              "arckit/cases/evidence/CASE-20260917-002/review.md"
            ],
            "gap_refs": []
          },
          {
            "invariant_ref": "interaction-expectations-remain-recoverable",
            "disposition": "upheld",
            "reason": "切换选择、草稿、移除事情、错误重试和健康显示具有行为测试；无新导航/交互决定。",
            "fact_refs": [
              "FACT-20260917-002-004"
            ],
            "evidence": [
              "arckit/cases/evidence/CASE-20260917-002/verification.md",
              "runtime/arcorbit/test/workbench-refresh.test.mjs",
              "runtime/arcorbit/test/workbench-activity-sync.test.mjs",
              "arckit/tech/arcorbit/project-workbench-solution.md",
              "arckit/tech/arcorbit/realtime-synchronization-solution.md",
              "arckit/cases/evidence/CASE-20260917-002/review.md"
            ],
            "gap_refs": []
          },
          {
            "invariant_ref": "visual-language-remains-consistent",
            "disposition": "not_relevant",
            "reason": "不修改主题、样式、布局或视觉决定；可见页渲染是内部工作调度。",
            "fact_refs": [],
            "evidence": [],
            "gap_refs": []
          },
          {
            "invariant_ref": "technical-decisions-remain-explainable",
            "disposition": "upheld",
            "reason": "健康纯投影、内容失效与详情依赖的责任已写入现有方案，并以实际模块测试证明。",
            "fact_refs": [
              "FACT-20260917-002-004"
            ],
            "evidence": [
              "arckit/cases/evidence/CASE-20260917-002/verification.md",
              "runtime/arcorbit/test/workbench-refresh.test.mjs",
              "runtime/arcorbit/test/workbench-activity-sync.test.mjs",
              "arckit/tech/arcorbit/project-workbench-solution.md",
              "arckit/tech/arcorbit/realtime-synchronization-solution.md",
              "arckit/cases/evidence/CASE-20260917-002/review.md"
            ],
            "gap_refs": []
          },
          {
            "invariant_ref": "accepted-facts-are-realized",
            "disposition": "upheld",
            "reason": "审查发现的筛选回归已由失败转通过，210项相关测试通过；不扩大真机性能主张。",
            "fact_refs": [
              "FACT-20260917-002-004"
            ],
            "evidence": [
              "arckit/cases/evidence/CASE-20260917-002/verification.md",
              "runtime/arcorbit/test/workbench-refresh.test.mjs",
              "runtime/arcorbit/test/workbench-activity-sync.test.mjs",
              "arckit/tech/arcorbit/project-workbench-solution.md",
              "arckit/tech/arcorbit/realtime-synchronization-solution.md",
              "arckit/cases/evidence/CASE-20260917-002/review.md"
            ],
            "gap_refs": []
          },
          {
            "invariant_ref": "debug-causes-remain-grounded",
            "disposition": "upheld",
            "reason": "原始重复调用链和页面计数与修复后对照一致；真机耗时占比仍未知，明确不纳入完成主张。",
            "fact_refs": [
              "FACT-20260917-002-004"
            ],
            "evidence": [
              "arckit/cases/evidence/CASE-20260917-002/verification.md",
              "runtime/arcorbit/test/workbench-refresh.test.mjs",
              "runtime/arcorbit/test/workbench-activity-sync.test.mjs",
              "arckit/tech/arcorbit/project-workbench-solution.md",
              "arckit/tech/arcorbit/realtime-synchronization-solution.md",
              "arckit/cases/evidence/CASE-20260917-002/review.md"
            ],
            "gap_refs": []
          },
          {
            "invariant_ref": "material-risks-have-credible-evidence",
            "disposition": "upheld",
            "reason": "筛选重绘与零额外读取同时得到测试支持；其余并发、身份、失败回归保持通过。",
            "fact_refs": [
              "FACT-20260917-002-004"
            ],
            "evidence": [
              "arckit/cases/evidence/CASE-20260917-002/verification.md",
              "runtime/arcorbit/test/workbench-refresh.test.mjs",
              "runtime/arcorbit/test/workbench-activity-sync.test.mjs",
              "arckit/tech/arcorbit/project-workbench-solution.md",
              "arckit/tech/arcorbit/realtime-synchronization-solution.md",
              "arckit/cases/evidence/CASE-20260917-002/review.md"
            ],
            "gap_refs": []
          }
        ]
      },
      "evidence": [
        "arckit/cases/evidence/CASE-20260917-002/verification.md",
        "arckit/cases/evidence/CASE-20260917-002/review.md",
        "runtime/arcorbit/test/workbench-refresh.test.mjs"
      ],
      "runtime_result_ref": "",
      "occurred_at": "2026-09-17T11:29:13.974Z"
    },
    {
      "round": 5,
      "transition_schema_version": "arckit-case-transition/v8",
      "goal": "Review the completed implementation for correctness, real problem resolution, verification credibility, regression risk, and minimality.",
      "outcome": "completed",
      "gap_selection": {
        "mode": "candidate",
        "basis": "审查修复后的内容版本3。",
        "snapshot_token": "4117408f91143aae2f8f2603662d64b279d3424bf7d4b856d2b3651c32abfb72",
        "selected_ref": "case-gap:CASE-20260917-002:CASE-20260917-002:completion-review:2",
        "comparison_summary": "唯一候选为第二次完成审查，没有新的普通缺口。",
        "fresh_discovery_summary": "复核全部详情状态依赖及范围，没有发现新阻塞项。",
        "considered": [
          {
            "ref": "case-gap:CASE-20260917-002:CASE-20260917-002:completion-review:2",
            "source": "persisted",
            "eligibility": "ready",
            "disposition": "selected",
            "priority_basis": {
              "blocking": "high",
              "uncertainty": "low",
              "risk": "high",
              "user_impact": "high"
            },
            "reason": "验证审查发现已消除且无新增回归"
          }
        ]
      },
      "selected_gap": {
        "id": "CASE-20260917-002:completion-review:2",
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
        "goal": "Review the completed implementation for correctness, real problem resolution, verification credibility, regression risk, and minimality.",
        "expected_state_change": "完成五维度独立审查，明确性能证据边界。"
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
          "reviewed_content_revision": 3,
          "dimensions": {
            "implementation_correctness": "clean",
            "problem_resolution": "clean",
            "verification_credibility": "clean",
            "regression_risk": "clean",
            "minimality": "clean"
          },
          "findings": [],
          "evidence": [
            "arckit/cases/evidence/CASE-20260917-002/review.md",
            "arckit/cases/evidence/CASE-20260917-002/verification.md",
            "runtime/arcorbit/test/workbench-refresh.test.mjs"
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
        "project_revision": 397,
        "judgments": [
          {
            "invariant_ref": "product-expectations-remain-recoverable",
            "disposition": "upheld",
            "reason": "优化保持已接受事情范围、服务器确认、人工门禁和周期校验；用户原要求与明确性能限制记录在证据中。",
            "fact_refs": [
              "FACT-20260917-002-004"
            ],
            "evidence": [
              "arckit/cases/evidence/CASE-20260917-002/verification.md",
              "runtime/arcorbit/test/workbench-refresh.test.mjs",
              "runtime/arcorbit/test/workbench-activity-sync.test.mjs",
              "arckit/tech/arcorbit/project-workbench-solution.md",
              "arckit/tech/arcorbit/realtime-synchronization-solution.md",
              "arckit/cases/evidence/CASE-20260917-002/review.md"
            ],
            "gap_refs": []
          },
          {
            "invariant_ref": "interaction-expectations-remain-recoverable",
            "disposition": "upheld",
            "reason": "切换选择、草稿、移除事情、错误重试和健康显示具有行为测试；无新导航/交互决定。",
            "fact_refs": [
              "FACT-20260917-002-004"
            ],
            "evidence": [
              "arckit/cases/evidence/CASE-20260917-002/verification.md",
              "runtime/arcorbit/test/workbench-refresh.test.mjs",
              "runtime/arcorbit/test/workbench-activity-sync.test.mjs",
              "arckit/tech/arcorbit/project-workbench-solution.md",
              "arckit/tech/arcorbit/realtime-synchronization-solution.md",
              "arckit/cases/evidence/CASE-20260917-002/review.md"
            ],
            "gap_refs": []
          },
          {
            "invariant_ref": "visual-language-remains-consistent",
            "disposition": "not_relevant",
            "reason": "不修改主题、样式、布局或视觉决定；可见页渲染是内部工作调度。",
            "fact_refs": [],
            "evidence": [],
            "gap_refs": []
          },
          {
            "invariant_ref": "technical-decisions-remain-explainable",
            "disposition": "upheld",
            "reason": "健康纯投影、内容失效与详情依赖的责任已写入现有方案，并以实际模块测试证明。",
            "fact_refs": [
              "FACT-20260917-002-004"
            ],
            "evidence": [
              "arckit/cases/evidence/CASE-20260917-002/verification.md",
              "runtime/arcorbit/test/workbench-refresh.test.mjs",
              "runtime/arcorbit/test/workbench-activity-sync.test.mjs",
              "arckit/tech/arcorbit/project-workbench-solution.md",
              "arckit/tech/arcorbit/realtime-synchronization-solution.md",
              "arckit/cases/evidence/CASE-20260917-002/review.md"
            ],
            "gap_refs": []
          },
          {
            "invariant_ref": "accepted-facts-are-realized",
            "disposition": "upheld",
            "reason": "审查发现的筛选回归已由失败转通过，210项相关测试通过；不扩大真机性能主张。",
            "fact_refs": [
              "FACT-20260917-002-004"
            ],
            "evidence": [
              "arckit/cases/evidence/CASE-20260917-002/verification.md",
              "runtime/arcorbit/test/workbench-refresh.test.mjs",
              "runtime/arcorbit/test/workbench-activity-sync.test.mjs",
              "arckit/tech/arcorbit/project-workbench-solution.md",
              "arckit/tech/arcorbit/realtime-synchronization-solution.md",
              "arckit/cases/evidence/CASE-20260917-002/review.md"
            ],
            "gap_refs": []
          },
          {
            "invariant_ref": "debug-causes-remain-grounded",
            "disposition": "upheld",
            "reason": "原始重复调用链和页面计数与修复后对照一致；真机耗时占比仍未知，明确不纳入完成主张。",
            "fact_refs": [
              "FACT-20260917-002-004"
            ],
            "evidence": [
              "arckit/cases/evidence/CASE-20260917-002/verification.md",
              "runtime/arcorbit/test/workbench-refresh.test.mjs",
              "runtime/arcorbit/test/workbench-activity-sync.test.mjs",
              "arckit/tech/arcorbit/project-workbench-solution.md",
              "arckit/tech/arcorbit/realtime-synchronization-solution.md",
              "arckit/cases/evidence/CASE-20260917-002/review.md"
            ],
            "gap_refs": []
          },
          {
            "invariant_ref": "material-risks-have-credible-evidence",
            "disposition": "upheld",
            "reason": "筛选重绘与零额外读取同时得到测试支持；其余并发、身份、失败回归保持通过。",
            "fact_refs": [
              "FACT-20260917-002-004"
            ],
            "evidence": [
              "arckit/cases/evidence/CASE-20260917-002/verification.md",
              "runtime/arcorbit/test/workbench-refresh.test.mjs",
              "runtime/arcorbit/test/workbench-activity-sync.test.mjs",
              "arckit/tech/arcorbit/project-workbench-solution.md",
              "arckit/tech/arcorbit/realtime-synchronization-solution.md",
              "arckit/cases/evidence/CASE-20260917-002/review.md"
            ],
            "gap_refs": []
          }
        ]
      },
      "evidence": [
        "arckit/cases/evidence/CASE-20260917-002/review.md",
        "arckit/cases/evidence/CASE-20260917-002/verification.md",
        "runtime/arcorbit/test/workbench-refresh.test.mjs"
      ],
      "runtime_result_ref": "",
      "occurred_at": "2026-09-17T11:30:23.391Z"
    }
  ],
  "case_resolution": {
    "status": "resolved",
    "stage": "resolved",
    "satisfied": [
      "GAP-20260917-002-001",
      "GAP-20260917-002-002",
      "CASE-20260917-002:review-finding:activity-filter-reuse"
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
    "updated_at": "2026-09-17T11:30:23.391Z"
  }
}
```

## Round Notes

- Case history is canonical in Structured Record.rounds; keep prose notes exceptional.
