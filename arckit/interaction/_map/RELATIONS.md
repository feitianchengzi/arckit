# Interaction Relations

## Platform Workspace

`platform-workspace/interaction.md` 定义登录后的三组一级信息架构：Personal 下的 Today、Chat；Product Lifecycle 下的 Idea、Work、Automation、Release、Operations、Feedback；Organization 下的 Organization、Engineering。`default.html` 投影分组后的多产品推进壳和 Feedback 完整正文转待办、项目成员选择；`collaboration-views.html` 投影组织概览、成员已有关系和项目上下文邀请；`states.html` 投影 Workset 编辑、普通成员有限范围、邀请码加入和部分失败。

Platform Workspace 消费 `arckit/spec/agentic-software-development/arcorbit-platform-capabilities.md`、`arcorbit-planned-workspaces.md` 与 `arckit/tech/arcorbit/platform-composition-solution.md`。Product Workspace 组合 Workshop Project 与 ArcOrbit 本地 repository binding、participation 和偏好；Workset 只控制同时展示范围，不能改变 Automation participation 或全局单活动执行。

## Chat and Planned Workspaces

`chat-workspace/` 定义绑定本地 Product Workspace 的真实 Codex 自由对话、session/thread 生命周期、流式消息、停止、权限、删除和失败恢复；`idea-workspace/` 定义创意探索、团队讨论与正式项目转换预览；`release-workspace/` 定义发版准备和上线监控计划；`operations-workspace/` 定义外部市场动作和效果信号回流；`engineering-profile/` 把 Project/Case State 的软件工程定义与维护预期事实、实现现状和问题定位的领域 Skills 组合为一个 Domain Profile，并明确排除 entry skills。

五个页面共同消费 `arckit/spec/agentic-software-development/arcorbit-planned-workspaces.md`。Chat 通过 `arckit/tech/arcorbit/desktop-execution-solution.md` 复用 Codex transport 与中性消息投影，同时隔离 state-driven Runtime、Automation lease 和 ledger；它不提供 Idea/Work 转换。其余页面只使用当前真实 Project、Task、Feedback、Run、ledger、代码/配置/测试/运行证据和 release workflow 事实组织展示，不建立新的服务端、发布、监控、市场或 registry 写入合约；Idea 的转换、Release 的发布、Operations 的外部动作和 Engineering 的 Profile 管理保持计划动作。

Organization Center 复用 Workshop Organization、OrganizationMember 和 Project Member，并由组织角色决定全部项目或参与项目可见性。成员页不生成项目邀请；项目页只生成一次性通用邀请。Work 读取完整七状态团队待办；普通反馈读取 Workshop Feedback V1。现有直接加成员授权、邀请列表/撤销、Feedback V2 与待办历史能力未成立时保持 unavailable。

生产映射为 `runtime/arcorbit/src/platform-coordinator.mjs`、`runtime/arcorbit/src/workshop-platform-adapter.mjs`、`runtime/arcorbit/src/desktop/desktop-store.mjs` 与 `runtime/arcorbit/desktop/renderer/`。

## Product Feedback Center

`product-feedback-center/interaction.md` 定义 ArcOrbit 自身产品反馈的唯一全局入口、同窗“提交反馈 / 我的反馈”模式、账户门禁、内置配置和脱敏恢复；`default.html` 投影 SDK 加载、可用内容、需要登录和 SDK 失败四类状态。

该页面消费 `arckit/spec/agentic-software-development/arcorbit-platform-capabilities.md` 的产品反馈能力和 `arckit/tech/arcorbit/product-feedback-integration.md` 的 Electron、内置凭据与身份边界。它不消费顶部产品观察范围，不进入 Workshop Feedback V1 管理页，也不创建 ArcOrbit 验收问题。

生产映射为 `runtime/arcorbit/desktop/renderer/` 的唯一入口与未读角标、`runtime/arcorbit/desktop/product-feedback/` 的本地窗口壳，以及 `runtime/arcorbit/src/product-feedback-window.mjs` 的同窗模式和脱敏恢复状态。

## Automation Workspace

`setup-readiness/interaction.md` 定义启动期全局资源门禁，以及 Product Workspace 绑定和 Runtime task 之前的项目能力门禁；`setup-readiness/default.html` 投影受信资源检查、项目级 skills plan/drift、旧用户级 managed target 迁移、事务 apply、完成、冲突与阻塞恢复。全局 ready 只允许继续 Login 或工作区，具体任务还要求其关联项目 ready；修复成功后只重新执行原项目 task preflight，不自动领取其它远端任务。

`login/interaction.md` 定义应用启动时的认证门禁；`login/default.html` 投影会话恢复、未登录入口、验证码已发送和登录失败。未登录时 Login 是唯一可交互主页面，认证成功后才进入 Automation Command Center，退出登录后返回 Login。

`automation-workspace/interaction.md` 定义登录后的持久事件唤醒、游标补取、降级对账、人工 Gate、普通待办与验收问题双队列、统一执行仲裁和待办会话交接；`automation-workspace/default.html` 投影实时/补取/降级状态、两条队列、计数与进展，`automation-workspace/authentication.html` 投影设置覆盖层中的账号摘要和失效恢复，`automation-workspace/intervention-workbench.html` 投影按需进入的人工处理、历史审查与同待办问题会话。

`task-browser/interaction.md` 定义 Work 面板内多维服务端筛选、父子任务树、完整详情、评论附件、产品限定待办维护、七种服务器任务状态和人工处置。`task-browser/daily-work.html` 投影筛选、树、父子关系、详情和评论，`task-browser/task-form.html` 投影产品联动成员/父待办/标签、语义优先级和标签生命周期管理，`task-browser/default.html` 投影列表、Inspector 与状态处置。completed Inspector 展示验收问题、进展和 Composer；accepted Inspector 只显示验收通过，不允许提出新问题。提出验收问题会创建独立问题项并复用来源待办会话，来源任务保持 completed；存在未解决问题时不能标记为 accepted。Work 的筛选在同页替换任务树与 Inspector；Automation 的“查看全部待处理”携带当前产品范围进入 Work，验收问题入口携带问题与来源待办身份进入详情。Feedback 页面只消费 Workshop 用户反馈。

该页面先消费当前用户可访问的 Workshop 项目，再按项目消费七种任务状态，并把 `待处理 → 进行中 → 已完成` 作为普通待办自动执行链路。“所有项目”只聚合这些项目的待办，不构成独立任务来源。验收问题是 Desktop Store 拥有的独立工作来源，保留自己的队列状态、Run、Case 和进展；它只引用来源待办，不成为第八种服务器任务状态。项目、任务归属与任务状态由远端任务服务器拥有；本地工作区绑定、自动化参与状态、反馈记录、执行子状态、事件和 ledger 证据由 ArcOrbit 拥有。

Intervention Workbench 从 Command Center 的人工关注项或历史运行按需进入。需要人工输入时，Workbench 使用上下文、统一执行消息流、证据三栏结构；Runtime、Agent、工具摘要和用户输入进入同一任务时间线。处理完成后返回 Command Center 并恢复当前任务。普通运行审查进入同一 Workbench 的只读模式；它不读取或写入 Personal / Chat 的自由会话。

`automation-workspace/runtime-recovery.html` 是 Command Center 的恢复子视图，承接条件式领取冲突、任务已进行中但 Runtime 启动失败、主动安全停止、活动任务外部状态变化、多个进行中任务、任务源完整性异常和会话失效。恢复完成后返回原运行或队列，不通过 Task Browser 静默改写 Runtime。

交互模式参考：

- `arckit/pending/prototypes/desktop-platform/index.html`（桌面应用壳、运行态势和独立工作台的信息架构参考，不作为稳定产品事实）
- `arckit/pending/prototypes/desktop-platform/styles.css`（密度、层级与桌面布局参考，不继承视觉品牌）

相关稳定事实：

- `arckit/spec/arcorbit-distribution.md`
- `arckit/spec/agentic-software-development/product-architecture.md`
- `arckit/spec/agentic-software-development/controller-worker-loop.md`
- `arckit/tech/arcorbit/solution.md`
- `arckit/tech/arcorbit/realtime-synchronization-solution.md`
- `arckit/tech/arcorbit/installer-supply-chain.md`
- `arckit/tech/arcorbit/desktop-execution-solution.md`
- `runtime/arcorbit/desktop/renderer/index.html`
- `../../hoewo/workshop-desktop/docs/domain.md`
- `../../hoewo/workshop-desktop/docs/decisions.md`（D-006、D-018：项目任务源与本地工作区绑定边界）
