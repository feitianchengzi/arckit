# Escape 关闭后黑屏：修复覆盖与静态路径复核

日期：2026-09-10。范围：GAP-20260910-003-001；只诊断，不修改产品、不打包、不重启应用、不重复 GUI 自动化。

## 结论及置信边界

当前安装包包含旧修复。发现的首要覆盖缺陷不是“未安装修复”，而是 **sandbox Renderer 的 DOM `window.close()` 与主进程 `BrowserWindow.close()` 不是同一路径**。Electron 31.7.7 的静态实现表明，前者可销毁 WebContents 后立即关闭窗口，绕过旧修复依赖的 BrowserWindow `close` 拦截。因此旧测试直接调用 FakeWindow.close 并不能证明 Escape 入口受控。

这是已证实的代码覆盖缺陷，也是持续问题的最强解释；尚不是对本次黑屏全部原生呈现原因的实机证明。当前事故中是否绕过 close、父子窗口当时各自的全屏状态、Space/合成器和主 Renderer 状态均没有本轮运行时观测。不能沿用旧 Case 已排除 Renderer/DOM 异常的历史结论来排除本次竞争假设。

## 安装与运行身份

- 只读进程检查：PID 59903，2026-09-10 22:38:06 +0800 启动，主程序 `/Applications/arcorbit.app/Contents/MacOS/arcorbit`。
- 安装资源：`/Applications/arcorbit.app/Contents/Resources/app.asar`，mtime 18:35:35 +0800，ctime 18:36:06 +0800，均早于该进程启动。
- app.asar/package.json：应用版本 0.1.0；Framework Info.plist 的 CFBundleVersion：Electron 31.7.7。未通过运行新 Electron 进程取版本。
- 以下包内文件与工作区逐字节相同。该结论不代表整个应用所有文件完全相同，也不能追溯用户之前每次复现的进程身份。

| 包内路径（源码前缀 runtime/arcorbit/） | 两侧相同的 SHA-256 |
| --- | --- |
| src/work-task-image-viewer.mjs | d3527450c7325cead09734a25ef4471d628ea6611c55eda0e7a11429fb96034a |
| desktop/image-viewer/renderer.js | 4cddc9ef02760bde199ad8f0cdee1321980ae1f520f04b9a733a40892fa8ab02 |
| desktop/image-viewer/preload.cjs | bf01aaf6b38d7c8912debdf0e956a1ff016515d540431b27df8675a0a1a90bb5 |
| desktop/main.mjs | 389c16877cf09bdbb6a44878170b6d3917d7dd463d0646ab527d4e883a4438fd |

复核命令：`node arckit/cases/evidence/CASE-20260910-003/static-probe.mjs`。脚本仅内存读取 ASAR，不解包覆盖安装，不访问用户图片、凭据或业务数据。

## 应用层完整路径

1. 待办附件和反馈图片点击分别位于 desktop/renderer/renderer.js:2587、2932，经 preload.openImageViewer → `arckit:image-viewer-open`，main.mjs:732 校验主 Renderer 后调用 imageViewer.open。
2. main.mjs:248 注入当前 mainWindow 为 parent。work-task-image-viewer.mjs 创建独立 BrowserWindow，sandbox=true、contextIsolation=true、nodeIntegration=false，show/focus 后加载验证过的图片字节。
3. viewer Renderer 的 window keydown → handleKeydown:135 → DOM window.close。没有 preventDefault、repeat 判断或专用 close IPC；查看器 preload 只提供 state/save/retry。当前 Desktop/src 搜索没有 before-input-event handler。
4. 原修复仅注册 BrowserWindow `close`：darwin 且查看器自身 isFullScreen 为真时阻止关闭，等待 leave-full-screen，再关闭并向 parent 请求 show/focus。它不是 WebContents `close` 监听器。
5. `closed` 处理只清理引用、图片和 pending listener，不恢复 parent。普通关闭、绕过拦截的销毁不会执行父窗口恢复代码。
6. 主 Renderer 自己的 Escape handler 关闭设置/操作面板或切换部分页面；它与查看器是不同页面，没有应用代码把查看器 DOM 事件冒泡/转发到主页面。不能将原生重派发假设描述成 DOM 冒泡事实。
7. 应用 before-quit 才走 imageViewer.close({force:true})；正常 Escape 代码未发出 quit。强制销毁是退出路径，不应被视为用户关闭查看器的恢复方案。

## Electron 31.7.7：关键区别

核查与安装 Framework 版本一致的官方 tag；链接为可重复的源码定位，函数名优先于可能不同的网页行号。

- [sandbox 初始化](https://github.com/electron/electron/blob/v31.7.7/lib/sandboxed_renderer/init.ts)加载 [common-init](https://github.com/electron/electron/blob/v31.7.7/lib/renderer/common-init.ts)，调用 [windowSetup](https://github.com/electron/electron/blob/v31.7.7/lib/renderer/window-setup.ts)。仅非 sandbox、非 webview 时替换 DOM close 为内部 IPC；本查看器不满足条件。
- [rpc-server](https://github.com/electron/electron/blob/v31.7.7/lib/browser/rpc-server.ts)的内部关闭 IPC 会调用所属 BrowserWindow.close；这解释了非 sandbox 路径为什么不能代替当前 sandbox 路径。
- [WebContents::CloseContents](https://github.com/electron/electron/blob/v31.7.7/shell/browser/api/electron_api_web_contents.cc)发出 WebContents close 并销毁内容；[BrowserWindow::WebContentsDestroyed](https://github.com/electron/electron/blob/v31.7.7/shell/browser/api/electron_api_browser_window.cc)随后执行 CloseImmediately。
- [BaseWindow](https://github.com/electron/electron/blob/v31.7.7/shell/browser/api/electron_api_base_window.cc)的普通 close 事件来自 WillCloseWindow；立即关闭走另一入口。[NativeWindowMac](https://github.com/electron/electron/blob/v31.7.7/shell/browser/native_window_mac.mm)的立即关闭拆除父子关系并直接关闭原生窗口，不走普通 Close 的全屏转换延期逻辑。[native delegate](https://github.com/electron/electron/blob/v31.7.7/shell/browser/ui/cocoa/electron_ns_window_delegate.mm)的普通关闭按钮通知是另一条入口。
- [macOS keyboard handling](https://github.com/electron/electron/blob/v31.7.7/shell/browser/api/electron_api_web_contents_mac.mm)还会把未处理键交给菜单/原生重派发。应用未消费 Escape 是明确代码事实，但这次是否触发系统退出全屏、是否有重复键落到主窗口仍属未知，不能据此直接宣布“Escape 穿透”根因。

## 全屏判断和替身探针

查看器没有显式请求进入全屏；原生父子关系不等于应用已经确认二者全屏值相同。旧修复只读取子窗口，不读取父窗口，也没有进入/退出中的独立状态。Electron 对 [isFullScreen/setFullScreen](https://www.electronjs.org/docs/latest/api/browser-window#winisfullscreen) 明确提示 macOS 转换异步，应结合完成事件；v31.7.7 NativeWindowMac 也将原生 style-mask 查询与 transition-state 分开。

`static-probe.mjs` 运行实际业务模块及提取的实际 Escape handler，其窗口状态由探针注入，不模拟或证明真实 macOS Space。

| 注入场景 | 结果 |
| --- | --- |
| 实际 Escape handler | DOM close 调用 1 次；preventDefault/stopPropagation 均未调用 |
| 父全屏、子非全屏 | 子立即关闭；退出全屏请求 0；父 show/focus 0；未查询父全屏 |
| 子全屏，正常 leave 事件 | 退出请求 1；事件后关闭；父 show/focus 各 1 |
| 已请求退出，布尔值先变 false，再次 close，leave 事件尚未发出 | 子立即关闭；父 show/focus 0；等待保护被前置条件绕过 |

最后一行证明给定顺序下的程序缺口，不证明 Electron 在本次事故采用了该顺序。若 leave-full-screen 不到达，当前代码也没有独立恢复路径；不可用固定超时强制销毁假装转换已完成。

## 旧证据为何不足

- 原提交 8fb401a1a15f8f05d7f879ff64dbd480c69405ee 未修改 Escape Renderer/preload，只修改主进程 close 处理及其测试。
- 旧 FakeWindow.close 主动发出 BrowserWindow close；测试没有运行 sandbox DOM close，所以没有覆盖现在发现的入口差异。
- FakeWindow 只在手动 completeFullScreenExit 时把 fullScreen 置 false 并同时发事件，天然排除了布尔值与事件不同步的分支。父替身没有 isFullScreen，恢复只断言计数。
- 旧 Case 的实际对照只被保存为历史结论及日志 SHA-256 ee68d51eb07f7139b687c6ed11185ccd04d31d0075835ef294d4349ec0411640。日志及不成功 GUI fixture 已删除，不能从哈希重建事件或确认当时的 sandbox/触发入口。main.show 也不是画面恢复和输入正常的充分证明。
- 本轮原 viewer/state 测试 10/10 通过，同时静态探针暴露遗漏；这是测试范围不足的证据，不是产品修复通过。

## 必要修复边界与剩余验证

后续工作应先使 sandbox Escape 进入主进程受控关闭入口（具备 sender/所属查看器校验），保持 sandbox 和导航隔离；不能通过关闭 sandbox 来迎合旧测试。再对普通窗口关闭、重复请求、已在转换中、父全屏而子非全屏、退出应用的不同语义明确处理。仅给 DOM 加 preventDefault 不会自动改变 DOM close 的销毁入口；仅移动现有 guard 也不覆盖 sandbox 入口。

不据此扩展成重载主页面、切换主窗口全屏、禁用 GPU、清缓存或升级 Electron 的修复；这些操作缺乏本轮根因证据且可能破坏草稿/执行上下文。

静态分析不能确认真实像素、Space 和事件时序的全部因果。需要区分竞争假设时，最小观察应包含构建身份、viewer/parent ID、关闭来源、BrowserWindow close 与 WebContents close/destroyed、全屏进入/离开、各自 isFullScreen/visible/focused/destroyed、主 Renderer 存活/DOM/输入与实际画面。避免记录图片 URL、字节、任务正文或凭据。此处仅定义诊断需要的信息，未植入运行日志，也未启动复现。

用户当前优先静态分析，故遵守该约束，不执行 diagnosis skill 通常要求的运行时埋点复现；结论明确保留此限制。后续不能以本探针或 show/focus 计数关闭真实黑屏验收义务。当前仅建立下一轮受控关闭修复与比例验证的事实依据。

## 本轮执行记录

- `node arckit/cases/evidence/CASE-20260910-003/static-probe.mjs`：4 项特征断言成功、4 个目标文件哈希相同；不是 GUI 测试。
- `node --test runtime/arcorbit/test/work-task-image-viewer.test.mjs runtime/arcorbit/test/work-task-image-viewer-state.test.mjs`：10 passed，0 failed。
- 未修改产品代码、未修改 canonical ledger、未添加临时埋点、未运行 GUI、未重新打包或覆盖应用。
