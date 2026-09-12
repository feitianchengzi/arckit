# Protocol Compatibility Recovery

仅当 trusted ledger compatibility probe 返回 `incompatible` 时读取。协议恢复是 canonical ledger 的可读性恢复事务，不是 Project advancement，也不创建维护 Case 或普通 Gap。

## 触发与分类

- `older_protocol`、`newer_protocol`、`unknown_protocol`、`missing_schema_version`：进入 `protocol_reconciliation`。
- `current_protocol_invalid`、`missing`、`unreadable`：进入 `current_protocol_repair`；不得把数据损坏伪装成版本升级。
- `compatible`：不得进入恢复模式，直接执行正常 Case Loop。

Host 只传递 compatibility、affected refs、expected schemas 与 snapshot token；它不选择转换策略。Runtime 可以提供 manifest-resolved binding；直接 Codex 未收到 binding 时，Agent 从已加载或已安装的 `arckit-development-ledger` manifest 解析 `loop_snapshot` 与 `protocol_compatibility`，使用同一 trusted scripts。Agent 必须读取 affected canonical records、当前 schema/canonical definitions、相关长期事实和必要源码，理解旧字段承载的真实语义。

## Agent 责任

形成 `arckit-protocol-reconciliation/v1` 候选 replacements。转换应满足：

- 保留可映射的项目意图、Case/Iteration identity、accepted facts、evidence、open work、questions、impacts 和 handoffs；不静默关闭或删除义务。
- 新协议要求但旧状态没有证据的内容保持 open/unknown，不编造项目事实。
- canonical core decision areas 与 software invariants 精确使用当前协议定义；项目具体结论仍放在 decision/fact，而不是伪装成 invariant。
- reconciliation 只恢复协议可读性，不顺带推进普通 Case 工作、解决普通 Gap 或完成 Completion Review。
- 每个 replacement 写明 semantic basis；仍有不能可信映射的不确定性时不得提交 trusted writeback，应按真实责任 handoff。

Agent 不直接编辑 canonical ledger。以当前授权 workspace root 为工作目录，使用 `arckit-development-ledger` manifest 声明的 trusted entrypoints 和 contract refs 执行 `read`、`probe`、`validate` 与 `reconcile`；不得假设目标业务仓库包含 Arckit 源码相对路径，也不得要求先注册 Case。stdin 或临时 JSON 只是 transport，不是持久 evidence。

## 成功与停止

trusted entrypoint 使用 snapshot token/source digest 防止并发覆盖，校验当前 schemas、跨记录引用和保真边界，并在 Project lock 内原子更新 records 与 projections。成功后必须重新调用 `loop_snapshot`；只有新 receipt 为 `available` 才继续原始用户事项，不得复用恢复前的 revision、candidate 或授权判断。

只有这些情况停止自动恢复：存在无法从事实判断的语义映射、可能丢失义务、需要人类接受风险，或受影响 canonical 内容无法安全重建。报告 affected refs、已确认事实、未决映射和恢复所需的最小输入。
