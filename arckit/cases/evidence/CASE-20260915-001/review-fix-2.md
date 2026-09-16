# 已有线程工具恢复补修

同一事情工具桥新增 MCP 接口，Chat turn 与 Auto Run 都注入按账号/事情/工作区授权的 MCP 配置及环境变量；恢复已有 thread 可以发现与调用同一场景服务，无需创建替代线程。

## 验证

- 57 项针对性测试通过：`node --test test/project-workbench.test.mjs test/codex-app-server-adapter.test.mjs test/chat-coordinator.test.mjs`。覆盖 MCP initialize/tools/list/tools/call、命令权限、grant 撤销、恢复 thread 的 config 参数与不新建线程。
- 本机 codex-cli 0.154.0 真实协议验证通过，见 [native-mcp-verification.json](native-mcp-verification.json)。可复现脚本：`runtime/arcorbit/test/fixtures/workbench-native-mcp.mjs`。创建测试线程、追加明确标记的测试消息、卸载、以 MCP config 恢复、查询工具并调用场景读取，最后归档；未发起任何 turn/start，也没有远端业务写入。
- 最初用空线程验证时，Codex 不落盘空会话，返回 no rollout found；加入测试历史后才能验证真正恢复。此失败没有被计为产品通过证据。
- 依据本机生成的 experimental ThreadStartParams/ThreadResumeParams 核对动态工具注册边界；MCP HTTP URL、bearer_token_env_var 和环境认证遵循[官方 MCP 文档](https://learn.chatgpt.com/docs/extend/mcp?surface=cli)。

新 MCP 入口复用原 grant、账号与 workspace 核对、类型化能力及 Scene revision；工具失败返回 isError，不伪造成功。不修改用户全局 Codex 配置，不增加 worker/controller 或替代主线程。
