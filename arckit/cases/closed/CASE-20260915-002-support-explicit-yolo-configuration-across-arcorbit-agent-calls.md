# Support explicit YOLO configuration across ArcOrbit agent calls

Case: CASE-20260915-002
Status: closed
Artifact Type: mixed
Selected Gap: none
Updated: 2026-09-15T19:26:18.486Z

## User Intent

通过显式配置开启 ArcOrbit 各处 Agent 的 YOLO 模式。

## Structured Record

```json
{
  "schema_version": "development-case-record/v5",
  "id": "CASE-20260915-002",
  "title": "Support explicit YOLO configuration across ArcOrbit agent calls",
  "status": "closed",
  "artifact_type": "mixed",
  "created_at": "2026-09-15T19:12:12.816Z",
  "updated_at": "2026-09-15T19:26:18.486Z",
  "user_intent": "通过显式配置开启 ArcOrbit 各处 Agent 的 YOLO 模式。",
  "expected_outcome": "可保存的默认关闭开关统一覆盖会话与自动化调用，并验证开启、关闭和线程恢复。",
  "project_state_ref": "arckit/project/state.record.json",
  "current_round": {
    "goal": "",
    "selected_gap": null
  },
  "facts": [
    {
      "id": "FACT-20260915-002-001",
      "revision": 1,
      "status": "accepted",
      "statement": "用户要求 ArcOrbit 各处 Agent 调用可通过显式配置开启 YOLO 模式。",
      "basis": "用户显式请求",
      "evidence": [
        "arckit/cases/evidence/arcorbit-yolo/request.md"
      ]
    },
    {
      "id": "FACT-20260915-002-002",
      "revision": 1,
      "status": "accepted",
      "statement": "YOLO 为设备级默认关闭布尔开关，覆盖共享会话、Run 与终端接力；接受消息/启动时捕获，开启同时解除审批和沙箱，关闭恢复场景策略并保留 thread；业务确认保留。",
      "basis": "用户请求、调用链和本机协议；正式设置文档已维护。",
      "evidence": [
        "arckit/cases/evidence/arcorbit-yolo/contract.md"
      ]
    },
    {
      "id": "FACT-20260915-002-003",
      "revision": 1,
      "status": "accepted",
      "statement": "设备开关、全入口传递和启停恢复已实现，198 项不同针对性测试通过。 实机 Electron 与回环监听验证受权限限制，未记为通过。",
      "basis": "针对性测试日志和生产路径核对。",
      "evidence": [
        "arckit/cases/evidence/arcorbit-yolo/verification.md"
      ]
    }
  ],
  "state_impacts": [],
  "gaps": [
    {
      "id": "GAP-20260915-002-001",
      "status": "resolved",
      "goal": "明确各 Agent 入口的 YOLO 配置覆盖和权限生效契约。",
      "reason": "入口现有审批和只读策略不同，需先确认统一开关的语义与传递边界。",
      "derived_from": [
        "FACT-20260915-002-001"
      ],
      "blocked_by": [],
      "priority_basis": {
        "uncertainty": "权限传递和恢复语义"
      },
      "responsibility": "agent",
      "evidence_required": [
        "调用链与当前 Codex 协议证据",
        "默认、启停、持久化与生效边界"
      ],
      "resolution": {
        "id": "GAP-20260915-002-001",
        "status": "resolved",
        "outcome": "统一 YOLO 配置与协议覆盖契约已明确。",
        "reason": "用户请求与调用链及本机协议共同支持。",
        "evidence": [
          "arckit/cases/evidence/arcorbit-yolo/contract.md"
        ],
        "occurred_at": "2026-09-15T19:14:55.823Z"
      }
    },
    {
      "id": "GAP-20260915-002-002",
      "status": "resolved",
      "goal": "实现并验证统一 YOLO 开关在设置、各 Agent 入口和线程启停恢复中的端到端生效。",
      "reason": "配置契约已明确，生产代码尚缺持久化开关和统一策略映射。",
      "derived_from": [
        "FACT-20260915-002-002"
      ],
      "blocked_by": [],
      "priority_basis": {
        "risk": "关闭后不得遗留全权限",
        "user_impact": "各入口一致生效"
      },
      "responsibility": "agent",
      "evidence_required": [
        "设置持久化、类型校验、消息和 Run 捕获证据",
        "adapter 新建/恢复/复用及关闭策略测试",
        "终端接力和场景覆盖测试"
      ],
      "resolution": {
        "id": "GAP-20260915-002-002",
        "status": "resolved",
        "outcome": "设备开关、全入口传递和启停恢复已实现，198 项不同针对性测试通过。",
        "reason": "可重复代码/协议/调用链证据足以证明该配置行为；GUI 和真实网络桥限制已披露。",
        "evidence": [
          "arckit/cases/evidence/arcorbit-yolo/verification.md"
        ],
        "occurred_at": "2026-09-15T19:25:02.302Z"
      }
    }
  ],
  "content_revision": 2,
  "completion_review": {
    "status": "clean",
    "policy": {
      "initial_max_cycles": 3,
      "source": "using-arckit completion review",
      "snapshotted_at": "2026-09-15T19:12:12.816Z"
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
          "arckit/cases/evidence/arcorbit-yolo/review.md",
          "arckit/cases/evidence/arcorbit-yolo/verification.md"
        ],
        "occurred_at": "2026-09-15T19:26:18.486Z"
      }
    ],
    "evidence": [
      "arckit/cases/evidence/arcorbit-yolo/review.md",
      "arckit/cases/evidence/arcorbit-yolo/verification.md"
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
      "goal": "明确各 Agent 入口的 YOLO 配置覆盖和权限生效契约。",
      "outcome": "completed",
      "gap_selection": {
        "mode": "candidate",
        "basis": "优先确定跨入口权限一致性契约。",
        "snapshot_token": "1bf98163ba58806e19af7ccec4d12344b7d015c3ba852e8f9058b6759206a87b",
        "selected_ref": "case-gap:CASE-20260915-002:GAP-20260915-002-001",
        "comparison_summary": "七项既有独立事项暂缓；选择本次配置契约。",
        "fresh_discovery_summary": "已发现配置缺失与恢复线程权限残留风险，形成实现义务。",
        "considered": [
          {
            "ref": "project-gap:GAP-agent-scenario-evaluation",
            "source": "persisted",
            "eligibility": "case_required",
            "disposition": "deferred",
            "priority_basis": {
              "uncertainty": "high",
              "risk": "high"
            },
            "reason": "独立既有事项，不阻塞本次配置需求。"
          },
          {
            "ref": "project-gap:GAP-runtime-resilience-and-adapters",
            "source": "persisted",
            "eligibility": "case_required",
            "disposition": "deferred",
            "priority_basis": {
              "risk": "high",
              "urgency": "medium"
            },
            "reason": "独立既有事项，不阻塞本次配置需求。"
          },
          {
            "ref": "project-gap:GAP-security-real-project-validation",
            "source": "persisted",
            "eligibility": "case_required",
            "disposition": "deferred",
            "priority_basis": {
              "risk": "high",
              "urgency": "medium"
            },
            "reason": "独立既有事项，不阻塞本次配置需求。"
          },
          {
            "ref": "project-gap:GAP-cross-record-audit",
            "source": "persisted",
            "eligibility": "case_required",
            "disposition": "deferred",
            "priority_basis": {
              "risk": "high",
              "urgency": "high"
            },
            "reason": "独立既有事项，不阻塞本次配置需求。"
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
              "user_impact": "",
              "dependency": "blocks public push and source repository archival"
            },
            "reason": "独立既有事项，不阻塞本次配置需求。"
          },
          {
            "ref": "case-gap:CASE-20260909-002:GAP-20260909-002-004",
            "source": "persisted",
            "eligibility": "ready",
            "disposition": "deferred",
            "priority_basis": {
              "blocking": "declined repackage request",
              "uncertainty": "",
              "risk": "",
              "user_impact": "final packaged acceptance"
            },
            "reason": "独立既有事项，不阻塞本次配置需求。"
          },
          {
            "ref": "case-gap:CASE-20260915-001:GAP-20260915-001-002",
            "source": "persisted",
            "eligibility": "ready",
            "disposition": "deferred",
            "priority_basis": {
              "blocking": "",
              "uncertainty": "",
              "risk": "保持旧页面业务和同事情串行线程约束",
              "user_impact": "用户明确要求完整实施"
            },
            "reason": "独立既有事项，不阻塞本次配置需求。"
          },
          {
            "ref": "case-gap:CASE-20260915-002:GAP-20260915-002-001",
            "source": "persisted",
            "eligibility": "ready",
            "disposition": "selected",
            "priority_basis": {
              "blocking": "",
              "uncertainty": "权限传递和恢复语义",
              "risk": "",
              "user_impact": ""
            },
            "reason": "当前授权的配置契约"
          }
        ]
      },
      "selected_gap": {
        "id": "GAP-20260915-002-001",
        "responsibility": "agent",
        "goal": "明确各 Agent 入口的 YOLO 配置覆盖和权限生效契约。",
        "reason": "入口现有审批和只读策略不同，需先确认统一开关的语义与传递边界。",
        "derived_from": [
          "FACT-20260915-002-001"
        ],
        "blocked_by": [],
        "priority_basis": {
          "blocking": "",
          "uncertainty": "权限传递和恢复语义",
          "risk": "",
          "user_impact": ""
        },
        "evidence_required": [
          "调用链与当前 Codex 协议证据",
          "默认、启停、持久化与生效边界"
        ]
      },
      "planned_transition": {
        "goal": "明确各 Agent 入口的 YOLO 配置覆盖和权限生效契约。",
        "expected_state_change": "接受统一配置语义及调用覆盖，保留实现义务。"
      },
      "accepted_state_delta": {
        "facts_added": [
          {
            "id": "FACT-20260915-002-002",
            "revision": 1,
            "status": "accepted",
            "statement": "YOLO 为设备级默认关闭布尔开关，覆盖共享会话、Run 与终端接力；接受消息/启动时捕获，开启同时解除审批和沙箱，关闭恢复场景策略并保留 thread；业务确认保留。",
            "basis": "用户请求、调用链和本机协议；正式设置文档已维护。",
            "evidence": [
              "arckit/cases/evidence/arcorbit-yolo/contract.md"
            ]
          }
        ],
        "facts_superseded": [],
        "impacts_added": [],
        "impacts_updated": [],
        "gaps_added": [
          {
            "id": "GAP-20260915-002-002",
            "status": "open",
            "goal": "实现并验证统一 YOLO 开关在设置、各 Agent 入口和线程启停恢复中的端到端生效。",
            "reason": "配置契约已明确，生产代码尚缺持久化开关和统一策略映射。",
            "derived_from": [
              "FACT-20260915-002-002"
            ],
            "blocked_by": [],
            "priority_basis": {
              "risk": "关闭后不得遗留全权限",
              "user_impact": "各入口一致生效"
            },
            "responsibility": "agent",
            "evidence_required": [
              "设置持久化、类型校验、消息和 Run 捕获证据",
              "adapter 新建/恢复/复用及关闭策略测试",
              "终端接力和场景覆盖测试"
            ],
            "resolution": null
          }
        ],
        "gaps_cancelled": [],
        "resolved_open_questions": [],
        "completed_handoffs": [],
        "resolved_review_findings": [],
        "resolved_gap": {
          "id": "GAP-20260915-002-001",
          "status": "resolved",
          "outcome": "统一 YOLO 配置与协议覆盖契约已明确。",
          "reason": "用户请求与调用链及本机协议共同支持。",
          "evidence": [
            "arckit/cases/evidence/arcorbit-yolo/contract.md"
          ]
        },
        "completion_review_result": null,
        "review_budget_extension": null
      },
      "project_state_delta": {
        "software_definition_changes": [
          {
            "area_ref": "product_capabilities",
            "observed_revision": 47,
            "set_decision": {
              "status": "settled",
              "statement": "ArcOrbit 保留既有 Desktop、Runtime、Chat、Automation、Feedback、Work、Setup、Today、Product/Idea 与 Release 能力及既有边界。ArcOrbit 账号与 Runtime 设置分别维护当前设备 Chat 与 Automation 的 Codex Model/Level 默认值：动态候选来自当前 Codex，四个字段始终可人工输入；查询失败或未知当前值不阻止保存。两组缺省均为 gpt-6-astra / high，旧单组有效值迁移为两组初始值，随后独立保存。新 Chat 会话继承 Chat 默认值并可在 Composer 快速调整当前会话后续消息；Automation Run 只读取 Automation 默认值。已接受 Chat turn 与已启动 Run 固定配置，Chat 保持原 thread，任一场景调整不污染另一场景。Engineering 是高密度 ArcOrbit 内置 Skills 安装后管理页面，只管理可信随包 Skills 在 Chat 与 Automation 的使用方式；用户级、项目级、其他 catalog 和本地目录 Skills 不显示且不能通过 Engineering 操作。Setup Readiness 继续独占内置 Skills 的安装、更新、漂移恢复和清理。其他既有 Work、Feedback、Project Catalog、本地工作区绑定、Automation participation、Codex Setup、Today、Product/Idea 与 Release 契约保持不变。 ArcOrbit 各处 Agent 执行统一受设备级 settings.codex.yolo_mode 显式开关控制，缺省关闭；开启跳过审批并解除 Codex 沙箱，后续消息、新 Run 和终端接力捕获，关闭恢复场景策略；业务授权和托管权限上限保持有效。",
              "reason": "用户要求统一显式 YOLO 配置，调用链和协议支持该契约。",
              "evidence": [
                "arckit/spec/agentic-software-development/arcorbit-scene-skills.md",
                "arckit/spec/agentic-software-development/arcorbit-planned-workspaces.md",
                "arckit/spec/agentic-software-development/arcorbit-platform-capabilities.md",
                "arckit/spec/arcorbit-distribution.md",
                "runtime/arcorbit/src/scene-skill-manager.mjs",
                "arckit/cases/evidence/CASE-20260912-002/verification.md",
                "arckit/cases/evidence/arcorbit-yolo/contract.md"
              ],
              "confidence": "high",
              "resume_condition": "当 Engineering 的管理对象、内置身份来源、Setup 所有权或 Chat/Automation 场景模式改变时重审。"
            },
            "gap_refs": [
              "GAP-agent-scenario-evaluation"
            ],
            "reason": "用户要求统一显式 YOLO 配置，调用链和协议支持该契约。",
            "evidence": [
              "arckit/cases/evidence/arcorbit-yolo/contract.md"
            ]
          },
          {
            "area_ref": "experience_and_interaction",
            "observed_revision": 70,
            "set_decision": {
              "status": "settled",
              "statement": "ArcOrbit 保持既有 Personal、Product Lifecycle、Organization、Today、Work、Automation、Feedback、Chat、Product/Idea 与 Release 导航、交互及恢复语义。账号设置覆盖层为 Chat 与 Automation 分别提供可编辑 Model 和 Level 候选输入，Chat Composer 在输入框附近显示并调整当前会话后续消息所用 Model/Level，保存、失败恢复、thread 连续与场景隔离保持既有契约。Engineering 以“内置 Skills”明确范围，在首屏紧凑呈现场景、生效时机、内置总数、直接发现、按需使用、已停用、搜索、状态筛选和三列列表；用户在行内调整内置 Skill 使用方式并接收原位反馈。Automation 核心可见且锁定；搜索与状态可组合并一键清除；刷新或保存失败保留最近可信列表、场景和筛选；窄窗口按两列及单列降级且保持键盘焦点。用户自行安装的 Skills 不进入页面列表、计数、错误或操作，Chat 返回保留原会话与草稿。其他既有 Work Inspector、验收、Setup、Feedback、Today、项目绑定、Product/Idea 与 Release 交互契约保持不变。 ArcOrbit 各处 Agent 执行统一受设备级 settings.codex.yolo_mode 显式开关控制，缺省关闭；开启跳过审批并解除 Codex 沙箱，后续消息、新 Run 和终端接力捕获，关闭恢复场景策略；业务授权和托管权限上限保持有效。",
              "reason": "用户要求统一显式 YOLO 配置，调用链和协议支持该契约。",
              "evidence": [
                "arckit/interaction/engineering-profile/interaction.md",
                "arckit/interaction/engineering-profile/default.html",
                "runtime/arcorbit/desktop/renderer/engineering-surface.mjs",
                "runtime/arcorbit/desktop/renderer/engineering.css",
                "runtime/arcorbit/test/engineering-surface.test.mjs",
                "runtime/arcorbit/test/fixtures/engineering-electron.mjs",
                "arckit/cases/evidence/arcorbit-yolo/contract.md"
              ],
              "confidence": "high",
              "resume_condition": "当 Engineering 信息层级、筛选、场景生效时机、失败恢复、键盘/窄窗行为或非内置隔离边界改变时重审。"
            },
            "gap_refs": [],
            "reason": "用户要求统一显式 YOLO 配置，调用链和协议支持该契约。",
            "evidence": [
              "arckit/cases/evidence/arcorbit-yolo/contract.md"
            ]
          },
          {
            "area_ref": "identity_and_access",
            "observed_revision": 6,
            "set_decision": {
              "status": "settled",
              "statement": "认证仍限定于配置的执行与任务来源，授权受用户批准、工作区、沙箱和可信入口约束。Runtime 会话保持服务端支持的七天不活动窗口，成功登录、启动恢复或 token 刷新通过轮换凭据续期；超期、凭据缺失或失效、退出和服务端拒绝要求重新登录。产品反馈使用有效 Workshop 登录及 current-user 不可变业务 ID，账户变化关闭旧上下文。Codex 认证独立，以 codex login status 退出码确认；认证方式和 ChatGPT 浏览器或 device-auth 路径均由用户显式选择，无默认值。组织项目直接添加由 ArcOrbit 主进程限制为项目 owner/admin，组织角色不替代项目角色；目标同组织，新增角色固定 member。Workshop 服务保持原样：现有接口要求已认证并校验目标同组织，但不校验 caller 项目角色。客户端限制不能替代或被描述为服务端保护，本功能不要求服务端修改或发布。 ArcOrbit 各处 Agent 执行统一受设备级 settings.codex.yolo_mode 显式开关控制，缺省关闭；开启跳过审批并解除 Codex 沙箱，后续消息、新 Run 和终端接力捕获，关闭恢复场景策略；业务授权和托管权限上限保持有效。",
              "reason": "用户要求统一显式 YOLO 配置，调用链和协议支持该契约。",
              "evidence": [
                "arckit/spec/agentic-software-development/arcorbit-organization-management.md",
                "arckit/tech/arcorbit/platform-composition-solution.md",
                "services/workshop-api/api/project.md",
                "arckit/cases/evidence/arcorbit-yolo/contract.md"
              ],
              "confidence": "high",
              "resume_condition": "认证域或直接添加客户端角色、服务端范围改变时重审。"
            },
            "gap_refs": [],
            "reason": "用户要求统一显式 YOLO 配置，调用链和协议支持该契约。",
            "evidence": [
              "arckit/cases/evidence/arcorbit-yolo/contract.md"
            ]
          },
          {
            "area_ref": "data_and_state",
            "observed_revision": 25,
            "set_decision": {
              "status": "settled",
              "statement": "Canonical development state、Workshop 远端真相、ArcOrbit Task Projection、Automation execution、Chat session/thread、Case 绑定收据及其他既有 Desktop 控制事实继续保持原所有权边界。Desktop Store 独占当前设备 `settings.codex.chat.{model,reasoning_effort}` 与 `settings.codex.automation.{model,reasoning_effort}`；旧平铺 `settings.codex.model/reasoning_effort` 的有效值迁移为两组初始值。缺失或非法字段分别归一化为 gpt-6-astra / high，保存 patch 去除首尾空白、拒绝空值、控制字符及超过 200 字符的值，并允许未知模型和级别。Chat session 与未发送草稿持有自身 model/reasoning_effort，新会话从 Chat 默认值继承；更新一个场景、无关设置及重启保留其他有效用户值，不改写用户全局 Codex 配置。Automation Run 保存启动时的 Automation model/effort；已接受 Chat turn 使用发送边界捕获的会话配置。模型清单不是持久事实源，Renderer 只投影和提交这些 Desktop 控制事实。其他既有 Inspector 偏好、Setup recovery、Project Catalog、Workspace Control、Task Readiness、Idea 与 Release 数据边界保持不变。 ArcOrbit 各处 Agent 执行统一受设备级 settings.codex.yolo_mode 显式开关控制，缺省关闭；开启跳过审批并解除 Codex 沙箱，后续消息、新 Run 和终端接力捕获，关闭恢复场景策略；业务授权和托管权限上限保持有效。",
              "reason": "用户要求统一显式 YOLO 配置，调用链和协议支持该契约。",
              "evidence": [
                "arckit/tech/arcorbit/desktop-execution-solution.md",
                "runtime/arcorbit/src/codex-model-settings.mjs",
                "runtime/arcorbit/src/desktop/desktop-store.mjs",
                "runtime/arcorbit/src/chat-coordinator.mjs",
                "runtime/arcorbit/src/desktop-run-manager.mjs",
                "runtime/arcorbit/test/codex-model-settings.test.mjs",
                "arckit/cases/evidence/CASE-20260912-001/verification.md",
                "arckit/cases/evidence/arcorbit-yolo/contract.md"
              ],
              "confidence": "high",
              "resume_condition": "当 Desktop Store schema、Chat session/draft 所有权、Automation Run 固定参数或模型清单所有权改变时重审。"
            },
            "gap_refs": [
              "GAP-cross-record-audit"
            ],
            "reason": "用户要求统一显式 YOLO 配置，调用链和协议支持该契约。",
            "evidence": [
              "arckit/cases/evidence/arcorbit-yolo/contract.md"
            ]
          },
          {
            "area_ref": "external_integrations",
            "observed_revision": 18,
            "set_decision": {
              "status": "settled",
              "statement": "ArcOrbit 继续通过显式 main-process adapters 集成 Codex app-server/CLI、Workshop、Feedback、Codex Setup、Product/Idea、GitHub 与 Release 能力，并保持 Renderer 无凭据、无通用请求能力。真实 Chat 继续使用可复用的 Codex Conversation 基础层处理 app-server initialize、persistent thread start/resume、turn start/interrupt、streamed items、token usage 和 approval request；ChatCoordinator 直接提交用户文本，不调用 state-driven Runtime、trusted ledger 或 Automation Coordinator。Codex 模型清单继续由固定无参数 IPC 在主进程查询当前 active executable，失败不发布部分清单或原始错误。Chat turn 从对应 session 读取并在消息接受时固定 model/effort；Automation Run 从 `settings.codex.automation` 读取并在启动时固定。共享 adapter 的 `turn/start.model/effort` 与 CLI `--model`/`--reasoning-effort` 分别生效并保持原 thread。Composer、Chat 默认值和 Automation 默认值相互隔离；清单可见不代表执行授权。其他 Workshop、Feedback、Setup installer、Product/Idea、GitHub 与 Release adapter 契约保持不变。 ArcOrbit 各处 Agent 执行统一受设备级 settings.codex.yolo_mode 显式开关控制，缺省关闭；开启跳过审批并解除 Codex 沙箱，后续消息、新 Run 和终端接力捕获，关闭恢复场景策略；业务授权和托管权限上限保持有效。",
              "reason": "用户要求统一显式 YOLO 配置，调用链和协议支持该契约。",
              "evidence": [
                "arckit/tech/arcorbit/desktop-execution-solution.md",
                "runtime/arcorbit/src/chat-coordinator.mjs",
                "runtime/arcorbit/src/desktop-run-manager.mjs",
                "runtime/arcorbit/adapters/codex-app-server-adapter.mjs",
                "runtime/arcorbit/test/chat-coordinator.test.mjs",
                "runtime/arcorbit/test/desktop-run-manager.test.mjs",
                "arckit/cases/evidence/arcorbit-yolo/contract.md"
              ],
              "confidence": "high",
              "resume_condition": "当 app-server turn 参数、CLI 参数、模型清单边界或场景配置路由改变时重审。"
            },
            "gap_refs": [
              "GAP-runtime-resilience-and-adapters"
            ],
            "reason": "用户要求统一显式 YOLO 配置，调用链和协议支持该契约。",
            "evidence": [
              "arckit/cases/evidence/arcorbit-yolo/contract.md"
            ]
          }
        ],
        "software_invariant_changes": [],
        "project_gap_changes": [],
        "selection_context_change": null,
        "evidence": [
          "arckit/cases/evidence/arcorbit-yolo/contract.md"
        ]
      },
      "invariant_assessment": {
        "project_revision": 384,
        "judgments": [
          {
            "invariant_ref": "product-expectations-remain-recoverable",
            "disposition": "upheld",
            "reason": "配置契约及依据已在对应稳定文档中明确。",
            "fact_refs": [
              "FACT-20260915-002-002"
            ],
            "evidence": [
              "arckit/cases/evidence/arcorbit-yolo/contract.md"
            ],
            "gap_refs": []
          },
          {
            "invariant_ref": "interaction-expectations-remain-recoverable",
            "disposition": "upheld",
            "reason": "配置契约及依据已在对应稳定文档中明确。",
            "fact_refs": [
              "FACT-20260915-002-002"
            ],
            "evidence": [
              "arckit/cases/evidence/arcorbit-yolo/contract.md"
            ],
            "gap_refs": []
          },
          {
            "invariant_ref": "visual-language-remains-consistent",
            "disposition": "not_relevant",
            "reason": "复用既有 checkbox 和设置表单，没有建立视觉语言规则。",
            "fact_refs": [],
            "evidence": [],
            "gap_refs": []
          },
          {
            "invariant_ref": "technical-decisions-remain-explainable",
            "disposition": "upheld",
            "reason": "配置契约及依据已在对应稳定文档中明确。",
            "fact_refs": [
              "FACT-20260915-002-002"
            ],
            "evidence": [
              "arckit/cases/evidence/arcorbit-yolo/contract.md"
            ],
            "gap_refs": []
          },
          {
            "invariant_ref": "accepted-facts-are-realized",
            "disposition": "undetermined",
            "reason": "实现与关闭后权限回收的行为证据仍需验证，由实现缺口承接。",
            "fact_refs": [
              "FACT-20260915-002-002"
            ],
            "evidence": [
              "arckit/cases/evidence/arcorbit-yolo/contract.md"
            ],
            "gap_refs": [
              "GAP-20260915-002-002"
            ]
          },
          {
            "invariant_ref": "material-risks-have-credible-evidence",
            "disposition": "undetermined",
            "reason": "实现与关闭后权限回收的行为证据仍需验证，由实现缺口承接。",
            "fact_refs": [
              "FACT-20260915-002-002"
            ],
            "evidence": [
              "arckit/cases/evidence/arcorbit-yolo/contract.md"
            ],
            "gap_refs": [
              "GAP-20260915-002-002"
            ]
          }
        ]
      },
      "evidence": [
        "arckit/cases/evidence/arcorbit-yolo/contract.md"
      ],
      "runtime_result_ref": "",
      "occurred_at": "2026-09-15T19:14:55.823Z"
    },
    {
      "round": 2,
      "transition_schema_version": "arckit-case-transition/v8",
      "goal": "实现并验证统一 YOLO 开关在设置、各 Agent 入口和线程启停恢复中的端到端生效。",
      "outcome": "completed",
      "gap_selection": {
        "mode": "candidate",
        "basis": "契约已明确，当前唯一必要普通缺口为实现与验证。",
        "snapshot_token": "5eeea38b33347896d782af020a57d99f063e3972eb6430d492538226aca31c16",
        "selected_ref": "case-gap:CASE-20260915-002:GAP-20260915-002-002",
        "comparison_summary": "六项原有项目/人工事项与两项新事情台 Review finding 均暂缓；选择本次 YOLO 实现。",
        "fresh_discovery_summary": "未发现需要独立推进的新范围；GUI 与监听权限限制仅作为验证范围记录。",
        "considered": [
          {
            "ref": "project-gap:GAP-agent-scenario-evaluation",
            "source": "persisted",
            "eligibility": "case_required",
            "disposition": "deferred",
            "priority_basis": {
              "uncertainty": "high",
              "risk": "high"
            },
            "reason": "独立事项；退出授权与场景工具恢复由另一 active Case 承接，不因本次 YOLO 实现扩大范围。"
          },
          {
            "ref": "project-gap:GAP-runtime-resilience-and-adapters",
            "source": "persisted",
            "eligibility": "case_required",
            "disposition": "deferred",
            "priority_basis": {
              "risk": "high",
              "urgency": "medium"
            },
            "reason": "独立事项；退出授权与场景工具恢复由另一 active Case 承接，不因本次 YOLO 实现扩大范围。"
          },
          {
            "ref": "project-gap:GAP-security-real-project-validation",
            "source": "persisted",
            "eligibility": "case_required",
            "disposition": "deferred",
            "priority_basis": {
              "risk": "high",
              "urgency": "medium"
            },
            "reason": "独立事项；退出授权与场景工具恢复由另一 active Case 承接，不因本次 YOLO 实现扩大范围。"
          },
          {
            "ref": "project-gap:GAP-cross-record-audit",
            "source": "persisted",
            "eligibility": "case_required",
            "disposition": "deferred",
            "priority_basis": {
              "risk": "high",
              "urgency": "high"
            },
            "reason": "独立事项；退出授权与场景工具恢复由另一 active Case 承接，不因本次 YOLO 实现扩大范围。"
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
              "user_impact": "",
              "dependency": "blocks public push and source repository archival"
            },
            "reason": "独立事项；退出授权与场景工具恢复由另一 active Case 承接，不因本次 YOLO 实现扩大范围。"
          },
          {
            "ref": "case-gap:CASE-20260909-002:GAP-20260909-002-004",
            "source": "persisted",
            "eligibility": "ready",
            "disposition": "deferred",
            "priority_basis": {
              "blocking": "declined repackage request",
              "uncertainty": "",
              "risk": "",
              "user_impact": "final packaged acceptance"
            },
            "reason": "独立事项；退出授权与场景工具恢复由另一 active Case 承接，不因本次 YOLO 实现扩大范围。"
          },
          {
            "ref": "case-gap:CASE-20260915-001:CASE-20260915-001:review-finding:FINDING-20260915-001-001",
            "source": "persisted",
            "eligibility": "ready",
            "disposition": "deferred",
            "priority_basis": {
              "blocking": "high",
              "uncertainty": "",
              "risk": "high",
              "user_impact": ""
            },
            "reason": "独立事项；退出授权与场景工具恢复由另一 active Case 承接，不因本次 YOLO 实现扩大范围。"
          },
          {
            "ref": "case-gap:CASE-20260915-001:CASE-20260915-001:review-finding:FINDING-20260915-001-002",
            "source": "persisted",
            "eligibility": "ready",
            "disposition": "deferred",
            "priority_basis": {
              "blocking": "high",
              "uncertainty": "",
              "risk": "high",
              "user_impact": ""
            },
            "reason": "独立事项；退出授权与场景工具恢复由另一 active Case 承接，不因本次 YOLO 实现扩大范围。"
          },
          {
            "ref": "case-gap:CASE-20260915-002:GAP-20260915-002-002",
            "source": "persisted",
            "eligibility": "ready",
            "disposition": "selected",
            "priority_basis": {
              "blocking": "",
              "uncertainty": "",
              "risk": "关闭后不得遗留全权限",
              "user_impact": "各入口一致生效"
            },
            "reason": "当前 YOLO 实现义务。"
          }
        ]
      },
      "selected_gap": {
        "id": "GAP-20260915-002-002",
        "responsibility": "agent",
        "goal": "实现并验证统一 YOLO 开关在设置、各 Agent 入口和线程启停恢复中的端到端生效。",
        "reason": "配置契约已明确，生产代码尚缺持久化开关和统一策略映射。",
        "derived_from": [
          "FACT-20260915-002-002"
        ],
        "blocked_by": [],
        "priority_basis": {
          "blocking": "",
          "uncertainty": "",
          "risk": "关闭后不得遗留全权限",
          "user_impact": "各入口一致生效"
        },
        "evidence_required": [
          "设置持久化、类型校验、消息和 Run 捕获证据",
          "adapter 新建/恢复/复用及关闭策略测试",
          "终端接力和场景覆盖测试"
        ]
      },
      "planned_transition": {
        "goal": "实现并验证统一 YOLO 开关在设置、各 Agent 入口和线程启停恢复中的端到端生效。",
        "expected_state_change": "以实现和行为测试证明统一权限配置生效。"
      },
      "accepted_state_delta": {
        "facts_added": [
          {
            "id": "FACT-20260915-002-003",
            "revision": 1,
            "status": "accepted",
            "statement": "设备开关、全入口传递和启停恢复已实现，198 项不同针对性测试通过。 实机 Electron 与回环监听验证受权限限制，未记为通过。",
            "basis": "针对性测试日志和生产路径核对。",
            "evidence": [
              "arckit/cases/evidence/arcorbit-yolo/verification.md"
            ]
          }
        ],
        "facts_superseded": [],
        "impacts_added": [],
        "impacts_updated": [],
        "gaps_added": [],
        "gaps_cancelled": [],
        "resolved_open_questions": [],
        "completed_handoffs": [],
        "resolved_review_findings": [],
        "resolved_gap": {
          "id": "GAP-20260915-002-002",
          "status": "resolved",
          "outcome": "设备开关、全入口传递和启停恢复已实现，198 项不同针对性测试通过。",
          "reason": "可重复代码/协议/调用链证据足以证明该配置行为；GUI 和真实网络桥限制已披露。",
          "evidence": [
            "arckit/cases/evidence/arcorbit-yolo/verification.md"
          ]
        },
        "completion_review_result": null,
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
        "project_revision": 386,
        "judgments": [
          {
            "invariant_ref": "product-expectations-remain-recoverable",
            "disposition": "upheld",
            "reason": "设置规格与真实覆盖、默认和生效语义一致，稳定文档可恢复。",
            "fact_refs": [
              "FACT-20260915-002-003"
            ],
            "evidence": [
              "arckit/cases/evidence/arcorbit-yolo/verification.md"
            ],
            "gap_refs": []
          },
          {
            "invariant_ref": "interaction-expectations-remain-recoverable",
            "disposition": "upheld",
            "reason": "真实 HTML 和表单测试证明设置控件、保存反馈和失败草稿语义。",
            "fact_refs": [
              "FACT-20260915-002-003"
            ],
            "evidence": [
              "arckit/cases/evidence/arcorbit-yolo/verification.md"
            ],
            "gap_refs": []
          },
          {
            "invariant_ref": "visual-language-remains-consistent",
            "disposition": "not_relevant",
            "reason": "复用既有设置组件，无独立视觉语言变化。",
            "fact_refs": [],
            "evidence": [],
            "gap_refs": []
          },
          {
            "invariant_ref": "technical-decisions-remain-explainable",
            "disposition": "upheld",
            "reason": "集中策略映射、场景/Run 捕获和 CLI 接力边界与技术文档一致。",
            "fact_refs": [
              "FACT-20260915-002-003"
            ],
            "evidence": [
              "arckit/cases/evidence/arcorbit-yolo/verification.md"
            ],
            "gap_refs": []
          },
          {
            "invariant_ref": "accepted-facts-are-realized",
            "disposition": "upheld",
            "reason": "198 项针对性测试及代码证据证明配置行为，未将 GUI/真实模型执行冒充已验证。",
            "fact_refs": [
              "FACT-20260915-002-003"
            ],
            "evidence": [
              "arckit/cases/evidence/arcorbit-yolo/verification.md"
            ],
            "gap_refs": []
          },
          {
            "invariant_ref": "material-risks-have-credible-evidence",
            "disposition": "upheld",
            "reason": "类型拒绝、默认关闭、显式关闭覆盖旧全权限、线程恢复、启动配置固定均有行为测试；实机限制已披露。",
            "fact_refs": [
              "FACT-20260915-002-003"
            ],
            "evidence": [
              "arckit/cases/evidence/arcorbit-yolo/verification.md"
            ],
            "gap_refs": []
          }
        ]
      },
      "evidence": [
        "arckit/cases/evidence/arcorbit-yolo/verification.md"
      ],
      "runtime_result_ref": "",
      "occurred_at": "2026-09-15T19:25:02.302Z"
    },
    {
      "round": 3,
      "transition_schema_version": "arckit-case-transition/v8",
      "goal": "Review the completed implementation for correctness, real problem resolution, verification credibility, regression risk, and minimality.",
      "outcome": "completed",
      "gap_selection": {
        "mode": "candidate",
        "basis": "普通缺口已闭合，独立验证完成主张。",
        "snapshot_token": "c7e96545bff7d285ec1400fe5c0dc349a859e64d1ce3c28601ce8d502e6bface",
        "selected_ref": "case-gap:CASE-20260915-002:CASE-20260915-002:completion-review:1",
        "comparison_summary": "六项原项目/人工候选与新事情台两项 review findings 均暂缓；只选择本事项 Completion Review。",
        "fresh_discovery_summary": "自查没有发现需独立修复的本事项问题。",
        "considered": [
          {
            "ref": "project-gap:GAP-agent-scenario-evaluation",
            "source": "persisted",
            "eligibility": "case_required",
            "disposition": "deferred",
            "priority_basis": {
              "uncertainty": "high",
              "risk": "high"
            },
            "reason": "独立事项由其 active Case 或后续用户授权承接。"
          },
          {
            "ref": "project-gap:GAP-runtime-resilience-and-adapters",
            "source": "persisted",
            "eligibility": "case_required",
            "disposition": "deferred",
            "priority_basis": {
              "risk": "high",
              "urgency": "medium"
            },
            "reason": "独立事项由其 active Case 或后续用户授权承接。"
          },
          {
            "ref": "project-gap:GAP-security-real-project-validation",
            "source": "persisted",
            "eligibility": "case_required",
            "disposition": "deferred",
            "priority_basis": {
              "risk": "high",
              "urgency": "medium"
            },
            "reason": "独立事项由其 active Case 或后续用户授权承接。"
          },
          {
            "ref": "project-gap:GAP-cross-record-audit",
            "source": "persisted",
            "eligibility": "case_required",
            "disposition": "deferred",
            "priority_basis": {
              "risk": "high",
              "urgency": "high"
            },
            "reason": "独立事项由其 active Case 或后续用户授权承接。"
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
              "user_impact": "",
              "dependency": "blocks public push and source repository archival"
            },
            "reason": "独立事项由其 active Case 或后续用户授权承接。"
          },
          {
            "ref": "case-gap:CASE-20260909-002:GAP-20260909-002-004",
            "source": "persisted",
            "eligibility": "ready",
            "disposition": "deferred",
            "priority_basis": {
              "blocking": "declined repackage request",
              "uncertainty": "",
              "risk": "",
              "user_impact": "final packaged acceptance"
            },
            "reason": "独立事项由其 active Case 或后续用户授权承接。"
          },
          {
            "ref": "case-gap:CASE-20260915-001:CASE-20260915-001:review-finding:FINDING-20260915-001-001",
            "source": "persisted",
            "eligibility": "ready",
            "disposition": "deferred",
            "priority_basis": {
              "blocking": "high",
              "uncertainty": "",
              "risk": "high",
              "user_impact": ""
            },
            "reason": "独立事项由其 active Case 或后续用户授权承接。"
          },
          {
            "ref": "case-gap:CASE-20260915-001:CASE-20260915-001:review-finding:FINDING-20260915-001-002",
            "source": "persisted",
            "eligibility": "ready",
            "disposition": "deferred",
            "priority_basis": {
              "blocking": "high",
              "uncertainty": "",
              "risk": "high",
              "user_impact": ""
            },
            "reason": "独立事项由其 active Case 或后续用户授权承接。"
          },
          {
            "ref": "case-gap:CASE-20260915-002:CASE-20260915-002:completion-review:1",
            "source": "persisted",
            "eligibility": "ready",
            "disposition": "selected",
            "priority_basis": {
              "blocking": "high",
              "uncertainty": "low",
              "risk": "high",
              "user_impact": "high"
            },
            "reason": "本事项完成自查。"
          }
        ]
      },
      "selected_gap": {
        "id": "CASE-20260915-002:completion-review:1",
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
        "expected_state_change": "独立检查五个完成维度并确认本事项是否闭合。"
      },
      "accepted_state_delta": {
        "facts_added": [],
        "facts_superseded": [],
        "impacts_added": [],
        "impacts_updated": [],
        "gaps_added": [],
        "gaps_cancelled": [],
        "resolved_open_questions": [],
        "completed_handoffs": [],
        "resolved_review_findings": [],
        "resolved_gap": null,
        "completion_review_result": {
          "outcome": "clean",
          "reviewer": "agent",
          "reviewed_content_revision": 2,
          "findings": [],
          "evidence": [
            "arckit/cases/evidence/arcorbit-yolo/review.md",
            "arckit/cases/evidence/arcorbit-yolo/verification.md"
          ],
          "dimensions": {
            "implementation_correctness": "clean",
            "problem_resolution": "clean",
            "verification_credibility": "clean",
            "regression_risk": "clean",
            "minimality": "clean"
          }
        },
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
        "project_revision": 386,
        "judgments": [
          {
            "invariant_ref": "product-expectations-remain-recoverable",
            "disposition": "upheld",
            "reason": "设置规格与真实覆盖、默认和生效语义一致，稳定文档可恢复。",
            "fact_refs": [
              "FACT-20260915-002-003"
            ],
            "evidence": [
              "arckit/cases/evidence/arcorbit-yolo/review.md",
              "arckit/cases/evidence/arcorbit-yolo/verification.md"
            ],
            "gap_refs": []
          },
          {
            "invariant_ref": "interaction-expectations-remain-recoverable",
            "disposition": "upheld",
            "reason": "真实 HTML 和表单测试证明设置控件、保存反馈和失败草稿语义。",
            "fact_refs": [
              "FACT-20260915-002-003"
            ],
            "evidence": [
              "arckit/cases/evidence/arcorbit-yolo/review.md",
              "arckit/cases/evidence/arcorbit-yolo/verification.md"
            ],
            "gap_refs": []
          },
          {
            "invariant_ref": "visual-language-remains-consistent",
            "disposition": "not_relevant",
            "reason": "复用既有设置组件，无独立视觉语言变化。",
            "fact_refs": [],
            "evidence": [],
            "gap_refs": []
          },
          {
            "invariant_ref": "technical-decisions-remain-explainable",
            "disposition": "upheld",
            "reason": "集中策略映射、场景/Run 捕获和 CLI 接力边界与技术文档一致。",
            "fact_refs": [
              "FACT-20260915-002-003"
            ],
            "evidence": [
              "arckit/cases/evidence/arcorbit-yolo/review.md",
              "arckit/cases/evidence/arcorbit-yolo/verification.md"
            ],
            "gap_refs": []
          },
          {
            "invariant_ref": "accepted-facts-are-realized",
            "disposition": "upheld",
            "reason": "198 项针对性测试及代码证据证明配置行为，未将 GUI/真实模型执行冒充已验证。",
            "fact_refs": [
              "FACT-20260915-002-003"
            ],
            "evidence": [
              "arckit/cases/evidence/arcorbit-yolo/review.md",
              "arckit/cases/evidence/arcorbit-yolo/verification.md"
            ],
            "gap_refs": []
          },
          {
            "invariant_ref": "material-risks-have-credible-evidence",
            "disposition": "upheld",
            "reason": "类型拒绝、默认关闭、显式关闭覆盖旧全权限、线程恢复、启动配置固定均有行为测试；实机限制已披露。",
            "fact_refs": [
              "FACT-20260915-002-003"
            ],
            "evidence": [
              "arckit/cases/evidence/arcorbit-yolo/review.md",
              "arckit/cases/evidence/arcorbit-yolo/verification.md"
            ],
            "gap_refs": []
          }
        ]
      },
      "evidence": [
        "arckit/cases/evidence/arcorbit-yolo/review.md",
        "arckit/cases/evidence/arcorbit-yolo/verification.md"
      ],
      "runtime_result_ref": "",
      "occurred_at": "2026-09-15T19:26:18.486Z"
    }
  ],
  "case_resolution": {
    "status": "resolved",
    "stage": "resolved",
    "satisfied": [
      "GAP-20260915-002-001",
      "GAP-20260915-002-002"
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
    "updated_at": "2026-09-15T19:26:18.486Z"
  }
}
```

## Round Notes

- Case history is canonical in Structured Record.rounds; keep prose notes exceptional.
