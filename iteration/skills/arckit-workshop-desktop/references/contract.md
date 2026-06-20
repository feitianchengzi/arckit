# Workshop Desktop 桥接契约

桥接脚本为：

```bash
node iteration/skills/arckit-workshop-desktop/scripts/workshop-desktop.mjs <command>
```

## 命令

- `status [--check-latest] [--json]`：报告平台、已安装应用、app-server 可用性，并可选检查最新 GitHub Release。`--check-latest` 需要网络访问。
- `verify [--json]`：在 macOS 上验证已安装 `.app` 的代码签名和 Gatekeeper 接受状态；其它平台可跳过或返回已跳过。
- `ensure [--yes] [--json]`：检查最新 release，并在明确批准后安装或更新。没有 `--yes` 时，只打印计划动作并退出，不下载。
- `open`：尽可能使用已安装应用路径打开 Workshop Desktop。
- `record create --title ... --body ... --scope none|project|task [--project-id N] [--project-name X] [--task-id N] [--task-title X] [--open]`：通过本地 app server 创建记录。
- `project list`：调用 `project.list`。
- `task list --project-id N [--state pending,completed]`：调用 `task.list`。
- `rpc <method> --params '{...}'`：直接调用支持的 JSON-RPC 方法。

## 只读状态边界

普通只读检查时，`status` 就是完整契约。它会报告应用是否能在支持的安装位置被发现，以及本地 app-server 连接文件是否可读。除非用户明确要求底层诊断，否则不要额外使用进程表命令（`ps`、`pgrep`）、socket 扫描（`lsof`）或手动文件系统扫查。在受限 agent 环境中，这类检查通常需要额外权限，并且不会改变默认下一步。

## Release 来源

安装和更新使用以下地址的最新 release：

```text
https://api.github.com/repos/hoewo/workshop-desktop/releases/latest
```

安装包选择按平台处理：

- macOS：优先选择包含 `mac` 和当前架构的 zip。
- Windows：选择 `.exe`，优先非 portable 安装包名称。
- Linux：优先 `.AppImage`，其次 `.deb`。

如果网络访问失败，报告错误并停止。不要循环重试。脚本本身有网络超时边界，但 agent 仍应把查询最新 release 视为在受限环境中可能需要用户批准的操作。

## macOS 安装完整性

macOS `.app` bundle 必须用 `ditto` 复制或解压，不能用普通递归复制实现。Electron `.framework` 内部依赖相对符号链接；如果复制过程把这些链接解析为指向 staging 或临时目录的绝对路径，`codesign` 会报告 `unsealed contents present in the root directory of an embedded framework`，Gatekeeper 会把应用显示为 damaged。

`ensure --yes` 在 macOS zip 安装路径中必须：

1. 用 `ditto -x -k` 解压 release zip 到临时 staging 目录。
2. 用 `ditto <staging app> <target app>` 复制到应用目录，保留符号链接、扩展属性和 bundle 结构。
3. 在替换正式目标前校验 staging app 的 `codesign --verify --deep --strict --verbose=4`。
4. 安装完成后返回 `verify` 结果；如果 `codesign` 或 `spctl --assess --type execute --verbose=4` 失败，命令必须失败，不得报告安装成功。

当用户报告 `is damaged and can't be opened` 时，优先运行 `verify` 或上述底层命令，并检查 `Contents/Frameworks/Electron Framework.framework` 根目录下的符号链接是否仍指向 `Versions/Current/...`。

## Token 边界

当存在 `WORKSHOP_DESKTOP_SERVER_PORT` 和 `WORKSHOP_DESKTOP_SERVER_TOKEN` 时，脚本优先使用它们。这是受限 dispatched-agent 路径，通常只允许 `record.create`。

没有这些环境变量时，脚本会从 Workshop Desktop 用户数据目录读取常规 app-server 连接文件。

不要直接编辑连接文件或 `personal-records/`。
