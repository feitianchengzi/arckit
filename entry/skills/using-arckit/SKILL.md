---
name: using-arckit
description: "在 Arckit 项目中持续推进真实软件开发事项。依据 fresh Project desired conditions 与 Case facts/state impacts/dynamic gaps，选择一个最值得优先处理的 gap，由同一 Agent 动态使用必要 skills/tools 完成并形成可信 transition；自动续轮直到 resolved，只有 human responsibility 暂停。"
---

# Using Arckit

本 skill 是通用的状态驱动控制算法，不编码产品、交互、视觉、技术、代码或测试清单，也不规定 skill、路径与工作顺序。项目差异由 Project State 的具体 `desired_conditions` 表达；事项差异由 Case facts、state impacts 与动态 gaps 表达。

## 硬边界

- Project State 保存宏观 completeness dimensions、项目具体 desired conditions、Project gaps 与 active Case refs；condition 只描述何时相关、必须成立什么及证据期望，不包含 skill、path、owner 或流程。
- 所有 active Case 使用 `development-case-record/v4`：facts、state_impacts、dynamic gaps、问题、handoff、content revision 与 completion review。旧协议项目必须先按当前意图、证据和实现做显式语义升级；本 skill 与 Runtime 不解释或自动迁移旧状态。
- 当前 Agent 负责语义判断、事实恢复、condition 相关性判断、gap 形成与排序、原生 skill/tool/path 选择、实际执行和验证。Runtime 不预选这些内容。
- 一个 Loop 只提交一个 selected gap transition。完成当前 gap 时可以接受新事实、更新实际相关的 impacts，并暴露后续 gaps；不能顺手关闭另一个 gap。
- 文档、诊断、实现、验证和交付使用同一种 gap。没有实际影响时不创建对应状态项，也不提交 not-required 过场。
- Agent 不直接改 ledger；只提交 Case control、Case transition 或 handoff 给 trusted entrypoint。
- Review 只在普通 gaps、问题、handoff 与 threatened/undetermined impacts 全部闭合后出现，重点检查实施正确性、问题是否真实解决、验证可信度、回归风险与最小性。

## 状态驱动 Loop

### 1. 恢复全部相关事实

读取当前用户增量、fresh Project/Iteration、全部 active Cases、Project desired conditions、Case facts/impacts/gaps 和完成当前工作所需的源码、文档、配置、日志与测试。权威边界见 [references/controller-input-boundary.md](references/controller-input-boundary.md)。状态查询只报告，不执行。

### 2. 选择或创建 Case

结合用户意图、Project gaps、风险和 active Case 边界选择唯一 Case。没有合适 Case 时返回 `case_control.create_case`，明确：title、intent、expected_outcome、artifact_type、selection_reason、initial_facts、实际相关的 initial_impacts，以及至少一个具体 initial_gap。Ledger 不从关键词补造语义。

### 3. 推导并选择下一 gap

先判断新事实对哪些 active desired conditions 实际相关：

- condition 已满足：记录 `upheld` impact 和持久证据。
- condition 被威胁：记录 `threatened` impact，并由至少一个 open gap 承接。
- 证据不足：记录 `undetermined` impact，并形成调查、澄清或取证 gap。
- 不相关：不写 impact，也不创建 not-required 项。

在所有 ready gaps 中结合阻塞程度、风险、信息增益、依赖、用户影响和可验证性选择一个；数组顺序不表示优先级。根因未知的 bug 通常先选择能最大幅降低不确定性的诊断 gap，但这不是固定路由。human-responsibility gap 交还人类；external wait 保持可恢复，若仍有 agent-ready gap 则继续可执行工作。

### 4. 同一 Agent 完成一个 gap

围绕 gap goal 读取全部相关上下文，动态发现并使用必要 skills/tools。只做产品定义、只做代码诊断、只维护文档或实现加测试都可以；选择由当前事实和依赖决定。完成标准是 gap 的目标与 evidence requirement 真正满足，而不是某类工件被走过。

### 5. 形成 transition

按 [references/closeout-handoff.md](references/closeout-handoff.md) 提交完整 selected gap 快照、resolved gap、facts/impacts/follow-up gaps、evidence、Case claim 与 Project impact candidate。普通内容变化提升 revision 并使旧 clean Review 失效；clean Review 不与内容变化同轮提交。

### 6. 自动续轮

Trusted ledger 写回后必须 fresh-read，再从当前 ready gaps 重新判断优先级。Agent-owned gap 自动继续，external wait 可恢复等待，只有 human responsibility 暂停。总墙钟、生产性轮数、构建或命令耗时不构成停止条件；Case resolved 后结束。

## Reference 路由

- 输入权威、事实恢复与停止责任：[references/controller-input-boundary.md](references/controller-input-boundary.md)
- 连续 Loop 与 Case control：[references/controller-conversation-protocol.md](references/controller-conversation-protocol.md)
- v4 transition、Project impact 与 handoff：[references/closeout-handoff.md](references/closeout-handoff.md)

## 输出

- selected Case 与动态 gap，或语义完整的 `case_control.create_case`
- 使用的 facts/conditions/skills/tools 与 evidence 摘要
- `arckit-case-transition/v4` 或责任明确的 handoff
- `round_outcome`、`case_resolution`、`project_impact_candidate`、`loop-handoff/v2`
