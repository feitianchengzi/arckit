# Software Definition Ledger 方案

## 元信息

- 路径：`tech/arcorbit/state-condition-ledger-solution.md`
- 技术领域：`arcorbit`
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
3. `software_invariants`：持续指导 Case Loop 显式判断发现、并约束所有被接受 Case transition 的软件核心正确性要求及项目附加约束。

这套设计没有 facet 状态机，也不让通用 skill 写死产品、交互、视觉、技术、代码和测试流程。清单属于具体 State；skill 只提供“恢复全部相关信息、比较动态 Gap、完成一个 Gap、提交 transition、fresh-read 继续”的通用算法。

### 通用控制与场景定义边界

通用 Loop 负责目标恢复、缺口发现、依赖与资格检查、优先级比较、执行取证、可信提交和重新选择。场景 State 定义负责业务对象、决策、不变量、事实类型与依赖、证据要求、完成条件和决策权限；具体项目 State 及其持久事实引用提供维护对象、实现载体、生效方式和验证依据。`software_definition`、`software_invariants` 与下述 15 项 decision areas 属于软件场景协议，不是通用 Loop 的固定业务词表。

场景替换的边界包括 State 定义、对应 schema/确定性校验和领域能力、证据适配；Loop 控制方法、snapshot/transition/closeout 的职责与 freshness 原则保持不变。场景定义有版本并受可信校验约束，不能靠项目任意改写核心定义冒充兼容切换，也不能只换不变量名称而保留旧场景的事实关系和完成语义。

Agent 从场景定义理解语义规则，Runtime 不按场景名、文件路径、工具调用或不变量 id 预路由。Ledger 验证载荷、引用、依赖状态与原子提交；事实依据是否充分、对象是否相关、探索结论是否支持采纳，由 Agent 显式判断。详细行为和验收场景由 `arckit/spec/agentic-software-development/controller-worker-loop.md` 定义。

Canonical 协议只接受：

- `project-state-record/v5`
- `iteration-state-record/v3`
- `development-case-record/v5`
- `arckit-case-transition/v8`
- `arckit-ledger-snapshot/v1`
- `arckit-round-closeout/v2`

不保留旧协议的业务执行兼容分支。trusted snapshot 首先做协议探测；若 canonical State 不兼容，则返回结构化 compatibility receipt 而不是进入 Case Loop。Agent 可在尚无可注册 Case 时通过 manifest 声明的协议恢复入口执行最小 reconcile，再重新调用 snapshot。协议升级因此不依赖 active Case 或 Case transition，不会形成“先升级才能注册、先注册才能升级”的循环。

## 方法、接口与宿主责任

`using-arckit` 保留完整的状态驱动方法；`arckit-development-ledger` 拥有 v1 Semantic Case Command、v8 Transition、状态模型和可信脚本。Runtime 的结果封装通过 Ledger manifest 的 `agent_contracts` 组合载荷 schema，不维护第二套字段/引用规则。Agent 使用实际运行能力的 schema/reference 与 fresh selection token；源码修复不能冒充安装副本已生效。

Review finding 通过显式 `local:review-finding:<handle>` 关联 Ledger 实际派生的修复 Gap，使 threatened/undetermined 判断与 Review 结果在同次可信提交中闭合；未知引用仍拒绝。Runtime 不从 blocked 字面值或路径分类推断该主张能否记账，最终合法性由 Ledger 验收。

本次执行停止与 Case 完成分别投影：`handoff/none` 可以正常结束并保留未完成事项；通用 Loop 在可信完成回执后结束；Automation 另按显式交付策略进入 Git 收尾。Git 收尾发现新的实质义务时，通过 Host 的 `resume_loop` 结果回到同一线程正常 Loop，Agent 决定 active Case 或有证据的后续 Case；不手改已关闭 Case，也不因阶段切换强制转人工。

拒绝恢复透传准确错误、原主张与未变的授权。方法负责判断恢复范围；工具缺陷不会自动扩大为通用能力维护，技术故障也不等同人工业务决策。既有单 Gap 因果反馈、不变量判断、Review 循环、freshness 与原子提交保证继续适用。

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

“settled”不混入“是否与实际实现对齐”。后续实现 Gap 必须读取全部相关 decisions；若实现偏离，它属于 Case fact/impact/gap。产品决策在自己的 Gap 中清楚就是清楚，无需增加后续 facet 复查状态。实现载体按项目对象识别，包含 skill 指令、脚本、配置等，不限于代码。

### Software invariants

软件场景的六个核心方向由模板定义，并由 `scripts/project-invariants.mjs` 校验核心定义不可被项目任意删除、改写或退役：

- `product-expectations-remain-recoverable`
- `interaction-expectations-remain-recoverable`
- `visual-language-remains-consistent`
- `technical-decisions-remain-explainable`
- `accepted-facts-are-realized`
- `debug-causes-remain-grounded`

这些不变量既约束当前 transition 能否被接受，也作为每轮从 fresh Project/Case state 发现显式判断的抽象指导。Applicability 由 fresh facts 是否建立、改变、否定、暴露缺失、使既有内容过时、产生歧义或冲突决定，不从 planned transition 的动作或实际编辑对象倒推。

产品、交互、视觉和技术四条分别维护对应权威长期预期或决策；realization 判断项目实际实现是否兑现已接受预期；debug 判断问题直接原因是否有证据。它们不形成六个固定执行轨道，也不映射固定 skill、路径或工件。每个软件业务 Gap 说明对象范围、相关不变量及缺少的结果，六个方向都须考虑但不要求都产生 Gap。风险主张仍需相称证据；State 中已有的 `material-risks-have-credible-evidence` 等附加不变量仍完整参与 assessment，不因核心方向调整而静默删除。

诊断原因未知时，先取得解释现象的直接因果证据，再 fresh-read 判断相关预期是否有问题及后续如何处理。原因已知且预期有效时可直接修复；不要求无异常任务进行 Debug。查清原因、接受解决方案和证明修复完成是不同主张，症状消失不能替代因果证据。

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

Gap 只保存可验证结果的 goal、reason、derived_from、blocked_by、开放 priority basis、responsibility、evidence requirement 和 resolution。诊断、产品定义、文档维护、实现、测试和交付使用同一结构；不包含 facet、skill、allowed path、固定工作类型或把“实现、跨产物一致性、规格、测试”预排成下一轮路径的复合步骤。合并的是适合共同决定的相关结果，不是未来执行链。实现方式属于本轮 `planned_transition`，下一轮仍从 fresh state 独立判断。

Audit 从全部 `open` 且依赖闭合的 gaps 派生无序 candidate set。当前 Agent 每轮结合 Project decisions/invariants、Case facts、上一轮 judgments 与稳定事实源发现 fresh candidates，先检查事实依据、正式实现所需预期、授权与责任资格，再按影响面、关键不确定性、阻塞和依赖价值比较，结合风险、用户影响与可验证性选择。结构 ready 只说明账本依赖状态，不替代 Agent 对当前语义前置的检查；根因未知的 Bug 由诊断不变量承接直接原因缺口，不成为固定阶段。

每个 Gap 建立一个有界 claim，可以包含围绕同一目标、适合共同决定和验收的相关子结论。影响后续方向、多个对象或需要独立取舍的关键判断独立成 Gap，工作量不直接决定粒度；需要先取得一个答案才能决定其余工作时，不在同轮包办后续决定。预期事实的建立或修改与正式实现不得合并，复用已有预期不要求额外 Gap。调查、编辑、构建或测试可共同证明当前 claim；新事实支持当前问题时继续使用，暴露关键独立问题时记录 facts、impacts、assessment 和必要候选，不自动扩大本轮执行。selected gap resolved 或确定为 partial/blocked 后进入 transition；下一项工作从 closeout 后的 fresh snapshot 重选。

同一有界结果可以覆盖一个小 Case 的全部普通工作，不为 Case/Gap 范围一致额外拆分。当前事实已支持的多个缺口和依赖可以同时记录，包括初始化时的已知义务；不预测未来执行链不等于逐轮隐瞒已知问题。关联和合并不能绕过 selected Gap 身份、引用保真、原子提交与 fresh-read 重选。

### 选择语义的状态承载

事实方向与结论性质正交。探索取得决定所需依据；正式确立接受有依据的预期、因果结论或对已接受预期的兑现结果。它们不是 facet 状态机，也不为所有领域强加探索轮次。现有语义字段承载以下责任，不能仅记录一句“必要时可探索”：

| 语义责任 | 承载位置与含义 |
|---|---|
| 对象与范围 | Gap goal/reason、相关 facts 和 invariant judgment 明确纵向对象、适用不变量与证据覆盖边界。 |
| 结论性质 | goal、选择 basis 与 planned transition 说明取得依据还是正式确立，列出可共同验收的子结论及暂不接受的下游主张。 |
| 前置事实 | derived_from 与持久 evidence 引用已有依据；真实未闭合 Gap 依赖用 blocked_by 表达，未记录的关键缺口先显式承接，不伪装成 ready。 |
| 选择资格 | gap_selection 的 eligibility、reason 和比较依据说明责任条件、关键证据是否充分、相关预期是否有效，不仅复述 catalog 状态。 |
| 探索验收 | evidence requirement 和 accepted facts 表达授权目标或受阻决定、具体问题、证据、条件、限制及尚未决定事项；resolution 只关闭已被回答的未知，证实不可行也可完成，证据不足保持开放。 |
| 义务连续性 | facts、开放 gaps、问题、handoff 与 invariant assessment 保存剩余责任、反证及依赖关系，不从 Gap 关闭推断全部不变量满足。 |

正式实现引用其范围及共享前提所需的已接受预期；无关模块的未决预期不阻塞当前局部。缺少关键依据的正式决定则由探索 Gap 先取得依据。探索结果可以接受真实实现观察，但不能自动批准产品方向、技术方案或正式交付；仍需作出的决定保持开放。实验载体可以在预期接受后复用、调整和验证，不要求重写。

预期接受包含权限内的语义采纳与权威事实源的可恢复表达，不由 Ledger receipt 自动证明，也不默认要求人工审批。新建或变更的预期在负责它的 Gap 中维护；已有充分事实源引用复用。探索引用试验假设与观察标准即可建立取证边界，不要求待探索的正式功能预期已全部成立。其 accepted facts 分别说明真实观察、对既有行为的实际影响与尚未兑现的正式目标；不能把实验观察引用成正式兑现证据，实际引入的回归仍由开放义务承接。

Agent 识别实际维护对象、载体、生效方式与证据类型。Skill 正文即使使用 Markdown，也可能直接实现 Agent 行为；其源码、安装生效和执行表现分别论证，不因扩展名推断为预期文档。探索 skill 与探索代码遵守同一结论边界。

Ledger 校验声明与引用的确定性一致性，Runtime 透传状态和结果，不从自然语言或文件变化推测缺失的事实关系。粒度适当性、证据充分性和是否可以正式确立由 Agent 负责。Agent 区分同一验收内的动作依赖与需要另行选择的独立结果；前者就绪或约束内实现手段调整不单独触发重选。常规排障可服务当前结果，重要独立因果问题或已接受预期、关键前提、责任、验收边界变化则保存证据并重新选择。既有记录的 ready、resolution 或 partial 不代替上述语义判断，也不因探索或合并要求绕过 freshness、原子提交与责任权限。

### 场景快照与选择说明接口

Ledger 的 `templates/software-state-definition.json` 是软件场景语义定义，按 `arckit-state-definition/v1` 表达事实类型、选择规则、完成规则及实现载体判断；不复制 Project 中动态的不变量条文。`loop_snapshot.state_definition` 提供定义与内容 digest，Case selection token 同时绑定该 digest，阻止定义变更后接受旧选择。当前软件 Ledger 的对象 schema、定义资源与校验共同构成场景 adapter；通用入口只消费快照，不从目标项目任意路径加载另一份场景代码。软件场景定义引导首次使用者读取 Ledger 随包概念示例，串联不变量责任、纵向范围、事实角色、结论性质与 Gap；示例不依赖本仓库研发文档或先前会话，不构成固定业务执行链。

每轮 `planned_transition.selection_assessment` 显式提供对象范围、维护对象、实现载体与生效/验证方式、探索或正式确立性质、关联 invariant refs、可共同验收的结果、前置依据、预期来源、是否建立预期或正式兑现、合并/独立理由及暂不处理的义务。Semantic Command 和 direct Transition 共用同一结构与 validator，materializer 原样保留 Agent 声明，round 和 closeout 保留该说明。该接口强化当前提交契约，不改写历史 round 或为既有 Case 生成新 Gap。

Ledger 检查结构完整、已满足前置有证据、当前工作没有声明未满足的执行前置、正式兑现引用已有预期、探索不声明正式采纳/兑现，以及同轮不兼有预期变更和正式兑现。声明正式预期或兑现时 invariant refs 必须非空，所有 invariant refs 必须属于当前 Project catalog。同一 Gap 的已记录声明跨轮检查：不得通过 partial 合并预期建立与正式兑现；先闭合或保真重界定，再 fresh-read 选择独立 Gap。探索标签不独自限制续轮采纳，是否出现下游选择或重要重新决定由 Agent 依据结果边界判断；历史无声明的 Round 不补造性质。预期来源和普通 evidence 只作结构校验，内容接受状态与充分性仍由 Agent 核实。这些检查只验证 Agent 显式主张及其一致性，不从编辑文件推测真假，不用评分替代优先级判断。缺少说明返回可恢复的协议错误，由同一 Agent 补齐，不填充默认业务判断。

稳定实现上下文首次随 selection_assessment 保存：context_ref 为 null，maintenance_object、implementation_carriers、activation、verification 提供完整值。后续可用 case:round:N 引用同一 Case 已接受轮次，将四项置 null；Ledger 确定性解析引用，拒绝缺失或循环，并检查正式兑现的有效载体。只继承稳定上下文，不继承 scope、acceptance、前置或选择。Agent 每轮确认适用性，变化时写新上下文，权威来源仍可引用 Project/Case 的持久事实。

新项目通过 project_state init 创建状态后 fresh-read；该入口拒绝已有 Project record/STATE 或 Case/Iteration 历史，已有记录缺失走恢复。Direct Agent 可用 case_control apply <handoff.json|-> 调用与 Host 相同的加锁原子创建路径。已有复审策略优先；无策略时采用软件场景 direct_review_policy，默认最多 3 次自主 Completion Review，不限制业务 Gap 数或扩展授权。

候选目录保留所有依赖已闭合的责任类型；human、agent、external 由条目的 responsibility 表达，不因另一个人工候选存在就把可推进的 Agent 工作标成 blocked。依赖阻塞与责任交接分别表达，具体处理与交接仍由 Agent 判断。

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

- `not_relevant`：当前 Case 目标、相关预期、facts 和未决问题未触及该不变量；必须说明对象范围和原因，不能以本轮未选、尚未调查或缺失代替。
- `upheld`：当前 facts 与证据已经满足该不变量；必须有持久 evidence。
- `threatened`：当前 facts 已证明相关预期受到威胁；必须引用 facts 与至少一个在 apply 后仍 open 的 result Gap。
- `undetermined`：当前 facts 已证明该判断相关但证据不足；必须引用 facts 与至少一个在 apply 后仍 open 的调查或澄清 Gap。

assessment 绑定 observed Project revision。Ledger 只校验 invariant 引用全覆盖、disposition 结构、fact/gap 引用和 evidence 闭合，不判断某条 invariant 是否语义相关，也不把 invariant 映射到 Tech、Spec、代码、测试、skill 或路径。Agent 可在后续 round 用新 facts 将过去的 `not_relevant`/`upheld` 判断重新声明为 `threatened`/`undetermined`；round history 保留重新打开的依据。

每项 judgment 的理由与证据说明覆盖对象和范围。局部结论不能支持整个模块或 Case 的 upheld；同一方向仍有相关未决义务时，由现有 threatened/undetermined 处置及开放 Gap 保留，不能因局部探索成功覆盖剩余缺口。反证触及共享前提时重新检查相关决定及依赖实现的选择资格，不扩大到无关对象。

`gap_selection` 记录 snapshot catalog 中全部 persisted candidates 与本轮 fresh gap 候选，逐项给出 eligibility、priority basis 和 selected/deferred/excluded 理由。Ledger 对当前 Project gaps 与所选 Case persisted candidates 做强覆盖校验；其他 Cases 的条目保留为选择审计但不进入并发锁。`mode=candidate` 时，`selected_ref`、Gap id、Case `updated_at`、Project revision、selection token 与当前 ready 状态共同构成稳定 identity/freshness 边界；`selected_gap.goal/reason` 是 Agent 可自然转述的语义投影，不参与逐字身份比较。Apply 在锁内按稳定身份重新解析当前 canonical candidate，并将 canonical object 写入 round 与 closeout，避免 Agent 表达成为第二份事实。`mode=fresh` 时原子创建并推进一个此前未持久化、Agent-owned、无未闭合依赖的普通 Gap。两种模式都只推进 selected gap；验收未完成时提交 partial，普通 Gap 的 resolution 为 null 并保持开放，不为满足写回条件虚报完成或取消换号。`gaps_added` 持久化本轮当前事实已经支持、仍未解决的结果 Gap，不作为预测性的未来 Loop 计划，也不能在本轮切换执行。任何一轮都可以提交相关 Project delta，不等待 Case resolved：

- 产品或技术结论在被真正澄清的当轮更新对应 decision。
- 新事实使旧决策失效时标记 stale 并绑定 Project gap。
- 实现或验证轮可以更新 Project gap 与 selection context。
- 非核心 invariant 的 add/update/retire 也走显式 change。

Decision change 绑定 observed decision revision并递增；整个 transition 同时绑定 Case-scoped snapshot token 与 observed Project numeric revision。Trusted ledger 在跨进程 Project lock 中重新读取 snapshot、验证 persisted candidate 覆盖、稳定 selected ref、选择 token 和当前 readiness，并原子写 Case、Project、Iteration、投影和索引；任一步失败全部恢复。Case-scoped selection token 允许无相互影响的 Cases 独立推进，而 Project revision、Case revision、候选身份或 readiness 变化仍会 fail closed；仅 `goal/reason` 的等义改写不会被误判为 stale。

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

上述维度按当前 Case 授权目标及实际产物解释。探索或定义 Case 复审自己的结论、载体、实际影响与证据，不把未授权的正式实现当成其关闭前置；范围内真实未决仍须闭合，后续责任保留可恢复交接，不能宣称完整产品已经兑现。

Finding 转成普通动态 Gap；修复提升 content revision，再审查新 revision。普通 Gap 的 evidence requirement 和 ledger validation 属于执行证明与确定性协议校验，不是其他自查阶段。Review 是最终兜底；clean 并关闭 Case 后只允许 Git-only closeout，不再检查、验证、编辑或修复内容。

## Runtime 集成

Ledger manifest 的 `loop_snapshot` 是直接 Codex 与 Runtime 共用的 trusted read entrypoint。其 `arckit-ledger-snapshot/v1` receipt 提供完整 Project software decisions、invariants、advancement，全部 active Cases 的 facts/impacts/open/ready gaps、最近 invariant assessment、candidate catalog、revisions、source digests 与 snapshot tokens。Runtime 只消费该 receipt，不自行解析 canonical record、派生 candidate 或重写 freshness 规则，也不维护 decision/invariant 到 skill、artifact、path 或 action 的映射。

同一 Agent：

1. 恢复用户增量、trusted snapshot receipt 与全部相关工程事实。
2. 选择或创建一个 Case。
3. 恢复维护对象与实现载体，用 Project decisions/invariants、fresh Case facts 与原生 skills 发现 fresh candidates；先检查事实依赖、资格和粒度，再可见地比较并选择一项。
4. 动态使用必要 skills/tools，完成该 Gap 有界 acceptance claim 内适合共同决定的相关结果，按探索或正式确立的证据责任验收。
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
- 预期方向之间按实际依赖选择，关键依据不足先探索，正式实现以相关预期齐备为资格条件；事实载体在负责其结论的 Gap 中维护。
- Runtime、output schema、gate、ledger 和 Desktop 只接受当前 v5/v3/v7 与 snapshot/closeout v1 协议。
- 直接 Codex 与 Runtime 通过同一 ledger manifest、trusted snapshot/transition entrypoints 和 receipts 工作；Runtime 不复制候选、revision、fresh-read 或 closeout 的 canonical 机制。
- 每轮用 Project invariants 与 fresh Case facts 动态发现 candidate/fresh Gap，并提供完整可见比较轨迹；不依赖上一轮预排 impacts、事实域、复合步骤 Gap 或 gap 链。
- 每个 Gap 建立一个有界 acceptance claim，可共同决定的相关小项允许合并；重要取舍独立处理，预期变更与正式实现分轮，新 facts 不授权跨越结论边界。
- 每个 accepted content round 完整覆盖当前 invariant catalog；实际相关判断必须 upheld 或由 open Gap 承接，后续 facts 可以重新打开历史判断。
- writeback 后先显示独立 closeout，再完成可验证 post-commit fresh-read；内存 candidate 或 writeback result 不能充当 fresh state。
- Completion Review 是唯一显式语义自查，且 Case resolved 后 closeout 只处理 Git。
- 自动续轮直到 resolved；只有 human responsibility 请求人类介入。
- 通用方法不内置软件方向；场景替换包含定义、校验与证据适配，软件核心约束仍受当前场景协议保护。
- 探索的关键前置、范围、证据和未决决定可恢复；实验观察可以接受，采纳与正式兑现不能被自动推导。
- 同一 Case 允许无依赖局部推进；共享预期未定时依赖实现不可选择，局部证据不外推为全部义务满足。
- Skill 项目修改行为指令属于实际实现；文本修改、安装生效和真实行为验收分开论证。
