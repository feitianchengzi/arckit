# ArcOrbit Platform Workspace - 交互规范

## 产品定位

ArcOrbit 的首页从单一 Automation Command Center 扩展为 AI-native 软件产品开发平台工作区。平台同时组织多个 Workshop 产品的团队、待办与反馈，并把需要本地仓库和 Agent 执行的工作交给既有 Automation；它不是待办/反馈网页的包装层，也不改变 ArcOrbit 作为“开发其他软件产品的平台”的核心。

## 事实边界

- Product Workspace 由一个 Workshop Project、可选本地 repository 绑定、Automation participation 和本地显示偏好组合而成，不新增远端 Product 实体。
- Workset 是 ArcOrbit 本地持久化的展示集合。一个 Workset 可以同时包含多个产品，也可以只有一个；切换或编辑 Workset 不修改项目成员、待办、反馈、本地绑定或 Automation participation。
- Team 使用 Workshop Organization、OrganizationMember 和 Project Member。组织/项目的编辑、邀请、成员角色、职责、移除与自行退出严格按现有 handler 权限开放；缺少 caller role 校验的“直接添加项目成员”仍不开放。
- Work 使用 Workshop 七状态完整项目待办，覆盖团队内其他执行人；Automation 仍只读取当前用户可执行待办，保持全局单活动执行、项目级授权和条件式状态写回。
- Feedback 分为两条通道：普通用户反馈由 Workshop Feedback V1 拥有；ArcOrbit 验收反馈由本地队列拥有，保持来源待办 completed/accepted，并在同一 task thread 上创建新的 Run/Case。
- Feedback V2、待办历史和直接加项目成员在服务能力未成立前明确显示 unavailable，不用本地假数据补齐。

## 应用壳

左侧一级导航固定为 Today、Products、Team、Work、Automation、Feedback。项目和七状态列表降级为 Automation Filter，只影响 Automation 与 Task Browser 的观察范围，不承担平台产品切换。

顶部产品集选择器始终显示当前 Workset 名称及产品数量。平台页面的 breadcrumb 以 Workset 为范围；Automation、Task Browser、Workbench 和 Recovery 仍显示远端项目或执行上下文。自动领取总闸保留在顶部，明确只作用于已绑定且已授权项目。

## 功能交互

### Today

1. 同步当前 Workset 的 Product Workspace、完整待办、普通反馈和 Automation 投影。
2. 首屏展示产品数、待推进、进行中、需注意、反馈五项指标。
3. 每个产品卡同时显示未结束待办、反馈、成员、本地绑定和自动执行资格；点击卡片进入 Work，并以产品名过滤，但不改变 Workset。
4. “跨产品下一步”按阻塞、进行中、待评审、待处理、优先级和更新时间稳定排序；每行始终保留产品来源与执行人。
5. “需要你处理”合并 Automation attention、recovery 和团队待办 blocked，但不把它们强行转换成同一种状态。

### Products

1. 展示当前用户可访问的完整 Workshop Project catalog。
2. 每行显示当前用户角色、本地 repository 绑定和 Automation participation，三者分别来源于远端项目与 ArcOrbit 本地状态。
3. 勾选多个项目并保存，只调用 `updateWorkset(project_ids)`；不得调用 `setProjectParticipation`、绑定项目或自动领取总闸。
4. 空选择被允许，形成一个暂时不展示产品的 Workset；Today、Team、Work 和普通反馈呈现明确空态，Automation 仍按自己的授权范围工作。
5. “创建产品”写入 Workshop Project；owner/admin 可编辑和邀请，只有 owner 可删除。产品管理不隐式改变 Workset、本地绑定或 Automation participation。

### Team

1. 组织卡仅显示当前 Workset 产品所属 Organization。
2. 成员表来自 Project members，展示成员、职责、角色、外部成员标识和所属产品；同一用户在不同产品拥有不同角色或职责时保留多行语义，不抹平差异。
3. Organization member 数量与 Project member 列表分别表达组织范围和产品范围，不互相替代。
4. 用户可创建 Organization；owner/admin 可编辑、邀请和移除其他成员，只有 owner 可删除组织或修改非 owner 成员角色，普通成员可自行退出。
5. 项目 owner/admin 可生成项目邀请和移除其他非 owner 成员，只有 owner 可修改非 owner 成员的 `admin/member` 角色与职责，成员可自行退出。
6. 不显示“直接添加项目成员”。该 handler 缺少 caller role 校验；邀请是当前唯一开放的加人路径。

### Work

1. 读取 Workset 内每个产品的完整七状态待办，而非 Automation 的当前执行人子集。
2. 列表列出待办标识、父待办、标题、标签、产品、状态、优先级和执行人；搜索匹配标题、内容、产品、ID 和执行人。
3. 创建和编辑使用 Workshop 的 `project_id/content/state/executor_id/father_id/priority/tags` 真实字段；空父待办表示根节点，优先级输入明确标注服务端数值越小越高。
4. 用户可管理项目级 Tag，并对 TaskAttachment 的 text/file/url 执行读取、新增、改内容和删除；最终权限拒绝由 Workshop 服务判定。
5. 删除待办在 Renderer 二次确认后走 Platform Adapter；它与 Automation 的条件式状态写回是不同命令，不伪装成自动领取操作。
6. Workshop 区段部分失败时保留其他产品结果，并在 Today 显示失败区段与产品，不把局部失败投影成全平台无数据。

### Automation

1. 保留既有 Command Center、普通待办队列、验收反馈队列、项目绑定、项目 participation、全局领取总闸、Runtime/CLI 接力、Workbench 和 Recovery。
2. Automation Filter 中选择项目会进入 Automation；七状态进入现有 Task Browser。
3. Workset 不参与执行资格计算。即使某产品不在当前 Workset，只要已绑定且明确 participation，Automation 仍可按既有规则领取其当前用户待办。

### Feedback

1. 左通道展示 Workshop Feedback V1：短编号、标题/内容、产品、人工优先级、忽略标识和关联待办，均来自现有字段。
2. 左通道明确标注 Feedback V2 unavailable，不推断 V2 已部署。
3. 项目成员可创建、编辑 V1 反馈，维护 `data` 中已有的 priority/ignored/task_id/task_state 元数据；owner/admin 才显示删除入口。
4. “转待办”先创建 Workshop Task，再把 task id/state 合并写回 V1 `data`。现有服务没有事务型 V1 转待办接口；第二步失败时必须明确报告“待办已创建但关联未保存”的 task id，不得重试创建。
5. 右通道展示 ArcOrbit acceptance feedback：稳定反馈 ID、原始问题、产品、来源待办和独立队列状态。
6. 有历史或当前 Run 时进入 Workbench 只读审查；没有 Run 时回到来源待办详情。提交新验收问题仍从 completed/accepted 待办详情发起。

## 状态与恢复

- 启动：Setup Readiness → Workshop Login/会话恢复 → Platform Workspace 同步。
- 正常：Today ↔ Products/Team/Work/Feedback；Automation 作为平台执行页并列存在。
- Workset 保存：本地持久化 → 重新拉取所选产品区段 → 平台页面更新；Automation 快照不因保存而重置。
- 部分失败：保留成功产品和区段 → Today 展示 degraded banner → 同步重试。
- 未登录：不渲染可交互平台数据；使用既有不可绕过 Login gate。
- 人工介入和恢复：沿用既有 Workbench、attention 与 Recovery Center，不在 Today 复制第二套执行控制。

## 人工介入记录

- `HUMAN-NOTE-PLATFORM-001`：直接新增项目成员的服务端授权边界不完整。当前自行决策为开放已有权限校验的邀请、角色/职责和移除能力，但禁止暴露直接添加入口。
- `HUMAN-NOTE-PLATFORM-002`：Feedback V2 当前服务不可用。当前自行决策为严格接入 V1，并在界面显式标注 V2 unavailable。
- `HUMAN-NOTE-PLATFORM-003`：Workshop 未提供待办历史接口。当前自行决策为展示当前七状态快照，不伪造历史时间线。
- `HUMAN-NOTE-PLATFORM-004`：Feedback V1 没有服务端事务型转待办接口。当前自行决策为显式两步组合，并对“待办成功、反馈关联失败”返回不可忽略的部分成功结果。

## 实现映射

- 平台数据组合：`runtime/arcorbit/src/platform-coordinator.mjs`
- Workshop 平台读取与显式管理命令：`runtime/arcorbit/src/workshop-platform-adapter.mjs`
- Workset 持久化：`runtime/arcorbit/src/desktop/desktop-store.mjs`
- 生产页面：`runtime/arcorbit/desktop/renderer/index.html`、`renderer.js`、`styles.css`
- Automation 既有交互：`../automation-workspace/interaction.md`
- Task Browser 既有交互：`../task-browser/interaction.md`
