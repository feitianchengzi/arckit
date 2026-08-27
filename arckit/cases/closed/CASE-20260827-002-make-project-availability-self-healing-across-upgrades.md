# Make project availability self-healing across upgrades

Case: CASE-20260827-002
Status: closed
Artifact Type: mixed
Selected Gap: none
Updated: 2026-08-27T04:21:53.274Z

## User Intent

Replace split Today and Automation project visibility with one recoverable catalog and deterministic derived readiness after overwrite installation.

## Structured Record

```json
{
  "schema_version": "development-case-record/v5",
  "id": "CASE-20260827-002",
  "title": "Make project availability self-healing across upgrades",
  "status": "closed",
  "artifact_type": "mixed",
  "created_at": "2026-08-27T03:57:12.355Z",
  "updated_at": "2026-08-27T04:21:53.274Z",
  "user_intent": "Replace split Today and Automation project visibility with one recoverable catalog and deterministic derived readiness after overwrite installation.",
  "expected_outcome": "A user upgrading from any supported persisted ArcOrbit state sees every accessible Workset project consistently in Today, Work and Automation; derived sync and execution readiness rebuild automatically without logout, cache deletion or manual repair, while unhealthy projects remain visible with bounded execution errors.",
  "project_state_ref": "arckit/project/state.record.json",
  "current_round": {
    "goal": "",
    "selected_gap": null
  },
  "facts": [
    {
      "id": "FACT-20260827-002-001",
      "revision": 1,
      "status": "accepted",
      "statement": "ArcOrbit b20 derives Today product workspaces from the accessible project catalog and active Workset, but derives Automation project binding rows from trusted task-sync project records intersected with that Workset; a first detail-sync failure can therefore leave a project visible in Today and absent from Automation.",
      "basis": "Source inspection and an isolated reproduction in which listProjects succeeds while listProjectTags returns 403 produced a Today workspace and no Automation project record.",
      "evidence": [
        "runtime/arcorbit/src/platform-coordinator.mjs",
        "runtime/arcorbit/src/work-sync-coordinator.mjs",
        "runtime/arcorbit/desktop/renderer/renderer.js",
        "Verification: isolated project-detail failure reproduced catalog-visible and Automation-absent projections"
      ]
    },
    {
      "id": "FACT-20260827-002-002",
      "revision": 1,
      "status": "accepted",
      "statement": "The product requirement is that overwrite installation of a new ArcOrbit version restores normal project visibility and execution automatically for upgraded users, without per-user diagnosis, logout, cache deletion or manual data repair; the remedy must be an architecture upgrade rather than a symptom-specific UI fallback.",
      "basis": "Current operator requirement.",
      "evidence": [
        "system:current_operator_input"
      ]
    },
    {
      "id": "FACT-20260827-002-003",
      "revision": 1,
      "status": "accepted",
      "statement": "ArcOrbit 的项目可用性架构已确立为统一 Project Catalog、独立 Workspace Control 与派生 Task Readiness；覆盖安装保留控制事实并自动重建派生状态，项目级同步失败保持项目可见且只冻结受影响执行资格。",
      "basis": "稳定 spec、interaction 与 tech 文档对同一状态所有权、恢复路径和验收行为达成一致。",
      "evidence": [
        "arckit/spec/agentic-software-development/arcorbit-work-management.md",
        "arckit/interaction/automation-workspace/interaction.md",
        "arckit/interaction/automation-workspace/default.html",
        "arckit/tech/arcorbit/realtime-synchronization-solution.md"
      ]
    },
    {
      "id": "FACT-20260827-002-004",
      "revision": 1,
      "status": "accepted",
      "statement": "ArcOrbit Desktop Store v16、Work Sync 和 Automation 已实现覆盖安装确定性 rehydration：旧 store 保留 Workset、binding、participation、session 与执行控制，撤销旧 Task Readiness 信任；Automation 从 Catalog 构造项目行，任务与标签独立确认，in-flight reconcile 后续 demand 由 generation loop 继续处理。",
      "basis": "生产源码与行为级测试共同验证 v15 覆盖安装、首次任务失败、标签失败和 Workset 竞态路径。",
      "evidence": [
        "runtime/arcorbit/src/desktop/desktop-store.mjs",
        "runtime/arcorbit/src/work-sync-coordinator.mjs",
        "runtime/arcorbit/src/automation-coordinator.mjs",
        "runtime/arcorbit/desktop/renderer/renderer.js",
        "runtime/arcorbit/test/desktop-store.test.mjs",
        "runtime/arcorbit/test/work-sync-coordinator.test.mjs",
        "runtime/arcorbit/test/automation-coordinator.test.mjs",
        "Verification: 15 Work Sync tests passed",
        "Verification: 88 focused Store, Work Sync and Automation tests passed"
      ]
    }
  ],
  "state_impacts": [
    {
      "id": "IMPACT-20260827-002-001",
      "fact_id": "FACT-20260827-002-003",
      "fact_revision": 1,
      "target": {
        "kind": "software_decision",
        "ref": "product_capabilities",
        "revision": 39
      },
      "effect": "upheld",
      "reason": "统一 Catalog 与可见性/就绪解耦已成为产品能力契约。",
      "gap_ids": [],
      "evidence": [
        "arckit/spec/agentic-software-development/arcorbit-work-management.md"
      ]
    },
    {
      "id": "IMPACT-20260827-002-002",
      "fact_id": "FACT-20260827-002-003",
      "fact_revision": 1,
      "target": {
        "kind": "software_decision",
        "ref": "experience_and_interaction",
        "revision": 60
      },
      "effect": "upheld",
      "reason": "覆盖安装和项目降级恢复路径已明确。",
      "gap_ids": [],
      "evidence": [
        "arckit/interaction/automation-workspace/interaction.md",
        "arckit/interaction/automation-workspace/default.html"
      ]
    },
    {
      "id": "IMPACT-20260827-002-003",
      "fact_id": "FACT-20260827-002-003",
      "fact_revision": 1,
      "target": {
        "kind": "software_decision",
        "ref": "data_and_state",
        "revision": 20
      },
      "effect": "upheld",
      "reason": "持久控制事实与派生就绪状态边界已明确。",
      "gap_ids": [],
      "evidence": [
        "arckit/tech/arcorbit/realtime-synchronization-solution.md"
      ]
    },
    {
      "id": "IMPACT-20260827-002-004",
      "fact_id": "FACT-20260827-002-003",
      "fact_revision": 1,
      "target": {
        "kind": "software_decision",
        "ref": "technical_foundation",
        "revision": 42
      },
      "effect": "upheld",
      "reason": "确定性 rehydration 与协调对账已成为技术约束。",
      "gap_ids": [],
      "evidence": [
        "arckit/tech/arcorbit/realtime-synchronization-solution.md"
      ]
    },
    {
      "id": "IMPACT-20260827-002-005",
      "fact_id": "FACT-20260827-002-004",
      "fact_revision": 1,
      "target": {
        "kind": "software_decision",
        "ref": "quality_and_validation",
        "revision": 21
      },
      "effect": "upheld",
      "reason": "历史 Store、项目任务失败、标签失败和 demand generation 均有行为级回归。",
      "gap_ids": [],
      "evidence": [
        "runtime/arcorbit/test/desktop-store.test.mjs",
        "runtime/arcorbit/test/work-sync-coordinator.test.mjs",
        "runtime/arcorbit/test/automation-coordinator.test.mjs",
        "Verification: 88 focused tests passed"
      ]
    },
    {
      "id": "IMPACT-20260827-002-006",
      "fact_id": "FACT-20260827-002-004",
      "fact_revision": 1,
      "target": {
        "kind": "software_invariant",
        "ref": "accepted-facts-are-realized",
        "revision": null
      },
      "effect": "upheld",
      "reason": "统一 Catalog、覆盖安装重建和项目级失败边界均已由生产代码兑现。",
      "gap_ids": [],
      "evidence": [
        "runtime/arcorbit/src/desktop/desktop-store.mjs",
        "runtime/arcorbit/src/work-sync-coordinator.mjs",
        "runtime/arcorbit/src/automation-coordinator.mjs",
        "runtime/arcorbit/desktop/renderer/renderer.js"
      ]
    }
  ],
  "gaps": [
    {
      "id": "GAP-20260827-002-001",
      "status": "resolved",
      "goal": "Establish the authoritative project catalog, derived readiness boundaries and overwrite-upgrade rehydration contract that keep Today, Work and Automation project identity consistent while representing sync failure as visible degraded readiness instead of project disappearance.",
      "reason": "Implementation cannot be safely upgraded until stable product and technical ownership rules define which state survives installation, which state is rebuilt, and how partial remote failure affects visibility versus execution eligibility.",
      "derived_from": [
        "FACT-20260827-002-001",
        "FACT-20260827-002-002"
      ],
      "blocked_by": [],
      "priority_basis": {
        "blocking": "Blocks upgraded users from enabling Automation on newly added projects.",
        "urgency": "high",
        "risk": "high",
        "user_impact": "high"
      },
      "responsibility": "agent",
      "evidence_required": [
        "Authoritative product behavior for cross-surface project visibility and degraded readiness",
        "Technical ownership and deterministic rehydration contract for persisted versus derived project state",
        "Acceptance criteria covering overwrite upgrade from legacy persisted stores and partial project-detail failures"
      ],
      "resolution": {
        "id": "GAP-20260827-002-001",
        "status": "resolved",
        "outcome": "统一 Project Catalog、Workspace Control、Task Readiness 和覆盖安装重建契约已在产品、交互和技术层确立。",
        "reason": "架构文档已经明确持久与派生边界、部分失败行为、无手工恢复要求和验收口径。",
        "evidence": [
          "arckit/spec/agentic-software-development/arcorbit-work-management.md",
          "arckit/interaction/automation-workspace/interaction.md",
          "arckit/interaction/automation-workspace/default.html",
          "arckit/tech/arcorbit/realtime-synchronization-solution.md"
        ],
        "occurred_at": "2026-08-27T04:06:19.941Z"
      }
    },
    {
      "id": "GAP-20260827-002-002",
      "status": "resolved",
      "goal": "实现覆盖安装自愈的 Project Catalog / Task Readiness 分层、Store 重建、协调对账、任务/标签独立确认、Automation Catalog 项目行与行为级回归。",
      "reason": "稳定架构已经确立，但当前生产实现仍使用 trusted task records 过滤 Automation 项目并可能吞掉并发 reconcile 需求。",
      "derived_from": [
        "FACT-20260827-002-001",
        "FACT-20260827-002-002",
        "FACT-20260827-002-003"
      ],
      "blocked_by": [],
      "priority_basis": {
        "blocking": "覆盖安装新版后自动恢复正常使用的生产能力尚未兑现。",
        "urgency": "high",
        "risk": "high",
        "user_impact": "high"
      },
      "responsibility": "agent",
      "evidence_required": [
        "旧 Store 覆盖安装后控制事实保留且派生状态自动重建",
        "Catalog 已确认而任务失败时 Automation 项目仍可见且仅该项目冻结",
        "标签失败不废弃已确认任务",
        "reconcile 期间新增需求得到后续对账",
        "相关行为级测试与 ArcOrbit check 通过"
      ],
      "resolution": {
        "id": "GAP-20260827-002-002",
        "status": "resolved",
        "outcome": "覆盖安装自愈架构已在 Desktop Store、Work Sync、Automation Coordinator、Renderer 与行为级测试中实现。",
        "reason": "v15 及更旧 store 统一进入 v16 rehydration，Catalog 项目不再由 trusted task records 过滤，任务/标签独立确认且并发 reconcile demand 不会丢失。",
        "evidence": [
          "runtime/arcorbit/src/desktop/desktop-store.mjs",
          "runtime/arcorbit/src/work-sync-coordinator.mjs",
          "runtime/arcorbit/src/automation-coordinator.mjs",
          "runtime/arcorbit/desktop/renderer/renderer.js",
          "runtime/arcorbit/test/desktop-store.test.mjs",
          "runtime/arcorbit/test/work-sync-coordinator.test.mjs",
          "runtime/arcorbit/test/automation-coordinator.test.mjs"
        ],
        "occurred_at": "2026-08-27T04:19:13.057Z"
      }
    }
  ],
  "content_revision": 2,
  "completion_review": {
    "status": "clean",
    "policy": {
      "initial_max_cycles": 3,
      "source": "Current operator authorized autonomous architecture upgrade and implementation.",
      "snapshotted_at": "2026-08-27T03:57:12.355Z"
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
          "Implementation correctness: Catalog identity, task readiness, bindings, and participation are separated across desktop-store, work-sync, and automation coordinators.",
          "Problem resolution: v15-to-v16 overwrite migration preserves user controls, invalidates derived trust, and schedules deterministic rehydration without logout, cache clearing, or project re-entry.",
          "Verification credibility: 15 Work Sync tests and 88 focused tests passed; direct Electron fixtures satisfied the two wrapper assertion sets that the sandbox could not launch.",
          "Regression risk: task failure, tag-only failure, Catalog-only visibility, preserved bindings/participation, and in-flight demand generation each have behavior-level coverage.",
          "Minimality: the implementation reuses the existing local store, projection, binding row, and sync coordinator; it adds no parallel repair subsystem or user-facing maintenance workflow."
        ],
        "occurred_at": "2026-08-27T04:21:53.274Z"
      }
    ],
    "evidence": [
      "Implementation correctness: Catalog identity, task readiness, bindings, and participation are separated across desktop-store, work-sync, and automation coordinators.",
      "Problem resolution: v15-to-v16 overwrite migration preserves user controls, invalidates derived trust, and schedules deterministic rehydration without logout, cache clearing, or project re-entry.",
      "Verification credibility: 15 Work Sync tests and 88 focused tests passed; direct Electron fixtures satisfied the two wrapper assertion sets that the sandbox could not launch.",
      "Regression risk: task failure, tag-only failure, Catalog-only visibility, preserved bindings/participation, and in-flight demand generation each have behavior-level coverage.",
      "Minimality: the implementation reuses the existing local store, projection, binding row, and sync coordinator; it adds no parallel repair subsystem or user-facing maintenance workflow."
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
      "goal": "确立统一 Project Catalog、派生 Task Readiness 与覆盖安装 rehydration 架构契约。",
      "outcome": "completed",
      "gap_selection": {
        "mode": "candidate",
        "basis": "用户要求覆盖安装后无手工修复，当前 Case 的架构 Gap 是实现这一目标的必要前置。",
        "snapshot_token": "e2d54b9a708e87a0f1e661cf80956d6c862d1f79ed189416fd1b7bc2bea2adb2",
        "selected_ref": "case-gap:CASE-20260827-002:GAP-20260827-002-001",
        "comparison_summary": "四个 Project Gap 需要独立 Case；当前 Case Gap 直接阻断升级用户恢复，优先级最高。",
        "fresh_discovery_summary": "架构契约明确后发现一个独立实现与行为验证 Gap，本轮记录但不越过架构轮边界执行。",
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
            "reason": "需要独立评估 Case，不属于当前升级自愈范围。"
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
            "reason": "需要独立 Runtime 韧性 Case，不取代当前产品架构阻断。"
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
            "reason": "需要真实权限项目和独立 Case。"
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
            "reason": "是协议级审计工作，需要独立 Case。"
          },
          {
            "ref": "case-gap:CASE-20260827-002:GAP-20260827-002-001",
            "source": "persisted",
            "eligibility": "ready",
            "disposition": "selected",
            "priority_basis": {
              "blocking": "Blocks upgraded users from enabling Automation on newly added projects.",
              "risk": "high",
              "user_impact": "high",
              "urgency": "high"
            },
            "reason": "直接建立覆盖安装自愈所需的唯一项目事实和重建边界。"
          }
        ]
      },
      "selected_gap": {
        "id": "GAP-20260827-002-001",
        "responsibility": "agent",
        "goal": "Establish the authoritative project catalog, derived readiness boundaries and overwrite-upgrade rehydration contract that keep Today, Work and Automation project identity consistent while representing sync failure as visible degraded readiness instead of project disappearance.",
        "reason": "Implementation cannot be safely upgraded until stable product and technical ownership rules define which state survives installation, which state is rebuilt, and how partial remote failure affects visibility versus execution eligibility.",
        "derived_from": [
          "FACT-20260827-002-001",
          "FACT-20260827-002-002"
        ],
        "blocked_by": [],
        "priority_basis": {
          "blocking": "Blocks upgraded users from enabling Automation on newly added projects.",
          "uncertainty": "",
          "risk": "high",
          "user_impact": "high",
          "urgency": "high"
        },
        "evidence_required": [
          "Authoritative product behavior for cross-surface project visibility and degraded readiness",
          "Technical ownership and deterministic rehydration contract for persisted versus derived project state",
          "Acceptance criteria covering overwrite upgrade from legacy persisted stores and partial project-detail failures"
        ]
      },
      "planned_transition": {
        "goal": "确立统一 Project Catalog、派生 Task Readiness 与覆盖安装 rehydration 架构契约。",
        "expected_state_change": "稳定规格、交互和技术文档对齐；当前架构 Gap 关闭并留下可执行的实现 Gap。"
      },
      "accepted_state_delta": {
        "resolved_gap": {
          "id": "GAP-20260827-002-001",
          "status": "resolved",
          "outcome": "统一 Project Catalog、Workspace Control、Task Readiness 和覆盖安装重建契约已在产品、交互和技术层确立。",
          "reason": "架构文档已经明确持久与派生边界、部分失败行为、无手工恢复要求和验收口径。",
          "evidence": [
            "arckit/spec/agentic-software-development/arcorbit-work-management.md",
            "arckit/interaction/automation-workspace/interaction.md",
            "arckit/interaction/automation-workspace/default.html",
            "arckit/tech/arcorbit/realtime-synchronization-solution.md"
          ]
        },
        "facts_added": [
          {
            "id": "FACT-20260827-002-003",
            "revision": 1,
            "status": "accepted",
            "statement": "ArcOrbit 的项目可用性架构已确立为统一 Project Catalog、独立 Workspace Control 与派生 Task Readiness；覆盖安装保留控制事实并自动重建派生状态，项目级同步失败保持项目可见且只冻结受影响执行资格。",
            "basis": "稳定 spec、interaction 与 tech 文档对同一状态所有权、恢复路径和验收行为达成一致。",
            "evidence": [
              "arckit/spec/agentic-software-development/arcorbit-work-management.md",
              "arckit/interaction/automation-workspace/interaction.md",
              "arckit/interaction/automation-workspace/default.html",
              "arckit/tech/arcorbit/realtime-synchronization-solution.md"
            ]
          }
        ],
        "facts_superseded": [],
        "impacts_added": [
          {
            "id": "IMPACT-20260827-002-001",
            "fact_id": "FACT-20260827-002-003",
            "fact_revision": 1,
            "target": {
              "kind": "software_decision",
              "ref": "product_capabilities",
              "revision": 39
            },
            "effect": "upheld",
            "reason": "统一 Catalog 与可见性/就绪解耦已成为产品能力契约。",
            "gap_ids": [],
            "evidence": [
              "arckit/spec/agentic-software-development/arcorbit-work-management.md"
            ]
          },
          {
            "id": "IMPACT-20260827-002-002",
            "fact_id": "FACT-20260827-002-003",
            "fact_revision": 1,
            "target": {
              "kind": "software_decision",
              "ref": "experience_and_interaction",
              "revision": 60
            },
            "effect": "upheld",
            "reason": "覆盖安装和项目降级恢复路径已明确。",
            "gap_ids": [],
            "evidence": [
              "arckit/interaction/automation-workspace/interaction.md",
              "arckit/interaction/automation-workspace/default.html"
            ]
          },
          {
            "id": "IMPACT-20260827-002-003",
            "fact_id": "FACT-20260827-002-003",
            "fact_revision": 1,
            "target": {
              "kind": "software_decision",
              "ref": "data_and_state",
              "revision": 20
            },
            "effect": "upheld",
            "reason": "持久控制事实与派生就绪状态边界已明确。",
            "gap_ids": [],
            "evidence": [
              "arckit/tech/arcorbit/realtime-synchronization-solution.md"
            ]
          },
          {
            "id": "IMPACT-20260827-002-004",
            "fact_id": "FACT-20260827-002-003",
            "fact_revision": 1,
            "target": {
              "kind": "software_decision",
              "ref": "technical_foundation",
              "revision": 42
            },
            "effect": "upheld",
            "reason": "确定性 rehydration 与协调对账已成为技术约束。",
            "gap_ids": [],
            "evidence": [
              "arckit/tech/arcorbit/realtime-synchronization-solution.md"
            ]
          },
          {
            "id": "IMPACT-20260827-002-005",
            "fact_id": "FACT-20260827-002-003",
            "fact_revision": 1,
            "target": {
              "kind": "software_decision",
              "ref": "quality_and_validation",
              "revision": 21
            },
            "effect": "threatened",
            "reason": "验收口径已定义，但生产实现与历史 fixture/部分失败/竞态测试尚未完成。",
            "gap_ids": [
              "GAP-20260827-002-002"
            ],
            "evidence": []
          },
          {
            "id": "IMPACT-20260827-002-006",
            "fact_id": "FACT-20260827-002-003",
            "fact_revision": 1,
            "target": {
              "kind": "software_invariant",
              "ref": "accepted-facts-are-realized",
              "revision": null
            },
            "effect": "threatened",
            "reason": "架构事实已接受但生产代码尚未兑现。",
            "gap_ids": [
              "GAP-20260827-002-002"
            ],
            "evidence": []
          }
        ],
        "impacts_updated": [],
        "gaps_added": [
          {
            "id": "GAP-20260827-002-002",
            "status": "open",
            "goal": "实现覆盖安装自愈的 Project Catalog / Task Readiness 分层、Store 重建、协调对账、任务/标签独立确认、Automation Catalog 项目行与行为级回归。",
            "reason": "稳定架构已经确立，但当前生产实现仍使用 trusted task records 过滤 Automation 项目并可能吞掉并发 reconcile 需求。",
            "derived_from": [
              "FACT-20260827-002-001",
              "FACT-20260827-002-002",
              "FACT-20260827-002-003"
            ],
            "blocked_by": [],
            "priority_basis": {
              "blocking": "覆盖安装新版后自动恢复正常使用的生产能力尚未兑现。",
              "urgency": "high",
              "risk": "high",
              "user_impact": "high"
            },
            "responsibility": "agent",
            "evidence_required": [
              "旧 Store 覆盖安装后控制事实保留且派生状态自动重建",
              "Catalog 已确认而任务失败时 Automation 项目仍可见且仅该项目冻结",
              "标签失败不废弃已确认任务",
              "reconcile 期间新增需求得到后续对账",
              "相关行为级测试与 ArcOrbit check 通过"
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
            "observed_revision": 38,
            "set_decision": {
              "status": "settled",
              "statement": "ArcOrbit 保留既有 Desktop、Runtime、Chat、Automation、Feedback 与 Work 能力和边界。Work 是 Workshop 待办同步与本地 Task Projection 的唯一客户端所有者；新建和编辑 Sheet 提供完整七状态，编辑 Sheet 是异常纠偏兜底，Inspector 按当前状态提供有限下一步动作。Work Inspector 默认更宽，支持可访问拖拽调宽与跨应用重启恢复，并使用内容、紧凑属性、协作和验收语义分区。Work 编辑待办允许把内容复制到当前产品集内另一个可写产品，并在目标创建获 Workshop 确认后删除源 Task。目标 Task 获得新身份，仅复制正文、状态、优先级及目标产品内重新选择的关联字段，不继承评论、附件、Run、session、thread、Gate 或验收问题。Work 负责两阶段 mutation 和部分成功恢复；Automation 只消费服务器确认后的本地状态。Setup Readiness 在应用冷启动时 fresh-check Desktop Store 中全部已关联本地项目相对于内置 payload 的 skill drift；新增或改变本地项目关联及用户主动重试会再次检查。项目集、具体项目、Workset 等纯查看切换、解除关联和 task start 不重新扫描 skills，task start 只消费已验证缓存并 fail closed。trusted Case binding 的既有能力和边界保持不变。Setup Readiness 对同名项目 skill、loader、共享资源和用户按需 catalog 冲突保留 typed diagnostic；当 provider 证明安全目标与唯一内置来源时，用户可逐项选择“备份并使用当前应用包覆盖所选同名 skill”，未选和无关内容保持不变。Feedback 中已忽略且未关联待办的反馈可恢复为待处理，恢复只在服务端确认 pending 后生效。 Today、Work、Automation 与 Organization 必须从同一可访问 Project Catalog 得到项目身份；项目存在、项目绑定、同步就绪和执行资格彼此独立，项目详情同步失败不得使项目消失。",
              "reason": "当前 Case 将覆盖安装自愈和跨页面项目一致性确立为稳定架构边界。",
              "evidence": [
                "Current operator input, 2026-08-27",
                "arckit/spec/agentic-software-development/arcorbit-platform-capabilities.md",
                "arckit/interaction/platform-workspace/interaction.md",
                "arckit/spec/agentic-software-development/arcorbit-work-management.md",
                "arckit/interaction/automation-workspace/interaction.md",
                "arckit/tech/arcorbit/realtime-synchronization-solution.md"
              ],
              "confidence": "high",
              "resume_condition": "当 Project Catalog 所有权、跨页面可见性或项目级执行资格边界改变时重审。"
            },
            "gap_refs": [
              "GAP-agent-scenario-evaluation"
            ],
            "reason": "当前架构 Gap 建立了该决策区域新的稳定边界。",
            "evidence": [
              "arckit/spec/agentic-software-development/arcorbit-work-management.md",
              "arckit/interaction/automation-workspace/interaction.md",
              "arckit/tech/arcorbit/realtime-synchronization-solution.md"
            ]
          },
          {
            "area_ref": "experience_and_interaction",
            "observed_revision": 59,
            "set_decision": {
              "status": "settled",
              "statement": "ArcOrbit 保持既有 Personal、Product Lifecycle、Organization 导航与 Work、Automation、Feedback、Chat 等交互语义。Work 新建和编辑 Sheet 保留完整七状态，编辑 Sheet 承担异常纠偏；右侧 Inspector 按当前状态显示有限下一步动作。Work Inspector 首次使用 440px，用户可通过 12px 可访问分隔条在 360–640px 保存范围内拖拽、键盘调整或双击复位，偏好跨任务、项目、Workset 和应用重启恢复。布局为任务树保留至少 420px，窗口临时收窄只改变有效宽度且不覆盖保存值。Inspector 以单一内部滚动区组织身份动作、内容、紧凑属性、协作和按状态出现的验收分区，宽度变化不丢失选择、滚动、草稿或附件状态。验收问题条目的问题原文与进展文本在 Inspector 当前可用宽度内完整折行且不横向越界，状态徽标保持清晰可见。Work 已完成列表按新完成在上、历史完成在下排列；标记首项为已验收后选择下一条较旧待办，标记其他位置后选择相邻较新待办，树补全项不参与目标计算，且选择只在服务器确认成功后切换。验收请求期间允许浏览其他任务；若用户在服务器确认前产生较新的选择，成功回调保留该选择而不执行旧任务的自动相邻切换。Work 新建待办 Sheet 在执行人控件下根据执行人与状态原位解释 Automation 资格。跨产品替换、主窗口和 Case 绑定恢复的既有交互保持不变。应用冷启动检查全部关联本地项目；新增或改变本地关联及用户主动重试再次检查。项目集全部、具体项目、Workset 或其它纯查看切换只改变业务投影，不进入 Setup；解除关联和 task start 不重新扫描 skills。task start 缓存断言失败时返回 Setup，等待用户主动重新检查。Setup 冲突页逐项显示稳定 code、skill、目标类型与路径及双方 digest；兜底覆盖默认全不选，支持逐项或全选可恢复项，独立确认 recovery root 与 fresh assessment digest，并反馈备份、替换、回滚和残留状态。Feedback 已忽略且未关联待办的详情显示“恢复为待处理”；动作无需二次确认，提交期间锁定自身，只有服务端确认 pending 后更新状态，失败时保持 ignored、筛选、选择和滚动位置。 受支持旧版本覆盖安装后，Automation 先恢复 Catalog 项目行并保留 Workset、绑定和项目授权，再逐项目显示正在恢复、同步异常或可执行；用户无需退出登录、清缓存或重新添加项目。",
              "reason": "当前 Case 将覆盖安装自愈和跨页面项目一致性确立为稳定架构边界。",
              "evidence": [
                "Current operator input, 2026-08-27",
                "arckit/interaction/platform-workspace/interaction.md",
                "arckit/interaction/platform-workspace/default.html",
                "arckit/spec/agentic-software-development/arcorbit-work-management.md",
                "arckit/interaction/automation-workspace/interaction.md",
                "arckit/tech/arcorbit/realtime-synchronization-solution.md"
              ],
              "confidence": "high",
              "resume_condition": "当覆盖安装恢复路径、降级项目展示或用户修复责任改变时重审。"
            },
            "gap_refs": [],
            "reason": "当前架构 Gap 建立了该决策区域新的稳定边界。",
            "evidence": [
              "arckit/spec/agentic-software-development/arcorbit-work-management.md",
              "arckit/interaction/automation-workspace/interaction.md",
              "arckit/tech/arcorbit/realtime-synchronization-solution.md"
            ]
          },
          {
            "area_ref": "data_and_state",
            "observed_revision": 19,
            "set_decision": {
              "status": "settled",
              "statement": "Canonical development state、Workshop 远端真相、ArcOrbit Task Projection、Automation execution、Chat session/thread 和 Case 绑定收据继续保持既有所有权边界。ArcOrbit Desktop Store 额外拥有全局 `platform.ui_preferences.work_inspector_width_px`，用于保存 360–640px 的 Work Inspector 用户选择宽度；它不属于 Workshop Task、按项目 workspace preference、Work Sync 投影或 Automation。缺失或非法值使用 440，窗口临时约束产生的有效宽度不写回保存值，任务、项目、Workset、登录身份切换和应用重启均不重置该偏好。 同名 skill 兜底覆盖的旧内容由 ArcOrbit userData 下仅当前用户可访问的 recovery area 和原子 recovery manifest 持有；全部已选项完成备份后才开始替换，失败时目标、catalog、loader 与 relation 回滚，未选内容不变。 ArcOrbit 项目状态分为 Project Catalog、Workspace Control 与 Task Readiness 三层；前两层的用户事实在覆盖安装时保留，任务、标签、游标、同步健康和 freshness 是可派生状态，必须由新版确定性重建。",
              "reason": "当前 Case 将覆盖安装自愈和跨页面项目一致性确立为稳定架构边界。",
              "evidence": [
                "arckit/tech/arcorbit/platform-composition-solution.md",
                "runtime/arcorbit/src/desktop/desktop-store.mjs",
                "arckit/spec/arcorbit-distribution.md",
                "arckit/interaction/setup-readiness/interaction.md",
                "arckit/interaction/setup-readiness/default.html",
                "arckit/tech/arcorbit/installer-supply-chain.md",
                "arckit/spec/agentic-software-development/arcorbit-work-management.md",
                "arckit/interaction/automation-workspace/interaction.md",
                "arckit/tech/arcorbit/realtime-synchronization-solution.md"
              ],
              "confidence": "high",
              "resume_condition": "当 Desktop Store schema、持久控制事实或派生状态重建边界改变时重审。"
            },
            "gap_refs": [
              "GAP-cross-record-audit"
            ],
            "reason": "当前架构 Gap 建立了该决策区域新的稳定边界。",
            "evidence": [
              "arckit/spec/agentic-software-development/arcorbit-work-management.md",
              "arckit/interaction/automation-workspace/interaction.md",
              "arckit/tech/arcorbit/realtime-synchronization-solution.md"
            ]
          },
          {
            "area_ref": "technical_foundation",
            "observed_revision": 41,
            "set_decision": {
              "status": "settled",
              "statement": "Arckit 与 ArcOrbit 的既有 ledger、Electron、Runtime、Platform Coordinator、Work Sync、Chat、Setup Readiness 和 trusted case-control 技术边界保持不变。Work Inspector 偏好继续由 Desktop Store、typed preload action 和 Renderer 持有。应用冷启动的 coordinated Setup Readiness 由 main process fresh-read Desktop Store 中全部本地 Product Workspace roots；新增或改变本地关联及用户主动 retry 使用相同 aggregate check，显式空 roots 清除既有 project plan 并执行 global-only。Renderer 项目/Workset 筛选不触发检查，解除关联跳过检查。SkillProvisioningManager.assertReady(projectRoot) 只读取内存 snapshot，要求 ready 且 project root 位于最近成功检查的 plan.project_roots；Chat/Automation task start 不调用 provider 或扫描 skills。SkillProvisioningManager 的 plan、drift、同名冲突诊断和 backup-and-overwrite-selected 事务边界保持不变。Feedback V1 恢复通过受控 update 同时写入 ignored=false、feedback_state=pending 和 status=analyzing；V2 恢复由 Platform Adapter、Coordinator、main IPC、preload 和 Renderer 的 restoreFeedbackV2 typed action 链调用固定 provider route，并只在服务端确认后刷新投影。 新版启动必须执行有代际的 rehydration：规范化旧 Store、刷新可访问 Catalog、按需求集合协调对账并在 dispatch 前只开放健康项目。任务与标签独立确认；重建期间新增需求必须触发后续一轮，不能被进行中的 reconcile 吞掉。",
              "reason": "当前 Case 将覆盖安装自愈和跨页面项目一致性确立为稳定架构边界。",
              "evidence": [
                "arckit/tech/arcorbit/platform-composition-solution.md",
                "runtime/arcorbit/desktop/renderer/renderer.js",
                "runtime/arcorbit/src/workshop-platform-adapter.mjs",
                "runtime/arcorbit/src/platform-coordinator.mjs",
                "runtime/arcorbit/desktop/main.mjs",
                "runtime/arcorbit/desktop/preload.cjs",
                "arckit/spec/agentic-software-development/arcorbit-work-management.md",
                "arckit/interaction/automation-workspace/interaction.md",
                "arckit/tech/arcorbit/realtime-synchronization-solution.md"
              ],
              "confidence": "high",
              "resume_condition": "当 Work Sync reconcile、Store migration、任务/标签信任或 dispatch gate 改变时重审。"
            },
            "gap_refs": [
              "GAP-runtime-resilience-and-adapters"
            ],
            "reason": "当前架构 Gap 建立了该决策区域新的稳定边界。",
            "evidence": [
              "arckit/spec/agentic-software-development/arcorbit-work-management.md",
              "arckit/interaction/automation-workspace/interaction.md",
              "arckit/tech/arcorbit/realtime-synchronization-solution.md"
            ]
          },
          {
            "area_ref": "quality_and_validation",
            "observed_revision": 20,
            "set_decision": {
              "status": "settled",
              "statement": "既有协议、Runtime、realtime、Work、Chat、Automation、安全、Setup、同名冲突恢复和跨平台窗口验证义务保持不变。Setup Readiness 还必须证明：冷启动检查全部关联本地 roots；新增或改绑后再次检查全部 roots；项目集、具体项目和 Workset 纯查看切换不调用 Setup；解除关联不产生检查；用户主动 retry 保持 fresh-check；task-start skill preflight 不读取文件或调用 provider，只接受 ready 且覆盖当前规范化 root 的缓存状态；未验证 root fail closed。Feedback 忽略恢复还必须覆盖 V1 metadata 一致写入、V2 专用 route 与 typed IPC、ignored → pending 服务端确认、权限/对象/冲突/网络失败，以及失败时状态、筛选、选择和滚动位置不被乐观改写。完整 ArcOrbit 套件与需要 GUI 权限的 Electron 回归必须分别记录可重复结果。 覆盖安装自愈必须以历史 Store fixtures、Catalog 成功而项目详情失败、标签独立失败和 reconcile 期间 Workset 变化的行为级回归证明，并验证用户控制事实保留、项目持续可见和仅受影响 lane 失败关闭。",
              "reason": "当前 Case 将覆盖安装自愈和跨页面项目一致性确立为稳定架构边界。",
              "evidence": [
                "arckit/tech/arcorbit/platform-composition-solution.md",
                "arckit/spec/agentic-software-development/arcorbit-platform-capabilities.md",
                "Verification: 62 focused baseline tests passed",
                "arckit/spec/agentic-software-development/arcorbit-work-management.md",
                "arckit/interaction/automation-workspace/interaction.md",
                "arckit/tech/arcorbit/realtime-synchronization-solution.md"
              ],
              "confidence": "high",
              "resume_condition": "当支持的 Store 版本、同步错误模型或重建竞态边界改变时重审。"
            },
            "gap_refs": [
              "GAP-agent-scenario-evaluation",
              "GAP-cross-record-audit"
            ],
            "reason": "当前架构 Gap 建立了该决策区域新的稳定边界。",
            "evidence": [
              "arckit/spec/agentic-software-development/arcorbit-work-management.md",
              "arckit/interaction/automation-workspace/interaction.md",
              "arckit/tech/arcorbit/realtime-synchronization-solution.md"
            ]
          },
          {
            "area_ref": "observability_and_operation",
            "observed_revision": 10,
            "set_decision": {
              "status": "settled",
              "statement": "Runtime persists lifecycle, activity, messages and timing outside the target project, supports restart reconciliation and exposes opaque Run refs. It separately projects ledger candidate catalogs, Agent selection traces, accepted round closeouts and post-commit fresh-read receipts, and also presents ordinary todo state separately from acceptance-feedback queue counts, item status, current Run/Case, progress, evidence and blocking responsibility alongside one active execution. Work Sync exposes per-project realtime health, resumable/legacy mode, modern cursor progress, local projection revision and latest refresh time; it reports reconnecting, degraded, compatible and recovered transitions. Work Sync owns 15-minute reconciliation, lifecycle-triggered current-state recovery and the visible immediate-sync action, has no 60-second disconnected fallback, and records that synchronization never releases a human gate. Automation only references the local task-state and minimal sync-health projections needed for execution recovery. Automation 投影 active_executions 集合、全局占用/上限及每条 lane 的 Run、Gate、恢复和同步摘要；重启逐 lane 对账，暂停、继续、取消和介入均以 execution_id 定向。 Runtime 以 case_binding_required 明确投影无绑定终态，以 completed_case_reuse receipt 投影成功复用，live 与 detached recovery 使用相同收据事实。 Work Sync 必须分别投影 Catalog freshness 与逐项目 Task Readiness，并为任务、标签、连接和游标错误提供项目级健康；Automation 显示降级项目但只冻结其候选，其他健康 lane 继续。",
              "reason": "当前 Case 将覆盖安装自愈和跨页面项目一致性确立为稳定架构边界。",
              "evidence": [
                "runtime/arcorbit/test/runtime-case-control.test.mjs",
                "runtime/arcorbit/test/state-driven-runner.test.mjs",
                "runtime/arcorbit/test/automation-coordinator.test.mjs",
                "Verification: 124 focused Runtime tests passed, 2026-08-26",
                "arckit/spec/agentic-software-development/runtime-automation-workspace.md",
                "arckit/interaction/automation-workspace/interaction.md",
                "arckit/interaction/automation-workspace/runtime-recovery.html",
                "arckit/tech/arcorbit/desktop-execution-solution.md",
                "arckit/spec/agentic-software-development/arcorbit-work-management.md",
                "arckit/tech/arcorbit/realtime-synchronization-solution.md"
              ],
              "confidence": "high",
              "resume_condition": "当项目级健康投影、错误归属或恢复触发改变时重审。"
            },
            "gap_refs": [
              "GAP-runtime-resilience-and-adapters"
            ],
            "reason": "当前架构 Gap 建立了该决策区域新的稳定边界。",
            "evidence": [
              "arckit/spec/agentic-software-development/arcorbit-work-management.md",
              "arckit/interaction/automation-workspace/interaction.md",
              "arckit/tech/arcorbit/realtime-synchronization-solution.md"
            ]
          }
        ],
        "software_invariant_changes": [],
        "project_gap_changes": [],
        "selection_context_change": null,
        "evidence": [
          "arckit/spec/agentic-software-development/arcorbit-work-management.md",
          "arckit/interaction/automation-workspace/interaction.md",
          "arckit/interaction/automation-workspace/default.html",
          "arckit/tech/arcorbit/realtime-synchronization-solution.md"
        ]
      },
      "invariant_assessment": {
        "project_revision": 304,
        "judgments": [
          {
            "invariant_ref": "product-expectations-remain-recoverable",
            "disposition": "upheld",
            "reason": "跨页面可见性、升级恢复和降级资格规则已进入稳定产品规格。",
            "fact_refs": [
              "FACT-20260827-002-001",
              "FACT-20260827-002-002",
              "FACT-20260827-002-003"
            ],
            "evidence": [
              "arckit/spec/agentic-software-development/arcorbit-work-management.md"
            ],
            "gap_refs": []
          },
          {
            "invariant_ref": "interaction-expectations-remain-recoverable",
            "disposition": "upheld",
            "reason": "覆盖安装和项目同步降级状态已在交互源与线框中恢复。",
            "fact_refs": [
              "FACT-20260827-002-003"
            ],
            "evidence": [
              "arckit/interaction/automation-workspace/interaction.md",
              "arckit/interaction/automation-workspace/default.html"
            ],
            "gap_refs": []
          },
          {
            "invariant_ref": "visual-language-remains-consistent",
            "disposition": "not_relevant",
            "reason": "本轮复用既有灰度线框组件，没有改变视觉 token 或品牌语言。",
            "fact_refs": [],
            "evidence": [],
            "gap_refs": []
          },
          {
            "invariant_ref": "technical-decisions-remain-explainable",
            "disposition": "upheld",
            "reason": "三层所有权、重建顺序、部分失败和协调对账均有可追踪技术契约。",
            "fact_refs": [
              "FACT-20260827-002-003"
            ],
            "evidence": [
              "arckit/tech/arcorbit/realtime-synchronization-solution.md"
            ],
            "gap_refs": []
          },
          {
            "invariant_ref": "accepted-facts-are-realized",
            "disposition": "threatened",
            "reason": "架构事实已接受，生产实现仍待下一 Gap 完成。",
            "fact_refs": [
              "FACT-20260827-002-001",
              "FACT-20260827-002-002",
              "FACT-20260827-002-003"
            ],
            "evidence": [
              "arckit/spec/agentic-software-development/arcorbit-work-management.md",
              "arckit/tech/arcorbit/realtime-synchronization-solution.md"
            ],
            "gap_refs": [
              "GAP-20260827-002-002"
            ]
          },
          {
            "invariant_ref": "material-risks-have-credible-evidence",
            "disposition": "threatened",
            "reason": "历史 Store、部分失败和 reconcile 竞态仍需生产行为级证据。",
            "fact_refs": [
              "FACT-20260827-002-001",
              "FACT-20260827-002-003"
            ],
            "evidence": [
              "Verification: isolated project-detail failure reproduced catalog-visible and Automation-absent projections"
            ],
            "gap_refs": [
              "GAP-20260827-002-002"
            ]
          }
        ]
      },
      "evidence": [
        "arckit/spec/agentic-software-development/arcorbit-work-management.md",
        "arckit/spec/INDEX.md",
        "arckit/interaction/automation-workspace/interaction.md",
        "arckit/interaction/automation-workspace/default.html",
        "arckit/interaction/INDEX.md",
        "arckit/tech/arcorbit/realtime-synchronization-solution.md",
        "arckit/tech/INDEX.md",
        "Verification: git diff --check passed"
      ],
      "runtime_result_ref": "",
      "occurred_at": "2026-08-27T04:06:19.941Z"
    },
    {
      "round": 2,
      "transition_schema_version": "arckit-case-transition/v8",
      "goal": "实现并验证覆盖安装后项目可见性与执行就绪自动恢复。",
      "outcome": "completed",
      "gap_selection": {
        "mode": "candidate",
        "basis": "架构 Gap 已关闭，当前实现 Gap 是让覆盖安装无需人工修复的唯一 ready Case obligation。",
        "snapshot_token": "019707e9ac56ced7dfcb6084c6c59618597ed21836ac0869a36e13299f67338f",
        "selected_ref": "case-gap:CASE-20260827-002:GAP-20260827-002-002",
        "comparison_summary": "四个 Project Gap 均需独立 Case；当前实现 Gap 直接兑现本 Case 的用户结果。",
        "fresh_discovery_summary": "实现和验证未发现需要新增的独立产品 Gap；已知风险均由本轮行为级证据控制。",
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
            "reason": "需要独立场景评估 Case。"
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
            "reason": "需要独立 Runtime 韧性 Case。"
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
            "reason": "需要真实权限项目与独立 Case。"
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
            "reason": "需要独立协议审计 Case。"
          },
          {
            "ref": "case-gap:CASE-20260827-002:GAP-20260827-002-002",
            "source": "persisted",
            "eligibility": "ready",
            "disposition": "selected",
            "priority_basis": {
              "blocking": "覆盖安装新版后自动恢复正常使用的生产能力尚未兑现。",
              "urgency": "high",
              "risk": "high",
              "user_impact": "high"
            },
            "reason": "直接实现 v16 Store rehydration、Catalog 项目投影、独立任务/标签确认和 generation reconcile。"
          }
        ]
      },
      "selected_gap": {
        "id": "GAP-20260827-002-002",
        "responsibility": "agent",
        "goal": "实现覆盖安装自愈的 Project Catalog / Task Readiness 分层、Store 重建、协调对账、任务/标签独立确认、Automation Catalog 项目行与行为级回归。",
        "reason": "稳定架构已经确立，但当前生产实现仍使用 trusted task records 过滤 Automation 项目并可能吞掉并发 reconcile 需求。",
        "derived_from": [
          "FACT-20260827-002-001",
          "FACT-20260827-002-002",
          "FACT-20260827-002-003"
        ],
        "blocked_by": [],
        "priority_basis": {
          "blocking": "覆盖安装新版后自动恢复正常使用的生产能力尚未兑现。",
          "uncertainty": "",
          "risk": "high",
          "user_impact": "high",
          "urgency": "high"
        },
        "evidence_required": [
          "旧 Store 覆盖安装后控制事实保留且派生状态自动重建",
          "Catalog 已确认而任务失败时 Automation 项目仍可见且仅该项目冻结",
          "标签失败不废弃已确认任务",
          "reconcile 期间新增需求得到后续对账",
          "相关行为级测试与 ArcOrbit check 通过"
        ]
      },
      "planned_transition": {
        "goal": "实现并验证覆盖安装后项目可见性与执行就绪自动恢复。",
        "expected_state_change": "v16 Store 迁移保留控制事实并撤销旧派生信任；Automation 从 Catalog 显示项目；当前任务确认后恢复执行，部分失败按项目关闭。"
      },
      "accepted_state_delta": {
        "resolved_gap": {
          "id": "GAP-20260827-002-002",
          "status": "resolved",
          "outcome": "覆盖安装自愈架构已在 Desktop Store、Work Sync、Automation Coordinator、Renderer 与行为级测试中实现。",
          "reason": "v15 及更旧 store 统一进入 v16 rehydration，Catalog 项目不再由 trusted task records 过滤，任务/标签独立确认且并发 reconcile demand 不会丢失。",
          "evidence": [
            "runtime/arcorbit/src/desktop/desktop-store.mjs",
            "runtime/arcorbit/src/work-sync-coordinator.mjs",
            "runtime/arcorbit/src/automation-coordinator.mjs",
            "runtime/arcorbit/desktop/renderer/renderer.js",
            "runtime/arcorbit/test/desktop-store.test.mjs",
            "runtime/arcorbit/test/work-sync-coordinator.test.mjs",
            "runtime/arcorbit/test/automation-coordinator.test.mjs"
          ]
        },
        "facts_added": [
          {
            "id": "FACT-20260827-002-004",
            "revision": 1,
            "status": "accepted",
            "statement": "ArcOrbit Desktop Store v16、Work Sync 和 Automation 已实现覆盖安装确定性 rehydration：旧 store 保留 Workset、binding、participation、session 与执行控制，撤销旧 Task Readiness 信任；Automation 从 Catalog 构造项目行，任务与标签独立确认，in-flight reconcile 后续 demand 由 generation loop 继续处理。",
            "basis": "生产源码与行为级测试共同验证 v15 覆盖安装、首次任务失败、标签失败和 Workset 竞态路径。",
            "evidence": [
              "runtime/arcorbit/src/desktop/desktop-store.mjs",
              "runtime/arcorbit/src/work-sync-coordinator.mjs",
              "runtime/arcorbit/src/automation-coordinator.mjs",
              "runtime/arcorbit/desktop/renderer/renderer.js",
              "runtime/arcorbit/test/desktop-store.test.mjs",
              "runtime/arcorbit/test/work-sync-coordinator.test.mjs",
              "runtime/arcorbit/test/automation-coordinator.test.mjs",
              "Verification: 15 Work Sync tests passed",
              "Verification: 88 focused Store, Work Sync and Automation tests passed"
            ]
          }
        ],
        "facts_superseded": [],
        "impacts_added": [],
        "impacts_updated": [
          {
            "id": "IMPACT-20260827-002-005",
            "fact_id": "FACT-20260827-002-004",
            "fact_revision": 1,
            "target": {
              "kind": "software_decision",
              "ref": "quality_and_validation",
              "revision": 21
            },
            "effect": "upheld",
            "reason": "历史 Store、项目任务失败、标签失败和 demand generation 均有行为级回归。",
            "gap_ids": [],
            "evidence": [
              "runtime/arcorbit/test/desktop-store.test.mjs",
              "runtime/arcorbit/test/work-sync-coordinator.test.mjs",
              "runtime/arcorbit/test/automation-coordinator.test.mjs",
              "Verification: 88 focused tests passed"
            ]
          },
          {
            "id": "IMPACT-20260827-002-006",
            "fact_id": "FACT-20260827-002-004",
            "fact_revision": 1,
            "target": {
              "kind": "software_invariant",
              "ref": "accepted-facts-are-realized",
              "revision": null
            },
            "effect": "upheld",
            "reason": "统一 Catalog、覆盖安装重建和项目级失败边界均已由生产代码兑现。",
            "gap_ids": [],
            "evidence": [
              "runtime/arcorbit/src/desktop/desktop-store.mjs",
              "runtime/arcorbit/src/work-sync-coordinator.mjs",
              "runtime/arcorbit/src/automation-coordinator.mjs",
              "runtime/arcorbit/desktop/renderer/renderer.js"
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
        "project_revision": 305,
        "judgments": [
          {
            "invariant_ref": "product-expectations-remain-recoverable",
            "disposition": "upheld",
            "reason": "统一 Catalog、覆盖安装无手工修复和项目级降级规则仍由稳定规格与实现共同支持。",
            "fact_refs": [
              "FACT-20260827-002-002",
              "FACT-20260827-002-003",
              "FACT-20260827-002-004"
            ],
            "evidence": [
              "arckit/spec/agentic-software-development/arcorbit-work-management.md",
              "runtime/arcorbit/src/work-sync-coordinator.mjs"
            ],
            "gap_refs": []
          },
          {
            "invariant_ref": "interaction-expectations-remain-recoverable",
            "disposition": "upheld",
            "reason": "项目绑定行保持可见并显示恢复中、异常或标签降级，交互源和 Renderer 一致。",
            "fact_refs": [
              "FACT-20260827-002-003",
              "FACT-20260827-002-004"
            ],
            "evidence": [
              "arckit/interaction/automation-workspace/interaction.md",
              "arckit/interaction/automation-workspace/default.html",
              "runtime/arcorbit/desktop/renderer/renderer.js"
            ],
            "gap_refs": []
          },
          {
            "invariant_ref": "visual-language-remains-consistent",
            "disposition": "not_relevant",
            "reason": "生产改动复用既有 binding row、状态文本和灰度组件，没有改变视觉 token。",
            "fact_refs": [],
            "evidence": [],
            "gap_refs": []
          },
          {
            "invariant_ref": "technical-decisions-remain-explainable",
            "disposition": "upheld",
            "reason": "v16 marker、信任撤销、Catalog 投影、任务/标签分离和 generation loop 可从技术文档直接追踪到源码。",
            "fact_refs": [
              "FACT-20260827-002-003",
              "FACT-20260827-002-004"
            ],
            "evidence": [
              "arckit/tech/arcorbit/realtime-synchronization-solution.md",
              "runtime/arcorbit/src/desktop/desktop-store.mjs",
              "runtime/arcorbit/src/work-sync-coordinator.mjs"
            ],
            "gap_refs": []
          },
          {
            "invariant_ref": "accepted-facts-are-realized",
            "disposition": "upheld",
            "reason": "本 Case 的跨页面项目可见性和覆盖安装自愈事实已经完整实现。",
            "fact_refs": [
              "FACT-20260827-002-001",
              "FACT-20260827-002-002",
              "FACT-20260827-002-003",
              "FACT-20260827-002-004"
            ],
            "evidence": [
              "runtime/arcorbit/src/desktop/desktop-store.mjs",
              "runtime/arcorbit/src/work-sync-coordinator.mjs",
              "runtime/arcorbit/src/automation-coordinator.mjs",
              "runtime/arcorbit/desktop/renderer/renderer.js"
            ],
            "gap_refs": []
          },
          {
            "invariant_ref": "material-risks-have-credible-evidence",
            "disposition": "upheld",
            "reason": "升级迁移、首次任务失败、标签失败、并发 demand 和 Automation 可见性均有聚焦回归；沙箱内不能启动的两个 Electron wrapper 已用相同 fixture 直接执行并返回满足断言的结果。",
            "fact_refs": [
              "FACT-20260827-002-001",
              "FACT-20260827-002-004"
            ],
            "evidence": [
              "runtime/arcorbit/test/desktop-store.test.mjs",
              "runtime/arcorbit/test/work-sync-coordinator.test.mjs",
              "runtime/arcorbit/test/automation-coordinator.test.mjs",
              "Verification: 15 Work Sync tests passed",
              "Verification: 88 focused tests passed",
              "Verification: Electron experience-realization and task-replacement fixtures executed successfully"
            ],
            "gap_refs": []
          }
        ]
      },
      "evidence": [
        "runtime/arcorbit/src/desktop/desktop-store.mjs",
        "runtime/arcorbit/src/work-sync-coordinator.mjs",
        "runtime/arcorbit/src/automation-coordinator.mjs",
        "runtime/arcorbit/desktop/renderer/renderer.js",
        "runtime/arcorbit/test/desktop-store.test.mjs",
        "runtime/arcorbit/test/work-sync-coordinator.test.mjs",
        "runtime/arcorbit/test/automation-coordinator.test.mjs",
        "Verification: syntax check passed",
        "Verification: 15 Work Sync tests passed",
        "Verification: 88 focused tests passed",
        "Verification: ArcOrbit suite 537 tests; 514 passed, 21 conditional skips, two sandbox Electron wrappers replaced by successful direct fixture runs",
        "Verification: git diff --check passed",
        "Verification: ledger protocol probe compatible"
      ],
      "runtime_result_ref": "",
      "occurred_at": "2026-08-27T04:19:13.057Z"
    },
    {
      "round": 3,
      "transition_schema_version": "arckit-case-transition/v8",
      "goal": "Complete the five-dimension terminal review for the upgrade-safe project availability architecture.",
      "outcome": "completed",
      "gap_selection": {
        "mode": "candidate",
        "basis": "All ordinary Case gaps and impacts are closed; the derived Completion Review is the only ready in-scope Case obligation.",
        "snapshot_token": "29f8ff4c92f48781a20d56f83908f2006489e6ec16e77fb8cb8b4fc7bb14b47a",
        "selected_ref": "case-gap:CASE-20260827-002:CASE-20260827-002:completion-review:1",
        "comparison_summary": "The four Project gaps require separate Cases and do not outrank this Case terminal gate; no fresh implementation gap is supported by the completed evidence.",
        "fresh_discovery_summary": "Fresh review of the implementation, documentation, migration path, and test evidence found no additional ordinary gap.",
        "considered": [
          {
            "ref": "project-gap:GAP-agent-scenario-evaluation",
            "source": "persisted",
            "eligibility": "case_required",
            "disposition": "deferred",
            "priority_basis": {
              "risk": "high",
              "uncertainty": "high"
            },
            "reason": "A separate project-level evaluation Case is required and is outside this Case goal."
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
            "reason": "This broader Runtime resilience work requires a separate Case."
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
            "reason": "Real permission-bearing validation requires a separate Case and environment."
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
            "reason": "Cross-record protocol acceptance is separate from the ArcOrbit upgrade architecture."
          },
          {
            "ref": "case-gap:CASE-20260827-002:CASE-20260827-002:completion-review:1",
            "source": "persisted",
            "eligibility": "ready",
            "disposition": "selected",
            "priority_basis": {
              "blocking": "high",
              "risk": "high",
              "user_impact": "high"
            },
            "reason": "It is the required terminal gate after this Case implementation and impacts closed."
          }
        ]
      },
      "selected_gap": {
        "id": "CASE-20260827-002:completion-review:1",
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
        "goal": "Complete the five-dimension terminal review for the upgrade-safe project availability architecture.",
        "expected_state_change": "Record a clean review against content revision 2 and allow the trusted ledger to close the Case."
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
            "Implementation correctness: Catalog identity, task readiness, bindings, and participation are separated across desktop-store, work-sync, and automation coordinators.",
            "Problem resolution: v15-to-v16 overwrite migration preserves user controls, invalidates derived trust, and schedules deterministic rehydration without logout, cache clearing, or project re-entry.",
            "Verification credibility: 15 Work Sync tests and 88 focused tests passed; direct Electron fixtures satisfied the two wrapper assertion sets that the sandbox could not launch.",
            "Regression risk: task failure, tag-only failure, Catalog-only visibility, preserved bindings/participation, and in-flight demand generation each have behavior-level coverage.",
            "Minimality: the implementation reuses the existing local store, projection, binding row, and sync coordinator; it adds no parallel repair subsystem or user-facing maintenance workflow."
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
        "project_revision": 305,
        "judgments": [
          {
            "invariant_ref": "product-expectations-remain-recoverable",
            "disposition": "upheld",
            "reason": "The stable product contract defines one Catalog and overwrite-install self-healing, and production code implements that boundary.",
            "fact_refs": [
              "FACT-20260827-002-002",
              "FACT-20260827-002-003",
              "FACT-20260827-002-004"
            ],
            "evidence": [
              "arckit/spec/agentic-software-development/arcorbit-work-management.md",
              "runtime/arcorbit/src/work-sync-coordinator.mjs"
            ],
            "gap_refs": []
          },
          {
            "invariant_ref": "interaction-expectations-remain-recoverable",
            "disposition": "upheld",
            "reason": "Automation keeps Catalog projects visible and exposes restoring, task-error, and tag-degraded readiness states.",
            "fact_refs": [
              "FACT-20260827-002-003",
              "FACT-20260827-002-004"
            ],
            "evidence": [
              "arckit/interaction/automation-workspace/interaction.md",
              "arckit/interaction/automation-workspace/default.html",
              "runtime/arcorbit/desktop/renderer/renderer.js"
            ],
            "gap_refs": []
          },
          {
            "invariant_ref": "visual-language-remains-consistent",
            "disposition": "not_relevant",
            "reason": "The implementation reuses the existing binding-row visual system and changes no visual tokens.",
            "fact_refs": [],
            "evidence": [],
            "gap_refs": []
          },
          {
            "invariant_ref": "technical-decisions-remain-explainable",
            "disposition": "upheld",
            "reason": "The v16 migration marker, Catalog projection, section-level degradation, and generation reconciliation map directly from technical contract to code.",
            "fact_refs": [
              "FACT-20260827-002-003",
              "FACT-20260827-002-004"
            ],
            "evidence": [
              "arckit/tech/arcorbit/realtime-synchronization-solution.md",
              "runtime/arcorbit/src/desktop/desktop-store.mjs",
              "runtime/arcorbit/src/work-sync-coordinator.mjs"
            ],
            "gap_refs": []
          },
          {
            "invariant_ref": "accepted-facts-are-realized",
            "disposition": "upheld",
            "reason": "All accepted Case facts are realized by the migration, projections, binding readiness, and renderer behavior.",
            "fact_refs": [
              "FACT-20260827-002-001",
              "FACT-20260827-002-002",
              "FACT-20260827-002-003",
              "FACT-20260827-002-004"
            ],
            "evidence": [
              "runtime/arcorbit/src/desktop/desktop-store.mjs",
              "runtime/arcorbit/src/work-sync-coordinator.mjs",
              "runtime/arcorbit/src/automation-coordinator.mjs",
              "runtime/arcorbit/desktop/renderer/renderer.js"
            ],
            "gap_refs": []
          },
          {
            "invariant_ref": "material-risks-have-credible-evidence",
            "disposition": "upheld",
            "reason": "Migration, partial failure, first-load failure, retained controls, and concurrent demand risks have repeatable behavioral tests.",
            "fact_refs": [
              "FACT-20260827-002-001",
              "FACT-20260827-002-004"
            ],
            "evidence": [
              "runtime/arcorbit/test/desktop-store.test.mjs",
              "runtime/arcorbit/test/work-sync-coordinator.test.mjs",
              "runtime/arcorbit/test/automation-coordinator.test.mjs",
              "Verification: 15 Work Sync tests passed",
              "Verification: 88 focused tests passed"
            ],
            "gap_refs": []
          }
        ]
      },
      "evidence": [
        "Fresh ledger snapshot token 29f8ff4c92f48781a20d56f83908f2006489e6ec16e77fb8cb8b4fc7bb14b47a",
        "git diff --check passed",
        "Production files passed node --check",
        "Focused behavioral suites passed and Electron fixtures returned assertion-satisfying results."
      ],
      "runtime_result_ref": "direct-agent:CASE-20260827-002:completion-review",
      "occurred_at": "2026-08-27T04:21:53.274Z"
    }
  ],
  "case_resolution": {
    "status": "resolved",
    "stage": "resolved",
    "satisfied": [
      "GAP-20260827-002-001",
      "GAP-20260827-002-002"
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
    "updated_at": "2026-08-27T04:21:53.274Z"
  }
}
```

## Round Notes

- Case history is canonical in Structured Record.rounds; keep prose notes exceptional.
