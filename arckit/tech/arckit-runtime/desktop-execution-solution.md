# Runtime Desktop 待办执行与用量可观测性方案

## 定位

Desktop Execution Plane 负责把一个远端待办绑定到一个可恢复的本地执行会话，并把 Runtime 过程投影为可审查的 transcript、耗时与 Token 用量。它不判断 Case 语义，不以固定 Token 总量或总轮次终止研发事项；停止与续接仍由 Runtime handoff、状态进展、人工决策和安全控制决定。

## 待办执行会话

Automation Store 为活动任务与最近完成项保存 `session_id`。Coordinator 在远端任务确认 `in_progress` 后、首次 Runtime 启动前创建专属 session，并写入：

- 本地项目 ID、远端项目 ID 与远端任务 ID。
- 会话类型 `automation-task` 和任务标题。
- 创建时间与最后活动时间。

一个远端待办的初始 Runtime、自动续轮、跨进程恢复、人工介入和 Git 收尾共用该 `session_id`。不同远端待办不共用 session；项目默认 Chat 只服务人工普通对话，不作为自动化任务缺失归属时的兜底。

消息记录携带 `session_id`、`task_id` 和可选 `run_id`。Workbench 只根据活动任务或最近完成项的 `session_id` 读取消息；session 不存在或归属与任务不符时返回空 transcript 和可诊断错误，不读取项目首个 session。最近完成项保存最终 `run_id`、持久 `thread_id` 与 `session_id`，历史审查打开同一待办的完整执行链。

Desktop session 与 Codex thread 是不同层级：session 是面向用户的待办 transcript 容器，Codex thread 是 Codex 持久化的连续模型对话。一个待办从首轮到验证、修复和 Git 收尾只有一个 thread；Desktop session 和 Codex thread 都可以跨 Runtime 进程延续，但只有 thread 承担 Agent 上下文连续性。

### 统一消息投影

Run Projector 把 Runtime、Agent、工具与 operator event 归一为 `desktop-run-message/v1`。消息至少包含稳定 `id`、`role`、`actor`、`actor_label`、`kind`、`content`、`status`、时间、`run_id`，并可携带 `round_index`、`task_id`、`thread_id`、`turn_id` 与 `item_id` 作为诊断归因。Renderer 只按时间读取消息，不按 Run 建立平行 transcript，并把消息进一步投影为 `loop-status`、`agent-message`、`tool-activity` 或 `user-message` 四类可见行。

流式 Agent 和 reasoning delta 通过稳定消息 ID 更新同一个内存对象。命令、文件变更和其他工具 item 使用 `item_id` 稳定标识，started、completed 与 failed 更新同一条 `tool-activity`；output delta 只进入运行证据和活动摘要，不形成逐块消息。`item/completed`、Agent Loop result、Runtime round、Gate、ledger、compaction、warning、error 和 operator input 形成可持久化的语义消息边界。

Renderer 的工具摘要是展示投影，不修改上游消息、Agent 上下文或 Runtime 证据。读取类从结构化 action 或命令中提取相对文件路径并显示“读取 <path>”；编辑、搜索、构建和测试显示稳定动词、目标及完成状态。无法可靠分类时显示工具名和有界目标，不回退渲染完整 `content`、`detail`、aggregated output 或协议 payload。

### 轻量持久化与刷新

每个 Run 只维护一个紧凑 `messages.jsonl` 消息记录、一个收束后的 `activity.json` 投影和一个错误专用 `stderr.log`。Desktop 不再同时复制完整 stderr event stream 与 JSON wrapper，也不创建 `raw-events.jsonl`。`messages.jsonl` 允许同一消息 ID 出现状态更新记录，读取方以最后一条为准；它不保存逐 token、逐字符或命令输出 delta。

Desktop 仍实时解析 Runtime stderr 以维护内存中的 activity、Token、耗时与控制状态，但 IPC 只发送合并后的 activity-changed 通知。Renderer 按有界节奏拉取最新快照，单次 delta 不触发独立 IPC、磁盘 append 或 DOM 节点。Run 结束、错误、人工控制和语义消息完成时立即刷出必要记录；进程异常时允许丢失尚未形成语义边界的瞬时 delta，不影响 canonical Case/ledger 恢复。

## Codex Thread 边界

Automation Store 以本地项目身份和远端任务 ID 为键保存唯一 `thread_id`、绑定状态、最后 turn、最后压缩检查点与更新时间。首次 `thread/start` 使用非 ephemeral 模式；Desktop 必须在首个 `turn/start` 前持久化返回的 id。Run Manager 为活动任务持有单 owner lease，阻止 Runtime、CLI 或重复恢复并发使用同一 thread。

进程重启时，Run Manager 把已持久化 `thread_id` 传给 Runtime；Codex adapter initialize 后先执行 `thread/resume`，再 fresh-read Project/Case State 发起下一 turn。瞬时 resume 失败保持原绑定进入 recovery；只有 Codex 明确确认 thread 永久不存在时，才记录可审计的 `thread_recovery_fallback` 并从 canonical state 创建新的持久 thread。canonical facts 不足时暂停并要求人工介入。

当前 turn 的 fresh digest、revision 与授权覆盖 thread 中冲突的旧事实。首个 turn 携带完整待办意图；后续 turn 只携带任务标识、当前增量、fresh canonical digest/revisions、授权与输出契约，不重复历史 prompt、状态正文或旧报告。每个 turn 只选择并完成一个 Case gap，但验证、修复和 Git closeout 仍在同一 thread 中完成。

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

Lane 固定为 `agent`；gap 执行、验证、修复、compaction 和 Git closeout 用 stage 区分，不拆成多个 Agent lane 或 Run。Runtime 不保留旧 `controller`、`builder`、`verifier`、`delegated`、`commit` lane 的兼容分支。

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

Preload 继续只暴露任务范围内的查询与动作。Automation Snapshot 的活动任务和最近完成项携带 `session_id`；Run activity 携带 `token_usage` 与 `usage_warnings`。Renderer 不自行解析 raw JSONL 或估算 Token。

Intervention Workbench 展示当前任务 ID、task session 和 Run 边界，并把 session message 与各 Run 的 projected messages 按时间合并。Workbench 根容器使用受限视口高度和 `min-height: 0` 的三栏 grid；左右栏各自可滚动，中间栏由固定 header、`overflow-y: auto` 的 transcript 和固定 composer 组成，页面根不随 transcript 增长。

Renderer 在刷新前记录 transcript 是否位于底部阈值内。位于阈值内时渲染后滚动到最新；用户主动上滚时保留相对阅读位置并显示回到最新入口。Token Inspector 展示分项汇总、lane 明细、上下文占用和软异常；只读审查不创建消息，人工提交仅写入当前 task session 和当前 Run message projection，并进入当前活动任务的 steer 或 fresh continuation。

## 交互式 Codex CLI 执行权接力

Automation Coordinator 为当前活动任务持久化可选 `case_id` 和本地 `phase=cli_handoff`。`case_id` 从 Runtime activity 中已接受的 Controller frame 或 ledger result 提取；它只把远端待办绑定到 canonical Case，不把 Run、Desktop phase 或 CLI 会话写入 Case State。Run 是可丢弃的执行实例，Case 是 Runtime、CLI 和重启恢复共享的语义事实。

`handoffToCodexCli` 采用串行控制：先向当前 Runtime run 发送 interrupt，再等待 Desktop Run Manager 释放 thread lease；停止超时则进入恢复状态且不启动 CLI。停止成功后，主进程通过平台终端启动器打开新终端，工作目录固定为绑定项目，并执行交互式 `codex resume <thread_id>`。启动器以参数数组和平台级转义生成命令，不经 Renderer shell；Renderer 只调用有界 IPC。

CLI resume 后追加一条自然 `$using-arckit` 指令，包含已知 `case_id` 和“从 fresh Project/Case State 自动推进，仅在需要人工介入时暂停”的要求。它不重复待办全文，不包含 raw event、隐藏 transcript 或未写回 claim；Agent 从同一 thread 与 fresh canonical state 继续。

CLI 启动成功后，活动任务进入 `cli_handoff`，远端任务保持 `in_progress`，下一队列继续冻结。Desktop 不读取终端 transcript，也不把终端关闭视为执行结果；“重新打开终端”只重复同一有界启动动作。

Case Reader 根据 `case_id` 先匹配 Project `advancement.active_case_refs`，再在 `arckit/cases/closed/` 中查找同一 Case，并返回完整 `development-case-record/v5`。不匹配当前协议的记录不进入自动恢复。Coordinator 在同步和“恢复自动执行”时使用该 fresh record 对账：

- `active` 且 handoff 由 Agent 负责：显式交还执行权后启动 fresh Runtime run。
- `active/handoff` 且需要 human：创建 attention item。
- `closed` 且 Git closeout checkpoint 已完成：进入远端完成写回。
- `closed` 且 Git closeout 尚未完成：resume 同一 thread 执行 closeout turn。
- Case 缺失、解析失败或状态歧义：进入 `case_reconciliation_failed`，不得回退依据旧 run 猜测完成。

`cli_handoff` 本身阻止 Runtime presence recovery 将其误报为丢失进程，也阻止同步自动启动并发 Runtime。只有用户显式“恢复自动执行”或 fresh Case 已 resolved 才结束 CLI 所有权；后者可安全收尾，因为 canonical Case 已声明研发闭环完成。

### 本地优先恢复与收尾检查点

Automation Store 把活动任务收尾拆成 `case_status/case_resolved_at`、`closeout_status/closeout_completed_at` 和 `remote_completion_status` 三个持久检查点，并始终保留 `thread_id`。`phase` 只投影当前控制动作，不承担全部完成事实。Coordinator 可以从 ledger activity 恢复 `case_id`，但 closeout checkpoint 只接受同一 thread 的结构化 success/no-op 结果。

启动同步先执行 detached Run、持久 thread binding 与 canonical Case 的本地对账，再创建任务源 adapter 或检查认证。该阶段不调用远端 API：active Case resume 同一 thread 继续 loop；closed/resolved Case 若未 closeout 则 resume 同一 thread 执行收尾，已完成 closeout 时进入 `remote_completion_pending`。任务源未配置、未登录、认证失效或不可达都不能跳过或回退该对账。

认证和远端项目/待办快照成功后，Coordinator 再执行允许远端写回的对账。`closeout_status=completed` 时只提交任务 `in_progress -> completed`；成功后清理活动任务。closeout 状态先持久化再尝试远端写回，因此应用退出、401 或网络失败后不会重复 Git 操作。`remote_completion_pending` 不属于 Runtime process ownership，Presence Recovery 不得生成 Runtime 丢失错误。

## 恢复

session 或 thread 创建成功但 Runtime 启动失败时保留绑定，`retry_start` 必须复用它。任务完成后 session、thread id 与消息留作审查；删除项目时沿用项目级清理规则。退出登录只清除远端身份与快照，不删除本地 task session、thread binding、Run activity 或用量历史。

## 验收口径

- 两个连续远端待办在同一项目中获得不同 `session_id`，Workbench transcript 不交叉。
- 同一待办的 intervention、continuation、验证、修复和 Git closeout 保持同一 Desktop session 与 Codex thread。
- thread id 在首个 turn 前持久化；进程重启和 Runtime Run 切换都 resume 同一 thread。
- 不同待办不共享 Codex thread；同一待办不会创建 Controller、Worker、Review 或 commit thread。
- 同一 `cwd + command` 的并发请求只批准一个进程，并留下可审查软异常。
- Token 快照按 thread 最新累计值去重，Run 与 lane 汇总可由 turn 明细重算。
- Round、turn 与 command 耗时可重算，Workbench 能指出最慢活动而不重复启动命令。
- Workbench 区分缓存输入、非缓存输入和输出，并展示上下文窗口占用。
- Workbench 的页面根、左右栏和 Composer 不随 transcript 增长；只有中间消息列表滚动，用户阅读历史时新消息不会强制改变位置。
- Renderer 将 Loop 状态和 Agent 输出作为主要信息，把每个 tool item 投影为一条原位更新的单行活动；文件正文、完整 diff、stdout/stderr 与 raw payload 不进入可见消息正文，但继续保留在上游上下文或诊断证据中。
- 任意用量警告都不会自动设置 Token 总上限、硬总轮次或终止 Case。
- 当前 Runtime 可以在确认安全停止后打开用户可见且可输入的交互式 Codex CLI；两者不会并发拥有同一活动任务的执行权。
- CLI 与 Runtime 通过同一持久 thread 和 canonical Case State 接力；关闭终端不推断完成，恢复自动执行前读取 fresh active/closed Case。
- 未登录或认证失效的启动路径仍先读取本地 canonical Case；closed Case 显示为等待远端收尾，不显示 Runtime 仍在执行。
- closeout completed checkpoint 只能由同一 thread 的结构化 success/no-op 结果形成；认证恢复后只重试远端完成写回，不重复 Git closeout。
- 最新请求上下文占用达到 80% 时，Runtime 在 gap 间压缩同一 thread 并保存 checkpoint；压缩不创建新 thread。
