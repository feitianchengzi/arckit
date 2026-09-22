# YYLO Ledger 命令参考

`yy ledger` 是 YYLO Ledger 的统一入口（YYLO 0.2.2 对应 `yylo-ledger 0.2.0` 任务面；`yy kanban` 是同一控制器路由的兼容别名）。以已安装版本的 `yy ledger --help` 为准。

## 任务生命周期

**CREATE** — 新建任务：

```bash
yy ledger create "Task description here" --status backlog --tags feature,backend
```

选项：`--status`（backlog|todo|in_progress|done）、`--tags`（逗号/空格分隔）、`--blocked-by`（任务 ID）、`--related-tasks`（任务 ID）。

**LIST** — 分桶浏览：

```bash
yy ledger list --limit 5 --sort asc
yy ledger list --status todo,in_progress --limit 10
```

**SEARCH** — 条件检索：

```bash
yy ledger search --status todo --tag backend --limit 10
yy ledger search --body "OAuth" --open
yy ledger search --commit abc123
```

过滤器：`--status`、`--tag`、`--body`、`--response`、`--commit`、`--open`（无 agent_response）、`--recent`、`--exclude`。

**GET** — 任务全量详情（含依赖与关联任务解析）：

```bash
yy ledger get TASK_ID
```

**MARK** — 状态流转（必须带说明）：

```bash
yy ledger mark in_progress --id TASK_ID --response "Starting work on this"
yy ledger mark done --id TASK_ID --response "Completed: implemented X, tested Y" --commit abc123def
yy ledger mark todo --id TASK_ID --response "Reopening: found regression"
```

必填：`--id`、`--response`；推荐 `--commit`（done 时）。

**UPDATE** — 修改字段：

```bash
yy ledger update TASK_ID --status todo --tags backend,urgent
yy ledger update TASK_ID --commit abc123def
```

**ARCHIVE** — 软删除（保留数据，状态置 archive）：

```bash
yy ledger archive TASK_ID
```

## 依赖与顺序

**DEPS** — 查看/增删依赖：

```bash
yy ledger deps TASK_ID                                  # 阻塞方/被依赖方/优先级
yy ledger deps add --id TASK_ID --blocked-by B1 B2      # TASK_ID 需等 B1、B2 完成
yy ledger deps remove --id TASK_ID --blocked-by B1
```

环状依赖自动检测。

**READY** — 所有阻塞已满足、可安全开始的任务：

```bash
yy ledger ready
yy ledger ready --tag backend --limit 5
```

**ORDER** — 尊重依赖的拓扑排序（并行执行规划）：

```bash
yy ledger order
yy ledger order --scores
```

## 正文内联标记

任务正文中可直接声明依赖与关联，创建/更新时自动解析：

```text
[blocked_by]TASK_ID[/blocked_by]        — 本任务被 TASK_ID 阻塞
[blocked_by]ID1, ID2[/blocked_by]       — 多个阻塞
[task_id]RELATED_ID[/task_id]           — 关联任务
[task_id]ID1 ID2[/task_id]              — 多个关联
```

## 冷归档

常规 `list`/`search`/`ready`/`order` 刻意只覆盖热区；`get TASK_ID` 透明解析热任务或只读归档任务；`history TASK_ID` 显式读取其台账。冷检索用有界投影：

```bash
yy ledger archive-search --tag backend --before 2026-01-01 --limit 20 --projection metadata
```

归档包维护（需所有者显式授权，报告写入仓库外持久路径）：

```bash
yy ledger --version
yy ledger archive-pack plan --status done,archive --older-than 90d \
  --max-tasks 1000 --target-bytes 26214400 --hard-max-bytes 47185920 \
  --report /external/receipts/archive-plan.json
# 独立复核所选 ID、revision、源 HEAD 与计划哈希后，再单独授权：
yy ledger archive-pack create --plan /external/receipts/archive-plan.json \
  --report /external/receipts/archive-create.json
yy ledger archive-pack doctor
yy ledger doctor
```

计划过期或任务/工作区冲突必须失败关闭：丢弃计划、解决冲突、重新 plan。禁止自动化归档、手工编辑包/清单、恢复已归档 ID；后续工作新建热任务并关联原 ID。

## 多目录合并（merge）

任务散落多个子目录时，先产出并复核确定性计划，再应用并保留回执：

```bash
yy ledger merge ./sub1/.juno_task ./sub2/.juno_task --into ./.juno_task \
  --dry-run --plan-file /external/ledger-merge-plan.json
yy ledger merge ./sub1/.juno_task ./sub2/.juno_task --into ./.juno_task \
  --apply-plan /external/ledger-merge-plan.json \
  --receipt-file /external/ledger-merge-receipt.json
```

## 输出格式与环境变量

- 所有命令支持 `-f json|ndjson|table|xml`（默认 ndjson）、`--raw` 紧凑输出、`-p` 美化。
- `JUNO_TASK_ROOT`：显式控制器/任务存储根；`JUNO_WORKSPACE_ROLE`：controller/task/integration-owner；`JUNO_WORKSPACE_ENFORCEMENT`：off/warn/strict；`JUNO_DEBUG`/`JUNO_VERBOSE`：诊断输出。
- 跨项目路由默认关闭：需源项目 `.juno_task/config.json` 设置 `kanbanRegistry.enabled: true` 与 `allowedProjects`（环境变量 `YYLO_LEDGER_REGISTRY_ENABLED` / `YYLO_LEDGER_REGISTRY_ALLOWED_PROJECTS`），`yy ledger project add ALIAS --path /abs` 注册后用 `--project ALIAS` 路由；路由失败绝不回退到源看板。

## 最佳实践

1. 任务粒度：一轮迭代可完成、不填满上下文窗口。
2. 状态流：backlog → todo → in_progress → done（放弃走 archive）。
3. `mark` 必带 `--response`：做了什么、怎么验证的。
4. done 时用 `--commit` 关联 git 历史，后续 `update --commit` 补充。
5. 开始工作前先 `ready`；并行规划用 `order --scores`。
6. 创建有依赖的任务时优先用正文 `[blocked_by]` 标记。
7. 变更前先读（get/list），变更后核对回执；绝不绕过 CLI 直接编辑状态文件。

---

来源：适配自 [yylo-dev/yylo-skills](https://github.com/yylo-dev/yylo-skills) 的 `skills/ledger-tasks-yylo`（MIT）。
