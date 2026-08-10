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
- 一个 Loop 只提交一个 selected gap transition；同一轮可接受新事实、更新相关 impacts、形成后续 gaps，并立即提交相关 Project State 变化。
- 文档是否更新由当前 Gap 的目标、Project decisions/invariants、长期事实与代码现实共同决定。该更新应在最合适的 Gap 中自然发生，而不是靠最终 Review 常规补齐。
- Review 只在普通工作闭合后出现，重点检查代码实施正确性、问题是否真实解决、验证可信度、回归风险与最小性。
- Agent 不直接手改 ledger；只向 trusted entrypoint 提交 Case control、Case transition 或 handoff。

## 状态驱动 Loop

### 1. 恢复全部相关信息

读取用户当前增量、fresh Project/Iteration、全部 active Cases、15 项软件定义决策、软件不变量，以及完成当前判断所需的长期文档、源码、配置、日志和测试。Project State 是明确的思考框架，不是 skill/path 路由表。输入边界见 [references/controller-input-boundary.md](references/controller-input-boundary.md)。

### 2. 选择或创建 Case

结合用户意图、Project gaps、active Cases、风险和依赖选择唯一 Case。没有合适 Case 时返回 `case_control.create_case`：明确 intent/outcome、至少一个 accepted fact、实际相关的 decision/invariant impacts，以及至少一个具体 gap。

### 3. 动态选择下一 Gap

在所有 ready gaps 中，根据阻塞程度、风险、信息增益、依赖、用户影响与可验证性选择一个。不要按软件定义清单或数组顺序执行。Bug 根因未知时，通常先选最大幅降低不确定性的诊断 Gap；若产品语义未知，则先澄清产品决策；这来自当前事实而不是固定规则。

对 Project target 的判断为：

- 已满足：`upheld` + 持久证据。
- 被威胁：`threatened` + open gap。
- 证据不足：`undetermined` + 调查/澄清 gap。
- 不相关：不创建 impact 或 not-required 状态。

### 4. 同一 Agent 完成一个 Gap

围绕 Gap goal 读取所有相关上下文并动态使用必要 skills/tools。可以只做需求定义、只定位代码根因、维护某份文档，或完成实现与测试；完成标准是目标和 evidence requirement 真实满足。

### 5. 提交 Transition

按 [references/closeout-handoff.md](references/closeout-handoff.md) 提交：完整 selected gap、Case facts/impacts/gaps delta、当轮 Project State delta、证据、round outcome 与 Case claim。软件定义决策在被真正澄清的当轮就进入 Project State；实现轮重新读取这些最新决策并据此工作。

### 6. 自动续轮

Ledger 写回后 fresh-read，再基于全部当前状态选择下一 Gap。Agent-owned 自动继续；external 保持可恢复等待且可先做其他 agent-ready 工作；只有 human responsibility 暂停。构建时间、总墙钟和生产性轮数不是停止条件；Case resolved 后结束。

## 输出

- selected Case 和动态 Gap，或完整 `case_control.create_case`
- 本轮使用的决策、事实、invariants、skills/tools 与 evidence 摘要
- `arckit-case-transition/v5` 或明确 handoff
- `round_outcome`、`case_resolution`、`project_state_delta`、`loop-handoff/v2`
