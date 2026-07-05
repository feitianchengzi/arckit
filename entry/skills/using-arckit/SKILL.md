---
name: using-arckit
description: Arckit 软件项目协作入口 skill。用于把用户自然语言请求编译成本轮研发处境和 workflow frame：绑定项目账本，识别当前目标、源事实与投影产物、事实源路由、执行边界和停止条件，再选择足以支撑真实项目推进的 Arckit 能力组合。只要首轮请求可能涉及需求、规格、交互、视觉、技术方案、项目上下文、durable agent context、bug 诊断、实现交接、重构策略、agent skill 或软件项目开发协作，就先使用本 skill。首轮之后的普通继续推进仍由本 skill 协调；后续消息改变目标、事实路由、停止条件、验证策略或 workflow memory 判断时，路由 arckit-turn-adaptation。
---

# Using ArcKit

`using-arckit` 是 Arckit 的入口编排协议。它负责把人的请求编译为“当前这轮应该怎么推进”，不负责复述或替代各 routed skill 的内部字段、schema 和维护细节。

## 职责边界

- 本 skill 负责：任务处境编译、源-投影判断、能力选择、workflow frame、执行后回写协调和用户可见 closeout。
- `arckit-development-ledger` 负责：`arckit/project/state.record.json` canonical 全局项目完整性状态、`STATE.md` loop decision brief、canonical 迭代状态、迭代 decision brief、`arckit/cases`、completion audit、索引、关闭状态和账本 schema。
- `arckit-workflow-memory` 负责：workflow resolution、execution record、workflow signal、candidate 和 accepted workflow patch。
- 结果型 skill 负责：`arckit/spec`、`arckit/interaction`、`arckit/visual`、`arckit/tech` 的稳定事实维护。
- 过程型、诊断型和执行协议 skill 负责自己的 handoff、诊断、实现交接、重构策略或 agent context 契约。

## 硬约束

- 所有软件开发请求默认属于真实项目的连续演进；不要把一次 prompt 只当作孤立命令。
- 首轮先绑定项目账本和当前 case；不能落盘时，在本轮输出中保留 pending write。
- 选择能力前必须做源-投影判断：先判断本轮是否改变源事实，再判断要修改的是源事实还是投影产物。源事实未知时，不能把投影更新当作完整完成。
- 稳定事实只交给对应结果型 skill；未确认但有价值的信息进入 `arckit-pending`。
- 工作方式变化进入 `arckit-workflow-memory`，不写入产品、交互、视觉或技术事实源。
- 实现、原型、脚本或代码变更默认只是实现证据；除非已有稳定事实源、用户确认或本轮同时正式化事实，否则不能让实现产物静默决定项目预期。
- 需要人类审美、商业优先级、组织授权或发布承担的事项，只能整理证据、风险、pending 或 handoff，不静默变成最终裁决。
- 每轮结束必须回写账本、做 completion audit、输出 visible closeout，并完成 workflow memory closeout。

## 主流程

### 1. 绑定账本和上下文

动作：
- 读取目标项目的 `AGENTS.md`、`arckit/project/STATE.md` 作为 loop decision brief，并读取 `arckit/project/state.record.json` 作为精确项目状态；再读取 `arckit/cases/INDEX.md`、active case 和相关稳定事实源。
- 通过 `arckit-development-ledger` 创建、读取或更新项目状态和 case。
- 读取当前请求中的显式目标、约束、证据、风险、用户纠错和即时任务。

退出条件：有可恢复的 project state、case 或 pending write；本轮影响范围初步明确。

### 2. 编译任务处境

动作：
- 区分最终目标、当前轮目标、阶段产物、最终产物类型和可交付边界。
- 判断本轮是新事项、继续已有 case、补充上下文、事实纠偏、实现探索、诊断、交接、重构、skill 维护还是工作方式变化。
- 执行源-投影门禁：
  - 如果请求改变项目定位、目标用户、核心场景、产品概念、系统协作方式、技术架构、权限边界、agent 操作原则或长期工作方式，先定位源事实承载。
  - 如果当前只准备更新 skill、代码、配置、测试、AGENTS 或投影文档，必须说明它投影自哪个源事实。
  - 源事实未知时，写入 pending 或提出聚焦源事实的确认问题，不关闭 case。
- 形成 `round_strategy_decision`：本轮选择哪条路线，哪些路线延期，什么信号会切换路线。

退出条件：当前轮最关键缺口、路线选择和源-投影关系明确。

### 3. 解析 workflow memory

动作：
- 路由 `arckit-workflow-memory` 做 workflow resolution。
- 将命中的 workflow overlay 作为参考应用到本轮 frame；candidate 不覆盖用户显式指令和项目事实源边界。

退出条件：workflow resolution、execution record 目标和对本轮 frame 的影响明确。

### 4. 选择充分能力组合

按当前缺口选择足以完成真实项目推进的能力组合。不能为了减少 skill 数量而跳过事实完整性、架构正确性、验证覆盖、上下文治理或交接边界；也不把用户提到的 skill 名称自动当作唯一任务。

常用路由：

| 缺口 | 能力 |
| --- | --- |
| 项目状态、case、审计、关闭、索引 | `arckit-development-ledger` |
| 原始材料保留 | `arckit-intake` |
| 未决问题、风险、外部交接 | `arckit-pending` |
| 长期 agent 规则、AGENTS、durable context | `arckit-agent-context` |
| 价值判断、取舍、方案拷问 | `arckit-decision-framework` |
| 规格草案 | `arckit-draft-spec` |
| 产品/交互/视觉探索 | `arckit-explore-product-design` |
| 架构取舍 | `arckit-architecture-decision` |
| 领域模型 | `arckit-domain-modeling` |
| 稳定产品事实 | `arckit-spec` |
| 稳定交互事实 | `arckit-interaction` |
| 稳定视觉事实 | `arckit-visual` |
| 稳定技术事实 | `arckit-tech` |
| 实现交接 | `arckit-implementation-handoff` |
| 行为不变重构策略 | `arckit-refactor-strategy` |
| bug、回归、异常、性能退化 | `arckit-debug-diagnosis` |

退出条件：selected capabilities、handoff 目标、写入目标、确认点和停止条件明确。

### 5. 执行本轮 frame

动作：
- 按 frame 调用对应 skill 或普通工程能力。
- 过程型输出先作为 handoff、候选判断、风险或证据；不直接写稳定事实源。
- 结果型输出才维护对应稳定事实源。
- 诊断和实现结果必须回查：哪些只是实现证据，哪些需要事实源正式化，哪些进入 pending。
- 如果本轮产生外部 adapter 任务，输出 handoff 并记录到 case 或 pending。

退出条件：本轮产物、证据、写入路径、未决项和后续接收方明确。

### 6. 回写与收口

动作：
- 用 `arckit-development-ledger` 更新 project state、iteration state、case record、state delta、completion audit 和索引。
- 做源-投影一致性检查：若源事实变化，说明 source updated/unknown、projections updated/deferred/blocked；只改投影且源未知时不能关闭。
- 用 `arckit-workflow-memory` 写 execution record，并判断是否产生 workflow signal。
- 输出 visible closeout：本轮完成什么、case 是否关闭、哪些结构 deferred/needed/blocked、下一轮最值得做什么。

退出条件：最终响应能说明本轮是关闭、继续、阻塞、延期还是交接。

## 后续消息

- 后续消息只是继续当前 frame 时，本 skill 继续协调。
- 后续消息改变目标、事实路由、停止条件、验证策略、工具边界、术语边界、源-投影判断或 workflow memory 判断时，路由 `arckit-turn-adaptation`。
- 用户指出“只改了下游、漏了上游”“这不是这个层级的问题”等情况，视为源-投影纠偏，必须重新审计 case 和事实路由。

## 输出要求

最终或阶段性输出保持简洁，但至少覆盖：

- `ledger_paths`：项目状态、迭代状态、case 或 pending write。
- `workflow_frame`：当前缺口、路线、能力、写入目标、停止条件。
- `source_projection_check`：源事实、投影产物、未知/延期/阻塞项。
- `round_update`：本轮产物、证据、事实源变化和未决项。
- `completion_audit`：关闭、继续、阻塞、延期或交接判断。
- `visible_iteration_closeout`：当前 loop/迭代的状态转移、关闭条件和用户下一步最需要确认、试用、补齐或正式化什么。
- `workflow_memory_closeout`：execution record 和 signal 判断。
