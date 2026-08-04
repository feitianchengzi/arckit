# Arckit 技能系统规格

更新时间：2026-07-25

## 1. 系统定位

Arckit 是软件开发 Agent 的协作与接力协议层。当前能力集刻意收敛为验证 `Project State -> Case -> Loop` 所需的最小闭环：一个项目对话 Controller、一个研发状态账本、四个定义事实维护能力和一个证据驱动诊断能力。

Arckit 不把技术栈编码、商业优先级、审美批准、发布授权、多 Agent 基础设施或外部系统操作伪装成当前 skill 能力。超出当前能力集的工作由 Controller 记录在 active case 的 `open_questions`、`pending_handoffs` 或 `human_decision_required`，并交给 `arckit-code`、项目工具、人类或 external adapter。

## 2. 当前保留能力

| Skill | 目录 | 作用 |
|---|---|---|
| `using-arckit` | `entry/skills/using-arckit/` | Controller execution plane；把项目输入转成 controller frame、execution gate、worker packets、report intake、closeout 和 loop handoff。 |
| `arckit-development-ledger` | `entry/skills/arckit-development-ledger/` | Runtime execution plane；维护 canonical Project State、iteration state、development case、投影视图和状态审计。 |
| `arckit-spec` | `definition/skills/arckit-spec/` | 维护稳定产品行为、规则和验收口径。 |
| `arckit-interaction` | `definition/skills/arckit-interaction/` | 维护页面级交互、状态、响应和线框事实。 |
| `arckit-visual` | `definition/skills/arckit-visual/` | 维护视觉策略、Design Tokens、主题和组件视觉规格。 |
| `arckit-tech` | `definition/skills/arckit-tech/` | 维护技术方案、架构边界、数据模型和 API 契约。 |
| `arckit-debug-diagnosis` | `engineering/skills/arckit-debug-diagnosis/` | 基于代码、日志、测试和运行证据诊断实现问题并指导必要修复。 |

上述目录构成当前完整 Arckit skill 集。其他顶层能力域可以保留为仓库分类，但当前不包含已保留 skill。

## 3. Project State / Case / Loop 主轴

`using-arckit` 是 Controller 协议入口。它恢复 Project State、全部 active cases、iteration state 和上一轮 handoff，为当前 Loop 选择唯一 Case，判断用户输入与上一轮的关系，选择本轮最小 worker 能力，并生成受控执行包。不同 Loop 可以并行推进不同 Case；它不自动执行 worker，也不直接写回 ledger。

`arckit-development-ledger` 是状态持久化能力。它维护：

- `arckit/project/state.record.json` canonical Project State。
- `arckit/project/STATE.md` 状态决策投影。
- `arckit/project/iterations/*.record.json` canonical iteration state。
- `arckit/project/iterations/*.md` iteration 决策投影。
- `arckit/cases/active/` 和 `arckit/cases/closed/` 中的事项证据。

一次 loop 的标准关系是：Project State 暴露 gap 和 active Case 集合，Controller 为当前 Loop 选择一个 Case 或请求创建，worker packet 推进有界目标，worker report 返回证据，Controller 完成 report intake 和 closeout，ledger 在验证门禁后写回 state delta。不同 Case 的执行可以并行，canonical ledger commit 按 Project 串行化。

## 4. 定义事实能力

四个 definition skill 分别拥有自己的稳定事实源，不通过隐式 skill import 获取前置结论。它们可以接收用户、Controller worker report、其他稳定事实源、实现证据或 external adapter 提供的明确材料。

输入不满足稳定事实门禁时：

- 普通未知项写入 active case 的 `open_questions`。
- 等待另一个执行体或系统的事项写入 `pending_handoffs`。
- 需要授权、商业取舍、审美判断或风险接受时设置 `human_decision_required`。
- 不创建已移除 skill 的名字作为占位依赖。

## 5. 诊断能力

`arckit-debug-diagnosis` 处理 bug、回归、偶发失败、数据异常、接口错误、显示错误和性能退化。它依据实现事实收敛根因，不拥有产品规格、架构重写、case 关闭或发布授权。

重构或正向实现如果超出诊断所需的局部修复，由 Controller 生成带行为护栏、允许路径、验证要求和停止条件的有界 worker packet，交给当前 agent、`arckit-code` 或 external adapter。当前能力集不依赖独立重构策略或实现 handoff skill。

## 6. Runtime capability policy

每个保留 skill 通过 `arckit.capability.json` 向 Runtime 暴露最小能力元数据：skill id、kind、runtime role、binding targets、invocation、input facts、outputs、allowed write targets、forbidden decisions 和 runtime notes。确定性 Runtime capability 还可以声明位于 skill 根目录内的 `runtime_entrypoints`。

Runtime 的显式能力策略位于 `runtime/arckit-runtime/config/capability-policy.json`。策略文件只允许当前七个保留 skill，并分成互斥的 Controller、Runtime 和 Worker 三组。Capability Registry 可以扫描仓库和项目 manifest，但必须在交给 Controller 前应用该策略并核对 manifest binding target，拒绝策略外或分组不兼容的能力。

能力策略属于显式 policy layer，不属于 Runtime kernel 的业务路由。Runtime kernel 不写死每轮 gap、route mode、worker role、skill 序列或能力选择启发式；Controller 基于状态、证据和过滤后的 Worker Capability Registry 动态选择本轮最小能力。Runtime 对 Controller planning/review 使用 manifest 声明的 `$using-arckit` Agent skill trigger，对初始化和 ledger writeback 使用 `arckit-development-ledger` 的受信任 runtime entrypoint；不在 Runtime 内复制两者的语义实现。二者不进入 Worker `allowed_skills`，非法绑定会阻塞执行而不是被静默过滤。

## 7. Soft composition

Skill 之间使用软组合：

- Controller packet 可以声明 `allowed_skills`，但不能要求 Runtime 注入 skill 正文；Runtime 只传 `$skill-name` 触发名，由 Agent 自己的 skill 机制加载正文。
- Worker 只能使用 packet 允许且 Worker Capability Registry 可见的 skill。
- 结果型 skill 必须独立说明输入、写入边界和输出契约。
- Worker report 只提交结构化 claim 和 evidence，不能自行关闭 case 或写回 Project State。
- Ledger 只消费 Controller、worker report、人类确认或稳定事实源明确给出的语义字段。

## 8. 验收口径

当前技能系统满足规格时：

- 仓库可枚举且只包含七个保留 skill。
- 七个保留 skill 都有 Runtime capability manifest。
- Runtime 默认能力策略与仓库保留集完全一致。
- 七个保留能力精确分为一个 Controller、一个 Runtime 和五个 Worker capability。
- Controller plan 或既有 packet 绑定非 Worker capability 时失败关闭。
- Runtime 扫描到策略外 manifest 时不会将其暴露给 Controller。
- Controller planning 和 review 的 Agent turn 都以 manifest 声明的 `$using-arckit` trigger 开始，Runtime prompt 不复制 Controller 语义流程。
- Runtime 初始化和 ledger writeback 只调用 repository-trusted `arckit-development-ledger` entrypoint，且 Runtime 中不存在复制的 ledger 脚本或语义写回实现。
- 当前 skill、README、AGENTS 和稳定规格不把已移除 skill 当作可用依赖。
- 未确认工作可以通过 case 字段或 external adapter 继续，不因精简 skill 而丢失。
- Project State、Case 和 Loop 仍能恢复、执行、验证、closeout 和写回。
