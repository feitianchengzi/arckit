# 静态完成检查 1

2026-09-11。审查依据为宿主提供的 07:16:03.204Z trusted snapshot：Project 363、CASE-20260910-003 content revision 6。选择该 Case 唯一 ready 的 Completion Review；其他四项 Project 候选需独立 Case，暂缓；另外两项凭据／发布与 Release 重打包人工事项不属于当前范围。

## 范围与结论

遵循已接受 FACT-017 与 static-acceptance-scope.md：仅静态源码验收。安装应用、画面、输入、布局和 Space 激活由用户后续独立验收，有问题另提待办，不是本次完成条件。

结论为 findings：关闭修复的静态路径未发现新的阻塞缺陷，但默认开启的临时诊断仍有正常启动写盘及错误／上限弹窗副作用，不能作为已完成最小性清理的交付。本轮只报告一项 agent 责任的源码清理发现，不修改业务代码，不恢复已取消的装机义务。

## 五个维度

| 维度 | 结论 | 源码依据与证明边界 |
| --- | --- | --- |
| 实施正确性 | clean（静态范围） | renderer.js 的 Escape 阻止默认行为和冒泡，忽略重复按键，经 preload.cjs 无参数 close IPC；main.mjs 检查 main frame，服务检查受管 sender。BrowserWindow 保持 sandbox/contextIsolation、禁用 nodeIntegration、禁止导航／新窗口。服务先检查退出等待，再读取全屏布尔值；leave-full-screen 后重入关闭，强制清理解除等待。未发现与已接受关闭约束冲突的新路径。 |
| 问题解决 | clean（静态交付范围） | work-task-image-viewer.mjs 在 darwin 不设置 native parent，查看器关闭不调用所有者 show/focus/hide/resize/reload/fullscreen；所有者 closed 单向强制清理，查看器 closed 解绑。非 macOS 保留原生 parent。满足 FACT-015 的源码隔离主张，不证明黑屏唯一根因或实际恢复。 |
| 验证可信度 | clean（有限证据） | 直接读取 Renderer、preload、main handler、服务、相关测试及当前 diff。六个文件 node --check 无报错，git diff --check 通过。测试源码包含 sender/frame 拒绝、真实 handler 链路、重复关闭／提前变化布尔值、所有者四种状态、销毁期间清理及跨平台断言，但本轮没有执行这些测试。旧 79/88 项结果不作为最新修改通过证据。 |
| 回归风险 | findings | 临时诊断无条件在 app.whenReady 初始化，主窗口和查看器持续挂载观察器。达到 20 个日志文件后每次正常启动会走 onFailure；达到 2000 条事件会走 onLimit；两条路径在 main.mjs 调用 dialog.showErrorBox。该附加 UI 会干扰正常工作／焦点，且不依赖用户本次打开图片才触发。没有声称本机已经触发。 |
| 最小性 | findings | 当前验收已不依赖现场采集，而自动记录器仍是生产启动依赖，且源码和历史说明均标记其为临时诊断，不是长期产品能力。移除默认采集、关联提示和已无用途的诊断接线是当前源码交付的必要收尾；保留关闭修复、历史证据及用户已有日志。 |

## 唯一发现：临时自动诊断未收尾

kind: excess；responsibility: agent。

直接证据：

- runtime/arcorbit/desktop/main.mjs：诊断 import、will-quit stop、app.whenReady 自动初始化、onFailure/onLimit 原生错误提示、查看器注入和主窗口 observe。
- runtime/arcorbit/src/image-viewer-diagnostics.mjs：临时标记、自动创建独立日志、20 个文件上限、2000 条事件上限和回调。
- runtime/arcorbit/src/work-task-image-viewer.mjs：可选 diagnostics 参数及生命周期 record/observe 接线，与关闭控制逻辑可分离。
- runtime/arcorbit/test/image-viewer-diagnostics.test.mjs：现有源码断言要求默认自动采集和原生提示，后续清理不能保留这些过时断言作为交付要求。
- automatic-diagnostic-capture.md：历史采集目的及临时属性；是历史材料，不是本轮恢复采集或安装要求的授权。

需要的结果是正常启动及查看器生命周期不再默认进行本问题临时日志采集或弹出采集提示，相关孤立代码／测试得到一致处理；保留已接受的关闭安全与窗口隔离实现，并明确不删除用户日志或改写历史证据。后续工作须等待 Ledger 接受本发现并 fresh-read 后重新选择，不在审查中直接实施。

## 本轮实际检查

以下六个文件分别执行 node --check，均无报错：

- runtime/arcorbit/src/work-task-image-viewer.mjs
- runtime/arcorbit/desktop/main.mjs
- runtime/arcorbit/desktop/image-viewer/preload.cjs
- runtime/arcorbit/desktop/image-viewer/renderer.js
- runtime/arcorbit/test/work-task-image-viewer.test.mjs
- runtime/arcorbit/src/image-viewer-diagnostics.mjs

未运行 node --test、应用、GUI、录屏、打包、安装、重启或新的原生采集。既有工作区改动全部保留；本轮仅新增此审查证据。

## 不变量判断范围

产品与交互预期保持可恢复：FACT-011 的独立性目标和 FACT-017 的静态验收界限均不改变。视觉语言无关，未建立任何新主题／布局／平台 chrome 规则。技术约束与 FACT-015 的实现一致；临时诊断未被提升为长期技术决策。

realization 的 upheld 仅对应 FACT-015 的源码行为及 FACT-016/017 的验证边界，不是整个交付已无多余代码。risk 的 upheld 仅表示本轮接受的风险主张有可重复源码依据：明确指出默认采集与弹窗风险并提交 finding，而不是声称这些风险已消除或回归维度 clean。新增发现不在本轮作为 accepted fact 或普通 Gap 提交，由 Ledger 根据 review result 派生后续修复义务。

本文件不是 canonical 提交或 Case 完成收据。
