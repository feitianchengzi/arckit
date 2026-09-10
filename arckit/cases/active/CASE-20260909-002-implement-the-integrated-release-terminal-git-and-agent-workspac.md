# Implement the integrated Release terminal Git and Agent workspace

Case: CASE-20260909-002
Status: handoff
Artifact Type: mixed
Selected Gap: none
Updated: 2026-09-09T15:41:27.471Z

## User Intent

完整实施用户确认的 Release 核心能力：真实终端、完整 Git 操作入口、源码编辑、构建运行与复用 Chat/Idea 的 Agent 协作；复用已有多项目绑定。

## Structured Record

```json
{
  "schema_version": "development-case-record/v5",
  "id": "CASE-20260909-002",
  "title": "Implement the integrated Release terminal Git and Agent workspace",
  "status": "handoff",
  "artifact_type": "mixed",
  "created_at": "2026-09-09T11:00:39.995Z",
  "updated_at": "2026-09-09T15:41:27.471Z",
  "user_intent": "完整实施用户确认的 Release 核心能力：真实终端、完整 Git 操作入口、源码编辑、构建运行与复用 Chat/Idea 的 Agent 协作；复用已有多项目绑定。",
  "expected_outcome": "正式 Desktop 提供可用的 Release 工作台，真实进程与 Git 服务、共享场景对话、多项目隔离和安装包验证具有持久证据。",
  "project_state_ref": "arckit/project/state.record.json",
  "current_round": {
    "goal": "",
    "selected_gap": null
  },
  "facts": [
    {
      "id": "FACT-20260909-002-001",
      "revision": 1,
      "status": "accepted",
      "statement": "用户接受调研建议并要求完整实施；终端采用 xterm/node-pty，Git 原生 CLI/simple-git/Monaco 与 Lazygit，Agent 复用 Chat/Idea，未来插件通过共同服务适配。",
      "basis": "Current user: 可以，现在完整实施",
      "evidence": [
        "runtime/arcorbit/design/release-workbench/research/implementation-options.md",
        "arckit/intake/2026/2026-09-09-arcorbit-product-management.md"
      ]
    },
    {
      "id": "FACT-20260909-002-002",
      "revision": 1,
      "status": "accepted",
      "statement": "Release 正式契约已建立：既有项目范围、真实终端与 Git/源码/任务、共享场景 Agent、真实结果与恢复；外部发布不以模拟状态声称接入。",
      "basis": "用户接受选型且要求完整实施，旧示意契约已替换。",
      "evidence": [
        "arckit/spec/agentic-software-development/arcorbit-release-workspace.md",
        "arckit/tech/arcorbit/release-workspace-solution.md",
        "arckit/interaction/release-workspace/interaction.md",
        "arckit/interaction/release-workspace/default.html"
      ]
    },
    {
      "id": "FACT-20260909-002-003",
      "revision": 1,
      "status": "accepted",
      "statement": "生产 Release 工作台已实现真实终端、Git/源码、项目任务及共享 Chat/Idea 场景 Agent；608 项非 GUI 回归通过，10 项最终服务测试和最新开发态 Electron 9 个检查通过。",
      "basis": "实际源码、真实隔离仓库/进程/Renderer 证据，外部模型为确定性替身。",
      "evidence": [
        "arckit/cases/evidence/CASE-20260909-002/verification.md",
        "arckit/cases/evidence/CASE-20260909-002/release-electron.json",
        "arckit/cases/evidence/CASE-20260909-002/release-services.tap",
        "arckit/cases/evidence/CASE-20260909-002/regression.tap"
      ]
    },
    {
      "id": "FACT-20260909-002-004",
      "revision": 1,
      "status": "superseded",
      "statement": "Lazygit 二进制尚未获取；原生重建及封装载荷运行未获授权，安装包验收未完成。开发态证据不能替代封装、签名和装机验证。",
      "basis": "当前会话执行工具返回 rejected by user，未绕过；离线资源与 ASAR 测试载荷准备完成。",
      "evidence": [
        "arckit/cases/evidence/CASE-20260909-002/verification.md",
        "runtime/arcorbit/scripts/prepare-release-asar-smoke.mjs",
        "runtime/arcorbit/scripts/prepare-lazygit.mjs"
      ]
    },
    {
      "id": "FACT-20260909-002-004",
      "revision": 2,
      "status": "accepted",
      "statement": "Lazygit 已安装、原生重建及首轮 .app 已成功；封装流程暴露的 Agent 输入初始化竞态已修复并通过开发态复测，但重新打包请求被拒绝，最终封装验收仍未完成。",
      "basis": "用户重新授权、实际命令回执、封装测试结果和最新开发态 Electron 证据。",
      "evidence": [
        "arckit/cases/evidence/CASE-20260909-002/lazygit-install.json",
        "arckit/cases/evidence/CASE-20260909-002/packaging-progress.json",
        "arckit/cases/evidence/CASE-20260909-002/release-electron.json",
        "arckit/cases/evidence/CASE-20260909-002/verification.md"
      ]
    },
    {
      "id": "FACT-20260909-002-005",
      "revision": 1,
      "status": "accepted",
      "statement": "官方 Lazygit v0.65.0 darwin-x64 已按固定 SHA-256 验证并安装，ArcOrbit 工具发现及实际 PTY 面板、resize、键盘输入、退出验证通过。",
      "basis": "下载成功、安装收据、--version 与临时仓库真实执行验证。",
      "evidence": [
        "arckit/cases/evidence/CASE-20260909-002/lazygit-install.json"
      ]
    }
  ],
  "state_impacts": [],
  "gaps": [
    {
      "id": "GAP-20260909-002-001",
      "status": "resolved",
      "goal": "Release 的正式产品、交互和技术契约反映已接受的真实终端、Git 与 Agent 能力及既有项目边界。",
      "reason": "旧 Release 规格是示意页面，不能作为真实功能验收依据。",
      "derived_from": [
        "FACT-20260909-002-001"
      ],
      "blocked_by": [],
      "priority_basis": {
        "dependency": "establishes governing acceptance contract",
        "user_impact": "explicit implementation request"
      },
      "responsibility": "agent",
      "evidence_required": [
        "一致的产品规格、页面状态与技术契约",
        "已接受选型与现有工作区身份/Agent复用边界"
      ],
      "resolution": {
        "id": "GAP-20260909-002-001",
        "status": "resolved",
        "outcome": "Release 正式契约已建立：既有项目范围、真实终端与 Git/源码/任务、共享场景 Agent、真实结果与恢复；外部发布不以模拟状态声称接入。",
        "reason": "用户接受选型且要求完整实施，旧示意契约已替换。",
        "evidence": [
          "arckit/spec/agentic-software-development/arcorbit-release-workspace.md",
          "arckit/tech/arcorbit/release-workspace-solution.md",
          "arckit/interaction/release-workspace/interaction.md",
          "arckit/interaction/release-workspace/default.html"
        ],
        "occurred_at": "2026-09-09T11:04:10.912Z"
      }
    },
    {
      "id": "GAP-20260909-002-002",
      "status": "cancelled",
      "goal": "正式 Desktop 真实实现并验证已接受的 Release 核心工作台契约。",
      "reason": "契约明确但生产 Release 仍为静态示意，真实执行服务与页面尚缺。",
      "derived_from": [
        "FACT-20260909-002-002"
      ],
      "blocked_by": [],
      "priority_basis": {
        "user_impact": "requested working functionality"
      },
      "responsibility": "agent",
      "evidence_required": [
        "真实进程、Git、文件与多项目流程验证",
        "正式 Renderer 和安装包依赖验证",
        "共享 Agent 契约与既有功能回归"
      ],
      "resolution": {
        "id": "GAP-20260909-002-002",
        "status": "cancelled",
        "outcome": "核心实现与开发态验证已完成；原聚合验收拆解为已验证事实和剩余封装交付验证，不能声称完整验收通过。",
        "reason": "Lazygit 下载、用户级原生缓存重建和离线 ASAR 运行请求均未获授权；保留明确的后续义务。",
        "evidence": [
          "arckit/cases/evidence/CASE-20260909-002/verification.md",
          "arckit/cases/evidence/CASE-20260909-002/release-electron.json",
          "arckit/cases/evidence/CASE-20260909-002/release-services.tap",
          "arckit/cases/evidence/CASE-20260909-002/regression.tap"
        ],
        "occurred_at": "2026-09-09T14:11:26.262Z"
      }
    },
    {
      "id": "GAP-20260909-002-003",
      "status": "cancelled",
      "resolution": {
        "id": "GAP-20260909-002-003",
        "status": "cancelled",
        "outcome": "此前聚合授权缺口已部分消除：安装、原生重建和首轮 .app 成功；替换为修复后的重新打包与封装验收义务。",
        "reason": "用户批准重试带来实际进展，但随后的重新打包请求被拒绝，不能记录为完整验收。",
        "evidence": [
          "arckit/cases/evidence/CASE-20260909-002/lazygit-install.json",
          "arckit/cases/evidence/CASE-20260909-002/packaging-progress.json",
          "arckit/cases/evidence/CASE-20260909-002/release-electron.json",
          "arckit/cases/evidence/CASE-20260909-002/verification.md"
        ],
        "occurred_at": "2026-09-09T15:41:27.471Z"
      },
      "goal": "取得必要执行授权后，完成 Release 安装包及可选 Lazygit 的实际交付验证。",
      "reason": "现有实现和开发态验证已通过，但获取高级 Git 二进制、原生重建及封装后运行的授权被拒绝，需用户恢复这些具体授权后由 Agent 完成验证。",
      "derived_from": [
        "FACT-20260909-002-004"
      ],
      "blocked_by": [],
      "responsibility": "human",
      "priority_basis": {
        "blocking": "installation acceptance requires the declined execution permissions",
        "user_impact": "用户要求完整实施"
      },
      "evidence_required": [
        "明确允许所需下载/缓存写入及封装运行，或用户指定可用的既有工具和验证环境",
        "真实安装包依赖、PTY、Monaco 离线 worker 与 Lazygit 可用性证据"
      ]
    },
    {
      "id": "GAP-20260909-002-004",
      "status": "open",
      "resolution": null,
      "goal": "允许修复后的 ArcOrbit 重新打包，并完成包含 Agent、PTY 与随包 Lazygit 的封装流程验收。",
      "reason": "源码修复已通过开发态验证，但再次 electron-builder 执行请求被拒绝；现有首轮包不含最后修复。",
      "derived_from": [
        "FACT-20260909-002-004"
      ],
      "blocked_by": [],
      "responsibility": "human",
      "priority_basis": {
        "blocking": "declined repackage request",
        "user_impact": "final packaged acceptance"
      },
      "evidence_required": [
        "重新允许修复后的本地打包与封装运行验证",
        "更新后的实际应用包，以及包内终端、Git、Monaco、场景 Agent 和 Lazygit 验证回执"
      ]
    }
  ],
  "content_revision": 3,
  "completion_review": {
    "status": "pending",
    "policy": {
      "initial_max_cycles": 5,
      "source": "Implementation complexity and existing completion-review protocol",
      "snapshotted_at": "2026-09-09T11:00:39.995Z"
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
  "rounds": [
    {
      "round": 1,
      "transition_schema_version": "arckit-case-transition/v8",
      "goal": "Release 的正式产品、交互和技术契约反映已接受的真实终端、Git 与 Agent 能力及既有项目边界。",
      "outcome": "completed",
      "gap_selection": {
        "mode": "candidate",
        "basis": "先建立真实功能验收依据。",
        "snapshot_token": "bc76b916ca43203e98c147427989df39642915207ca1e2218c9385d635ef6064",
        "selected_ref": "case-gap:CASE-20260909-002:GAP-20260909-002-001",
        "comparison_summary": "四个独立 Project 验证候选暂缓；另一 Case 人工发布不相关；选择当前 Release 契约。",
        "fresh_discovery_summary": "本轮只发现契约之后的真实实现义务，新增后续 gap。",
        "considered": [
          {
            "ref": "project-gap:GAP-agent-scenario-evaluation",
            "source": "persisted",
            "eligibility": "case_required",
            "disposition": "deferred",
            "reason": "与当前 Release 范围独立，保留原责任",
            "priority_basis": {
              "uncertainty": "high",
              "risk": "high"
            }
          },
          {
            "ref": "project-gap:GAP-runtime-resilience-and-adapters",
            "source": "persisted",
            "eligibility": "case_required",
            "disposition": "deferred",
            "reason": "与当前 Release 范围独立，保留原责任",
            "priority_basis": {
              "risk": "high",
              "urgency": "medium"
            }
          },
          {
            "ref": "project-gap:GAP-security-real-project-validation",
            "source": "persisted",
            "eligibility": "case_required",
            "disposition": "deferred",
            "reason": "与当前 Release 范围独立，保留原责任",
            "priority_basis": {
              "risk": "high",
              "urgency": "medium"
            }
          },
          {
            "ref": "project-gap:GAP-cross-record-audit",
            "source": "persisted",
            "eligibility": "case_required",
            "disposition": "deferred",
            "reason": "与当前 Release 范围独立，保留原责任",
            "priority_basis": {
              "risk": "high",
              "urgency": "high"
            }
          },
          {
            "ref": "case-gap:CASE-20260901-001:GAP-20260901-001-005",
            "source": "persisted",
            "eligibility": "ready",
            "disposition": "deferred",
            "reason": "与当前 Release 范围独立，保留原责任",
            "priority_basis": {
              "blocking": "",
              "uncertainty": "",
              "risk": "high",
              "user_impact": "",
              "dependency": "blocks public push and source repository archival"
            }
          },
          {
            "ref": "case-gap:CASE-20260909-002:GAP-20260909-002-001",
            "source": "persisted",
            "eligibility": "ready",
            "disposition": "selected",
            "reason": "用户新能力需正式验收依据",
            "priority_basis": {
              "blocking": "",
              "uncertainty": "",
              "risk": "",
              "user_impact": "explicit implementation request",
              "dependency": "establishes governing acceptance contract"
            }
          }
        ]
      },
      "selected_gap": {
        "id": "GAP-20260909-002-001",
        "responsibility": "agent",
        "goal": "Release 的正式产品、交互和技术契约反映已接受的真实终端、Git 与 Agent 能力及既有项目边界。",
        "reason": "旧 Release 规格是示意页面，不能作为真实功能验收依据。",
        "derived_from": [
          "FACT-20260909-002-001"
        ],
        "blocked_by": [],
        "priority_basis": {
          "blocking": "",
          "uncertainty": "",
          "risk": "",
          "user_impact": "explicit implementation request",
          "dependency": "establishes governing acceptance contract"
        },
        "evidence_required": [
          "一致的产品规格、页面状态与技术契约",
          "已接受选型与现有工作区身份/Agent复用边界"
        ]
      },
      "planned_transition": {
        "goal": "Release 的正式产品、交互和技术契约反映已接受的真实终端、Git 与 Agent 能力及既有项目边界。",
        "expected_state_change": "正式规格与技术事实表达已接受能力。"
      },
      "accepted_state_delta": {
        "resolved_gap": {
          "id": "GAP-20260909-002-001",
          "status": "resolved",
          "outcome": "Release 正式契约已建立：既有项目范围、真实终端与 Git/源码/任务、共享场景 Agent、真实结果与恢复；外部发布不以模拟状态声称接入。",
          "reason": "用户接受选型且要求完整实施，旧示意契约已替换。",
          "evidence": [
            "arckit/spec/agentic-software-development/arcorbit-release-workspace.md",
            "arckit/tech/arcorbit/release-workspace-solution.md",
            "arckit/interaction/release-workspace/interaction.md",
            "arckit/interaction/release-workspace/default.html"
          ]
        },
        "facts_added": [
          {
            "id": "FACT-20260909-002-002",
            "revision": 1,
            "status": "accepted",
            "statement": "Release 正式契约已建立：既有项目范围、真实终端与 Git/源码/任务、共享场景 Agent、真实结果与恢复；外部发布不以模拟状态声称接入。",
            "basis": "用户接受选型且要求完整实施，旧示意契约已替换。",
            "evidence": [
              "arckit/spec/agentic-software-development/arcorbit-release-workspace.md",
              "arckit/tech/arcorbit/release-workspace-solution.md",
              "arckit/interaction/release-workspace/interaction.md",
              "arckit/interaction/release-workspace/default.html"
            ]
          }
        ],
        "facts_superseded": [],
        "impacts_added": [],
        "impacts_updated": [],
        "gaps_added": [
          {
            "id": "GAP-20260909-002-002",
            "status": "open",
            "goal": "正式 Desktop 真实实现并验证已接受的 Release 核心工作台契约。",
            "reason": "契约明确但生产 Release 仍为静态示意，真实执行服务与页面尚缺。",
            "derived_from": [
              "FACT-20260909-002-002"
            ],
            "blocked_by": [],
            "priority_basis": {
              "user_impact": "requested working functionality"
            },
            "responsibility": "agent",
            "evidence_required": [
              "真实进程、Git、文件与多项目流程验证",
              "正式 Renderer 和安装包依赖验证",
              "共享 Agent 契约与既有功能回归"
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
            "area_ref": "product_intent_and_scope",
            "observed_revision": 4,
            "set_decision": {
              "status": "settled",
              "statement": "Arckit is the repository-owned development protocol and skill system; ArcOrbit is its supervised Desktop/Runtime product and is expanding into a local-project-anchored, multi-product software-development platform for people who coordinate organization, product, member, todo, AI execution, and feedback work without relying on the Todo or Feedback web clients for daily operation. Product 是用户持续推进的中心；Product/Idea 能力保持既有边界。 Release 提供真实本地终端、原生 Git、源码编辑、构建运行及复用 Chat/Idea 的场景 Agent，消费既有工作区绑定；以 arcorbit-release-workspace.md 与 release-workspace-solution.md 为准，外部渠道和监控仍依实际 adapter。",
              "reason": "用户批准 Release 核心能力实施，替换旧计划展示边界。",
              "evidence": [
                "arckit/spec/agentic-software-development/arcorbit-platform-capabilities.md",
                "arckit/pending/prototypes/arcorbit-platform-next/README.md",
                "arckit/spec/agentic-software-development/arcorbit-product-management.md",
                "arckit/spec/agentic-software-development/arcorbit-planned-workspaces.md",
                "runtime/arcorbit/src/chat-coordinator.mjs",
                "runtime/arcorbit/src/platform-coordinator.mjs",
                "arckit/spec/agentic-software-development/arcorbit-release-workspace.md",
                "arckit/tech/arcorbit/release-workspace-solution.md",
                "arckit/interaction/release-workspace/interaction.md",
                "arckit/interaction/release-workspace/default.html"
              ],
              "confidence": "high",
              "resume_condition": "Revisit only if the server ownership boundary or protected ArcOrbit Runtime semantics change.",
              "revision": 4
            },
            "gap_refs": [],
            "reason": "Release 正式契约被接受",
            "evidence": [
              "arckit/spec/agentic-software-development/arcorbit-release-workspace.md",
              "arckit/tech/arcorbit/release-workspace-solution.md",
              "arckit/interaction/release-workspace/interaction.md",
              "arckit/interaction/release-workspace/default.html"
            ]
          },
          {
            "area_ref": "product_capabilities",
            "observed_revision": 44,
            "set_decision": {
              "status": "settled",
              "statement": "ArcOrbit 保留既有 Desktop、Runtime、Chat、Automation、Feedback 与 Work 能力和边界。Work 是 Workshop 待办同步与本地 Task Projection 的唯一客户端所有者；新建和编辑 Sheet 提供完整七状态，编辑 Sheet 是异常纠偏兜底，Inspector 按当前状态提供有限下一步动作。Work Inspector 默认更宽，支持可访问拖拽调宽与跨应用重启恢复，并使用内容、紧凑属性、协作和验收语义分区。Work 编辑待办允许把内容复制到当前产品集内另一个可写产品，并在目标创建获 Workshop 确认后删除源 Task。目标 Task 获得新身份，仅复制正文、状态、优先级及目标产品内重新选择的关联字段，不继承评论、附件、Run、session、thread、Gate 或验收问题。Work 负责两阶段 mutation 和部分成功恢复；Automation 只消费服务器确认后的本地状态。Setup Readiness 在应用冷启动时 fresh-check Desktop Store 中全部已关联本地项目相对于内置 payload 的 skill drift；新增或改变本地项目关联及用户主动重试会再次检查。项目集、具体项目、Workset 等纯查看切换、解除关联和 task start 不重新扫描 skills，task start 只消费已验证缓存并 fail closed。trusted Case binding 的既有能力和边界保持不变。Setup Readiness 对同名项目 skill、loader、共享资源和用户按需 catalog 冲突保留 typed diagnostic；当 provider 证明安全目标与唯一内置来源时，用户可逐项选择“备份并使用当前应用包覆盖所选同名 skill”，未选和无关内容保持不变。Feedback 中已忽略且未关联待办的反馈可恢复为待处理，恢复只在服务端确认 pending 后生效。Today、Work、Automation 与 Organization 必须从同一可访问 Project Catalog 得到项目身份；项目存在、项目绑定、同步就绪和执行资格彼此独立，项目详情同步失败不得使项目消失。任何能够访问 Project Catalog 中项目的当前成员，无论 owner、admin 或 member，均可在自己的设备选择、变更或解除该项目的本地工作区绑定；该绑定只更新 Desktop 本地 Workspace Control；Automation project participation 同样是当前用户当前设备的本地执行范围选择，但二者彼此独立，且都不等同于项目事实编辑、邀请或成员管理等远端治理授权。Codex Setup 维护完整 installation inventory 与唯一 active binding，按 execution scope 和 owner 证明选择既有安装、生成安装建议、检查更新并在 mutation 后复验实际 executable；更新查询失败不把健康 Codex 降级为未安装。 Today 是跨项目人工责任工作台，只承载新人项目配置与 Chat、Automation、Work、Feedback 已明确交给当前用户且可直接操作的责任；不展示普通工作、下一工作、完成历史或完整自动进度。Today 项目范围是当前设备上的独立持久偏好，不受 Workset 裁剪，但任何未选择项目的明确人工责任仍必须显现；项目 ready 后只引导到 Work 新建待办。 ArcOrbit 账号与 Runtime 设置支持当前设备 Codex Model/Level：动态候选来自当前 Codex，两个字段始终可人工输入；查询失败或未知当前值不阻止保存。缺省为 gpt-6-astra / high，既有有效用户值保留。保存对下一条 Chat 消息和下一次 Automation Run 生效，活动任务配置固定且 thread 连续。 Product/Idea 管理以 arcorbit-product-management.md 为准。Today 在既有责任和项目配置区之外增加独立反馈新消息、本机未完成 Idea/资料草稿续接与添加入口；不将其计作人工责任。 Release 提供真实本地终端、原生 Git、源码编辑、构建运行及复用 Chat/Idea 的场景 Agent，消费既有工作区绑定；以 arcorbit-release-workspace.md 与 release-workspace-solution.md 为准，外部渠道和监控仍依实际 adapter。",
              "reason": "用户批准 Release 核心能力实施，替换旧计划展示边界。",
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
                "arckit/tech/arcorbit/desktop-execution-solution.md",
                "arckit/spec/agentic-software-development/arcorbit-product-management.md",
                "arckit/spec/agentic-software-development/arcorbit-planned-workspaces.md",
                "runtime/arcorbit/src/chat-coordinator.mjs",
                "runtime/arcorbit/src/platform-coordinator.mjs",
                "arckit/spec/agentic-software-development/arcorbit-release-workspace.md",
                "arckit/tech/arcorbit/release-workspace-solution.md",
                "arckit/interaction/release-workspace/interaction.md",
                "arckit/interaction/release-workspace/default.html"
              ],
              "confidence": "high",
              "resume_condition": "当 Today 人工责任收录边界、当前设备项目范围、Project Catalog 可访问性或远端治理授权模型改变时重审。 当 Codex 配置来源、清单契约或保存与执行生效边界改变时重审。",
              "revision": 44
            },
            "gap_refs": [
              "GAP-agent-scenario-evaluation"
            ],
            "reason": "Release 正式契约被接受",
            "evidence": [
              "arckit/spec/agentic-software-development/arcorbit-release-workspace.md",
              "arckit/tech/arcorbit/release-workspace-solution.md",
              "arckit/interaction/release-workspace/interaction.md",
              "arckit/interaction/release-workspace/default.html"
            ]
          },
          {
            "area_ref": "experience_and_interaction",
            "observed_revision": 67,
            "set_decision": {
              "status": "settled",
              "statement": "ArcOrbit 保持既有 Personal、Product Lifecycle、Organization 导航与 Work、Automation、Feedback、Chat 等交互语义。Work 新建和编辑 Sheet 保留完整七状态，编辑 Sheet 承担异常纠偏；右侧 Inspector 按当前状态显示有限下一步动作。Work Inspector 首次使用 440px，用户可通过 12px 可访问分隔条在 360–640px 保存范围内拖拽、键盘调整或双击复位，偏好跨任务、项目、Workset 和应用重启恢复。布局为任务树保留至少 420px，窗口临时收窄只改变有效宽度且不覆盖保存值。Inspector 以单一内部滚动区组织身份动作、内容、紧凑属性、协作和按状态出现的验收分区，宽度变化不丢失选择、滚动、草稿或附件状态。验收问题条目的问题原文与进展文本在 Inspector 当前可用宽度内完整折行且不横向越界，状态徽标保持清晰可见。Work 已完成列表按新完成在上、历史完成在下排列；标记首项为已验收后选择下一条较旧待办，标记其他位置后选择相邻较新待办，树补全项不参与目标计算，且选择只在服务器确认成功后切换。验收请求期间允许浏览其他任务；若用户在服务器确认前产生较新的选择，成功回调保留该选择而不执行旧任务的自动相邻切换。Work 新建待办 Sheet 在执行人控件下根据执行人与状态原位解释 Automation 资格。跨产品替换、主窗口和 Case 绑定恢复的既有交互保持不变。应用冷启动检查全部关联本地项目；新增或改变本地关联及用户主动重试再次检查。项目集全部、具体项目、Workset 或其它纯查看切换只改变业务投影，不进入 Setup；解除关联和 task start 不重新扫描 skills。task start 缓存断言失败时返回 Setup，等待用户主动重新检查。Setup 冲突页逐项显示稳定 code、skill、目标类型与路径及双方 digest；兜底覆盖默认全不选，支持逐项或全选可恢复项，独立确认 recovery root 与 fresh assessment digest，并反馈备份、替换、回滚和残留状态。Feedback 已忽略且未关联待办的详情显示“恢复为待处理”；动作无需二次确认，提交期间锁定自身，只有服务端确认 pending 后更新状态，失败时保持 ignored、筛选、选择和滚动位置。受支持旧版本覆盖安装后，Automation 先恢复 Catalog 项目行并保留 Workset、绑定和项目授权，再逐项目显示正在恢复、同步异常或可执行；用户无需退出登录、清缓存或重新添加项目。Automation 顶层责任只区分可自行继续与需要人工介入；external、recovery、configuration 与 CLI 保留为原因或处理场所，任何必须由操作者动作触发的下一步都显示 Human。external dependency 创建 attention，并通过“已处理，重新检查”恢复同一 task session/thread。Workset Feedback V2 沟通记录在首次选择和 fresh notification snapshot 标记当前反馈有未读回复时自动重新拉取消息；页面级、详情级和沟通记录的手动刷新均同时刷新反馈事实、通知与当前会话。消息成功加载后才标记已读；失败时保留旧消息和重试入口；刷新不得丢失回复草稿、附件选择或 Inspector 滚动上下文。Today 使用既有主导航中的 Personal 入口和项目栏、责任栏、操作台三栏桌面工作区，仅提供“需要你处理”和“项目配置”两个模式。首次使用在 Today 内以 Sheet 新建个人项目、一次选择多个可访问项目或使用邀请加入；各项目独立推进访问、本地目录、项目 Setup 与当前用户当前设备的 Automation participation，任一 ready 后只引导到 Work。Today 不显示下一工作、普通待办、已处理历史或完整自动进度；非人工状态只有可工作、推进中、自动恢复和未知来源的最小摘要。项目栏不受 Workset 裁剪，未选择项目的明确人工责任仍强制显现。提交只锁定当前责任项；提出验收问题成功后 Task 保持 completed，当前责任仍有效时保持选择并在操作台原位直接显示每项问题原文、处理状态和进展，提交期间形成的较新用户选择不被旧回调覆盖；其他完成责任的动作在来源确认后短暂显示结果再移除；失败保留草稿和选择，项目范围、模式、选择与草稿跨应用重启恢复。Chat、Organization、Today、Work 与 Automation 对缺失本地目录的可访问项目均向当前用户提供“选择本地目录”；本地目录绑定和 Automation participation 都是当前用户当前设备可直接完成的选择，只有项目事实编辑、邀请和成员管理等远端治理动作才按 owner/admin 角色显示 handoff 或管理操作。 账号设置覆盖层提供可编辑 Model 和 Level 候选输入，Level 候选随模型更新但不自动覆盖值。打开时查询，失败可重试，异步刷新保留草稿；保存 Codex 配置仅持久保存两字段并原位反馈，保存并同步包含当前草稿并沿用 Workshop 同步。保存失败保留输入，关闭重开恢复已保存值，页面明确下一条 Chat 消息与下一次 Automation Run 生效。 Product 目录/详情为新增长期上下文入口，原 Lifecycle 独立页面保留。Idea 独立添加页同时使用可编辑资料区与共享 Conversation Surface/Composer；人工与 Agent 操作同一修订事实，确认后可由 Agent 或直接业务动作执行。正式录入完成与 Git 共享分别反馈。 Release 提供真实本地终端、原生 Git、源码编辑、构建运行及复用 Chat/Idea 的场景 Agent，消费既有工作区绑定；以 arcorbit-release-workspace.md 与 release-workspace-solution.md 为准，外部渠道和监控仍依实际 adapter。",
              "reason": "用户批准 Release 核心能力实施，替换旧计划展示边界。",
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
                "arckit/tech/arcorbit/desktop-execution-solution.md",
                "arckit/cases/evidence/CASE-20260909-001/verification.md",
                "arckit/spec/agentic-software-development/arcorbit-product-management.md",
                "arckit/tech/arcorbit/product-management-solution.md",
                "runtime/arcorbit/src/product-coordinator.mjs",
                "runtime/arcorbit/src/product-git.mjs",
                "runtime/arcorbit/desktop/renderer/product-surface.mjs",
                "runtime/arcorbit/test/product-management.test.mjs",
                "runtime/arcorbit/test/product-surface.test.mjs",
                "definition/skills/arckit-product-assets/SKILL.md",
                "arckit/spec/agentic-software-development/arcorbit-release-workspace.md",
                "arckit/tech/arcorbit/release-workspace-solution.md",
                "arckit/interaction/release-workspace/interaction.md",
                "arckit/interaction/release-workspace/default.html"
              ],
              "confidence": "high",
              "resume_condition": "当 Today 的责任来源、项目配置完成口径、验收问题呈现与提交连续性、直接动作恢复语义或主导航结构改变时重审。 当 Codex 配置来源、清单契约或保存与执行生效边界改变时重审。",
              "revision": 67
            },
            "gap_refs": [],
            "reason": "Release 正式契约被接受",
            "evidence": [
              "arckit/spec/agentic-software-development/arcorbit-release-workspace.md",
              "arckit/tech/arcorbit/release-workspace-solution.md",
              "arckit/interaction/release-workspace/interaction.md",
              "arckit/interaction/release-workspace/default.html"
            ]
          },
          {
            "area_ref": "data_and_state",
            "observed_revision": 23,
            "set_decision": {
              "status": "settled",
              "statement": "Canonical development state、Workshop 远端真相、ArcOrbit Task Projection、Automation execution、Chat session/thread 和 Case 绑定收据继续保持既有所有权边界。ArcOrbit Desktop Store 额外拥有全局 `platform.ui_preferences.work_inspector_width_px`，用于保存 360–640px 的 Work Inspector 用户选择宽度；它不属于 Workshop Task、按项目 workspace preference、Work Sync 投影或 Automation。缺失或非法值使用 440，窗口临时约束产生的有效宽度不写回保存值，任务、项目、Workset、登录身份切换和应用重启均不重置该偏好。 同名 skill 兜底覆盖的旧内容由 ArcOrbit userData 下仅当前用户可访问的 recovery area 和原子 recovery manifest 持有；全部已选项完成备份后才开始替换，失败时目标、catalog、loader 与 relation 回滚，未选内容不变。 ArcOrbit 项目状态分为 Project Catalog、Workspace Control 与 Task Readiness 三层；前两层的用户事实在覆盖安装时保留，任务、标签、游标、同步健康和 freshness 是可派生状态，必须由新版确定性重建。 Desktop control facts、可重建 projections、按 session/project/run 分区的 messages、Task Projection 与 evidence 保持独立所有权；普通 warm query 不读取磁盘，持久实现不得形成长期双写事实源。 Desktop Store 独占当前设备 settings.codex.model 与 settings.codex.reasoning_effort；缺失或非法字段分别归一化为 gpt-6-astra / high，保存 patch 去除首尾空白、拒绝空值、控制字符及超过 200 字符的值，允许未知模型和级别。更新无关设置及重启保留用户值，不改写用户全局 Codex 配置。Run 保存启动时 model/effort，清单和 Renderer 草稿不是持久事实源。 未完成 Idea 仅存在当前账号作用域的本机临时库并显式提示；正式 Idea 必须有 GitHub 仓库和关联本地 Git 工作目录，资料与产品记录共同保存在 arckit/product。正式记录验证后移除临时事实，列表从临时库和当前产品集关联目录恢复。本机仅保留正式对象的会话、绑定和同步控制；产品状态独立于任务和 ledger 状态。 Release 提供真实本地终端、原生 Git、源码编辑、构建运行及复用 Chat/Idea 的场景 Agent，消费既有工作区绑定；以 arcorbit-release-workspace.md 与 release-workspace-solution.md 为准，外部渠道和监控仍依实际 adapter。",
              "reason": "用户批准 Release 核心能力实施，替换旧计划展示边界。",
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
                "arckit/tech/arcorbit/desktop-execution-solution.md",
                "arckit/cases/evidence/CASE-20260909-001/verification.md",
                "arckit/spec/agentic-software-development/arcorbit-product-management.md",
                "arckit/tech/arcorbit/product-management-solution.md",
                "runtime/arcorbit/src/product-coordinator.mjs",
                "runtime/arcorbit/src/product-git.mjs",
                "runtime/arcorbit/desktop/renderer/product-surface.mjs",
                "runtime/arcorbit/test/product-management.test.mjs",
                "runtime/arcorbit/test/product-surface.test.mjs",
                "definition/skills/arckit-product-assets/SKILL.md",
                "arckit/spec/agentic-software-development/arcorbit-release-workspace.md",
                "arckit/tech/arcorbit/release-workspace-solution.md",
                "arckit/interaction/release-workspace/interaction.md",
                "arckit/interaction/release-workspace/default.html"
              ],
              "confidence": "high",
              "resume_condition": "当 Desktop Store schema、持久控制事实或派生状态重建边界改变时重审。 当 Codex 配置来源、清单契约或保存与执行生效边界改变时重审。",
              "revision": 23
            },
            "gap_refs": [
              "GAP-cross-record-audit"
            ],
            "reason": "Release 正式契约被接受",
            "evidence": [
              "arckit/spec/agentic-software-development/arcorbit-release-workspace.md",
              "arckit/tech/arcorbit/release-workspace-solution.md",
              "arckit/interaction/release-workspace/interaction.md",
              "arckit/interaction/release-workspace/default.html"
            ]
          },
          {
            "area_ref": "external_integrations",
            "observed_revision": 16,
            "set_decision": {
              "status": "settled",
              "statement": "ArcOrbit 继续通过显式 main-process adapters 集成 Codex app-server/CLI、Workshop 和 Feedback，并保持 Renderer 无凭据、无通用请求能力。真实 Chat 使用可复用的 Codex Conversation 基础层处理 app-server initialize、persistent thread start/resume、turn start/interrupt、streamed items、token usage 和 approval request；ChatCoordinator 直接提交用户文本，不设置 Agent Loop output schema，也不调用 state-driven Runtime、trusted ledger 或 Automation Coordinator。Workshop Task Source 与 realtime adapter 只服务 main-process Work Sync；Work Sync 负责订阅范围、REST 对账、mutation 和本地投影发布，Automation 不直接集成 Workshop。Feedback V2 和产品反馈 SDK 的既有契约与恢复行为保持不变。Workshop Feedback SDK 用户端和 Console 开发者端共同定义双向 V2 消息域；ArcOrbit 对 Workset 项目默认探测开发者能力，列表失败回退 V1，单项失败仅降级对应动作，不用安装包 allowlist 隐藏能力。Feedback V2 的忽略恢复采用固定 POST /feedbacks/{id}/restore 领域合约，仅允许 ignored 原子进入 pending；缺少 provider 合约时失败关闭，不通过通用 update 或 Renderer 本地状态伪装成功。Codex Setup 额外通过固定 main-process allowlist 集成 OpenAI 官方 macOS/Linux/Windows standalone installer 和 codex login、login status、logout 接口；网络、权限、process、capability 与 status 失败分别恢复，Renderer 不能提供 URL、argv、environment 或 shell。 Codex Setup 通过固定 main-process adapters 集成 OpenAI standalone release channel、exact npm registry context、exact Homebrew cask context 与明确 WSL distro transport；所有网络操作复用脱敏代理 context，Renderer 不能提供 URL、package spec、registry、cask、argv、environment 或 shell。 Codex 模型清单由固定无参数 IPC 在主进程查询当前 active executable，并复用已保存代理 context。独立 app-server 只执行 initialize、initialized、分页 model/list，不创建 thread；10 秒超时、有界分页、游标及响应验证和 finally 关闭控制失败，失败不发布部分清单或原始错误。Chat 每消息、Automation 每 Run 读取配置，经 CLI --reasoning-effort 和共享 adapter 的 turn/start.model/effort 生效，保持原 thread；清单可见不代表执行授权。 Product 场景是普通 Chat 之外的明确应用上下文：通过同一 Codex transport 注册主进程持有的动态业务工具，并显式提供产品资料 skill；普通 Chat 默认仍直接提交用户文本。Workshop 继续提供现有 Project/成员事实，GitHub 使用当前设备认证与受限 Git/gh 操作，不新增服务端能力。 Release 提供真实本地终端、原生 Git、源码编辑、构建运行及复用 Chat/Idea 的场景 Agent，消费既有工作区绑定；以 arcorbit-release-workspace.md 与 release-workspace-solution.md 为准，外部渠道和监控仍依实际 adapter。",
              "reason": "用户批准 Release 核心能力实施，替换旧计划展示边界。",
              "evidence": [
                "arckit/tech/arcorbit/platform-composition-solution.md",
                "runtime/arcorbit/src/workshop-platform-adapter.mjs",
                "/Users/Glare/Library/Developer/ModularProgram/hoewo/Workshop-Feedbacks/webapps/feedback-console-web/src/lib/api/feedbackV2Client.ts",
                "arckit/tech/arcorbit/installer-supply-chain.md",
                "arckit/spec/arcorbit-distribution.md",
                "arckit/interaction/automation-workspace/interaction.md",
                "arckit/tech/arcorbit/desktop-execution-solution.md",
                "arckit/cases/evidence/CASE-20260909-001/verification.md",
                "arckit/spec/agentic-software-development/arcorbit-product-management.md",
                "arckit/tech/arcorbit/product-management-solution.md",
                "runtime/arcorbit/src/product-coordinator.mjs",
                "runtime/arcorbit/src/product-git.mjs",
                "runtime/arcorbit/desktop/renderer/product-surface.mjs",
                "runtime/arcorbit/test/product-management.test.mjs",
                "runtime/arcorbit/test/product-surface.test.mjs",
                "definition/skills/arckit-product-assets/SKILL.md",
                "arckit/spec/agentic-software-development/arcorbit-release-workspace.md",
                "arckit/tech/arcorbit/release-workspace-solution.md",
                "arckit/interaction/release-workspace/interaction.md",
                "arckit/interaction/release-workspace/default.html"
              ],
              "confidence": "high",
              "resume_condition": "当 Codex 官方发布源、npm/Homebrew 命令契约、WSL transport 或代理边界改变时重审。 当 Codex 配置来源、清单契约或保存与执行生效边界改变时重审。",
              "revision": 16
            },
            "gap_refs": [
              "GAP-runtime-resilience-and-adapters"
            ],
            "reason": "Release 正式契约被接受",
            "evidence": [
              "arckit/spec/agentic-software-development/arcorbit-release-workspace.md",
              "arckit/tech/arcorbit/release-workspace-solution.md",
              "arckit/interaction/release-workspace/interaction.md",
              "arckit/interaction/release-workspace/default.html"
            ]
          },
          {
            "area_ref": "technical_foundation",
            "observed_revision": 48,
            "set_decision": {
              "status": "settled",
              "statement": "Arckit and ArcOrbit retain their existing ledger, skill, Electron, Runtime, Platform Coordinator, Work Sync, Chat, Setup Readiness, trusted case-control, and repository-relative path boundaries. The public Arckit monorepo additionally owns Todo Web under apps, Feedback Console under apps, the Feedback Web SDK under packages, the shared Workshop API under services, and integration examples under examples. JavaScript surfaces use one root workspace with independent build and release entries; the Workshop API remains an independently testable Go module. Public builds and tests never require the sibling private arckit-ops workspace. Product Coordinator 属于应用层，产品资料使用版本化协议与 revision 校验，正式记录单文件原子维护。同步通过独立 Git index 和资料分支，处理并发拒绝与远端核对，不改变开发 checkout。场景会话使用应用私有固定 cwd，材料范围与正式目录分别保存；运行内核不增加技能路由或工作角色。 Release 提供真实本地终端、原生 Git、源码编辑、构建运行及复用 Chat/Idea 的场景 Agent，消费既有工作区绑定；以 arcorbit-release-workspace.md 与 release-workspace-solution.md 为准，外部渠道和监控仍依实际 adapter。",
              "reason": "用户批准 Release 核心能力实施，替换旧计划展示边界。",
              "evidence": [
                "arckit/tech/repository-governance/monorepo-solution.md",
                "arckit/tech/arcorbit/solution.md",
                "arckit/tech/arcorbit/platform-composition-solution.md",
                "arckit/cases/evidence/CASE-20260909-001/verification.md",
                "arckit/spec/agentic-software-development/arcorbit-product-management.md",
                "arckit/tech/arcorbit/product-management-solution.md",
                "runtime/arcorbit/src/product-coordinator.mjs",
                "runtime/arcorbit/src/product-git.mjs",
                "runtime/arcorbit/desktop/renderer/product-surface.mjs",
                "runtime/arcorbit/test/product-management.test.mjs",
                "runtime/arcorbit/test/product-surface.test.mjs",
                "definition/skills/arckit-product-assets/SKILL.md",
                "arckit/spec/agentic-software-development/arcorbit-release-workspace.md",
                "arckit/tech/arcorbit/release-workspace-solution.md",
                "arckit/interaction/release-workspace/interaction.md",
                "arckit/interaction/release-workspace/default.html"
              ],
              "confidence": "high",
              "resume_condition": "Revisit when workspace tooling, repository-relative capability paths, or source ownership boundaries change.",
              "revision": 48
            },
            "gap_refs": [
              "GAP-runtime-resilience-and-adapters"
            ],
            "reason": "Release 正式契约被接受",
            "evidence": [
              "arckit/spec/agentic-software-development/arcorbit-release-workspace.md",
              "arckit/tech/arcorbit/release-workspace-solution.md",
              "arckit/interaction/release-workspace/interaction.md",
              "arckit/interaction/release-workspace/default.html"
            ]
          }
        ],
        "software_invariant_changes": [],
        "project_gap_changes": [],
        "selection_context_change": {
          "current_focus": "完整实现 Release 本地终端、Git、源码、任务和场景 Agent 协作。",
          "project_priorities": [
            "Keep skills generic while Project State owns the concrete software-definition checklist and decisions.",
            "Let one Agent select dynamic gaps from all current facts without facet workflows.",
            "Apply relevant Project State changes atomically in the Gap transition that establishes them."
          ]
        },
        "evidence": [
          "arckit/spec/agentic-software-development/arcorbit-release-workspace.md",
          "arckit/tech/arcorbit/release-workspace-solution.md",
          "arckit/interaction/release-workspace/interaction.md",
          "arckit/interaction/release-workspace/default.html"
        ]
      },
      "invariant_assessment": {
        "project_revision": 355,
        "judgments": [
          {
            "invariant_ref": "product-expectations-remain-recoverable",
            "disposition": "upheld",
            "reason": "已更新对应正式事实与恢复契约。",
            "fact_refs": [
              "FACT-20260909-002-002"
            ],
            "evidence": [
              "arckit/spec/agentic-software-development/arcorbit-release-workspace.md",
              "arckit/tech/arcorbit/release-workspace-solution.md",
              "arckit/interaction/release-workspace/interaction.md",
              "arckit/interaction/release-workspace/default.html"
            ],
            "gap_refs": []
          },
          {
            "invariant_ref": "interaction-expectations-remain-recoverable",
            "disposition": "upheld",
            "reason": "已更新对应正式事实与恢复契约。",
            "fact_refs": [
              "FACT-20260909-002-002"
            ],
            "evidence": [
              "arckit/spec/agentic-software-development/arcorbit-release-workspace.md",
              "arckit/tech/arcorbit/release-workspace-solution.md",
              "arckit/interaction/release-workspace/interaction.md",
              "arckit/interaction/release-workspace/default.html"
            ],
            "gap_refs": []
          },
          {
            "invariant_ref": "visual-language-remains-consistent",
            "disposition": "upheld",
            "reason": "沿用既有 Desktop tokens 与 Chat 组件，不新增视觉语言。",
            "fact_refs": [
              "FACT-20260909-002-002"
            ],
            "evidence": [
              "arckit/visual/_library/brief.md",
              "arckit/interaction/release-workspace/interaction.md"
            ],
            "gap_refs": []
          },
          {
            "invariant_ref": "technical-decisions-remain-explainable",
            "disposition": "upheld",
            "reason": "已更新对应正式事实与恢复契约。",
            "fact_refs": [
              "FACT-20260909-002-002"
            ],
            "evidence": [
              "arckit/spec/agentic-software-development/arcorbit-release-workspace.md",
              "arckit/tech/arcorbit/release-workspace-solution.md",
              "arckit/interaction/release-workspace/interaction.md",
              "arckit/interaction/release-workspace/default.html"
            ],
            "gap_refs": []
          },
          {
            "invariant_ref": "accepted-facts-are-realized",
            "disposition": "threatened",
            "reason": "真实实现及原生模块/并发验证尚待完成。",
            "fact_refs": [
              "FACT-20260909-002-002"
            ],
            "evidence": [
              "arckit/spec/agentic-software-development/arcorbit-release-workspace.md",
              "arckit/tech/arcorbit/release-workspace-solution.md",
              "arckit/interaction/release-workspace/interaction.md",
              "arckit/interaction/release-workspace/default.html"
            ],
            "gap_refs": [
              "GAP-20260909-002-002"
            ]
          },
          {
            "invariant_ref": "material-risks-have-credible-evidence",
            "disposition": "threatened",
            "reason": "真实实现及原生模块/并发验证尚待完成。",
            "fact_refs": [
              "FACT-20260909-002-002"
            ],
            "evidence": [
              "arckit/spec/agentic-software-development/arcorbit-release-workspace.md",
              "arckit/tech/arcorbit/release-workspace-solution.md",
              "arckit/interaction/release-workspace/interaction.md",
              "arckit/interaction/release-workspace/default.html"
            ],
            "gap_refs": [
              "GAP-20260909-002-002"
            ]
          }
        ]
      },
      "evidence": [
        "arckit/spec/agentic-software-development/arcorbit-release-workspace.md",
        "arckit/tech/arcorbit/release-workspace-solution.md",
        "arckit/interaction/release-workspace/interaction.md",
        "arckit/interaction/release-workspace/default.html"
      ],
      "runtime_result_ref": "",
      "occurred_at": "2026-09-09T11:04:10.912Z"
    },
    {
      "round": 2,
      "transition_schema_version": "arckit-case-transition/v8",
      "goal": "正式 Desktop 真实实现并验证已接受的 Release 核心工作台契约。",
      "outcome": "needs_human",
      "gap_selection": {
        "mode": "candidate",
        "basis": "用户要求继续完整实施；接受真实实现结果并明确剩余未获授权的封装验收。",
        "snapshot_token": "8cbfb3cfa3b0b38bec1728e5d76229b150f043c7c678c87c32c25006f86fe5af",
        "selected_ref": "case-gap:CASE-20260909-002:GAP-20260909-002-002",
        "comparison_summary": "选择 Release；四个 Project 候选和另一 Case 人工发布与当前范围独立，保持暂缓。",
        "fresh_discovery_summary": "发现具体封装执行授权缺口，以持久事实和新 gap 保留，不冒称完成。",
        "considered": [
          {
            "ref": "project-gap:GAP-agent-scenario-evaluation",
            "source": "persisted",
            "eligibility": "case_required",
            "disposition": "deferred",
            "reason": "与当前 Release 实施独立，保留原责任。",
            "priority_basis": {
              "uncertainty": "high",
              "risk": "high"
            }
          },
          {
            "ref": "project-gap:GAP-runtime-resilience-and-adapters",
            "source": "persisted",
            "eligibility": "case_required",
            "disposition": "deferred",
            "reason": "与当前 Release 实施独立，保留原责任。",
            "priority_basis": {
              "risk": "high",
              "urgency": "medium"
            }
          },
          {
            "ref": "project-gap:GAP-security-real-project-validation",
            "source": "persisted",
            "eligibility": "case_required",
            "disposition": "deferred",
            "reason": "与当前 Release 实施独立，保留原责任。",
            "priority_basis": {
              "risk": "high",
              "urgency": "medium"
            }
          },
          {
            "ref": "project-gap:GAP-cross-record-audit",
            "source": "persisted",
            "eligibility": "case_required",
            "disposition": "deferred",
            "reason": "与当前 Release 实施独立，保留原责任。",
            "priority_basis": {
              "risk": "high",
              "urgency": "high"
            }
          },
          {
            "ref": "case-gap:CASE-20260901-001:GAP-20260901-001-005",
            "source": "persisted",
            "eligibility": "ready",
            "disposition": "deferred",
            "reason": "与当前 Release 实施独立，保留原责任。",
            "priority_basis": {
              "blocking": "",
              "uncertainty": "",
              "risk": "high",
              "user_impact": "",
              "dependency": "blocks public push and source repository archival"
            }
          },
          {
            "ref": "case-gap:CASE-20260909-002:GAP-20260909-002-002",
            "source": "persisted",
            "eligibility": "ready",
            "disposition": "selected",
            "reason": "当前用户明确事项，其实现证据与剩余边界已确定。",
            "priority_basis": {
              "blocking": "",
              "uncertainty": "",
              "risk": "",
              "user_impact": "requested working functionality"
            }
          }
        ]
      },
      "selected_gap": {
        "id": "GAP-20260909-002-002",
        "responsibility": "agent",
        "goal": "正式 Desktop 真实实现并验证已接受的 Release 核心工作台契约。",
        "reason": "契约明确但生产 Release 仍为静态示意，真实执行服务与页面尚缺。",
        "derived_from": [
          "FACT-20260909-002-002"
        ],
        "blocked_by": [],
        "priority_basis": {
          "blocking": "",
          "uncertainty": "",
          "risk": "",
          "user_impact": "requested working functionality"
        },
        "evidence_required": [
          "真实进程、Git、文件与多项目流程验证",
          "正式 Renderer 和安装包依赖验证",
          "共享 Agent 契约与既有功能回归"
        ]
      },
      "planned_transition": {
        "goal": "正式 Desktop 真实实现并验证已接受的 Release 核心工作台契约。",
        "expected_state_change": "接受已验证的核心实现；保留尚未获授权的安装包验收，不宣称 Case 完成。"
      },
      "accepted_state_delta": {
        "resolved_gap": {
          "id": "GAP-20260909-002-002",
          "status": "cancelled",
          "outcome": "核心实现与开发态验证已完成；原聚合验收拆解为已验证事实和剩余封装交付验证，不能声称完整验收通过。",
          "reason": "Lazygit 下载、用户级原生缓存重建和离线 ASAR 运行请求均未获授权；保留明确的后续义务。",
          "evidence": [
            "arckit/cases/evidence/CASE-20260909-002/verification.md",
            "arckit/cases/evidence/CASE-20260909-002/release-electron.json",
            "arckit/cases/evidence/CASE-20260909-002/release-services.tap",
            "arckit/cases/evidence/CASE-20260909-002/regression.tap"
          ]
        },
        "facts_added": [
          {
            "id": "FACT-20260909-002-003",
            "revision": 1,
            "status": "accepted",
            "statement": "生产 Release 工作台已实现真实终端、Git/源码、项目任务及共享 Chat/Idea 场景 Agent；608 项非 GUI 回归通过，10 项最终服务测试和最新开发态 Electron 9 个检查通过。",
            "basis": "实际源码、真实隔离仓库/进程/Renderer 证据，外部模型为确定性替身。",
            "evidence": [
              "arckit/cases/evidence/CASE-20260909-002/verification.md",
              "arckit/cases/evidence/CASE-20260909-002/release-electron.json",
              "arckit/cases/evidence/CASE-20260909-002/release-services.tap",
              "arckit/cases/evidence/CASE-20260909-002/regression.tap"
            ]
          },
          {
            "id": "FACT-20260909-002-004",
            "revision": 1,
            "status": "accepted",
            "statement": "Lazygit 二进制尚未获取；原生重建及封装载荷运行未获授权，安装包验收未完成。开发态证据不能替代封装、签名和装机验证。",
            "basis": "当前会话执行工具返回 rejected by user，未绕过；离线资源与 ASAR 测试载荷准备完成。",
            "evidence": [
              "arckit/cases/evidence/CASE-20260909-002/verification.md",
              "runtime/arcorbit/scripts/prepare-release-asar-smoke.mjs",
              "runtime/arcorbit/scripts/prepare-lazygit.mjs"
            ]
          }
        ],
        "facts_superseded": [],
        "impacts_added": [],
        "impacts_updated": [],
        "gaps_added": [
          {
            "id": "GAP-20260909-002-003",
            "status": "open",
            "resolution": null,
            "goal": "取得必要执行授权后，完成 Release 安装包及可选 Lazygit 的实际交付验证。",
            "reason": "现有实现和开发态验证已通过，但获取高级 Git 二进制、原生重建及封装后运行的授权被拒绝，需用户恢复这些具体授权后由 Agent 完成验证。",
            "derived_from": [
              "FACT-20260909-002-004"
            ],
            "blocked_by": [],
            "responsibility": "human",
            "priority_basis": {
              "blocking": "installation acceptance requires the declined execution permissions",
              "user_impact": "用户要求完整实施"
            },
            "evidence_required": [
              "明确允许所需下载/缓存写入及封装运行，或用户指定可用的既有工具和验证环境",
              "真实安装包依赖、PTY、Monaco 离线 worker 与 Lazygit 可用性证据"
            ]
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
        "project_revision": 356,
        "judgments": [
          {
            "invariant_ref": "product-expectations-remain-recoverable",
            "disposition": "upheld",
            "reason": "正式规格、交互、技术说明及已有主题/共享组件与实现相互对应。",
            "fact_refs": [
              "FACT-20260909-002-003"
            ],
            "evidence": [
              "arckit/spec/agentic-software-development/arcorbit-release-workspace.md",
              "arckit/tech/arcorbit/release-workspace-solution.md",
              "arckit/interaction/release-workspace/interaction.md",
              "arckit/cases/evidence/CASE-20260909-002/verification.md"
            ],
            "gap_refs": []
          },
          {
            "invariant_ref": "interaction-expectations-remain-recoverable",
            "disposition": "upheld",
            "reason": "正式规格、交互、技术说明及已有主题/共享组件与实现相互对应。",
            "fact_refs": [
              "FACT-20260909-002-003"
            ],
            "evidence": [
              "arckit/spec/agentic-software-development/arcorbit-release-workspace.md",
              "arckit/tech/arcorbit/release-workspace-solution.md",
              "arckit/interaction/release-workspace/interaction.md",
              "arckit/cases/evidence/CASE-20260909-002/verification.md"
            ],
            "gap_refs": []
          },
          {
            "invariant_ref": "visual-language-remains-consistent",
            "disposition": "upheld",
            "reason": "正式规格、交互、技术说明及已有主题/共享组件与实现相互对应。",
            "fact_refs": [
              "FACT-20260909-002-003"
            ],
            "evidence": [
              "arckit/spec/agentic-software-development/arcorbit-release-workspace.md",
              "arckit/tech/arcorbit/release-workspace-solution.md",
              "arckit/interaction/release-workspace/interaction.md",
              "arckit/cases/evidence/CASE-20260909-002/verification.md"
            ],
            "gap_refs": []
          },
          {
            "invariant_ref": "technical-decisions-remain-explainable",
            "disposition": "upheld",
            "reason": "正式规格、交互、技术说明及已有主题/共享组件与实现相互对应。",
            "fact_refs": [
              "FACT-20260909-002-003"
            ],
            "evidence": [
              "arckit/spec/agentic-software-development/arcorbit-release-workspace.md",
              "arckit/tech/arcorbit/release-workspace-solution.md",
              "arckit/interaction/release-workspace/interaction.md",
              "arckit/cases/evidence/CASE-20260909-002/verification.md"
            ],
            "gap_refs": []
          },
          {
            "invariant_ref": "accepted-facts-are-realized",
            "disposition": "threatened",
            "reason": "核心开发态证据充分，但封装交付验证未完成，保留明确人工授权义务。",
            "fact_refs": [
              "FACT-20260909-002-004"
            ],
            "evidence": [
              "arckit/cases/evidence/CASE-20260909-002/verification.md",
              "arckit/cases/evidence/CASE-20260909-002/release-electron.json",
              "arckit/cases/evidence/CASE-20260909-002/release-services.tap",
              "arckit/cases/evidence/CASE-20260909-002/regression.tap"
            ],
            "gap_refs": [
              "GAP-20260909-002-003"
            ]
          },
          {
            "invariant_ref": "material-risks-have-credible-evidence",
            "disposition": "threatened",
            "reason": "核心开发态证据充分，但封装交付验证未完成，保留明确人工授权义务。",
            "fact_refs": [
              "FACT-20260909-002-004"
            ],
            "evidence": [
              "arckit/cases/evidence/CASE-20260909-002/verification.md",
              "arckit/cases/evidence/CASE-20260909-002/release-electron.json",
              "arckit/cases/evidence/CASE-20260909-002/release-services.tap",
              "arckit/cases/evidence/CASE-20260909-002/regression.tap"
            ],
            "gap_refs": [
              "GAP-20260909-002-003"
            ]
          }
        ]
      },
      "evidence": [
        "arckit/cases/evidence/CASE-20260909-002/verification.md",
        "arckit/cases/evidence/CASE-20260909-002/release-electron.json",
        "arckit/cases/evidence/CASE-20260909-002/release-services.tap",
        "arckit/cases/evidence/CASE-20260909-002/regression.tap"
      ],
      "runtime_result_ref": "",
      "occurred_at": "2026-09-09T14:11:26.262Z"
    },
    {
      "round": 3,
      "transition_schema_version": "arckit-case-transition/v8",
      "goal": "取得必要执行授权后，完成 Release 安装包及可选 Lazygit 的实际交付验证。",
      "outcome": "needs_human",
      "gap_selection": {
        "mode": "candidate",
        "basis": "用户明确恢复 Lazygit 下载安装并要求重新申请批准；记录已成功执行的步骤与再次被拒绝的剩余步骤。",
        "snapshot_token": "cb14fc6bc2ea864e56d72102252a14d4ee38fa556503b2e75288a3cfdf6ae2e6",
        "selected_ref": "case-gap:CASE-20260909-002:GAP-20260909-002-003",
        "comparison_summary": "选择 Release 当前交付义务；独立 Idea 接入、四项 Project 验证与原有人工发布保持暂缓。",
        "fresh_discovery_summary": "Lazygit 与首轮构建成功；封装验证发现输入初始化竞态，修复已获开发态证据，但修复后的重打包被拒绝。",
        "considered": [
          {
            "ref": "project-gap:GAP-agent-scenario-evaluation",
            "source": "persisted",
            "eligibility": "case_required",
            "disposition": "deferred",
            "reason": "与当前批准重试独立，保留原责任与并发事项。",
            "priority_basis": {
              "uncertainty": "high",
              "risk": "high"
            }
          },
          {
            "ref": "project-gap:GAP-runtime-resilience-and-adapters",
            "source": "persisted",
            "eligibility": "case_required",
            "disposition": "deferred",
            "reason": "与当前批准重试独立，保留原责任与并发事项。",
            "priority_basis": {
              "risk": "high",
              "urgency": "medium"
            }
          },
          {
            "ref": "project-gap:GAP-security-real-project-validation",
            "source": "persisted",
            "eligibility": "case_required",
            "disposition": "deferred",
            "reason": "与当前批准重试独立，保留原责任与并发事项。",
            "priority_basis": {
              "risk": "high",
              "urgency": "medium"
            }
          },
          {
            "ref": "project-gap:GAP-cross-record-audit",
            "source": "persisted",
            "eligibility": "case_required",
            "disposition": "deferred",
            "reason": "与当前批准重试独立，保留原责任与并发事项。",
            "priority_basis": {
              "risk": "high",
              "urgency": "high"
            }
          },
          {
            "ref": "case-gap:CASE-20260901-001:GAP-20260901-001-005",
            "source": "persisted",
            "eligibility": "ready",
            "disposition": "deferred",
            "reason": "与当前批准重试独立，保留原责任与并发事项。",
            "priority_basis": {
              "blocking": "",
              "uncertainty": "",
              "risk": "high",
              "user_impact": "",
              "dependency": "blocks public push and source repository archival"
            }
          },
          {
            "ref": "case-gap:CASE-20260909-002:GAP-20260909-002-003",
            "source": "persisted",
            "eligibility": "ready",
            "disposition": "selected",
            "reason": "当前用户恢复具体执行授权，存在真实部分交付结果。",
            "priority_basis": {
              "blocking": "installation acceptance requires the declined execution permissions",
              "uncertainty": "",
              "risk": "",
              "user_impact": "用户要求完整实施"
            }
          },
          {
            "ref": "case-gap:CASE-20260909-003:GAP-20260909-003-002",
            "source": "persisted",
            "eligibility": "ready",
            "disposition": "deferred",
            "reason": "与当前批准重试独立，保留原责任与并发事项。",
            "priority_basis": {
              "blocking": "",
              "uncertainty": "",
              "risk": "",
              "user_impact": "",
              "dependency": "required for accepted product outcome"
            }
          }
        ]
      },
      "selected_gap": {
        "id": "GAP-20260909-002-003",
        "responsibility": "human",
        "goal": "取得必要执行授权后，完成 Release 安装包及可选 Lazygit 的实际交付验证。",
        "reason": "现有实现和开发态验证已通过，但获取高级 Git 二进制、原生重建及封装后运行的授权被拒绝，需用户恢复这些具体授权后由 Agent 完成验证。",
        "derived_from": [
          "FACT-20260909-002-004"
        ],
        "blocked_by": [],
        "priority_basis": {
          "blocking": "installation acceptance requires the declined execution permissions",
          "uncertainty": "",
          "risk": "",
          "user_impact": "用户要求完整实施"
        },
        "evidence_required": [
          "明确允许所需下载/缓存写入及封装运行，或用户指定可用的既有工具和验证环境",
          "真实安装包依赖、PTY、Monaco 离线 worker 与 Lazygit 可用性证据"
        ]
      },
      "planned_transition": {
        "goal": "取得必要执行授权后，完成 Release 安装包及可选 Lazygit 的实际交付验证。",
        "expected_state_change": "接受 Lazygit 安装、原生重建、首轮封装及问题修复证据；准确保留未获批准的重新打包验收。"
      },
      "accepted_state_delta": {
        "resolved_gap": {
          "id": "GAP-20260909-002-003",
          "status": "cancelled",
          "outcome": "此前聚合授权缺口已部分消除：安装、原生重建和首轮 .app 成功；替换为修复后的重新打包与封装验收义务。",
          "reason": "用户批准重试带来实际进展，但随后的重新打包请求被拒绝，不能记录为完整验收。",
          "evidence": [
            "arckit/cases/evidence/CASE-20260909-002/lazygit-install.json",
            "arckit/cases/evidence/CASE-20260909-002/packaging-progress.json",
            "arckit/cases/evidence/CASE-20260909-002/release-electron.json",
            "arckit/cases/evidence/CASE-20260909-002/verification.md"
          ]
        },
        "facts_added": [
          {
            "id": "FACT-20260909-002-004",
            "revision": 2,
            "status": "accepted",
            "statement": "Lazygit 已安装、原生重建及首轮 .app 已成功；封装流程暴露的 Agent 输入初始化竞态已修复并通过开发态复测，但重新打包请求被拒绝，最终封装验收仍未完成。",
            "basis": "用户重新授权、实际命令回执、封装测试结果和最新开发态 Electron 证据。",
            "evidence": [
              "arckit/cases/evidence/CASE-20260909-002/lazygit-install.json",
              "arckit/cases/evidence/CASE-20260909-002/packaging-progress.json",
              "arckit/cases/evidence/CASE-20260909-002/release-electron.json",
              "arckit/cases/evidence/CASE-20260909-002/verification.md"
            ]
          },
          {
            "id": "FACT-20260909-002-005",
            "revision": 1,
            "status": "accepted",
            "statement": "官方 Lazygit v0.65.0 darwin-x64 已按固定 SHA-256 验证并安装，ArcOrbit 工具发现及实际 PTY 面板、resize、键盘输入、退出验证通过。",
            "basis": "下载成功、安装收据、--version 与临时仓库真实执行验证。",
            "evidence": [
              "arckit/cases/evidence/CASE-20260909-002/lazygit-install.json"
            ]
          }
        ],
        "facts_superseded": [
          {
            "id": "FACT-20260909-002-004",
            "revision": 1,
            "reason": "下载和首轮打包的旧阻塞已消除，剩余问题缩小为修复后的重新打包验收。",
            "evidence": [
              "arckit/cases/evidence/CASE-20260909-002/lazygit-install.json",
              "arckit/cases/evidence/CASE-20260909-002/packaging-progress.json",
              "arckit/cases/evidence/CASE-20260909-002/release-electron.json",
              "arckit/cases/evidence/CASE-20260909-002/verification.md"
            ]
          }
        ],
        "impacts_added": [],
        "impacts_updated": [],
        "gaps_added": [
          {
            "id": "GAP-20260909-002-004",
            "status": "open",
            "resolution": null,
            "goal": "允许修复后的 ArcOrbit 重新打包，并完成包含 Agent、PTY 与随包 Lazygit 的封装流程验收。",
            "reason": "源码修复已通过开发态验证，但再次 electron-builder 执行请求被拒绝；现有首轮包不含最后修复。",
            "derived_from": [
              "FACT-20260909-002-004"
            ],
            "blocked_by": [],
            "responsibility": "human",
            "priority_basis": {
              "blocking": "declined repackage request",
              "user_impact": "final packaged acceptance"
            },
            "evidence_required": [
              "重新允许修复后的本地打包与封装运行验证",
              "更新后的实际应用包，以及包内终端、Git、Monaco、场景 Agent 和 Lazygit 验证回执"
            ]
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
        "project_revision": 357,
        "judgments": [
          {
            "invariant_ref": "product-expectations-remain-recoverable",
            "disposition": "upheld",
            "reason": "既有正式契约仍适用；当前重试落实依赖并恢复输入初始化的一致行为。",
            "fact_refs": [
              "FACT-20260909-002-005"
            ],
            "evidence": [
              "arckit/cases/evidence/CASE-20260909-002/lazygit-install.json",
              "arckit/cases/evidence/CASE-20260909-002/packaging-progress.json",
              "arckit/cases/evidence/CASE-20260909-002/release-electron.json",
              "arckit/cases/evidence/CASE-20260909-002/verification.md"
            ],
            "gap_refs": []
          },
          {
            "invariant_ref": "interaction-expectations-remain-recoverable",
            "disposition": "upheld",
            "reason": "既有正式契约仍适用；当前重试落实依赖并恢复输入初始化的一致行为。",
            "fact_refs": [
              "FACT-20260909-002-005"
            ],
            "evidence": [
              "arckit/cases/evidence/CASE-20260909-002/lazygit-install.json",
              "arckit/cases/evidence/CASE-20260909-002/packaging-progress.json",
              "arckit/cases/evidence/CASE-20260909-002/release-electron.json",
              "arckit/cases/evidence/CASE-20260909-002/verification.md"
            ],
            "gap_refs": []
          },
          {
            "invariant_ref": "visual-language-remains-consistent",
            "disposition": "upheld",
            "reason": "既有正式契约仍适用；当前重试落实依赖并恢复输入初始化的一致行为。",
            "fact_refs": [
              "FACT-20260909-002-005"
            ],
            "evidence": [
              "arckit/cases/evidence/CASE-20260909-002/lazygit-install.json",
              "arckit/cases/evidence/CASE-20260909-002/packaging-progress.json",
              "arckit/cases/evidence/CASE-20260909-002/release-electron.json",
              "arckit/cases/evidence/CASE-20260909-002/verification.md"
            ],
            "gap_refs": []
          },
          {
            "invariant_ref": "technical-decisions-remain-explainable",
            "disposition": "upheld",
            "reason": "既有正式契约仍适用；当前重试落实依赖并恢复输入初始化的一致行为。",
            "fact_refs": [
              "FACT-20260909-002-005"
            ],
            "evidence": [
              "arckit/cases/evidence/CASE-20260909-002/lazygit-install.json",
              "arckit/cases/evidence/CASE-20260909-002/packaging-progress.json",
              "arckit/cases/evidence/CASE-20260909-002/release-electron.json",
              "arckit/cases/evidence/CASE-20260909-002/verification.md"
            ],
            "gap_refs": []
          },
          {
            "invariant_ref": "accepted-facts-are-realized",
            "disposition": "threatened",
            "reason": "安装与开发态证据已推进，最终封装验收仍需被拒绝的重打包授权。",
            "fact_refs": [
              "FACT-20260909-002-004"
            ],
            "evidence": [
              "arckit/cases/evidence/CASE-20260909-002/lazygit-install.json",
              "arckit/cases/evidence/CASE-20260909-002/packaging-progress.json",
              "arckit/cases/evidence/CASE-20260909-002/release-electron.json",
              "arckit/cases/evidence/CASE-20260909-002/verification.md"
            ],
            "gap_refs": [
              "GAP-20260909-002-004"
            ]
          },
          {
            "invariant_ref": "material-risks-have-credible-evidence",
            "disposition": "threatened",
            "reason": "安装与开发态证据已推进，最终封装验收仍需被拒绝的重打包授权。",
            "fact_refs": [
              "FACT-20260909-002-004"
            ],
            "evidence": [
              "arckit/cases/evidence/CASE-20260909-002/lazygit-install.json",
              "arckit/cases/evidence/CASE-20260909-002/packaging-progress.json",
              "arckit/cases/evidence/CASE-20260909-002/release-electron.json",
              "arckit/cases/evidence/CASE-20260909-002/verification.md"
            ],
            "gap_refs": [
              "GAP-20260909-002-004"
            ]
          }
        ]
      },
      "evidence": [
        "arckit/cases/evidence/CASE-20260909-002/lazygit-install.json",
        "arckit/cases/evidence/CASE-20260909-002/packaging-progress.json",
        "arckit/cases/evidence/CASE-20260909-002/release-electron.json",
        "arckit/cases/evidence/CASE-20260909-002/verification.md"
      ],
      "runtime_result_ref": "",
      "occurred_at": "2026-09-09T15:41:27.471Z"
    }
  ],
  "case_resolution": {
    "status": "unresolved",
    "stage": "working",
    "satisfied": [
      "GAP-20260909-002-001",
      "GAP-20260909-002-002",
      "GAP-20260909-002-003"
    ],
    "remaining": [
      "GAP-20260909-002-004"
    ],
    "blocked": [],
    "reason": "1 Case obligation(s) remain.",
    "candidate_gaps": [
      {
        "id": "GAP-20260909-002-004",
        "responsibility": "human",
        "goal": "允许修复后的 ArcOrbit 重新打包，并完成包含 Agent、PTY 与随包 Lazygit 的封装流程验收。",
        "reason": "源码修复已通过开发态验证，但再次 electron-builder 执行请求被拒绝；现有首轮包不含最后修复。",
        "derived_from": [
          "FACT-20260909-002-004"
        ],
        "blocked_by": [],
        "priority_basis": {
          "blocking": "declined repackage request",
          "uncertainty": "",
          "risk": "",
          "user_impact": "final packaged acceptance"
        },
        "evidence_required": [
          "重新允许修复后的本地打包与封装运行验证",
          "更新后的实际应用包，以及包内终端、Git、Monaco、场景 Agent 和 Lazygit 验证回执"
        ]
      }
    ],
    "loop_handoff": {
      "version": "loop-handoff/v2",
      "status": "needs_human",
      "next_responsibility": "human",
      "agent_continuation_available": false,
      "human_decision_required": true,
      "trigger_mode": "user_decision",
      "responsibility_reason": "源码修复已通过开发态验证，但再次 electron-builder 执行请求被拒绝；现有首轮包不含最后修复。",
      "next_prompt": "",
      "human_gate": {
        "required": true,
        "reason": "源码修复已通过开发态验证，但再次 electron-builder 执行请求被拒绝；现有首轮包不含最后修复。",
        "decision_needed": "允许修复后的 ArcOrbit 重新打包，并完成包含 Agent、PTY 与随包 Lazygit 的封装流程验收。"
      }
    },
    "updated_at": "2026-09-09T15:41:27.471Z"
  }
}
```

## Round Notes

- Case history is canonical in Structured Record.rounds; keep prose notes exceptional.
