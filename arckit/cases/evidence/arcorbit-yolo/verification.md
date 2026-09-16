# ArcOrbit YOLO 实现验证

## 已实现

- `settings.codex.yolo_mode` 为设备级显式布尔开关。旧设置缺省关闭、非法输入拒绝、保存 patch 保留其他场景字段，重启恢复已保存值。
- 真实设置页复用 toggle-row 和原保存流程；反馈说明覆盖范围与生效时间，失败保留输入。现有两个 Model/Level 场景保持独立。
- ChatCoordinator 在接受消息前从 getSettings 捕获开关并固定至该 turn；Idea/Release 使用私有会话 Store 仍读取设备设置；项目事情台共用同一路径。
- Run 保存启动时 yolo_mode，经 --yolo/--no-yolo 向 Runtime CLI 传递，整个 Run 的串行 turns 保持同一启动选项。
- adapter 最终合并场景选项后统一映射。新建、恢复、同线程复用均显式配置；开启 never + dangerFullAccess，关闭恢复 on-request + 场景 readOnly/workspaceWrite。旧 dangerFullAccess 参数不能覆盖显式关闭。
- 终端接力捕获设备开关，macOS/Linux/Windows 的命令生成覆盖开启与关闭。保持原 thread。
- Idea prompt 表达实际模式，动态业务工具的确认、归属、授权检查继续由原 provider 执行。

## 可重复结果

五组日志去重后共 198 个不同测试通过：

| 日志 | 通过 | 内容 |
|---|---:|---|
| implementation-tests.log | 129 | 配置、adapter、Run、Chat、终端接力、Store、Idea、Release |
| policy-renderer-tests.log | 89 | 最终策略冲突处理、CLI 参数、adapter 和 Renderer 回归 |
| form-tests.log | 12 | 配置类型/保存/失败恢复，以及真实 index.html DOM 与复选框绑定 |
| workbench-tests.log | 1 | 新事情台真实共享会话入口读取设备 YOLO，保持任务 thread |
| handoff-tests.log | 1 | Automation 停止并将当前 YOLO 值交给终端接力 |

运行命令为 `node --test` 加对应 test 文件；事情台和 Automation 分别使用 `--test-name-pattern='task Chat and Auto share'` 与 `--test-name-pattern='CLI handoff interrupts'`。`node runtime/arcorbit/scripts/check-syntax.mjs` 和 `git diff --check` 均成功。

本机 `codex app-server generate-ts` 及 `codex resume --help` 只读核对协议和 CLI 参数。没有执行真实模型任务，协议执行行为由 app-server fake-client 测试验证；不能将其表述为真实账号模型端到端执行。

## 验证限制

首次扩大范围的 141 项测试中 140 通过，事情台现有真实回环桥测试因 `listen EPERM 127.0.0.1` 失败。真实 Electron 设置页启动被当前沙箱阻止。一次 require_escalated 请求返回 `Rejected("approval request failed")`，未获得额外权限；两项不计为通过。DOM 测试验证真实页面结构与表单逻辑，不代替 GUI 布局和操作系统级执行验收。

工作区已有新事情台等未提交改动，本次在其上增量实现；未打包、发布或修改当前设备实际运行权限设置。
