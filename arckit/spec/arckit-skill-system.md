# Arckit 技能系统规格

更新时间：2026-07-05

## 1. 系统定位

Arckit 是围绕本仓库维护的软件开发 Agent 协作与接力协议层。它的工程目标是指导人类、Codex 类单 agent 和多 agent 自动化平台围绕同一套项目事实完成日常软件项目开发，让执行体能理解任务处境、维护项目事实、形成可执行交接、定位实现问题，并把过程经验沉淀为可复用工作方式。

当前能力体系覆盖：

- 入口编排、后续消息变更控制和研发状态账本。
- 项目状态、研发事项 case record、完成度审计和下一轮缺口判断。
- 原始输入、未决上下文、workflow memory 和 agent 启动上下文。
- 决策、草案、设计探索、架构决策和领域建模。
- 产品、交互、视觉和技术事实源维护。
- 实现交接、重构策略和基于证据的 debug 诊断。

技术栈专属编码实践由独立的代码实践仓库承载，例如 `arckit-code`。多 agent 调度、loop 控制、权限、队列、环境、通知和人类接手机制属于自动化平台层，不要求全部来自 Arckit。项目治理、代码审查、评测、发布出包、运行运维、Workshop Desktop、多角色编排和长期想法管理进入 Arckit 时，先沉淀为决策依据、定义事实、诊断证据、implementation handoff、pending 交接项或 external adapter handoff。

## 2. 入口路由

Arckit 使用 `using-arckit` 作为入口 skill。该 skill 独立位于 `entry/skills/using-arckit/`，负责把用户请求编译为连续项目状态、`development_case_record` 和本轮 `workflow_frame`，路由 `arckit-development-ledger` 维护研发状态账本，选择足以支撑真实项目推进的 skill 组合，并组织当前轮执行顺序。

`using-arckit` 支持以下行为：

- 根据用户目标识别当前阶段、期望产物和当前最关键未满足结构。
- 在选择下游 skill 前执行源-投影门禁：识别本轮改变的是源事实还是投影产物，避免只更新 skill、代码、配置、AGENTS 或投影文档就误判完成。
- 通过 `arckit-development-ledger` 创建或更新 `arckit/project/STATE.md`、`arckit/cases/active/` 下的 development case record，并在每轮结束前完成 completion audit。
- 调用 `arckit-workflow-memory` 做 workflow resolution。
- 选择当前能力体系中足以覆盖事实、架构、验证、交接和上下文治理缺口的 skill 组合，保持 agent 的行动聚焦但不牺牲真实项目正确性。
- 把稳定产品、交互、视觉和技术事实交给对应结果型 skill。
- 把需要后续确认、外部执行或跨工具承接的事项交给 `arckit-pending`。
- 将长期 agent 协作约定、AGENTS.md 维护和 durable context 交给 `arckit-agent-context`。
- 将已确认事实到实现执行的接力交给 `arckit-implementation-handoff`。
- 将高风险结构治理和行为不变重构交给 `arckit-refactor-strategy`。
- 在现有 frame 内继续协调普通后续推进；当后续消息改变 frame、事实路由、停止条件或 workflow memory 判断时交给 `arckit-turn-adaptation`。

入口以当前维护源中的 skill 集合为准；历史文档、用户级安装副本或外部仓库中的旧名称只作为背景材料，实际编排以本仓库当前源码为准。

## 3. 当前技能角色

| Skill | 角色 |
| --- | --- |
| `using-arckit` | Arckit 软件项目入口路由、runtime situation 建模和 workflow frame 编译。 |
| `arckit-development-ledger` | 项目状态、研发事项 case、后续迭代状态、completion audit 和账本索引维护。 |
| `arckit-turn-adaptation` | 后续消息对当前 frame、事实路由、源-投影纠偏、停止条件或 workflow memory 判断的变更控制。 |
| `arckit-workflow-memory` | 场景工作流解析、execution record、workflow signal、candidate 和 accepted workflow memory。 |
| `arckit-intake` | 原始项目输入材料登记和忠实保存。 |
| `arckit-pending` | 未决讨论项、开放问题、过程 handoff 和外部 adapter handoff 保存。 |
| `arckit-agent-context` | 项目级 agent 启动上下文、AGENTS.md 长期规则和 durable context 路由。 |
| `arckit-decision-framework` | 横向决策方法和独立决策工作流，也可向主工作流提供轻量决策片段。 |
| `arckit-draft-spec` | 将原始输入、想法或讨论材料整理成规格草案或 spec handoff。 |
| `arckit-explore-product-design` | 在正式交互或视觉事实入库前探索页面方案、状态表达和设计风险。 |
| `arckit-architecture-decision` | 在技术事实入库前形成架构决策、ADR、系统拆分和方案权衡。 |
| `arckit-domain-modeling` | 梳理实体、值对象、状态、不变量、事件和上下文边界。 |
| `arckit-spec` | `arckit/spec/` 下的稳定产品行为、规则和验收口径维护。 |
| `arckit-interaction` | `arckit/interaction/` 下的页面级交互策略、灰度线框 HTML 和交互文档维护。 |
| `arckit-visual` | `arckit/visual/` 下的视觉策略、design tokens、主题和组件视觉规格维护。 |
| `arckit-tech` | `arckit/tech/` 下的技术方案、架构、数据模型和 API 契约维护。 |
| `arckit-implementation-handoff` | 将已确认事实整理成可交给 coding agent、人类、多 agent 角色或外部 adapter 的实现交接包。 |
| `arckit-refactor-strategy` | 形成行为不变、分阶段、可验证的重构策略和 handoff。 |
| `arckit-debug-diagnosis` | 基于证据的 bug、回归、数据异常、显示错误和性能退化诊断。 |

项目级研发状态账本位于 `arckit/project/`、`arckit/cases/` 和后续 `arckit/iterations/`，由 `using-arckit` 路由 `arckit-development-ledger` 维护。它为入口编排提供跨轮次、跨上下文的项目状态承载。

## 4. 规格边界

每个执行型 skill 必须通过 frontmatter description、触发条件、使用场景和产物边界自描述。技能正文不承担主要触发职责。

skill description 是主要触发表面，必须说明：

- skill 拥有的产物或操作。
- 适用的用户意图。
- 稳定输出形态。
- 主要职责边界。

执行型 skill 不依赖正文中的“不要用本 skill，改用其他 skill”来修正触发。若需要此类正文说明才能避免误触发，说明 description 或技能划分需要修订。

跨 skill 组合主要由 `using-arckit` 或横向方法 skill 自身 description 负责。产品产物型 skill 描述自己的流程、产物和关键判断点，不硬编码已删除 skill 名称。

源-投影关系由入口和账本维护，不由单个结果型 skill 独自承担。结果型 skill 负责维护自己范围内的 source of truth；入口负责判断当前轮是否只更新了投影，账本负责记录源事实和投影产物的同步状态。

## 5. 外部阶段交接

当软件项目开发进入下列阶段时，Arckit 负责先整理可交接的项目事实、决策依据、风险、输入输出和确认点：

- 长期商机或产品创意库。
- 市场研究和外部竞品证据采集。
- 项目治理、排期、任务分发和责任归属。
- 代码审查和质量门禁。
- 真实研发场景评测集维护。
- 发布出包、应用商店素材、运行监控和运维。
- Workshop Desktop、本地任务派发和多角色编排。
- 多 Agent 自动化平台执行、失败上报和人类接手。

`using-arckit` 将这些阶段拆成当前可处理的决策、定义、技术、诊断、implementation handoff、refactor strategy、未决记录或 external adapter handoff，便于人类、单 agent、多 agent 平台或外部工具继续推进。

## 6. 开发与验证规则

在 Arckit 源仓库内开发或验证 skill 时，agent 优先读取当前仓库中的源 skill 路径，而不是用户级已安装副本。用户级安装副本可能落后于当前源码。

Skill 变更可以使用 Skill First 模拟验证。子代理模拟用于测试另一个 agent 是否能在没有隐藏上下文的情况下遵守技能边界。

当前验证重点：

- `using-arckit` 暴露当前能力体系。
- 结果型 skill 不接收已删除 skill 的 handoff 名称。
- 入口、README 和 agents metadata 以当前维护源中的能力集合为路由依据。

## 7. 后续规格关注点

后续可继续完善：

- 为当前能力体系建立真实任务试跑样本。
- 基于真实项目反馈扩展治理、质量、交付、运营和自动化平台 adapter，但保持 Arckit 作为协议层而非平台本体。
- 扩展新能力时，先明确其目录归属、description 触发边界、handoff 契约和与当前能力体系的交接方式。
- 当多 skill workflow 的 token 成本成为实际问题时，把长方法细节继续拆到 references 中。
