# 项目本地状态与 Git 忽略

首次接入、开始或恢复会写入本地状态/证据的任务前，使用当前 Ledger manifest 的 `project_state` entrypoint 执行 `prepare-workspace`。命令以目标项目根为 cwd，且独立于 canonical state：没有 Project、存在旧协议或仅需补规则时都可运行。纯读取 snapshot/probe/audit 不改 `.gitignore`。

```sh
node <ledger-root>/scripts/project-state.mjs prepare-workspace
```

`init` CLI 与 ArcOrbit 的 in-process 初始化使用同一个维护函数。ArcOrbit 添加项目、Automation 预检、启动/恢复及 CLI run 的项目准备调用会检查既有项目；不是只有新项目才写入。普通 Chat 不因发送一条消息初始化账本；Agent 在实际使用 Arckit 写入状态或证据前执行此入口。Direct Agent 也使用同一入口，不自行复制规则编辑算法。

## 托管边界

逐项维护项目根 `.gitignore` 的以下区块；首次创建时追加到文件末尾，后续保留区块位置：

```gitignore
# BEGIN Arckit local state and evidence
/arckit/debug/
/arckit/project/
/arckit/cases/
# END Arckit local state and evidence
```

三个目录由用户明确要求作为本地状态和执行证据；spec、interaction、visual、tech 不在本规则范围。逐项匹配明确的目标正向规则（允许省略开头或结尾的 `/`，忽略 Git 允许的行末空格），将区块外的同目标规则归并进区块，区块内重复目标只保留首项，缺失项在 END 标记前补齐。区块内已有其他规则、注释和空行保留；其他路径、通配规则、否定规则不按目标规则处理。保留既有换行和权限，不移动已有区块或重写完整区块；文件缺失时创建，内容已符合时不重写。标记损坏、重复区块、非普通文件或非 UTF-8 输入报错，避免猜测删除范围。

同一真实项目根使用跨进程锁，写入临时文件后替换；替换前重新核对用户内容，发现并发变化则报错重试。锁约束本维护函数的并发调用，外部编辑器不参与锁；不承诺对任意不合作写入提供事务隔离。

存在 Git 工作区时用 `git check-ignore --no-index` 验证实际目录规则，区块之后或子目录的反向规则导致失效时停止项目准备。失败保留已修复的根托管区块，错误提示供检查和重试；不回滚其他文件。非 Git 项目只准备规则，回执为 `not_a_repository`，不自动 `git init`；Git 执行错误不冒充成功。

## 回执、跟踪与提交

回执 `arckit-workspace-preparation/v1` 包含 `changed_files`、`git_status`、`tracked_path_count`、最多 20 条 `tracked_path_sample` 和 `warnings`。ArcOrbit 项目准备回执通过 `workspace_preparation` 携带这些结果。

发现已跟踪文件时报告事实并保留 Git 索引、工作区内容及现有暂存。忽略规则仅保护未跟踪文件，不会取消历史跟踪、撤销已经提交的内容或阻止 `git add -f` / `git update-index`。需要停止已有跟踪时，单独确认迁移范围并保留本地文件；不能将补规则报告成已完成迁移。

授权 Git 交付时检查实际提交范围，包括已有暂存和临时索引；三个目录内的本地数据不作为交付文件，不使用强制暂存绕过忽略。取消历史跟踪的删除变更需有明确迁移授权。本维护入口不安装 hook、不修改索引、不创建 commit，也不承诺阻止外部工具强制提交。

证据输出复用 [case-evidence.md](case-evidence.md)。归档、Git 排除和跨机器交接是不同结果：Project/Case 全部忽略后，新 clone 不含本地推进状态；跨机器恢复应显式转交所需状态及可访问证据，不能声称 Git 已完成备份。既有被引用证据不随忽略配置自动迁移或删除。

## 验证与生效

维护实现后验证真实 Git 行为、重复执行、缺失恢复、手动规则、嵌套覆盖、已有跟踪、并发、非 Git 项目及初始化/协议恢复入口。只修改维护源不会更新已安装应用或 skill；由构建与分发流程将 Ledger 包和 Runtime 接入一起交付。旧项目在更新后的准备入口执行时修复，也可从维护源显式运行上述命令。
