# Clarify Runtime Agent transcript message presentation

Case: CASE-20260811-001
Status: closed
Artifact Type: mixed
Selected Gap: none
Updated: 2026-08-11T03:16:07.510Z

## User Intent

优化 Arckit Runtime Desktop 的 Chat 消息展示：隐藏空 reasoning，将真实思考过程在完成后默认收起并允许展开，以一句话表达工具调用，明确区分 Agent 正式自然语言输出与结构化协议数据，并在不二次改写 Agent 内容的前提下使用合适的专用渲染器。

## Structured Record

```json
{
  "schema_version": "development-case-record/v5",
  "id": "CASE-20260811-001",
  "title": "Clarify Runtime Agent transcript message presentation",
  "status": "closed",
  "artifact_type": "mixed",
  "created_at": "2026-08-11T03:01:18.975Z",
  "updated_at": "2026-08-11T03:16:07.510Z",
  "user_intent": "优化 Arckit Runtime Desktop 的 Chat 消息展示：隐藏空 reasoning，将真实思考过程在完成后默认收起并允许展开，以一句话表达工具调用，明确区分 Agent 正式自然语言输出与结构化协议数据，并在不二次改写 Agent 内容的前提下使用合适的专用渲染器。",
  "expected_outcome": "Runtime 依据 Codex 原始输出语义分类消息；空 reasoning 不进入 transcript，非空 reasoning 可展开且完成后默认收起，工具调用保持单行摘要，正式自然语言输出作为主消息，arckit-agent-loop-result 等结构化 payload 保真进入专用查看器而不以原始 JSON 气泡干扰阅读，并由真实 Run fixture 与自动化测试证明。",
  "project_state_ref": "arckit/project/state.record.json",
  "current_round": {
    "goal": "",
    "selected_gap": null
  },
  "facts": [
    {
      "id": "FACT-TRANSCRIPT-001",
      "revision": 1,
      "status": "accepted",
      "statement": "Chat 不展示没有任何可读内容的 Codex reasoning；有内容的 reasoning 在进行中可见，完成后默认收起并允许用户按需展开。",
      "basis": "用户明确给出的 Agent 产品体验要求。",
      "evidence": [
        "original_user_input: 空 reasoning 没必要展示，思考结束后收起且可按需展开。"
      ]
    },
    {
      "id": "FACT-TRANSCRIPT-002",
      "revision": 1,
      "status": "accepted",
      "statement": "工具调用在主 transcript 中使用一句可理解的活动说明，不展开原始命令输出正文。",
      "basis": "用户明确要求工具调用简单表达，让用户能看出正在做什么。",
      "evidence": [
        "original_user_input: 工具调用简单表达，有一句话说明能看到在做什么事情即可。"
      ]
    },
    {
      "id": "FACT-TRANSCRIPT-003",
      "revision": 1,
      "status": "accepted",
      "statement": "Agent 正式自然语言输出具有主消息层级；结构化输出保持原值并使用对应查看器，不作为未经格式化的 JSON 气泡展示，也不由 Runtime 二次改写内容。",
      "basis": "用户明确要求区分正式输出与结构化数据，并要求 Runtime 基于 Codex 输出直接展示。",
      "evidence": [
        "original_user_input: 正式输出作为正式消息；结构化数据使用专用渲染器；不对 Agent 输出做二次加工。"
      ]
    },
    {
      "id": "FACT-TRANSCRIPT-004",
      "revision": 1,
      "status": "accepted",
      "statement": "最新 Run 的 54 条 reasoning 投影均为空；同一 Run 的 structured-output agent_message.delta 包含完整 arckit-agent-loop-result/v1 JSON，而 runtime.agent_loop.completed 已另外提供其自然语言 summary。",
      "basis": "本地 Desktop-owned 最新执行记录与 projector 源码形成完全匹配的稳定复现链。",
      "evidence": [
        "arckit-runtime://runs/RUN-20260810-172138193Z",
        "runtime/arckit-runtime/src/projection/run-event-projector.mjs",
        "runtime/arckit-runtime/desktop/renderer/renderer.js"
      ]
    },
    {
      "id": "FACT-TRANSCRIPT-005",
      "revision": 1,
      "status": "accepted",
      "statement": "空 reasoning 的直接根因是 Codex reasoning item 使用空数组 summary，而 projector 以 truthy 数组通过条件后将其 String 化为空内容并生成消息；真实执行记录与代码路径完全匹配。",
      "basis": "最新 Run 中 54 条 reasoning content 均为空，本地 Codex response item 显示 summary=[]，projectCompletedItem 对 item.summary 仅做 truthy 判断。",
      "evidence": [
        "arckit-runtime://runs/RUN-20260810-172138193Z",
        "runtime/arckit-runtime/src/projection/run-event-projector.mjs:326",
        "~/.codex/sessions response_item reasoning summary=[]"
      ]
    },
    {
      "id": "FACT-TRANSCRIPT-006",
      "revision": 1,
      "status": "accepted",
      "statement": "raw arckit-agent-loop-result/v1 JSON 来自 schema-bound Codex agentMessage delta；同一 Runtime round 已通过 runtime.agent_loop.completed 提供原始 summary，因此前者属于结构化结果数据，后者属于正式自然语言消息。",
      "basis": "最新 Run activity 的 agent_text/stream content 与 agent-loop payload 完全一致，projector 同时把 runtime.agent_loop.completed.summary 投影为 result message。",
      "evidence": [
        "arckit-runtime://runs/RUN-20260810-172138193Z",
        "runtime/arckit-runtime/src/projection/run-event-projector.mjs:124",
        "runtime/arckit-runtime/src/projection/run-event-projector.mjs:70"
      ]
    },
    {
      "id": "FACT-TRANSCRIPT-007",
      "revision": 1,
      "status": "accepted",
      "statement": "Runtime projector 现在按 Codex item/event 语义直接区分 reasoning、正式 Agent 输出与 schema-bound structured result；renderer 对非空 reasoning 使用完成后折叠的 disclosure，对 structured result 使用字段查看器并保留原始 JSON，旧 Run 的 raw schema 消息也可直接识别。",
      "basis": "生产 projector、presentation helper、renderer 与 focused tests 一致。",
      "evidence": [
        "runtime/arckit-runtime/src/projection/run-event-projector.mjs",
        "runtime/arckit-runtime/src/desktop/transcript-presentation.mjs",
        "runtime/arckit-runtime/desktop/renderer/renderer.js",
        "runtime/arckit-runtime/desktop/renderer/styles.css",
        "runtime/arckit-runtime/test/token-usage-projector.test.mjs",
        "runtime/arckit-runtime/test/desktop-renderer.test.mjs"
      ]
    },
    {
      "id": "FACT-TRANSCRIPT-008",
      "revision": 1,
      "status": "accepted",
      "statement": "聚焦 transcript 测试 22/22 通过，完整 Runtime check 为 102 pass、0 fail、1 个需显式启用的 Electron 布局用例跳过；最新真实 Run 回放会隐藏全部 54 条空 reasoning，并将原始 loop-result JSON 识别为结构化结果。",
      "basis": "本轮自动化命令和实际持久化 Run 的 presentation 回放统计。",
      "evidence": [
        "runtime/arckit-runtime/test/token-usage-projector.test.mjs",
        "runtime/arckit-runtime/test/desktop-renderer.test.mjs",
        "npm --prefix runtime/arckit-runtime run check: 102 pass, 0 fail, 1 opt-in Electron layout skip",
        "latest Run compatibility replay: 54 empty reasoning hidden; 1 schema payload classified structured"
      ]
    }
  ],
  "state_impacts": [
    {
      "id": "IMPACT-TRANSCRIPT-001",
      "fact_id": "FACT-TRANSCRIPT-001",
      "fact_revision": 1,
      "target": {
        "kind": "software_decision",
        "ref": "experience_and_interaction",
        "revision": 2
      },
      "effect": "upheld",
      "reason": "生产 projector 与 renderer 已实现空 reasoning 抑制、非空 reasoning 生命周期 disclosure、正式输出分层和结构化结果查看器。",
      "gap_ids": [],
      "evidence": [
        "arckit-runtime://runs/RUN-20260810-172138193Z",
        "runtime/arckit-runtime/src/projection/run-event-projector.mjs",
        "runtime/arckit-runtime/src/desktop/transcript-presentation.mjs",
        "runtime/arckit-runtime/desktop/renderer/renderer.js",
        "runtime/arckit-runtime/desktop/renderer/styles.css",
        "runtime/arckit-runtime/test/token-usage-projector.test.mjs",
        "runtime/arckit-runtime/test/desktop-renderer.test.mjs",
        "npm --prefix runtime/arckit-runtime run check: 102 pass, 0 fail, 1 opt-in Electron layout skip",
        "latest Run compatibility replay: 54 empty reasoning hidden; 1 schema payload classified structured"
      ]
    },
    {
      "id": "IMPACT-TRANSCRIPT-002",
      "fact_id": "FACT-TRANSCRIPT-003",
      "fact_revision": 1,
      "target": {
        "kind": "software_decision",
        "ref": "visual_language",
        "revision": 2
      },
      "effect": "upheld",
      "reason": "Workbench transcript 已按持久视觉策略实现克制的 reasoning disclosure、结构化结果层级和原始 JSON 次级入口。",
      "gap_ids": [],
      "evidence": [
        "arckit-runtime://runs/RUN-20260810-172138193Z",
        "runtime/arckit-runtime/src/projection/run-event-projector.mjs",
        "runtime/arckit-runtime/src/desktop/transcript-presentation.mjs",
        "runtime/arckit-runtime/desktop/renderer/renderer.js",
        "runtime/arckit-runtime/desktop/renderer/styles.css",
        "runtime/arckit-runtime/test/token-usage-projector.test.mjs",
        "runtime/arckit-runtime/test/desktop-renderer.test.mjs",
        "npm --prefix runtime/arckit-runtime run check: 102 pass, 0 fail, 1 opt-in Electron layout skip",
        "latest Run compatibility replay: 54 empty reasoning hidden; 1 schema payload classified structured"
      ]
    },
    {
      "id": "IMPACT-TRANSCRIPT-003",
      "fact_id": "FACT-TRANSCRIPT-004",
      "fact_revision": 1,
      "target": {
        "kind": "software_decision",
        "ref": "data_and_state",
        "revision": 1
      },
      "effect": "upheld",
      "reason": "Desktop message 投影已保留 structured_data 原值和 raw 文本，并把 reasoning 数组语义化归一而不生成空消息。",
      "gap_ids": [],
      "evidence": [
        "arckit-runtime://runs/RUN-20260810-172138193Z",
        "runtime/arckit-runtime/src/projection/run-event-projector.mjs",
        "runtime/arckit-runtime/src/desktop/transcript-presentation.mjs",
        "runtime/arckit-runtime/desktop/renderer/renderer.js",
        "runtime/arckit-runtime/desktop/renderer/styles.css",
        "runtime/arckit-runtime/test/token-usage-projector.test.mjs",
        "runtime/arckit-runtime/test/desktop-renderer.test.mjs",
        "npm --prefix runtime/arckit-runtime run check: 102 pass, 0 fail, 1 opt-in Electron layout skip",
        "latest Run compatibility replay: 54 empty reasoning hidden; 1 schema payload classified structured"
      ]
    },
    {
      "id": "IMPACT-TRANSCRIPT-004",
      "fact_id": "FACT-TRANSCRIPT-003",
      "fact_revision": 1,
      "target": {
        "kind": "software_invariant",
        "ref": "accepted-facts-are-realized",
        "revision": null
      },
      "effect": "upheld",
      "reason": "已接受的六类消息层级、折叠和保真规则已落实到生产投影、presentation 与 renderer。",
      "gap_ids": [],
      "evidence": [
        "arckit-runtime://runs/RUN-20260810-172138193Z",
        "runtime/arckit-runtime/src/projection/run-event-projector.mjs",
        "runtime/arckit-runtime/src/desktop/transcript-presentation.mjs",
        "runtime/arckit-runtime/desktop/renderer/renderer.js",
        "runtime/arckit-runtime/desktop/renderer/styles.css",
        "runtime/arckit-runtime/test/token-usage-projector.test.mjs",
        "runtime/arckit-runtime/test/desktop-renderer.test.mjs",
        "npm --prefix runtime/arckit-runtime run check: 102 pass, 0 fail, 1 opt-in Electron layout skip",
        "latest Run compatibility replay: 54 empty reasoning hidden; 1 schema payload classified structured"
      ]
    },
    {
      "id": "IMPACT-TRANSCRIPT-005",
      "fact_id": "FACT-TRANSCRIPT-004",
      "fact_revision": 1,
      "target": {
        "kind": "software_invariant",
        "ref": "material-risks-have-credible-evidence",
        "revision": null
      },
      "effect": "upheld",
      "reason": "聚焦测试、完整 Runtime check 与最新真实 Run 兼容回放共同覆盖主要回归风险。",
      "gap_ids": [],
      "evidence": [
        "arckit-runtime://runs/RUN-20260810-172138193Z",
        "runtime/arckit-runtime/src/projection/run-event-projector.mjs",
        "runtime/arckit-runtime/src/desktop/transcript-presentation.mjs",
        "runtime/arckit-runtime/desktop/renderer/renderer.js",
        "runtime/arckit-runtime/desktop/renderer/styles.css",
        "runtime/arckit-runtime/test/token-usage-projector.test.mjs",
        "runtime/arckit-runtime/test/desktop-renderer.test.mjs",
        "npm --prefix runtime/arckit-runtime run check: 102 pass, 0 fail, 1 opt-in Electron layout skip",
        "latest Run compatibility replay: 54 empty reasoning hidden; 1 schema payload classified structured"
      ]
    }
  ],
  "gaps": [
    {
      "id": "GAP-TRANSCRIPT-CONTRACT-001",
      "status": "resolved",
      "goal": "基于最新真实 Run、既有交互/视觉策略与事件投影代码，确立 reasoning、工具调用、正式 Agent 输出和结构化 payload 的稳定展示合同与根因边界。",
      "reason": "在修改 projector 和 renderer 前必须让信息层级、折叠行为、保真边界及专用查看器职责可恢复并可验收。",
      "derived_from": [
        "FACT-TRANSCRIPT-001",
        "FACT-TRANSCRIPT-002",
        "FACT-TRANSCRIPT-003",
        "FACT-TRANSCRIPT-004"
      ],
      "blocked_by": [],
      "priority_basis": {
        "blocking": "blocks implementation",
        "uncertainty": "low after real-run evidence",
        "risk": "high because projection can hide or duplicate Agent output",
        "user_impact": "high transcript readability impact"
      },
      "responsibility": "agent",
      "evidence_required": [
        "真实 Run 到 projector/renderer 的完整逻辑匹配证据",
        "持久交互事实与视觉组件规格",
        "不二次改写且不丢失结构化数据的展示边界"
      ],
      "resolution": {
        "id": "GAP-TRANSCRIPT-CONTRACT-001",
        "status": "resolved",
        "outcome": "已用真实 Run 事件、projector/renderer 逻辑、持久交互源、灰度线框、视觉组件规格和技术方案确立展示合同。",
        "reason": "证据完整解释空 reasoning 与 raw schema JSON 的来源，并定义不二次改写、保真且分层展示的可验收边界。",
        "evidence": [
          "arckit-runtime://runs/RUN-20260810-172138193Z",
          "runtime/arckit-runtime/src/projection/run-event-projector.mjs",
          "runtime/arckit-runtime/adapters/codex-app-server-adapter.mjs",
          "arckit/interaction/automation-workspace/interaction.md",
          "arckit/interaction/automation-workspace/intervention-workbench.html",
          "arckit/visual/_library/brief.md",
          "arckit/visual/_library/component-catalog.yaml",
          "arckit/tech/arckit-runtime/desktop-execution-solution.md"
        ],
        "occurred_at": "2026-08-11T03:06:23.202Z"
      }
    },
    {
      "id": "GAP-TRANSCRIPT-IMPLEMENT-001",
      "status": "resolved",
      "goal": "实现并验证语义化 transcript 投影与展示，使真实 Codex 输出按 accepted contract 清晰、简洁、保真呈现。",
      "reason": "当前生产代码仍产生空 reasoning 行并把结构化输出显示为普通 JSON 气泡。",
      "derived_from": [
        "FACT-TRANSCRIPT-001",
        "FACT-TRANSCRIPT-002",
        "FACT-TRANSCRIPT-003",
        "FACT-TRANSCRIPT-004"
      ],
      "blocked_by": [
        "GAP-TRANSCRIPT-CONTRACT-001"
      ],
      "priority_basis": {
        "blocking": "blocked by presentation contract",
        "uncertainty": "medium around streamed structured-output lifecycle",
        "risk": "high regression risk across persisted and live transcripts",
        "user_impact": "high"
      },
      "responsibility": "agent",
      "evidence_required": [
        "projector/presentation/renderer automated tests covering empty and non-empty reasoning, structured result viewing, formal summaries and tool rows",
        "production code inspection and full Runtime check",
        "source/projection consistency evidence"
      ],
      "resolution": {
        "id": "GAP-TRANSCRIPT-IMPLEMENT-001",
        "status": "resolved",
        "outcome": "已实现语义化 transcript 投影和原值展示：空 reasoning 不显示，非空 reasoning 流式展开且完成后默认收起，正式自然语言保持主消息，schema payload 使用专用查看器，工具调用保持单行活动说明。",
        "reason": "生产代码、聚焦回归、完整 Runtime check 与最新真实 Run 兼容回放形成一致证据。",
        "evidence": [
          "arckit-runtime://runs/RUN-20260810-172138193Z",
          "runtime/arckit-runtime/src/projection/run-event-projector.mjs",
          "runtime/arckit-runtime/src/desktop/transcript-presentation.mjs",
          "runtime/arckit-runtime/desktop/renderer/renderer.js",
          "runtime/arckit-runtime/desktop/renderer/styles.css",
          "runtime/arckit-runtime/test/token-usage-projector.test.mjs",
          "runtime/arckit-runtime/test/desktop-renderer.test.mjs",
          "npm --prefix runtime/arckit-runtime run check: 102 pass, 0 fail, 1 opt-in Electron layout skip",
          "latest Run compatibility replay: 54 empty reasoning hidden; 1 schema payload classified structured"
        ],
        "occurred_at": "2026-08-11T03:15:19.934Z"
      }
    }
  ],
  "content_revision": 2,
  "completion_review": {
    "status": "clean",
    "policy": {
      "initial_max_cycles": 3,
      "source": "runtime/arckit-runtime/config/case-policy.json",
      "snapshotted_at": "2026-08-11T03:01:18.975Z"
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
          "runtime/arckit-runtime/src/projection/run-event-projector.mjs",
          "runtime/arckit-runtime/src/desktop/transcript-presentation.mjs",
          "runtime/arckit-runtime/desktop/renderer/renderer.js",
          "runtime/arckit-runtime/desktop/renderer/styles.css",
          "runtime/arckit-runtime/test/token-usage-projector.test.mjs: focused empty/non-empty reasoning and structured/formal output lifecycle coverage",
          "runtime/arckit-runtime/test/desktop-renderer.test.mjs: visibility, legacy JSON, exact raw and viewer contract coverage",
          "npm --prefix runtime/arckit-runtime run check: 102 pass, 0 fail, 1 opt-in Electron layout skip",
          "arckit-runtime://runs/RUN-20260810-172138193Z compatibility replay: 54 empty reasoning hidden; 1 schema payload classified structured; formal/tool/Loop records retained",
          "git diff --check: clean",
          "arckit/interaction/automation-workspace/interaction.md",
          "arckit/visual/_library/component-catalog.yaml",
          "arckit/tech/arckit-runtime/desktop-execution-solution.md"
        ],
        "occurred_at": "2026-08-11T03:16:07.510Z"
      }
    ],
    "evidence": [
      "runtime/arckit-runtime/src/projection/run-event-projector.mjs",
      "runtime/arckit-runtime/src/desktop/transcript-presentation.mjs",
      "runtime/arckit-runtime/desktop/renderer/renderer.js",
      "runtime/arckit-runtime/desktop/renderer/styles.css",
      "runtime/arckit-runtime/test/token-usage-projector.test.mjs: focused empty/non-empty reasoning and structured/formal output lifecycle coverage",
      "runtime/arckit-runtime/test/desktop-renderer.test.mjs: visibility, legacy JSON, exact raw and viewer contract coverage",
      "npm --prefix runtime/arckit-runtime run check: 102 pass, 0 fail, 1 opt-in Electron layout skip",
      "arckit-runtime://runs/RUN-20260810-172138193Z compatibility replay: 54 empty reasoning hidden; 1 schema payload classified structured; formal/tool/Loop records retained",
      "git diff --check: clean",
      "arckit/interaction/automation-workspace/interaction.md",
      "arckit/visual/_library/component-catalog.yaml",
      "arckit/tech/arckit-runtime/desktop-execution-solution.md"
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
      "goal": "基于最新真实 Run、既有交互/视觉策略与事件投影代码，确立 reasoning、工具调用、正式 Agent 输出和结构化 payload 的稳定展示合同与根因边界。",
      "outcome": "completed",
      "selected_gap": {
        "id": "GAP-TRANSCRIPT-CONTRACT-001",
        "responsibility": "agent",
        "goal": "基于最新真实 Run、既有交互/视觉策略与事件投影代码，确立 reasoning、工具调用、正式 Agent 输出和结构化 payload 的稳定展示合同与根因边界。",
        "reason": "在修改 projector 和 renderer 前必须让信息层级、折叠行为、保真边界及专用查看器职责可恢复并可验收。",
        "derived_from": [
          "FACT-TRANSCRIPT-001",
          "FACT-TRANSCRIPT-002",
          "FACT-TRANSCRIPT-003",
          "FACT-TRANSCRIPT-004"
        ],
        "blocked_by": [],
        "priority_basis": {
          "blocking": "blocks implementation",
          "uncertainty": "low after real-run evidence",
          "risk": "high because projection can hide or duplicate Agent output",
          "user_impact": "high transcript readability impact"
        },
        "evidence_required": [
          "真实 Run 到 projector/renderer 的完整逻辑匹配证据",
          "持久交互事实与视觉组件规格",
          "不二次改写且不丢失结构化数据的展示边界"
        ]
      },
      "planned_transition": {
        "goal": "基于最新真实 Run、既有交互/视觉策略与事件投影代码，确立 reasoning、工具调用、正式 Agent 输出和结构化 payload 的稳定展示合同与根因边界。",
        "expected_state_change": "关闭展示合同 gap，接受真实 Run 的根因事实和六类 transcript 信息层级，并使实现 gap 成为唯一 ready gap。"
      },
      "accepted_state_delta": {
        "resolved_gap": {
          "id": "GAP-TRANSCRIPT-CONTRACT-001",
          "status": "resolved",
          "outcome": "已用真实 Run 事件、projector/renderer 逻辑、持久交互源、灰度线框、视觉组件规格和技术方案确立展示合同。",
          "reason": "证据完整解释空 reasoning 与 raw schema JSON 的来源，并定义不二次改写、保真且分层展示的可验收边界。",
          "evidence": [
            "arckit-runtime://runs/RUN-20260810-172138193Z",
            "runtime/arckit-runtime/src/projection/run-event-projector.mjs",
            "runtime/arckit-runtime/adapters/codex-app-server-adapter.mjs",
            "arckit/interaction/automation-workspace/interaction.md",
            "arckit/interaction/automation-workspace/intervention-workbench.html",
            "arckit/visual/_library/brief.md",
            "arckit/visual/_library/component-catalog.yaml",
            "arckit/tech/arckit-runtime/desktop-execution-solution.md"
          ]
        },
        "facts_added": [
          {
            "id": "FACT-TRANSCRIPT-005",
            "revision": 1,
            "status": "accepted",
            "statement": "空 reasoning 的直接根因是 Codex reasoning item 使用空数组 summary，而 projector 以 truthy 数组通过条件后将其 String 化为空内容并生成消息；真实执行记录与代码路径完全匹配。",
            "basis": "最新 Run 中 54 条 reasoning content 均为空，本地 Codex response item 显示 summary=[]，projectCompletedItem 对 item.summary 仅做 truthy 判断。",
            "evidence": [
              "arckit-runtime://runs/RUN-20260810-172138193Z",
              "runtime/arckit-runtime/src/projection/run-event-projector.mjs:326",
              "~/.codex/sessions response_item reasoning summary=[]"
            ]
          },
          {
            "id": "FACT-TRANSCRIPT-006",
            "revision": 1,
            "status": "accepted",
            "statement": "raw arckit-agent-loop-result/v1 JSON 来自 schema-bound Codex agentMessage delta；同一 Runtime round 已通过 runtime.agent_loop.completed 提供原始 summary，因此前者属于结构化结果数据，后者属于正式自然语言消息。",
            "basis": "最新 Run activity 的 agent_text/stream content 与 agent-loop payload 完全一致，projector 同时把 runtime.agent_loop.completed.summary 投影为 result message。",
            "evidence": [
              "arckit-runtime://runs/RUN-20260810-172138193Z",
              "runtime/arckit-runtime/src/projection/run-event-projector.mjs:124",
              "runtime/arckit-runtime/src/projection/run-event-projector.mjs:70"
            ]
          }
        ],
        "facts_superseded": [],
        "impacts_added": [],
        "impacts_updated": [
          {
            "id": "IMPACT-TRANSCRIPT-001",
            "fact_id": "FACT-TRANSCRIPT-001",
            "fact_revision": 1,
            "target": {
              "kind": "software_decision",
              "ref": "experience_and_interaction",
              "revision": 2
            },
            "effect": "threatened",
            "reason": "展示合同已经明确，但 projector 与 renderer 尚未实现空 reasoning 抑制、完成后折叠和结构化结果查看器。",
            "gap_ids": [
              "GAP-TRANSCRIPT-IMPLEMENT-001"
            ],
            "evidence": [
              "arckit/interaction/automation-workspace/interaction.md",
              "arckit/interaction/automation-workspace/intervention-workbench.html",
              "runtime/arckit-runtime/src/projection/run-event-projector.mjs",
              "runtime/arckit-runtime/desktop/renderer/renderer.js"
            ]
          },
          {
            "id": "IMPACT-TRANSCRIPT-002",
            "fact_id": "FACT-TRANSCRIPT-003",
            "fact_revision": 1,
            "target": {
              "kind": "software_decision",
              "ref": "visual_language",
              "revision": 2
            },
            "effect": "threatened",
            "reason": "六类消息视觉层级已持久化，但生产 renderer 尚未投影 ReasoningDisclosure 和 StructuredResult。",
            "gap_ids": [
              "GAP-TRANSCRIPT-IMPLEMENT-001"
            ],
            "evidence": [
              "arckit/visual/_library/brief.md",
              "arckit/visual/_library/component-catalog.yaml",
              "runtime/arckit-runtime/desktop/renderer/styles.css"
            ]
          },
          {
            "id": "IMPACT-TRANSCRIPT-003",
            "fact_id": "FACT-TRANSCRIPT-004",
            "fact_revision": 1,
            "target": {
              "kind": "software_decision",
              "ref": "data_and_state",
              "revision": 1
            },
            "effect": "threatened",
            "reason": "structured_data 与非空 reasoning 投影合同已明确，但 Desktop message 生产代码尚未实现。",
            "gap_ids": [
              "GAP-TRANSCRIPT-IMPLEMENT-001"
            ],
            "evidence": [
              "arckit/tech/arckit-runtime/desktop-execution-solution.md",
              "runtime/arckit-runtime/src/projection/run-event-projector.mjs"
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
          "现有 settled experience_and_interaction、visual_language 与 data_and_state 决策足以承载本 Case；本轮只固化页面级和技术投影合同。"
        ]
      },
      "evidence": [
        "arckit-runtime://runs/RUN-20260810-172138193Z",
        "arckit/interaction/automation-workspace/interaction.md",
        "arckit/interaction/automation-workspace/intervention-workbench.html",
        "arckit/visual/_library/brief.md",
        "arckit/visual/_library/component-catalog.yaml",
        "arckit/tech/arckit-runtime/desktop-execution-solution.md",
        "runtime/arckit-runtime/src/projection/run-event-projector.mjs",
        "runtime/arckit-runtime/desktop/renderer/renderer.js"
      ],
      "runtime_result_ref": "",
      "occurred_at": "2026-08-11T03:06:23.202Z"
    },
    {
      "round": 2,
      "goal": "实现并验证语义化 transcript 投影与展示，使真实 Codex 输出按 accepted contract 清晰、简洁、保真呈现。",
      "outcome": "completed",
      "selected_gap": {
        "id": "GAP-TRANSCRIPT-IMPLEMENT-001",
        "responsibility": "agent",
        "goal": "实现并验证语义化 transcript 投影与展示，使真实 Codex 输出按 accepted contract 清晰、简洁、保真呈现。",
        "reason": "当前生产代码仍产生空 reasoning 行并把结构化输出显示为普通 JSON 气泡。",
        "derived_from": [
          "FACT-TRANSCRIPT-001",
          "FACT-TRANSCRIPT-002",
          "FACT-TRANSCRIPT-003",
          "FACT-TRANSCRIPT-004"
        ],
        "blocked_by": [
          "GAP-TRANSCRIPT-CONTRACT-001"
        ],
        "priority_basis": {
          "blocking": "blocked by presentation contract",
          "uncertainty": "medium around streamed structured-output lifecycle",
          "risk": "high regression risk across persisted and live transcripts",
          "user_impact": "high"
        },
        "evidence_required": [
          "projector/presentation/renderer automated tests covering empty and non-empty reasoning, structured result viewing, formal summaries and tool rows",
          "production code inspection and full Runtime check",
          "source/projection consistency evidence"
        ]
      },
      "planned_transition": {
        "goal": "实现并验证语义化 transcript 投影与展示，使真实 Codex 输出按 accepted contract 清晰、简洁、保真呈现。",
        "expected_state_change": "关闭 transcript 实现 gap，接受投影、展示和验证事实，并进入独立 Completion Review。"
      },
      "accepted_state_delta": {
        "resolved_gap": {
          "id": "GAP-TRANSCRIPT-IMPLEMENT-001",
          "status": "resolved",
          "outcome": "已实现语义化 transcript 投影和原值展示：空 reasoning 不显示，非空 reasoning 流式展开且完成后默认收起，正式自然语言保持主消息，schema payload 使用专用查看器，工具调用保持单行活动说明。",
          "reason": "生产代码、聚焦回归、完整 Runtime check 与最新真实 Run 兼容回放形成一致证据。",
          "evidence": [
            "arckit-runtime://runs/RUN-20260810-172138193Z",
            "runtime/arckit-runtime/src/projection/run-event-projector.mjs",
            "runtime/arckit-runtime/src/desktop/transcript-presentation.mjs",
            "runtime/arckit-runtime/desktop/renderer/renderer.js",
            "runtime/arckit-runtime/desktop/renderer/styles.css",
            "runtime/arckit-runtime/test/token-usage-projector.test.mjs",
            "runtime/arckit-runtime/test/desktop-renderer.test.mjs",
            "npm --prefix runtime/arckit-runtime run check: 102 pass, 0 fail, 1 opt-in Electron layout skip",
            "latest Run compatibility replay: 54 empty reasoning hidden; 1 schema payload classified structured"
          ]
        },
        "facts_added": [
          {
            "id": "FACT-TRANSCRIPT-007",
            "revision": 1,
            "status": "accepted",
            "statement": "Runtime projector 现在按 Codex item/event 语义直接区分 reasoning、正式 Agent 输出与 schema-bound structured result；renderer 对非空 reasoning 使用完成后折叠的 disclosure，对 structured result 使用字段查看器并保留原始 JSON，旧 Run 的 raw schema 消息也可直接识别。",
            "basis": "生产 projector、presentation helper、renderer 与 focused tests 一致。",
            "evidence": [
              "runtime/arckit-runtime/src/projection/run-event-projector.mjs",
              "runtime/arckit-runtime/src/desktop/transcript-presentation.mjs",
              "runtime/arckit-runtime/desktop/renderer/renderer.js",
              "runtime/arckit-runtime/desktop/renderer/styles.css",
              "runtime/arckit-runtime/test/token-usage-projector.test.mjs",
              "runtime/arckit-runtime/test/desktop-renderer.test.mjs"
            ]
          },
          {
            "id": "FACT-TRANSCRIPT-008",
            "revision": 1,
            "status": "accepted",
            "statement": "聚焦 transcript 测试 22/22 通过，完整 Runtime check 为 102 pass、0 fail、1 个需显式启用的 Electron 布局用例跳过；最新真实 Run 回放会隐藏全部 54 条空 reasoning，并将原始 loop-result JSON 识别为结构化结果。",
            "basis": "本轮自动化命令和实际持久化 Run 的 presentation 回放统计。",
            "evidence": [
              "runtime/arckit-runtime/test/token-usage-projector.test.mjs",
              "runtime/arckit-runtime/test/desktop-renderer.test.mjs",
              "npm --prefix runtime/arckit-runtime run check: 102 pass, 0 fail, 1 opt-in Electron layout skip",
              "latest Run compatibility replay: 54 empty reasoning hidden; 1 schema payload classified structured"
            ]
          }
        ],
        "facts_superseded": [],
        "impacts_added": [],
        "impacts_updated": [
          {
            "id": "IMPACT-TRANSCRIPT-001",
            "fact_id": "FACT-TRANSCRIPT-001",
            "fact_revision": 1,
            "target": {
              "kind": "software_decision",
              "ref": "experience_and_interaction",
              "revision": 2
            },
            "effect": "upheld",
            "reason": "生产 projector 与 renderer 已实现空 reasoning 抑制、非空 reasoning 生命周期 disclosure、正式输出分层和结构化结果查看器。",
            "gap_ids": [],
            "evidence": [
              "arckit-runtime://runs/RUN-20260810-172138193Z",
              "runtime/arckit-runtime/src/projection/run-event-projector.mjs",
              "runtime/arckit-runtime/src/desktop/transcript-presentation.mjs",
              "runtime/arckit-runtime/desktop/renderer/renderer.js",
              "runtime/arckit-runtime/desktop/renderer/styles.css",
              "runtime/arckit-runtime/test/token-usage-projector.test.mjs",
              "runtime/arckit-runtime/test/desktop-renderer.test.mjs",
              "npm --prefix runtime/arckit-runtime run check: 102 pass, 0 fail, 1 opt-in Electron layout skip",
              "latest Run compatibility replay: 54 empty reasoning hidden; 1 schema payload classified structured"
            ]
          },
          {
            "id": "IMPACT-TRANSCRIPT-002",
            "fact_id": "FACT-TRANSCRIPT-003",
            "fact_revision": 1,
            "target": {
              "kind": "software_decision",
              "ref": "visual_language",
              "revision": 2
            },
            "effect": "upheld",
            "reason": "Workbench transcript 已按持久视觉策略实现克制的 reasoning disclosure、结构化结果层级和原始 JSON 次级入口。",
            "gap_ids": [],
            "evidence": [
              "arckit-runtime://runs/RUN-20260810-172138193Z",
              "runtime/arckit-runtime/src/projection/run-event-projector.mjs",
              "runtime/arckit-runtime/src/desktop/transcript-presentation.mjs",
              "runtime/arckit-runtime/desktop/renderer/renderer.js",
              "runtime/arckit-runtime/desktop/renderer/styles.css",
              "runtime/arckit-runtime/test/token-usage-projector.test.mjs",
              "runtime/arckit-runtime/test/desktop-renderer.test.mjs",
              "npm --prefix runtime/arckit-runtime run check: 102 pass, 0 fail, 1 opt-in Electron layout skip",
              "latest Run compatibility replay: 54 empty reasoning hidden; 1 schema payload classified structured"
            ]
          },
          {
            "id": "IMPACT-TRANSCRIPT-003",
            "fact_id": "FACT-TRANSCRIPT-004",
            "fact_revision": 1,
            "target": {
              "kind": "software_decision",
              "ref": "data_and_state",
              "revision": 1
            },
            "effect": "upheld",
            "reason": "Desktop message 投影已保留 structured_data 原值和 raw 文本，并把 reasoning 数组语义化归一而不生成空消息。",
            "gap_ids": [],
            "evidence": [
              "arckit-runtime://runs/RUN-20260810-172138193Z",
              "runtime/arckit-runtime/src/projection/run-event-projector.mjs",
              "runtime/arckit-runtime/src/desktop/transcript-presentation.mjs",
              "runtime/arckit-runtime/desktop/renderer/renderer.js",
              "runtime/arckit-runtime/desktop/renderer/styles.css",
              "runtime/arckit-runtime/test/token-usage-projector.test.mjs",
              "runtime/arckit-runtime/test/desktop-renderer.test.mjs",
              "npm --prefix runtime/arckit-runtime run check: 102 pass, 0 fail, 1 opt-in Electron layout skip",
              "latest Run compatibility replay: 54 empty reasoning hidden; 1 schema payload classified structured"
            ]
          },
          {
            "id": "IMPACT-TRANSCRIPT-004",
            "fact_id": "FACT-TRANSCRIPT-003",
            "fact_revision": 1,
            "target": {
              "kind": "software_invariant",
              "ref": "accepted-facts-are-realized",
              "revision": null
            },
            "effect": "upheld",
            "reason": "已接受的六类消息层级、折叠和保真规则已落实到生产投影、presentation 与 renderer。",
            "gap_ids": [],
            "evidence": [
              "arckit-runtime://runs/RUN-20260810-172138193Z",
              "runtime/arckit-runtime/src/projection/run-event-projector.mjs",
              "runtime/arckit-runtime/src/desktop/transcript-presentation.mjs",
              "runtime/arckit-runtime/desktop/renderer/renderer.js",
              "runtime/arckit-runtime/desktop/renderer/styles.css",
              "runtime/arckit-runtime/test/token-usage-projector.test.mjs",
              "runtime/arckit-runtime/test/desktop-renderer.test.mjs",
              "npm --prefix runtime/arckit-runtime run check: 102 pass, 0 fail, 1 opt-in Electron layout skip",
              "latest Run compatibility replay: 54 empty reasoning hidden; 1 schema payload classified structured"
            ]
          },
          {
            "id": "IMPACT-TRANSCRIPT-005",
            "fact_id": "FACT-TRANSCRIPT-004",
            "fact_revision": 1,
            "target": {
              "kind": "software_invariant",
              "ref": "material-risks-have-credible-evidence",
              "revision": null
            },
            "effect": "upheld",
            "reason": "聚焦测试、完整 Runtime check 与最新真实 Run 兼容回放共同覆盖主要回归风险。",
            "gap_ids": [],
            "evidence": [
              "arckit-runtime://runs/RUN-20260810-172138193Z",
              "runtime/arckit-runtime/src/projection/run-event-projector.mjs",
              "runtime/arckit-runtime/src/desktop/transcript-presentation.mjs",
              "runtime/arckit-runtime/desktop/renderer/renderer.js",
              "runtime/arckit-runtime/desktop/renderer/styles.css",
              "runtime/arckit-runtime/test/token-usage-projector.test.mjs",
              "runtime/arckit-runtime/test/desktop-renderer.test.mjs",
              "npm --prefix runtime/arckit-runtime run check: 102 pass, 0 fail, 1 opt-in Electron layout skip",
              "latest Run compatibility replay: 54 empty reasoning hidden; 1 schema payload classified structured"
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
          "现有 settled 交互、视觉、数据与状态决策未被改变；本轮实现其既定语义。"
        ]
      },
      "evidence": [
        "arckit-runtime://runs/RUN-20260810-172138193Z",
        "runtime/arckit-runtime/src/projection/run-event-projector.mjs",
        "runtime/arckit-runtime/src/desktop/transcript-presentation.mjs",
        "runtime/arckit-runtime/desktop/renderer/renderer.js",
        "runtime/arckit-runtime/desktop/renderer/styles.css",
        "runtime/arckit-runtime/test/token-usage-projector.test.mjs",
        "runtime/arckit-runtime/test/desktop-renderer.test.mjs",
        "npm --prefix runtime/arckit-runtime run check: 102 pass, 0 fail, 1 opt-in Electron layout skip",
        "latest Run compatibility replay: 54 empty reasoning hidden; 1 schema payload classified structured"
      ],
      "runtime_result_ref": "",
      "occurred_at": "2026-08-11T03:15:19.934Z"
    },
    {
      "round": 3,
      "goal": "Review the completed implementation for correctness, real problem resolution, verification credibility, regression risk, and minimality.",
      "outcome": "completed",
      "selected_gap": {
        "id": "CASE-20260811-001:completion-review:1",
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
        "expected_state_change": "对 content_revision 2 做无内容变更的独立审查；若五维均 clean，则关闭 Case。"
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
            "runtime/arckit-runtime/src/projection/run-event-projector.mjs",
            "runtime/arckit-runtime/src/desktop/transcript-presentation.mjs",
            "runtime/arckit-runtime/desktop/renderer/renderer.js",
            "runtime/arckit-runtime/desktop/renderer/styles.css",
            "runtime/arckit-runtime/test/token-usage-projector.test.mjs: focused empty/non-empty reasoning and structured/formal output lifecycle coverage",
            "runtime/arckit-runtime/test/desktop-renderer.test.mjs: visibility, legacy JSON, exact raw and viewer contract coverage",
            "npm --prefix runtime/arckit-runtime run check: 102 pass, 0 fail, 1 opt-in Electron layout skip",
            "arckit-runtime://runs/RUN-20260810-172138193Z compatibility replay: 54 empty reasoning hidden; 1 schema payload classified structured; formal/tool/Loop records retained",
            "git diff --check: clean",
            "arckit/interaction/automation-workspace/interaction.md",
            "arckit/visual/_library/component-catalog.yaml",
            "arckit/tech/arckit-runtime/desktop-execution-solution.md"
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
        "evidence": [
          "Completion Review 确认既有 settled Project State 仍成立，无需提高或改写决策。"
        ]
      },
      "evidence": [
        "runtime/arckit-runtime/src/projection/run-event-projector.mjs",
        "runtime/arckit-runtime/src/desktop/transcript-presentation.mjs",
        "runtime/arckit-runtime/desktop/renderer/renderer.js",
        "runtime/arckit-runtime/desktop/renderer/styles.css",
        "runtime/arckit-runtime/test/token-usage-projector.test.mjs: focused empty/non-empty reasoning and structured/formal output lifecycle coverage",
        "runtime/arckit-runtime/test/desktop-renderer.test.mjs: visibility, legacy JSON, exact raw and viewer contract coverage",
        "npm --prefix runtime/arckit-runtime run check: 102 pass, 0 fail, 1 opt-in Electron layout skip",
        "arckit-runtime://runs/RUN-20260810-172138193Z compatibility replay: 54 empty reasoning hidden; 1 schema payload classified structured; formal/tool/Loop records retained",
        "git diff --check: clean",
        "arckit/interaction/automation-workspace/interaction.md",
        "arckit/visual/_library/component-catalog.yaml",
        "arckit/tech/arckit-runtime/desktop-execution-solution.md"
      ],
      "runtime_result_ref": "",
      "occurred_at": "2026-08-11T03:16:07.510Z"
    }
  ],
  "case_resolution": {
    "status": "resolved",
    "stage": "resolved",
    "satisfied": [
      "GAP-TRANSCRIPT-CONTRACT-001",
      "GAP-TRANSCRIPT-IMPLEMENT-001"
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
    "updated_at": "2026-08-11T03:16:07.510Z"
  }
}
```

## Round Notes

- Case history is canonical in Structured Record.rounds; keep prose notes exceptional.
