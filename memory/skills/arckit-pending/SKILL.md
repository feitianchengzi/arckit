---
name: arckit-pending
description: 管理目标项目 arckit/pending 工作区中的项目级未决讨论项。当用户想新增、列出、读取、更新、删除、归档、恢复或提升 pending issues、讨论分支、延后想法、开放问题、过程 skill handoff，或 agent 协作过程中捕获但尚未决定的项目上下文时使用。
---

# ArcKit Pending

使用本 skill 维护 agent 协作过程中出现、但还不适合成为正式 spec、interaction 文档、technical solution、iteration task 或 implementation change 的未决项目上下文。

## Scope

受管理产物位于目标项目的 Arckit 工作区：

```text
<project-root>/arckit/pending/
```

## Usage

当用户想保存或管理以下内容时使用本 skill：

- agent 对话中出现但尚未决定的想法。
- 需要日后重访的项目级开放问题。
- 尚未成为需求的可能改进、风险或方向。
- 需要暂停、但不应污染正式文档的讨论分支。
- 过程 skill 产出的 handoff、草案、候选方案、假设、风险或待验证项，暂时不能写入正式事实源，但需要跨回合复用。
- 未来可能提升到 `arckit/spec/`、`arckit/interaction/`、`arckit/visual/`、`arckit/tech/`、迭代计划或实现工作的 pending item。

不要把 pending items 当成已承诺 backlog tasks。它们在被明确提升或关闭前，都是未解决的项目上下文。

## Workspace Layout

缺失时创建工作区：

```text
arckit/pending/
  INDEX.md
  items/
    YYYY-MM-DD-short-slug.md
  archive/
    YYYY-MM-DD-short-slug.md
```

活跃 items 放在 `items/`。closed、rejected、merged 或 stale items 移入 `archive/`，除非用户明确要求删除。

## Item 格式

每个 item 是一个 Markdown 文件。使用以下结构，让未来 agent 能恢复讨论状态，同时不会把 item 当成已承诺工作：

```markdown
# 简短 Pending Item 标题

## Status

- State: parked
- Type: workflow
- Source: agent 对话
- Created: YYYY-MM-DD
- Updated: YYYY-MM-DD
- Decision: 仅记录，暂不执行

## Background

该 pending item 为什么存在。

## Pending Item

未解决的想法、问题、方向、可能性或讨论分支。

## Current Judgment

当前判断，包括为什么现在还不执行。

## Process Handoff

仅当 Type 为 `process_handoff` 时使用。普通 pending item 可省略本节。

- Kind:
- Source Skill:
- Target Candidate Skills:
- Source Refs:

### Accepted Facts

- 可被结果 skill 作为候选事实评估的内容。

### Assumptions

- 尚未确认的假设。

### Gaps

- 缺口、开放问题或待补证据。

### Risks

- 主要风险。

### Rejected Items

- 已比较但暂不采纳的候选项。

### Suggested Next

- 建议后续进入的 skill、验证动作或用户决策。

## Revisit When

- 条件 1
- 条件 2

## Related Areas

- `path/or/module`

## Notes

- 后续讨论更新。

## Outcome

提升、合并或关闭后填写。
```

有效 `State` 值：

- `open`：仍未解决。
- `parked`：记录待以后处理，当前无动作。
- `watching`：需要观察相关信号后再决定。
- `candidate`：条件满足后可能成为已承诺工作。
- `promoted`：已进入正式 artifact 或 task。
- `merged`：已合并到另一个 pending item。
- `closed`：已明确放弃。

使用 `Type` 保持不同 pending items 可检索。优先使用：

- `product`
- `workflow`
- `tool`
- `agent`
- `technical`
- `content`
- `operation`
- `process_handoff`

`Decision` 表示当前判断，不表示生命周期状态。例如：`仅记录，暂不执行`、`等待重复手动使用后再判断`、`工作流稳定后再提升`。

## Process Handoff Items

`process_handoff` 用于保存过程 skill 的中间产物。它是临时停车位，不是新的 source of truth。

使用条件：

- 用户要求“先保存草案/候选/分析，后面再决定”。
- 过程 skill 输出需要跨回合复用。
- handoff 中包含未确认假设、风险、缺口或多个候选方案，不能直接写入结果事实源。
- 后续可能提升到 `arckit/spec`、`arckit/interaction`、`arckit/visual`、`arckit/tech`、治理计划或实现工作。

保存规则：

- `Accepted Facts` 只放下游结果 skill 可以考虑入库的候选事实。
- `Assumptions`、`Gaps`、`Risks`、`Rejected Items` 不得在提升时静默写成事实。
- `Source Refs` 尽量引用 intake、用户输入、已有 `arckit/*` 文档、外部来源或生成该 handoff 的过程 skill。
- `Suggested Next` 只是建议，不绕过下游 skill 的触发边界和入库规则。

## Index Format

维护 `arckit/pending/INDEX.md` 作为导航入口：

```markdown
# Pending

agent 协作过程中捕获的项目级未决事项。

| Item | State | Type | Updated | Summary | Revisit When |
|---|---|---|---:|---|---|
| [简短 Pending Item 标题](items/YYYY-MM-DD-short-slug.md) | parked | workflow | YYYY-MM-DD | 一句话摘要。 | 重访条件。 |

## Archived

| Item | State | Type | Updated | Outcome |
|---|---|---|---:|---|
| [已关闭事项](archive/YYYY-MM-DD-closed-item.md) | closed | workflow | YYYY-MM-DD | 一句话结果。 |
```

## Workflow

1. 定位目标项目根目录。优先使用用户当前项目根；不明确时，写入前做简短澄清。
2. 确保 `arckit/pending/INDEX.md`、`items/` 和 `archive/` 存在。
3. 新增时，每个未决主题创建一个聚焦 item。重要时保留用户原话，再添加简洁结构化摘要。
4. 列表或查询时，先读 `INDEX.md`，再只打开相关 item 文件。
5. 更新时，编辑 item 文件，刷新 `Updated`，并同步 `INDEX.md`。
6. 删除请求中，如果 item 包含有意义的项目上下文，先澄清用户是要硬删除还是归档。用户明确要求硬删除时，删除文件和 index 行。
7. 归档、关闭、合并或提升时，移动 item 到 `archive/` 或更新其状态，然后在 `Decision` 和 `Outcome` 中记录决策或目标 artifact。

## Promotion Rules

只有当用户要求，或对话已经明确把 pending item 变成已承诺 artifact 时，才提升它：

- 产品行为或需求：移入 `arckit/spec/`。
- 交互流程或线框问题：移入 `arckit/interaction/`。
- 视觉系统或 UI 风格问题：移入 `arckit/visual/`。
- 技术架构或数据契约：移入 `arckit/tech/`。
- 执行时机或优先级：移入迭代计划。
- 实现细节：通过相关 engineering workflow 处理。
- `process_handoff`：根据 `Target Candidate Skills` 和 `Suggested Next` 进入对应过程、结果、治理或实现 workflow；提升时只携带已确认内容和必要来源。

提升时，归档前在 pending item 中留下简短痕迹：

```markdown
## Outcome

已于 YYYY-MM-DD 提升到 `../spec/path/to/file.md`。
```

## Output Contract

报告变更时包含：

- `path`：被触及的 pending index 或 item 路径。
- `summary`：一句话说明变更。
- `state`：当前 item 状态。
- `revisit_when`：如有，说明下次重访条件。
