# ArcOrbit Work 待办管理能力规格

## 文档定位

Work 是 ArcOrbit 内承接 Workshop 团队待办日常处理的产品页面。用户在 Work 中完成任务发现、分解、协作、状态处置和结果验收，不需要为了常规待办操作返回 Workshop Todo 网页端。

本规格定义 Work 的完整日常能力边界。Work 同时负责 Workshop 待办的远端同步和本地可信投影；Automation 只依赖该本地投影，并负责自动领取决策、Runtime、持久 Agent thread、人工 Gate 和执行恢复。Work 不复制 Automation 的执行职责，也不把界面筛选当作执行授权。

## 权威数据与范围

- Workshop Project、ProjectMember、Task、Project Tag 和 TaskAttachment 是远端权威记录。
- Work Sync 是 Workshop 待办同步的唯一客户端所有者，维护按登录身份和项目分区的本地 Task Projection。Work 页面查询和 Automation 候选都从该投影派生，不各自建立远端任务快照。
- Workshop Task 只以一个完整 `content` 字段保存待办正文，不存在独立标题事实。ArcOrbit 不向 Workshop 写入 `title`，也不把本地展示标题回写成第二个服务端字段。
- ArcOrbit 从完整正文生成只读展示标题：先去除首尾空白并把连续 Unicode 空白折叠为一个半角空格，再按 Unicode grapheme cluster 计数；结果不超过 64 个 grapheme clusters，超限时保留前 63 个并追加单字符省略号 `…`。完整正文不因标题生成而改变。
- 展示标题只用于列表行、队列、当前运行、人工介入页顶部、确认对话以及 session/CLI 的可读标签。它不是可编辑业务字段；历史运行可以保存生成时的展示标题快照，但该快照不参与任务读取、搜索、编辑或服务端写回。
- ArcOrbit Product Workspace 提供远端 Project 与本地 repository、Automation participation 和执行上下文的组合投影。
- 顶部产品集范围限定当前可见项目；Work 页面内筛选继续限定任务结果。两类筛选都不改变项目成员关系、Automation participation、任务状态或队列顺序。
- 跨产品结果始终保留 `project_id` 和产品名称。创建与编辑操作始终绑定一个明确产品。

## 核心使用旅程

### 发现与筛选

1. 用户在当前产品集全部项目或一个明确产品中进入 Work。
2. 用户可以组合七状态、创建人、执行人、标签、优先级、创建日期范围和关键字筛选，并可一次清除页面内筛选。
3. 创建人、执行人、标签、优先级和日期范围使用紧凑触发器打开弹出菜单；收起时显示当前选择摘要或数量，不以常驻多选列表占用纵向空间。
4. 关键字匹配本地 Task Projection 中的完整 Task content；筛选结果数量、七状态计数和层级补全都来自同一完整项目投影，不用 Renderer 当前可见窗口冒充完整结果。
5. 七状态计数与当前产品范围一致。待处理状态可以附加 Automation 队列资格和真实队列序号，但显示排序不改变队列。
6. 日期范围遵守 Workshop Task Tree 的最多 100 天查询约束；页面提供明确默认范围和可见的范围调整，不静默截断结果。

### 任务树与分解

- Work 以父子任务树显示命中任务，并保留命中项的上游父链和下游子树，使筛选结果仍能解释层级。
- 每条待办在列表中固定为一个视觉行，任务文本使用统一展示标题，只承载识别与选择所需的产品、状态、优先级和执行人摘要；层级通过同一行内的缩进或符号表达，不追加标签、补全说明或操作按钮形成第二行。
- 编辑、评论附件、删除、状态处置和 Automation 关联动作只在当前任务 Inspector 中完整提供，列表行点击只负责选择任务。
- 父任务可以展开和折叠；选择父任务或子任务都在同屏详情中打开对应记录。
- 用户可以从当前任务创建子任务，也可以在有权限时调整或清空父任务。
- 父任务候选排除当前任务及其全部后代；服务端循环检测仍是最终约束。
- 删除包含子任务的任务前，确认信息明确说明级联影响；服务端拒绝时保留当前树和详情。

### 详情与协作

- 同屏 Inspector 只展示一次完整内容，并展示所属产品、父任务、创建人、执行人、状态、优先级、标签、创建时间、更新时间和完成时间；Inspector 标题区使用任务 ID、产品或状态识别当前对象，不在完整内容上方再次渲染同源展示标题。
- 任务内容按受限 Markdown 展示；外部链接需要明确用户动作，不把远端内容注入可执行 HTML。
- 用户可以复制可恢复到同一产品和任务的详情引用；ArcOrbit 内部打开时恢复顶部产品范围和任务选择。
- TaskAttachment 的 `text | file | url` 记录在详情中按评论与附件时间线呈现，而不是暴露为原始字段管理器。
- 项目成员可以读取并新增评论；更新和删除动作按 Workshop 的附件创建者、任务创建者和项目角色规则显示，并由服务端最终授权。
- 文本评论兼容 Workshop Todo 已使用的正文、提及、链接、图片和文件引用格式；无法解析的历史内容按安全纯文本保留。
- 评论时间线完成解析后自动加载其中的图片并直接显示缩略预览，不要求用户先点击“预览图片”。图片分别呈现加载、已加载和失败状态；单张失败不阻塞评论正文、其他图片或后续评论，用户可以就地重试。
- 用户点击已加载图片时，ArcOrbit 在独立桌面窗口中打开原图浏览器，主 Work 窗口和当前任务选择保持不变。浏览器提供放大、缩小、适合窗口、实际大小、左旋、右旋、重置、缩放后拖拽平移和另存为，并为高频操作提供工具栏、鼠标与键盘入口。
- 图片浏览窗口只读取已经由当前账户、任务记录和 object key 联合验证的受控资源；关闭浏览窗口不清除评论时间线的已加载预览。

### 创建、编辑与状态处置

- 创建待办要求内容和产品，支持执行人、父任务、优先级和标签；表单提供完整七状态选择并默认 `pending_review`，用户可以在提交前改为任一受支持状态。
- 编辑固定任务所属产品，候选成员、父任务和标签不得跨产品混用。
- 编辑表单和同屏 Inspector 都提供完整七状态选择。Automation 是否可见、是否正在消费或是否存在验收问题，不隐藏状态字段，也不成为 Work 状态 mutation 的客户端许可条件。
- 优先级使用“最高、高、中、低、无优先级”语义档位，对应 Workshop `0、1、2、3、null`。
- 标签属于单个 Project；表单支持选择、创建、重命名、调整颜色和确认删除，并在标签操作后保持仍有效的任务草稿。
- 创建、编辑和 Inspector 状态更新都通过受限 Platform Coordinator 交给 Work Sync；正文与状态同次编辑使用一次 Workshop mutation，避免先后写入产生部分成功。确认可处理、打开运行、恢复、取消和验收等上下文动作仍可作为快捷入口，但不是允许修改状态的唯一入口。
- `in_progress` 任务的修改只向 executor、project admin 或 owner 开放；其余状态遵守 Workshop 当前成员规则。Renderer 只做保守提示，服务端响应是最终事实。

## 同步、冲突与恢复

- Workshop 是服务端任务事实源；Work Sync 独占项目 WebSocket、事件游标、REST 对账和受控 mutation，并把服务器确认结果原子写入本地 Task Projection。
- Work 页面切换七状态、搜索、筛选、日期或分页只改变本地查询，不发起 Workshop 请求，也不显示“正在后台刷新”作为该交互的结果。
- active Workset 项目、允许 Automation 参与的项目和当前活动任务项目共同形成 Work Sync 的订阅与对账范围。Automation 只提供本地项目需求，不创建连接、不推进游标、不读取 REST。
- WebSocket 与补取事件只使项目投影失效；Work Sync 合并失效后执行必要的 REST 对账。创建、编辑、评论、标签、父子关系或状态操作也统一提交给 Work Sync，并只在服务器确认成功后发布新的本地状态。
- 401、403、404、409/412 和传输错误分别呈现认证、权限、对象消失、冲突和可重试服务错误；失败动作不在本地伪造成功。
- 同步失败时可以保留最近成功结果并明确标记过期；Automation 只消费 Work Sync 已完成当前登录代际初始对账且仍具备权限的本地任务状态。
- 评论图片自动加载或独立窗口打开失败时，保留评论正文和已成功图片，在对应图片位置显示脱敏错误与重试；另存为取消不视为错误，写入失败时浏览窗口保持打开。
- 登录身份变化、退出、权限撤销或项目删除会清除对应可信任务投影和 Automation 可见状态；Workset、本地绑定、Run 和 thread 按各自既有生命周期保留。

## 与 Automation 和 Feedback 的边界

- Work 显示有权查看的完整项目任务；Automation 不拥有 Task Source，只消费 Work Sync 从同一本地投影发布的当前用户候选状态。
- Automation 的领取、阻塞、完成、取消和验收动作提交给 Work Sync。Work Sync 负责服务器同步；Automation 只在观察到 Work 发布的目标本地状态后推进执行生命周期。
- 用户在 Work 修改活动待办状态时不需要 Automation 预先授权。Work Sync 发布服务器确认状态后，Automation 将其作为外部事实消费：重新计算候选与终态；若活动 Runtime 与新状态冲突，则安全停止对应 execution 并进入可恢复的外部变化状态，且不把该变化解释为人工 Gate 回复。
- Work 可以展示 Automation 资格、当前 Run、恢复入口和 completed 任务的验收问题，但不创建第二套任务状态。
- 提出验收问题保持来源任务 `completed`，问题进入 ArcOrbit 独立队列并复用来源 thread；上下文“验收通过”快捷动作可要求问题先解决，但 Work 的通用状态编辑仍由 Workshop 权限、版本冲突和服务端确认决定，Automation 负责消费结果并对账问题执行。
- Workshop 普通用户反馈仍由 Feedback 页面处理；Feedback 转成的 Task 在 Work 中按普通任务继续管理。

## 明确不作为核心阻塞项

- Markdown 文件导出是低频辅助能力，不属于替代网页版日常处理的核心门禁。
- Workshop 服务当前没有 Task history 路由。Work 不展示伪历史；仅显示可证实的时间字段和 ArcOrbit 自有 Run/Case 证据。
- 项目迁移、组织治理、成员邀请和项目删除属于 Organization 页面，不在 Work 中复制。
- Work 不提供任意 HTTP、header、credential、文件系统写入或直接 Runtime 状态修改入口。

## 验收口径

1. 用户可以在一个 Work 页面内通过弹出菜单组合产品范围和全部任务筛选，查看完整结果数量并清除筛选；切换状态或筛选只读取本地 Task Projection，不请求 Workshop。
2. 筛选结果以单行、无操作按钮的可展开任务树呈现；每个任务标题把换行与连续空白折叠为空格，并在 64 个 Unicode grapheme clusters 内以 `…` 结束超长文本；用户从 Inspector 创建子任务、调整父任务且不能形成循环。
3. 用户可在同屏详情中只阅读一次保留原始换行的完整内容和关键元数据，不在其上方重复展示同源标题；评论图片默认加载并可在独立窗口完成缩放、适配、实际大小、旋转、平移、重置和另存为，图片失败不阻塞其余时间线。
4. 用户可完成评论/附件的新增及有权限的维护。
5. 用户可在新建、编辑和 Inspector 详情三个入口选择或修改完整七状态；Automation 可见性、活动 execution 和验收问题不隐藏或拒绝该输入，所有成功结果均来自 Workshop 确认。
6. Work 与 Automation 共享 Work Sync 发布的本地任务事实但不共享职责：Work 独占远端 mutation 与同步，Automation 只消费确认后的本地状态并对活动 execution、队列、Gate、验收问题和终态进行对账；筛选不授权执行，状态变化不释放人工 Gate。
7. 权限变化、冲突、对象消失和网络失败均保留可恢复状态，不以本地乐观结果覆盖服务器事实。
8. Adapter、Work Sync、Automation Coordinator、typed IPC、主窗口 Renderer 和独立图片浏览窗口自动化测试覆盖三入口七状态编辑、组合字段/状态单次 mutation、冲突不乐观覆盖、Automation 外部状态变化安全停止与恢复、本地状态/筛选查询不发起 Workshop 请求、Automation 没有远端任务依赖、标题边界、详情去重、任务树、评论与图片操作及跨产品隔离。

## Source Basis

- Workshop Todo 页面：`/Users/Glare/Library/Developer/ModularProgram/hoewo/workshop-todo-website/frontend/src/pages/ProjectDetailPage.tsx`、`frontend/src/components/features/TaskDetailContent.tsx`、`frontend/src/components/features/CreateTaskDialog.tsx`。
- Workshop Todo 客户端契约：`frontend/src/lib/api/endpoints/tasks.ts`、`comments.ts`、`taskHistory.ts`。
- Workshop Todo 服务：`/Users/Glare/Library/Developer/ModularProgram/hoewo/workshop-todo/router/router.go`、`handler/task.go`。
- ArcOrbit 当前实现：`runtime/arcorbit/src/workshop-platform-adapter.mjs`、`runtime/arcorbit/src/platform-coordinator.mjs`、`runtime/arcorbit/desktop/renderer/renderer.js`。
