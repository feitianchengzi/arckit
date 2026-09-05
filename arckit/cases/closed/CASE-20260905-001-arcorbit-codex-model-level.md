# ArcOrbit 设置页支持 Codex Model 与 Level 配置

Case: CASE-20260905-001
Status: closed
Artifact Type: mixed
Selected Gap: none
Updated: 2026-09-05T05:12:39.343Z

## User Intent

调查 Codex 是否提供 Model 和 Level 清单接口；可获取时提供动态配置，否则提供人工输入框，并将默认配置改为 gpt-6-astra high。

## Structured Record

```json
{
  "schema_version": "development-case-record/v5",
  "id": "CASE-20260905-001",
  "title": "ArcOrbit 设置页支持 Codex Model 与 Level 配置",
  "status": "closed",
  "artifact_type": "mixed",
  "created_at": "2026-09-05T04:29:47.269Z",
  "updated_at": "2026-09-05T05:12:39.343Z",
  "user_intent": "调查 Codex 是否提供 Model 和 Level 清单接口；可获取时提供动态配置，否则提供人工输入框，并将默认配置改为 gpt-6-astra high。",
  "expected_outcome": "用户可以在 ArcOrbit 设置页修改并持久保存 Codex Model 与 Level；选项来自经验证的接口或人工输入，执行使用保存的配置，未配置时默认 gpt-6-astra / high。",
  "project_state_ref": "arckit/project/state.record.json",
  "current_round": {
    "goal": "",
    "selected_gap": null
  },
  "facts": [
    {
      "id": "FACT-20260905-001-001",
      "revision": 1,
      "status": "accepted",
      "statement": "用户要求 ArcOrbit 设置页支持修改 Codex Model 和 Level：存在可用清单接口时动态提供选项，无法获取时提供人工输入框；默认配置指定为 gpt-6-astra / high。",
      "basis": "当前用户明确指令。",
      "evidence": [
        "original_user_input，2026-09-05"
      ]
    },
    {
      "id": "FACT-20260905-001-002",
      "revision": 1,
      "status": "accepted",
      "statement": "Codex app-server 提供分页 model/list，模型包含 supportedReasoningEfforts 和 defaultReasoningEffort；turn/start 使用 model 与 effort。当前本机 Codex 0.153.4 查询返回七个可见模型，gpt-6-astra 支持 high，清单推荐默认级别为 medium，不能替代用户指定的 ArcOrbit high 默认值。",
      "basis": "本机生成协议、真实只读分页查询及官方 app-server 文档相互印证；清单结果只代表本次 Codex 上下文，不证明所有账户的执行授权。",
      "evidence": [
        "arckit/tech/arcorbit/desktop-execution-solution.md",
        "/private/tmp/arcorbit-codex-model-protocol/v2/Model.ts",
        "/private/tmp/arcorbit-codex-model-protocol/v2/TurnStartParams.ts",
        "https://learn.chatgpt.com/docs/app-server#list-models-modellist"
      ]
    },
    {
      "id": "FACT-20260905-001-003",
      "revision": 1,
      "status": "superseded",
      "statement": "ArcOrbit 当前设置归一化和公开投影没有 Model/Level 字段。Chat 每次 consumeTurn 读取设置但只使用 proxy；Automation 只在 Run 启动 input.model 存在时传 --model，同一 Run 的后续轮次复用启动 options。共享 adapter 已传 model，未传 effort；交互式 CLI resume 当前没有额外模型覆盖。设置页能力与 gpt-6-astra/high 默认值尚未实现。",
      "basis": "对设置 Renderer、Desktop Store、Run Manager、Chat Coordinator、CLI、state-driven runner、共享 adapter 和交互式 launcher 的直接源码追踪。",
      "evidence": [
        "arckit/tech/arcorbit/desktop-execution-solution.md",
        "runtime/arcorbit/src/desktop/desktop-store.mjs",
        "runtime/arcorbit/src/desktop-run-manager.mjs",
        "runtime/arcorbit/src/chat-coordinator.mjs",
        "runtime/arcorbit/src/cli.mjs",
        "runtime/arcorbit/src/state-driven-runner.mjs",
        "runtime/arcorbit/adapters/codex-app-server-adapter.mjs",
        "runtime/arcorbit/src/interactive-cli-launcher.mjs"
      ]
    },
    {
      "id": "FACT-20260905-001-004",
      "revision": 1,
      "status": "accepted",
      "statement": "ArcOrbit 设置提供动态 Model 和模型对应 Level 候选，始终允许人工输入；完整分页查询失败时保留人工兜底。Desktop Store 保存当前设备 codex.model/reasoning_effort，缺省 gpt-6-astra/high，保留未知有效用户值。独立保存原位反馈，查询不覆盖草稿。Chat 每消息读取配置，Automation 在 Run 启动固定并记录配置，CLI 与共享 adapter 传入 model/effort，保持已有 thread；用户全局 Codex 配置不被改写。",
      "basis": "用户已接受要求、稳定产品/交互/技术事实、直接实现、持久恢复与参数传递测试、真实 Electron 行为和本机清单查询相互印证。",
      "evidence": [
        "arckit/spec/arcorbit-distribution.md",
        "arckit/interaction/automation-workspace/interaction.md",
        "arckit/interaction/automation-workspace/authentication.html",
        "arckit/tech/arcorbit/desktop-execution-solution.md",
        "runtime/arcorbit/test/codex-model-settings.test.mjs",
        "runtime/arcorbit/test/codex-settings-electron.test.mjs",
        "runtime/arcorbit/test/desktop-run-manager.test.mjs",
        "runtime/arcorbit/test/chat-coordinator.test.mjs",
        "runtime/arcorbit/test/codex-app-server-adapter.test.mjs"
      ]
    }
  ],
  "state_impacts": [
    {
      "id": "IMPACT-20260905-001-001",
      "fact_id": "FACT-20260905-001-004",
      "fact_revision": 1,
      "target": {
        "kind": "software_invariant",
        "ref": "accepted-facts-are-realized",
        "revision": null
      },
      "effect": "upheld",
      "reason": "原设置与执行断点已消除，用户要求通过实现和行为证据兑现。",
      "gap_ids": [],
      "evidence": [
        "runtime/arcorbit/test/codex-model-settings.test.mjs",
        "runtime/arcorbit/test/codex-settings-electron.test.mjs",
        "runtime/arcorbit/test/desktop-run-manager.test.mjs",
        "runtime/arcorbit/test/chat-coordinator.test.mjs",
        "runtime/arcorbit/test/codex-app-server-adapter.test.mjs",
        "arckit/tech/arcorbit/desktop-execution-solution.md"
      ]
    }
  ],
  "gaps": [
    {
      "id": "GAP-20260905-001-001",
      "status": "resolved",
      "goal": "确认 Codex Model、Level 清单的接口可用性，以及 ArcOrbit 当前配置存储、执行传递和生效边界。",
      "reason": "清单接口及其失败行为尚未验证；这些事实决定动态选项或人工输入的实现与验收范围，需要先建立可信依据。",
      "derived_from": [
        "FACT-20260905-001-001"
      ],
      "blocked_by": [],
      "priority_basis": {
        "blocking": "决定设置控件与配置传递的实现边界",
        "uncertainty": "清单接口、模型对应 Level 和运行中配置生效方式尚未确认",
        "risk": "配置若未贯通执行路径，设置保存后可能不生效",
        "user_impact": "直接支撑用户修改 Codex Model 和 Level 的请求"
      },
      "responsibility": "agent",
      "evidence_required": [
        "本地 Codex 协议或官方资料对模型及推理级别查询契约的证据",
        "清单获取成功、不可用或失败时的边界结论",
        "ArcOrbit 设置存储到 Codex 执行参数的源码追踪",
        "gpt-6-astra / high 默认值的适用位置与现有用户配置保留边界"
      ],
      "resolution": {
        "id": "GAP-20260905-001-001",
        "status": "resolved",
        "outcome": "已确认 model/list 的分页与模型级 reasoning effort 契约，并完成 ArcOrbit 设置、Chat、Automation、CLI 和 adapter 的配置路径追踪。",
        "reason": "本机 Codex 0.153.4 协议生成、四页真实清单查询、官方文档与源码证据一致，足以确定动态清单可用及后续实现边界。",
        "evidence": [
          "arckit/tech/arcorbit/desktop-execution-solution.md#codex-model--level-接口调查2026-09-05",
          "codex app-server generate-ts --out /private/tmp/arcorbit-codex-model-protocol",
          "真实 initialize → initialized → model/list 查询：limit=2，4 页，7 个模型，末页 nextCursor=null",
          "https://learn.chatgpt.com/docs/app-server#list-models-modellist"
        ],
        "occurred_at": "2026-09-05T04:39:18.277Z"
      }
    },
    {
      "id": "GAP-20260905-001-002",
      "status": "resolved",
      "goal": "兑现 ArcOrbit 设置页的 Codex Model/Level 动态配置与人工输入兜底，并证明保存值、gpt-6-astra/high 默认值及实际执行生效一致。",
      "reason": "接口调查已证明动态清单可用，但当前设置和执行路径缺少字段与 effort 传递；产品、交互、生效时间及失败恢复预期也需要与实现共同保持可恢复。",
      "derived_from": [
        "FACT-20260905-001-001",
        "FACT-20260905-001-002",
        "FACT-20260905-001-003"
      ],
      "blocked_by": [],
      "priority_basis": {
        "blocking": "用户需求尚未兑现",
        "uncertainty": "保存、生效与失败恢复尚无行为验证",
        "risk": "字段丢失、运行参数遗漏或清单刷新覆盖用户选择",
        "user_impact": "用户能在设置页修改实际使用的 Model 和 Level"
      },
      "responsibility": "agent",
      "evidence_required": [
        "设置页动态模型清单、模型对应 Level、人工输入和查询失败恢复证据",
        "缺失配置默认 gpt-6-astra/high、保存后重启恢复及用户值保留证据",
        "Chat 和 Automation 的模型及 effort 参数传递、生效时间与持久 thread 连续性验证",
        "可信 main-process 查询边界及有限 Renderer IPC",
        "产品、交互与技术长期事实和实现行为一致",
        "针对分页、失败、未知当前值、保存及执行参数的必要回归证据"
      ],
      "resolution": {
        "id": "GAP-20260905-001-002",
        "status": "resolved",
        "outcome": "Model/Level 配置已实现并验证：动态候选、人工输入、默认 gpt-6-astra/high、持久保存，以及 Chat 下一消息和 Automation 下一 Run 生效。",
        "reason": "设置 UI、主进程查询与 Store、CLI 和 adapter 链路完成；必要行为回归、真实 Electron 页面及本机只读清单查询支持验收。",
        "evidence": [
          "arckit/spec/arcorbit-distribution.md",
          "arckit/interaction/automation-workspace/interaction.md",
          "arckit/interaction/automation-workspace/authentication.html",
          "arckit/tech/arcorbit/desktop-execution-solution.md",
          "runtime/arcorbit/test/codex-model-settings.test.mjs",
          "runtime/arcorbit/test/codex-settings-electron.test.mjs",
          "runtime/arcorbit/test/desktop-run-manager.test.mjs",
          "runtime/arcorbit/test/chat-coordinator.test.mjs",
          "runtime/arcorbit/test/codex-app-server-adapter.test.mjs"
        ],
        "occurred_at": "2026-09-05T05:05:53.764Z"
      }
    }
  ],
  "content_revision": 2,
  "completion_review": {
    "status": "clean",
    "policy": {
      "initial_max_cycles": 10,
      "source": "runtime/arcorbit/config/case-policy.json",
      "snapshotted_at": "2026-09-05T04:29:47.269Z"
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
          "实现正确性：runtime/arcorbit/src/codex-model-settings.mjs、codex-model-catalog.mjs、desktop/desktop-store.mjs 与 desktop-run-manager.mjs 实现字段校验、完整分页、失败兜底及持久成功后发布状态；desktop/renderer/codex-settings-form.mjs 保留草稿并隔离过期响应。",
          "需求兑现：arckit/spec/arcorbit-distribution.md、arckit/interaction/automation-workspace/interaction.md 与 arckit/tech/arcorbit/desktop-execution-solution.md 对动态候选、人工输入、gpt-6-astra/high 默认值和保存生效时机的要求与实现一致。",
          "验证可信度：复核上一轮授权环境完整套件日志 /private/tmp/arcorbit-model-full-check-authorized.log：585 passed、26 skipped、0 failed；最终定向日志 /private/tmp/arcorbit-model-final-targeted.log：24 passed、0 failed。本轮未重复执行这些测试。",
          "验证可信度：runtime/arcorbit/test/codex-settings-electron.test.mjs 加载生产 Renderer；上一轮独立启用 GUI 测试为 1 passed、0 failed。本轮审查测试实现与已接受结果，未把完整套件中的跳过项计为通过。",
          "回归风险：runtime/arcorbit/test/desktop-run-manager.test.mjs、chat-coordinator.test.mjs 与 codex-app-server-adapter.test.mjs 覆盖保存恢复、下一消息/下一 Run 参数和原 thread 连续性；codex-model-settings.test.mjs 覆盖分页失败、超时关闭调用及旧响应隔离。",
          "最小性：变更限定于配置归一化、独立清单查询、现有设置页、执行参数传递、相应测试与长期文档；复用既有 IPC、Store、app-server 客户端和视觉样式，无新增依赖或独立执行线程。"
        ],
        "occurred_at": "2026-09-05T05:12:39.343Z"
      }
    ],
    "evidence": [
      "实现正确性：runtime/arcorbit/src/codex-model-settings.mjs、codex-model-catalog.mjs、desktop/desktop-store.mjs 与 desktop-run-manager.mjs 实现字段校验、完整分页、失败兜底及持久成功后发布状态；desktop/renderer/codex-settings-form.mjs 保留草稿并隔离过期响应。",
      "需求兑现：arckit/spec/arcorbit-distribution.md、arckit/interaction/automation-workspace/interaction.md 与 arckit/tech/arcorbit/desktop-execution-solution.md 对动态候选、人工输入、gpt-6-astra/high 默认值和保存生效时机的要求与实现一致。",
      "验证可信度：复核上一轮授权环境完整套件日志 /private/tmp/arcorbit-model-full-check-authorized.log：585 passed、26 skipped、0 failed；最终定向日志 /private/tmp/arcorbit-model-final-targeted.log：24 passed、0 failed。本轮未重复执行这些测试。",
      "验证可信度：runtime/arcorbit/test/codex-settings-electron.test.mjs 加载生产 Renderer；上一轮独立启用 GUI 测试为 1 passed、0 failed。本轮审查测试实现与已接受结果，未把完整套件中的跳过项计为通过。",
      "回归风险：runtime/arcorbit/test/desktop-run-manager.test.mjs、chat-coordinator.test.mjs 与 codex-app-server-adapter.test.mjs 覆盖保存恢复、下一消息/下一 Run 参数和原 thread 连续性；codex-model-settings.test.mjs 覆盖分页失败、超时关闭调用及旧响应隔离。",
      "最小性：变更限定于配置归一化、独立清单查询、现有设置页、执行参数传递、相应测试与长期文档；复用既有 IPC、Store、app-server 客户端和视觉样式，无新增依赖或独立执行线程。"
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
      "goal": "确认 Codex 清单接口与 ArcOrbit 当前配置存储、执行传递和生效边界。",
      "outcome": "completed",
      "gap_selection": {
        "mode": "candidate",
        "basis": "本次修复使用 Runtime 于 2026-09-05T04:36:14.828Z 提供的 fresh snapshot；Project、Case、候选和 selection token 未变化，保留原调查主张。",
        "snapshot_token": "fc6af94610f4d3eeed3ba6bc640eb1ca64094b8ca5df56af9f20bd162c9d120a",
        "selected_ref": "case-gap:CASE-20260905-001:GAP-20260905-001-001",
        "comparison_summary": "选择 Codex 配置调查；四个 Project Gap 与当前需求没有直接前置关系，暂缓；另一个 Case 的人工发布义务暂缓。",
        "fresh_discovery_summary": "选择时没有额外 fresh candidate。调查发现设置持久化、Level 参数传递和配置生效验证尚未实现，记录为后续 Gap。本次修复只纠正不变量引用前缀。",
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
              "user_impact": "验证通用 Agent 场景"
            },
            "reason": "不直接决定当前 Codex 设置能力。"
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
              "user_impact": "Runtime 长时运行恢复"
            },
            "reason": "本轮只调查具体配置契约，不扩大到通用韧性改造。"
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
              "user_impact": "真实权限边界验证"
            },
            "reason": "不构成清单只读调查的前置条件。"
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
              "user_impact": "跨记录一致性"
            },
            "reason": "当前没有证据表明其阻塞配置接口调查。"
          },
          {
            "ref": "case-gap:CASE-20260901-001:GAP-20260901-001-005",
            "source": "persisted",
            "eligibility": "ready",
            "disposition": "deferred",
            "priority_basis": {
              "blocking": "公共发布与源仓库归档",
              "uncertainty": "需要所有者证据",
              "risk": "high",
              "user_impact": ""
            },
            "reason": "属于独立 Case 的人工责任，不在本次配置需求范围内。"
          },
          {
            "ref": "case-gap:CASE-20260905-001:GAP-20260905-001-001",
            "source": "persisted",
            "eligibility": "ready",
            "disposition": "selected",
            "priority_basis": {
              "blocking": "决定设置控件与配置传递的实现边界",
              "uncertainty": "清单接口及运行中配置生效方式尚未确认",
              "risk": "设置保存后可能未传入实际执行",
              "user_impact": "直接支撑修改 Codex Model 和 Level"
            },
            "reason": "边界明确、可通过本地协议、真实查询和源码追踪验证。"
          }
        ]
      },
      "selected_gap": {
        "id": "GAP-20260905-001-001",
        "responsibility": "agent",
        "goal": "确认 Codex Model、Level 清单的接口可用性，以及 ArcOrbit 当前配置存储、执行传递和生效边界。",
        "reason": "清单接口及其失败行为尚未验证；这些事实决定动态选项或人工输入的实现与验收范围，需要先建立可信依据。",
        "derived_from": [
          "FACT-20260905-001-001"
        ],
        "blocked_by": [],
        "priority_basis": {
          "blocking": "决定设置控件与配置传递的实现边界",
          "uncertainty": "清单接口、模型对应 Level 和运行中配置生效方式尚未确认",
          "risk": "配置若未贯通执行路径，设置保存后可能不生效",
          "user_impact": "直接支撑用户修改 Codex Model 和 Level 的请求"
        },
        "evidence_required": [
          "本地 Codex 协议或官方资料对模型及推理级别查询契约的证据",
          "清单获取成功、不可用或失败时的边界结论",
          "ArcOrbit 设置存储到 Codex 执行参数的源码追踪",
          "gpt-6-astra / high 默认值的适用位置与现有用户配置保留边界"
        ]
      },
      "planned_transition": {
        "goal": "确认 Codex 清单接口与 ArcOrbit 当前配置存储、执行传递和生效边界。",
        "expected_state_change": "以协议产物、真实只读查询、官方资料和源码证据形成可恢复的调查结论，明确尚未实现的配置义务。"
      },
      "accepted_state_delta": {
        "resolved_gap": {
          "id": "GAP-20260905-001-001",
          "status": "resolved",
          "outcome": "已确认 model/list 的分页与模型级 reasoning effort 契约，并完成 ArcOrbit 设置、Chat、Automation、CLI 和 adapter 的配置路径追踪。",
          "reason": "本机 Codex 0.153.4 协议生成、四页真实清单查询、官方文档与源码证据一致，足以确定动态清单可用及后续实现边界。",
          "evidence": [
            "arckit/tech/arcorbit/desktop-execution-solution.md#codex-model--level-接口调查2026-09-05",
            "codex app-server generate-ts --out /private/tmp/arcorbit-codex-model-protocol",
            "真实 initialize → initialized → model/list 查询：limit=2，4 页，7 个模型，末页 nextCursor=null",
            "https://learn.chatgpt.com/docs/app-server#list-models-modellist"
          ]
        },
        "facts_added": [
          {
            "id": "FACT-20260905-001-002",
            "revision": 1,
            "status": "accepted",
            "statement": "Codex app-server 提供分页 model/list，模型包含 supportedReasoningEfforts 和 defaultReasoningEffort；turn/start 使用 model 与 effort。当前本机 Codex 0.153.4 查询返回七个可见模型，gpt-6-astra 支持 high，清单推荐默认级别为 medium，不能替代用户指定的 ArcOrbit high 默认值。",
            "basis": "本机生成协议、真实只读分页查询及官方 app-server 文档相互印证；清单结果只代表本次 Codex 上下文，不证明所有账户的执行授权。",
            "evidence": [
              "arckit/tech/arcorbit/desktop-execution-solution.md",
              "/private/tmp/arcorbit-codex-model-protocol/v2/Model.ts",
              "/private/tmp/arcorbit-codex-model-protocol/v2/TurnStartParams.ts",
              "https://learn.chatgpt.com/docs/app-server#list-models-modellist"
            ]
          },
          {
            "id": "FACT-20260905-001-003",
            "revision": 1,
            "status": "accepted",
            "statement": "ArcOrbit 当前设置归一化和公开投影没有 Model/Level 字段。Chat 每次 consumeTurn 读取设置但只使用 proxy；Automation 只在 Run 启动 input.model 存在时传 --model，同一 Run 的后续轮次复用启动 options。共享 adapter 已传 model，未传 effort；交互式 CLI resume 当前没有额外模型覆盖。设置页能力与 gpt-6-astra/high 默认值尚未实现。",
            "basis": "对设置 Renderer、Desktop Store、Run Manager、Chat Coordinator、CLI、state-driven runner、共享 adapter 和交互式 launcher 的直接源码追踪。",
            "evidence": [
              "arckit/tech/arcorbit/desktop-execution-solution.md",
              "runtime/arcorbit/src/desktop/desktop-store.mjs",
              "runtime/arcorbit/src/desktop-run-manager.mjs",
              "runtime/arcorbit/src/chat-coordinator.mjs",
              "runtime/arcorbit/src/cli.mjs",
              "runtime/arcorbit/src/state-driven-runner.mjs",
              "runtime/arcorbit/adapters/codex-app-server-adapter.mjs",
              "runtime/arcorbit/src/interactive-cli-launcher.mjs"
            ]
          }
        ],
        "facts_superseded": [],
        "impacts_added": [
          {
            "id": "IMPACT-20260905-001-001",
            "fact_id": "FACT-20260905-001-003",
            "fact_revision": 1,
            "target": {
              "kind": "software_invariant",
              "ref": "accepted-facts-are-realized",
              "revision": null
            },
            "effect": "threatened",
            "reason": "用户要求的设置能力尚未在持久化和实际执行中兑现。",
            "gap_ids": [
              "GAP-20260905-001-002"
            ],
            "evidence": [
              "arckit/tech/arcorbit/desktop-execution-solution.md",
              "runtime/arcorbit/src/desktop/desktop-store.mjs",
              "runtime/arcorbit/adapters/codex-app-server-adapter.mjs"
            ]
          }
        ],
        "impacts_updated": [],
        "gaps_added": [
          {
            "id": "GAP-20260905-001-002",
            "status": "open",
            "goal": "兑现 ArcOrbit 设置页的 Codex Model/Level 动态配置与人工输入兜底，并证明保存值、gpt-6-astra/high 默认值及实际执行生效一致。",
            "reason": "接口调查已证明动态清单可用，但当前设置和执行路径缺少字段与 effort 传递；产品、交互、生效时间及失败恢复预期也需要与实现共同保持可恢复。",
            "derived_from": [
              "FACT-20260905-001-001",
              "FACT-20260905-001-002",
              "FACT-20260905-001-003"
            ],
            "blocked_by": [],
            "priority_basis": {
              "blocking": "用户需求尚未兑现",
              "uncertainty": "保存、生效与失败恢复尚无行为验证",
              "risk": "字段丢失、运行参数遗漏或清单刷新覆盖用户选择",
              "user_impact": "用户能在设置页修改实际使用的 Model 和 Level"
            },
            "responsibility": "agent",
            "evidence_required": [
              "设置页动态模型清单、模型对应 Level、人工输入和查询失败恢复证据",
              "缺失配置默认 gpt-6-astra/high、保存后重启恢复及用户值保留证据",
              "Chat 和 Automation 的模型及 effort 参数传递、生效时间与持久 thread 连续性验证",
              "可信 main-process 查询边界及有限 Renderer IPC",
              "产品、交互与技术长期事实和实现行为一致",
              "针对分页、失败、未知当前值、保存及执行参数的必要回归证据"
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
        "evidence": [
          "本轮建立接口与现有实现事实，不宣称已采用或实现新的完整设置契约。",
          "arckit/tech/arcorbit/desktop-execution-solution.md"
        ]
      },
      "invariant_assessment": {
        "project_revision": 346,
        "judgments": [
          {
            "invariant_ref": "product-expectations-remain-recoverable",
            "disposition": "threatened",
            "reason": "新增设置能力和默认值已获用户明确要求，长期产品规格及其验收行为尚需落实。",
            "fact_refs": [
              "FACT-20260905-001-001",
              "FACT-20260905-001-003"
            ],
            "evidence": [
              "arckit/tech/arcorbit/desktop-execution-solution.md"
            ],
            "gap_refs": [
              "GAP-20260905-001-002"
            ]
          },
          {
            "invariant_ref": "interaction-expectations-remain-recoverable",
            "disposition": "threatened",
            "reason": "动态选项、人工输入、保存反馈、保留当前值与生效时间的完整交互尚未形成并验证。",
            "fact_refs": [
              "FACT-20260905-001-001",
              "FACT-20260905-001-003"
            ],
            "evidence": [
              "runtime/arcorbit/desktop/renderer/renderer.js",
              "arckit/tech/arcorbit/desktop-execution-solution.md"
            ],
            "gap_refs": [
              "GAP-20260905-001-002"
            ]
          },
          {
            "invariant_ref": "visual-language-remains-consistent",
            "disposition": "not_relevant",
            "reason": "本轮调查没有建立或改变主题、布局、视觉组件或平台呈现规则。",
            "fact_refs": [],
            "evidence": [],
            "gap_refs": []
          },
          {
            "invariant_ref": "technical-decisions-remain-explainable",
            "disposition": "upheld",
            "reason": "接口语义、当前配置路径、持久 thread 边界、可信查询边界和证据局限已并入既有执行技术文档；尚未实现部分被明确区分。",
            "fact_refs": [
              "FACT-20260905-001-002",
              "FACT-20260905-001-003"
            ],
            "evidence": [
              "arckit/tech/arcorbit/desktop-execution-solution.md",
              "arckit/tech/INDEX.md"
            ],
            "gap_refs": []
          },
          {
            "invariant_ref": "accepted-facts-are-realized",
            "disposition": "threatened",
            "reason": "现有软件尚不能通过设置页保存 Model/Level 并完整传入执行。",
            "fact_refs": [
              "FACT-20260905-001-001",
              "FACT-20260905-001-003"
            ],
            "evidence": [
              "runtime/arcorbit/src/desktop/desktop-store.mjs",
              "runtime/arcorbit/adapters/codex-app-server-adapter.mjs"
            ],
            "gap_refs": [
              "GAP-20260905-001-002"
            ]
          },
          {
            "invariant_ref": "material-risks-have-credible-evidence",
            "disposition": "undetermined",
            "reason": "清单成功已有真实证据，但设置实现的分页失败、存储保留、执行参数与生效时间风险尚无行为回归证据。",
            "fact_refs": [
              "FACT-20260905-001-002",
              "FACT-20260905-001-003"
            ],
            "evidence": [
              "arckit/tech/arcorbit/desktop-execution-solution.md"
            ],
            "gap_refs": [
              "GAP-20260905-001-002"
            ]
          }
        ]
      },
      "evidence": [
        "codex --version: codex-cli 0.153.4",
        "本地协议生成成功，确认 model/list 与 turn/start.effort",
        "沙箱外授权只读探测成功：4 页、7 个模型，无 thread/start 或 turn/start",
        "arckit/tech/arcorbit/desktop-execution-solution.md",
        "git diff --check: passed",
        "修复核验：当前安装包 semantic-case-command.mjs 要求 project:invariant: typed refs；隔离字段校验复现裸引用六项错误，补齐前缀后六项判断字段校验通过，未执行 ledger 写入。"
      ],
      "runtime_result_ref": "arckit-runtime://runs/RUN-20260905-042845702Z-0136bd62",
      "occurred_at": "2026-09-05T04:39:18.277Z"
    },
    {
      "round": 2,
      "transition_schema_version": "arckit-case-transition/v8",
      "goal": "兑现 Codex Model/Level 设置、动态清单与人工输入兜底，贯通保存和执行并验证其边界。",
      "outcome": "completed",
      "gap_selection": {
        "mode": "candidate",
        "basis": "依据 Runtime 提交后的 fresh snapshot 比较全部 persisted obligations，选择直接兑现当前用户请求的 Gap；收尾只读复核确认 Case token 未变化。",
        "snapshot_token": "2240bd5c762fbd1ceaa56e62cf3998ee7b23f61cf0c40fb55d784c81236b4e58",
        "selected_ref": "case-gap:CASE-20260905-001:GAP-20260905-001-002",
        "comparison_summary": "四个通用 Project Gap 均无当前实现前置关系；另一 Case 的发布门禁为人工责任；当前 Model/Level 配置 Gap 已有接口证据且可执行，优先完成。",
        "fresh_discovery_summary": "未发现需要另立 Gap 的工作；验证中出现的 Electron/Codex 沙箱限制经授权重跑排除。",
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
            "reason": "通用场景评估不构成本次配置实现的前置条件。"
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
            "reason": "通用 Runtime 韧性工作不阻塞已确认的设置与参数契约。"
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
            "reason": "真实权限项目验证属于独立范围；本轮保留既有主进程边界。"
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
            "reason": "跨记录审计属于独立 Project Gap，不阻塞当前用户能力。"
          },
          {
            "ref": "case-gap:CASE-20260901-001:GAP-20260901-001-005",
            "source": "persisted",
            "eligibility": "ready",
            "disposition": "deferred",
            "priority_basis": {
              "blocking": "",
              "uncertainty": "",
              "risk": "high",
              "user_impact": ""
            },
            "reason": "凭据、许可和公共发布属于另一 Case 的人工责任。"
          },
          {
            "ref": "case-gap:CASE-20260905-001:GAP-20260905-001-002",
            "source": "persisted",
            "eligibility": "ready",
            "disposition": "selected",
            "priority_basis": {
              "blocking": "用户需求尚未兑现",
              "uncertainty": "保存、生效与失败恢复尚无行为验证",
              "risk": "字段丢失、运行参数遗漏或清单刷新覆盖用户选择",
              "user_impact": "用户能在设置页修改实际使用的 Model 和 Level"
            },
            "reason": "接口调查已接受，当前唯一直接兑现用户设置需求的可执行 Gap。"
          }
        ]
      },
      "selected_gap": {
        "id": "GAP-20260905-001-002",
        "responsibility": "agent",
        "goal": "兑现 ArcOrbit 设置页的 Codex Model/Level 动态配置与人工输入兜底，并证明保存值、gpt-6-astra/high 默认值及实际执行生效一致。",
        "reason": "接口调查已证明动态清单可用，但当前设置和执行路径缺少字段与 effort 传递；产品、交互、生效时间及失败恢复预期也需要与实现共同保持可恢复。",
        "derived_from": [
          "FACT-20260905-001-001",
          "FACT-20260905-001-002",
          "FACT-20260905-001-003"
        ],
        "blocked_by": [],
        "priority_basis": {
          "blocking": "用户需求尚未兑现",
          "uncertainty": "保存、生效与失败恢复尚无行为验证",
          "risk": "字段丢失、运行参数遗漏或清单刷新覆盖用户选择",
          "user_impact": "用户能在设置页修改实际使用的 Model 和 Level"
        },
        "evidence_required": [
          "设置页动态模型清单、模型对应 Level、人工输入和查询失败恢复证据",
          "缺失配置默认 gpt-6-astra/high、保存后重启恢复及用户值保留证据",
          "Chat 和 Automation 的模型及 effort 参数传递、生效时间与持久 thread 连续性验证",
          "可信 main-process 查询边界及有限 Renderer IPC",
          "产品、交互与技术长期事实和实现行为一致",
          "针对分页、失败、未知当前值、保存及执行参数的必要回归证据"
        ]
      },
      "planned_transition": {
        "goal": "兑现 Codex Model/Level 设置、动态清单与人工输入兜底，贯通保存和执行并验证其边界。",
        "expected_state_change": "以实现和持久产品/交互/技术事实替代缺失能力的历史事实，解除现有 threatened impact，提交当前 Gap 的验收主张。"
      },
      "accepted_state_delta": {
        "resolved_gap": {
          "id": "GAP-20260905-001-002",
          "status": "resolved",
          "outcome": "Model/Level 配置已实现并验证：动态候选、人工输入、默认 gpt-6-astra/high、持久保存，以及 Chat 下一消息和 Automation 下一 Run 生效。",
          "reason": "设置 UI、主进程查询与 Store、CLI 和 adapter 链路完成；必要行为回归、真实 Electron 页面及本机只读清单查询支持验收。",
          "evidence": [
            "arckit/spec/arcorbit-distribution.md",
            "arckit/interaction/automation-workspace/interaction.md",
            "arckit/interaction/automation-workspace/authentication.html",
            "arckit/tech/arcorbit/desktop-execution-solution.md",
            "runtime/arcorbit/test/codex-model-settings.test.mjs",
            "runtime/arcorbit/test/codex-settings-electron.test.mjs",
            "runtime/arcorbit/test/desktop-run-manager.test.mjs",
            "runtime/arcorbit/test/chat-coordinator.test.mjs",
            "runtime/arcorbit/test/codex-app-server-adapter.test.mjs"
          ]
        },
        "facts_added": [
          {
            "id": "FACT-20260905-001-004",
            "revision": 1,
            "status": "accepted",
            "statement": "ArcOrbit 设置提供动态 Model 和模型对应 Level 候选，始终允许人工输入；完整分页查询失败时保留人工兜底。Desktop Store 保存当前设备 codex.model/reasoning_effort，缺省 gpt-6-astra/high，保留未知有效用户值。独立保存原位反馈，查询不覆盖草稿。Chat 每消息读取配置，Automation 在 Run 启动固定并记录配置，CLI 与共享 adapter 传入 model/effort，保持已有 thread；用户全局 Codex 配置不被改写。",
            "basis": "用户已接受要求、稳定产品/交互/技术事实、直接实现、持久恢复与参数传递测试、真实 Electron 行为和本机清单查询相互印证。",
            "evidence": [
              "arckit/spec/arcorbit-distribution.md",
              "arckit/interaction/automation-workspace/interaction.md",
              "arckit/interaction/automation-workspace/authentication.html",
              "arckit/tech/arcorbit/desktop-execution-solution.md",
              "runtime/arcorbit/test/codex-model-settings.test.mjs",
              "runtime/arcorbit/test/codex-settings-electron.test.mjs",
              "runtime/arcorbit/test/desktop-run-manager.test.mjs",
              "runtime/arcorbit/test/chat-coordinator.test.mjs",
              "runtime/arcorbit/test/codex-app-server-adapter.test.mjs"
            ]
          }
        ],
        "facts_superseded": [
          {
            "id": "FACT-20260905-001-003",
            "revision": 1,
            "reason": "调查时缺失设置字段和 effort 传递的事实已被本轮实现替代。",
            "evidence": [
              "runtime/arcorbit/src/desktop/desktop-store.mjs",
              "runtime/arcorbit/src/desktop-run-manager.mjs",
              "runtime/arcorbit/src/chat-coordinator.mjs",
              "runtime/arcorbit/src/cli.mjs",
              "runtime/arcorbit/adapters/codex-app-server-adapter.mjs",
              "arckit/tech/arcorbit/desktop-execution-solution.md"
            ]
          }
        ],
        "impacts_added": [],
        "impacts_updated": [
          {
            "id": "IMPACT-20260905-001-001",
            "fact_id": "FACT-20260905-001-004",
            "fact_revision": 1,
            "target": {
              "kind": "software_invariant",
              "ref": "accepted-facts-are-realized",
              "revision": null
            },
            "effect": "upheld",
            "reason": "原设置与执行断点已消除，用户要求通过实现和行为证据兑现。",
            "gap_ids": [],
            "evidence": [
              "runtime/arcorbit/test/codex-model-settings.test.mjs",
              "runtime/arcorbit/test/codex-settings-electron.test.mjs",
              "runtime/arcorbit/test/desktop-run-manager.test.mjs",
              "runtime/arcorbit/test/chat-coordinator.test.mjs",
              "runtime/arcorbit/test/codex-app-server-adapter.test.mjs",
              "arckit/tech/arcorbit/desktop-execution-solution.md"
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
            "observed_revision": 42,
            "set_decision": {
              "status": "settled",
              "statement": "ArcOrbit 保留既有 Desktop、Runtime、Chat、Automation、Feedback 与 Work 能力和边界。Work 是 Workshop 待办同步与本地 Task Projection 的唯一客户端所有者；新建和编辑 Sheet 提供完整七状态，编辑 Sheet 是异常纠偏兜底，Inspector 按当前状态提供有限下一步动作。Work Inspector 默认更宽，支持可访问拖拽调宽与跨应用重启恢复，并使用内容、紧凑属性、协作和验收语义分区。Work 编辑待办允许把内容复制到当前产品集内另一个可写产品，并在目标创建获 Workshop 确认后删除源 Task。目标 Task 获得新身份，仅复制正文、状态、优先级及目标产品内重新选择的关联字段，不继承评论、附件、Run、session、thread、Gate 或验收问题。Work 负责两阶段 mutation 和部分成功恢复；Automation 只消费服务器确认后的本地状态。Setup Readiness 在应用冷启动时 fresh-check Desktop Store 中全部已关联本地项目相对于内置 payload 的 skill drift；新增或改变本地项目关联及用户主动重试会再次检查。项目集、具体项目、Workset 等纯查看切换、解除关联和 task start 不重新扫描 skills，task start 只消费已验证缓存并 fail closed。trusted Case binding 的既有能力和边界保持不变。Setup Readiness 对同名项目 skill、loader、共享资源和用户按需 catalog 冲突保留 typed diagnostic；当 provider 证明安全目标与唯一内置来源时，用户可逐项选择“备份并使用当前应用包覆盖所选同名 skill”，未选和无关内容保持不变。Feedback 中已忽略且未关联待办的反馈可恢复为待处理，恢复只在服务端确认 pending 后生效。Today、Work、Automation 与 Organization 必须从同一可访问 Project Catalog 得到项目身份；项目存在、项目绑定、同步就绪和执行资格彼此独立，项目详情同步失败不得使项目消失。任何能够访问 Project Catalog 中项目的当前成员，无论 owner、admin 或 member，均可在自己的设备选择、变更或解除该项目的本地工作区绑定；该绑定只更新 Desktop 本地 Workspace Control；Automation project participation 同样是当前用户当前设备的本地执行范围选择，但二者彼此独立，且都不等同于项目事实编辑、邀请或成员管理等远端治理授权。Codex Setup 维护完整 installation inventory 与唯一 active binding，按 execution scope 和 owner 证明选择既有安装、生成安装建议、检查更新并在 mutation 后复验实际 executable；更新查询失败不把健康 Codex 降级为未安装。 Today 是跨项目人工责任工作台，只承载新人项目配置与 Chat、Automation、Work、Feedback 已明确交给当前用户且可直接操作的责任；不展示普通工作、下一工作、完成历史或完整自动进度。Today 项目范围是当前设备上的独立持久偏好，不受 Workset 裁剪，但任何未选择项目的明确人工责任仍必须显现；项目 ready 后只引导到 Work 新建待办。 ArcOrbit 账号与 Runtime 设置支持当前设备 Codex Model/Level：动态候选来自当前 Codex，两个字段始终可人工输入；查询失败或未知当前值不阻止保存。缺省为 gpt-6-astra / high，既有有效用户值保留。保存对下一条 Chat 消息和下一次 Automation Run 生效，活动任务配置固定且 thread 连续。",
              "reason": "既有决策保持有效；用户指定的 Codex 配置能力、所有权和生效边界已由持久文档及行为验证兑现。",
              "evidence": [
                "Current operator input, 2026-08-30",
                "arckit/spec/agentic-software-development/arcorbit-organization-management.md",
                "runtime/arcorbit/desktop/renderer/renderer.js",
                "runtime/arcorbit/src/desktop/today-guidance.mjs",
                "Current operator input, 2026-09-02",
                "arckit/interaction/today-workspace/interaction.md",
                "runtime/arcorbit/src/desktop/today-workspace.mjs",
                "runtime/arcorbit/src/desktop/desktop-store.mjs",
                "arckit/spec/arcorbit-distribution.md",
                "arckit/interaction/automation-workspace/interaction.md",
                "arckit/tech/arcorbit/desktop-execution-solution.md"
              ],
              "confidence": "high",
              "resume_condition": "当 Today 人工责任收录边界、当前设备项目范围、Project Catalog 可访问性或远端治理授权模型改变时重审。 当 Codex 配置来源、清单契约或保存与执行生效边界改变时重审。"
            },
            "gap_refs": [
              "GAP-agent-scenario-evaluation"
            ],
            "reason": "既有决策保持有效；用户指定的 Codex 配置能力、所有权和生效边界已由持久文档及行为验证兑现。",
            "evidence": [
              "arckit/spec/arcorbit-distribution.md",
              "arckit/interaction/automation-workspace/interaction.md",
              "arckit/tech/arcorbit/desktop-execution-solution.md",
              "runtime/arcorbit/test/codex-model-settings.test.mjs",
              "runtime/arcorbit/test/codex-settings-electron.test.mjs"
            ]
          },
          {
            "area_ref": "experience_and_interaction",
            "observed_revision": 65,
            "set_decision": {
              "status": "settled",
              "statement": "ArcOrbit 保持既有 Personal、Product Lifecycle、Organization 导航与 Work、Automation、Feedback、Chat 等交互语义。Work 新建和编辑 Sheet 保留完整七状态，编辑 Sheet 承担异常纠偏；右侧 Inspector 按当前状态显示有限下一步动作。Work Inspector 首次使用 440px，用户可通过 12px 可访问分隔条在 360–640px 保存范围内拖拽、键盘调整或双击复位，偏好跨任务、项目、Workset 和应用重启恢复。布局为任务树保留至少 420px，窗口临时收窄只改变有效宽度且不覆盖保存值。Inspector 以单一内部滚动区组织身份动作、内容、紧凑属性、协作和按状态出现的验收分区，宽度变化不丢失选择、滚动、草稿或附件状态。验收问题条目的问题原文与进展文本在 Inspector 当前可用宽度内完整折行且不横向越界，状态徽标保持清晰可见。Work 已完成列表按新完成在上、历史完成在下排列；标记首项为已验收后选择下一条较旧待办，标记其他位置后选择相邻较新待办，树补全项不参与目标计算，且选择只在服务器确认成功后切换。验收请求期间允许浏览其他任务；若用户在服务器确认前产生较新的选择，成功回调保留该选择而不执行旧任务的自动相邻切换。Work 新建待办 Sheet 在执行人控件下根据执行人与状态原位解释 Automation 资格。跨产品替换、主窗口和 Case 绑定恢复的既有交互保持不变。应用冷启动检查全部关联本地项目；新增或改变本地关联及用户主动重试再次检查。项目集全部、具体项目、Workset 或其它纯查看切换只改变业务投影，不进入 Setup；解除关联和 task start 不重新扫描 skills。task start 缓存断言失败时返回 Setup，等待用户主动重新检查。Setup 冲突页逐项显示稳定 code、skill、目标类型与路径及双方 digest；兜底覆盖默认全不选，支持逐项或全选可恢复项，独立确认 recovery root 与 fresh assessment digest，并反馈备份、替换、回滚和残留状态。Feedback 已忽略且未关联待办的详情显示“恢复为待处理”；动作无需二次确认，提交期间锁定自身，只有服务端确认 pending 后更新状态，失败时保持 ignored、筛选、选择和滚动位置。受支持旧版本覆盖安装后，Automation 先恢复 Catalog 项目行并保留 Workset、绑定和项目授权，再逐项目显示正在恢复、同步异常或可执行；用户无需退出登录、清缓存或重新添加项目。Automation 顶层责任只区分可自行继续与需要人工介入；external、recovery、configuration 与 CLI 保留为原因或处理场所，任何必须由操作者动作触发的下一步都显示 Human。external dependency 创建 attention，并通过“已处理，重新检查”恢复同一 task session/thread。Workset Feedback V2 沟通记录在首次选择和 fresh notification snapshot 标记当前反馈有未读回复时自动重新拉取消息；页面级、详情级和沟通记录的手动刷新均同时刷新反馈事实、通知与当前会话。消息成功加载后才标记已读；失败时保留旧消息和重试入口；刷新不得丢失回复草稿、附件选择或 Inspector 滚动上下文。Today 使用既有主导航中的 Personal 入口和项目栏、责任栏、操作台三栏桌面工作区，仅提供“需要你处理”和“项目配置”两个模式。首次使用在 Today 内以 Sheet 新建个人项目、一次选择多个可访问项目或使用邀请加入；各项目独立推进访问、本地目录、项目 Setup 与当前用户当前设备的 Automation participation，任一 ready 后只引导到 Work。Today 不显示下一工作、普通待办、已处理历史或完整自动进度；非人工状态只有可工作、推进中、自动恢复和未知来源的最小摘要。项目栏不受 Workset 裁剪，未选择项目的明确人工责任仍强制显现。提交只锁定当前责任项；提出验收问题成功后 Task 保持 completed，当前责任仍有效时保持选择并在操作台原位直接显示每项问题原文、处理状态和进展，提交期间形成的较新用户选择不被旧回调覆盖；其他完成责任的动作在来源确认后短暂显示结果再移除；失败保留草稿和选择，项目范围、模式、选择与草稿跨应用重启恢复。Chat、Organization、Today、Work 与 Automation 对缺失本地目录的可访问项目均向当前用户提供“选择本地目录”；本地目录绑定和 Automation participation 都是当前用户当前设备可直接完成的选择，只有项目事实编辑、邀请和成员管理等远端治理动作才按 owner/admin 角色显示 handoff 或管理操作。 账号设置覆盖层提供可编辑 Model 和 Level 候选输入，Level 候选随模型更新但不自动覆盖值。打开时查询，失败可重试，异步刷新保留草稿；保存 Codex 配置仅持久保存两字段并原位反馈，保存并同步包含当前草稿并沿用 Workshop 同步。保存失败保留输入，关闭重开恢复已保存值，页面明确下一条 Chat 消息与下一次 Automation Run 生效。",
              "reason": "既有决策保持有效；用户指定的 Codex 配置能力、所有权和生效边界已由持久文档及行为验证兑现。",
              "evidence": [
                "Current operator input, 2026-09-04",
                "arckit/interaction/today-workspace/interaction.md",
                "arckit/interaction/today-workspace/action-details.html",
                "runtime/arcorbit/desktop/renderer/renderer.js",
                "runtime/arcorbit/test/today-workspace.test.mjs",
                "runtime/arcorbit/test/desktop-renderer.test.mjs",
                "node --test runtime/arcorbit/test/today-workspace.test.mjs runtime/arcorbit/test/desktop-renderer.test.mjs: 74 passed, 0 failed",
                "arckit/spec/arcorbit-distribution.md",
                "arckit/interaction/automation-workspace/interaction.md",
                "arckit/tech/arcorbit/desktop-execution-solution.md"
              ],
              "confidence": "high",
              "resume_condition": "当 Today 的责任来源、项目配置完成口径、验收问题呈现与提交连续性、直接动作恢复语义或主导航结构改变时重审。 当 Codex 配置来源、清单契约或保存与执行生效边界改变时重审。"
            },
            "gap_refs": [],
            "reason": "既有决策保持有效；用户指定的 Codex 配置能力、所有权和生效边界已由持久文档及行为验证兑现。",
            "evidence": [
              "arckit/spec/arcorbit-distribution.md",
              "arckit/interaction/automation-workspace/interaction.md",
              "arckit/tech/arcorbit/desktop-execution-solution.md",
              "runtime/arcorbit/test/codex-model-settings.test.mjs",
              "runtime/arcorbit/test/codex-settings-electron.test.mjs"
            ]
          },
          {
            "area_ref": "data_and_state",
            "observed_revision": 21,
            "set_decision": {
              "status": "settled",
              "statement": "Canonical development state、Workshop 远端真相、ArcOrbit Task Projection、Automation execution、Chat session/thread 和 Case 绑定收据继续保持既有所有权边界。ArcOrbit Desktop Store 额外拥有全局 `platform.ui_preferences.work_inspector_width_px`，用于保存 360–640px 的 Work Inspector 用户选择宽度；它不属于 Workshop Task、按项目 workspace preference、Work Sync 投影或 Automation。缺失或非法值使用 440，窗口临时约束产生的有效宽度不写回保存值，任务、项目、Workset、登录身份切换和应用重启均不重置该偏好。 同名 skill 兜底覆盖的旧内容由 ArcOrbit userData 下仅当前用户可访问的 recovery area 和原子 recovery manifest 持有；全部已选项完成备份后才开始替换，失败时目标、catalog、loader 与 relation 回滚，未选内容不变。 ArcOrbit 项目状态分为 Project Catalog、Workspace Control 与 Task Readiness 三层；前两层的用户事实在覆盖安装时保留，任务、标签、游标、同步健康和 freshness 是可派生状态，必须由新版确定性重建。 Desktop control facts、可重建 projections、按 session/project/run 分区的 messages、Task Projection 与 evidence 保持独立所有权；普通 warm query 不读取磁盘，持久实现不得形成长期双写事实源。 Desktop Store 独占当前设备 settings.codex.model 与 settings.codex.reasoning_effort；缺失或非法字段分别归一化为 gpt-6-astra / high，保存 patch 去除首尾空白、拒绝空值、控制字符及超过 200 字符的值，允许未知模型和级别。更新无关设置及重启保留用户值，不改写用户全局 Codex 配置。Run 保存启动时 model/effort，清单和 Renderer 草稿不是持久事实源。",
              "reason": "既有决策保持有效；用户指定的 Codex 配置能力、所有权和生效边界已由持久文档及行为验证兑现。",
              "evidence": [
                "arckit/tech/arcorbit/platform-composition-solution.md",
                "runtime/arcorbit/src/desktop/desktop-store.mjs",
                "arckit/spec/arcorbit-distribution.md",
                "arckit/interaction/setup-readiness/interaction.md",
                "arckit/interaction/setup-readiness/default.html",
                "arckit/tech/arcorbit/installer-supply-chain.md",
                "arckit/spec/agentic-software-development/arcorbit-work-management.md",
                "arckit/interaction/automation-workspace/interaction.md",
                "arckit/tech/arcorbit/realtime-synchronization-solution.md",
                "arckit/tech/arcorbit/solution.md",
                "arckit/tech/arcorbit/desktop-execution-solution.md"
              ],
              "confidence": "high",
              "resume_condition": "当 Desktop Store schema、持久控制事实或派生状态重建边界改变时重审。 当 Codex 配置来源、清单契约或保存与执行生效边界改变时重审。"
            },
            "gap_refs": [
              "GAP-cross-record-audit"
            ],
            "reason": "既有决策保持有效；用户指定的 Codex 配置能力、所有权和生效边界已由持久文档及行为验证兑现。",
            "evidence": [
              "arckit/spec/arcorbit-distribution.md",
              "arckit/interaction/automation-workspace/interaction.md",
              "arckit/tech/arcorbit/desktop-execution-solution.md",
              "runtime/arcorbit/test/codex-model-settings.test.mjs",
              "runtime/arcorbit/test/codex-settings-electron.test.mjs"
            ]
          },
          {
            "area_ref": "external_integrations",
            "observed_revision": 14,
            "set_decision": {
              "status": "settled",
              "statement": "ArcOrbit 继续通过显式 main-process adapters 集成 Codex app-server/CLI、Workshop 和 Feedback，并保持 Renderer 无凭据、无通用请求能力。真实 Chat 使用可复用的 Codex Conversation 基础层处理 app-server initialize、persistent thread start/resume、turn start/interrupt、streamed items、token usage 和 approval request；ChatCoordinator 直接提交用户文本，不设置 Agent Loop output schema，也不调用 state-driven Runtime、trusted ledger 或 Automation Coordinator。Workshop Task Source 与 realtime adapter 只服务 main-process Work Sync；Work Sync 负责订阅范围、REST 对账、mutation 和本地投影发布，Automation 不直接集成 Workshop。Feedback V2 和产品反馈 SDK 的既有契约与恢复行为保持不变。Workshop Feedback SDK 用户端和 Console 开发者端共同定义双向 V2 消息域；ArcOrbit 对 Workset 项目默认探测开发者能力，列表失败回退 V1，单项失败仅降级对应动作，不用安装包 allowlist 隐藏能力。Feedback V2 的忽略恢复采用固定 POST /feedbacks/{id}/restore 领域合约，仅允许 ignored 原子进入 pending；缺少 provider 合约时失败关闭，不通过通用 update 或 Renderer 本地状态伪装成功。Codex Setup 额外通过固定 main-process allowlist 集成 OpenAI 官方 macOS/Linux/Windows standalone installer 和 codex login、login status、logout 接口；网络、权限、process、capability 与 status 失败分别恢复，Renderer 不能提供 URL、argv、environment 或 shell。 Codex Setup 通过固定 main-process adapters 集成 OpenAI standalone release channel、exact npm registry context、exact Homebrew cask context 与明确 WSL distro transport；所有网络操作复用脱敏代理 context，Renderer 不能提供 URL、package spec、registry、cask、argv、environment 或 shell。 Codex 模型清单由固定无参数 IPC 在主进程查询当前 active executable，并复用已保存代理 context。独立 app-server 只执行 initialize、initialized、分页 model/list，不创建 thread；10 秒超时、有界分页、游标及响应验证和 finally 关闭控制失败，失败不发布部分清单或原始错误。Chat 每消息、Automation 每 Run 读取配置，经 CLI --reasoning-effort 和共享 adapter 的 turn/start.model/effort 生效，保持原 thread；清单可见不代表执行授权。",
              "reason": "既有决策保持有效；用户指定的 Codex 配置能力、所有权和生效边界已由持久文档及行为验证兑现。",
              "evidence": [
                "arckit/tech/arcorbit/platform-composition-solution.md",
                "runtime/arcorbit/src/workshop-platform-adapter.mjs",
                "/Users/Glare/Library/Developer/ModularProgram/hoewo/Workshop-Feedbacks/webapps/feedback-console-web/src/lib/api/feedbackV2Client.ts",
                "arckit/tech/arcorbit/installer-supply-chain.md",
                "arckit/spec/arcorbit-distribution.md",
                "arckit/interaction/automation-workspace/interaction.md",
                "arckit/tech/arcorbit/desktop-execution-solution.md"
              ],
              "confidence": "high",
              "resume_condition": "当 Codex 官方发布源、npm/Homebrew 命令契约、WSL transport 或代理边界改变时重审。 当 Codex 配置来源、清单契约或保存与执行生效边界改变时重审。"
            },
            "gap_refs": [
              "GAP-runtime-resilience-and-adapters"
            ],
            "reason": "既有决策保持有效；用户指定的 Codex 配置能力、所有权和生效边界已由持久文档及行为验证兑现。",
            "evidence": [
              "arckit/spec/arcorbit-distribution.md",
              "arckit/interaction/automation-workspace/interaction.md",
              "arckit/tech/arcorbit/desktop-execution-solution.md",
              "runtime/arcorbit/test/codex-model-settings.test.mjs",
              "runtime/arcorbit/test/codex-settings-electron.test.mjs"
            ]
          }
        ],
        "software_invariant_changes": [],
        "project_gap_changes": [],
        "selection_context_change": null,
        "evidence": [
          "arckit/spec/arcorbit-distribution.md",
          "arckit/interaction/automation-workspace/interaction.md",
          "arckit/tech/arcorbit/desktop-execution-solution.md"
        ]
      },
      "invariant_assessment": {
        "project_revision": 346,
        "judgments": [
          {
            "invariant_ref": "product-expectations-remain-recoverable",
            "disposition": "upheld",
            "reason": "能力、默认值、用户值保留、失败兜底及生效边界已进入有效产品规格。",
            "fact_refs": [
              "FACT-20260905-001-004"
            ],
            "evidence": [
              "arckit/spec/arcorbit-distribution.md"
            ],
            "gap_refs": []
          },
          {
            "invariant_ref": "interaction-expectations-remain-recoverable",
            "disposition": "upheld",
            "reason": "交互策略与线框覆盖编辑、加载、失败、保存和重试；真实 Electron 行为验证通过。",
            "fact_refs": [
              "FACT-20260905-001-004"
            ],
            "evidence": [
              "arckit/interaction/automation-workspace/interaction.md",
              "arckit/interaction/automation-workspace/authentication.html",
              "runtime/arcorbit/test/codex-settings-electron.test.mjs"
            ],
            "gap_refs": []
          },
          {
            "invariant_ref": "visual-language-remains-consistent",
            "disposition": "upheld",
            "reason": "新增字段、动作和状态反馈复用既有设置页网格、按钮、中性表面与可见焦点，无独立主题。",
            "fact_refs": [
              "FACT-20260905-001-004"
            ],
            "evidence": [
              "arckit/visual/_library/brief.md",
              "runtime/arcorbit/desktop/renderer/index.html",
              "arckit/interaction/automation-workspace/authentication.html",
              "runtime/arcorbit/test/codex-settings-electron.test.mjs"
            ],
            "gap_refs": []
          },
          {
            "invariant_ref": "technical-decisions-remain-explainable",
            "disposition": "upheld",
            "reason": "清单查询可信边界、持久配置所有权、执行时机和同 thread 参数传递均有文档与实现。",
            "fact_refs": [
              "FACT-20260905-001-004"
            ],
            "evidence": [
              "arckit/tech/arcorbit/desktop-execution-solution.md",
              "runtime/arcorbit/src/codex-model-catalog.mjs",
              "runtime/arcorbit/src/desktop-run-manager.mjs"
            ],
            "gap_refs": []
          },
          {
            "invariant_ref": "accepted-facts-are-realized",
            "disposition": "upheld",
            "reason": "动态候选和人工输入、默认与保存、Chat/Automation 实际参数传递均有直接实现及行为证据。",
            "fact_refs": [
              "FACT-20260905-001-004"
            ],
            "evidence": [
              "arckit/spec/arcorbit-distribution.md",
              "arckit/interaction/automation-workspace/interaction.md",
              "arckit/tech/arcorbit/desktop-execution-solution.md",
              "runtime/arcorbit/test/codex-model-settings.test.mjs",
              "runtime/arcorbit/test/codex-settings-electron.test.mjs",
              "runtime/arcorbit/test/desktop-run-manager.test.mjs",
              "runtime/arcorbit/test/chat-coordinator.test.mjs",
              "runtime/arcorbit/test/codex-app-server-adapter.test.mjs"
            ],
            "gap_refs": []
          },
          {
            "invariant_ref": "material-risks-have-credible-evidence",
            "disposition": "upheld",
            "reason": "完整分页、中途失败、超时关闭、字段校验、持久恢复、草稿连续性和 thread 复用有比例适当的回归；真实清单结论限定于本机上下文。",
            "fact_refs": [
              "FACT-20260905-001-004"
            ],
            "evidence": [
              "arckit/tech/arcorbit/desktop-execution-solution.md",
              "runtime/arcorbit/test/codex-model-settings.test.mjs",
              "runtime/arcorbit/test/codex-settings-electron.test.mjs",
              "runtime/arcorbit/test/desktop-run-manager.test.mjs",
              "runtime/arcorbit/test/chat-coordinator.test.mjs",
              "runtime/arcorbit/test/codex-app-server-adapter.test.mjs"
            ],
            "gap_refs": []
          }
        ]
      },
      "evidence": [
        "arckit/spec/arcorbit-distribution.md",
        "arckit/interaction/automation-workspace/interaction.md",
        "arckit/interaction/automation-workspace/authentication.html",
        "arckit/tech/arcorbit/desktop-execution-solution.md",
        "runtime/arcorbit/test/codex-model-settings.test.mjs",
        "runtime/arcorbit/test/codex-settings-electron.test.mjs",
        "runtime/arcorbit/test/desktop-run-manager.test.mjs",
        "runtime/arcorbit/test/chat-coordinator.test.mjs",
        "runtime/arcorbit/test/codex-app-server-adapter.test.mjs",
        "npm run check --workspace @arckit/arcorbit：授权执行环境 585 passed、26 skipped、0 failed。",
        "真实 Electron 设置页行为测试：1 passed、0 failed。",
        "最终定向测试：24 passed、0 failed，包含新增可信查询上下文验证。",
        "新清单实现本机只读查询：available，7 个模型，gpt-6-astra 支持 high。",
        "git diff --check 与变更 JavaScript 语法检查通过。",
        "trusted snapshot 只读复核：Project revision 346，当前 Case selection token 保持不变。",
        "trusted semantic 字段及状态投影只读校验通过，未执行 ledger 写入。"
      ],
      "runtime_result_ref": "arckit-runtime://runs/RUN-20260905-042845702Z-0136bd62",
      "occurred_at": "2026-09-05T05:05:53.764Z"
    },
    {
      "round": 3,
      "transition_schema_version": "arckit-case-transition/v8",
      "goal": "完成实现正确性、需求兑现、验证可信度、回归风险与最小性五维语义审查。",
      "outcome": "completed",
      "gap_selection": {
        "mode": "candidate",
        "basis": "依据提交后 fresh snapshot 比较全部候选；可信只读复核确认 Project revision 347 与 Case selection token 未变化。",
        "snapshot_token": "079dc6f3409953780132fdee50275e8218295a9e3a0b90823ae8ef8be907f5f1",
        "selected_ref": "case-gap:CASE-20260905-001:CASE-20260905-001:completion-review:1",
        "comparison_summary": "当前完成审查直接决定本次需求能否收束；四个通用 Project Gap 需要独立 Case，另一 Case 的发布门禁属于人工责任，均暂缓。",
        "fresh_discovery_summary": "复核源码、长期文档和验证证据，未发现需要新增候选的缺陷、遗漏或过度实现。",
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
            "reason": "独立的通用场景评估不阻塞当前完成审查。"
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
            "reason": "通用 Runtime 韧性工作需要独立 Case，本次配置审查无需等待。"
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
            "reason": "真实权限项目验证属于独立范围。"
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
            "reason": "跨记录审计不构成本次功能收束的前置条件。"
          },
          {
            "ref": "case-gap:CASE-20260901-001:GAP-20260901-001-005",
            "source": "persisted",
            "eligibility": "ready",
            "disposition": "deferred",
            "priority_basis": {
              "blocking": "",
              "uncertainty": "",
              "risk": "high",
              "user_impact": ""
            },
            "reason": "凭据、许可和公共发布属于另一 Case 的人工责任。"
          },
          {
            "ref": "case-gap:CASE-20260905-001:CASE-20260905-001:completion-review:1",
            "source": "persisted",
            "eligibility": "ready",
            "disposition": "selected",
            "priority_basis": {
              "blocking": "high",
              "uncertainty": "low",
              "risk": "high",
              "user_impact": "high"
            },
            "reason": "普通 Gap 与 impact 已关闭，完成审查是当前需求收束所需的直接步骤。"
          }
        ]
      },
      "selected_gap": {
        "id": "CASE-20260905-001:completion-review:1",
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
        "goal": "完成实现正确性、需求兑现、验证可信度、回归风险与最小性五维语义审查。",
        "expected_state_change": "提交 clean Completion Review，由可信 Ledger 接受后确认当前 Case 的完成状态。"
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
            "实现正确性：runtime/arcorbit/src/codex-model-settings.mjs、codex-model-catalog.mjs、desktop/desktop-store.mjs 与 desktop-run-manager.mjs 实现字段校验、完整分页、失败兜底及持久成功后发布状态；desktop/renderer/codex-settings-form.mjs 保留草稿并隔离过期响应。",
            "需求兑现：arckit/spec/arcorbit-distribution.md、arckit/interaction/automation-workspace/interaction.md 与 arckit/tech/arcorbit/desktop-execution-solution.md 对动态候选、人工输入、gpt-6-astra/high 默认值和保存生效时机的要求与实现一致。",
            "验证可信度：复核上一轮授权环境完整套件日志 /private/tmp/arcorbit-model-full-check-authorized.log：585 passed、26 skipped、0 failed；最终定向日志 /private/tmp/arcorbit-model-final-targeted.log：24 passed、0 failed。本轮未重复执行这些测试。",
            "验证可信度：runtime/arcorbit/test/codex-settings-electron.test.mjs 加载生产 Renderer；上一轮独立启用 GUI 测试为 1 passed、0 failed。本轮审查测试实现与已接受结果，未把完整套件中的跳过项计为通过。",
            "回归风险：runtime/arcorbit/test/desktop-run-manager.test.mjs、chat-coordinator.test.mjs 与 codex-app-server-adapter.test.mjs 覆盖保存恢复、下一消息/下一 Run 参数和原 thread 连续性；codex-model-settings.test.mjs 覆盖分页失败、超时关闭调用及旧响应隔离。",
            "最小性：变更限定于配置归一化、独立清单查询、现有设置页、执行参数传递、相应测试与长期文档；复用既有 IPC、Store、app-server 客户端和视觉样式，无新增依赖或独立执行线程。"
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
        "project_revision": 347,
        "judgments": [
          {
            "invariant_ref": "product-expectations-remain-recoverable",
            "disposition": "upheld",
            "reason": "能力、默认值、用户值保留、失败兜底及生效边界均有准确的长期产品规格。",
            "fact_refs": [
              "FACT-20260905-001-004"
            ],
            "evidence": [
              "arckit/spec/arcorbit-distribution.md"
            ],
            "gap_refs": []
          },
          {
            "invariant_ref": "interaction-expectations-remain-recoverable",
            "disposition": "upheld",
            "reason": "交互策略与线框覆盖编辑、加载、失败、保存和重试，并有生产 Renderer 行为证据。",
            "fact_refs": [
              "FACT-20260905-001-004"
            ],
            "evidence": [
              "arckit/interaction/automation-workspace/interaction.md",
              "arckit/interaction/automation-workspace/authentication.html",
              "runtime/arcorbit/test/codex-settings-electron.test.mjs"
            ],
            "gap_refs": []
          },
          {
            "invariant_ref": "visual-language-remains-consistent",
            "disposition": "upheld",
            "reason": "新增字段、动作和状态反馈复用既有设置页网格、按钮、中性表面与焦点表达。",
            "fact_refs": [
              "FACT-20260905-001-004"
            ],
            "evidence": [
              "arckit/visual/_library/brief.md",
              "runtime/arcorbit/desktop/renderer/index.html",
              "arckit/interaction/automation-workspace/authentication.html"
            ],
            "gap_refs": []
          },
          {
            "invariant_ref": "technical-decisions-remain-explainable",
            "disposition": "upheld",
            "reason": "清单查询可信边界、持久配置所有权、生效时机和同 thread 参数传递均有一致的文档与实现。",
            "fact_refs": [
              "FACT-20260905-001-004"
            ],
            "evidence": [
              "arckit/tech/arcorbit/desktop-execution-solution.md",
              "runtime/arcorbit/src/codex-model-catalog.mjs",
              "runtime/arcorbit/src/desktop-run-manager.mjs"
            ],
            "gap_refs": []
          },
          {
            "invariant_ref": "accepted-facts-are-realized",
            "disposition": "upheld",
            "reason": "动态候选、人工输入、默认与保存、Chat/Automation 参数传递均有直接实现和行为证据。",
            "fact_refs": [
              "FACT-20260905-001-004"
            ],
            "evidence": [
              "runtime/arcorbit/test/codex-model-settings.test.mjs",
              "runtime/arcorbit/test/codex-settings-electron.test.mjs",
              "runtime/arcorbit/test/desktop-run-manager.test.mjs",
              "runtime/arcorbit/test/chat-coordinator.test.mjs",
              "runtime/arcorbit/test/codex-app-server-adapter.test.mjs"
            ],
            "gap_refs": []
          },
          {
            "invariant_ref": "material-risks-have-credible-evidence",
            "disposition": "upheld",
            "reason": "分页失败、超时关闭调用、字段校验、持久恢复、草稿连续性和 thread 复用有适当回归；清单可见性结论明确限定于本机上下文。",
            "fact_refs": [
              "FACT-20260905-001-004"
            ],
            "evidence": [
              "arckit/tech/arcorbit/desktop-execution-solution.md",
              "runtime/arcorbit/test/codex-model-settings.test.mjs",
              "runtime/arcorbit/test/codex-settings-electron.test.mjs",
              "runtime/arcorbit/test/desktop-run-manager.test.mjs",
              "runtime/arcorbit/test/chat-coordinator.test.mjs",
              "runtime/arcorbit/test/codex-app-server-adapter.test.mjs"
            ],
            "gap_refs": []
          }
        ]
      },
      "evidence": [
        "完成审查逐项复核生产实现、长期规格、交互线框和相应行为测试，五个维度均无发现。",
        "/private/tmp/arcorbit-model-full-check-authorized.log：上一轮完整套件 585 passed、26 skipped、0 failed。",
        "/private/tmp/arcorbit-model-final-targeted.log：上一轮最终定向回归 24 passed、0 failed。",
        "可信 loop-snapshot.mjs read 复核：Project revision 347，当前 Case selection token 未变化。",
        "可信 validateSemanticCaseCommand 与 materializeSemanticCaseCommand 纯校验通过；未执行 ledger 写入。"
      ],
      "runtime_result_ref": "arckit-runtime://runs/RUN-20260905-042845702Z-0136bd62",
      "occurred_at": "2026-09-05T05:12:39.343Z"
    }
  ],
  "case_resolution": {
    "status": "resolved",
    "stage": "resolved",
    "satisfied": [
      "GAP-20260905-001-001",
      "GAP-20260905-001-002"
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
    "updated_at": "2026-09-05T05:12:39.343Z"
  }
}
```

## Round Notes

- Case history is canonical in Structured Record.rounds; keep prose notes exceptional.
