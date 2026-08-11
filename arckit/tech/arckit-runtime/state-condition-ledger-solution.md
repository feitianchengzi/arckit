# Software Definition Ledger 方案

## 元信息

- 路径：`tech/arckit-runtime/state-condition-ledger-solution.md`
- 技术领域：`arckit-runtime`
- 状态：✅ 已采用
- 支持功能：`spec/agentic-software-development/product-concepts.md`、`spec/agentic-software-development/controller-worker-loop.md`
- 影响设计：无用户界面或视觉表面变化
- 关联模型：Project State v5、Development Case v5、Case Transition v8、Ledger Snapshot v1、Round Closeout v2、Iteration State v3
- 变更历史：
- 2026-08-11：增加 invariant-guided round assessment、单 acceptance claim Gap 边界、后续工作隔离与 Case closure coverage。
- 2026-08-11：增加 trusted snapshot、snapshot-bound candidate comparison、独立 round closeout 与 post-commit fresh-read；协议恢复入口解除 Case 注册前死锁。
- 2026-08-11：增加 candidate/fresh Gap 选择；将 invariant 收束为 accepted-transition 约束，并确立 Completion Review 为唯一显式语义自查。
- 2026-08-10：用 advancement + 明确软件定义清单 + 独立软件不变量替换 completeness dimension/condition 模型。

## 方案概述

Project State 分成三个正交层次：

1. `advancement`：当前 Iteration、未完成 Cases、真实 Project gaps 和选择下一事项所需的上下文。
2. `software_definition`：协议明确列出的 15 项软件能力决策，以及当前项目对每项的具体结论与证据。
3. `software_invariants`：持续指导 Case Loop 显式判断发现、并约束所有被接受 Case transition 的六条抽象正确性要求。

这套设计没有 facet 状态机，也不让通用 skill 写死产品、交互、视觉、技术、代码和测试流程。清单属于具体 State；skill 只提供“恢复全部相关信息、比较动态 Gap、完成一个 Gap、提交 transition、fresh-read 继续”的通用算法。

Canonical 协议只接受：

- `project-state-record/v5`
- `iteration-state-record/v3`
- `development-case-record/v5`
- `arckit-case-transition/v8`
- `arckit-ledger-snapshot/v1`
- `arckit-round-closeout/v2`

不保留旧协议的业务执行兼容分支。trusted snapshot 首先做协议探测；若 canonical State 不兼容，则返回结构化 compatibility receipt 而不是进入 Case Loop。Agent 可在尚无可注册 Case 时通过 manifest 声明的协议恢复入口执行最小 reconcile，再重新调用 snapshot。协议升级因此不依赖 active Case 或 Case transition，不会形成“先升级才能注册、先注册才能升级”的循环。

## Project State v5

### Advancement

```yaml
advancement:
  active_iteration_ref: arckit/project/iterations/ITER-....record.json
  active_case_refs: []
  project_gaps: []
  selection_context:
    current_focus: ...
    project_priorities: []
```

Project 只引用未完成 Case；closed Case 历史由 Case INDEX 和 Iteration 保存。Project gap 只在项目确有长期缺口时创建，不由每个 `open` decision 自动生成，也不直接成为固定 Worker 任务。

### Software definition

协议在 `scripts/project-software-definition.mjs` 中固定以下 decision areas：

- `product_intent_and_scope`
- `product_capabilities`
- `runtime_surfaces`
- `experience_and_interaction`
- `visual_language`
- `identity_and_access`
- `data_and_state`
- `external_integrations`
- `feedback_and_support`
- `commercialization_and_entitlement`
- `technical_foundation`
- `security_privacy_compliance`
- `quality_and_validation`
- `delivery_and_distribution`
- `observability_and_operation`

每项包含稳定 question、decision expectation、evidence expectation、当前 decision 和 gap refs：

```yaml
id: technical_foundation
question: Which technology stack, architecture shape, build system, and engineering organization does the software use?
decision_expectation: ...
evidence_expectation: ...
decision:
  revision: 3
  status: settled
  statement: ...
  reason: ...
  evidence: []
  confidence: high
  resume_condition: ""
gap_refs: []
```

状态语义：

- `open`：尚无可靠结论，可以没有 gap。
- `settled`：这个决策本身清楚，statement/reason/evidence 完整。
- `deferred`：当前明确不决策，必须有 reason 和 resume condition。
- `stale`：旧结论因新事实失效，必须由 Project gap 承接。

“settled”不混入“是否与代码对齐”。后续实现 Gap 必须读取全部相关 decisions；若实现偏离，它属于 Case fact/impact/gap。产品决策在自己的 Gap 中清楚就是清楚，无需增加后续 facet 复查状态。

### Software invariants

`scripts/project-invariants.mjs` 固定六条不可删除、改写或退役的核心不变量：

- `product-expectations-remain-recoverable`
- `interaction-expectations-remain-recoverable`
- `visual-language-remains-consistent`
- `technical-decisions-remain-explainable`
- `accepted-facts-are-realized`
- `material-risks-have-credible-evidence`

这些不变量既约束当前 transition 能否被接受，也作为每轮从 fresh Project/Case state 发现显式判断的抽象指导。Applicability 由 fresh facts 是否建立、改变、否定、暴露缺失、使既有内容过时、产生歧义或冲突决定，不从 planned transition 的动作或实际编辑对象倒推。

产品、交互、视觉和技术四条分别维护对应权威长期预期或决策；realization 判断现实软件状态是否兑现相关事实；risk 判断重要风险主张是否有可信依据。三类证据责任不能相互替代。它们不形成六个轨道，也不映射固定 skill、路径、工件或顺序；Agent 结合当前 Case facts、既有 round judgments、稳定事实源和原生 skill 能力，判断某条不变量是否实际相关，以及是否暴露新的结果 Gap。

核心定义以 Case Loop 和 accepted transition 为作用域；协议升级可通过 `sync_core` 精确同步 canonical 定义，项目不能任意改写。技术栈、框架、模块、文件、某条产品需求和一次 Case 发现是 decision/fact/evidence，不是新不变量。同一不变量在不同 round 可以从 `not_relevant` 或 `upheld` 重新变成 `threatened` 或 `undetermined`，历史判断不形成一次性完成标记。

## Development Case v5

Case 维护 accepted facts、实际相关的 target impacts、dynamic gaps、问题、handoff、content revision 和完成态 Review。

Case 不复制 Project State。Project 保存跨 Case 的 decisions/invariants；Case round 保存当前事项基于 fresh Project revision 对全部 invariant 做出的显式 assessment。assessment 不是 artifact checklist，而是可审计地证明本轮没有把“未考虑”静默解释成“不相关”。

### Target impact

```yaml
id: IMPACT-001
fact_id: FACT-001
fact_revision: 1
target:
  kind: software_decision
  ref: technical_foundation
  revision: 3
effect: threatened
reason: ...
gap_ids: [GAP-TECH-CONTRACT]
evidence: []
```

Target 可以是 `software_decision` 或 `software_invariant`。Impact 只在当前事实或 transition 已经实际影响 target 时建立，不在 Case 创建时预测 scope，也不因 invariant applicable 就强制建立。Decision impact 必须绑定当前 decision revision；核心 invariant 的 revision 为 `null`。`upheld` 必须有证据；`threatened` 和 `undetermined` 必须由至少一个 open gap 承接。

### Dynamic gap

Gap 只保存可验证结果的 goal、reason、derived_from、blocked_by、开放 priority basis、responsibility、evidence requirement 和 resolution。诊断、产品定义、文档维护、实现、测试和交付使用同一结构；不包含 facet、skill、allowed path、固定工作类型或把“实现、跨产物一致性、规格、测试”预排成下一轮路径的复合步骤。实现方式属于本轮 `planned_transition`，下一轮仍从 fresh state 独立判断。

Audit 从全部 `open` 且依赖闭合的 gaps 派生无序 candidate set。当前 Agent 每轮从 fresh state 结合 Project decisions/invariants、Case facts、上一轮 judgments 与稳定事实源发现 fresh candidates，再根据阻塞、风险、信息增益、依赖、用户影响和可验证性选择下一项。根因未知的 bug 通常先产生诊断 Gap，是事实与不确定性驱动结果，不是 code invariant 或 diagnosis facet。

每个 Gap 只建立一个可独立接受的 claim。证明该 claim 所需的调查、编辑、构建或测试可以留在当前 round；执行中产生的新事实只进入 facts、impacts、invariant assessment 和后续 gaps，不授权当前 round 改做另一个独立结果。selected gap resolved 或确定为 partial/blocked 后立即进入 transition；下一项工作只能在 closeout 后从 fresh snapshot 重新选择。

## Case Transition v8

```yaml
schema_version: arckit-case-transition/v8
case_id: CASE-YYYYMMDD-NNN
case_updated_at: ...
project_revision: 12
gap_selection:
  mode: candidate
  basis: ...
  snapshot_token: sha256:...
  selected_ref: case-gap:CASE-YYYYMMDD-NNN:GAP-001
  comparison_summary: ...
  fresh_discovery_summary: ...
  considered:
    - { ref: case-gap:CASE-YYYYMMDD-NNN:GAP-001, source: persisted, eligibility: ready, disposition: selected, priority_basis: ..., reason: ... }
selected_gap: {}
planned_transition: {}
invariant_assessment:
  project_revision: 12
  judgments:
    - invariant_ref: technical-decisions-remain-explainable
      disposition: threatened
      reason: A newly accepted technical fact may make the stable contract stale.
      fact_refs: [FACT-003]
      evidence: []
      gap_refs: [GAP-TECH-JUDGMENT]
accepted_state_delta: {}
project_state_delta:
  software_definition_changes: []
  software_invariant_changes: []
  project_gap_changes: []
  selection_context_change: null
  evidence: []
evidence: []
unresolved: []
round_outcome: completed
case_resolution: {}
```

`invariant_assessment.judgments` 对 snapshot 中全部 Project software invariants 恰好覆盖一次。每项 disposition 为：

- `not_relevant`：本轮 facts 与 selected gap 不触及该不变量；必须说明原因，不能以缺失代替。
- `upheld`：当前 facts 与证据已经满足该不变量；必须有持久 evidence。
- `threatened`：当前 facts 已证明相关预期受到威胁；必须引用 facts 与至少一个在 apply 后仍 open 的 result Gap。
- `undetermined`：当前 facts 已证明该判断相关但证据不足；必须引用 facts 与至少一个在 apply 后仍 open 的调查或澄清 Gap。

assessment 绑定 observed Project revision。Ledger 只校验 invariant 引用全覆盖、disposition 结构、fact/gap 引用和 evidence 闭合，不判断某条 invariant 是否语义相关，也不把 invariant 映射到 Tech、Spec、代码、测试、skill 或路径。Agent 可在后续 round 用新 facts 将过去的 `not_relevant`/`upheld` 判断重新声明为 `threatened`/`undetermined`；round history 保留重新打开的依据。

`gap_selection` 记录 snapshot catalog 中全部 persisted candidates 与本轮 fresh gap 候选，逐项给出 eligibility、priority basis 和 selected/deferred/excluded 理由。Ledger 对当前 Project gaps 与所选 Case persisted candidates 做强覆盖校验；其他 Cases 的条目保留为选择审计但不进入并发锁。`mode=candidate` 时 selected gap 逐字段复现 snapshot catalog；`mode=fresh` 时原子创建并关闭一个此前未持久化、Agent-owned、无未闭合依赖且本轮已完成的普通 Gap。两种模式都只关闭 selected gap；`gaps_added` 仅持久化本轮新事实已经暴露但仍未解决的结果 Gap，不作为未来 Loop 计划，也不能在本轮继续执行。任何一轮都可以提交相关 Project delta，不等待 Case resolved：

- 产品或技术结论在被真正澄清的当轮更新对应 decision。
- 新事实使旧决策失效时标记 stale 并绑定 Project gap。
- 实现或验证轮可以更新 Project gap 与 selection context。
- 非核心 invariant 的 add/update/retire 也走显式 change。

Decision change 绑定 observed decision revision并递增；整个 transition 同时绑定 Case-scoped snapshot token 与 observed Project numeric revision。Trusted ledger 在跨进程 Project lock 中重新读取 snapshot、验证 persisted candidate 覆盖与选择 token，并原子写 Case、Project、Iteration、投影和索引；任一步失败全部恢复。Case-scoped selection token 允许无相互影响的 Cases 独立推进，而 Project revision 或所选 Case candidate 变化会 fail closed。

这保证“当前 Gap 做清楚什么，就把对应长期事实当轮沉淀”，而不是常规依赖最终 Review 补文档，也避免 Case 结束时一次性猜测所有 Project 影响。

## Iteration State v3

Iteration 保存：

- `targets`：引用 `software_decision`、`software_invariant` 或 `project_gap`。
- `accepted_project_changes`：每次 transition 实际接受的 Project change 摘要、Case ref 和 evidence。
- acceptance、remaining/blocking Project gaps、active/closed Case refs。

Iteration 不保存 Loop prompt、next responsibility、Worker 顺序、dimension 同态状态或 Runtime 日志。

## Completion Review

普通 gaps、问题、handoff、threatened/undetermined impacts 全部闭合，且最新 accepted content round 已对当前 Project invariant catalog 完整 assessment、没有未承接的 `threatened`/`undetermined` judgment 后，ledger 才派生唯一 Review candidate；若 fresh state 暴露了更重要的普通工作，Agent 先用 fresh Gap 完成它。Completion Review 是最终实现复审，不替代每轮 invariant-guided 显式判断，只重点检查：

- implementation correctness
- problem resolution
- verification credibility
- regression risk
- minimality

Finding 转成普通动态 Gap；修复提升 content revision，再审查新 revision。普通 Gap 的 evidence requirement 和 ledger validation 属于执行证明与确定性协议校验，不是其他自查阶段。Review 是最终兜底；clean 并关闭 Case 后只允许 Git-only closeout，不再检查、验证、编辑或修复内容。

## Runtime 集成

Ledger manifest 的 `loop_snapshot` 是直接 Codex 与 Runtime 共用的 trusted read entrypoint。其 `arckit-ledger-snapshot/v1` receipt 提供完整 Project software decisions、invariants、advancement，全部 active Cases 的 facts/impacts/open/ready gaps、最近 invariant assessment、candidate catalog、revisions、source digests 与 snapshot tokens。Runtime 只消费该 receipt，不自行解析 canonical record、派生 candidate 或重写 freshness 规则，也不维护 decision/invariant 到 skill、artifact、path 或 action 的映射。

同一 Agent：

1. 恢复用户增量、trusted snapshot receipt 与全部相关工程事实。
2. 选择或创建一个 Case。
3. 用 Project decisions/invariants、fresh Case facts 与原生 skills 发现 fresh candidates，可见地比较并选择最值得优先处理的一项。
4. 动态使用必要 skills/tools，只完成并验证该 Gap 的单一 acceptance claim。
5. 提交 Case delta、完整 invariant assessment 与由该 Gap 直接建立的 Project delta；新暴露的 Gap 不在本轮执行。
6. trusted writeback 返回独立 `arckit-round-closeout/v2`：列出本轮 accepted delta、invariant judgments、证据和 resulting revisions，但明确不投影 next candidate。
7. Host 展示 closeout 后，以 `post_commit_snapshot_token` 调 `loop_snapshot --after-commit`；只有返回 `observed_after_commit=true` 的 receipt 才能自动续轮。

只有 human responsibility 暂停。External responsibility 保持可恢复；仍有 agent-ready gap 时继续。生产性轮数、总墙钟和长命令耗时不是停止条件。

## 验收口径

- Project v5 明确保存完整 15 项软件定义清单，通用 skill 不复制这份业务清单。
- Project v5 独立保存六条核心软件不变量，不再出现 completeness dimensions 或 desired conditions。
- Case v5 不包含 facet、maturity、alignment、diverged 或事实域 not-required checklist；round 只保存对 Project invariant catalog 的 fresh assessment。
- Decision 自身是否清楚，与后续实现是否正确分开表达。
- 每个被接受的 Gap transition 都能立即原子沉淀相关 Project change。
- 文档、诊断、实现和验证按实际依赖自由排序；文档应在负责其事实的 Gap 中更新。
- Runtime、output schema、gate、ledger 和 Desktop 只接受当前 v5/v3/v7 与 snapshot/closeout v1 协议。
- 直接 Codex 与 Runtime 通过同一 ledger manifest、trusted snapshot/transition entrypoints 和 receipts 工作；Runtime 不复制候选、revision、fresh-read 或 closeout 的 canonical 机制。
- 每轮用 Project invariants 与 fresh Case facts 动态发现 candidate/fresh Gap，并提供完整可见比较轨迹；不依赖上一轮预排 impacts、事实域、复合步骤 Gap 或 gap 链。
- 每个 Gap 只建立一个独立 acceptance claim；新 facts 只能写入 delta 并暴露下一轮候选，不能扩大本轮执行。
- 每个 accepted content round 完整覆盖当前 invariant catalog；实际相关判断必须 upheld 或由 open Gap 承接，后续 facts 可以重新打开历史判断。
- writeback 后先显示独立 closeout，再完成可验证 post-commit fresh-read；内存 candidate 或 writeback result 不能充当 fresh state。
- Completion Review 是唯一显式语义自查，且 Case resolved 后 closeout 只处理 Git。
- 自动续轮直到 resolved；只有 human responsibility 请求人类介入。
