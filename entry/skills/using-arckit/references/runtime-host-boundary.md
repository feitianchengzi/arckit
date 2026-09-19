# Runtime Host Boundary

## 当前任务与执行上下文

Host prompt 以自然语言说明任务、授权和读取入口，不嵌入项目文件正文或 Project/Case 状态转储。项目文件通过工作区相对路径引用；Host 上下文资源只提供源引用、可信入口、契约及必要执行恢复信息，不另建项目事实副本。Agent 自行读取源文件，并通过 trusted snapshot 确认当前状态和版本。场景工具返回的工作事项状态、Agent 进展报告与 Ledger 事实分开理解，不能互相替代。

用户当前意图和未撤回的已有授权决定工作范围。Host 传入的 continuation、拒绝详情和 next_prompt 是恢复上下文，不能自行扩大任务授权、替换已接受事实或预选下一个 Gap。先按正常入口 fresh-read、比较候选；项目可见范围不等于当前授权范围。

Host 的 `task_context` 提供当前可信 Case 绑定和执行恢复信息，每轮随 Ledger 回执刷新。`case_checkpoint.case_chain` 保留本次执行的 Case 关联，`pending_continuation` 保存后续发现及其来源 Case；它们不是 canonical Case facts，也不指定下一 Gap。结合原任务、用户当前增量、fresh state 和证据判断工作，沿正常 Ledger 接口提交；任务绑定与执行阶段的持久化由 Host 完成。

## 被拒后的恢复

按实际失败责任处理。引用、结构或证据声明错误由同一 Agent 修复，复用仍有效的工作成果，提交完整替代主张；不得为通过校验静默改变语义判断。真实 revision/selection token 冲突先 fresh-read。可信 Ledger 的实现缺陷或运行副本缺少能力，保留原主张、证据、拒绝与实际能力路径，报告具体恢复条件。

业务提交失败本身不授权修改通用 skill、校验器或应用分发副本。能力维护已经在用户授权范围内时，按正常 Case/Gap 方法处理，并保留原业务未完成义务；没有这项授权时报告能力故障，不把它写成必须由用户作出的业务决定。协议数据 reconciliation 与修复执行它的程序是不同工作。

## 停止与完成

Host 提供的 `execution_progress` 是各轮执行事实和 Agent 声明的历史，按 round-boundary-contract 中的进展方法复核；Host 不决定本轮是否推动了原任务。`task_progress` 表达进展判断，`handoff` 表达下一责任；二者不能互相代替。Host 的协议修复失败或旧版进展阈值停止记录不等于需要用户作业务决定。

用户要求结束本次执行时，可以返回 `handoff`、`next_responsibility: none`，说明已有成果与未完成义务。它不宣称 Case 完成，不要求新建或关闭 Case 来满足结束条件。Case 完成只能来自可信 Ledger 的接受；Host 是否要求额外交付由其显式执行策略决定。human 仅表示确实需要人的决定；external wait 需要具体外部条件；技术故障如实报告。

## 完成后的新发现

已关闭 Case 的历史验收保持原样；如 Host 传回的新事实暴露后续义务，fresh-read 后选择适合的 active Case，或创建引用原 Case 与发现证据的有界后续 Case，再按正常 Gap 方法推进和 Review，不伪造旧 Case 重开。Case 选择和事实归属由 Agent 判断；执行关联本身不扩大授权，也不预选 Gap。
