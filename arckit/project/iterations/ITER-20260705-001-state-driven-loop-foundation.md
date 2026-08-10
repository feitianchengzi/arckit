# State-driven loop foundation

Iteration: ITER-20260705-001
Status: active
Updated: 2026-08-09T18:42:34.239Z
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

- observability_support: verified -> accepted; Case=arckit/cases/closed/CASE-20260707-002-implement-arckit-runtime-mvp.md; The persisted Desktop event stream exposed Controller phases, operator steer, runtime result, gate result, and ledger write result.
- maintainability_handoff: verified -> accepted; Case=arckit/cases/closed/CASE-20260707-002-implement-arckit-runtime-mvp.md; The Case closed with durable tests, opaque run evidence, deterministic ledger transition, and a clean three-dimensional review.
- product_behavior: implemented -> verified; Case=arckit/cases/closed/CASE-20260809-002-simplify-arckit-runtime-around-a-coherent-codex-agent-loop.md; The Runtime automation contract is now persisted and locally verified: one coherent Codex Agent turn advances one serial Case gap while Runtime provides readiness, structural gates, trusted ledger writeback, continuation, and compact persistence.
- architecture_foundation: implemented -> verified; Case=arckit/cases/closed/CASE-20260809-002-simplify-arckit-runtime-around-a-coherent-codex-agent-loop.md; The simplified architecture is implemented and locally verified: Codex owns semantic reasoning and native skill/tool use; Runtime is a policy-neutral automation supervisor with a stable task thread, one turn per gap, structural gates, and deterministic ledger boundaries.
- delivery_operation: defined -> verified; Case=arckit/cases/closed/CASE-20260809-002-simplify-arckit-runtime-around-a-coherent-codex-agent-loop.md; The maintained using-arckit v5 source was audited, applied to the Codex application target, loaded through the real compatibility path, and confirmed with clean post-apply drift.

## Blocking Project Gaps

- none

## Read For Precision

- ITER-20260705-001-state-driven-loop-foundation.record.json
- arckit/project/state.record.json
- arckit/cases/closed/CASE-20260809-005-optimize-desktop-conversation-transcript-interaction.md
- arckit/cases/closed/CASE-20260809-006-replace-facet-workflow-with-state-condition-driven-dynamic-gaps.md
- arckit/cases/closed/CASE-20260809-007-remove-legacy-facet-state-protocol-compatibility.md

## Notes

- This Markdown file is a generated iteration decision brief.
- Iteration State contains macro targets and resolved-Case aggregation only; Case handoff and Loop continuation are not stored here.
- Update the canonical `*.record.json` through the development ledger and render this projection.
