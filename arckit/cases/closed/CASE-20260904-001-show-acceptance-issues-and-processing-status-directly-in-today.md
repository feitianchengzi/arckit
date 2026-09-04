# Show acceptance issues and processing status directly in Today

Case: CASE-20260904-001
Status: closed
Artifact Type: mixed
Selected Gap: none
Updated: 2026-09-04T06:41:01.178Z

## User Intent

ArcOrbit Today 页面中的待验收事项在用户提出验收问题后，继续在当前责任上下文直接展示验收问题列表，以及每项问题的当前处理状态和进展。

## Structured Record

```json
{
  "schema_version": "development-case-record/v5",
  "id": "CASE-20260904-001",
  "title": "Show acceptance issues and processing status directly in Today",
  "status": "closed",
  "artifact_type": "mixed",
  "created_at": "2026-09-04T06:29:59.315Z",
  "updated_at": "2026-09-04T06:41:01.178Z",
  "user_intent": "ArcOrbit Today 页面中的待验收事项在用户提出验收问题后，继续在当前责任上下文直接展示验收问题列表，以及每项问题的当前处理状态和进展。",
  "expected_outcome": "Today 的 completed Work 责任项直接展示验收问题原文、状态和进展；提交新问题并完成来源刷新后仍保持有效的当前责任上下文；交互事实、Renderer 实现和聚焦回归测试一致。",
  "project_state_ref": "arckit/project/state.record.json",
  "current_round": {
    "goal": "",
    "selected_gap": null
  },
  "facts": [
    {
      "id": "FACT-20260904-001-001",
      "revision": 1,
      "status": "accepted",
      "statement": "For a completed Work responsibility shown in ArcOrbit Today, after the current user raises an acceptance issue, the Today operator must directly show the task's acceptance issue list with each issue's original text, current processing status, and available progress, without requiring navigation away or expansion of a collapsed disclosure.",
      "basis": "The current operator explicitly established the expected Today behavior.",
      "evidence": [
        "Current operator input, 2026-09-04"
      ]
    },
    {
      "id": "FACT-20260904-001-002",
      "revision": 1,
      "status": "superseded",
      "statement": "The current Today renderer places Work acceptance feedback items inside a default-collapsed details disclosure and clears the selected Today item after every successful action; focused Today tests do not cover direct issue/status visibility after acceptance-feedback submission.",
      "basis": "Direct inspection of the current Today interaction source, renderer action flow, workspace projection, and focused tests.",
      "evidence": [
        "arckit/interaction/today-workspace/interaction.md",
        "runtime/arcorbit/src/desktop/today-workspace.mjs",
        "runtime/arcorbit/desktop/renderer/renderer.js",
        "runtime/arcorbit/test/today-workspace.test.mjs"
      ]
    },
    {
      "id": "FACT-20260904-001-003",
      "revision": 1,
      "status": "accepted",
      "statement": "ArcOrbit Today now directly renders every acceptance issue for a completed Work responsibility with its original text, current status, and available progress; after a successful raise_acceptance_issue source refresh, the still-valid current responsibility remains selected, while a newer user selection is preserved.",
      "basis": "The durable interaction artifacts, Renderer implementation, workspace projection regression, Renderer regression, syntax check, and diff check agree on the realized behavior.",
      "evidence": [
        "arckit/interaction/today-workspace/interaction.md",
        "arckit/interaction/today-workspace/action-details.html",
        "runtime/arcorbit/desktop/renderer/renderer.js",
        "runtime/arcorbit/test/today-workspace.test.mjs",
        "runtime/arcorbit/test/desktop-renderer.test.mjs",
        "node --test runtime/arcorbit/test/today-workspace.test.mjs runtime/arcorbit/test/desktop-renderer.test.mjs: 74 passed, 0 failed"
      ]
    }
  ],
  "state_impacts": [
    {
      "id": "IMPACT-20260904-001-001",
      "fact_id": "FACT-20260904-001-001",
      "fact_revision": 1,
      "target": {
        "kind": "software_decision",
        "ref": "experience_and_interaction",
        "revision": 65
      },
      "effect": "upheld",
      "reason": "The revised durable interaction decision now explicitly recovers direct acceptance-list visibility, status/progress presentation, valid selection continuity, and protection of newer user selection.",
      "gap_ids": [],
      "evidence": [
        "arckit/interaction/today-workspace/interaction.md",
        "arckit/interaction/today-workspace/action-details.html",
        "runtime/arcorbit/desktop/renderer/renderer.js"
      ]
    },
    {
      "id": "IMPACT-20260904-001-002",
      "fact_id": "FACT-20260904-001-003",
      "fact_revision": 1,
      "target": {
        "kind": "software_invariant",
        "ref": "accepted-facts-are-realized",
        "revision": null
      },
      "effect": "upheld",
      "reason": "The actual Today Renderer and focused regressions now realize the accepted operator expectation without a collapsed disclosure or unconditional post-submit selection reset.",
      "gap_ids": [],
      "evidence": [
        "runtime/arcorbit/desktop/renderer/renderer.js",
        "runtime/arcorbit/test/today-workspace.test.mjs",
        "runtime/arcorbit/test/desktop-renderer.test.mjs",
        "node --test runtime/arcorbit/test/today-workspace.test.mjs runtime/arcorbit/test/desktop-renderer.test.mjs: 74 passed, 0 failed"
      ]
    }
  ],
  "gaps": [
    {
      "id": "GAP-20260904-001-001",
      "status": "resolved",
      "goal": "Realize direct acceptance-issue visibility in Today by updating the stable interaction projection and Renderer so completed Work responsibilities show every acceptance issue's original text, status, and progress without collapsed disclosure, preserve or recover the still-valid responsibility selection after submission, and prove the behavior with focused regression tests.",
      "reason": "The product expectation is explicit and the current implementation hides the information behind disclosure while lacking post-submission continuity coverage.",
      "derived_from": [
        "FACT-20260904-001-001",
        "FACT-20260904-001-002"
      ],
      "blocked_by": [],
      "priority_basis": {
        "blocking": "Blocks acceptance of the operator's Today interaction request.",
        "uncertainty": "Low; the expected information and current mismatch are directly evidenced.",
        "risk": "Medium; selection and source-refresh ordering can cause stale or displaced context.",
        "user_impact": "High; users cannot immediately track the acceptance issue they just submitted."
      },
      "responsibility": "agent",
      "evidence_required": [
        "Updated Today interaction source/projection explicitly requiring direct issue, status, and progress visibility",
        "Renderer evidence showing the acceptance list without collapsed disclosure",
        "Post-submission behavior preserving or recovering the valid completed Work responsibility context",
        "Focused automated tests covering existing issues and newly submitted issue status/progress visibility",
        "Passing relevant ArcOrbit Today/Renderer regression tests"
      ],
      "resolution": {
        "id": "GAP-20260904-001-001",
        "status": "resolved",
        "outcome": "ArcOrbit Today directly renders the completed Work responsibility's acceptance issue list with original text, status, and progress. Successful acceptance-issue submission keeps the still-valid current responsibility selected, while any newer user selection remains authoritative. Durable interaction artifacts and focused regressions now agree with the operator expectation.",
        "reason": "The stable Today interaction source and projection were updated, the Renderer no longer hides acceptance issues behind a disclosure or clears selection for raise_acceptance_issue, and all focused verification passed.",
        "evidence": [
          "arckit/interaction/today-workspace/interaction.md",
          "arckit/interaction/today-workspace/action-details.html",
          "arckit/interaction/INDEX.md",
          "arckit/interaction/_map/feature-matrix.md",
          "runtime/arcorbit/desktop/renderer/renderer.js",
          "runtime/arcorbit/test/today-workspace.test.mjs",
          "runtime/arcorbit/test/desktop-renderer.test.mjs",
          "node --test runtime/arcorbit/test/today-workspace.test.mjs runtime/arcorbit/test/desktop-renderer.test.mjs: 74 passed, 0 failed",
          "node --check runtime/arcorbit/desktop/renderer/renderer.js: passed",
          "git diff --check: passed"
        ],
        "occurred_at": "2026-09-04T06:36:56.632Z"
      }
    }
  ],
  "content_revision": 1,
  "completion_review": {
    "status": "clean",
    "policy": {
      "initial_max_cycles": 10,
      "source": "runtime/arcorbit/config/case-policy.json",
      "snapshotted_at": "2026-09-04T06:29:59.315Z"
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
          "arckit/interaction/today-workspace/interaction.md",
          "arckit/interaction/today-workspace/action-details.html",
          "runtime/arcorbit/desktop/renderer/renderer.js",
          "runtime/arcorbit/test/today-workspace.test.mjs",
          "runtime/arcorbit/test/desktop-renderer.test.mjs",
          "node --test runtime/arcorbit/test/today-workspace.test.mjs runtime/arcorbit/test/desktop-renderer.test.mjs: 74 passed, 0 failed",
          "npm test --workspace @arckit/arcorbit outside GUI-restricted sandbox: 568 passed, 24 skipped, 0 failed",
          "node --check runtime/arcorbit/desktop/renderer/renderer.js: passed",
          "git diff --check: passed",
          "action-details.html structure audit: 9 wireframes, 9 frames, 9 component lists, 9 interaction sections, balanced document root"
        ],
        "occurred_at": "2026-09-04T06:41:01.178Z"
      }
    ],
    "evidence": [
      "arckit/interaction/today-workspace/interaction.md",
      "arckit/interaction/today-workspace/action-details.html",
      "runtime/arcorbit/desktop/renderer/renderer.js",
      "runtime/arcorbit/test/today-workspace.test.mjs",
      "runtime/arcorbit/test/desktop-renderer.test.mjs",
      "node --test runtime/arcorbit/test/today-workspace.test.mjs runtime/arcorbit/test/desktop-renderer.test.mjs: 74 passed, 0 failed",
      "npm test --workspace @arckit/arcorbit outside GUI-restricted sandbox: 568 passed, 24 skipped, 0 failed",
      "node --check runtime/arcorbit/desktop/renderer/renderer.js: passed",
      "git diff --check: passed",
      "action-details.html structure audit: 9 wireframes, 9 frames, 9 component lists, 9 interaction sections, balanced document root"
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
      "goal": "Realize and verify direct acceptance-issue visibility and post-submission selection continuity in ArcOrbit Today.",
      "outcome": "completed",
      "gap_selection": {
        "mode": "candidate",
        "basis": "Fresh post-create snapshot comparison across every persisted Project and Case candidate, prioritizing the operator-facing Today gap by direct user impact, readiness, bounded scope, and immediate verifiability.",
        "snapshot_token": "d60a25bc19a4b17ac0e3ed7e71464410bf79511f6f288f88383b5849695e8216",
        "selected_ref": "case-gap:CASE-20260904-001:GAP-20260904-001-001",
        "comparison_summary": "Selected the ready Today acceptance-issue Gap because it is the current Project focus and directly blocks the requested user-visible behavior. Deferred four broader Project gaps that require separate Cases and excluded the unrelated human-owned monorepo publication gate.",
        "fresh_discovery_summary": "No additional fresh candidate was discovered that changes the selected Gap's object, scope, risk, or acceptance boundary.",
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
            "reason": "Important broader validation work, but it requires its own Case and does not block the current Today behavior."
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
            "reason": "Runtime resilience work is unrelated to the bounded Today acceptance presentation and selection behavior."
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
            "reason": "Real-project security validation requires a separate permission-bearing Case and does not block this local UI correction."
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
            "reason": "Cross-record auditing is broader Project work and does not affect the selected Today acceptance interaction."
          },
          {
            "ref": "case-gap:CASE-20260901-001:GAP-20260901-001-005",
            "source": "persisted",
            "eligibility": "ready",
            "disposition": "excluded",
            "priority_basis": {
              "blocking": "Blocks public push and source repository archival.",
              "uncertainty": "",
              "risk": "high",
              "user_impact": ""
            },
            "reason": "This is an unrelated human-owned credential, licensing, publication, and archival decision and cannot cover the Today request."
          },
          {
            "ref": "case-gap:CASE-20260904-001:GAP-20260904-001-001",
            "source": "persisted",
            "eligibility": "ready",
            "disposition": "selected",
            "priority_basis": {
              "blocking": "Blocks acceptance of the operator's Today interaction request.",
              "uncertainty": "Low; the expected information and current mismatch are directly evidenced.",
              "risk": "Medium; selection and source-refresh ordering can cause stale or displaced context.",
              "user_impact": "High; users cannot immediately track the acceptance issue they just submitted."
            },
            "reason": "It is agent-owned, fully bounded by accepted facts, directly addresses the current Project focus, and can be proven through durable interaction artifacts and focused tests."
          }
        ]
      },
      "selected_gap": {
        "id": "GAP-20260904-001-001",
        "responsibility": "agent",
        "goal": "Realize direct acceptance-issue visibility in Today by updating the stable interaction projection and Renderer so completed Work responsibilities show every acceptance issue's original text, status, and progress without collapsed disclosure, preserve or recover the still-valid responsibility selection after submission, and prove the behavior with focused regression tests.",
        "reason": "The product expectation is explicit and the current implementation hides the information behind disclosure while lacking post-submission continuity coverage.",
        "derived_from": [
          "FACT-20260904-001-001",
          "FACT-20260904-001-002"
        ],
        "blocked_by": [],
        "priority_basis": {
          "blocking": "Blocks acceptance of the operator's Today interaction request.",
          "uncertainty": "Low; the expected information and current mismatch are directly evidenced.",
          "risk": "Medium; selection and source-refresh ordering can cause stale or displaced context.",
          "user_impact": "High; users cannot immediately track the acceptance issue they just submitted."
        },
        "evidence_required": [
          "Updated Today interaction source/projection explicitly requiring direct issue, status, and progress visibility",
          "Renderer evidence showing the acceptance list without collapsed disclosure",
          "Post-submission behavior preserving or recovering the valid completed Work responsibility context",
          "Focused automated tests covering existing issues and newly submitted issue status/progress visibility",
          "Passing relevant ArcOrbit Today/Renderer regression tests"
        ]
      },
      "planned_transition": {
        "goal": "Realize and verify direct acceptance-issue visibility and post-submission selection continuity in ArcOrbit Today.",
        "expected_state_change": "Resolve the selected Gap by synchronizing the durable Today interaction expectation, rendering issue text/status/progress without collapsed disclosure, preserving valid selection after issue submission, and recording repeatable regression evidence."
      },
      "accepted_state_delta": {
        "resolved_gap": {
          "id": "GAP-20260904-001-001",
          "status": "resolved",
          "outcome": "ArcOrbit Today directly renders the completed Work responsibility's acceptance issue list with original text, status, and progress. Successful acceptance-issue submission keeps the still-valid current responsibility selected, while any newer user selection remains authoritative. Durable interaction artifacts and focused regressions now agree with the operator expectation.",
          "reason": "The stable Today interaction source and projection were updated, the Renderer no longer hides acceptance issues behind a disclosure or clears selection for raise_acceptance_issue, and all focused verification passed.",
          "evidence": [
            "arckit/interaction/today-workspace/interaction.md",
            "arckit/interaction/today-workspace/action-details.html",
            "arckit/interaction/INDEX.md",
            "arckit/interaction/_map/feature-matrix.md",
            "runtime/arcorbit/desktop/renderer/renderer.js",
            "runtime/arcorbit/test/today-workspace.test.mjs",
            "runtime/arcorbit/test/desktop-renderer.test.mjs",
            "node --test runtime/arcorbit/test/today-workspace.test.mjs runtime/arcorbit/test/desktop-renderer.test.mjs: 74 passed, 0 failed",
            "node --check runtime/arcorbit/desktop/renderer/renderer.js: passed",
            "git diff --check: passed"
          ]
        },
        "facts_added": [
          {
            "id": "FACT-20260904-001-003",
            "revision": 1,
            "status": "accepted",
            "statement": "ArcOrbit Today now directly renders every acceptance issue for a completed Work responsibility with its original text, current status, and available progress; after a successful raise_acceptance_issue source refresh, the still-valid current responsibility remains selected, while a newer user selection is preserved.",
            "basis": "The durable interaction artifacts, Renderer implementation, workspace projection regression, Renderer regression, syntax check, and diff check agree on the realized behavior.",
            "evidence": [
              "arckit/interaction/today-workspace/interaction.md",
              "arckit/interaction/today-workspace/action-details.html",
              "runtime/arcorbit/desktop/renderer/renderer.js",
              "runtime/arcorbit/test/today-workspace.test.mjs",
              "runtime/arcorbit/test/desktop-renderer.test.mjs",
              "node --test runtime/arcorbit/test/today-workspace.test.mjs runtime/arcorbit/test/desktop-renderer.test.mjs: 74 passed, 0 failed"
            ]
          }
        ],
        "facts_superseded": [
          {
            "id": "FACT-20260904-001-002",
            "revision": 1,
            "reason": "The described collapsed disclosure, unconditional selection reset, and missing focused coverage were replaced by the accepted implementation and regression evidence.",
            "evidence": [
              "runtime/arcorbit/desktop/renderer/renderer.js",
              "runtime/arcorbit/test/today-workspace.test.mjs",
              "runtime/arcorbit/test/desktop-renderer.test.mjs",
              "node --test runtime/arcorbit/test/today-workspace.test.mjs runtime/arcorbit/test/desktop-renderer.test.mjs: 74 passed, 0 failed"
            ]
          }
        ],
        "impacts_added": [],
        "impacts_updated": [
          {
            "id": "IMPACT-20260904-001-001",
            "fact_id": "FACT-20260904-001-001",
            "fact_revision": 1,
            "target": {
              "kind": "software_decision",
              "ref": "experience_and_interaction",
              "revision": 65
            },
            "effect": "upheld",
            "reason": "The revised durable interaction decision now explicitly recovers direct acceptance-list visibility, status/progress presentation, valid selection continuity, and protection of newer user selection.",
            "gap_ids": [],
            "evidence": [
              "arckit/interaction/today-workspace/interaction.md",
              "arckit/interaction/today-workspace/action-details.html",
              "runtime/arcorbit/desktop/renderer/renderer.js"
            ]
          },
          {
            "id": "IMPACT-20260904-001-002",
            "fact_id": "FACT-20260904-001-003",
            "fact_revision": 1,
            "target": {
              "kind": "software_invariant",
              "ref": "accepted-facts-are-realized",
              "revision": null
            },
            "effect": "upheld",
            "reason": "The actual Today Renderer and focused regressions now realize the accepted operator expectation without a collapsed disclosure or unconditional post-submit selection reset.",
            "gap_ids": [],
            "evidence": [
              "runtime/arcorbit/desktop/renderer/renderer.js",
              "runtime/arcorbit/test/today-workspace.test.mjs",
              "runtime/arcorbit/test/desktop-renderer.test.mjs",
              "node --test runtime/arcorbit/test/today-workspace.test.mjs runtime/arcorbit/test/desktop-renderer.test.mjs: 74 passed, 0 failed"
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
            "observed_revision": 64,
            "set_decision": {
              "status": "settled",
              "statement": "ArcOrbit 保持既有 Personal、Product Lifecycle、Organization 导航与 Work、Automation、Feedback、Chat 等交互语义。Work 新建和编辑 Sheet 保留完整七状态，编辑 Sheet 承担异常纠偏；右侧 Inspector 按当前状态显示有限下一步动作。Work Inspector 首次使用 440px，用户可通过 12px 可访问分隔条在 360–640px 保存范围内拖拽、键盘调整或双击复位，偏好跨任务、项目、Workset 和应用重启恢复。布局为任务树保留至少 420px，窗口临时收窄只改变有效宽度且不覆盖保存值。Inspector 以单一内部滚动区组织身份动作、内容、紧凑属性、协作和按状态出现的验收分区，宽度变化不丢失选择、滚动、草稿或附件状态。验收问题条目的问题原文与进展文本在 Inspector 当前可用宽度内完整折行且不横向越界，状态徽标保持清晰可见。Work 已完成列表按新完成在上、历史完成在下排列；标记首项为已验收后选择下一条较旧待办，标记其他位置后选择相邻较新待办，树补全项不参与目标计算，且选择只在服务器确认成功后切换。验收请求期间允许浏览其他任务；若用户在服务器确认前产生较新的选择，成功回调保留该选择而不执行旧任务的自动相邻切换。Work 新建待办 Sheet 在执行人控件下根据执行人与状态原位解释 Automation 资格。跨产品替换、主窗口和 Case 绑定恢复的既有交互保持不变。应用冷启动检查全部关联本地项目；新增或改变本地关联及用户主动重试再次检查。项目集全部、具体项目、Workset 或其它纯查看切换只改变业务投影，不进入 Setup；解除关联和 task start 不重新扫描 skills。task start 缓存断言失败时返回 Setup，等待用户主动重新检查。Setup 冲突页逐项显示稳定 code、skill、目标类型与路径及双方 digest；兜底覆盖默认全不选，支持逐项或全选可恢复项，独立确认 recovery root 与 fresh assessment digest，并反馈备份、替换、回滚和残留状态。Feedback 已忽略且未关联待办的详情显示“恢复为待处理”；动作无需二次确认，提交期间锁定自身，只有服务端确认 pending 后更新状态，失败时保持 ignored、筛选、选择和滚动位置。受支持旧版本覆盖安装后，Automation 先恢复 Catalog 项目行并保留 Workset、绑定和项目授权，再逐项目显示正在恢复、同步异常或可执行；用户无需退出登录、清缓存或重新添加项目。Automation 顶层责任只区分可自行继续与需要人工介入；external、recovery、configuration 与 CLI 保留为原因或处理场所，任何必须由操作者动作触发的下一步都显示 Human。external dependency 创建 attention，并通过“已处理，重新检查”恢复同一 task session/thread。Workset Feedback V2 沟通记录在首次选择和 fresh notification snapshot 标记当前反馈有未读回复时自动重新拉取消息；页面级、详情级和沟通记录的手动刷新均同时刷新反馈事实、通知与当前会话。消息成功加载后才标记已读；失败时保留旧消息和重试入口；刷新不得丢失回复草稿、附件选择或 Inspector 滚动上下文。Today 使用既有主导航中的 Personal 入口和项目栏、责任栏、操作台三栏桌面工作区，仅提供“需要你处理”和“项目配置”两个模式。首次使用在 Today 内以 Sheet 新建个人项目、一次选择多个可访问项目或使用邀请加入；各项目独立推进访问、本地目录、项目 Setup 与当前用户当前设备的 Automation participation，任一 ready 后只引导到 Work。Today 不显示下一工作、普通待办、已处理历史或完整自动进度；非人工状态只有可工作、推进中、自动恢复和未知来源的最小摘要。项目栏不受 Workset 裁剪，未选择项目的明确人工责任仍强制显现。提交只锁定当前责任项；提出验收问题成功后 Task 保持 completed，当前责任仍有效时保持选择并在操作台原位直接显示每项问题原文、处理状态和进展，提交期间形成的较新用户选择不被旧回调覆盖；其他完成责任的动作在来源确认后短暂显示结果再移除；失败保留草稿和选择，项目范围、模式、选择与草稿跨应用重启恢复。Chat、Organization、Today、Work 与 Automation 对缺失本地目录的可访问项目均向当前用户提供“选择本地目录”；本地目录绑定和 Automation participation 都是当前用户当前设备可直接完成的选择，只有项目事实编辑、邀请和成员管理等远端治理动作才按 owner/admin 角色显示 handoff 或管理操作。",
              "reason": "The operator clarified that Today itself must expose acceptance issue progress immediately after submission, and the durable interaction source plus verified implementation now establish the precise selection and feedback semantics.",
              "evidence": [
                "Current operator input, 2026-09-04",
                "arckit/interaction/today-workspace/interaction.md",
                "arckit/interaction/today-workspace/action-details.html",
                "runtime/arcorbit/desktop/renderer/renderer.js",
                "runtime/arcorbit/test/today-workspace.test.mjs",
                "runtime/arcorbit/test/desktop-renderer.test.mjs",
                "node --test runtime/arcorbit/test/today-workspace.test.mjs runtime/arcorbit/test/desktop-renderer.test.mjs: 74 passed, 0 failed"
              ],
              "confidence": "high",
              "resume_condition": "当 Today 的责任来源、项目配置完成口径、验收问题呈现与提交连续性、直接动作恢复语义或主导航结构改变时重审。"
            },
            "gap_refs": [],
            "reason": "The selected Gap resolves a durable Today interaction ambiguity and requires the Project decision to preserve the newly accepted direct-list and selection-continuity behavior.",
            "evidence": [
              "Current operator input, 2026-09-04",
              "arckit/interaction/today-workspace/interaction.md",
              "arckit/interaction/today-workspace/action-details.html",
              "runtime/arcorbit/desktop/renderer/renderer.js",
              "runtime/arcorbit/test/today-workspace.test.mjs",
              "runtime/arcorbit/test/desktop-renderer.test.mjs"
            ]
          }
        ],
        "software_invariant_changes": [],
        "project_gap_changes": [],
        "selection_context_change": null,
        "evidence": [
          "Current operator input, 2026-09-04",
          "arckit/interaction/today-workspace/interaction.md",
          "arckit/interaction/today-workspace/action-details.html",
          "runtime/arcorbit/desktop/renderer/renderer.js",
          "runtime/arcorbit/test/today-workspace.test.mjs",
          "runtime/arcorbit/test/desktop-renderer.test.mjs",
          "node --test runtime/arcorbit/test/today-workspace.test.mjs runtime/arcorbit/test/desktop-renderer.test.mjs: 74 passed, 0 failed"
        ]
      },
      "invariant_assessment": {
        "project_revision": 337,
        "judgments": [
          {
            "invariant_ref": "product-expectations-remain-recoverable",
            "disposition": "upheld",
            "reason": "The operator-established Today acceptance outcome is now explicit in the revised Project interaction decision and durable Today interaction artifacts.",
            "fact_refs": [
              "FACT-20260904-001-001",
              "FACT-20260904-001-003"
            ],
            "evidence": [
              "arckit/interaction/today-workspace/interaction.md",
              "arckit/interaction/today-workspace/action-details.html"
            ],
            "gap_refs": []
          },
          {
            "invariant_ref": "interaction-expectations-remain-recoverable",
            "disposition": "upheld",
            "reason": "Direct issue visibility, source-confirmed refresh, valid selection continuity, and protection of newer user selection are coherently specified and projected.",
            "fact_refs": [
              "FACT-20260904-001-001",
              "FACT-20260904-001-003"
            ],
            "evidence": [
              "arckit/interaction/today-workspace/interaction.md",
              "arckit/interaction/today-workspace/action-details.html",
              "arckit/interaction/INDEX.md",
              "arckit/interaction/_map/feature-matrix.md"
            ],
            "gap_refs": []
          },
          {
            "invariant_ref": "visual-language-remains-consistent",
            "disposition": "upheld",
            "reason": "The direct Today list reuses the established acceptance-feedback list, neutral surface, text wrapping, and status-pill presentation instead of introducing a new visual system.",
            "fact_refs": [
              "FACT-20260904-001-003"
            ],
            "evidence": [
              "arckit/interaction/today-workspace/action-details.html",
              "runtime/arcorbit/desktop/renderer/renderer.js",
              "runtime/arcorbit/desktop/renderer/styles.css"
            ],
            "gap_refs": []
          },
          {
            "invariant_ref": "technical-decisions-remain-explainable",
            "disposition": "not_relevant",
            "reason": "The accepted facts change a bounded Today presentation and interaction-state rule without changing architecture, data ownership, adapter boundaries, or technical constraints.",
            "fact_refs": [],
            "evidence": [],
            "gap_refs": []
          },
          {
            "invariant_ref": "accepted-facts-are-realized",
            "disposition": "upheld",
            "reason": "Renderer implementation and focused workspace/Renderer regressions directly prove the accepted direct-list and selection-continuity behavior.",
            "fact_refs": [
              "FACT-20260904-001-001",
              "FACT-20260904-001-003"
            ],
            "evidence": [
              "runtime/arcorbit/desktop/renderer/renderer.js",
              "runtime/arcorbit/test/today-workspace.test.mjs",
              "runtime/arcorbit/test/desktop-renderer.test.mjs",
              "node --test runtime/arcorbit/test/today-workspace.test.mjs runtime/arcorbit/test/desktop-renderer.test.mjs: 74 passed, 0 failed"
            ],
            "gap_refs": []
          },
          {
            "invariant_ref": "material-risks-have-credible-evidence",
            "disposition": "upheld",
            "reason": "The material regression risks—collapsed content, unconditional selection reset, and stale callbacks overriding newer choice—are bounded by explicit implementation branches and repeatable focused tests.",
            "fact_refs": [
              "FACT-20260904-001-003"
            ],
            "evidence": [
              "runtime/arcorbit/desktop/renderer/renderer.js",
              "runtime/arcorbit/test/today-workspace.test.mjs",
              "runtime/arcorbit/test/desktop-renderer.test.mjs",
              "node --test runtime/arcorbit/test/today-workspace.test.mjs runtime/arcorbit/test/desktop-renderer.test.mjs: 74 passed, 0 failed",
              "node --check runtime/arcorbit/desktop/renderer/renderer.js: passed",
              "git diff --check: passed"
            ],
            "gap_refs": []
          }
        ]
      },
      "evidence": [
        "arckit/interaction/today-workspace/interaction.md",
        "arckit/interaction/today-workspace/action-details.html",
        "arckit/interaction/INDEX.md",
        "arckit/interaction/_map/feature-matrix.md",
        "runtime/arcorbit/desktop/renderer/renderer.js",
        "runtime/arcorbit/test/today-workspace.test.mjs",
        "runtime/arcorbit/test/desktop-renderer.test.mjs",
        "node --test runtime/arcorbit/test/today-workspace.test.mjs runtime/arcorbit/test/desktop-renderer.test.mjs: 74 passed, 0 failed",
        "node --check runtime/arcorbit/desktop/renderer/renderer.js: passed",
        "git diff --check: passed"
      ],
      "runtime_result_ref": "arckit-runtime://runs/RUN-20260904-062749520Z-f80b7f67",
      "occurred_at": "2026-09-04T06:36:56.632Z"
    },
    {
      "round": 2,
      "transition_schema_version": "arckit-case-transition/v8",
      "goal": "独立审查 Today 验收问题直显实现的正确性、问题闭合、验证可信度、回归风险与最小性。",
      "outcome": "completed",
      "gap_selection": {
        "mode": "candidate",
        "basis": "比较当前 snapshot 中全部持久候选，并优先处理当前 Case 唯一阻塞终态的 Completion Review。",
        "snapshot_token": "a3eef3072e8a63bd3c7907d2767d1d53371455896e70cdf90cd49de7af9dd673",
        "selected_ref": "case-gap:CASE-20260904-001:CASE-20260904-001:completion-review:1",
        "comparison_summary": "四个 Project Gap 均需独立 Case；另一 Case 的发布门由人类负责且与当前目标无关。当前 Case 普通 Gap 与 impact 已全部关闭，因此 Completion Review 是唯一可执行且直接阻塞 Case 完成的候选。",
        "fresh_discovery_summary": "独立审查未发现需要优先于 Completion Review 的新普通 Gap。",
        "considered": [
          {
            "ref": "project-gap:GAP-agent-scenario-evaluation",
            "source": "persisted",
            "eligibility": "case_required",
            "disposition": "deferred",
            "priority_basis": {
              "blocking": "不阻塞当前 Case",
              "uncertainty": "高",
              "risk": "高",
              "user_impact": "属于跨场景项目验证"
            },
            "reason": "需要独立 Case，不能并入当前 Today 功能的 Completion Review。"
          },
          {
            "ref": "project-gap:GAP-runtime-resilience-and-adapters",
            "source": "persisted",
            "eligibility": "case_required",
            "disposition": "deferred",
            "priority_basis": {
              "blocking": "不阻塞当前 Case",
              "uncertainty": "中",
              "risk": "高",
              "user_impact": "属于 Runtime 韧性工作"
            },
            "reason": "需要独立 Case，且不影响本次 Today 实现的终态审查。"
          },
          {
            "ref": "project-gap:GAP-security-real-project-validation",
            "source": "persisted",
            "eligibility": "case_required",
            "disposition": "deferred",
            "priority_basis": {
              "blocking": "不阻塞当前 Case",
              "uncertainty": "中",
              "risk": "高",
              "user_impact": "属于真实权限项目验证"
            },
            "reason": "需要独立 Case，与当前 Today 呈现和选择连续性无直接关系。"
          },
          {
            "ref": "project-gap:GAP-cross-record-audit",
            "source": "persisted",
            "eligibility": "case_required",
            "disposition": "deferred",
            "priority_basis": {
              "blocking": "不阻塞当前 Case",
              "uncertainty": "中",
              "risk": "高",
              "user_impact": "属于跨记录审计能力"
            },
            "reason": "需要独立 Case；当前 Case 的可信 Ledger 状态自身一致。"
          },
          {
            "ref": "case-gap:CASE-20260901-001:GAP-20260901-001-005",
            "source": "persisted",
            "eligibility": "ready",
            "disposition": "excluded",
            "priority_basis": {
              "blocking": "阻塞另一 Case 的公开发布与归档",
              "uncertainty": "需所有者确认",
              "risk": "高",
              "user_impact": "与当前 Today 目标无关"
            },
            "reason": "属于另一 Case 且责任为 human，不能由本轮代理审查完成。"
          },
          {
            "ref": "case-gap:CASE-20260904-001:CASE-20260904-001:completion-review:1",
            "source": "persisted",
            "eligibility": "ready",
            "disposition": "selected",
            "priority_basis": {
              "blocking": "直接阻塞当前 Case 终态",
              "uncertainty": "低",
              "risk": "高",
              "user_impact": "确认用户要求是否真实交付"
            },
            "reason": "当前 Case 所有普通工作已关闭，必须通过五维 Completion Review 才能完成。"
          }
        ]
      },
      "selected_gap": {
        "id": "CASE-20260904-001:completion-review:1",
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
        "goal": "独立审查 Today 验收问题直显实现的正确性、问题闭合、验证可信度、回归风险与最小性。",
        "expected_state_change": "记录 clean Completion Review，不改变 Case 内容；可信 Ledger 据此关闭 CASE-20260904-001。"
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
            "arckit/interaction/today-workspace/interaction.md",
            "arckit/interaction/today-workspace/action-details.html",
            "runtime/arcorbit/desktop/renderer/renderer.js",
            "runtime/arcorbit/test/today-workspace.test.mjs",
            "runtime/arcorbit/test/desktop-renderer.test.mjs",
            "node --test runtime/arcorbit/test/today-workspace.test.mjs runtime/arcorbit/test/desktop-renderer.test.mjs: 74 passed, 0 failed",
            "npm test --workspace @arckit/arcorbit outside GUI-restricted sandbox: 568 passed, 24 skipped, 0 failed",
            "node --check runtime/arcorbit/desktop/renderer/renderer.js: passed",
            "git diff --check: passed",
            "action-details.html structure audit: 9 wireframes, 9 frames, 9 component lists, 9 interaction sections, balanced document root"
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
        "project_revision": 338,
        "judgments": [
          {
            "invariant_ref": "product-expectations-remain-recoverable",
            "disposition": "upheld",
            "reason": "用户要求的 Today 验收问题直显结果已由稳定交互事实、实现和完整回归共同支持。",
            "fact_refs": [
              "FACT-20260904-001-001",
              "FACT-20260904-001-003"
            ],
            "evidence": [
              "arckit/interaction/today-workspace/interaction.md",
              "arckit/interaction/today-workspace/action-details.html",
              "runtime/arcorbit/desktop/renderer/renderer.js"
            ],
            "gap_refs": []
          },
          {
            "invariant_ref": "interaction-expectations-remain-recoverable",
            "disposition": "upheld",
            "reason": "直接列表、来源确认后的原位刷新、有效选择保持及较新用户选择优先语义均可从交互工件与实现恢复。",
            "fact_refs": [
              "FACT-20260904-001-001",
              "FACT-20260904-001-003"
            ],
            "evidence": [
              "arckit/interaction/today-workspace/interaction.md",
              "arckit/interaction/today-workspace/action-details.html",
              "runtime/arcorbit/test/desktop-renderer.test.mjs"
            ],
            "gap_refs": []
          },
          {
            "invariant_ref": "visual-language-remains-consistent",
            "disposition": "upheld",
            "reason": "实现复用既有验收反馈面板、列表、状态徽标和中性表面，没有引入新的视觉体系。",
            "fact_refs": [
              "FACT-20260904-001-003"
            ],
            "evidence": [
              "arckit/interaction/today-workspace/action-details.html",
              "runtime/arcorbit/desktop/renderer/renderer.js",
              "runtime/arcorbit/desktop/renderer/styles.css"
            ],
            "gap_refs": []
          },
          {
            "invariant_ref": "technical-decisions-remain-explainable",
            "disposition": "not_relevant",
            "reason": "本轮仅执行 Completion Review，不建立或修改架构、数据所有权、适配器边界或技术约束。",
            "fact_refs": [],
            "evidence": [],
            "gap_refs": []
          },
          {
            "invariant_ref": "accepted-facts-are-realized",
            "disposition": "upheld",
            "reason": "Renderer 直接输出问题原文、状态和进展，并在验收问题提交后保留当前或较新的有效选择；聚焦与完整回归均通过。",
            "fact_refs": [
              "FACT-20260904-001-001",
              "FACT-20260904-001-003"
            ],
            "evidence": [
              "runtime/arcorbit/desktop/renderer/renderer.js",
              "runtime/arcorbit/test/today-workspace.test.mjs",
              "runtime/arcorbit/test/desktop-renderer.test.mjs",
              "npm test --workspace @arckit/arcorbit outside GUI-restricted sandbox: 568 passed, 24 skipped, 0 failed"
            ],
            "gap_refs": []
          },
          {
            "invariant_ref": "material-risks-have-credible-evidence",
            "disposition": "upheld",
            "reason": "折叠内容、无条件清空选择及旧回调覆盖较新选择三项主要风险均由明确实现分支、聚焦回归和正确权限环境下的完整套件控制。",
            "fact_refs": [
              "FACT-20260904-001-003"
            ],
            "evidence": [
              "runtime/arcorbit/desktop/renderer/renderer.js",
              "node --test runtime/arcorbit/test/today-workspace.test.mjs runtime/arcorbit/test/desktop-renderer.test.mjs: 74 passed, 0 failed",
              "npm test --workspace @arckit/arcorbit outside GUI-restricted sandbox: 568 passed, 24 skipped, 0 failed",
              "git diff --check: passed"
            ],
            "gap_refs": []
          }
        ]
      },
      "evidence": [
        "arckit/interaction/today-workspace/interaction.md",
        "arckit/interaction/today-workspace/action-details.html",
        "runtime/arcorbit/desktop/renderer/renderer.js",
        "runtime/arcorbit/test/today-workspace.test.mjs",
        "runtime/arcorbit/test/desktop-renderer.test.mjs",
        "node --test runtime/arcorbit/test/today-workspace.test.mjs runtime/arcorbit/test/desktop-renderer.test.mjs: 74 passed, 0 failed",
        "npm test --workspace @arckit/arcorbit outside GUI-restricted sandbox: 568 passed, 24 skipped, 0 failed",
        "node --check runtime/arcorbit/desktop/renderer/renderer.js: passed",
        "git diff --check: passed"
      ],
      "runtime_result_ref": "arckit-runtime://runs/RUN-20260904-062749520Z-f80b7f67",
      "occurred_at": "2026-09-04T06:41:01.178Z"
    }
  ],
  "case_resolution": {
    "status": "resolved",
    "stage": "resolved",
    "satisfied": [
      "GAP-20260904-001-001"
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
    "updated_at": "2026-09-04T06:41:01.178Z"
  }
}
```

## Round Notes

- Case history is canonical in Structured Record.rounds; keep prose notes exceptional.
