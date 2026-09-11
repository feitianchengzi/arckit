# 再次黑屏反馈后的当前构建核对

核对时间：2026-09-11T03:14:15Z。用户再次报告「问题没有解决，ESC 退出图片查看器之后，主窗口还是黑屏了」。本轮只建立当前应用身份与修复覆盖事实，不验收黑屏修复、不修改窗口行为。

## 直接证据

- 只读进程检查：PID 71200，`/Applications/arcorbit.app/Contents/MacOS/arcorbit`，启动于 2026-09-11 11:11:00 +0800。
- `/Applications/arcorbit.app/Contents/Resources/app.asar` 修改时间：2026-09-11T03:00:04Z，早于上述进程启动。
- Framework `Resources/Info.plist` 的 `CFBundleVersion` 为 `31.7.7`；`CFBundleShortVersionString` 不存在，未以该缺失字段推断版本。
- 通过已安装的 `@electron/asar.extractFile` 在内存读取包内文件，与工作区对应文件逐字节比较，四项均相等；没有解包写入或修改应用。

路径相对于 `runtime/arcorbit/`；表内 SHA-256 同时适用于安装包和当前源码：

| 文件 | SHA-256 |
| --- | --- |
| src/work-task-image-viewer.mjs | 38b12f951be1432a49bb14de542ca49417d741bbbf4bfa1a1f67d7445b923e72 |
| desktop/image-viewer/renderer.js | d935892a194f140bc61466b6444fcfbc8ec79c4f25eb2854a9d48f70fcaab1c4 |
| desktop/image-viewer/preload.cjs | dffa5366ce45c10beb99c175544c0e6f6850b01b53f06ece5db3df6dffb4cac7 |
| desktop/main.mjs | e711576375e059675667764e045eb4cded7788e3299a3cdfe80b71e49922bbfd |

源码复核仍显示 Escape 调用 `api.close()`，preload 使用固定关闭 IPC，主进程验证 frame/sender，服务在子窗口 `closed` 后恢复原父窗口；全屏等待与重复关闭保护存在。这只解释控制路径，不证明原生画面恢复。

## 本轮可接受结论

当前应用四个文件已包含上一轮源码修复；昨天 `repair-verification.md` / `validation-handoff.md` 中「安装包尚未包含修复」是当时的历史事实，不能继续用来解释当前安装状态。今天不需要为取得这四项修复覆盖而再次要求打包。

用户反馈继续作为未解决症状保存。当前进程身份和磁盘文件核对不能追溯每一次黑屏的准确时间、进程或窗口，也未检查进程内存中的模块身份。因此不声称已经直接观测「新修复执行后仍失败」，更不声称原问题已解决。

## 诊断与验收边界

逻辑推演尚不能完整解释黑屏的原生呈现状态和时序；没有能够区分关闭入口、父子窗口全屏转换、主 Renderer 存活与呈现恢复的本次运行 `.log`，不能确认根因。按诊断技能门禁，后续根因确认需要受控运行日志和原始路径的观测，而不是新增猜测性 show/focus 或重绘修复。

需要观测的最小边界是 Escape/IPC、子窗口 close/closed 与全屏事件、父窗口可见/焦点/全屏状态及 Renderer 退出/无响应；日志不得记录图片内容、URL、凭据或业务正文。是否以及如何启动带临时埋点的应用，需要在后续实际执行前明确宿主切换和人工配合边界。本轮未添加埋点、未产生运行 `.log`，不把该观察范围当作已完成诊断。

未执行 GUI、截图、安装、打包、重启或额外应用启动；未重跑旧替身测试，也未以历史 79 项通过作为本次原生恢复证据。没有新增临时 console、debug flag 或 trace marker，无此类清理对象。真实画面、输入、全屏和上下文连续性，以及正常关闭、重复 Escape 和转换场景，仍由开放 GAP-20260910-003-003 承接。

本轮只提交「重新建立当前构建身份及修复覆盖」这一新鲜前置 Gap 的完成主张，不关闭实际恢复验收 Gap，不修改 canonical ledger；接受及后续 fresh-read 由宿主完成。
