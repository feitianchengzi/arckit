# 人工复测后的进入全屏阶段诊断核对

2026-09-11。依据宿主 06:03:22.381Z snapshot（Project 363，Case content revision 3）。本轮只接受新增复测的事实与诊断边界，不接受根因或恢复成功。

## 用户观察、期望和猜测分开记录

用户报告已自行打包复测：

1. 主窗口非全屏，图片查看器进入全屏后主窗口看不见；查看器退出全屏并消失后主窗口重新出现。
2. 主窗口原本全屏，查看器进入全屏时主窗口黑屏；查看器退出并消失后主窗口重新出现，但布局异常，看似全屏而不是真正全屏，顶部栏越界。
3. 明确期望：查看器是否全屏不应改变主窗口自身的显示、全屏和布局状态。
4. 「消失和显示导致异常」是用户提出的假设，并非已证明的调用链。不能把看不见直接等同于执行了 BrowserWindow.hide；也不能把外观描述当作已读取原生 fullscreen flag。主窗口状态不受应用操纵的期望，不能替换成无论遮挡或系统桌面切换都必须始终同屏可见的新产品承诺。

新增信息将故障范围前移至进入全屏阶段，并区分两种父窗口前置状态；仅验证 Escape 关闭入口或 close 后重新出现不足以验收。输入、上下文、重复 Escape 和过渡中的关闭尚无本次观察结果。

## 当前构建与日志

只读 ASAR 比较：`/Applications/arcorbit.app/Contents/Resources/app.asar` 修改于 05:54:15Z。当前主进程 PID 8583，路径 `/Applications/arcorbit.app/Contents/MacOS/arcorbit`，启动于 13:59:13 +0800，晚于该修改时间。Framework CFBundleVersion 为 31.7.7。首次受 sandbox 限制的 ps 未成功，随后获准的只读 ps 检查成功；没有启动或终止进程。

包内与工作区 SHA-256 均相等：

| 文件（runtime/arcorbit/ 下） | SHA-256 |
| --- | --- |
| src/work-task-image-viewer.mjs | a28e36dd564a9a55ce3f584a5ee8c965865dfdfe43f0fb43f3790e36590b3de5 |
| desktop/main.mjs | 3257444c950801fdd07c81e17e7cb45620d7f77d3df1564104c53e32046b2e57 |
| desktop/image-viewer/preload.cjs | dffa5366ce45c10beb99c175544c0e6f6850b01b53f06ece5db3df6dffb4cac7 |
| desktop/image-viewer/renderer.js | d935892a194f140bc61466b6444fcfbc8ec79c4f25eb2854a9d48f70fcaab1c4 |
| src/image-viewer-diagnostics.mjs | 0e8881240c65e0bd947b17cf147345321b53e0970086a377f2c61aebd359d507 |

这是当前磁盘与启动身份核对，不是内存模块核对，也不能独立追溯每次人工复测。

`rg --files --hidden --no-ignore arckit/debug` 未发现 image-viewer-escape.log，只有另一问题的两个既有文件。未搜索用户指定范围外的日志，也未读取进程环境或业务存储。诊断模块仅在启动环境给出绝对 `.log` 路径时启用；没有该目标日志不能区分未启用、写入失败或用了其他路径。不能声称本次人工复测已采集有效日志。当前安装已含采集代码，不需要为了这五个文件的覆盖而再次打包。

## 源码核对结论

- 查看器以 `parent: parentWindow` 创建原生父子关系。其加载和展示只调用查看器自身 show/focus，核查的 main/viewer/renderer 路径没有进入全屏时主动隐藏主窗口的调用。
- 普通 macOS 查看器 closed 回调会对原始存活父窗口调用 show/focus；该调用晚于查看器关闭，单独不能解释此前进入全屏时就出现的黑屏。也不能证明它对异常恢复完全无影响。
- `src/main-window-controls.mjs` 使用 hidden 原生标题栏策略，状态投影将最大化与全屏合并为 maximized 布尔值。这个投影不能区分用户描述的「看似全屏」和真正原生全屏；没有实际几何及状态观测，不能确认顶部栏越界属于原生窗口、内容尺寸还是 Renderer 布局问题。
- 版本对应的 [Electron NativeWindowMac 源码](https://github.com/electron/electron/blob/v31.7.7/shell/browser/native_window_mac.mm) 表明非模态父窗口会建立原生关联，Show 包含前置/激活逻辑，SetFullScreen 管理异步转换；[ElectronNSWindow 源码](https://github.com/electron/electron/blob/v31.7.7/shell/browser/ui/cocoa/electron_ns_window.mm) 将原生全屏请求交给 AppKit。这些源码支持检查原生关联和时序，不能证明这台机器实际发生了哪个异常。

父子原生关联是重点竞争假设；关闭后的 show/focus 是另一个可能影响返回过程的边界；原生转换状态/尺寸与内容布局不一致仍未排除。静态逻辑不能完整匹配全部症状，按诊断技能，必须先读取真实路径 `.log`，不能直接删除 parent、替换全屏模式或再加恢复调用并称之为修复。本轮未改行为代码，未运行 GUI 或重跑不相关测试。

## 实际采集的最小交接

如本次已有日志，请先提供其路径，无须重复复测。否则由操作者安排安全退出当前宿主及活动任务后，在终端启动已核对的现有安装：

```sh
env ARCORBIT_IMAGE_VIEWER_TRACE_FILE='/Users/Glare/Library/Developer/ModularProgram/feitianchengzi/arckit/arckit/debug/image-viewer-escape.log' /Applications/arcorbit.app/Contents/MacOS/arcorbit
```

这是待操作者执行的说明，本轮未执行。不要并行启动共享正常 userData 的第二实例。先检查目标日志已有 trace-start/attached，再复现已有两种前置状态，记录每种的时刻及实际主窗口画面、顶部栏、输入、全屏和上下文。不要先运行后才检查采集是否启用。已存在日志会被独占写入保护拒绝，不删除或覆盖，应先保留并明确归档。出现 trace unavailable 时先提供提示与路径，不反复重现黑屏。

当前日志记录事件和布尔状态，不记录像素或窗口几何，可能仍需后续针对性证据；不得把没有 hide 事件或没有 crash 事件当作已排除全部原生故障。临时采集尚待使用，未清理，也不转为长期运维功能。

## 本轮选择与不变量

新选择 `local:gap:entry-fullscreen-evidence`：核实人工新观察揭示的进入阶段耦合线索及诊断边界。已有 GAP-20260910-003-003 ready/deferred，继续承接实际恢复验收，不能因本次判断完成而关闭。场景评估、Runtime 韧性、安全实证、跨记录审计四个 Project candidates 均 case_required/deferred，因为与当前新增诊断证据无直接关系；凭据/许可/发布与 Release 重打包两个人工 Case candidates 均 ready/excluded，不借用其授权。

- product-expectations-remain-recoverable：upheld；FACT-001 与本记录原始观察/明确期望可恢复；不承诺系统所有桌面始终同屏可见。
- interaction-expectations-remain-recoverable：upheld；本记录将进入/退出、两种前置状态和观察/猜测分开，保留主窗口独立性与完整恢复验收。
- visual-language-remains-consistent：not_relevant；顶部栏越界是实现呈现故障报告，不建立或修改视觉语言、主题和平台 chrome 设计规则；evidence=[]，gap_refs=[]。
- technical-decisions-remain-explainable：undetermined；FACT-007 的父窗口恢复策略与新增独立性要求是否一致，需要原生路径证据和窗口关联判断；本记录、当前查看器服务为证据，关联开放 GAP-003，不接受 parent 或 show/focus 已是根因。
- accepted-facts-are-realized：threatened；用户本次观察显示全屏主窗口仍有黑屏及退出后布局异常；本记录为证据，关联开放 GAP-003。
- material-risks-have-credible-evidence：threatened；FACT-003 说明替身验证限制，新观察仍没有可读取的运行日志；本记录为证据，关联开放 GAP-003。

不直接改写 canonical 文件。只提交当前事实判断；后续工作必须等待本次 accepted receipt 与 post-commit fresh snapshot 后重新选择。
