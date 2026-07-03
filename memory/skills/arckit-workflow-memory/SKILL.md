---
name: arckit-workflow-memory
description: 管理用户级和项目级 Arckit 场景工作流记忆、workflow resolution、execution records 和 workflow patches。由 using-arckit 在每个软件项目协作任务开始和结束时默认路由触发：开始解析并绑定 accepted/candidate scenario workflow，结束写入 execution record 并做 signal decision。不要把一次性任务计划、产品概念、技术方案或项目事实写入本 skill。
---

# ArcKit Workflow Memory

本 skill 维护 agent 工作方式的长期记忆。它把同类任务绑定到可复用 scenario workflow，把每次执行保存为 execution record，并把用户纠偏、成功/失败证据、新任务形态和重复模式沉淀为 workflow signals；多个相似 signals 用来维护同一个 workflow candidate patch，最后在用户确认后形成 accepted workflow patch。

Workflow memory 是 procedural memory，不是项目事实源。Workflow signal 是学习证据，不是每次任务的审计日志；每次任务的执行证据写入 execution record。Workflow memory 不替代 `using-arckit` 的 runtime compiler；它提供 workflow resolution、可应用到 workflow frame 的 overlay，以及 execution record 持久化。

## 硬约束

- 每个进入 Arckit 的软件项目协作任务，开始阶段做 workflow resolution，结束、阻塞或失败时写 execution record 并做 workflow memory closeout。
- 不要因为用户没有提到 workflow、记忆、沉淀或 Arckit，就跳过本 skill。
- 一轮任务最多生成一条 signal；只有有学习价值时才写 signal；多个相似 signals 用于强化或合并 candidate patch。workflow resolution 未命中已有场景时，可以创建场景级 candidate 作为后续复用承载；candidate 经用户确认后才成为 accepted workflow patch。
- 不要把每次任务创建成新的 workflow。优先复用并维护同一个 accepted/candidate scenario workflow；只有无法匹配已有场景工作流时，才创建新的场景级 candidate。
- 每次任务必须产生或更新 `execution_record`，记录绑定的 workflow、实际执行、偏离原因、用户纠错和结果；execution record 不等于 workflow。
- Workflow memory 记录编排启发式和 frame 改写方式，不记录固定模板流程；不要把一次事件写成“某类任务必须总是 A->B->C”。
- 不要使用会诱导 agent 降低流程完整性的 workflow 修饰词；如需控制记录篇幅，明确保留 workflow resolution、execution record、signal decision 和 index update 判断。
- 本 skill 不负责区分首轮消息、补充信息、目标变更和 workflow 纠偏；`using-arckit` 只判断首轮入口和后续消息交接，后续消息分类由 `arckit-turn-adaptation` 完成。
- 当输入包含 `workflow_correction_ledger`，优先按 workflow-level correction 评估是否写 signal，而不是只当作普通任务备注。
- `workflow_correction_ledger` 表明用户纠正流程选择、改变后续验证方式、声明当前项目偏好、要求以后按某种方式执行，或指出“为什么没有学习/为什么跳过”时，`signal_decision=skip` 禁止使用；除非存在完全匹配的 accepted workflow patch，或用户明确说不要记录。
- `~/.arckit/workflows` 是 ArcKit 的用户级基础运行状态目录。目录不存在且当前工具权限允许时，直接初始化。
- 用户限制“业务代码只改某项目目录”时，默认只约束业务代码和项目事实写入，不自动禁止 workflow memory。
- `INDEX.md` 是 workflow memory 的导航索引：workflow resolution 必须先读索引；写入或更新 execution record、signal、candidate patch、accepted workflow patch 后必须同步索引。
- 如果 `INDEX.md` 缺失、过期或没有列出已存在的 candidate/accepted 文件，不能判定无匹配；应扫描目录兜底，并在收口时修复或报告索引漂移。
- 产品概念、功能规格、技术方案、交互、视觉、治理任务和项目 pending 不写入 workflow memory；它们只作为 signal 来源引用。
- Accepted workflow patch 不覆盖当前用户显式指令、系统/工具权限、项目事实源边界、安全规则或 `using-arckit` 的 artifact impact scan。
- 当 `workflow_correction_ledger.scope_hint=current_project` 或 signal `scope=project` 时，默认写入项目级 workflow memory：`~/.arckit/workflows/projects/<project-fingerprint>/`。只有项目指纹无法稳定计算或项目级目录不可写时，才可降级到 user scope，并必须在输出中说明降级原因。

## 主流程

### 1. Workflow Resolution

输入：用户请求、目标项目路径、`using-arckit` 初步场景判断、可用 skill 列表。

动作：
- 定位用户级和项目级 workflow memory。
- 必要时初始化 `~/.arckit/workflows/user/{INDEX.md,signals,candidates,accepted,executions}`。
- 如果本轮目标项目可稳定指纹化，必要时初始化 `~/.arckit/workflows/projects/<project-fingerprint>/{INDEX.md,signals,candidates,accepted,executions}`。
- 读取相关 `INDEX.md` 内容，再按索引选择可能匹配的 accepted/candidate 文件。
- 索引缺失、不完整或过期时，扫描 `accepted/` 和 `candidates/` 兜底。
- 优先匹配项目级 accepted workflow patch，再匹配项目级 candidate，再匹配用户级 accepted/candidate。
- 命中后输出绑定结果：`bound_workflow_id` 或 `bound_candidate_id`、`resolution_source`、`match_reason`、`applied_overlay`、`execution_record_target`。
- 未命中时，输出 `new_candidate_required` 或在可写时创建场景级 candidate；不得为本次任务创建一次性 workflow。
- 需要字段或目录细节时读取 [references/workflow-memory-operations.md](references/workflow-memory-operations.md)。

退出输出：`workflow_memory_status` 和 `workflow_resolution`，包括 checked scopes、matched workflows、bound workflow/candidate、execution_record_target、fallback、write permission、bootstrap status、index status。

### 2. Frame Contribution

动作：
- 命中 accepted workflow patch 时，作为 memory overlay 交给 `using-arckit` 应用。
- 命中 candidate patch 时，作为参考 overlay，并绑定本次 execution record；candidate 不覆盖用户显式指令和系统边界。
- 输出该 overlay 预期改变的步骤、skill 顺序、handoff、artifact scan、reflection gate、确认点或 closeout 策略。
- 未命中时，标记为 `new_candidate_required`，按场景创建或准备创建 candidate，并准备任务结束后做 signal decision。

退出条件：`using-arckit` 的 workflow frame 能说明 workflow resolution 是否完成、是否匹配、是否降级。

### 3. Signal Decision

输入：最终 workflow frame、workflow_resolution、execution_record、实际使用的 skills、文件、命令、写入路径、验证结果、用户反馈、失败点、`workflow_correction_ledger`。

动作：
- 读取 [references/workflow-memory-schema.md](references/workflow-memory-schema.md)。
- 输出 `signal_decision`，action 必须是 `write_signal`、`update_candidate_only` 或 `skip`。
- 当 `workflow_correction_ledger.changed_frame=true`、重新区分 `final_goal` 和 `current_phase`，或改变了 selected capabilities 时，默认具有学习价值；除非已被命中的 accepted patch 完全覆盖，否则优先 `write_signal`。
- 当 `workflow_correction_ledger.default_signal_decision=write_signal` 时，除非用户明确说一次性或不要记录，按 `write_signal` 处理。
- `skip` 禁止用于用户纠正流程选择、改变后续验证方式、声明当前项目偏好、要求以后按某种方式执行、指出“为什么没有学习/为什么跳过”的场景；只有完全匹配的 accepted patch 覆盖该纠偏时才可 `skip`，并必须写明覆盖依据。
- `write_signal` 时记录一条 workflow signal，或输出 `workflow_signal_pending_write|workflow_signal_blocked`；并把本次 signal 加入当前会话 `pending_signal_buffer`。
- `update_candidate_only` 时只更新命中的 candidate 匹配统计或验证状态，不创建完整 signal。
- `skip` 只用于命中 accepted workflow patch 且本次完全按预期成功、无用户纠偏、无失败、无新增模式。
- 典型判断：用户说“当前项目写完代码后，只需要自查是否有错误、多余、遗漏，不需要编译，我人工编译”时，`affected_workflow_area=verification/stop condition`，`scope_hint=current_project`，`scope=project`，`signal_decision=write_signal`；单条证据不直接 accepted，多次稳定后再形成 candidate。
- signal 文件写入成功后同步 `INDEX.md` 的 Recent Signals；candidate 更新成功后同步 `INDEX.md` 的 Candidates。

退出条件：得到 `signal_decision` 和对应的 signal/candidate/index 状态。

### 4. Candidate Maintenance

动作：
- 将本次 signal 或 candidate match update 与 pending buffer、已读 signals、已读 candidates 做相似性检查。
- 第二条相似 signal 后必须创建、更新、pending 或 blocked candidate；如果 workflow resolution 已在首个新场景创建 candidate，第二条相似 signal 必须更新该 candidate。第三条相似 signal 后仍无 candidate 状态，视为收口失败。
- 命中已有 candidate patch 且本轮无新信息时，可以只更新 candidate 的 `match_count`、`success_count`、`last_matched_at`、`last_outcome` 或 `last_match_summary`。
- 若本轮已绑定 candidate，优先更新这个 candidate；不要为同一类场景创建第二个 candidate。
- 若本轮绑定 accepted workflow 且纠错要求改变 accepted 规则，先写 signal 和 patch proposal，必须等用户确认后才更新 accepted。
- candidate 写入或更新成功后同步 `INDEX.md` 的 Candidates。
- Candidate patch 不能自动变成 accepted。

退出条件：输出 `workflow_candidate_update`，并说明 index update 状态。

### 5. Execution Record

动作：
- 每个进入 ArcKit 的任务都要写入或准备写入 `execution_record`。
- `execution_record` 记录：本次任务、绑定 workflow/candidate、workflow frame 摘要、实际执行、artifact impact scan、用户纠错、偏离原因、验证结果、closeout 和后续 patch 建议。
- 如果当前环境不能写 `~/.arckit`，输出 `execution_record_pending_write`，并保留目标路径和记录内容摘要。
- execution record 写入成功后同步 `INDEX.md` 的 Recent Executions 或对应执行索引区域。

退出条件：输出 `execution_record_update` 和 index update 状态。

### 6. Acceptance

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
- `workflow_memory_closeout`：`correction_detected`、`signal_decision`、`skip_reason`
- `signal_decision`
- `workflow_signal`、pending/blocked signal，或 skipped reason
- `workflow_candidate_update`
- `memory_overlay` 或 `workflow_patch`
- `workflow_index_update`
- `accepted_workflow_update`
- 写入路径或待确认写入路径
- `workflow_resolution`
- `execution_record_update`

当 `correction_detected=yes` 且 `signal_decision=skip` 时，必须解释为什么该纠偏不是可复用流程学习，或说明它被哪个 accepted workflow patch 完全覆盖。
