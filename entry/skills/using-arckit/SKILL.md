---
name: using-arckit
description: "在 Arckit 项目中持续推进真实软件开发事项。依据 fresh Project 软件定义决策/不变量/推进状态与 Case facts/state impacts/dynamic gaps，选择最值得优先处理的 gap，由同一 Agent 动态使用必要 skills/tools 完成并形成可信 transition；自动续轮直到 resolved，只有 human responsibility 暂停。"
---

# Using Arckit

本 skill 是通用状态驱动控制算法，不硬编码产品、交互、视觉、技术、代码或测试流程，也不规定 skill、路径和工作顺序。项目个性化来自 Project State 的显式软件定义清单及其已沉淀决策；事实变化通过 Case impacts 和动态 gaps 推进。

## 硬边界

- Project `project-state-record/v5` 明确给出软件能力决策清单、当前决策、抽象软件不变量和当前推进上下文。Agent 必须逐项理解它们，但不会为每项制造过场 gap。
- 所有 active Case 使用 `development-case-record/v5`。Case 只记录实际相关的 facts、targeted impacts、dynamic gaps、问题、handoff 和 completion review。
- 当前 Agent 负责恢复全部相关信息、判断下一 gap 的优先级、动态选择 skills/tools/paths、完成工作并验证。Runtime 不做语义预路由。
- 一个 Loop 只提交一个 selected gap transition。每轮都从 fresh state 独立判断最重要的当前动作，不预先制定 impacts 或未来 gap 链。
- 文档是否更新由当前 Gap 的目标、Project decisions/invariants、长期事实与代码现实共同决定。该更新应在最合适的 Gap 中自然发生，而不是靠最终 Review 常规补齐。
- Completion Review 是唯一显式语义自查，只在普通工作闭合后检查实施正确性、问题是否真实解决、验证可信度、回归风险与最小性。普通 Gap 的证据收集和确定性校验不是额外 Review 阶段。
- Agent 不直接手改 ledger；只向 trusted entrypoint 提交 Case control、Case transition 或 handoff。

## 状态驱动 Loop

### 1. 恢复全部相关信息

读取用户当前增量、fresh Project/Iteration、全部 active Cases、15 项软件定义决策、软件不变量，以及完成当前判断所需的长期文档、源码、配置、日志和测试。Project State 是明确的思考框架，不是 skill/path 路由表。正向轮次见 [references/controller-conversation-protocol.md](references/controller-conversation-protocol.md)，输入边界见 [references/controller-input-boundary.md](references/controller-input-boundary.md)。

### 2. 选择或创建 Case

结合用户意图、Project gaps、active Cases、风险和依赖选择唯一 Case。没有合适 Case 时返回 `case_control.create_case`：明确 intent/outcome、至少一个 accepted fact，以及基于当前主要阻塞或不确定性得出的一个具体 initial gap。只有现有证据已经表明某个 Project target 受到实际影响时才创建 initial impact；允许为空，不预测影响范围。

### 3. 动态选择下一 Gap

根据本轮 fresh state，比较 ledger 已派生的 ready candidates 与当前上下文刚显露、尚未持久化的必要动作，再按阻塞程度、风险、信息增益、依赖、用户影响与可验证性选择一个。`candidate` 逐字段接受当前候选；`fresh` 则显式提出一个 Agent-owned、无未闭合依赖且能在本轮完成的新 Gap，并在同一 transition 中创建和关闭它。不要按软件定义清单或数组顺序执行，也不要为了后续轮次预写 gap 链。Bug 根因未知时，诊断 Gap 通常因信息增益最高自然胜出；若交互语义未知，先澄清交互模式也来自当前事实，而不是框架内置类型规则。

只有当前 transition 会对 Project target 形成可接受结论时才记录 impact。Invariant 用来约束该 transition 能否被接受，不负责生成诊断、设计、实现或测试 Gap。对实际相关 target 的判断为：

- 已满足：`upheld` + 持久证据。
- 被威胁：`threatened` + open gap。
- 证据不足：`undetermined` + 调查/澄清 gap。
- 不相关：不创建 impact 或 not-required 状态。

### 4. 同一 Agent 完成一个 Gap

围绕 Gap goal 读取所有相关上下文并动态使用必要 skills/tools。可以只做需求定义、只定位代码根因、维护某份文档，或完成实现与测试；完成标准是目标和 evidence requirement 真实满足。这是执行与证明，不引入“执行后自查”步骤。

### 5. 提交 Transition

按 [references/closeout-handoff.md](references/closeout-handoff.md) 提交：`gap_selection`、完整 selected gap、Case facts/impacts/gaps delta、当轮 Project State delta、证据、round outcome 与 Case claim。`gaps_added` 只保存本轮已经发现、确实无法在本轮完成且值得后续追踪的真实未解决工作，不作为常规路线图。软件定义决策在被真正澄清的当轮就进入 Project State；实现轮重新读取这些最新决策并据此工作。

### 6. 自动续轮

Ledger 写回后 fresh-read，再独立判断下一 Gap。即使 ledger 此时派生了 Completion Review，只要 fresh state 暴露了更重要的普通工作，本轮仍可选择 `fresh` Gap；只有确实没有普通未完成工作时才执行 Review。Agent-owned 自动继续；external 保持可恢复等待且可先做其他 agent-ready 工作；只有 human responsibility 暂停。Case resolved 后仅允许 Git-only closeout，不再检查语义正确性、运行验证、编辑或修复内容。

## 输出

- selected Case 和动态 Gap，或完整 `case_control.create_case`
- 本轮使用的决策、事实、invariants、skills/tools 与 evidence 摘要
- `arckit-case-transition/v6` 或明确 handoff
- `round_outcome`、`case_resolution`、`project_state_delta`、`loop-handoff/v2`
