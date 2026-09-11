# 实际应用验证的授权与数据隔离边界

2026-09-10；当前候选 GAP-20260910-003-003。本轮仅只读核查，未打包、安装、启动应用或执行 GUI 自动化；不提交该 Gap 完成主张。

## 已核对的执行边界

- `runtime/arcorbit/scripts/build-local-distribution.mjs` 的默认路径执行 ArcForge 检查和 provider 打包、Runtime 检查、资源装配、electron-builder，随后调用 `runPackagedRendererSmoke` 启动应用。它不等同于“只生成包”，且写入 sibling ArcForge 的产物目录。
- `runtime/arcorbit/desktop/main.mjs` 仅在 `--renderer-load-smoke` 同时给出 `ARCORBIT_RENDERER_SMOKE_USER_DATA` 时使用临时数据目录；正常启动使用 canonical userData。因此另一份 `.app` 路径不是正常业务运行的数据隔离边界，不能据此与当前宿主安全并行验收。
- `runtime/arcorbit/dist-package/electron-builder.generated.json` 当前输出目录为 `release`，含既有资源和旧构建标签。直接复用时必须明确是本地验证产物，并重新核对实际包内修复文件，不得把旧标签或旧资源当作当前修复覆盖证明。
- 已接受的 FACT-20260910-003-007/008 仍提供源码修复和79项非 GUI 回归证据；本轮不重做这些工作，也没有新的实际画面证据。

## 待确认的协作方式

建议先授权仅生成一份单独目录的本地未签名测试 `.app`，不发布、不安装、不启动、不覆盖 `/Applications/arcorbit.app`。Agent 应在执行前核对确切打包命令、输出目录、资源及所需权限，并在生成后只读核对包内四个修复文件和 Electron 版本。

实际验收由操作者安排安全退出旧应用的时机后进行，不并行访问同一用户数据，不由本轮自动停止宿主。人工按原始路径检查：全屏主窗口打开图片，Escape 关闭，确认主窗口内容、输入、全屏和上下文；失败记录实际现象，不能以计数或新包存在声明恢复。不得重复此前不稳定 GUI 自动化。

尚需操作者同意上述只打包范围及后续人工验收安排。未把其他 Case 的授权或拒绝改写为本 Case 的授权；尚未请求或执行具体命令，不声称工具权限被拒绝。

## 当前选择与不变量判断

选择当前实际恢复验证项，因为它直接阻塞原问题验收。Project 的场景评估、Runtime 韧性、安全实证和跨记录审计均需要独立 Case，暂缓；其他 Case 的凭据/许可/发布与 Release 重打包人工义务均排除。核查显露的是当前项的授权与正常运行数据共用约束，不执行新的下游工作。

- product-expectations-remain-recoverable：upheld；FACT-20260910-003-001 与 repair-verification.md 保留主窗口连续性期望。
- interaction-expectations-remain-recoverable：upheld；FACT-20260910-003-007、repair-verification.md 及本记录保持 Escape 与应用退出不同语义。
- visual-language-remains-consistent：not_relevant；只读执行边界核查不改变视觉规则，无 evidence/gap 关系。
- technical-decisions-remain-explainable：upheld；main.mjs 的数据目录选择与 build-local-distribution.mjs 的执行边界可直接恢复，本记录不建立未经同意的新运行模式。
- accepted-facts-are-realized：threatened；FACT-20260910-003-008，开放 GAP-20260910-003-003；没有实际修复包运行和恢复证据。
- material-risks-have-credible-evidence：threatened；FACT-20260910-003-003/008，开放 GAP-20260910-003-003；替身证据不足以证明真实呈现，本轮发现的共享数据目录约束进一步要求操作者协调运行时机。

本记录是 handoff 证据，不修改 canonical Project/Case，不关闭 GAP-20260910-003-003。

## 2026-09-11：安装覆盖已接受后的诊断协作边界

本节取代上文「为了取得修复覆盖而先打包」的当前行动建议，不改写昨日执行历史。宿主已接受 FACT-20260910-003-009/010，Case content revision 为 3；当前四文件覆盖已成立，仍缺实际黑屏路径证据。本轮选择开放 GAP-20260910-003-003，未产生完成主张或 ledger 写入。

本轮只读检查结果：

- 搜索 `runtime/arcorbit/desktop` 与 `runtime/arcorbit/src`，未发现 `render-process-gone`、`child-process-gone`、`unresponsive` 或 `setAppLogsPath` 处理。主窗口创建路径维护窗口状态投影，但未持久记录上述进程异常；查看器 close/closed/fullscreen 路径也没有持久诊断日志。
- `src/desktop-user-data.mjs` 确认正常数据目录为 `~/Library/Application Support/@arckit/arcorbit`。先前按 `ArcOrbit` 名称查找的目录不存在；随后依据实际源码检查正确目录。
- 在该目录按 `.log/.dmp/.ips` 文件名筛选，排除 runs/projects/sessions/messages 子目录后，仅找到 Local Storage、Codex Setup partition Local Storage 与 Session Storage 的三个 LevelDB `.log`。它们是浏览器存储文件，不是本次窗口事件日志；未读取其内容，未扫描会话或凭据。
- 用户 DiagnosticReports 中按 arcorbit/ArcOrbit/Electron 文件名筛选，只找到 `Electron-2026-09-09-214855.ips` 和 `Electron-2026-09-09-214858.ips`，早于本次反馈，未读取其内容。`arckit/debug` 文件清单没有本问题日志。以上有限检查不证明系统任何位置都不存在日志，也不排除没有生成报告的 Renderer/GPU 异常。

当前仍不能区分：Escape 关闭实际是否经过预期 IPC、子窗口退出与父窗口全屏转换的顺序、主 Renderer 异常、以及 Renderer 存活但原生呈现未恢复。按 `arckit-debug-diagnosis`，逻辑推演未完整匹配症状时，必须取得 `.log` 实际路径证据后才能确认根因和修复。本轮没有添加埋点、没有运行复现，也没有新增可清理的临时日志代码；不声称诊断完成。

需要操作者确认的协作范围：允许准备仅用于本问题的临时诊断版本，由操作者安排安全停止当前活动任务并退出宿主后，手动沿原始业务路径复现一次。临时日志拟输出到 `arckit/debug/image-viewer-escape.log`，仅记录时间、进程/窗口 ID、Escape/IPC、close/closed/fullscreen 和渲染进程异常状态；不记录图片、URL、业务正文或凭据。操作者报告发生时间及实际画面、输入、全屏/上下文状态。具体构建或启动命令仍须在目标和权限明确后执行；该协作提议不是任何命令已获授权的证据。

不自动覆盖 `/Applications/arcorbit.app`、停止宿主或并行启动共享 userData 的另一实例，不重复不稳定 GUI 自动化，不关闭 sandbox，不重载父页面或切换父窗口全屏掩盖问题。一次复现未取得有效日志时先检查采集失败原因，不重复要求无证据尝试。

本轮完整不变量判断：产品期望 upheld（FACT-001，current-build-recheck.md 保留只关闭查看器和主窗口连续性）；交互期望 upheld（FACT-007，本记录保留原始路径与恢复验收）；视觉语言 not_relevant（不建立或改变视觉规则，无 evidence/gap 关系）；技术决策 upheld（FACT-007/009，源码关闭边界与数据目录所有权、本记录的有限证据范围可恢复）；accepted-facts-are-realized threatened（FACT-010，GAP-003，未验收实际恢复）；material-risks-have-credible-evidence threatened（FACT-003/010，GAP-003，没有足以排除竞争解释的实际路径证据）。Project 决策不变。场景评估、Runtime 韧性、安全实证、跨记录审计暂缓；其他 Case 的凭据/许可/发布及 Release 重打包人工义务排除。

当前交接责任为 human：确认上述一次诊断复现的运行安排与配合范围。未收到确认不等于工具请求被拒绝。GAP-003 保持开放，不能把本次日志可用性核查当作恢复验收或再建立一个已完成的根因 Gap。
