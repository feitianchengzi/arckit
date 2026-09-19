# 项目事情台与 Agent 场景组合

## 范围与职责

项目事情台是独立生产页面，承接用户以事情为中心的讨论、执行、检查和介入。旧 Today、Chat、Product、Idea、Work、Automation、Release、Operations、Feedback、Organization、Engineering 的页面与业务实现保持独立；应用壳负责四组直接业务导航，Thing 与 Chat 并列，默认路由为 Automation。Thing 不渲染全局项目导航，旧持久筛选中的项目范围忽略，以跨项目列表恢复当前事情及草稿。

此域与 desktop-execution-solution.md 的职责分开：后者定义现有执行及自由 Chat；本方案定义事情主会话、结构化场景与业务能力适配。它复用原协调器，不复制 State Driven Loop、技能选择或 Git 交付策略。

## 状态所有权

| 数据 | 权威来源 | 新界面读取方式 |
|---|---|---|
| 事情正文、执行人、状态、父子关系 | Workshop 任务服务 | WorkSync Task Projection 与原业务命令 |
| 共享文本、链接、文件及留言 | Workshop attachment 服务 | 带事情身份的既有附件 API |
| 项目事实、Case、Loop | 项目 development ledger | Runtime 的可信结果及账本引用 |
| 运行、停止、恢复、验收问题 | Automation 与 Run Manager | execution_id、历史记录与运行详情 |
| 计划、约定、完成标准、上下文选择、结构化报告 | 账号隔离的本机场景存储 | revision、请求标识、原子落盘 |
| 文件成果 | 项目工作区的实际文件 | 校验 realpath 范围，预览计算 SHA-256 |
| 文本/工具/审批消息 | 主会话及运行活动 | 选中事情的按需投影 |

本机场景不是远端共享任务字段的副本。结构化工作报告带 Agent 声明来源；文件声明不等于文件已验证，Git 结果不等于发布完成。留言对任务协作者可见，本机约定、标准及 Agent 对话不隐式同步到其他设备。

## 事情与主会话

事情业务身份持续存在；本地 automation-task session 记录 task_id、remote_project_id 和工作区。已有事情先找现成 task session，新的首次讨论按需创建。Automation 首次启动也复用该 session。

Codex thread id 使用 Run Manager 原持久绑定文件。新 Chat 在首次 turn 前通过 onThreadBound 保存绑定；后续讨论读取相同绑定，Auto、恢复、验收修复、验证及 Git 收尾复用同一 thread。会话可以有多次 turn/Run，但不派生 Controller、Worker 或 Review 会话。

共享 task-turn-lock 排除同一事情的 Chat/Auto 并发；自动队列跳过当前讨论中的事情。Chat 轮结束释放其进程拥有权，后续 Auto 可以重新加载同一 thread。Runtime 运行确认终止并完成状态保存后释放执行拥有权。

暂停先调用原停止协议，等待进程确认退出，再开放讨论。讨论不自动恢复执行；用户显式继续才授权原执行恢复。原任务与 Case 结果独立于停止状态。

## 按事情发起 Auto

requested_tasks 是产品层的显式执行请求，保存 task_id 到项目的映射。新页面的 Auto 只登记当前事情，不开启全局自动领取或改变整个项目的授权。请求仍经过当前执行人、工作区绑定、任务源可信度、Setup、workspace lane、并发上限和暂停检查。任务开始后消费该请求。

旧全局 enabled/project_participation 继续使用原语义。队列暂停期间显式事情保持排队。事情状态与此设备的执行模式分别显示。

## 命令、工具与事件

Thing 的同步命令向 Work Sync 提交一次目录范围对账：无指定项目时覆盖全部可访问项目，指定项目时覆盖该项目与既有后台需求的并集。Work Sync 统一认证、读取目录、去重项目并以最多四项目并发加载任务及标签；Thing 不在对账后重复逐项目加载。健康项目正常提交，失败保留项目级错误并由命令向页面报告。并发期间追加的请求保留其范围，后续对账代际消费该范围；后台周期对账和订阅范围仍由既有 Workset 与自动化需求决定。

ProjectWorkbench 提供 snapshot、detail 和 command 的受限 IPC。场景命令携带 task_id、expected_revision、request_id 和类型化 payload。相同请求重放不产生第二个场景事件；旧版本拒绝并保留输入。目标正文变化使已检查标准失效。

首次创建先保存请求收据；已确认远端 task_id 后重试直接使用相同事情。远端结果不确定时不盲目再次创建，界面要求先同步核对。源服务仍执行其自身权限和状态校验。

Agent 使用 arcorbit_scene_read、arcorbit_scene_update、arcorbit_capabilities、arcorbit_call。场景更新允许工作报告和待采纳建议；完成验收、Auto 授权与用户控制不由普通报告推导。UI 与工具到达相同服务命令。软件能力适配器注册 Platform、Release、Product 与 Engineering 的已有操作，必要的用户确认发生在实际调用前，并在确认后重新检查账号与范围。

能力目录是业务操作适配层，与 Runtime 的技能 manifest 分离。Skills 仍由完整 Agent 原生选择；不按页面固定 worker，不把业务能力目录当作技能白名单。

## 自动执行的工具接入

Desktop 维护只监听 127.0.0.1 的工具桥。每个 Run 使用随机短期 token，绑定账号、事情、本地工作区和 run_id；token 只通过子进程环境传递，不进入 renderer、任务正文或持久运行记录。桥拒绝跨 Origin、无授权及超长请求，并在每次调用核对当前账号与工作区。

Codex adapter 将工具声明与现有 scene skills 工具组合。已有 thread 恢复不能新增 thread/start 的 dynamicTools，因此同一工具桥也提供标准 MCP 接口：在 thread/start 与 thread/resume 的受控 config 中设置本机 URL 和令牌环境变量名。每个 Chat turn 也有独立短期授权，结束后撤销；秘密只在进程环境中，不写配置。原生工具与 MCP 都到达同一命令实现。普通任务外执行不注入此桥；Run 完成后撤销 token，进程重启后重新授权。工具输出携带真实结果与场景 revision；关键业务变更保存关联 request_id、操作者、时间和消息来源。

## 界面投影与恢复

四类详情读取结构化场景、任务源事实和选中事情的运行证据。消息仅按用户主动触发展示，中央详情 inert，右列表仍可操作；关闭恢复原阅读位置。运行状态弹层读取所有项目在此设备的实际执行，并跨项目定位。

草稿与阅读位置按账号、事情和标签页存储。后台刷新合并当前对象，保留草稿、焦点及选择。只加载选中事情的最新运行内容；历史运行按点击读取，不在概览重建全部历史 transcript。

Thing 将连接状态通知与内容失效分开：`work.sync`、`work.syncing` 不触发 snapshot/detail 读取。内容通知在 180ms 窗口合并；不同项目的变化刷新跨项目列表并复用当前事情详情。当前事情所在项目的内容变化、无范围通知、用户操作和周期校验仍确认详情及附件。Automation 通知通过当前事情、账号、工作区绑定、场景 revision、相关运行及子事情依赖判断详情是否失效，连接健康和其他项目运行变化不使详情失效。附件响应不另设跨账号缓存。

刷新采用 single-flight；读取期间的内容失效保留到下一轮，用户显式刷新消费已有排队通知。详情请求失败不推进复用标识，任务切换使用 selection epoch 拒绝旧详情；账号范围切换清除旧详情，已移除事情不保留原详情。没有首次加载状态时不先重绘一遍旧内容，未变化详情复用已渲染内容。snapshot 携带轻量同步健康，主壳据此更新全局顶部栏的同步状态与时间戳而不读取旧页面全量数据。

旧页面访问时恢复原最小窗口边界；新事情台允许窄窗口布局。场景 HTML 由注册组件渲染，文本按受限 Markdown 转义，Agent 不生成任意 HTML 或操纵 DOM。

### 同级 Chat 页面布局

Chat 使用独立 `chat-layout.css` 调整中央对话、右侧分组会话及窄窗抽屉，保留既有 Chat State Coordinator、Conversation Surface 与 IPC。页面控制器统一设置 workspace surface：Thing/Chat 最小 390×640，其他页面恢复 1100×720；Thing 子视图不再异步覆盖窗口模式。抽屉打开时正文 inert，选择、新建、离页与跨断点关闭抽屉；Esc 恢复按钮焦点。原型模型与样本不进入产品代码。

## 统一全局上下文

Renderer 持有产品集与产品观察范围的唯一状态。Chat 使用已关联的远端 project id 或匹配的本地 project id 建立范围映射；Thing 与业务列表直接使用 project_id。各 surface 消费同一全局范围；Today 单独维护页内项目选择，项目栏直接投影产品集成员，不从 Today 配置记录反推成员。顶部主动范围变化单向设置 Today 局部选择，Today 点击不调用全局范围更新。成员变化校验局部选择，失效时回到全部项目。Today 必要本机记录按稳定项目身份惰性初始化，已有记录复用，失败可重试；迟到响应不恢复旧选择，初始化不隐式触发目录绑定、Setup 写入或 Automation 授权。选择记忆按用户、产品集、产品范围和页面隔离，对象草稿仍按对象身份保存。范围切换递增请求代际，迟到结果不得恢复旧范围对象；后台执行生命周期不因选择变化而停止。公共顶部只绑定现有受限 IPC，不新增权限或任意系统能力。同步摘要分别消费 Runtime task source、Work Sync 与平台错误；手动同步复用已有同步协调器，Git 产品资料发布保持显式独立动作。

Chat 布局以剩余列满宽呈现，`chat-resize.mjs` 用 Pointer Capture 与键盘分隔线维护右栏宽度和输入高度；尺寸保存至本机 localStorage，ResizeObserver 在容器变化时限制尺寸，存储不可用不阻止编辑。分组视图按项目稳定 id 与会话 created_at/id 排序，不使用 updated_at；Renderer 独立保存项目折叠和五条递增额度，收起清除额度。以上 UI 状态不写入会话或 Runtime，刷新不强制展开选中会话。

## Chat 的原生待办入口

Chat 与 Thing 的交互式讨论共用 Chat coordinator、session、消息存储和 Codex thread。已有 `automation-task` session 由 Chat 直接选择，不复制历史或另建 thread；普通 Chat 整理为待办时，保留 session id/thread id，补入 task_id、remote_project_id 与账号 scope，并登记既有不可替换的 task thread binding。历史 task 绑定优先于创建新 thread。删除任务会话只隐藏本地 Chat 入口，保留可信绑定及消息，再次打开恢复相同会话。

原生待办能力由主进程授予每轮有效的账号 / 本地 workspace / 远端项目 / session scope，沿既有 loopback MCP 与动态工具协议提供。能力不依赖待办已经存在：普通 Chat 可列举、读取和创建当前绑定项目待办。Agent 明确指定将创建结果关联当前会话，其他创建结果只保存来源关系；不会自动成为子任务或更换主待办。创建请求有稳定幂等标识，未知写入结果不盲目重试。

主进程复用 Workshop 项目授权、task 创建命令、Work Sync 和任务执行锁。读取/更新前校验最新账号、项目绑定及对象可见性；更新携带读取版本，不覆盖变化的内容。Desktop 校验读取摘要后，将 `{content,state,priority}` 的 expected 前像传至 Workshop `PUT /tasks/:id`；服务端把前像放入同一 UPDATE 的 WHERE，未命中返回 409。该约束要求包含条件更新支持的服务端，旧服务端部署不作为并发保护已生效的证据。Chat 中旧 `arcorbit_call task.update` 入口不绕过这一版本契约。活动任务 owner 存在时不抢占执行；点击待办不调用 Automation enqueue。执行用户请求仍发生于同一 Chat thread。原生调用回执成为真实对象消息，普通 Agent 文本不是业务成功凭据。

能力 / Skill / 文件 / 待办引用作为会话草稿结构保存，发送时固定为该消息的上下文。原生意图通过明确工具描述交给 Agent，不使用 renderer 关键词模拟执行。Skill 候选来自当前 scene 的可用配置与 Codex 发现；文件候选由主进程在当前工作区内枚举，路径不得越过 realpath 边界。引用只提供定位信息，实际读取结果由工具活动表达。

模型和推理级别仍使用既有配置与 turn 快照接口，Composer 仅合并其交互入口。菜单独立锚定入口向上展开；能力候选区独立滚动，搜索与技能设置常驻。顶部栏沿用生产实现，不复制原型中的共享壳脚本。

接入依据：`src/chat-coordinator.mjs` 的 getTurnContext/onThreadBound 钩子、`src/workbench/agent-bridge.mjs` 的逐授权 MCP、`src/workbench/task-turn-lock.mjs` 的跨讨论/Runtime 锁，以及 `src/desktop-run-manager.mjs` 的不可替换 task thread binding。方案规定需兑现的行为，生产验证由对应实施证据提供。
