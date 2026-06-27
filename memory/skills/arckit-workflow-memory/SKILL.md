---
name: arckit-workflow-memory
description: 管理用户级和项目级 Arckit 工作流记忆。由 using-arckit 在每个软件项目协作任务开始和结束时默认使用：开始时读取并匹配 workflow patches/overlays，结束时做 signal decision，只有有学习价值时记录 workflow signal；多个 signals 足够稳定时维护 workflow candidate patch，并且只有用户确认后才提升为 accepted workflow patch。不要把一次性任务计划、产品概念、技术方案或项目事实写入本 skill；这些仍由 arckit/spec、arckit/tech、治理或 pending 维护。
---

# ArcKit Workflow Memory

本 skill 维护 agent 工作方式的长期记忆。它把用户纠偏、成功/失败证据、新任务形态和重复模式沉淀为 workflow signals，再从多个 signals 归纳 workflow candidate patches，最后在用户确认后形成 accepted workflow patches。

Workflow memory 是 procedural memory，不是项目事实源。Workflow signal 是学习证据，不是每次任务的审计日志。Workflow memory 不替代 `using-arckit` 的 runtime compiler；它只提供可应用到 workflow frame 的 overlay。

## 硬约束

- 每个进入 Arckit 的软件项目协作任务，开始阶段做 memory check，结束、阻塞或失败时做 workflow memory closeout。
- 不要因为用户没有提到 workflow、记忆、沉淀或 Arckit，就跳过本 skill。
- 一轮任务最多生成一条 signal；只有有学习价值时才写 signal；多个相似 signals 才能形成 candidate patch；candidate 经用户确认后才成为 accepted workflow patch。
- Workflow memory 记录编排启发式和 frame 改写方式，不记录固定模板流程；不要把一次事件写成“某类任务必须总是 A->B->C”。
- 用户对流程提出质疑、偏好、缺漏或阶段纠偏时，优先按 workflow-level correction 评估是否写 signal，而不是只当作普通任务备注。
- `~/.arckit/workflows` 是 ArcKit 的用户级基础运行状态目录。目录不存在且当前工具权限允许时，直接初始化。
- 用户限制“业务代码只改某项目目录”时，默认只约束业务代码和项目事实写入，不自动禁止 workflow memory。
- `INDEX.md` 是 workflow memory 的导航索引：memory check 必须先读索引；写入或更新 signal、candidate patch、accepted workflow patch 后必须同步索引。
- 如果 `INDEX.md` 缺失、过期或没有列出已存在的 candidate/accepted 文件，不能判定无匹配；应扫描目录兜底，并在收口时修复或报告索引漂移。
- 产品概念、功能规格、技术方案、交互、视觉、治理任务和项目 pending 不写入 workflow memory；它们只作为 signal 来源引用。
- Accepted workflow patch 不覆盖当前用户显式指令、系统/工具权限、项目事实源边界、安全规则或 `using-arckit` 的 artifact impact scan。

## 主流程

### 1. Memory Check

输入：用户请求、目标项目路径、`using-arckit` 初步场景判断、可用 skill 列表。

动作：
- 定位用户级和项目级 workflow memory。
- 必要时初始化 `~/.arckit/workflows/user/{INDEX.md,signals,candidates,accepted}`。
- 读取相关 `INDEX.md` 内容，再按索引选择可能匹配的 accepted/candidate 文件。
- 索引缺失、不完整或过期时，扫描 `accepted/` 和 `candidates/` 兜底。
- 优先匹配 accepted workflow patch，再参考 candidate workflow patch。
- 需要字段或目录细节时读取 [references/workflow-memory-operations.md](references/workflow-memory-operations.md)。

退出输出：`workflow_memory_status`，包括 checked scopes、matched workflows、fallback、write permission、bootstrap status、index status。

### 2. Frame Contribution

动作：
- 命中 accepted workflow patch 时，作为 memory overlay 交给 `using-arckit` 应用。
- 只命中 candidate patch 时，作为参考 overlay，不把 candidate 当成硬规则。
- 输出该 overlay 预期改变的步骤、skill 顺序、handoff、artifact scan、reflection gate、确认点或 closeout 策略。
- 未命中时，标记为 `arckit-default` 或 `ad-hoc`，并准备任务结束后做 signal decision。

退出条件：`using-arckit` 的 workflow frame 能说明 memory 是否检查、是否匹配、是否降级。

### 3. Signal Decision

输入：最终 workflow frame、实际使用的 skills、文件、命令、写入路径、验证结果、用户反馈、失败点。

动作：
- 读取 [references/workflow-memory-schema.md](references/workflow-memory-schema.md)。
- 输出 `signal_decision`，action 必须是 `write_signal`、`update_candidate_only` 或 `skip`。
- 当用户反馈触发过 `user_workflow_correction`、重新区分 `final_goal` 和 `current_phase`、或改变了 selected capabilities，默认具有学习价值；除非已被命中的 accepted patch 完全覆盖，否则优先 `write_signal`。
- `write_signal` 时记录一条 workflow signal，或输出 `workflow_signal_pending_write|workflow_signal_blocked`；并把本次 signal 加入当前会话 `pending_signal_buffer`。
- `update_candidate_only` 时只更新命中的 candidate 轻量统计或验证状态，不创建完整 signal。
- `skip` 只用于命中 accepted workflow patch 且本次完全按预期成功、无用户纠偏、无失败、无新增模式。
- signal 文件写入成功后同步 `INDEX.md` 的 Recent Signals；candidate 更新成功后同步 `INDEX.md` 的 Candidates。

退出条件：得到 `signal_decision` 和对应的 signal/candidate/index 状态。

### 4. Candidate Maintenance

动作：
- 将本次 signal 或 candidate match update 与 pending buffer、已读 signals、已读 candidates 做相似性检查。
- 第二条相似 signal 后必须创建、更新、pending 或 blocked candidate；第三条相似 signal 后仍无 candidate 状态，视为收口失败。
- 命中已有 candidate patch 且本轮无新信息时，可以只更新 candidate 的 `match_count`、`success_count`、`last_matched_at`、`last_outcome` 或 `last_match_summary`。
- candidate 写入或更新成功后同步 `INDEX.md` 的 Candidates。
- Candidate patch 不能自动变成 accepted。

退出条件：输出 `workflow_candidate_update`，并说明 index update 状态。

### 5. Acceptance

只有用户确认时执行。

动作：
- 向用户展示 candidate patch 摘要、证据数量、适用范围、预期改变的编排项、风险和作用域。
- 用户确认后写入 accepted workflow patch，并同步 `INDEX.md` 的 Accepted。
- 用户未明确作用域时先询问。

退出条件：输出 `accepted_workflow_update`，或说明未提升原因。

## Reference 路由

- 存储布局、index 兜底扫描、相似性、pending buffer、candidate 维护细节：读 [references/workflow-memory-operations.md](references/workflow-memory-operations.md)。
- YAML 字段、signal/candidate/accepted/index 结构：读 [references/workflow-memory-schema.md](references/workflow-memory-schema.md)。

## 输出

本 skill 每次参与都输出：

- `workflow_memory_status`
- `signal_decision`
- `workflow_signal`、pending/blocked signal，或 skipped reason
- `workflow_candidate_update`
- `memory_overlay` 或 `workflow_patch`
- `workflow_index_update`
- `accepted_workflow_update`
- 写入路径或待确认写入路径
