# 可信记账接口

本包的 `arckit.capability.json` 同时声明 Agent invocation 和 `runtime_entrypoints`。它们共享包身份，但调用权限不同：Host 下 Agent 提交语义结果，Runtime 调用可信写入；直接 Agent 使用同一包的脚本。不要假设目标业务项目含有 Arckit 维护源。

以目标项目根为 cwd，从本包 manifest 解析绝对入口路径。`schema/` 和脚本是精确字段、校验及 canonical 协议版本的权威来源。

| 入口 | 用途 |
| --- | --- |
| `project_state` | 初始化、审计和投影 Project |
| `project_iteration` | 维护 Iteration targets 与聚合 |
| `development_case` | Case 生命周期的确定性操作 |
| `loop_snapshot` | 兼容性、fresh canonical state、候选和 selection tokens |
| `case_control` | 接受语义 Case 创建或已完成 Case 绑定 |
| `case_transition` | 校验并提交完整 transition |
| `writeback` | 接受 Host 结果并物化 Semantic Case Command |
| `protocol_compatibility` | 只读 probe、校验与原子 reconciliation |

常用 CLI（`scripts/` 替换为实际包内绝对路径）：

```text
node scripts/project-state.mjs init|render|audit|validate|summary [record]
node scripts/development-case.mjs new|validate|audit|close ...
node scripts/loop-snapshot.mjs read [--after-commit <snapshot-token>]
node scripts/case-transition.mjs validate <transition.json|->
node scripts/case-transition.mjs apply --case <case.md> --transition <transition.json|-> [--dry-run true]
node scripts/protocol-compatibility.mjs probe
node scripts/protocol-compatibility.mjs validate|reconcile <reconciliation.json|-> [--dry-run true]
```

全新项目先查看初始化接口建立 Project，再读 snapshot。已有 canonical state 的缺失、不可读或不兼容应进入 [协议恢复](protocol-reconciliation.md)，不重新初始化覆盖原记录。

## Case control

`runtime-case-control.mjs` 导出 `applyRuntimeCaseControl({projectRoot, runtimeResult, snapshot, gate})`，Host 和直接调用方都必须先有当前授权、trusted snapshot 和结构合法的 `case_control_handoff`。精确契约见该脚本的 `validateCaseControlHandoff` 和 `semantic-case-control.mjs`。

创建声明 `arckit-case-control-handoff/v1`、`action: create_case`、observed Project revision、空 `case_id`、title/intent/expected_outcome、artifact_type、selection_reason、initial_facts/impacts/gaps 和明确来源的 review_policy。新关系用 local handles；Ledger 分配身份并原子注册，创建回执后的独立 snapshot 才提供可执行候选。

`bind_closed_case` 必须绑定真实 Case revision、source digest 和覆盖本次任务的证据，不能用口头完成声明替代验收。

## 写入与失败边界

Semantic Command 由可信物化器按显式 typed refs 分配身份和 revision、重建 selected candidate、展开反向引用并编译完整 transition；不从自然语言推断业务关系。缺失或冲突的主张退回 Agent，确定性实现失败归 Ledger。

每次正式提交在 Project lock 内 fresh-read，预检 Case/Project/Iteration、投影与索引，原子写入；失败回滚。不同 Case 的执行可独立进行，写入短暂串行。内容变化提升 `content_revision` 并使旧 clean Review 失效。

写入回执只证明已接受的结果，不提供下一候选。续轮遵循 [轮次边界](round-boundary-contract.md) 的 closeout 和 post-commit fresh-read。临时载荷与持久证据的区别见 [输入传输](transition-transport.md)。
