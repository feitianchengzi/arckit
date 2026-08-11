---
name: arckit-development-ledger
description: "维护 Arckit Project/Iteration/Case canonical state、协议兼容性恢复与确定性 transition。Project 保存推进控制、显式软件定义清单和抽象软件不变量；Case 保存 facts、state impacts、dynamic gaps 与 implementation-focused completion review。Ledger 不编码具体版本迁移、skill、路径、固定流程或 Runtime 策略。"
---

# Arckit Development Ledger

本 skill 是 Project State -> Case -> Loop 的可信 ledger。它只校验协议、引用、revision、责任和证据闭合；相关性、优先级、skill、工具和工件位置由 Agent 基于全部上下文动态决定。

## Canonical 对象

- Compatibility `arckit-ledger-compatibility/v1`：低成本识别 canonical objects 是否满足当前协议，并区分版本不一致、当前协议损坏和不可读状态。
- Reconciliation `arckit-protocol-reconciliation/v1`：由 Agent 提交语义转换后的完整 replacement records；ledger 只负责 freshness、结构、保真边界、跨引用和原子写回。
- Project `project-state-record/v5`：`advancement`、显式 `software_definition.decision_areas` 与 `software_invariants`。
- Iteration `iteration-state-record/v3`：阶段 targets、逐轮接受的 Project changes 与 Case refs。
- Case `development-case-record/v5`：facts、state impacts、dynamic gaps、问题、handoff、content revision 与 completion review。
- Snapshot `arckit-ledger-snapshot/v1`：兼容性、canonical source digests、Project/Case revisions、Case-scoped selection tokens 与 persisted candidate catalog。
- Transition `arckit-case-transition/v8`：绑定 snapshot 的完整 Gap 比较、单一验收主张、Case/Project delta 与当前 Project invariant catalog 的完整 assessment。
- Closeout `arckit-round-closeout/v2`：实际接受的 delta、invariant assessment、结果 revisions 和 post-commit token，不投影下一 candidate。

## Project State 边界

- `software_definition.decision_areas` 是协议明确列出的软件能力决策清单，不由 Agent 临时生发，也不是执行 checklist。每项保存问题、决策要求、证据要求、当前 decision 与实际 gap refs。
- `software_invariants` 是 Case Loop 的跨项目抽象判断指导，不是固定工作类型或 Gap 清单。Agent 每轮从 fresh Case facts 判断全部 invariants：事实建立、改变、否定、暴露缺失、使既有内容过时、产生歧义或冲突都可能触发相关判断，不能只看本轮计划修改什么。产品、交互、视觉和技术四条维护不同类型的权威长期预期或决策；realization 与 risk 分别要求现实兑现和风险依据，三类证据不能互相替代。Ledger 只校验 catalog 覆盖、引用和处置结构。六条核心不变量不可删除、任意改写或退役；协议升级只允许精确同步 canonical core 定义。项目仅可增加真正跨 Case 长期成立的非核心不变量。
- `advancement` 只保存当前 Iteration、未完成 Cases、真实 Project gaps 和下一事项的选择上下文；不保存固定工作流或历史 Case 注册表。
- 技术栈、端、登录、反馈、授权、模块等具体结论写入对应 decision 的 statement/evidence；Case 局部发现写 facts/evidence。不要把项目事实伪装成新不变量。
- open 决策不自动生成 gap；只有当前事项确实需要解决它时才建立 Project/Case gap。`stale` 决策必须有 gap 承接。

完整模型见 [references/project-state-model.md](references/project-state-model.md)。

## Case 状态与审计

- Fact 有稳定 id、递增 revision、accepted/superseded、statement、basis 和持久 evidence。
- Impact 只记录当前事实或被接受 transition 实际影响的 Project decision/invariant target，不在 Case 创建时预测 scope。软件决策 impact 必须绑定当前 decision revision；核心 invariant revision 为 `null`。Invariant applicability 本身不要求创建 impact。
- `upheld` 需要证据；`threatened/undetermined` 至少绑定一个 open gap。
- Gap 只包含结果型目标、原因、来源/依赖、开放 priority basis、responsibility、evidence requirement 和 resolution，不含 facet、skill、工件类别或未来执行步骤。
- 审计从已持久化的 ready gaps 动态派生候选项；数组顺序不代表优先级。普通 gaps、问题、handoff 和未闭合 impacts 清零后，派生唯一 completion review candidate，但 Agent 仍可在 fresh state 中提出更重要的普通 Gap。
- Review 只检查 implementation correctness、problem resolution、verification credibility、regression risk 和 minimality；规则见 [references/completion-review.md](references/completion-review.md)。

## Transition 与原子写回

- 每轮必须提交绑定 selected Case selection token 的 `gap_selection`，并逐项说明该 Case scope 内 persisted candidates 的 selected/deferred/excluded 结果；`fresh` candidates 只记录 Agent 本轮实际发现的工作。`candidate` 逐字段复现并关闭当前派生候选；`fresh` 原子创建并关闭一个此前未持久化、Agent-owned、无未闭合依赖且本轮已完成的普通 Gap。
- 每轮只接受 selected Gap 的一个验收主张；新事实可以新增或重开后续 Gap，但不得在同一 Round 执行这些后续结果。
- `invariant_assessment` 对 observed Project revision 的全部 invariants 恰好判断一次。`not_relevant` 需要理由，`upheld` 需要持久证据，`threatened/undetermined` 需要 accepted facts 和写回后仍 open 的 Case gaps。Ledger 不判断语义相关性或路由 artifact/skill。
- `project_state_delta` 可在任何被接受的 Gap transition 中更新软件定义决策、不变量、Project gaps 或 selection context，不必等待 Case resolved。
- Project decision 更新检查 observed revision 并递增 revision；Case impacts 必须引用提交后的当前 revision。
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
