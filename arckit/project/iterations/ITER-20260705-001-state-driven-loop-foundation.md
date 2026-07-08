# State-driven loop foundation

Iteration: ITER-20260705-001
Status: active
Updated: 2026-07-08T00:28:46.000Z
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

- quality_validation: verified -> accepted; Runtime ledger writeback accepted GAP-runtime-gate-ledger-writeback: Implemented M2 Gate Engine and controlled ledger writeback for Arckit Runtime.
- quality_validation: verified -> verified; 真实 supervised turn transcript 已保存；steer/interrupt 证据成立，但 done result 因网络限制未产出。
- user_experience: defined -> implemented; 新增 Electron Desktop Client，支持添加本地项目、输入任务、启动 runtime run、观察 events、steer、interrupt、gate 和 ledger writeback。
- runtime_surfaces: verified -> verified; Electron Desktop Client 作为新的本地 runtime surface 已实现并启动，run manager dry-run smoke 通过。
- user_experience: implemented -> implemented; Desktop Client 从控制面板改为左项目列表、中间连续 Chat、右 Arckit 状态检查器；Chat 空闲时启动 runtime turn，运行中消息转为 steer。

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
