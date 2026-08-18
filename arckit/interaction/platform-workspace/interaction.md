# ArcOrbit Platform Workspace - 交互规范

## 产品定位

ArcOrbit 是在本地项目上开发多个软件产品的平台。Today、Work、Automation 和 Feedback 负责跨产品推进；Organization Center 负责组织、成员和产品的静态治理全貌。用户不需要为了日常研发再登录 Workshop 待办或反馈网页，但 Workshop 仍拥有共享业务事实。

## 事实边界

- Product Workspace 组合 Workshop Project、可选本地 repository 绑定、Automation participation 和本地显示偏好，不新增远端 Product 实体。
- Workset 是本地持久化的多产品展示范围，只影响 Today、Work 和 Feedback；不裁剪 Organization Center，也不改变成员关系、本地绑定或 Automation participation。
- Organization Center 直接使用 Workshop Organization、OrganizationMember 和 Project Member。服务端权限是最终权限来源。
- 项目创建时确定个人或组织归属；现阶段不提供创建后的组织迁移入口。
- 不开放缺少 caller role 校验的“直接添加项目成员”。成员只能通过项目上下文生成的通用邀请加入。
- Workshop 当前没有项目邀请列表、撤销和再次查看接口；ArcOrbit 只在创建成功后展示一次邀请结果，并提示用户立即复制。
- Work、Feedback 与 Automation 保留既有七状态待办、Feedback V1、验收反馈和单活动执行语义。

## 应用壳

左侧导航分为两个职责组：

- `ADVANCE`：Today、Work、Automation、Feedback，使用当前 Workset 聚合多个产品；
- `PLATFORM`：Organization，不受 Workset 过滤。

顶部 Workset 控件始终显示当前集合名称与产品数量，并提供独立“编辑范围”动作。Organization 页面 breadcrumb 显示当前组织或“个人项目”，不用 Workset 名称冒充组织范围。Automation Filter 继续只服务执行与 Task Browser。

## Organization Center

### 范围导航

1. 左侧范围栏固定包含“个人项目”和当前用户加入的全部 Organization。
2. 组织项显示当前用户的 owner/admin/member 角色、组织成员数和当前可见项目数。
3. 切换组织只切换治理详情，不切换 Workset、不改变 Automation 筛选。
4. 普通成员看到“我参与的项目”，owner/admin 看到“组织全部项目”；界面明确标注该可见性差异。
5. 个人项目与组织同级，但只有 Projects 子页，不伪造组织成员模型。

### Overview

1. 组织头部显示名称、说明、当前用户角色、成员数、项目数和可见范围说明。
2. owner/admin 可编辑组织、生成组织邀请；owner 可删除组织；member 可退出组织。
3. 概览以只读成员×项目矩阵形成全貌：行是组织成员，列是当前可见项目，单元格显示项目角色和职责；未加入显示 `—`。
4. 矩阵只表达已有成员关系，不提供点击单元格直接加人。
5. 数据区段部分失败时保留已成功的组织、成员或项目，并在相应区段显示降级说明。

### Members

1. 成员列表来自 OrganizationMember，展示身份、组织角色、加入时间和参与项目数量。
2. 选择成员打开详情，列出该成员已有的项目关系、项目角色、职责和外部成员标记；项目名称可导航到 Projects 详情。
3. 成员详情不显示“生成项目邀请”。项目邀请不是定向邀请，不能暗示会把当前成员加入某个不明确的项目。
4. owner 可修改非 owner 的组织 admin/member 角色；owner/admin 可移除其他非 owner 成员；成员可自行退出。
5. 组织邀请只在 Organization 上下文生成；邀请结果同样是一次性展示，加入由接收者输入邀请码完成。

### Projects

1. 列表展示当前组织范围内可见项目；个人范围展示无组织项目和无法归入已知组织范围的外部参与项目。
2. 每项同时显示 Workshop 项目事实、当前用户项目角色、本地 repository 绑定、当前 Workset 是否包含以及 Automation participation。
3. 选择项目打开项目详情。事实编辑、本地绑定、Workset 展示范围、Automation participation 是四个独立动作，不能互相隐式修改。
4. owner/admin 可编辑名称和 Git URL、生成项目邀请；只有 owner 可删除项目。编辑不提供组织归属字段。
5. 项目邀请动作位于明确的项目详情内，表单显示目标项目、受邀角色、有效小时和最大使用次数。
6. 成功结果显示项目名、邀请码、邀请链接、角色、过期时间和使用上限，并明确说明：这是可转发的通用邀请，不绑定当前浏览的成员；当前服务不支持历史列表或撤销。
7. 任意已登录用户可从 Organization Center 的全局“使用邀请码加入”动作选择加入组织或项目。成功后重新同步全部治理范围。

## Workset 编辑

1. 从顶部“编辑范围”打开覆盖层，列出完整可访问项目目录，并支持同时勾选任意多个产品。
2. 保存只调用 `updateWorkset(project_ids)`；空集合合法。
3. Organization Center 项目详情可单独把项目加入或移出当前 Workset，但仍只修改本地集合。
4. 创建、编辑、删除项目都不会隐式修改 Workset；项目删除后的失效 ID 由后续同步清理或忽略。

## 推进页面

### Today

Today 聚合当前 Workset 的 Product Workspace、完整待办、普通反馈和 Automation 投影。产品卡保留项目来源、团队规模、本地绑定和执行资格；打开卡片进入 Work 的产品过滤，不切换 Workset。

### Work

Work 读取 Workset 内产品的完整七状态团队待办。创建和编辑使用 Workshop 的真实字段；附件、标签、权限拒绝、部分成功和部分失败保持现有服务语义。

### Automation

Automation 保留现有 Runtime、一个待办一个持续 thread、单活动执行、Case/Loop、Workbench、Recovery 和 Git closeout。Workset 不参与执行资格计算。

### Feedback

Workshop Feedback V1 与 ArcOrbit 验收反馈保持两条队列。V2、待办历史和事务型反馈转待办在服务能力未成立前保持 unavailable 或显式两步结果。

## 分页、加载与恢复

- 组织、成员、组织项目、参与项目、任务、反馈、标签和附件读取都必须完整消费服务端分页；不以超出服务上限的 `page_size` 假设“已经取全”。
- Organization Center 首次同步时可分别显示组织、成员和项目骨架；局部失败只降级对应范围。
- 邀请、加入、角色更新和删除成功后重新读取服务端事实，不在本地乐观制造成员关系。
- 401 返回登录门禁；403 保留当前只读事实并提示权限已变化；404 表示对象已删除并触发范围刷新。

## 人工介入记录

- `HUMAN-NOTE-PLATFORM-001`：直接新增项目成员的服务端授权边界不完整，因此不开放该入口。
- `HUMAN-NOTE-PLATFORM-002`：Feedback V2 当前服务不可用，因此严格接入 V1。
- `HUMAN-NOTE-PLATFORM-003`：Workshop 未提供待办历史接口，因此不伪造历史时间线。
- `HUMAN-NOTE-PLATFORM-004`：Feedback V1 转待办是显式两步操作，关联失败必须返回已创建 task id。
- `HUMAN-NOTE-PLATFORM-005`：Workshop 未提供项目邀请列表和撤销接口，因此邀请结果仅在创建后一次性展示并由用户自行转发。

## 实现映射

- 平台数据组合：`runtime/arcorbit/src/platform-coordinator.mjs`
- Workshop 平台读取与管理：`runtime/arcorbit/src/workshop-platform-adapter.mjs`
- Workset 持久化：`runtime/arcorbit/src/desktop/desktop-store.mjs`
- 生产页面：`runtime/arcorbit/desktop/renderer/`
- Automation：`../automation-workspace/interaction.md`
- Task Browser：`../task-browser/interaction.md`
