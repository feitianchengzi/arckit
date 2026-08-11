# Agent Loop

## 定位

本规格定义人类直接在 Codex 中使用 Arckit，以及 Desktop Runtime 自动推进同一事项时共享的 `Project State -> Case -> Loop` 语义。

默认形态是一个连贯的 Codex Agent 工作单元：同一 Agent 在一个 turn 内恢复 fresh Project/Case state、用 Project decisions/invariants 指导 Case 候选发现、选择一个 Case gap、使用必要 skills/tools 只完成该 Gap，并提交 transition 或责任明确的 handoff。Runtime 取代人类在对话外执行的自动化动作，不取代 Agent 的能力。

Loop 是一次可验证的 Case 状态推进，不等于 Agent 内部每次工具调用；一个 Loop 只处理一个 gap。

## 责任边界

| 参与者 | 职责 | 不负责 |
|---|---|---|
| 人类 | 提供目标、补充与纠错；承担取舍、授权、审美、风险接受和发布责任 | 不手工搬运默认流水线中的伪 packet/report |
| Codex Agent | 选择 Case/gap；原生选择 skills/tools；调查、实现、验证、自我审查；形成语义 claim | 不直接写 ledger；不静默代替人类决策 |
| Desktop Runtime | readiness、任务领取、授权投影、持久 thread、fresh-state bridge、上下文压缩、结构门禁、trusted ledger、自动续轮、恢复与 commit | 不预选 gap、固定 skill/role/path；不语义复审 Agent 工作 |

`using-arckit` 是当前 Agent 的对话控制协议，不是另一个必须先规划、后交给当前 Agent 执行的角色。`arckit-development-ledger` 是唯一确定性状态写回能力。

## 人类直接在 Codex 中工作

人类在一个持续对话中调用 `$using-arckit`。当前 Agent：

1. 通过 ledger manifest 声明的 trusted snapshot entrypoint 读取 Project State、全部 active Cases、iteration、candidate catalog、revision 与 snapshot token；不能把 writeback candidate 当作 fresh state。
2. 判断用户输入是新事项、继续、补充、纠错、目标变化、暂停或状态查询。
3. 结合 Project decisions/invariants、fresh Case facts、既有显式判断与稳定事实源，发现本轮实际相关的 fresh gap 候选；曾经完成的事实域可以因新 facts 重新成为候选，但 Case 初始化和上一轮不得预排工作顺序。
4. 明示本轮 `round_opening`：列出 persisted candidates、本轮 fresh gap 候选、eligibility、priority basis 与 selected/deferred/excluded 结论，声明 selected gap 的唯一 acceptance claim 和执行边界，再选择一个 active Case 与一个 gap；没有合适 Case 时请求 `case_control.create_case`。
5. 在当前 turn 内使用适合的事实、skills 和工具，只完成 selected gap 及证明其 claim 所必需的工作；新发现不能授权同轮完成另一个可独立接受结果。
6. 记录本轮确认或改变的 Case facts、它们对 Project decisions/invariants 的实际 impacts、invariant-guided 显式判断和由此暴露的后续 gaps；只提交由 selected gap 直接建立的 Project delta，不执行新增 gap。
7. 执行与风险相称、只用于证明 selected gap 的验证和自我审查。
8. 提交绑定 snapshot token、完整比较轨迹和 evidence 的 transition，或形成 human/external handoff。
9. ledger 写回成功后先展示独立 `round_closeout`，再以其 post-commit token 调 trusted snapshot entrypoint；只有这个 fresh-read receipt 可启动下一轮。

用户不需要为概念上的“计划—执行—复审”创建多个对话。验证、修复和提交继续使用当前对话。

## Runtime 自动化形态

默认自动执行链路是：

```text
local readiness
  -> remote claim
  -> fresh Project/Case read
  -> one $using-arckit Agent turn
  -> structural/revision/authorization gate
  -> trusted ledger writeback
  -> user-visible round_closeout
  -> trusted post-commit snapshot read
  -> next turn in the same task thread
```

Runtime invocation 只提供自然的 `$using-arckit` 触发、真实用户意图、当前增量、由 canonical records 确定性派生的 bounded facts、revision 与执行授权。Codex output schema 作为机器参数约束返回形状。Runtime 不显式注入一份额外 skill input，不拼接 skill 正文、固定 workflow、Worker role、skill 白名单或预测路径。

一个远端待办从领取、逐 gap 推进、验证、修复到 Git commit 始终绑定一个持久 Codex thread。Runtime 在第一个 turn 前保存 Codex 返回的 thread id；进程重启后通过该 id 恢复对话并继续追加 turn。fresh canonical facts 与当前授权覆盖冲突的历史内容，ledger 与持久 thread 分别提供事实恢复和语义连续性。

每次成功 ledger 写回后，Runtime 用该 thread 最新请求的 input tokens 除以模型 context window 计算上下文占用率。占用率达到 80% 时，Runtime 在同一 thread 完成上下文压缩并等待压缩成功，再发起下一 gap turn。压缩不创建新对话，也不改变 canonical state。

自动执行持续到 Case resolved。只有下一步真实需要人类判断或授权时才把控制权交给人类；external wait 保持为可恢复等待而不伪装成人工责任。确定性基础设施失败或连续无 canonical 进展会进入明确恢复状态，不以生产性轮次、总墙钟或长命令时长停止。

总墙钟、生产性 Loop 数和长命令时长不是停止条件。每个 Loop 仍串行推进一个 gap；不通过合并 gap 或默认并发来换取速度。

## 输入与授权

真实用户输入与 Runtime 控制元数据必须分开。任务 ID、run ID、续轮深度、gate 和 ledger 状态不能伪装成 `role=user` 内容。自动续轮没有新增人类输入，Runtime 只发起下一 turn 并提供 fresh facts。

执行授权来自用户显式执行意图、Desktop auto-run policy 或外部已授权 packet。Runtime 负责 sandbox、approval 与 workspace 边界；Agent 的 skill/tool 选择不能扩大这些权限。

状态查询只报告，不触发工作区修改。human-responsibility gap 不由自动执行提升为 Agent 责任。

## 单 Loop 契约

一个 Loop 的标准步骤是：

1. 通过 trusted snapshot entrypoint 恢复 canonical facts、candidate catalog、revision 与 snapshot token；历史 transcript 只提供连续性。
2. 结合完整 Project decisions/invariants、fresh Case facts、已有 judgments 与当前稳定事实源，发现本轮实际暴露的 fresh candidates；invariant 是抽象指导，不产生固定 facet 或初始化 checklist。
3. 独立比较全部 persisted candidates 与本轮 fresh gap 候选，记录 eligibility、priority basis、selected/deferred/excluded 及理由，再选择一个 Case 和一个 gap。
4. 形成 selected gap 的唯一 acceptance claim、完成证据和明确边界；`planned_transition` 不预排后续事实域、skills、产物或步骤链。
5. 当前 Agent 自主使用必要 skills/tools，只完成 selected gap 及证明该 claim 所必需的调查、编辑、构建或测试。
6. 形成本轮 accepted Case facts，判断与 Project decisions/invariants 的 state impacts，保存本轮显式 judgments，并添加由新事实暴露的后续 dynamic gaps；新增工作不得在本轮继续执行。
7. 分离 `round_outcome`、`case_resolution`、`project_state_delta` 与 handoff。
8. 提交绑定 snapshot token、Case revision、observed Project revision、完整 selected gap 与比较轨迹的 Case transition。
9. Runtime 通过结构、revision、授权、路径和 ledger legality gate 后调用 trusted ledger。
10. 写回成功后展示 ledger 生成的独立 `round_closeout`，其中只陈述本轮已接受事实、judgments、证据和 resulting revisions，不携带下一 Gap 指令。
11. 以 closeout 的 post-commit token 调 trusted snapshot entrypoint；验证确实观察到 commit 后 state，才从 fresh catalog 开始下一轮。

Runtime 不把单个 gap 完成当成 Case 已关闭，也不让语义 resolved claim 覆盖结构 guard 的否决。Agent 可以提交 unresolved transition，并在同轮添加从新事实发现的后续 gap；有 blocker、未闭合 state impact 或 open gap 的 resolved claim 不能进入 writeback。

Case 的相关 state impacts、全部实际 gaps 和所有已经被 fresh facts 暴露为相关的 invariant-guided judgments 闭合后，当前 content revision 仍需以实现正确性、验证可信度、回归风险和最小性为重点的完成态复审。未记录不能等同于 `not_applicable`；复审、finding 修复和复验均由当前 Agent在同一 task thread 完成；最后一个授权自主复审仍有 findings 时转 human responsibility。

## Closeout 与 handoff

一轮 Agent turn 结束不等于 round、Case 或 Project 都完成。closeout 必须分别说明：

- 本轮工作是否 completed、partial、blocked、needs_human 或 external_wait。
- Case 是 unresolved、resolved 或 blocked，以及 remaining gaps。
- Project impact 是 none、proposed 或 accepted。
- 下一责任方是 agent、human、external 或 none。

此外，ledger 成功 receipt 必须提供可独立展示的 `round_closeout`；Runtime 与直接 Codex 使用同一份 canonical receipt。它与后续 `fresh_read` 是两个事件：前者证明上一轮接受了什么，后者证明下一轮基于哪个 commit 后 snapshot。closeout 不得夹带 `next_candidate` 或下一轮实施方向。

结构化输出不足时不得补造可写回 delta。Case 关闭必须有可解释的 Project impact 或明确 no-change closure。No-change closure 只用于重复、无效、过期、不再需要、合并、放弃或外部转移。

## Desktop 控制态

Desktop 只穷举可恢复控制态，不穷举业务路径：`no_context`、`running`、`interrupted`、`human_gate_required`、`agent_resumable`、`external_wait`、`blocked`、`failed_or_invalid`、`ledger_writeback_ready`、`ledger_writeback_blocked`、`ledger_written`、`context_compacting` 与 `committing`。

主动作只表达控制操作，如 Run、Respond、Resume、Resolve、Write Ledger 或 Diagnose。Desktop 不根据关键词决定业务下一步；用户补充交给同一 Agent结合 fresh state 解释。

readiness 必须在远端 claim 前完成。只有 ledger 写回成功后才能自动发起下一 turn，避免读取旧 Case revision。运行结果持久化语义快照，不保存逐 token/reasoning/command delta 的重复副本。

## 验收口径

- 人类直接在 Codex 中与 Runtime 自动执行使用同一 trusted snapshot、Case transition、round closeout 和 post-commit fresh-read 协议。
- 每轮在执行前可见地比较 persisted 与 fresh candidates；选择轨迹可解释关心的候选为何 selected、deferred 或 excluded。
- writeback candidate 不能充当 fresh state；下一轮必须持有验证过 `observed_after_commit=true` 的 snapshot receipt。
- 上一轮 transition 只能持久化结果 Gap，不得用复合步骤 Gap 预先约束下一轮实施路径；closeout 不携带 next candidate。
- selected gap 只建立一个可独立接受结果；执行中产生的新事实进入 Case delta 和下一轮候选，不授权同轮切换到新的结果。
- 每轮用 Project software invariants 与 fresh Case facts 动态发现显式判断；新增、变化、缺失、过时、歧义和冲突都可能使长期事实相关，实际相关判断必须有匹配其证据责任的结论或 Gap，且可以因后续 facts 重新打开。
- 默认每个 gap 只有一次连贯 Agent invocation，不强制 Plan/Worker/Review 三段调用。
- 同一待办全流程只使用一个持久 Codex thread；进程重启恢复该 thread，验证、修复、压缩和 Git commit 不切换 thread。
- Agent 可按原生机制使用已安装 skills/tools，Runtime 不维护默认 definition/diagnosis 白名单。
- Runtime 只替代人类自动化动作，不做语义微编排或二次业务审查。
- readiness 失败时远端任务仍保持未领取。
- 只有人类责任暂停自动执行；external wait 与 no-progress recovery 独立表达。
- 生产性 Loop、总墙钟和长命令没有完成上限。
- 上下文占用达到 80% 时在同一 thread 压缩完成后继续下一 gap。
- trusted ledger 是 Project/Case/iteration 状态的唯一写回入口。
