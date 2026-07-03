---
name: arckit-evaluation
description: 维护 arckit/evaluation/ 下的真实研发活动评测场景、覆盖矩阵、试跑记录和提升建议。默认由 using-arckit 在判断本轮需要新增、更新、执行或复盘评测材料时路由触发；也可在用户明确点名本 skill、维护本 skill 本身或隔离测试时直接使用。不直接维护 spec、tech、skill 文件或任务计划。
---

# Arckit Evaluation

本 skill 维护真实研发活动评测集。它把用户输入、模拟场景、试跑偏差和覆盖结论保存在 `arckit/evaluation/`，用于验证 Arckit 产品方案、skill 体系和 Code/Skill 类最终产物是否覆盖真实软件研发活动。

## 硬约束

- 评测场景是过程产物，不是产品规格、技术方案、任务计划或 workflow memory。
- 不因场景看起来合理就直接写入 `arckit/spec/`、`arckit/tech/`、skill 文件或治理文档。
- 当用户要求“只做评测”“模拟真实场景”“验证产品方案是否覆盖”“不要改代码/skill/spec”时，本 skill 可以作为本轮主要产物承载。
- 评测结论需要提升为稳定事实、任务、pending 或 workflow memory 时，只输出 handoff，不直接替代对应结果型 skill。
- 场景必须区分 Code 类最终产物和 Skill 类最终产物；两类场景的验收对象、实现证据和失败判断不同。

## 主流程

### 1. 判定评测目标

输入：用户请求、产品方案、skill 架构、已有评测材料、实际试跑结果或真实研发反馈。

动作：
- 判断本轮是新增场景、更新场景、执行评测、复盘偏差、补覆盖矩阵，还是把评测结论提升给下游。
- 明确评测对象：产品方案、入口路由、单个 skill、多个 skills 工作流、Code 类最终产物、Skill 类最终产物或工作方式。
- 明确最终产物类型：`code`、`skill`、`mixed` 或 `unknown`。
- 明确本轮禁止触碰范围，例如不改 code、不改 skill、不改 spec、不改 tech。

退出条件：评测目标、对象、最终产物类型和写入边界明确。

### 2. 读取评测结构

动作：
- 读取 `arckit/evaluation/INDEX.md`。
- 读取目标目录下的 README、评测模型、场景总览和相关场景文件。
- 如果是新增场景，优先选择已有目录和文件结构；没有合适结构时再新增文件。
- 如果是复盘偏差，读取对应场景、覆盖发现和实际试跑证据。

退出条件：知道应更新哪些 evaluation 文件，以及是否需要同步索引或覆盖发现。

### 3. 维护场景或覆盖结论

动作：
- 新增或更新场景时，保留真实或近似真实的用户输入，不只写抽象类型。
- 每个场景至少包含：场景编号、场景名称、最终产物类型、用户输入样本、真实研发活动、本轮真实目标、期望能力组合、期望产物、期望沉淀路径、验收重点、当前风险或疑问、评测状态。
- 执行评测时，记录实际 Agent 行为、符合项、偏差、缺失能力、错误路由、事实污染风险和建议提升路径。
- 维护覆盖结论时，区分产品方案问题、skill 边界问题、description 触发问题、handoff 断点、验证缺口和治理链路缺口。

退出条件：评测材料能被后续 agent 用来复测，而不是只保留一次性讨论摘要。

### 4. 提升判断

动作：
- 判断评测结论是否仍停留在 evaluation。
- 需要稳定化为产品规格时，输出给 `arckit-spec` 的 handoff。
- 需要稳定化为技术方案时，输出给 `arckit-tech` 的 handoff。
- 需要生成任务或纳入迭代时，输出给 `arckit-project-governance-workflow` 或 `arckit-iteration-planning` 的 handoff。
- 需要保留未决问题时，输出给 `arckit-pending` 的 handoff。
- 需要改变协作方式时，输出给 `arckit-workflow-memory` 的候选信号材料。

退出条件：每个评测发现都有去向：留在 evaluation、进入 handoff、或明确不处理。

### 5. 收口

动作：
- 更新必要索引、行数和覆盖发现。
- 汇报 changed evaluation paths、评测对象、覆盖结论、提升建议和未处理风险。
- 如果本轮实际执行了场景试跑，说明证据来源和可信度；没有试跑时，不把分析写成验证通过。

退出条件：用户能知道本轮评测材料更新了什么，哪些结论只是评测发现，哪些需要后续提升。

## 输出

```yaml
evaluation_handoff:
  scope: ""
  target_type: code|skill|mixed|unknown
  evaluation_paths: []
  scenarios_created: []
  scenarios_updated: []
  coverage_findings: []
  promotion_candidates:
    spec: []
    tech: []
    governance: []
    pending: []
    workflow_memory: []
  result: updated|analyzed_only|blocked
  residual_risks: []
```
