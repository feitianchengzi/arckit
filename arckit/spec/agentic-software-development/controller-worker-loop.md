# Agent Loop

## 定位

本规格定义人类直接在 Codex 中使用 Arckit，以及 Desktop Runtime 自动推进同一事项时共享的 `Project State -> Case -> Loop` 语义。

默认形态是一个连贯的 Codex Agent 工作单元：同一 Agent 在一个 turn 内恢复 fresh facts、选择一个 Case gap、使用必要 skills/tools 执行、验证、自我审查，并提交 transition 或责任明确的 handoff。Runtime 取代人类在对话外执行的自动化动作，不取代 Agent 的能力。

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

1. 读取 Project State、全部 active Cases、iteration 和上一 handoff。
2. 判断用户输入是新事项、继续、补充、纠错、目标变化、暂停或状态查询。
3. 选择一个 active Case 与一个完整 candidate gap；没有合适 Case 时请求 `case_control.create_case`。
4. 在当前 turn 内使用适合的事实、skills 和工具完成该 gap 所需工作。
5. 执行与风险相称的验证和自我审查。
6. 输出 evidence-backed transition 或 human/external handoff。
7. ledger 写回成功后，在同一对话基于 fresh state 继续下一个 gap。

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
  -> fresh read
  -> next turn in the same task thread
```

Runtime invocation 只提供自然的 `$using-arckit` 触发、真实用户意图、当前增量、由 canonical records 确定性派生的 bounded facts、revision 与执行授权。Codex output schema 作为机器参数约束返回形状。Runtime 不显式注入一份额外 skill input，不拼接 skill 正文、固定 workflow、Worker role、skill 白名单或预测路径。

一个远端待办从领取、逐 gap 推进、验证、修复到 Git commit 始终绑定一个持久 Codex thread。Runtime 在第一个 turn 前保存 Codex 返回的 thread id；进程重启后通过该 id 恢复对话并继续追加 turn。fresh canonical facts 与当前授权覆盖冲突的历史内容，ledger 与持久 thread 分别提供事实恢复和语义连续性。

每次成功 ledger 写回后，Runtime 用该 thread 最新请求的 input tokens 除以模型 context window 计算上下文占用率。占用率达到 80% 时，Runtime 在同一 thread 完成上下文压缩并等待压缩成功，再发起下一 gap turn。压缩不创建新对话，也不改变 canonical state。

自动执行只在以下情况暂停：

- `next_responsibility=human`：需要真实人类判断或授权。
- `next_responsibility=external`：等待外部结果，且没有其它 agent-owned gap。
- 连续没有 canonical ledger 进展并触发恢复保护，或确定性基础设施失败。

总墙钟、生产性 Loop 数和长命令时长不是停止条件。每个 Loop 仍串行推进一个 gap；不通过合并 gap 或默认并发来换取速度。

## 输入与授权

真实用户输入与 Runtime 控制元数据必须分开。任务 ID、run ID、续轮深度、gate 和 ledger 状态不能伪装成 `role=user` 内容。自动续轮没有新增人类输入，Runtime 只发起下一 turn 并提供 fresh facts。

执行授权来自用户显式执行意图、Desktop auto-run policy 或外部已授权 packet。Runtime 负责 sandbox、approval 与 workspace 边界；Agent 的 skill/tool 选择不能扩大这些权限。

状态查询只报告，不触发工作区修改。human-responsibility gap 不由自动执行提升为 Agent 责任。

## 单 Loop 契约

一个 Loop 的标准步骤是：

1. 恢复 fresh canonical facts；历史 transcript 只提供连续性。
2. 从全部 active Cases 中选择一个 Case，再从 unordered `candidate_gaps` 选择一个 gap。
3. 形成 `planned_transition.goal`、expected state change 与 evidence requirement。
4. 当前 Agent 自主使用必要 skills/tools 完成事实维护、诊断、实现、构建、测试和自我审查。
5. 分离 `round_outcome`、`case_resolution`、`project_impact_candidate` 与 handoff。
6. 提交绑定 Case revision、observed Project revision 和完整 selected gap 的 `arckit-case-transition/v3`。
7. Runtime 通过结构、revision、授权、路径和 ledger legality gate 后调用 trusted ledger。
8. 写回成功后 fresh-read，再选择下一个 gap。

Runtime 不把 transition 中的一个 facet claim 当成 Case 已关闭，也不让语义 resolved claim 覆盖结构 guard 的否决。Agent 可以提交 unresolved repair transition；有 blocker 的 resolved claim 不能进入 writeback。

Case 六个 facets 达到目标只表示 `base_ready`。当前 content revision 仍需 correctness、completeness、minimality 复审。复审、finding 修复和复验均由当前 Agent在同一 task thread 完成；最后一个授权自主复审仍有 findings 时转 human responsibility。

## Closeout 与 handoff

一轮 Agent turn 结束不等于 round、Case 或 Project 都完成。closeout 必须分别说明：

- 本轮工作是否 completed、partial、blocked、needs_human 或 external_wait。
- Case 是 unresolved、resolved 或 blocked，以及 remaining gaps。
- Project impact 是 none、proposed 或 accepted。
- 下一责任方是 agent、human、external 或 none。

结构化输出不足时不得补造可写回 delta。Case 关闭必须有可解释的 Project impact 或明确 no-change closure。No-change closure 只用于重复、无效、过期、不再需要、合并、放弃或外部转移。

## Desktop 控制态

Desktop 只穷举可恢复控制态，不穷举业务路径：`no_context`、`running`、`interrupted`、`human_gate_required`、`agent_resumable`、`external_wait`、`blocked`、`failed_or_invalid`、`ledger_writeback_ready`、`ledger_writeback_blocked`、`ledger_written`、`context_compacting` 与 `committing`。

主动作只表达控制操作，如 Run、Respond、Resume、Resolve、Write Ledger 或 Diagnose。Desktop 不根据关键词决定业务下一步；用户补充交给同一 Agent结合 fresh state 解释。

readiness 必须在远端 claim 前完成。只有 ledger 写回成功后才能自动发起下一 turn，避免读取旧 Case revision。运行结果持久化语义快照，不保存逐 token/reasoning/command delta 的重复副本。

## 验收口径

- 人类直接在 Codex 中与 Runtime 自动执行产生相同的 Case transition、closeout 和 handoff。
- 默认每个 gap 只有一次连贯 Agent invocation，不强制 Plan/Worker/Review 三段调用。
- 同一待办全流程只使用一个持久 Codex thread；进程重启恢复该 thread，验证、修复、压缩和 Git commit 不切换 thread。
- Agent 可按原生机制使用已安装 skills/tools，Runtime 不维护默认 definition/diagnosis 白名单。
- Runtime 只替代人类自动化动作，不做语义微编排或二次业务审查。
- readiness 失败时远端任务仍保持未领取。
- 只有人类责任暂停自动执行；external wait 与 no-progress recovery 独立表达。
- 生产性 Loop、总墙钟和长命令没有完成上限。
- 上下文占用达到 80% 时在同一 thread 压缩完成后继续下一 gap。
- trusted ledger 是 Project/Case/iteration 状态的唯一写回入口。
