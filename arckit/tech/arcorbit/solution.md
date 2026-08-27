# ArcOrbit 技术方案

## 定位

ArcOrbit 是 Arckit 的自动化监督与执行控制面。它替代人类在 Codex 会话外持续触发下一 turn、观察过程、处理恢复、调用 ledger 和衔接远端生命周期的工作；Codex、opencode 或其他 coding agent 继续拥有语义推理、skill 选择、工作区执行、证据收集和 transition claim。

Runtime 不替代 Agent 或 Arckit skills。Skills 继续承载方法、事实源维护规则、输出契约和模板；Runtime 负责 readiness preflight、读取 Project/Case 状态、通过 `$using-arckit` 启动一个连贯 Agent turn、观察执行事件、校验结构/授权/安全边界，并调用 trusted ledger entrypoint。

## 架构组件

```text
User Input
  -> Automation Supervisor
      -> Bounded Workspace Arbiter
          -> Workspace Lane A (serial tasks)
          -> Workspace Lane B (serial tasks)
          -> Workspace Lane C (serial tasks)
      -> Per-lane Readiness / Claim / Runtime / Ledger / Closeout
  -> Desktop UI
```

Runtime Kernel 是策略中立的自动化内核，不是语义微编排器。一次 Loop 对应同一 Codex thread 中的一个 Agent turn：Agent 用 Project invariants 与 fresh Case facts 发现候选，选择一个 Case gap，调用必要 skills/tools，只执行和验证该 Gap 的单一 acceptance claim，并返回一个 Case control、Case transition 或 handoff。Runtime 不把这个 turn 再拆成阶段化的多个 Agent invocation，也不解释 invariant 或派生事实域路由。

Runtime Kernel 不充当 semantic truth judge。代码不判断产品概念、架构取舍、skill 适用性或业务语义是否“真的正确”；这些语义判断来自当前 Agent、人类或显式委派方。Runtime Kernel 只验证 schema、revision、授权、工作区/路径安全、证据存在性和 ledger transition 合法性，不重做 Agent 的语义 review。

Runtime Kernel 不把 raw input envelope 当作 semantic state。Desktop operator event、完整 activity、完整 controller frame、完整 ledger write result、worker stream JSON 和上一轮完整 prompt 只属于 raw evidence 或 audit。Runtime 可以保存引用、摘要和结构化 claim，但不能把 raw envelope 写入 `round_goal`、`controller_frame.round_goal`、`loop_handoff.agent_instruction.goal`、`progress_guard.expected_state_change`、Project State `case_control` 或 Case State `current_round`。

Desktop UI 只展示 Runtime Kernel 的 control state，不自己猜测业务流程。Skills 继续提供能力说明、事实源维护规则和按需委派协议；它们不能替代 Runtime Kernel 做外部生命周期与自动续轮控制。

Skill layer 位于系统底层。Skills 只承载可复用能力、底层协议、事实源维护规则和各 execution plane 的能力边界，不沉淀 Desktop Runtime 的产品架构、状态机、自动写回策略或控制内核决策。这类上层架构事实只写入 `arckit/tech` 与 runtime 代码。

Runtime 只解析 `arckit.capability.json`，不自行解释或复制 `SKILL.md` 正文。Manifest 声明 Agent Loop 的自然 `$using-arckit` trigger 与确定性 `arckit-development-ledger` trusted entrypoints。当前 Agent 在 turn 内按 Codex 原生机制发现和使用其他已安装 skills；Runtime 不维护 definition、diagnosis、code 或其他 skill 白名单，不复制 skill 语义，也不预先生成 Worker 能力关联。

### Runtime Kernel

Runtime Kernel 当前由以下确定性阶段组成：

- Readiness Preflight：在远端任务从 pending 变为 in_progress 前检查本地工作区、canonical state、Codex adapter、Runtime capability policy、manifest 结构与 trusted ledger entrypoint；失败只形成本地 readiness recovery，不先占用远端任务。Codex skill 的发现、版本选择和加载由 Codex 自身负责，不属于 Runtime readiness。
- Session State Machine：记录 `preflight -> claimed -> agent_running -> ledger_gate_ready -> ledger_written -> next_turn_ready`，并支持 `blocked`、`human_gate_required`、`external_wait`、`failed` 等控制态。
- Artifact Ownership Map：把 Agent 声明的 changed files 归类为 source fact、projection、runtime log、pending/raw input、implementation evidence 等，提供结构与安全校验，不推断业务正确性。
- Ledger Stage：当 Agent result 携带可写 Case control/transition 时做 deterministic gate；gate 允许则自动写 ledger，拒绝则从 fresh state 重规划或形成明确 handoff。
- Task Thread Registry：为每个待办持久化唯一 Codex thread id、所有权租约、最后 turn 与压缩检查点，支持进程重启后恢复同一对话。
- Acceptance Feedback Lane：把已完成或已验收待办上的人工问题持久化为独立反馈项和队列，复用来源 task thread/session，以新 Run 和新 Case 推进而不改写来源待办或旧 Case。
- Execution Arbiter：按规范化本地工作区建立 lane，每个 lane 分别读取普通待办与验收反馈的 ready 队首并持有单一 workspace/thread 执行租约；全局最多填充三个空闲 lane，队列身份、计数和排序保持独立。
- Context Governor：在一次 gap ledger 写回后读取最新请求的上下文占用；达到 80% 时先压缩同一 thread，再继续下一 gap。
- Same-thread Closeout：Case resolved 后由同一 Agent thread 完成验证补漏、必要修复和 Git commit/no-op 收尾，成功后才允许远端完成写回。

### State Store

State Store 读取目标项目的 Arckit 状态入口：

- `arckit/project/state.record.json`
- `arckit/project/STATE.md`
- `arckit/project/iterations/*.record.json`
- `arckit/cases/INDEX.md`
- `arckit/cases/active/*.md` 的完整 `development-case-record/v5`
- `arckit/spec/INDEX.md`
- `arckit/interaction/INDEX.md`
- `arckit/visual/INDEX.md`
- `arckit/tech/INDEX.md`

`state.record.json` 是 canonical record；Markdown brief 只作为 loop 决策摘要。

### Workshop Authenticated Service

Electron main 进程创建单个长生命周期 Workshop Authenticated Service，并把它作为认证服务和 Work Sync 的远端 Adapter 使用。该实例通过 Desktop Run Manager 的私有设置接口按请求读取最新会话，并通过同一接口持久化 token 轮换；Renderer、Automation、Worker 和 Runtime 子进程不能获得该私有接口。

认证服务固定提供以下有界操作：

- 发送邮箱或手机号登录验证码。
- 使用目标地址、验证码和验证码类型登录。
- 读取不含 token 的认证状态投影。
- 退出登录并清除远端身份。

验证码请求发送到 `auth-server/v1/public/send_verification`，固定携带 `purpose=login`。登录请求发送到 `auth-server/v1/public/login`，邮箱使用 `email` 字段，手机号使用 `phone` 字段。登录响应中的 access token、refresh token、相对或绝对过期时间被归一化后写入主进程私有设置。设置同时保存最近一次由 Workshop 证明成功的登录活动时间；验证码登录成功、启动会话恢复成功和 refresh 成功会更新该时间，本地页面浏览、普通业务读取、失败请求与离线操作不会更新。

会话使用滚动七天不活动窗口。应用每次启动恢复时，只要最近一次有效登录活动仍在七天内且存在 refresh token，就调用 `auth-server/v1/public/refresh_token`，即使 access token 尚未临近过期；服务端返回轮换后的 access token、refresh token 及覆盖新七天窗口的过期时间，主进程原子替换旧会话。Runtime 只接受服务端签发的期限，不通过本地时间戳延长签名凭据。连续超过七天没有有效登录活动、refresh token 已过期或认证服务明确判定 token 无效/撤销时，会话不可恢复并进入 `expired`。

业务请求前，服务重新读取私有设置。NebulaAuth access token 距过期不足五分钟时先刷新；业务请求首次返回 401 时也刷新并重试一次。所有并发刷新共享一个 in-flight Promise，成功后使用新 access token 重放原请求。网络错误、超时、服务不可用和其他没有证明凭据失效的刷新失败保留 refresh token、活动时间与会话代际，返回可重试的任务源错误；只有 refresh token 缺失、过期、超过七天不活动窗口或服务端明确返回无效/撤销凭据时才清除会话并返回稳定的 `unauthenticated`。认证服务与 Coordinator 分别维护会话代际；登录或退出使旧代际的在途刷新和同步结果失效，禁止旧响应在退出后恢复 token 或远端快照。

认证状态投影只有 `logged_out`、`authenticated`、`refreshing` 和 `expired`。投影包含脱敏账号标识、是否具备可刷新会话和可解释错误，不包含 access token、refresh token、原始登录响应或精确 token 过期值。

默认连接配置是正式 Workshop 服务根地址、`workshop` 业务服务和 `nebula` 认证模式。旧 store 的手填 bearer/debug headers 配置继续可被高级连接设置读取，但普通登录成功后切换为 `nebula`。

退出登录先停止新的远端请求并清除 access token、refresh token、过期时间和远端用户字段。Work Sync 随后关闭项目连接并清除当前身份的本地 Task Projection；Automation 清除 attention/recovery 中的身份依赖项和自动领取资格。本地项目、工作区绑定、run history、transcript 与 Codex proxy 设置不受影响。存在活动执行时，main 进程要求显式确认并安全停止全部 Runtime owner，避免退出后失去任务状态写回能力。

### Task Source Adapter

Task Source Adapter 是远端项目与任务服务器的唯一访问边界，并且只由 main-process Work Sync 使用。Renderer、Automation Coordinator 和 Runtime worker 不持有服务凭证，也不直接构造远端请求。Work Sync 通过本地 Task Projection Store 向 Work 与 Automation 发布状态，并通过受控本地命令接收任务动作。

Adapter 提供以下语义操作：

- 读取当前认证用户。
- 读取当前用户可访问的项目。
- 按项目和可选状态读取任务。
- 基于任务最新版本条件式更新状态。
- 区分未认证、无权限、版本冲突、服务不可用和无效响应。

Workshop task source 实现沿用 Workshop Desktop 的服务契约：先读取 `/projects` 的独立项目与 `/organizations`，再按 `organization_id` 合并组织项目；组织项目拉取采用有界并发，项目按服务器标识去重。Work Sync 为 Work 投影读取项目内可访问任务，并从项目成员的 `is_me` 标记或登录用户名解析当前用户数字 `user_id`，从同一项目投影派生 Automation 可消费的执行人子集。无法解析项目内当前用户标识时，不向 Automation 发布该项目候选，但 Work 保持权限允许的只读投影。任务状态由 `/tasks/{task_id}` 更新。认证配置和令牌只保存在主进程设置中，Workshop 专属响应形状不泄漏给 Renderer 或 Automation。

任务状态枚举固定为 `pending_review`、`pending`、`in_progress`、`completed`、`accepted`、`cancelled` 和 `blocked`。未知状态保留原始值用于诊断，但不进入自动队列。

验收反馈不是第八种任务状态。Desktop 以独立反馈记录保存 `queued`、`running`、`awaiting_human`、`blocked`、`resolved` 和 `cancelled` 生命周期；来源 todo 保持 completed 或 accepted。详细持久模型、幂等创建、双队列仲裁和恢复规则由 `desktop-execution-solution.md` 定义。

远端状态更新由 Work Sync 携带本地投影最后确认的版本标识或等价条件。服务端不支持条件更新时，Work Sync 通过 Adapter 处理必要的重读和冲突，并只在服务端成功后提交新的本地任务状态；该能力在 UI 中标记为弱一致领取。Automation 不执行远端重读或条件更新。

Coordinator 在提交本地领取意图前调用 Desktop Run Manager readiness preflight。Preflight 只读检查本地绑定、canonical state、Runtime capability policy、repository capability manifest 与 trusted ledger entrypoints；它不推导 Codex skill 安装路径，不读取安装版 `SKILL.md`，也不比较 skill 版本或目录漂移。全部通过后，Coordinator 请求 Work Sync 执行 `pending -> in_progress`，并只在本地 Task Projection Store 发布 `in_progress` 后启动 Runtime。Preflight 失败产生 `readiness_failed` recovery且本地任务保持 pending；Work Sync mutation 成功后的启动失败仍按 `start_failed` 恢复。

### Desktop Execution Plane

Automation Store、Coordinator、待办级 session、Workbench transcript、Token Usage 投影、命令单飞与软异常契约由 `desktop-execution-solution.md` 定义。主 Kernel 只向该平面提供结构化 run event、handoff 与 ledger 结果；Desktop 不从模型文本推断控制状态。

### Recovery Model

Recovery 状态是持久化的一致性差异，不是只存在于 Renderer 的错误提示。每个 recovery item 包含类型、远端任务快照、本地活动关联、证据引用、冻结范围、操作责任方和允许动作。Recovery responsibility 使用 `operator`，与需要用户提供业务语义的 attention item 分离。历史跨进程 continuation run 仍可被启动同步识别和收束；新的 state-driven run 在原 Runtime 进程内消化 agent continuation。

恢复类型至少包括：

- claim conflict：刷新任务并选择下一候选，不创建 run。
- start failed：重试同一启动意图，或由用户显式标记阻塞。
- completion writeback failed：重试完成写回，不领取下一任务。
- external terminal change：请求当前 run 安全停止，再以服务器事实收束。
- multiple active tasks in one workspace：冻结受影响 lane，由用户选择该工作区的唯一恢复目标；不同 workspace 各有一个活动任务属于正常状态。
- project or task source invalid：排除受影响范围并重新同步。
- authentication expired：清除可执行资格，重新认证后完整同步。

Coordinator 启动时按 workspace lane 对齐本地活动关联、Desktop Run Manager 的活动 run 与服务器进行中任务。每个 lane 三者一致时独立恢复观察或执行；同一 lane 无法确定唯一活动任务时进入 lane-scoped multiple active tasks recovery，其他 lane 继续。

Coordinator 只消费 Work Sync 从本地 Task Projection Store 发布的当前执行人任务。项目级同步失败、身份无法解析或权限撤销时，Work Sync 停止向 Automation 发布受影响项目候选并保留可诊断状态。领取、人工状态变更和完成写回都作为本地意图提交 Work Sync；任务已改派、状态冲突或服务端拒绝时，Work Sync 保持原本地任务状态并发布恢复结果，Coordinator 不自行重读远端。

### Desktop IPC 与 Renderer

Preload 只暴露产品动作，Renderer 只消费 Automation Snapshot 和 Run activity。认证、任务状态与 Runtime 写操作继续在 main 进程重新校验；待办 transcript 和用量投影遵循 `desktop-execution-solution.md`。

主 BrowserWindow 在 macOS 使用 Electron `titleBarStyle: "hidden"` 和固定 `trafficLightPosition`：系统标题文字隐藏、内容延伸进 40px ArcOrbit 标题栏，但原生 traffic lights 保留，因此绿色按钮的单击全屏/退出全屏与悬停或按住后的系统布局面板继续由 macOS 提供。Windows/Linux 使用 `frame: false`，由 Renderer 在应用标题栏右侧表达最小化、最大化/还原和关闭。两个分支都保留原生 resize/move 能力；标题栏空白区域是 drag region，Windows/Linux 控件是 `no-drag` 交互区，macOS 不注册自绘窗口按钮或双击最大化监听。Preload 只额外投影只读的 `windowControlMode`，并保留 `state`、`minimize`、`toggle-maximize` 和 `close` 四类窗口产品动作；main process 校验调用方确为当前主窗口后才操作 BrowserWindow。main process 监听 maximize、unmaximize、minimize、restore 与 fullscreen 变化并向 Renderer 投影有界状态，使 Windows/Linux 按钮名称和视觉状态与系统快捷键产生的窗口状态保持一致；Renderer 不获得 BrowserWindow 对象、通用 Electron API、shell 或任意系统窗口命令。

### Loop Controller

Loop Controller 通过 ledger manifest 的 trusted `loop_snapshot` 入口读取 advancement、完整 software definition decisions、software invariants、全部 active Cases、最近 invariant assessments、candidate catalog、revisions 与 snapshot tokens。Project gap 只作为选择/创建 Case 的宏观依据；数组顺序不表达优先级。通过 `$using-arckit` 调用的 Agent 每轮结合 invariants、fresh Case facts 和原生 skills 发现并可见地比较 persisted/fresh candidates，记录 eligibility、priority basis 和 selected/deferred/excluded 理由后选择唯一 Case 与一个 gap。Runtime 不解析 canonical records 复刻候选规则，也不根据关键词、decision/invariant、固定优先级或 skill/path 映射拍板业务 route；上一轮不得通过 impacts、事实域、复合步骤 Gap 或 closeout 预排下一轮路径。

本轮目标必须形成：

- selected Case gap
- round goal
- planned Case transition
- required context refs
- required outputs
- stop conditions

Loop Controller 不从 Project State 读取轮次 continuation。Project `case_control.next_case_intent` 只说明选择哪个 Case 的宏观意图；下一轮目标由 Controller 从 Case candidate gaps、本轮 operator task 和新增证据中形成。Loop Controller 不从 raw operator event 中自行抽取并持久化语义目标。

### Capability Registry

Capability Registry 读取 repository 和目标项目中的 `arckit.capability.json` manifest，并应用 `runtime/arcorbit/config/capability-policy.json`。默认 Kernel policy 只绑定两个 Runtime 管理能力：Agent 入口 `using-arckit` 与 trusted Runtime 能力 `arckit-development-ledger`。其他 definition、diagnosis、code 和 quality skills 由当前 Codex Agent 通过原生 skill discovery 在同一 turn 中选择，不进入 Runtime 预测式 route。

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

Agent Loop invocation 只使用 repository capability manifest 声明的自然 trigger，并提供 fresh canonical digest、operator input 与授权；不显式添加第二份 skill input，也不复制 Controller 协议或 capability manifest 正文。Runtime 不访问 Codex skill 安装目录，不读取或比较安装副本的 manifest、`SKILL.md`、protocol revision 或其他文件；Codex 按自身发现机制决定实际加载的 skill。

### Prompt Compiler

Prompt Compiler 为 Agent Loop 生成最小 invocation。首个 turn 包含自然 `$using-arckit` trigger、待办原始意图、fresh canonical digest、授权与输出契约；后续 turn 只提供仍稳定的任务标识、当前增量、fresh revisions/digest、授权与契约，不重复拼接旧 prompt、完整状态正文或历史报告。

默认 invocation 以 manifest 声明的自然 `$using-arckit` 文本 trigger 进入 Codex 原生 skill 机制，不额外发送 `skill` input item。其余内容只有 locale、原始待办意图、当前增量、bounded canonical facts、revision、execution authorization 和 compact output contract。Agent 在 turn 内自行读取必要仓库事实、发现其他 skills、执行工具并完成自我审查；Runtime 不拼接 skill 清单、固定 Worker role 或预测式 allowed paths。

Runtime 从 trusted ledger snapshot receipt 投影 Agent context digest。Receipt 已包含 Project revision、software decisions/invariants、advancement/project gaps、全部 active Cases、candidate catalog、source digests 与 snapshot tokens；Runtime 不再自己读取 canonical JSON、推导 candidates 或重判协议兼容性。Digest 不包含 raw transcript、模型 reasoning 或未接受 claim；snapshot 报告协议不兼容时进入恢复流程，不启动业务 Loop。

`context_digest` 是有界的恢复索引，不是 transcript 摘要。它包含 Project/Case revisions、software decisions/invariants、active Case selection facts、facts/impacts/candidate gaps、最近已接受 round 摘要、未解决问题和 canonical refs；不包含 raw event、完整历史 prompt、模型 reasoning 或未接受 claim。

`arckit-agent-loop-result/v1` 的 `outputSchema` 遵循 Codex 严格结构化输出子集：`const` 同时声明显式 `type`，对象关闭额外属性并把全部属性列入 `required`，数组声明 `items`。Runtime 在创建 app-server thread 前递归预检这些约束，使无效 Schema 作为本地配置错误终止，而不是启动 turn 后才收到远端 `invalid_json_schema`。

Agent Loop result 通过互斥 `action=case_control|case_transition|handoff` 表达本轮结果。没有合适 Case 时返回包含 expected outcome、initial facts、实际相关 impacts 与至少一个具体 gap 的 `case_control.create_case`；Runtime 只绑定 Project revision 与 review policy，不解析关键词补造语义。

Runtime 把创建动作绑定到当前 Project revision 和 Case review policy，形成 `arckit-case-control-handoff/v1`，再调用 `arckit-development-ledger` manifest 声明的 `case_control` 可信入口。ledger 分配 Case id，并在 Project commit lock 中把 Case 创建、Project/iteration 注册和投影索引作为可回滚提交；Project 不保存独占 selected Case。成功后同一 Runtime 进程重新读取 canonical state，并在同一 Agent thread 发起下一 turn。revision 或 candidate-gap 新鲜度冲突不产生部分写入，并进入有 no-progress budget 的 fresh-state replan。

Case 的模型边界只使用 v4 fact/impact/gap delta；普通 transition 必须关闭 selected gap，并可在同轮增加事实、更新相关 impacts 或增加后续 gaps。

人类输入只有初始任务意图、人工决策/纠正和显式控制动作。初始 Runtime run 使用待办正文原文；人工 fresh continuation 使用人工输入原文；自动续轮没有新增 operator input，也不创建 `role=user` transcript，而是由 Runtime 在写回后重新读取 Case State 并在当前会话中继续。任务 ID、项目 ID、source run、round index、gate 和 ledger 状态保持为 Runtime 控制面元数据。

### Agent Adapter

Agent Adapter 是外部执行器边界。M0 提供 dry-run adapter；M1 已接 Codex app-server stdio JSON-RPC；后续可以接 opencode 或多 agent runtime。

Codex adapter 的生命周期与一次 state-driven Runtime session 对齐。Runtime 只启动一个 `codex app-server --stdio` 子进程并完成一次 initialize；同一待办的默认 Agent Loops 通过该连接串行执行，并复用一个稳定 `threadKey=agent-loop:{run_or_task_identity}`。每次 ledger 写回后的 fresh state 进入同一 thread 的下一 turn，保持与人类在一个 Codex 对话中持续工作的语义连续性。

当前 invocation 是每个 turn 的事实与授权来源。原始待办意图保持稳定，当前增量、Project/Case revisions、candidate gaps、execution authorization 和 output contract 覆盖 thread 中冲突的旧内容；历史讨论不能扩大 sandbox、approval、工作区或 ledger writeback 权限。Runtime 不生成 `allowed_skills`、预测式 `allowed_paths` 或执行角色 workstream。

每个待办只有一个非 ephemeral Codex thread。Desktop 以项目身份与远端任务 id 为键持久化 app-server 返回的 opaque `thread.id`，并在发出首个 `turn/start` 前完成写入；同一待办关联的验收反馈 Run 继续复用该 thread，但每个反馈使用新 Case。任何时刻只有一个 Runtime/CLI/feedback owner 可以持有该 thread lease。进程重启后先 initialize app-server，再 `thread/resume(threadId)`，fresh-read Project/Case State 后从下一 turn 继续，不创建 replacement thread。

`thread/resume` 的瞬时失败进入可重试 recovery。只有 app-server 明确确认 thread 永久不存在时，Runtime 才记录 `thread_recovery_fallback` 并从 canonical state 创建、立刻持久化一个新的非 ephemeral thread；若 canonical facts 不足以安全续接则要求人工介入，不能静默丢弃上下文。

Adapter 遵循当前 Codex app-server 协议：每次 `turn/start` 的 `outputSchema` 只约束当前 turn；skill 通过自然文本 trigger 进入 Codex 原生发现机制，不额外发送 `{type: "skill"}` input；command/file approval 的接受值为 `accept`，拒绝值为 `decline` 或 `cancel`。`item/permissions/requestApproval` 返回 granted permission profile，不复用 command approval 的 decision 结构。Runtime 不用 approval 或 sandbox 禁用 Agent 的正常语义与工具能力；协议门禁只负责真实授权与结构合法性。

每次成功 ledger 写回后，Runtime 使用 `tokenUsage.last.inputTokens / tokenUsage.modelContextWindow` 判断当前请求上下文占用。达到 80% 且自上次 Agent turn 后尚未压缩时，Runtime 对同一 thread 调用 `thread/compact/start`，等待 context compaction item/turn 完成并保存检查点，再 fresh-read state 发起下一 turn。累计 Token 不作为阈值，压缩不创建新 thread，也不设置总 Token、总轮次或墙钟上限。

adapter 的 `close` 只在 session 完成、人工/外部 handoff、失败、interrupt 或安全预算终止时调用。单个 turn 完成只关闭该 turn 的事件队列，不关闭 app-server。stdin supervisor 在 adapter 生命周期内只绑定一次，并把 `/steer` 与 `/interrupt` 路由到当前 active turn。

### State-driven Session

执行模式把多个 Loop 保持在一个 Runtime 进程内：

```text
trusted snapshot -> visible candidate comparison -> one coherent Agent turn
  -> structural gate -> deterministic ledger write -> round_closeout
  -> trusted post-commit snapshot -> next turn
```

每次 ledger 写回后先把 ledger 生成的独立 closeout 投影给用户，再由 State Store 携带 `post_commit_snapshot_token` 调 trusted `loop_snapshot`；只有 receipt 确认 `observed_after_commit=true` 后才能发起下一轮。内存中的旧 snapshot、writeback candidate 与 selected gap 不可跨写回复用，但同一 active Agent thread 继续提供对话连续性。Case 创建也遵循同一规则：可信入口注册新 Case 后，下一 turn 从 post-commit snapshot 选择该 Case gap。

Runtime 仅在 handoff 明确要求 human responsibility 时标记 `paused_for_human=true`。Agent responsibility 无论是 `auto_bridge` 还是受自动策略允许的 `manual_bridge` 都在当前进程继续。External responsibility 仍以协议内部 `external_wait` 终止当前 Runtime 执行，不伪造 human decision；上层 Automation Coordinator 必须把这一“自身无法继续”的原因投影为带 `external_dependency` 的人工介入事项。连续无 ledger 进展达到恢复预算时安全停止。生产性 ledger 写回会重置该计数，因此它不是总墙钟或生产性 Round 上限；长命令自然运行到完成或显式 interrupt。

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
- `closeout`：Case resolved 且已通过 Completion Review 后，同一 Agent thread 仅执行 Git commit/no-op；禁止重新做语义检查、验证、编辑或修复。
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

- `arckit-case-transition/v8`
- `arckit-ledger-snapshot/v1` 与 `arckit-round-closeout/v2` receipts
- development Case record 与 derived candidate gaps/resolution
- resolved Case 的显式 Project/iteration impact
- Case、Project、iteration 的 indexes 与 projections

Ledger writeback 是已接受 Case transition 的必经阶段。Desktop 执行型 run 在 Controller 接受 evidence-backed delta 且 `ledger_stage.status=gate_ready` 后运行 gate；即使 Case 仍 unresolved 或下一责任方是 human/external，也可以先安全写入本轮 accepted delta，再停止桥接。

每个 transition 绑定 Case `updated_at`、本轮观察到的 Project numeric revision与 Case-scoped snapshot token，并携带覆盖 persisted/fresh 候选的完整 `gap_selection.considered` 和覆盖当前 Project invariant catalog 的 `invariant_assessment`。`candidate` 以稳定 selected ref、Gap id、revision、snapshot token 和当前 ready 状态确认身份，Agent 可自然转述 goal/reason，Ledger apply 时重新解析并保存 canonical candidate；`fresh` 必须是未持久化、Agent-owned、依赖已闭合且当轮完成的结果 Gap。Gate 只负责 Runtime envelope、执行授权和路径边界，再通过 trusted ledger `case_transition` entrypoint 做 canonical validation；Runtime 不复制 revision、candidate coverage、invariant relevance 或 fresh-gap 语义。普通 unresolved transition 不改变 Project revision，Case-scoped token 允许不相关 Cases 独立推进；Project 或所选 Case snapshot 变化时 fail closed。Ledger 通过跨进程 Project lock 原子写 Case、Project、iteration、projections 与 indexes，并返回包含 accepted invariant judgments、但不含 next candidate 的 closeout 与 post-commit token。

Ledger Writer 只消费通过 Runtime Validator 的 semantic fields。写入前检查 Case id/gap、planned transition、accepted delta、evidence、round outcome、Case resolution claim 和 Project impact candidate；raw operator task 不能作为 fallback。语义字段含 raw event marker、超长或 transition shape 不完整时，gate 阻止写回。Gate、result builder 与 handoff 不再各自重判 Case 语义；一次拒绝不能同时被其他分支解释为 resolved 并写回。

写回策略按层分工：

- Project State v5 写 advancement、software definition decisions、software invariants、project gaps、active Case refs、selection context 和 evidence refs。
- Iteration State v3 写阶段性 Project targets、accepted Project changes、acceptance、blocking Project gaps 和 Case refs；不写 Loop continuation 或同态日志。
- Case State 写事项级 checkpoint：facts、state impacts、dynamic gaps、每轮 invariant assessment、content revision、completion review policy/cycles/escalation、open questions、pending handoffs、round records、derived resolution 和 loop handoff。每条 round 可保存 opaque run ref，但不保存 Runtime 宿主绝对路径。
- Runtime 宿主在目标项目之外管理完整过程证据：runtime result、gate、selected round、activity、raw events 和 transcript。Desktop 使用 Electron userData；ledger 不复制这些记录，且 Case 语义恢复不依赖它们仍然存在。
- Agent 不直接写 Project/Case State；Agent 提交一个 transition claim，ledger 确定性应用。

当 operator input、现有稳定事实或 Agent 在 turn 内取得的证据足以支持 selected gap transition 时，Agent 提交 accepted delta 与 invariant assessment。每次成功写回后先展示 canonical round closeout，再用 post-commit token 重新读取状态和 revision；下一 turn 从新 candidate catalog 独立选择 candidate/fresh gap。`gaps_added` 只承接本轮新 facts 暴露且仍未解决的结果，不承接预排步骤，也不在当前 turn 执行。不同 Case Loops 可以并行执行，ledger commit 短暂串行；Project aggregation 冲突只使相关 transition 从 fresh state 重规划。自动桥接由实际 ledger 进展与 no-progress streak 共同约束。

## M0 实现范围

M0 位于 `runtime/arcorbit/`，实现：

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

M1 接入 Codex app-server JSON-RPC，当前实现位于 `runtime/arcorbit/adapters/codex-app-server-adapter.mjs`：

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
- Desktop 使用 Electron utility-process parent port 发送 `arcorbit-runtime-control/v1` typed steer/interrupt；standalone CLI 保留 `--supervise-stdin`，两条 transport 进入同一 app-server 控制语义。

M1 已验证本地 Codex app-server initialize 握手；真实模型 turn 因会消耗模型调用并可能修改仓库，默认留给人工显式触发。

### M2：Gate 与 ledger writeback

M2 将 gate 和 validator 结果接入 `arckit-development-ledger`，当前实现位于：

- `runtime/arcorbit/src/gate-engine.mjs`
- `runtime/arcorbit/src/ledger-writer.mjs`
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

- `runtime/arcorbit/desktop/main.mjs`
- `runtime/arcorbit/desktop/preload.cjs`
- `runtime/arcorbit/desktop/renderer/*`
- `runtime/arcorbit/src/desktop-run-manager.mjs`

Desktop Client 不重新实现 Runtime。它通过 Electron main 进程调用同一个 `bin/arcorbit.mjs`，并把运行过程投影成桌面交互。默认表面是待办自动化 Command Center；Chat session 作为 transcript 与人工介入基础设施按需出现。

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

Desktop Client 的验收覆盖任务源 mock、确定性队列、每 workspace 单活动执行、跨 workspace 最多三个并行执行、状态写回门禁、lane-scoped 人工 Gate/恢复、全局故障、project status、run manager、Renderer 状态投影和 Electron 启动。真实服务验收还需要有效 Workshop 会话和可操作任务。

### M4：可替换 agent adapter

M4 可以增加其他支持持久 thread 语义的 agent adapter。Runtime 保持同一 loop 控制面，不把状态选择、事实路由和完成审计编码成 Kernel 策略。

## 验收口径

ArcOrbit 满足方案时表现为：

- 能从 canonical project state 选择下一轮 gap。
- 能生成包含上下文、停止条件和输出 schema 的受控 agent 指令。
- 能实时展示 agent 执行事件，支持 steer 和 interrupt。
- 能展示 Runtime Kernel 输出的 round state、Agent transition、artifact ownership scan 和 ledger stage。
- 能拒绝缺少 artifact impact scan、source-projection check 或 loop handoff 的结果。
- 能把 Agent 的语义判断限制为结构化 claim，再由代码验证协议、证据、路径归属和门禁条件。
- 只绑定 `using-arckit` Agent 入口与 `arckit-development-ledger` trusted entrypoints，并保留 Agent 原生 skill discovery；Runtime 不建立 Worker registry。
- 能把 agent 续轮、人工决策、外部等待和完成状态区分为不同 loop handoff。
- 能让一个待办从首轮、普通 Gap、Completion Review、finding 修复到 Git-only closeout 只使用一个持久 Agent thread，并在进程重启后 resume 同一 thread、每次写回后 fresh-read state。
- 能以 manifest 声明的自然文本 trigger 触发兼容的 Controller skill，不显式注入 `skill` input item，并按当前 app-server schema 返回 command、file 与 permission approval 响应。
- 能在最新请求上下文占用达到 80% 时压缩同一 thread，保存压缩检查点后继续下一 gap。
- 能为每个 Agent turn 生成有界、可恢复的 context digest，并在目标、授权或 canonical refs 异常漂移时投影非阻断软提示。
- 能为每个远端待办创建独立 Desktop session，按 thread 最新累计快照去重 Token 用量，并以软异常而非硬 Token/轮次限制治理浪费。
- 能为一个待办从远端领取到 completed 写回建立跨 Run 的父子 span，持久化脱敏 JSONL，并用 exclusive time 区分 orchestration、task execution、external 与 closeout 热点。
- 能把同一活动任务从 Runtime 安全交给用户可参与的交互式 Codex CLI，并以 canonical Case State 而非旧 Run 或终端退出状态完成恢复对账。
- 能只在 Agent handoff 明确声明 human responsibility 时暂停自动执行，external wait 与结构恢复分别保持独立状态。
- 能在不改 agent core 的情况下先接 Codex app-server，并保留 opencode、多 agent adapter 的扩展边界。
