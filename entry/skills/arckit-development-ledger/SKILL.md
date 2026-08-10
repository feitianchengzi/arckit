---
name: arckit-development-ledger
description: "维护 Arckit Project/Iteration/Case canonical state 与确定性 transition。Project 保存推进控制、显式软件定义清单和抽象软件不变量；Case 保存 facts、state impacts、dynamic gaps 与 implementation-focused completion review。Ledger 不编码 skill、路径、固定流程或 Runtime 策略。"
---

# Arckit Development Ledger

本 skill 是 Project State -> Case -> Loop 的可信 ledger。它只校验协议、引用、revision、责任和证据闭合；相关性、优先级、skill、工具和工件位置由 Agent 基于全部上下文动态决定。

## Canonical 对象

- Project `project-state-record/v5`：`advancement`、显式 `software_definition.decision_areas` 与 `software_invariants`。
- Iteration `iteration-state-record/v3`：阶段 targets、逐轮接受的 Project changes 与 Case refs。
- Case `development-case-record/v5`：facts、state impacts、dynamic gaps、问题、handoff、content revision 与 completion review。
- Transition `arckit-case-transition/v5`：一次 Gap 的 Case delta 与同一原子提交中的 Project delta。

## Project State 边界

- `software_definition.decision_areas` 是协议明确列出的软件能力决策清单，不由 Agent 临时生发，也不是执行 checklist。每项保存问题、决策要求、证据要求、当前 decision 与实际 gap refs。
- `software_invariants` 是跨项目稳定的抽象正确性约束。六条核心不变量不可删除、改写或退役；项目仅可增加真正跨 Case 长期成立的非核心不变量。
- `advancement` 只保存当前 Iteration、未完成 Cases、真实 Project gaps 和下一事项的选择上下文；不保存固定工作流或历史 Case 注册表。
- 技术栈、端、登录、反馈、授权、模块等具体结论写入对应 decision 的 statement/evidence；Case 局部发现写 facts/evidence。不要把项目事实伪装成新不变量。
- open 决策不自动生成 gap；只有当前事项确实需要解决它时才建立 Project/Case gap。`stale` 决策必须有 gap 承接。

完整模型见 [references/project-state-model.md](references/project-state-model.md)。

## Case 状态与审计

- Fact 有稳定 id、递增 revision、accepted/superseded、statement、basis 和持久 evidence。
- Impact 只记录实际相关的 Project decision 或 invariant target。软件决策 impact 必须绑定当前 decision revision；核心 invariant revision 为 `null`。
- `upheld` 需要证据；`threatened/undetermined` 至少绑定一个 open gap。
- Gap 只包含目标、原因、来源/依赖、开放 priority basis、responsibility、evidence requirement 和 resolution，不含 facet、skill 或工件类别。
- 审计从所有 ready gaps 动态派生候选项；数组顺序不代表优先级。普通 gaps、问题、handoff 和未闭合 impacts 清零后，才派生唯一 completion review。
- Review 只检查 implementation correctness、problem resolution、verification credibility、regression risk 和 minimality；规则见 [references/completion-review.md](references/completion-review.md)。

## Transition 与原子写回

- 每轮必须提交完整 selected candidate 快照并只关闭该 gap；可以同轮接受 facts、更新 impacts、暴露后续 gaps。
- `project_state_delta` 可在任何被接受的 Gap transition 中更新软件定义决策、不变量、Project gaps 或 selection context，不必等待 Case resolved。
- Project decision 更新检查 observed revision 并递增 revision；Case impacts 必须引用提交后的当前 revision。
- 内容变化提升 `content_revision` 并使旧 clean Review 失效；clean Review 与内容变化分轮提交。
- 正式 apply 在 Project lock 内 fresh-read，并原子写入 Case、Project、Iteration、投影与索引；任一步失败全部回滚。
- transport 和持久证据规则见 [references/transition-transport.md](references/transition-transport.md)。

## Trusted entrypoints

- `project_state`: `scripts/project-state.mjs`
- `project_iteration`: `scripts/project-iteration.mjs`
- `development_case`: `scripts/development-case.mjs`
- `case_control`: `scripts/runtime-case-control.mjs`
- `case_transition`: `scripts/case-transition.mjs`
- `writeback`: `scripts/runtime-writeback.mjs`

## CLI

```text
node scripts/project-state.mjs init|render|audit|validate|summary [record]
node scripts/development-case.mjs new|validate|audit|close ...
node scripts/case-transition.mjs validate <transition.json|->
node scripts/case-transition.mjs apply --case <case.md> --transition <transition.json|-> [--dry-run true]
```

## 输出

- canonical Project/Iteration/Case state
- facts、targeted impacts、dynamic gaps 与 completion review resolution
- 每轮接受的 Case delta、Project delta、validation 与 fresh-state next step
