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
  projects/
    <project-fingerprint>/
      INDEX.md
      signals/
      candidates/
      accepted/
```

项目指纹优先使用 Git root + remote URL。没有 Git 信息时，使用项目绝对路径的稳定标识；无法稳定计算时，用路径 slug，并在 signal 中标记 `fingerprint_confidence: low`。

## Memory Check 细节

- 如果 memory root 不存在且当前工具权限允许写入，直接初始化基础目录和 `INDEX.md`。
- 如果 memory root 不存在但当前工具权限不允许写入，返回 `bootstrap_required: true` 和 `write_permission: needs_permission|unavailable`，不要把它当作“无须沉淀”。
- 读取相关 `INDEX.md` 的文件内容，并把索引中与当前 `scenario`、路径、错误类型或用户意图可能匹配的 candidate/accepted workflow patches 作为首批候选。
- 如果 `INDEX.md` 不存在、为空、没有列出 candidate/accepted，或索引条目与磁盘文件明显不一致，扫描 `accepted/` 和 `candidates/` 目录兜底；只打开可能匹配的文件，并记录 `index_status: missing|stale|incomplete|current`。
- 无目录、无权限或无匹配时，不阻塞任务，返回 `workflow_memory_status`。

## Signal Decision 细节

每次 Arckit 任务结束、阻塞或失败时都必须做 signal decision，但不一定写 signal。Signal 是学习样本，不是任务流水账。

`signal_decision.action` 只能是：

- `write_signal`
- `update_candidate_only`
- `skip`

写 signal 的条件：

- 用户纠正了 agent 的流程、确认点、输出格式或工具边界。
- 任务失败、阻塞、返工、回滚或验证不通过。
- 出现新的任务形态、输入形态、skill 组合或停止条件。
- 现有 candidate/accepted workflow patch 不适配，或需要收窄适用边界。
- 本次验证了 candidate 的关键假设，并且该证据需要保留完整上下文。
- 出现新的风险、权限边界、索引漂移、事实源边界或候选提升判断。
- 本轮发现某个 workflow patch 应该改变 future workflow frame 的步骤、artifact scan、reflection gate、确认点或验证强度。

只更新 candidate 的条件：

- 命中已有 candidate。
- 本次正常成功，没有用户纠偏、失败、分歧或新增模式。
- 只需要增加轻量验证信息，例如 `match_count`、`success_count`、`last_matched_at`、`last_outcome` 或 `last_match_summary`。

跳过的条件：

- 命中 accepted workflow patch。
- 本次完全按预期成功。
- 没有用户纠偏、失败、分歧、新风险、新工具边界或新增模式。

执行规则：

- `write_signal` 时，把本次 signal 加入当前会话的 `pending_signal_buffer`。
- `write_signal` 时，如果无法写入文件，也要在对话状态中保留 signal id、scenario、source_task、project_root、skills_used、outcome 和 reusable_pattern_hint，供 candidate maintenance 使用。
- `write_signal` 时，当前工具支持请求提升权限，且用户没有明确禁止外部 workflow memory 时，在业务任务验证完成后请求权限写入 signal；不要因为“首次初始化”额外请求产品确认。
- `write_signal` 时，signal 文件写入成功后必须同步更新对应 `INDEX.md` 的 Recent Signals；如果 signal 可写但 index 不可写，本轮不能只报告 `workflow_signal_written`，还必须输出 `workflow_index_pending_write` 或 `workflow_index_blocked`。
- `update_candidate_only` 时，不创建伪 signal，不把轻量命中写入 Recent Signals。
- `skip` 时，不写 signal、不更新 candidate、不更新 index，但必须输出 skip reason。

## Candidate Maintenance 细节

候选形成条件：

- 至少两个相似 signals 指向同一任务模式或同一种 workflow frame 改写方式，无论这些 signals 已写入文件还是处于 pending write。
- 一个 signal 加上明确用户纠偏，且该纠偏是流程级而非一次性业务要求。
- 已存在 candidate，本轮 signal 提供了新的成功/失败证据。
- 已存在 candidate，本轮只有正常成功命中时，可以不写 signal，只做 candidate match update。

相似性至少比较：

- `scenario`
- 主要 skill 链
- 任务输入形态
- 失败/验证形态
- artifact targets
- artifact impact scan
- reflection gates
- workflow patch shape
- reusable pattern hint

名称、fixture 路径或具体函数名不同不应阻止相似匹配。

维护规则：

- 相似 signals 数量小于 2 时，输出 `workflow_candidate_update: none`，并说明当前 signal buffer 数量。
- 相似 signals 数量大于等于 2 时，即使它们尚未落盘，也必须维护 candidate。
- 新 candidate 使用 `status: candidate`。
- 更新 candidate 时保留 evidence refs，不覆盖历史证据。
- Candidate match update 可以只维护 `match_count`、`success_count`、`failure_count`、`last_matched_at`、`last_outcome` 和 `last_match_summary`；没有完整 signal 时不要伪造 `evidence_refs`。
- Candidate patch 应描述适用边界、对 workflow frame 的改写、skill 组合、确认点、artifact scan、reflection gates、失败模式和停止条件。
- candidate 文件创建或更新成功后必须同步更新对应 `INDEX.md` 的 Candidates。
- Candidate patch 不能自动变成 accepted。

## Index Maintenance

`INDEX.md` 是导航索引，不是可选装饰。

- Memory check 必须读取相关 `INDEX.md` 内容。
- 写入或更新 signal 后，更新 Recent Signals。
- 写入或更新 candidate 后，更新 Candidates。
- 写入 accepted workflow patch 后，更新 Accepted。
- 如果索引缺失或不含已存在 workflow 文件，收口时应补齐索引条目。
- 如果 YAML 文件可写但 index 不可写，输出 `workflow_index_pending_write`。
- 如果用户明确禁止维护索引，输出 `workflow_index_blocked`。

## Acceptance 细节

- 向用户展示 candidate patch 摘要、证据数量、适用范围、预期改变的编排项、风险和作用域。
- 用户明确确认后，把 candidate patch 复制或移动到 `accepted/`，状态改为 `accepted`。
- 更新 `INDEX.md`：Accepted 增加或更新该 workflow。
- Candidates 是否保留 source candidate 由用户确认的治理策略决定，但索引中必须能找到 accepted workflow patch。
- 用户确认必须明确作用域：本项目、项目个人、用户全局。未明确作用域时先询问。
