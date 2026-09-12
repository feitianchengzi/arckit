# Host 任务收尾

仅在 Host 明确给出 `phase: task_closeout` 且 Case 已通过可信 Completion Review 时使用。此阶段是同一会话内的 Git 收尾，不开启新的语义开发或 Review。

从 authoritative Case id、trusted ledger changed-files、会话上下文、git status/diff 与最近提交辨认本次任务成果。实现、测试、长期事实文档，以及可信写入产生的 Case、Project、Iteration 和索引都可能属于同一事项；路径列表是来源证据，不是排他 allowlist。

根据当前 Git 授权形成一个有意图且完整的提交，保留无关既有改动。同一文件同时包含相关和无关改动时，按可分离的 hunks 确定提交范围。工作已提交或没有属于本事项的改动时返回 `no_changes`。

按 Host 的 `arckit-task-closeout-result/v1` 返回真实状态、提交结果和证据。不在收尾期间重新验证、修改内容或修复实现；若提交范围需要新的内容判断或变更，按该 Host 收尾契约返回 `needs_human`，说明具体原因。普通 Loop 的技术故障与执行停止仍按 [执行上下文](execution-context.md) 处理。
