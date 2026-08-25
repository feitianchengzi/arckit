# Runtime 待办自动化工作区

## 功能定位

ArcOrbit Desktop 是以项目待办和验收问题为两条独立工作来源的自动化执行工作区。用户在主页面观察当前用户可访问的项目、项目产生的待办、跨项目待办执行队列、验收问题队列、各本地工作区的活动 Runtime、人工事项与完成证据；任务对话只在审查执行过程、提出验收问题或 Runtime 明确需要人工输入时通过 Intervention Workbench 按需出现。Personal / Chat 的自由会话不进入本工作区。

该工作区承担任务服务器与本地 ArcOrbit 之间的控制面职责。任务服务器拥有项目、任务归属和任务生命周期事实；Runtime 拥有本地工作区绑定、自动化参与状态、单任务执行状态、Agent turn 生命周期、事件和 ledger 证据。

Runtime 替代的是人类在 Codex 中持续读取最新状态、发送下一轮输入、观察执行、处理恢复、调用 ledger、提交代码和回写远端任务的自动化劳动，不替代 Codex Agent 对任务的语义理解、skill 选择、仓库调查、实现、验证与自我审查能力。人工直接使用 `$using-arckit` 与 Runtime 自动桥接使用同一个 Agent Loop 语义；差异只在触发、授权、事件存储、自动续轮和外部生命周期管理。

默认执行路径把一个待办视为一个连贯的 Codex 工作单元。Runtime 为待办持久化唯一 Codex thread，并在每次 ledger 写回后向该 thread 发起新的 turn。每个 turn 从 fresh canonical Project/Case State 选择并完成一个 gap，Agent 在 turn 内自行使用必要工具与 skills，最后返回一个 Case control、Case transition 或需要人工/外部介入的 handoff。Runtime 不提供 Controller planning、Worker dispatch 或 Controller review 分段路径。

## 核心对象

### 当前用户

当前用户由任务服务器认证会话确定。工作区展示当前用户可访问的项目，但任务范围只包含执行人是当前用户的待办；仅由当前用户创建、未分配或分配给其他用户的待办不展示、不计数且不进入自动化。认证失效时，系统保留最近一次成功同步的只读快照，但停止领取任务和提交状态变更。

### Workshop 账号与认证会话

ArcOrbit Desktop 使用 Workshop 的 NebulaAuth 验证码登录。用户可以选择邮箱或手机号，先请求登录验证码，再提交目标地址、验证码和验证码类型完成登录。发送验证码和登录均展示独立进行中状态与服务端错误；验证码发送成功后进入 60 秒重发冷却。

应用启动时先恢复认证状态。未登录用户默认进入独立登录页面，Automation Workspace 在认证成功前不提供可交互入口；已认证或会话可刷新时直接进入 Command Center。登录页面不提供关闭、返回或跳过动作，登录成功后才进入工作区并开始同步。

应用默认连接正式 Workshop 服务地址；服务根地址与业务服务名属于高级连接设置，不要求普通用户手工填写。认证请求固定发送到认证服务的公开接口，项目与待办请求固定发送到 Workshop 业务服务的用户接口。Renderer 只能调用受限的登录、退出与同步能力，不能指定任意服务路径或读取原始 token。

登录成功后，主进程持久化 access token、refresh token、两类 token 的过期时间、最近一次有效登录活动时间和可展示的账号标识。Renderer 只接收登录状态、账号摘要和过期状态，不接收 access token、refresh token 或精确活动时间。

成功的验证码登录、应用启动时成功恢复远端会话和成功的 token 刷新构成有效登录活动；纯本地打开窗口、普通页面浏览、失败请求和离线操作不构成活动。会话采用滚动七天有效期：最近七天内存在有效登录活动时，应用启动恢复会主动通过服务端 refresh token 轮换续期，即使 access token 尚未临近过期；连续超过七天没有有效登录活动时才要求重新登录。主进程不在本地伪造或延长服务端凭据的有效期。

access token 在到期前五分钟刷新；业务请求收到未认证响应时，主进程最多刷新并重试一次。同一时刻的刷新请求合并为单次远端刷新。临时网络错误、服务不可用和其他没有证明凭据失效的刷新失败只暂停当前同步并保留可恢复会话；refresh token 缺失、已过期、被服务端明确拒绝或最近一次有效登录活动已超过七天时，会话进入已失效状态，自动领取与所有远端写操作停止，界面引导用户重新登录。

登录成功后 Work Sync 立即同步当前用户、项目和待办。退出登录清除远端身份、token、Work 本地 Task Projection 及依赖该身份的活动自动化状态；本地项目、本地工作区绑定、Runtime 历史和本地设置继续保留。

### 项目

项目是待办的一级来源。每个项目包含远端项目标识、展示信息、Work Sync 状态、本地工作区绑定和自动化参与状态。

“所有项目”是聚合观察范围，不是独立项目。选择项目只改变指标、任务列表和历史的展示范围，不隐式开启、暂停或重排自动化。

### 待办

待办始终归属于一个有效项目，并保留服务器任务标识、执行人标识、版本、状态、优先级和进入当前状态的时间。执行人不是当前用户、缺少有效项目归属、无访问权限或无法确认服务器版本的待办不进入工作区快照与自动执行队列。

待办正文只有一个远端 `content` 事实。Automation 把完整正文作为 Agent operator input，并从同一正文生成只读展示标题：连续 Unicode 空白折叠为一个半角空格，首尾空白移除，超过 64 个 Unicode grapheme clusters 时取前 63 个并追加 `…`。队列、当前运行、Intervention Workbench 顶部、确认对话和 session/CLI 标签统一消费该展示标题；正文、搜索和写回始终消费完整 `content`。

### 自动化队列

自动化队列由所有参与自动化且具备本地工作区绑定的项目产生。队列只包含执行人是当前用户、服务器状态为待处理且当前版本已确认的任务。

队列按服务器优先级从高到低、进入待处理状态的时间从早到晚、项目标识和任务标识的稳定顺序排列。该全局顺序用于观察和在空闲工作区之间选择候选；同一工作区已有活动执行时，其后续任务继续排队。同步变化只影响下一次领取，不改变任何当前活动执行。

### 验收问题与验收问题队列

验收问题是独立于远端待办的工作对象。用户在已完成待办的结果审查中提出非空问题后，系统先持久化一个稳定问题标识、问题原文、来源项目与待办、来源完成记录、来源 Run 与 Case、原待办的 Codex thread 和执行会话引用，再把它加入验收问题队列。提出问题不改变来源待办的 completed 状态，不复制待办，也不把问题伪装成 pending 任务。已验收待办不接受新的验收问题。

每个验收问题项独立保存 `queued`、`running`、`awaiting_human`、`blocked`、`resolved` 或 `cancelled` 状态、当前进展、当前 Run、新建 Case、证据与结果。问题项通过新 Case 保存人工发现的问题、解决方案、实现和验证；来源待办原有 Run、commit、完成记录和 closed Case 保持不可变。多个问题项可以关联同一来源待办，并按稳定标识分别展示和推进。

验收问题队列与待办自动化队列分别持久化、分别计数、分别排序。验收问题队列按可执行时间、创建时间和问题标识形成稳定顺序；来源待办状态、优先级或待办队列位置不参与问题队列排序。两条队列在每个本地工作区执行 lane 内共享一个显式仲裁器：当前执行不被新问题抢占；lane 空闲时，从属于该工作区的两个 ready 队首中按最早 ready 时间和稳定标识选择一项，并取得 workspace 与 thread 执行租约。等待执行只改变问题项进展，不改变来源待办状态。

### 活动执行与工作区 Lane

Automation 以规范化本地工作区身份建立执行 lane。多个远端项目绑定同一本地工作区时共享同一 lane，不能并发修改同一工作树；不同本地工作区可以并行执行。每个 lane 在任一时刻最多拥有一个活动执行，活动执行可以来自待办队列或验收问题队列，并关联远端项目、任务、本地工作区、持久 Codex thread、执行会话和 canonical Case。Runtime run 或交互式 Codex CLI 只是该 Case 当前的执行入口。

Automation 全局最多同时运行三个 workspace lane。全局仲裁器只从空闲 lane 的队首中选择新执行；已占用 lane 的后续任务保持串行。lane 内的远端状态不确定、多个进行中任务、workspace/thread 租约冲突、人工 Gate 或完成写回失败只冻结该 lane，不阻止其他健康 lane 继续。认证失效、完整项目范围不可确认、Desktop Store 不可用、Runtime host 不可用或应用正在退出属于全局边界，冻结所有新领取。

每个活动执行分别持久化 canonical Case、git commit 和 Work 完成同步三个检查点。Case 已关闭只表示研发语义完成；commit 已完成表示本地交付完成；只有 Work Sync 发布服务器确认的 completed，远端生命周期才完成。三个检查点不得压缩成单一“正在执行”状态，也不得因应用重启或 Work Sync 暂时不可用而回退。

### 待办执行会话

每个远端待办拥有独立的 Desktop 执行会话和唯一持久 Codex thread。该会话聚合待办正文、首次 Runtime run、同一待办的自动续轮、人工输入、恢复 run、Git closeout 结果和最终完成摘要，不包含同项目其他待办的消息或执行摘要。

执行会话可以保存创建时的展示标题快照以保持历史标签稳定，但该快照只用于展示，不成为可编辑任务字段，也不覆盖后续读取到的 Workshop `content`。活动任务和新投影始终从当前完整正文重新生成展示标题。

同一待办的 fresh continuation 继续写入该待办会话。不中断的自动执行默认复用该待办的同一 Codex thread，通过多个 turn 保持与人类直接在单个 Codex 对话中工作的连续性；当前 operator input、fresh Case State、revision 和授权始终覆盖 thread 中冲突的旧事实。不同待办不得共享 Codex thread。进程退出、显式接力或恢复时允许从 fresh canonical state 建立新 thread，但不能把旧 transcript 当作恢复所必需的事实源。

历史完成 Run 和 closed Case 保持只读，但已完成待办的会话允许提出新的验收问题。问题原文追加为该待办会话中的用户消息，新的问题 Run 复用同一持久 Codex thread，并以 fresh Project/Case State 创建新的关联 Case；它不修改既有完成消息或旧 Case。已验收待办只提供验收结果审查，不显示问题 Composer。当前人工介入只加载活动执行的会话；项目级默认 Chat 或其他人工对话不作为自动待办或验收问题的隐式消息容器。

### 执行消息流

待办执行会话提供一条按发生时间排序的消息流。消息列表与 Personal / Chat 使用同一个 Conversation Surface：消息 DOM、Markdown、代码复制、非空 reasoning 折叠、工具与权限状态、流式更新、智能自动滚动、阅读位置保持和“回到最新”行为完全一致。两处不各自维护消息渲染或浏览分支；任一共享体验优化同时作用于 Chat 与 Automation Workbench。

消息流只承载用户与 Agent 的对话内容，以及 Chat 同样支持的 reasoning、工具和权限消息。Automation 专属的 candidate catalog、gap selection、round closeout、fresh-read、Case/ledger 状态、执行阶段、证据、用量和恢复控制进入左右信息面板，不在中间列表建立 Automation 专用消息布局。Agent 正式输出仍按对话正文显示；每个工具调用只呈现一行状态、动作、目标和可选结果摘要。文件正文、完整 diff、stdout/stderr、原始工具参数、JSON envelope、逐 token 文本 delta和逐字符 reasoning delta不作为消息正文持久化或渲染。

流式内容更新当前消息；相同消息的增量不会持续创建新记录或 DOM 节点。用于 Token、耗时、错误和恢复判断的结构化投影继续保留在 Run activity 与证据 Inspector 中，不要求用户阅读原始事件日志。

Workbench 保持窗口壳、左右信息栏和底部输入区稳定，只有中间共享 Conversation Surface 垂直滚动。左栏承载任务、人工请求、执行边界、恢复条件和当前控制状态；右栏承载完整执行时间、累计 gap 轮数、逐 gap 目标/工作/结果、当前阶段、Token、验证、Gate、ledger、Git 收尾和证据动作。逐 gap 全貌覆盖同一 task session 的全部 Runtime runs，并按 round 顺序展示 selected gap、Agent 工作摘要、accepted closeout 或未收束状态；用户无需从 transcript 逐条拼接执行历史。

进行中的完整执行时间从 task session 首次 Runtime 开始持续计时，终态后固定为首次开始到最终结束的墙钟时长；它不以模型耗时与命令耗时相加替代。累计 gap 轮数只统计实际启动的 state-driven rounds，不把 Chat turn、人工输入、Agent repair、context compaction 或 Git-only closeout误计为 gap。普通只读审查不提供运行控制输入；只有 completed 结果审查提供独立验收问题 Composer，它只创建问题项，不修改旧运行；accepted 结果审查保持只读。三种模式使用同一个共享消息组件和滚动边界。

### 人工事项

人工事项描述 Runtime 暂停推进所需的人类判断，包括原因、决策问题、影响范围、当前证据和恢复条件。人工事项是 Runtime 子状态，不自动等同于远端任务已阻塞。

## 任务状态模型

任务服务器提供七种状态：

- 待评审：任务尚未获得自动执行授权。
- 待处理：用户或服务器规则已确认任务可以执行。
- 进行中：服务器已确认某一执行端领取任务。
- 已完成：Runtime 与 ledger 已收束，服务器已接受完成写回。
- 已验收：任务结果已通过业务验收。
- 已取消：任务不再继续处理。
- 已阻塞：任务因不可继续的条件暂停，等待明确恢复动作。

标准生命周期为“待评审 → 待处理 → 进行中 → 已完成 → 已验收”。待评审、待处理和进行中任务可以被取消；进行中任务可以进入已阻塞，阻塞解除后回到待处理或恢复进行中。

Runtime 只自动推进“待处理 → 进行中 → 已完成”。评审、验收、取消和阻塞处置由用户或任务服务器规则完成。

验收问题状态不属于任务服务器七状态，也不反向驱动来源待办状态。来源待办存在未解决验收问题时保持 completed；只有全部问题 resolved 或 cancelled 后才能进入 accepted。accepted 表示验收通过且当前没有待处理验收问题，不允许新增问题。

## 项目与任务同步

应用启动时先按 workspace lane 恢复本地活动执行、Run 和 canonical Case，再恢复 Workshop 认证与 Work Sync。认证失效或 Workshop 不可达时，本地 Case 对账仍然执行；Work Sync 的远端调用和新任务状态提交保持停止，Automation 不尝试直接访问服务器。未登录时不自动领取任务，但已关闭 Case 和本地收尾检查点仍以只读状态呈现。

Work Sync 是 Workshop 待办同步的唯一所有者。它读取当前用户和可访问项目，按登录代际与项目维护完整七状态 Task Projection，并从项目成员身份派生可发布给 Automation 的当前执行人子集。无法确认执行人身份、权限被撤销或初始对账未完成时，Work Sync 不向 Automation 发布该项目候选；Work 页面仍按服务端允许范围使用同一项目投影。

active Workset 项目、`automation participation=true` 项目和所有活动执行所属项目形成 Work Sync 的同步需求并集。Work Sync 为该并集建立实时订阅；Automation 只提供本地项目需求标识，不创建连接、不读取 REST、不处理事件游标。

Workshop 为每个项目变更保存单调递增的持久事件标识。Work Sync 根据 `system.connected` 握手管理现代游标补取和 `legacy` 兼容连接；WebSocket payload 只作为项目失效信号。Work Sync 在合并窗口后执行必要的 REST 当前态对账，并在投影原子提交后推进确认游标。

Work Sync 每十五分钟执行全量项目与任务对账，并在应用启动、系统唤醒、网络恢复和旧服务重连时立即对账。实时连接断开时保留已有 UI 投影并自动重连，不启动分钟级降级轮询。用户可以从同步状态入口请求“立即同步”，该动作进入 Work Sync，不把网络实现或执行仲裁所有权交给 Automation。

Automation 只订阅 Work Sync 发布的本地任务状态变化。同步变化可以重算候选、冻结受影响 lane 或触发外部变化恢复，但不能直接启动 Runtime、清除恢复项或解除人工 Gate；执行仲裁仍要求自动化总闸、项目参与、本地绑定、全局并发名额、workspace/thread 租约和目标 lane 空闲。`awaiting_human` 在本地任务状态变化、连接恢复和对账期间保持关闭式保护，只有用户提交显式介入输入后才允许恢复同一任务；它不冻结其他 lane。

Work Sync 无法确认完整项目范围时，Automation 冻结所有新任务领取；单项目投影未完成当前登录代际对账时，只排除该项目候选，其他已确认项目仍可参与队列。同步状态可以展示连接模式、游标、最近项目对账和最近全量对账，但这些字段由 Work Sync 拥有，Automation 只引用执行恢复所需摘要。

活动 Runtime 期间，Work Sync 发布的本地状态若显示任务已改派、取消、阻塞、转移项目或撤销权限，Automation 请求对应 Runtime 在安全停止点收束并冻结其 workspace lane。Automation 不在领取、运行或完成前自行重新读取远端任务。

## 自动领取、跨项目并行与项目内串行

自动化开启且 Work 已发布的本地事实可用时，全局仲裁器枚举没有活动执行、没有 lane-scoped attention/recovery 且具有可执行项的 workspace lane。每个 lane 先从本 lane 的待办与验收问题 ready 队首确定一个候选；全局仲裁器再按既有稳定顺序启动候选，直到没有空闲 lane 或达到三个并发 workspace 的上限。待办项向 Work Sync 提交领取动作；验收问题项不改写来源待办状态，在取得 workspace 与 thread 租约后直接从其持久记录启动。

领取与启动使用稳定 `execution_id` 定位活动执行，并以规范化本地工作区身份作为串行租约键。远端任务身份使用项目与任务的组合身份，所有停止、介入、恢复、CLI 接力和完成动作必须指向明确 execution；页面当前选择不能替代控制身份。

Work Sync 使用本地投影的确认版本执行必要的服务器条件式更新，并处理重读、冲突和权限变化。Automation 不执行远端确认；只有 Work Sync 发布该任务的本地状态已经变为 `in_progress` 后，Automation 才持久化任务、项目、本地工作区和待启动 run 的关联并启动 Runtime。

领取发生版本冲突时，Work Sync 保持原本地任务状态并发布结构化失败或恢复结果；Automation 不创建 Runtime，并从后续本地状态重新计算队列。多个客户端对同一任务的竞争结果仍由服务器决定，但远端一致性责任属于 Work Sync。

Runtime 按 Case State 驱动 Agent turn、结构与授权 Gate、ledger writeback。主页面把当前 gap、Agent 进展、工具执行、Case transition、Gate、ledger 和证据摘要投影为可观察状态；Workbench 把同一 Agent thread 的多个 turn 组合为当前待办的一条消息流。

默认每个生产性 Loop 只发起一次 Codex Agent turn。Runtime 向已加载 `$using-arckit` 的 Agent 提供原始待办意图、当前增量、trusted ledger snapshot receipt、candidate catalog、revision 与执行授权；Agent 结合完整 Project decisions/invariants 与 fresh Case facts 发现并比较候选，选择唯一 Case 和一个 gap，自主发现并使用所需 skills 与工具，只完成该 Gap 的 acceptance claim 及必要证据，最后提交一个绑定 snapshot token、比较轨迹和证据的 Case transition。执行中暴露的新事实只进入 Case delta 与后续候选，不授权同一 turn 改做另一个独立结果。`using-arckit` 约束 Agent 如何从 Case gap 开始并形成 closeout，但不把同一个 Agent 强制拆成互相隔离的 Controller 与 Worker 调用。结构化 Agent 输出或 trusted Ledger claim 出现可修正校验错误时，Runtime 可在同一生产性 Loop 内发起有限 repair turn；repair 不重复实现工作、不形成新的 acceptance claim，也不计入业务 no-progress rounds。

Runtime 不创建固定 Worker、独立复审或其它 Codex thread，也不以固定 definition skill 集合、预测式 `allowed_paths` 或固定 skill 顺序限制 Agent turn；工作区、sandbox、approval policy、外部权限和 ledger transition 校验仍构成确定性安全边界。

Runtime 每次 ledger writeback 后先原样投影 ledger 的 `round_closeout`，再以 receipt 中的 post-commit token 调 manifest 声明的 trusted snapshot entrypoint，从 fresh canonical state 重建当前事实与授权。Runtime 不自行复刻候选、revision 或 fresh-read 判定，writeback 返回的内存 candidate 也不能充当 fresh state。fresh state 不等于 fresh conversation thread：Agent thread 提供语义连续性，canonical state 提供事实权威性；历史中的 selected gap、revision、授权或未接受 claim 不能覆盖 fresh state。

`writeback_required=true` 的 Round 只有在 trusted ledger 返回 `written=true` 后才可采用 ledger-derived handoff、进入完成判断或启动 Git closeout。Agent 输出 Schema 尽可能前置表达 Ledger 的确定性字段组合规则；其余 Runtime validation、Gate block、transition preflight 和 apply 拒绝产生带 issue path、reason 与 repairability 的结构化 rejection。可修正 rejection 在同一持久 thread 上使用 fresh trusted state 和被拒 claim 发起定向 repair，明确 canonical state 尚未写入且不得重复已经完成的实现；repair 使用独立有限预算，成功后继续正常 writeback，预算耗尽或不可修正时才进入 Recovery Center，并展示 rejection 原因而不是未被 ledger 接受的成功 handoff 文案。

Persisted candidate 的稳定身份由 `selected_ref`、Gap id、Case revision、Project revision、selection token 与当前 ready 状态共同确认。Agent 可以用自己的语言表达同一 Gap 的目标和原因；这些描述不要求与 snapshot 逐字一致，也不能替代身份与 freshness 校验。Ledger apply 时重新读取当前 canonical candidate，并以 canonical 内容形成 round 和 closeout；真正的 stale snapshot、错误引用、候选不再 ready 或责任变化仍然拒绝。

每个 Loop 仍只推进一个 Case gap，多个 gap 按 fresh ledger state 串行选择。执行效率不通过合并 gap、并行推进同一待办、总墙钟上限、生产性 Round 上限或长命令 watchdog 获得；长时间编译属于 Agent 执行阶段，由执行事件持续投影直至自然完成或收到显式停止请求。

Runtime 对同一工作区内仍在运行的等价命令保持单一执行实例。后续相同命令观察同一执行状态，不并发启动第二个会修改或编译同一目标的进程。长时间命令的进行中、增量输出和完成状态由执行层持续投影，等待本身不要求 Agent 反复发起模型推理或重复提交命令。

Runtime 和 ledger 均成功收束、Case 已关闭后，系统继续使用当前待办的持久 Codex thread 发起 closeout turn。当前 Agent检查工作区、验证证据和变更范围并完成 Git commit；不创建独立 commit agent。只有 commit 成功或确认无需提交，系统才基于最新服务器版本提交“进行中 → 已完成”。服务器确认完成后，系统清理该 lane 的活动执行并继续领取该 lane 的下一项。

首次执行传给 Agent 的人类输入只有待办正文；远端任务、项目、run 和队列信息作为 Runtime 元数据关联。自动化管理的 run 显式携带自动续轮策略；ledger 写回后，只要 handoff 仍由 Agent 负责、允许 Agent 继续且不需要人类或外部输入，系统就在同一活动 thread 依次投影 closeout、完成 post-commit fresh-read，并以新 snapshot 发起下一 turn。ledger 的策略中立 `manual_bridge` 不会把这种 Agent continuation 降级为人工事项。确定性 ledger 写回表示本轮取得 canonical state 进展并重置无进展恢复计数；安全计数只限制连续没有 ledger 进展的恢复尝试，不是总墙钟、生产性 Round 或长命令上限。自动续轮没有新增人类输入，不构造新的用户消息，也不把 `next_prompt` 或 closeout 中的旧选择伪装成人工输入。

自动化总开关关闭时，系统继续同步和展示，但不领取新任务。暂停队列不停止任何当前活动执行；停止运行必须指定目标 execution，只请求对应 Runtime 在安全停止点收束，远端任务保持进行中并进入该 lane 的恢复状态。

## 切换到交互式 Codex CLI

每个活动执行提供“切换到 Codex CLI”动作。该动作携带目标 `execution_id`，先请求对应 Runtime run 在安全停止点结束；确认该自动执行进程已退出后，Desktop 才在绑定的本地工作区打开用户可见、可输入的终端，并启动交互式 `codex`。切换不启动无界面的 `codex exec`，也不让 Runtime 与 CLI 同时修改同一工作区。

CLI 接管恢复当前待办已持久化的 Codex thread，并从 fresh Project/Case State 继续 state-driven loop；不通过拼接隐藏 transcript 或旧 run envelope 重建上下文。CLI 由用户直接观察、输入和纠正，并与普通 Codex CLI 会话具有相同交互能力。尚未创建 Case 时，CLI 在同一 task thread 中从 fresh Project State 和待办意图开始，由当前 Agent选择或创建 Case。

切换成功后，远端待办继续保持进行中，对应 workspace lane 继续冻结；Desktop 将本地执行入口标记为 `cli_handoff`，但不把该标记写成 Case 语义状态。CLI 关闭本身不表示工作完成，也不直接改变待办状态，其他 workspace lane 不受影响。

Runtime 重新打开、同步或由用户选择恢复自动执行时，必须重新读取 canonical Case State，而不是延续旧 Runtime run：

- Case 仍为 active 且由 Agent 负责时，可以从 fresh Case State 启动新的 Runtime run；在用户尚未交还执行权时，Desktop 保持 CLI 接管，避免并发执行。
- Case 需要 human decision 时，进入人工事项。
- Case 已 closed/resolved 时，恢复同一 task thread，直接进入 Git closeout 与远端完成写回。
- Case 缺失、歧义或无法读取时，进入可解释的恢复状态，不根据旧 run 或 CLI 进程退出自行推断完成。

因此，显式切换、强制退出 Runtime 后由 CLI 接手、Desktop 重启和普通 Runtime 恢复共享同一闭环：执行入口可以更换，完成判断和下一步始终来自 fresh Case State。

重启恢复不以 Work Sync 认证成功为本地对账前置条件。Case 已 closed/resolved 时，系统立即记录 Case 已完成并停止展示“自动执行中”；尚未完成 commit 时恢复同一 task thread 并只执行一次 Git closeout，commit 已完成时进入“Case 已完成，等待 Work 同步”。认证恢复后 Work 只重试完成状态同步，不重新执行已完成的 closeout。

## Runtime 结果与远端写回

服务器任务状态只在 Workshop 确认后改变；Work Sync 负责该确认并发布对应本地状态。Automation 不根据动作已提交、进程退出或界面乐观更新推断结果。

“待处理 → 进行中”动作提交给 Work Sync 后，Automation 只有观察到本地状态变为进行中才启动 Runtime。Work Sync 返回失败且本地状态未变化时 Runtime 不启动；本地状态已为进行中但 Runtime 启动失败时，系统保存启动意图并冻结队列，首要恢复动作是重试启动同一任务。

Runtime 执行失败时，系统保留 run、消息、结构化 activity 和 ledger 证据，并根据可恢复性提供重试、补充说明并继续、人工介入或标记阻塞。系统不依赖完整原始 delta transcript 恢复控制状态，不自动取消任务，也不静默回退到待处理。

“补充说明并继续”只在恢复项绑定当前活动任务、待办级 session 和持久 Agent thread 时出现。用户必须输入非空说明；系统把原文作为新的用户消息发送给同一 Agent thread，以 fresh canonical state 启动新的 Runtime Run，并关联来源 recovery 与失败 Run 证据。新 Run 建立后说明保存在同一待办 transcript、恢复项移除并打开对话审查；启动失败时保留原恢复项。说明是新的 operator input，不会直接覆盖 canonical Case State，Agent 必须通过正常 transition 接受其中可成立的事实。

Git closeout turn 启动或执行失败时，本地任务状态保持进行中，系统保留持久 thread、已关闭 Case 与 run 证据并冻结下一任务；恢复动作在同一 thread 重试 closeout，不重新执行已关闭 Case。commit 成功后 Automation 向 Work Sync 提交“进行中 → 已完成”；Work 未发布本地已完成状态时，系统保留本地完成证据并冻结下一任务，直到 Work Sync 完成服务器同步、用户选择受控恢复动作或任务被明确转为阻塞。

认证失效属于 Work Sync 远端同步不可用，不改变本地 Case 或 commit 检查点。此时活动任务展示“Case 已完成，等待 Work 同步”，责任方指向 Work Sync；恢复认证后 Work 从待提交动作继续，Automation 不自行重试 Workshop 请求。

## 人工介入

Runtime 只有在缺少授权、稳定事实、产品判断或其他必须由人类提供的输入时创建人工事项。系统在 Command Center、任务列表和桌面通知中提示人工事项，但不自动打开 Intervention Workbench 或 Personal / Chat。

只有 `next_responsibility=human`、`human_decision_required=true` 或等价的 user-decision handoff 才属于人工事项。Agent 可继续的 handoff、自动续轮失败和服务器/本地状态差异分别属于 Agent continuation 或 Recovery Center，不得仅因需要 Runtime 操作而标记为人工决策。

用户进入 Intervention Workbench 后可以查看当前任务、人工请求、已加载事实、统一执行消息、证据和影响范围。计划、工具调用、验证和 ledger 结果作为来源明确的消息摘要进入同一时间线。人工处理模式提供输入能力；只读审查模式不提供输入能力。

中间 Conversation Surface 只显示与 Chat 相同的对话型消息。candidate、gap、round、ledger、验证与执行总览在左右面板保持完整可见；从面板选择某个 gap 可以定位其关联 Agent 消息，但不会改变或复制消息内容。

Workbench 展示的对话只属于当前待办会话。每条消息保留 task、run 和 continuation 链归属；无法确认归属的历史项目消息不进入当前待办 transcript。

用户提交处理说明后，输入原文作为 steer 或 fresh continuation 的唯一人类内容，并被锁定直到 Controller 接受或返回可解释错误。Runtime 不在输入前后拼接任务标识、恢复命令或 Case 工作流说明。Controller 接受后，Runtime 恢复当前任务，界面返回自动化主页面。

用户未提交而离开 Workbench 时，任务保持等待人工，对应 workspace lane 继续冻结。只读审查不改变 Runtime；用户必须显式选择介入当前 execution 后才能提交控制输入，其他 lane 继续运行。

人工等待可以保持远端任务为进行中。只有 Runtime 无法继续或恢复依赖外部条件时，用户或服务器规则才将任务更新为已阻塞。

## 人工状态处置

Task Browser 按当前项目范围和七种任务状态展示完整任务列表。项目范围和状态筛选只影响观察，不改变自动化策略。

待评审任务可以在权限与服务器版本均有效时确认为待处理。已完成任务可以提出验收问题，并在没有未解决验收问题且证据充分时标记为已验收。已取消任务的业务事实保持只读；已完成任务详情展示全部关联验收问题及进展并提供问题 Composer；已验收任务只显示验收通过，不再接受新问题。验收问题的后续状态只写入独立问题项和其新 Case。

已阻塞任务必须展示阻塞原因、责任方和恢复条件。恢复动作根据服务器规则返回待处理或恢复进行中，不允许界面自行推断恢复目标。

所有人工状态操作先校验权限和服务器版本，再条件式提交。版本冲突时，系统不覆盖服务器新状态，而是刷新任务并解释冲突。

## 恢复与一致性

应用重启时按 workspace lane 恢复同一用户的进行中任务及关联 run。每个 lane 存在唯一可恢复任务时继续该任务；不同 lane 各有一个进行中任务属于正常并行状态。单一 lane 存在多个进行中任务、多个任务争用同一 thread/workspace 或无法建立唯一归属时，只冻结该 lane 并要求用户选择恢复目标。旧 Store 的单个 `active_task` 确定性迁移为一个 lane 内的活动执行，不丢失 session、thread、Run、Case 或收尾检查点。

Recovery Center 统一承接 Work Sync 领取冲突、Runtime 启动失败、安全停止、活动执行外部变化、lane 内多个进行中任务、任务项目归属异常、权限异常和 Work Sync 会话失效。恢复项明确标记 `lane` 或 `global` 冻结范围；对已建立持久 Agent thread 的 Runtime 失败，用户可直接补充说明并在同一对话继续，不必先把任务标记为阻塞。

每个恢复状态展示服务器事实、本地事实、差异、已保留证据、当前操作责任和允许动作。Recovery Center 表示 Runtime 操作或一致性恢复，不等同于 Intervention Workbench 的人工语义判断。恢复动作完成后，系统重新同步服务器并从原观察范围返回 Command Center 或 Task Browser。

状态不确定时系统优先保持每个 workspace lane 的单任务边界和证据完整性，不通过同 lane 继续领取来掩盖异常。

## 主页面职责

Command Center 首屏回答当前项目范围、系统是否健康、有哪些并行活动执行、各 lane 的下一项是什么和是否需要用户处理。

主页面展示项目列表、七种任务状态入口、同步状态、Runtime 健康、自动化开关、人工事项、活动执行列表、普通待办队列、验收问题队列、项目源摘要和最近完成结果。两个队列拥有独立数量、ready/blocked/running 分布和队首摘要，不合并成一个“待处理”数字；活动执行按 workspace lane 分组并显示全局并发占用。

七种任务状态是 Task Browser 的导航入口，用于浏览和人工处置；它们不在主页面直接替换当前运行与队列态势。项目选择只改变观察范围。

任务执行对话不作为 Automation 常驻区域。当前运行、历史完成项和人工事项提供“查看对话”或“处理”入口，按需打开 Intervention Workbench；Personal / Chat 是独立自由对话页签，不承接任务执行。

## Token 用量与上下文治理

Runtime 按 task thread、Run、round 和 turn 归因 Codex 用量。Agent Loop、验证、修复和 Git closeout 的 input、cached input、uncached input、output、reasoning output、上下文窗口占用和增量用量均归入同一 thread；累计总量与当前上下文占用分开表达。

界面同时展示逻辑总 token、缓存输入、非缓存输入和输出，不把包含大量 cached input 的逻辑总量直接表述为非缓存消耗。历史完成 Run 保留相同口径，支持与同类任务、同一 Case 前序轮次和直接 Codex CLI 执行建立可比基线。

Token 治理以观察和减少无效工作为目标。软异常包括上下文持续增长但 Case State 无进展、等待命令期间继续产生模型调用、相同命令重复启动、独立委派的语义目标变化后仍继承无关历史，以及 Agent transition 因可确定性结构问题失效。

软异常生成可解释提示，说明发生位置、关联 lane、增量用量和建议检查项，但不自动终止 Run、不拒绝合法 Case transition，也不把 token 总量或总轮数作为任务完成门禁。no-progress guard 只承担连续无 ledger 进展的恢复保护，不作为 token 配额或生产性 Round 上限。

Runtime 优先通过待办边界控制上下文：不同待办隔离 thread，同一待办从首个 Agent turn 到 Git closeout 始终使用一个持久 thread。Runtime 不从任务关键词、facet、skill 或路径派生新的 Agent 身份或 thread。

每个默认 Agent turn 都携带从 fresh Project/Case State 派生的紧凑上下文摘要，包括 revisions、Project software decisions/invariants/advancement、全部 active Case 选择事实、facts、state impacts、open/blocked/ready dynamic gaps、最近已接受变化、未解决问题和稳定事实引用。Runtime 只接受当前 canonical state 协议；未更新的项目在启动 Loop 前失败并给出协议不匹配错误。当前 operator input、canonical facts 与授权始终覆盖 thread 中的历史讨论；raw transcript、完整 Runtime envelope 和未接受推理不进入上下文摘要。

同一默认 Agent turn 内完成 Case/gap 选择、必要工作和 transition closeout，不通过 planning/review thread 分拆制造额外上下文边界。Runtime 在首个 turn 前持久化 Codex thread id；进程重启后恢复该 thread，并用 ledger、稳定事实源和 fresh digest 校正恢复后的当前语义上下文。

每个 gap transition 成功写回后，Runtime 用最新请求 input tokens 与模型 context window 计算占用率。占用率达到 80% 时，系统在同一 thread 主动压缩上下文，等待压缩完成后再继续下一 gap；压缩不终止有效工作、不改变 ledger，也不创建新 thread。同一 thread 复用时如果目标、授权或上下文引用发生异常漂移，系统记录非阻断软提示，供后续检查 fresh digest 与 Agent transition。

## 权限与安全边界

Renderer 与 Automation 不持有任务服务器凭证，也不直接请求任意远端 API。认证、项目同步、任务同步和状态更新由主进程 Work Sync 执行。

本地工作区绑定必须指向明确项目路径。未绑定工作区、路径不可用或项目未参与自动化时，相关任务可以浏览，但不具备自动执行资格。

停止、重试、阻塞、取消、验收和恢复多个进行中任务均为显式操作。系统在执行前展示对远端状态、当前 Runtime 和后续队列的影响。

## 验收标准

- 未登录用户启动应用时首先看到独立登录页面，并可以使用邮箱或手机号验证码登录；登录成功后无需手填 token 即可进入 Command Center 并同步，退出后远端身份与快照清空、本地项目和历史保留，并返回登录页面。
- access token 临近过期时会自动刷新；业务请求首次返回未认证时最多刷新并重试一次；最近七天内存在有效登录活动时，应用启动会通过服务端轮换 refresh token 续期。临时网络或服务错误保留可恢复会话，只有连续超过七天无有效登录活动、refresh token 缺失或过期、或服务端明确拒绝/撤销凭据时，系统才停止远端写入并要求重新登录。
- 登录用户能够看到可访问项目，以及其中执行人是当前用户的七种状态待办和对应数量；创建人是当前用户但执行人不是当前用户、未分配和分配给其他用户的待办均不出现。
- 项目选择和任务状态筛选不会隐式改变自动化参与状态或队列顺序。
- 系统只从符合资格的待处理任务中确定性选择下一项；同一本地工作区同一时刻最多运行一项任务，不同本地工作区最多三个并行活动执行。
- 已完成待办能够提出非空验收问题；系统持久化独立问题项并保持来源待办为 completed，不改写旧 Run、commit、完成记录或 closed Case。已验收待办不提供问题入口。
- 每个验收问题项具有稳定标识、独立状态、进展、Run 和新 Case，并复用来源待办的 transcript session 与持久 Agent thread；问题、解决方案和验证可从该 Case 恢复。
- 自动化总览分别展示普通待办队列与验收问题队列；已完成任务的详情面板展示全部关联问题项及其当前进展，已验收任务显示验收通过且不显示 Composer。
- 两条队列分别排序并在每个 workspace lane 内通过显式执行租约确定性仲裁；等待中的验收问题不会进入待办队列或改变来源待办状态，也不会抢占当前执行。
- 存在 queued、running、awaiting_human 或 blocked 验收问题时，待办不能标记为已验收；全部问题 resolved 或 cancelled 后才允许进入 accepted。
- 领取冲突不会启动重复 Runtime，完成写回未确认时同一 lane 不会领取下一任务，其他健康 lane 可以继续。
- 待处理任务在服务器确认进行中后启动 Runtime，在 Runtime 与 ledger 收束且服务器确认后变为已完成。
- Runtime 需要人工输入时，主页面给出明确提示但不自动打开 Intervention Workbench 或 Personal / Chat；用户在对应 Workbench 提交后能够恢复同一任务。
- Command Center 队列、当前运行、Intervention Workbench 顶部、确认对话和 session/CLI 标签使用同一个 64-grapheme 展示标题投影；Workbench 顶部保持单行且不被完整正文撑高，完整正文只在任务详情或上下文正文区域展示一次并保留换行。
- Runtime 失败且已有持久 Agent thread 时，Recovery Center 可以直接提交非空用户说明并继续；说明在同一待办对话中可见，且不会因恢复动作创建新 thread。
- 当前任务可以安全切换到用户可见且可输入的交互式 Codex CLI；CLI 从同一 Case State 和待办意图继续，且不会与原 Runtime run 并发执行。
- CLI 接管期间关闭终端不会被视为任务完成；Runtime 返回后从 fresh Case State 判断继续自动执行、等待人工或在同一 task thread 进入 commit 与远端完成写回。
- 用户能够以只读方式审查当前或历史对话，并通过显式操作进入可输入的人工介入模式。
- 每个自动待办拥有独立 transcript；当前或历史待办页面不会出现同项目其他待办的消息，不同待办也不会复用 Codex thread。
- 同一待办中的 Agent、工具摘要和人工输入组成一条按时间排序的消息流；界面不要求用户理解 turn 层级，也不把原始 JSON 或 delta 当作消息展示。
- Workbench 的消息列表完全复用 Chat Conversation Surface；左右栏、会话标题和底部输入区不会随消息数量增长而离开视口，中间消息可以独立上下滚动，用户上滚后不会被新消息强制拉回底部。
- Automation 专属的 Round/gap/writeback/handoff、完整执行时间、累计 gap 轮数和逐 gap 工作全貌位于左右面板；消息列表保留 Chat 同样支持的 Agent、用户、reasoning、工具和权限层级。
- Workbench 覆盖同一 task session 的全部 Runtime runs：进行中时持续显示首次开始至当前的墙钟时间，终态后固定最终时长；累计轮数只统计实际启动的 gap rounds；每个 gap 显示目标、实际工作摘要、结果和 accepted closeout 或未收束状态。
- 高频 agent、reasoning 和命令输出 delta 只更新内存中的当前消息；持久化和 Renderer 更新以语义消息或有界合并为单位，长运行不会按 delta 数量线性扩大日志和 DOM。
- 自动化测试覆盖展示标题的空白折叠、63/64/65 grapheme 边界、组合字符与 emoji 不被拆分、单字符省略号、历史 session 标签快照、完整 operator input 保真，以及 Workbench 顶部单行高度和任务详情不重复。
- 每个 Agent turn 都携带可从 fresh Project/Case State 重建的紧凑上下文摘要；进程重启同时恢复持久 thread 并以 canonical facts 校正历史。
- 同一自动待办从执行、验证、修复到 Git commit 只使用一个持久 Codex thread，并按 gap 发起多个 turn；进程恢复不更换 thread。
- 默认一个 Agent turn 能够依据 bounded canonical facts 完成 Case/gap 选择、必要 skill/tool 工作、自我审查和结构化 transition；Runtime 不要求固定 Plan/Worker/Review 三段调用。
- 人工直接使用 Codex 与 Runtime 自动桥接能够从相同 facts 得到相同 Case transition 和 handoff；两者都保留 Codex 原生 skill 发现与工作区执行能力。
- 每个 Loop 只推进一个 Case gap，连续 gap 从 fresh ledger state 串行选择；有效进展不因总墙钟、生产性 Round 数或长时间编译达到固定值而终止。
- Project software invariants 与 fresh Case facts 在每轮驱动动态候选发现；Runtime 不预生成事实域 checklist，也不因某类判断曾经完成而阻止其被后续 facts 重新打开。
- 同一工作区和目标的等价长时间命令只有一个活动执行实例；等待期间通过执行事件更新状态，不通过重复模型调用或重复命令轮询进度。
- 当前与历史 Run 能够按 task thread 展示逻辑总 token、缓存输入、非缓存输入、输出、上下文占用和 round/turn 增量；达到 80% 的压缩事件可观察。
- Token 软异常能够指出无状态进展增长、等待期模型调用、重复命令、授权范围漂移和跨待办 thread 历史等来源，但不会因总 token 或总轮数达到固定值而自动终止有效任务。
- 项目同步失败、单项目任务同步失败、Runtime 启动失败、多个进行中任务和活动任务外部变化均有可解释且保持证据的恢复路径。
- Work Sync 通过持久事件游标及时唤醒对应项目对账；应用断线期间的事件能够在重连后按序补取、去重并恢复连续性，游标过期时执行项目级全量恢复。
- Work Sync 的旧 Workshop 兼容连接使用无 ID 通知触发项目对账；连接与重连不读写游标，重连后直接刷新当前态，不要求补历史通知。
- Work Sync 不执行每分钟全量扫描；每十五分钟、应用启动和休眠/网络恢复时执行事实对账，旧服务重连后执行项目刷新，页面提供进入同一 Work Sync 边界的“立即同步”。
- 实时事件、重连补取、后台对账和应用启动恢复都不能解除 `awaiting_human`；未提交人工介入输入时，同一任务持续等待且不会启动下一任务。
- 应用重启能够分别恢复每个 workspace lane 的唯一活动任务；不同 lane 的多个进行中任务正常恢复，同一 lane 无法确定唯一任务时只冻结该 lane 并要求人工处置。
- Work Sync 认证失效时重启 Desktop，closed/resolved Case 仍被本地识别；界面不显示 Case 或 Runtime 仍在执行。
- Case、commit 和远端写回检查点跨重启保持单调；已完成 commit 不会因登录失效或再次同步而重复执行。
- Renderer 与 Automation 不暴露或使用任务服务器凭证；所有远端状态变更由 Work Sync 同步，并以其发布的本地确认状态作为 Automation 输入。
