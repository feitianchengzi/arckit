# Workflow Memory Operations

本文件承接 `arckit-workflow-memory` 的运行细节。主 `SKILL.md` 只保留门禁；需要目录、索引、相似性或收口细节时读取本文件。

## 存储布局

```text
~/.arckit/workflows/
  user/
    INDEX.md
    signals/
      YYYY-MM-DD-<slug>.yaml
    candidates/
      <candidate-id>.yaml
    accepted/
      <workflow-id>.yaml
    executions/
      YYYY-MM-DD/
        exec-YYYYMMDD-<slug>.yaml
  projects/
    <project-fingerprint>/
      INDEX.md
      signals/
      candidates/
      accepted/
      executions/
```

项目指纹优先使用 Git root + remote URL。没有 Git 信息时，使用项目绝对路径的稳定标识；无法稳定计算时，用路径 slug，并在 signal 中标记 `fingerprint_confidence: low`。

当 signal `scope=project`，或 `workflow_correction_ledger.scope_hint=current_project` 时，优先写入项目级目录：

```text
~/.arckit/workflows/projects/<project-fingerprint>/
  INDEX.md
  signals/
  candidates/
  accepted/
  executions/
```

不得无说明写入 `~/.arckit/workflows/user/signals/`。只有项目指纹无法稳定计算、项目级目录不可写，或用户明确要求用户级记忆时，才可降级到 user scope；降级时必须在 `workflow_memory_closeout`、pending write 或 signal notes 中说明原因。

## Workflow Resolution 细节

- 如果 memory root 不存在且当前工具权限允许写入，直接初始化基础目录和 `INDEX.md`。
- 如果 memory root 不存在但当前工具权限不允许写入，返回 `bootstrap_required: true` 和 `write_permission: needs_permission|unavailable`，不要把它当作“无须沉淀”。
- 如果本轮是项目级 signal 或 execution record，workflow resolution 和 closeout 都必须检查对应 project scope 的 `INDEX.md`，再按需要参考 user scope 作为 fallback overlay。
- 读取相关 `INDEX.md` 的文件内容，并把索引中与当前 `scenario`、路径、错误类型或用户意图可能匹配的 candidate/accepted workflow patches 作为首批候选。
- 如果 `INDEX.md` 不存在、为空、没有列出 candidate/accepted，或索引条目与磁盘文件明显不一致，扫描 `accepted/` 和 `candidates/` 目录兜底；只打开可能匹配的文件，并记录 `index_status: missing|stale|incomplete|current`。
- 匹配优先级：当前项目 accepted、当前项目 candidate、用户 accepted、用户 candidate、ArcKit 默认场景 workflow、新场景 candidate。
- 命中 accepted/candidate 时，输出绑定结果和 `execution_record_target`；本次任务后续纠错和结果都写入该 execution record。
- 无匹配时，不阻塞任务；返回 `new_candidate_required`，可写时创建场景级 candidate，不可写时输出 pending write。不得为本次任务创建一次性 workflow。
- 无目录或无权限时，返回 `workflow_memory_status` 和可执行的 pending 状态。

## Execution Record 细节

Execution record 是本次任务如何应用场景工作流的证据，不是新的 workflow。

写入条件：

- 每个进入 ArcKit 的任务结束、阻塞或失败时都写入或准备写入 execution record。
- 如果执行中出现用户纠错、验证失败、偏离绑定 workflow、工具权限问题或 artifact routing 变化，必须记录在 execution record。
- 如果本次任务完全按 accepted workflow 成功执行，也要记录执行结果，便于后续判断 accepted workflow 是否稳定。

推荐字段由 [workflow-memory-schema.md](workflow-memory-schema.md) 定义。

写入规则：

- scope 为 project 时默认写入 `~/.arckit/workflows/projects/<project-fingerprint>/executions/YYYY-MM-DD/`。
- scope 为 user 时写入 `~/.arckit/workflows/user/executions/YYYY-MM-DD/`。
- 写入成功后更新 `INDEX.md` 的 Recent Executions 或等价执行索引区域。
- 如果当前环境不能写 `~/.arckit`，输出 `execution_record_pending_write`，包含目标路径和记录摘要。
- execution record 不参与 accepted/candidate 的直接匹配，但可以作为 signal/candidate 的 evidence ref。

## Signal Decision 细节

每次 Arckit 任务结束、阻塞或失败时都必须做 signal decision，但不一定写 signal。Signal 是学习样本，不是任务流水账。

`signal_decision.action` 只能是：

- `write_signal`
- `update_candidate_only`
- `skip`

写 signal 的条件：

- `workflow_correction_ledger` 表明用户纠正了 agent 的流程、确认点、输出格式、验证方式、停止条件或工具边界。
- 最终 workflow frame 重新区分了最终目标和当前步骤，或要求先选择、先确认、先原型、先方案、先解释流程，再进入实现或稳定事实写入。
- `workflow_correction_ledger` 表明用户指出 agent 没有按项目入口能力或调用方要求编译 workflow、没有利用基础 skill、没有生成预期中间产物、没有学习或跳过了记忆判断。
- 任务失败、阻塞、返工、回滚或验证不通过。
- 出现新的任务形态、输入形态、skill 组合或停止条件。
- 现有 candidate/accepted workflow patch 不适配，或需要收窄适用边界。
- 本次验证了 candidate 的关键假设，并且该证据需要保留完整上下文。
- 出现新的风险、权限边界、索引漂移、事实源边界或候选提升判断。
- 本轮发现某个 workflow patch 应该改变 future workflow frame 的步骤、artifact scan、reflection gate、确认点或验证强度。

写入时抽象为启发式：

- 记录触发信号、当前阶段判断、应选择或跳过的能力、下一次重编译条件和 frame 改写形状。
- 避免把一次具体任务、页面类型、技术栈或中间产物写成普适顺序。
- 推荐表达为“当出现这些信号时重新编译 workflow 并显式区分 final_goal/current_phase”，而不是“所有同类任务必须先做某一步”。

只更新 candidate 的条件：

- 命中已有 candidate。
- 本次正常成功，没有用户纠偏、失败、分歧或新增模式。
- 只需要增加匹配统计或验证信息，例如 `match_count`、`success_count`、`last_matched_at`、`last_outcome` 或 `last_match_summary`。

跳过的条件：

- 命中 accepted workflow patch。
- 本次完全按预期成功。
- 没有用户纠偏、失败、分歧、新风险、新工具边界或新增模式。

执行规则：

- `write_signal` 时，把本次 signal 加入当前会话的 `pending_signal_buffer`。
- `write_signal` 时，如果无法写入文件，也要在对话状态中保留 signal id、scenario、source_task、project_root、skills_used、outcome 和 reusable_pattern_hint，供 candidate maintenance 使用。
- `write_signal` 时，当前工具支持请求提升权限，且用户没有明确禁止外部 workflow memory 时，在业务任务验证完成后请求权限写入 signal；不要因为“首次初始化”额外请求产品确认。
- `write_signal` 时，signal 文件写入成功后必须同步更新对应 `INDEX.md` 的 Recent Signals；如果 signal 可写但 index 不可写，本轮不能只报告 `workflow_signal_written`，还必须输出 `workflow_index_pending_write` 或 `workflow_index_blocked`。
- `update_candidate_only` 时，不创建伪 signal，不把普通命中写入 Recent Signals。
- `skip` 时，不写 signal、不更新 candidate、不更新 index，但必须输出 skip reason。

## Candidate Maintenance 细节

候选形成条件：

- workflow resolution 未命中已有 accepted/candidate workflow，且本轮场景有持续复用可能时，可创建场景级 candidate，作为后续执行记录和 signals 的归并承载。
- 至少两个相似 signals 指向同一任务模式或同一种 workflow frame 改写方式，无论这些 signals 已写入文件还是处于 pending write。
- 一个 signal 加上明确用户纠偏，且该纠偏是流程级而非一次性业务要求。
- 已存在 candidate，本轮 signal 提供了新的成功/失败证据。
- 已存在 candidate，本轮只有正常成功命中时，可以不写 signal，只做 candidate match update。
- 本轮已绑定 candidate 时，优先更新这个 candidate；不得因为出现新 execution record 就为同一类场景创建第二个 candidate。
- 本轮已绑定 accepted workflow 且用户纠错要求改变该 workflow 时，写 signal 和 patch proposal；accepted 更新必须等用户确认。

相似性至少比较：

- `scenario`
- 主要 skill 链
- 任务输入形态
- 用户纠偏或适配触发器
- final goal 与 current phase 是否分离
- 失败/验证形态
- artifact targets
- artifact impact scan
- reflection gates
- workflow patch shape
- reusable pattern hint

名称、fixture 路径或具体函数名不同不应阻止相似匹配。

维护规则：

- 相似 signals 数量小于 2 且 workflow resolution 已命中新场景 candidate 时，输出该 candidate 的创建或更新状态；如果未创建 candidate，输出 `workflow_candidate_update: none`，并说明当前 signal buffer 数量。
- 相似 signals 数量大于等于 2 时，即使它们尚未落盘，也必须维护 candidate。
- 新 candidate 使用 `status: candidate`。
- 更新 candidate 时保留 evidence refs，不覆盖历史证据。
- Candidate match update 可以只维护 `match_count`、`success_count`、`failure_count`、`last_matched_at`、`last_outcome` 和 `last_match_summary`；没有完整 signal 时不要伪造 `evidence_refs`。
- Candidate patch 应描述适用边界、对 workflow frame 的改写、skill 组合、确认点、artifact scan、reflection gates、失败模式和停止条件。
- Candidate patch 的核心应是 workflow 编排启发式：何时重编译、如何选择基础能力、何时请求确认、何时进入实现或验证；不要把候选写成单一固定路线。
- Candidate patch 表示一类场景的复用工作流；不要把一次任务或一次 execution record 写成独立 candidate。
- candidate 文件创建或更新成功后必须同步更新对应 `INDEX.md` 的 Candidates。
- Candidate patch 不能自动变成 accepted。

## Index Maintenance

`INDEX.md` 是导航索引，不是可选装饰。

- Workflow resolution 必须读取相关 `INDEX.md` 内容。
- 写入或更新 signal 后，更新 Recent Signals。
- 写入或更新 candidate 后，更新 Candidates。
- 写入 accepted workflow patch 后，更新 Accepted。
- 写入 execution record 后，更新 Recent Executions 或等价执行索引区域。
- 如果索引缺失或不含已存在 workflow 文件，收口时应补齐索引条目。
- 如果 YAML 文件可写但 index 不可写，输出 `workflow_index_pending_write`。
- 如果用户明确禁止维护索引，输出 `workflow_index_blocked`。

## Acceptance 细节

- 向用户展示 candidate patch 摘要、证据数量、适用范围、预期改变的编排项、风险和作用域。
- 用户明确确认后，把 candidate patch 复制或移动到 `accepted/`，状态改为 `accepted`。
- 更新 `INDEX.md`：Accepted 增加或更新该 workflow。
- Candidates 是否保留 source candidate 由用户确认的治理策略决定，但索引中必须能找到 accepted workflow patch。
- 用户确认必须明确作用域：本项目、项目个人、用户全局。未明确作用域时先询问。
