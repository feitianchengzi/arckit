# 修复 ArcOrbit 启动时遗漏项目 skill drift 检查

Case: CASE-20260826-006
Status: closed
Artifact Type: code
Selected Gap: none
Updated: 2026-08-26T05:49:15.211Z

## User Intent

确保 ArcOrbit 每次应用启动都针对当前 Desktop Store 中全部已关联本地 Product Workspace 检查内置 skill payload 与项目已安装 skills 的差异，并在差异未处理前阻止 Automation 使用旧 skill 启动执行。

## Structured Record

```json
{
  "schema_version": "development-case-record/v5",
  "id": "CASE-20260826-006",
  "title": "修复 ArcOrbit 启动时遗漏项目 skill drift 检查",
  "status": "closed",
  "artifact_type": "code",
  "created_at": "2026-08-26T05:34:27.262Z",
  "updated_at": "2026-08-26T05:49:15.211Z",
  "user_intent": "确保 ArcOrbit 每次应用启动都针对当前 Desktop Store 中全部已关联本地 Product Workspace 检查内置 skill payload 与项目已安装 skills 的差异，并在差异未处理前阻止 Automation 使用旧 skill 启动执行。",
  "expected_outcome": "应用启动即发现项目级 skill missing、changed、stale 或 conflict；无论关闭前界面显示项目集全部还是特定项目，检查范围与结果都一致。手动切换项目不再是发现差异的必要条件。",
  "project_state_ref": "arckit/project/state.record.json",
  "current_round": {
    "goal": "",
    "selected_gap": null
  },
  "facts": [
    {
      "id": "FACT-20260826-006-001",
      "revision": 1,
      "status": "superseded",
      "statement": "ArcOrbit 启动调用不带输入的 checkCombinedSetupReadiness；checkDesktopSetupReadiness 因无 projectId 直接执行无 projectRoot 的 skill check，SkillProvisioningManager 随后只生成 global readiness。只要 Codex 可用，该结果即为 ready，main process 会启动 Automation，即使项目已安装 skills 与内置 payload 存在差异。",
      "basis": "相关控制流可静态完整解释用户报告的启动漏检、旧 skill 自动化失败以及切换项目后才发现差异的时序。",
      "evidence": [
        "runtime/arcorbit/desktop/main.mjs:202",
        "runtime/arcorbit/desktop/main.mjs:203",
        "runtime/arcorbit/src/desktop-setup-readiness-context.mjs:23",
        "runtime/arcorbit/src/desktop-setup-readiness-context.mjs:25",
        "runtime/arcorbit/src/skill-provisioning-manager.mjs:59",
        "runtime/arcorbit/src/skill-provisioning-manager.mjs:519",
        "Current operator input, 2026-08-26"
      ]
    },
    {
      "id": "FACT-20260826-006-002",
      "revision": 1,
      "status": "accepted",
      "statement": "手动选择具体产品范围会传入 local projectId；readiness context 随后读取 Desktop Store，并把其中全部有 path 的本地项目 roots 交给项目级 skill provisioning 检查，而不是只检查所选项目。",
      "basis": "Renderer 事件处理和 readiness 输入归一化代码明确建立了该数据流。",
      "evidence": [
        "runtime/arcorbit/desktop/renderer/renderer.js:589",
        "runtime/arcorbit/desktop/renderer/renderer.js:597",
        "runtime/arcorbit/desktop/renderer/renderer.js:4186",
        "runtime/arcorbit/desktop/renderer/renderer.js:4193",
        "runtime/arcorbit/src/desktop-setup-readiness-context.mjs:8",
        "runtime/arcorbit/src/desktop-setup-readiness-context.mjs:14",
        "runtime/arcorbit/src/desktop-setup-readiness-context.mjs:28"
      ]
    },
    {
      "id": "FACT-20260826-006-003",
      "revision": 1,
      "status": "superseded",
      "statement": "Renderer 的 selectedProjectId 在每次启动时固定初始化为 all，当前 Desktop Store 不保存该范围；因此关闭前显示项目集全部或特定项目都不会影响下一次启动的 readiness 调用，二者都会经过同一条 global-only 漏检路径。",
      "basis": "Renderer 初始状态和现有 Desktop Store 偏好字段共同证明启动不恢复具体项目范围。",
      "evidence": [
        "runtime/arcorbit/desktop/renderer/renderer.js:130",
        "runtime/arcorbit/src/desktop/desktop-store.mjs:120",
        "runtime/arcorbit/src/desktop/desktop-store.mjs:221"
      ]
    },
    {
      "id": "FACT-20260826-006-004",
      "revision": 1,
      "status": "accepted",
      "statement": "ArcOrbit coordinated Setup Readiness 在应用启动和显式项目复查时都 fresh-read Desktop Store，向 skill provisioning 传递全部去重、规范化的本地 Product Workspace roots；空 roots 显式进入 global-only 且不复用旧 project plan。Renderer 的当前项目筛选不改变启动检查范围。",
      "basis": "实现、稳定规格和技术方案已对齐。",
      "evidence": [
        "runtime/arcorbit/src/desktop-setup-readiness-context.mjs:4",
        "runtime/arcorbit/src/desktop-setup-readiness-context.mjs:23",
        "runtime/arcorbit/src/skill-provisioning-manager.mjs:59",
        "arckit/spec/arcorbit-distribution.md:88",
        "arckit/tech/arcorbit/installer-supply-chain.md:282"
      ]
    },
    {
      "id": "FACT-20260826-006-005",
      "revision": 1,
      "status": "accepted",
      "statement": "ArcOrbit 只在 fresh aggregate Setup Readiness 为 ready 且不是 first-install 时启动 Automation；needs-install、drifted、conflict、blocked、checking 和 first-install 均被 gate 阻止。",
      "basis": "main-process gate、focused tests 和完整 ArcOrbit 测试套件共同证明该行为。",
      "evidence": [
        "runtime/arcorbit/src/desktop-setup-readiness-context.mjs:31",
        "runtime/arcorbit/desktop/main.mjs:202",
        "runtime/arcorbit/test/desktop-renderer.test.mjs:1589",
        "Verification: 62 focused tests passed",
        "Verification: full ArcOrbit suite 507 tests, 495 passed, 12 skipped, 0 failed"
      ]
    }
  ],
  "state_impacts": [
    {
      "id": "IMPACT-20260826-006-001",
      "fact_id": "FACT-20260826-006-004",
      "fact_revision": 1,
      "target": {
        "kind": "software_decision",
        "ref": "technical_foundation",
        "revision": 38
      },
      "effect": "upheld",
      "reason": "main-process coordinated readiness 已恢复完整项目作用域并保持空项目 global-only 边界。",
      "gap_ids": [],
      "evidence": [
        "runtime/arcorbit/src/desktop-setup-readiness-context.mjs:23",
        "runtime/arcorbit/src/skill-provisioning-manager.mjs:59",
        "arckit/tech/arcorbit/installer-supply-chain.md:282"
      ]
    },
    {
      "id": "IMPACT-20260826-006-002",
      "fact_id": "FACT-20260826-006-005",
      "fact_revision": 1,
      "target": {
        "kind": "software_invariant",
        "ref": "accepted-facts-are-realized",
        "revision": null
      },
      "effect": "upheld",
      "reason": "实际启动路径已兑现启动期项目 skill reconciliation 和 fail-closed Automation gate。",
      "gap_ids": [],
      "evidence": [
        "runtime/arcorbit/desktop/main.mjs:202",
        "runtime/arcorbit/test/desktop-renderer.test.mjs:1589",
        "Verification: full ArcOrbit suite 507 tests, 495 passed, 12 skipped, 0 failed"
      ]
    },
    {
      "id": "IMPACT-20260826-006-003",
      "fact_id": "FACT-20260826-006-004",
      "fact_revision": 1,
      "target": {
        "kind": "software_decision",
        "ref": "product_capabilities",
        "revision": 35
      },
      "effect": "upheld",
      "reason": "Setup Readiness 已在启动时发现全部关联项目的 skill drift，并在恢复前阻止 Automation。",
      "gap_ids": [],
      "evidence": [
        "arckit/spec/arcorbit-distribution.md:88",
        "runtime/arcorbit/test/desktop-renderer.test.mjs:1558"
      ]
    },
    {
      "id": "IMPACT-20260826-006-004",
      "fact_id": "FACT-20260826-006-005",
      "fact_revision": 1,
      "target": {
        "kind": "software_decision",
        "ref": "experience_and_interaction",
        "revision": 52
      },
      "effect": "upheld",
      "reason": "用户无需手动切换项目即可在启动时进入既有 Setup Readiness 恢复路径。",
      "gap_ids": [],
      "evidence": [
        "arckit/spec/arcorbit-distribution.md:111",
        "runtime/arcorbit/desktop/main.mjs:202"
      ]
    },
    {
      "id": "IMPACT-20260826-006-005",
      "fact_id": "FACT-20260826-006-005",
      "fact_revision": 1,
      "target": {
        "kind": "software_decision",
        "ref": "quality_and_validation",
        "revision": 15
      },
      "effect": "upheld",
      "reason": "启动 roots、空项目、选择态独立、非 ready gate 与完整回归均有可重复测试。",
      "gap_ids": [],
      "evidence": [
        "runtime/arcorbit/test/desktop-renderer.test.mjs:1508",
        "runtime/arcorbit/test/desktop-renderer.test.mjs:1558",
        "runtime/arcorbit/test/desktop-renderer.test.mjs:1589",
        "runtime/arcorbit/test/skill-provisioning-manager.test.mjs:287"
      ]
    },
    {
      "id": "IMPACT-20260826-006-006",
      "fact_id": "FACT-20260826-006-004",
      "fact_revision": 1,
      "target": {
        "kind": "software_decision",
        "ref": "delivery_and_distribution",
        "revision": 8
      },
      "effect": "upheld",
      "reason": "安装包内 locked payload 与所有已关联项目安装副本会在每次应用启动时比较。",
      "gap_ids": [],
      "evidence": [
        "arckit/spec/arcorbit-distribution.md:233",
        "runtime/arcorbit/README.md:158"
      ]
    }
  ],
  "gaps": [
    {
      "id": "GAP-20260826-006-001",
      "status": "resolved",
      "goal": "使应用启动的 coordinated Setup Readiness 自动读取当前 Desktop Store 中全部已关联本地项目 roots，执行项目级 skill drift 检查，并以回归测试证明关闭前为项目集全部或特定项目时都不会漏检或提前启动 Automation。",
      "reason": "根因和影响范围已由静态控制流完整确认；必须修复启动输入边界并覆盖空项目、全部范围、特定项目、检测到 drift 以及 ready 后启动 Automation 的行为。",
      "derived_from": [
        "FACT-20260826-006-001",
        "FACT-20260826-006-002",
        "FACT-20260826-006-003"
      ],
      "blocked_by": [],
      "priority_basis": {
        "blocking": "当前 readiness 误判可直接放行 Automation。",
        "uncertainty": "根因低不确定；修复后的空项目兼容行为和启动测试边界需要实现验证。",
        "risk": "高：过期 skill 已造成自动化执行失败。",
        "user_impact": "高：用户必须手动切换项目才能发现应用包内 skills 已变化。"
      },
      "responsibility": "agent",
      "evidence_required": [
        "启动 readiness 在存在本地 Product Workspace 时把全部规范化 roots 传给 skill provisioning 的 focused test。",
        "检测到 changed/missing/stale/conflict 时 Automation 不启动的回归证据。",
        "无本地项目时仍保留合法 global readiness 行为的回归证据。",
        "项目集全部与特定项目两种关闭前界面状态不改变启动检查范围的证据。"
      ],
      "resolution": {
        "id": "GAP-20260826-006-001",
        "status": "resolved",
        "outcome": "resolved",
        "reason": "启动 readiness 已改为 fresh-read 全部本地 Product Workspace roots，显式空 roots 清除旧项目作用域；Automation gate 与完整回归均已验证。",
        "evidence": [
          "runtime/arcorbit/src/desktop-setup-readiness-context.mjs:4",
          "runtime/arcorbit/src/desktop-setup-readiness-context.mjs:23",
          "runtime/arcorbit/src/skill-provisioning-manager.mjs:59",
          "runtime/arcorbit/desktop/main.mjs:202",
          "runtime/arcorbit/test/desktop-renderer.test.mjs:1508",
          "runtime/arcorbit/test/desktop-renderer.test.mjs:1558",
          "runtime/arcorbit/test/desktop-renderer.test.mjs:1589",
          "runtime/arcorbit/test/skill-provisioning-manager.test.mjs:287",
          "Verification: 62 focused tests passed",
          "Verification: full ArcOrbit suite 507 tests, 495 passed, 12 skipped, 0 failed"
        ],
        "occurred_at": "2026-08-26T05:45:48.059Z"
      }
    }
  ],
  "content_revision": 1,
  "completion_review": {
    "status": "clean",
    "policy": {
      "initial_max_cycles": 10,
      "source": "runtime/arcorbit/config/case-policy.json",
      "snapshotted_at": "2026-08-26T05:34:27.262Z"
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
          "runtime/arcorbit/src/desktop-setup-readiness-context.mjs",
          "runtime/arcorbit/src/skill-provisioning-manager.mjs",
          "runtime/arcorbit/desktop/main.mjs",
          "runtime/arcorbit/test/desktop-renderer.test.mjs",
          "runtime/arcorbit/test/skill-provisioning-manager.test.mjs",
          "arckit/spec/arcorbit-distribution.md",
          "arckit/tech/arcorbit/installer-supply-chain.md",
          "Review verification: 62 focused tests passed, 0 failed",
          "Accepted verification fact: full ArcOrbit suite 507 tests, 495 passed, 12 skipped, 0 failed",
          "Review verification: changed JavaScript files passed node --check; git diff --check passed"
        ],
        "occurred_at": "2026-08-26T05:49:15.211Z"
      }
    ],
    "evidence": [
      "runtime/arcorbit/src/desktop-setup-readiness-context.mjs",
      "runtime/arcorbit/src/skill-provisioning-manager.mjs",
      "runtime/arcorbit/desktop/main.mjs",
      "runtime/arcorbit/test/desktop-renderer.test.mjs",
      "runtime/arcorbit/test/skill-provisioning-manager.test.mjs",
      "arckit/spec/arcorbit-distribution.md",
      "arckit/tech/arcorbit/installer-supply-chain.md",
      "Review verification: 62 focused tests passed, 0 failed",
      "Accepted verification fact: full ArcOrbit suite 507 tests, 495 passed, 12 skipped, 0 failed",
      "Review verification: changed JavaScript files passed node --check; git diff --check passed"
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
      "goal": "修复启动期 coordinated Setup Readiness 的项目 root 恢复与 Automation gate，并同步稳定规格、技术方案和回归证据。",
      "outcome": "completed",
      "gap_selection": {
        "mode": "candidate",
        "basis": "基于 fresh canonical snapshot 34e2f8592319eedc48685442c2be0f668ff944b1d7fc9de3b14d4788ed10812f 及 CASE-20260826-006 的 Case-scoped selection token 比较全部持久候选；启动期 reconciliation 是唯一 ready Case Gap。",
        "snapshot_token": "646b8600b692454cbc45df1ef6bf022f30df14ba820f4fcf0e805773614ff041",
        "selected_ref": "case-gap:CASE-20260826-006:GAP-20260826-006-001",
        "comparison_summary": "4 个 Project Gap 均需独立 Case，延后；选择当前 ready Case Gap。",
        "fresh_discovery_summary": "本轮未发现会改变修复对象、范围或验收方式的 fresh 前置 Gap。",
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
            "reason": "动态场景验证不直接覆盖启动期 skill drift 漏检，且需另建 Case。"
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
            "reason": "Runtime 韧性范围较广，不替代当前已界定的启动 readiness 修复。"
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
            "reason": "真实权限验证与当前无凭据的本地 readiness 控制流无直接依赖。"
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
            "reason": "跨记录审计不解决应用启动时项目 skills 未检查的问题。"
          },
          {
            "ref": "case-gap:CASE-20260826-006:GAP-20260826-006-001",
            "source": "persisted",
            "eligibility": "ready",
            "disposition": "selected",
            "priority_basis": {
              "blocking": "当前 readiness 误判可直接放行 Automation。",
              "uncertainty": "根因低不确定；修复后的空项目兼容行为和启动测试边界需要实现验证。",
              "risk": "高：过期 skill 已造成自动化执行失败。",
              "user_impact": "高：用户必须手动切换项目才能发现应用包内 skills 已变化。"
            },
            "reason": "唯一 ready Case Gap，根因、范围和验收证据均已由 accepted facts 界定。"
          }
        ]
      },
      "selected_gap": {
        "id": "GAP-20260826-006-001",
        "responsibility": "agent",
        "goal": "使应用启动的 coordinated Setup Readiness 自动读取当前 Desktop Store 中全部已关联本地项目 roots，执行项目级 skill drift 检查，并以回归测试证明关闭前为项目集全部或特定项目时都不会漏检或提前启动 Automation。",
        "reason": "根因和影响范围已由静态控制流完整确认；必须修复启动输入边界并覆盖空项目、全部范围、特定项目、检测到 drift 以及 ready 后启动 Automation 的行为。",
        "derived_from": [
          "FACT-20260826-006-001",
          "FACT-20260826-006-002",
          "FACT-20260826-006-003"
        ],
        "blocked_by": [],
        "priority_basis": {
          "blocking": "当前 readiness 误判可直接放行 Automation。",
          "uncertainty": "根因低不确定；修复后的空项目兼容行为和启动测试边界需要实现验证。",
          "risk": "高：过期 skill 已造成自动化执行失败。",
          "user_impact": "高：用户必须手动切换项目才能发现应用包内 skills 已变化。"
        },
        "evidence_required": [
          "启动 readiness 在存在本地 Product Workspace 时把全部规范化 roots 传给 skill provisioning 的 focused test。",
          "检测到 changed/missing/stale/conflict 时 Automation 不启动的回归证据。",
          "无本地项目时仍保留合法 global readiness 行为的回归证据。",
          "项目集全部与特定项目两种关闭前界面状态不改变启动检查范围的证据。"
        ]
      },
      "planned_transition": {
        "goal": "修复启动期 coordinated Setup Readiness 的项目 root 恢复与 Automation gate，并同步稳定规格、技术方案和回归证据。",
        "expected_state_change": "应用启动会检查全部已关联本地项目的 skill drift；项目筛选状态不影响检查范围；空项目保持 global-only；非 ready 状态不会启动 Automation。"
      },
      "accepted_state_delta": {
        "resolved_gap": {
          "id": "GAP-20260826-006-001",
          "status": "resolved",
          "outcome": "resolved",
          "reason": "启动 readiness 已改为 fresh-read 全部本地 Product Workspace roots，显式空 roots 清除旧项目作用域；Automation gate 与完整回归均已验证。",
          "evidence": [
            "runtime/arcorbit/src/desktop-setup-readiness-context.mjs:4",
            "runtime/arcorbit/src/desktop-setup-readiness-context.mjs:23",
            "runtime/arcorbit/src/skill-provisioning-manager.mjs:59",
            "runtime/arcorbit/desktop/main.mjs:202",
            "runtime/arcorbit/test/desktop-renderer.test.mjs:1508",
            "runtime/arcorbit/test/desktop-renderer.test.mjs:1558",
            "runtime/arcorbit/test/desktop-renderer.test.mjs:1589",
            "runtime/arcorbit/test/skill-provisioning-manager.test.mjs:287",
            "Verification: 62 focused tests passed",
            "Verification: full ArcOrbit suite 507 tests, 495 passed, 12 skipped, 0 failed"
          ]
        },
        "facts_added": [
          {
            "id": "FACT-20260826-006-004",
            "revision": 1,
            "status": "accepted",
            "statement": "ArcOrbit coordinated Setup Readiness 在应用启动和显式项目复查时都 fresh-read Desktop Store，向 skill provisioning 传递全部去重、规范化的本地 Product Workspace roots；空 roots 显式进入 global-only 且不复用旧 project plan。Renderer 的当前项目筛选不改变启动检查范围。",
            "basis": "实现、稳定规格和技术方案已对齐。",
            "evidence": [
              "runtime/arcorbit/src/desktop-setup-readiness-context.mjs:4",
              "runtime/arcorbit/src/desktop-setup-readiness-context.mjs:23",
              "runtime/arcorbit/src/skill-provisioning-manager.mjs:59",
              "arckit/spec/arcorbit-distribution.md:88",
              "arckit/tech/arcorbit/installer-supply-chain.md:282"
            ]
          },
          {
            "id": "FACT-20260826-006-005",
            "revision": 1,
            "status": "accepted",
            "statement": "ArcOrbit 只在 fresh aggregate Setup Readiness 为 ready 且不是 first-install 时启动 Automation；needs-install、drifted、conflict、blocked、checking 和 first-install 均被 gate 阻止。",
            "basis": "main-process gate、focused tests 和完整 ArcOrbit 测试套件共同证明该行为。",
            "evidence": [
              "runtime/arcorbit/src/desktop-setup-readiness-context.mjs:31",
              "runtime/arcorbit/desktop/main.mjs:202",
              "runtime/arcorbit/test/desktop-renderer.test.mjs:1589",
              "Verification: 62 focused tests passed",
              "Verification: full ArcOrbit suite 507 tests, 495 passed, 12 skipped, 0 failed"
            ]
          }
        ],
        "facts_superseded": [
          {
            "id": "FACT-20260826-006-001",
            "revision": 1,
            "reason": "该事实准确描述修复前实现，但现有启动路径已执行项目级 readiness，不再只生成 global readiness。",
            "evidence": [
              "runtime/arcorbit/src/desktop-setup-readiness-context.mjs:23",
              "runtime/arcorbit/desktop/main.mjs:202"
            ]
          },
          {
            "id": "FACT-20260826-006-003",
            "revision": 1,
            "reason": "selectedProjectId 仍默认 all，但“全部和特定项目都会经过 global-only 漏检路径”的结论已被选择态无关的 startup project-root 检查取代。",
            "evidence": [
              "runtime/arcorbit/src/desktop-setup-readiness-context.mjs:14",
              "runtime/arcorbit/test/desktop-renderer.test.mjs:1522"
            ]
          }
        ],
        "impacts_added": [
          {
            "id": "IMPACT-20260826-006-003",
            "fact_id": "FACT-20260826-006-004",
            "fact_revision": 1,
            "target": {
              "kind": "software_decision",
              "ref": "product_capabilities",
              "revision": 35
            },
            "effect": "upheld",
            "reason": "Setup Readiness 已在启动时发现全部关联项目的 skill drift，并在恢复前阻止 Automation。",
            "gap_ids": [],
            "evidence": [
              "arckit/spec/arcorbit-distribution.md:88",
              "runtime/arcorbit/test/desktop-renderer.test.mjs:1558"
            ]
          },
          {
            "id": "IMPACT-20260826-006-004",
            "fact_id": "FACT-20260826-006-005",
            "fact_revision": 1,
            "target": {
              "kind": "software_decision",
              "ref": "experience_and_interaction",
              "revision": 52
            },
            "effect": "upheld",
            "reason": "用户无需手动切换项目即可在启动时进入既有 Setup Readiness 恢复路径。",
            "gap_ids": [],
            "evidence": [
              "arckit/spec/arcorbit-distribution.md:111",
              "runtime/arcorbit/desktop/main.mjs:202"
            ]
          },
          {
            "id": "IMPACT-20260826-006-005",
            "fact_id": "FACT-20260826-006-005",
            "fact_revision": 1,
            "target": {
              "kind": "software_decision",
              "ref": "quality_and_validation",
              "revision": 15
            },
            "effect": "upheld",
            "reason": "启动 roots、空项目、选择态独立、非 ready gate 与完整回归均有可重复测试。",
            "gap_ids": [],
            "evidence": [
              "runtime/arcorbit/test/desktop-renderer.test.mjs:1508",
              "runtime/arcorbit/test/desktop-renderer.test.mjs:1558",
              "runtime/arcorbit/test/desktop-renderer.test.mjs:1589",
              "runtime/arcorbit/test/skill-provisioning-manager.test.mjs:287"
            ]
          },
          {
            "id": "IMPACT-20260826-006-006",
            "fact_id": "FACT-20260826-006-004",
            "fact_revision": 1,
            "target": {
              "kind": "software_decision",
              "ref": "delivery_and_distribution",
              "revision": 8
            },
            "effect": "upheld",
            "reason": "安装包内 locked payload 与所有已关联项目安装副本会在每次应用启动时比较。",
            "gap_ids": [],
            "evidence": [
              "arckit/spec/arcorbit-distribution.md:233",
              "runtime/arcorbit/README.md:158"
            ]
          }
        ],
        "impacts_updated": [
          {
            "id": "IMPACT-20260826-006-001",
            "fact_id": "FACT-20260826-006-004",
            "fact_revision": 1,
            "target": {
              "kind": "software_decision",
              "ref": "technical_foundation",
              "revision": 38
            },
            "effect": "upheld",
            "reason": "main-process coordinated readiness 已恢复完整项目作用域并保持空项目 global-only 边界。",
            "gap_ids": [],
            "evidence": [
              "runtime/arcorbit/src/desktop-setup-readiness-context.mjs:23",
              "runtime/arcorbit/src/skill-provisioning-manager.mjs:59",
              "arckit/tech/arcorbit/installer-supply-chain.md:282"
            ]
          },
          {
            "id": "IMPACT-20260826-006-002",
            "fact_id": "FACT-20260826-006-005",
            "fact_revision": 1,
            "target": {
              "kind": "software_invariant",
              "ref": "accepted-facts-are-realized",
              "revision": null
            },
            "effect": "upheld",
            "reason": "实际启动路径已兑现启动期项目 skill reconciliation 和 fail-closed Automation gate。",
            "gap_ids": [],
            "evidence": [
              "runtime/arcorbit/desktop/main.mjs:202",
              "runtime/arcorbit/test/desktop-renderer.test.mjs:1589",
              "Verification: full ArcOrbit suite 507 tests, 495 passed, 12 skipped, 0 failed"
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
            "observed_revision": 34,
            "set_decision": {
              "status": "settled",
              "statement": "ArcOrbit 保留既有 Desktop、Runtime、Chat、Automation、Feedback 与 Work 能力和边界。Work 是 Workshop 待办同步与本地 Task Projection 的唯一客户端所有者；新建和编辑 Sheet 提供完整七状态，编辑 Sheet 是异常纠偏兜底，Inspector 按当前状态提供有限下一步动作。Work Inspector 默认更宽，支持可访问拖拽调宽与跨应用重启恢复，并使用内容、紧凑属性、协作和验收语义分区。Work 编辑待办允许把内容复制到当前产品集内另一个可写产品，并在目标创建获 Workshop 确认后删除源 Task。目标 Task 获得新身份，仅复制正文、状态、优先级及目标产品内重新选择的关联字段，不继承评论、附件、Run、session、thread、Gate 或验收问题。Work 负责两阶段 mutation 和部分成功恢复；Automation 只消费服务器确认后的本地状态。Setup Readiness 在每次应用启动时 fresh-check Desktop Store 中全部已关联本地项目相对于内置 payload 的 skill drift，界面当前选择项目集全部或具体项目都不缩小检查范围，任一项目未 ready 时不启动 Automation。trusted Case binding 的既有能力和边界保持不变。",
              "reason": "启动期项目 skill reconciliation 已实现并通过完整回归，消除了手动切换项目后才发现差异的缺口。",
              "evidence": [
                "arckit/spec/arcorbit-distribution.md",
                "runtime/arcorbit/src/desktop-setup-readiness-context.mjs",
                "runtime/arcorbit/test/desktop-renderer.test.mjs"
              ],
              "confidence": "high",
              "resume_condition": "当启动检查项目作用域、skill drift 状态、Setup 恢复入口或 Automation gate 改变时重审。"
            },
            "gap_refs": [
              "GAP-agent-scenario-evaluation"
            ],
            "reason": "接受启动期 skill drift 检查为稳定产品能力。",
            "evidence": [
              "arckit/spec/arcorbit-distribution.md:88",
              "Verification: full ArcOrbit suite 507 tests, 495 passed, 12 skipped, 0 failed"
            ]
          },
          {
            "area_ref": "experience_and_interaction",
            "observed_revision": 51,
            "set_decision": {
              "status": "settled",
              "statement": "ArcOrbit 保持既有 Personal、Product Lifecycle、Organization 导航与 Work、Automation、Feedback、Chat 等交互语义。Work 新建和编辑 Sheet 保留完整七状态，编辑 Sheet 承担异常纠偏；右侧 Inspector 按当前状态显示有限下一步动作。Work Inspector 首次使用 440px，用户可通过 12px 可访问分隔条在 360–640px 保存范围内拖拽、键盘调整或双击复位，偏好跨任务、项目、Workset 和应用重启恢复。布局为任务树保留至少 420px，窗口临时收窄只改变有效宽度且不覆盖保存值。Inspector 以单一内部滚动区组织身份动作、内容、紧凑属性、协作和按状态出现的验收分区，宽度变化不丢失选择、滚动、草稿或附件状态。跨产品替换、主窗口和 Case 绑定恢复的既有交互保持不变。应用启动会在进入 Automation 前检查全部关联本地项目；发现 skill drift 时直接呈现既有 Setup Readiness 安装、修复或人工恢复路径，无需用户先切换到具体项目。",
              "reason": "启动检测时机与恢复入口现已明确并由实现兑现。",
              "evidence": [
                "arckit/spec/arcorbit-distribution.md",
                "runtime/arcorbit/desktop/main.mjs",
                "runtime/arcorbit/test/desktop-renderer.test.mjs"
              ],
              "confidence": "high",
              "resume_condition": "当启动 Setup 展示时机、项目作用域、恢复动作或 Automation 放行条件改变时重审。"
            },
            "gap_refs": [],
            "reason": "同步启动期恢复交互语义。",
            "evidence": [
              "arckit/spec/arcorbit-distribution.md:111"
            ]
          },
          {
            "area_ref": "technical_foundation",
            "observed_revision": 37,
            "set_decision": {
              "status": "settled",
              "statement": "Arckit 与 ArcOrbit 的既有 ledger、Electron、Runtime、Platform Coordinator、Work Sync、Chat、Setup Readiness 和 trusted case-control 技术边界保持不变。Work Inspector 偏好通过 Desktop Store v15 的 `platform.ui_preferences.work_inspector_width_px` 归一化与持久化；`platformSnapshot` 在首次 Work 布局前提供恢复值，preload 只新增目的限定的 `setWorkInspectorWidth(widthPx)` typed action。Renderer 在拖拽期间仅更新 grid track，在 pointerup、键盘调整结束或双击复位时持久化；当前窗口有效宽度与保存值分离，且不通过重新创建 Inspector DOM 完成调宽。应用启动的 coordinated Setup Readiness 由 main process fresh-read Desktop Store 中全部本地 Product Workspace roots；显式空 roots 清除既有 project plan 并执行 global-only。aggregate 只有在全部项目 ready 且不是 first-install 时才允许启动 Automation，Renderer 项目筛选不参与该启动作用域。",
              "reason": "启动检查已恢复项目级新鲜度与空作用域边界，同时保持 main-process 所有权。",
              "evidence": [
                "arckit/tech/arcorbit/installer-supply-chain.md",
                "runtime/arcorbit/src/desktop-setup-readiness-context.mjs",
                "runtime/arcorbit/src/skill-provisioning-manager.mjs",
                "runtime/arcorbit/desktop/main.mjs"
              ],
              "confidence": "high",
              "resume_condition": "当 Desktop Store root 解析、project plan 复用、aggregate gate 或 Setup manager 所有权变化时重审。"
            },
            "gap_refs": [
              "GAP-runtime-resilience-and-adapters"
            ],
            "reason": "接受修复后的启动 readiness 技术边界。",
            "evidence": [
              "arckit/tech/arcorbit/installer-supply-chain.md:282",
              "arckit/tech/arcorbit/installer-supply-chain.md:359"
            ]
          },
          {
            "area_ref": "quality_and_validation",
            "observed_revision": 14,
            "set_decision": {
              "status": "settled",
              "statement": "既有协议、Runtime、realtime、Work、Chat、Automation、安全、Setup 和跨平台窗口验证义务保持不变。Work Inspector 还必须以 Store、main/preload、Renderer 和 DOM/CSS focused tests 证明：440 默认；360/640 边界与非法值归一化；v14→v15 幂等迁移；pointerup、16/48px 键盘调整和双击复位持久化；应用重启恢复；任务、项目与 Workset 切换不重置；420px 列表保护和临时窗口收窄不覆盖保存值；separator ARIA；调宽不丢失选择、滚动、评论/验收草稿或附件状态；属性两列/窄宽度单列；内容、协作、completed/accepted 验收分区正确。Setup Readiness 还必须证明启动与具体项目复查使用相同的全部本地 roots、空 roots 不复用旧 plan、项目筛选不改变范围，以及 needs-install、drifted、conflict、blocked、checking 和 first-install 都不会提前启动 Automation。",
              "reason": "启动期 skill 新鲜度是高风险 gate，需保留可重复 focused 和完整回归证据。",
              "evidence": [
                "runtime/arcorbit/test/desktop-renderer.test.mjs",
                "runtime/arcorbit/test/skill-provisioning-manager.test.mjs",
                "Verification: full ArcOrbit suite 507 tests, 495 passed, 12 skipped, 0 failed"
              ],
              "confidence": "high",
              "resume_condition": "当 startup root 作用域、空项目行为、drift 状态或 Automation gate 改变时重审。"
            },
            "gap_refs": [
              "GAP-agent-scenario-evaluation",
              "GAP-cross-record-audit"
            ],
            "reason": "纳入启动 reconciliation 回归义务。",
            "evidence": [
              "runtime/arcorbit/test/desktop-renderer.test.mjs:1508",
              "runtime/arcorbit/test/skill-provisioning-manager.test.mjs:287"
            ]
          },
          {
            "area_ref": "delivery_and_distribution",
            "observed_revision": 7,
            "set_decision": {
              "status": "settled",
              "statement": "Arckit skills are sourced from the repository and ArcOrbit applies its locked payload only to normalized local project roots explicitly associated through Product Workspaces; it does not install bundled skills, shared assets or loaders into the Codex user-level skill directory. Source availability recommendations remain generic, while ArcOrbit uses a project-only invocation policy, per-project relations and confirmed migration of legacy managed user targets. ArcOrbit 每次应用启动都会把当前安装包 locked payload 与 Desktop Store 中全部已关联本地项目的安装关系和 drift 比较；没有本地项目时保持 global-only，任一关联项目未 ready 时不启动 Automation。Governed ArcOrbit installers are produced only by manually dispatched GitHub workflows against an existing tf/*, beta/* or appstore/* release-intent tag, bundle locked trusted resources, the Arckit skill payload and an exact ArcForge provider artifact, and support macOS arm64/x64, Windows x64 and Linux x64 with explicit signing and draft-release choices. A repository-local validation entrypoint may build current-host unsigned artifacts only when provider, ArcOrbit metadata, repository identity and workflow are explicitly labeled local; those artifacts carry no release authorization and are never published by governed workflows. Codex CLI is not bundled or redistributed in ArcOrbit v1: Setup Readiness downloads and executes OpenAI's current official standalone installer for macOS/Linux/Windows only after explicit user confirmation, records no installer bytes in the product, preserves external installations unless the user separately confirms migration, and revalidates the selected executable after install/update.",
              "reason": "明确安装包升级后的首次应用启动即检查所有已关联项目副本，而不是依赖手动项目切换。",
              "evidence": [
                "arckit/spec/arcorbit-distribution.md",
                "runtime/arcorbit/README.md",
                "runtime/arcorbit/src/desktop-setup-readiness-context.mjs"
              ],
              "confidence": "high",
              "resume_condition": "当启动 drift 检查、payload ownership、project relation 或 Automation 放行策略改变时重审。"
            },
            "gap_refs": [],
            "reason": "同步分发与升级后的启动 reconciliation 行为。",
            "evidence": [
              "arckit/spec/arcorbit-distribution.md:233",
              "runtime/arcorbit/README.md:158"
            ]
          }
        ],
        "software_invariant_changes": [],
        "project_gap_changes": [],
        "selection_context_change": null,
        "evidence": [
          "arckit/spec/arcorbit-distribution.md",
          "arckit/tech/arcorbit/installer-supply-chain.md",
          "runtime/arcorbit/README.md",
          "runtime/arcorbit/src/desktop-setup-readiness-context.mjs",
          "runtime/arcorbit/test/desktop-renderer.test.mjs"
        ]
      },
      "invariant_assessment": {
        "project_revision": 278,
        "judgments": [
          {
            "invariant_ref": "product-expectations-remain-recoverable",
            "disposition": "upheld",
            "reason": "启动检查范围、空项目行为、非 ready gate 与恢复结果已写入权威产品规格。",
            "fact_refs": [
              "FACT-20260826-006-004",
              "FACT-20260826-006-005"
            ],
            "evidence": [
              "arckit/spec/arcorbit-distribution.md:88",
              "arckit/spec/arcorbit-distribution.md:111",
              "arckit/spec/arcorbit-distribution.md:233"
            ],
            "gap_refs": []
          },
          {
            "invariant_ref": "interaction-expectations-remain-recoverable",
            "disposition": "upheld",
            "reason": "启动发现 drift 后进入既有 Setup Readiness 恢复路径，且不再要求手动切换项目。",
            "fact_refs": [
              "FACT-20260826-006-005"
            ],
            "evidence": [
              "arckit/spec/arcorbit-distribution.md:111",
              "runtime/arcorbit/desktop/main.mjs:202"
            ],
            "gap_refs": []
          },
          {
            "invariant_ref": "visual-language-remains-consistent",
            "disposition": "not_relevant",
            "reason": "本轮没有改变 Setup Readiness 或其它页面的视觉语言、布局、组件样式或主题。",
            "fact_refs": [],
            "evidence": [],
            "gap_refs": []
          },
          {
            "invariant_ref": "technical-decisions-remain-explainable",
            "disposition": "upheld",
            "reason": "Desktop Store root source、显式空作用域、SkillProvisioningManager 和 main-process gate 的关系已由技术方案与代码完整表达。",
            "fact_refs": [
              "FACT-20260826-006-004",
              "FACT-20260826-006-005"
            ],
            "evidence": [
              "arckit/tech/arcorbit/installer-supply-chain.md:282",
              "arckit/tech/arcorbit/installer-supply-chain.md:359",
              "runtime/arcorbit/src/desktop-setup-readiness-context.mjs:23",
              "runtime/arcorbit/src/skill-provisioning-manager.mjs:59"
            ],
            "gap_refs": []
          },
          {
            "invariant_ref": "accepted-facts-are-realized",
            "disposition": "upheld",
            "reason": "实际启动路径已兑现全部关联项目 fresh reconciliation、选择态独立、空项目 global-only 和 fail-closed Automation gate。",
            "fact_refs": [
              "FACT-20260826-006-004",
              "FACT-20260826-006-005"
            ],
            "evidence": [
              "runtime/arcorbit/src/desktop-setup-readiness-context.mjs:14",
              "runtime/arcorbit/desktop/main.mjs:202",
              "runtime/arcorbit/test/desktop-renderer.test.mjs:1558"
            ],
            "gap_refs": []
          },
          {
            "invariant_ref": "material-risks-have-credible-evidence",
            "disposition": "upheld",
            "reason": "旧 skill 提前执行风险由 focused tests、显式空作用域回归和完整 ArcOrbit 套件共同控制。",
            "fact_refs": [
              "FACT-20260826-006-005"
            ],
            "evidence": [
              "runtime/arcorbit/test/desktop-renderer.test.mjs:1589",
              "runtime/arcorbit/test/skill-provisioning-manager.test.mjs:287",
              "Verification: 62 focused tests passed",
              "Verification: full ArcOrbit suite 507 tests, 495 passed, 12 skipped, 0 failed"
            ],
            "gap_refs": []
          }
        ]
      },
      "evidence": [
        "runtime/arcorbit/src/desktop-setup-readiness-context.mjs",
        "runtime/arcorbit/src/skill-provisioning-manager.mjs",
        "runtime/arcorbit/desktop/main.mjs",
        "runtime/arcorbit/test/desktop-renderer.test.mjs",
        "runtime/arcorbit/test/skill-provisioning-manager.test.mjs",
        "arckit/spec/arcorbit-distribution.md",
        "arckit/tech/arcorbit/installer-supply-chain.md",
        "runtime/arcorbit/README.md",
        "Verification: 62 focused tests passed",
        "Verification: full ArcOrbit suite 507 tests, 495 passed, 12 skipped, 0 failed",
        "Verification: changed JavaScript files passed node --check; git diff --check passed",
        "Verification: no ARC_DEBUG marker or temporary diagnostic log retained"
      ],
      "runtime_result_ref": "arckit-runtime://runs/RUN-20260826-053155031Z-3bf55870",
      "occurred_at": "2026-08-26T05:45:48.059Z"
    },
    {
      "round": 2,
      "transition_schema_version": "arckit-case-transition/v8",
      "goal": "独立审查 content revision 1 的实现正确性、真实问题解决、验证可信度、回归风险与最小性。",
      "outcome": "completed",
      "gap_selection": {
        "mode": "candidate",
        "basis": "基于 post-commit fresh state 比较全部持久候选；四个 Project Gap 均需独立 Case，当前 Case 的 Completion Review 是唯一 ready 且阻塞关闭的候选。",
        "snapshot_token": "ef26808fcc7edcb5d8d5becc155606f4fce636e8b8f9ffb54bc1f514a1e9f18d",
        "selected_ref": "case-gap:CASE-20260826-006:CASE-20260826-006:completion-review:1",
        "comparison_summary": "四个 Project Gap 与本 Case 的启动期 skill reconciliation 验收门禁无直接替代关系，全部延后；选择唯一 ready 的 Completion Review。",
        "fresh_discovery_summary": "本轮独立审查未发现新的错误、遗漏、过度实现或会改变审查范围的 fresh candidate。",
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
            "reason": "动态场景验证需要独立 Case，不属于当前已闭合实现的 Completion Review。"
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
            "reason": "Runtime 韧性和 adapter 验收范围更广，不替代当前 Case 的关闭审查。"
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
            "reason": "真实权限项目验证需要独立受控资源，与本地启动 readiness 修复的完成审查无依赖。"
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
            "reason": "跨记录审计是独立 Project Gap，不解决或审查当前启动期 skill drift 修复。"
          },
          {
            "ref": "case-gap:CASE-20260826-006:CASE-20260826-006:completion-review:1",
            "source": "persisted",
            "eligibility": "ready",
            "disposition": "selected",
            "priority_basis": {
              "blocking": "high",
              "uncertainty": "low",
              "risk": "high",
              "user_impact": "high"
            },
            "reason": "全部普通 Case gaps 和 impacts 已闭合；该候选是唯一 ready 且必须完成的 Case 关闭门禁。"
          }
        ]
      },
      "selected_gap": {
        "id": "CASE-20260826-006:completion-review:1",
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
        "goal": "独立审查 content revision 1 的实现正确性、真实问题解决、验证可信度、回归风险与最小性。",
        "expected_state_change": "若五个维度均无 finding，则接受 clean Completion Review，使 Case 具备可信关闭条件。"
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
            "runtime/arcorbit/src/desktop-setup-readiness-context.mjs",
            "runtime/arcorbit/src/skill-provisioning-manager.mjs",
            "runtime/arcorbit/desktop/main.mjs",
            "runtime/arcorbit/test/desktop-renderer.test.mjs",
            "runtime/arcorbit/test/skill-provisioning-manager.test.mjs",
            "arckit/spec/arcorbit-distribution.md",
            "arckit/tech/arcorbit/installer-supply-chain.md",
            "Review verification: 62 focused tests passed, 0 failed",
            "Accepted verification fact: full ArcOrbit suite 507 tests, 495 passed, 12 skipped, 0 failed",
            "Review verification: changed JavaScript files passed node --check; git diff --check passed"
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
        "project_revision": 279,
        "judgments": [
          {
            "invariant_ref": "product-expectations-remain-recoverable",
            "disposition": "upheld",
            "reason": "审查确认启动检查范围、空项目行为和非 ready Automation gate 与已接受产品规格一致。",
            "fact_refs": [
              "FACT-20260826-006-004",
              "FACT-20260826-006-005"
            ],
            "evidence": [
              "arckit/spec/arcorbit-distribution.md:88",
              "arckit/spec/arcorbit-distribution.md:111",
              "arckit/spec/arcorbit-distribution.md:233"
            ],
            "gap_refs": []
          },
          {
            "invariant_ref": "interaction-expectations-remain-recoverable",
            "disposition": "upheld",
            "reason": "应用启动即可发现全部关联项目 drift 并进入既有 Setup Readiness 恢复路径，不再依赖手动切换项目。",
            "fact_refs": [
              "FACT-20260826-006-005"
            ],
            "evidence": [
              "arckit/spec/arcorbit-distribution.md:111",
              "runtime/arcorbit/desktop/main.mjs:202"
            ],
            "gap_refs": []
          },
          {
            "invariant_ref": "visual-language-remains-consistent",
            "disposition": "not_relevant",
            "reason": "本 Case 没有改变视觉语言、布局、主题或组件表现，Completion Review 也未发现视觉侧影响。",
            "fact_refs": [],
            "evidence": [],
            "gap_refs": []
          },
          {
            "invariant_ref": "technical-decisions-remain-explainable",
            "disposition": "upheld",
            "reason": "Desktop Store roots、空集合语义、SkillProvisioningManager plan 清理和 main-process gate 的边界在代码与技术方案中一致且可恢复。",
            "fact_refs": [
              "FACT-20260826-006-004",
              "FACT-20260826-006-005"
            ],
            "evidence": [
              "arckit/tech/arcorbit/installer-supply-chain.md:282",
              "arckit/tech/arcorbit/installer-supply-chain.md:359",
              "runtime/arcorbit/src/desktop-setup-readiness-context.mjs:23",
              "runtime/arcorbit/src/skill-provisioning-manager.mjs:59"
            ],
            "gap_refs": []
          },
          {
            "invariant_ref": "accepted-facts-are-realized",
            "disposition": "upheld",
            "reason": "代码审查与复跑测试共同确认实际启动路径兑现了全项目 fresh reconciliation、选择态独立、空项目 global-only 和 fail-closed gate。",
            "fact_refs": [
              "FACT-20260826-006-004",
              "FACT-20260826-006-005"
            ],
            "evidence": [
              "runtime/arcorbit/src/desktop-setup-readiness-context.mjs:14",
              "runtime/arcorbit/desktop/main.mjs:202",
              "runtime/arcorbit/test/desktop-renderer.test.mjs:1558",
              "Review verification: 62 focused tests passed, 0 failed"
            ],
            "gap_refs": []
          },
          {
            "invariant_ref": "material-risks-have-credible-evidence",
            "disposition": "upheld",
            "reason": "旧 skill 被 Automation 提前消费的风险由静态控制流审查、聚焦回归复跑及已接受的完整测试套件证据共同控制。",
            "fact_refs": [
              "FACT-20260826-006-005"
            ],
            "evidence": [
              "runtime/arcorbit/test/desktop-renderer.test.mjs:1589",
              "runtime/arcorbit/test/skill-provisioning-manager.test.mjs:287",
              "Review verification: 62 focused tests passed, 0 failed",
              "Accepted verification fact: full ArcOrbit suite 507 tests, 495 passed, 12 skipped, 0 failed"
            ],
            "gap_refs": []
          }
        ]
      },
      "evidence": [
        "runtime/arcorbit/src/desktop-setup-readiness-context.mjs",
        "runtime/arcorbit/src/skill-provisioning-manager.mjs",
        "runtime/arcorbit/desktop/main.mjs",
        "runtime/arcorbit/test/desktop-renderer.test.mjs",
        "runtime/arcorbit/test/skill-provisioning-manager.test.mjs",
        "arckit/spec/arcorbit-distribution.md",
        "arckit/tech/arcorbit/installer-supply-chain.md",
        "Review verification: 62 focused tests passed, 0 failed",
        "Accepted verification fact: full ArcOrbit suite 507 tests, 495 passed, 12 skipped, 0 failed",
        "Review verification: changed JavaScript files passed node --check; git diff --check passed"
      ],
      "runtime_result_ref": "arckit-runtime://runs/RUN-20260826-053155031Z-3bf55870",
      "occurred_at": "2026-08-26T05:49:15.211Z"
    }
  ],
  "case_resolution": {
    "status": "resolved",
    "stage": "resolved",
    "satisfied": [
      "GAP-20260826-006-001"
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
    "updated_at": "2026-08-26T05:49:15.211Z"
  }
}
```

## Round Notes

- Case history is canonical in Structured Record.rounds; keep prose notes exceptional.
