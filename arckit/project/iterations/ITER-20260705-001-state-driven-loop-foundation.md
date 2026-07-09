# State-driven loop foundation

Iteration: ITER-20260705-001
Status: active
Updated: 2026-07-08T10:38:56.763Z
Canonical Record: ITER-20260705-001-state-driven-loop-foundation.record.json

## Goal

将 Arckit 状态机制从记录型账本升级为可驱动真实软件项目开发 loop 的项目完整性状态与迭代状态控制面。

## Next State Transition

- Transition: quality_validation: verified -> accepted
- Why: 完成本轮结构校验，并把真实复杂项目 loop 验证列为下一状态 gap。

## Acceptance

- Current state: verified
- Close condition: 当状态机制通过结构校验，并至少经过一次真实复杂项目的 state gap -> case -> verification -> state delta 闭环验证后关闭本迭代。

## Remaining Gaps

- 通过 Electron Desktop Chat 在可联网环境中重跑真实 Codex supervised turn，获得 round_result=done 并通过 gate/write-ledger。

## Recent State Changes

- user_experience: implemented -> implemented; Desktop Client 从控制面板改为左项目列表、中间连续 Chat、右 Arckit 状态检查器；Chat 空闲时启动 runtime turn，运行中消息转为 steer。
- implementation_coverage: verified -> verified; Arckit Runtime and Desktop now support empty project initialization from first chat/run.
- observability_support: defined -> implemented; Desktop live run observability now shows phase, timeline, plan, output streams and idle state.
- observability_support: implemented -> implemented; Desktop now persists raw run events and renders detailed agent activity sections.
- implementation_coverage: verified -> verified; Desktop runtime now repairs safe old-ledger enum drift before start-run.

## Blocking Gaps

- none

## Read For Precision

- ITER-20260705-001-state-driven-loop-foundation.record.json
- arckit/project/state.record.json
- arckit/cases/active/CASE-20260707-002-implement-arckit-runtime-mvp.md
- arckit/cases/closed/CASE-20260705-003-extract-project-state-record-json.md
- arckit/cases/closed/CASE-20260705-004-refine-generated-state-decision-briefs.md
- arckit/cases/closed/CASE-20260705-005-install-and-demo-validate-arckit-state-loop.md

## Notes

- This Markdown file is a generated iteration decision brief.
- Update the canonical `*.record.json` file and render this projection.
