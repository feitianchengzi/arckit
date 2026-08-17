# Skill 架构

## 目标

Arckit Skill 架构把 `Project State -> Case -> Loop` 转成可安装、可复用、可验证的 Agent 能力。Skill 位于 Agent 能力层；Runtime 只自动化对话外控制。人类直接使用 Codex 和 Runtime 自动桥接必须得到相同的 Case transition、closeout 与 handoff。

当前仓库保留七个 Arckit skill，但“仓库分发能力集”不等于“Runtime 默认管理能力集”。Codex Agent可以原生发现和使用已安装 skills；Runtime 不需要为正常单 Agent工作复制一套能力路由。

## 分层

| 层 | 职责 | 边界 |
|---|---|---|
| Desktop / Runtime | readiness、任务领取、session/run、执行授权、fresh-state bridge、结构门禁、trusted ledger、续轮、恢复与 UI | 不选择业务 gap/skill/路径，不做语义微编排或二次业务审查 |
| Codex Agent | 恢复状态、选择一个 Case gap、原生使用 skills/tools、执行、验证、自我审查、提交结构化 claim | 不直接写 ledger，不静默承担 human responsibility |
| Skill | 提供可复用协议、事实源维护规则、方法、脚本、schema 和安全边界 | 不定义 Desktop 架构、固定业务路线或隐藏 skill import |

## 当前能力地图

### Entry

- `using-arckit`：当前 Agent 的项目对话控制协议。它从 fresh facts 选择一个 Case/gap，让同一 Agent在当前 turn 完成必要工作，并形成 transition/handoff；不直接写 ledger。
- `arckit-development-ledger`：确定性 Runtime 状态能力。它维护 Project State、iteration、Case、投影、索引和审计；只通过 trusted entrypoint 调用。

### Definition

- `arckit-spec`：稳定产品行为和验收口径。
- `arckit-interaction`：稳定交互状态、响应、错误态和线框。
- `arckit-visual`：稳定视觉策略、tokens、主题和组件规格。
- `arckit-tech`：稳定技术方案、架构边界、模型和契约。

### Engineering

- `arckit-debug-diagnosis`：实现事实诊断、证据收敛和必要修复指导。

技术栈 code skills 同样由 Agent 原生选择，不因未进入 Runtime 默认 policy 而不可用。

## 默认 Agent Loop

`using-arckit` 在一次 turn 中约束当前 Agent：

1. 读取 Project State、全部 active Cases、iteration 和上一 handoff。
2. 判断用户输入关系并选择唯一 Case/gap；无合适 Case 时请求 create_case。
3. 根据 gap 与仓库事实原生选择必要 skills/tools。
4. 执行事实维护、诊断、实现、构建、验证与自我审查。
5. 分离 round、Case、Project impact 与责任 handoff。
6. 提交绑定 revision、完整 selected gap 与 evidence 的 transition claim。

Runtime 只用 manifest 声明的自然 `$using-arckit` 文本 trigger 启动该 turn，不额外传 `skill` input item，也不拼接 SKILL.md 正文、固定 Worker 顺序、allowed skills、预测路径或 closeout 工作流。output schema 作为 Codex Adapter 的机器参数传递。

## Capability Registry 与 policy

每个 Runtime 可调用能力以 `arckit.capability.json` 声明 id、binding、invocation、输入输出、写入边界和禁止决策。确定性能力可以声明位于 skill 根目录内的 trusted entrypoints。

默认 `runtime/arcorbit/config/capability-policy.json` 只包含：

- Controller binding：`using-arckit`，负责自然 Agent skill trigger。
- Runtime binding：`arckit-development-ledger`，负责 trusted scripts。
- Worker binding：空。

这不是删除其它 skill；definition、diagnosis、code 和 quality 能力仍由 Agent 原生发现。Registry 只管理 Runtime 直接调用或约束的 capability，不充当 Codex skill catalog。

policy layer 与 Kernel 分离。Kernel 不内置 gap、route、role、skill 序列、能力选择启发式或 ledger 维度推断，也不维护 Worker registry。

Runtime 在远端任务 claim 前完成 readiness：确认安装的 `using-arckit` protocol 与仓库源兼容，并解析 repository-trusted ledger entrypoints。项目内同名 manifest 不能覆盖 Runtime trusted capability，entrypoint 不能逃逸 skill root。

## 原生 skill composition

Skill 使用软组合：上游 Agent分析结果可以成为下游事实维护输入，但不存在隐藏运行时 import。每个结果型 skill 独立说明输入、输出和写入边界。

当前 Agent是否使用 `arckit-spec`、`arckit-tech`、诊断或 code skill，由任务语义、Case gap、当前证据、用户显式点名和 Codex skill 规则共同决定。Runtime 不把 capability manifest 正文或固定列表塞入 prompt。

未确认内容进入 active Case 的 `open_questions`；外部等待进入 `pending_handoffs`；商业取舍、审美、风险接受和发布责任进入 human gate。不能用一个不存在的 skill 名作为占位依赖。

## Ledger 边界

Ledger 写回要求：

- transition 绑定 fresh Case revision、observed Project revision 和完整 selected gap。
- accepted delta、evidence、artifact impact、unresolved 与 handoff 可定位。
- human、external 与 runtime blocker 已正确分类。
- raw prompt、operator event、stream delta 和完整 transport envelope 不进入 durable semantic fields。
- semantic resolved claim 不能覆盖结构 guard 否决。

## 验收口径

- 仓库七个保留 skills 都有合法 manifest，但默认 Runtime policy 只直接管理 Agent 入口与 trusted ledger。
- 默认一个 gap 只产生一次连贯 `$using-arckit` Agent invocation。
- Agent 原生 skill discovery 在直接 Codex 和 Runtime 形态中一致。
- Runtime prompt 不复制 skill workflow，也不显式传第二份 skill item。
- Runtime readiness 在远端 claim 前发现安装漂移或 entrypoint 缺失。
- Kernel 不内置固定 gap、route、role、skill 序列、Worker registry 或预测路径。
- Runtime 不创建独立 Worker binding；其它 skills 只由当前 Agent原生使用。
- definition、diagnosis、Case 与 Project State 写入边界清楚。
- human/external 工作可通过 Case 与 handoff 恢复，不因能力精简丢失。
- ledger 语义与脚本只来自真实 `arckit-development-ledger` entrypoint。
