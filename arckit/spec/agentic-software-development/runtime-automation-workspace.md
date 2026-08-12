# Runtime 待办自动化工作区

## 功能定位

Runtime Desktop 是以项目待办为驱动的自动化执行工作区。用户在主页面观察当前用户可访问的项目、项目产生的待办、跨项目执行队列、活动 Runtime、人工事项与完成证据；Chat 仅在人工审查执行过程或 Runtime 明确需要人工输入时按需出现。

该工作区承担任务服务器与本地 Arckit Runtime 之间的控制面职责。任务服务器拥有项目、任务归属和任务生命周期事实；Runtime 拥有本地工作区绑定、自动化参与状态、单任务执行状态、Agent turn 生命周期、事件和 ledger 证据。

Runtime 替代的是人类在 Codex 中持续读取最新状态、发送下一轮输入、观察执行、处理恢复、调用 ledger、提交代码和回写远端任务的自动化劳动，不替代 Codex Agent 对任务的语义理解、skill 选择、仓库调查、实现、验证与自我审查能力。人工直接使用 `$using-arckit` 与 Runtime 自动桥接使用同一个 Agent Loop 语义；差异只在触发、授权、事件存储、自动续轮和外部生命周期管理。

默认执行路径把一个待办视为一个连贯的 Codex 工作单元。Runtime 为待办持久化唯一 Codex thread，并在每次 ledger 写回后向该 thread 发起新的 turn。每个 turn 从 fresh canonical Project/Case State 选择并完成一个 gap，Agent 在 turn 内自行使用必要工具与 skills，最后返回一个 Case control、Case transition 或需要人工/外部介入的 handoff。Runtime 不提供 Controller planning、Worker dispatch 或 Controller review 分段路径。

## 核心对象

### 当前用户

当前用户由任务服务器认证会话确定。工作区展示当前用户可访问的项目，但任务范围只包含执行人是当前用户的待办；仅由当前用户创建、未分配或分配给其他用户的待办不展示、不计数且不进入自动化。认证失效时，系统保留最近一次成功同步的只读快照，但停止领取任务和提交状态变更。

### Workshop 账号与认证会话

Runtime Desktop 使用 Workshop 的 NebulaAuth 验证码登录。用户可以选择邮箱或手机号，先请求登录验证码，再提交目标地址、验证码和验证码类型完成登录。发送验证码和登录均展示独立进行中状态与服务端错误；验证码发送成功后进入 60 秒重发冷却。

应用启动时先恢复认证状态。未登录用户默认进入独立登录页面，Automation Workspace 在认证成功前不提供可交互入口；已认证或会话可刷新时直接进入 Command Center。登录页面不提供关闭、返回或跳过动作，登录成功后才进入工作区并开始同步。

应用默认连接正式 Workshop 服务地址；服务根地址与业务服务名属于高级连接设置，不要求普通用户手工填写。认证请求固定发送到认证服务的公开接口，项目与待办请求固定发送到 Workshop 业务服务的用户接口。Renderer 只能调用受限的登录、退出与同步能力，不能指定任意服务路径或读取原始 token。

登录成功后，主进程持久化 access token、refresh token、两类 token 的过期时间、最近一次有效登录活动时间和可展示的账号标识。Renderer 只接收登录状态、账号摘要和过期状态，不接收 access token、refresh token 或精确活动时间。

成功的验证码登录、应用启动时成功恢复远端会话和成功的 token 刷新构成有效登录活动；纯本地打开窗口、普通页面浏览、失败请求和离线操作不构成活动。会话采用滚动七天有效期：最近七天内存在有效登录活动时，应用启动恢复会主动通过服务端 refresh token 轮换续期，即使 access token 尚未临近过期；连续超过七天没有有效登录活动时才要求重新登录。主进程不在本地伪造或延长服务端凭据的有效期。

access token 在到期前五分钟刷新；业务请求收到未认证响应时，主进程最多刷新并重试一次。同一时刻的刷新请求合并为单次远端刷新。临时网络错误、服务不可用和其他没有证明凭据失效的刷新失败只暂停当前同步并保留可恢复会话；refresh token 缺失、已过期、被服务端明确拒绝或最近一次有效登录活动已超过七天时，会话进入已失效状态，自动领取与所有远端写操作停止，界面引导用户重新登录。

登录成功后立即同步当前用户、项目和待办。退出登录清除远端身份、token、远端项目与待办快照及依赖该身份的活动自动化状态；本地项目、本地工作区绑定、Runtime 历史和本地设置继续保留。

### 项目

项目是待办的一级来源。每个项目包含远端项目标识、展示信息、任务源状态、本地工作区绑定和自动化参与状态。

“所有项目”是聚合观察范围，不是独立项目。选择项目只改变指标、任务列表和历史的展示范围，不隐式开启、暂停或重排自动化。

### 待办

待办始终归属于一个有效项目，并保留服务器任务标识、执行人标识、版本、状态、优先级和进入当前状态的时间。执行人不是当前用户、缺少有效项目归属、无访问权限或无法确认服务器版本的待办不进入工作区快照与自动执行队列。

### 自动化队列

自动化队列由所有参与自动化且具备本地工作区绑定的项目产生。队列只包含执行人是当前用户、服务器状态为待处理且当前版本已确认的任务。

队列按服务器优先级从高到低、进入待处理状态的时间从早到晚、项目标识和任务标识的稳定顺序排列。同步变化只影响下一次领取，不改变当前活动任务。

### 活动任务

工作区在任一时刻最多拥有一个活动任务。活动任务关联一个远端任务、一个项目、一个本地工作区和一个 canonical Case；Runtime run 或交互式 Codex CLI 只是该 Case 当前的执行入口。远端状态不确定、存在多个进行中任务、人工 Gate 或完成写回失败时，系统不领取下一项。

活动任务分别持久化 canonical Case、git commit 和远端完成写回三个检查点。Case 已关闭只表示研发语义完成；commit 已完成表示本地交付完成；只有任务服务器确认 completed 后，远端生命周期才完成。三个检查点不得压缩成单一“正在执行”状态，也不得因应用重启或任务源暂时不可用而回退。

### 待办执行会话

每个远端待办拥有独立的 Desktop 执行会话和唯一持久 Codex thread。该会话聚合待办正文、首次 Runtime run、同一待办的自动续轮、人工输入、恢复 run、Git closeout 结果和最终完成摘要，不包含同项目其他待办的消息或执行摘要。

同一待办的 fresh continuation 继续写入该待办会话。不中断的自动执行默认复用该待办的同一 Codex thread，通过多个 turn 保持与人类直接在单个 Codex 对话中工作的连续性；当前 operator input、fresh Case State、revision 和授权始终覆盖 thread 中冲突的旧事实。不同待办不得共享 Codex thread。进程退出、显式接力或恢复时允许从 fresh canonical state 建立新 thread，但不能把旧 transcript 当作恢复所必需的事实源。

历史完成项按待办会话只读打开。当前人工介入只加载活动待办的会话；项目级默认 Chat 或其他人工对话不作为自动待办的隐式消息容器。

### 执行消息流

待办执行会话提供一条按发生时间排序的消息流。消息流的主要内容是 state-driven loop 的可理解状态和 Agent 自然语言输出；人工输入保持明确区分，工具活动作为次级单行记录。内部 Codex turn 和 round 只作为归因元数据，不把消息拆成多个面向用户的对话。

消息流只包含用户可以理解和采取行动的语义信息。每轮开始先展示 snapshot 中的 persisted candidate catalog；Agent result 到达后原样展示其 persisted/fresh comparison trace 与 selected gap，不由 Runtime 重新排序。transition 写回后展示 ledger 生成的独立 `round_closeout`，再展示带 post-commit token 证明的 `fresh_read`。阶段变化、handoff 和 Case 收束继续以紧凑状态提示表达；Agent 使用目标、进展、判断和证据表达工作内容。每个工具调用只呈现一行状态、动作、目标和可选结果摘要；读取操作只显示文件路径，命令操作只显示命令意图与成功、失败或进行中状态。文件正文、完整 diff、stdout/stderr、原始工具参数、JSON envelope、逐 token 文本 delta和逐字符 reasoning delta不作为消息正文持久化或渲染。

流式内容更新当前消息；相同消息的增量不会持续创建新记录或 DOM 节点。用于 Token、耗时、错误和恢复判断的结构化投影继续保留在 Run activity 与证据 Inspector 中，不要求用户阅读原始事件日志。

Workbench 保持窗口壳、左右信息栏和底部输入区稳定，只有中间消息列表垂直滚动。用户位于列表底部时新消息自动跟随；用户向上审查历史后保持阅读位置，并提供返回最新消息的明确动作。只读模式没有输入区，但使用相同的固定壳层和消息滚动边界。

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

## 项目与任务同步

应用启动时先恢复本地活动任务、Run 和 canonical Case，再恢复任务源认证并同步远端事实。任务源未登录、认证失效或不可达时，本地 Case 对账仍然执行；远端 API 调用、远端状态写回和新任务领取保持停止。会话仍可刷新时进入 Command Center，并同步当前用户、当前用户项目、本地工作区绑定、项目自动化参与状态和各项目待办。未登录时不请求用户级 Workshop API，也不自动领取任务，但已关闭 Case 和本地收尾检查点仍以只读状态呈现。

系统先拉取当前用户和无组织项目，再拉取当前用户可访问的组织及各组织项目；项目按服务器标识去重后，从项目成员中的当前用户得到执行人标识，再以有界并发按项目和执行人拉取七种状态的任务。响应结果再次校验执行人标识，项目级状态计数只由通过校验的任务快照派生。无法确认当前用户在某项目中的执行人标识时，该项目不展示任何待办且不参与领取。

项目列表拉取失败时，系统无法确认用户的完整执行范围，因此冻结所有新任务领取。单项目任务拉取失败时，系统排除该项目的新任务领取，其他已确认项目仍可参与队列。

后台同步保留现有内容，并展示最近成功同步时间。同步失败不清空已有列表，也不把本地快照视为服务器最新事实。

活动 Runtime 期间持续核对远端任务版本和执行人。任务被改派给其他用户、外部取消、阻塞、转移项目或撤销权限时，系统请求 Runtime 在安全停止点收束，并在事实重新一致前冻结队列；领取和完成写回前也重新确认执行人仍是当前用户。

## 自动领取与串行执行

自动化开启、没有未收束活动任务且服务器事实可确认时，系统从队列首项开始尝试领取任务。

领取动作基于最新服务器版本条件式提交“待处理 → 进行中”。服务器确认成功后，系统持久化任务、项目、本地工作区和待启动 run 的关联，再启动 Runtime。

领取发生版本冲突时，系统不创建本地 Runtime，刷新冲突任务并继续选择下一项。多个客户端对同一任务的竞争结果以服务器条件式更新为准。

Runtime 按 Case State 驱动 Agent turn、结构与授权 Gate、ledger writeback。主页面把当前 gap、Agent 进展、工具执行、Case transition、Gate、ledger 和证据摘要投影为可观察状态；Workbench 把同一 Agent thread 的多个 turn 组合为当前待办的一条消息流。

默认每个 Loop 只发起一次 Codex Agent turn。Runtime 向已加载 `$using-arckit` 的 Agent 提供原始待办意图、当前增量、trusted ledger snapshot receipt、candidate catalog、revision 与执行授权；Agent 结合完整 Project decisions/invariants 与 fresh Case facts 发现并比较候选，选择唯一 Case 和一个 gap，自主发现并使用所需 skills 与工具，只完成该 Gap 的 acceptance claim 及必要证据，最后提交一个绑定 snapshot token、比较轨迹和证据的 Case transition。执行中暴露的新事实只进入 Case delta 与后续候选，不授权同一 turn 改做另一个独立结果。`using-arckit` 约束 Agent 如何从 Case gap 开始并形成 closeout，但不把同一个 Agent 强制拆成互相隔离的 Controller 与 Worker 调用。

Runtime 不创建固定 Worker、独立复审或其它 Codex thread，也不以固定 definition skill 集合、预测式 `allowed_paths` 或固定 skill 顺序限制 Agent turn；工作区、sandbox、approval policy、外部权限和 ledger transition 校验仍构成确定性安全边界。

Runtime 每次 ledger writeback 后先原样投影 ledger 的 `round_closeout`，再以 receipt 中的 post-commit token 调 manifest 声明的 trusted snapshot entrypoint，从 fresh canonical state 重建当前事实与授权。Runtime 不自行复刻候选、revision 或 fresh-read 判定，writeback 返回的内存 candidate 也不能充当 fresh state。fresh state 不等于 fresh conversation thread：Agent thread 提供语义连续性，canonical state 提供事实权威性；历史中的 selected gap、revision、授权或未接受 claim 不能覆盖 fresh state。

`writeback_required=true` 的 Round 只有在 trusted ledger 返回 `written=true` 后才可采用 ledger-derived handoff、进入完成判断或启动 Git closeout。Gate block、transition preflight 拒绝和 apply 拒绝都产生带具体原因的 Agent-recoverable rejection；Runtime 在同一持久 thread 上从 fresh state 重试，达到无进展上限时进入 Recovery Center，并展示 rejection 原因而不是未被 ledger 接受的成功 handoff 文案。

Persisted candidate 的稳定身份由 `selected_ref`、Gap id、Case revision、Project revision、selection token 与当前 ready 状态共同确认。Agent 可以用自己的语言表达同一 Gap 的目标和原因；这些描述不要求与 snapshot 逐字一致，也不能替代身份与 freshness 校验。Ledger apply 时重新读取当前 canonical candidate，并以 canonical 内容形成 round 和 closeout；真正的 stale snapshot、错误引用、候选不再 ready 或责任变化仍然拒绝。

每个 Loop 仍只推进一个 Case gap，多个 gap 按 fresh ledger state 串行选择。执行效率不通过合并 gap、并行推进同一待办、总墙钟上限、生产性 Round 上限或长命令 watchdog 获得；长时间编译属于 Agent 执行阶段，由执行事件持续投影直至自然完成或收到显式停止请求。

Runtime 对同一工作区内仍在运行的等价命令保持单一执行实例。后续相同命令观察同一执行状态，不并发启动第二个会修改或编译同一目标的进程。长时间命令的进行中、增量输出和完成状态由执行层持续投影，等待本身不要求 Agent 反复发起模型推理或重复提交命令。

Runtime 和 ledger 均成功收束、Case 已关闭后，系统继续使用当前待办的持久 Codex thread 发起 closeout turn。当前 Agent检查工作区、验证证据和变更范围并完成 Git commit；不创建独立 commit agent。只有 commit 成功或确认无需提交，系统才基于最新服务器版本提交“进行中 → 已完成”。服务器确认完成后，系统清理活动任务并继续领取下一项。

首次执行传给 Agent 的人类输入只有待办正文；远端任务、项目、run 和队列信息作为 Runtime 元数据关联。自动化管理的 run 显式携带自动续轮策略；ledger 写回后，只要 handoff 仍由 Agent 负责、允许 Agent 继续且不需要人类或外部输入，系统就在同一活动 thread 依次投影 closeout、完成 post-commit fresh-read，并以新 snapshot 发起下一 turn。ledger 的策略中立 `manual_bridge` 不会把这种 Agent continuation 降级为人工事项。确定性 ledger 写回表示本轮取得 canonical state 进展并重置无进展恢复计数；安全计数只限制连续没有 ledger 进展的恢复尝试，不是总墙钟、生产性 Round 或长命令上限。自动续轮没有新增人类输入，不构造新的用户消息，也不把 `next_prompt` 或 closeout 中的旧选择伪装成人工输入。

自动化总开关关闭时，系统继续同步和展示，但不领取新任务。暂停队列不停止当前活动任务；停止当前运行请求 Runtime 在安全停止点收束，远端任务保持进行中并进入恢复状态。

## 切换到交互式 Codex CLI

当前活动任务提供“切换到 Codex CLI”动作。该动作先请求当前 Runtime run 在安全停止点结束；确认自动执行进程已退出后，Desktop 才在绑定的本地工作区打开用户可见、可输入的终端，并启动交互式 `codex`。切换不启动无界面的 `codex exec`，也不让 Runtime 与 CLI 同时修改同一工作区。

CLI 接管恢复当前待办已持久化的 Codex thread，并从 fresh Project/Case State 继续 state-driven loop；不通过拼接隐藏 transcript 或旧 run envelope 重建上下文。CLI 由用户直接观察、输入和纠正，并与普通 Codex CLI 会话具有相同交互能力。尚未创建 Case 时，CLI 在同一 task thread 中从 fresh Project State 和待办意图开始，由当前 Agent选择或创建 Case。

切换成功后，远端待办继续保持进行中，串行队列继续冻结；Desktop 将本地执行入口标记为 `cli_handoff`，但不把该标记写成 Case 语义状态。CLI 关闭本身不表示工作完成，也不直接改变待办状态。

Runtime 重新打开、同步或由用户选择恢复自动执行时，必须重新读取 canonical Case State，而不是延续旧 Runtime run：

- Case 仍为 active 且由 Agent 负责时，可以从 fresh Case State 启动新的 Runtime run；在用户尚未交还执行权时，Desktop 保持 CLI 接管，避免并发执行。
- Case 需要 human decision 时，进入人工事项。
- Case 已 closed/resolved 时，恢复同一 task thread，直接进入 Git closeout 与远端完成写回。
- Case 缺失、歧义或无法读取时，进入可解释的恢复状态，不根据旧 run 或 CLI 进程退出自行推断完成。

因此，显式切换、强制退出 Runtime 后由 CLI 接手、Desktop 重启和普通 Runtime 恢复共享同一闭环：执行入口可以更换，完成判断和下一步始终来自 fresh Case State。

重启恢复不以任务源认证成功为本地对账前置条件。Case 已 closed/resolved 时，系统立即记录 Case 已完成并停止展示“自动执行中”；尚未完成 commit 时恢复同一 task thread 并只执行一次 Git closeout，commit 已完成时进入“Case 已完成，等待远端收尾”。认证恢复后系统只重试远端完成写回，不重新执行已完成的 closeout。

## Runtime 结果与远端写回

远端状态只在服务器确认后改变。系统不根据本地请求成功发出、进程退出或界面乐观更新推断远端结果。

“待处理 → 进行中”写回失败时，Runtime 不启动。服务器已确认进行中但 Runtime 启动失败时，任务保持进行中，系统保存启动意图并冻结队列，首要恢复动作是重试启动同一任务。

Runtime 执行失败时，系统保留 run、消息、结构化 activity 和 ledger 证据，并根据可恢复性提供重试、添加反馈并继续、人工介入或标记阻塞。系统不依赖完整原始 delta transcript 恢复控制状态，不自动取消任务，也不静默回退到待处理。

“添加反馈并继续”只在恢复项绑定当前活动任务、待办级 session 和持久 Agent thread 时出现。用户必须输入非空反馈；系统把原文作为新的用户消息发送给同一 Agent thread，以 fresh canonical state 启动新的 Runtime Run，并关联来源 recovery 与失败 Run 证据。新 Run 建立后反馈保存在同一待办 transcript、恢复项移除并打开对话审查；启动失败时保留原恢复项。反馈是新的 operator input，不会直接覆盖 canonical Case State，Agent 必须通过正常 transition 接受其中可成立的事实。

Git closeout turn 启动或执行失败时，远端任务保持进行中，系统保留持久 thread、已关闭 Case 与 run 证据并冻结下一任务；恢复动作在同一 thread 重试 closeout，不重新执行已关闭 Case。commit 成功后的“进行中 → 已完成”写回失败时，系统保留本地完成证据并冻结下一任务，直到服务器确认、用户选择受控恢复动作或任务被明确转为阻塞。

认证失效属于远端写回不可用，不改变本地 Case 或 commit 检查点。此时活动任务展示“Case 已完成，等待远端收尾”，责任方指向 Automation Coordinator 与任务源；恢复认证后的同步从远端写回检查点继续。

## 人工介入

Runtime 只有在缺少授权、稳定事实、产品判断或其他必须由人类提供的输入时创建人工事项。系统在 Command Center、任务列表和桌面通知中提示人工事项，但不自动打开 Chat。

只有 `next_responsibility=human`、`human_decision_required=true` 或等价的 user-decision handoff 才属于人工事项。Agent 可继续的 handoff、自动续轮失败和服务器/本地状态差异分别属于 Agent continuation 或 Recovery Center，不得仅因需要 Runtime 操作而标记为人工决策。

用户进入 Intervention Workbench 后可以查看当前任务、人工请求、已加载事实、统一执行消息、证据和影响范围。计划、工具调用、验证和 ledger 结果作为来源明确的消息摘要进入同一时间线。人工处理模式提供输入能力；只读审查模式不提供输入能力。

Workbench 展示的对话只属于当前待办会话。每条消息保留 task、run 和 continuation 链归属；无法确认归属的历史项目消息不进入当前待办 transcript。

用户提交处理结果后，输入原文作为 steer 或 fresh continuation 的唯一人类内容，并被锁定直到 Controller 接受或返回可解释错误。Runtime 不在输入前后拼接任务标识、恢复命令或 Case 工作流说明。Controller 接受后，Runtime 恢复当前任务，界面返回自动化主页面。

用户未提交而离开 Workbench 时，任务保持等待人工，串行队列继续冻结。只读审查不改变 Runtime；用户必须显式选择介入当前运行后才能提交控制输入。

人工等待可以保持远端任务为进行中。只有 Runtime 无法继续或恢复依赖外部条件时，用户或服务器规则才将任务更新为已阻塞。

## 人工状态处置

Task Browser 按当前项目范围和七种任务状态展示完整任务列表。项目范围和状态筛选只影响观察，不改变自动化策略。

待评审任务可以在权限与服务器版本均有效时确认为待处理。已完成任务可以在审查结果与证据后标记为已验收。终态任务保持只读。

已阻塞任务必须展示阻塞原因、责任方和恢复条件。恢复动作根据服务器规则返回待处理或恢复进行中，不允许界面自行推断恢复目标。

所有人工状态操作先校验权限和服务器版本，再条件式提交。版本冲突时，系统不覆盖服务器新状态，而是刷新任务并解释冲突。

## 恢复与一致性

应用重启时优先恢复同一用户的进行中任务及关联 run。存在唯一可恢复任务时，系统继续该任务；存在多个进行中任务时，系统冻结队列并要求用户选择唯一恢复目标。

Recovery Center 统一承接领取冲突、Runtime 启动失败、安全停止、活动任务外部变化、多个进行中任务、任务项目归属异常、权限异常和任务源会话失效。对已建立持久 Agent thread 的 Runtime 失败，用户可直接补充反馈并在同一对话继续，不必先把任务标记为阻塞。

每个恢复状态展示服务器事实、本地事实、差异、已保留证据、当前操作责任和允许动作。Recovery Center 表示 Runtime 操作或一致性恢复，不等同于 Intervention Workbench 的人工语义判断。恢复动作完成后，系统重新同步服务器并从原观察范围返回 Command Center 或 Task Browser。

状态不确定时系统优先保持单任务边界和证据完整性，不通过继续领取来掩盖异常。

## 主页面职责

Command Center 首屏回答当前项目范围、系统是否健康、正在执行什么、下一项是什么和是否需要用户处理。

主页面展示项目列表、七种任务状态入口、同步状态、Runtime 健康、自动化开关、人工事项、当前运行、下一队列、项目源摘要和最近完成结果。

七种任务状态是 Task Browser 的导航入口，用于浏览和人工处置；它们不在主页面直接替换当前运行与队列态势。项目选择只改变观察范围。

Chat 不作为常驻主导航。当前运行、历史完成项和人工事项提供“查看对话”或“处理”入口，按需打开 Intervention Workbench。

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

Renderer 不持有任务服务器凭证，也不直接请求任意远端 API。认证、项目同步、任务同步和状态更新由主进程任务源服务执行。

本地工作区绑定必须指向明确项目路径。未绑定工作区、路径不可用或项目未参与自动化时，相关任务可以浏览，但不具备自动执行资格。

停止、重试、阻塞、取消、验收和恢复多个进行中任务均为显式操作。系统在执行前展示对远端状态、当前 Runtime 和后续队列的影响。

## 验收标准

- 未登录用户启动应用时首先看到独立登录页面，并可以使用邮箱或手机号验证码登录；登录成功后无需手填 token 即可进入 Command Center 并同步，退出后远端身份与快照清空、本地项目和历史保留，并返回登录页面。
- access token 临近过期时会自动刷新；业务请求首次返回未认证时最多刷新并重试一次；最近七天内存在有效登录活动时，应用启动会通过服务端轮换 refresh token 续期。临时网络或服务错误保留可恢复会话，只有连续超过七天无有效登录活动、refresh token 缺失或过期、或服务端明确拒绝/撤销凭据时，系统才停止远端写入并要求重新登录。
- 登录用户能够看到可访问项目，以及其中执行人是当前用户的七种状态待办和对应数量；创建人是当前用户但执行人不是当前用户、未分配和分配给其他用户的待办均不出现。
- 项目选择和任务状态筛选不会隐式改变自动化参与状态或队列顺序。
- 系统只从符合资格的待处理任务中确定性选择下一项，并且同一时刻最多运行一项任务。
- 领取冲突不会启动重复 Runtime，完成写回未确认时不会领取下一任务。
- 待处理任务在服务器确认进行中后启动 Runtime，在 Runtime 与 ledger 收束且服务器确认后变为已完成。
- Runtime 需要人工输入时，主页面给出明确提示但不自动打开 Chat；用户提交后能够恢复同一任务。
- Runtime 失败且已有持久 Agent thread 时，Recovery Center 可以直接提交非空用户反馈并继续；反馈在同一待办对话中可见，且不会因恢复动作创建新 thread。
- 当前任务可以安全切换到用户可见且可输入的交互式 Codex CLI；CLI 从同一 Case State 和待办意图继续，且不会与原 Runtime run 并发执行。
- CLI 接管期间关闭终端不会被视为任务完成；Runtime 返回后从 fresh Case State 判断继续自动执行、等待人工或在同一 task thread 进入 commit 与远端完成写回。
- 用户能够以只读方式审查当前或历史对话，并通过显式操作进入可输入的人工介入模式。
- 每个自动待办拥有独立 transcript；当前或历史待办页面不会出现同项目其他待办的消息，不同待办也不会复用 Codex thread。
- 同一待办中的 Runtime、Agent、工具摘要和人工输入组成一条按时间排序的消息流；界面不要求用户理解 turn 层级，也不把原始 JSON 或 delta 当作消息展示。
- Workbench 的左右栏、会话标题和底部输入区不会随消息数量增长而离开视口；中间消息列表可以独立上下滚动，用户上滚后不会被新消息强制拉回底部。
- Round/gap/writeback/handoff 等 Loop 状态和 Agent 输出构成消息流的主要信息层级；每个工具调用只占一行，读取文件、执行命令、编辑和验证均不把原始内容或连续输出铺进消息正文。
- 高频 agent、reasoning 和命令输出 delta 只更新内存中的当前消息；持久化和 Renderer 更新以语义消息或有界合并为单位，长运行不会按 delta 数量线性扩大日志和 DOM。
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
- 应用重启能够恢复唯一活动任务；无法确定唯一任务时冻结队列并要求人工处置。
- 任务源认证失效时重启 Desktop，closed/resolved Case 仍被本地识别；界面不显示 Case 或 Runtime 仍在执行。
- Case、commit 和远端写回检查点跨重启保持单调；已完成 commit 不会因登录失效或再次同步而重复执行。
- Renderer 不暴露任务服务器凭证，所有远端状态变更均以服务器确认结果为准。
