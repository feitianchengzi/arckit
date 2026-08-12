# Pending 工作区与 Item 格式

在创建、更新、归档、合并或提升 pending item 时读取本文件。

## 工作区

```text
arckit/pending/
  INDEX.md
  items/
    YYYY-MM-DD-short-slug.md
  archive/
    YYYY-MM-DD-short-slug.md
```

活跃 item 放在 `items/`。`closed`、`rejected`、`merged` 或 `stale` 内容移入 `archive/`，除非用户明确要求硬删除。

## 状态与类型

有效 `State`：

- `open`：仍未解决。
- `parked`：已记录，当前无动作。
- `watching`：等待相关信号。
- `candidate`：条件满足后可能成为已承诺工作。
- `promoted`：已进入正式 artifact 或 task。
- `merged`：已并入另一个 pending item。
- `closed`：已明确放弃。

优先使用的 `Type`：`product`、`workflow`、`tool`、`agent`、`technical`、`content`、`operation`、`process_handoff`。

`Decision` 表示当前判断，不等于生命周期状态，例如“仅记录，暂不执行”或“等待补充证据”。

## Item 模板

```markdown
# 简短标题

## Status

- State: parked
- Type: workflow
- Source: 用户对话或具体路径
- Created: YYYY-MM-DD
- Updated: YYYY-MM-DD
- Decision: 仅记录，暂不执行

## Background

该 item 为什么存在。

## Pending Item

尚未解决的想法、问题、方向或讨论分支。

## Current Judgment

当前判断，以及为什么现在不执行或不能进入稳定事实源。

## Evidence and Uncertainty

### Accepted Facts

- 已由用户或可信来源确认的事实。

### Assumptions

- 尚未确认的假设。

### Gaps

- 开放问题和待补证据。

### Risks

- 主要风险。

## Revisit When

- 可观察、可判断的重访条件。

## Related Areas

- `path/or/module`

## Notes

- 后续讨论更新。

## Outcome

提升、合并或关闭后填写。
```

`process_handoff` 可按需增加来源 skill、候选接收能力、来源引用、已拒绝候选和建议下一步。建议不自动触发接收方；提升时仅携带已确认内容。

## INDEX 格式

```markdown
# Pending

手动记录的项目级未决上下文；不代表 backlog 或执行承诺。

| Item | State | Type | Updated | Summary | Revisit When |
|---|---|---|---:|---|---|
| [简短标题](items/YYYY-MM-DD-short-slug.md) | parked | workflow | YYYY-MM-DD | 一句话摘要。 | 重访条件。 |

## Archived

| Item | State | Type | Updated | Outcome |
|---|---|---|---:|---|
| [已关闭事项](archive/YYYY-MM-DD-closed-item.md) | closed | workflow | YYYY-MM-DD | 一句话结果。 |
```

## 生命周期规则

- 新增：一个主题一个 item；保留必要原话并添加结构化摘要。
- 更新：刷新 `Updated`，同步 INDEX，不重写来源事实。
- 归档：移动文件并更新 Archived 表。
- 合并：目标 item 保留合并来源，原 item 标为 `merged` 并写 Outcome。
- 提升：先写清目标 artifact/task 和日期；接收方独立判断，未确认内容继续留在 pending。
- 硬删除：仅删除用户再次确认的具体路径，并同步 INDEX。
