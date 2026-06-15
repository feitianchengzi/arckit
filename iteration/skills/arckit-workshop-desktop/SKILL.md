---
name: arckit-workshop-desktop
description: >-
  当 Arckit workflow 需要把 Workshop Desktop 作为本地桌面执行桥时使用：检查应用是否已安装或运行，从 hoewo/workshop-desktop 最新 GitHub Release 安装或更新，打开应用，通过 app server 创建项目/任务/个人记录，列出 Workshop 项目或任务，或通过 Workshop Desktop 桥发送已批准的项目工作。
---

# ArcKit Workshop Desktop

把 Workshop Desktop 作为 Arckit 的桌面执行桥。本 skill 不决定项目范围、Goals、Iterations、Tasks、Reviews、Decisions 或 Roadmap；这些由 `arckit-project-governance-workflow` 处理。只有当已选动作需要 Workshop Desktop 作为本地应用、记录库、任务视图或 Codex dispatch bridge 时，才使用本 skill。

## 边界

- `arckit-project-governance-workflow` 是治理层：决定什么进入 Backlog、Goal、Iteration、Task、Review、Decision 或 Roadmap。
- `arckit-workshop-desktop` 是桌面桥：负责检查、打开、安装、更新、读取、写入记录，以及调用 Workshop Desktop 本地 app server。
- 不要把 Workshop Desktop 记录当作已接受的仓库事实。记录只是面向人的工作材料，直到用户明确提升它，或仓库文档被明确更新并 review。
- 不要直接写 Electron `userData`、`personal-records/` 或 app-server 连接文件。使用随附脚本或 Workshop Desktop 自己的 CLI/app server。
- 不要跨项目复制特定仓库的 `AGENTS.md` 值，例如 project ID 或 project name。创建项目或任务记录时读取目标项目的 `AGENTS.md`。

## 脚本优先

优先使用随附脚本，不手写 shell 命令串：

```bash
node iteration/skills/arckit-workshop-desktop/scripts/workshop-desktop.mjs status
```

脚本是稳定接口，包含安装/更新检测、最新 GitHub Release 查询、app-server 发现和 JSON-RPC 调用。只有需要命令细节或行为边界时，才读取 `references/contract.md`。

只读状态检查默认只运行 `status`，除非用户明确要求进程表检查或 GitHub Release 查询。不要把 `ps`、`pgrep`、`lsof`、`find` 或手动应用目录扫描作为常规验证步骤；它们比脚本契约更嘈杂，也可能触发沙箱或隐私权限。

## 常见流程

### 检查或打开 Workshop Desktop

1. 运行 `status`。
2. 只有当用户询问安装/更新，或批准查询 GitHub Release 时，才运行 `status --check-latest`。这需要网络访问。
3. 如果未安装或有更新，下载或安装前先向用户展示脚本计划。
4. 用户批准后运行 `ensure --yes`。
5. 运行 `open` 启动或聚焦应用。

```bash
node iteration/skills/arckit-workshop-desktop/scripts/workshop-desktop.mjs status --check-latest
node iteration/skills/arckit-workshop-desktop/scripts/workshop-desktop.mjs ensure --yes
node iteration/skills/arckit-workshop-desktop/scripts/workshop-desktop.mjs open
```

`ensure` 从 `https://github.com/hoewo/workshop-desktop/releases/latest` 下载最新匹配安装包。在 macOS 上默认把最新 zip 安装到 `~/Applications`；其他平台下载匹配 asset 并报告本地路径，除非已有自动安装路径实现。

在只读模拟或离线环境中，运行 `status` 后停止，或在 latest-release 查询失败后停止。报告 GitHub Release 查询需要网络权限；不要无限重试。

### 创建记录

记录用于简短的人类交接说明，不用于完整日志。

```bash
node iteration/skills/arckit-workshop-desktop/scripts/workshop-desktop.mjs record create \
  --title "记录标题" \
  --body "结论、影响和下一步。" \
  --scope project \
  --project-id 98 \
  --project-name workshop-desktop \
  --open
```

如果任务由 Workshop Desktop 派发，且存在 `WORKSHOP_DESKTOP_SERVER_PORT` / `WORKSHOP_DESKTOP_SERVER_TOKEN`，脚本会自动使用该受限 token。受限 token 通常只允许 `record.create`。

### 读取项目或任务

用于任务发现，或在治理更新前验证 project ID。

```bash
node iteration/skills/arckit-workshop-desktop/scripts/workshop-desktop.mjs project list
node iteration/skills/arckit-workshop-desktop/scripts/workshop-desktop.mjs task list --project-id 98
```

### 向 Codex 发送工作

仅在治理或任务决策已经确认具体记录/任务，且目标项目在 Workshop Desktop 中有本地目录绑定后使用。

```bash
node iteration/skills/arckit-workshop-desktop/scripts/workshop-desktop.mjs rpc codex.send --params '{"kind":"record","projectId":98,"recordId":"...","title":"...","bodyMarkdown":"..."}'
```

## 失败处理

- 如果 Workshop Desktop 未运行，询问用户是否运行 `ensure --yes` 或 `open`。
- 如果缺少 app server 连接，不要编辑本地应用文件。打开桌面应用后重试。
- 如果 GitHub Release 查询失败，报告网络或 release 错误，并提供 releases URL。
- 如果受限 token 拒绝读取或 dispatch 方法，说明 dispatched-agent 模式通常只允许 `record.create`。
