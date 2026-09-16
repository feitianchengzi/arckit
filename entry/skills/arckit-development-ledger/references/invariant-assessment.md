# 软件不变量的判断与事实维护

首次构造 invariant assessment、发现反证或准备恢复 upheld 时读取。本文件只解释通用字段语义；实际集合、数量、名称、适用条件和条文始终从 trusted Project snapshot 读取并由 Agent 理解。初始化或维护模板时读取 [software-invariants.json](../templates/software-invariants.json)；提示词、脚本和 Host 不复制其具体内容或按 id/顺序预设判断。

## 必需的下限

不变量是下限不是上限，是保障不是限制 Agent 推理的边界，也是必须的不是可选的。每轮显式考虑完整 catalog；必须考虑不等于每轮修改所有文档、完成所有维度或新建一个 Gap。Gap 还可以来自用户要求、执行反馈、依赖和外部条件，不要求先证明某项不变量不成立。

`applies_when` 依据 Case 目标、相关预期、当前事实和未决问题判断，不仅依据本轮新增事实，更不从计划编辑哪些文件倒推。`must_hold` 是该维度应成立的条件；`evidence_expectation` 是其独立的证据责任。`priority: required` 表示必须审视和处置，不表示当前轮必须解决或比其他候选优先。

## 两个时刻、同一判断过程

选择前识别各维度的具体责任，以现有事实和证据显露问题，作为候选发现和比较的输入之一。开轮显式给出各项的适用对象、当前依据或未决问题；可简短，但不能仅报“已检查”。这不是新增 Review 阶段，也不需要重复提交两套 assessment。

提交时按本轮实际证据形成完整 assessment。每项 reason 说明“本 Case 具体考虑什么、证据支持什么、什么仍未解决”；fact_refs、evidence、gap_refs 分别绑定事实、持久证据和未决处置。不同维度可以引用同一载体，但不能用另一维度的证据责任替代本项责任。结论未改变时说明新事实为何不改变原依据，不能机械复制上一轮判断。

## 状态含义与混合结果

- `not_relevant`：当前目标和事实未触及该责任，且没有本 Case 仍待处理的相关义务；说明依据，不以“本轮不做”代替不相关。
- `upheld`：在明确适用范围内，该维度要求得到充分支持，已知相关反证已处置；它不是项目永久无问题，也不是全部工作完成。
- `undetermined`：相关但证据不足或必要决定未形成，关联具体开放 Gap。
- `threatened`：有具体证据显示违反要求，或原成立条件被变化破坏，关联具体开放 Gap。

同一维度包含多个主张时，在 reason 中分别交代已成立和未决部分，并绑定对应证据及 Gap；存在范围内必要未决部分时，不得用已完成的一部分将整项判为 upheld。有已知违反时用 threatened，其余证据不足用 undetermined；这种判断由 Agent 做，不由 Ledger 分析文本。

各项分别按当前定义判断；一项成立不推出另一项成立。文件存在、行为变化或测试通过是否足以支持主张，取决于该项实际的 must_hold 和 evidence_expectation，不从名称或其他项的判断推导。

专业 skill 的结果只提供相应范围的事实与证据，不直接决定不变量状态。事实维护结果 `not_applicable` 不等于 Case 不变量 `not_relevant`，`updated` 或 `confirmed_existing` 也不等于 `upheld`。Agent 读取当前定义并结合全部相关证据判断，不按 skill 名称、输出枚举或文档是否更新自动映射。

## 新事实、反证与文档

发现 failure、Review finding 或其他反证时，Agent 重审它实际触及的所有相关维度；不只更新最直观的一项，也不自动把全部维度改为 threatened。说明旧主张是被否定、范围缩小还是仍有独立依据。风险存在的证据不能证明风险已受控，测试总数不能替代具体主张的验证。

已建立或改变的结论在当轮同步到适当的权威事实载体；优先维护已有文档，不为 catalog 齐全制造新文档。文档维护属于同一结论的闭合，不是额外固定 Gap，也不拖到 Case 最后统一补。只有相关独立问题未解决时才形成必要 Gap；不为使全部判断 upheld 顺带决定其他领域。

## 当前定义与历史判断

新判断依据当前可信 snapshot 中的定义；旧轮次保留其 Project revision 下的含义。遇到定义不兼容时按 [protocol-reconciliation.md](protocol-reconciliation.md) 恢复，不直接沿用旧判断。Ledger 只检查覆盖、引用、freshness 和处置结构，不证明语义判断正确。
