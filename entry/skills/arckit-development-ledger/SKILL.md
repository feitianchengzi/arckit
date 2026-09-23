---
name: arckit-development-ledger
description: "维护 Arckit Project/Iteration/Case canonical state、协议兼容性恢复与确定性 transition。Project 保存推进控制、显式软件定义清单和抽象软件不变量；Case 保存 facts、state impacts、dynamic gaps 与 implementation-focused completion review。Ledger 不编码具体版本迁移、skill、路径、固定流程或 Runtime 策略。"
---

# Arckit Development Ledger

本 skill 是 Project State -> Case -> Loop 的可信 ledger。它只校验协议、引用、revision、责任和证据闭合；相关性、优先级、skill 和工具由 Agent 基于全部上下文动态决定；工件位置遵守所属载体的维护约定，Case 专属执行证据由本 skill 约定。

## 接口所有权

Ledger manifest 的 `agent_contracts` 是 Host 组装语义载荷 schema 和定位接口说明的唯一来源；Host 只维护结果封装与授权绑定。语义提交前读取 [references/semantic-command-handoff.md](references/semantic-command-handoff.md)。Agent 决定事实、关系与验收结论；Ledger 校验合法性并物化身份、版本和派生关系，Runtime 不复制这些判断。

可信软件场景契约位于 [templates/software-state-definition.json](templates/software-state-definition.json)，snapshot 携带定义和摘要，selection token 绑定该摘要。通用 Loop 消费定义；替换场景须同时替换 State 模型、初始化与验证适配器。首次使用软件场景或需要区分取证、正式结论与排障边界时，读取 [references/software-gap-examples.md](references/software-gap-examples.md)。

所有当前提交必须带 planned_transition.selection_assessment，结构见 [schema/selection-assessment.schema.json](schema/selection-assessment.schema.json)。声明维护对象、实现载体、生效与验证、局部范围、结论性质、前置证据和合并边界。校验显式冲突及同一 Gap 历次声明的合并边界；正式预期或兑现声明必须关联不变量。不从文本或路径猜测语义，历史 Round 不补造声明。

## Canonical 对象

- Compatibility `arckit-ledger-compatibility/v1`：低成本识别 canonical objects 是否满足当前协议，并区分版本不一致、当前协议损坏和不可读状态。
- Reconciliation `arckit-protocol-reconciliation/v1`：由 Agent 提交语义转换后的完整 replacement records；ledger 只负责 freshness、结构、保真边界、跨引用和原子写回。
- Project `project-state-record/v5`：`advancement`、显式 `software_definition.decision_areas` 与 `software_invariants`。
- Iteration `iteration-state-record/v3`：阶段 targets、逐轮接受的 Project changes 与 Case refs。
- Case `development-case-record/v5`：facts、state impacts、dynamic gaps、问题、handoff、content revision 与 completion review。
- Snapshot `arckit-ledger-snapshot/v1`：兼容性、canonical source digests、Project/Case revisions、Case-scoped selection tokens、版本化 state_definition 与 persisted candidate catalog。
- Semantic Command `arckit-semantic-case-command/v1`：ArcOrbit Agent 的 snapshot-bound 语义主张，只携带显式 typed refs、command-local handles、事实/Gap/影响/Project/invariant 判断与证据，不携带 canonical bookkeeping。
- Transition `arckit-case-transition/v8`：绑定 snapshot 的完整 Gap 比较、单一验收主张、Case/Project delta 与当前 Project invariant catalog 的完整 assessment。
- Closeout `arckit-round-closeout/v2`：实际接受的 delta、planned_transition.selection_assessment、invariant assessment、结果 revisions 和 post-commit token，不投影下一 candidate。

## Project State 边界

- `software_definition.decision_areas` 是协议明确列出的软件能力决策清单，不由 Agent 临时生发，也不是执行 checklist。每项保存问题、决策要求、证据要求、当前 decision 与实际 gap refs。
- `software_invariants` 保存项目当前的不变量定义。Agent 从当前 Project State 读取集合及每项适用条件、约束和证据要求，不在工作方法中复制模板内容或按预设分类解释。完整 assessment 只要求识别义务，不要求本轮全部成立；相关但未解决的缺口可以保持 threatened/undetermined 并关联开放 Gap。模板定义的核心项仍由初始化写入并受精确校验保护，不允许项目任意修改、删除或退役；引导层通过状态读取使用定义，不改变模板的维护权限。
- 不变量定义软件责任范围，业务 Gap 应说明所对应的责任；候选证据来源和推理方法不限。首次构造 assessment、出现反证或恢复 upheld 时读取 [references/invariant-assessment.md](references/invariant-assessment.md)。初始化或维护定义时读取 [templates/software-invariants.json](templates/software-invariants.json)；具体内容只在模板定义，Agent 读取当前 State 后理解，其他提示词和脚本不预设维度、数量、顺序或语义映射。
- `advancement` 只保存当前 Iteration、未完成 Cases、真实 Project gaps 和下一事项的选择上下文；不保存固定工作流或历史 Case 注册表。
- 技术栈、端、登录、反馈、授权、模块等具体结论写入对应 decision 的 statement/evidence；Case 局部发现写 facts/evidence。不要把项目事实伪装成新不变量。
- open 决策不自动生成 gap；只有当前事项确实需要解决它时才建立 Project/Case gap。`stale` 决策必须有 gap 承接。

完整模型见 [references/project-state-model.md](references/project-state-model.md)。

## Case 状态与审计

检查结果是否符合预期，以及保存或迁移相应验证证据前，读取 [references/case-evidence.md](references/case-evidence.md)。新增结果验证证据统一归档到 `arckit/cases/evidence/<case-id>/`；已有正式载体直接引用，不为证据另建顶层目录。此约定管理 Agent 的文件写入，不让 Ledger 或 Runtime 按路径推断事实语义。

- Fact 有稳定 id、递增 revision、accepted/superseded、statement、basis 和持久 evidence。
- Impact 只记录当前事实或被接受 transition 实际影响的 Project decision/invariant target，不在 Case 创建时预测 scope。软件决策 impact 必须绑定当前 decision revision；invariant revision 为 `null`（由 Project revision 绑定）。Invariant applicability 本身不要求创建 impact。
- `upheld` 需要证据；`threatened/undetermined` 至少绑定一个 open gap。
- Gap 表示当前尚未成立的具体结果，子结果须共享目标、前提和验收边界，只包含结果型目标、原因、来源/依赖、开放 priority basis、responsibility、evidence requirement 和 resolution，不含 facet、skill、工件类别或未来执行步骤。
- 审计保留所有依赖已闭合的责任类型候选，不以 human/external 隐藏可执行的 agent 工作；数组顺序不代表优先级。普通 gaps、问题、handoff 和未闭合 impacts 清零后，派生唯一 completion review candidate，但 Agent 仍可在 fresh state 中提出更重要的普通 Gap。
- Review 只检查 implementation correctness、problem resolution、verification credibility、regression risk 和 minimality；规则见 [references/completion-review.md](references/completion-review.md)。

## Transition 与原子写回

- 每轮必须提交绑定 selected Case selection token 的 `gap_selection`，并逐项说明该 Case scope 内 persisted candidates 的 selected/deferred/excluded 结果；`fresh` candidates 只记录 Agent 本轮实际发现的工作。`candidate` 以 `selected_ref`、Gap id、Case revision、selection token 和当前 ready 状态确认身份与 freshness；Agent 可以用自己的语言表达 `goal/reason`，Ledger 重新解析并持久化当前 canonical candidate，不以描述逐字相等作为身份门禁。`fresh` 原子创建并推进一个此前未持久化、Agent-owned、无未闭合依赖的普通 Gap；验收未完成时可以保留开放状态。
- 每轮只接受 selected Gap 的有界结论集合或部分进展；新事实可以支持当前缺口，也可以新增或重开其他候选，但不顺带解决独立缺口。一个结论可以影响多个 Project targets，相关低风险结果可合并；独立重要决定及建立预期与正式兑现不能因属于同一任务而合并。
- `invariant_assessment` 对 observed Project revision 的全部 invariants 恰好判断一次。`not_relevant` 需要理由，`upheld` 需要持久证据，`threatened/undetermined` 需要 accepted facts 和写回后仍 open 的 Case gaps。Ledger 不判断语义相关性或路由 artifact/skill。
- `project_state_delta` 可在任何被接受的 Gap transition 中更新软件定义决策、不变量、Project gaps 或 selection context，不必等待 Case resolved；只写入当前缺口已经建立的结论，不为补齐 decision areas 或 invariant catalog 顺带作出独立决定。
- Semantic Command Materializer 只按显式 typed refs/local handles 分配 canonical id、读取并递增 revision、重建 selected Gap、展开 Project Gap 的反向 decision index，并编译内部 v8；不得从 statement/reason/evidence 猜 target、effect、disposition、responsibility 或下一 Gap。Direct v8 的 Project decision 更新仍检查 observed revision；Case impacts 必须引用提交后的当前 revision。
- 内容变化提升 `content_revision` 并使旧 clean Review 失效；clean Review 与内容变化分轮提交。Completion Review 是唯一显式语义自查；普通 Gap 的 evidence requirements 与 ledger validation 只是完成证据和确定性协议校验。
- 正式 apply 在 Project lock 内 fresh-read，并原子写入 Case、Project、Iteration、投影与索引；任一步失败全部回滚。
- Apply 成功由 ledger 生成 round closeout；Host 必须先展示 closeout，再以 post-commit token 调用 `loop_snapshot`。Runtime 和直接 Agent 都不得从 writeback 结果推断下一 Gap。
- transport 和持久证据规则见 [references/transition-transport.md](references/transition-transport.md)。

## 协议兼容性恢复

- `protocol_compatibility probe` 是只读确定性门禁；兼容时不改变正常 Loop，失败时返回 affected refs、expected/observed schemas、分类、source digests 与 snapshot token。
- canonical state 不兼容时，不接受普通 Case control/transition。Agent 依据语义形成 replacements，ledger 不编码具体版本迁移步骤或字段映射。
- reconciliation 在 Project lock 内 fresh-probe，要求所有 incompatible objects 被覆盖，拒绝 unresolved uncertainties、身份/开放义务静默丢失、未知路径、陈旧 digest 和跨记录失配；任一步失败全部回滚。
- 完整契约、CLI 和验收边界见 [references/protocol-reconciliation.md](references/protocol-reconciliation.md)。

## Trusted entrypoints

- `project_state`: `scripts/project-state.mjs`
- `project_iteration`: `scripts/project-iteration.mjs`
- `development_case`: `scripts/development-case.mjs`
- `protocol_compatibility`: `scripts/protocol-compatibility.mjs`
- `loop_snapshot`: `scripts/loop-snapshot.mjs`
- `case_control`: `scripts/runtime-case-control.mjs`
- `case_transition`: `scripts/case-transition.mjs`
- `writeback`: `scripts/runtime-writeback.mjs`

## CLI

```text
node scripts/project-state.mjs init|render|audit|validate|summary [record]
node scripts/development-case.mjs new|validate|audit|close ...
node scripts/case-transition.mjs validate <transition.json|->
node scripts/case-transition.mjs apply --case <case.md> --transition <transition.json|-> [--dry-run true]
node scripts/protocol-compatibility.mjs probe
node scripts/protocol-compatibility.mjs validate|reconcile <reconciliation.json|-> [--dry-run true]
node scripts/loop-snapshot.mjs read [--after-commit <snapshot-token>]
```

## 输出

- canonical Project/Iteration/Case state
- compatibility probe 与 protocol reconciliation result
- facts、targeted impacts、dynamic gaps 与 completion review resolution
- 每轮接受的 Case delta、Project delta、invariant assessment、validation 与 fresh-state next step
