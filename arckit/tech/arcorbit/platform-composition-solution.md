# ArcOrbit 平台组合技术方案

## 定位

ArcOrbit 平台组合层把 Workshop 的组织、项目、成员、待办和普通用户反馈，与 ArcOrbit 已有的本地项目、Automation、Workbench、人工介入、恢复和验收反馈组合在同一个 Electron Desktop 中。

平台组合层不替代 Workshop 服务，不复制远端领域实体，也不进入 Runtime Kernel 的语义决策。它提供远端领域读取与显式命令、本地 Product Workspace 组合、多产品 workset 投影和平台级导航。

Product Workspace 是一个本地组合对象：

```text
Workshop Project
  + local repository binding
  + automation participation
  + local presentation preferences
  = ArcOrbit Product Workspace
```

Workshop Project 继续是服务端项目事实。ArcOrbit 不创建第二种 Product 或 Team 服务端实体。界面中的“产品”是 Project 的产品化呈现；“团队”由 Organization、OrganizationMember、ProjectMember 和邀请关系共同投影。

## 受保护边界

平台组合不得改变以下 Runtime 事实：

- Automation Snapshot 只包含当前登录用户作为执行人的待办。
- 自动候选只来自 `pending`。
- 项目必须同时具备本地绑定、显式 participation 和健康任务源状态。
- 全局最多存在一个活动 execution。
- 普通待办队列与验收反馈队列身份独立，由既有仲裁器确定下一 execution。
- 每个自动待办从首个 turn 到 Case closeout 只使用一个持久 Codex thread。
- ledger snapshot、Case binding、Transition、Completion Review 和 closeout 继续走 trusted entrypoint。
- 验收反馈继续留在本地独立记录中，不写入 Workshop 普通反馈表，也不改写已完成或已验收来源待办。

平台读取“全部与我相关的待办”或项目完整待办列表时使用独立的领域查询，不扩宽 Automation Task Source Adapter 的 executor 过滤。

## 组件

```text
Renderer platform shell
  -> restricted preload API
    -> Platform Coordinator
      -> Workshop Platform Adapter
      -> Desktop Store v11
      -> existing Automation Coordinator snapshot/commands
      -> existing Desktop Run Manager

Workshop Platform Adapter
  -> Workshop Authenticated Service request boundary
  -> paginated organizations / organization projects / participating projects / members / tasks / feedback V1
  -> optional Feedback V2 external capability
```

### Workshop Authenticated Service

现有 `createWorkshopTaskSource` 实例继续由 Electron main 进程单例持有，并继续管理 NebulaAuth 登录、刷新单飞、七日不活动窗口、401 单次重放和私有 token 设置。

平台领域请求复用该实例内部的 authenticated request 能力。Renderer 不获得 token、debug headers、原始认证响应或可构造任意 URL 的通用请求接口。

### Workshop Platform Adapter

Workshop Platform Adapter 暴露业务语义方法，不暴露 HTTP passthrough：

- `listOrganizations()`：完整分页读取当前用户加入的组织。
- `listOrganizationMembers(organizationId)`：完整分页读取组织成员；Coordinator 从 `is_me` 记录派生当前角色。
- `listOrganizationProjects(organizationId, visibility)`：owner/admin 走 `/organization/projects` 读取全部项目，member 走 `/projects` 读取参与项目；每个响应都补全查询范围中的 `organization_id`。
- `listPersonalProjects()`：使用现有 `/projects?organization_id=0` 读取无组织与外部参与项目；当前成员的 `is_external` 区分外部参与，不要求响应新增组织字段。
- `listProjects()`：保留给既有 Automation Task Source，返回当前用户参与项目，不作为组织治理的唯一目录。
- Project 响应内的 `members` 归一化为项目成员投影，包含 `role`、`duty`、`is_external` 和 `is_me`。
- `listProjectTasks(projectId, filters)`：读取项目完整待办集合，不应用 Automation executor 限制。
- Organization / Project 的 create、update、delete、invite、join 和受支持的 member role/delete 显式方法。Project update allowlist 不包含 `organization_id`。
- `createTask(input)`：创建待办。
- `updateTask(taskId, input)`：更新服务端当前支持的字段。
- `deleteTask(taskId)`：按服务端现有权限执行删除。
- `listTaskAttachments(taskId)`：读取作为评论/附件使用的记录。
- TaskAttachment 的 create、update、delete 显式方法。
- Project Tag 的 list、create、update、delete 显式方法；Task 的逗号分隔 `tags` 字段保持原样。
- `listFeedbackV1(projectId, filters)`：读取普通用户反馈 V1。
- Feedback V1 的 create、update、delete 显式方法；priority、ignored 和 task 关联继续合并在 `data` JSON 中。
- Coordinator 的 `feedback.to_task`：编排“创建 Task，再把 task id/state 写入 Feedback data”的非原子流程；关联失败的错误必须携带已创建 task id。

所有列表方法使用 `page_size=200` 逐页读取，以响应 `total`/`meta.total` 或短页作为终止条件，并按 ID 去重。第一生产实现不调用没有服务端证据的邀请列表、邀请撤销和任务历史接口。

### Platform Coordinator

Platform Coordinator 负责组合远端领域投影和本地平台状态。它不负责领取待办、启动 Runtime、仲裁 execution 或修改 Case。

它提供：

- 平台 snapshot 的并发读取、完整分页、去重和错误分区。
- 不受 Workset 影响的组织 scope、个人项目、组织角色和成员×项目关系投影。
- workset 创建、重命名、项目选择和删除。
- Product Workspace 本地绑定与 presentation 状态。
- 组织、成员、项目、待办和反馈的显式命令校验。
- 与 Automation Coordinator snapshot 的只读合并。
- 对 Platform mutation 完成后的定向刷新。

Platform Coordinator 不持久化完整组织、成员、待办或普通反馈镜像。远端响应保存在当前进程的有界缓存中；应用重启、登录身份代际变化或显式刷新会重新读取权威服务。

## 本地状态

Desktop Store 升级为 version 10，新增顶层 `platform`：

```text
platform
  active_workset_id: string
  worksets: Workset[]
  workspace_preferences: map<remote_project_id, WorkspacePreference>
  feedback_v2: FeedbackV2Configuration
```

### Workset

Workset 字段为：

- `id`：本地稳定 UUID。
- `name`：用户可见名称。
- `project_ids`：有序且去重的 Workshop Project id 列表。
- `created_at`：ISO 时间。
- `updated_at`：ISO 时间。

默认 workset 的名称为“当前产品集”。首次迁移时，它包含已有 `automation.project_bindings` 的远端 project id；没有绑定时为空。Workset 为空表示用户尚未选择展示产品，不表示展示全部产品。

同一个 Project 可以出现在多个 workset 中。删除 workset 不删除远端 Project、本地 repository、Automation binding、participation、run、session、thread 或反馈记录。

`active_workset_id` 只决定当前平台投影。它不改变 Automation 全局候选范围。Automation 继续读取所有 participation 为 true 的绑定项目，避免“切换视图”意外改变后台执行授权。

### WorkspacePreference

WorkspacePreference 以远端 Project id 为键，字段为：

- `pinned`：在 workset 中优先展示。
- `color`：可选的本地识别色 token 名，不保存自由 CSS。
- `last_opened_at`：最后打开时间。

本地 repository binding 和 automation participation 继续使用既有 `automation.project_bindings` 与 `automation.project_participation`，不复制到 `platform`。

### FeedbackV2Configuration

Feedback V2 默认状态是 `unavailable`。安装包或受信设置显式提供开发者管理 V2 adapter 配置后，状态可以进入 `available`；Workshop Feedback 控制台的 `feedbackV2Client`、项目开关和开发者会话组件是该 adapter 的采用契约，不要求在实现或启用前另行完成真实环境 API 验证。首次实际请求的路由、认证、权限或响应错误使对应能力进入 `degraded`，不会被包装为成功。

字段为：

- `status`：`unavailable | checking | available | degraded`。
- `endpoint_origin`：只保存已校验 origin，不保存 session token 或 API key。
- `checked_at`：最后一次成功的受限 V2 领域请求时间。
- `features`：消息、附件、通知、已读标记和 convert-to-task 的布尔能力投影。
- `error`：脱敏的可恢复错误。

V2 凭据由 main 进程私有认证边界持有，不进入公开设置或 Renderer snapshot。

## 平台 Snapshot

`getPlatformSnapshot(input)` 接受：

- `workset_id`：缺省使用 `active_workset_id`。
- `sections`：`overview | organizations | members | tasks | feedback` 的显式集合。
- `task_filters`：状态、执行人、创建人和关键字。
- `feedback_filters`：V1 优先级、忽略状态和关键字。

返回值包含：

- `generated_at` 和 `source_status`。
- 当前用户的公开身份投影。
- `worksets`、`active_workset` 和可访问项目目录。
- 当前 workset 内的 `product_workspaces`。
- 请求 sections 对应的组织、组织 scope、个人项目、项目成员、待办和普通反馈。
- 既有 Automation health、队列、活动 execution、attention、recovery 和验收反馈计数。
- `capabilities`，明确每项功能是 `available`、`read_only`、`unavailable` 还是 `degraded`。
- `errors`，每项绑定 section 和 project id，允许部分成功。

Product Workspace 投影包含：

- 远端 Project id、名称、描述、organization id 和 Git URL。
- 当前用户的 Project role。
- 本地 project id、名称和路径。
- binding、participation、source health 和 Automation eligibility。
- 七状态待办计数、当前用户待办计数和普通反馈计数。
- 活动 execution、attention、recovery 和验收反馈摘要。

所有跨产品聚合项必须保留 `project_id` 与 `project_name`，不允许把不同产品的待办、成员或反馈合并成失去来源的同名记录。

Organization scope 投影包含：

- Organization 事实、当前用户组织角色和 `all_projects | participating_projects` 可见性；
- 完整组织成员与当前可见项目；
- 每个项目的成员、当前用户项目角色和三种本地推进连接；
- 区分组织范围失败的 `errors`，不得用参与项目静默冒充全部项目。

`personal_projects` 包含无组织项目和当前成员标记为 `is_external` 的外部参与项目。组织范围查询的 Adapter 使用请求中的 organization id 补全本地投影；现有 Workshop 响应不需要增加 `organization_id`。

## IPC

Preload 新增以下产品动作：

- `platformSnapshot(input)`
- `refreshPlatform(input)`
- `createWorkset(input)`
- `updateWorkset(input)`
- `deleteWorkset(worksetId)`
- `setActiveWorkset(worksetId)`
- `setWorkspacePreference(projectId, input)`
- `executePlatformAction(command, input)`：只接受 Coordinator 内的固定业务命令 allowlist。

当前平台命令边界覆盖 Organization / Project 管理、邀请、邀请码加入、受权限约束的成员修改/移除、Task CRUD、TaskAttachment CRUD、Tag CRUD、Feedback V1 CRUD、`feedback.to_task`，以及开发者管理 V2 的消息读取/回复、回复附件上传策略/受限读取、通知读取/已读、专用忽略和原子转待办。每一项 V2 命令都是固定领域动作，不接受 Renderer 传入 URL、header 或凭据。边界明确不包含 `project.member.add` 或项目组织迁移。

IPC 参数使用结构化对象。main 进程通过固定命令 allowlist 与 Adapter 重新验证 id、枚举、长度和允许字段，不接受 Renderer 传入的角色或 capability 作为授权事实；Workshop 服务仍执行最终登录与权限判定。

现有 Automation IPC 保持原名和行为。平台 shell 调用 `updateAutomationTaskState` 时仍受当前 executor、最新远端状态和既有 Coordinator 校验约束；普通项目管理待办更新走 Platform Adapter，不伪装成 Automation 命令。

## 权限

Workshop 服务是最终授权方。ArcOrbit Renderer 根据已读取角色隐藏或禁用明显不可用动作；main 进程只接受白名单命令并校验输入形状，不能把 Renderer 传入的角色声明当作授权依据。

已确认的前置规则为：

- Organization 和 Project 角色是 `owner | admin | member`。
- ProjectMember 还包含 `duty` 和 `is_external`。
- Organization / Project 的 owner/admin 可以编辑与邀请；只有 owner 可以删除实体和修改非 owner 成员角色。
- Project member 的 role/duty 更新 endpoint 只有 owner 可用；owner/admin 可以移除其他非 owner 成员，成员可以自行退出。
- 任意 Project member 可以读取和创建 Task。
- 非 `in_progress` Task 的现有服务规则允许 Project member 修改。
- `in_progress` Task 只允许 executor、admin 或 owner 修改。
- Attachment 创建对 Project member 开放；更新只允许创建人；删除允许创建人、Task 创建人、admin 或 owner。
- Feedback V1 的服务端权限继续由现有 handler 判定。

`POST /projects/:id/members` 的当前服务实现未验证 caller role。ArcOrbit 不把这一缺口当作授权能力：第一生产实现不暴露直接添加成员命令，只展示成员和使用已有邀请创建/加入路径中已验证的部分。服务端补齐授权并有测试证据后才开放直接添加成员。

## 普通反馈与验收反馈

平台保持两条互不替代的反馈线：

- 普通用户反馈来自 Workshop Feedback V1 或采用前端客户端合约的 V2 服务，服务端拥有记录。
- 验收反馈来自 ArcOrbit 对 completed/accepted 自动待办的本地记录，复用来源 thread，以新 Run 和新 Case 执行。

V1 的 `priority` 是人工 P1/P2/P3；AI-looking status 只是 `data` JSON 的 UI 投影，不得标记为 AI 服务结论。

V1 convert-to-task 是可恢复但非原子的客户端编排：

1. 创建 Task。
2. 成功后更新 Feedback data 中的 task id 和 task state。
3. 第二步失败时返回 `task_created_feedback_link_failed`，包含新 Task id，并提供“重试关联”动作。
4. 重试只更新 Feedback，不重复创建 Task。

V2 客户端契约的 triage status、customer status、消息、回复附件、通知/已读、专用忽略和原子 convert-to-task 只有项目开关启用且 capability 为 `available` 时进入 Renderer。该契约直接来自 Workshop Feedback 控制台前端，不以真实环境预验证作为实现门禁。请求失败时对应 capability 进入 `degraded`；已取得的 V1 或 V2 列表、详情和消息保持可见，不生成兼容性假数据。

开发者管理 V2 复用 Workshop 登录身份和 main 进程认证边界，不调用 ArcOrbit 产品反馈中心的 SDK WebView、Project 107 或 bundled API Key。两条集成不共享窗口、凭据、未读状态或命令入口。

## 一致性与 Mutation

远端读取采用每个 section 独立的请求代际。后返回的旧代际响应不得覆盖当前登录身份或较新的显式刷新结果。

Automation 的任务领取继续使用现有 expected version 语义。当前 Workshop 服务没有证据支持 `If-Match` 原子条件更新，因此 capability 标记为 `weak_claim_consistency`；Adapter 在 mutation 前重新读取并拒绝状态、executor 或 version 已变化的 Task。

平台普通 Task mutation 不声称原子乐观锁。成功响应替换相应缓存项；409、412、404、401、403 和 transport error 分别投影为 conflict、not_found、unauthenticated、forbidden 和 retryable_service_error。

所有 destructive command 必须带明确目标 id。删除 Task 前 Renderer 请求确认，main 再读取当前 Task 和 Project member 上下文；服务端拒绝保持权威，不在本地移除记录。

## 刷新与缓存

平台远端缓存按登录 session epoch 隔离：

- 登录、退出、token 明确失效时清空。
- 组织/项目目录显式刷新后替换完整目录。
- Task、成员和 Feedback 以 project id 分区。
- mutation 成功后只使受影响分区失效并重读。
- transport failure 保留最近一次成功的内存投影并标记 `stale`，不写入 Desktop Store。
- 应用重启后不把旧远端数据当作离线权威数据。

平台 snapshot 的部分 section 失败不冻结 Automation。只有既有 Automation Coordinator 的 recovery/attention 或任务源身份错误影响自动 execution。

## 迁移

Store v9 到 v10 的平台组合归一化保持幂等；v11 在 automation snapshot 增加兼容的项目级 realtime 状态与 confirmed cursor：

1. 保留 `projects`、`runs`、`sessions`、`messages`、`settings` 和 `automation` 原值。
2. 创建一个默认 workset。
3. 默认 workset 的 `project_ids` 取 `automation.project_bindings` 的键，按远端 id 稳定排序。
4. 初始化空 `workspace_preferences`。
5. 初始化 `feedback_v2.status=unavailable`。
6. 写回时统一输出 version 10。

迁移不改变 participation，不启动同步，不调用远端服务，也不删除未知项目 binding。归一化测试覆盖 v9、空 store、重复 project id、缺失 platform、v10 到 v11 和已存在 v11 的重复读取。

## 平台 Shell 投影

Renderer 的顶层导航按职责分组：

- Today：当前 workset 的跨产品待处理、风险、活动 execution 和需要人工处理项。
- Work：当前 workset 的跨产品七状态待办视图。
- Automation：既有队列、活动 execution、Workbench、人工介入和恢复。
- Feedback：普通用户反馈与验收反馈的明确双栏或双标签视图。
- Organization：不受 workset 裁剪的组织 → 成员 → 项目治理中心，并包含个人项目 scope。

workset 控件是推进页面的多选集合，不是 product switch。它通过顶部独立覆盖层编辑，不与项目治理列表混合；后台 Automation 授权不随界面选择改变。

Organization 的成员详情只呈现已有关系。项目邀请只从项目详情打开，结果覆盖层显示项目、code/link/role/expiry/max uses，并声明一次性与不可撤销边界。

## 失败与恢复

- `unauthenticated`：平台远端 section 清空并进入登录；本地 workset、binding、run 和 thread 保留。
- `partial_sync`：成功 section 正常展示，失败 section 显示项目级重试。
- `project_removed`：从可访问目录消失的 Project 在 workset 中标记 unavailable；用户确认后可从 workset 移除，本地 repository 不删除。
- `member_context_missing`：保持只读，不推断 member 权限。
- `organization_projects_limited`：普通成员明确显示参与项目范围，不标记为失败。
- `organization_projects_failed`：owner/admin 全量查询失败时标记对应组织降级，不回退后伪装成全量。
- `task_conflict`：刷新 Task，保留用户未提交编辑草稿，由用户重新确认。
- `feedback_link_failed`：保留已创建 Task id，只重试 V1 Feedback 关联。
- `feedback_v2_unavailable`：项目未启用或 adapter 未配置时继续使用 V1 能力，不改变 V1 数据。
- `feedback_v2_degraded`：消息、附件、通知、忽略或原子转待办请求失败时只降级对应动作，保留已取得事实并返回脱敏错误。
- `automation_recovery`：继续由既有 Coordinator actions 处理，Platform Coordinator 不复制恢复动作。

## 安全

- Renderer 不能访问 Workshop token、V2 session token、API key、任意 URL fetch 或文件系统通用写接口。
- 本地 repository path 只来自既有目录选择和 Run Manager 项目记录。
- Project id、Task id、Feedback id 和 member id 在 main 进程归一化并限制为标量字符串。
- 普通反馈正文、附件名和 Task content 作为不可信文本渲染，不进入 `innerHTML`。
- 服务错误在公开 snapshot 中脱敏，不包含请求 headers、token 或完整原始 payload。
- Platform Adapter 的 mutation allowlist 不接受 caller 注入 `creator_id`、任意 role 或服务端拥有字段。

## 验证边界

实现验证至少覆盖：

- Store v9 到 v11 迁移及重复归一化。
- workset 多选、空集合、单产品、多产品、删除和 active fallback。
- workset 改变不改变 Automation participation 或候选范围。
- Platform Adapter 的组织、项目、成员、完整待办和 V1 feedback 归一化。
- 所有分页列表超过 200 条时继续翻页，且不会重复记录。
- owner/admin 与 member 的组织项目查询路由、可见性和失败关闭。
- 成员页不存在项目邀请，项目页邀请带明确项目和一次性生命周期提示。
- 组织/项目邀请码加入后重新同步；Project update 不发送 `organization_id`。
- Automation Task Source Adapter 仍只返回当前 executor 待办。
- main IPC 参数拒绝、未认证、权限保守 gate 和错误投影。
- V1 convert-to-task 成功、创建失败、关联失败和只重试关联。
- V2 项目开关与 capability 门禁；未启用时不渲染 V2-only 动作。
- V2 消息读取与回复、附件上传策略与受限读取、通知已读、专用忽略和原子转待办的成功、权限拒绝、对象不存在及网络失败。
- V2 某一动作失败时保留已加载列表、详情、消息与回复草稿，且 Renderer 无法传入 URL、header、token 或 API key。
- 平台 partial sync 不阻断健康项目和既有 Automation。
- 既有单全局 execution、persistent thread、双队列和 closeout 测试全部通过。

Web 仓库 build 只有在依赖安装后才构成源码验证。Workshop Todo 当前 Go 包缺少业务测试，`go test ./...` 只证明编译通过；平台适配器测试使用记录下来的实际响应形状与服务错误码，但不替代服务端授权和并发测试。

## 已知外部契约缺口

- Workshop Todo 未实现可证实的 `If-Match` 条件更新，自动领取只能声明弱一致。
- Project 直接添加成员 handler 未验证 caller role，ArcOrbit 不开放该动作。
- Workshop 项目查询响应不包含 `organization_id`；平台从组织范围请求上下文补全归属，并从项目成员的 `is_external` 标记识别外部参与，不修改服务端响应契约。
- Workshop 项目邀请缺少列表和撤销接口，ArcOrbit 只显示创建响应的一次性结果。
- Task history 缺少服务端实现，ArcOrbit 不展示伪历史。
- Feedback V2 服务端不在已提供仓库中；Workshop Feedback 控制台前端请求形状是 ArcOrbit 采用的开发者管理契约，真实环境预验证不是实现门禁，运行时错误由 capability 降级和失败关闭表达。
- V1 convert-to-task 非原子，需要显式恢复状态。
- Web 前端验证环境缺少已安装 TypeScript 工具链，不能把未运行 build 视为通过。

这些缺口不改变 ArcOrbit Runtime Kernel。它们由 Platform Adapter capability、错误投影和受限动作隔离；开发者管理 V2 的实现依据已采用的前端客户端契约，服务错误不扩宽 Renderer 或凭据边界。
