# 第二次源码静态完成检查

2026-09-11。依据宿主 07:27:02.107Z post-commit trusted snapshot：Project 363、Case content revision 7；Case selection token `a83446820702d5a1e7c59b9ed711e53eddf4f803744d856ee9e5612849b32e0d`。选中 `case-gap:CASE-20260910-003:CASE-20260910-003:completion-review:2`。

本轮只审查已接受的实现，不修改业务代码或 canonical state。四项 Project 候选需要另建 Case，暂缓；其他 Case 的凭据／发布和 Release 重打包属于人工责任且不在本次范围，排除。当前 Case 的普通义务已闭合，第二次完成检查是唯一选中项。此次检查未发现需要另选的新候选。

## 验收口径

遵循 FACT-017 与 static-acceptance-scope.md：当前待办仅接受源码静态交付；用户后续独立安装应用验收，有问题另提待办。原主窗口独立性目标及历史失败观察保留。以下 clean 均限定于这一口径，不表示安装包、实际画面、输入、布局或原生全屏恢复已验证，不把取消装机义务解释为测试通过。

## 五维判断

- implementation_correctness：clean。直接读取完整 work-task-image-viewer.mjs，并核对服务、main、preload、Renderer 的当前 Git 差异。Escape 经无参数 IPC、main-frame 检查和受管 sender 校验进入关闭服务；sandbox/contextIsolation 保留。退出等待先于即时全屏布尔值判断，重复关闭不能绕过等待；强制退出清理保留。macOS 构造不传 parent，关闭不调用所有者 show/focus；所有者销毁仅单向关闭其查看器，查看器关闭时解绑，非 macOS 保留原生关联。未发现本次修改中的静态实现阻塞。
- problem_resolution：clean。已接受的关闭入口覆盖缺陷及主窗口耦合源码均得到针对性修正，没有通过重载主页面、隐藏主窗口或切换主窗口全屏掩盖问题。当前源码交付范围得到满足；黑屏唯一因果及实际消失仍未知，不以本判断覆盖历史失败反馈。
- verification_credibility：clean。本轮五文件 node --check 分别 exit 0，git diff --check exit 0。直接读取相关回归用例，确认存在 sender/frame 拒绝、实际 Renderer/preload/handler 接线、重复 Escape、退出等待、所有者不同状态与销毁、跨平台和诊断残留断言。用例未执行，语法通过不代表行为通过，历史 79/88 项结果不证明最新修改。证据与有限结论一致。
- regression_risk：clean（静态范围）。源代码差异集中于关闭入口、窗口关联及生命周期；保留加载代际保护、下载保存、导航隔离和非 macOS 分支。临时诊断消费者检索仅匹配测试中的禁止残留断言，main 差异只剩关闭 IPC，不存在原临时启动采集或原生诊断提示接线。未发现新增静态阻塞；原生 Space 激活、异步时序、实际回归仍未验证，风险未被宣称消除。
- minimality：clean。第一轮发现的多余默认诊断已按 FACT-018 清理，未遗留生产调用；诊断专用模块与测试已移除，历史证据及用户日志不受本轮操作影响。保留的改动直接服务安全关闭、主窗口独立性和回归约束；未新增长期诊断能力、备用恢复机制或扩大项目决策。

## 可重复检查

本轮分别执行 `node --check`：

- runtime/arcorbit/desktop/main.mjs
- runtime/arcorbit/src/work-task-image-viewer.mjs
- runtime/arcorbit/test/work-task-image-viewer.test.mjs
- runtime/arcorbit/desktop/image-viewer/preload.cjs
- runtime/arcorbit/desktop/image-viewer/renderer.js

五项均 exit 0，无报错。`git diff --check` exit 0。对 runtime/arcorbit 检索 `image-viewer-diagnostics|imageViewerDiagnostics|ARCORBIT_IMAGE_VIEWER_TRACE_FILE|图片查看器诊断|ARC_DEBUG`，只在 work-task-image-viewer.test.mjs 的两行禁止残留断言匹配。

本轮未执行测试、应用、GUI、截图、录屏、打包、安装或重启；没有读取或修改用户日志。只新增此证据文件，保留工作区既有修改。

## 不变量与提交边界

产品与交互沿用 FACT-015/017 所确定的主窗口独立性、关闭语义与验收责任边界；相关依据见 static-window-independence.md 与 static-acceptance-scope.md。技术约束可由当前完整服务及 IPC 源码恢复，临时清理由 diagnostic-cleanup.md 与当前消费者检索佐证。realization 仅确认 FACT-015/018 的源码事实；risk 仅接受静态证据支持的有限判断及明确披露的未知。没有触及新的视觉语言规则，也不改变 Project 长期质量或可观测性决策。

本轮提交五维 clean、findings 为空的 Completion Review 结果，不同时新增事实、解决普通 Gap 或改写 Project。本文不是 trusted Ledger 收据；Case 是否关闭以宿主接受结果及其后 fresh snapshot 为准。
