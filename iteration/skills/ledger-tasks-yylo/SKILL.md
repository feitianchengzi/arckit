---
name: ledger-tasks-yylo
description: 当用户明确要求用 YYLO Ledger（`yy ledger`）管理任务看板、任务状态流转、依赖阻塞、就绪队列或执行顺序时使用：create/list/search/get/mark/update/archive、deps、ready、order 及冷归档检索。仅在项目已安装并选择 YYLO Ledger 作为任务层时触发；普通 Git 提交、项目规格或 Case 流程不触发本 skill；未安装或版本不支持所需命令时先预检并如实报告，不猜测命令、不直接编辑 `.juno_task` 状态文件、不负责 YYLO 安装或发布授权。
---

# Ledger Tasks (YYLO)

YYLO Ledger 是 git 原生的任务与看板状态层：任务、状态、依赖与顺序都以仓库内可审计的事实保存，由 `yy ledger` CLI 统一读写。本 skill 把该工作流收敛到明确边界内：先读当前状态再变更、变更必须带说明与回执、绝不绕过 CLI 直接改文件，让“哪些任务在推进、被什么阻塞、下一步能安全做什么”成为 Agent 可独立恢复的项目事实。

## 使用边界

- 只通过 `yy ledger` 命令操作任务；不得直接创建、编辑或追加 `.juno_task` 下的任务状态文件。
- 写操作前先读当前状态（`get`/`list`/`search`），写操作后核对输出回执；`mark` 必须携带 `--response` 说明本轮做了什么、如何验证。
- 只处理任务域：任务生命周期、依赖、顺序、合并与归档。不负责 YYLO 安装、Git 分支策略、代码实现或发布授权。
- 命令面以已安装版本的 `yy ledger --help` 为准；未提供的命名空间（record/wiki/workflow/artifact）不主动宣传或调用。
- 冷归档维护（archive-pack）是高影响操作：必须先获得所有者显式授权，仓库与索引干净，报告写入仓库外的持久路径；缺一即停。
- 任务正常发现范围仅限热区（hot-only）；冷归档任务只能通过显式的 `archive-search`/`history` 检索。

## 模式选择

- `browse`：只读浏览与规划 —— `list`、`search`、`ready`、`order`。
- `task-lifecycle`：单任务生命周期 —— `create`、`get`、`update`、`mark`、`archive`。
- `dependency-mgmt`：依赖维护 —— `deps`、`deps add/remove`、正文 `[blocked_by]` / `[task_id]` 标记。
- `archive-maintenance`：冷归档检索与（授权后的）归档包维护。

## 入口授权门禁

1. 预检：`yy ledger --version` 与 `--help`，确认当前版本提供的命令面。
2. 只读命令（`browse` 模式）可直接执行；任何写命令需要用户本轮明确要求或确认此前的具体操作。
3. `archive-maintenance` 中的 pack 类操作：先 `plan`、独立复核计划、再单独授权 `create`；计划过期或工作区冲突时丢弃计划重新规划，绝不强制应用。

## Reference 路由

- 全量命令、参数、输出格式与环境变量：读 [references/command-reference.md](references/command-reference.md)。

## 操作协议

### 浏览与队列规划（browse）

- 用 `list --status` 分桶查看，用 `search` 按标签/正文/commit 过滤。
- 开始工作前先 `ready` 找出未被阻塞的任务；用 `order --scores` 得到尊重依赖的并行执行顺序。
- 只输出事实与建议，不替用户选择任务。

### 任务生命周期（task-lifecycle）

- 任务粒度以“一轮可完成、不撑爆上下文”为准；状态流 backlog → todo → in_progress → done（放弃走 archive）。
- `create` 时可用 `--blocked-by`、`--tags` 直接建立关系；`mark done` 推荐带 `--commit` 关联 git 历史。
- 重开任务用 `mark todo` 并说明回归原因；`update` 可补 `--response` 与 `--commit`。

### 依赖维护（dependency-mgmt）

- `deps TASK_ID` 查看阻塞方/被依赖方与优先级；`deps add/remove` 增删阻塞。
- 环状依赖由 CLI 自动检测拦截；不要试图绕过。
- 正文标记 `[blocked_by]ID[/blocked_by]`、`[task_id]ID[/task_id]` 在创建/更新时自动解析，优先在创建时声明。

### 冷归档（archive-maintenance）

- 检索用 `archive-search --projection metadata` 的有界输出；`get`/`history` 可显式读取归档任务。
- pack 维护严格走 plan → 复核 → 授权 create 的顺序；报告路径必须在仓库外；禁止自动化归档、禁止手工编辑包与清单、禁止恢复已归档 ID —— 后续工作应建新的热任务并关联原 ID。

## 最终汇报

- 本轮选择的模式与涉及的任务 ID。
- 状态/依赖发生的实际变化（before → after），以及对应回执或 commit 关联。
- 队列规划结论：当前可安全开始的任务与阻塞原因。
- 未执行的操作及原因（等待授权、计划过期、版本不支持等）。
