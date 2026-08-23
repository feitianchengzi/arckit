# 诊断并修复恢复中心输入框焦点与草稿丢失

Case: CASE-20260823-001
Status: closed
Artifact Type: code
Selected Gap: none
Updated: 2026-08-23T09:53:11.805Z

## User Intent

定位 ArcOrbit 自动化页面阻塞恢复中心在输入期间自动失焦并清空内容的真实执行路径，以证据约束必要修复。

## Structured Record

```json
{
  "schema_version": "development-case-record/v5",
  "id": "CASE-20260823-001",
  "title": "诊断并修复恢复中心输入框焦点与草稿丢失",
  "status": "closed",
  "artifact_type": "code",
  "created_at": "2026-08-23T09:28:34.845Z",
  "updated_at": "2026-08-23T09:53:11.805Z",
  "user_intent": "定位 ArcOrbit 自动化页面阻塞恢复中心在输入期间自动失焦并清空内容的真实执行路径，以证据约束必要修复。",
  "expected_outcome": "恢复中心输入框在后台状态更新和正常交互期间稳定保留焦点与未提交草稿；最终修复由可复现或运行时观测证据证明，并通过相关回归验证。",
  "project_state_ref": "arckit/project/state.record.json",
  "current_round": {
    "goal": "",
    "selected_gap": null
  },
  "facts": [
    {
      "id": "FACT-RECOVERY-COMPOSER-INPUT-LOSS-REPORT",
      "revision": 1,
      "status": "accepted",
      "statement": "操作员报告：ArcOrbit 自动化页面的阻塞恢复中心在输入过程中会自动丢失输入框焦点并清空已输入内容，表现类似页面刷新；预期输入期间不应丢失焦点或草稿。",
      "basis": "当前操作员对真实产品路径的直接问题报告；该事实只确认已观察症状和期望，不确认根因。",
      "evidence": [
        "Current operator input, 2026-08-23"
      ]
    },
    {
      "id": "FACT-RECOVERY-COMPOSER-INNERHTML-RESET",
      "revision": 1,
      "status": "accepted",
      "statement": "ArcOrbit Recovery Center 的说明输入框在任何成功 snapshot 刷新后都会被 `renderRecovery()` 的 `recoveryList.innerHTML` 全量重建所替换；Automation/Run 事件会在 0–120ms 后调度此刷新，另有固定 30 秒轮询。被替换的聚焦 textarea 失去焦点，新 textarea 没有草稿来源且默认值为空，因此已输入内容被清空。",
      "basis": "确定性代码推演完整匹配事件触发、刷新、全量 render、DOM 节点替换、焦点丢失、空值重建及用户观察时序；无需临时运行日志。",
      "evidence": [
        "runtime/arcorbit/desktop/renderer/renderer.js:184-197",
        "runtime/arcorbit/desktop/renderer/renderer.js:618-678",
        "runtime/arcorbit/desktop/renderer/renderer.js:894-907",
        "runtime/arcorbit/desktop/renderer/renderer.js:2735-2752",
        "Git history: recovery continuation textarea exists inside the unconditional innerHTML projection introduced across a486d40 and 624f96d"
      ]
    },
    {
      "id": "FACT-RECOVERY-COMPOSER-KEYED-STATE-PRESERVATION",
      "revision": 1,
      "status": "accepted",
      "statement": "ArcOrbit Recovery Center 现在按稳定 recovery item id 协调卡片 DOM，并复用同一恢复项现有的 textarea；Automation snapshot 刷新以及恢复项内容、动作和相邻列表变化不会替换该 textarea，因此其未提交值和焦点保持不变。动作由恢复列表容器委托处理，feedback_continue 仍读取并提交对应 recovery item 的当前说明。",
      "basis": "生产实现直接证据与真实 Electron Renderer 行为回归共同证明节点身份、值、焦点、列表投影及动作绑定。",
      "evidence": [
        "runtime/arcorbit/desktop/renderer/renderer.js:372-376",
        "runtime/arcorbit/desktop/renderer/renderer.js:2740-2821",
        "runtime/arcorbit/test/fixtures/recovery-composer-electron.mjs:29-88",
        "runtime/arcorbit/test/recovery-composer-electron.test.mjs:11-32",
        "Verification: real Electron Recovery Center regression passed"
      ]
    }
  ],
  "state_impacts": [
    {
      "id": "IMPACT-RECOVERY-COMPOSER-EXPERIENCE",
      "fact_id": "FACT-RECOVERY-COMPOSER-KEYED-STATE-PRESERVATION",
      "fact_revision": 1,
      "target": {
        "kind": "software_decision",
        "ref": "experience_and_interaction",
        "revision": 31
      },
      "effect": "upheld",
      "reason": "后台刷新现在保留恢复说明输入的 DOM 身份、内容和焦点，恢复了既有连续输入交互预期。",
      "gap_ids": [],
      "evidence": [
        "arckit/interaction/automation-workspace/interaction.md:211",
        "arckit/interaction/automation-workspace/interaction.md:386",
        "runtime/arcorbit/desktop/renderer/renderer.js:2740-2821",
        "Verification: real Electron Recovery Center regression passed"
      ]
    },
    {
      "id": "IMPACT-RECOVERY-COMPOSER-REALIZATION",
      "fact_id": "FACT-RECOVERY-COMPOSER-KEYED-STATE-PRESERVATION",
      "fact_revision": 1,
      "target": {
        "kind": "software_invariant",
        "ref": "accepted-facts-are-realized",
        "revision": null
      },
      "effect": "upheld",
      "reason": "真实 Renderer 已兑现后台刷新保留恢复说明内容与输入焦点的接受预期，并由实际 Electron DOM 证据验证。",
      "gap_ids": [],
      "evidence": [
        "runtime/arcorbit/desktop/renderer/renderer.js:2740-2821",
        "runtime/arcorbit/test/recovery-composer-electron.test.mjs:11-32",
        "Verification: `ARCORBIT_ELECTRON_RECOVERY_TEST=1 node --test test/recovery-composer-electron.test.mjs` — 1 passed, 0 failed"
      ]
    }
  ],
  "gaps": [
    {
      "id": "GAP-DIAGNOSE-RECOVERY-COMPOSER-RESET",
      "status": "resolved",
      "goal": "建立恢复中心输入框自动失焦和草稿清空的可复现根因事实，并界定由证据支持的必要修复边界。",
      "reason": "当前只确认用户可见症状；页面重建、DOM 替换、snapshot 覆盖、受控输入状态重置和异步竞争等解释尚未被证据区分。根因结论将改变修复对象和验证范围，必须先独立成立。",
      "derived_from": [
        "case_intent",
        "FACT-RECOVERY-COMPOSER-INPUT-LOSS-REPORT"
      ],
      "blocked_by": [],
      "priority_basis": {
        "blocking": "根因未知阻止安全修复",
        "uncertainty": "high",
        "risk": "直接修复可能掩盖状态时序问题或破坏恢复刷新",
        "user_impact": "high"
      },
      "responsibility": "agent",
      "evidence_required": [
        "稳定复现路径，或在无法仅靠代码逻辑完全匹配症状时，由带唯一标记的临时埋点写入 arckit/debug/recovery-composer-reset.log 的真实运行轨迹",
        "能够完整解释触发条件、焦点变化、草稿状态变化、发生位置与时序的代码路径证据",
        "足以区分页面或组件重建、DOM 替换、snapshot 覆盖、受控输入重置及异步竞争等关键假设的观测证据"
      ],
      "resolution": {
        "id": "GAP-DIAGNOSE-RECOVERY-COMPOSER-RESET",
        "status": "resolved",
        "outcome": "根因已确定：后台 snapshot 刷新触发全量恢复卡 innerHTML 重建，替换聚焦 textarea 并以空值节点重置草稿。",
        "reason": "代码链完整覆盖触发条件、发生位置、DOM 身份变化、输入状态变化和时序，与用户报告的三个表现完全一致，且不存在需要运行时日志区分的竞争路径。",
        "evidence": [
          "runtime/arcorbit/desktop/renderer/renderer.js:184-197",
          "runtime/arcorbit/desktop/renderer/renderer.js:618-678",
          "runtime/arcorbit/desktop/renderer/renderer.js:894-907",
          "runtime/arcorbit/desktop/renderer/renderer.js:2735-2752",
          "Verification: `node --test test/desktop-renderer.test.mjs` — 36 passed, 0 failed"
        ],
        "occurred_at": "2026-08-23T09:33:42.826Z"
      }
    },
    {
      "id": "GAP-FIX-RECOVERY-COMPOSER-STATE-PRESERVATION",
      "status": "resolved",
      "goal": "修复 Recovery Center 的渲染与输入状态生命周期，使 Automation/Run 事件和定时 snapshot 刷新不替换正在编辑的 textarea、不清空未提交说明且不丢失焦点，并补充行为回归验证。",
      "reason": "新接受的根因事实证明当前全量 innerHTML 投影破坏输入连续性；现有 36 项 Desktop Renderer 测试均通过但没有覆盖恢复 Composer 在后台刷新时的节点身份、值和焦点。",
      "derived_from": [
        "FACT-RECOVERY-COMPOSER-INPUT-LOSS-REPORT",
        "FACT-RECOVERY-COMPOSER-INNERHTML-RESET"
      ],
      "blocked_by": [],
      "priority_basis": {
        "blocking": "直接承接已确认根因并关闭现有 threatened impacts",
        "uncertainty": "low",
        "risk": "需要保持恢复项列表和动作监听随 snapshot 正确更新",
        "user_impact": "high"
      },
      "responsibility": "agent",
      "evidence_required": [
        "在 Recovery Center textarea 已聚焦且含未提交文本时触发 Automation/Run 事件刷新和等价定时 snapshot 刷新，输入值与焦点保持不变",
        "恢复项新增、删除或动作变化仍正确投影，提交读取当前对应 recovery item 的说明且不会错绑",
        "相关 Renderer 测试、语法检查与回归套件通过，且无 ARC_DEBUG:recovery-composer-reset 临时埋点残留"
      ],
      "resolution": {
        "id": "GAP-FIX-RECOVERY-COMPOSER-STATE-PRESERVATION",
        "status": "resolved",
        "outcome": "Recovery Center 已使用 keyed DOM reconciliation 保留同一恢复项的 textarea；真实 Electron 测试确认后台事件刷新、恢复项内容和动作更新、其他恢复项新增及删除均不重置焦点或草稿，feedback_continue 提交仍携带正确 recovery id 和当前说明。",
        "reason": "生产 Renderer 不再对非空恢复列表执行全量 innerHTML 替换，而是复用稳定卡片和 textarea；行为、相邻 Electron 回归及完整默认套件均已通过。",
        "evidence": [
          "runtime/arcorbit/desktop/renderer/renderer.js:372-376",
          "runtime/arcorbit/desktop/renderer/renderer.js:2740-2821",
          "runtime/arcorbit/test/fixtures/recovery-composer-electron.mjs:29-88",
          "runtime/arcorbit/test/recovery-composer-electron.test.mjs:11-32",
          "Verification: `ARCORBIT_ELECTRON_RECOVERY_TEST=1 node --test test/recovery-composer-electron.test.mjs` — 1 passed, 0 failed",
          "Verification: `ARCORBIT_ELECTRON_ORGANIZATION_TEST=1 node --test test/organization-center-electron.test.mjs` — 1 passed, 0 failed",
          "Verification: `npm run check` — 320 tests, 316 passed, 4 environment-gated skips, 0 failed",
          "Verification: `git diff --check` passed",
          "Verification: no `ARC_DEBUG:recovery-composer-reset` marker or diagnostic log exists"
        ],
        "occurred_at": "2026-08-23T09:50:45.113Z"
      }
    }
  ],
  "content_revision": 2,
  "completion_review": {
    "status": "clean",
    "policy": {
      "initial_max_cycles": 10,
      "source": "runtime/arcorbit/config/case-policy.json",
      "snapshotted_at": "2026-08-23T09:28:34.845Z"
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
          "Implementation correctness: runtime/arcorbit/desktop/renderer/renderer.js:372-376 and 2740-2821 preserve keyed recovery cards and delegate actions without replacing an existing textarea",
          "Problem resolution: runtime/arcorbit/test/fixtures/recovery-composer-electron.mjs:29-88 verifies the same textarea node, value and focus across snapshot refreshes and list changes",
          "Verification credibility: `ARCORBIT_ELECTRON_RECOVERY_TEST=1 node --test test/recovery-composer-electron.test.mjs` — 1 passed, 0 failed during completion review",
          "Regression risk: `npm run check` — 320 tests, 316 passed, 4 environment-gated skips, 0 failed during completion review",
          "Regression risk: accepted adjacent Organization Center Electron regression — 1 passed, 0 failed",
          "Minimality: production behavior changes are confined to Recovery Center reconciliation and event handling; remaining changes are bounded Electron test support",
          "Verification: `git diff --check` passed",
          "Verification: no `ARC_DEBUG:recovery-composer-reset` marker or diagnostic log exists"
        ],
        "occurred_at": "2026-08-23T09:53:11.805Z"
      }
    ],
    "evidence": [
      "Implementation correctness: runtime/arcorbit/desktop/renderer/renderer.js:372-376 and 2740-2821 preserve keyed recovery cards and delegate actions without replacing an existing textarea",
      "Problem resolution: runtime/arcorbit/test/fixtures/recovery-composer-electron.mjs:29-88 verifies the same textarea node, value and focus across snapshot refreshes and list changes",
      "Verification credibility: `ARCORBIT_ELECTRON_RECOVERY_TEST=1 node --test test/recovery-composer-electron.test.mjs` — 1 passed, 0 failed during completion review",
      "Regression risk: `npm run check` — 320 tests, 316 passed, 4 environment-gated skips, 0 failed during completion review",
      "Regression risk: accepted adjacent Organization Center Electron regression — 1 passed, 0 failed",
      "Minimality: production behavior changes are confined to Recovery Center reconciliation and event handling; remaining changes are bounded Electron test support",
      "Verification: `git diff --check` passed",
      "Verification: no `ARC_DEBUG:recovery-composer-reset` marker or diagnostic log exists"
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
      "goal": "推演恢复卡从 Automation/Run 事件和轮询到 snapshot、全量 Renderer 投影及 textarea DOM 生命周期的完整链路，并用现有交互事实、历史和测试结果核对症状。",
      "outcome": "completed",
      "gap_selection": {
        "mode": "candidate",
        "basis": "当前 Case Gap 直接阻塞高用户影响的恢复输入问题，并且根因事实是任何安全修复和回归验证的前置条件；其优先级高于四个范围更广、与当前症状不直接相关的 Project gaps。",
        "snapshot_token": "2d02451658125b7c57413ccb01d8f69ac3ea2df9cd272f60dbedd835d7570fe3",
        "selected_ref": "case-gap:CASE-20260823-001:GAP-DIAGNOSE-RECOVERY-COMPOSER-RESET",
        "comparison_summary": "选择 CASE-20260823-001 的 ready 诊断 Gap。GAP-agent-scenario-evaluation、GAP-runtime-resilience-and-adapters、GAP-security-real-project-validation 和 GAP-cross-record-audit 均需另建 Case，且不直接解释当前焦点与草稿丢失，故本轮 deferred。",
        "fresh_discovery_summary": "Round opening 时未发现其他 fresh candidate；诊断过程新建立的修复义务仅写为下一轮 open Gap，不在本轮执行。",
        "considered": [
          {
            "ref": "project-gap:GAP-agent-scenario-evaluation",
            "source": "persisted",
            "eligibility": "case_required",
            "disposition": "deferred",
            "priority_basis": {
              "blocking": "不直接阻塞当前恢复输入问题",
              "uncertainty": "high",
              "risk": "high",
              "user_impact": "低于当前可见输入丢失"
            },
            "reason": "通用 Agent 场景评估不能建立当前 Renderer 症状的根因事实。"
          },
          {
            "ref": "project-gap:GAP-runtime-resilience-and-adapters",
            "source": "persisted",
            "eligibility": "case_required",
            "disposition": "deferred",
            "priority_basis": {
              "blocking": "范围宽于当前缺陷",
              "uncertainty": "medium",
              "risk": "high",
              "user_impact": "当前缺陷更直接"
            },
            "reason": "Runtime 韧性工作可能邻近 Automation，但当前问题已定位于 Renderer 恢复卡渲染生命周期，需要先完成当前 Case。"
          },
          {
            "ref": "project-gap:GAP-security-real-project-validation",
            "source": "persisted",
            "eligibility": "case_required",
            "disposition": "deferred",
            "priority_basis": {
              "blocking": "与当前输入状态无依赖",
              "uncertainty": "medium",
              "risk": "high",
              "user_impact": "无直接当前关联"
            },
            "reason": "没有证据表明权限或凭据边界造成焦点与草稿丢失。"
          },
          {
            "ref": "project-gap:GAP-cross-record-audit",
            "source": "persisted",
            "eligibility": "case_required",
            "disposition": "deferred",
            "priority_basis": {
              "blocking": "不阻塞当前诊断",
              "uncertainty": "medium",
              "risk": "high",
              "user_impact": "当前恢复路径更紧迫"
            },
            "reason": "跨记录审计风险虽高，但不解释恢复卡 DOM 重建症状。"
          },
          {
            "ref": "case-gap:CASE-20260823-001:GAP-DIAGNOSE-RECOVERY-COMPOSER-RESET",
            "source": "persisted",
            "eligibility": "ready",
            "disposition": "selected",
            "priority_basis": {
              "blocking": "根因未知阻止安全修复",
              "uncertainty": "high",
              "risk": "直接修复可能掩盖状态时序问题或破坏恢复刷新",
              "user_impact": "high"
            },
            "reason": "它是当前用户问题的直接 Case Gap，并能在本轮通过确定性代码路径、历史与测试证据完成。"
          }
        ]
      },
      "selected_gap": {
        "id": "GAP-DIAGNOSE-RECOVERY-COMPOSER-RESET",
        "responsibility": "agent",
        "goal": "建立恢复中心输入框自动失焦和草稿清空的可复现根因事实，并界定由证据支持的必要修复边界。",
        "reason": "当前只确认用户可见症状；页面重建、DOM 替换、snapshot 覆盖、受控输入状态重置和异步竞争等解释尚未被证据区分。根因结论将改变修复对象和验证范围，必须先独立成立。",
        "derived_from": [
          "case_intent",
          "FACT-RECOVERY-COMPOSER-INPUT-LOSS-REPORT"
        ],
        "blocked_by": [],
        "priority_basis": {
          "blocking": "根因未知阻止安全修复",
          "uncertainty": "high",
          "risk": "直接修复可能掩盖状态时序问题或破坏恢复刷新",
          "user_impact": "high"
        },
        "evidence_required": [
          "稳定复现路径，或在无法仅靠代码逻辑完全匹配症状时，由带唯一标记的临时埋点写入 arckit/debug/recovery-composer-reset.log 的真实运行轨迹",
          "能够完整解释触发条件、焦点变化、草稿状态变化、发生位置与时序的代码路径证据",
          "足以区分页面或组件重建、DOM 替换、snapshot 覆盖、受控输入重置及异步竞争等关键假设的观测证据"
        ]
      },
      "planned_transition": {
        "goal": "推演恢复卡从 Automation/Run 事件和轮询到 snapshot、全量 Renderer 投影及 textarea DOM 生命周期的完整链路，并用现有交互事实、历史和测试结果核对症状。",
        "expected_state_change": "接受一个能完整解释失焦、草稿清空与刷新感的根因事实，关闭诊断 Gap，并仅登记由该新事实派生的实现修复与回归验证 Gap。"
      },
      "accepted_state_delta": {
        "resolved_gap": {
          "id": "GAP-DIAGNOSE-RECOVERY-COMPOSER-RESET",
          "status": "resolved",
          "outcome": "根因已确定：后台 snapshot 刷新触发全量恢复卡 innerHTML 重建，替换聚焦 textarea 并以空值节点重置草稿。",
          "reason": "代码链完整覆盖触发条件、发生位置、DOM 身份变化、输入状态变化和时序，与用户报告的三个表现完全一致，且不存在需要运行时日志区分的竞争路径。",
          "evidence": [
            "runtime/arcorbit/desktop/renderer/renderer.js:184-197",
            "runtime/arcorbit/desktop/renderer/renderer.js:618-678",
            "runtime/arcorbit/desktop/renderer/renderer.js:894-907",
            "runtime/arcorbit/desktop/renderer/renderer.js:2735-2752",
            "Verification: `node --test test/desktop-renderer.test.mjs` — 36 passed, 0 failed"
          ]
        },
        "facts_added": [
          {
            "id": "FACT-RECOVERY-COMPOSER-INNERHTML-RESET",
            "revision": 1,
            "status": "accepted",
            "statement": "ArcOrbit Recovery Center 的说明输入框在任何成功 snapshot 刷新后都会被 `renderRecovery()` 的 `recoveryList.innerHTML` 全量重建所替换；Automation/Run 事件会在 0–120ms 后调度此刷新，另有固定 30 秒轮询。被替换的聚焦 textarea 失去焦点，新 textarea 没有草稿来源且默认值为空，因此已输入内容被清空。",
            "basis": "确定性代码推演完整匹配事件触发、刷新、全量 render、DOM 节点替换、焦点丢失、空值重建及用户观察时序；无需临时运行日志。",
            "evidence": [
              "runtime/arcorbit/desktop/renderer/renderer.js:184-197",
              "runtime/arcorbit/desktop/renderer/renderer.js:618-678",
              "runtime/arcorbit/desktop/renderer/renderer.js:894-907",
              "runtime/arcorbit/desktop/renderer/renderer.js:2735-2752",
              "Git history: recovery continuation textarea exists inside the unconditional innerHTML projection introduced across a486d40 and 624f96d"
            ]
          }
        ],
        "facts_superseded": [],
        "impacts_added": [],
        "impacts_updated": [
          {
            "id": "IMPACT-RECOVERY-COMPOSER-EXPERIENCE",
            "fact_id": "FACT-RECOVERY-COMPOSER-INNERHTML-RESET",
            "fact_revision": 1,
            "target": {
              "kind": "software_decision",
              "ref": "experience_and_interaction",
              "revision": 31
            },
            "effect": "threatened",
            "reason": "已确认的全量 DOM 重建违背恢复输入在后台刷新期间保持连续的交互预期；威胁持续到实现修复和行为回归成立。",
            "gap_ids": [
              "GAP-FIX-RECOVERY-COMPOSER-STATE-PRESERVATION"
            ],
            "evidence": [
              "runtime/arcorbit/desktop/renderer/renderer.js:184-197",
              "runtime/arcorbit/desktop/renderer/renderer.js:2735-2752",
              "arckit/interaction/automation-workspace/interaction.md:211",
              "arckit/interaction/automation-workspace/interaction.md:386"
            ]
          },
          {
            "id": "IMPACT-RECOVERY-COMPOSER-REALIZATION",
            "fact_id": "FACT-RECOVERY-COMPOSER-INNERHTML-RESET",
            "fact_revision": 1,
            "target": {
              "kind": "software_invariant",
              "ref": "accepted-facts-are-realized",
              "revision": null
            },
            "effect": "threatened",
            "reason": "真实 Renderer 状态未兑现后台刷新保留恢复说明内容的已接受预期；修复与回归证据尚未成立。",
            "gap_ids": [
              "GAP-FIX-RECOVERY-COMPOSER-STATE-PRESERVATION"
            ],
            "evidence": [
              "runtime/arcorbit/desktop/renderer/renderer.js:2735-2752",
              "arckit/interaction/automation-workspace/interaction.md:386"
            ]
          }
        ],
        "gaps_added": [
          {
            "id": "GAP-FIX-RECOVERY-COMPOSER-STATE-PRESERVATION",
            "status": "open",
            "goal": "修复 Recovery Center 的渲染与输入状态生命周期，使 Automation/Run 事件和定时 snapshot 刷新不替换正在编辑的 textarea、不清空未提交说明且不丢失焦点，并补充行为回归验证。",
            "reason": "新接受的根因事实证明当前全量 innerHTML 投影破坏输入连续性；现有 36 项 Desktop Renderer 测试均通过但没有覆盖恢复 Composer 在后台刷新时的节点身份、值和焦点。",
            "derived_from": [
              "FACT-RECOVERY-COMPOSER-INPUT-LOSS-REPORT",
              "FACT-RECOVERY-COMPOSER-INNERHTML-RESET"
            ],
            "blocked_by": [],
            "priority_basis": {
              "blocking": "直接承接已确认根因并关闭现有 threatened impacts",
              "uncertainty": "low",
              "risk": "需要保持恢复项列表和动作监听随 snapshot 正确更新",
              "user_impact": "high"
            },
            "responsibility": "agent",
            "evidence_required": [
              "在 Recovery Center textarea 已聚焦且含未提交文本时触发 Automation/Run 事件刷新和等价定时 snapshot 刷新，输入值与焦点保持不变",
              "恢复项新增、删除或动作变化仍正确投影，提交读取当前对应 recovery item 的说明且不会错绑",
              "相关 Renderer 测试、语法检查与回归套件通过，且无 ARC_DEBUG:recovery-composer-reset 临时埋点残留"
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
        "software_definition_changes": [],
        "software_invariant_changes": [],
        "project_gap_changes": [],
        "selection_context_change": null,
        "evidence": []
      },
      "invariant_assessment": {
        "project_revision": 183,
        "judgments": [
          {
            "invariant_ref": "product-expectations-remain-recoverable",
            "disposition": "not_relevant",
            "reason": "根因事实不改变 ArcOrbit 的产品目的、能力集合或业务规则；它暴露的是既有恢复交互的实现缺陷。",
            "fact_refs": [],
            "evidence": [],
            "gap_refs": []
          },
          {
            "invariant_ref": "interaction-expectations-remain-recoverable",
            "disposition": "upheld",
            "reason": "现有 Automation 交互事实已明确恢复卡说明输入以及后台刷新保留内容；本轮根因无需改变该预期。arckit-interaction 查询结果为 confirmed_existing。",
            "fact_refs": [
              "FACT-RECOVERY-COMPOSER-INPUT-LOSS-REPORT",
              "FACT-RECOVERY-COMPOSER-INNERHTML-RESET"
            ],
            "evidence": [
              "arckit/interaction/automation-workspace/interaction.md:64",
              "arckit/interaction/automation-workspace/interaction.md:211",
              "arckit/interaction/automation-workspace/interaction.md:386",
              "arckit/interaction/automation-workspace/runtime-recovery.html"
            ],
            "gap_refs": []
          },
          {
            "invariant_ref": "visual-language-remains-consistent",
            "disposition": "not_relevant",
            "reason": "本轮事实涉及 DOM 身份、输入状态和刷新时序，没有建立或改变视觉语言、token、布局或呈现风格。",
            "fact_refs": [],
            "evidence": [],
            "gap_refs": []
          },
          {
            "invariant_ref": "technical-decisions-remain-explainable",
            "disposition": "upheld",
            "reason": "Renderer 的事件、snapshot、全量投影和恢复卡 DOM 生命周期可由直接源码完整恢复；根因及必要修复边界已经明确，没有引入新的架构决策。",
            "fact_refs": [
              "FACT-RECOVERY-COMPOSER-INNERHTML-RESET"
            ],
            "evidence": [
              "runtime/arcorbit/desktop/renderer/renderer.js:184-197",
              "runtime/arcorbit/desktop/renderer/renderer.js:618-678",
              "runtime/arcorbit/desktop/renderer/renderer.js:894-907",
              "runtime/arcorbit/desktop/renderer/renderer.js:2735-2752"
            ],
            "gap_refs": []
          },
          {
            "invariant_ref": "accepted-facts-are-realized",
            "disposition": "threatened",
            "reason": "已确认 Renderer 会在后台刷新时清空恢复说明并丢失焦点，实际软件尚未兑现既有交互预期。",
            "fact_refs": [
              "FACT-RECOVERY-COMPOSER-INPUT-LOSS-REPORT",
              "FACT-RECOVERY-COMPOSER-INNERHTML-RESET"
            ],
            "evidence": [
              "runtime/arcorbit/desktop/renderer/renderer.js:2735-2752"
            ],
            "gap_refs": [
              "GAP-FIX-RECOVERY-COMPOSER-STATE-PRESERVATION"
            ]
          },
          {
            "invariant_ref": "material-risks-have-credible-evidence",
            "disposition": "upheld",
            "reason": "根因主张由可重复的确定性源码链、触发节奏和现有测试边界共同支持；诊断明确说明测试通过不等于行为已覆盖，未夸大风险已受控。",
            "fact_refs": [
              "FACT-RECOVERY-COMPOSER-INNERHTML-RESET"
            ],
            "evidence": [
              "runtime/arcorbit/desktop/renderer/renderer.js:184-197",
              "runtime/arcorbit/desktop/renderer/renderer.js:618-678",
              "runtime/arcorbit/desktop/renderer/renderer.js:894-907",
              "runtime/arcorbit/desktop/renderer/renderer.js:2735-2752",
              "Verification: `node --test test/desktop-renderer.test.mjs` — 36 passed, 0 failed",
              "Verification: `node --check runtime/arcorbit/desktop/renderer/renderer.js` passed",
              "Verification: `git diff --check` passed"
            ],
            "gap_refs": []
          }
        ]
      },
      "evidence": [
        "Fresh-read receipt: Project revision 183; Case updated_at 2026-08-23T09:28:34.845Z; observed_after_commit true; snapshot 837d12dd46a7ae80847c75f96f860a0ad5873d1e1a6b7ec67394de0ede71123d",
        "runtime/arcorbit/desktop/renderer/renderer.js:184-197",
        "runtime/arcorbit/desktop/renderer/renderer.js:618-678",
        "runtime/arcorbit/desktop/renderer/renderer.js:894-907",
        "runtime/arcorbit/desktop/renderer/renderer.js:2735-2752",
        "arckit/interaction/automation-workspace/interaction.md:211",
        "arckit/interaction/automation-workspace/interaction.md:386",
        "Verification: `node --test test/desktop-renderer.test.mjs` — 36 passed, 0 failed",
        "Verification: no `ARC_DEBUG:recovery-composer-reset` marker or diagnostic log exists",
        "Verification: `git diff --check` passed"
      ],
      "runtime_result_ref": "arckit-runtime://runs/RUN-20260823-092645679Z",
      "occurred_at": "2026-08-23T09:33:42.826Z"
    },
    {
      "round": 2,
      "transition_schema_version": "arckit-case-transition/v8",
      "goal": "以 recovery item id 为稳定身份增量协调恢复卡 DOM，将动作处理改为容器级事件委托，并用真实 Electron Renderer 覆盖刷新、更新、增删和提交行为。",
      "outcome": "completed",
      "gap_selection": {
        "mode": "candidate",
        "basis": "当前 Case 的唯一 ready gap 直接承接已确认根因和两个 threatened impacts，且用户影响高、根因不确定性已降为低；四个 Project gaps 均需另建 Case，不能优先于当前输入丢失修复。",
        "snapshot_token": "d7cc1bc6b114d25d9679f13a2a3f2d780773842543e546a35a6a20b91157e91f",
        "selected_ref": "case-gap:CASE-20260823-001:GAP-FIX-RECOVERY-COMPOSER-STATE-PRESERVATION",
        "comparison_summary": "比较全部五个 persisted candidates 后，选择唯一 ready 的当前 Case gap；四个 Project gaps 均为 case_required，且不阻塞 Recovery Center 缺陷修复。",
        "fresh_discovery_summary": "实现和验证未发现需要在本轮新增的独立正常 gap；Case 的下一状态应进入 completion review，而非预先规划后续工作。",
        "considered": [
          {
            "ref": "case-gap:CASE-20260823-001:GAP-FIX-RECOVERY-COMPOSER-STATE-PRESERVATION",
            "source": "persisted",
            "eligibility": "ready",
            "disposition": "selected",
            "priority_basis": {
              "blocking": "直接关闭当前 Case 的两个 threatened impacts",
              "uncertainty": "low",
              "risk": "需要保持列表变化和动作绑定正确",
              "user_impact": "high"
            },
            "reason": "根因已确定，修复边界明确，并且该 gap 是当前 Case 唯一可执行义务。"
          },
          {
            "ref": "project-gap:GAP-cross-record-audit",
            "source": "persisted",
            "eligibility": "case_required",
            "disposition": "deferred",
            "priority_basis": {
              "blocking": "不阻塞当前 Case",
              "uncertainty": "medium",
              "risk": "high",
              "user_impact": "indirect"
            },
            "reason": "需要独立 Case；与恢复输入连续性缺陷无直接依赖。"
          },
          {
            "ref": "project-gap:GAP-agent-scenario-evaluation",
            "source": "persisted",
            "eligibility": "case_required",
            "disposition": "deferred",
            "priority_basis": {
              "blocking": "不阻塞当前 Case",
              "uncertainty": "high",
              "risk": "high",
              "user_impact": "indirect"
            },
            "reason": "需要独立场景验证 Case，不能替代当前已确诊缺陷的实现修复。"
          },
          {
            "ref": "project-gap:GAP-runtime-resilience-and-adapters",
            "source": "persisted",
            "eligibility": "case_required",
            "disposition": "deferred",
            "priority_basis": {
              "blocking": "不阻塞当前 Case",
              "uncertainty": "medium",
              "risk": "high",
              "user_impact": "indirect"
            },
            "reason": "范围覆盖 Runtime resilience，不是本次 Renderer DOM 生命周期问题。"
          },
          {
            "ref": "project-gap:GAP-security-real-project-validation",
            "source": "persisted",
            "eligibility": "case_required",
            "disposition": "deferred",
            "priority_basis": {
              "blocking": "不阻塞当前 Case",
              "uncertainty": "medium",
              "risk": "high",
              "user_impact": "indirect"
            },
            "reason": "需要独立权限项目和 Case，与当前恢复输入状态修复无直接关系。"
          }
        ]
      },
      "selected_gap": {
        "id": "GAP-FIX-RECOVERY-COMPOSER-STATE-PRESERVATION",
        "responsibility": "agent",
        "goal": "修复 Recovery Center 的渲染与输入状态生命周期，使 Automation/Run 事件和定时 snapshot 刷新不替换正在编辑的 textarea、不清空未提交说明且不丢失焦点，并补充行为回归验证。",
        "reason": "新接受的根因事实证明当前全量 innerHTML 投影破坏输入连续性；现有 36 项 Desktop Renderer 测试均通过但没有覆盖恢复 Composer 在后台刷新时的节点身份、值和焦点。",
        "derived_from": [
          "FACT-RECOVERY-COMPOSER-INPUT-LOSS-REPORT",
          "FACT-RECOVERY-COMPOSER-INNERHTML-RESET"
        ],
        "blocked_by": [],
        "priority_basis": {
          "blocking": "直接承接已确认根因并关闭现有 threatened impacts",
          "uncertainty": "low",
          "risk": "需要保持恢复项列表和动作监听随 snapshot 正确更新",
          "user_impact": "high"
        },
        "evidence_required": [
          "在 Recovery Center textarea 已聚焦且含未提交文本时触发 Automation/Run 事件刷新和等价定时 snapshot 刷新，输入值与焦点保持不变",
          "恢复项新增、删除或动作变化仍正确投影，提交读取当前对应 recovery item 的说明且不会错绑",
          "相关 Renderer 测试、语法检查与回归套件通过，且无 ARC_DEBUG:recovery-composer-reset 临时埋点残留"
        ]
      },
      "planned_transition": {
        "goal": "以 recovery item id 为稳定身份增量协调恢复卡 DOM，将动作处理改为容器级事件委托，并用真实 Electron Renderer 覆盖刷新、更新、增删和提交行为。",
        "expected_state_change": "同一恢复项在后台 snapshot 刷新期间保留原 textarea 节点、焦点和未提交内容；恢复列表和动作仍正确更新，两个 threatened impacts 转为 upheld。"
      },
      "accepted_state_delta": {
        "resolved_gap": {
          "id": "GAP-FIX-RECOVERY-COMPOSER-STATE-PRESERVATION",
          "status": "resolved",
          "outcome": "Recovery Center 已使用 keyed DOM reconciliation 保留同一恢复项的 textarea；真实 Electron 测试确认后台事件刷新、恢复项内容和动作更新、其他恢复项新增及删除均不重置焦点或草稿，feedback_continue 提交仍携带正确 recovery id 和当前说明。",
          "reason": "生产 Renderer 不再对非空恢复列表执行全量 innerHTML 替换，而是复用稳定卡片和 textarea；行为、相邻 Electron 回归及完整默认套件均已通过。",
          "evidence": [
            "runtime/arcorbit/desktop/renderer/renderer.js:372-376",
            "runtime/arcorbit/desktop/renderer/renderer.js:2740-2821",
            "runtime/arcorbit/test/fixtures/recovery-composer-electron.mjs:29-88",
            "runtime/arcorbit/test/recovery-composer-electron.test.mjs:11-32",
            "Verification: `ARCORBIT_ELECTRON_RECOVERY_TEST=1 node --test test/recovery-composer-electron.test.mjs` — 1 passed, 0 failed",
            "Verification: `ARCORBIT_ELECTRON_ORGANIZATION_TEST=1 node --test test/organization-center-electron.test.mjs` — 1 passed, 0 failed",
            "Verification: `npm run check` — 320 tests, 316 passed, 4 environment-gated skips, 0 failed",
            "Verification: `git diff --check` passed",
            "Verification: no `ARC_DEBUG:recovery-composer-reset` marker or diagnostic log exists"
          ]
        },
        "facts_added": [
          {
            "id": "FACT-RECOVERY-COMPOSER-KEYED-STATE-PRESERVATION",
            "revision": 1,
            "status": "accepted",
            "statement": "ArcOrbit Recovery Center 现在按稳定 recovery item id 协调卡片 DOM，并复用同一恢复项现有的 textarea；Automation snapshot 刷新以及恢复项内容、动作和相邻列表变化不会替换该 textarea，因此其未提交值和焦点保持不变。动作由恢复列表容器委托处理，feedback_continue 仍读取并提交对应 recovery item 的当前说明。",
            "basis": "生产实现直接证据与真实 Electron Renderer 行为回归共同证明节点身份、值、焦点、列表投影及动作绑定。",
            "evidence": [
              "runtime/arcorbit/desktop/renderer/renderer.js:372-376",
              "runtime/arcorbit/desktop/renderer/renderer.js:2740-2821",
              "runtime/arcorbit/test/fixtures/recovery-composer-electron.mjs:29-88",
              "runtime/arcorbit/test/recovery-composer-electron.test.mjs:11-32",
              "Verification: real Electron Recovery Center regression passed"
            ]
          }
        ],
        "facts_superseded": [],
        "impacts_added": [],
        "impacts_updated": [
          {
            "id": "IMPACT-RECOVERY-COMPOSER-EXPERIENCE",
            "fact_id": "FACT-RECOVERY-COMPOSER-KEYED-STATE-PRESERVATION",
            "fact_revision": 1,
            "target": {
              "kind": "software_decision",
              "ref": "experience_and_interaction",
              "revision": 31
            },
            "effect": "upheld",
            "reason": "后台刷新现在保留恢复说明输入的 DOM 身份、内容和焦点，恢复了既有连续输入交互预期。",
            "gap_ids": [],
            "evidence": [
              "arckit/interaction/automation-workspace/interaction.md:211",
              "arckit/interaction/automation-workspace/interaction.md:386",
              "runtime/arcorbit/desktop/renderer/renderer.js:2740-2821",
              "Verification: real Electron Recovery Center regression passed"
            ]
          },
          {
            "id": "IMPACT-RECOVERY-COMPOSER-REALIZATION",
            "fact_id": "FACT-RECOVERY-COMPOSER-KEYED-STATE-PRESERVATION",
            "fact_revision": 1,
            "target": {
              "kind": "software_invariant",
              "ref": "accepted-facts-are-realized",
              "revision": null
            },
            "effect": "upheld",
            "reason": "真实 Renderer 已兑现后台刷新保留恢复说明内容与输入焦点的接受预期，并由实际 Electron DOM 证据验证。",
            "gap_ids": [],
            "evidence": [
              "runtime/arcorbit/desktop/renderer/renderer.js:2740-2821",
              "runtime/arcorbit/test/recovery-composer-electron.test.mjs:11-32",
              "Verification: `ARCORBIT_ELECTRON_RECOVERY_TEST=1 node --test test/recovery-composer-electron.test.mjs` — 1 passed, 0 failed"
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
        "project_revision": 183,
        "judgments": [
          {
            "invariant_ref": "product-expectations-remain-recoverable",
            "disposition": "not_relevant",
            "reason": "本轮只修复既有恢复交互的 Renderer 实现，没有建立或改变产品目的、能力集合或业务规则。",
            "fact_refs": [],
            "evidence": [],
            "gap_refs": []
          },
          {
            "invariant_ref": "interaction-expectations-remain-recoverable",
            "disposition": "upheld",
            "reason": "既有交互文档明确要求后台刷新保留恢复输入；生产实现和真实 Electron 回归现已兑现且没有改变该预期。",
            "fact_refs": [
              "FACT-RECOVERY-COMPOSER-KEYED-STATE-PRESERVATION"
            ],
            "evidence": [
              "arckit/interaction/automation-workspace/interaction.md:211",
              "arckit/interaction/automation-workspace/interaction.md:386",
              "runtime/arcorbit/desktop/renderer/renderer.js:2740-2821",
              "runtime/arcorbit/test/recovery-composer-electron.test.mjs:11-32"
            ],
            "gap_refs": []
          },
          {
            "invariant_ref": "visual-language-remains-consistent",
            "disposition": "not_relevant",
            "reason": "修复没有改变视觉 token、布局、组件外观或呈现风格，只改变 DOM 更新和事件生命周期。",
            "fact_refs": [],
            "evidence": [],
            "gap_refs": []
          },
          {
            "invariant_ref": "technical-decisions-remain-explainable",
            "disposition": "upheld",
            "reason": "按稳定 recovery id 复用卡片、仅维护变化子节点并以容器委托动作的实现边界可从源码和回归夹具完整恢复，且未改变 main/Renderer 权限或架构边界。",
            "fact_refs": [
              "FACT-RECOVERY-COMPOSER-KEYED-STATE-PRESERVATION"
            ],
            "evidence": [
              "runtime/arcorbit/desktop/renderer/renderer.js:372-376",
              "runtime/arcorbit/desktop/renderer/renderer.js:2740-2821",
              "runtime/arcorbit/test/fixtures/recovery-composer-electron.mjs:29-88"
            ],
            "gap_refs": []
          },
          {
            "invariant_ref": "accepted-facts-are-realized",
            "disposition": "upheld",
            "reason": "真实 Electron Renderer 证明同一 textarea 在 Automation snapshot 刷新和列表变化后保持节点身份、草稿与焦点，已兑现相关接受事实和交互预期。",
            "fact_refs": [
              "FACT-RECOVERY-COMPOSER-INPUT-LOSS-REPORT",
              "FACT-RECOVERY-COMPOSER-INNERHTML-RESET",
              "FACT-RECOVERY-COMPOSER-KEYED-STATE-PRESERVATION"
            ],
            "evidence": [
              "runtime/arcorbit/desktop/renderer/renderer.js:2740-2821",
              "runtime/arcorbit/test/recovery-composer-electron.test.mjs:11-32",
              "Verification: real Electron Recovery Center regression passed"
            ],
            "gap_refs": []
          },
          {
            "invariant_ref": "material-risks-have-credible-evidence",
            "disposition": "upheld",
            "reason": "焦点和草稿保持、恢复项增删更新、动作绑定以及相邻页面回归均由可重复的真实 Electron 测试验证；完整默认套件和语法检查也通过，未发现临时诊断残留。",
            "fact_refs": [
              "FACT-RECOVERY-COMPOSER-KEYED-STATE-PRESERVATION"
            ],
            "evidence": [
              "Verification: `ARCORBIT_ELECTRON_RECOVERY_TEST=1 node --test test/recovery-composer-electron.test.mjs` — 1 passed, 0 failed",
              "Verification: `ARCORBIT_ELECTRON_ORGANIZATION_TEST=1 node --test test/organization-center-electron.test.mjs` — 1 passed, 0 failed",
              "Verification: `npm run check` — 320 tests, 316 passed, 4 environment-gated skips, 0 failed",
              "Verification: `git diff --check` passed",
              "Verification: no `ARC_DEBUG:recovery-composer-reset` marker or diagnostic log exists"
            ],
            "gap_refs": []
          }
        ]
      },
      "evidence": [
        "runtime/arcorbit/desktop/renderer/renderer.js:372-376",
        "runtime/arcorbit/desktop/renderer/renderer.js:2740-2821",
        "runtime/arcorbit/test/fixtures/organization-center-preload.cjs:58-72",
        "runtime/arcorbit/test/fixtures/organization-center-preload.cjs:86-143",
        "runtime/arcorbit/test/fixtures/recovery-composer-electron.mjs:29-88",
        "runtime/arcorbit/test/recovery-composer-electron.test.mjs:11-32",
        "Verification: Recovery Center real Electron regression passed",
        "Verification: Organization Center adjacent Electron regression passed",
        "Verification: npm run check passed with 0 failures",
        "Verification: git diff --check passed"
      ],
      "runtime_result_ref": "arckit-runtime://runs/RUN-20260823-092645679Z",
      "occurred_at": "2026-08-23T09:50:45.113Z"
    },
    {
      "round": 3,
      "transition_schema_version": "arckit-case-transition/v8",
      "goal": "审查 content revision 2 的生产实现、真实 Electron 行为证据、完整回归和变更边界，并对五个 completion dimensions 作出独立判断。",
      "outcome": "completed",
      "gap_selection": {
        "mode": "candidate",
        "basis": "当前 Case 的普通 gaps 和 impacts 已全部关闭，唯一 ready 的 Case obligation 是 content revision 2 的 completion review；四个 Project gaps 均需独立 Case。",
        "snapshot_token": "b4030e5133b5e5812575e4520e3990db41e40877350d2bade71a9d759abb1c44",
        "selected_ref": "case-gap:CASE-20260823-001:CASE-20260823-001:completion-review:1",
        "comparison_summary": "选择唯一 ready 且直接阻塞 Case 关闭的 completion review；四个 Project gaps 均为 case_required，与当前实现审查无依赖。",
        "fresh_discovery_summary": "审查未发现新的错误、遗漏、过量实现或证据缺口，因此没有 fresh candidate。",
        "considered": [
          {
            "ref": "case-gap:CASE-20260823-001:CASE-20260823-001:completion-review:1",
            "source": "persisted",
            "eligibility": "ready",
            "disposition": "selected",
            "priority_basis": {
              "blocking": "high",
              "uncertainty": "low",
              "risk": "high",
              "user_impact": "high"
            },
            "reason": "这是当前 Case 唯一剩余义务，完成后才能确定性关闭 Case。"
          },
          {
            "ref": "project-gap:GAP-cross-record-audit",
            "source": "persisted",
            "eligibility": "case_required",
            "disposition": "deferred",
            "priority_basis": {
              "blocking": "不阻塞当前 Case",
              "uncertainty": "medium",
              "risk": "high",
              "user_impact": "indirect"
            },
            "reason": "需要独立 Case，不能替代当前 completion review。"
          },
          {
            "ref": "project-gap:GAP-agent-scenario-evaluation",
            "source": "persisted",
            "eligibility": "case_required",
            "disposition": "deferred",
            "priority_basis": {
              "blocking": "不阻塞当前 Case",
              "uncertainty": "high",
              "risk": "high",
              "user_impact": "indirect"
            },
            "reason": "属于独立场景验证事项，与当前缺陷修复审查无直接依赖。"
          },
          {
            "ref": "project-gap:GAP-runtime-resilience-and-adapters",
            "source": "persisted",
            "eligibility": "case_required",
            "disposition": "deferred",
            "priority_basis": {
              "blocking": "不阻塞当前 Case",
              "uncertainty": "medium",
              "risk": "high",
              "user_impact": "indirect"
            },
            "reason": "范围是 Runtime resilience，不是本次 Renderer 修复的 completion review。"
          },
          {
            "ref": "project-gap:GAP-security-real-project-validation",
            "source": "persisted",
            "eligibility": "case_required",
            "disposition": "deferred",
            "priority_basis": {
              "blocking": "不阻塞当前 Case",
              "uncertainty": "medium",
              "risk": "high",
              "user_impact": "indirect"
            },
            "reason": "需要独立权限项目和 Case，与当前审查无直接关系。"
          }
        ]
      },
      "selected_gap": {
        "id": "CASE-20260823-001:completion-review:1",
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
        "goal": "审查 content revision 2 的生产实现、真实 Electron 行为证据、完整回归和变更边界，并对五个 completion dimensions 作出独立判断。",
        "expected_state_change": "若五维均无 finding，则将 completion review 标记 clean，并确定性关闭 CASE-20260823-001。"
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
            "Implementation correctness: runtime/arcorbit/desktop/renderer/renderer.js:372-376 and 2740-2821 preserve keyed recovery cards and delegate actions without replacing an existing textarea",
            "Problem resolution: runtime/arcorbit/test/fixtures/recovery-composer-electron.mjs:29-88 verifies the same textarea node, value and focus across snapshot refreshes and list changes",
            "Verification credibility: `ARCORBIT_ELECTRON_RECOVERY_TEST=1 node --test test/recovery-composer-electron.test.mjs` — 1 passed, 0 failed during completion review",
            "Regression risk: `npm run check` — 320 tests, 316 passed, 4 environment-gated skips, 0 failed during completion review",
            "Regression risk: accepted adjacent Organization Center Electron regression — 1 passed, 0 failed",
            "Minimality: production behavior changes are confined to Recovery Center reconciliation and event handling; remaining changes are bounded Electron test support",
            "Verification: `git diff --check` passed",
            "Verification: no `ARC_DEBUG:recovery-composer-reset` marker or diagnostic log exists"
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
        "project_revision": 183,
        "judgments": [
          {
            "invariant_ref": "product-expectations-remain-recoverable",
            "disposition": "not_relevant",
            "reason": "Completion Review 未建立或改变产品目的、能力集合、业务规则或验收含义。",
            "fact_refs": [],
            "evidence": [],
            "gap_refs": []
          },
          {
            "invariant_ref": "interaction-expectations-remain-recoverable",
            "disposition": "upheld",
            "reason": "审查确认实现与既有后台刷新保留恢复输入的交互预期一致，且真实 Electron 行为证据直接覆盖焦点和草稿连续性。",
            "fact_refs": [
              "FACT-RECOVERY-COMPOSER-KEYED-STATE-PRESERVATION"
            ],
            "evidence": [
              "arckit/interaction/automation-workspace/interaction.md:211",
              "arckit/interaction/automation-workspace/interaction.md:386",
              "runtime/arcorbit/desktop/renderer/renderer.js:2740-2821",
              "runtime/arcorbit/test/recovery-composer-electron.test.mjs:11-32"
            ],
            "gap_refs": []
          },
          {
            "invariant_ref": "visual-language-remains-consistent",
            "disposition": "not_relevant",
            "reason": "审查内容没有改变视觉 token、布局、组件外观或呈现规则。",
            "fact_refs": [],
            "evidence": [],
            "gap_refs": []
          },
          {
            "invariant_ref": "technical-decisions-remain-explainable",
            "disposition": "upheld",
            "reason": "稳定 recovery id、增量 DOM 协调和容器级动作委托的实现边界清晰；没有扩大 Renderer 权限或引入新的架构耦合。",
            "fact_refs": [
              "FACT-RECOVERY-COMPOSER-KEYED-STATE-PRESERVATION"
            ],
            "evidence": [
              "runtime/arcorbit/desktop/renderer/renderer.js:372-376",
              "runtime/arcorbit/desktop/renderer/renderer.js:2740-2821",
              "runtime/arcorbit/test/fixtures/recovery-composer-electron.mjs:29-88"
            ],
            "gap_refs": []
          },
          {
            "invariant_ref": "accepted-facts-are-realized",
            "disposition": "upheld",
            "reason": "真实 Electron 回归再次证明 Automation snapshot 刷新后 textarea 节点、草稿和焦点保持不变，同时列表更新和正确提交仍工作。",
            "fact_refs": [
              "FACT-RECOVERY-COMPOSER-INPUT-LOSS-REPORT",
              "FACT-RECOVERY-COMPOSER-INNERHTML-RESET",
              "FACT-RECOVERY-COMPOSER-KEYED-STATE-PRESERVATION"
            ],
            "evidence": [
              "runtime/arcorbit/desktop/renderer/renderer.js:2740-2821",
              "runtime/arcorbit/test/recovery-composer-electron.test.mjs:11-32",
              "Verification: completion-review real Electron Recovery Center regression passed"
            ],
            "gap_refs": []
          },
          {
            "invariant_ref": "material-risks-have-credible-evidence",
            "disposition": "upheld",
            "reason": "关键用户路径由真实 Electron DOM 测试覆盖，列表增删、动作绑定和相邻页面已有回归证据，完整默认套件在审查时再次通过，未发现证据夸大或临时诊断残留。",
            "fact_refs": [
              "FACT-RECOVERY-COMPOSER-KEYED-STATE-PRESERVATION"
            ],
            "evidence": [
              "Verification: `ARCORBIT_ELECTRON_RECOVERY_TEST=1 node --test test/recovery-composer-electron.test.mjs` — 1 passed, 0 failed",
              "Verification: `npm run check` — 320 tests, 316 passed, 4 environment-gated skips, 0 failed",
              "Verification: accepted Organization Center adjacent Electron regression — 1 passed, 0 failed",
              "Verification: `git diff --check` passed",
              "Verification: no `ARC_DEBUG:recovery-composer-reset` marker or diagnostic log exists"
            ],
            "gap_refs": []
          }
        ]
      },
      "evidence": [
        "runtime/arcorbit/desktop/renderer/renderer.js:372-376",
        "runtime/arcorbit/desktop/renderer/renderer.js:2740-2821",
        "runtime/arcorbit/test/fixtures/recovery-composer-electron.mjs:29-88",
        "runtime/arcorbit/test/recovery-composer-electron.test.mjs:11-32",
        "Verification: completion-review real Electron Recovery Center regression — 1 passed, 0 failed",
        "Verification: completion-review npm run check — 320 tests, 316 passed, 4 skips, 0 failed",
        "Verification: git diff --check passed",
        "Completion Review: all five dimensions clean; no findings"
      ],
      "runtime_result_ref": "arckit-runtime://runs/RUN-20260823-092645679Z",
      "occurred_at": "2026-08-23T09:53:11.805Z"
    }
  ],
  "case_resolution": {
    "status": "resolved",
    "stage": "resolved",
    "satisfied": [
      "GAP-DIAGNOSE-RECOVERY-COMPOSER-RESET",
      "GAP-FIX-RECOVERY-COMPOSER-STATE-PRESERVATION"
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
    "updated_at": "2026-08-23T09:53:11.805Z"
  }
}
```

## Round Notes

- Case history is canonical in Structured Record.rounds; keep prose notes exceptional.
