# YOLO 调用契约证据

- Chat、Idea、Release、项目事情台均通过 createChatCoordinator → createCodexAppServerAdapter。
- Automation（首次运行、恢复、交付）通过 DesktopRunManager → Runtime CLI → adapter；各入口已有 on-request 默认。
- 终端接力通过 automation-coordinator → interactive-cli-launcher → codex resume。
- 本机 `codex app-server generate-ts --out /tmp/arcorbit-yolo-protocol` 成功：thread start/resume 支持 sandbox，turn/start 支持 sandboxPolicy；dangerFullAccess 无额外字段。turn 覆盖持续作用于后续 turn，因此关闭需显式恢复。
- Idea 当前显式 readOnly/networkAccess:false，场景 prompt 需说明执行模式以避免开启后仍宣称只读；动态业务工具确认继续由应用校验。
- 已定稿结果：设备统一布尔开关，默认 false；每次接受消息、新 Run、终端接力捕获；开启 never + dangerFullAccess，关闭恢复常规审批与场景沙箱；不改全局 Codex 配置。

文档归属分析：并入现有 distribution 配置域、desktop-execution 技术域、automation-workspace 账号覆盖层，无新平行文档；变更后均低于 500 行。交互为现有设置策略的输入扩展，原保存/失败恢复语义复用。

fact_result: arckit-fact-result/v2, managed_case, CASE-20260915-002 / GAP-20260915-002-001, updated。

document_scope:
- spec/arcorbit-distribution.md：明确统一 YOLO 开关与覆盖、生效、保存边界。
- tech/arcorbit/desktop-execution-solution.md：明确字段、捕获边界、协议映射与线程恢复。
- interaction/automation-workspace/interaction.md、authentication.html：依据现有账号设置策略加入复选框、说明与保存状态投影。

此证据确认契约，尚不主张实现完成；实现与行为回归是开放义务。
