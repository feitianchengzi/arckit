# Case Transition 输入与内容透明性

人工或 Agent 直接调用 `case-transition.mjs`、需要在 stdin 与文件之间选择输入方式，或需要处理一次性 transition 载荷时读取本文件。Runtime 的 `runtime-writeback` 直接传递 transition 对象，不需要临时 transition 文件。

## 输入所有权

`arckit-case-transition/v3` 是 ledger 的语义契约；stdin 和 JSON 文件只是 CLI transport，不是 Case State、evidence 或 runtime execution record。

- 一次性载荷优先通过 `--transition -` 从 stdin 提交。
- 需要单独验证时，`validate -` 同样从 stdin 读取。
- 调用环境不能传 stdin 时，调用方可以在操作系统临时目录创建唯一、仅当前用户可读写的 JSON 文件。
- 临时文件由创建方拥有，必须在成功、失败或取消后的 finally/cleanup 阶段删除；只有用户明确要求保留调试输入时才能留下并报告路径与敏感性。
- `case-transition.mjs` 不自动删除文件参数，因为它无法判断该文件是一次性载荷还是用户需要保留的复现 fixture。
- 不在项目仓库中保存一次性 transition，不把 `/tmp`、`/private/tmp`、`/var/folders` 或其他临时路径写入 evidence、Case、Project、Iteration 或 handoff。
- 需要过程审计时使用 Runtime 宿主在项目目录外管理的 run result/activity/events。Desktop 只向 Case round 写入 `arckit-runtime://runs/RUN-...` opaque ref；不要把宿主绝对路径或临时输入提升为 evidence。

## 内容透明性

transition 中的命令、正则、路径、引号、反斜杠、换行、Unicode 和 `$` 序列都是不透明数据。renderer 必须原样保存，不能把它们解释为模板、replacement string、shell 或 Markdown 控制语义。

- 不得为了通过序列化、渲染或索引校验而改写真实命令或 evidence。
- Structured Record 写入前必须先渲染到内存，重新解析 JSON，并确认结果与目标 record 深度一致。
- dry-run 和正式 apply 必须共用同一渲染路径；dry-run 还要只读预检 Case 索引的现有输入。
- 回归测试至少覆盖 `$'`、`$&`、``$` ``、`$$`、`$1`、引号、反斜杠、换行和 Unicode 的逐字往返。

## 失败处理

输入解析、往返检查、索引预检或正式提交任一步失败时停止写回并报告原始错误。不得绕过校验、手工改账本或用“等价”证据替换原始事实。正式提交开始后的失败继续由 ledger 原子回滚恢复；Runtime 宿主记录独立于 canonical ledger 提交并由宿主自己的生命周期管理。
