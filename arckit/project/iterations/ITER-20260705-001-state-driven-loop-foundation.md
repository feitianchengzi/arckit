# State-driven loop foundation

Iteration: ITER-20260705-001
Status: active
Updated: 2026-07-26T19:20:08.209Z
Canonical Record: ITER-20260705-001-state-driven-loop-foundation.record.json

## Goal

将 Arckit 状态机制从记录型账本升级为可驱动真实软件项目开发 loop 的项目完整性状态与迭代状态控制面。

## Next State Transition

- Transition: product_behavior: implemented -> designed
- Why: 把项目状态重新定义为全局完整性状态控制面，支持状态驱动 loop。

## Acceptance

- Current state: verified
- Close condition: 当状态机制通过结构校验，并至少经过一次真实复杂项目的 state gap -> case -> verification -> state delta 闭环验证后关闭本迭代。

## Remaining Gaps

- 通过 Electron Desktop Chat 在可联网环境中重跑真实 Codex supervised turn，获得 round_result=done 并通过 gate/write-ledger。

## Recent State Changes

- implementation_coverage: verified -> verified; Arckit Runtime and Desktop now support empty project initialization from first chat/run.
- observability_support: defined -> implemented; Desktop live run observability now shows phase, timeline, plan, output streams and idle state.
- observability_support: implemented -> implemented; Desktop now persists raw run events and renders detailed agent activity sections.
- implementation_coverage: verified -> verified; Desktop runtime now repairs safe old-ledger enum drift before start-run.
- product_behavior: designed -> implemented; Project/Case/Loop separation, unordered Case candidate-gap selection, definition completeness, and equivalent human/Runtime transition semantics are implemented and locally verified.

## Blocking Gaps

- none

## Read For Precision

- ITER-20260705-001-state-driven-loop-foundation.record.json
- arckit/project/state.record.json
- arckit/cases/active/CASE-20260707-002-implement-arckit-runtime-mvp.md
- arckit/cases/closed/CASE-20260726-001-implement-case-driven-definition-completeness-loop.md
- arckit/cases/closed/CASE-20260726-002-govern-state-driven-loop-correctness.md
- arckit/cases/closed/CASE-20260726-003-implement-bounded-case-completion-review-convergence.md

## Notes

- This Markdown file is a generated iteration decision brief.
- Update the canonical `*.record.json` file and render this projection.
