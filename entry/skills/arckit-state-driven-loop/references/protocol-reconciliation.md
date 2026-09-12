# Protocol Reconciliation

本机制只在 canonical Project、active Case 或 active Iteration 无法满足当前协议时启用。它提供确定性的发现和提交边界，不编码 `vN -> vN+1` 字段映射；转换语义由同一 Agent 根据旧记录、当前 schema、长期事实与源码决定。

## Probe

`protocol-compatibility.mjs probe` 输出 `arckit-ledger-compatibility/v1`：

- `compatible`：canonical state 可进入正常 Case Loop。
- `older_protocol` / `newer_protocol` / `unknown_protocol` / `missing_schema_version`：协议版本不一致。
- `current_protocol_invalid`：版本号当前，但内容不满足当前 validator。
- `missing` / `unreadable`：canonical object 缺失或无法解析。

Probe 扫描 Project 明确引用的 active Case/Iteration，并补充 active Case 目录，输出每个对象的 `source_digest`。`snapshot_token` 绑定完整 observed set，防止恢复期间外部修改被覆盖。

## Agent 责任

形成 `arckit-protocol-reconciliation/v1` 候选 replacements。转换应满足：

- 保留可映射的项目意图、Case/Iteration identity、accepted facts、evidence、open work、questions、impacts 和 handoffs；不静默关闭或删除义务。
- 新协议要求但旧状态没有证据的内容保持 open/unknown，不编造项目事实。
- canonical core decision areas 与 software invariants 精确使用当前协议定义；项目具体结论仍放在 decision/fact，而不是伪装成 invariant。
- reconciliation 只恢复协议可读性，不顺带推进普通 Case 工作、解决普通 Gap 或完成 Completion Review。
- 每个 replacement 写明 semantic basis；仍有不能可信映射的不确定性时不得提交 trusted writeback，应按真实责任 handoff。

Agent 不直接编辑 canonical ledger。以当前授权 workspace root 为工作目录，使用 `arckit-state-driven-loop` manifest 声明的 trusted entrypoints 和 contract refs 执行 `read`、`probe`、`validate` 与 `reconcile`；不得假设目标业务仓库包含 Arckit 源码相对路径，也不得要求先注册 Case。stdin 或临时 JSON 只是 transport，不是持久 evidence。


## Reconciliation 输入

`arckit-protocol-reconciliation/v1` 包含：

- `observed_snapshot_token`、恢复原因、持久 evidence 与 preservation claims。
- 每个 incompatible canonical object 的完整 replacement：ref、kind、observed/target schema、source digest、当前协议 record、semantic basis 和空 uncertainties。
- 可额外包含为保持跨记录一致性而需要同步更新的 compatible canonical object，但不能写入 probe 之外的路径。

具体结构见 `schema/protocol-reconciliation.schema.json`。仍有 uncertainties 时不要提交；由入口 Agent按真实责任 handoff。

## Trusted 验收

`validate` 和 `reconcile --dry-run true` 均不写文件。正式 `reconcile` 在 Project commit lock 内重新 probe 并执行：

1. 绑定 snapshot token、每个 source digest、observed kind/version 和允许路径。
2. 要求所有 incompatible refs 都有 replacement，且全部 records 通过当前 validator。
3. 校验 Project active refs、Case project ref/impact targets/decision revision 和 Iteration targets。
4. 保留 Project/Case/Iteration identity，不降低 Project revision，不擦除已识别的项目/Case intent，不静默移除 accepted fact、open gap/question 或 pending handoff id。
5. 原子写入 canonical records，重建 Project/Case/Iteration projections 与 indexes，再次 probe；失败恢复全部原内容。

成功结果是 `arckit-protocol-reconciliation-result/v1`。它不是 Case transition，不推进 Project State，也不替代恢复后的 fresh-read。
