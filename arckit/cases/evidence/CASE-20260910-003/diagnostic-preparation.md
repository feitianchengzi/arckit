# Escape 黑屏：临时采集已准备，实际诊断尚未完成

2026-09-11。本记录是工作区交接证据，不是 canonical transition 或恢复验收。

## 本轮范围与选择

依据宿主提供的 03:30:51.454Z trusted snapshot，Project revision 363，Case content revision 3；Case selection token `3befd2056b921a61537844247e44029a82ad1b4f8c207be56ed15a57dfde79ea`。

- `case-gap:CASE-20260910-003:GAP-20260910-003-003`：ready / selected；直接阻塞当前黑屏问题验收，实际执行路径缺失，用户影响最高。
- `project-gap:GAP-agent-scenario-evaluation`：case_required / deferred；独立场景验证不回答当前窗口故障。
- `project-gap:GAP-runtime-resilience-and-adapters`：case_required / deferred；通用 Runtime 韧性不解释图片窗口关闭。
- `project-gap:GAP-security-real-project-validation`：case_required / deferred；保留安全实证义务，不扩展本轮资源范围。
- `project-gap:GAP-cross-record-audit`：case_required / deferred；跨记录审计不解除当前主窗口不可用。
- `case-gap:CASE-20260901-001:GAP-20260901-001-005`：ready / excluded；凭据、许可和发布属于无关人工决定。
- `case-gap:CASE-20260909-002:GAP-20260909-002-004`：ready / excluded；另一 Case 的 Release 重打包授权不能借用。

没有另建或关闭准备性 Gap。当前项未完成，交接需要操作者协调的诊断运行；不把准备代码等同于实际恢复。既有 FACT-009 已确认此前四个修复文件安装覆盖，本轮添加的是新的诊断代码，尚未安装，不能沿用该覆盖证据证明诊断已启用。

## 实际改动

新增 `runtime/arcorbit/src/image-viewer-diagnostics.mjs`，唯一标记 `ARC_DEBUG:image-viewer-escape`。主进程通过 `ARCORBIT_IMAGE_VIEWER_TRACE_FILE` 显式启用；默认不创建文件、不挂窗口监听、不读取窗口状态。只接入主窗口和受管图片查看器，不订阅其他业务窗口。

采集系统时间、顺序号、主进程/窗口/WebContents/Renderer PID、布尔窗口状态、Escape keyDown/重复标志、经过 sender 校验的 close-request、close-control 的等待/允许关闭状态、退出全屏等待与完成、普通窗口生命周期、Renderer 无响应与退出。查看器记录关联创建时的父窗口。事件仅被观察，不 preventDefault、不调用恢复操作、不修改 sandbox、userData 或关闭策略。先前已接受的行为修复保留，本轮没有新增黑屏行为修复。

写入字段使用白名单，不采集图片字节、文件名、URL、业务正文、其他按键文本、原始错误消息或凭据。仅接受绝对 `.log` 路径，不自动创建父目录；以 `wx` 和 0600 独占创建，不覆盖旧证据或跟随目标文件符号链接。最多 2000 条（含 trace-start 和末尾 trace-limit），到限停止并解除观察；写入失败仅给出固定脱敏 stderr 提示，解除观察，不中断业务。关闭时请求刷新缓冲，但进程异常退出仍可能丢失尾部，不承诺崩溃耐久性。

临时代码仍保留，因为尚未取得真实复现证据、尚未确认根因或完成修复。不是长期运维功能；原始路径问题确认、修复并验收后应删除该模块、所有接入点和对应临时测试，按诊断技能再次搜索唯一标记确认清理。测试临时目录已由测试清理；未生成真实 `arckit/debug/image-viewer-escape.log`。

## 确定性验证

执行：

```text
node --test runtime/arcorbit/test/image-viewer-diagnostics.test.mjs runtime/arcorbit/test/work-task-image-viewer.test.mjs runtime/arcorbit/test/work-task-image-viewer-state.test.mjs runtime/arcorbit/test/desktop-renderer.test.mjs
84 passed, 0 failed, 0 skipped
```

新增 5 项测试证明：关闭采集时无观察；真实 service 配合替身窗口输出有序 `.log`、不绕过重复关闭等待且不泄露输入；事件数量上限和监听清理；旧文件/符号链接/非法目标不被覆盖且错误不外抛；已销毁窗口 getter 错误与未知退出原因不泄露。输出写入临时目录，日志内容由测试读取和断言。它们不是 macOS 原生全屏、像素、输入恢复证据。

main.mjs、work-task-image-viewer.mjs、新模块和新测试均通过 `node --check`；`git diff --check` 通过。搜索唯一标记确认三个业务文件中的临时接入位置，未清理前明确保留。未运行 GUI、打包、安装、重启宿主或修改 canonical Project/Case。

## 尚需协调的实际采集

需要操作者同意诊断版本的运行安排，并决定何时安全停止活动任务和退出当前宿主。不得自动覆盖 `/Applications/arcorbit.app`，不得并行启动共享正常 userData 的另一实例。具体只生成诊断包的命令、目标与所需权限应在执行前另行核实；此前 build-local-distribution 的自动 smoke 运行边界见 `validation-handoff.md`，不能把默认命令当作只打包。

目标日志是仓库绝对路径下的 `arckit/debug/image-viewer-escape.log`。经授权的诊断启动应显式设置上述环境变量；先核实进程路径、启动时间、Electron 版本，及新模块和相关接入文件确实存在于该构建，再检查日志已产生 trace-start/attached，之后由操作者沿原始全屏主窗口打开图片并按一次 Escape。不得把重复按键作为失败后的盲目重试；需要重复 Escape 场景时另行标明。操作者同时记录发生时间、实际画面、输入、全屏和上下文状态，日志本身不能证明像素或操作成功。

旧日志若已存在应先保留并由操作者明确归档位置，不静默截断。若提示 trace unavailable 或日志到限，先诊断采集失败，不要求反复重现黑屏。本轮未取得执行/人工协作确认，也未产生工具权限拒绝回执。拿到真实日志后重新判断竞争假设；当前不能确认原生呈现、窗口转换或 Renderer 异常中哪一个是根因。

## 完整 Project invariant 判断

- `product-expectations-remain-recoverable`：upheld。`case:fact:FACT-20260910-003-001`；`current-build-recheck.md` 与本记录保留只关闭查看器、主窗口可用的原始验收期望；gap_refs=[]。
- `interaction-expectations-remain-recoverable`：upheld。`case:fact:FACT-20260910-003-007`；`repair-verification.md`、本记录保留普通关闭/退出的区别、原始画面与输入验收，不以事件替代交互结果；gap_refs=[]。
- `visual-language-remains-consistent`：not_relevant。本轮事实未建立或修改主题、布局和视觉语言规则；evidence=[]，gap_refs=[]。
- `technical-decisions-remain-explainable`：upheld。`case:fact:FACT-20260910-003-007`；`arckit/tech/arcorbit/platform-composition-solution.md`、查看器服务与本记录维持已有隔离、受控关闭和生命周期决策；临时采集不构成新的长期技术决策；gap_refs=[]。
- `accepted-facts-are-realized`：threatened。`case:fact:FACT-20260910-003-010`；`current-build-recheck.md` 与本记录没有证明用户主窗口恢复，仍由 `case:gap:GAP-20260910-003-003` 承担。
- `material-risks-have-credible-evidence`：threatened。`case:fact:FACT-20260910-003-003`、`case:fact:FACT-20260910-003-010`；替身与日志采集测试不能消除原生呈现风险，实际事件及人工观测仍缺；证据为本记录与 `current-build-recheck.md`，关联开放 `case:gap:GAP-20260910-003-003`。

Project decisions 不变；不声明根因已确认、诊断完成或 selected Gap 已解决。根据 `arckit-debug-diagnosis` 的证据门禁，在真实路径日志和观察前暂停进一步行为修复。
