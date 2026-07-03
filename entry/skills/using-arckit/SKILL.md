---
name: using-arckit
description: 软件项目协作的首轮默认入口、scenario workflow resolver 和 workflow frame compiler。只要用户首轮请求或输入材料可能涉及产品想法、原始输入归档、反馈、需求、规格、交互、视觉、技术方案、迭代治理、项目记忆、debug、任务记录、Workshop Desktop、skill 创建/验证、发布/出包/测试分发或软件项目开发工作流，就先使用本 skill 建立 runtime situation，调用 arckit-workflow-memory 解析并绑定可复用场景工作流，编译 workflow frame 并路由专门 skill；发布/出包/TestFlight/App Store 意图，或远端出包 workflow 失败但缺少失败原因时，优先考虑 arckit-git-branching 的分支/tag 远端触发和失败原因收集契约。用户在首轮目标之后继续补充、纠错、换目标、纠正项目事实或暂停时，交给 arckit-turn-adaptation；workflow memory 的 workflow resolution、execution record、信号判断和持久化交给 arckit-workflow-memory。只有当请求明确与软件项目协作无关时才跳过。
---

# Using ArcKit

把本 skill 作为软件项目协作的首轮入口、场景工作流解析器和 runtime workflow compiler。它不直接替代专门 skill，不处理后续用户消息分类，也不把 workflow memory 当成固定流程执行器；它先建立当前任务态势，解析并绑定可复用的 scenario workflow，再编译 `workflow_frame`，并把项目事实、未决问题和流程学习路由到不同事实源。

## 硬约束

- 触发门槛要低：只要有很小可能涉及软件项目协作，就先使用本 skill 判断是否进入 ArcKit 工作流。
- 入口必须先建立 `runtime_situation`，完成 `workflow_resolution` 并绑定已有 scenario workflow 或明确创建候选场景工作流，再编译当前任务的 `workflow_frame`，之后才读取专门 skill；不要直接从 prompt 关键词跳到单个结果 skill。
- 每个进入 ArcKit 的任务都必须使用 `arckit-workflow-memory` 两次：开始做 `workflow_resolution`，结束、阻塞或失败时写 execution record 并触发 `workflow_memory_closeout`。
- 用户说“业务代码只改目标项目目录”不等于禁止 workflow memory closeout。
- workflow memory 提供 scenario workflow resolution、workflow patches/overlays 和 execution record 写入，不替代入口编排器；命中的 workflow 必须实际改写或明确不改写本轮 `workflow_frame`。
- `workflow_frame` 必须体现编排推理，而不只是字段清单：区分用户最终目标、当前阶段、当前缺口、可用基础能力、已选择能力、未选择能力及原因、适配触发器和下一次重编译条件。
- 不要使用会诱导 agent 降低流程完整性的 workflow 修饰词；需要压缩输出时，只能说“输出可按任务需要简洁，但不得省略 workflow resolution、artifact scan 和 closeout 判断”。
- 每轮任务只创建或更新 `execution_record` 作为本次执行证据；不要把每次任务都建成新的 workflow。只有找不到可匹配 accepted/candidate scenario workflow 时，才创建新的场景级 candidate。
- 用户在首轮目标之后补充信息、纠正流程、改变目标、纠正项目事实或要求暂停时，交给 `arckit-turn-adaptation` 分类后再决定是否重编 workflow frame。
- 每轮都必须做 `artifact_impact_scan`：判断是否需要交给 `arckit-spec`、`arckit-interaction`、`arckit-visual`、`arckit-tech`、`arckit-pending`、治理、验证或 workflow memory。
- `artifact_impact_scan` 不按任务规模设置特殊分支；必须按同一组目标逐项判断后再决定 `none|check|update|pending|skipped`。
- UI 一致性实现、跨页面样式统一、组件状态统一或从代码实现中反推规范变化时，即使最终目标是代码，也必须先把 `interaction` 和 `visual` 标记为 `check`，实现后再决定是否更新对应事实源。
- 项目事实没有变化只影响 spec/tech/interaction/visual 等 artifact 路由，不等于 workflow memory 可跳过。
- workflow memory 的信号、候选和已确认规则由 `arckit-workflow-memory` 负责。
- 在 ArcKit 源仓库内工作时，优先读取本仓库中的同级源路径，而不是用户级已安装副本。
- 发布/出包/测试分发/应用商店发布意图，以及远端出包 workflow 失败但缺少具体错误原因时，默认先路由到 `arckit-git-branching`；由它推荐或执行 release 分支和 tag push 触发，或指导收集远端失败原因。只有用户明确要求发布风险 gate、上线 go/no-go、回滚/灰度策略或发布 readiness 判断时，才选择 `arckit-release-readiness`。

## 主流程

### 1. 场景识别

输入：用户请求、目标路径、已有文档、错误、测试、上下文和可用 skill。

动作：
- 判断当前任务是否属于软件项目协作。
- 识别 `scenario`、关键 `signals`、可能的 artifact targets 和当前显式约束。
- 建立 `runtime_situation`：`user_goal`、`final_goal`、`current_phase`、`project_stage`、`evidence_available`、`uncertainty`、`constraints`、`likely_artifact_impacts`、`feedback_or_correction_signals`。
- 如需详细场景和默认路由，读取 [references/routing-notes.md](references/routing-notes.md)。

退出条件：确定进入 ArcKit 或明确跳过 ArcKit。

### 2. Workflow Resolution

动作：
- 使用 `arckit-workflow-memory` 做 `workflow_resolution`：先匹配项目级 accepted workflow，再匹配项目级 candidate，再匹配用户级 accepted/candidate。
- 命中已有 scenario workflow 时，绑定 `bound_workflow_id` 或 `bound_candidate_id`；未命中时，创建或准备创建新的场景级 candidate，而不是为本次任务新建 workflow。
- 为本次任务分配 `execution_record` 目标路径，后续执行和纠错都写入这个执行记录。
- 获取可应用到本轮的 memory overlay；索引、candidate、accepted、executions 和兜底扫描细节由 `arckit-workflow-memory` 处理。
- 记录 memory overlay 是否实际改变本轮 skill、handoff、artifact scan、确认点、验证强度或 closeout 策略。

退出条件：得到 `workflow_memory_status` 和 `workflow_resolution`，或记录 memory 不可用、无权限、pending 的原因。

### 3. 编译 Workflow Frame

动作：
- 先做 `workflow_composition_reasoning`：判断最终要交付什么、当前阶段缺什么、哪些 ArcKit 基础能力可补缺口、哪些 artifact 是稳定事实或过程产物、是否存在确认/选择/比较/纠偏信号，以及绑定的 scenario workflow 如何影响本轮 frame。
- 生成 `workflow_frame`：`scenario`、`signals`、`runtime_situation`、`workflow_resolution`、`final_goal`、`current_phase`、`phase_reason`、`workflow_source`、`available_arckit_capabilities`、`selected_capabilities`、`why_not_selected`、`skills`、`handoffs`、`artifact_targets`、`artifact_impact_scan`、`reflection_gates`、`adaptation_triggers`、`next_recompile_condition`、`memory_overlay`、`execution_record_target`、`confirmation_points`、`stop_conditions`。
- 将默认能力地图、用户显式要求、runtime situation 和 memory overlay 合并；冲突时当前用户显式要求优先，未决冲突进入 pending 或请求确认。
- 如果 `signals` 包含发布、出包、测试分发、应用商店、TestFlight、App Store、内测、公测、正式发布、发布候选，或远端 workflow 出包失败但缺少错误原因，且用户没有明确要求 readiness/go-no-go，`selected_capabilities` 必须优先包含 `arckit-git-branching`；`current_phase` 应是 Git 分支/tag 触发推荐、确认后 Git push，或远端失败原因收集，而不是发布前验证、平台上传或无证据修复。
- 正向实现任务先判断是否建立、强化或改变产品、交互、视觉或技术规范；若是 UI 一致性、跨页面统一行为/样式或组件状态统一，先把 `interaction` 和 `visual` 置为 `check`，再形成明确的 `implementation_handoff`，执行普通代码工作流或外部 `arckit-code`，并按风险使用 `arckit-verify-implementation`。
- 多个 skill 都适用时，按 workflow frame 的阶段顺序组合；只加载当前任务真正需要的 skill。

退出条件：用户目标、skill 顺序、交接边界和停止条件明确。

### 4. 执行和交接

动作：
- 按 workflow frame 读取并使用专门 skill。
- 执行中把实际使用的 skill、命令、文件、验证、用户纠错和偏离绑定工作流的原因汇总到本轮 `execution_record`，不要创建新的 workflow 代替执行记录。
- 在 `after_context_read`、`before_edit`、`after_execution`、`before_final` 和 `turn_adaptation` 等 reflection gates 重新判断 skill 组合和 artifact targets。
- 当用户在任务执行中继续发消息时，使用 `arckit-turn-adaptation` 区分补充信息、workflow 纠偏、目标变更、项目事实纠正、澄清回答和暂停/停止；不要在 `using-arckit` 内直接展开这些分类细节。
- 如果 `arckit-turn-adaptation` 输出 `workflow_correction_ledger`，按其 `turn_adaptation_decision` 调整 workflow frame，并把 ledger 交给 `arckit-workflow-memory` closeout。
- 若实现、验证或讨论暴露稳定产品、交互、视觉、技术或治理变化，交给对应结果型 skill 或治理 skill。
- 若出现未确认假设、风险、开放问题或过程 handoff，交给 `arckit-pending`，不要静默写入稳定事实源。
- 若请求需要 Workshop Desktop、本地任务记录或 dispatch，再使用 `arckit-workshop-desktop`。
- 只有用户明确要求角色协作或多 agent 编排时，使用 `arckit-role-orchestration`。

退出条件：本轮用户目标完成、阻塞原因明确，或需要用户确认下一步。

### 5. Artifact 和 Workflow 收口

动作：
- 先做 `artifact_impact_scan`，逐项说明 `spec|interaction|visual|tech|pending|governance|verification|workflow_memory` 是 `none|check|update|pending|skipped`；输出可以简洁，但不能因为任务规模小而省略逐项判断或把无项目事实变化等同于 workflow memory 无影响。
- 如果 `arckit-turn-adaptation` 输出 `workflow_correction_ledger`，在调用 `arckit-workflow-memory` 前必须带上该 ledger；不得因为 `artifact_impact_scan` 全部 `skipped` 而跳过 workflow memory 判断。
- 对需要更新的稳定事实源，调用对应结果型 skill；对未决内容调用 `arckit-pending`；对实现可靠性调用质量 skill。
- 触发 `arckit-workflow-memory` 写入或更新本轮 `execution_record`，再做 `workflow_memory_closeout`；具体信号判断、候选维护和持久化按 `arckit-workflow-memory` 的规则执行。

退出条件：最终响应包含 artifact impact scan 和 workflow memory closeout 状态，且没有把“检查过但未决策”当作完成。

## Reference 路由

- 场景分类、默认 workflow、skill 分层、事实源边界：读 [references/routing-notes.md](references/routing-notes.md)。

## 输出

输出可按任务需要保持简洁，但必须保留 workflow resolution、workflow frame、artifact impact scan 和 closeout 判断。复杂任务输出：

- `scenario`
- `runtime_situation`
- `workflow_resolution`
- `workflow_composition_reasoning`
- `final_goal`
- `current_phase`
- `phase_reason`
- `workflow_source`
- `available_arckit_capabilities`
- `selected_capabilities`
- `why_not_selected`
- `skills`
- `handoffs`
- `artifact_targets`
- `artifact_impact_scan`
- `reflection_gates`
- `adaptation_triggers`
- `next_recompile_condition`
- `memory_overlay`
- `execution_record_target`
- `workflow_memory`
- `confirmation_points`
- `stop_conditions`

结束时必须说明 artifact impact scan 和 workflow memory closeout 状态；具体记忆字段由 `arckit-workflow-memory` 输出。
