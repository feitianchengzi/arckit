# ArcOrbit 正式交互原型

打开 [default.html](default.html) 使用产品视图；打开 [scenarios.html](scenarios.html) 逐项体验正常、失败、恢复、权限和冲突场景。

采用真实 Logo 与五个入口：Chat、项目、团队、工程、设置。Chat 保留项目分组列表 / 对话 / 综合资料栏；其他页面采用左侧选择 / 中央工作区 / 右侧上下文。产品集在项目页维护，不在 Chat 常驻。

本地演示不会调用真实业务。每个场景入口重置本套原型数据；“继续上次工作”保留数据。正式原型独立使用 `arcorbit-formal-workspace-v1:dock`，不读取旧探索数据。

从仓库根目录运行：

```sh
python3 -m http.server 8765 --bind 127.0.0.1
node runtime/arcorbit/node_modules/electron/cli.js arckit/interaction/chat-workspace/verify-suite.cjs
```

预览地址：`http://127.0.0.1:8765/arckit/interaction/chat-workspace/default.html`。

验证脚本默认输出临时目录，支持 `ARCORBIT_TEST_OUTPUT`。Electron 隐藏窗口实际点击表单、菜单和状态，断言交互结果；不访问生产数据。

- `interaction.md`：完整策略与模拟边界。
- `suite-coverage.md`：本次五个入口的能力对应与实际复核范围。
- `coverage.md`：此前核心工作流的场景记录。
- `unified/`：正式原型专属资源，不依赖探索目录。
- `maintenance-result.json`：本轮文件范围、采纳依据与结果。
- `legacy-default.html`、`legacy-interaction.md`、`legacy-README.md`、`legacy-scenarios.html` 和根目录原有脚本：旧独立会话形态的历史对照，不作为本轮入口及验收依据。`verify-unified*`、`verify-navigation`、`verify-worksets` 保留此前版本验证记录，其旧导航选择器不适用于本次五入口；当前运行 `verify-suite.cjs`。

本轮只维护交互域。Spec、Tech、Visual 及生产实现保持原样，不能从原型推断跨域契约已同步。
