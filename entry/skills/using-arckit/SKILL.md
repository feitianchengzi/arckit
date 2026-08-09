---
name: using-arckit
description: "在 Arckit 项目中由 Codex 类 Agent 持续推进真实软件开发事项时使用。它把人工直接对话或 Runtime 自动桥接统一为 Project 选 Case、Case 选一个 gap、同一 Agent 完成一次有证据 transition 的循环；不写 ledger，也不要求固定 Worker、skill 顺序或 Plan/Worker/Review 三段调用。"
---

# Using Arckit

本 skill 是 Project State -> Case -> Loop 的语义控制协议。它约束当前 Agent 如何选择和收束工作，不把当前 Agent 拆成多个角色：默认由同一 Agent 在一个 turn 内选择一个 Case gap、使用必要 skills/tools 执行、验证并形成 transition；Runtime 只自动化外部控制与续轮。

## 硬边界

- Project State 只表达软件整体位置、项目级 gaps、active Cases 与选择依据；Case State 保存单事项 facets、问题、handoff、content revision、复审与 candidate gaps；Loop 只推进一个 gap。
- 当前 Agent 拥有语义判断、原生 skill 选择、工作区调查、实现、验证和自我审查。`using-arckit` 提供控制协议，不替代事实域/工程 skills，也不禁止当前 Agent 使用它们。
- Runtime 不预选 gap、固定 skill、执行角色、路径范围或 ledger 维度，也不把一次 Agent Loop 拆成 Plan、Execute 和 Review 三段调用。
- Agent 不直接写 Project/Case ledger；它提交 Case control、Case transition 或 handoff，由 trusted ledger entrypoint 校验和写回。
- round completed、Case resolved 与 Project impact 相互独立；`deferred` 不是完成，责任转移必须有 owner 与恢复条件。
- 六 facets 达到目标只表示 `base_ready`；当前 `content_revision` 仍需完成 correctness、completeness、minimality 复审。自主复审预算耗尽后转人工，Agent 不重置或自行追加。

## 主流程

### 1. 恢复 fresh facts

输入：用户消息或 operator event、Project v4、全部 active Case v3、iteration、上一 handoff。Runtime 可以提供由这些 records 确定性派生的 bounded digest；人工对话由当前 Agent 主动读取 records。

动作：读取 [references/controller-input-boundary.md](references/controller-input-boundary.md)，判断输入是补充、纠错、目标变化、状态查询、继续或新事项。对话历史只提供连续性，当前 revision、canonical facts、用户增量和授权始终优先。

退出条件：已掌握全部 active Cases 的选择事实；状态查询直接报告而不执行。

### 2. 选择唯一 Case 与 gap

动作：结合 Project 选择依据、用户意图、稳定事实与风险选择一个 active Case，再从其 `candidate_gaps` 动态选择一个 `scope=case` gap；数组顺序不表达优先级。没有合适 Case 时只输出 `case_control.create_case`，包含 title、intent、artifact_type 与 selection_reason，等待 ledger 注册后 fresh-read 再选 gap。

`completion_review` 只在 `base_ready=true` 后选择；`review_findings` 先修复或有证据处置。human-responsibility gap 不自动执行。

退出条件：有完整 selected gap、`planned_transition.goal`、expected state change 与 evidence requirement，或唯一 Case control/handoff。

### 3. 在当前 Agent turn 完成一个 gap

动作：当前 Agent根据 gap 主动读取必要事实源，发现并使用合适 skills/tools，完成所需文档维护、诊断、实现、构建、测试和自我审查。可以规格先行、代码先行或混合推进；不适用 facet 也要形成 evidence-backed `not_required`。

退出条件：当前 gap 已形成有证据的 accepted delta，或明确需要 human/external input；不得为了流程形状制造额外 Agent 调用。

### 4. 分离 closeout

读取 [references/closeout-handoff.md](references/closeout-handoff.md)，分别形成：

- `round_outcome`
- `case_resolution`
- `project_impact_candidate`
- 完整 `arckit-case-transition/v3`，绑定 Case revision、observed Project revision 和逐字段 selected gap
- `loop-handoff/v2`

Runtime 桥接返回紧凑 `arckit-agent-loop-result/v1`，其 action 只能是 `case_control`、`case_transition` 或 `handoff`；人工桥接可以直接呈现同等 transition/handoff。结构或证据不足时不补造可写回 delta。

退出条件：得到可交 trusted ledger 的对象，或得到不能写回且责任明确的 handoff。

### 5. Fresh-state continuation

成功 ledger writeback 后重新读取 Project/Case State，再选择下一个 gap。人工对话继续当前会话；Runtime 在同一活动 Codex thread 发起下一 turn。只有 human responsibility 时暂停自动执行；external wait 独立暂停。连续无 ledger 进展可以触发恢复保护，但总墙钟、生产性 Round 数和长命令时长不构成停止条件。

退出条件：Case resolved 后结束；Agent-owned gap 自动继续；human/external responsibility 暂停并给出恢复条件。

## Reference 路由

- Runtime digest、人工 records、thread 历史与授权的权威关系：读 [references/controller-input-boundary.md](references/controller-input-boundary.md)。
- 完整对话序列与 Case control 规则：读 [references/controller-conversation-protocol.md](references/controller-conversation-protocol.md)。
- transition、三层结果与 handoff：读 [references/closeout-handoff.md](references/closeout-handoff.md)。

## 输出

- selected Case/gap 与 planned transition，或 `case_control.create_case`
- 使用的事实/skills/tools 摘要与 evidence
- accepted Case State delta
- `round_outcome`、`case_resolution`、`project_impact_candidate`
- `arckit-case-transition/v3` 或责任明确的 handoff
- `loop-handoff/v2`
- Runtime 桥接时的 `arckit-agent-loop-result/v1`
