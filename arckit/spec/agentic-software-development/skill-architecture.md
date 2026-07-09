# Skill 架构

## 定位

Skill 架构把产品概念和产品架构转化为当前可实施的 Arckit skill 体系，用来指导人类、Codex 类单 agent 和多 agent 自动化平台围绕同一套软件项目事实持续协作。

Arckit 的定位是软件开发 Agent 的协作与接力协议层。它不等同于全自动化 AI 平台本身，也不要求所有能力都来自 Arckit；平台层可以负责多 agent 调度、loop 控制、权限、队列、运行环境、通知和人类接手机制。Arckit 负责定义项目事实、case 状态、handoff、pending、workflow memory、agent context 和回写边界，让不同 agent、外部工具和人类能可靠接力。

当前 Arckit 围绕软件项目开发的基础协作面组织七类能力：

- 入口 Controller：识别任务处境，生成 controller frame、execution gate、worker packets、report intake rules、closeout rules 和 loop handoff。
- 项目连续状态：维护 `arckit/project` 中的 project state record，追踪整个应用跨上下文、跨 case、跨迭代的长期状态。
- 研发事项记录：维护 `arckit/cases` 中的 development case record，追踪一个事项跨轮次的结构满足度。
- 记忆与低承诺空间：保存原始材料、未决问题、workflow memory 和 agent 启动上下文。
- 定义前思考：形成决策、草案、设计探索、架构决策和领域模型 handoff。
- 结果事实源：维护产品、交互、视觉和技术事实。
- 工程执行协议：形成实现交接、重构策略、诊断证据和外部 adapter handoff。

项目治理、长期想法库、市场研究、代码审查、质量评测、发布出包、运行运维、Workshop Desktop、角色编排和自动化平台事项进入 Arckit 时，先被整理成决策依据、定义事实、诊断证据、`arckit-pending` 未决项、`implementation_handoff` 或 external adapter handoff，让人类、外部工具和多 agent 平台能继续推进。

## 总体链路

Arckit 的当前 skill 体系按以下链路工作：

1. `using-arckit` 接收 prompt、上下文、证据和用户纠错，形成当前任务处境。
2. `using-arckit` 读取或初始化 `arckit/project`、active case、iteration state、上一轮 handoff 和相关事实源。
3. `using-arckit` 判断 turn delta：首轮、新 case、继续、补充、纠错、目标变化、暂停或恢复。
4. `using-arckit` 生成 controller frame 和本轮唯一 round goal。
5. `using-arckit` 生成 execution gate。默认不自动执行；只有人类明确授权、runtime authorization、auto-run policy 或外部平台授权时才绑定 executor。
6. `using-arckit` 生成 worker packets、report intake rules 和 closeout rules。Worker packet 可以交给人类手动分发，也可以交给已授权执行环境派发。
7. Worker Agent 或外部 executor 按 packet 执行并返回 worker report。Worker 不决定项目方向、不关闭 case、不替代 Controller。
8. `using-arckit` 接收并审核 worker report，判断是否接受、退回修订、补充 worker、标记旧 packet 失效或要求人类判断。
9. 过程型 skill 产出 handoff，结果型 skill 维护稳定事实，诊断型 skill 收敛实现事实，未确认内容进入 `arckit-pending`。
10. 每轮结束前，`using-arckit` 和 `arckit-development-ledger` 输出 `completion_audit.loop_handoff`，区分下一步职责归属和触发方式。
11. 执行结果、用户纠错和流程学习交给 `arckit-workflow-memory` closeout。

这条链路是当前实施主线。workflow frame 根据当前维护源选择可执行 skill；跨出当前执行面的阶段通过 pending 或外部 handoff 保持连续推进。

## 能力建设原则

- 入口能力只负责 Controller 协议：任务处境、turn delta、controller frame、execution gate、worker packets、report intake、closeout 和 loop handoff；不替代结果型 skill、实现 adapter、诊断 skill 或 Worker Agent。
- 入口能力不得因为生成了执行包就自动执行。执行必须经过 execution gate，并绑定 `human_runtime`、`runtime_executor`、`external_agent` 或其他授权 executor。
- 没有自动执行环境时，人类可以手动复制 worker packet 到其他 Agent 对话，并把 worker report 带回 Controller。
- 自动执行环境可以分发 worker packet、收集 report、处理 gate、暂停和继续，但不改变入口协议语义。
- 所有软件开发请求默认属于真实项目的连续演进；入口按状态层级、证据成熟度和本轮推进目标编译 workflow frame。
- 入口在选择能力前执行源-投影门禁：先判断本轮是否改变源事实，再判断当前要更新的 artifact 是源事实还是投影产物；源事实未知时，不允许把投影更新当成完整完成。
- `arckit/project` 记录项目级连续状态，不替代 spec、interaction、visual、tech 或 case。
- `arckit/cases` 记录当前研发事项的结构满足度，不替代 pending、workflow memory 或稳定事实源。
- 过程型 skill 只产出 handoff 和候选判断，不直接写入正式事实源。
- 结果型 skill 只维护稳定事实，不吸收未确认推断。
- 低承诺空间必须可用：不能立即写入稳定事实源的信息进入 `arckit-intake` 或 `arckit-pending`。
- 工作方式变化进入 `arckit-workflow-memory`，不写入产品、交互、视觉或技术事实源。
- 长期 agent 启动规则和事实源路由规则进入 `AGENTS.md` 或 `arckit-agent-context` 输出的路由 handoff，不写成产品、交互、视觉或技术事实。
- 需要人类审美、商业优先级、组织授权或发布承担的事项，可以由 Arckit 整理证据、风险和 handoff，但不能静默变成 agent 的最终裁决。
- 每轮 closeout 先判断 `next_responsibility=agent|human|external|none`，再判断 `trigger_mode=manual_bridge|auto_bridge|user_decision|external_wait|none`。`manual_bridge` 只表示缺少自动续轮调度器、由人手动触发本应由 agent 继续的下一轮；它不等于人类决策，也不等于人类接手。
- 面向编码、重构、发布、评测、平台调度或外部系统的工作优先通过 handoff 协议接入；Arckit 不把外部 adapter 的完整执行能力内建为默认职责。
- 当前执行面之外的能力由入口整理成外部 adapter handoff 或 pending，保持入口职责清晰。

## Skill 暴露与路由策略

`using-arckit` 是项目对话 Controller skill，负责把用户输入编译为本轮 controller frame、execution gate、worker packets、report intake rules、closeout rules 和 loop handoff。其他 Arckit skills 是具体能力包：它们声明自身适用场景、输入、输出和事实边界；可以被 Controller 生成的 worker packet 引用，也可以被人类或外部平台直接使用。

`using-arckit` 的可见能力地图包含当前执行面中的 skill：

- `arckit-workflow-memory`
- `arckit-development-ledger`
- `arckit-intake`
- `arckit-pending`
- `arckit-agent-context`
- `arckit-decision-framework`
- `arckit-draft-spec`
- `arckit-explore-product-design`
- `arckit-architecture-decision`
- `arckit-domain-modeling`
- `arckit-spec`
- `arckit-interaction`
- `arckit-visual`
- `arckit-tech`
- `arckit-implementation-handoff`
- `arckit-refactor-strategy`
- `arckit-debug-diagnosis`

当前可见能力地图以本仓库源码中的 skill 集合为准。历史文档、旧迁移策略和用户级已安装副本只提供背景信息。

## 语义入口与任务处境

`using-arckit` 承载入口理解、Controller 编排和轮次收口责任。它需要识别：

- 项目级长期预期、本轮可交付内容和当前承诺成熟度。
- 当前阶段候选和阶段产物。
- 显式约束、证据、风险、冲突和待确认事项。
- 最终产物类型是 code、skill、document、workflow、mixed artifact，还是尚未确定。
- 本轮可能影响的事实源、pending 和工作方式事实。
- 本轮是否包含 durable agent context、实现交接、重构策略或外部 adapter handoff。

`using-arckit` 优先通过 `arckit-development-ledger` 绑定 `arckit/project/STATE.md` 下的 project state record。project state record 是整个应用的连续状态，包含 project goal、target users、core scenarios、platform targets、client surface、server need、account identity、data persistence、sync collaboration、deployment distribution、quality bar、technical foundation 和 iteration strategy 的状态与证据成熟度。实现探索产生的网页、脚本、原型或临时代码只能作为探索证据，不能自动决定项目最终平台、服务端、账号或部署形态。

`using-arckit` 再把首轮编译结果维护为 `arckit/cases/active/` 下的 development case record。case record 是当前事项的工作台状态，包含 product、interaction、visual、technical、implementation、verification、open questions、handoffs 和 workflow memory signals 的满足度；它决定下一轮补哪个缺口，但不把候选判断直接提升为稳定事实。case record 必须能回溯到 project state，并在每轮结束时记录 `project_state_delta`。

每轮结束时，case record 的 `completion_audit` 包含 `loop_handoff`。`loop_handoff` 至少包含 `status`、`next_responsibility`、`agent_continuation_available`、`human_decision_required`、`trigger_mode`、`next_prompt`、`agent_instruction`、`human_gate` 和 `progress_guard`。自动化平台只消费 agent-continuable handoff；人类只在 `human_decision_required=true` 时承担真实决策、授权或风险确认。

后续对话中的补充、纠错、目标变化、暂停和恢复由 `using-arckit` 的 turn delta 处理。Controller 必须判断旧 worker packet 是否仍有效；如果失效，明确要求停止旧 packet，并生成新 packet 或等待人类确认。

## 语义材料保留与低承诺空间

`arckit-intake` 负责保存原始输入材料。它适合处理 brief、访谈记录、截图、参考资料、用户原话和其他暂不分析的输入。它的价值是保留来源，不把原始材料直接提升为结论。

`arckit-development-ledger` 负责维护目标项目 `arckit/project/STATE.md`、`arckit/cases/` 和后续 `arckit/iterations/` 中的研发状态账本。`arckit/project`、`arckit/cases` 和 `arckit/iterations` 是目标项目的数据区，只保存具体项目记录；schema、脚本和维护协议由 skill 自身承载。

`arckit/cases` 负责保存当前研发事项跨轮次的结构化状态。它适合承接“这件事整体还欠哪些软件工程结构”的判断，由 `arckit-development-ledger` 创建、校验、审计和索引。

`arckit-pending` 负责保存未决讨论项、开放问题、候选事实、风险、外部 adapter handoff 和过程 handoff。它适合承接“现在有价值但还不能写入正式事实源”的内容。

`arckit-workflow-memory` 负责保存工作方式事实和执行记录。它记录的是人和 Agent 应该如何协作，而不是产品功能事实。用户纠正“以后应该怎么做”时，入口或 turn adaptation 应判断是否形成 workflow signal、candidate patch 或 accepted patch。

`arckit-agent-context` 负责项目级 agent 启动上下文和 durable context 路由。它维护 `AGENTS.md` 中短、稳定、可执行的 agent 操作规则，避免把临时任务约束、聊天记录、产品事实或技术方案写入 agent 启动表面。

## Handoff 契约

过程型 handoff 至少包含：来源、当前阶段、最终产物类型、已确认事实、候选判断、证据、风险、开放问题、建议接收方、不可直接写入稳定事实源的内容和下一步确认点。

`source_projection_check` 至少包含：本轮是否改变源事实、源事实承载、已更新或待更新的投影产物、延期或阻塞的投影、以及是否存在只改投影未改源的关闭风险。

`implementation_handoff` 至少包含：目标最终产物类型、`artifact_type`、接收方、预期事实依据、影响范围、禁止触碰范围、必须保持不变的行为、实现 adapter、实现约束、验证要求、停止条件、需要回查的事实源、需要保留的未决项、同步治理影响和收口证据。

`refactor_strategy_handoff` 至少包含：重构目标、重构依据、必须保持不变的外部行为、允许修改范围、禁止触碰范围、风险、分阶段计划、每阶段验证方式、停止条件和需要回写的 Arckit surface。

`external_adapter_handoff` 至少包含：待外部执行的阶段、已确认事实、建议外部能力、输入、输出、风险、用户确认点和是否需要先写入 pending。

`loop_handoff` 至少包含：当前 case、当前轮状态、下一步职责归属、agent 是否可继续、是否需要人类决策、当前触发方式、给人手动触发下一轮的 `next_prompt`、给自动桥读取的 `agent_instruction`、人类 gate、外部等待条件和防循环的 progress guard。`loop_handoff` 是每轮 closeout 的接力状态，不替代 implementation/refactor/external handoff。

## 定义前思考

`arckit-decision-framework` 是横向决策方法。它用于比较选项、暴露假设、评估价值和形成 decision handoff。

`arckit-draft-spec` 把原始输入、想法或讨论材料整理成规格草案或 spec handoff。

`arckit-explore-product-design` 在写入正式交互或视觉结果前探索页面方案、状态表达和交互风险。

`arckit-architecture-decision` 在正式技术方案沉淀前形成架构决策、ADR、系统拆分、方案权衡和约束分析。

`arckit-domain-modeling` 梳理领域模型、实体、值对象、状态、不变量、领域事件和上下文边界。

这些 skill 的输出多为过程产物。只有经过确认、收敛或验证后，才进入 `arckit-spec`、`arckit-interaction`、`arckit-visual` 或 `arckit-tech`。

## 结果事实定义

`arckit-spec` 维护产品行为、功能边界、验收口径和稳定规则。它是产品预期事实源。

`arckit-interaction` 维护页面流程、状态、线框、表单、导航和交互规则。它是交互预期事实源。

`arckit-visual` 维护视觉风格、design tokens、主题和组件视觉规则。它是视觉预期事实源。

`arckit-tech` 维护架构说明、技术方案、数据模型、接口契约和技术约束。它是技术预期事实源。

定义类 skill 的关键不是写文档，而是维护事实边界。它们严格区分稳定事实、候选事实、历史对照、未决问题和实现建议，并把不能接收的内容交回低承诺空间或过程 handoff。

## 最终产物生产

Arckit 支持 code、skill、document、workflow 和 mixed artifact 等最终产物。当前执行面负责形成清晰的目标、事实依据、影响范围、验收口径和交接输入，具体技术栈实现、skill 创建工具、发布平台、代码审查或质量评测由对应 adapter 执行。

实现交接统一以 `implementation_handoff` 为边界。Arckit 在交给普通代码工作流、`arckit-code`、Skill First、skill creator、ArcForge、多 agent coding role 或其他外部 adapter 前，说明本次实现依据哪些 spec、interaction、visual 或 tech 事实，哪些内容只是候选判断，允许修改范围是什么，禁止触碰范围是什么，验证和回写要求是什么。

重构工作统一先通过 `arckit-refactor-strategy` 划定行为不变护栏、阶段、验证和停止条件。若重构暴露重大架构取舍，交给 `arckit-architecture-decision`；若只是 bug 根因修复，交给 `arckit-debug-diagnosis` 或实现 adapter。

纯治理动作可以直达对应 adapter。当用户只要求安装、同步、漂移检查、profile 归类、应用、正式化、共享或发布准备已有 skill，且目标、来源、应用目标和确认边界已经明确，系统可以直接交给 ArcForge 类治理能力，不强行补完整前置流程。

## 诊断

`arckit-debug-diagnosis` 处理 bug、回归、偶发失败、数据异常、接口错误、显示错误和性能退化。它从症状、日志、测试、代码和运行证据中定位实现事实。

诊断结果可能触发三类后续动作：

- 根因和修复仍在实现层：交给当前实现 adapter 或用户确认。
- 暴露稳定产品、交互、视觉或技术事实变化：交给对应结果型 skill。
- 暴露需要行为不变结构治理：交给 `arckit-refactor-strategy`。
- 暴露外部治理、质量验证、发布运维或后续排期事项：交给 `arckit-pending` 或 external adapter handoff。

## Artifact Impact Scan

每轮 ArcKit 工作流都必须扫描：

- `project`
- `intake`
- `cases`
- `spec`
- `interaction`
- `visual`
- `tech`
- `debug`
- `pending`
- `workflow_memory`
- `agent_context`
- `handoff`

Scan 不按任务规模设置特殊分支。没有影响时必须显式标记为 `none` 或 `skipped`；无项目事实变化不替代 workflow memory closeout。

## 架构验收口径

Skill 架构满足规格时，系统表现为：

- 读者能清楚理解 Arckit 如何指导 agent 辅助人类完成软件项目开发。
- `using-arckit` 按当前执行面编译 workflow frame。
- 过程型、结果型、诊断型和记忆型 skill 通过 handoff 和事实路由协作。
- Agent 启动上下文、实现交接和重构策略都有明确 surface 和输出契约。
- `completion_audit.loop_handoff` 能区分 agent 续轮、真实人类决策、外部等待和事项完成，并能同时服务人工触发和未来自动桥。
- Controller Worker Loop 能说明没有自动执行环境时人类如何手动分发 worker packet、收集 worker report，并回到 Controller closeout。
- 自动执行环境能复用同一套 packet、report 和 closeout 协议，而不是另建一套入口协议。
- Code、Skill、document、workflow 和 mixed artifact 都能进入同一套定义、外部实现 adapter 和收口证据模型。
- 治理、验证、发布、运维、桌面桥或角色编排事项会形成 pending 或 external adapter handoff，保持软件项目开发链路连续。
