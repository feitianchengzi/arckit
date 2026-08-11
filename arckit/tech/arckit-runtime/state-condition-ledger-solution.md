# Software Definition Ledger 方案

## 元信息

- 路径：`tech/arckit-runtime/state-condition-ledger-solution.md`
- 技术领域：`arckit-runtime`
- 状态：✅ 已采用
- 支持功能：`spec/agentic-software-development/product-concepts.md`、`spec/agentic-software-development/controller-worker-loop.md`
- 影响设计：无用户界面或视觉表面变化
- 关联模型：Project State v5、Development Case v5、Case Transition v6、Iteration State v3
- 变更历史：
- 2026-08-11：增加 candidate/fresh Gap 选择；将 invariant 收束为 accepted-transition 约束，并确立 Completion Review 为唯一显式语义自查。
- 2026-08-10：用 advancement + 明确软件定义清单 + 独立软件不变量替换 completeness dimension/condition 模型。

## 方案概述

Project State 分成三个正交层次：

1. `advancement`：当前 Iteration、未完成 Cases、真实 Project gaps 和选择下一事项所需的上下文。
2. `software_definition`：协议明确列出的 15 项软件能力决策，以及当前项目对每项的具体结论与证据。
3. `software_invariants`：所有被接受 Case transition 在实际适用时必须满足的六条抽象正确性约束。

这套设计没有 facet 状态机，也不让通用 skill 写死产品、交互、视觉、技术、代码和测试流程。清单属于具体 State；skill 只提供“恢复全部相关信息、比较动态 Gap、完成一个 Gap、提交 transition、fresh-read 继续”的通用算法。

Canonical 协议只接受：

- `project-state-record/v5`
- `iteration-state-record/v3`
- `development-case-record/v5`
- `arckit-case-transition/v6`

不保留旧协议兼容分支。未更新的 active State 在进入自动 Loop 前直接失败，由 Agent 基于新协议、项目事实和用户意图修正。

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

- `observable-behavior-has-durable-expectation`
- `changed-interactions-remain-recoverable`
- `changed-visual-language-remains-consistent`
- `changed-contracts-remain-explainable`
- `accepted-facts-are-realized`
- `material-risks-have-credible-evidence`

这些不变量判断当前 transition 能否被接受，但不负责产生诊断、设计、实现、测试等工作，也不形成六个轨道。核心定义以 accepted transition 为作用域；协议升级可通过 `sync_core` 精确同步 canonical 定义，项目不能任意改写。技术栈、框架、模块、文件、某条产品需求和一次 Case 发现是 decision/fact/evidence，不是新不变量。

## Development Case v5

Case 维护 accepted facts、实际相关的 target impacts、dynamic gaps、问题、handoff、content revision 和完成态 Review。

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

Gap 只保存 goal、reason、derived_from、blocked_by、开放 priority basis、responsibility、evidence requirement 和 resolution。诊断、产品定义、文档维护、实现、测试和交付使用同一结构；不包含 facet、skill、allowed path 或固定工作类型。

Audit 从全部 `open` 且依赖闭合的 gaps 派生无序 candidate set。当前 Agent 每轮从 fresh state 比较这些 candidates 与本轮新显露的必要工作，再根据阻塞、风险、信息增益、依赖、用户影响和可验证性选择下一项。根因未知的 bug 通常先产生诊断 Gap，是事实与不确定性驱动结果，不是 code invariant 或 diagnosis facet。

## Case Transition v6

```yaml
schema_version: arckit-case-transition/v6
case_id: CASE-YYYYMMDD-NNN
case_updated_at: ...
project_revision: 12
gap_selection: { mode: candidate, basis: ... }
selected_gap: {}
planned_transition: {}
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

`gap_selection.mode=candidate` 时逐字段复现当前派生 candidate；`mode=fresh` 时原子创建并关闭一个此前未持久化、Agent-owned、无未闭合依赖且本轮已完成的普通 Gap，上一轮不需要预先知道它。两种模式都只关闭 selected gap；`gaps_added` 仅持久化本轮已经发现但仍未解决的真实工作，不作为未来 Loop 计划。任何一轮都可以提交相关 Project delta，不等待 Case resolved：

- 产品或技术结论在被真正澄清的当轮更新对应 decision。
- 新事实使旧决策失效时标记 stale 并绑定 Project gap。
- 实现或验证轮可以更新 Project gap 与 selection context。
- 非核心 invariant 的 add/update/retire 也走显式 change。

Decision change 绑定 observed decision revision 并递增；整个 transition 绑定 observed Project numeric revision。Trusted ledger 在跨进程 Project lock 中 fresh-read，并原子写 Case、Project、Iteration、投影和索引；任一步失败全部恢复。

这保证“当前 Gap 做清楚什么，就把对应长期事实当轮沉淀”，而不是常规依赖最终 Review 补文档，也避免 Case 结束时一次性猜测所有 Project 影响。

## Iteration State v3

Iteration 保存：

- `targets`：引用 `software_decision`、`software_invariant` 或 `project_gap`。
- `accepted_project_changes`：每次 transition 实际接受的 Project change 摘要、Case ref 和 evidence。
- acceptance、remaining/blocking Project gaps、active/closed Case refs。

Iteration 不保存 Loop prompt、next responsibility、Worker 顺序、dimension 同态状态或 Runtime 日志。

## Completion Review

普通 gaps、问题、handoff 和 threatened/undetermined impacts 全部闭合后，ledger 派生唯一 Review candidate；若 fresh state 暴露了更重要的普通工作，Agent 先用 fresh Gap 完成它。Completion Review 是唯一显式语义自查，只重点检查：

- implementation correctness
- problem resolution
- verification credibility
- regression risk
- minimality

Finding 转成普通动态 Gap；修复提升 content revision，再审查新 revision。普通 Gap 的 evidence requirement 和 ledger validation 属于执行证明与确定性协议校验，不是其他自查阶段。Review 是最终兜底；clean 并关闭 Case 后只允许 Git-only closeout，不再检查、验证、编辑或修复内容。

## Runtime 集成

Runtime digest 提供完整 Project software decisions、invariants、advancement，全部 active Cases 的 facts/impacts/open/ready gaps 和 revisions。它不维护 decision/invariant 到 skill、artifact、path 或 action 的映射。

同一 Agent：

1. 恢复用户增量、fresh State 与全部相关工程事实。
2. 选择或创建一个 Case。
3. 从 ready candidates 与本轮新显露的必要工作中选最值得优先处理的一项。
4. 动态使用必要 skills/tools 完成并验证该 Gap。
5. 提交 Case delta 与同轮 Project delta。
6. trusted writeback 成功后 fresh-read 并自动续轮。

只有 human responsibility 暂停。External responsibility 保持可恢复；仍有 agent-ready gap 时继续。生产性轮数、总墙钟和长命令耗时不是停止条件。

## 验收口径

- Project v5 明确保存完整 15 项软件定义清单，通用 skill 不复制这份业务清单。
- Project v5 独立保存六条核心软件不变量，不再出现 completeness dimensions 或 desired conditions。
- Case v5 不包含 facet、maturity、alignment、diverged 或 not-required checklist。
- Decision 自身是否清楚，与后续实现是否正确分开表达。
- 每个被接受的 Gap transition 都能立即原子沉淀相关 Project change。
- 文档、诊断、实现和验证按实际依赖自由排序；文档应在负责其事实的 Gap 中更新。
- Runtime、output schema、gate、ledger 和 Desktop 只接受当前 v5/v3 协议。
- 每轮 fresh 判断 candidate/fresh Gap；不依赖上一轮预排 impacts 或 gap 链。
- Completion Review 是唯一显式语义自查，且 Case resolved 后 closeout 只处理 Git。
- 自动续轮直到 resolved；只有 human responsibility 请求人类介入。
