---
name: arckit-development-ledger
description: "维护 Arckit Project/Iteration/Case canonical state 与确定性 transition。Project 保存宏观 dimensions 和项目具体 desired conditions；Case 保存 facts、state impacts、dynamic gaps 与 implementation-focused completion review。Ledger 只接受当前协议，不编码 skill、路径、固定流程或 Runtime 策略。"
---

# Arckit Development Ledger

本 skill 是 Project State -> Case -> Loop 的可信 ledger。Runtime 与人工调用共享 `case_control` / `case_transition` entrypoint；ledger 只校验结构、引用、revision、责任与证据闭合，不替 Agent 做自然语言相关性或优先级判断。

## Canonical 对象

- Project `project-state-record/v4`：宏观 completeness dimensions、Project gaps、active Cases，以及每个 dimension 可为空的 `desired_conditions`。
- Iteration `iteration-state-record/v2`：阶段目标、resolved Case 聚合、dimension/condition change 摘要与 Case refs。
- Case `development-case-record/v4`：facts、state_impacts、dynamic gaps、问题、handoff、content revision 和 completion review。
- Runtime records：宿主在项目外管理；canonical ledger 最多保存 opaque run ref。

## 状态边界

- `desired_conditions` 只包含 `id/applies_when/must_hold/evidence_expectation/priority/status`。不得包含 skill、path、owner、Worker、固定状态机或执行顺序。
- Fact 必须有稳定 id、递增 revision、accepted/superseded 状态、statement、basis 与持久 evidence。引用过期 fact revision 的 impact 无效。
- Impact 只记录实际相关的 condition。`upheld` 需要证据；`threatened/undetermined` 至少绑定一个 open gap。
- Gap 只有 goal、reason、来源/依赖、开放 priority basis、responsibility、evidence requirement 与 resolution；不含 facet、skill 或工件类别。
- v4 不保存 not-required checklist。事实不影响某 condition 时不创建 impact。
- Project/Iteration 不保存 Loop prompt、next responsibility、Worker 路线或运行日志。
- canonical evidence 不接受临时目录；transition transport 见 [references/transition-transport.md](references/transition-transport.md)。

## Case control

新 Case 必须由 Controller 提供 title、intent、expected outcome、artifact type、selection reason、至少一个 accepted initial fact、实际相关的 initial impacts 与至少一个具体 initial gap，并显式快照 Review policy。Ledger 分配 id、创建 v4 Case、注册 Project/Iteration、更新投影和索引；不从关键词补造事实、condition 影响或 gap。

## v4 Audit

`development-case.mjs audit`：

1. 校验 facts、fact revisions、impacts、gap refs/dependencies、问题、handoff 和 Review。
2. 拒绝过期 impact；threatened/undetermined impact 没有 open gap 时 fail closed。
3. 派生所有 open 且 dependencies 已关闭的 unordered candidate gaps。
4. human-ready gap 形成 human handoff；否则 Agent gap 可继续；仅剩 external 时 external wait；有 open gap 但无 ready gap 时 blocked。
5. 普通 gaps、问题、handoff 与未闭合 impacts 全部完成后才派生唯一 completion review candidate。
6. 当前 content revision 五维 clean 后 Case resolved。

Review 规则见 [references/completion-review.md](references/completion-review.md)。

## v4 Transition

`arckit-case-transition/v4` 绑定 Case/Project revisions、完整 selected candidate snapshot、planned transition、accepted delta、evidence、Case claim 与 Project impact candidate。

- 普通 transition 必须 resolve selected gap；可增加/替换 facts，增改 impacts，增加后续 gaps，或取消有证据失效的其他 gap；不能 resolve 其他 gap。
- 事实变更、gap 处置或 impact 变更提升 `content_revision` 并使旧 clean Review 失效。
- clean Review 与内容修改分轮提交。
- resolved claim 强于 deterministic audit 时拒绝。
- `project_impact_candidate.condition_changes` 只在 Case resolved 且 Project revision 匹配时原子 add/update/retire condition；Iteration 只保存摘要。
- 正式 apply 在 Project commit lock 内 fresh-read、校验、写 Case/Project/Iteration/projections/index；失败全部回滚。并行 Case 可并行执行，commit 短暂串行。

旧协议 record/transition 不属于当前 canonical ledger。项目升级必须由 Agent 重新读取当前意图、证据和实现后做显式语义迁移；不得机械翻译旧字段。

## Trusted entrypoints

- `project_state`: `scripts/project-state.mjs`
- `project_iteration`: `scripts/project-iteration.mjs`
- `development_case`: `scripts/development-case.mjs`
- `case_control`: `scripts/runtime-case-control.mjs`
- `case_transition`: `scripts/case-transition.mjs`
- `writeback`: `scripts/runtime-writeback.mjs`

## CLI

```text
node scripts/development-case.mjs new --title "..." --intent "..." --expected-outcome "..." --initial-facts '<json>' --initial-impacts '<json>' --initial-gaps '<json>' --max-review-cycles 3 --review-policy-source "..."
node scripts/development-case.mjs validate|audit|close ...
node scripts/case-transition.mjs validate <transition.json|->
node scripts/case-transition.mjs apply --case <case.md> --transition <transition.json|-> [--dry-run true]
node scripts/project-state.mjs render|audit|validate|summary [record]
```

## 输出

- ledger/case control/transition result
- facts、state impacts、dynamic gaps、content revision 与 derived resolution delta
- Project dimension/condition delta 与 Iteration aggregation
- ledger validation 和 fresh-state next step
