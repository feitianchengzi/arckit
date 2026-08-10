# State Condition Ledger 方案

## 元信息

- 路径：`tech/arckit-runtime/state-condition-ledger-solution.md`
- 技术领域：`arckit-runtime`
- 状态：✅ 已采用
- 支持功能：`spec/agentic-software-development/product-concepts.md`、`spec/agentic-software-development/controller-worker-loop.md`
- 影响设计：无用户界面或视觉表面变化
- 关联模型：Project State v4 additive conditions、Development Case v4、Case Transition v4
- 变更历史：
  - 2026-08-10：定义 condition-driven Project/Case/Loop 唯一状态协议与项目升级边界。

## 方案概述

Project State 在现有宏观 completeness dimension 上保存项目具体的 `desired_conditions`。Case State 不再预置 product、interaction、visual、technical、implementation、verification 六条 facet 轨道，而是保存 accepted facts、facts 对 Project conditions 的 impacts、实际动态 gaps、问题、handoff 和完成态复审。通用 Agent 从 fresh State 推导下一 gap，Runtime 不维护 condition 到 skill、路径或工作顺序的映射。

Project record 使用 `project-state-record/v4`，Case 使用 `development-case-record/v4`，transition 使用 `arckit-case-transition/v4`。这三者是 ledger 和 Runtime 唯一接受的 canonical state 协议。不符合当前协议的项目不进入 Runtime Loop；Agent 必须先基于该项目当时的真实需求、现有状态和实现证据显式完成升级。

## Project desired condition

每个 completeness dimension 增加可为空的 `desired_conditions`：

```yaml
desired_conditions:
  - id: observable-behavior-is-recoverable
    applies_when: 事项新增或改变用户可感知行为、业务规则或验收口径
    must_hold: 相关产品预期具有准确、可恢复的长期表达
    evidence_expectation: 足以恢复该预期及其依据的持久证据
    priority: required
    status: active
```

Condition 字段：

- `id`：dimension 内稳定且唯一的语义标识。
- `applies_when`：Agent 判断当前事实是否相关的条件，不是 Runtime 可执行表达式。
- `must_hold`：项目希望长期成立的软件性质。
- `evidence_expectation`：判断 upheld 或恢复 threatened 状态所需证据。
- `priority`：`required`、`recommended` 或 `informational`；只表达完整性权重，不是执行顺序。
- `status`：`active` 或 `retired`。retired condition 保留历史引用，不参与新影响判断。

Condition 不包含 skill、path、artifact owner、Worker、固定状态机或触发后的执行路线。项目通过 accepted Case closeout 的 `condition_changes` 增删或修订 condition；Runtime 不从任务关键词生成 condition。

## Development Case v4

Case v4 的主要结构为：

```yaml
schema_version: development-case-record/v4
id: CASE-YYYYMMDD-NNN
title: ...
status: active
artifact_type: mixed
user_intent: ...
expected_outcome: ...
facts: []
state_impacts: []
gaps: []
open_questions: []
pending_handoffs: []
content_revision: 0
completion_review: {}
rounds: []
case_resolution: {}
project_impact_candidate: {}
```

### Fact

```yaml
id: FACT-001
revision: 1
status: accepted
statement: 旧快照覆盖新数据的根因是恢复路径缺少版本比较
basis: 复现、日志和代码调用链
evidence: []
```

Fact 状态为 `accepted` 或 `superseded`。statement、basis 与 evidence 是语义事实和可恢复依据；分类、文档归属、skill 与文件位置不进入固定 schema。修改 statement、basis 或 evidence 时 revision 必须递增，并使引用旧 fact revision 的 impact 失效。

### State impact

```yaml
id: IMPACT-001
fact_id: FACT-001
fact_revision: 1
condition_ref: architecture_foundation.changed-contracts-remain-explainable
effect: threatened
reason: 必要修复引入新的版本冲突约束
gap_ids: [GAP-RECOVERY-CONTRACT]
evidence: []
```

Effect 为：

- `upheld`：相关 condition 仍然满足；必须说明理由并提供 condition 期望的证据。
- `threatened`：当前事实使 condition 不满足；必须至少引用一个 open gap。
- `undetermined`：当前证据不足以判断；必须至少引用一个调查、澄清或取证 gap。

Case 只保存 Agent 判断为实际相关的 condition impact，不复制所有 Project conditions，也不保存 not-required 结论。Ledger 校验 condition_ref、fact revision、evidence 和 gap 引用闭合，但不替 Agent 执行自然语言适用性判断。

### Dynamic gap

```yaml
id: GAP-DIAGNOSE
status: open
goal: 复现故障并取得足以证明根因的证据
reason: 根因未知，阻塞必要修复和影响判断
derived_from: [case_intent]
blocked_by: []
priority_basis:
  blocking: high
  uncertainty: high
  risk: high
  user_impact: high
responsibility: agent
evidence_required: []
resolution: null
```

Gap 字段：

- `status`：`open`、`resolved` 或 `cancelled`。
- `goal`、`reason`：具体缺少的结果及其来源。
- `derived_from`：Case intent、fact、condition、question、handoff 或 review finding 引用。
- `blocked_by`：同 Case gap id；依赖全部 resolved/cancelled 后才成为 ready candidate。
- `priority_basis`：开放语义对象，至少说明 blocking、uncertainty、risk 或 user impact 中一个真实依据；不计算固定分数。
- `responsibility`：`agent`、`human` 或 `external`。
- `evidence_required`：完成目标所需的持久证据。
- `resolution`：resolved/cancelled 时保存 outcome、reason、evidence 和 occurred_at。

Gap 不包含 facet、skill、allowed path 或工作类型。文档维护、诊断、实现、验证和交付 gap 使用同一结构。

## Case audit

Audit 按以下顺序派生：

1. 校验 facts、state impacts、gaps、questions、handoffs 和 review 结构。
2. 找出引用不存在或过期 fact revision 的 impacts，作为 invalid state 拒绝，而不是静默生成任务。
3. 校验 threatened/undetermined impact 至少绑定一个仍存在的 gap；gap 全部 closed 后，该 impact 必须在同一 transition 中更新为 upheld 或由新 gap 继续承接。
4. 找出 `status=open` 且 `blocked_by` 全部 closed 的 gaps，作为 unordered `candidate_gaps`。
5. open human gap 优先形成 human handoff；open external gap 只在没有 agent-ready gap 时形成 external wait。
6. 仍有 open gap 但无 ready gap 时派生 blocked 或 external wait，不伪造继续目标。
7. open questions、pending handoffs 或未闭合 impacts 均阻止完成态复审。
8. 全部普通工作闭合后派生唯一 `completion_review` candidate。
9. 当前 content revision 的 clean review 且无 open finding 时 Case resolved。

Candidate gap 是 open gap 的不可变语义快照，包含 id、responsibility、goal、reason、derived_from、blocked_by、priority_basis 与 evidence_required。Transition 必须逐字段复现；Case revision 或快照变化时 fail closed 并 fresh replan。

## Case Transition v4

```yaml
schema_version: arckit-case-transition/v4
case_id: CASE-YYYYMMDD-NNN
case_updated_at: ...
project_updated_at: ...
selected_gap: {}
planned_transition:
  goal: ...
  expected_state_change: ...
accepted_state_delta:
  resolved_gap: null
  facts_added: []
  facts_superseded: []
  impacts_added: []
  impacts_updated: []
  gaps_added: []
  gaps_cancelled: []
  resolved_open_questions: []
  completed_handoffs: []
  completion_review_result: null
  resolved_review_findings: []
  review_budget_extension: null
evidence: []
unresolved: []
round_outcome: completed
case_resolution: {}
project_impact_candidate: {}
```

普通 Agent gap transition 必须 resolve 当前 selected gap；同轮可以添加事实、更新实际 condition impacts 和发现后续 open gaps，但不能顺便 resolve 其它 gap。Human/external gap 可按责任协议完成、取消或转换。新增或修订事实如果与 Project condition 实际相关，Agent 在同轮形成 impact；threatened/undetermined 必须绑定现有或本轮新增 gap。

内容变化提升 `content_revision` 并使旧 clean review 失效。Completion review 不能与内容变化同轮提交。Review finding 使用普通动态 gap 承接；修复后重新审查当前 revision。

`project_impact_candidate` 在现有 dimension state changes 外增加 `condition_changes`：

```yaml
condition_changes:
  - action: add | update | retire
    dimension: architecture_foundation
    condition: {}
    reason: ...
    evidence: []
```

Condition change 只在 resolved Case closeout 且 Project revision 匹配时原子应用。Iteration 保存 condition change 摘要、closed Case ref 与 evidence，但不复制完整 condition 内容。

## Completion review

Review 发生在正常状态推进完成之后，不承担常规产品、交互、视觉、技术、代码或验证补齐。默认维度为：

- `implementation_correctness`：实现是否符合 relevant accepted facts 与 upheld conditions。
- `problem_resolution`：原始问题或目标是否真实闭合。
- `verification_credibility`：验证证据是否覆盖主要风险且可重复。
- `regression_risk`：是否引入未处理的回归或边界破坏。
- `minimality`：是否包含无必要修改或过度设计。

Finding 类型继续使用 error、omission、excess。Review 可以意外发现规格或设计遗漏，但该结果是补漏 finding，不是正常文档推进的主要机制。

## Runtime 集成

Runtime digest 为 v4 Case 提供 Project dimensions/conditions、facts、state impacts、open/blocked/ready gaps、questions、handoffs、review 和 recent transitions。它不维护 condition 到 skill、artifact、path 或固定 action 的映射。

`using-arckit` 使用通用控制算法：恢复 fresh facts；判断 changed facts 对哪些 Project conditions 实际相关；为 threatened/undetermined condition 形成 gap；比较 ready gaps 的阻塞、风险、信息增益、依赖、用户影响和可验证性；选择一个并动态发现 skills/tools/paths；完成后形成 transition。Runtime 只触发自然 skill invocation、校验 output shape、调用 trusted ledger 并 fresh-read 自动续轮。

自动执行持续到 Case resolved。只有 human responsibility 把控制权交给人类。External responsibility 保持可恢复等待；仍存在 agent-ready gap 时先继续可执行工作。生产性轮次、总墙钟与长命令时长不构成停止条件。

## 协议采用与项目升级

- Controller 创建 Case 时提供由用户意图和 fresh State 形成的 `initial_facts`、`initial_impacts` 与至少一个具体 `initial_gap`；Ledger 不从关键词补造。
- Runtime、ledger schema、audit、transition、digest 和 gate 只接受当前协议，不保留旧 Case 或 transition 的兼容分支。
- 目标项目的 canonical state 与当前协议不匹配时，Runtime 保持原错误并停止执行，不在读取、投影或写回时自动转换。
- 项目升级是独立、显式的语义工作：Agent 重新读取项目意图、当前证据和实现，再生成当前 Project conditions 与 Case facts/impacts/gaps，不把历史字段机械翻译为新状态。
- 历史 closed Case 可作为非 canonical 归档保留，但不再由当前 schema、audit、Runtime reader 或 transition 解释。

## 并发与安全

Case v4 继续绑定 Case `updated_at`；resolved closeout 与 condition changes 继续绑定 observed Project revision。不同 Case 可以并行执行，Project/Case/iteration/projection/index commit 在 Project lock 内短暂串行。Canonical evidence 不接受临时文件或 Runtime 宿主绝对路径。

Ledger 只验证结构、引用、revision、责任和证据存在性，不用代码启发式替代 Agent 的语义 condition 判断。Runtime 不读取 condition 文本生成权限、allowed paths 或 destructive action 授权。

## 验收口径

- 新 Case 不包含 facets、maturity、alignment、diverged、base_ready 或 not-required checklist。
- Project condition 内容改变后，相同通用 Agent skill 可以产生不同 gap。
- Bug 根因未知时可以形成 diagnosis gap；Ledger 不要求 diagnosis facet。
- 新事实威胁 Project condition 时必须由动态 gap 承接。
- 交互或视觉不受影响时不产生对应状态项或人工 not-required transition。
- 文档、实现、验证 gap 按真实依赖和风险自由排序。
- Runtime digest、output schema、gate 和 ledger 对 v4 端到端一致。
- 任何 active Case 和 transition 都必须使用当前 v4 协议，不匹配时 fail closed。
- 没有普通 gap 后才进入以实施质量为中心的 completion review。
- Agent 自动续轮直到 resolved；只有 human responsibility 要求人类介入。
