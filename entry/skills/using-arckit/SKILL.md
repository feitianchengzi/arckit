---
name: using-arckit
description: 软件项目协作的默认入口和动态工作流编排 skill。只要用户请求或输入材料可能涉及产品想法、原始输入归档、用户反馈、候选事项、问题清单、需求规格、交互、视觉、技术方案、迭代治理、项目记忆、debug、任务记录、Workshop Desktop、skill 创建/验证或软件项目开发工作流，就先使用本 skill；不要求用户提到 ArcKit。使用后先建立 runtime situation model，再应用 workflow memory overlay 编译 workflow frame，按执行反馈动态组合必要专门 skills，并在结束时完成 artifact impact scan 和 workflow memory closeout；只有当请求和输入材料明确与软件项目协作无关时才跳过。
---

# Using ArcKit

把本 skill 作为软件项目协作的默认入口和 runtime workflow compiler。它不直接替代专门 skill，也不把 workflow memory 当成固定流程执行器；它先建立当前任务态势，读取 workflow memory overlay，再编译 `workflow_frame`，执行中通过 reflection gates 调整 skill 组合，最后把项目事实、未决问题和流程学习路由到不同事实源。

## 硬约束

- 触发门槛要低：只要有很小可能涉及软件项目协作，就先使用本 skill 判断是否进入 ArcKit 工作流。
- 入口必须先建立 `runtime_situation` 并编译当前任务的 `workflow_frame`，再读取专门 skill；不要直接从 prompt 关键词跳到单个结果 skill。
- 每个进入 ArcKit 的任务都必须使用 `arckit-workflow-memory` 两次：开始做 `memory_check`，结束、阻塞或失败时做 `workflow_memory_closeout`。
- `~/.arckit/workflows` 是 ArcKit 用户级基础运行状态目录；用户说“业务代码只改目标项目目录”不等于禁止 workflow memory。
- workflow memory 只提供 workflow patches/overlays，不能替代入口编排器；命中的 memory 必须实际改写或明确不改写本轮 `workflow_frame`。
- 每轮都必须做 `artifact_impact_scan`：判断是否需要交给 `arckit-spec`、`arckit-interaction`、`arckit-visual`、`arckit-tech`、`arckit-pending`、治理、验证或 workflow memory。
- 轻量任务可以压缩 scan 输出为一句 `artifact_impact_scan: all skipped; no project facts changed`，但不能跳过判断。
- 一次任务最多形成一条 signal；signal 是学习证据，不是任务日志；多个相似 signals 才能形成 candidate patch；accepted workflow patch 必须经用户确认。
- 在 ArcKit 源仓库内工作时，优先读取本仓库中的同级源路径，而不是用户级已安装副本。

## 主流程

### 1. 场景识别

输入：用户请求、目标路径、已有文档、错误、测试、上下文和可用 skill。

动作：
- 判断当前任务是否属于软件项目协作。
- 识别 `scenario`、关键 `signals`、可能的 artifact targets 和当前显式约束。
- 建立 `runtime_situation`：`user_goal`、`project_stage`、`evidence_available`、`uncertainty`、`constraints`、`likely_artifact_impacts`。
- 如需详细场景和默认路由，读取 [references/routing-notes.md](references/routing-notes.md)。

退出条件：确定进入 ArcKit 或明确跳过 ArcKit。

### 2. Workflow Memory Check

动作：
- 使用 `arckit-workflow-memory` 做 `memory_check`。
- 要求先读取相关 `INDEX.md` 内容；索引缺失、不完整或未列出已存在文件时，由 `arckit-workflow-memory` 扫描目录兜底并报告 index 状态。
- 命中 accepted workflow patch 时作为 memory overlay；命中 candidate patch 时作为参考 overlay；没有命中时降级为 `arckit-default` 或 `ad-hoc`。
- 记录 memory overlay 是否实际改变本轮 skill、handoff、artifact scan、确认点、验证强度或 closeout 策略。

退出条件：得到 `workflow_memory_status`，或记录 memory 不可用、无权限、pending 的原因。

### 3. 编译 Workflow Frame

动作：
- 生成简短 `workflow_frame`：`scenario`、`signals`、`runtime_situation`、`workflow_source`、`skills`、`handoffs`、`artifact_targets`、`artifact_impact_scan`、`reflection_gates`、`memory_overlay`、`confirmation_points`、`stop_conditions`。
- 将默认能力地图、用户显式要求、runtime situation 和 memory overlay 合并；冲突时当前用户显式要求优先，未决冲突进入 pending 或请求确认。
- 正向实现任务先形成最小 `implementation_handoff`，再执行普通代码工作流或外部 `arckit-code`，并按风险使用 `arckit-verify-implementation`。
- 多个 skill 都适用时，按 workflow frame 的阶段顺序组合；只加载当前任务真正需要的 skill。

退出条件：用户目标、skill 顺序、交接边界和停止条件明确。

### 4. 执行和交接

动作：
- 按 workflow frame 读取并使用专门 skill。
- 在 `after_context_read`、`before_edit`、`after_execution`、`before_final` 等 reflection gates 重新判断 skill 组合和 artifact targets。
- 若实现、验证或讨论暴露稳定产品、交互、视觉、技术或治理变化，交给对应结果型 skill 或治理 skill。
- 若出现未确认假设、风险、开放问题或过程 handoff，交给 `arckit-pending`，不要静默写入稳定事实源。
- 若请求需要 Workshop Desktop、本地任务记录或 dispatch，再使用 `arckit-workshop-desktop`。
- 只有用户明确要求角色协作或多 agent 编排时，使用 `arckit-role-orchestration`。

退出条件：本轮用户目标完成、阻塞原因明确，或需要用户确认下一步。

### 5. Artifact 和 Workflow 收口

动作：
- 先做 `artifact_impact_scan`，逐项说明 `spec|interaction|visual|tech|pending|governance|verification|workflow_memory` 是 `none|check|update|pending|skipped`；轻量任务且无项目事实变化时可压缩为一句 all skipped。
- 对需要更新的稳定事实源，调用对应结果型 skill；对未决内容调用 `arckit-pending`；对实现可靠性调用质量 skill。
- 使用 `arckit-workflow-memory` 做 `workflow_memory_closeout`，先输出 `signal_decision`，再按决策写 signal、轻量更新 candidate 或跳过。
- 只有有学习价值时才写 signal；命中 candidate 且正常成功时优先 `update_candidate_only`；命中 accepted 且完全按预期成功时优先 `skip`。
- 若出现相似 signals 或 candidate 验证事件，要求输出 candidate 状态；第二条相似 signal 后不能省略 candidate 结果。
- 写入或更新 signal、candidate、accepted 后，必须同步对应 `INDEX.md`；如果无法同步，输出 `workflow_index_pending_write` 或 `workflow_index_blocked`。

退出条件：最终响应包含 artifact impact scan 和 workflow memory closeout 状态，且没有把“检查过但未决策”当作完成。

## Reference 路由

- 场景分类、默认 workflow、skill 分层、事实源边界：读 [references/routing-notes.md](references/routing-notes.md)。

## 输出

简单任务可压缩为一句 workflow frame；复杂任务输出：

- `scenario`
- `runtime_situation`
- `workflow_source`
- `skills`
- `handoffs`
- `artifact_targets`
- `artifact_impact_scan`
- `reflection_gates`
- `memory_overlay`
- `workflow_memory`
- `confirmation_points`
- `stop_conditions`

结束时必须说明 artifact impact scan、`signal_decision`、workflow signal、candidate patch、index 和 accepted workflow patch 的收口状态。
