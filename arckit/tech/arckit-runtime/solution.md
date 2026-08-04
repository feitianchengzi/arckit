# Arckit Runtime 技术方案

## 定位

Arckit Runtime 是 Arckit 的执行控制面。它把原先依赖 agent 自觉遵守的 loop 行为外移为可执行程序，使 Codex、opencode 或多 agent worker 只作为受控执行器参与一轮研发任务。

Runtime 不替代 Arckit skills。Skills 继续承载方法、事实源维护规则、输出契约和模板；Runtime 负责读取 Project/Case 状态、调用 Controller Agent 选择 Case gap、编译受控指令、观察执行事件、校验结构化结果，并调用 trusted ledger entrypoint。

## 架构组件

```text
User Input
  -> Runtime Kernel
      -> Controller Reducer
      -> Round Plan
      -> Worker Dispatch
      -> Report Intake
      -> Deterministic Merge
      -> Ledger Gate
      -> Ledger Writeback
      -> Next Control State
  -> Desktop UI
```

Runtime Kernel 是产品级执行内核，不是“启动多个 Codex worker 的壳”。Worker 只执行 bounded task；worker report 只是输入证据。是否接受 report、是否形成可写回的 source fact change claim、是否允许 ledger writeback、下一轮控制状态，都由 Runtime Kernel 的确定性代码负责。

Runtime Kernel 不充当 semantic truth judge。代码不判断产品概念、架构取舍或业务语义是否“真的正确”；这些语义判断来自 bounded Worker、Controller LLM 或人类。Runtime Kernel 负责把这些语义判断压成结构化 claim，并验证 claim 是否满足协议、证据、artifact ownership、human gate 和 ledger gate 条件。

Runtime Kernel 不把 raw input envelope 当作 semantic state。Desktop operator event、完整 activity、完整 controller frame、完整 ledger write result、worker stream JSON 和上一轮完整 prompt 只属于 raw evidence 或 audit。Runtime 可以保存引用、摘要和结构化 claim，但不能把 raw envelope 写入 `round_goal`、`controller_frame.round_goal`、`loop_handoff.agent_instruction.goal`、`progress_guard.expected_state_change`、Project State `case_control` 或 Case State `current_round`。

Desktop UI 只展示 Runtime Kernel 的 control state，不自己猜测业务流程。Skills 继续提供能力说明、事实源维护规则和 worker 协议；它们不能替代 Runtime Kernel 做 loop 控制。

Skill layer 位于系统底层。Skills 只承载可复用能力、底层协议、事实源维护规则和各 execution plane 的能力边界，不沉淀 Desktop Runtime 的产品架构、状态机、自动写回策略或控制内核决策。这类上层架构事实只写入 `arckit/tech` 与 runtime 代码。

Runtime 只解析 `arckit.capability.json`，不自行读取或注入 `SKILL.md` 正文。Manifest 除了路由和边界元数据，还声明调用方式：Controller turn 以 `$using-arckit` trigger 交给 Agent 原生 skill 机制加载正文；Worker turn 同样只注入已授权 `$skill-name` trigger；确定性 ledger 能力则由 Runtime 直接调用 `arckit-development-ledger` manifest 声明的受信任 entrypoint。Runtime 不复制这些 skill 的语义或脚本实现。

### Runtime Kernel

Runtime Kernel 当前由以下确定性阶段组成：

- Round State Machine：记录 `planned -> authorized -> workers_running -> reports_collected -> merge_ready -> ledger_gate_ready -> ledger_written -> next_round_ready`，并支持 `blocked`、`human_gate_required`、`external_wait`、`failed` 等控制态。
- Controller Reducer：接收 worker reports，按 packet、role、evidence、risk、unknown、source fact establishment 的协议条件做接受/拒绝/继续判断；它验证 claim 的结构化条件，不替代 LLM 或人类判断语义正确性。
- Artifact Ownership Map：把路径归类为 source fact、projection、runtime log、pending/raw input、implementation evidence 等，避免让 worker 自述决定 source/projection 边界。
- Ledger Stage：当 runtime result 到达 `ledger_gate_ready` 时，先做 deterministic gate；gate 允许则自动写 ledger，gate 阻塞则把原因投影到 UI。

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

### Automation Store

Desktop Store 在现有项目、会话、消息和 run history 之外保存自动化控制状态：

- task source 连接设置与主进程私有认证会话；公开设置只生成非敏感账号投影和认证状态。
- 远端项目到本地 Arckit 工作区的绑定。
- 每个远端项目是否参与自动化。
- 自动化总开关和项目级暂停状态。
- 最近一次成功的项目、任务和状态计数快照。
- 当前活动任务与待启动 Runtime 的关联意图。
- 人工事项、恢复原因和最近同步时间。

access token、refresh token 与过期时间不进入 Renderer store 投影、runtime result、raw event、错误详情或 ledger evidence。持久化写入沿用 Desktop Store 的原子文件替换方式，读取时对新增字段做默认值归一化，旧版本 store 可以无损升级。

活动任务关联至少包含远端项目标识、远端任务标识、服务器版本、任务状态、本地项目标识、本地路径、run 标识、领取时间和当前自动化阶段。该关联在服务器确认进行中后、启动 Runtime 前持久化，使进程崩溃后能够区分“未领取”“已领取未启动”和“已启动”。

### Automation Coordinator

Automation Coordinator 位于 Electron main 进程，组合 Task Source Adapter、Desktop Store 和 Desktop Run Manager。它不复制 Loop Controller、Gate 或 ledger 语义，只负责远端任务生命周期与一个本地 Runtime run 的串行协调。

Coordinator 状态机包含：

```text
disabled -> syncing -> idle -> claiming -> starting -> running
running -> awaiting_human -> running
running -> completing -> idle
claiming | starting | running | completing -> recovery
recovery -> syncing | starting | running | idle
```

每次同步先读取当前用户与项目，再并发读取各项目任务并按项目保存结果。只有完整项目列表可确认时才允许全局领取；单项目任务读取失败只排除该项目。同步周期使用单飞锁，后发请求复用或等待当前同步，避免并发刷新覆盖较新的状态。

Coordinator 生成队列时只选择已绑定本地工作区、参与自动化、任务源健康且状态为 `pending` 的任务。排序按优先级降序、进入待处理时间升序、项目标识和任务标识稳定排序。

Coordinator 在领取前重新读取候选任务，随后提交条件式 `pending -> in_progress`。确认成功后写入活动任务和启动意图，再调用 Desktop Run Manager。领取冲突刷新候选并继续；其他写回错误进入 recovery。

Desktop Run Manager 接受远端任务上下文；传给 Controller 的 `operator_input` 只保留待办正文，远端任务、项目、run 与调度状态作为 Runtime 元数据保存。Coordinator 启动的 run 持久化 `continuation_policy=automatic`，并在自动续轮中继承；该策略只把满足 Agent responsibility、Agent continuation available、无 human decision 且 trigger 为 `manual_bridge|auto_bridge` 的 handoff 自动接续。Run 同时保留累计 `auto_continue_depth` 和可重置的 `auto_rounds_since_progress`：成功的确定性 ledger write 把后者归零，未写回轮次递增后者，`max_auto_rounds` 只检查后者。`user_decision`、external wait、缺少 next prompt、no-progress limit 和无进展轮次上限不受自动策略提升。run 事件继续由既有 projector 投影。Coordinator 只读取稳定的 run status、loop handoff、human gate 和 ledger stage，不解析模型文本推断状态。

run 到达人工 Gate 时，Coordinator 创建 attention item 并保持活动任务。人工提交内容以原文通过 steer 进入当前 turn，或作为 fresh continuation 的唯一 `operator_input`；任务标识、恢复指令和重新读取 Case State 的要求不拼接进人工内容。Controller 接受后清理 attention item 并恢复 running。只有 human responsibility、`human_decision_required` 或 user-decision trigger 进入该路径；Agent continuation 和运行一致性恢复不创建人工事项。

run 完成、ledger 写回成功且 terminal handoff 证明 Case 已关闭后，Coordinator 把活动任务切到 `committing`，通过独立 `agent-task` 执行面向 Codex app-server 发送精确输入 `git commit`。该执行面不进入 Controller/Case loop、不创建 Chat message、不提供提交信息或 Runtime 上下文。agent-task 成功后 Coordinator 才提交 `in_progress -> completed`；启动或执行失败进入只重试 commit 的 recovery，已关闭 Case 不重新执行。完成写回确认后清除活动任务并触发下一次同步与领取。

### Recovery Model

Recovery 状态是持久化的一致性差异，不是只存在于 Renderer 的错误提示。每个 recovery item 包含类型、远端任务快照、本地活动关联、证据引用、冻结范围、操作责任方和允许动作。Recovery responsibility 使用 `operator`，与需要用户提供业务语义的 attention item 分离。启动同步发现历史 `runtime_incomplete` 实际对应可继续的 Agent `manual_bridge` 时，Coordinator 清理错误 recovery，并通过 source run 的 result/activity 引用启动 fresh continuation。

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

### Desktop IPC Boundary

Preload 只暴露面向产品动作的 API，不暴露通用 HTTP、文件系统或任意 Runtime 命令。IPC 分为：

- 查询：automation snapshot、项目、状态计数、任务、活动任务、attention、recovery。
- 认证：读取认证状态、发送验证码、提交验证码登录、受控退出。
- 配置：任务源连接、项目工作区绑定、项目自动化参与状态、自动化总开关。
- 同步与调度：刷新、暂停/恢复队列、重试恢复动作。
- 任务状态：确认待处理、验收、取消、标记阻塞和受控恢复。
- Runtime 控制：查看 run、只读 transcript、人工介入、提交输入、安全停止。

每个写 IPC 在 main 进程重新校验任务、项目、权限、服务器版本和当前 coordinator 状态。Renderer 传入的 eligibility、queue order、task status 或 run ownership 只作为选择提示，不作为可信事实。

认证 IPC 校验 `code_type`、目标地址和验证码长度，不接受服务名、URL、header 或 token 参数。发送验证码和登录返回归一化账号投影；退出登录由 main 进程根据活动任务决定是否需要确认，Renderer 不能直接清理凭证文件。

Main 进程在 store、任务快照、活动 run 或同步状态变化时发送单一 automation changed 事件。Renderer 收到事件后重新读取 snapshot，避免维护第二套业务状态机。

### Renderer Projection

Renderer 以 Automation Snapshot 作为唯一页面状态输入。Snapshot 包含当前范围、项目投影、七状态计数、队列、活动任务、attention、recent completions、同步健康和 recovery 摘要。

Command Center、Task Browser、Intervention Workbench 和 Recovery Center 是同一 snapshot 的不同投影。页面切换、项目范围和任务状态筛选只保存在 Renderer 导航状态；自动化开关、项目参与状态、活动任务和恢复状态由 main 进程持久化。

Chat session 和 message store 保留为 transcript 与人工介入基础设施，但不再是主页面信息架构。只读审查不创建消息或 steer；人工模式的提交通过显式 action 进入 coordinator。

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

Capability Registry 读取 repository 和目标项目中的 `arckit.capability.json` manifest，并在暴露给 Controller 前应用 `runtime/arckit-runtime/config/capability-policy.json`。当前 v2 policy 只允许七个保留能力，并把它们分到三个互斥 execution plane：Controller 组为 `using-arckit`，Runtime 组为 `arckit-development-ledger`，Worker 组为 `arckit-spec`、`arckit-interaction`、`arckit-visual`、`arckit-tech` 和 `arckit-debug-diagnosis`。策略外 manifest 不进入本轮能力地图。

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

Capability policy 是显式 policy layer，不是 Runtime Kernel 的固定路由。Registry 只有在 policy 分组允许且 manifest 的 `binding_targets` 声明兼容时才形成对应 execution plane registry。Capability Registry 不把 `SKILL.md` 当作 Runtime 架构事实，也不把 skill 正文作为 Desktop 控制决策输入；Kernel 不内置每轮 gap、route、worker role、skill 序列或能力选择启发式。

Registry 对 Runtime entrypoint 使用更严格的信任规则：只能选择 repository source，目标项目同 ID manifest 不能覆盖；解析后的入口必须位于 capability root 内。Controller phase 必须且只能匹配一个 `agent_skill` invocation，否则 fail closed。

Controller planning invocation 只暴露 policy 允许的 capability id、protocol revision、binding target、invocation 类型、phase、trusted entrypoint 名称与 manifest ref；不复制 Controller 协议或 capability manifest 正文。`worker_intents[].allowed_skills` 只能引用 Worker registry。Controller plan 和既有授权 packet 都经过同一 Worker binding gate；Controller/Runtime/未知 capability ID 会阻塞执行，不会被静默过滤。Codex 执行前，Runtime 比对 repository Controller capability 与实际安装副本的 protocol revision、manifest 和 `SKILL.md`；漂移时在启动 Agent 前 fail closed，避免由过期 skill 产生表面合法但语义不兼容的计划。

### Prompt Compiler

Prompt Compiler 为 Controller planning、Worker execution 和 Controller review 生成最小 Agent invocation。旧的 supervised-turn compiled prompt 只保留 operator input 与机器元数据兼容投影，不作为 agentic 主链路的 Codex turn 输入。

Prompt Compiler 不要求 agent 猜测要使用哪个 skill。Controller planning/review invocation 以 manifest 声明的 `$using-arckit` 开始；Worker invocation 以通过 binding gate 的 `$skill-name` 开始。其余内容只有 phase、locale、operator input、state/report refs 或本轮必要结构化证据、revision、execution authorization 和 capability refs。具体行为由 Codex 类 Agent 的已安装 skill 包负责。

Project State 与全部 active Case States 通过 canonical refs 进入 planning invocation，不内嵌完整 Project record、Case record 或 Markdown 正文。Controller review 可直接接收本轮 bounded Worker reports，因为它们是尚未写回的必要运行证据；Worker 只接收一个 `arckit-worker-packet/v2` 与确有依赖的 prior reports。输出形状由 Codex app-server `outputSchema`、Runtime schema validation 和 hard gate 承担，不在 prompt 中重复输出字段、closeout 规则或 skill 工作流。

Controller Plan、Worker Report 和 Controller Review 的 `outputSchema` 遵循 Codex 严格结构化输出子集：`const` 同时声明显式 `type`，对象关闭额外属性并把全部属性列入 `required`，数组声明 `items`。Runtime 在创建 app-server thread 前递归预检这些约束，使无效 Schema 作为本地配置错误终止，而不是启动 turn 后才收到远端 `invalid_json_schema`。

Controller Plan v3 通过 `execution_plan.plane` 明确区分 `runtime`、`worker` 和 `none`。选择已有 active Case 是当前 Loop 的 Controller route plan，不生成 Project 写入；创建新 Case 使用唯一 `runtime_actions[type=case_control, action=create_case]`，并要求 `worker_intents=[]`。标题、意图、artifact type 与创建理由来自 Controller 语义判断，Runtime 不解析待办关键词或 route mode 推导这些字段。

Runtime 把创建 Runtime action 绑定到当前 Project revision 和 Case review policy，形成 `arckit-case-control-handoff/v1`，再调用 `arckit-development-ledger` manifest 声明的 `case_control` 可信入口。ledger 分配 Case id，并在 Project commit lock 中把 Case 创建、Project/iteration 注册和投影索引作为可回滚提交；Project 不保存独占 selected Case。成功后 auto bridge 启动 fresh Controller invocation 并重新读取状态；revision 或 candidate-gap 新鲜度冲突不产生部分写入，并进入一次有 no-progress budget 的 fresh-state replan。Controller plan 若违反 execution plane 互斥或其他结构 gate，Runtime 把校验原因与被拒计划作为机器反馈交给 `$using-arckit` 自动重规划一次，仍失败才输出可恢复阻塞。

Case facet 的局部更新在模型边界使用封闭的 nullable 字段集合表达；模型为未更新字段返回 `null`，Runtime normalization 在形成 Case claim 前移除 `null`。因此模型输出保持严格可验证，ledger 仍只接收有实际值的 facet patch。

人类输入只有初始任务意图、人工决策/纠正和显式控制动作。初始 Runtime run 使用待办正文原文；人工 fresh continuation 使用人工输入原文；自动续轮没有新增 operator input，也不创建 `role=user` transcript，而是由 Runtime 在写回后启动 fresh Controller invocation 并重新读取 Case State。任务 ID、项目 ID、source run、auto-round depth、gate 和 ledger 状态保持为 Runtime 控制面元数据。

### Agent Adapter

Agent Adapter 是外部执行器边界。M0 提供 dry-run adapter；M1 已接 Codex app-server stdio JSON-RPC；后续可以接 opencode 或多 agent runtime。

统一 adapter 语义是：

- start or resume a thread
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

Runtime 不依赖完整隐藏推理链作为控制接口；它依赖可审计事件、工具行为和结构化结果。

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

Validator 校验 agent 的最终 `arckit-runtime-result/v2`，至少要求：

- `round_outcome`
- `case_outcome`
- `project_impact`
- `case_transition`
- `artifact_impact_scan`
- `source_projection_check`
- `validation_evidence`
- `loop_handoff`

`loop_handoff` 必须区分 `next_responsibility` 和 `trigger_mode`。当 `human_decision_required=true` 时，`next_responsibility` 必须是 `human`。

### Ledger Writer

Ledger Writer 是 Runtime hard gate 与 ledger skill entrypoint 之间的薄适配器。Runtime 先确定性计算 gate；只有 gate 允许时，才从受信任 `arckit-development-ledger` manifest 解析并调用 `scripts/runtime-writeback.mjs`。账本语义、字段映射、渲染和索引由 skill 内实现负责，Runtime 不维护副本。

Ledger capability 负责将验证后的结果写回：

- `arckit-case-transition/v3`
- development Case record 与 derived candidate gaps/resolution
- resolved Case 的显式 Project/iteration impact
- Case、Project、iteration 的 indexes 与 projections

Ledger writeback 是已接受 Case transition 的必经阶段。Desktop 执行型 run 在 Controller 接受 evidence-backed delta 且 `ledger_stage.status=gate_ready` 后运行 gate；即使 Case 仍 unresolved 或下一责任方是 human/external，也可以先安全写入本轮 accepted delta，再停止桥接。

每个 transition 绑定 Case `updated_at` 和本轮观察到的 Project `updated_at`，并逐字段复现当前 candidate gap。Gate 通过 trusted ledger `case_transition` entrypoint 做 canonical validation；Case revision 或 responsibility/current/target/next transition 已变化时 fail closed。普通 unresolved transition 不改变 Project revision，允许不同 Cases 使用同一观察 revision 独立推进；resolved transition 聚合前必须再次匹配 Project revision。Ledger 在写入前预校验完整 Case、Project 与 iteration 目标状态，并通过操作系统临时目录中的跨进程 Project lock，把 Case、Project、iteration、projections、indexes 串行作为可回滚提交；锁不进入 canonical evidence。

Ledger Writer 只消费通过 Runtime Validator 的 semantic fields。写入前检查 Case id/gap、planned transition、accepted delta、evidence、round outcome、Case resolution claim 和 Project impact candidate；raw operator task 不能作为 fallback。语义字段含 raw event marker、超长或 transition shape 不完整时，gate 阻止写回。

写回策略按层分工：

- Project State v4 写宏观 checkpoint：dimension 状态、project gaps、active Case refs、不含独占 selection 的 `case_control` 选择依据、last state delta 和 evidence refs。
- Iteration State v2 写阶段性 Project targets、带 closed Case 的 accepted Project changes、acceptance、blocking Project gaps 和 Case refs；不写 Loop continuation 或同态日志。
- Case State 写事项级 checkpoint：六个 facets、content revision、completion review policy/cycles/findings/escalation、open questions、pending handoffs、round records、derived resolution、candidate gaps 和 loop handoff。每条 round 可保存 `arckit-runtime://runs/RUN-...` opaque ref，但不保存 Runtime 宿主的绝对路径。
- Runtime 宿主在目标项目之外管理完整过程证据：runtime result、gate、selected round、activity、raw events 和 transcript。Desktop 使用 Electron userData；ledger 不复制这些记录，且 Case 语义恢复不依赖它们仍然存在。
- Worker 不直接写 Project/Case State；Worker 提交 claims，Controller 接受后形成 transition，ledger 确定性应用。

Controller plan 可以包含零个 Worker。当 operator input、现有稳定事实或已有验证证据足以支持一个 Case transition 时，Controller Review 直接列出 evidence 并形成 accepted delta；Runtime Guard 不把零 Worker 当缺失 packet。每次成功写回后对应 Loop 重新读取状态和 revision，再由 Controller 选择下一 gap。不同 Case Loops 可以并行执行，ledger commit 短暂串行；Project aggregation 冲突只使相关 closeout 从 fresh state 重规划。自动桥接由实际 ledger 进展、no-progress streak 与连续无进展轮次预算共同约束；累计自动轮次仅用于审计，不作为持续产生 canonical state 进展时的停止条件。

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

- `thread/start`
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
- Runtime 只能验证结构化 claim 的协议、证据和 artifact ownership 条件；语义正确性必须来自 worker evidence、人类确认或后续验证，不由 gate 自行推理。
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
- 将 Chat session 和 Run 分离：session 是连续对话，run 是某个 session 内的一次执行记录。
- 由 Coordinator 把已领取远端任务的正文作为唯一 operator input，并通过 `--task` 注入 Controller turn；任务与项目标识保留在 Runtime 元数据。
- Runtime 请求人工输入时按需打开 Intervention Workbench；提交内容转为 steer 或 fresh continuation。
- transcript 与 run history 从任务详情和审查入口访问，不作为常驻主导航。
- 右侧展示 Project active Case 集合与选择依据、各 Case resolution/candidate gaps、当前 Round 所选 Case、normalized events 和 gate/write 控制。
- 在运行中通过显式停止动作发送 interrupt，并保留远端进行中状态进入恢复流程。
- run 完成后如果 runtime result 到达 `ledger_gate_ready`，自动执行 gate-result；gate 允许时自动 write-ledger，gate 阻塞时展示阻塞原因。
- 将项目注册表、run history、result 和 events 存在 Electron userData。

Desktop Client 的验收覆盖任务源 mock、确定性队列、单活动任务、状态写回门禁、人工 Gate、恢复状态、project status、run manager、Renderer 状态投影和 Electron 启动。真实服务验收还需要有效 Workshop 会话和可操作任务。

### M4：可替换 agent adapter

M4 增加 opencode 或多 agent adapter。Runtime 保持同一 loop 控制面，不把状态选择、事实路由和完成审计交给 worker 自行决定。

## 验收口径

Arckit Runtime 满足方案时表现为：

- 能从 canonical project state 选择下一轮 gap。
- 能生成包含上下文、停止条件和输出 schema 的受控 agent 指令。
- 能实时展示 agent 执行事件，支持 steer 和 interrupt。
- 能展示 Runtime Kernel 输出的 round state、controller reducer result、artifact ownership scan 和 ledger stage。
- 能拒绝缺少 artifact impact scan、source-projection check 或 loop handoff 的结果。
- 能把 LLM/worker 的语义判断限制为结构化 claim，再由代码验证协议、证据、路径归属和门禁条件。
- 能按 Controller、Runtime、Worker 三个 execution plane 注册七个保留 capability，并拒绝所有非法 Worker skill binding。
- 能把 agent 续轮、人工决策、外部等待和完成状态区分为不同 loop handoff。
- 能只把 `requires_human_decision=true` 当作人工门禁；`requires_main_agent_decision=true` 进入 Controller Reducer 内部动作，不默认阻塞 closeout。
- 能在不改 agent core 的情况下先接 Codex app-server，并保留 opencode、多 agent adapter 的扩展边界。
