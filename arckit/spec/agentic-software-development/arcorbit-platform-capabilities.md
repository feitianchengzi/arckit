# ArcOrbit 多产品研发平台能力规格

## 文档定位

本文定义 ArcOrbit 从自动化桌面客户端扩展为多产品软件研发平台时的有效产品边界。

平台保留 ArcOrbit、Workshop 待办服务和 Workshop 反馈产品的既有核心行为，在同一桌面入口中组合组织、产品、成员、待办、执行与反馈能力。

本文使用以下状态：

- **已有**：当前给定仓库中存在可定位的运行实现。
- **可接入**：现有服务或前端已经提供能力，但 ArcOrbit 尚未接入。
- **平台新增**：经确认的平台目标，当前产品尚未实现。
- **依赖合约**：客户端已声明合约，但给定服务端仓库不足以证明服务端实现。
- **不支持**：当前实现明确没有对应能力或只有无效占位。

## 产品边界

### 平台身份

ArcOrbit 是用于开发其他软件产品的本地桌面平台，不是 ArcOrbit 自身的介绍页，也不是待办和反馈网页的启动器。

用户在日常个人工作中通过 ArcOrbit 处理产品、待办、执行和反馈，不需要再登录待办或反馈网页端。

Workshop 服务继续保存团队共享的组织、项目、成员、待办和反馈数据。取消日常 Web 依赖不等于取消服务端协作数据。

本地项目目录是产品研发和 Agent 执行的首要锚点。服务端项目是团队协作记录与同步来源。

平台第一阶段集中贯通以下闭环：

1. 组织和产品成员形成协作范围。
2. 待办承接人工工作和自动化候选工作。
3. ArcOrbit 在绑定的本地项目中执行待办。
4. 用户反馈流转为待办，完成态待办可以产生验收问题。
5. 执行证据和状态写回同一产品上下文。

真实 Codex Chat 与 Idea、Release、Operations、Engineering 计划工作空间的边界由 `arcorbit-planned-workspaces.md` 定义。Chat 以一个已绑定本地目录的 Product Workspace 建立独立自由对话，不进入 Automation 或产品对象转换；Engineering 以可管理 Domain Profile 组合 State Model、预期/现状/诊断能力映射与生命周期解释，不展示 entry skills。Engineering 的编辑、比较和 Apply 控件不伪装为已接入的真实保存、安装或应用能力。

### Product Workspace

Product Workspace 是 ArcOrbit 的桌面组合对象，不是当前 Workshop 服务端新增的数据表。

一个 Product Workspace 至少组合：

- 一个 Workshop Project 标识及其组织、成员和协作数据；
- 一个 ArcOrbit 本地项目标识和绝对目录；
- 远端项目到本地项目的绑定；
- 本地 Project State、Case、Run、会话、证据和持久 Codex thread；
- 对应项目的待办和反馈投影；
- Desktop 拥有的参与自动领取设置和展示设置。

平台界面可以把 Workshop Project 呈现为“产品”，但 API、权限和持久标识继续遵守 Workshop Project 合约。

未绑定本地目录的远端产品仍可参与团队协作和待办、反馈管理，但不可进入本地自动执行。

### 多产品工作集

工作集是 Desktop 本地保存的多产品显示范围，不是产品切换会话，也不修改服务端成员或项目状态。

用户可以同时选择一个或多个 Product Workspace。

顶部产品集控件在 Today、Work、Automation 和 Feedback 中保持可用。它同时显示当前工作集名称、产品数量和当前观察范围，并支持在“项目集全部”与工作集内单个产品之间切换；“管理项目集”用于增删工作集成员，范围切换本身不修改工作集。

Today、Work、Automation 和 Feedback 使用同一个顶部观察范围并保留每条数据的产品归属。观察范围只改变当前推进页面的数据投影，不改变自动领取资格、项目成员关系、本地绑定、运行中的任务或持久 Codex thread。

Organization Center 提供完整组织、成员和项目管理入口，不受工作集裁剪。

当前活动执行即使所属产品被移出工作集，仍固定显示在全局执行状态中，直到安全结束或进入恢复。

改变工作集不停止运行、不改变自动参与授权、不改变任务状态，也不重建 Codex thread。

## 名词与现有模型映射

| 平台名词 | 当前事实对象 | 归属 |
| --- | --- | --- |
| 组织 | `Organization` | Workshop 服务 |
| 组织成员 | `OrganizationMember` | Workshop 服务 |
| 产品 | `Project` 的平台呈现 | Workshop 服务 |
| 产品成员 | `ProjectMember` | Workshop 服务 |
| Product Workspace | Workshop Project、本地项目和执行上下文的组合 | ArcOrbit Desktop |
| 本地项目 | Desktop `projects` 中的目录记录 | ArcOrbit Desktop |
| 工作集 | 多个 Product Workspace 的本地显示选择 | ArcOrbit Desktop |
| 待办 | `Task` | Workshop 服务 |
| 评论 | `TaskAttachment` 的 text/file/url 表现 | Workshop 服务与 Web 前端 |
| 用户反馈 | `Feedback` 及 V2 扩展合约 | Workshop 反馈产品 |
| 验收问题 | `acceptance_feedback_items` | ArcOrbit Desktop |
| 执行 | active task、Run、Case、Loop 和 thread 绑定 | ArcOrbit Runtime/Desktop |

平台不创建独立 Team 领域实体。Organization Center 是组织成员池和各产品成员关系的治理投影。

## ArcOrbit 既有核心

### 本地项目

ArcOrbit 支持用户在 Workshop Project 的项目绑定选择器中选择一个本地目录并添加为本地项目。全局侧栏不提供独立的“添加本地项目”入口。

本地项目 ID 由规范化绝对路径确定，同一路径重复添加更新同一项目记录。

添加或执行本地项目时，ArcOrbit 检查并初始化所需的 Arckit Project State。

Desktop 保存本地项目、会话、消息、Run 和自动化状态；Project/Case canonical state 继续保存在对应项目仓库中。

存在活动 Run 的本地项目不可移除。

### Workshop 登录与任务源

ArcOrbit 通过主进程处理 Workshop 验证码登录、token 刷新和退出，不向 Renderer 暴露访问 token。

验证码登录支持邮箱和短信目标。

Workshop 会话在访问 token 即将过期时刷新；首次启动支持恢复可刷新会话。

Workshop 会话超过七天没有有效登录活动后失效并要求重新登录。

退出登录遇到活动执行时需要明确确认；确认后先停止当前执行，再清理远端会话投影。

任务源支持 Workshop 登录、Bearer 调试和用户请求头调试三种认证模式。

全局侧栏底部使用当前用户头像作为账号入口，不单列“任务源”或“本地 Runtime”入口。账号页面保留任务源、会话和 Runtime 设置内容；Workshop 账户标题使用 current-user 资料中的平台显示名，不使用本地配置名、认证目标或任务源标签替代。

### 同步范围

ArcOrbit 获取当前用户、当前用户可见的独立项目、组织和组织项目。

ArcOrbit 对项目去重后，只同步能够识别当前用户项目成员 ID 的项目任务。

同步任务限定当前用户为执行者，并覆盖七种 Workshop 任务状态：

- `pending_review`
- `pending`
- `in_progress`
- `completed`
- `accepted`
- `cancelled`
- `blocked`

ArcOrbit 当前不是完整待办浏览适配器。未分配给当前用户、由当前用户创建但由他人执行、以及仅供项目全体查看的任务不进入现有任务源快照。

单个项目同步失败时，任务源可以进入 degraded 状态并保留该项目此前仍分配给当前用户的快照任务。

### 远端与本地绑定

每个 Workshop Project 可以绑定一个 ArcOrbit 本地项目。

绑定记录由 Desktop 保存，不回写 Workshop Project。

项目绑定选择器同时列出已有本地项目和“添加本地项目”动作。用户完成目录选择后，新本地项目立即进入同一选择器并可直接完成当前 Workshop Project 的绑定，不需要离开绑定流程。

每个 Workshop Project 还有独立的自动参与开关；新同步项目默认不参与自动领取。

项目只有同时满足本地绑定、自动参与和无项目级同步错误，才具备自动执行资格。

### 自动执行队列

全局自动领取开关控制是否领取新任务，不停止当前执行。

队列暂停只阻止领取下一项，不中断当前执行。

普通待办只有处于 `pending` 状态才进入自动候选队列。

队列排序先使用转换后的优先级，再使用状态变更或更新时间，最后使用项目和任务 ID 保持确定性。

Workshop 优先级数值以 0 为最高；ArcOrbit 当前将数值转换为越大越优先的内部排序分数。

领取前 ArcOrbit 重新读取候选任务，确认任务仍为 `pending`、仍分配给当前用户且版本未变化。

领取成功后远端任务写为 `in_progress`，再建立本地活动执行。

ArcOrbit 全局同时只允许一个 `active_task`。多产品工作集形成统一候选队列，但不改变单活动执行租约。

### 条件更新边界

ArcOrbit 在任务状态更新时发送 `If-Match`，并把 HTTP 409 或 412 解释为版本冲突。

当前 Workshop 待办 handler 没有读取 `If-Match`，Task 响应也没有独立版本字段；ArcOrbit 实际使用 `updated_at` 作为候选版本。

因此“读取后条件领取”在现有两端之间尚未形成可证明的服务端原子冲突保护。平台不得把此行为呈现为已经可靠的并发领取保证。

并发领取一致性需要通过 Workshop 服务端条件更新合约或等价的原子状态转换补齐，同时保持 ArcOrbit 的失败关闭和恢复语义。

### 一个待办一个持续线程

每个自动待办从第一次 Agent 调用开始绑定一个非临时 Codex thread。

thread ID 在首轮开始前持久化，后续 gap、验证、修复、Completion Review 和 Git closeout 复用同一 thread。

进程或 Desktop 重启后优先恢复已持久化 thread；只有确认持久化 thread 不存在时才允许建立替代 thread。

上下文使用达到阈值时在同一 thread 上执行压缩，不创建 Controller、Worker、Review 或 repair 的额外 thread。

一个待办的 Case 只有通过 trusted ledger 绑定才能成为权威绑定；Runtime 不根据目录中恰好存在的 Case 推断绑定。

远端待办只有在 canonical Case 已解决、同 thread closeout 完成后才进入远端完成写回。

### 人工介入与恢复

Workbench 展示 Agent/Loop 语义消息、简化工具活动、thread、token、压缩、命令、ledger 和 Git closeout 证据。

人工介入把用户补充的事实、授权或决策作为同一 thread 的新一轮输入，并恢复同一待办执行。

CLI handoff 只在已有权威 Case 绑定和持久 thread 时发生，并在同一 thread 中继续。

任务源冲突、外部状态变化、Runtime 丢失、readiness 失败和 closeout 失败进入 Recovery Center。

全局恢复项可以冻结新领取；恢复动作受当前恢复类型约束，不提供通用任意网络或命令桥。

### Setup Readiness

Desktop 在 Workshop 登录和自动执行之前检查安装包资源、ArcForge provider、Arckit skills 和 Codex。

首次安装或受管目标变化需要用户展开写入目标并确认计划摘要。

已变更的受管内容和 loader 冲突不被静默覆盖；清理 stale 受管路径使用独立确认。

Runtime 保持 policy-neutral，只显式绑定自然 `$using-arckit` Agent 入口和 trusted ledger entrypoints。

Runtime 不维护 Worker registry，不内置固定 skill 顺序、业务 gap、角色或预测路径。

## Workshop 待办与团队协作能力

### 身份、组织与项目治理

Workshop 业务服务依赖网关完成 JWT 或 API Key 认证，并从转发 Header 解析当前用户。

用户具有 UUID、用户名和头像；用户只能通过当前网关身份读取和更新自己。

组织、成员、项目、邀请、加入、权限投影、项目归属与分页的稳定行为由 `arcorbit-organization-management.md` 定义。

平台治理入口不受 Workset 裁剪；项目创建后的组织归属不在 ArcOrbit 中编辑；项目邀请只从项目上下文创建，并保持一次性结果边界。

当前 `POST /projects/:id/members` 缺少 caller 项目管理权限校验，ArcOrbit 不开放该接口。

### 待办

Task 属于一个 Project，并支持可选父任务、内容、七状态、创建者、可选执行者、完成时间、优先级、标签和软删除。

父任务必须属于同一项目，任务不能成为自己的父任务，父链循环检查上限为 20 层。

任何项目成员可以创建任务、查看项目任务和查看任务树。

任务列表支持状态、创建者、执行者、标签、优先级、时间范围、更新时间和父任务等筛选，并支持分页。

任务树要求开始和结束时间，时间范围不超过 100 天，并补全命中任务的父链与子树。

非 `in_progress` 任务可以由任何项目成员修改内容、状态、执行者、父任务、优先级和标签。

`in_progress` 任务只有当前执行者、项目 admin 或 owner 可以修改。

当前删除 handler 复用同一修改权限：非 `in_progress` 任务可由任何项目成员删除，`in_progress` 任务仅执行者、admin 或 owner 可删除。

进入 `completed` 或 `accepted` 时设置完成时间；离开这两个状态时清除完成时间。

执行者必须是项目成员，执行者字段可以显式清空。

优先级数值以 0 为最高，数值越大优先级越低；待办 Web 当前提供 0、1、2、3 四档显示。

标签既存在项目级 Tag 实体，也存在 Task 的逗号分隔标签字段；平台接入必须兼容这一现状，不能假设任务和标签已经是规范化多对多关系。

### 评论、附件和历史

TaskAttachment 支持 text、file、url 三种类型，待办 Web 把它呈现为任务评论与附件。

任何项目成员可以创建和查看任务附件。

附件只有创建者可以修改内容，附件类型不可修改。

附件创建者、任务创建者、项目 admin 或 owner 可以删除附件。

当前 Workshop 服务没有独立 TaskComment 模型。

待办 Web 声明了任务状态历史读取接口，但 Workshop 服务没有对应路由；404 被前端静默转换为空历史。

平台不得把空历史解释为“任务从未变更”。状态历史在服务端补齐前属于不支持能力。

### 实时和文件

Workshop 服务提供项目 WebSocket 入口，并在任务和反馈变更时发布项目事件。

项目成员可以管理项目标签。

Workshop 服务提供 OSS 临时凭证；任务附件和反馈文件引用继续使用现有受控访问方式。

## Workshop 用户反馈能力

### V1 已有能力

Feedback 属于一个 Workshop Project，包含唯一短 ID、标题、内容、可选自定义用户 ID、手机号、邮箱、文件引用和 `data` JSON 字符串。

项目成员可以创建、读取和更新反馈；项目 admin 或 owner 可以删除反馈。

查询反馈至少提供项目、短 ID、手机号、邮箱或自定义用户 ID 中的一项，并受当前用户项目成员范围约束。

API Key 路径允许 SDK 创建和查询反馈；项目反馈访问 key 由项目 admin 或 owner 管理。

V1 SDK 以 API Key、项目 ID 和稳定 custom user ID 提交反馈，并允许用户查看自己的反馈状态。

V1 的受理状态、用户状态、优先级、转待办 ID 和时间等扩展信息主要编码在 `data` JSON 中，而不是 Feedback 模型的独立列。

反馈控制台兼容多种历史字段和值，并在缺少优先级时默认显示 P2。

V1 控制台支持搜索、筛选、按时间或优先级排序、手动 P1/P2/P3、忽略、删除和人工确认转待办。

V1 转待办通过创建 Task 后把任务 ID 和状态写回 Feedback `data`，不是服务端原子转换。

V1 SDK 中的“AI 分析中”等时间线文案由 `data` 状态投影生成；给定仓库没有可证明的 AI 分析服务。平台不得把这些文案解释为已有 AI 聚类或自动判断能力。

### V2 客户端合约

V2 控制台和 SDK 客户端声明以下能力：

- `triage_status`：pending、accepted、ignored；
- `customer_status`：submitted、reviewing、developing、released、completed、ignored；
- 反馈与主任务 ID、任务状态的关联；
- 客户和开发者消息、system 消息及附件；
- 未读通知和已读回写；
- 服务端签发的上传策略和受限附件读取凭证；
- 忽略反馈；
- 服务端反馈转待办并返回反馈、任务和关系；
- 短期 feedback session token；
- 直接 API Key 模式。

Feedback SDK Web 的会话面板提供用户侧消息读取、文本或附件补充、刷新和已读回写；Feedback Console Web 的会话面板提供开发者侧消息读取、文本或附件回复、刷新和已读回写。两侧共享反馈消息、附件与通知领域，构成用户和开发者持续对话的完整产品能力。

V2 session 模式在 401 时请求受信任宿主刷新短期 token，并只自动重试一次。

V2 API Key 模式要求 apiKey、projectId 和 customUserId，并明确承担客户端可提取 API Key 的风险。

V2 消息附件通过上传策略上传；客户和开发者分别使用受范围约束的读取凭证。

Workshop Feedback SDK 与 Console 的生产客户端共同给出 `/workshop/v2/feedback` 会话、消息、附件、通知、忽略和转待办请求合约。ArcOrbit 复用 Workshop 登录身份承担开发者侧能力，不使用 SDK 用户侧 API Key 或 Project 107 身份。服务端实现仓库未出现在当前本地源码集合中，因此运行时请求结果仍是具体项目能力可用性的最终证据。

ArcOrbit 对当前 Workset 项目默认探测受限 V2 开发者能力；读取成功时展示消息、文本或附件回复、通知/已读、专用忽略和原子转待办，不以安装包环境变量中的项目 allowlist 作为日常对话能力门禁。某项目 V2 列表不可用时回退到 V1 反馈事实；消息、附件、通知或其他单项请求失败时只降级对应动作并呈现脱敏错误，通知失败不隐藏已经可用的消息与回复。

Workset Feedback 的开发者管理 V2 与 ArcOrbit 产品反馈中心使用的 Feedback SDK WebView V2 是两条独立集成。前者复用 Workshop 登录身份和 Platform Adapter 的固定领域命令，后者仍只服务固定 Project 107 的产品内反馈提交与查询。

### ArcOrbit 产品反馈中心

ArcOrbit 提供一个面向自身产品的“产品反馈”入口。该入口不受 Workset 或顶部产品观察范围影响，也不读写当前 Workshop Project 的 Feedback V1 管理列表。

产品反馈中心使用 Feedback SDK WebView V2。用户从同一入口在“提交反馈”和“我的反馈”之间切换；切换复用同一个 SDK 页面、项目配置和当前用户身份，不重复加载或重复配置。

ArcOrbit 当前采用 API Key 客户端直连模式，不把 SDK V2 session 字段或会话换取接口推断为已存在的宿主服务契约。项目必须使用 ArcOrbit 专用、可轮换且权限范围最小的 API Key；产品明确提示该 Key 在客户端运行期可被提取。

ArcOrbit 产品固定使用数字型 Project ID `107`，普通用户不选择、修改或配置反馈项目。项目专用 API Key 作为 Desktop 内置静态配置随客户端代码和打包产物分发，用户界面不展示配置页、Key 状态或轮换动作；轮换必须修改代码常量并重新构建发布。Key 不进入 URL、Renderer snapshot、日志或报告，但客户端持有者能够从源码、打包产物或运行时提取，因此只能使用可轮换、权限范围最小的项目专用 Key。

反馈归属使用当前 Workshop 登录用户的不可变业务用户 ID，不使用邮箱、手机号、昵称或可编辑显示名。未登录、身份无法解析、账号退出或切换时，旧身份不得继续用于反馈；用户重新建立有效登录身份后再打开产品反馈中心。

反馈 SDK 由独立受限的 Electron WebContents 承载，固定加载平台 SDK V2 HTTPS 页面。ArcOrbit 的 `file://` Renderer 不直接嵌入跨域 iframe，也不获得 SDK API Key、通用网络桥或远端页面 DOM 访问能力。

产品反馈中心启用 SDK V2 未读能力。顶部“产品反馈”入口只在未读数大于 0 时显示数字角标，超过 99 显示 `99+`；读取未读数不改变已读状态。SDK 发出 `feedback-sdk:unread-changed` 后，受限宿主重新调用 `getUnreadCount()`，账号退出或身份失效时清除旧账户角标。

## 用户反馈与验收问题不得混同

用户反馈来自 Feedback SDK 和 Workshop Feedback 服务，属于产品用户到研发团队的外部问题、建议和沟通。

验收问题由 ArcOrbit 用户对已完成待办提出，属于同一研发事项完成后的独立修复输入。

验收问题只允许源任务处于 `completed`。`accepted` 表示业务验收已经通过且当前没有待处理验收问题，不提供新的问题入口。

验收问题保持源任务为 `completed`，不把源任务改回 `pending` 或 `in_progress`。存在 queued、running、awaiting_human 或 blocked 验收问题时，待办不能进入 `accepted`；全部问题 resolved 或 cancelled 后才允许标记已验收。

每条验收问题具有独立 ID、状态、进展、Run 和 Case，并复用源待办的本地项目、会话和持久 Codex thread。

验收问题和普通待办共享一个全局执行租约，通过就绪时间确定下一次执行；验收问题不形成并发的第二个 active execution。

验收问题状态为 queued、running、awaiting_human、blocked、resolved 或 cancelled。

Workshop 用户反馈和 ArcOrbit 验收问题在平台中使用不同队列、来源标签和动作，不互相冒充服务端记录。

## 第一阶段平台能力

### Today

Today 以当前多产品工作集为范围，聚合活动执行、跨产品待办、用户反馈信号和需要人工处理的事项。

Today 不把 AI 表现为独立聊天角色，只显示产品内产生的分析、执行、证据和人工 Gate。

Today 的优先级聚合必须保留原始产品、任务状态、执行人和来源，不产生脱离源对象的新任务副本。

### Organization

Organization Center 以组织 → 成员 → 项目形成不受 Workset 裁剪的治理全貌，并提供个人项目同级范围。

组织角色决定项目可见范围；成员页只展示已有关系；项目邀请只在项目详情中生成。完整行为见 `arcorbit-organization-management.md`。

### Work

Work 提供当前工作集的跨产品待办视图，并支持完整项目待办管理。日常任务发现、多维筛选、任务树与子任务、完整详情、评论附件、任务字段维护和受控状态处置由 `arcorbit-work-management.md` 定义。

Work 面板内提供 `pending_review`、`pending`、`in_progress`、`completed`、`accepted`、`cancelled` 和 `blocked` 七种状态筛选。状态筛选与顶部产品集观察范围共同限定列表；它不作为主导航分组，也不改变自动队列顺序。

跨产品视图可以同时显示多个产品，不要求用户先切换到单个产品。

任务创建和编辑始终选择明确产品，并从该产品成员和标签中选择执行人及标签。

完整 Work 浏览范围与 Automation 候选范围分离：Work 可显示用户有权查看的项目任务，Automation 仍只领取当前用户执行的 `pending` 任务。

### Automation

Automation 复用 ArcOrbit 当前 Runtime、持久 thread、Case/Loop、Workbench、Recovery 和 closeout 核心。

Automation 按顶部产品集观察范围展示普通待办与验收问题队列，但全局活动执行和恢复状态不受该范围隐藏。

Automation 面板提供“仅看验收问题”筛选。开启后只展示验收问题队列、对应状态数量和进展，不把验收问题计入普通待办状态，也不改变两类工作的执行仲裁或来源待办终态。

每条候选明确显示远端产品、本地目录、参与授权、执行人、状态和不可执行原因。

平台扩展不得把 Runtime 改造成固定 Worker 流程，不得预先绑定业务 skill，不得为同一待办创建多个职责 thread。

### Feedback

Feedback 是开发者处理 Workshop 用户反馈的工作台，不是用户提交反馈或维护反馈原文的入口。页面不提供创建反馈，不允许编辑用户提交的标题、正文、身份、联系方式或附件，也不向开发者展示 V1、V2 等协议版本信息。

页面在顶部产品集观察范围内使用左侧反馈列表和右侧详情面板。列表支持按正文、短 ID 和用户信息搜索，按处理状态筛选，并按新旧时间或优先级排序；进入页面、切换范围或筛选导致原选择失效时自动选择首条结果，选择列表项只更新右侧详情。每条反馈始终占用一个稳定视觉行，结果只有一条时也不分配列表剩余高度。

列表保留内容摘要、产品来源、优先级、处理状态和未读提示。详情展示短 ID、完整正文、提交时间、用户标识与联系方式、附件、处理状态、关联待办，以及用户、开发者和系统消息。详情拥有独立的内部纵向滚动区域；阅读长正文、事实和沟通记录不会滚动或改变左侧反馈列表的位置。项目探测到开发者管理会话能力时，详情支持回复文本、上传回复附件、受控查看消息附件，并在打开会话后标记该反馈通知已读；读取或已读回写失败不隐藏已经取得的沟通记录。

反馈原文附件以及用户、开发者沟通附件中的图片在详情内默认加载并显示预览。单张图片拥有加载、已加载和失败状态；失败不阻塞正文、其他附件或沟通记录，并允许就地重试。用户点击已加载图片时，ArcOrbit 使用与 Work 评论图片相同的独立受控图片窗口，提供放大、缩小、适合窗口、实际大小、左旋、右旋、平移、重置和另存为；非图片附件继续使用受控外部打开能力。

开发者可以在详情中调整处理优先级、忽略反馈、刷新、删除有权限的反馈或确认转待办。已关联待办的反馈展示待办 ID，不再提供重复转待办，优先级改由关联待办管理。删除需要明确确认；所有动作以服务端权限和真实响应为准。

Feedback 只承载来自产品用户的问题、建议和沟通，不展示、不统计也不操作 ArcOrbit 验收问题。

不同目标环境的能力差异通过逐项目能力探测、动作是否可用、状态说明和恢复反馈表达，不在页面标题、列表、详情或提示中暴露协议版本。V2 双向会话合约由 Workshop Feedback SDK 用户端与 Console 开发者端共同定义；ArcOrbit 不把真实环境预验证或安装包环境开关作为显示这些能力的前置条件，但任何失败请求都必须按对应能力失败关闭。

反馈转待办由有权限的人确认，并保持 Feedback 与 Task 的产品归属和来源关系。

Feedback 不自动归并、不自动决定是否进入研发，也不声称已有 AI 分析服务。

已完成 Task 的验收问题只在 Automation 和 Work Task Inspector 中作为独立 ArcOrbit 队列处理。

## 权限与数据原则

ArcOrbit Renderer 只调用主进程暴露的有界领域 IPC，不获得通用网络桥或服务 token。

服务端权限是最终权限来源；Desktop 的按钮隐藏和本地角色判断只是交互约束。

工作集、远端本地绑定、自动参与、会话、Run、验收问题和恢复项属于 Desktop 本地状态。

组织、项目、成员、待办、标签、附件和 Workshop 用户反馈属于服务端共享状态。

Project/Case canonical state 属于本地项目仓库；Runtime 运行记录和 thread binding 属于 Desktop 数据目录。

平台不得通过复制服务端数据到本地形成第二个可写真相源。

离线时可以展示最近同步投影和本地执行证据，但远端修改动作必须明确失败或排队，不伪装为已同步成功。

## 验收边界

第一阶段平台达到可用状态时满足：

1. 用户在 ArcOrbit 内完成 Workshop 登录和会话恢复。
2. 用户无需打开待办 Web 即可管理有权限的组织、产品、成员和待办。
3. 用户无需打开反馈控制台即可完成目标项目的开发者反馈日常处理，包括检索、详情阅读、优先级与忽略、消息回复、回复附件、未读处理和转待办；项目能力不可用时按真实响应降级。
4. 用户可以建立、管理包含一个或多个产品的本地工作集，并在任意 ADVANCE 页面通过顶部产品集控件快速切换“项目集全部”或单个产品。
5. Today、Work、Automation 和 Feedback 使用同一个顶部观察范围并保留产品归属，同时不改变全局自动领取资格。
6. 每个可执行产品绑定一个真实本地目录和 Project State。
7. 自动化仍保持单活动执行、一个待办一个持久 thread 和 trusted ledger Case 绑定。
8. Work 的完整浏览范围不被错误收窄为 Automation 的当前执行人任务范围。
9. Work 面板承载七种待办状态筛选，主导航不显示 TASK STATUS；Automation 面板承载“仅看验收问题”筛选。
10. Feedback 只显示 Workshop 用户反馈；ArcOrbit 验收问题只属于 Automation，并与用户反馈保持独立对象、术语和队列。
11. 现有两端不一致或请求失败的接口不会以成功 UI 掩盖失败，包括条件更新、成员添加权限、任务历史和开发者管理 V2 请求。
12. 人工介入、恢复、Setup Readiness 和退出登录活动执行确认保持可用。
13. 平台新增状态不会修改 Workshop 原始项目、成员和任务语义。
14. 已登录用户无需配置反馈参数，即可从单一“产品反馈”入口提交 ArcOrbit 反馈并查看自己的反馈；该入口与 Workset Feedback、验收问题保持独立。
15. 未登录、身份无法解析、内置 Key 缺失或 SDK 未就绪时，产品反馈中心失败关闭并提供明确恢复动作，且不在 UI、URL、日志或 IPC 中泄露 API Key 或用户身份。
16. 产品反馈固定使用 Project ID 107；未读数为 0 时隐藏入口角标，非 0 时显示有上限的数字角标，读取未读数不触发已读回写，账号退出清除旧身份未读投影。
17. Feedback 以左侧列表和右侧详情组成开发者处理工作台；页面没有创建反馈、编辑反馈原文或协议版本信息。
18. Feedback 支持搜索、处理状态筛选、时间/优先级排序和稳定选择；项目探测到开发者管理能力时还支持用户/开发者/系统消息、回复附件、未读与已读、专用忽略和原子转待办，失败能力独立降级且不影响已取得的反馈事实。
19. Feedback 只有一条结果时仍保持单行列表高度；详情在自身区域滚动；原文和沟通图片默认加载，点击后与 Work 共用支持缩放、适配、实际大小、旋转、平移、重置和另存为的独立图片窗口。

## 当前验证基线

ArcOrbit 的 `npm run check` 是 Runtime 和 Desktop 的主要静态与 Node 测试入口。

当前基线全量运行 197 项测试，195 项通过、1 项跳过、1 项在全量并发运行中失败；失败文件单独运行的 10 项全部通过。该结果视为并发或时序稳定性风险，不视为全量通过。

Workshop 待办的 `go test ./...` 当前通过编译，但所有包均显示没有测试文件。API、权限和并发行为缺少自动化回归证明。

待办 Web、反馈 SDK 和反馈控制台均声明 `build:check`。当前检出目录未安装依赖，命令因 `tsc` 不存在而无法进入源码检查；该结果表示验证环境未就绪。

平台实现完成前需要建立可重复安装依赖的 Web 构建验证，并为新增主进程适配器、权限投影、跨产品工作集和服务契约增加自动化测试。

## Source Basis
- ArcOrbit：`runtime/arcorbit/README.md`、`runtime/arcorbit/src/task-source-adapter.mjs`、`runtime/arcorbit/src/automation-coordinator.mjs`、`runtime/arcorbit/src/desktop/desktop-store.mjs`、`runtime/arcorbit/src/desktop-run-manager.mjs`。
- ArcOrbit Desktop：`runtime/arcorbit/desktop/main.mjs`、`runtime/arcorbit/desktop/preload.cjs`、`runtime/arcorbit/desktop/renderer/index.html`、`runtime/arcorbit/desktop/renderer/renderer.js`。
- ArcOrbit 验证：`runtime/arcorbit/test/task-source-adapter.test.mjs`、`runtime/arcorbit/test/automation-coordinator.test.mjs`、`runtime/arcorbit/test/codex-app-server-adapter.test.mjs`。
- Workshop 服务路由与模型：`../../hoewo/workshop-todo/router/router.go`、`../../hoewo/workshop-todo/models/`。
- Workshop 服务行为：`../../hoewo/workshop-todo/handler/organization.go`、`../../hoewo/workshop-todo/handler/project.go`、`../../hoewo/workshop-todo/handler/task.go`、`../../hoewo/workshop-todo/handler/feedback.go`。
- 待办 Web：`../../hoewo/workshop-todo-website/frontend/src/App.tsx`、`../../hoewo/workshop-todo-website/frontend/src/pages/ProjectDetailPage.tsx`、`../../hoewo/workshop-todo-website/frontend/src/components/features/TaskDetailContent.tsx`、`../../hoewo/workshop-todo-website/frontend/src/lib/api/endpoints/`、`../../hoewo/workshop-todo-website/frontend/src/lib/permissions/`。
- 反馈控制台：`../../hoewo/Workshop-Feedbacks/webapps/feedback-console-web/src/components/features/FeedbackManagementDialog.tsx`、`../../hoewo/Workshop-Feedbacks/webapps/feedback-console-web/src/lib/api/feedbackV2Client.ts`。
- 反馈 SDK：`../../hoewo/Workshop-Feedbacks/webapps/feedback-sdk-web/src/lib/feedback/api.ts`、`../../hoewo/Workshop-Feedbacks/webapps/feedback-sdk-web/src/lib/feedback/v2.ts`。
- 产品方向：`arckit/pending/items/2026-07-14-ai-native-desktop-platform-prototype.md`、`arckit/pending/items/2026-07-14-ai-native-software-product-development-platform-blueprint.md`、`arckit/pending/prototypes/arcorbit-platform-next/README.md`。
