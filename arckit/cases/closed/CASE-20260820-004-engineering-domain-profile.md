# 让 Engineering 成为可管理和替换的 Domain Profile

Case: CASE-20260820-004
Status: closed
Artifact Type: mixed
Selected Gap: none
Updated: 2026-08-20T09:09:31.283Z

## User Intent

修正 ArcOrbit Engineering 页面，使其明确展示 State Schema 与 Domain Skills 的编辑、组合、替换和应用管理能力，并解释不同团队或行业如何在相同 Loop Kernel 和产品生命周期上运行不同 Domain Profile。

## Structured Record

```json
{
  "schema_version": "development-case-record/v5",
  "id": "CASE-20260820-004",
  "title": "让 Engineering 成为可管理和替换的 Domain Profile",
  "status": "closed",
  "artifact_type": "mixed",
  "created_at": "2026-08-20T08:58:15.126Z",
  "updated_at": "2026-08-20T09:09:31.283Z",
  "user_intent": "修正 ArcOrbit Engineering 页面，使其明确展示 State Schema 与 Domain Skills 的编辑、组合、替换和应用管理能力，并解释不同团队或行业如何在相同 Loop Kernel 和产品生命周期上运行不同 Domain Profile。",
  "expected_outcome": "稳定产品与交互事实不再把 Engineering 限定为只读解释页；Desktop 提供可信的 Profile library、State/Skills 编辑映射、变更预览和应用示意，同时不接入真实持久化或执行。",
  "project_state_ref": "arckit/project/state.record.json",
  "current_round": {
    "goal": "",
    "selected_gap": null
  },
  "facts": [
    {
      "id": "FACT-001",
      "revision": 1,
      "status": "accepted",
      "statement": "Engineering 页面需要体现对 Domain Profile 的编辑管理能力：团队可以替换 State 定义与领域 Skills，使相同 Loop 模型和产品流程推进不同团队乃至不同行业的工作。",
      "basis": "当前操作者明确指出现有页面缺少编辑管理能力并说明替换目标。",
      "evidence": [
        "Current operator input, 2026-08-20: 没有体现出编辑管理能力；预期通过替换这些内容，以相同 Loop 模型和产品流程推进不同团队或行业的工作"
      ]
    },
    {
      "id": "FACT-002",
      "revision": 1,
      "status": "accepted",
      "statement": "ArcOrbit Engineering 当前展示一套可管理 Domain Profile 工作台：Software Engineering 是激活项，Campaign Operations、Research Program 与 Customer Success 展示跨团队/行业模板；State Model、Capability Mapping 与 Lifecycle Mapping 可见编辑入口和变更预览，Review & Apply 明确为无真实写入示意；共享产品生命周期与 Loop Kernel 保持不变。",
      "basis": "稳定产品/交互事实、实际 Renderer、自动化测试和 1440×900 浏览器渲染一致支持。",
      "evidence": [
        "arckit/spec/agentic-software-development/arcorbit-planned-workspaces.md",
        "arckit/spec/agentic-software-development/arcorbit-platform-capabilities.md",
        "arckit/interaction/engineering-profile/interaction.md",
        "arckit/interaction/engineering-profile/default.html",
        "arckit/interaction/platform-workspace/interaction.md",
        "runtime/arcorbit/desktop/renderer/index.html",
        "runtime/arcorbit/desktop/renderer/styles.css",
        "runtime/arcorbit/test/desktop-renderer.test.mjs",
        "Targeted desktop renderer tests: 14 passed, 0 failed",
        "ArcOrbit full test suite: 226 passed, 0 failed, 2 skipped",
        "Browser rendering verification at 1440x900: passed",
        "git diff --check: passed"
      ]
    }
  ],
  "state_impacts": [
    {
      "id": "IMPACT-001",
      "fact_id": "FACT-001",
      "fact_revision": 1,
      "target": {
        "kind": "software_decision",
        "ref": "product_capabilities",
        "revision": 15
      },
      "effect": "upheld",
      "reason": "产品决定与规格已把 Engineering 定义为可管理 Domain Profile 展示，并保留无真实持久化边界。",
      "gap_ids": [],
      "evidence": [
        "arckit/spec/agentic-software-development/arcorbit-planned-workspaces.md"
      ]
    },
    {
      "id": "IMPACT-002",
      "fact_id": "FACT-001",
      "fact_revision": 1,
      "target": {
        "kind": "software_decision",
        "ref": "experience_and_interaction",
        "revision": 25
      },
      "effect": "upheld",
      "reason": "交互源、线框与实际页面已覆盖选择、复制、编辑、比较和 Apply 确认主路径。",
      "gap_ids": [],
      "evidence": [
        "arckit/interaction/engineering-profile/interaction.md",
        "arckit/interaction/engineering-profile/default.html",
        "runtime/arcorbit/desktop/renderer/index.html"
      ]
    }
  ],
  "gaps": [
    {
      "id": "GAP-ENGINEERING-PROFILE-MANAGEMENT",
      "status": "resolved",
      "goal": "使 Engineering 的稳定规格、交互模型和实际 Desktop 共同展示 Domain Profile 的选择、编辑、替换、影响预览与应用管理能力，并清楚区分可替换的 State/Skills 与保持稳定的 Loop Kernel、产品生命周期。",
      "reason": "当前只读解释页面无法用于团队对齐“通过替换领域内容复用同一推进模式”的完整产品计划。",
      "derived_from": [
        "FACT-001",
        "IMPACT-001",
        "IMPACT-002"
      ],
      "blocked_by": [],
      "priority_basis": {
        "blocking": "直接阻塞当前团队计划对齐目标。",
        "uncertainty": "用户已明确管理对象和复用边界。",
        "risk": "容易把 Domain Profile 误解成只读文档或 Skill 安装页。",
        "user_impact": "决定不同团队和行业能否理解产品扩展方式。"
      },
      "responsibility": "agent",
      "evidence_required": [
        "稳定规格明确 Profile 管理与替换语义",
        "交互源覆盖选择、编辑、预览和应用路径",
        "实际 Desktop 可见管理控件、跨行业示例和稳定内核边界",
        "自动化与浏览器渲染验证"
      ],
      "resolution": {
        "id": "GAP-ENGINEERING-PROFILE-MANAGEMENT",
        "status": "resolved",
        "outcome": "Engineering 已成为 Domain Profile 管理能力示意：用户可看见 Profile Library、草稿版本、State Model 与 Capability Mapping 编辑、Lifecycle Mapping、跨行业比较、兼容性/作用范围预览和 Review & Apply；页面同时固定展示不随 Profile 变化的产品生命周期与 Loop Kernel。",
        "reason": "稳定规格、交互源、线框、实际 Renderer、自动化测试和真实桌面尺寸渲染共同满足全部证据要求，且没有新增保存、安装、迁移或应用线路。",
        "evidence": [
          "arckit/spec/agentic-software-development/arcorbit-planned-workspaces.md",
          "arckit/spec/agentic-software-development/arcorbit-platform-capabilities.md",
          "arckit/interaction/engineering-profile/interaction.md",
          "arckit/interaction/engineering-profile/default.html",
          "arckit/interaction/platform-workspace/interaction.md",
          "runtime/arcorbit/desktop/renderer/index.html",
          "runtime/arcorbit/desktop/renderer/styles.css",
          "runtime/arcorbit/test/desktop-renderer.test.mjs",
          "Targeted desktop renderer tests: 14 passed, 0 failed",
          "ArcOrbit full test suite: 226 passed, 0 failed, 2 skipped",
          "Browser rendering verification at 1440x900: passed",
          "git diff --check: passed"
        ],
        "occurred_at": "2026-08-20T09:08:25.165Z"
      }
    }
  ],
  "content_revision": 1,
  "completion_review": {
    "status": "clean",
    "policy": {
      "initial_max_cycles": 2,
      "source": "using-arckit default completion review policy",
      "snapshotted_at": "2026-08-20T08:58:15.126Z"
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
          "arckit/spec/agentic-software-development/arcorbit-planned-workspaces.md",
          "arckit/interaction/engineering-profile/interaction.md",
          "arckit/interaction/engineering-profile/default.html",
          "runtime/arcorbit/desktop/renderer/index.html",
          "runtime/arcorbit/desktop/renderer/styles.css",
          "runtime/arcorbit/test/desktop-renderer.test.mjs",
          "Targeted desktop renderer tests: 14 passed, 0 failed",
          "ArcOrbit full test suite: 226 passed, 0 failed, 2 skipped",
          "Browser rendering verification at 1440x900: passed",
          "git diff --check: passed"
        ],
        "occurred_at": "2026-08-20T09:09:31.283Z"
      }
    ],
    "evidence": [
      "arckit/spec/agentic-software-development/arcorbit-planned-workspaces.md",
      "arckit/interaction/engineering-profile/interaction.md",
      "arckit/interaction/engineering-profile/default.html",
      "runtime/arcorbit/desktop/renderer/index.html",
      "runtime/arcorbit/desktop/renderer/styles.css",
      "runtime/arcorbit/test/desktop-renderer.test.mjs",
      "Targeted desktop renderer tests: 14 passed, 0 failed",
      "ArcOrbit full test suite: 226 passed, 0 failed, 2 skipped",
      "Browser rendering verification at 1440x900: passed",
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
      "goal": "使 Engineering 的稳定规格、交互模型和实际 Desktop 共同展示 Domain Profile 的选择、编辑、替换、影响预览与应用管理能力，并清楚区分可替换的 State/Skills 与保持稳定的 Loop Kernel、产品生命周期。",
      "outcome": "completed",
      "gap_selection": {
        "mode": "candidate",
        "basis": "最新用户事实直接否定只读 Profile 边界；当前 Case 唯一 ready Gap 是让产品事实、交互与 Desktop 共同体现可管理和可替换的领域配置。",
        "snapshot_token": "1e2c30ba21fd51c6b31c629747886b6902d663544fee4259f066fb5afe047ab3",
        "selected_ref": "case-gap:CASE-20260820-004:GAP-ENGINEERING-PROFILE-MANAGEMENT",
        "comparison_summary": "选择当前 Case 的管理能力 Gap；四个长期 Project Gap 均需独立 Case，且不改变本轮 Profile 管理示意的验收。",
        "fresh_discovery_summary": "实现与渲染检查未发现更高优先级的新工作；Profile 管理模型、无真实写入边界及跨行业示例均可由当前事实直接确定。",
        "considered": [
          {
            "ref": "project-gap:GAP-agent-scenario-evaluation",
            "source": "persisted",
            "eligibility": "case_required",
            "disposition": "excluded",
            "priority_basis": {
              "uncertainty": "high",
              "risk": "high"
            },
            "reason": "该长期 Project Gap 需要独立 Case，不属于当前 Profile 管理纠正。"
          },
          {
            "ref": "project-gap:GAP-runtime-resilience-and-adapters",
            "source": "persisted",
            "eligibility": "case_required",
            "disposition": "excluded",
            "priority_basis": {
              "risk": "high",
              "urgency": "medium"
            },
            "reason": "该长期 Project Gap 需要独立 Case，不属于当前 Profile 管理纠正。"
          },
          {
            "ref": "project-gap:GAP-security-real-project-validation",
            "source": "persisted",
            "eligibility": "case_required",
            "disposition": "excluded",
            "priority_basis": {
              "risk": "high",
              "urgency": "medium"
            },
            "reason": "该长期 Project Gap 需要独立 Case，不属于当前 Profile 管理纠正。"
          },
          {
            "ref": "project-gap:GAP-cross-record-audit",
            "source": "persisted",
            "eligibility": "case_required",
            "disposition": "excluded",
            "priority_basis": {
              "risk": "high",
              "urgency": "high"
            },
            "reason": "该长期 Project Gap 需要独立 Case，不属于当前 Profile 管理纠正。"
          },
          {
            "ref": "case-gap:CASE-20260820-004:GAP-ENGINEERING-PROFILE-MANAGEMENT",
            "source": "persisted",
            "eligibility": "ready",
            "disposition": "selected",
            "priority_basis": {
              "blocking": "直接阻塞当前团队计划对齐目标。",
              "uncertainty": "用户已明确管理对象和复用边界。",
              "risk": "容易把 Domain Profile 误解成只读文档或 Skill 安装页。",
              "user_impact": "决定不同团队和行业能否理解产品扩展方式。"
            },
            "reason": "它直接阻塞操作者使用该页面对齐跨团队与跨行业产品计划。"
          }
        ]
      },
      "selected_gap": {
        "id": "GAP-ENGINEERING-PROFILE-MANAGEMENT",
        "responsibility": "agent",
        "goal": "使 Engineering 的稳定规格、交互模型和实际 Desktop 共同展示 Domain Profile 的选择、编辑、替换、影响预览与应用管理能力，并清楚区分可替换的 State/Skills 与保持稳定的 Loop Kernel、产品生命周期。",
        "reason": "当前只读解释页面无法用于团队对齐“通过替换领域内容复用同一推进模式”的完整产品计划。",
        "derived_from": [
          "FACT-001",
          "IMPACT-001",
          "IMPACT-002"
        ],
        "blocked_by": [],
        "priority_basis": {
          "blocking": "直接阻塞当前团队计划对齐目标。",
          "uncertainty": "用户已明确管理对象和复用边界。",
          "risk": "容易把 Domain Profile 误解成只读文档或 Skill 安装页。",
          "user_impact": "决定不同团队和行业能否理解产品扩展方式。"
        },
        "evidence_required": [
          "稳定规格明确 Profile 管理与替换语义",
          "交互源覆盖选择、编辑、预览和应用路径",
          "实际 Desktop 可见管理控件、跨行业示例和稳定内核边界",
          "自动化与浏览器渲染验证"
        ]
      },
      "planned_transition": {
        "goal": "使 Engineering 的稳定规格、交互模型和实际 Desktop 共同展示 Domain Profile 的选择、编辑、替换、影响预览与应用管理能力，并清楚区分可替换的 State/Skills 与保持稳定的 Loop Kernel、产品生命周期。",
        "expected_state_change": "产品与交互事实改为可管理 Domain Profile；Desktop 展示 Library、State/Capability/Lifecycle 编辑、跨行业变更预览和 Apply 确认，同时保持无真实写入。"
      },
      "accepted_state_delta": {
        "resolved_gap": {
          "id": "GAP-ENGINEERING-PROFILE-MANAGEMENT",
          "status": "resolved",
          "outcome": "Engineering 已成为 Domain Profile 管理能力示意：用户可看见 Profile Library、草稿版本、State Model 与 Capability Mapping 编辑、Lifecycle Mapping、跨行业比较、兼容性/作用范围预览和 Review & Apply；页面同时固定展示不随 Profile 变化的产品生命周期与 Loop Kernel。",
          "reason": "稳定规格、交互源、线框、实际 Renderer、自动化测试和真实桌面尺寸渲染共同满足全部证据要求，且没有新增保存、安装、迁移或应用线路。",
          "evidence": [
            "arckit/spec/agentic-software-development/arcorbit-planned-workspaces.md",
            "arckit/spec/agentic-software-development/arcorbit-platform-capabilities.md",
            "arckit/interaction/engineering-profile/interaction.md",
            "arckit/interaction/engineering-profile/default.html",
            "arckit/interaction/platform-workspace/interaction.md",
            "runtime/arcorbit/desktop/renderer/index.html",
            "runtime/arcorbit/desktop/renderer/styles.css",
            "runtime/arcorbit/test/desktop-renderer.test.mjs",
            "Targeted desktop renderer tests: 14 passed, 0 failed",
            "ArcOrbit full test suite: 226 passed, 0 failed, 2 skipped",
            "Browser rendering verification at 1440x900: passed",
            "git diff --check: passed"
          ]
        },
        "facts_added": [
          {
            "id": "FACT-002",
            "revision": 1,
            "status": "accepted",
            "statement": "ArcOrbit Engineering 当前展示一套可管理 Domain Profile 工作台：Software Engineering 是激活项，Campaign Operations、Research Program 与 Customer Success 展示跨团队/行业模板；State Model、Capability Mapping 与 Lifecycle Mapping 可见编辑入口和变更预览，Review & Apply 明确为无真实写入示意；共享产品生命周期与 Loop Kernel 保持不变。",
            "basis": "稳定产品/交互事实、实际 Renderer、自动化测试和 1440×900 浏览器渲染一致支持。",
            "evidence": [
              "arckit/spec/agentic-software-development/arcorbit-planned-workspaces.md",
              "arckit/spec/agentic-software-development/arcorbit-platform-capabilities.md",
              "arckit/interaction/engineering-profile/interaction.md",
              "arckit/interaction/engineering-profile/default.html",
              "arckit/interaction/platform-workspace/interaction.md",
              "runtime/arcorbit/desktop/renderer/index.html",
              "runtime/arcorbit/desktop/renderer/styles.css",
              "runtime/arcorbit/test/desktop-renderer.test.mjs",
              "Targeted desktop renderer tests: 14 passed, 0 failed",
              "ArcOrbit full test suite: 226 passed, 0 failed, 2 skipped",
              "Browser rendering verification at 1440x900: passed",
              "git diff --check: passed"
            ]
          }
        ],
        "facts_superseded": [],
        "impacts_added": [],
        "impacts_updated": [
          {
            "id": "IMPACT-001",
            "fact_id": "FACT-001",
            "fact_revision": 1,
            "target": {
              "kind": "software_decision",
              "ref": "product_capabilities",
              "revision": 15
            },
            "effect": "upheld",
            "reason": "产品决定与规格已把 Engineering 定义为可管理 Domain Profile 展示，并保留无真实持久化边界。",
            "gap_ids": [],
            "evidence": [
              "arckit/spec/agentic-software-development/arcorbit-planned-workspaces.md"
            ]
          },
          {
            "id": "IMPACT-002",
            "fact_id": "FACT-001",
            "fact_revision": 1,
            "target": {
              "kind": "software_decision",
              "ref": "experience_and_interaction",
              "revision": 25
            },
            "effect": "upheld",
            "reason": "交互源、线框与实际页面已覆盖选择、复制、编辑、比较和 Apply 确认主路径。",
            "gap_ids": [],
            "evidence": [
              "arckit/interaction/engineering-profile/interaction.md",
              "arckit/interaction/engineering-profile/default.html",
              "runtime/arcorbit/desktop/renderer/index.html"
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
            "observed_revision": 14,
            "set_decision": {
              "status": "settled",
              "statement": "ArcOrbit preserves Setup Readiness, supervised one-thread-per-todo automation, trusted ledger transitions, intervention/recovery and acceptance feedback while providing Desktop composition of Workshop organizations, organization and project membership, personal and organization projects, seven-state todos, ordinary user feedback, local Product Workspaces and a persistent multi-product Workset. Workset Feedback remains the developer processing workspace and ArcOrbit retains its independent Product 107 feedback center. ArcOrbit also presents planning-only Chat, Idea, Release, Operations and Engineering workspaces. Engineering demonstrates management of versioned Domain Profiles: a profile combines Project/Case domain State definitions, expected/actual/diagnosis capability mappings and lifecycle-stage interpretations; users can browse templates, create or duplicate drafts, edit mappings, compare changes and review an apply plan so different teams or industries can reuse the same Loop Kernel and product lifecycle. Entry skills remain part of the shared Loop Kernel and are excluded from profiles. No new backend, persistence, skill installation, profile application, Runtime, monitoring, market-platform or registry integration is claimed.",
              "reason": "The operator clarified that Engineering must demonstrate editable and replaceable domain configuration, not only explain a read-only Software Engineering Profile.",
              "evidence": [
                "Current operator input, 2026-08-20",
                "arckit/spec/agentic-software-development/arcorbit-planned-workspaces.md"
              ],
              "confidence": "high",
              "resume_condition": "Revisit when Domain Profile persistence, validation, migration, installation or real apply contracts are established."
            },
            "gap_refs": [],
            "reason": "可管理且可替换的 Domain Profile 已成为稳定产品能力预期。",
            "evidence": [
              "arckit/spec/agentic-software-development/arcorbit-planned-workspaces.md"
            ]
          },
          {
            "area_ref": "experience_and_interaction",
            "observed_revision": 24,
            "set_decision": {
              "status": "settled",
              "statement": "ArcOrbit uses three primary navigation groups: Personal contains Today and Chat; Product Lifecycle contains Idea, Work, Automation, Release, Operations and Feedback; Organization contains Organization and Engineering. English UI consistently uses Release and Operations, while Chinese descriptions use 发布 and 运营. Existing Workset, Work, Automation, Feedback, Organization, account, product-feedback and execution semantics remain authoritative. The five new pages are independent planning presentations built from current project facts. Engineering is a Domain Profile management preview with a Profile Library, draft metadata, State Model editor, Capability Mapping, Lifecycle Mapping, cross-industry change preview and Review & Apply confirmation. Profile changes replace domain State semantics and skills together while the shared Loop Kernel and Idea-to-Feedback lifecycle remain stable; all controls are non-persistent demonstrations.",
              "reason": "The operator requires visible editing and management affordances that explain how the same operating model advances different teams and industries.",
              "evidence": [
                "Current operator input, 2026-08-20",
                "arckit/interaction/platform-workspace/interaction.md",
                "arckit/interaction/engineering-profile/interaction.md"
              ],
              "confidence": "high",
              "resume_condition": "Revisit when the management controls gain real persistence, validation, migration or application behavior."
            },
            "gap_refs": [],
            "reason": "Profile 管理主路径、编辑对象、变更预览与示意边界已形成可恢复交互事实。",
            "evidence": [
              "arckit/interaction/platform-workspace/interaction.md",
              "arckit/interaction/engineering-profile/interaction.md",
              "arckit/interaction/engineering-profile/default.html"
            ]
          }
        ],
        "software_invariant_changes": [],
        "project_gap_changes": [],
        "selection_context_change": {
          "current_focus": "以可管理 Domain Profile 替换 State Model、领域能力和阶段解释，让相同 Loop Kernel 与产品生命周期适配不同团队和行业。"
        },
        "evidence": [
          "arckit/spec/agentic-software-development/arcorbit-planned-workspaces.md",
          "arckit/interaction/engineering-profile/interaction.md",
          "runtime/arcorbit/desktop/renderer/index.html"
        ]
      },
      "invariant_assessment": {
        "project_revision": 147,
        "judgments": [
          {
            "invariant_ref": "product-expectations-remain-recoverable",
            "disposition": "upheld",
            "reason": "可管理 Profile 的对象、动作、跨行业复用和无真实写入边界已进入权威规格。",
            "fact_refs": [
              "FACT-001",
              "FACT-002"
            ],
            "evidence": [
              "arckit/spec/agentic-software-development/arcorbit-planned-workspaces.md",
              "arckit/spec/INDEX.md"
            ],
            "gap_refs": []
          },
          {
            "invariant_ref": "interaction-expectations-remain-recoverable",
            "disposition": "upheld",
            "reason": "选择、复制、编辑、比较、Review & Apply 和异常保护路径已进入交互源及三状态线框。",
            "fact_refs": [
              "FACT-001",
              "FACT-002"
            ],
            "evidence": [
              "arckit/interaction/engineering-profile/interaction.md",
              "arckit/interaction/engineering-profile/default.html",
              "arckit/interaction/INDEX.md"
            ],
            "gap_refs": []
          },
          {
            "invariant_ref": "visual-language-remains-consistent",
            "disposition": "upheld",
            "reason": "管理工作台复用既有深色侧栏、亮色画布、指标、三栏数据密度、状态标签和操作色层级。",
            "fact_refs": [
              "FACT-002"
            ],
            "evidence": [
              "arckit/visual/_library/brief.md",
              "runtime/arcorbit/desktop/renderer/styles.css",
              "Browser rendering verification at 1440x900: passed"
            ],
            "gap_refs": []
          },
          {
            "invariant_ref": "technical-decisions-remain-explainable",
            "disposition": "upheld",
            "reason": "实现限于静态 Renderer 和样式/断言，没有新增 profile persistence、IPC、backend、schema 或 skill 安装线路。",
            "fact_refs": [
              "FACT-002"
            ],
            "evidence": [
              "runtime/arcorbit/desktop/renderer/index.html",
              "runtime/arcorbit/test/desktop-renderer.test.mjs"
            ],
            "gap_refs": []
          },
          {
            "invariant_ref": "accepted-facts-are-realized",
            "disposition": "upheld",
            "reason": "用户要求的编辑管理、成组替换和稳定 Loop/产品流程已经在实际页面可见。",
            "fact_refs": [
              "FACT-001",
              "FACT-002"
            ],
            "evidence": [
              "runtime/arcorbit/desktop/renderer/index.html",
              "runtime/arcorbit/desktop/renderer/styles.css",
              "Browser rendering verification at 1440x900: passed"
            ],
            "gap_refs": []
          },
          {
            "invariant_ref": "material-risks-have-credible-evidence",
            "disposition": "upheld",
            "reason": "只读误导、entry/domain 混淆、伪造真实写入、跨行业意图不清和布局溢出风险均有规格边界、代码断言、全量测试及双位置渲染检查。",
            "fact_refs": [
              "FACT-001",
              "FACT-002"
            ],
            "evidence": [
              "runtime/arcorbit/test/desktop-renderer.test.mjs",
              "ArcOrbit full test suite: 226 passed, 0 failed, 2 skipped",
              "Browser rendering verification at 1440x900: passed",
              "git diff --check: passed"
            ],
            "gap_refs": []
          }
        ]
      },
      "evidence": [
        "arckit/spec/agentic-software-development/arcorbit-planned-workspaces.md",
        "arckit/spec/agentic-software-development/arcorbit-platform-capabilities.md",
        "arckit/interaction/engineering-profile/interaction.md",
        "arckit/interaction/engineering-profile/default.html",
        "arckit/interaction/platform-workspace/interaction.md",
        "runtime/arcorbit/desktop/renderer/index.html",
        "runtime/arcorbit/desktop/renderer/styles.css",
        "runtime/arcorbit/test/desktop-renderer.test.mjs",
        "Targeted desktop renderer tests: 14 passed, 0 failed",
        "ArcOrbit full test suite: 226 passed, 0 failed, 2 skipped",
        "Browser rendering verification at 1440x900: passed",
        "git diff --check: passed"
      ],
      "runtime_result_ref": "",
      "occurred_at": "2026-08-20T09:08:25.165Z"
    },
    {
      "round": 2,
      "transition_schema_version": "arckit-case-transition/v8",
      "goal": "Review the completed implementation for correctness, real problem resolution, verification credibility, regression risk, and minimality.",
      "outcome": "completed",
      "gap_selection": {
        "mode": "candidate",
        "basis": "普通 Gap 与 impacts 已闭合，当前唯一 ready 候选是对 content revision 1 做独立五维 completion review。",
        "snapshot_token": "d50032271ad38634eb447bea33b4296620b1bbf7962db863c7d8ed22448cfc4b",
        "selected_ref": "case-gap:CASE-20260820-004:CASE-20260820-004:completion-review:1",
        "comparison_summary": "选择 completion review；四个长期 Project Gap 需要独立 Case，不属于本次实现审查。",
        "fresh_discovery_summary": "差异、测试、双位置桌面渲染与稳定事实复核未发现新的错误、遗漏或过度实现。",
        "considered": [
          {
            "ref": "project-gap:GAP-agent-scenario-evaluation",
            "source": "persisted",
            "eligibility": "case_required",
            "disposition": "excluded",
            "priority_basis": {
              "uncertainty": "high",
              "risk": "high"
            },
            "reason": "该长期 Project Gap 需要独立 Case，不属于本次完成审查。"
          },
          {
            "ref": "project-gap:GAP-runtime-resilience-and-adapters",
            "source": "persisted",
            "eligibility": "case_required",
            "disposition": "excluded",
            "priority_basis": {
              "risk": "high",
              "urgency": "medium"
            },
            "reason": "该长期 Project Gap 需要独立 Case，不属于本次完成审查。"
          },
          {
            "ref": "project-gap:GAP-security-real-project-validation",
            "source": "persisted",
            "eligibility": "case_required",
            "disposition": "excluded",
            "priority_basis": {
              "risk": "high",
              "urgency": "medium"
            },
            "reason": "该长期 Project Gap 需要独立 Case，不属于本次完成审查。"
          },
          {
            "ref": "project-gap:GAP-cross-record-audit",
            "source": "persisted",
            "eligibility": "case_required",
            "disposition": "excluded",
            "priority_basis": {
              "risk": "high",
              "urgency": "high"
            },
            "reason": "该长期 Project Gap 需要独立 Case，不属于本次完成审查。"
          },
          {
            "ref": "case-gap:CASE-20260820-004:CASE-20260820-004:completion-review:1",
            "source": "persisted",
            "eligibility": "ready",
            "disposition": "selected",
            "priority_basis": {
              "blocking": "high",
              "uncertainty": "low",
              "risk": "high",
              "user_impact": "high"
            },
            "reason": "普通义务已闭合，当前实现与事实证据足以完成五维审查。"
          }
        ]
      },
      "selected_gap": {
        "id": "CASE-20260820-004:completion-review:1",
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
        "goal": "Review the completed implementation for correctness, real problem resolution, verification credibility, regression risk, and minimality.",
        "expected_state_change": "对 content revision 1 完成 clean review 并关闭 Case。"
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
            "arckit/spec/agentic-software-development/arcorbit-planned-workspaces.md",
            "arckit/interaction/engineering-profile/interaction.md",
            "arckit/interaction/engineering-profile/default.html",
            "runtime/arcorbit/desktop/renderer/index.html",
            "runtime/arcorbit/desktop/renderer/styles.css",
            "runtime/arcorbit/test/desktop-renderer.test.mjs",
            "Targeted desktop renderer tests: 14 passed, 0 failed",
            "ArcOrbit full test suite: 226 passed, 0 failed, 2 skipped",
            "Browser rendering verification at 1440x900: passed",
            "git diff --check: passed"
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
        "project_revision": 148,
        "judgments": [
          {
            "invariant_ref": "product-expectations-remain-recoverable",
            "disposition": "upheld",
            "reason": "审查确认可管理 Profile 与跨行业复用目标已完整进入稳定规格。",
            "fact_refs": [
              "FACT-001",
              "FACT-002"
            ],
            "evidence": [
              "arckit/spec/agentic-software-development/arcorbit-planned-workspaces.md"
            ],
            "gap_refs": []
          },
          {
            "invariant_ref": "interaction-expectations-remain-recoverable",
            "disposition": "upheld",
            "reason": "审查确认 Library、编辑、比较、Apply 和草稿保护路径均在交互源与线框可恢复。",
            "fact_refs": [
              "FACT-001",
              "FACT-002"
            ],
            "evidence": [
              "arckit/interaction/engineering-profile/interaction.md",
              "arckit/interaction/engineering-profile/default.html"
            ],
            "gap_refs": []
          },
          {
            "invariant_ref": "visual-language-remains-consistent",
            "disposition": "upheld",
            "reason": "审查确认管理密度、操作层级和滚动后的 Stable operating model 均符合现有视觉策略。",
            "fact_refs": [
              "FACT-001",
              "FACT-002"
            ],
            "evidence": [
              "arckit/visual/_library/brief.md",
              "runtime/arcorbit/desktop/renderer/styles.css",
              "Browser rendering verification at 1440x900: passed"
            ],
            "gap_refs": []
          },
          {
            "invariant_ref": "technical-decisions-remain-explainable",
            "disposition": "upheld",
            "reason": "审查确认只有静态 HTML/CSS 与测试变化，没有真实 profile API、IPC、持久化或安装线路。",
            "fact_refs": [
              "FACT-001",
              "FACT-002"
            ],
            "evidence": [
              "runtime/arcorbit/desktop/renderer/index.html",
              "runtime/arcorbit/test/desktop-renderer.test.mjs"
            ],
            "gap_refs": []
          },
          {
            "invariant_ref": "accepted-facts-are-realized",
            "disposition": "upheld",
            "reason": "审查确认编辑管理能力、成组替换、跨行业模板、固定 Loop Kernel 和生命周期均在实际页面可见。",
            "fact_refs": [
              "FACT-001",
              "FACT-002"
            ],
            "evidence": [
              "runtime/arcorbit/desktop/renderer/index.html",
              "Browser rendering verification at 1440x900: passed"
            ],
            "gap_refs": []
          },
          {
            "invariant_ref": "material-risks-have-credible-evidence",
            "disposition": "upheld",
            "reason": "审查未发现只读旧文案、旧边界、伪写入、入口回归、测试失败、格式问题或视觉溢出。",
            "fact_refs": [
              "FACT-001",
              "FACT-002"
            ],
            "evidence": [
              "runtime/arcorbit/test/desktop-renderer.test.mjs",
              "ArcOrbit full test suite: 226 passed, 0 failed, 2 skipped",
              "git diff --check: passed"
            ],
            "gap_refs": []
          }
        ]
      },
      "evidence": [
        "arckit/spec/agentic-software-development/arcorbit-planned-workspaces.md",
        "arckit/interaction/engineering-profile/interaction.md",
        "arckit/interaction/engineering-profile/default.html",
        "runtime/arcorbit/desktop/renderer/index.html",
        "runtime/arcorbit/desktop/renderer/styles.css",
        "runtime/arcorbit/test/desktop-renderer.test.mjs",
        "Targeted desktop renderer tests: 14 passed, 0 failed",
        "ArcOrbit full test suite: 226 passed, 0 failed, 2 skipped",
        "Browser rendering verification at 1440x900: passed",
        "git diff --check: passed"
      ],
      "runtime_result_ref": "",
      "occurred_at": "2026-08-20T09:09:31.283Z"
    }
  ],
  "case_resolution": {
    "status": "resolved",
    "stage": "resolved",
    "satisfied": [
      "GAP-ENGINEERING-PROFILE-MANAGEMENT"
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
    "updated_at": "2026-08-20T09:09:31.283Z"
  }
}
```

## Round Notes

- Case history is canonical in Structured Record.rounds; keep prose notes exceptional.
