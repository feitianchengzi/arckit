# State-driven loop foundation

Iteration: ITER-20260705-001
Status: active
Updated: 2026-08-10T17:18:07.967Z
Canonical Record: ITER-20260705-001-state-driven-loop-foundation.record.json

## Goal

将 Arckit 状态机制升级为由显式 Project 软件定义、独立软件不变量、Case facts/impacts 和动态 Gap 共同驱动的软件项目控制面。

## Targets

- software_decision.technical_foundation: settled -> settled on the v5 software-definition ledger and Runtime contract; The accepted model must replace the old dimension/condition protocol coherently.
- project_gap.GAP-project-state-v5: resolved -> resolved; The new Project/Case/Transition/Iteration contract must be implemented and verified end to end.
- project_gap.GAP-agent-scenario-evaluation: open -> resolved with isolated real-task evidence; Dynamic priority selection must work across different fact and dependency shapes.
- software_invariant.material-risks-have-credible-evidence: active -> upheld by automated and real execution evidence; A protocol control plane requires evidence proportionate to cross-record and runtime risk.

## Accepted Project Changes

- software_decision.runtime_surfaces: The Desktop-to-Runtime-to-Codex-to-ledger surface completed a real bounded transition. (arckit/cases/closed/CASE-20260707-002-implement-arckit-runtime-mvp.md)
- software_decision.product_capabilities: One coherent Agent turn now owns semantic gap execution while Runtime owns supervision and trusted writeback. (arckit/cases/closed/CASE-20260809-002-simplify-arckit-runtime-around-a-coherent-codex-agent-loop.md)
- software_decision.technical_foundation: Facet workflow compatibility was removed before the explicit software-definition v5 redesign. (arckit/cases/closed/CASE-20260809-007-remove-legacy-facet-state-protocol-compatibility.md)
- software_decision.technical_foundation: settled (arckit/cases/active/CASE-20260810-001-implement-explicit-software-definition-project-state.md)
- project_gap.GAP-project-state-v5: resolve (arckit/cases/active/CASE-20260810-001-implement-explicit-software-definition-project-state.md)
- software_decision.experience_and_interaction: settled (arckit/cases/active/CASE-20260810-003-upgrade-project-state-v5-content-evidence.md)
- software_decision.visual_language: settled (arckit/cases/active/CASE-20260810-003-upgrade-project-state-v5-content-evidence.md)
- software_decision.technical_foundation: settled (arckit/cases/active/CASE-20260810-003-upgrade-project-state-v5-content-evidence.md)
- software_decision.observability_and_operation: settled (arckit/cases/active/CASE-20260810-003-upgrade-project-state-v5-content-evidence.md)

## Remaining Project Gaps

- GAP-agent-scenario-evaluation
- GAP-runtime-resilience-and-adapters
- GAP-security-real-project-validation
- GAP-delivery-governance
- GAP-cross-record-audit
