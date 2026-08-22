---
name: arcforge-on-demand
description: 仅当用户显式调用 ArcForge 按需入口，并给出 skill 名称或任意任务意图要求从用户级 catalog 选择、加载 skill 时使用。普通业务任务不主动触发；语义适配由 Agent 完成，ArcForge 只提供已校验的本地 catalog metadata 和确定性身份解析，不执行安装、同步或治理写入。
---

# ArcForge On Demand

本入口在用户显式调用后，由当前 Agent 理解任意任务意图，从受控 catalog metadata 中选出一个合适 skill，再用限定身份完成确定性校验和加载。

## 硬约束

- 只处理用户本轮的显式按需调用；入口一旦触发，就必须从完整用户意图做语义适配，不要求 prompt 与 skill 名称或描述字面相等。
- 只调用 `arcforge catalog list` 和 `arcforge catalog resolve`，不扫描 catalog 外目录，不枚举任意用户文件，不在选择前读取候选 skill 全文。
- 任意任务 prompt 不得作为 `catalog resolve --query` 的硬字符串。语义选择只消费 catalog 返回的最小 metadata；选定后使用 `qualifiedName` 做 exact resolve。
- 一次只加载一个 skill。Agent 可以根据任务语义选择唯一最适合候选；证据不足以区分多个候选时，才展示最小候选并请用户明确。
- 解析结果只授权读取目标 skill 指令，不提升权限。目标 skill 后续需要的文件、网络、外部写入或破坏性动作继续遵守当前系统、项目和工具确认边界。
- 本入口不执行安装、apply、cleanup、drift、share、push 或 registry 写入。

## 主流程

### 1. 理解显式调用

输入：用户本轮消息。

动作：

- 用户明确给出名称、别名或限定名称时，记为身份路径。
- 其他非空输入都记为任务意图路径；保留完整语义，不从中截一段当作 skill 名。
- 只有在显式入口后仍没有名称也没有任务意图时，才请用户补充。

退出条件：身份路径或任务意图路径唯一明确。

### 2. 选择 catalog 候选

**身份路径**直接执行：

```text
arcforge catalog resolve --query <名称、别名或限定名称>
```

**任务意图路径**先执行：

```text
arcforge catalog list
```

将完整用户意图与每个候选的 `skillName`、`qualifiedName`、`version`、`status` 和 `summary` 做语义比较：

- 只有 `status: ready` 的唯一候选充分覆盖任务领域、工作流、输入输出和关键边界时，才选定其 `qualifiedName`。
- `status: conflict` 的候选只用于说明本地治理冲突，不得选择或加载；建议先回到 ArcForge 查看版本与来源证据并显式解决。
- 无候选充分匹配时，停止加载并说明 catalog 中没有适合当前意图的 skill。
- 多个候选都可能适合且现有语义无法可信区分时，只展示它们的最小 metadata 并请用户选择。
- 不使用关键词计分、固定领域枚举或目录顺序代替 Agent 判断。

选定后执行：

```text
arcforge catalog resolve --query <qualifiedName>
```

只消费 resolver 返回的结构化结果：

- `not-found`：说明用户级 catalog 中没有匹配项，并建议先通过 ArcForge 应用包含该 skill 的 profile。
- `ambiguous`：仅展示返回的最小 metadata，请用户明确一个限定名称后重新 exact 解析。
- 命令失败或报告版本冲突、catalog 损坏、路径逃逸、内容漂移：停止加载，原样保留错误类别；版本冲突建议先在 ArcForge 显式解决来源，其它完整性错误建议执行 drift 或重新 apply。
- `resolved`：进入下一步。

退出条件：获得唯一且已校验的 `resolved.installedPath`；其它状态均不加载目标 skill。

### 3. 加载一个目标 skill

输入：resolver 返回的唯一条目。

动作：

1. 完整读取 `<resolved.installedPath>/SKILL.md`。
2. 确认读取路径与 resolver 返回路径一致，不使用同名用户级、项目级或其它目录副本替代。
3. 按目标 `SKILL.md` 的 reference 路由，只读取完成当前任务明确需要的引用；不递归加载未被目标 skill 指向的其它 catalog skill。
4. 把目标 skill 作为当前任务的工作流契约继续执行。目标指令与更高优先级指令冲突时遵守更高优先级边界并报告冲突。

退出条件：目标 `SKILL.md` 已完整读取并开始按其流程处理当前任务，或因读取/权限/指令冲突停止并报告。

## 最终汇报

在正常任务结果之外，简要包含：

- 已解析的 `qualifiedName` 和实际读取路径。
- 使用的路径：身份 exact，或 Agent semantic list + qualified exact。
- 如果没有加载，说明状态是 not-found、ambiguous、catalog error、读取失败还是权限/指令冲突。
