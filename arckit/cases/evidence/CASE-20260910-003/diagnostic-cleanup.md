# 临时图片诊断清理

2026-09-11。依据宿主 07:22:29.004Z post-commit trusted snapshot：Project 363、Case content 6。选中已接受审查发现 FINDING-20260910-003-001 对应的普通修复 Gap；不是第二次 Completion Review。

## 本轮唯一结果

当前源码不再默认创建本问题诊断日志、挂载临时窗口观察器或显示采集失败／上限提示。移除了 main.mjs 中的诊断 import、变量、退出 stop、启动初始化、查看器注入和主窗口 observe；移除了 work-task-image-viewer.mjs 的 diagnostics 参数、record/observe 调用和临时标记。

删除已无消费者的 src/image-viewer-diagnostics.mjs 和 test/image-viewer-diagnostics.test.mjs。原专用测试验证的是已移除采集能力，不再作为交付要求。在现有 work-task-image-viewer.test.mjs 新增一项源码回归断言，拒绝 Desktop／查看器残留本问题临时诊断；既有关闭、所有权、隔离及跨平台测试原样保留。新增断言未执行。

删除前已将上述两文件以及本轮编辑的 main、service、test 复制到 `/private/tmp/arckit-viewer-diagnostic-backup.soiq2B/`，可在系统清理临时目录前恢复；不是永久归档。没有访问、删除、搬移或覆盖用户已有诊断日志，没有改写此前 Case 证据。旧证据中被删路径是历史实现引用，不表示当前仍提供该功能。

## 静态保留性核对

对照本轮开始前备份的逐文件 diff：

- main 的行为删除仅限本问题诊断接线；image-viewer-close 的 main-frame 检查和 requestClose 调用不变。
- 查看器服务仅删诊断参数和观察调用。macOS 不设置 native parent、非 macOS 保留 parent 的条件不变；所有者 closed 单向清理和查看器 closed 解绑不变。
- sender 校验、sandbox/contextIsolation、禁用 nodeIntegration、退出全屏等待优先于布尔值、重复关闭保护和强制退出清理不变。
- Renderer 与 preload 本轮未编辑：Escape 仍经无参数 IPC，不恢复 DOM window.close 或主窗口 show/focus。
- 不改 Project 长期产品、交互、技术或可观测性决策；此次删除的是临时埋点，不涉及 Runtime 常规日志、诊断和持久状态能力。

## 实际静态检查

分别运行 node --check，以下五个文件均 exit 0：

- runtime/arcorbit/desktop/main.mjs
- runtime/arcorbit/src/work-task-image-viewer.mjs
- runtime/arcorbit/test/work-task-image-viewer.test.mjs
- runtime/arcorbit/desktop/image-viewer/preload.cjs
- runtime/arcorbit/desktop/image-viewer/renderer.js

git diff --check 通过。清理后检索 runtime/arcorbit 的专用诊断模块名、工厂名、变量、临时标记和提示文案，只在新增的禁止残留断言中匹配相关文本；生产代码中不再有这些接线或消费者。检查前全仓检索未发现 Case 历史证据以外的其他消费者。

本轮未执行测试套件、应用、GUI、截图、录屏、打包、安装、重启或实际日志采集。静态检查支持的是接线移除及安全关闭源码保留，不证明原生黑屏或布局故障消失。遵循 FACT-017，后续装机验收不阻塞当前待办。

## 不变量与边界

产品、交互预期沿用已接受的主窗口独立性与静态验收决定。视觉语言不相关；移除诊断提示不是建立新视觉规范。技术约束由原窗口隔离事实与上述源码差异证明保持，临时诊断没有转化为长期能力。realization 仅接受清理的源码事实；risk 仅接受默认采集与弹窗路径已从源码移除的有限结论，不接受已安装应用或真实原生效果主张。

申请完成本次审查发现对应的普通 Gap。此记录不声称 Case 已关闭、后续 Completion Review 已通过或 Ledger 已接受提交；后续选择须以提交后的新快照为准。
