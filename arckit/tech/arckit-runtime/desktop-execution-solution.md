# Runtime Desktop 待办执行与用量可观测性方案

## 定位

Desktop Execution Plane 负责把一个远端待办绑定到一个可恢复的本地执行会话，并把 Runtime 过程投影为可审查的 transcript、耗时与 Token 用量。它不判断 Case 语义，不以固定 Token 总量或总轮次终止研发事项；停止与续接仍由 Runtime handoff、状态进展、人工决策和安全控制决定。

## 待办执行会话

Automation Store 为活动任务与最近完成项保存 `session_id`。Coordinator 在远端任务确认 `in_progress` 后、首次 Runtime 启动前创建专属 session，并写入：

- 本地项目 ID、远端项目 ID 与远端任务 ID。
- 会话类型 `automation-task` 和任务标题。
- 创建时间与最后活动时间。

一个远端待办的初始 Runtime、进程内自动续轮、跨进程 continuation、人工介入、恢复重试和 commit agent 共用该 `session_id`。不同远端待办不共用 session；项目默认 Chat 只服务人工普通对话，不作为自动化任务缺失归属时的兜底。

消息记录携带 `session_id`、`task_id` 和可选 `run_id`。Workbench 只根据活动任务或最近完成项的 `session_id` 读取消息；session 不存在或归属与任务不符时返回空 transcript 和可诊断错误，不读取项目首个 session。最近完成项保存 Case Runtime 的 `run_id`、独立的 `commit_run_id` 与 `session_id`，因此历史审查打开的是 Case 执行而不是 commit agent。

Desktop session 与 Codex thread 是不同层级：session 是面向用户的待办 transcript 容器，Codex thread 是单个 Runtime 进程内的模型上下文。Desktop session 可以跨 Run 延续，但不要求复用同一 Codex thread。

### 统一消息投影

Run Projector 把 Runtime、Controller、Worker Agent、工具与 operator event 归一为 `desktop-run-message/v1`。消息至少包含稳定 `id`、`role`、`actor`、`actor_label`、`kind`、`content`、`status`、时间、`run_id`，并可携带 `round_index`、`task_id`、`thread_id`、`turn_id` 与 `item_id` 作为诊断归因。Renderer 只按时间读取消息并用来源标签区分角色，不按 thread 建立平行 transcript。

流式 Agent 和 reasoning delta 通过稳定消息 ID 更新同一个内存对象。命令 delta 只更新活动命令摘要，不形成逐块消息；`item/completed`、Worker report、Controller plan/review、Runtime round、Gate、ledger、warning、error 和 operator input 形成可持久化的语义消息边界。

### 轻量持久化与刷新

每个 Run 只维护一个紧凑 `messages.jsonl` 消息记录、一个收束后的 `activity.json` 投影和一个错误专用 `stderr.log`。Desktop 不再同时复制完整 stderr event stream 与 JSON wrapper，也不创建 `raw-events.jsonl`。`messages.jsonl` 允许同一消息 ID 出现状态更新记录，读取方以最后一条为准；它不保存逐 token、逐字符或命令输出 delta。

Desktop 仍实时解析 Runtime stderr 以维护内存中的 activity、Token、耗时与控制状态，但 IPC 只发送合并后的 activity-changed 通知。Renderer 按有界节奏拉取最新快照，单次 delta 不触发独立 IPC、磁盘 append 或 DOM 节点。Run 结束、错误、人工控制和语义消息完成时立即刷出必要记录；进程异常时允许丢失尚未形成语义边界的瞬时 delta，不影响 canonical Case/ledger 恢复。

## Codex Thread 边界

Controller planning 与结构纠正使用项目级 thread，Case review 使用 Case 级 thread。Worker thread key 为 `worker:{case_id}:{worker_type}:{workstream_id}`；`product`、`tech`、`diagnosis`、`implementation`、`verification` 和 `closeout` 分别形成语义通道，同类型且同 workstream 的后续 turn 可以复用，不同职责或独立目标不继承完整对话。

每个 fresh Worker packet 是当前唯一授权，并携带从 fresh Case State 派生的有界 context digest。跨 thread 的必要事实通过 canonical Case State、稳定事实文档、结构化 Worker report 和显式 prior report ref 传递，不依赖隐藏历史。基础设施失败使对应 key 失效并在重试时创建新 thread。

Controller Review 的报告引用先做确定性归一化：精确 ID 优先；带说明后缀的完整 ID 和唯一 `TASK-nn` 序号可以映射到本轮唯一报告。无法唯一映射的引用继续 fail closed，避免错误接受其他 Worker 报告。

## 命令单飞与等待

Codex adapter 对需要批准的 command 以规范化 `cwd + command` 建立进程内指纹。`cmake --build` 的并发度参数不参与指纹，因此同一 build tree 与 target 的 `-j4`、`-j2` 或 `--parallel` 仍视为同一活动构建。指纹从批准开始保持到对应 command item 完成或 turn 结束；相同指纹仍在执行时，后续请求被拒绝并产生 `duplicate_command` 软异常，不启动第二个进程。

命令开始、输出、完成与耗时通过现有 app-server item 事件持续投影。模型不需要通过重新启动同一构建或测试来确认进度；被抑制的调用可以观察当前活动 command 的 item ID、开始时间和已有输出。不同命令、不同工作目录以及前一命令完成后的再次执行不受影响。

## Token Usage 投影

`thread/tokenUsage/updated` 被归一化为可持久化的 `token_usage` 投影。每条快照至少包含：

- `thread_id`、`turn_id`、当前 round 与 lane。
- 逻辑总 Token、输入、缓存输入、非缓存输入、输出与 reasoning output。
- 最近一次模型请求的输入、缓存输入、输出和 `modelContextWindow`。
- 最新请求上下文占用比例与事件时间。

Lane 固定为 `controller`、`builder`、`verifier` 或 `commit`。Worker 的具体 `worker_type` 作为明细维度保留；Controller planner/reviewer/correction 归入 Controller。commit agent 的独立 Desktop Run 归入 Commit。

app-server 的 `tokenUsage.total` 是 thread 累计快照。Projector 对每个 thread 只保留最新累计值，Run 汇总为各 thread 最新值之和，不累加每次 notification。Turn 用量通过当前累计值减去该 turn 首次事件前的 thread 基线得到；同一 turn 的重复快照只更新结果，不重复计数。

Workbench 默认展示 Run 级逻辑总量、缓存输入、非缓存输入、输出和缓存比例，再按 lane、round、turn 下钻。逻辑总量用于理解模型工作规模，缓存与非缓存输入必须分列，不能把缓存命中伪装成同等新增上下文成本。

Automation Snapshot 从同一本地项目最近 20 个已完成 Runtime Run 计算逻辑总量、缓存/非缓存输入、输出和耗时的中位数基线，排除当前活动 Run。Workbench 显示样本数与相对中位数倍数；该基线用于趋势判断，不因任务复杂度不同而自动得出浪费结论，也不作为执行门禁。直接 Codex CLI 的可比真实任务样本可以进入后续外部基准，但不会被 Runtime 伪造或从缓存比例推断。

## 时间投影

Projector 记录每个 round、模型 turn 和 command item 的开始、结束与持续时间。Run activity 汇总模型 turn 累计耗时与 command 累计耗时，并保留最慢命令的命令、工作目录、lane 和 turn；进行中的命令保持无结束时间，Workbench 以活动状态持续展示。该投影用于区分模型思考、工具执行和外部构建等待，不通过额外模型调用轮询进度。

## 软异常

Runtime 保存可解释、非阻断的 `usage_warnings`。首批检测包括：

- 相同工作目录的等价 command 在前一实例完成前重复请求。
- 最近模型请求的输入接近模型上下文窗口。
- Controller Review 报告引用无法归一化或 review 失败。
- 同一 Case/type/workstream thread 的授权路径签名发生变化，需要检查 workstream 是否仍然连贯。

警告包含类型、lane、thread/turn 或 command item、检测时间和证据摘要。警告不改变 round outcome、Case resolution、`max_auto_rounds` 或 handoff，不触发基于固定 Token 总量的中断。后续治理可以基于历史分位数和直接 Codex CLI 基线增加趋势告警，但基线属于比较证据而不是执行门禁。

## Desktop IPC 与 Renderer

Preload 继续只暴露任务范围内的查询与动作。Automation Snapshot 的活动任务和最近完成项携带 `session_id`；Run activity 携带 `token_usage` 与 `usage_warnings`。Renderer 不自行解析 raw JSONL 或估算 Token。

Intervention Workbench 展示当前任务 ID、task session 和 Run 边界，并把 session message 与各 Run 的 projected messages 按时间合并。Token Inspector 展示分项汇总、lane 明细、上下文占用和软异常；只读审查不创建消息，人工提交仅写入当前 task session 和当前 Run message projection，并进入当前活动任务的 steer 或 fresh continuation。

## 恢复与兼容

旧 Store 中没有 `session_id` 的未完成自动化任务在恢复启动时创建一次专属 task session，并立即持久化；旧历史 run 保持原 session，不自动猜测拆分历史消息。无法证明任务归属的旧 transcript 标记为 legacy，不在新的待办 Workbench 中隐式展示。

session 创建成功但 Runtime 启动失败时保留 session，`retry_start` 复用它。任务完成后 session 与消息留作审查；删除项目时沿用项目级清理规则。退出登录只清除远端身份与快照，不删除本地 task session、Run activity 或用量历史。

## 验收口径

- 两个连续远端待办在同一项目中获得不同 `session_id`，Workbench transcript 不交叉。
- 同一待办的 intervention、continuation 与 commit 保持同一 Desktop session，历史入口打开 Case Runtime 而不是 commit Run。
- diagnosis 与 implementation 使用不同 Codex thread；同一 Worker 类型和 workstream 的后续 turn 可以复用，独立 workstream 不复用。
- 项目级 Controller planning 与 Case review 使用不同 thread；Worker packet 包含可从 canonical facts 重建的 context digest。
- 同一 `cwd + command` 的并发请求只批准一个进程，并留下可审查软异常。
- Token 快照按 thread 最新累计值去重，Run 与 lane 汇总可由 turn 明细重算。
- Round、turn 与 command 耗时可重算，Workbench 能指出最慢活动而不重复启动命令。
- Workbench 区分缓存输入、非缓存输入和输出，并展示上下文窗口占用。
- 任意用量警告都不会自动设置 Token 总上限、硬总轮次或终止 Case。
