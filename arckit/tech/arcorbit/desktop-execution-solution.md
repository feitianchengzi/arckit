# ArcOrbit Desktop Codex 会话、待办执行与用量可观测性方案

## 定位

Desktop Execution Plane 负责承载自由 Chat 与受监督待办执行共用的 Codex transport、持久 thread、消息投影和安全控制。Automation 把远端待办绑定到可恢复的本地执行会话，并把 Runtime 过程投影为可审查的 transcript、耗时与 Token 用量；Chat 在独立 session 中直接运行自由 Codex turn。共享 transport 不判断 Case 语义，不以固定 Token 总量或总轮次终止研发事项；Runtime 的停止与续接仍由 handoff、状态进展、人工决策和安全控制决定。

## 待办执行会话

Automation Store 为活动任务与最近完成项保存 `session_id`。Coordinator 在远端任务确认 `in_progress` 后、首次 Runtime 启动前创建专属 session，并写入：

- 本地项目 ID、远端项目 ID 与远端任务 ID。
- 会话类型 `automation-task` 和任务标题。
- 创建时间与最后活动时间。

一个远端待办的初始 Runtime、自动续轮、跨进程恢复、人工介入和 Git 收尾共用该 `session_id`。不同远端待办不共用 session；Personal / Chat 的自由会话只服务人工普通对话，不作为自动化任务缺失归属时的兜底。

消息记录携带 `session_id`、`task_id` 和可选 `run_id`。Workbench 只根据活动任务或最近完成项的 `session_id` 读取消息；session 不存在或归属与任务不符时返回空 transcript 和可诊断错误，不读取项目首个 session。最近完成项保存最终 `run_id`、持久 `thread_id` 与 `session_id`，历史审查打开同一待办的完整执行链。

Desktop session 与 Codex thread 是不同层级：session 是面向用户的待办 transcript 容器，Codex thread 是 Codex 持久化的连续模型对话。一个待办从首轮、普通 Gap、Completion Review、finding 修复到 Git-only 收尾只有一个 thread；Desktop session 和 Codex thread 都可以跨 Runtime 进程延续，但只有 thread 承担 Agent 上下文连续性。

## 自由 Chat 会话

自由 Chat 使用 `kind=chat` 的独立 Desktop session。每个 session 在首条消息提交时固定写入 `local_project_id`、Product Workspace 引用、规范化项目根、标题、创建/更新时间和非 ephemeral `thread_id`；它不携带 `task_id`、`feedback_id`、Case binding、Runtime context、task thread lease 或 Automation lane。一个 Chat session 只绑定一个工作区，改变工作区必须创建新 session。

Store 对 Chat 持久化以下状态：

- session metadata、Codex thread binding、最近 turn id 与 `draft/running/waiting_approval/interrupting/completed/interrupted/failed` 状态。
- transcript 消息、Composer 草稿、选中会话和每会话滚动锚点。
- 启动、恢复、失败与 thread recovery 诊断摘要；不持久化逐 token delta 或完整命令输出。
- 首条消息的幂等提交键，以及每次 turn 的稳定 request id，防止 Renderer 重试产生重复消息或 turn。

`ensureProjectSession` 不再为任意项目制造会进入 Chat 列表的默认 session。Automation Coordinator 显式创建 `automation-task` session；Chat Coordinator 只列出 `kind=chat` 且归属完整的 session。旧的无 `kind` 默认会话保持不可见，除非迁移证据能证明其确属自由 Chat；不能依据“项目第一个 session”推断归属。

应用启动恢复 session、消息、草稿和 thread binding。Store 中处于活动状态但 main process 没有对应活跃 turn 的记录原子改为 `interrupted`，原因标记为应用退出或进程丢失；系统不自动重放用户输入。下一条消息先执行 `thread/resume`。瞬时 resume 失败保留原绑定进入可重试恢复；只有 app-server 明确确认 thread 永久不存在时才建立替代 thread，并保存原 thread id、替代 id 与原因。

删除 Chat session 使用单一 main-process mutation。非活动 session 删除其本地 metadata、消息、草稿、turn refs 和 thread binding；活动 session 先发出 `turn/interrupt` 并等待 completed/interrupted/failed 终态，再执行同一删除。interrupt 或 Store mutation 失败时不删除任何本地部分。当前 app-server adapter 没有已验证的 thread 删除契约，因此删除只声明移除 ArcOrbit 本地记录与恢复能力，不声明擦除 Codex 自身持久化数据。

## 共享 Codex Conversation 层

`codex-app-server-adapter` 的通用职责形成可复用的 Codex Conversation 层：

- 启动并 initialize app-server stdio client，绑定规范化 project root。
- 以 `thread/start(ephemeral=false)`、`thread/resume` 和 `turn/start` 管理 thread/turn 生命周期，并在首个 turn 前通过 `onThreadBound` 持久化 thread id。
- 归一化 Agent message、reasoning、tool、file change、command、token usage、error、turn started/completed 与 thread recovery 事件。
- 以 `turn/interrupt` 停止当前 turn，并对活动 turn、client close 与进程异常给出可恢复终态。
- 处理 command single-flight、workspace roots、sandbox、approval policy 和用户 approval request。

Runtime 与 Chat 复用上述 transport 和基础事件，不复用语义 orchestration。State-driven Runtime 继续在其上叠加 `$using-arckit` prompt、`arckit-agent-loop-result/v1` output schema、Project/Case fresh snapshot、trusted ledger、Gap Loop、Automation lease 和 closeout。Chat Coordinator 直接提交用户文本，不设置 Agent Loop output schema，不调用 state-driven runner、Agent orchestrator、trusted ledger 或 Automation Coordinator。

现有 adapter 实例只支持一个活动 turn 并固定绑定一个 project root。Chat Coordinator 因此按活动 Chat session 懒创建 adapter owner；同一 session 串行 turn，不同 session 与不同项目使用独立 owner。owner 空闲或应用退出时可以关闭 app-server client，下一次通过持久 `thread_id` resume。Chat owner 不占用 Automation 的 task/thread lease，Automation owner 也不能向 Chat session 写消息或控制 turn。

通用事件先进入 `Codex Transcript Projector`。该 projector 只产生用户消息、Agent 正文、非空折叠 reasoning、工具活动、权限请求、错误、interrupt 与 token usage 等中性消息。Runtime Projector 在中性消息之上增加 Loop status、structured Agent result、ledger closeout 和 task control 语义；Chat 只消费中性投影。任何一方都不从另一方的 transcript 反推 session 类型、Case 或执行状态。

现有 approval handler 在 `on-request` 下直接接受请求，不满足 Chat 的用户可见审批语义。共享 Conversation 层使用异步 `approvalProvider` 把命令、文件变更和 permissions request 投影给 main-process Chat Coordinator；Coordinator 通过 request id 等待受限 Renderer 决定并返回 app-server 所需响应。窗口关闭、超时、session 不匹配或 Renderer 拒绝均 fail closed。Automation 可以继续使用自己的受监督 approval provider，但不能复用 Chat 的待决审批。

## Chat turn 数据流

1. Renderer 通过类型化 IPC 提交 `session_id + client_request_id + text`；main process 校验 session、工作区、空白输入、重复键和同 session 活动 turn。
2. Chat Coordinator 原子保存用户消息与 turn request，再创建或恢复对应 adapter owner。
3. `onThreadBound` 在 `turn/start` 前把 thread id 写入同一 session；持久化失败时不开始 turn。
4. app-server 事件经通用 projector 更新内存投影，并只在语义消息边界、人工控制、错误和 turn 终态持久化。
5. main process 向 Renderer 发送有界 `chat.changed` 通知；Renderer 随后读取 session snapshot，不直接消费 raw JSON-RPC。
6. turn completed/interrupted/failed 后，Coordinator 持久化终态并释放该 session 的活动 owner；下一个用户输入复用同一 thread。

Chat 消息采用与 Run message 相同的稳定角色、actor、kind、content、status 和时间字段，但归属键为 `session_id/thread_id/turn_id/item_id`，不伪造 `run_id/task_id/round_index`。流式 delta 更新同一 item；应用异常时允许丢失尚未形成语义边界的瞬时字符，但保留已提交用户消息、thread binding 和最后持久消息。

### Acceptance Feedback Record 与独立队列

Desktop Store 持久化 `acceptance_feedback_items`，它与远端任务 snapshot、普通 pending queue 和 `active_task` 分离。每条记录至少包含稳定 `feedback_id`、原始反馈、创建/更新时间、状态、来源 project/task/completion/run/case、local project、task session、Codex thread、ready 时间、当前 run、新 Case、最近进展、证据摘要、阻塞原因和幂等提交键。状态只允许 `queued`、`running`、`awaiting_human`、`blocked`、`resolved` 和 `cancelled`。

创建流程先以幂等键原子写入反馈记录，再向来源 task session 追加带 `feedback_id` 的 user message。任一步重试都按同一键返回现有记录，不重复消息或 Run。来源任务必须是 completed 或 accepted，并且项目、工作区、session 与 thread 引用完整；创建反馈不调用任务源状态更新。

反馈执行复用来源待办的 task session 和持久 Codex thread，但启动新的 Run。该 Run 的 Runtime context 携带 `kind=acceptance_feedback`、`feedback_id`、source task/run/case/completion refs；fresh `$using-arckit` turn 从反馈原文创建新的 Case，并把新 Case id 回写反馈记录。旧 closed Case 只作为证据引用，不重开、不变更。反馈 Case resolved、Git closeout 完成后，反馈记录进入 resolved；它不触发来源待办的完成写回。

普通待办队列与验收反馈队列各自派生 ready 队首。Coordinator 的 execution arbiter 只在没有活动执行时比较两个队首的 `ready_at`，再以 lane 和稳定 id 打破平局；选中反馈时获取 local project/workspace 与 task thread lease，并把记录原子推进为 running。租约冲突只保留 queued/blocked 进展。当前执行不被抢占，两条队列也不互相改写排序字段。

Automation Snapshot 分别投影 `todo_queue`、`acceptance_feedback_queue`、各自计数和一个统一 `active_execution`。completed/accepted 任务投影 `acceptance_feedback_items` 摘要，Renderer 只消费这些结构化字段，不从 transcript 或 Case 文本反推反馈状态。应用重启从 Store 恢复未终结反馈记录，对 running 记录核对 Run、thread lease 和 Case 后恢复、阻塞或重排队，不能丢弃用户原文。

### 统一消息投影

Run Projector 把 Runtime、Agent、工具与 operator event 归一为 `desktop-run-message/v1`。消息至少包含稳定 `id`、`role`、`actor`、`actor_label`、`kind`、`content`、`status`、时间、`run_id`，并可携带 `round_index`、`task_id`、`thread_id`、`turn_id` 与 `item_id` 作为诊断归因。schema-bound Agent 输出额外携带 `structured_data`，其中保存原始 schema version、解析后的原值和原始文本。Renderer 只按时间读取消息，不按 Run 建立平行 transcript，并把消息进一步投影为 `loop-status`、`reasoning-disclosure`、`agent-message`、`structured-result`、`tool-activity` 或 `user-message` 六类可见行。

流式 Agent 和 reasoning delta 通过稳定 item/turn 消息 ID 更新同一个内存对象。Reasoning summary 可以是字符串或数组；Projector 只提取其中由 Codex 提供的非空文本，流式时标记为展开态，`item/completed` 后标记为默认收起态，空数组、空字符串和空白内容不创建消息。命令、文件变更和其他工具 item 使用 `item_id` 稳定标识，started、completed 与 failed 更新同一条 `tool-activity`；output delta 只进入运行证据和活动摘要，不形成逐块消息。`item/completed`、Agent Loop result、Runtime round、Gate、ledger、compaction、warning、error 和 operator input 形成可持久化的语义消息边界。

Agent message delta 若形成带 `schema_version` 的 JSON 对象，Projector 将其识别为 structured result，并在完成时同时保存解析对象和未经改写的原始文本；该文本不再作为普通 Agent message。`arckit-agent-loop-result/v1` 和 `arckit-task-closeout-result/v1` 的 Runtime 语义事件仍以其原始 `summary` 字段产生独立正式 Agent 消息。Renderer 的 schema viewer 只选择并标注原始字段值以建立可扫描层级，未知 schema 使用通用树与原始数据展开，不生成替代 summary，也不修改上游 payload。

Renderer 的工具摘要是展示投影，不修改上游消息、Agent 上下文或 Runtime 证据。读取类从结构化 action 或命令中提取相对文件路径并显示“读取 <path>”；编辑、搜索、构建和测试显示稳定动词、目标及完成状态。无法可靠分类时显示工具名和有界目标，不回退渲染完整 `content`、`detail`、aggregated output 或协议 payload。

### 轻量持久化与刷新

每个 Run 只维护一个紧凑 `messages.jsonl` 消息记录、一个收束后的 `activity.json` 投影和一个错误专用 `stderr.log`。Desktop 不再同时复制完整 stderr event stream 与 JSON wrapper，也不创建 `raw-events.jsonl`。`messages.jsonl` 允许同一消息 ID 出现状态更新记录，读取方以最后一条为准；它不保存逐 token、逐字符或命令输出 delta。

Desktop 仍实时解析 Runtime stderr 以维护内存中的 activity、Token、耗时与控制状态，但 IPC 只发送合并后的 activity-changed 通知。Renderer 按有界节奏拉取最新快照，单次 delta 不触发独立 IPC、磁盘 append 或 DOM 节点。Run 结束、错误、人工控制和语义消息完成时立即刷出必要记录；进程异常时允许丢失尚未形成语义边界的瞬时 delta，不影响 canonical Case/ledger 恢复。

## Codex Thread 边界

Automation Store 以本地项目身份和远端任务 ID 为键保存唯一 `thread_id`、绑定状态、最后 turn、最后压缩检查点与更新时间。首次 `thread/start` 使用非 ephemeral 模式；Desktop 必须在首个 `turn/start` 前持久化返回的 id。Run Manager 为活动任务持有单 owner lease，阻止 Runtime、CLI 或重复恢复并发使用同一 thread。

进程重启时，Run Manager 把已持久化 `thread_id` 传给 Runtime；Codex adapter initialize 后先执行 `thread/resume`，再 fresh-read Project/Case State 发起下一 turn。瞬时 resume 失败保持原绑定进入 recovery；只有 Codex 明确确认 thread 永久不存在时，才记录可审计的 `thread_recovery_fallback` 并从 canonical state 创建新的持久 thread。canonical facts 不足时暂停并要求人工介入。

当前 turn 的 trusted ledger snapshot receipt、revision、candidate catalog 与授权覆盖 thread 中冲突的旧事实。首个 turn 携带完整待办意图；后续 turn 只携带任务标识、当前增量、fresh snapshot 投影、授权与输出契约，不重复历史 prompt、状态正文或旧报告。每轮启动时 Desktop 展示 persisted catalog；Agent result 到达后展示其 persisted/fresh comparison trace 与 selected gap，Runtime 不重新排序。写回后 Desktop 先展示 ledger `round_closeout`，再展示 post-commit `fresh_read` receipt；Runtime 不自行生成这两者的 canonical 语义。Completion Review 是唯一显式语义自查；Case resolved 后的 Git closeout 仍复用同一 thread，但只允许 commit/no-op，不再验证、编辑或修复。

每次成功 ledger 写回后、下一 gap 前，Coordinator 读取最新请求的 `inputTokens / modelContextWindow`。达到 80% 且上一个 Agent turn 后尚未压缩时，调用同一 thread 的 `thread/compact/start`，等待压缩完成并保存 checkpoint，再继续 fresh-state loop。累计 Token 只用于观测，不触发压缩或停止。

## 命令单飞与等待

Codex adapter 对需要批准的 command 以规范化 `cwd + command` 建立进程内指纹。`cmake --build` 的并发度参数不参与指纹，因此同一 build tree 与 target 的 `-j4`、`-j2` 或 `--parallel` 仍视为同一活动构建。指纹从批准开始保持到对应 command item 完成或 turn 结束；相同指纹仍在执行时，后续请求被拒绝并产生 `duplicate_command` 软异常，不启动第二个进程。

命令开始、输出、完成与耗时通过现有 app-server item 事件持续投影。模型不需要通过重新启动同一构建或测试来确认进度；被抑制的调用可以观察当前活动 command 的 item ID、开始时间和已有输出。不同命令、不同工作目录以及前一命令完成后的再次执行不受影响。

## Token Usage 投影

`thread/tokenUsage/updated` 被归一化为可持久化的 `token_usage` 投影。每条快照至少包含：

- `thread_id`、`turn_id`、当前 round 与 lane。
- 逻辑总 Token、输入、缓存输入、非缓存输入、输出与 reasoning output。
- 最近一次模型请求的输入、缓存输入、输出和 `modelContextWindow`。
- 最新请求上下文占用比例与事件时间。

Lane 固定为 `agent`；gap 执行、Completion Review、finding 修复、compaction 和 Git-only closeout 用 stage 区分，不拆成多个 Agent lane 或 Run。Runtime 不保留旧 `controller`、`builder`、`verifier`、`delegated`、`commit` lane 的兼容分支。

app-server 的 `tokenUsage.total` 是 thread 累计快照。Projector 对每个 thread 只保留最新累计值，Run 汇总为各 thread 最新值之和，不累加每次 notification。Turn 用量通过当前累计值减去该 turn 首次事件前的 thread 基线得到；同一 turn 的重复快照只更新结果，不重复计数。

Workbench 默认展示 Run 级逻辑总量、缓存输入、非缓存输入、输出和缓存比例，再按 lane、round、turn 下钻。逻辑总量用于理解模型工作规模，缓存与非缓存输入必须分列，不能把缓存命中伪装成同等新增上下文成本。

Automation Snapshot 从同一本地项目最近 20 个已完成 Runtime Run 计算逻辑总量、缓存/非缓存输入、输出和耗时的中位数基线，排除当前活动 Run。Workbench 显示样本数与相对中位数倍数；该基线用于趋势判断，不因任务复杂度不同而自动得出浪费结论，也不作为执行门禁。直接 Codex CLI 的可比真实任务样本可以进入后续外部基准，但不会被 Runtime 伪造或从缓存比例推断。

## 时间投影

Projector 记录每个 round、模型 turn 和 command item 的开始、结束与持续时间。Run activity 汇总模型 turn 累计耗时与 command 累计耗时，并保留最慢命令的命令、工作目录、lane 和 turn；进行中的命令保持无结束时间，Workbench 以活动状态持续展示。该投影用于区分模型思考、工具执行和外部构建等待，不通过额外模型调用轮询进度。

## 软异常

Runtime 保存可解释、非阻断的 `usage_warnings`。首批检测包括：

- 相同工作目录的等价 command 在前一实例完成前重复请求。
- 最近模型请求的输入接近模型上下文窗口。
- Agent transition 结构不合法或因 stale revision 被拒绝。
- 同一待办 Agent thread 的目标、授权或 canonical refs 发生异常漂移。

警告包含类型、lane、thread/turn 或 command item、检测时间和证据摘要。警告不改变 round outcome、Case resolution、`max_auto_rounds` 或 handoff，不触发基于固定 Token 总量的中断。后续治理可以基于历史分位数和直接 Codex CLI 基线增加趋势告警，但基线属于比较证据而不是执行门禁。

## Desktop IPC 与 Renderer

Preload 只暴露 Automation 与 Chat 各自的类型化查询和动作。Automation Snapshot 的活动任务和最近完成项携带 `session_id`；Run activity 携带 `token_usage` 与 `usage_warnings`。Chat IPC 只包含 `snapshot/create/select/rename/delete/send/interrupt/approvalDecision`；`select` 只持久化已验证 Chat session 的 `selected_session_id`，不改变草稿、thread 或 session `updated_at`，使最后选择可在重启后恢复。每个 mutation 都要求明确 `session_id` 和适用的 request id；Renderer 不能传入 cwd、thread id、Codex executable、任意 method 或 shell command。main process 从已验证 Product Workspace 解析项目根和权限边界。Renderer 不自行解析 raw JSONL、Codex JSON-RPC 或本地 Store，也不估算 Token。

`chat.snapshot` 只返回 `kind=chat` 的 session、可见消息、草稿、活动状态和脱敏诊断摘要。`chat.changed` 是失效通知而不是状态真相；Renderer 收到后重新读取 snapshot。Chat 与 Automation 使用不同 IPC namespace 和 ownership checks，Chat 的 session id 不能传给 Automation control，Automation task session 也不能传给 Chat mutation。

### Renderer Chat 状态协调

Renderer 使用单一 Chat 状态协调边界拥有本地 snapshot projection、当前 owner identity、Composer 草稿、失败重试身份、发送提交状态、owner epoch 和草稿持久化队列。页面级全局状态不保存这些字段的平行副本；DOM handler 只读取协调器投影并发出语义命令，不选择异步 freshness 原语、snapshot preservation flags 或持久化时序。

Owner identity 是以下互斥状态之一：

- `session owner`：包含已验证的 Chat `session_id` 及其固定 Product Workspace。
- `draft workspace owner`：`session_id` 为空，并包含首条发送将绑定的 Product Workspace。

选择会话、新建对话、切换草稿工作区、删除会话和首条发送属于 owner-changing transition。每次 transition 创建新的 owner epoch；只有同一 epoch 的响应可以采用 snapshot。重命名、停止、审批、已有会话发送和 background refresh 属于 session-scoped observation；响应还必须匹配发起时的 session owner，不能把旧 session transcript、状态、标题或错误投影到后续选择。

Snapshot adoption 由 transition 类型确定，而不是由调用点传入通用 flags：

- authoritative adoption 用于启动恢复、显式选择、删除结果和重置 owner 的刷新。
- owner-preserving adoption 用于 background refresh 与 session-scoped mutation，保留当前 owner 和 Composer 草稿。
- first-send adoption 接受新建 session owner，同时保留 IPC 在途期间输入的下一条草稿。

Composer 输入在协调边界内捕获输入时的 owner，并进入串行 debounce 队列。Owner-changing transition 在调用 main-process mutation 前 flush 已捕获的旧 owner 草稿；首发建立 session 后，非空在途草稿在同一 transition 内重新绑定并 flush 到新 session。持久化响应不参与 Renderer 投影，不能覆盖较新的 owner 或草稿。

Renderer Chat transition 的模型级测试以倒序完成覆盖会话选择、草稿工作区、background refresh、session mutation、首发 owner adoption、在途输入与 retry identity。测试同时验证调用点只使用语义命令，且不存在并行 Chat owner/draft 状态或调用点 preservation flags。

Intervention Workbench 展示当前任务 ID、task session 和 Run 边界，并把 session message 与各 Run 的 projected messages 按时间合并。Workbench 根容器使用受限视口高度和 `min-height: 0` 的三栏 grid；左右栏各自可滚动，中间栏由固定 header、`overflow-y: auto` 的 transcript 和固定 composer 组成，页面根不随 transcript 增长。

Renderer 在刷新前记录 transcript 是否位于底部阈值内。位于阈值内时渲染后滚动到最新；用户主动上滚时保留相对阅读位置并显示回到最新入口。Token Inspector 展示分项汇总、lane 明细、上下文占用和软异常。普通只读审查不创建消息；活动执行中的人工提交仅写入当前 task session 和当前 Run message projection，并进入当前活动执行的 steer 或 fresh continuation。completed/accepted 结果审查提交验收问题时走幂等反馈创建流程，追加带 `feedback_id` 的来源 task session 用户消息，并等待独立反馈队列启动新 Run。

## 交互式 Codex CLI 执行权接力

Automation Coordinator 为当前活动任务持久化可选 `case_id`、`case_binding_source=runtime_ledger`、`case_binding_run_id`、`case_bound_at` 和本地 `phase=cli_handoff`。只有当前任务 Run 已成功写入 trusted ledger，并由该写入结果返回唯一 `case_id`，才能建立任务到 canonical Case 的权威绑定。绑定只表达任务身份，不把 Run、Desktop phase 或 CLI 会话写入 Case State。Run 是可丢弃的执行实例，Case 是 Runtime、CLI 和重启恢复共享的语义事实。

`run.case_id`、activity 或 Controller frame 中的缓存字段、未经 ledger 接受的 Agent result、仓库里“唯一/最新/唯一可读”的 Case，以及 CLI 前后 Case 集合差都不是绑定证据。旧 Store 中只有裸 `case_id` 而没有绑定来源的记录按未绑定处理，并在对账时清除。一个任务 Run 若出现多个互相冲突的 trusted ledger Case ID，Coordinator 进入 `case_binding_conflict` recovery，不自行挑选其中任何一个。

首次 Runtime 启动不携带预选 `case_id`。Agent 根据待办意图、fresh Project State 和全部 active Cases 语义选择现有 Case；没有合适 Case 时通过 trusted ledger 创建独立 Case。Runtime 只观察被 ledger 接受的结果。CLI 是已建立身份后的执行权接力通道：权威绑定尚未形成时，Desktop 拒绝 CLI handoff 且不 interrupt 当前 Runtime，待 Agent 完成首个 trusted ledger checkpoint 后再允许切换。

已绑定任务的 `handoffToCodexCli` 采用串行控制：先向当前 Runtime run 发送 interrupt，再等待 Desktop Run Manager 释放 thread lease；停止超时则进入恢复状态且不启动 CLI。停止成功后，主进程通过平台终端启动器打开新终端，工作目录固定为绑定项目，并执行交互式 `codex resume <thread_id>`。启动器以参数数组和平台级转义生成命令，不经 Renderer shell；Renderer 只调用有界 IPC。

CLI resume 后追加一条自然 `$using-arckit` 指令，包含已知 `case_id` 和“从 fresh Project/Case State 自动推进，仅在需要人工介入时暂停”的要求。它不重复待办全文，不包含 raw event、隐藏 transcript 或未写回 claim；Agent 从同一 thread 与 fresh canonical state 继续。

CLI 启动成功后，活动任务进入 `cli_handoff`，远端任务保持 `in_progress`，下一队列继续冻结。Desktop 不读取终端 transcript，也不把终端关闭视为执行结果；“重新打开终端”只重复同一有界启动动作。

Case Reader 只在权威绑定已经存在时根据 `case_id` 匹配 Project `advancement.active_case_refs`，或在 `arckit/cases/closed/` 中查找同一 Case，并返回完整 `development-case-record/v5`。不匹配当前协议的记录不进入自动恢复。Coordinator 在同步和“恢复自动执行”时使用该 fresh record 对账：

- `active` 且 handoff 由 Agent 负责：显式交还执行权后启动 fresh Runtime run。
- `active/handoff` 且需要 human：创建 attention item。
- `closed` 且 Git closeout checkpoint 已完成：进入远端完成写回。
- `closed` 且 Git closeout 尚未完成：resume 同一 thread 执行 closeout turn。
- 权威绑定缺失、冲突，或 Case 缺失、解析失败、状态歧义：进入 recovery，不得扫描仓库、依据旧 run 或利用候选数量猜测身份与完成状态。

`cli_handoff` 本身阻止 Runtime presence recovery 将其误报为丢失进程，也阻止同步自动启动并发 Runtime。只有用户显式“恢复自动执行”或 fresh Case 已 resolved 才结束 CLI 所有权；后者可安全收尾，因为 canonical Case 已声明研发闭环完成。

### 本地优先恢复与收尾检查点

Automation Store 把活动任务收尾拆成 `case_status/case_resolved_at`、`closeout_status/closeout_completed_at` 和 `remote_completion_status` 三个持久检查点，并始终保留 `thread_id`。`phase` 只投影当前控制动作，不承担全部完成事实。Coordinator 只能从当前任务 Run 的 trusted ledger write 恢复 `case_id` 及绑定来源；closeout checkpoint 只接受同一 thread 的结构化 success/no-op 结果。

Agent output Schema 使用 disposition 判别联合前置约束 invariant judgment 的字段组合，例如 `not_relevant` 要求空 `evidence/gap_refs`，`upheld` 要求非空 evidence，`threatened/undetermined` 要求 fact 与 open-gap refs。Runtime validator、Ledger Gate、transition preflight 和 apply 拒绝统一投影为包含 `kind/recoverable/responsibility/reason/issues/recovery_action` 的结构化结果。State-driven runner 在 `writeback_required=true` 时先检查 `written=true`，未接受写回不得采用 Agent 的 terminal handoff、不得返回 completed、不得启动 Git-only closeout。

可修正 rejection 进入 `arckit-agent-repair-instruction/v1`：同一 persistent Agent thread 的下一 turn 同时获得 issue paths、被拒 Agent output、`write_accepted=false`、fresh trusted snapshot 和修正约束。Agent 必须返回完整 replacement result，不重复已经完成的实现，不由 Runtime 静默删除 evidence 或替换语义 disposition；snapshot/revision 已过期时从 fresh state 重新规划。`max_agent_repair_attempts` 默认 2，独立于业务 `no_progress_rounds`，因此协议表单修正不会被误算为 Gap 无进展。Desktop 将其投影为非终态的 `Agent repair n/N`；预算耗尽得到 `agent_repair_limit`，不可修正错误保持 fail-closed，随后 Coordinator 才以 rejection reason 建立 `runtime_incomplete`。Live `run.finished` 和 detached startup reconciliation 使用同一错误优先级，不能退化为成功 handoff 文案。

启动同步先执行 detached Run、持久 thread binding、权威 Case binding 与 canonical Case 的本地对账，再创建任务源 adapter 或检查认证。该阶段不调用远端 API：已绑定的 active Case resume 同一 thread 继续 loop；已绑定的 closed/resolved Case 若未 closeout 则 resume 同一 thread 执行收尾，已完成 closeout 时进入 `remote_completion_pending`。任务源未配置、未登录、认证失效或不可达都不能跳过或回退该对账。未绑定任务不能因仓库碰巧只有一个可读 Case 而进入收尾；`retry_start` 会清除陈旧的 closeout phase/checkpoint 并启动正常 Runtime，让新的 trusted ledger write 建立绑定。

认证和远端项目/待办快照成功后，Coordinator 再执行允许远端写回的对账。远端完成要求任务已有权威 Case binding，并 fresh-read 到该 Case 的 canonical `closed/resolved` 状态；仅有 `closeout_status=completed`、裸 `case_id` 或 Agent 完成声明都不足以提交 `in_progress -> completed`。成功后清理活动任务。closeout 状态先持久化再尝试远端写回，因此应用退出、401 或网络失败后不会重复 Git 操作。`remote_completion_pending` 不属于 Runtime process ownership，Presence Recovery 不得生成 Runtime 丢失错误。

## 恢复

Chat session 或 thread 创建成功但首个 turn 启动失败时保留本地用户消息、幂等键和 thread binding；用户重试复用同一 session/thread，不重复首条消息。活动 Chat 在应用退出时先 interrupt；下次启动把缺少活跃 owner 的非终态 turn 标记为 interrupted，不自动继续。Chat 恢复、删除或停止都不读取、写入或释放 Automation task lease、remote task state、Case 或 human Gate。

session 或 thread 创建成功但 Runtime 启动失败时保留绑定，`retry_start` 必须复用它。任务完成后 session、thread id 与消息留作审查；删除项目时沿用项目级清理规则。退出登录只清除远端身份与快照，不删除本地 task session、thread binding、Run activity 或用量历史。

绑定活动任务与持久 `thread_id` 的 Runtime 恢复项同时提供 `feedback_continue`。Coordinator 要求非空用户原文，校验 recovery、active task、task session 和 thread 归属一致，再用该原文作为新 Run 的唯一 task 内容 resume 同一 thread；新 Run 关联来源 recovery、失败 Run、result 与 activity refs。Run 成功建立后，原文以 `role=user`、`kind=recovery_feedback` 写入同一 Desktop session，恢复项才移除；启动失败时恢复项和 recovery phase 保留。Workbench 合并 session 用户消息与所有同 session Run 投影，因此反馈在提交后立即作为“你”的消息出现在当前待办对话，而不创建新对话或覆盖 canonical Case facts。

## 验收口径

- 新建自由 Chat 在首条非空消息前不产生空 session；首条消息只创建一个 `kind=chat` session、一个持久 thread 和一个可见用户消息。
- Chat session 固定绑定一个 Product Workspace 和规范化项目根；切换工作区创建新 session，Renderer 不能覆盖 cwd 或 thread id。
- 同一 Chat session 的连续消息 resume 同一 thread，活动 turn 期间第二个 send 被拒绝；不同 Chat session 和 Automation owner 不共享 adapter ownership 或 lease。
- Chat 不设置 Agent Loop output schema，不触发 `$using-arckit`、trusted ledger、Workshop mutation、Case 或 Automation Run。
- Agent 正文、reasoning、工具与权限状态按稳定 item 更新；raw JSON-RPC、完整 stdout/stderr 与文件正文不进入普通 transcript。
- 用户可在 starting、running 或 waiting approval 状态停止；interrupt 后保留部分输出并标记 interrupted，下一次继续是同 thread 的新 turn。
- 会话切换和页面切换不隐式停止 turn；应用重启把丢失 owner 的非终态 Chat 标记为 interrupted，不重复用户请求。
- 删除非活动 Chat 只移除目标 session 的本地状态；删除活动 Chat 先完成 interrupt，任一步失败都不产生部分删除，并明确不承诺擦除 Codex 底层 thread。
- Chat approval request 通过异步、受限、fail-closed provider 返回；Renderer 关闭、超时或 session/request 不匹配均拒绝，不自动批准。
- Chat IPC 不能接收任意 cwd、thread id、Codex method、命令或文件路径权限；Automation session id 不能通过 Chat mutation，反向同样拒绝。
- 两个连续远端待办在同一项目中获得不同 `session_id`，Workbench transcript 不交叉。
- 同一待办的 intervention、continuation、普通 Gap、Completion Review、finding 修复和 Git-only closeout 保持同一 Desktop session 与 Codex thread。
- 已绑定持久 thread 的 Runtime 失败项可接收非空用户反馈；反馈启动同 thread 的新 Run、保留来源 refs，并在同一 Workbench transcript 中显示，失败时不提前移除恢复项。
- thread id 在首个 turn 前持久化；进程重启和 Runtime Run 切换都 resume 同一 thread。
- 不同待办不共享 Codex thread；同一待办不会创建 Controller、Worker、Review 或 commit thread。
- 同一 `cwd + command` 的并发请求只批准一个进程，并留下可审查软异常。
- Token 快照按 thread 最新累计值去重，Run 与 lane 汇总可由 turn 明细重算。
- Round、turn 与 command 耗时可重算，Workbench 能指出最慢活动而不重复启动命令。
- Workbench 区分缓存输入、非缓存输入和输出，并展示上下文窗口占用。
- Workbench 的页面根、左右栏和 Composer 不随 transcript 增长；只有中间消息列表滚动，用户阅读历史时新消息不会强制改变位置。
- Renderer 将 Agent 正式输出作为主要信息，把 Loop 状态、非空可折叠 reasoning、专用结构化结果和每个 tool item 的原位单行活动作为次级信息；空 reasoning 不产生消息，文件正文、完整 diff、stdout/stderr 与 raw payload 不进入普通消息正文，但原始结构化 payload 保真进入查看器并继续保留在上游上下文或诊断证据中。
- 任意用量警告都不会自动设置 Token 总上限、硬总轮次或终止 Case。
- 当前 Runtime 可以在确认安全停止后打开用户可见且可输入的交互式 Codex CLI；两者不会并发拥有同一活动任务的执行权。
- 首次 Runtime 不预选 Case；Agent 语义选择现有 Case 或通过 trusted ledger 创建新 Case，未形成权威绑定时 CLI handoff 不会中断 Runtime。
- CLI 与 Runtime 通过同一持久 thread 和 canonical Case State 接力；关闭终端不推断完成，恢复自动执行前读取 fresh active/closed Case。
- 任务到 Case 的绑定只接受当前任务 Run 已成功写入的 trusted ledger 结果；缓存字段、Agent 声明、仓库 Case 数量与 CLI 集合差均不能建立绑定，可信结果冲突时进入 recovery。
- 缺少权威 Case binding 的任务不会启动 Git closeout 或远端完成；远端完成前还必须 fresh-read 到绑定 Case 的 canonical resolved 状态。
- `writeback_required` 的 validation/Gate/transition 拒绝不会进入 completed 或 Git closeout；可修正错误先进入同-thread Agent repair，live 与 detached recovery 只处理 repair 预算耗尽或不可修正的最终失败，并展示结构化 rejection reason。
- 未登录或认证失效的启动路径仍先读取本地 canonical Case；closed Case 显示为等待远端收尾，不显示 Runtime 仍在执行。
- closeout completed checkpoint 只能由同一 thread 的结构化 success/no-op 结果形成；认证恢复后只重试远端完成写回，不重复 Git closeout。
- 最新请求上下文占用达到 80% 时，Runtime 在 gap 间压缩同一 thread 并保存 checkpoint；压缩不创建新 thread。
