# State-driven loop foundation

Iteration: ITER-20260705-001
Status: active
Updated: 2026-08-11T05:27:56.752Z
Canonical Record: ITER-20260705-001-state-driven-loop-foundation.record.json

## Goal

将 Arckit 状态机制升级为由显式 Project 软件定义、独立软件不变量、Case facts/impacts 和动态 Gap 共同驱动的软件项目控制面。

## Targets

- software_decision.technical_foundation: settled -> settled on the v5 software-definition ledger and Runtime contract; The accepted model must replace the old dimension/condition protocol coherently.
- project_gap.GAP-project-state-v5: resolved -> resolved; The new Project/Case/Transition/Iteration contract must be implemented and verified end to end.
- project_gap.GAP-agent-scenario-evaluation: open -> resolved with isolated real-task evidence; Dynamic priority selection must work across different fact and dependency shapes.
- software_invariant.material-risks-have-credible-evidence: active -> upheld by automated and real execution evidence; A protocol control plane requires evidence proportionate to cross-record and runtime risk.

## Accepted Project Changes

- software_decision.technical_foundation: settled (arckit/cases/active/CASE-20260810-003-upgrade-project-state-v5-content-evidence.md)
- software_decision.observability_and_operation: settled (arckit/cases/active/CASE-20260810-003-upgrade-project-state-v5-content-evidence.md)
- software_decision.technical_foundation: settled (arckit/cases/active/CASE-20260811-002-align-dynamic-gap-loop-and-invariant-semantics.md)
- software_decision.data_and_state: settled (arckit/cases/active/CASE-20260811-002-align-dynamic-gap-loop-and-invariant-semantics.md)
- software_invariant.observable-behavior-has-durable-expectation: sync_core (arckit/cases/active/CASE-20260811-002-align-dynamic-gap-loop-and-invariant-semantics.md)
- software_invariant.changed-interactions-remain-recoverable: sync_core (arckit/cases/active/CASE-20260811-002-align-dynamic-gap-loop-and-invariant-semantics.md)
- software_invariant.changed-visual-language-remains-consistent: sync_core (arckit/cases/active/CASE-20260811-002-align-dynamic-gap-loop-and-invariant-semantics.md)
- software_invariant.changed-contracts-remain-explainable: sync_core (arckit/cases/active/CASE-20260811-002-align-dynamic-gap-loop-and-invariant-semantics.md)
- software_invariant.accepted-facts-are-realized: sync_core (arckit/cases/active/CASE-20260811-002-align-dynamic-gap-loop-and-invariant-semantics.md)
- software_invariant.material-risks-have-credible-evidence: sync_core (arckit/cases/active/CASE-20260811-002-align-dynamic-gap-loop-and-invariant-semantics.md)

## Remaining Project Gaps

- GAP-agent-scenario-evaluation
- GAP-runtime-resilience-and-adapters
- GAP-security-real-project-validation
- GAP-delivery-governance
- GAP-cross-record-audit
