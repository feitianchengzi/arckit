# Chat 文件变更消息丢失目标路径

调查日期：2026-09-05。状态：原因已复现，随后完成源码修复与针对性回归；未验收安装包 GUI。

## 结论与证据边界

修复前的 ChatCoordinator 在 `toolSummary(item)` 遇到 `fileChange` 时无条件返回“更新项目文件”，忽略 `item.changes`。started 和 completed 都调用此函数，将同一工具消息写为 `kind: tool` 与固定 content。这是路径进入 Chat live message 之前的有损投影，不是文件名被 CSS 隐藏或磁盘读取丢失。

注入含 `src/view.js`、`src/styles.css` 的合成事件后，真实 ChatCoordinator、Desktop Store 和 Conversation Surface 渲染函数完整复现此现象：

| 检查点 | content | 状态 | 两个路径出现在 content / HTML |
| --- | --- | --- | --- |
| started 后 live snapshot | 更新项目文件 | running | 均否 |
| completed 后 snapshot | 更新项目文件 | completed | 均否 |
| Desktop Store 保存后 | 更新项目文件 | completed | 均否 |
| 新 Store 和 Coordinator 重开后 | 更新项目文件 | completed | 均否 |

四个检查点消息 ID 相同；每处只有一条工具消息。合成 diff 正文均未进入 HTML。代码逻辑与该输入下报告的文案、位置和时序完全匹配，未添加产品代码日志埋点。

这是修复前仓库实现的确定性复现，未连接真实 Codex、未检查用户历史会话，也未对已安装应用执行 GUI 验收。不能据此声称所有历史消息或其他工具写文件路径均已调查。

## 数据链

- `runtime/arcorbit/adapters/codex-app-server-adapter.mjs`：`handleNotification` 将 `normalizeNotification` 结果入队；item 生命周期的归一化保留 params / raw_rpc，并未主动去除 changes。
- `runtime/arcorbit/src/chat-coordinator.mjs`：`projectEvent` 的 started/completed 分支只把 `toolSummary` 结果交给 `upsertLiveMessage`；fileChange 的 summary 恒定，原始 changes 不进入消息。`persistLiveMessage` 保存该消息，`publicMessage` 对外只输出既有展示字段，无法恢复已丢弃的路径。
- `runtime/arcorbit/src/desktop/desktop-store.mjs`：会话 messages 分区持久化并读取投影后的消息。本复现证明保存和重开忠实保留了收到的固定文案。
- `runtime/arcorbit/desktop/renderer/conversation-surface.mjs`：`renderConversationSurfaceMessage` 的 tool 分支转义并显示 message.content，无文件路径推断逻辑。`renderer.js` 中 Chat 将 snapshot.messages 传入此共享组件。
- 对照：`runtime/arcorbit/src/projection/run-event-projector.mjs` 的 Automation `toolItemContent` 会从 changes 的 path/filePath（并支持顶层 path/filePath 回退）提取路径，`toolItemKind` 保留 file_change。现有 `token-usage-projector.test.mjs` 已验证 `src/view.js` 随 started/completed 保留在同一条消息；这条路径没有 Chat 的固定文案缺陷。

## 既有预期与修复边界

`arckit/interaction/chat-workspace/interaction.md` 的“消息与内容体验”要求工具活动按 item 原位显示状态及有界目标，并排除文件正文和 raw payload。`arckit/tech/arcorbit/desktop-execution-solution.md` 的消息投影约定要求编辑显示稳定动词、目标及状态，并保留 Chat 与 Automation 的独立所有权和共享 Conversation Surface。

必要修复边界是 Chat 文件变更摘要：从真实事件路径生成可读、有界的具体文件目标，同时保持 item 身份、实时到持久化连续性及安全文本展示。无需为此让 Renderer 获得文件系统能力，也无需改变 Runtime 或 Case 控制。已持久化且只含固定 content 的旧消息不能仅凭该消息恢复文件名，不能伪造目标。

调查轮确定的验收范围包括单文件、多文件、无路径回退、空或异常字段、长路径、特殊字符、不展示 diff/raw payload、started/completed 原位更新及重开。已有 Automation 文件目标行为需要保持。调查轮未选择或实施修复；修复结果见末节。

## 重复验证

从仓库根执行：

```sh
node arckit/debug/chat-file-change-display/reproduce.mjs
node --test runtime/arcorbit/test/chat-coordinator.test.mjs runtime/arcorbit/test/token-usage-projector.test.mjs
```

第一条使用临时目录和合成 adapter，打印四阶段观察结果并自动清理临时 Store；它只断言消息连续性，不断言缺陷必须永远存在，因此修复后仍可观察新行为。没有读取真实用户会话或执行 Codex。

调查轮结果：复现脚本退出码 0，四阶段路径可见性均为 false；已有两组测试共 29 项通过、0 失败。这表明当时的回归未覆盖 Chat 文件目标丢失，不能作为问题已修复的证据。

调查轮仅新增本报告和复现脚本；无产品代码修改，无临时产品日志、debug flag 或 trace marker。

## 修复轮验证

ChatCoordinator 现在从 changes 的有效 path/filePath 提取目标，并在无有效条目时尝试顶层 path/filePath。按顺序去重，显示前三个路径及其余文件存在时的总数；每个路径超过 120 个 Unicode 码点时保留首尾，中间省略。无路径的完成事件保留同一 live item 已知摘要；首次无路径时仍显示通用提示。无需变更消息 schema、Renderer 或 Automation。

修复后原命令 `node arckit/debug/chat-file-change-display/reproduce.mjs` 退出码 0：四阶段 content 均为“更新 src/view.js、src/styles.css”，两个路径在 content 和 HTML 中均可见；消息 ID 保持一致，diff 均不可见。

```sh
node --test runtime/arcorbit/test/chat-coordinator.test.mjs runtime/arcorbit/test/token-usage-projector.test.mjs runtime/arcorbit/test/desktop-renderer.test.mjs
node --check runtime/arcorbit/src/chat-coordinator.mjs
git diff --check
```

结果：94 项测试通过，0 失败；语法与 diff 检查通过。新增一个行为回归包含 15 种输入，覆盖单文件、多文件、去重、异常字段、回退、特殊字符、长路径、20 文件有界摘要、控制字符、完成事件补充/更新/缺失路径，并对实时、持久化与新 Store/Coordinator 重开验证。历史固定摘要保持原文，渲染转义继续有效。既有 Automation 文件目标测试通过。

交互维护属于局部投影规则补充，已有策略源和页面主流程不变。修改 `arckit/interaction/chat-workspace/interaction.md`、`default.html` 及 `arckit/interaction/INDEX.md`：明确具体目标、前三项与总数、长路径和无路径行为，并投影到生成中的工具活动示例。文档 124 行、线框 55 行，层级未增加，无需拆分；未增添状态或关系，feature matrix 和关系图无需变更。原有灰度样式保持。

验证仅针对仓库源码与合成事件，不宣称已部署或已运行真实 Codex/安装包 GUI。没有新增产品日志埋点。
