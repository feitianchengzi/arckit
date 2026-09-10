# Release 实施与验证记录

日期：2026-09-09。最新重试进展见文末与 packaging-progress.json：Lazygit 已安装、首轮测试包已生成，修复后的重新打包未获批准。原轮次结果：生产代码和开发态核心流程已实现；安装包验收未完成，Case 不标记完成。

## 实现

- Release 使用现有产品集、查看范围和工作区绑定；真实 xterm/node-pty 宿主管理多个终端、任务、输入、尺寸与退出。执行固定账号/项目/目录，历史日志有界保存。
- 原生 Git 与 simple-git 读取状态、Diff、文件历史和仓库操作，Monaco 编辑/对比，补丁绑定读取基线，危险操作经主进程确认。
- 场景 Agent 复用 ConversationSurface、ConversationComposer、ChatStateCoordinator、ChatCoordinator 与现有 Codex adapter。动态工具与 UI 调用相同本机服务。
- 已有 Lazygit 检测与缺少工具反馈；构建者可显式获取受 SHA-256 约束的可选发行二进制。未下载、未假装已安装。
- 构建脚本生成离线编辑器/worker 与许可证资源；配置包含 node-pty ASAR unpack，修复预编译 spawn-helper 的执行位。

## 已执行验证

1. 非 GUI 回归：635 项，608 通过、27 按原配置跳过、0 失败，见 regression.tap。两个默认会启动 GUI 的既有测试在沙箱外单独运行 fixture：experience-realization-electron 与 task-replacement-sheet-electron，输出验证了页面规范及失败后的编辑恢复。
2. 最后一次服务验证：10 项通过、0 失败，见 release-services.tap，覆盖真实仓库、部分暂存、提交、冲突中止、过期写入、符号链接、真实进程停止、重启中断与重新绑定后的归属。
3. 最新开发态 Electron：release-electron.json，9 条真实交互检查通过、无 Renderer 错误；包含真实 Git、源码原子保存、Shell 输入/resize、并行项目任务和 1500/1280/1100 三个桌面宽度。截图为同一隔离仓库测试产生。
4. check-syntax.mjs、git diff --check 与离线前端构建通过；现有 package-distribution 测试包含新的配置生成入口。

Agent 的外部模型使用确定性替身验证共享组件和实际动态工具调用。本次没有声称实际模型推理质量或远端发布已经验证。开发态 Electron 证据不等于签名安装包验收。

## 明确未完成

- 官方 Lazygit 二进制下载首次因网络限制失败，随后升级权限执行被拒绝；未绕过。
- electron-builder 原生模块重建需要写 ~/.electron-gyp，沙箱拒绝后升级执行也被拒绝；没有成功生成并验证安装包。
- 使用现有依赖成功准备了离线 app.asar 测试载荷，但运行该封装载荷的请求被拒绝，故不记为 ASAR 运行通过。
- 未执行真实外部渠道发布、签名/公证、Windows/Linux 装机验收；这些不能由当前 macOS 开发态测试替代。

## 状态维护

Release 技术决策扩展使旧 monorepo Case 的 technical_foundation impact 引用 revision 过期。通过 trusted current_protocol_repair 只更新既有引用版本，保留旧 Case 全部事实、开放义务与人工发布责任；恢复后 snapshot available，Project revision 356。


## 下载与批准重试（2026-09-09）

用户明确重试 Lazygit 下载和安装，并要求重新申请批准。官方 v0.65.0 darwin-x64 压缩包下载及 SHA-256 校验成功，安装在 `runtime/arcorbit/build-tools/darwin-x64/`。实际进程宿主验证了 Git 面板、仓库文件、resize、键盘输入和正常退出，见 lazygit-install.json。下载脚本支持从显式本地归档继续安装，仍执行相同的官方哈希校验。

原生模块重建与首轮本地 `.app` 打包获准并成功；Lazygit/许可证/收据已经随包。实际应用包主窗口与 preload 启动验证通过。封装的 Release 流程通过源码、Diff、Git、任务等阶段，但发现 Agent 会话初始化前输入框过早开放的竞态。源码已修复并通过最新开发态 Electron 9 个检查。

修复后的再次 electron-builder 请求被拒绝，未重复绕过。首轮 `.app` 不包含最后的输入框修复，因此仍不是最终验收产物；剩余是重新打包并完成封装后的 Release 全流程验证。既有其他 Case 的发布责任保持不变。
