# Interaction Relations

## Platform Workspace

`platform-workspace/interaction.md` 定义登录后的两组一级信息架构：Advance 下的 Today、Work、Automation、Feedback，以及 Platform 下不受 Workset 裁剪的 Organization。`default.html` 投影多产品推进壳和 Feedback 完整正文转待办、项目成员选择；`collaboration-views.html` 投影组织概览、成员已有关系和项目上下文邀请；`states.html` 投影 Workset 编辑、普通成员有限范围、邀请码加入和部分失败。

Platform Workspace 消费 `arckit/spec/agentic-software-development/arcorbit-platform-capabilities.md` 与 `arckit/tech/arcorbit/platform-composition-solution.md`。Product Workspace 组合 Workshop Project 与 ArcOrbit 本地 repository binding、participation 和偏好；Workset 只控制同时展示范围，不能改变 Automation participation 或全局单活动执行。

Organization Center 复用 Workshop Organization、OrganizationMember 和 Project Member，并由组织角色决定全部项目或参与项目可见性。成员页不生成项目邀请；项目页只生成一次性通用邀请。Work 读取完整七状态团队待办；普通反馈读取 Workshop Feedback V1。现有直接加成员授权、邀请列表/撤销、Feedback V2 与待办历史能力未成立时保持 unavailable。

生产映射为 `runtime/arcorbit/src/platform-coordinator.mjs`、`runtime/arcorbit/src/workshop-platform-adapter.mjs`、`runtime/arcorbit/src/desktop/desktop-store.mjs` 与 `runtime/arcorbit/desktop/renderer/`。

## Product Feedback Center

`product-feedback-center/interaction.md` 定义 ArcOrbit 自身产品反馈的唯一全局入口、同窗“提交反馈 / 我的反馈”模式、账户门禁、内置配置和脱敏恢复；`default.html` 投影 SDK 加载、可用内容、需要登录和 SDK 失败四类状态。

该页面消费 `arckit/spec/agentic-software-development/arcorbit-platform-capabilities.md` 的产品反馈能力和 `arckit/tech/arcorbit/product-feedback-integration.md` 的 Electron、内置凭据与身份边界。它不消费顶部产品观察范围，不进入 Workshop Feedback V1 管理页，也不创建 ArcOrbit 验收问题。

生产映射为 `runtime/arcorbit/desktop/renderer/` 的唯一入口与未读角标、`runtime/arcorbit/desktop/product-feedback/` 的本地窗口壳，以及 `runtime/arcorbit/src/product-feedback-window.mjs` 的同窗模式和脱敏恢复状态。

## Automation Workspace

`setup-readiness/interaction.md` 定义应用启动后、Workshop 认证和 Runtime task 之前的本机能力门禁；`setup-readiness/default.html` 投影受信资源检查、skills plan/drift、事务 apply、完成、冲突与阻塞恢复。只有 readiness 为 ready 才继续 Login 或 Automation Workspace；修复成功后重新执行 task preflight，不自动领取远端任务。

`login/interaction.md` 定义应用启动时的认证门禁；`login/default.html` 投影会话恢复、未登录入口、验证码已发送和登录失败。未登录时 Login 是唯一可交互主页面，认证成功后才进入 Automation Command Center，退出登录后返回 Login。

`automation-workspace/interaction.md` 定义登录后的普通待办与验收问题双队列、统一执行仲裁和待办会话交接；`automation-workspace/default.html` 分别投影两条队列、计数与进展，`automation-workspace/authentication.html` 投影设置覆盖层中的账号摘要和失效恢复，`automation-workspace/intervention-workbench.html` 投影按需进入的人工处理、历史审查与同待办问题会话。

`task-browser/interaction.md` 定义 Work 面板内七种服务器任务状态的同屏列表、右侧 Inspector 与人工处置。completed Inspector 展示验收问题、进展和 Composer；accepted Inspector 只显示验收通过，不允许提出新问题。`task-browser/default.html` 是同一策略的灰度线框投影。提出验收问题会创建独立问题项并复用来源待办会话，来源任务保持 completed；存在未解决问题时不能标记为 accepted。Work 的状态筛选在同页替换列表与 Inspector；Automation 的“查看全部待处理”携带当前产品范围进入 Work，验收问题入口携带问题与来源待办身份进入详情。Feedback 页面只消费 Workshop 用户反馈。

该页面先消费当前用户可访问的 Workshop 项目，再按项目消费七种任务状态，并把 `待处理 → 进行中 → 已完成` 作为普通待办自动执行链路。“所有项目”只聚合这些项目的待办，不构成独立任务来源。验收问题是 Desktop Store 拥有的独立工作来源，保留自己的队列状态、Run、Case 和进展；它只引用来源待办，不成为第八种服务器任务状态。项目、任务归属与任务状态由远端任务服务器拥有；本地工作区绑定、自动化参与状态、反馈记录、执行子状态、事件和 ledger 证据由 ArcOrbit 拥有。

按需 Chat 从 Command Center 的人工关注项或历史运行进入。需要人工输入时，Workbench 使用上下文、统一执行消息流、证据三栏结构；Runtime、Controller、Worker、工具摘要和用户输入不论内部 thread 数量都进入同一时间线。处理完成后返回 Command Center 并恢复当前任务。普通运行审查进入同一 Workbench 的只读模式，不形成常驻 Chat 主页面。

`automation-workspace/runtime-recovery.html` 是 Command Center 的恢复子视图，承接条件式领取冲突、任务已进行中但 Runtime 启动失败、主动安全停止、活动任务外部状态变化、多个进行中任务、任务源完整性异常和会话失效。恢复完成后返回原运行或队列，不通过 Task Browser 静默改写 Runtime。

交互模式参考：

- `arckit/pending/prototypes/desktop-platform/index.html`（桌面应用壳、运行态势和独立工作台的信息架构参考，不作为稳定产品事实）
- `arckit/pending/prototypes/desktop-platform/styles.css`（密度、层级与桌面布局参考，不继承视觉品牌）

相关稳定事实：

- `arckit/spec/arcorbit-distribution.md`
- `arckit/spec/agentic-software-development/product-architecture.md`
- `arckit/spec/agentic-software-development/controller-worker-loop.md`
- `arckit/tech/arcorbit/solution.md`
- `arckit/tech/arcorbit/installer-supply-chain.md`
- `arckit/tech/arcorbit/desktop-execution-solution.md`
- `runtime/arcorbit/desktop/renderer/index.html`
- `../../hoewo/workshop-desktop/docs/domain.md`
- `../../hoewo/workshop-desktop/docs/decisions.md`（D-006、D-018：项目任务源与本地工作区绑定边界）
