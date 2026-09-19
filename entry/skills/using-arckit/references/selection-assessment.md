# Gap 选择说明

选择前读取可信 `snapshot.state_definition`，在 opening 说明以下判断，并以同一含义提交 `planned_transition.selection_assessment`。Direct 与 semantic transport 使用相同结构；Ledger 保存到 Round 和 closeout。规则由场景定义提供，不能以此说明覆盖用户授权。

| 字段 | Agent 必须说明的内容 |
| --- | --- |
| `scope` | 当前纵向对象与授权边界：模块、业务切片、核心问题等 |
| `context_ref` | `null` 表示本轮提供完整稳定上下文；`case:round:N` 引用同一 Case 已接受第 N 轮的上下文，此时下述四项填 null |
| `maintenance_object` | 本项目实际维护的对象 |
| `implementation_carriers` | 承载该对象实现的文件、配置或其他载体；不按扩展名判断 |
| `activation` / `verification` | 实现如何生效、如何验证；当前不涉及执行时说明原因 |
| `invariant_refs` | 本 Gap 涉及的当前 Project 不变量 ID；业务 Gap 应映射；声明建立预期或正式兑现时程序要求非空，纯控制、恢复可为空并说明 |
| `conclusion_kind` | 表达本轮接受的结论性质：`exploration` 证据或候选，`establishment` 有依据的正式结论；不把工具方法当作阶段标签 |
| `acceptance` | 本 Gap 可共同决定、共同验收的结果集合，不能藏入下游独立决定 |
| `prerequisites` | 执行本 Gap 所必需的局部前置与共享依赖，每项含 `statement`、`status: satisfied`、非空 `evidence` |
| `expected_fact_refs` | 已接受且足够指导本轮正式实现的预期事实引用；声明正式兑现时必填；这是 Agent 的来源声明，非空引用不等于内容已核验 |
| `establishes_expectations` | 本轮是否正式建立或改变预期事实 |
| `delivers_realization` | 本轮是否正式兑现实现事实 |
| `boundary_reason` | 为什么这样拆分或合并；为何满足场景规则与前置条件 |
| `deferred` | 尚未处理的已知义务及其承接 Gap / 交接；没有则空数组 |

前置指执行**当前 Gap**的条件，不是整个任务的全部未决条件。未满足的条件不能填写为 satisfied；应选择该前置问题为 Gap，或在没有其他可执行工作时交接。空前置数组不代表所有预期均已具备，正式兑现仍须给出有效的预期引用及充分性说明。剩余未知会改变当前外部行为、关键约束或验收标准时，相关前置仍不充分；清楚有效的用户要求可以直接作为依据，不为文档齐全多开一轮。

稳定上下文包含 maintenance_object、implementation_carriers、activation、verification，首次记录后可用 context_ref 引用，Ledger 校验同一 Case 已接受轮次并解析上下文。每轮确认引用对当前范围仍适用；变化时提供完整新上下文。scope、acceptance、前置、预期引用和未决义务始终由本轮判断，不继承上一轮选择。源事实可引用 Project/Case 的持久载体，无需重复抄写。

探索与正式建立适用于所有事实方向。性质描述当前 Gap 要验收什么，不描述每次工具动作；正式实现中为兑现既定预期所需的常规调查、排障与测试，不自动成为独立探索 Gap；重要独立因果问题或动摇当前前提的失败按场景规则重选。探索可以修改真实实现载体，但产物只是候选或实验：记录实验范围、假设、观测结果和后续处置。可靠排除某方案也可以完成探索；未取得约定证据则 partial。正式兑现仍须依据已接受的相关预期；若原 Gap 只验收取证结果，不能顺带接续下游决定或兑现。取证如果只是完成同一既定局部决定的方法，可在该结果边界内完成比较与采纳。是否重选取决于前置和决定边界，不以“已有文件”替代验收。

`establishment` 不等于实现：正式建立诊断结论、控制变更或 Review 时两个布尔值都可为 false。探索时两个值必须为 false。软件场景中，建立/改变预期与正式兑现不能在同一个 Gap；沿用已接受预期不算重新建立，无需为此多开一轮。该边界覆盖同一 Gap 的全部已记录轮次，不能通过 partial 先建立预期、再在原 Gap 正式兑现；探索标签不单独禁止续轮形成正式结论：Agent 必须说明仍是同一结果、前置已具备且没有跨越重要决策边界；需要另行选择的独立结果或重要决定首次具备资格，或已接受预期、关键前提、责任、验收边界需重定时提交并重选；同一验收内的动作依赖就绪及约束内的实现手段调整不单独触发重选。需要改变原结果边界时保留已完成证据及剩余义务，按重新界定规则提交、fresh-read 后重选；边界不变则继续证明原结果。历史无声明的轮次不凭文字猜测性质。

Ledger 检查结构、已声明前置、不变量 ID 存在性及显式冲突；expected_fact_refs 和普通 evidence 当前只校验字符串结构，不检查外部载体存在、接受状态或语义充分性，不能证明文本语义真实或预期确已充分。Agent 必须依据当前事实作出判断，维护权威载体，并由后续反证与 Completion Review 复核；Runtime 不按路径、词语或文件类型替代判断。
