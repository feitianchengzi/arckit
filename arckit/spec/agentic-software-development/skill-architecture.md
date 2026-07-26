# Skill 架构

## 目标

Arckit Skill 架构把 `Project State -> Case -> Loop` 产品主轴转化为一个最小、可运行、可验证的能力集合。Skill 是安装到 Agent 中的底层能力包；Runtime 是控制面；Controller 和 Worker 是 loop 中的语义角色。

当前架构只保留七个 skill，不以历史能力目录、候选 skill 或已移除协作者作为运行前提。

## 分层

| 层 | 职责 | 边界 |
|---|---|---|
| Desktop / Runtime | 项目与 run 控制、执行授权、worker 生命周期、report intake、gate、ledger writeback 和 UI control state | 不替代 Agent 做产品、技术或实现语义判断 |
| Controller Agent | 恢复状态、选择 gap、命名本轮 role、绑定最小 `allowed_skills`、审核 report、判断 closeout | 不绕过 capability policy，不自动执行 worker，不静默写回 ledger |
| Worker Agent | 在 packet 边界内读取、修改、验证并返回结构化 report | 不扩大目标、不决定项目方向、不关闭 case |
| Skill | 提供可复用协议、事实源维护规则、脚本、schema 和安全边界 | 不定义 Desktop 架构或固定业务路线 |

## 当前能力地图

### Entry

- `using-arckit`：Controller execution plane 的项目对话协议，输出 controller frame、execution gate、route plan、worker packets、report intake rules、closeout rules 和 loop handoff；不绑定给普通 Worker。
- `arckit-development-ledger`：Runtime execution plane 的状态账本，维护 project state、iteration state、case record、投影、索引和审计；不进入 Worker `allowed_skills`。

Development ledger 放在 `entry/skills/`，因为它与 Controller 一起构成状态驱动 loop 的最小入口：Controller 解释并推进状态，ledger 恢复和持久化状态。

### Definition

- `arckit-spec`：稳定产品行为和验收口径。
- `arckit-interaction`：稳定交互状态、响应、错误态和线框。
- `arckit-visual`：稳定视觉策略、token、主题和组件视觉规格。
- `arckit-tech`：稳定技术方案、架构边界、模型和契约。

### Engineering

- `arckit-debug-diagnosis`：实现事实诊断、证据收敛和必要修复指导。

## Controller 路由

`using-arckit` 每轮按以下语义工作：

1. 读取 Project State、active case、iteration state、上一轮 loop handoff 和相关事实源。
2. 判断用户输入是新 case、继续、补充、纠错、目标变化、暂停、恢复、report intake 或状态查询。
3. 从当前状态和证据中选择本轮最值得推进的 gap。
4. 从 Capability Registry 中选择完成该 gap 所需的最小 skill 集。
5. 生成 execution gate 和单一职责 worker packets。
6. 审核 worker report 的边界、证据、风险和 unknowns。
7. 判断 `done`、`continue`、`needs_human`、`blocked` 或 `external_wait`。
8. 输出 loop handoff；符合 gate 时由 ledger 写回验证后的 state delta。

Runtime 不为这套流程预设固定 worker 顺序。空项目也由 Controller 根据用户输入、项目状态和证据选择首个 gap。

## Capability Registry 与策略层

每个保留 skill 的 `arckit.capability.json` 描述：

- `id` 和 `kind`
- `runtime_role`
- `binding_targets`
- `input_facts` 和 `outputs`
- `allowed_write_targets`
- `forbidden_decisions`
- `runtime_notes`
- `invocation`，用于声明 Agent skill trigger 或 Runtime entrypoint 调用方式
- `runtime_entrypoints`，仅供确定性 Runtime capability 声明 skill 内执行入口

Capability Registry 扫描仓库和项目中的 manifest，但只将显式 capability policy 允许的 ID 交给 Controller。当前策略位于 `runtime/arckit-runtime/config/capability-policy.json`，其能力全集与七个保留 skill 一致，并分成三个互斥 execution plane：Controller 组只有 `using-arckit`，Runtime 组只有 `arckit-development-ledger`，Worker 组包含四个 definition skill 和 `arckit-debug-diagnosis`。

策略过滤和业务路由分离。策略层决定能力可见性和可绑定 execution plane；Controller 只从 Worker 组决定本轮 `allowed_skills`；Runtime kernel 只执行解析、过滤、schema、授权、事件、report 和 gate 规则。Controller plan 或既有授权 packet 只要把 Controller/Runtime/未知能力绑定给 Worker，Runtime 必须失败关闭，不能静默删除非法 ID 后继续执行。

Execution plane 不等于只读取 metadata。Controller planning 和 review 必须通过 `using-arckit` manifest 声明的 `$using-arckit` Agent skill trigger 执行；Runtime prompt 只承载输入 envelope、registry、输出 schema 和 hard constraints，不复制 Controller 流程。项目初始化和 ledger writeback 必须解析 repository-trusted `arckit-development-ledger` entrypoint；Runtime 保留 hard gate，但 ledger 脚本、semantic boundary 和 semantic writeback 只在 skill 内维护。目标项目同名 manifest 不得覆盖 repository runtime capability，entrypoint 也不得逃逸 skill 根目录。

## Worker packet 与 report

Worker packet 至少包含 worker id、worker type、role、project root、case id、round goal、任务、上下文引用、允许动作、禁止动作、允许 skill、允许路径、停止条件和 report schema。

Worker report 至少包含 task id、worker type、role、状态、摘要、findings、evidence、changes、artifact impacts、risks、unknowns 和 recommendation。

`allowed_skills` 必须同时满足：

- 存在于过滤后的 Worker Capability Registry，且 manifest 声明 `binding_targets: ["worker"]`。
- 与本轮 gap 和 packet 责任相关。
- 写入路径不超过 capability manifest 和 packet 的共同边界。

Worker 不得使用策略外 skill，不得把候选判断直接写入稳定事实，也不得声称整个 round 已关闭。

## 稳定事实维护

四个 definition skill 是结果型能力。它们只接收已确认或有稳定依据的事实，并在各自 INDEX、正文、关系和投影规则内维护 source of truth。

未确认内容不需要依赖专门的前置 skill：

- 开放问题进入 active case `open_questions`。
- 待另一个执行体处理的内容进入 `pending_handoffs`。
- 人类授权或判断进入 `human_decision_required` 和 `human_gate`。
- 外部执行形成 `external_adapter_handoff`，包含输入、输出、边界、确认点和恢复条件。

仓库可以保留 `arckit/pending/` 或 `arckit/intake/` 作为项目数据 surface，但它们不是当前 Runtime capability，也不是任何保留 skill 的硬依赖。

## 实现与重构边界

正向编码由当前 agent、`arckit-code` 或 external adapter 执行。Controller 通过 worker packet 提供：

- 已确认事实和精确上下文引用。
- 允许修改和禁止修改路径。
- 外部行为护栏。
- 必须运行的验证。
- 风险、unknowns 和停止条件。

行为不变重构使用同一有界 packet 机制，不依赖独立重构 skill。出现重大产品、技术或人类取舍时，Controller 将其保留为 open question 或 human gate，而不是由实现 worker 静默拍板。

`arckit-debug-diagnosis` 只在已出现异常且根因不确定时使用。它可以指导证据指向的必要修复，但不承担正向功能设计、架构重写、case 关闭或发布判断。

## Ledger 写回

Project State 是 canonical project record 的恢复视图，case 是状态变化的事项证据，loop 是一次有界推进过程。

Ledger 写回必须满足：

- Controller 或 human 提供短语义状态转移。
- 必需 worker report 已通过 intake。
- evidence 和 artifact impact 可定位。
- source fact、projection artifact、implementation evidence 和 unresolved item 已区分。
- human gate、外部等待和 runtime blocker 已正确分类。
- Runtime raw event、完整 prompt 或完整 transport envelope 没有进入长期语义字段。

## 外部能力接力

当前 capability policy 之外的代码审查、质量专项、发布、运维、商业决策、审美批准、组织授权或平台操作通过 external adapter 接力。接力材料包含目标、事实依据、允许范围、禁止范围、预期结果、验证要求、确认点和回传位置。

超出当前能力集不等于工作丢失。Controller 把它保留在 case 并明确 `next_responsibility`、`trigger_mode`、恢复条件和 `next_prompt`。

## 验收口径

Skill 架构满足规格时：

- 当前仓库 skill 集和 Runtime policy 是同一个七项集合。
- 所有保留 skill 都有合法 capability manifest。
- Runtime 扫描到额外 manifest 时不会暴露策略外 ID。
- Controller 只从过滤后的 Worker registry 绑定 `allowed_skills`；`using-arckit` 和 `arckit-development-ledger` 不会绑定给 Worker。
- Controller plan 或既有 packet 出现非法 Worker capability binding 时，Runtime 失败关闭而不是静默过滤。
- 定义事实、诊断事实、case 状态和 Project State 写回边界清楚。
- 已移除 skill 不再出现在当前路由、当前能力地图或保留 skill 的软依赖中。
- 未确认、人类负责和外部负责的工作仍可通过 case 与 handoff 恢复。
- Runtime kernel 保持 policy-neutral，不内置固定 gap、route、role 或 skill 序列。
- Controller 语义来自真实 `$using-arckit` skill invocation，ledger 语义与脚本来自真实 `arckit-development-ledger` entrypoint，Runtime 不维护副本。
