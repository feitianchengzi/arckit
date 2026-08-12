---
name: arckit-pending
description: 仅当用户显式要求使用 arckit-pending，或手动把未决讨论、开放问题、假设、风险和候选方向记录、查询、更新、归档到 arckit/pending/ 时使用。它不由 Runtime、using-arckit 或其他 skill 自动调用，也不替代 active Case 中推进当前工作的 gaps、open_questions 和 pending_handoffs。
---

# ArcKit Pending

手动维护目标项目中有复用价值、但尚不适合成为稳定事实或已承诺工作的未决上下文。

## 硬边界

- 仅在用户本轮显式调用或明确点名 `arckit/pending/` 时工作，不从普通对话或其他 skill 输出中自动捕获内容。
- 写入范围限于目标项目的 `arckit/pending/`；查询模式不得修改文件。
- pending item 不是 backlog、Case gap、正式规格、技术事实或执行承诺。
- active Case 正在推进的问题继续由 ledger 管理；本 skill 不搬移、不关闭、不改写 Case/Project State。
- 提升、归档和硬删除都需要用户明确意图；有价值内容优先归档，硬删除前再次确认具体路径。
- 不声明 Runtime capability，不参与 capability policy，也不建立隐式 skill-to-skill 依赖。

## 工作流

### 1. 确认目标和意图

输入：用户请求、当前工作区和可选 item 线索。

动作：定位目标项目根目录，判断本轮是查询、新增、更新、归档、合并、提升还是硬删除。项目根或写入意图不明确且会影响落点时，先做最小澄清。

退出条件：目标根、操作类型和候选路径明确。

### 2. 读取最小上下文

输入：`arckit/pending/INDEX.md` 和目标 item。

动作：查询或变更都先读 INDEX；仅打开与本轮主题相关的 item。工作区不存在时，只有在已确认写入操作中才创建。

退出条件：已确认同主题 item 是否存在，以及本轮应新建、更新还是合并。

### 3. 维护 item

输入：用户确认的未决内容和已读取上下文。

动作：需要创建或修改时读取 [references/item-format.md](references/item-format.md)，按其中的目录、状态、类型和字段约定操作。区分已接受事实、假设、缺口、风险与候选下一步，不把未确认内容改写成事实。

退出条件：item 内容聚焦、状态准确、来源与重访条件可恢复。

### 4. 同步索引和生命周期

输入：变更后的 item。

动作：同步 `INDEX.md` 的路径、状态、类型、更新时间、摘要和重访条件。归档时移动到 `archive/`；合并、关闭或提升时记录 Outcome。提升只携带用户已确认的内容，并由对应事实维护或执行流程独立判断是否接收。

退出条件：INDEX 与文件位置、状态一致，没有把建议伪装成承诺。

### 5. 校验并汇报

输入：本轮触及的 pending 文件。

动作：检查 Markdown 链接、索引路径、日期、状态和 Outcome 一致性；报告实际变更与仍未决定的内容。查询模式明确说明未写入。

退出条件：用户能知道记录在哪里、当前状态是什么、何时应重访。

## Reference 路由

- 创建、更新、归档、合并或提升 item 时读取 [references/item-format.md](references/item-format.md)。
- 只查询 INDEX 或定位 item 时不需要读取 reference。

## 最终汇报字段

- `path`：触及或查询的 pending index/item 路径。
- `summary`：一句话说明本轮结果。
- `state`：item 当前状态；仅查询集合时可省略。
- `revisit_when`：重访条件；没有时明确写无。
- `write_status`：`changed` 或 `read-only`。
