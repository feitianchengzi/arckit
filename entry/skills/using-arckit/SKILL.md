---
name: using-arckit
description: 软件项目协作的默认入口和工作流编排 skill。只要用户请求或输入材料可能涉及产品想法、原始输入归档、用户反馈、候选事项、问题清单、需求规格、交互、视觉、技术方案、迭代治理、项目记忆、debug、任务记录、Workshop Desktop、skill 创建/验证或软件项目开发工作流，就先使用本 skill；不要求用户提到 ArcKit。使用后先识别场景，再匹配或生成 workflow frame，按工作流组合必要专门 skills，并在任务结束时维护 workflow memory；只有当请求和输入材料明确与软件项目协作无关时才跳过。
---

# Using ArcKit

把本 skill 作为软件项目协作的默认入口。它不直接替代专门 skill，而是先识别场景、检查 workflow memory、形成 `workflow_frame`，再组合必要 skill 完成任务。

## 硬约束

- 触发门槛要低：只要有很小可能涉及软件项目协作，就先使用本 skill 判断是否进入 ArcKit 工作流。
- 入口必须先形成当前任务的 `workflow_frame`，再读取专门 skill；不要直接从 prompt 关键词跳到单个结果 skill。
- 每个进入 ArcKit 的任务都必须使用 `arckit-workflow-memory` 两次：开始做 `memory_check`，结束、阻塞或失败时做 `signal_capture` 和 candidate/index 收口。
- `~/.arckit/workflows` 是 ArcKit 用户级基础运行状态目录；用户说“业务代码只改目标项目目录”不等于禁止 workflow memory。
- workflow memory 只记录 agent 工作方式、skill 组合、确认点和验证强度；产品、技术、交互、视觉和治理事实仍写入对应项目事实源。
- 一次任务只能形成 signal；多个相似 signals 才能形成 candidate；accepted workflow 必须经用户确认。
- 在 ArcKit 源仓库内工作时，优先读取本仓库中的同级源路径，而不是用户级已安装副本。

## 主流程

### 1. 场景识别

输入：用户请求、目标路径、已有文档、错误、测试、上下文和可用 skill。

动作：
- 判断当前任务是否属于软件项目协作。
- 识别 `scenario`、关键 `signals`、可能的 artifact targets 和当前显式约束。
- 如需详细场景和默认路由，读取 [references/routing-notes.md](references/routing-notes.md)。

退出条件：确定进入 ArcKit 或明确跳过 ArcKit。

### 2. Workflow Memory Check

动作：
- 使用 `arckit-workflow-memory` 做 `memory_check`。
- 要求先读取相关 `INDEX.md` 内容；索引缺失、不完整或未列出已存在文件时，由 `arckit-workflow-memory` 扫描目录兜底并报告 index 状态。
- 命中 accepted workflow 时作为 workflow source；命中 candidate 时作为参考来源；没有命中时降级为 `arckit-default` 或 `ad-hoc`。

退出条件：得到 `workflow_memory_status`，或记录 memory 不可用、无权限、pending 的原因。

### 3. 生成 Workflow Frame

动作：
- 生成简短 `workflow_frame`：`scenario`、`signals`、`workflow_source`、`skills`、`handoffs`、`artifact_targets`、`workflow_memory`、`confirmation_points`、`stop_conditions`。
- 正向实现任务先形成最小 `implementation_handoff`，再执行普通代码工作流或外部 `arckit-code`，并按风险使用 `arckit-verify-implementation`。
- 多个 skill 都适用时，按 workflow frame 的阶段顺序组合；只加载当前任务真正需要的 skill。

退出条件：用户目标、skill 顺序、交接边界和停止条件明确。

### 4. 执行和交接

动作：
- 按 workflow frame 读取并使用专门 skill。
- 若实现、验证或讨论暴露稳定产品/技术/治理变化，交给对应结果型 skill 或治理 skill。
- 若请求需要 Workshop Desktop、本地任务记录或 dispatch，再使用 `arckit-workshop-desktop`。
- 只有用户明确要求角色协作或多 agent 编排时，使用 `arckit-role-orchestration`。

退出条件：本轮用户目标完成、阻塞原因明确，或需要用户确认下一步。

### 5. Workflow Memory 收口

动作：
- 使用 `arckit-workflow-memory` 记录 signal 或 pending/blocked signal。
- 若出现相似 signals，要求输出 candidate 状态；第二条相似 signal 后不能省略 candidate 结果。
- 写入或更新 signal、candidate、accepted 后，必须同步对应 `INDEX.md`；如果无法同步，输出 `workflow_index_pending_write` 或 `workflow_index_blocked`。

退出条件：最终响应包含 workflow memory 收口状态，且没有把“检查过但未写入”当作完成。

## Reference 路由

- 场景分类、默认 workflow、skill 分层、事实源边界：读 [references/routing-notes.md](references/routing-notes.md)。

## 输出

简单任务可压缩为一句 workflow frame；复杂任务输出：

- `scenario`
- `workflow_source`
- `skills`
- `handoffs`
- `artifact_targets`
- `workflow_memory`
- `confirmation_points`
- `stop_conditions`

结束时必须说明 workflow signal、candidate、index 和 accepted workflow 的收口状态。
