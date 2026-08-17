# Interaction Relations

## Automation Workspace

`setup-readiness/interaction.md` 定义应用启动后、Workshop 认证和 Runtime task 之前的本机能力门禁；`setup-readiness/default.html` 投影受信资源检查、skills plan/drift、事务 apply、完成、冲突与阻塞恢复。只有 readiness 为 ready 才继续 Login 或 Automation Workspace；修复成功后重新执行 task preflight，不自动领取远端任务。

`login/interaction.md` 定义应用启动时的认证门禁；`login/default.html` 投影会话恢复、未登录入口、验证码已发送和登录失败。未登录时 Login 是唯一可交互主页面，认证成功后才进入 Automation Command Center，退出登录后返回 Login。

`automation-workspace/interaction.md` 定义登录后的普通待办与验收反馈双队列、统一执行仲裁和待办会话交接；`automation-workspace/default.html` 分别投影两条队列、计数与进展，`automation-workspace/authentication.html` 投影设置覆盖层中的账号摘要和失效恢复，`automation-workspace/intervention-workbench.html` 投影按需进入的人工处理、历史审查与同待办反馈会话。

`task-browser/interaction.md` 定义七种服务器任务状态的浏览与人工处置，以及 completed/accepted 右侧详情中的全部验收反馈、进展和 Composer；`task-browser/default.html` 是同一策略的灰度线框投影。提交验收问题创建独立反馈项、复用来源待办会话，不改变来源任务状态。Command Center 的任务状态导航携带当前项目范围进入 Task Browser，反馈队列入口携带反馈与来源待办身份进入同一详情；返回时恢复原项目范围和队列视图。

该页面先消费当前用户可访问的 Workshop 项目，再按项目消费七种任务状态，并把 `待处理 → 进行中 → 已完成` 作为普通待办自动执行链路。“所有项目”只聚合这些项目的待办，不构成独立任务来源。验收反馈是 Desktop Store 拥有的独立工作来源，保留自己的队列状态、Run、Case 和进展；它只引用来源待办，不成为第八种服务器任务状态。项目、任务归属与任务状态由远端任务服务器拥有；本地工作区绑定、自动化参与状态、反馈记录、执行子状态、事件和 ledger 证据由 ArcOrbit 拥有。

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
