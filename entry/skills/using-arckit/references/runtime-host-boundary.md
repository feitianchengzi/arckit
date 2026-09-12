# Runtime Host Boundary

## 当前任务与执行上下文

用户当前意图和未撤回的已有授权决定工作范围。Host 传入的 continuation、拒绝详情和 next_prompt 是恢复上下文，不能自行扩大任务授权、替换已接受事实或预选下一个 Gap。先按正常入口 fresh-read、比较候选；项目可见范围不等于当前授权范围。

Host 的 `task_context` 提供当前可信 Case 绑定和执行恢复信息，每轮随 Ledger 回执刷新。`execution_checkpoint.case_chain` 保留本次执行的 Case 关联，`pending_continuation` 保存收尾发现及其来源 Case；它们不是 canonical Case facts，也不指定下一 Gap。结合原任务、用户当前增量、fresh state 和证据判断工作，沿正常 Ledger 接口提交；任务绑定与执行阶段的持久化由 Host 完成。

## 被拒后的恢复

按实际失败责任处理。引用、结构或证据声明错误由同一 Agent 修复，复用仍有效的工作成果，提交完整替代主张；不得为通过校验静默改变语义判断。真实 revision/selection token 冲突先 fresh-read。可信 Ledger 的实现缺陷或运行副本缺少能力，保留原主张、证据、拒绝与实际能力路径，报告具体恢复条件。

业务提交失败本身不授权修改通用 skill、校验器或应用分发副本。能力维护已经在用户授权范围内时，按正常 Case/Gap 方法处理，并保留原业务未完成义务；没有这项授权时报告能力故障，不把它写成必须由用户作出的业务决定。协议数据 reconciliation 与修复执行它的程序是不同工作。

## 停止与完成

用户要求结束本次执行时，可以返回 `handoff`、`next_responsibility: none`，说明已有成果与未完成义务。它不宣称 Case 完成，不要求新建或关闭 Case 来满足结束条件。只有可信 Ledger 接受的 Case 完成，才进入任务完成后的收尾。human 仅表示确实需要人的决定；external wait 需要具体外部条件；技术故障如实报告。

## ArcOrbit Git 收尾

仅在 Host 明确调用 `task_closeout` 且提供可信 Case 完成依据时适用。结合原任务、Case、同线程证据、可信 Ledger 变更路径及实际 Git hunks，提交已审查的本任务成果；路径清单是上下文，不是排他 allowlist。保留无关修改，已提交或无差异时返回 `no_changes`。

收尾不新增内容修改或额外语义 Review。若发现需要继续处理的实质工作，返回带具体证据的 `resume_loop`。Host 持久保存该发现并恢复同一线程的普通 Loop；下一轮 fresh-read 后按正常方法选择工作。

已关闭 Case 的历史验收保持原样；如新事实暴露后续义务，选择适合的 active Case，或创建引用原 Case 与发现证据的有界后续 Case，再推进和 Review，不伪造旧 Case 重开。Ledger 接受后，Host 将选定 Case 绑定为本次执行的当前 Case，并保留前后 Case 与收尾发现的关联。Case 选择及事实归属由 Agent 判断，Host 不因关联多个 Case 推断额外工作或改变授权。

已有授权覆盖的 Agent 工作不因所处阶段变成人工责任。用户要求结束执行时返回 `stopped`，保留尚未完成的收尾义务，不宣称待办完成。确需人的决定返回 `needs_human`，真实外部等待返回 `external_wait`，在 `summary` 中写清决定或依赖及恢复条件，附带证据；技术失败返回 `failed` 并说明实际错误。合法的停止、等待与续办都是执行结果，不是格式校验失败。
