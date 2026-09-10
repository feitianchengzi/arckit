# Release 核心能力落地评估

2026-09-09。候选方案，用于讨论和后续技术验证；不是已接受的正式技术契约，也不代表相关依赖已安装或实机验证通过。

## 建议组合

终端采用 xterm.js + node-pty；Git 使用原生 Git + simple-git 的应用适配层，Monaco 提供源码编辑和 Diff；内嵌 Lazygit 补齐早期高级 Git 操作。Agent 直接复用 Chat 组件、ChatCoordinator 和已有 Codex adapter，沿用 Idea 的场景工具模式。后续外部 Agent 插件通过 MCP 接入同一组本地服务。

完整 Shell、完整 Git 命令覆盖、完整图形 Git 客户端是三种不同的交付结果。前两项可以通过成熟开源实现较快获得；第三项仍有明确的界面、状态与异常恢复开发量。Lazygit 是可选的高级交互面，不能替代供 Agent 使用的结构化服务。

## 已有决策与代码证据

- [用户原始决策](../../../../../arckit/intake/2026/2026-09-09-arcorbit-product-management.md)：Agent 负责理解、计划和执行；代码承担确定性读写、校验、权限和恢复；底层跨场景复用，UI 专注场景。
- [Idea 技术记录](../../../../../arckit/tech/arcorbit/product-management-solution.md)：场景独立会话、共享事实、动态工具、可修改提案、与精确参数绑定的执行确认。
- [product-surface.mjs](../../../desktop/renderer/product-surface.mjs)：使用 ConversationSurface、ConversationComposer、ChatStateCoordinator；按对象持有会话。
- [product-coordinator.mjs](../../../src/product-coordinator.mjs)：通过 getTurnContext 注入 prompt、skillInputs、dynamicTools、dynamicToolProvider；工具与界面共用业务函数。
- [chat-coordinator.mjs](../../../src/chat-coordinator.mjs)：持久 thread、消息流、审批、停止、模型设置；不要求新增 Agent 编排框架。
- [codex-app-server-adapter.mjs](../../../adapters/codex-app-server-adapter.mjs)：已有 thread/start 动态工具注册及 item/tool/call 分发，校验当前 thread/turn。
- [product-git.mjs](../../../src/product-git.mjs)：原生 Git、bare repo、独立 index，仅用于产品资料分支；不能直接当作开发工作区的完整 Git 服务。其禁用 hooks 的资料同步策略也不能照搬到开发提交。
- [package.json](../../../package.json)：Electron + 原生 ESM/DOM；当前未声明 xterm、node-pty、Monaco 或 Git UI 库。
- [main.mjs](../../../desktop/main.mjs)：当前通过 loadFile 加载 Renderer，contextIsolation 开启、nodeIntegration 关闭。
- [既有验证报告](../../../../../arckit/cases/evidence/CASE-20260909-001/verification.md)：相关契约与替身测试已有证据，真实 Codex/安装包端到端仍需补验，不能由“已有代码”推断全部已验收。

这里的“源码能力”首先沿用用户原决策中的确定性业务实现分工；若包括浏览和修改项目源码，则由下文 WorkspaceFiles + Monaco 承担。

## 开源组件与职责

| 能力 | 建议组件 | 能直接复用什么 | ArcOrbit 需要实现什么 |
| --- | --- | --- | --- |
| 终端显示 | @xterm/xterm | VT/ANSI 终端模拟、键盘输入与渲染 | 标签、分屏、焦点、项目归属、快捷键 |
| 终端增强 | 官方 fit/search/web-links/serialize；按需 webgl、Unicode addon | 自适应、搜索、链接、缓冲区序列化 | 链接打开策略、字体、重连与日志保留 |
| 本机交互进程 | node-pty | macOS/Linux PTY、Windows ConPTY | Shell 启动环境、会话生命周期、输入所有权、流量控制 |
| Git 执行 | 原生 Git + simple-git | Git 命令调用、常用结果解析、取消与进度支持 | 类型化业务接口、完整状态、并发仲裁、错误恢复 |
| 编辑与比较 | monaco-editor | 文本编辑、语言着色、双栏/行内 Diff | 文件读写、逐块暂存、三方冲突 UI、保存冲突 |
| 高级 Git 交互 | Lazygit | 分行暂存、交互式 rebase、cherry-pick、bisect、worktree、提交图等 | 启动/打包、快捷键入口、退出后刷新 |
| 内置 Agent | 现有共享组件 + ChatCoordinator + Codex adapter | 消息、输入、流式输出、工具展示、审批和线程 | Release 场景上下文与工具适配 |
| 外部 Agent 接入 | 官方 MCP TypeScript SDK | 工具/资源协议及 transport | 本机连接、作用域授权、服务生命周期 |
| 前端依赖交付 | 可采用 esbuild 做独立依赖构建 | ESM 打包 | Monaco worker、CSP、离线资源与安装包 smoke |

依据：[xterm.js 及 addons](https://github.com/xtermjs/xterm.js)、[node-pty](https://github.com/microsoft/node-pty)、[simple-git](https://github.com/steveukx/git-js)、[Monaco](https://github.com/microsoft/monaco-editor)、[Lazygit](https://github.com/jesseduffield/lazygit)、[MCP SDK](https://github.com/modelcontextprotocol/typescript-sdk)、[esbuild](https://esbuild.github.io/api/)。版本在技术验证后固定到根 lockfile；本评估未宣称某组最新版已与当前 Electron 兼容。

## 终端：完整交互与可靠任务并存

终端应运行真实登录/交互 Shell，继承用户的 shell 配置、PATH、版本管理器和 SSH agent 环境。可以在里面运行 npm、Git、vim、top、ssh、Docker 和 Agent CLI，具体程序须在对应本机环境可用。补全和历史主要来自 Shell；xterm 负责显示与输入，node-pty 负责交互式进程。

TerminalHost 建议放在独立的受管理进程，主进程持有会话与授权。Renderer 通过受限 IPC 或 MessagePort 订阅字节流并提交输入、resize，不获得 Node 或通用文件系统接口。高频输出不进入全局 Desktop snapshot。

自由终端和受管理任务使用不同的执行契约：

- 自由终端：用户可以输入任意 Shell 指令，保留当前 cwd、前台程序和交互现场。Shell 可以 cd 到其他目录；“关联项目”只是来源身份，界面同时显示实际 cwd，不能将其宣传成目录沙箱。
- 构建/运行任务：固定启动目录、命令和参数，返回 operationId，保存退出码、日志、产物、取消与运行状态；通常直接 spawn 独立进程，需要交互时才使用 PTY。不能从用户自由 Shell 的彩色日志猜测哪个构建已经成功。
- Agent：默认启动自己的受管理任务或专用终端；接管人的现有终端须有明确交接，避免双方同时写 stdin。

窗口切换和 Renderer 重载可以重连仍存活的 TerminalHost。xterm/headless 与 serialize 能辅助恢复屏幕状态，但缓冲区恢复不等于恢复已经退出的 Shell。整应用退出后继续执行，需要独立守护进程或平台进程管理，这是额外能力，不以保存 PID 冒充实现。[xterm headless](https://github.com/xtermjs/xterm.js#nodejs-support)

打包验证是第一项技术探针：node-pty 含原生模块，需要匹配 Electron ABI、平台和架构；安装包中验证原生文件、辅助可执行文件、ASAR 与签名。先覆盖主要使用的 macOS arm64，再扩展其他声明支持的平台。[Electron 原生模块](https://www.electronjs.org/docs/latest/tutorial/using-native-node-modules)

## Git：完整底层与一站式操作

优先使用已验证的本机 Git，保持与终端、IDE 一致的配置、凭据、hooks、签名与 LFS 环境。simple-git 是调用层，不是 Git 实现或 GUI；未封装的命令仍由主进程受控 runner 通过原生 Git 执行。

如果安装包需要保证无系统 Git 也可工作，可评估 Dugite 的 Git 分发方式作为后备。它提供完整 Git CLI 绑定，但引入独立 Git 及环境配置，需专门验证凭据、代理、签名、LFS 和安装包体积。不要同时默认引入两套 Git 调用层。[Dugite](https://github.com/desktop/dugite)、[Dugite 环境变化](https://github.com/desktop/dugite/releases/tag/v3.0.0)

| 范围 | 完整目标 | 推荐实现顺序 |
| --- | --- | --- |
| 日常代码流 | 文件/块/行暂存、撤销暂存、commit/amend、Diff、文件历史、fetch/pull/push | 首批原生界面，复杂选区暂存随后补齐 |
| 分支与整合 | 分支、tag、stash、merge、rebase、cherry-pick；冲突解决、continue/abort | 底层状态先完整；复杂操作可先在内嵌 Lazygit 中完成 |
| 历史管理 | 提交图、比较、revert/reset、reflog、交互式 rebase、bisect | Lazygit 提供高级交互入口，再逐步原生化 |
| 仓库环境 | remote、worktree、submodule、LFS、SSH/HTTPS、签名、hooks | 底层保持原生 Git；按能力探测与真实失败呈现 |

Monaco 的 Diff editor 不直接提供“完整三方合并产品”。ArcOrbit 仍需读取 base/ours/theirs，组织结果编辑、冲突选择、保存/暂存/继续状态；删除、重命名、二进制、submodule 冲突需要专门呈现。它也不包含 VS Code 扩展宿主。[Monaco 官方说明](https://github.com/microsoft/monaco-editor)

RepositoryService 以真实 repository/worktree 身份处理操作。云端项目可以对应 monorepo 子目录；显示的项目路径与 Git 根目录需要区分，同仓库的两个项目不能拥有互相矛盾的 Git 状态。产品集切换只改变查看范围。

读取使用机器格式，例如 status --porcelain=v2 -z；工作区、index、HEAD 分别表达。部分暂存必须校验所选 Diff 的基线，不能把整文件 add 当作分块暂存。watcher 是失效提示，真正执行前后重新读取 Git 状态。[Git status](https://git-scm.com/docs/git-status)

界面、Agent、Lazygit 和外部 IDE 可能同时操作仓库。受管理写操作按 worktree/index 和共享 refs 的实际资源协调；应用内锁不能阻止任意 Shell/外部 Git。检测到外部变化时废弃旧预览，基于新状态继续。正式发布可使用固定 commit 的隔离 worktree；它共享部分仓库数据，也不是对所有操作完全隔离。[Git worktree](https://git-scm.com/docs/git-worktree)

凭据优先复用已有 Git helper 和 SSH agent；需要 HTTPS 登录向导时，再集成 Git Credential Manager。GCM 与 SSH 路线分开处理。[GCM](https://github.com/git-ecosystem/git-credential-manager)

## Agent：复用 Idea 的分工

建议新增 Release 场景适配，保持以下调用结构：

```text
Release 消息区 / 输入区
  → ConversationSurface / Composer / ChatStateCoordinator
  → Release 场景适配 → ChatCoordinator → 既有 Codex adapter
  → 场景动态工具 → WorkspaceFiles / Git / Terminal / Task 服务

Release 图形按钮 ───────────→ 同一组服务
后续 MCP / CLI 适配 ────────→ 同一组服务
```

Release 使用实际关联开发工作区；不复制 Idea 为“无文件夹起点”准备的私有 cwd。独立场景会话固定 project/workspace/thread，切换顶部观察范围不重绑。普通 Chat 和 Automation 的线程/状态不被合并。

建议的业务工具族为 workspace.read/search/applyPatch、git.status/diff/stage/commit/fetch/push、terminal.create/read/write/resize/interrupt、task.start/status/logs/stop。这些是候选 API 名称，不是已存在能力。工具调用按需要提供，不把全量终端日志或整仓库内容塞入每轮 prompt。

源码修改由 Agent 的原生代码能力或 WorkspaceFiles 适配执行；应用负责差异预览、文件基线验证、读回与真实 Git 状态更新。使用原生 Agent 文件工具的修改也必须被文件观察层发现。不得声称所有 Agent 行为都已被应用锁拦截。

“分析失败”附带稳定 operationId、实际执行目录/命令、源版本、退出码及日志引用；Agent 按需取日志、解释并执行修复。长任务返回 operationId，后续查询/订阅；“停止回答”和“停止构建”是两个不同动作。

沿用 Idea 的执行回执分工：修改、提交、推送等动作根据现有授权与具体范围执行；需要确认的动作绑定 repo、ref、revision 与精确参数，状态变化使旧确认失效。对话文本不能代替实际执行回执。工具层权限不会自动约束另外开放的 Shell，需要对应执行面落实。

未来外部插件优先提供 MCP 工具/资源 adapter，调用正在管理终端和任务的同一个本地服务，避免每个插件创建孤立 PTY 管理器。应用未运行时明确不可用，或另行提供可启动的服务进程；不默认暴露未认证网络端口。内置场景先用已有 dynamicTools，不必为复用而增加一层 MCP。[官方 MCP SDK](https://github.com/modelcontextprotocol/typescript-sdk)

## 需要先验证的接入点

1. 当前 Electron 安装包中真实运行 node-pty；验证中文输入、Shell 配置、交互 CLI、resize、大量输出、取消及进程树清理。
2. 当前 file:// Renderer 的 Monaco ESM/worker 加载。优先评估受控 app 协议及打包 worker，保持现有导航和 IPC 边界；不能只在开发服务器里验证。[Monaco worker 限制](https://github.com/microsoft/monaco-editor#faq)、[Electron protocol](https://www.electronjs.org/docs/latest/api/protocol/)
3. 两个测试仓库中验证 Git 分块暂存、冲突 continue/abort、分支切换、SSH/HTTPS 与 hooks；加一个同 monorepo 多项目场景。
4. 使用实际安装的 Codex 验证 Idea 模式动态工具、重启后同 thread 恢复与继续工具调用。当前 adapter 在 thread/start 注册工具；恢复时不应猜测协议，须验证实际版本对已注册工具的保留行为。
5. A 构建时处理 B；Agent 与用户修改同文件；自由 Shell 在工作区外执行；应用重启；同仓库不同目录并发。必须由真实进程、文件和 Git 状态验收。

第一批可用版本应交付真实终端、已有命令的构建/运行/停止、日常 Git 图形操作、内嵌高级 Git、共享 Agent 与失败修复闭环。之后补齐高级 Git 图形工作流和外部插件；正式发布再接固定源版本、产物身份、CI/渠道 adapter 与执行恢复。

当前本地脚本可以复用，通用构建记录和运行生命周期仍需实现。不同项目的启动、产物打开、安装、替换自身应用不能由一个通用 open 命令承诺完成；ArcOrbit 自身升级需由独立 helper 接手退出后的步骤。

OpenSumi/Theia 可用于建立完整 IDE 工作台。根据其框架定位与 ArcOrbit 当前 ESM/DOM、已有 Chat/项目导航的结构，本评估认为整套引入会增加工作台和扩展宿主整合成本；只有将来明确需要广泛 IDE 扩展兼容时再重新比较。[OpenSumi](https://github.com/opensumi/core)、[Theia 扩展结构](https://theia-ide.org/docs/authoring_extensions/)

## 查询范围

arckit-tech 本次仅用于查询 arckit/tech/INDEX.md 与 arcorbit/product-management-solution.md；摘要为既有 Idea 场景会话、工具、事实与执行边界。未修改正式 tech、spec、interaction 或 ledger。本文件仅保存选型候选和实施验证计划。
