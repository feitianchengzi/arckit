# 收敛 ArcOrbit 本地能力检查触发边界

Case: CASE-20260826-010
Status: closed
Artifact Type: code
Selected Gap: none
Updated: 2026-08-26T15:47:47.707Z

## User Intent

让 ArcOrbit 仅在冷启动、本地项目产生新关联以及用户主动恢复时检查本地能力；查看或切换项目不得自动触发完整 Setup Readiness。

## Structured Record

```json
{
  "schema_version": "development-case-record/v5",
  "id": "CASE-20260826-010",
  "title": "收敛 ArcOrbit 本地能力检查触发边界",
  "status": "closed",
  "artifact_type": "code",
  "created_at": "2026-08-26T15:32:50.427Z",
  "updated_at": "2026-08-26T15:47:47.707Z",
  "user_intent": "让 ArcOrbit 仅在冷启动、本地项目产生新关联以及用户主动恢复时检查本地能力；查看或切换项目不得自动触发完整 Setup Readiness。",
  "expected_outcome": "项目集全部与具体项目之间的纯查看切换只刷新对应业务数据，不执行 skill provisioning；应用冷启动和新增/变更本地项目关联仍立即检查全部关联本地项目，用户主动“重新检查”继续可用。",
  "project_state_ref": "arckit/project/state.record.json",
  "current_round": {
    "goal": "",
    "selected_gap": null
  },
  "facts": [
    {
      "id": "FACT-20260826-010-001",
      "revision": 1,
      "status": "superseded",
      "statement": "Renderer 的 productScopeSelect change handler 在每次项目查看范围变化后无条件调用 checkSetupReadinessForSelection；该函数通过 typed IPC 执行完整 coordinated Setup Readiness，而不是仅刷新当前项目视图。",
      "basis": "静态控制流完整解释用户报告的“切换查看项目必然触发检查”，触发条件、调用位置和时序均一致。",
      "evidence": [
        "runtime/arcorbit/desktop/renderer/renderer.js:623",
        "runtime/arcorbit/desktop/renderer/renderer.js:631",
        "runtime/arcorbit/desktop/renderer/renderer.js:4308",
        "Current operator input, 2026-08-26"
      ]
    },
    {
      "id": "FACT-20260826-010-002",
      "revision": 1,
      "status": "accepted",
      "statement": "应用冷启动由 main process 独立执行 coordinated Setup Readiness；本地项目被新增或绑定到远端项目后，两条绑定路径也显式执行能力检查。用户主动“重新检查”另有独立按钮入口。",
      "basis": "main-process 启动链、两个 workspace binding handler 和 Setup Retry handler 明确建立这些独立触发点。",
      "evidence": [
        "runtime/arcorbit/desktop/main.mjs:202",
        "runtime/arcorbit/desktop/renderer/renderer.js:324",
        "runtime/arcorbit/desktop/renderer/renderer.js:329",
        "runtime/arcorbit/desktop/renderer/renderer.js:1728",
        "runtime/arcorbit/desktop/renderer/renderer.js:1731",
        "runtime/arcorbit/desktop/renderer/renderer.js:3639",
        "runtime/arcorbit/desktop/renderer/renderer.js:3641"
      ]
    },
    {
      "id": "FACT-20260826-010-003",
      "revision": 1,
      "status": "accepted",
      "statement": "本地能力设置的自动显式检查应限于应用冷启动和项目集产生新的本地项目关联；项目集全部与具体项目之间的纯查看切换不得检查。用户主动恢复或重试不属于自动查看触发，应继续可用。",
      "basis": "当前操作者明确修正了检查频率和交互边界；既有独立入口允许在不牺牲恢复能力的前提下移除查看副作用。",
      "evidence": [
        "Current operator input, 2026-08-26",
        "runtime/arcorbit/desktop/renderer/renderer.js:324",
        "runtime/arcorbit/desktop/main.mjs:202"
      ]
    },
    {
      "id": "FACT-20260826-010-004",
      "revision": 1,
      "status": "accepted",
      "statement": "ArcOrbit 对本地项目 skills 的 fresh Setup Readiness 只由应用冷启动、新增或改变本地项目关联及用户主动重试触发。项目集、具体项目、Workset 等纯查看切换和解除关联不触发检查；Chat/Automation task start 只读取当前 SkillProvisioningManager snapshot，要求状态为 ready 且当前规范化 task root 已包含在最近成功检查的 plan.project_roots 中，否则 fail closed。",
      "basis": "实现、回归测试和稳定产品/交互/技术文档共同建立该边界。",
      "evidence": [
        "runtime/arcorbit/desktop/renderer/renderer.js:623",
        "runtime/arcorbit/desktop/renderer/renderer.js:1729",
        "runtime/arcorbit/desktop/renderer/renderer.js:3642",
        "runtime/arcorbit/desktop/main.mjs:117",
        "runtime/arcorbit/src/skill-provisioning-manager.mjs:242",
        "arckit/spec/arcorbit-distribution.md:88",
        "arckit/interaction/setup-readiness/default.html:19",
        "arckit/tech/arcorbit/installer-supply-chain.md:288"
      ]
    }
  ],
  "state_impacts": [
    {
      "id": "IMPACT-20260826-010-001",
      "fact_id": "FACT-20260826-010-004",
      "fact_revision": 1,
      "target": {
        "kind": "software_decision",
        "ref": "experience_and_interaction",
        "revision": 57
      },
      "effect": "upheld",
      "reason": "项目集与具体项目之间的纯查看切换只刷新业务投影，不再携带可见且昂贵的 Setup 副作用。",
      "gap_ids": [],
      "evidence": [
        "runtime/arcorbit/desktop/renderer/renderer.js:623",
        "arckit/interaction/setup-readiness/interaction.md:46"
      ]
    },
    {
      "id": "IMPACT-20260826-010-002",
      "fact_id": "FACT-20260826-010-004",
      "fact_revision": 1,
      "target": {
        "kind": "software_invariant",
        "ref": "accepted-facts-are-realized",
        "revision": null
      },
      "effect": "upheld",
      "reason": "实际 Renderer、binding 和 task preflight 路径已实现操作者接受的触发策略。",
      "gap_ids": [],
      "evidence": [
        "runtime/arcorbit/desktop/renderer/renderer.js:623",
        "runtime/arcorbit/desktop/renderer/renderer.js:3642",
        "runtime/arcorbit/src/skill-provisioning-manager.mjs:247"
      ]
    },
    {
      "id": "IMPACT-20260826-010-003",
      "fact_id": "FACT-20260826-010-004",
      "fact_revision": 1,
      "target": {
        "kind": "software_decision",
        "ref": "product_capabilities",
        "revision": 37
      },
      "effect": "upheld",
      "reason": "Setup Readiness 保留必要的新鲜度检查与主动恢复能力，同时不再干扰高频项目浏览。",
      "gap_ids": [],
      "evidence": [
        "arckit/spec/arcorbit-distribution.md:88",
        "runtime/arcorbit/desktop/renderer/renderer.js:623"
      ]
    },
    {
      "id": "IMPACT-20260826-010-004",
      "fact_id": "FACT-20260826-010-004",
      "fact_revision": 1,
      "target": {
        "kind": "software_decision",
        "ref": "technical_foundation",
        "revision": 40
      },
      "effect": "upheld",
      "reason": "fresh aggregate check 与 task-start 缓存断言已形成明确的 main-process/manager 技术边界。",
      "gap_ids": [],
      "evidence": [
        "runtime/arcorbit/desktop/main.mjs:117",
        "runtime/arcorbit/src/skill-provisioning-manager.mjs:242",
        "arckit/tech/arcorbit/installer-supply-chain.md:313"
      ]
    },
    {
      "id": "IMPACT-20260826-010-005",
      "fact_id": "FACT-20260826-010-004",
      "fact_revision": 1,
      "target": {
        "kind": "software_decision",
        "ref": "quality_and_validation",
        "revision": 19
      },
      "effect": "upheld",
      "reason": "纯查看、新关联、解除关联、主动重试、缓存断言和未验证 root 拒绝均有回归证据，并完成完整套件核验。",
      "gap_ids": [],
      "evidence": [
        "runtime/arcorbit/test/desktop-renderer.test.mjs:1480",
        "runtime/arcorbit/test/desktop-renderer.test.mjs:1493",
        "runtime/arcorbit/test/skill-provisioning-manager.test.mjs:241",
        "Verification: 63 focused tests passed, 0 failed",
        "Verification: authorized Electron rerun 2 passed, 0 failed"
      ]
    }
  ],
  "gaps": [
    {
      "id": "GAP-20260826-010-001",
      "status": "resolved",
      "goal": "移除纯项目查看切换触发的 Setup Readiness，同时保留冷启动、新增或变更本地项目关联及用户主动重试入口，并以回归测试和稳定文档证明触发边界。",
      "reason": "根因和目标策略均已由当前 accepted facts 界定，可以直接实施而无需新的前置决定。",
      "derived_from": [
        "FACT-20260826-010-001",
        "FACT-20260826-010-002",
        "FACT-20260826-010-003"
      ],
      "blocked_by": [],
      "priority_basis": {
        "blocking": "当前高频查看行为持续触发不必要的完整能力检查。",
        "uncertainty": "低；静态控制流与用户现象完全匹配。",
        "risk": "中高；移除错误入口时必须避免误删冷启动、关联变更和主动恢复能力。",
        "user_impact": "高；项目浏览是高频操作，当前检查显著破坏体验。"
      },
      "responsibility": "agent",
      "evidence_required": [
        "回归测试证明 productScopeSelect 纯查看切换不调用 Setup Readiness。",
        "回归测试证明应用冷启动仍检查全部关联本地项目。",
        "回归测试证明新增或变更本地项目关联后仍执行检查，而解除关联不产生无意义检查。",
        "回归测试证明用户主动“重新检查”入口保持可用。",
        "产品、交互与技术文档明确区分自动检查、关联变更检查和纯查看行为。"
      ],
      "resolution": {
        "id": "GAP-20260826-010-001",
        "status": "resolved",
        "outcome": "resolved",
        "reason": "错误的项目查看回调已移除，解除关联跳过检查，新关联和主动重试入口保留；task-start skill preflight 已改为不触碰文件系统的缓存断言，稳定规格、交互和技术方案同步完成并通过回归。",
        "evidence": [
          "runtime/arcorbit/desktop/renderer/renderer.js:324",
          "runtime/arcorbit/desktop/renderer/renderer.js:623",
          "runtime/arcorbit/desktop/renderer/renderer.js:1726",
          "runtime/arcorbit/desktop/renderer/renderer.js:3642",
          "runtime/arcorbit/desktop/main.mjs:117",
          "runtime/arcorbit/src/skill-provisioning-manager.mjs:242",
          "runtime/arcorbit/test/desktop-renderer.test.mjs:1493",
          "runtime/arcorbit/test/skill-provisioning-manager.test.mjs:241",
          "arckit/spec/arcorbit-distribution.md:88",
          "arckit/interaction/setup-readiness/interaction.md:22",
          "arckit/tech/arcorbit/installer-supply-chain.md:313",
          "Verification: 63 focused tests passed, 0 failed",
          "Verification: ArcOrbit suite 525 tests; 504 passed, 19 skipped, 2 sandbox Electron SIGABRT cases passed 2/2 in authorized rerun",
          "Verification: changed JavaScript files passed node --check; git diff --check passed"
        ],
        "occurred_at": "2026-08-26T15:44:41.177Z"
      }
    }
  ],
  "content_revision": 1,
  "completion_review": {
    "status": "clean",
    "policy": {
      "initial_max_cycles": 10,
      "source": "runtime/arcorbit/config/case-policy.json",
      "snapshotted_at": "2026-08-26T15:32:50.427Z"
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
          "runtime/arcorbit/desktop/renderer/renderer.js:623",
          "runtime/arcorbit/desktop/renderer/renderer.js:1729",
          "runtime/arcorbit/desktop/renderer/renderer.js:3642",
          "runtime/arcorbit/desktop/main.mjs:117",
          "runtime/arcorbit/desktop/main.mjs:190",
          "runtime/arcorbit/src/desktop-setup-readiness-context.mjs:18",
          "runtime/arcorbit/src/skill-provisioning-manager.mjs:242",
          "runtime/arcorbit/test/desktop-renderer.test.mjs:1480",
          "runtime/arcorbit/test/desktop-renderer.test.mjs:1493",
          "runtime/arcorbit/test/skill-provisioning-manager.test.mjs:241",
          "arckit/spec/arcorbit-distribution.md:88",
          "arckit/interaction/setup-readiness/interaction.md:22",
          "arckit/tech/arcorbit/installer-supply-chain.md:313",
          "Verification: 63 focused tests passed, 0 failed",
          "Verification: ArcOrbit suite 525 tests; 504 passed, 19 conditional skips, 2 sandbox Electron SIGABRT cases passed 2/2 in authorized rerun",
          "Verification: changed JavaScript files passed node --check; git diff --check passed"
        ],
        "occurred_at": "2026-08-26T15:47:47.707Z"
      }
    ],
    "evidence": [
      "runtime/arcorbit/desktop/renderer/renderer.js:623",
      "runtime/arcorbit/desktop/renderer/renderer.js:1729",
      "runtime/arcorbit/desktop/renderer/renderer.js:3642",
      "runtime/arcorbit/desktop/main.mjs:117",
      "runtime/arcorbit/desktop/main.mjs:190",
      "runtime/arcorbit/src/desktop-setup-readiness-context.mjs:18",
      "runtime/arcorbit/src/skill-provisioning-manager.mjs:242",
      "runtime/arcorbit/test/desktop-renderer.test.mjs:1480",
      "runtime/arcorbit/test/desktop-renderer.test.mjs:1493",
      "runtime/arcorbit/test/skill-provisioning-manager.test.mjs:241",
      "arckit/spec/arcorbit-distribution.md:88",
      "arckit/interaction/setup-readiness/interaction.md:22",
      "arckit/tech/arcorbit/installer-supply-chain.md:313",
      "Verification: 63 focused tests passed, 0 failed",
      "Verification: ArcOrbit suite 525 tests; 504 passed, 19 conditional skips, 2 sandbox Electron SIGABRT cases passed 2/2 in authorized rerun",
      "Verification: changed JavaScript files passed node --check; git diff --check passed"
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
      "goal": "收敛 Setup Readiness 的 fresh-check 触发点，消除纯查看和 task-start 重扫，同时保持冷启动、新关联、主动恢复与 fail-closed gate。",
      "outcome": "completed",
      "gap_selection": {
        "mode": "candidate",
        "basis": "基于 CASE-20260826-010 的 post-commit fresh selection token 比较全部持久候选；触发边界修复是唯一 ready Case Gap，并直接对应高频项目浏览的用户体验回归。",
        "snapshot_token": "be9c0d4f779701a122b36aa9d4aabd2987aff9c130f0b321fa66a2674d89bba8",
        "selected_ref": "case-gap:CASE-20260826-010:GAP-20260826-010-001",
        "comparison_summary": "4 个 Project Gap 均需独立 Case，不能替代当前已界定的 Setup Readiness 触发修复；选择唯一 ready Case Gap。",
        "fresh_discovery_summary": "实现检查发现 task-start preflight 也会重新扫描 skills；这属于同一已接受的“冷启动/新关联/主动恢复之外不检查”触发边界，已在本 Gap 内收敛为缓存断言，没有形成新的独立 Gap。",
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
            "reason": "动态场景评估需要独立 Case，不直接修复当前 Renderer 和 preflight 触发副作用。"
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
            "reason": "Runtime 韧性范围更广，不替代当前有明确根因和验收口径的 Setup 触发边界。"
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
            "reason": "真实权限项目验证与本地只读触发控制流没有前置依赖。"
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
            "reason": "跨记录审计不能解决高频查看触发完整能力检查的问题。"
          },
          {
            "ref": "case-gap:CASE-20260826-010:GAP-20260826-010-001",
            "source": "persisted",
            "eligibility": "ready",
            "disposition": "selected",
            "priority_basis": {
              "blocking": "当前高频查看行为持续触发不必要的完整能力检查。",
              "uncertainty": "低；静态控制流与用户现象完全匹配。",
              "risk": "中高；必须在移除错误入口时保持冷启动、关联变更、主动恢复和 fail-closed task gate。",
              "user_impact": "高；项目浏览是高频操作，当前检查显著破坏体验。"
            },
            "reason": "唯一 ready Case Gap，根因、期望边界和验证要求均由 accepted facts 界定。"
          }
        ]
      },
      "selected_gap": {
        "id": "GAP-20260826-010-001",
        "responsibility": "agent",
        "goal": "移除纯项目查看切换触发的 Setup Readiness，同时保留冷启动、新增或变更本地项目关联及用户主动重试入口，并以回归测试和稳定文档证明触发边界。",
        "reason": "根因和目标策略均已由当前 accepted facts 界定，可以直接实施而无需新的前置决定。",
        "derived_from": [
          "FACT-20260826-010-001",
          "FACT-20260826-010-002",
          "FACT-20260826-010-003"
        ],
        "blocked_by": [],
        "priority_basis": {
          "blocking": "当前高频查看行为持续触发不必要的完整能力检查。",
          "uncertainty": "低；静态控制流与用户现象完全匹配。",
          "risk": "中高；移除错误入口时必须避免误删冷启动、关联变更和主动恢复能力。",
          "user_impact": "高；项目浏览是高频操作，当前检查显著破坏体验。"
        },
        "evidence_required": [
          "回归测试证明 productScopeSelect 纯查看切换不调用 Setup Readiness。",
          "回归测试证明应用冷启动仍检查全部关联本地项目。",
          "回归测试证明新增或变更本地项目关联后仍执行检查，而解除关联不产生无意义检查。",
          "回归测试证明用户主动“重新检查”入口保持可用。",
          "产品、交互与技术文档明确区分自动检查、关联变更检查和纯查看行为。"
        ]
      },
      "planned_transition": {
        "goal": "收敛 Setup Readiness 的 fresh-check 触发点，消除纯查看和 task-start 重扫，同时保持冷启动、新关联、主动恢复与 fail-closed gate。",
        "expected_state_change": "项目/Workset 查看切换和解除关联只更新业务投影；冷启动与新增/改绑检查全部关联 roots；主动重试继续 fresh-check；task start 只断言缓存 ready 状态覆盖当前 root。"
      },
      "accepted_state_delta": {
        "resolved_gap": {
          "id": "GAP-20260826-010-001",
          "status": "resolved",
          "outcome": "resolved",
          "reason": "错误的项目查看回调已移除，解除关联跳过检查，新关联和主动重试入口保留；task-start skill preflight 已改为不触碰文件系统的缓存断言，稳定规格、交互和技术方案同步完成并通过回归。",
          "evidence": [
            "runtime/arcorbit/desktop/renderer/renderer.js:324",
            "runtime/arcorbit/desktop/renderer/renderer.js:623",
            "runtime/arcorbit/desktop/renderer/renderer.js:1726",
            "runtime/arcorbit/desktop/renderer/renderer.js:3642",
            "runtime/arcorbit/desktop/main.mjs:117",
            "runtime/arcorbit/src/skill-provisioning-manager.mjs:242",
            "runtime/arcorbit/test/desktop-renderer.test.mjs:1493",
            "runtime/arcorbit/test/skill-provisioning-manager.test.mjs:241",
            "arckit/spec/arcorbit-distribution.md:88",
            "arckit/interaction/setup-readiness/interaction.md:22",
            "arckit/tech/arcorbit/installer-supply-chain.md:313",
            "Verification: 63 focused tests passed, 0 failed",
            "Verification: ArcOrbit suite 525 tests; 504 passed, 19 skipped, 2 sandbox Electron SIGABRT cases passed 2/2 in authorized rerun",
            "Verification: changed JavaScript files passed node --check; git diff --check passed"
          ]
        },
        "facts_added": [
          {
            "id": "FACT-20260826-010-004",
            "revision": 1,
            "status": "accepted",
            "statement": "ArcOrbit 对本地项目 skills 的 fresh Setup Readiness 只由应用冷启动、新增或改变本地项目关联及用户主动重试触发。项目集、具体项目、Workset 等纯查看切换和解除关联不触发检查；Chat/Automation task start 只读取当前 SkillProvisioningManager snapshot，要求状态为 ready 且当前规范化 task root 已包含在最近成功检查的 plan.project_roots 中，否则 fail closed。",
            "basis": "实现、回归测试和稳定产品/交互/技术文档共同建立该边界。",
            "evidence": [
              "runtime/arcorbit/desktop/renderer/renderer.js:623",
              "runtime/arcorbit/desktop/renderer/renderer.js:1729",
              "runtime/arcorbit/desktop/renderer/renderer.js:3642",
              "runtime/arcorbit/desktop/main.mjs:117",
              "runtime/arcorbit/src/skill-provisioning-manager.mjs:242",
              "arckit/spec/arcorbit-distribution.md:88",
              "arckit/interaction/setup-readiness/default.html:19",
              "arckit/tech/arcorbit/installer-supply-chain.md:288"
            ]
          }
        ],
        "facts_superseded": [
          {
            "id": "FACT-20260826-010-001",
            "revision": 1,
            "reason": "productScopeSelect change handler 已不再调用 checkSetupReadinessForSelection，修复前的无条件检查控制流不再成立。",
            "evidence": [
              "runtime/arcorbit/desktop/renderer/renderer.js:623",
              "runtime/arcorbit/test/desktop-renderer.test.mjs:1493"
            ]
          }
        ],
        "impacts_added": [
          {
            "id": "IMPACT-20260826-010-003",
            "fact_id": "FACT-20260826-010-004",
            "fact_revision": 1,
            "target": {
              "kind": "software_decision",
              "ref": "product_capabilities",
              "revision": 37
            },
            "effect": "upheld",
            "reason": "Setup Readiness 保留必要的新鲜度检查与主动恢复能力，同时不再干扰高频项目浏览。",
            "gap_ids": [],
            "evidence": [
              "arckit/spec/arcorbit-distribution.md:88",
              "runtime/arcorbit/desktop/renderer/renderer.js:623"
            ]
          },
          {
            "id": "IMPACT-20260826-010-004",
            "fact_id": "FACT-20260826-010-004",
            "fact_revision": 1,
            "target": {
              "kind": "software_decision",
              "ref": "technical_foundation",
              "revision": 40
            },
            "effect": "upheld",
            "reason": "fresh aggregate check 与 task-start 缓存断言已形成明确的 main-process/manager 技术边界。",
            "gap_ids": [],
            "evidence": [
              "runtime/arcorbit/desktop/main.mjs:117",
              "runtime/arcorbit/src/skill-provisioning-manager.mjs:242",
              "arckit/tech/arcorbit/installer-supply-chain.md:313"
            ]
          },
          {
            "id": "IMPACT-20260826-010-005",
            "fact_id": "FACT-20260826-010-004",
            "fact_revision": 1,
            "target": {
              "kind": "software_decision",
              "ref": "quality_and_validation",
              "revision": 19
            },
            "effect": "upheld",
            "reason": "纯查看、新关联、解除关联、主动重试、缓存断言和未验证 root 拒绝均有回归证据，并完成完整套件核验。",
            "gap_ids": [],
            "evidence": [
              "runtime/arcorbit/test/desktop-renderer.test.mjs:1480",
              "runtime/arcorbit/test/desktop-renderer.test.mjs:1493",
              "runtime/arcorbit/test/skill-provisioning-manager.test.mjs:241",
              "Verification: 63 focused tests passed, 0 failed",
              "Verification: authorized Electron rerun 2 passed, 0 failed"
            ]
          }
        ],
        "impacts_updated": [
          {
            "id": "IMPACT-20260826-010-001",
            "fact_id": "FACT-20260826-010-004",
            "fact_revision": 1,
            "target": {
              "kind": "software_decision",
              "ref": "experience_and_interaction",
              "revision": 57
            },
            "effect": "upheld",
            "reason": "项目集与具体项目之间的纯查看切换只刷新业务投影，不再携带可见且昂贵的 Setup 副作用。",
            "gap_ids": [],
            "evidence": [
              "runtime/arcorbit/desktop/renderer/renderer.js:623",
              "arckit/interaction/setup-readiness/interaction.md:46"
            ]
          },
          {
            "id": "IMPACT-20260826-010-002",
            "fact_id": "FACT-20260826-010-004",
            "fact_revision": 1,
            "target": {
              "kind": "software_invariant",
              "ref": "accepted-facts-are-realized",
              "revision": null
            },
            "effect": "upheld",
            "reason": "实际 Renderer、binding 和 task preflight 路径已实现操作者接受的触发策略。",
            "gap_ids": [],
            "evidence": [
              "runtime/arcorbit/desktop/renderer/renderer.js:623",
              "runtime/arcorbit/desktop/renderer/renderer.js:3642",
              "runtime/arcorbit/src/skill-provisioning-manager.mjs:247"
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
            "observed_revision": 36,
            "set_decision": {
              "status": "settled",
              "statement": "ArcOrbit 保留既有 Desktop、Runtime、Chat、Automation、Feedback 与 Work 能力和边界。Work 是 Workshop 待办同步与本地 Task Projection 的唯一客户端所有者；新建和编辑 Sheet 提供完整七状态，编辑 Sheet 是异常纠偏兜底，Inspector 按当前状态提供有限下一步动作。Work Inspector 默认更宽，支持可访问拖拽调宽与跨应用重启恢复，并使用内容、紧凑属性、协作和验收语义分区。Work 编辑待办允许把内容复制到当前产品集内另一个可写产品，并在目标创建获 Workshop 确认后删除源 Task。目标 Task 获得新身份，仅复制正文、状态、优先级及目标产品内重新选择的关联字段，不继承评论、附件、Run、session、thread、Gate 或验收问题。Work 负责两阶段 mutation 和部分成功恢复；Automation 只消费服务器确认后的本地状态。Setup Readiness 在应用冷启动时 fresh-check Desktop Store 中全部已关联本地项目相对于内置 payload 的 skill drift；新增或改变本地项目关联及用户主动重试会再次检查。项目集、具体项目、Workset 等纯查看切换、解除关联和 task start 不重新扫描 skills，task start 只消费已验证缓存并 fail closed。trusted Case binding 的既有能力和边界保持不变。Setup Readiness 对同名项目 skill、loader、共享资源和用户按需 catalog 冲突保留 typed diagnostic；当 provider 证明安全目标与唯一内置来源时，用户可逐项选择“备份并使用当前应用包覆盖所选同名 skill”，未选和无关内容保持不变。",
              "reason": "本地能力检查已收敛到低频、必要和用户主动的触发点，同时保留 Automation 安全门禁。",
              "evidence": [
                "arckit/spec/arcorbit-distribution.md",
                "runtime/arcorbit/desktop/renderer/renderer.js",
                "runtime/arcorbit/src/skill-provisioning-manager.mjs",
                "runtime/arcorbit/test/desktop-renderer.test.mjs"
              ],
              "confidence": "high",
              "resume_condition": "当冷启动、新关联、主动恢复、查看切换、解除关联或 task-start readiness gate 的触发语义改变时重审。"
            },
            "gap_refs": [
              "GAP-agent-scenario-evaluation"
            ],
            "reason": "接受收敛后的 Setup Readiness 触发边界为稳定产品能力。",
            "evidence": [
              "arckit/spec/arcorbit-distribution.md:88",
              "Verification: 63 focused tests passed, 0 failed"
            ]
          },
          {
            "area_ref": "experience_and_interaction",
            "observed_revision": 56,
            "set_decision": {
              "status": "settled",
              "statement": "ArcOrbit 保持既有 Personal、Product Lifecycle、Organization 导航与 Work、Automation、Feedback、Chat 等交互语义。Work 新建和编辑 Sheet 保留完整七状态，编辑 Sheet 承担异常纠偏；右侧 Inspector 按当前状态显示有限下一步动作。Work Inspector 首次使用 440px，用户可通过 12px 可访问分隔条在 360–640px 保存范围内拖拽、键盘调整或双击复位，偏好跨任务、项目、Workset 和应用重启恢复。布局为任务树保留至少 420px，窗口临时收窄只改变有效宽度且不覆盖保存值。Inspector 以单一内部滚动区组织身份动作、内容、紧凑属性、协作和按状态出现的验收分区，宽度变化不丢失选择、滚动、草稿或附件状态。Work 已完成列表按新完成在上、历史完成在下排列；标记首项为已验收后选择下一条较旧待办，标记其他位置后选择相邻较新待办，树补全项不参与目标计算，且选择只在服务器确认成功后切换。验收请求期间允许浏览其他任务；若用户在服务器确认前产生较新的选择，成功回调保留该选择而不执行旧任务的自动相邻切换。Work 新建待办 Sheet 在执行人控件下根据执行人与状态原位解释 Automation 资格。跨产品替换、主窗口和 Case 绑定恢复的既有交互保持不变。应用冷启动检查全部关联本地项目；新增或改变本地关联及用户主动重试再次检查。项目集全部、具体项目、Workset 或其它纯查看切换只改变业务投影，不进入 Setup；解除关联和 task start 不重新扫描 skills。task start 缓存断言失败时返回 Setup，等待用户主动重新检查。Setup 冲突页逐项显示稳定 code、skill、目标类型与路径及双方 digest；兜底覆盖默认全不选，支持逐项或全选可恢复项，独立确认 recovery root 与 fresh assessment digest，并反馈备份、替换、回滚和残留状态。",
              "reason": "高频浏览已与低频环境检查解耦，必要恢复路径和 fail-closed 反馈保持明确。",
              "evidence": [
                "arckit/interaction/task-browser/interaction.md",
                "arckit/interaction/setup-readiness/interaction.md",
                "arckit/interaction/setup-readiness/default.html",
                "runtime/arcorbit/desktop/renderer/renderer.js"
              ],
              "confidence": "high",
              "resume_condition": "当 Setup 自动触发点、纯查看副作用、主动重试或 task-start 恢复反馈改变时重审。"
            },
            "gap_refs": [],
            "reason": "同步无副作用项目浏览与 Setup 恢复交互。",
            "evidence": [
              "arckit/interaction/setup-readiness/interaction.md:22",
              "arckit/interaction/setup-readiness/default.html:19"
            ]
          },
          {
            "area_ref": "technical_foundation",
            "observed_revision": 39,
            "set_decision": {
              "status": "settled",
              "statement": "Arckit 与 ArcOrbit 的既有 ledger、Electron、Runtime、Platform Coordinator、Work Sync、Chat、Setup Readiness 和 trusted case-control 技术边界保持不变。Work Inspector 偏好继续由 Desktop Store、typed preload action 和 Renderer 持有。应用冷启动的 coordinated Setup Readiness 由 main process fresh-read Desktop Store 中全部本地 Product Workspace roots；新增或改变本地关联及用户主动 retry 使用相同 aggregate check，显式空 roots 清除既有 project plan 并执行 global-only。Renderer 项目/Workset 筛选不触发检查，解除关联跳过检查。SkillProvisioningManager.assertReady(projectRoot) 只读取内存 snapshot，要求 ready 且 project root 位于最近成功检查的 plan.project_roots；Chat/Automation task start 不调用 provider 或扫描 skills。SkillProvisioningManager 的 plan、drift、同名冲突诊断和 backup-and-overwrite-selected 事务边界保持不变。",
              "reason": "fresh 检查与执行前缓存断言现已分离，避免高频 I/O 并保留 fail-closed root coverage。",
              "evidence": [
                "arckit/tech/arcorbit/installer-supply-chain.md",
                "runtime/arcorbit/desktop/main.mjs",
                "runtime/arcorbit/desktop/renderer/renderer.js",
                "runtime/arcorbit/src/skill-provisioning-manager.mjs"
              ],
              "confidence": "high",
              "resume_condition": "当 aggregate check 触发、snapshot 生命周期、project_roots 覆盖或 task-start gate 改变时重审。"
            },
            "gap_refs": [
              "GAP-runtime-resilience-and-adapters"
            ],
            "reason": "同步 Setup fresh-check 与缓存 preflight 的技术职责。",
            "evidence": [
              "arckit/tech/arcorbit/installer-supply-chain.md:288",
              "arckit/tech/arcorbit/installer-supply-chain.md:313"
            ]
          },
          {
            "area_ref": "quality_and_validation",
            "observed_revision": 18,
            "set_decision": {
              "status": "settled",
              "statement": "既有协议、Runtime、realtime、Work、Chat、Automation、安全、Setup、同名冲突恢复和跨平台窗口验证义务保持不变。Setup Readiness 还必须证明：冷启动检查全部关联本地 roots；新增或改绑后再次检查全部 roots；项目集、具体项目和 Workset 纯查看切换不调用 Setup；解除关联不产生检查；用户主动 retry 保持 fresh-check；task-start skill preflight 不读取文件或调用 provider，只接受 ready 且覆盖当前规范化 root 的缓存状态；未验证 root fail closed。完整 ArcOrbit 套件与需要 GUI 权限的 Electron 回归必须分别记录可重复结果。",
              "reason": "触发频率和缓存门禁同时涉及体验与执行安全，必须以 source-level wiring、manager 行为测试和完整回归共同证明。",
              "evidence": [
                "runtime/arcorbit/test/desktop-renderer.test.mjs",
                "runtime/arcorbit/test/skill-provisioning-manager.test.mjs",
                "arckit/spec/arcorbit-distribution.md",
                "arckit/interaction/setup-readiness/interaction.md",
                "arckit/tech/arcorbit/installer-supply-chain.md",
                "Verification: 63 focused tests passed, 0 failed",
                "Verification: ArcOrbit suite 525 tests; 504 passed, 19 skipped, authorized Electron rerun 2 passed"
              ],
              "confidence": "high",
              "resume_condition": "当 Setup 触发入口、关联生命周期、snapshot 断言或 Automation/Chat preflight 改变时重审。"
            },
            "gap_refs": [
              "GAP-agent-scenario-evaluation",
              "GAP-cross-record-audit"
            ],
            "reason": "接受触发边界与缓存断言的回归标准。",
            "evidence": [
              "runtime/arcorbit/test/desktop-renderer.test.mjs:1493",
              "runtime/arcorbit/test/skill-provisioning-manager.test.mjs:241"
            ]
          }
        ],
        "software_invariant_changes": [],
        "project_gap_changes": [],
        "selection_context_change": null,
        "evidence": [
          "arckit/spec/arcorbit-distribution.md",
          "arckit/interaction/setup-readiness/interaction.md",
          "arckit/interaction/setup-readiness/default.html",
          "arckit/tech/arcorbit/installer-supply-chain.md",
          "runtime/arcorbit/desktop/renderer/renderer.js",
          "runtime/arcorbit/desktop/main.mjs",
          "runtime/arcorbit/src/skill-provisioning-manager.mjs",
          "Verification: 63 focused tests passed, 0 failed",
          "Verification: authorized Electron rerun 2 passed, 0 failed"
        ]
      },
      "invariant_assessment": {
        "project_revision": 291,
        "judgments": [
          {
            "invariant_ref": "product-expectations-remain-recoverable",
            "disposition": "upheld",
            "reason": "检查触发、缓存 gate、主动恢复和纯查看非触发语义已写入权威产品规格。",
            "fact_refs": [
              "FACT-20260826-010-004"
            ],
            "evidence": [
              "arckit/spec/arcorbit-distribution.md:88",
              "arckit/spec/arcorbit-distribution.md:245"
            ],
            "gap_refs": []
          },
          {
            "invariant_ref": "interaction-expectations-remain-recoverable",
            "disposition": "upheld",
            "reason": "页面进入条件、纯查看行为、解除关联和 task-start 恢复反馈已在交互文档与线框中明确。",
            "fact_refs": [
              "FACT-20260826-010-004"
            ],
            "evidence": [
              "arckit/interaction/setup-readiness/interaction.md:22",
              "arckit/interaction/setup-readiness/interaction.md:46",
              "arckit/interaction/setup-readiness/default.html:19"
            ],
            "gap_refs": []
          },
          {
            "invariant_ref": "visual-language-remains-consistent",
            "disposition": "not_relevant",
            "reason": "本轮仅修订线框中的触发说明文本，没有改变布局、组件、主题、视觉层级或 Design Tokens。",
            "fact_refs": [],
            "evidence": [],
            "gap_refs": []
          },
          {
            "invariant_ref": "technical-decisions-remain-explainable",
            "disposition": "upheld",
            "reason": "fresh aggregate check、Renderer 触发入口、缓存 snapshot 断言和 Runtime preflight 的关系已有持久技术说明与直接代码证据。",
            "fact_refs": [
              "FACT-20260826-010-004"
            ],
            "evidence": [
              "arckit/tech/arcorbit/installer-supply-chain.md:288",
              "arckit/tech/arcorbit/installer-supply-chain.md:313",
              "runtime/arcorbit/desktop/main.mjs:117",
              "runtime/arcorbit/src/skill-provisioning-manager.mjs:242"
            ],
            "gap_refs": []
          },
          {
            "invariant_ref": "accepted-facts-are-realized",
            "disposition": "upheld",
            "reason": "实际控制流已移除查看切换检查、跳过解除关联、保留新关联和主动 retry，并以缓存 root coverage 约束 task start。",
            "fact_refs": [
              "FACT-20260826-010-004",
              "FACT-20260826-010-002",
              "FACT-20260826-010-003"
            ],
            "evidence": [
              "runtime/arcorbit/desktop/renderer/renderer.js:324",
              "runtime/arcorbit/desktop/renderer/renderer.js:623",
              "runtime/arcorbit/desktop/renderer/renderer.js:1729",
              "runtime/arcorbit/desktop/renderer/renderer.js:3642",
              "runtime/arcorbit/src/skill-provisioning-manager.mjs:247"
            ],
            "gap_refs": []
          },
          {
            "invariant_ref": "material-risks-have-credible-evidence",
            "disposition": "upheld",
            "reason": "误删必要检查和放松 Automation gate 的风险由 focused tests、未验证 root 拒绝、完整语料回归及授权 Electron 复跑共同控制。",
            "fact_refs": [
              "FACT-20260826-010-004"
            ],
            "evidence": [
              "runtime/arcorbit/test/desktop-renderer.test.mjs:1480",
              "runtime/arcorbit/test/desktop-renderer.test.mjs:1493",
              "runtime/arcorbit/test/skill-provisioning-manager.test.mjs:241",
              "Verification: 63 focused tests passed, 0 failed",
              "Verification: ArcOrbit suite 525 tests; 504 passed, 19 skipped, 2 sandbox-only Electron failures passed 2/2 outside sandbox"
            ],
            "gap_refs": []
          }
        ]
      },
      "evidence": [
        "Case creation receipt: CASE-20260826-010, project revision 291",
        "Post-commit fresh-read: ledger snapshot b8cedcec700e584d29f1135b147f5b9a67806b461ef6f7fe5864b1bb92f101d7",
        "runtime/arcorbit/desktop/renderer/renderer.js",
        "runtime/arcorbit/desktop/main.mjs",
        "runtime/arcorbit/src/skill-provisioning-manager.mjs",
        "runtime/arcorbit/test/desktop-renderer.test.mjs",
        "runtime/arcorbit/test/skill-provisioning-manager.test.mjs",
        "arckit/spec/arcorbit-distribution.md",
        "arckit/interaction/setup-readiness/interaction.md",
        "arckit/interaction/setup-readiness/default.html",
        "arckit/tech/arcorbit/installer-supply-chain.md",
        "Verification: node --check passed for changed JavaScript files",
        "Verification: git diff --check passed",
        "Verification: 63 focused tests passed",
        "Verification: full corpus functional checks passed after authorized Electron rerun"
      ],
      "runtime_result_ref": "arckit-runtime://runs/RUN-20260826-153051465Z-5b987e00",
      "occurred_at": "2026-08-26T15:44:41.177Z"
    },
    {
      "round": 2,
      "transition_schema_version": "arckit-case-transition/v8",
      "goal": "独立审查 content revision 1 的实现正确性、问题解决程度、验证可信度、回归风险和最小性。",
      "outcome": "completed",
      "gap_selection": {
        "mode": "candidate",
        "basis": "基于 post-commit fresh snapshot 比较全部持久候选；四个 Project Gap 均需独立 Case，当前 Case 唯一 ready 候选是 content revision 1 的 Completion Review。",
        "snapshot_token": "ba2c529241ff2ae4dd6e1f833c62e407723ba14c15359995d59ee3f77a2c22e7",
        "selected_ref": "case-gap:CASE-20260826-010:CASE-20260826-010:completion-review:1",
        "comparison_summary": "Completion Review 阻塞当前 Case 最终解决，并直接审查刚完成的高用户影响修复；其余四个 Project Gap 不覆盖本 Case，均延后到独立 Case。",
        "fresh_discovery_summary": "独立审查未发现新的错误、遗漏、多余实现或需要新增的 Case Gap。",
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
            "reason": "动态场景评估需要独立 Case，不能替代当前实现的完成审查。"
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
            "reason": "Runtime 韧性与适配器工作范围更广，需要独立 Case。"
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
            "reason": "真实权限项目验证不属于当前 Setup 触发边界的完成审查。"
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
            "reason": "跨记录审计需要独立 Case，不阻止审查当前已提交内容。"
          },
          {
            "ref": "case-gap:CASE-20260826-010:CASE-20260826-010:completion-review:1",
            "source": "persisted",
            "eligibility": "ready",
            "disposition": "selected",
            "priority_basis": {
              "blocking": "high",
              "uncertainty": "low",
              "risk": "high",
              "user_impact": "high"
            },
            "reason": "当前 Case 的普通 Gap 和受威胁 impacts 均已关闭，Completion Review 是唯一 ready 且阻塞最终解决的候选。"
          }
        ]
      },
      "selected_gap": {
        "id": "CASE-20260826-010:completion-review:1",
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
        "goal": "独立审查 content revision 1 的实现正确性、问题解决程度、验证可信度、回归风险和最小性。",
        "expected_state_change": "记录 clean Completion Review；若 Ledger 接受，CASE-20260826-010 满足最终解决条件。"
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
            "runtime/arcorbit/desktop/renderer/renderer.js:623",
            "runtime/arcorbit/desktop/renderer/renderer.js:1729",
            "runtime/arcorbit/desktop/renderer/renderer.js:3642",
            "runtime/arcorbit/desktop/main.mjs:117",
            "runtime/arcorbit/desktop/main.mjs:190",
            "runtime/arcorbit/src/desktop-setup-readiness-context.mjs:18",
            "runtime/arcorbit/src/skill-provisioning-manager.mjs:242",
            "runtime/arcorbit/test/desktop-renderer.test.mjs:1480",
            "runtime/arcorbit/test/desktop-renderer.test.mjs:1493",
            "runtime/arcorbit/test/skill-provisioning-manager.test.mjs:241",
            "arckit/spec/arcorbit-distribution.md:88",
            "arckit/interaction/setup-readiness/interaction.md:22",
            "arckit/tech/arcorbit/installer-supply-chain.md:313",
            "Verification: 63 focused tests passed, 0 failed",
            "Verification: ArcOrbit suite 525 tests; 504 passed, 19 conditional skips, 2 sandbox Electron SIGABRT cases passed 2/2 in authorized rerun",
            "Verification: changed JavaScript files passed node --check; git diff --check passed"
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
        "evidence": [
          "arckit/spec/arcorbit-distribution.md",
          "arckit/interaction/setup-readiness/interaction.md",
          "arckit/interaction/setup-readiness/default.html",
          "arckit/tech/arcorbit/installer-supply-chain.md",
          "runtime/arcorbit/desktop/renderer/renderer.js",
          "runtime/arcorbit/desktop/main.mjs",
          "runtime/arcorbit/src/skill-provisioning-manager.mjs",
          "runtime/arcorbit/test/desktop-renderer.test.mjs",
          "runtime/arcorbit/test/skill-provisioning-manager.test.mjs"
        ]
      },
      "invariant_assessment": {
        "project_revision": 292,
        "judgments": [
          {
            "invariant_ref": "product-expectations-remain-recoverable",
            "disposition": "upheld",
            "reason": "冷启动、新关联、主动恢复、纯查看非触发和 task-start 缓存门禁均已在稳定产品规格中明确，审查未发现语义冲突。",
            "fact_refs": [
              "FACT-20260826-010-004"
            ],
            "evidence": [
              "arckit/spec/arcorbit-distribution.md:88",
              "arckit/spec/arcorbit-distribution.md:245"
            ],
            "gap_refs": []
          },
          {
            "invariant_ref": "interaction-expectations-remain-recoverable",
            "disposition": "upheld",
            "reason": "Setup 进入条件、纯查看行为和失败后的主动恢复反馈可从交互文档及线框完整恢复。",
            "fact_refs": [
              "FACT-20260826-010-004"
            ],
            "evidence": [
              "arckit/interaction/setup-readiness/interaction.md:22",
              "arckit/interaction/setup-readiness/interaction.md:46",
              "arckit/interaction/setup-readiness/default.html:19"
            ],
            "gap_refs": []
          },
          {
            "invariant_ref": "visual-language-remains-consistent",
            "disposition": "not_relevant",
            "reason": "本轮实现和完成审查未改变视觉布局、组件、主题、层级或 Design Tokens。",
            "fact_refs": [],
            "evidence": [],
            "gap_refs": []
          },
          {
            "invariant_ref": "technical-decisions-remain-explainable",
            "disposition": "upheld",
            "reason": "主进程 aggregate fresh-check、Renderer 触发入口与 SkillProvisioningManager 缓存断言的职责边界具有持久技术说明和直接代码证据。",
            "fact_refs": [
              "FACT-20260826-010-004"
            ],
            "evidence": [
              "arckit/tech/arcorbit/installer-supply-chain.md:288",
              "arckit/tech/arcorbit/installer-supply-chain.md:313",
              "runtime/arcorbit/desktop/main.mjs:117",
              "runtime/arcorbit/src/skill-provisioning-manager.mjs:242"
            ],
            "gap_refs": []
          },
          {
            "invariant_ref": "accepted-facts-are-realized",
            "disposition": "upheld",
            "reason": "控制流保留冷启动、新关联和主动恢复，移除查看切换与解除关联检查，并在 task start 对缓存状态和 root 覆盖执行 fail-closed 断言。",
            "fact_refs": [
              "FACT-20260826-010-002",
              "FACT-20260826-010-003",
              "FACT-20260826-010-004"
            ],
            "evidence": [
              "runtime/arcorbit/desktop/renderer/renderer.js:329",
              "runtime/arcorbit/desktop/renderer/renderer.js:623",
              "runtime/arcorbit/desktop/renderer/renderer.js:1731",
              "runtime/arcorbit/desktop/renderer/renderer.js:3642",
              "runtime/arcorbit/desktop/main.mjs:190",
              "runtime/arcorbit/src/skill-provisioning-manager.mjs:242"
            ],
            "gap_refs": []
          },
          {
            "invariant_ref": "material-risks-have-credible-evidence",
            "disposition": "upheld",
            "reason": "误删必要检查、重新引入高频扫描及放松执行门禁的风险由 focused tests、完整套件、未验证 root 拒绝和授权 Electron 复跑共同覆盖。",
            "fact_refs": [
              "FACT-20260826-010-004"
            ],
            "evidence": [
              "runtime/arcorbit/test/desktop-renderer.test.mjs:1480",
              "runtime/arcorbit/test/desktop-renderer.test.mjs:1493",
              "runtime/arcorbit/test/skill-provisioning-manager.test.mjs:241",
              "Verification: 63 focused tests passed, 0 failed",
              "Verification: ArcOrbit suite 525 tests; 504 passed, 19 conditional skips, 2 sandbox Electron SIGABRT cases passed 2/2 in authorized rerun"
            ],
            "gap_refs": []
          }
        ]
      },
      "evidence": [
        "Post-commit fresh-read: ledger snapshot 10305910cac352dad75848f39e201430a52bf7aa03ca45978a57b4adff7b926d",
        "Case content revision reviewed: CASE-20260826-010 revision 1",
        "runtime/arcorbit/desktop/renderer/renderer.js",
        "runtime/arcorbit/desktop/main.mjs",
        "runtime/arcorbit/src/desktop-setup-readiness-context.mjs",
        "runtime/arcorbit/src/skill-provisioning-manager.mjs",
        "runtime/arcorbit/test/desktop-renderer.test.mjs",
        "runtime/arcorbit/test/skill-provisioning-manager.test.mjs",
        "arckit/spec/arcorbit-distribution.md",
        "arckit/interaction/setup-readiness/interaction.md",
        "arckit/interaction/setup-readiness/default.html",
        "arckit/tech/arcorbit/installer-supply-chain.md",
        "Verification: five Completion Review dimensions clean; no findings"
      ],
      "runtime_result_ref": "arckit-runtime://runs/RUN-20260826-153051465Z-5b987e00",
      "occurred_at": "2026-08-26T15:47:47.707Z"
    }
  ],
  "case_resolution": {
    "status": "resolved",
    "stage": "resolved",
    "satisfied": [
      "GAP-20260826-010-001"
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
    "updated_at": "2026-08-26T15:47:47.707Z"
  }
}
```

## Round Notes

- Case history is canonical in Structured Record.rounds; keep prose notes exceptional.
