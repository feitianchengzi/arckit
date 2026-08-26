# 补充新建待办执行人 Automation 提示

Case: CASE-20260826-008
Status: closed
Artifact Type: mixed
Selected Gap: none
Updated: 2026-08-26T10:33:19.260Z

## User Intent

在新建待办页面的“执行人”字段下方提供清晰的提示和 Automation 资格信息，使用户理解执行人选择如何影响待办能否进入自动领取。

## Structured Record

```json
{
  "schema_version": "development-case-record/v5",
  "id": "CASE-20260826-008",
  "title": "补充新建待办执行人 Automation 提示",
  "status": "closed",
  "artifact_type": "mixed",
  "created_at": "2026-08-26T10:17:16.740Z",
  "updated_at": "2026-08-26T10:33:19.260Z",
  "user_intent": "在新建待办页面的“执行人”字段下方提供清晰的提示和 Automation 资格信息，使用户理解执行人选择如何影响待办能否进入自动领取。",
  "expected_outcome": "新建待办 Sheet 在执行人控件下展示稳定、准确的 Automation 说明；未分配、分配给当前用户或其他成员，以及待评审等状态不会被误述为可自动执行，并由交互依据、生产实现和自动化测试共同证明。",
  "project_state_ref": "arckit/project/state.record.json",
  "current_round": {
    "goal": "",
    "selected_gap": null
  },
  "facts": [
    {
      "id": "FACT-20260826-008-001",
      "revision": 1,
      "status": "accepted",
      "statement": "用户明确期望新建待办页面在“执行人”字段下方同时提供提示和 Automation 相关信息。",
      "basis": "当前操作员输入直接定义了本次交互预期。",
      "evidence": [
        "Current operator input, 2026-08-26"
      ]
    },
    {
      "id": "FACT-20260826-008-002",
      "revision": 1,
      "status": "accepted",
      "statement": "当前稳定任务表单线框和生产新建 Sheet 均未在“执行人”控件下展示帮助信息；相邻“状态”字段已有 Automation 说明，且现有 platformField 组件支持在控件下渲染 help 文本。",
      "basis": "任务表单交互产物和生产 Renderer 的直接检查。",
      "evidence": [
        "arckit/interaction/task-browser/task-form.html",
        "arckit/interaction/task-browser/interaction.md",
        "runtime/arcorbit/desktop/renderer/renderer.js"
      ]
    },
    {
      "id": "FACT-20260826-008-003",
      "revision": 1,
      "status": "accepted",
      "statement": "Work 新建待办 Sheet 在执行人控件下始终显示随执行人与状态共同变化的 Automation 资格提示：未分配、分配给其他成员或状态不是待处理时均明确不会进入当前用户候选；只有分配给当前用户且状态为待处理时，才说明创建成功后继续检查项目连接、项目授权和全局自动领取。提示不宣称任务已经进入队列，也不隐式修改任何资格事实。",
      "basis": "用户预期、既有 Work/Automation 资格边界以及更新后的稳定交互源与线框投影共同确定。",
      "evidence": [
        "Current operator input, 2026-08-26",
        "arckit/interaction/task-browser/interaction.md",
        "arckit/interaction/task-browser/task-form.html",
        "arckit/interaction/_map/feature-matrix.md"
      ]
    },
    {
      "id": "FACT-20260826-008-004",
      "revision": 1,
      "status": "accepted",
      "statement": "ArcOrbit 生产新建待办 Sheet 已在执行人控件下动态展示 Automation 资格提示：未分配、其他成员和非待处理状态不会被描述为当前用户候选；当前用户且待处理只说明后续仍需检查项目连接、项目授权和全局领取。提示随执行人、状态和产品切换原位更新或复位，且不会触发任务、授权或领取 mutation。",
      "basis": "生产 Renderer、纯派生 guidance、聚焦测试和真实 Electron DOM 回归共同证明。",
      "evidence": [
        "runtime/arcorbit/src/desktop/today-guidance.mjs",
        "runtime/arcorbit/desktop/renderer/renderer.js",
        "runtime/arcorbit/test/today-guidance.test.mjs",
        "runtime/arcorbit/test/desktop-renderer.test.mjs",
        "runtime/arcorbit/test/fixtures/organization-center-electron.mjs",
        "runtime/arcorbit/test/organization-center-electron.test.mjs",
        "Verification: 63 focused Work/Renderer tests passed, 0 failed, 2026-08-26",
        "Verification: Organization Electron regression passed, 1 passed and 0 failed, 2026-08-26"
      ]
    }
  ],
  "state_impacts": [
    {
      "id": "IMPACT-20260826-008-001",
      "fact_id": "FACT-20260826-008-003",
      "fact_revision": 1,
      "target": {
        "kind": "software_invariant",
        "ref": "interaction-expectations-remain-recoverable",
        "revision": null
      },
      "effect": "upheld",
      "reason": "稳定交互源、任务表单线框和状态矩阵现在共同表达提示位置、四类状态响应及无隐式修改边界。",
      "gap_ids": [],
      "evidence": [
        "arckit/interaction/task-browser/interaction.md",
        "arckit/interaction/task-browser/task-form.html",
        "arckit/interaction/_map/feature-matrix.md",
        "arckit/interaction/INDEX.md"
      ]
    },
    {
      "id": "IMPACT-20260826-008-002",
      "fact_id": "FACT-20260826-008-003",
      "fact_revision": 1,
      "target": {
        "kind": "software_invariant",
        "ref": "accepted-facts-are-realized",
        "revision": null
      },
      "effect": "upheld",
      "reason": "生产新建 Sheet 已按稳定交互事实实现动态提示，并限定为创建模式的纯展示派生。",
      "gap_ids": [],
      "evidence": [
        "arckit/interaction/task-browser/interaction.md",
        "runtime/arcorbit/src/desktop/today-guidance.mjs",
        "runtime/arcorbit/desktop/renderer/renderer.js",
        "runtime/arcorbit/test/today-guidance.test.mjs",
        "runtime/arcorbit/test/organization-center-electron.test.mjs"
      ]
    },
    {
      "id": "IMPACT-20260826-008-003",
      "fact_id": "FACT-20260826-008-003",
      "fact_revision": 1,
      "target": {
        "kind": "software_invariant",
        "ref": "material-risks-have-credible-evidence",
        "revision": null
      },
      "effect": "upheld",
      "reason": "单元、Renderer 源码契约和真实 Electron 回归覆盖四类资格组合、状态变化、产品复位，并验证 guidance-only 操作前后 mutation 调用数不变。",
      "gap_ids": [],
      "evidence": [
        "runtime/arcorbit/test/today-guidance.test.mjs",
        "runtime/arcorbit/test/desktop-renderer.test.mjs",
        "runtime/arcorbit/test/fixtures/organization-center-electron.mjs",
        "runtime/arcorbit/test/organization-center-electron.test.mjs",
        "Verification: 63 focused Work/Renderer tests passed, 0 failed, 2026-08-26",
        "Verification: Organization Electron regression passed, 1 passed and 0 failed, 2026-08-26"
      ]
    }
  ],
  "gaps": [
    {
      "id": "GAP-20260826-008-001",
      "status": "resolved",
      "goal": "明确并持久化新建待办 Sheet 中“执行人”字段下方的 Automation 提示语义，包括执行人只是执行资格条件之一、哪些选择不能被描述为可自动执行，以及提示应固定展示还是随选择动态变化。",
      "reason": "提示的准确语义和状态变化方式会直接决定后续生产实现、文案和测试范围；在该交互前置决定成立前直接编码可能产生误导。",
      "derived_from": [
        "FACT-20260826-008-001",
        "FACT-20260826-008-002"
      ],
      "blocked_by": [],
      "priority_basis": {
        "blocking": "该交互决定直接限定后续实现与验收范围。",
        "uncertainty": "固定说明与动态提示尚未由稳定事实确定。",
        "risk": "不准确的提示可能把未分配、他人执行或待评审任务误述为 Automation 可执行。",
        "user_impact": "用户当前无法在选择执行人时理解该选择与 Automation 的关系。"
      },
      "responsibility": "agent",
      "evidence_required": [
        "稳定 Work 交互依据中明确的执行人 Automation 提示规则",
        "未分配、当前用户和其他执行人场景的准确语义，或固定提示足够的明确决定",
        "新建待办表单中提示位置和状态响应的可恢复交互证据"
      ],
      "resolution": {
        "id": "GAP-20260826-008-001",
        "status": "resolved",
        "outcome": "新建待办执行人字段的 Automation 提示采用随执行人与状态共同变化的就地说明。",
        "reason": "该规则完整区分未分配、其他成员、当前用户但非待处理、当前用户且待处理四类状态，同时保留项目连接、项目授权与全局领取的独立条件，不会提前承诺任务可被领取。",
        "evidence": [
          "arckit/interaction/task-browser/interaction.md",
          "arckit/interaction/task-browser/task-form.html",
          "arckit/interaction/_map/feature-matrix.md",
          "Verification: targeted interaction diff check passed, 2026-08-26"
        ],
        "occurred_at": "2026-08-26T10:23:22.420Z"
      }
    },
    {
      "id": "GAP-20260826-008-002",
      "status": "resolved",
      "goal": "在生产新建待办 Sheet 中实现执行人 Automation 动态提示，并以自动化测试证明执行人、状态和产品变化下的准确响应。",
      "reason": "交互语义现已稳定，但现有 taskProjectFieldControls 仍只渲染无帮助文本的执行人选择器，实际软件尚未兑现该事实。",
      "derived_from": [
        "FACT-20260826-008-003",
        "FACT-20260826-008-002"
      ],
      "blocked_by": [],
      "priority_basis": {
        "blocking": "直接阻塞 Case 预期结果和 realization impact 关闭。",
        "uncertainty": "交互规则已明确，剩余实现边界可直接验证。",
        "risk": "静态或错误提示会误报 Automation 资格，产品切换还可能遗留旧提示。",
        "user_impact": "用户仍无法在生产新建页面获得所需说明。"
      },
      "responsibility": "agent",
      "evidence_required": [
        "生产 Renderer 在执行人控件下展示动态 Automation 提示",
        "未分配、其他成员、当前用户但非待处理、当前用户且待处理四类状态测试",
        "执行人、状态和产品切换后提示原位更新或复位的测试",
        "提示变化不修改任务状态、执行人、项目授权或全局领取的证据",
        "相关 Work Renderer 回归通过结果"
      ],
      "resolution": {
        "id": "GAP-20260826-008-002",
        "status": "resolved",
        "outcome": "新建待办执行人字段已提供准确、动态且无副作用的 Automation 资格提示。",
        "reason": "纯派生 guidance 区分未分配、其他成员、当前用户但非待处理、当前用户且待处理四类状态；Renderer 只在创建 Sheet 绑定执行人和状态变化，产品切换会复位提示，编辑 Sheet 与 mutation 边界保持不变。",
        "evidence": [
          "runtime/arcorbit/src/desktop/today-guidance.mjs",
          "runtime/arcorbit/desktop/renderer/renderer.js",
          "runtime/arcorbit/test/today-guidance.test.mjs",
          "runtime/arcorbit/test/desktop-renderer.test.mjs",
          "runtime/arcorbit/test/fixtures/organization-center-electron.mjs",
          "runtime/arcorbit/test/organization-center-electron.test.mjs",
          "Verification: 63 focused Work/Renderer tests passed, 0 failed, 2026-08-26",
          "Verification: Organization Electron regression passed, 1 passed and 0 failed, 2026-08-26",
          "Verification: syntax and targeted diff checks passed, 2026-08-26"
        ],
        "occurred_at": "2026-08-26T10:31:51.577Z"
      }
    }
  ],
  "content_revision": 2,
  "completion_review": {
    "status": "clean",
    "policy": {
      "initial_max_cycles": 10,
      "source": "runtime/arcorbit/config/case-policy.json",
      "snapshotted_at": "2026-08-26T10:17:16.740Z"
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
          "arckit/interaction/task-browser/interaction.md",
          "arckit/interaction/task-browser/task-form.html",
          "arckit/interaction/_map/feature-matrix.md",
          "runtime/arcorbit/src/desktop/today-guidance.mjs",
          "runtime/arcorbit/desktop/renderer/renderer.js",
          "runtime/arcorbit/test/today-guidance.test.mjs",
          "runtime/arcorbit/test/desktop-renderer.test.mjs",
          "runtime/arcorbit/test/fixtures/organization-center-electron.mjs",
          "runtime/arcorbit/test/organization-center-electron.test.mjs",
          "Verification: targeted diff review found no correctness, scope or minimality finding, 2026-08-26",
          "Verification: targeted diff check passed, 2026-08-26",
          "Verification: 63 focused Work/Renderer tests passed, 0 failed, 2026-08-26",
          "Verification: Organization Electron regression passed, 1 passed and 0 failed, 2026-08-26"
        ],
        "occurred_at": "2026-08-26T10:33:19.260Z"
      }
    ],
    "evidence": [
      "arckit/interaction/task-browser/interaction.md",
      "arckit/interaction/task-browser/task-form.html",
      "arckit/interaction/_map/feature-matrix.md",
      "runtime/arcorbit/src/desktop/today-guidance.mjs",
      "runtime/arcorbit/desktop/renderer/renderer.js",
      "runtime/arcorbit/test/today-guidance.test.mjs",
      "runtime/arcorbit/test/desktop-renderer.test.mjs",
      "runtime/arcorbit/test/fixtures/organization-center-electron.mjs",
      "runtime/arcorbit/test/organization-center-electron.test.mjs",
      "Verification: targeted diff review found no correctness, scope or minimality finding, 2026-08-26",
      "Verification: targeted diff check passed, 2026-08-26",
      "Verification: 63 focused Work/Renderer tests passed, 0 failed, 2026-08-26",
      "Verification: Organization Electron regression passed, 1 passed and 0 failed, 2026-08-26"
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
      "goal": "明确并持久化新建待办执行人字段下 Automation 提示的状态语义与边界。",
      "outcome": "completed",
      "gap_selection": {
        "mode": "candidate",
        "basis": "当前 Case 的交互语义 Gap 是唯一 ready 且直接阻塞用户请求的候选；四个 Project Gap 均需独立 Case。",
        "snapshot_token": "51e1f0f19bc65f5b26a0b4ef1c5984eb957036082df7f36d4a59abdbab81b655",
        "selected_ref": "case-gap:CASE-20260826-008:GAP-20260826-008-001",
        "comparison_summary": "已比较 snapshot 中全部五个 persisted candidates；选择当前 Case 的交互语义 Gap，其余四个 Project Gap 与本事项无直接覆盖关系。",
        "fresh_discovery_summary": "现有生产 Renderer 缺少动态提示的实现与验证是一个 fresh candidate，但它依赖本轮先接受的交互语义，因此本轮保持 blocked 并写回为后续 Gap。",
        "considered": [
          {
            "ref": "project-gap:GAP-agent-scenario-evaluation",
            "source": "persisted",
            "eligibility": "case_required",
            "disposition": "deferred",
            "priority_basis": {
              "blocking": "不阻塞当前表单提示事项。",
              "uncertainty": "high",
              "risk": "high",
              "user_impact": "与当前用户请求无直接关系。"
            },
            "reason": "该项目级场景验证需要独立 Case，不能替代当前 Work 表单交互定义。"
          },
          {
            "ref": "project-gap:GAP-runtime-resilience-and-adapters",
            "source": "persisted",
            "eligibility": "case_required",
            "disposition": "deferred",
            "priority_basis": {
              "blocking": "不阻塞当前表单提示事项。",
              "uncertainty": "当前事项不涉及 Runtime adapter。",
              "risk": "high",
              "user_impact": "与当前表单反馈缺口无直接关系。"
            },
            "reason": "Runtime 韧性与 adapter 验收需要独立 Case。"
          },
          {
            "ref": "project-gap:GAP-security-real-project-validation",
            "source": "persisted",
            "eligibility": "case_required",
            "disposition": "deferred",
            "priority_basis": {
              "blocking": "不阻塞当前表单提示事项。",
              "uncertainty": "当前事项不涉及真实权限资源验证。",
              "risk": "high",
              "user_impact": "与当前提示缺口无直接关系。"
            },
            "reason": "安全实项验证需要独立权限环境和独立 Case。"
          },
          {
            "ref": "project-gap:GAP-cross-record-audit",
            "source": "persisted",
            "eligibility": "case_required",
            "disposition": "deferred",
            "priority_basis": {
              "blocking": "不阻塞当前表单提示事项。",
              "uncertainty": "当前事项不改变跨记录审计边界。",
              "risk": "high",
              "user_impact": "与当前表单提示无直接关系。"
            },
            "reason": "跨记录审计需要独立 Case。"
          },
          {
            "ref": "case-gap:CASE-20260826-008:GAP-20260826-008-001",
            "source": "persisted",
            "eligibility": "ready",
            "disposition": "selected",
            "priority_basis": {
              "blocking": "准确语义直接限定后续实现和测试。",
              "uncertainty": "固定说明与动态说明尚未被稳定事实确定。",
              "risk": "错误提示会把不合格任务描述为可执行。",
              "user_impact": "用户当前无法理解执行人选择与 Automation 的关系。"
            },
            "reason": "这是当前 Case 唯一 ready Gap，也是实现用户请求的必要前置条件。"
          },
          {
            "ref": "fresh:CASE-20260826-008:implement-executor-automation-guidance",
            "source": "fresh",
            "eligibility": "blocked",
            "disposition": "deferred",
            "priority_basis": {
              "blocking": "被所选交互语义前置条件阻塞。",
              "uncertainty": "实现边界将在本轮交互事实接受后确定。",
              "risk": "需要状态组合测试防止误导。",
              "user_impact": "最终用户界面仍需实现。"
            },
            "reason": "生产实现必须等待本轮交互决定被 Ledger 接受并经 fresh-read 重新选择。"
          }
        ]
      },
      "selected_gap": {
        "id": "GAP-20260826-008-001",
        "responsibility": "agent",
        "goal": "明确并持久化新建待办 Sheet 中“执行人”字段下方的 Automation 提示语义，包括执行人只是执行资格条件之一、哪些选择不能被描述为可自动执行，以及提示应固定展示还是随选择动态变化。",
        "reason": "提示的准确语义和状态变化方式会直接决定后续生产实现、文案和测试范围；在该交互前置决定成立前直接编码可能产生误导。",
        "derived_from": [
          "FACT-20260826-008-001",
          "FACT-20260826-008-002"
        ],
        "blocked_by": [],
        "priority_basis": {
          "blocking": "该交互决定直接限定后续实现与验收范围。",
          "uncertainty": "固定说明与动态提示尚未由稳定事实确定。",
          "risk": "不准确的提示可能把未分配、他人执行或待评审任务误述为 Automation 可执行。",
          "user_impact": "用户当前无法在选择执行人时理解该选择与 Automation 的关系。"
        },
        "evidence_required": [
          "稳定 Work 交互依据中明确的执行人 Automation 提示规则",
          "未分配、当前用户和其他执行人场景的准确语义，或固定提示足够的明确决定",
          "新建待办表单中提示位置和状态响应的可恢复交互证据"
        ]
      },
      "planned_transition": {
        "goal": "明确并持久化新建待办执行人字段下 Automation 提示的状态语义与边界。",
        "expected_state_change": "稳定 Work 交互事实、任务表单线框、状态矩阵和索引共同表达动态提示规则；交互可恢复性影响转为 upheld，并显式留下生产实现与验证 Gap。"
      },
      "accepted_state_delta": {
        "resolved_gap": {
          "id": "GAP-20260826-008-001",
          "status": "resolved",
          "outcome": "新建待办执行人字段的 Automation 提示采用随执行人与状态共同变化的就地说明。",
          "reason": "该规则完整区分未分配、其他成员、当前用户但非待处理、当前用户且待处理四类状态，同时保留项目连接、项目授权与全局领取的独立条件，不会提前承诺任务可被领取。",
          "evidence": [
            "arckit/interaction/task-browser/interaction.md",
            "arckit/interaction/task-browser/task-form.html",
            "arckit/interaction/_map/feature-matrix.md",
            "Verification: targeted interaction diff check passed, 2026-08-26"
          ]
        },
        "facts_added": [
          {
            "id": "FACT-20260826-008-003",
            "revision": 1,
            "status": "accepted",
            "statement": "Work 新建待办 Sheet 在执行人控件下始终显示随执行人与状态共同变化的 Automation 资格提示：未分配、分配给其他成员或状态不是待处理时均明确不会进入当前用户候选；只有分配给当前用户且状态为待处理时，才说明创建成功后继续检查项目连接、项目授权和全局自动领取。提示不宣称任务已经进入队列，也不隐式修改任何资格事实。",
            "basis": "用户预期、既有 Work/Automation 资格边界以及更新后的稳定交互源与线框投影共同确定。",
            "evidence": [
              "Current operator input, 2026-08-26",
              "arckit/interaction/task-browser/interaction.md",
              "arckit/interaction/task-browser/task-form.html",
              "arckit/interaction/_map/feature-matrix.md"
            ]
          }
        ],
        "facts_superseded": [],
        "impacts_added": [
          {
            "id": "IMPACT-20260826-008-002",
            "fact_id": "FACT-20260826-008-003",
            "fact_revision": 1,
            "target": {
              "kind": "software_invariant",
              "ref": "accepted-facts-are-realized",
              "revision": null
            },
            "effect": "threatened",
            "reason": "稳定交互事实已经成立，但生产新建 Sheet 尚未实现随执行人和状态更新的提示。",
            "gap_ids": [
              "GAP-20260826-008-002"
            ],
            "evidence": [
              "arckit/interaction/task-browser/interaction.md",
              "runtime/arcorbit/desktop/renderer/renderer.js"
            ]
          },
          {
            "id": "IMPACT-20260826-008-003",
            "fact_id": "FACT-20260826-008-003",
            "fact_revision": 1,
            "target": {
              "kind": "software_invariant",
              "ref": "material-risks-have-credible-evidence",
              "revision": null
            },
            "effect": "threatened",
            "reason": "防止误报 Automation 资格需要对四类执行人/状态组合、产品切换复位和无隐式 mutation 提供可重复实现测试。",
            "gap_ids": [
              "GAP-20260826-008-002"
            ],
            "evidence": [
              "arckit/interaction/task-browser/interaction.md",
              "runtime/arcorbit/desktop/renderer/renderer.js"
            ]
          }
        ],
        "impacts_updated": [
          {
            "id": "IMPACT-20260826-008-001",
            "fact_id": "FACT-20260826-008-003",
            "fact_revision": 1,
            "target": {
              "kind": "software_invariant",
              "ref": "interaction-expectations-remain-recoverable",
              "revision": null
            },
            "effect": "upheld",
            "reason": "稳定交互源、任务表单线框和状态矩阵现在共同表达提示位置、四类状态响应及无隐式修改边界。",
            "gap_ids": [],
            "evidence": [
              "arckit/interaction/task-browser/interaction.md",
              "arckit/interaction/task-browser/task-form.html",
              "arckit/interaction/_map/feature-matrix.md",
              "arckit/interaction/INDEX.md"
            ]
          }
        ],
        "gaps_added": [
          {
            "id": "GAP-20260826-008-002",
            "status": "open",
            "goal": "在生产新建待办 Sheet 中实现执行人 Automation 动态提示，并以自动化测试证明执行人、状态和产品变化下的准确响应。",
            "reason": "交互语义现已稳定，但现有 taskProjectFieldControls 仍只渲染无帮助文本的执行人选择器，实际软件尚未兑现该事实。",
            "derived_from": [
              "FACT-20260826-008-003",
              "FACT-20260826-008-002"
            ],
            "blocked_by": [],
            "priority_basis": {
              "blocking": "直接阻塞 Case 预期结果和 realization impact 关闭。",
              "uncertainty": "交互规则已明确，剩余实现边界可直接验证。",
              "risk": "静态或错误提示会误报 Automation 资格，产品切换还可能遗留旧提示。",
              "user_impact": "用户仍无法在生产新建页面获得所需说明。"
            },
            "responsibility": "agent",
            "evidence_required": [
              "生产 Renderer 在执行人控件下展示动态 Automation 提示",
              "未分配、其他成员、当前用户但非待处理、当前用户且待处理四类状态测试",
              "执行人、状态和产品切换后提示原位更新或复位的测试",
              "提示变化不修改任务状态、执行人、项目授权或全局领取的证据",
              "相关 Work Renderer 回归通过结果"
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
            "area_ref": "experience_and_interaction",
            "observed_revision": 54,
            "set_decision": {
              "status": "settled",
              "statement": "ArcOrbit 保持既有 Personal、Product Lifecycle、Organization 导航与 Work、Automation、Feedback、Chat 等交互语义。Work 新建和编辑 Sheet 保留完整七状态，编辑 Sheet 承担异常纠偏；右侧 Inspector 按当前状态显示有限下一步动作。Work Inspector 首次使用 440px，用户可通过 12px 可访问分隔条在 360–640px 保存范围内拖拽、键盘调整或双击复位，偏好跨任务、项目、Workset 和应用重启恢复。布局为任务树保留至少 420px，窗口临时收窄只改变有效宽度且不覆盖保存值。Inspector 以单一内部滚动区组织身份动作、内容、紧凑属性、协作和按状态出现的验收分区，宽度变化不丢失选择、滚动、草稿或附件状态。Work 已完成列表按新完成在上、历史完成在下排列；标记首项为已验收后选择下一条较旧待办，标记其他位置后选择相邻较新待办，树补全项不参与目标计算，且选择只在服务器确认成功后切换。验收请求期间允许浏览其他任务；若用户在服务器确认前产生较新的选择，成功回调保留该选择而不执行旧任务的自动相邻切换。Work 新建待办 Sheet 在执行人控件下根据执行人与状态原位解释 Automation 资格：未分配、分配给他人或非待处理均不进入当前用户候选；当前用户且待处理只继续检查项目连接、项目授权和全局领取，不隐式修改这些事实。跨产品替换、主窗口和 Case 绑定恢复的既有交互保持不变。应用启动会在进入 Automation 前检查全部关联本地项目；发现 skill drift 时直接呈现既有 Setup Readiness 安装、修复或人工恢复路径，无需用户先切换到具体项目。",
              "reason": "新建待办的执行人选择需要与既有 Automation 资格边界保持一致，并在提交前向用户解释当前选择的真实影响。",
              "evidence": [
                "arckit/interaction/task-browser/interaction.md",
                "arckit/interaction/task-browser/task-form.html",
                "arckit/interaction/_map/feature-matrix.md"
              ],
              "confidence": "high",
              "resume_condition": "当 Work 新建表单字段、Automation 候选条件、当前用户身份来源、项目资格条件或提示响应方式改变时重审；其余既有交互恢复条件保持。"
            },
            "gap_refs": [],
            "reason": "所选 Gap 已明确影响 Work 新建 Sheet 的反馈语义，应在建立该稳定交互事实的同一 transition 中更新 Project 交互决策。",
            "evidence": [
              "arckit/interaction/task-browser/interaction.md",
              "arckit/interaction/task-browser/task-form.html"
            ]
          }
        ],
        "software_invariant_changes": [],
        "project_gap_changes": [],
        "selection_context_change": null,
        "evidence": [
          "arckit/interaction/task-browser/interaction.md",
          "arckit/interaction/task-browser/task-form.html",
          "arckit/interaction/_map/feature-matrix.md"
        ]
      },
      "invariant_assessment": {
        "project_revision": 285,
        "judgments": [
          {
            "invariant_ref": "product-expectations-remain-recoverable",
            "disposition": "upheld",
            "reason": "提示规则保持 Work 拥有任务 mutation、Automation 只消费服务器确认事实的既有产品边界，并明确不产生隐式授权或状态修改。",
            "fact_refs": [
              "FACT-20260826-008-003"
            ],
            "evidence": [
              "arckit/interaction/task-browser/interaction.md",
              "arckit/interaction/task-browser/task-form.html"
            ],
            "gap_refs": []
          },
          {
            "invariant_ref": "interaction-expectations-remain-recoverable",
            "disposition": "upheld",
            "reason": "稳定交互源、状态表、线框和矩阵完整表达提示位置、响应状态及资格边界。",
            "fact_refs": [
              "FACT-20260826-008-003"
            ],
            "evidence": [
              "arckit/interaction/task-browser/interaction.md",
              "arckit/interaction/task-browser/task-form.html",
              "arckit/interaction/_map/feature-matrix.md"
            ],
            "gap_refs": []
          },
          {
            "invariant_ref": "visual-language-remains-consistent",
            "disposition": "not_relevant",
            "reason": "本轮只定义并投影既有表单帮助文本的交互语义，没有建立或改变颜色、间距、组件视觉或主题规则。",
            "fact_refs": [],
            "evidence": [],
            "gap_refs": []
          },
          {
            "invariant_ref": "technical-decisions-remain-explainable",
            "disposition": "not_relevant",
            "reason": "本轮没有接受新的技术所有权、接口、数据模型或持久状态决定；生产实现边界留在后续 open Gap。",
            "fact_refs": [],
            "evidence": [],
            "gap_refs": []
          },
          {
            "invariant_ref": "accepted-facts-are-realized",
            "disposition": "threatened",
            "reason": "交互事实已经接受，但生产执行人字段仍没有动态帮助文本，必须在后续实现 Gap 中兑现。",
            "fact_refs": [
              "FACT-20260826-008-003",
              "FACT-20260826-008-002"
            ],
            "evidence": [
              "arckit/interaction/task-browser/interaction.md",
              "runtime/arcorbit/desktop/renderer/renderer.js"
            ],
            "gap_refs": [
              "GAP-20260826-008-002"
            ]
          },
          {
            "invariant_ref": "material-risks-have-credible-evidence",
            "disposition": "threatened",
            "reason": "误报 Automation 资格的风险边界已明确，但生产四类组合和切换复位尚无可重复测试证据。",
            "fact_refs": [
              "FACT-20260826-008-003",
              "FACT-20260826-008-002"
            ],
            "evidence": [
              "arckit/interaction/task-browser/interaction.md",
              "runtime/arcorbit/desktop/renderer/renderer.js"
            ],
            "gap_refs": [
              "GAP-20260826-008-002"
            ]
          }
        ]
      },
      "evidence": [
        "arckit/interaction/task-browser/interaction.md",
        "arckit/interaction/task-browser/task-form.html",
        "arckit/interaction/_map/feature-matrix.md",
        "arckit/interaction/INDEX.md",
        "runtime/arcorbit/desktop/renderer/renderer.js",
        "Verification: targeted interaction diff check passed, 2026-08-26"
      ],
      "runtime_result_ref": "arckit-runtime://runs/RUN-20260826-101445271Z-479c5dcd",
      "occurred_at": "2026-08-26T10:23:22.420Z"
    },
    {
      "round": 2,
      "transition_schema_version": "arckit-case-transition/v8",
      "goal": "在生产新建待办 Sheet 中实现随执行人和状态变化的 Automation 提示，并验证产品切换复位及无隐式 mutation。",
      "outcome": "completed",
      "gap_selection": {
        "mode": "candidate",
        "basis": "基于 snapshot-bound persisted candidate 比较，GAP-20260826-008-002 是唯一 ready 的当前 Case Gap，直接阻塞已接受交互事实的生产兑现和风险证据闭合。",
        "snapshot_token": "bf6b9743846f30281115a80755f9d143133e145ea0251e11d05f0b8294ef6c9f",
        "selected_ref": "case-gap:CASE-20260826-008:GAP-20260826-008-002",
        "comparison_summary": "选择当前 Case 的生产实现 Gap；四项 Project Gap 均需独立 Case，且不影响本次新建待办提示的既定实现边界。",
        "fresh_discovery_summary": "实现和验证未发现会改变当前验收主张边界的新 Gap。",
        "considered": [
          {
            "ref": "project-gap:GAP-agent-scenario-evaluation",
            "source": "persisted",
            "eligibility": "case_required",
            "disposition": "deferred",
            "priority_basis": {
              "blocking": "不阻塞当前 Case。",
              "uncertainty": "high",
              "risk": "high",
              "user_impact": "与当前执行人提示无直接关系。"
            },
            "reason": "需要独立真实场景 Case，不在本轮实现范围。"
          },
          {
            "ref": "project-gap:GAP-runtime-resilience-and-adapters",
            "source": "persisted",
            "eligibility": "case_required",
            "disposition": "deferred",
            "priority_basis": {
              "blocking": "不阻塞当前 Case。",
              "uncertainty": "medium",
              "risk": "high",
              "user_impact": "与当前表单提示无直接关系。"
            },
            "reason": "需要独立 Runtime 韧性 Case。"
          },
          {
            "ref": "project-gap:GAP-security-real-project-validation",
            "source": "persisted",
            "eligibility": "case_required",
            "disposition": "deferred",
            "priority_basis": {
              "blocking": "不阻塞当前 Case。",
              "uncertainty": "medium",
              "risk": "high",
              "user_impact": "与当前纯展示提示无直接关系。"
            },
            "reason": "需要具备真实权限资源的独立验证 Case。"
          },
          {
            "ref": "project-gap:GAP-cross-record-audit",
            "source": "persisted",
            "eligibility": "case_required",
            "disposition": "deferred",
            "priority_basis": {
              "blocking": "不阻塞当前 Case。",
              "uncertainty": "medium",
              "risk": "high",
              "user_impact": "与当前 Renderer 行为无直接关系。"
            },
            "reason": "需要独立跨记录审计 Case。"
          },
          {
            "ref": "case-gap:CASE-20260826-008:GAP-20260826-008-002",
            "source": "persisted",
            "eligibility": "ready",
            "disposition": "selected",
            "priority_basis": {
              "blocking": "直接阻塞 Case 预期结果和两个 threatened impact 的关闭。",
              "uncertainty": "交互规则已明确，生产边界可直接实现和验证。",
              "risk": "错误或残留提示会误报 Automation 资格。",
              "user_impact": "用户目前无法在生产新建页面理解执行人选择的实际影响。"
            },
            "reason": "唯一 ready 且直接兑现用户当前诉求的 Case Gap。"
          }
        ]
      },
      "selected_gap": {
        "id": "GAP-20260826-008-002",
        "responsibility": "agent",
        "goal": "在生产新建待办 Sheet 中实现执行人 Automation 动态提示，并以自动化测试证明执行人、状态和产品变化下的准确响应。",
        "reason": "交互语义现已稳定，但现有 taskProjectFieldControls 仍只渲染无帮助文本的执行人选择器，实际软件尚未兑现该事实。",
        "derived_from": [
          "FACT-20260826-008-003",
          "FACT-20260826-008-002"
        ],
        "blocked_by": [],
        "priority_basis": {
          "blocking": "直接阻塞 Case 预期结果和 realization impact 关闭。",
          "uncertainty": "交互规则已明确，剩余实现边界可直接验证。",
          "risk": "静态或错误提示会误报 Automation 资格，产品切换还可能遗留旧提示。",
          "user_impact": "用户仍无法在生产新建页面获得所需说明。"
        },
        "evidence_required": [
          "生产 Renderer 在执行人控件下展示动态 Automation 提示",
          "未分配、其他成员、当前用户但非待处理、当前用户且待处理四类状态测试",
          "执行人、状态和产品切换后提示原位更新或复位的测试",
          "提示变化不修改任务状态、执行人、项目授权或全局领取的证据",
          "相关 Work Renderer 回归通过结果"
        ]
      },
      "planned_transition": {
        "goal": "在生产新建待办 Sheet 中实现随执行人和状态变化的 Automation 提示，并验证产品切换复位及无隐式 mutation。",
        "expected_state_change": "生产实现兑现 FACT-20260826-008-003；accepted-facts-are-realized 与 material-risks-have-credible-evidence 的既有 impacts 由 threatened 更新为 upheld。"
      },
      "accepted_state_delta": {
        "resolved_gap": {
          "id": "GAP-20260826-008-002",
          "status": "resolved",
          "outcome": "新建待办执行人字段已提供准确、动态且无副作用的 Automation 资格提示。",
          "reason": "纯派生 guidance 区分未分配、其他成员、当前用户但非待处理、当前用户且待处理四类状态；Renderer 只在创建 Sheet 绑定执行人和状态变化，产品切换会复位提示，编辑 Sheet 与 mutation 边界保持不变。",
          "evidence": [
            "runtime/arcorbit/src/desktop/today-guidance.mjs",
            "runtime/arcorbit/desktop/renderer/renderer.js",
            "runtime/arcorbit/test/today-guidance.test.mjs",
            "runtime/arcorbit/test/desktop-renderer.test.mjs",
            "runtime/arcorbit/test/fixtures/organization-center-electron.mjs",
            "runtime/arcorbit/test/organization-center-electron.test.mjs",
            "Verification: 63 focused Work/Renderer tests passed, 0 failed, 2026-08-26",
            "Verification: Organization Electron regression passed, 1 passed and 0 failed, 2026-08-26",
            "Verification: syntax and targeted diff checks passed, 2026-08-26"
          ]
        },
        "facts_added": [
          {
            "id": "FACT-20260826-008-004",
            "revision": 1,
            "status": "accepted",
            "statement": "ArcOrbit 生产新建待办 Sheet 已在执行人控件下动态展示 Automation 资格提示：未分配、其他成员和非待处理状态不会被描述为当前用户候选；当前用户且待处理只说明后续仍需检查项目连接、项目授权和全局领取。提示随执行人、状态和产品切换原位更新或复位，且不会触发任务、授权或领取 mutation。",
            "basis": "生产 Renderer、纯派生 guidance、聚焦测试和真实 Electron DOM 回归共同证明。",
            "evidence": [
              "runtime/arcorbit/src/desktop/today-guidance.mjs",
              "runtime/arcorbit/desktop/renderer/renderer.js",
              "runtime/arcorbit/test/today-guidance.test.mjs",
              "runtime/arcorbit/test/desktop-renderer.test.mjs",
              "runtime/arcorbit/test/fixtures/organization-center-electron.mjs",
              "runtime/arcorbit/test/organization-center-electron.test.mjs",
              "Verification: 63 focused Work/Renderer tests passed, 0 failed, 2026-08-26",
              "Verification: Organization Electron regression passed, 1 passed and 0 failed, 2026-08-26"
            ]
          }
        ],
        "facts_superseded": [],
        "impacts_added": [],
        "impacts_updated": [
          {
            "id": "IMPACT-20260826-008-002",
            "fact_id": "FACT-20260826-008-003",
            "fact_revision": 1,
            "target": {
              "kind": "software_invariant",
              "ref": "accepted-facts-are-realized",
              "revision": null
            },
            "effect": "upheld",
            "reason": "生产新建 Sheet 已按稳定交互事实实现动态提示，并限定为创建模式的纯展示派生。",
            "gap_ids": [],
            "evidence": [
              "arckit/interaction/task-browser/interaction.md",
              "runtime/arcorbit/src/desktop/today-guidance.mjs",
              "runtime/arcorbit/desktop/renderer/renderer.js",
              "runtime/arcorbit/test/today-guidance.test.mjs",
              "runtime/arcorbit/test/organization-center-electron.test.mjs"
            ]
          },
          {
            "id": "IMPACT-20260826-008-003",
            "fact_id": "FACT-20260826-008-003",
            "fact_revision": 1,
            "target": {
              "kind": "software_invariant",
              "ref": "material-risks-have-credible-evidence",
              "revision": null
            },
            "effect": "upheld",
            "reason": "单元、Renderer 源码契约和真实 Electron 回归覆盖四类资格组合、状态变化、产品复位，并验证 guidance-only 操作前后 mutation 调用数不变。",
            "gap_ids": [],
            "evidence": [
              "runtime/arcorbit/test/today-guidance.test.mjs",
              "runtime/arcorbit/test/desktop-renderer.test.mjs",
              "runtime/arcorbit/test/fixtures/organization-center-electron.mjs",
              "runtime/arcorbit/test/organization-center-electron.test.mjs",
              "Verification: 63 focused Work/Renderer tests passed, 0 failed, 2026-08-26",
              "Verification: Organization Electron regression passed, 1 passed and 0 failed, 2026-08-26"
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
        "project_revision": 286,
        "judgments": [
          {
            "invariant_ref": "product-expectations-remain-recoverable",
            "disposition": "upheld",
            "reason": "实现保持 Work 拥有任务 mutation、Automation 只消费创建成功后事实的既有产品边界，提示不产生隐式授权、状态或领取修改。",
            "fact_refs": [
              "FACT-20260826-008-003",
              "FACT-20260826-008-004"
            ],
            "evidence": [
              "arckit/interaction/task-browser/interaction.md",
              "runtime/arcorbit/desktop/renderer/renderer.js"
            ],
            "gap_refs": []
          },
          {
            "invariant_ref": "interaction-expectations-remain-recoverable",
            "disposition": "upheld",
            "reason": "稳定交互规则已由生产创建 Sheet 的动态帮助文本兑现，执行人、状态和产品切换响应保持一致。",
            "fact_refs": [
              "FACT-20260826-008-003",
              "FACT-20260826-008-004"
            ],
            "evidence": [
              "arckit/interaction/task-browser/interaction.md",
              "arckit/interaction/task-browser/task-form.html",
              "runtime/arcorbit/desktop/renderer/renderer.js"
            ],
            "gap_refs": []
          },
          {
            "invariant_ref": "visual-language-remains-consistent",
            "disposition": "not_relevant",
            "reason": "本轮复用既有 platformField help 文本结构，没有修改颜色、间距、组件样式、主题或视觉 token。",
            "fact_refs": [],
            "evidence": [],
            "gap_refs": []
          },
          {
            "invariant_ref": "technical-decisions-remain-explainable",
            "disposition": "upheld",
            "reason": "提示由无副作用纯函数派生并在既有 Renderer 表单绑定内原位更新，没有新增 IPC、状态所有权、持久化或 Automation mutation 路径。",
            "fact_refs": [
              "FACT-20260826-008-003",
              "FACT-20260826-008-004"
            ],
            "evidence": [
              "runtime/arcorbit/src/desktop/today-guidance.mjs",
              "runtime/arcorbit/desktop/renderer/renderer.js"
            ],
            "gap_refs": []
          },
          {
            "invariant_ref": "accepted-facts-are-realized",
            "disposition": "upheld",
            "reason": "生产实现已覆盖已接受的四类执行人/状态语义及产品切换复位。",
            "fact_refs": [
              "FACT-20260826-008-003",
              "FACT-20260826-008-004"
            ],
            "evidence": [
              "runtime/arcorbit/src/desktop/today-guidance.mjs",
              "runtime/arcorbit/desktop/renderer/renderer.js",
              "runtime/arcorbit/test/today-guidance.test.mjs",
              "runtime/arcorbit/test/organization-center-electron.test.mjs"
            ],
            "gap_refs": []
          },
          {
            "invariant_ref": "material-risks-have-credible-evidence",
            "disposition": "upheld",
            "reason": "63 项聚焦回归和真实 Electron 路径验证资格文案、动态更新、产品复位及无隐式 mutation，足以控制误报风险。",
            "fact_refs": [
              "FACT-20260826-008-003",
              "FACT-20260826-008-004"
            ],
            "evidence": [
              "runtime/arcorbit/test/today-guidance.test.mjs",
              "runtime/arcorbit/test/desktop-renderer.test.mjs",
              "runtime/arcorbit/test/fixtures/organization-center-electron.mjs",
              "runtime/arcorbit/test/organization-center-electron.test.mjs",
              "Verification: 63 focused Work/Renderer tests passed, 0 failed, 2026-08-26",
              "Verification: Organization Electron regression passed, 1 passed and 0 failed, 2026-08-26"
            ],
            "gap_refs": []
          }
        ]
      },
      "evidence": [
        "runtime/arcorbit/src/desktop/today-guidance.mjs",
        "runtime/arcorbit/desktop/renderer/renderer.js",
        "runtime/arcorbit/test/today-guidance.test.mjs",
        "runtime/arcorbit/test/desktop-renderer.test.mjs",
        "runtime/arcorbit/test/fixtures/organization-center-electron.mjs",
        "runtime/arcorbit/test/organization-center-electron.test.mjs",
        "Verification: 63 focused Work/Renderer tests passed, 0 failed, 2026-08-26",
        "Verification: Organization Electron regression passed, 1 passed and 0 failed, 2026-08-26",
        "Verification: syntax and targeted diff checks passed, 2026-08-26"
      ],
      "runtime_result_ref": "arckit-runtime://runs/RUN-20260826-101445271Z-479c5dcd",
      "occurred_at": "2026-08-26T10:31:51.577Z"
    },
    {
      "round": 3,
      "transition_schema_version": "arckit-case-transition/v8",
      "goal": "独立审查 content revision 2 的实现正确性、问题解决、验证可信度、回归风险和最小性。",
      "outcome": "completed",
      "gap_selection": {
        "mode": "candidate",
        "basis": "所有普通 Case Gaps 和 state impacts 已关闭，Completion Review 是唯一 ready 且直接阻塞 Case 完成的候选。",
        "snapshot_token": "ef76c01cf81ad703d86cca91e469a1a6b91e2f3f99e708f3f0d419d9113fda6a",
        "selected_ref": "case-gap:CASE-20260826-008:CASE-20260826-008:completion-review:1",
        "comparison_summary": "选择当前 Case 的 Completion Review；四项 Project Gap 均需独立 Case，且不影响对 content revision 2 的完成审查。",
        "fresh_discovery_summary": "独立审查未发现新的 error、omission 或 excess finding。",
        "considered": [
          {
            "ref": "project-gap:GAP-agent-scenario-evaluation",
            "source": "persisted",
            "eligibility": "case_required",
            "disposition": "deferred",
            "priority_basis": {
              "blocking": "不阻塞当前 Case 的完成审查。",
              "uncertainty": "high",
              "risk": "high",
              "user_impact": "与本次执行人提示审查无直接关系。"
            },
            "reason": "需要独立真实场景 Case。"
          },
          {
            "ref": "project-gap:GAP-runtime-resilience-and-adapters",
            "source": "persisted",
            "eligibility": "case_required",
            "disposition": "deferred",
            "priority_basis": {
              "blocking": "不阻塞当前 Case 的完成审查。",
              "uncertainty": "medium",
              "risk": "high",
              "user_impact": "与当前表单提示无直接关系。"
            },
            "reason": "需要独立 Runtime 韧性 Case。"
          },
          {
            "ref": "project-gap:GAP-security-real-project-validation",
            "source": "persisted",
            "eligibility": "case_required",
            "disposition": "deferred",
            "priority_basis": {
              "blocking": "不阻塞当前 Case 的完成审查。",
              "uncertainty": "medium",
              "risk": "high",
              "user_impact": "当前实现不扩展权限或凭据边界。"
            },
            "reason": "需要具备真实权限资源的独立验证 Case。"
          },
          {
            "ref": "project-gap:GAP-cross-record-audit",
            "source": "persisted",
            "eligibility": "case_required",
            "disposition": "deferred",
            "priority_basis": {
              "blocking": "不阻塞当前 Case 的完成审查。",
              "uncertainty": "medium",
              "risk": "high",
              "user_impact": "与当前 Renderer 功能无直接关系。"
            },
            "reason": "需要独立跨记录审计 Case。"
          },
          {
            "ref": "case-gap:CASE-20260826-008:CASE-20260826-008:completion-review:1",
            "source": "persisted",
            "eligibility": "ready",
            "disposition": "selected",
            "priority_basis": {
              "blocking": "唯一阻塞 Case 完成的门禁。",
              "uncertainty": "low",
              "risk": "high",
              "user_impact": "high"
            },
            "reason": "全部普通工作已闭合，现需对 content revision 2 完成五维独立审查。"
          }
        ]
      },
      "selected_gap": {
        "id": "CASE-20260826-008:completion-review:1",
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
        "goal": "独立审查 content revision 2 的实现正确性、问题解决、验证可信度、回归风险和最小性。",
        "expected_state_change": "若五维均无 finding，则以 clean Completion Review 完成 Case 审查门禁，不修改 Case 内容或 Project State。"
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
            "arckit/interaction/task-browser/interaction.md",
            "arckit/interaction/task-browser/task-form.html",
            "arckit/interaction/_map/feature-matrix.md",
            "runtime/arcorbit/src/desktop/today-guidance.mjs",
            "runtime/arcorbit/desktop/renderer/renderer.js",
            "runtime/arcorbit/test/today-guidance.test.mjs",
            "runtime/arcorbit/test/desktop-renderer.test.mjs",
            "runtime/arcorbit/test/fixtures/organization-center-electron.mjs",
            "runtime/arcorbit/test/organization-center-electron.test.mjs",
            "Verification: targeted diff review found no correctness, scope or minimality finding, 2026-08-26",
            "Verification: targeted diff check passed, 2026-08-26",
            "Verification: 63 focused Work/Renderer tests passed, 0 failed, 2026-08-26",
            "Verification: Organization Electron regression passed, 1 passed and 0 failed, 2026-08-26"
          ],
          "reviewed_content_revision": 2
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
        "project_revision": 286,
        "judgments": [
          {
            "invariant_ref": "product-expectations-remain-recoverable",
            "disposition": "upheld",
            "reason": "审查确认实现保持 Work mutation 与 Automation 消费边界，且不会通过提示产生隐式授权、状态或领取修改。",
            "fact_refs": [
              "FACT-20260826-008-003",
              "FACT-20260826-008-004"
            ],
            "evidence": [
              "arckit/interaction/task-browser/interaction.md",
              "runtime/arcorbit/desktop/renderer/renderer.js"
            ],
            "gap_refs": []
          },
          {
            "invariant_ref": "interaction-expectations-remain-recoverable",
            "disposition": "upheld",
            "reason": "交互依据、线框和生产创建 Sheet 对提示位置、四类状态以及产品切换复位的表达一致。",
            "fact_refs": [
              "FACT-20260826-008-003",
              "FACT-20260826-008-004"
            ],
            "evidence": [
              "arckit/interaction/task-browser/interaction.md",
              "arckit/interaction/task-browser/task-form.html",
              "runtime/arcorbit/desktop/renderer/renderer.js"
            ],
            "gap_refs": []
          },
          {
            "invariant_ref": "visual-language-remains-consistent",
            "disposition": "not_relevant",
            "reason": "实现复用既有 platformField help 结构，没有形成或改变视觉规则、组件样式、主题或 token。",
            "fact_refs": [],
            "evidence": [],
            "gap_refs": []
          },
          {
            "invariant_ref": "technical-decisions-remain-explainable",
            "disposition": "upheld",
            "reason": "审查确认提示由纯函数派生并局限于既有 Renderer 表单绑定，没有新增 IPC、持久状态、所有权或 mutation 路径。",
            "fact_refs": [
              "FACT-20260826-008-003",
              "FACT-20260826-008-004"
            ],
            "evidence": [
              "runtime/arcorbit/src/desktop/today-guidance.mjs",
              "runtime/arcorbit/desktop/renderer/renderer.js"
            ],
            "gap_refs": []
          },
          {
            "invariant_ref": "accepted-facts-are-realized",
            "disposition": "upheld",
            "reason": "生产实现与真实 DOM 回归共同证明已接受的动态提示语义完整兑现，且编辑 Sheet 未被扩展。",
            "fact_refs": [
              "FACT-20260826-008-003",
              "FACT-20260826-008-004"
            ],
            "evidence": [
              "runtime/arcorbit/src/desktop/today-guidance.mjs",
              "runtime/arcorbit/desktop/renderer/renderer.js",
              "runtime/arcorbit/test/today-guidance.test.mjs",
              "runtime/arcorbit/test/organization-center-electron.test.mjs"
            ],
            "gap_refs": []
          },
          {
            "invariant_ref": "material-risks-have-credible-evidence",
            "disposition": "upheld",
            "reason": "四类资格组合、执行人/状态更新、产品切换复位及无 mutation 均有可重复单元、Renderer 和 Electron 证据；相关 63 项聚焦回归保持绿色。",
            "fact_refs": [
              "FACT-20260826-008-003",
              "FACT-20260826-008-004"
            ],
            "evidence": [
              "runtime/arcorbit/test/today-guidance.test.mjs",
              "runtime/arcorbit/test/desktop-renderer.test.mjs",
              "runtime/arcorbit/test/fixtures/organization-center-electron.mjs",
              "runtime/arcorbit/test/organization-center-electron.test.mjs",
              "Verification: 63 focused Work/Renderer tests passed, 0 failed, 2026-08-26",
              "Verification: Organization Electron regression passed, 1 passed and 0 failed, 2026-08-26"
            ],
            "gap_refs": []
          }
        ]
      },
      "evidence": [
        "arckit/interaction/task-browser/interaction.md",
        "arckit/interaction/task-browser/task-form.html",
        "arckit/interaction/_map/feature-matrix.md",
        "runtime/arcorbit/src/desktop/today-guidance.mjs",
        "runtime/arcorbit/desktop/renderer/renderer.js",
        "runtime/arcorbit/test/today-guidance.test.mjs",
        "runtime/arcorbit/test/desktop-renderer.test.mjs",
        "runtime/arcorbit/test/fixtures/organization-center-electron.mjs",
        "runtime/arcorbit/test/organization-center-electron.test.mjs",
        "Verification: targeted diff review found no correctness, scope or minimality finding, 2026-08-26",
        "Verification: targeted diff check passed, 2026-08-26",
        "Verification: 63 focused Work/Renderer tests passed, 0 failed, 2026-08-26",
        "Verification: Organization Electron regression passed, 1 passed and 0 failed, 2026-08-26"
      ],
      "runtime_result_ref": "arckit-runtime://runs/RUN-20260826-101445271Z-479c5dcd",
      "occurred_at": "2026-08-26T10:33:19.260Z"
    }
  ],
  "case_resolution": {
    "status": "resolved",
    "stage": "resolved",
    "satisfied": [
      "GAP-20260826-008-001",
      "GAP-20260826-008-002"
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
    "updated_at": "2026-08-26T10:33:19.260Z"
  }
}
```

## Round Notes

- Case history is canonical in Structured Record.rounds; keep prose notes exceptional.
