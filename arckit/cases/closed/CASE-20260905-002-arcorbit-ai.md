# ArcOrbit AI 对话直接展示变更文件

Case: CASE-20260905-002
Status: closed
Artifact Type: mixed
Selected Gap: none
Updated: 2026-09-05T06:48:52.616Z

## User Intent

解决 AI 对话消息列表只显示“更新项目文件”、无法直接知道修改了哪些文件的问题。

## Structured Record

```json
{
  "schema_version": "development-case-record/v5",
  "id": "CASE-20260905-002",
  "title": "ArcOrbit AI 对话直接展示变更文件",
  "status": "closed",
  "artifact_type": "mixed",
  "created_at": "2026-09-05T06:35:29.882Z",
  "updated_at": "2026-09-05T06:48:52.616Z",
  "user_intent": "解决 AI 对话消息列表只显示“更新项目文件”、无法直接知道修改了哪些文件的问题。",
  "expected_outcome": "文件变更消息直接显示实际变更的具体文件，展示内容有真实消息数据依据，并有相应回归验证。",
  "project_state_ref": "arckit/project/state.record.json",
  "current_round": {
    "goal": "",
    "selected_gap": null
  },
  "facts": [
    {
      "id": "FACT-20260905-002-001",
      "revision": 1,
      "status": "accepted",
      "statement": "用户报告 ArcOrbit AI 对话消息列表只展示“更新项目文件”，要求直接展示具体修改的文件；当前尚未通过实现或运行证据确认原因及影响范围。",
      "basis": "当前用户输入明确给出问题现象和期望。",
      "evidence": [
        "Current operator input: ArcOrbit，AI 对话消息列表，只展示『更新项目文件』，预期应该直接展示具体改的是什么文件"
      ]
    },
    {
      "id": "FACT-20260905-002-002",
      "revision": 1,
      "status": "superseded",
      "statement": "当前仓库 ChatCoordinator 的 toolSummary 对 fileChange 无条件返回“更新项目文件”，started/completed 都将该摘要写入同一 tool 消息，原始 changes 路径未进入消息。两个路径的合成输入在 live、completed、持久化及新 Store/Coordinator 重开后均只显示固定文案，真实渲染函数亦不显示路径。Automation 的独立投影已提取文件路径；旧 Chat 消息若仅存固定 content，不能仅凭该消息恢复目标。",
      "basis": "源码数据链完整解释报告现象；隔离临时 Store 的可重复执行验证消息身份连续、四阶段内容及 HTML。未执行真实 Codex 或安装包 GUI 验收。",
      "evidence": [
        "arckit/debug/chat-file-change-display/diagnosis.md",
        "arckit/debug/chat-file-change-display/reproduce.mjs",
        "runtime/arcorbit/src/chat-coordinator.mjs",
        "runtime/arcorbit/desktop/renderer/conversation-surface.mjs",
        "runtime/arcorbit/src/projection/run-event-projector.mjs"
      ]
    },
    {
      "id": "FACT-20260905-002-003",
      "revision": 1,
      "status": "accepted",
      "statement": "ChatCoordinator 现从 fileChange 的 changes.path/filePath 或顶层路径回退生成具体文件摘要，按顺序去重，展示前三个路径并在超过三个时标明总数，每个路径超过 120 个 Unicode 码点时保留首尾。无路径事件保留同一 live item 的已有目标，否则使用通用提示。实时、完成、持久化及新 Store/Coordinator 重开均保留目标和消息身份；历史固定摘要不推测目标，渲染保持文本转义且不显示 diff。Automation 投影保持不变。",
      "basis": "已接受原因指导的局部实现、15 种输入的行为回归、原复现四阶段结果及 94 项相关测试。",
      "evidence": [
        "runtime/arcorbit/src/chat-coordinator.mjs",
        "runtime/arcorbit/test/chat-coordinator.test.mjs",
        "arckit/debug/chat-file-change-display/diagnosis.md",
        "arckit/interaction/chat-workspace/interaction.md"
      ]
    }
  ],
  "state_impacts": [
    {
      "id": "IMPACT-20260905-002-001",
      "fact_id": "FACT-20260905-002-003",
      "fact_revision": 1,
      "target": {
        "kind": "software_invariant",
        "ref": "accepted-facts-are-realized",
        "revision": null
      },
      "effect": "upheld",
      "reason": "Chat 工具消息现在兑现具体文件目标展示及持久化连续性预期。",
      "gap_ids": [],
      "evidence": [
        "runtime/arcorbit/test/chat-coordinator.test.mjs",
        "arckit/debug/chat-file-change-display/diagnosis.md"
      ]
    }
  ],
  "gaps": [
    {
      "id": "GAP-20260905-002-001",
      "status": "resolved",
      "goal": "确定文件变更消息未展示具体文件的原因、受影响消息路径及可验证的修复边界。",
      "reason": "尚不清楚文件信息在事件采集、持久化、消息投影或界面渲染中的哪一层缺失；不同原因将改变修复对象和验证范围，需要先建立实现证据。",
      "derived_from": [
        "FACT-20260905-002-001"
      ],
      "blocked_by": [],
      "priority_basis": {
        "blocking": "阻塞有依据的修复范围确定",
        "uncertainty": "文件信息丢失位置与受影响消息路径尚未确认",
        "risk": "仅修改通用文案可能无法恢复真实变更文件",
        "user_impact": "用户无法从对话列表直接识别 AI 修改了哪些文件"
      },
      "responsibility": "agent",
      "evidence_required": [
        "“更新项目文件”文案来源与实际渲染路径",
        "文件变更事件经过采集、存储和投影的字段证据",
        "可重复的问题验证与受影响范围结论"
      ],
      "resolution": {
        "id": "GAP-20260905-002-001",
        "status": "resolved",
        "outcome": "已定位 ChatCoordinator 的有损摘要投影，并复现四阶段路径缺失。",
        "reason": "fileChange 分支恒定返回“更新项目文件”；含两个路径的合成事件经过真实 Coordinator、Store 和渲染函数后均不显示路径，Automation 对照路径已能提取文件目标。",
        "evidence": [
          "arckit/debug/chat-file-change-display/diagnosis.md",
          "arckit/debug/chat-file-change-display/reproduce.mjs",
          "node arckit/debug/chat-file-change-display/reproduce.mjs: exit 0，live/completed/persisted/reopened 路径可见性均为 false"
        ],
        "occurred_at": "2026-09-05T06:40:50.830Z"
      }
    },
    {
      "id": "GAP-20260905-002-002",
      "status": "resolved",
      "goal": "让 Chat 文件变更消息直接展示真实事件中的具体文件目标，并验证实时、持久化与重开一致性。",
      "reason": "已确认 Chat 摘要生成主动丢弃文件路径；需要修复该投影并补足现有测试遗漏，同时保持有界展示、消息身份及无路径回退。",
      "derived_from": [
        "FACT-20260905-002-002",
        "FACT-20260905-002-001"
      ],
      "blocked_by": [],
      "priority_basis": {
        "blocking": "阻塞本 Case 问题解决",
        "uncertainty": "原因已确定，修复尚未验证",
        "risk": "路径展示须避免原始 diff 泄漏、异常字段及消息重复",
        "user_impact": "用户直接识别 AI 改动的具体文件"
      },
      "responsibility": "agent",
      "evidence_required": [
        "单文件、多文件及无路径时的有界摘要行为",
        "空或异常字段、长路径、特殊字符及 diff/raw payload 不进入正文的验证",
        "started/completed 更新同一消息及保存重开后的路径展示",
        "既有 Automation 文件目标行为保持的回归证据",
        "实现符合持久交互和技术预期；旧消息无目标数据时不伪造文件名"
      ],
      "resolution": {
        "id": "GAP-20260905-002-002",
        "status": "resolved",
        "outcome": "Chat 文件变更消息直接显示真实路径，生命周期和边界回归通过。",
        "reason": "摘要提取有效路径、去重并有界展示；15 种输入覆盖主要边界，原复现四阶段路径均可见，相关测试共 94 项通过。",
        "evidence": [
          "runtime/arcorbit/src/chat-coordinator.mjs",
          "runtime/arcorbit/test/chat-coordinator.test.mjs",
          "arckit/debug/chat-file-change-display/diagnosis.md",
          "arckit/interaction/chat-workspace/interaction.md",
          "node arckit/debug/chat-file-change-display/reproduce.mjs: 四阶段路径均可见，消息 ID 一致，diff 不可见"
        ],
        "occurred_at": "2026-09-05T06:47:18.784Z"
      }
    }
  ],
  "content_revision": 2,
  "completion_review": {
    "status": "clean",
    "policy": {
      "initial_max_cycles": 10,
      "source": "runtime/arcorbit/config/case-policy.json",
      "snapshotted_at": "2026-09-05T06:35:29.882Z"
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
          "实现正确性：核对 runtime/arcorbit/src/chat-coordinator.mjs 最终 diff，确认有效路径提取、顺序去重、长度限制、缺失路径回退及同一 live item 更新逻辑。",
          "问题解决：arckit/debug/chat-file-change-display/diagnosis.md 记录原复现四阶段均显示“更新 src/view.js、src/styles.css”，消息 ID 一致；对应真实渲染函数直接转义显示 content。",
          "验证可信度：runtime/arcorbit/test/chat-coordinator.test.mjs 使用合成 adapter 驱动真实 Coordinator、Desktop Store 和渲染函数，包含 15 种输入及新 Store/Coordinator 重开验证；已接受运行结果为三组相关测试 94 passed、0 failed。",
          "回归风险：测试覆盖异常字段、多文件、长路径、特殊字符、无路径及历史提示；Automation 文件目标回归通过，Renderer 文本转义与消息 schema 未改变。",
          "最小性：产品实现仅修改 ChatCoordinator 的工具消息摘要入口；测试、诊断及 Chat 交互文档直接服务同一修复，无依赖、Runtime 控制或布局变更。",
          "arckit/interaction/chat-workspace/interaction.md",
          "arckit/interaction/chat-workspace/default.html",
          "arckit/interaction/INDEX.md"
        ],
        "occurred_at": "2026-09-05T06:48:52.616Z"
      }
    ],
    "evidence": [
      "实现正确性：核对 runtime/arcorbit/src/chat-coordinator.mjs 最终 diff，确认有效路径提取、顺序去重、长度限制、缺失路径回退及同一 live item 更新逻辑。",
      "问题解决：arckit/debug/chat-file-change-display/diagnosis.md 记录原复现四阶段均显示“更新 src/view.js、src/styles.css”，消息 ID 一致；对应真实渲染函数直接转义显示 content。",
      "验证可信度：runtime/arcorbit/test/chat-coordinator.test.mjs 使用合成 adapter 驱动真实 Coordinator、Desktop Store 和渲染函数，包含 15 种输入及新 Store/Coordinator 重开验证；已接受运行结果为三组相关测试 94 passed、0 failed。",
      "回归风险：测试覆盖异常字段、多文件、长路径、特殊字符、无路径及历史提示；Automation 文件目标回归通过，Renderer 文本转义与消息 schema 未改变。",
      "最小性：产品实现仅修改 ChatCoordinator 的工具消息摘要入口；测试、诊断及 Chat 交互文档直接服务同一修复，无依赖、Runtime 控制或布局变更。",
      "arckit/interaction/chat-workspace/interaction.md",
      "arckit/interaction/chat-workspace/default.html",
      "arckit/interaction/INDEX.md"
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
      "goal": "追踪文件变更事件到 Chat 消息的字段流，并验证实时、保存和重开行为。",
      "outcome": "completed",
      "gap_selection": {
        "mode": "candidate",
        "basis": "当前用户问题和已建档调查 Gap 直接对应；原因将决定修复范围，优先建立实现证据。",
        "snapshot_token": "2d13c85279f254476b436679aab2d8e67ef5f83f6cec7cdf0d753e2cc2a8f5d0",
        "selected_ref": "case-gap:CASE-20260905-002:GAP-20260905-002-001",
        "comparison_summary": "选择文件显示调查；四项 Project 候选暂缓，仓库合并人工发布确认排除在本轮范围外。",
        "fresh_discovery_summary": "选择时没有新增候选；调查形成了后续 Chat 文件摘要修复缺口，本轮不执行该下游修复。",
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
            "reason": "独立场景验证不阻塞本次用户问题定位。"
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
            "reason": "Runtime 韧性与适配器验收范围独立，本次先确定文件显示缺失边界。"
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
            "reason": "真实权限项目验证不是本次合成消息调查的前置条件。"
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
            "reason": "跨记录审计与当前文件消息缺失没有直接依赖。"
          },
          {
            "ref": "case-gap:CASE-20260901-001:GAP-20260901-001-005",
            "source": "persisted",
            "eligibility": "ready",
            "disposition": "excluded",
            "priority_basis": {
              "blocking": "公共发布与归档",
              "uncertainty": "",
              "risk": "high",
              "user_impact": ""
            },
            "reason": "凭据、许可和发布确认属于另一 Case 的人工责任，不纳入本轮。"
          },
          {
            "ref": "case-gap:CASE-20260905-002:GAP-20260905-002-001",
            "source": "persisted",
            "eligibility": "ready",
            "disposition": "selected",
            "priority_basis": {
              "blocking": "阻塞修复范围确定",
              "uncertainty": "文件信息丢失位置未知",
              "risk": "仅改文案可能无法恢复真实文件",
              "user_impact": "直接解决当前用户问题的前置调查"
            },
            "reason": "可以通过代码追踪和隔离复现建立确定的原因与修复边界。"
          }
        ]
      },
      "selected_gap": {
        "id": "GAP-20260905-002-001",
        "responsibility": "agent",
        "goal": "确定文件变更消息未展示具体文件的原因、受影响消息路径及可验证的修复边界。",
        "reason": "尚不清楚文件信息在事件采集、持久化、消息投影或界面渲染中的哪一层缺失；不同原因将改变修复对象和验证范围，需要先建立实现证据。",
        "derived_from": [
          "FACT-20260905-002-001"
        ],
        "blocked_by": [],
        "priority_basis": {
          "blocking": "阻塞有依据的修复范围确定",
          "uncertainty": "文件信息丢失位置与受影响消息路径尚未确认",
          "risk": "仅修改通用文案可能无法恢复真实变更文件",
          "user_impact": "用户无法从对话列表直接识别 AI 修改了哪些文件"
        },
        "evidence_required": [
          "“更新项目文件”文案来源与实际渲染路径",
          "文件变更事件经过采集、存储和投影的字段证据",
          "可重复的问题验证与受影响范围结论"
        ]
      },
      "planned_transition": {
        "goal": "追踪文件变更事件到 Chat 消息的字段流，并验证实时、保存和重开行为。",
        "expected_state_change": "将原因与影响范围从未知变为有可重复证据支持的诊断结论。"
      },
      "accepted_state_delta": {
        "resolved_gap": {
          "id": "GAP-20260905-002-001",
          "status": "resolved",
          "outcome": "已定位 ChatCoordinator 的有损摘要投影，并复现四阶段路径缺失。",
          "reason": "fileChange 分支恒定返回“更新项目文件”；含两个路径的合成事件经过真实 Coordinator、Store 和渲染函数后均不显示路径，Automation 对照路径已能提取文件目标。",
          "evidence": [
            "arckit/debug/chat-file-change-display/diagnosis.md",
            "arckit/debug/chat-file-change-display/reproduce.mjs",
            "node arckit/debug/chat-file-change-display/reproduce.mjs: exit 0，live/completed/persisted/reopened 路径可见性均为 false"
          ]
        },
        "facts_added": [
          {
            "id": "FACT-20260905-002-002",
            "revision": 1,
            "status": "accepted",
            "statement": "当前仓库 ChatCoordinator 的 toolSummary 对 fileChange 无条件返回“更新项目文件”，started/completed 都将该摘要写入同一 tool 消息，原始 changes 路径未进入消息。两个路径的合成输入在 live、completed、持久化及新 Store/Coordinator 重开后均只显示固定文案，真实渲染函数亦不显示路径。Automation 的独立投影已提取文件路径；旧 Chat 消息若仅存固定 content，不能仅凭该消息恢复目标。",
            "basis": "源码数据链完整解释报告现象；隔离临时 Store 的可重复执行验证消息身份连续、四阶段内容及 HTML。未执行真实 Codex 或安装包 GUI 验收。",
            "evidence": [
              "arckit/debug/chat-file-change-display/diagnosis.md",
              "arckit/debug/chat-file-change-display/reproduce.mjs",
              "runtime/arcorbit/src/chat-coordinator.mjs",
              "runtime/arcorbit/desktop/renderer/conversation-surface.mjs",
              "runtime/arcorbit/src/projection/run-event-projector.mjs"
            ]
          }
        ],
        "facts_superseded": [],
        "impacts_added": [
          {
            "id": "IMPACT-20260905-002-001",
            "fact_id": "FACT-20260905-002-002",
            "fact_revision": 1,
            "target": {
              "kind": "software_invariant",
              "ref": "accepted-facts-are-realized",
              "revision": null
            },
            "effect": "threatened",
            "reason": "实际 Chat 消息未兑现工具活动显示有界目标及用户直接识别变更文件的预期。",
            "gap_ids": [
              "GAP-20260905-002-002"
            ],
            "evidence": [
              "arckit/debug/chat-file-change-display/diagnosis.md"
            ]
          }
        ],
        "impacts_updated": [],
        "gaps_added": [
          {
            "id": "GAP-20260905-002-002",
            "status": "open",
            "goal": "让 Chat 文件变更消息直接展示真实事件中的具体文件目标，并验证实时、持久化与重开一致性。",
            "reason": "已确认 Chat 摘要生成主动丢弃文件路径；需要修复该投影并补足现有测试遗漏，同时保持有界展示、消息身份及无路径回退。",
            "derived_from": [
              "FACT-20260905-002-002",
              "FACT-20260905-002-001"
            ],
            "blocked_by": [],
            "priority_basis": {
              "blocking": "阻塞本 Case 问题解决",
              "uncertainty": "原因已确定，修复尚未验证",
              "risk": "路径展示须避免原始 diff 泄漏、异常字段及消息重复",
              "user_impact": "用户直接识别 AI 改动的具体文件"
            },
            "responsibility": "agent",
            "evidence_required": [
              "单文件、多文件及无路径时的有界摘要行为",
              "空或异常字段、长路径、特殊字符及 diff/raw payload 不进入正文的验证",
              "started/completed 更新同一消息及保存重开后的路径展示",
              "既有 Automation 文件目标行为保持的回归证据",
              "实现符合持久交互和技术预期；旧消息无目标数据时不伪造文件名"
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
        "project_revision": 349,
        "judgments": [
          {
            "invariant_ref": "product-expectations-remain-recoverable",
            "disposition": "upheld",
            "reason": "显示真实工具目标的预期可从已建档用户事实及持久工具活动约定恢复，本次定位没有改变产品范围。",
            "fact_refs": [
              "FACT-20260905-002-001"
            ],
            "evidence": [
              "arckit/interaction/chat-workspace/interaction.md",
              "arckit/tech/arcorbit/desktop-execution-solution.md"
            ],
            "gap_refs": []
          },
          {
            "invariant_ref": "interaction-expectations-remain-recoverable",
            "disposition": "upheld",
            "reason": "工具活动按 item 原位展示状态及有界目标、排除文件正文和 raw payload 的长期预期明确；发现的是实现偏差。",
            "fact_refs": [
              "FACT-20260905-002-002"
            ],
            "evidence": [
              "arckit/interaction/chat-workspace/interaction.md"
            ],
            "gap_refs": []
          },
          {
            "invariant_ref": "visual-language-remains-consistent",
            "disposition": "not_relevant",
            "reason": "发现的是消息路径字段在投影中丢失，没有建立或改变主题、布局、组件视觉或平台呈现规则。",
            "fact_refs": [],
            "evidence": [],
            "gap_refs": []
          },
          {
            "invariant_ref": "technical-decisions-remain-explainable",
            "disposition": "upheld",
            "reason": "既有 Chat 与 Automation 独立投影、共享 Conversation Surface 和 messages 持久化边界可恢复；诊断明确了丢失发生位置，无需改变所有权架构。",
            "fact_refs": [
              "FACT-20260905-002-002"
            ],
            "evidence": [
              "arckit/tech/arcorbit/desktop-execution-solution.md",
              "arckit/debug/chat-file-change-display/diagnosis.md"
            ],
            "gap_refs": []
          },
          {
            "invariant_ref": "accepted-facts-are-realized",
            "disposition": "threatened",
            "reason": "Chat 文件消息仍不显示真实文件目标，尚未完成产品修复。",
            "fact_refs": [
              "FACT-20260905-002-002"
            ],
            "evidence": [
              "arckit/debug/chat-file-change-display/diagnosis.md",
              "arckit/debug/chat-file-change-display/reproduce.mjs"
            ],
            "gap_refs": [
              "GAP-20260905-002-002"
            ]
          },
          {
            "invariant_ref": "material-risks-have-credible-evidence",
            "disposition": "threatened",
            "reason": "诊断已有重复证据，但现有 29 项测试均通过仍未发现 Chat 文件目标缺失；修复及其边界控制需要新增针对性验收。",
            "fact_refs": [
              "FACT-20260905-002-002"
            ],
            "evidence": [
              "arckit/debug/chat-file-change-display/diagnosis.md"
            ],
            "gap_refs": [
              "GAP-20260905-002-002"
            ]
          }
        ]
      },
      "evidence": [
        "arckit/debug/chat-file-change-display/diagnosis.md",
        "arckit/debug/chat-file-change-display/reproduce.mjs",
        "node --test runtime/arcorbit/test/chat-coordinator.test.mjs runtime/arcorbit/test/token-usage-projector.test.mjs: 29 passed, 0 failed",
        "git diff --check: passed"
      ],
      "runtime_result_ref": "arckit-runtime://runs/RUN-20260905-063424257Z-1d0b4228",
      "occurred_at": "2026-09-05T06:40:50.830Z"
    },
    {
      "round": 2,
      "transition_schema_version": "arckit-case-transition/v8",
      "goal": "修复 Chat 文件目标摘要，补充局部交互规则并验证消息生命周期与异常输入。",
      "outcome": "completed",
      "gap_selection": {
        "mode": "candidate",
        "basis": "已接受诊断明确定位 Chat 摘要丢弃路径，本轮可直接完成有界修复与验收。",
        "snapshot_token": "5e7265782bbdb0946e27a5149482186e3bfd38cd8fb5fd3f6f9fe7443e48aab7",
        "selected_ref": "case-gap:CASE-20260905-002:GAP-20260905-002-002",
        "comparison_summary": "选择直接兑现用户预期的 Chat 修复；四项 Project 候选暂缓，另一 Case 的人工发布确认排除在本轮范围外。",
        "fresh_discovery_summary": "未发现需要另行选择的新实质工作。",
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
            "reason": "独立场景验证不阻塞已定位的显示修复。"
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
            "reason": "Runtime 韧性和适配器验收与 Chat 摘要修复没有直接依赖。"
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
            "reason": "真实权限项目验证不是当前有界文本投影修复的前置条件。"
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
            "reason": "跨记录审计属于独立验收范围。"
          },
          {
            "ref": "case-gap:CASE-20260901-001:GAP-20260901-001-005",
            "source": "persisted",
            "eligibility": "ready",
            "disposition": "excluded",
            "priority_basis": {
              "blocking": "公共发布与归档",
              "uncertainty": "",
              "risk": "high",
              "user_impact": ""
            },
            "reason": "另一 Case 的凭据、许可和发布确认属于人工责任。"
          },
          {
            "ref": "case-gap:CASE-20260905-002:GAP-20260905-002-002",
            "source": "persisted",
            "eligibility": "ready",
            "disposition": "selected",
            "priority_basis": {
              "blocking": "阻塞用户问题解决",
              "uncertainty": "原因已确定，修复需要验证",
              "risk": "异常字段、正文泄漏和消息连续性",
              "user_impact": "直接识别 AI 改动的文件"
            },
            "reason": "已接受的原因与边界足以支持直接实施并形成可信验收。"
          }
        ]
      },
      "selected_gap": {
        "id": "GAP-20260905-002-002",
        "responsibility": "agent",
        "goal": "让 Chat 文件变更消息直接展示真实事件中的具体文件目标，并验证实时、持久化与重开一致性。",
        "reason": "已确认 Chat 摘要生成主动丢弃文件路径；需要修复该投影并补足现有测试遗漏，同时保持有界展示、消息身份及无路径回退。",
        "derived_from": [
          "FACT-20260905-002-002",
          "FACT-20260905-002-001"
        ],
        "blocked_by": [],
        "priority_basis": {
          "blocking": "阻塞本 Case 问题解决",
          "uncertainty": "原因已确定，修复尚未验证",
          "risk": "路径展示须避免原始 diff 泄漏、异常字段及消息重复",
          "user_impact": "用户直接识别 AI 改动的具体文件"
        },
        "evidence_required": [
          "单文件、多文件及无路径时的有界摘要行为",
          "空或异常字段、长路径、特殊字符及 diff/raw payload 不进入正文的验证",
          "started/completed 更新同一消息及保存重开后的路径展示",
          "既有 Automation 文件目标行为保持的回归证据",
          "实现符合持久交互和技术预期；旧消息无目标数据时不伪造文件名"
        ]
      },
      "planned_transition": {
        "goal": "修复 Chat 文件目标摘要，补充局部交互规则并验证消息生命周期与异常输入。",
        "expected_state_change": "具体文件目标在实时消息、持久化和重开后可见，既有投影缺陷及对应风险得到验证控制。"
      },
      "accepted_state_delta": {
        "resolved_gap": {
          "id": "GAP-20260905-002-002",
          "status": "resolved",
          "outcome": "Chat 文件变更消息直接显示真实路径，生命周期和边界回归通过。",
          "reason": "摘要提取有效路径、去重并有界展示；15 种输入覆盖主要边界，原复现四阶段路径均可见，相关测试共 94 项通过。",
          "evidence": [
            "runtime/arcorbit/src/chat-coordinator.mjs",
            "runtime/arcorbit/test/chat-coordinator.test.mjs",
            "arckit/debug/chat-file-change-display/diagnosis.md",
            "arckit/interaction/chat-workspace/interaction.md",
            "node arckit/debug/chat-file-change-display/reproduce.mjs: 四阶段路径均可见，消息 ID 一致，diff 不可见"
          ]
        },
        "facts_added": [
          {
            "id": "FACT-20260905-002-003",
            "revision": 1,
            "status": "accepted",
            "statement": "ChatCoordinator 现从 fileChange 的 changes.path/filePath 或顶层路径回退生成具体文件摘要，按顺序去重，展示前三个路径并在超过三个时标明总数，每个路径超过 120 个 Unicode 码点时保留首尾。无路径事件保留同一 live item 的已有目标，否则使用通用提示。实时、完成、持久化及新 Store/Coordinator 重开均保留目标和消息身份；历史固定摘要不推测目标，渲染保持文本转义且不显示 diff。Automation 投影保持不变。",
            "basis": "已接受原因指导的局部实现、15 种输入的行为回归、原复现四阶段结果及 94 项相关测试。",
            "evidence": [
              "runtime/arcorbit/src/chat-coordinator.mjs",
              "runtime/arcorbit/test/chat-coordinator.test.mjs",
              "arckit/debug/chat-file-change-display/diagnosis.md",
              "arckit/interaction/chat-workspace/interaction.md"
            ]
          }
        ],
        "facts_superseded": [
          {
            "id": "FACT-20260905-002-002",
            "revision": 1,
            "reason": "该事实描述的当前实现缺陷已修复；原诊断作为修复前历史证据保留，当前状态由新的实现事实说明。",
            "evidence": [
              "runtime/arcorbit/src/chat-coordinator.mjs",
              "arckit/debug/chat-file-change-display/diagnosis.md"
            ]
          }
        ],
        "impacts_added": [],
        "impacts_updated": [
          {
            "id": "IMPACT-20260905-002-001",
            "fact_id": "FACT-20260905-002-003",
            "fact_revision": 1,
            "target": {
              "kind": "software_invariant",
              "ref": "accepted-facts-are-realized",
              "revision": null
            },
            "effect": "upheld",
            "reason": "Chat 工具消息现在兑现具体文件目标展示及持久化连续性预期。",
            "gap_ids": [],
            "evidence": [
              "runtime/arcorbit/test/chat-coordinator.test.mjs",
              "arckit/debug/chat-file-change-display/diagnosis.md"
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
        "evidence": [
          "arckit/interaction/chat-workspace/interaction.md：补充既有有界工具目标的局部规则，未改变项目级能力或架构决策。"
        ]
      },
      "invariant_assessment": {
        "project_revision": 349,
        "judgments": [
          {
            "invariant_ref": "product-expectations-remain-recoverable",
            "disposition": "upheld",
            "reason": "用户要求的具体文件目标及其缺失数据边界可从持久交互规则恢复，产品范围保持不变。",
            "fact_refs": [
              "FACT-20260905-002-003"
            ],
            "evidence": [
              "arckit/interaction/chat-workspace/interaction.md",
              "arckit/tech/arcorbit/desktop-execution-solution.md"
            ],
            "gap_refs": []
          },
          {
            "invariant_ref": "interaction-expectations-remain-recoverable",
            "disposition": "upheld",
            "reason": "文件目标、多文件与长路径展示、无路径回退和原位更新已明确写入局部规则，线框及索引同步。",
            "fact_refs": [
              "FACT-20260905-002-003"
            ],
            "evidence": [
              "arckit/interaction/chat-workspace/interaction.md",
              "arckit/interaction/chat-workspace/default.html",
              "arckit/interaction/INDEX.md"
            ],
            "gap_refs": []
          },
          {
            "invariant_ref": "visual-language-remains-consistent",
            "disposition": "not_relevant",
            "reason": "本事实恢复消息文本目标，未改变主题、样式、布局、组件视觉或平台呈现规则。",
            "fact_refs": [],
            "evidence": [],
            "gap_refs": []
          },
          {
            "invariant_ref": "technical-decisions-remain-explainable",
            "disposition": "upheld",
            "reason": "修复保留 Chat 独立投影、messages 持久化和共享 Conversation Surface 边界，无 schema 或 Runtime 控制变更。",
            "fact_refs": [
              "FACT-20260905-002-003"
            ],
            "evidence": [
              "arckit/tech/arcorbit/desktop-execution-solution.md",
              "runtime/arcorbit/src/chat-coordinator.mjs",
              "arckit/debug/chat-file-change-display/diagnosis.md"
            ],
            "gap_refs": []
          },
          {
            "invariant_ref": "accepted-facts-are-realized",
            "disposition": "upheld",
            "reason": "原复现四阶段现在均显示具体文件；实际 Coordinator、Store 和渲染函数的行为回归证明预期已兑现。",
            "fact_refs": [
              "FACT-20260905-002-003"
            ],
            "evidence": [
              "runtime/arcorbit/test/chat-coordinator.test.mjs",
              "arckit/debug/chat-file-change-display/reproduce.mjs",
              "arckit/debug/chat-file-change-display/diagnosis.md"
            ],
            "gap_refs": []
          },
          {
            "invariant_ref": "material-risks-have-credible-evidence",
            "disposition": "upheld",
            "reason": "异常字段、长路径、多文件、转义、正文排除、缺失路径和消息连续性均有针对性证据；验收限于源码，不宣称安装包已更新。",
            "fact_refs": [
              "FACT-20260905-002-003"
            ],
            "evidence": [
              "runtime/arcorbit/test/chat-coordinator.test.mjs",
              "runtime/arcorbit/test/token-usage-projector.test.mjs",
              "arckit/debug/chat-file-change-display/diagnosis.md"
            ],
            "gap_refs": []
          }
        ]
      },
      "evidence": [
        "node --test runtime/arcorbit/test/chat-coordinator.test.mjs runtime/arcorbit/test/token-usage-projector.test.mjs runtime/arcorbit/test/desktop-renderer.test.mjs: 94 passed, 0 failed",
        "node arckit/debug/chat-file-change-display/reproduce.mjs: exit 0，四阶段具体文件均可见",
        "node --check runtime/arcorbit/src/chat-coordinator.mjs: passed",
        "git diff --check: passed",
        "arckit/debug/chat-file-change-display/diagnosis.md"
      ],
      "runtime_result_ref": "arckit-runtime://runs/RUN-20260905-063424257Z-1d0b4228",
      "occurred_at": "2026-09-05T06:47:18.784Z"
    },
    {
      "round": 3,
      "transition_schema_version": "arckit-case-transition/v8",
      "goal": "审查已完成修复的正确性、问题解决、证据可信度、回归风险和最小性。",
      "outcome": "completed",
      "gap_selection": {
        "mode": "candidate",
        "basis": "最新 trusted snapshot 确认普通 Gap 和 state impact 已闭合，完成审查已就绪。",
        "snapshot_token": "54582aae425a4177a6f361de34fc04f9512c11f78e2461b08c059ded80df83f8",
        "selected_ref": "case-gap:CASE-20260905-002:CASE-20260905-002:completion-review:1",
        "comparison_summary": "优先审查当前用户事项；四项独立 Project 候选暂缓，另一 Case 的人工发布确认排除在本轮范围外。",
        "fresh_discovery_summary": "审查未发现新的实质缺口。",
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
            "reason": "独立场景验证不阻塞当前修复的完成审查。"
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
            "reason": "Runtime 韧性和适配器验收属于独立范围。"
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
            "reason": "真实权限项目验证不是当前文本投影修复审查的前置条件。"
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
            "reason": "跨记录审计不影响当前实现证据的审查。"
          },
          {
            "ref": "case-gap:CASE-20260901-001:GAP-20260901-001-005",
            "source": "persisted",
            "eligibility": "ready",
            "disposition": "excluded",
            "priority_basis": {
              "blocking": "公共发布与归档",
              "uncertainty": "",
              "risk": "high",
              "user_impact": ""
            },
            "reason": "属于另一 Case 的人工凭据、许可和发布确认。"
          },
          {
            "ref": "case-gap:CASE-20260905-002:CASE-20260905-002:completion-review:1",
            "source": "persisted",
            "eligibility": "ready",
            "disposition": "selected",
            "priority_basis": {
              "blocking": "high",
              "uncertainty": "low",
              "risk": "high",
              "user_impact": "high"
            },
            "reason": "普通工作已闭合，需核实修复是否真实解决问题并满足五项完成维度。"
          }
        ]
      },
      "selected_gap": {
        "id": "CASE-20260905-002:completion-review:1",
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
        "goal": "审查已完成修复的正确性、问题解决、证据可信度、回归风险和最小性。",
        "expected_state_change": "形成独立完成审查结论，供 trusted Ledger 验收。"
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
            "实现正确性：核对 runtime/arcorbit/src/chat-coordinator.mjs 最终 diff，确认有效路径提取、顺序去重、长度限制、缺失路径回退及同一 live item 更新逻辑。",
            "问题解决：arckit/debug/chat-file-change-display/diagnosis.md 记录原复现四阶段均显示“更新 src/view.js、src/styles.css”，消息 ID 一致；对应真实渲染函数直接转义显示 content。",
            "验证可信度：runtime/arcorbit/test/chat-coordinator.test.mjs 使用合成 adapter 驱动真实 Coordinator、Desktop Store 和渲染函数，包含 15 种输入及新 Store/Coordinator 重开验证；已接受运行结果为三组相关测试 94 passed、0 failed。",
            "回归风险：测试覆盖异常字段、多文件、长路径、特殊字符、无路径及历史提示；Automation 文件目标回归通过，Renderer 文本转义与消息 schema 未改变。",
            "最小性：产品实现仅修改 ChatCoordinator 的工具消息摘要入口；测试、诊断及 Chat 交互文档直接服务同一修复，无依赖、Runtime 控制或布局变更。",
            "arckit/interaction/chat-workspace/interaction.md",
            "arckit/interaction/chat-workspace/default.html",
            "arckit/interaction/INDEX.md"
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
        "project_revision": 349,
        "judgments": [
          {
            "invariant_ref": "product-expectations-remain-recoverable",
            "disposition": "upheld",
            "reason": "具体文件目标及缺失数据边界有持久规则，完成声明不扩大到部署或历史路径恢复。",
            "fact_refs": [
              "FACT-20260905-002-003"
            ],
            "evidence": [
              "arckit/interaction/chat-workspace/interaction.md",
              "arckit/debug/chat-file-change-display/diagnosis.md"
            ],
            "gap_refs": []
          },
          {
            "invariant_ref": "interaction-expectations-remain-recoverable",
            "disposition": "upheld",
            "reason": "具体目标、多文件与长路径、无路径回退和原位更新规则与最终实现、线框一致。",
            "fact_refs": [
              "FACT-20260905-002-003"
            ],
            "evidence": [
              "arckit/interaction/chat-workspace/interaction.md",
              "arckit/interaction/chat-workspace/default.html",
              "arckit/interaction/INDEX.md"
            ],
            "gap_refs": []
          },
          {
            "invariant_ref": "visual-language-remains-consistent",
            "disposition": "not_relevant",
            "reason": "文件目标内容修复未改变主题、样式、布局或平台呈现规则。",
            "fact_refs": [],
            "evidence": [],
            "gap_refs": []
          },
          {
            "invariant_ref": "technical-decisions-remain-explainable",
            "disposition": "upheld",
            "reason": "最终实现保留 Chat 投影、messages 持久化及共享 Conversation Surface 的既有所有权边界。",
            "fact_refs": [
              "FACT-20260905-002-003"
            ],
            "evidence": [
              "arckit/tech/arcorbit/desktop-execution-solution.md",
              "runtime/arcorbit/src/chat-coordinator.mjs"
            ],
            "gap_refs": []
          },
          {
            "invariant_ref": "accepted-facts-are-realized",
            "disposition": "upheld",
            "reason": "最终代码与已接受的文件目标事实一致，真实组件的生命周期回归支持该结论。",
            "fact_refs": [
              "FACT-20260905-002-003"
            ],
            "evidence": [
              "runtime/arcorbit/test/chat-coordinator.test.mjs",
              "arckit/debug/chat-file-change-display/reproduce.mjs",
              "arckit/debug/chat-file-change-display/diagnosis.md"
            ],
            "gap_refs": []
          },
          {
            "invariant_ref": "material-risks-have-credible-evidence",
            "disposition": "upheld",
            "reason": "有针对性的边界与持久化证据支持本次有限源码修复；没有宣称完成真实 Codex 或安装包 GUI 验收。",
            "fact_refs": [
              "FACT-20260905-002-003"
            ],
            "evidence": [
              "runtime/arcorbit/test/chat-coordinator.test.mjs",
              "runtime/arcorbit/test/token-usage-projector.test.mjs",
              "arckit/debug/chat-file-change-display/diagnosis.md"
            ],
            "gap_refs": []
          }
        ]
      },
      "evidence": [
        "本轮只读审查最终代码、测试及交互文档 diff。",
        "runtime/arcorbit/desktop/renderer/conversation-surface.mjs",
        "arckit/debug/chat-file-change-display/diagnosis.md",
        "已接受验证：94 项相关测试通过；原复现四阶段路径可见；语法和 diff 检查通过。"
      ],
      "runtime_result_ref": "arckit-runtime://runs/RUN-20260905-063424257Z-1d0b4228",
      "occurred_at": "2026-09-05T06:48:52.616Z"
    }
  ],
  "case_resolution": {
    "status": "resolved",
    "stage": "resolved",
    "satisfied": [
      "GAP-20260905-002-001",
      "GAP-20260905-002-002"
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
    "updated_at": "2026-09-05T06:48:52.616Z"
  }
}
```

## Round Notes

- Case history is canonical in Structured Record.rounds; keep prose notes exceptional.
