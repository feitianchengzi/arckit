# Desktop Interrupt And Restore Model

## Status

- State: parked
- Type: technical
- Source: agent 对话
- Created: 2026-07-10
- Updated: 2026-07-10
- Decision: 仅记录，暂不执行

## Background

讨论 Arckit Desktop 退出、底层 `codex app-server` turn 生命周期，以及是否需要提供类似 Codex CLI 的对话恢复体验。

当前已实现的保守策略是：Desktop 退出前主动中止 active runs，并将 run 标记为 `aborted`，避免底层 runtime/app-server 失控继续运行。

## Pending Item

后续需要重新判断 Desktop 的期望恢复模型：

- 是否继续采用“退出即中止 active run”的保守模型。
- 是否改成更接近 Codex CLI 的“interrupt 当前 turn，保留 session，对下一条用户消息续跑”的模型。
- 是否需要 daemon 常驻，以支持 Desktop UI 断开后 agent 仍继续执行并可重新 attach。

## Current Judgment

用户期望的“恢复”更接近 Codex CLI 体验：执行中的 turn 可以被中断，保留对话和工作区状态；用户后续再发消息时，从同一 session 接续，而不是恢复同一个进程级 turn。

这与 daemon 持续运行的“UI 断线后后台继续跑”是两种不同能力：

- Codex CLI 式恢复：中断当前 run，持久化 session/messages/events/partial state，下一条消息启动新 run 接续。
- Daemon 式恢复：Desktop 只是 UI，daemon 继续拥有 active run 和 `codex app-server` client，Desktop 重启后按 `runId/sessionId` 重新 attach。

现在暂不决定采用哪种模型，因为需要结合 Desktop 产品目标、run/session 存储结构、用户对后台继续执行的预期，以及异常退出安全边界一起设计。

## Revisit When

- 继续设计 Desktop run/session 生命周期。
- 用户明确要求 Codex CLI 式 interrupt/continue 体验。
- 需要处理 Desktop 崩溃、断网、重启后的 active run 恢复。
- 需要决定是否引入 `arckit-runtime-daemon`。

## Related Areas

- `runtime/arckit-runtime/desktop/main.mjs`
- `runtime/arckit-runtime/src/desktop-run-manager.mjs`
- `runtime/arckit-runtime/adapters/codex-app-server-adapter.mjs`
- `runtime/arckit-runtime/src/json-rpc-stdio-client.mjs`
- `runtime/arckit-runtime/desktop/renderer/renderer.js`

## Notes

- 当前 `thread/start` 使用 `ephemeral: true`，不具备跨进程恢复同一个 active turn 的事实基础。
- 如果 daemon 也停止，通常只能基于会话历史、事件日志和工作区状态开启新 turn 接续，不能无损恢复正在执行的 tool/shell 状态。
- 如果要做 Codex CLI 式体验，后续候选方向是新增 `interrupted` 状态，并让新 run 的 prompt 带上同 session 历史、最近 interrupted run 摘要和必要工作区状态。

## Outcome

