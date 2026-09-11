# 无命令行图片查看器诊断采集

2026-09-11。依据 06:28:49.276Z trusted snapshot，Project 363 / Case content 4。本轮响应用户明确要求「换种埋点方案，让我运行完你就能拿到日志分析，不要依赖命令行启动」。只验收采集方式的源码实现与非 GUI 验证，不验收黑屏根因或实际恢复。

## 使用及取证

包含本次源码的新应用正常从 Finder / Dock 双击启动后，主进程自动创建日志，不再读取 `ARCORBIT_IMAGE_VIEWER_TRACE_FILE`，不依赖终端环境或 cwd。

日志位置由已确定的 `app.getPath("userData")` 派生：`<userData>/arckit/debug/image-viewer-escape-<timestamp>-<uuid>.log`。当前 macOS 的正常目录为：

`/Users/Glare/Library/Application Support/@arckit/arcorbit/arckit/debug/`

用户复现后只需回复「已复现」及大致时间；Agent 可只读列出上述固定目录、读取对应启动日志，无需用户手动复制日志或运行启动命令。分析时核对 trace-start 时间、PID、Electron 版本和事件序列，再与人工画面/输入观察对应；不能混用测试日志和实际应用日志。

当前宿主未被打包、覆盖、退出或重启。因此必须先将源码纳入下一次用户安排的打包安装，再安全退出旧进程并正常启动新应用。不能在仍运行旧包时期待新增自动采集生效，也不应并行启动共享正常 userData 的第二实例。本轮没有借用 Release Case 的打包授权。

正常启动没有确认对话框。目录或文件写入失败会弹出「图片查看器诊断日志未能写入」，明确目录和保留上限；请用户反馈提示而不是反复复测。每次启动独立文件，独占创建，0600 权限，新增诊断目录 0700；拒绝诊断子目录符号链接。已有日志不删除或覆盖，目录已有 20 个本问题日志时停止新增并提示先归档。每个文件最多 2000 条事件，到限写入 trace-limit、解除采集监听并提示；该文件之后的操作不构成采集证据。上限提示本身可能改变焦点，不属于原始故障路径。

## 实现范围与证明边界

- `runtime/arcorbit/desktop/main.mjs`：在 userData 选择完成、app ready 后自动初始化采集，并沿用主窗口与查看器观察连接；异常及上限通过原生错误提示反馈。
- `runtime/arcorbit/src/image-viewer-diagnostics.mjs`：自动创建独立日志；复用已有异步写入和事件上限；增加 move/resize/maximize/unmaximize、最大化布尔值、窗口/内容 bounds。
- 仍仅记录允许的窗口事件、时间、进程/窗口 ID、布尔状态及四个数字尺寸字段，不记录图片、URL、任务内容、普通键盘文本或原始错误；没有网络上传。
- 未修改 parent 关系、关闭 IPC、安全隔离、全屏策略或父窗口恢复调用。窗口尺寸不是像素证据，日志不能独立证明输入或上下文恢复。
- 日志实时异步写入，不要求退出应用后才能读取；进程崩溃或强杀仍可能损失未写完尾部，未承诺 fsync 持久性。
- `ARC_DEBUG:image-viewer-escape` 仍为临时标记；本轮任务是让采集可用，不是故障修复完成，故保留采集代码待真实复现。完成诊断修复后需清理，不转为常驻遥测能力。

## 实际验证

`node --test runtime/arcorbit/test/image-viewer-diagnostics.test.mjs runtime/arcorbit/test/work-task-image-viewer.test.mjs runtime/arcorbit/test/work-task-image-viewer-state.test.mjs runtime/arcorbit/test/desktop-renderer.test.mjs`：88 passed，0 failed，0 skipped。

其中诊断模块 9 项测试含 4 项新增：仅提供隔离 userData 即自动写入、停止前可读、两次启动各自保留、尺寸字段白名单、权限、20 文件上限不删证据、符号链接拒绝、写入失败与上限回调隔离、Desktop 无环境变量连接检查。真实磁盘为临时测试目录，窗口仍为替身；Desktop 连接为源码断言，不是 Finder / Dock 原生运行验收。

`node --check`：诊断模块及 Desktop main 通过。`git diff --check`：通过。未执行 GUI、打包、安装、进程重启；没有生成本次黑屏现场日志。

## 本轮选择与不变量

选择 fresh `local:gap:automatic-capture`，目标为实现和验证不依赖命令行启动的临时采集。现有 ready GAP-20260910-003-003 deferred，继续承担实际应用采集、因果分析及主窗口恢复验收。四项 Project candidates（场景评估、Runtime 韧性、安全实证、跨记录审计）case_required/deferred，均不能解决本轮采集障碍；凭据/发布与 Release 重打包两项 ready/excluded，属于无关人工义务。

- product-expectations-remain-recoverable：upheld。FACT-011 的主窗口独立性及人工验收要求保留，本记录明确仅新增临时采集，不降低产品恢复标准。
- interaction-expectations-remain-recoverable：upheld。用户正常启动即可采集的要求、失败/上限反馈及复测交接由本记录明确；既有 Escape 行为不变。
- visual-language-remains-consistent：not_relevant。本轮不建立主题、布局或平台 chrome 新规则；顶部栏异常仍为实现故障，evidence=[]、gap_refs=[]。
- technical-decisions-remain-explainable：undetermined。自动采集设计及边界已明确，但 FACT-007/013 的父子窗口与恢复策略是否满足独立性仍缺原生因果证据，保持 GAP-003 开放。
- accepted-facts-are-realized：threatened。FACT-011 的真实故障未通过恢复验收；本轮源码和替身测试不替代安装应用，保持 GAP-003 开放。
- material-risks-have-credible-evidence：threatened。FACT-003/011 暴露的原生时序、画面、输入风险未消除；临时采集的范围与保护有测试，但实际应用证据仍待 GAP-003。

本记录不是 canonical ledger 写入或提交收据。只提交该 bounded 采集实现主张；不消费其结果继续做黑屏修复或关闭 GAP-003。
