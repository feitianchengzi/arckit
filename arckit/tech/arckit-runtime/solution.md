# Arckit Runtime 技术方案

## 定位

Arckit Runtime 是 Arckit 的自动化监督与执行控制面。它替代人类在 Codex 会话外持续触发下一 turn、观察过程、处理恢复、调用 ledger 和衔接远端生命周期的工作；Codex、opencode 或其他 coding agent 继续拥有语义推理、skill 选择、工作区执行、证据收集和 transition claim。

Runtime 不替代 Agent 或 Arckit skills。Skills 继续承载方法、事实源维护规则、输出契约和模板；Runtime 负责 readiness preflight、读取 Project/Case 状态、通过 `$using-arckit` 启动一个连贯 Agent turn、观察执行事件、校验结构/授权/安全边界，并调用 trusted ledger entrypoint。

## 架构组件

```text
User Input
  -> Automation Supervisor
      -> Readiness Preflight
      -> Task Claim / Workspace Binding
      -> Fresh Canonical State
      -> Coherent Codex Agent Turn ($using-arckit)
      -> Structural / Authorization Gate
      -> Trusted Ledger Writeback
      -> Fresh State / Next Turn / Handoff
  -> Desktop UI
```

Runtime Kernel 是策略中立的自动化内核，不是语义微编排器。一次 Loop 对应同一 Codex thread 中的一个 Agent turn：Agent 选择一个 Case gap、调用必要 skills/tools、执行和验证工作，并返回一个 Case control、Case transition 或 handoff。Runtime 不把这个 turn 再拆成阶段化的多个 Agent invocation。

Runtime Kernel 不充当 semantic truth judge。代码不判断产品概念、架构取舍、skill 适用性或业务语义是否“真的正确”；这些语义判断来自当前 Agent、人类或显式委派方。Runtime Kernel 只验证 schema、revision、授权、工作区/路径安全、证据存在性和 ledger transition 合法性，不重做 Agent 的语义 review。

Runtime Kernel 不把 raw input envelope 当作 semantic state。Desktop operator event、完整 activity、完整 controller frame、完整 ledger write result、worker stream JSON 和上一轮完整 prompt 只属于 raw evidence 或 audit。Runtime 可以保存引用、摘要和结构化 claim，但不能把 raw envelope 写入 `round_goal`、`controller_frame.round_goal`、`loop_handoff.agent_instruction.goal`、`progress_guard.expected_state_change`、Project State `case_control` 或 Case State `current_round`。

Desktop UI 只展示 Runtime Kernel 的 control state，不自己猜测业务流程。Skills 继续提供能力说明、事实源维护规则和按需委派协议；它们不能替代 Runtime Kernel 做外部生命周期与自动续轮控制。

Skill layer 位于系统底层。Skills 只承载可复用能力、底层协议、事实源维护规则和各 execution plane 的能力边界，不沉淀 Desktop Runtime 的产品架构、状态机、自动写回策略或控制内核决策。这类上层架构事实只写入 `arckit/tech` 与 runtime 代码。

Runtime 只解析 `arckit.capability.json`，不自行解释或复制 `SKILL.md` 正文。Manifest 声明 Agent Loop 的自然 `$using-arckit` trigger 与确定性 `arckit-development-ledger` trusted entrypoints。当前 Agent 在 turn 内按 Codex 原生机制发现和使用其他已安装 skills；Runtime 不维护 definition、diagnosis、code 或其他 skill 白名单，不复制 skill 语义，也不预先生成 Worker 能力关联。

### Runtime Kernel

Runtime Kernel 当前由以下确定性阶段组成：

- Readiness Preflight：在远端任务从 pending 变为 in_progress 前检查本地工作区、canonical state、Codex adapter、Controller skill 兼容性与 trusted ledger entrypoint；失败只形成本地 readiness recovery，不先占用远端任务。
- Session State Machine：记录 `preflight -> claimed -> agent_running -> ledger_gate_ready -> ledger_written -> next_turn_ready`，并支持 `blocked`、`human_gate_required`、`external_wait`、`failed` 等控制态。
- Artifact Ownership Map：把 Agent 声明的 changed files 归类为 source fact、projection、runtime log、pending/raw input、implementation evidence 等，提供结构与安全校验，不推断业务正确性。
- Ledger Stage：当 Agent result 携带可写 Case control/transition 时做 deterministic gate；gate 允许则自动写 ledger，拒绝则从 fresh state 重规划或形成明确 handoff。
- Task Thread Registry：为每个待办持久化唯一 Codex thread id、所有权租约、最后 turn 与压缩检查点，支持进程重启后恢复同一对话。
- Context Governor：在一次 gap ledger 写回后读取最新请求的上下文占用；达到 80% 时先压缩同一 thread，再继续下一 gap。
- Same-thread Closeout：Case resolved 后由同一 Agent thread 完成验证补漏、必要修复和 Git commit/no-op 收尾，成功后才允许远端完成写回。

### State Store

State Store 读取目标项目的 Arckit 状态入口：

- `arckit/project/state.record.json`
- `arckit/project/STATE.md`
- `arckit/project/iterations/*.record.json`
- `arckit/cases/INDEX.md`
- `arckit/cases/active/*.md` 的完整 `development-case-record/v3`
- `arckit/spec/INDEX.md`
- `arckit/interaction/INDEX.md`
- `arckit/visual/INDEX.md`
- `arckit/tech/INDEX.md`

`state.record.json` 是 canonical record；Markdown brief 只作为 loop 决策摘要。

### Workshop Authenticated Service

Electron main 进程创建单个长生命周期 Workshop Authenticated Service，并把它同时作为认证服务和 Task Source Adapter 使用。该实例通过 Desktop Run Manager 的私有设置接口按请求读取最新会话，并通过同一接口持久化 token 轮换；Renderer、Worker 和 Runtime 子进程不能获得该私有接口。

认证服务固定提供以下有界操作：

- 发送邮箱或手机号登录验证码。
- 使用目标地址、验证码和验证码类型登录。
- 读取不含 token 的认证状态投影。
- 退出登录并清除远端身份。

验证码请求发送到 `auth-server/v1/public/send_verification`，固定携带 `purpose=login`。登录请求发送到 `auth-server/v1/public/login`，邮箱使用 `email` 字段，手机号使用 `phone` 字段。登录响应中的 access token、refresh token、相对或绝对过期时间被归一化后写入主进程私有设置。

业务请求前，服务重新读取私有设置。NebulaAuth access token 距过期不足五分钟时先刷新；业务请求首次返回 401 时也刷新并重试一次。所有并发刷新共享一个 in-flight Promise，成功后使用新 access token 重放原请求，失败后清除不可用 access token 并返回稳定的 `unauthenticated` 错误。刷新请求发送到 `auth-server/v1/public/refresh_token`，只携带 refresh token。认证服务与 Coordinator 分别维护会话代际；登录或退出使旧代际的在途刷新和同步结果失效，禁止旧响应在退出后恢复 token 或远端快照。

认证状态投影只有 `logged_out`、`authenticated`、`refreshing` 和 `expired`。投影包含脱敏账号标识、是否具备可刷新会话和可解释错误，不包含 access token、refresh token、原始登录响应或精确 token 过期值。

默认连接配置是正式 Workshop 服务根地址、`workshop` 业务服务和 `nebula` 认证模式。旧 store 的手填 bearer/debug headers 配置继续可被高级连接设置读取，但普通登录成功后切换为 `nebula`。

退出登录先停止新的远端请求并清除 access token、refresh token、过期时间和远端用户字段。Coordinator 随后清除远端项目/任务快照、attention/recovery 中的身份依赖项和自动领取资格；本地项目、工作区绑定、run history、transcript 与 Codex proxy 设置不受影响。存在活动任务时，main 进程要求显式确认并先请求安全停止，避免退出后失去任务状态写回能力。

### Task Source Adapter

Task Source Adapter 是远端项目与任务服务器的唯一访问边界。Renderer 和 Runtime worker 不持有服务凭证，也不直接构造远端请求。Electron main 进程创建 adapter，并通过受限 IPC 暴露投影和显式命令。

Adapter 提供以下语义操作：

- 读取当前认证用户。
- 读取当前用户可访问的项目。
- 按项目和可选状态读取任务。
- 基于任务最新版本条件式更新状态。
- 区分未认证、无权限、版本冲突、服务不可用和无效响应。

Workshop task source 实现沿用 Workshop Desktop 的服务契约：先读取 `/projects` 的独立项目与 `/organizations`，再按 `organization_id` 合并组织项目；组织项目拉取采用有界并发，项目按服务器标识去重。Adapter 从项目成员的 `is_me` 标记或登录用户名解析当前用户的数字 `user_id`，并把它作为 `/tasks` 的 `executor_id` 查询条件；响应归一化后再次按 `executor_id` 等值过滤，因此创建人、未分配和其他执行人的任务不会进入 Automation Snapshot。无法解析项目内当前用户标识时，该项目任务同步关闭而不是退化为全量任务。任务状态由 `/tasks/{task_id}` 更新。认证配置和令牌只保存在主进程设置中，Workshop 专属响应形状不泄漏给 Renderer。

任务状态枚举固定为 `pending_review`、`pending`、`in_progress`、`completed`、`accepted`、`cancelled` 和 `blocked`。未知状态保留原始值用于诊断，但不进入自动队列。

远端状态更新携带调用方最后读取的版本标识或等价条件。服务端不支持条件更新时，adapter 先读取最新任务并拒绝已变化状态；该检查降低冲突概率，但不能替代服务端原子并发控制，因此该能力在 UI 中标记为弱一致领取。

Coordinator 在远端领取前调用 Desktop Run Manager readiness preflight。Preflight 只读检查本地绑定、canonical state、Runtime capability policy、installed `$using-arckit` compatibility 与 trusted ledger entrypoints；全部通过后才读取任务最新版本并提交 `pending -> in_progress`。Preflight 失败产生 `readiness_failed` recovery，远端任务保持 pending。领取后的启动失败仍按 `start_failed` 恢复，因为远端状态已经合法变为 in_progress。

### Desktop Execution Plane

Automation Store、Coordinator、待办级 session、Workbench transcript、Token Usage 投影、命令单飞与软异常契约由 `desktop-execution-solution.md` 定义。主 Kernel 只向该平面提供结构化 run event、handoff 与 ledger 结果；Desktop 不从模型文本推断控制状态。

### Recovery Model

Recovery 状态是持久化的一致性差异，不是只存在于 Renderer 的错误提示。每个 recovery item 包含类型、远端任务快照、本地活动关联、证据引用、冻结范围、操作责任方和允许动作。Recovery responsibility 使用 `operator`，与需要用户提供业务语义的 attention item 分离。历史跨进程 continuation run 仍可被启动同步识别和收束；新的 state-driven run 在原 Runtime 进程内消化 agent continuation。

恢复类型至少包括：

- claim conflict：刷新任务并选择下一候选，不创建 run。
- start failed：重试同一启动意图，或由用户显式标记阻塞。
- completion writeback failed：重试完成写回，不领取下一任务。
- external terminal change：请求当前 run 安全停止，再以服务器事实收束。
- multiple active tasks：冻结队列，由用户选择唯一恢复目标。
- project or task source invalid：排除受影响范围并重新同步。
- authentication expired：清除可执行资格，重新认证后完整同步。

Coordinator 启动时先对齐本地活动关联、Desktop Run Manager 的活动 run 与服务器进行中任务。三者一致时恢复观察或执行；无法确定唯一活动任务时进入 multiple active tasks recovery。

Coordinator 只消费 Adapter 返回的当前执行人任务。项目级同步失败时，旧快照仅保留能够由 `executor_id` 证明仍属于当前用户的任务；身份无法解析时不保留该项目任务。领取、人工状态变更和完成写回前均以项目内当前用户标识重新读取任务，任务已改派或不再处于预期状态时停止写回并触发重新同步或恢复流程。

### Desktop IPC 与 Renderer

Preload 只暴露产品动作，Renderer 只消费 Automation Snapshot 和 Run activity。认证、任务状态与 Runtime 写操作继续在 main 进程重新校验；待办 transcript 和用量投影遵循 `desktop-execution-solution.md`。

### Loop Controller

Loop Controller 先读取 Project State 的 `case_control` 选择依据和全部 active Cases。Project gap 只作为选择/创建 Case 的宏观依据；每个 active Case 的 `case_resolution.candidate_gaps` 都进入 Controller 上下文，数组顺序不表达优先级。通过 `$using-arckit` 调用的 Controller Agent 先为当前 Loop 选择唯一 Case，再选择一个 `scope=case` 的具体 gap并解释依据。Runtime 只验证该 Case 与 gap 当前 active，不根据关键词、固定优先级或 facet-to-skill 映射拍板业务 route。多个 Runtime Loops 可以并行选择不同 Cases。

本轮目标必须形成：

- selected Case gap
- round goal
- planned Case transition
- required context refs
- required outputs
- stop conditions

Loop Controller 不从 Project State 读取轮次 continuation。Project `case_control.next_case_intent` 只说明选择哪个 Case 的宏观意图；下一轮目标由 Controller 从 Case candidate gaps、本轮 operator task 和新增证据中形成。Loop Controller 不从 raw operator event 中自行抽取并持久化语义目标。

### Capability Registry

Capability Registry 读取 repository 和目标项目中的 `arckit.capability.json` manifest，并应用 `runtime/arckit-runtime/config/capability-policy.json`。默认 Kernel policy 只绑定两个 Runtime 管理能力：Agent 入口 `using-arckit` 与 trusted Runtime 能力 `arckit-development-ledger`。其他 definition、diagnosis、code 和 quality skills 由当前 Codex Agent 通过原生 skill discovery 在同一 turn 中选择，不进入 Runtime 预测式 route。

Manifest 只提供 runtime 可读的能力元数据：

- capability id
- runtime role
- binding targets
- input facts
- outputs
- allowed write targets
- forbidden decisions
- runtime notes
- invocation type、skill trigger 和 phases
- Runtime capability 的受信任 entrypoints

Capability policy 只形成 Agent 入口与 trusted Runtime entrypoint。Capability Registry 不把 `SKILL.md` 当作 Runtime 架构事实，也不把 skill 正文作为 Desktop 控制决策输入；Kernel 不内置每轮 gap、route、worker role、skill 序列或能力选择启发式，也不存在 Runtime Worker registry。

Registry 对 Runtime entrypoint 使用更严格的信任规则：只能选择 repository source，目标项目同 ID manifest 不能覆盖；解析后的入口必须位于 capability root 内。默认 Agent Loop phase 必须且只能匹配一个 `agent_skill` invocation，否则 fail closed。

Agent Loop invocation 只使用已验证 capability manifest 声明的自然 trigger，并提供 fresh canonical digest、operator input 与授权；不显式添加第二份 skill input，也不复制 Controller 协议或 capability manifest 正文。Codex 执行前，Runtime 比对 repository Controller capability 与实际安装副本的 protocol revision、manifest 和 skill 文件；该检查在远端 claim 前的 readiness preflight 完成，漂移时不把任务先置为 `in_progress`。

### Prompt Compiler

Prompt Compiler 为 Agent Loop 生成最小 invocation。首个 turn 包含自然 `$using-arckit` trigger、待办原始意图、fresh canonical digest、授权与输出契约；后续 turn 只提供仍稳定的任务标识、当前增量、fresh revisions/digest、授权与契约，不重复拼接旧 prompt、完整状态正文或历史报告。

默认 invocation 以 manifest 声明的自然 `$using-arckit` 文本 trigger 进入 Codex 原生 skill 机制，不额外发送 `skill` input item。其余内容只有 locale、原始待办意图、当前增量、bounded canonical facts、revision、execution authorization 和 compact output contract。Agent 在 turn 内自行读取必要仓库事实、发现其他 skills、执行工具并完成自我审查；Runtime 不拼接 skill 清单、固定 Worker role 或预测式 allowed paths。

Runtime 从 fresh Project/Case records 确定性派生 Agent context digest。Digest 包含 Project revision、选择依据、项目级 gaps 和全部 active Cases 的意图、facet 摘要、candidate gaps、open questions、handoffs、completion review 摘要与稳定引用；它不包含 Markdown 正文、raw transcript、模型 reasoning 或未接受 claim。Agent 可以按当前 gap 主动读取引用和仓库事实。输出形状由 `arckit-agent-loop-result/v1`、Codex app-server `outputSchema`、Runtime schema validation 和 trusted ledger gate 承担。

`context_digest` 是有界的恢复索引，不是 transcript 摘要。它包含 Project/Case revisions、active Case selection facts、candidate gaps、用户意图摘要、facet 状态与 evidence、最近已接受 round 摘要、未解决问题和 canonical context refs；不包含 raw event、完整历史 prompt、模型 reasoning 或未接受 claim。

`arckit-agent-loop-result/v1` 的 `outputSchema` 遵循 Codex 严格结构化输出子集：`const` 同时声明显式 `type`，对象关闭额外属性并把全部属性列入 `required`，数组声明 `items`。Runtime 在创建 app-server thread 前递归预检这些约束，使无效 Schema 作为本地配置错误终止，而不是启动 turn 后才收到远端 `invalid_json_schema`。

Agent Loop result 通过互斥 `action=case_control|case_transition|handoff` 表达本轮结果。选择已有 active Case 不生成 Project 写入；没有合适 Case 时返回 `case_control.create_case`。标题、意图、artifact type 与创建理由来自 Agent 语义判断，Runtime 只绑定当前 Project revision与 review policy，不解析待办关键词推导这些字段。

Runtime 把创建动作绑定到当前 Project revision 和 Case review policy，形成 `arckit-case-control-handoff/v1`，再调用 `arckit-development-ledger` manifest 声明的 `case_control` 可信入口。ledger 分配 Case id，并在 Project commit lock 中把 Case 创建、Project/iteration 注册和投影索引作为可回滚提交；Project 不保存独占 selected Case。成功后同一 Runtime 进程重新读取 canonical state，并在同一 Agent thread 发起下一 turn。revision 或 candidate-gap 新鲜度冲突不产生部分写入，并进入有 no-progress budget 的 fresh-state replan。

Case facet 的局部更新在模型边界使用封闭的 nullable 字段集合表达；模型为未更新字段返回 `null`，Runtime normalization 在形成 Case claim 前移除 `null`。因此模型输出保持严格可验证，ledger 仍只接收有实际值的 facet patch。

人类输入只有初始任务意图、人工决策/纠正和显式控制动作。初始 Runtime run 使用待办正文原文；人工 fresh continuation 使用人工输入原文；自动续轮没有新增 operator input，也不创建 `role=user` transcript，而是由 Runtime 在写回后重新读取 Case State 并在当前会话中继续。任务 ID、项目 ID、source run、round index、gate 和 ledger 状态保持为 Runtime 控制面元数据。

### Agent Adapter

Agent Adapter 是外部执行器边界。M0 提供 dry-run adapter；M1 已接 Codex app-server stdio JSON-RPC；后续可以接 opencode 或多 agent runtime。

Codex adapter 的生命周期与一次 state-driven Runtime session 对齐。Runtime 只启动一个 `codex app-server --stdio` 子进程并完成一次 initialize；同一待办的默认 Agent Loops 通过该连接串行执行，并复用一个稳定 `threadKey=agent-loop:{run_or_task_identity}`。每次 ledger 写回后的 fresh state 进入同一 thread 的下一 turn，保持与人类在一个 Codex 对话中持续工作的语义连续性。

当前 invocation 是每个 turn 的事实与授权来源。原始待办意图保持稳定，当前增量、Project/Case revisions、candidate gaps、execution authorization 和 output contract 覆盖 thread 中冲突的旧内容；历史讨论不能扩大 sandbox、approval、工作区或 ledger writeback 权限。Runtime 不生成 `allowed_skills`、预测式 `allowed_paths` 或执行角色 workstream。

每个待办只有一个非 ephemeral Codex thread。Desktop 以项目身份与远端任务 id 为键持久化 app-server 返回的 opaque `thread.id`，并在发出首个 `turn/start` 前完成写入；同一时刻只有一个 Runtime/CLI owner 可以持有该 thread lease。进程重启后先 initialize app-server，再 `thread/resume(threadId)`，fresh-read Project/Case State 后从下一 turn 继续，不创建 replacement thread。

`thread/resume` 的瞬时失败进入可重试 recovery。只有 app-server 明确确认 thread 永久不存在时，Runtime 才记录 `thread_recovery_fallback` 并从 canonical state 创建、立刻持久化一个新的非 ephemeral thread；若 canonical facts 不足以安全续接则要求人工介入，不能静默丢弃上下文。

Adapter 遵循当前 Codex app-server 协议：每次 `turn/start` 的 `outputSchema` 只约束当前 turn；skill 通过自然文本 trigger 进入 Codex 原生发现机制，不额外发送 `{type: "skill"}` input；command/file approval 的接受值为 `accept`，拒绝值为 `decline` 或 `cancel`。`item/permissions/requestApproval` 返回 granted permission profile，不复用 command approval 的 decision 结构。Runtime 不用 approval 或 sandbox 禁用 Agent 的正常语义与工具能力；协议门禁只负责真实授权与结构合法性。

每次成功 ledger 写回后，Runtime 使用 `tokenUsage.last.inputTokens / tokenUsage.modelContextWindow` 判断当前请求上下文占用。达到 80% 且自上次 Agent turn 后尚未压缩时，Runtime 对同一 thread 调用 `thread/compact/start`，等待 context compaction item/turn 完成并保存检查点，再 fresh-read state 发起下一 turn。累计 Token 不作为阈值，压缩不创建新 thread，也不设置总 Token、总轮次或墙钟上限。

adapter 的 `close` 只在 session 完成、人工/外部 handoff、失败、interrupt 或安全预算终止时调用。单个 turn 完成只关闭该 turn 的事件队列，不关闭 app-server。stdin supervisor 在 adapter 生命周期内只绑定一次，并把 `/steer` 与 `/interrupt` 路由到当前 active turn。

### State-driven Session

执行模式把多个 Loop 保持在一个 Runtime 进程内：

```text
fresh read -> one coherent Agent turn -> structural gate
  -> deterministic ledger write -> fresh read -> next turn
```

每次 ledger 写回后的下一轮必须从 State Store 重读 Project revision、active Case revisions 和 candidate gaps；内存中的旧 snapshot 与 selected gap 不可跨写回复用，但同一 active Agent thread 继续提供对话连续性。Case 创建也遵循同一规则：可信入口注册新 Case 后，下一 turn 从 fresh state 选择该 Case gap。

Runtime 仅在 handoff 明确要求 human responsibility 时标记 `paused_for_human=true`。Agent responsibility 无论是 `auto_bridge` 还是受自动策略允许的 `manual_bridge` 都在当前进程继续。External responsibility 以 `external_wait` 终止当前执行而不伪装人工决策；连续无 ledger 进展达到恢复预算时安全停止。生产性 ledger 写回会重置该计数，因此它不是总墙钟或生产性 Round 上限；长命令自然运行到完成或显式 interrupt。

统一 adapter 语义是：

- start、persist or resume the task thread
- compact the same thread between gaps
- start a turn
- stream agent events
- steer an active turn
- interrupt an active turn
- return a runtime result

### Event Bus

Event Bus 将执行过程投影给 Supervisor，包括：

- agent message delta
- reasoning summary
- plan update
- tool call
- command execution
- file change
- approval request
- validation result
- thread/turn Token Usage 累计快照与上下文窗口
- 重复 command 抑制和其他非阻断用量警告

Runtime 不依赖完整隐藏推理链作为控制接口；它依赖可审计事件、工具行为和结构化结果。

### 待办生命周期追踪

Desktop 为每个自动领取的远端待办创建一个稳定 `trace_id`。同一待办的 readiness preflight、领取、Runtime Run、多轮 Agent Loop、Codex turn、工具调用、context compaction、ledger、同线程 Git closeout 和远端完成写回共享该 trace；Run、round、turn、tool 等执行单元使用 `span_id` 与 `parent_span_id` 形成父子关系。恢复、重试和多 Run 继续沿用原 trace，不以单个进程或单个 Case round 作为追踪边界。

生命周期事件采用 `arckit-lifecycle-event/v1`，同时记录 ISO wall clock 与进程内 monotonic duration。事件只包含关联 ID、阶段名、成本中心、状态、耗时和受限标量属性，不保存 prompt、响应正文、命令参数、环境变量、token、凭证或隐藏推理。原始事件由 Desktop 写入 Electron `userData/lifecycle-traces/<trace_id>/events.jsonl`；完成时生成同目录 `summary.json`，Run activity 保存两个文件的宿主路径，Automation completion record 同时保存路径与有界 summary 投影。

成本中心固定区分：

- `orchestration`：readiness、Desktop 启动、Runtime snapshot/round、结构 gate、ledger 和 adapter 生命周期。
- `task_execution`：承担 Case gap 的 Agent turn 与其工具调用。
- `external`：Workshop task source 的领取与完成写回。
- `closeout`：Case resolved 后同一 Agent thread 的验证、修复与 Git commit/no-op 收尾。
- `unclassified`：根 span 未被已知子阶段覆盖的间隔，用于暴露中断、恢复、人工/CLI 接力或缺失埋点，不能并入架构开销。

汇总以父子 span 的 interval union 计算 exclusive time，避免把 Agent、Codex turn 和 tool 的嵌套耗时重复相加。Summary 同时输出各成本中心、类别与阶段的 inclusive/exclusive 总量、最大耗时、错误数、未闭合 span、热点 span 和诊断倾向。`architecture_overhead` 表示 orchestration exclusive time 占主导，`task_specific` 表示 Agent/model/tool 占主导，`external_dependency` 与 `closeout_overhead` 分别表示外部任务源或收尾阶段占主导；大量根区间无法归属时返回 `insufficient_attribution`，避免把人工接力或缺失埋点误判为架构开销。该倾向是性能定位入口，不替代基于原始事件的根因确认。

CLI 的 `analyze-lifecycle --file <events.jsonl>` 可在待办完成或异常停止后重新生成汇总。运行中保留 started 但未 completed 的 span，使进程中断或长时间等待仍能定位最后进入的边界。

### Policy / Gate Engine

Gate Engine 在高风险状态下中断或阻塞继续执行：

- claim 缺少协议字段或证据
- source facts unknown
- only projection artifacts changed
- artifact ownership map 检测到 projection-only changes
- artifact ownership map 检测到 unknown artifacts
- `human_decision_required=true`
- destructive command
- cross-workspace write
- case closeout without ledger update
- missing artifact impact scan

### Validator

Validator 先校验 Agent 的紧凑 `arckit-agent-loop-result/v1`，Runtime 再派生内部 `arckit-runtime-result/v2` 兼容投影。Agent result 至少要求：

- 互斥 `action`
- `summary`
- `case_control` 或 `case_transition`
- `changed_files` 与 artifact impacts
- `risks`、`unknowns` 与 responsibility handoff

Runtime 内部 handoff 必须区分 `next_responsibility` 和 `trigger_mode`。当 Agent 声明需要人类时，`next_responsibility` 必须是 `human`。Runtime 只做单调转换，不用第二个 semantic guard 覆盖 Agent closeout；ledger apply 后的派生 handoff 是最终权威结果。

### Ledger Writer

Ledger Writer 是 Runtime hard gate 与 ledger skill entrypoint 之间的薄适配器。Runtime 先确定性计算 gate；只有 gate 允许时，才从受信任 `arckit-development-ledger` manifest 解析并调用 `scripts/runtime-writeback.mjs`。账本语义、字段映射、渲染和索引由 skill 内实现负责，Runtime 不维护副本。

Ledger capability 负责将验证后的结果写回：

- `arckit-case-transition/v3`
- development Case record 与 derived candidate gaps/resolution
- resolved Case 的显式 Project/iteration impact
- Case、Project、iteration 的 indexes 与 projections

Ledger writeback 是已接受 Case transition 的必经阶段。Desktop 执行型 run 在 Controller 接受 evidence-backed delta 且 `ledger_stage.status=gate_ready` 后运行 gate；即使 Case 仍 unresolved 或下一责任方是 human/external，也可以先安全写入本轮 accepted delta，再停止桥接。

每个 transition 绑定 Case `updated_at` 和本轮观察到的 Project `updated_at`，并逐字段复现当前 candidate gap。Gate 通过 trusted ledger `case_transition` entrypoint 做 canonical validation；Case revision 或 responsibility/current/target/next transition 已变化时 fail closed。普通 unresolved transition 不改变 Project revision，允许不同 Cases 使用同一观察 revision 独立推进；resolved transition 聚合前必须再次匹配 Project revision。Ledger 在写入前预校验完整 Case、Project 与 iteration 目标状态，并通过操作系统临时目录中的跨进程 Project lock，把 Case、Project、iteration、projections、indexes 串行作为可回滚提交；锁不进入 canonical evidence。

Ledger Writer 只消费通过 Runtime Validator 的 semantic fields。写入前检查 Case id/gap、planned transition、accepted delta、evidence、round outcome、Case resolution claim 和 Project impact candidate；raw operator task 不能作为 fallback。语义字段含 raw event marker、超长或 transition shape 不完整时，gate 阻止写回。Gate、result builder 与 handoff 不再各自重判 Case 语义；一次拒绝不能同时被其他分支解释为 resolved 并写回。

写回策略按层分工：

- Project State v4 写宏观 checkpoint：dimension 状态、project gaps、active Case refs、不含独占 selection 的 `case_control` 选择依据、last state delta 和 evidence refs。
- Iteration State v2 写阶段性 Project targets、带 closed Case 的 accepted Project changes、acceptance、blocking Project gaps 和 Case refs；不写 Loop continuation 或同态日志。
- Case State 写事项级 checkpoint：六个 facets、content revision、completion review policy/cycles/findings/escalation、open questions、pending handoffs、round records、derived resolution、candidate gaps 和 loop handoff。每条 round 可保存 `arckit-runtime://runs/RUN-...` opaque ref，但不保存 Runtime 宿主的绝对路径。
- Runtime 宿主在目标项目之外管理完整过程证据：runtime result、gate、selected round、activity、raw events 和 transcript。Desktop 使用 Electron userData；ledger 不复制这些记录，且 Case 语义恢复不依赖它们仍然存在。
- Agent 不直接写 Project/Case State；Agent 提交一个 transition claim，ledger 确定性应用。

当 operator input、现有稳定事实或 Agent 在 turn 内取得的实现/验证证据足以支持 Case transition 时，Agent 直接提交 accepted delta。每次成功写回后对应 Loop 重新读取状态和 revision，再由同一 thread 的下一 turn 选择下一个 gap。不同 Case Loops 可以并行执行，ledger commit 短暂串行；Project aggregation 冲突只使相关 closeout 从 fresh state 重规划。自动桥接由实际 ledger 进展与 no-progress streak 共同约束；累计自动轮次仅用于审计，不作为持续产生 canonical state 进展时的停止条件。

## M0 实现范围

M0 位于 `runtime/arckit-runtime/`，实现：

- `run --project <path> --dry-run`
- `validate-result --file <path>`
- 状态读取
- gap 选择
- prompt 编译
- runtime result schema
- 本地结构校验
- Codex app-server adapter 占位

M0 的目标是证明 Arckit loop 可以由 runtime 控制，而不是继续依赖单个 agent 自觉阅读 skills。

## 后续里程碑

### M1：Codex app-server supervisor

M1 接入 Codex app-server JSON-RPC，当前实现位于 `runtime/arckit-runtime/adapters/codex-app-server-adapter.mjs`：

- `thread/start`（非 ephemeral）
- `thread/resume`
- `thread/compact/start`
- `turn/start`
- streamed item notifications
- `turn/steer`
- `turn/interrupt`

Supervisor 提供观察、暂停、修正和中断能力。

CLI 支持：

- `probe-app-server --project <path> --json`：只做 app-server initialize 握手，不启动模型 turn。
- `run --adapter codex-app-server --stream-events`：把 normalized runtime events 作为 JSONL 输出到 stderr。
- `run --adapter codex-app-server --supervise-stdin`：在 turn 运行时接受 `/steer <text>` 和 `/interrupt`。

M1 已验证本地 Codex app-server initialize 握手；真实模型 turn 因会消耗模型调用并可能修改仓库，默认留给人工显式触发。

### M2：Gate 与 ledger writeback

M2 将 gate 和 validator 结果接入 `arckit-development-ledger`，当前实现位于：

- `runtime/arckit-runtime/src/gate-engine.mjs`
- `runtime/arckit-runtime/src/ledger-writer.mjs`
- `entry/skills/arckit-development-ledger/scripts/runtime-writeback.mjs`
- `entry/skills/arckit-development-ledger/scripts/project-state.mjs`
- `entry/skills/arckit-development-ledger/scripts/project-iteration.mjs`
- `entry/skills/arckit-development-ledger/scripts/development-case.mjs`

- 自动创建或更新 case
- 校验 loop handoff
- 写入 project state delta
- 渲染 `STATE.md`
- 审计 projection drift

Gate 的写回准入条件：

- `validate-result` 必须通过。
- `round_result` 必须是 `done`。
- `ledger_stage.status` 必须是 `gate_ready`。
- `validation_evidence` 必须非空。
- Runtime 只能验证结构化 claim 的协议、证据和 artifact ownership 条件；语义正确性必须来自 Agent evidence、人类确认或后续验证，不由 gate 自行推理。
- `human_decision_required=true`、`next_responsibility=human` 或 `trigger_mode=user_decision` 会阻止自动写回。
- `source_unknown=true` 且只有 projection artifact 变化会阻止自动写回。
- `artifact_ownership_scan.projection_artifacts_changed` 非空且没有 source fact change 会阻止自动写回。
- `artifact_ownership_scan.unknown_artifacts` 非空会阻止自动写回。
- `blocked_projections` 非空会阻止自动写回。
- `changed_files` 不能包含绝对路径、`..` 或空路径。

`write-ledger` 的写回范围：

- 更新 `arckit/project/state.record.json` 和投影 `STATE.md`。
- 更新 active iteration record、iteration brief 和 `ITERATIONS.md`。
- 更新 active case record 和 `arckit/cases/INDEX.md`。
- 将可选 `arckit-runtime://runs/RUN-...` opaque ref 写入 Case round；完整 Runtime 记录继续由调用方宿主管理。
- 默认支持 `--dry-run` 只输出计划，不改文件。

### M3：Electron Desktop Client

M3 增加本地桌面控制端，当前实现位于：

- `runtime/arckit-runtime/desktop/main.mjs`
- `runtime/arckit-runtime/desktop/preload.cjs`
- `runtime/arckit-runtime/desktop/renderer/*`
- `runtime/arckit-runtime/src/desktop-run-manager.mjs`

Desktop Client 不重新实现 Runtime。它通过 Electron main 进程调用同一个 `bin/arckit-runtime.mjs`，并把运行过程投影成桌面交互。默认表面是待办自动化 Command Center；Chat session 作为 transcript 与人工介入基础设施按需出现。

- 添加本地 Arckit 项目。
- 使用左侧项目与任务状态导航、中间运行态势、右侧执行边界与证据的 Command Center。
- 将 Chat session 和 Run 分离：自动化 session 归属于一个远端待办，run 是该 task session 内的一次执行记录。
- 由 Coordinator 把已领取远端任务的正文作为唯一 operator input，并通过 `--task` 注入 Controller turn；任务与项目标识保留在 Runtime 元数据。
- Runtime 请求人工输入时按需打开 Intervention Workbench；提交内容转为 steer 或 fresh continuation。
- transcript 与 run history 从任务详情和审查入口访问，并按 task session 隔离；用量按 Run、round、turn 与 lane 投影。
- 右侧展示 Project active Case 集合与选择依据、各 Case resolution/candidate gaps、当前 Round 所选 Case、normalized events 和 gate/write 控制。
- 在运行中通过显式停止动作发送 interrupt，并保留远端进行中状态进入恢复流程。
- 在运行中通过显式切换动作安全 interrupt 当前 run，再由主进程终端启动器打开交互式 `codex`；活动任务以 `case_id` 绑定 canonical Case，并在返回时读取 fresh active/closed Case 决定续跑、人工处理或完成收尾。
- Runtime 进程在每轮到达 `ledger_gate_ready` 后执行 trusted ledger writeback，并把每轮 gate/write 事件投影给 Desktop；Desktop 不重复写 ledger。
- 将项目注册表、run history、result 和 events 存在 Electron userData。

Desktop Client 的验收覆盖任务源 mock、确定性队列、单活动任务、状态写回门禁、人工 Gate、恢复状态、project status、run manager、Renderer 状态投影和 Electron 启动。真实服务验收还需要有效 Workshop 会话和可操作任务。

### M4：可替换 agent adapter

M4 可以增加其他支持持久 thread 语义的 agent adapter。Runtime 保持同一 loop 控制面，不把状态选择、事实路由和完成审计编码成 Kernel 策略。

## 验收口径

Arckit Runtime 满足方案时表现为：

- 能从 canonical project state 选择下一轮 gap。
- 能生成包含上下文、停止条件和输出 schema 的受控 agent 指令。
- 能实时展示 agent 执行事件，支持 steer 和 interrupt。
- 能展示 Runtime Kernel 输出的 round state、Agent transition、artifact ownership scan 和 ledger stage。
- 能拒绝缺少 artifact impact scan、source-projection check 或 loop handoff 的结果。
- 能把 Agent 的语义判断限制为结构化 claim，再由代码验证协议、证据、路径归属和门禁条件。
- 只绑定 `using-arckit` Agent 入口与 `arckit-development-ledger` trusted entrypoints，并保留 Agent 原生 skill discovery；Runtime 不建立 Worker registry。
- 能把 agent 续轮、人工决策、外部等待和完成状态区分为不同 loop handoff。
- 能让一个待办从首轮到验证、修复和 Git closeout 只使用一个持久 Agent thread，并在进程重启后 resume 同一 thread、每次写回后 fresh-read state。
- 能以 manifest 声明的自然文本 trigger 触发兼容的 Controller skill，不显式注入 `skill` input item，并按当前 app-server schema 返回 command、file 与 permission approval 响应。
- 能在最新请求上下文占用达到 80% 时压缩同一 thread，保存压缩检查点后继续下一 gap。
- 能为每个 Agent turn 生成有界、可恢复的 context digest，并在目标、授权或 canonical refs 异常漂移时投影非阻断软提示。
- 能为每个远端待办创建独立 Desktop session，按 thread 最新累计快照去重 Token 用量，并以软异常而非硬 Token/轮次限制治理浪费。
- 能为一个待办从远端领取到 completed 写回建立跨 Run 的父子 span，持久化脱敏 JSONL，并用 exclusive time 区分 orchestration、task execution、external 与 closeout 热点。
- 能把同一活动任务从 Runtime 安全交给用户可参与的交互式 Codex CLI，并以 canonical Case State 而非旧 Run 或终端退出状态完成恢复对账。
- 能只在 Agent handoff 明确声明 human responsibility 时暂停自动执行，external wait 与结构恢复分别保持独立状态。
- 能在不改 agent core 的情况下先接 Codex app-server，并保留 opencode、多 agent adapter 的扩展边界。
