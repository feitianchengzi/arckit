# ArcOrbit Platform Workspace - 交互规范

## 产品定位

ArcOrbit 是在本地项目上开发多个软件产品的平台。Today 与 Chat 承接个人即时协作；Idea、Work、Automation、Release、Operations 和 Feedback 表达产品全生命周期；Organization 与 Engineering 分别表达组织治理和当前领域模型。用户不需要为了日常研发再登录 Workshop 待办或反馈网页，但 Workshop 仍拥有共享业务事实。

## 事实边界

- Product Workspace 组合 Workshop Project、可选本地 repository 绑定、Automation participation 和本地显示偏好，不新增远端 Product 实体。
- Workset 是本地持久化的多产品集合。顶部产品集控件在所有 ADVANCE 页面提供“项目集全部”或单个成员产品的统一观察范围；不裁剪 Organization Center，也不改变成员关系、本地绑定或 Automation participation。
- Organization Center 直接使用 Workshop Organization、OrganizationMember 和 Project Member。服务端权限是最终权限来源。
- 项目创建时确定个人或组织归属；现阶段不提供创建后的组织迁移入口。
- 不开放缺少 caller role 校验的“直接添加项目成员”。成员只能通过项目上下文生成的通用邀请加入。
- Workshop 当前没有项目邀请列表、撤销和再次查看接口；ArcOrbit 只在创建成功后展示一次邀请结果，并提示用户立即复制。
- Work、Feedback 与 Automation 保留既有七状态待办、Workshop 用户反馈、验收问题和单活动执行语义；“反馈”仅指产品用户反馈，研发完成后的检查项统一称为“验收问题”。Feedback 的协议版本属于集成细节，不进入页面信息架构。

## 交互策略

- 顶部产品观察范围为 ADVANCE 页面提供连续的工作上下文；它可以预填用户随后发起操作的产品字段，但不替代用户确认，也不改变 Workset、成员关系或 Automation participation。
- 用户从 Work 创建待办时，产品选择器始终可见。当前范围为 Workset 内有效的单个产品时，该产品成为默认值；当前范围为“项目集全部”或原选择已失效时，默认使用 Workset 中首个可创建待办的产品。
- 用户可以在提交前改选其他 Workset 产品；提交仍使用产品选择器中的显式值，不从页面筛选隐式覆盖。
- 用户从 Feedback 把反馈转为待办时，待办内容默认使用该反馈的完整正文。执行人是反馈所属项目的成员选择器，选项显示项目成员名称并以成员 user_id 提交；用户可以保留“未分配”，界面不要求识别或手填内部 ID。
- Feedback 的核心任务是开发者检索、阅读、判断和流转用户反馈。页面不提供创建反馈，也不允许编辑用户提交的标题、正文、身份、联系方式或附件。
- Feedback 使用左侧列表与右侧详情面板。搜索、状态筛选和排序限定列表；进入页面或当前选择不再命中结果时自动选择首条，选择反馈只更新详情，不离开页面。每条反馈固定为一个视觉行，在同一行展示未读、标题、产品、优先级、状态和时间，不显示摘要副行。
- 处理动作集中在详情：调整处理优先级、忽略、刷新、按权限删除和转待办。已关联待办时展示待办 ID并移除重复转待办入口，优先级在关联待办中继续管理。
- 当前项目的受限 V2 开发者能力探测成功时，详情在原反馈事实下方展示用户、开发者和系统消息，允许开发者发送文本或附件回复，并显示未读提示；打开会话触发该反馈的已读回写，但通知或已读失败不隐藏消息与回复。
- Workset Feedback 的开发者沟通使用 Workshop 登录与受限 Platform Adapter，不使用 ArcOrbit 产品反馈中心的 SDK WebView、Project 107 或内置 API Key。
- 非事务型转待办只在 Task 创建与 Feedback 关联都成功后完成；关联失败时详情保留已创建 task ID，并把原“转待办”替换为“仅重试关联”，恢复动作不再创建 Task。

## 应用壳

左侧导航分为三个职责组：

- `PERSONAL`：Today、Chat；Today 使用当前 Workset，Chat 可以选择产品上下文但保持自由讨论边界；
- `PRODUCT LIFECYCLE`：Idea、Work、Automation、Release、Operations、Feedback；Work、Automation 与 Feedback 保留真实平台行为，Idea、Release 与 Operations 是计划展示页；
- `ORGANIZATION`：Organization、Engineering；Organization 保留真实治理行为，Engineering 是管理 State Model、Capability Mapping 与 Lifecycle Mapping 的 Domain Profile 计划工作台。

英文界面统一显示 `Release` 与 `Operations`，中文说明分别使用“发布”和“运营”。入口顺序固定为 Today、Chat；Idea、Work、Automation、Release、Operations、Feedback；Organization、Engineering。

计划展示页使用现有 Project、Task、Feedback、Run、Project State、Case、Loop、definition/code/diagnosis skill contract 和 release workflow 事实构成可信示例，并显式标记没有真实接入的动作。展示页不写入 Workshop、canonical ledger、Runtime 或外部市场与监控平台。

顶部产品集控件始终显示当前集合名称、产品数量和观察范围。用户可以在“项目集全部”与集合内单个产品之间快速切换，并通过“管理项目集”打开成员管理覆盖层；Today、Idea、Work、Automation、Release、Operations 和 Feedback 共享该选择，Chat 可选择是否携带该上下文。Organization 与 Engineering 使用组织能力范围，不用产品集名称冒充组织范围。

左侧主导航不展示 `TASK STATUS` 或七状态条目。七状态筛选属于 Work 面板，“仅看验收问题”属于 Automation 面板。

全局侧栏底部只保留当前用户头像作为账号入口。侧栏不提供独立的“添加本地项目”“本地 Runtime”或“任务源”入口；头像打开既有账号页面，页面继续承载任务源、会话和 Runtime 设置，并以 Workshop current-user 的平台显示名标识当前账户。

## Organization Center

### 范围导航

1. 左侧范围栏固定包含“个人项目”和当前用户加入的全部 Organization。
2. 组织项显示当前用户的 owner/admin/member 角色、组织成员数和当前可见项目数。
3. 切换组织只切换治理详情，不切换 Workset 或顶部观察范围。
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
4. 本地绑定选择器列出已有本地项目，并在同一选择器内提供“添加本地项目”。新目录添加成功后立即成为当前可选项，用户可直接完成绑定。
5. owner/admin 可编辑名称和 Git URL、生成项目邀请；只有 owner 可删除项目。编辑不提供组织归属字段。
6. 项目邀请动作位于明确的项目详情内，表单显示目标项目、受邀角色、有效小时和最大使用次数。
7. 成功结果显示项目名、邀请码、邀请链接、角色、过期时间和使用上限，并明确说明：这是可转发的通用邀请，不绑定当前浏览的成员；当前服务不支持历史列表或撤销。
8. 任意已登录用户可从 Organization Center 的全局“使用邀请码加入”动作选择加入组织或项目。成功后重新同步全部治理范围。

## Workset 编辑

1. 从顶部“管理项目集”打开覆盖层，列出完整可访问项目目录，并支持同时勾选任意多个产品。
2. 保存只调用 `updateWorkset(project_ids)`；空集合合法。
3. Organization Center 项目详情可单独把项目加入或移出当前 Workset，但仍只修改本地集合。
4. 创建、编辑、删除项目都不会隐式修改 Workset；项目删除后的失效 ID 由后续同步清理或忽略。
5. 顶部范围选择只允许“项目集全部”或当前 Workset 内单个产品。切换范围不会修改 Workset；当前单个产品被移出集合时，范围回退到“项目集全部”并给出就地提示。

## 推进页面

### Today

Today 按顶部产品集观察范围聚合 Product Workspace、完整待办、普通反馈和 Automation 投影。产品卡保留项目来源、团队规模、本地绑定和执行资格；打开卡片把全局范围切换到该产品并进入 Work。

### Chat、Idea、Release、Operations 与 Engineering

五个入口各自打开独立稳定页签。Chat 提供绑定单个本地 Product Workspace 的真实 Codex 自由对话，并保持与 Automation 及产品对象转换隔离；Idea 展示创意、团队讨论与正式项目转换；Release 展示发版准备和线上监控；Operations 展示对外市场动作；Engineering 展示 Profile Library 和编辑器，用户可以在计划层选择、复制、编辑、比较和 Apply Domain Profile。Profile 把 Project/Case 的领域 State 定义、预期/现状/诊断能力映射以及同一生命周期的领域解释作为一组替换；通用 Loop Kernel 与产品流程保持稳定。

这些页面的详细交互策略分别位于 `../chat-workspace/`、`../idea-workspace/`、`../release-workspace/`、`../operations-workspace/` 和 `../engineering-profile/`。Chat 的会话、消息、停止与恢复是真实本地行为；Chat 不转换其他对象。其余页面的写入或转换动作保持计划展示，不产生真实副作用。

### Work

Work 按顶部产品集观察范围读取完整团队待办，并在面板内提供七种服务器状态筛选。状态筛选下方固定使用左侧任务列表与右侧 Inspector 双栏；进入、切换范围或切换状态时自动选中首条结果，选择列表项只更新 Inspector，不离开 Work。Inspector 展示团队待办事实和管理动作；当前用户 Automation 快照中的 completed 任务额外展示验收问题与 Composer，accepted 任务只显示验收通过。创建待办时，产品字段在有效单产品范围下默认选中该产品，在“项目集全部”或失效范围下回退到 Workset 首个可用产品，并允许用户提交前改选。创建和编辑使用 Workshop 的真实字段；附件、标签、权限拒绝、部分成功和部分失败保持现有服务语义。

### Automation

Automation 保留现有 Runtime、一个待办一个持续 thread、单活动执行、Case/Loop、Workbench、Recovery 和 Git closeout。它使用顶部产品集观察范围，并在面板内提供“仅看验收问题”；观察和问题筛选都不参与执行资格计算。

### Feedback

Feedback 按顶部产品集观察范围展示 Workshop 用户反馈，不展示或统计验收问题。页头说明当前页面用于开发者处理反馈，不显示创建反馈按钮、编辑反馈入口、协议版本标题或版本能力提示。

反馈列表位于左侧，提供正文、短 ID、用户标识、手机号和邮箱搜索，处理状态筛选，以及最新、最早和优先级排序。列表项显示内容摘要、产品、优先级和处理状态；进入页面、切换产品范围、改变筛选或删除当前项后，系统保留仍有效的选择，否则选中首条结果。无结果时列表显示与当前范围或筛选对应的空状态，详情显示未选择提示。

右侧详情固定展示所选反馈的短 ID、完整正文、提交时间、产品来源、用户标识、手机号、邮箱、附件、处理状态、优先级和关联待办。受限 V2 开发者能力读取成功时，详情还展示用户、开发者和系统消息及附件；开发者可以发送文本或附件回复，附件上传与读取均使用服务端签发的受限策略或凭证。V2 列表真实不可用而回退到 V1 的项目只展示已有反馈事实，不伪造沟通时间线或回复入口。

反馈列表和页头显示项目范围内的未读数量，含未读更新的反馈显示可辨识提示。开发者打开某条反馈的沟通区后，系统读取消息并请求把该反馈通知标记为已读；消息读取失败显示恢复动作，已读回写失败只保留未读提示，不清空或隐藏已加载消息。

开发者在详情中调整处理优先级、忽略、刷新、按权限删除或触发“转待办”，不能改写用户提交的反馈事实。删除先显示明确确认。项目探测到开发者管理能力时，忽略使用专用动作，转待办使用返回反馈、任务和关系的服务端原子动作。反馈已经关联待办时，详情展示待办 ID，不再允许重复转待办，也不在反馈中继续调整优先级。

用户触发“转待办”后，系统以完整反馈正文预填待办内容，并只列出该反馈所属项目的成员名称；选中成员时提交其 user_id，保留“未分配”时提交空执行人。用户仍可在提交前调整待办正文、初始状态、执行人、优先级和标签。当前服务的非事务型转待办保持显式两步结果。关联失败时系统返回并保留已创建 task ID，在当前反馈详情中展示“仅重试关联”；该动作先确认 Task 与 Feedback 仍属于同一项目，只重写 Feedback 关联，不创建第二个 Task。恢复失败时保留 task ID 和恢复入口，恢复成功后清除入口并按服务端事实显示已关联状态。

## 分页、加载与恢复

- 组织、成员、组织项目、参与项目、任务、反馈、标签和附件读取都必须完整消费服务端分页；不以超出服务上限的 `page_size` 假设“已经取全”。
- Feedback 加载中保留列表与详情双栏骨架；当前范围无反馈与当前筛选无结果使用不同空状态。列表读取失败在工作台内提供重试，不显示协议版本或引导开发者创建反馈。
- Feedback 处理动作失败时保留当前搜索、筛选、排序和选择，并在动作附近或全局提示中显示服务端错误；刷新成功后以服务端返回重新确认选择和详情。
- Feedback 消息、回复附件、通知已读、专用忽略或原子转待办失败时，只降级对应动作并保留已加载的列表、详情、消息草稿和附件选择；401 回到登录门禁，403 保留只读事实，404 刷新当前反馈范围。
- Feedback 关联恢复遇到 Task 不存在、Feedback 不存在或 Feedback 已关联其他 Task 时停止写入并显示真实冲突；已经关联同一 Task 时按幂等成功处理。
- Organization Center 首次同步时可分别显示组织、成员和项目骨架；局部失败只降级对应范围。
- 邀请、加入、角色更新和删除成功后重新读取服务端事实，不在本地乐观制造成员关系。
- 401 返回登录门禁；403 保留当前只读事实并提示权限已变化；404 表示对象已删除并触发范围刷新。

## 人工介入记录

- `HUMAN-NOTE-PLATFORM-001`：直接新增项目成员的服务端授权边界不完整，因此不开放该入口。
- `HUMAN-NOTE-PLATFORM-002`：Workshop Feedback SDK 用户端与 Console 开发者端的 V2 client 和会话组件共同构成双向沟通能力的采用契约，不要求真实环境预验证；ArcOrbit 通过受限 adapter、逐项目能力探测和逐动作失败关闭控制消息、附件、通知与原子流转。
- `HUMAN-NOTE-PLATFORM-003`：Workshop 未提供待办历史接口，因此不伪造历史时间线。
- `HUMAN-NOTE-PLATFORM-004`：Feedback V1 转待办是显式两步操作；关联失败必须返回并保留已创建 task ID，后续恢复只重试 Feedback 关联，不得重复创建 Task。
- `HUMAN-NOTE-PLATFORM-005`：Workshop 未提供项目邀请列表和撤销接口，因此邀请结果仅在创建后一次性展示并由用户自行转发。

## 实现映射

- 平台数据组合：`runtime/arcorbit/src/platform-coordinator.mjs`
- Workshop 平台读取与管理：`runtime/arcorbit/src/workshop-platform-adapter.mjs`
- Workset 持久化：`runtime/arcorbit/src/desktop/desktop-store.mjs`
- 生产页面：`runtime/arcorbit/desktop/renderer/`
- Automation：`../automation-workspace/interaction.md`
- Task Browser：`../task-browser/interaction.md`
