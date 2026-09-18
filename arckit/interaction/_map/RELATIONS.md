# Interaction Relations

## Platform Workspace

`platform-workspace/interaction.md` 定义登录后的三组一级信息架构：Personal 下的 Today、Chat；Product Lifecycle 下的 Idea、Work、Automation、Release、Operations、Feedback；Organization 下的 Organization、Engineering。它与 `task-browser/interaction.md` 共同约束 Work/Feedback 的主工作区骨架：全局产品栏之后只保留一条页面控制轨，列表与详情取得剩余高度并独立滚动。`default.html` 投影应用壳、Feedback 主工作台和完整正文转待办、项目成员选择；`collaboration-views.html` 投影组织概览、成员已有关系、项目上下文直接添加入口、邀请和项目连接缺口；`member-add.html` 投影同组织成员单选、提交确认与权限/网络恢复；`states.html` 投影 Workset 编辑、普通成员有限范围、邀请码加入和部分失败。

Platform Workspace 消费 `arckit/spec/agentic-software-development/arcorbit-platform-capabilities.md`、`arcorbit-planned-workspaces.md` 与 `arckit/tech/arcorbit/platform-composition-solution.md`。Product Workspace 组合 Workshop Project 与 ArcOrbit 本地 repository binding、participation 和偏好；Workset 只控制同时展示范围，不能改变 Automation participation、workspace lane 串行顺序或全局并发容量。

## Today Workspace

`today-workspace/interaction.md` 定义登录后的人工责任工作台。页面复用 PERSONAL、PRODUCT LIFECYCLE、ORGANIZATION 三组稳定主导航；项目栏持续表达多项目的配置状态、人工责任数量和最小自动状态；责任栏只在“需要你处理”“项目配置”间切换；操作台复用来源身份、权限、校验、幂等与恢复语义。`default.html` 投影三栏桌面主视图和两个模式，`readiness-details.html` 投影首次使用与多项目并行配置，`action-details.html` 投影各来源完整操作台，`action-continuity.html` 投影选择、提交、即时确认、冲突和重启恢复。

Today 不重新定义来源状态机，但在本页内直接承载来源声明的人工作业面：项目目录与 Setup Readiness 提供目录、项目能力和本机 participation 操作；Chat 提供 waiting_approval；Automation 提供 human handoff、external dependency 和 Recovery Center；Work 提供不依赖 Workset 辅助目录的内容纠偏 Sheet、pending_review、completed、blocked 与跨产品移动恢复，所有修改仍走 Work-owned 服务器确认路径；Feedback 提供已创建 Task 的仅重试关联。Automation 的复杂责任项在 Today 操作台中投影从自动执行到人再回到同一 task session/thread/Case 的有界接力时间线，不复制完整运行日志。

Workset 不裁剪 Today 的人工责任范围。每个项目独立计算可访问、本地目录、项目 Setup 和当前用户当前设备 Automation participation 四项完成事实；一个项目的配置阻塞不影响其他 ready 项目检查、运行或进入 Work。新建待办不属于 Today，任意项目 ready 后只提供前往 Work 新建待办的跨页引导。当前用户可直接选择本机 participation，该选择不修改组织角色、项目成员、其他用户或其他设备。

来源确认后，操作台原地展示即时结果，对象随即移出 Today 并选择相邻责任项；Today 不保存已完成操作历史，完整历史和审计继续归属来源页面。

## Chat and Planned Workspaces

`chat-workspace/` 定义绑定本地 Product Workspace 的真实 Codex 自由对话、原位工作区绑定、session/thread 生命周期、流式消息、停止、权限、删除和失败恢复；`idea-workspace/` 定义创意探索、团队讨论与正式项目转换预览；`release-workspace/` 定义已有工作区上的真实终端、Git、源码、构建与场景 Agent；`operations-workspace/` 定义外部市场动作和效果信号回流；`engineering-profile/` 把 Project/Case State 的软件工程定义与维护预期事实、实现现状和问题定位的领域 Skills 组合为一个 Domain Profile，并明确排除 entry skills。

Chat、Operations 和 Engineering 消费 `arckit/spec/agentic-software-development/arcorbit-planned-workspaces.md`。Chat 通过 `arckit/tech/arcorbit/desktop-execution-solution.md` 复用 Codex transport 与中性消息投影，并在 Composer 持有当前会话 Model/Level，同时隔离 state-driven Runtime、Automation 默认值、lease 和 ledger；它不提供 Idea/Work 转换。Engineering 通过 `arckit/tech/arcorbit/scene-skills-solution.md` 投影 ArcOrbit 内置 Skills 的可信安装后集合、紧凑场景管理和失败恢复，不展示或操作用户自行安装的 Skills。Idea 的产品转换使用独立 Product 规格，Release 本地执行使用独立 Release 规格；外部渠道发布和 Operations 外部动作仍依实际接入。

Organization Center 复用 Workshop Organization、OrganizationMember 和 Project Member，并由组织角色决定全部项目或参与项目可见性。成员页不生成项目邀请；项目页只生成一次性通用邀请。Work 读取完整七状态团队待办；普通反馈读取 Workshop Feedback V1。现有直接加成员授权、邀请列表/撤销、Feedback V2 与待办历史能力未成立时保持 unavailable。

生产映射为 `runtime/arcorbit/src/platform-coordinator.mjs`、`runtime/arcorbit/src/workshop-platform-adapter.mjs`、`runtime/arcorbit/src/desktop/desktop-store.mjs` 与 `runtime/arcorbit/desktop/renderer/`。

## Product Feedback Center

`product-feedback-center/interaction.md` 定义 ArcOrbit 自身产品反馈的唯一全局入口、同窗“提交反馈 / 我的反馈”模式、账户门禁、内置配置和脱敏恢复；`default.html` 投影 SDK 加载、可用内容、需要登录和 SDK 失败四类状态。

该页面消费 `arckit/spec/agentic-software-development/arcorbit-platform-capabilities.md` 的产品反馈能力和 `arckit/tech/arcorbit/product-feedback-integration.md` 的 Electron、内置凭据与身份边界。它不消费顶部产品观察范围，不进入 Workshop Feedback V1 管理页，也不创建 ArcOrbit 验收问题。

生产映射为 `runtime/arcorbit/desktop/renderer/` 的唯一入口与未读角标、`runtime/arcorbit/desktop/product-feedback/` 的本地窗口壳，以及 `runtime/arcorbit/src/product-feedback-window.mjs` 的同窗模式和脱敏恢复状态。

## Automation Workspace

`setup-readiness/interaction.md` 定义启动期全局资源、Codex executable/version/authentication 门禁，以及 Product Workspace 绑定和 Runtime task 之前的项目能力门禁；`setup-readiness/default.html` 投影官方 standalone 安装/更新、两级无默认认证选择、登录状态复核、外部安装/活动任务阻断、项目级 skills plan/drift、旧用户级 managed target 迁移、事务 apply、完成、冲突与恢复。Codex authentication 与 Workshop authentication 是独立状态域；全局 ready 只允许继续 Login 或工作区，具体任务还要求其关联项目 ready。该交互消费 `arckit/spec/arcorbit-distribution.md` 与 `arckit/tech/arcorbit/installer-supply-chain.md`，修复成功后只重新执行原项目 task preflight，不自动领取其它远端任务。

`login/interaction.md` 定义应用启动时的认证门禁；`login/default.html` 投影会话恢复、未登录入口、验证码已发送和登录失败。未登录时 Login 是唯一可交互主页面，认证成功后才进入 Automation Command Center，退出登录后返回 Login。

`automation-workspace/interaction.md` 定义 Automation 只消费 Work Sync 发布的本地待办状态，并维护资格原因就地引导、普通待办与验收问题双队列、workspace lane 内统一串行仲裁、最多 3 条 lane 并行、execution 定向 Gate/恢复/控制和待办会话交接；`automation-workspace/default.html` 只投影 Work 的实时/补取/降级健康摘要及 Automation 自己的两条队列、活动执行集合、槽位容量、选中执行和 lane 局部状态，`automation-workspace/eligibility-guidance.html` 投影候选存在但不满足目录、任务状态、项目授权或全局总闸时的直接动作，`automation-workspace/authentication.html` 投影设置覆盖层中的账号摘要、失效恢复与 Chat/Automation 两组 Codex Model/Level 编辑、加载、保存和失败重试；Codex 设置消费 `arckit/spec/arcorbit-distribution.md`，由 `arckit/tech/arcorbit/desktop-execution-solution.md` 约束清单、迁移和生效边界，`automation-workspace/intervention-workbench.html` 投影按需进入的人工处理、历史审查与同待办问题会话。

`task-browser/interaction.md` 定义 Work 面板内本地状态/搜索/筛选控制轨、Work-owned 同步、占满剩余高度的父子任务树与 Inspector、完整详情、评论附件、产品限定待办维护，以及新建/编辑完整七状态与 Inspector 引导动作。`task-browser/daily-work.html` 投影不触发远端请求的本地查询、独立滚动的树与 Inspector、有限下一步动作和评论，`task-browser/task-form.html` 投影产品联动字段、完整七状态、语义优先级和标签管理，`task-browser/readiness-guidance.html` 投影当前任务的待评审、执行人和项目连接资格原因，`task-browser/default.html` 投影引导式状态修改、编辑兜底与 Automation 外部变化恢复。completed Inspector 展示验收问题、进展和 Composer；accepted Inspector 不允许提出新问题且只保留查看结果，异常纠偏通过编辑 Sheet 提交。状态 mutation 只受 Workshop 权限、冲突与服务端确认约束。Work 的本地筛选在同页替换任务树与 Inspector；Automation 入口携带对象身份进入对应详情，Feedback 页面只消费 Workshop 用户反馈。

Work Sync 先维护当前用户可访问项目的七状态本地 Task Projection，再把当前执行人候选发布给 Automation；Work 用户和 Automation 都经 Work Sync 提交状态 mutation，Automation 只在确认后的本地状态变化后推进、收束或进入外部变化恢复。“所有项目”只聚合这些项目的待办，不构成独立任务来源。验收问题是 Desktop Store 拥有的独立工作来源，保留自己的队列状态、Run、Case 和进展；它只引用来源待办，不成为第八种服务器任务状态。普通待办与验收问题按规范化本地 workspace 共享一条串行 lane，不同 lane 在有界容量内并行。项目、任务归属与任务状态由远端任务服务器拥有；Work Task Projection、工作区绑定、自动化参与状态、反馈记录、执行子状态、事件和 ledger 证据由 ArcOrbit 拥有。

Intervention Workbench 从 Command Center 的人工关注项或历史运行按需进入。需要人工输入时，Workbench 使用上下文、统一执行消息流、证据三栏结构；Runtime、Agent、工具摘要和用户输入进入同一任务时间线。处理完成后返回 Command Center 并恢复当前任务。普通运行审查进入同一 Workbench 的只读模式；它不读取或写入 Personal / Chat 的自由会话。

`automation-workspace/runtime-recovery.html` 是 Command Center 的恢复子视图，承接 Work Sync 领取冲突、任务本地状态已进行中但 Runtime 启动失败、主动安全停止、活动任务外部变化、同一 lane 多个进行中任务、Work 投影完整性异常和会话失效。lane 局部恢复不冻结其他健康执行；恢复完成后返回原运行或队列，不通过 Automation 直接访问 Workshop 或静默改写 Runtime。

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

Product 管理以 `arckit/spec/agentic-software-development/arcorbit-product-management.md` 为产品源，技术协议在 `arckit/tech/arcorbit/product-management-solution.md`；页面为 `product-list` → `product-detail`、`idea-workspace` → `idea-add`，Today 通过 `today-workspace/product-continuity.html` 续接原对象。原 Lifecycle 页面保持独立。

Release 本地交付工作台：产品源为 arckit/spec/agentic-software-development/arcorbit-release-workspace.md，技术源为 arckit/tech/arcorbit/release-workspace-solution.md，页面源为 arckit/interaction/release-workspace/interaction.md。复用已有项目绑定与 Chat/Idea 基础层。

`project-workbench/interaction.md` 对应 `arckit/spec/agentic-software-development/arcorbit-project-workbench.md` 与 `arckit/interaction/project-workbench/`，生产实现位于 `runtime/arcorbit/src/workbench/` 和独立 project-workbench renderer 模块。


## 项目事情台正式原型与探索来源

- 正式策略：project-workbench/interaction.md；可操作入口：project-workbench/default.html。正式入口无探索资源依赖。
- 视觉输入：arckit/visual/_library/brief.md、design-tokens.yaml、component-catalog.yaml、state-contract.md 与 themes/light.yaml；入口直接消费 generated-tokens.css。重建命令见 project-workbench/README.md。
- 采纳记录：_explorations/project-workbench-v2/exploration.md；采纳前稿保留在 options/original/，使用独立存储与旧视觉。正式升级不回写候选样本。
- 其他探索：unified-work-exploration、product-continuity-concept、release-workbench；仅迁移，不改变正式页面覆盖状态。
- 平台主导航在 PERSONAL 的 Chat 旁新增独立 Thing 入口，恢复 PERSONAL / PRODUCT / PRODUCT LIFECYCLE / ORGANIZATION 分类；事情台侧栏直接呈现各业务页面，不再承担项目列表、关注分组和资源导航。窄窗页面导航菜单保留所有目的地；其他页面原型在独立标签页打开，当前事情与草稿保留。生产路由与 spec/tech 中旧主体入口描述尚待后续同步。
- 异常场景：project-workbench/scenarios.html → default.html?autoplay=off&scenarioTools=on，场景存储与正式原型隔离，禁止真实服务连接。
- 历史 intake/Case 中的 runtime/arcorbit/design 路径作为原始证据保留；当前地址从 _explorations/migration-baseline.json 的 moves 映射定位。当前 spec 入口已指向正式目录。
- Renderer 尚未消费本轮视觉应用与本地异常演示代码；此迁移不代表生产界面同步完成。

事情台强调色依据 visual 的 2026-09-17 橙色策略，由同一 generated-tokens.css 自动消费；正式截图已重建，探索截图保持采纳时证据。

浅杏橙已采纳：#F4B77D 主操作、无深橙装饰描边、中性链接与选中文字；正式 project-workbench 消费共享 Token 和对应样式。来源：arckit/visual/_explorations/orange-tone/exploration.md。

Thing 的个人中心通过 project-workbench/account-settings.js 提供完整可操作投影；能力源为生产 settingsOverlay、renderer.js 与 codex-settings-form.mjs，逐项映射见 project-workbench/account-capabilities.md。automation-workspace/authentication.html 保留账号状态辅助稿；当前完整能力覆盖以 Thing 弹出页为准。

## Chat 完整原型迁移

chat-workspace/default.html 已迁移为分类应用导航、中央对话与右侧会话列表的可操作页面；原静态主稿保留为 chat-workspace/states.html 辅助说明，右侧方向同步修正。页面按 ConversationSurface 和 light Tokens 呈现；独立模型、渲染、行为与异常工具覆盖会话生命周期。与 Thing 共用 project-workbench/navigation.js、account-settings.js 及基础样式，通过 NavigationHost / AccountHost 显式适配，不共享会话或业务状态。

验证：chat-workspace/verification.json；共用导航回归：project-workbench/verification-states.json。生产 Chat renderer 与产品规格中的旧左右栏描述尚未迁移，本轮不宣称生产同步。

无标题栏主窗口：interaction/CONVENTIONS.md、visual/_library/brief.md 及 AppShell、tech/arcorbit/solution.md 共同定义独立窗口控件、局部避让和底部设置同步时间戳。生产无标题栏与底部同步投影已更新；实现及验证范围见 arckit/cases/evidence/CASE-20260917-003/implementation-verification.json，Windows/Linux 原生执行与 macOS 原生悬停面板未人工验证。历史页面线框中的标题栏不作为当前窗口外壳验收依据。

- 本机外观：CONVENTIONS.md → _shared/appearance.js 与 project-workbench/account-settings.js；共享设置消费者加载统一主题模拟。颜色来源为 visual/themes/light.yaml、dark.yaml。生产接入与旧页面全部状态的暗色覆盖尚未验证。
