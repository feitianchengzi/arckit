# 允许所有可访问项目成员绑定本地工作区

Case: CASE-20260830-001
Status: closed
Artifact Type: mixed
Selected Gap: none
Updated: 2026-08-30T09:01:25.875Z

## User Intent

纠正 ArcOrbit 将本地目录绑定误判为项目管理员操作的产品语义、交互和实现，使能够访问远端项目的任意角色成员都能在自己的设备绑定本地工作区。

## Structured Record

```json
{
  "schema_version": "development-case-record/v5",
  "id": "CASE-20260830-001",
  "title": "允许所有可访问项目成员绑定本地工作区",
  "status": "closed",
  "artifact_type": "mixed",
  "created_at": "2026-08-30T08:43:40.503Z",
  "updated_at": "2026-08-30T09:01:25.875Z",
  "user_intent": "纠正 ArcOrbit 将本地目录绑定误判为项目管理员操作的产品语义、交互和实现，使能够访问远端项目的任意角色成员都能在自己的设备绑定本地工作区。",
  "expected_outcome": "Chat、Organization、Today、Work 和 Automation 中，任何可访问项目的成员都可以选择并绑定本地目录；提示不再要求 Project owner/admin；项目 participation、项目事实编辑、邀请和成员管理等远端治理动作继续按既有角色授权。",
  "project_state_ref": "arckit/project/state.record.json",
  "current_round": {
    "goal": "",
    "selected_gap": null
  },
  "facts": [
    {
      "id": "FACT-20260830-001-001",
      "revision": 1,
      "status": "accepted",
      "statement": "本地目录绑定是当前成员设备上的本地 Workspace Control 行为；只要成员能够访问该远端项目，无论其项目角色为何，都应能为自己绑定本地目录。",
      "basis": "当前操作者明确澄清产品权限边界。",
      "evidence": [
        "Current operator input, 2026-08-30"
      ]
    },
    {
      "id": "FACT-20260830-001-002",
      "revision": 1,
      "status": "accepted",
      "statement": "当前实现把本地目录绑定错误地限制为 owner/admin：Chat 过滤普通成员项目，Organization 隐藏绑定按钮，Today、Work 和 Automation 将缺少绑定投影为管理员 handoff；底层 bindProject 实际仅维护 Desktop 本地 project_bindings，不执行远端角色授权。",
      "basis": "相关 Renderer、guidance 与 Coordinator 调用链的静态逻辑完整解释了用户看到的提示和不可操作状态。",
      "evidence": [
        "runtime/arcorbit/desktop/renderer/renderer.js:1468",
        "runtime/arcorbit/desktop/renderer/renderer.js:1528",
        "runtime/arcorbit/desktop/renderer/renderer.js:1535",
        "runtime/arcorbit/desktop/renderer/renderer.js:1926",
        "runtime/arcorbit/desktop/renderer/renderer.js:1931",
        "runtime/arcorbit/src/desktop/today-guidance.mjs:122",
        "runtime/arcorbit/src/desktop/today-guidance.mjs:167",
        "runtime/arcorbit/src/desktop/today-guidance.mjs:189",
        "runtime/arcorbit/src/automation-coordinator.mjs:215",
        "runtime/arcorbit/src/automation-coordinator.mjs:753",
        "arckit/interaction/today-workspace/readiness-details.html:65"
      ]
    },
    {
      "id": "FACT-20260830-001-003",
      "revision": 1,
      "status": "accepted",
      "statement": "ArcOrbit 已将项目本地目录绑定实现为当前登录成员和当前设备的本地 Workspace Control：所有可访问项目的 owner、admin 和 member 均能从 Chat、Organization、Today、Work 与 Automation 选择本地目录；project participation、项目事实编辑、邀请和成员管理等远端治理动作仍保持既有角色限制。",
      "basis": "实现、持久规格、页面级交互事实和分层自动化回归一致证明该权限边界已经兑现。",
      "evidence": [
        "runtime/arcorbit/desktop/renderer/renderer.js",
        "runtime/arcorbit/src/desktop/today-guidance.mjs",
        "arckit/spec/agentic-software-development/arcorbit-organization-management.md",
        "runtime/arcorbit/test/today-guidance.test.mjs",
        "runtime/arcorbit/test/organization-center-electron.test.mjs",
        "Verification: npm run check completed with 0 failures"
      ]
    }
  ],
  "state_impacts": [
    {
      "id": "IMPACT-20260830-001-001",
      "fact_id": "FACT-20260830-001-003",
      "fact_revision": 1,
      "target": {
        "kind": "software_decision",
        "ref": "product_capabilities",
        "revision": 41
      },
      "effect": "upheld",
      "reason": "本地绑定与执行资格、同步就绪和远端治理授权已在实现与规格中明确分离。",
      "gap_ids": [],
      "evidence": [
        "arckit/spec/agentic-software-development/arcorbit-organization-management.md",
        "runtime/arcorbit/desktop/renderer/renderer.js",
        "runtime/arcorbit/src/desktop/today-guidance.mjs"
      ]
    },
    {
      "id": "IMPACT-20260830-001-002",
      "fact_id": "FACT-20260830-001-003",
      "fact_revision": 1,
      "target": {
        "kind": "software_decision",
        "ref": "experience_and_interaction",
        "revision": 63
      },
      "effect": "upheld",
      "reason": "所有相关入口均向可访问项目的当前成员提供本地绑定动作，错误的管理员交接提示已移除。",
      "gap_ids": [],
      "evidence": [
        "arckit/interaction/today-workspace/readiness-details.html",
        "arckit/interaction/chat-workspace/workspace-setup.html",
        "arckit/interaction/task-browser/readiness-guidance.html",
        "arckit/interaction/platform-workspace/collaboration-views.html",
        "runtime/arcorbit/desktop/renderer/renderer.js"
      ]
    },
    {
      "id": "IMPACT-20260830-001-003",
      "fact_id": "FACT-20260830-001-003",
      "fact_revision": 1,
      "target": {
        "kind": "software_invariant",
        "ref": "accepted-facts-are-realized",
        "revision": null
      },
      "effect": "upheld",
      "reason": "实际 Renderer、guidance 和生产 Electron 行为已经兑现操作者确认的本地 Workspace Control 权限边界。",
      "gap_ids": [],
      "evidence": [
        "runtime/arcorbit/test/desktop-renderer.test.mjs",
        "runtime/arcorbit/test/today-guidance.test.mjs",
        "runtime/arcorbit/test/organization-center-electron.test.mjs",
        "Verification: npm run check completed with 0 failures"
      ]
    }
  ],
  "gaps": [
    {
      "id": "GAP-20260830-001-001",
      "status": "resolved",
      "goal": "使所有可访问项目成员都能从 Chat、Organization、Today、Work 和 Automation 绑定自己的本地工作区，纠正持久交互说明并补充角色边界回归测试，同时保持 project participation 等远端治理动作的 owner/admin 限制。",
      "reason": "产品权限边界已经由操作者明确，且实现证据证明错误来自本地绑定与项目管理权限的耦合。",
      "derived_from": [
        "FACT-20260830-001-001",
        "FACT-20260830-001-002"
      ],
      "blocked_by": [],
      "priority_basis": {
        "blocking": "普通成员无法建立 Chat 和本地 Automation 所需的工作区。",
        "uncertainty": "低；静态调用链完整解释现象，绑定底层无角色校验。",
        "risk": "中；修复必须避免同时放开独立的远端项目授权与治理动作。",
        "user_impact": "高；所有非 owner/admin 的可访问项目成员均可能受影响。"
      },
      "responsibility": "agent",
      "evidence_required": [
        "普通 member 项目在所有相关入口显示并可执行“选择本地目录”。",
        "owner/admin 与 member 的本地绑定结果一致写入 Desktop 本地 binding。",
        "project participation、项目事实编辑、邀请和成员管理仍保持既有角色限制。",
        "相关 guidance、Renderer、持久交互文档与自动化测试通过。"
      ],
      "resolution": {
        "id": "GAP-20260830-001-001",
        "status": "resolved",
        "outcome": "resolved",
        "reason": "相关入口、guidance、持久规格和交互说明已统一采用本地绑定权限边界，并由聚焦、Electron 和完整测试证明普通 member 可绑定且远端 participation 仍受限制。",
        "evidence": [
          "runtime/arcorbit/src/desktop/today-guidance.mjs",
          "runtime/arcorbit/desktop/renderer/renderer.js",
          "arckit/spec/agentic-software-development/arcorbit-organization-management.md",
          "arckit/interaction/today-workspace/interaction.md",
          "arckit/interaction/chat-workspace/interaction.md",
          "arckit/interaction/automation-workspace/interaction.md",
          "arckit/interaction/task-browser/interaction.md",
          "arckit/interaction/platform-workspace/interaction.md",
          "runtime/arcorbit/test/today-guidance.test.mjs",
          "runtime/arcorbit/test/desktop-renderer.test.mjs",
          "runtime/arcorbit/test/organization-center-electron.test.mjs",
          "Verification: 75 focused tests passed with 0 failures",
          "Verification: Electron organization-center member-role regression passed",
          "Verification: npm run check completed with 570 tests, 548 passed, 22 skipped, 0 failed",
          "Verification: git diff --check passed"
        ],
        "occurred_at": "2026-08-30T08:59:53.203Z"
      }
    }
  ],
  "content_revision": 1,
  "completion_review": {
    "status": "clean",
    "policy": {
      "initial_max_cycles": 10,
      "source": "runtime/arcorbit/config/case-policy.json",
      "snapshotted_at": "2026-08-30T08:43:40.503Z"
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
          "Implementation review: runtime/arcorbit/desktop/renderer/renderer.js only removes project-role filtering from local binding paths while retaining participation role checks",
          "Implementation review: runtime/arcorbit/src/desktop/today-guidance.mjs keeps enable_project and task mutation handoffs role-restricted",
          "Problem-resolution review: Chat, Organization, Today, Work and Automation all expose bind_workspace to accessible member projects",
          "Regression review: runtime/arcorbit/test/today-guidance.test.mjs verifies member binding and administrator-only participation independently",
          "Regression review: runtime/arcorbit/test/organization-center-electron.test.mjs verifies memberProjectHasBindingAction=true and memberProjectHasParticipationAction=false",
          "Verification: 75 focused tests passed with 0 failures",
          "Verification: production Electron organization-center member-role regression passed",
          "Verification: npm run check completed with 570 tests, 548 passed, 22 skipped, 0 failed",
          "Verification: git diff --check passed",
          "Review search: obsolete administrator-binding prompts occur only inside a negative regression assertion",
          "Minimality review: changes are limited to binding guidance/visibility, matching regression coverage, and synchronized durable specification/interaction evidence"
        ],
        "occurred_at": "2026-08-30T09:01:25.875Z"
      }
    ],
    "evidence": [
      "Implementation review: runtime/arcorbit/desktop/renderer/renderer.js only removes project-role filtering from local binding paths while retaining participation role checks",
      "Implementation review: runtime/arcorbit/src/desktop/today-guidance.mjs keeps enable_project and task mutation handoffs role-restricted",
      "Problem-resolution review: Chat, Organization, Today, Work and Automation all expose bind_workspace to accessible member projects",
      "Regression review: runtime/arcorbit/test/today-guidance.test.mjs verifies member binding and administrator-only participation independently",
      "Regression review: runtime/arcorbit/test/organization-center-electron.test.mjs verifies memberProjectHasBindingAction=true and memberProjectHasParticipationAction=false",
      "Verification: 75 focused tests passed with 0 failures",
      "Verification: production Electron organization-center member-role regression passed",
      "Verification: npm run check completed with 570 tests, 548 passed, 22 skipped, 0 failed",
      "Verification: git diff --check passed",
      "Review search: obsolete administrator-binding prompts occur only inside a negative regression assertion",
      "Minimality review: changes are limited to binding guidance/visibility, matching regression coverage, and synchronized durable specification/interaction evidence"
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
      "goal": "解除本地 Workspace Control 与项目管理角色的错误耦合，同时保持远端项目治理授权不变。",
      "outcome": "completed",
      "gap_selection": {
        "mode": "candidate",
        "basis": "fresh ledger snapshot 仍为 Project revision 324、Case content revision 0；使用 CASE-20260830-001 的 Case-scoped selection token 6cd9d88b13c78948eff9481b34d8e06018711c34a43856e38c420a3a37192a6e 比较全部持久候选。当前 Case Gap 直接阻塞普通成员建立 Chat 和 Automation 所需本地工作区，用户影响最高且无依赖。",
        "snapshot_token": "6cd9d88b13c78948eff9481b34d8e06018711c34a43856e38c420a3a37192a6e",
        "selected_ref": "case-gap:CASE-20260830-001:GAP-20260830-001-001",
        "comparison_summary": "选择当前 Case 中 ready 的成员本地绑定 Gap；四项 Project Gap 均需另建 Case，且不应抢占当前明确的高影响用户缺陷。",
        "fresh_discovery_summary": "fresh state、实现、文档和验证未显露新的本轮候选。",
        "considered": [
          {
            "ref": "case-gap:CASE-20260830-001:GAP-20260830-001-001",
            "source": "persisted",
            "eligibility": "ready",
            "disposition": "selected",
            "priority_basis": {
              "blocking": "普通成员无法建立 Chat 和本地 Automation 所需的工作区。",
              "uncertainty": "低；实现调用链完整解释现象。",
              "risk": "中；必须保持远端治理角色边界。",
              "user_impact": "高；所有非 owner/admin 的可访问成员均可能受影响。"
            },
            "reason": "唯一可直接推进且与当前操作者输入完全对应的 Case Gap。"
          },
          {
            "ref": "project-gap:GAP-agent-scenario-evaluation",
            "source": "persisted",
            "eligibility": "case_required",
            "disposition": "deferred",
            "priority_basis": {
              "blocking": "不阻塞当前本地绑定修复。",
              "uncertainty": "高。",
              "risk": "高。",
              "user_impact": "低于当前显性成员阻塞。"
            },
            "reason": "需要独立真实软件场景 Case。"
          },
          {
            "ref": "project-gap:GAP-runtime-resilience-and-adapters",
            "source": "persisted",
            "eligibility": "case_required",
            "disposition": "deferred",
            "priority_basis": {
              "blocking": "不阻塞当前本地绑定修复。",
              "uncertainty": "中。",
              "risk": "高。",
              "user_impact": "当前较低。"
            },
            "reason": "属于独立 Runtime 韧性与 adapter 验收范围。"
          },
          {
            "ref": "project-gap:GAP-security-real-project-validation",
            "source": "persisted",
            "eligibility": "case_required",
            "disposition": "deferred",
            "priority_basis": {
              "blocking": "不阻塞当前修复。",
              "uncertainty": "中。",
              "risk": "高。",
              "user_impact": "当前较低。"
            },
            "reason": "需要独立的真实权限项目验证 Case。"
          },
          {
            "ref": "project-gap:GAP-cross-record-audit",
            "source": "persisted",
            "eligibility": "case_required",
            "disposition": "deferred",
            "priority_basis": {
              "blocking": "不阻塞当前修复。",
              "uncertainty": "中。",
              "risk": "高。",
              "user_impact": "当前较低。"
            },
            "reason": "属于独立跨记录审计验收。"
          }
        ]
      },
      "selected_gap": {
        "id": "GAP-20260830-001-001",
        "responsibility": "agent",
        "goal": "使所有可访问项目成员都能从 Chat、Organization、Today、Work 和 Automation 绑定自己的本地工作区，纠正持久交互说明并补充角色边界回归测试，同时保持 project participation 等远端治理动作的 owner/admin 限制。",
        "reason": "产品权限边界已经由操作者明确，且实现证据证明错误来自本地绑定与项目管理权限的耦合。",
        "derived_from": [
          "FACT-20260830-001-001",
          "FACT-20260830-001-002"
        ],
        "blocked_by": [],
        "priority_basis": {
          "blocking": "普通成员无法建立 Chat 和本地 Automation 所需的工作区。",
          "uncertainty": "低；静态调用链完整解释现象，绑定底层无角色校验。",
          "risk": "中；修复必须避免同时放开独立的远端项目授权与治理动作。",
          "user_impact": "高；所有非 owner/admin 的可访问项目成员均可能受影响。"
        },
        "evidence_required": [
          "普通 member 项目在所有相关入口显示并可执行“选择本地目录”。",
          "owner/admin 与 member 的本地绑定结果一致写入 Desktop 本地 binding。",
          "project participation、项目事实编辑、邀请和成员管理仍保持既有角色限制。",
          "相关 guidance、Renderer、持久交互文档与自动化测试通过。"
        ]
      },
      "planned_transition": {
        "goal": "解除本地 Workspace Control 与项目管理角色的错误耦合，同时保持远端项目治理授权不变。",
        "expected_state_change": "普通 member 与 owner/admin 在 Chat、Organization、Today、Work、Automation 获得相同本地目录绑定能力；只有 project participation 等远端治理动作继续按角色限制。"
      },
      "accepted_state_delta": {
        "resolved_gap": {
          "id": "GAP-20260830-001-001",
          "status": "resolved",
          "outcome": "resolved",
          "reason": "相关入口、guidance、持久规格和交互说明已统一采用本地绑定权限边界，并由聚焦、Electron 和完整测试证明普通 member 可绑定且远端 participation 仍受限制。",
          "evidence": [
            "runtime/arcorbit/src/desktop/today-guidance.mjs",
            "runtime/arcorbit/desktop/renderer/renderer.js",
            "arckit/spec/agentic-software-development/arcorbit-organization-management.md",
            "arckit/interaction/today-workspace/interaction.md",
            "arckit/interaction/chat-workspace/interaction.md",
            "arckit/interaction/automation-workspace/interaction.md",
            "arckit/interaction/task-browser/interaction.md",
            "arckit/interaction/platform-workspace/interaction.md",
            "runtime/arcorbit/test/today-guidance.test.mjs",
            "runtime/arcorbit/test/desktop-renderer.test.mjs",
            "runtime/arcorbit/test/organization-center-electron.test.mjs",
            "Verification: 75 focused tests passed with 0 failures",
            "Verification: Electron organization-center member-role regression passed",
            "Verification: npm run check completed with 570 tests, 548 passed, 22 skipped, 0 failed",
            "Verification: git diff --check passed"
          ]
        },
        "facts_added": [
          {
            "id": "FACT-20260830-001-003",
            "revision": 1,
            "status": "accepted",
            "statement": "ArcOrbit 已将项目本地目录绑定实现为当前登录成员和当前设备的本地 Workspace Control：所有可访问项目的 owner、admin 和 member 均能从 Chat、Organization、Today、Work 与 Automation 选择本地目录；project participation、项目事实编辑、邀请和成员管理等远端治理动作仍保持既有角色限制。",
            "basis": "实现、持久规格、页面级交互事实和分层自动化回归一致证明该权限边界已经兑现。",
            "evidence": [
              "runtime/arcorbit/desktop/renderer/renderer.js",
              "runtime/arcorbit/src/desktop/today-guidance.mjs",
              "arckit/spec/agentic-software-development/arcorbit-organization-management.md",
              "runtime/arcorbit/test/today-guidance.test.mjs",
              "runtime/arcorbit/test/organization-center-electron.test.mjs",
              "Verification: npm run check completed with 0 failures"
            ]
          }
        ],
        "facts_superseded": [],
        "impacts_added": [],
        "impacts_updated": [
          {
            "id": "IMPACT-20260830-001-001",
            "fact_id": "FACT-20260830-001-003",
            "fact_revision": 1,
            "target": {
              "kind": "software_decision",
              "ref": "product_capabilities",
              "revision": 41
            },
            "effect": "upheld",
            "reason": "本地绑定与执行资格、同步就绪和远端治理授权已在实现与规格中明确分离。",
            "gap_ids": [],
            "evidence": [
              "arckit/spec/agentic-software-development/arcorbit-organization-management.md",
              "runtime/arcorbit/desktop/renderer/renderer.js",
              "runtime/arcorbit/src/desktop/today-guidance.mjs"
            ]
          },
          {
            "id": "IMPACT-20260830-001-002",
            "fact_id": "FACT-20260830-001-003",
            "fact_revision": 1,
            "target": {
              "kind": "software_decision",
              "ref": "experience_and_interaction",
              "revision": 63
            },
            "effect": "upheld",
            "reason": "所有相关入口均向可访问项目的当前成员提供本地绑定动作，错误的管理员交接提示已移除。",
            "gap_ids": [],
            "evidence": [
              "arckit/interaction/today-workspace/readiness-details.html",
              "arckit/interaction/chat-workspace/workspace-setup.html",
              "arckit/interaction/task-browser/readiness-guidance.html",
              "arckit/interaction/platform-workspace/collaboration-views.html",
              "runtime/arcorbit/desktop/renderer/renderer.js"
            ]
          },
          {
            "id": "IMPACT-20260830-001-003",
            "fact_id": "FACT-20260830-001-003",
            "fact_revision": 1,
            "target": {
              "kind": "software_invariant",
              "ref": "accepted-facts-are-realized",
              "revision": null
            },
            "effect": "upheld",
            "reason": "实际 Renderer、guidance 和生产 Electron 行为已经兑现操作者确认的本地 Workspace Control 权限边界。",
            "gap_ids": [],
            "evidence": [
              "runtime/arcorbit/test/desktop-renderer.test.mjs",
              "runtime/arcorbit/test/today-guidance.test.mjs",
              "runtime/arcorbit/test/organization-center-electron.test.mjs",
              "Verification: npm run check completed with 0 failures"
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
            "observed_revision": 40,
            "set_decision": {
              "status": "settled",
              "statement": "ArcOrbit 保留既有 Desktop、Runtime、Chat、Automation、Feedback 与 Work 能力和边界。Work 是 Workshop 待办同步与本地 Task Projection 的唯一客户端所有者；新建和编辑 Sheet 提供完整七状态，编辑 Sheet 是异常纠偏兜底，Inspector 按当前状态提供有限下一步动作。Work Inspector 默认更宽，支持可访问拖拽调宽与跨应用重启恢复，并使用内容、紧凑属性、协作和验收语义分区。Work 编辑待办允许把内容复制到当前产品集内另一个可写产品，并在目标创建获 Workshop 确认后删除源 Task。目标 Task 获得新身份，仅复制正文、状态、优先级及目标产品内重新选择的关联字段，不继承评论、附件、Run、session、thread、Gate 或验收问题。Work 负责两阶段 mutation 和部分成功恢复；Automation 只消费服务器确认后的本地状态。Setup Readiness 在应用冷启动时 fresh-check Desktop Store 中全部已关联本地项目相对于内置 payload 的 skill drift；新增或改变本地项目关联及用户主动重试会再次检查。项目集、具体项目、Workset 等纯查看切换、解除关联和 task start 不重新扫描 skills，task start 只消费已验证缓存并 fail closed。trusted Case binding 的既有能力和边界保持不变。Setup Readiness 对同名项目 skill、loader、共享资源和用户按需 catalog 冲突保留 typed diagnostic；当 provider 证明安全目标与唯一内置来源时，用户可逐项选择“备份并使用当前应用包覆盖所选同名 skill”，未选和无关内容保持不变。Feedback 中已忽略且未关联待办的反馈可恢复为待处理，恢复只在服务端确认 pending 后生效。Today、Work、Automation 与 Organization 必须从同一可访问 Project Catalog 得到项目身份；项目存在、项目绑定、同步就绪和执行资格彼此独立，项目详情同步失败不得使项目消失。任何能够访问 Project Catalog 中项目的当前成员，无论 owner、admin 或 member，均可在自己的设备选择、变更或解除该项目的本地工作区绑定；该绑定只更新 Desktop 本地 Workspace Control，不等同于 project participation 或项目治理授权。Codex Setup 维护完整 installation inventory 与唯一 active binding，按 execution scope 和 owner 证明选择既有安装、生成安装建议、检查更新并在 mutation 后复验实际 executable；更新查询失败不把健康 Codex 降级为未安装。",
              "reason": "本地目录绑定属于当前设备的 Workspace Control，而非远端项目治理；显式记录角色无关性可防止界面再次把它误判为管理员操作。",
              "evidence": [
                "Current operator input, 2026-08-30",
                "arckit/spec/agentic-software-development/arcorbit-organization-management.md",
                "runtime/arcorbit/desktop/renderer/renderer.js",
                "runtime/arcorbit/src/desktop/today-guidance.mjs"
              ],
              "confidence": "high",
              "resume_condition": "当本地 project binding 的所有权、Project Catalog 可访问性或远端 participation 授权模型改变时重审。"
            },
            "gap_refs": [
              "GAP-agent-scenario-evaluation"
            ],
            "reason": "使 Project State 可恢复本轮确立并实现的稳定产品权限边界。",
            "evidence": [
              "Current operator input, 2026-08-30",
              "arckit/spec/agentic-software-development/arcorbit-organization-management.md",
              "Verification: npm run check completed with 0 failures"
            ]
          },
          {
            "area_ref": "experience_and_interaction",
            "observed_revision": 62,
            "set_decision": {
              "status": "settled",
              "statement": "ArcOrbit 保持既有 Personal、Product Lifecycle、Organization 导航与 Work、Automation、Feedback、Chat 等交互语义。Work 新建和编辑 Sheet 保留完整七状态，编辑 Sheet 承担异常纠偏；右侧 Inspector 按当前状态显示有限下一步动作。Work Inspector 首次使用 440px，用户可通过 12px 可访问分隔条在 360–640px 保存范围内拖拽、键盘调整或双击复位，偏好跨任务、项目、Workset 和应用重启恢复。布局为任务树保留至少 420px，窗口临时收窄只改变有效宽度且不覆盖保存值。Inspector 以单一内部滚动区组织身份动作、内容、紧凑属性、协作和按状态出现的验收分区，宽度变化不丢失选择、滚动、草稿或附件状态。验收问题条目的问题原文与进展文本在 Inspector 当前可用宽度内完整折行且不横向越界，状态徽标保持清晰可见。Work 已完成列表按新完成在上、历史完成在下排列；标记首项为已验收后选择下一条较旧待办，标记其他位置后选择相邻较新待办，树补全项不参与目标计算，且选择只在服务器确认成功后切换。验收请求期间允许浏览其他任务；若用户在服务器确认前产生较新的选择，成功回调保留该选择而不执行旧任务的自动相邻切换。Work 新建待办 Sheet 在执行人控件下根据执行人与状态原位解释 Automation 资格。跨产品替换、主窗口和 Case 绑定恢复的既有交互保持不变。应用冷启动检查全部关联本地项目；新增或改变本地关联及用户主动重试再次检查。项目集全部、具体项目、Workset 或其它纯查看切换只改变业务投影，不进入 Setup；解除关联和 task start 不重新扫描 skills。task start 缓存断言失败时返回 Setup，等待用户主动重新检查。Setup 冲突页逐项显示稳定 code、skill、目标类型与路径及双方 digest；兜底覆盖默认全不选，支持逐项或全选可恢复项，独立确认 recovery root 与 fresh assessment digest，并反馈备份、替换、回滚和残留状态。Feedback 已忽略且未关联待办的详情显示“恢复为待处理”；动作无需二次确认，提交期间锁定自身，只有服务端确认 pending 后更新状态，失败时保持 ignored、筛选、选择和滚动位置。受支持旧版本覆盖安装后，Automation 先恢复 Catalog 项目行并保留 Workset、绑定和项目授权，再逐项目显示正在恢复、同步异常或可执行；用户无需退出登录、清缓存或重新添加项目。Automation 顶层责任只区分可自行继续与需要人工介入；external、recovery、configuration 与 CLI 保留为原因或处理场所，任何必须由操作者动作触发的下一步都显示 Human。external dependency 创建 attention，并通过“已处理，重新检查”恢复同一 task session/thread。Workset Feedback V2 沟通记录在首次选择和 fresh notification snapshot 标记当前反馈有未读回复时自动重新拉取消息；页面级、详情级和沟通记录的手动刷新均同时刷新反馈事实、通知与当前会话。消息成功加载后才标记已读；失败时保留旧消息和重试入口；刷新不得丢失回复草稿、附件选择或 Inspector 滚动上下文。Chat、Organization、Today、Work 与 Automation 对缺失本地目录的可访问项目均向当前用户提供“选择本地目录”；只有 project participation、项目事实编辑、邀请和成员管理等远端治理动作才按 owner/admin 角色显示 handoff 或管理操作。",
              "reason": "本地绑定是当前成员可直接完成的设备行为，交互必须将其与需要管理员权限的远端治理动作清晰分开。",
              "evidence": [
                "Current operator input, 2026-08-30",
                "arckit/interaction/today-workspace/interaction.md",
                "arckit/interaction/chat-workspace/interaction.md",
                "arckit/interaction/automation-workspace/interaction.md",
                "arckit/interaction/task-browser/interaction.md",
                "arckit/interaction/platform-workspace/interaction.md"
              ],
              "confidence": "high",
              "resume_condition": "当本地绑定入口、Project Catalog 可访问规则或远端治理角色模型改变时重审。"
            },
            "gap_refs": [],
            "reason": "持久化所有受影响页面的一致动作、反馈和管理员 handoff 边界。",
            "evidence": [
              "arckit/interaction/today-workspace/readiness-details.html",
              "arckit/interaction/chat-workspace/workspace-setup.html",
              "arckit/interaction/task-browser/readiness-guidance.html",
              "arckit/interaction/platform-workspace/collaboration-views.html"
            ]
          }
        ],
        "software_invariant_changes": [],
        "project_gap_changes": [],
        "selection_context_change": null,
        "evidence": [
          "Current operator input, 2026-08-30",
          "arckit/spec/agentic-software-development/arcorbit-organization-management.md",
          "arckit/interaction/INDEX.md",
          "Verification: npm run check completed with 0 failures"
        ]
      },
      "invariant_assessment": {
        "project_revision": 324,
        "judgments": [
          {
            "invariant_ref": "product-expectations-remain-recoverable",
            "disposition": "upheld",
            "reason": "角色无关的本地绑定能力及其与远端治理的边界已进入产品规格和 Project decision。",
            "fact_refs": [
              "FACT-20260830-001-003"
            ],
            "evidence": [
              "arckit/spec/agentic-software-development/arcorbit-organization-management.md",
              "arckit/spec/INDEX.md"
            ],
            "gap_refs": []
          },
          {
            "invariant_ref": "interaction-expectations-remain-recoverable",
            "disposition": "upheld",
            "reason": "Chat、Organization、Today、Work 与 Automation 的动作、提示和 handoff 规则已在页面级交互文档与灰度线框中一致记录。",
            "fact_refs": [
              "FACT-20260830-001-003"
            ],
            "evidence": [
              "arckit/interaction/today-workspace/interaction.md",
              "arckit/interaction/chat-workspace/interaction.md",
              "arckit/interaction/automation-workspace/interaction.md",
              "arckit/interaction/task-browser/interaction.md",
              "arckit/interaction/platform-workspace/interaction.md",
              "arckit/interaction/INDEX.md"
            ],
            "gap_refs": []
          },
          {
            "invariant_ref": "visual-language-remains-consistent",
            "disposition": "not_relevant",
            "reason": "本轮仅纠正权限语义、文案和既有动作可见性，没有改变视觉 token、主题、组件样式或布局规则。",
            "fact_refs": [],
            "evidence": [],
            "gap_refs": []
          },
          {
            "invariant_ref": "technical-decisions-remain-explainable",
            "disposition": "upheld",
            "reason": "实现继续由 Renderer/guidance 判断可执行动作，底层 bindProject 仍只维护 Desktop 本地 binding；远端 participation 分支保持独立角色检查。",
            "fact_refs": [
              "FACT-20260830-001-003"
            ],
            "evidence": [
              "runtime/arcorbit/desktop/renderer/renderer.js",
              "runtime/arcorbit/src/desktop/today-guidance.mjs",
              "runtime/arcorbit/src/platform-coordinator.mjs",
              "arckit/spec/agentic-software-development/arcorbit-organization-management.md"
            ],
            "gap_refs": []
          },
          {
            "invariant_ref": "accepted-facts-are-realized",
            "disposition": "upheld",
            "reason": "生产 Renderer、guidance 和 Electron 回归共同证明 member 获得本地绑定动作，而 participation 管理动作仍未向 member 开放。",
            "fact_refs": [
              "FACT-20260830-001-001",
              "FACT-20260830-001-002",
              "FACT-20260830-001-003"
            ],
            "evidence": [
              "runtime/arcorbit/test/today-guidance.test.mjs",
              "runtime/arcorbit/test/desktop-renderer.test.mjs",
              "runtime/arcorbit/test/fixtures/organization-center-electron.mjs",
              "runtime/arcorbit/test/organization-center-electron.test.mjs",
              "Verification: Electron organization-center member-role regression passed"
            ],
            "gap_refs": []
          },
          {
            "invariant_ref": "material-risks-have-credible-evidence",
            "disposition": "upheld",
            "reason": "角色边界由 guidance 单元测试、Renderer 静态回归、生产 Electron 行为和完整 ArcOrbit 套件分层覆盖，完整验证无失败。",
            "fact_refs": [
              "FACT-20260830-001-003"
            ],
            "evidence": [
              "runtime/arcorbit/test/today-guidance.test.mjs",
              "runtime/arcorbit/test/desktop-renderer.test.mjs",
              "runtime/arcorbit/test/organization-center-electron.test.mjs",
              "Verification: 75 focused tests passed with 0 failures",
              "Verification: Electron organization-center member-role regression passed",
              "Verification: npm run check completed with 570 tests, 548 passed, 22 skipped, 0 failed"
            ],
            "gap_refs": []
          }
        ]
      },
      "evidence": [
        "Current operator input, 2026-08-30",
        "runtime/arcorbit/src/desktop/today-guidance.mjs",
        "runtime/arcorbit/desktop/renderer/renderer.js",
        "arckit/spec/agentic-software-development/arcorbit-organization-management.md",
        "arckit/interaction/INDEX.md",
        "runtime/arcorbit/test/today-guidance.test.mjs",
        "runtime/arcorbit/test/desktop-renderer.test.mjs",
        "runtime/arcorbit/test/organization-center-electron.test.mjs",
        "Verification: npm run check completed with 0 failures",
        "Verification: git diff --check passed",
        "Verification: no ARC_DEBUG markers or arckit/debug logs remain"
      ],
      "runtime_result_ref": "arckit-runtime://runs/RUN-20260830-084114582Z-014de504",
      "occurred_at": "2026-08-30T08:59:53.203Z"
    },
    {
      "round": 2,
      "transition_schema_version": "arckit-case-transition/v8",
      "goal": "独立审查已完成的本地工作区绑定修复在正确性、真实问题解决、验证可信度、回归风险和最小性五个维度上的完成质量。",
      "outcome": "completed",
      "gap_selection": {
        "mode": "candidate",
        "basis": "使用 CASE-20260830-001 的 fresh Case-scoped selection token b1d887885da7c117c087ef4131d4135bc30c49e0767d9ca5ffbdfa9f69eed9f9 比较全部候选。所有普通 Case gaps 与 impacts 已关闭，completion review 是唯一 ready 且直接阻塞 Case 完成的候选。",
        "snapshot_token": "b1d887885da7c117c087ef4131d4135bc30c49e0767d9ca5ffbdfa9f69eed9f9",
        "selected_ref": "case-gap:CASE-20260830-001:CASE-20260830-001:completion-review:1",
        "comparison_summary": "选择 CASE-20260830-001 completion review；四项 Project Gap 均需独立 Case，不能抢占当前 Case 的完成门禁。",
        "fresh_discovery_summary": "审查实现、测试、规格和交互差异后未发现 fresh candidate 或 review finding。",
        "considered": [
          {
            "ref": "case-gap:CASE-20260830-001:CASE-20260830-001:completion-review:1",
            "source": "persisted",
            "eligibility": "ready",
            "disposition": "selected",
            "priority_basis": {
              "blocking": "高；是当前 Case 唯一剩余完成门禁。",
              "uncertainty": "低；实现和验证证据完整。",
              "risk": "高；需独立检查权限回归和问题是否真实解决。",
              "user_impact": "高；决定成员本地绑定修复能否结束。"
            },
            "reason": "唯一 ready 的 Case 内候选。"
          },
          {
            "ref": "project-gap:GAP-agent-scenario-evaluation",
            "source": "persisted",
            "eligibility": "case_required",
            "disposition": "deferred",
            "priority_basis": {
              "blocking": "不阻塞当前 Case completion review。",
              "uncertainty": "高。",
              "risk": "高。",
              "user_impact": "低于当前完成门禁。"
            },
            "reason": "需要独立场景验证 Case。"
          },
          {
            "ref": "project-gap:GAP-runtime-resilience-and-adapters",
            "source": "persisted",
            "eligibility": "case_required",
            "disposition": "deferred",
            "priority_basis": {
              "blocking": "不阻塞当前审查。",
              "uncertainty": "中。",
              "risk": "高。",
              "user_impact": "当前较低。"
            },
            "reason": "属于独立 Runtime 韧性范围。"
          },
          {
            "ref": "project-gap:GAP-security-real-project-validation",
            "source": "persisted",
            "eligibility": "case_required",
            "disposition": "deferred",
            "priority_basis": {
              "blocking": "不阻塞当前审查。",
              "uncertainty": "中。",
              "risk": "高。",
              "user_impact": "当前较低。"
            },
            "reason": "需要独立真实权限项目 Case。"
          },
          {
            "ref": "project-gap:GAP-cross-record-audit",
            "source": "persisted",
            "eligibility": "case_required",
            "disposition": "deferred",
            "priority_basis": {
              "blocking": "不阻塞当前审查。",
              "uncertainty": "中。",
              "risk": "高。",
              "user_impact": "当前较低。"
            },
            "reason": "属于独立跨记录审计范围。"
          }
        ]
      },
      "selected_gap": {
        "id": "CASE-20260830-001:completion-review:1",
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
        "goal": "独立审查已完成的本地工作区绑定修复在正确性、真实问题解决、验证可信度、回归风险和最小性五个维度上的完成质量。",
        "expected_state_change": "若五维均 clean，则接受 completion review，使 Case 具备关闭条件；若发现问题，则只记录 review findings。"
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
            "Implementation review: runtime/arcorbit/desktop/renderer/renderer.js only removes project-role filtering from local binding paths while retaining participation role checks",
            "Implementation review: runtime/arcorbit/src/desktop/today-guidance.mjs keeps enable_project and task mutation handoffs role-restricted",
            "Problem-resolution review: Chat, Organization, Today, Work and Automation all expose bind_workspace to accessible member projects",
            "Regression review: runtime/arcorbit/test/today-guidance.test.mjs verifies member binding and administrator-only participation independently",
            "Regression review: runtime/arcorbit/test/organization-center-electron.test.mjs verifies memberProjectHasBindingAction=true and memberProjectHasParticipationAction=false",
            "Verification: 75 focused tests passed with 0 failures",
            "Verification: production Electron organization-center member-role regression passed",
            "Verification: npm run check completed with 570 tests, 548 passed, 22 skipped, 0 failed",
            "Verification: git diff --check passed",
            "Review search: obsolete administrator-binding prompts occur only inside a negative regression assertion",
            "Minimality review: changes are limited to binding guidance/visibility, matching regression coverage, and synchronized durable specification/interaction evidence"
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
        "project_revision": 325,
        "judgments": [
          {
            "invariant_ref": "product-expectations-remain-recoverable",
            "disposition": "upheld",
            "reason": "完成审查确认角色无关的本地绑定能力及远端治理边界仍由已接受产品规格和 Project decision 完整表达。",
            "fact_refs": [
              "FACT-20260830-001-003"
            ],
            "evidence": [
              "arckit/spec/agentic-software-development/arcorbit-organization-management.md",
              "arckit/spec/INDEX.md"
            ],
            "gap_refs": []
          },
          {
            "invariant_ref": "interaction-expectations-remain-recoverable",
            "disposition": "upheld",
            "reason": "完成审查确认五个入口的动作、反馈和管理员 handoff 边界在页面级交互事实中一致且无遗漏。",
            "fact_refs": [
              "FACT-20260830-001-003"
            ],
            "evidence": [
              "arckit/interaction/today-workspace/interaction.md",
              "arckit/interaction/chat-workspace/interaction.md",
              "arckit/interaction/automation-workspace/interaction.md",
              "arckit/interaction/task-browser/interaction.md",
              "arckit/interaction/platform-workspace/interaction.md",
              "arckit/interaction/INDEX.md"
            ],
            "gap_refs": []
          },
          {
            "invariant_ref": "visual-language-remains-consistent",
            "disposition": "not_relevant",
            "reason": "审查确认本次修复没有改变视觉 token、主题、组件样式或布局规则。",
            "fact_refs": [],
            "evidence": [],
            "gap_refs": []
          },
          {
            "invariant_ref": "technical-decisions-remain-explainable",
            "disposition": "upheld",
            "reason": "本地 Workspace Control 与远端治理仍通过独立分支和既有 typed action 边界实现，没有引入新的架构耦合。",
            "fact_refs": [
              "FACT-20260830-001-003"
            ],
            "evidence": [
              "runtime/arcorbit/desktop/renderer/renderer.js",
              "runtime/arcorbit/src/desktop/today-guidance.mjs",
              "runtime/arcorbit/src/platform-coordinator.mjs",
              "arckit/spec/agentic-software-development/arcorbit-organization-management.md"
            ],
            "gap_refs": []
          },
          {
            "invariant_ref": "accepted-facts-are-realized",
            "disposition": "upheld",
            "reason": "独立 diff 审查和生产 Electron 回归均确认 member 可以绑定本地目录，但不能执行管理员限定的 participation 动作。",
            "fact_refs": [
              "FACT-20260830-001-001",
              "FACT-20260830-001-002",
              "FACT-20260830-001-003"
            ],
            "evidence": [
              "runtime/arcorbit/test/today-guidance.test.mjs",
              "runtime/arcorbit/test/desktop-renderer.test.mjs",
              "runtime/arcorbit/test/fixtures/organization-center-electron.mjs",
              "runtime/arcorbit/test/organization-center-electron.test.mjs",
              "Verification: production Electron organization-center member-role regression passed"
            ],
            "gap_refs": []
          },
          {
            "invariant_ref": "material-risks-have-credible-evidence",
            "disposition": "upheld",
            "reason": "权限误放开的主要风险由 guidance 单元测试、Renderer 防回归断言、生产 Electron 行为和完整测试套件共同控制。",
            "fact_refs": [
              "FACT-20260830-001-003"
            ],
            "evidence": [
              "runtime/arcorbit/test/today-guidance.test.mjs",
              "runtime/arcorbit/test/desktop-renderer.test.mjs",
              "runtime/arcorbit/test/organization-center-electron.test.mjs",
              "Verification: 75 focused tests passed with 0 failures",
              "Verification: production Electron organization-center member-role regression passed",
              "Verification: npm run check completed with 570 tests, 548 passed, 22 skipped, 0 failed"
            ],
            "gap_refs": []
          }
        ]
      },
      "evidence": [
        "arckit/cases/active/CASE-20260830-001-development-case.md",
        "runtime/arcorbit/desktop/renderer/renderer.js",
        "runtime/arcorbit/src/desktop/today-guidance.mjs",
        "runtime/arcorbit/test/today-guidance.test.mjs",
        "runtime/arcorbit/test/desktop-renderer.test.mjs",
        "runtime/arcorbit/test/organization-center-electron.test.mjs",
        "arckit/spec/agentic-software-development/arcorbit-organization-management.md",
        "arckit/interaction/INDEX.md",
        "Verification: git diff --check passed"
      ],
      "runtime_result_ref": "arckit-runtime://runs/RUN-20260830-084114582Z-014de504",
      "occurred_at": "2026-08-30T09:01:25.875Z"
    }
  ],
  "case_resolution": {
    "status": "resolved",
    "stage": "resolved",
    "satisfied": [
      "GAP-20260830-001-001"
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
    "updated_at": "2026-08-30T09:01:25.875Z"
  }
}
```

## Round Notes

- Case history is canonical in Structured Record.rounds; keep prose notes exceptional.
