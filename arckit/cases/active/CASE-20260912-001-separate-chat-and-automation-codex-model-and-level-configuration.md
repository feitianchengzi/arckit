# Separate Chat and Automation Codex model and level configuration

Case: CASE-20260912-001
Status: active
Artifact Type: mixed
Selected Gap: none
Updated: 2026-09-12T03:33:06.897Z

## User Intent

将 Codex Model 与 Level 配置按 Chat 和 Automation 场景拆分，并在 Chat 输入框附近提供可直接调整当前对话后续消息所用 Model 与 Level 的快捷入口。

## Structured Record

```json
{
  "schema_version": "development-case-record/v5",
  "id": "CASE-20260912-001",
  "title": "Separate Chat and Automation Codex model and level configuration",
  "status": "active",
  "artifact_type": "mixed",
  "created_at": "2026-09-12T03:33:06.897Z",
  "updated_at": "2026-09-12T03:33:06.897Z",
  "user_intent": "将 Codex Model 与 Level 配置按 Chat 和 Automation 场景拆分，并在 Chat 输入框附近提供可直接调整当前对话后续消息所用 Model 与 Level 的快捷入口。",
  "expected_outcome": "ArcOrbit 分别持久化并消费 Chat 与 Automation 的 Model/Level 默认值；Chat Composer 可查看和调整后续 Chat turn 使用的值，保持原 thread 连续性且不改变 Automation 默认值；已启动的 Chat turn 和 Automation Run 配置保持固定；既有共享配置得到兼容迁移，并具备稳定产品、交互、技术契约和回归证据。",
  "project_state_ref": "arckit/project/state.record.json",
  "current_round": {
    "goal": "",
    "selected_gap": null
  },
  "facts": [
    {
      "id": "FACT-20260912-001-001",
      "revision": 1,
      "status": "accepted",
      "statement": "用户要求 Codex 的 Model 与 Level 配置区分 Chat 和 Automation 场景，同时 Chat 输入框支持快速直接调整当前对话使用的 Model 与 Level。",
      "basis": "当前操作者输入直接定义本次产品改动目标。",
      "evidence": [
        "Current operator input, 2026-09-12"
      ]
    },
    {
      "id": "FACT-20260912-001-002",
      "revision": 1,
      "status": "accepted",
      "statement": "当前 ArcOrbit 仅持久化一组 settings.codex.model/reasoning_effort：ChatCoordinator 在每个 Chat turn 启动时读取该值，DesktopRunManager 在每个 Automation Run 启动时读取并固定同一值；Chat Composer 当前仅提供技能、停止和发送操作，没有 Model/Level 快捷控件。",
      "basis": "当前源码直接表明持久化、消费和 Composer 结构仍是共享配置模型。",
      "evidence": [
        "runtime/arcorbit/src/codex-model-settings.mjs",
        "runtime/arcorbit/src/desktop/desktop-store.mjs",
        "runtime/arcorbit/src/chat-coordinator.mjs",
        "runtime/arcorbit/src/desktop-run-manager.mjs",
        "runtime/arcorbit/desktop/renderer/index.html",
        "runtime/arcorbit/desktop/renderer/codex-settings-form.mjs"
      ]
    }
  ],
  "state_impacts": [
    {
      "id": "IMPACT-20260912-001-001",
      "fact_id": "FACT-20260912-001-001",
      "fact_revision": 1,
      "target": {
        "kind": "software_decision",
        "ref": "product_capabilities",
        "revision": 45
      },
      "effect": "threatened",
      "reason": "既有决策把一组保存值同时用于下一条 Chat 消息和下一次 Automation Run，不能表达用户要求的场景独立配置。",
      "gap_ids": [
        "GAP-20260912-001-001"
      ],
      "evidence": [
        "Current operator input, 2026-09-12",
        "arckit/spec/agentic-software-development/arcorbit-platform-capabilities.md"
      ]
    },
    {
      "id": "IMPACT-20260912-001-002",
      "fact_id": "FACT-20260912-001-002",
      "fact_revision": 1,
      "target": {
        "kind": "software_decision",
        "ref": "experience_and_interaction",
        "revision": 68
      },
      "effect": "threatened",
      "reason": "既有交互只在账号设置覆盖层编辑共享配置，Chat Composer 尚不能直接调整当前对话后续消息使用的 Model 与 Level。",
      "gap_ids": [
        "GAP-20260912-001-001"
      ],
      "evidence": [
        "runtime/arcorbit/desktop/renderer/index.html",
        "runtime/arcorbit/desktop/renderer/codex-settings-form.mjs",
        "arckit/interaction/chat-workspace/interaction.md"
      ]
    },
    {
      "id": "IMPACT-20260912-001-003",
      "fact_id": "FACT-20260912-001-002",
      "fact_revision": 1,
      "target": {
        "kind": "software_decision",
        "ref": "data_and_state",
        "revision": 24
      },
      "effect": "threatened",
      "reason": "Desktop Store 当前独占单组 settings.codex 字段；场景拆分需要明确 Chat、Automation、迁移和会话级选择的数据所有权。",
      "gap_ids": [
        "GAP-20260912-001-001"
      ],
      "evidence": [
        "runtime/arcorbit/src/desktop/desktop-store.mjs",
        "runtime/arcorbit/src/codex-model-settings.mjs",
        "arckit/tech/arcorbit/desktop-execution-solution.md"
      ]
    },
    {
      "id": "IMPACT-20260912-001-004",
      "fact_id": "FACT-20260912-001-002",
      "fact_revision": 1,
      "target": {
        "kind": "software_decision",
        "ref": "external_integrations",
        "revision": 17
      },
      "effect": "threatened",
      "reason": "Chat app-server turn 与 Automation CLI/adapter 当前从同一配置来源取得执行参数，需要改为各自消费对应场景配置并保持活动执行固定。",
      "gap_ids": [
        "GAP-20260912-001-001"
      ],
      "evidence": [
        "runtime/arcorbit/src/chat-coordinator.mjs",
        "runtime/arcorbit/src/desktop-run-manager.mjs",
        "runtime/arcorbit/adapters/codex-app-server-adapter.mjs"
      ]
    }
  ],
  "gaps": [
    {
      "id": "GAP-20260912-001-001",
      "status": "open",
      "goal": "建立并实现独立的 Chat 与 Automation Codex Model/Level 配置，提供 Chat Composer 快速调整能力，并以兼容迁移、执行参数贯通和回归测试证明行为。",
      "reason": "当前单组持久配置同时驱动两个场景且 Composer 无调整入口，无法兑现用户要求；实现还必须保持已有用户值、Chat thread 连续性和已启动执行的配置固定语义。",
      "derived_from": [
        "FACT-20260912-001-001",
        "FACT-20260912-001-002"
      ],
      "blocked_by": [],
      "priority_basis": {
        "blocking": "用户请求的功能尚未实现",
        "uncertainty": "需要结合当前设置页与 Chat 会话状态确定最小一致的数据迁移和快捷调整语义",
        "risk": "配置迁移或路由错误可能使 Chat 设置污染 Automation，或改变活动执行",
        "user_impact": "用户无法为两个场景选择不同模型，也无法在 Chat 输入处快速切换"
      },
      "responsibility": "agent",
      "evidence_required": [
        "更新后的产品、Chat 交互和技术持久化/执行契约",
        "既有单组 settings.codex 值的兼容迁移证据",
        "Chat 与 Automation 分别读取对应 Model/Level 的实现证据",
        "Chat Composer 调整后续 turn 且保持 thread 连续性的行为证据",
        "已启动 Automation Run 配置固定且不受 Chat 调整影响的回归证据",
        "相关 Desktop Store、Chat、Automation、Renderer 测试通过"
      ],
      "resolution": null
    }
  ],
  "content_revision": 0,
  "completion_review": {
    "status": "pending",
    "policy": {
      "initial_max_cycles": 10,
      "source": "runtime/arcorbit/config/case-policy.json",
      "snapshotted_at": "2026-09-12T03:33:06.897Z"
    },
    "additional_cycles_authorized": 0,
    "cycle_count": 0,
    "reviewed_content_revision": null,
    "dimensions": {
      "implementation_correctness": "unknown",
      "problem_resolution": "unknown",
      "verification_credibility": "unknown",
      "regression_risk": "unknown",
      "minimality": "unknown"
    },
    "findings": [],
    "cycles": [],
    "evidence": [],
    "escalation": null,
    "human_authorizations": []
  },
  "open_questions": [],
  "decisions": [],
  "pending_handoffs": [],
  "process_notes": [],
  "rounds": [],
  "case_resolution": {
    "status": "unresolved",
    "stage": "working",
    "satisfied": [],
    "remaining": [
      "GAP-20260912-001-001",
      "impact:IMPACT-20260912-001-001",
      "impact:IMPACT-20260912-001-002",
      "impact:IMPACT-20260912-001-003",
      "impact:IMPACT-20260912-001-004"
    ],
    "blocked": [],
    "reason": "5 Case obligation(s) remain.",
    "candidate_gaps": [
      {
        "id": "GAP-20260912-001-001",
        "responsibility": "agent",
        "goal": "建立并实现独立的 Chat 与 Automation Codex Model/Level 配置，提供 Chat Composer 快速调整能力，并以兼容迁移、执行参数贯通和回归测试证明行为。",
        "reason": "当前单组持久配置同时驱动两个场景且 Composer 无调整入口，无法兑现用户要求；实现还必须保持已有用户值、Chat thread 连续性和已启动执行的配置固定语义。",
        "derived_from": [
          "FACT-20260912-001-001",
          "FACT-20260912-001-002"
        ],
        "blocked_by": [],
        "priority_basis": {
          "blocking": "用户请求的功能尚未实现",
          "uncertainty": "需要结合当前设置页与 Chat 会话状态确定最小一致的数据迁移和快捷调整语义",
          "risk": "配置迁移或路由错误可能使 Chat 设置污染 Automation，或改变活动执行",
          "user_impact": "用户无法为两个场景选择不同模型，也无法在 Chat 输入处快速切换"
        },
        "evidence_required": [
          "更新后的产品、Chat 交互和技术持久化/执行契约",
          "既有单组 settings.codex 值的兼容迁移证据",
          "Chat 与 Automation 分别读取对应 Model/Level 的实现证据",
          "Chat Composer 调整后续 turn 且保持 thread 连续性的行为证据",
          "已启动 Automation Run 配置固定且不受 Chat 调整影响的回归证据",
          "相关 Desktop Store、Chat、Automation、Renderer 测试通过"
        ]
      }
    ],
    "loop_handoff": {
      "version": "loop-handoff/v2",
      "status": "continue",
      "next_responsibility": "agent",
      "agent_continuation_available": true,
      "human_decision_required": false,
      "trigger_mode": "automatic",
      "responsibility_reason": "当前单组持久配置同时驱动两个场景且 Composer 无调整入口，无法兑现用户要求；实现还必须保持已有用户值、Chat thread 连续性和已启动执行的配置固定语义。",
      "next_prompt": "Continue CASE-20260912-001: compare the ready dynamic gaps and advance one evidence-backed transition.",
      "human_gate": {
        "required": false,
        "reason": "",
        "decision_needed": ""
      }
    },
    "updated_at": "2026-09-12T03:33:06.897Z"
  }
}
```

## Round Notes

- Case history is canonical in Structured Record.rounds; keep prose notes exceptional.
