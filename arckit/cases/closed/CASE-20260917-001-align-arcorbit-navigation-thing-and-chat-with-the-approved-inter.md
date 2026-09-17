# Align ArcOrbit navigation Thing and Chat with the approved interaction prototypes

Case: CASE-20260917-001
Status: closed
Artifact Type: mixed
Selected Gap: none
Updated: 2026-09-17T05:47:13.762Z

## User Intent

Apply approved grouped navigation, independent Thing, centered Chat and existing account capabilities to production ArcOrbit.

## Structured Record

```json
{
  "schema_version": "development-case-record/v5",
  "id": "CASE-20260917-001",
  "title": "Align ArcOrbit navigation Thing and Chat with the approved interaction prototypes",
  "status": "closed",
  "artifact_type": "mixed",
  "created_at": "2026-09-17T05:31:03.102Z",
  "updated_at": "2026-09-17T05:47:13.762Z",
  "user_intent": "Apply approved grouped navigation, independent Thing, centered Chat and existing account capabilities to production ArcOrbit.",
  "expected_outcome": "Production navigation and Thing/Chat match approved prototypes with real coordinators and passing regression evidence.",
  "project_state_ref": "arckit/project/state.record.json",
  "current_round": {
    "goal": "",
    "selected_gap": null
  },
  "facts": [
    {
      "id": "FACT-20260917-001-001",
      "revision": 1,
      "status": "accepted",
      "statement": "User approved PERSONAL/PRODUCT/PRODUCT LIFECYCLE/ORGANIZATION navigation, Chat and Thing peer entries, no workbench project sidebar, centered Chat with right session list, and complete existing account settings.",
      "basis": "Current user request to implement the revised prototypes and preceding explicit design choices.",
      "evidence": [
        "arckit/interaction/project-workbench/interaction.md",
        "arckit/interaction/chat-workspace/interaction.md",
        "arckit/interaction/project-workbench/account-capabilities.md"
      ]
    },
    {
      "id": "FACT-20260917-001-002",
      "revision": 1,
      "status": "accepted",
      "statement": "Production grouped navigation restores eleven direct business entries plus Thing, preserves real account settings, defaults to Automation, and removes project-scoped workbench navigation.",
      "basis": "Latest user-approved prototype and focused production verification.",
      "evidence": [
        "arckit/cases/evidence/CASE-20260917-001/navigation-electron.json"
      ]
    },
    {
      "id": "FACT-20260917-001-003",
      "revision": 1,
      "status": "accepted",
      "statement": "Production Chat centers real conversation rendering and places sessions on the right; responsive navigation, model settings, drafts and streaming remain on existing coordinators.",
      "basis": "Latest user-approved prototype and focused production verification.",
      "evidence": [
        "arckit/cases/evidence/CASE-20260917-001/chat-electron.json"
      ]
    },
    {
      "id": "FACT-20260917-001-004",
      "revision": 1,
      "status": "accepted",
      "statement": "Electron assertions now exit nonzero; documentation matches cross-project Thing filters.",
      "basis": "Observed explicit failure and success exits plus updated product specification.",
      "evidence": [
        "arckit/cases/evidence/CASE-20260917-001/acceptance-artifact-repair.md"
      ]
    }
  ],
  "state_impacts": [],
  "gaps": [
    {
      "id": "GAP-20260917-001-001",
      "status": "resolved",
      "goal": "Production grouped navigation and independent Thing preserve all existing page and account capabilities.",
      "reason": "Current shell hides business pages behind a legacy menu and workbench owns project navigation.",
      "derived_from": [
        "FACT-20260917-001-001"
      ],
      "blocked_by": [],
      "priority_basis": {
        "user_impact": "high",
        "scope": "explicit approved prototypes"
      },
      "responsibility": "agent",
      "evidence_required": [
        "Production renderer behavior and Electron verification matching the approved prototype."
      ],
      "resolution": {
        "id": "GAP-20260917-001-001",
        "status": "resolved",
        "outcome": "Production grouped navigation restores eleven direct business entries plus Thing, preserves real account settings, defaults to Automation, and removes project-scoped workbench navigation.",
        "reason": "Approved prototype implemented and production renderer exercised in Electron.",
        "evidence": [
          "arckit/cases/evidence/CASE-20260917-001/navigation-electron.json"
        ],
        "occurred_at": "2026-09-17T05:35:22.315Z"
      }
    },
    {
      "id": "GAP-20260917-001-002",
      "status": "resolved",
      "goal": "Production Chat centers the conversation and places grouped sessions on the right with usable narrow layouts.",
      "reason": "Current production Chat still uses a left session sidebar.",
      "derived_from": [
        "FACT-20260917-001-001"
      ],
      "blocked_by": [],
      "priority_basis": {
        "user_impact": "high",
        "scope": "explicit approved prototypes"
      },
      "responsibility": "agent",
      "evidence_required": [
        "Production renderer behavior and Electron verification matching the approved prototype."
      ],
      "resolution": {
        "id": "GAP-20260917-001-002",
        "status": "resolved",
        "outcome": "Production Chat centers real conversation rendering and places sessions on the right; responsive navigation, model settings, drafts and streaming remain on existing coordinators.",
        "reason": "Approved prototype implemented and production renderer exercised in Electron.",
        "evidence": [
          "arckit/cases/evidence/CASE-20260917-001/chat-electron.json"
        ],
        "occurred_at": "2026-09-17T05:43:27.991Z"
      }
    },
    {
      "id": "CASE-20260917-001:review-finding:acceptance-artifacts",
      "status": "resolved",
      "goal": "Resolve review finding: Make acceptance artifacts reliable: Chat Electron failures must exit nonzero and Thing filter documentation must match the removed project scope.",
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
        "runtime/arcorbit/test/fixtures/chat-layout-electron.mjs",
        "arckit/spec/agentic-software-development/arcorbit-project-workbench.md",
        "arckit/cases/evidence/CASE-20260917-001/review.md"
      ],
      "resolution": {
        "id": "CASE-20260917-001:review-finding:acceptance-artifacts",
        "status": "resolved",
        "outcome": "Electron assertions now exit nonzero; documentation matches cross-project Thing filters.",
        "reason": "Forced failure returned 1; normal renderer checks returned 0.",
        "evidence": [
          "arckit/cases/evidence/CASE-20260917-001/acceptance-artifact-repair.md"
        ],
        "occurred_at": "2026-09-17T05:46:30.008Z"
      }
    }
  ],
  "content_revision": 3,
  "completion_review": {
    "status": "clean",
    "policy": {
      "initial_max_cycles": 3,
      "source": "Direct Agent bounded review policy for this authorized renderer implementation",
      "snapshotted_at": "2026-09-17T05:31:03.102Z"
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
          "implementation_correctness": "clean",
          "problem_resolution": "clean",
          "verification_credibility": "findings",
          "regression_risk": "clean",
          "minimality": "clean"
        },
        "finding_ids": [
          "acceptance-artifacts"
        ],
        "evidence": [
          "arckit/cases/evidence/CASE-20260917-001/review.md"
        ],
        "occurred_at": "2026-09-17T05:45:00.536Z"
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
          "arckit/cases/evidence/CASE-20260917-001/review-final.md"
        ],
        "occurred_at": "2026-09-17T05:47:13.762Z"
      }
    ],
    "evidence": [
      "arckit/cases/evidence/CASE-20260917-001/review.md",
      "arckit/cases/evidence/CASE-20260917-001/review-final.md"
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
      "goal": "Production grouped navigation and independent Thing preserve all existing page and account capabilities.",
      "outcome": "completed",
      "gap_selection": {
        "mode": "candidate",
        "basis": "Latest authorized UI implementation; choose one bounded accepted gap.",
        "snapshot_token": "073578bab161eb6af2fa09c86ae89cb6e2afa48602e240d01b04b0b7bd58ae09",
        "selected_ref": "case-gap:CASE-20260917-001:GAP-20260917-001-001",
        "comparison_summary": "Navigation first, then Chat, then completion review; unrelated delivery and governance obligations remain deferred.",
        "fresh_discovery_summary": "No independent new work beyond approved navigation and Chat surfaces.",
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
            "reason": "Independent obligation outside this round."
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
            "reason": "Independent obligation outside this round."
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
            "reason": "Independent obligation outside this round."
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
            "reason": "Independent obligation outside this round."
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
            "reason": "Independent obligation outside this round."
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
            "reason": "Independent obligation outside this round."
          },
          {
            "ref": "case-gap:CASE-20260917-001:GAP-20260917-001-001",
            "source": "persisted",
            "eligibility": "ready",
            "disposition": "selected",
            "priority_basis": {
              "blocking": "",
              "uncertainty": "",
              "risk": "",
              "user_impact": "high",
              "scope": "explicit approved prototypes"
            },
            "reason": "Current bounded result."
          },
          {
            "ref": "case-gap:CASE-20260917-001:GAP-20260917-001-002",
            "source": "persisted",
            "eligibility": "ready",
            "disposition": "deferred",
            "priority_basis": {
              "blocking": "",
              "uncertainty": "",
              "risk": "",
              "user_impact": "high",
              "scope": "explicit approved prototypes"
            },
            "reason": "Independent obligation outside this round."
          }
        ]
      },
      "selected_gap": {
        "id": "GAP-20260917-001-001",
        "responsibility": "agent",
        "goal": "Production grouped navigation and independent Thing preserve all existing page and account capabilities.",
        "reason": "Current shell hides business pages behind a legacy menu and workbench owns project navigation.",
        "derived_from": [
          "FACT-20260917-001-001"
        ],
        "blocked_by": [],
        "priority_basis": {
          "blocking": "",
          "uncertainty": "",
          "risk": "",
          "user_impact": "high",
          "scope": "explicit approved prototypes"
        },
        "evidence_required": [
          "Production renderer behavior and Electron verification matching the approved prototype."
        ]
      },
      "planned_transition": {
        "goal": "Production grouped navigation and independent Thing preserve all existing page and account capabilities.",
        "expected_state_change": "Production grouped navigation restores eleven direct business entries plus Thing, preserves real account settings, defaults to Automation, and removes project-scoped workbench navigation."
      },
      "accepted_state_delta": {
        "resolved_gap": {
          "id": "GAP-20260917-001-001",
          "status": "resolved",
          "outcome": "Production grouped navigation restores eleven direct business entries plus Thing, preserves real account settings, defaults to Automation, and removes project-scoped workbench navigation.",
          "reason": "Approved prototype implemented and production renderer exercised in Electron.",
          "evidence": [
            "arckit/cases/evidence/CASE-20260917-001/navigation-electron.json"
          ]
        },
        "facts_added": [
          {
            "id": "FACT-20260917-001-002",
            "revision": 1,
            "status": "accepted",
            "statement": "Production grouped navigation restores eleven direct business entries plus Thing, preserves real account settings, defaults to Automation, and removes project-scoped workbench navigation.",
            "basis": "Latest user-approved prototype and focused production verification.",
            "evidence": [
              "arckit/cases/evidence/CASE-20260917-001/navigation-electron.json"
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
            "area_ref": "product_intent_and_scope",
            "observed_revision": 6,
            "set_decision": {
              "status": "settled",
              "statement": "Arckit is the repository-owned development protocol and skill system; ArcOrbit is its supervised Desktop/Runtime product and is expanding into a local-project-anchored, multi-product software-development platform for people who coordinate organization, product, member, todo, AI execution, and feedback work without relying on the Todo or Feedback web clients for daily operation. Product 保持产品资料推进能力；Product/Idea 能力保持既有边界。 Release 提供真实本地终端、原生 Git、源码编辑、构建运行及复用 Chat/Idea 的场景 Agent，消费既有工作区绑定；以 arcorbit-release-workspace.md 与 release-workspace-solution.md 为准，外部渠道和监控仍依实际 adapter。 ArcOrbit 的 Thing 是与 Chat 并列的独立入口；四组主导航直接访问全部业务页面，默认进入 Automation。",
              "reason": "用户明确收窄事情台到独立页面；已批准原型与当前生产导航实现。",
              "evidence": [
                "arckit/spec/agentic-software-development/arcorbit-platform-capabilities.md",
                "arckit/pending/prototypes/arcorbit-platform-next/README.md",
                "arckit/spec/agentic-software-development/arcorbit-product-management.md",
                "arckit/spec/agentic-software-development/arcorbit-planned-workspaces.md",
                "runtime/arcorbit/src/chat-coordinator.mjs",
                "runtime/arcorbit/src/platform-coordinator.mjs",
                "arckit/spec/agentic-software-development/arcorbit-release-workspace.md",
                "arckit/tech/arcorbit/release-workspace-solution.md",
                "arckit/interaction/release-workspace/interaction.md",
                "arckit/interaction/release-workspace/default.html",
                "arckit/cases/evidence/CASE-20260915-001/verification.md",
                "arckit/cases/evidence/CASE-20260915-001/acceptance-matrix.md",
                "arckit/spec/agentic-software-development/arcorbit-project-workbench.md",
                "arckit/interaction/project-workbench/interaction.md",
                "arckit/tech/arcorbit/project-workbench-solution.md",
                "arckit/cases/evidence/CASE-20260917-001/navigation-electron.json"
              ],
              "confidence": "high",
              "resume_condition": "Revisit only if the server ownership boundary or protected ArcOrbit Runtime semantics change. 事情身份、主会话、场景所有权或新旧导航边界变化时重审。"
            },
            "gap_refs": [],
            "reason": "用户明确收窄事情台到独立页面；已批准原型与当前生产导航实现。",
            "evidence": [
              "arckit/cases/evidence/CASE-20260917-001/navigation-electron.json"
            ]
          },
          {
            "area_ref": "experience_and_interaction",
            "observed_revision": 72,
            "set_decision": {
              "status": "settled",
              "statement": "ArcOrbit 的旧业务页面保留既有交互及恢复语义。账号设置覆盖层为 Chat 与 Automation 分别提供可编辑 Model 和 Level 候选输入，Chat Composer 在输入框附近显示并调整当前会话后续消息所用 Model/Level，保存、失败恢复、thread 连续与场景隔离保持既有契约。Engineering 以“内置 Skills”明确范围，在首屏紧凑呈现场景、生效时机、内置总数、直接发现、按需使用、已停用、搜索、状态筛选和三列列表；用户在行内调整内置 Skill 使用方式并接收原位反馈。Automation 核心可见且锁定；搜索与状态可组合并一键清除；刷新或保存失败保留最近可信列表、场景和筛选；窄窗口按两列及单列降级且保持键盘焦点。用户自行安装的 Skills 不进入页面列表、计数、错误或操作，Chat 返回保留原会话与草稿。其他既有 Work Inspector、验收、Setup、Feedback、Today、项目绑定、Product/Idea 与 Release 交互契约保持不变。 ArcOrbit 各处 Agent 执行统一受设备级 settings.codex.yolo_mode 显式开关控制，缺省关闭；开启跳过审批并解除 Codex 沙箱，后续消息、新 Run 和终端接力捕获，关闭恢复场景策略；业务授权和托管权限上限保持有效。 Thing 以跨项目事情列表、中央详情与局部消息协作承载事情处理；取消全局项目列表与旧页面二级菜单。PERSONAL 下 Today、Chat、Thing 并列，保留 PRODUCT、PRODUCT LIFECYCLE、ORGANIZATION 类别；个人中心保持全部真实设置能力。",
              "reason": "用户明确收窄事情台到独立页面；已批准原型与当前生产导航实现。",
              "evidence": [
                "arckit/interaction/engineering-profile/interaction.md",
                "arckit/interaction/engineering-profile/default.html",
                "runtime/arcorbit/desktop/renderer/engineering-surface.mjs",
                "runtime/arcorbit/desktop/renderer/engineering.css",
                "runtime/arcorbit/test/engineering-surface.test.mjs",
                "runtime/arcorbit/test/fixtures/engineering-electron.mjs",
                "arckit/cases/evidence/arcorbit-yolo/contract.md",
                "arckit/cases/evidence/CASE-20260915-001/verification.md",
                "arckit/cases/evidence/CASE-20260915-001/acceptance-matrix.md",
                "arckit/spec/agentic-software-development/arcorbit-project-workbench.md",
                "arckit/interaction/project-workbench/interaction.md",
                "arckit/tech/arcorbit/project-workbench-solution.md",
                "arckit/cases/evidence/CASE-20260917-001/navigation-electron.json"
              ],
              "confidence": "high",
              "resume_condition": "当 Engineering 信息层级、筛选、场景生效时机、失败恢复、键盘/窄窗行为或非内置隔离边界改变时重审。 事情身份、主会话、场景所有权或新旧导航边界变化时重审。"
            },
            "gap_refs": [],
            "reason": "用户明确收窄事情台到独立页面；已批准原型与当前生产导航实现。",
            "evidence": [
              "arckit/cases/evidence/CASE-20260917-001/navigation-electron.json"
            ]
          },
          {
            "area_ref": "visual_language",
            "observed_revision": 6,
            "set_decision": {
              "status": "settled",
              "statement": "Visual requirements apply to the Desktop workspace and follow its durable visual specification; CLI and ledger surfaces remain text-native. ArcOrbit 主窗口保持既有单一应用标题栏和平台原生窗口控件差异。Work Inspector 使用既有中性表面、8px 间距节奏、标题层级和可见焦点表达身份动作、内容、紧凑属性、协作和验收分区；分区不只依赖单条顶边，属性在可用宽度下优先两列并在窄宽度降为单列。 新事情台沿用现有主题；200px 分类业务导航栏、325px 右列表、44px 单行、紧凑标题与四类别、局部消息覆盖。新页面窄窗允许 390px 布局，旧页面保持原窗口边界；不引入演示数据或演示文案。",
              "reason": "用户明确收窄事情台到独立页面；已批准原型与当前生产导航实现。",
              "evidence": [
                "arckit/visual/_library/brief.md",
                "arckit/interaction/task-browser/daily-work.html",
                "arckit/interaction/wireframe-style.css",
                "arckit/cases/evidence/CASE-20260915-001/verification.md",
                "arckit/cases/evidence/CASE-20260915-001/acceptance-matrix.md",
                "arckit/spec/agentic-software-development/arcorbit-project-workbench.md",
                "arckit/interaction/project-workbench/interaction.md",
                "arckit/tech/arcorbit/project-workbench-solution.md",
                "arckit/cases/evidence/CASE-20260917-001/navigation-electron.json"
              ],
              "confidence": "high",
              "resume_condition": "当平台 chrome 策略或 Work Inspector 表面、间距、焦点、属性列与分区层级改变时重审。 事情身份、主会话、场景所有权或新旧导航边界变化时重审。"
            },
            "gap_refs": [],
            "reason": "用户明确收窄事情台到独立页面；已批准原型与当前生产导航实现。",
            "evidence": [
              "arckit/cases/evidence/CASE-20260917-001/navigation-electron.json"
            ]
          }
        ],
        "software_invariant_changes": [],
        "project_gap_changes": [],
        "selection_context_change": null,
        "evidence": [
          "arckit/cases/evidence/CASE-20260917-001/navigation-electron.json"
        ]
      },
      "invariant_assessment": {
        "project_revision": 390,
        "judgments": [
          {
            "invariant_ref": "product-expectations-remain-recoverable",
            "disposition": "upheld",
            "reason": "Thing is a peer page; source capabilities and real account settings remain intact. Approved product boundaries are recorded in specifications.",
            "fact_refs": [
              "FACT-20260917-001-001"
            ],
            "evidence": [
              "arckit/cases/evidence/CASE-20260917-001/navigation-electron.json",
              "arckit/interaction/project-workbench/interaction.md",
              "arckit/interaction/chat-workspace/interaction.md"
            ],
            "gap_refs": []
          },
          {
            "invariant_ref": "interaction-expectations-remain-recoverable",
            "disposition": "upheld",
            "reason": "Both user-approved interaction documents specify navigation, conversation ownership, narrow drawers, focus and recovery. They distinguish prototype from production evidence.",
            "fact_refs": [
              "FACT-20260917-001-001"
            ],
            "evidence": [
              "arckit/cases/evidence/CASE-20260917-001/navigation-electron.json",
              "arckit/interaction/project-workbench/interaction.md",
              "arckit/interaction/chat-workspace/interaction.md"
            ],
            "gap_refs": []
          },
          {
            "invariant_ref": "visual-language-remains-consistent",
            "disposition": "undetermined",
            "reason": "Approved light tokens, grouped navigation, centered content and narrow layouts govern both pages. Renderer screenshots and geometry support the implemented scope. Thing/navigation are verified; Chat still requires layout and state-continuity implementation and evidence.",
            "fact_refs": [
              "FACT-20260917-001-001"
            ],
            "evidence": [
              "arckit/cases/evidence/CASE-20260917-001/navigation-electron.json",
              "arckit/interaction/project-workbench/interaction.md",
              "arckit/interaction/chat-workspace/interaction.md"
            ],
            "gap_refs": [
              "GAP-20260917-001-002"
            ]
          },
          {
            "invariant_ref": "technical-decisions-remain-explainable",
            "disposition": "upheld",
            "reason": "Presentation retains IPC/coordinator ownership, persistent sessions and service authority; no prototype sample or execution timer is imported into production.",
            "fact_refs": [
              "FACT-20260917-001-001"
            ],
            "evidence": [
              "arckit/cases/evidence/CASE-20260917-001/navigation-electron.json",
              "arckit/interaction/project-workbench/interaction.md",
              "arckit/interaction/chat-workspace/interaction.md"
            ],
            "gap_refs": []
          },
          {
            "invariant_ref": "accepted-facts-are-realized",
            "disposition": "undetermined",
            "reason": "Production behavior is verified against the approved page and navigation actions. Thing/navigation are verified; Chat still requires layout and state-continuity implementation and evidence.",
            "fact_refs": [
              "FACT-20260917-001-001"
            ],
            "evidence": [
              "arckit/cases/evidence/CASE-20260917-001/navigation-electron.json",
              "arckit/interaction/project-workbench/interaction.md",
              "arckit/interaction/chat-workspace/interaction.md"
            ],
            "gap_refs": [
              "GAP-20260917-001-002"
            ]
          },
          {
            "invariant_ref": "debug-causes-remain-grounded",
            "disposition": "not_relevant",
            "reason": "This is an authorized interaction change, not a claim to resolve a previously unexplained product defect.",
            "fact_refs": [],
            "evidence": [],
            "gap_refs": []
          },
          {
            "invariant_ref": "material-risks-have-credible-evidence",
            "disposition": "undetermined",
            "reason": "Navigation reachability, state continuity, content overflow and settings preservation are checked using production code and existing regression tests. Thing/navigation are verified; Chat still requires layout and state-continuity implementation and evidence.",
            "fact_refs": [
              "FACT-20260917-001-001"
            ],
            "evidence": [
              "arckit/cases/evidence/CASE-20260917-001/navigation-electron.json",
              "arckit/interaction/project-workbench/interaction.md",
              "arckit/interaction/chat-workspace/interaction.md"
            ],
            "gap_refs": [
              "GAP-20260917-001-002"
            ]
          }
        ]
      },
      "evidence": [
        "arckit/cases/evidence/CASE-20260917-001/navigation-electron.json"
      ],
      "runtime_result_ref": "",
      "occurred_at": "2026-09-17T05:35:22.315Z"
    },
    {
      "round": 2,
      "transition_schema_version": "arckit-case-transition/v8",
      "goal": "Production Chat centers the conversation and places grouped sessions on the right with usable narrow layouts.",
      "outcome": "completed",
      "gap_selection": {
        "mode": "candidate",
        "basis": "Latest authorized UI implementation; choose one bounded accepted gap.",
        "snapshot_token": "345cb6900609547e62870c985a8e1073b28eefbf334664ae58e575c84791d1d7",
        "selected_ref": "case-gap:CASE-20260917-001:GAP-20260917-001-002",
        "comparison_summary": "Navigation first, then Chat, then completion review; unrelated delivery and governance obligations remain deferred.",
        "fresh_discovery_summary": "No independent new work beyond approved navigation and Chat surfaces.",
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
            "reason": "Independent obligation outside this round."
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
            "reason": "Independent obligation outside this round."
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
            "reason": "Independent obligation outside this round."
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
            "reason": "Independent obligation outside this round."
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
            "reason": "Independent obligation outside this round."
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
            "reason": "Independent obligation outside this round."
          },
          {
            "ref": "case-gap:CASE-20260917-001:GAP-20260917-001-002",
            "source": "persisted",
            "eligibility": "ready",
            "disposition": "selected",
            "priority_basis": {
              "blocking": "",
              "uncertainty": "",
              "risk": "",
              "user_impact": "high",
              "scope": "explicit approved prototypes"
            },
            "reason": "Current bounded result."
          }
        ]
      },
      "selected_gap": {
        "id": "GAP-20260917-001-002",
        "responsibility": "agent",
        "goal": "Production Chat centers the conversation and places grouped sessions on the right with usable narrow layouts.",
        "reason": "Current production Chat still uses a left session sidebar.",
        "derived_from": [
          "FACT-20260917-001-001"
        ],
        "blocked_by": [],
        "priority_basis": {
          "blocking": "",
          "uncertainty": "",
          "risk": "",
          "user_impact": "high",
          "scope": "explicit approved prototypes"
        },
        "evidence_required": [
          "Production renderer behavior and Electron verification matching the approved prototype."
        ]
      },
      "planned_transition": {
        "goal": "Production Chat centers the conversation and places grouped sessions on the right with usable narrow layouts.",
        "expected_state_change": "Production Chat centers real conversation rendering and places sessions on the right; responsive navigation, model settings, drafts and streaming remain on existing coordinators."
      },
      "accepted_state_delta": {
        "resolved_gap": {
          "id": "GAP-20260917-001-002",
          "status": "resolved",
          "outcome": "Production Chat centers real conversation rendering and places sessions on the right; responsive navigation, model settings, drafts and streaming remain on existing coordinators.",
          "reason": "Approved prototype implemented and production renderer exercised in Electron.",
          "evidence": [
            "arckit/cases/evidence/CASE-20260917-001/chat-electron.json"
          ]
        },
        "facts_added": [
          {
            "id": "FACT-20260917-001-003",
            "revision": 1,
            "status": "accepted",
            "statement": "Production Chat centers real conversation rendering and places sessions on the right; responsive navigation, model settings, drafts and streaming remain on existing coordinators.",
            "basis": "Latest user-approved prototype and focused production verification.",
            "evidence": [
              "arckit/cases/evidence/CASE-20260917-001/chat-electron.json"
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
            "area_ref": "experience_and_interaction",
            "observed_revision": 73,
            "set_decision": {
              "status": "settled",
              "statement": "ArcOrbit 的旧业务页面保留既有交互及恢复语义。账号设置覆盖层为 Chat 与 Automation 分别提供可编辑 Model 和 Level 候选输入，Chat Composer 在输入框附近显示并调整当前会话后续消息所用 Model/Level，保存、失败恢复、thread 连续与场景隔离保持既有契约。Engineering 以“内置 Skills”明确范围，在首屏紧凑呈现场景、生效时机、内置总数、直接发现、按需使用、已停用、搜索、状态筛选和三列列表；用户在行内调整内置 Skill 使用方式并接收原位反馈。Automation 核心可见且锁定；搜索与状态可组合并一键清除；刷新或保存失败保留最近可信列表、场景和筛选；窄窗口按两列及单列降级且保持键盘焦点。用户自行安装的 Skills 不进入页面列表、计数、错误或操作，Chat 返回保留原会话与草稿。其他既有 Work Inspector、验收、Setup、Feedback、Today、项目绑定、Product/Idea 与 Release 交互契约保持不变。 ArcOrbit 各处 Agent 执行统一受设备级 settings.codex.yolo_mode 显式开关控制，缺省关闭；开启跳过审批并解除 Codex 沙箱，后续消息、新 Run 和终端接力捕获，关闭恢复场景策略；业务授权和托管权限上限保持有效。 Thing 以跨项目事情列表、中央详情与局部消息协作承载事情处理；取消全局项目列表与旧页面二级菜单。PERSONAL 下 Today、Chat、Thing 并列，保留 PRODUCT、PRODUCT LIFECYCLE、ORGANIZATION 类别；个人中心保持全部真实设置能力。 Chat 对话与 Composer 居中，项目分组会话在右侧；窄窗抽屉，逐会话草稿、阅读位置和 thread 保持独立。",
              "reason": "用户批准 Chat 右侧会话布局并授权实施；生产行为验证通过。",
              "evidence": [
                "arckit/interaction/engineering-profile/interaction.md",
                "arckit/interaction/engineering-profile/default.html",
                "runtime/arcorbit/desktop/renderer/engineering-surface.mjs",
                "runtime/arcorbit/desktop/renderer/engineering.css",
                "runtime/arcorbit/test/engineering-surface.test.mjs",
                "runtime/arcorbit/test/fixtures/engineering-electron.mjs",
                "arckit/cases/evidence/arcorbit-yolo/contract.md",
                "arckit/cases/evidence/CASE-20260915-001/verification.md",
                "arckit/cases/evidence/CASE-20260915-001/acceptance-matrix.md",
                "arckit/spec/agentic-software-development/arcorbit-project-workbench.md",
                "arckit/interaction/project-workbench/interaction.md",
                "arckit/tech/arcorbit/project-workbench-solution.md",
                "arckit/cases/evidence/CASE-20260917-001/navigation-electron.json",
                "arckit/cases/evidence/CASE-20260917-001/chat-electron.json"
              ],
              "confidence": "high",
              "resume_condition": "当 Engineering 信息层级、筛选、场景生效时机、失败恢复、键盘/窄窗行为或非内置隔离边界改变时重审。 事情身份、主会话、场景所有权或新旧导航边界变化时重审。"
            },
            "gap_refs": [],
            "reason": "用户批准 Chat 右侧会话布局并授权实施；生产行为验证通过。",
            "evidence": [
              "arckit/cases/evidence/CASE-20260917-001/chat-electron.json"
            ]
          }
        ],
        "software_invariant_changes": [],
        "project_gap_changes": [],
        "selection_context_change": null,
        "evidence": [
          "arckit/cases/evidence/CASE-20260917-001/chat-electron.json"
        ]
      },
      "invariant_assessment": {
        "project_revision": 391,
        "judgments": [
          {
            "invariant_ref": "product-expectations-remain-recoverable",
            "disposition": "upheld",
            "reason": "Thing is a peer page; source capabilities and real account settings remain intact. Approved product boundaries are recorded in specifications.",
            "fact_refs": [
              "FACT-20260917-001-001"
            ],
            "evidence": [
              "arckit/cases/evidence/CASE-20260917-001/chat-electron.json",
              "arckit/interaction/project-workbench/interaction.md",
              "arckit/interaction/chat-workspace/interaction.md"
            ],
            "gap_refs": []
          },
          {
            "invariant_ref": "interaction-expectations-remain-recoverable",
            "disposition": "upheld",
            "reason": "Both user-approved interaction documents specify navigation, conversation ownership, narrow drawers, focus and recovery. They distinguish prototype from production evidence.",
            "fact_refs": [
              "FACT-20260917-001-001"
            ],
            "evidence": [
              "arckit/cases/evidence/CASE-20260917-001/chat-electron.json",
              "arckit/interaction/project-workbench/interaction.md",
              "arckit/interaction/chat-workspace/interaction.md"
            ],
            "gap_refs": []
          },
          {
            "invariant_ref": "visual-language-remains-consistent",
            "disposition": "upheld",
            "reason": "Approved light tokens, grouped navigation, centered content and narrow layouts govern both pages. Renderer screenshots and geometry support the implemented scope.",
            "fact_refs": [
              "FACT-20260917-001-001"
            ],
            "evidence": [
              "arckit/cases/evidence/CASE-20260917-001/chat-electron.json",
              "arckit/interaction/project-workbench/interaction.md",
              "arckit/interaction/chat-workspace/interaction.md"
            ],
            "gap_refs": []
          },
          {
            "invariant_ref": "technical-decisions-remain-explainable",
            "disposition": "upheld",
            "reason": "Presentation retains IPC/coordinator ownership, persistent sessions and service authority; no prototype sample or execution timer is imported into production.",
            "fact_refs": [
              "FACT-20260917-001-001"
            ],
            "evidence": [
              "arckit/cases/evidence/CASE-20260917-001/chat-electron.json",
              "arckit/interaction/project-workbench/interaction.md",
              "arckit/interaction/chat-workspace/interaction.md"
            ],
            "gap_refs": []
          },
          {
            "invariant_ref": "accepted-facts-are-realized",
            "disposition": "upheld",
            "reason": "Production behavior is verified against the approved page and navigation actions.",
            "fact_refs": [
              "FACT-20260917-001-001"
            ],
            "evidence": [
              "arckit/cases/evidence/CASE-20260917-001/chat-electron.json",
              "arckit/interaction/project-workbench/interaction.md",
              "arckit/interaction/chat-workspace/interaction.md"
            ],
            "gap_refs": []
          },
          {
            "invariant_ref": "debug-causes-remain-grounded",
            "disposition": "not_relevant",
            "reason": "This is an authorized interaction change, not a claim to resolve a previously unexplained product defect.",
            "fact_refs": [],
            "evidence": [],
            "gap_refs": []
          },
          {
            "invariant_ref": "material-risks-have-credible-evidence",
            "disposition": "upheld",
            "reason": "Navigation reachability, state continuity, content overflow and settings preservation are checked using production code and existing regression tests.",
            "fact_refs": [
              "FACT-20260917-001-001"
            ],
            "evidence": [
              "arckit/cases/evidence/CASE-20260917-001/chat-electron.json",
              "arckit/interaction/project-workbench/interaction.md",
              "arckit/interaction/chat-workspace/interaction.md"
            ],
            "gap_refs": []
          }
        ]
      },
      "evidence": [
        "arckit/cases/evidence/CASE-20260917-001/chat-electron.json"
      ],
      "runtime_result_ref": "",
      "occurred_at": "2026-09-17T05:43:27.991Z"
    },
    {
      "round": 3,
      "transition_schema_version": "arckit-case-transition/v8",
      "goal": "Review the completed implementation for correctness, real problem resolution, verification credibility, regression risk, and minimality.",
      "outcome": "completed",
      "gap_selection": {
        "mode": "candidate",
        "basis": "Latest authorized UI implementation; choose one bounded accepted gap.",
        "snapshot_token": "f057aa32b0aa6e28fee145d2b2011075b90531d3d7da903f93e85c5e818fa1d3",
        "selected_ref": "case-gap:CASE-20260917-001:CASE-20260917-001:completion-review:1",
        "comparison_summary": "Navigation first, then Chat, then completion review; unrelated delivery and governance obligations remain deferred.",
        "fresh_discovery_summary": "No independent new work beyond approved navigation and Chat surfaces.",
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
            "reason": "Independent obligation outside this round."
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
            "reason": "Independent obligation outside this round."
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
            "reason": "Independent obligation outside this round."
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
            "reason": "Independent obligation outside this round."
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
            "reason": "Independent obligation outside this round."
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
            "reason": "Independent obligation outside this round."
          },
          {
            "ref": "case-gap:CASE-20260917-001:CASE-20260917-001:completion-review:1",
            "source": "persisted",
            "eligibility": "ready",
            "disposition": "selected",
            "priority_basis": {
              "blocking": "high",
              "uncertainty": "low",
              "risk": "high",
              "user_impact": "high"
            },
            "reason": "Current bounded result."
          }
        ]
      },
      "selected_gap": {
        "id": "CASE-20260917-001:completion-review:1",
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
        "expected_state_change": "Accept implementation completion review."
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
          "findings": [
            {
              "id": "acceptance-artifacts",
              "kind": "error",
              "statement": "Make acceptance artifacts reliable: Chat Electron failures must exit nonzero and Thing filter documentation must match the removed project scope.",
              "responsibility": "agent",
              "artifact_refs": [
                "runtime/arcorbit/test/fixtures/chat-layout-electron.mjs",
                "arckit/spec/agentic-software-development/arcorbit-project-workbench.md"
              ],
              "evidence": [
                "arckit/cases/evidence/CASE-20260917-001/review.md"
              ]
            }
          ],
          "evidence": [
            "arckit/cases/evidence/CASE-20260917-001/review.md"
          ],
          "dimensions": {
            "implementation_correctness": "clean",
            "problem_resolution": "clean",
            "verification_credibility": "findings",
            "regression_risk": "clean",
            "minimality": "clean"
          }
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
          "arckit/cases/evidence/CASE-20260917-001/review.md"
        ]
      },
      "invariant_assessment": {
        "project_revision": 392,
        "judgments": [
          {
            "invariant_ref": "product-expectations-remain-recoverable",
            "disposition": "upheld",
            "reason": "Thing is a peer page; source capabilities and real account settings remain intact. Approved product boundaries are recorded in specifications.",
            "fact_refs": [
              "FACT-20260917-001-001"
            ],
            "evidence": [
              "arckit/cases/evidence/CASE-20260917-001/review.md",
              "arckit/interaction/project-workbench/interaction.md",
              "arckit/interaction/chat-workspace/interaction.md"
            ],
            "gap_refs": []
          },
          {
            "invariant_ref": "interaction-expectations-remain-recoverable",
            "disposition": "upheld",
            "reason": "Both user-approved interaction documents specify navigation, conversation ownership, narrow drawers, focus and recovery. They distinguish prototype from production evidence.",
            "fact_refs": [
              "FACT-20260917-001-001"
            ],
            "evidence": [
              "arckit/cases/evidence/CASE-20260917-001/review.md",
              "arckit/interaction/project-workbench/interaction.md",
              "arckit/interaction/chat-workspace/interaction.md"
            ],
            "gap_refs": []
          },
          {
            "invariant_ref": "visual-language-remains-consistent",
            "disposition": "upheld",
            "reason": "Approved light tokens, grouped navigation, centered content and narrow layouts govern both pages. Renderer screenshots and geometry support the implemented scope.",
            "fact_refs": [
              "FACT-20260917-001-001"
            ],
            "evidence": [
              "arckit/cases/evidence/CASE-20260917-001/review.md",
              "arckit/interaction/project-workbench/interaction.md",
              "arckit/interaction/chat-workspace/interaction.md"
            ],
            "gap_refs": []
          },
          {
            "invariant_ref": "technical-decisions-remain-explainable",
            "disposition": "upheld",
            "reason": "Presentation retains IPC/coordinator ownership, persistent sessions and service authority; no prototype sample or execution timer is imported into production.",
            "fact_refs": [
              "FACT-20260917-001-001"
            ],
            "evidence": [
              "arckit/cases/evidence/CASE-20260917-001/review.md",
              "arckit/interaction/project-workbench/interaction.md",
              "arckit/interaction/chat-workspace/interaction.md"
            ],
            "gap_refs": []
          },
          {
            "invariant_ref": "accepted-facts-are-realized",
            "disposition": "upheld",
            "reason": "Production behavior is verified against the approved page and navigation actions.",
            "fact_refs": [
              "FACT-20260917-001-001"
            ],
            "evidence": [
              "arckit/cases/evidence/CASE-20260917-001/review.md",
              "arckit/interaction/project-workbench/interaction.md",
              "arckit/interaction/chat-workspace/interaction.md"
            ],
            "gap_refs": []
          },
          {
            "invariant_ref": "debug-causes-remain-grounded",
            "disposition": "not_relevant",
            "reason": "This is an authorized interaction change, not a claim to resolve a previously unexplained product defect.",
            "fact_refs": [],
            "evidence": [],
            "gap_refs": []
          },
          {
            "invariant_ref": "material-risks-have-credible-evidence",
            "disposition": "threatened",
            "reason": "Review found unreliable fixture failure exit status; observed passing assertions remain valid, but future automation must fail closed.",
            "fact_refs": [
              "FACT-20260917-001-001"
            ],
            "evidence": [
              "arckit/cases/evidence/CASE-20260917-001/review.md",
              "arckit/interaction/project-workbench/interaction.md",
              "arckit/interaction/chat-workspace/interaction.md"
            ],
            "gap_refs": [
              "CASE-20260917-001:review-finding:acceptance-artifacts"
            ]
          }
        ]
      },
      "evidence": [
        "arckit/cases/evidence/CASE-20260917-001/review.md"
      ],
      "runtime_result_ref": "",
      "occurred_at": "2026-09-17T05:45:00.536Z"
    },
    {
      "round": 4,
      "transition_schema_version": "arckit-case-transition/v8",
      "goal": "Resolve review finding: Make acceptance artifacts reliable: Chat Electron failures must exit nonzero and Thing filter documentation must match the removed project scope.",
      "outcome": "completed",
      "gap_selection": {
        "mode": "candidate",
        "basis": "Latest authorized UI implementation; choose one bounded accepted gap.",
        "snapshot_token": "65a2564926f354408540d6f9792b53c410a2dc392f6bd94f3f1df7fe41fc2f51",
        "selected_ref": "case-gap:CASE-20260917-001:CASE-20260917-001:review-finding:acceptance-artifacts",
        "comparison_summary": "Navigation first, then Chat, then completion review; unrelated delivery and governance obligations remain deferred.",
        "fresh_discovery_summary": "No independent new work beyond approved navigation and Chat surfaces.",
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
            "reason": "Independent obligation outside this round."
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
            "reason": "Independent obligation outside this round."
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
            "reason": "Independent obligation outside this round."
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
            "reason": "Independent obligation outside this round."
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
            "reason": "Independent obligation outside this round."
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
            "reason": "Independent obligation outside this round."
          },
          {
            "ref": "case-gap:CASE-20260917-001:CASE-20260917-001:review-finding:acceptance-artifacts",
            "source": "persisted",
            "eligibility": "ready",
            "disposition": "selected",
            "priority_basis": {
              "blocking": "high",
              "uncertainty": "",
              "risk": "high",
              "user_impact": ""
            },
            "reason": "Current bounded result."
          }
        ]
      },
      "selected_gap": {
        "id": "CASE-20260917-001:review-finding:acceptance-artifacts",
        "responsibility": "agent",
        "goal": "Resolve review finding: Make acceptance artifacts reliable: Chat Electron failures must exit nonzero and Thing filter documentation must match the removed project scope.",
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
          "runtime/arcorbit/test/fixtures/chat-layout-electron.mjs",
          "arckit/spec/agentic-software-development/arcorbit-project-workbench.md",
          "arckit/cases/evidence/CASE-20260917-001/review.md"
        ]
      },
      "planned_transition": {
        "goal": "Resolve review finding: Make acceptance artifacts reliable: Chat Electron failures must exit nonzero and Thing filter documentation must match the removed project scope.",
        "expected_state_change": "Electron assertions now exit nonzero; documentation matches cross-project Thing filters."
      },
      "accepted_state_delta": {
        "resolved_gap": {
          "id": "CASE-20260917-001:review-finding:acceptance-artifacts",
          "status": "resolved",
          "outcome": "Electron assertions now exit nonzero; documentation matches cross-project Thing filters.",
          "reason": "Forced failure returned 1; normal renderer checks returned 0.",
          "evidence": [
            "arckit/cases/evidence/CASE-20260917-001/acceptance-artifact-repair.md"
          ]
        },
        "facts_added": [
          {
            "id": "FACT-20260917-001-004",
            "revision": 1,
            "status": "accepted",
            "statement": "Electron assertions now exit nonzero; documentation matches cross-project Thing filters.",
            "basis": "Observed explicit failure and success exits plus updated product specification.",
            "evidence": [
              "arckit/cases/evidence/CASE-20260917-001/acceptance-artifact-repair.md"
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
        "evidence": [
          "arckit/cases/evidence/CASE-20260917-001/acceptance-artifact-repair.md"
        ]
      },
      "invariant_assessment": {
        "project_revision": 392,
        "judgments": [
          {
            "invariant_ref": "product-expectations-remain-recoverable",
            "disposition": "upheld",
            "reason": "Thing is a peer page; source capabilities and real account settings remain intact. Approved product boundaries are recorded in specifications.",
            "fact_refs": [
              "FACT-20260917-001-001"
            ],
            "evidence": [
              "arckit/cases/evidence/CASE-20260917-001/acceptance-artifact-repair.md"
            ],
            "gap_refs": []
          },
          {
            "invariant_ref": "interaction-expectations-remain-recoverable",
            "disposition": "upheld",
            "reason": "Both user-approved interaction documents specify navigation, conversation ownership, narrow drawers, focus and recovery. They distinguish prototype from production evidence.",
            "fact_refs": [
              "FACT-20260917-001-001"
            ],
            "evidence": [
              "arckit/cases/evidence/CASE-20260917-001/acceptance-artifact-repair.md"
            ],
            "gap_refs": []
          },
          {
            "invariant_ref": "visual-language-remains-consistent",
            "disposition": "upheld",
            "reason": "Approved light tokens, grouped navigation, centered content and narrow layouts govern both pages. Renderer screenshots and geometry support the implemented scope.",
            "fact_refs": [
              "FACT-20260917-001-001"
            ],
            "evidence": [
              "arckit/cases/evidence/CASE-20260917-001/acceptance-artifact-repair.md"
            ],
            "gap_refs": []
          },
          {
            "invariant_ref": "technical-decisions-remain-explainable",
            "disposition": "upheld",
            "reason": "Presentation retains IPC/coordinator ownership, persistent sessions and service authority; no prototype sample or execution timer is imported into production.",
            "fact_refs": [
              "FACT-20260917-001-001"
            ],
            "evidence": [
              "arckit/cases/evidence/CASE-20260917-001/acceptance-artifact-repair.md"
            ],
            "gap_refs": []
          },
          {
            "invariant_ref": "accepted-facts-are-realized",
            "disposition": "upheld",
            "reason": "Production behavior is verified against the approved page and navigation actions.",
            "fact_refs": [
              "FACT-20260917-001-001"
            ],
            "evidence": [
              "arckit/cases/evidence/CASE-20260917-001/acceptance-artifact-repair.md"
            ],
            "gap_refs": []
          },
          {
            "invariant_ref": "debug-causes-remain-grounded",
            "disposition": "not_relevant",
            "reason": "This is an authorized interaction change, not a claim to resolve a previously unexplained product defect.",
            "fact_refs": [],
            "evidence": [],
            "gap_refs": []
          },
          {
            "invariant_ref": "material-risks-have-credible-evidence",
            "disposition": "upheld",
            "reason": "Navigation reachability, state continuity, content overflow and settings preservation are checked using production code and existing regression tests.",
            "fact_refs": [
              "FACT-20260917-001-001"
            ],
            "evidence": [
              "arckit/cases/evidence/CASE-20260917-001/acceptance-artifact-repair.md"
            ],
            "gap_refs": []
          }
        ]
      },
      "evidence": [
        "arckit/cases/evidence/CASE-20260917-001/acceptance-artifact-repair.md"
      ],
      "runtime_result_ref": "",
      "occurred_at": "2026-09-17T05:46:30.008Z"
    },
    {
      "round": 5,
      "transition_schema_version": "arckit-case-transition/v8",
      "goal": "Review the completed implementation for correctness, real problem resolution, verification credibility, regression risk, and minimality.",
      "outcome": "completed",
      "gap_selection": {
        "mode": "candidate",
        "basis": "Latest authorized UI implementation; choose one bounded accepted gap.",
        "snapshot_token": "f024ebd139e734d6d13f848c2a70375c5b69f11072d0ba1c4ecde1f4305dc3b2",
        "selected_ref": "case-gap:CASE-20260917-001:CASE-20260917-001:completion-review:2",
        "comparison_summary": "Navigation first, then Chat, then completion review; unrelated delivery and governance obligations remain deferred.",
        "fresh_discovery_summary": "No independent new work beyond approved navigation and Chat surfaces.",
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
            "reason": "Independent obligation outside this round."
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
            "reason": "Independent obligation outside this round."
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
            "reason": "Independent obligation outside this round."
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
            "reason": "Independent obligation outside this round."
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
            "reason": "Independent obligation outside this round."
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
            "reason": "Independent obligation outside this round."
          },
          {
            "ref": "case-gap:CASE-20260917-001:CASE-20260917-001:completion-review:2",
            "source": "persisted",
            "eligibility": "ready",
            "disposition": "selected",
            "priority_basis": {
              "blocking": "high",
              "uncertainty": "low",
              "risk": "high",
              "user_impact": "high"
            },
            "reason": "Current bounded result."
          }
        ]
      },
      "selected_gap": {
        "id": "CASE-20260917-001:completion-review:2",
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
        "expected_state_change": "Accept implementation completion review."
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
          "findings": [],
          "evidence": [
            "arckit/cases/evidence/CASE-20260917-001/review-final.md"
          ],
          "dimensions": {
            "implementation_correctness": "clean",
            "problem_resolution": "clean",
            "verification_credibility": "clean",
            "regression_risk": "clean",
            "minimality": "clean"
          }
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
          "arckit/cases/evidence/CASE-20260917-001/review-final.md"
        ]
      },
      "invariant_assessment": {
        "project_revision": 392,
        "judgments": [
          {
            "invariant_ref": "product-expectations-remain-recoverable",
            "disposition": "upheld",
            "reason": "Thing is a peer page; source capabilities and real account settings remain intact. Approved product boundaries are recorded in specifications.",
            "fact_refs": [
              "FACT-20260917-001-001"
            ],
            "evidence": [
              "arckit/cases/evidence/CASE-20260917-001/review-final.md",
              "arckit/interaction/project-workbench/interaction.md",
              "arckit/interaction/chat-workspace/interaction.md"
            ],
            "gap_refs": []
          },
          {
            "invariant_ref": "interaction-expectations-remain-recoverable",
            "disposition": "upheld",
            "reason": "Both user-approved interaction documents specify navigation, conversation ownership, narrow drawers, focus and recovery. They distinguish prototype from production evidence.",
            "fact_refs": [
              "FACT-20260917-001-001"
            ],
            "evidence": [
              "arckit/cases/evidence/CASE-20260917-001/review-final.md",
              "arckit/interaction/project-workbench/interaction.md",
              "arckit/interaction/chat-workspace/interaction.md"
            ],
            "gap_refs": []
          },
          {
            "invariant_ref": "visual-language-remains-consistent",
            "disposition": "upheld",
            "reason": "Approved light tokens, grouped navigation, centered content and narrow layouts govern both pages. Renderer screenshots and geometry support the implemented scope.",
            "fact_refs": [
              "FACT-20260917-001-001"
            ],
            "evidence": [
              "arckit/cases/evidence/CASE-20260917-001/review-final.md",
              "arckit/interaction/project-workbench/interaction.md",
              "arckit/interaction/chat-workspace/interaction.md"
            ],
            "gap_refs": []
          },
          {
            "invariant_ref": "technical-decisions-remain-explainable",
            "disposition": "upheld",
            "reason": "Presentation retains IPC/coordinator ownership, persistent sessions and service authority; no prototype sample or execution timer is imported into production.",
            "fact_refs": [
              "FACT-20260917-001-001"
            ],
            "evidence": [
              "arckit/cases/evidence/CASE-20260917-001/review-final.md",
              "arckit/interaction/project-workbench/interaction.md",
              "arckit/interaction/chat-workspace/interaction.md"
            ],
            "gap_refs": []
          },
          {
            "invariant_ref": "accepted-facts-are-realized",
            "disposition": "upheld",
            "reason": "Production behavior is verified against the approved page and navigation actions.",
            "fact_refs": [
              "FACT-20260917-001-001"
            ],
            "evidence": [
              "arckit/cases/evidence/CASE-20260917-001/review-final.md",
              "arckit/interaction/project-workbench/interaction.md",
              "arckit/interaction/chat-workspace/interaction.md"
            ],
            "gap_refs": []
          },
          {
            "invariant_ref": "debug-causes-remain-grounded",
            "disposition": "not_relevant",
            "reason": "This is an authorized interaction change, not a claim to resolve a previously unexplained product defect.",
            "fact_refs": [],
            "evidence": [],
            "gap_refs": []
          },
          {
            "invariant_ref": "material-risks-have-credible-evidence",
            "disposition": "upheld",
            "reason": "Navigation reachability, state continuity, content overflow and settings preservation are checked using production code and existing regression tests.",
            "fact_refs": [
              "FACT-20260917-001-001"
            ],
            "evidence": [
              "arckit/cases/evidence/CASE-20260917-001/review-final.md",
              "arckit/interaction/project-workbench/interaction.md",
              "arckit/interaction/chat-workspace/interaction.md"
            ],
            "gap_refs": []
          }
        ]
      },
      "evidence": [
        "arckit/cases/evidence/CASE-20260917-001/review-final.md"
      ],
      "runtime_result_ref": "",
      "occurred_at": "2026-09-17T05:47:13.762Z"
    }
  ],
  "case_resolution": {
    "status": "resolved",
    "stage": "resolved",
    "satisfied": [
      "GAP-20260917-001-001",
      "GAP-20260917-001-002",
      "CASE-20260917-001:review-finding:acceptance-artifacts"
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
    "updated_at": "2026-09-17T05:47:13.762Z"
  }
}
```

## Round Notes

- Case history is canonical in Structured Record.rounds; keep prose notes exceptional.
