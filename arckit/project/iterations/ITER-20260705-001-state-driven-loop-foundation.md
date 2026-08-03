# State-driven loop foundation

Iteration: ITER-20260705-001
Status: active
Updated: 2026-08-03T16:07:53.169Z
Canonical Record: ITER-20260705-001-state-driven-loop-foundation.record.json

## Goal

将 Arckit 状态机制从记录型账本升级为由 Project State 选择 Case、Case State 暴露完整性 gap、Loop 产生证据并经确定性 ledger 聚合的软件项目控制面。

## Next Project State Target

- Transition: problem_scenarios: defined -> accepted
- Why: 通过真实复杂软件项目证明状态驱动 loop 能持续推进而不是只在协议样例中成立。

## Acceptance

- Status: verified
- Close condition: 当严格跨记录审计稳定通过，并至少完成一次真实复杂项目的 Project gap -> Case -> Worker evidence -> completion review -> Project impact 闭环后关闭本迭代。

## Remaining Project Gaps

- GAP-agent-scenario-evaluation: 状态驱动定义完整性需要在 fresh-agent 的 spec-first、code-first、mixed 和 not_required 路径中证明，并校准人类、单 Agent 与多 Agent 的责任边界。
- GAP-runtime-real-supervised-turn: Runtime/Desktop 已从单 agent supervised turn 升级为 agentic worker loop：task packet、agent report、capability manifest、merge gate、Desktop Agent Loop UI 和空项目初始化 smoke 均已验证；仍缺真实 Codex worker done/gate/write 闭环。
- GAP-cross-record-audit: Project、Iteration 和 Case 之间需要严格 schema、durable evidence 和跨记录一致性审计，避免结构合法但语义漂移。

## Accepted Project Changes

- product_behavior: designed -> implemented; Case=arckit/cases/closed/CASE-20260726-001-implement-case-driven-definition-completeness-loop.md; Project/Case/Loop separation, unordered Case candidate-gap selection, definition completeness, and equivalent human/Runtime transition semantics are implemented and locally verified.
- data_state: designed -> verified; Case=arckit/cases/closed/CASE-20260726-004-govern-project-and-iteration-state-to-strict-new-boundaries.md; Project v3 and Iteration v2 now have strict schemas, durable evidence rules, explicit gap coverage, generated projections, and deterministic cross-record audits that pass on the canonical repository state.
- iteration_governance: implemented -> verified; Case=arckit/cases/closed/CASE-20260726-004-govern-project-and-iteration-state-to-strict-new-boundaries.md; Iteration v2 now contains only macro Project targets and resolved-Case aggregation, rejects legacy and Loop control fields, derives projections from fresh Project State, and stays aligned through deterministic closeout.

## Blocking Project Gaps

- none

## Read For Precision

- ITER-20260705-001-state-driven-loop-foundation.record.json
- arckit/project/state.record.json
- arckit/cases/active/CASE-20260707-002-implement-arckit-runtime-mvp.md
- arckit/cases/closed/CASE-20260802-005-scope-runtime-todos-to-the-current-executor.md
- arckit/cases/closed/CASE-20260802-006-minimize-runtime-prompts-to-human-intent-and-skill-owned-semanti.md
- arckit/cases/closed/CASE-20260803-001-commit-completed-runtime-work-before-updating-remote-todo.md

## Notes

- This Markdown file is a generated iteration decision brief.
- Iteration State contains macro targets and resolved-Case aggregation only; Case handoff and Loop continuation are not stored here.
- Update the canonical `*.record.json` through the development ledger and render this projection.
