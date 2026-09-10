# Release 本地能力架构

## 分层与复用

Release Coordinator 属于 Desktop 应用层，消费现有 Catalog/Workspace Control、账号作用域、ChatCoordinator 和 Codex adapter。TerminalService、RepositoryService、WorkspaceFiles、TaskService 不依赖 Renderer，也不进入 Automation Kernel。UI 命令和场景动态工具调用同一服务。项目身份由主进程解析，Renderer 不能通过任意路径冒充已绑定项目。

## 第三方依赖

终端采用 @xterm/xterm、fit/search/web-links/serialize addon 与 node-pty；Git 采用本机原生 Git 和 simple-git；编辑和 Diff 采用 monaco-editor。Lazygit 是真实 PTY 中的高级 Git 交互入口。前端依赖使用独立 ESM 构建，资源随包交付；Monaco worker 使用受控打包资源。依赖版本和许可证声明随根 lockfile 与 THIRD_PARTY_NOTICES 管理。

## 身份与状态

project_id 是远端已有项目，workspace 是已授权目录，repository root 与 git common directory 来自 Git 自身。会话固定 account scope、project、workspace 和 thread；绑定改变时旧会话不被迁移。记录按场景/项目分区，目录名使用稳定摘要。会话、任务和终端 ID 由服务生成，所有读写复核归属。

Terminal 输出使用独立增量事件及有界环形缓冲，不进入全量 Desktop Store。终端宿主拥有进程、输入、resize 与 exit 生命周期，主窗口只是订阅者。进程流量使用批次和上限控制。执行上下文与 PID 分开持久化，重启把未结束任务标记中断，不能仅以复用 PID 宣称恢复。

## 任务与文件

任务保存 operation ID、固定 cwd/command、启动时 source commit/dirty、时间、退出码和有界日志。任务创建先持久化再启动，停止清理进程树。自由终端与任务互不混用退出码。package scripts 只从已有项目读取，不创建项目配置。产物打开使用工作区内实际路径，符号链接越界与不支持文件均拒绝。

文件读取和编辑使用相对路径、realpath 边界、字节上限和 SHA-256 基线。保存采用同目录原子替换，保留文件模式；旧基线拒绝覆盖。文件观察使缓存失效，操作前后重新读取。Monaco model URI 固定工作区和路径，切项目不复用错误 model；未保存草稿按文件保留。

## Git

RepositoryService 通过参数数组执行 Git，不拼接 Shell。status 使用机器格式，diff 保留原始补丁。写操作按实际仓库身份串行，执行前核对 HEAD/index/相关文件基线。确认令牌绑定精确参数、作用域和基线；终端不继承 UI 的业务确认令牌。patch 使用 git apply --cached --check 后应用，失败不退化成整文件暂存。

merge/rebase/cherry-pick 冲突是可恢复状态，返回真实 Git 结果；continue/abort 根据当前仓库状态执行。用户开发 Git 不复制 product-git 的 bare repo/独立 index/禁用 hooks 策略。外部 Shell/IDE 可绕过应用队列，服务不声称强制独占；本地构建标注 dirty，正式固定源构建使用明确引用。

## Agent

Release 复用 ConversationSurface、ConversationComposer、ChatStateCoordinator 与 ChatCoordinator。getTurnContext 注入当前项目、操作引用和动态工具，工具由主进程持有。工具输入校验、账号和工作区检查在确定性服务执行，Agent 的文本不改变业务成功状态。源码修改可由原生 Agent 文件能力完成，文件观察与 Git 刷新负责呈现结果。

长操作返回 operation ID；日志分页读取。Agent 默认使用任务/专属终端，写用户终端需明确选择。对话停止与任务停止独立。thread/start 注册动态工具，恢复由现有 adapter 和实际 Codex 协议保证，不创建额外 Controller/Worker thread。

## IPC、恢复与扩展

主窗口 IPC 校验调用来源，业务接口使用 project ID、session ID 与受限参数。终端字节输入只接受已创建且归属当前范围的会话；不开放主进程任意执行 API。账号退出关闭旧 scope 的活动与会话。窗口切换保留活动；应用退出清理子进程。

后续 MCP/CLI adapter 调用同一个本机服务。协议 adapter 不复制业务状态；外部连接必须有明确授权 scope，服务不可用时明确报错。当前内置 Agent 使用已有 dynamicTools，无需新增 MCP 网络服务。

## 验证边界

使用真实临时 Git 仓库、真实 PTY 和进程测试；Renderer 使用隔离项目和确定性 Agent 替身验证交互。node-pty 验证 Electron ABI、辅助程序、ASAR 与签名；Monaco 验证安装包内 ESM 和 worker。真实外部账号发布不在自动测试中执行。
