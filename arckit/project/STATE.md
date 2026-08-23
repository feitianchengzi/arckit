# Arckit Skill Repository Project State

Status: active
Revision: 182
Updated: 2026-08-23T09:24:54.182Z
Canonical Record: state.record.json

## Project Intent

治理 Arckit skill 体系，使其同时支撑 Codex 类人机协作和自动化平台的软件开发接力协议。

## Current Focus

将 ArcOrbit Chat 从计划展示升级为架构完整、可持续演进的真实 Codex 自由对话能力，同时保持与 Automation 待办执行会话的清晰隔离。

## Active Work

- Active cases: 0
- Project gaps: 4
- GAP-agent-scenario-evaluation: Validate dynamic gap selection in isolated real software scenarios.
- GAP-runtime-resilience-and-adapters: Strengthen Runtime timeout, transcript compaction and required adapter boundaries.
- GAP-security-real-project-validation: Validate security boundaries in a real permission-bearing project.
- GAP-cross-record-audit: Accept strict Project, Iteration and Case cross-record auditing in real use.

## Software Definition

Arckit is a state-driven software-development protocol and optional supervised Runtime. Project State owns explicit software-definition decisions; one Agent advances facts and dynamic gaps through trusted atomic ledger transitions.

| Decision Area | Status | Revision | Current Decision | Project Gaps |
| --- | --- | ---: | --- | --- |
| product_intent_and_scope | settled | 3 | Arckit is the repository-owned development protocol and skill system; ArcOrbit is its supervised Desktop/Runtime product and is expanding into a local-project-anchored, multi-product software-development platform for people who coordinate organization, product, member, todo, AI execution, and feedback work without relying on the Todo or Feedback web clients for daily operation. | - |
| product_capabilities | settled | 19 | ArcOrbit 保留 Setup Readiness、受监督的一待办一 thread Automation、trusted ledger transition、介入/恢复、验收反馈、Workshop 平台组合、Work 日常管理与产品反馈能力。Personal / Chat 升级为绑定本地 Product Workspace 的真实 Codex 自由对话，支持持久会话、固定 thread、流式消息、工具与审批状态、停止、失败/重启恢复、重命名和安全删除；Chat 不创建或转换 Idea、Work、Task、Case、ledger 或 Automation Run。Idea、Release、Operations 和 Engineering 继续作为 planning-only 工作空间。既有 Workshop realtime、Work、Feedback、Organization、Domain Profile、Automation human Gate 和分发边界保持不变。 | - |
| runtime_surfaces | settled | 4 | The software comprises repository-owned Arckit skills and Node.js ledger CLIs plus ArcOrbit, an Electron platform Desktop with Setup Readiness, skill provisioning, a main-process Platform Coordinator, restricted Workshop Platform Adapter, Automation Coordinator, Runtime supervisor, Codex adapter, and packaged trusted capability resources. Workshop web clients remain available administration and source surfaces but are not required for ArcOrbit daily work. | - |
| experience_and_interaction | settled | 31 | ArcOrbit 保持 Personal、Product Lifecycle、Organization 三组导航和既有 Work、Automation、Feedback、Organization、Setup、账户及产品反馈语义。Personal / Chat 使用会话列表、独立 transcript 和 Composer：首条非空消息才创建会话；会话固定绑定一个本地 Product Workspace 和 Codex thread；支持选择、重命名、删除、跨页面后台运行和重启恢复。消息以稳定 item 流式更新，支持 Markdown、代码复制、折叠非空 reasoning、单行工具状态、用户审批和智能自动滚动。starting、running、waiting approval 状态均可停止；interrupt 保留部分回答，继续操作会在同一 thread 启动新 turn。删除活动会话先等待 interrupt 终态，失败时不部分删除。没有可用本地工作区时允许保留草稿但禁止发送，并提供配置恢复入口。Chat 不调用 state-driven Runtime，不转换其他对象；Automation task thread、human Gate 和介入工作台保持独立。Idea、Release、Operations 和 Engineering 继续呈现计划交互。 | - |
| visual_language | settled | 2 | Visual requirements apply to the Desktop workspace and follow its durable visual specification; CLI and ledger surfaces remain text-native. | - |
| identity_and_access | settled | 3 | Authentication is required only for configured execution/task sources; authorization remains bounded by user approval, workspace scope, sandbox and trusted entrypoints. Runtime sessions use a server-backed rolling seven-day inactivity window: successful verification login, successful startup session restoration/refresh, or successful token refresh renews the window through rotated server credentials; only more than seven days without such activity, missing or expired credentials, explicit logout, or explicit server rejection/revocation requires login again. ArcOrbit 产品反馈要求有效 Workshop 登录，并以服务端 current-user 的不可变业务 ID 作为反馈身份；退出或切换账户会关闭旧反馈上下文。 | - |
| data_and_state | settled | 14 | Canonical development state 继续位于 Project/Iteration/Case ledger，Workshop 继续拥有账户、组织、项目、成员、任务、附件和普通反馈真相；ArcOrbit 继续拥有 Product Workspace 绑定、Workset、Runtime execution/session/thread、介入恢复、验收反馈、realtime cursor 和 bundled-skill control-plane state。ArcOrbit 还拥有本地 Chat session、消息、Composer 草稿、选中状态、Product Workspace/规范化项目根归属、Codex thread binding、turn/item 引用和最近运行/恢复状态。Chat 数据不写入 Workshop 或 ledger，不与 Automation task session 合并。删除会话仅移除 ArcOrbit 本地记录和恢复能力，不声明擦除 Codex 可能保留的底层 thread；活动删除必须先完成 interrupt，任一步失败均不得部分删除。 | - |
| external_integrations | settled | 9 | ArcOrbit 继续通过显式 main-process adapters 集成 Codex app-server/CLI、Workshop 和 Feedback，并保持 Renderer 无凭据、无通用请求能力。真实 Chat 使用可复用的 Codex Conversation 基础层处理 app-server initialize、persistent thread start/resume、turn start/interrupt、streamed items、token usage 和 approval request；ChatCoordinator 直接提交用户文本，不设置 Agent Loop output schema，也不调用 state-driven Runtime、trusted ledger 或 Automation Coordinator。Workshop realtime、Platform Adapter、Automation adapter、Feedback V2 和产品反馈 SDK 的既有契约与恢复行为保持不变。 | - |
| feedback_and_support | settled | 6 | Operational feedback uses the persistent Agent conversation, Runtime activity/events, diagnostics and task-source synchronization. Recovery feedback continues an interrupted active execution on its task session/thread; acceptance feedback from completed or accepted review creates an independent persisted work item, keeps the source todo terminal, reuses its session/thread and exposes issue progress and solution evidence. No separate public support portal is currently required. ArcOrbit 同时提供自身产品反馈中心：一个入口内向固定 Feedback Project 107 提交反馈、查看当前用户反馈并显示 SDK 未读数量角标；它使用 Feedback SDK V2，与 Runtime 恢复反馈、验收问题和 Workset 普通用户反馈相互独立。 | - |
| commercialization_and_entitlement | settled | 1 | Arckit currently has no payment, subscription, trial, quota or commercial feature-entitlement model. | - |
| technical_foundation | settled | 28 | Arckit 继续使用 repository-owned Markdown/JSON state 与 Node.js ESM ledger CLI；ArcOrbit 继续作为 Electron Desktop/Runtime host，并保留 policy-neutral Runtime Kernel、persistent one-thread-per-todo、Platform Coordinator、restricted Workshop adapters、utilityProcess Runtime、trusted in-process ledger entrypoints、project-only skill provisioning、Feedback SDK WebContents 和现代/旧版 realtime 协议边界。真实 Chat 的 accepted architecture 在 main process 增加独立 ChatCoordinator 和 kind=chat Store ownership，并从现有 Codex adapter 中抽取可复用 Conversation 层：app-server client、persistent thread start/resume、turn start/interrupt、通用事件 projector、token usage 和异步 approval provider。State-driven Runtime 只在该基础层之上保留 using-arckit、Agent Loop schema、fresh ledger snapshot、Gap Loop、Automation lease 和 closeout 语义，Chat 不复用这些语义。每个活动 Chat session 拥有与其固定项目根对应的 adapter owner；不同 Chat session 和 Automation owner 不共享活动 turn 或 lease。typed Chat IPC 只提供 snapshot/create/select/rename/delete/send/interrupt/approvalDecision；select 只持久化经 main process 验证的 Chat session 选择，不改变 draft、thread 或 session updated_at。Renderer 不能提供任意 cwd、thread id、Codex method、文件权限或 shell command。 | - |
| security_privacy_compliance | settled | 4 | Runtime 与 Workshop 服务凭据继续保持在受控存储和 main-process 边界内；ArcOrbit 产品反馈 bundled-static Project 107 API Key 例外及其最小权限、可轮换、不得进入 URL/Renderer/IPC/log 的规则保持不变。真实 Chat 的 Renderer 只能使用类型化 IPC，不能选择任意 cwd/thread/method、读取 raw JSON-RPC、获得 Codex 进程或文件系统通用权限。Codex command、file change 和 permissions request 必须通过异步受限 approvalProvider 返回；窗口关闭、超时、session/request 不匹配或用户拒绝均 fail closed。Chat session/thread ownership 与 Automation task session/thread/lease 双向隔离。 | - |
| quality_and_validation | settled | 6 | 既有协议、Runtime、realtime、Work 和安全验证义务保持不变。真实 Chat 还必须以 adapter、Store、Coordinator、typed main/preload IPC、Renderer 和真实 app-server smoke 的跨层证据证明：首条消息幂等创建 session/thread；连续 turn resume 同一 thread；不同 Chat/Automation owner 隔离；稳定 item streaming、Markdown、reasoning/tool 投影和智能滚动正确；starting/running/waiting approval 均可 interrupt；部分输出和重启恢复不重复请求；活动删除先 interrupt 且无部分删除；审批异步并 fail closed；Renderer 无法覆盖 cwd/thread/method/command；Chat 不触发 using-arckit、ledger、Workshop mutation、Automation lease 或 human Gate。 | - |
| delivery_and_distribution | settled | 6 | Arckit skills are sourced from the repository and ArcOrbit applies its locked payload only to normalized local project roots explicitly associated through Product Workspaces; it does not install bundled skills, shared assets or loaders into the Codex user-level skill directory. Source availability recommendations remain generic, while ArcOrbit uses a project-only invocation policy, per-project relations and confirmed migration of legacy managed user targets. Governed ArcOrbit installers are produced only by manually dispatched GitHub workflows against an existing tf/*, beta/* or appstore/* release-intent tag, bundle locked trusted resources, the Arckit skill payload and an exact ArcForge provider artifact, and support macOS arm64/x64, Windows x64 and Linux x64 with explicit signing and draft-release choices. A repository-local validation entrypoint may build current-host unsigned artifacts only when provider, ArcOrbit metadata, repository identity and workflow are explicitly labeled local; those artifacts carry no release authorization and are never published by governed workflows. | - |
| observability_and_operation | settled | 7 | Runtime persists lifecycle, activity, messages and timing outside the target project, supports restart reconciliation and exposes opaque Run refs. It separately projects ledger candidate catalogs, Agent selection traces, accepted round closeouts and post-commit fresh-read receipts, and also presents ordinary todo state separately from acceptance-feedback queue counts, item status, current Run/Case, progress, evidence and blocking responsibility alongside one active execution. Automation exposes per-project realtime health, resumable/legacy mode, modern cursor progress and latest refresh time; it reports reconnecting, degraded, compatible and recovered transitions. It uses 15-minute reconciliation, lifecycle-triggered current-state recovery and a visible immediate-sync action, has no 60-second disconnected fallback, and records that synchronization never releases a human gate. | GAP-runtime-resilience-and-adapters |

## Software Invariants

- product-expectations-remain-recoverable: Every materially affected product expectation is accurate, unambiguous, and durably recoverable.
- interaction-expectations-remain-recoverable: Every materially affected interaction expectation is coherent, complete enough to recover its decisions and states, and durably recoverable.
- visual-language-remains-consistent: Every materially affected visual expectation remains intentional, internally consistent, and durably recoverable.
- technical-decisions-remain-explainable: Every materially affected technical decision remains coherent, explainable, and durably recoverable, including its rationale and affected relationships.
- accepted-facts-are-realized: The accepted software state realizes every materially relevant accepted fact and upheld Project decision and invariant.
- material-risks-have-credible-evidence: Every material risk claim accepted in the Case is supported by credible, repeatable, and proportionate evidence.

## Read For Precision

- state.record.json
- arckit/project/iterations/ITER-20260705-001-state-driven-loop-foundation.record.json
