# ArcOrbit 与 Workshop 可靠实时同步方案

## 定位

Workshop 继续拥有项目、成员和任务的服务端事实。ArcOrbit 的 Work Sync 是 Workshop 待办同步的唯一客户端所有者：它通过主进程 Adapter 消费持久变更日志、项目级实时连接、REST 当前态和受控 mutation，并把确认结果原子写入本地可信待办投影。WebSocket 是低延迟唤醒通道，REST 是 Work Sync 的状态确认通道，周期对账是异常补偿通道；Work 页面和 Automation 都不直接访问 Workshop。

该方案不把实时 transport 放入 Runtime Kernel 或 Automation Coordinator。Work Sync、Workshop Realtime Adapter 与本地 Task Projection Store 位于 Electron main 进程；Runtime Kernel 不解析 Workshop 事件、不选择同步项目、不读取远端任务，也不从事件恢复人工 Gate。Automation 只消费 Work Sync 发布的本地任务状态变化，并把任务状态动作提交回 Work Sync。Renderer 只消费本地投影和连接健康，不持有凭据或通用网络能力。

## 一致性目标

- 已提交的项目变更拥有一个持久、单调递增且可重放的事件标识。
- 领域写入与事件记录位于同一数据库事务；不存在领域事实已提交但事件记录永久缺失的成功路径。
- 多个 Workshop 服务实例通过共享 PostgreSQL 事件表和提交后通知观察同一事件流。
- WebSocket 断线、服务实例重启和客户端休眠不会要求依赖瞬时内存消息恢复状态。
- Work Sync 对重复、乱序和连接边界竞态保持幂等，并通过 REST 或受控 mutation 响应确认服务端任务状态后更新本地投影。
- 项目成员权限撤销会终止该成员继续接收对应项目事件的资格。
- 实时同步、增量补取和周期对账均不能解除 `awaiting_human`。

## Workshop 持久事件模型

Workshop PostgreSQL 保存 `project_events`：

| 字段 | 语义 |
|---|---|
| `id` | 数据库生成的全局递增 `bigint`，同时作为事件游标 |
| `schema_version` | 事件 envelope 整数版本，初始值为 `1` |
| `project_id` | 事件所属项目 |
| `event` | `task.created`、`task.updated`、`task.deleted` 等稳定事件名 |
| `entity` / `subject_id` | 受影响实体类型和身份，用于诊断、去重和定向刷新 |
| `actor_id` / `actor` | 触发者稳定身份与事件发生时的展示快照 |
| `data` | 与事件类型对应的 JSON 快照；它是诊断和失效提示，不是客户端事实源 |
| `occurred_at` | 数据库接受事件的 UTC 时间 |

删除事件保留实体标识和删除时间。成员新增、删除等授权事件把目标用户写入 `subject_id`。事件固定保留三十天；清理只删除早于保留边界的事件，不改变仍存在事件的标识。`project_events` 至少具有 `(project_id, id)` 复合索引，支持按项目从游标开始顺序补取。事件 ID 是全局游标，因此服务使用全局事件日志的保留上下界判断游标是否仍可连续恢复，并在项目补取响应中返回该项目的可见边界；游标低于全局保留水位或高于全局最新 ID 都视为过期，不能把未来游标当成“没有新事件”。

事件表是实时接口和所有领域 mutation 的必需运行时 schema。服务提供独立、可重复执行的 `migrate` 命令，用 additive `AutoMigrate` 补齐事件表、字段和索引且保留既有业务数据；部署流程必须先成功执行迁移，再切换服务实例。普通服务启动无论是否启用自动迁移都会验证必需 schema，缺表、缺列或缺少 `(project_id, id)` 索引时关闭式失败，不能启动一个所有写请求随后才报错的实例。

## 原子写入与跨实例分发

所有产生项目事件的 mutation 使用同一 GORM transaction 完成领域变更和 `project_events` 插入。事务内调用 PostgreSQL `pg_notify`，payload 只携带事件 ID；PostgreSQL 在事务提交后投递通知，回滚事务不会产生可见事件。

每个 Workshop 实例持有独立 PostgreSQL LISTEN 连接。服务进程先建立 LISTEN、再读取初始全局事件基线，只有两步都成功后才开放 HTTP 监听；这消除了 HTTP 已可写而 dispatcher 尚未订阅的启动窗口。收到事件 ID 后，实例从 `project_events` 读取完整记录并广播到本实例对应项目房间。通知只承担低延迟唤醒；监听连接重建时，实例从自己的最近分发游标补查事件表，因此 LISTEN 短暂中断不会使仍连接于该实例的客户端永久漏失事件。

实例广播按事件 ID 递增进入每个客户端的有界发送队列。慢客户端不会在 mutation HTTP handler 内同步阻塞其他连接；发送队列溢出、写超时或权限失效会关闭连接，让客户端通过持久游标恢复。

## 项目实时接口

项目 WebSocket 保留 `GET /workshop/v1/user/projects/:id/ws`。握手继续使用 `workshop-ws` 与 `nebula-auth.<token>` 子协议，并在升级前验证当前用户仍是项目成员。

事件 envelope 增加 `id`、`schema_version`、`entity` 和可选 `subject_id`。`system.connected` 携带该项目当前 `latest_event_id` 与 `earliest_event_id`，使客户端判断是否需要补取或全量恢复。系统事件没有业务游标，不能推进客户端 checkpoint。

项目补取接口为 `GET /workshop/v1/user/projects/:id/events?after_id=<cursor>&limit=<n>`。它只允许当前项目成员访问，按事件 ID 升序返回不大于服务器限制的事件页、`next_after_id`、`latest_event_id`、`earliest_event_id` 和 `has_more`。`after_id` 早于全局保留边界或高于全局最新事件 ID 时返回稳定的 `EVENT_CURSOR_EXPIRED`，客户端必须执行项目级 REST 全量刷新，而不能假装已经连续消费。合法的全局游标即使大于当前项目最新 ID，也不能仅因该项目没有对应事件而被误判过期。

服务端在 `project_member.deleted` 事件提交后先向目标用户的现有连接投递该撤销事件，再从项目房间移除该用户连接；`project.deleted` 会在事件投递后关闭整个项目房间。成员变化的 subject 身份来自事件记录，不从自由 JSON 文本推断。

## Website 消费

Website 保留项目页面的一项目一连接模型。页面在 `system.connected` 后从项目级本地游标补取事件；没有游标或游标过期时使项目相关查询全部失效。实时事件与补取事件按 ID 去重，300 毫秒窗口继续合并 React Query invalidation。网络恢复、页面重新可见或访问 token 临近刷新窗口时主动重建连接。

Website 不把事件 payload 直接写入 Query cache。连接重建会先完成补取或全量失效，再恢复 `connected` 状态，避免断线期间变化永久停留在旧页面。Website 在读取本地 cursor 前先分类握手：旧握手直接进入 `legacy` 且整个连接代际都不读写 cursor；现代本地 cursor 高于握手 `latest_event_id` 时提交 `cursor_ahead` 全量失效，并把 checkpoint 精确重置到当前服务端基线。显式版本未知、版本 1 缺失 latest 或无版本却携带 latest 的歧义握手都关闭式断开。

## ArcOrbit Work Sync 与 Realtime Adapter

Electron main 进程的 Workshop Authenticated Service 向 Work Sync 和 Realtime Adapter 提供受控连接凭据与 token 刷新结果，不向 Renderer 或 Automation 暴露 token。Work Sync 独占同步范围计算、连接管理、REST 对账、任务 mutation 和本地投影提交；Realtime Adapter 只管理连接、游标、补取和失效信号，不调用 Automation。

同步项目集合是以下本地需求的并集：

- 当前 active Workset 中由 Work 页面观察的全部可访问项目；
- `automation.project_participation=true` 的项目；
- 所有当前活动执行所属项目。

Workset 切换只改变第一组观察范围，不取消 Automation 已授权项目的后台同步资格。Automation participation 和 active executions 只作为 Work Sync 的本地需求输入，Automation 不创建连接、不读取 REST，也不推进游标。登录代际、项目权限或需求集合变化时，Work Sync 确定性增删项目连接并清理失去资格的本地投影。

每个项目保存：

- 订阅模式 `unknown`、`resumable` 或 `legacy`；
- `resumable` 模式最近持久化确认的 Workshop 事件 ID；
- 连接状态 `idle`、`connecting`、`recovering`、`connected`、`reconnecting` 或 `degraded`；
- 最近事件时间、最近项目刷新时间和最近错误；
- 当前连接代际，用于拒绝退出或换号前的晚到消息。

连接成功后 Adapter 先检查 `system.connected`。握手包含受支持的 `schema_version` 与安全整数 `latest_event_id` 时进入 `resumable`：读取边界并补取 `(confirmed_id, latest_event_id]`，同时缓冲新到达的实时事件；若 confirmed cursor 高于连接基线，Adapter 向 Work Sync 提交 `cursor_ahead` 项目失效并把 cursor 重置到基线。补取完成后把缓冲与历史事件按 ID 合并、去重并顺序交付。只有 Work Sync 完成对应项目 REST 对账并原子提交本地投影后才推进持久 confirmed cursor；WebSocket 收到事件本身不能推进 checkpoint。

握手缺少 `schema_version` 和 `latest_event_id` 时进入 `legacy`：Adapter 不读取或写入 cursor，不调用事件补取接口，连接建立后先提交 `legacy_snapshot` 失效信号，随后接受无 ID 领域通知并逐项提交失效信号。旧连接断开期间的通知无需保留；重连时的 REST 当前态刷新建立新的正确基线。握手携带未知显式版本时失败关闭，不能静默降级为旧协议。

token 刷新、登录、退出和账户切换都会轮换连接代际。连接在 access token 到期前主动重建，重连采用指数退避，最大间隔三十秒。应用休眠、网络离线和主进程退出会关闭连接；恢复后先重连补取，由 Work Sync 对账并提交本地投影，再声明 `connected`。

## 本地 Task Projection Store

Work Sync 按登录 session epoch 和 project id 维护唯一的本地 Task Projection Store。每个项目保存可访问的七状态任务、父子关系、版本、执行人、标签引用、最近确认时间、confirmed cursor 和同步代际。投影写入以项目为原子边界；旧登录代际、旧连接代际或早于当前项目 revision 的结果不得覆盖较新投影。

Work 页面所有状态、搜索、成员、标签、优先级、日期和分页/窗口选择都从本地投影派生。切换状态或筛选只改变本地查询键，不触发 REST。没有对应本地数据时，页面显示由 Work Sync 管理的初始化或恢复状态；显式刷新只向 Work Sync 请求对账，不由 Renderer 构造远端查询。

WebSocket 事件、补取事件和本地成功 mutation 只向 Work Sync 提交项目或实体失效。Work Sync 在 300 毫秒窗口内合并同项目失效，读取必要的 Workshop 当前态并原子替换本地项目投影。事件 payload 只用于身份、诊断和失效范围，不直接写入 Task Projection Store。

Task Projection Store 可以保留 UI 最近成功数据并标记 stale，但只把已经完成当前登录代际初始对账、且未被权限撤销的任务发布到 Automation 消费投影。登录退出、账户切换、项目权限撤销和项目删除会关闭连接并清除对应 Automation 可见的本地任务状态；UI 缓存不得越过身份代际继续显示为可信状态。

## Automation Coordinator

Automation Coordinator 不拥有 Workshop Task Source、Realtime Adapter、REST 对账、项目游标或远端任务快照。它订阅 Work Sync 发布的本地任务状态变化，从当前执行人、participation、七状态和本地执行控制中派生候选队列，按规范化本地工作区建立 lane，并在目标 lane 空闲、没有 lane-scoped recovery/人工 Gate、全局控制健康且并发名额可用时调用调度入口。单项目投影错误只排除对应项目和 lane；身份失效或完整项目目录不可确认才冻结全部新领取。

Automation 的领取、阻塞、完成、取消和验收状态动作都提交给 Work Sync。Work Sync 调用受控 Workshop mutation，并只在服务端成功响应及必要对账完成后提交新的本地任务状态。服务端拒绝、冲突、权限变化或传输失败保持原本地任务状态，同时向 Automation 发布结构化失败或 recovery；Automation 不直接调用 `getTask()`、`listTasks()` 或 `updateTask()`，也不以远端响应作为自己的控制输入。

Automation 只有在观察到 Work Sync 已发布的目标本地状态后才创建、继续或收束 Runtime。例如领取请求成功后，Work Sync 发布 `pending -> in_progress`，Automation 才启动任务；完成请求失败时，本地状态不进入 `completed`，Automation 保持 recovery。该边界使所有远端一致性责任集中在 Work，而 Automation 的决定可由单一本地状态流复现。

全局目录与项目任务对账固定由 Work Sync 每十五分钟执行；应用启动、系统唤醒、网络恢复和 `legacy` 重连立即请求 Work Sync 对账。订阅断开时只自动重连，不创建一分钟或其他分钟级降级计时器。显式“立即同步”动作调用受控 `work-sync` 边界；Automation 页面可以展示或触发这一动作，但不能拥有其网络实现。

## 人工 Gate 与恢复边界

`awaiting_human` 是目标 workspace lane 内活动执行的关闭式控制状态。以下动作只能更新远端快照、连接健康或 recovery，不能清除该状态：

- Work Sync 发布的本地任务状态变化；
- 事件补取与游标推进；
- Work Sync 项目刷新或全局对账；
- 应用启动恢复、休眠恢复和网络恢复；
- Work Sync 发布的无状态变化重复确认。

只有携带目标 `execution_id` 的显式 intervention command 可以提交用户输入并把 `allowAgentResume` 设为真。若 Work Sync 在人工等待期间发布任务被取消、改派、阻塞或权限撤销的本地状态变化，Automation 让该 lane 进入外部变化 recovery 并安全停止对应 Runtime；它不会把该变化解释为用户确认，也不冻结其他健康 lane。

## 部署与回滚

Workshop 服务镜像提供基于公开 health route 的容器 readiness；由于进程只在 schema 校验、LISTEN 和初始事件基线成功后启动 HTTP，该 health 同时代表实例已具备接流量的实时基础。生产发布先保留运行中的旧容器，以候选镜像独立执行幂等 `migrate`，成功后才切换 Compose 服务；候选容器未在限定时间进入 healthy 时，把切换前保存的旧 image ID 重新标记为服务 tag 并恢复旧容器。新镜像以 Docker health 严格验证 Broker-aware readiness；首次升级回滚到尚未声明 Docker `HEALTHCHECK` 的旧镜像时，发布脚本改用容器内公开 HTTP health 等待恢复，避免把已恢复的旧服务误报为人工介入。迁移只做 additive schema 变更，不做自动 schema 回滚，因此旧镜像必须与新增事件表和索引兼容。

Website OSS 发布不清空目标 prefix，也不在发布成功后立即删除旧 hashed assets。发布顺序固定为 `assets/` 不可变资源、其他非入口文件、最后 `index.html`；任一入口前上传失败都会保留线上旧入口及其引用资源。`assets/` 使用一年 immutable 缓存，`index.html` 使用 revalidate，其他文件使用短缓存。构建日志只列出已配置的环境变量名，不输出值。

## 可观察性

Work Sync snapshot 暴露聚合连接健康、聚合订阅模式、各项目连接状态、现代模式游标、最近事件、最近项目刷新、最近全量对账和当前错误。Automation snapshot 只引用必要的本地同步摘要和任务状态，不拥有这些字段。Renderer 不接收 token、原始 WebSocket headers 或任意网络访问能力。

连接状态和恢复过程通过 `work.sync` 结构化事件及 Desktop Store 项目状态记录，至少包括连接状态、`resumable` / `legacy` 模式、现代模式 confirmed cursor、最近事件时间、最近项目刷新时间和错误。Renderer 将旧服务显示为“实时兼容连接”，将异常状态显示为“可立即同步”。这些诊断不进入 Agent conversation，也不作为 ledger 事实源。

## 验证边界

- Workshop model、transaction 和 handler 测试证明领域变更与事件记录同成同败。
- 从不含 `project_events` 的旧 schema 执行真实 PostgreSQL 迁移，证明迁移幂等、既有业务数据保留、复合游标索引真实存在，且迁移前的普通启动会关闭式失败。
- 两个独立 Hub/dispatcher 实例共享同一 PostgreSQL 测试库时都能观察同一提交事件。
- Broker 测试同步等待 LISTEN 与初始基线完成，不以固定 sleep 假定就绪；真实进程验收证明 HTTP 只在数据库 schema 和 Broker 都就绪后开放。
- WebSocket 测试覆盖成员握手、心跳、慢客户端关闭、成员撤销和项目删除。
- 补取接口覆盖顺序、分页、重复请求、无权限、低水位过期、未来游标过期，以及跨项目合法全局游标不被误判。
- Website 测试覆盖断线期间事件、重连补取、重复/乱序事件、过期及未来游标全量失效、旧握手分类与旧模式读取 cursor 前短路。
- ArcOrbit 测试覆盖 Workset 与 Automation 本地需求并集的订阅调整、退避、token 代际、项目去抖刷新、现代 cursor checkpoint、未来 cursor 重置、旧握手识别、歧义握手关闭、无 ID 通知刷新以及旧模式不读写 cursor。
- Work 测试证明七状态和多维筛选只读取本地 Task Projection Store，切换查询不调用 Workshop；WebSocket 失效、显式刷新和周期对账才触发受控远端读取。
- Desktop main 与 Renderer 验证不存在一分钟同步计时器，Work-owned 十五分钟对账、生命周期同步和显式“立即同步”入口可用。
- Automation 测试证明 Coordinator 没有 Workshop Task Source 或 Realtime Adapter 依赖，只响应 Work 发布的本地状态变化，并把状态动作提交给 Work。
- Automation 测试证明本地状态变化、重连、全量对账和启动恢复都不能解除目标 lane 的 `awaiting_human`，只有指向同一 `execution_id` 的显式 intervention 能继续任务，其他 workspace lane 可以继续运行。
- 真实链路验收至少包含一次 Workshop mutation、WebSocket 通知、Work Sync 本地投影提交、Automation 候选变化和失败不推进本地状态，并保留可诊断事件证据。
- 部署验证覆盖迁移失败不停止旧容器、候选容器 unhealthy 自动恢复旧镜像、无 Docker health 元数据的旧镜像通过公开 HTTP health 确认恢复，以及 OSS 资源上传失败不替换入口、成功时入口严格最后上传。
