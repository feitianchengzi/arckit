# ArcOrbit 组织治理能力规格

## 文档定位

本文定义 ArcOrbit 平台中的组织、成员和项目治理能力。它与 `arcorbit-platform-capabilities.md` 的多产品推进能力并列：治理建立全貌，Workset 组织当下要同时推进的产品。

## 核心结果

用户在 ArcOrbit 内可以从组织逐层查看和管理成员、项目以及成员与项目的关系，不需要登录 Workshop 待办网页完成日常治理。治理数据仍由 Workshop 服务拥有，ArcOrbit 只组合读取投影与有界管理命令。

组织治理与具体项目推进解耦。当前 Workset 不能裁剪用户能够看到的组织、成员或项目管理范围，也不能冒充组织层级。

## 领域映射

- 组织：Workshop `Organization`；
- 组织成员：Workshop `OrganizationMember`；
- 产品：Workshop `Project`；
- 产品成员：Workshop `ProjectMember`；
- 推进连接：ArcOrbit 本地 repository binding、Workset membership、Automation participation；
- 当前用户权限：组织成员或项目成员记录中 `is_me=true` 的角色。

ArcOrbit 不创建第二套 Organization、Team、Product 或 Member 实体。

## 治理范围

### 组织范围

ArcOrbit 列出当前用户加入的全部组织，并完整读取每个组织的成员分页。

当前用户为组织 owner/admin 时，ArcOrbit 使用组织管理查询读取组织下全部项目。当前用户为 member 时，ArcOrbit 使用参与项目查询，只显示当前用户参与的组织项目，并明确标注“我参与的项目”。

组织接口未直接返回当前用户角色时，ArcOrbit 从组织成员列表的 `is_me` 记录派生角色。缺少当前用户成员记录时不授予管理能力。

### 个人与外部参与范围

无组织项目显示在“个人项目”范围。

用户以外部成员身份参与、但不属于其已知组织范围的项目也进入该范围，并标注“外部参与”；它不被错误投影为个人拥有。

### 项目归属

项目创建时选择个人或当前用户所属组织。创建后的组织归属在 ArcOrbit 中不可编辑。

Workshop 的历史更新请求仍包含临时 `organization_id` 字段，但 ArcOrbit 不调用该迁移能力。平台不能在没有完整成员、权限和审计迁移规则时允许改变项目组织。

Workshop 项目查询响应必须提供 `organization_id`，使 Desktop 能在分页、外部参与和多组织场景中确定性建立归属。

## 组织管理

任意已登录用户可以创建组织，创建者成为 owner。

owner/admin 可以修改组织名称和说明、生成组织邀请、移除其他非 owner 成员。只有 owner 可以删除组织和修改非 owner 成员的 admin/member 角色。

成员可以自行退出。owner 退出时由 Workshop 负责所有权交接；ArcOrbit 不在本地预测继任者。

组织邀请请求包含角色、可选有效小时和最大使用次数。接收者通过组织邀请码加入。成功后 ArcOrbit 重新读取服务端组织事实。

## 成员管理

成员页首先表达组织成员事实，再表达该成员已经存在的项目关系。

成员详情至少包含：身份、组织角色、加入时间、参与项目、项目角色、职责和外部成员标记。

成员页不生成项目邀请。Workshop 项目邀请是可转发的通用凭证，不绑定目标用户；把该动作放在成员上下文会制造“已邀请此人加入某项目”的错误含义。

成员与项目的全貌以只读关系矩阵表达。矩阵单元格不能调用直接添加成员接口。

## 项目管理

组织 owner/admin 可看到组织全部项目；普通组织成员只能看到自己参与的项目。无论哪种范围，每个项目都显示当前用户的真实项目角色。

创建项目写入名称、可选 Git URL 和创建时组织归属。创建者成为项目 owner。

项目 owner/admin 可以更新名称和 Git URL、生成项目邀请；只有 owner 可以删除项目。项目 owner 可以修改非 owner 成员的 admin/member 角色与职责；owner/admin 可以移除其他非 owner 成员；成员可自行退出。

ArcOrbit 不开放 `POST /projects/:id/members` 直接添加入口，因为当前 Workshop handler 没有形成 caller 项目管理权限校验。

## 项目邀请与加入

项目邀请只能从明确的项目上下文生成。表单和结果必须同时显示项目名称，避免用户不知道邀请属于哪个项目。

邀请请求允许选择 member/admin、有效小时和最大使用次数。邀请结果至少显示邀请码、邀请链接、角色、到期时间、使用上限和已使用次数。

邀请是通用凭证，不绑定某位组织成员。接收者在自己的 ArcOrbit 会话中输入邀请码加入项目；生成邀请本身不改变任何成员关系。

当前 Workshop 没有项目邀请列表、撤销或再次读取接口。因此 ArcOrbit：

1. 只在创建响应后展示一次完整结果；
2. 提供复制邀请码和链接；
3. 明确提示用户立即保存并通过合适渠道自行转发；
4. 不显示虚假的“待接受成员”或“邀请历史”；
5. 不声称能撤销已生成邀请。

加入成功、邀请码无效、已过期或已达使用上限都以 Workshop 响应为准。

## 推进连接

项目治理详情同时显示三种独立的 ArcOrbit 本地连接：

- repository binding：项目是否绑定本地项目目录；
- Workset membership：项目是否出现在当前多产品推进范围；
- Automation participation：是否允许自动领取该项目中分配给当前用户的待处理项。

修改任一连接不得隐式修改另外两项，也不得写回 Workshop 项目成员或归属。

## 分页契约

Workshop 列表接口的 `page_size` 上限为 200。ArcOrbit 对组织、组织成员、参与项目、组织全部项目、待办、反馈、标签和附件进行确定性翻页，直到：

- 已收集数量达到响应 `total` 或 `meta.total`；或
- 返回页数量小于请求页大小；或
- 返回空页。

ArcOrbit 不发送 500 并假定服务会返回全部结果。分页结果按稳定 ID 去重，保留服务端顺序。

## 权限投影

Renderer 的按钮可见性只用于减少无效操作。所有写操作都经主进程有界 IPC 到 Workshop，服务端权限仍是最终判定。

当角色事实缺失、组织成员列表失败或项目成员中没有 `is_me` 时，ArcOrbit 采用失败关闭：显示只读事实，不显示管理动作。

403 后保留已加载的只读数据并提示权限已变化；404 后刷新相应范围；401 回到不可绕过的登录门禁。

## 局部失败

Organization Center 分别记录 organizations、organization_members 和 organization_projects 的失败范围。一个组织失败不得清空其他组织或个人项目。

owner/admin 的“组织全部项目”查询失败时，不静默回退成“我参与的项目”并继续标注为全部；可以展示参与项目缓存，但必须明确标注降级范围。

邀请或加入成功后刷新失败时，界面说明“服务操作已成功，最新列表同步失败”，不得重放生成邀请或加入命令。

## 验收口径

1. Organization Center 不受当前 Workset 项目选择影响。
2. 用户可在个人项目和全部已加入组织间切换。
3. owner/admin 可见组织全部项目，member 只见参与项目且界面明确标注。
4. 组织概览能查看成员×项目关系矩阵。
5. 成员详情没有项目邀请入口，只显示已有项目关系和导航。
6. 项目详情中的邀请动作明确绑定项目，并在创建后展示一次完整结果与能力限制。
7. 用户可以在 ArcOrbit 内使用组织或项目邀请码加入。
8. 项目创建后不能在 ArcOrbit 中修改组织归属。
9. Workset、本地绑定和 Automation participation 是独立动作。
10. 所有列表完整消费服务端分页，不因数据超过 200 条而截断。
11. 不开放直接添加项目成员，不伪造邀请历史或撤销。

## Source Basis

- `../../hoewo/workshop-todo/router/router.go`
- `../../hoewo/workshop-todo/handler/organization.go`
- `../../hoewo/workshop-todo/handler/project.go`
- `../../hoewo/workshop-todo/handler/pagination.go`
- `runtime/arcorbit/src/workshop-platform-adapter.mjs`
- `runtime/arcorbit/src/platform-coordinator.mjs`
- `runtime/arcorbit/src/desktop/desktop-store.mjs`
- `runtime/arcorbit/desktop/renderer/`
