# State-driven loop foundation

Iteration: ITER-20260705-001
Status: active
Updated: 2026-08-04T14:13:13.493Z
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
- GAP-cross-record-audit: Project、Iteration 和 Case 之间需要严格 schema、durable evidence 和跨记录一致性审计，避免结构合法但语义漂移。

## Accepted Project Changes

- runtime_surfaces: verified -> accepted; Case=arckit/cases/closed/CASE-20260707-002-implement-arckit-runtime-mvp.md; The Desktop-to-runtime-to-app-server-to-ledger surface completed a real bounded transition.
- implementation_coverage: verified -> accepted; Case=arckit/cases/closed/CASE-20260707-002-implement-arckit-runtime-mvp.md; Controller normalization, Worker routing, review intake, steer handling, gate, and deterministic writeback are covered by implementation and passing tests.
- quality_validation: verified -> accepted; Case=arckit/cases/closed/CASE-20260707-002-implement-arckit-runtime-mvp.md; A real Desktop Codex run produced successful steer delivery, gate allow, written ledger transition, and a clean completion review.
- observability_support: verified -> accepted; Case=arckit/cases/closed/CASE-20260707-002-implement-arckit-runtime-mvp.md; The persisted Desktop event stream exposed Controller phases, operator steer, runtime result, gate result, and ledger write result.
- maintainability_handoff: verified -> accepted; Case=arckit/cases/closed/CASE-20260707-002-implement-arckit-runtime-mvp.md; The Case closed with durable tests, opaque run evidence, deterministic ledger transition, and a clean three-dimensional review.

## Blocking Project Gaps

- none

## Read For Precision

- ITER-20260705-001-state-driven-loop-foundation.record.json
- arckit/project/state.record.json
- arckit/cases/closed/CASE-20260707-002-implement-arckit-runtime-mvp.md
- arckit/cases/closed/CASE-20260803-002-support-parallel-case-execution-with-serialized-project-aggregat.md
- arckit/cases/closed/CASE-20260804-001-persist-runtime-sessions-and-execute-state-driven-loops-in-proce.md

## Notes

- This Markdown file is a generated iteration decision brief.
- Iteration State contains macro targets and resolved-Case aggregation only; Case handoff and Loop continuation are not stored here.
- Update the canonical `*.record.json` through the development ledger and render this projection.
