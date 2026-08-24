# 统一 Automation 与 Chat 的 Agent 消息体验

Case: CASE-20260824-004
Status: closed
Artifact Type: mixed
Selected Gap: none
Updated: 2026-08-24T10:51:13.623Z

## User Intent

在保留 Agent Loop 结构化输出契约及 Automation 侧栏机器信息的同时，让 Automation 人工介入时间线生成、投影、持久化并按原始 item 独立保留面向用户的 Agent 进度、判断和结果消息。

## Structured Record

```json
{
  "schema_version": "development-case-record/v5",
  "id": "CASE-20260824-004",
  "title": "统一 Automation 与 Chat 的 Agent 消息体验",
  "status": "closed",
  "artifact_type": "mixed",
  "created_at": "2026-08-24T10:28:39.518Z",
  "updated_at": "2026-08-24T10:51:13.623Z",
  "user_intent": "在保留 Agent Loop 结构化输出契约及 Automation 侧栏机器信息的同时，让 Automation 人工介入时间线生成、投影、持久化并按原始 item 独立保留面向用户的 Agent 进度、判断和结果消息。",
  "expected_outcome": "Automation 的实时执行、人工续接、跨 Run 聚合、历史只读、失败与恢复时间线均同时包含用户消息、独立 Agent 自然语言 item、非空 reasoning summary、Agent 结果和简洁工具活动；结构化 JSON 继续可靠供 Runtime、Case、Gap 和 ledger 使用且不作为聊天正文。",
  "project_state_ref": "arckit/project/state.record.json",
  "current_round": {
    "goal": "",
    "selected_gap": null
  },
  "facts": [
    {
      "id": "FACT-AUTOMATION-AGENT-MESSAGES-MISSING",
      "revision": 1,
      "status": "accepted",
      "statement": "近期两个真实 Automation Run 包含 104 条工具消息，但没有 Agent 自然语言过程消息；用户无法仅通过主时间线理解执行过程与判断依据。",
      "basis": "操作者提供的真实运行统计和当前验收反馈。",
      "evidence": [
        "Current operator input, 2026-08-24"
      ]
    },
    {
      "id": "FACT-AUTOMATION-AGENT-ITEMS-COLLAPSE",
      "revision": 1,
      "status": "superseded",
      "statement": "Automation Run Projector 对同一 turn 的所有 Agent message item 使用同一个 agent:<turn>:output 消息 ID，并跨 item 累加 agent_text；结构化 Agent Loop 结果随后也写入该 ID，因此同 turn 多条 Agent 消息会合并、覆盖或最终只留下 structured message。",
      "basis": "当前生产源码中的 delta、item completion、structured-result 投影和消息 ID 实现。",
      "evidence": [
        "runtime/arcorbit/src/projection/run-event-projector.mjs:193",
        "runtime/arcorbit/src/projection/run-event-projector.mjs:566",
        "runtime/arcorbit/src/projection/run-event-projector.mjs:585",
        "runtime/arcorbit/src/projection/run-event-projector.mjs:594",
        "runtime/arcorbit/src/projection/run-event-projector.mjs:617"
      ]
    },
    {
      "id": "FACT-AUTOMATION-MESSAGE-CONTRACT",
      "revision": 1,
      "status": "accepted",
      "statement": "既有长期交互与技术契约已经要求 Automation 主时间线保留用户、Agent、reasoning、工具和权限消息，Agent 自然语言进度与结果使用主要消息样式，结构化 Loop/Case/Gap/ledger 信息留在侧栏，并以稳定 item 边界持久化。",
      "basis": "已维护的 Automation 交互规格和 Desktop 执行技术方案。",
      "evidence": [
        "arckit/interaction/automation-workspace/interaction.md:75",
        "arckit/interaction/automation-workspace/interaction.md:76",
        "arckit/interaction/automation-workspace/interaction.md:78",
        "arckit/tech/arcorbit/desktop-execution-solution.md:83",
        "arckit/tech/arcorbit/desktop-execution-solution.md:85",
        "arckit/tech/arcorbit/desktop-execution-solution.md:91"
      ]
    },
    {
      "id": "FACT-AUTOMATION-REAL-CHAIN-TEST-GAP",
      "revision": 1,
      "status": "superseded",
      "statement": "现有测试覆盖共享 Conversation Surface、单个 reasoning item、单个 schema-bound Agent 输出及高频 delta 去重，但没有证明真实 Automation 事件链能产生并保留同 turn 多条自然语言 Agent item，同时独立保存结构化最终结果。",
      "basis": "当前 Renderer、Run Projector 与 Desktop Run Manager 测试覆盖范围。",
      "evidence": [
        "runtime/arcorbit/test/desktop-renderer.test.mjs:102",
        "runtime/arcorbit/test/token-usage-projector.test.mjs:109",
        "runtime/arcorbit/test/token-usage-projector.test.mjs:140",
        "runtime/arcorbit/test/desktop-run-manager.test.mjs:271"
      ]
    },
    {
      "id": "FACT-20260824-004-001",
      "revision": 1,
      "status": "accepted",
      "statement": "Automation Agent Loop 现在明确要求阶段性用户可读 commentary；Run Projector 按 Codex item_id 独立流式更新和持久化 Agent 消息，保留 thread/turn/item 归因，结构化最终结果不再覆盖自然语言 item，历史重载不会因工具活动上限淘汰 Agent 消息。",
      "basis": "生产源码修改、协议等价 app-server 事件链测试、Desktop 消息文件重载测试及 Electron 体验回归。",
      "evidence": [
        "runtime/arcorbit/src/agent-orchestrator.mjs:117",
        "runtime/arcorbit/src/projection/run-event-projector.mjs:194",
        "runtime/arcorbit/src/projection/run-event-projector.mjs:461",
        "runtime/arcorbit/src/projection/run-event-projector.mjs:607",
        "runtime/arcorbit/src/desktop-run-manager.mjs:230",
        "runtime/arcorbit/test/token-usage-projector.test.mjs:139",
        "runtime/arcorbit/test/desktop-run-manager.test.mjs:302"
      ]
    }
  ],
  "state_impacts": [
    {
      "id": "IMPACT-AUTOMATION-MESSAGE-PRODUCT",
      "fact_id": "FACT-AUTOMATION-AGENT-MESSAGES-MISSING",
      "fact_revision": 1,
      "target": {
        "kind": "software_decision",
        "ref": "product_capabilities",
        "revision": 24
      },
      "effect": "upheld",
      "reason": "Automation 现在具备主动 commentary 生成契约和 item 级消息保留能力，结构化执行能力保持完整。",
      "gap_ids": [],
      "evidence": [
        "runtime/arcorbit/src/agent-orchestrator.mjs:117",
        "runtime/arcorbit/src/projection/run-event-projector.mjs:607",
        "runtime/arcorbit/test/token-usage-projector.test.mjs:139"
      ]
    },
    {
      "id": "IMPACT-AUTOMATION-MESSAGE-INTERACTION",
      "fact_id": "FACT-AUTOMATION-AGENT-MESSAGES-MISSING",
      "fact_revision": 1,
      "target": {
        "kind": "software_decision",
        "ref": "experience_and_interaction",
        "revision": 37
      },
      "effect": "upheld",
      "reason": "用户消息、Agent commentary、Agent 结果和简洁工具活动可共存；机器信息继续由结构化类型隔离至侧栏。",
      "gap_ids": [],
      "evidence": [
        "runtime/arcorbit/src/agent-orchestrator.mjs:117",
        "runtime/arcorbit/src/projection/run-event-projector.mjs:607",
        "runtime/arcorbit/test/desktop-renderer.test.mjs:102",
        "runtime/arcorbit/test/token-usage-projector.test.mjs:139"
      ]
    },
    {
      "id": "IMPACT-AUTOMATION-MESSAGE-TECH",
      "fact_id": "FACT-20260824-004-001",
      "fact_revision": 1,
      "target": {
        "kind": "software_decision",
        "ref": "technical_foundation",
        "revision": 31
      },
      "effect": "upheld",
      "reason": "消息身份、streaming upsert、structured result 和持久化重载现在均遵循独立 item 边界并携带运行归因。",
      "gap_ids": [],
      "evidence": [
        "runtime/arcorbit/src/projection/run-event-projector.mjs:194",
        "runtime/arcorbit/src/projection/run-event-projector.mjs:461",
        "runtime/arcorbit/src/projection/run-event-projector.mjs:607",
        "runtime/arcorbit/src/projection/run-event-projector.mjs:616",
        "runtime/arcorbit/src/desktop-run-manager.mjs:230"
      ]
    },
    {
      "id": "IMPACT-AUTOMATION-MESSAGE-REALIZATION",
      "fact_id": "FACT-AUTOMATION-AGENT-MESSAGES-MISSING",
      "fact_revision": 1,
      "target": {
        "kind": "software_invariant",
        "ref": "accepted-facts-are-realized",
        "revision": null
      },
      "effect": "upheld",
      "reason": "生产实现已兑现 Automation Agent 消息、reasoning 可见性、工具摘要和结构化结果隔离要求。",
      "gap_ids": [],
      "evidence": [
        "runtime/arcorbit/src/agent-orchestrator.mjs:117",
        "runtime/arcorbit/src/projection/run-event-projector.mjs:607",
        "runtime/arcorbit/test/token-usage-projector.test.mjs:139",
        "runtime/arcorbit/test/desktop-run-manager.test.mjs:302"
      ]
    },
    {
      "id": "IMPACT-AUTOMATION-MESSAGE-EVIDENCE",
      "fact_id": "FACT-20260824-004-001",
      "fact_revision": 1,
      "target": {
        "kind": "software_invariant",
        "ref": "material-risks-have-credible-evidence",
        "revision": null
      },
      "effect": "upheld",
      "reason": "协议等价 Automation 事件已通过真实 Run Manager event、消息文件及重启重载路径，Electron 体验回归也单独通过。",
      "gap_ids": [],
      "evidence": [
        "runtime/arcorbit/test/token-usage-projector.test.mjs:139",
        "runtime/arcorbit/test/desktop-run-manager.test.mjs:302",
        "runtime/arcorbit/test/coherent-agent-loop.test.mjs:110",
        "Verification: 85 targeted tests passed, 0 failed, 2026-08-24",
        "Verification: Electron experience realization test passed outside sandbox, 2026-08-24"
      ]
    }
  ],
  "gaps": [
    {
      "id": "GAP-AUTOMATION-AGENT-MESSAGE-PARITY",
      "status": "resolved",
      "goal": "实现并验证 Automation 面向用户的 Agent commentary 端到端消息链：主动生成可读过程说明，按 thread/turn/item 独立流式投影和持久化，跨 Run 与恢复场景保持顺序和身份，同时将结构化最终结果及 Loop/Case/Gap/ledger 信息继续隔离到机器契约和侧栏。",
      "reason": "真实运行已证明主时间线被工具活动主导，源码已证明 turn 级 Agent 消息 ID 会合并或覆盖 item；修复必须同时覆盖生成、事件投影、持久化、聚合和真实链路验收，单独复用 UI 组件不能解决问题。",
      "derived_from": [
        "case_intent",
        "FACT-AUTOMATION-AGENT-MESSAGES-MISSING",
        "FACT-AUTOMATION-AGENT-ITEMS-COLLAPSE",
        "FACT-AUTOMATION-MESSAGE-CONTRACT",
        "FACT-AUTOMATION-REAL-CHAIN-TEST-GAP"
      ],
      "blocked_by": [],
      "priority_basis": {
        "blocking": "high",
        "uncertainty": "medium",
        "risk": "high",
        "user_impact": "high"
      },
      "responsibility": "agent",
      "evidence_required": [
        "真实或协议等价的 Automation app-server 事件链证明同一 turn 的多条 agentMessage item 分别保留，并与工具 item 和结构化最终结果共存。",
        "实时 delta、item completed、持久化重载、跨 Run 聚合、人工续接、失败与恢复、历史只读场景的自动化测试。",
        "证明结构化 Agent Loop Schema、trusted ledger 推进、Gate、验证和侧栏投影未被削弱或转成聊天正文。",
        "证明 reasoning_output_tokens 不创建思考消息，只有 Codex 提供的非空 reasoning summary 才进入时间线。",
        "同类 Chat 与 Automation fixture 对比，确认 Automation 主时间线不再出现长时间仅有连续工具活动的消息结构。"
      ],
      "resolution": {
        "id": "GAP-AUTOMATION-AGENT-MESSAGE-PARITY",
        "status": "resolved",
        "outcome": "Automation Agent commentary 端到端消息链已实现，并通过协议等价事件、持久化重载、reasoning 边界、共享呈现和 Electron 体验回归验证。",
        "reason": "Agent Loop 现在明确要求阶段性 commentary；投影使用 item_id 身份，structured result 不再覆盖自然语言消息，历史重载保留全部 Agent item。",
        "evidence": [
          "runtime/arcorbit/src/agent-orchestrator.mjs:117",
          "runtime/arcorbit/src/projection/run-event-projector.mjs:194",
          "runtime/arcorbit/src/projection/run-event-projector.mjs:475",
          "runtime/arcorbit/src/projection/run-event-projector.mjs:607",
          "runtime/arcorbit/src/projection/run-event-projector.mjs:616",
          "runtime/arcorbit/src/desktop-run-manager.mjs:230",
          "runtime/arcorbit/test/token-usage-projector.test.mjs:139",
          "runtime/arcorbit/test/desktop-run-manager.test.mjs:302",
          "Verification: 85 targeted tests passed, 0 failed, 2026-08-24",
          "Verification: full Node suite 368 passed, 7 skipped; sandbox-blocked Electron test passed separately outside sandbox, 2026-08-24"
        ],
        "occurred_at": "2026-08-24T10:40:30.158Z"
      }
    },
    {
      "id": "CASE-20260824-004:review-finding:FINDING-20260824-004-001",
      "status": "resolved",
      "goal": "Resolve review finding: 新增测试证明了单个 Automation Run 内多条 Agent item、工具和 structured result 共存，以及消息文件重载，但没有按 Case 验收要求直接验证跨 Run 聚合、人工介入后续接、失败后恢复、历史只读审查和同类 Chat/Automation 事件链对比；这些边界目前主要依赖代码检查和相邻测试，回归证据不完整。",
      "reason": "omission found by completion review",
      "derived_from": [
        "completion_review",
        "content_revision:1"
      ],
      "blocked_by": [],
      "priority_basis": {
        "blocking": "high",
        "risk": "high"
      },
      "responsibility": "agent",
      "evidence_required": [
        "runtime/arcorbit/test/token-usage-projector.test.mjs",
        "runtime/arcorbit/test/desktop-run-manager.test.mjs",
        "runtime/arcorbit/test/desktop-renderer.test.mjs",
        "runtime/arcorbit/desktop/renderer/renderer.js",
        "runtime/arcorbit/test/token-usage-projector.test.mjs:139",
        "runtime/arcorbit/test/desktop-run-manager.test.mjs:302",
        "runtime/arcorbit/desktop/renderer/renderer.js:2898",
        "runtime/arcorbit/desktop/renderer/renderer.js:2910",
        "runtime/arcorbit/desktop/renderer/renderer.js:2923",
        "Independent review: the new event-chain test creates one Run and reloads it after restart; no added assertion exercises multiple Runs, intervention continuation, failed/recovered Runs, or equivalent Chat and Automation fixtures, 2026-08-24"
      ],
      "resolution": {
        "id": "CASE-20260824-004:review-finding:FINDING-20260824-004-001",
        "status": "resolved",
        "outcome": "Review Finding 已解决：Automation transcript 的跨场景消息保留和 Chat 对等性现在由生产路径使用的纯聚合函数及协议等价 fixture 直接验证。",
        "reason": "Renderer 原有跨 Run 合并逻辑被等价抽取为 mergeAutomationTranscript，并继续由 loadTranscript 调用。测试同时构造失败 Run、人工续接消息和恢复 Run，证明相同 item_id 在不同 Run 中独立保留、历史重建与实时结果一致、结构化结果保持独立、其他任务被隔离，且 Chat 与 Automation 的用户/Agent/工具/结果消息获得相同可见类型。",
        "evidence": [
          "runtime/arcorbit/src/desktop/transcript-presentation.mjs:35",
          "runtime/arcorbit/desktop/renderer/renderer.js:2910",
          "runtime/arcorbit/test/desktop-renderer.test.mjs:1367",
          "runtime/arcorbit/test/desktop-renderer.test.mjs:1391",
          "runtime/arcorbit/test/desktop-renderer.test.mjs:1394",
          "runtime/arcorbit/test/desktop-renderer.test.mjs:1411",
          "Verification: affected Automation, Chat, recovery, projector and Renderer suites — 128 passed, 0 failed, 2026-08-24",
          "Verification: npm run check — 369 passed, 7 environment-gated skips, only sandbox-blocked Electron launch failed, 2026-08-24",
          "Verification: experience-realization-electron.test.mjs passed outside sandbox, 2026-08-24",
          "Verification: git diff --check passed, 2026-08-24"
        ],
        "occurred_at": "2026-08-24T10:48:43.071Z"
      }
    }
  ],
  "content_revision": 2,
  "completion_review": {
    "status": "clean",
    "policy": {
      "initial_max_cycles": 10,
      "source": "runtime/arcorbit/config/case-policy.json",
      "snapshotted_at": "2026-08-24T10:28:39.518Z"
    },
    "additional_cycles_authorized": 0,
    "cycle_count": 2,
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
        "outcome": "findings",
        "content_revision": 1,
        "dimensions": {
          "implementation_correctness": "clean",
          "problem_resolution": "clean",
          "verification_credibility": "findings",
          "regression_risk": "findings",
          "minimality": "clean"
        },
        "finding_ids": [
          "FINDING-20260824-004-001"
        ],
        "evidence": [
          "git diff --check passed, 2026-08-24",
          "Independent targeted verification: 85 tests passed, 0 failed, 2026-08-24",
          "runtime/arcorbit/src/projection/run-event-projector.mjs:193",
          "runtime/arcorbit/src/projection/run-event-projector.mjs:584",
          "runtime/arcorbit/src/projection/run-event-projector.mjs:607",
          "runtime/arcorbit/src/projection/run-event-projector.mjs:616",
          "runtime/arcorbit/src/desktop-run-manager.mjs:241",
          "runtime/arcorbit/desktop/renderer/renderer.js:2910",
          "runtime/arcorbit/test/token-usage-projector.test.mjs:139",
          "runtime/arcorbit/test/desktop-run-manager.test.mjs:302"
        ],
        "occurred_at": "2026-08-24T10:43:47.339Z"
      },
      {
        "cycle": 2,
        "autonomous_cycle": 2,
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
          "runtime/arcorbit/src/agent-orchestrator.mjs:117",
          "runtime/arcorbit/src/projection/run-event-projector.mjs:607",
          "runtime/arcorbit/src/projection/run-event-projector.mjs:616",
          "runtime/arcorbit/src/desktop-run-manager.mjs:241",
          "runtime/arcorbit/src/desktop/transcript-presentation.mjs:35",
          "runtime/arcorbit/desktop/renderer/renderer.js:2910",
          "runtime/arcorbit/test/coherent-agent-loop.test.mjs:110",
          "runtime/arcorbit/test/token-usage-projector.test.mjs:139",
          "runtime/arcorbit/test/token-usage-projector.test.mjs:188",
          "runtime/arcorbit/test/desktop-run-manager.test.mjs:302",
          "runtime/arcorbit/test/desktop-renderer.test.mjs:1367",
          "runtime/arcorbit/test/desktop-renderer.test.mjs:1391",
          "runtime/arcorbit/test/desktop-renderer.test.mjs:1394",
          "runtime/arcorbit/test/desktop-renderer.test.mjs:1411",
          "Independent Completion Review verification: affected Automation, Chat, recovery, projector and Renderer suites — 128 passed, 0 failed, 2026-08-24",
          "Verification: git diff --check passed, 2026-08-24",
          "Verification: npm run check — 369 passed, 7 environment-gated skips, only sandbox-blocked Electron launch failed; experience-realization-electron.test.mjs passed outside sandbox, 2026-08-24"
        ],
        "occurred_at": "2026-08-24T10:51:13.623Z"
      }
    ],
    "evidence": [
      "git diff --check passed, 2026-08-24",
      "Independent targeted verification: 85 tests passed, 0 failed, 2026-08-24",
      "runtime/arcorbit/src/projection/run-event-projector.mjs:193",
      "runtime/arcorbit/src/projection/run-event-projector.mjs:584",
      "runtime/arcorbit/src/projection/run-event-projector.mjs:607",
      "runtime/arcorbit/src/projection/run-event-projector.mjs:616",
      "runtime/arcorbit/src/desktop-run-manager.mjs:241",
      "runtime/arcorbit/desktop/renderer/renderer.js:2910",
      "runtime/arcorbit/test/token-usage-projector.test.mjs:139",
      "runtime/arcorbit/test/desktop-run-manager.test.mjs:302",
      "runtime/arcorbit/src/agent-orchestrator.mjs:117",
      "runtime/arcorbit/src/desktop/transcript-presentation.mjs:35",
      "runtime/arcorbit/test/coherent-agent-loop.test.mjs:110",
      "runtime/arcorbit/test/token-usage-projector.test.mjs:188",
      "runtime/arcorbit/test/desktop-renderer.test.mjs:1367",
      "runtime/arcorbit/test/desktop-renderer.test.mjs:1391",
      "runtime/arcorbit/test/desktop-renderer.test.mjs:1394",
      "runtime/arcorbit/test/desktop-renderer.test.mjs:1411",
      "Independent Completion Review verification: affected Automation, Chat, recovery, projector and Renderer suites — 128 passed, 0 failed, 2026-08-24",
      "Verification: git diff --check passed, 2026-08-24",
      "Verification: npm run check — 369 passed, 7 environment-gated skips, only sandbox-blocked Electron launch failed; experience-realization-electron.test.mjs passed outside sandbox, 2026-08-24"
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
      "goal": "修复并验证 Automation Agent commentary 的生成、item 级投影、持久化重载和结构化结果隔离。",
      "outcome": "completed",
      "gap_selection": {
        "mode": "candidate",
        "basis": "Fresh snapshot 中该 Case Gap 是唯一 ready 且直接阻塞当前项目焦点的候选。",
        "snapshot_token": "77074118978886c0951c1ce022ac18140aa5d38d99c72fa2d9592cca80b6ea12",
        "selected_ref": "case-gap:CASE-20260824-004:GAP-AUTOMATION-AGENT-MESSAGE-PARITY",
        "comparison_summary": "比较了全部五个 persisted candidates。Automation Agent 消息 Gap 具有最高直接用户影响且已 ready；其余四项均需独立 Case。",
        "fresh_discovery_summary": "实现与验证未发现会改变本轮选择、范围或验收方式的更高优先级 fresh candidate。",
        "considered": [
          {
            "ref": "project-gap:GAP-agent-scenario-evaluation",
            "source": "persisted",
            "eligibility": "case_required",
            "disposition": "deferred",
            "priority_basis": {
              "blocking": "medium",
              "uncertainty": "high",
              "risk": "high",
              "user_impact": "medium"
            },
            "reason": "需独立 Case，且不直接修复当前 Automation 消息缺失。"
          },
          {
            "ref": "project-gap:GAP-runtime-resilience-and-adapters",
            "source": "persisted",
            "eligibility": "case_required",
            "disposition": "deferred",
            "priority_basis": {
              "blocking": "medium",
              "uncertainty": "medium",
              "risk": "high",
              "user_impact": "medium"
            },
            "reason": "通用 Runtime 韧性工作需独立推进。"
          },
          {
            "ref": "project-gap:GAP-security-real-project-validation",
            "source": "persisted",
            "eligibility": "case_required",
            "disposition": "deferred",
            "priority_basis": {
              "blocking": "medium",
              "uncertainty": "medium",
              "risk": "high",
              "user_impact": "medium"
            },
            "reason": "真实权限项目验证需要独立受控环境。"
          },
          {
            "ref": "project-gap:GAP-cross-record-audit",
            "source": "persisted",
            "eligibility": "case_required",
            "disposition": "deferred",
            "priority_basis": {
              "blocking": "medium",
              "uncertainty": "medium",
              "risk": "high",
              "user_impact": "medium"
            },
            "reason": "跨记录审计需独立 Case，且不阻塞当前消息修复。"
          },
          {
            "ref": "case-gap:CASE-20260824-004:GAP-AUTOMATION-AGENT-MESSAGE-PARITY",
            "source": "persisted",
            "eligibility": "ready",
            "disposition": "selected",
            "priority_basis": {
              "blocking": "high",
              "uncertainty": "medium",
              "risk": "high",
              "user_impact": "high"
            },
            "reason": "直接修复真实 Run 中工具消息占主导、Agent 自然语言消息缺失及同 turn item 覆盖问题。"
          }
        ]
      },
      "selected_gap": {
        "id": "GAP-AUTOMATION-AGENT-MESSAGE-PARITY",
        "responsibility": "agent",
        "goal": "实现并验证 Automation 面向用户的 Agent commentary 端到端消息链：主动生成可读过程说明，按 thread/turn/item 独立流式投影和持久化，跨 Run 与恢复场景保持顺序和身份，同时将结构化最终结果及 Loop/Case/Gap/ledger 信息继续隔离到机器契约和侧栏。",
        "reason": "真实运行已证明主时间线被工具活动主导，源码已证明 turn 级 Agent 消息 ID 会合并或覆盖 item；修复必须同时覆盖生成、事件投影、持久化、聚合和真实链路验收，单独复用 UI 组件不能解决问题。",
        "derived_from": [
          "case_intent",
          "FACT-AUTOMATION-AGENT-MESSAGES-MISSING",
          "FACT-AUTOMATION-AGENT-ITEMS-COLLAPSE",
          "FACT-AUTOMATION-MESSAGE-CONTRACT",
          "FACT-AUTOMATION-REAL-CHAIN-TEST-GAP"
        ],
        "blocked_by": [],
        "priority_basis": {
          "blocking": "high",
          "uncertainty": "medium",
          "risk": "high",
          "user_impact": "high"
        },
        "evidence_required": [
          "真实或协议等价的 Automation app-server 事件链证明同一 turn 的多条 agentMessage item 分别保留，并与工具 item 和结构化最终结果共存。",
          "实时 delta、item completed、持久化重载、跨 Run 聚合、人工续接、失败与恢复、历史只读场景的自动化测试。",
          "证明结构化 Agent Loop Schema、trusted ledger 推进、Gate、验证和侧栏投影未被削弱或转成聊天正文。",
          "证明 reasoning_output_tokens 不创建思考消息，只有 Codex 提供的非空 reasoning summary 才进入时间线。",
          "同类 Chat 与 Automation fixture 对比，确认 Automation 主时间线不再出现长时间仅有连续工具活动的消息结构。"
        ]
      },
      "planned_transition": {
        "goal": "修复并验证 Automation Agent commentary 的生成、item 级投影、持久化重载和结构化结果隔离。",
        "expected_state_change": "每个 agentMessage item 以独立身份进入时间线并跨重载保留；结构化 Agent Loop JSON 继续作为独立机器结果。"
      },
      "accepted_state_delta": {
        "resolved_gap": {
          "id": "GAP-AUTOMATION-AGENT-MESSAGE-PARITY",
          "status": "resolved",
          "outcome": "Automation Agent commentary 端到端消息链已实现，并通过协议等价事件、持久化重载、reasoning 边界、共享呈现和 Electron 体验回归验证。",
          "reason": "Agent Loop 现在明确要求阶段性 commentary；投影使用 item_id 身份，structured result 不再覆盖自然语言消息，历史重载保留全部 Agent item。",
          "evidence": [
            "runtime/arcorbit/src/agent-orchestrator.mjs:117",
            "runtime/arcorbit/src/projection/run-event-projector.mjs:194",
            "runtime/arcorbit/src/projection/run-event-projector.mjs:475",
            "runtime/arcorbit/src/projection/run-event-projector.mjs:607",
            "runtime/arcorbit/src/projection/run-event-projector.mjs:616",
            "runtime/arcorbit/src/desktop-run-manager.mjs:230",
            "runtime/arcorbit/test/token-usage-projector.test.mjs:139",
            "runtime/arcorbit/test/desktop-run-manager.test.mjs:302",
            "Verification: 85 targeted tests passed, 0 failed, 2026-08-24",
            "Verification: full Node suite 368 passed, 7 skipped; sandbox-blocked Electron test passed separately outside sandbox, 2026-08-24"
          ]
        },
        "facts_added": [
          {
            "id": "FACT-20260824-004-001",
            "revision": 1,
            "status": "accepted",
            "statement": "Automation Agent Loop 现在明确要求阶段性用户可读 commentary；Run Projector 按 Codex item_id 独立流式更新和持久化 Agent 消息，保留 thread/turn/item 归因，结构化最终结果不再覆盖自然语言 item，历史重载不会因工具活动上限淘汰 Agent 消息。",
            "basis": "生产源码修改、协议等价 app-server 事件链测试、Desktop 消息文件重载测试及 Electron 体验回归。",
            "evidence": [
              "runtime/arcorbit/src/agent-orchestrator.mjs:117",
              "runtime/arcorbit/src/projection/run-event-projector.mjs:194",
              "runtime/arcorbit/src/projection/run-event-projector.mjs:461",
              "runtime/arcorbit/src/projection/run-event-projector.mjs:607",
              "runtime/arcorbit/src/desktop-run-manager.mjs:230",
              "runtime/arcorbit/test/token-usage-projector.test.mjs:139",
              "runtime/arcorbit/test/desktop-run-manager.test.mjs:302"
            ]
          }
        ],
        "facts_superseded": [
          {
            "id": "FACT-AUTOMATION-AGENT-ITEMS-COLLAPSE",
            "revision": 1,
            "reason": "生产 projector 已从 turn 级 Agent output ID 改为 item_id 身份，structured result 不再覆盖普通 Agent item。",
            "evidence": [
              "runtime/arcorbit/src/projection/run-event-projector.mjs:607",
              "runtime/arcorbit/src/projection/run-event-projector.mjs:616",
              "runtime/arcorbit/test/token-usage-projector.test.mjs:139"
            ]
          },
          {
            "id": "FACT-AUTOMATION-REAL-CHAIN-TEST-GAP",
            "revision": 1,
            "reason": "新增测试已覆盖多 Agent item、工具与 structured result 共存、reasoning token 边界及持久化重载。",
            "evidence": [
              "runtime/arcorbit/test/token-usage-projector.test.mjs:139",
              "runtime/arcorbit/test/token-usage-projector.test.mjs:188",
              "runtime/arcorbit/test/token-usage-projector.test.mjs:200",
              "runtime/arcorbit/test/desktop-run-manager.test.mjs:302",
              "Verification: 85 targeted tests passed, 0 failed, 2026-08-24"
            ]
          }
        ],
        "impacts_added": [],
        "impacts_updated": [
          {
            "id": "IMPACT-AUTOMATION-MESSAGE-PRODUCT",
            "fact_id": "FACT-AUTOMATION-AGENT-MESSAGES-MISSING",
            "fact_revision": 1,
            "target": {
              "kind": "software_decision",
              "ref": "product_capabilities",
              "revision": 24
            },
            "effect": "upheld",
            "reason": "Automation 现在具备主动 commentary 生成契约和 item 级消息保留能力，结构化执行能力保持完整。",
            "gap_ids": [],
            "evidence": [
              "runtime/arcorbit/src/agent-orchestrator.mjs:117",
              "runtime/arcorbit/src/projection/run-event-projector.mjs:607",
              "runtime/arcorbit/test/token-usage-projector.test.mjs:139"
            ]
          },
          {
            "id": "IMPACT-AUTOMATION-MESSAGE-INTERACTION",
            "fact_id": "FACT-AUTOMATION-AGENT-MESSAGES-MISSING",
            "fact_revision": 1,
            "target": {
              "kind": "software_decision",
              "ref": "experience_and_interaction",
              "revision": 37
            },
            "effect": "upheld",
            "reason": "用户消息、Agent commentary、Agent 结果和简洁工具活动可共存；机器信息继续由结构化类型隔离至侧栏。",
            "gap_ids": [],
            "evidence": [
              "runtime/arcorbit/src/agent-orchestrator.mjs:117",
              "runtime/arcorbit/src/projection/run-event-projector.mjs:607",
              "runtime/arcorbit/test/desktop-renderer.test.mjs:102",
              "runtime/arcorbit/test/token-usage-projector.test.mjs:139"
            ]
          },
          {
            "id": "IMPACT-AUTOMATION-MESSAGE-TECH",
            "fact_id": "FACT-20260824-004-001",
            "fact_revision": 1,
            "target": {
              "kind": "software_decision",
              "ref": "technical_foundation",
              "revision": 31
            },
            "effect": "upheld",
            "reason": "消息身份、streaming upsert、structured result 和持久化重载现在均遵循独立 item 边界并携带运行归因。",
            "gap_ids": [],
            "evidence": [
              "runtime/arcorbit/src/projection/run-event-projector.mjs:194",
              "runtime/arcorbit/src/projection/run-event-projector.mjs:461",
              "runtime/arcorbit/src/projection/run-event-projector.mjs:607",
              "runtime/arcorbit/src/projection/run-event-projector.mjs:616",
              "runtime/arcorbit/src/desktop-run-manager.mjs:230"
            ]
          },
          {
            "id": "IMPACT-AUTOMATION-MESSAGE-REALIZATION",
            "fact_id": "FACT-AUTOMATION-AGENT-MESSAGES-MISSING",
            "fact_revision": 1,
            "target": {
              "kind": "software_invariant",
              "ref": "accepted-facts-are-realized",
              "revision": null
            },
            "effect": "upheld",
            "reason": "生产实现已兑现 Automation Agent 消息、reasoning 可见性、工具摘要和结构化结果隔离要求。",
            "gap_ids": [],
            "evidence": [
              "runtime/arcorbit/src/agent-orchestrator.mjs:117",
              "runtime/arcorbit/src/projection/run-event-projector.mjs:607",
              "runtime/arcorbit/test/token-usage-projector.test.mjs:139",
              "runtime/arcorbit/test/desktop-run-manager.test.mjs:302"
            ]
          },
          {
            "id": "IMPACT-AUTOMATION-MESSAGE-EVIDENCE",
            "fact_id": "FACT-20260824-004-001",
            "fact_revision": 1,
            "target": {
              "kind": "software_invariant",
              "ref": "material-risks-have-credible-evidence",
              "revision": null
            },
            "effect": "upheld",
            "reason": "协议等价 Automation 事件已通过真实 Run Manager event、消息文件及重启重载路径，Electron 体验回归也单独通过。",
            "gap_ids": [],
            "evidence": [
              "runtime/arcorbit/test/token-usage-projector.test.mjs:139",
              "runtime/arcorbit/test/desktop-run-manager.test.mjs:302",
              "runtime/arcorbit/test/coherent-agent-loop.test.mjs:110",
              "Verification: 85 targeted tests passed, 0 failed, 2026-08-24",
              "Verification: Electron experience realization test passed outside sandbox, 2026-08-24"
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
        "project_revision": 210,
        "judgments": [
          {
            "invariant_ref": "product-expectations-remain-recoverable",
            "disposition": "upheld",
            "reason": "既有规格准确要求 Automation 与 Chat 对等的信息密度、结构化契约隔离和逐 item 保留，生产实现现已兑现。",
            "fact_refs": [
              "FACT-AUTOMATION-MESSAGE-CONTRACT",
              "FACT-20260824-004-001"
            ],
            "evidence": [
              "arckit/spec/agentic-software-development/runtime-automation-workspace.md",
              "arckit/spec/agentic-software-development/arcorbit-planned-workspaces.md",
              "runtime/arcorbit/src/agent-orchestrator.mjs:117"
            ],
            "gap_refs": []
          },
          {
            "invariant_ref": "interaction-expectations-remain-recoverable",
            "disposition": "upheld",
            "reason": "主时间线、侧栏分工、非空 reasoning、单行工具和 Agent 自然语言进度仍由既有交互文档完整定义。",
            "fact_refs": [
              "FACT-AUTOMATION-MESSAGE-CONTRACT",
              "FACT-20260824-004-001"
            ],
            "evidence": [
              "arckit/interaction/automation-workspace/interaction.md:75",
              "arckit/interaction/automation-workspace/interaction.md:78",
              "arckit/interaction/automation-workspace/interaction.md:79",
              "arckit/interaction/automation-workspace/interaction.md:81"
            ],
            "gap_refs": []
          },
          {
            "invariant_ref": "visual-language-remains-consistent",
            "disposition": "not_relevant",
            "reason": "本轮未改变 Conversation Surface 样式、Design Tokens 或视觉呈现规则。",
            "fact_refs": [],
            "evidence": [],
            "gap_refs": []
          },
          {
            "invariant_ref": "technical-decisions-remain-explainable",
            "disposition": "upheld",
            "reason": "item_id 是消息身份，turn/thread/run 是归因，structured result 是独立机器对象；责任分层与长期技术方案一致。",
            "fact_refs": [
              "FACT-AUTOMATION-MESSAGE-CONTRACT",
              "FACT-20260824-004-001"
            ],
            "evidence": [
              "arckit/tech/arcorbit/desktop-execution-solution.md:83",
              "arckit/tech/arcorbit/desktop-execution-solution.md:85",
              "runtime/arcorbit/src/projection/run-event-projector.mjs:607",
              "runtime/arcorbit/src/projection/run-event-projector.mjs:616",
              "runtime/arcorbit/src/desktop-run-manager.mjs:230"
            ],
            "gap_refs": []
          },
          {
            "invariant_ref": "accepted-facts-are-realized",
            "disposition": "upheld",
            "reason": "源码和协议等价事件链证明每条 Agent item 独立保留，structured JSON 不进入普通正文，reasoning token 数量不生成虚假思考消息。",
            "fact_refs": [
              "FACT-20260824-004-001"
            ],
            "evidence": [
              "runtime/arcorbit/test/token-usage-projector.test.mjs:139",
              "runtime/arcorbit/test/token-usage-projector.test.mjs:188",
              "runtime/arcorbit/test/desktop-run-manager.test.mjs:302",
              "Verification: 85 targeted tests passed, 0 failed, 2026-08-24"
            ],
            "gap_refs": []
          },
          {
            "invariant_ref": "material-risks-have-credible-evidence",
            "disposition": "upheld",
            "reason": "风险边界由 prompt、projector、reasoning、持久化重载、完整 Node 套件和 Electron 体验回归的多层证据覆盖。",
            "fact_refs": [
              "FACT-20260824-004-001"
            ],
            "evidence": [
              "runtime/arcorbit/test/coherent-agent-loop.test.mjs:110",
              "runtime/arcorbit/test/token-usage-projector.test.mjs:139",
              "runtime/arcorbit/test/desktop-run-manager.test.mjs:302",
              "Verification: full Node suite 368 passed and 7 skipped aside from sandbox-blocked Electron process; Electron test passed separately outside sandbox, 2026-08-24"
            ],
            "gap_refs": []
          }
        ]
      },
      "evidence": [
        "runtime/arcorbit/src/agent-orchestrator.mjs:117",
        "runtime/arcorbit/src/projection/run-event-projector.mjs:194",
        "runtime/arcorbit/src/projection/run-event-projector.mjs:475",
        "runtime/arcorbit/src/projection/run-event-projector.mjs:607",
        "runtime/arcorbit/src/projection/run-event-projector.mjs:616",
        "runtime/arcorbit/src/desktop-run-manager.mjs:230",
        "runtime/arcorbit/test/coherent-agent-loop.test.mjs:110",
        "runtime/arcorbit/test/token-usage-projector.test.mjs:139",
        "runtime/arcorbit/test/desktop-run-manager.test.mjs:302",
        "Verification: 85 targeted tests passed, 0 failed, 2026-08-24",
        "Verification: Electron experience realization test passed outside sandbox, 2026-08-24"
      ],
      "runtime_result_ref": "arckit-runtime://runs/RUN-20260824-102529512Z",
      "occurred_at": "2026-08-24T10:40:30.158Z"
    },
    {
      "round": 2,
      "transition_schema_version": "arckit-case-transition/v8",
      "goal": "独立审查 content revision 1 的实现与验证证据。",
      "outcome": "completed",
      "gap_selection": {
        "mode": "candidate",
        "basis": "Fresh post-commit snapshot 中 Completion Review 是该 Case 唯一 ready 候选；所有普通 Gap 和 impact 已关闭。",
        "snapshot_token": "95a2a62f5278a8a26ddc39cbcadf19520ca6a1c968d9e890298bee2e49df0af0",
        "selected_ref": "case-gap:CASE-20260824-004:CASE-20260824-004:completion-review:1",
        "comparison_summary": "比较了 snapshot 中全部五个 persisted candidates。Completion Review 直接阻塞当前 Case 收尾且已 ready；其余四个 Project Gap 均需独立 Case。",
        "fresh_discovery_summary": "审查发现自动化测试场景覆盖不完整，并将其作为 Completion Review finding 提交；该下游修复必须等待 writeback 后的 fresh snapshot，不能在本轮继续执行。",
        "considered": [
          {
            "ref": "project-gap:GAP-agent-scenario-evaluation",
            "source": "persisted",
            "eligibility": "case_required",
            "disposition": "deferred",
            "priority_basis": {
              "blocking": "medium",
              "uncertainty": "high",
              "risk": "high",
              "user_impact": "medium"
            },
            "reason": "需要独立 Case，不属于当前实现的 Completion Review。"
          },
          {
            "ref": "project-gap:GAP-runtime-resilience-and-adapters",
            "source": "persisted",
            "eligibility": "case_required",
            "disposition": "deferred",
            "priority_basis": {
              "blocking": "medium",
              "uncertainty": "medium",
              "risk": "high",
              "user_impact": "medium"
            },
            "reason": "通用 Runtime 韧性工作需要独立 Case。"
          },
          {
            "ref": "project-gap:GAP-security-real-project-validation",
            "source": "persisted",
            "eligibility": "case_required",
            "disposition": "deferred",
            "priority_basis": {
              "blocking": "medium",
              "uncertainty": "medium",
              "risk": "high",
              "user_impact": "medium"
            },
            "reason": "真实权限项目验证需要独立受控 Case。"
          },
          {
            "ref": "project-gap:GAP-cross-record-audit",
            "source": "persisted",
            "eligibility": "case_required",
            "disposition": "deferred",
            "priority_basis": {
              "blocking": "medium",
              "uncertainty": "medium",
              "risk": "high",
              "user_impact": "medium"
            },
            "reason": "跨记录审计不属于当前 Case 的实现审查。"
          },
          {
            "ref": "case-gap:CASE-20260824-004:CASE-20260824-004:completion-review:1",
            "source": "persisted",
            "eligibility": "ready",
            "disposition": "selected",
            "priority_basis": {
              "blocking": "high",
              "uncertainty": "low",
              "risk": "high",
              "user_impact": "high"
            },
            "reason": "所有普通工作已闭合，必须独立检查实现正确性、问题解决、验证可信度、回归风险和最小性。"
          }
        ]
      },
      "selected_gap": {
        "id": "CASE-20260824-004:completion-review:1",
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
        "goal": "独立审查 content revision 1 的实现与验证证据。",
        "expected_state_change": "记录 Completion Review finding，并由 Ledger 在下一轮派生普通修复 Gap。"
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
          "dimensions": {
            "implementation_correctness": "clean",
            "problem_resolution": "clean",
            "verification_credibility": "findings",
            "regression_risk": "findings",
            "minimality": "clean"
          },
          "findings": [
            {
              "id": "FINDING-20260824-004-001",
              "kind": "omission",
              "statement": "新增测试证明了单个 Automation Run 内多条 Agent item、工具和 structured result 共存，以及消息文件重载，但没有按 Case 验收要求直接验证跨 Run 聚合、人工介入后续接、失败后恢复、历史只读审查和同类 Chat/Automation 事件链对比；这些边界目前主要依赖代码检查和相邻测试，回归证据不完整。",
              "responsibility": "agent",
              "artifact_refs": [
                "runtime/arcorbit/test/token-usage-projector.test.mjs",
                "runtime/arcorbit/test/desktop-run-manager.test.mjs",
                "runtime/arcorbit/test/desktop-renderer.test.mjs",
                "runtime/arcorbit/desktop/renderer/renderer.js"
              ],
              "evidence": [
                "runtime/arcorbit/test/token-usage-projector.test.mjs:139",
                "runtime/arcorbit/test/desktop-run-manager.test.mjs:302",
                "runtime/arcorbit/desktop/renderer/renderer.js:2898",
                "runtime/arcorbit/desktop/renderer/renderer.js:2910",
                "runtime/arcorbit/desktop/renderer/renderer.js:2923",
                "Independent review: the new event-chain test creates one Run and reloads it after restart; no added assertion exercises multiple Runs, intervention continuation, failed/recovered Runs, or equivalent Chat and Automation fixtures, 2026-08-24"
              ]
            }
          ],
          "evidence": [
            "git diff --check passed, 2026-08-24",
            "Independent targeted verification: 85 tests passed, 0 failed, 2026-08-24",
            "runtime/arcorbit/src/projection/run-event-projector.mjs:193",
            "runtime/arcorbit/src/projection/run-event-projector.mjs:584",
            "runtime/arcorbit/src/projection/run-event-projector.mjs:607",
            "runtime/arcorbit/src/projection/run-event-projector.mjs:616",
            "runtime/arcorbit/src/desktop-run-manager.mjs:241",
            "runtime/arcorbit/desktop/renderer/renderer.js:2910",
            "runtime/arcorbit/test/token-usage-projector.test.mjs:139",
            "runtime/arcorbit/test/desktop-run-manager.test.mjs:302"
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
        "project_revision": 210,
        "judgments": [
          {
            "invariant_ref": "product-expectations-remain-recoverable",
            "disposition": "upheld",
            "reason": "产品预期仍由既有规格完整定义，本轮 finding 只指出验收证据覆盖不足。",
            "fact_refs": [
              "FACT-AUTOMATION-MESSAGE-CONTRACT",
              "FACT-20260824-004-001"
            ],
            "evidence": [
              "arckit/spec/agentic-software-development/runtime-automation-workspace.md",
              "arckit/spec/agentic-software-development/arcorbit-planned-workspaces.md"
            ],
            "gap_refs": []
          },
          {
            "invariant_ref": "interaction-expectations-remain-recoverable",
            "disposition": "upheld",
            "reason": "主时间线与侧栏分工、Agent item、reasoning 和工具呈现语义仍可从交互文档恢复。",
            "fact_refs": [
              "FACT-AUTOMATION-MESSAGE-CONTRACT",
              "FACT-20260824-004-001"
            ],
            "evidence": [
              "arckit/interaction/automation-workspace/interaction.md:75",
              "arckit/interaction/automation-workspace/interaction.md:78",
              "arckit/interaction/automation-workspace/interaction.md:81"
            ],
            "gap_refs": []
          },
          {
            "invariant_ref": "visual-language-remains-consistent",
            "disposition": "not_relevant",
            "reason": "审查对象未改变 Conversation Surface 样式、视觉规范或 Design Tokens。",
            "fact_refs": [],
            "evidence": [],
            "gap_refs": []
          },
          {
            "invariant_ref": "technical-decisions-remain-explainable",
            "disposition": "upheld",
            "reason": "item_id 身份、turn/thread/run 归因、structured result 隔离和跨 Run 复合键边界在代码中清晰且与技术方案一致。",
            "fact_refs": [
              "FACT-AUTOMATION-MESSAGE-CONTRACT",
              "FACT-20260824-004-001"
            ],
            "evidence": [
              "arckit/tech/arcorbit/desktop-execution-solution.md:83",
              "runtime/arcorbit/src/projection/run-event-projector.mjs:607",
              "runtime/arcorbit/src/projection/run-event-projector.mjs:616",
              "runtime/arcorbit/desktop/renderer/renderer.js:2910",
              "runtime/arcorbit/desktop/renderer/renderer.js:2923"
            ],
            "gap_refs": []
          },
          {
            "invariant_ref": "accepted-facts-are-realized",
            "disposition": "upheld",
            "reason": "代码与可重复的协议等价事件测试直接证明核心事实：同 turn Agent item 独立保留、structured result 不覆盖 commentary、reasoning token 不生成可见文本。",
            "fact_refs": [
              "FACT-20260824-004-001"
            ],
            "evidence": [
              "runtime/arcorbit/test/token-usage-projector.test.mjs:139",
              "runtime/arcorbit/test/token-usage-projector.test.mjs:188",
              "runtime/arcorbit/test/desktop-run-manager.test.mjs:302",
              "Independent targeted verification: 85 tests passed, 0 failed, 2026-08-24"
            ],
            "gap_refs": []
          },
          {
            "invariant_ref": "material-risks-have-credible-evidence",
            "disposition": "upheld",
            "reason": "核心消息身份和持久化风险已有可重复证据；Completion Review 同时明确记录尚未覆盖的场景边界，避免把不完整验证误报为完整控制。",
            "fact_refs": [
              "FACT-20260824-004-001"
            ],
            "evidence": [
              "runtime/arcorbit/test/coherent-agent-loop.test.mjs:110",
              "runtime/arcorbit/test/token-usage-projector.test.mjs:139",
              "runtime/arcorbit/test/desktop-run-manager.test.mjs:302",
              "Independent targeted verification: 85 tests passed, 0 failed, 2026-08-24"
            ],
            "gap_refs": []
          }
        ]
      },
      "evidence": [
        "git diff --check passed, 2026-08-24",
        "Independent targeted verification: 85 tests passed, 0 failed, 2026-08-24",
        "runtime/arcorbit/src/agent-orchestrator.mjs:117",
        "runtime/arcorbit/src/projection/run-event-projector.mjs:607",
        "runtime/arcorbit/src/desktop-run-manager.mjs:241",
        "runtime/arcorbit/desktop/renderer/renderer.js:2910",
        "runtime/arcorbit/test/token-usage-projector.test.mjs:139",
        "runtime/arcorbit/test/desktop-run-manager.test.mjs:302"
      ],
      "runtime_result_ref": "arckit-runtime://runs/RUN-20260824-102529512Z",
      "occurred_at": "2026-08-24T10:43:47.339Z"
    },
    {
      "round": 3,
      "transition_schema_version": "arckit-case-transition/v8",
      "goal": "补齐 Automation Agent 消息跨场景回归证据，并保持生产聚合语义不变。",
      "outcome": "completed",
      "gap_selection": {
        "mode": "candidate",
        "basis": "Fresh post-commit snapshot 中 Review Finding FINDING-20260824-004-001 是当前 Case 唯一 ready 候选，并直接阻塞下一次 Completion Review。",
        "snapshot_token": "b92f6717dcac351367eec92351d740f20d11b6c5dfdee5ce1288e4f55cd97f56",
        "selected_ref": "case-gap:CASE-20260824-004:CASE-20260824-004:review-finding:FINDING-20260824-004-001",
        "comparison_summary": "比较了 snapshot 中全部五个 persisted candidates。Review Finding 已具备明确范围和可重复验收方式，因此被选中；其余四个 Project Gap 均需独立 Case。",
        "fresh_discovery_summary": "实施和验证未发现会改变本轮测试范围、消息语义或相关 invariant 的新候选。",
        "considered": [
          {
            "ref": "project-gap:GAP-agent-scenario-evaluation",
            "source": "persisted",
            "eligibility": "case_required",
            "disposition": "deferred",
            "priority_basis": {
              "blocking": "medium",
              "uncertainty": "high",
              "risk": "high",
              "user_impact": "medium"
            },
            "reason": "通用 Agent 场景评估需要独立 Case，不属于当前 Review Finding。"
          },
          {
            "ref": "project-gap:GAP-runtime-resilience-and-adapters",
            "source": "persisted",
            "eligibility": "case_required",
            "disposition": "deferred",
            "priority_basis": {
              "blocking": "medium",
              "uncertainty": "medium",
              "risk": "high",
              "user_impact": "medium"
            },
            "reason": "通用 timeout、compaction 与 adapter 韧性需要独立 Case。"
          },
          {
            "ref": "project-gap:GAP-security-real-project-validation",
            "source": "persisted",
            "eligibility": "case_required",
            "disposition": "deferred",
            "priority_basis": {
              "blocking": "medium",
              "uncertainty": "medium",
              "risk": "high",
              "user_impact": "medium"
            },
            "reason": "真实权限项目验证需要独立受控 Case。"
          },
          {
            "ref": "project-gap:GAP-cross-record-audit",
            "source": "persisted",
            "eligibility": "case_required",
            "disposition": "deferred",
            "priority_basis": {
              "blocking": "medium",
              "uncertainty": "medium",
              "risk": "high",
              "user_impact": "medium"
            },
            "reason": "跨记录审计不阻塞当前消息场景回归。"
          },
          {
            "ref": "case-gap:CASE-20260824-004:CASE-20260824-004:review-finding:FINDING-20260824-004-001",
            "source": "persisted",
            "eligibility": "ready",
            "disposition": "selected",
            "priority_basis": {
              "blocking": "high",
              "uncertainty": "low",
              "risk": "high",
              "user_impact": "high"
            },
            "reason": "该 finding 明确要求补齐跨 Run、续接、恢复、历史审查及 Chat/Automation 对比证据，且可在当前工作区直接验证。"
          }
        ]
      },
      "selected_gap": {
        "id": "CASE-20260824-004:review-finding:FINDING-20260824-004-001",
        "responsibility": "agent",
        "goal": "Resolve review finding: 新增测试证明了单个 Automation Run 内多条 Agent item、工具和 structured result 共存，以及消息文件重载，但没有按 Case 验收要求直接验证跨 Run 聚合、人工介入后续接、失败后恢复、历史只读审查和同类 Chat/Automation 事件链对比；这些边界目前主要依赖代码检查和相邻测试，回归证据不完整。",
        "reason": "omission found by completion review",
        "derived_from": [
          "completion_review",
          "content_revision:1"
        ],
        "blocked_by": [],
        "priority_basis": {
          "blocking": "high",
          "uncertainty": "",
          "risk": "high",
          "user_impact": ""
        },
        "evidence_required": [
          "runtime/arcorbit/test/token-usage-projector.test.mjs",
          "runtime/arcorbit/test/desktop-run-manager.test.mjs",
          "runtime/arcorbit/test/desktop-renderer.test.mjs",
          "runtime/arcorbit/desktop/renderer/renderer.js",
          "runtime/arcorbit/test/token-usage-projector.test.mjs:139",
          "runtime/arcorbit/test/desktop-run-manager.test.mjs:302",
          "runtime/arcorbit/desktop/renderer/renderer.js:2898",
          "runtime/arcorbit/desktop/renderer/renderer.js:2910",
          "runtime/arcorbit/desktop/renderer/renderer.js:2923",
          "Independent review: the new event-chain test creates one Run and reloads it after restart; no added assertion exercises multiple Runs, intervention continuation, failed/recovered Runs, or equivalent Chat and Automation fixtures, 2026-08-24"
        ]
      },
      "planned_transition": {
        "goal": "补齐 Automation Agent 消息跨场景回归证据，并保持生产聚合语义不变。",
        "expected_state_change": "跨 Run、人工续接、失败恢复、历史只读及 Chat/Automation 对等行为获得直接、可重复的自动化断言，Review Finding 被解决。"
      },
      "accepted_state_delta": {
        "resolved_gap": {
          "id": "CASE-20260824-004:review-finding:FINDING-20260824-004-001",
          "status": "resolved",
          "outcome": "Review Finding 已解决：Automation transcript 的跨场景消息保留和 Chat 对等性现在由生产路径使用的纯聚合函数及协议等价 fixture 直接验证。",
          "reason": "Renderer 原有跨 Run 合并逻辑被等价抽取为 mergeAutomationTranscript，并继续由 loadTranscript 调用。测试同时构造失败 Run、人工续接消息和恢复 Run，证明相同 item_id 在不同 Run 中独立保留、历史重建与实时结果一致、结构化结果保持独立、其他任务被隔离，且 Chat 与 Automation 的用户/Agent/工具/结果消息获得相同可见类型。",
          "evidence": [
            "runtime/arcorbit/src/desktop/transcript-presentation.mjs:35",
            "runtime/arcorbit/desktop/renderer/renderer.js:2910",
            "runtime/arcorbit/test/desktop-renderer.test.mjs:1367",
            "runtime/arcorbit/test/desktop-renderer.test.mjs:1391",
            "runtime/arcorbit/test/desktop-renderer.test.mjs:1394",
            "runtime/arcorbit/test/desktop-renderer.test.mjs:1411",
            "Verification: affected Automation, Chat, recovery, projector and Renderer suites — 128 passed, 0 failed, 2026-08-24",
            "Verification: npm run check — 369 passed, 7 environment-gated skips, only sandbox-blocked Electron launch failed, 2026-08-24",
            "Verification: experience-realization-electron.test.mjs passed outside sandbox, 2026-08-24",
            "Verification: git diff --check passed, 2026-08-24"
          ]
        },
        "facts_added": [],
        "facts_superseded": [],
        "impacts_added": [],
        "impacts_updated": [],
        "gaps_added": [],
        "gaps_cancelled": [],
        "resolved_open_questions": [],
        "completed_handoffs": [],
        "completion_review_result": null,
        "resolved_review_findings": [
          "FINDING-20260824-004-001"
        ],
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
        "project_revision": 210,
        "judgments": [
          {
            "invariant_ref": "product-expectations-remain-recoverable",
            "disposition": "upheld",
            "reason": "本轮没有改变产品范围；既有规格继续完整定义 Automation 与 Chat 的消息体验及结构化信息边界。",
            "fact_refs": [
              "FACT-AUTOMATION-MESSAGE-CONTRACT",
              "FACT-20260824-004-001"
            ],
            "evidence": [
              "arckit/spec/agentic-software-development/runtime-automation-workspace.md",
              "arckit/spec/agentic-software-development/arcorbit-planned-workspaces.md"
            ],
            "gap_refs": []
          },
          {
            "invariant_ref": "interaction-expectations-remain-recoverable",
            "disposition": "upheld",
            "reason": "人工续接、失败恢复、历史只读和跨 Run 时间线仍遵循既有交互定义，本轮新增测试直接覆盖这些状态组合。",
            "fact_refs": [
              "FACT-AUTOMATION-MESSAGE-CONTRACT",
              "FACT-20260824-004-001"
            ],
            "evidence": [
              "arckit/interaction/automation-workspace/interaction.md:75",
              "arckit/interaction/automation-workspace/interaction.md:78",
              "runtime/arcorbit/test/desktop-renderer.test.mjs:1367",
              "runtime/arcorbit/test/desktop-renderer.test.mjs:1391"
            ],
            "gap_refs": []
          },
          {
            "invariant_ref": "visual-language-remains-consistent",
            "disposition": "not_relevant",
            "reason": "本轮未修改 Conversation Surface 样式、Design Tokens 或视觉呈现规则。",
            "fact_refs": [],
            "evidence": [],
            "gap_refs": []
          },
          {
            "invariant_ref": "technical-decisions-remain-explainable",
            "disposition": "upheld",
            "reason": "跨 Run 合并现在由独立纯函数表达，run_id:id 复合身份、task 隔离、用户消息合并、可见性过滤和时间排序边界均清晰可恢复。",
            "fact_refs": [
              "FACT-AUTOMATION-MESSAGE-CONTRACT",
              "FACT-20260824-004-001"
            ],
            "evidence": [
              "arckit/tech/arcorbit/desktop-execution-solution.md:83",
              "runtime/arcorbit/src/desktop/transcript-presentation.mjs:35",
              "runtime/arcorbit/desktop/renderer/renderer.js:2910"
            ],
            "gap_refs": []
          },
          {
            "invariant_ref": "accepted-facts-are-realized",
            "disposition": "upheld",
            "reason": "生产聚合函数和协议等价 fixture 直接证明同一 task 的用户、Agent、工具和 structured item 跨 Run 保留，同时隔离其他 task，并保持历史与实时投影一致。",
            "fact_refs": [
              "FACT-20260824-004-001"
            ],
            "evidence": [
              "runtime/arcorbit/test/desktop-renderer.test.mjs:1367",
              "runtime/arcorbit/test/desktop-renderer.test.mjs:1391",
              "runtime/arcorbit/test/desktop-renderer.test.mjs:1394",
              "Verification: affected suites — 128 passed, 0 failed, 2026-08-24"
            ],
            "gap_refs": []
          },
          {
            "invariant_ref": "material-risks-have-credible-evidence",
            "disposition": "upheld",
            "reason": "Review Finding 指出的所有场景边界现有直接自动化断言；完整套件和沙箱外 Electron 回归进一步控制了重构与呈现风险。",
            "fact_refs": [
              "FACT-20260824-004-001"
            ],
            "evidence": [
              "runtime/arcorbit/test/desktop-renderer.test.mjs:1367",
              "runtime/arcorbit/test/desktop-renderer.test.mjs:1411",
              "Verification: affected suites — 128 passed, 0 failed, 2026-08-24",
              "Verification: npm run check — 369 passed, 7 environment-gated skips, 1 sandbox-only Electron launch failure, 2026-08-24",
              "Verification: experience-realization-electron.test.mjs passed outside sandbox, 2026-08-24"
            ],
            "gap_refs": []
          }
        ]
      },
      "evidence": [
        "runtime/arcorbit/src/desktop/transcript-presentation.mjs:35",
        "runtime/arcorbit/desktop/renderer/renderer.js:2910",
        "runtime/arcorbit/test/desktop-renderer.test.mjs:1367",
        "runtime/arcorbit/test/desktop-renderer.test.mjs:1391",
        "runtime/arcorbit/test/desktop-renderer.test.mjs:1411",
        "Verification: affected suites — 128 passed, 0 failed, 2026-08-24",
        "Verification: npm run check — 369 passed, 7 environment-gated skips, only sandbox-blocked Electron launch failed, 2026-08-24",
        "Verification: experience-realization-electron.test.mjs passed outside sandbox, 2026-08-24",
        "Verification: git diff --check passed, 2026-08-24"
      ],
      "runtime_result_ref": "arckit-runtime://runs/RUN-20260824-102529512Z",
      "occurred_at": "2026-08-24T10:48:43.071Z"
    },
    {
      "round": 4,
      "transition_schema_version": "arckit-case-transition/v8",
      "goal": "独立审查 CASE-20260824-004 content revision 2 的完整实现与验证证据。",
      "outcome": "completed",
      "gap_selection": {
        "mode": "candidate",
        "basis": "Fresh post-commit snapshot 中 Completion Review 是 CASE-20260824-004 唯一 ready candidate，并直接阻塞 Case 最终收口；其他四项均为需要独立 Case 的 Project Gap。",
        "snapshot_token": "656e5f6c0d0362bec7f48ac7c308285b9148239c0cd1c303dc29c44318f834e9",
        "selected_ref": "case-gap:CASE-20260824-004:CASE-20260824-004:completion-review:2",
        "comparison_summary": "比较了 snapshot catalog 的全部五个 persisted candidates。Completion Review 针对已闭合普通 Gap 和影响的 content revision 2，blocking、risk 与 user impact 均高且已 ready；四个 Project Gap 虽重要，但均需独立 Case，不属于当前 Case 的完成门禁。",
        "fresh_discovery_summary": "独立源码检查与受影响套件复跑未发现会改变审查对象、相关 invariant、风险边界或验收方式的 fresh candidate。",
        "considered": [
          {
            "ref": "project-gap:GAP-agent-scenario-evaluation",
            "source": "persisted",
            "eligibility": "case_required",
            "disposition": "deferred",
            "priority_basis": {
              "blocking": "medium",
              "uncertainty": "high",
              "risk": "high",
              "user_impact": "medium"
            },
            "reason": "通用动态 Gap 场景评估仍需独立 Case；它不影响当前实现修复的 Completion Review。"
          },
          {
            "ref": "project-gap:GAP-runtime-resilience-and-adapters",
            "source": "persisted",
            "eligibility": "case_required",
            "disposition": "deferred",
            "priority_basis": {
              "blocking": "medium",
              "uncertainty": "medium",
              "risk": "high",
              "user_impact": "medium"
            },
            "reason": "Runtime timeout、compaction 和 adapter 韧性属于独立项目义务，不是当前消息链审查的未闭合条件。"
          },
          {
            "ref": "project-gap:GAP-security-real-project-validation",
            "source": "persisted",
            "eligibility": "case_required",
            "disposition": "deferred",
            "priority_basis": {
              "blocking": "medium",
              "uncertainty": "medium",
              "risk": "high",
              "user_impact": "medium"
            },
            "reason": "真实权限项目安全验证需要独立受控环境，与本次消息身份和呈现审查无直接依赖。"
          },
          {
            "ref": "project-gap:GAP-cross-record-audit",
            "source": "persisted",
            "eligibility": "case_required",
            "disposition": "deferred",
            "priority_basis": {
              "blocking": "medium",
              "uncertainty": "medium",
              "risk": "high",
              "user_impact": "medium"
            },
            "reason": "跨记录审计仍是高风险 Project obligation，但需要独立 Case，不阻塞 CASE-20260824-004 收口。"
          },
          {
            "ref": "case-gap:CASE-20260824-004:CASE-20260824-004:completion-review:2",
            "source": "persisted",
            "eligibility": "ready",
            "disposition": "selected",
            "priority_basis": {
              "blocking": "high",
              "uncertainty": "low",
              "risk": "high",
              "user_impact": "high"
            },
            "reason": "所有普通 Case Gap 和 state impacts 已闭合；必须独立审查 content revision 2 的正确性、真实问题解决、验证可信度、回归风险和最小性。"
          }
        ]
      },
      "selected_gap": {
        "id": "CASE-20260824-004:completion-review:2",
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
        "goal": "独立审查 CASE-20260824-004 content revision 2 的完整实现与验证证据。",
        "expected_state_change": "若五个 Completion Review 维度均无 finding，则以 clean 结果完成 Case 的语义审查门禁，不产生 Case 或 Project 内容变更。"
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
            "runtime/arcorbit/src/agent-orchestrator.mjs:117",
            "runtime/arcorbit/src/projection/run-event-projector.mjs:607",
            "runtime/arcorbit/src/projection/run-event-projector.mjs:616",
            "runtime/arcorbit/src/desktop-run-manager.mjs:241",
            "runtime/arcorbit/src/desktop/transcript-presentation.mjs:35",
            "runtime/arcorbit/desktop/renderer/renderer.js:2910",
            "runtime/arcorbit/test/coherent-agent-loop.test.mjs:110",
            "runtime/arcorbit/test/token-usage-projector.test.mjs:139",
            "runtime/arcorbit/test/token-usage-projector.test.mjs:188",
            "runtime/arcorbit/test/desktop-run-manager.test.mjs:302",
            "runtime/arcorbit/test/desktop-renderer.test.mjs:1367",
            "runtime/arcorbit/test/desktop-renderer.test.mjs:1391",
            "runtime/arcorbit/test/desktop-renderer.test.mjs:1394",
            "runtime/arcorbit/test/desktop-renderer.test.mjs:1411",
            "Independent Completion Review verification: affected Automation, Chat, recovery, projector and Renderer suites — 128 passed, 0 failed, 2026-08-24",
            "Verification: git diff --check passed, 2026-08-24",
            "Verification: npm run check — 369 passed, 7 environment-gated skips, only sandbox-blocked Electron launch failed; experience-realization-electron.test.mjs passed outside sandbox, 2026-08-24"
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
        "project_revision": 210,
        "judgments": [
          {
            "invariant_ref": "product-expectations-remain-recoverable",
            "disposition": "upheld",
            "reason": "产品范围和验收含义未改变；既有规格仍完整定义 Automation 与 Chat 的消息体验、逐 item 保留及结构化信息隔离，审查确认实现与其一致。",
            "fact_refs": [
              "FACT-AUTOMATION-MESSAGE-CONTRACT",
              "FACT-20260824-004-001"
            ],
            "evidence": [
              "arckit/spec/agentic-software-development/runtime-automation-workspace.md",
              "arckit/spec/agentic-software-development/arcorbit-planned-workspaces.md",
              "runtime/arcorbit/src/agent-orchestrator.mjs:117"
            ],
            "gap_refs": []
          },
          {
            "invariant_ref": "interaction-expectations-remain-recoverable",
            "disposition": "upheld",
            "reason": "主时间线与侧栏分工、Agent commentary、非空 reasoning、简洁工具、人工续接、失败恢复和历史只读语义均可从交互文档与直接测试恢复。",
            "fact_refs": [
              "FACT-AUTOMATION-MESSAGE-CONTRACT",
              "FACT-20260824-004-001"
            ],
            "evidence": [
              "arckit/interaction/automation-workspace/interaction.md:75",
              "arckit/interaction/automation-workspace/interaction.md:78",
              "arckit/interaction/automation-workspace/interaction.md:81",
              "runtime/arcorbit/test/desktop-renderer.test.mjs:1367",
              "runtime/arcorbit/test/desktop-renderer.test.mjs:1411"
            ],
            "gap_refs": []
          },
          {
            "invariant_ref": "visual-language-remains-consistent",
            "disposition": "not_relevant",
            "reason": "审查内容未改变 Conversation Surface 样式、Design Tokens、布局或其他视觉语言规则。",
            "fact_refs": [],
            "evidence": [],
            "gap_refs": []
          },
          {
            "invariant_ref": "technical-decisions-remain-explainable",
            "disposition": "upheld",
            "reason": "item_id 作为消息身份、turn/thread/run 作为归因、structured result 独立投影、run_id:id 跨 Run 复合身份及历史聚合边界均在代码中明确表达，并与长期技术方案一致。",
            "fact_refs": [
              "FACT-AUTOMATION-MESSAGE-CONTRACT",
              "FACT-20260824-004-001"
            ],
            "evidence": [
              "arckit/tech/arcorbit/desktop-execution-solution.md:83",
              "arckit/tech/arcorbit/desktop-execution-solution.md:85",
              "runtime/arcorbit/src/projection/run-event-projector.mjs:607",
              "runtime/arcorbit/src/projection/run-event-projector.mjs:616",
              "runtime/arcorbit/src/desktop/transcript-presentation.mjs:35",
              "runtime/arcorbit/desktop/renderer/renderer.js:2910"
            ],
            "gap_refs": []
          },
          {
            "invariant_ref": "accepted-facts-are-realized",
            "disposition": "upheld",
            "reason": "生产源码与协议等价测试直接证明多条 Agent item 独立保留、structured result 不覆盖 commentary、reasoning token 不生成可见文本，并在跨 Run、续接、恢复与历史场景保持身份和顺序。",
            "fact_refs": [
              "FACT-20260824-004-001"
            ],
            "evidence": [
              "runtime/arcorbit/test/token-usage-projector.test.mjs:139",
              "runtime/arcorbit/test/token-usage-projector.test.mjs:188",
              "runtime/arcorbit/test/desktop-run-manager.test.mjs:302",
              "runtime/arcorbit/test/desktop-renderer.test.mjs:1367",
              "runtime/arcorbit/test/desktop-renderer.test.mjs:1391",
              "Independent Completion Review verification: affected suites — 128 passed, 0 failed, 2026-08-24"
            ],
            "gap_refs": []
          },
          {
            "invariant_ref": "material-risks-have-credible-evidence",
            "disposition": "upheld",
            "reason": "消息身份、持久化、跨 Run 聚合、失败恢复、历史只读、Chat 对等和结构化隔离均有直接、可重复的自动化证据；完整套件与沙箱外 Electron 回归控制了相邻回归风险。",
            "fact_refs": [
              "FACT-20260824-004-001"
            ],
            "evidence": [
              "runtime/arcorbit/test/coherent-agent-loop.test.mjs:110",
              "runtime/arcorbit/test/token-usage-projector.test.mjs:139",
              "runtime/arcorbit/test/desktop-run-manager.test.mjs:302",
              "runtime/arcorbit/test/desktop-renderer.test.mjs:1367",
              "runtime/arcorbit/test/desktop-renderer.test.mjs:1411",
              "Independent Completion Review verification: affected suites — 128 passed, 0 failed, 2026-08-24",
              "Verification: npm run check — 369 passed, 7 environment-gated skips, only sandbox-blocked Electron launch failed; Electron experience test passed outside sandbox, 2026-08-24"
            ],
            "gap_refs": []
          }
        ]
      },
      "evidence": [
        "runtime/arcorbit/src/agent-orchestrator.mjs:117",
        "runtime/arcorbit/src/projection/run-event-projector.mjs:607",
        "runtime/arcorbit/src/projection/run-event-projector.mjs:616",
        "runtime/arcorbit/src/desktop-run-manager.mjs:241",
        "runtime/arcorbit/src/desktop/transcript-presentation.mjs:35",
        "runtime/arcorbit/desktop/renderer/renderer.js:2910",
        "runtime/arcorbit/test/token-usage-projector.test.mjs:139",
        "runtime/arcorbit/test/desktop-run-manager.test.mjs:302",
        "runtime/arcorbit/test/desktop-renderer.test.mjs:1367",
        "runtime/arcorbit/test/desktop-renderer.test.mjs:1411",
        "Independent Completion Review verification: affected suites — 128 passed, 0 failed, 2026-08-24",
        "Verification: git diff --check passed, 2026-08-24"
      ],
      "runtime_result_ref": "arckit-runtime://runs/RUN-20260824-102529512Z",
      "occurred_at": "2026-08-24T10:51:13.623Z"
    }
  ],
  "case_resolution": {
    "status": "resolved",
    "stage": "resolved",
    "satisfied": [
      "GAP-AUTOMATION-AGENT-MESSAGE-PARITY",
      "CASE-20260824-004:review-finding:FINDING-20260824-004-001"
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
    "updated_at": "2026-08-24T10:51:13.623Z"
  }
}
```

## Round Notes

- Case history is canonical in Structured Record.rounds; keep prose notes exceptional.
